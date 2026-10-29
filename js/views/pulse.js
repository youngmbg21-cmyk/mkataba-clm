// HaTi — the Pulse board: every contract on one live ranked list, each drawn as a strand.
/* ============================================================================
   THE PULSE BOARD (owner, 29 Oct 2026: "Build it" — the prototype
   "The Pulse Board", artifact Up4KN2xDakzFBEFAWFBSPK, version 3; its door is
   the button beside Summarise my board on the Board's head)
   ----------------------------------------------------------------------------
   One page. Every contract this person may see is a row, ranked by one of four
   rules (the chips): What needs you · Money at stake · Days left · Written by
   Jambo. The order is read again every PU_TICK_MS while the page stands, so a
   contract whose work arrives climbs and one whose work is done sinks; a row
   that moved glides to its new place and says how far ("▲ 2"), against the
   order this person last saw (kept in this browser, per rule).

   NOTHING HERE IS NEW DATA. Every figure is an existing reading:
     · what needs you — the ONE desk (ndRead), counted per contract, so the
       number on a row matches the Needs you list behind it (rule 6);
     · money — fxRankValue, the book's own "largest first" (no rate guessed;
       private streams and pay rank nowhere; hidden where values are);
     · days left — effectiveExpiry, the amended end date;
     · written by Jambo — c.changes read RAW (READING MUST NOT WRITE): our own
       changes whose provenance says Jambo (puJamboWrote), split by whether a
       colleague cleared them in review (reviewCleared) and whether they have
       left the building (puUnsent, the ladder's own reading).
   THE STRAND is the contract's life from its start to its end, a twisting
   double line with today dashed across it; each rung is a dated thing on the
   record (puEventsOf): their asks, our changes, Jambo's wording, signatures,
   duties (late in red, due soon in amber). JAMBO'S PANEL says, without a call,
   why the row sits where it does and what would move it; every press there is
   an existing door (the desk's own row button, the Redlines face, Ask for
   review, the paper). Reading never writes; the page costs nothing.
   ========================================================================== */
const PU_SEAT = 'pulse';
const PU_CRITS = ['needs', 'money', 'days', 'jambo'];
const PU_PAGE = 30;               /* rows drawn at a time; "Show N more" says the rest */
const PU_TICK_MS = 15000;         /* the book read again while the page stands */
const PU_FPS = 20;                /* the strands' twist, rows in sight only */
const PU_SEEN_KEY = 'hati.v1.puSeen';
const PU_JAMBO_RE = /^(?:Copilot|Jambo)\s+[—-]\s/;
let _pu = { crit: 'needs', held: false, shown: PU_PAGE, sel: null, rows: null, prev: null, at: '', tick: 0, raf: 0, sig: '', psig: '' };
let _puBack = null;
const _puE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _puT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _puTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, { n, ...(v || {}) }) : k;
const _puTry = (fn, d) => { try { const v = fn(); return v === undefined ? d : v; } catch (_){ return d; } };
const _puDay = s => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(s || '')); return m ? m[1] : null; };
const _puToday = () => (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
const _puDays = (from, to) => { const a = Date.parse(from + 'T00:00:00Z'), b = Date.parse(to + 'T00:00:00Z'); return isFinite(a) && isFinite(b) ? Math.round((b - a) / 864e5) : null; };
const _puMoney = () => typeof canViewValues !== 'function' || canViewValues();

/* A REFRESH LANDS AT THE SAME SPOT (PLACE_PARTS.pulse): the rule and the chosen row */
function puPlace(){ return { crit: _pu.crit, sel: _pu.sel, shown: _pu.shown }; }
function puPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _pu.crit = PU_CRITS.includes(p.crit) ? p.crit : 'needs';
  _pu.shown = Math.max(PU_PAGE, Math.min(2000, Number(p.shown) || PU_PAGE));
  _puBack = p.sel ? String(p.sel) : null;
}
const puKeep = () => { if (typeof placeSave === 'function'){ try { placeSave(); } catch (_){ /* a convenience */ } } };

/* ---- THE BOOK: what this person may see, live ones only ---- */
function puBook(){
  const cs = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  return cs.filter(c => c && !c.archived && c.status !== 'Declined');
}
/* ---- WHAT NEEDS YOU, PER CONTRACT: the one desk's rows, counted where they belong ---- */
function puNeedsMap(){
  const M = new Map();
  const D = _puTry(() => (typeof ndRead === 'function') ? ndRead() : null, null);
  if (!D) return M;
  const add = (cid, r, late, age) => {
    if (!cid) return;
    const k = String(cid), e = M.get(k) || { n: 0, late: 0, age: null, rows: [] };
    e.n += 1; e.late += late ? 1 : 0;
    if (age != null && (e.age == null || age > e.age)) e.age = age;
    if (r && !e.rows.includes(r)) e.rows.push(r);
    M.set(k, e);
  };
  const cidOf = it => (it && (it.cid || (it.c && it.c.id))) || '';
  for (const r of (D.jambo || [])) add(cidOf(r.it), r, !!r.late, r.age);
  for (const r of (D.you || [])){
    if (r.bundle){ for (const y of r.bundle) add(y.x && y.x.c && y.x.c.id, r, !!y.urgent, y.x && y.x.age != null ? y.x.age : null); continue; }
    if (r.al){ add(r.al.id, r, !!r.late, r.age); continue; }
    if (r.y && r.y.k === 'c') add(r.y.x && r.y.x.c && r.y.x.c.id, r, !!r.late, r.age);
  }
  return M;
}
/* ---- WRITTEN BY JAMBO: our own changes whose wording Jambo wrote, read RAW ---- */
const puJamboWrote = ch => !!(ch && PU_JAMBO_RE.test(String(ch.note || '')));
const _puPlain = h => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
const puWordsOf = ch => { const t = _puPlain(ch && (ch.newText || ch.bodyHtml || ch.oldText)).trim(); return t ? t.split(/\s+/).length : 0; };
/* not yet sent: the ladder's own reading (ladderUnsent) — held back, kept back by a send, or filed after the last hand-over */
function puUnsent(c, ch){
  if (!ch || ch.status !== 'pending' || ch.withdrawn) return false;
  const n = c && c.negotiation;
  if (n && Array.isArray(n.holdIds) && n.holdIds.includes(ch.id)) return true;
  if (n && Array.isArray(n.keptIds) && n.keptIds.includes(ch.id)) return true;
  const at = n && n.turnAt;
  return at ? String(ch.createdAt || '') > String(at) : true;
}
const _puOurs = ch => ch && ch.authorSide !== 'counterparty' && !ch.withdrawn && ch.status !== 'superseded' && !ch.superseded;
function puAllChanges(c){
  const out = [], seen = new Set();
  const take = ch => { if (!ch) return; const k = ch.id || ('#' + out.length); if (seen.has(k)) return; seen.add(k); out.push(ch); };
  (Array.isArray(c && c.changes) ? c.changes : []).forEach(take);
  const rs = (c && c.negotiation && Array.isArray(c.negotiation.rounds)) ? c.negotiation.rounds : [];
  rs.forEach(r => (Array.isArray(r && r.changes) ? r.changes : []).forEach(take));
  return out;
}
function puJamboOf(c){
  const ours = puAllChanges(c).filter(_puOurs);
  const j = ours.filter(puJamboWrote);
  const cleared = ch => _puTry(() => (typeof reviewCleared === 'function') && reviewCleared(ch), false);
  const verdict = ch => _puTry(() => (typeof reviewOn === 'function') && !!reviewOn(ch), false);
  const withRv = ch => _puTry(() => (typeof reviewOpenFor === 'function') && !!reviewOpenFor(c, ch), false);
  const open = j.filter(ch => puUnsent(c, ch) && !cleared(ch));
  const gone = j.filter(ch => !puUnsent(c, ch) && !verdict(ch));
  const allWords = ours.reduce((s, ch) => s + puWordsOf(ch), 0), jWords = j.reduce((s, ch) => s + puWordsOf(ch), 0);
  return { jambo: j.length, total: ours.length, jWords, allWords, share: allWords ? Math.round(jWords / allWords * 100) : 0,
    open, out: open.filter(withRv), unchecked: open.length, uncheckedWords: open.reduce((s, ch) => s + puWordsOf(ch), 0), gone };
}
/* ---- THE CONTRACT'S LIFE: its start, its end and the dated things between ---- */
function puSpanOf(c){
  const start = (typeof dateOnly === 'function' ? _puTry(() => dateOnly(c.effectiveDate || (c.metadata && c.metadata.effectiveDate) || (c.fields && c.fields.effDate)), null) : null)
    || _puDay(((c.audit || [])[0] || {}).at) || _puDay(c.createdAt) || _puToday();
  const end = _puTry(() => (typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : null, null);
  return { start, end: _puDay(end) };
}
const PU_KINDS = ['ask', 'ours', 'jambo', 'sign', 'ob', 'warn', 'bad'];
function puEventsOf(c){
  const ev = [], today = _puToday();
  const push = (at, kind, text) => { const d = _puDay(at); if (d) ev.push({ at: d, t: String(at || ''), kind, text }); };
  const clause = ch => String(ch.clauseLabel || '').trim() || _puT('pu_ev_clause');
  push(((c.audit || [])[0] || {}).at || c.createdAt, 'sign', _puT('pu_ev_created'));
  for (const ch of puAllChanges(c)){
    if (!ch || ch.withdrawn) continue;
    if (ch.authorSide === 'counterparty') push(ch.createdAt, 'ask', _puT('pu_ev_theirs', { what: clause(ch) }));
    else if (puJamboWrote(ch)) push(ch.createdAt, 'jambo', _puT('pu_ev_jambo', { what: clause(ch) }));
    else push(ch.createdAt, 'ours', _puT('pu_ev_ours', { what: clause(ch) }));
  }
  for (const s of (Array.isArray(c.signatures) ? c.signatures : [])) if (s && s.at && s.party !== 'internal-planned') push(s.at, 'sign', _puT('pu_ev_signed', { who: String(s.name || '').trim() || _puT('pu_ev_someone') }));
  for (const o of (Array.isArray(c.obligations) ? c.obligations : [])){
    const st = _puTry(() => (typeof obState === 'function') ? obState(o) : null, null);
    const due = _puDay(_puTry(() => (typeof obligationDue === 'function') ? obligationDue(o) : o.due, o.due));
    if (!due) continue;
    const d = _puDays(today, due);
    const kind = st === 'done' ? 'ob' : st === 'overdue' || (d != null && d < 0) ? 'bad' : (d != null && d <= 7) ? 'warn' : 'ob';
    const what = String(o.title || o.text || o.what || '').trim() || _puT('pu_ev_duty');
    push(due, kind, _puT(kind === 'bad' ? 'pu_ev_duty_late' : st === 'done' ? 'pu_ev_duty_done' : 'pu_ev_duty_due', { what }));
  }
  return ev.sort((a, b) => a.at.localeCompare(b.at) || a.t.localeCompare(b.t));
}

/* ---- THE SCORE: one reading, the panel only shows it ----
   owed  3 for every thing on the Needs you list for this contract
   late  3 more for each of those that is late
   wait  1 · 2 · 3 once the oldest has waited a week · two · a month
   money 2 in the book's top tenth by value · 1 in its top third (where values may be seen) */
function puMoneyBands(book){
  if (!_puMoney()) return { hi: Infinity, mid: Infinity };
  const vs = book.map(c => _puTry(() => (typeof fxRankValue === 'function' && !(typeof fxCounted === 'function' && fxCounted(c).private)) ? fxRankValue(c) : null, null)).filter(v => v != null && v > 0).sort((a, b) => b - a);
  if (!vs.length) return { hi: Infinity, mid: Infinity };
  return { hi: vs[Math.max(0, Math.ceil(vs.length * 0.1) - 1)], mid: vs[Math.max(0, Math.ceil(vs.length / 3) - 1)] };
}
function puRowOf(c, needs, bands){
  const e = needs.get(String(c.id)) || { n: 0, late: 0, age: null, rows: [] };
  const val = _puMoney() ? _puTry(() => (typeof fxRankValue === 'function' && !(typeof fxCounted === 'function' && fxCounted(c).private)) ? fxRankValue(c) : null, null) : null;
  const span = puSpanOf(c), left = span.end ? _puDays(_puToday(), span.end) : null;
  const parts = {
    owed: e.n * 3,
    late: e.late * 3,
    wait: e.n && e.age != null ? (e.age >= 30 ? 3 : e.age >= 14 ? 2 : e.age >= 7 ? 1 : 0) : 0,
    money: val != null ? (val >= bands.hi ? 2 : val >= bands.mid ? 1 : 0) : 0,
  };
  const J = puJamboOf(c);
  return { id: String(c.id), c, needs: e, val, span, left, parts, score: parts.owed + parts.late + parts.wait + parts.money, J };
}
const _puName = c => String(_puTry(() => (typeof regShortTitle === 'function') ? regShortTitle(c) : c.name, c.name) || '');
function puSort(rows, crit){
  const byName = (a, b) => _puName(a.c).localeCompare(_puName(b.c));
  const valDesc = (a, b) => (a.val == null) - (b.val == null) || (b.val || 0) - (a.val || 0);
  const cmp = {
    needs: (a, b) => (b.score - a.score) || (b.needs.late - a.needs.late) || valDesc(a, b) || byName(a, b),
    money: (a, b) => valDesc(a, b) || (b.score - a.score) || byName(a, b),
    /* soonest end first; ended after the living, no end date last */
    days: (a, b) => { const k = r => r.left == null ? [2, 0] : r.left < 0 ? [1, -r.left] : [0, r.left]; const A = k(a), B = k(b); return (A[0] - B[0]) || (A[1] - B[1]) || byName(a, b); },
    jambo: (a, b) => (b.J.unchecked - a.J.unchecked) || (b.J.uncheckedWords - a.J.uncheckedWords) || (b.J.gone.length - a.J.gone.length) || (b.J.share - a.J.share) || byName(a, b),
  }[crit] || ((a, b) => b.score - a.score);
  return rows.slice().sort(cmp);
}
/* THE ONE READING: every row, ranked by the rule chosen */
function puRead(){
  const book = puBook(), needs = puNeedsMap(), bands = puMoneyBands(book);
  return puSort(book.map(c => puRowOf(c, needs, bands)), _pu.crit);
}
const puCrits = () => PU_CRITS.filter(k => k !== 'money' || _puMoney());
const puNeedCount = rows => rows.filter(r => r.needs.n > 0).length;

/* ---- THE ORDER THIS PERSON LAST SAW, per rule, kept in this browser ---- */
function puSeenRead(){ try { const v = JSON.parse(localStorage.getItem(PU_SEEN_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_){ return {}; } }
function puSeenPut(crit, rows){
  try { const all = puSeenRead(); const m = {}; rows.forEach((r, i) => { m[r.id] = i + 1; }); all[crit] = m; localStorage.setItem(PU_SEEN_KEY, JSON.stringify(all)); } catch (_){ /* a convenience */ }
}

/* ---- WHAT A ROW SAYS ---- */
function puStatusHtml(c){
  const m = _puTry(() => (typeof contractStatusMeta === 'function') ? contractStatusMeta(c) : null, null);
  return m ? `<span class="pu-st" style="color:${m.tx}"><i style="background:${m.dot}"></i>${_puE(m.label)}</span>` : '';
}
function puBigOf(r){
  if (_pu.crit === 'money') return { n: r.val != null && typeof fmtMoneyShortOf === 'function' ? fmtMoneyShortOf(r.c) : '—', w: '' };
  if (_pu.crit === 'days') return r.left == null ? { n: '—', w: _puT('pu_w_no_end') } : r.left < 0 ? { n: '—', w: _puT('pu_w_ended') } : { n: String(r.left), w: _puTn('pu_w_days', r.left) };
  if (_pu.crit === 'jambo') return { n: String(r.J.unchecked), w: r.J.jambo ? (r.J.unchecked ? _puT('pu_w_to_check', { pc: r.J.share }) : _puT('pu_w_all_checked', { pc: r.J.share })) : _puT('pu_w_none_jambo') };
  return { n: String(r.score), w: r.needs.n ? _puTn('pu_w_open', r.needs.n) + (r.needs.late ? ' · ' + _puTn('pu_w_late', r.needs.late) : '') : _puT('pu_w_quiet') };
}
function puMovedOf(r){
  if (r.was == null || r.was === r.rank) return { cls: 'same', t: '·', title: _puT('pu_mv_same') };
  const d = r.was - r.rank;
  return d > 0 ? { cls: 'up', t: '▲ ' + d, title: _puTn('pu_mv_up', d) } : { cls: 'down', t: '▼ ' + (-d), title: _puTn('pu_mv_down', -d) };
}
/* THE STRAND: a horizontal double helix from the start to the end, today dashed across, a rung per dated thing */
/* the strand is drawn in the column's own pixels (PU_W follows it, puStrandFit), so a turn is PU_PER wide on every screen */
let PU_W = 600;
const PU_H = 44, PU_MID = 22, PU_AMP = 13, PU_PER = 64;
let _puPhase = 0;
function puXOf(r, day){
  const s = r.span.start, today = _puToday();
  const end = r.span.end || (() => { const evs = puEventsOf(r.c); const last = evs.length ? evs[evs.length - 1].at : today; const t = Date.parse((last > today ? last : today) + 'T00:00:00Z') + 90 * 864e5; return new Date(t).toISOString().slice(0, 10); })();
  const span = Math.max(1, _puDays(s, end) || 1), at = _puDays(s, day);
  return 10 + Math.max(0, Math.min(1, (at == null ? 0 : at) / span)) * (PU_W - 20);
}
const _puYA = x => PU_MID + PU_AMP * Math.sin((x / PU_PER) * Math.PI * 2 + _puPhase);
const _puYB = x => PU_MID - PU_AMP * Math.sin((x / PU_PER) * Math.PI * 2 + _puPhase);
function _puPath(fn, x0, x1){ let d = ''; for (let x = x0; x <= x1 + 0.01; x += 10) d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + fn(x).toFixed(1) + ' '; return d || ('M' + x0 + ' ' + PU_MID); }
function puStrandHtml(r){
  const tx = Math.max(10, Math.min(PU_W - 10, puXOf(r, _puToday())));
  const evs = puEventsOf(r.c);
  const rungs = evs.map(e => { const x = puXOf(r, e.at).toFixed(1);
    return `<line class="pu-rung is-${e.kind}" x1="${x}" x2="${x}" y1="${_puYA(+x).toFixed(1)}" y2="${_puYB(+x).toFixed(1)}"><title>${_puE(e.text)} · ${_puE(puDayWords(e.at))}</title></line>`; }).join('');
  const startW = puDayWords(r.span.start, true), endW = r.span.end ? puDayWords(r.span.end, true) : _puT('pu_no_end');
  return `<div class="pu-strand" data-pu-tx="${tx.toFixed(1)}"><svg viewBox="0 0 ${PU_W} ${PU_H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="pu-hx is-pa" d="${_puPath(_puYA, 10, tx)}"/><path class="pu-hx is-pb" d="${_puPath(_puYB, 10, tx)}"/>
    <path class="pu-hx is-fa" d="${_puPath(_puYA, tx, PU_W - 10)}"/><path class="pu-hx is-fb" d="${_puPath(_puYB, tx, PU_W - 10)}"/>
    <line class="pu-today" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="1" y2="${PU_H - 1}"/>${rungs}</svg>
    <span class="pu-cap">${_puE(startW)}</span><span class="pu-cap is-r">${_puE(endW)}</span></div>`;
}
function puDayWords(iso, short){
  const d = _puDay(iso); if (!d) return '';
  try { return new Date(d + 'T12:00:00Z').toLocaleDateString(typeof langLocale === 'function' ? langLocale() : 'en-GB', short ? { day: 'numeric', month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_){ return d; }
}
function puRowHtml(r, N){
  const big = puBigOf(r), mv = puMovedOf(r), c = r.c;
  const ref = typeof refHtml === 'function' ? refHtml(c) : _puE(c.id);
  const party = String(c.counterparty || '').trim();
  return `<tr class="pu-row${_pu.sel === r.id ? ' is-sel' : ''}" data-pu-row="${_puE(r.id)}" tabindex="0" aria-selected="${_pu.sel === r.id}">
    <td class="pu-rk"><b>${r.rank}</b><small>${_puE(_puT('pu_of', { n: N }))}</small></td>
    <td class="pu-who"><span class="pu-ref">${ref}</span><span class="pu-nm" title="${_puE(_puName(c))}">${_puE(_puName(c))}${party && !_puName(c).includes(party) ? ` <span class="pu-pty">· ${_puE(party)}</span>` : ''}</span>${puStatusHtml(c)}</td>
    <td class="pu-dna">${puStrandHtml(r)}</td>
    <td class="pu-sc"><b>${_puE(big.n)}</b>${big.w ? `<small>${_puE(big.w)}</small>` : ''}</td>
    <td class="pu-mv is-${mv.cls}" title="${_puE(mv.title)}">${_puE(mv.t)}</td></tr>`;
}
const _puColHead = () => ({ needs: 'pu_col_score', money: 'pu_col_value', days: 'pu_col_days', jambo: 'pu_col_check' })[_pu.crit];
function puTableHtml(rows){
  const N = rows.length, shown = rows.slice(0, _pu.shown);
  if (!N) return `<div class="pu-empty">${_puE(_puT('pu_empty'))}</div>`;
  return `<table class="pu-t"><colgroup><col class="pu-c-rk"><col class="pu-c-who"><col class="pu-c-dna"><col class="pu-c-sc"><col class="pu-c-mv"></colgroup>
    <thead><tr><th scope="col">#</th><th scope="col">${_puE(_puT('pu_col_who'))}</th><th scope="col">${_puE(_puT('pu_col_dna'))}</th><th scope="col" class="is-r">${_puE(_puT(_puColHead()))}</th><th scope="col" class="is-r">${_puE(_puT('pu_col_moved'))}</th></tr></thead>
    <tbody id="pu-tbody">${shown.map(r => puRowHtml(r, N)).join('')}</tbody></table>
    ${N > shown.length ? `<div class="pu-foot"><span>${_puE(_puT('pu_showing', { n: shown.length, of: N }))}</span><button type="button" class="ui-btn ui-btn-sm" data-pu-more>${_puE(_puTn('pu_more', Math.min(PU_PAGE, N - shown.length)))}</button></div>` : ''}`;
}
/* THE HEAD, ONE WHITE CARD (the Board's own): name, what it is, the live dot and when it was counted, Pause;
   under them the four rules as chips */
function puHeadHtml(rows){
  const need = puNeedCount(rows), j = rows.filter(r => r.J.unchecked).length;
  const facts = [_puTn('pu_f_contracts', rows.length), _puTn('pu_f_need', need), j ? _puTn('pu_f_jambo', j) : ''].filter(Boolean).join(' · ');
  const chips = puCrits().map(k => `<button type="button" class="pu-chip${_pu.crit === k ? ' is-on' : ''}" data-pu-crit="${k}" aria-pressed="${_pu.crit === k}">${_puE(_puT('pu_c_' + k))}</button>`).join('');
  return `<section class="pu-head ph-card" aria-label="${_puE(_puT('nav_pulse'))}">
    <div class="pu-top"><h1 class="pu-t1">${_puE(_puT('nav_pulse'))}</h1><span class="pu-sub">${_puE(_puT('pu_sub'))}</span>
      <span class="pu-live${_pu.held ? ' is-held' : ''}"><i></i>${_puE(_puT(_pu.held ? 'pu_held' : 'hb_live'))}</span><span class="pu-at">· ${_puE(_puT('pu_counted', { time: _pu.at }))}</span>
      <span class="pu-facts" id="pu-facts">${_puE(facts)}</span><span class="pu-grow"></span>
      <button type="button" class="ui-btn ui-btn-sm" id="pu-hold" aria-pressed="${_pu.held}">${_puE(_puT(_pu.held ? 'pu_resume' : 'pu_pause'))}</button></div>
    <div class="pu-crit" role="group" aria-label="${_puE(_puT('pu_ranked_by'))}"><span class="pu-lab">${_puE(_puT('pu_ranked_by'))}</span>${chips}<span class="pu-grow"></span><span class="pu-how">${_puE(_puT('pu_how_' + _pu.crit))}</span></div>
  </section>
  <div class="pu-key" aria-label="${_puE(_puT('pu_key'))}">${['ask', 'ob', 'sign', 'jambo', 'warn', 'bad'].map(k => `<span><b class="is-${k}"></b>${_puE(_puT('pu_k_' + k))}</span>`).join('')}<span class="pu-key-r">${_puE(_puT('pu_k_line'))}</span></div>`;
}
/* THE LATEST: the newest dated thing on any contract in the book, at most today */
function puLatestHtml(rows){
  const today = _puToday();
  let best = null;
  for (const r of rows) for (const e of puEventsOf(r.c)) if (e.at <= today && (!best || e.t > best.e.t)) best = { r, e };
  if (!best) return '';
  const party = String(best.r.c.counterparty || '').trim() || _puName(best.r.c);
  return `<div class="pu-latest" id="pu-latest"><span class="pu-lab">${_puE(_puT('pu_latest'))}</span><span class="pu-ev"><b>${_puE(party)}</b> · ${_puE(best.e.text)} · ${_puE(puDayWords(best.e.at))}</span></div>`;
}

/* ---- JAMBO'S PANEL: why it sits here, what would move it, the doors (no call) ---- */
function puListWords(a){ return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' ' + _puT('pu_and') + ' ' + a[a.length - 1]; }
function puNeedParts(r){ return r.needs.rows.filter(x => !x.bundle).map(x => _puTry(() => (typeof ndParts === 'function') ? ndParts(x) : null, null)).filter(Boolean); }
/* a row's words as a phrase: its title, and where the title only opens a line ("Overdue:") the line it opens */
function puNeedTitle(p){
  const t = String(p.title || '').replace(/\s+/g, ' ').trim();
  if (/:$/.test(t)){ const more = String(p.note || p.deal || '').split(' · ')[0].trim(); return more ? t + ' ' + more : t.replace(/:$/, ''); }
  return t;
}
const puNeedWords = p => [puNeedTitle(p), p.when].filter(Boolean).join(', ');
function puSayOf(r){
  const c = r.c, P = puNeedParts(r), J = r.J, out = [];
  if (_pu.crit === 'jambo'){
    out.push(J.unchecked ? _puTn('pu_say_j_open', J.unchecked, { rank: r.rank, pc: J.share, words: J.uncheckedWords })
      : J.jambo ? _puT('pu_say_j_done', { rank: r.rank, pc: J.share }) : _puT('pu_say_j_none', { rank: r.rank }));
    if (J.unchecked) out.push(_puT('pu_say_j_read', { party: String(c.counterparty || '').trim() || _puT('pu_the_other_side') }));
    if (J.gone.length) out.push(_puTn('pu_say_j_gone', J.gone.length));
  } else if (_pu.crit === 'money'){
    out.push(r.val != null ? _puT('pu_say_m', { rank: r.rank, money: fmtMoneyShortOf(c) }) : _puT('pu_say_m_none', { rank: r.rank }));
  } else if (_pu.crit === 'days'){
    out.push(r.left == null ? _puT('pu_say_d_none', { rank: r.rank }) : r.left < 0 ? _puT('pu_say_d_ended', { rank: r.rank, day: puDayWords(r.span.end) }) : _puT('pu_say_d', { rank: r.rank, n: r.left, day: puDayWords(r.span.end) }));
  } else {
    const why = P.slice(0, 2).map(puNeedWords).filter(Boolean);
    out.push(why.length ? _puT('pu_say_n', { rank: r.rank, why: puListWords(why) }) : _puT('pu_say_n_none', { rank: r.rank }));
    if (P.length > 2) out.push(_puTn('pu_say_n_more', P.length - 2));
    if (r.parts.money) out.push(_puT(r.parts.money === 2 ? 'pu_say_n_m2' : 'pu_say_n_m1', { money: fmtMoneyShortOf(c) }));
    if (J.unchecked) out.push(_puTn('pu_say_n_j', J.unchecked));
  }
  if (r.was != null && r.was !== r.rank) out.push(r.was > r.rank ? _puTn('pu_say_up', r.was - r.rank) : _puTn('pu_say_down', r.rank - r.was));
  return out.join(' ');
}
function puPartsHtml(r){
  const rows = [['owed', r.parts.owed, ''], ['late', r.parts.late, 'bad'], ['wait', r.parts.wait, 'warn'], ['money', r.parts.money, 'ink']].filter(p => p[1] > 0);
  const max = Math.max(6, ...rows.map(p => p[1]));
  return `<div class="ins-sec pu-sec"><h3>${_puE(_puT('pu_p_head', { n: r.score }))}</h3>${rows.length
    ? `<div class="pu-bars">${rows.map(p => `<div class="pu-bar"><span>${_puE(_puT('pu_p_' + p[0]))}</span><span class="pu-tr"><i class="is-${p[2] || 'owed'}" style="width:${Math.round(p[1] / max * 100)}%"></i></span><b>${p[1]}</b></div>`).join('')}</div>`
    : `<p class="pu-q">${_puE(_puT('pu_p_none'))}</p>`}<p class="pu-q">${_puE(_puT('pu_p_rule'))}</p></div>`;
}
function puJamboHtml(r){
  const J = r.J;
  if (!J.total) return `<div class="ins-sec pu-sec"><h3>${_puE(_puT('pu_j_head'))}</h3><p class="pu-q">${_puE(_puT('pu_j_nothing'))}</p></div>`;
  const list = J.open.slice(0, 5).map(ch => `<li><span class="pu-j-cl">${_puE(String(ch.clauseLabel || '').trim() || _puT('pu_ev_clause'))}</span><span>${_puE(_puTn('pu_j_words', puWordsOf(ch)))}${J.out.includes(ch) ? ' · ' + _puE(_puT('pu_j_with_rv')) : ''}</span></li>`).join('');
  return `<div class="ins-sec pu-sec"><h3>${_puE(_puT('pu_j_head'))}</h3>
    <dl class="pu-facts2">
      <div><dt>${_puE(_puT('pu_j_by'))}</dt><dd>${_puE(_puT('pu_j_of', { n: J.jambo, of: J.total }))}</dd></div>
      <div><dt>${_puE(_puT('pu_j_share'))}</dt><dd class="${J.share >= 60 ? 'is-owed' : ''}">${_puE(J.share + '% · ' + _puTn('pu_j_words', J.jWords))}</dd></div>
      <div><dt>${_puE(_puT('pu_j_open'))}</dt><dd class="${J.unchecked ? 'is-owed' : ''}">${_puE(J.unchecked + ' · ' + _puTn('pu_j_words', J.uncheckedWords))}</dd></div>
      <div><dt>${_puE(_puT('pu_j_gone'))}</dt><dd class="${J.gone.length ? 'is-bad' : ''}">${J.gone.length}</dd></div>
    </dl>${list ? `<ol class="pu-j-list">${list}</ol>` : ''}</div>`;
}
function puDoorsHtml(r){
  const P = puNeedParts(r).slice(0, 3), c = r.c;
  const btn = p => { const t = puNeedTitle(p), w = _puT('nd_btn_' + p.btn), cut = t.length > 34 ? t.slice(0, 33).replace(/\s+\S*$/, '') + '…' : t;
    return `<button type="button" class="ui-btn ui-btn-sm" ${p.attrs} title="${_puE(t)}">${_puE(cut ? w + ' · ' + cut : w)}</button>`; };
  const more = [];
  if (r.J.unchecked){ more.push(`<button type="button" class="ui-btn ui-btn-sm" data-pu-red="${_puE(c.id)}">${_puE(_puTn('pu_d_read_j', r.J.unchecked))}</button>`);
    more.push(`<button type="button" class="ui-btn ui-btn-sm" data-pu-review="${_puE(c.id)}">${_puE(_puT('rv_head_ask'))}</button>`); }
  more.push(`<button type="button" class="ui-btn ui-btn-sm" data-pu-open="${_puE(c.id)}">${_puE(_puT('pu_d_open'))}</button>`);
  return `<div class="ins-sec pu-sec"><h3>${_puE(_puT('pu_next'))}</h3><div class="pu-doors">${P.map(btn).join('')}${more.join('')}</div></div>`;
}
function puTrailHtml(r){
  const today = _puToday();
  const evs = puEventsOf(r.c).filter(e => e.at <= today).slice(-6).reverse();
  return `<div class="ins-sec pu-sec"><h3>${_puE(_puT('pu_trail'))}</h3>${evs.length ? `<ol class="pu-trail">${evs.map(e => `<li><span class="pu-tt">${_puE(puDayWords(e.at, true))}</span><i class="is-${e.kind}"></i><span>${_puE(e.text)}</span></li>`).join('')}</ol>` : `<p class="pu-q">${_puE(_puT('pu_trail_none'))}</p>`}</div>`;
}
function puPanelBody(r){
  const c = r.c;
  const card = (typeof jamboSayCardHtml === 'function') ? jamboSayCardHtml({ who: _puT('pu_say_who'), text: puSayOf(r), foot: _puE(_puT('pu_say_free')) })
    : `<p>${_puE(puSayOf(r))}</p>`;
  const end = r.span.end ? (r.left < 0 ? _puT('pu_w_ended') : puDayWords(r.span.end) + ' · ' + _puTn('pu_w_days', r.left)) : _puT('pu_no_end');
  const facts = `<dl class="pu-facts2">
    <div><dt>${_puE(_puT('pu_fx_stage'))}</dt><dd>${puStatusHtml(c)}</dd></div>
    <div><dt>${_puE(_puT('pu_fx_party'))}</dt><dd>${_puE(String(c.counterparty || '').trim() || '—')}</dd></div>
    ${_puMoney() ? `<div><dt>${_puE(_puT('pu_fx_value'))}</dt><dd>${_puE(r.val != null && typeof fmtMoneyShortOf === 'function' ? fmtMoneyShortOf(c) : '—')}</dd></div>` : ''}
    <div><dt>${_puE(_puT('pu_fx_ends'))}</dt><dd class="${r.left != null && r.left >= 0 && r.left <= 45 ? 'is-owed' : ''}">${_puE(end)}</dd></div></dl>`;
  return `<div class="pu-side" id="pu-side"><div class="ins-sec pu-sec is-say">${card}</div><div class="ins-sec pu-sec">${facts}</div>${_pu.crit === 'needs' ? puPartsHtml(r) : ''}${puJamboHtml(r)}${puDoorsHtml(r)}${puTrailHtml(r)}</div>`;
}
function puJlSay(){
  const rows = _pu.rows || [];
  const need = puNeedCount(rows), top = rows[0];
  const j = rows.filter(r => r.J.unchecked).length;
  const lines = [_puE(_puT('pu_ov_head', { n: rows.length, need }))];
  if (top && top.needs.n) lines.push(_puE(_puT('pu_ov_top', { name: _puName(top.c), n: top.needs.n })));
  if (j) lines.push(_puE(_puTn('pu_ov_jambo', j)));
  lines.push(_puE(_puT('pu_ov_pick')));
  return { lines, src: _puT('pu_say_free') };
}
function puSidePaint(wide){
  if (!wide || typeof insPaintPanel !== 'function') return;
  const r = _pu.sel ? (_pu.rows || []).find(x => x.id === _pu.sel) : null;
  const base = { seat: PU_SEAT, jlSay: puJlSay, jlWord: _puT('pu_jl_word') };
  if (!r){ insPaintPanel(Object.assign(base, { empty: _puT('pu_ov_pick') })); _pu.psig = ''; return; }
  const c = r.c, party = String(c.counterparty || '').trim();
  insPaintPanel(Object.assign(base, { item: { id: r.id },
    head: { eyebrow: (typeof refHtml === 'function' ? refHtml(c) : _puE(c.id)) + ' · ' + _puE(_puT('pu_eb', { rank: r.rank, n: (_pu.rows || []).length })), title: _puName(c), sub: party ? _puE(party) : '',
      acts: [{ k: 'pu-open', kind: 'accent', label: _puT('pu_d_open'), run: () => puOpen(r.id) }] },
    body: puPanelBody(r) }));
  _pu.psig = puRowSig(r);
}
const puRowSig = r => [r.id, r.rank, r.was, r.score, r.needs.n, r.needs.late, r.J.unchecked, r.J.gone.length, r.left, _pu.crit].join('|');

/* ---- THE PAGE ---- */
function puCss(){ return `
  #pu-page{gap:10px}
  #pu-page .pu-head{flex:none;padding:14px 16px;margin-top:var(--page-pad-t)}
  #pu-page .pu-top,#pu-page .pu-crit{display:flex;align-items:center;flex-wrap:wrap;gap:6px var(--s-2,8px);font-size:var(--t-meta);color:var(--hb-mute,var(--color-text))}
  #pu-page .pu-t1{margin:0;font-family:var(--font-title);font-size:20px;font-weight:var(--w-title-serif,600);line-height:1.2;letter-spacing:-.01em;color:var(--color-text);white-space:nowrap}
  #pu-page .pu-sub{font-size:var(--t-body);color:var(--color-text);white-space:nowrap;margin-right:var(--s-2,8px)}
  #pu-page .pu-live{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;color:var(--accent-ink)}
  #pu-page .pu-live i{width:7px;height:7px;border-radius:50%;background:var(--st-green-dot);display:inline-block;animation:pu-beat 2s infinite}
  #pu-page .pu-live.is-held{color:var(--color-quiet)} #pu-page .pu-live.is-held i{background:var(--st-gray-dot);animation:none}
  @keyframes pu-beat{0%{box-shadow:0 0 0 0 rgba(58,138,98,.5)}70%{box-shadow:0 0 0 7px rgba(58,138,98,0)}100%{box-shadow:0 0 0 0 rgba(58,138,98,0)}}
  #pu-page .pu-at{white-space:nowrap;margin-left:-4px}
  #pu-page .pu-facts{white-space:nowrap;margin-left:var(--s-2,8px);color:var(--color-text)}
  #pu-page .pu-grow{flex:1 1 auto}
  #pu-page .pu-crit{margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)}
  #pu-page .pu-lab{font-size:var(--t-micro);letter-spacing:.3px;text-transform:uppercase;color:var(--color-quiet);margin-right:4px;white-space:nowrap}
  #pu-page .pu-chip{height:30px;padding:0 12px;border-radius:999px;border:0;background:var(--color-neutral-100);color:var(--color-text);font:inherit;font-size:var(--t-label);font-weight:var(--w-label);cursor:pointer;white-space:nowrap}
  #pu-page .pu-chip:hover{background:var(--color-neutral-200)}
  #pu-page .pu-chip.is-on{background:var(--color-text);color:#fff}
  #pu-page .pu-how{font-size:var(--t-meta);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
  #pu-page .pu-key{flex:none;display:flex;flex-wrap:wrap;gap:6px 14px;font-size:var(--t-micro);color:var(--color-quiet);padding:0 4px}
  #pu-page .pu-key span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  #pu-page .pu-key b{width:3px;height:12px;border-radius:2px;display:inline-block}
  #pu-page .pu-key-r{margin-left:auto}
  #pu-page .ins-body{flex:1 1 auto;min-height:0}
  #pu-page.is-narrow .ins-body{grid-template-columns:minmax(0,1fr)}
  #pu-page .pu-card{width:100%;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;background:var(--color-surface);border-radius:var(--radius-lg);box-shadow:var(--hb-shadow,0 1px 2px rgba(0,0,0,.05));overflow:hidden}
  #pu-page .pu-wrap{flex:1 1 auto;min-height:0;overflow:auto}
  #pu-page .pu-t{width:100%;border-collapse:collapse;table-layout:fixed}
  #pu-page .pu-c-rk{width:56px} #pu-page .pu-c-who{width:30%} #pu-page .pu-c-sc{width:112px} #pu-page .pu-c-mv{width:64px}
  #pu-page .pu-t th{position:sticky;top:0;z-index:2;background:var(--color-surface);text-align:left;font-size:var(--t-micro);font-weight:var(--w-label);letter-spacing:.3px;text-transform:uppercase;color:var(--color-quiet);padding:10px 8px;border-bottom:1px solid var(--color-divider);white-space:nowrap}
  #pu-page .pu-t th:first-child,#pu-page .pu-t td:first-child{padding-left:var(--s-4,16px)} #pu-page .pu-t th:last-child,#pu-page .pu-t td:last-child{padding-right:var(--s-4,16px)}
  #pu-page .pu-t th.is-r{text-align:right}
  #pu-page .pu-row{cursor:pointer;background:var(--color-surface)}
  #pu-page .pu-row td{padding:10px 8px;border-bottom:1px solid var(--color-divider);vertical-align:middle}
  #pu-page .pu-row:hover{background:var(--color-neutral-50,#FAFAFC)}
  #pu-page .pu-row.is-sel{background:var(--accent-soft,#E6F3F0);box-shadow:inset 3px 0 0 var(--accent-solid)}
  #pu-page .pu-row:focus-visible{outline:2px solid var(--accent-solid);outline-offset:-2px}
  #pu-page .pu-row.is-hit td{animation:pu-hit 1.2s ease-out}
  @keyframes pu-hit{0%{background:var(--st-amber-bg,#FBEFDD)}100%{background:transparent}}
  #pu-page .pu-rk b{display:block;font-family:var(--font-title);font-size:20px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
  #pu-page .pu-rk small{display:block;margin-top:4px;font-size:var(--t-micro);color:var(--color-quiet);white-space:nowrap}
  #pu-page .pu-who{min-width:0}
  #pu-page .pu-ref{display:block;font-size:var(--t-micro);color:var(--color-quiet);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #pu-page .pu-nm{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:var(--t-card);font-weight:var(--w-strong);line-height:1.3;color:var(--color-text)}
  #pu-page .pu-pty{font-weight:400}
  .pu-st{display:inline-flex;align-items:center;gap:6px;margin-top:3px;font-size:var(--t-label);white-space:nowrap}
  .pu-st i{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}
  #pu-page .pu-dna{min-width:0}
  #pu-page .pu-strand{position:relative;height:44px}
  #pu-page .pu-strand svg{display:block;width:100%;height:44px;overflow:visible}
  #pu-page .pu-hx{fill:none;stroke:var(--color-text);stroke-width:2.2;vector-effect:non-scaling-stroke}
  #pu-page .pu-hx.is-pa{stroke-opacity:.9} #pu-page .pu-hx.is-pb{stroke-opacity:.45} #pu-page .pu-hx.is-fa{stroke-opacity:.26} #pu-page .pu-hx.is-fb{stroke-opacity:.13}
  #pu-page .pu-today{stroke:var(--color-text);stroke-opacity:.5;stroke-width:2;stroke-dasharray:3 4;vector-effect:non-scaling-stroke}
  #pu-page .pu-rung{stroke-width:4;stroke-linecap:round;vector-effect:non-scaling-stroke}
  #pu-page .pu-rung.is-bad{stroke-width:6}
  .pu-rung.is-ask,.pu-key b.is-ask,.pu-trail i.is-ask{stroke:var(--st-steel-dot);background:var(--st-steel-dot)}
  .pu-rung.is-ours,.pu-rung.is-sign,.pu-key b.is-sign,.pu-trail i.is-sign,.pu-trail i.is-ours{stroke:var(--color-text);background:var(--color-text)}
  .pu-rung.is-jambo,.pu-key b.is-jambo,.pu-trail i.is-jambo{stroke:var(--st-violet-dot);background:var(--st-violet-dot)}
  .pu-rung.is-ob,.pu-key b.is-ob,.pu-trail i.is-ob{stroke:var(--st-green-dot);background:var(--st-green-dot)}
  .pu-rung.is-warn,.pu-key b.is-warn,.pu-trail i.is-warn{stroke:var(--st-amber-dot);background:var(--st-amber-dot)}
  .pu-rung.is-bad,.pu-key b.is-bad,.pu-trail i.is-bad{stroke:var(--st-ruby-dot);background:var(--st-ruby-dot)}
  #pu-page .pu-cap{position:absolute;left:0;top:-4px;font-size:10.5px;color:var(--color-quiet);pointer-events:none;white-space:nowrap}
  #pu-page .pu-cap.is-r{left:auto;right:0}
  #pu-page .pu-sc{text-align:right;font-variant-numeric:tabular-nums}
  #pu-page .pu-sc b{display:block;font-size:18px;font-weight:var(--w-strong);line-height:1;white-space:nowrap}
  #pu-page .pu-sc small{display:block;margin-top:4px;font-size:var(--t-micro);color:var(--color-quiet);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #pu-page .pu-mv{text-align:right;font-size:var(--t-meta);white-space:nowrap;font-variant-numeric:tabular-nums}
  #pu-page .pu-mv.is-up{color:var(--st-ruby-fg,var(--st-ruby-dot))} #pu-page .pu-mv.is-down{color:var(--accent-ink)} #pu-page .pu-mv.is-same{color:var(--color-quiet)}
  #pu-page .pu-foot{flex:none;display:flex;align-items:center;gap:12px;justify-content:space-between;padding:10px var(--s-4,16px);border-top:1px solid var(--color-divider);font-size:var(--t-meta)}
  #pu-page .pu-empty{padding:24px var(--s-4,16px);font-size:var(--t-body)}
  #pu-page .pu-latest{flex:none;display:flex;align-items:center;gap:10px;min-width:0;font-size:var(--t-meta);color:var(--color-text);padding:0 4px}
  #pu-page .pu-ev{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pu-side{display:block}
  .pu-side .pu-sec.is-say{border-bottom:0;padding-bottom:4px}
  .pu-side .pu-facts2{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:0}
  .pu-side .pu-facts2 div{min-width:0} .pu-side .pu-facts2 dt{font-size:var(--t-micro);color:var(--color-quiet)}
  .pu-side .pu-facts2 dd{margin:2px 0 0;font-weight:var(--w-strong);font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}
  .pu-side .pu-facts2 dd .pu-st{margin:0}
  .pu-side dd.is-owed{color:var(--st-amber-fg,var(--st-amber-dot))} .pu-side dd.is-bad{color:var(--st-ruby-fg,var(--st-ruby-dot))}
  .pu-side .pu-sec h3{margin:0 0 8px;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text)}
  .pu-side .pu-q{margin:6px 0 0;font-size:var(--t-meta);color:var(--color-text)}
  .pu-side .pu-bars{display:flex;flex-direction:column;gap:6px}
  .pu-side .pu-bar{display:grid;grid-template-columns:minmax(0,1fr) 110px 24px;gap:10px;align-items:center;font-size:var(--t-meta)}
  .pu-side .pu-bar b{text-align:right;font-weight:var(--w-label);font-variant-numeric:tabular-nums}
  .pu-side .pu-tr{height:6px;border-radius:3px;background:var(--color-neutral-100);overflow:hidden}
  .pu-side .pu-tr i{display:block;height:100%;border-radius:3px;background:var(--st-steel-dot)}
  .pu-side .pu-tr i.is-bad{background:var(--st-ruby-dot)} .pu-side .pu-tr i.is-warn{background:var(--st-amber-dot)} .pu-side .pu-tr i.is-ink{background:var(--color-text)}
  .pu-side .pu-j-list,.pu-side .pu-trail{list-style:none;margin:10px 0 0;padding:0}
  .pu-side .pu-j-list li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:6px 0;border-top:1px solid var(--color-divider);font-size:var(--t-meta)}
  .pu-side .pu-j-cl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pu-side .pu-doors{display:flex;flex-wrap:wrap;gap:8px}
  .pu-side .pu-trail li{display:grid;grid-template-columns:64px 10px minmax(0,1fr);gap:8px;padding:6px 0;border-top:1px solid var(--color-divider);font-size:var(--t-meta)}
  .pu-side .pu-trail li:first-child{border-top:0}
  .pu-side .pu-tt{color:var(--color-quiet);font-size:var(--t-micro);white-space:nowrap}
  .pu-side .pu-trail i{width:8px;height:8px;border-radius:50%;margin-top:5px}
  @media (prefers-reduced-motion:reduce){ #pu-page .pu-live i{animation:none} #pu-page .pu-row.is-hit td{animation:none} }
`; }
function renderPulse(){
  const host = document.getElementById('content'); if (!host) return;
  if (!_pu.at) _pu.at = puClock();
  const rows = puRank();
  const wide = typeof window.insFits === 'function' && insFits() && typeof window.insPaintPanel === 'function';
  if (_puBack){ if (rows.some(r => r.id === _puBack)){ _pu.sel = _puBack; if (typeof insSelect === 'function') insSelect(PU_SEAT, _puBack); } _puBack = null; }
  if (wide && typeof insPick === 'function') _pu.sel = insPick(PU_SEAT, rows.slice(0, _pu.shown).map(r => r.id), { none: true });
  host.innerHTML = `<div class="view-enter sap-page ins-page pu-page${wide ? '' : ' is-narrow'}" id="pu-page" data-ins-page="pulse" data-ins="${wide ? 1 : 0}"><style>${puCss()}</style>
    ${puHeadHtml(rows)}
    <div class="ins-body"><section class="ins-card pu-card" aria-label="${_puE(_puT('nav_pulse'))}"><div class="ins-scroll pu-wrap scroll-thin" id="pu-scroll">${puTableHtml(rows)}</div></section>${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${_puE(_puT('pu_panel_label'))}"></aside>` : ''}</div>
    ${puLatestHtml(rows)}</div>`;
  puStrandFit();
  puListWire(wide);
  puSidePaint(wide);
  puWire();
  puStart();
  if (typeof setActiveNav === 'function') setActiveNav('pulse');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* measure the strand column once it stands; a different width draws the rows again in it (one extra paint, on a resize only) */
function puStrandFit(){
  const th = document.querySelector('#pu-page .pu-t thead th:nth-child(3)'); if (!th) return;
  const w = Math.round(th.getBoundingClientRect().width - 16);
  if (w < 60 || Math.abs(w - PU_W) < 8) return;
  PU_W = w;
  const sc = document.getElementById('pu-scroll'); if (!sc || !_pu.rows) return;
  const top = sc.scrollTop; sc.innerHTML = puTableHtml(_pu.rows); sc.scrollTop = top;
}
function puClock(){ try { return new Date().toLocaleTimeString(typeof langLocale === 'function' ? langLocale() : undefined, { hour: '2-digit', minute: '2-digit' }); } catch (_){ return ''; } }
/* rank the book, carrying each row's place before (this sitting's last paint, else the person's last visit) */
function puRank(){
  const rows = puRead();
  const before = _pu.prev || (puSeenRead()[_pu.crit] || {});
  rows.forEach((r, i) => { r.rank = i + 1; r.was = before[r.id] != null ? Number(before[r.id]) : null; });
  const prev = {}; rows.forEach(r => { prev[r.id] = r.rank; });
  _pu.prev = prev; _pu.rows = rows; _pu.sig = rows.slice(0, _pu.shown).map(puRowSig).join(';');
  puSeenPut(_pu.crit, rows);
  return rows;
}
function puListWire(wide){
  const tb = document.getElementById('pu-tbody'); if (!tb) return;
  if (typeof insListWire === 'function'){
    insListWire(tb, { rowSel: 'tr[data-pu-row]', idOf: row => row.getAttribute('data-pu-row'),
      onSelect: id => puChoose(id, wide), onOpen: id => puOpen(id) });
  }
  puWatchRows();
}
function puChoose(id, wide){
  if (!wide){ puOpen(id); return; }
  if (_pu.sel === id) { puOpen(id); return; }
  _pu.sel = id; if (typeof insSelect === 'function') insSelect(PU_SEAT, id);
  document.querySelectorAll('#pu-tbody tr[data-pu-row]').forEach(tr => { const on = tr.getAttribute('data-pu-row') === id; tr.classList.toggle('is-sel', on); tr.setAttribute('aria-selected', String(on)); });
  puSidePaint(true); puKeep();
}
/* the contract's paper with its Dossier — the one landing every Workspace door shares */
function puOpen(id){
  const go = () => { if (!(typeof roomHomeLand === 'function' && roomHomeLand(id)) && typeof openWorkspace === 'function') openWorkspace(id); };
  if (typeof dkLeavePageThen === 'function') dkLeavePageThen(go); else go();
}
/* ---- LIVE: the book read again, the rows that moved glide to their place ---- */
function puRepaint(){
  if (typeof state === 'undefined' || state.view !== 'pulse') return;
  const page = document.getElementById('pu-page'), tb = document.getElementById('pu-tbody'); if (!page || !tb) { renderPulse(); return; }
  const was = _pu.sig, beforeTop = new Map();
  tb.querySelectorAll('tr[data-pu-row]').forEach(tr => beforeTop.set(tr.getAttribute('data-pu-row'), tr.getBoundingClientRect().top));
  const oldRank = Object.assign({}, _pu.prev || {});
  _pu.at = puClock();
  const rows = puRank();
  if (_pu.sig === was){ const f = document.getElementById('pu-facts'); if (f) puHeadFactsPut(rows); return; }
  const sc = document.getElementById('pu-scroll'), top = sc ? sc.scrollTop : 0;
  const wide = page.getAttribute('data-ins') === '1';
  if (sc) sc.innerHTML = puTableHtml(rows);
  if (sc) sc.scrollTop = top;
  puStrandFit();
  const head = page.querySelector('.pu-head'); if (head){ const tmp = document.createElement('div'); tmp.innerHTML = puHeadHtml(rows); head.replaceWith(tmp.firstElementChild); }
  const lt = document.getElementById('pu-latest'), lh = puLatestHtml(rows); if (lt && lh){ lt.outerHTML = lh; }
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('#pu-tbody tr[data-pu-row]').forEach(tr => {
    const id = tr.getAttribute('data-pu-row'), b = beforeTop.get(id), r = rows.find(x => x.id === id);
    if (r && oldRank[id] != null && oldRank[id] !== r.rank){ tr.classList.add('is-hit'); }
    if (reduce || b == null || typeof tr.animate !== 'function') return;
    const d = b - tr.getBoundingClientRect().top;
    if (Math.abs(d) > 1) tr.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
  puListWire(wide);
  const r = _pu.sel ? rows.find(x => x.id === _pu.sel) : null;
  if (wide && (!r || puRowSig(r) !== _pu.psig)) puSidePaint(true);
}
function puHeadFactsPut(rows){
  const f = document.getElementById('pu-facts'); if (!f) return;
  const need = puNeedCount(rows), j = rows.filter(r => r.J.unchecked).length;
  f.textContent = [_puTn('pu_f_contracts', rows.length), _puTn('pu_f_need', need), j ? _puTn('pu_f_jambo', j) : ''].filter(Boolean).join(' · ');
  const at = document.querySelector('#pu-page .pu-at'); if (at) at.textContent = '· ' + _puT('pu_counted', { time: _pu.at });
}
function puStart(){
  if (!_pu.tick) _pu.tick = setInterval(() => {
    if (typeof state === 'undefined' || state.view !== 'pulse'){ clearInterval(_pu.tick); _pu.tick = 0; return; }
    if (_pu.held || (typeof document !== 'undefined' && document.hidden)) return;
    try { puRepaint(); } catch (e){ if (typeof console !== 'undefined') console.warn('pulse: repaint failed', e); }
  }, PU_TICK_MS);
  if (!_pu.raf && typeof requestAnimationFrame === 'function') _pu.raf = requestAnimationFrame(puFrame);
}
/* THE TWIST: rows in sight only, a few frames a second, still where less motion is asked or the page is held */
let _puLast = 0;
const _puInSight = new Set();
let _puIO = null;
function puWatchRows(){
  if (typeof IntersectionObserver !== 'function') return;
  if (_puIO) _puIO.disconnect();
  _puInSight.clear();
  const root = document.getElementById('pu-scroll');
  _puIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) _puInSight.add(e.target); else _puInSight.delete(e.target); }), { root, rootMargin: '40px' });
  document.querySelectorAll('#pu-tbody .pu-strand').forEach(el => _puIO.observe(el));
}
function puFrame(ts){
  _pu.raf = 0;
  if (typeof state === 'undefined' || state.view !== 'pulse') return;
  const still = (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) || _pu.held || document.hidden;
  if (!still && ts - _puLast > 1000 / PU_FPS){
    _puLast = ts; _puPhase += 0.05;
    for (const el of _puInSight){
      if (!el.isConnected){ _puInSight.delete(el); continue; }
      const tx = Number(el.getAttribute('data-pu-tx')) || 10, svg = el.firstElementChild; if (!svg) continue;
      const P = svg.children;
      P[0].setAttribute('d', _puPath(_puYA, 10, tx)); P[1].setAttribute('d', _puPath(_puYB, 10, tx));
      P[2].setAttribute('d', _puPath(_puYA, tx, PU_W - 10)); P[3].setAttribute('d', _puPath(_puYB, tx, PU_W - 10));
      for (let i = 5; i < P.length; i++){ const x = Number(P[i].getAttribute('x1')); P[i].setAttribute('y1', _puYA(x).toFixed(1)); P[i].setAttribute('y2', _puYB(x).toFixed(1)); }
    }
  }
  _pu.raf = requestAnimationFrame(puFrame);
}
function puCritSet(k){
  if (!PU_CRITS.includes(k) || k === _pu.crit) return;
  _pu.crit = k; _pu.prev = null; _pu.shown = PU_PAGE;
  renderPulse(); puKeep();
}
function puHold(on){ _pu.held = on == null ? !_pu.held : !!on; renderPulse(); }
/* THE DOORS: every one an existing one */
function puWire(){
  if (document._puWired) return;
  document._puWired = true;
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'pulse') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (!t.closest('#pu-page') && !t.closest('#ins-panel')) return;
    let el;
    if ((el = t.closest('[data-pu-crit]'))){ puCritSet(el.getAttribute('data-pu-crit')); return; }
    if (t.closest('#pu-hold')){ puHold(); return; }
    if (t.closest('[data-pu-more]')){ _pu.shown += PU_PAGE; renderPulse(); puKeep(); return; }
    if ((el = t.closest('[data-pu-open]'))){ puOpen(el.getAttribute('data-pu-open')); return; }
    if ((el = t.closest('[data-pu-red]'))){ const id = el.getAttribute('data-pu-red'); const go = () => { if (!(typeof pdRedOpen === 'function' && pdRedOpen(id)) && typeof openRedlineWorkbench === 'function') openRedlineWorkbench(id); };
      if (typeof dkLeavePageThen === 'function') dkLeavePageThen(go); else go(); return; }
    if ((el = t.closest('[data-pu-review]'))){ const c = typeof getContract === 'function' ? getContract(el.getAttribute('data-pu-review')) : null;
      if (c && typeof rlReviewDoor === 'function') rlReviewDoor(c, () => puRepaint()); return; }
  });
  /* a window made wider or narrower: the strands are drawn again in their column's new width */
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (typeof state !== 'undefined' && state.view === 'pulse') puStrandFit(); }, 150); });
  document.addEventListener('keydown', e => {
    if (typeof state === 'undefined' || state.view !== 'pulse') return;
    if (e.key !== 'Enter') return;
    const tr = e.target && e.target.closest && e.target.closest('#pu-tbody tr[data-pu-row]'); if (!tr) return;
    e.preventDefault();
    const page = document.getElementById('pu-page');
    puChoose(tr.getAttribute('data-pu-row'), !!(page && page.getAttribute('data-ins') === '1'));
  });
}
/* the Board's door, and any other: the page, on a row where one was named */
function pulseOpen(id){
  if (id){ _puBack = String(id); }
  if (typeof state !== 'undefined' && state.view !== 'pulse' && typeof setView === 'function') setView('pulse'); else renderPulse();
}

Object.assign(window, {
  PU_SEAT, PU_CRITS, PU_PAGE, PU_TICK_MS, PU_JAMBO_RE, renderPulse, pulseOpen, puPlace, puPlacePut, puRead, puRowOf, puSort,
  puNeedsMap, puJamboOf, puJamboWrote, puUnsent, puEventsOf, puSpanOf, puMoneyBands, puSayOf, puRepaint, puCritSet, puHold,
});
