/* ============================================================
   THE TIME MACHINE'S READINGS (overview2.js)
   ============================================================
   The Overview 2 tab (work order O-36..O-42, 7 Oct 2026) is gone: its tab
   left on 9 Oct and its page, drawing and styling were deleted on 15 Oct 2026
   (owner: "Delete the retired features"). Two readings it owned are still
   read, and this file keeps only them:
     · ov2Model — a contract's dates off the record (signed, start and end
       through effectiveExpiry, the notice deadline, amendments, obligations
       with repeats PROJECTED FOR DRAWING ONLY, and the dated windows); the
       Board's Lifeline strip draws its life line from it (bsLifeData).
     · runDatedWindows — the arrival's read of dated windows in the wording
       (POST /api/ai/windows → c.datedWindows), run by triageRun.
   Both write nothing to the record but what runDatedWindows is asked to
   keep, and a fact the record does not hold is left out, never guessed. */
const OV2_DAY = 864e5;
const OV2_WINDOW_TONE = { fixed: 'g', fee: 'a', lockin: 'a', probation: 'a', nohire: 's', secrecy: 's', other: 's' };
const _ov2E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _ov2D = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
const _ov2Iso = d => d.toISOString().slice(0, 10);
const _ov2Add = (d, n) => new Date(+d + n * OV2_DAY);
const _ov2AddM = (d, n) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x; };
const _ov2Dd = (a, b) => Math.round((b - a) / OV2_DAY);
function _ov2Today(){ return _ov2D(typeof todayISO === 'function' ? todayISO() : new Date().toISOString()); }
/* a day as the reader says it: "05 Nov 2026", in their language */
function _ov2Money(c, v){
  try { if (typeof fmtMoneyShortIn === 'function') return fmtMoneyShortIn(v, (typeof contractCurrency === 'function') ? contractCurrency(c) : ''); } catch (_){}
  return ((typeof contractCurrency === 'function') ? contractCurrency(c) + ' ' : '') + Math.round(v).toLocaleString();
}

/* ---- THE DATED WINDOWS FROM THE WORDING (O-40) ----
   Asked once per wording, on arrival (triageRun calls this after the
   obligations reading). Kept on the contract like the brief; the share
   payload is a list of named fields and this is not one of them. A refusal
   is kept as one, so the tab can say once that the wording's own windows
   were not read. Never throws. */
async function runDatedWindows(c, opts){
  opts = opts || {};
  try {
    const hash = (typeof triageWordingHash === 'function') ? String(triageWordingHash(c) || '') : '';
    if (c.datedWindows && c.datedWindows.hash === hash && c.datedWindows.ok && !opts.fresh) return c.datedWindows;
    const text = (typeof isUpload === 'function' && isUpload(c)) ? ((c.upload && c.upload.extractedText) || '') : ((typeof contractPlainText === 'function') ? contractPlainText(c) : '');
    if (!text || text.length < 200){ c.datedWindows = { hash, ok: false, why: 'short' }; return c.datedWindows; }
    if (!(typeof API_MODE === 'function' && API_MODE() && window.state && state.aiConfigured)){ c.datedWindows = { hash, ok: false, why: 'nokey' }; return c.datedWindows; }
    const M = ov2Model(c, { noWindows: true });
    const r = await api('ai/windows', 'POST', { text, start: M.start ? _ov2Iso(M.start) : '', end: M.end ? _ov2Iso(M.end) : '' }, { quiet: true });
    c.datedWindows = { hash, ok: true, at: (typeof nowISO === 'function') ? nowISO() : new Date().toISOString(), windows: (r && r.windows) || [], dropped: (r && r.dropped) || 0 };
  } catch (e){
    c.datedWindows = { hash: c.datedWindows && c.datedWindows.hash, ok: false, why: 'failed' };
  }
  return c.datedWindows;
}

/* ---- THE MODEL: everything the tab draws, read off the record ---- */
function _ov2Occ(c, start, t1){
  const out = [];
  const step = { monthly: 1, quarterly: 3, annual: 12 };
  (Array.isArray(c.obligations) ? c.obligations : []).forEach(o => {
    if (!o) return;
    const due = _ov2D(o.due); if (!due) return;
    const st = (typeof obState === 'function') ? obState(o) : (o.status || 'open');
    const done = st === 'done' ? (_ov2D(o.completedAt || o.doneAt) || due) : null;
    const theirs = o.party === 'theirs';
    const base = { t: o.desc || '', cl: o.clause || '', theirs, amount: Number(o.amount) > 0 ? Number(o.amount) : 0 };
    out.push(Object.assign({ due, done }, base));
    /* FUTURE REPEATS ARE DRAWN, NEVER STORED: the next instance is opened by
       obligationMarkDone alone; here they are only the shape of the year */
    const m = step[o.recurring];
    if (m && st !== 'done'){
      let d = _ov2AddM(due, m), n = 0;
      while (d <= t1 && n++ < 120){ out.push(Object.assign({ due: d, done: null, projected: true }, base)); d = _ov2AddM(d, m); }
    }
  });
  return out.sort((a, b) => a.due - b.due);
}
function ov2Model(c, opts){
  opts = opts || {};
  const today = _ov2Today();
  const signed = _ov2D((typeof contractSignedAt === 'function') ? contractSignedAt(c) : c.signedAt);
  const start = _ov2D((c.fields && c.fields.effDate) || (c.metadata && c.metadata.effectiveDate)) || signed;
  const end = _ov2D((typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : c.expiry);
  let rw = null; try { rw = (typeof renewalWindow === 'function') ? renewalWindow(c) : null; } catch (_){ rw = null; }
  const auto = ((c.metadata || {}).renewalType) === 'auto-renew';
  const notice = Number((c.metadata || {}).noticePeriodDays) || 0;
  const noticeBy = end && notice ? _ov2Add(end, -notice) : (rw && _ov2D(rw.decideBy)) || null;
  const first = [signed, start, today].filter(Boolean).reduce((a, b) => (b < a ? b : a));
  const t0 = _ov2Add(first, -14);
  let t1 = end ? (auto ? _ov2AddM(end, 12) : _ov2Add(end, Math.max(45, Math.round(_ov2Dd(t0, end) * 0.08)))) : _ov2AddM(today, 24);
  if (t1 < _ov2Add(today, 30)) t1 = _ov2Add(today, 60);
  const marks = [];
  if (signed) marks.push({ d: signed, l: i18t('ov2_m_signed'), k: 'g' });
  if (start && (!signed || _ov2Dd(signed, start) !== 0)) marks.push({ d: start, l: i18t('ov2_m_starts'), k: 'g' });
  (typeof familyChildren === 'function' ? familyChildren(c.id) : []).forEach(k => {
    const at = _ov2D((typeof contractSignedAt === 'function') ? contractSignedAt(k) : null);
    if (at && (typeof amendmentExecuted !== 'function' || amendmentExecuted(k))) marks.push({ d: at, l: k.name || k.id, k: 'g' });
  });
  if (noticeBy && end && noticeBy < end) marks.push({ d: noticeBy, l: i18t('ov2_m_notice'), k: 'r', jump: 1 });
  if (end) marks.push({ d: end, l: i18t(auto ? 'ov2_m_end_renews' : 'ov2_m_end'), k: 's', jump: 1, end: 1 });
  const bands = [];
  const W = c.datedWindows;
  const winRead = !opts.noWindows && W && W.ok;
  if (winRead) (W.windows || []).forEach(w => { const a = _ov2D(w.from), b = _ov2D(w.to); if (a && b && b >= a) bands.push({ a, b, l: w.label, c: OV2_WINDOW_TONE[w.kind] || 's', rule: w.rule || '', cl: w.clause || '', win: 1 }); });
  if (end && auto) bands.push({ a: _ov2Add(end, 1), b: _ov2AddM(end, 12), l: i18t('ov2_b_renewal_year'), c: 's' });
  const jumps = marks.filter(m => m.jump).map(m => ({ l: m.end ? i18t('ov2_j_end') : m.l, d: m.d }));
  bands.filter(b => b.win).forEach(b => { if (_ov2Dd(b.b, end || t1) > 0) jumps.unshift({ l: i18t('ov2_j_after', { what: b.l }), d: _ov2Add(b.b, 1) }); });
  const occ = _ov2Occ(c, start || t0, t1);
  return { c, today, signed, start, end, auto, notice, noticeBy, t0, t1, marks, bands, jumps: jumps.slice(0, 4), occ, winRead: !!winRead, winAsked: !!W };
}

Object.assign(window, { ov2Model, runDatedWindows });
