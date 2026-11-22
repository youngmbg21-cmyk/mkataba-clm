# WORK ORDER — JAMBO'S PANEL HOLDS STILL (asked 14 Nov 2026)

The owner: "yes, plan that job" — the one part the last flicker left: Jambo's panel (`#ig-dock`, `renderIntelDock`,
js/views/intelligence.js) is thrown away and built again with THE SAME WORDS on some presses (Explorer's lenses,
the Calendar's ✦, a contract's Redlines tabs). Starts only on the owner's "go", which is their yes to every push,
pull request and merge in it.

## Why it was left
`renderIntelDock` binds about 30 groups of buttons on EVERY paint (the expand door, Ask, Clear, Collapse, the box's
input and keys, the chips `[data-igsug]`, lens toggles and ×, list / open / export / compare / cite / choice /
board / paper doors, hover cards). The panel's own turns are already delegated once (`data-ig-mr`…, the standing
rule); its FRAME is not. Keeping a painted piece while its buttons are bound again would make one press act twice.

## Step 1 — one press, one act (one pull request)
1. A guard first, red on main: a browser check presses each of the panel's buttons ONCE on the pages where it lives
   (Board, a contract's Dossier · Clauses · Redlines, Explorer, the Calendar) after the panel has been painted
   several times, and counts the act it starts ONE time (a counter on the function each button calls).
2. Every per-paint binding moves to ONE listener on the panel, bound once (`dock.dataset` flag), that reads the
   pressed element's own attribute — the same function called with the same arguments as today. Group by group,
   each with its node test (source-pinned) and the guard green. Nothing a person sees or presses changes.
3. Merge when green.

## Step 2 — the panel keeps what did not change (one pull request)
1. The panel is written in named parts (its head and tabs, its body, its box and foot). When `igDockSame` says
   "different", only the PART whose words changed is written; a part with the same words is left standing — its
   scroll, focus, caret and hover kept. ANY DOUBT = WRITTEN WHOLE (as today): a part another painter fills after
   the write (`IG_DOCK_FILLED_SEL`), an editor holding a caret, the Fill in face.
2. Guard step: "pressing a lens on Explorer keeps Jambo's panel" (and the Calendar's ✦, a Redlines tab) — red on
   main. The rebuild measure's "for nothing" count for Jambo's panel must fall and nothing else rise.
3. Photos at the owner's three screens show the panel unchanged. Merge when green.

## Step 3 — the end
The measure on main; a plain-English before/after for the panel; MAP, MAP-TESTS, MAP-HISTORY and the bug log.

## Rules for the whole run
- Never merge red; never skip, switch off or loosen a check. A known unlucky check that trips stops the run until
  the owner presses Re-run (this session cannot).
- Main is merged INTO the branch when it moves; history is never rewritten.
- Nothing a person sees or presses changes; anything that would is stopped and asked.
- The phone draws its own panel and is not touched. Check-ins every 30 minutes. Two pull requests, so about two to
  four full GitHub runs.
