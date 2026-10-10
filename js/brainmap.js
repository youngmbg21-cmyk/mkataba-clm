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
  ['bell', 'buildAlerts', 'see', 0],
  ['contracts', 'renderRegister', 'see', 0],
  /* Customer folders (10 Oct 2026): one shelf per customer, read off the counterparty */
  ['customers', 'renderCustomers', 'see', 0],
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
  ['newagr', 'openNewAgreement', 'in', 0],
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
  ['renewal', 'renewalWindow', 'time', 1],
  ['desknight', 'deskShown', 'time', 1],
  ['email', 'mailReport', 'out', 3],
  /* the mail key an admin saves from the screen (9 Oct 2026): the server's environment no longer the only way email goes out */
  ['mailkey', 'PUT /api/mail/config', 'out', 3],
  /* THE OVERNIGHT REVIEW'S PARTS (9 Oct 2026, owner: "fix all the issues"): the
     map told only the happy path. These name drafting from a template, the other
     side's signature and the server's seal, an amendment, the end of a contract,
     and what happens when something goes wrong, so each has a flow. */
  ['tplform', 'tplFormApply', 'in', 1],
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
  ['draftcard', 'caDraftRun', 'ai', 1],
  ['paperjobs', 'caReadJob', 'ai', 1],
  ['papermark', 'caRiskMark', 'see', 1],
  ['homepaper', 'igHomePaperFace', 'see', 0],
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
  /* the paper work order (8 Oct 2026): our answers to their round get a
     visible send; one paper on every screen; Copilot's answer drawn on the
     paper as a suggestion with the verb that makes it yours glowing */
  ['decidedsend', 'rlDecisionsSendHtml', 'nego', 1],
  ['onepaper', 'igCleanOnRed', 'see', 1],
  ['answeronpaper', 'rlPaintCopilotAnswers', 'nego', 1],
].map((a, i) => ({ id: a[0], code: a[1], reg: a[2], floor: a[3], def: (a[4] || {}).def || '', men: (a[4] || {}).men || '', i }));

/* The six flows: which parts each step lands on. The sentences are
   brn_step_<flow>_<n> in the dictionary. A flow is a STORY a person wrote;
   the reading only checks that every part it names is still in the code. */
const BRAIN_FLOWS = [
  { id: 'upload', steps: [['upload', 'book', 'draftcard'], ['docx', 'pdf'], ['clauses'], ['putguard', 'db'], ['triage', 'arrivalowed'], ['brief', 'playbook', 'oblscan', 'obdesk', 'risk', 'datedwin', 'papermark'], ['model'], ['blanks'], ['overview', 'constellation', 'bell']] },
  /* The new parts join STEPS THAT ALREADY EXIST rather than adding steps of
     their own: a step inserted in the middle renumbers every sentence after
     it in both books, and these are not new stages of the story — they are
     who else is on the page while you do it, and who may rule on it. */
  { id: 'redline', steps: [['negpage', 'startnego', 'here', 'follow'], ['editor', 'baton', 'askkeep', 'risklist', 'riskwalk'], ['funnel'], ['desk', 'suggest'], ['ladder'], ['review', 'kept', 'asks'], ['payload'], ['shares', 'linkcheck'], ['email', 'mailkey', 'cplink', 'turnmail', 'wordmark'], ['whosemove', 'bell', 'roundauto']] },
  { id: 'round', steps: [['cplink', 'guestcode'], ['respond'], ['audit'], ['apply', 'wordback', 'paperdrop'], ['ladder'], ['whosemove', 'decidedsend'], ['bell', 'home', 'negpage', 'stands', 'stale', 'dealpaper', 'onepaper', 'answeronpaper'], ['webhook']] },
  { id: 'sign', steps: [['signtab', 'linkcheck'], ['readiness', 'signgate', 'rules', 'paperjobs'], ['approvals', 'namedyes', 'decide', 'undoyes', 'rulestep', 'asks', 'approvalpaper', 'freshen'], ['brief', 'playbook', 'blanks'], ['pad'], ['putguard', 'srvseal', 'sealtext'], ['seal', 'frozen', 'issuelinks'], ['obligations', 'renewal', 'calendar'], ['email', 'copies']] },
  { id: 'night', steps: [['reminders', 'lanes', 'agentlevel', 'linkkeep'], ['renewal', 'renewact'], ['renewprep'], ['model', 'boardjudge', 'bookread'], ['db'], ['obligations'], ['email', 'boardmoved', 'looktell'], ['desknight', 'home', 'insights', 'readings', 'chasemany', 'draftreply']] },
  { id: 'ask', steps: [['copilotask', 'homepaper', 'explorer', 'chartread', 'chartsize', 'recipe', 'askpreview', 'verified', 'boardwords', 'packs', 'phrasebook'], ['db', 'dealfacts'], ['model', 'boardtools', 'dataguide', 'cardcheck', 'boardundo', 'honest', 'askchoice', 'factsheet', 'analyst', 'story'], ['quote', 'citedoor', 'walkset', 'paperdesk'], ['contracts', 'customers', 'passroute', 'lookask', 'copilotdoors'], ['explorer', 'cellfold', 'readchips', 'nextq', 'boardmarks']] },
  /* THE OVERNIGHT REVIEW'S FLOWS (9 Oct 2026): the commonest start, a request,
     the other side's signature, an amendment, the end of a contract, and the
     ways a step can go wrong — none of which the six flows above walked. */
  { id: 'draft', steps: [['newagr', 'essentials'], ['putguard', 'db'], ['tplform', 'blanks'], ['triage'], ['shares', 'linkcheck'], ['email', 'outbyhand', 'wordfile'], ['whosemove', 'bell']] },
  { id: 'request', steps: [['request', 'kinds', 'intake', 'mailroom', 'reqfiles'], ['bell'], ['lanes', 'laneowner'], ['arrivalowed', 'triage'], ['newagr']] },
  { id: 'theysign', steps: [['theirsign', 'issuelinks'], ['cplink', 'guestcode'], ['respond', 'filesig'], ['srvseal', 'sealtext', 'frozen'], ['copies', 'email'], ['obligations', 'renewal', 'calendar']] },
  { id: 'amend', steps: [['amend'], ['blanks'], ['readiness', 'approvals'], ['srvseal'], ['renewal', 'overview']] },
  { id: 'end', steps: [['served', 'renewact'], ['autorenew'], ['obdone'], ['decline', 'reopen'], ['archive', 'hold']] },
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
  req: ['request', 'kinds', 'reqfiles', 'review', 'suggest', 'rules', 'namedyes', 'decide', 'undoyes', 'approvalpaper', 'lookask'],
  /* the person working the contract: what they see and press */
  own: ['upload', 'book', 'draftcard', 'overview', 'constellation', 'papermark', 'obdesk', 'bell', 'home', 'negpage', 'startnego', 'here', 'follow',
    'editor', 'baton', 'askkeep', 'risklist', 'riskwalk', 'stands', 'dealpaper', 'onepaper', 'decidedsend', 'signtab', 'pad', 'calendar', 'desknight', 'insights', 'readings',
    'chasemany', 'copilotask', 'homepaper', 'explorer', 'chartread', 'chartsize', 'recipe', 'askpreview', 'verified', 'boardwords', 'packs',
    'phrasebook', 'boardtools', 'cardcheck', 'boardundo', 'honest', 'askchoice', 'citedoor', 'walkset', 'paperdesk', 'contracts', 'customers', 'cellfold',
    'readchips', 'nextq', 'newagr', 'essentials', 'tplform', 'outbyhand', 'amend', 'decline', 'reopen', 'archive', 'hold', 'served', 'obdone', 'inline'],
  /* HaTi itself: the readings, Copilot, the agents, the server's checks, the mail it sends */
  hati: ['docx', 'clauses', 'putguard', 'db', 'triage', 'arrivalowed', 'datedwin', 'brief', 'playbook', 'oblscan', 'risk', 'model', 'blanks', 'laneowner',
    'funnel', 'desk', 'ladder', 'kept', 'asks', 'payload', 'shares', 'linkcheck', 'email', 'turnmail', 'wordmark', 'whosemove', 'roundauto',
    'mailkey', 'respond', 'audit', 'apply', 'wordback', 'paperdrop', 'stale', 'webhook', 'answeronpaper', 'readiness', 'signgate', 'approvals', 'paperjobs', 'rulestep', 'seal',
    'frozen', 'obligations', 'renewal', 'reminders', 'lanes', 'agentlevel', 'linkkeep', 'renewact', 'renewprep', 'boardjudge', 'bookread',
    'boardmoved', 'looktell', 'draftreply', 'dataguide', 'analyst', 'story', 'quote', 'passroute', 'copilotdoors', 'factsheet', 'dealfacts',
    'boardmarks', 'pdf', 'intake', 'mailroom', 'wordfile', 'issuelinks', 'filesig', 'srvseal', 'copies', 'autorenew', 'leaveguard', 'discard',
    'freshen', 'sealtext'],
  /* the counterparty: their link, the code that proves it is them */
  them: ['cplink', 'guestcode', 'theirsign']
};
const BRAIN_FLOW_STAGES = {
  upload: ['create', 'create', 'create', 'create', 'prepare', 'prepare', 'prepare', 'prepare', 'prepare'],
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
  [/^js\/(dealstands|paperdesk)\.js$/, 'see'],
  /* the process review's two new files (4 Oct 2026) and the address book */
  [/^js\/(signgate|asks|sealtext)\.js$/, 'sign'],
  [/^js\/(intakelanes|participants)\.js$/, 'in'],
  [/^js\/(ai|aimd|aitrace|triage|playbook|metadata|metaclean|precedent|standards|draft|copilotacts)\.js$/, 'ai'],
  [/^js\/(docx|pdf|pdfrich|ocr|clausemodel|blanks|uploadblanks|richdoc|redline|templateform)\.js$/, 'read'],
  [/^js\/(signcheck|signapproval|approvals|signature|assurance|outside)\.js$|^js\/views\/(handover|approvalsview)\.js$/, 'sign'],
  [/^js\/(obligations|desknight|notice|payterms|runway)\.js$|^js\/views\/calendar\.js$/, 'time'],
  [/^js\/(wizard|intake|cohort|family)\.js$|^js\/views\/(intake|newstandard|templatebuilder|templatelib|migration|library)\.js$/, 'in'],
  [/^js\/(adviserlink)\.js$|^js\/views\/(portal|adviceportal)\.js$/, 'out']
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
