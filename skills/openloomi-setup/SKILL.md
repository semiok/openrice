---
name: openloomi-setup
description: "OpenRice first-use setup and readiness guidance for skill-only agent runtimes. Use when OpenRice is not yet installed, the local API is not reachable, the session/token is missing, or the user needs a manual install and launch walkthrough before using OpenRice skills."
allowed-tools: "Bash(node $SKILL_DIR/scripts/openloomi-setup.cjs *)"
---

# OpenRice Setup

Use this skill first when OpenRice readiness is unknown.

Keep it lightweight and manual-first:

- If OpenRice Desktop is not installed, point the user to the official
  Getting Started docs.
- If the desktop app is installed but not running, tell the user to open it.
- If the local API is not reachable, ask the user to retry after launch.
- If the token/session is missing, ask the user to complete sign-in or guest
  session setup inside OpenRice.

## Check Readiness

Run the bundled status script when you need a quick local check:

```bash
node "$SKILL_DIR/scripts/openloomi-setup.cjs" status
```

The script reports:

- whether OpenRice Desktop looks installed
- whether the local API responds on `3414` or `3515`
- whether `~/.openloomi/token` exists
- what the next manual step should be

## Output Contract

Treat `ready: true` as the handoff point to the other OpenRice skills:

- `openloomi-memory`
- `openloomi-connectors`
- `openloomi-loop`
- `openloomi-api`

If `ready` is false, surface the returned `nextAction` and the official
Getting Started link instead of guessing.

## Official Install Path

If the desktop app is missing, direct the user to:

- `https://openloomi.ai/docs/getting-started`
- `https://github.com/melandlabs/openloomi/releases`
