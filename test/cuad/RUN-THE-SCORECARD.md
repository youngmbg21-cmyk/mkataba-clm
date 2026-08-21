# Running the Copilot accuracy scorecard

**Goal:** a table of numbers showing how accurately HaTi's Copilot reads a
contract, measured against 50 real contracts marked up by lawyers.

**Cost:** about US$0.60 for the first run, about US$2.40 for all 50.
**Time:** ten minutes, most of it waiting.
**Where:** a laptop or desktop. **Not Render** — see the last section for why.

## Who does what

This splits cleanly, and the split is not negotiable:

| | |
|---|---|
| **Claude does** | everything except one command |
| **You do** | the one command that carries the API key |

Claude cannot type an API key into a terminal, and shouldn't. So Claude sets
everything up, hands you a single line to run, and reads the results with you
afterwards. You never paste the key into a chat.

---

## What you need first

- **Node.js 22 or newer.** Check with `node --version`. If it is missing or
  older, install it from nodejs.org — the LTS version is right.
- **The Anthropic API key** — the same one you type into HaTi's Settings screen.
  Have it somewhere you can copy from. It is used once and not saved.

---

## Steps 1–4: Claude can do these

### 1. Get the code

```
git clone https://github.com/youngmbg21-cmyk/mkataba-clm
cd mkataba-clm
git checkout claude/github-repos-hati-review-h0c157
```

If the repository is already cloned, just `cd` into it and run the `checkout`.

### 2. Install

```
npm install
```

About a minute.

**npm will say it added around 108 packages.** That is normal and nothing has
gone wrong: this project names only three, and those three bring their own
dependencies along.

### 3. Confirm the contracts are there

```
ls -la test/cuad/contracts.json
```

**Expect:** a file of about 2.2 MB. That is the 50 contracts and their answer
key, committed to the repository — there is nothing to download.

### 4. The free rehearsal

```
node test/cuad/run.js --n 5
```

**Expect:** a table where **every score is 0%**, printed in about two seconds.

That is the correct result and it is the point of this step. It proves the whole
machine runs — reads the contracts, starts a throwaway HaTi, scores the answers,
prints the table — without contacting the AI or spending anything.

**If this fails, stop and send the error.** Nothing has been spent and nothing
needs undoing.

---

## Step 5: this one is yours

Copy this line, paste your key between the quotes, and run it:

```
ANTHROPIC_API_KEY="paste-your-key-here" node test/cuad/run.js --live --n 10
```

**Expect:** two or three minutes of quiet, then a table with real percentages.
Cost: roughly US$0.60.

The key is used by this one command. It is not saved to a file, not added to
your shell, and it disappears when the terminal closes.

### What it will NOT touch

- **Not your live site.** This runs entirely on your own machine.
- **Not your real contracts.** It starts a throwaway copy of HaTi on an empty
  temporary database and deletes it when finished.
- **Not your HaTi settings.** Your stored key stays exactly where it is.

---

## Step 6: send the results

Copy everything from the line beginning `CUAD scorecard` to the end, and paste it
into the conversation.

It is percentages and contract counts. There is no key in it, no customer data,
nothing confidential.

---

## Step 7: the remaining forty — only if step 5 looked sensible

```
ANTHROPIC_API_KEY="paste-your-key-here" node test/cuad/run.js --live
```

About ten minutes and roughly US$1.80 more.

---

## If something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `node: command not found` | Node.js is not installed | Install it from nodejs.org, then start again at step 1 |
| `--live needs a real ANTHROPIC_API_KEY` | The key was not passed | Check it is inside the quotes, before the word `node`, all on one line |
| `Cannot find CUADv1.json` | The contracts file is missing | Re-run step 3; you may be on the wrong branch — check with `git branch --show-current` |
| `Cannot find module 'express'` | Step 2 did not finish | Run `npm install` again and watch for errors |
| `request error` lines at the end | HaTi refused, or the API rate-limited | These are reported separately and are **not** counted as wrong answers. Send the output anyway — the errors are themselves a finding |
| A `401` or `authentication` error | The key is wrong, expired, or has no credit | Check it against the one in HaTi's Settings screen |

---

## Why not Render — recorded so nobody tries again

An earlier version of this document sent the run to the Render server, reasoning
that the API key already lived there. **Every part of that reasoning turned out
to be wrong,** and it was tested rather than assumed. Three findings, in the
order they were discovered:

**1. The key is not on Render, and does not need to be.** HaTi resolves its key
as `getSetting('aiKey') || process.env.ANTHROPIC_API_KEY` — the **stored setting
comes first**. The owner types it into HaTi's own Settings screen and it lives in
the database. `ANTHROPIC_API_KEY` being absent from Render is the normal, healthy
state and says nothing about whether Copilot works. (To check that properly, ask
HaTi: `GET /api/ai/config` reports `source` as `settings`, `env` or `null`.)

So Render's supposed advantage — "nobody has to handle the key" — never existed.
The key is typed by hand either way.

**2. There is not enough memory, and the obvious check hides it.** The service
runs on Render's starter plan: a hard **512 MB** limit, with the live site
already using about **393 MB**, leaving roughly **119 MB**.

The run needs **199 MB**, measured — a Node process plus the throwaway HaTi it
spawns. It does not fit. The likely outcome is the live site being killed for
memory while the scorecard runs.

**The trap:** `free -m` inside a container reports the whole physical host it is
sharing, not the slice the service is limited to. It happily printed tens of
gigabytes. `df` misleads the same way. The honest numbers come from the
container's own limits (the cgroup files), not from `free`.

**3. Git cannot reach GitHub from there anyway.** Render clones the repository to
deploy it and then **removes the remote**, along with the credential it used.
`git remote` prints nothing; `git fetch origin` fails with *"'origin' does not
appear to be a git repository"*. There is no way to fetch this branch without
typing a GitHub token into that shell.

Any one of these would rule Render out. Together they close it.

**A safety note that came out of the same session:** do not run
`git config --get remote.origin.url` on a shared or recorded screen — on some
setups that value contains an embedded access token.
