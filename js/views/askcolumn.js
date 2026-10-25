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

/* the owner's limit (20 Oct 2026) — the server holds the same number */
const AC_MAX = 50;
/* how many answer columns stand beside the list at once */
const AC_COLS_MAX = 3;
const AC_TONE = { good:'green', watch:'amber', concern:'ruby', none:'gray' };
/* widths when answer columns stand (sum 100): the agreement, the stage,
   ends, value, each answer, the ⋯ — Owner steps aside, as drawn, and stays in
   the filters and the sort. RECUT FOR THE LEGORA WAY (Part 8, 21 Oct 2026):
   the agreement cell carries "kind · ref" now, so the Ref column's share
   went to it (the drawing's Agreement 34% beside one answer) */
const AC_COL_W = { 1:[33,15,13,11,22,6], 2:[30,13,11,9,16.5,16.5,4], 3:[26,12,10,9,13,13,13,4] };

const AC = {
  asks: {},        // id → { id, question, name }
  ans: {},         // askId → { contractId → answer }
  asked: {},       // askId → Set of contract ids already looked up
  form: null,      // { question, name, askId, force, kept } while the question is open
  busy: null,      // { n } while Jambo reads
  chosen: null,    // { askId, cid } — the answer the panel explains
  team: null,      // the team's past questions (GET /api/columns)
  drawn: {},       // askId → true while its counts are drawn in the panel (Draw it)
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
  try { const r = await api('columns'); AC.team = (r && r.asks) || []; (AC.team || []).forEach(a => { AC.asks[a.id] = AC.asks[a.id] || a; }); }
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
  /* the panel counts the list in front of it: a filter moved, so it says the new count */
  if (!_acSyncing && (AC.form || askColIdsUp().length)) askColPaintPanel();
  if (_acSyncing) return;
  const R = regState(), ids = Array.isArray(R.ask) ? R.ask.slice(0, AC_COLS_MAX) : [];
  if (!ids.length) return;
  _acSyncing = true;
  try {
    /* a column brought back by a refresh or a saved view learns its question
       from the kept answers' own reply */
    const shown = askColRowsUp();
    let moved = false;
    for (const id of ids) if (await askColLoad(id, shown)) moved = true;
    if (ids.some(id => !AC.asks[id])) moved = true;
    if (moved && askColOn() && typeof regRepaint === 'function') regRepaint();
  } finally { _acSyncing = false; }
}

/* ---- THE TABLE: a head and a cell per answer column ---- */
/* the head sorts like every other head (regFiltered asks askColCmp): the
   answers to look at first come first */
function askColThHtml(askId, style, grip, caret){
  const a = AC.asks[askId] || {}, key = 'ask:' + askId;
  const on = typeof regState === 'function' && regState().sort === key;
  const spark = (typeof icon === 'function') ? icon('sparkle', 'ac-th-i') : '';
  return `<th class="reg-th-sort ac-th${on ? ' active' : ''}" data-reg-sort="${_acE(key)}" data-ac-th="${_acE(askId)}" role="button" tabindex="0" aria-sort="${on ? (regState().dir === 1 ? 'ascending' : 'descending') : 'none'}" title="${_acE(_acT('ac_th_title', { question: a.question || '' }))}" style="cursor:pointer;user-select:none;${style}"><span class="ac-th-w">${_acE(a.name || '')}</span>${spark}${caret || ''}${grip || ''}</th>`;
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
function askColLegendHtml(){
  if (!askColIdsUp().length) return '';
  const d = (k, t) => `<span class="ac-lg"><i class="ac-lg-${k}"></i>${_acE(_acT(t))}</span>`;
  return `<span class="lh-extra ac-legend"> · ${d('green', 'ac_lg_good')}${d('amber', 'ac_lg_watch')}${d('ruby', 'ac_lg_bad')}${d('gray', 'ac_lg_none')}</span>`;
}
/* A QUESTION OF THE WORDING TYPED IN THE LIST'S OWN BOX (stage 2): the same
   form opens, filled — the one door to a read, the cost said before any call */
const AC_WORDING_RE = /\b(notice|terminat\w*|cancel\w*|liabilit\w*|capped|cap\b|indemn\w*|govern\w*|law\b|jurisdiction|renew\w*|roll(s|ed)? over|personal data|data protection|confidential\w*|payment terms|days to pay|warrant\w*|exclusiv\w*|non-compete|assign\w*|force majeure|clause|does (it|the contract|each contract) say|uppsägning\w*|ansvar\w*|förnya\w*|personuppgift\w*)\b/i;
function askColTakes(seat, words){
  const t = String(words || '').trim();
  if (seat !== 'contracts' || !askColOn() || !askColMay() || !t) return false;
  const q = (typeof lhIsQuestion === 'function') ? lhIsQuestion(t) : /\?$/.test(t);
  if (!q || !AC_WORDING_RE.test(t)) return false;
  askColOpen({ question: t.slice(0, 300) });
  return true;
}
function askColTdHtml(c, askId){
  const a = (AC.ans[askId] || {})[c.id];
  const on = AC.chosen && AC.chosen.askId === askId && AC.chosen.cid === String(c.id);
  const attrs = `class="ac-cell${on ? ' is-on' : ''}" data-ac="${_acE(askId)}" data-ac-cid="${_acE(c.id)}"`;
  if (!a){
    const busy = AC.busy && AC.busy.askId === askId && AC.busy.ids && AC.busy.ids.includes(String(c.id));
    return `<td ${attrs}>${busy && typeof busyHtml === 'function' ? `<span class="ac-sub">${busyHtml('')}</span>` : `<span class="ac-dash">—</span><small class="ac-sub">${_acE(_acT('ac_not_read'))}</small>`}</td>`;
  }
  if (a.noWording) return `<td ${attrs}><span class="ac-ans tone-gray"><i></i>${_acE(_acT('ac_no_wording'))}</span><small class="ac-sub">${_acE(_acT('ac_no_wording_sub'))}</small></td>`;
  const tone = askColToneOf(a);
  const word = a.found ? a.answer : _acT('ac_not_found');
  const ck = a.checked;
  const may = askColMay();
  const tip = !may ? _acT('ac_mark_viewer') : ck ? _acT('ac_unmark', { who: ck.by, when: askColWhen(ck.at) }) : _acT('ac_mark');
  const tick = `<button type="button" class="ac-ck${ck ? ' on' : ''}" data-ac-ck aria-pressed="${ck ? 'true' : 'false'}" title="${_acE(tip)}" aria-label="${_acE(tip)}"${may ? '' : ' disabled'}>${ck && typeof icon === 'function' ? icon('check2', 'ac-ck-i') : ''}</button>`;
  /* THE LEGORA WAY (owner, 25 Oct 2026): under the answer, the words it was read from; the tick says who checked it */
  const sub = [a.detail, a.found ? askColQuoteShort(a) : '', ck ? _acT('ac_checked_by', { who: askColInitials(ck.by) }) : ''].filter(Boolean).join(' · ');
  /* THE CLAUSE IT CAME FROM, ON THE ANSWER (Part 8, the Legora way's "§ 11.2"):
     a press goes through "Go to clause"'s own door (askColGo), the answer
     chosen first — never a second way onto the paper */
  const no = a.found ? askColClauseNo(a) : '';
  const cite = no ? `<button type="button" class="ac-cite" data-ac-cite title="${_acE(_acT('ac_go_clause', { n: no }))}" aria-label="${_acE(_acT('ac_go_clause', { n: no }))}">§ ${_acE(no)}</button>` : '';
  return `<td ${attrs}><span class="ac-ans tone-${tone}"><i></i><span class="ac-a${ck ? '' : ' is-unck'}">${_acE(word)}</span>${cite}${tick}</span><small class="ac-sub">${_acE(sub)}</small></td>`;
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
  if (AC.form) return askColFormHtml();
  const up = askColIdsUp();
  if (!up.length) return '';
  const ch = AC.chosen && up.includes(AC.chosen.askId) ? AC.chosen : null;
  return (ch ? askColWhyHtml(ch) : '') + (ch ? askColColumnHtml(ch.askId) : up.map(askColColumnHtml).join(''));
}
function askColFormHtml(){
  const f = AC.form;
  if (AC.busy) return `<div class="pd-glance ac-card" id="ac-form"><div class="pd-gl-h"><b>${_acE(_acT('ac_title'))}</b></div><div class="pd-gl-b"><div class="ac-busy" role="status">${typeof busyHtml === 'function' ? busyHtml(_acTn('ac_reading', AC.busy.n)) : _acE(_acTn('ac_reading', AC.busy.n))}</div></div></div>`;
  const shown = askColShown(), ids = shown.slice(0, AC_MAX);
  const kept = f.force ? 0 : Math.min(ids.length, f.kept || 0);
  const calls = ids.length - kept;
  const b = s => `<b>${_acE(s)}</b>`;
  const cost = ids.length < shown.length
    ? _acT('ac_cost_capped', { contracts: b(_acTn('ac_n_contracts', ids.length)), shown: b(String(shown.length)), calls: b(_acTn('ac_n_calls', calls)) })
    : _acT('ac_cost', { contracts: b(_acTn('ac_n_contracts', ids.length)), calls: b(_acTn('ac_n_calls', calls)) });
  const up = askColIdsUp(), full = up.length >= AC_COLS_MAX && !up.includes(f.askId);
  const why = !askColMay() ? _acT('ac_btn_viewer') : !ids.length ? _acT('ac_none_shown') : full ? _acT('ac_full') : '';
  const team = (AC.team || []).slice(0, 6);
  return `<div class="pd-glance ac-card" id="ac-form"><div class="pd-gl-h"><b>${_acE(_acT('ac_title'))}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(_acTn('ac_shown', shown.length))}</span></div>
    <div class="pd-gl-b">
      <div><label class="ac-l" for="ac-q">${_acE(_acT('ac_q_label'))}</label><textarea id="ac-q" class="ac-in" rows="2" maxlength="300" placeholder="${_acE(_acT('ac_q_ph'))}">${_acE(f.question || '')}</textarea></div>
      <div><label class="ac-l" for="ac-name">${_acE(_acT('ac_name_label'))}</label><input id="ac-name" class="ac-in" maxlength="40" placeholder="${_acE(_acT('ac_name_ph'))}" value="${_acE(f.name || '')}" aria-describedby="ac-name-say"><small class="ac-hint" id="ac-name-say">${_acE(_acT('ac_name_auto'))}</small></div>
      <div class="ac-cost">${cost}${kept ? ' ' + _acE(_acTn('ac_kept', kept)) : ''}${f.force ? ' ' + _acE(_acT('ac_cost_again')) : ''}</div>
      ${why ? `<div class="ac-why">${_acE(why)}</div>` : ''}
      <div class="ac-acts"><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ac-ask${why ? ` disabled title="${_acE(why)}"` : ''}>${_acE(_acTn('ac_ask_n', ids.length))}</button><button type="button" class="ui-btn ui-btn-sm" data-ac-cancel>${_acE(_acT('ac_cancel'))}</button></div>
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
  const chips = s.total ? `<div class="ac-chips ac-next">${risk ? `<button type="button" class="jb-chip" data-ac-risk="${_acE(askId)}">${_acE(_acTn('ac_chip_risk', risk))}</button>` : ''}<button type="button" class="jb-chip" data-ac-draw="${_acE(askId)}" aria-pressed="${drawn ? 'true' : 'false'}">${_acE(_acT(drawn ? 'ac_chip_undraw' : 'ac_chip_draw'))}</button><button type="button" class="jb-chip" data-ac-copy="${_acE(askId)}">${_acE(_acT('ac_chip_copy'))}</button>${askColMoreChipsHtml(askId)}</div>` : '';
  return `<div class="pd-glance ac-card" data-ac-col="${_acE(askId)}"><div class="pd-gl-h"><b>${_acE(a.name || '')}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(_acT('ac_col_word'))}</span></div>
    <div class="pd-gl-b"><div class="ac-meta">${_acE(facts)}</div>${ck}${chips}${drawn ? askColDrawHtml(askId) : ''}
      <div class="ac-acts"><button type="button" class="ui-btn ui-btn-sm" data-ac-save="${_acE(askId)}">${_acE(_acT('ac_save_view'))}</button><button type="button" class="ui-btn ui-btn-sm" data-ac-again="${_acE(askId)}"${may ? '' : ` disabled title="${_acE(_acT('ac_btn_viewer'))}"`}>${_acE(_acT('ac_again'))}</button><button type="button" class="ui-btn ui-btn-sm ui-btn-plain" data-ac-remove="${_acE(askId)}">${_acE(_acT('ac_remove'))}</button></div>
    </div></div>`;
}
/* THE COLUMN'S LATER STEPS (stages 4 and 5): keep it as a company fact, watch it */
function askColMoreChipsHtml(askId){ void askId; return ''; }
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
async function askColCopy(askId){
  const m = AC.ans[askId] || {}, q = AC.asks[askId] || {};
  const rows = askColShown().filter(id => m[id]).map(id => {
    const c = (typeof getContract === 'function') ? getContract(id) : null, a = m[id];
    const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : id;
    return [ref, c ? (c.counterparty || '') : '', a.noWording ? _acT('ac_no_wording') : a.found ? a.answer : _acT('ac_not_found'), a.detail || '', a.clause || '', a.quote || '',
      a.verdict === 'in' ? _acT('ac_lg_good') : a.verdict === 'out' ? _acT('ac_lg_bad') : ''];
  });
  const head = ['Ref', 'Party', q.name || '', '', _acT('ac_f_clause'), _acT('ac_f_source'), _acT('ac_f_rule')];
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
  return `<div class="pd-glance ac-card ac-why-card" data-ac-why="${_acE(ch.askId)}:${_acE(ch.cid)}"><div class="pd-gl-h"><b>${_acE(head)}</b><span class="pd-gl-sp"></span><span class="ac-meta">${_acE(q.name || '')}</span></div>
    <div class="pd-gl-b"><dl class="ac-fl">
      ${row('ac_f_answer', `<b>${_acE(word)}</b>`)}
      ${row('ac_f_why', a.why ? _acE(a.why) : '')}
      ${row('ac_f_source', a.quote ? `<div class="ac-quote">“${_acE(a.quote)}”</div>` : (a.noWording ? '' : `<span class="ac-sub">${_acE(_acT('ac_no_quote'))}</span>`))}
      ${row('ac_f_clause', a.clause ? _acE(a.clause) : '')}
      ${a.noWording || !a.found ? '' : row('ac_f_rule', _acE(a.verdict === 'in' ? _acT('ac_rule_in', { rule: a.rule }) : a.verdict === 'out' ? _acT('ac_rule_out', { rule: a.rule }) : a.rule ? _acT('ac_rule_unsure', { rule: a.rule }) : _acT('ac_rule_none')))}
      ${row('ac_f_read', a.at ? _acE(_acT('ac_read_by', { when: askColWhen(a.at) })) : '')}
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
  if (f.askId && !f.force) await askColKept(f);
}
/* the answers already kept for a question chosen from the team's: they cost nothing */
async function askColKept(f){
  const ids = askColShown().slice(0, AC_MAX);
  await askColLoad(f.askId, ids);
  const m = AC.ans[f.askId] || {};
  f.kept = ids.filter(id => m[id]).length;
  if (AC.form === f) askColPaintPanel();
}
function askColClose(){ AC.form = null; askColPaintPanel(); }
function askColDrop(askId){
  const R = regState();
  R.ask = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== askId);
  if (R.sort === 'ask:' + askId){ R.sort = 'updated'; R.dir = -1; }
  if (AC.chosen && AC.chosen.askId === askId) AC.chosen = null;
}
async function askColRun(){
  const f = AC.form; if (!f || AC.busy) return;
  const qEl = document.getElementById('ac-q'), nEl = document.getElementById('ac-name');
  const question = String(qEl ? qEl.value : f.question || '').trim();
  const name = String(nEl ? nEl.value : f.name || '').trim();
  if (question.length < 3){ if (typeof toast === 'function') toast(_acT('ac_q_short'), 'warn'); if (qEl) qEl.focus(); return; }
  const ids = askColShown().slice(0, AC_MAX); if (!ids.length) return;
  f.question = question; f.name = name;
  AC.busy = { n: ids.length, ids, askId: f.askId };
  askColPaintPanel();
  try {
    const r = await api('ai/column', 'POST', { question, name, ids, texts: askColTexts(ids), force: !!f.force });
    const id = r.ask.id;
    AC.asks[id] = r.ask;
    Object.assign(AC.ans[id] || (AC.ans[id] = {}), r.answers || {});
    (AC.asked[id] || (AC.asked[id] = new Set())); ids.forEach(x => AC.asked[id].add(x));
    const R = regState();
    const up = (Array.isArray(R.ask) ? R.ask : []).filter(x => x !== id);
    R.ask = up.concat(id).slice(-AC_COLS_MAX);
    AC.form = null;
    if (typeof toast === 'function'){
      toast(_acT('ac_done', { name: r.ask.name, calls: _acTn('ac_n_calls', r.calls || 0) }), 'ok');
      const failed = (r.failed || []).filter(x => x.why !== 'notFound').length;
      if (failed) toast(_acTn('ac_failed', failed), 'warn');
      if (r.capped) toast(_acT('ac_capped', r.capped), 'warn');
    }
  } catch (e){
    if (typeof toast === 'function') toast(e && (e.needsKey || e.kind === 'noKey') ? _acT('ac_nokey') : _acT('ac_err', { msg: (e && e.message) || '' }), 'err');
  } finally {
    AC.busy = null;
    if (typeof regRepaint === 'function') regRepaint();
    askColPaintPanel();
  }
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
      e.stopPropagation(); e.preventDefault();
      const askId = td.getAttribute('data-ac'), cid = td.getAttribute('data-ac-cid');
      /* the § chip: this answer chosen (unless it already is), then Go to clause */
      if (t.closest('[data-ac-cite]')){
        if (!(AC.chosen && AC.chosen.askId === askId && AC.chosen.cid === cid)) askColChoose(askId, cid);
        askColGo(); return;
      }
      if (t.closest('[data-ac-ck]')) askColCheck(askId, cid); else askColChoose(askId, cid);
    }
  }, true);
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-ac-open]')){ e.preventDefault();
      if (!askColMay()){ askColBtnFix(); if (typeof toast === 'function') toast(_acT('ac_btn_viewer'), 'warn'); return; }
      if (AC.form) askColClose(); else askColOpen(); return; }
    if (t.closest('[data-ac-ask]')){ e.preventDefault(); askColRun(); return; }
    if (t.closest('[data-ac-cancel]')){ e.preventDefault(); askColClose(); return; }
    const chip = t.closest('[data-ac-chip]');
    if (chip){ e.preventDefault(); const a = (AC.team || []).find(x => x.id === chip.getAttribute('data-ac-chip')); if (a && AC.form){ Object.assign(AC.form, { question: a.question, name: a.name, askId: a.id, kept: 0 }); askColPaintPanel(); askColKept(AC.form); } return; }
    if (t.closest('[data-ac-go]')){ e.preventDefault(); askColGo(); return; }
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
  });
  /* the question's own words: a typed edit is kept across a repaint; Enter asks */
  document.addEventListener('input', e => {
    const t = e.target; if (!AC.form || !t) return;
    if (t.id === 'ac-q'){ AC.form.question = t.value; if (AC.form.askId && !AC.form.force){ AC.form.askId = null; AC.form.kept = 0; } }
    if (t.id === 'ac-name') AC.form.name = t.value;
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

Object.assign(window, { AC_MAX, AC_COLS_MAX, askColOn, askColKeys, askColWidths, askColThHtml, askColTdHtml, askColCmp, askColClauseNo,
  askColPanelHtml, askColBtnHtml, askColOpen, askColSync, askColMarkRows, askColToneOf, askColLegendHtml, askColTakes, askColAtRisk });
