# Jambo's journey — the personal HaTi plan (owner agreed, 22 Oct 2026)

> *"I want Hati to be personal as opposed to an enterprise solution. First
> thing after uploading a contract, jambo pops up to advise you IN VERY
> NATURAL AND PLAIN LANGUAGE and things you should push to redline or other
> to highlight in contract for review later when reading it. First asks who
> you are signing with and does the research for you to understand the
> counterparty."* — the owner, 22 Oct 2026.

- The journey, drawn as a flowchart (a contract that needs negotiating and
  one that just needs to go out): https://claude.ai/artifact/2py2p15X7GNDcRy1HGKVmP
- The build plan (each step against HaTi today, the eight tools, four rounds):
  https://claude.ai/artifact/5LRzJBNTDhhJqDgi69ZysW

Read this before touching what Jambo says on arrival, the party shelf's
history, or the road he recommends. The Six Questions, the Nine Flow Rules
and the one-page Home plan (docs/PLAN-one-page-home.md) still apply.

---

## 1. The rule

**One Jambo, and he speaks where he already lives.** Everything he says on
arrival goes into his panel beside the paper on Home, as turns in the one
conversation every Jambo box shares. No strip, band, banner or pop-up window.

**Every judgement is a reading first, words second.** "Push back on these",
"negotiate this", "I'd take it" are built from counts HaTi already has: the
risk list, your standards, your past deals, the ladder. They cost nothing and
come out the same every time. AI is spent only where a paragraph has to be
written, and on "why?" when a person presses it, cost shown first.

**Jambo prepares, you press.** Nothing he says sends, signs, files or writes
to the other side on its own.

## 2. The three decisions (owner, 22 Oct 2026)

1. **Jambo may speak first on arrival. Yes.** In his panel only.
2. **A party's name may go out as a plain web search. Yes.** A search to
   understand the company (website, news, what they do, size, where), each
   fact with its source and what could not be found said. **No credit
   rating, no register account, no paid report** (the owner: "this should be
   simple internet search to understand the company not the credit rating").
   Code-named deals stay walled off.
3. **The phone channel is browser push.** SMS and WhatsApp are not built.

## 3. The eight tools

| # | Tool | Round | Status |
|---|---|---|---|
| 1 | Counterparty lookup: a plain internet search | 3 | not built |
| 2 | The arrival turn: Jambo speaks first | 1 | **built 22 Oct 2026** |
| 3 | The road reading: negotiate it or just send it | 1 | **built 22 Oct 2026** |
| 4 | "I'd take it": a verdict on each of their changes | 2 | **built 22 Oct 2026** |
| 5 | Your phone: browser push | 4 | not built |
| 6 | Add to my own calendar (changed: see section 5) | 2 | **built 22 Oct 2026** |
| 7 | "Make it my standard", in his words | 2 | **built 22 Oct 2026** |
| 8 | Your history with them, in one line | 1 | **built 22 Oct 2026** |

## 4. Round 1, as built (22 Oct 2026)

- **When:** an UPLOAD's arrival reading finishes (`contractArrived` passes
  `arrival` → `triageAndPaint` → `firstReadOwe`, which stamps `sayOwed` on
  the reading's own record). Home's panel says the words when that contract
  is on the paper (`firstReadDue`, asked by `renderIntelDock` before the talk
  decides) and stamps `saidAt`: once per reading, never for a contract read
  before this existed, never for a contract drafted from our own paper.
- **What he says** (`firstReadOf` → `firstReadTurns`, js/triage.js, no AI):
  1. who the other side is and "Is that who you're signing with?" (or "Who
     are you signing with?" when the paper named nobody), your history with
     them (`partyHistoryOf`/`partyHistorySay`, js/views/customers.js: your
     own book only), and the brief's own line "In short: …";
  2. "N things I'd push back on now" (the risk list's high items and every
     departure from your standards), "Worth reading when you go through it
     yourself" (the rest), three shown and the rest counted, then the road:
     anything to push back on → negotiate, nothing → send, a signed paper →
     no road.
- **What each answer does** (`firstReadPress`): Yes says so; No / Name the
  other side turns the panel back to the Dossier and lands on the name
  (`pdFillOpen(id, {key:'counterparty'})`); Negotiate it opens the Redlines
  face (`CA_GO.redline`); Just send it answers with the share card his word
  "share" already answers with. The recommended road is first and the only
  filled button.
- **Tests:** f862 (red at the parent); test/chromium/jambo-speaks-first-verify
  (a real file through Jambo's drop area, the real arrival reading, every
  press, once across a refresh, the owner's three screens).

## 5. Round 2, as built (22 Oct 2026)

- **"I'd take it" (tool 4).** The verdict already existed but stood only in the
  clause panel. Now one line under each of their asks in Jambo's Redlines
  panel says it: Take it · Push back · Escalate · Read it, with the first
  reason, and "Why?" asks Jambo (one call). Where the playbook is silent the
  verdict reads how you answered this kind of ask before, from three answers
  up (`rlRowReadHtml`, `rlpJudge` → `rlpPastJudge`).
- **After the signature (tools 6 and 7).** Once, beside the Dossier of a
  contract signed in the last 14 days, Jambo says what it now asks of each
  side and when, the duties in the wording not yet on the record, and offers
  "Add to my own calendar" (a file for Outlook or Google) and "Show my
  calendar". Where your rounds keep settling a topic of this contract away
  from your standard, he offers the standards page's own proposal; "Show me
  the proposal" opens it there (`signedTurnOf`, js/jambopress.js).
- **Tool 6 changed, and the owner agreed** ("yes to the calendar file, merge
  round 2", 22 Oct 2026). HaTi's Calendar already shows every dated duty, so
  "put them in my calendar" inside HaTi would add nothing; the file for your
  own calendar is what was built.
- **He never snatches the panel** from someone working in it, never speaks
  over an open face or while an answer is on its way (round 1's fix).
- **Tests:** f863; test/chromium/jambo-round-two-verify.

## 6. What comes next

Round 3 (tool 1, the internet search), then round 4 (tool 5, browser push). Each
round is one change, photographed at the owner's three screens, with its
tests, before it merges.
