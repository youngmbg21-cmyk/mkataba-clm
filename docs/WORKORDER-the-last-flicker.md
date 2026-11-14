# WORK ORDER — THE LAST FLICKER (asked 14 Nov 2026)

The owner: "create a plan to autonomously build all the remaining fixes". This order finishes the flash survey:
the presses that still lose the reader's place, and the pages that still throw themselves away and build again
on a press. It starts only on the owner's "go", which is their yes to every push, pull request and merge in it.

## Where we start (rebuild measure, run 43585760685, main after pull request 719)
- Lost something: 13 presses (196 at the start). Contracts 6, Clauses 2, Jambo's house 2, Redlines 1, Calendar 1,
  Handbook 1.
- Rebuilt a part: 216 presses. Flashed: about 170. Most rebuilt: the Dossier 21, Our paper 18, Contracts 17,
  Redlines 17, Explorer 16, the Handbook 15, Clauses 13, the Calendar 12, Parties 10, the Pulse board 10.
- Left alone on purpose, said to the owner: Jambo's house's contract picker (it writes the chosen name back into
  itself, 14 Nov); the Handbook chosen again from Recent (a fresh open starts at its top).

## Before Round 0 — the two unlucky checks wait properly (the owner picked (b), 14 Nov 2026)
board-says-it-plain-verify A0 (the first chart drawn late) and chase-many-verify 1b (the untick read before it was
drawn): each waits for the state it tests, bounded, as the house rule says; nothing loosened, nothing skipped.
Goes in Round 0's pull request.

## Round 0 — the measure tells real from not (one pull request)
1. Each of the 13 is read: a real loss, or the measure miscounting. Already suspected: Contracts' Recent entries
   and alerts that OPEN A CONTRACT are a move to another place, not a lost place; the measure is taught that.
2. The measure gives, per page, the parts a press rebuilt and which press — the list Round 2 works from.
3. Run the measure; the real list is the baseline. Merge when green.

## Round 1 — the last lost places (one pull request)
Each real loss from Round 0 fixed where it happens, through the existing helpers (`keepScrollIn`, the same-page
`setView` keep, `placeScrollBack`), never a second way. Expected: Clauses' row and "fill in" chip, Redlines' way
back to Contracts, the Calendar's Mine pill, whatever of Contracts is real. Each gets a step in
nothing-is-thrown-away-verify that fails on main. Merge when green.

## Round 2 — pages stop throwing themselves away (one pull request PER PAGE, worst first)
THE ONE WAY: a press that changes some words redraws only what changed, through ONE shared helper in
js/components.js that lays the new drawing over the page in place — a piece whose words are the same is left
standing (kept, not rebuilt), only changed pieces are written. Pages adopt it one at a time:
the Dossier → Contracts → Redlines → Our paper → Explorer → the Handbook → Clauses → the Calendar → Parties →
the Pulse board → the rest, in the measure's order.
- BUTTONS FIRST, THEN THE REDRAW: a page that binds its buttons on every paint (Contracts does) is moved to ONE
  listener set once on the page or the document (the standing rule) BEFORE it adopts the helper, so a kept button
  can never fire twice. A check presses each such button once and counts one act.
- ANY DOUBT = DRAWN WHOLE: a part the helper cannot match safely (a chart, the paper, an editor holding a caret)
  is drawn whole as today and named in the pull request.
- Each page: the measure's rebuild count for it must go down and nothing else up; the guard gains a step
  ("pressing X keeps the page's pieces") that fails on main; photos at the owner's three screens show nothing
  moved. Merge when green, then the next page.

## Round 3 — the end
The measure on main; a plain-English table, start against end; MAP, MAP-TESTS, MAP-HISTORY and the bug log
updated; anything not done said plainly with why.

## Rules for the whole run
- Never merge red. Never skip, switch off or loosen a check to get green.
- A check that fails once and is not about the change (a known timing check) cannot be re-run by this session:
  the run STOPS at that pull request and waits for the owner's "Re-run failed jobs" press. (See the decision below.)
- Main is merged INTO the branch when it moves; history is never rewritten.
- Nothing a person sees or presses changes, and nothing HaTi says changes: no new band, button, word or layout.
  A fix that would need one stops and is asked.
- Check-ins every 30 minutes while waiting on GitHub. Anything noticed on the way: one line in the bug log.
- Cost: each pull request runs GitHub's full checks once (about 15–20 minutes of eight machines); Round 2 is
  about ten pull requests, so expect about a dozen full runs in all.

## Decision for the owner before "go"
Two checks fail now and then on GitHub's slower machines for reasons unrelated to the work (the Board's first chart
drawing late; ticking off a chase). Each time, the run stops until the owner presses Re-run. Either:
- (a) leave them, and the run waits for the owner whenever one trips; or
- (b) first make those two checks wait properly for what they test (no check loosened: each waits for the state,
  bounded, as the house rule says), so the run is not stopped by them.
