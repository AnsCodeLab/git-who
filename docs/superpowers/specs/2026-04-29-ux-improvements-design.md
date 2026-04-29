# git-who UX Improvements — Design Spec

**Date:** 2026-04-29  
**Status:** Approved

---

## Problem

The current workflow has two friction points:

1. **Two-step commit flow** — hook blocks the commit, user has to re-type the full `git commit -m "..."` command after running `git-who use`. Zero reason to type the same message twice.
2. **Poor discoverability** — `git-who` with no args dumps a plain command list with no guidance. New users don't know where to start. No `whoami`, no `unset`.

---

## Solution Overview

### 1. Switch hook type: `pre-commit` → `prepare-commit-msg`

`pre-commit` runs before the commit message is available, so we can't save it. `prepare-commit-msg` runs after the message is prepared but before the commit finalizes — giving us the message to save and replay.

**New flow:**

```
$ git commit -m "fix login bug"

⚠  No profile set for this repo.
   Your commit has been saved — run: git-who use

$ git-who use

  ❯ personal   An Nguyen <annguyen209@gmail.com>
    client-a   An Nguyen <an@clienta.com>

✓ Identity set: [personal] An Nguyen <annguyen209@gmail.com>

  Replaying saved commit: "fix login bug"
✓ [master a1b2c3] fix login bug
```

**Zero re-typing.** Works for both `git commit -m "..."` and editor-based commits.

**Mechanics:**
- `prepare-commit-msg` hook receives `$1` (path to COMMIT_EDITMSG file) and `$2` (source: `"message"` for `-m`, empty for editor)
- When no profile is set: copy COMMIT_EDITMSG to `.git/git-who-pending-message`, print instructions, exit 1
- `git-who use` after setting profile: detect `.git/git-who-pending-message`, read message, run `git commit -m "<message>"`, delete the file

---

### 2. `git-who use` — interactive picker + auto-replay

**`git-who use` (no alias)** — launches an interactive `prompts` select menu (works reliably in a real terminal):

```
  Which profile for this repo?

  ❯ personal   An Nguyen <annguyen209@gmail.com>
    client-a   An Nguyen <an@clienta.com>
    + Add new profile
```

Selecting `+ Add new profile` runs the `add` flow inline.

After setting the profile:
- If `.git/git-who-pending-message` exists → replay commit automatically, delete file
- If no pending commit → show `✓ Identity set: [personal] ...` and exit

**`git-who use <alias>`** — still works (for scripting), same replay logic after setting.

---

### 3. Two new commands

**`git-who whoami`** — quick one-liner status for the current repo:

```
$ git-who whoami
[personal] An Nguyen <annguyen209@gmail.com>

# or if not set:
No profile set for this repo. Run: git-who use
```

**`git-who unset`** — cleanly removes the repo's identity:

```
$ git-who unset
✓ Profile cleared for this repo.
```

Removes `gitwho.profile`, `user.name`, `user.email` from `.git/config`. Replaces the need for raw `git config --local --unset` commands.

---

### 4. Improved help text

**`git-who` (no command):**

```
git-who — commit as the right person, every time.

Getting started:
  1. git-who init        install the global hook (run once)
  2. git-who add         save a profile (name + email)
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

**Auto-init warning** — if `core.hooksPath` is not configured when any command runs:

```
⚠  Hook not installed. Run: git-who init
```

---

## Files Changed

| File | Change |
|---|---|
| `src/init.js` | Switch hook from `prepare-commit-msg` logic, update `generateHookScript()` |
| `src/cli.js` | Add `whoami`, `unset`; make `use` interactive with no-arg; add replay logic; improve help |
| `src/hook.js` | Update message to mention auto-replay |
| `test/init.test.js` | Update hook script assertions |
| `test/cli.test.js` | New — smoke tests for `whoami` and `unset` |

---

## Out of Scope

- GUI or web interface
- Per-branch identity
- GPG/SSH key management
