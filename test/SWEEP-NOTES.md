# Notes for anyone running a token sweep over this codebase

Written 25 Aug 2026, after the same fault was introduced twice in one night.

## Never map `.001ms`

`transition-duration:.001ms!important` and `animation-duration:.001ms!important`
inside `@media (prefers-reduced-motion: reduce)` are **not durations somebody
chose**. They are "as close to zero as a stylesheet can say". A sweep that maps
values to the nearest rung will read `.001ms` as 1ms, decide the nearest rung is
120ms, and **turn the accessibility setting into a 120ms setting**.

This happened twice: once during the motion sweep, and again when that sweep was
re-run over merged code. The first time it was fixed in the stylesheet and not in
the script, which is why it came back.

A sweep must skip any line inside a `prefers-reduced-motion` block, or exclude
values under 10ms outright. `f238` fails if a token appears in that rule.

## Never find the compiled Tailwind blob by line number

It was line 74, then 81, and it moves whenever tokens are added above it. Find it
by its signature — `*,:after,:before{--tw-border-spacing-x` — and skip that line.
Editing it is silent: the blob regenerates and the edit is lost on the next build.

## Never sweep inside `calc()`

That is the contract paper, whose size the reader sets with the A-/A+ stepper. A
token there overrules a preference.

## Never sweep a whole-document builder

`js/views/healthreport.js`, `js/views/weekly.js` and `negoHistoryExportHtml` in
`js/views/negotiation.js` emit standalone `.html` files that carry no `:root`, so
a token there resolves to nothing at all and the declaration is dropped. The
third one lives inside an ordinary view file, which is why a file-level exclusion
missed it; `f143` caught it.

## Print what moved, not only how many

Both faults above were caught because the sweep listed every value it changed.
A count alone would have hidden them.
