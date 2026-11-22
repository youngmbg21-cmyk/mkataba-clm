# Work order: finishing the one-page Home (the overnight build, 14–15 Oct 2026)

The owner approved this list on 14 Oct 2026 ("Go") after a gap review of the
merged one-page plan (docs/PLAN-one-page-home.md, stages 1–6) and four rounds
on a clickable picture. It is built autonomously overnight, one step at a
time, on branch `claude/gracious-keller-a6uwyl`. **No merge**: the owner merges
in the morning.

Reference pictures (open them in a browser; they are the design, not code to
copy):

- `docs/WORKORDER-one-page-finish-demo.html` — the agreed clickable demo of the
  one-page Home (the drop area, the draft card and form, the "at a glance"
  card, Fill in with the stream). Search it for `homeFace`, `fillFace`,
  `draftFace`, `kind === 'draft'`.
- `docs/WORKORDER-one-page-finish-strip.html` — version 4 of the picture for
  steps 7 and 8 (Contracts on Home as Wall | List; the Lifeline strip on the
  Board with ⋯ Where we are and History). Search it for `contractsHead`,
  `listHtml`, `lifeBody`, `lifeChart`, `whereBody`, `histBody`.

Everything in CLAUDE.md applies (the Six Questions, the Nine Flow Rules, the
Bug Fix Rules, both books for every word, the brain, no new bands, one
dropdown per press, the three screens). Where a step below says how, it is
the owner's ruling and wins over an older ruling it reverses; each reversal is
named so it can be replaced in THE MAP and its story moved to MAP-HISTORY.

## How the night runs

- One step at a time, in this order. Each step: read the code, build, re-point
  every test that pinned the old behaviour (never skip, disable or quarantine
  a test; a test whose subject is genuinely gone is retired with a sentence in
  the commit), add the new checks, `npm run lint` at zero errors, the changed
  node test files and the browser checks for the screens touched. Never the
  full suite in chat; GitHub runs everything on each push.
- Every new name a step adds is published, in `BRAIN_PARTS` with an area and
  a flow step (f561), in its lane and stage (f564).
- Every word in both books (en, sv). Swedish is real Swedish.
- Photographs at 1440×780, 1536×730 and 1366×950 for every visual change.
- Anything noticed outside the step: one line in BUGLOG.md under "Noticed,
  not fixed" (append only, `cat >> ./BUGLOG.md <<'EOF'`), never a fix.
- A decision the owner did not make: take the smallest safe choice, write it
  down for the morning summary. Nothing big is guessed.
- The phone (below 768px) keeps its own screens throughout.
- Each step's story goes to the end of docs/MAP-HISTORY.md; THE MAP lines in
  CLAUDE.md are replaced, never only added, and CLAUDE.md stays under 80 KB.
- docs/PLAN-one-page-home.md gains a "Finishing the plan" note per step.

## Step 1 — the door census

A browser check, `test/chromium/every-door-lands-on-home-verify.js`, that
presses every door that opens a contract or a contract's work and records
where it lands: each list page (Contracts, Negotiations, Approvals & signing,
Obligations, Parties, Requests) — row press, double-click, Enter, and every
inspector door (Document · Negotiation · Workspace); the rail; the bell's
rows; Jambo's box and chips; the paper's ⋯ menu; an email link
(`#/c/<id>/...` through `openFromHash`); a refresh. It fails when a door
lands on the contract room (`state.view==='workspace'`), the Negotiate page by
default, a retired page, or does nothing. Each later step adds its own rows
to it. It is the measure; it is never trimmed to go green.

## Step 2 — the wrong doors

- The inspector's **Workspace** door opens Home everywhere (Fill in beside the
  paper while `detailsOf` owes, else the paper on Jambo's tab) — never the
  room. (Step 8 later points "the contract's overview" at the Board strip.)
- **Negotiations** rows: double-click and Enter open that contract on Home on
  the Redlines face; **Obligations** rows open the contract on Home on the
  Board's Obligations view for it (`obOpenContract`).
- **Parties** "Open party" opens Home's Contracts place (step 7's wall)
  filtered to that party; until step 7 lands, Home's paper face with nothing
  chosen, filtered.
- **The bell's approval rows** open Before you sign on Home for that contract
  (`pdSignOpen` through the walls), not the Approvals page. The Approvals page
  itself stays on the rail. (Reverses stage 5's "`pdOpenOnHome(id,'sign')`
  still opens Approvals" for the bell only.)

## Step 3 — Draft lives in Jambo's panel

- **Remove "+ Draft new agreement" from Home's head** (top right). Other pages
  that carry their own draft door keep it (owner, 14 Oct 2026).
- Jambo's chips gain **"draft a new agreement"** (both books). Pressing it, or
  typing "draft" alone, shows the demo's **Draft a new agreement** card in the
  panel: one sentence ("Say it in a sentence … or open the form and pick from
  Our paper") and **Open the form**.
- Typing "draft an NDA with Volvo" (any "draft …" sentence `caReadDraft`
  reads) shows the demo's **New agreement** card: What · From · With · Stream,
  pill "Not created yet", buttons **Open the form** and **Change the ask**.
  "With" carries the counterparty named in the sentence (amber "Not said yet ·
  asked in the form" when none). "Stream" reads "Asked in the form".
- **Open the form** opens ONE form, the existing `openNewAgreement` (no
  two-choice menu in front of it): templates on the left (search Our paper),
  the chosen template's questions and the **stream** on the right, Create
  greyed with its reason until a template and a stream are chosen. The
  counterparty from the sentence is already in its box. Nothing is created
  until Create.
- The old two-choice menu (`openNewDoors`) is no longer the way in from Home or
  from Jambo. Upload is step 4's drop area.

## Step 4 — the drop area and the "upload a document" chip

- On the Document face with no paper chosen (the wall), Jambo's tab opens with
  the greeting and the demo's drop area: "Drop a Word or PDF file here · It
  opens as the paper, and I read it straight away." plus a button to choose a
  file. Dropping a file, or choosing one, uploads it through the existing
  upload path (who we are, `fileTitleOf`, `contractArrived`), lands it on the
  paper with **Fill in** open beside it (`roomArrivesOnHome`).
- **"upload a document"** is the first chip under the ask box on the wall;
  pressing it opens the file picker; typing "upload" does the same.
- The pop-up "Add a received contract" is no longer the way in from Home or
  Jambo (other pages that use it keep it). Questions the upload dialog asked
  that the record needs (who we are on it) are asked in Fill in, not lost.

## Step 5 — Jambo's "at a glance" card

With a contract on the paper, Jambo's tab replaces the generic greeting with
the demo's card: "**MK-… at a glance**" with the stage pill, and one row per
thing waiting, each with its button that opens the face:

- "N details still empty." → **Fill in** (`detailsOf`)
- "N risks to look at." → **Redlines** (`riskOpenOf`)
- "N changes not sent." → **Share** (`negoUnsentAsks` / the unsent count the
  Send all button reads)
- "Nobody has been named to sign yet." → **Signing** (Before you sign)
- none: "✓ Nothing is waiting on you."

Every count is the same reading its own face uses (one fact, one home). It
spends nothing (no model call) and never writes. The question box and the
chips stay below it; an answer from Jambo still lands in the chat as today.

## Step 6 — the stream in Fill in

The Fill in face asks the stream: "Stream · asked, never owed", a segmented
choice of the company's streams (`foldersFromSettings()`), the current one
lit. It is never counted as owed (`detailsOf` unchanged). Choosing writes
through the existing stream writer with its access and audit rules (a person
who may not re-file sees it read-only with the reason).

## Step 7 — Contracts opens Home (Wall | List)

- `setView('register')` (and every door that opens the Contracts page,
  including `regShowOnly` / `regGoFiltered` / Board number doors) lands on
  Home's **Document face with no paper chosen** — the Contracts place.
- The place has one head: "Contracts" with the facts line, labelled filters
  (Stream, Quick filters, Category, Adapt filters), the stage tabs (All ·
  Drafting · In Review · Awaiting counterparty · Executed · Closed) and a
  **Wall | List** switch on the right. One set of tabs and filters for both
  views (the same contracts on the wall and in the list).
- **Wall** = the wall of papers (`igPickHtml` / `igWallBodyHtml`), now under
  the shared tabs and filters.
- **List** = today's Contracts table (`renderRegister` — the SAME builder, a
  second host), **without the inspector side panel**, with **Owner** and
  **Ends** columns added. A row press opens that contract on the paper (one
  press; no inspector step).
- The choice (wall or list), tab and filters are remembered (`PLACE_PARTS`,
  `placeSave`), so a refresh lands on the same spot.
- **The rail**: the Contracts fold-out keeps only **Negotiations** and
  **Parties**; its "Contracts" item goes. The fold's opener keeps its name.
  Rail counts follow (the Contracts count moves or goes with its item).
- Jambo's words "list" and "wall" switch the view; "contracts" opens the
  place.

## Step 8 — Overview, Where we are and History on the Board; the room retires

- "**Bring up MK-…**" (Jambo's box, its chip, ⌘K) lands the contract on the
  Board as a **strip** below Today's insights, newest first (the Board's
  existing "Bring up" card, `hb-dig`, is redrawn as this strip). Several
  strips may stand; × closes one; Keep keeps it on the Board as today.
- The strip, as version 4 of the picture (Lifeline):
  1. Head: title · ref · counterparty · status pill · ⋯ · ×.
  2. Who it is with (role, type, stream, owner, uploaded) and five figures:
     Value (per year under it), Term (from), Next obligation, Notice by,
     Whose move (round, open points).
  3. **The contract's life** — one SVG time line to scale: negotiation, the
     term, the notice window, milestones (today, starts, price reviews or
     other dated windows, notice by, ends) and obligation dots (ours #264c9e,
     theirs #7E66D6 — validated for colour blindness), legend with counts, a
     one-sentence caption. Only what the record knows is drawn; a missing
     date is said, never guessed.
  4. **Key terms** (left) — from Fill in and the record (our side, signers,
     law, disputes, payment, price, renewal, liability cap…); an owed one in
     amber. **Obligations (N)** (right) — "Obligations", never "duties" —
     a table (Obligation · Who · Due, the next one marked) **inside its own
     scroll box** (about seven rows, sticky head) so the card never grows
     with the list.
  5. **What Jambo read on upload** at the foot, full width: the brief
     sentence, then four cells — Risks found (titles), Our standards (met /
     missing / differs), Details to fill, Obligations found — each with its
     door into Home ("See the risks ›", "Fill in ›"…). Read from the stored
     readings only; nothing spent.
  6. Foot: Open · Keep · Ask why · Let it go, as the insight panels.
- **⋯** opens a menu: **Where we are** and **History** (and **Overview** when
  away from it). Each opens inside the same strip, with "‹ Overview" beside
  the title. Pressing ⋯ again closes it; Esc and a press outside close it.
- **Where we are** in the strip = `standsHtml(c)` (the one builder).
- **History** in the strip = the room's history builder (`roomHistoryHtml` /
  `roomPaintHistory` with the Board as host): search; **Side** in the open as
  **All sides · Ours · Theirs**; **Filter** for clause, person, round and
  outcome; **Show the wording**; the trail scrolls inside the card; ⋯ More
  keeps Verify integrity.
- **The room retires**: every door that opened `setView('workspace')`
  (`openWorkspace`, the inspector, ⋯ "Filing and stream", the bell, email
  links, a refresh on `#/c/<id>`, the phone's links on desktop) opens the
  contract's strip on the Board on Overview (Where we are when the door named
  `stands`). The room's acts that still have no other home (Add signers,
  Start negotiating, Share, Filing and stream, Create an amendment, Add a
  signed document, Hold, Archive, Delete…) are reached from the paper's ⋯ menu
  on Home (`roomMoreMenuHtml`, already one builder) — nothing is lost; a list
  of where each act now lives goes in the step's history story. The phone
  keeps its own contract screens.
- The Board's contract views switch (`hbCvSwitchHtml`: Your book · Deal board
  · Obligations · History) stays; its History opens the same trail.

## Step 9 — green, and the live site

Drive GitHub's checks to green on the branch. Check whether the live site
(render.yaml) serves the new build; if it cannot be reached from here, say so.
Write the morning summary in plain English: what was built, whether it is
green, what was left alone and why, and every small decision taken without
the owner.
