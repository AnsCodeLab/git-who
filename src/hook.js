'use strict';
const fs = require('node:fs');
const chalk = require('chalk');
const { getProfiles, addProfile, DEFAULT_PROFILES_FILE } = require('./profiles');
const { setLocalConfig } = require('./git');

// Reads one line from the terminal, bypassing git's stdin redirection.
// Uses synchronous file I/O so the process blocks until the user presses Enter.
// On Windows: CONIN$ is the Windows console input device.
// On Unix: /dev/tty is the controlling terminal.
function ask(question) {
  process.stdout.write(question);
  const device = process.platform === 'win32' ? 'CONIN$' : '/dev/tty';
  let fd;
  try {
    fd = fs.openSync(device, 'r');
  } catch {
    process.exit(1);
  }
  // Read up to 1024 bytes (enough for any name/email)
  const buf = Buffer.alloc(1024);
  let total = 0;
  // Read byte by byte until newline or buffer full
  const one = Buffer.alloc(1);
  while (total < buf.length) {
    const n = fs.readSync(fd, one, 0, 1);
    if (n === 0) break;
    if (one[0] === 0x0a) break; // LF
    if (one[0] !== 0x0d) { buf[total++] = one[0]; } // skip CR
  }
  fs.closeSync(fd);
  return buf.slice(0, total).toString('utf8').trim();
}

function runHook(profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);

  console.log('');
  console.log(chalk.yellow('⚠  No git identity set for this repo.'));
  console.log('');

  let name, email;

  if (list.length === 0) {
    name   = ask('Name:  ');
    email  = ask('Email: ');
    const saveAs = ask('Save as profile alias (leave blank to skip): ');
    if (saveAs) addProfile(saveAs, name, email, profilesFile);
  } else {
    list.forEach((p, i) => {
      console.log(`  ${chalk.cyan(String(i + 1) + ')')} [${p.alias}]  ${p.name} <${p.email}>`);
    });
    console.log(`  ${chalk.cyan('n)')} Enter new identity`);
    console.log('');

    const selection = ask(`Select [1-${list.length}/n]: `);

    if (!selection) process.exit(1);

    if (selection === 'n' || selection === 'N') {
      name   = ask('Name:  ');
      email  = ask('Email: ');
      const saveAs = ask('Save as profile alias (leave blank to skip): ');
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
