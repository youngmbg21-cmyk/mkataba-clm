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
  **Reversed 17 Oct 2026** (the owner picked "Desk tabs", Round 2 of the
  Counter redesign): on a computer the rail is not drawn; every page is a word
  Jambo reads and "/" lists, and stays as a tab after "‹ The counter".
  Signing in lands on the Counter (Round 1, "Front desk"). Story: MAP-HISTORY
  "THE COUNTER AND THE DESK TABS".

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

## Finishing the plan (overnight build, 14-15 Oct 2026)

The owner's "Go" on docs/WORKORDER-one-page-finish.md, built one step at a
time on this branch; the owner merges in the morning.

- **Steps 1 and 2 — the door census, and the wrong doors. Built 14 Oct
  2026.** `test/chromium/every-door-lands-on-home-verify.js` presses every
  door that opens a contract or its work (each list page's rows and panel
  doors, the rail, the bell, Jambo's words and chips, ⌘K, the paper's ⋯, an
  email link, a refresh) and fails on the room, the Negotiate page, a retired
  page or a door that does nothing; the doors steps 7 and 8 move are printed
  as PENDING and never fail it. The wrong doors it found now land on Home:
  every Workspace door (Fill in beside the paper while details are owed, else
  the paper on Jambo — `roomHomeLand`), Obligations rows (the Board's
  Obligations view, the row chosen), Parties' Open party (Home's wall with no
  paper chosen, narrowed to that party by one lit chip, until step 7) and the
  bell's approval row (Before you sign beside the paper). Negotiations rows
  already opened the Redlines face. Differences from the work order's wording:
  the email link is `#contract=<id>&tab=…&go=…` (the shape the server mails),
  not `#/c/<id>/…`; the party's wall is narrowed by the set the Parties row
  counted rather than by a name, and its count line counts that set the
  Parties way (agreements, an amendment said beside them), so the number
  pressed is the number read. After the checkers' round (15 Oct 2026): the
  Workspace door lands on the paper PLAIN (a face left open on that contract
  is put away), the Board's contract card and the Negotiate page's Open
  workspace are Workspace doors too, an Obligations row is the row chosen
  whatever tab the Board's view was left on, and the census also presses the
  panels' checklist rows, Show it in the contract and the other Workspace
  doors, and prints the bell's room rows this book does not draw. Story:
  MAP-HISTORY "FINISHING THE ONE PAGE — Steps 1 and 2".

- **Steps 3 to 6 — Draft in Jambo's panel, the drop area, at a glance, the
  stream in Fill in. Built 15 Oct 2026.** Home's head lost "+ Draft new
  agreement" (the other pages keep their own door). On the wall Jambo's chips
  lead with "upload a document" and "draft a new agreement". "draft" answers
  with the Draft card; a "draft … with …" sentence with one New agreement card
  (What · From · With · Stream, "Not created yet", Open the form · Change the
  ask); Open the form is the one form (`openNewAgreement`), the template lit
  and the counterparty in its box, Create grey with its reason until a
  template and a stream are chosen — never the two-door menu. With no paper
  chosen, Jambo's tab greets and offers the drop area: a Word or PDF file
  dropped or chosen (or "upload") goes through the upload's own reader and
  creator (`uploadReadFile`, `submitUpload`, `fileTitleOf`, `contractArrived`)
  and lands on its paper with Fill in open; who we are is asked there, our
  entities offered. With a contract on the paper, the tab opens on "MK-… at a
  glance": details still empty → Fill in, risks → Redlines, changes not sent →
  Share, nobody named to sign → Signing, else "Nothing is waiting on you" —
  each count its own face's reading, nothing spent or written. Fill in asks the
  stream ("asked, never owed"), moved through the one stream writer
  (`ktFolderMove`), grey with the reason for a person who may not re-file.
  Seven small decisions taken without the owner are listed in the story:
  MAP-HISTORY "FINISHING THE ONE PAGE — Steps 3 to 6". The same night's fix
  round: the drop area asks the stream (as the pop-up did); the form Jambo
  opens starts on no stream, Create grey until one is chosen (as the demo);
  the glance asks for signers only while signing is ahead and counts risks
  only where the Redlines face lists them; the card's example drafts in both
  books; "with" names a party or nobody.

- **Step 8 — Overview, Where we are and History on the Board as the Lifeline
  strip; the contract room retires. Built 15 Oct 2026.** "Bring up MK-…"
  (Jambo's box, its chip, ⌘K, a row on the Board) lands the contract on the
  Board as a strip below Today's insights, newest first, drawn as version 4
  of the picture: who it is with, five figures (value, term, next
  obligation, notice by, whose move), the contract's life to scale with its
  obligations as dots, Key terms beside Obligations in their own scroll box,
  what Jambo read on upload with a door from each cell, and Open · Keep ·
  Ask why · Let it go. Every figure is read from the record; a missing one
  is said. Its ⋯ holds Where we are (the one builder) and History (the
  room's trail, Side in the open as All sides · Ours · Theirs, Show the
  wording, scrolling inside the card); Key terms' Edit opens the Overview's
  own sheet in the strip (Details), so nothing the room's Overview did is
  lost. Every door that opened the room now opens the strip; the room is
  drawn only by name (for the checks) and on the phone. The paper's ⋯ gained
  the room's last acts: Start negotiating, Add signers, Create an amendment,
  Add a signed document. Proof: `test/chromium/board-strip-verify.js`, and
  every step 8 row of the door census passing. The checkers' round fixed a
  restored strip that never read its brief, Details going stale, the brief
  and standards doors (one paid without showing, one ran a fresh check),
  the life line's uncounted dots, "bring up" beside the paper, and kept
  Edit from growing the card on the strip. Story: MAP-HISTORY
  "FINISHING THE ONE PAGE — Step 8" and "THE CHECKERS' ROUND ON STEP 8".
- **Step 7 — Contracts opens Home (Wall | List); the rail's fold keeps
  Negotiations and Parties. Built 15 Oct 2026.** Every door that opened the
  Contracts page (`setView('register')` by name, `regShowOnly` /
  `regGoFiltered` and the Board's numbers through them, Jambo's
  "contracts", Delete, a refresh) lands on Home's Document face with no paper
  chosen — the Contracts place (`hbOpenContracts`; the phone keeps its own
  screen). One head, drawn by the register itself on Home
  (`renderRegister({home:true})`): "Contracts" and its facts line, the
  filter boxes (Stream · Quick filters · Category), Wall | List on the right,
  the stage tabs (All · Drafting · In Review · Awaiting counterparty ·
  Executed · Closed) and Adapt filters under them. ONE set of tabs and
  filters for both views (`state.reg`, the one home of every narrowing, Open
  party's set too): the Wall is the wall of papers (`igWallBodyHtml`) of the
  very rows the List holds, in its sort; the List is the same table with no
  inspector, the drawing's six columns (Ref · Counterparty and agreement ·
  Stage · Owner · Ends · Value) and the row's own ⋯, a row's one press
  opening the paper; where Home's paper column is narrow (an 820 tablet, a
  1024 window) it draws the four loudest (Ref · Counterparty · Stage · ⋯)
  and never pans sideways; its Display cog is the page's own (Table ·
  Board, density, the amendment fold). Wall or
  List, tab and filters come back on a refresh (Home's place pair carries the
  register's). The rail: the fold holds Negotiations and Parties; its
  Contracts item and count are gone; the opener keeps its name and is the
  Contracts door (a mouse press opens the place alone, the fly-out stepping
  aside until the pointer leaves the row; a tap or the keyboard opens the
  place and the fly-out; pressed again on the place, the fly-out shuts; it
  lights on the place). The rail's Home
  door is not the place: from it Home is the Board, as the drawing has it.
  Jambo's "list" and "wall" turn the place, "contracts" opens it with every
  contract (filters at rest), and he reads the place as the Contracts list. The paper's way back reads
  "‹ Contracts". Differences from the work order's wording, for the morning:
  the wall's own find box, sort select and "Needs you" / "Expired" chips
  went with its own filters (one set of tabs; the sort is the List's, on the
  count line; "Needs you" stays on each paper); the old page's side panel
  (and its "needs you" checklist), its nine-column table and its Signed
  column are no longer drawn on a computer (the Signed sort and filter
  stay). Story: MAP-HISTORY "FINISHING THE ONE PAGE — Step 7".

- **The owner's answers after the merge (15 Oct 2026).** "Read the brief" on
  the strip's What Jambo read; the checklist's approval row opens Before
  you sign, as the bell's does (Signed came back on the Contracts List and
  went again the same day: the owner changed their mind); a tap
  on Contracts opens the place alone (a second tap, the fly-out); Details in
  the strip's ⋯. Kept as they were: the renewal more than 30 days away, the
  stream asked at the drop, and the drop area's and Jambo's tab's text sizes
  (already Jambo's panel's own). Story: MAP-HISTORY "THE OWNER'S EIGHT
  ANSWERS, 15 OCT 2026".

- **The tab is called Workspace (15 Oct 2026).** Home's Document face reads
  Workspace, as the Workspace doors that open it; "Workspace status" is
  "System status". Saved views left Jambo's panel for the Board's head,
  beside Make a pack: one list, a row opens that view on Explorer. Story:
  MAP-HISTORY "THE TAB IS CALLED WORKSPACE, AND SAVED VIEWS MOVE TO THE
  BOARD".
