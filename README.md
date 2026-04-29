# git-who

Prompts for the right git identity before your first commit in a repo.

Never accidentally commit as the wrong author when juggling multiple clients or organizations.

## Install

```bash
npm install -g git-who
```

Then run once to install the global hook:

```bash
git-who init
```

## Usage

```
git-who <command>

Commands:
  init              Install global pre-commit hook
  add               Add a new identity profile
  list              List saved profiles
  use <alias>       Set identity for current repo
```

### How it works

After `git-who init`, a global pre-commit hook is installed. The first time you commit in any repo without a local `user.email` set, you'll see:

```
⚠  No git identity set for this repo.

❯ [personal]  Your Name <you@personal.com>
  [client-a]  Your Name <you@clienta.com>
  Enter new identity
```

Select a profile and the commit proceeds. Subsequent commits in the same repo are not interrupted.

### Commands

**`git-who init`** — Install the global pre-commit hook. Run once after installing.

**`git-who add`** — Add a named identity profile.

**`git-who list`** — List all profiles. Marks the active profile for the current repo with `*`.

**`git-who use <alias>`** — Set the identity for the current repo immediately (without waiting for a commit).

## Requirements

- Node.js 18+
- Git Bash on Windows (PowerShell is not supported)
- Git 2.9+ (for `core.hooksPath`)

## How git-who init works

`git-who init` sets `core.hooksPath` globally:

```bash
git config --global core.hooksPath ~/.git-who/hooks
```

The hook checks for a local git identity before every commit. If one is already set, it exits immediately with no overhead. If not, it prompts you to select or create a profile.

The hook also chains to any repo-level `pre-commit` hook (husky, lint-staged, etc.), so existing hooks continue to work.

## Profiles

Profiles are stored in `~/.git-who/profiles.json`:

```json
{
  "profiles": [
    { "alias": "personal", "name": "Your Name", "email": "you@personal.com" },
    { "alias": "client-a", "name": "Your Name", "email": "you@clienta.com" }
  ]
}
```

You can edit this file directly.
