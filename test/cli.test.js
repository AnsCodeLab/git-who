'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function makeTmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-cli-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config --local user.name "CI"', { cwd: dir, stdio: 'ignore' });
  execSync('git config --local user.email "ci@test.com"', { cwd: dir, stdio: 'ignore' });
  return dir;
}

test('whoami: gitwho.profile, user.name, user.email are readable via getLocalConfig', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  execSync('git config --local gitwho.profile work', { cwd: dir, stdio: 'ignore' });
  execSync('git config --local user.name "Jane"', { cwd: dir, stdio: 'ignore' });
  execSync('git config --local user.email "jane@work.com"', { cwd: dir, stdio: 'ignore' });
  const { getLocalConfig } = require('../src/git');
  assert.equal(getLocalConfig('gitwho.profile', dir), 'work');
  assert.equal(getLocalConfig('user.name', dir), 'Jane');
  assert.equal(getLocalConfig('user.email', dir), 'jane@work.com');
});

test('whoami: no profile returns empty gitwho.profile', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const { getLocalConfig } = require('../src/git');
  assert.equal(getLocalConfig('gitwho.profile', dir), '');
});

test('unset: removes gitwho section, user.name, user.email', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  execSync('git config --local gitwho.profile personal', { cwd: dir, stdio: 'ignore' });
  const { unsetLocalConfig, unsetLocalConfigSection, getLocalConfig } = require('../src/git');
  unsetLocalConfigSection('gitwho', dir);
  unsetLocalConfig('user.name', dir);
  unsetLocalConfig('user.email', dir);
  assert.equal(getLocalConfig('gitwho.profile', dir), '');
  assert.equal(getLocalConfig('user.name', dir), '');
  assert.equal(getLocalConfig('user.email', dir), '');
});

test('getPendingCommitMessage reads .git/git-who-pending-message', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const gitDir = path.join(dir, '.git');
  const pendingFile = path.join(gitDir, 'git-who-pending-message');
  fs.writeFileSync(pendingFile, 'fix login bug\n');
  const { getPendingCommitMessage, clearPendingCommit } = require('../src/replay');
  assert.equal(getPendingCommitMessage(dir), 'fix login bug');
  clearPendingCommit(dir);
  assert.ok(!fs.existsSync(pendingFile));
});

test('getPendingCommitMessage returns null when no pending file', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const { getPendingCommitMessage } = require('../src/replay');
  assert.equal(getPendingCommitMessage(dir), null);
});
