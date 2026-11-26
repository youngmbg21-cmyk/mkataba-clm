/* HaTi — WALK ME THROUGH IT: the lesson's PLAN, read the same way on both hosts (owner, 26 Nov 2026: "Build all the
   possible charts and lessons but tie them to access"; the work order "Walk me through it").

   THE GOLDEN RULE: THE AI PLANS, HaTi SUPPLIES THE NUMBERS. Jambo's walk_through call carries a title, and for each
   step one sentence and WHICH reading to draw (a key from WALK_SHOWS) — never a number. This file checks that plan
   (walkPlanClean) against what the reader may see; a reading that cannot be drawn comes back as an error that says
   what does exist, so Jambo corrects himself and the person never sees a broken drawing. The browser
   (js/lesson.js) then fills each drawing from HaTi's own counting at the moment the lesson arrives, and keeps the
   figures with the message.

   Loaded by the server (require) and the browser (window). Plain data and pure functions only. */

const WALK_STEPS_MIN = 2, WALK_STEPS_MAX = 8, WALK_SAY_MAX = 400, WALK_TITLE_MAX = 80, WALK_NAMES_MAX = 6;

/* EVERY DRAWING A LESSON MAY SHOW. `of`: 'book' (every contract the reader may see) or 'contract' (the one named in
   contractId). `draw`: bars · ring · table · line · blocks. `money`: drawn only for a reader with money rights; for
   anyone else the step says so and draws `twin`, its count. `names`: what a later highlight may name. */
const WALK_SHOWS = [
  { k: 'stages',          of: 'book', draw: 'bars',  names: 'stage',    say: 'contracts by stage (Drafting, In review, Executed, Closed)' },
  { k: 'stages_value',    of: 'book', draw: 'bars',  names: 'stage',    money: true, twin: 'stages', say: 'value under contract by stage' },
  { k: 'book_figures',    of: 'book', draw: 'table', names: 'figure',   say: 'the Board\'s figures: live contracts, ending in 90 days, past their end date, duties overdue, waiting on you' },
  { k: 'ending_months',   of: 'book', draw: 'bars',  names: 'month',    say: 'signed agreements ending, month by month over the next 12 months' },
  { k: 'ending_value',    of: 'book', draw: 'bars',  names: 'month',    money: true, twin: 'ending_months', say: 'value ending, month by month over the next 12 months' },
  { k: 'renewals',        of: 'book', draw: 'table', names: 'contract', say: 'the next renewal decisions: which agreement, whether it renews by itself, decide by' },
  { k: 'waiting_us',      of: 'book', draw: 'table', names: 'contract', say: 'negotiations waiting on us, longest first' },
  { k: 'needs_you',       of: 'book', draw: 'table', names: 'row',      say: 'what needs the reader, as on the Board\'s Needs you' },
  { k: 'duties_split',    of: 'book', draw: 'ring',  names: 'side',     say: 'open duties due this month: ours against theirs' },
  { k: 'duties_months',   of: 'book', draw: 'bars',  names: 'month',    say: 'open duties: late, then due month by month over the next 6 months' },
  { k: 'duties_late',     of: 'book', draw: 'table', names: 'contract', say: 'late duties, the latest first' },
  { k: 'risk',            of: 'book', draw: 'ring',  names: 'risk',     say: 'contracts by risk: low, medium, high' },
  { k: 'risky',           of: 'book', draw: 'table', names: 'contract', say: 'the contracts with the highest risk' },
  { k: 'signed_months',   of: 'book', draw: 'line',  names: 'month',    say: 'contracts signed per month over the last 12 months' },
  { k: 'days_to_sign',    of: 'book', draw: 'line',  names: 'month',    say: 'average days from raised to signed, by the month signed, over the last 12 months' },
  { k: 'parties',         of: 'book', draw: 'bars',  names: 'party',    say: 'contracts by counterparty, the most first (top 7 and the others)' },
  { k: 'parties_value',   of: 'book', draw: 'bars',  names: 'party',    money: true, twin: 'parties', say: 'value by counterparty, the most first' },
  { k: 'streams',         of: 'book', draw: 'bars',  names: 'stream',   say: 'contracts by value stream' },
  { k: 'streams_value',   of: 'book', draw: 'bars',  names: 'stream',   money: true, twin: 'streams', say: 'value by value stream' },
  { k: 'approvals',       of: 'book', draw: 'table', names: 'contract', say: 'approvals and signatures waiting on the reader, longest wait first' },
  { k: 'pay_days',        of: 'book', draw: 'bars',  names: 'none',     say: 'payment days: how long customers take to pay us against how long we take to pay suppliers' },
  { k: 'playbook',        of: 'contract', draw: 'ring',   names: 'verdict', say: 'the contract\'s Playbook positions: met, not met, missing' },
  { k: 'findings',        of: 'contract', draw: 'bars',   names: 'finding', say: 'what Jambo found in the clauses: needs you, worth a look, noted' },
  { k: 'risks_here',      of: 'contract', draw: 'table',  names: 'row',     say: 'the contract\'s risks to look at, the worst first' },
  { k: 'before_sign',     of: 'contract', draw: 'table',  names: 'row',     say: 'what still stands before anyone signs it' },
  { k: 'changes',         of: 'contract', draw: 'blocks', names: 'none',    say: 'its negotiation: changes proposed, then accepted, rejected, countered and still open, one block at a time' },
  { k: 'open_changes',    of: 'contract', draw: 'table',  names: 'row',     say: 'its changes still open' },
  { k: 'contract_duties', of: 'contract', draw: 'table',  names: 'row',     say: 'its duties: what, whose, when' },
];
/* A step that changes the drawing just before it, instead of drawing a new one */
const WALK_OPS = [
  { k: 'highlight', say: 'light up named items on the drawing just before (names)' },
  { k: 'reveal',    say: 'on a blocks drawing, show up to block N (upto)' },
];
const WALK_SHOW_KEYS = WALK_SHOWS.map(s => s.k).concat(WALK_OPS.map(o => o.k));
const walkShowOf = k => WALK_SHOWS.find(s => s.k === k) || null;
const WALK_STAGE_WORDS = ['draft', 'drafting', 'under review', 'in review', 'review', 'signed', 'executed', 'declined', 'closed', 'waiting to sign'];
const WALK_FIXED_NAMES = {
  stage: WALK_STAGE_WORDS,
  risk: ['low', 'medium', 'high'],
  side: ['ours', 'theirs', 'we owe', 'they owe', 'us', 'them'],
  verdict: ['met', 'not met', 'missing', 'aligned', 'deviation', 'not applicable'],
  finding: ['needs you', 'worth a look', 'noted'],
  figure: ['live', 'live contracts', 'ending', 'ending in 90 days', 'past', 'past end date', 'overdue', 'duties overdue', 'waiting on you', 'your move'],
};

const WALK_TOOL_DESC = 'Show the person a short LESSON in the chat panel: 2 to 8 steps, each one or two plain sentences followed by a drawing HaTi builds from its OWN records (you never write the numbers that are drawn). Use it ONLY when the person asks to be walked through, taught, or shown step by step something about their contracts or data ("walk me through my renewals", "teach me where my money is", "explain this contract step by step"). NOT for how to use HaTi ("walk me through sending a contract" is the Handbook\'s), and not for an ordinary question. Read the facts first with the other tools so each sentence agrees with what will be drawn; say a number only when you fetched it. The first step must draw something; a highlight or reveal step changes the drawing just before it. Money drawings are shown only to people allowed to see money; for anyone else HaTi says so and draws the count instead. After it, end with nothing or one short sentence — the lesson is on screen; never repeat it.';
const WALK_TOOL_SCHEMA = { type: 'object', required: ['title', 'steps'], properties: {
  title: { type: 'string', description: 'The lesson\'s title, a few words in the person\'s language, e.g. "Your renewals, step by step".' },
  contractId: { type: 'string', description: 'Only for a lesson about ONE contract (playbook, findings, risks_here, before_sign, changes, open_changes, contract_duties): its id, e.g. MK-103.' },
  steps: { type: 'array', minItems: WALK_STEPS_MIN, maxItems: WALK_STEPS_MAX, description: 'The steps in order.',
    items: { type: 'object', required: ['say', 'show'], properties: {
      say: { type: 'string', description: 'One or two plain sentences, at most ' + WALK_SAY_MAX + ' characters, in the person\'s language.' },
      show: { type: 'object', required: ['what'], properties: {
        what: { type: 'string', enum: WALK_SHOW_KEYS, description: 'Which drawing: ' + WALK_SHOWS.map(s => s.k + ' = ' + s.say).join('; ') + '; ' + WALK_OPS.map(o => o.k + ' = ' + o.say).join('; ') + '.' },
        names: { type: 'array', items: { type: 'string' }, description: 'highlight only: the items to light, as they are named on the drawing (a stage, a counterparty, a month as YYYY-MM, a contract\'s name or id, a row\'s words).' },
        upto: { type: 'number', description: 'reveal only: show the blocks up to this one (1 = the first).' } } } } } } } };

const AI_WALK_RULE = 'A LESSON, ONLY WHEN ASKED FOR ONE: when the person asks to be walked through, taught, or shown step by step something about their contracts or their data ("walk me through my renewals", "teach me my book", "explain this negotiation step by step"), answer with the walk_through tool instead of a block of text: fetch the facts first, then 3 to 6 steps, each one or two plain sentences and the drawing that shows it; HaTi draws every number itself. After the lesson, end with nothing or one short sentence; never repeat it. For an ordinary question ("why is X high?", "change Y to 500") answer normally, never a lesson. "Walk me through" how to DO something in HaTi (send, sign, add, upload) is not a lesson: answer from the Handbook as usual.';

/* WORDS THAT ASK FOR A LESSON ABOUT ONE'S DATA — read by the boxes so no free reader (a page's name, the Handbook,
   the Board's own reader) takes the sentence first; the AI decides the rest. An ask about how to DO something in
   HaTi ("walk me through sending a contract") is not one: the Handbook keeps it. */
const WALK_LEAD_RE = /\b(walk me through|walk us through|take me through|talk me through|teach me|explain (?:to me )?step by step|show me step by step|step by step|gå igenom|visa steg för steg|steg för steg|lär mig|förklara steg för steg)\b/i;
const WALK_DO_RE = /\b(how (?:to|do i|can i|should i)|sending|send|signing a|sign a|adding|add a|uploading|upload|creating|create|drafting a|set(?:ting)? up|invite|inviting|använd|hur (?:gör|skickar|lägger)|skicka|ladda upp|skapa)\b/i;
const WALK_DATA_RE = /\b(my|our|this|the|mina|vår|våra|det här|detta)\b[\s\S]*\b(contracts?|agreements?|deals?|book|portfolio|renewals?|duties|duty|obligations?|risks?|negotiations?|changes|redlines|approvals?|streams?|counterpart(?:y|ies)|parties|customers|suppliers|value|money|figures|board|playbook|findings|signing|pipeline|avtal|förnyelser|åtaganden|risker|förhandling(?:en)?|godkännanden|värde|pengar)\b|\bwhat needs me\b|\bwhere (?:my|our) money\b/i;
function walkAsked(q){
  const t = String(q == null ? '' : q).trim(); if (!t || t.length > 300) return false;
  return WALK_LEAD_RE.test(t) && WALK_DATA_RE.test(t) && !WALK_DO_RE.test(t);
}

const _wTxt = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const _wNorm = s => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();

/* THE CHECK. `facts` comes from the host: { contract(id) → {id,name}|null, contracts: [{id,name}], parties: [names] }.
   Returns { plan } when it can be drawn, else { error } naming what exists — sent back to Jambo, never shown. */
function walkPlanClean(input, facts){
  const F = facts || {};
  const a = input && typeof input === 'object' ? input : {};
  const title = _wTxt(a.title, WALK_TITLE_MAX);
  if (!title) return { error: 'The lesson needs a title.' };
  const raw = Array.isArray(a.steps) ? a.steps : [];
  if (raw.length < WALK_STEPS_MIN || raw.length > WALK_STEPS_MAX) return { error: `A lesson has ${WALK_STEPS_MIN} to ${WALK_STEPS_MAX} steps; this one has ${raw.length}.` };
  let cid = _wTxt(a.contractId, 40);
  const needsOne = raw.some(s => { const w = walkShowOf(s && s.show && s.show.what); return w && w.of === 'contract'; });
  let named = null;
  if (needsOne){
    if (!cid) return { error: 'This lesson draws one contract (' + WALK_SHOWS.filter(s => s.of === 'contract').map(s => s.k).join(', ') + '): give its contractId. ' + walkSomeContracts(F) };
    named = typeof F.contract === 'function' ? F.contract(cid) : null;
    if (!named) return { error: `There is no contract ${cid} this person may see. ` + walkSomeContracts(F) };
    cid = String(named.id || cid);
  } else cid = '';
  const steps = []; let last = null;
  for (let i = 0; i < raw.length; i++){
    const s = raw[i] && typeof raw[i] === 'object' ? raw[i] : {};
    const say = _wTxt(s.say, WALK_SAY_MAX + 40).slice(0, WALK_SAY_MAX);
    if (!say) return { error: `Step ${i + 1} has no sentence.` };
    const what = _wTxt(s.show && s.show.what, 40);
    if (!WALK_SHOW_KEYS.includes(what)) return { error: `Step ${i + 1}: "${what || '(none)'}" is not a drawing. The drawings are: ${WALK_SHOW_KEYS.join(', ')}.` };
    if (what === 'highlight'){
      if (!last) return { error: `Step ${i + 1} highlights, but there is no drawing before it: the first step must draw something.` };
      const names = (Array.isArray(s.show.names) ? s.show.names : []).map(n => _wTxt(n, 80)).filter(Boolean).slice(0, WALK_NAMES_MAX);
      if (!names.length) return { error: `Step ${i + 1} highlights nothing: give names, as they are named on the "${last.k}" drawing.` };
      const bad = walkNamesBad(last, names, F);
      if (bad) return { error: `Step ${i + 1}: ${bad}` };
      steps.push({ say, op: { what, names } });
      continue;
    }
    if (what === 'reveal'){
      if (!last || last.draw !== 'blocks') return { error: `Step ${i + 1} reveals, but the drawing before it is not a blocks drawing (only "changes" is).` };
      const upto = Math.max(1, Math.min(5, Math.round(Number(s.show.upto) || 0)));
      if (!Number(s.show.upto)) return { error: `Step ${i + 1} reveals: give upto, the block to show up to (1 to 5).` };
      steps.push({ say, op: { what, upto } });
      continue;
    }
    last = walkShowOf(what);
    steps.push({ say, show: { what } });
  }
  if (!steps[0].show) return { error: 'The first step must draw something.' };
  return { plan: { title, ...(cid ? { contractId: cid, contractName: _wTxt(named && named.name, 120) } : {}), steps } };
}
function walkSomeContracts(F){
  const L = Array.isArray(F.contracts) ? F.contracts.slice(0, 8) : [];
  return L.length ? 'Contracts this person may see include: ' + L.map(c => `${c.id} (${_wTxt(c.name, 60)})`).join(', ') + '. Use search_contracts to find another.' : 'Use search_contracts to find the contract\'s id.';
}
/* the names a highlight gives must be ones the drawing can carry; the error says which exist */
function walkNamesBad(show, names, F){
  const kind = show.names;
  if (kind === 'none') return `the "${show.k}" drawing has nothing to highlight; draw another instead.`;
  const fixed = WALK_FIXED_NAMES[kind];
  if (fixed){
    const off = names.filter(n => !fixed.includes(_wNorm(n)));
    return off.length ? `${off.map(n => '"' + n + '"').join(', ')} is not on the "${show.k}" drawing. It names: ${fixed.join(', ')}.` : '';
  }
  if (kind === 'month'){
    const off = names.filter(n => !/^\d{4}-\d{2}$/.test(n) && _wNorm(n) !== 'late');
    return off.length ? `months are named as YYYY-MM (e.g. 2027-01)${show.k === 'duties_months' ? ', or "late"' : ''}; ${off.map(n => '"' + n + '"').join(', ')} is not one.` : '';
  }
  if (kind === 'party' && Array.isArray(F.parties)){
    const have = new Set(F.parties.map(_wNorm));
    const off = names.filter(n => !have.has(_wNorm(n)) && _wNorm(n) !== 'others');
    return off.length ? `${off.map(n => '"' + n + '"').join(', ')} is not a counterparty this person may see. Some that are: ${F.parties.slice(0, 10).join(', ')}.` : '';
  }
  if (kind === 'contract' && typeof F.contract === 'function'){
    const known = n => !!F.contract(n) || (Array.isArray(F.contracts) && F.contracts.some(c => _wNorm(c.name) === _wNorm(n)));
    const off = names.filter(n => !known(n));
    return off.length ? `${off.map(n => '"' + n + '"').join(', ')} is not a contract this person may see; name a contract by its name or id. ` + walkSomeContracts(F) : '';
  }
  return '';   /* streams and a row's words are matched where they are drawn */
}
/* what the conversation remembers it showed (the message's plain words, sent back with later turns) */
function walkSummary(plan, said){
  if (!plan) return '';
  const L = (said || plan.steps || []).map((s, i) => `${i + 1}) ${_wTxt(s.say, 200)}`).join(' ');
  return `[Walk-through shown: ${_wTxt(plan.title, WALK_TITLE_MAX)}. ${L}]`;
}
/* the tool's answer when the plan is good: the lesson is on screen */
const WALK_SHOWN_NOTE = 'The lesson is on screen. Do not repeat it. End with nothing or one short sentence.';

const WALK_API = { WALK_STEPS_MIN, WALK_STEPS_MAX, WALK_SAY_MAX, WALK_TITLE_MAX, WALK_SHOWS, WALK_OPS, WALK_SHOW_KEYS, WALK_FIXED_NAMES,
  WALK_TOOL_DESC, WALK_TOOL_SCHEMA, AI_WALK_RULE, WALK_SHOWN_NOTE, walkShowOf, walkAsked, walkPlanClean, walkNamesBad, walkSummary, walkSomeContracts };
if (typeof window !== 'undefined') Object.assign(window, WALK_API);
if (typeof module !== 'undefined' && module.exports) module.exports = WALK_API;
