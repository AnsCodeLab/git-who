'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_PROFILES_FILE = path.join(os.homedir(), '.git-who', 'profiles.json');

function getProfiles(profilesFile = DEFAULT_PROFILES_FILE) {
  if (!fs.existsSync(profilesFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(profilesFile, 'utf8')).profiles || [];
  } catch {
    throw new Error(`profiles file is corrupt: ${profilesFile}`);
  }
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

function removeProfile(alias, profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);
  const idx = list.findIndex(p => p.alias === alias);
  if (idx === -1) throw new Error(`Profile '${alias}' not found`);
  list.splice(idx, 1);
  saveProfiles(list, profilesFile);
}

function updateProfile(alias, name, email, profilesFile = DEFAULT_PROFILES_FILE) {
  const list = getProfiles(profilesFile);
  const profile = list.find(p => p.alias === alias);
  if (!profile) throw new Error(`Profile '${alias}' not found`);
  profile.name  = name;
  profile.email = email;
  saveProfiles(list, profilesFile);
}

module.exports = { getProfiles, saveProfiles, addProfile, findProfile, removeProfile, updateProfile, DEFAULT_PROFILES_FILE };
