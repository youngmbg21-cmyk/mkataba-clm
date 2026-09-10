# HaTi — settings

*Settings & Rules, People, streams and access, the template library*

Part of THE MAP. The rules that apply everywhere are in CLAUDE.md; the full
stories behind these rules are in docs/MAP-HISTORY.md under matching subjects.
**Read this file before changing anything in this area.** When a new lesson lands
here: the terse rule goes in this file, the full story goes to MAP-HISTORY.md.

## STREAM ACCESS — who may see which stream

The server is the enforcement and always was: folderScopeFor() filters every query, masks every response (F1). The browser's copy is for drawing only — but must be right:
- userFolderAccess(u) in js/core.js (+ canAccessFolder on top). TWO sources, not interchangeable: state.settings.folderAccess (the admin's whole-workspace map — stripped from non-admin bootstraps on purpose) and u.folderAccess (the server's answer for THIS person). The map wins where it has an entry; absence falls to the record; neither = every stream. Empty array: map = "nothing said" (historical), record = "deny all" (matches folderScopeFor).
- Every stream list goes through visibleFolders() (js/templates.js → folderOptionsHtml, folderLegendHtml) or asks userFolderAccess directly (register tabs, command palette, phone chips). A new list must ask one of them. A picker keeps a record's CURRENT stream even when out of reach, or reopening silently re-files it.
- The map does not travel: publicUser gives each non-admin their own folderAccess and nobody else's.
- A NEW MEMBER DEFAULTS TO VIEWER — the quietest path through a form must not be the widest grant (f149).

Tests: f1, f160.

PEOPLE — A STAFF DIRECTORY EVERYBODY CAN READ (owner-asked, 14 Aug 2026, reviewing what the admin-only settings page closed off). js/views/directory.js, nav item in the EVERYDAY group (reading who is in the workspace is not an administrative act), every role including Viewers.
- IT IS A SCREEN, NOT A PERMISSION CHANGE, and that is what makes it small. What the admin-only page took away was a PAGE, not the information: every signed-in member already receives the full roster at sign-in — name, email, role, job title — because the reviewer picker, the desk contributor picker and the approval rules all have to name colleagues. NO new route; it reads getUsers() and nothing else (f202 greps for `api(`).
- THE ABSENCE IS THE POINT AND IT IS ASSERTED, NOT TRUSTED. Who can see which streams is deliberately not in a non-admin's browser — stripped from the settings blob AND from every colleague's user record, because handing the same map back one record at a time was the same disclosure more slowly. Signing limits, who checks whose work, per-folder signing rights and the approval rules are the same. f202 proves it TWICE: off a real restricted member's bootstrap, and off the page rendered from exactly that bootstrap — plus a grep so a renderer that starts reading folderAccess/signCap/reviewChecked/overseerId fails the suite.
- NOTHING ON IT IS PRESSABLE but a mailto (a directory you cannot act on is a list). Editing stays on Settings → People, admin-only and unmoved; an ADMIN gets one line pointing there so the two screens are never confused, and a non-admin gets none, because they have nowhere to go.
- THE PHONE DRAWS IT rather than handing it off — it is four facts a row and exactly what you want on a phone. Its row on More carries a › and NOT the computer word; a row that promises a page and delivers a refusal is the fault M_DESK exists to avoid. mPeopleHtml decides nothing of its own (dirPeople is the desktop's ordering), exactly as Contracts and Negotiations already work; back goes to More.
- AN ABSENCE DESCRIBES ONE PERSON ONCE, ON BOTH SHELLS (owner-reported off a screenshot, 14 Aug 2026). The phone folded title and role into one line and fell back to dir_no_title only when BOTH were empty — which never happens, because everybody has a role — so somebody with no job title read as plain "Editor" there and as "No job title on file" on the laptop; a missing ADDRESS was omitted outright rather than named. The title half now carries its own absence and the role still follows it, both in the laptop's own words and its own `.dir-none` grey (one class, defined once, so the colour cannot drift either). f202 pins the words, the order and the retired fold; people-directory-verify measures it off a real Viewer's row.
Tests: f202 (27), people-directory-verify (27, browser — the door for a restricted member and a real Viewer, the list, the absence as PIXELS, the admin's line landing on the editable roster, and the phone screen with its way back). NOT BUILT, said out loud: the workspace RULES as a read-only page. Every rule already explains itself where it bites, and a second copy is a second thing to keep true.

MOVING A CONTRACT BETWEEN STREAMS IS AN ADMIN'S ACT (owner-asked 14 Aug 2026: "Admins should be able to move a contract to a different folder"). Checking the server first turned up the opposite problem and it is the more urgent half: PUT /api/contracts/:id asked TWO questions about folders and both were SCOPE questions — can the caller see where it IS (404), can the caller see where it is GOING (403) — so an Editor sending back a contract with a different `folder` had it re-filed, with no refusal, no audit line and nobody told. The interface never offered the control, which is the only reason it never happened by accident. So: the control added for an admin, and the gap closed for everybody.
- THE SERVER GUARD IS ASKED AS A DIFFERENCE, like every guard on that route: not "may this person touch folders" (which would refuse a viewer saving a note — every ordinary save carries the folder unchanged) but "does this save MOVE the contract, and is the caller an admin". Guarded on `existing`, so CREATION is not caught — a contract that did not exist a moment ago has no previous drawer. BOTH SCOPE CHECKS STAY: they answer a different question and are still what stops a move being a one-request way to make a record disappear.
- THE CONTROL IS THE VALUE-STREAM ROW ON KEY TERMS, which already stated the folder and did nothing else. ktStreamRowHtml draws a picker for an admin and read-only text for everybody else. IT DOES NOT RIDE THE [data-kt] HANDLER beside it: every other row writes on each keystroke and persists quietly, which is right for a fact somebody is typing; re-filing is an ACT — wireKtFolder asks first, writes an audit line ('Re-filed', ENGLISH, naming both drawers and the person) and repaints the whole room (the folder is printed in room-sub too). Bound once per element (dataset.ktFolderBound) — wireKeyTerms runs from renderKeyTerms AND from the room's main wiring, so a second binding asks the same question twice. _ktFolderBusy holds the panel still while the confirm is up, because the row closes itself on blur and pressing a confirm button blurs the select that opened it.
- IT DOES NOT STAND DOWN ON A SIGNED CONTRACT, deliberately (D-1): filing is housekeeping, nothing in the executed document names the drawer, `folder` is absent from EXECUTED_IMMUTABLE, and a mis-filed executed contract is the one you most want to find. Every OTHER key-terms row on that contract has stood down — measured, 0 of 7.
- THE CONFIRM SAYS WHAT IT COSTS AND REFUSES NOTHING ON THAT BASIS: how many can see it now, how many afterwards, and which way the number goes. folderSeerCount (js/core.js, built on canAccessFolder) is the ONE reading — the settings panel's own "N of M people can see it" now asks it too rather than carrying a second copy of the arithmetic.
- NO "CREATE A NEW FOLDER" HERE. Every other picker is folderOptionsHtml, which carries a `__new__` sentinel; this one is built straight off visibleFolders — the SAME one list, without that option — because a custom folder is saved in the reader's own browser and minting one mid-move files the contract where only one person can see it. It keeps folderOptionsHtml's own rule that the drawer it is ALREADY in stays on the list even when out of reach.
- AND THE FOLDERS PANEL NOW SAYS SO (the rider): a rename box and a delete button made a browser-only list look like a company setting. st_p_folders_local, both languages, no behaviour change. Moving custom folders to the server was NOT taken — half a day's work for a problem nobody in this workspace has (no custom folder has ever been created here).
- WHAT FOLLOWS THE FOLDER, checked not assumed: folder access and per-folder signing rights both read the id at request time; approval rules with a `folder` condition rebuild on every read (buildApprovalChain), so a moved contract picks up the new folder's rules and an already-approved step is left alone; A LIVE SHARE LINK IS UNAFFECTED — buildSharePayload never carries `folder`, and the portal fills its own default. Bulk re-filing is out of scope.
Tests: f200 (31 — the Editor refused and the admin let through against a real server, an ordinary save still passing, the audit line, a signed contract moved, both scope checks intact, and two members on different folder lists proving the visibility really changes), refile-a-contract-verify (26, browser — the picker as visible pixels for an admin and ABSENT for an Editor, the question's own wording, cancel putting it back, and the room's sub-line following).

## SETTINGS & RULES — FOUR TABS AND ONE DRAWER (owner-asked, 13 Aug 2026)

TWO SMALL FAULTS ON THIS PAGE, BOTH OWNER-REPORTED 19 Aug 2026, both "it is not working" and neither of them broken:
- **THE OUTBOX PANEL'S TWO BUTTONS SAID NOTHING.** "Check renewals & queue reminders" ran the sweep and queued the reminders; its confirmation was a BARE toast call, and a bare call is silent by design (see toast in js/core.js — about 250 ordinary confirmations would otherwise blink after every press). "Refresh outbox" re-read a list that usually comes back looking identical. Two correct buttons, indistinguishable from two dead ones. Each now goes BUSY while it works and answers with `'ok'`; refusals still land in the drawer's foot, where this page puts refusals. AND THE LOADER STOPPED SWALLOWING FAILURES — `stLoadOutbox` returned nothing and caught everything, so a failed request left the old list on screen and no word anywhere; it answers `{ok,n}` and prints the reason. Tests: f193's outbox block.
- **A NAMED DOOR NOW LANDS AT THE TOP.** setView keeps the reader's scroll when the view asked for is the one already on screen — right for a save or a repaint, wrong for a door with a name on it, and pressing Settings & Rules from the account drawer (which opens over any page, this one included) is exactly the case that makes "already here" true. Landing at the bottom of a page you have just asked to be shown reads as a broken page. The reset lives in `openSettingsAt` and not in setView, because setView cannot tell a navigation from a repaint and this function can: everything arriving through it is a navigation. Two frames, for the reason setView uses two.
- **AND SETTINGS & RULES HAS ITS OWN SYMBOL IN THE MENU.** It drew the IDENTICAL people mark that People wears two rows above — same path data — so the menu answered "who is in this workspace" and "the rules this workspace runs on" with one picture. Sliders now; People keeps the people. f202 compares the two rows as MARKUP, so a future row that reaches for the people mark again fails there rather than shipping.

One long scrolling page with sixteen cards became FOUR TABS — People · Platform settings · Build & launch · You — where every row opens the SAME right-side drawer over a dimmed page (✕ / scrim / Escape). ST_TABS + settingsTab()/settingsGoTab() (per sitting, in memory — a stored tab lands an admin somewhere unrelated a week later); openSettingsAt(tab,panel) is the ONE named door in and _stWantPanel is consumed by the very next paint.

THE PAGE IS ADMIN-ONLY, AND THAT MEANT CLOSING FIVE DOORS, NOT ONE. renderTeam() ITSELF is the gate — every road into 'team' (nav item, avatar, the sidebar Copilot-usage box, the session-restore whitelist, a deep link) arrives there, and a non-admin is drawn renderMyAccountPage() rather than a blank or a refusal. A hidden nav item was never going to be the wall. Also fixed with it: the email banner's "Set it up" called setView('settings') — a key that does not exist, so the one button that says email is broken opened a contract; it lands on the outbox now.

WHAT A NON-ADMIN COULD DO HAS A NEW HOME — openMyAccount(), the SAME builder tab 4 draws, so "You" and "Your account" cannot drift: own job title, sidebar preference, own sessions with revoke, own backup export, the honest read-only email statement (NEVER a switch wired to nothing), and an Editor's Company-design door, labelled as the workspace setting it is. The avatar opens it for EVERYBODY now (it used to jump straight to a page two of three roles may not have). The Copilot-usage box is a door only for an admin — a control that looks live and leads elsewhere is worse than a plain figure. WHAT CLOSED IS A LIST, NOT A SILENCE: SET_CLOSURES (roster read access, rule-state read access), and f193 fails if it is empty.

THE PANELS WERE RE-HOUSED, NOT REWRITTEN, and every element id is the id it had — approval-rules, rv-gate-panel, dk-rule-panel, set-market, set-work-word, ai-*, outbox-list, activation-funnel, mr-*, sessions-list, pref-nav-all, bk-export, tm-*. SET_PANELS is the registry (tab, mandatory, state(), body(), wire()); a row STATES what the setting is right now without being opened.

TWO FEET, AND THE SECOND ONE IS HONESTY: 'save' (a real form — the person drawer) and 'done' (a panel that already wrote what you changed). The gates write ON CHANGE and have no Save button on purpose — a gate armed only if you remember to press Save is a gate that is off when it matters — so a Save button there would be a button that does nothing.

A REFUSAL IS SHOWN IN THE DRAWER, IN WORDS, AND IT SITS IN THE FOOT. Above the fields it pushed everything under it down 46px the moment it appeared and pulled it back when it cleared — MEASURED, and it is the exact fault this page was rebuilt to stop. Pinned in the foot it also cannot be scrolled away from. stDrawerRefuse / stDrawerClearRefusal.

PEOPLE: one drawer whether you are adding or editing (numbered sections — who they are · what they may do · folders). stPersonMissing(u) is the ONE reading behind the completeness chip, the amber banner and the save refusal. The banner NAMES the unfinished (an amber count with nobody's name on it is a number you cannot act on). The role list reads SAFEST FIRST and the hidden select is the value the save reads — one stored value, two faces, each writing to the other (f149's lesson: the form used to open on Editor). A RENAME CAN ORPHAN AN APPROVAL RULE (a named approver is bound by NAME, not id) — said out loud, and the rules are repointed. settingsWriteFolderAccess is the ONE writer and never sends `[]`.

BUILD & LAUNCH: the go-live checklist is derived entirely from live facts (stGoLive — legal name, mail delivering, Copilot key, spend ceiling, ≥1 approval rule, samples cleared, integrity run clean, a backup taken, first send inside seven days) and every row is a door naming `tab:panel`. Samples are told apart by ORIGIN (`seeded`, stamped at creation and surviving the light-list projection) — NEVER by name — through POST /api/demo/clear (auth + admin), which is the one route on this page that removes anything. It could NOT go through the per-contract delete: that refuses anything past Draft or Under Review, and half the samples are seeded as Signed, so driving it through there would have left the signed examples behind and reported success. The route answers with what actually went and what stayed; f193 puts a REAL contract with a seeded one's exact name, and a real one actually called "Sample agreement", in front of it. The integrity check is NEW: a read-only loop of negoIntegrityReport over every contract, which says so, repairs nothing, and prints the weak-digest sentence first where crypto.subtle is absent.

FOLDERS: built-ins are HaTi's own and are stated as such — they are literals every screen reads and have no store to be renamed into, so offering a rename that would not survive a reload would be a control wired to nothing. Custom folders rename and remove; a removal is refused while the folder still holds contracts — AND THE PANEL NOW SAYS WHERE ONE LIVES (st_p_folders_local, 14 Aug 2026): a rename box and a delete button made a browser-only list (addCustomFolder → localStorage, never a route) look like a company setting, which is more confidence than the storage deserves. No behaviour change; no custom folder has ever been created in this workspace, so moving them to the server was refused as half a day's work for a problem nobody has.

COMPANY & MARKET HOLDS THE COMPANY'S LEGAL IDENTITY (owner-asked, 14 Aug 2026 — item C of WORKORDER-company-details; item B, the signposting, shipped that morning and this replaces it). The registered name, registration number and address were four unlabelled boxes inside the COMPANY DESIGN step, under the logo upload and the accent picker, and this panel merely STATED them over a button reading "Edit design" — so an admin looking for the registered name had no reason to press it. A legal name is not a design decision; it is the same kind of fact as the market and the currency, so it sits beside them.
- A MOVE, NOT A COPY: ds-b-name / ds-b-reg / ds-b-addr are GONE from the design step, not mirrored, and dsOrgPayload no longer SENDS them — a screen must not assert a fact it does not own, and a stale tab that did would refuse an Editor's ordinary design save. THE FOOTER TEXT STAYED (it really is a design choice). The step still READS the name for the preview and says where the field went (ds_identity_moved).
- SAME ROUTE, SAME RECORD, NO MIGRATION — PUT /api/org/branding throughout. But it gained the rule that makes two writers safe: A KEY THIS SAVE DOES NOT CARRY IS A KEY IT DOES NOT TOUCH. The row is written ON CONFLICT DO UPDATE, so every absent key used to store as null — harmless while one screen owned the whole row, fatal the moment two do. ABSENT IS NOT null: `logoUrl:null` still clears. saveOrgBranding merges in the no-server mode for the same reason. Same shape as PUT /api/settings preserving signFolders.by (H-3).
- THE IDENTITY IS ADMIN-ONLY, ASKED AS A DIFFERENCE. The route stays `templateManager` because it also carries the DESIGN, which is what the Editor permission was for and is untouched; the three identity fields are refused for a non-admin only when they MOVE. A REAL CLOSURE, NAMED: SET_CLOSURES['legal-identity'], and the browser agrees (the panel is on the admin-only page).
- THE SECTION CARRIES ITS OWN SAVE and the panel stays a 'done' panel — the established shape (the Copilot engine panel and the account page both do this). The market beside it writes on change and has no Save on purpose, so one foot cannot honestly promise both. The save carries THREE KEYS and nothing else. The row behind the drawer is repainted by stRepaintRow('company') — never renderTeam(), which is this page's own rule.
- THE WORK ORDER'S PREMISE WAS WRONG AND IS CORRECTED HERE: `passwordCurrent` does NOT ask for a password. It refuses anybody still on a temporary password ("Set your own password before making changes") — a first-login gate, not a per-save credential check, and nothing in the client has ever sent one. So there was no prompt to move, none to drop, and nothing to keep off the market dropdown — which is `admin`, and `admin` calls the same passwordCurrent, so the two already agreed. f201 proves the gate still refuses rather than assuming it. st_company_details_btn / st_company_details_note are RETIRED (left inert) — flag any mention as stale.

Tests: f193 (70, node — half (a) walks the old page's whole inventory, half (b) the non-admin one), f194 (server — an Editor attacked at every route, plus the account surface still working and still scoped; its company-design claim re-pointed at the design half on 14 Aug and the identity closure added beside it), f201 (27 — the move asserted BOTH ways, the two writers not wiping each other, absent-is-not-null, the difference guard, and the passwordCurrent finding), settings-tabs-verify (54, browser — every row's drawer as VISIBLE PIXELS, the three ways out, four widths, a real non-admin sign-in, the three legal boxes and a real Save, and the phone), settings-holds-still-verify (18, re-staged through the drawer). f149 re-housed with two claims reversed in place.

HOW MUCH MAY THIS PERSON SIGN FOR (13 Aug 2026, WARN BEFORE ENFORCE). A per-member limit in the workspace currency, recorded and printed from the day it ships and refusing NOTHING until an admin turns on a workspace switch that is OFF by default. THREE STATES, ONE READING — signCapOf(u) → {answered, limit}: absent = nobody decided (blocks nothing, and is where every existing member starts), 'none' = decided, no limit (the string is this codebase's own idiom — TEMPLATES.ND carries valueType:'none' for the same reason), a number = the ceiling. Collapsing the first two the way folderAccess collapses "no entry" into "every stream" was refused out loud: an absent folder entry is a GRANT and reads the same to everybody, an absent cap is somebody nobody has thought about, and the completeness chip exists to say so.
- ONE LIST, NOT A SECOND GATE: signCapBlocker joins signBlockers — the same list the button reads to disable itself and the refusal reads to say why. Nothing else in the product refuses a signature over a limit (f195 greps for it). NEVER the desk and never the review gate: those came OFF this list on 12 Aug 2026 and this is not them coming back.
- AN ADMIN IS NEVER CAPPED, and it is the ROLE that steps aside, not the record (f195 caps an Editor, proves the refusal, promotes them and proves the same signature lands). The caps and the switch are both an admin's to set; a workspace whose only admin had capped themselves below their own paper would have locked its own front door.
- MONEY ONLY WHERE MONEY PASSES — isMonetary is asked first, so an NDA is never over anybody's limit. Up to means UP TO: exactly the limit passes, a shilling more does not.
- THE SERVER IS THE WALL and keeps its own reading (signCapOn / signCapOfRow off the STORED record). The guard on PUT /api/contracts/:id is asked as a DIFFERENCE like every guard there: does this save ADD a session-authenticated entry to c.signatures. A save touching no signature passes; the counterparty's mark arrives down its own route; a paper signature carries its own method. users.sign_cap is TEXT because it carries three states. PATCH /api/users/:id takes signCap as an ADMIN GRANT — never self-service, and never riding along with a title.
- THE COMPLETENESS CHIP COUNTS THE LIMIT ONLY WHILE THE RULE IS IN FORCE, or the whole roster goes amber on the morning of a deploy over a decision nobody has been asked to make. The go-live row is drawn either way and its detail says which world you are in, so a green tick never reads as "and it is being enforced".
- Drawn in: the person drawer's section 4 (collapsed to one sentence for a Viewer and for an admin — a control whose only outcome is "not applicable" is furniture), a live sentence that reads back what is configured AND whether it bites, the roster row (data-st-cap), the go-live row, and signCapLadder — FOUR BANDS and a sort inside one of them (admin · no limit · a ceiling, largest first · nobody decided · a Viewer), because a single number cannot express that "no limit" outranks any figure.
Tests: f195 (33 — the three states, warn-only both ways, the screens, and the server attacked directly), settings-tabs-verify section on the pixels.

WHO IS CHECKED IS PER PERSON (13 Aug 2026). The internal-review gate was one workspace-wide answer; it is now a MASTER SWITCH with a per-person flag under it, a per-person standing reviewer, and a "somebody joining starts checked" default (reviewGateCfg().newChecked, true).
- THE ABSENCE OF THE FLAG MEANS CHECKED — reviewChecked(u) is `u.reviewChecked !== false`, and the server's rvChecked is `!(u.review_checked === 0)`. THAT IS THE WHOLE MIGRATION: a workspace with the gate already on behaves exactly as it did, because every existing record is absent; one with it off is untouched either way. publicUser travels absent as `null` and never as `true` — a server filling in a default would be a second place this rule is decided.
- ONE ADDITIONAL QUESTION, ASKED IN THE PREDICATE: reviewGateApplies(c, u) and the server's rvGateApplies(c, u). reviewGate, reviewSendBlock, contractReadiness, every banner and POST /api/shares inherit it — the enforcement is NOT forked. `undefined` on the server means "no particular person" and keeps the workspace-wide reading; the share route names the SENDER, because it is their wording going out.
- THE NAMED REVIEWER IS A CONVENIENCE, NOT A BINDING: it prefills #rv-who in the ask dialog and the box stays ordinary text, so naming one makes the common case shorter without making the uncommon one impossible. The server refuses a reviewer who is not a member, is the person themselves, or is a Viewer.
- BOTH ARE ADMIN GRANTS on PATCH /api/users/:id — a person who could turn their own check off is not checked — and neither can ride along with a job title.
- The counterparty still never learns a review exists: reviewSeatShowsReview is untouched and f196 asserts it as the wall.
- Drawn in: the person drawer's section 5 (never for a Viewer — they do not redline), a live sentence, and the review panel, which now says the rest is per person and NAMES anybody taken off rather than counting them (reviewUncheckedPeople).
Tests: f196 (19 — the migration first, the per-person flag, the predicate asked once, the standing reviewer, and the server's grants), settings-tabs-verify section on the pixels.

WHICH FOLDERS MAY THIS PERSON SIGN IN (13 Aug 2026). A SEPARATE list from folder ACCESS — its own key (state.settings.signFolders.by), its own atomic route (PUT /api/settings/sign-folders), its own guard, its own default-OFF switch. Seeing a stream and being allowed to put your name at the bottom of its paper are different rights, and one map carrying two meanings is how a reader who was only ever meant to look ends up able to execute.
- IT ONLY EVER NARROWS. A folder the caller cannot SEE is already refused by folderScopeFor (404, invisible therefore unwritable), so this can take a right away and can never hand one out — f197 puts a folder on somebody's SIGNING list that is not on their reading list and gets the 404.
- ABSENT = every folder they can already see; signFolderAccess(u) → '*' or an array; maySignFolder(fid,u) is the predicate; signFolderBlocker joins signBlockers beside the cap (the ONE list).
- THE H-3 SPLIT, AGAIN AND FOR THE SAME REASON: the SWITCH rides the general settings blob, the MAP does not. saveSettings strips signFolders down to {on} and PUT /api/settings preserves the stored .by when a save does not carry it — a stale blob save must never revert a restriction. An empty array is refused at the route (the browser reads [] as "nothing said", the server as "deny all").
- Drawn in: a second list inside the person drawer's Folders section (never for an admin), saying on the panel that it only narrows; a column on the ladder; its own switch under the cap's.
Tests: f197 (15 — the separate key, the narrowing, warn-only both ways, the H-3 survival, and the server's own guard), settings-tabs-verify section on the pixels.

NOT BUILT TONIGHT, said out loud: PER-PERSON APPROVER ("overseen by"). It has no honest anchor — a contract carries no owner in this product (ownerInitials reads currentUser(), and deskLead exists only where a negotiation does), so "this person's contracts need their overseer's approval" would have to key off either the READER (which makes the approval panel say different things to different people, and a panel that disagrees with itself is the fault this rulebook opens with) or the desk lead (absent on most contracts). Inventing a contract owner is a bigger change than this belongs inside. PER-PERSON COPILOT MONEY CAP is also not built: ai_spend is keyed (day, feature) with no user column, so a per-person meter needs a new ledger threaded through every AI route's cost recorder — real work, and rushing a money guard is the one thing worth not rushing.

A SECONDARY BUTTON LOOKS PRESSABLE — REPORTED TWICE, AND GREY WAS THE WRONG AXIS (owner, 17 Aug 2026, off the Playbook panel's Re-run and the room's More: "needs to be more visible that it is a button", then "they are both still not visible enough for a user" after a first pass that only darkened the grey border). The fix is the CLASS, once — .ui-btn in index.html. This product has learned the same lesson THREE times before: a neutral-grey control reads as furniture (the folded-notices chip, the counterparty's .pt-verb reading verbs, the Copilot launcher — each ended up wearing the workspace accent). The base class now wears that established treatment: an ACCENT TINT mixed against the surface (color-mix over --accent-solid, so it holds in both themes and both workspace accents without assuming either), an accent border, accent-leaning ink (mixed 40% into --color-text so dark mode's light text survives), a small crisp lift (a literal 1px/2px shadow, NOT --shadow-sm, whose 26px soft component is sized for cards), and a hover that deepens tint and border — the border half scoped :not(.ui-btn-primary), because the hover rule outranks the primary's resting border on specificity and a ring flashing over a filled navy button is a leak. Every .ui-btn in the product inherits it: the Re-run, every More, the back arrow, the portal's verbs — one class, defined once, never dressed per button. .ui-btn-primary overrides fill, ink and border and is untouched. f175 pins the dress and the :not guard.

## THE SETTINGS PAGE HOLDS STILL

The two company cards answer selections by patching in place — NEVER by renderTeam() (which rebuilds the whole screen and empties seven server-filled panels; the content above the reader moved, not the scroll offset, so scroll-keeping cannot help). THE RULE SURVIVED THE MOVE INTO A DRAWER and had to: a drawer is a SHORTER column than the page was, so a rebuild there throws the reader further, not less far. settingsPaintShapeBoxes paints the tick's border/tint; the market rewrites settingsMarketFactsHtml (built once — two copies of one line can disagree) plus renderApprovalRules and renderReviewGatePanel (the only other money-printers). A REFUSAL MUST PUT THE SCREEN BACK (re-read the boxes from the record — a patch has to do on purpose what a re-render did for free). The ONE full redraw: the market moved the LANGUAGE (langId() compared across jxSet — a person with no chosen language follows the market). That redraw holds its panels: settingsHeightsBefore / settingsHoldHeights floor any element that comes back shorter — every id inside #set-page measured, nothing enumerated, released on the filling mutation, timer as backstop. Tests: settings-holds-still-verify (18, browser).

## THE TEMPLATES PAGE IS TWO TABS (owner-asked 25 Aug 2026, off the demo)

*"Image 1 from the demo should be the first tab called Templates overview.
Image 2 should be the 2nd tab which is what is currently in the platform and
that will be called Templates. The connect the two to function together."*

Fifth page of the page-by-page pass. **Templates overview** is the demo's card
wall; **Templates** is the table this page has always been, unchanged.

**THE CARDS ARE THE CATEGORIES (owner-asked 29 Aug 2026: *"The cards should
represent the categories in the attached so that you have a card for all
templates and the respective metrics. You have a card for standard contracts, a
card for warehousing etc."*).** The wall was a card per TEMPLATE, ordered by use.

**THIS REVERSES THE SAME MORNING'S FIRST ANSWER IN PLACE, and the misreading is
the useful part.** That one read "segmented by library" as the template cards
GROUPED under library headings — which is a reasonable reading of the words and
the wrong reading of the PICTURE. The attachment is the table's own rail, and
what it asks for is a card per BUCKET: one for the whole book, one per library,
one per value stream, each carrying that bucket's metrics. **The picture was the
specification and the sentence was the caption.**

- **THE BUCKETS ARE THE RAIL, EXACTLY** — `TPL_OV_LIBS` is the rail's five rows
  in the rail's own order, then every value stream `FOLDERS` lists, in its
  order, under the rail's own two captions (`lib_library`, `lib_value_stream`,
  read through the same keys). A second vocabulary is how the two tabs come to
  disagree about what a category is, and the rail is the thing the owner
  pointed at.
- **ALL TEMPLATES OVERLAPS THE FOUR BENEATH IT ON PURPOSE** — it is their sum,
  which is what the rail already shows and what a row called "All templates"
  means.
- **`tplOvRoll` IS THE ONE ROLL-UP** and the honesty rules are the single
  card's, unchanged: the rate's denominator is what a playbook has actually
  READ, and what it has not is stated. **The two COUNTS are summed and divided
  ONCE** — summing the rates would average an average.
- **A ROLLED-UP RATE FLATTENS EXTREMES, and that is the honest reading rather
  than a loss**: a library holding one bad template and eleven good ones is a
  middling library. The ruby-at-50% threshold still exists and still matches
  Needs attention, which is the one place on this page that still names single
  templates — which is what makes the two worth having side by side.
- **THE CARD IS THE DEMO CARD'S OWN SKELETON** — 3px tone bar, name, hairline,
  two figures under sentence-case labels, one line qualifying them — with the
  count at the top right on the name's own line, which is the shape the picture
  draws ("Company standard  26"). **The tone bar is the STREAM's colour and a
  library card carries none**, again the picture: a bar that said nothing on
  five cards is a mark for a fact the section heading already carries. **No meta
  line**: the section says the kind and the count is on the name's line.
- **ITS THREE SENTENCES ARE ITS OWN.** The single card says "this template"; a
  card standing for a library may not. `lib_ov_bucket_unused` /
  `_not_checked` / `_empty`, "these" chosen deliberately as number-neutral so
  one template and twelve read alike without four keys. **An empty bucket says
  no templates are filed here** rather than "nothing has been drafted from it",
  which is a checking gap reported on paper that does not exist.
- **EVERY VALUE STREAM GETS A CARD, empty or not** — the rail draws them all,
  and "have we any warehousing paper?" is answered better by a card saying none
  than by an absence the reader has to notice.
- **THE WORKSPACE'S OWN PUBLISHED PAPER CARRIES NO STREAM** (tplPageRows leaves
  it null and gives it a CATEGORY instead), so it lands in no stream card —
  exactly how the table's own stream filter behaves. The two agreeing is the
  property that matters.
- **A CATEGORY NARROWS BY THE RAIL, NOT BY THE SEARCH BOX** — `tplGoBucket`,
  which clears the box so two narrowings cannot stack, and the rail then LIGHTS
  the row it is narrowed to, which is the same say-so the filled search box
  carried. "All templates" at the top of it is the way back. The two panels
  still name single templates and still narrow by name: two doors because they
  are two acts.
- **AND THE FIT STANDS DOWN.** `tplOvFit` measured how many of forty-seven
  template cards fitted and redrew the wall to fill the screen (the 29 Aug
  fill-the-monitor ask). A bounded handful of category cards always draws in
  full, which fills the screen better than any slice did, so there is nothing
  to withhold and nothing to measure. **It is a named no-op rather than a
  deletion** — published and called, and a third caller must not bring a cap
  back through a door nobody remembered. `TPL_OV_MAX`, `_tplOvFit`,
  `_tplOvCols` and `tplOvSlice` are STALE — flag any mention. `rowsThatFit` is
  untouched and still fills Home's decisions list.

Tests: f244 (2b) REVERSED IN PLACE onto the buckets (11), f244 (3) and (7)
re-pointed (the card's own words, and the two doors), f252's two templates
claims reversed in place (the wall withholds nothing now), templates-tabs-verify
sections 2, 4, 6 and 7 reversed in place — **section 7 is that same morning's
block, corrected rather than deleted** — and keeps-your-place-verify's fill
claim reversed onto the stronger one: every category shows, whatever the window.

- **THE OVERVIEW IS A SIGNPOST, NOT A SECOND LIBRARY.** It answers three
  questions the table cannot — how often is this paper actually used, how often
  does what comes off it end up off-standard, and which templates want
  somebody — and **it acts on nothing**. Use, Open, blanks, bulk, versions and
  delete stay on the table, so a template is operated on in ONE place and the
  two tabs can never come to disagree about what a press does.
- **ONE POPULATION, COUNTED ONCE.** `tplOverviewData` reads `tplPageRows` — the
  same list the table draws — so neither tab can hold a template the other does
  not. `TPL_PAGE_CAP` is the one number either tab shows before it says how
  many more there are; written twice, the overview would offer "see all 12
  more" over a table that had already shown eight of them.
- **COUNTING IS NOT DRAWING** (the Insights panels' rule): `tplOverviewData`
  returns plain data and draws nothing, `tplOverviewHtml` draws it and computes
  nothing. f244 greps both halves.
- **WHICH CONTRACTS CAME FROM A TEMPLATE IS ASKED, NEVER RE-DERIVED.**
  `tplRowContracts` borrows `templateUsage(...).rows` for the workspace's own
  paper (company and counterparty alike — both keyed on templateId/templateRef)
  and **`builtinUsageRows`** for HaTi's own, which is NEW: `builtinUsageCount`
  had counted them without ever handing them over, and a second filter written
  beside it is how two screens come to disagree about one template's book. The
  count is now that reading's length.
- **A DEVIATION RATE MAY ONLY COUNT PAPER A PLAYBOOK HAS READ.** A contract
  nobody has checked is not an aligned one, and counting it as one flatters
  every template on the page. So the denominator is what was CHECKED, what was
  not is stated on the card, and **a template nothing has been drafted from
  says THAT instead** — three different facts, three different sentences. The
  fxMissing rule, on standards rather than on money. The page states its own
  coverage once, at the top.
- **A RATE OFF ONE CONTRACT IS NOT A RATE.** `TPL_DEV_MIN` is 3 —
  PRECEDENT_MIN's own reasoning. The rate is still printed on the card; what it
  cannot do below three is raise the alarm.
- **NEEDS ATTENTION IS THREE RULES AND NO MORE**, worst first: paper that keeps
  coming back off-standard (costing money), a draft nobody can use, and the
  workspace's OWN paper nothing has been drafted from. **A built-in or a sample
  nobody has used is not a finding** — HaTi shipped it, nobody here chose it —
  and a rule that flags everything is one nobody reads.
- **THE WALL IS ORDERED BY THE FIGURE ON THE CARD** (used, descending), not by
  the table's own order. The table leads with the workspace's own paper, which
  is right for a library; this is a reading of ACTIVITY, and a first screen of
  eight templates nothing has come off is not one. Ties keep the table's order.
- **THE TWO TABS WORK TOGETHER AT ONE DOOR.** A card, an attention row and a
  bar are three drawings of one act — `data-tpl-ov-card`, one handler,
  `tplGoList` — which switches to the table narrowed to that template.
  **THE NARROWING SAYS SO AND OFFERS THE WAY BACK BY CONSTRUCTION**: it is the
  table's own search box, filled with the name in plain sight, and emptying it
  is the way back. "See all N" opens the table whole.
- **THE TAB IS PER SITTING, IN MEMORY** and a press is CLASS AND HIDDEN FLIPS,
  never a re-render — the Settings page's own rules. Both sections stay in the
  DOM, so `tplPagePaintRows` still fills `#tpl-rows` by id on every paint and
  every id a door or a test reaches for stays reachable.
- **THE PAGE'S OWN SUBTITLE WENT WITH IT.** This page owns its header, so the
  25 Aug sweep through the shell never reached `lib_templates_sub` (STALE —
  flag any mention). A `.st-tabsub` under the new tabs would have put the same
  sentence back one line lower, so there is none.
- **AND THE TITLE'S INK HAD TO BE PUT BACK WHERE EVERY OTHER PAGE'S SITS.** The
  new head row is centre-aligned for the acts beside it, and a 20px title
  centred against a 28px button lands **3px lower** than the shared header's —
  measured, exactly the spread the owner reported on 25 Aug. `align-self:
  flex-start` on the h1, which is how Home answers the same question: take one
  element out of the row's alignment rather than move the row.
- **THE CARD'S SKELETON IS PINNED SO THE WALL LINES UP.** A `<button>` CENTRES
  its content vertically when the grid stretches it — measured, one card's
  heading sat 9px below its neighbour's in the same row — so the card is a flex
  column; and the name and the note each clamp to two lines AND reserve two, so
  a wrapping name cannot push one card's figures 17px below its neighbour's.
  The cost is one blank line on a short name, taken deliberately: the subgrid
  trick the upload dialog uses cannot reach here, because this wall's rows are
  implicit and there are none to inherit.

**THE CARD IS THE DEMO'S CARD (owner-asked 25 Aug 2026, off a picture of one:
"ensure the hati cards resemble it exactly. The color coding, the design how
the card is color coded at the top … add the font sizes as well").** A **3px
tone bar across the TOP** rather than a stripe down the left; the state as a
small uppercase badge at the top right; the name; `category · vN · date`; a
hairline; then the two figures under quiet sentence-case labels; then the line
that qualifies them.

- **EACH COLOUR CARRIER ANSWERS ONE QUESTION.** The **bar** is what kind of
  paper this is and what state it is in — green on published company paper,
  amber while it is a draft, otherwise the value stream's own colour, which is
  exactly what the left stripe carried before it moved. The **rate's ink** is
  how the paper is doing, and **its ruby is the SAME threshold that puts a
  template in Needs attention**, so a red figure and a row in that panel can
  never mean different things (amber above a quarter, green below). The count
  beside it stays primary ink: it is a fact about volume, not a verdict. All
  three read from `--st-*-fg`, which have dark answers — measured in both
  themes, no override owed.
- **THE TYPE LADDER, since that was half the ask — AND IT CAME DOWN A RUNG THE
  SAME DAY** (owner-asked, off a screenshot with the two figures ringed: *"all
  the fonts need to be reduced by one size and the ones highlighted (numbers)
  should be reduced by 2 sizes"*). It arrived at name 15 / badge 10 / small
  text 13 / figures 19, and every one of those moved one step down this
  product's own scale (10, 11, 12, 13, 14, 15, 17, 19, 22) except the figures,
  which moved two: **name 14/700, badge 9/700 uppercase with tracking, meta,
  labels and note 12/400 on the secondary ink, and both figures 15/700.**
- **9px IS THE ONE PLACE THIS PRODUCT GOES BELOW ITS OWN LADDER**, and it is
  said out loud rather than slipped in: 10 was the floor and the only sub-10px
  type anywhere. Left at 10 the badge read HEAVIER than the 14px name once
  everything else came down — measured — which is the opposite of what the ask
  was for. Uppercase with tracking carries it.
- **THE FOUR-SHADES RULE STILL HOLDS BY CONSTRUCTION**: primary ink is 14px and
  up (the name, and the count, which is 15), and everything 9-12px wears the
  label shade. The rate is 15px and takes a STATUS shade, which that rule
  allows by name.
- **THE LABELS ARE SENTENCE CASE**, not the 11px uppercase caps this product
  uses elsewhere: those are signposts OVER a list (the two panels keep theirs),
  and these are labels ON a figure.
- **THE BADGE FLOATS, and that is load-bearing.** In a flex row it takes a
  column and every line of the name is short — measured, "Freight &
  Distribution Agreement" ran out of room on a card with an inch of white
  beside it. Floated, only the FIRST line is narrowed. It also rules out
  `-webkit-line-clamp`, which makes its own formatting context and ignores the
  float, so the name is capped by RESERVING two lines rather than by clamping
  and a name long enough to need a third gets one.
- **`.tpl-ov-badge` IS ITS OWN CLASS, NOT AN OVERRIDE OF `.badge`** — that one
  is 12px with a dot slot and dresses every table row and panel in the product.
- **A CLEAN TEMPLATE SAYS SO IN PLAIN ENGLISH.** "0 of the 3 contracts checked
  did not follow Our standards" is accurate and reads like a near miss; paper
  that all came back clean is good news (`lib_ov_all_clear`).
- **AND THE LINE UNDER THE FIGURES HAS TO EXPLAIN THEM (owner-reported 25 Aug
  2026, of a card reading "3 of 4 contracts checked came back off-standard. 23
  not checked": *"i do not understand what the highlighted area means"*).**
  **THREE THINGS WERE WRONG WITH IT, and the third is the one that mattered.**
  "off-standard" is jargon — the product calls this **Our standards**
  everywhere else, and that is a page the reader can go and look at, so the
  sentence says it. "23 not checked" named no object. And nothing said WHAT the
  rate was worked out from, which is the whole reason the line exists: **75% is
  three contracts out of four, not twenty out of twenty-seven**, and a reader
  who cannot see that is reading a different number. It now reads "3 of the 4
  contracts checked did not follow Our standards. 23 more have not been
  checked" — and 4 + 23 is the 27 printed above it, so the arithmetic is
  visible on the card. The page's own coverage line and the Needs attention row
  lost the same jargon in the same breath, or one screen would explain the
  metric in two vocabularies.
- **THE TWO LABELS EXPLAIN THEMSELVES ON THEIR OWN HOVER** (`lib_ov_used_title`
  / `lib_ov_dev_rate_title`) — the note states the SAMPLE, the title states the
  METRIC, and neither can do the other's job in the room a card has.
- **AND THE NOTE MAY TAKE A THIRD LINE.** Two are still RESERVED, so a card
  with a short note does not grow; clipping the half that names the sample
  would leave a percentage the reader cannot place, which is the fault being
  fixed.
- **THE STREAM NAME IS SHORTENED BY THE RAIL'S OWN FUNCTION** (`tplShortStream`
  — "Corporate & Compliance" → "Corporate"). The rail has cut it this way since
  it was built; the card asks the same function rather than carrying a second
  copy.
- **WHAT IS DELIBERATELY NOT COPIED**: the demo prints a bare "12 Jun 2026" and
  HaTi labels it ("last used" / "added"), because a date with no name on it is
  a fact nobody can read — this feature's own rule, one section up. One word
  reverses it.

**THE COLOUR CENSUS WAS RE-RECORDED, AUDITED FIRST**, and it is the smallest
kind: **one screen, one value, nothing leaving.** `rgb(241,245,249)` —
`--color-neutral-100`, the origin badge's face and the bar track — ARRIVING on
`templates--light`. Dark did not move at all, because that token resolves there
to a value the screen already held. No other screen moved.

Tests: f244 (35 — **22 of them fail against the code of an hour before**),
templates-tabs-verify (31, browser — every card measured for the demo's own
sizes, inks and geometry with the colour claims written as RELATIONS (a high
rate is not the colour of a clean one, and the ruby one is the template Needs
attention names) so a palette pass costs no edit; the tabs pressed for real, the table
proved to have LEFT the screen rather than merely lost an attribute, the cards
measured as pixels with both figures and the sentence that qualifies them, a
card pressed through to a narrowed table, and no sideways scroll at three
laptop widths), pages-read-alike-verify section 8 (the title's ink, which
caught the 3px above), theme-tokens-verify 40/40.
