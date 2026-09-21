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
