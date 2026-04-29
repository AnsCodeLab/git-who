'use strict';
const readline = require('node:readline');
const fs = require('node:fs');
const chalk = require('chalk');
const { getProfiles, addProfile, DEFAULT_PROFILES_FILE } = require('./profiles');
const { setLocalConfig } = require('./git');

// Opens the terminal directly, bypassing git's stdin redirection.
// On Windows: CONIN$ is the Windows console input device.
// On Unix: /dev/tty is the controlling terminal.
function openTerminal() {
  const device = process.platform === 'win32' ? 'CONIN$' : '/dev/tty';
  try {
    const fd = fs.openSync(device, 'r');
    return fs.createReadStream(null, { fd, autoClose: true });
  } catch {
    return process.stdin;
  }
}

function ask(question, terminalStream) {
  return new Promise(resolve => {
    process.stdout.write(question);
    const rl = readline.createInterface({ input: terminalStream, terminal: false });
    rl.once('line', line => { rl.close(); resolve(line.trim()); });
    rl.once('close', () => resolve(''));
  });
}

async function runHook(profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);
  const term = openTerminal();

  console.log('');
  console.log(chalk.yellow('⚠  No git identity set for this repo.'));
  console.log('');

  let name, email;

  if (list.length === 0) {
    name   = await ask('Name:  ', term);
    email  = await ask('Email: ', term);
    const saveAs = await ask('Save as profile alias (leave blank to skip): ', term);
    if (saveAs) addProfile(saveAs, name, email, profilesFile);
  } else {
    list.forEach((p, i) => {
      console.log(`  ${chalk.cyan(String(i + 1) + ')')} [${p.alias}]  ${p.name} <${p.email}>`);
    });
    console.log(`  ${chalk.cyan('n)')} Enter new identity`);
    console.log('');

    const selection = await ask(`Select [1-${list.length}/n]: `, term);

    if (!selection) process.exit(1);

    if (selection === 'n' || selection === 'N') {
      name   = await ask('Name:  ', term);
      email  = await ask('Email: ', term);
      const saveAs = await ask('Save as profile alias (leave blank to skip): ', term);
      if (saveAs) addProfile(saveAs, name, email, profilesFile);
    } else {
      const idx = parseInt(selection, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= list.length) {
        console.error(chalk.red(`✖  Invalid selection. Enter 1-${list.length} or n.`));
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
