'use strict';
const prompts = require('prompts');
const chalk = require('chalk');
const { getProfiles, addProfile, DEFAULT_PROFILES_FILE } = require('./profiles');
const { setLocalConfig } = require('./git');

async function runHook(profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);

  console.log('');
  console.log(chalk.yellow('⚠  No git identity set for this repo.'));
  console.log('');

  let name, email;

  if (list.length === 0) {
    const res = await prompts([
      { type: 'text', name: 'name',   message: 'Name:'  },
      { type: 'text', name: 'email',  message: 'Email:' },
      { type: 'text', name: 'saveAs', message: 'Save as profile alias (leave blank to skip):' }
    ], { onCancel: () => process.exit(1) });
    name  = res.name;
    email = res.email;
    if (res.saveAs) addProfile(res.saveAs, name, email, profilesFile);
  } else {
    const choices = list.map(p => ({
      title: `[${p.alias}]  ${p.name} <${p.email}>`,
      value: p
    }));
    choices.push({ title: 'Enter new identity', value: '__new__' });

    const { choice } = await prompts({
      type:    'select',
      name:    'choice',
      message: 'Select a git identity for this repo:',
      choices
    }, { onCancel: () => process.exit(1) });

    if (choice === undefined) process.exit(1);

    if (choice === '__new__') {
      const res = await prompts([
        { type: 'text', name: 'name',   message: 'Name:'  },
        { type: 'text', name: 'email',  message: 'Email:' },
        { type: 'text', name: 'saveAs', message: 'Save as profile alias (leave blank to skip):' }
      ], { onCancel: () => process.exit(1) });
      name  = res.name;
      email = res.email;
      if (res.saveAs) addProfile(res.saveAs, name, email, profilesFile);
    } else {
      name  = choice.name;
      email = choice.email;
    }
  }

  if (!name || !email) {
    console.error(chalk.red('✖  Name and email are required. Commit aborted.'));
    process.exit(1);
  }

  setLocalConfig('user.name',  name);
  setLocalConfig('user.email', email);
  console.log('');
  console.log(chalk.green(`✓ Identity set: ${name} <${email}>`));
  console.log('');
}

module.exports = { runHook };
