/* ============================================================
   JAMBO THE INSTRUCTOR — ROUND 1: "I'M NEW"
   (owner, 23 Nov 2026: "someone should simply say I am new and that how
   jambo knows"; the plan, end to end: docs/PLAN-jambo-instructor.md)
   ============================================================
   THE PERSON SAYS SO; JAMBO NEVER GUESSES. Typed in any Jambo box, "I'm
   new" (or "teach me", "show me around", "jag är ny"…) turns teaching ON for
   that person; "I know my way now" turns it OFF. It is their own preference
   (prefs.teach, PUT /api/me/prefs), so it follows them to every computer and
   phone and nobody else ever sees it.

   WHAT HE SAYS COSTS NOTHING. The welcome is HaTi's own words, never a model
   call: what HaTi is for in one breath, then three or four first steps that
   fit what this person may do (an editor uploads and drafts, a Viewer reads,
   an admin also adds the team). Each step is a chip that opens its Handbook
   chapter, the one book that is checked against the app (THE ONE DOOR: no
   second manual).

   THE WHOLE SENTENCE IS READ, NEVER A WORD IN IT. "I'm new to this NDA with
   Volvo" is a question about a contract, not a request to be taught, so a
   sentence counts only when nothing is left once greetings ("hi Jambo") and
   courtesy ("please", "thanks") are set aside.

   THE HINT. For a person's first TEACH_HINT_DAYS days, while they have said
   neither, the grey words in Jambo's empty box read "New here? Say "I'm new""
   (teachPh). No band, no banner: the box's own example words.

   ONE READER, EVERY BOX. Home's box (intelAsk), the shared door
   (caAskAnywhere), the conversation behind every other box (aiAskWords) and
   the Calendar's box (calBoxAsk) ask teachRead FIRST, before any reader that
   could take "new" for a new agreement. The answer is one turn of the one
   conversation (teachTurn). Reading never writes: teachRead and teachTurn
   only read; teachSay writes the preference and returns the turn.
   ============================================================ */

/* how long a new account sees the hint in the box (owner, 23 Nov 2026: "first few days") */
const TEACH_HINT_DAYS = 14;
const TEACH_STATES = ['on', 'off'];

/* the first steps offered, by what the person may do: [label key, Handbook chapter] (the first is the lead) */
const TEACH_STEPS = {
  editor: [['teach_c_upload', '2.2'], ['teach_c_new', '2.1'], ['teach_c_find', '0.6'], ['teach_c_board', '0.1']],
  viewer: [['teach_c_find', '0.6'], ['teach_c_read', '0.4'], ['teach_c_board', '0.1']],
  admin: [['teach_c_upload', '2.2'], ['teach_c_new', '2.1'], ['teach_c_find', '0.6'], ['teach_c_team', '7.1']],
};

const _thT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _thE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* the sentence, lower case, curly apostrophes made plain, punctuation gone; greetings and courtesy set aside */
const TEACH_LEAD = /^(?:(?:hi|hello|hey|hiya|jambo|hej|hejsan|hallå|ok|okay|so|well|um|erm|please|snälla)\s+)+/;
const TEACH_TAIL = /(?:\s+(?:please|thanks|thank you|jambo|snälla|tack))+$/;
function teachNorm(q){
  let t = String(q || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++){ const w = t; t = t.replace(TEACH_LEAD, '').replace(TEACH_TAIL, '').trim(); if (w === t) break; }
  return t;
}
const TEACH_ON_RE = new RegExp('^(?:' + [
  /* "I'm new", "I am new here", "I'm a new user", "I'm new to HaTi" */
  "(?:i'?m|i am|im) (?:a |quite |totally |brand )?new(?: (?:here|user|member|person|starter|joiner|to hati|to this|to the app|on hati|at this))*",
  "new (?:here|user|to hati)",
  /* "teach me", "show me around", "where do I start" */
  "teach me(?: (?:hati|how hati works|how this works|how to use hati|the ropes|the basics))?",
  "show me (?:around|the ropes|the basics|how hati works|how this works)",
  "give me a tour|take me on a tour|a tour please|tour",
  "(?:where|how) do i (?:start|begin|get started)",
  "(?:getting|get me) started|help me get started|how to get started",
  "(?:it'?s )?my first (?:day|time)(?: (?:here|using hati|on hati|with hati))?|first time (?:here|using hati|on hati)",
  "i (?:have|'ve) never used (?:hati|this) before|i don'?t know how (?:to use )?(?:hati|this) works?",
  /* svenska */
  "jag är (?:helt )?ny(?: (?:här|användare|på hati|i hati))?",
  "ny här|lär mig(?: hati)?|visa mig runt|var börjar jag|hur börjar jag|hur kommer jag igång|min första dag(?: här)?",
].join('|') + ')$');
const TEACH_OFF_RE = new RegExp('^(?:' + [
  "i know my way(?: around)?(?: now)?",
  "(?:i'?m|i am|im) not new(?: any ?more)?",
  "stop (?:teaching|the lessons|lessons|the tour|showing me around)(?: me)?",
  "no more (?:lessons|teaching|tips|tours)",
  "i'?ve got (?:it|this)(?: now)?|i got (?:it|this) now",
  /* svenska */
  "jag hittar(?: själv)?(?: nu)?|jag är inte ny(?: längre)?|sluta lära mig|inga fler lektioner",
].join('|') + ')$');

/* 'on' · 'off' · null: what the sentence asks, read whole */
function teachRead(q){
  const t = teachNorm(q); if (!t || t.length > 80) return null;
  if (TEACH_OFF_RE.test(t)) return 'off';
  if (TEACH_ON_RE.test(t)) return 'on';
  return null;
}

function _thUser(){ try { return (typeof currentUser === 'function') ? currentUser() : null; } catch (_){ return null; } }
/* this person's answer: 'on', 'off', or '' (never said) */
function teachState(u){
  const me = u || _thUser(); const v = me && me.prefs && me.prefs.teach;
  return TEACH_STATES.includes(v) ? v : '';
}
function teachOn(u){ return teachState(u) === 'on'; }
/* what the person may do, for the first steps: admin · editor · viewer (mayActOn, never the role read by hand) */
function teachSeat(u){
  const me = u || _thUser(); if (!me) return 'editor';
  if (me.role === 'admin') return 'admin';
  /* the app's one question (mayActOn); a host without it (the server, a test) reads the account's own seat */
  try { if (typeof mayActOn === 'function') return mayActOn(null, me) ? 'editor' : 'viewer'; } catch (_){}
  return me.role === 'viewer' ? 'viewer' : 'editor';
}
function teachChoices(u){
  return (TEACH_STEPS[teachSeat(u)] || TEACH_STEPS.editor)
    .map(([k, ch], i) => Object.assign({ label: _thT(k), nav: { k: 'chapter', chapter: ch } }, i === 0 ? { lead: true } : {}));
}
/* the turn, as HTML for either host's feed; reads only */
function teachTurn(q, u){
  const ask = teachRead(q); if (!ask) return null;
  if (ask === 'off') return { ask, html: `<div>${_thE(_thT('teach_off'))}</div>`, read: { cid: null, page: '', text: '' } };
  const seat = teachSeat(u);
  const lines = [_thT('teach_hello'), _thT(seat === 'viewer' ? 'teach_what_viewer' : 'teach_what'), _thT('teach_pick'), _thT('teach_how_off')];
  /* the line under it says where it came from: the Handbook, never "Read from the Board" (jamboReadStamp keeps a read it finds) */
  return { ask, html: lines.map(l => `<div style="margin-bottom:8px">${_thE(l)}</div>`).join(''), choices: teachChoices(u), read: { cid: null, page: '', text: _thT('jov5_hbk_src') } };
}
/* the person's answer kept on their own preferences (stPrefSet: the server when there is one, else this browser) */
function teachSet(v){
  if (!TEACH_STATES.includes(v)) return Promise.resolve(false);
  const u = _thUser(); if (!u || teachState(u) === v) return Promise.resolve(true);
  if (typeof stPrefSet === 'function') return Promise.resolve(stPrefSet('teach', v)).then(ok => { teachHintSweep(); return ok; });
  u.prefs = Object.assign({}, u.prefs || {}, { teach: v }); teachHintSweep();
  return Promise.resolve(true);
}
/* the one writer the boxes call: keeps the answer, gives back the turn to draw */
function teachSay(q){
  const turn = teachTurn(q); if (!turn) return null;
  try { teachSet(turn.ask); } catch (_){}
  return turn;
}

/* THE HINT: a person's first days, while they have said neither */
function teachHintOn(u){
  if (typeof window !== 'undefined' && window.PORTAL_MODE) return false;
  const me = u || _thUser(); if (!me || teachState(me)) return false;
  const at = Date.parse(String(me.createdAt || '')); if (!isFinite(at)) return false;
  return (Date.now() - at) < TEACH_HINT_DAYS * 86400000;
}
function teachPh(ph){ return teachHintOn() ? _thT('teach_hint_ph') : ph; }
/* once said, the hint leaves every box already drawn (the boxes draw their words once) */
function teachHintSweep(){
  if (typeof document === 'undefined' || teachHintOn()) return;
  const hint = _thT('teach_hint_ph');
  document.querySelectorAll('textarea[placeholder], input[placeholder]').forEach(el => {
    if (el.getAttribute('placeholder') !== hint) return;
    const back = el.id === 'igd-input' && typeof igAskPlaceholder === 'function' ? igAskPlaceholder()
      : el.id === 'jl-q' && typeof jlPagePh === 'function' ? jlPagePh() : _thT('jl_ph_any');
    el.setAttribute('placeholder', back); if (el.getAttribute('aria-label') === hint) el.setAttribute('aria-label', back);
  });
}

const TEACH_API = { TEACH_HINT_DAYS, TEACH_STATES, TEACH_STEPS, teachNorm, teachRead, teachState, teachOn, teachSeat, teachChoices, teachTurn, teachSet, teachSay, teachHintOn, teachPh, teachHintSweep };
if (typeof window !== 'undefined') Object.assign(window, TEACH_API);
if (typeof module !== 'undefined' && module.exports) module.exports = TEACH_API;
