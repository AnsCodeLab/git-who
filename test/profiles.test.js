'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function tmpFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-'));
  return { dir, file: path.join(dir, 'profiles.json') };
}

// Lazy require so tests run after src/ exists
let profiles;
test('setup', () => { profiles = require('../src/profiles'); });

test('getProfiles returns [] when file missing', () => {
  const { file } = tmpFile();
  assert.deepEqual(profiles.getProfiles(file), []);
});

test('addProfile saves a profile', () => {
  const { file } = tmpFile();
  profiles.addProfile('work', 'Jane', 'jane@work.com', file);
  const list = profiles.getProfiles(file);
  assert.equal(list.length, 1);
  assert.deepEqual(list[0], { alias: 'work', name: 'Jane', email: 'jane@work.com' });
});

test('addProfile throws on duplicate alias', () => {
  const { file } = tmpFile();
  profiles.addProfile('work', 'Jane', 'jane@work.com', file);
  assert.throws(
    () => profiles.addProfile('work', 'Other', 'other@x.com', file),
    /already exists/
  );
});

test('findProfile returns profile by alias', () => {
  const { file } = tmpFile();
  profiles.addProfile('personal', 'Jane', 'jane@home.com', file);
  const p = profiles.findProfile('personal', file);
  assert.deepEqual(p, { alias: 'personal', name: 'Jane', email: 'jane@home.com' });
});

test('findProfile returns null for unknown alias', () => {
  const { file } = tmpFile();
  assert.equal(profiles.findProfile('ghost', file), null);
});

test('getProfiles returns multiple profiles in order', () => {
  const { file } = tmpFile();
  profiles.addProfile('a', 'A', 'a@x.com', file);
  profiles.addProfile('b', 'B', 'b@x.com', file);
  const list = profiles.getProfiles(file);
  assert.equal(list.length, 2);
  assert.equal(list[0].alias, 'a');
  assert.equal(list[1].alias, 'b');
});

test('saveProfiles persists correct JSON structure', () => {
  const { dir, file } = tmpFile();
  profiles.saveProfiles([{ alias: 'x', name: 'X', email: 'x@x.com' }], file);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(Array.isArray(raw.profiles), 'top-level .profiles must be an array');
  assert.equal(raw.profiles[0].alias, 'x');
  fs.rmSync(dir, { recursive: true });
});
