# BUGLOG

Things noticed while doing something else. Per the Scope rules in CLAUDE.md:
noticed, **not fixed** — the finding is written down here and the original task
carries on. A line leaves this file when somebody is asked to fix it.

## Noticed, not fixed

## Fixed since being noticed

- ~~**f172's "the reading notice never folds" fails on `origin/main`.**~~
  CLOSED 24 Aug 2026 by WO-14, which is the same subject: the claim asked for
  `.rl-note-card`, the floating band that went on 23 Aug, and its replacement
  — the in-column strip — is what WO-14 removed. Reversed in place: a reading
  is said by the column greying and refusing the press, the stack is not where
  it lives, and the way back is the reading tab. f172 is 10/10.

## Noticed, not fixed
- **`npm run lint` reports 4 errors on a clean tree**, against CLAUDE.md's
  zero-error bar. All four are two dictionary keys declared twice, once in each
  language: `co_password_updated` and `act_next`. Four lines. Filed as WO-0's
  rider in `WORKORDER-screenshot-fixes.md`. *(24 Aug 2026.)*
- **`pages-read-alike-verify` fails 3 of 38** on "the negotiation head does not
  wrap". Named as a known red by `docs/WORKORDER-black-ink.md`, which proves it
  at commit `b82889e`, before any of that work. Somebody else's regression.
  RE-CHECKED after WO-10 put three check symbols on that head: the head is
  123px, byte-identical to main, so nothing in this run widened it. *(24 Aug
  2026.)*
- **`white-band-and-tabs-verify` fails 2 of 38** on 5d/5e, and only on the line
  box — the register's titles compute 20px against the reading switch's 19.6px,
  from two decisions made a day apart in someone else's work. Proved on
  unmodified main. It needs a ruling on which gives, the row rhythm or the
  shared type, which is a density decision rather than a drive-by fix. Listed
  in `run-all.js`'s KNOWN_RED with that reasoning. *(24 Aug 2026.)*
- **`panel-alerts-and-head-verify` fails 7 of its head checks, and throws.** It
  asks for render B1's Tracked Changes head — three `.rl-fseg` cuts, the 19px
  count as the headline with its uppercase caption underneath, the live one the
  only coloured thing on the row. That head was replaced by a `<select>` on
  main by "The negotiation page takes the render" (`f3bc058`), which never
  re-pointed this file. Proved by running it in a worktree at unmodified
  `origin/main`: the identical 7 failures and the identical TypeError, before
  any of this branch's work. **NOT WO-8's**: that item only MOVED the control
  into the slot the owner drew, and did not choose its shape. It needs whoever
  owns that render to say what B1's claims become. *(24 Aug 2026.)*
- **`copilot-band-verify` fails outright**, because WO-3 retired the band it
  measures. The file is KEPT, not deleted, and listed in KNOWN_RED: restoring
  the band is putting one function body back, and this is the only thing that
  would prove the restore worked. *(24 Aug 2026.)*
