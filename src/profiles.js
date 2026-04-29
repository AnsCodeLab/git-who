'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_PROFILES_FILE = path.join(os.homedir(), '.git-who', 'profiles.json');

function getProfiles(profilesFile = DEFAULT_PROFILES_FILE) {
  if (!fs.existsSync(profilesFile)) return [];
  return JSON.parse(fs.readFileSync(profilesFile, 'utf8')).profiles || [];
}

function saveProfiles(profiles, profilesFile = DEFAULT_PROFILES_FILE) {
  fs.mkdirSync(path.dirname(profilesFile), { recursive: true });
  fs.writeFileSync(profilesFile, JSON.stringify({ profiles }, null, 2));
}

function addProfile(alias, name, email, profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);
  if (list.find(p => p.alias === alias)) throw new Error(`Profile '${alias}' already exists`);
  list.push({ alias, name, email });
  saveProfiles(list, profilesFile);
}

function findProfile(alias, profilesFile = DEFAULT_PROFILES_FILE) {
  return getProfiles(profilesFile).find(p => p.alias === alias) || null;
}

module.exports = { getProfiles, saveProfiles, addProfile, findProfile, DEFAULT_PROFILES_FILE };
