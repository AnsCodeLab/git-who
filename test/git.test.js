'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function makeTmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-repo-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config --local user.name "CI"', { cwd: dir, stdio: 'ignore' });
  return dir;
}

let git;
test('setup', () => { git = require('../src/git'); });

test('getLocalConfig returns empty string when not set', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.equal(git.getLocalConfig('user.email', dir), '');
});

test('setLocalConfig then getLocalConfig roundtrips value', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  git.setLocalConfig('user.email', 'test@example.com', dir);
  assert.equal(git.getLocalConfig('user.email', dir), 'test@example.com');
});

test('isLocalConfigSet returns false when not set', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.equal(git.isLocalConfigSet('user.email', dir), false);
});

test('isLocalConfigSet returns true after setLocalConfig', (t) => {
  const dir = makeTmpRepo();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  git.setLocalConfig('user.email', 'test@example.com', dir);
  assert.equal(git.isLocalConfigSet('user.email', dir), true);
});

test('setGlobalConfig sets valid config key', () => {
  const testKey = 'gitwho.test.critical.fix';
  git.setGlobalConfig(testKey, 'testvalue');
  const result = execSync(`git config --global ${testKey}`, { encoding: 'utf8' }).trim();
  assert.equal(result, 'testvalue');
  execSync(`git config --global --unset ${testKey}`, { stdio: 'ignore' });
});
