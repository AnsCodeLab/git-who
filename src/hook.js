'use strict';
const chalk = require('chalk');
const { getProfiles, DEFAULT_PROFILES_FILE } = require('./profiles');

function runHook(profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);

  console.error('');
  console.error(chalk.yellow('⚠  No profile set for this repo.'));

  if (list.length === 0) {
    console.error('');
    console.error('  No profiles saved yet. Run:');
    console.error('');
    console.error(chalk.cyan('    git-who add') + chalk.gray('    save a new profile'));
    console.error(chalk.cyan('    git-who use') + chalk.gray('    set profile (your commit will replay automatically)'));
  } else {
    console.error(chalk.gray('   Your commit has been saved — run:'));
    console.error('');
    list.forEach(p => {
      console.error(chalk.cyan(`    git-who use ${p.alias}`) + chalk.gray(`   # ${p.name} <${p.email}>`));
    });
    console.error(chalk.cyan('    git-who use') + chalk.gray('              # interactive picker'));
  }

  console.error('');
}

module.exports = { runHook };
