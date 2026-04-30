# gitwho

Commit as the right person, every time. Never accidentally commit as the wrong author when juggling multiple clients or organizations.

## Install

```bash
npm install -g @anscodelab/gitwho@latest
```

Then run once to install the global hook:

```bash
gitwho init
```

## How it works

`gitwho init` installs a global `prepare-commit-msg` hook via `git config --global core.hooksPath`. The hook fires on every commit in every repo.

**First commit in a new repo** — the hook blocks and shows which command to run:

```
⚠  No profile set for this repo.
   Your commit has been saved — run:

    gitwho use personal   # An Nguyen <you@personal.com>
    gitwho use            # interactive picker
```

**Run `gitwho use`** — picks a profile and automatically replays your saved commit:

```
$ gitwho use

  ❯ personal   An Nguyen <you@personal.com>
    client-a   An Nguyen <you@clienta.com>

✓ Identity set: [personal] An Nguyen <you@personal.com>

  Replaying saved commit: "fix login bug"
✓ [master a1b2c3] fix login bug
```

**All subsequent commits** in the same repo pass through instantly — no interruption.

The hook also chains to any existing `prepare-commit-msg` hook in the repo (husky, commitlint, etc.) so existing tooling keeps working.

## Commands

```
gitwho <command>

Getting started:
  1. gitwho init        install the global hook (run once)
  2. gitwho add         save a profile (name + email)
  3. git commit ...      hook guides you from there

Commands:
  init              Install global hook
  add               Save a new identity profile
  list              List profiles and this repo's identity
  use [alias]       Set profile for this repo (interactive if no alias)
  whoami            Show this repo's current identity
  update <alias>    Update a profile's name or email
  remove <alias>    Remove a saved profile
  unset             Clear this repo's identity
```

### `gitwho init`
Installs the global hook. Run once after installing.

### `gitwho add`
Interactive — prompts for alias, name, email:
```
$ gitwho add
Alias:  personal
Name:   An Nguyen
Email:  you@personal.com
✓ Profile 'personal' saved.
```

### `gitwho list`
Shows saved profiles and this repo's active identity:
```
This repo:  [personal]  An Nguyen <you@personal.com>

Saved profiles:
  * personal        An Nguyen <you@personal.com>
    client-a        An Nguyen <you@clienta.com>
```

### `gitwho use [alias]`
With an alias: sets identity immediately and replays any saved commit.
Without an alias: shows an interactive picker.

### `gitwho whoami`
Quick status for the current repo:
```
[personal]  An Nguyen <you@personal.com>
```

### `gitwho unset`
Clears this repo's identity. Next commit will be blocked again until you run `gitwho use`.

## Profiles

Saved in `~/.git-who/profiles.json`:
```json
{
  "profiles": [
    { "alias": "personal", "name": "An Nguyen", "email": "you@personal.com" },
    { "alias": "client-a", "name": "An Nguyen", "email": "you@clienta.com" }
  ]
}
```

You can edit this file directly.

## Requirements

- Node.js 18+
- Git 2.9+ (for `core.hooksPath`)
- Git Bash on Windows (PowerShell is not supported for hook execution)
