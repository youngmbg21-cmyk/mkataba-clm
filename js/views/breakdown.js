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
const _stk = { id: null, dive: -1 };
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
    return `<div class="stk-head is-empty">${view}<p class="${err || noKey ? 'stk-err' : 'stk-sub'}" role="${err ? 'alert' : 'status'}">${_bdE(why)}</p>${noKey ? '' : `<div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm" data-stk-run>${_bdE(i18t('stk_again'))}</button><span class="stk-cost">${_bdE(i18t('bd_cost'))}</span></div>`}</div>`;
  }
  const pts = b.points, need = pts.filter(p => p.status === 'need').length;
  const regs = b.regions || [];
  const total = regs.reduce((n, r) => n + Math.max(1, (r.items || []).length), 0) || 1;
  const ribbon = regs.length ? `<div class="stk-ribbon" aria-hidden="true">${regs.map((r, i) => `<i class="stk-r${(i % STK_REGION_TONES) + 1}" style="flex:${Math.max(1, (r.items || []).length) / total}"></i>`).join('')}</div>
    <div class="stk-legend">${regs.map((r, i) => `<span class="stk-r${(i % STK_REGION_TONES) + 1}"><i></i>${_bdE(r.name)}</span>`).join('')}</div>` : '';
  return `<div class="stk-head">
    <div class="stk-view"><b>${_bdE(i18t('stk_view'))}</b><span>${_bdE(i18tn('stk_points', pts.length, { n: pts.length }))}${need ? ' · ' + _bdE(i18t('stk_need_n', { n: need })) : ''}</span>${busy ? `<span class="stk-busy" role="status">${bdBusyHtml()}</span>` : ''}</div>
    ${b.head || b.sub ? `<p class="stk-sum">${b.head ? `<b>${_bdE(b.head)}.</b> ` : ''}${_bdE(b.sub || '')}</p>` : ''}
    ${pts.length ? '' : `<p class="stk-sub">${_bdE(i18t('stk_none'))}</p>`}
    ${b.truncated ? `<p class="stk-sub">${_bdE(i18t('stk_cut'))}</p>` : ''}
    ${ribbon}${err ? `<p class="stk-err" role="alert">${_bdE(err)}</p>` : ''}</div>`;
}
const stkDiveBtn = i => `<button type="button" class="stk-go" data-stk-dive="${i}">${_bdE(i18t('stk_deep'))} ›</button>`;
const stkLineHtml = (p, i) => `<div class="stk-line is-${p.status}${stkTone(p)}"><span class="stk-st">${_bdE(p.stake)}</span>${stkDiveBtn(i)}</div>`;
/* painted after the list's own paint, on Home only */
function stkDecorate(c, card, rows){
  if (!c || !card) return;
  if (_stk.id !== String(c.id)){ _stk.id = String(c.id); _stk.dive = -1; }
  const b = stkOf(c);
  if (_stk.dive >= 0 && !(b && b.points[_stk.dive])) _stk.dive = -1;
  if (!b) stkAutoRun(c);
  let head = card.querySelector('.stk-head-slot');
  const top = card.querySelector('.doc-th-top');
  if (!head && top){ head = document.createElement('div'); head.className = 'stk-head-slot'; top.after(head); }
  if (head) head.innerHTML = stkHeadHtml(c, b);
  card.querySelectorAll('.stk-line, .stk-miss, .stk-rsq').forEach(el => el.remove());
  const list = card.querySelector('.doc-th-rows');
  if (b && list){
    const nums = (rows || []).map(x => (typeof docThreadIsSec === 'function' && docThreadIsSec(x)) ? '' : stkNum(typeof docXrayLabel === 'function' ? docXrayLabel(x) : ''));
    /* AS DRAWN: each row wears its region's colour after its name, and says how
       many points stand on it ("1 to review"); a row with none says nothing */
    const regOf = {};
    (b.regions || []).forEach((r, ri) => (r.items || []).forEach(it => { const n = stkNum(it.ref); if (n && !(n in regOf)) regOf[n] = ri; }));
    const onRow = {};
    b.points.forEach(p => { if (!p.missing){ const at = stkRowFor(p, nums); if (at >= 0) onRow[at] = (onRow[at] || 0) + 1; } });
    nums.forEach((n, at) => {
      const row = list.querySelector(`[data-th-row="${at}"]`); if (!row || !n) return;
      let ri = regOf[n];
      for (let k = n; ri == null && k.includes('.'); ){ k = k.slice(0, k.lastIndexOf('.')); ri = regOf[k]; }
      if (ri == null){ const pt = b.points.find(p => !p.missing && stkRowFor(p, nums) === at); if (pt && pt.region) ri = pt.region - 1; }
      const name = row.querySelector('.doc-th-name');
      if (name && ri != null && b.regions[ri]) name.insertAdjacentHTML('beforeend', `<span class="stk-rsq stk-r${(ri % STK_REGION_TONES) + 1}" title="${_bdE(b.regions[ri].name)}" aria-label="${_bdE(b.regions[ri].name)}"></span>`);
      const st = row.querySelector('[data-th-state]');
      if (st) st.innerHTML = onRow[at] ? `<span class="stk-n">${_bdE(i18tn('stk_review', onRow[at], { n: onRow[at] }))}</span>` : '';
    });
    const miss = [], other = [];
    b.points.forEach((p, i) => {
      if (p.missing){ miss.push(i); return; }
      const at = stkRowFor(p, nums);
      const row = at >= 0 ? list.querySelector(`[data-th-row="${at}"] .doc-th-head`) : null;
      if (row) row.insertAdjacentHTML('afterend', stkLineHtml(p, i)); else other.push(i);
    });
    /* a point about a clause the list does not show is never dropped, and never
       called missing: it stands under its own heading with its clause named */
    const group = (key, ids, dashed) => ids.length ? `<div class="stk-miss" role="listitem"><div class="stk-miss-h">${_bdE(i18t(key, { n: ids.length }))}</div>${ids.map(i => {
      const p = b.points[i];
      return `<div class="stk-miss-row"><span class="stk-miss-bead${dashed ? '' : ' is-other'}" aria-hidden="true"></span><div><div class="stk-miss-t">${p.clause && !dashed ? _bdE(p.clause) + ' · ' : ''}${_bdE(p.title)}</div>${stkLineHtml(p, i)}</div></div>`; }).join('')}</div>` : '';
    list.insertAdjacentHTML('beforeend', group('stk_other_h', other, false) + group('stk_missing_h', miss, true));
  }
  stkDivePaint(c, card);
}
function stkDiveHtml(c, b, i){
  const p = b.points[i], n = b.points.length;
  const r = p.region ? (b.regions || [])[p.region - 1] : null;
  const where = p.missing || !p.clause
    ? `<span class="stk-src">${_bdE(p.after ? i18t('stk_missing_at', { n: p.after }) : i18t('stk_missing_any'))}</span>`
    : `<button type="button" class="stk-lnk" data-stk-show="${i}">${_bdE(i18t('stk_clause', { n: p.clause }))}</button>`;
  const sec = (h, body) => body ? `<section class="stk-sec"><h4>${_bdE(i18t(h))}</h4>${body}</section>` : '';
  const vs = p.theirs || p.usual ? `<table class="stk-vs"><tr class="is-theirs"><td>${_bdE(i18t('stk_this'))}</td><td>${_bdE(p.theirs || '—')}</td></tr><tr class="is-usual"><td>${_bdE(i18t('stk_usual'))}</td><td>${_bdE(p.usual || '—')}</td></tr></table>` : '';
  const cost = `<div class="stk-fig${p.figure ? '' : ' is-none'}">${_bdE(p.figure || i18t('stk_no_figure'))}</div>${p.how ? `<p class="stk-how">${_bdE(p.how)}</p>` : ''}`;
  const links = (p.links || []).filter(k => k - 1 !== i && b.points[k - 1]);
  return `<div class="stk-dv${stkTone(p)}">
    <div class="stk-dv-top"><button type="button" class="ui-btn ui-btn-sm" data-stk-back>‹ ${_bdE(i18t('stk_back'))}</button>
      <span class="stk-pg">${_bdE(i18t('stk_of', { k: i + 1, n }))}
        <button type="button" class="ui-btn ui-btn-icon ui-btn-sm" data-stk-dive="${i - 1}"${i > 0 ? '' : ' disabled'} aria-label="${_bdE(i18t('stk_prev'))}" title="${_bdE(i18t('stk_prev'))}">‹</button>
        <button type="button" class="ui-btn ui-btn-icon ui-btn-sm" data-stk-dive="${i + 1}"${i < n - 1 ? '' : ' disabled'} aria-label="${_bdE(i18t('stk_next'))}" title="${_bdE(i18t('stk_next'))}">›</button></span></div>
    <div class="stk-dv-head"><div class="stk-meta">${bdChip(p.status)}${r ? `<span class="stk-reg"><i></i>${_bdE(r.name)}</span>` : ''}</div>
      <h3>${_bdE(p.title)}</h3><div class="stk-meta">${where}</div></div>
    <div class="stk-dv-body scroll-thin">
      ${sec('stk_h_what', p.what ? `<p>${_bdE(p.what)}</p>` : '')}
      ${sec('stk_h_cost', cost)}
      ${sec('stk_h_vs', vs)}
      ${sec('stk_h_push', p.push ? `<p class="stk-push">${_bdE(p.push)}</p>` : '')}
      ${sec('stk_h_edge', (p.edge || []).length ? `<ul class="stk-edge">${p.edge.map(e => `<li>${_bdE(e)}</li>`).join('')}</ul>` : '')}
      ${sec('stk_h_trade', (p.trade || []).length ? `<div class="stk-trade">${p.trade.map(t => `<div><span><em>${_bdE(i18t('stk_give'))}</em>${_bdE(t.give)}</span><span class="stk-arw" aria-hidden="true">→</span><span><em>${_bdE(i18t('stk_get'))}</em>${_bdE(t.get)}</span></div>`).join('')}</div>` : '')}
      ${p.ask ? `<div class="stk-ask"><span>${_bdE(i18t('stk_ask'))}</span><p>${_bdE(p.ask)}</p></div>` : ''}
      ${sec('stk_h_links', links.length ? `<div class="stk-links">${links.map(k => `<button type="button" data-stk-dive="${k - 1}">${_bdE(b.points[k - 1].title)}</button>`).join('')}</div>` : '')}
      <div class="stk-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-stk-redline>${_bdE(i18t('stk_redline'))}</button>
        <button type="button" class="ui-btn ui-btn-sm" data-stk-ask="${i}">${_bdE(i18t('stk_ask_jambo'))}</button></div>
    </div></div>`;
}
function stkDivePaint(c, card){
  card = card || document.getElementById('pd-thread'); if (!card) return;
  const b = stkOf(c);
  let dv = card.querySelector('.stk-dive');
  const on = !!(b && _stk.dive >= 0 && b.points[_stk.dive]);
  card.classList.toggle('is-stk-dive', on);
  if (!on){ if (dv) dv.remove(); return; }
  if (!dv){ dv = document.createElement('div'); dv.className = 'stk-dive'; card.appendChild(dv); }
  dv.innerHTML = stkDiveHtml(c, b, _stk.dive);
}
function stkContract(){ return _stk.id && typeof getContract === 'function' ? getContract(_stk.id) : null; }
/* light a point's words on the paper; a point with no words goes to its clause */
function stkShow(c, p){
  if (!c || !p) return;
  if (p.quote && typeof igQuoteGo === 'function'){ igQuoteGo(p.quote); return; }
  const card = document.getElementById('pd-thread');
  const b = stkOf(c); if (!b || !card) return;
  const at = [...card.querySelectorAll('.doc-th-row')].findIndex(el => el.querySelector(`[data-stk-dive="${b.points.indexOf(p)}"]`));
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
  const b = stkOf(c); if (!b || !b.points[i]) return;
  _stk.dive = i;
  stkDivePaint(c);
  const dv = document.querySelector('#pd-thread .stk-dv-body'); if (dv) dv.scrollTop = 0;
  stkShow(c, b.points[i]);
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
    const dv = t.closest('[data-stk-dive]');
    if (dv){ e.stopPropagation(); if (dv.disabled) return; stkDiveOpen(c, Number(dv.getAttribute('data-stk-dive'))); return; }
    if (t.closest('[data-stk-back]')){ stkDiveClose(c); return; }
    const b = stkOf(c);
    const sh = t.closest('[data-stk-show]');
    if (sh && b){ stkShow(c, b.points[Number(sh.getAttribute('data-stk-show'))]); return; }
    if (t.closest('[data-stk-redline]')){ if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(c.id); return; }
    const ak = t.closest('[data-stk-ask]');
    if (ak && b){ const p = b.points[Number(ak.getAttribute('data-stk-ask'))];
      if (p && typeof intelAskReady === 'function') intelAskReady(i18t('stk_ask_q', { t: p.title })); }
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || _stk.dive < 0) return;
    const card = document.getElementById('pd-thread'); if (!card || !card.classList.contains('is-stk-dive')) return;
    const c = stkContract(); if (c){ e.preventDefault(); stkDiveClose(c); }
  });
}

Object.assign(window, { stkDecorate, stkOf, stkRun, stkDiveOpen, stkDiveClose, bdOf, bdStale, bdRun });
