/* ============================================================
   HOME'S BREAKDOWN — SEE THE WHOLE CONTRACT, THEN ZOOM TO THE WORD
   (owner picked it, the SAP way, 11 Oct 2026; the design is the artifact
   "Home Paper Proposals", part 2)
   ============================================================
   A fifth face on Home, after Document: the contract the Document face holds
   (or one picked here, "Another contract" as on Document), cut by Copilot
   into at most ten REGIONS, every clause placed in one.

   TWO HALVES, ONE PANEL. The region list stands in Home's stage (#hb-bd, the
   Calendar's own cover); the zoom — whole deal → region → clause → words —
   stands in Home's ONE side panel while this face is up (renderIntelDock asks
   bdOnScreen, as it asks the Calendar), never a second panel beside it.

   COPILOT SPENDS ON A PRESS — AND CHOOSING THE CONTRACT IS THAT PRESS (owner,
   11 Oct 2026: "Choosing the contract should be the only press needed to
   break it down"). The picker says the cost; a contract held here with no
   reading of its present wording is read once (POST /api/ai/breakdown,
   `bdAutoRun`, latched per contract and wording for the sitting so a refusal
   is said, never retried in a loop), and the answer is kept on the contract
   against the wording's hash (c.breakdown) — read again only when the words
   change. No score: counts and facts. Nothing is filed or sent; a
   region's "Start redlining here" is Negotiate's own door, "Show on the paper"
   is the Document face's own quote pin, "Ask Copilot" is Home's one Copilot.
   ============================================================ */
const BD_RANK = { need: 0, look: 1, fine: 2 };
const BD_LEVELS = ['deal', 'region', 'clause', 'words'];
const _bd = { id: null, lvl: 'deal', ri: -1, ci: -1, busy: false, err: '', picking: false, q: '', tried: {} };
const _bdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* the face is up and its cover is drawn */
function bdOnScreen(){
  return !!(typeof state === 'object' && state && state.view === 'dashboard'
    && typeof hbFace === 'function' && hbFace() === 'breakdown' && document.getElementById('hb-bd'));
}
/* the contract this face reads: the one picked here, else the Document face's */
function bdContract(){
  const id = _bd.id || ((typeof intel === 'object' && intel && intel.paper) ? intel.paper.id : null);
  return id && typeof getContract === 'function' ? getContract(id) : null;
}
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
/* THE ONE READ: pressed, never on arrival; kept against the wording */
async function bdRun(c){
  if (!c || _bd.busy) return;
  _bd.busy = true; _bd.err = ''; bdPaint();
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
      dropped: Number(r.dropped) || 0, truncated: !!r.truncated };
    if (typeof persist === 'function') persist(live);
    _bd.lvl = 'deal'; _bd.ri = -1; _bd.ci = -1;
  } catch (e){
    _bd.err = (e && e.message) || i18t('bd_failed');
  }
  _bd.busy = false;
  bdPaint();
}
const bdRegions = b => (b.regions || []).map((r, i) => Object.assign({ n: i + 1, i }, r));
const bdByStatus = b => bdRegions(b).sort((x, y) => (BD_RANK[x.status] - BD_RANK[y.status]) || (x.n - y.n));
const bdFlagged = r => (r.items || []).filter(it => it.status !== 'fine').length;
const bdCount = (b, st) => (b.regions || []).filter(r => r.status === st).length;
function bdChip(st){
  const cls = st === 'need' ? 'is-need' : st === 'look' ? 'is-look' : 'is-fine';
  return `<span class="bd-chip ${cls}">${_bdE(i18t('bd_st_' + st))}</span>`;
}

/* ---------- THE STAGE: the head, then the regions list, the SAP way ---------- */
function bdHeadHtml(c){
  if (!c) return '';
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  const st = (typeof statusLabel === 'function') ? statusLabel(c.status) : (c.status || '');
  const b = bdOf(c);
  return `<div class="bd-strip"><span class="bd-strip-ref"><b class="hati-ref">${_bdE(ref)}</b><span class="q"> · </span>${_bdE(c.name || '')}<span class="q"> · ${_bdE(c.counterparty || '—')} · ${_bdE(st)}</span></span>
    <span class="bd-sp"></span>
    ${_bd.busy && b ? `<span class="bd-busy" role="status">${bdBusyHtml()}</span>` : ''}
    ${(b || bdStale(c)) && !_bd.busy ? `<button type="button" class="ui-btn ui-btn-sm" data-bd-run title="${_bdE(i18t('bd_again_title'))}">${_bdE(i18t(bdStale(c) ? 'bd_again_changed' : 'bd_again'))}</button>` : ''}
    <button type="button" class="ui-btn ui-btn-sm" data-bd-pick-again>${_bdE(i18t('int_pick_change'))}</button></div>`;
}
function bdPickHtml(){
  const list = (typeof igPickListHtml === 'function') ? igPickListHtml(_bd.q).replace(/data-ig-pick=/g, 'data-bd-pick=') : '';
  /* THE SAME CARD AS THE DOCUMENT FACE'S PICKER (owner, 11 Oct 2026: "the
     choose your contract cards should be the same size"): its clothes, its
     width, its find box; only the words and the hooks are this face's. */
  return `<div class="ig-pick bd-pick"><div class="ig-pick-card"><h2>${_bdE(i18t('bd_pick_title'))}</h2><p class="ig-pick-sub">${_bdE(i18t('bd_pick_sub'))} ${_bdE(i18t('bd_cost'))}.</p>
    <input id="bd-pick-q" type="search" class="ig-pick-find" placeholder="${_bdE(i18t('bd_pick_ph'))}" aria-label="${_bdE(i18t('bd_pick_ph'))}" value="${_bdE(_bd.q)}" autocomplete="off">
    <div id="bd-pick-list">${list}</div></div></div>`;
}
/* WHEN SOMETHING IS LOADING, SOMETHING MOVES (owner, 11 Oct 2026): the
   reading is a wait of seconds, so its word carries the house's turning ring
   (components.js busyHtml) — on the button that started it and, when a
   reading is redone over one on screen, in the head beside the contract. */
function bdBusyHtml(){ return window.busyHtml ? busyHtml(i18t('bd_reading')) : _bdE(i18t('bd_reading')); }
function bdStageHtml(){
  const c = bdContract();
  if (!c || _bd.picking) return bdPickHtml();
  const b = bdOf(c);
  if (!b){
    return bdHeadHtml(c) + `<div class="bd-empty"><div class="bd-empty-card">
      <h2>${_bdE(i18t('bd_empty_title'))}</h2>
      <p>${_bdE(i18t(bdStale(c) ? 'bd_empty_changed' : 'bd_empty_sub'))}</p>
      ${_bd.err ? `<p class="bd-err" role="alert">${_bdE(_bd.err)}</p>` : ''}
      ${!_bd.busy && (_bd.err || _bd.tried[c.id + ':' + bdHash(c)])
        /* only a refusal (or a read already tried this sitting) asks for a press — the pick already was one */
        ? `<div class="bd-empty-acts"><button type="button" class="ui-btn ui-btn-primary" data-bd-run>${_bdE(i18t('bd_run'))}</button><span class="bd-cost">${_bdE(i18t('bd_cost'))}</span></div>`
        : `<p class="bd-reading" role="status" aria-live="polite">${bdBusyHtml()}</p>`}</div></div>`;
  }
  const need = bdCount(b, 'need'), look = bdCount(b, 'look'), fine = bdCount(b, 'fine');
  const placed = (b.regions || []).reduce((n, r) => n + (r.items || []).length, 0);
  const rows = bdByStatus(b).map(r => `<tr data-bd-go="${r.i}" tabindex="0"${_bd.ri === r.i ? ' class="sel"' : ''}>
      <td><b>${r.n}. ${_bdE(r.name)}</b>${r.clauses ? `<br><span class="bd-small">${_bdE(r.clauses)}</span>` : ''}</td>
      <td>${bdChip(r.status)}</td><td class="num">${(r.items || []).length}</td><td class="num">${bdFlagged(r) || '–'}</td><td>${_bdE(r.headline)}</td></tr>`).join('');
  return bdHeadHtml(c) + `<div class="bd-scroll scroll-thin" id="bd-scroll"><div class="bd-card">
      <div class="bd-card-h"><h3>${_bdE(c.name || '')}</h3><span class="bd-small">${_bdE(i18tn('bd_placed', placed, { n: placed }))}${b.truncated ? ' · ' + _bdE(i18t('bd_cut_short')) : ''}</span></div>
      <div class="bd-kpis"><div><span>${_bdE(i18t('bd_st_need'))}</span><b class="is-need">${need}</b></div><div><span>${_bdE(i18t('bd_st_look'))}</span><b class="is-look">${look}</b></div>
        <div><span>${_bdE(i18t('bd_st_fine'))}</span><b class="is-fine">${fine}</b></div><div><span>${_bdE(i18t('bd_regions'))}</span><b>${(b.regions || []).length}</b></div></div>
      <div class="bd-tscroll"><table class="bd-table"><thead><tr><th>${_bdE(i18t('bd_th_region'))}</th><th>${_bdE(i18t('bd_th_status'))}</th><th>${_bdE(i18t('bd_th_clauses'))}</th><th>${_bdE(i18t('bd_th_flagged'))}</th><th>${_bdE(i18t('bd_th_says'))}</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div></div>`;
}
/* painted into Home's cover; the panel follows */
function renderBreakdown(){
  const host = document.getElementById('hb-bd'); if (!host) return;
  const sc = document.getElementById('bd-scroll'); const top = sc ? sc.scrollTop : 0;
  host.innerHTML = bdStageHtml();
  const sc2 = document.getElementById('bd-scroll'); if (sc2) sc2.scrollTop = top;
  if (bdOnScreen()) setTimeout(bdAutoRun, 0);
  const q = document.getElementById('bd-pick-q');
  if (q && !q._bdWired){ q._bdWired = true; q.addEventListener('input', () => { _bd.q = q.value;
    const l = document.getElementById('bd-pick-list'); if (l && typeof igPickListHtml === 'function') l.innerHTML = igPickListHtml(_bd.q).replace(/data-ig-pick=/g, 'data-bd-pick='); }); }
}
/* THE PICK IS THE PRESS: a contract held here with no reading of these words
   is read once this sitting; a refusal stays on screen with Try again */
function bdAutoRun(){
  const c = bdContract();
  if (!c || _bd.picking || _bd.busy || bdOf(c)) return;
  const key = c.id + ':' + bdHash(c);
  if (_bd.tried[key]) return;
  _bd.tried[key] = true;
  bdRun(c);
}
function bdPaint(){
  if (!bdOnScreen()) return;
  renderBreakdown();
  if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){}
}

/* ---------- THE PANEL: the zoom, deal → region → clause → words ---------- */
function bdCrumbsHtml(b){
  const r = b.regions[_bd.ri];
  const parts = [`<button type="button" data-bd-nav="deal">${_bdE(i18t('bd_whole_deal'))}</button>`];
  if (r) parts.push(`<button type="button" data-bd-nav="region">${_bdE(r.name)}</button>`);
  if (r && _bd.ci >= 0 && r.items[_bd.ci]) parts.push(`<button type="button" data-bd-nav="clause">${_bdE(r.items[_bd.ci].ref)}</button>`);
  if (_bd.lvl === 'words') parts.push(`<span>${_bdE(i18t('bd_words'))}</span>`);
  const lv = BD_LEVELS.indexOf(_bd.lvl);
  return `<div class="bd-lvls">${BD_LEVELS.map((l, k) => `<span class="${lv >= k ? 'on' : ''}">${_bdE(i18t('bd_lvl_' + l))}</span>`).join('')}</div>
    <nav class="bd-crumbs" aria-label="${_bdE(i18t('bd_zoom_level'))}">${parts.join('<i>›</i>')}</nav>`;
}
function bdDealHtml(c, b){
  const pil = { pay: 0, get: 0, protect: 0 }; (b.regions || []).forEach(r => { pil[r.kind] = (pil[r.kind] || 0) + (r.items || []).length; });
  const pt = (pil.pay + pil.get + pil.protect) || 1;
  return `<h3 class="bd-kick">${_bdE(i18t('bd_whole_deal'))}</h3><h2>${_bdE(c.name || '')}</h2>
    ${b.head || b.sub ? `<p class="bd-lead">${_bdE([b.head, b.sub].filter(Boolean).join('. '))}</p>` : ''}
    <h4>${_bdE(i18t('bd_by_status'))}</h4>
    <div class="bd-slist">${bdByStatus(b).map(r => `<button type="button" data-bd-go="${r.i}"><span class="bd-dot ${r.status}"></span><span class="bd-sn">${r.n}. ${_bdE(r.name)}</span><span class="bd-sf">${bdFlagged(r) ? _bdE(i18t('bd_flagged_of', { k: bdFlagged(r), n: (r.items || []).length })) : _bdE(i18tn('bd_clauses_n', (r.items || []).length, { n: (r.items || []).length }))}</span></button>`).join('')}</div>
    <h4>${_bdE(i18t('bd_made_of'))}</h4>
    <div class="bd-stack"><i class="sp" style="width:${pil.pay / pt * 100}%"></i><i class="sg" style="width:${pil.get / pt * 100}%"></i><i class="spr" style="width:${pil.protect / pt * 100}%"></i></div>
    <div class="bd-stackk"><span><i class="sp"></i>${_bdE(i18t('bd_k_pay'))} · ${pil.pay}</span><span><i class="sg"></i>${_bdE(i18t('bd_k_get'))} · ${pil.get}</span><span><i class="spr"></i>${_bdE(i18t('bd_k_protect'))} · ${pil.protect}</span></div>`;
}
function bdRegionHtml(c, b){
  const r = b.regions[_bd.ri]; if (!r) return bdDealHtml(c, b);
  const n = _bd.ri + 1;
  const links = (b.links || []).filter(l => l.a === n || l.b === n);
  return `<h3 class="bd-kick">${_bdE(i18t('bd_region_n', { n }))}${r.clauses ? ' · ' + _bdE(r.clauses) : ''}</h3>
    <div class="bd-row">${bdChip(r.status)}<span class="bd-small">${_bdE(i18t('bd_flagged_of', { k: bdFlagged(r), n: (r.items || []).length }))}</span></div>
    <h2>${_bdE(r.headline)}</h2>${r.sentence ? `<p class="bd-lead">${_bdE(r.sentence)}</p>` : ''}
    ${r.ours || r.here ? `<h4>${_bdE(i18t('bd_vs'))}</h4><div class="bd-vs"><div class="ours"><span>${_bdE(i18t('bd_usual'))}</span><p>${_bdE(r.ours || '—')}</p></div><div class="here ${r.status}"><span>${_bdE(i18t('bd_this'))}</span><p>${_bdE(r.here || '—')}</p></div></div>` : ''}
    ${r.stake ? `<h4>${_bdE(i18t('bd_stake'))}</h4><p class="bd-stake">${_bdE(r.stake)}</p>` : ''}
    <h4>${_bdE(i18t('bd_every_clause', { n: (r.items || []).length }))}</h4>
    <div class="bd-cls">${(r.items || []).map((it, k) => `<button type="button" data-bd-cl="${k}" class="${it.status}"><span class="ref">${_bdE(it.ref)}</span><span><b>${_bdE(it.title)}</b><em>${_bdE(it.note)}</em></span></button>`).join('')}</div>
    ${links.length ? `<h4>${_bdE(i18t('bd_connected'))}</h4><div class="bd-links">${links.map(l => { const o = b.regions[(l.a === n ? l.b : l.a) - 1]; return o ? `<button type="button" data-bd-go="${(l.a === n ? l.b : l.a) - 1}"><b>${(l.a === n ? l.b : l.a)}. ${_bdE(o.name)}</b><span>${_bdE(l.why)}</span></button>` : ''; }).join('')}</div>` : ''}
    ${r.fix ? `<div class="bd-fix"><span>${_bdE(i18t('bd_suggested'))}</span><p>${_bdE(r.fix)}</p></div>` : ''}
    <div class="bd-acts">${(r.quotes || []).length ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-bd-act="words">${_bdE(i18t('bd_read_words'))}</button>` : ''}
      ${r.status !== 'fine' ? `<button type="button" class="ui-btn ui-btn-sm" data-bd-act="redline">${_bdE(i18t('bd_redline_here'))}</button>` : ''}</div>`;
}
function bdClauseHtml(c, b){
  const r = b.regions[_bd.ri]; const it = r && r.items[_bd.ci]; if (!it) return bdRegionHtml(c, b);
  return `<h3 class="bd-kick">${_bdE(it.ref)} · ${_bdE(i18t('bd_in_region', { name: r.name }))}</h3>
    <div class="bd-row">${bdChip(it.status)}</div><h2>${_bdE(it.title)}</h2>${it.note ? `<p class="bd-lead">${_bdE(it.note)}</p>` : ''}
    <div class="bd-acts">${(r.quotes || []).length ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-bd-act="words">${_bdE(i18t('bd_region_words'))}</button>` : ''}
      ${_bd.ci > 0 ? `<button type="button" class="ui-btn ui-btn-sm" data-bd-cl="${_bd.ci - 1}">‹ ${_bdE(r.items[_bd.ci - 1].ref)}</button>` : ''}
      ${_bd.ci < r.items.length - 1 ? `<button type="button" class="ui-btn ui-btn-sm" data-bd-cl="${_bd.ci + 1}">${_bdE(r.items[_bd.ci + 1].ref)} ›</button>` : ''}</div>`;
}
/* a quote with its marked words; the marks are the reading's own phrases,
   checked against the quote on the server, painted here as <mark> */
function bdQuoteHtml(q){
  let t = _bdE(q.text);
  (q.mark || []).forEach(m => { const e = _bdE(m); if (e && t.indexOf(e) >= 0) t = t.replace(e, `<mark>${e}</mark>`); });
  return `<figure class="bd-words"><figcaption>${_bdE(q.source || '')}</figcaption><p>${t}</p></figure>`;
}
function bdWordsHtml(c, b){
  const r = b.regions[_bd.ri]; if (!r) return bdDealHtml(c, b);
  return `<h3 class="bd-kick">${_bdE(i18t('bd_words'))} · ${_bdE(r.name)}</h3><h2>${_bdE(r.headline)}</h2>
    ${(r.quotes || []).map(bdQuoteHtml).join('')}
    ${r.meaning ? `<h4>${_bdE(i18t('bd_what_marked'))}</h4><p class="bd-lead">${_bdE(r.meaning)}</p>` : ''}
    ${r.fix ? `<div class="bd-fix"><span>${_bdE(i18t('bd_suggested'))}</span><p>${_bdE(r.fix)}</p></div>` : ''}
    <div class="bd-acts">${(r.quotes || []).length ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-bd-act="show">${_bdE(i18t('bd_show_paper'))}</button>` : ''}
      ${r.status !== 'fine' ? `<button type="button" class="ui-btn ui-btn-sm" data-bd-act="redline">${_bdE(i18t('bd_redline_here'))}</button>` : ''}
      <button type="button" class="ui-btn ui-btn-sm" data-bd-nav="region">${_bdE(i18t('bd_back_region'))}</button></div>`;
}
/* Home's one panel, while the Breakdown face is up */
function bdLensHtml(){
  const c = bdContract(); const b = c && !_bd.picking ? bdOf(c) : null;
  const head = `<div class="bd-lens-head"><b>${_bdE(i18t('bd_panel_title'))}</b><span class="flex-1"></span></div>`;
  if (!b) return `<div class="bd-lens">${head}<div class="bd-lens-body"><p class="bd-lead">${_bdE(i18t(c ? 'bd_panel_empty' : 'bd_panel_pick'))}</p></div></div>`;
  const body = _bd.lvl === 'words' ? bdWordsHtml(c, b) : _bd.lvl === 'clause' ? bdClauseHtml(c, b) : _bd.lvl === 'region' ? bdRegionHtml(c, b) : bdDealHtml(c, b);
  return `<div class="bd-lens">${head}<div class="bd-lens-top">${bdCrumbsHtml(b)}</div><div class="bd-lens-body scroll-thin">${body}</div>
    <form class="bd-ask" id="bd-ask"><input id="bd-ask-in" autocomplete="off" placeholder="${_bdE(i18t(_bd.ri >= 0 ? 'bd_ask_region' : 'bd_ask_deal'))}"><button type="submit" class="ui-btn ui-btn-sm ui-btn-primary">${_bdE(i18t('bd_ask'))}</button></form></div>`;
}
function bdGo(lvl, ri, ci){
  _bd.lvl = lvl; if (ri != null) _bd.ri = ri; if (ci != null) _bd.ci = ci;
  if (lvl === 'deal'){ _bd.ri = -1; _bd.ci = -1; }
  if (lvl === 'region') _bd.ci = -1;
  bdPaint();
}

/* ONE LISTENER, ON THE DOCUMENT, for both halves (the cover and the panel are
   painted again on every act) */
if (typeof document !== 'undefined' && !document._bdWired){
  document._bdWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#hb-bd, #ig-dock .bd-lens')) return;
    const c = bdContract();
    if (t.closest('[data-bd-run]')){ if (c) bdRun(c); return; }
    if (t.closest('[data-bd-pick-again]')){ _bd.picking = true; _bd.q = ''; bdPaint(); setTimeout(() => { const q = document.getElementById('bd-pick-q'); if (q) q.focus(); }, 0); return; }
    const pk = t.closest('[data-bd-pick]');
    if (pk){ _bd.id = pk.getAttribute('data-bd-pick'); _bd.picking = false; _bd.err = ''; _bd.lvl = 'deal'; _bd.ri = -1; _bd.ci = -1; bdPaint(); return; }
    const go = t.closest('[data-bd-go]'); if (go){ bdGo('region', Number(go.getAttribute('data-bd-go'))); return; }
    const cl = t.closest('[data-bd-cl]'); if (cl){ bdGo('clause', null, Number(cl.getAttribute('data-bd-cl'))); return; }
    const nav = t.closest('[data-bd-nav]');
    if (nav){ const n = nav.getAttribute('data-bd-nav'); bdGo(n === 'deal' ? 'deal' : n === 'region' ? 'region' : 'clause'); return; }
    const act = t.closest('[data-bd-act]'); if (!act || !c) return;
    const a = act.getAttribute('data-bd-act');
    const b = bdOf(c); const r = b && b.regions[_bd.ri];
    if (a === 'words'){ bdGo('words'); return; }
    if (a === 'redline'){ if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(c.id); return; }
    if (a === 'show' && r && r.quotes && r.quotes[0]){
      /* the Document face's own quote pin, on that contract */
      if (typeof hbSetFace === 'function') hbSetFace('paper');
      const go2 = () => { if (typeof igQuoteGo === 'function') igQuoteGo(r.quotes[0].text); };
      if (typeof intel === 'object' && intel && intel.paper && intel.paper.id === c.id) setTimeout(go2, 60);
      else if (typeof igAnalyze === 'function') Promise.resolve(igAnalyze(c.id)).then(() => setTimeout(go2, 60)).catch(() => {});
    }
  });
  document.addEventListener('keydown', e => {
    const row = e.target && e.target.closest ? e.target.closest('#hb-bd tr[data-bd-go]') : null;
    if (row && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); bdGo('region', Number(row.getAttribute('data-bd-go'))); }
  });
  /* ASK COPILOT: Home's one Copilot conversation, on the Document face, with
     the region named — never a second chat here */
  document.addEventListener('submit', e => {
    if (!e.target || e.target.id !== 'bd-ask') return;
    e.preventDefault();
    const c = bdContract(); const inp = document.getElementById('bd-ask-in'); const q = String(inp && inp.value || '').trim();
    if (!c || !q) return;
    const b = bdOf(c); const r = b && b.regions[_bd.ri];
    const text = r ? `${q} — ${i18t('bd_ask_about', { name: r.name, clauses: r.clauses || '' })}` : q;
    if (typeof hbSetFace === 'function') hbSetFace('paper');
    const ask = () => { if (typeof hbAskInPanel === 'function') hbAskInPanel(text, c.id); };
    if (typeof intel === 'object' && intel && intel.paper && intel.paper.id === c.id) setTimeout(ask, 60);
    else if (typeof igAnalyze === 'function') Promise.resolve(igAnalyze(c.id)).then(() => setTimeout(ask, 60)).catch(() => {});
  });
}

Object.assign(window, { bdAutoRun, bdOnScreen, bdContract, bdOf, bdStale, bdRun, bdStageHtml, renderBreakdown, bdPaint, bdLensHtml, bdGo, BD_LEVELS });
