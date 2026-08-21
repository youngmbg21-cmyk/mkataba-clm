# Running the Copilot accuracy scorecard

**Goal:** a table of numbers showing how accurately HaTi's Copilot reads a
contract, measured against 50 real contracts marked up by lawyers.

**Cost:** about US$0.60 for ten contracts, about **US$6–7** for all fifty
(the fifty figure was US$2.40 until 21 Aug 2026 — see step 7 for why it moved
and how it is worked out).
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

```
node test/cuad/run.js --live --n 10 --dump
```

It will ask for the key. **Paste it and press Enter — nothing appears as you
type.** That is deliberate.

Works the same on Windows, Mac and Linux.

**Expect:** two or three minutes of quiet, then a table with real percentages.
Cost: roughly US$0.60.

### Why it is asked for, and not put on the command line

This document used to say:

```
ANTHROPIC_API_KEY="paste-your-key-here" node test/cuad/run.js --live --n 10
```

Two things were wrong with it, and both bit on the same attempt:

**It leaked a key.** A command line is echoed on screen, kept in scrollback,
written to shell history — and photographed. An owner following this document
sent a screenshot of their terminal and their whole key came with it. No
warning about "don't paste keys into chats" covers a screenshot of a command
you were told to type.

**It could not run on Windows at all.** `VAR=value command` is bash syntax.
PowerShell rejects it outright with *"is not recognized as the name of a
cmdlet"* — which is exactly what happened, so the leak bought nothing.

Being asked for the key fixes both: it is never displayed, never stored, never
in history, and the same command works on every system.

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

## Step 7: all fifty — only if step 5 looked sensible

```
node test/cuad/run.js --live --dump --resume
```

It asks for the key, the same way step 5 does. **This command carried the
bash line above until 21 Aug 2026** — the one that leaked a key in a
screenshot and does not run on Windows at all. Step 5 was fixed that morning
and this was missed; both are the same command now.

### What it costs, honestly

**About US$6–7, and 25–40 minutes.** That is well above the US$1.80 this
document used to claim, and the old figure was not wrong when it was written —
it dates from before HaTi read whole contracts and before the obligations
reader returned forty items apiece. Both changes are improvements and both
cost tokens.

The arithmetic, so it can be checked rather than trusted: 1.86M characters of
contract is roughly 466k tokens, read **twice** (once to extract fields, once
to read obligations) at $3 per million in; plus up to 8,000 output tokens per
obligations answer at $15 per million.

### Why all fifty and not just the forty

One run over the whole set is a single consistent sample. Scoring forty now
and bolting them onto ten measured a week ago mixes two samples, and the
second thing this project learned is that the same code answers slightly
differently each time (see the noise band in SCORING.md).

### It survives a failure now

A hundred large calls in half an hour is exactly the shape of run a provider
rate-limits partway through. Three protections, added 21 Aug 2026:

- **Retries** on a rate limit or an overloaded provider, backing off 2s, 6s,
  18s, 45s. It does **not** retry "Copilot ran out of room" — that is an
  answer, and retrying it four times would pay four times to be told the same.
- **The dump is written after every contract**, so a run that dies at
  contract 49 keeps 48 answers instead of nothing.
- **`--resume`** reads those answers back and asks only for what is left. Run
  the identical command again after any failure.

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
