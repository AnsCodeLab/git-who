'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function tmpFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-who-'));
  return { dir, file: path.join(dir, 'profiles.json') };
}

let profiles;
test('setup', () => { profiles = require('../src/profiles'); });

test('getProfiles returns [] when file missing', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(profiles.getProfiles(file), []);
});

test('addProfile saves a profile', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  profiles.addProfile('work', 'Jane', 'jane@work.com', file);
  const list = profiles.getProfiles(file);
  assert.equal(list.length, 1);
  assert.deepEqual(list[0], { alias: 'work', name: 'Jane', email: 'jane@work.com' });
});

test('addProfile throws on duplicate alias', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  profiles.addProfile('work', 'Jane', 'jane@work.com', file);
  assert.throws(
    () => profiles.addProfile('work', 'Other', 'other@x.com', file),
    /already exists/
  );
});

test('findProfile returns profile by alias', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  profiles.addProfile('personal', 'Jane', 'jane@home.com', file);
  const p = profiles.findProfile('personal', file);
  assert.deepEqual(p, { alias: 'personal', name: 'Jane', email: 'jane@home.com' });
});

test('findProfile returns null for unknown alias', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.equal(profiles.findProfile('ghost', file), null);
});

test('getProfiles returns multiple profiles in order', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  profiles.addProfile('a', 'A', 'a@x.com', file);
  profiles.addProfile('b', 'B', 'b@x.com', file);
  const list = profiles.getProfiles(file);
  assert.equal(list.length, 2);
  assert.equal(list[0].alias, 'a');
  assert.equal(list[1].alias, 'b');
});

test('saveProfiles persists correct JSON structure', (t) => {
  const { dir, file } = tmpFile();
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  profiles.saveProfiles([{ alias: 'x', name: 'X', email: 'x@x.com' }], file);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(Array.isArray(raw.profiles), 'top-level .profiles must be an array');
  assert.equal(raw.profiles[0].alias, 'x');
});
