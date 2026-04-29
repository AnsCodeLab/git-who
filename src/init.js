'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { setGlobalConfig } = require('./git');

const DEFAULT_GIT_WHO_DIR = path.join(os.homedir(), '.git-who');

function toUnixPath(p) {
  return p
    .replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`)
    .replace(/\\/g, '/');
}

function generateHookScript() {
  const nodePath = toUnixPath(process.execPath);
  const binPath = toUnixPath(path.resolve(__dirname, '..', 'bin.js'));
  return `#!/usr/bin/env sh
# git-who pre-commit hook — regenerate with: git-who init

LOCAL_EMAIL=$(git config --local user.email 2>/dev/null)
LOCAL_NAME=$(git config --local user.name 2>/dev/null)

if [ -n "$LOCAL_EMAIL" ] && [ -n "$LOCAL_NAME" ]; then
  REPO_HOOK="$(git rev-parse --git-dir)/hooks/pre-commit"
  [ -x "$REPO_HOOK" ] && exec "$REPO_HOOK"
  exit 0
fi

# Skip in CI environments
[ -n "$CI" ] && exit 0
[ -n "$GITHUB_ACTIONS" ] && exit 0
[ -t 1 ] || exit 0

"${nodePath}" "${binPath}" _hook
STATUS=$?
[ "$STATUS" -ne 0 ] && exit "$STATUS"

REPO_HOOK="$(git rev-parse --git-dir)/hooks/pre-commit"
[ -x "$REPO_HOOK" ] && exec "$REPO_HOOK"
exit 0
`;
}

function writeHook(gitWhoDir = DEFAULT_GIT_WHO_DIR) {
  const hooksDir = path.join(gitWhoDir, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  const hookPath = path.join(hooksDir, 'pre-commit');
  fs.writeFileSync(hookPath, generateHookScript());
  fs.chmodSync(hookPath, 0o755);
  return hookPath;
}

function install(gitWhoDir = DEFAULT_GIT_WHO_DIR) {
  const hookPath = writeHook(gitWhoDir);
  const hooksDir = path.join(gitWhoDir, 'hooks');
  setGlobalConfig('core.hooksPath', toUnixPath(hooksDir));
  return { hookPath: toUnixPath(hookPath), hooksDir: toUnixPath(hooksDir) };
}

module.exports = { install, writeHook, generateHookScript, toUnixPath, DEFAULT_GIT_WHO_DIR };
