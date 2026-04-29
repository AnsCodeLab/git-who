'use strict';
const chalk   = require('chalk');
const prompts = require('prompts');
const { getProfiles, addProfile, findProfile } = require('./profiles');
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
      addProfile(res.alias, res.name, res.email);
      console.log(chalk.green(`✓ Profile '${res.alias}' saved.`));
      break;
    }

    case 'list': {
      const list = getProfiles();
      if (list.length === 0) {
        console.log('No profiles saved. Run: git-who add');
        break;
      }
      const localEmail = getLocalConfig('user.email');
      const localName  = getLocalConfig('user.name');
      list.forEach(p => {
        const active = p.email === localEmail && p.name === localName;
        const marker = active ? chalk.green('*') : ' ';
        const label  = `${p.alias.padEnd(15)} ${p.name} <${p.email}>`;
        console.log(`  ${marker} ${active ? chalk.green(label) : label}`);
      });
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
      setLocalConfig('user.name',  profile.name);
      setLocalConfig('user.email', profile.email);
      console.log(chalk.green(`✓ Identity set for this repo: ${profile.name} <${profile.email}>`));
      break;
    }

    case '_hook': {
      await runHook();
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
      ].join('\n'));
      if (cmd) process.exit(1);
    }
  }
}

module.exports = { run };
