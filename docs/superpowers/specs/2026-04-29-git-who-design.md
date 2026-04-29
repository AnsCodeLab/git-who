# git-who — Design Spec

**Date:** 2026-04-29  
**Status:** Approved

---

## Overview

`git-who` is a globally-installed npm tool that prevents accidental commits under the wrong git identity. It intercepts commits via a global pre-commit hook and prompts the user to select or enter a named profile when no local `user.email`/`user.name` is set for the current repo.

Target audience: developers who work across multiple clients or organizations on the same machine.

---

## Problem

Git falls back to global `user.email`/`user.name` when no local config is set. On machines with multiple clients or identities, this silently commits as the wrong author — hard to notice, annoying to fix after the fact.

---

## Architecture

```
git-who (npm package)
├── CLI (Node.js)        → git-who init | add | list | use <profile>
├── Profiles store       → ~/.git-who/profiles.json
└── Hook (shell script)  → ~/.git-who/hooks/pre-commit
                            └── installed globally via core.hooksPath
```

### Commit-time flow

1. Git runs `~/.git-who/hooks/pre-commit`
2. Hook checks: is `user.email` set locally for this repo?
3. **Yes** → pass through (chains to repo's own hook if present)
4. **No** → shell prompts user to pick a saved profile or enter a new one → sets `git config --local user.name` and `git config --local user.email`
5. Commit proceeds

---

## Profiles Store

**Location:** `~/.git-who/profiles.json`

```json
{
  "profiles": [
    { "alias": "personal", "name": "An Nguyen", "email": "an@personal.com" },
    { "alias": "client-a", "name": "An Nguyen", "email": "an@clienta.com" }
  ]
}
```

JSON chosen for easy Node read/write, human editability, and extensibility (future fields: `gpg`, `signingKey`).

### Hook prompt UI

```
⚠  No git identity set for this repo.

  1) personal   — An Nguyen <an@personal.com>
  2) client-a   — An Nguyen <an@clienta.com>
  n) Enter new identity

Select [1-2 / n]:
```

- Selecting `n` prompts for name + email, then offers to save as a new profile.
- No profiles saved yet → skip list, go straight to "enter new identity".
- Invalid selection → re-prompt (no silent abort).
- Non-interactive terminal (CI) → exit 0, skip prompt entirely.

---

## CLI Commands

### `git-who init`
Sets `core.hooksPath` globally and creates `~/.git-who/`. Run once after install.

```
✓ Created ~/.git-who/
✓ Installed hook at ~/.git-who/hooks/pre-commit
✓ Set git config --global core.hooksPath ~/.git-who/hooks
```

### `git-who add`
Interactive prompt — alias, name, email — appends to `profiles.json`.

```
Alias:  client-a
Name:   An Nguyen
Email:  an@clienta.com
✓ Profile 'client-a' saved.
```

### `git-who list`
Prints all saved profiles. Marks the active profile for the current repo with `*`.

```
  personal   An Nguyen <an@personal.com>
* client-a   An Nguyen <an@clienta.com>   ← active in this repo
```

### `git-who use <alias>`
Sets `git config --local` immediately without waiting for a commit.

```
✓ Identity set for this repo: An Nguyen <an@clienta.com>
```

---

## Project Structure

```
git-who/
├── bin.js                  → CLI entry point (thin, delegates to src/)
├── src/
│   ├── cli.js              → command router (init/add/list/use)
│   ├── profiles.js         → read/write ~/.git-who/profiles.json
│   ├── git.js              → thin wrapper around git config calls
│   └── init.js             → hook installation logic
├── hook/
│   └── pre-commit          → shell script shipped with the package
├── package.json
└── README.md
```

---

## Tech Stack

- **Runtime:** Node.js 16+, plain CommonJS, no build step
- **Dependencies:**
  - `prompts` — lightweight interactive CLI prompts
  - `chalk` — terminal colors
- **Hook:** shell script (fast path stays in shell, no Node startup cost on every commit)

---

## Hook Chaining

The last lines of `hook/pre-commit` chain to any repo-level hook so existing tooling (husky, lint-staged, etc.) still runs:

```sh
REPO_HOOK="$(git rev-parse --git-dir)/hooks/pre-commit"
[ -x "$REPO_HOOK" ] && exec "$REPO_HOOK"
```

---

## Out of Scope

- GPG signing configuration
- SSH key management
- Per-repo hook installation (global only)
- Windows PowerShell support (Git Bash on Windows is supported)
