'use strict';
const { spawnSync } = require('node:child_process');

function getLocalConfig(key, cwd = process.cwd()) {
  const result = spawnSync('git', ['config', '--local', key], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  if (result.error) throw new Error(`git not found: ${result.error.message}`);
  return result.status === 0 ? result.stdout.trim() : '';
}

function setLocalConfig(key, value, cwd = process.cwd()) {
  const result = spawnSync('git', ['config', '--local', key, value], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.error) throw new Error(`git not found: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Failed to set git config ${key}: ${result.stderr.trim()}`);
}

function setGlobalConfig(key, value) {
  const result = spawnSync('git', ['config', '--global', key, value], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.error) throw new Error(`git not found: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Failed to set global git config ${key}: ${result.stderr.trim()}`);
}

function isLocalConfigSet(key, cwd = process.cwd()) {
  return getLocalConfig(key, cwd) !== '';
}

module.exports = { getLocalConfig, setLocalConfig, setGlobalConfig, isLocalConfigSet };
