'use strict';
const chalk   = require('chalk');
const prompts = require('prompts');
const { getProfiles, addProfile, findProfile, removeProfile, updateProfile } = require('./profiles');
const { getLocalConfig, setLocalConfig, unsetLocalConfig, unsetLocalConfigSection } = require('./git');
const { install }                               = require('./init');
const { runHook }                               = require('./hook');
const { getPendingCommitMessage, replayCommit, clearPendingCommit } = require('./replay');

function checkInit() {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync('git', ['config', '--global', 'core.hooksPath'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const hooksPath = result.status === 0 ? result.stdout.trim() : '';
  const hookFile = hooksPath
    ? require('node:path').join(hooksPath, 'prepare-commit-msg')
    : '';
  if (!hookFile || !require('node:fs').existsSync(hookFile)) {
    console.log(chalk.yellow('⚠  Hook not installed. Run: git-who init'));
  }
}

async function afterUse(alias, name, email) {
  setLocalConfig('user.name',      name);
  setLocalConfig('user.email',     email);
  setLocalConfig('gitwho.profile', alias);
  console.log(chalk.green(`✓ Identity set: [${alias}] ${name} <${email}>`));

  const pending = getPendingCommitMessage();
  if (pending) {
    console.log('');
    console.log(chalk.gray(`  Replaying saved commit: "${pending}"`));
    const ok = replayCommit(pending);
    if (!ok) {
      console.error(chalk.red('✖  Commit replay failed. Run git commit manually.'));
    }
  }
}

async function run(argv) {
  const [cmd, ...args] = argv;

  switch (cmd) {

    case 'init': {
      const { hookPath, hooksDir } = install();
      console.log(chalk.green(`✓ Hook installed at ${hookPath}`));
      console.log(chalk.green(`✓ Set git config --global core.hooksPath to ${hooksDir}`));
      break;
    }

    case 'add': {
      checkInit();
      const res = await prompts([
        { type: 'text', name: 'alias', message: 'Alias:' },
        { type: 'text', name: 'name',  message: 'Name:'  },
        { type: 'text', name: 'email', message: 'Email:' }
      ], { onCancel: () => process.exit(1) });
      if (!res.alias || !res.name || !res.email) {
        console.error(chalk.red('✖  All fields are required.'));
        process.exit(1);
      }
      addProfile(res.alias, res.name, res.email);
      console.log(chalk.green(`✓ Profile '${res.alias}' saved.`));
      break;
    }

    case 'list': {
      const activeAlias = getLocalConfig('gitwho.profile');
      const localName   = getLocalConfig('user.name');
      const localEmail  = getLocalConfig('user.email');

      if (activeAlias) {
        const repoLine = localName
          ? `[${activeAlias}]  ${localName} <${localEmail}>`
          : `[${activeAlias}]`;
        console.log(chalk.bold('This repo:') + '  ' + chalk.green(repoLine));
        console.log('');
      }

      const list = getProfiles();
      if (list.length === 0) {
        console.log('No saved profiles. Run: git-who add');
      } else {
        console.log(chalk.bold('Saved profiles:'));
        list.forEach(p => {
          const active = p.alias === activeAlias;
          const marker = active ? chalk.green('*') : ' ';
          const label  = `${p.alias.padEnd(15)} ${p.name} <${p.email}>`;
          console.log(`  ${marker} ${active ? chalk.green(label) : label}`);
        });
      }

      if (!activeAlias) {
        console.log('');
        console.log(chalk.gray('No profile set for this repo. Run: git-who use'));
      }
      break;
    }

    case 'whoami': {
      const alias = getLocalConfig('gitwho.profile');
      const name  = getLocalConfig('user.name');
      const email = getLocalConfig('user.email');
      if (alias) {
        console.log(chalk.green(`[${alias}]`) + `  ${name} <${email}>`);
      } else {
        console.log(chalk.gray('No profile set for this repo. Run: git-who use'));
      }
      break;
    }

    case 'use': {
      checkInit();
      const alias = args[0];

      if (!alias) {
        // Interactive picker
        const list = getProfiles();
        if (list.length === 0) {
          console.log('No profiles saved. Run: git-who add');
          process.exit(1);
        }
        const choices = list.map(p => ({
          title: `${p.alias.padEnd(15)} ${p.name} <${p.email}>`,
          value: p
        }));
        choices.push({ title: chalk.gray('+ Add new profile'), value: '__add__' });

        const { choice } = await prompts({
          type:    'select',
          name:    'choice',
          message: 'Which profile for this repo?',
          choices
        }, { onCancel: () => process.exit(1) });

        if (choice === undefined) process.exit(1);

        if (choice === '__add__') {
          const res = await prompts([
            { type: 'text', name: 'alias', message: 'Alias:' },
            { type: 'text', name: 'name',  message: 'Name:'  },
            { type: 'text', name: 'email', message: 'Email:' }
          ], { onCancel: () => process.exit(1) });
          if (!res.alias || !res.name || !res.email) {
            console.error(chalk.red('✖  All fields are required.'));
            process.exit(1);
          }
          addProfile(res.alias, res.name, res.email);
          await afterUse(res.alias, res.name, res.email);
        } else {
          await afterUse(choice.alias, choice.name, choice.email);
        }
      } else {
        // Direct alias
        const profile = findProfile(alias);
        if (!profile) {
          console.error(chalk.red(`✖  Profile '${alias}' not found. Run: git-who list`));
          process.exit(1);
        }
        await afterUse(alias, profile.name, profile.email);
      }
      break;
    }

    case 'unset': {
      unsetLocalConfigSection('gitwho');
      unsetLocalConfig('user.name');
      unsetLocalConfig('user.email');
      clearPendingCommit();
      console.log(chalk.green('✓ Profile cleared for this repo.'));
      break;
    }

    case 'update': {
      const alias = args[0];
      if (!alias) {
        console.error('Usage: git-who update <alias>');
        process.exit(1);
      }
      const existing = findProfile(alias);
      if (!existing) {
        console.error(chalk.red(`✖  Profile '${alias}' not found. Run: git-who list`));
        process.exit(1);
      }
      const res = await prompts([
        { type: 'text', name: 'name',  message: 'Name:',  initial: existing.name  },
        { type: 'text', name: 'email', message: 'Email:', initial: existing.email }
      ], { onCancel: () => process.exit(1) });
      if (!res.name || !res.email) {
        console.error(chalk.red('✖  Name and email are required.'));
        process.exit(1);
      }
      updateProfile(alias, res.name, res.email);
      console.log(chalk.green(`✓ Profile '${alias}' updated.`));
      break;
    }

    case 'remove': {
      const alias = args[0];
      if (!alias) {
        console.error('Usage: git-who remove <alias>');
        process.exit(1);
      }
      try {
        removeProfile(alias);
        console.log(chalk.green(`✓ Profile '${alias}' removed.`));
      } catch (err) {
        console.error(chalk.red(`✖  ${err.message}`));
        process.exit(1);
      }
      break;
    }

    case '_hook': {
      runHook();
      break;
    }

    default: {
      console.log([
        'git-who — commit as the right person, every time.',
        '',
        chalk.bold('Getting started:'),
        '  1. git-who init        install the global hook (run once)',
        '  2. git-who add         save a profile (name + email)',
        '  3. git commit ...      hook guides you from there',
        '',
        chalk.bold('Commands:'),
        '  init              Install global hook',
        '  add               Save a new identity profile',
        '  list              List profiles and this repo\'s identity',
        '  use [alias]       Set profile for this repo (interactive if no alias)',
        '  whoami            Show this repo\'s current identity',
        '  update <alias>    Update a profile\'s name or email',
        '  remove <alias>    Remove a saved profile',
        '  unset             Clear this repo\'s identity',
      ].join('\n'));
      if (cmd) process.exit(1);
    }
  }
}

module.exports = { run };
