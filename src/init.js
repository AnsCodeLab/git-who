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

// For git config values: keep Windows drive letter (C:/...), just normalize slashes.
// git.exe on Windows resolves "C:/..." but not "/c/..." outside of sh context.
function toGitConfigPath(p) {
  return p.replace(/\\/g, '/');
}

function generateHookScript() {
  const nodePath = toUnixPath(process.execPath);
  const binPath = toUnixPath(path.resolve(__dirname, '..', 'bin.js'));
  return `#!/usr/bin/env sh
# git-who prepare-commit-msg hook — regenerate with: git-who init
# $1 = path to COMMIT_EDITMSG, $2 = commit source (message/template/merge/squash/commit)

PROFILE=$(git config --local gitwho.profile 2>/dev/null)

if [ -n "$PROFILE" ]; then
  REPO_HOOK="$(git rev-parse --git-dir)/hooks/prepare-commit-msg"
  [ -x "$REPO_HOOK" ] && exec "$REPO_HOOK" "$@"
  exit 0
fi

# Skip in CI environments
[ -n "$CI" ] && exit 0
[ -n "$GITHUB_ACTIONS" ] && exit 0

# Save the commit message for auto-replay after git-who use
GIT_DIR="$(git rev-parse --git-dir)"
cp "$1" "$GIT_DIR/git-who-pending-message" 2>/dev/null

"${nodePath}" "${binPath}" _hook
exit 1
`;
}

function writeHook(gitWhoDir = DEFAULT_GIT_WHO_DIR) {
  const hooksDir = path.join(gitWhoDir, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  const hookPath = path.join(hooksDir, 'prepare-commit-msg');
  fs.writeFileSync(hookPath, generateHookScript());
  fs.chmodSync(hookPath, 0o755);
  return hookPath;
}

function install(gitWhoDir = DEFAULT_GIT_WHO_DIR) {
  const hookPath = writeHook(gitWhoDir);
  const hooksDir = path.join(gitWhoDir, 'hooks');
  setGlobalConfig('core.hooksPath', toGitConfigPath(hooksDir));
  return { hookPath: toGitConfigPath(hookPath), hooksDir: toGitConfigPath(hooksDir) };
}

module.exports = { install, writeHook, generateHookScript, toUnixPath, DEFAULT_GIT_WHO_DIR };
