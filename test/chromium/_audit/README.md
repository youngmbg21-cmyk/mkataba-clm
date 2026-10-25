# Measuring instruments, not tests

These are the scripts the 21 September 2026 performance audit was measured
with. They are NOT part of `npm test` and NOT part of
`node test/chromium/run-all.js` — run-all sweeps `test/chromium/*.js` and these
sit one folder down on purpose, because they take a book of 3,000 contracts and
several minutes each.

They assert nothing. They print numbers, which is what a measurement is for.

* `perf3.js` — times the hot readings and the register at 100 / 400 / 1,200 /
  3,000 contracts.
* `perf4.js` — times every view and every Insights tab at 400 and 3,000.
* `perf6.js` — counts every pass over a long list while one act runs and names
  the function that made it. This is what found the finding.
* `perf7.js` — the same filter, scanned against indexed, side by side.

The findings are written up in `docs/PERFORMANCE-AUDIT.md`. Re-measure before
quoting any number from it: the runner is the authority.

## The detail report (owner, 24 Oct 2026)

"Add stylelint and build the report." Three scripts, run in this order, all
measuring instruments like the ones above:

* `style-audit.js` (`npm run audit:styles`) — Stylelint over HaTi's own
  sheets (never the generated Tailwind block) with HaTi's own rules in
  `stylelint-hati.js`: scroll bars over 8px, corners, text sizes and control
  heights off the theme's scales, plus the plain faults (a rule said twice,
  `!important`). Writes `style.json`.
* `detail-audit.js` (`npm run audit:detail`) — every place the tidy sweep
  visits, at the owner's three screens, top and then down the main scroller:
  pills off the theme, thick scroll bars, words too near a card's edge, cards
  not level, cards overlapping, buttons cut short, rows that open with nothing
  saying so. It plants one of each fault first and stops if any kind is
  blind. Writes `detail.json` and outlined pictures.
* `detail-report.js` — one HTML page from both, grouped, in plain words.

Output goes to `test/chromium/shots/detail-audit/` (or `$HATI_SHOT_DIR`).
