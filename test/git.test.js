'use strict';
const { test } = require('node:test');
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

test('getLocalConfig returns empty string when not set', () => {
  const dir = makeTmpRepo();
  assert.equal(git.getLocalConfig('user.email', dir), '');
  fs.rmSync(dir, { recursive: true });
});

test('setLocalConfig then getLocalConfig roundtrips value', () => {
  const dir = makeTmpRepo();
  git.setLocalConfig('user.email', 'test@example.com', dir);
  assert.equal(git.getLocalConfig('user.email', dir), 'test@example.com');
  fs.rmSync(dir, { recursive: true });
});

test('isLocalConfigSet returns false when not set', () => {
  const dir = makeTmpRepo();
  assert.equal(git.isLocalConfigSet('user.email', dir), false);
  fs.rmSync(dir, { recursive: true });
});

test('isLocalConfigSet returns true after setLocalConfig', () => {
  const dir = makeTmpRepo();
  git.setLocalConfig('user.email', 'test@example.com', dir);
  assert.equal(git.isLocalConfigSet('user.email', dir), true);
  fs.rmSync(dir, { recursive: true });
});
