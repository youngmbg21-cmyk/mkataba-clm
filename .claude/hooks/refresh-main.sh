#!/bin/bash
#
# PreToolUse(Bash) hook — bring the local default branch up to date with the
# remote BEFORE a merge runs.
#
# WHY THIS EXISTS. Reported by the owner, 12 Aug 2026: "why do I keep getting an
# alert with every merge that main is behind or main moved?" The answer was that
# this checkout's `main` was a snapshot. Its reflog read:
#
#     main@{2026-08-10 22:53:49}: branch: Created from refs/remotes/origin/main
#
# and then nothing for two days, while the real main took 85 more commits. No
# ordinary step in the workflow moves it: every session is handed a FEATURE
# branch, that branch is what gets pulled, and main is only ever touched at the
# moment somebody merges — which is precisely when git compares its two-day-old
# note against reality and prints the warning.
#
# It was never a danger to the code. It was, once, a danger to the REPORT: the
# stale note made a four-commit merge look like an 85-commit one, and the owner
# was nearly told the merge would sweep in a pile of somebody else's unmerged
# work. A number that is wrong in the direction of "this looks alarming" is
# worth a hook on its own.
#
# WHAT IT DOES, AND THE THREE RULES THAT KEEP IT SAFE:
#
#   1  FAST-FORWARD ONLY. The local default branch is moved only when the remote
#      one is strictly ahead of it. If the two have diverged — somebody
#      committed to main locally — nothing is touched and the ordinary warning
#      appears, which is the right outcome: that is a real question for a
#      person, not bookkeeping.
#   2  IT NEVER TOUCHES A DIRTY TREE. Off the default branch it moves a ref and
#      no files at all. On it, it refuses unless the tree is clean.
#   3  IT NEVER BLOCKS. Every path exits 0. A network hiccup at merge time must
#      cost you a stale note, never the merge.
#
# It also fires on `git checkout <default>` / `git switch <default>`, because
# that is the other moment the warning prints and it is the same one-line fix.
#
# Silent unless it actually moved something — a hook that narrates every no-op
# is a hook people turn off.

set -u

# Never let a failure in here take a command down with it. On EXIT, not on ERR:
# `trap ... ERR` was tried first and is a trap in both senses. It fires on ANY
# non-zero command, and the very first one here — git symbolic-ref asking for
# origin/HEAD, which is legitimately unset on a fresh clone — is expected to
# return 1. The hook silently did nothing and reported success, which is the
# hardest possible failure to notice in a thing whose normal output is silence.
trap 'exit 0' EXIT

payload=$(cat 2>/dev/null || true)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""' 2>/dev/null || true)
[ -n "$cmd" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
git remote get-url origin >/dev/null 2>&1 || exit 0

# ---- WHICH BRANCH IS THE DEFAULT ----
# origin/HEAD is the right answer and is frequently unset on a fresh clone (it
# is unset in this one), so there is a ladder rather than one lookup.
DEF=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)
if [ -z "$DEF" ]; then
  for guess in main master trunk; do
    if git show-ref --verify --quiet "refs/remotes/origin/$guess"; then DEF="$guess"; break; fi
  done
fi
[ -n "$DEF" ] || exit 0

# ---- IS THIS A COMMAND WORTH A NETWORK ROUND TRIP ----
# `git merge-base` is a read-only query that happens to start with the same two
# words, and it is used constantly; excluded explicitly so it costs nothing.
want=0
if [[ "$cmd" =~ (^|[^[:alnum:]_.-])git[[:space:]]+merge([[:space:]]|$) ]]; then
  want=1
elif [[ "$cmd" =~ (^|[^[:alnum:]_.-])git[[:space:]]+(checkout|switch)([[:space:]]|$) ]] \
  && [[ "$cmd" =~ (^|[^[:alnum:]_./-])"$DEF"([[:space:]]|$) ]]; then
  want=1
fi
[ "$want" -eq 1 ] || exit 0

# Nothing to refresh if this checkout has no local copy of the branch: a later
# checkout will create it from the remote-tracking ref, which the fetch below
# has just brought up to date anyway.
git show-ref --verify --quiet "refs/heads/$DEF" || { git fetch --quiet origin "$DEF" >/dev/null 2>&1 || true; exit 0; }

before=$(git rev-parse --short "refs/heads/$DEF" 2>/dev/null || echo '')

# The configured refspec is +refs/heads/*:refs/remotes/origin/*, so this updates
# refs/remotes/origin/$DEF as well — which is the OTHER half of the staleness:
# the remote-tracking copy was two days old too.
git fetch --quiet origin "$DEF" >/dev/null 2>&1 || exit 0

# RULE 1 — fast-forward only. Diverged means a person has to look.
git merge-base --is-ancestor "refs/heads/$DEF" "refs/remotes/origin/$DEF" 2>/dev/null || exit 0

cur=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')
if [ "$cur" = "$DEF" ]; then
  # RULE 2 — on the branch itself, only with a clean tree, and let git enforce
  # the fast-forward a second time in its own words.
  [ -z "$(git status --porcelain 2>/dev/null)" ] || exit 0
  git merge --ff-only --quiet "refs/remotes/origin/$DEF" >/dev/null 2>&1 || exit 0
else
  # Off the branch: move the ref, touch no files. update-ref is the plumbing
  # that does exactly that, and the ancestor check above is what makes it safe.
  git update-ref "refs/heads/$DEF" "refs/remotes/origin/$DEF" >/dev/null 2>&1 || exit 0
fi

after=$(git rev-parse --short "refs/heads/$DEF" 2>/dev/null || echo '')
if [ -n "$before" ] && [ -n "$after" ] && [ "$before" != "$after" ]; then
  n=$(git rev-list --count "$before..$after" 2>/dev/null || echo '?')
  printf '{"systemMessage":"Refreshed %s from origin before merging (%s → %s, %s new commit(s))."}\n' \
    "$DEF" "$before" "$after" "$n"
fi
exit 0
