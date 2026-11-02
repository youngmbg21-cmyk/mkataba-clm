/* ═══════════════════════════════════════════════════════════════════════════
   ASK A COLUMN — one question asked of the wording of many contracts, each
   answer a cell on the Contracts list (owner, 20 Oct 2026: Legora's Tabular
   Review made HaTi's own; "In Jambo's panel" picked by name, with "The SAP
   way" for show-why and "Tick in the cell" for checked-by; a limit of 50 a
   press; anyone who can edit contracts may ask).

   WHERE IT LIVES. A button in the list's own head opens the question in
   Jambo's side panel beside the list (pdJamboTopHtml asks askColPanelHtml
   before the wall's greeting). The answers are columns of the one table
   (regColKeys draws 'ask:<id>' keys; askColThHtml / askColTdHtml draw them).
   A press on an answer CHOOSES it and the panel says why — the answer, the
   reason, the sentence, the clause, when it was read — with one door, Go to
   clause, onto Home's paper with the sentence lit (igQuoteGo). A second press
   on the same answer lets it go. The circle in the cell is a person's tick.

   WHAT IT SPENDS, SAID BEFORE THE PRESS: the form counts the contracts it
   will read, the answers already kept (free), and the calls left. Nothing is
   filed into any contract; the answers live in their own server tables.

   WHICH COLUMNS ARE UP is the list's own state (R.ask, a list of question
   ids), so a refresh keeps them (regPlace) and a saved view carries them
   (REG_SAVED_FIELDS). The answers are fetched free from the server's kept
   ones (POST /api/columns/answers) whenever the list shows contracts it has
   not asked about yet.
   ═══════════════════════════════════════════════════════════════════════════ */

/* the owner's limit (20 Oct 2026) — the server holds the same number. THE THREAD (owner picked it, 28 Oct
   2026): a press reads 50 or 100 (AC_SIZES, the reader's last choice kept in this browser), so the wall is 100 */
const AC_MAX = 100;
const AC_SIZES = [50, 100];
function acSize(){ let v = 50; try { v = Number(localStorage.getItem('hati.v1.acSize')) || 50; } catch (_){ v = 50; } return AC_SIZES.includes(v) ? v : AC_SIZES[0]; }
function acSizeSet(n){ n = AC_SIZES.includes(Number(n)) ? Number(n) : AC_SIZES[0]; try { localStorage.setItem('hati.v1.acSize', String(n)); } catch (_){ /* a convenience */ } return n; }
/* how many answer columns stand beside the list at once */
const AC_COLS_MAX = 3;
/* widths when answer columns stand (sum 100): the agreement, the stage,
   ends, value, each answer, the ⋯ — Owner steps aside, as drawn, and stays in
   the filters and the sort. RECUT FOR THE LEGORA WAY (Part 8, 21 Oct 2026):
   the agreement cell carries "kind · ref" now, so the Ref column's share
   went to it (the drawing's Agreement 34% beside one answer) */
const AC_COL_W = { 1:[33,15,13,11,22,6], 2:[30,13,11,9,16.5,16.5,4], 3:[26,12,10,9,13,13,13,4] };
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
/* the extra keys regColKeys draws, in the order the columns were asked */
function askColKeys(){ return askColIdsUp().map(id => 'ask:' + id); }
function askColWidths(n){ return (AC_COL_W[n] || []).slice(); }

/* THE CONTRACTS THE QUESTION GOES TO: the list as filtered, a code-named deal
   the reader is outside of left out (the server would refuse it), the first
   AC_MAX — and the cut is said in the form. */
function askColShown(){
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
/* the rows the list draws now: the kept answers are looked up for these */
function askColRowsUp(){
  if (typeof document === 'undefined') return [];
  return [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(tr => tr.getAttribute('data-row')).filter(Boolean);
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
/* the choice inside the sentence: 50 | 100, the reader's last choice lit */
function askColPillHtml(size, attr){
  return `<span class="ac-size" role="group" aria-label="${_acE(_acT('ac_th_size_title'))}">${AC_SIZES.map(n => `<button type="button" class="ac-size-b${n === size ? ' on' : ''}" ${attr}="${n}" aria-pressed="${n === size ? 'true' : 'false'}">${n}</button>`).join('')}</span>`;
}
function askColWhereText(p){
  if (!p.pick.length) return '';
  return p.contiguous ? _acT('ac_th_where', { from: p.from, to: p.to }) : _acT('ac_th_where_gap', { n: p.pick.length, from: p.from });
}
/* ONE SENTENCE carries the choice, the count, where they stand and the cost (the Legora way, as drawn) */
function askColSentenceHtml(p, o){
  o = o || {};
  const b = x => `<b>${_acE(x)}</b>`;
  const pill = (o.force || p.unread > AC_SIZES[0]) ? askColPillHtml(p.size, 'data-ac-size') : b(String(p.pick.length));
  const v = { pill, shown: b(String(p.shown)), unread: b(String(p.unread)), read: b(String(p.read)), where: b(askColWhereText(p)), calls: b(_acTn('ac_n_calls', p.calls)), q: b(String(o.q || 0)) };
  const k = o.force ? 'ac_th_again'
    : !p.shown ? 'ac_none_shown'
    : !p.unread ? 'ac_th_all'
    : p.read ? (p.unread > AC_SIZES[0] ? (o.pack ? 'ac_th_pack_next' : 'ac_th_next') : (o.pack ? 'ac_th_pack_rest' : 'ac_th_rest'))
    : (p.shown > AC_SIZES[0] ? (o.pack ? 'ac_th_pack_first' : 'ac_th_first') : (o.pack ? 'ac_th_pack_whole' : 'ac_th_whole'));
  return _acT(k, v);
}
/* the ask button's words: the first read "Ask N contracts", the next "Read the next N", again "Ask again · N" */
/* THE BUTTON SAYS WHAT IT SPENDS (round 2 of the review, 28 Oct 2026): "Read 16 contracts · 16 Jambo calls" */
function askColAskWords(p){
  const n = p.pick.length, calls = _acTn('ac_n_calls', n);
  return p.force ? _acT('ac_read_btn_again', { calls }) : p.read ? _acT('ac_read_btn_next', { n, calls }) : _acTn('ac_read_btn', n, { calls });
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
function askColNamedHtml(f){
  if (f.nameEdit) return `<label class="ac-l" for="ac-name">${_acE(_acT('ac_name_label'))}</label><input id="ac-name" class="ac-in" maxlength="40" placeholder="${_acE(_acT('ac_name_ph'))}" value="${_acE(f.name || askColNameOf(f.question))}">`;
  const name = f.name || askColNameOf(f.question);
  return name ? `${_acT('ac_named', { name: `<b>${_acE(name)}</b>` })} <button type="button" class="ac-link" data-ac-name-edit>${_acE(_acT('ac_named_change'))}</button>`
    : _acE(_acT('ac_named_empty'));
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
function askColLastRead(askId){
  const rs = (AC.reads && AC.reads.reads) || [];
  return rs.find(r => (r.askIds || []).includes(askId)) || null;
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
async function askColTeam(){
  try { const r = await api('columns'); AC.team = (r && r.asks) || []; AC.packs = (r && r.packs) || []; (AC.team || []).forEach(a => { AC.asks[a.id] = AC.asks[a.id] || a; }); }
  catch (_){ AC.team = AC.team || []; }
  return AC.team;
}
/* after every list paint: the columns up know their questions and the answers
   for the rows in front of the reader (bounded: one look per contract) */
let _acSyncing = false;
/* THE DOOR FOLLOWS WHO IS SIGNED IN: a list drawn before the person is
   known is put right once they are (bounded), so a viewer's door greys with why */
let _acWho = 0;
function askColBtnFix(){
  const b = (typeof document !== 'undefined') ? document.querySelector('[data-ac-open]') : null; if (!b) return;
  const may = askColMay();
  if (b.disabled === !may) return;
  b.disabled = !may;
  if (may) b.removeAttribute('title'); else b.title = _acT('ac_btn_viewer');
}
function askColWhoWait(){
  if ((typeof currentUser === 'function' && currentUser()) || _acWho > 40) { askColBtnFix(); return; }
  _acWho++; setTimeout(askColWhoWait, 250);
}
async function askColSync(){
  if (!askColOn()) return;
  askColBtnFix(); if (!(typeof currentUser === 'function' && currentUser())) { _acWho = 0; askColWhoWait(); }
  /* Jambo's box sent the reader here to ask (JM_TASKS 'askcol'): the question opens once */
  const R0 = regState();
  if (R0.askOpen){ delete R0.askOpen; if (!AC.form) askColOpen(); return; }
  if (typeof watchesLoaded === 'function' && !watchesLoaded() && typeof watchLoad === 'function') watchLoad().then(() => { if (askColOn()) askColPaintPanel(); });
  /* DISCOVER: the kept questions, counted, fetched free (at most once a minute) and drawn under the greeting */
  if (!AC.summary || Date.now() - _acSumAt > 60000){ askColSummary().then(() => { if (askColOn() && !AC.chosen) askColPaintPanel(); }); }
  /* the panel counts the list in front of it: a filter moved, so it says the new count */
  if (!_acSyncing && (AC.form || askColIdsUp().length)) askColPaintPanel();
  if (_acSyncing) return;
  const R = regState(), ids = Array.isArray(R.ask) ? R.ask.slice(0, AC_COLS_MAX) : [];
  if (!ids.length) return;
  _acSyncing = true;
  let moved = false;
  try {
    /* a column brought back by a refresh or a saved view learns its question
       from the kept answers' own reply */
    const shown = askColRowsUp();
    for (const id of ids) if (await askColLoad(id, shown)) moved = true;
    if (ids.some(id => !AC.asks[id])) moved = true;
    if (moved && askColOn() && typeof regRepaint === 'function') regRepaint();
  } finally { _acSyncing = false; }
  /* the answers that just arrived are the panel's too: its column card is drawn now, not on the next press */
  if (moved && askColOn() && !AC.form) askColPaintPanel();
}

/* ---- THE TABLE: a head and a cell per answer column ---- */
/* the head sorts like every other head (regFiltered asks askColCmp): the
   answers to look at first come first */
function askColThHtml(askId, style, grip, caret){
  const a = AC.asks[askId] || {}, key = 'ask:' + askId;
  const on = typeof regState === 'function' && regState().sort === key;
  const spark = (typeof icon === 'function') ? icon('sparkle', 'ac-th-i') : '';
  /* THE COUNT THAT MATTERS, WHERE THE EYE ALREADY IS (Lights, 26 Oct 2026):
     the cells carry one word each now, so how many are at risk is said once,
     in the head of the column it belongs to. Nothing where none are. */
  const risk = askColAtRisk(askId).length;
  const tally = risk ? `<span class="ac-th-risk">${_acE(_acTn('ac_disc_risk', risk))}</span>` : '';
  /* the new look (round 6, as drawn): the question itself, and under it "Kept question · 3 of 4 read · yes 1" */
  if (typeof regNl === 'function' && regNl()){
    const shown = askColShown(), got = AC.ans[askId] || {};
    const read = shown.filter(id => got[id]).length, yes = shown.filter(id => got[id] && got[id].yes === true).length;
    const sub = _acT('ac_th_kept_sub', { k: read, n: shown.length, y: yes });
    return `<th class="reg-th-sort ac-th is-nl${on ? ' active' : ''}" data-reg-sort="${_acE(key)}" data-ac-th="${_acE(askId)}" role="button" tabindex="0" aria-sort="${on ? (regState().dir === 1 ? 'ascending' : 'descending') : 'none'}" title="${_acE(_acT('ac_th_title', { question: a.question || '' }))}" style="cursor:pointer;user-select:none;${style}"><span class="ac-th-w">${_acE(a.question || a.name || '')}</span>${caret || ''}<span class="reg-th-sub">${_acE(sub)}</span>${grip || ''}</th>`;
  }
  return `<th class="reg-th-sort ac-th${on ? ' active' : ''}" data-reg-sort="${_acE(key)}" data-ac-th="${_acE(askId)}" role="button" tabindex="0" aria-sort="${on ? (regState().dir === 1 ? 'ascending' : 'descending') : 'none'}" title="${_acE(_acT('ac_th_title', { question: a.question || '' }))}" style="cursor:pointer;user-select:none;${style}"><span class="ac-th-w">${_acE(a.name || '')}</span>${spark}${tally}${caret || ''}${grip || ''}</th>`;
}
function askColInitials(name){
  const p = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((p[0] || '').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
}
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
/* THE LEGEND, IN THE LIST'S FOOT while an answer column stands: what each dot means, said once */
function askColLegendInner(){
  const d = (k, t) => `<span class="ac-lg"><i class="ac-lg-${k}"></i>${_acE(_acT(t))}</span>`;
  return `${d('green', 'ac_lg_good')}${d('steel', 'ac_lg_no')}${d('v1', 'ac_lg_fact')}${d('amber', 'ac_lg_watch')}${d('ruby', 'ac_lg_bad')}${d('none', 'ac_lg_none')}`;
}
function askColLegendHtml(){
  if (!askColIdsUp().length) return '';
  return `<span class="lh-extra ac-legend"> · ${askColLegendInner()}</span>`;
}
/* A QUESTION OF THE WORDING TYPED IN THE LIST'S OWN BOX (stage 2): the same
   form opens, filled — the one door to a read, the cost said before any call */
const AC_WORDING_RE = /\b(notice|terminat\w*|cancel\w*|liabilit\w*|capped|cap\b|indemn\w*|govern\w*|law\b|jurisdiction|renew\w*|roll(s|ed)? over|personal data|data protection|confidential\w*|payment terms|days to pay|warrant\w*|exclusiv\w*|non-compete|assign\w*|force majeure|clause|does (it|the contract|each contract) say|uppsägning\w*|ansvar\w*|förnya\w*|personuppgift\w*)\b/i;
/* A COUNTING QUESTION IS NOT A COLUMN (owner, 26 Oct 2026: "why are the
   personal questions going to the company facts?"). "How many contracts have
   no redlines" asks about the reader's own book, which Jambo's box answers from
   the records, free; a column asks what ONE contract's wording says, of every
   contract in turn. Twinned on the server (COLUMN_PORTFOLIO_RE), which is the
   wall: nothing counting is ever kept as a question. */
const AC_PORTFOLIO_RE = /^\s*(how many\b|how much (of|do i|do we)\b|which (of|ones)\b|count\b|list\b|show me\b|who (has|have)\b)|\b(these|those|my|our|the) contracts\b/i;
function askColIsPortfolio(words){ return AC_PORTFOLIO_RE.test(String(words || '')); }
/* A REFUSAL IS SAID UNDER THE BOX, NEVER OVER IT (owner, 26 Oct 2026: the toast sat on the very box it pointed
   the reader to). The sentence stands under the question box until the question is typed in again; with no
   form on the screen it falls back to a toast. */
function askColSay(msg){
  const q = document.getElementById('ac-q');
  if (!q){ if (typeof toast === 'function') toast(msg, 'warn'); return; }
  let el = document.getElementById('ac-q-say');
  if (!el){ el = document.createElement('div'); el.id = 'ac-q-say'; el.className = 'ac-why'; el.setAttribute('role', 'alert'); q.insertAdjacentElement('afterend', el); }
  el.textContent = String(msg || ''); el.hidden = !el.textContent;
  q.focus();
}
function askColSayClear(){ const el = document.getElementById('ac-q-say'); if (el) el.hidden = true; }
function askColTakes(seat, words){
  const t = String(words || '').trim();
  if (seat !== 'contracts' || !askColOn() || !askColMay() || !t) return false;
  const q = (typeof lhIsQuestion === 'function') ? lhIsQuestion(t) : /\?$/.test(t);
  if (!q || !AC_WORDING_RE.test(t) || askColIsPortfolio(t)) return false;
  askColOpen({ question: t.slice(0, 300) });
  return true;
}
/* LIGHTS (the owner picked it, 26 Oct 2026: "remove the cramping up … make it a
   traffic light system"). A CELL SAYS ONE THING: the light and the short answer,
   on one line, never cut off by a § chip, a tick and a quoted sentence fighting
   it for 150 pixels. Everything else — the clause, the words it was read from,
   the rule, the tick — is one press away, in the panel's reading of the chosen
   row, which has the room for it. Reversal of "the Legora way's two lines"
   (25 Oct 2026), which the owner found cramped with three columns up. */
function askColTdHtml(c, askId){
  const a = (AC.ans[askId] || {})[c.id];
  const on = AC.chosen && AC.chosen.askId === askId && AC.chosen.cid === String(c.id);
  const attrs = `class="ac-cell${on ? ' is-on' : ''}" data-ac="${_acE(askId)}" data-ac-cid="${_acE(c.id)}"`;
  if (!a){
    const busy = AC.busy && AC.busy.ids && AC.busy.ids.includes(String(c.id));
    return `<td ${attrs}>${busy && typeof busyHtml === 'function' ? `<span class="ac-sub">${busyHtml('')}</span>` : `<span class="ac-ans tone-none is-wait" title="${_acE(_acT('ac_not_read'))}"><i></i><span class="ac-a">${_acE(_acT('ac_not_read'))}</span></span>`}</td>`;
  }
  const word = a.noWording ? _acT('ac_no_wording') : a.found ? a.answer : _acT('ac_not_found');
  const tone = askColToneOf(a, askId);
  /* the full reading rides the cell's own title, so a long answer is readable
     where it is, without the row growing or the words being cut twice over */
  const tip = [word, a.detail, a.found ? askColQuoteShort(a) : ''].filter(Boolean).join(' · ');
  return `<td ${attrs}><span class="ac-ans tone-${tone}" title="${_acE(tip)}"><i></i><span class="ac-a">${_acE(word)}</span></span></td>`;
}
/* sorting by an answer column: the ones to look at first — a concern, then
   one to watch, then the usual, then a plain fact, then nothing found */
function askColCmp(askId){
  const m = AC.ans[askId] || {};
  const R2 = { ruby:0, amber:1, green:2, steel:3 };
  const rank = c => { const a = m[c.id]; return !a ? 9 : a.noWording ? 8 : !a.found ? 7 : (R2[askColToneOf(a, askId)] ?? 5); };
  return (x, y) => rank(y) - rank(x);
}

/* ---- JAMBO'S PANEL ---- */
/* ---- JAMBO ASKS (round 3 of the review; the owner picked "Jambo asks" and "Jambo" for the rewording, 28 Oct 2026) ----
   A counting question ("How many contracts mention a rebate?") asks about the list, and a column asks each
   contract one question. So Jambo's card says so, in his grey card, instead of a refusal under the box:
   - a question the RECORDS answer whole (every word read by the list's own conditions, jmOnlyNarrows:
     "How many of my contracts are in Procurement?") is answered here, free: "8 of the 16 shown · Procurement"
     with Show those 8 (regShowOnly);
   - any other is offered to be turned into the one question for each contract, a press that says its cost
     (1 Jambo call, POST /api/ai/column-turn); the turned question is shown before anything is read, with
     Ask each contract and the reads' cost, or Change my question (back to the box, the words kept);
   - after the read the card counts the yeses: "5 of 16 mention a rebate · Show those 5" (askColCountLineHtml).
   Nothing here writes; the read itself goes through the one read (askColReadAndSay). */
function askColRecordsOf(q){
  if (typeof jmOnlyNarrows !== 'function' || typeof igConditions !== 'function' || typeof igIdsWhere !== 'function') return null;
  let conds = []; try { conds = jmOnlyNarrows(q) ? (igConditions(q) || []) : []; } catch (_){ conds = []; }
  if (!conds.length) return null;
  const shown = askColShown(), set = new Set(shown);
  const base = (state.contracts || []).filter(c => c && set.has(String(c.id)));
  let ids = []; try { ids = igIdsWhere(conds, base).map(String); } catch (_){ return null; }
  const what = [...new Set(conds.map(c => String(c.label || c.hit || '').trim()).filter(Boolean))].join(' · ');
  return { ids, total: shown.length, what };
}
function askColCountOpen(typed){
  const rec = askColRecordsOf(typed);
  AC.count = rec ? { typed, stage: 'records', ...rec } : { typed, stage: 'ask' };
  askColPaintPanel();
}
function askColCountHtml(){
  const k = AC.count;
  const head = askColDeskHeadHtml({ name: k.question ? askColNameOf(k.question) : '', question: k.typed });
  const change = `<button type="button" class="ui-btn ui-btn-sm" data-ac-count-change>${_acE(_acT('ac_ct_change'))}</button>`;
  let body = '', acts = '';
  if (k.stage === 'records'){
    const n = k.ids.length;
    body = `<div class="ac-dk-said"><b>${_acE(n ? _acT('ac_ct_rec_n', { n, total: k.total }) : _acT('ac_ct_rec_none', { total: k.total }))}</b>${k.what ? ' · ' + _acE(k.what) : ''}</div>
      <div class="ac-dk-eb">${_acE(_acT('ac_ct_rec_free'))}</div>`;
    acts = (n ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-count-show>${_acE(_acTn('ac_ct_show', n))}</button>` : '') + change;
  } else if (k.stage === 'turned'){
    const p = askColPlan({ force: true }), m = p.pick.length;
    body = `<div class="ac-dk-said">${_acE(_acT('ac_ct_will'))}</div><p class="ac-dk-q2">${_acE(k.question)}</p>
      <div class="ac-dk-said">${_acE(_acT('ac_ct_then'))}</div><div class="ac-dk-eb">${_acE(_acT('ac_desk_spent', { calls: _acTn('ac_n_calls', 1) }))}</div>`;
    acts = `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-count-go${m && askColMay() ? '' : ' disabled'}>${_acE(_acTn('ac_ct_go', m, { calls: _acTn('ac_n_calls', m) }))}</button>` + change;
  } else if (k.stage === 'cannot'){
    body = `<div class="ac-dk-said">${_acE(_acT('ac_ct_cannot'))}</div>`;
    acts = change;
  } else {
    const turning = k.stage === 'turning';
    body = `<div class="ac-dk-said">${_acE(_acT('ac_ct_explain'))}</div>${k.err ? `<div class="ac-say" role="alert">${_acE(k.err)}</div>` : ''}`;
    acts = `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-count-turn${turning || !askColMay() ? ' disabled' : ''}>${turning && typeof busyHtml === 'function' ? busyHtml(_acT('ac_ct_turning')) : _acE(_acT('ac_ct_turn', { calls: _acTn('ac_n_calls', 1) }))}</button>` + change;
  }
  return `<div class="ac-card ac-dk-card" id="ac-form" data-ac-count="${_acE(k.stage)}">${head}${body}<div class="ac-acts">${acts}</div></div>`;
}
async function askColCountTurn(){
  const k = AC.count; if (!k || k.stage === 'turning') return;
  k.stage = 'turning'; k.err = ''; askColPaintPanel();
  let r = null;
  try { r = await api('ai/column-turn', 'POST', { question: k.typed }); }
  catch (e){
    if (AC.count !== k) return;
    k.stage = 'ask'; k.err = (e && (e.needsKey || (e.body && e.body.needsKey))) ? _acT('ac_nokey') : _acT('ac_err', { msg: (e && e.message) || '' });
    askColPaintPanel(); return;
  }
  if (AC.count !== k) return;
  if (r && r.question){ k.stage = 'turned'; k.question = r.question; k.says = r.says || ''; }
  else k.stage = 'cannot';
  askColPaintPanel();
}
async function askColCountGo(){
  const k = AC.count; if (!k || k.stage !== 'turned' || AC.busy) return;
  const question = k.question, name = askColNameOf(question);
  const p = askColPlan({ force: true }); if (!p.pick.length) return;
  AC.count = null; AC.form = null;
  const base = { question, name, force: false, run: askColRunId(p) };
  await askColReadAndSay(base, p.pick, name, asks => {
    const id = asks[0] && asks[0].id; if (!id) return;
    AC.counts[id] = { says: k.says, typed: k.typed };
    const R = regState();
    R.ask = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== id).concat(id).slice(-AC_COLS_MAX);
  });
}
/* the count a counting question was asked for, off the answers read among those shown */
function askColCountOf(askId){
  const ct = AC.counts[askId]; if (!ct) return null;
  const m = AC.ans[askId] || {}, read = askColShown().filter(id => m[id] && !m[id].noWording);
  const yes = read.filter(id => m[id].yes === true);
  return { yes, n: read.length, says: ct.says };
}
function askColCountLineHtml(askId){
  const c = askColCountOf(askId); if (!c || !c.n) return '';
  return `<div class="ac-dk-count"><span class="ac-dk-said"><b>${_acE(_acT('ac_ct_of', { y: c.yes.length, n: c.n }))}</b> ${_acE(c.says)}</span>${c.yes.length ? `<button type="button" class="ac-link" data-ac-count-yes="${_acE(askId)}">${_acE(_acTn('ac_ct_show', c.yes.length))}</button>` : ''}</div>`;
}
function askColCountShow(ids, what){
  if (!ids || !ids.length || typeof regShowOnly !== 'function') return;
  regShowOnly(ids.slice(), what);
}
function askColPanelHtml(){
  if (!askColOn()) return '';
  /* WHILE A READ RUNS its card leads; the questions read before stand folded under it (owner, 29 Oct 2026) */
  if (AC.busy) return askColBusyHtml() + askColQuestionsHtml(askColIdsUp(), AC.busy.asks || []);
  if (AC.count) return askColCountHtml();
  if (AC.form) return askColFormHtml();
  const up = askColIdsUp();
  /* a stop whose question has no column on the list (a pack's, or one taken off) keeps its own card */
  const stopped = AC.stopped && !(AC.stopped.askId && up.includes(AC.stopped.askId)) ? askColStoppedHtml() : '';
  if (!up.length) return stopped;
  const ch = AC.chosen && up.includes(AC.chosen.askId) ? AC.chosen : null;
  return stopped + (ch ? askColWhyHtml(ch) + askColColumnHtml(ch.askId) : askColQuestionsHtml(up) + askColDiscoverHtml());
}
/* SEVERAL QUESTIONS, ONE OPEN (owner, 29 Oct 2026, the Legora way as drawn): the question last read (or
   the one pressed, here or on its column's head) open; every other one a folded line with its name, how
   far it is read and its answers in colour, pressed to open. A press on the open one's head folds it. */
function askColOpenQ(up){
  if (AC.openQ === '') return '';
  if (AC.openQ && up.includes(AC.openQ)) return AC.openQ;
  const last = (AC.stopped && AC.stopped.askId) || (AC.lastRun && AC.lastRun.askId) || '';
  return up.includes(last) ? last : up[up.length - 1];
}
function askColQuestionsHtml(up, skip){
  const list = up.filter(id => !(skip || []).includes(id));
  const open = skip ? '' : askColOpenQ(list);
  const folded = list.filter(id => id !== open);
  const head = folded.length && (open || skip) ? `<div class="ac-col-eb">${_acE(_acT(skip ? 'ac_col_earlier' : 'ac_col_others'))}</div>` : '';
  return (open ? askColColumnHtml(open) : '') + head + folded.map(askColFoldHtml).join('');
}
/* the answer groups as rows: the biggest four, the rest as one, nothing found last */
function askColGroupRows(askId, G){
  G = G || askColGroups(askId);
  const rows = G.top.map(g => ({ key: g.key, label: g.label, ids: g.ids, tone: askColToneOf(g.a, askId), a: g.a }));
  if (G.rest.length){
    const ids = G.rest.flatMap(g => g.ids);
    const names = G.rest.slice(0, 3).map(g => g.label).join(', ') + (G.rest.length > 3 ? ', …' : '');
    const tones = [...new Set(G.rest.map(g => askColToneOf(g.a, askId)))];
    rows.push({ key: '__rest', label: _acTn('ac_grp_rest', G.rest.length), names, ids, tone: tones.length === 1 ? tones[0] : 'more', a: G.rest[0].a, rest: G.rest });
  }
  if (G.nf.length) rows.push({ key: '__nf', label: _acT('ac_grp_none'), ids: G.nf, tone: 'none', nf: true });
  return rows;
}
/* the coloured bar: each group its share of the list shown; what is not read yet is the bare track */
function askColGroupBarHtml(askId, rows, shown, cls){
  const n = Math.max(1, shown);
  return `<div class="ac-gbar${cls ? ' ' + cls : ''}" aria-hidden="true">${rows.map(r => `<i class="ac-lg-${r.tone}" style="width:${(r.ids.length / n * 100).toFixed(2)}%"></i>`).join('')}</div>`;
}
/* THE QUOTE UNDER THE ANSWERS: the group pressed (the biggest at first), ‹ › through its contracts */
function askColQuoteWalk(askId, rows){
  const w = AC.qWalk && AC.qWalk.askId === askId ? AC.qWalk : null;
  const withQ = r => r.ids.filter(id => { const a = (AC.ans[askId] || {})[id]; return a && a.found && a.quote; });
  let row = w ? rows.find(r => r.key === w.key) : null;
  if (!row) row = rows.find(r => !r.nf && withQ(r).length) || rows.find(r => r.nf) || null;
  if (!row) return { row: null, ids: [], i: 0 };
  const ids = row.nf ? row.ids : withQ(row);
  const i = ids.length ? Math.min(Math.max(0, (w && w.key === row.key) ? w.i : 0), ids.length - 1) : 0;
  return { row, ids, i };
}
function askColQuoteHtml(askId, rows){
  const W = askColQuoteWalk(askId, rows); if (!W.row || !W.ids.length) return '';
  const cid = W.ids[W.i], a = (AC.ans[askId] || {})[cid] || {};
  const c = (typeof getContract === 'function') ? getContract(cid) : null;
  const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : cid;
  const num = askColClauseNo(a);
  const src = [askColDeskNameOf(cid), ref, num ? '§ ' + num : ''].filter(Boolean).join(' · ');
  const words = W.row.nf ? _acT(a.noWording ? 'ac_no_wording' : 'ac_grp_none_q') : '“' + a.quote + '”';
  const step = W.ids.length > 1 ? `<span class="ac-qw-st"><button type="button" class="ac-qw-b" data-ac-qstep="-1" data-ac-q-ask="${_acE(askId)}" aria-label="${_acE(_acT('ac_qw_prev'))}">‹</button><button type="button" class="ac-qw-b" data-ac-qstep="1" data-ac-q-ask="${_acE(askId)}" aria-label="${_acE(_acT('ac_qw_next'))}">›</button></span>` : '';
  return `<div class="ac-qw" data-ac-qw="${_acE(askId)}"><div class="ac-qw-h"><span>${_acE(_acT('ac_qw_of', { name: W.row.label, i: W.i + 1, n: W.ids.length }))}</span>${step}</div>
    <blockquote class="ac-qw-q${W.row.nf ? ' is-none' : ''}">${_acE(words)}</blockquote><button type="button" class="ac-qw-src" data-ac-qgo="${_acE(cid)}" data-ac-q-ask="${_acE(askId)}">${_acE(src)}</button></div>`;
}
/* ONE SENTENCE OF WHERE IT STANDS: the stop, the last press, then read and still to read */
function askColSayHtml(askId){
  const p = askColPlan({ askId }), parts = [];
  const st = AC.stopped && AC.stopped.askId === askId ? AC.stopped : null;
  const lr = AC.lastRun && AC.lastRun.askId === askId ? AC.lastRun : null;
  if (st) parts.push(_acE(_acT('ac_col_say_stopped', { done: st.done, total: st.total })));
  else if (lr && lr.done) parts.push(_acE(_acTn('ac_col_say_just', lr.done, { calls: _acTn('ac_n_calls', lr.calls || 0) })));
  if (p.shown) parts.push(p.unread ? _acT('ac_col_say_left', { read: `<b>${_acE(_acT('ac_col_are_read', { read: p.read, total: p.shown }))}</b>`, left: p.unread }) : `<b>${_acE(_acT('ac_col_say_all', { total: p.shown }))}</b>`);
  const risk = askColAtRisk(askId).length;
  if (risk) parts.push(`<button type="button" class="ac-link is-risk" data-ac-risk="${_acE(askId)}">${_acE(_acTn('ac_chip_risk', risk))}</button>`);
  return `<p class="ac-col-say">${parts.join(' ')}</p>`;
}
/* WHILE HE READS: how far he has got, and Stop. The count is the answers
   already landed — they are kept whatever happens next (owner, 26 Oct 2026). */
function askColBusyHtml(){
  const b = AC.busy, pct = b.total ? Math.round(b.done / b.total * 100) : 0;
  const line = b.stop ? _acT('ac_stopping') : _acTn('ac_reading_n', b.total, { done: b.done });
  /* THE READING DESK AS DRAWN (round 2 of the review, 28 Oct 2026: the owner's drawing, artifact C83usssBsvJMimRMC4xZWy):
     Jambo's grey card; the eyebrow and the question; the refs in flight in the reference face, plain; the white
     desk and stack; the counts and Stop as a button. No bar: the counts say how far it got. */
  void pct; void line;
  /* STOP STANDS STILL (owner, 29 Oct 2026: "you are chasing it to press stop"): Stop heads the card, top
     right, beside the line that says what is in flight; under it the desk and the stack keep their size
     from the first moment, so nothing above Stop ever grows */
  return `<div class="ac-card ac-dk-card is-running" id="ac-form" data-ac-desk-card>
      <div class="ac-dk-top">${askColDeskNowHtml(b)}<button type="button" class="ui-btn ui-btn-sm ac-dk-stop" data-ac-stop${b.stop ? ' disabled' : ''}>${_acE(_acT('ac_stop'))}</button></div>
      ${askColDeskHeadHtml(b)}
      <div class="ac-desk" data-ac-desk>${askColDeskHtml(b)}</div>
      <ul class="ac-stack" data-ac-stack>${askColStackHtml(b)}</ul>
      <div class="ac-desk-foot"><span class="ac-busy" role="status" aria-live="polite">${_acE(askColDeskFootText(b))}</span></div>
    </div>`;
}
/* the eyebrow and the question, shared by the card while it reads and the card it leaves behind */
function askColDeskHeadHtml(b){
  const pack = (b.qCount || 0) > 1;
  const eb = pack ? _acT('ac_desk_eb_pack', { name: b.name || '' }) : b.name ? _acT('ac_desk_eb', { name: b.name }) : _acT('ac_btn');
  const q = pack ? _acTn('ac_desk_pack_qs', b.qCount) : (b.question || b.name || '');
  return `<div class="ac-dk-eb">${_acE(eb)}</div><p class="ac-dk-q">${_acE(q)}</p>`;
}
/* THE CARD THE READ LEAVES BEHIND (the owner's picture, 28 Oct 2026: the last answer on the desk, the stack under it,
   "Read 50 contracts · 17 at risk · 50 Jambo calls spent" and one button): it heads the column's card until the
   next read or a page change; the column's other doors stay under it */
function askColDeskRestHtml(askId){
  const r = AC.lastRun; if (!r || r.askId !== askId) return '';
  const p = askColPlan({ askId }), w = p.unread ? askColNextWords(p.unread, acSize()) : null;
  /* ONE BUTTON's words stand (the owner's pick): still to read → "100 of the 120 shown read · 20 still to read";
     every one read in this one press → the owner's picture, "Read 50 contracts · 17 at risk · 50 Jambo calls spent";
     every one read over several presses → "All 120 shown are read"; at risk counts the whole column */
  const risk = askColAtRisk(askId).length, spent = _acT('ac_desk_spent', { calls: _acTn('ac_n_calls', r.calls) });
  const foot = p.unread
    ? [_acT('ac_th_prog2', { read: p.read, total: p.shown }), _acTn('ac_th_left', p.unread), risk ? _acTn('ac_disc_risk', risk) : '', spent].filter(Boolean).join(' · ')
    : r.done >= p.shown ? _acTn('ac_desk_rest', r.done, { risk: risk ? _acTn('ac_desk_rest_risk', risk) : '', calls: _acTn('ac_n_calls', r.calls) })
    : [_acT('ac_th_done', { total: p.shown }), risk ? _acTn('ac_disc_risk', risk) : '', spent].filter(Boolean).join(' · ');
  const btn = w ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-next="${_acE(askId)}" data-ac-n="${w.n}" title="${_acE(_acT('ac_th_next_title'))}">${_acE(w.label)}</button>`
    : `<button type="button" class="ui-btn ui-btn-sm" data-ac-again="${_acE(askId)}"${askColMay() ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${_acE(_acT('ac_desk_again'))}</button>`;
  return `<div class="ac-card ac-dk-card is-rest" data-ac-desk-rest="${_acE(askId)}">${askColDeskHeadHtml(r)}${askColCountLineHtml(askId)}
      <div class="ac-desk">${askColDeskHtml(r)}</div>
      <ul class="ac-stack">${askColStackHtml(r)}</ul>
      <div class="ac-desk-foot"><span class="ac-busy">${_acE(foot)}</span>${btn}</div>
    </div>`;
}
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
function askColDeskNowHtml(b){
  const ids = (b && b.ids) || [];
  if (b && b.stop) return `<div class="ac-desk-now"><span class="ob-spin" aria-hidden="true"></span><span>${_acE(_acT('ac_stopping'))}</span></div>`;
  if (!ids.length) return `<div class="ac-desk-now"><span class="ob-spin" aria-hidden="true"></span><span>${_acE(_acT('ac_desk_now'))}</span></div>`;
  const ref = id => { const c = (typeof getContract === 'function') ? getContract(id) : null; return _acE(c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : id); };
  const refs = ids.length > 1 ? _acT('ac_desk_refs', { a: ref(ids[0]), b: ref(ids[ids.length - 1]) }) : ref(ids[0]);
  return `<div class="ac-desk-now"><span class="ob-spin" aria-hidden="true"></span><span>${_acE(_acT('ac_desk_now'))}</span><span class="ac-desk-refs">${refs}</span></div>`;
}
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
  if (typeof regRepaint !== 'function') return;
  askColGroupsForget();
  if (now){ if (_acListT){ clearTimeout(_acListT); _acListT = 0; } regRepaint(); return; }
  if (_acListT) return;
  _acListT = setTimeout(() => { _acListT = 0; regRepaint(); }, 400);
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
  return _acTn('ac_desk_foot', b.total, { done: b.done, risk: b.done ? _acTn('ac_desk_risk', askColDeskRisk(b)) : '', calls: _acTn('ac_n_calls', b.calls || 0) }).replace(/ · (?= · )/, '').replace(/ ·  · /g, ' · ');
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
/* AFTER A STOP, AS DRAWN (round 2): the same grey card the read ran in, its name and question at the head,
   "Stopped at 8 of 16 · 8 answers kept · 8 Jambo calls spent · nothing else is being read", the rest offered with its cost */
function askColStoppedHtml(){
  const s = AC.stopped, calls = s.left.length;
  const said = [_acTn('ac_stopped_kept', s.done), _acT('ac_desk_spent', { calls: _acTn('ac_n_calls', s.calls || 0) }), _acT('ac_stopped_none')].join(' · ');
  return `<div class="ac-card ac-dk-card" id="ac-stopped">${askColDeskHeadHtml({ name: s.name, question: s.question, qCount: s.qCount })}
    <div class="ac-dk-said"><b>${_acE(_acT('ac_stopped_head', { done: s.done, total: s.total }))}</b> · ${_acE(said)}</div>
    <div class="ac-acts"><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-carry>${_acE(_acTn('ac_carry_on', calls, { calls: _acTn('ac_n_calls', calls) }))}</button><button type="button" class="ui-btn ui-btn-sm" data-ac-stopped-close>${_acE(_acT('ac_stopped_leave'))}</button></div></div>`;
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
/* ONLY WHAT YOU KEEP (the owner picked it, 26 Oct 2026). Discover lists the
   questions the team keeps: the company's facts, the packs' and whatever
   somebody pressed Keep on. The rest are still answered and still free to
   bring back — they wait behind one folded line, where each can be kept or
   deleted. Keeping takes nobody's permission; taking off and deleting are the
   asker's, the keeper's or an admin's (the server is the wall). */
function askColDiscoverHtml(){
  if (!askColOn() || AC.form || AC.busy) return '';
  const all = AC.discAll, rows = (AC.summary || []).slice(0, all ? 40 : 8);
  const up = new Set(askColIdsUp()), may = askColMay();
  const row = a => {
    const bits = [a.found ? _acTn('ac_answered', a.found) : '', a.risk ? _acTn('ac_disc_risk', a.risk) : '', a.last ? _acT('ac_read_at', { when: askColWhen(a.last) }) : ''].filter(Boolean).join(' · ');
    const tags = [a.fact ? `<span class="ac-tag">${_acE(_acT('ac_disc_fact'))}</span>` : '', up.has(a.id) ? `<span class="ac-tag">${_acE(_acT('ac_disc_up'))}</span>` : '', askColRowTagsHtml(a)].join('');
    const keep = !may || a.fact ? '' : `<button type="button" class="ac-disc-act" data-ac-keep="${_acE(a.id)}" data-ac-on="${a.kept ? '1' : '0'}" title="${_acE(_acT(a.kept ? 'ac_keep_off_tip' : 'ac_keep_on_tip'))}">${_acE(_acT(a.kept ? 'ac_keep_off' : 'ac_keep_on'))}</button>`;
    const del = !may || a.fact ? '' : `<button type="button" class="ac-disc-act is-del" data-ac-del="${_acE(a.id)}" title="${_acE(_acT('ac_del_tip'))}">${_acE(_acT('ac_del'))}</button>`;
    return `<div class="ac-disc-row${a.risk ? ' has-risk' : ''}${a.kept ? '' : ' is-loose'}">
      <button type="button" class="ac-disc-go" data-ac-bring="${_acE(a.id)}" title="${_acE(a.question || '')}"><span class="ac-disc-n"><b>${_acE(a.name || '')}</b>${tags}</span><span class="ac-disc-m">${a.risk ? '<i class="ac-lg-ruby"></i>' : ''}${_acE(bits)}</span></button>
      ${keep || del ? `<span class="ac-disc-acts">${keep}${del}</span>` : ''}</div>`;
  };
  const packs = (AC.packs || []).map(p => `<button type="button" class="jb-chip" data-ac-pack="${_acE(p.id)}">${_acE(_acT('ac_pack_n', { name: p.name, n: (p.questions || []).length }))}</button>`).join('');
  const more = all
    ? `<button type="button" class="ac-disc-more" data-ac-disc-all="0">${_acE(_acT('ac_disc_fewer'))}</button>`
    : (AC.others ? `<button type="button" class="ac-disc-more" data-ac-disc-all="1">${_acE(_acTn('ac_disc_others', AC.others))}</button>` : '');
  return `<div class="pd-glance ac-card ac-disc" id="ac-disc"><div class="pd-gl-h"><b>${_acE(_acT('ac_disc_h'))}</b></div>
    <div class="pd-gl-b"><div class="ac-meta">${_acE(_acT(rows.length ? 'ac_disc_sub' : 'ac_disc_empty'))}</div>
      ${rows.length ? `<div class="ac-disc-list">${rows.map(row).join('')}</div>` : ''}
      ${more}
      ${packs ? `<div class="ac-l">${_acE(_acT('ac_disc_packs'))}</div><div class="ac-chips ac-next">${packs}</div>` : ''}
      <div class="ac-next"><button type="button" class="jb-chip" data-ac-open-new${may ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${_acE(_acT('ac_disc_new'))}</button>${rows.length ? `<button type="button" class="jb-chip" data-ac-reads="">${_acE(_acT('ac_th_every_read'))}</button>` : ''}</div>
    </div></div>`;
}
/* Discover leads the panel when the team keeps questions this reader can see answered */
function askColDiscoverLeads(){ return (AC.summary || []).some(a => a.read > 0 || a.fact); }
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
  if (typeof regRepaint === 'function') regRepaint();
  askColPaintPanel(); askColFactsPanelPaint();
}
/* a kept question brought onto the list: its answers fetched free, its column up (the oldest steps down past three) */
async function askColBring(askId){
  const R = regState();
  const up = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== askId);
  R.ask = up.concat(askId).slice(-AC_COLS_MAX);
  AC.chosen = null;
  await askColLoad(askId, askColShown().slice(0, 500));
  if (typeof regRepaint === 'function') regRepaint();
  askColPaintPanel();
}
/* CHOOSE WHICH OF THE PACK TO RUN (owner, 26 Oct 2026: "I should be able to
   choose which of the available company facts I want to run if I only want to
   run 3 out of the 5"). All are ticked to begin with; the cost and the button
   follow the ticks, and with none ticked the button greys with why. */
function askColPackPicked(f, i){ return !f.drop || !f.drop.has(i); }
function askColPackFormHtml(f){
  const p = f.pack, shown = askColShown();
  const qs = p.questions || [], q = qs.filter((x, i) => askColPackPicked(f, i)).length;
  const plan = askColPlan({ askIds: askColPackPlanIds(p, f) }); f.plan = plan;
  const cost = `<span class="ac-th">${askColSentenceHtml(plan, { pack: true, q })}</span>`;
  /* THE THREAD (28 Oct 2026): every ticked question read for every contract
     shown = nothing to spend; the kept answers are brought onto the list, free */
  const bring = askColMay() && shown.length && q && !plan.unread && !f.force;
  const why = !askColMay() ? _acT('ac_btn_viewer') : !shown.length ? _acT('ac_none_shown') : !q ? _acT('ac_pack_none_picked') : '';
  const row = (x, i) => {
    const on = askColPackPicked(f, i);
    return `<li><label class="ac-pick"><input type="checkbox" data-ac-pick="${i}"${on ? ' checked' : ''}><span><b>${_acE(x.name || '')}</b><span class="ac-meta">${_acE(x.question || '')}</span></span></label></li>`;
  };
  return `<div class="pd-glance ac-card" id="ac-form" data-ac-pack-form="${_acE(p.id)}"><div class="pd-gl-h"><b>${_acE(_acT('ac_pack_title'))}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(_acTn('ac_shown', shown.length))}</span></div>
    <div class="pd-gl-b"><div class="ac-pack-h"><b>${_acE(p.name)}</b><span class="ac-meta">${_acE(_acT('ac_pack_picked', { n: q, of: qs.length }))}</span></div>
      <ul class="ac-pack-qs">${qs.map(row).join('')}</ul>
      <div class="ac-cost">${cost}</div>
      ${why ? `<div class="ac-why">${_acE(why)}</div>` : ''}
      <div class="ac-acts">${bring ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-bring-pack="${_acE(askColPackAskIds(p, f).join(','))}">${_acE(_acT('ac_th_bring'))}</button>`
        : `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-ask${why ? ` disabled title="${_acE(why)}"` : ''}>${_acE(askColAskWords(plan))}</button>`}<button type="button" class="ui-btn ui-btn-sm" data-ac-cancel>${_acE(_acT('ac_cancel'))}</button></div>
    </div></div>`;
}
/* a pack's kept answers onto the list at once, one column per question, nothing spent */
async function askColBringMany(askIds){
  const R = regState(), ids = (askIds || []).filter(Boolean);
  if (!ids.length) return;
  const up = (Array.isArray(R.ask) ? R.ask : []).filter(x => !ids.includes(x));
  R.ask = up.concat(ids).slice(-AC_COLS_MAX);
  AC.chosen = null;
  const shown = askColShown().slice(0, 500);
  for (const id of ids) await askColLoad(id, shown);
  if (typeof regRepaint === 'function') regRepaint();
  askColPaintPanel();
}
function askColFormHtml(){
  const f = AC.form;
  if (f.pack) return askColPackFormHtml(f);
  const shown = askColShown();
  /* THE PLAN, SAID AS ONE SENTENCE (The thread, 28 Oct 2026): the next not yet read, with the choice inside it */
  const plan = askColPlan({ askId: f.force ? null : f.askId, force: !!f.force }); f.plan = plan;
  const cost = askColSentenceHtml(plan, { force: !!f.force });
  const up = askColIdsUp(), full = up.length >= AC_COLS_MAX && !up.includes(f.askId);
  const why = !askColMay() ? _acT('ac_btn_viewer') : !shown.length ? _acT('ac_none_shown') : full ? _acT('ac_full') : '';
  /* every one shown is read: the press brings the kept answers onto the list, free (nothing to read) */
  const bring = !plan.unread && !f.force && f.askId;
  /* a counting question kept before the rule of 26 Oct 2026 cannot be asked, so it is not listed (a chip that
     cannot give results is not drawn); the server's summary leaves it out too */
  const team = (AC.team || []).filter(a => !askColIsPortfolio(a.question)).slice(0, 6);
  return `<div class="pd-glance ac-card" id="ac-form"><div class="pd-gl-h"><b>${_acE(_acT('ac_title'))}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(_acTn('ac_shown', shown.length))}</span></div>
    <div class="pd-gl-b">
      <div><label class="ac-l" for="ac-q">${_acE(_acT('ac_q_label'))}</label><textarea id="ac-q" class="ac-in" rows="2" maxlength="300" placeholder="${_acE(_acT('ac_q_ph'))}">${_acE(f.question || '')}</textarea></div>
      <div class="ac-named" id="ac-named">${askColNamedHtml(f)}</div>
      <div class="ac-cost ac-th">${cost}</div>
      ${why ? `<div class="ac-why">${_acE(why)}</div>` : ''}
      <div class="ac-acts">${bring ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-bring="${_acE(f.askId)}">${_acE(_acT('ac_th_bring'))}</button>`
        : `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-ask${why ? ` disabled title="${_acE(why)}"` : ''}>${_acE(askColAskWords(plan))}</button>`}<button type="button" class="ui-btn ui-btn-sm" data-ac-cancel>${_acE(_acT('ac_cancel'))}</button></div>
      ${team.length ? `<div><div class="ac-l">${_acE(_acT('ac_team'))}</div><div class="ac-chips">${team.map(a => `<button type="button" class="ac-chip" data-ac-chip="${_acE(a.id)}" title="${_acE(a.question)}">${_acE(a.name)}</button>`).join('')}</div></div>` : ''}
    </div></div>`;
}
function askColStats(askId){
  const m = AC.ans[askId] || {}, ids = askColShown();
  const read = ids.map(id => [id, m[id]]).filter(([, a]) => a && !a.noWording);
  const found = read.filter(([, a]) => a.found).length;
  const unck = read.filter(([, a]) => !a.checked).map(([id]) => id);
  const last = read.map(([, a]) => a.at).filter(Boolean).sort().pop() || '';
  const calls = read.reduce((n, [, a]) => n + (Number(a.calls) || 0), 0);
  return { total: read.length, found, missing: read.length - found, unck, last, calls };
}
function askColColumnHtml(askId){
  const a = AC.asks[askId] || {}, s = askColStats(askId), G = askColGroups(askId), rows = askColGroupRows(askId, G);
  const p = askColPlan({ askId }), may = askColMay(), drawn = !!AC.drawn[askId], run = askColRunNow();
  const st = AC.stopped && AC.stopped.askId === askId ? AC.stopped : null;
  /* THE ANSWERS COME FIRST (the Legora way, as drawn): one row per different answer, its count, Show */
  const tally = rows.length ? `<div class="ac-tally">${rows.map(r => `<div class="ac-tl${AC.qWalk && AC.qWalk.askId === askId && AC.qWalk.key === r.key ? ' is-on' : ''}"><button type="button" class="ac-tl-b" data-ac-grp="${_acE(r.key)}" data-ac-grp-ask="${_acE(askId)}"><span class="ac-ans tone-${r.tone}"><i></i></span><b class="ac-tl-n">${r.ids.length}</b><span class="ac-tl-w">${_acE(r.label)}${r.names ? ` <span class="ac-tl-names">(${_acE(r.names)})</span>` : ''}</span></button><button type="button" class="ac-link" data-ac-grp-show="${_acE(r.key)}" data-ac-grp-ask="${_acE(askId)}">${_acE(_acT('ac_grp_show'))}</button></div>`).join('')}</div>` : '';
  /* ONE BUTTON reads more: the rest of a stopped read, else the next batch with its size; all read, Ask again */
  const w = p.unread ? askColNextWords(p.unread, acSize()) : null;
  const btn = st && may ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-carry>${_acE(_acTn('ac_carry_on', st.left.length, { calls: _acTn('ac_n_calls', st.left.length) }))}</button>`
    : w ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-next="${_acE(askId)}" data-ac-n="${w.n}" title="${_acE(_acT('ac_th_next_title'))}"${may ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${_acE(w.label)}</button>${p.unread > AC_SIZES[0] ? askColPillHtml(acSize(), 'data-ac-size') : ''}`
    : `<button type="button" class="ui-btn ui-btn-sm" data-ac-again="${_acE(askId)}"${may ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${_acE(_acT('ac_again'))}</button>`;
  /* THREE LINKS used most, the rest under More… (one list, Remove last) */
  const keep = !a.fact && !a.kept && may ? `<button type="button" class="ac-link" data-ac-keep="${_acE(askId)}" data-ac-on="0">${_acE(_acT('ac_keep_on'))}</button>` : '';
  /* THE FULL REPORT (owner, 26 Oct 2026: the door on every column): beside the links while several questions
     stand on the list, where it compares them; under More… while one does */
  const many = askColIdsUp().length > 1;
  const report = run ? `<button type="button" class="ac-link" data-ac-table>${_acE(_acT('ac_tt_open'))}</button>` : '';
  const links = s.total ? `<div class="ac-col-links"><button type="button" class="ac-link" data-ac-draw="${_acE(askId)}" aria-pressed="${drawn ? 'true' : 'false'}">${_acE(_acT(drawn ? 'ac_chip_undraw' : 'ac_chip_draw'))}</button><button type="button" class="ac-link" data-ac-copy="${_acE(askId)}">${_acE(_acT('ac_chip_copy'))}</button>${keep}${many ? report : ''}<button type="button" class="ac-link" data-ac-more="${_acE(askId)}" aria-expanded="${AC.moreOpen === askId ? 'true' : 'false'}">${_acE(_acT('ac_col_more'))}</button></div>` : '';
  const fact = !a.fact && askColIsAdmin() ? `<button type="button" class="ac-link" data-ac-fact="${_acE(askId)}">${_acE(_acT('ac_fact_keep'))}</button>` : '';
  const watch = askColWatchChipHtml(askId).replace(/class="jb-chip"/, 'class="ac-link"');
  const more = AC.moreOpen === askId ? `<div class="ac-col-more" role="menu">${fact}${watch}${many ? '' : report}<button type="button" class="ac-link" data-ac-reads="${_acE(askId)}">${_acE(_acT('ac_th_every_read'))}</button><button type="button" class="ac-link" data-ac-save="${_acE(askId)}">${_acE(_acT('ac_save_view'))}</button>${w || st ? `<button type="button" class="ac-link" data-ac-again="${_acE(askId)}"${may ? '' : ' disabled'}>${_acE(_acT('ac_again'))}</button>` : ''}<button type="button" class="ac-link is-danger" data-ac-remove="${_acE(askId)}">${_acE(_acT('ac_remove'))}</button></div>` : '';
  const ck = s.total ? `<div class="ac-ckline">${_acE(_acT('ac_checked_line', { n: s.total - s.unck.length, total: s.total }))}${s.unck.length ? ` · <button type="button" class="ac-link" data-ac-unck="${_acE(askId)}">${_acE(_acTn('ac_show_unck', s.unck.length))}</button>` : ''}</div>` : '';
  return `<div class="pd-glance ac-card ac-col is-open" data-ac-col="${_acE(askId)}">
    <button type="button" class="ac-col-h" data-ac-qopen="${_acE(askId)}" aria-expanded="true" title="${_acE(_acT('ac_col_fold'))}"><span class="ac-dk-eb">${_acE(_acT('ac_desk_eb', { name: a.name || '' }))}</span><span class="ac-col-q">${_acE(a.question || a.name || '')}</span></button>
    ${askColSayHtml(askId)}${askColCountLineHtml(askId)}
    ${rows.length ? askColGroupBarHtml(askId, rows, p.shown) : ''}${tally}${askColQuoteHtml(askId, rows)}
    <div class="ac-col-go">${btn}</div>
    ${drawn ? askColDrawHtml(askId) : ''}${links}${more}${ck}
  </div>`;
}
/* a question folded: its name, how far it is read, its answers in colour; pressed, it opens */
function askColFoldHtml(askId){
  const a = AC.asks[askId] || {}, p = askColPlan({ askId }), rows = askColGroupRows(askId);
  const counts = rows.slice(0, 3).map(r => `<span class="ac-fd-c"><span class="ac-ans tone-${r.tone}"><i></i></span>${r.ids.length} ${_acE(r.label)}</span>`).join('');
  return `<button type="button" class="ac-col-fold" data-ac-qopen="${_acE(askId)}" data-ac-col-fold="${_acE(askId)}" aria-expanded="false"><span class="ac-fd-h"><b>${_acE(a.name || '')}</b><span class="ac-fd-n">${_acE(_acT('ac_col_read_of', { read: p.read, total: p.shown }))} ›</span></span>${askColGroupBarHtml(askId, rows, p.shown, 'is-mini')}${counts ? `<span class="ac-fd-cs">${counts}</span>` : ''}</button>`;
}
function askColProgressHtml(askId){
  const p = askColPlan({ askId });
  if (!p.shown) return '';
  if (!AC.reads) askColReads().then(() => { if (askColOn() && !AC.form && !AC.busy) askColPaintPanel(); });
  const last = askColLastRead(askId), risk = askColAtRisk(askId).length;
  const pct = Math.round(p.read / p.shown * 100);
  const who = last ? _acT('ac_th_by', { by: last.by || '', when: askColWhen(last.last || last.at) }) : '';
  /* ONE BUTTON (the owner picked it, 28 Oct 2026): the line says read and
     still to read; one button sized to what is left; all read, it says so */
  const left = p.unread, size = acSize(), w = askColNextWords(left, size);
  const line = left
    ? [_acT('ac_th_prog2', { read: p.read, total: p.shown }), `<b class="ac-th-left">${_acE(_acTn('ac_th_left', left))}</b>`, risk ? _acE(_acTn('ac_disc_risk', risk)) : '', _acE(who)].filter(Boolean).join(' · ')
    : [`<b class="ac-th-done">${_acE(_acT('ac_th_done', { total: p.shown }))}</b>`, risk ? _acE(_acTn('ac_disc_risk', risk)) : '', _acE(who)].filter(Boolean).join(' · ');
  const plain = line.replace(/<[^>]+>/g, '');
  const next = left
    ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-next="${_acE(askId)}" data-ac-n="${w.n}" title="${_acE(_acT('ac_th_next_title'))}">${_acE(w.label)}</button>${left > AC_SIZES[0] ? askColPillHtml(size, 'data-ac-size') : ''}`
    : '';
  return `<div class="ac-th-prog" data-ac-prog="${_acE(askId)}"><div class="ac-prog" role="img" aria-label="${_acE(plain)}"><i style="width:${pct}%"></i></div><div class="ac-meta">${line}</div>
    <div class="ac-chips ac-next">${next}<button type="button" class="jb-chip" data-ac-reads="${_acE(askId)}">${_acE(_acT('ac_th_every_read'))}</button></div></div>`;
}
/* the one button's words, shared with the Reads page: the rest when it fits a press, else the next batch and what is left after */
function askColNextWords(left, size){
  const sz = Number(size) || acSize();
  if (left <= sz) return { n: left, label: _acT('ac_th_btn_rest', { n: left, calls: _acTn('ac_n_calls', left) }), rest: true };
  return { n: sz, label: _acT('ac_th_btn_more', { n: sz, after: left - sz }), rest: false };
}
/* THE NEXT BATCH, FROM THE LINK (the cost is on the link): the same engine, the same door as Carry on */
async function askColNext(askId, n){
  if (AC.busy || !askColMay()) return;
  if (AC_SIZES.includes(Number(n))) acSizeSet(n);   /* "the remaining 20" is a count, not a choice of size */
  await askColSummary(); await askColTeam();
  const a = AC.asks[askId]; if (!a) return;
  await askColLoad(askId, askColShown().slice(0, 500));
  const p = askColPlan({ askId, size: n }); if (!p.pick.length) return;
  AC.form = null; AC.chosen = null;
  await askColReadAndSay({ question: a.question, name: a.name, run: askColRunId(p) }, p.pick, a.name, asks => {
    const id = asks[0] && asks[0].id; if (!id) return;
    const R = regState(); R.ask = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== id).concat(id).slice(-AC_COLS_MAX);
  });
}
/* THE WHOLE TABLE FOR THESE QUESTIONS, from another page (the Reads page's "Open the table"): the kept
   answers for the list shown are fetched free, the first column brought up, and the Ledger opened */
async function askColTableFor(askIds, name){
  const ids = (askIds || []).filter(Boolean); if (!ids.length || !askColOn()) return false;
  await askColSummary(); await askColTeam();
  const shown = askColShown().slice(0, 500);
  await Promise.all(ids.map(id => askColLoad(id, shown)));
  const R = regState(); R.ask = (Array.isArray(R.ask) ? R.ask : []).filter(x => !ids.includes(x)).concat(ids).slice(-AC_COLS_MAX);
  AC.packRun = { packId: '', name: name || (AC.asks[ids[0]] || {}).name || '', askIds: ids };
  if (typeof regRepaint === 'function') regRepaint();
  askColPaintPanel(); askColTableOpen();
  return true;
}
/* THE COLUMN'S LATER STEPS: keep it as a company fact (an admin's, stage 4); watch it (stage 5) */
function askColIsAdmin(){ const u = (typeof currentUser === 'function') ? currentUser() : null; return !!(u && u.role === 'admin'); }
function askColMoreChipsHtml(askId){
  const a = AC.asks[askId] || {};
  const fact = !a.fact && askColIsAdmin() ? `<button type="button" class="jb-chip" data-ac-fact="${_acE(askId)}">${_acE(_acT('ac_fact_keep'))}</button>` : '';
  /* KEEP IN DISCOVER (owner, 26 Oct 2026): the one press that puts a question
     on the team's list. A company fact is kept by being a fact. */
  const keep = !a.fact && !a.kept && askColMay() ? `<button type="button" class="jb-chip" data-ac-keep="${_acE(askId)}" data-ac-on="0">${_acE(_acT('ac_keep_on'))}</button>` : '';
  return keep + fact + askColWatchChipHtml(askId);
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
/* ---- WATCHES ON ANSWERS (stage 5, owner 25 Oct 2026: on company facts only, free to run) ----
   One of Jambo's watches (/api/me/watches, kind 'answer'): when a contract read for the fact
   answers at risk, it lands on Needs you and the bell, and its press lands on the clause. */
function askColWatchOf(askId){
  const all = (typeof watchesAll === 'function') ? watchesAll() : [];
  return all.find(w => w && w.kind === 'answer' && !w.endedAt && w.params && w.params.askId === askId) || null;
}
function askColRowTagsHtml(a){ return a && askColWatchOf(a.id) ? `<span class="ac-tag">${_acE(_acT('ac_disc_watched'))}</span>` : ''; }
function askColWatchChipHtml(askId){
  const a = AC.asks[askId] || {};
  if (!a.fact || typeof watchCreate !== 'function') return '';
  const w = askColWatchOf(askId);
  return w ? `<button type="button" class="jb-chip" data-ac-unwatch="${_acE(w.id)}">${_acE(_acT('ac_watch_stop'))}</button>`
    : `<button type="button" class="jb-chip" data-ac-watch="${_acE(askId)}">${_acE(_acT('ac_watch_on'))}</button>`;
}
async function askColWatch(askId, on, wid){
  try {
    if (on){ await watchCreate({ kind: 'answer', params: { askId } }); if (typeof toast === 'function') toast(_acT('ac_watch_started', { name: (AC.asks[askId] || {}).name || '' }), 'ok'); }
    else { await watchDelete(wid); if (typeof toast === 'function') toast(_acT('ac_watch_stopped'), 'ok'); }
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  askColPaintPanel();
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
/* DRAW IT: the column's answers as bars, one per answer group in its own colour, from the answers already read (no call) */
function askColDrawHtml(askId){
  const G = askColGroups(askId), q = AC.asks[askId] || {};
  const rows = askColGroupRows(askId, G);
  const max = Math.max(1, ...rows.map(r => r.ids.length));
  const bar = r => `<div class="ac-bar"><span>${_acE(r.label)}</span><span class="ac-bar-t"><i class="ac-lg-${r.tone}" style="width:${Math.round(r.ids.length / max * 100)}%"></i></span><b>${r.ids.length}</b></div>`;
  return `<div class="ac-draw" role="img" aria-label="${_acE(_acT('ac_draw_h', { name: q.name || '', n: G.total }))}"><div class="ac-meta">${_acE(_acT('ac_draw_h', { name: q.name || '', n: G.total }))}</div>${rows.map(bar).join('')}<div class="ac-meta">${_acE(_acT('ac_draw_free'))}</div></div>`;
}
/* COPY THE TABLE: the list's rows with this column, each answer with its clause and sentence, as a table a mail or a sheet takes */
function askColCopy(askId){ return askColCopyMany([askId]); }
async function askColCopyMany(askIds, only){
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
  const tsv = [head].concat(rows).map(r => r.map(x => String(x).replace(/[\t\n]+/g, ' ')).join('\t')).join('\n');
  const html = '<table>' + [head].concat(rows).map((r, i) => '<tr>' + r.map(x => `<${i ? 'td' : 'th'}>${_acE(x)}</${i ? 'td' : 'th'}>`).join('') + '</tr>').join('') + '</table>';
  try {
    if (typeof ClipboardItem === 'function' && navigator.clipboard && navigator.clipboard.write)
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([tsv], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
    else await navigator.clipboard.writeText(tsv);
    if (typeof toast === 'function') toast(_acT('ac_copied'), 'ok');
  } catch (_){ if (typeof toast === 'function') toast(_acT('ac_copy_failed'), 'warn'); }
}
/* THE SAP WAY (owner picked it, 20 Oct 2026): the chosen answer as labelled facts */
function askColWhyHtml(ch){
  const a = (AC.ans[ch.askId] || {})[ch.cid] || null, q = AC.asks[ch.askId] || {};
  const c = (typeof getContract === 'function') ? getContract(ch.cid) : null;
  const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : ch.cid;
  const head = [ref, c && c.counterparty].filter(Boolean).join(' · ');
  if (!a) return '';
  const word = a.noWording ? _acT('ac_no_wording') : a.found ? [a.answer, a.detail].filter(Boolean).join(', ') : _acT('ac_not_found');
  const num = askColClauseNo(a);
  const go = num ? _acT('ac_go_clause', { n: num }) : _acT('ac_go_it');
  const row = (k, v) => v ? `<dt>${_acE(_acT(k))}</dt><dd>${v}</dd>` : '';
  /* THE TICK LIVES HERE NOW (Lights, 26 Oct 2026): it came out of the cell,
     where it squeezed the answer, and stands with the reading it belongs to —
     one door still, in the panel that reads the chosen row */
  const ck = a.checked, may = askColMay();
  const tip = !may ? _acT('ac_mark_viewer') : ck ? _acT('ac_unmark', { who: ck.by, when: askColWhen(ck.at) }) : _acT('ac_mark');
  const tick = `<button type="button" class="ac-ck-row${ck ? ' on' : ''}" data-ac-ck aria-pressed="${ck ? 'true' : 'false'}" title="${_acE(tip)}"${may ? '' : ' disabled'}><span class="ac-ck${ck ? ' on' : ''}">${ck && typeof icon === 'function' ? icon('check2', 'ac-ck-i') : ''}</span>${_acE(ck ? _acT('ac_checked_by_when', { who: ck.by, when: askColWhen(ck.at) }) : _acT('ac_mark'))}</button>`;
  return `<div class="pd-glance ac-card ac-why-card" data-ac-why="${_acE(ch.askId)}:${_acE(ch.cid)}"><div class="pd-gl-h"><b>${_acE(head)}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(q.name || '')}</span></div>
    <div class="pd-gl-b"><dl class="ac-fl">
      ${row('ac_f_answer', `<span class="ac-ans tone-${askColToneOf(a, ch.askId)}"><i></i><b>${_acE(word)}</b></span>`)}
      ${row('ac_f_why', a.why ? _acE(a.why) : '')}
      ${row('ac_f_source', a.quote ? `<div class="ac-quote">“${_acE(a.quote)}”</div>` : (a.noWording ? '' : `<span class="ac-sub">${_acE(_acT('ac_no_quote'))}</span>`))}
      ${row('ac_f_clause', a.clause ? _acE(a.clause) : '')}
      ${a.noWording || !a.found ? '' : row('ac_f_rule', _acE(a.verdict === 'in' ? _acT('ac_rule_in', { rule: a.rule }) : a.verdict === 'out' ? _acT('ac_rule_out', { rule: a.rule }) : a.rule ? _acT('ac_rule_unsure', { rule: a.rule }) : _acT('ac_rule_none')))}
      ${row('ac_f_read', a.at ? _acE(_acT('ac_read_by', { when: askColWhen(a.at) })) : '')}
      ${a.noWording ? '' : row('ac_f_checked', tick)}
    </dl>
    <div class="ac-acts ac-foot"><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-go>${_acE(go)}</button></div></div></div>`;
}
/* A REPAINT KEEPS WHAT IS BEING TYPED (22 Oct 2026): the form paints again when
   the team's questions arrive; the box being typed in keeps its words, its
   focus and its caret, so a person mid-word loses nothing */
function askColPaintPanel(){
  askColGroupsForget();
  if (typeof renderIntelDock !== 'function') return;
  const a = (typeof document !== 'undefined') ? document.activeElement : null;
  const typing = a && (a.id === 'ac-q' || a.id === 'ac-name') ? { id: a.id, v: a.value, s: a.selectionStart, e: a.selectionEnd } : null;
  if (typing && AC.form){ if (typing.id === 'ac-q') AC.form.question = typing.v; else AC.form.name = typing.v; }
  renderIntelDock();
  if (!typing) return;
  const b = document.getElementById(typing.id);
  if (!b || b === a) return;
  b.value = typing.v;
  try { b.focus({ preventScroll: true }); b.setSelectionRange(typing.s, typing.e); } catch (_){}
}

/* ---- THE ACTS ---- */
async function askColOpen(seed){
  const f = { question: '', name: '', askId: null, force: false, kept: 0, ...(seed || {}) };
  AC.form = f; AC.chosen = null; AC.count = null;
  askColPaintPanel();
  /* the question box is ready at once; never taken back from a box the reader has moved to */
  setTimeout(() => { const q = document.getElementById('ac-q'), at = document.activeElement; if (q && !q.value && !(at && at.closest && at.closest('#ac-form'))) q.focus(); }, 0);
  /* the team's questions, fresh each time the form opens (a colleague's, or one asked a moment ago) */
  await askColTeam(); if (AC.form === f) askColPaintPanel();
  if ((f.askId || f.pack) && !f.force) await askColKept(f);
}
/* the answers already kept for a question chosen from the team's: they cost nothing */
async function askColKept(f){
  /* every contract shown, so the plan can say how many are already read (the answers route holds 500) */
  const ids = askColShown().slice(0, 500);
  if (f.pack){ await askColSummary(); await Promise.all(askColPackAskIds(f.pack).map(id => askColLoad(id, ids))); }
  else {
    await askColLoad(f.askId, ids);
    const m = AC.ans[f.askId] || {};
    f.kept = ids.filter(id => m[id]).length;
  }
  if (AC.form === f) askColPaintPanel();
}
function askColClose(){ AC.form = null; askColPaintPanel(); }
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
  AC.busy = { total: ids.length, done: 0, ids: [], stop: false, name: o.name || '', calls: 0, seen: [], queue: [], queued: new Set(), cur: null, curAt: 0, doneIds: [], askId: null, asks: [],
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
    if (typeof regRepaint === 'function') regRepaint();
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
    if (typeof regRepaint === 'function') regRepaint();
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
  if (typeof regRepaint === 'function') regRepaint();
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
}
async function askColRunPack(f){
  const p = f.pack;
  const picked = (p.questions || []).filter((x, i) => askColPackPicked(f, i));
  const plan = (f.plan && f.plan.pick.length) ? f.plan : askColPlan({ askIds: askColPackPlanIds(p, f) });
  const ids = plan.pick; if (!ids.length || !picked.length) return;
  const base = { questions: picked.map(x => ({ question: x.question, name: x.name })), pack: p.id, run: askColRunId(plan) };
  AC.form = null;
  const got = await askColReadRun(base, ids, { name: p.name, onFirst: asks => {
    /* THREE STAND ON THE LIST, THE REST IN THE TABLE (the owner's pick, 25 Oct 2026) */
    const askIds = asks.map(a => a.id);
    regState().ask = askIds.slice(0, AC_COLS_MAX);
    AC.packRun = { packId: p.id, name: p.name, askIds };
  } });
  askColRunEnd(got, base, p.name);
  if (!got.stopped && !got.err && typeof toast === 'function')
    toast(_acT('ac_pack_done', { name: p.name, q: (AC.packRun && AC.packRun.askIds.length) || picked.length, calls: _acTn('ac_n_calls', got.calls) }), 'ok');
}
/* THE WHOLE TABLE, A PAGE OF ITS OWN (big work is a page): every answer of the pack, per contract, with its clause */
/* THE LEDGER (the owner picked it, 26 Oct 2026: "this table should be better
   designed and tidy for professionals"). One framed card with a real head: what
   was read and when, the acts in one row; the contract column stands still
   while the answers scroll; every cell keeps the same two-line rhythm, the
   verdict and its clause over the words it was read from; the at-risk count
   sits in the head of the column it belongs to and the legend in the foot. */
function askColTableRowsAtRisk(ids, askIds){
  return ids.filter(cid => askIds.some(id => { const a = (AC.ans[id] || {})[cid]; return a && !a.noWording && askColToneOf(a) === 'ruby'; }));
}
/* THE RUN THE FULL REPORT COVERS (owner, 26 Oct 2026: "when you have 3 columns
   or company facts that you run … you do not get the full report … They should
   all have the door to the full report"). A pack's read answers more questions
   than the three columns the list can hold, so its own run wins and the report
   carries all of them. Columns asked one at a time have no pack behind them:
   the report is then the columns standing on the list, which is what the reader
   is looking at. Either way every column's card carries the one door. */
function askColRunNow(){
  const run = AC.packRun;
  const up = askColIdsUp();
  if (run && run.askIds.length && up.some(id => run.askIds.includes(id))) return run;
  if (!up.length) return null;
  return { packId: '', name: _acT('ac_tt_name'), askIds: up };
}
function askColTableInner(){
  const run = askColRunNow(); if (!run) return '';
  const all = askColShown(), risky = askColTableRowsAtRisk(all, run.askIds);
  const ids = AC.tableRisk ? risky : all;
  const head = run.askIds.map(id => {
    const n = all.filter(cid => { const a = (AC.ans[id] || {})[cid]; return a && !a.noWording && askColToneOf(a) === 'ruby'; }).length;
    return `<th scope="col"><span class="ac-tt-hn">${_acE((AC.asks[id] || {}).name || '')}</span>${n ? `<span class="ac-th-risk">${_acE(_acTn('ac_disc_risk', n))}</span>` : ''}</th>`;
  }).join('');
  const body = ids.map(cid => {
    const c = (typeof getContract === 'function') ? getContract(cid) : null;
    const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : cid;
    const cells = run.askIds.map(id => {
      const a = (AC.ans[id] || {})[cid];
      if (!a) return `<td class="ac-tt-c"><span class="ac-ans tone-none is-wait"><i></i><span>${_acE(_acT("ac_not_read"))}</span></span></td>`;
      const no = a.found ? askColClauseNo(a) : '';
      const word = a.noWording ? _acT('ac_no_wording') : a.found ? a.answer : _acT('ac_not_found');
      const sub = [a.detail, a.found ? askColQuoteShort(a) : ''].filter(Boolean).join(' · ');
      return `<td class="ac-tt-c"><span class="ac-ans tone-${askColToneOf(a, id)}"><i></i><span class="ac-tt-w">${_acE(word)}</span>${no ? `<span class="ac-cite">§ ${_acE(no)}</span>` : ''}</span>${sub ? `<small class="ac-sub">${_acE(sub)}</small>` : ''}</td>`;
    }).join('');
    return `<tr><th scope="row" class="ac-tt-a"><b>${_acE(ref)}</b><small class="ac-sub">${_acE([(c && c.name) || '', (c && c.counterparty) || ''].filter(Boolean).join(' · '))}</small></th>${cells}</tr>`;
  }).join('');
  const last = run.askIds.map(id => askColStats(id).last).filter(Boolean).sort().pop() || '';
  const calls = run.askIds.reduce((n, id) => n + askColStats(id).calls, 0);
  const answers = run.askIds.reduce((n, id) => n + askColStats(id).total, 0);
  const sub = [_acTn('ac_pack_q', run.askIds.length), _acTn('ac_tt_answers', answers),
    risky.length ? `<b class="ac-tt-risk">${_acE(_acTn('ac_disc_risk', risky.length))}</b>` : '',
    last ? _acE(_acT('ac_read_at', { when: askColWhen(last) })) : '', calls ? _acE(_acTn('ac_n_calls', calls)) : ''].filter(Boolean).join(' · ');
  return `<div class="ac-tt-card">
    <div class="ac-tt-top"><div class="ac-tt-ttl"><h2>${_acE(_acT('ac_table_title', { name: run.name }))}</h2><div class="ac-tt-sub">${sub}</div></div></div>
    <div class="ac-tt-scroll"><table class="ac-tt-table"><thead><tr><th scope="col" class="ac-tt-a">${_acE(_acT('ac_tt_contract'))}</th>${head}</tr></thead><tbody>${body}</tbody></table></div>
    ${ids.length ? '' : `<p class="ac-tt-none">${_acE(_acT('ac_tt_none'))}</p>`}
    <div class="ac-tt-foot"><span class="ac-legend">${askColLegendInner()}</span><span class="ac-meta">${_acE(_acT('ac_tt_hint'))}</span></div>
  </div>`;
}
function askColTablePaint(){
  const host = (typeof document !== 'undefined') ? document.getElementById('ac-tt-body') : null;
  if (host) host.innerHTML = askColTableInner();
  const r = document.getElementById('ac-tt-risk');
  if (r){ r.setAttribute('aria-pressed', AC.tableRisk ? 'true' : 'false'); r.classList.toggle('is-on', !!AC.tableRisk); }
}
function askColTableOpen(){
  const run = askColRunNow(); if (!run || typeof openModal !== 'function') return;
  AC.tableRisk = false;
  const title = _acT('ac_table_title', { name: run.name });
  const risky = askColTableRowsAtRisk(askColShown(), run.askIds).length;
  const html = `<div id="ac-table-page" class="ac-tt">
    <div class="ac-tt-pacts">${risky ? `<button type="button" id="ac-tt-risk" class="ui-btn ui-btn-sm" aria-pressed="false">${_acE(_acTn('ac_tt_only_risk', risky))}</button>` : ''}
      <button type="button" id="ac-tt-copy" class="ui-btn ui-btn-sm">${_acE(_acT('ac_chip_copy'))}</button>
      <button type="button" id="ac-tt-back" class="ui-btn ui-btn-sm" data-dlg-cancel>${_acE(_acT('ac_table_back'))}</button></div>
    <div id="ac-tt-body">${askColTableInner()}</div></div>`;
  openModal(html, { page: { acts: ['ac-tt-risk', 'ac-tt-copy', 'ac-tt-back'], crumb: title }, label: title });
  const cp = document.getElementById('ac-tt-copy');
  if (cp) cp.addEventListener('click', () => askColCopyMany(run.askIds));
  const rk = document.getElementById('ac-tt-risk');
  if (rk) rk.addEventListener('click', () => { AC.tableRisk = !AC.tableRisk; askColTablePaint(); });
  const back = document.getElementById('ac-tt-back');
  if (back) back.addEventListener('click', () => { if (typeof closeModal === 'function') closeModal(); });
}
async function askColRun(){
  const f = AC.form; if (!f || AC.busy) return;
  if (f.pack) return askColRunPack(f);
  const qEl = document.getElementById('ac-q'), nEl = document.getElementById('ac-name');
  const question = String(qEl ? qEl.value : f.question || '').trim();
  /* the name the form said (askColNameOf) is the name sent, unless the reader changed it */
  const name = String(nEl ? nEl.value : f.name || '').trim() || askColNameOf(String(qEl ? qEl.value : f.question || ''));
  if (question.length < 3){ askColSay(_acT('ac_q_short')); return; }
  /* A COLUMN ASKS THE WORDING (owner, 26 Oct 2026): a counting question is
     about the reader's own book, not about what a contract says — it is handed
     to Jambo's box, free, and never kept as a column. The server is the wall;
     this is the sentence the reader sees before a call is spent. */
  if (askColIsPortfolio(question)){ askColCountOpen(question); return; }
  /* THE NEXT NOT YET READ (The thread): a typed question that is not the team's reads the first `size` shown */
  const p = askColPlan({ askId: f.force ? null : f.askId, force: !!f.force }); if (!p.pick.length) return;
  f.question = question; f.name = name;
  const base = { question, name, force: !!f.force, run: askColRunId(p) };
  AC.form = null;
  await askColReadAndSay(base, p.pick, name || question, asks => {
    const id = asks[0] && asks[0].id; if (!id) return;
    const R = regState();
    R.ask = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== id).concat(id).slice(-AC_COLS_MAX);
  });
}
/* one read, then its end said: the column up, the record kept, the rest offered (Stop) or the toast */
async function askColReadAndSay(base, ids, name, onFirst){
  const got = await askColReadRun(base, ids, { name, onFirst });
  const named = (got.asks[0] && got.asks[0].name) || name;
  askColRunEnd(got, base, named);
  if (!got.stopped && !got.err && typeof toast === 'function') toast(askColDoneSay(named, got), 'ok');
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
/* PRESS IT AGAIN AND IT CLOSES: a second press on the chosen answer lets it go */
function askColChoose(askId, cid){
  AC.form = null;
  AC.chosen = (AC.chosen && AC.chosen.askId === askId && AC.chosen.cid === cid) ? null : { askId, cid };
  askColMarkRows();
  askColPaintPanel();
}
function askColMarkRows(){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('td.ac-cell.is-on').forEach(td => td.classList.remove('is-on'));
  document.querySelectorAll('tr.ac-row-on').forEach(tr => tr.classList.remove('ac-row-on'));
  const ch = AC.chosen; if (!ch) return;
  const td = document.querySelector(`td.ac-cell[data-ac="${CSS.escape(ch.askId)}"][data-ac-cid="${CSS.escape(ch.cid)}"]`);
  if (td){ td.classList.add('is-on'); const tr = td.closest('tr'); if (tr) tr.classList.add('ac-row-on'); }
}
async function askColCheck(askId, cid){
  if (!askColMay()) return;
  const a = (AC.ans[askId] || {})[cid]; if (!a) return;
  try {
    const r = await api(`columns/${encodeURIComponent(askId)}/check`, 'POST', { contractId: cid, checked: !a.checked });
    if (r && r.answer) AC.ans[askId][cid] = r.answer;
  } catch (e){ if (typeof toast === 'function') toast((e && e.message) || '', 'err'); }
  if (typeof regRepaint === 'function') regRepaint();
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
function askColUnchecked(askId){
  const s = askColStats(askId), q = AC.asks[askId] || {};
  if (s.unck.length && typeof regShowOnly === 'function') regShowOnly(s.unck, _acT('ac_unck_label', { name: q.name || '' }));
}
async function askColSave(){ if (typeof regSaveViewAsk === 'function') await regSaveViewAsk(); }
function askColRemove(askId){
  askColDrop(askId);
  if (typeof regRepaint === 'function') regRepaint();
  askColPaintPanel();
}

/* ---- THE PRESSES, DELEGATED ONCE (the list and the panel are redrawn under them) ---- */
if (typeof document !== 'undefined' && !document._acWired){
  document._acWired = true;
  /* capture: a press on an answer chooses it and never opens the row's contract */
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const td = t.closest('td.ac-cell');
    if (td){
      /* LIGHTS (26 Oct 2026): the cell holds one thing, so a press on it means
         one thing — choose this answer, and let the panel read it out */
      e.stopPropagation(); e.preventDefault();
      askColChoose(td.getAttribute('data-ac'), td.getAttribute('data-ac-cid'));
      return;
    }
    /* a question's column head on the list opens that question in the panel (the sort goes on as before) */
    const th = t.closest('th[data-ac-th]');
    if (th){ const id = th.getAttribute('data-ac-th'); if (id && AC.openQ !== id){ AC.openQ = id; AC.chosen = null; setTimeout(() => askColPaintPanel(), 0); } }
  }, true);
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-ac-open]')){ e.preventDefault();
      if (!askColMay()){ askColBtnFix(); if (typeof toast === 'function') toast(_acT('ac_btn_viewer'), 'warn'); return; }
      if (AC.form) askColClose(); else askColOpen(); return; }
    if (t.closest('[data-ac-ask]')){ e.preventDefault(); askColRun(); return; }
    if (t.closest('[data-ac-count-turn]')){ e.preventDefault(); askColCountTurn(); return; }
    if (t.closest('[data-ac-count-go]')){ e.preventDefault(); askColCountGo(); return; }
    if (t.closest('[data-ac-count-change]')){ e.preventDefault(); const k = AC.count; AC.count = null;
      if (AC.form && k) AC.form.question = k.question || k.typed; askColPaintPanel();
      const q = document.getElementById('ac-q'); if (q && typeof fieldFocus === 'function') fieldFocus(q); return; }
    if (t.closest('[data-ac-count-show]')){ e.preventDefault(); const k = AC.count; if (k && k.ids) askColCountShow(k.ids, k.what || k.typed); return; }
    { const y = t.closest('[data-ac-count-yes]'); if (y){ e.preventDefault(); const id = y.getAttribute('data-ac-count-yes'), c = askColCountOf(id);
      if (c) askColCountShow(c.yes, `${((AC.asks[id] || {}).name) || ''}: ${c.says}`.replace(/^: /, '')); return; } }
    if (t.closest('[data-ac-cancel]')){ e.preventDefault(); askColClose(); return; }
    if (t.closest('[data-ac-stop]')){ e.preventDefault(); askColStop(); return; }
    /* SEVERAL QUESTIONS, ONE OPEN: a folded line opens; the open one's head folds it */
    { const q = t.closest('[data-ac-qopen]'); if (q){ e.preventDefault(); const id = q.getAttribute('data-ac-qopen');
      const up = askColIdsUp(); AC.openQ = askColOpenQ(up) === id && !AC.busy ? '' : id; AC.chosen = null; AC.moreOpen = null; askColPaintPanel(); return; } }
    /* an answer group pressed: its quote under the list; Show puts just its contracts on the list */
    { const g = t.closest('[data-ac-grp]'); if (g){ e.preventDefault(); AC.qWalk = { askId: g.getAttribute('data-ac-grp-ask'), key: g.getAttribute('data-ac-grp'), i: 0 }; askColPaintPanel(); return; } }
    { const g = t.closest('[data-ac-grp-show]'); if (g){ e.preventDefault(); const askId = g.getAttribute('data-ac-grp-ask'), key = g.getAttribute('data-ac-grp-show');
      const r = askColGroupRows(askId).find(x => x.key === key);
      if (r && r.ids.length) askColCountShow(r.ids, `${(AC.asks[askId] || {}).name || ''}: ${r.label}`); return; } }
    { const q = t.closest('[data-ac-qstep]'); if (q){ e.preventDefault(); const askId = q.getAttribute('data-ac-q-ask'), rows = askColGroupRows(askId), W = askColQuoteWalk(askId, rows);
      if (W.row && W.ids.length){ AC.qWalk = { askId, key: W.row.key, i: (W.i + Number(q.getAttribute('data-ac-qstep')) + W.ids.length) % W.ids.length }; askColPaintPanel(); } return; } }
    { const q = t.closest('[data-ac-qgo]'); if (q){ e.preventDefault(); askColChoose(q.getAttribute('data-ac-q-ask'), q.getAttribute('data-ac-qgo')); return; } }
    { const m = t.closest('[data-ac-more]'); if (m){ e.preventDefault(); const id = m.getAttribute('data-ac-more'); AC.moreOpen = AC.moreOpen === id ? null : id; askColPaintPanel(); return; } }
    if (t.closest('[data-ac-carry]')){ e.preventDefault(); askColCarryOn(); return; }
    if (t.closest('[data-ac-stopped-close]')){ e.preventDefault(); AC.stopped = null; askColPaintPanel(); return; }
    const kp = t.closest('[data-ac-keep]'); if (kp){ e.preventDefault(); askColKeep(kp.getAttribute('data-ac-keep'), kp.getAttribute('data-ac-on') !== '1'); return; }
    const dl = t.closest('[data-ac-del]'); if (dl){ e.preventDefault(); askColDelete(dl.getAttribute('data-ac-del')); return; }
    const da = t.closest('[data-ac-disc-all]');
    if (da){ e.preventDefault(); AC.discAll = da.getAttribute('data-ac-disc-all') === '1'; _acSumAt = 0; askColSummary(true).then(() => askColPaintPanel()); askColPaintPanel(); return; }
    /* ADD A NEW ONE: the one door — the Contracts list, where a question is
       asked and kept. Settings' own page guard is asked first, as any leave is. */
    if (t.closest('[data-fa-go]')){ e.preventDefault();
      const go = () => { if (typeof setView === 'function') setView('register'); };
      if (typeof dkLeavePageThen === 'function') dkLeavePageThen(go); else go();
      return; }
    const chip = t.closest('[data-ac-chip]');
    if (chip){ e.preventDefault(); const a = (AC.team || []).find(x => x.id === chip.getAttribute('data-ac-chip')); if (a && AC.form){ Object.assign(AC.form, { question: a.question, name: a.name, askId: a.id, kept: 0 }); askColPaintPanel(); askColKept(AC.form); } return; }
    if (t.closest('[data-ac-go]')){ e.preventDefault(); askColGo(); return; }
    /* the tick moved out of the cell into the panel's reading (Lights, 26 Oct 2026) */
    if (t.closest('[data-ac-ck]')){ e.preventDefault(); const ch = AC.chosen; if (ch) askColCheck(ch.askId, ch.cid); return; }
    const sv = t.closest('[data-ac-save]'); if (sv){ e.preventDefault(); askColSave(); return; }
    if (t.closest('[data-ac-name-edit]') && AC.form){ e.preventDefault(); AC.form.nameEdit = true; AC.form.name = AC.form.name || askColNameOf(AC.form.question);
      const nm = document.getElementById('ac-named'); if (nm){ nm.innerHTML = askColNamedHtml(AC.form); const i = document.getElementById('ac-name'); if (i){ i.focus(); i.select(); } } return; }
    const ag = t.closest('[data-ac-again]');
    if (ag){ e.preventDefault(); const q = AC.asks[ag.getAttribute('data-ac-again')]; if (q) askColOpen({ question: q.question, name: q.name, askId: q.id, force: true }); return; }
    const rm = t.closest('[data-ac-remove]'); if (rm){ e.preventDefault(); askColRemove(rm.getAttribute('data-ac-remove')); return; }
    const un = t.closest('[data-ac-unck]'); if (un){ e.preventDefault(); askColUnchecked(un.getAttribute('data-ac-unck')); return; }
    const rk = t.closest('[data-ac-risk]');
    if (rk){ e.preventDefault(); const id = rk.getAttribute('data-ac-risk'), ids = askColAtRisk(id), q = AC.asks[id] || {};
      if (ids.length && typeof regShowOnly === 'function') regShowOnly(ids, _acT('ac_risk_label', { name: q.name || '' })); return; }
    const dr = t.closest('[data-ac-draw]'); if (dr){ e.preventDefault(); const id = dr.getAttribute('data-ac-draw'); AC.drawn[id] = !AC.drawn[id]; askColPaintPanel(); return; }
    const cp = t.closest('[data-ac-copy]'); if (cp){ e.preventDefault(); askColCopy(cp.getAttribute('data-ac-copy')); return; }
    const br = t.closest('[data-ac-bring]'); if (br){ e.preventDefault(); AC.form = null; askColBring(br.getAttribute('data-ac-bring')); return; }
    const bp = t.closest('[data-ac-bring-pack]'); if (bp){ e.preventDefault(); AC.form = null; askColBringMany(bp.getAttribute('data-ac-bring-pack').split(',')); return; }
    /* THE THREAD (28 Oct 2026): the choice in the sentence, the next batch from its link, every read on its page */
    const sz = t.closest('[data-ac-size]'); if (sz){ e.preventDefault(); acSizeSet(sz.getAttribute('data-ac-size')); askColPaintPanel(); return; }
    const nx = t.closest('[data-ac-next]'); if (nx){ e.preventDefault(); askColNext(nx.getAttribute('data-ac-next'), Number(nx.getAttribute('data-ac-n'))); return; }
    const rd = t.closest('[data-ac-reads]'); if (rd){ e.preventDefault(); const id = rd.getAttribute('data-ac-reads'); if (typeof readsOpen === 'function') readsOpen(id); else if (typeof setView === 'function') setView('reads'); return; }
    const pk = t.closest('[data-ac-pack]');
    if (pk){ e.preventDefault(); const p = (AC.packs || []).find(x => x.id === pk.getAttribute('data-ac-pack')); if (p) askColOpen({ pack: p }); return; }
    if (t.closest('[data-ac-open-new]')){ e.preventDefault(); if (askColMay()) askColOpen(); return; }
    if (t.closest('[data-ac-table]')){ e.preventDefault(); askColTableOpen(); return; }
    const fk = t.closest('[data-ac-fact]'); if (fk){ e.preventDefault(); askColFactSet(fk.getAttribute('data-ac-fact'), true); return; }
    const ft = t.closest('[data-fa-tog]'); if (ft){ e.preventDefault(); const id = ft.getAttribute('data-fa-tog'); askColFactSet(id, ft.getAttribute('aria-pressed') !== 'true'); return; }
    if (t.closest('[data-fa-readall]')){ e.preventDefault(); askColFactsReadAll(); return; }
    const od = t.closest('[data-ac-odd-show]'); if (od){ e.preventDefault(); askColOddShow(od.getAttribute('data-ac-odd-show')); return; }
    const wa = t.closest('[data-ac-watch]'); if (wa){ e.preventDefault(); askColWatch(wa.getAttribute('data-ac-watch'), true); return; }
    const uw = t.closest('[data-ac-unwatch]'); if (uw){ e.preventDefault(); askColWatch(null, false, uw.getAttribute('data-ac-unwatch')); return; }
  });
  /* the question's own words: a typed edit is kept across a repaint; Enter asks */
  document.addEventListener('input', e => {
    const t = e.target; if (!AC.form || !t) return;
    if (t.id === 'ac-q'){ askColSayClear(); AC.form.question = t.value; if (AC.form.askId && !AC.form.force){ AC.form.askId = null; AC.form.kept = 0; }
      /* the name said under the box follows the words as they are typed, unless the reader chose one */
      const nm = document.getElementById('ac-named'); if (nm && !AC.form.nameEdit && !AC.form.name) nm.innerHTML = askColNamedHtml(AC.form); }
    if (t.id === 'ac-name') AC.form.name = t.value;
  });
  /* a rule is saved when its box is left with new words (a change event: once, never per key) */
  document.addEventListener('change', e => {
    const el = e.target && e.target.closest ? e.target : null; if (!el) return;
    /* which of the pack's questions to run (owner, 26 Oct 2026) */
    const pick = el.closest ? el.closest('[data-ac-pick]') : null;
    if (pick && AC.form && AC.form.pack){
      const i = Number(pick.getAttribute('data-ac-pick'));
      const drop = AC.form.drop || (AC.form.drop = new Set());
      if (pick.checked) drop.delete(i); else drop.add(i);
      askColPaintPanel(); return;
    }
    const t = el.closest('[data-fa-rule]'); if (!t) return;
    const id = t.getAttribute('data-fa-rule'), a = (AC.summary || []).find(x => x.id === id);
    if (a && String(a.rule || '') !== t.value.trim()) askColRuleSet(id, t.value.trim());
  });
  document.addEventListener('keydown', e => {
    const t = e.target; if (!AC.form || !t) return;
    if ((t.id === 'ac-q' || t.id === 'ac-name') && e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); askColRun(); }
    if ((t.id === 'ac-q' || t.id === 'ac-name') && e.key === 'Escape'){ e.preventDefault(); askColClose(); }
  });
}

/* the button in the list's own head: greyed with why for a viewer */
function askColBtnHtml(){
  if (!askColOn()) return '';
  const may = askColMay();
  const spark = (typeof icon === 'function') ? icon('sparkle', 'w-4 h-4') : '';
  return `<button type="button" class="ui-btn ui-btn-sm ac-btn${AC.form ? ' is-open' : ''}" data-ac-open aria-expanded="${AC.form ? 'true' : 'false'}"${may ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${spark}${_acE(_acT('ac_btn'))}</button>`;
}

Object.assign(window, { askColLoad, askColCopyMany, askColGo, askColCheck, askColMay, askColNameOf, askColCountOpen, askColCountOf, askColRecordsOf, askColDeskRestHtml, AC, AC_MAX, AC_COLS_MAX, AC_BATCH, AC_SIZES, AC_DESK_TURN_MS, acSize, acSizeSet, askColPlan, askColNextWords, askColDoneSay, askColDeskAt, askColDeskPast, askColDeskStop, askColUnread, askColSentenceHtml, askColWhereText, askColWhen, askColNext, askColReads, askColLastRead, askColTableFor, askColPackAskIds, askColStop, askColCarryOn, askColKeep, askColDelete, askColIsPortfolio, askColSay, askColSayClear, askColPackPicked, askColTableOpen, askColRunNow,
  askColOn, askColKeys, askColWidths, askColThHtml, askColTdHtml, askColCmp, askColClauseNo,
  askColPanelHtml, askColBtnHtml, askColOpen, askColSync, askColMarkRows, askColToneOf, askColLegendHtml, askColTakes, askColAtRisk, askColDiscoverHtml, askColDiscoverLeads, askColBring, askColSummary,
  askColFactsArrive, askColFactsPanelWire, askColFactsState, askColFactsKtHtml, askColFactSet, askColLandOn, askColWatchOf, askColOddHtml, askColClose });
