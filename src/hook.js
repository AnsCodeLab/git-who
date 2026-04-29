'use strict';
const prompts = require('prompts');
const chalk = require('chalk');
const { getProfiles, addProfile, DEFAULT_PROFILES_FILE } = require('./profiles');
const { setLocalConfig } = require('./git');

// Uses numbered text input instead of arrow-key select — works in git hook
// context on Windows where the terminal is not in raw mode.
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
    list.forEach((p, i) => {
      console.log(`  ${chalk.cyan(i + 1 + ')')} [${p.alias}]  ${p.name} <${p.email}>`);
    });
    console.log(`  ${chalk.cyan('n)')} Enter new identity`);
    console.log('');

    const { selection } = await prompts({
      type:    'text',
      name:    'selection',
      message: `Select [1-${list.length}/n]:`
    }, { onCancel: () => process.exit(1) });

    if (selection === undefined) process.exit(1);

    if (selection === 'n' || selection === 'N') {
      const res = await prompts([
        { type: 'text', name: 'name',   message: 'Name:'  },
        { type: 'text', name: 'email',  message: 'Email:' },
        { type: 'text', name: 'saveAs', message: 'Save as profile alias (leave blank to skip):' }
      ], { onCancel: () => process.exit(1) });
      name  = res.name;
      email = res.email;
      if (res.saveAs) addProfile(res.saveAs, name, email, profilesFile);
    } else {
      const idx = parseInt(selection, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= list.length) {
        console.error(chalk.red(`✖  Invalid selection. Enter a number between 1 and ${list.length}, or n.`));
        process.exit(1);
      }
      name  = list[idx].name;
      email = list[idx].email;
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
