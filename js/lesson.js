/* HaTi — WALK ME THROUGH IT: the lesson drawn in Jambo's panel (owner, 26 Nov 2026: "Build all the possible charts
   and lessons but tie them to access. If you are not allowed to see the money then it should give you a message
   stating as such"; "Yes and use count. Also use the charts in board to get ideas of charts to build as well").

   THE AI PLANS, HaTi SUPPLIES THE NUMBERS. Jambo's walk_through plan (js/walkplan.js, checked on both hosts) names
   for each step a sentence and a READING. lessonFill turns each reading into a drawing with its figures filled from
   HaTi's OWN counting — the Board's (hbBookData, hbPayFigs, ndRead), the chart recipes' readers, the contract's own
   lists (signBlockers, riskItemsOf, stkLivePoints, c.changes RAW) — over only what this reader may see (the server
   sent nothing else). The figures are kept on the message, so the lesson stays as it was shown.
   MONEY ONLY WITH MONEY RIGHTS (canViewValues): for anyone else a money step says so, offers Ask an admin, and
   draws its count instead (the owner's "use count").

   DRAWN: each sentence arrives word by word, then its drawing builds (CSS keyframes only); timing is TIME-BASED,
   so a redraw continues instead of restarting; a host repaint gets the SAME node back (lessonMount), never a
   rebuilt one; after a reload a lesson stands finished and still. Next · Show it all · progress, then Replay ·
   Save (to My notes, with Undo). A lesson only shows: it never changes a record. */

const LS_WORD_MS = 45, LS_AFTER_MS = 150, LS_STILL_MS = 9000, LS_ALL_MS = 1600;
const LS_GAP = { bars: 110, blocks: 160, table: 70, line: 0, ring: 0 };
const LS_TOP = 7, LS_ROWS = 6;
const _lnE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _lnT = (k, v) => (k === 'ls_days' && v && typeof i18tn === 'function') ? i18tn('ls_days', Number(v.n) || 0, v) : (typeof i18t === 'function' ? i18t(k, v) : k);
const LS_STAGE_WORD = { 'Draft': 'home_stage_drafting', 'Under Review': 'home_stage_in_review', 'Signed': 'home_stage_executed' };
const _lnN = s => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
const _lnBook = () => (typeof hbBook === 'function') ? hbBook('all') : ((window.state && Array.isArray(state.contracts)) ? state.contracts.filter(c => c && !c.archived) : []);
const _lnLive = () => _lnBook().filter(c => c.status !== 'Declined');
const lsMoneyOk = () => (typeof canViewValues !== 'function') || !!canViewValues();
const lsMayAct = () => (typeof mayActOn !== 'function') || !!mayActOn(null);
const _lnDays = iso => { if (!iso) return null; try { return (typeof daysUntil === 'function') ? daysUntil(String(iso).slice(0, 10)) : null; } catch (_){ return null; } };
const _lnMonthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
function _lnMonths(n, back){
  const out = [], now = new Date();
  for (let i = 0; i < n; i++) out.push(_lnMonthKey(new Date(now.getFullYear(), now.getMonth() + (back ? i - n + 1 : i), 1)));
  return out;
}
const _lnExpiry = c => (typeof effectiveExpiry === 'function' ? effectiveExpiry(c) : (c && c.expiry)) || null;
const _lnValue = cs => (typeof hbValueOf === 'function') ? hbValueOf(cs).v : cs.reduce((s, c) => s + (Number(c.value) || 0), 0);
const _lnDuty = o => String((o && (o.desc || o.title || o.text)) || '').trim();
const _lnWhose = o => { const w = (typeof obWhoseOf === 'function') ? obWhoseOf(o) : (o && o.party); return w === 'us' || w === 'them' || w === 'both' ? w : 'unsure'; };
const _lnWhoseKey = w => ({ us: 'ls_ours', them: 'ls_theirs', both: 'ls_both' }[w] || 'ls_unsure');
const _lnRef = c => (typeof contractRef === 'function') ? contractRef(c) : (c && c.id);
const _lnName = c => String((c && (c.name || c.id)) || '');
const _lnAgreements = cs => (typeof agreementsIn === 'function') ? agreementsIn(cs) : cs;

/* ---------------- THE READINGS: one per WALK_SHOWS key, each from HaTi's own counting ----------------
   A board: { type, items|rows|parts|pts, money?, head?, note? }. An item's `k` is what a highlight matches, `l` its
   words (or an i18n key in `lk`, or a stage key in `st`, or a month in `m`, read when drawn). Money is a raw number,
   formatted when drawn. null = nothing to draw (said in words). */
function _lnBars(items, o){ return items.length ? Object.assign({ type: 'bars', items }, o || {}) : null; }
const LS_READ = {
  stages(money){
    const d = (typeof hbBookData === 'function') ? hbBookData('all', { whole: true }) : null;
    const S = d ? d.stages : [];
    if (!S.some(s => s.n)) return null;
    return _lnBars(S.map(s => ({ k: s.k, st: s.k, lk: s.word || LS_STAGE_WORD[s.k] || '', n: money ? (s.v || 0) : s.n, tone: s.k })), { money });
  },
  stages_value(){ return LS_READ.stages(true); },
  book_figures(){
    const d = (typeof hbBookData === 'function') ? hbBookData('all', { whole: true }) : null; if (!d) return null;
    const keys = ['live', 'ending', 'past', 'overdue'].concat(lsMayAct() ? ['us'] : []);
    return { type: 'table', head: ['ls_h_figure', 'ls_h_count'], rows: keys.map(k => ({ k, cells: [{ lk: 'hb_f_' + k }, { v: d.figs[k].n }], hot: (k === 'overdue' || k === 'past') && d.figs[k].n > 0 })) };
  },
  ending_months(money){
    const months = _lnMonths(12), by = Object.fromEntries(months.map(m => [m, []]));
    _lnAgreements(_lnBook()).filter(c => c.status === 'Signed').forEach(c => { const e = _lnExpiry(c); const k = e ? String(e).slice(0, 7) : ''; if (k in by) by[k].push(c); });
    if (!months.some(m => by[m].length)) return null;
    return _lnBars(months.map(m => ({ k: m, m, n: money ? _lnValue(by[m]) : by[m].length })), { money, cols: true });
  },
  ending_value(){ return LS_READ.ending_months(true); },
  renewals(){
    if (typeof renewalDecisionDate !== 'function') return null;
    const rows = _lnLive().filter(c => !(typeof renewalDecided === 'function' && renewalDecided(c)))
      .map(c => ({ c, d: renewalDecisionDate(c) })).filter(x => x.d && (_lnDays(x.d) ?? -1) >= 0)
      .sort((a, b) => String(a.d).localeCompare(String(b.d))).slice(0, LS_ROWS);
    if (!rows.length) return null;
    return { type: 'table', head: ['ls_h_agreement', 'ls_h_renews', 'ls_h_decide'], rows: rows.map((x, i) => ({ k: x.c.id, names: [x.c.id, _lnRef(x.c), _lnName(x.c)],
      cells: [{ t: _lnName(x.c) }, { lk: (typeof contractRenewsItself === 'function' && contractRenewsItself(x.c)) ? 'ls_by_itself' : 'ls_asks_first' }, { day: String(x.d).slice(0, 10) }], hot: i === 0 })) };
  },
  waiting_us(){
    if (!lsMayAct()) return { type: 'say', lk: 'ls_viewer' };
    const L = (typeof hbWaitingOnUs === 'function') ? hbWaitingOnUs(_lnBook()) : [];
    if (!L.length) return null;
    const since = c => { const t = Date.parse(c.updated_at || c.updatedAt || ''); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : null; };
    const rows = L.map(c => ({ c, d: since(c) })).sort((a, b) => (b.d || 0) - (a.d || 0)).slice(0, LS_ROWS);
    return { type: 'table', head: ['ls_h_agreement', 'ls_h_party', 'ls_h_waited'], rows: rows.map((x, i) => ({ k: x.c.id, names: [x.c.id, _lnRef(x.c), _lnName(x.c)],
      cells: [{ t: _lnName(x.c) }, { t: x.c.counterparty || '' }, x.d == null ? { t: '—' } : { lk: 'ls_days', vars: { n: x.d } }], hot: i === 0 })) };
  },
  needs_you(){
    if (!lsMayAct()) return { type: 'say', lk: 'ls_viewer' };
    if (typeof ndRead !== 'function' || typeof ndOnBoard !== 'function' || typeof ndParts !== 'function') return null;
    let B = null; try { B = ndOnBoard(ndRead()); } catch (_){ B = null; }
    const take = (B ? B.you.concat(B.jambo) : []).filter(Boolean).slice(0, LS_ROWS);
    if (!take.length) return null;
    return { type: 'table', head: ['ls_h_what', 'ls_h_agreement', 'ls_h_waited'], rows: take.map(r => { const P = ndParts(r) || {};
      return { k: String(r.key || P.title || ''), names: [P.title, P.name, P.deal, P.ref].filter(Boolean), cells: [{ t: P.title || '' }, { t: P.name || P.deal || '' }, { t: P.when || '' }], hot: !!P.late }; }) };
  },
  duties_split(){
    if (typeof openObligations !== 'function') return null;
    const m = _lnMonthKey(new Date()), live = new Set(_lnBook().map(c => c.id));
    const L = openObligations().filter(o => live.has(o.cid) && o.due && String(o.due).slice(0, 7) === m);
    const us = L.filter(o => _lnWhose(o) === 'us').length, them = L.filter(o => _lnWhose(o) === 'them').length;
    const other = L.length - us - them;
    if (!L.length) return null;
    const parts = [{ k: 'us', lk: 'ls_we_owe', n: us, tone: 'accent' }, { k: 'them', lk: 'ls_they_owe', n: them, tone: 'Under Review' }];
    if (other) parts.push({ k: 'other', lk: 'ls_unsure', n: other, tone: 'Draft' });
    return { type: 'ring', parts: parts.filter(p => p.n), mid: String(L.length) };
  },
  duties_months(){
    if (typeof openObligations !== 'function') return null;
    const months = _lnMonths(6), by = Object.fromEntries(months.map(m => [m, 0])), live = new Set(_lnBook().map(c => c.id));
    let late = 0;
    openObligations().filter(o => live.has(o.cid)).forEach(o => { if (o.days != null && o.days < 0){ late++; return; } const k = o.due ? String(o.due).slice(0, 7) : ''; if (k in by) by[k]++; });
    if (!late && !months.some(m => by[m])) return null;
    return _lnBars([{ k: 'late', lk: 'ls_late', n: late, tone: 'Declined' }].concat(months.map(m => ({ k: m, m, n: by[m] }))), { cols: true });
  },
  duties_late(){
    const L = (typeof hbOverdue === 'function') ? hbOverdue(_lnBook()) : [];
    if (!L.length) return null;
    const rows = L.slice().sort((a, b) => a.days - b.days).slice(0, LS_ROWS);
    return { type: 'table', head: ['ls_h_duty', 'ls_h_whose', 'ls_h_late'], rows: rows.map((o, i) => ({ k: String(o.id || o.cid), names: [o.cid, o.cname, _lnDuty(o)],
      cells: [{ t: _lnDuty(o), sub: o.cname || '' }, { lk: _lnWhoseKey(_lnWhose(o)) }, { lk: 'ls_days', vars: { n: Math.abs(o.days) } }], hot: i === 0 })) };
  },
  risk(){
    if (typeof contractRisk !== 'function') return null;
    const n = { low: 0, medium: 0, high: 0 };
    _lnLive().forEach(c => { const r = Number(contractRisk(c)) || 0; n[r >= 70 ? 'high' : r >= 40 ? 'medium' : 'low']++; });
    const tot = n.low + n.medium + n.high; if (!tot) return null;
    return { type: 'ring', mid: String(tot), parts: [{ k: 'low', lk: 'ls_low', n: n.low, tone: 'Signed' }, { k: 'medium', lk: 'ls_medium', n: n.medium, tone: 'Under Review' }, { k: 'high', lk: 'ls_high', n: n.high, tone: 'Declined' }].filter(p => p.n) };
  },
  risky(){
    if (typeof contractRisk !== 'function') return null;
    const rows = _lnLive().map(c => ({ c, r: Number(contractRisk(c)) || 0 })).filter(x => x.r >= 40).sort((a, b) => b.r - a.r).slice(0, LS_ROWS);
    if (!rows.length) return null;
    return { type: 'table', head: ['ls_h_agreement', 'ls_h_party', 'ls_h_risk'], rows: rows.map(x => ({ k: x.c.id, names: [x.c.id, _lnRef(x.c), _lnName(x.c)],
      cells: [{ t: _lnName(x.c) }, { t: x.c.counterparty || '' }, { lk: x.r >= 70 ? 'ls_high' : 'ls_medium' }], hot: x.r >= 70 })) };
  },
  signed_months(){
    const months = _lnMonths(12, true), by = Object.fromEntries(months.map(m => [m, 0]));
    _lnBook().filter(c => c.status === 'Signed').forEach(c => { const s = (typeof contractSignedAt === 'function') ? contractSignedAt(c) : c.signedAt; const k = s ? String(s).slice(0, 7) : ''; if (k in by) by[k]++; });
    if (!months.some(m => by[m])) return null;
    return { type: 'line', pts: months.map(m => ({ k: m, m, n: by[m] })) };
  },
  days_to_sign(){
    const raised = c => (typeof repRaisedAt === 'function') ? repRaisedAt(c) : null, signed = c => (typeof repSignedAt === 'function') ? repSignedAt(c) : null;
    const months = _lnMonths(12, true), by = Object.fromEntries(months.map(m => [m, []]));
    _lnBook().forEach(c => { const a = raised(c), b = signed(c); if (!a || !b || b < a) return; const k = _lnMonthKey(new Date(b)); if (k in by) by[k].push((b - a) / 86400000); });
    if (!months.some(m => by[m].length)) return null;
    return { type: 'line', unit: 'days', pts: months.map(m => ({ k: m, m, n: by[m].length ? Math.round(by[m].reduce((x, y) => x + y, 0) / by[m].length) : null })) };
  },
  parties(money){
    const by = new Map();
    _lnLive().forEach(c => { const k = String(c.counterparty || '').trim(); if (!k) return; if (!by.has(k)) by.set(k, []); by.get(k).push(c); });
    const all = [...by.entries()].map(([k, cs]) => ({ k, t: k, n: money ? _lnValue(cs) : cs.length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
    if (!all.length) return null;
    const top = all.slice(0, LS_TOP), rest = all.slice(LS_TOP);
    if (rest.length) top.push({ k: 'others', lk: 'ls_others', vars: { n: rest.length }, n: rest.reduce((s, x) => s + x.n, 0), quiet: true });
    return _lnBars(top, { money });
  },
  parties_value(){ return LS_READ.parties(true); },
  streams(money){
    const F = (window.FOLDERS && typeof FOLDERS === 'object') ? FOLDERS : {};
    const cs = _lnLive();
    const items = Object.keys(F).map(id => { const L = cs.filter(c => c.folder === id); return { k: id, t: (F[id] && F[id].name) || id, names: [id, F[id] && F[id].name], n: money ? _lnValue(L) : L.length }; }).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
    return _lnBars(items, { money });
  },
  streams_value(){ return LS_READ.streams(true); },
  approvals(){
    if (!lsMayAct()) return { type: 'say', lk: 'ls_viewer' };
    if (typeof apWorkRows !== 'function') return null;
    let W = null; try { W = apWorkRows(); } catch (_){ W = null; }
    const rows = W ? W.yours.filter(r => r && r.c && !r.done).slice(0, LS_ROWS) : [];
    if (!rows.length) return null;
    return { type: 'table', head: ['ls_h_agreement', 'ls_h_kind', 'ls_h_waited'], rows: rows.map((r, i) => ({ k: r.c.id, names: [r.c.id, _lnRef(r.c), _lnName(r.c)],
      cells: [{ t: _lnName(r.c) }, { lk: r.type === 'signature' ? 'ls_signature' : 'ls_approval' }, { lk: 'ls_days', vars: { n: Number(r.idle) || 0 } }], hot: i === 0 })) };
  },
  pay_days(){
    const P = (typeof hbPayFigs === 'function') ? hbPayFigs() : null; if (!P) return null;
    const items = [{ k: 'wewait', lk: 'ls_cust_pay', f: P.wewait }, { k: 'wepay', lk: 'ls_we_pay', f: P.wepay }].filter(x => x.f && !x.f.none).map(x => ({ k: x.k, lk: x.lk, n: x.f.n }));
    return _lnBars(items, { unit: 'days' });
  },
  /* ---- one contract ---- */
  playbook(c){
    const V = c && c.playbook && Array.isArray(c.playbook.verdicts) ? c.playbook.verdicts : null;
    if (!V || !V.length) return { type: 'say', lk: 'ls_no_playbook' };
    const n = { met: 0, dev: 0, missing: 0 };
    V.forEach(v => { if (v.status === 'aligned') n.met++; else if (v.status === 'deviation') n.dev++; else if (v.status === 'missing') n.missing++; });
    const tot = n.met + n.dev + n.missing; if (!tot) return { type: 'say', lk: 'ls_no_playbook' };
    return { type: 'ring', mid: `${n.met}/${tot}`, parts: [{ k: 'met', lk: 'ls_met', n: n.met, tone: 'Signed' }, { k: 'dev', lk: 'ls_not_met', n: n.dev, tone: 'Under Review' }, { k: 'missing', lk: 'ls_missing', n: n.missing, tone: 'Declined' }].filter(p => p.n) };
  },
  findings(c){
    let L = null; try { L = (typeof stkLivePoints === 'function') ? stkLivePoints(c) : null; } catch (_){ L = null; }
    if (!L) return { type: 'say', lk: 'ls_not_read' };
    const n = (typeof stkCounts === 'function') ? stkCounts(L) : { need: 0, look: 0, note: 0 };
    if (!n.need && !n.look && !n.note) return { type: 'say', lk: 'ls_nothing_found' };
    return _lnBars([{ k: 'need', lk: 'ls_need', n: n.need, tone: 'Declined' }, { k: 'look', lk: 'ls_look', n: n.look, tone: 'Under Review' }, { k: 'note', lk: 'ls_note', n: n.note, tone: 'Draft' }]);
  },
  risks_here(c){
    const L = (typeof riskItemsOf === 'function') ? riskItemsOf(c).filter(it => !(typeof riskOpenOf === 'function') || riskOpenOf(c, it) !== false) : [];
    if (!L.length) return null;
    const sev = s => s === 'high' ? 'ls_high' : s === 'low' ? 'ls_low' : 'ls_medium';
    return { type: 'table', head: ['ls_h_what', 'ls_h_sev'], rows: L.slice(0, LS_ROWS).map(it => ({ k: String(it.key || it.title), names: [it.title], cells: [{ t: it.title || it.kind || '' }, { lk: sev(it.sev) }], hot: it.sev === 'high' })) };
  },
  before_sign(c){
    const L = (typeof signBlockers === 'function') ? signBlockers(c) : [];
    if (!L.length) return { type: 'say', lk: 'ls_nothing_stands' };
    return { type: 'table', head: ['ls_h_before'], rows: L.slice(0, LS_ROWS).map(b => ({ k: String(b.key), names: [b.label, b.short], cells: [{ t: b.label || b.short || '' }] })) };
  },
  changes(c){
    const L = (Array.isArray(c && c.changes) ? c.changes : []).filter(x => x && !x.withdrawn && x.status !== 'superseded' && !x.formattingOnly);
    if (!L.length) return { type: 'say', lk: 'ls_no_changes' };
    const n = s => L.filter(x => x.status === s).length;
    return { type: 'blocks', cols: [{ k: 'all', lk: 'ls_proposed', n: L.length, tone: 'Draft', kind: 'total' }, { k: 'accepted', lk: 'ls_accepted', n: n('accepted'), tone: 'Signed', kind: 'down' },
      { k: 'rejected', lk: 'ls_rejected', n: n('rejected'), tone: 'Draft', kind: 'down' }, { k: 'countered', lk: 'ls_countered', n: n('countered'), tone: 'Under Review', kind: 'down' },
      { k: 'pending', lk: 'ls_open', n: n('pending'), tone: 'Declined', kind: 'left' }] };
  },
  open_changes(c){
    const L = (Array.isArray(c && c.changes) ? c.changes : []).filter(x => x && x.status === 'pending' && !x.withdrawn);
    if (!L.length) return { type: 'say', lk: 'ls_no_open' };
    const age = x => { const t = Date.parse(x.createdAt || x.at || ''); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : null; };
    const rows = L.map(x => ({ x, d: age(x) })).sort((a, b) => (b.d || 0) - (a.d || 0)).slice(0, LS_ROWS);
    return { type: 'table', head: ['ls_h_clause', 'ls_h_side', 'ls_h_open'], rows: rows.map((r, i) => ({ k: String(r.x.id || i), names: [r.x.clauseLabel],
      cells: [{ t: r.x.clauseLabel || '—' }, { lk: r.x.authorSide === 'counterparty' ? 'ls_them' : 'ls_us' }, r.d == null ? { t: '—' } : { lk: 'ls_days', vars: { n: r.d } }], hot: i === 0 })) };
  },
  contract_duties(c){
    const L = (Array.isArray(c && c.obligations) ? c.obligations : []).filter(o => o && (typeof obState !== 'function' || obState(o) !== 'done'));
    if (!L.length) return { type: 'say', lk: 'ls_no_duties' };
    const due = o => (typeof obligationDue === 'function') ? obligationDue(o) : o.due;
    const rows = L.slice().sort((a, b) => String(due(a) || '9').localeCompare(String(due(b) || '9'))).slice(0, LS_ROWS);
    return { type: 'table', head: ['ls_h_duty', 'ls_h_whose', 'ls_h_due'], rows: rows.map(o => { const d = due(o); return { k: String(o.id || _lnDuty(o)), names: [_lnDuty(o)],
      cells: [{ t: _lnDuty(o) }, { lk: _lnWhoseKey(_lnWhose(o)) }, d ? { day: String(d).slice(0, 10) } : { t: '—' }], hot: d != null && (_lnDays(d) ?? 0) < 0 }; }) };
  },
};

/* ONE READING, ACCESS FIRST: a money reading for someone without money rights is its count, with the message */
function lessonBoard(what, c){
  const S = (typeof walkShowOf === 'function') ? walkShowOf(what) : null;
  if (!S || typeof LS_READ[what] !== 'function') return { type: 'say', lk: 'ls_empty' };
  if (S.of === 'contract' && !c) return { type: 'say', lk: 'ls_none_contract' };
  if (S.money && !lsMoneyOk()){
    let twin = null; try { twin = LS_READ[S.twin](c); } catch (_){ twin = null; }
    return Object.assign(twin || { type: 'say', lk: 'ls_empty' }, { nomoney: true, what: S.twin });
  }
  let b = null; try { b = LS_READ[what](c); } catch (_){ b = null; }
  return Object.assign(b || { type: 'say', lk: 'ls_empty' }, { what });
}
/* THE PLAN (js/walkplan.js) MADE A LESSON: every drawing filled now, kept with the message */
let _lnSeq = 0;
function lessonFill(plan){
  if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) return null;
  const c = plan.contractId && typeof getContract === 'function' ? getContract(plan.contractId) : null;
  const steps = plan.steps.map(s => s.show ? { say: String(s.say || ''), board: lessonBoard(s.show.what, c) } : { say: String(s.say || ''), op: s.op });
  return { id: 'ls' + Date.now().toString(36) + (++_lnSeq), title: String(plan.title || ''), cid: c ? c.id : '', cname: c ? _lnName(c) : '', made: new Date().toISOString(), steps };
}
/* THE ANSWER CARRIED A LESSON (both hosts' answer readers ask this first): the message the conversation keeps */
function lessonFromAnswer(res){
  if (!res || !res.lesson) return null;
  const L = lessonFill(res.lesson); if (!L) return null;
  _lnRun.set(L.id, { shown: 1, at: [lsNow()] });
  const sum = (typeof walkSummary === 'function') ? walkSummary(res.lesson) : String(res.answer || '');
  return { host: 'ai', lesson: L, text: _lnE(sum) };
}

/* ---------------- THE RUN: which steps stand, and WHEN each was revealed (memory only) ---------------- */
const _lnRun = new Map();
const _lnKept = new Map();
const lsNow = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
const lsPhone = () => { try { return typeof matchMedia === 'function' && matchMedia(window.M_QUERY || 'screen and (max-width: 767px)').matches; } catch (_){ return false; } };
function lessonRunOf(L){
  let R = _lnRun.get(L.id);
  /* not run in this sitting (a reload, the phone): the lesson stands finished and still */
  if (!R || lsPhone()){ R = { shown: L.steps.length, at: [], still: true }; if (!_lnRun.has(L.id)) _lnRun.set(L.id, R); }
  return R;
}

/* ---------------- DRAWING ---------------- */
const _lnTone = t => t === 'accent' ? 'var(--accent-ink)' : (typeof hmStageTone === 'function' && t) ? (hmStageTone(t) || 'var(--st-gray-dot)') : 'var(--st-gray-dot)';
const _lnMonthWord = (m, long) => { const [y, mo] = String(m).split('-').map(Number); try { return new Date(y, mo - 1, 1).toLocaleDateString(typeof langLocale === 'function' ? langLocale() : undefined, long ? { month: 'short', year: 'numeric' } : { month: 'short' }); } catch (_){ return m; } };
const _lnDayWord = d => { try { return new Date(d + 'T00:00:00').toLocaleDateString(typeof langLocale === 'function' ? langLocale() : undefined, { day: 'numeric', month: 'short' }); } catch (_){ return d; } };
function _lnLabel(x){
  if (x.st && x.lk){ const w = String(_lnT(x.lk)); return w.charAt(0) + w.slice(1).toLowerCase(); }   /* as the Board's key draws it: "In review" */
  if (x.st) return (typeof statusLabel === 'function') ? statusLabel(x.st) : x.st;
  if (x.m) return _lnMonthWord(x.m);
  if (x.lk) return _lnT(x.lk, x.vars);
  return String(x.t == null ? '' : x.t);
}
function _lnFig(n, b){
  if (n == null) return '—';
  if (b && b.money) return (typeof fmtMoneyShortIn === 'function') ? fmtMoneyShortIn(n) : String(Math.round(n));
  if (b && b.unit === 'days') return _lnT('ls_days', { n });
  return String(n);
}
/* EVERY DRAWING IS A TABLE (owner, 27 Nov 2026: "The tables are not structured or in tables. This is very
   unprofessional"): a card with a head row naming its columns, a rule between rows, figures in one right column.
   The heads follow the reading (`b.what`; a money step's count twin names its own). */
const LS_HEADS = { stages: ['ls_h_stage', 'ls_h_contracts'], stages_value: ['ls_h_stage', 'ls_h_value'], ending_months: ['ls_h_month', 'ls_h_contracts'],
  ending_value: ['ls_h_month', 'ls_h_value'], duties_split: ['ls_h_whose', 'ls_h_duties'], duties_months: ['ls_h_due', 'ls_h_duties'], risk: ['ls_h_risk', 'ls_h_contracts'],
  signed_months: ['ls_h_month', 'ls_h_contracts'], days_to_sign: ['ls_h_month', 'ls_h_avg_days'], parties: ['ls_h_party', 'ls_h_contracts'], parties_value: ['ls_h_party', 'ls_h_value'],
  streams: ['ls_h_stream', 'ls_h_contracts'], streams_value: ['ls_h_stream', 'ls_h_value'], pay_days: ['ls_h_who_pays', 'ls_h_days'], playbook: ['ls_h_positions', 'ls_h_count'],
  findings: ['ls_h_finding', 'ls_h_count'], changes: ['ls_h_changes', 'ls_h_count'] };
function lessonHeadOf(b){
  const H = LS_HEADS[b && b.what];
  return H || ['ls_h_item', b && b.money ? 'ls_h_value' : b && b.unit === 'days' ? 'ls_h_days' : 'ls_h_count'];
}
/* the figure column is as wide as its longest word, so the head and every row line up */
const _lnVw = (strs) => Math.max(4, ...strs.map(x => String(x).length)) + 1 + 'ch';
/* `d(ms)`: an element's planned start → its style, time-based (negative = already part-way); data-ld keeps the plan */
function _lnD(ms, el){ return `data-ld="${Math.round(ms)}" style="animation-delay:${Math.round(ms - el)}ms"`; }
function lessonBoardHtml(b, start, el){
  const D = ms => _lnD(start + ms, el);
  const gap = LS_GAP[b.type] || 0;
  if (b.type === 'say') return `<p class="lsn-says">${_lnE(_lnT(b.lk))}</p>`;
  if (b.type === 'bars'){
    const max = Math.max(1, ...b.items.map(x => Number(x.n) || 0));
    const H = lessonHeadOf(b), vw = _lnVw([_lnT(H[1])].concat(b.items.map(x => _lnFig(x.n, b))));
    return `<div class="lsn-bd lsn-card lsn-bars${b.cols ? ' is-months' : ''}" data-lsn-type="bars" style="--lsn-vw:${vw}"><div class="lsn-thd" role="presentation"><span>${_lnE(_lnT(H[0]))}</span><span></span><span class="is-r">${_lnE(_lnT(H[1]))}</span></div>` + b.items.map((x, i) => {
      const w = x.n ? Math.max(2, (x.n / max) * 100) : 0;
      return `<div class="lsn-br${x.quiet ? ' is-quiet' : ''}" data-lsn-k="${_lnE(x.k)}"><span class="lsn-n" title="${_lnE(_lnLabel(x))}">${_lnE(_lnLabel(x))}</span>`
        + `<span class="lsn-t"><span class="lsn-f" style="width:${w.toFixed(1)}%;--ls-tone:${_lnTone(x.tone || (b.money ? 'accent' : 'accent'))}"><i ${D(i * gap)}></i></span></span>`
        + `<span class="lsn-v" ${D(i * gap + 250)}>${_lnE(_lnFig(x.n, b))}</span></div>`; }).join('') + `</div>`;
  }
  if (b.type === 'table'){
    const head = b.head.map((h, j) => `<th${j && j === b.head.length - 1 ? ' class="is-r"' : ''}>${_lnE(_lnT(h))}</th>`).join('');
    const cell = (x, j, n) => { let v = x.day ? _lnDayWord(x.day) : x.lk ? _lnT(x.lk, x.vars) : x.v != null ? String(x.v) : String(x.t == null ? '' : x.t);
      return `<td${j && j === n - 1 ? ' class="is-r"' : ''}>${_lnE(v)}${x.sub ? `<span class="lsn-sub">${_lnE(x.sub)}</span>` : ''}</td>`; };
    return `<div class="lsn-bd lsn-card lsn-tbl" data-lsn-type="table"><table><thead><tr>${head}</tr></thead><tbody>`
      + b.rows.map((r, i) => `<tr class="${r.hot ? 'is-hot' : ''}" data-lsn-k="${_lnE(r.k)}" data-lsn-names="${_lnE((r.names || []).filter(Boolean).join('\u0001'))}" ${D(i * gap)}>${r.cells.map((x, j) => cell(x, j, r.cells.length)).join('')}</tr>`).join('')
      + `</tbody></table></div>`;
  }
  if (b.type === 'ring'){
    const tot = b.parts.reduce((s, p) => s + p.n, 0) || 1, C = 2 * Math.PI * 46; let off = 0;
    const arcs = b.parts.map(p => { const len = p.n / tot * C; const s = `<circle class="lsn-arc" data-lsn-k="${_lnE(p.k)}" r="46" cx="56" cy="56" fill="none" stroke="${_lnTone(p.tone)}" stroke-width="14" stroke-dasharray="${Math.max(0, len - 1.5).toFixed(2)} ${(C - len + 1.5).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 56 56)"/>`; off += len; return s; }).join('');
    const RH = lessonHeadOf(b), rvw = _lnVw([_lnT(RH[1])].concat(b.parts.map(p => _lnFig(p.n, b))));
    return `<div class="lsn-bd lsn-card lsn-ring" data-lsn-type="ring" style="--lsn-vw:${rvw}"><div class="lsn-ring-pic"><svg viewBox="0 0 112 112" aria-hidden="true">${arcs}<circle class="lsn-cover" r="46" cx="56" cy="56" fill="none" stroke-width="16" stroke-dasharray="${C.toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 56 56)" ${D(0)}/><text x="56" y="62" text-anchor="middle" class="lsn-mid">${_lnE(b.mid || '')}</text></svg></div>`
      + `<div class="lsn-lg"><div class="lsn-thd is-lg" role="presentation"><span>${_lnE(_lnT(RH[0]))}</span><span class="is-r">${_lnE(_lnT(RH[1]))}</span></div>${b.parts.map((p, i) => `<div class="lsn-li" data-lsn-k="${_lnE(p.k)}" ${D(600 + i * 90)}><i style="background:${_lnTone(p.tone)}"></i><span>${_lnE(_lnLabel(p))}</span><b>${_lnE(_lnFig(p.n, b))}</b></div>`).join('')}</div></div>`;
  }
  if (b.type === 'line'){
    const P = b.pts, vals = P.map(p => p.n).filter(v => v != null), max = Math.max(1, ...vals), n = P.length;
    const x = i => n > 1 ? (i / (n - 1)) * 100 : 50, y = v => 92 - (v / max) * 80;
    const pts = P.map((p, i) => p.n == null ? null : `${x(i).toFixed(2)},${y(p.n).toFixed(2)}`).filter(Boolean).join(' ');
    const last = P.map((p, i) => [p, i]).filter(([p]) => p.n != null).pop();
    const firstI = P.findIndex(p => p.n != null);
    const lab = (i, every) => (i % every === 0 || i === n - 1) ? `<span style="left:${x(i).toFixed(2)}%">${_lnE(_lnMonthWord(P[i].m))}</span>` : '';
    const LH = lessonHeadOf(b);
    return `<div class="lsn-bd lsn-card lsn-line" data-lsn-type="line"><div class="lsn-thd is-two" role="presentation"><span>${_lnE(_lnT(LH[0]))}</span><span class="is-r">${_lnE(_lnT(LH[1]))}</span></div><div class="lsn-plot"><div class="lsn-wipe" ${D(0)}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/></svg>`
      + P.map((p, i) => p.n == null ? '' : `<i class="lsn-dot${last && last[1] === i ? ' is-last' : ''}" data-lsn-k="${_lnE(p.k)}" style="left:${x(i).toFixed(2)}%;top:${y(p.n).toFixed(2)}%"></i>`).join('')
      + (last ? `<b class="lsn-pv is-last" style="left:${x(last[1]).toFixed(2)}%;top:${y(last[0].n).toFixed(2)}%">${_lnE(_lnFig(last[0].n, b))}</b>` : '')
      + (firstI >= 0 && (!last || firstI !== last[1]) && P[firstI].n ? `<b class="lsn-pv is-first" style="left:${x(firstI).toFixed(2)}%;top:${y(P[firstI].n).toFixed(2)}%">${_lnE(_lnFig(P[firstI].n, b))}</b>` : '')
      + `</div></div><div class="lsn-xl">${P.map((_, i) => lab(i, 3)).join('')}</div></div>`;
  }
  if (b.type === 'blocks'){
    const top = Math.max(1, b.cols[0].n); let run = top;
    const BH = lessonHeadOf(b);
    return `<div class="lsn-bd lsn-card lsn-blocks-card" data-lsn-type="blocks"><div class="lsn-thd is-two" role="presentation"><span>${_lnE(_lnT(BH[0]))}</span><span class="is-r">${_lnE(_lnT(BH[1]))}</span></div><div class="lsn-blocks" data-lsn-start="${Math.round(start - el)}">` + b.cols.map((c, i) => {
      let lo, hi; if (c.kind === 'total'){ lo = 0; hi = top; } else if (c.kind === 'left'){ lo = 0; hi = c.n; } else { hi = run; lo = Math.max(0, run - c.n); run = lo; }
      return `<div class="lsn-bk" data-lsn-k="${_lnE(c.k)}" data-lsn-i="${i + 1}"><div class="lsn-bk-in"><span class="lsn-blk" style="bottom:${(lo / top * 100).toFixed(1)}%;height:${((hi - lo) / top * 100).toFixed(1)}%;background:${_lnTone(c.tone)}"></span>`
        + `<span class="lsn-bk-n" style="bottom:calc(${(hi / top * 100).toFixed(1)}% + 2px)">${c.n}</span></div><span class="lsn-bk-l">${_lnE(_lnLabel(c))}</span></div>`; }).join('') + `</div></div>`;
  }
  return '';
}
/* THE OPS FOLDED IN: each board collects the later steps that change it (lit names, blocks shown) */
function lessonOpsOf(L, i, shown){
  const out = []; for (let j = i + 1; j < shown && L.steps[j] && !L.steps[j].board; j++) out.push(L.steps[j].op);
  return out;
}
function _lnNameHit(el, names){
  const k = _lnN(el.getAttribute('data-lsn-k'));
  const words = [k, _lnN(el.textContent)].concat(String(el.getAttribute('data-lsn-names') || '').split('\u0001').map(_lnN)).filter(Boolean);
  return names.some(n => { const w = _lnN(n), s = LS_SYN[w] || w; return words.includes(s) || words.includes(w) || (w.length > 3 && words.some(x => x.includes(w))); });
}
const LS_SYN = { draft: 'draft', drafting: 'draft', 'under review': 'under review', 'in review': 'under review', review: 'under review', signed: 'signed', executed: 'signed', declined: 'declined', closed: 'declined',
  ours: 'us', 'we owe': 'us', us: 'us', theirs: 'them', 'they owe': 'them', them: 'them', met: 'met', aligned: 'met', 'not met': 'dev', deviation: 'dev', missing: 'missing',
  'needs you': 'need', 'worth a look': 'look', noted: 'note', 'live contracts': 'live', 'ending in 90 days': 'ending', 'past end date': 'past', 'duties overdue': 'overdue', 'waiting on you': 'us', 'your move': 'us' };
/* lit names and revealed blocks are CLASSES on the standing board, so the change is a transition, never a rebuild */
function lessonOpsApply(bd, ops, allOps){
  if (!bd) return;
  const names = ops.filter(o => o && o.what === 'highlight').flatMap(o => o.names || []);
  const upto = ops.filter(o => o && o.what === 'reveal').reduce((m, o) => Math.max(m, o.upto || 0), 0);
  const items = [...bd.querySelectorAll('[data-lsn-k]')];
  bd.classList.toggle('has-lit', !!names.length && items.some(el => _lnNameHit(el, names)));
  items.forEach(el => el.classList.toggle('is-lit', !!names.length && _lnNameHit(el, names)));
  const blocks = bd.classList.contains('lsn-blocks') ? bd : bd.querySelector('.lsn-blocks');
  if (blocks){
    /* the blocks stand one at a time: block 1, then each reveal; a drawing no later step reveals stands whole */
    const total = blocks.querySelectorAll('.lsn-bk').length;
    const n = (allOps || []).some(o => o && o.what === 'reveal') ? Math.max(1, upto) : total;
    const start = Number(blocks.getAttribute('data-lsn-start')) || 0;
    const first = !blocks.querySelector('.lsn-bk.is-shown');
    let j = 0;
    blocks.querySelectorAll('.lsn-bk').forEach(el => { const i = Number(el.getAttribute('data-lsn-i'));
      if (i <= n && !el.classList.contains('is-shown')){ el.style.setProperty('--ls-bk-delay', ((first ? start : 0) + (j++) * LS_GAP.blocks) + 'ms'); el.classList.add('is-shown'); }
      else if (i > n) el.classList.remove('is-shown'); });
  }
}
/* A SENTENCE'S WORDS: Jambo's **bold** is drawn bold, never as stars; any other markdown mark is left out */
function lessonWords(say){
  /* each word keeps its own pieces, so "**KES 333M**." stays one word: bold figure, plain full stop */
  const out = []; let bold = false;
  String(say || '').replace(/__/g, '**').split(/\s+/).filter(Boolean).forEach(w => {
    const segs = [];
    w.split('**').forEach((p, k) => { if (k) bold = !bold; p = p.replace(/[*_`#]+/g, ''); if (p) segs.push({ t: p, b: bold }); });
    if (segs.length) out.push(segs);
  });
  return out;
}
const _lnWordHtml = w => w.map(x => x.b ? `<b>${_lnE(x.t)}</b>` : _lnE(x.t)).join('');
const _lnWordText = w => w.map(x => x.t).join('');
function lessonStepHtml(L, R, i, now){
  const s = L.steps[i];
  const el = (R.still || !R.at[i]) ? 1e9 : now - R.at[i];
  const still = el > LS_STILL_MS;
  const words = lessonWords(s.say);
  const say = words.map((w, j) => `<span class="lsn-w" ${_lnD(j * LS_WORD_MS, el)}>${_lnWordHtml(w)}</span>`).join(' ');
  let bd = '';
  if (s.board){
    const start = words.length * LS_WORD_MS + LS_AFTER_MS;
    const money = s.board.nomoney ? `<div class="lsn-nomoney" ${_lnD(start - 100, el)}><span>${_lnE(_lnT('ls_nomoney'))}</span>${(typeof isAdmin === 'function' && isAdmin()) ? '' : `<button type="button" class="ui-link" data-lsn-act="askadmin">${_lnE(_lnT('ls_ask_admin'))}</button>`}</div>` : '';
    bd = money + lessonBoardHtml(s.board, start, el);
  }
  return `<div class="lsn-step${still ? ' is-still' : ''}${s.op ? ' is-op' : ''}" data-lsn-step="${i}"><p class="lsn-say">${say}</p>${bd}</div>`;
}
function lessonCtlHtml(L, R){
  const n = L.steps.length, dots = L.steps.map((_, i) => `<i class="${i < R.shown ? 'on' : ''}"></i>`).join('');
  const prog = `<span class="lsn-dots" aria-hidden="true">${dots}</span><span class="lsn-of">${_lnE(_lnT('ls_of', { n: R.shown, m: n }))}</span>`;
  return R.shown < n
    ? `<div class="lsn-ctl"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-lsn-act="next">${_lnE(_lnT('ls_next'))}</button><button type="button" class="ui-link" data-lsn-act="all">${_lnE(_lnT('ls_all'))}</button><span class="lsn-prog">${prog}</span></div>`
    : `<div class="lsn-ctl"><button type="button" class="ui-btn ui-btn-sm" data-lsn-act="replay">${_lnE(_lnT('ls_replay'))}</button><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-lsn-act="save">${_lnE(_lnT('ls_save'))}</button><span class="lsn-prog">${prog}</span></div>`;
}
function lessonInnerHtml(L, R){
  const now = lsNow();
  const steps = []; for (let i = 0; i < Math.min(R.shown, L.steps.length); i++) steps.push(lessonStepHtml(L, R, i, now));
  return `<div class="lsn-head">${_lnE(L.title)}${L.cname ? `<span class="lsn-cn">${_lnE(L.cname)}</span>` : ''}</div><div class="lsn-steps">${steps.join('')}</div>${lessonCtlHtml(L, R)}`;
}
/* THE TURN'S HTML (jamboTurnHtml asks this first, every host): the same id, so the live node is put back (lessonMount) */
function lessonTurnHtml(m){
  const L = m && m.lesson; if (!L || !Array.isArray(L.steps)) return '';
  lessonCssOn();
  const R = lessonRunOf(L);
  if (typeof Promise !== 'undefined') Promise.resolve().then(lessonMountAll);
  return `<div class="lsn jb-lesson" data-lsn-id="${_lnE(L.id)}" role="group" aria-label="${_lnE(_lnT('ls_label'))}">${lessonInnerHtml(L, R)}</div>`;
}

/* ---------------- NO STUTTER: the live node stands; only a changed step is drawn again ---------------- */
const _lnSig = el => el.outerHTML.replace(/ style="animation-delay:-?\d+ms"/g, '').replace(/ data-lsn-start="-?\d+"/g, '').replace(/ style="--ls-bk-delay:[^"]*"/g, '').replace(/ class="([^"]*)"/g, (m, c) => ' class="' + c.replace(/\b(is-lit|has-lit|is-shown|is-still)\b/g, '').trim() + '"');
function lessonLessonOf(id){
  const H = (typeof jamboConvo === 'function') ? jamboConvo() : ((window.ai && ai.history) || []);
  const m = (H || []).find(x => x && x.lesson && x.lesson.id === id) || ((window.intel && intel.history) || []).find(x => x && x.lesson && x.lesson.id === id);
  return m ? m.lesson : null;
}
/* a host painted the conversation: each lesson slot gets the node already living, its delays re-timed */
function lessonMountAll(){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.lsn[data-lsn-id]').forEach(el => {
    const id = el.getAttribute('data-lsn-id'), K = _lnKept.get(id);
    if (K && K !== el && !K.isConnected){ el.replaceWith(K); lessonRetime(K); lessonOpsAll(K); return; }
    if (!K || !K.isConnected) _lnKept.set(id, el);
    lessonOpsAll(el);
  });
}
/* re-attached (the host's innerHTML took it away): every element's delay from its plan and the time passed now */
function lessonRetime(K){
  const L = lessonLessonOf(K.getAttribute('data-lsn-id')); if (!L) return;
  const R = lessonRunOf(L), now = lsNow();
  K.querySelectorAll('.lsn-step').forEach(st => { const i = Number(st.getAttribute('data-lsn-step')); const el = (R.still || !R.at[i]) ? 1e9 : now - R.at[i];
    if (el > LS_STILL_MS) st.classList.add('is-still');
    st.querySelectorAll('[data-ld]').forEach(x => { x.style.animationDelay = (Number(x.getAttribute('data-ld')) - el) + 'ms'; }); });
}
function lessonOpsAll(K){
  const L = lessonLessonOf(K.getAttribute('data-lsn-id')); if (!L) return;
  const R = lessonRunOf(L);
  K.querySelectorAll('.lsn-step').forEach(st => { const i = Number(st.getAttribute('data-lsn-step')); if (!L.steps[i] || !L.steps[i].board) return;
    lessonOpsApply(st.querySelector('.lsn-bd'), lessonOpsOf(L, i, R.shown), lessonOpsOf(L, i, L.steps.length)); });
}
/* the lesson redrawn in place: unchanged steps keep their live nodes (their drawings run on), changed ones go */
function lessonPatch(K, L){
  const R = lessonRunOf(L);
  const t = document.createElement('div'); t.innerHTML = lessonInnerHtml(L, R);
  const wantSteps = [...t.querySelector('.lsn-steps').children], box = K.querySelector('.lsn-steps');
  const have = [...box.children];
  wantSteps.forEach((n, i) => { const o = have[i]; if (o && _lnSig(o) === _lnSig(n)) return; if (o) box.replaceChild(n, o); else box.appendChild(n); });
  for (let i = wantSteps.length; i < have.length; i++) have[i].remove();
  const ctl = K.querySelector('.lsn-ctl'), nctl = t.querySelector('.lsn-ctl');
  if (ctl && nctl && ctl.outerHTML !== nctl.outerHTML) ctl.replaceWith(nctl);
  lessonOpsAll(K);
}

/* ---------------- THE PRESSES (delegated once on document: a turn's node moves between hosts) ---------------- */
function lessonNext(K, L){
  const R = _lnRun.get(L.id) || lessonRunOf(L);
  if (R.still){ R.still = false; R.at = L.steps.map(() => 0); }
  if (R.shown >= L.steps.length) return false;
  R.at[R.shown] = lsNow(); R.shown++; _lnRun.set(L.id, R);
  lessonPatch(K, L);
  const c = K.querySelector('.lsn-ctl');
  if (c) try { c.scrollIntoView({ block: 'nearest', behavior: lsReduced() ? 'auto' : 'smooth' }); } catch (_){}
  return true;
}
const lsReduced = () => { try { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_){ return false; } };
function lessonAll(K, L){
  const R = lessonRunOf(L); clearInterval(R.timer);
  lessonNext(K, L);
  R.timer = setInterval(() => { if (!K.isConnected && !_lnKept.has(L.id)) { clearInterval(R.timer); return; } const k = _lnKept.get(L.id) || K; if (!lessonNext(k, L)) clearInterval(R.timer); }, LS_ALL_MS);
}
function lessonReplay(K, L){
  const R = lessonRunOf(L); clearInterval(R.timer);
  _lnRun.set(L.id, { shown: 1, at: [lsNow()] });
  K.querySelector('.lsn-steps').innerHTML = '';
  lessonPatch(K, L);
}
/* SAVE: the lesson as words in My notes (private to this person), with Undo */
function lessonText(L){
  const line = (b) => { if (!b) return ''; if (b.type === 'say') return _lnT(b.lk);
    if (b.type === 'bars') return b.items.map(x => `${_lnLabel(x)}: ${_lnFig(x.n, b)}`).join(' · ');
    if (b.type === 'ring') return b.parts.map(x => `${_lnLabel(x)}: ${_lnFig(x.n, b)}`).join(' · ');
    if (b.type === 'line') return b.pts.filter(p => p.n != null).map(p => `${_lnMonthWord(p.m, true)}: ${_lnFig(p.n, b)}`).join(' · ');
    if (b.type === 'blocks') return b.cols.map(x => `${_lnLabel(x)}: ${x.n}`).join(' · ');
    if (b.type === 'table') return b.rows.map(r => r.cells.map(x => x.day ? _lnDayWord(x.day) : x.lk ? _lnT(x.lk, x.vars) : x.v != null ? x.v : x.t).join(' — ')).join('\n');
    return ''; };
  return L.steps.map((s, i) => `${i + 1}. ${lessonWords(s.say).map(_lnWordText).join(' ')}${s.board ? (s.board.nomoney ? '\n' + _lnT('ls_nomoney') : '') + '\n' + line(s.board) : ''}`).join('\n\n');
}
async function lessonSave(L){
  if (typeof mineSave !== 'function') return;
  try {
    const it = await mineSave('note', { title: _lnT('ls_saved_title', { t: L.title }).slice(0, 120), body: lessonText(L).slice(0, 4000), contractId: L.cid || '' });
    if (typeof toast === 'function') toast(_lnT('ls_saved'), 'ok', { action: { label: _lnT('act_undo'), onClick: async () => {
      try { if (it && it.id && typeof mineDelete === 'function') await mineDelete(it.id); toast(_lnT('ls_unsaved'), 'ok'); } catch (e){ toast(_lnT('ls_save_failed', { err: (e && e.message) || '' }), 'err'); } } } });
  } catch (e){ if (typeof toast === 'function') toast(_lnT('ls_save_failed', { err: (e && e.message) || '' }), 'err'); }
}
/* A PRESS WORKS THE FIRST TIME: the node a press began on is the node that ends it (the host's repaint puts the same
   node back), so the click is read off the lesson's id, never off a button the repaint replaced */
if (typeof document !== 'undefined' && !document._lnWired){
  document._lnWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-lsn-act]') : null; if (!b) return;
    const K = b.closest('.lsn[data-lsn-id]'); if (!K) return;
    const L = lessonLessonOf(K.getAttribute('data-lsn-id')); if (!L) return;
    e.preventDefault(); e.stopPropagation();
    _lnKept.set(L.id, K);
    const act = b.getAttribute('data-lsn-act');
    if (act === 'next') lessonNext(K, L);
    else if (act === 'all') lessonAll(K, L);
    else if (act === 'replay') lessonReplay(K, L);
    else if (act === 'save') lessonSave(L);
    else if (act === 'askadmin' && typeof stAskFrom === 'function') stAskFrom('directory', _lnT('ls_money_ask'));
  }, true);
}

/* ---------------- THE LOOK: scoped to .lsn, HaTi's tokens only ---------------- */
const LS_CSS = `
.lsn{ margin:2px 0 4px; min-width:0; }
.lsn-head{ font-weight:var(--w-strong); font-size:14px; line-height:1.35; margin:0 0 8px; color:var(--color-text); }
.lsn-cn{ display:block; font-weight:var(--w-body); font-size:12px; color:var(--color-quiet); }
.lsn-step{ margin:0 0 12px; min-width:0; }
.lsn-say{ margin:0 0 8px; font-size:13.5px; line-height:1.5; color:var(--color-text); }
.lsn-w{ opacity:0; animation:lsn-fade .22s ease-out forwards; }
.lsn-says{ margin:0; font-size:12.5px; color:var(--color-quiet); }
.lsn-nomoney{ display:flex; flex-wrap:wrap; gap:4px 10px; align-items:baseline; margin:0 0 8px; padding:8px 10px; border-radius:var(--radius); background:var(--st-amber-bg); color:var(--st-amber-fg); font-size:12.5px; line-height:1.45; opacity:0; animation:lsn-fade .3s forwards; }
.lsn-nomoney .ui-link{ font-size:12.5px; }
.lsn-bd{ min-width:0; }
.lsn-card{ border:1px solid var(--color-divider); border-radius:var(--radius); background:var(--color-surface); overflow:hidden; }
.lsn-thd{ display:grid; grid-template-columns:minmax(0,36%) minmax(0,1fr) var(--lsn-vw,6ch); gap:10px; align-items:center; padding:6px 12px; background:var(--color-surface); border-bottom:1px solid var(--color-divider); font-size:11.5px; color:var(--color-quiet); white-space:nowrap; }
.lsn-thd span{ overflow:hidden; text-overflow:ellipsis; }
.lsn-thd .is-r{ text-align:right; }
.lsn-thd.is-two, .lsn-thd.is-lg{ grid-template-columns:minmax(0,1fr) var(--lsn-vw,auto); }
.lsn-bars{ display:block; }
.lsn-br{ display:grid; grid-template-columns:minmax(0,36%) minmax(0,1fr) var(--lsn-vw,6ch); align-items:center; gap:10px; min-height:30px; padding:0 12px; font-size:12.5px; }
.lsn-br + .lsn-br{ border-top:1px solid var(--color-divider); }
.lsn-n{ color:var(--color-quiet); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:color var(--dur-2) var(--ease); }
.lsn-t{ position:relative; height:12px; min-width:0; }
.lsn-f{ position:absolute; left:0; top:0; bottom:0; display:block; }
.lsn-f i{ display:block; height:100%; border-radius:2px; background:var(--ls-tone); transform-origin:left center; transform:scaleX(0); animation:lsn-growx .5s cubic-bezier(.2,.7,.2,1) forwards; transition:background-color var(--dur-2) var(--ease); }
.lsn-br.is-quiet .lsn-f i{ background:var(--st-gray-dot); }
.lsn-v{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; color:var(--color-text); opacity:0; animation:lsn-fade .3s forwards; }
.lsn-bd.has-lit .lsn-br:not(.is-lit) .lsn-f i{ background:var(--color-neutral-300); }
.lsn-bd.has-lit .lsn-br.is-lit .lsn-n, .lsn-bd.has-lit .lsn-br.is-lit .lsn-v{ color:var(--color-text); font-weight:var(--w-strong); }
.lsn-tbl{ overflow-x:auto; }
.lsn-tbl th:first-child, .lsn-tbl td:first-child{ padding-left:12px; }
.lsn-tbl th:last-child, .lsn-tbl td:last-child{ padding-right:12px; }
.lsn-tbl thead th{ background:var(--color-surface); font-size:11.5px; }
.lsn-tbl tbody tr:last-child td{ border-bottom:0; }
.lsn-tbl table{ width:100%; border-collapse:collapse; font-size:12.5px; table-layout:auto; }
.lsn-tbl th{ font-weight:var(--w-body); color:var(--color-quiet); text-align:left; padding:6px 8px 6px 0; border-bottom:1px solid var(--color-divider); white-space:nowrap; }
.lsn-tbl td{ padding:7px 8px 7px 0; border-bottom:1px solid var(--color-divider); vertical-align:top; color:var(--color-text); overflow-wrap:anywhere; }
.lsn-tbl .is-r{ text-align:right; white-space:nowrap; padding-right:0; }
.lsn-tbl tbody tr{ opacity:0; animation:lsn-rise .35s ease-out forwards; transition:background-color var(--dur-2) var(--ease); }
.lsn-tbl tr.is-hot td{ color:var(--st-ruby-fg); }
.lsn-tbl tr.is-lit{ background:var(--row-chosen); }
.lsn-sub{ display:block; color:var(--color-quiet); font-size:11.5px; }
.lsn-ring{ display:block; }
.lsn-ring-pic{ display:flex; justify-content:center; padding:12px 12px 10px; border-bottom:1px solid var(--color-divider); }
.lsn-ring svg{ width:112px; height:112px; display:block; }
.lsn-cover{ stroke:var(--color-surface); stroke-dashoffset:0; animation:lsn-sweep .9s cubic-bezier(.4,.1,.2,1) forwards; }
.lsn-mid{ font-size:18px; font-weight:var(--w-strong); fill:var(--color-text); }
.lsn-arc{ transition:opacity var(--dur-2) var(--ease); }
.lsn-bd.has-lit .lsn-arc:not(.is-lit){ opacity:.3; }
.lsn-lg{ display:block; font-size:12.5px; min-width:0; }
.lsn-li{ display:grid; grid-template-columns:8px minmax(0,1fr) var(--lsn-vw,auto); gap:8px; align-items:center; min-height:30px; padding:0 12px; min-width:0; opacity:0; animation:lsn-fade .3s forwards; }
.lsn-li + .lsn-li{ border-top:1px solid var(--color-divider); }
.lsn-li i{ width:8px; height:8px; border-radius:50%; flex:none; }
.lsn-li span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--color-quiet); }
.lsn-li b{ text-align:right; font-weight:var(--w-body); font-variant-numeric:tabular-nums; color:var(--color-text); }
.lsn-bd.has-lit .lsn-li.is-lit span{ color:var(--color-text); font-weight:var(--w-strong); }
.lsn-line{ min-width:0; }
.lsn-plot{ position:relative; height:120px; margin:22px 16px 0; border-bottom:1px solid var(--color-divider); }
.lsn-wipe{ position:absolute; inset:0; clip-path:inset(0 100% 0 0); animation:lsn-wipe 1.1s ease-out forwards; }
.lsn-wipe svg{ position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
.lsn-wipe polyline{ stroke:var(--accent-ink); stroke-width:2.5px; stroke-linejoin:round; }
.lsn-dot{ position:absolute; width:7px; height:7px; margin:-3.5px 0 0 -3.5px; border-radius:50%; background:var(--color-surface); border:1.5px solid var(--accent-ink); }
.lsn-dot.is-last, .lsn-dot.is-lit{ background:var(--accent-ink); width:9px; height:9px; margin:-4.5px 0 0 -4.5px; }
.lsn-pv{ position:absolute; transform:translate(-100%,-150%); font-size:12px; font-weight:var(--w-strong); white-space:nowrap; padding-right:4px; }
.lsn-pv.is-first{ transform:translate(0,-150%); font-weight:var(--w-body); color:var(--color-quiet); }
.lsn-xl{ position:relative; height:26px; margin:0 16px; font-size:11px; color:var(--color-quiet); }
.lsn-xl span{ position:absolute; top:3px; transform:translateX(-50%); white-space:nowrap; }
.lsn-xl span:first-child{ transform:none; }
.lsn-xl span:last-child{ transform:translateX(-100%); }
.lsn-blocks{ display:grid; grid-auto-flow:column; grid-auto-columns:minmax(0,1fr); gap:6px; padding:22px 12px 12px; }
.lsn-bk-in{ position:relative; height:140px; }
.lsn-blk{ position:absolute; left:0; right:0; border-radius:2px; transform-origin:bottom; transform:scaleY(0); }
.lsn-bk-n{ position:absolute; left:0; right:0; text-align:center; font-size:12.5px; font-weight:var(--w-strong); opacity:0; }
.lsn-bk-l{ display:block; margin-top:4px; text-align:center; font-size:11.5px; line-height:1.2; color:var(--color-quiet); opacity:0; overflow-wrap:anywhere; }
.lsn-bk.is-shown .lsn-blk{ animation:lsn-growy .45s cubic-bezier(.2,.7,.2,1) var(--ls-bk-delay,0ms) forwards; }
.lsn-bk.is-shown .lsn-bk-n, .lsn-bk.is-shown .lsn-bk-l{ animation:lsn-fade .3s calc(var(--ls-bk-delay,0ms) + 200ms) forwards; }
.lsn-ctl{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:4px 0 2px; }
.lsn-prog{ margin-left:auto; display:flex; align-items:center; gap:8px; color:var(--color-quiet); font-size:12px; white-space:nowrap; }
.lsn-dots{ display:flex; gap:5px; }
.lsn-dots i{ width:6px; height:6px; border-radius:50%; background:var(--color-neutral-300); }
.lsn-dots i.on{ background:var(--color-text); }
.lsn-step.is-still *{ animation:none !important; opacity:1; }
.lsn-step.is-still .lsn-f i, .lsn-step.is-still .lsn-bk.is-shown .lsn-blk{ transform:none; }
.lsn-step.is-still .lsn-wipe{ clip-path:none; }
.lsn-step.is-still .lsn-cover{ display:none; }
@keyframes lsn-fade{ to{ opacity:1; } }
@keyframes lsn-rise{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }
@keyframes lsn-growx{ to{ transform:scaleX(1); } }
@keyframes lsn-growy{ to{ transform:scaleY(1); } }
@keyframes lsn-wipe{ to{ clip-path:inset(0 0 0 0); } }
@keyframes lsn-sweep{ to{ stroke-dashoffset:-289; } }
@media (prefers-reduced-motion: reduce){
  .lsn *{ animation:none !important; transition:none !important; }
  .lsn-w, .lsn-v, .lsn-li, .lsn-nomoney, .lsn-tbl tbody tr, .lsn-bk.is-shown .lsn-bk-n, .lsn-bk.is-shown .lsn-bk-l{ opacity:1; }
  .lsn-f i, .lsn-bk.is-shown .lsn-blk{ transform:none; }
  .lsn-wipe{ clip-path:none; }
  .lsn-cover{ display:none; }
}
`;
function lessonCssOn(){
  if (typeof document === 'undefined' || document.getElementById('lsn-css')) return;
  const el = document.createElement('style'); el.id = 'lsn-css'; el.textContent = LS_CSS; document.head.appendChild(el);
}

Object.assign(window, { lessonWords, lessonHeadOf, LS_HEADS, LS_WORD_MS, LS_AFTER_MS, LS_STILL_MS, LS_ALL_MS, LS_GAP, LS_READ, lsMoneyOk, lsMayAct, lessonBoard, lessonFill, lessonFromAnswer,
  lessonRunOf, lessonBoardHtml, lessonStepHtml, lessonInnerHtml, lessonTurnHtml, lessonMountAll, lessonRetime, lessonOpsApply, lessonOpsOf, lessonPatch,
  lessonNext, lessonAll, lessonReplay, lessonText, lessonSave, lessonLessonOf, lessonCssOn, _lnRun, _lnKept });
