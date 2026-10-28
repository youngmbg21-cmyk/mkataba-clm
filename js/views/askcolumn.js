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
const AC_TONE = { good:'green', watch:'amber', concern:'ruby', none:'gray' };
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
  chosen: null,    // { askId, cid } — the answer the panel explains
  team: null,      // the team's past questions (GET /api/columns)
  drawn: {},       // askId → true while its counts are drawn in the panel (Draw it)
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
function askColAskWords(p){
  return p.force ? _acT('ac_th_btn_again', { n: p.pick.length }) : p.read ? _acT('ac_th_btn_next', { n: p.pick.length }) : _acTn('ac_ask_n', p.pick.length);
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
   legend, the counts and Show the N at risk. */
function askColToneOf(a){
  if (!a || a.noWording || !a.found) return 'gray';
  if (a.verdict === 'out') return 'ruby';
  if (a.verdict === 'in') return 'green';
  return AC_TONE[a.tone] || 'gray';
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
  return `${d('green', 'ac_lg_good')}${d('amber', 'ac_lg_watch')}${d('ruby', 'ac_lg_bad')}${d('gray', 'ac_lg_none')}`;
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
  const tone = a.noWording ? 'gray' : askColToneOf(a);
  /* the full reading rides the cell's own title, so a long answer is readable
     where it is, without the row growing or the words being cut twice over */
  const tip = [word, a.detail, a.found ? askColQuoteShort(a) : ''].filter(Boolean).join(' · ');
  return `<td ${attrs}><span class="ac-ans tone-${tone}" title="${_acE(tip)}"><i></i><span class="ac-a">${_acE(word)}</span></span></td>`;
}
/* sorting by an answer column: the ones to look at first — a concern, then
   one to watch, then the usual, then a plain fact, then nothing found */
function askColCmp(askId){
  const m = AC.ans[askId] || {};
  const R2 = { ruby:0, amber:1, green:2, gray:3 };
  const rank = c => { const a = m[c.id]; return !a ? 9 : a.noWording ? 8 : !a.found ? 7 : (R2[askColToneOf(a)] ?? 5); };
  return (x, y) => rank(y) - rank(x);
}

/* ---- JAMBO'S PANEL ---- */
function askColPanelHtml(){
  if (!askColOn()) return '';
  if (AC.busy) return askColBusyHtml();
  if (AC.form) return askColFormHtml();
  const stopped = AC.stopped ? askColStoppedHtml() : '';
  const up = askColIdsUp();
  if (!up.length) return stopped;
  const ch = AC.chosen && up.includes(AC.chosen.askId) ? AC.chosen : null;
  return stopped + (ch ? askColWhyHtml(ch) : '') + (ch ? askColColumnHtml(ch.askId) : up.map(askColColumnHtml).join('') + askColDiscoverHtml());
}
/* WHILE HE READS: how far he has got, and Stop. The count is the answers
   already landed — they are kept whatever happens next (owner, 26 Oct 2026). */
function askColBusyHtml(){
  const b = AC.busy, pct = b.total ? Math.round(b.done / b.total * 100) : 0;
  const line = b.stop ? _acT('ac_stopping') : _acTn('ac_reading_n', b.total, { done: b.done });
  return `<div class="pd-glance ac-card" id="ac-form"><div class="pd-gl-h"><b>${_acE(b.name || _acT('ac_title'))}</b></div>
    <div class="pd-gl-b"><div class="ac-busy" role="status" aria-live="polite">${typeof busyHtml === 'function' ? busyHtml(line) : _acE(line)}</div>
      <div class="ac-prog" role="img" aria-label="${_acE(line)}"><i style="width:${pct}%"></i></div>
      <div class="ac-next"><button type="button" class="jb-chip" data-ac-stop${b.stop ? ' disabled' : ''}>${_acE(_acT('ac_stop'))}</button></div>
      <div class="ac-meta">${_acE(_acT('ac_stop_keeps'))}</div>
    </div></div>`;
}
/* AFTER A STOP: what was kept, what was not, and the rest offered with its cost */
function askColStoppedHtml(){
  const s = AC.stopped, calls = s.left.length;
  return `<div class="pd-glance ac-card" id="ac-stopped"><div class="pd-gl-h"><b>${_acE(s.name)}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(_acT('ac_stopped_word'))}</span></div>
    <div class="pd-gl-b"><div class="ac-meta">${_acE(_acT('ac_stopped_said', { done: s.done, total: s.total, left: s.left.length }))}</div>
      <div class="ac-acts"><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-carry>${_acE(_acTn('ac_carry_on', calls, { calls: _acTn('ac_n_calls', calls) }))}</button><button type="button" class="ui-btn ui-btn-sm" data-ac-stopped-close>${_acE(_acT('ac_stopped_leave'))}</button></div>
    </div></div>`;
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
      <div><label class="ac-l" for="ac-name">${_acE(_acT('ac_name_label'))}</label><input id="ac-name" class="ac-in" maxlength="40" placeholder="${_acE(_acT('ac_name_ph'))}" value="${_acE(f.name || '')}" aria-describedby="ac-name-say"><small class="ac-hint" id="ac-name-say">${_acE(_acT('ac_name_auto'))}</small></div>
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
  const a = AC.asks[askId] || {}, s = askColStats(askId);
  const facts = [`“${a.question || ''}”`, s.found ? _acTn('ac_answered', s.found) : '', s.missing ? _acTn('ac_notfound', s.missing) : '',
    s.last ? _acT('ac_read_at', { when: askColWhen(s.last) }) : '', s.calls ? _acTn('ac_n_calls', s.calls) : ''].filter(Boolean).join(' · ');
  const ck = s.total ? `<div class="ac-ckline">${_acE(_acT('ac_checked_line', { n: s.total - s.unck.length, total: s.total }))}${s.unck.length ? ` · <button type="button" class="ac-link" data-ac-unck="${_acE(askId)}">${_acE(_acTn('ac_show_unck', s.unck.length))}</button>` : ''}</div>` : '';
  const may = askColMay();
  /* THE NEXT STEP IS A LINK (the Legora way): narrow to the risky ones, draw the counts here, copy the table */
  const risk = askColAtRisk(askId).length, drawn = !!AC.drawn[askId];
  const run = askColRunNow();
  /* THE PROGRESS LINE AND THE NEXT BATCH (The thread, 28 Oct 2026): how far this question got over the list
     shown, who read last, and the next 50 or 100 not yet read as links with their cost; Every read › */
  const prog = askColProgressHtml(askId);
  const chips = s.total ? `<div class="ac-chips ac-next">${risk ? `<button type="button" class="jb-chip" data-ac-risk="${_acE(askId)}">${_acE(_acTn('ac_chip_risk', risk))}</button>` : ''}<button type="button" class="jb-chip" data-ac-draw="${_acE(askId)}" aria-pressed="${drawn ? 'true' : 'false'}">${_acE(_acT(drawn ? 'ac_chip_undraw' : 'ac_chip_draw'))}</button><button type="button" class="jb-chip" data-ac-copy="${_acE(askId)}">${_acE(_acT('ac_chip_copy'))}</button>${askColMoreChipsHtml(askId)}${run ? `<button type="button" class="jb-chip" data-ac-table>${_acE(_acT('ac_tt_open'))}</button>` : ''}</div>` : '';
  return `<div class="pd-glance ac-card" data-ac-col="${_acE(askId)}"><div class="pd-gl-h"><b>${_acE(a.name || '')}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(_acT('ac_col_word'))}</span></div>
    <div class="pd-gl-b"><div class="ac-meta">${_acE(facts)}</div>${prog}${ck}${chips}${drawn ? askColDrawHtml(askId) : ''}
      <div class="ac-acts"><button type="button" class="ui-btn ui-btn-sm" data-ac-save="${_acE(askId)}">${_acE(_acT('ac_save_view'))}</button><button type="button" class="ui-btn ui-btn-sm" data-ac-again="${_acE(askId)}"${may ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${_acE(_acT('ac_again'))}</button><button type="button" class="ui-btn ui-btn-sm ui-btn-plain" data-ac-remove="${_acE(askId)}">${_acE(_acT('ac_remove'))}</button></div>
    </div></div>`;
}
function askColProgressHtml(askId){
  const p = askColPlan({ askId });
  if (!p.shown) return '';
  if (!AC.reads) askColReads().then(() => { if (askColOn() && !AC.form && !AC.busy) askColPaintPanel(); });
  const last = askColLastRead(askId), risk = askColAtRisk(askId).length;
  const pct = Math.round(p.read / p.shown * 100);
  const who = last ? _acT('ac_th_by', { by: last.by || '', when: askColWhen(last.last || last.at) }) : '';
  const line = [_acT('ac_th_prog', { read: p.read, total: p.shown }), risk ? _acTn('ac_disc_risk', risk) : '', who].filter(Boolean).join(' · ');
  const next = p.unread
    ? [...new Set(AC_SIZES.map(n => Math.min(n, p.unread)))].map(n => { const q = askColPlan({ askId, size: n > AC_SIZES[0] ? n : AC_SIZES[0] }); const m = Math.min(n, q.pick.length);
        return `<button type="button" class="jb-chip" data-ac-next="${_acE(askId)}" data-ac-n="${n > AC_SIZES[0] ? n : AC_SIZES[0]}" title="${_acE(_acT('ac_th_next_title'))}">${_acE(_acT('ac_th_next_chip', { n: m, where: askColWhereText(Object.assign({}, q, { pick: q.pick.slice(0, m) })), calls: _acTn('ac_n_calls', m) }))}</button>`; }).join('')
    : '';
  return `<div class="ac-th-prog" data-ac-prog="${_acE(askId)}"><div class="ac-prog" role="img" aria-label="${_acE(line)}"><i style="width:${pct}%"></i></div><div class="ac-meta">${_acE(line)}${p.unread ? '' : ' · ' + _acE(_acT('ac_th_all_read'))}</div>
    <div class="ac-chips ac-next">${next}<button type="button" class="jb-chip" data-ac-reads="${_acE(askId)}">${_acE(_acT('ac_th_every_read'))}</button></div></div>`;
}
/* THE NEXT BATCH, FROM THE LINK (the cost is on the link): the same engine, the same door as Carry on */
async function askColNext(askId, n){
  if (AC.busy || !askColMay()) return;
  acSizeSet(n);
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
    const tone = a ? askColToneOf(a) : 'gray';
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
/* DRAW IT: the column's counts as bars, in its own card, from the answers already read (no call) */
function askColDrawHtml(askId){
  const m = AC.ans[askId] || {}, ids = askColShown().filter(id => m[id] && !m[id].noWording);
  const n = { green:0, amber:0, ruby:0, gray:0 };
  ids.forEach(id => { n[askColToneOf(m[id])]++; });
  const max = Math.max(1, n.green, n.amber, n.ruby, n.gray), q = AC.asks[askId] || {};
  const bar = (k, t) => `<div class="ac-bar"><span>${_acE(_acT(t))}</span><span class="ac-bar-t"><i class="ac-lg-${k}" style="width:${Math.round(n[k] / max * 100)}%"></i></span><b>${n[k]}</b></div>`;
  return `<div class="ac-draw" role="img" aria-label="${_acE(_acT('ac_draw_h', { name: q.name || '', n: ids.length }))}"><div class="ac-meta">${_acE(_acT('ac_draw_h', { name: q.name || '', n: ids.length }))}</div>${bar('green', 'ac_lg_good')}${bar('amber', 'ac_lg_watch')}${bar('ruby', 'ac_lg_bad')}${bar('gray', 'ac_lg_none')}<div class="ac-meta">${_acE(_acT('ac_draw_free'))}</div></div>`;
}
/* COPY THE TABLE: the list's rows with this column, each answer with its clause and sentence, as a table a mail or a sheet takes */
function askColCopy(askId){ return askColCopyMany([askId]); }
async function askColCopyMany(askIds){
  const word = a => !a ? '' : a.noWording ? _acT('ac_no_wording') : a.found ? a.answer : _acT('ac_not_found');
  const rule = a => !a ? '' : a.verdict === 'in' ? _acT('ac_lg_good') : a.verdict === 'out' ? _acT('ac_lg_bad') : '';
  const rows = askColShown().filter(id => askIds.some(k => (AC.ans[k] || {})[id])).map(id => {
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
      ${row('ac_f_answer', `<span class="ac-ans tone-${a.noWording ? 'gray' : askColToneOf(a)}"><i></i><b>${_acE(word)}</b></span>`)}
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
  AC.form = f; AC.chosen = null;
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
  AC.busy = { total: ids.length, done: 0, ids: [], stop: false, name: o.name || '' };
  askColPaintPanel();
  for (let i = 0; i < ids.length; i += AC_BATCH){
    if (AC.busy.stop){ got.stopped = true; break; }
    const part = ids.slice(i, i + AC_BATCH);
    AC.busy.ids = part;
    if (typeof regRepaint === 'function') regRepaint();
    askColPaintPanel();
    let r = null;
    try { r = await api('ai/column', 'POST', { ...base, ids: part, texts: askColTexts(part) }); }
    catch (e){ got.err = e; break; }
    got.calls += Number(r.calls) || 0;
    got.cached += Number(r.cached) || 0;
    (r.failed || []).forEach(f => got.failed.push(f));
    if (r.capped) got.capped = r.capped;
    const asks = (r.asks && r.asks.length) ? r.asks : (r.ask ? [r.ask] : []);
    asks.forEach(a => {
      AC.asks[a.id] = Object.assign(AC.asks[a.id] || {}, a);
      const m = (r.byAsk && r.byAsk[a.id]) || r.answers || {};
      Object.assign(AC.ans[a.id] || (AC.ans[a.id] = {}), m);
      (AC.asked[a.id] || (AC.asked[a.id] = new Set())); part.forEach(x => AC.asked[a.id].add(x));
    });
    if (!got.asks.length){ got.asks = asks; if (o.onFirst) o.onFirst(asks); }
    AC.busy.done += part.length;
    got.done = AC.busy.done;
    if (typeof regRepaint === 'function') regRepaint();
    askColPaintPanel();
  }
  AC.busy = null;
  got.left = ids.slice(got.done);
  return got;
}
/* what the reader is told after a run that was stopped or that broke: nothing
   is lost, and the rest is offered again with its own cost */
function askColRunEnd(got, base, name){
  AC.stopped = (got.stopped || got.err) && got.left.length ? { base, left: got.left, done: got.done, total: got.done + got.left.length, name } : null;
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
function askColStop(){ if (AC.busy) AC.busy.stop = true; askColPaintPanel(); }
/* CARRY ON WITH THE REST: the same question, the contracts the stop left */
async function askColCarryOn(){
  const s = AC.stopped; if (!s || AC.busy) return;
  AC.stopped = null;
  const got = await askColReadRun(s.base, s.left, { name: s.name });
  askColRunEnd(got, s.base, s.name);
  if (!got.stopped && !got.err && typeof toast === 'function') toast(_acT('ac_done', { name: s.name, calls: _acTn('ac_n_calls', got.calls) }), 'ok');
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
      return `<td class="ac-tt-c"><span class="ac-ans tone-${a.noWording ? 'gray' : askColToneOf(a)}"><i></i><span class="ac-tt-w">${_acE(word)}</span>${no ? `<span class="ac-cite">§ ${_acE(no)}</span>` : ''}</span>${sub ? `<small class="ac-sub">${_acE(sub)}</small>` : ''}</td>`;
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
  const name = String(nEl ? nEl.value : f.name || '').trim();
  if (question.length < 3){ askColSay(_acT('ac_q_short')); return; }
  /* A COLUMN ASKS THE WORDING (owner, 26 Oct 2026): a counting question is
     about the reader's own book, not about what a contract says — it is handed
     to Jambo's box, free, and never kept as a column. The server is the wall;
     this is the sentence the reader sees before a call is spent. */
  if (askColIsPortfolio(question)){ askColSay(_acT('ac_q_portfolio')); return; }
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
  if (!got.stopped && !got.err && typeof toast === 'function') toast(_acT('ac_done', { name: named, calls: _acTn('ac_n_calls', got.calls) }), 'ok');
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
    }
  }, true);
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-ac-open]')){ e.preventDefault();
      if (!askColMay()){ askColBtnFix(); if (typeof toast === 'function') toast(_acT('ac_btn_viewer'), 'warn'); return; }
      if (AC.form) askColClose(); else askColOpen(); return; }
    if (t.closest('[data-ac-ask]')){ e.preventDefault(); askColRun(); return; }
    if (t.closest('[data-ac-cancel]')){ e.preventDefault(); askColClose(); return; }
    if (t.closest('[data-ac-stop]')){ e.preventDefault(); askColStop(); return; }
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
    if (t.id === 'ac-q'){ askColSayClear(); AC.form.question = t.value; if (AC.form.askId && !AC.form.force){ AC.form.askId = null; AC.form.kept = 0; } }
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

Object.assign(window, { AC, AC_MAX, AC_COLS_MAX, AC_BATCH, AC_SIZES, acSize, acSizeSet, askColPlan, askColUnread, askColSentenceHtml, askColWhereText, askColWhen, askColNext, askColReads, askColLastRead, askColTableFor, askColPackAskIds, askColStop, askColCarryOn, askColKeep, askColDelete, askColIsPortfolio, askColSay, askColSayClear, askColPackPicked, askColTableOpen, askColRunNow,
  askColOn, askColKeys, askColWidths, askColThHtml, askColTdHtml, askColCmp, askColClauseNo,
  askColPanelHtml, askColBtnHtml, askColOpen, askColSync, askColMarkRows, askColToneOf, askColLegendHtml, askColTakes, askColAtRisk, askColDiscoverHtml, askColDiscoverLeads, askColBring, askColSummary,
  askColFactsArrive, askColFactsPanelWire, askColFactsState, askColFactsKtHtml, askColFactSet, askColLandOn, askColWatchOf, askColOddHtml, askColClose });
