'use strict';
const { spawnSync } = require('node:child_process');

function getLocalConfig(key, cwd = process.cwd()) {
  const result = spawnSync('git', ['config', '--local', key], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

function setLocalConfig(key, value, cwd = process.cwd()) {
  const result = spawnSync('git', ['config', '--local', key, value], { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Failed to set git config ${key}`);
}

function setGlobalConfig(key, value) {
  const result = spawnSync('git', ['config', '--global', key, value], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Failed to set global git config ${key}`);
}

function isLocalConfigSet(key, cwd = process.cwd()) {
  return getLocalConfig(key, cwd) !== '';
}

module.exports = { getLocalConfig, setLocalConfig, setGlobalConfig, isLocalConfigSet };
