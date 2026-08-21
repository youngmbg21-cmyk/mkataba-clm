# Running the scorecard on Render

Hand this to Claude, or to whoever manages the HaTi deployment. It is written to
be followed literally, top to bottom.

**Goal:** produce a table of numbers showing how accurate HaTi's Copilot is.
**Cost:** about US$0.60 for the first run, about US$2.40 for the full one.
**Time:** ten minutes, most of it waiting.

## Why Render and not a laptop

The run needs HaTi's Anthropic API key. That key already lives in the Render
service's environment — so on Render nobody has to copy, paste or handle it.
That is the whole reason for doing it here.

## What this does NOT do

- It does **not** touch the live site's code. It builds a separate checkout in
  `/tmp` and leaves the deployed one alone.
- It does **not** touch the live database. The scorecard starts its own throwaway
  HaTi on a temporary database and shuts it down afterwards.
- It does **not** write to `/var/data` (the mounted disk holding the real
  contracts). Everything goes in `/tmp`, which is wiped on restart.
- It installs **nothing**. The scorecard needs only Node's built-in modules; the
  one package it borrows (`express`, to start the throwaway server) is already
  installed for the live site and is linked, not re-installed.

## Before you start

The Render web service is **hati-clm**. Open it in the Render dashboard and find
the **Shell** tab. Every command below runs in that shell.

---

## Step 1 — check the key is there

```
[ -n "$ANTHROPIC_API_KEY" ] && echo "KEY PRESENT" || echo "KEY MISSING"
```

**Expect:** `KEY PRESENT`.

If it says `KEY MISSING`, stop — and note that this also means HaTi's Copilot
features are not working in production, which is a bigger finding than anything
the scorecard will produce. Add the key under the service's **Environment** tab
first.

**Never print the key itself.** The check above deliberately reports only
whether it exists.

## Step 2 — check there is room

```
df -h /tmp | tail -1
free -m | head -2
```

**Expect:** at least 100 MB free on `/tmp`, and some free memory.

The scorecard's data file is 2.2 MB and the run needs roughly 150 MB of memory
while it works. On the starter plan (512 MB, shared with the live site) that is
comfortable but not enormous — if free memory is under about 200 MB, do this at a
quiet time of day rather than during business hours.

## Step 3 — get the scorecard onto the box, without disturbing the live code

```
cd /opt/render/project/src
git fetch origin claude/github-repos-hati-review-h0c157
git worktree add /tmp/scorecard origin/claude/github-repos-hati-review-h0c157
```

A *worktree* is a second, separate checkout of a different branch. The live
site's files are not modified and the running service is unaffected.

**If `git fetch` fails** because Render's clone is shallow, try:

```
git fetch --depth 1 origin claude/github-repos-hati-review-h0c157
```

**If `cd /opt/render/project/src` fails,** find the real path with `pwd` when the
shell opens — Render normally starts you in the project directory already.

## Step 4 — borrow the already-installed packages

```
ln -s /opt/render/project/src/node_modules /tmp/scorecard/node_modules
```

This installs nothing. It points the new checkout at the packages the live site
already has.

## Step 5 — the free rehearsal

Run it once **without** contacting the AI, to prove everything is wired up:

```
cd /tmp/scorecard
node test/cuad/run.js --n 5
```

**Expect:** a table where every score is `0%`. That is correct and is the point —
it proves the machinery runs end to end without spending anything. It should
finish in a couple of seconds.

If this fails, stop and send the error. Nothing has been spent.

## Step 6 — the real run, ten contracts

```
node test/cuad/run.js --live --n 10
```

**Expect:** two or three minutes of quiet, then a table with real percentages.
Cost: roughly US$0.60.

## Step 7 — send the results back

Copy **everything** from the line beginning `CUAD scorecard` to the end, and
paste it into the conversation. It is a table of numbers and contract counts —
there is no key, no customer data and nothing confidential in it.

## Step 8 — the remaining forty (only if step 6 looked sensible)

```
node test/cuad/run.js --live
```

Roughly ten minutes and about US$1.80 more.

## Step 9 — tidy up

```
cd /opt/render/project/src
git worktree remove /tmp/scorecard --force
```

Nothing else needs undoing. The throwaway HaTi and its temporary database delete
themselves when the run ends.

---

## If something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `--live needs a real ANTHROPIC_API_KEY` | The key is not in this shell's environment | Go back to step 1 |
| `Cannot find CUADv1.json` | The worktree did not include the data file | Check `ls -la /tmp/scorecard/test/cuad/` — `contracts.json` should be there at ~2.2 MB |
| `Cannot find module 'express'` | Step 4 did not take | Re-run the `ln -s` command and check with `ls -la /tmp/scorecard/node_modules` |
| Lots of `request error` lines at the end | HaTi refused or the API rate-limited | Those are reported separately and are **not** counted as wrong answers. Send the output anyway — the errors are the finding |
| The shell disconnects mid-run | Render shells time out | Re-run; nothing is corrupted. Consider `--n 10` rather than the full 50 |
| The live site slows or restarts | Memory pressure on the starter plan | Stop, tidy up (step 9), and run it from a laptop instead — see below |

## The fallback: run it from a laptop

If Render proves awkward, the same run works anywhere Node is installed. The only
extra step is getting the key: in the Render dashboard, **Environment** tab,
reveal `ANTHROPIC_API_KEY` and copy it.

```
git clone https://github.com/youngmbg21-cmyk/mkataba-clm
cd mkataba-clm
git checkout claude/github-repos-hati-review-h0c157
npm install
ANTHROPIC_API_KEY=<paste it here> node test/cuad/run.js --live --n 10
```

Do not paste the key into a chat window, an email, or a file that gets committed.
Type it into the terminal for that one command and it is gone when the terminal
closes.

---

## A note on what has and has not been tested

Everything up to and including step 5 has been run and proved on the 50
contracts. **Steps 6 onward have never been executed** — there is no API key in
the environment where this was built, which is exactly why this document exists.

The Render-specific commands in steps 3 and 4 are written from Render's
documented layout and have **not** been tried on the live service. They are the
most likely part to need adjusting; the troubleshooting table covers the ways
they can fail.
