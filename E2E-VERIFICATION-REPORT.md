# HaTi — full end-to-end verification

*Mode: `fix-small-report-big`. Walked 21 August 2026 against a real server, a
real browser and, where the counterparty is involved, a real share link off the
wire. Every finding below was reproduced before it was written down.*

---

## 1. The one-paragraph answer

**Yes, with two caveats you should decide about before this handles anything
valuable.** HaTi does what it says almost everywhere I pushed it, and it does
the hard parts well: the internal review wall holds absolutely — I checked the
raw data that leaves the building, not the screen, and a held change, a
reviewer's name, a verdict and your own audit trail genuinely do not travel. A
signed amendment moves the parent's end date on every single surface I could
find, including the reminder email and the daily brief, which is the check most
likely to be half-done and was not. Eighteen scripted attacks on the server all
failed. The whole automated suite passes — 4,101 tests, none failing. The two
caveats are real, though. **First: between the moment your counterparty signs
and the moment you countersign, the wording of the contract can still be
rewritten** — the screen refuses, but the underlying service does not, so a
contract can end up sealed carrying words the other side never saw. **Second:
every member of your workspace, including read-only Viewers, can see what each
named colleague spent on Copilot today** — the page that shows it is admin-only,
but a second door beside it is not. Neither is something a normal click can
reach by accident, and neither is something I have changed, because both touch
signatures and permissions and those are yours to rule on.

---

## 2. What is broken, worst first

### 2.1 A half-signed contract's wording can still be rewritten — Broken, not fixed

**What a person would see.** Nothing. That is the problem. Your counterparty
signs the agreement. Before you countersign, the words of the contract are
changed. You then countersign, and the contract executes and is sealed —
carrying wording the other side never agreed to, with their signature on it.

**When it happens.** Only in the window between the first signature and the
last, and only through the underlying service rather than through a button on
the screen. The screen itself refuses correctly: HaTi's own rule is that the
wording freezes the moment *anybody* signs, and the workbench obeys that.

**How bad.** Serious, and worth deciding about quickly. It is the one thing on
this list that could turn a signed agreement into a disputed one. In its
favour: it takes a signed-in colleague deliberately going around the interface,
and the neighbouring guard — changing *who signs* — is correctly shut at that
same moment, which is exactly why this one is easy to miss.

**Fixed now?** No. It touches signatures, so under the rules I was given I have
reported it rather than changed it. My recommendation is that the service
should apply the same freeze the screen already applies: the moment there is
one signature on the record, the words stop being editable. I have written the
reproduction down so it can be re-checked in one command.

### 2.2 Everyone can see what each colleague spent on Copilot — Broken, not fixed

**What a person would see.** A read-only Viewer — the least-privileged account
in the product — can read a list of every colleague by name with what their
Copilot use cost today. The page built to show this is admin-only and correctly
refuses them; a second, unguarded door beside it hands over the same figures.

**When it happens.** Any time. I signed in as a genuine Viewer and read the
list, and it was byte-for-byte what the admin sees.

**How bad.** Not dangerous, but it is a privacy promise the product makes and
then does not keep. HaTi's own reasoning says a per-person cost column "turns a
list about permissions into a league table", which is precisely why it was kept
off the People page — and it is reachable anyway.

**Fixed now?** No — it touches permissions and money. The fix looks small (stop
sending the per-person breakdown to people who are not admins), but who may see
what is your decision, not mine.

### 2.3 Dark theme: some text is close to unreadable — Broken, not fixed

Three of the workspace's accent colours are never given a dark-mode value, so
in dark theme they keep their light-mode ink and land dark-on-dark. The
selected tab on the Settings page was measured at a contrast of 2.66 against a
required 4.5. Thirty-five styling rules use those three colours, so this is not
one tab — it is a family of places including dialog headings, template blanks
and register actions.

**Fixed now?** No, deliberately. Giving those three colours dark values changes
how dark mode looks across the whole product, and the project's own notes say
the recorded colour baseline is stale and needs somebody willing to own the
palette. That is a design decision, not a bug fix, and it should be made on
purpose.

### 2.4 A template can be filed in one place and create contracts in another — Lying, not fixed

A company template has two independent settings that both look like "which
value stream is this?" — the one the template picker files and displays it
under, and an older category field. When somebody uses the template, the
contract is filed using the **category**, and the stream shown in the picker is
ignored entirely. Set the two inconsistently — and nothing keeps them in step
or warns you — and every contract made from a template you can see under
"Marketing" quietly lands in "Procurement".

**Fixed now?** No. Which stream a contract lands in decides who can see it, so
this is a permissions question and yours to rule on. The change itself is one
line: prefer the template's own stream before falling back to the category.

### 2.5 English left standing inside the Swedish seal block — Lying, not fixed

On an executed contract, the seal panel is translated — and then three
sentences inside it are hard-coded English: the timestamp placeholder, the
"no signature recorded" line, and the whole paragraph explaining how each
signer's identity was verified. A Swedish reader gets a Swedish heading and
then drops into English mid-block. **It is on both copies** — yours and the one
your counterparty reads.

**Fixed now?** No, and I want to be plain about why: the untranslated paragraph
is a statement about how identities are verified and what is not yet active. It
is close to a legal assurance, and inventing its Swedish wording without
somebody who can own that wording would be worse than leaving it visibly
English. The repository already keeps a list of Swedish terms awaiting review;
this belongs on it. The two short placeholders could be translated immediately,
but translating two of three leaves the same half-English sentence, so I have
left the block whole.

---

## 3. What is fixed in this pass

Two things, both small and both certain.

- **A test that failed on a third of the days in the year.** One check in the
  automated suite described a piece of work as "running inside a single month"
  and then gave it dates counted from today — which straddle two months for
  roughly the last eleven days of every month. It failed today for that reason
  and would have failed on 132 days of 2026. The product's arithmetic was
  right; the test's example was not. The example now states a start and an end
  inside one calendar month directly, so it means what it says on every day of
  the year. **This is why the suite now reports 4,101 of 4,101 rather than
  4,100.**
- **A note in the code that denied a feature existed.** A comment claimed that
  nothing in the interface used a particular way of creating a contract. The
  Requests door — added later — uses it, and I confirmed that by using it. The
  comment now names its caller. No behaviour changed.

I also added two entries to the project's own rulebook so the next person does
not have to re-discover what I did: the signature-freeze gap above, recorded as
an open finding rather than as a decision, and a short section naming three
browser checks that fail for stale reasons rather than broken ones (below).

---

## 4. What I found and did not fix

Everything in section 2 is unfixed, each for the reason given there. In
addition:

### 4.1 A customer holding an "appendix" has nothing to match on — Confusing

HaTi files seven kinds of related document, and the one that covers an appendix
is offered as **"Annex / schedule"**. The word "appendix" appears nowhere in
the product — not in the label, not in the description, nowhere in either
language. A customer holding a document titled "Appendix A" would have to guess,
and the two nearest guesses ("Addendum", which adds terms, and "Annex") mean
different things. **Swedish has no such problem**: "Bilaga" is the ordinary word
and covers all of it.

Nothing is broken. My recommendation is one word: make the English label
"Annex / schedule / appendix", or add "appendix" to its description. I have not
made the change because customer-facing vocabulary is yours.

### 4.2 Two rows of the go-live checklist can read green when they should not — Confusing

The "at least one approval rule" row can show green on a brand-new workspace
that has no approval rules saved at all, because the screen invents a sensible
default rule when nothing was ever saved. And "a backup has been taken" is
remembered in the browser rather than on the server, so an admin opening the
checklist from a different computer is told no backup exists when one is
downloadable right now. Neither breaks anything; both could mislead somebody
using the checklist as a readiness gate.

### 4.3 An observation I did not confirm, and am not reporting as a finding

A sweep across the light theme flagged a number of elements as below the
standard contrast threshold — teal tracking numbers on white, white text on the
teal primary button, grey "no job title on file" text. I am **not** calling
these findings: the sweep read only flat background colours, so anything on a
gradient was scored wrongly, and it did not distinguish large or bold text,
which is allowed a lower threshold. If accessibility compliance matters to you,
it deserves its own pass with a proper tool. I mention it so it is not silently
omitted.

---

## 5. What I could not test

Said plainly, because an untested area quietly left out would undo the value of
the rest.

- **Charts as pictures.** The charting library loads from an internet address
  this environment blocks. Chart *behaviour* was proven by exercising the real
  production functions and a full round-trip — asking for a bar graph really
  does produce bars, with the figures unmoved, and ordinary English like "the
  bar association" is correctly not read as a shape request. But nobody looked
  at a rendered chart. **To test it: run the same checks on a machine with
  internet access, or bundle the library locally.**
- **Real outbound email.** Every message was delivered to a stand-in that
  records exactly what a provider would receive, including refusals. No message
  was sent to a real inbox. The honesty of "sent / queued / refused" was proven
  against that stand-in. **To test it fully: a real sending domain.**
- **Real webhook delivery.** This environment has no outbound internet, and the
  product's own protection correctly refuses every locally reachable address —
  so the guards were tested thoroughly and an actual delivered payload was not.
- **Two-step sign-in and rate limiting on screen.** Both were exercised
  completely at the service level, including a proper time-based code
  generator. Nobody typed a code into the sign-in box.
- **320-pixel phones.** The phone was walked at 390 pixels, which is what I was
  asked for. The narrowest phones were not.
- **Non-admin roles across every width, language and theme.** The width,
  language and theme sweeps were walked as an admin. Restricted roles were
  attacked thoroughly at the service level and walked on their own screens, but
  not across the whole matrix.
- **The counterparty's pages across every width and theme.** Their pages were
  walked thoroughly in their own right — reading modes, bell, exports, sending,
  the wall line — at one width, in light theme.
- **The admin-only "adopt a precedent" panel** in Settings. The precedent
  sentence shown during a negotiation was fully verified, including that it
  never appears on the counterparty's seat.
- **A weekly brief surviving a server that was down on Monday.** Proven
  arithmetically — a Tuesday run reuses the same weekly key — but not by
  actually stopping a server over a weekend.

---

## 6. Coverage table

| # | Journey | What was actually walked | Result | Who |
|---|---------|--------------------------|--------|-----|
| **J1** | Arriving, who may do what | Executed-record attacks; folder moves; signature forgery; review verdicts by the wrong person; roster edits; admin-only fields off a real Editor's and a real Viewer's bootstrap; folder scope across every route; two-step sign-in end to end incl. recovery codes and the lost-phone rescue; rate limiting with ten colleagues from one address; go-live facts | **Pass**, 2 Confusing (§4.2) | Helper — evidence read: 4 scripts, 4 raw logs, NOTES |
| **J2** | Raising a contract, every way | All 8 creation sites through real UI presses (real CSV, real file uploads); all 12 built-in templates create→fill→read the paper; payment answer and term treatment per template; picker-opens-on-streams; new-draft-opens-on-Key-terms | **131/132**, 2 Lying (§2.4, fixed comment §3) | Helper — evidence read: 36 screenshots, template table, run log |
| **J3** | Paper from outside | A received .docx: wording is the page, one file strip, download, re-read, no boxed scroller, no crash on the banner that names our party; a PDF keeps its preview and pretends no text; the text-size stepper **pressed for real** and measured on uploaded wording (13→17.3px); marked-up Word import; paste-a-response-code | **13/13** + 4 suite files + sim-f 24/24 | **Me** |
| **J4** | Key terms, money, filing | USD/EUR/workspace-currency contracts; own page and register row print own currency; aggregates convert and **name what they left out**; FX rate set through the route and refused to an Editor; Key terms rows draft vs signed; re-filing refused to an Editor, allowed to an admin | **Pass** — see note | **Me** |
| **J5** | The negotiation, both seats | A real four-round negotiation from both seats on a real share link (26/26); clause panel, routing-row cards, counters and supersession, accept/reject/withdraw/reopen, reading modes, bell, exports, solo send, selection-copies-but-does-not-edit | **Pass** — 8 browser files green (87, 90, 40, 13, 15, 12, 41, 23, 29, 26, 11, 22, 10); 6 stale assertions run down to the bottom (§7) | **Me** |
| **J6** | The colleague in the loop | Ask a named colleague on a chosen subset; the reviewer holds; a non-reviewer is refused in words; **the wall checked off the raw wire** — held change, out-for-review change, reviewer's name, verdicts, review note, who ruled, audit trail, desk roster all absent; a reviewer holding a review is refused a send; the review cannot be deleted off the record | **21/21** | **Me** |
| **J7** | Approvals, signing, the lock | Signing refused until signers are named, in words; link minted; a forged signer id **rebound by the server** to the link's own; signature pending until applied; lands on its own row with an assurance rung; route shut at the first signature; execution; downgrade refused; an Editor refused the same; date-forgery refused; a review link cannot sign | **23/24** — the 1 is §2.1 | **Me** |
| **J8** | The family | All seven kinds created against a signed parent — naming, per-kind numbering, bodies, recitals with the parent's real date, what is carried and what is deliberately not; declined child keeps its number; every linking rule; draft vs signed term; **the amended date checked on the family card, Key terms, the register row, the calendar, the dashboard, the reminder email and the daily brief**; archived executed amendment still governs; KPI counting; an amendment shared and signed through the real route; the "appendix" question | **126/126** + **16/16** | **Me** |
| **J9** | Dates, promises, nudges | Obligation nudges at 7 days / the day / the day after, in the assignee's own language, own stored address only, escalation naming who was reminded, dedupe; renewal window across 6 statuses; all three brief cadences, the legacy setting, refusal of a bad value, quiet days, Monday keying; shared family arithmetic; calendar day-is-a-door 23/23 | **Pass** | Helper — evidence read: 6 scripts, 379-line log, NOTES |
| **J10** | The newer doors | Intake by a Viewer through accept/decline/done with the requester told each time and never about their own act; archive shelf off every list, count and both sweeps, still Signed, still searchable, archived amendment still governs; webhooks — 24-address SSRF matrix, a **real DNS-rebinding probe**, fail-closed subscription, ids-only payload, signature, caps; Copilot spend per person | **151 checks**, 1 Broken (§2.2 — **I reproduced it myself**) | Helper — evidence read: 4 scripts, per-area logs, payloads |
| **J11** | The thinking surfaces | Insights all three tabs and every panel with its stated exclusions; weekly review determinism incl. the quiet week; health report with no AI key; **named chart shapes honoured with figures proven unmoved**, and ordinary English not misread; Copilot chat, clause proposals, co-pilot band pressed through to an accepted change, contract brief (position, 500px, escapes-before-marks, never travels, no write to a sealed record), precedent memory (no network, never on the counterparty's seat), palette handoff; **every surface re-walked with no AI key** | **95/95** | Helper — evidence read: 26 screenshots, charts table, run log |
| **J12** | Every window | 6 widths × 9 screens with zero horizontal overflow; sidebar floats below 1500 with the page proven unmoved to the pixel; both languages with the contract's own words proven byte-identical; both markets, months following the reader and numbers the market; dark theme on 10 screens; phone at 390 incl. label sizes and "files no changes of its own" | **Pass**, 2 Broken (§2.3, §2.5 — **both verified by me at source**) | Helper — evidence read: 119 screenshots, 519-line log, NOTES |
| **J13** | The adversary | All five scripted simulations: four rounds 26/26, amendment and people 24/24, **server attacks 0 of 18 succeeded**, live email 26/26, Word import 24/24. Plus J1's own attacks and my own on signing, review and filing | **Pass** | **Me** (scripts) + Helper (J1's extras) |
| **J14** | The record | Audit trail names a person on every line, is in English, and drifted into no other language; timeline; verify-integrity clean across the book; the seal; exports from both seats and the read-only copy (11/11) | **Pass** | **Me** |

**Note on J4:** one check in my first sweep found no Key terms rows at all on
a signed contract, which would have contradicted the rule that the stream
picker deliberately stays live there. I chased it rather than leaving it: on a
genuinely executed contract the panel renders **all eight rows including the
value-stream row**, exactly as it does on a draft, and the dedicated re-filing
browser check passes 26 of 26 including "pressing it reveals a real picker, as
visible pixels". The fault was in my probe, not the product. Settled, no
finding. (`node test/e2e-evidence/J4/probe-signed-keyterms.js`)

---

## 7. Technical appendix

### 7.1 Reproductions

| Finding | Command |
|---|---|
| §2.1 wording not frozen at first signature | `node test/e2e-evidence/J7/REPRO-wording-not-frozen-at-first-signature.js` (exits 1 when reproduced; prints the armed state and a positive control first) |
| §2.2 spend leak | `node test/e2e-evidence/J10/VERIFY-spend-leak.js` (exits 1 when reproduced) |
| §2.3 dark accent tokens | `--color-accent-700/-800/-900` absent from the `html.dark` block in `index.html`; `-300` is present. 35 rules consume them. |
| §2.4 template stream vs category | `server/server.js:9752` — `b.folder \|\| TPL_CATEGORY_FOLDER[t.category]`, never `t.folder`; `js/views/templatelib.js:357` sends no `folder`. |
| §2.5 English in the seal block | `js/views/contract.js:2200, 2219, 2221` and the counterparty's copy at `js/views/portal.js:4287`. |

### 7.2 Journeys I ran myself

```
node test/e2e-evidence/J8/j8-family.js               126/126
node test/e2e-evidence/J8/j8-surfaces.js              16/16
node test/e2e-evidence/J7/j7-signing.js               23/24
node test/e2e-evidence/J6/j6-review-wall.js           21/21
node test/e2e-evidence/J4/j4-money-and-filing.js      19/20 (the 1 was my probe, settled below)
node test/e2e-evidence/J3/j3-imported-paper.js        13/13
node test/e2e-evidence/J4/probe-signed-keyterms.js    8 rows on a signed contract, stream row present
node test/audit/sim-a-four-rounds.audit.js            26/26
node test/audit/sim-bc-amendment-and-people.audit.js  24/24
node test/audit/sim-d-server-attacks.audit.js         0 of 18 attacks succeeded
node test/audit/sim-e-email-live.audit.js             26/26
node test/audit/sim-f-word-import.audit.js            24/24
```

### 7.3 Browser files run

Green: `clause-door-verify` 87, `redline-verify` 90, `parity-verify` 40,
`competing-redlines-verify` 13, `settled-ask-reopen-verify` 12,
`reopen-a-refusal-verify` 15, `portal-header-verbs-verify` 29,
`counterparty-bell-verify` 23, `counterparty-reading-and-more-verify` 41,
`readonly-copy-verify` 11, `selection-verify` 22, `copilot-band-verify` 10,
`upload-party-verify` 14, `calendar-day-verify` 23, `nav-floats-verify` 69.

**Failing for stale reasons, each run to ground and recorded in `CLAUDE.md`:**

- `live-verify` 35/40. Four checks assert the author's reason is on the change
  card. It was deliberately moved to the clause panel on 19 Aug 2026 —
  `whyBlock` is a `return ''` stub — and the fact is pinned by f137 and f210,
  which both pass. A fifth check reaches "the other clause" via
  `[data-rl-cp-open]` and takes the last match; that attribute now has three
  emitters (clause pencil, card Open, co-pilot band row), so the probe re-opens
  the clause that already carries a draft. The product's `.nego-nofile` branch
  is present and correct.
- `queue-overlay-verify` 26/27. Measured: after the drag the right column sits
  at exactly **300px**, which is its stated minimum — the limit working. It
  fits 94px rather than 120px because the nav now rests open at 256px above the
  1500 line (20 Aug 2026), taking 192px off the page at this file's viewport.
  Reproduction: `node test/e2e-evidence/J5/probe-divider-limit.js`.
- `theme-tokens-verify`, `standard-paper-verify`, `six-round-audit` — the three
  the brief named as known and not regressions. I found no *different* reason
  for any of them.

### 7.4 The suite

```
Before: # tests 4101  # pass 4100  # fail 1   (f183, calendar-dependent fixture)
After:  # tests 4101  # pass 4101  # fail 0
```

### 7.5 Files changed in this pass

- `test/f183-the-panels-answer-for-themselves.test.js` — fixture anchored to a
  real calendar month (§3).
- `js/app.js` — a stale comment corrected to name its live caller (§3). No
  behaviour change.
- `CLAUDE.md` — the signature-freeze gap recorded as an open finding beside the
  rule it contradicts; a new section naming the three stale browser assertions.
- `E2E-VERIFICATION-REPORT.md` — this file.
- `test/e2e-evidence/**` — every reproduction script, raw log and set of notes,
  one directory per journey. The **screenshots are deliberately not committed**
  (193 files, 27MB): they are regenerated by running the scripts beside them,
  and the repository already keeps `test/chromium/shots/` out of version
  control for exactly that reason. Re-run any script to get its pictures back.
- `test/audit/shots/**` — refreshed by running the five audit simulations.

No other product code was touched.
