'use strict';
const fs = require('node:fs');
const chalk = require('chalk');
const { getProfiles, DEFAULT_PROFILES_FILE } = require('./profiles');
const { getLocalConfig } = require('./git');

// The hook does NOT prompt interactively — git hook subprocesses have no
// reliable console I/O on Windows. Instead, it prints a clear message with
// the exact command to run, then exits 1 to block the commit.
// The user runs `git-who use <alias>` in their terminal and retries.
function runHook(profilesFile = DEFAULT_PROFILES_FILE) {
  console.error('');
  console.error(chalk.yellow('⚠  No git identity set for this repo.'));
  console.error('');

  const list = getProfiles(profilesFile);

  if (list.length === 0) {
    console.error('  No profiles saved yet. Run:');
    console.error('');
    console.error(chalk.cyan('    git-who add'));
    console.error('');
    console.error('  Then retry your commit.');
  } else {
    console.error('  Run one of the following, then retry your commit:');
    console.error('');
    list.forEach(p => {
      console.error(chalk.cyan(`    git-who use ${p.alias}`) + chalk.gray(`   # ${p.name} <${p.email}>`));
    });
    console.error(chalk.cyan('    git-who add') + chalk.gray('              # add a new profile'));
  }

  console.error('');
  process.exit(1);
}

module.exports = { runHook };
