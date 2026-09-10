# HaTi — contract-room

*the contract room and its tabs — Key terms, Document, Signing, Obligations, History — and who owns a contract*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## KEY TERMS HAS A DIVIDER, AND THE RIGHT-HAND CARD SCROLLS (owner-asked 19 Aug 2026)

"Keep the size of the card on the left intact and next changes the size. Add a divider between the two cards so that you can scroll on the right hand side especially when you can ran a renewal reason." THREE TRACKS in `.terms-grid` — card · handle · card — and this REVERSES "the two cards square off" for this grid: squaring off was right while the slot beside Key terms held a short list, and wrong the moment it can hold a paragraph of reasoning, because the card that grows drags Key terms up with it and its own content runs off the bottom of the window. The RIGHT column stretches to the grid and scrolls inside itself (`#kt-side` — the grid takes the pane's height via flex:1/min-height:0, which is what gives it a bound to scroll inside); the LEFT card is its own height again. **THE COLUMN TAKES THE HEIGHT, THE CARD IN IT TAKES ITS CONTENT** (`.terms-grid #kt-side > *{flex:0 0 auto}`) — measured on the real page: stretched as well, a short Agreement family card became a floor-to-ceiling box with a paragraph at the top of it. The column is what has to be tall, because that is what gives a long card somewhere to scroll.

- **AND SHRINK IS 0, WHICH IS WHAT MAKES THAT SENTENCE TRUE — REVERSED IN PLACE 10 Sep 2026** (owner-reported, off two screenshots: *"it looks like buttons and cards are not aligned and they overlay on each other or buttons are not in the cards they are supposed to be in"*). **THE RULE ABOVE WAS RIGHT ABOUT THE HEIGHT AND WRONG ABOUT THE VALUE.** It said `flex:0 1 auto` — do not grow, DO SHRINK — and every card here also carries `min-height:0`, so a column whose cards add up to more than the room available **did not scroll**: flexbox shrank each card below the height its own content needs, and the content then spilled out of its box and drew over the card beneath. **MEASURED on the reported shape** (a renewal card carrying a paragraph of advice, at 1500x720): the column needed 492px and had 457; the brief card was squeezed to 75 against the 96 its content needs, so its Write brief button hung **21px below its own card and 9px into the Agreement family card** — which is the screenshot, where the word "Write" sits on top of the heading "Agreement family". With shrink at 0 the cards keep their content height, `scrollHeight` finally exceeds `clientHeight`, and the `overflow-y:auto` already on the column does the job it was put there to do. **IT IS THE WHOLE COLUMN, not only `.kt-side-card`**: `#renewal-host` is a plain div and carried the default shrink of 1, so it could be crushed the same way by a card added later. Nothing here has an inner scroller that relied on being shrunk — the obligations list, which did, left for the Checks card in August.
- **IT IS THE NEGOTIATION PAGE'S DIVIDER, IN ITS OWN GRID** — deliberately the same mechanism, never a second one: `ktFitSplit` / `ktWireSplit` mirror rlLayoutResizer line for line, so the fraction comes from where the POINTER IS inside the grid (never distance travelled — that is what made the other handle fall behind the cursor and gave it a dead band), both halves ask `_ktAvail` for the geometry, the limits show in amber when they bite, arrow keys move it 2%, and a double-click puts it back. KT_LEFT_MIN 320 / KT_RIGHT_MIN 300; stored per browser at `hati.v1.ktLeftFrac`.
- **THE STORED FRACTION IS READ, NEVER WRITTEN, WHERE IT CANNOT BE HONOURED** (the nav drawer's rule): below 980px the layout stacks, `ktStacked()` asks the WINDOW the stylesheet's own question, the inline columns are cleared and nothing is saved — a phone-width sitting cannot quietly reset a split set on a laptop.
- Bound ONCE per element (`dataset.ktSplitBound`) because wireKeyTerms runs from renderKeyTerms AND from the room's own wiring — the trap the stream picker beside it already records. A ResizeObserver on the grid re-fits when the pane stops being `display:none`, which is the only time the first measurement is a zero.
- Tests: f176's third block reversed in place, f280 (1)-(2) (the rule and the scroller it rests on, as a PAIR — cards that cannot shrink are only safe because the column can scroll), amendment-journey-verify (the two heights, the right column proved to scroll and to end inside the pane, **the divider dragged with a real pointer** with the split proved remembered, and — since flex-shrink has no answer until something is laid out — **the over-full column measured card by card**, which reports the owner's screenshot as a number against the parent: `brief-card needs 96 has 73` and a button `-22px` below its own card).

## AN AMENDMENT IS WRITTEN HERE, NOT ONLY FILED HERE (js/family.js, owner-asked 14 Aug 2026)

TWO CARDS SWAPPED PLACES AND ONE BUTTON WAS BORN. Obligations left the Key terms column for a row on the Document tab's Checks card; **Agreement family took the slot it vacated** — renderFamilySection had been finished, exported and tested since the family model was built and had NEVER BEEN DRAWN ANYWHERE (nothing in the product created `id="family-section"`), so the one place HaTi can say *the date this agreement really ends is not the date typed on it* said nothing at all.

- OBLIGATIONS AS A CHECK REVERSES 10 Aug, and the reason for that removal has gone. It went as a duplicate: two doors onto one sweep, and this was the worse one because pressing it sent you to the other tab to read the result. Both halves are answered — there is one door (the card is not staying on Key terms) and nothing sends you anywhere (findings open in a side panel over the document, like the other two rows). It LEADS, because that is the order the work is done in. THE PANEL BORROWS THE CARD BY ITS ELEMENT ID (`obligations-section`) — the same trick openCheckPanel already plays for playbook/scan — so it is the card moved whole, never a second rendering; `#side-panel .ob-list` stands the 322px cap and the flex:1 down, both of which were written for a stretched grid child.
- ONE RULE THE ROW DOES NOT INHERIT, deliberately and per-kind: `editableFor=kind=>mayEdit&&(kind==='oblig'||c.status!=='Signed')`. Checks refuses to re-run on a signed contract, which is right for a READING OF THE WORDING and wrong for a commitment kept beside it — a quarterly report starts mattering AFTER signature. renderObligationsSection made and corrected exactly this mistake in its own guard; inheriting it here would have let it back in through the door that panel had just shut.
- ONE COUNT, MANY SURFACES: the row prints `N tracked` off checkVerdict, so **obligationSurfacesChanged** now repaints the Checks card alongside the sidebar, calendar and dashboard. That function is the funnel — every one of the four callers that can change an obligation already goes through it.
- "ADD AN AMENDMENT" IS RETIRED (`fa_add_amendment` — flag any mention as stale). It added nothing: it attaches a document you already have. It is `fa_link_existing` — **Link an existing document** — and the new primary beside it takes the plain word, **Create an amendment**. The acts moved OFF the head into `.fam-acts`, a row of their own: a standalone offers three and the primary has to fit. WHICH THREE DIFFERS BY SHAPE — Create and Link-existing wherever a document can have children; "Link to a parent agreement" on a STANDALONE only (linkError already refuses it for a master, and a control whose one outcome is a refusal is furniture); a child gets Unlink alone.
- CREATE MINTS A DRAFT AND FILES IT IN THE SAME BREATH — there is no window in which it is a loose contract somebody must remember to link. CARRIED: counterparty + their address, `party` (the DOCUMENT's entity, not FIRST_PARTY), stream, letterhead. NOT CARRIED, each for its own reason: the value (a copied figure is a guess wearing a fact's clothes) though `valueType` IS inherited (whether money passes is the parent's answered question — see isMonetary), the effective date, the obligations, and who signs (a signature is given to one arrangement).
- THE NAME IS A RECORD, SO IT KEEPS ENGLISH — `RELATION_DOC_WORD`, not RELATION_LABEL (which is the SCREEN's word, is built from getters at load time, and follows the reader). Numbered PER KIND (`amendmentOrdinal`), because "Amendment No. 2" is wrong after one amendment and three annexes; a Declined document still holds its number.
- THE BODY IS ALWAYS WRITTEN, never left absent. Skeleton (default, tick-box) = four English paragraphs — the two recitals, the "amended as follows" line and the survival clause; blank = `FAMILY_BLANK_BODY` (`<p><br></p>` — `''` sends docBody down the template branch and `<p></p>` is dropped by the sanitiser, which lands back on `''`). ENGLISH ALWAYS, matching all twelve built-in templates (docBody's BUILD) and this document's own title; a skeleton following the reader would put a Swedish body under an English title on a page the counterparty reads. The recitals are not decoration — `looksLikeAmendment`/`suggestParents` match on exactly this shape when the document comes back through an import.
- IT LANDS ON THE DOCUMENT TAB and is the ONE creation site that does not call roomOpenOnTerms. The rule's own reasoning exempts it: a new draft goes to Key terms because its document is a template full of blanks fed from the terms, and here every term is already copied from the parent and the document is the empty thing the reader pressed the button to go and write. f170 NAMES js/family.js as the eighth site and asserts the exception rather than leaving it to be discovered.
- A DOCUMENT WITH NOTHING ON IT SAYS SO, in the corner: `docHasNoWording` / `docNothingWrittenHtml`, in the room's notice stack, REPLACING the working-text note (which offers Edit and Compare over wording that does not exist). Never on the paper — the standing rule.
- ONE LATENT CRASH FELL OUT: docBody read `TEMPLATES[c.template].kind` while the line beside it fell back to `BUILD.ND`, so a contract with no template and no stored wording took the whole Document tab down. Nothing could reach that state until this feature; both halves of the expression agree now.
- SMALL ENGLISH FIX IN THE SAME AREA: "filed as a addendum / a annex" — `_famAn` for the audit line and the toast (English records), and the visible sentence dropped its article entirely (`fa_filed_as`) because English wants a/an by the word and Swedish en/ett by the noun's gender, and the seven relations split both ways.
- CHANGED 14 Aug 2026, owner-ruled after the legal audit (this REVERSES the line that stood here): `effectiveExpiry` counts only an EXECUTED child — `amendmentExecuted`, the same three signals negoExecuted and the server's isExecutedRow read. A draft amendment has no legal effect, and a renewal reminder is acted on without anybody re-checking why it says what it says. THE PROPOSAL IS NOT LOST: `proposedExpiry(c)` is the other half and returns `{date, from, id}` for the latest UNSIGNED term-changing child, null where it proposes what already stands; the family card states it beside the live date in amber (`fa_proposed_term`). THE SERVER'S TWIN IN runReminders MOVED WITH IT — a reminder that disagreed with the screens would be the worst half to leave behind.

Tests: f193 (37 — the link from the first moment, what is carried and what is not, the naming, both bodies, one level deep, the panel's three states), f176's two blocks REVERSED IN PLACE (the row is back and the card has moved), f170 (the named eighth creation site), amendment-journey-verify (42, browser — the swap measured against Key terms, the whole create-and-open journey, the recital's date through the real fmtDocDate, the borrowed obligations card in the panel, and the signed-contract rule both ways).

## A NEW DRAFT OPENS ON KEY TERMS

roomOpenOnTerms(id) registers the intent; wsTabDefaults consumes it. THREE properties (f170): ONCE (id deleted on arrival; same-contract tab memory _wsTabFor untouched), **NOT-YET-EXECUTED ONLY** — this read DRAFTS ONLY until 20 Aug 2026, when the owner reported an uploaded contract landing on the Document tab: the uploader registers the intent like every other site, and an upload naming a counterparty is filed 'Under Review', so the rule threw the request away. THE REASONING SURVIVES THE WIDENING and is stronger for an upload, not weaker (a new draft goes to Key terms because its document is a template full of blanks fed FROM the terms; an upload arrives with a complete document whose TERMS are the blanks, just read out of the file and waiting to be confirmed). What stays excluded is an EXECUTED agreement — negoExecuted, not `status==='Signed'`, so a sealed record that arrived by migration is excluded too. An explicit request (_wsTabWant) still wins. SEVEN creation sites register it — wizard, built-in template route (app.js), library template form (templatefields.js), versioned template library, clause library, "Draft new agreement" in the room, migration importer — there is no creation funnel, and f170 reads all seven sources and fails on an unregistered eighth. roomCurrentTab() exists so the rule is observable.

## THE TERM IS ONE FACT / TEMPLATE FIELDS

docTermSpan(c) (js/views/contract.js, above docBody) is the one reading, both directions:
- Paper reads record: both dates known → the term clause states THEM, the years blank is not drawn. Otherwise the blank stands.
- Record reads paper: typing a term fills an EMPTY end date only (wireDocumentSync, on change not input — a mid-keystroke repaint steals the field). A FILL, NEVER AN OVERWRITE.
- Four of the twelve built-ins draft a term clause (DOC_TERM_IN_CLAUSE); the other eight say it on the RECITAL, appended once after BUILD — never a fifth clause (scan findings anchor on c1…c4).
Every screen shares docBody, so this reaches everywhere with nothing to fix twice.

A TEMPLATE ASKS ONLY FOR FACTS ITS OWN PAPER STATES, plus essentials. TEMPLATE_PAY (js/templates.js): per-template payment answer — a key and default, or its own clause's blank (distributor creditDays — two blanks for one fact disagree), or null (NDA carries no money; leases fall due in advance). A question with no answer on the page is worse than a missing question. The test that matters walks ALL TWELVE: every asked field must appear as a data-field in that template's own docBody.

builtinTemplateFields NO LONGER CACHES — {...f} froze a currency-label getter (the getter trap, third meeting). Copied by descriptor. A month is named with its whole year — fixed at the three shared label functions: pfMonthLabel, _acMonthLabel (js/aichart.js), repMonthLabel.

Tests: term-and-fields-verify (24, browser).

## A CONTRACT KNOWS WHOSE IT IS (14 Aug 2026)

`c.owner = {id, name}` — BOTH halves earn their place: the id survives a rename, the name survives the account being deleted and is what the audit trail and the approval rules already speak (an approver is bound by name here). contractOwnerStamp(c) is called at ALL SEVEN creation sites — the same list f170 walks, and f199 walks it too and fails on an unregistered eighth. STAMPED ONCE, NEVER OVERWRITTEN: handing a contract over is a real act with its own audit line and is deliberately not built.

THE BACKFILL IS NARROW, and rides migrateContract like _repairValueType: _repairOwner only where `owner` is absent; the first Created/Uploaded/Migrated entry; 'System' is NOT an owner (the seeded portfolio belongs to nobody); a name matching no current member still counts, with id null — somebody who has left still raised it.

READ THROUGH contractOwnerName / contractOwnedBy, never the raw field: the stored owner first, then `_raisedBy` (the server's stop-gap, see the section below), so a light row answers before the backfill has ever opened it. HEAVY prefers the STORED owner over the trail — the record is the senior of the two, or a contract handed over later would go on reporting whoever first typed it.

OVERSEEN BY — a per-person approver, and the owner field is what made it possible. overseerFor(c) resolves the contract's OWNER → their overseerId → a live member; overseerCfg().on is a workspace switch, OFF by default. It joins buildApprovalChain as an ordinary step sorted LAST, so approvalState, the panel, the refusal and the dashboard count all inherit it and nothing grows a second gate; its decision survives a rebuild by the same ruleId lookup the rules use (OVERSEER_STEP_ID).
- A CONTRACT NOBODY RAISED GETS NO OVERSEER STEP. Imported and uploaded paper has no owner and never will; making it unapprovable would strand it, so the ordinary rules apply unchanged and the panel says so.
- NOBODY OVERSEES THEMSELVES — refused in the predicate AND on PATCH /api/users/:id, which also refuses a non-member and a Viewer. It is an ADMIN GRANT: somebody who could pick their own approver is not overseen, and it cannot ride along with a job title.
- Removing somebody who oversees others WARNS by name, beside the negotiation-lead warning and for the same reason: the step stays and names an account that no longer exists.
- KEYING IT OFF THE READER WAS REFUSED (the approval panel would say different things to different people — the fault this rulebook opens with), and so was the desk lead (absent on most contracts).
Tests: f199 (34 — the seven sites, the backfill's four refusals, the chain both ways, and the server's grant).

## WHO RAISED THIS SURVIVES THE LIST (owner-reported 14 Aug 2026)

"Decisions due" is two halves — what this reader can APPROVE, and what they RAISED — and the second half asked the audit trail: `(c.audit||[]).some(a=>/creat/i.test(a.action)&&a.user===me.name)`. The dashboard reads state.contracts, which in server mode is the LIGHT list, and HEAVY strips `audit` out of every row on purpose. So it answered false for everything in server mode and true in local mode, where records are whole — correct everywhere except in production, which is why it survived. Reproduced against a real server before it was touched.

THE FACT IS CARRIED, NOT THE TRAIL. raisedFrom(c) (server/server.js, beside HEAVY) reads the first Created/Uploaded/Migrated entry in the one place that still HAS the trail, and HEAVY sends `_raisedBy` / `_raisedAt` on the row. UNDERSCORED BECAUSE IT IS TRANSPORT: a contract gains no owner from this, and saveContract deletes both alongside _light/_loaded/_v — a derived field written back into the record is stale the moment the trail says otherwise, and then there are two answers to one question. 'System' answers NOTHING (it is what the seeded portfolio stamps; answering with it puts the whole demo book in somebody's queue). The reader falls back to the trail where there is one, so local mode and an opened contract are untouched.

AND REPORTS HAD THE SAME WOUND, fixed in the same pass. computeReports also reads state.contracts and measures two things off the trail. MEASURED before the fix, on a contract raised 20 days ago and signed 8 days ago and another sitting 15 days in Draft: cycle time came back null for EVERY signed contract, and stage age came back 0.0 days for all of them. The zero is the nastier of the two — null shows as "no data", while 0.0 reads as "nothing is stuck", which is the opposite of the truth and is the number somebody would act on. auditDatesOf (server, beside raisedFrom) carries `_raisedAt` / `_signedAt` / `_lastAuditAt`; repRaisedAt / repSignedAt / lastActivity prefer them and fall back to the trail. THE DATES ARE NOT THE PERSON: a seeded sample has no owner to name (System) but WAS raised on a day, so it gets dates and no `_raisedBy`.

THE REAL ANSWER IS A STORED OWNER on the contract — WORKORDER-contract-owner.md — and it supersedes the `_raisedBy` half the day it lands.

Tests: f198 (13 — fails FOUR ways against the old code on the dashboard half, which is what makes it a regression test rather than a description; the reports half pins the two figures against a real server).

## SIGNING ON THE PAPER (owner-asked 29 Aug 2026, J-1)

*"while in document tab, you can enter signature on the contract ... you will
be navigated to the spaces where you can sign your name just like docusign at
final stage you will be directed to the signature block to sign officially."*

**THE RULE EVERYTHING RESTS ON, and every claim in f256 is a way of failing
it: PUTTING A MARK ON THE PAPER IS NOT SIGNING. The contract is executed by
one press, in one place.** A feature that draws signatures on a contract and
half-executes it is worse than no feature at all, so the four promises are
asserted DIRECTLY rather than inferred: `c.signatures`, the status, the seal
and the plan rows are untouched by every act here; the wording does not freeze
(`c.signSpots` is neither of the two stores `negoAnySignature` and
`anySignatureRow` read); a placed mark does not travel; and a mark sits OVER
the paper, never inside the wording — it never reaches `negoFileChange` and no
fingerprint moves.

- **ONE SHEET, TWO TABS.** The Signing tab draws the Document tab's own canvas
  — `data-ws-pane="docs sign"`, a space-separated TOKEN LIST, matched with
  `.split(/\s+/).includes(k)`, so a pane naming one tab behaves exactly as it
  did. **MEASURED BEFORE IT WAS WRITTEN**, as the work order demanded: a second
  contract pane would have been a second paper to keep in step, and what this
  costs instead is a token match plus one extra child of `#doc-right`. The
  right column carries `[data-doc-col]` and `applyWsTabs` toggles which of the
  two is showing — the signing order and the signature block, or the Checks
  card and the discussion.
- **A SPOT IS ANCHORED TO A CLAUSE ID (D-1) AND CARRIES NO OFFSET AT ALL.**
  It is the SAME id a change is filed against, which is what makes the anchor
  survive an edit — and it only survives at all because `richdoc`'s allow-list
  admits `data-clause-id` by name. **THE IDS ARE MINTED AT THE PRESS**, by
  `negoStampContract` — the product's ONE act for it, attributes only, not a
  word of the agreement moves — because a READING may not perform a write:
  `signSpotProposals` offers by POSITION, and positions are stable across that
  stamp, which is what makes it safe. Where there is no working text there is
  no addressable clause and **nothing is offered**, rather than offered against
  something that would move.
- **HaTi PROPOSES, A PERSON PLACES (D-1).** `SIGN_SPOT_CUE` is deliberately
  narrow — the phrases a contract uses when it wants a mark in the middle of
  itself, plus a rule of underscores. "sign" alone is ordinary contract
  language and matching it puts a signature box in the middle of an indemnity,
  which is worse than missing one.
- **A SPOT BELONGS TO A ROW ON THE SIGNING ORDER (D-2)**, so there is no second
  list of people to keep in step. `signSpotSeat` matches the member record
  first and the address second — `internalSignerRecipient`'s own order — and a
  counterparty row is NEVER this reader.
- **"SPOTS STILL TO FILL" JOINS `signBlockers` (D-3)**, so the button disables
  itself and wears the reason like every other refusal in the product rather
  than being a new kind of thing. **MINE ONLY**: a spot waiting on the other
  side is not a reason this reader cannot sign.
- **A SPOT THAT IS NOT YOURS IS DRAWN AND NOT PRESSABLE.** It is a `<div>` and
  not a disabled `<button>`: a control nobody in this chair can press is not a
  control, and drawing one dead is how a reader comes to blame themselves.
- **TWO ACTS, TWO DOORS.** Filling a spot is done ON the paper, where the spot
  is; ARRANGING who signs where is done in the signing column, where the
  signing order already lives — that is what a person is doing when they are
  arranging one, and it keeps the paper a contract rather than a form with a
  toolbar on it. The card draws NOTHING where there are no spots and no
  proposals; a third card describing an empty list is furniture.
- **THE WALK IS IN THE TAB ROW'S OWN SLOT AND NEVER FLOATS** — the standing
  rule *NOTHING FLOATS OVER THE PAGE*, and that row is an in-flow strip on
  screen wherever the reader has scrolled. It counts only THIS reader's spots,
  because a walk through somebody else's is a walk to nowhere, and its last
  press lands on `data-anchor="sig"` and `#sign-btn` — the block that actually
  signs.
- **THE MARKS ARE PAINTED AFTER THE CANVAS, ON `wireDocCanvas`** — the one
  funnel that re-arms everything inside `#doc-canvas` on every re-render — and
  never inside `docBody`. That is what keeps three promises at once: docBody is
  what the share copy, the exports and the counterparty's page all render, so a
  mark that lived in it would travel; the wording is untouched, so no
  fingerprint moves; and the spot is a SIBLING of the clause's blocks rather
  than something inside a sentence.
- **THE MARK FOLLOWS THE READER'S OWN TEXT SIZE**, `calc(px * var(--doc-scale,1))`
  — the lesson this page has learned four times, applied without waiting for a
  fifth report: the paper scales, the furniture does not, and a mark ON the
  paper is paper.

**D-4 IS DELIVERED WHERE IT CAN BE, AND THE DEPARTURE IS NAMED RATHER THAN
SLIPPED IN.** The decision asked for the mark to be *"baked in at the moment of
signing, so the sealed copy looks like a signed contract"*. **IT IS NOT BAKED
INTO `execution.html`, and the reason is a fact about this codebase rather than
an opinion**: `freezeContractHtml` seals the SANITISED fragment, and
`js/richdoc.js`'s allow-list has **no IMG tag at all** and refuses `href` by
design — so baking a signature image in means admitting an arbitrary URL into
stored markup on every contract in the workspace in order to draw a picture on
one. That is a security boundary this product holds deliberately and a
signature mark is not a good enough reason to widen it.

**SO "BAKED IN" IS DELIVERED AS IMMUTABILITY INSTEAD.** The marks live on
`c.signSpots` — which is where a signature image already lives in this record,
beside `c.signatures[].image`, so it is not a new class of storage — and
`signSpots` joins **EXECUTED_IMMUTABLE** on the server. **A sealed record's
marks are the marks it was sealed with.** Safe for the same reason `status` is:
`finalizeExecution` writes the seal, the status and the spots in ONE save, and
that guard is asked as a DIFFERENCE against the STORED record, which is not yet
executed when the save arrives. f256 asserts the reason as well as the rule —
**if `IMG` ever joins the allow-list that test fails and somebody re-reads this
decision** rather than discovering it.

**AND WHAT IMMUTABILITY DOES NOT BUY, said plainly rather than left to be
inferred.** D-4's goal was that *the sealed copy looks like a signed contract*,
and the substitution does not reach it by any route: `freezeContractHtml`
renders the wording alone, `exportPDF` rebuilds from a fresh `docBody`,
`exportWordTracked` renders `redlineDocHtml`, and the share payload carries
nothing. **So the marks exist only as runtime paint on the owner's own screen**
— after execution the sealed copy, every export and both parties' copies look
exactly like an unsigned contract in the middle. What is delivered is that the
RECORD of where each mark was placed cannot be altered afterwards; what is not
delivered is a picture of it on the paper. If that is wanted it needs the
allow-list decision above taken deliberately, not slipped in.

**NOT BUILT, said out loud (D-5): the counterparty does not get the walk, and
they cannot see the marks at all.** Their screen is `renderSharePortal`, a
different page reached by a link, and giving them the same walk is roughly as
much work again as everything above. **THE FIRST WRITING OF THIS PARAGRAPH SAID
"their spots are still drawn on their copy" AND THAT WAS FALSE** — `signSpots`
is not on `buildSharePayload`'s allow-list, so a place drawn for a counterparty
signer (which our sheet draws as an un-pressable div, so we can see what they
will have to do) is invisible to them. Nothing about the wording is lost; what
is lost is the signpost, and it is a real gap rather than a decision. **Their
page IS byte-identical** and that is now measured rather than asserted:
signing-on-paper-verify 8b builds the payload with the marks on the record and
again with them taken away and compares the two character for character. A rule
that misdescribes the code is worse than no rule, and this one did for a day.

Tests: f256 (node — the rule, the anchor, the refusals, the seat, the walk's
arithmetic, D-4's departure, both languages, and **section 11, the server's own
half against a running server: a mark placed AFTER a signature is accepted and
a word moved in the same breath is refused**), signing-on-paper-verify
(browser — the pixels above the wording measured on BOTH tabs **and the
Document tab's own number measured with the marks and without them**, the spot
on the sheet, the walk pressed for real, and the counterparty's copy proved
identical).

## THE THREE SCREENS THAT DRAW THE AGREEMENT AGREE (owner-asked 28 Aug 2026)

*"I would prefer that the Document and the edit with copilot page reflect
exactly what has been built in the negotiations page … including the grey
lighting in the sides."*

**THAT GREY IS NOT A FORMATTING — IT IS NOTHING.** `.rl-doc` paints no
background, so what shows beside a capped sheet is `--color-bg`, the page's own
ground. Two screens differed and in two separate ways:

- **`.ce-paperwrap` PAINTED OVER IT.** It set `--color-surface` and drew a
  border besides, which is the whole of why the clause editor read as a
  different product from the page it opens out of. **One declaration removed,
  not a colour added** — the smallest change in that whole work order.
- **AND THE DOCUMENT TAB MAGNIFIED, up to 2×.** `DOC_PAGE_W` was 660 and
  `RL_SHEET_MAX` 860: **two numbers for one fact**, with a zoom on top fitting
  the smaller one to the pane. Both read **`--doc-sheet-max`** now, and so does
  the clause editor, which draws the same `.rl-paper`.
- **WHAT IT COSTS WAS SAID BEFORE IT WAS BUILT AND THE OWNER RULED TWICE: on a
  wide monitor the Document tab's words get SMALLER, up to half.** "Looks great"
  on that tab WAS the magnification. **The argument for it:** the A⁻/A⁺ stepper
  writes `--doc-scale` on both screens, so the reader already has a deliberate
  size control — and the magnification was doing that same job by GUESSING from
  the window width. One setting the reader asked for beats two mechanisms
  arguing, and the negotiation page settled the same question the same way on
  22 Aug 2026.
- **`applyDocZoom` IS PINNED AT 1, NOT DELETED** — `rlApplyDocZoom`'s own
  precedent: several callers ask the layout to re-fit and one named thing they
  can all keep calling beats four private opinions. `DOC_ZOOM_MAX` is gone.
- **BUILT AS THE RULE, NOT THE LOOK**, which is what makes it survive the
  measure changing later: all three read one declaration, so a future retune
  moves all three at once and there is nothing to redo.

## THE CONTRACT ROOM'S HEAD IS A BREADCRUMB, A TITLE AND FOUR FACTS (owner-asked 22 Aug 2026)

Redesigned to the mock-up, and the region was ringed in a screenshot: everything above the tab strip.

- **A BREADCRUMB, NOT A BACK ARROW.** `#ws-back` **is still the button** — same id, same title, same `data-back`, same handler in wireRoomHead — restyled as the crumb it always behaved like. That is what makes it safe on the negotiation page, where this control is the only way back to the agreement. `.room-back` is STALE.
- **STATUS IS COLOURED TEXT** — `contractStatusTextHtml` (js/core.js), sharing STATUS_META and the partially-signed and expired branches with `contractStatusChip` so word and tone can never disagree. **The chip is NOT retired**: every register row, card and list still wears it, and there it is right — a scanned column needs a shape to catch the eye, which is the opposite of a head row's problem.
- **THE RUN-TOGETHER SUB-LINE BECAME A FACT ROW.** It opened "MK-B2 · Sales & Route-to-Market · Round 1 · KES 78,000,000 · updated 10 Jul 2026" — five kinds of fact in one grey sentence, none labelled. `roomFactsHtml` draws four label-above-value pairs divided by hairlines, the same treatment Key terms uses one screen down. It **borrows every reading**: negoMovePillHtml for whose move (the register's own builder), fmtMoneyOf for the amount in the contract's own currency, docTermSpan for the term. An absent fact is drawn and named with an em-dash, never omitted — a row that loses a column reads as a different page.
- **A COLLAPSE CONTROL** overhangs the row's lower rule, centred. It folds the FACTS only: title, status and acts never move, because a head whose buttons jump when you fold it is one you stop folding. Per sitting, in memory, a class flip and never a repaint (the head is built once per render; a repaint would drop the acts' handlers). **AND THE PRESS IS THE WHOLE OF IT — REVERSED IN PLACE 10 Sep 2026** (owner-asked: *"remove the feature where I scroll up they collapse automatically. Let the user click to collapse and expand"*). Between 25 Aug and now the row ALSO folded itself on scroll — SAP Fiori's dynamic page header, one capture-phase listener on `document`, written to buy the contract those pixels without anybody asking. **IT IS THE SAME COMPLAINT THIS PAGE HAS NOW HAD TWICE**: the 26 Aug narrowing (*"fix scrolling in the tracked changes area so that when you scroll down the page does not collapse"*) answered one instance of it by naming which scroller counts; this answers the class by taking the second opinion away. `document._wsSnapBound`, `paintSnap` and `window._wsSnapApply` are STALE — flag any mention. Nothing else moved: the choice is still the reader's, still per sitting, still a class flip. Tests: f278 (1)/(2), **room-head-fold-verify (18, browser — renamed from snap-header-verify with its claims REVERSED IN PLACE; two of its three founding claims are unchanged and the headline one is now the owner's own gesture, measured: 3 of 4 node claims and the scroll section fail against the parent)**.
- **NOT DRAWN ON THE WORKBENCH** — that page's head is one compact row by the mock-up's own drawing, and the facts a negotiator needs (round, whose move) are already on its own row.
- **AND THE FACT ROW SITS AFTER THE ACTS IN SOURCE ORDER**, which is load-bearing: `.room-head` wraps, and a full-width item placed before the acts pushes them onto a line of their own. Caught by photographing it.
- **THE WHOLE HEAD IS A WHITE BAND (owner-asked 23 Aug 2026** — "the highlighted area should be white just like highlighted in the attached html"). The mock-up paints all three of its head strips — `.h-title`, `.h-hc`, `.h-anchor` — on `var(--surface)` and keeps the grey for the page BELOW them; this room painted **none** of them, so the crumb, title, acts, fact band and tab row all sat on the page ground. MEASURED: `#ws-head` computed `rgba(0,0,0,0)` over a body of `rgb(244,246,246)`. **`.room-band` IS A WRAPPER, NOT A BACKGROUND ON EACH STRIP** — painting the three separately leaves the 8px flex gap between them grey and gives three bars instead of one band — and the wrapper is also what lets it bleed: `margin:-6px -16px 0` cancels the view's own padding, `padding:6px 16px 0` puts it back inside, so the white runs to the shell's edge while nothing it contains moves by a pixel (the head still starts at x=272, asserted). **IT ENDS AT THE TAB ROW'S OWN HAIRLINE** — no bottom padding — and `#ws-actionbar` is deliberately OUTSIDE it, because the mock-up's `.h-content` sits on the grey too. `#ws-strips` is inside it: it is `display:contents`, so its children become the band's flex children, and closing the wrapper early would drop any strip onto the grey.

## ONE PRINT DIALOG, AND IT GOES AWAY WHEN YOU DISMISS IT (owner-reported 23 Aug 2026)

"You click on print history then decide to click cancel, there is a bug because it flashes then the whole page reappears again without cancelling."

**TWO FAULTS IN negoHistoryPrintRun, and together they are the whole report.**

- **print() RAN TWICE.** The report window was asked to print from its `load` handler AND from a 350ms timer, and MEASURED by counting the calls on the popup, **both fired: 2**. Cancel dismissed the first dialog and the second re-opened it a beat later — the "flash", exactly as described.
- **AND NOTHING EVER CLOSED THE WINDOW.** `w.close()` existed only on the build-failure path, so whatever the reader chose, the report stood there afterwards at about:blank. That is the other half of "the whole page reappears".

**BOTH TRIGGERS STAY, BEHIND A ONE-SHOT LATCH — the timer is NOT redundant.** `load` can fire between `document.close()` and the line that assigns the handler, and then the timer is the only thing that prints; delete it and the button silently does nothing on exactly the runs hardest to reproduce. So whichever arrives first prints and the other finds the latch shut. **ONE print() CALL SITE**, asserted, so a third trigger cannot be added beside it without going through the latch.

**THE WINDOW CLOSES ON `afterprint`, AND THE LISTENER IS REGISTERED BEFORE print()** — print() blocks until the dialog goes, so registering after it is registering too late. Chrome fires `afterprint` for **Save and Cancel alike**; we cannot tell them apart and deliberately do not try — either way the reader is done with it, and the report rebuilds in one press. Where `afterprint` never arrives the window simply stays open, which is today's behaviour, so the fallback is the status quo rather than a new failure.

**THE STUB IN THE TEST IS THE HONEST PART.** A real print dialog cannot be driven from a runner, so print() is replaced by what Cancel actually does: record the call, then fire `afterprint`. And **the tally is kept on the OPENER** — with the fix in, the window closes so fast that a counter inside it races the close and reads empty, which is the fix working and would have read as a broken test.

**NOTHING ELSE IN THE PRODUCT HAS THIS SHAPE**, checked rather than assumed: `exportPDF` prints the page you are on (one call, no window), the health report puts a Print button inside itself for the reader to press, and the calendar prints its own page. This popup-and-print pattern exists once.

Tests: history-head-verify (35 — the menu opened first because the button is in the DOM the whole time and a presence check alone passes while the press times out; then one dialog not two, the window proved closed, both triggers proved still wired to the same latched call, and the listener proved to come before the print. Four of them fail against the code of an hour before, reporting "print() called 2 time(s)").

## SIGN LINKS AND SIGNERS

A REVIEW LINK CANNOT SIGN, and the server is where that is true: POST /api/shares/:token/respond refuses action:'sign' on an EXPLICIT purpose 'negotiate' only (403, names the way out) — purposeless legacy links infer the phase and are not refused. Accepting the wording is still allowed (it executes nothing). portalRespond refuses one layer earlier, in words.

A Sign link binds to the stored route: shareSignerPickHtml draws the route in the share dialog; picking a row fills the recipient AND sends signerId (the server's address-match survives as backup). Internal rows are DRAWN AND NOT PICKABLE (they sign in-app; hiding them falsifies the numbering); pressing the chosen row again releases it; openSignerPlanEditor(c, {onDone}) returns to the dialog, not the workspace. "Propose a different value" is GONE from the signing panel (it was silently discarded and the wrong shape — price is agreed in the WORDING); the reading side stays — a round carrying proposedValue still shows and applies (f7's assertion reversed).

WHO THE LINK IS ADDRESSED TO — THREE RECORDS, ONE ORDER. shareModalPrefill (js/core.js) is the ONE answer and it asks, in this order: shareRouteRecipient (the counterparty signer whose TURN it is — never internal, never already-signed, never one without an address), then the last link we sent, then the address on Key terms. It returns `source` with the answer, because the dialog SAYS where the box was filled from and was saying "from the last time you shared" over an address that came from elsewhere; sharePrefillNote picks the sentence. A route prefill also opens its own signer row CHOSEN (signerSel seeded from pre.signerId), so the link binds to the person it is addressed to; pressing the row still releases it.
- THE PREFILL IS NOT THE CHANNEL. counterpartyContact deliberately does NOT read the route: it answers where a ROUND goes (the one-press send, reshareToLastRecipient onto the standing link), and naming a CFO must not silently re-point a negotiation. With nothing else on record the send falls through to the dialog, which prefills from the route and shows it before it goes.
- THREE DOORS PREFILL: the desktop dialog, the phone's share sheet (mOpenShareSheet — TWO entrances reach it, so the prefill lives there), and the route editor's own opening slots (approvals.js, the other direction). The Key terms address is never rewritten by a route; where the two disagree Key terms prints the route's own row (ktRouteEmailRowHtml) naming the signer, and prints nothing when they agree. Read-only kt rows now carry data-kt-row like every other row.
Tests: f182 (order, sources, what does not move), share-recipient-verify (21, browser + phone — the dialog, the chosen row, the Key terms row, the phone sheet).

NAMING THE SIGNERS IS WHAT OPENS SIGNING (owner-instructed; this REVERSES the earlier "no route is not an error" decision — that reasoning was sound and was weighed; the wall is wanted):
- signingRouteOpen(c) (js/approvals.js) is the ONE predicate: a NAMED signer on EACH side. signingRouteMissing(c) → 'ours'/'theirs'/'both'/null so screens say which side is absent. Signed rows still count (finished routes are refused further along, in their own words).
- FOUR doors ask it: the share dialog's doSend; POST /api/shares (reshare passes no purpose on two callers and the fallback reading can be 'sign' — the dialog is not the only door); POST /api/shares/:token/respond (the wall that holds alone, asked of the STORED contract); wsNextAction (instructions the product won't honour destroy trust). An EXECUTED contract is exempt at the mint door.
- ONCE ANYONE HAS SIGNED, THE ROUTE IS SHUT — a signature is given to a specific arrangement (wording, parties, order). signingLocked(c) reads BOTH stores (plan rows AND c.signatures — a counterparty's mark reaches c.signatures only when the owner's browser applies it). The editor is REPLACED by openSigningLockedNotice (who signed, what a restart costs, the one way forward; Close primary, Restart secondary). signingRestart(c) MINTS FRESH ROW IDS — the mechanism: outstanding links are bound to row ids and the server already refuses an unknown row — and clears compliance.consent, writes an audit line.
- The server guards as a difference: recording a signature passes; the ONE permitted route change is the full restart, recognised by its RESULT (nothing signed, no signatures on the record).
- The editor opens with a slot per side, prefilled from the record, a live per-side tally, and a refusal naming the missing side.
- defaultSharePurpose answers 'negotiate' while nobody is named to sign (a default the send refuses is not a default; Sign stays first in the picker). 'view' is a real purpose offered on desktop AND phone (it was phone-only once — the duplication warning in its least obvious direction). A NEW REFUSAL NEEDS ITS ALTERNATIVE ON THE SAME SCREEN — the message names Negotiate/View only. defaultSharePurpose's no-module fallback repeats signingRouteOpen's single line rather than assuming true (an optimistic fallback breaks only in test worlds). The no-route block is amber + primary door ONLY while true (an always-on warning is furniture). Three sentences that promised signing were removed with it (share dialog's assumed-signatures line, Signing tab's "No route set" paragraph, counterparty's "Ready to sign" → "Nothing outstanding between you").

Tests: sign-links-verify (29, browser + raw POST — exercise the review link FIRST in that file: issuing a signing link retires negotiation links before the purpose check fires). EVERY test that issues a signing link needs nameASigner(client, id) (test/helpers.js — names BOTH sides, counterparty FIRST so counterparty links are live). "Nobody has been named to sign" in a test = missing that line, not a broken test.

AN INTERNAL SIGNER IS TOLD WHEN IT IS THEIR TURN — ONE BUILDER, ONE RECORD, ONE PER TURN (owner-asked 2026-08-12). Three states existed: route issued with an internal signer FIRST sent nothing at all (issueSigningRouteLinks only knows counterparty rows); internal→internal sent a mail from the owner's BROWSER; counterparty→internal sent a different, hard-coded-English mail from releaseNextSignerLink. notifyInternalSignerTurn (server/server.js) is now the ONE door and every trigger calls it: PUT /api/contracts/:id when the turn actually MOVED (asked as a difference, like every other guard there — that is what stops it firing per repaint/save/poll), releaseNextSignerLink, and the resend route. The wording is internalTurnEmail over mail_int_turn_* in EN and SV.
- IT IS NOT A LINK LIKE THE COUNTERPARTY'S. Theirs is a tokenised no-login share; an internal signer signs INSIDE the app on a session, which is what makes the signature theirs. Minting a token for them would be a way to sign without signing in. The mail carries an app URL: contractSignUrl → `#contract=<id>&tab=sign`, honoured by openFromHash in startApp (js/core.js) — NOT in boot(), because boot runs before sign-in and the hash has to survive the sign-in wall; the hash is spent once used.
- THE ADDRESS IS OURS TO DECIDE. /api/contracts/:id/notify-signer used to mail whatever `email` the body carried — an open relay wearing this workspace's name, the exact rule the review-request route beside it states. It now takes signerId only, REFUSES a body-supplied address (400), and resolves through internalSignerRecipient: the member record first, the stored route row second. Nowhere to write is a FACT, not a no-op (409 "no email address on file").
- THE OWNER SEES IT WENT. New table signer_notices — the internal half of shares.sent_at — rides back on GET /api/contracts/:id/shares into _noticeCache/cachedSignerNotices, read by signerNoticeState (js/approvals.js): notified / notify-failed / no-address / untold / waiting. The signing-order card carries the badge, the sentence and a resend (data-sp-notify), offered on the three states where a press does something and NOT on no-address. A resend passes force; the automatic paths send once per turn.
- NEVER on an executed contract, a complete route, a counterparty row, a signer already signed, or one whose turn has not arrived — each with its own 409 sentence. A failed send never fails the signature that triggered it. THE PHONE draws no signing-order card (unchanged); the mail and the deep link work from a phone browser.
Tests: f185 (19, the whole ladder against a real server: the gap, both existing rungs, the refused body address, the member record outranking a stale route address, one-per-turn, and the signature surviving a failed nudge), f136 (the internal row's two new states), sign-links-verify section 4 (browser — the card, the resend, and the link landing on the Signing tab).

## PARTY vs WORKSPACE — who we are on this agreement

contractParty(c) in js/core.js is the line between two facts:
- FIRST_PARTY = the WORKSPACE. Right for everything the PLATFORM says: buildSharePayload's org and sharedBy, internal notes, the Copilot's company, the evidence pack.
- c.party = the LEGAL ENTITY on THIS agreement. Right for everything the DOCUMENT says: docPaperHeadHtml's "Between A and B", all twelve recitals, rlPaperFootHtml, signPartyBoxes (both branches), the frozen execution record, canonicalDoc.
THE RULE: does the DOCUMENT name us, or the PLATFORM? An unanswered party falls back to the workspace (no migration repair needed) — but out loud: the drafting field arrives prefilled and overtypeable. Asked in FOUR places (no creation funnel): TEMPLATE_BASE_FIELDS, CONTRACT_ESSENTIALS, openTemplateFillModal's form, and the Key terms panel (the only door for uploads and migrations). Maps via TPL_MAPS 'party' → applyTemplateValues; a template's own blank wins. The phone shows it read-only above the counterparty. The arrow under a label stands down when it repeats the label (compared case-insensitively — the two languages capitalise differently). `party` is on term-and-fields-verify's ESSENTIAL exemption list (prints through the recital; the very next check proves the printing). Tests: signers-and-party-verify (49, browser, raw POSTs).

## THE CONTRACT ROOM — four tabs, one shell that draws them

Key terms / Document / Signing / History. renderWorkspace (js/views/contract.js) draws all four from roomTabsHtml() and routes through roomGoTab(); add tabs in ROOM_TABS; NEVER write a second tab row. renderRedline (js/views/negotiation.js) NO LONGER ASKS FOR THE ROW — see the next section. The key 'redline' still ROUTES through roomGoTab (the Document tab's button and the returned-changes notice both ask for it); it just names no tab. A test world rendering the workbench needs buildWorld({negotiationView:true, contractView:true}) — f84, f89.

THE ROOM'S BACK ARROW GOES TO THE CONTRACTS PAGE, ALWAYS (owner-asked 17 Aug 2026: "it should always take me to the contracts page… never the negotiations page which sometimes it does"). goBack (wireRoomHead) used to replay state.wsReturn — "wherever you came from" — so a room reached from the Negotiations list sent the reader back there, while the arrow's label said "Back to Contracts" (the label map never knew 'redline' and fell through to the register's name): one button, five destinations, and a label that lied on exactly the reported one. Now setView('register') is a CONSTANT, the ONE survivor is a stream drawer (r.view==='folder' — the contracts page narrowed, and the label names the drawer), and both label sites collapsed to destination-not-origin (ct_back_queue/intel/calendar/portfolio/reports/advice are orphaned — left inert in the dictionary; ct_back_register now reads "Contracts", the page's own name). THE OTHER ARROW IS NOT THIS ONE: the workbench's data-back="contract" still lands on the Document tab, untouched — that page's only way out. Tests: f91 (the source shape — register a constant, origin not replayed, folder the one survivor), negotiations-door-verify 7b (the exact reported journey: room reached FROM the negotiation, back pressed, Contracts lands, the label agrees).

THE HEAD IS BUILT ONCE PER RENDER, so anything on it that changes underneath the reader needs a SLOT and a paint, called from applyWsTabs: #ws-tabrow-end → wsPaintTabRowEnd (the Document tab's door + text stepper), #ws-round-needs-slot → wsPaintRoundNeeds (the amber count on the round line). Wire where you PAINT, never also in wireRoomHead/wireWsTabs — both re-run and handlers stack.

## THE ⋯ MENU SAYS WHAT A ROW WILL DO (owner-asked, 13 Aug 2026)

TWO ROWS ANSWERED FOR, one deleted and one renamed, both on the room's overflow menu.

THE HEADER-FOLD TOGGLE IS GONE. It was a "Collapse the header" / "Show the header" row, and four faults compounded: (1) IT DID NOTHING ON THE DOCUMENT TAB, where it was photographed — the only element carrying data-ws-fold was #ws-actionbar, and that strip draws nothing there (the owner's own 10 Aug call, "open this space up for the contract exclusively"), so the press toggled an empty box; (2) ITS WORD WAS WRONG — the label said "header", its two tooltips said "bar" and "toolbar"; (3) IT DUPLICATED FOCUS MODE, one row above in the same group, whose description is literally "Hide the header and give the room to the document" and which actually does it; (4) IT LEFT A TRAP — the choice was per USER across every contract, so a press with no visible effect quietly stripped the action bar off Key terms, Signing and History everywhere until the reader found the menu again. WS_FOLD_KEY / wsChromeFolded / applyWsCollapse / wireWsCollapse, the `#ws-collapse svg` rule, the workbench's headAct that answered with a toast, data-ws-fold, data-ws-display and the keys ct_collapse_the_header / ct_collapse_bar / ct_show_toolbar / ng_header_shortest are ALL RETIRED — flag any mention as stale. #ws-actionbar keeps its own empty-strip hide, which is its own rule and never was this one's. Tests: f54's four claims reversed in place (the machinery is gone, the menu builds no such row, Focus mode is the one way), f91's data-ws-display claim reversed to the bare style hide.

"IMPORT THEIR RESPONSE" IS NOW "IMPORT THEIR WORD FILE" (ct_import_word_file, both languages). The old name said nothing about the thing a reader is actually holding — a Word document the other side marked up and emailed back, which is the commonest reason anybody opens it. THE ID IS UNTOUCHED (ws-import), so every handler and every test presses exactly what it always pressed. IT CARRIES NO SECOND LINE, and that was MEASURED not guessed: the box also takes a pasted response code, so the first build put "or a response code" in an .mnote like PDF's "clean copy" — at the menu's 252px that row wrapped to two lines in BOTH languages (54px against every other row's 35px), and the Swedish label wrapped even on a shortened note. The code route is the FIRST thing inside the box under its own instruction line, so nobody holding a code can miss it.

AND THE IMPORT BOX SPOKE HALF A SENTENCE IN EACH LANGUAGE. `<b>${i18t('co_or_upload_word')}</b>` was followed by hardcoded English, so a Swedish reader read "Eller ladda upp den markerade Word-filen they sent back. Their tracked changes are…". co_upload_word_tail carries the rest, and the box's other screen text went with it: co_import_not_docx, co_import_reading, co_import_unreadable, co_import_executed, and the toast through i18tn (co_import_filed_one/_other + co_import_comments_one/_other, co_import_nothing). THE AUDIT LINE STAYS ENGLISH on purpose — it is a RECORD, and this rulebook's own rule is that a label which is also a record keeps English.

THE FEATURE ITSELF WAS VERIFIED BEFORE ANY OF THIS, in a browser, in the real room: a marked-up .docx goes in and one change comes out filed as the counterparty's against the right clause, with the margin comment pinned to the clause it was written on, an audit line, a toast, and a wrong file type refused in words. NOT verified: the paste-a-code half, and the API_MODE path where comments post over the network.

## THE HISTORY TAB IS ONE FULL-WIDTH TRAIL (owner-approved render, 24 Aug 2026)

Third page of the page-by-page pass. The tab was a two-column grid — the trail
squeezed into 1.6fr, a **Versions card** taking the other third — and it is one
card the width of the page now.

**THE VERSIONS CARD IS RETIRED, AND WHAT IT COST WAS CHECKED BEFORE IT WENT.**
It listed versions beside a per-version Compare button, and **both were already
reachable twice**: `ws-compare` sits on the Document tab's toolbar AND on the
negotiation page, and `openCompareModal` builds its own list of every version
WITH restore. So the card was a third door onto a thing reachable twice, holding
a third of the screen. **THE ONE REAL LOSS, said out loud**: seeing the version
list without opening anything. The trail still reads "Round 1 closed — version
v1 captured", so the page never stops saying they exist. `roomVersionsHtml` is
kept as an exported builder with **no caller** — this file's convention for a
builder whose feature has gone — so a third caller cannot bring the column back
through a door nobody remembered. `.hist-grid` and `.hist-rail` are STALE.

**THE ROW IS THE DESIGN'S: a fixed time column, a dot, the event over its
actor, the round at the right wall.** The timestamp used to sit inside a run of
grey meta UNDER the event, so no two entries lined up and a reader could not
scan down a column of times — which is the one thing an audit trail is scanned
for. The ROUND left that run for a marker at the right edge, so where one round
ends is visible without reading. Rows are ruled edge to edge, which is why **the
pane carries no padding of its own**.

**AND A REFUSAL WAS GREEN FOR ABOUT TEN MINUTES.** `decided` is ONE kind
covering both answers with a green tone, which was tolerable while the mark was
a small ✓ glyph in a ring — the WORD beside it said which way it went. As a
solid 8px dot it stopped being tolerable: green next to "Rejected by Wanjiru
Kamau" is the record's own colour contradicting its own sentence. **The table is
NOT split** — `HIST_KIND` still carries one 'decided' with its ✓ for every
caller that reads the mark; `histTone(e)` prefers the OUTCOME the event already
carries (negoTimeline stamps accepted/rejected, and the Outcome filter has read
it all along), so this invents no fact and no store, and an unmatched outcome
falls back to the kind's tone. **Caught by looking at the rebuilt page, not by
any test** — which is the argument for photographing what you build.

**THE FILTERS STAY, ATTACHED, and read like the Contracts page's** (owner-asked
in those words). They were labelled in 11px uppercase micro-caps — this
product's word for a SIGNPOST rather than for a field — and the Contracts page's
filters were relabelled the same day; two filter rows in one product disagreeing
about their own dress is how the next screen picks the wrong one. **ONE RULE,
NOT TWO**: the new dress was folded into the existing `.hist-filters` rule
rather than added above it, because a second rule earlier in the sheet loses the
cascade fight — this codebase's most repeated visual defect.

**THE HEAD SAYS WHICH WAY THE LIST RUNS.** "Oldest first · every entry names who
and when · N events". The count left its `.pill-x` chip and joined the sentence:
it is a fact about the list, not a status. Two empty states became dictionary
keys (they were hardcoded English).

**THE CENSUS WAS RE-RECORDED, AUDITED FIRST, and it is the smallest one yet:
ONE value, `rgb(241,245,249)` — `--color-neutral-100`, the count chip's grey —
gone from history and menu in light, with NOTHING arriving.** It went with the
`.pill-x` the count used to sit in. Dark never failed, because that token
resolves there to a value the census already held. Read as a set difference,
never as a diff.

Tests: history-head-verify (35 — two claims RE-POINTED: the outside-press that
used to land on `.hist-rail`, and the count read off `.pill-x`), f120/f121/f143/
f144 unchanged.

## THE HISTORY HEAD ASKS EACH QUESTION ONCE (owner-reported, 13 Aug 2026)

"Whose asks am I looking at" was answered TWICE on the room's History tab: an Everyone / Ours / Theirs pill on the head AND the Side dropdown in the filter panel. They never disagreed — the chips wrote the same f.side, deliberately — but the duplicate ANNOUNCED ITSELF: a chip counted as "a filter is on", which sprang the panel open, which showed the reader their own choice repeated back in a different vocabulary. THE CHIPS ARE GONE AND THE LID WENT WITH THEM (#hist-filter, the Filter button): the five — Clause / Person / Side / Round / Outcome, plus Clear — sit in the open, and roomPaintHistory auto-opens nothing. .hist-segs / .hist-seg / data-ht-side and the keys ct_whose_changes / ct_filter are STALE — flag any mention (the two dictionary entries are left in place, inert). THE COST WAS WEIGHED AND TAKEN: the filter most reached for is two presses instead of one; it buys a duplicate that cannot come back, four filters that stop being a secret behind a button, and the real prize — ALL THREE HISTORY SCREENS NOW AGREE, because the pop-out record and the counterparty's read-only copy always looked exactly like this.
- "⋯" GAINED ITS WORD (⋯ More ▾ — ct_more + ct_hist_more_title, aria-expanded turning the chevron), because a glyph with no name hides the most important button on the tab, Verify integrity. IT STAYS A MENU and must never become a `<select>`: Verify / Export / Print are ACTS, and a select would sit there afterwards wearing the last act as though it were a setting. Its outside-press listener is ARMED ONCE on document — this function repaints on every filter change and the filters are in the open now, so a listener per paint stacked one per press.
- SIDE READS FROM THE READER'S CHAIR. Ours / Theirs everywhere, and on the counterparty's copy 'owner' is labelled Theirs — it used to say "Owner side" to the people on the other side of the table. negoTimelineSeatIsTheirs(opts) is the ONE predicate: an explicit seat wins, PORTAL_MODE is the net, because their page reaches this screen by TWO roads (mounted directly on the history link, and through openHistoryTimeline from openPortalHistory) and a seat threaded by hand gets dropped down one of them. THE VALUES NEVER MOVE — 'owner'/'counterparty' are what every event carries and what every filter reads; only the label turns over. openHistoryTimeline re-renders on every filter change, so the seat rides with the filter state.
- THE PHONE has its own history tab (mHistHtml — kind chips: Changes / Decisions / Signing / Numbering / Sharing) with no side filter at all. Untouched, and it cannot inherit this fault.
- The filter row's LABELS are still hardcoded English on all three screens, as they always were — left alone deliberately rather than half-translated.

Tests: history-head-verify (28, browser — the row as visible pixels with nothing pressed, the chips and the lid gone, the menu proved to be a menu and not a select, the count and the way back, and their own page's labels read off the real share link). f120/f121/f143/f144 unchanged.

## WHEN A CONTRACT WAS SIGNED — ONE READING (owner-asked 30–31 Aug 2026, J-5.1)

`signDocument` wrote the execution record with a real timestamp and then wrote
a SECOND copy beside it: `c.signedAt = fmtDT(at) + ' EAT'` — **the words a
reader saw, in the reader's own LANGUAGE.** That is fine while something only
ever prints it and fatal the moment anything does arithmetic with it, and six
things did. MEASURED: `slice(0,10)` of it is `"12 Aug 202"`, read as a date
that is **the year 202**, and in Swedish it is `"12 aug. 20"`.

**THE SIX, AND THE SIXTH IS A LEGAL RECORD.** The **Contracts signed** series
(every month read **zero**); a project's start date; an amendment family's
effective date; duplicate detection; the server's own copy; and
**`downloadEvidence`'s `seal.signedAt`** — the exportable proof of execution,
whose sibling `generatedAt` is proper ISO, so the same contract signed by the
same person **exported differently depending on who pressed the button**.

**`contractSignedAt(c)` IS THE ONE READING AND IT LIVES IN js/negotiation.js**,
beside `negoExecuted`, which asks the sibling question — HAS this been signed —
off the same two stores. **That home is deliberate**: written in core.js it
would be a name half the product reaches through `window` on a stage that does
not carry it, and every caller would fall back to the broken arithmetic — the
rlPaperFootHtml class in its quietest costume. Measured: the portfolio panels'
own stage loads six modules and core is not among them. **Callers outside that
module read it through `window` and fall back to NULL, never to a guess.**

**THE DAY IS THE SIGNER'S DAY, NOT THE UTC DAY.** A signing at 01:00 EAT is
22:00 UTC the day before, and answering with the UTC day puts a contract in the
wrong month — the fault `calToday()` records one screen along. **FOUR SOURCES,
IN THIS ORDER**, and each is a fact somebody wrote down: a plain day somebody
RECORDED (a paper filing's `signedOn`, a migration manifest) → the execution
stamp moved into the signer's own clock → a legacy display string, read by its
own WORDS in either language → the audit trail's first `Signed` entry (and
`_signedAt`, the light row's transport). **Returns an ISO day or null**, never a
guess: a record that says nothing answers null and every caller draws an
em-dash.

**THE OFFSET IS RECORDED, NOT REVERSE-ENGINEERED, AND THAT IS WHY THE DATE
COULD MOVE AT ALL.** `pdfSigTime` derived the signer's timezone by PARSING the
display string — so the string could not simply become a date without the
evidence PDF falling back to UTC. `execution.tzOffsetMin` / `tzLabel` are
written at signing; the PDF reads them first and **KEEPS the old parse** for
every record filed before, because it is the only thing that knows their wall
clock. **Never delete it.** `sealWhen(c)` is the ONE builder the server's four
seal panels go through, so a PDF and its HTML twin cannot word one moment
differently. `contractSignedLabel(c)` (js/core.js) is what a SCREEN prints —
formatted at the moment of drawing, like every other date here.

**NOTHING IS MIGRATED AND NOTHING NEEDS TO BE.** Every in-app signing carries
`execution.at`; a legacy display string is read by its words; a migrated record
stored a real date all along. Do not write a backfill, and do not reorder
`signDocument` — the ordering is what makes that safe.

Tests: f258 (the four sources, the midnight edge, both languages of the legacy
string, the six readers, the offset, the evidence pack), signed-and-columns-verify.
