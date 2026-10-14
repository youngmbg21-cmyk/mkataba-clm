# The one-page Home plan (owner agreed, 14 Oct 2026)

> *"My point I will never have to click off the board page to go elsewhere."*
> — the owner, 13 Oct 2026. Agreed in full on 14 Oct 2026 ("Agreed, and save
> the plan"), after flipping through the plan and the clickable demo.

- The plan, step by step: https://claude.ai/artifact/PB1wyAHeZq2SVfsynjxv6L
- The clickable demo, built on the owner's SaaS agreement:
  https://claude.ai/artifact/Wr1E93poEZJ5VqY8x1YPR7

This is the guiding picture for every build that touches Home, the paper,
Jambo's panel, redlining, signing or sharing. A build that pulls away from it
says so to the owner before it is built. The Six Questions, the Nine Flow
Rules and the design-options rule (three named options, one always The SAP
Way) still apply to every stage below.

---

## 1. The picture

**Home is the whole app.** Its faces along the top — Board · Document ·
Calendar · Explorer — and Jambo's panel on the right are where a person works
all day. Nothing in a normal day takes them to another page.

- **Document face = everything about the paper.** The paper sits still in its
  own space and never shrinks. The panel beside it changes face: fill in the
  details, redlines, before you sign, share, draft. With nothing chosen, the
  face is the wall of paper (every contract as a small page).
- **Board face = the state of things.** The portfolio, the deal board, the
  obligations and the history, each with Print · Share · Download.
- **Calendar and Explorer** stay Home faces, as today.
- **Jambo's box is the steering wheel.**

## 2. The grammar of Jambo's box

- **A place takes you there**: board, deal board, obligations, history,
  calendar, explorer, document, another contract, or a contract's name.
- **Work is prepared, and the person presses**: upload, fill in, redline,
  edit, sign, share, draft "an NDA with Volvo".
- **Anything else is a question**, answered as today.
- **Typing never signs, sends or files anything.** It opens a face or prepares
  a card; the press is always a person's.
- **"/" lists the places used most**, drawn as the Board's own "/" menu
  (`.ca-pop`, bold word, grey line under it), sorted by use, narrowing as you
  type, ↑↓ · Enter · Esc.
- **Chips under the box teach the words**, changing with the contract's stage
  (owed details → "fill in the details"; a counter waiting → "redline";
  settled → "sign").
- **Both languages**: every word read from the two books (signera, dela,
  tavla, historik…), never English hard-coded.
- **One brain for every box**: the same word table serves Jambo's box on every
  face and the search box in the top bar.
- **A back trail**: the panel always offers "‹ Back to …" the place you came
  from.

## 3. The panel's faces (Document face)

| Face | Opens on | Built from (no copies — the same builder, a second host) |
|---|---|---|
| Fill in the details | an upload; "fill in"; any amber blank pressed | the Details form (`detailsOf`, `detBasicsHtml`, `openCompleteDetails`); a blank typed fills the paper as you type |
| Redlines | "redline" | the Negotiate column: piles `RL_CARD_BANDS`, rows and verbs `rlRowFaceVerbs` (Edit · Send · Ladder · Discard; Accept · Reject · Counter), risks `rlRisksPileHtml`, Draft from our standards `rlFilePlaybookProposal` |
| Clause editor | Edit on a row or a risk | the existing full-window editor (`rlEditorTakesIt`, `_rlEditorDoor`); Exit lands back on the same face, same spot (`rlCameFrom` pattern) |
| Before you sign | "sign" | `signBlockers` / `signReadiness` — the same list the Sign button reads; the pad as today (`openSignaturePad`) |
| Share | "share" | two choices; each opens the existing send screen pre-filled (`openShareModal`); colleagues via the pass route Jambo already uses |
| Draft | "draft …" | `caReadDraft` → the existing new-agreement form (`openNewAgreement`); nothing created without Create |
| Jambo · Clauses · Obligations | as today | unchanged |

**The host pattern** is the one the Thread already uses (`TH_HOSTS`,
`thHostFor`): one painter, and the host only says where to draw. The redlines
column gets a second host in Jambo's panel exactly that way. A face that
would need its own copy of a builder is a fault, not a shortcut.

## 4. What the Board face gains

- The **deal board** (today `dealBoardHtml`, on Negotiate) — drawn on the
  Board for the contract on the paper.
- **Obligations** for that contract (`obListHtml`) and **history**
  (`roomHistoryEvents`, newest first), each with Print · Share · Download.
- Every card and number stays a door, and every door opens on Home.

## 5. Earlier rulings this plan reverses (the owner's "agreed" covers them)

Each is replaced in CLAUDE.md, and its story moved to MAP-HISTORY, in the
build that does it — never before.

1. **"NO SIGNING TAB" on Home's panel (10 Oct 2026)** and
   `pdOpenOnHome(id, 'sign')` sending signing to the Approvals & signing page.
   Signing returns as a **panel face that appears when asked**, not a fourth
   standing tab. Approvals stay on their page.
2. **"NO DEAL AND NO HISTORY TAB" (11 Oct 2026).** They come back as **Board
   views**, not panel tabs.
3. **"Negotiate is a place" (its own sidebar door and page).** Stage 5 folds
   the Negotiate paper into the Document face; until then both stand.
   (Done in stage 5: the door stays as the list of negotiations.)
4. **The contract room's six tabs (12 Oct 2026, Details first).** Stage 5
   keeps Overview and Where we are; Details, Signing, Obligations and History
   open their twins on Home.

## 6. What does not move

- **The counterparty's page** (they open a link; same paper, their door).
- **The phone** (below 768px it draws its own; it borrows readings, never
  copies).
- **Print, Word and PDF copies.**
- **The server's checks** — every act is still refused or allowed by the
  server; the panel only shows the answer.
- **The rail** stays, as a shortcut. Pages with no Home face yet (Our paper,
  Requests, People, Settings) keep their own doors.

## 7. The build, in six stages

Each stage ships whole, is tested, and leaves the app complete; the owner can
stop after any of them. Each opens with design options for its one part of
the page (three named ideas, one The SAP Way), and the owner picks by name.

1. **Teach Jambo the words.** Extend the one word table Jambo's box already
   reads before asking the model (`caActOf` → `CA_DOORS` / `CA_DOOR_GO` in
   js/copilotacts.js) with the places and the work words, in both books. Add
   "/" (most used, counted per person in `LS.ui`), the stage chips, and the
   "‹ Back" trail. In this stage the words open today's doors, so it is
   useful on day one. The top-bar search reads the same table.
   *Done when:* every word in §2 lands where §3–4 say, in English and
   Svenska, and anything else still reaches Jambo as a question.
   **Built 14 Oct 2026 (the owner picked "Chips").** Two changes from the
   wording above: the use counts live under their own key
   (`hati.v1.jamboUses`), because `LS.ui` is written whole by the page store;
   and on the Board its own reader keeps the words it already answered
   ("obligations" is its panel there). Story: MAP-HISTORY "JAMBO'S WORDS".
2. **Fill in the details in the panel.** An upload lands on the Document face
   with the panel on the fill-in face; typing in a box fills the paper's blank
   at once; one writer (`contractBlankSet` / the Details writers), nothing new
   stored.
   **Built 14 Oct 2026 (the owner picked "Form", and yes to: drafts land here
   as uploads do; every door from outside the room opens this face, the
   room's Details tab staying until stage 5; a company template's answers
   show on the paper as typed and reach the wording on Fill the document).**
   Story: MAP-HISTORY "FILL IN, BESIDE THE PAPER".
3. **Redlines in the panel.** The Negotiate column gets its second host in
   Jambo's panel; Edit opens the clause editor; Exit returns to the panel
   face at the same scroll. The paper on the Document face shows the changes
   as Negotiate's paper does today.
   **Built 14 Oct 2026 (the owner picked "Column", and yes to: the paper
   turns Redlined while the face is open and back when it closes; every door
   from outside opens the face, the Negotiate page staying on the rail until
   stage 5; notes stay on Negotiate until stage 5, a row's note count opening
   it).** One difference from the wording above: a review's own doors still
   open the Negotiate page, because handing a review back is that page's
   notice, which the face does not draw (a strip in the panel is the owner's
   to allow). Story: MAP-HISTORY "REDLINES, BESIDE THE PAPER".
4. **The Board grows.** Deal board, obligations and history as Board views,
   each with Print · Share · Download; their old panel aliases
   (`PD_TAB_ALIAS`) point there.
   **Built 14 Oct 2026 (the owner picked "Views", and yes to: Share reaches
   colleagues inside HaTi only, their bell and their Board, with a note;
   Download is one file per view that looks like its print; every door from
   outside opens the Board's views, the Negotiate page's Deal board tab and
   the room's Obligations and History tabs staying until stage 5, Jambo's
   Obligations tab staying beside the paper).** One difference from the
   wording above: the alias itself is left for a walk through several
   contracts on the paper (an agent's Review); the panel's Deal and History
   DOORS (`pdOpenOnHome`) open the Board. Story: MAP-HISTORY "THE CONTRACT'S
   VIEWS ON THE BOARD".
5. **Retire the duplicates.** "sign" and "share" faces in the panel (if not
   already in stage 1); the Negotiate page's own paper folds into the
   Document face; old doors (sidebar, bell, email links, refresh) are
   re-pointed so none lands on a page that no longer exists.
   **Built 14 Oct 2026 (the owner picked "Checklist", and yes to: the
   Negotiate page folds into Home — the paper's line gets Notes · Share · ⋯,
   the notes drawer opens beside the paper, "Their view" joins Clean and
   Redline, and the rail's Negotiations door stays as a list whose rows open
   Home; the room's Details, Signing, Obligations and History tabs go, every
   door that named one opening its twin on Home, the contract page keeping
   Overview and Where we are, the phone keeping its own screens; once both
   have signed, Before you sign stays as the receipt).** "Before you sign"
   is a face of Jambo's tab drawing the Signing column's own four slots, the
   paper beside it the signing copy; no separate "share" face — Share on the
   paper's line opens the one send screen. Differences from the wording
   above: the Negotiate page's notices stand at the top of the Redlines face
   (they no longer float, the owner's 23 Aug ruling), so a review's doors
   open the face too; Home's ⋯ leaves out Deal board (a Board view since
   stage 4), Focus (Home's paper has none) and the two rows already on the
   face's foot; the Negotiate page's code stays as the engine the face is
   built from and as the phone's page. Story: MAP-HISTORY "BEFORE YOU SIGN,
   BESIDE THE PAPER".
6. **Polish.** Svenska wording pass, the chips' wording, a sweep of every old
   door, the brain (`BRAIN_PARTS`, lanes, stages) brought up to date.
   **Built 14 Oct 2026 (the owner: "Can we go to the next step?").** No
   design round: nothing new was drawn. Every sentence that sent a person to
   a retired place now names where it went (Before you sign, the redlines
   beside the paper, the deal board on the Board, Fill in the details), in
   both books and in the server's own refusals; three sentences left on a
   screen nothing opens any more are logged, not changed. The plan's Swedish
   speaks with one voice ("papperet", "förhandlingstavla" as the Board's
   switch says), and Jambo reads those words. The chips follow the contract:
   a word whose door is shut for it (the redlines of a signed, held,
   handed-over or archived contract) is not offered, and they change the
   moment a face changes the contract. The brain's redlining and signing
   flows start at the faces. The proof walk is
   `test/chromium/one-page-home-walk-verify.js`. Story: MAP-HISTORY "STAGE 6
   — POLISH, AND THE PROOF".

**The proof the plan worked**: one contract from upload → fill in → redline →
edit → sign → share, without leaving Home once — the demo's own walk, in the
real app.

## 8. Open questions, settled at each stage's design round

- ~~**The Board's own "/" list**~~ — settled in stage 1: one list, the
  places first, then on the Board its chart moves; off the Board the places
  alone.
- ~~**Where "Before you sign" sits once signed by both**~~ — settled in
  stage 5: the face stays as a receipt (who signed, the seal, the copies and
  "What starts now").
- ~~**The rail's Negotiations door** after stage 5~~ — settled in stage 5:
  kept as a list; every row opens the contract on Home.
