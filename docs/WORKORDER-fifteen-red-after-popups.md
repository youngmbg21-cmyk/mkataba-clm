# WORK ORDER — the 15 red browser checks after "Pop-ups as drawn" (10 Oct 2026)

**For:** a fresh Claude Code session on `youngmbg21-cmyk/mkataba-clm`, branch from the latest `main`.
**Owner:** not a developer — every reply and the final summary in plain English, no file paths.
**Background:** PR #201 ("Pop-ups as drawn: one SAP frame for every dialog") was merged on the owner's word
before the browser suite finished. The full browser run (`node test/chromium/run-all.js --jobs 4`)
then reported **15 of 256 files red**. This order lists each one, what failed, and what to do.
Read MAP-HISTORY "THE POP-UPS AS DRAWN, 10 OCT 2026" and the CLAUDE.md section
"THE POP-UPS, THE SAP WAY" (the line "EVERY DIALOG WEARS THE DRAWN FRAME") before starting.

## Ground rules for this job

- Follow CLAUDE.md. Scope = these 15 files only. Anything else you notice → one line in BUGLOG.md
  (append only, never read).
- **First, prove who broke each one.** For every file below, run it against a worktree at the
  commit BEFORE PR #201 (`git log --merges` → the parent of the #201 merge, i.e. `aa2b1f1`), and
  against current `main`. Green before #201 and red after = ours to fix. Red at both = it was
  already red; leave it red and say so (do not fix).
- **The drawings win** over older checks where the owner approved the drawn look (pop-ups as
  drawn, 10 Oct 2026). Then the check is RE-POINTED IN PLACE, keeping its claim where it still holds,
  with a dated comment saying why ("RE-POINTED 10 Oct 2026 (the pop-ups as drawn): …"). Never delete
  a check, never skip it, never add it to KNOWN_RED to make red go away.
- **A real product fault is fixed in the product**, not by loosening the check.
- Keep every element id. Do not re-record any colour or type census (ink-wash baseline,
  theme-tokens) unless the owner says so in the chat.
- Do NOT run the full suite unless the owner asks in the chat (CLAUDE.md rule). Run each file
  directly: `node test/chromium/<file>`. `npm run lint` must stay at 0 errors.
- Commit on the session's branch, push, open a PR, and tell the owner. Do not merge without the
  owner's word.

## The 15 files

### A. Probably already red before PR #201 (check first; if red at `aa2b1f1`, leave red)

1. **history-head-verify.js**: the History tab's filter row is 0×0 on arrival (all five filters
   and Clear), and the run times out on `page.selectOption`. Known red on main before this work.
2. **ink-wash-verify.js**: "no text size moved" and "every colour as before (dark)" census
   differences on almost every page, both brands. Known red on main before this work. NOTE: some
   small count changes may come from the new dialog frame (13px counts ±4, borders ±4). If it was
   red at `aa2b1f1` too, leave it and tell the owner. Never re-record the baseline without the owner.
3. **nine-jobs-verify.js** (13/15): "Who else names the colleague who filed a change" and "the one
   who approved" come back empty. Known red before.
4. **paper-terms-frozen-verify.js**: "unsigned, every printed term is a box behind Edit",
   "read-outs say why on their hover", "a term the paper does not print is still a box". Known red before.
5. **refile-a-contract-verify.js** (0/2): "the value-stream row is on screen — not in the document";
   run times out on `page.click`. Known red before.
6. **round-two-comments-verify.js** (45/46): "G1 a drag across two paragraphs inside one clause
   gets the three rows" → got only `ask, comment` (no Edit). Known red before. Also check against
   the rule "two clauses: Ask · Comment, NEVER Edit; one clause: Ask · Edit · Comment".

### B. Caused by the new pop-ups: re-point to the drawn look (verify first)

7. **sap-popups-verify.js** (19/20): step 9 tries `page.fill('#ar-order', '3')`, but "Approves in step"
   is now a SELECT of steps (drawn). Re-point: choose the option with `selectOption` (or press
   HaTi's dropdown face, since the select wears `data-sel-face`), then check the read-back sentence.
8. **five-images-verify.js**: "the dialog frame carries a 3px rule at its top", "it is the
   workspace's own accent", "a dangerous question wears the danger tone". The 3px colour line was
   RETIRED on purpose (the drawings are plain white with a ruled title bar; node check f346 was
   already re-pointed the same way). Re-point: the frame has a ruled title bar `.dlg-h`
   (border-bottom), no top colour line; a dangerous question shows the warning sign
   `.dlg-mb-ic[data-tone="danger"]` and a red confirm button.
9. **dialog-balance-verify.js**: checks 1d–1g, 2f and 3a expect the OLD new-standard chooser
   (three big tiles with icons, 24px padding, no filled button). The drawn chooser is ONE list of
   radio rows (`.sap-li`, inputs carry `data-ns-start`, their paper is `#ns-cp`), 16/18 padding,
   Continue (`#ns-continue`) as the one filled button, Cancel last. Re-point to that, keeping
   the claims that still hold: rows the same width, nothing leaves the box at 420px, Cancel on the
   right edge.
10. **one-door-verify.js** (many steps 2a–9): the walk presses a start tile and expects the next
    screen at once; now a start is a radio row plus Continue. It then times out waiting for
    `#ns-file`. First PROVE whether the product still works by hand in a browser: choose each start →
    Continue → does the upload box `#ns-file` / scratch box / contract list open? If something does
    not open, that is a PRODUCT FAULT: fix it in `openNewStandard`/`nsGo`. Then re-point the walk's
    start step to "check the row, press Continue". Every later step should go green by itself.
11. **amount-and-window-verify.js**: "AMOUNT is drawn, under Recurring and above the toggle" →
    `{"recur":480,"amount":628}`. The drawn add-obligation form puts "Whose obligation is this?"
    FIRST, and Amount now shares a row with Assign to. Re-point the order claim to the drawn order
    (whose → what → due → recurring → amount | assign to), keeping "Amount draws on both sides of the
    toggle".
12. **signing-route-timeline-verify.js**: "3j a side with nobody is an empty place that carries the
    act" and "4a the guarantor with nobody is an empty place" find an initials badge (`JL`, `MH`)
    where an empty place was expected. The signing route's "still to name" rows now draw the PARTY's
    initials badge (drawn). Decide by the drawing: if the drawing shows the party initials on an empty
    row, re-point (the place is empty of a PERSON; the act "Add signer" is on it). If not, drop the
    badge from the empty row. Ask the owner if it is unclear.

### C. Unclear: decide by the before/after run

13. **overview-as-drawn-verify.js**: "13a it is a dropdown, not a text box, and it says what it
    holds" → `<SELECT> · ""`. The dropdown's face text is empty. Likely the new dialog dressing
    (`popupControlsDress`/`selectFaceDress`) or the frame touching the Overview's Edit boxes. If it is
    green at `aa2b1f1`, find why the face is blank and fix it in the product (a dropdown must say
    what it holds).
14. **signed-copy-differs-verify.js** (17/18): "6c a hold files nothing — it stays out with them —
    and says what happened to the message" → toast is empty. If green at `aa2b1f1`, a dialog in that
    flow probably changed (the new confirm/prompt frame); make the act still toast its outcome.
15. **window-drag-verify.js** (15/16): "a press in the wording selects text, it does not move the
    window" → the window moved and nothing was selected. If green at `aa2b1f1`, the new title bar
    `.dlg-h` (or the frame's measured margins) has probably widened the drag handle into the body;
    fix so that only the title bar drags.

## Done means

- Each of the 15 is either GREEN, or proved red before PR #201 and left alone with one sentence why.
- Lint 0 errors; the node files for anything you touched pass.
- CLAUDE.md MAP line updated only if a rule changed; the story appended to MAP-HISTORY under
  "THE POP-UPS AS DRAWN, 10 OCT 2026".
- A short plain-English summary for the owner: what was broken, what was only an old check, what
  was left red and why.
