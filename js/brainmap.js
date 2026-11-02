/* ---- THE BRAIN'S MAP: ONE CATALOGUE, READ AGAINST THE CODE (Young ruled
   27 Sep 2026: "Now go build and merge to main. Put it as a page before home")
   The Brain page draws HaTi as a network of neurons. Its named parts, the
   areas they sit in and the six flows are written HERE, once; what the parts
   ARE — whether each is still in the code, the file and line it lives on,
   which parts hand work to which, and what the code publishes that the
   catalogue does not name yet — is READ from the code, so the picture cannot
   fall behind the platform. The server reads its own files (js/ and server/)
   on the first request after it starts, which is every deploy, and keeps the
   difference from the last reading (brainDiff) as a "code update".
   THE WORDS ARE NOT HERE: every name, description and flow step is a key in
   js/i18n.js (brn_p_<id>, brn_pd_<id>, brn_step_<flow>_<n>…), so the page is
   in both languages and the server carries no prose.
   Like js/graphwhere.js: globals in the browser, a require on the server. */

/* The nine areas, in the order the legend and the Wiring view walk them. */
const BRAIN_REGIONS = ['see', 'in', 'read', 'ai', 'nego', 'sign', 'wall', 'time', 'out'];
/* The four floors, top to bottom: what you see, the browser's work, the
   server (the wall), outside HaTi. */
const BRAIN_FLOORS = 4;

/* [id, code name, area, floor, how to find it]. The code name is what the
   code calls the part; "how to find it" is given only where the name alone
   cannot be looked up (a table, a route with a method in front). */
const BRAIN_PARTS = [
  ['home', 'hmDecisionItems', 'see', 0],
  /* Needs you, Jambo's note (15 Oct 2026): what is owed by name — the one reading the Counter, Needs you here and the bell draw (it left the Board with round 17, 18 Oct 2026) */
  ['needsme', 'hbNeedsList', 'see', 0],
  /* The counter (17 Oct 2026): the first screen after signing in on a computer; the desk tabs take the left menu's place */
  ['counter', 'renderCounter', 'see', 0],
  ['desktabs', 'deskRecentHtml', 'see', 0],
  /* End or pause (15 Oct 2026): one question, three answers — decline, archive, hold */
  ['endpause', 'endOrPauseOpen', 'time', 1],
  ['bell', 'buildAlerts', 'see', 0],
  ['contracts', 'renderRegister', 'see', 0],
  /* Ask a column (owner picked "In Jambo's panel", 20 Oct 2026): one question asked of many contracts' wording, answered beside the list */
  ['askcol', 'askColPanelHtml', 'see', 0],
  ['askcolcells', 'askColTdHtml', 'see', 1],
  ['askcolread', 'POST /api/ai/column', 'ai', 2],
  ['askcolturn', 'POST /api/ai/column-turn', 'ai', 2],
  ['askcolkept', 'POST /api/columns/answers', 'wall', 2],
  ['askcolteam', 'GET /api/columns', 'wall', 2],
  ['askcolcheck', 'POST /api/columns/:askId/check', 'wall', 2],
  /* Discover (docs/PLAN-jambo-discover.md): the company's rule an answer is judged against, and the company's fact switch, an admin's */
  ['askcolrule', 'PUT /api/columns/:askId', 'wall', 2],
  ['askcolkeep', 'POST /api/columns/:askId/keep', 'wall', 2],
  ['askcoldel', 'DELETE /api/columns/:askId', 'wall', 2],
  ['askcoldisc', 'askColDiscoverHtml', 'see', 0],
  ['askcolsum', 'GET /api/columns/summary', 'wall', 2],
  ['askcolfacts', 'GET /api/columns/facts/:cid', 'wall', 2],
  ['askcolodd', 'GET /api/columns/unusual/:cid', 'wall', 2],
  /* THE THREAD (owner picked it, 28 Oct 2026): a press reads the next 50 or 100 not yet read; every press
     leaves a record; the Reads page lists them with the next batch on the row */
  ['askcolnext', 'askColPlan', 'see', 1],
  ['askcolruns', 'GET /api/columns/reads', 'wall', 2],
  ['askcolstop', 'POST /api/columns/reads/:id/stop', 'wall', 2],
  ['reads', 'renderReads', 'see', 0],
  /* THE PULSE BOARD (owner, 29 Oct 2026): every contract ranked live off the one desk, each drawn as a strand; its door on the Board's head */
  ['pulse', 'renderPulse', 'see', 0],
  ['partyfacts', 'GET /api/parties/brief', 'wall', 2],
  ['partybrief', 'POST /api/ai/party-brief', 'ai', 2],
  /* Customer folders (10 Oct 2026): one shelf per customer, read off the counterparty */
  ['customers', 'renderCustomers', 'see', 0],
  /* The Directory, Faces (13 Oct 2026): everyone HaTi deals with, a wall of cards read off the roster, the contracts and the imported list */
  ['directory', 'renderDirectory', 'see', 0],
  /* The list head, the Legora way (owner's pick, 21 Oct 2026): one head for every list page — the box, the tabs, the chips, Columns — and one foot under the list */
  ['listhead', 'lhHtml', 'see', 0],
  /* the list language (27 Oct 2026): a row's mark, its readings in words, its soft chips, one set for every list */
  ['listlang', 'listMarkHtml', 'see', 1],
  ['listfoot', 'lhFootHtml', 'see', 0],
  ['overview', 'ktOverviewTermsHtml', 'see', 0],
  /* the Constellation (8 Oct 2026): the deal as a map of its parties and what passes between them, on the Overview */
  ['constellation', 'ovMapSvg', 'see', 1],
  ['negpage', 'renderRedline', 'see', 0],
  ['signtab', 'renderSignButton', 'see', 0],
  ['explorer', 'intelGraphApply', 'see', 0],
  ['stands', 'dealStands', 'see', 1],
  /* the Insights shelf (4 Oct 2026): worked out the first time Home opens each day */
  ['insights', 'hbInsightsToday', 'see', 1],
  /* Read, then ask (4 Oct 2026): an enlarged chart says what it shows, and one press asks Copilot why;
     a small one says its point in one line, Read more opens the rest (Headline, 5 Oct 2026, hbHeadlineHtml) */
  ['chartread', 'hbReadHtml', 'see', 1],
  /* One recipe language (work order Part 1, 4 Oct 2026): every board card is one recipe, drawn by one planner */
  ['recipe', 'hbCardPlan', 'see', 1],
  /* Several buttons at once (work order Part 2): Copilot's list of board actions, pressed by one applier */
  ['boardtools', 'hbBoardApply', 'see', 1],
  /* A data guide for Copilot (work order Part 3): what each field holds, sent beside the board */
  ['dataguide', 'hbDataGuide', 'ai', 1],
  /* Check and repair (work order Part 4): every card checked before it lands; one retry */
  ['cardcheck', 'hbCardCheck', 'see', 1],
  /* Preview and undo (work order Part 5): a big build waits for the reader; any change can be taken back */
  ['boardundo', 'hbUndo', 'see', 1],
  /* The board that answers right (the overnight work order, 5 Oct 2026) */
  ['honest', 'hbProseChecked', 'see', 1],
  ['askchoice', 'hbAmbiguity', 'see', 1],
  ['boardwords', 'hbWordsApply', 'see', 1],
  ['readchips', 'hbReadingHtml', 'see', 1],
  /* Fold all in every view (6 Oct 2026): Floors, Grid and Timeline fold each group into one bubble per cell */
  ['cellfold', 'igbDrawCells', 'see', 1],
  ['nextq', 'hbNextQuestions', 'see', 1],
  ['boardmarks', 'board_feedback', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS board_feedback', men: '\\bboard_feedback\\b' }],
  ['boardjudge', 'runBoardAccuracy', 'ai', 2],
  /* Charts That Explain (5 Oct 2026): the fact sheet every summary is written
     from, the four answer packs, Dig deeper, and the whole book read overnight */
  ['factsheet', 'hbFactSheet', 'see', 1],
  ['packs', 'hbPackData', 'see', 1],
  ['phrasebook', 'hbAnalystWords', 'see', 1],
  ['analyst', 'hbDigDeeper', 'ai', 1],
  ['story', 'hbStoryData', 'ai', 1],
  ['bookread', 'runBookReading', 'ai', 2],
  ['dealfacts', 'hbDealGroupOf', 'see', 1],
  ['verified', 'hbVerifiedHit', 'see', 1],
  ['askpreview', 'hbAskReadingOf', 'see', 1],
  ['boardmoved', 'movedSec', 'out', 2],
  ['upload', 'submitUpload', 'in', 0],
  /* the drop area on Jambo's panel (the overnight work order, step 4): a file dropped or chosen, through the upload's own path */
  ['dropin', 'pdDropTake', 'in', 0],
  ['newagr', 'openNewAgreement', 'in', 0],
  /* From scratch (round 6, the owner's pick, 1 Nov 2026): one section of a paper nobody has yet, written by Jambo, one call each */
  ['scratchsection', 'POST /api/ai/section', 'ai', 2],
  /* Jambo's New agreement card opens the one form with the sentence's facts in it (step 3) */
  ['draftform', 'caDraftForm', 'ai', 1],
  ['mailroom', 'POST /api/mailroom', 'in', 2],
  ['intake', 'intake_requests', 'in', 2, { def: 'CREATE TABLE IF NOT EXISTS intake_requests', men: '\\bintake_requests\\b' }],
  ['docx', 'docxExtractRich', 'read', 1],
  ['pdf', 'extractPdfRich', 'read', 1],
  ['clauses', 'clauseSegment', 'read', 1],
  ['blanks', 'contractBlanks', 'read', 1],
  ['ladder', 'ladderRungs', 'nego', 1],
  ['triage', 'triageRun', 'ai', 1],
  ['brief', 'POST /api/ai/brief', 'ai', 2],
  ['playbook', 'runPlaybookReview', 'ai', 1],
  ['oblscan', 'POST /api/ai/obligations', 'ai', 2],
  ['risk', 'runScan', 'ai', 1],
  ['model', 'anthropicMessages', 'ai', 3],
  ['quote', 'normalizeDeliver', 'ai', 2],
  ['editor', 'ceFile', 'nego', 0],
  ['funnel', 'negoFileChange', 'nego', 1],
  ['desk', 'deskClaimOnFile', 'nego', 1],
  /* ---- THE 4 OCTOBER PARTS (owner-asked: "can these new features be mapped
     by the brain tab?") ---- Five features shipped that morning and one the
     evening before, and the catalogue is hand-written, so until they are named
     here the reading draws them as grey pending dots and the flows walk past
     them. Named, each takes its place in a flow below. */
  ['suggest', 'deskStampOnFile', 'nego', 1],
  ['here', 'presenceHere', 'nego', 1],
  ['follow', 'presenceWalk', 'nego', 1],
  ['baton', 'clauseLockAsk', 'nego', 1],
  ['review', 'reviewSendBlock', 'nego', 1],
  ['payload', 'buildSharePayload', 'nego', 1],
  ['apply', 'applyNegoProposals', 'nego', 1],
  ['whosemove', 'negWhoseMove', 'nego', 1],
  ['readiness', 'signReadiness', 'sign', 1],
  ['approvals', 'buildApprovalChain', 'sign', 1],
  ['namedyes', 'saNeeds', 'sign', 1],
  ['pad', 'openSignaturePad', 'sign', 0],
  ['seal', 'sealWhen', 'sign', 2],
  ['putguard', 'PUT /api/contracts/:id', 'wall', 2],
  ['shares', 'POST /api/shares', 'wall', 2],
  ['guestcode', 'shareNeedsCode', 'wall', 2],
  ['respond', 'POST /api/shares/:token/respond', 'wall', 2],
  ['db', 'contracts table', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS contracts', men: '\\b(?:FROM|INTO|UPDATE)\\s+contracts\\b' }],
  ['audit', 'logAudit', 'wall', 1],
  ['frozen', 'EXECUTED_IMMUTABLE', 'wall', 2],
  ['reminders', 'runReminders', 'time', 2],
  ['renewprep', 'runRenewalPrep', 'time', 2],
  ['obligations', 'obligationBand', 'time', 1],
  ['calendar', 'calPeriod', 'time', 0],
  /* MY CALENDAR AND MY NOTES (Young, 10 Oct 2026): a person's own events and
     private notes, one store (js/mine.js), its routes, and Copilot's plan. */
  ['mynotes', 'renderMyNotes', 'time', 0],
  /* THE HANDBOOK (owner, 26 Oct 2026): the instruction book, one chapter per
     thing a person can do, kept honest by f937 (every door has a chapter,
     every button it quotes is a live label) */
  ['handbook', 'renderHandbook', 'see', 0],
  ['hbkbook', 'HANDBOOK_CHAPTERS', 'see', 1],
  ['hbkask', 'navReadHandbook', 'ai', 1],
  /* THE FLOW MAP (owner, 31 Oct 2026): every page on the contract's life and how each reaches the next, one table
     (FLOW_MAP, js/flowmap.js) kept honest by f964, drawn by its page */
  ['flowmap', 'renderFlowMap', 'see', 0],
  ['flowtable', 'FLOW_MAP', 'see', 1],
  ['mine', 'mineSave', 'time', 1],
  ['myitems', 'POST /api/me/items', 'wall', 2],
  ['myitemsget', 'GET /api/me/items', 'wall', 2],
  ['myitemsput', 'PUT /api/me/items/:id', 'wall', 2],
  ['myitemsdel', 'DELETE /api/me/items/:id', 'wall', 2],
  ['plan', 'POST /api/ai/plan', 'ai', 2],
  ['renewal', 'renewalWindow', 'time', 1],
  ['desknight', 'deskShown', 'time', 1],
  ['email', 'mailReport', 'out', 3],
  /* THE LETTER (round 11, 17 Oct 2026): the send screen draws the email, and
     the route mails the same words — one writer for both (js/sharemail.js) */
  ['letter', 'shareLetterPaint', 'out', 1],
  ['sharemail', 'shareMailOf', 'out', 3],
  /* the mail key an admin saves from the screen (9 Oct 2026): the server's environment no longer the only way email goes out */
  ['mailkey', 'PUT /api/mail/config', 'out', 3],
  /* THE OVERNIGHT REVIEW'S PARTS (9 Oct 2026, owner: "fix all the issues"): the
     map told only the happy path. These name drafting from a template, the other
     side's signature and the server's seal, an amendment, the end of a contract,
     and what happens when something goes wrong, so each has a flow. */
  ['tplform', 'tplFormApply', 'in', 1],
  /* a standard Jambo proposed on a template's paper and somebody Skipped, kept
     on the template so nobody is offered it again (round 21, 19 Oct 2026) */
  ['tplskip', 'PUT /api/templates/:id/skipped', 'wall', 2],
  /* the Details tab and "Complete the details" (owner, 12 Oct 2026): the one
     place a contract is filled in, and the one count of what is left */
  ['details', 'detailsOf', 'in', 1],
  /* Fill in, beside the paper (the one-page Home plan, stage 2, 14 Oct 2026):
     Jambo's panel turns to the Details tab's own form; a new contract lands here */
  ['fillface', 'pdFillOpen', 'in', 1],
  /* the one stream writer: the room's row and Fill in's stream (step 6) */
  ['refile', 'ktFolderMove', 'in', 1],
  /* a contract at a glance, at the top of Jambo's tab (step 5) */
  ['glance', 'pdGlanceHtml', 'see', 1],
  /* Needs you here (round 3, "Tabs and faces", 17 Oct 2026): this contract's owed rows above the glance, Jambo's work first */
  ['needshere', 'pdNeedsHtml', 'see', 1],
  /* the paper's line (round 6, "One line", 17 Oct 2026): who and what, the stage with its round, who is on it now, the paper's own acts */
  ['paperline', 'igLineIdHtml', 'see', 1],
  /* the glance as drawn (rounds 3 and 6, 18 Oct 2026): their round and each of their asks, said from its own ops, with Go to it */
  ['glanceasks', 'pdAskSay', 'see', 1],
  /* a note of yours due on the paper in front (round 3 as drawn, 18 Oct 2026): My notes' own reading, in Needs you here, only you */
  ['notehere', 'pdNoteRows', 'see', 1],
  /* Follow me and Go to it on Home's paper (round 6 as drawn, 18 Oct 2026): the clause brought up and lit, nothing written */
  ['followhome', 'igPaperGoClause', 'see', 1],
  /* the Board's head (round 17 as drawn, 18 Oct 2026): Board, when counted, Summarise with its cost, saved views as chips with their counts */
  ['boardhead', 'hbBoardHeadHtml', 'see', 1],
  /* Redlines, beside the paper (the one-page Home plan, stage 3, 14 Oct 2026):
     Jambo's panel draws the Negotiate page's own column; doors from outside land here */
  ['redface', 'pdRedOpen', 'see', 0],
  /* the contract's views on the Board (the one-page Home plan, stage 4, 14 Oct
     2026): the deal board, obligations and history of the contract on the paper */
  ['boardviews', 'hbOpenView', 'see', 0],
  /* the Lifeline strip (the overnight work order, step 8, 15 Oct 2026): a
     contract brought up on the Board, Where we are and History behind its ⋯;
     every door that opened the contract room lands here */
  ['strip', 'hbStripBring', 'see', 0],
  /* the agreement family on the strip (15 Oct 2026, the owner picked "Family line"):
     the original and every amendment, the one in front lit; a press brings the other up */
  ['stripfamily', 'bsFamHtml', 'see', 0],
  /* a contract brought up is a page on the desk (round 7, "Read down", 17 Oct 2026): its contract's tab, the card alone */
  ['cardpage', 'bsCardId', 'see', 0],
  /* Jambo beside a page (the redesign's gaps, round 7, 18 Oct 2026): "<ref> at a glance" — what is late, whose move, the signed amendment, the notice day */
  ['pageglance', 'pdCardGlanceHtml', 'see', 1],
  /* Before you sign, beside the paper (the one-page Home plan, stage 5, 14 Oct
     2026): Jambo's panel draws the Signing column's own four slots; the paper
     turns to the signing copy; every door into signing lands here */
  ['signface', 'pdSignOpen', 'see', 0],
  /* the panel's Menu tab, drawn as "Next up" (owner, 15 Oct 2026): the paper's
     old ⋯ rows plus the Redlines column's three; Jambo's words press the same
     rows (caReadMenu → pdMenuPress); a contract number in any form opens it
     and every number in an answer is a link (caRefFix, caRefLinkPaint) */
  ['menutab', 'pdMenuHtml', 'see', 0],
  ['menuask', 'caReadMenu', 'ai', 1],
  ['nextsteps', 'caNextSteps', 'see', 0],
  ['reflink', 'caRefLinkPaint', 'see', 1],
  /* Amend, beside the paper (owner, 15 Oct 2026): a face of Jambo's tab on a
     signed agreement; its draft is made by the one creator, createAmendment */
  ['amendface', 'pdAmendOpen', 'in', 0],
  ['essentials', 'openContractEssentials', 'in', 0],
  ['outbyhand', 'roundReachedByHand', 'out', 1],
  ['issuelinks', 'issueSigningRouteLinks', 'sign', 1],
  ['filesig', 'srvFileSignature', 'wall', 2],
  ['srvseal', 'srvSealNow', 'wall', 2],
  /* the copy the server draws itself (9 Oct 2026): one reading of its text on both hosts */
  ['sealtext', 'sealPlainText', 'sign', 3],
  ['copies', 'srvSendExecutedCopies', 'out', 2],
  ['amend', 'openCreateAmendmentModal', 'in', 0],
  ['decline', 'contractDecline', 'time', 1],
  ['reopen', 'contractReopen', 'time', 1],
  ['archive', 'contractSetArchived', 'time', 1],
  ['hold', 'contractSetHold', 'time', 1],
  ['served', 'noticeMarkServed', 'time', 1],
  ['obdone', 'obligationMarkDone', 'time', 1],
  ['autorenew', 'runAutoRenewals', 'time', 2],
  ['leaveguard', 'ceLeaveGuard', 'nego', 1],
  ['discard', 'negoMayDiscard', 'nego', 1],
  ['freshen', 'decisionFreshen', 'sign', 1],
  ['inline', 'rlInlineSave', 'nego', 0],
  ['cplink', 'renderShareViewer', 'out', 3],
  ['webhook', 'WEBHOOK_EVENTS', 'out', 3],
  ['wordfile', 'docxExportTracked', 'out', 3],
  ['theirsign', 'shareSignerPickHtml', 'out', 3],
  /* ---- THE PROCESS REVIEW'S PARTS (4 Oct 2026, owner: "ensure the mapping in
     Hati brain is updated") ---- Each joins a step that already exists. */
  ['request', 'notifyIntakeRaised', 'in', 2],
  ['lanes', 'runIntakeLanes', 'in', 2],
  ['book', 'contactSet', 'in', 1],
  ['stale', 'triageReadingStale', 'ai', 1],
  ['kept', 'negoKeptIds', 'nego', 1],
  ['roundauto', 'negoRoundWasSent', 'nego', 1],
  ['turnmail', 'roundTurnMail', 'out', 3],
  ['wordback', 'negoImportReturnedDocx', 'nego', 1],
  ['linkcheck', 'linkRefusal', 'sign', 1],
  ['signgate', 'sgHolds', 'sign', 1],
  ['decide', 'approvalDecideAsk', 'sign', 1],
  ['undoyes', 'approvalUndo', 'sign', 1],
  ['startnego', 'ngStartPickerOpen', 'nego', 0],
  ['reqfiles', 'GET /api/intake/:id/files/:fid', 'in', 2],
  ['rulestep', 'ruleStepTell', 'sign', 2],
  ['rules', 'stRulesRows', 'sign', 0],
  ['renewact', 'renewalDecisionAct', 'time', 1],
  /* Risks to look at (4 Oct 2026): the risk scan's list lives in the Redlines card */
  ['risklist', 'riskOpenOf', 'nego', 1],
  ['riskwalk', 'riskEditStart', 'nego', 1],
  /* the six gaps closed (4 Oct 2026, owner: "build the six remaining gaps") */
  ['askkeep', 'presenceKeepAsks', 'nego', 1],
  ['kinds', 'requestsDoorCount', 'in', 2],
  ['laneowner', 'intakeLaneOwner', 'in', 1],
  ['arrivalowed', 'intakeLaneArrivals', 'in', 1],
  ['wordmark', 'richListMark', 'out', 3],
  ['paperdrop', 'docxIsPaperPara', 'read', 1],
  ['asks', 'askOpen', 'sign', 1],
  /* the work order of 7 Oct 2026: the Time Machine on Overview 2, the
     obligations review desk, and the board charts drawn at their real size */
  ['obdesk', 'obReviewTally', 'time', 1],
  /* Overview 2's TAB went on 9 Oct 2026 (owner-asked); its file stays for the
     dated windows Copilot reads on arrival. `timemachine` is retired. */
  ['datedwin', 'runDatedWindows', 'ai', 1],
  ['chartsize', 'hbFitMeasure', 'see', 1],
  /* Copilot prepares, you press (8 Oct 2026): the ask box reads @ people and
     # contracts with no model and answers with a card; one press runs the
     product's own act. Agents live on the Board, each with a level. */
  ['copilotask', 'caActOf', 'ai', 1],
  /* Jambo's map (18 Oct 2026): the thirty-one commonest tasks in everyday words, matched by MiniSearch, each landing on a door caActOf already has */
  ['jambomap', 'jmRead', 'ai', 1],
  /* navigable by typing (22 Oct 2026): the things inside the places, read and landed */
  ['navread', 'navRead', 'ai', 1],
  /* one search over HaTi (Jambo works like Copilot, stage 1, 22 Oct 2026): everything the reader may see, by words, the walls asked off the live record */
  ['hatisearch', 'hatiSearch', 'wall', 2],
  ['hsroute', 'GET /api/hati-search', 'wall', 2],
  ['hswords', 'hsTerms', 'ai', 1],
  /* every door as a tool (Jambo works like Copilot, stage 2, 22 Oct 2026): the exact thing Jambo names, checked on the server, landed by the one mover */
  ['aidoor', 'aiDoorOf', 'wall', 2],
  ['navdoor', 'navDoorOf', 'ai', 1],
  /* AI first, never a dead end (Jambo works like Copilot, stage 3, 22 Oct 2026): a guess gives way to Jambo; no answer says why and offers the way on */
  ['aifirst', 'caAiFirst', 'ai', 1],
  ['wayon', 'copilotWayForward', 'wall', 2],
  /* One reader for every Jambo box (owner, 19 Oct 2026: "do what the user asks in plain language"): a place and a narrowing, a contract and its act, a place by name — read first in every box, free */
  ['onereader', 'caUnderstand', 'ai', 1],
  /* the contract finder: a number written any way, a title or a party, among the contracts the reader may see (MiniSearch) */
  ['contractfind', 'caContractOf', 'ai', 1],
  /* a brief asked for by name: the paper's own Read the brief, a kept brief free, Write the brief says its cost */
  ['briefword', 'caBriefOpen', 'ai', 1],
  /* Jambo's panel beside the lists (18 Oct 2026): its box reads as the Counter's — a place, the map, else a question said in the panel */
  ['listask', 'jlAsk', 'ai', 0],
  /* Jambo everywhere (owner, 21 Oct 2026): the ✦ opens the chat window on any page, answering in itself ("The old chat window", reversing the ✦ ask bar); Pop out keeps the conversation on top of Word; "What am I looking at?" says the screen free */
  ['askbar', 'aiWinToggle', 'ai', 0],
  ['jambopop', 'aiPopOut', 'ai', 0],
  ['jambohere', 'aiHereSays', 'ai', 0],
  /* Jambo, as recommended (owner, 21 Oct 2026): an answer about one contract carries Show me › and one prepared press through the act's own door; a sentence becomes a standing watch the person starts, the server's sweep tells them once (js/jambopress.js) */
  ['jbpresses', 'jpPressOf', 'ai', 1],
  ['watchread', 'watchRead', 'ai', 1],
  ['watchlist', 'watchListHtml', 'ai', 1],
  ['watchget', 'GET /api/me/watches', 'wall', 2],
  ['watchadd', 'POST /api/me/watches', 'wall', 2],
  ['watchset', 'PATCH /api/me/watches/:id', 'wall', 2],
  ['watchdel', 'DELETE /api/me/watches/:id', 'wall', 2],
  ['watchrun', 'POST /api/watches/run', 'wall', 2],
  ['watchsweep', 'runWatches', 'time', 2],
  /* read without AI since round 4 ("One sheet", 17 Oct 2026): the form's own Find is the spend */
  ['draftcard', 'caDraftRun', 'see', 1],
  ['paperjobs', 'caReadJob', 'ai', 1],
  ['papermark', 'caRiskMark', 'see', 1],
  ['homepaper', 'igHomePaperFace', 'see', 0],
  /* the Contracts place on Home (the overnight work order, step 7): every door
     onto the Contracts page lands here, Wall | List under one head */
  ['contractsplace', 'hbOpenContracts', 'see', 0],
  /* a paper chosen on the wall (the redesign's gaps, round 13, 18 Oct 2026): one press chooses, Jambo says it; a second press opens it */
  ['chosenpaper', 'pdChosenHtml', 'see', 1],
  ['citedoor', 'igCiteGo', 'see', 1],
  /* Home first (8 Oct 2026): a set walked on the Paper, the Paper's desk beside it */
  ['walkset', 'igWalk', 'see', 1],
  ['paperdesk', 'pdPaint', 'see', 1],
  ['passroute', 'POST /api/contracts/:id/pass', 'wall', 2],
  ['agentlevel', 'agentLevel', 'wall', 2],
  ['linkkeep', 'srvShareExtend', 'wall', 2],
  ['readings', 'agApproveItems', 'see', 1],
  /* the nine flow rules 3 and 8 (8 Oct 2026): a pass is a tracked hand-off —
     a `look` question in the colleague's checklist and bell, reminded, the
     asker told when it is done; the server writes the trail */
  ['lookask', 'asksLookFor', 'sign', 1],
  ['looktell', 'lookTell', 'wall', 2],
  /* the rest of Home first (8 Oct 2026, "build all the steps"): approvals open
     on the Paper from the bell and checklist; the Deal tab's redlined paper;
     chasing many late promises at once; Copilot's jobs ending in their own
     doors; a reply drafted for a dropped thread */
  ['approvalpaper', 'pdOpenOnHome', 'see', 1],
  ['dealpaper', 'igRedOn', 'see', 1],
  ['chasemany', 'hbChaseManyRun', 'time', 1],
  ['copilotdoors', 'caReadDoor', 'ai', 1],
  ['draftreply', 'agDraftReply', 'ai', 1],
  /* Jambo's work as drawn (round 23's gaps, 18 Oct 2026): Put away on every prepared piece — on the
     contract for a desk row, for this person alone for any other — and the one chase letter both hosts write */
  ['putaway', 'agPutAway', 'time', 1],
  ['chaseletter', 'chaseMailOf', 'time', 1],
  /* the owner's answer (18), 19 Oct 2026, "Fold to one line": each piece on the Board's Jambo's work card is one row
     (tag · what · reference · one sentence) with Look · its act · Put away; and Look on a chase reads the letter as the
     route will send it, link and all, from the server's own builder (srvChaseMail) */
  ['pieceline', 'hbAgPieceHtml', 'see', 0],
  ['chasepreview', 'GET /api/contracts/:id/chase-preview', 'wall', 2],
  /* the paper work order (8 Oct 2026): our answers to their round get a
     visible send; one paper on every screen; Copilot's answer drawn on the
     paper as a suggestion with the verb that makes it yours glowing */
  ['decidedsend', 'rlDecisionsSendHtml', 'nego', 1],
  ['onepaper', 'igCleanOnRed', 'see', 1],
  ['answeronpaper', 'rlPaintCopilotAnswers', 'nego', 1],
  /* the Brain's fifth view, Stack (10 Oct 2026): what HaTi is built from, its
     counts read by the route that reads the code */
  ['stackview', 'brStackPaint', 'see', 0],
  ['brainread', 'GET /api/brain', 'wall', 2],
  /* the deep read (Stakes, owner 13 Oct 2026; the Breakdown face is gone): read once per
     wording, drawn on Home's Document → Clauses */
  ['breakdown', 'stkDecorate', 'see', 0],
  ['breakread', 'POST /api/ai/breakdown', 'ai', 2],
  ['breakdive', 'POST /api/ai/breakdown/point', 'ai', 2],
  /* Clause review, the Legora way (21 Oct 2026): a person marks a point reviewed; the server keeps it */
  ['ptmark', 'stkMarkReviewed', 'see', 0],
  ['ptreview', 'POST /api/contracts/:id/points/:key/review', 'wall', 2],
  /* Jambo's agents behind Insights (12 Oct 2026): the house, his jobs and his points,
     read off the record of each piece of work and what a person did with it */
  ['jambohouse', 'renderJamboHouse', 'see', 0],
  ['agentpieces', 'agentPieceAdd', 'wall', 2],
  ['roundsettle', 'agentRecordSettle', 'wall', 2],
  ['piecesget', 'GET /api/agents/pieces', 'wall', 2],
  ['agentoutcome', 'POST /api/agents/outcome', 'wall', 2],
  ['agentprepared', 'POST /api/agents/prepared', 'wall', 2],
  ['agentrebuild', 'POST /api/agents/rebuild', 'wall', 2],
  ['agentpoints', 'PUT /api/settings/agent-points', 'wall', 2],
  /* THE CONTROL ROOM BUILT IN FULL (16 Oct 2026): one search in plain words,
     the welcome sent again, the recovery codes, Jambo's "why" read with AI,
     and Ask an admin as its own record */
  ['onesearch', 'stFind', 'see', 1],
  ['invite', 'POST /api/users/:id/invite', 'wall', 2],
  ['totpcount', 'GET /api/me/totp', 'wall', 2],
  ['totpnew', 'POST /api/me/totp/recovery', 'wall', 2],
  ['settingswhy', 'POST /api/ai/settings-why', 'ai', 2],
  ['askadmin', 'stAskSend', 'see', 1],
  ['settingsask', 'POST /api/settings-asks', 'wall', 2],
  ['settingsasks', 'GET /api/settings-asks', 'wall', 2],
  ['settingsanswer', 'PATCH /api/settings-asks/:id', 'wall', 2],
  /* WHAT JAMBO COULD NOT PLACE BECOMES A LESSON (round 8, owner's yes 29 Oct 2026: no names, 90 days) */
  ['unplacednote', 'jamboUnplacedNote', 'see', 1],
  ['lessonspanel', 'stLessonsPaint', 'see', 1],
  ['unplacedpost', 'POST /api/jambo/unplaced', 'wall', 2],
  ['unplacedlist', 'GET /api/jambo/unplaced', 'wall', 2],
  ['unplacedfine', 'DELETE /api/jambo/unplaced/:id', 'wall', 2],
  ['lessonsget', 'GET /api/jambo/lessons', 'wall', 2],
  ['lessonteach', 'PUT /api/jambo/lessons', 'wall', 2],
  /* FINDINGS ON THE MAP (Explorer stage 4, 18 Oct 2026): a view kept for
     colleagues, recounted for each reader inside their access, with replies,
     and sent to a colleague as a tracked ask */
  ['findings', 'igFindingsHtml', 'see', 0],
  ['fdlist', 'GET /api/findings', 'wall', 2],
  ['fdpin', 'POST /api/findings', 'wall', 2],
  ['fddel', 'DELETE /api/findings/:id', 'wall', 2],
  ['fdreply', 'POST /api/findings/:id/notes', 'wall', 2],
  ['fdsend', 'POST /api/findings/:id/send', 'wall', 2],
  ['fdseen', 'PATCH /api/findings/sends/:id', 'wall', 2],
  /* JAMBO EXPLAINS THIS VIEW, HIS WORDS POINT (Explorer stage 3, 18 Oct 2026):
     the view walked part by part from what the map drew, free; and the names
     in his sentence lighting their parts, its figures checked */
  ['mapwalk', 'igTourSteps', 'see', 0],
  ['pointsay', 'igPointPaint', 'see', 0],
  /* THEN AND NOW, AND A PICTURE (Explorer stage 5, 18 Oct 2026): the book as
     it stood on a day against today, from the days the record keeps; and the
     view on screen as a picture, made from the screen alone */
  ['thennow', 'igAsOfData', 'see', 0],
  ['mappicture', 'igPictureBlob', 'see', 0],
  /* JAMBO GUIDES THROUGH THE RULES, NEVER AROUND THEM (17 Oct 2026): one rule
     on every instruction that answers a person, and the rule's own button
     under his answer */
  ['govrule', 'AI_GOVERNANCE_RULE', 'ai', 2],
  ['ruledoor', 'aiRuleDoorGo', 'see', 1],
  /* Jambo takes you there (22 Oct 2026): an answer may name one of the map's places; the browser opens it through the map's own door, the company's switch on */
  ['aigoto', 'aiGotoOf', 'ai', 2],
  /* PRIVATE STREAMS (owner picked "Stream page — the SAP way", 17 Oct 2026): a
     folder only the people named may open — its page, the wall every read
     asks, its one writer, the record of who opened, the money left out of
     every total, and the bell line that tells the named when somebody named
     themself */
  ['privpage', 'stStreamDrawer', 'see', 0],
  ['privwall', 'folderScopeFor', 'wall', 2],
  ['privsave', 'PUT /api/private-streams/:fid', 'wall', 2],
  ['privlist', 'GET /api/private-streams', 'wall', 2],
  ['privseen', 'POST /api/private-streams/:fid/seen', 'wall', 2],
  ['privopens', 'private_opens', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS private_opens', men: '\\bprivate_opens\\b' }],
  ['privmoney', 'fxCounted', 'read', 1],
  ['privnews', 'streamNewsSeen', 'see', 1],
  /* WHO OPENED IT, IN ITS OWN TRAIL (owner picked "In the trail", 17 Oct 2026) */
  ['privtrail', 'histPrivateEvents', 'see', 1],
  /* TWO SIDES (round 12, 17 Oct 2026): History's lanes — ours, the days, theirs */
  ['histlanes', 'histLaneOf', 'see', 1],
  /* History in a few lines (the redesign's gaps, round 12, 18 Oct 2026): what is open, whose move — History's head and Jambo read it once */
  ['histsays', 'histSummaryOf', 'see', 1],
  /* PAY IS NOT DEAL VALUE (owner picked "Pay section — the SAP way", 17 Oct
     2026): an employment contract's pay section and its one door, and the
     reading that keeps a salary out of every total */
  ['paysec', 'payEditOpen', 'see', 0],
  ['payread', 'fxIsPay', 'read', 1],
  /* JAMBO BEHIND THE WALL (owner picked "One press — the SAP way", 17 Oct
     2026): a private folder's contract is read only on a person's press */
  ['jbpress', 'jamboOnPress', 'read', 1],
  /* Jambo speaks first on an upload (round 1 of Jambo's journey, owner, 22 Oct 2026): his first words in his panel beside the paper, read off the arrival reading and your own book, free */
  ['firstread', 'firstReadOf', 'ai', 1],
  ['partyhist', 'partyHistoryOf', 'read', 1],
  /* Round 2 of Jambo's journey (22 Oct 2026): his read on each of their asks, on its row; and what he says once after a signature */
  ['rowread', 'rlRowReadHtml', 'ai', 1],
  ['signedturn', 'signedTurnOf', 'ai', 1],
  /* Round 3 of Jambo's journey (22 Oct 2026): a plain web search on the other side, a person's press, each fact with its source */
  ['partyweb', 'partyWebPress', 'ai', 1],
  /* Round 4 of Jambo's journey (22 Oct 2026): alerts on your phone — urgent now, the rest each morning */
  ['pushalerts', 'pushToggle', 'see', 1],
  ['pushsw', 'swOwnUrl', 'see', 1],
  /* AN NDA'S TWO FACTS (owner picked "The tail on the life line", 17 Oct
     2026): read off the wording, confirmed by a person on the panel */
  ['ndatail', 'ndaEditOpen', 'see', 0],
  ['ndaread', 'ndaRead', 'read', 1],
  /* THE TRAIL, AS A FILE (owner picked "Export drawer — the SAP way", 17 Oct
     2026): Data & backup's The trail tab, the count, the file, and the record
     of every download */
  ['trailpage', 'stTrailHtml', 'see', 0],
  ['trailsum', 'GET /api/trail/summary', 'wall', 2],
  ['traillist', 'GET /api/trail/exports', 'wall', 2],
  ['trailexport', 'GET /api/trail/export', 'wall', 2],
  ['trailrec', 'trail_exports', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS trail_exports', men: '\\btrail_exports\\b' }],
  /* BUSINESS ROLES (owner picked "A role at the top of the drawer — the SAP
     way", 17 Oct 2026): a name for rights HaTi already has */
  ['rolespage', 'stRolesPageHtml', 'see', 0],
  ['bzsection', 'stBzSectionHtml', 'see', 0],
  ['bzget', 'GET /api/business-roles', 'wall', 2],
  ['bzsave', 'PUT /api/business-roles', 'wall', 2],
  ['bzholder', 'PUT /api/business-roles/holder', 'wall', 2],
  ['bzrec', 'role_changes', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS role_changes', men: '\\brole_changes\\b' }],
  /* THE QUARTERLY ACCESS REVIEW (owner picked "Review the sheet — the SAP
     way", 17 Oct 2026): the sheet in review mode, the trail read for it, the
     stamp */
  ['arsheet', 'stArReviewHtml', 'see', 0],
  ['arread', 'GET /api/access-review', 'wall', 2],
  ['armark', 'POST /api/access-review/mark', 'wall', 2],
  ['ardone', 'POST /api/access-review/done', 'wall', 2],
  ['arrec', 'access_reviews', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS access_reviews', men: '\\baccess_reviews\\b' }],
  /* WHEN YOU'RE AWAY (owner picked "An Away card on You — the SAP way",
     17 Oct 2026): who answers your approvals and reviews, from a day to a
     day — never your signing; the one reading the walls ask; every answer
     for someone away recorded */
  ['awaycard', 'stAwayDrawer', 'see', 0],
  ['awayget', 'GET /api/me/away', 'wall', 2],
  ['awayset', 'PUT /api/me/away', 'wall', 2],
  ['awayend', 'DELETE /api/me/away', 'wall', 2],
  ['awayreach', 'GET /api/me/away/reach', 'wall', 2],
  ['awaycovers', 'awayCovers', 'wall', 2],
  ['awayrec', 'away_rules', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS away_rules', men: '\\baway_rules\\b' }],
  ['awayans', 'away_answers', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS away_answers', men: '\\baway_answers\\b' }],
  /* A PARTY'S OWN FACTS (round 19 of the redesign, Parties "The SAP way"; the
     owner's "build all the gaps", 18 Oct 2026): its city and organisation
     number, one home, typed in its panel, walled to the parties the reader
     may know of, every change in the trail */
  ['partyrec', 'partyRecordOpen', 'see', 0],
  ['partyrecget', 'GET /api/party-records', 'wall', 2],
  ['partyrecset', 'PUT /api/party-records', 'wall', 2],
  ['partylookup', 'POST /api/party-records/lookup', 'wall', 2],
  ['pushsub', 'POST /api/push/subscribe', 'wall', 2],
  ['pushunsub', 'POST /api/push/unsubscribe', 'wall', 2],
  ['pushkey', 'GET /api/push/key', 'wall', 2],
  ['pushswroute', 'GET /sw.js', 'wall', 2],
  ['manifest', 'GET /manifest.webmanifest', 'wall', 2],
  ['partyrecdb', 'party_records', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS party_records', men: '\\bparty_records\\b' }],
  ['partyreclog', 'party_record_log', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS party_record_log', men: '\\bparty_record_log\\b' }],
  /* HOW LONG CONTRACTS ARE KEPT, AND LEGAL HOLD (owner picked "Keeping on each
     stream — the SAP way", 17 Oct 2026): the stream's period, what it makes
     due, the admin's yes, and what is held */
  ['keeptab', 'stKpHtml', 'see', 0],
  ['keepread', 'GET /api/keeping', 'wall', 2],
  ['keepset', 'PUT /api/keeping/:fid', 'wall', 2],
  ['keeprun', 'POST /api/keeping/:fid/run', 'wall', 2],
  ['keepbook', 'kpBook', 'wall', 2],
  ['keeprec', 'keeping_acts', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS keeping_acts', men: '\\bkeeping_acts\\b' }],
  /* CODE NAMES FOR CONFIDENTIAL DEALS (owner picked "A code name field — the
     SAP way", 17 Oct 2026): the line on Details, the one writer, the front
     door and its mask, the two records */
  ['cnrow', 'cnRowHtml', 'see', 0],
  ['cnset', 'PUT /api/contracts/:id/code-name', 'wall', 2],
  ['cndoor', 'cnFrontDoor', 'wall', 2],
  ['cnmask', 'cnMask', 'wall', 2],
  ['cnrec', 'code_names', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS code_names', men: '\\bcode_names\\b' }],
  ['cnlog', 'code_name_log', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS code_name_log', men: '\\bcode_name_log\\b' }],
  /* ROUNDS 24 AND 26 AS DRAWN (the gaps, 18 Oct 2026): a form opened in its
     row on Your settings, your own email and your own copy (each recorded),
     and the stream shown beside Contract streams */
  ['youform', 'stRowFormOpen', 'see', 0],
  ['myemail', 'POST /api/me/email', 'wall', 2],
  ['mycopy', 'GET /api/me/copy', 'wall', 2],
  ['acctrec', 'account_acts', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS account_acts', men: '\\baccount_acts\\b' }],
  ['streamside', 'stSwPanelHtml', 'see', 0],
  /* owner's answer 12 (18 Oct 2026): the day each clash in who may do what
     was first seen, kept on the server for its row's "since <day>" */
  ['clashseen', 'POST /api/clashes/seen', 'wall', 2],
  /* the gaps' third pass (19 Oct 2026): which clashes there are is ONE
     reading both hosts ask, so the server stamps a clash the day it is made */
  ['clashfind', 'clashFind', 'wall', 1],
].map((a, i) => ({ id: a[0], code: a[1], reg: a[2], floor: a[3], def: (a[4] || {}).def || '', men: (a[4] || {}).men || '', i }));

/* The six flows: which parts each step lands on. The sentences are
   brn_step_<flow>_<n> in the dictionary. A flow is a STORY a person wrote;
   the reading only checks that every part it names is still in the code. */
const BRAIN_FLOWS = [
  { id: 'upload', steps: [['upload', 'dropin', 'book', 'draftcard'], ['docx', 'pdf'], ['clauses'], ['putguard', 'db'], ['triage', 'arrivalowed', 'jbpress'], ['brief', 'playbook', 'oblscan', 'obdesk', 'risk', 'datedwin', 'papermark', 'ndaread'], ['model'], ['details', 'fillface', 'refile', 'blanks', 'paysec', 'ndatail'], ['overview', 'constellation', 'glance', 'needshere', 'paperline', 'bell', 'strip', 'cardpage', 'pageglance', 'glanceasks', 'notehere'], ['firstread', 'partyhist', 'partyweb', 'partylookup']] },
  /* The new parts join STEPS THAT ALREADY EXIST rather than adding steps of
     their own: a step inserted in the middle renumbers every sentence after
     it in both books, and these are not new stages of the story — they are
     who else is on the page while you do it, and who may rule on it. */
  { id: 'redline', steps: [['redface', 'negpage', 'startnego', 'here', 'follow'], ['editor', 'baton', 'askkeep', 'risklist', 'riskwalk'], ['funnel'], ['desk', 'suggest'], ['ladder'], ['review', 'kept', 'asks'], ['payload', 'letter'], ['shares', 'linkcheck'], ['email', 'sharemail', 'mailkey', 'cplink', 'turnmail', 'wordmark'], ['whosemove', 'bell', 'roundauto']] },
  { id: 'round', steps: [['cplink', 'guestcode'], ['respond'], ['audit'], ['apply', 'wordback', 'paperdrop', 'roundsettle'], ['ladder', 'rowread'], ['whosemove', 'decidedsend'], ['bell', 'home', 'needsme', 'counter', 'desktabs', 'negpage', 'boardviews', 'stands', 'stale', 'dealpaper', 'onepaper', 'answeronpaper'], ['webhook']] },
  { id: 'sign', steps: [['signface', 'signtab', 'linkcheck'], ['readiness', 'signgate', 'rules', 'paperjobs'], ['approvals', 'namedyes', 'decide', 'undoyes', 'rulestep', 'asks', 'approvalpaper', 'freshen', 'awaycard', 'awayget', 'awayset', 'awayend', 'awayreach', 'awaycovers', 'awayrec', 'awayans'], ['brief', 'playbook', 'blanks'], ['pad'], ['putguard', 'srvseal', 'sealtext'], ['seal', 'frozen', 'issuelinks'], ['obligations', 'renewal', 'calendar', 'mynotes', 'mine', 'myitems', 'myitemsget', 'myitemsput', 'myitemsdel', 'plan', 'keeptab', 'keepread', 'keepset', 'keeprun', 'keepbook', 'keeprec', 'cnrow', 'cnset', 'cndoor', 'cnmask', 'cnrec', 'cnlog'], ['email', 'copies', 'signedturn', 'pushalerts', 'pushsw', 'pushsub', 'pushunsub', 'pushkey', 'pushswroute', 'manifest']] },
  { id: 'night', steps: [['reminders', 'watchsweep', 'watchrun', 'lanes', 'agentlevel', 'linkkeep', 'agentpieces', 'agentpoints'], ['renewal', 'renewact'], ['renewprep'], ['model', 'boardjudge', 'bookread'], ['db'], ['obligations'], ['email', 'boardmoved', 'looktell', 'invite'], ['desknight', 'home', 'needsme', 'counter', 'insights', 'readings', 'chasemany', 'draftreply', 'agentoutcome', 'agentprepared', 'agentrebuild', 'piecesget', 'jambohouse', 'putaway', 'chaseletter', 'pieceline', 'chasepreview']] },
  { id: 'ask', steps: [['copilotask', 'jambomap', 'listask', 'unplacednote', 'lessonspanel', 'handbook', 'hbkbook', 'hbkask', 'flowmap', 'flowtable', 'navread', 'hswords', 'navdoor', 'aifirst', 'onesearch', 'menuask', 'nextsteps', 'reflink', 'menutab', 'strip', 'homepaper', 'breakdown', 'ptmark', 'explorer', 'chartread', 'chartsize', 'recipe', 'askpreview', 'verified', 'boardwords', 'packs', 'phrasebook', 'stackview', 'mapwalk', 'pointsay', 'thennow', 'mappicture', 'findings', 'followhome', 'boardhead', 'onereader', 'contractfind', 'briefword', 'askbar', 'jambopop', 'jambohere', 'jbpresses', 'watchread', 'watchlist'], ['db', 'unplacedpost', 'unplacedlist', 'unplacedfine', 'lessonsget', 'lessonteach', 'hatisearch', 'hsroute', 'aidoor', 'wayon', 'watchget', 'watchadd', 'watchset', 'watchdel', 'askcolkept', 'askcolteam', 'askcolcheck', 'askcolrule', 'askcolkeep', 'askcoldel', 'askcolsum', 'askcolfacts', 'askcolodd', 'partyfacts', 'ptreview', 'dealfacts', 'brainread', 'privwall', 'privopens', 'privmoney', 'privtrail', 'histlanes', 'payread', 'fdlist', 'fdpin', 'fddel', 'fdseen', 'histsays'], ['model', 'askcolread', 'askcolturn', 'partybrief', 'settingswhy', 'govrule', 'breakread', 'breakdive', 'boardtools', 'dataguide', 'cardcheck', 'boardundo', 'honest', 'askchoice', 'factsheet', 'analyst', 'story'], ['quote', 'citedoor', 'walkset', 'paperdesk'], ['contracts', 'askcol', 'askcolcells', 'askcoldisc', 'askcolnext', 'askcolruns', 'askcolstop', 'reads', 'pulse', 'contractsplace', 'customers', 'directory', 'partyrec', 'partyrecget', 'partyrecset', 'partyrecdb', 'partyreclog', 'passroute', 'lookask', 'copilotdoors', 'ruledoor', 'aigoto', 'fdsend', 'fdreply', 'chosenpaper', 'listhead', 'listfoot', 'listlang'], ['explorer', 'cellfold', 'readchips', 'nextq', 'boardmarks']] },
  /* THE OVERNIGHT REVIEW'S FLOWS (9 Oct 2026): the commonest start, a request,
     the other side's signature, an amendment, the end of a contract, and the
     ways a step can go wrong — none of which the six flows above walked. */
  { id: 'draft', steps: [['newagr', 'draftform', 'essentials', 'tplskip', 'scratchsection'], ['putguard', 'db'], ['details', 'fillface', 'tplform', 'blanks'], ['triage'], ['letter', 'shares', 'linkcheck'], ['email', 'sharemail', 'outbyhand', 'wordfile'], ['whosemove', 'bell']] },
  { id: 'request', steps: [['request', 'kinds', 'intake', 'mailroom', 'reqfiles', 'askadmin', 'settingsask', 'settingsanswer', 'privpage', 'privlist', 'privsave', 'rolespage', 'bzsection', 'bzget', 'bzsave', 'bzholder', 'bzrec', 'arsheet', 'arread', 'armark', 'ardone', 'arrec', 'clashseen', 'clashfind'], ['bell', 'settingsasks', 'privnews', 'privseen'], ['lanes', 'laneowner'], ['arrivalowed', 'triage'], ['newagr']] },
  { id: 'theysign', steps: [['theirsign', 'issuelinks'], ['cplink', 'guestcode', 'totpcount', 'totpnew'], ['respond', 'filesig'], ['srvseal', 'sealtext', 'frozen'], ['copies', 'email'], ['obligations', 'renewal', 'calendar']] },
  { id: 'amend', steps: [['amendface', 'amend'], ['blanks'], ['readiness', 'approvals'], ['srvseal'], ['renewal', 'overview', 'stripfamily']] },
  { id: 'end', steps: [['served', 'renewact'], ['autorenew'], ['obdone'], ['endpause', 'decline', 'reopen'], ['archive', 'hold', 'trailpage', 'trailsum', 'traillist', 'trailexport', 'trailrec', 'streamside', 'youform', 'myemail', 'mycopy', 'acctrec']] },
  { id: 'mistake', steps: [['leaveguard', 'inline'], ['discard'], ['freshen'], ['outbyhand', 'mailkey'], ['linkkeep', 'whosemove']] }
];

/* THE LANES (Young picked "Swimlane", 8 Oct 2026, and approved its rule): the
   Brain's fourth view draws a flow as a process map, one row per kind of
   person and one for HaTi itself. WHO does a part is the part's own fact, so
   every part a flow names sits in exactly one lane here. WHEN is the step's
   fact (the bell rings in several stages of several flows), so every flow
   step has a stage in BRAIN_FLOW_STAGES, one per step. Words: brn_lane_<k>,
   brn_stage_<k>. f564 fails on a part in no lane, a part in two, a name that
   is not a part, or a flow whose stages do not match its steps. */
const BRAIN_LANES = ['req', 'own', 'hati', 'them'];
const BRAIN_STAGES = ['ask', 'create', 'prepare', 'nego', 'approve', 'sign', 'keep'];
const BRAIN_LANE_OF = {
  /* a colleague: the requester, the reviewer, the contributor, the approver */
  req: ['request', 'kinds', 'reqfiles', 'askadmin', 'ruledoor', 'privpage', 'trailpage', 'rolespage', 'bzsection', 'arsheet', 'settingsask', 'settingsanswer', 'review', 'suggest', 'rules', 'namedyes', 'decide', 'undoyes', 'approvalpaper', 'lookask'],
  /* the person working the contract: what they see and press */
  own: ['lessonspanel', 'listlang', 'awaycard', 'keeptab', 'cnrow', 'putaway', 'chaseletter', 'pieceline', 'upload', 'dropin', 'draftform', 'refile', 'privnews', 'privtrail', 'histlanes', 'paysec', 'ndatail', 'glance', 'needshere', 'paperline', 'letter', 'book', 'draftcard', 'overview', 'constellation', 'papermark', 'obdesk', 'bell', 'home', 'needsme', 'counter', 'desktabs', 'negpage', 'redface', 'boardviews', 'strip', 'stripfamily', 'cardpage', 'pageglance', 'chosenpaper', 'histsays', 'startnego', 'here', 'follow', 'glanceasks', 'notehere', 'followhome', 'boardhead',
    'editor', 'baton', 'askkeep', 'risklist', 'riskwalk', 'stands', 'dealpaper', 'onepaper', 'decidedsend', 'signtab', 'signface', 'pad', 'calendar', 'desknight', 'insights', 'readings',
    'chasemany', 'youform', 'streamside', 'navread', 'handbook', 'hbkask', 'flowmap', 'flowtable', 'hswords', 'navdoor', 'aifirst', 'copilotask', 'jambomap', 'menuask', 'nextsteps', 'reflink', 'menutab', 'amendface', 'homepaper', 'explorer', 'chartread', 'chartsize', 'recipe', 'askpreview', 'verified', 'boardwords', 'packs',
    'phrasebook', 'boardtools', 'cardcheck', 'boardundo', 'honest', 'askchoice', 'citedoor', 'walkset', 'paperdesk', 'contracts', 'askcol', 'askcolcells', 'askcoldisc', 'askcolnext', 'reads', 'pulse', 'contractsplace', 'customers', 'directory', 'partyrec', 'cellfold',
    'readchips', 'nextq', 'mapwalk', 'pointsay', 'thennow', 'mappicture', 'findings', 'newagr', 'essentials', 'tplform', 'details', 'fillface', 'outbyhand', 'amend', 'endpause', 'decline', 'reopen', 'archive', 'hold', 'served', 'obdone', 'inline', 'stackview', 'mynotes', 'breakdown', 'ptmark', 'jambohouse', 'onesearch', 'listask', 'totpcount', 'totpnew', 'onereader', 'contractfind', 'briefword', 'askbar', 'jambopop', 'jambohere', 'jbpresses', 'watchread', 'watchlist', 'listhead', 'listfoot'],
  /* HaTi itself: the readings, Copilot, the agents, the server's checks, the mail it sends */
  hati: ['unplacednote', 'unplacedpost', 'unplacedlist', 'unplacedfine', 'lessonsget', 'lessonteach', 'hatisearch', 'hbkbook', 'hsroute', 'aidoor', 'wayon', 'docx', 'clauses', 'putguard', 'db', 'tplskip', 'chasepreview', 'privwall', 'privsave', 'privlist', 'privseen', 'privopens', 'privmoney', 'trailsum', 'traillist', 'trailexport', 'trailrec', 'bzget', 'bzsave', 'bzholder', 'bzrec', 'arread', 'armark', 'ardone', 'arrec', 'clashseen', 'clashfind', 'awayget', 'awayset', 'awayend', 'awayreach', 'awaycovers', 'awayrec', 'awayans', 'keepread', 'keepset', 'keeprun', 'keepbook', 'keeprec', 'partyrecget', 'partyrecset', 'partyrecdb', 'partyreclog', 'cnset', 'cndoor', 'cnmask', 'cnrec', 'cnlog', 'payread', 'jbpress', 'ndaread', 'triage', 'arrivalowed', 'firstread', 'partyhist', 'partyweb', 'partylookup', 'rowread', 'signedturn', 'pushalerts', 'pushsw', 'pushsub', 'pushunsub', 'pushkey', 'pushswroute', 'manifest', 'datedwin', 'brief', 'playbook', 'oblscan', 'risk', 'model', 'blanks', 'laneowner',
    'funnel', 'myemail', 'mycopy', 'acctrec', 'desk', 'ladder', 'kept', 'asks', 'payload', 'shares', 'linkcheck', 'email', 'sharemail', 'turnmail', 'wordmark', 'whosemove', 'roundauto',
    'mailkey', 'respond', 'audit', 'apply', 'wordback', 'paperdrop', 'stale', 'webhook', 'answeronpaper', 'readiness', 'signgate', 'approvals', 'paperjobs', 'rulestep', 'seal',
    'frozen', 'obligations', 'renewal', 'reminders', 'lanes', 'agentlevel', 'linkkeep', 'renewact', 'renewprep', 'boardjudge', 'bookread',
    'boardmoved', 'looktell', 'draftreply', 'dataguide', 'analyst', 'story', 'quote', 'passroute', 'copilotdoors', 'govrule', 'aigoto', 'factsheet', 'dealfacts',
    'boardmarks', 'pdf', 'intake', 'mailroom', 'wordfile', 'issuelinks', 'filesig', 'srvseal', 'copies', 'autorenew', 'leaveguard', 'discard',
    'freshen', 'sealtext', 'brainread', 'mine', 'myitems', 'myitemsget', 'myitemsput', 'myitemsdel', 'plan', 'scratchsection', 'askcolread', 'askcolturn', 'askcolruns', 'askcolstop', 'partybrief', 'askcolkept', 'askcolteam', 'askcolcheck', 'askcolrule', 'askcolkeep', 'askcoldel', 'askcolsum', 'askcolfacts', 'askcolodd', 'partyfacts', 'ptreview', 'breakread', 'breakdive', 'agentpieces', 'roundsettle', 'piecesget', 'agentoutcome', 'agentprepared', 'agentrebuild', 'agentpoints', 'invite', 'settingswhy', 'settingsasks', 'fdlist', 'fdpin', 'fddel', 'fdreply', 'fdsend', 'fdseen', 'watchget', 'watchadd', 'watchset', 'watchdel', 'watchrun', 'watchsweep'],
  /* the counterparty: their link, the code that proves it is them */
  them: ['cplink', 'guestcode', 'theirsign']
};
const BRAIN_FLOW_STAGES = {
  upload: ['create', 'create', 'create', 'create', 'prepare', 'prepare', 'prepare', 'prepare', 'prepare', 'prepare'],
  redline: ['nego', 'nego', 'nego', 'nego', 'nego', 'nego', 'nego', 'nego', 'nego', 'nego'],
  round: ['nego', 'nego', 'nego', 'nego', 'nego', 'nego', 'nego', 'nego'],
  sign: ['sign', 'sign', 'approve', 'approve', 'sign', 'sign', 'sign', 'keep', 'keep'],
  night: ['keep', 'keep', 'keep', 'keep', 'keep', 'keep', 'keep', 'keep'],
  ask: ['ask', 'ask', 'ask', 'ask', 'ask', 'ask'],
  draft: ['create', 'create', 'prepare', 'prepare', 'nego', 'nego', 'nego'],
  request: ['ask', 'ask', 'create', 'prepare', 'create'],
  theysign: ['sign', 'sign', 'sign', 'sign', 'keep', 'keep'],
  amend: ['create', 'prepare', 'approve', 'sign', 'keep'],
  end: ['keep', 'keep', 'keep', 'keep', 'keep'],
  mistake: ['nego', 'nego', 'approve', 'nego', 'nego']
};
/* KNOWN PROBLEMS: a step that does not yet do what the process needs. Each is
   a numbered line here on the part it sits on, its words brn_pb_<n> (the short
   label drawn on the board), brn_pb_<n>_why and brn_pb_<n>_fix in both books.
   Fixing it takes its line off this list, and the red label goes with it.
   Numbers are never reused. */
const BRAIN_PROBLEMS = [
  /* Home first, step 7 ("answering HaTi from an email reply") was agreed as
     later on 8 Oct 2026 and is not built */
  { n: 1, part: 'email' },
  /* the overnight run (9 Oct 2026): what it could not close, said where it sits.
     No. 2 (the renewal term) closed the same day: the box is on the Overview. */
  { n: 3, part: 'srvseal' }
];
function brainLaneOf(id){ return BRAIN_LANES.find(k => BRAIN_LANE_OF[k].includes(id)) || null; }

/* Where a part the catalogue does not name yet sits: the area by the file it
   lives in, the floor by where that file runs. First match wins. */
const BRAIN_FILE_REGION = [
  [/^server\/.*$/, 'wall'],
  [/^js\/(negotiation|desk|review|ladder|clauselock|presence|redlineplan|risks)\.js$|^js\/views\/(negotiation|negotiation-css|clauseeditor)\.js$/, 'nego'],
  /* The page every party reads is a reading, not a view file, so without this
     line it would default to the wall — which is where a reading that spends
     nothing and touches no route does not belong. */
  /* Jambo's presses and watches (21 Oct 2026) */
  [/^js\/jambopress\.js$/, 'ai'],
  [/^js\/(dealstands|paperdesk)\.js$|^js\/views\/breakdown\.js$/, 'see'],
  /* the process review's two new files (4 Oct 2026) and the address book */
  [/^js\/(signgate|asks|sealtext)\.js$/, 'sign'],
  [/^js\/clashkeys\.js$/, 'wall'],
  [/^js\/(intakelanes|participants)\.js$/, 'in'],
  [/^js\/(ai|aimd|aitrace|triage|playbook|metadata|metaclean|precedent|standards|draft|navmap|copilotacts|jambomap)\.js$/, 'ai'],
  /* the one search's words (Jambo works like Copilot, stage 1, 22 Oct 2026) */
  [/^js\/hatisearch\.js$/, 'ai'],
  /* the Handbook's chapters (26 Oct 2026) */
  [/^js\/handbook\.js$/, 'see'],
  /* the flow map's table (31 Oct 2026) */
  [/^js\/flowmap\.js$/, 'see'],
  /* the list language: the parts every list draws (27 Oct 2026) */
  [/^js\/listlang\.js$/, 'see'],
  [/^js\/(docx|pdf|pdfrich|ocr|clausemodel|blanks|uploadblanks|richdoc|redline|templateform)\.js$/, 'read'],
  [/^js\/(signcheck|signapproval|approvals|signature|assurance|outside)\.js$|^js\/views\/(handover|approvalsview)\.js$/, 'sign'],
  /* alerts on your phone (round 4, 22 Oct 2026): what is due, told where you are */
  [/^js\/(push|push-sw)\.js$/, 'time'],
  [/^js\/(obligations|desknight|notice|payterms|runway|mine|nda)\.js$|^js\/views\/(calendar|mynotes)\.js$/, 'time'],
  [/^js\/views\/reads\.js$/, 'see'],
  [/^js\/views\/pulse\.js$/, 'see'],
  [/^js\/(wizard|intake|cohort|family)\.js$|^js\/views\/(intake|newstandard|templatebuilder|templatelib|migration|library)\.js$/, 'in'],
  [/^js\/(adviserlink|sharemail)\.js$|^js\/views\/(portal|adviceportal)\.js$/, 'out']
];
function brainRegionOfFile(file){
  const f = String(file || '');
  for (const [re, r] of BRAIN_FILE_REGION) if (re.test(f)) return r;
  return /^js\/views\//.test(f) ? 'see' : 'wall';
}
function brainFloorOfFile(file){
  const f = String(file || '');
  if (/^server\//.test(f)) return 2;
  return /^js\/views\//.test(f) ? 0 : 1;
}

const _BR_ROUTE = /^(GET|POST|PUT|PATCH|DELETE) (\/\S+)$/;
const _brEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* What text marks the part's DEFINITION. */
function brainDefs(p){
  if (p.def) return [p.def];
  const r = _BR_ROUTE.exec(p.code);
  if (r) return ["app." + r[1].toLowerCase() + "('" + r[2] + "'"];
  const n = p.code;
  return ['async function ' + n + '(', 'function ' + n + '(', 'const ' + n + ' =', 'const ' + n + '=', 'let ' + n + ' =', 'let ' + n + '='];
}
/* What text in ANOTHER part's body means it hands work to this one. A route
   with a parameter in its path has no single spelling at its callers, so it
   is found and drawn but gets no incoming link rather than a guessed one. */
function brainMention(p){
  if (p.men) return new RegExp(p.men);
  const r = _BR_ROUTE.exec(p.code);
  if (r) return r[2].includes(':') ? null : new RegExp("['\"`]" + _brEsc(r[2]) + "['\"`?]");
  return new RegExp('\\b' + _brEsc(p.code) + '\\b');
}
/* The body that follows a definition: brace matching from the first brace
   (for a route, the handler's own), capped. A naive count — a brace inside a
   string can end it early, which costs a link, never invents one. */
const BRAIN_BODY_MAX = 60000;
function brainBody(text, at, isRoute){
  let open = -1;
  if (isRoute){ const a = text.indexOf('=> {', at); if (a >= 0 && a - at < 400) open = a + 3; }
  if (open < 0){ open = text.indexOf('{', at); if (open < 0 || open - at > 400) return text.slice(at, text.indexOf('\n', at) + 1 || at + 200); }
  let d = 0;
  const end = Math.min(text.length, open + BRAIN_BODY_MAX);
  for (let i = open; i < end; i++){
    const ch = text[i];
    if (ch === '{') d++;
    else if (ch === '}'){ d--; if (d === 0) return text.slice(at, i + 1); }
  }
  return text.slice(at, end);
}

/* ONE READING OF THE CODE. `files` is { 'js/core.js': text, … } — the host
   decides which files; this decides nothing about the disk. Returns plain
   data: where each named part is, the links between named parts, every name
   the code publishes, and any flow step whose part is gone. */
function brainRead(files){
  const names = Object.keys(files || {}).sort();
  const parts = {};
  const bodies = {};
  for (const p of BRAIN_PARTS){
    const defs = brainDefs(p);
    let hit = null;
    for (const f of names){
      const t = files[f];
      let k = -1;
      for (const d of defs){ const at = t.indexOf(d); if (at >= 0 && (k < 0 || at < k)) k = at; }
      if (k >= 0){ hit = { f, k }; break; }
    }
    if (!hit){ parts[p.id] = { found: false }; continue; }
    const t = files[hit.f];
    parts[p.id] = { found: true, file: hit.f, line: t.slice(0, hit.k).split('\n').length };
    /* A link is what the CODE does, never what a note beside it says: this
       codebase explains itself at length, so comments come off first. */
    bodies[p.id] = brainBody(t, hit.k, _BR_ROUTE.test(p.code)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  }
  const edges = [];
  for (const a of BRAIN_PARTS){
    const body = bodies[a.id]; if (!body) continue;
    for (const b of BRAIN_PARTS){
      if (a === b || !parts[b.id].found) continue;
      const re = brainMention(b);
      if (re && re.test(body)) edges.push([a.id, b.id]);
    }
  }
  const published = [];
  const seen = new Set();
  for (const f of names){
    const t = files[f];
    if (/^js\//.test(f)){
      const re = /Object\.assign\(\s*window\s*,\s*\{([\s\S]*?)\}\s*\)/g;
      let m;
      while ((m = re.exec(t))){
        for (const raw of m[1].split(',')){
          const n = raw.split(':')[0].replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').trim();
          if (/^[A-Za-z_$][\w$]*$/.test(n) && !seen.has(n)){ seen.add(n); published.push({ name: n, file: f }); }
        }
      }
    } else {
      const re = /\bapp\.(get|post|put|patch|delete)\(\s*'([^']+)'/g;
      let m;
      while ((m = re.exec(t))){
        const n = m[1].toUpperCase() + ' ' + m[2];
        if (!seen.has(n)){ seen.add(n); published.push({ name: n, file: f }); }
      }
    }
  }
  const flowGaps = [];
  BRAIN_FLOWS.forEach(fl => fl.steps.forEach((s, i) => s.forEach(id => {
    if (!parts[id] || !parts[id].found) flowGaps.push({ flow: fl.id, step: i + 1, part: id });
  })));
  return { parts, edges, published, flowGaps };
}

/* A fingerprint of the reading: it moves only when the shape of the code
   moved (a part found or lost, a link made or cut, a name published or
   retired), never because a file was touched without changing any of that. */
function brainKey(map){
  const s = JSON.stringify([
    Object.keys(map.parts || {}).sort().map(k => k + ':' + (map.parts[k].found ? 1 : 0)),
    (map.edges || []).map(e => e.join('>')).sort(),
    (map.published || []).map(p => p.name).sort()
  ]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + s.length.toString(36);
}

/* What changed between two readings. `prev` null means this is the first
   reading on this server: a baseline, nothing is "new". Lists are capped and
   what was left out is counted. */
const BRAIN_DIFF_MAX = 40;
function brainDiff(prev, next){
  if (!prev) return { first: true, born: [], bornMore: 0, retired: [], retiredMore: 0, edgesAdded: [], edgesCut: 0, lost: [], found: [] };
  const pn = new Set((prev.published || []).map(p => p.name));
  const nn = new Set((next.published || []).map(p => p.name));
  const bornAll = (next.published || []).filter(p => !pn.has(p.name));
  const retiredAll = (prev.published || []).filter(p => !nn.has(p.name)).map(p => p.name);
  const pe = new Set((prev.edges || []).map(e => e.join('>')));
  const ne = new Set((next.edges || []).map(e => e.join('>')));
  const edgesAdded = (next.edges || []).filter(e => !pe.has(e.join('>')));
  const edgesCut = (prev.edges || []).filter(e => !ne.has(e.join('>'))).length;
  const pf = id => !!(prev.parts && prev.parts[id] && prev.parts[id].found);
  const nf = id => !!(next.parts && next.parts[id] && next.parts[id].found);
  const lost = BRAIN_PARTS.filter(p => pf(p.id) && !nf(p.id)).map(p => p.id);
  const found = BRAIN_PARTS.filter(p => !pf(p.id) && nf(p.id)).map(p => p.id);
  return {
    first: false,
    born: bornAll.slice(0, BRAIN_DIFF_MAX).map(p => ({ name: p.name, file: p.file, reg: brainRegionOfFile(p.file), floor: brainFloorOfFile(p.file) })),
    bornMore: Math.max(0, bornAll.length - BRAIN_DIFF_MAX),
    retired: retiredAll.slice(0, BRAIN_DIFF_MAX), retiredMore: Math.max(0, retiredAll.length - BRAIN_DIFF_MAX),
    edgesAdded: edgesAdded.slice(0, BRAIN_DIFF_MAX), edgesCut, lost, found
  };
}

const BRAIN_API = { BRAIN_REGIONS, BRAIN_FLOORS, BRAIN_PARTS, BRAIN_FLOWS, BRAIN_LANES, BRAIN_STAGES, BRAIN_LANE_OF, BRAIN_FLOW_STAGES, BRAIN_PROBLEMS, brainLaneOf, BRAIN_FILE_REGION, BRAIN_BODY_MAX, BRAIN_DIFF_MAX,
  brainRegionOfFile, brainFloorOfFile, brainDefs, brainMention, brainBody, brainRead, brainKey, brainDiff };
if (typeof window !== 'undefined') Object.assign(window, BRAIN_API);
if (typeof module !== 'undefined' && module.exports) module.exports = BRAIN_API;
