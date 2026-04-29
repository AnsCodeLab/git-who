'use strict';
const chalk   = require('chalk');
const prompts = require('prompts');
const { getProfiles, addProfile, findProfile, removeProfile, updateProfile } = require('./profiles');
const { getLocalConfig, setLocalConfig }        = require('./git');
const { install }                               = require('./init');
const { runHook }                               = require('./hook');

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

      // Always show this repo's stored profile first if one is set
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
        console.log(chalk.gray('No profile set for this repo. Run: git-who use <alias>'));
      }
      break;
    }

    case 'use': {
      const alias = args[0];
      if (!alias) {
        console.error('Usage: git-who use <alias>');
        process.exit(1);
      }
      const profile = findProfile(alias);
      if (!profile) {
        console.error(`Profile '${alias}' not found. Run: git-who list`);
        process.exit(1);
      }
      setLocalConfig('user.name',    profile.name);
      setLocalConfig('user.email',   profile.email);
      setLocalConfig('gitwho.profile', alias);
      console.log(chalk.green(`✓ Identity set for this repo: [${alias}] ${profile.name} <${profile.email}>`));
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

    case '_hook': {
      runHook();
      break;
    }

    default: {
      console.log([
        'Usage: git-who <command>',
        '',
        'Commands:',
        '  init              Install global pre-commit hook',
        '  add               Add a new identity profile',
        '  list              List saved profiles',
        '  use <alias>       Set identity for current repo',
        '  update <alias>    Update name/email of a profile',
        '  remove <alias>    Remove a profile',
      ].join('\n'));
      if (cmd) process.exit(1);
    }
  }
}

module.exports = { run };
