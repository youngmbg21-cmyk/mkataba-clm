/* ============================================================
   OVERVIEW 2 — THE TIME MACHINE (work order O-36..O-42, 7 Oct 2026)
   ============================================================
   Owner-instructed: "add a new tab in the contract page called "Overview 2".
   In this tab, add the time machine proposal ... it has to be exactly as
   designed in the artifact especially with the colors, the graphics and the
   card above it that summarizes contents from the contract. Related
   agreements card should be the last card in the page."

   THE PAGE, TOP TO BOTTOM, AND NOTHING ELSE ON IT:
     1. the essentials card (parties, and the facts in a grid);
     2. the Time Machine: one card with the track, the controls and the "now"
        row, then three cards in a row under it;
     3. Related agreements, LAST.

   IT IS A READING. Every date comes off the record: signed
   (contractSignedAt), start and end (effectiveExpiry, so a signed amendment's
   end counts), the notice deadline (renewalWindow), amendments' signing
   dates, every obligation's due dates with future repeats PROJECTED FOR
   DRAWING ONLY (never stored), and the dated windows the arrival read from
   the wording (c.datedWindows, O-40). The tab writes nothing and spends
   nothing; a fact the record does not hold is left out, never guessed.
   Desktop only: the phone keeps its own screens (THE PHONE rule).
   Colours and type are the design page's own, as `--ov2-*` tokens. */

const OV2_DAY = 864e5;
const OV2_PLAY_MS = 14000;
const OV2_WINDOW_TONE = { fixed: 'g', fee: 'a', lockin: 'a', probation: 'a', nohire: 's', secrecy: 's', other: 's' };
const _ov2E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _ov2D = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
const _ov2Iso = d => d.toISOString().slice(0, 10);
const _ov2Add = (d, n) => new Date(+d + n * OV2_DAY);
const _ov2AddM = (d, n) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x; };
const _ov2Dd = (a, b) => Math.round((b - a) / OV2_DAY);
function _ov2Today(){ return _ov2D(typeof todayISO === 'function' ? todayISO() : new Date().toISOString()); }
/* a day as the reader says it: "05 Nov 2026", in their language */
function ov2Day(d){
  if (!d) return '';
  try { return d.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  catch (_){ return _ov2Iso(d); }
}
function ov2Rel(d, from){
  const n = _ov2Dd(from, d);
  if (n === 0) return i18t('ov2_today_word');
  if (n === 1) return i18t('ov2_tomorrow');
  if (n === -1) return i18t('ov2_yesterday');
  const a = Math.abs(n);
  const w = a < 45 ? i18tn('ov2_n_days', a, { n: a }) : a < 550 ? i18tn('ov2_n_months', Math.round(a / 30.44), { n: Math.round(a / 30.44) }) : i18t('ov2_n_years', { n: (a / 365).toFixed(1) });
  return n > 0 ? i18t('ov2_in', { w }) : i18t('ov2_ago', { w });
}
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
function ov2Sub(M){
  const bits = [];
  if (M.signed) bits.push(i18t('ov2_sub_signed', { d: ov2Day(M.signed) }));
  bits.push(M.end ? i18t('ov2_sub_runs', { d: ov2Day(M.end) }) : i18t('ov2_sub_noend'));
  if (M.end) bits.push(M.auto && M.noticeBy ? i18t('ov2_sub_renews', { d: ov2Day(M.noticeBy) }) : i18t('ov2_sub_norenew'));
  return bits.join(' · ');
}
/* the state of one duty on a date: g done · r late · a ≤21 days · s ≤60 · f later */
function ov2OccState(x, d, today){
  if (x.done && x.done <= d) return 'g';
  if (x.due < d) return (x.due < today || x.done) ? 'r' : 'p';
  const n = _ov2Dd(d, x.due); return n <= 21 ? 'a' : n <= 60 ? 's' : 'f';
}
/* THE MEASURE CARD: money by this date where the obligations carry amounts;
   otherwise the days left on the term; otherwise nothing is drawn */
function ov2Measure(M, d){
  const c = M.c;
  const money = (typeof isMonetary === 'function' ? isMonetary(c) : true);
  const mine = M.occ.filter(x => x.amount > 0 && !x.theirs), theirs = M.occ.filter(x => x.amount > 0 && x.theirs);
  const pick = mine.length ? mine : theirs;
  if (money && pick.length){
    const total = pick.reduce((s, x) => s + x.amount, 0);
    const by = pick.reduce((s, x) => s + ((x.done ? x.done <= d : (x.due <= d && x.due > M.today)) ? x.amount : 0), 0);
    return { cap: i18t(mine.length ? 'ov2_ms_paid_to' : 'ov2_ms_paid_by', { who: c.counterparty || '' }), big: by, fmt: v => _ov2Money(c, v),
      sub: i18t(d <= M.today ? 'ov2_ms_paid_sub' : 'ov2_ms_expected_sub', { total: _ov2Money(c, total) }), frac: total ? by / total : 0 };
  }
  if (M.end && M.start){
    const left = Math.max(0, _ov2Dd(d, M.end)), span = Math.max(1, _ov2Dd(M.start, M.end));
    return { cap: i18t('ov2_ms_term_left'), big: left, fmt: v => Math.round(v).toLocaleString() + ' ' + i18tn('ov2_days_word', Math.round(v), { n: Math.round(v) }),
      sub: i18t('ov2_ms_term_sub', { d: ov2Day(M.end) }), frac: 1 - left / span };
  }
  return null;
}
/* WHAT YOU CAN DO ON THIS DATE — off the record's notice deadline, the late
   duties, and the wording's own windows (O-40) */
function ov2Can(M, d){
  const o = [];
  if (M.end){
    if (M.auto && M.noticeBy){
      if (d <= M.noticeBy) o.push(['g', i18t('ov2_c_stop'), i18t('ov2_c_stop_yes', { n: M.notice, d: ov2Day(M.noticeBy) }), '']);
      else if (d <= M.end) o.push(['r', i18t('ov2_c_stop'), i18t('ov2_c_stop_late', { d: ov2Day(M.noticeBy) }), '']);
      else o.push(['s', i18t('ov2_c_renewed'), i18t('ov2_c_renewed_sub'), '']);
    } else if (d <= M.end) o.push(['s', i18t('ov2_c_ends'), i18t('ov2_c_ends_sub', { d: ov2Day(M.end) }), '']);
    else o.push(['s', i18t('ov2_c_ended'), i18t('ov2_c_ended_sub', { d: ov2Day(M.end) }), '']);
  }
  M.bands.filter(b => b.win && b.a <= d && d <= b.b).forEach(b => o.push([b.c, b.l, b.rule || i18t('ov2_c_until', { d: ov2Day(b.b) }), b.cl]));
  const late = M.occ.filter(x => ov2OccState(x, d, M.today) === 'r').length;
  o.push(late ? ['r', i18t('ov2_c_late'), i18tn('ov2_c_late_sub', late, { n: late }), ''] : ['g', i18t('ov2_c_nolate'), i18t('ov2_c_nolate_sub'), '']);
  return o;
}

/* ---- THE ESSENTIALS CARD (O-37) ---- */
const OV2_COL = [['var(--ov2-acc-100)', 'var(--ov2-acc-ink)'], ['var(--ov2-alt-soft)', 'var(--ov2-alt-ink)'], ['var(--ov2-p3-soft)', 'var(--ov2-p3-ink)'], ['var(--ov2-s-bg)', 'var(--ov2-s-fg)']];
function ov2Initials(name){
  const w = String(name || '').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  return ((w[0] || '?')[0] + ((w[1] || '')[0] || '')).toUpperCase();
}
function ov2SignedBy(c, p, i){
  const sigs = Array.isArray(c.signatures) ? c.signatures : [];
  const s = sigs.find(x => x && x.partyId && String(x.partyId) === String(p.id))
    || (p.side === 'ours' ? sigs.find(x => x && x.party !== 'counterparty') : (i === 1 ? sigs.find(x => x && x.party === 'counterparty') : null));
  if (!s || !s.name) return '';
  const at = _ov2D(s.at);
  return i18t('ov2_signed_by', { who: s.name + (s.title ? ', ' + s.title : ''), d: at ? ov2Day(at) : '' }).replace(/ · $/, '');
}
function ov2Facts(c, M){
  const R = (typeof ktFactReads === 'function') ? ktFactReads(c) : {};
  const plain = s => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const meta = c.metadata || {};
  const f = [];
  if (R.contractType) f.push([i18t('ov2_f_type'), plain(R.contractType)]);
  const law = (typeof contractGoverningLaw === 'function') ? contractGoverningLaw(c) : meta.governingLaw;
  if (law) f.push([i18t('ov2_f_law'), law]);
  if (meta.disputes) f.push([i18t('ov2_f_disputes'), String(meta.disputes)]);
  if (M.start || M.end) f.push([i18t('ov2_f_term'), (M.start ? ov2Day(M.start) : '…') + ' – ' + (M.end ? ov2Day(M.end) : i18t('ov2_no_end'))]);
  if (meta.renewalType && meta.renewalType !== 'unknown'){
    const word = (typeof metaOptLabel === 'function') ? metaOptLabel(meta.renewalType) : meta.renewalType;
    f.push([i18t('ov2_f_renewal'), word + (M.noticeBy && M.auto ? ' · ' + i18t('ov2_f_notice_by', { n: M.notice, d: ov2Day(M.noticeBy) }) : '')]);
  }
  let v = null; try { v = (typeof effectiveTerm === 'function') ? effectiveTerm(c, 'value').v : null; } catch (_){ v = null; }
  if (R.monetary && (v || c.value)) f.push([i18t('ov2_f_value'), _ov2Money(c, v || c.value)]);
  if (meta.paymentTerms) f.push([i18t('ov2_f_payment'), String(meta.paymentTerms)]);
  if (meta.liabilityCapped){
    const word = (typeof metaOptLabel === 'function') ? metaOptLabel(meta.liabilityCapped) : meta.liabilityCapped;
    if (word && word !== '—') f.push([i18t('ov2_f_liability'), word]);
  }
  return f;
}
function ov2EssHtml(c, M){
  const ps = (typeof contractParties === 'function') ? contractParties(c) : [];
  const rows = ps.map((p, i) => {
    const [bg, ink] = OV2_COL[Math.min(i, OV2_COL.length - 1)];
    const line = [p.role, p.side === 'ours' ? i18t('ov2_us') : '', p.address].filter(Boolean).join(' · ');
    const sg = ov2SignedBy(c, p, i);
    return `<div class="pty"><span class="pty-av" style="background:${bg};color:${ink}">${_ov2E(ov2Initials(p.name))}</span><div><b>${_ov2E(p.name || '—')}</b>${line ? `<small>${_ov2E(line)}</small>` : ''}${sg ? `<small class="sg">✓ ${_ov2E(sg)}</small>` : ''}</div></div>`;
  }).join('');
  const facts = ov2Facts(c, M);
  return `<div class="card ess" id="ov2-ess"><div class="ess-p"><span class="cap">${_ov2E(i18t('ov2_parties', { n: ps.length }))}</span>${rows}</div>
    <div class="ess-g">${facts.map(([l, v]) => `<div><span class="cap">${_ov2E(l)}</span><b>${_ov2E(v)}</b></div>`).join('')}</div></div>`;
}

/* ---- RELATED AGREEMENTS, LAST (O-41) ---- the family reading, the same doors */
function ov2FamHtml(c){
  const chk = (typeof familyCheck === 'function') ? familyCheck(c) : { order: [] };
  const order = chk.order || [];
  const signedHere = (typeof amendmentExecuted === 'function') ? amendmentExecuted(c) : c.status === 'Signed';
  const edit = typeof canEdit !== 'function' || canEdit();
  const acts = edit && !c.parentId ? `<div class="fam-acts"><button type="button" class="btn sm fill" data-ov2-fam="create"${signedHere ? '' : ` disabled title="${_ov2E(i18t('fa_draft_no_amend'))}"`}>${_ov2E(i18t('fa_create_amendment'))}</button><button type="button" class="btn sm" data-ov2-fam="add">${_ov2E(i18t('fa_link_existing'))}</button></div>` : '';
  const ref = x => (typeof contractRef === 'function') ? contractRef(x) : x.id;
  const tone = x => x.status === 'Signed' ? 'g' : x.status === 'Declined' ? 'r' : x.status === 'Under Review' ? 'a' : 's';
  const stWord = x => { try { return (typeof contractStatusMeta === 'function') ? contractStatusMeta(x).label : (x.status || ''); } catch (_){ return x.status || ''; } };
  const relWord = x => x.parentId ? ((window.RELATION_DOC_WORD && window.RELATION_DOC_WORD[x.relation]) || x.relation || '') : i18t('ov2_fam_main');
  const rows = order.length > 1 ? order.map(e => { const x = e.doc, me = String(x.id) === String(c.id);
    return `<div class="fam-row${me ? ' is-this' : ''}"><span class="ref">${_ov2E(ref(x))}</span><div><button type="button" class="ov2-famopen" data-ov2-open="${_ov2E(x.id)}"><b>${_ov2E(x.name || x.id)}</b></button><small>${_ov2E(relWord(x))}${me ? ' · ' + _ov2E(i18t('ov2_this_doc')) : ''}</small></div><span class="pill t-${tone(x)}"><i></i>${_ov2E(stWord(x))}</span></div>`; }).join('') : '';
  let win = '';
  if (rows){
    const held = new Map();
    (chk.rows || []).forEach(r => { if (!r.signed) return; (r.moved || []).forEach(m => held.set(m.label, (r.name || r.ref || r.id) + ' (' + (r.ref || r.id) + ')')); });
    const parts = [...held.entries()].map(([k, v]) => `${_ov2E(k)}: <b>${_ov2E(v)}</b>`);
    win = `<p class="fam-win">${_ov2E(i18t('ov2_fam_wins'))} ${parts.length ? parts.join('. ') + '. ' + _ov2E(i18t('ov2_fam_else')) : _ov2E(i18t('ov2_fam_all_main'))}</p>`;
  }
  const rev = edit && !c.parentId && order.length < 2 ? `<p class="fam-rev">${_ov2E(i18t('fa_is_itself'))} <button type="button" class="ui-link" data-ov2-fam="parent">${_ov2E(i18t('fa_link_parent'))}</button></p>` : '';
  return `<div class="card fam" id="ov2-fam"><div class="fam-h"><h3>${_ov2E(i18t('ov2_fam_title'))}</h3>${acts}</div>${rows ? `<div class="fam-rows">${rows}</div>${win}` : `<p class="fam-alone">${_ov2E(i18t('ov2_fam_alone'))}</p>`}${rev}</div>`;
}

/* ---- THE TIME MACHINE (O-38, O-39) ---- */
function ov2TimeHtml(M){
  const max = Math.max(1, _ov2Dd(M.t0, M.t1));
  const playIc = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>';
  return `<div class="card" id="ov2-tm"><div class="tm-top"><h3>${_ov2E(i18t('ov2_life'))}</h3><span>${_ov2E(ov2Sub(M))}${M.winAsked && !M.winRead ? ' · ' + _ov2E(i18t('ov2_win_unread')) : (!M.winAsked ? ' · ' + _ov2E(i18t('ov2_win_unread')) : '')}</span></div>
    <div class="tm-track" id="ov2-tr"><div id="ov2-svg"></div><input class="tm-range" id="ov2-r" type="range" min="0" max="${max}" step="1" value="${Math.max(0, Math.min(max, _ov2Dd(M.t0, M.today)))}" aria-label="${_ov2E(i18t('ov2_range_aria'))}"></div>
    <div class="tm-ctl"><button type="button" class="btn sm fill" id="ov2-play">${playIc}${_ov2E(i18t('ov2_play'))}</button><button type="button" class="btn sm" data-ov2-j="${+M.today}" aria-pressed="true">${_ov2E(i18t('ov2_today'))}</button>${M.jumps.map(j => `<button type="button" class="btn sm" data-ov2-j="${+j.d}">${_ov2E(j.l)}</button>`).join('')}</div>
    <div class="tm-now"><div><div class="tm-date"><span id="ov2-d"></span><span class="tm-rel" id="ov2-rel"></span></div><p class="tm-say" id="ov2-say"></p></div><div class="ringw" id="ov2-ring"></div></div></div>
    <div class="tm-cards" id="ov2-cards">${ov2Measure(M, M.today) ? `<div class="card pane" id="ov2-mcard"><span class="cap" id="ov2-mc"></span><div class="tm-big" id="ov2-mb">0</div><small id="ov2-ms" class="ov2-muted"></small><div class="meter"><b id="ov2-mm"></b></div></div>` : ''}
      <div class="card pane"><span class="cap">${_ov2E(i18t('ov2_duties'))}</span><div id="ov2-obs"></div></div>
      <div class="card pane"><span class="cap">${_ov2E(i18t('ov2_can'))}</span><div id="ov2-can"></div></div></div>`;
}
function ov2TrackSvg(M, W){
  const H = 150, P = 10, T0 = M.t0, T1 = M.t1;
  const X = d => P + (W - 2 * P) * (d - T0) / (T1 - T0);
  let s = `<svg class="tsvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`;
  for (let y = T0.getUTCFullYear() + 1; y <= T1.getUTCFullYear(); y++){ const xd = X(_ov2D(y + '-01-01')); if (xd > P + 20 && xd < W - P - 10) s += `<line x1="${xd}" y1="36" x2="${xd}" y2="112" style="stroke:var(--ov2-line-2)"/><text x="${xd + 5}" y="46" style="font-size:11px;fill:var(--ov2-faint)">${y}</text>`; }
  M.bands.forEach(b => { const a = Math.max(P, X(b.a)), z = Math.min(W - P, X(b.b)), w = z - a; if (w <= 0) return;
    s += `<rect x="${a}" y="52" width="${w}" height="20" rx="4" style="fill:var(--ov2-${b.c}-bg)${b.c === 's' ? ';stroke:var(--ov2-s-dot);stroke-dasharray:4 3' : ''}"/>`;
    if (w > b.l.length * 6.3 + 12) s += `<text x="${a + 8}" y="66" style="font-size:11px;font-weight:600;fill:var(--ov2-${b.c}-fg)">${_ov2E(b.l)}</text>`; });
  const S = M.start || M.signed || M.t0, LAST = M.end || T1;
  s += `<line x1="${X(S)}" y1="92" x2="${X(LAST)}" y2="92" style="stroke:var(--ov2-line);stroke-width:4;stroke-linecap:round"/><line id="ov2-el" x1="${X(S)}" y1="92" x2="${X(S)}" y2="92" style="stroke:var(--ov2-acc-fill);stroke-width:4;stroke-linecap:round"/>`;
  if (M.end) s += `<line x1="${X(M.end) + 6}" y1="92" x2="${X(T1)}" y2="92" style="stroke:var(--ov2-line);stroke-width:3;stroke-dasharray:3 5"/>`;
  else s += `<path d="M${W - P - 2},86 l8,6 -8,6" style="fill:none;stroke:var(--ov2-faint);stroke-width:2"/>`;
  M.occ.forEach(o => { const xo = X(o.due); if (xo < P || xo > W - P) return; s += `<line x1="${xo}" y1="99" x2="${xo}" y2="105" style="stroke:${o.done ? 'var(--ov2-acc-fill)' : 'var(--ov2-acc-200)'};stroke-width:1.5"/>`; });
  const rows = [-1e9, -1e9], labs = [];
  M.marks.map(m => ({ x: X(m.d), l: m.l })).concat([{ x: X(M.today), l: i18t('ov2_today'), today: 1 }]).sort((a, b) => a.x - b.x).forEach(m => {
    const w = m.l.length * 6.2 + 10, r = rows[0] < m.x - w / 2 ? 0 : rows[1] < m.x - w / 2 ? 1 : -1; if (r < 0) return; rows[r] = m.x + w / 2;
    const cx = Math.min(Math.max(m.x, w / 2), W - w / 2);
    labs.push(`<line x1="${m.x}" y1="100" x2="${m.x}" y2="${r ? 128 : 114}" style="stroke:var(--ov2-line)"/><text x="${cx}" y="${r ? 141 : 127}" text-anchor="middle" style="font-size:11px;font-weight:${m.today ? 700 : 500};fill:${m.today ? 'var(--ov2-a-fg)' : 'var(--ov2-muted)'}">${_ov2E(m.l)}</text>`); });
  s += labs.join('');
  M.marks.forEach(m => { const xm = X(m.d); s += `<rect x="${xm - 5}" y="87" width="10" height="10" transform="rotate(45 ${xm} 92)" style="fill:var(--ov2-${m.k}-dot);stroke:var(--ov2-surface);stroke-width:2"/>`; });
  const xt = X(M.today);
  s += `<line x1="${xt}" y1="36" x2="${xt}" y2="112" style="stroke:var(--ov2-a-dot);stroke-width:1.5;stroke-dasharray:3 3"/><circle class="ringp" cx="${xt}" cy="92" r="6" style="fill:var(--ov2-a-dot)"/><circle cx="${xt}" cy="92" r="5" style="fill:var(--ov2-a-dot);stroke:var(--ov2-surface);stroke-width:2"/>`;
  s += `<g id="ov2-cur"><line x1="0" y1="26" x2="0" y2="112" style="stroke:var(--ov2-acc-fill);stroke-width:2"/><circle cx="0" cy="92" r="9" style="fill:var(--ov2-surface);stroke:var(--ov2-acc-fill);stroke-width:3"/><rect id="ov2-cb" x="-48" y="2" width="96" height="22" rx="11" style="fill:var(--ov2-acc-fill)"/><text id="ov2-ct" x="0" y="17" text-anchor="middle" style="font-size:12px;font-weight:600;fill:#fff"></text></g></svg>`;
  return { svg: s, X };
}
function ov2Ring(n, label){
  const R = 26, Cc = 2 * Math.PI * R, f = n == null ? 0 : 1 - Math.min(n, 90) / 90;
  const head = n == null ? i18t('ov2_ring_none') : n === 0 ? i18t('ov2_ring_today') : i18t('ov2_ring_days');
  return `<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" style="fill:none;stroke:var(--ov2-line);stroke-width:6"/><circle cx="32" cy="32" r="${R}" transform="rotate(-90 32 32)" style="fill:none;stroke:${n != null && n <= 21 ? 'var(--ov2-a-dot)' : 'var(--ov2-acc-fill)'};stroke-width:6;stroke-linecap:round;stroke-dasharray:${Cc};stroke-dashoffset:${Cc * (1 - f)};transition:stroke-dashoffset .4s"/><text x="32" y="37" text-anchor="middle" style="font:700 15px var(--ov2-ui);fill:var(--ov2-text)">${n == null ? '–' : n}</text></svg><div><b>${_ov2E(head)}</b><small>${_ov2E(label)}</small></div>`;
}
function _ov2Tween(node, to, fmt, ms){
  if (!node) return;
  const RM = (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = +(node.dataset.v || 0); node.dataset.v = to;
  if (RM || typeof requestAnimationFrame !== 'function'){ node.textContent = fmt(to); return; }
  cancelAnimationFrame(node._raf); const t0 = performance.now(), T = ms || 650;
  const step = t => { const k = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - k, 3); node.textContent = fmt(from + (to - from) * e); if (k < 1) node._raf = requestAnimationFrame(step); };
  node._raf = requestAnimationFrame(step);
}
let _ov2Live = null;
/* THE PAINTER: the room calls this on arrival on the tab (wire where you
   PAINT); the track is drawn at the card's real width and again on resize */
function paintOverview2(c){
  const host = document.getElementById('ws-ov2-pane'); if (!host || !c) return;
  const M = ov2Model(c);
  const html = `<div class="ov2" id="ov2">${ov2EssHtml(c, M)}${ov2TimeHtml(M)}${ov2FamHtml(c)}</div>`;
  /* A REPAINT THAT CHANGES NOTHING KEEPS THE READER'S DATE: the room repaints
     its tabs after every save, and the cursor (or a playing life) is the
     reader's hand, not the record's */
  if (_ov2Live && _ov2Live.root && _ov2Live.root.isConnected && _ov2Live.html === html && host.contains(_ov2Live.root)) return;
  if (_ov2Live && _ov2Live.stop) _ov2Live.stop();
  host.innerHTML = html;
  const root = host.querySelector('#ov2');
  const tr = root.querySelector('#ov2-tr'), svgHost = root.querySelector('#ov2-svg'), rng = root.querySelector('#ov2-r'), playB = root.querySelector('#ov2-play');
  let X = null, W = 900, raf = 0, playing = false, sig = '';
  const TMAX = Math.max(1, _ov2Dd(M.t0, M.t1));
  const dateOf = () => _ov2Add(M.t0, +rng.value);
  const $ = s => root.querySelector(s);
  function draw(){
    W = Math.max(300, Math.round((tr.clientWidth || 936) - 36));
    const T = ov2TrackSvg(M, W); X = T.X; svgHost.innerHTML = T.svg; upd(true);
  }
  function upd(force){
    const d = dateOf(), xc = X(d);
    const g = $('#ov2-cur');
    if (g){ g.setAttribute('transform', `translate(${xc},0)`); const bx = Math.min(Math.max(-48, 10 - xc), W - 10 - xc - 96); $('#ov2-cb').setAttribute('x', bx); $('#ov2-ct').setAttribute('x', bx + 48); $('#ov2-ct').textContent = ov2Day(d); }
    const S = M.start || M.signed || M.t0, LAST = M.end || M.t1;
    const el = $('#ov2-el'); if (el) el.setAttribute('x2', X(new Date(Math.min(Math.max(+d, +S), +LAST))));
    root.querySelectorAll('[data-ov2-j]').forEach(x => x.setAttribute('aria-pressed', String(_ov2Dd(new Date(+x.dataset.ov2J), d) === 0)));
    $('#ov2-d').textContent = ov2Day(d);
    $('#ov2-rel').textContent = _ov2Dd(M.today, d) === 0 ? i18t('ov2_today_word') : i18t('ov2_from_today', { w: ov2Rel(d, M.today) });
    const m = ov2Measure(M, d);
    if (m && $('#ov2-mc')){ $('#ov2-mc').textContent = m.cap; _ov2Tween($('#ov2-mb'), m.big, m.fmt, force ? 500 : 240); $('#ov2-ms').textContent = m.sub; $('#ov2-mm').style.width = (Math.max(0, Math.min(1, m.frac)) * 100).toFixed(1) + '%'; }
    const nx = M.occ.filter(x => x.due >= d && !(x.done && x.done <= d)).sort((a, b) => a.due - b.due)[0];
    const late = M.occ.filter(x => ov2OccState(x, d, M.today) === 'r');
    $('#ov2-say').textContent = (late.length ? i18tn('ov2_say_late', late.length, { n: late.length }) : i18t('ov2_say_nolate')) + ' ' + (nx ? i18t('ov2_say_next', { t: nx.t, d: ov2Day(nx.due) }) : i18t('ov2_say_nonext'));
    $('#ov2-say').classList.toggle('is-late', late.length > 0);
    $('#ov2-ring').innerHTML = ov2Ring(nx ? _ov2Dd(d, nx.due) : null, nx ? nx.t + ' · ' + ov2Day(nx.due) : '');
    const rows = M.occ.map(x => ({ x, s: ov2OccState(x, d, M.today) })).filter(r => r.s === 'r' || r.s === 'a' || r.s === 's' || (r.s === 'g' && r.x.done && _ov2Dd(r.x.done, d) <= 30));
    const ord = { r: 0, a: 1, s: 2, g: 3 }; rows.sort((a, b) => ord[a.s] - ord[b.s] || a.x.due - b.x.due);
    const top = rows.slice(0, 6), ns = top.map(r => r.s + r.x.t + r.x.due).join('|');
    const cl = x => x.cl ? ` · <span class="cl">${_ov2E(i18t('ov2_cl', { n: x.cl }))}</span>` : '';
    if (ns !== sig || force){ sig = ns;
      $('#ov2-obs').innerHTML = top.length ? top.map((r, i) => `<div class="ob rise" data-ov2-st="${r.s}" style="animation-delay:${i * 40}ms"><span class="dot d-${r.s}"></span><div>${_ov2E(r.x.t)}<small>${_ov2E(r.s === 'g' ? i18t('ov2_done_on', { d: ov2Day(r.x.done) }) : r.s === 'r' ? i18t('ov2_was_due', { d: ov2Day(r.x.due) }) : i18t('ov2_due_on', { d: ov2Day(r.x.due) }))}${cl(r.x)}</small></div></div>`).join('')
        : `<p class="ov2-none">${_ov2E(i18t('ov2_nothing_due'))}</p>`; }
    $('#ov2-can').innerHTML = ov2Can(M, d).map(([t, h, b, k]) => `<div class="ob"><span class="dot d-${t}"></span><div><b class="ov2-b">${_ov2E(h)}</b><small>${_ov2E(b)}${k ? ` · <span class="cl">${_ov2E(i18t('ov2_cl', { n: k }))}</span>` : ''}</small></div></div>`).join('');
  }
  const pauseIc = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
  const playIc = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>';
  function setPlay(on){
    playing = on; playB.innerHTML = on ? pauseIc + _ov2E(i18t('ov2_pause')) : playIc + _ov2E(i18t('ov2_play'));
    cancelAnimationFrame(raf); if (!on) return; if (+rng.value >= TMAX - 2) rng.value = 0; let last = performance.now();
    const step = t => { const dt = t - last; last = t; rng.value = Math.min(TMAX, +rng.value + dt * TMAX / OV2_PLAY_MS); upd(); if (+rng.value >= TMAX){ setPlay(false); return; } raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }
  let pend = 0;
  rng.addEventListener('input', () => { if (playing) setPlay(false); cancelAnimationFrame(pend); pend = requestAnimationFrame(() => upd()); });
  playB.addEventListener('click', () => setPlay(!playing));
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-ov2-j]');
    if (b){ setPlay(false); rng.value = _ov2Dd(M.t0, new Date(+b.dataset.ov2J)); upd(true); return; }
    const f = e.target.closest('[data-ov2-fam]');
    if (f){ const k = f.getAttribute('data-ov2-fam'), again = () => paintOverview2(getContract(c.id) || c);
      if (k === 'create' && typeof openCreateAmendmentModal === 'function' && (typeof amendmentExecuted !== 'function' || amendmentExecuted(c))) openCreateAmendmentModal(c);
      else if (k === 'add' && typeof openLinkModal === 'function') openLinkModal(c, again, { mode: 'parent' });
      else if (k === 'parent' && typeof openLinkModal === 'function') openLinkModal(c, again, { mode: 'child' });
      return; }
    const o = e.target.closest('[data-ov2-open]');
    if (o && typeof openWorkspace === 'function'){ const id = o.getAttribute('data-ov2-open'); if (String(id) !== String(c.id)) openWorkspace(id); }
  });
  let rt = 0; const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (document.getElementById('ov2') === root) draw(); }, 120); };
  window.addEventListener('resize', onResize);
  setPlay(false); draw();
  _ov2Live = { stop(){ setPlay(false); window.removeEventListener('resize', onResize); }, root, html };
  /* the pane is drawn while hidden on a first paint: draw again once it has a width */
  if (!(tr.clientWidth > 0) && typeof requestAnimationFrame === 'function') requestAnimationFrame(() => { if (tr.clientWidth > 0) draw(); });
}
function ov2Stop(){ if (_ov2Live && _ov2Live.stop) _ov2Live.stop(); }

Object.assign(window, { OV2_PLAY_MS, OV2_WINDOW_TONE, ov2Model, ov2Sub, ov2OccState, ov2Measure, ov2Can, ov2Facts, ov2EssHtml, ov2FamHtml, ov2TimeHtml, ov2TrackSvg, ov2Day, ov2Rel, paintOverview2, ov2Stop, runDatedWindows });
