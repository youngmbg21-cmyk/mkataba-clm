// HaTi — Reads: every read of the wording, and the next batch.
/* ============================================================================
   READS (THE THREAD — the owner picked it, 28 Oct 2026, over "The worklist"
   and "Keep reading"; docs/MAP-HISTORY.md "READS IN BATCHES")
   ----------------------------------------------------------------------------
   One quiet list of the questions the team has asked of the wording (a pack
   and a company fact among them), each with how far it got over the contracts
   this person may see, who read last and when, how many are at risk, and the
   next batch on the row itself: "Next 50 →". The row's panel tells the read as
   a thread — Next · the batches, newest first · Asked — and where the answers
   are. NOTHING HERE READS: every door is an existing one (askColNext reads the
   next batch through the one engine; the column on the Contracts list; the
   Ledger). The page counts what the server kept: the answers (GET
   /api/columns/summary) and the presses (GET /api/columns/reads).
   ========================================================================== */
const RD_SEAT = 'reads';
const RD_TABS = [['all', 'rd_tab_all'], ['mine', 'rd_tab_mine'], ['packs', 'rd_tab_packs'], ['facts', 'rd_tab_facts']];
let _rd = { sel: null, filter: 'all', q: '', rows: null, asks: null, me: '', loading: false, at: 0 };
let _rdBack = null;
const _rdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _rdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _rdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, { n, ...(v || {}) }) : k;
/* A REFRESH LANDS AT THE SAME SPOT (PLACE_PARTS.reads): the tab, the box and the chosen row */
function rdPlace(){ return { filter: _rd.filter, q: _rd.q, sel: _rd.sel }; }
function rdPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _rd.filter = RD_TABS.some(t => t[0] === p.filter) ? p.filter : 'all';
  _rd.q = p.q ? String(p.q) : '';
  _rdBack = p.sel ? String(p.sel) : null;
}
/* THE CONTRACTS THIS PERSON MAY SEE, counted once: "of 500" on every row */
function rdTotal(){
  const cs = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  return cs.filter(c => c && !c.archived && !(typeof jamboOnPress === 'function' && jamboOnPress(c))).length;
}
const _rdKey = q => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase();
/* THE ROWS: one per question the team asked (kept or not), one per pack read; counted off the kept answers
   and the presses. A pack's row says how far its questions got together (the fewest answered of its
   questions, since one read answers them all) and the risks across them. */
function rdRows(){
  const asks = _rd.asks || [];
  const R = (typeof AC !== 'undefined' && AC.reads) ? AC.reads : { reads: [], arrivals: {} };
  const reads = R.reads || [], arrivals = R.arrivals || {};
  const total = rdTotal(), me = R.me || '';
  const rows = asks.map(a => {
    const mine = reads.filter(r => (r.askIds || []).includes(a.id) && !r.packId);
    const last = mine[0] || null, arr = arrivals[a.id] || null;
    return { key: 'ask:' + a.id, askIds: [a.id], name: a.name || '', q: a.question || '', fact: !!a.fact, kept: !!a.kept, pack: null,
      by: last ? last.by : (a.by || ''), byId: last ? last.byId : (a.askedBy || ''), when: last ? (last.last || last.at) : (a.last || a.at || ''),
      read: Math.min(a.read || 0, total), total, risk: a.risk || 0, calls: mine.reduce((n, r) => n + (r.calls || 0), 0) + (arr ? arr.calls : 0),
      batches: mine, arrivals: arr, asked: { by: a.by || '', at: a.at || '', keptBy: a.keptBy || '' }, isMine: !!me && (mine.some(r => r.byId === me) || a.askedBy === me) };
  });
  const packs = new Map();
  for (const r of reads){
    if (!r.packId) continue;
    const p = packs.get(r.packId) || { key: 'pack:' + r.packId, askIds: [], name: r.packName || '', q: '', fact: false, kept: true, pack: { id: r.packId, n: 0 },
      by: r.by, byId: r.byId, when: r.last || r.at, read: 0, total, risk: 0, calls: 0, batches: [], arrivals: null, asked: { by: r.by, at: r.at, keptBy: '' }, isMine: false };
    p.askIds = [...new Set(p.askIds.concat(r.askIds || []))]; p.batches.push(r); p.calls += r.calls || 0; p.isMine = p.isMine || (!!me && r.byId === me);
    packs.set(r.packId, p);
  }
  for (const p of packs.values()){
    const its = p.askIds.map(id => asks.find(a => a.id === id)).filter(Boolean);
    p.pack.n = p.askIds.length;
    p.q = its.map(a => a.name).filter(Boolean).join(' · ');
    p.read = its.length ? Math.min(...its.map(a => Math.min(a.read || 0, total))) : 0;
    p.risk = its.reduce((n, a) => n + (a.risk || 0), 0);
  }
  return rows.concat([...packs.values()]).sort((x, y) => String(y.when || '').localeCompare(String(x.when || '')));
}
const rdInTab = (r, k) => k === 'mine' ? r.isMine : k === 'packs' ? !!r.pack : k === 'facts' ? r.fact : true;
const rdHit = (r, q) => !q || [r.name, r.q, r.by].some(x => String(x || '').toLowerCase().includes(q));
const rdWords = () => String(_rd.q || '').trim().toLowerCase();
const rdTabNow = () => (RD_TABS.some(t => t[0] === _rd.filter) ? _rd.filter : 'all');
function rdBoxed(){ const q = rdWords(); return (_rd.rows || []).filter(r => rdHit(r, q)); }
function readsShown(){ return rdBoxed().filter(r => rdInTab(r, rdTabNow())); }
const rdFind = key => (_rd.rows || []).find(r => r.key === key) || null;
/* the next batch for a row, as the plan says it (askColPlan reads the Contracts list as it is filtered now —
   here the list is the whole book this person may see, so the plan is asked of the book) */
function rdPlanOf(r, size){
  if (typeof askColPlan !== 'function') return null;
  const p = askColPlan({ askIds: r.askIds, size: size || (typeof acSize === 'function' ? acSize() : 50) });
  /* on this page the Contracts list is not in front, so the plan's "shown" is the book; the row's own count stands */
  return Object.assign(p, { shown: r.total, read: r.read, unread: Math.max(0, r.total - r.read) });
}
const rdNextN = (r, size) => Math.min(size || (typeof acSize === 'function' ? acSize() : 50), Math.max(0, r.total - r.read));
/* "27 Oct, 14:02" / "today, 09:12" — the presses' own clock words (askColWhen) */
const rdWhen = at => (typeof askColWhen === 'function') ? askColWhen(at) : String(at || '').slice(0, 16);

/* THE HEAD, THE LEGORA WAY (js/views/listhead.js): "Reads N · facts", + Ask a column at the end; the box;
   the tabs All · Mine · Packs · Facts; the chip row with Columns */
const rdColDefs = () => [
  { k: 'read', label: _rdT('rd_col_read'), w: '21%' },
  { k: 'risk', label: _rdT('rd_col_risk'), w: '18%' },
  { k: 'next', label: '', w: '13%' },
];
const rdColKeys = () => { const keys = rdColDefs().map(c => c.k); return typeof lcShown === 'function' ? lcShown(RD_SEAT, keys) : keys; };
const rdKeep = () => { if (typeof placeSave === 'function'){ try { placeSave(); } catch (_){ /* a convenience */ } } };
function rdHeadReg(){
  if (window.LC_PAGES) window.LC_PAGES[RD_SEAT] = { cols: () => rdColDefs().filter(c => c.label).map(c => ({ k: c.k, label: c.label })), repaint: () => renderReads() };
  if (typeof lhRegister !== 'function') return null;
  return lhRegister(RD_SEAT, {
    noun: 'reads',
    total: () => (_rd.rows || []).length,
    q: () => _rd.q || '',
    setQuery: w => { _rd.q = String(w == null ? '' : w); rdRowsPaint(); },
    boxId: 'rd-q', boxAttrs: { 'data-rd-q': true },
    tabAttr: 'data-rd-tab', tabsLabel: _rdT('rd_filter'), tabNow: rdTabNow,
    tabs: () => { const boxed = rdBoxed(); return RD_TABS.map(([k, key]) => ({ k, label: _rdT(key), n: boxed.filter(r => rdInTab(r, k)).length, keep: k === 'all' })); },
    tab: k => { _rd.filter = RD_TABS.some(t => t[0] === k) ? k : 'all'; renderReads(); rdKeep(); },
    filters: () => [],
    apply: () => { renderReads(); rdKeep(); },
  });
}
function readsFacts(){
  const rows = _rd.rows || [];
  const risk = rows.filter(r => !r.pack).reduce((n, r) => n + (r.risk || 0), 0);
  const month = (typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10)).slice(0, 7);
  const reads = ((typeof AC !== 'undefined' && AC.reads && AC.reads.reads) || []);
  const calls = reads.filter(r => String(r.at || '').slice(0, 7) === month).reduce((n, r) => n + (r.calls || 0), 0);
  const qs = rows.filter(r => !r.pack).length;
  return [_rdTn('rd_facts_q', qs), risk ? _rdTn('ac_disc_risk', risk) : '', _rdT('rd_facts_calls', { calls: _rdTn('ac_n_calls', calls) })].filter(Boolean).join(' · ');
}
function readsBandHtml(){
  const n = (_rd.rows || []).length;
  const top = `<div class="rd-head ph-top"><div class="rd-hl"><h1 class="rd-t1">${_rdE(_rdT('nav_reads'))}</h1><span class="rd-hn">${n}</span><span class="rd-hs">${_rdE(readsFacts())}</span></div>
      <button type="button" class="ui-btn ui-btn-primary" id="rd-ask">${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : ''}${_rdE(_rdT('ac_btn'))}</button></div>`;
  return typeof lhHtml === 'function' ? lhHtml(RD_SEAT, { frame: 'card', cls: 'rd-band', top }) : `<div class="sap-band rd-band ph-card">${top}</div>`;
}
/* THE ROW, THE LIST LANGUAGE (js/listlang.js): a mark leads it — a half circle partly read, a ticked circle
   every contract read —, the bold name with its chips (Pack · N questions, Company fact, Not kept), the grey
   line "question · who · read when"; Read as a thin progress line with "50 of 500"; At risk in words; and
   the next batch on the row itself, or Read again where every contract is read */
function rdChipsHtml(r){
  const chip = (t, w) => (typeof listChipHtml === 'function') ? listChipHtml(t, w) : `<span class="ls-chip">${_rdE(w)}</span>`;
  return (r.pack ? chip('violet', _rdT('rd_chip_pack', { n: r.pack.n })) : r.fact ? chip('steel', _rdT('ac_disc_fact')) : '') + (r.kept || r.fact ? '' : chip('gray', _rdT('rd_chip_loose')));
}
function rdMarkHtml(r){
  if (typeof listMarkHtml !== 'function') return '';
  return r.read >= r.total && r.total ? listMarkHtml('green', 'done', _rdT('rd_mark_done')) : listMarkHtml('amber', 'part', _rdT('rd_mark_part'));
}
function rdRiskHtml(r){
  if (typeof listWordHtml !== 'function') return _rdE(String(r.risk));
  if (!r.read) return `<span class="rd-quiet">—</span>`;
  return r.risk ? listWordHtml('ruby', _rdTn('ac_disc_risk', r.risk), _rdT('rd_of_read', { n: r.read })) : listWordHtml('green', _rdT('rd_none_risk'), _rdT('rd_of_read', { n: r.read }));
}
const rdBarHtml = (n, of) => `<span class="rd-bar" role="img" aria-label="${_rdE(_rdT('ac_th_prog', { read: n, total: of }))}"><i style="width:${of ? Math.round(n / of * 100) : 0}%"></i></span>`;
function readsTableHtml(list){
  if (!list.length){
    const t = (_rd.rows || []).length ? _rdT('rd_none_here') : _rdT('rd_empty');
    return typeof emptyStateHtml === 'function' ? emptyStateHtml({ title: t, sub: _rdT('rd_empty_sub') }) : `<p class="rd-empty">${_rdE(t)}</p>`;
  }
  const byK = Object.fromEntries(rdColDefs().map(c => [c.k, c])), keys = rdColKeys().filter(k => byK[k]);
  const cell = (k, r) => k === 'read' ? `<td><span class="rd-cell">${rdBarHtml(r.read, r.total)}<small>${_rdE(_rdT('rd_of_total', { read: r.read, total: r.total }))}</small></span></td>`
    : k === 'risk' ? `<td>${rdRiskHtml(r)}</td>`
    : `<td>${r.total > r.read ? `<button type="button" class="rd-next" data-rd-next="${_rdE(r.key)}" title="${_rdE(_rdT('ac_th_next_title'))}">${_rdE(_rdT('rd_next_arrow', { n: rdNextN(r) }))}</button>`
      : `<button type="button" class="rd-again" data-rd-again="${_rdE(r.key)}">${_rdE(_rdT('ac_again'))}</button>`}</td>`;
  const line = r => [r.q ? `“${r.q}”` : '', r.by, r.when ? _rdT('ac_read_at', { when: rdWhen(r.when) }) : ''].filter(Boolean).join(' · ');
  return `<table class="ins-lt rd-t"><colgroup><col>${keys.map(k => `<col style="width:${byK[k].w}">`).join('')}</colgroup><thead><tr><th>${_rdE(_rdT('rd_col_question'))}</th>${keys.map(k => `<th data-rd-col="${k}">${_rdE(byK[k].label)}</th>`).join('')}</tr></thead><tbody>${
    list.map(r => `<tr data-rd-row="${_rdE(r.key)}" data-ins-row="${_rdE(r.key)}" tabindex="0" class="${r.key === _rd.sel ? 'is-sel' : ''}"${r.key === _rd.sel ? ' aria-current="true"' : ''}>
        <td><span class="rd-who">${rdMarkHtml(r)}<span class="rd-who-t"><span class="ap-name rd-n"><span class="rd-nm" title="${_rdE(r.name)}">${_rdE(r.name)}</span>${rdChipsHtml(r)}</span><span class="ap-sub rd-sub" title="${_rdE(line(r))}">${_rdE(line(r))}</span></span></span></td>
        ${keys.map(k => cell(k, r)).join('')}</tr>`).join('')
  }</tbody></table>`;
}
const rdFootHtml = list => (list.length && typeof lhFootHtml === 'function') ? lhFootHtml(RD_SEAT, list.length, list.length, 0, { cls: 'ins-foot' }) : '';
/* THE THREAD (the panel, as drawn): the name, the question; Read the next N · Open the table; then "Next ·
   51–100 — the first N not yet read, in the list's order · N calls · or 100"; each press newest first
   ("1–50 · today, 09:12 — Amina Otieno · 50 calls"); "Asked · when — who · kept in Discover"; and where the
   answers are, with Show the N at risk and Bring the column onto the list */
function readParts(r){
  const n = rdNextN(r), p = rdPlanOf(r, n > 50 ? 100 : 50);
  const size = typeof acSize === 'function' ? acSize() : 50, other = AC_SIZES_OF().find(x => x !== size);
  const nextN = Math.min(size, Math.max(0, r.total - r.read)), otherN = Math.min(other || size, Math.max(0, r.total - r.read));
  const acts = [];
  if (r.total > r.read) acts.push({ k: 'next', kind: 'accent', label: _rdT('rd_next_btn', { n: nextN, calls: _rdTn('rd_calls', nextN) }), attrs: `data-rd-act="next" data-rd-n="${size}"` });
  else acts.push({ k: 'again', label: _rdT('ac_again'), attrs: 'data-rd-act="again"' });
  acts.push({ k: 'table', label: _rdT('rd_open_table'), attrs: 'data-rd-act="table"' });
  const where = p && p.pick.length ? (typeof askColWhereText === 'function' ? askColWhereText(Object.assign({}, p, { pick: p.pick.slice(0, nextN) })) : '') : _rdT('ac_th_where', { from: r.read + 1, to: r.read + nextN });
  const thread = [];
  if (r.total > r.read) thread.push(`<li><b>${_rdE(_rdT('rd_th_next', { where }))}</b><span>${_rdE(_rdT('rd_th_next_sub', { calls: _rdTn('ac_n_calls', nextN) }))}${other && otherN !== nextN ? ` · <button type="button" class="ac-link" data-rd-act="next" data-rd-n="${other}">${_rdE(_rdT('rd_th_or', { n: otherN }))}</button>` : ''}</span></li>`);
  for (const b of r.batches){
    const span = (b.from && b.to) ? (b.to - b.from + 1 === b.n ? _rdT('ac_th_where', { from: b.from, to: b.to }) : _rdT('ac_th_where_gap', { n: b.n, from: b.from })) : _rdTn('ac_n_contracts', b.n);
    const bits = [b.by, _rdTn('ac_n_calls', b.calls), b.stopped ? _rdT('ac_stopped_word') : ''].filter(Boolean).join(' · ');
    thread.push(`<li><b>${_rdE(span)} · ${_rdE(rdWhen(b.last || b.at))}</b><span>${_rdE(bits)}</span></li>`);
  }
  if (r.arrivals && r.arrivals.n) thread.push(`<li><b>${_rdE(_rdTn('rd_th_arrivals', r.arrivals.n))}</b><span>${_rdE(_rdTn('ac_n_calls', r.arrivals.calls))}${r.arrivals.last ? ` · ${_rdE(_rdT('ac_read_at', { when: rdWhen(r.arrivals.last) }))}` : ''}</span></li>`);
  if (r.asked && r.asked.at) thread.push(`<li><b>${_rdE(_rdT('rd_th_asked', { when: rdWhen(r.asked.at) }))}</b><span>${_rdE([r.asked.by, r.fact ? _rdT('ac_disc_fact') : r.kept ? _rdT('rd_th_kept') : _rdT('rd_chip_loose')].filter(Boolean).join(' · '))}</span></li>`);
  const whereAns = `<p class="rd-where">${_rdT('rd_where_says', { name: `<b>${_rdE(r.pack ? r.name : r.name)}</b>` })} ${r.risk ? `<button type="button" class="ac-link" data-rd-act="risk">${_rdE(_rdTn('ac_chip_risk', r.risk))}</button> · ` : ''}<button type="button" class="ac-link" data-rd-act="bring">${_rdE(_rdT('rd_bring'))}</button></p>`;
  const body = `<section class="ins-sec rd-sec"><h3>${_rdE(_rdT('rd_sec_thread'))}</h3><ul class="rd-thread">${thread.join('')}</ul></section>
    <section class="ins-sec rd-sec"><h3>${_rdE(_rdT('rd_sec_where'))}</h3>${whereAns}</section>`;
  return { head: { eyebrow: `<span class="rd-eb">${_rdE(r.pack ? _rdT('rd_chip_pack', { n: r.pack.n }) : r.fact ? _rdT('ac_disc_fact') : _rdT('rd_eb_question'))}</span>`, title: r.name, sub: r.q ? `“${_rdE(r.q)}”` : '', acts }, body };
}
function AC_SIZES_OF(){ return (typeof AC_SIZES !== 'undefined' && Array.isArray(AC_SIZES)) ? AC_SIZES : [50, 100]; }
/* WITH NOTHING CHOSEN, Jambo says the page in words counted from it (no call) */
function rdJlSay(){
  const rows = _rd.rows || [], qs = rows.filter(r => !r.pack);
  const open = qs.filter(r => r.total > r.read).length, risk = qs.reduce((n, r) => n + (r.risk || 0), 0);
  const lines = [qs.length ? _rdTn('jl_rd_say_n', qs.length, { n: qs.length }) : _rdT('jl_rd_say_none')];
  if (open) lines.push(_rdTn('jl_rd_say_open', open, { n: open }));
  if (risk) lines.push(_rdTn('jl_rd_say_risk', risk, { n: risk }));
  const chips = [{ label: _rdT('ac_btn'), run: () => readsAskNew() }];
  const first = qs.find(r => r.total > r.read);
  if (first) chips.push({ label: _rdT('rd_next_btn', { n: rdNextN(first), calls: _rdTn('rd_calls', rdNextN(first)) }), run: () => readsNext(first.key, typeof acSize === 'function' ? acSize() : 50) });
  return { lines: [_rdE(lines.join(' '))], chips, src: _rdT('jl_rd_src') };
}
function rdChoose(list, wide){
  if (wide && typeof insPick === 'function'){ _rd.sel = insPick(RD_SEAT, list.map(r => r.key)); }
  else if (!list.some(r => r.key === _rd.sel)) _rd.sel = list[0] ? list[0].key : null;
}
function rdSidePaint(wide){
  if (!wide || typeof insPaintPanel !== 'function') return;
  const r = _rd.sel ? rdFind(_rd.sel) : null;
  const base = { seat: RD_SEAT, jlSay: rdJlSay, jlWord: _rdT('jl_w_read') };
  if (r){ const p = readParts(r); insPaintPanel(Object.assign(base, { item: { id: r.key }, head: p.head, acts: p.head.acts, body: `<div class="rd-side" id="rd-side">${p.body}</div>` })); }
  else insPaintPanel(Object.assign(base, { empty: _rdT('rd_pick') }));
}
function rdRowsPaint(){
  const page = document.getElementById('rd-page');
  if (state.view !== 'reads' || !page){ if (state.view === 'reads') renderReads(); return; }
  const wide = page.getAttribute('data-ins') === '1';
  const was = String(_rd.sel);
  const list = readsShown();
  rdChoose(list, wide);
  const sc = document.getElementById('rd-scroll');
  if (sc) sc.innerHTML = readsTableHtml(list);
  if (wide){ const tb = page.querySelector('.rd-t tbody'); if (tb) tb.setAttribute('data-ins-on', '1'); }
  const card = page.querySelector('.rd-card');
  if (card){
    const old = card.querySelector(`[data-lh-foot="${RD_SEAT}"]`), html = rdFootHtml(list);
    if (old){ if (!(typeof lhFootPut === 'function' && lhFootPut(old, html))){ if (html) old.outerHTML = html; else old.remove(); } }
    else if (html) card.insertAdjacentHTML('beforeend', html);
  }
  if (String(_rd.sel) !== was) rdSidePaint(wide);
}
/* THE PAGE READS WHAT THE SERVER KEPT: the questions counted (summary, every one) and the presses, both
   free; drawn at once from what is already known, drawn again when they land */
async function rdLoad(force){
  if (_rd.loading) return;
  if (!force && _rd.rows && Date.now() - _rd.at < 60000) return;
  _rd.loading = true;
  try {
    /* every question, kept or not (the folded line's own query), read here and kept here: Discover's fold is the Contracts panel's */
    const [sum] = await Promise.all([api('columns/summary?all=1'), typeof askColReads === 'function' ? askColReads(true) : null, typeof askColSummary === 'function' ? askColSummary() : null]);
    _rd.asks = (sum && sum.asks) || [];
    if (typeof AC !== 'undefined' && AC.asks) _rd.asks.forEach(a => { AC.asks[a.id] = Object.assign(AC.asks[a.id] || {}, a); });
  } catch (_){ _rd.asks = _rd.asks || []; }
  _rd.loading = false; _rd.at = Date.now();
  _rd.rows = rdRows();
  if (state.view === 'reads') renderReads();
}
function renderReads(){
  const host = document.getElementById('content'); if (!host) return;
  if (!_rd.rows){ _rd.rows = rdRows(); rdLoad(true); }
  else if (Date.now() - _rd.at > 60000) rdLoad();
  const wide = typeof window.insFits === 'function' && insFits() && typeof window.insPaintPanel === 'function';
  const list = readsShown();
  if (_rdBack){ if (list.some(r => r.key === _rdBack)){ _rd.sel = _rdBack; if (typeof insSelect === 'function') insSelect(RD_SEAT, _rdBack); } if (_rd.rows && _rd.rows.length) _rdBack = null; }
  rdChoose(list, wide);
  const keep = document.activeElement && document.activeElement.id && document.activeElement.closest && document.activeElement.closest('#rd-page') ? document.activeElement.id : '';
  const caret = keep ? document.activeElement.selectionStart : null;
  rdHeadReg();
  const card = `<section class="ins-card rd-card" aria-label="${_rdE(_rdT('nav_reads'))}">
      <div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${readsTableHtml(list)}</div>
      ${rdFootHtml(list)}
    </section>`;
  host.innerHTML = `<div class="view-enter sap-page ins-page rd-page rd-ins${wide ? '' : ' is-narrow'}" id="rd-page" data-ins-page="reads" data-ins="${wide ? 1 : 0}"><style>${readsCss()}</style>
    ${readsBandHtml()}
    <div class="ins-body">${card}${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${_rdE(_rdT('rd_panel_label'))}"></aside>` : ''}</div></div>`;
  if (wide){
    const tb = host.querySelector('.rd-t tbody'); if (tb) tb.setAttribute('data-ins-on', '1');
    rdSidePaint(true);
  }
  if (typeof lcPlace === 'function') lcPlace(RD_SEAT);
  if (keep && document.getElementById(keep)){ const el = document.getElementById(keep); el.focus(); try { if (caret != null) el.setSelectionRange(caret, caret); } catch (_){ /* not a text box */ } }
  readsWire();
  if (typeof setActiveNav === 'function') setActiveNav('reads');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* THE DOORS, EVERY ONE AN EXISTING ONE */
function readsOpen(askId){
  _rd.sel = askId ? (String(askId).startsWith('pack:') || String(askId).startsWith('ask:') ? String(askId) : 'ask:' + askId) : _rd.sel;
  _rd.filter = 'all'; _rd.q = '';
  if (typeof lhBoxSet === 'function') lhBoxSet(RD_SEAT, '');
  if (_rd.sel && typeof insSelect === 'function') insSelect(RD_SEAT, _rd.sel);
  _rdBack = _rd.sel;
  if (state.view !== 'reads' && typeof setView === 'function') setView('reads'); else renderReads();
}
/* to the Contracts list, then the act there (the one door: a read goes out from where the answers land) */
function rdOnContracts(then){
  const go = () => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); if (typeof setView === 'function') setView('register'); };
  if (typeof dkLeavePageThen === 'function') dkLeavePageThen(go); else go();
  let n = 0;
  const tick = () => { if (document.querySelector('#reg-tbody') && typeof askColOn === 'function' && askColOn()){ then(); return; } if (++n < 40) setTimeout(tick, 100); };
  setTimeout(tick, 100);
}
function readsAskNew(){ rdOnContracts(() => { if (typeof askColOpen === 'function') askColOpen(); }); }
function readsNext(key, size){
  const r = rdFind(key); if (!r) return;
  if (r.pack){ rdOnContracts(() => { const p = ((typeof AC !== 'undefined' && AC.packs) || []).find(x => x.id === r.pack.id); if (p && typeof askColOpen === 'function'){ if (typeof acSizeSet === 'function') acSizeSet(size); askColOpen({ pack: p }); } }); return; }
  rdOnContracts(() => { if (typeof askColNext === 'function') askColNext(r.askIds[0], size); });
}
function readsAgain(key){
  const r = rdFind(key); if (!r) return;
  const a = (typeof AC !== 'undefined' && AC.asks) ? AC.asks[r.askIds[0]] : null;
  rdOnContracts(() => { if (typeof askColOpen === 'function') askColOpen(a ? { question: a.question, name: a.name, askId: a.id, force: true } : {}); });
}
function readsTable(key){ const r = rdFind(key); if (!r) return; rdOnContracts(() => { if (typeof askColTableFor === 'function') askColTableFor(r.askIds, r.name); }); }
function readsBring(key){ const r = rdFind(key); if (!r) return; rdOnContracts(() => { if (typeof askColBring === 'function') askColBring(r.askIds[0]); }); }
function readsRisk(key){
  const r = rdFind(key); if (!r) return;
  rdOnContracts(async () => { if (typeof askColBring === 'function') await askColBring(r.askIds[0]);
    const ids = (typeof askColAtRisk === 'function') ? askColAtRisk(r.askIds[0]) : [];
    if (ids.length && typeof regShowOnly === 'function') regShowOnly(ids, _rdT('ac_risk_label', { name: r.name })); });
}
function readsWire(){
  if (document._rdWired) return;
  document._rdWired = true;
  document.addEventListener('click', e => {
    if (state.view !== 'reads') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const inPage = t.closest('#rd-page'), inPanel = t.closest('#ins-panel');
    if (!inPage && !inPanel) return;
    let el;
    if ((el = t.closest('#rd-ask'))){ readsAskNew(); return; }
    if ((el = t.closest('[data-rd-next]'))){ e.stopPropagation(); readsNext(el.getAttribute('data-rd-next'), typeof acSize === 'function' ? acSize() : 50); return; }
    if ((el = t.closest('[data-rd-again]'))){ e.stopPropagation(); readsAgain(el.getAttribute('data-rd-again')); return; }
    if ((el = t.closest('[data-rd-act]')) && _rd.sel){
      const act = el.getAttribute('data-rd-act');
      if (act === 'next') readsNext(_rd.sel, Number(el.getAttribute('data-rd-n')) || (typeof acSize === 'function' ? acSize() : 50));
      else if (act === 'again') readsAgain(_rd.sel);
      else if (act === 'table') readsTable(_rd.sel);
      else if (act === 'bring') readsBring(_rd.sel);
      else if (act === 'risk') readsRisk(_rd.sel);
      return;
    }
    if ((el = t.closest('[data-rd-row]'))){
      const key = el.getAttribute('data-rd-row');
      if (_rd.sel === key) return;
      _rd.sel = key;
      if (typeof insSelect === 'function') insSelect(RD_SEAT, key);
      renderReads(); return;
    }
  });
  document.addEventListener('keydown', e => {
    if (state.view !== 'reads') return;
    const row = e.target && e.target.closest ? e.target.closest('[data-rd-row]') : null;
    if (row && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); row.click(); }
    if (row && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
      const to = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling;
      if (to && to.hasAttribute('data-rd-row')){ e.preventDefault(); to.click(); const again = document.querySelector(`[data-rd-row="${CSS.escape(to.getAttribute('data-rd-row'))}"]`); if (again) again.focus({ preventScroll: false }); }
    }
  });
}
function readsCss(){ return `
  .rd-page{min-height:0}
  .rd-ins .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:var(--s-2)}
  .rd-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap}
  .rd-hl{display:flex;align-items:baseline;gap:6px 10px;flex-wrap:wrap;min-width:0}
  .rd-t1{margin:0;font-family:var(--font-title);font-size:20px;font-weight:var(--w-title-serif);letter-spacing:-.01em;line-height:1.2;color:var(--color-text)}
  .rd-hn{color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
  .rd-hs{font-size:var(--t-meta);color:var(--color-neutral-600)}
  .rd-ins.is-narrow .ins-body{grid-template-columns:minmax(0,1fr)}
  .rd-wrap{min-width:0;overflow:auto}
  .rd-wrap > .hati-empty{padding:24px 16px}
  .rd-t tbody tr{cursor:pointer}
  .ins-lt.rd-t tbody td{vertical-align:middle;padding-top:8px;padding-bottom:8px}
  .rd-t tbody tr:hover td{background:var(--surface-2, var(--color-neutral-50))}
  .rd-t tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent)}
  .rd-t tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid)}
  .rd-t tr:focus{outline:none}
  .rd-t tr:focus-visible td{box-shadow:inset 0 2px 0 var(--focus-color),inset 0 -2px 0 var(--focus-color)}
  /* THE ROW: the mark, then the name and its chips on one line, the grey line under (16px inside every card) */
  .rd-who{display:flex;align-items:center;gap:10px;min-width:0}
  .rd-who-t{display:flex;flex-direction:column;min-width:0;flex:1}
  .rd-n{display:flex;align-items:center;gap:8px;min-width:0}
  .rd-nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
  .rd-n .ls-chip{flex:none}
  .rd-sub{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text);font-size:12px;line-height:16px}
  .rd-cell{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
  .rd-cell small{font-size:12px;color:var(--color-text)}
  .rd-bar{display:inline-block;width:92px;height:4px;border-radius:2px;background:var(--color-neutral-100);overflow:hidden;vertical-align:middle;flex:none}
  .rd-bar>i{display:block;height:100%;background:var(--accent-solid);border-radius:2px}
  .rd-quiet{color:var(--color-quiet)}
  .rd-next,.rd-again{border:0;background:none;padding:0;font:inherit;font-size:13px;font-weight:var(--w-label);color:var(--accent-ink);cursor:pointer;white-space:nowrap}
  .rd-again{color:var(--color-text);font-weight:var(--w-body)}
  .rd-next:hover,.rd-again:hover{text-decoration:underline;text-underline-offset:2px}
  /* THE THREAD in Jambo's panel */
  .rd-eb{font-size:var(--t-label);color:var(--color-neutral-600)}
  .rd-thread{list-style:none;margin:0;padding:0 0 0 12px;border-left:2px solid var(--rule);display:grid;gap:10px;font-size:13px}
  .rd-thread li b{font-weight:var(--w-label);display:block}
  .rd-thread li span{display:block;color:var(--color-neutral-600);font-size:12px;line-height:1.45}
  .rd-where{margin:0;font-size:13px;line-height:1.5}
  .rd-where b{font-weight:var(--w-label)}
  #ins-panel .rd-sec{padding-top:0}
`; }

Object.assign(window, { rdPlace, rdPlacePut, renderReads, readsOpen, readsShown, readParts, rdRows, readsFacts, readsNext, readsAskNew });
