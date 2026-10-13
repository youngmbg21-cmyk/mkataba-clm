/* ============================================================
   THE DEEP READ OF ONE CONTRACT — read once, kept, drawn on Clauses
   ============================================================
   Home's Breakdown face is GONE (owner, 13 Oct 2026: "You were also supposed
   to delete breakdown"); its one reading lives on, drawn by Stakes in Home's
   Document → Clauses list (stkDecorate below).

   ONE READING (POST /api/ai/breakdown, `bdRun`): the regions and the points
   that matter to the company, kept on the contract against the wording's hash
   (c.breakdown) — read again only when the words change. OPENING A CONTRACT'S
   CLAUSES IS THE PRESS (the owner's rule for the Breakdown, 11 Oct 2026:
   "Choosing the contract should be the only press needed"): a contract with
   no reading of these words is read once a sitting (`_bd.tried`), and a
   refusal is said with Try again, never retried in a loop. No score: counts
   and facts. Nothing is filed or sent.
   ============================================================ */
const _bd = { busy: false, err: '', runFor: null, tried: {} };
const _bdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function bdHash(c){ try { return (typeof triageWordingHash === 'function') ? String(triageWordingHash(c) || '') : ''; } catch (_){ return ''; } }
/* the kept reading, only while it is the reading of THESE words */
function bdOf(c){
  const b = c && c.breakdown;
  return (b && b.ok && Array.isArray(b.regions) && b.hash === bdHash(c)) ? b : null;
}
function bdStale(c){ const b = c && c.breakdown; return !!(b && b.ok && b.hash !== bdHash(c)); }
function bdText(c){
  if (!c) return '';
  if (typeof isUpload === 'function' && isUpload(c)) return (c.upload && c.upload.extractedText) || '';
  return (typeof contractPlainText === 'function') ? contractPlainText(c) : '';
}
/* THE ONE READ: kept against the wording; started by opening Clauses (stkAutoRun) or Try again */
async function bdRun(c){
  if (!c || _bd.busy) return;
  _bd.busy = true; _bd.err = '';
  try {
    if (c._light && !c._loaded && typeof ensureFull === 'function') await ensureFull(c);
    const live = (typeof getContract === 'function' && getContract(c.id)) || c;
    const text = bdText(live);
    if (!text || text.length < 200) throw new Error(i18t('bd_too_short'));
    if (!(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured)) throw new Error(i18t('bd_no_key'));
    const r = await api('ai/breakdown', 'POST', { text }, { quiet: true });
    if (!r || !Array.isArray(r.regions) || !r.regions.length) throw new Error((r && r.error) || i18t('bd_failed'));
    live.breakdown = { ok: true, hash: bdHash(live), at: (typeof nowISO === 'function') ? nowISO() : new Date().toISOString(),
      head: r.head || '', sub: r.sub || '', regions: r.regions, links: Array.isArray(r.links) ? r.links : [],
      points: Array.isArray(r.points) ? r.points : [],
      dropped: Number(r.dropped) || 0, truncated: !!r.truncated };
    if (typeof persist === 'function') persist(live);
  } catch (e){
    _bd.err = (e && e.message) || i18t('bd_failed');
  }
  _bd.busy = false;
}
function bdChip(st){
  const cls = st === 'need' ? 'is-need' : st === 'look' ? 'is-look' : 'is-fine';
  return `<span class="bd-chip ${cls}">${_bdE(i18t('bd_st_' + st))}</span>`;
}

function bdBusyHtml(){ return window.busyHtml ? busyHtml(i18t('bd_reading')) : _bdE(i18t('bd_reading')); }

/* ============================================================
   STAKES — THE CLAUSES TAB CARRIES THE DEEP READ (owner picked it by name,
   13 Oct 2026, the artifact "Clauses and Breakdown, Joined", round 3)
   ============================================================
   Home's Clauses list (docThreadPaint on #pd-thread) keeps its joined beads
   and its paper. This adds, from the SAME kept reading (c.breakdown, one
   Jambo read per wording, spent only on a press):
     · a head: what the deal commits us to and what needs us, and the
       regions as one coloured ribbon;
     · under each clause a point touches, ONE company line — the risk and the
       money together, never split by department (owner: "one Overall Company
       view") — and a Deep dive door;
     · "Not in the contract", the points about what the wording never says;
     · THE DEEP DIVE: its own panel in the same place, with a way back.
   NO CONTRACT WORDING IS REPEATED IN THE PANEL (owner: "the paper is already
   on screen"): a point's words are lit on the paper instead (igQuoteGo).
   Nothing is filed or sent: "Start redlining with this ask" is Negotiate's
   own door, "Ask Jambo about this" only fills Jambo's ask box. */
const _stk = { id: null, dive: -1, f: { reg: '', sev: '', by: '' }, rows: null, nums: null, mOpen: '', diveBusy: {}, diveErr: {} };
const STK_REGION_TONES = 10;
const stkOf = c => { const b = bdOf(c); return b && Array.isArray(b.points) ? b : null; };
const stkNum = s => { const m = /^\s*(?:clause\s+|§\s*)?(\d+(?:\.\d+)*)/i.exec(String(s || '')); return m ? m[1] : ''; };
/* the row a point sits on: the clause's own number, else the clause it is part of */
function stkRowFor(p, nums){
  const n = stkNum(p.clause); if (!n) return -1;
  let at = nums.indexOf(n);
  for (let k = n; at < 0 && k.includes('.'); ){ k = k.slice(0, k.lastIndexOf('.')); at = nums.indexOf(k); }
  /* a heading's number ("3") whose clauses are numbered beneath it ("3.1") */
  if (at < 0) at = nums.findIndex(x => x && x.startsWith(n + '.'));
  return at;
}
function stkTone(p){ return p && p.region ? ' stk-r' + (((p.region - 1) % STK_REGION_TONES) + 1) : ''; }
/* the reading this list owes: none of these words yet, or one made before the deep read */
const stkOwed = c => !stkOf(c);
const stkKey = c => String(c && c.id) + ':' + bdHash(c);
/* THE POINTS AND WHO FOUND THEM (owner, 13 Oct 2026, as drawn: Region ·
   Severity · Found by): Jambo's company read, and every standard this
   contract departs from or lacks, from the KEPT standards check (c.playbook,
   read RAW — nothing is run or spent here) */
const STK_BY = ['jambo', 'std', 'scan', 'brief'];
const STK_SEVS = ['need', 'look', 'note', 'fine'];
const _stkNorm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
function stkStdPoints(c){
  const vs = (typeof stdDepartures === 'function') ? stdDepartures(c) : [];
  return vs.map(v => {
    const missing = v.status === 'missing', cat = String(v.category || ''), pos = String(v.position || '');
    return { by: 'std', status: v.escalate ? 'need' : 'look', missing, clause: '', region: 0, links: [],
      title: i18t(missing ? 'stk_std_miss_t' : 'stk_std_dev_t', { cat }),
      stake: missing ? i18t('stk_std_miss', { cat }) : (pos ? i18t('stk_std_dev_pos', { cat, pos }) : i18t('stk_std_dev', { cat })),
      theirs: missing ? '' : String(v.quote || ''), usual: pos, ask: String(v.redline || ''), quote: missing ? '' : String(v.quote || '') };
  });
}
/* A POINT'S SECTION (owner, 13 Oct 2026: "the Region which we should call
   Section"): the one Jambo named, else the section that holds its clause —
   read off the reading's own section lists, the clause's number or, for a
   standard, the row whose wording holds its quote */
function stkSectionOf(b, p){
  if (Number(p.region) >= 1 && (b.regions || [])[p.region - 1]) return Number(p.region);
  let n = p.by === 'std' ? '' : stkNum(p.clause);
  if (!n && p.by === 'std' && p.quote && _stk.rows && _stk.nums){ const at = stkRowForQuote(p.quote, _stk.rows); if (at >= 0) n = _stk.nums[at] || ''; }
  if (!n) return 0;
  const regs = b.regions || [];
  for (let k = n; k; k = k.includes('.') ? k.slice(0, k.lastIndexOf('.')) : ''){
    const ri = regs.findIndex(r => (r.items || []).some(it => stkNum(it.ref) === k));
    if (ri >= 0) return ri + 1;
  }
  return 0;
}
/* ---- EVERY COLOURED DOT EXPLAINS ITSELF (owner, 13 Oct 2026: "we have some
   worth a look but they have no explanation"; then "Yes, build it") ----
   A clause's dot also wears the marks the paper's other readings put on it
   — the risk scan's findings, the brief's watch-outs and its unusual terms
   (docXrayMarks, the same reading that colours the dot) — and those used to
   have nothing behind them on Home. Each is now a POINT under its clause, in
   the same shaded box, counted, filtered ("Found by": Risk scan · Brief) and
   walked by the deep dive. Placed on the row the mark was found on, so a mark
   that lands nowhere is never guessed onto a clause. A standards mark is the
   standards point already there, never said twice. Nothing is run here. */
const STK_MARK_BY = { scan: 'scan', brief: 'brief', odd: 'brief', pb: 'std' };
const STK_GRADE_SEV = { ruby: 'need', amber: 'look', steel: 'note' };
function stkMarkPoints(stdRows){
  const out = [];
  (_stk.rows || []).forEach((x, at) => {
    if (!x || !Array.isArray(x.marks) || (typeof docThreadIsSec === 'function' && docThreadIsSec(x))) return;
    x.marks.forEach(m => {
      if (!m || !STK_MARK_BY[m.k]) return;
      if (m.k === 'pb' && stdRows.has(at)) return;
      const lead = String(m.lead || '').trim(), say = String(m.say || '').trim(), why = String(m.why || '').trim();
      out.push({ by: STK_MARK_BY[m.k], status: STK_GRADE_SEV[m.grade] || 'look', missing: false, region: 0, links: [],
        clause: (_stk.nums || [])[at] || '', _at: at, title: lead || say || why, stake: [lead && say ? say : '', why].filter(Boolean).join(' ') || lead || say,
        what: why, theirs: '', usual: '', ask: '', quote: '' });
    });
  });
  return out;
}
/* every point, Jambo's first; the list the filters read */
function stkAll(c, b){
  if (!b) return [];
  const std = stkStdPoints(c);
  const stdRows = new Set(std.map(p => p.quote && _stk.rows ? stkRowForQuote(p.quote, _stk.rows) : -1).filter(at => at >= 0));
  return b.points.map((p, i) => Object.assign({}, p, { by: 'jambo', _i: i })).concat(std, stkMarkPoints(stdRows))
    .map(p => Object.assign(p, { region: stkSectionOf(b, p) }));
}
const stkKeep = (p, f) => (!f.reg || String(p.region || 0) === f.reg) && (!f.sev || p.status === f.sev) && (!f.by || p.by === f.by);
const stkFiltering = () => !!(_stk.f.reg || _stk.f.sev || _stk.f.by);
/* what is on screen: the points the filters keep — the deep dive walks these */
function stkShown(c, b){ return stkAll(c, b).filter(p => stkKeep(p, _stk.f)); }
/* A CHOICE THAT GIVES NOTHING IS NOT LISTED (the owner's rule): each box offers
   only what this contract's points hold */
function stkFiltersHtml(b, all){
  const box = (k, label, opts) => `<label class="stk-flt"><span>${_bdE(i18t(label))}</span><select data-stk-f="${k}"><option value="">${_bdE(i18t('stk_f_all'))}</option>${opts.map(o => `<option value="${_bdE(o.v)}"${_stk.f[k] === o.v ? ' selected' : ''}>${_bdE(o.t)}</option>`).join('')}</select></label>`;
  const regs = [...new Set(all.map(p => Number(p.region) || 0).filter(r => r > 0 && (b.regions || [])[r - 1]))].sort((x, y) => x - y)
    .map(r => ({ v: String(r), t: b.regions[r - 1].name }));
  const sevs = STK_SEVS.filter(v => all.some(p => p.status === v)).map(v => ({ v, t: i18t('bd_st_' + v) }));
  const bys = STK_BY.filter(v => all.some(p => p.by === v)).map(v => ({ v, t: i18t('stk_by_' + v) }));
  return `<div class="stk-flts">${box('reg', 'stk_f_region', regs)}${box('sev', 'stk_f_sev', sevs)}${box('by', 'stk_f_by', bys)}</div>`;
}
/* OPENING CLAUSES IS THE PRESS: read once a sitting per wording; a refusal
   is said and waits for Try again (the latch is raised before the read) */
function stkAutoRun(c){
  if (!c || _bd.busy || !stkOwed(c)) return;
  if (!(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured)) return;
  const k = stkKey(c); if (_bd.tried[k]) return;
  _bd.tried[k] = true;
  setTimeout(() => stkRun(c), 0);
}
function stkHeadHtml(c, b){
  const busy = _bd.busy && _bd.runFor === c.id;
  const err = _bd.err && _bd.runFor === c.id ? _bd.err : '';
  if (!b){
    const noKey = !(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured);
    const view = `<div class="stk-view"><b>${_bdE(i18t('stk_view'))}</b></div>`;
    if (busy || (!err && !noKey && !_bd.tried[stkKey(c)])) return `<div class="stk-head is-empty">${view}<div class="stk-acts"><span class="stk-busy" role="status" aria-live="polite">${bdBusyHtml()}</span><span class="stk-cost">${_bdE(i18t('bd_cost'))}</span></div></div>`;
    const why = err || (noKey ? i18t('bd_no_key') : i18t('stk_read_sub'));
    return `<div class="stk-head is-empty">${view}<p class="${err ? 'stk-err' : 'stk-sub'}" role="${err ? 'alert' : 'status'}">${_bdE(why)}</p>${noKey ? '' : `<div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm" data-stk-run>${_bdE(i18t('stk_again'))}</button><span class="stk-cost">${_bdE(i18t('bd_cost'))}</span></div>`}</div>`;
  }
  /* AS DRAWN (owner, 13 Oct 2026): the title line and the three filters — the
     summary, the colour ribbon and its key are gone */
  const all = stkAll(c, b), pts = all.filter(p => stkKeep(p, _stk.f)), need = pts.filter(p => p.status === 'need').length;
  return `<div class="stk-head">
    <div class="stk-view"><b>${_bdE(i18t('stk_view'))}</b><span>${_bdE(i18tn('stk_points', pts.length, { n: pts.length }))}${need ? ' · ' + _bdE(i18t('stk_need_n', { n: need })) : ''}</span>${busy ? `<span class="stk-busy" role="status">${bdBusyHtml()}</span>` : ''}</div>
    ${all.length ? stkFiltersHtml(b, all) : `<p class="stk-sub">${_bdE(i18t('stk_none'))}</p>`}
    ${b.truncated ? `<p class="stk-sub">${_bdE(i18t('stk_cut'))}</p>` : ''}
    ${err ? `<p class="stk-err" role="alert">${_bdE(err)}</p>` : ''}</div>`;
}
const stkDiveBtn = i => `<button type="button" class="stk-go" data-stk-dive="${i}">${_bdE(i18t('stk_deep'))} ›</button>`;
const stkLineHtml = (p, i) => `<div class="stk-line is-${p.status}${stkTone(p)}"><span class="stk-st">${_bdE(p.stake)}</span>${stkDiveBtn(i)}</div>`;
/* the row a standard's finding sits on: the row whose wording holds its quote */
function stkRowForQuote(q, rows){
  const n = _stkNorm(q).slice(0, 80); if (n.length < 12) return -1;
  return (rows || []).findIndex(x => x && x.row && _stkNorm((x.row.heading || '') + ' ' + (x.row.text || '')).includes(n));
}
const stkAt = (p, nums, rows) => p.missing ? -1 : (p._at != null ? p._at : p.by === 'std' ? stkRowForQuote(p.quote, rows) : stkRowFor(p, nums));
/* painted after the list's own paint, on Home only */
function stkDecorate(c, card, rows){
  if (!c || !card) return;
  if (_stk.id !== String(c.id)){ _stk.id = String(c.id); _stk.dive = -1; _stk.f = { reg: '', sev: '', by: '' }; _stk.mOpen = ''; }
  const b = stkOf(c);
  _stk.rows = rows || null;
  _stk.nums = (rows || []).map(x => (typeof docThreadIsSec === 'function' && docThreadIsSec(x)) ? '' : stkNum(typeof docXrayLabel === 'function' ? docXrayLabel(x) : ''));
  const shown = stkShown(c, b);
  if (_stk.dive >= 0 && !shown[_stk.dive]) _stk.dive = -1;
  if (!b) stkAutoRun(c);
  let head = card.querySelector('.stk-head-slot');
  const top = card.querySelector('.doc-th-top');
  if (!head && top){ head = document.createElement('div'); head.className = 'stk-head-slot'; top.after(head); }
  if (head) head.innerHTML = stkHeadHtml(c, b);
  card.querySelectorAll('.stk-line, .stk-miss, .stk-rsq, .stk-nomatch').forEach(el => el.remove());
  card.querySelectorAll('.stk-hide').forEach(el => el.classList.remove('stk-hide'));
  card.querySelectorAll('.stk-b-need, .stk-b-look, .stk-b-note').forEach(el => el.classList.remove('stk-b-need', 'stk-b-look', 'stk-b-note'));
  const list = card.querySelector('.doc-th-rows');
  /* THE OLDER MARKS' TONE STAYS: every mark that colours a dot is now a
     point under its clause (stkMarkPoints), so the dot explains itself */
  if (b && list){
    const nums = _stk.nums;
    /* each row says how many of the points on screen stand on it. NO SECTION
       SQUARE after the name (owner, 13 Oct 2026: "remove these green dots as no
       one knows what they are for"; `.stk-rsq` STALE) — the Section filter
       says which section a point is in */
    const onRow = {}, worstOn = {};
    shown.forEach(p => { const at = stkAt(p, nums, rows); if (at < 0) return;
      onRow[at] = (onRow[at] || 0) + 1;
      const rank = { need: 3, look: 2, note: 1 };
      if ((rank[p.status] || 0) > (rank[worstOn[at]] || 0)) worstOn[at] = p.status; });
    /* THE DOT WEARS ITS CLAUSE'S WORST POINT (owner, 13 Oct 2026): red when a
       point needs you, amber when the worst is worth a look — the older marks'
       tone stays where it is worse; the paper's own track is not touched */
    Object.keys(worstOn).forEach(at => { const r = list.querySelector(`[data-th-row="${at}"]`); if (r) r.classList.add('stk-b-' + worstOn[at]); });
    nums.forEach((n, at) => {
      const row = list.querySelector(`[data-th-row="${at}"]`); if (!row || !n) return;
      const st = row.querySelector('[data-th-state]');
      /* the row's count is its points; its Plain English state (Reading… · Read) stays the list's own */
      if (st){
        st.querySelectorAll('.is-ruby, .is-amber, .is-steel, .stk-n').forEach(el => el.remove());
        if (onRow[at]) st.insertAdjacentHTML('afterbegin', `<span class="stk-n">${_bdE(i18tn('stk_review', onRow[at], { n: onRow[at] }))}</span>`);
      }
    });
    const miss = [], other = [];
    shown.forEach((p, i) => {
      if (p.missing){ miss.push(i); return; }
      const at = stkAt(p, nums, rows);
      const row = at >= 0 ? list.querySelector(`[data-th-row="${at}"] .doc-th-head`) : null;
      if (row) row.insertAdjacentHTML('afterend', stkLineHtml(p, i)); else other.push(i);
    });
    /* A FILTER NARROWS THE LIST: a row with nothing the filters keep steps
       aside, AN OPEN ONE TOO (owner, 13 Oct 2026: an open clause stayed in a
       "Worth a look" list with nothing worth a look under it); the paper's
       track is untouched */
    if (stkFiltering()){
      list.querySelectorAll('.doc-th-row, .doc-th-sec').forEach(el => {
        if (el.classList.contains('doc-th-row') && onRow[Number(el.getAttribute('data-th-row'))]) return;
        el.classList.add('stk-hide');
      });
      if (!shown.length) list.insertAdjacentHTML('beforeend', `<p class="stk-nomatch" role="status">${_bdE(i18t('stk_f_none'))}</p>`);
    }
    /* a point about a clause the list does not show is never dropped, and never
       called missing: it stands under its own heading with its clause named */
    const group = (key, ids, dashed) => ids.length ? `<div class="stk-miss" role="listitem"><div class="stk-miss-h">${_bdE(i18t(key, { n: ids.length }))}</div>${ids.map(i => {
      const p = shown[i];
      /* its box opens on a press of its title, like a clause's (owner, 13 Oct 2026) */
      const key = (dashed ? 'm:' : 'o:') + p.title, on = _stk.mOpen === key;
      return `<div class="stk-miss-row${on ? ' is-open' : ''}"><span class="stk-miss-bead${dashed ? '' : ' is-other'}" aria-hidden="true"></span><div><button type="button" class="stk-miss-t" data-stk-mopen="${_bdE(key)}" aria-expanded="${on ? 'true' : 'false'}">${p.clause && !dashed ? _bdE(p.clause) + ' · ' : ''}${_bdE(p.title)}</button>${stkLineHtml(p, i)}</div></div>`; }).join('')}</div>` : '';
    list.insertAdjacentHTML('beforeend', group('stk_other_h', other, false) + group('stk_missing_h', miss, true));
  }
  stkDivePaint(c, card);
}
/* TWO STEPS (owner, 13 Oct 2026): the list read leaves a point's deep dive
   for its own small read, asked on the press of Deep dive and kept on the
   reading (`_dove`). A reading made before carries its dive already. */
const stkDiveOwed = p => !!p && p.by === 'jambo' && !p._dove && !(p.what || p.usual || p.ask || (p.edge || []).length);
const stkDiveKey = (c, p) => String(c && c.id) + ':' + (bdOf(c) || {}).hash + ':' + (p && p._i);
async function stkDiveFetch(c, p){
  if (!c || !p || !stkDiveOwed(p)) return;
  const k = stkDiveKey(c, p);
  if (_stk.diveBusy[k]) return;
  if (!(typeof API_MODE === 'function' && API_MODE() && state.aiConfigured)){ _stk.diveErr[k] = i18t('bd_no_key'); return; }
  _stk.diveBusy[k] = true; delete _stk.diveErr[k];
  try {
    const live = (typeof getContract === 'function' && getContract(c.id)) || c;
    const r = await api('ai/breakdown/point', 'POST', { text: bdText(live), point: { title: p.title, clause: p.clause, stake: p.stake, quote: p.quote, missing: !!p.missing, after: p.after || '' } }, { quiet: true });
    if (!r || r.error) throw new Error((r && r.error) || i18t('bd_failed'));
    const b = live.breakdown, at = b && Array.isArray(b.points) ? b.points[p._i] : null;
    if (at && b.hash === (bdOf(c) || {}).hash){
      ['what', 'theirs', 'usual', 'figure', 'how', 'push', 'ask'].forEach(f => { at[f] = String(r[f] || ''); });
      at.edge = Array.isArray(r.edge) ? r.edge : []; at.trade = Array.isArray(r.trade) ? r.trade : []; at._dove = true;
      if (typeof persist === 'function') persist(live);
    }
  } catch (e){ _stk.diveErr[k] = (e && e.message) || i18t('bd_failed'); }
  delete _stk.diveBusy[k];
  const cur = stkContract();
  if (cur && String(cur.id) === String(c.id) && _stk.dive >= 0) stkDivePaint(cur);
}
function stkDiveHtml(c, b, i){
  const shown = stkShown(c, b), p = shown[i], n = shown.length;
  const where = p.by === 'std'
    ? (p.quote ? `<button type="button" class="stk-lnk" data-stk-show="${i}">${_bdE(i18t('stk_show_paper'))}</button>` : `<span class="stk-src">${_bdE(i18t('stk_missing_any'))}</span>`)
    : p.missing || !p.clause
    ? `<span class="stk-src">${_bdE(p.after ? i18t('stk_missing_at', { n: p.after }) : i18t('stk_missing_any'))}</span>`
    : `<button type="button" class="stk-lnk" data-stk-show="${i}">${_bdE(i18t('stk_clause', { n: p.clause }))}</button>`;
  const sec = (h, body) => body ? `<section class="stk-sec"><h4>${_bdE(i18t(h))}</h4>${body}</section>` : '';
  const vs = p.theirs || p.usual ? `<table class="stk-vs"><tr class="is-theirs"><td>${_bdE(i18t('stk_this'))}</td><td>${_bdE(p.theirs || '—')}</td></tr><tr class="is-usual"><td>${_bdE(i18t('stk_usual'))}</td><td>${_bdE(p.usual || '—')}</td></tr></table>` : '';
  /* a "figure" with no number in it is a sentence (an older read kept one): no figure, its words go to how */
  const fig = /\d/.test(String(p.figure || '')) ? String(p.figure) : '', how = [fig ? '' : String(p.figure || ''), String(p.how || '')].filter(Boolean).join(' ');
  const cost = `<div class="stk-fig${fig ? '' : ' is-none'}">${_bdE(fig || i18t('stk_no_figure'))}</div>${how ? `<p class="stk-how">${_bdE(how)}</p>` : ''}`;
  /* a link names Jambo's point by its place in his read; it opens where that point stands on screen */
  const links = (p.links || []).map(k => shown.findIndex(q => q.by === 'jambo' && q._i === k - 1)).filter(at => at >= 0 && at !== i);
  return `<div class="stk-dv${stkTone(p)}">
    <div class="stk-dv-top"><button type="button" class="ui-btn ui-btn-sm" data-stk-back>‹ ${_bdE(i18t('stk_back'))}</button>
      <span class="stk-pg">${_bdE(i18t('stk_of', { k: i + 1, n }))}
        <button type="button" class="ui-btn ui-btn-icon ui-btn-sm" data-stk-dive="${i - 1}"${i > 0 ? '' : ' disabled'} aria-label="${_bdE(i18t('stk_prev'))}" title="${_bdE(i18t('stk_prev'))}">‹</button>
        <button type="button" class="ui-btn ui-btn-icon ui-btn-sm" data-stk-dive="${i + 1}"${i < n - 1 ? '' : ' disabled'} aria-label="${_bdE(i18t('stk_next'))}" title="${_bdE(i18t('stk_next'))}">›</button></span></div>
    <div class="stk-dv-scroll scroll-thin">
    <div class="stk-dv-head"><div class="stk-meta">${bdChip(p.status)}</div>
      <h3>${_bdE(p.title)}</h3><div class="stk-meta">${where}</div></div>
    <div class="stk-dv-body">
      ${stkDiveOwed(p) ? (_stk.diveErr[stkDiveKey(c, p)]
        ? `<p class="stk-err" role="alert">${_bdE(_stk.diveErr[stkDiveKey(c, p)])}</p><div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm" data-stk-dive-again="${i}">${_bdE(i18t('stk_again'))}</button><span class="stk-cost">${_bdE(i18t('stk_dive_cost'))}</span></div>`
        : `<div class="stk-acts"><span class="stk-busy" role="status" aria-live="polite">${window.busyHtml ? busyHtml(i18t('stk_dive_reading')) : _bdE(i18t('stk_dive_reading'))}</span><span class="stk-cost">${_bdE(i18t('stk_dive_cost'))}</span></div>`) : ''}
      ${sec('stk_h_what', p.what ? `<p>${_bdE(p.what)}</p>` : '')}
      ${p.by !== 'jambo' || stkDiveOwed(p) ? '' : sec('stk_h_cost', cost)}
      ${sec('stk_h_vs', vs)}
      ${sec('stk_h_push', p.push ? `<p class="stk-push">${_bdE(p.push)}</p>` : '')}
      ${sec('stk_h_edge', (p.edge || []).length ? `<ul class="stk-edge">${p.edge.map(e => `<li>${_bdE(e)}</li>`).join('')}</ul>` : '')}
      ${sec('stk_h_trade', (p.trade || []).length ? `<div class="stk-trade">${p.trade.map(t => `<div><span><em>${_bdE(i18t('stk_give'))}</em>${_bdE(t.give)}</span><span class="stk-arw" aria-hidden="true">→</span><span><em>${_bdE(i18t('stk_get'))}</em>${_bdE(t.get)}</span></div>`).join('')}</div>` : '')}
      ${p.ask ? `<div class="stk-ask"><span>${_bdE(i18t('stk_ask'))}</span><p>${_bdE(p.ask)}</p></div>` : ''}
      ${sec('stk_h_links', links.length ? `<div class="stk-links">${links.map(at => `<button type="button" data-stk-dive="${at}">${_bdE(shown[at].title)}</button>`).join('')}</div>` : '')}
      <div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-stk-redline>${_bdE(i18t('stk_redline'))}</button>
        <button type="button" class="ui-btn ui-btn-sm" data-stk-ask="${i}">${_bdE(i18t('stk_ask_jambo'))}</button></div>
    </div></div></div>`;
}
function stkDivePaint(c, card){
  card = card || document.getElementById('pd-thread'); if (!card) return;
  const b = stkOf(c);
  let dv = card.querySelector('.stk-dive');
  const on = !!(b && _stk.dive >= 0 && stkShown(c, b)[_stk.dive]);
  card.classList.toggle('is-stk-dive', on);
  if (!on){ if (dv) dv.remove(); return; }
  if (!dv){ dv = document.createElement('div'); dv.className = 'stk-dive'; card.appendChild(dv); }
  dv.innerHTML = stkDiveHtml(c, b, _stk.dive);
}
/* ---- "START REDLINING WITH THIS ASK" LANDS ON ITS CLAUSE (owner, 13 Oct
   2026: it opened Negotiate at the top of the paper, on another clause's
   card, with no way back) ----
   Through Negotiate's one door, carrying the point's clause and its ask:
   Negotiate opens that clause in Edit with Jambo, the ask ready to use and
   nothing filed or sent until a person presses. It remembers where the
   reader came from — this contract's deep dive, its point and its filters —
   so "‹ Back to clauses" returns to the same point (stkResume). */
function stkRedlineGo(c, opts){
  const b = stkOf(c), p = b && _stk.dive >= 0 ? stkShown(c, b)[_stk.dive] : null;
  let clauseId = '';
  if (p && !p.missing && _stk.rows){
    const at = stkAt(p, _stk.nums || [], _stk.rows), x = at >= 0 ? _stk.rows[at] : null;
    if (x && typeof docXrayClauseId === 'function') clauseId = docXrayClauseId(x) || '';
  }
  if (typeof rlCameFromSet === 'function') rlCameFromSet({ id: String(c.id), dive: _stk.dive, f: { ..._stk.f } });
  if (typeof openRedlineWorkbench !== 'function') return;
  const q = opts && opts.question ? String(opts.question) : '';
  openRedlineWorkbench(c.id, { from: 'clauses', land: p && !p.missing ? { clauseId, quote: String(p.quote || ''), num: stkNum(p.clause), ask: q ? '' : String(p.ask || ''), question: q } : null });
}
/* the way back puts the deep dive where the reader left it */
function stkResume(f){
  if (!f || !f.id) return;
  _stk.id = String(f.id); _stk.dive = Number.isInteger(f.dive) ? f.dive : -1;
  _stk.f = { reg: '', sev: '', by: '', ...(f.f || {}) }; _stk.mOpen = '';
}
function stkContract(){ return _stk.id && typeof getContract === 'function' ? getContract(_stk.id) : null; }
/* light a point's words on the paper; a point with no words goes to its clause */
function stkShow(c, p, i){
  if (!c || !p) return;
  if (p.quote && typeof igQuoteGo === 'function'){ igQuoteGo(p.quote); return; }
  const card = document.getElementById('pd-thread');
  const b = stkOf(c); if (!b || !card) return;
  const at = [...card.querySelectorAll('.doc-th-row')].findIndex(el => el.querySelector(`[data-stk-dive="${i}"]`));
  const row = at >= 0 ? card.querySelectorAll('.doc-th-row')[at] : null;
  if (row && typeof docThreadGoTo === 'function') docThreadGoTo(typeof docThreadCur === 'function' ? docThreadCur(c) : c, Number(row.getAttribute('data-th-row')));
}
function stkRepaint(c){
  if (typeof docThreadPaint === 'function') try { docThreadPaint(c); } catch (_){}
}
async function stkRun(c){
  if (!c || _bd.busy) return;
  _bd.runFor = c.id;
  const p = bdRun(c);
  stkRepaint(c);
  await p;
  stkRepaint((typeof getContract === 'function' && getContract(c.id)) || c);
}
function stkDiveOpen(c, i){
  const b = stkOf(c), shown = stkShown(c, b); if (!b || !shown[i]) return;
  _stk.dive = i;
  stkDivePaint(c);
  const dv = document.querySelector('#pd-thread .stk-dv-scroll'); if (dv) dv.scrollTop = 0;
  stkShow(c, shown[i], i);
  if (stkDiveOwed(shown[i])) stkDiveFetch(c, shown[i]);
}
function stkDiveClose(c){
  _stk.dive = -1; stkDivePaint(c);
}
if (typeof document !== 'undefined' && !document._stkWired){
  document._stkWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#pd-thread')) return;
    const c = stkContract(); if (!c) return;
    if (t.closest('[data-stk-run]')){ stkRun(c); return; }
    const da = t.closest('[data-stk-dive-again]');
    if (da){ const b0 = stkOf(c), p = b0 ? stkShown(c, b0)[Number(da.getAttribute('data-stk-dive-again'))] : null;
      if (p){ delete _stk.diveErr[stkDiveKey(c, p)]; stkDivePaint(c); stkDiveFetch(c, p); } return; }
    const mo = t.closest('[data-stk-mopen]');
    if (mo){ const k = mo.getAttribute('data-stk-mopen'); _stk.mOpen = _stk.mOpen === k ? '' : k;
      document.querySelectorAll('#pd-thread [data-stk-mopen]').forEach(b => { const on = b.getAttribute('data-stk-mopen') === _stk.mOpen;
        b.setAttribute('aria-expanded', on ? 'true' : 'false'); const r = b.closest('.stk-miss-row'); if (r) r.classList.toggle('is-open', on); });
      return; }
    const dv = t.closest('[data-stk-dive]');
    if (dv){ e.stopPropagation(); if (dv.disabled) return; stkDiveOpen(c, Number(dv.getAttribute('data-stk-dive'))); return; }
    if (t.closest('[data-stk-back]')){ stkDiveClose(c); return; }
    const b = stkOf(c);
    const sh = t.closest('[data-stk-show]');
    if (sh && b){ const k = Number(sh.getAttribute('data-stk-show')); stkShow(c, stkShown(c, b)[k], k); return; }
    if (t.closest('[data-stk-redline]')){ stkRedlineGo(c); return; }
    const ak = t.closest('[data-stk-ask]');
    if (ak && b){ const p = stkShown(c, b)[Number(ak.getAttribute('data-stk-ask'))];
      /* A WHOLE QUESTION, NOT A STUB (owner, 13 Oct 2026: "the question posed is
         terribly framed"): the clause by number, the point in plain words with
         no quote marks (Jambo read a quoted title as a finding to look up), and
         what we want back. The reader presses Ask, or edits it first. */
      if (p){
        const t = String(p.title || '').trim().replace(/[.\s]+$/, ''), n = stkNum(p.clause);
        const q = p.missing ? i18t('stk_ask_q_missing', { t }) : n ? i18t('stk_ask_q', { n, t }) : i18t('stk_ask_q_none', { t });
        /* TO JAMBO IN THE EDIT ROOM (owner, 13 Oct 2026: "ask jambo is supposed
           to take me to the jambo in the redline editing page"): the clause
           opens in Edit with Jambo, the question waiting in his ask box,
           unsent — he knows the contract and the clause there. A point about
           nothing in the contract, or a window too narrow for the editor,
           asks on Home as before. */
        const fits = typeof clauseEditorFits === 'function' && clauseEditorFits();
        if (!p.missing && fits) stkRedlineGo(c, { question: q });
        else if (typeof intelAskReady === 'function') intelAskReady(q);
      } }
  }, true);
  /* a filter's change repaints the list, and the box keeps the keyboard */
  document.addEventListener('change', e => {
    const sel = e.target && e.target.closest ? e.target.closest('#pd-thread [data-stk-f]') : null; if (!sel) return;
    const c = stkContract(); if (!c) return;
    const k = sel.getAttribute('data-stk-f');
    if (!(k in _stk.f)) return;
    _stk.f[k] = String(sel.value || '');
    _stk.dive = -1;
    stkRepaint(c);
    const again = document.querySelector(`#pd-thread [data-stk-f="${k}"]`); if (again) fieldFocus(again);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || _stk.dive < 0) return;
    const card = document.getElementById('pd-thread'); if (!card || !card.classList.contains('is-stk-dive')) return;
    const c = stkContract(); if (c){ e.preventDefault(); stkDiveClose(c); }
  });
}

Object.assign(window, { stkRedlineGo, stkResume, stkDecorate, stkOf, stkRun, stkDiveOpen, stkDiveClose, bdOf, bdStale, bdRun });
