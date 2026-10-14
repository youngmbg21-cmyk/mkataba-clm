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
2. **Fill in the details in the panel.** An upload lands on the Document face
   with the panel on the fill-in face; typing in a box fills the paper's blank
   at once; one writer (`contractBlankSet` / the Details writers), nothing new
   stored.
3. **Redlines in the panel.** The Negotiate column gets its second host in
   Jambo's panel; Edit opens the clause editor; Exit returns to the panel
   face at the same scroll. The paper on the Document face shows the changes
   as Negotiate's paper does today.
4. **The Board grows.** Deal board, obligations and history as Board views,
   each with Print · Share · Download; their old panel aliases
   (`PD_TAB_ALIAS`) point there.
5. **Retire the duplicates.** "sign" and "share" faces in the panel (if not
   already in stage 1); the Negotiate page's own paper folds into the
   Document face; old doors (sidebar, bell, email links, refresh) are
   re-pointed so none lands on a page that no longer exists.
6. **Polish.** Svenska wording pass, the chips' wording, a sweep of every old
   door, the brain (`BRAIN_PARTS`, lanes, stages) brought up to date.

**The proof the plan worked**: one contract from upload → fill in → redline →
edit → sign → share, without leaving Home once — the demo's own walk, in the
real app.

## 8. Open questions, settled at each stage's design round

- **The Board's own "/" list** (chart moves: /compare, /trend…): one list with
  two sections (places, then moves), or places only off the Board.
- **Where "Before you sign" sits once signed by both**: the face stays as a
  receipt, or hands over to Where we are.
- **The rail's Negotiations door** after stage 5: removed, or kept as a list
  that opens contracts on Home.
