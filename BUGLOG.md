# BUGLOG

Things noticed while doing something else. Per the Scope rules in CLAUDE.md:
noticed, **not fixed** — the finding is written down here and the original task
carries on. A line leaves this file when somebody is asked to fix it.

## Noticed, not fixed

- **f172's "the reading notice never folds" fails on `origin/main`.** Proved by
  running that file on unmodified main: 9 pass, 1 fail, identical to the failure
  seen while the black-ink work was in the tree. It expects `.rl-note-card` to
  draw on a non-default reading; that card went with the 23 Aug "nothing floats
  over the page" removal and only the in-column strip remains. Inherited, and
  WO-14 of `WORKORDER-screenshot-fixes.md` reverses this claim in place as part
  of its own work. *(24 Aug 2026, during the black-ink run.)*
- **`npm run lint` reports 4 errors on a clean tree**, against CLAUDE.md's
  zero-error bar. All four are two dictionary keys declared twice, once in each
  language: `co_password_updated` and `act_next`. Four lines. Filed as WO-0's
  rider in `WORKORDER-screenshot-fixes.md`. *(24 Aug 2026.)*
- **`pages-read-alike-verify` fails 3 of 38** on "the negotiation head does not
  wrap". Named as a known red by `docs/WORKORDER-black-ink.md`, which proves it
  at commit `b82889e`, before any of that work. Somebody else's regression.
  *(24 Aug 2026.)*
