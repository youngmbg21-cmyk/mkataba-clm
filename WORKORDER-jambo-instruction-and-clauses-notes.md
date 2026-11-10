# Work order: Jambo's instruction in the redline, and notes on the Clauses tab

**Date:** 10 Nov 2026
**Branch:** `claude/peaceful-feynman-xjcq6j`
**Status:** Both fixes built, tested here and saved on this computer as one commit (`168527e`). **Not on GitHub yet.**

---

## What was built (done)

### Fix 1 — Jambo's note no longer lands in the contract
- **The problem:** Jambo answered with an instruction ("Amend Section 3.3 to add: '…' Also amend Section 8.3 to add: '…'"), and the whole sentence was pasted into clause 3.3 over the late-delivery damages sentence.
- **Now:** an answer shaped like an instruction is read as one.
  - Only the new wording for the clause you are on goes in, and it is **added** after the existing text. Nothing is crossed out.
  - The part meant for another clause (8.3) shows in Jambo's panel as its own suggestion with an **"Open 8.3"** button. Nothing is written into 8.3 automatically.
  - This works the same in the clause editor, the Playbook review window and Prepare redlines.
- **Jambo's panel:** after Apply, the card keeps its green redline marks, gets a green outline, and has a **"Show on the paper"** link.

### Fix 2 — Notes stay on the Clauses tab
- The notes beside the paper no longer disappear when you move from Dossier to Clauses.
- The open clause's note, its words on the paper and its row in Clauses all light up amber together.
- On Clauses the note's link reads **"Shown in Clauses ›"** and lands on the clause's row.

### Also done
- New automatic test for fix 1; one older check updated (it expected the notes to hide on Clauses).
- Handbook text updated in English and Swedish.
- Project notes (the map, the history, the test list) updated.

---

## What still needs to be done

| # | Task | Who | Waiting on |
|---|------|-----|------------|
| 1 | **Push the commit to GitHub** so the automatic checks run | Claude | **Owner's yes** ("push it") |
| 2 | **Read GitHub's check results** and fix anything this work broke | Claude | Task 1 |
| 3 | **Retake the Handbook pictures** for the two chapters that changed (the Dossier chapter and the "Your changes: Edit with Jambo" chapter) | Claude, on GitHub | Task 1 |
| 4 | **Take photos of fix 1** (the clause editor) at the three screen sizes: 1440×780, 1536×730, 1366×950. Needs a test contract where Jambo writes "Amend Section 3.3 to add…" | Claude | Owner says whether to do it before or after the push |
| 5 | **Drawn-against-built side by side**: the approved drawing next to the real screens, every part ticked or named, with photos at all three sizes | Claude | Tasks 4 (fix 2 photos already exist) |
| 6 | **Owner's yes to merge** after seeing task 5 and green checks | Owner | Tasks 2 and 5 |
| 7 | **Trim the rules file** — it is now about 82 KB, over its 80 KB limit | Claude | **Owner's yes** |

### Already photographed
- Fix 2 at all three screen sizes: notes stay, the open clause lit amber in all three places, nothing spills sideways.

---

## Things to know

- **An old rule was reversed.** An earlier ruling said notes should hide on the Clauses tab. The owner's request replaces it; the rule and its check were updated to match.
- **Two new buttons** ("Open 8.3" and "Show on the paper") came from the drawing the owner approved.
- **Noticed, not fixed:** on the Clauses tab, the "Plain English" button in an open row is slightly cut off at the top. It was already like that. It is written in the bug log for a separate job.

---

## The next step for the owner

Say **"push it"**, and say whether you want the fix 1 photos **before** or **after** the push.
