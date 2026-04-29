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
  assert.ok(script.includes('git config --local user.email'), 'must check local email');
  assert.ok(script.includes('REPO_HOOK'), 'must chain to repo hook');
});

test('writeHook creates an executable pre-commit file', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-init-'));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  const hookPath = init.writeHook(tmpDir);
  assert.ok(fs.existsSync(hookPath), 'hook file must exist');
  assert.equal(path.basename(hookPath), 'pre-commit');
  const mode = fs.statSync(hookPath).mode;
  // On Unix, verify execute bit is set. On Windows, chmod doesn't set Unix perms,
  // but the shell script will still be executable via Git Bash/WSL/etc
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
