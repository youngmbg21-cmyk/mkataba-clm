# WORK ORDER — seven off a desktop sitting, 28 Aug 2026

**Raised by:** Young, 28 Aug 2026, over two messages and two screenshots —
the Insights → Portfolio *What needs attention* card with its pager ringed, and
the clause panel open on a clause whose heading cannot be edited.

**Branch this was filed on:** `claude/desktop-layout-ui-bugs-n4p7ha`.

**Status: NOT BUILT.** Filed for a later job on the owner's own instruction —
*"Review all these and save these for a later work job."* **Nothing in the
product was changed.** Every finding below is read off the source and is quoted
with its file so the next person can check it rather than take it on trust.

**Two of the five carry a warning and both are at the top rather than buried.**
Item 1 **reverses a decision the owner approved on 22 Aug 2026** — they have now
ruled on it in so many words (see *The owner's ruling* under item 1), so the
reversal is deliberate and on the record rather than something to rediscover.
Item 2 **could not be reproduced from the code**, and what was found says the
obvious explanation is probably the wrong one — it must be watched happening
before it is touched.

**THERE ARE NO OPEN QUESTIONS LEFT. All four were put to the owner on 29 Aug
2026 and all four were answered** — each is written into its own item and each
says *ruled* with the date. Do not re-open one; do not ask again.

**AND MAIN HAS MOVED UNDER THIS ORDER — READ *WHAT MAIN ALREADY DID* BELOW
BEFORE ANYTHING ELSE.** Two of the seven are finished: **item 4 SHIPPED on main**
on 28 Aug and **item 2 was FIXED there the same day**. Five remain. Item 4 is not
quite empty — it shipped without the counterparty rule, which has now been ruled
and is the one thing left of it.

**Item 7 was REVERSED on 28 Aug** — the merge was ruled against after it was
drawn, and the pencil now simply opens the existing editor page. **Its loose end
is closed too: the clause panel is RETIRED**, and main gave that panel a new
control in the meantime, so read item 7's own note before removing it.

**ITEM 1's OWN QUESTION IS CLOSED — see *THE SURPLUS STAYS GREY* inside item 1.**
Two earlier drafts of this file carried it as open, one of them after the owner
had already ruled on it. It is not open. The surplus beside the contract stays
as the page's own grey ground and the cards column does not grow into it.

**ITEM 6 IS NOT ONE OF THEM AND MUST NOT BE TURNED BACK INTO ONE.** It is
decided, it is independent, and an earlier draft of this file wrongly made it
conditional on item 1 — see the note inside it.

**THE PLAN HAS BEEN DRAWN AND IT RUNS.** Three screens with the doors between
them working, at
**https://claude.ai/code/artifact/c30df276-538f-4a02-aa17-645790c2e7e3**, source
committed at `docs/design/three-contract-screens.html`. It fills the reader's
window, so it is also the only place item 1's question can be LOOKED at rather
than reasoned about. **Read *THE PICTURES* below before starting anything** —
one of the three drawings recorded there shows a design that was ruled against,
and it is named so nobody builds from it by accident.

---

## The plain-English version, for the owner

Seven things, and they are seven different kinds of problem.

**Before the seven — the plan has been drawn, and it works.** There is a page
you can click through at
**https://claude.ai/code/artifact/c30df276-538f-4a02-aa17-645790c2e7e3**: the
Documents page, the Negotiation page and the Edit with Copilot page, with the
doors between them working the way this order says they should. A dark strip
along the top lets you jump straight to any of the three, and the product's own
buttons work as well. It fills your window, so if you drag the window wider you
will watch problem 1 happen in front of you. **Nothing in HaTi has changed** —
it is a picture that you can press, and it is there so you can look at the plan
before anybody builds it.

**1 — Screens do not use a big monitor.** You are right, and here is why.
Almost every page in HaTi has a maximum width written into it. On a laptop the
window is narrower than that limit, so you never meet it. On a desktop the
window is wider, so the page stops growing and the rest of the screen turns into
white space either side. **The Portfolio page is the one page in the product
with no limit at all**, which is exactly why it is the one that looks right to
you. So this is not a bug in one screen — it is one decision, taken about a
dozen times, that a later job has to take once. And one of the limits you are
pointing at is one **you chose yourself on 22 Aug**, so we should agree what
replaces it before anybody starts.

**And I have looked up the answer you asked for.** The pattern has a name and it
is SAP's own — they call it **letterboxing**, and their rule is that an app may
cap its width, but that **you must not let some pages cap and others not, if
people move between them**. That is precisely what HaTi does and precisely what
you are looking at: Portfolio opted out and the rest did not. So the real fault
is not that the pages are too narrow — it is that they disagree. **My
recommendation is to let everything that is not the contract fill your monitor,
keep the contract itself a readable page, and give the whole platform one
setting so no two screens can ever drift apart again.** The contract keeps a
limit because that one is not a matter of taste: a line of text longer than
about 80 characters measurably slows reading down, and on your desktop an
uncapped contract line would be roughly two hundred. On how other CLM companies
do it — I could not find anything I would repeat to you. Their screens are
behind a login and none of them publishes design guidance, so anything I told
you would be a guess with a brand name on it, which is worse than no answer.

**You have taken that recommendation, so item 1 is decided.** And the one small
thing left inside it — where the spare space beside the contract goes — **you
have ruled on too: it stays grey**, exactly as it looks today, and the
tracked-changes cards do not grow into it. Nothing about that split changes.

**2 — The redline losing its marks when you press Edit. FIXED, and it is off
your list.** I could not make it happen by reading the code, and what I found
said the obvious explanation was wrong: the tab had not moved, and what was
really happening was that turning editing on took the marks off **the one clause
you were editing**. **That is exactly what was fixed on main on 28 August** — a
clause with something on it now opens showing its marks, and the pencil is one
press away. You confirmed on 29 August that it has gone. Nothing to build.

**3 — The page jumping to the top.** Proven, and it is bigger than the button
you ringed. **Every filter on that page has the same fault**, not just the
pager. And there is already a helper in the app written to stop exactly this
from happening — nothing in the product calls it.

**4 — Editing a clause heading. BUILT — it shipped on main on 28 August.** You
can rename a clause, the rename travels to the other side as an ordinary tracked
change, it sits inside the tamper-proof seal, and accepting it keeps the clause
the same clause so nothing loses track of anything.

**ONE THING IS LEFT, and it is the question you have now answered.** It shipped
without a rule about the other side, and they use the same panel we do — **so
today they CAN rename our clauses**. On 29 August you ruled: **block it.** That
is a small change and it is the whole of what remains of item 4.

**5 — The notes panel a quarter wider.** Small, and it costs the page nothing —
that drawer floats over the page rather than pushing it aside, so making it wider
just covers more. Two things worth knowing. It is not one number but three: the
drawer is already set to different widths on a big monitor, a normal one and a
smaller laptop, and all three have to move together or it will be wider on some
machines and not others. And there is really only **one** drawer with three
faces — Notes, Alerts and Activity are the same panel showing different things.
**You ruled on 29 August: all three.** It is one object, and a reader has no way
to know why it would be wider on some days and not on others.

**6 — The three contract screens don't match.** You asked what the grey either
side of the contract is. **It isn't a style — it's nothing.** It's the page's own
background showing through, because the contract page stops growing at a set
width and sits in the middle of whatever room it was given. It's the same empty
space we've been discussing all along, seen from the other side.

The three screens that show a contract differ in **two separate ways**, and only
one of them is small. The Copilot page paints white behind the contract where the
negotiation page shows grey — that's a single line, and it's the grey you're
asking for. **The Documents tab is the bigger one: it doesn't sit still, it
magnifies the contract by up to double to fill the screen.** That is why it has
always looked the best to you. Making it match the negotiation page will make its
words **smaller** on your desktop, not bigger. That's the honest price and you
should hear it before I build it — though the A⁻/A⁺ size buttons already let you
choose the size yourself, which is arguably the better way round. **You have
said this twice and been told the cost, so it is decided — nobody should ask you
again.** It does not wait on anything else: built properly, all three screens
read one setting, so a later change to the negotiation page carries the other two
with it automatically.

**7 — The pencil takes you straight to the editor.** You looked at the drawing
and ruled against merging the two pages. So: **the negotiation screen stays
exactly as it is** — contract, cards on the right, read and answer, nothing typed
there — and **pressing the pencil takes you to the Edit with Copilot page** to do
the editing.

**This is much smaller than the idea it replaces.** You already cannot type on
the negotiation page; the only way in is the little panel that opens when you
press the pencil, and this simply sends that press to the editor instead. **Two
presses become one, and nothing on the page moves.**

**And the panel goes** — you ruled on 29 August. Its two writing buttons become
the pencil's job, its History belongs on the History tab, and the rest is already
on screen a few pixels away. **One thing to know before it is removed:** main
gave that panel a new box on 28 August, for renaming a clause. Nothing is lost —
the editor page has its own — but whoever removes the panel must check that
first.

**And one thing this does NOT reopen.** An earlier draft said reversing the merge
brought item 1's "cards or white space" question back to life. The cards do keep
that column at all times — but the question itself is answered: **the surplus
stays grey.** See *THE SURPLUS STAYS GREY* inside item 1.

---

## WHAT MAIN ALREADY DID — checked 29 Aug 2026, READ THIS BEFORE STARTING

**This order was written against main as it stood on 28 Aug and main moved
underneath it the same day.** Seventeen commits landed. **Each of the seven was
re-checked in the code on 29 Aug rather than assumed** — what follows is what was
found, with the commit named so the next person can look.

### TWO ARE FINISHED

- **ITEM 4 IS BUILT — `a5a62f5`, *A clause's name is part of the clause, and can
  be proposed on*.** Everything this order asked for and more: `negoEditClause`
  gained an optional `headingText`, absent means the filing says nothing about
  the heading (so no existing caller changed behaviour and there is nothing to
  migrate), the fingerprint went to **v5** with the heading inside it, and
  `clauseReplaceHeading` keeps the element, its rank and its id — which is the
  trap this order flagged, answered. **The section in CLAUDE.md is *A CLAUSE'S
  NAME IS PART OF THE CLAUSE*; read that, not item 4's own notes, which describe
  a problem that no longer exists.** What is left of item 4 is ONE rule, below.
- **ITEM 2 IS FIXED — `7e24ec7`, and CLAUDE.md's *THE PAGE NEVER OPENS IN A
  STATE THAT HIDES MARKS THAT EXIST*.** It is the same report and this order's
  own diagnosis turned out to be right: the reading never moved; what moved was
  that a clause opened TYPEABLE, and a typeable box shows the draft, so the one
  clause the reader was looking at was the one clause with no marks. The fix is
  `_ceEditing = _ceText === _ceBase && _ceHead === _ceHeadBase` — a clause with
  nothing on it opens typeable, a clause with something on it opens showing its
  marks. **The owner confirmed on 29 Aug that it has gone.** Item 2 is closed.

### FIVE ARE UNTOUCHED, AND THIS WAS MEASURED RATHER THAN ASSUMED

- **Item 1** — the caps are where this order found them; `--room-measure` is
  still three occurrences in index.html.
- **Item 3** — `keepScroll` in js/app.js still has **zero callers**. (There is a
  local `_keepScroll` object in js/views/negotiation.js; it is a different thing
  and is not this.)
- **Item 5** — `--shell-panel-w` is still 264 / 292 / 320.
- **Item 6** — `.ce-paperwrap` still sets `background:var(--color-surface)`, so
  the Copilot page still paints white where the negotiation page shows grey.
- **Item 7** — `rlClauseEditPillHtml` still defaults its attribute to
  `data-rl-cp-open`, so the pencil still opens the clause panel.

### AND ONE THING CHANGED SHAPE — ITEM 7 HAS A NEW FACT UNDER IT

**Main gave the clause panel the rename box** (`.rl-cp-clname`), and the pencil
is that panel's only door. So item 7 — pencil straight to the editor — now
strands a panel that had just gained something. **It was put to the owner on
29 Aug with that fact stated, and the ruling is unchanged: the panel goes.**
Nothing is lost, and it was checked rather than asserted: work mode types the
name on the paper itself (`#ce-clausehead`), the live asks are the cards column
twelve pixels away, and History is the room's own tab.

### WHAT ELSE LANDED, so nobody reads a screen and thinks this order missed it

Front matter became a region that can be proposed on (`497fec8`); work mode was
rebuilt to the owner's own prototype and lost its header (`a7d4acc`); the writing
bar arrived and the reason step was retired, so a change files in one press
(`5afafdd`, `6e46e5a`); the Changes tab was built and then deleted on the owner's
ask (`7e24ec7`). **None of these is in this order and none of them should be
re-litigated here** — they are recorded in CLAUDE.md under their own headings.

---

## THE PICTURES — what was drawn in this sitting, and what each one is evidence for

**Three things were drawn while this order was being written, and none of them
is code.** Nothing in the product changed. They are recorded here because two of
them settled a decision that is now written into this file, and because a
reference somebody cannot find is a reference that does not exist.

### 1 · THE WALKTHROUGH — the accepted plan, as a working page

**https://claude.ai/code/artifact/c30df276-538f-4a02-aa17-645790c2e7e3**
**Source: `docs/design/three-contract-screens.html`** (committed beside this
order, on the convention `card-opens-out.html` and `negotiate-moves-out.html`
already set in that folder).

Three screens with the doors between them working: **Documents → Negotiation →
Edit with Copilot**. It draws the plan as items 6 and 7 leave it — the
negotiation page purely for review with the cards on the right, the pencil going
straight to the editor, and the editor showing the WHOLE contract with the
pressed clause marked live and the Copilot rail running floor to ceiling.

**How to move around it**, because the first attempt was reported as unusable:

- A dark **step strip** along the top — *1 Documents · 2 Negotiation · 3 Edit
  with Copilot* — always present, one press from anywhere. **That strip is
  prototype furniture and is not part of the design.** It exists because the
  product's own doors (a button in a tab row, a pencil on a clause) are easy to
  miss on a drawing, and a screen nobody can reach is a screen nobody reviewed.
- The product's own doors work too: *Open Negotiate* on the Documents tab,
  *Negotiations* in the sidebar, the pencil on any clause heading, *Edit* on any
  card, *Back to negotiation* at the top of the editor.

**IT FILLS THE READER'S WINDOW, AND THAT IS DELIBERATE — it is the only
demonstration of item 1 that exists.** The strip prints the current window width
in its right-hand corner. Widen the window and the sheet stops growing at 860px
while the cards column stays at 460, so the paper sits in a widening field of
grey; narrow it and everything closes up. **That grey is the ANSWER rather than
the question** — see *THE SURPLUS STAYS GREY* under item 1, ruled 28 Aug — so
what this drawing now shows is the decision, not a choice still to be made.

**WHAT IT IS AND IS NOT.** Its markup is a hand-built mock, not HaTi's own
renderers. **So it is a specification of ARRANGEMENT, never of pixels**: what
sits where, what is reachable from what, and what each screen is FOR. Do not
lift measurements out of it and do not treat a difference between it and the
running product as a defect in either. Every colour, type size and spacing in it
was lifted from HaTi's own `:root`, so it should read as the same product — but
the authority on a number is the source, not this file.

**HOW IT WAS CHECKED**, because a drawing nobody drove is a drawing that lies:
it was opened in a real browser and every door was pressed — the tab-row button,
the pencil, a card's Edit, all three step buttons and *Back to negotiation* —
with the visible screen read back after each press; the Copilot rail was
measured as starting at the same vertical as the page area itself (floor to
ceiling, which is the thing this page had already got wrong twice); and the
whole page was resized to 1280, 1512 and 2200 with no sideways scroll at any of
them.

### 2 · THE SPARE-WIDTH EXPLAINER — the question it argues is now ANSWERED

**https://claude.ai/code/artifact/3f3bc369-519f-4fba-9554-c0790f4b20c2**
*"Where the Spare Width Goes"*

**READ IT AS HISTORY, NOT AS A LIVE CHOICE.** It sets out both sides of *should
the spare width go to the tracked-changes cards, or stay as white space beside
the contract?* with the measured numbers behind each. **The owner has since
ruled: the surplus stays grey** (see *THE SURPLUS STAYS GREY* under item 1), so
its second option is the decision and its first is not on the table.

**It has not been rewritten and should not be** — the same reasoning as the
merge render below: a drawing that helped settle a decision is part of the
record of that decision. **What it is still good for** is the measurements: the
walk between a clause and its card at each window width, which is the one
consequence of the ruling anybody may need to look at again.

### 3 · THE MERGE RENDER — a design that was RULED AGAINST

**https://claude.ai/code/artifact/b0d1145f-d0ff-4425-bcdb-4fe7a78054aa**

**DO NOT BUILD FROM THIS ONE.** It draws item 7's ORIGINAL proposal — the
negotiation page becoming the editor, with Copilot sliding over the cards — and
the owner ruled against it after seeing it. It is kept, and named here, for the
reason item 7 already gives: *the render earning its cost*. A drawing that
changed a decision is part of the record of that decision, and deleting it would
leave item 7's reversal resting on nobody's word but mine.

**IT HAS NOT BEEN REDRAWN TO THE ACCEPTED PLAN**, and it should not be — the
walkthrough above is that. If anybody opens it cold, the middle frame will
contradict this order.

### ONE NOTE FOR WHOEVER DRAWS THE NEXT ONE

**The first version of the walkthrough was built on the design-canvas tool and
reached the owner as a single flat picture.** That tool only becomes a live,
clickable page where canvas saving is enabled for the viewer's account; where it
is not, the reader gets a view-and-export preview. **It is not enabled for this
owner.** The working version is an ordinary HTML page with about thirty lines of
plain JavaScript. Reach for the plain page when the point is *press this and see
what happens*.

---

## 1 — A DESKTOP GETS A LAPTOP'S PAGE

> *"Many pages in the app shrink when I am in a desktop which does not give me
> the same view as when I am on a laptop. Can is when in documents page it looks
> great but when I am in the negotiation screen the the contract shrinks. Review
> this ACROSS the platform and ensure that even when on desktop I am getting a
> full screen experience like in the Portfolio page."*

### What is actually there — measured off the source

Page-level width caps, as written today:

| Where | Cap | Written at |
| --- | --- | --- |
| The contract sheet on the negotiation page | **860px** | `js/views/negotiation-css.js` — `.redline-page .rl-paper{…max-width:860px}` |
| The contract sheet on the Document tab | **860px** | `js/views/contract.js` — `const COL='width:100%;max-width:860px;…'` |
| Key terms · Signing · History | **1440px** | `--room-measure` in `index.html`, read by `.terms-grid`, `.sign-grid`, `#ws-history-pane` |
| The Negotiations list | **900px** | `.ngl-wrap` in `index.html` |
| People directory, template library, the counterparty's page | **860px** | their own view files |
| Insights → Negotiation friction (left column) | **78ch** | `js/views/intelligence.js` |
| **Insights → Portfolio** | **none** | `portfolioFrameHtml` sets no page width at all |

**THAT LAST ROW IS THE WHOLE REPORT.** The owner's reference page is the one
page that never had a cap. Nothing is broken; a dozen separate decisions simply
do not agree with each other, and none of them shows on a laptop.

### The one thing to be careful of, and it is the reason this is not a quick fix

**The negotiation page's 860 is an owner-approved decision from 22 Aug 2026 and
it is written down with its reasoning** (CLAUDE.md, *THE NEGOTIATION PAGE TAKES
THE MOCK-UP*, and the long note above `rlLayoutResizer`). The working area on
that page already runs the page's full width — that was fixed the same day, off
a report that the cards were leaving a dead strip on the right. What was
deliberately kept is that **the SHEET centres inside its track at
`RL_SHEET_MAX`**, on the argument that *a line of an agreement has a length past
which it stops being readable*, which is what a document reader looks like
anyway.

So the owner is asking to reverse that, and **the reversal has a real cost that
must be put to them in one sentence before it is built**: on a 2560px monitor an
uncapped sheet gives a line of contract wording roughly 1,900 pixels long, which
is about 200 characters — two and a half times what typography considers
readable, and about three times what the printed contract will be.

**THERE ARE THREE HONEST ANSWERS AND THE OWNER PICKS ONE**, per page or across
the platform:

1. **Uncap the CHROME, keep the PAPER.** Every page of the product — lists,
   cards, panels, settings — fills the monitor; the contract sheet alone keeps a
   readable measure. This is what most contract software does and it is the
   cheapest to build, because it touches no document renderer.
2. **Raise the cap rather than remove it.** One number for the whole platform
   (`--page-measure`), somewhere around 1440–1600, replacing the twelve
   different numbers above. Nothing fills a 4K monitor but nothing looks lost on
   a 27-inch one either.
3. **Uncap everything, paper included.** What was literally asked for. Say the
   line-length cost out loud first.


### THE ANSWER, RESEARCHED — 28 Aug 2026, on the owner's ask

> *"I am not a developer so find me the best practice for user experience when
> switching from laptops, which we have already worked on, to desktop
> experience. How do other CLM companies manage this?"*

**THE PATTERN HAS A NAME, AND IT IS SAP'S OWN.** Fiori — the design system this
rulebook already names as HaTi's reference — calls it **letterboxing**: capping
the content area so an app does not stretch on a wide screen, with the surplus
left blank either side. **Fiori's own number is 1280px.** Its guidance is that
letterboxing is right where *"there is too little content on the UI to require
using the full width of the screen, or the content cannot respond to large
differences in size, and stretching the app would distort the content and lead
to poor usability."*

**AND FIORI'S NEXT SENTENCE NAMES HaTi'S ACTUAL FAULT.** It says letterboxing
may be set per app OR per page — and then: *if a user frequently navigates
between two apps or pages, **avoid changing between letterboxing and full screen
settings***.

That is exactly what this product does. Portfolio is full screen. The Document
tab and the negotiation page are letterboxed. The owner moves between them all
day. **So the complaint is not that pages are capped — it is that they do not
agree with each other**, and the reference page in the report is simply the one
that opted out. This reframes the whole item: the fix is CONSISTENCY first and a
number second.

**THE GENERAL PRACTICE OUTSIDE SAP AGREES ON THE RANGE.** 1200–1400px, with
1140–1280 the usual choice for a 1920-wide monitor — the lower end for text-heavy
screens, the upper end for visual-heavy ones. HaTi's `--room-measure` of 1440 is
already at the top of that band; its 860s are far below it.

**AND THE PAPER'S CAP IS THE ONE NUMBER IN THIS WHOLE ITEM WITH RESEARCH UNDER
IT.** Bringhurst's rule is 45–75 characters to a line; the modern consensus is
50–75 with about **66 optimal** and 80 a hard ceiling, and it is supported by
eye-tracking work rather than taste — past that, the eye loses the start of the
next line. **So the sheet keeps a cap.** Whether 860px is currently the RIGHT
cap is a separate question and should be **measured, not argued**: count the
characters on a full line of a real contract at the default type size. If it
comes out above 80 the sheet is already too wide and the honest change is
narrower, not wider.

### WHAT I COULD NOT VERIFY, AND WILL NOT INVENT

I searched for how Ironclad, Icertis and DocuSign CLM lay out their redline
screens on a wide monitor and **found nothing I can stand behind.** The public
material is feature and pricing comparison; the editors themselves sit behind a
login, and no vendor publishes interface guidelines the way SAP does.

This rulebook's own rule applies and is being kept: **a made-up fact about a
named product is worse than no answer, because a brand name ends an argument
that ought to be had.** If the owner wants a real comparison the way to get it
is a trial account and a screenshot at 2560px, not a search.

**WHAT CAN BE SAID WITHOUT INVENTING ANYTHING** is the shape every
document-and-panel tool in daily use takes, and it is checkable on any machine
in five seconds: **the page of paper keeps a fixed, readable width and the space
around it grows.** Word and Google Docs both do this — widen the window and the
page does not widen with it. HaTi already works this way. The part HaTi does not
do is let everything that is NOT paper fill the screen.

### THE RECOMMENDATION — OPTION 1, WITH ONE NUMBER

**Uncap the chrome, keep the paper, and give the platform ONE measure so no two
pages can disagree.** Three reasons, in order of weight:

1. **It fixes the fault the owner is actually looking at.** Fiori names
   inconsistency between pages as the thing to avoid, and that is what is on
   screen — not a cap that is too small.
2. **It is the only option with evidence on both halves.** The chrome has
   nothing to lose by filling a monitor; the paper has a measured reason not to.
3. **It is the cheapest and the safest.** It touches no document renderer, so
   nothing that draws a contract, a redline, an export or the counterparty's
   copy can be broken by it.

**WHAT THE OWNER WOULD SEE:** every list, card, panel, filter row, settings page
and report fills the monitor; the contract itself stays a readable page with more
room around it.

**AND ONE THING TO DECIDE ALONGSIDE IT, because it is probably what "full screen
experience" really means on the reported page:** on the negotiation page the
surplus currently goes to WHITE SPACE beside the sheet. It could go to the CARD
COLUMN instead — that is a change to the resting split (`RL_RIGHT_W0`), not to
the sheet, and it is where a wide monitor is actually useful on that screen. Put
it to the owner as its own question.

**Sources for the above:** SAP Fiori letterboxing guidance
(experience.sap.com/fiori-design-web — *Letterboxing*), the 1200–1400 enterprise
range (css-tricks.com, *Optimizing for Large-Scale Displays*), and the line-length
research (baymard.com, *Readability: The Optimal Line Length*; uxpin.com, *The
50–75 Character Rule*).


### THE OWNER'S RULING — 28 Aug 2026

> *"I will take your recommendation."*

**OPTION 1 IS TAKEN. Build it: uncap the chrome, keep the paper capped, and give
the platform ONE measure.** The reversal of the 22 Aug decision is therefore
deliberate and on the record — **the negotiation page's sheet keeps its cap**,
which is the half of that decision that was ever load-bearing; what changes is
everything around it.

**THE THREE THINGS THAT MAKE THIS BUILDABLE WITHOUT ANOTHER CONVERSATION:**

1. **ONE TOKEN, AND EVERY PAGE READS IT.** `--room-measure` (1440) is the
   precedent and is already at the top of the researched band; the sensible move
   is to rename it to something that admits it governs the whole platform and
   point the 860s, the 900 and the 78ch at it — or to remove the cap outright on
   the pages that are pure chrome. **Whichever, the answer is ONE declaration**,
   so the next retune is one line and no two pages can drift apart again.
2. **THE PAPER IS THE EXCEPTION AND IT IS NAMED.** `.rl-paper` and the Document
   tab's own column keep a measure of their own. **Write down beside each that
   it is deliberately not the platform measure**, or the next sweep takes it.
3. **MEASURE THE PAPER BEFORE ASSUMING 860 IS RIGHT.** Count the characters on a
   full line of a real contract at the default type size. Above 80 and the sheet
   is already too wide — the honest change there is narrower, not wider, and it
   is a separate decision from this one.

### THE SURPLUS STAYS GREY — RULED 28 Aug 2026, DO NOT ASK AGAIN

> *"We said the space on the right and left should be grey"* — with a screenshot
> of the negotiation page at a wide window, the contract sheet centred and the
> page's own grey ground showing either side of it.

**THE ANSWER IS: LEAVE IT.** The surplus beside the contract stays as the page's
own ground. **The card column does NOT grow into it** — `RL_RIGHT_W0` stays at
460, the resting split is untouched, and nothing about the negotiation page's
two columns moves.

**AND THIS ORDER CARRIED THE QUESTION AS OPEN TWICE AFTER IT HAD BEEN
ANSWERED**, which is why the ruling is written out here rather than noted in
passing. It was put to the owner, answered, and asked again in a later summary.
**It is closed.**

**WHAT THAT GREY IS**, since item 6 answers the same question from the other
side: it is not a colour anybody chose for that gap. `.rl-doc` paints nothing,
so what shows through is `--color-bg`, the page's own ground. Keeping it means
writing NO rule — which is what makes this the cheapest of the two answers as
well as the chosen one.

**THE ONE CONSEQUENCE, STATED ONCE AND NOT RE-ARGUED.** Item 1 uncaps the
chrome, so on a wide monitor the working area gets wider while the sheet stays
at 860 and the cards stay at 460 — so the gap between a clause and its card
grows with the window. **MEASURED**: about 163px of walk at 1920 and about 483px
at 2560. That was the case against, the owner has seen the page and ruled, and
the decision is theirs. **If it ever bites, the fix is not to widen the cards** —
it is to cap and centre the working area so sheet and cards travel together and
the surplus falls OUTSIDE the pair. That is a different change and would want
its own ask.

**WHAT IS NOT DECIDED BY THIS**, so nobody reads it too wide: it says where the
SURPLUS goes on the negotiation page. It does not touch the divider (the reader
still drags it), its two minimums, or `RL_SHEET_MAX`. And it does not license
capping the chrome on other pages — item 1's ruling still stands everywhere
else.

### Notes for whoever builds it

- **THE TWO SHEETS ARE ALREADY THE SAME NUMBER (860), so "documents looks great
  and negotiation shrinks" is NOT explained by the caps and must be measured on
  the owner's own screen before a number is changed.** The likeliest reading is
  that the negotiation page's sheet sits in a track that also holds a 460px card
  column, so it is offset and surrounded by more visible dead space — the same
  cap reading as a smaller page. **Get a screenshot at the owner's real
  resolution with a ruler on it.** This rulebook's own standing rule applies:
  *measure before you fix, even when the report is your own.*
- **`--room-measure` (1440) IS THE PRECEDENT TO FOLLOW, not to add to.** It was
  introduced on 25 Aug for exactly this problem on the contract room's four
  tabs, whose three different caps made one contract read as three
  differently-sized pages. Whatever number wins should be **one token every page
  reads**, so the next retune is one line.
- **DO NOT SWEEP THE COUNTERPARTY'S PAGE IN PASSING.** `js/views/portal.js`
  carries the same 860 in three places, and that page is read by people outside
  the building on unknown screens. It is its own decision and it is not in this
  ask.
- **NOR THE STANDALONE DOCUMENTS.** `js/views/healthreport.js` and
  `js/views/weekly.js` open their own windows and carry no `:root`, so a token
  there resolves to nothing.
- **THE SIX QUESTIONS APPLY** (CLAUDE.md), and question 3 in particular: measure
  the pixels above the first line of the agreement before and after on every
  screen that draws it.
- **NETS:** `pages-read-alike-verify` is the file that already sweeps every page
  and compares them to each other, so the claim belongs there written as a
  RELATION (every page reads one measure) rather than as a number.
  `laptops-verify` must stay green — whatever is done for the desktop may not
  cost the laptop anything.

---

## 2 — THE REDLINE PAGE SHOWING CLEAN TEXT AFTER PRESSING EDIT

> **CLOSED — FIXED ON MAIN, 28 Aug 2026 (`7e24ec7`), owner-confirmed 29 Aug.**
> **Nothing here is to be built.** The whole section below is kept because its
> reasoning was right and is worth reading: it said the reading had not moved and
> the fault was in what the paper draws when editing turns on, and that is
> precisely what was wrong. See CLAUDE.md, *THE PAGE NEVER OPENS IN A STATE THAT
> HIDES MARKS THAT EXIST*, and *WHAT MAIN ALREADY DID* above.

> *"Redline page, should always show you the redline. Currently while on the
> page and click the edit button it changes to as agreed even though you have
> not moved to the as agreed page."*

### DO NOT START BY CHANGING THE READING. Here is why

The reading — *Redlined / As agreed / With changes* — is one value, `_rlRead` in
`js/views/negotiation.js`. **It has exactly two writers in the entire product**,
and this was swept rather than assumed:

- `rlSetReadMode(v)`, which is only ever called from a press of an element
  carrying `data-rl-read` (the three tabs themselves, and the "back to redlined"
  button on the reading band); and
- `negoResetView()`, which resets it to `'marks'` when the page is left.

The tabs are drawn from `rlReadMode()` at every paint (`rlReadSegsHtml`) and
repainted from it by `rlPaintReadSegs`, so **the tab cannot say one thing while
the value says another.** No Edit control anywhere writes to it.

**So the reading almost certainly did not move, and the fault is in what the
PAPER draws when editing turns on.** Two candidates, and they are the same
complaint in two different places:

**(a) The clause editor page** (`js/views/clauseeditor.js`). Pressing the pencil
flips `_ceEditing`, and `ceRenderPaper` then draws that one clause as plain
LINES so it can be typed into — no marks, by design, because a clause carries
one sub-paragraph per line and that is what gets read back at filing time. Every
other clause keeps its marks. **On a contract where the clause being edited is
the only changed one, the whole document then reads as clean** — which is
precisely "it changes to as agreed".

**(b) The negotiation page's own inline clause editor** (`data-nego-edit`). It
replaces the clause with an editable box seeded from `negoClauseNowById` — "what
stands", i.e. the wording with adopted changes folded in. That is *literally* the
As-agreed reading of that clause, drawn while the tab says Redlined.

### What to do, in this order

1. **REPRODUCE IT AND SAY WHICH BUTTON.** There are at least three "Edit"
   controls in play — the pencil on a clause, the `Edit` verb on a tracked-change
   row, and the pencil inside the clause editor page. Get the owner to point at
   the one they pressed, and note whether the **tab** moved or only the
   **document**. Those are two different bugs.
2. **If the tab did not move** (expected), the question is not "why did the
   reading change" but **"should turning editing on take the marks off the clause
   at all, and if it must, what says so?"** The product already has the shape of
   an answer: the reading band (`rlReadNoticeHtml`) exists to stop a document
   silently disagreeing with the control above it. A one-line note beside the
   clause being typed in — *you are editing this clause; its marks are off while
   you type* — is the cheap fix and needs no renderer change.
3. **If the tab really did move**, then something is dispatching a press on a
   `data-rl-read` element, and the two delegated listeners are where to look:
   `js/views/negotiation.js` (on `document`) and `js/views/clauseeditor.js`
   (which stops propagation deliberately so the first does not fire twice).
   **That stopPropagation is load-bearing — do not remove it.**

### Notes for whoever builds it

- **THE READING IS THE PRODUCT'S, NOT ONE PAGE'S.** Three surfaces draw it — the
  negotiation page, the clause editor page and the counterparty's header. A fix
  that gives one of them a private copy is how they come to disagree about what
  "As agreed" means, which is the fault the one-builder rule exists for.
- **`ceEditableReading()` IS THE ONE PREDICATE** for "does this reading allow
  editing", and it is asked by the pencil, the caret and Apply. Anything added
  here asks it too rather than testing the mode again.
- **NETS:** `clause-editor-verify` section 12 already drives the three readings
  and the pencil for real; whatever this turns out to be belongs there.
  `redline-verify` sections 16 and 17 hold the reading-is-not-a-working-posture
  claims.

---

## 3 — A CONTROL INSIDE A PAGE THROWS THE READER TO THE TOP

> *"Image 1, when i click on the highlighted button the page jumps me to the top
> of the screen. Fix and make a rule that and in any other area where this is an
> issue."*

**This one is proven from the source and it is wider than the button in the
screenshot.**

### The cause

The pager under *What needs attention* calls `renderIntel()`
(`js/views/portfolio.js`, the `[data-pf-find-page]` handler). `renderIntel`
rebuilds the whole Insights view, and replacing a scrolled container's contents
clamps its `scrollTop` to 0 on the intermediate paint. The reader is at the
bottom of a long page, presses `›`, and lands back at the top.

### It is not one button — it is every control on that page

`wirePortfolioFrame(rerender)` gives **every** filter on the Portfolio page the
same `again()`, and on Insights `again` **is** `renderIntel`. So the same jump
happens on:

- the pager (`data-pf-find-page`) — the reported one;
- the category filter (`data-pf-cat`);
- the counterparty filter (`data-pf-cp`);
- each un-filter chip (`data-pf-unfilter`) and *Clear* (`data-pf-clear`);
- the four Insights tabs (`data-ig-tab`, four separate bindings in
  `js/views/intelligence.js`);
- *Clear* on the friction filter (`ig-friction-clear`);
- *Today* on the calendar (`cal-today`, `js/views/calendar.js`).

### THE HELPER ALREADY EXISTS AND NOTHING CALLS IT

`keepScroll(fn)` is in `js/app.js`, does exactly this job, and is published on
`window`. **It has zero callers in the entire product** — swept; the only two
hits are its own definition and its export line.

That is this codebase's own most-repeated defect wearing its other face. The
`rlPaperFootHtml` family is a name that was never published and so was never
reached; this is a name that IS published and that **nobody ever reached for**.
Worth saying in the commit message, because `f232`'s sweep is built to catch the
first kind and cannot catch this one.

### The rule the owner asked for

**A PRESS THAT NAVIGATES MAY LAND AT THE TOP. A PRESS THAT FILTERS, PAGES,
SORTS OR TOGGLES MAY NOT MOVE THE READER'S PLACE.**

**This is not a new rule — it is an existing one that was never applied inside a
page.** `setView` has enforced it at the view level since it was written, in its
own words: *"Arriving on a DIFFERENT view starts the reader at the top;
re-entering the SAME view must leave them exactly where they were."* Every
in-page repaint is the same case, and each one currently re-decides it by
accident.

**How to make it hold, rather than trusting everybody to remember:**

- **ONE HELPER.** Every same-view repaint fired from a control goes through
  `keepScroll`. Never a second copy — the two-frame restore in it is there
  because the intermediate paint is shorter than the final one, and a hand-rolled
  version will get that wrong.
- **AT THE FUNNEL, NOT AT THE PRESS.** The Portfolio page has one `again()` and
  Insights has one `renderIntel` — wrap those, not the eleven handlers. Eleven
  wrapped presses is eleven places for the twelfth to be forgotten.
- **THE INNER SCROLLERS ARE A SEPARATE QUESTION AND MUST BE ASKED.** The
  findings list has its own scroller (`.pf-find-scroll`, capped at 392px). On a
  **pager** press it is right for that list to start at its top — it is a new
  page of rows. On a **filter** press it is arguable. Decide it once and write
  down which, or the two will drift.
- **THE NET.** A test that fails on a same-view repaint called from a click
  handler without `keepScroll`, in the shape `f232` already uses for its
  window-read sweep — the point being that a rule living in prose alone holds
  until the first person who does not read it, which is this rulebook's own
  recorded experience.
- **AND A BROWSER FILE, because only a browser can answer it.** Scroll the
  Insights page to the bottom, press `›`, read `#content-scroll.scrollTop` back.
  jsdom lays nothing out and will pass either way. Run it against the parent
  commit first and watch it report the jump, or it is a description rather than
  a test.

### Notes for whoever builds it

- **DO NOT SWEEP `js/views/settings.js`.** It writes `scrollTop=0` deliberately
  (`openSettingsAt`), because everything arriving through that function is a
  navigation with a name on it and landing at the bottom of a page you have just
  asked to be shown reads as a broken page. That is the rule agreeing with
  itself, not an exception to it.
- **DO NOT SWEEP THE SETTINGS PAGE'S PATCH-IN-PLACE RULE EITHER.** *THE SETTINGS
  PAGE HOLDS STILL* in CLAUDE.md is a stronger answer to the same problem —
  never re-render at all — and it stays.
- **`js/views/negotiation.js` ALREADY HAS ITS OWN** `_keepScroll` map and
  `rlRestoreScroll`, for the panes inside that page. That is a different job (many
  inner scrollers, not the page) and is not this.

---

## 4 — A CLAUSE'S HEADING SHOULD BE EDITABLE TOO

> **BUILT ON MAIN, 28 Aug 2026 (`a5a62f5`).** The feature this item asks for
> exists, and it went further than this order specified — the fingerprint moved
> to v5 with the heading inside it. **Read CLAUDE.md's *A CLAUSE'S NAME IS PART
> OF THE CLAUSE* rather than the notes below**, which describe a gap that is
> closed. The five dangers this order listed were all answered; the id-on-the-
> heading trap in particular is handled by `clauseReplaceHeading`, which rewrites
> the words and keeps the element, its rank and its id.

### THE COUNTERPARTY MAY NOT RENAME OUR CLAUSES — RULED 29 Aug 2026

**This is the only part of item 4 still to build, and it is a REMOVAL of
behaviour that is live today rather than a new feature.**

This order predicted it in its own words — *"their screen uses the same panel, so
unless we say otherwise, they will be able to"* — and that is exactly how it
shipped: **no seat rule was added.** MEASURED on main: the rename box is drawn
inside the clause panel's editor, both seats mount that panel, and f249's own
test 9 files a rename with `side:'counterparty'` and asserts it travels. So the
other side can rename our clauses on main today.

> **THE OWNER'S RULING, 29 Aug 2026: block it.** Only our side may propose a new
> name for a clause. **Their ability to propose new WORDING is untouched** — that
> is what their page is for and nothing here narrows it.

**NOTES FOR WHOEVER BUILDS IT.** Ask it in ONE place, not at each screen — the
funnel is where a rule that must always hold belongs, and this order's whole
first rule is that the same thing is drawn in several places. The box should not
be DRAWN on their seat either (a control whose only outcome is a refusal is
furniture, which is this codebase's own standing rule), but the drawing is the
sign and the model is the wall. **And check what a rename already in flight does
on their copy**: a rename WE propose still has to draw and still has to be
answerable there, so this narrows who may CREATE one, never who may see or
decide one.

> *"When I want to edit a clause, you should have the ability to also edit the
> header of the clause if you want to. The headers should be included in
> editing."*

Reported with a screenshot: the clause panel open on **2. Term and Termination**,
its heading drawn as a read-only title above **AS IT STANDS**, and the editable
box holding the body paragraphs only.

### The good news — the model already treats a heading as a first-class thing

`clauseSegment` (`js/clausemodel.js`) already returns, per clause: `headingHtml`,
`headingText`, `num`, `title`, `bodyHtml` and `text`. Nothing has to be invented
to know what a heading IS.

**And `negoInsertClause` ALREADY CARRIES A `headingText` ON THE CHANGE IT FILES**
— a proposed NEW clause names its own heading today. So the change object's shape
already has a precedent for carrying one; a `modify` simply never sets it.

What is missing is one link: `negoEditClause(c, clauseId, newBodyHtml)` takes a
BODY and nothing else, and files `oldText`/`newText` as that body's text.

### FIVE THINGS THE HEADING CARRIES THAT THE BODY DOES NOT — read all five first

1. **THE CLAUSE'S ID LIVES ON THE HEADING ELEMENT.** `data-clause-id` is an
   attribute of the `<h2>` itself. So the heading ELEMENT has to survive an edit
   with its attribute intact — only its TEXT may change. An editor that replaces
   the heading with a fresh element silently detaches every change, every tag on
   the paper and every history row from the clause they belong to. **This is the
   one that would do real damage, and it is invisible until somebody looks.**

2. **RE-READING A DOCUMENT MATCHES CLAUSES BY HEADING TEXT.** `clauseCarryIds`
   pairs old and new clauses on the heading's own text, lowercased, and only
   falls back to POSITION for the ones that do not match. A renamed heading
   therefore survives — but by the fallback, and only while the document's shape
   is otherwise unchanged. Rename a heading and reorder in the same sitting and
   the fallback has nothing to hold on to. Test it both ways.

3. **THE HEADING DECIDES WHICH PLAYBOOK RULES MAY TOUCH THE CLAUSE.**
   `clauseKind` reads the heading **and nothing else**, deliberately — a body
   reading types a termination clause as a payment clause, because termination
   clauses talk about payment (26 Aug 2026). So renaming a heading can silently
   switch the findings on that clause on or off. Not a reason to refuse the
   feature; a reason the reader should be able to see it happen.

4. **EVERY SURFACE NAMES THE CLAUSE FROM ITS HEADING.** `negoClauseLabel` builds
   "Clause 4 · Payment Terms" out of `num` and `title`, and that string is on the
   change cards, the clause panel, the round queue, the ⋯ menu head, the audit
   trail and the counterparty's copy. Change a heading and all of them rename at
   once — correct, and it means a heading edit is a bigger visible event than a
   body edit ever is.

5. **THE NUMBER IS PARSED OUT OF THE HEADING, AND THE PRODUCT RENUMBERS ON ITS
   OWN.** `clauseParseHeading` splits "2. Term and Termination" into `num:"2"`
   and `title:"Term and Termination"`, and `negoRenumberPlan` / `negoRenumberApply`
   own numbering. **So the editable thing is the TITLE, not the number.** Letting
   somebody retype "2." as "7." by hand puts two mechanisms in charge of one
   fact. Either offer the title alone, or decide out loud that a hand-typed
   number wins and teach the renumberer to respect it.

### The questions a build had to answer — ALL FIVE ARE ANSWERED, kept for the record

**Every one of these was settled by `a5a62f5` or by the owner on 29 Aug.** In
order: yes it is a tracked change and it goes through the one funnel; ONE change,
folded exactly as a second body edit already folds; the paper draws it, and both
renderers honour the reading; **the counterparty may NOT — ruled 29 Aug, and it
is the one thing still to build**; and the fingerprint went to **v5** with the
heading appended after `ops` through the same length prefix, `NEGO_HASH_VERIFIES`
gaining 5 so nothing already filed moves. **Read this block as history.**


- **IS A HEADING CHANGE A TRACKED CHANGE?** It has to be. Everything else on
  this page is, the counterparty must see it, and a heading is part of the
  agreement's wording. So it goes through the same funnel (`negoFileChange`),
  inside the fingerprint, onto the same card — never a quiet side-write.
- **ONE CHANGE OR TWO?** Editing the heading and the body in one sitting should
  almost certainly file ONE change on that clause, the way a second body edit
  already folds into the same pending ask. Two live changes on one clause is the
  rival state this product spent a fortnight making unrepresentable.
- **HOW IS IT MARKED ON THE PAPER?** A heading carrying an insertion and a
  deletion, drawn in bold 17px, is a shape the redline renderer has never had to
  draw. Look at it before promising it.
- **MAY THE COUNTERPARTY RENAME OUR CLAUSES?** Their page mounts the same panel
  and may propose wording. That needs a ruling from the owner, not a default
  arrived at by whichever way the code happens to fall.
- **THE FINGERPRINT.** `oldText` / `newText` are inside it. If heading text joins
  the hashed input that is a new hash version — `NEGO_HASH_VERIFIES` is a SET, so
  every existing contract keeps verifying, but it must be added deliberately
  rather than discovered later.

### Where it draws

The heading in the screenshot is the panel's own title line, above `AS IT
STANDS`. The cheapest honest shape is **a single-line field at the top of the
same editable box** — one box, one Save, one change — rather than a second
editor with its own Save, which would turn "edit this clause" into two acts and
invite the two-changes problem above.

### Notes for whoever builds it

- **THE ONE EDITOR, TWO HOMES RULE HOLDS.** The clause editor is opened on a
  different element by the panel and by the page, and both go through the same
  builder. A heading field added to one of them and not the other is the drift
  this rulebook opens by warning about.
- **NETS:** `f210` holds the panel and editor claims, `clause-editor-verify`
  drives the real page. The claim worth writing first is the dangerous one —
  **the clause keeps its id across a heading rename** — because it is the one
  failure nothing on screen would report.

---

## 5 — THE NOTES PANEL IS A QUARTER TOO NARROW

> **RULED 29 Aug 2026: ALL THREE FACES.** The drawer widens whichever of
> Activity, Alerts or Notes is showing. It is one object and a reader has no way
> to know why it would be wider on some days and not on others. **Not built** —
> `--shell-panel-w` is still 264 / 292 / 320 on main, checked 29 Aug.

> *"Image 1, increase the notes panel by 25%."*

Reported with a screenshot of the Notes drawer open on **CHG-002 · Clause 1 ·
Purpose**, Internal and External tabs, one note, and the *Add a note for your
team…* box beneath.

### THE ONE THING TO SETTLE FIRST — IT IS NOT THE NOTES PANEL'S WIDTH

**There is no notes panel.** There is ONE shell drawer, `#context-panel`, with
**three faces** — Activity, Alerts and Notes — and `PANEL_FACES` in `js/app.js`
is that list. All three are the same element at the same width.

**So "increase the notes panel by 25%" has two readings and the owner has to
pick one:**

- **(a) The whole drawer widens.** All three faces go with it. One object, one
  width, and the drawer keeps reading as one thing however it was opened.
- **(b) Only the Notes face widens.** It is the one face with a *typing box* in
  it, so it has a genuine reason to be wider than two read-only lists. The cost
  is that the same drawer arrives at two different widths depending on which
  button you pressed, which is how one object starts reading as two.

**MY READ, offered rather than assumed: (a).** The drawer is a single object and
the reader has no way to know why it is sometimes wider. If (b) is wanted, the
hook already exists — `body.pb-flow` is set for the Notes face and nothing else,
so the rule can be scoped to it with nothing new invented.

### It is not one number — it is a responsive ladder of three

`--shell-panel-w` in `index.html`:

| Window | Today | +25% |
| --- | --- | --- |
| 1800px and up | **320px** | **400px** |
| 1440–1799px | **292px** | **365px** |
| 1439px and down | **264px** | **330px** |

**Miss one and the panel is a quarter wider on some laptops and not on others**
— which is the same class of fault as item 1 and would be embarrassing to ship
in the same work order.

### The good news, and it is the reason this is genuinely small

**The drawer no longer takes width off the page.** It used to be a grid column,
so opening it squeezed the content; it is `position:fixed` and overlays now. So
widening it costs the page nothing — **it covers more, it does not shrink
anything.** Nothing about the layout underneath has to be re-fitted.

**THE COMMENT IN `index.html` STILL SAYS OTHERWISE AND IS STALE.** Beside the
token it reads *"--shell-panel-w is read by applyPanelLayout, which is the ONLY
writer of #body-grid's columns"* — `applyPanelLayout` writes no columns at all
any more, and `js/app.js` says so in its own words a few lines further down
(*"It used to be a grid track, and this function wrote #body-grid's columns"*).
**Correct that comment in the same change.** A rule that misdescribes the code
is worse than no rule, and whoever picks this up will read it and expect a
squeeze that cannot happen.

### Three things not to break

1. **KEEP THE `min(…, 88vw)` CLAMP.** It stops the drawer swallowing a narrow
   window. At 400px it never bites on any window this shell draws on (below
   768px the phone shell replaces it entirely), so it becomes belt-and-braces —
   keep it anyway; a later rung might need it.
2. **THE SLIDE NEEDS NOTHING.** The closed state is `translateX(105%)`, which is
   relative to the element's own width and therefore scales by itself.
3. **THE NOTES FACE HAS NO SCRIM, DELIBERATELY** (owner-ruled 27 Aug 2026, on
   the clause panel's rule that the page behind must stay lit and pressable
   because a note is written while reading the change it is about). **So a wider
   Notes panel covers a quarter more of the thing being read, with nothing
   dimmed to say so.** That is the real cost of this ask and it is small — but
   check it on the negotiation page, where the drawer lands over the change
   column, before calling it done.

### Notes for whoever builds it

- **THE COLOUR CENSUS SHOULD NOT MOVE.** A width is not a colour;
  `theme-tokens-verify` staying at 40/40 is the check that nothing else was
  disturbed on the way past.
- **NETS:** the notes drawer is driven for real in `notes-two-rooms-verify` —
  the only place it can be, since the harness pages do not load the shell. The
  claim to write is a RELATION, not a number: **all three rungs are 25% above
  what they were**, read off the computed width at three window sizes, so the
  next retune costs no test edit.
- **IT INTERACTS WITH ITEM 1 AND THE ORDER MATTERS.** Item 1 widens the page
  under this drawer. Do item 1 first, then look at the notes panel again on a
  real desktop — a quarter more width may read differently once the page behind
  it has stopped being letterboxed.

---

## 6 — THE THREE SCREENS THAT SHOW A CONTRACT DO NOT AGREE

> *"I would prefer that the Document and the edit with copilot page reflect
> exactly what has been built in the negotiations page, attached both in desktop
> and laptop format. This includes the grey lighting in the sides on the panel.
> What formatting is that?"*

Reported with the negotiation page open on **MK-363** at desktop width, two red
boxes ringing the grey areas either side of the contract — one between the
sidebar and the sheet, one between the sheet and the clause panel.

### FIRST, THE QUESTION: THAT GREY IS NOT A FORMATTING

It is **nothing**. `.redline-page .rl-doc` sets `background:none`, so the column
holding the contract is transparent and what shows through is `--color-bg`
(`#EDF1F2`), the page's own ground. It appears wherever the sheet does not
reach, because the sheet stops at `RL_SHEET_MAX` (860px) and centres.

**IT IS DELIBERATE AND THE CODE SAYS SO IN ITS OWN WORDS**, beside the rule:
*"the column behind it drops to the page background so the gutters read as page,
not as card."* The sheet is meant to read as paper lying on a desk. So the owner
is not looking at a style anybody applied — they are looking at the **same spare
width item 1 is about**, seen from the other end.

### SECOND: THE THREE SCREENS DIFFER IN TWO SEPARATE WAYS

Measured off the source, not guessed:

| Screen | The sheet | How it behaves as the window grows | Ground behind it |
| --- | --- | --- | --- |
| **Negotiation page** | 860px | **Steady size**, centred — `rlApplyDocZoom` pinned at 1 | page grey — **gutters visible** |
| **Edit with Copilot** | 860px | Steady size, centred (borrows `.rl-doc`) | **white card** — `.ce-paperwrap` sets `background:var(--color-surface)` and a border |
| **Document tab** | **660px** | **Magnified up to 2×** to fill the column (`DOC_PAGE_W`, `DOC_ZOOM_MAX`, `#doc-zoom`) | page grey, but barely seen because the sheet fills |

**SO THERE ARE TWO DIFFERENT FIXES HERE AND THEY ARE NOT THE SAME SIZE.**

- **The Copilot page differs in the GROUND only.** It paints white where the
  negotiation page shows page grey, so the same sheet reads as a card there and
  as paper here. **This is the "grey lighting" the owner is asking for and it is
  one declaration** — drop `.ce-paperwrap`'s surface fill and its border. The
  sheet, the size and the layout are already identical.
- **The Document tab differs in the SIZING**, which is a real decision. It does
  not shrink on the negotiation page; **the Document tab MAGNIFIES**, up to
  double, which is why the owner has always read that tab as the good one.

### THE COST OF MATCHING, AND IT MUST BE SAID BEFORE ANYONE TYPES

**Making the Document tab match the negotiation page makes its words SMALLER on
a wide monitor** — up to half the size they are today, because today they are
magnified up to 2× and afterwards they would not be. That is the whole of what
this ask costs, and the owner should hear it as a sentence before it is built,
because "looks great" on that tab IS the magnification.

**THE HONEST ARGUMENT FOR DOING IT ANYWAY:** the reader already has an A⁻/A⁺
text-size control on both screens, writing `--doc-scale`. The magnification is
doing a job that control already does — and doing it by guessing from the window
width rather than from what the reader asked for. One deliberate setting beats
two mechanisms arguing.

### DECIDED — 28 Aug 2026. NO PICK IS NEEDED AND NONE SHOULD BE ASKED FOR

> *"I do not understand why i need to pick as I just said i want what is in the
> negotiation screen."*

**The owner is right and this file was wrong.** An earlier draft of this item
made itself conditional on item 1's A/B/C/D and asked for the direction to be
confirmed a third time. Both were mistakes and are struck out here rather than
quietly edited away, because the reasoning matters:

- **"Copy the negotiation page" is fully defined TODAY.** It does not need item
  1 answered. It is a RELATION — these three screens agree — and a relation is
  true whatever the thing they agree on turns out to be.
- **THE DIRECTION HAS BEEN GIVEN TWICE AND THE COST WAS STATED IN BETWEEN.** On
  13 Aug 2026 the owner asked for magnify-everywhere; 22 Aug reversed that for
  the negotiation page; this ask finishes the 22 Aug direction across the
  platform. The owner was told plainly that the Document tab's words get up to
  half the size and repeated the instruction. **That is the decision. Stop
  asking.**

### THE THREE SCREENS ARE DRAWN AGREEING, AND THAT IS WHAT TO BUILD TOWARD

The walkthrough under *THE PICTURES* shows all three side by side in the state
this item asks for: one ground, one sheet, one measure. It is a picture of the
ARRANGEMENT and not of the numbers — the rule below is still what gets built.

### WHAT MAKES IT SURVIVE ITEM 1 — BUILD THE RULE, NOT THE LOOK

The only reason this looked like it depended on item 1 is that it CAN be built
the wrong way. **Do not copy today's numbers onto the other two screens.** Make
all three read the same declaration:

- ONE sheet width, one token, read by the negotiation page, the Document tab and
  the clause editor. `DOC_PAGE_W` (660) and `RL_SHEET_MAX` (860) are two numbers
  for one fact and must become one.
- ONE ground behind the sheet — the page's own, `.rl-doc`'s transparent column.
  `.ce-paperwrap` gives up its surface fill and its border.
- ONE answer to "does the sheet magnify" — no. `#doc-zoom` and `DOC_ZOOM_MAX`
  retire from the Document tab, as `rlApplyDocZoom` already has from the
  negotiation page. **The A⁻/A⁺ stepper is the reader's own control and is what
  covers the case magnification was guessing at.**

Built that way, **item 1 later moves all three screens at once, for free**, and
there is nothing to come back and redo. Built as a copy of today's look, item 1
would mean doing the Document tab twice — which is the only real risk here, and
it is a build instruction rather than a question for the owner.

### Notes for whoever builds it

- **THIS DOES NOT WAIT ON ITEM 1**, and an earlier draft of this file said it
  did. Built as one shared declaration (above) the two are independent: this one
  makes the three screens agree, item 1 later decides what they agree ON.
- **THE COPILOT PAGE'S HALF IS THE SMALLEST THING IN THIS WHOLE WORK ORDER.** A
  ground colour and a border, on a page that already inherits everything else
  from `.rl-doc`. It can ship on its own, today, and nothing later disturbs it.
- **CHECK THE PHONE AND THE COUNTERPARTY BEFORE SWEEPING.** Both paint the same
  sheet from the same tokens; neither was in this ask. The counterparty's page
  in particular is read by people outside the building and is its own decision.
- **BOTH WIDTHS, because that is what the ask says.** A change that makes the
  three agree at 2560 and disagree at 1440 is the same fault in a new place.
- **NETS:** `pages-read-alike-verify` is the file that exists to compare pages
  against each other — the claim belongs there and should be written as a
  RELATION (the three screens resolve the same sheet width and the same ground),
  never as three literals. `paper-grows-verify` measures the Document tab's
  magnification today and would be the file to reverse in place.

---

## 7 — THE PENCIL GOES STRAIGHT TO THE EDITOR

> **RULED 29 Aug 2026: the clause panel is RETIRED.** The loose end this item
> left open is closed. **Not built** — the pencil still carries
> `data-rl-cp-open` on main, checked 29 Aug.
>
> **READ THIS BEFORE REMOVING THE PANEL.** Main gave it a new control on 28 Aug:
> an editable clause-name box (`.rl-cp-clname`), which is one of the two doors
> onto the rename that shipped that day. **Nothing is lost by retiring it** and
> that was checked rather than assumed — work mode types the name on the paper
> itself (`#ce-clausehead`), the live asks are the cards column, and History is
> the room's own tab. But the panel is a bigger object than it was when this item
> was written, and the removal has to account for that box rather than meet it by
> surprise.

**REVERSED IN PLACE, 28 Aug 2026, by the owner, after seeing it drawn.** This
item was raised as *one page: the negotiation screen becomes the editor*, it was
fully specified, and it is now decided the other way. The original proposal and
the assessment of it are kept below, because the reasoning is the useful part and
because this reversal is the render doing its job rather than a change of mind
nobody can account for.

### WHAT IS DECIDED

> *"After further review it seems I will not be able to do this... The best
> approach is to keep the negotiation page as is today but when I click the edit
> symbol, it takes me to the edit with copilot page to begin my edit there. No
> edits in the negotiation page though just review and with the cards on the
> right."*

- **The negotiation page stays exactly as it is.** Contract on the left, the
  tracked-changes cards on the right, always. It is a REVIEW surface: read the
  round, answer asks, send. **Nothing is typed there.**
- **The Edit with Copilot page STAYS.** It is where all editing happens.
- **The pencil on a clause is the door to it.** Press it and you are on the
  editor page, on that clause.

### THIS IS A SMALLER CHANGE THAN IT SOUNDS, AND HERE IS WHY

**"No edits on the negotiation page" IS ALREADY TRUE**, and has been since
19 Aug 2026 — the clause tool row was retired and the highlight-to-edit menu was
taken off the paper that day. The only way to write from that page today is
through the clause panel's two buttons.

**So what actually changes is ONE DESTINATION**: the pencil currently opens the
clause panel, which then offers *+ Propose new wording* and *Edit with Copilot*.
It goes to the editor page directly instead. **Two presses become one**, and
nothing about the negotiation page's layout, cards, columns or behaviour moves.

### THE ONE CONSEQUENCE, AND IT IS A QUESTION RATHER THAN A DEFAULT

**What is the clause panel for now?** It carried four things and three are gone:

- *+ Propose new wording* and *Edit with Copilot* — both are what the pencil now
  does directly. Keeping either would be a **second door onto one act**, which
  is the rule the owner themselves stated on the History question.
- *History* — owner-ruled 28 Aug: it lives on the room's History tab, filtered
  to a clause. Not duplicated.
- *As it stands* — the clause is on the paper a few pixels away.
- *On the table* — the live asks on that clause, which are also the CARDS.

**So the panel has very little left, and retiring it is the likely answer — but
that is the owner's call, not a consequence to assume.** Ask before removing it.
If it stays, it must lose its two writing buttons or the one-door rule breaks.

### WHAT THIS MEANS FOR THE OTHER ITEMS

- **ITEM 6 MATTERS MORE, NOT LESS.** The Edit with Copilot page is not going
  away, so the three screens that draw a contract still have to agree. Item 6 is
  already decided and is unaffected.
- **ITEM 1 IS UNAFFECTED AND ITS QUESTION IS LIVE AGAIN.** The earlier note said
  item 7 might dissolve item 1's question by changing what the right-hand column
  is for. It does not: the cards hold that column at all times now. **So "cards
  or white space" is a real question again and wants an answer.**

---

### THE PROPOSAL THIS REPLACED, KEPT FOR ITS REASONING

The owner's original ask was to collapse the editor into the negotiation page:
press the pencil, the Copilot rail slides over the cards, and you type on the
paper — one page, no second screen.

**It was assessed as right, and the assessment is left standing because the
reasoning was sound even though the conclusion did not survive contact with a
picture.** The argument was the owner's own record: 19 Aug gathered editing into
the panel, 26 Aug made the editor page BE the paper rather than two boxes, and
this looked like the last layer between the reader and the wording. Its three
open questions were answered (the rail takes the second track floor to ceiling;
the clause panel goes; one clause at a time) and the History question was ruled.

**WHAT KILLED IT WAS SEEING IT.** A render was built to the answered spec and
the owner ruled against it — it is drawing 3 under *THE PICTURES*, and it is
named there with a warning across it precisely because it draws a design this
order rejects. The ACCEPTED shape is drawing 1, the walkthrough. That is the render earning its cost — the decision
cost one drawing rather than a merge of a 2,462-line page into a 14,128-line
one, which is exactly the risk this file recorded when the item was raised.

**THE ONE THING WORTH CARRYING FORWARD from that assessment**: the instinct
behind both positions is the same — editing should happen in ONE place. The
merge answered it by making the negotiation page that place; this answers it by
making the editor page that place and keeping the negotiation page purely for
review. **The second is the cleaner separation and it is nearly free**, because
the product is already almost there.

---

## What was deliberately NOT done in this sitting

- **Nothing in the product was changed.** The owner asked for a review and a
  filing, and the Scope rules say do only what the request asks. **ONE FILE WAS
  ADDED OUTSIDE THIS ORDER AND IT IS NAMED RATHER THAN SLIPPED IN**:
  `docs/design/three-contract-screens.html`, the walkthrough's source. It is a
  standalone page, nothing in `js/` or `index.html` loads it or knows it exists,
  and it sits in the folder that already holds two prototypes filed beside their
  own work order. It is committed because a published link outlives the machine
  it was drawn on and the source does not, and an order pointing at a drawing
  nobody can reopen is an order pointing at nothing.
- **BUGLOG.md was not appended to.** These seven items ARE the request rather
  than something noticed on the way past it, and this file is where the request
  lives.
- **No estimate is given, and the seven are not the same size.** Item 1 is now
  decided and is the largest, because it touches every page; item 2 has not been
  reproduced and may not be what it looks like; item 3 is understood well enough
  to size honestly and is small; item 4 is small in code and carries the largest
  risk of quiet damage, because the clause id lives on the thing being edited;
  item 5 is the smallest thing here — three numbers and a stale comment — and
  should be done AFTER item 1, since item 1 changes the page underneath it;
  item 6 is two fixes wearing one report, one of them a single declaration and
  the other a decision that changes how big the words are on the Documents tab —
  and it is DECIDED and independent, not waiting on item 1; item 7 shrank to a
  changed destination for one press when the merge was reversed, and is now
  among the smallest things here.
- **NO BRAND-SPECIFIC CLM COMPARISON WAS WRITTEN**, because none could be
  verified. See *What I could not verify* under item 1. If the owner wants one,
  it needs a trial account and screenshots, not a search.
