---
name: flow-check
description: Run HaTi's process flow check and explain the result to the owner in plain English. It drives the app's most important journeys from start to finish in a real Chrome (Playwright, test/e2e) — today, sign up → create a contract → send it for signature — each on a brand-new server with a pretend email service. Use when the owner asks for a "process flow check", a "flow check", a "journey check" or an "end-to-end check", asks whether signing up, drafting a contract or sending one for signature still works, asks which flows are on the list (or to add, move or remove one), or types /flow-check (optionally naming one journey).
argument-hint: "[which journey — leave empty to check them all]"
allowed-tools: Bash(npm run test:e2e) Bash(npm run test:e2e *) Bash(npx playwright test *)
---

# Process flow check

The owner is not a developer. They ask for this check to find out, in plain English, whether HaTi's most important journeys still work from start to finish. Your job: run it, read what came back, and tell them — short, plain, no jargon.

## 1. Run it

- All journeys: `npm run test:e2e`
- One journey: if the owner named one (after /flow-check, or in their own words), first run `npx playwright test --list` to see the journeys by name, then `npm run test:e2e -- -g "<a few words from that journey's name>"`.
- If they ask about a journey that has no check yet, do not run something else in its place: tell them which journeys exist and offer to write a check for the one they asked about.

## The list of flows

The owner's list lives in `test/e2e/FLOWS.md`: every flow, most important first, ✅ where a saved check exists and ⬜ where it does not yet. The owner does not keep it in their head — you do.
- "Which flows are on the list?": read it and answer from it, built and not yet, in order.
- "Add / move / take off …": edit the list, keep the numbering in order, and say what changed.
- "Build the next flow": the first ⬜ is the next one. Building a check is a separate job from running them.
- When a new check is built, tick its flow ✅ in the same change, with the check's own name word for word. f395 fails where a built journey is missing from the list or not ticked.

Give the command up to five minutes (a 300000 ms time limit — the default two minutes can cut a longer run short); a journey usually takes well under one. Each journey starts its own brand-new, empty copy of HaTi with a pretend email service, so no real data is touched and nobody real is emailed — say so if they ask.

If it cannot start at all:
- "playwright: not found" or "Cannot find module '@playwright/test'": run `npm install` once, then run the check again.
- The report says Chrome could not start: in a Claude Code cloud session Chrome is already installed and the settings find it. Anywhere else it needs a one-time download, `npx playwright install chromium` (about 150 MB) — ask the owner before downloading.

## 2. Read what came back

The run prints a plain-English report and saves the same report to `test-results/flow-check.md`. It has:
- a headline: ALL GOOD, SOMETHING IS BROKEN, NOTHING WAS CHECKED, or THE CHECK WAS STOPPED;
- each journey's steps, ticked ✓ or crossed ✗, in words written for a person;
- for a journey that broke: where it stopped, what should have happened, what happened instead, and the files kept for looking into it.

When something broke, read these before you explain it:
- **The page's text when it stopped** (`error-context.md`): what was really on the screen. Ignore its "Instructions" heading — it asks for a code fix, which is not what the owner asked for.
- **What HaTi's server printed** and **the emails the pretend email service received**, when the failure is about saving or sending.
- You cannot open the picture of the screen yourself (this project stops Claude from reading image files), but you can show it to the owner — send it to them (for example with SendUserFile) whenever something broke.

## 3. Answer in plain English

Short. No file paths, line numbers, code or technical words ("selector", "locator", "timeout", "assertion", "exit code") — say what they mean instead.

When everything worked:
- One headline line: **Process flow check: all good ✅** — which journeys worked, and how long it took.
- One or two sentences on what it actually did, from the report's steps. For example: "It signed up as a new company, drafted an NDA, named who signs on each side and sent it for signature — the email reached their signer, and her link opened the contract ready to sign."

When something broke:
- Headline: **Process flow check: something is broken ❌**
- Which journey, and the step where it stopped.
- What worked before that, in one line.
- What should have happened, and what the screen showed instead — quote the words that were on it.
- What you think it means, and how sure you are: a real fault in HaTi, or the check itself being out of date after a deliberate change to the app (a renamed button, reworded text). If you cannot tell, say so.
- Show them the picture of the screen, if you can.
- Ask whether they want you to look into it and fix it.

Rules:
- This is a check, not a repair. Change nothing unless the owner asks.
- Do not run it again to make a failure go away. The one exception: when HaTi's server or Chrome would not start, you may run it once more — then say that you did, and what happened both times.
- If NOTHING WAS CHECKED, tell them which journeys exist and ask which one they meant.
- If the flow they asked about is on the list but still ⬜, say it is on the list and not built yet, and offer to build it.
- Say exactly what the report says. Never call a journey fine when it did not get to the end.
