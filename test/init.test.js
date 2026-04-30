'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let init;
test('setup', () => { init = require('../src/init'); });

test('generateHookScript returns a sh script invoking _hook', () => {
  const script = init.generateHookScript();
  assert.ok(script.startsWith('#!/usr/bin/env sh'), 'must have sh shebang');
  assert.ok(script.includes('_hook'), 'must invoke _hook command');
  assert.ok(script.includes('gitwho.profile'), 'must check gitwho.profile');
  assert.ok(script.includes('REPO_HOOK'), 'must chain to repo hook');
  assert.ok(script.includes('$CI'), 'must check $CI env var for CI detection');
  assert.ok(script.includes('git-who-pending-message'), 'must save pending message');
  assert.ok(!script.includes('\ncp '), 'must not use cp (not available on all platforms)');
  assert.ok(script.includes('copyFileSync'), 'must use node fs.copyFileSync for cross-platform copy');
  assert.ok(script.includes('prepare-commit-msg'), 'hook comment must name prepare-commit-msg');
});

test('writeHook creates an executable prepare-commit-msg file', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-init-'));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  const hookPath = init.writeHook(tmpDir);
  assert.ok(fs.existsSync(hookPath), 'hook file must exist');
  assert.equal(path.basename(hookPath), 'prepare-commit-msg');
  const mode = fs.statSync(hookPath).mode;
  if (process.platform !== 'win32') {
    assert.ok(mode & 0o111, 'hook must be executable');
  }
});

test('writeHook creates hooks/ subdirectory', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-init-'));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  init.writeHook(tmpDir);
  assert.ok(fs.existsSync(path.join(tmpDir, 'hooks')), 'hooks/ dir must be created');
});

test('toUnixPath converts Windows drive letter paths', () => {
  assert.equal(init.toUnixPath('C:\\Users\\foo\\bar.js'), '/c/Users/foo/bar.js');
  assert.equal(init.toUnixPath('/usr/local/bin/node'), '/usr/local/bin/node');
  assert.equal(init.toUnixPath('D:\\Project\\x.js'), '/d/Project/x.js');
});
