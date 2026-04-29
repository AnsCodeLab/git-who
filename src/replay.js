'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function getGitDir(cwd = process.cwd()) {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  if (result.status !== 0) return null;
  const rel = result.stdout.trim();
  return path.resolve(cwd, rel);
}

function getPendingCommitMessage(cwd = process.cwd()) {
  const gitDir = getGitDir(cwd);
  if (!gitDir) return null;
  const pendingFile = path.join(gitDir, 'git-who-pending-message');
  if (!fs.existsSync(pendingFile)) return null;
  const text = fs.readFileSync(pendingFile, 'utf8')
    .split('\n')
    .filter(l => !l.startsWith('#'))
    .join('\n')
    .trim();
  return text || null;
}

function clearPendingCommit(cwd = process.cwd()) {
  const gitDir = getGitDir(cwd);
  if (!gitDir) return;
  const pendingFile = path.join(gitDir, 'git-who-pending-message');
  try { fs.unlinkSync(pendingFile); } catch { /* already gone */ }
}

function replayCommit(message, cwd = process.cwd()) {
  const result = spawnSync('git', ['commit', '-m', message], {
    cwd,
    stdio: 'inherit'
  });
  if (result.status === 0) {
    clearPendingCommit(cwd);
  }
  return result.status === 0;
}

module.exports = { getPendingCommitMessage, clearPendingCommit, replayCommit };
