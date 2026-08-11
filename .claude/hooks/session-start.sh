#!/bin/bash
#
# SessionStart hook — install the dependencies before the session begins.
#
# WHY THIS EXISTS. A web session clones the repo fresh, and node_modules is not
# in the repo (see .gitignore). Without an install, `npm test` does not fail
# with a useful message — it HANGS. Measured on 2026-08-09: over six minutes of
# a single `node --test` process still running, 25 KB of stack traces, and no
# summary, because 178 test files each threw "Cannot find module 'express'"
# inside a before() hook and the runner never settled. The install that fixes
# it takes seven seconds. A seven-second step that removes a six-minute dead
# end is the whole argument for this file.
#
# Runs SYNCHRONOUSLY (no {"async": true} line). The session waits the ~7s so
# that nothing in the agent loop can race ahead of the install and hit the hang
# this hook exists to prevent.
#
# Remote only: a local checkout has its own node_modules and its own opinions
# about when to install.

set -euo pipefail

# Only in Claude Code on the web.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Idempotent: npm install is a no-op once the tree is satisfied, and the
# container state is cached after the hook completes, so a warm start pays
# almost nothing.
#
# install, NOT ci: package-lock.json is deliberately untracked (.gitignore),
# so there is no lockfile for `npm ci` to hold the build to. The repo's own
# CI workflow makes the same choice for the same reason.
echo "session-start: installing npm dependencies…"
npm install --no-audit --no-fund

echo "session-start: ready — 'npm test' will run (~3m20s); for one file use"
echo "  node --test --test-reporter=dot test/<file>.test.js"
