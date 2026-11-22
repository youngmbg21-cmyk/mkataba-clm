/* ═══════════════════════════════════════════════════════════════════════════
   THE ENGINE BEHIND DISCOVER (js/views/reads.js). Once "Ask a column" (owner,
   20 Oct 2026): one question asked of the wording of many contracts. ASK A
   COLUMN ITSELF IS GONE (owner, 22 Nov 2026: "There is not asking a column
   again only the features related to discovery"): its form, its panel, its
   results table and the question columns on the Contracts list are deleted;
   every question is asked on Discover's New read.

   WHAT STAYS HERE: the state (AC), the read and its stop (askColAskHere →
   askColReadRun, askColStop, askColCarryOn), the plan (askColPlan: the first
   not yet read), the kept answers fetched free (askColLoad, askColLoadMany,
   POST /api/columns/answers), the summary and the reads (askColSummary,
   askColReads), keep and delete, the table writers (askColTableOf,
   askColCopyMany, askColXlsx and the xl* writer), the company facts (Settings,
   Key terms, a contract's arrival) and Unusual for you on the paper. Nothing
   is filed into any contract; the answers live in their own server tables.
   ═══════════════════════════════════════════════════════════════════════════ */

/* the owner's limit (20 Oct 2026) — the server holds the same number. THE THREAD (owner picked it, 28 Oct
   2026): a press reads 50 or 100 (AC_SIZES, the reader's last choice kept in this browser), so the wall is 100 */
const AC_MAX = 100;
const AC_SIZES = [50, 100];
function acSize(){ let v = 50; try { v = Number(localStorage.getItem('hati.v1.acSize')) || 50; } catch (_){ v = 50; } return AC_SIZES.includes(v) ? v : AC_SIZES[0]; }
/* how many answer columns stand beside the list at once */
const AC_COLS_MAX = 3;
/* STOP WHILE HE READS (owner, 26 Oct 2026: "need the ability to click on stop
   on the reading"). The read goes out in batches, so the count rises as answers
   land and Stop simply means "start no more": every answer already read is
   kept, and what is left is offered again with its own cost. */
const AC_BATCH = 10;

const AC = {
  asks: {},        // id → { id, question, name }
  ans: {},         // askId → { contractId → answer }
  asked: {},       // askId → Set of contract ids already looked up
  form: null,      // { question, name, askId, force, kept } while the question is open
  busy: null,      // { n } while Jambo reads
  count: null,     // { typed, stage, question, says, … } while Jambo asks about a counting question (round 3)
  counts: {},      // askId → { says, typed } — a read that answers a counting question is counted on its card
  chosen: null,    // { askId, cid } — the answer the panel explains
  team: null,      // the team's past questions (GET /api/columns)
  drawn: {},       // askId → true while its counts are drawn in the panel (Draw it)
  openQ: null,     // the question open in the panel (null: the last read; '': none); the rest fold
  qWalk: null,     // { askId, key, i } — the answer group whose quote is shown, and which contract
  moreOpen: null,  // askId whose More… list is open
  packs: [],       // the packs (GET /api/columns): Due diligence first
  summary: null,   // the kept questions, counted (GET /api/columns/summary)
  packRun: null,   // { packId, name, askIds } — the last pack asked, so its whole table can be opened
  stopped: null,   // { base, left, done, name } after Stop — what was kept, and the rest offered again
  discAll: false,  // the folded line pressed: the questions nobody kept are shown too
  others: 0,       // how many questions are not kept (the folded line's number)
  tableRisk: false,// the whole table's "Only at risk"
  reads: null,     // every press (GET /api/columns/reads): who read which batch, when
};
const _acE = s => (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const _acT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _acTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, { n, ...(v || {}) }) : k;

/* ---- WHO MAY ASK: anyone who can edit contracts (owner, 20 Oct 2026); the
   server's `editor` gate is the wall, this only greys the door with why ---- */
function askColMay(){
  /* greyed only where HaTi KNOWS a viewer is signed in: a paint before the
     person is known draws the live door, and the server refuses a viewer */
  const u = (typeof currentUser === 'function') ? currentUser() : null;
  return !u || u.role !== 'viewer';
}
function askColOn(){
  /* the Contracts place's List on a computer — the wall, Negotiations and a
     column too narrow to hold more columns carry none */
  return typeof regHome === 'function' && regHome() && typeof regScope === 'function' && regScope() !== 'negotiations'
    && typeof regState === 'function' && regState().show === 'list' && !(typeof regHomeNarrow === 'function' && regHomeNarrow());
}
function askColIdsUp(){
  if (!askColOn()) return [];
  const R = regState();
  return (Array.isArray(R.ask) ? R.ask : []).filter(id => AC.asks[id]).slice(0, AC_COLS_MAX);
}

/* THE CONTRACTS THE QUESTION GOES TO: the list as filtered, a code-named deal
   the reader is outside of left out (the server would refuse it), the first
   AC_MAX — and the cut is said in the form. */
function askColShown(){
  /* DISCOVER CHOOSES ITS OWN CONTRACTS (owner, 15 Nov 2026: "begin the discover process from the folders"): while the
     Discover page is in front and its New read has a choice, the read goes to exactly those, in the list's order */
  if (AC.scope && Array.isArray(AC.scope.ids) && typeof state !== 'undefined' && state.view === 'reads') return AC.scope.ids.slice();
  let cs = [];
  try { cs = (typeof regFiltered === 'function') ? regFiltered() : []; } catch (_){ cs = []; }
  return cs.filter(c => c && c.id && !c._codeNamed).map(c => String(c.id));
}

/* THE WORDING OF A PAPER DRAWN FROM ITS TEMPLATE lives only where it is
   drawn, so it travels with the ask, as the brief's does (contractPlainText);
   the server reads its stored body or upload first */
function askColTexts(ids){
  const out = {};
  for (const id of ids){
    const c = (typeof getContract === 'function') ? getContract(id) : null;
    if (!c || (typeof isUpload === 'function' && isUpload(c))) continue;
    let t = ''; try { t = (typeof contractPlainText === 'function') ? contractPlainText(c) : ''; } catch (_){ t = ''; }
    if (t && t.length >= 120) out[id] = t;
  }
  return out;
}

/* ---- THE NEXT ARE THE FIRST NOT YET READ, IN THE LIST'S ORDER (The thread, 28 Oct 2026) ----
   Every answer is kept, so a contract already read never costs again; the trap this replaces was a press
   that read "the first 50 shown" every time and never reached no. 51. A plan says, before any call: how
   many are shown, how many already read, which come next (the first `size` with no kept answer, in the
   order the list shows them), where they stand on that list (from–to), and what it costs. `force` (Ask
   again) reads the first `size` shown afresh. A pack's unread is a contract lacking ANY ticked question. */
function askColUnread(askIds, shown){
  const ids = (askIds || []).filter(Boolean);
  if (!ids.length) return shown.slice();
  return shown.filter(id => ids.some(a => !((AC.ans[a] || {})[id])));
}
function askColPlan(o){
  o = o || {};
  const shown = askColShown(), size = AC_SIZES.includes(Number(o.size)) ? Number(o.size) : acSize();
  const askIds = o.askIds || (o.askId ? [o.askId] : []);
  const unread = o.force ? shown.slice() : askColUnread(askIds, shown);
  const pick = unread.slice(0, size);
  const pos = pick.map(id => shown.indexOf(id) + 1);
  const from = pos.length ? Math.min(...pos) : 0, to = pos.length ? Math.max(...pos) : 0;
  return { shown: shown.length, read: shown.length - unread.length, unread: unread.length, size, pick, from, to,
    contiguous: !!pick.length && (to - from + 1 === pick.length), calls: pick.length, askIds, force: !!o.force };
}
/* one press, named so its batches share a record on the server (colRunRecord) */
function askColRunId(p){
  let hex = '';
  try { const a = new Uint8Array(8); crypto.getRandomValues(a); hex = [...a].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (_){ hex = Math.random().toString(16).slice(2, 18).padEnd(16, '0'); }
  return { id: 'cr_' + hex, from: p.from, to: p.to };
}
function askColWhereText(p){
  if (!p.pick.length) return '';
  return p.contiguous ? _acT('ac_th_where', { from: p.from, to: p.to }) : _acT('ac_th_where_gap', { n: p.pick.length, from: p.from });
}
/* THE COLUMN'S NAME, BEFORE THE READ (round 2): the server's own rule, twinned (colNameOf), so the form can say
   "Column: Rebate · Change" instead of asking for a name. Leading question and filler words go; the name runs to
   the first small word or comma, at most four words. */
const AC_NAME_LEAD = /^(how|what|which|who|when|where|is|are|does|do|did|can|could|will|would|should|has|have|the|a|an|any|our|their|this|these|that|it|there|much|many|either|each|contract|contracts|agreement|agreements|mention|mentions|include|includes|contain|contains|say|says|state|states|name|names|side|sides|party|parties)$/i;
const AC_NAME_STOP = /^(does|do|is|are|was|were|need|needs|to|and|or|of|for|in|on|at|by|with|under|if|when|each|either|it|its|the|a|an)$/i;
function askColNameOf(question){
  const words = String(question || '').trim().replace(/[?.!]+$/, '').split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  let i = 0; while (i < words.length - 1 && AC_NAME_LEAD.test(words[i].replace(/[,;:]$/, ''))) i++;
  const out = [];
  for (let j = i; j < words.length && out.length < 4; j++){
    const w = words[j], bare = w.replace(/[,;:]$/, '');
    if (out.length && AC_NAME_STOP.test(bare)) break;
    out.push(bare);
    if (bare !== w) break;
  }
  const n = (out.length ? out : words.slice(0, 4)).join(' ');
  return (n.charAt(0).toUpperCase() + n.slice(1)).slice(0, 40);
}
/* a pack's questions are the team's by their words; the asks they already are, where kept */
function askColPackAskIds(p, f){
  const key = q => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const all = Object.values(AC.asks);
  return (p.questions || []).filter((x, i) => !f || askColPackPicked(f, i)).map(x => (all.find(a => key(a.question) === key(x.question)) || {}).id).filter(Boolean);
}
/* a pack's unread: a question nobody has asked yet has been read for no contract, so every one shown is unread */
function askColPackAskIds_picked(p, f){ return (p.questions || []).filter((x, i) => !f || askColPackPicked(f, i)).length; }
function askColPackPlanIds(p, f){ const ids = askColPackAskIds(p, f); return ids.length === askColPackAskIds_picked(p, f) ? ids : []; }
/* ---- EVERY READ: the presses, fetched free, at most once a minute (the Reads page, the card's "by, when") ---- */
let _acReadsAt = 0, _acReadsP = null;
async function askColReads(force){
  if (!force && AC.reads && Date.now() - _acReadsAt < 60000) return AC.reads;
  if (_acReadsP) return _acReadsP;
  _acReadsP = (async () => { try { const r = await api('columns/reads'); AC.reads = r || { reads: [], arrivals: {} }; _acReadsAt = Date.now(); } catch (_){ AC.reads = AC.reads || { reads: [], arrivals: {} }; } finally { _acReadsP = null; } return AC.reads; })();
  return _acReadsP;
}

/* ---- THE KEPT ANSWERS, FETCHED FREE ---- */
async function askColLoad(askId, ids){
  const seen = AC.asked[askId] || (AC.asked[askId] = new Set());
  const want = ids.filter(id => !seen.has(id));
  if (!want.length) return false;
  want.forEach(id => seen.add(id));
  try {
    const r = await api('columns/answers', 'POST', { askId, ids: want, texts: askColTexts(want) });
    if (r && r.ask) AC.asks[askId] = r.ask;
    Object.assign(AC.ans[askId] || (AC.ans[askId] = {}), (r && r.answers) || {});
    return true;
  } catch (e){
    /* a question nobody keeps any more leaves the list quietly; anything else is said */
    if (e && e.status === 404){ askColDrop(askId); return true; }
    want.forEach(id => seen.delete(id));
    return false;
  }
}
/* MANY QUESTIONS, ONE LOOK (owner, 20 Nov 2026: "fix Discover"): Discover wanted every read's answers and sent one
   request per question, each carrying the drawn wording of every contract (askColTexts: a paper drawn and read in this
   browser, per contract, per question). Now one request asks for them all with NO wording; the server says which
   contracts it cannot check without their drawing (`need`), and only those are drawn, once, and sent in a second
   request. A question nobody keeps any more leaves quietly, as askColLoad's 404 does. */
async function askColLoadMany(askIds, ids){
  const ks = [...new Set((askIds || []).map(String))].filter(k => k && !AC.ans[k]);
  if (!ks.length || !ids.length) return false;
  const take = r => {
    (r && r.missing || []).forEach(k => askColDrop(k));
    Object.entries((r && r.byAsk) || {}).forEach(([k, v]) => {
      if (v && v.ask) AC.asks[k] = v.ask;
      Object.assign(AC.ans[k] || (AC.ans[k] = {}), (v && v.answers) || {});
      const seen = AC.asked[k] || (AC.asked[k] = new Set()); ids.forEach(id => seen.add(id));
    });
  };
  try {
    const r = await api('columns/answers', 'POST', { askIds: ks, ids });
    const need = ((r && r.need) || []).map(String);
    /* a second look that fails leaves those few unshown, never the rest of what came back */
    if (need.length) try {
      const r2 = await api('columns/answers', 'POST', { askIds: ks, ids: need, texts: askColTexts(need) });
      Object.entries((r2 && r2.byAsk) || {}).forEach(([k, v]) => { const into = (r && r.byAsk && r.byAsk[k]); if (into && v) Object.assign(into.answers || (into.answers = {}), v.answers || {}); });
    } catch (_){ /* said by the cells still empty */ }
    take(r);
    return true;
  } catch (_){ return false; }
}
async function askColTeam(){
  try { const r = await api('columns'); AC.team = (r && r.asks) || []; AC.packs = (r && r.packs) || []; (AC.team || []).forEach(a => { AC.asks[a.id] = AC.asks[a.id] || a; }); }
  catch (_){ AC.team = AC.team || []; }
  return AC.team;
}
/* ---- THE TABLE: a head and a cell per answer column ---- */
function askColWhen(at){
  const d = new Date(at || ''); if (!Number.isFinite(d.getTime())) return '';
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  try { return d.toLocaleString(loc, { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }); } catch (_){ return d.toISOString().slice(0, 16).replace('T', ' '); }
}
/* THE CLAUSE AN ANSWER CAME FROM, AS ITS NUMBER ("11.2", "IV", "B"): one
   reading for the cell's § chip and the panel's "Go to clause N" */
function askColClauseNo(a){
  return (String((a && a.clause) || '').match(/^\s*([0-9]+(?:\.[0-9]+)*|[IVXLC]+|[A-Z])\b/) || [])[1] || '';
}
/* THE DOT READS THE COMPANY'S RULE FIRST (Discover stage 2, owner 25 Oct 2026):
   outside it is a risk, inside it is usual; only where there is no rule does
   Jambo's own reading of the wording colour it. One reading for the cell, the
   legend, the counts and Show the N at risk.
   NO GREY (owner, 29 Oct 2026: "i hate grey so i want a colorful display"; picked the Legora way): a
   yes-or-no question colours itself — yes green, no blue (steel), neither a warning; a plain fact
   takes its answer's own colour (the biggest answers violet · pink · teal · cocoa · indigo, the rest
   ink), the same on every row, in the panel and on Reads; nothing found is an empty ring. Red stays
   "a risk, or outside our rule" alone. */
const AC_VALUE_TONES = ['v1', 'v2', 'v3', 'v4', 'v5'];
function askColBaseTone(a){
  if (!a || a.noWording || !a.found) return 'none';
  if (a.verdict === 'out') return 'ruby';
  if (a.verdict === 'in') return 'green';
  if (a.tone === 'concern') return 'ruby';
  if (a.tone === 'watch') return 'amber';
  if (a.yes === true) return 'green';
  if (a.yes === false) return 'steel';
  if (a.tone === 'good') return 'green';
  return 'fact';
}
function askColToneOf(a, askId){
  const t = askColBaseTone(a);
  return t === 'fact' ? askColValTone(askId, a) : t;
}
/* the same thing written the same way is one answer: case, a leading Yes/No and end marks set aside */
function askColValKey(a){
  return String((a && a.answer) || '').trim().toLowerCase().replace(/^(yes|no|ja|nej)\b[\s,.:;-]*/, '').replace(/[.\s]+$/, '').replace(/\s+/g, ' ') || '-';
}
/* THE ANSWERS, GROUPED (the Legora way, as drawn): one group per different answer over the list shown,
   biggest first; past AC_GROUPS_SHOWN they fold into "N other answers"; nothing found last. Read off
   AC.ans, never written; memoised per paint (askColGroupsForget). */
const AC_GROUPS_SHOWN = 4;
let _acGrp = {};
function askColGroupsForget(){ _acGrp = {}; _acValMap = null; }
function askColGroups(askId){
  const m = AC.ans[askId] || {}, shown = askColShown();
  const sig = Object.keys(m).length + ':' + shown.length + ':' + (shown[0] || '');
  const hit = _acGrp[askId]; if (hit && hit.sig === sig) return hit.g;
  const by = new Map(), nf = [];
  let total = 0;
  shown.forEach(id => { const a = m[id]; if (!a) return; total++;
    if (a.noWording || !a.found){ nf.push(id); return; }
    const k = askColValKey(a); let g = by.get(k);
    if (!g){ g = { key: k, label: String(a.answer || '').trim(), ids: [], a }; by.set(k, g); }
    g.ids.push(id); });
  const found = [...by.values()].sort((x, y) => (y.ids.length - x.ids.length) || x.label.localeCompare(y.label));
  const g = { top: found.slice(0, AC_GROUPS_SHOWN), rest: found.slice(AC_GROUPS_SHOWN), nf, total };
  _acGrp[askId] = { sig, g };
  return g;
}
/* A PLAIN FACT'S COLOUR IS ITS ANSWER'S, IN EVERY COLUMN (owner's pick, 29 Oct 2026: "Kenya is always the same
   colour"): the answers of every question on the list, counted together, biggest first, take the five colours in
   turn; the rest are ink. Off the list (Key terms, Reads) the same map is asked, else one fixed colour per answer. */
let _acValMap = null;
function askColValMap(askId){
  const ids = [...new Set(askColIdsUp().concat((AC.busy && AC.busy.asks) || [], askId ? [askId] : []))];
  const key = ids.join(',');
  if (_acValMap && _acValMap.key === key) return _acValMap.map;
  const n = new Map();
  ids.forEach(id => { const G = askColGroups(id); G.top.concat(G.rest).forEach(g => { if (askColBaseTone(g.a) === 'fact') n.set(g.key, (n.get(g.key) || 0) + g.ids.length); }); });
  const keys = [...n.keys()].sort((x, y) => (n.get(y) - n.get(x)) || x.localeCompare(y));
  const map = {}; keys.forEach((k, i) => { map[k] = AC_VALUE_TONES[i] || 'more'; });
  _acValMap = { key, map };
  return map;
}
function askColValTone(askId, a){
  const k = askColValKey(a), t = askColValMap(askId)[k]; if (t) return t;
  let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return AC_VALUE_TONES[h % AC_VALUE_TONES.length];
}
function askColAtRisk(askId){
  const m = AC.ans[askId] || {};
  return askColShown().filter(id => m[id] && askColToneOf(m[id]) === 'ruby');
}
/* the words the answer rests on, short, for the cell's second line (the Legora way: the answer, then where it was read) */
function askColQuoteShort(a){
  const q = String((a && a.quote) || '').trim();
  return q ? '“' + (q.length > 90 ? q.slice(0, 88).replace(/\s+\S*$/, '') + '…' : q) + '”' : '';
}
/* A COUNTING QUESTION IS NOT A COLUMN (owner, 26 Oct 2026: "why are the
   personal questions going to the company facts?"). "How many contracts have
   no redlines" asks about the reader's own book, which Jambo's box answers from
   the records, free; a column asks what ONE contract's wording says, of every
   contract in turn. Twinned on the server (COLUMN_PORTFOLIO_RE), which is the
   wall: nothing counting is ever kept as a question. */
const AC_PORTFOLIO_RE = /^\s*(how many\b|how much (of|do i|do we)\b|which (of|ones)\b|count\b|list\b|show me\b|who (has|have)\b)|\b(these|those|my|our|the) contracts\b/i;
function askColIsPortfolio(words){ return AC_PORTFOLIO_RE.test(String(words || '')); }
/* A QUESTION TURNED DOWN IS SHOWN HOW TO BE ASKED (owner, 15 Nov 2026: "if my question is phrased incorrectly, jambo
   panel kicks in to explain what I did wrong and gives me multiple alternative questions"). Read WITHOUT AI, by rule
   (the owner's yes: no Jambo call, so the panel may open by itself): the words that ask for a LIST are named (`hit`),
   and what is left is turned into questions ONE contract can answer. Words the rules cannot turn get `general` and no
   questions of their own — the page then offers its own examples; nothing is invented from the reader's words. */
const AC_RW_LEAD = /^\s*(?:please\s+)?(?:can you\s+|could you\s+)?(?:show me|list|count|find(?: me)?|give me|how many|how much of|which(?: of| ones)?|who (?:has|have))\s+(?:all\s+)?(?:of\s+)?(?:(?:(?:the|my|our|these|those)\s+)?(?:contracts?|agreements?|ones)\b\s*)?/i;
const AC_RW_JOIN = /^(?:that|which|where|with|who)\s+/i;
const AC_RW_SAY = /^(?:state[sd]?|says?|said|mention(?:s|ed)?|ha(?:ve|s)|contain(?:s|ed)?|include[sd]?|refers? to)\s+(?:that\s+)?/i;
const AC_RW_IS = /\b(?:is|are|was|were|will|must|shall|may|can|cannot|does|do)\b/i;
const AC_RW_END = /\b(?:end date|ends?|ending|expir\w*|termination date)\b/i;
const AC_RW_THEIRS = /(\b(?:do|are|have)\s+)?\b(?:these|those|my|our|the|all) contracts\b/i;
function askColReword(words){
  const w = String(words || '').trim().replace(/[?.!\s]+$/, '');
  const out = { yours: w, hit: '', alts: [], general: false };
  const add = (q, kind) => { q = String(q).replace(/\s+/g, ' ').trim(); q = q.charAt(0).toUpperCase() + q.slice(1);
    if (q.length >= 8 && !askColIsPortfolio(q) && !out.alts.some(a => a.q.toLowerCase() === q.toLowerCase())) out.alts.push({ q, kind }); };
  const lead = AC_RW_LEAD.exec(w);
  if (lead){
    let rest = w.slice(lead[0].length), cut = lead[0].length;
    const join = AC_RW_JOIN.exec(rest); if (join){ rest = rest.slice(join[0].length); cut += join[0].length; }
    const say = AC_RW_SAY.exec(rest); if (say) rest = rest.slice(say[0].length);
    out.hit = w.slice(0, cut).trim();
    const t = rest.trim(), with_ = !!(join && /^with/i.test(join[0])) || /who (?:has|have)\s*$/i.test(lead[0].trim());
    if (t && AC_RW_END.test(t)){
      const y = (t.match(/\b(?:19|20)\d\d\b/g) || []);
      if (y.length >= 2) add(`Does this contract end between ${y[0]} and ${y[1]}?`, 'yesno');
      else if (y.length === 1) add(`Does this contract end in ${y[0]}?`, 'yesno');
      add('On what date does this contract end?', 'date'); add('In which year does this contract end?', 'year');
    } else if (t && (say || with_ || /^(?:the|a|an|any|some|every)\s/i.test(t))){
      add(AC_RW_IS.test(t) ? `Does this contract state that ${t}?` : `Does this contract mention ${t}?`, 'yesno');
      const topic = t.split(AC_RW_IS)[0].trim(); if (topic) add(`What does this contract say about ${topic}?`, 'say');
    } else if (t){
      const be = /^(?:is|are)\s+(.+)$/i.exec(t);
      add(be ? `Is this contract ${be[1]}?` : `Does this contract ${t}?`, 'yesno');
    }
  } else {
    const m = AC_RW_THEIRS.exec(w);
    if (m){ out.hit = m[0].trim();
      add(w.replace(AC_RW_THEIRS, (all, v) => (v ? ({ do: 'does', are: 'is', have: 'has' })[v.trim().toLowerCase()] + ' ' : '') + 'this contract') + '?', /^(?:do|are|have|does|is|has)\b/i.test(w) ? 'yesno' : 'say'); }
  }
  if (!out.alts.length) out.general = true;
  return out;
}
/* ---- JAMBO'S PANEL ---- */
/* ---- THE READING DESK (the owner picked it, 28 Oct 2026) ----
   While a read runs the card shows, top to bottom: the ten in flight ("Reading
   HC-1061 to HC-1070"); THE DESK, one answer that has REALLY come back — the
   contract, its ref and clause, the words Jambo quoted set in the paper's
   face, and the answer with its light; THE STACK of the last three the desk
   turned past; the bar; a foot line of counts with Stop. HaTi sends ten at a
   time and all ten answers land together, so the desk never pretends to know
   which single contract is being read: it turns through the ten that LAST
   came back, one every AC_DESK_TURN_MS, and only the desk and the stack are
   repainted on a turn. Under less motion nothing slides or spins: the desk
   just changes. Everything is read off AC.busy, AC.ans and AC.asks. */
const AC_DESK_TURN_MS = 1400, AC_DESK_SLIDE_MS = 350, AC_DESK_STACK = 3;
/* the answer the desk shows now, and the three it turned past (newest first) */
/* THE DESK IS A QUEUE OF ANSWERS THAT LANDED (28 Oct 2026): the first is laid down the moment it arrives;
   each turn takes the next; when answers come faster than the desk turns it keeps pace by passing over the
   oldest waiting (they are in their cells on the list), never more than AC_DESK_BEHIND behind */
const AC_DESK_BEHIND = 3, AC_DESK_LINGER_MS = 5000;
function askColDeskAt(b){ return (b && b.cur) || null; }
function askColDeskPast(b){ return b ? (b.seen || []).slice(-AC_DESK_STACK).reverse() : []; }
function askColDeskAdd(b, askId, cid){
  if (!b || !askId || !cid || !b.queued || b.queued.has(cid) || !(AC.ans[askId] || {})[cid]) return;
  b.queued.add(cid);
  const item = { askId, cid };
  if (!b.cur){ b.cur = item; b.curAt = Date.now(); askColDeskPaint(true); }
  else b.queue.push(item);
}
/* the foot's counts move with every answer, without repainting the card */
function askColDeskFootPaint(){
  const b = AC.busy; if (!b || typeof document === 'undefined') return;
  const el = document.querySelector('#ac-form .ac-desk-foot .ac-busy'); if (el) el.textContent = askColDeskFootText(b);
  const bar = document.querySelector('#ac-form .ac-prog > i'); if (bar) bar.style.width = (b.total ? Math.round(b.done / b.total * 100) : 0) + '%';
}
/* a cell fills as its answer lands; the list is repainted at most every 400ms however fast they come */
let _acListT = 0;
function askColListSoon(now){
  _acDiscoverLive(now);
  if (typeof regRepaint !== 'function') return;
  askColGroupsForget();
  if (now){ if (_acListT){ clearTimeout(_acListT); _acListT = 0; } _acRegRepaint(); return; }
  if (_acListT) return;
  _acListT = setTimeout(() => { _acListT = 0; _acRegRepaint(); }, 400);
}
/* bounded: until the queue is shown and the last answer has stood one turn, or Stop, or AC_DESK_LINGER_MS */
function askColDeskDrain(){
  const t0 = Date.now();
  return new Promise(done => {
    const look = () => { const b = AC.busy;
      if (!b || b.stop || Date.now() - t0 > AC_DESK_LINGER_MS || typeof document === 'undefined' || !document.querySelector('#ac-form [data-ac-desk]')
        || (!b.queue.length && (!b.cur || Date.now() - b.curAt >= AC_DESK_TURN_MS))) return done();
      setTimeout(look, 150); };
    look();
  });
}
function askColDeskWord(a){ return a.noWording ? _acT('ac_no_wording') : a.found ? [a.answer, a.detail].filter(Boolean).join(', ') : _acT('ac_not_found'); }
/* the agreement, then the other side where the name does not carry it ("Supply Agreement · Kabras Sugar"), as the list's own row reads */
function askColDeskNameOf(cid){
  const c = (typeof getContract === 'function') ? getContract(cid) : null;
  if (!c) return cid;
  let n = '';
  try { if (typeof regShortTitle === 'function') n = String(regShortTitle(c) || ''); } catch (_){ n = ''; }
  n = n || String(c.name || c.counterparty || cid);
  const party = String(c.counterparty || '').trim();
  return (party && !n.toLowerCase().includes(party.toLowerCase())) ? `${n} · ${party}` : n;
}
function askColDeskHtml(b){
  const at = askColDeskAt(b), a = at ? (AC.ans[at.askId] || {})[at.cid] : null;
  if (!a) return `<div class="ac-desk-empty">${_acE(_acT('ac_desk_first'))}</div>`;
  const c = (typeof getContract === 'function') ? getContract(at.cid) : null;
  const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : at.cid;
  const num = askColClauseNo(a), q = AC.asks[at.askId] || {};
  const meta = [ref, num ? '§ ' + num : '', (b.asks && b.asks.length > 1) ? q.name : ''].filter(Boolean).join(' · ');
  const quote = (a.quote && !a.noWording && a.found) ? `<blockquote class="ac-desk-q">“${_acE(a.quote)}”</blockquote>`
    : `<div class="ac-desk-noq">${_acE(a.noWording ? _acT('ac_no_wording') : !a.found ? _acT('ac_not_found') : _acT('ac_no_quote'))}</div>`;
  return `<div class="ac-desk-in" data-ac-desk-cid="${_acE(at.cid)}"><div class="ac-desk-who"><b class="ac-desk-nm">${_acE(askColDeskNameOf(at.cid))}</b><span class="ac-meta">${_acE(meta)}</span></div>
    ${quote}<span class="ac-ans tone-${askColToneOf(a, at.askId)}"><i></i><b>${_acE(askColDeskWord(a))}</b></span></div>`;
}
function askColStackHtml(b){
  const past = askColDeskPast(b);
  const keep = Array.from({ length: Math.max(0, AC_DESK_STACK - past.length) }, () => '<li class="ac-stack-r is-keep" aria-hidden="true"></li>').join('');
  return past.map(x => { const a = (AC.ans[x.askId] || {})[x.cid]; if (!a) return '';
    return `<li class="ac-stack-r"><span class="ac-ans tone-${askColToneOf(a, x.askId)}"><i></i></span><span class="ac-stack-nm">${_acE(askColDeskNameOf(x.cid))}</span><span class="ac-stack-an">${_acE(askColDeskWord(a))}</span></li>`; }).join('') + keep;
}
/* at risk so far: the same reading the head's count uses (askColToneOf === 'ruby'), over the contracts done */
function askColDeskRisk(b){
  const id = b && b.askId; if (!id) return 0;
  const m = AC.ans[id] || {};
  return (b.doneIds || []).filter(cid => m[cid] && askColToneOf(m[cid]) === 'ruby').length;
}
function askColDeskFootText(b){
  if (b.stop) return _acT('ac_stopping');
  return _acTn('ac_desk_foot', b.total, { done: b.done, risk: b.done ? _acTn('ac_desk_risk', askColDeskRisk(b)) : '', calls: _acTn('ac_n_calls', b.calls || 0) }).replace(/ · (?= · )/, '').replace(/ ·  · /g, ' · ').replace(/\s*·\s*$/, '');
}
/* a batch is whole: every answer of it that is not yet on the desk joins the queue (the plain answer's way) */
function askColDeskLanded(b, part, lead){
  if (!b) return;
  b.askId = b.askId || lead || null;
  if (lead) part.forEach(cid => askColDeskAdd(b, lead, cid));
}
function askColDeskStart(){ askColDeskStop(); AC.deskTimer = setInterval(askColDeskTick, AC_DESK_TURN_MS); }
function askColDeskStop(){ if (AC.deskTimer){ clearInterval(AC.deskTimer); AC.deskTimer = null; } }
function askColDeskTick(){
  const b = AC.busy;
  if (!b || typeof document === 'undefined' || !document.querySelector('#ac-form [data-ac-desk]')){ if (!b) askColDeskStop(); return; }
  if (!b.queue.length) return;
  while (b.queue.length > AC_DESK_BEHIND) b.queue.shift();
  if (b.cur) b.seen.push(b.cur);
  b.cur = b.queue.shift(); b.curAt = Date.now();
  askColDeskPaint(true);
}
/* only the desk and the stack repaint on a turn; the slide is the browser's own, off under less motion */
function askColDeskPaint(turned){
  const b = AC.busy; if (!b || typeof document === 'undefined') return;
  const desk = document.querySelector('#ac-form [data-ac-desk]'), stack = document.querySelector('#ac-form [data-ac-stack]');
  if (!desk) return;
  desk.innerHTML = askColDeskHtml(b);
  if (stack) stack.innerHTML = askColStackHtml(b);
  const still = (typeof listGlideOff === 'function') ? listGlideOff() : true;
  const inner = desk.firstElementChild;
  if (turned && !still && inner && typeof inner.animate === 'function'){
    try { inner.animate([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: AC_DESK_SLIDE_MS, easing: 'ease-out' }); } catch (_){}
  }
}

/* ---- DISCOVER (stage 3, owner 25 Oct 2026: "Discover", in Jambo's panel beside
   the Contracts list) — the questions the team keeps, counted for the contracts
   this person may see, free; a press brings a question's column onto the list;
   the packs; and the one door to a new question. Drawn under his greeting when
   nothing is chosen, and under the columns' cards. ---- */
let _acSumAt = 0, _acSumAll = 0;
async function askColSummary(force){
  const want = AC.discAll ? 1 : 0;
  if (!force && want === _acSumAll && Date.now() - _acSumAt < 60000 && AC.summary) return AC.summary;
  _acSumAt = Date.now(); _acSumAll = want;
  try {
    const r = await api('columns/summary' + (want ? '?all=1' : ''));
    AC.summary = (r && r.asks) || []; AC.others = (r && r.others) || 0;
    (AC.summary || []).forEach(a => { AC.asks[a.id] = Object.assign(AC.asks[a.id] || {}, a); });
  }
  catch (_){ AC.summary = AC.summary || []; }
  if (!AC.packs.length) await askColTeam();
  return AC.summary;
}
/* KEEP IT, TAKE IT OFF, OR FORGET IT ALTOGETHER */
async function askColKeep(askId, on){
  try {
    const r = await api('columns/' + encodeURIComponent(askId) + '/keep', 'POST', { kept: !!on });
    if (r && r.ask) AC.asks[askId] = Object.assign(AC.asks[askId] || {}, r.ask);
    if (typeof toast === 'function') toast(_acT(on ? 'ac_kept_on' : 'ac_kept_off', { name: (r && r.ask && r.ask.name) || '' }), 'ok');
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  _acSumAt = 0; await askColSummary(true); askColPaintPanel();
}
async function askColDelete(askId){
  const a = (AC.summary || []).find(x => x.id === askId) || AC.asks[askId] || {};
  const yes = (typeof confirmDialog === 'function')
    ? await confirmDialog({ title: _acT('ac_del_title', { name: a.name || '' }), message: _acT('ac_del_body'), confirmLabel: _acT('ac_del'), danger: true })
    : true;
  if (!yes) return;
  try {
    await api('columns/' + encodeURIComponent(askId), 'DELETE');
    askColDrop(askId); delete AC.ans[askId]; delete AC.asked[askId]; delete AC.asks[askId];
    if (typeof toast === 'function') toast(_acT('ac_deleted', { name: a.name || '' }), 'ok');
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  _acSumAt = 0; await askColSummary(true);
  _acRegRepaint();
  askColPaintPanel(); askColFactsPanelPaint();
}
/* CHOOSE WHICH OF THE PACK TO RUN (owner, 26 Oct 2026: "I should be able to
   choose which of the available company facts I want to run if I only want to
   run 3 out of the 5"). All are ticked to begin with; the cost and the button
   follow the ticks, and with none ticked the button greys with why. */
function askColPackPicked(f, i){ return !f.drop || !f.drop.has(i); }
/* the one button's words, shared with the Reads page: the rest when it fits a press, else the next batch and what is left after */
function askColNextWords(left, size){
  const sz = Number(size) || acSize();
  if (left <= sz) return { n: left, label: _acT('ac_th_btn_rest', { n: left, calls: _acTn('ac_n_calls', left) }), rest: true };
  return { n: sz, label: _acT('ac_th_btn_more', { n: sz, after: left - sz }), rest: false };
}
/* ---- THE COMPANY'S FACTS (stage 4, owner 25 Oct 2026: any admin switches one on) ---- */
async function askColFactSet(askId, on){
  try {
    const r = await api('columns/' + encodeURIComponent(askId), 'PUT', { fact: !!on });
    if (r && r.ask) AC.asks[askId] = Object.assign(AC.asks[askId] || {}, r.ask);
    _acSumAt = 0; await askColSummary(true);
    if (typeof toast === 'function') toast(_acT(on ? 'ac_fact_kept' : 'ac_fact_dropped', { name: (r && r.ask && r.ask.name) || '' }), 'ok');
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  askColPaintPanel(); askColFactsPanelPaint();
}
async function askColRuleSet(askId, rule){
  try {
    const r = await api('columns/' + encodeURIComponent(askId), 'PUT', { rule: String(rule || '') });
    if (r && r.ask) AC.asks[askId] = Object.assign(AC.asks[askId] || {}, r.ask);
    delete AC.ans[askId]; delete AC.asked[askId];
    _acSumAt = 0; await askColSummary(true);
    if (typeof toast === 'function') toast(_acT('fa_rule_saved'), 'ok');
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  askColFactsPanelPaint();
}
function askColFactsOn(){ return (AC.summary || []).filter(a => a.fact); }
/* ON ARRIVAL: a new contract is read once for every fact that is on, through the one route (cached per wording).
   Not a viewer's (the server refuses); not a private stream's contract, which is read only on a press. */
let _acFactErr = '';
async function askColFactsArrive(c){
  if (!c || !c.id || !askColMay()) return false;
  if (typeof jamboOnPress === 'function' && jamboOnPress(c)) return false;
  await askColSummary();
  const facts = askColFactsOn(); if (!facts.length) return false;
  try {
    await api('ai/column', 'POST', { questions: facts.map(a => ({ question: a.question, name: a.name })), ids: [String(c.id)], texts: askColTexts([String(c.id)]) });
    _acFactErr = ''; _acSumAt = 0;
    return true;
  } catch (e){ _acFactErr = (e && (e.needsKey || e.kind === 'noKey')) ? _acT('ac_nokey') : ((e && e.message) || ''); return false; }
}
/* the Settings panel: the kept questions, their rules and switches, the cost per arrival */
/* THE QUESTIONS STAND HERE, EACH WITH ITS SWITCH (owner, 26 Oct 2026: "you are
   hiding the 5 company facts which were there before … They should be there and
   you can toggle them on or off and also add new ones if you would like"). This
   REPLACES the facts-only page of earlier the same day, which listed a fact only
   once it was already on and so showed an empty page with nothing to press.
   What the page lists is the questions the team KEEPS — which are questions of
   the WORDING by the time they reach here, since a counting question is turned
   away at the server and never kept (the owner's note 5 of 26 Oct, still true).
   The switch says whether the question is read on every contract that arrives;
   off leaves it on the list, costing nothing. */
function askColFactsPanelHtml(){
  const rows = (AC.summary || []), on = rows.filter(a => a.fact).length;
  const total = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts.filter(c => c && !c.archived && !(typeof jamboOnPress === 'function' && jamboOnPress(c))).length : 0;
  const n = Math.min(total, AC_MAX);
  const row = a => `<tr data-fa-row="${_acE(a.id)}"><td><b>${_acE(a.name)}</b><span class="fa-q">${_acE(a.question)}</span></td>
    <td><input class="ac-in fa-rule" data-fa-rule="${_acE(a.id)}" maxlength="200" value="${_acE(a.rule || '')}" placeholder="${_acE(_acT('fa_rule_ph'))}" aria-label="${_acE(_acT('fa_h_rule') + ': ' + a.name)}"></td>
    <td class="fa-n">${a.read ? _acE(`${a.found} / ${a.read}`) : '—'}</td>
    <td><button type="button" class="fa-tog${a.fact ? ' on' : ''}" data-fa-tog="${_acE(a.id)}" aria-pressed="${a.fact ? 'true' : 'false'}" aria-label="${_acE(_acT('fa_h_on') + ': ' + a.name)}"></button></td></tr>`;
  /* ADD A NEW ONE: a question joins this list by being kept, beside the
     Contracts list — the one door, improved rather than doubled. */
  const add = `<div class="fa-add"><div class="ac-l">${_acE(_acT('fa_add_h'))}</div>
    <p class="st-note">${_acE(_acT('fa_add_where'))}</p>
    <div class="ac-chips ac-next"><button type="button" class="jb-chip" data-fa-go>${_acE(_acT('fa_add_go'))}</button></div>
    <p class="st-note">${_acE(_acT('fa_add_sub'))}</p></div>`;
  return `${rows.length ? `<div class="fa-scroll"><table class="fa-t"><thead><tr><th>${_acE(_acT('fa_h_fact'))}</th><th>${_acE(_acT('fa_h_rule'))}</th><th>${_acE(_acT('fa_h_ans'))}</th><th>${_acE(_acT('fa_h_on'))}</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>` : `<p class="st-note">${_acE(_acT('fa_none_kept'))}</p>`}
    ${add}
    <p class="st-note fa-cost">${_acE(on ? _acTn('fa_cost', on) : _acT('fa_cost_none'))}</p>
    ${_acFactErr ? `<p class="st-note fa-err">${_acE(_acT('fa_last_err', { msg: _acFactErr }))}</p>` : ''}
    ${on && n ? `<div class="ac-acts"><button type="button" class="ui-btn ui-btn-sm" data-fa-readall>${_acE(_acT(n < total ? 'fa_read_all_capped' : 'fa_read_all', { n, total, calls: _acTn('ac_n_calls', n) }))}</button></div>` : ''}`;
}
function askColFactsPanelPaint(){
  const host = (typeof document !== 'undefined') ? document.getElementById('fa-panel') : null; if (!host) return;
  host.innerHTML = askColFactsPanelHtml();
}
async function askColFactsPanelWire(){ askColFactsPanelPaint(); await askColSummary(true); askColFactsPanelPaint(); }
async function askColFactsReadAll(){
  const facts = askColFactsOn(); if (!facts.length) return;
  const ids = state.contracts.filter(c => c && !c.archived && !(typeof jamboOnPress === 'function' && jamboOnPress(c))).map(c => String(c.id)).slice(0, AC_MAX);
  try {
    const r = await api('ai/column', 'POST', { questions: facts.map(a => ({ question: a.question, name: a.name })), ids, texts: askColTexts(ids) });
    if (typeof toast === 'function'){ toast(_acT('fa_read_done', { calls: _acTn('ac_n_calls', (r && r.calls) || 0) }), 'ok'); if (r && r.capped) toast(_acT('ac_capped', r.capped), 'warn'); }
  } catch (e){ if (typeof toast === 'function') toast(e && (e.needsKey || e.kind === 'noKey') ? _acT('ac_nokey') : _acT('ac_err', { msg: (e && e.message) || '' }), 'err'); }
  _acSumAt = 0; await askColSummary(true); askColFactsPanelPaint();
}
function askColFactsState(){
  const n = askColFactsOn().length;
  return { dot: n ? 'ok' : 'off', text: `${_acT('fa_title')} — ${n ? _acTn('fa_state_on', n) : _acT('fa_state_off')}` };
}
/* ---- KEY TERMS CARRY THE COMPANY'S FACTS: Term · What it says · Where on the paper; read free ---- */
const _acKt = {};
function askColFactsKtHtml(c){
  const id = String(c.id), got = _acKt[id];
  if (!got){ askColFactsKtLoad(id); return ''; }
  if (!got.length) return '';
  const row = f => {
    const a = f.answer, no = a ? askColClauseNo(a) : '';
    const says = !a ? _acT('fa_kt_unread') : a.noWording ? _acT('ac_no_wording') : a.found ? [a.answer, a.detail].filter(Boolean).join(', ') : _acT('ac_not_found');
    const tone = a ? askColToneOf(a, f.ask && f.ask.id) : 'none';
    return `<tr><th scope="row">${_acE(f.ask.name)}</th><td><span class="ac-ans tone-${tone}"><i></i>${_acE(says)}</span>${f.stale ? `<small class="ac-sub">${_acE(_acT('fa_kt_stale'))}</small>` : ''}</td>
      <td>${no ? `<b>${_acE(_acT('fa_kt_where', { n: no }))}</b> ` : ''}${a && a.found && a.quote ? `<span class="fa-kt-q">${_acE(askColQuoteShort(a))}</span>` : ''}</td></tr>`;
  };
  return `<div class="fa-kt"><div class="fa-kt-h">${_acE(_acT('fa_kt_h'))}</div><table class="pd-og pd-kt-t fa-kt-t">${got.map(row).join('')}</table></div>`;
}
async function askColFactsKtLoad(id){
  if (_acKt[id] === null) return;
  _acKt[id] = null;
  let facts = [];
  try { const r = await api('columns/facts/' + encodeURIComponent(id)); facts = (r && r.facts) || []; } catch (_){ facts = []; }
  _acKt[id] = facts;
  const host = (typeof document !== 'undefined') ? document.querySelector(`[data-ac-facts-for="${CSS.escape(id)}"]`) : null;
  if (host) host.innerHTML = askColFactsKtHtml({ id });
  setTimeout(() => { delete _acKt[id]; }, 60000);
}
/* ---- UNUSUAL FOR YOU (stage 6): one line on the Dossier's "Jambo read" card, only when a
   company fact's answer stands apart from the same kind of contract in this book; counted, free ---- */
const _acOdd = {};
function askColOddHtml(c){
  const id = String(c.id), got = _acOdd[id];
  if (got === undefined){ askColOddLoad(id); return `<div class="ac-odd" data-ac-odd-for="${_acE(id)}"></div>`; }
  return `<div class="ac-odd" data-ac-odd-for="${_acE(id)}">${askColOddInner(id)}</div>`;
}
function askColOddInner(id){
  const got = _acOdd[id]; if (!got || !got.lines || !got.lines.length) return '';
  const kind = String(got.kind || '').toLowerCase();
  return got.lines.slice(0, 2).map(l => `<div class="pd-gl-row ds-row ac-odd-row"><i class="ac-lg-amber" aria-hidden="true"></i><span class="ac-odd-t"><b>${_acE(_acT('ac_odd_h'))}</b> ${_acE(_acT('ac_odd_line', { fact: l.fact, mine: l.mine, n: l.usualN, of: l.others, kind, usual: l.usual }))}</span><button type="button" class="pd-go ds-go" data-ac-odd-show="${_acE(id)}:${_acE(l.askId)}">${_acE(_acTn('ac_odd_show', l.ids.length))}</button></div>`).join('');
}
async function askColOddLoad(id){
  if (_acOdd[id] === null) return;
  _acOdd[id] = null;
  let r = null; try { r = await api('columns/unusual/' + encodeURIComponent(id)); } catch (_){ r = null; }
  _acOdd[id] = r || { lines: [] };
  const host = (typeof document !== 'undefined') ? document.querySelector(`[data-ac-odd-for="${CSS.escape(id)}"]`) : null;
  if (host) host.innerHTML = askColOddInner(id);
  setTimeout(() => { delete _acOdd[id]; }, 60000);
}
function askColOddShow(key){
  const [id, askId] = String(key).split(':');
  const l = ((_acOdd[id] || {}).lines || []).find(x => x.askId === askId); if (!l) return;
  if (typeof setView === 'function') setView('register');
  if (typeof regShowOnly === 'function') regShowOnly(l.ids, _acT('ac_odd_label', { fact: l.fact, usual: l.usual }));
}
/* the lander a watch's press uses: the contract on Home's paper, then its sentence lit (bounded wait) */
function askColLandOn(cid, quote){
  if (typeof regOpenContract === 'function') regOpenContract(cid);
  if (!quote || typeof igQuoteGo !== 'function') return true;
  let n = 0;
  const tick = () => {
    const here = typeof pdContract === 'function' && pdContract() && String(pdContract().id) === String(cid) && document.getElementById('ig-canvas');
    if (here){ igQuoteGo(quote); return; }
    if (++n < 40) setTimeout(tick, 100);
  };
  setTimeout(tick, 100);
  return true;
}
/* DOWNLOAD AS EXCEL (owner, 22 Nov 2026: "add a download as Excel button"): the same table as Copy, written as a real
   .xlsx (Office Open XML in a plain zip, stored, no compression) so Excel, Numbers and Google Sheets open it with no
   warning. No library: four XML parts, a header row in bold, every cell plain text. Nothing is sent anywhere. */
const _XL_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function xlCrc(b){ let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = _XL_CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function xlZip(files){
  const enc = new TextEncoder(), parts = [], dir = []; let off = 0;
  const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF], u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  for (const [name, text] of files){
    const nb = enc.encode(name), db = enc.encode(text), crc = xlCrc(db);
    const head = new Uint8Array([...u32(0x04034B50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0)]);
    parts.push(head, nb, db);
    dir.push(new Uint8Array([...u32(0x02014B50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
    off += head.length + nb.length + db.length;
  }
  const dirLen = dir.reduce((n, b) => n + b.length, 0);
  const end = new Uint8Array([...u32(0x06054B50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(dirLen), ...u32(off), ...u16(0)]);
  return new Blob([...parts, ...dir, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function xlCol(i){ let s = ''; i++; while (i){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
function xlEsc(x){ return String(x == null ? '' : x).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function xlBook(head, rows, sheetName){
  const all = [head].concat(rows);
  const cell = (v, r, c) => `<c r="${xlCol(c)}${r + 1}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xlEsc(v)}</t></is></c>`;
  const widths = head.map((_, c) => Math.min(60, Math.max(10, ...all.map(r => String(r[c] == null ? '' : r[c]).length + 2))));
  const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    + `<cols>${widths.map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${all.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => cell(v, ri, ci)).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const name = xlEsc(String(sheetName || 'Discover').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Discover');
  return xlZip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
    ['xl/worksheets/sheet1.xml', sheet],
  ]);
}
function askColXlsx(askIds, only, title){
  const { head, rows } = askColTableOf(askIds, only);
  if (!rows.length){ if (typeof toast === 'function') toast(_acT('ac_xlsx_none'), 'warn'); return false; }
  const day = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  const base = String(title || 'Discover').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Discover';
  try {
    const blob = xlBook(head, rows, base), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `${base} ${day}.xlsx`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (typeof toast === 'function') toast(_acT('ac_xlsx_done', { n: rows.length }), 'ok');
    return true;
  } catch (_){ if (typeof toast === 'function') toast(_acT('ac_xlsx_failed'), 'warn'); return false; }
}
/* ONE TABLE, TWO WAYS OUT: the rows Copy puts on the clipboard and Download writes into an Excel file are one reading */
function askColTableOf(askIds, only){
  const word = a => !a ? '' : a.noWording ? _acT('ac_no_wording') : a.found ? a.answer : _acT('ac_not_found');
  const rule = a => !a ? '' : a.verdict === 'in' ? _acT('ac_lg_good') : a.verdict === 'out' ? _acT('ac_lg_bad') : '';
  /* `only`: the rows another page shows (the read table on Reads), else the Contracts list as filtered */
  const rows = (Array.isArray(only) ? only : askColShown()).filter(id => askIds.some(k => (AC.ans[k] || {})[id])).map(id => {
    const c = (typeof getContract === 'function') ? getContract(id) : null;
    const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : id;
    return [ref, c ? (c.counterparty || '') : ''].concat(...askIds.map(k => { const a = (AC.ans[k] || {})[id];
      return [word(a), (a && a.detail) || '', (a && a.clause) || '', (a && a.quote) || '', rule(a)]; }));
  });
  const head = ['Ref', 'Party'].concat(...askIds.map(k => { const n = (AC.asks[k] || {}).name || '';
    return [n, '', n + ' · ' + _acT('ac_f_clause'), n + ' · ' + _acT('ac_f_source'), n + ' · ' + _acT('ac_f_rule')]; }));
  return { head, rows };
}
async function askColCopyMany(askIds, only){
  const { head, rows } = askColTableOf(askIds, only);
  const tsv = [head].concat(rows).map(r => r.map(x => String(x).replace(/[\t\n]+/g, ' ')).join('\t')).join('\n');
  const html = '<table>' + [head].concat(rows).map((r, i) => '<tr>' + r.map(x => `<${i ? 'td' : 'th'}>${_acE(x)}</${i ? 'td' : 'th'}>`).join('') + '</tr>').join('') + '</table>';
  try {
    if (typeof ClipboardItem === 'function' && navigator.clipboard && navigator.clipboard.write)
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([tsv], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
    else await navigator.clipboard.writeText(tsv);
    if (typeof toast === 'function') toast(_acT('ac_copied'), 'ok');
  } catch (_){ if (typeof toast === 'function') toast(_acT('ac_copy_failed'), 'warn'); }
}
/* AS ANSWERS LAND: Discover is drawn again, and Jambo's panel beside the page in front (the facts, Unusual for you) */
function askColPaintPanel(){
  askColGroupsForget();
  _acDiscoverLive(true);
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* ---- THE ACTS ---- */
function askColDrop(askId){
  const R = regState();
  R.ask = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== askId);
  if (R.sort === 'ask:' + askId){ R.sort = 'updated'; R.dir = -1; }
  if (AC.chosen && AC.chosen.askId === askId) AC.chosen = null;
}
/* ---- THE READ ITSELF, IN BATCHES, STOPPABLE (owner, 26 Oct 2026) ----
   One engine for a question and for a pack. It goes out AC_BATCH contracts at
   a time, so the answers land on the list as they come and the count rises;
   Stop raises a flag that is read between batches, so it starts no more and
   nothing already read is lost. A failure ends the run and is said, never
   swallowed. Nothing here decides what to do with the result: the two callers
   put their columns up and say their own words. */
async function askColReadRun(base, ids, opts){
  const o = opts || {};
  const got = { calls: 0, cached: 0, failed: [], capped: null, asks: [], err: null, stopped: false, done: 0, left: [] };
  AC.busy = { total: ids.length, all: ids.slice(), done: 0, ids: [], stop: false, name: o.name || '', calls: 0, seen: [], queue: [], queued: new Set(), cur: null, curAt: 0, doneIds: [], askId: null, asks: [],
    question: String((base && base.question) || ''), qCount: Array.isArray(base && base.questions) ? base.questions.length : 1 };
  AC.lastRun = null; AC.stopped = null; AC.openQ = null; AC.qWalk = null; AC.moreOpen = null;
  /* A READ IS WATCHED WHERE IT RUNS (owner, 29 Oct 2026: "Next 50 … takes me to jambo and leaves me there"):
     the panel turns from his conversation back to its Overview, where the desk stands; the words are kept */
  if (typeof jamboTalkBack === 'function') try { jamboTalkBack(); } catch (_){}
  askColPaintPanel(); askColDeskStart();
  /* the questions are known: their columns stand on the list before the first answer (the stream says them first) */
  const takeAsks = (asks, part) => {
    asks.forEach(a => { AC.asks[a.id] = Object.assign(AC.asks[a.id] || {}, a); (AC.asked[a.id] || (AC.asked[a.id] = new Set())); part.forEach(x => AC.asked[a.id].add(x)); });
    if (AC.busy && asks.length){ AC.busy.asks = asks.map(a => a.id); AC.busy.askId = AC.busy.askId || asks[0].id; }
    if (!got.asks.length && asks.length){ got.asks = asks; if (o.onFirst) o.onFirst(asks); }
  };
  for (let i = 0; i < ids.length; i += AC_BATCH){
    if (AC.busy.stop){ got.stopped = true; break; }
    const part = ids.slice(i, i + AC_BATCH);
    AC.busy.ids = part;
    _acRegRepaint();
    askColPaintPanel();
    const body = { ...base, ids: part, texts: askColTexts(part) };
    let r = null, streamCalls = 0;
    /* EACH ANSWER THE MOMENT IT IS READ (the owner, 28 Oct 2026): the same route as a stream — the questions,
       then one answer per contract as Jambo finishes it, each counted, put in its cell and laid on the desk.
       Any trouble with the stream falls back to the plain answer: what was read is kept per wording, so the
       second ask pays only for what the first did not finish. */
    const onEvent = ev => {
      if (!AC.busy) return;
      if (ev.type === 'asks') return takeAsks((ev.asks && ev.asks.length) ? ev.asks : (ev.ask ? [ev.ask] : []), part);
      if (ev.type !== 'answer' || !ev.id || !ev.byAsk) return;
      Object.keys(ev.byAsk).forEach(k => { Object.assign(AC.ans[k] || (AC.ans[k] = {}), { [ev.id]: ev.byAsk[k] }); });
      AC.busy.done++; streamCalls += Number(ev.calls) || 0; AC.busy.calls += Number(ev.calls) || 0;
      AC.busy.doneIds.push(ev.id);
      askColDeskAdd(AC.busy, AC.busy.askId || Object.keys(ev.byAsk)[0], ev.id);
      askColDeskFootPaint(); askColListSoon();
    };
    /* STOP MEANS STOP (the owner, 28 Oct 2026): the stream carries a signal Stop pulls; a stopped stream is
       never asked again the plain way */
    const ac = (typeof AbortController === 'function') ? new AbortController() : null;
    AC.busy.ac = ac;
    try { r = (typeof apiStream === 'function') ? await apiStream('ai/column', { ...body, stream: true }, onEvent, ac ? { signal: ac.signal } : undefined) : null; }
    catch (_){ r = null; }
    if (AC.busy.stop){ got.calls += streamCalls; got.stopped = true; break; }
    if (!r){
      /* the calls the broken stream already spent are still spent: they are counted, never hidden */
      got.calls += streamCalls;
      try { r = await api('ai/column', 'POST', body); }
      catch (e){ got.err = e; break; }
    }
    got.calls += Number(r.calls) || 0;
    got.cached += Number(r.cached) || 0;
    (r.failed || []).forEach(f => got.failed.push(f));
    if (r.capped) got.capped = r.capped;
    const asks = (r.asks && r.asks.length) ? r.asks : (r.ask ? [r.ask] : []);
    takeAsks(asks, part);
    asks.forEach(a => { const m = (r.byAsk && r.byAsk[a.id]) || r.answers || {}; Object.assign(AC.ans[a.id] || (AC.ans[a.id] = {}), m); });
    /* the batch is whole: the count is exact again (a contract that failed is done too), and any answer the
       stream did not lay on the desk (the plain answer's) joins its queue */
    AC.busy.calls = got.calls;
    askColDeskLanded(AC.busy, part, AC.busy.askId || (asks[0] && asks[0].id));
    AC.busy.done = i + part.length;
    AC.busy.doneIds = [...new Set(AC.busy.doneIds.concat(part))];
    got.done = AC.busy.done;
    _acRegRepaint();
    askColPaintPanel();
  }
  /* THE DESK DOES NOT VANISH AT THE END: the last answers that landed are turned through first (bounded,
     and Stop or a failure ends it at once); the line of refs in flight goes, the desk and the counts stay */
  if (AC.busy && !got.stopped && !got.err && !AC.busy.stop){ AC.busy.ids = []; askColPaintPanel(); await askColDeskDrain(); }
  /* what was answered, by contract: a stop inside a batch keeps the answers that landed and offers the rest */
  const answered = new Set(AC.busy ? AC.busy.doneIds : []);
  if (got.stopped){ got.done = answered.size; got.left = ids.filter(id => !answered.has(id)); }
  else got.left = ids.slice(got.done);
  const B = AC.busy;
  if (B && !got.stopped && !got.err && B.askId && B.cur){
    AC.lastRun = { askId: B.askId, name: (AC.asks[B.askId] || {}).name || B.name, question: B.question || (AC.asks[B.askId] || {}).question || '', qCount: B.qCount,
      cur: B.cur, seen: B.seen.slice(-AC_DESK_STACK), done: B.done, risk: askColDeskRisk(B), calls: B.calls };
    AC.colOpen = B.askId;
  }
  if (B){ got.question = B.question || ''; got.qCount = B.qCount; }
  AC.busy = null; askColDeskStop(); askColListSoon(true);
  return got;
}
/* what the reader is told after a run that was stopped or that broke: nothing
   is lost, and the rest is offered again with its own cost */
function askColRunEnd(got, base, name){
  AC.stopped = (got.stopped || got.err) && got.left.length ? { askId: (got.asks[0] && got.asks[0].id) || '', base, left: got.left, done: got.done, total: got.done + got.left.length, name, calls: got.calls, question: got.question || '', qCount: got.qCount } : null;
  if (got.err && typeof toast === 'function')
    toast(got.err && (got.err.needsKey || got.err.kind === 'noKey') ? _acT('ac_nokey') : _acT('ac_err', { msg: (got.err && got.err.message) || '' }), 'err');
  else if (got.stopped && typeof toast === 'function') toast(_acT('ac_stopped', { done: got.done, total: got.done + got.left.length }), 'ok');
  else if (typeof toast === 'function'){
    const failed = new Set(got.failed.filter(x => x.why !== 'notFound').map(x => x.id)).size;
    if (failed) toast(_acTn('ac_failed', failed), 'warn');
    if (got.capped) toast(_acT('ac_capped', got.capped), 'warn');
  }
  _acSumAt = 0; _acReadsAt = 0;
  /* a stopped press says so on its record */
  if (got.stopped && base && base.run && base.run.id) api(`columns/reads/${encodeURIComponent(base.run.id)}/stop`, 'POST', {}).catch(() => {});
  _acRegRepaint();
  askColPaintPanel();
  Promise.all([askColSummary(true), askColReads(true)]).then(() => askColPaintPanel());
}
/* STOP MEANS STOP: the stream is cancelled at once (the server starts no further read; the few already with
   Jambo finish there and are kept, free on Carry on),
   the cells that were spinning say "not read yet", and the card says where it stopped straight away */
function askColStop(){
  const b = AC.busy; if (!b) return;
  b.stop = true; b.ids = [];
  try { if (b.ac) b.ac.abort(); } catch (_){}
  askColListSoon(true); askColPaintPanel();
}
/* CARRY ON WITH THE REST: the same question, the contracts the stop left */
async function askColCarryOn(){
  const s = AC.stopped; if (!s || AC.busy) return;
  AC.stopped = null;
  const got = await askColReadRun(s.base, s.left, { name: s.name });
  askColRunEnd(got, s.base, s.name);
  if (!got.stopped && !got.err && typeof toast === 'function') toast(askColDoneSay(s.name, got), 'ok');
  return got;
}
/* ONE BUTTON (the owner picked it, 28 Oct 2026): when a read ends the message
   says where the question stands against the list shown — read, and still to
   read — the same words the card's line says; all read, it says so */
function askColDoneSay(name, got){
  const id = got && got.asks && got.asks[0] && got.asks[0].id;
  const p = id ? askColPlan({ askId: id }) : null;
  if (!p || !p.shown) return _acT('ac_done', { name, calls: _acTn('ac_n_calls', (got && got.calls) || 0) });
  return p.unread ? _acT('ac_done_left', { name, read: p.read, total: p.shown, left: p.unread }) : _acT('ac_done_all', { name, total: p.shown });
}
async function askColCheck(askId, cid){
  if (!askColMay()) return;
  const a = (AC.ans[askId] || {})[cid]; if (!a) return;
  try {
    const r = await api(`columns/${encodeURIComponent(askId)}/check`, 'POST', { contractId: cid, checked: !a.checked });
    if (r && r.answer) AC.ans[askId][cid] = r.answer;
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  _acRegRepaint();
  askColPaintPanel();
}
/* Go to clause: the contract opens on Home's paper and the sentence is lit
   there (igQuoteGo, the stakes' own lander); the wait is asked of the state
   and bounded */
function askColGo(){
  const ch = AC.chosen; if (!ch) return;
  const a = (AC.ans[ch.askId] || {})[ch.cid];
  if (typeof regOpenContract === 'function') regOpenContract(ch.cid);
  if (!a || !a.quote || typeof igQuoteGo !== 'function') return;
  let n = 0;
  const tick = () => {
    const here = typeof pdContract === 'function' && pdContract() && String(pdContract().id) === String(ch.cid) && document.getElementById('ig-canvas');
    if (here){ igQuoteGo(a.quote); return; }
    if (++n < 40) setTimeout(tick, 100);
  };
  setTimeout(tick, 100);
}
/* ---- THE PRESSES, DELEGATED ONCE (the panels are redrawn under them) ---- */
/* ASK A COLUMN IS GONE (owner, 22 Nov 2026: "There is not asking a column again only the features related to
   discovery"): its panel, form, results table and the question columns on the Contracts list are deleted. What stays
   here is the engine Discover reads with, the company facts in Settings and Unusual for you on the paper. */
if (typeof document !== 'undefined' && !document._acWired){
  document._acWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    /* ADD A NEW ONE: the one door — Discover, where a question is asked and kept. Settings' own page guard is asked
       first, as any leave is. */
    if (t.closest('[data-fa-go]')){ e.preventDefault();
      const go = () => { if (typeof window.discoverOpen === 'function') discoverOpen(); else if (typeof setView === 'function') setView('reads'); };
      if (!(typeof window.dkLeavePageThen === 'function' && window.dkLeavePageThen(go))) go();
      return; }
    const ft = t.closest('[data-fa-tog]'); if (ft){ e.preventDefault(); const id = ft.getAttribute('data-fa-tog'); askColFactSet(id, ft.getAttribute('aria-pressed') !== 'true'); return; }
    if (t.closest('[data-fa-readall]')){ e.preventDefault(); askColFactsReadAll(); return; }
    const od = t.closest('[data-ac-odd-show]'); if (od){ e.preventDefault(); askColOddShow(od.getAttribute('data-ac-odd-show')); return; }
  });
  /* a rule is saved when its box is left with new words (a change event: once, never per key) */
  document.addEventListener('change', e => {
    const el = e.target && e.target.closest ? e.target : null; if (!el) return;
    const t = el.closest('[data-fa-rule]'); if (!t) return;
    const id = t.getAttribute('data-fa-rule'), a = (AC.summary || []).find(x => x.id === id);
    if (a && String(a.rule || '') !== t.value.trim()) askColRuleSet(id, t.value.trim());
  });
}
/* THE ASK FROM DISCOVER (owner, 12 Nov 2026): the same read (askColReadRun, the same route, the same record), started
   from the Discover page. It reads the first not yet read of the Contracts list as filtered (askColPlan), brings no
   column onto any list (Where it shows is that door) and files nothing. `o`: { question } typed, { askId } the next
   batch of a question, or { pack }. It answers { short } · { portfolio } · { none } where no read starts. */
async function askColAskHere(o){
  o = o || {};
  if (AC.busy || !askColMay()) return null;
  await askColSummary(); await askColTeam();
  const shown = askColShown().slice(0, 500), key = q => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase();
  let base = null, name = '', plan = null;
  if (o.pack){
    const p = o.pack, ids = askColPackAskIds(p);
    await Promise.all(ids.map(id => askColLoad(id, shown)));
    plan = askColPlan({ askIds: askColPackPlanIds(p), size: o.size });
    base = { questions: (p.questions || []).map(x => ({ question: x.question, name: x.name })), pack: p.id }; name = p.name;
  } else {
    let a = o.askId ? AC.asks[o.askId] : null;
    const question = a ? a.question : String(o.question || '').trim();
    if (!a){
      if (question.length < 3) return { short: true };
      if (askColIsPortfolio(question)) return { portfolio: true };
      a = Object.values(AC.asks).find(x => x && key(x.question) === key(question)) || null;
    }
    if (a) await askColLoad(a.id, shown);
    plan = askColPlan({ askId: a ? a.id : null, size: o.size });
    name = a ? (a.name || askColNameOf(question)) : askColNameOf(question);
    base = { question, name };
  }
  if (!plan || !plan.pick.length) return { none: true };
  base.run = askColRunId(plan);
  /* where it was asked and how many were chosen ride the read's record (Discover's list of reads says them) */
  if (Array.isArray(o.where) && o.where.length) base.run.where = o.where.slice(0, 40);
  if (Number(o.of) > 0) base.run.of = Number(o.of);
  AC.form = null; AC.chosen = null;
  if (typeof o.onRun === 'function') try { o.onRun(base.run.id); } catch (_){}
  const got = await askColReadRun(base, plan.pick, { name, onFirst: o.onFirst });
  got.runId = base.run.id;
  const named = (!o.pack && got.asks[0] && got.asks[0].name) || name;
  askColRunEnd(got, base, named);
  if (!got.stopped && !got.err && typeof toast === 'function') toast(askColDoneSay(named, got), 'ok');
  return got;
}
/* THE CONTRACTS LIST IS REDRAWN ONLY WHERE IT CAN BE (12 Nov 2026): a read asked on the Discover page by somebody who
   came straight there (never through Contracts) found the list drawn over the page after the first answers, because
   the list's own repaint paints into the page's place. While Discover is in front, the list waits; it reads the kept
   answers again the next time it is opened. */
function _acRegRepaint(){
  if (typeof regRepaint !== 'function') return;
  if (typeof state !== 'undefined' && state.view === 'reads') return;
  regRepaint();
}
/* the Discover page is drawn again as answers land (it draws nothing unless it is the page in front) */
function _acDiscoverLive(now){ if (typeof state !== 'undefined' && state.view === 'reads' && typeof window.discoverLive === 'function'){ try { discoverLive(now); } catch (_){} } }

Object.assign(window, { askColAskHere, askColShown, askColTeam, askColDrop, askColLoad, askColLoadMany, askColCopyMany, askColTableOf, askColXlsx, xlBook, xlZip, xlCrc, askColGo, askColCheck, askColMay, askColNameOf, AC, AC_MAX, AC_COLS_MAX, AC_BATCH, AC_SIZES, AC_DESK_TURN_MS, acSize, askColPlan, askColNextWords, askColDoneSay, askColDeskAt, askColDeskPast, askColDeskStop, askColUnread, askColWhereText, askColWhen, askColReads, askColPackAskIds, askColStop, askColCarryOn, askColKeep, askColDelete, askColIsPortfolio, askColReword, askColPackPicked,
  askColOn, askColClauseNo,
  askColToneOf, askColAtRisk, askColSummary,
  askColFactsArrive, askColFactsPanelWire, askColFactsState, askColFactsKtHtml, askColFactSet, askColLandOn, askColOddHtml, askColTexts });
