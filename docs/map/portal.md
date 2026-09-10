# HaTi — portal

*the counterparty's own pages and share links*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## NO CHANNEL BACK IS NOT READ-ONLY (14 Aug 2026 — owner-asked: "fix the word file import")

THE OTHER THING THE FIRST AUDIT SAID IT HAD NOT COVERED: the PASTE-A-CODE half of the owner's import box. It turned out half the product could not produce one.

A share link that cannot reach this server still has to be answerable, and the code is how — the reader copies it, sends it back by email or WhatsApp, the owner pastes it in. The owner's box says exactly that. But `portalRespond`'s SIGN / ACCEPT / CHANGES / DECLINE branch minted a code whenever the token was absent, while the DECISIONS / READY branch — answering each of the other side's asks, the commoner act and the one a negotiation link exists FOR — built the whole response object and threw it away with a toast. **So a counterparty with no route home could sign a contract but could not say "yes to clause 3, no to clause 7."**

AND THE DEEPER HALF, found by probing the page rather than the function: `renderShareWorkbench`'s `live` required the token, so with no link back the negotiation column was drawn READ-ONLY — no Accept, no Reject, nothing to press. The reader could not even record a decision, let alone send one. The refusal above could never have fired.
- REACH IS ITS OWN READING. `live = !portalReadOnly() && !signing`; `reachable = !!PORTAL_OPTS.token`. Their answers are held on their own page either way (`holdsDecisions`, and the wall line has always promised it), so being unable to reach us changes only HOW the answer travels. Reach still gates the two things that genuinely need the network: the discussion channel (it posts to a route) and `portalCanDerive`. Deciding is not one of them. `portalNegoFootHtml`'s own `live` dropped the token too — else the column offers Accept and the foot offers no Send.
- THE WALL LINE SAYS SO BEFORE THEY START (`po_wall_no_channel`), not after they press Send.
- ONE BUILDER, TWO SLOTS: `portalOfferResponseCode(p, response, label)`, called by both branches. The signing screen has a result column and fills it exactly as before; the workbench has no such slot, so the code arrives in a DIALOG — the same answer `openDerivedLinkDialog` gives to the same problem, and for the same reason NOT dismissable by a backdrop click: this is the one showing, and losing it loses the reader's answers. Escape and Done still close it.
- A CODE IS NOT A DELIVERY: the held decisions are NOT cleared on this path (a real send does clear them). Clearing would tell the reader the round had moved when nothing had left their browser.

Tests: f206 (10 — both branches, both slots, the backdrop rule, the live link proved unchanged, and a source check that there is one builder and not two copies of the markup), sim-f-word-import.audit.js (browser — the box, a junk code refused, the whole no-channel journey end to end, a wrong-contract code, a replay, and the API_MODE margin-comment path the first audit also left uncovered).

TWO OF THE ORIGINAL EIGHTEEN ATTACKS WERE FIXTURE FAULTS, NOT PRODUCT HOLES, and saying so is part of the record. D1 (a capped signer clearing the cap) wrote `{settings:{signCapOn:true}}` when the real shape is `{signCap:{on:true}}` and `PUT /api/settings` takes the body AS the settings object — so the cap was never armed and the "attack" walked through an open door. It was re-armed correctly and the hole WAS real, which is why the fix above is in. H2 (a held change pushed through the share route) was a fixture fault TWICE: first `c.review` seeded as a bare array when reviews live at `c.review.requests`, then seeded with a verdict, which the save route correctly refused with a 403. Armed correctly — an open review, no verdict — the wall strips the change, so H2 is disproven and reported as such. AN ATTACK THAT FAILS TO ARM READS EXACTLY LIKE ONE THAT SUCCEEDS, which is why every reproduction here asserts the STATE IT CREATED before it attacks it.

## THE CLOTHES FOLLOW THE BUILDER — THREE FIXES ON THE COUNTERPARTY'S PAGE (owner-asked 23 Aug 2026)

Three asks off one screenshot of their page, and the first two are the same fault in two costumes: **a control drawn by a shared builder was dressed by a rule scoped to ONE of the builder's homes.**

- **THE READING SWITCH WEARS THE NEGOTIATION PAGE'S DRESS.** rlReadSegsHtml has TWO homes — that page's 44px control bar and the counterparty's own `.pw-id` header — and the 22 Aug redesign wrote its treatment as `.redline-page .rl-readwrap`. Their copy fell through to the base rule and drew the grey pill group the tabs had replaced: MEASURED, 13px in a bordered box on `rgb(241,245,249)` with a white FILL on the live one, against the reference's 14px/700/accent and a 2px underline on nothing. **THIS IS THE SAME TRAP AS 15 Aug, ONE LAYER ALONG** — that day the base `.rl-segwrap`/`.rl-seg` rules were scoped the same way, their header rendered as one run of unstyled text, and the note recorded "the clothes follow the builder". The redesign then added a new dress and scoped it exactly as the old one had been. **THE HEIGHT STAYS `auto`**, which is what lets one dress fit both: stretch takes 44px on the bar and ~20px in their compact header, and pinning a number would push their header open.

- **AND UNSCOPING IS NOT FREE — IT DROPS SPECIFICITY.** The first attempt wrote a bare `.rl-readwrap`, which scores the same as line 1266's `.rl-segwrap` and LESS than the `.redline-page .rl-segwrap` beside it — so it dressed the counterparty correctly and handed the OWNER's tabs their grey box back. The wrap carries both classes, so `.rl-segwrap.rl-readwrap` scores level with the scoped rule and sits later in the sheet: it wins on both pages with no `!important`, which would win this fight and hide the next. **Caught by the browser file comparing the two pages against EACH OTHER rather than against a typed colour** — a literal would have passed.

- **MORE IS WHITE INSIDE, LIKE THE THREE BESIDE IT.** It carried `.pt-verb`, which fills the face with `--color-accent-100` (measured `rgb(204,251,241)`) while Ready to sign, Share a read-only copy and Decline are plain `.ui-btn` on nothing — so the least important control in the row was the only filled one. **THE CLASS IS DROPPED FROM THIS BUTTON, NOT CHANGED**: `.pt-verb` dresses the SIGNING screen's reading verbs and wears the accent for the reason this file records three times over (a neutral control there reads as furniture); gutting it to fix one button in another row would take that with it.

- **AND FOCUS MODE HAS A WAY OUT.** It stands their header down, and the header is where the More menu that turned it on lives — so there was no visible way back at all, only Escape. MEASURED: `.rl-focus-exit` did not exist on their page. It is the SAME button — same class, same data attribute — so it inherits the handler and the dressing rather than growing a second way to leave one posture; the LOOK is unscoped and each page keeps its own rule for WHEN to show it (`.rl-focus` there, `body.pw-focused` here), because those are different postures on different shells. Written the other way round their copy draws as an unstyled word in the corner, which is what the first attempt did. **BOTTOM RIGHT, OWNER-CHOSEN off three options** (match the negotiation page rather than give the two pages different corners). **THE COLLISION THAT PROMPTED THE OTHER TWO OPTIONS DOES NOT EXIST** and is now asserted rather than assumed: `.redline-page.rl-focus` hides the notices stack outright, and the counterparty's seat draws no floating bell at all.

- **AND NO BACKTICKS IN js/views/negotiation-css.js COMMENTS.** That stylesheet is returned from a JS template literal, so one ends the string and the file stops parsing — the same family as the swallowed-rule bug below, in the enclosing language rather than in CSS. The linter caught it the moment the note above was written.

Tests: counterparty-reading-and-more-verify (54 — every claim a RELATION read live off the owner's own page, never a literal: the wrap, the live segment and a resting one compared property for property, More compared against its three neighbours, the exit's corner and dress read off the negotiation page, the press proved to leave focus, and the notices overlap proved absent).

**AND THE NET HAD A HOLE, PAID FOR ON 24 Aug 2026 — IN THE SAME SESSION THAT
FIXED SOMEBODY ELSE'S INSTANCE OF IT.** f236 swept index.html and
negotiation-css.js and NOT the other view files, several of which also emit a
`<style>` block from inside a template literal. Writing the Contracts page's own
CSS comment, I put two backtick PAIRS in it — describing the very tokens the
rule is about. Balanced, so the file still PARSED; the words between them were
EVALUATED. **"Unexpected identifier 'dot'", the whole app dead at sign-in, and
27 of 69 browser files red**, almost all of them reporting nothing more useful
than "page.fill: Timeout" because the sign-in form never drew.

**THE NODE SUITE WAS GREEN THROUGHOUT**, which is the part worth remembering: it
loads modules, and this file parses. Only running the page finds it.

**WHY THE SWEEP IS NARROW AND NOT BLANKET**: 521 ordinary JS block comments in
js/ contain a backtick and every one is harmless, so banning them would be 521
false alarms. CSS never needs a backtick, so the rule is scoped to what a file
really EMITS between `<style>` and `</style>`. Two drafts were wrong before it
was trusted — matching the word "<style>" in PROSE flagged two comments in
negotiation.js that were describing the technique, and matching only two exact
spellings of the closing tag missed `</style>`);` in adviceportal.js and swept
that whole file as CSS. **Proved by reintroducing the bug and watching it fail.**
