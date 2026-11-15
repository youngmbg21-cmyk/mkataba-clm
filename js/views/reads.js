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
let _rd = { sel: null, filter: 'all', q: '', rows: null, asks: null, me: '', loading: false, at: 0, table: null };
let _rdBack = null;
const _rdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _rdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _rdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, { n, ...(v || {}) }) : k;
/* THE NEW DISCOVER'S OWN PLACE (owner, 15 Nov 2026): which of its four screens stands, the read chosen or open, the filters */
const _dsn = { screen: 'list', run: null, sel: null, cid: null, tab: 'all', q: '', f: { folder: '', ask: '', by: '', when: 'all' }, pick: new Set(['all']), status: 'all', party: '', done: null };
/* A REFRESH LANDS AT THE SAME SPOT (PLACE_PARTS.reads): the tab, the box and the chosen row */
function rdPlace(){ return { filter: _rd.filter, q: _rd.q, sel: _rd.sel, table: _rd.table ? { key: _rd.table.key, tab: _rd.table.tab, q: _rd.table.q, cid: _rd.table.cid } : null,
  dsn: { screen: _dsn.screen === 'reading' ? (_dsn.run ? 'results' : 'list') : _dsn.screen, run: _dsn.run, sel: _dsn.sel, f: _dsn.f } }; }
function rdPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _rd.filter = RD_TABS.some(t => t[0] === p.filter) ? p.filter : 'all';
  _rd.q = p.q ? String(p.q) : '';
  _rdBack = p.sel ? String(p.sel) : null;
  _rd.table = p.table && p.table.key ? { key: String(p.table.key), tab: String(p.table.tab || 'all'), q: String(p.table.q || ''), cid: p.table.cid ? String(p.table.cid) : null, loaded: false } : null;
  const d = p.dsn && typeof p.dsn === 'object' ? p.dsn : null;
  if (d){ _dsn.resumed = true; _dsn.screen = ['list', 'new', 'results'].includes(d.screen) ? d.screen : 'list'; _dsn.run = d.run ? String(d.run) : null; _dsn.sel = d.sel ? String(d.sel) : null;
    if (d.f && typeof d.f === 'object') ['folder', 'ask', 'by', 'when'].forEach(k => { if (typeof d.f[k] === 'string') _dsn.f[k] = d.f[k]; }); }
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
const rdSizeNow = () => (typeof acSize === 'function') ? acSize() : 50;
/* ONE BUTTON (28 Oct 2026): the same words as the column's card — the rest when it fits a press, else the next batch and what is left after */
const rdNextLabel = (r, size) => (typeof askColNextWords === 'function') ? askColNextWords(Math.max(0, r.total - r.read), size).label : _rdT('rd_next_btn', { n: rdNextN(r, size), calls: _rdTn('rd_calls', rdNextN(r, size)) });
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
    : `<td>${r.total > r.read ? `<button type="button" class="rd-next" data-rd-next="${_rdE(r.key)}" title="${_rdE(_rdT('ac_th_next_title'))}">${_rdE(_rdT(r.total - r.read <= rdSizeNow() ? 'rd_last_arrow' : 'rd_next_arrow', { n: rdNextN(r) }))}</button>`
      : `<button type="button" class="rd-again" data-rd-again="${_rdE(r.key)}">${_rdE(_rdT('ac_again'))}</button>`}</td>`;
  const line = r => [r.q ? `“${r.q}”` : '', r.by, r.when ? _rdT('ac_read_at', { when: rdWhen(r.when) }) : ''].filter(Boolean).join(' · ');
  return `<table class="ins-lt rd-t"><colgroup><col>${keys.map(k => `<col style="width:${byK[k].w}">`).join('')}</colgroup><thead><tr><th>${_rdE(_rdT('rd_col_question'))}</th>${keys.map(k => `<th data-rd-col="${k}">${_rdE(byK[k].label)}</th>`).join('')}</tr></thead><tbody>${
    list.map(r => `<tr data-rd-row="${_rdE(r.key)}" data-ins-row="${_rdE(r.key)}" tabindex="0" class="${r.key === _rd.sel ? 'is-sel' : ''}"${r.key === _rd.sel ? ' aria-current="true"' : ''}>
        <td><span class="rd-who">${rdMarkHtml(r)}<span class="rd-who-t"><span class="ap-name rd-n"><span class="rd-nm" title="${_rdE(r.name)}">${_rdE(r.name)}</span>${rdChipsHtml(r)}</span><span class="ap-sub rd-sub" title="${_rdE(line(r))}">${_rdE(line(r))}</span></span></span></td>
        ${keys.map(k => cell(k, r)).join('')}</tr>`).join('')
  }</tbody></table>`;
}
/* ---- THE READ TABLE, INSIDE READS (round 4 of the review; the owner picked "The Legora way", 28 Oct 2026; the
   drawing look/r8 p5) ----
   "Open the table" stays on this page (no trip through Contracts): "‹ All reads · Rebate “question” · 16 read ·
   who, when" with Copy the table and Ask again at its end; All · Yes · No for a yes-or-no question (else All ·
   At risk · Not found) and a search box; a row leads with the agreement (bold name, party · ref under), then per
   question its light, the short answer and its §, then Checked; the chosen row's reading in Jambo's panel — the
   words once, Go to § and the tick. The answers are the kept ones, fetched free (askColLoad); nothing here reads. */
function rdTableIds(){
  const cs = (typeof state !== 'undefined' && Array.isArray(state.contracts)) ? state.contracts : [];
  return cs.filter(c => c && c.id && !c.archived && !c._codeNamed && !(typeof jamboOnPress === 'function' && jamboOnPress(c))).map(c => String(c.id));
}
const _rdAns = (k, id) => ((typeof AC !== 'undefined' && AC.ans && AC.ans[k]) || {})[id] || null;
function rdTableRows(r){
  return rdTableIds().map(id => ({ id, c: (typeof getContract === 'function') ? getContract(id) : null, a: r.askIds.map(k => _rdAns(k, id)) }))
    .filter(x => x.c && x.a.some(Boolean));
}
const rdTableYesNo = (r, rows) => r.askIds.length === 1 && rows.some(x => x.a[0] && typeof x.a[0].yes === 'boolean');
const _rdTone = (a, askId) => (typeof askColToneOf === 'function') ? askColToneOf(a, askId) : 'none';
function rdTableIn(x, tab, yn){
  if (tab === 'yes') return !!(x.a[0] && x.a[0].yes === true);
  if (tab === 'no') return !(x.a[0] && x.a[0].yes === true);
  if (tab === 'risk') return x.a.some(a => a && _rdTone(a) === 'ruby');
  if (tab === 'none') return x.a.some(a => a && (a.noWording || !a.found));
  if (tab === 'open') return !x.a.some(a => a && a.checked);
  return true;
}
const rdTableTabs = yn => yn ? [['all', 'rd_tt_all'], ['yes', 'rd_tt_yes'], ['no', 'rd_tt_no']] : [['all', 'rd_tt_all'], ['risk', 'rd_tt_risk'], ['none', 'rd_tt_none']];
const _rdRef = c => (typeof contractRef === 'function') ? contractRef(c) : c.id;
const _rdName = c => { let n = ''; try { n = (typeof bsShortName === 'function') ? String(bsShortName(c) || '').trim() : ''; } catch (_){ n = ''; } return n || String(c.name || '').trim() || c.counterparty || _rdRef(c); };
const _rdWord = a => !a ? '' : a.noWording ? _rdT('ac_no_wording') : a.found ? a.answer : _rdT('ac_not_found');
function rdTableHit(x, q){
  if (!q) return true;
  const hay = [_rdName(x.c), x.c.counterparty, _rdRef(x.c)].concat(x.a.map(_rdWord)).join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}
function rdTableShown(r){
  const t = _rd.table, rows = rdTableRows(r), yn = rdTableYesNo(r, rows);
  const boxed = rows.filter(x => rdTableHit(x, t.q));
  /* the new look's Scorecard adds a tile for what nobody has ticked yet; the old look keeps its three tabs */
  const tabs = rdTableTabs(yn).concat(_rdScOn() ? [['open', 'rd_tt_not_checked']] : []);
  if (!tabs.some(([k]) => k === t.tab)) t.tab = 'all';
  return { rows, yn, boxed, tabs, list: boxed.filter(x => rdTableIn(x, t.tab, yn)) };
}
function rdTableCellHtml(a, askId){
  if (!a) return `<span class="rd-quiet">${_rdE(_rdT('rd_tt_unread'))}</span>`;
  const num = (typeof askColClauseNo === 'function') ? askColClauseNo(a) : '';
  return `<span class="rdt-ans"><span class="ac-ans tone-${_rdTone(a, askId)}"><i></i><span class="rdt-w">${_rdE(_rdWord(a))}${a.found && a.detail ? `, ${_rdE(a.detail)}` : ''}</span></span>${num ? `<span class="rdt-sec">§ ${_rdE(num)}</span>` : ''}</span>`;
}
function rdTableCheckedHtml(x){
  const ck = x.a.map(a => a && a.checked).filter(Boolean);
  if (!ck.length) return `<span class="rd-quiet">—</span>`;
  const k = ck[0];
  return `<span class="rdt-ck" title="${_rdE(_rdT('ac_th_by', { by: k.by || '', when: rdWhen(k.at) }))}">${_rdE(_rdT('ac_th_by', { by: String(k.by || '').split(/\s+/)[0], when: rdWhen(k.at) }))}</span>`;
}
/* THE SCORECARD (owner picked it by name, 12 Nov 2026; drawn first, artifact NN39v3eXJCf9y28T3DWN6o): in the new look the
   read table on Discover wears ONE head of its own instead of the old Reads band — ‹ Discover, the question's name, the
   search box, Copy the table and the one black Ask again, the line of who asked and when, then a row of coloured tiles,
   one per answer and one for Not checked yet, each its count and a filter (the chosen one ringed). The tiles are the
   tabs (data-rdt-tab), counted off the same rows; nothing here reads or writes. */
const _rdScOn = () => typeof window.newLookOn === 'function' && newLookOn();
const RD_SC_TONE = { all: '', yes: 'green', no: 'steel', risk: 'ruby', none: 'steel', open: 'amber' };
function rdScHeadHtml(r, S, sub){
  const t = _rd.table, all = S.boxed.length, seen = rdTableIds().length;
  const tile = ([k, key]) => {
    const n = S.boxed.filter(x => rdTableIn(x, k, S.yn)).length;
    const small = k === 'all' ? _rdTn('rd_sc_of_list', seen)
      : k === 'open' ? _rdT('rd_sc_ticked', { k: all - n, n: all })
      : _rdT('rd_sc_pct', { p: all ? Math.round(n / all * 100) : 0 });
    const label = k === 'all' ? _rdT('rd_sc_all') : _rdT(key), on = t.tab === k;
    if (!n && k !== 'all' && !on) return '';   /* a filter with nothing behind it is not listed */
    return `<button type="button" class="rdsc-tile${RD_SC_TONE[k] ? ' is-' + RD_SC_TONE[k] : ''}${on ? ' is-on' : ''}" data-rdt-tab="${k}" aria-pressed="${on}"><b>${n}</b><span class="rdsc-tl">${_rdE(label)}</span><span class="rdsc-ts">${_rdE(small)}</span></button>`;
  };
  return `<div class="rdsc-head"><div class="rdsc-top"><button type="button" class="ac-link rdt-back" data-rdt-back>${_rdE(_rdT('rd_sc_back'))}</button><h1 class="rdsc-nm" title="${_rdE(r.name)}">${_rdE(r.name)}</h1><span class="rdt-sp"></span>
      <label class="lh-ask rdt-ask rdsc-ask"><input type="search" id="rdt-q" autocomplete="off" spellcheck="false" placeholder="${_rdE(_rdTn('rd_tt_search', S.rows.length))}" value="${_rdE(t.q)}" aria-label="${_rdE(_rdTn('rd_tt_search', S.rows.length))}"></label>
      <button type="button" class="ui-btn ui-btn-sm" data-rdt-copy>${_rdE(_rdT('ac_chip_copy'))}</button><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-rdt-again>${_rdE(_rdT('ac_again'))}</button></div>
    <div class="rdsc-sub" title="${_rdE(sub)}">${_rdE(sub)}</div>
    <div class="rdsc-tiles" role="group" aria-label="${_rdE(_rdT('rd_filter'))}">${S.tabs.map(tile).join('')}</div></div>`;
}
function rdTableHtml(r){
  const t = _rd.table, S = rdTableShown(r);
  /* the chosen row is kept until the answers are in (a refresh lands on it), then the first shown stands in */
  if (S.list.length && (!t.cid || !S.list.some(x => x.id === t.cid))) t.cid = S.list[0].id;
  const names = r.askIds.map(k => ((typeof AC !== 'undefined' && AC.asks && AC.asks[k]) || {}).name || r.name);
  const yes = S.yn ? S.rows.filter(x => rdTableIn(x, 'yes', true)).length : 0;
  const risk = S.rows.filter(x => rdTableIn(x, 'risk', false)).length;
  const sub = [r.q ? `“${r.q}”` : _rdT('rd_chip_pack', { n: r.askIds.length }), _rdTn('rd_tt_read', S.rows.length), r.by, r.when ? rdWhen(r.when) : ''].filter(Boolean).join(' · ');
  const tabs = typeof insViewTabsHtml === 'function' ? insViewTabsHtml({ views: S.tabs.map(([k, key]) => ({ k, label: _rdT(key), n: S.boxed.filter(x => rdTableIn(x, k, S.yn)).length, keep: k === 'all' })), cur: t.tab, attr: 'data-rdt-tab', label: _rdT('rd_filter') }) : '';
  const head = _rdScOn() ? rdScHeadHtml(r, S, sub) : `<div class="rdt-head"><button type="button" class="ac-link rdt-back" data-rdt-back>${_rdE(_rdT('rd_tt_back'))}</button><span class="rdt-dot" aria-hidden="true">·</span><b class="rdt-nm">${_rdE(r.name)}</b><span class="rdt-sub" title="${_rdE(sub)}">${_rdE(sub)}</span><span class="rdt-sp"></span><button type="button" class="ac-link" data-rdt-copy>${_rdE(_rdT('ac_chip_copy'))}</button><button type="button" class="ac-link" data-rdt-again>${_rdE(_rdT('ac_again'))}</button></div>
    <div class="rdt-bar">${tabs}<label class="lh-ask rdt-ask"><input type="search" id="rdt-q" autocomplete="off" spellcheck="false" placeholder="${_rdE(_rdTn('rd_tt_search', S.rows.length))}" value="${_rdE(t.q)}" aria-label="${_rdE(_rdTn('rd_tt_search', S.rows.length))}"></label></div>`;
  const body = !S.rows.length ? `<p class="rdt-empty">${_rdE(_rdT(t.loaded ? 'rd_tt_none_read' : 'rd_tt_loading'))}</p>`
    : !S.list.length ? `<p class="rdt-empty">${_rdE(_rdT('rd_none_here'))}</p>`
    : `<table class="ins-lt rd-t rdt-t"><colgroup><col>${names.map(() => `<col style="width:${Math.round(52 / names.length)}%">`).join('')}<col style="width:16%"></colgroup>
      <thead><tr><th>${_rdE(_rdT('rd_tt_agreement'))}</th>${names.map(n => `<th>${_rdE(n)}</th>`).join('')}<th>${_rdE(_rdT('rd_tt_checked'))}</th></tr></thead><tbody>${
      S.list.map(x => { const on = x.id === t.cid, who = [x.c.counterparty, _rdRef(x.c)].filter(Boolean).join(' · ');
        return `<tr data-rdt-row="${_rdE(x.id)}" tabindex="0" class="${on ? 'is-sel' : ''}"${on ? ' aria-current="true"' : ''}>
          <td><span class="rd-who-t"><span class="ap-name rd-n"><span class="rd-nm" title="${_rdE(_rdName(x.c))}">${_rdE(_rdName(x.c))}</span></span><span class="ap-sub rd-sub" title="${_rdE(who)}">${_rdE(who)}</span></span></td>
          ${x.a.map((a, j) => `<td>${rdTableCellHtml(a, r.askIds[j])}</td>`).join('')}<td>${rdTableCheckedHtml(x)}</td></tr>`; }).join('')
    }</tbody></table>`;
  const say = [_rdTn('ac_n_contracts', S.list.length), S.yn ? _rdTn('rd_tt_say_yes', yes) : risk ? _rdTn('ac_disc_risk', risk) : ''].filter(Boolean).join(' · ');
  const foot = S.list.length && typeof lhFootHtml === 'function' ? lhFootHtml(RD_SEAT, S.list.length, S.list.length, 0, { cls: 'ins-foot', say }) : '';
  return { head, body, foot };
}
/* THE CHOSEN ROW in Jambo's panel: the agreement, then Answer · Where · Words (once) · Checked, Go to § and the tick */
function rdTableSidePaint(r){
  if (typeof insPaintPanel !== 'function') return;
  const t = _rd.table, x = t.cid ? rdTableRows(r).find(y => y.id === t.cid) : null;
  const base = { seat: RD_SEAT, jlSay: rdJlSay, jlWord: _rdT('jl_w_read') };
  if (!x){ insPaintPanel(Object.assign(base, { empty: _rdT('rd_tt_pick') })); return; }
  const i = Math.max(0, x.a.findIndex(Boolean)), a = x.a[i], askId = r.askIds[i];
  const num = (typeof askColClauseNo === 'function') ? askColClauseNo(a) : '';
  const may = typeof askColMay === 'function' && askColMay();
  /* as drawn: the two doors under the reading, Go to § filled and the tick beside it */
  const acts = `<div class="ac-acts rdt-acts"><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-rdt-go="${_rdE(askId)}">${_rdE(num ? _rdT('ac_go_clause', { n: num }) : _rdT('ac_go_it'))}</button>${a.noWording ? ''
    : `<button type="button" class="ui-btn ui-btn-sm" data-rdt-ck="${_rdE(askId)}"${may ? '' : ` disabled title="${_rdE(_rdT('ac_mark_viewer'))}"`}>${_rdE(a.checked ? _rdT('rd_tt_untick') : _rdT('rd_tt_tick'))}</button>`}</div>`;
  const row = (k, v) => v ? `<dt>${_rdE(_rdT(k))}</dt><dd>${v}</dd>` : '';
  const many = x.a.length > 1 ? x.a.map((b, j) => b ? `<li><b>${_rdE(((AC.asks || {})[r.askIds[j]] || {}).name || '')}</b> ${rdTableCellHtml(b, r.askIds[j])}</li>` : '').join('') : '';
  const body = `<div class="rd-side rdt-side" id="rd-side"><dl class="ac-fl">
      ${row('ac_f_answer', `<span class="ac-ans tone-${_rdTone(a, askId)}"><i></i><b>${_rdE([_rdWord(a), a.found ? a.detail : ''].filter(Boolean).join(', '))}</b></span>`)}
      ${row('rd_tt_where', a.clause ? _rdE('§ ' + a.clause.replace(/\s*·\s*/, ' ')) : '')}
      ${row('rd_tt_words', a.quote ? `<blockquote class="ac-quote rdt-quote">“${_rdE(a.quote)}”</blockquote>` : '')}
      ${row('ac_f_why', a.why ? _rdE(a.why) : '')}
      ${row('rd_tt_checked', a.checked ? _rdE(_rdT('ac_th_by', { by: a.checked.by || '', when: rdWhen(a.checked.at) })) : _rdE(_rdT('rd_tt_not_checked')))}
    </dl>${many ? `<ul class="rdt-many">${many}</ul>` : ''}${acts}</div>`;
  insPaintPanel(Object.assign(base, { item: { id: 'rdt:' + x.id }, head: { title: [_rdName(x.c), x.c.counterparty].filter(Boolean).join(' · '), sub: _rdE([_rdRef(x.c), r.name].filter(Boolean).join(' · ')), acts: [] }, acts: [], body }));
}
function rdTablePaint(){
  const now = _rd.table ? rdFind(_rd.table.key) : null;
  if (!now || state.view !== 'reads'){ renderReads(); return; }
  const card = document.querySelector('#rd-page .rd-card');
  if (!card){ renderReads(); return; }
  const P = rdTableHtml(now);
  const keep = document.activeElement && document.activeElement.id === 'rdt-q' ? document.activeElement.selectionStart : null;
  /* A PRESS STAYS WHERE IT WAS PRESSED (owner, 9 Nov 2026: "when i press on one of the lines, the page kicks me to the top
     of the page... I should remain on where I pressed"): the table is drawn again, its scroll put back where it stood */
  const was = document.getElementById('rd-scroll'); const top = was ? was.scrollTop : 0;
  card.innerHTML = `${P.head}<div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${P.body}</div>${P.foot}`;
  if (top){ const sc = document.getElementById('rd-scroll'); if (sc) sc.scrollTop = top; }
  if (keep != null){ const q = document.getElementById('rdt-q'); if (q){ q.focus(); try { q.setSelectionRange(keep, keep); } catch (_){ /* not a text box */ } } }
  const page = document.getElementById('rd-page');
  if (page && page.getAttribute('data-ins') === '1') rdTableSidePaint(now);
}
async function rdTableLoad(){
  const t = _rd.table; if (!t) return;
  const r = rdFind(t.key); if (!r) return;
  const ids = rdTableIds();
  if (typeof askColLoad === 'function') await Promise.all(r.askIds.map(k => askColLoad(k, ids).catch(() => false)));
  if (_rd.table !== t) return;
  t.loaded = true; rdTablePaint();
}
function readsTableOpen(key){
  const r = rdFind(key); if (!r) return;
  _rd.table = { key, tab: 'all', q: '', cid: null, loaded: false };
  _rd.sel = key; rdKeep();
  if (state.view !== 'reads' && typeof setView === 'function') setView('reads'); else renderReads();
  rdTableLoad();
}
function readsTableBack(){ _rd.table = null; rdKeep(); renderReads(); }
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
  if (r.total > r.read) acts.push({ k: 'next', kind: 'accent', label: rdNextLabel(r, size), attrs: `data-rd-act="next" data-rd-n="${size}"` });
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
  const chips = [{ label: _rdT('dsc_chip_ask'), run: () => readsAskNew() }];
  const first = qs.find(r => r.total > r.read);
  if (first) chips.push({ label: rdNextLabel(first, rdSizeNow()), run: () => ((typeof newLookOn === 'function' && newLookOn() && document.querySelector('#rd-page.dsc-page')) ? dsnFill(first) : readsNext(first.key, rdSizeNow())) });
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
  if (_rd.table){ rdTablePaint(); return; }
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
  /* WHAT LANDED THE SAME IS NOT DRAWN AGAIN (the flash measure, 13 Nov 2026: Board → Discover drew the whole page a
     second time ~55 ms after arriving, with the very rows it had drawn from what was already known) */
  const was = rdRowsKey(_rd.rows);
  _rd.rows = rdRows();
  if (state.view === 'reads' && rdRowsKey(_rd.rows) !== was) renderReads();
}
function rdRowsKey(rows){ try { return JSON.stringify(rows || null); } catch (_){ return String(Math.random()); } }
/* A PRESS STAYS WHERE IT WAS PRESSED (owner, 9 Nov 2026), on the list of reads too: a row press draws the page again
   (renderReads), so the list's scroll is put back where it stood — unless the page now shows something else (the list
   became a read's table, or the other way round), which starts at its top */
let _rdScrollMode = '';
function renderReads(o){
  const mode = _rd.table ? 't:' + _rd.table.key : 'list';
  const sc0 = document.querySelector('#rd-page #rd-scroll, #rd-page .cu-scroll');
  const top0 = sc0 && _rdScrollMode === mode && state.view === 'reads' ? sc0.scrollTop : 0;
  renderReadsDraw(o);
  _rdScrollMode = mode;
  if (top0){ const sc = document.querySelector('#rd-page #rd-scroll, #rd-page .cu-scroll'); if (sc) sc.scrollTop = top0; }
}
function renderReadsDraw(o){
  const host = document.getElementById('content'); if (!host) return;
  if (!_rd.rows){ _rd.rows = rdRows(); rdLoad(true); }
  else if (Date.now() - _rd.at > 60000) rdLoad();
  const wide = typeof window.insFits === 'function' && insFits() && typeof window.insPaintPanel === 'function';
  const list = readsShown();
  if (_rdBack){ if (list.some(r => r.key === _rdBack)){ _rd.sel = _rdBack; if (typeof insSelect === 'function') insSelect(RD_SEAT, _rdBack); } if (_rd.rows && _rd.rows.length) _rdBack = null; }
  const nl = !_rd.table && wide && typeof window.newLookOn === 'function' && newLookOn();
  if (!nl) rdChoose(list, wide);
  const keep = document.activeElement && document.activeElement.id && document.activeElement.closest && document.activeElement.closest('#rd-page') ? document.activeElement.id : '';
  const caret = keep ? document.activeElement.selectionStart : null;
  rdHeadReg();
  const tr = _rd.table ? rdFind(_rd.table.key) : null;
  if (_rd.table && !tr && _rd.rows && _rd.rows.length && _rd.at) _rd.table = null;
  const P = tr ? rdTableHtml(tr) : null;
  const card = P ? `<section class="ins-card rd-card is-table" aria-label="${_rdE(tr.name)}">${P.head}<div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${P.body}</div>${P.foot}</section>`
    : `<section class="ins-card rd-card" aria-label="${_rdE(_rdT('nav_reads'))}">
      <div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${readsTableHtml(list)}</div>
      ${rdFootHtml(list)}
    </section>`;
  /* the new look (round 6, as drawn): its own page — kept questions and packs as one table, the panel reads the chosen one */
  if (!tr && wide && typeof window.newLookOn === 'function' && newLookOn()){ rdnRender(host, o); return; }
  host.innerHTML = `<div class="view-enter sap-page ins-page rd-page rd-ins${wide ? '' : ' is-narrow'}" id="rd-page" data-ins-page="reads" data-ins="${wide ? 1 : 0}"><style>${readsCss()}</style>
    ${tr && _rdScOn() ? '' : readsBandHtml()}
    <div class="ins-body">${card}${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${_rdE(_rdT('rd_panel_label'))}"></aside>` : ''}</div></div>`;
  if (wide && tr) rdTableSidePaint(tr);
  else if (wide){
    const tb = host.querySelector('.rd-t tbody'); if (tb) tb.setAttribute('data-ins-on', '1');
    rdSidePaint(true);
  }
  if (tr && !_rd.table.loaded) rdTableLoad();
  if (typeof lcPlace === 'function') lcPlace(RD_SEAT);
  if (keep && document.getElementById(keep)){ const el = document.getElementById(keep); el.focus(); try { if (caret != null) el.setSelectionRange(caret, caret); } catch (_){ /* not a text box */ } }
  readsWire();
  if (typeof setActiveNav === 'function') setActiveNav('reads');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* ---- READS, AS DRAWN (the new look, round 6) ----
   "Reads · 2 kept questions · 1 pack not yet run"; the box and the tabs Kept · Packs, what was spent this month;
   one table — Question (and what it is: kept, a column on Contracts, its rule), Answers (yes · no · not read, or
   the answers' own words), Read "5 of 7", Spent, and the row's one press (Read N more, or Open the table); the
   packs under their own line, each "Run on N · N calls"; the foot "A kept answer is never read again" and The
   read table. Every press is an existing door (readsNext, readsTableOpen, askColOpen on Contracts). */
const _rdnLoading = new Set();
function rdnAnswers(askId){
  const A = (typeof AC !== 'undefined') ? AC : null; if (!A) return null;
  const got = A.ans && A.ans[askId];
  if (!got && !_rdnLoading.has(askId) && typeof askColLoad === 'function'){
    _rdnLoading.add(askId);
    const ids = (state.contracts || []).filter(c => c && !c.archived && !c._codeNamed).map(c => String(c.id));
    Promise.resolve(askColLoad(askId, ids)).catch(() => {}).then(() => { if (state.view === 'reads') renderReads(); });
  }
  return got || null;
}
/* READS, AS DRAWN (owner, 8 Nov 2026, the Reads & Contracts drawing, step 7): "Reads · N questions · N answers kept"
   and + Ask a question on one line; the box and All · On a list · Not finished; one table — Question (its name, its
   words under), Read "k of n", Answers (the top three and Not found), On the list of, Asked (by · when); the panel reads
   the chosen question: its answers, where it shows (Open · Remove, Add to a list), Read the other N, Delete question.
   No cost is said. Every press is an existing door (readsNext, readsBring, askColOpen, askColDelete). */
/* ANSWER COLOURS (owner's pick by name, 9 Nov 2026; the colour round): each answer wears its own tone as a soft chip (the
   same tone its bar has in the panel: the first answer green, the next amber, Not found grey), and "k of n" gets a thin
   progress bar under it */
const RDN_TONE = { yes: 'green', amb: 'amber', none: 'gray' };
const rdnProgHtml = (k, n) => `<span class="rdn-prog" aria-hidden="true"><i style="width:${n ? Math.round(Math.min(1, k / n) * 100) : 0}%"></i></span>`;
/* ═══ DISCOVER (owner, 12 Nov 2026; drawn first and picked: "The Legora Way", then "the flow you described") ═══
   The Reads page IS the Discover page now: one place for every question asked of the wording. The Contracts list's
   head carries a Discover pill where "+ Ask a column" stood (askColBtnHtml → discoverOpen); it lands here, and what
   is asked here is asked of the contracts that list shows as it is filtered (dscScope: askColShown, said in words by
   regScopeWords).
   THE TOP: "Discover" and its facts; ONE ask box with its one black button ("Ask N contracts", or "Ask the first K of
   N": a read still goes out a batch at a time, askColPlan); chips that only FILL the box — the packs, and questions
   the team asked but nobody kept; the tabs Kept · Packs · Every read.
   THE TABLE is Reads' own (Question · Read · Answers · On the list of · Asked). A row OPENS under itself (dscOpenHtml):
   its answers, the risky first, each with its light, the answer, the § and the words it was read from; a press on an
   answer puts THE PAPER in the panel (dscPaperHtml: the words lit in their own sentence, the neighbours dimmed), with
   Open this contract · Start redlining this clause above Jambo's box. Closed, the panel is the question's summary
   (rdnPanelPaint: answers, where it shows, Read the rest, Keep, Delete question).
   WHILE JAMBO READS (AC.busy, the same run as everywhere: askColAskHere → askColReadRun) the question's row leads the
   table, each answer lands under it, the panel shows the paper of the contract just read, and Stop stands in the ask
   box; stopped, the same button reads the rest (askColCarryOn). Nothing is filed into any contract. */
const DSC_OPEN_MAX = 7, DSC_LIVE_MAX = 6, DSC_TURN_MS = 1400, DSC_CHIPS = 4, DSC_SLICE = 280;
const _dsc = { q: '', askId: null, pack: null, open: null, pick: null, say: '', starting: false, liveCid: null, liveAt: 0, t: 0, turnT: 0, text: new Map() };
const _dscAC = () => (typeof AC !== 'undefined') ? AC : null;
const _dscMay = () => typeof askColMay !== 'function' || askColMay();
/* A DISCOVER READ TAKES UP TO 100 A PRESS (owner, 15 Nov 2026: "extend the reading limit to 100 contracts"): the most the
   server reads in one press (COLUMN_MAX = AC_MAX), never the 50 the older column door may remember */
const DSN_READ_MAX = 100;
const _dscSize = () => DSN_READ_MAX;
/* THE CONTRACTS THE ASK GOES TO: the Contracts list as it is filtered now, and that said in words */
/* how many of them the next press reads: the first not yet read, a batch at most (a typed question is new to all) */
/* THE WORDS A CONTRACT'S ANSWER WAS READ FROM, IN THEIR PLACE: the contract's plain wording (its record read whole
   once, ensureFull, as opening it does; kept for the sitting), the quote found in it, its own sentence and a little
   of what stands before and after. Null while it is fetched or where the wording cannot be had: the quote is shown. */
function dscTextOf(cid){
  const k = String(cid);
  if (_dsc.text.has(k)) return _dsc.text.get(k);
  const c = (typeof getContract === 'function') ? getContract(k) : null;
  if (!c){ _dsc.text.set(k, ''); return ''; }
  _dsc.text.set(k, null);
  const read = () => dscPlain(c);
  Promise.resolve((typeof ensureFull === 'function') ? ensureFull(c) : null).catch(() => {}).then(() => { _dsc.text.set(k, read()); discoverLive(true); });
  return null;
}
/* the wording with its paragraphs kept (contractPlainText runs them together): an upload's read text as it was read,
   else the drawn body with a line break after every block. Reads only. */
function dscPlain(c){
  try {
    if (typeof isUpload === 'function' && isUpload(c)) return String((c.upload && c.upload.extractedText) || '');
    if (typeof docBody !== 'function') return (typeof contractPlainText === 'function') ? String(contractPlainText(c) || '') : '';
    const host = document.createElement('div'); host.innerHTML = docBody(c, { marks: false });
    host.querySelectorAll('input').forEach(i => i.replaceWith(document.createTextNode(i.value || i.getAttribute('value') || '')));
    host.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,tr,section,article,blockquote').forEach(el => el.insertAdjacentText('afterend', '\n'));
    host.querySelectorAll('br').forEach(el => el.replaceWith(document.createTextNode('\n')));
    return host.textContent || '';
  } catch (_){ return ''; }
}
/* THE QUOTE IN ITS PLACE: its own paragraph (the words before and after it there), and the paragraph on each side */
function dscSlice(text, quote){
  const lines = String(text || '').split(/\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const q = String(quote || '').replace(/\s+/g, ' ').trim();
  if (!lines.length || q.length < 6) return null;
  const flat = lines.join(' '), low = flat.toLowerCase();
  let i = low.indexOf(q.toLowerCase()), len = q.length;
  if (i < 0 && q.length > 48){ i = low.indexOf(q.slice(0, 48).toLowerCase()); if (i >= 0) len = Math.min(q.length, flat.length - i); }
  if (i < 0) return null;
  const end = Math.min(flat.length, i + len);
  let pos = 0, la = -1, lb = -1; const starts = [];
  lines.forEach((ln, k) => { starts.push(pos); if (la < 0 && i < pos + ln.length + 1) la = k; if (lb < 0 && end <= pos + ln.length + 1) lb = k; pos += ln.length + 1; });
  if (la < 0) la = 0; if (lb < la) lb = lines.length - 1;
  let pre = flat.slice(starts[la], i), post = flat.slice(end, starts[lb] + lines[lb].length);
  /* a paper with no paragraphs is one long line: keep the sentence, not the page */
  if (pre.length > DSC_SLICE * 2){ const cut = pre.lastIndexOf('. ', pre.length - 2); pre = '\u2026 ' + (cut >= 0 && pre.length - cut < DSC_SLICE * 2 ? pre.slice(cut + 2) : pre.slice(-DSC_SLICE).replace(/^\S*\s/, '')); }
  if (post.length > DSC_SLICE * 2){ const cut = post.indexOf('. '); post = (cut >= 0 && cut < DSC_SLICE * 2 ? post.slice(0, cut + 1) : post.slice(0, DSC_SLICE).replace(/\s\S*$/, '')) + ' \u2026'; }
  let before = la > 0 ? lines[la - 1] : '', after = lb < lines.length - 1 ? lines[lb + 1] : '';
  if (before.length > DSC_SLICE) before = '\u2026 ' + before.slice(-DSC_SLICE).replace(/^\S*\s/, '');
  if (after.length > DSC_SLICE) after = after.slice(0, DSC_SLICE).replace(/\s\S*$/, '') + ' \u2026';
  return { before, pre, hit: flat.slice(i, end), post, after };
}
function dscPaperHtml(askId, cid){
  const A = _dscAC(), a = A ? ((A.ans[askId] || {})[cid] || null) : null;
  const c = (typeof getContract === 'function') ? getContract(cid) : null;
  if (!c) return `<div class="dsc-paper"><div class="dsc-sheet"><p class="dsc-none">${_rdE(_rdT('dsc_paper_gone'))}</p></div></div>`;
  const num = a && typeof askColClauseNo === 'function' ? askColClauseNo(a) : '';
  const quote = a && a.found ? String(a.quote || '').trim() : '';
  let body;
  if (!a) body = `<p class="dsc-none">${_rdE(_rdT('dsc_paper_wait'))}</p>`;
  else if (a.noWording) body = `<p class="dsc-none">${_rdE(_rdT('ac_no_wording'))}</p>`;
  else if (!quote) body = `<p class="dsc-none">${_rdE(_rdT(a.found ? 'ac_no_quote' : 'dsc_paper_nowords'))}</p>`;
  else {
    const text = dscTextOf(cid), sl = text ? dscSlice(text, quote) : null;
    const lead = sl ? sl.pre.replace(/^\u2026\s*/, '') : '';
    const sec = num && !(lead.startsWith(num + ' ') || lead.startsWith(num + '.')) ? `<b class="dsc-sec">${_rdE(num)}</b> ` : '';
    body = sl ? `${sl.before ? `<p class="dsc-dim">${_rdE(sl.before)}</p>` : ''}<p>${sec}${_rdE(sl.pre)}<mark>${_rdE(sl.hit)}</mark>${_rdE(sl.post)}</p>${sl.after ? `<p class="dsc-dim">${_rdE(sl.after)}</p>` : ''}`
      : `<p>${sec}<mark>${_rdE(quote)}</mark></p>`;
  }
  const kind = (typeof cKind === 'function') ? cKind(c) : '';
  return `<div class="dsc-paper" data-dsc-paper="${_rdE(cid)}"><div class="dsc-sheet"><h4>${_rdE(String(c.name || kind || _rdRef(c)))}</h4><div class="dsc-pt">${_rdE([c.counterparty, _rdRef(c)].filter(Boolean).join(' · '))}</div>${body}</div></div>`;
}
/* ONE ANSWER, ONE LINE: its light, the agreement, the answer, the § and the words; its one act at the end */
const _dscRank = t => t === 'ruby' ? 0 : t === 'amber' ? 1 : t === 'none' ? 2 : 3;
/* the row a read in flight leads the table with: its question, how far it got, its answers as they land */
/* the paper turns to the contract just read, no faster than a person can look (DSC_TURN_MS) */
function dscLiveTurn(){
  const A = _dscAC(), b = A && A.busy; if (!b){ _dsc.liveCid = null; return; }
  const got = (b.askId && A.ans[b.askId]) || {}, done = (b.doneIds || []).filter(id => got[id]);
  const last = done[done.length - 1] || null;
  if (!last || last === _dsc.liveCid) return;
  const wait = DSC_TURN_MS - (Date.now() - _dsc.liveAt);
  if (!_dsc.liveCid || wait <= 0){ _dsc.liveCid = last; _dsc.liveAt = Date.now(); return; }
  if (!_dsc.turnT) _dsc.turnT = setTimeout(() => { _dsc.turnT = 0; discoverLive(true); }, wait + 20);
}
/* THE DISCOVER PAGE IS THE NEW DISCOVER'S FOUR SCREENS (owner, 15 Nov 2026) */
function rdnRender(host, o){ dsnRender(host, o); }
/* THE PANEL HAS THREE FACES: the paper of the contract just read (a read in flight), the paper an open question's
   chosen answer was read from, and — nothing open — the question's summary */
function dscPaperLinksHtml(askId, cid){
  return `<button type="button" class="jb-way" data-dsc-open="${_rdE(cid)}" data-dsc-ask="${_rdE(askId)}">${_rdE(_rdT('dsc_l_open'))}</button><button type="button" class="jb-way" data-dsc-redline="${_rdE(cid)}" data-dsc-ask="${_rdE(askId)}">${_rdE(_rdT('dsc_l_redline'))}</button>`;
}
/* THE PAGE IS DRAWN AGAIN AS ANSWERS LAND (askcolumn.js calls this): at most every 400ms, at once where asked */
function discoverLive(now){
  if (typeof state === 'undefined' || state.view !== 'reads' || typeof document === 'undefined' || !document.querySelector('#rd-page.dsc-page')) return;
  if (_rd.table) return;
  if (_dsc.t){ if (!now) return; clearTimeout(_dsc.t); _dsc.t = 0; }
  _dsc.t = setTimeout(() => { _dsc.t = 0; if (state.view === 'reads' && !_rd.table) renderReads(); }, now ? 0 : 400);
}
/* THE ONE WAY IN: the Contracts list's Discover pill, "discover" typed, the Guide's row — all land here */
function discoverOpen(){
  _dsc.say = ''; _rd.table = null;
  if (!(typeof AC !== 'undefined' && AC.busy)){ _dsn.screen = 'list'; _dsn.cid = null; _dsn.picked = false; }
  if (state.view !== 'reads' && typeof setView === 'function') setView('reads'); else renderReads();
}
function dscSay(msg){ _dsc.say = String(msg || ''); renderReads(); }
/* ASK: what the box holds (typed words, a team question brought back, or a pack), of the list Contracts shows */
/* Go to the words on the contract's own paper (askColLandOn, the Stakes' lander); redlining opens the contract's
   Redlines through the one door (openRedlineWorkbench: its walls, its blanks question) once the paper is up */
function dscLand(askId, cid, redline){
  const A = _dscAC(), a = A ? ((A.ans[askId] || {})[cid] || null) : null;
  const quote = a && a.found ? String(a.quote || '') : '';
  if (typeof askColLandOn === 'function') askColLandOn(cid, quote); else if (typeof regOpenContract === 'function') regOpenContract(cid);
  if (!redline || typeof openRedlineWorkbench !== 'function') return;
  let n = 0;
  const tick = () => {
    const here = typeof pdContract === 'function' && pdContract() && String(pdContract().id) === String(cid) && document.getElementById('ig-canvas');
    if (here){ openRedlineWorkbench(cid); return; }
    if (++n < 40) setTimeout(tick, 100);
  };
  setTimeout(tick, 150);
}
/* ═══ THE NEW DISCOVER (owner, 14–15 Nov 2026; drawn on photos of the real pages, artifact V69F7v1fg4XdJw3eWcU8TG;
   "For start, use SAP way but the question should be at the top like in Legora way … Results SAP way", then "push both
   and build the new discover") ═══
   FOUR SCREENS, ONE ENGINE. (1) THE LANDING PAGE — every read the team has run, one dated row each (When · Question ·
   Where · Read · Found · By), filters Folder · Question · Asked by · When; a press chooses a read (its summary in the
   panel), a second press opens its results; New read is the one black button. (2) NEW READ — the question on top in one
   box with the one black button, packs and questions asked before as chips that only fill it, then Folder · Status ·
   Party and the folders to tick (All contracts, or any of them; how much each has been read before is a green bar);
   the panel adds the choice up. (3) WHILE IT READS — its own screen: the progress line, a table that fills one contract
   at a time, the paper just read in the panel, Stop; at the end, Open the results. (4) THE RESULTS — the answers of THAT
   ONE read: a full-width search bar, coloured tiles that filter, the table, the paper of the chosen row in the panel.
   The read is the same as ever (askColAskHere → askColReadRun: 50 or 100 at a time, Stop, nothing filed); what this adds
   is WHERE it was asked (AC.scope while Discover is in front; the read's record keeps `where` and `of`). */
const DSN_WHEN_DAYS = { d7: 7, d30: 30, d90: 90 };
const DSN_TILES = 4;
const _dsnTone = t => (t === 'none' || !t) ? 'gray' : t;
const _dsnChip = (t, w) => (typeof listChipHtml === 'function') ? listChipHtml(_dsnTone(t), w) : _rdE(w);
const _dsnLive = () => (typeof state !== 'undefined' && Array.isArray(state.contracts) ? state.contracts : [])
  .filter(c => c && c.id && !c.archived && !c._codeNamed && !(typeof jamboOnPress === 'function' && jamboOnPress(c)) && (typeof canAccessFolder !== 'function' || !c.folder || canAccessFolder(c.folder)));
const _dsnFolderName = fid => (typeof FOLDERS !== 'undefined' && FOLDERS[fid] && FOLDERS[fid].name) || fid;
const _dsnSigned = c => (typeof negoExecuted === 'function') ? !!negoExecuted(c) : c.status === 'Signed';
/* THE FOLDERS ONE CAN ASK: each with its live contracts, in the company's own order */
function dsnFolders(){
  const live = _dsnLive();
  return Object.keys((typeof FOLDERS !== 'undefined' && FOLDERS) || {}).filter(f => typeof canAccessFolder !== 'function' || canAccessFolder(f))
    .map(fid => ({ fid, name: _dsnFolderName(fid), cs: live.filter(c => c.folder === fid) })).filter(x => x.cs.length);
}
/* WHAT THE NEW READ GOES TO: the folders ticked (or all), narrowed by status and party, in the list's own order */
function dsnChosen(){
  const all = _dsn.pick.has('all') || !_dsn.pick.size;
  let cs = _dsnLive().filter(c => all || _dsn.pick.has(c.folder));
  if (_dsn.status === 'signed') cs = cs.filter(_dsnSigned); else if (_dsn.status === 'open') cs = cs.filter(c => !_dsnSigned(c));
  if (_dsn.party) cs = cs.filter(c => String(c.counterparty || '').trim() === _dsn.party);
  return { ids: cs.map(c => String(c.id)), where: all ? ['all'] : [..._dsn.pick] };
}
/* THE READS, ONE ROW EACH (the server's record, counted inside what this person may see) */
function dsnRuns(){
  const R = (typeof AC !== 'undefined' && AC.reads && Array.isArray(AC.reads.reads)) ? AC.reads.reads : [];
  return R.filter(r => r && r.n > 0 && Array.isArray(r.askIds) && r.askIds.length);
}
const dsnRun = id => dsnRuns().find(r => r.id === id) || null;
function dsnRunName(r){
  if (r.packId) return _rdT('rdn_pack', { name: r.packName || _rdT('dsn_pack'), n: r.askIds.length });
  const a = (typeof AC !== 'undefined' && AC.asks) ? AC.asks[r.askIds[0]] : null;
  return (r.names && r.names[0]) || (a && (a.name || a.question)) || _rdT('dsn_question');
}
const dsnRunQuestion = r => { const a = (typeof AC !== 'undefined' && AC.asks) ? AC.asks[r.askIds[0]] : null; return r.packId ? (r.names || []).join(' · ') : ((a && a.question) || ''); };
/* WHERE A READ WAS ASKED: the folders it was given (an older read, without them, says the folders its contracts are in) */
function dsnRunWhere(r){
  const w = Array.isArray(r.where) && r.where.length ? r.where : null;
  if (w && w.includes('all')) return _rdT('dsn_all_contracts');
  const fids = w || [...new Set((r.ids || []).map(id => { const c = typeof getContract === 'function' ? getContract(id) : null; return c && c.folder; }).filter(Boolean))];
  return fids.map(_dsnFolderName).join(', ') || '—';
}
/* how many were chosen: the record's own count */
function dsnRunOf(r){
  if (r.of) return r.of;
  /* an older read kept no count: its folders now, else every contract this person may see (as the old page counted) */
  const w = Array.isArray(r.where) && r.where.length && !r.where.includes('all') ? new Set(r.where) : null;
  return Math.max(r.n, w ? _dsnLive().filter(c => w.has(c.folder)).length : rdTotal());
}
/* THE ANSWERS OF ONE READ: its contracts, each with the answer to each of its questions (null while they load) */
function dsnRunRows(r){
  const got = r.askIds.map(k => rdnAnswers(k));
  if (got.some(g => !g)) return null;
  return (r.ids || []).map(id => ({ id, c: typeof getContract === 'function' ? getContract(id) : null, a: r.askIds.map((k, i) => got[i][id] || null) }))
    .filter(x => x.c && x.a.some(Boolean));
}
/* WHAT A READ FOUND, in one chip: the risky first, then the unclear, else nothing unusual */
function dsnFound(rows){
  if (!rows) return '';
  const t = rows.map(x => x.a.map((a, i) => a ? _rdTone(a) : '')).flat();
  const ruby = t.filter(x => x === 'ruby').length, amber = t.filter(x => x === 'amber').length;
  return ruby ? _dsnChip('ruby', _rdTn('dsn_look', ruby)) : amber ? _dsnChip('amber', _rdTn('dsn_unclear', amber)) : _dsnChip('green', _rdT('dsn_nothing'));
}
/* THE ANSWERS GROUPED BY WHAT THEY SAY (the tiles and the panel): biggest first, Not found last */
/* THE TILES' COLOURS (owner, 15 Nov 2026: "only one card is showing … they are all grey"): ruby, amber and green keep
   their meaning; one question's plain facts (Sweden, Kenya, 30 days) each take a quiet colour of their own, the biggest
   first, and the chip in the table wears its tile's colour. A PACK is tiled by what the read found across its questions:
   To look at · Unclear · Nothing unusual · Not found (each contract in exactly one). */
const DSN_FACT_TONES = ['violet', 'pink', 'steel'];
const _dsnMeans = t => ['ruby', 'amber', 'green', 'steel'].includes(t);
function dsnGroups(rows){
  if (!rows) return [];
  if (rows.length && rows[0].a.length > 1){
    const B = { risk: [], amber: [], ok: [], none: [] };
    rows.forEach(x => { const t = x.a.map(a => a ? _rdTone(a) : 'none');
      (t.includes('ruby') ? B.risk : t.includes('amber') ? B.amber : x.a.some(a => a && a.found && !a.noWording) ? B.ok : B.none).push(x.id); });
    return [['risk', 'dsn_t_look', 'ruby'], ['amber', 'dsn_t_unclear', 'amber'], ['ok', 'dsn_nothing', 'green'], ['none', 'ac_not_found', 'gray']]
      .filter(([k]) => B[k].length).map(([k, w, c]) => ({ k: 'g:' + k, l: _rdT(w), n: B[k].length, t: c, c, ids: B[k] }));
  }
  const by = new Map();
  rows.forEach(x => { const a = x.a[0]; const found = a && a.found && !a.noWording; const l = found ? String(a.answer || '').trim() || _rdT('ac_not_found') : _rdT('ac_not_found');
    const k = found ? 'g:' + l.toLowerCase() : 'g:none'; const g = by.get(k) || { k, l, n: 0, t: found ? _rdTone(a) : 'none', ids: [] }; g.n++; g.ids.push(x.id); by.set(k, g); });
  const G = [...by.values()], nf = G.filter(g => g.k === 'g:none'), rest = G.filter(g => g.k !== 'g:none').sort((a, b) => _dscRank(a.t) - _dscRank(b.t) || b.n - a.n);
  let f = 0;
  rest.forEach((g, i) => { g.c = _dsnMeans(g.t) ? g.t : (i < DSN_TILES && f < DSN_FACT_TONES.length ? DSN_FACT_TONES[f++] : 'gray'); });
  nf.forEach(g => { g.c = 'gray'; });
  const out = rest.slice(0, DSN_TILES).concat(nf);
  out.toneOf = new Map(G.map(g => [g.k, g.c]));
  return out;
}
/* the colour one answer's chip wears: its tile's (one question), its meaning or quiet grey (a pack) */
function dsnChipTone(a, G){
  if (!a || !a.found || a.noWording) return 'gray';
  const k = 'g:' + (String(a.answer || '').trim() || _rdT('ac_not_found')).toLowerCase();
  if (G && G.toneOf && G.toneOf.has(k)) return G.toneOf.get(k);
  const t = _rdTone(a); return _dsnMeans(t) ? t : 'gray';
}
/* SORT BY A COLUMN (owner, 15 Nov 2026: "sort the columns by pressing on the header"): a press sorts A to Z, the same
   press again Z to A; until one is pressed the risky answers lead */
const dsnSortTh = (k, w) => { const on = _dsn.sort && _dsn.sort.k === k, d = on ? _dsn.sort.dir : 0;
  return `<th${on ? ` aria-sort="${d > 0 ? 'ascending' : 'descending'}"` : ''}><button type="button" class="dsn-th${on ? ' is-on' : ''}${d < 0 ? ' is-desc' : ''}" data-dsn-sort="${_rdE(k)}" title="${_rdE(_rdT('dsn_sort_tip', { col: w }))}"><span>${_rdE(w)}</span><i aria-hidden="true"></i></button></th>`; };
function dsnSortVal(x, k){
  if (k === 'name') return _rdName(x.c);
  if (k === 'no') return _rdRef(x.c);
  if (k === 'party') return _dsnParty(x.c);
  if (k === 'folder') return _dsnFolderName(x.c.folder);
  if (k === 'says'){ const a = x.a[0]; return a && a.found ? ((typeof askColClauseNo === 'function' ? askColClauseNo(a) : '') + ' ' + (a.quote || '')) : '\uffff'; }
  const i = k === 'ans' ? 0 : Number(String(k).slice(1)), a = x.a[i];
  return a && a.found && !a.noWording ? _rdWord(a) : '\uffff';
}
const dsnSteps = on => `<div class="dsn-steps" aria-hidden="true">${['dsn_step_q', 'dsn_step_where', 'dsn_step_read', 'dsn_step_res'].map((k, i) => `${i ? '<em></em>' : ''}<span class="${i === on ? 'is-on' : i < on ? 'is-done' : ''}"><i>${i < on ? '✓' : i + 1}</i>${_rdE(_rdT(k))}</span>`).join('')}</div>`;
const dsnSel = (key, label, opts, cur) => `<label class="dsn-f"><span>${_rdE(label)}</span><select data-dsn-f="${key}">${opts.map(([v, w]) => `<option value="${_rdE(v)}"${v === cur ? ' selected' : ''}>${_rdE(w)}</option>`).join('')}</select></label>`;
const dsnPage = (inner, cls) => `<div class="view-enter sap-page ap-page is-ins apn-page cun-page rdn-page dsc-page dsn-page${cls ? ' ' + cls : ''}" id="rd-page" data-ins-page="reads" data-ins="1" data-dsn-screen="${_dsn.screen}">
    <div class="ap-body is-ins"><section class="ap-card apn-card dsn-card">${inner}</section><aside id="ins-panel" class="ins-panel" aria-label="${_rdE(_rdT('rd_panel_label'))}"></aside></div></div>`;

/* (1) THE LANDING PAGE */
function dsnListShown(){
  const f = _dsn.f, now = Date.now(), days = DSN_WHEN_DAYS[f.when];
  return dsnRuns().filter(r => (!f.folder || (Array.isArray(r.where) ? (r.where.includes(f.folder) || r.where.includes('all')) : (r.ids || []).some(id => { const c = getContract(id); return c && c.folder === f.folder; })))
    && (!f.ask || r.askIds.includes(f.ask) || r.packId === f.ask) && (!f.by || r.byId === f.by)
    && (!days || now - Date.parse(r.last || r.at) <= days * 864e5));
}
function dsnListHtml(){
  const runs = dsnRuns(), shown = dsnListShown(), qs = new Set(runs.flatMap(r => r.askIds));
  if (_dsn.sel && !shown.some(r => r.id === _dsn.sel)) _dsn.sel = null;
  if (!_dsn.sel && shown[0]) _dsn.sel = shown[0].id;
  const asks = [...new Map(runs.map(r => [r.packId || r.askIds[0], dsnRunName(r)])).entries()];
  const people = [...new Map(runs.map(r => [r.byId, r.by])).entries()].filter(([k]) => k);
  const filters = `<div class="dsn-fs">${dsnSel('folder', _rdT('dsn_f_folder'), [['', _rdT('dsn_f_all_folders')]].concat(dsnFolders().map(x => [x.fid, x.name])), _dsn.f.folder)}
    ${dsnSel('ask', _rdT('dsn_f_question'), [['', _rdT('dsn_f_all_questions')]].concat(asks), _dsn.f.ask)}
    ${dsnSel('by', _rdT('dsn_f_by'), [['', _rdT('dsn_f_anyone')]].concat(people), _dsn.f.by)}
    ${dsnSel('when', _rdT('dsn_f_when'), [['all', _rdT('dsn_f_any_time')], ['d7', _rdT('dsn_f_7')], ['d30', _rdT('dsn_f_30')], ['d90', _rdT('dsn_f_90')]], _dsn.f.when)}</div>`;
  const row = r => `<tr class="dsn-row${r.id === _dsn.sel ? ' is-sel' : ''}" data-dsn-run="${_rdE(r.id)}" tabindex="0"><td class="rdn-c">${_rdE(rdWhen(r.last || r.at))}</td><td><div class="cun-name">${_rdE(dsnRunName(r))}</div></td>
    <td class="rdn-c">${_rdE(dsnRunWhere(r))}</td><td class="rdn-c">${_rdE(_rdT('rdn_of', { k: r.n, n: dsnRunOf(r) }))}</td><td class="rdn-c">${dsnFound(dsnRunRows(r)) || '…'}</td><td class="rdn-c">${_rdE(r.by || '')}</td></tr>`;
  const body = shown.length ? shown.map(row).join('') : `<tr><td colspan="6" class="apn-none">${_rdE(_rdT(runs.length ? 'dsn_none_here' : 'dsn_none'))}</td></tr>`;
  return `<div class="cun-head rdn-head"><h2 class="ctf-h">${_rdE(_rdT('nav_reads'))}</h2><span class="ctf-hf">${_rdE(_rdTn('dsn_facts', runs.length, { q: qs.size }))}</span><span class="apn-sp"></span>
      <button type="button" class="ui-btn ui-btn-primary" id="dsn-new">${_rdE(_rdT('dsn_new'))}</button></div>${filters}
    <div class="cu-scroll"><table class="apn-table cun-table rdn-table dsn-table"><colgroup><col style="width:14%" data-floor="100"><col style="width:24%" data-floor="150"><col style="width:18%" data-floor="120"><col style="width:12%" data-floor="70"><col style="width:16%" data-floor="110"><col style="width:16%" data-floor="100"></colgroup>
      <thead><tr><th>${_rdE(_rdT('dsn_c_when'))}</th><th>${_rdE(_rdT('rdn_c_q'))}</th><th>${_rdE(_rdT('dsn_c_where'))}</th><th>${_rdE(_rdT('rd_col_read'))}</th><th>${_rdE(_rdT('dsn_c_found'))}</th><th>${_rdE(_rdT('dsn_c_by'))}</th></tr></thead>
      <tbody>${body}</tbody></table></div>
    <div class="apn-foot rdn-foot"><span>${_rdE(_rdT('dsn_list_foot'))}</span></div>`;
}
function dsnListPanel(){
  const r = _dsn.sel ? dsnRun(_dsn.sel) : null;
  const row = (k, v) => `<div class="rfp-row"><span class="rfp-k">${_rdE(k)}</span><span class="rfp-v">${v}</span></div>`;
  let body = `<p class="ac-nl-hint">${_rdE(_rdT('dsn_panel_none'))}</p>`;
  if (r){
    const rows = dsnRunRows(r), G = dsnGroups(rows), left = Math.max(0, dsnRunOf(r) - r.n), may = _dscMay();
    const ask = (typeof AC !== 'undefined' && AC.asks) ? AC.asks[r.askIds[0]] : null;
    const keep = may && !r.packId && ask && !ask.fact ? `<button type="button" class="rfp-pill" data-dsn-keep="${ask.kept ? '0' : '1'}">${_rdE(_rdT(ask.kept ? 'ac_keep_off' : 'ac_keep_on'))}</button>` : '';
    body = `<p class="ac-nl-q">${_rdE(dsnRunName(r))}</p>${dsnRunQuestion(r) ? `<p class="ac-nl-hint">${_rdE(dsnRunQuestion(r))}</p>` : ''}
      <div class="rfp-cap">${_rdE(_rdT('dsn_this_read'))}</div>${row(_rdT('dsn_c_when'), _rdE(rdWhen(r.last || r.at)))}${row(_rdT('dsn_c_where'), _rdE(dsnRunWhere(r)))}${row(_rdT('rd_col_read'), _rdE(_rdT('rdn_of', { k: r.n, n: dsnRunOf(r) })))}
      ${G.length ? `<div class="rfp-cap">${_rdE(_rdT('ac_nl_answers'))}</div>` + G.map(g => row(g.l, String(g.n))).join('') : ''}
      <div class="rfp-acts"><button type="button" class="ui-btn ui-btn-primary" data-dsn-open="${_rdE(r.id)}">${_rdE(_rdT('dsn_open_results'))}</button>${left && may ? `<button type="button" class="rfp-pill" data-dsn-more="${_rdE(r.id)}">${_rdE(_rdT('dsn_read_left', { n: left }))}</button>` : ''}${keep}${may && !r.packId ? `<button type="button" class="rfp-pill" data-dsn-del="${_rdE(r.id)}">${_rdE(_rdT('rdn2_delete'))}</button>` : ''}</div>`;
  }
  return body;
}
/* (2) NEW READ */
function dsnTeamRead(cs){
  const rows = (_rd.rows || []).filter(r => !r.pack);
  let k = 0, q = 0;
  const ids = new Set(cs.map(c => String(c.id))), hit = new Set();
  rows.forEach(r => { const got = rdnAnswers(r.askIds[0]); if (!got) return; let any = false; Object.keys(got).forEach(id => { if (ids.has(id) && got[id]){ hit.add(id); any = true; } }); if (any) q++; });
  k = hit.size;
  return { k, q, n: cs.length };
}
function dsnPlan(ids){
  const size = _dscSize(); let unread = ids.length;
  try {
    /* words typed that are a question already asked count as that question (the read would read only what it has not) */
    const key = q => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase(), A = _dscAC();
    const same = !_dsc.askId && _dsc.q && A && A.asks ? Object.values(A.asks).find(x => x && key(x.question) === key(_dsc.q)) : null;
    const askIds = _dsc.pack ? ((typeof askColPackAskIds === 'function') ? askColPackAskIds(_dsc.pack) : []) : (_dsc.askId ? [_dsc.askId] : same ? [same.id] : []);
    if (askIds.length && typeof askColUnread === 'function') unread = askColUnread(askIds, ids).length;
  } catch (_){ unread = ids.length; }
  return { size, unread, pick: Math.min(size, unread) };
}
function dsnNewHtml(){
  const A = _dscAC(), may = _dscMay(), F = dsnFolders(), ch = dsnChosen(), p = dsnPlan(ch.ids);
  const packOn = !!_dsc.pack;
  const val = packOn ? _rdT('rdn_pack', { name: _dsc.pack.name, n: (_dsc.pack.questions || []).length }) : (_dsc.q || '');
  const label = !ch.ids.length ? _rdT('dsn_choose') : !p.unread ? _rdT('dsc_ask_all_read', { n: ch.ids.length }) : p.unread <= p.size ? _rdTn('dsn_read_n', p.unread) : _rdT('dsn_read_first', { k: p.pick });
  const off = !may || !ch.ids.length || !p.unread || _dsc.starting;
  const packs = dsnPackRowHtml();
  const team = (_rd.rows || []).filter(r => !r.pack && r.q && !(typeof askColIsPortfolio === 'function' && askColIsPortfolio(r.q))).slice(0, DSC_CHIPS)
    .map(r => `<button type="button" class="rfp-pill dsc-chip${_dsc.askId === r.askIds[0] ? ' is-on' : ''}" data-dsc-q="${_rdE(r.askIds[0])}" title="${_rdE(r.q)}">${_rdE(r.name || r.q)}</button>`).join('');
  const parties = [...new Set(_dsnLive().filter(c => _dsn.pick.has('all') || _dsn.pick.has(c.folder)).map(c => String(c.counterparty || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const one = !_dsn.pick.has('all') && _dsn.pick.size === 1 ? [..._dsn.pick][0] : '';
  const filters = `<div class="dsn-fs">${dsnSel('nfolder', _rdT('dsn_f_folder'), [['', _rdT('dsn_f_all_folders')]].concat(F.map(x => [x.fid, x.name])), one)}
    ${dsnSel('status', _rdT('dsn_f_status'), [['all', _rdT('dsn_f_all')], ['signed', _rdT('dsn_f_signed')], ['open', _rdT('dsn_f_open')]], _dsn.status)}
    ${dsnSel('party', _rdT('dsn_f_party'), [['', _rdT('dsn_f_any_party')]].concat(parties.map(x => [x, x])), _dsn.party)}</div>`;
  const ck = on => `<span class="dsn-ck${on ? ' is-on' : ''}" aria-hidden="true">${on ? '✓' : ''}</span>`;
  const need = cs => cs.filter(c => { try { return (typeof needsYouOf === 'function' ? needsYouOf(c) : []).length > 0; } catch (_){ return false; } }).length;
  const line = (key, name, cs) => { const on = key === 'all' ? _dsn.pick.has('all') : _dsn.pick.has(key), T = dsnTeamRead(cs), nd = need(cs);
    return `<tr class="dsn-row${on ? ' is-sel' : ''}" data-dsn-pick="${_rdE(key)}" tabindex="0" role="checkbox" aria-checked="${on}"><td>${ck(on)}</td><td><div class="cun-name">${_rdE(name)}</div></td><td class="rdn-c">${cs.length}</td><td class="rdn-c">${nd || '—'}</td>
      <td class="rdn-c"><span class="dsn-read"><span class="rdn-prog" aria-hidden="true"><i style="width:${T.n ? Math.round(T.k / T.n * 100) : 0}%"></i></span>${_rdE(T.q ? _rdTn('dsn_questions', T.q) : _rdT('dsn_nothing_asked'))}</span></td></tr>`; };
  return `<div class="cun-head rdn-head"><button type="button" class="ac-link dsn-back" data-dsn-back>${_rdE(_rdT('dsn_back'))}</button><h2 class="ctf-h">${_rdE(_rdT('dsn_new'))}</h2></div>${dsnSteps(0)}
    <div class="dsc-ask dsn-ask">${typeof icon === 'function' ? icon('sparkle', 'w-4 h-4') : ''}<input id="dsc-q" class="dsc-in" type="text" autocomplete="off" spellcheck="true" aria-label="${_rdE(_rdT('dsc_ph'))}" placeholder="${_rdE(_rdT('dsc_ph'))}" value="${_rdE(val)}"${packOn || !may ? ' readonly' : ''}>
      ${packOn ? `<button type="button" class="rfp-a" data-dsc-unpack>${_rdE(_rdT('dsc_unpack'))}</button>` : ''}<button type="button" class="dsc-btn" id="dsc-go"${off ? ' disabled' : ''}${may ? '' : ` title="${_rdE(_rdT('ac_btn_viewer'))}"`}>${_rdE(label)}</button></div>
    ${_dsc.say ? `<div class="dsc-say" role="status">${_rdE(_dsc.say)}</div>` : ''}
    <div class="dsc-chips">${packs ? `<span class="dsc-quiet">${_rdE(_rdT('dsn_or_pack'))}</span>${packs}` : ''}${team ? `<span class="dsc-quiet">${_rdE(_rdT('dsn_asked_before'))}</span>${team}` : ''}</div>
    ${filters}
    <div class="cu-scroll"><table class="apn-table cun-table rdn-table dsn-table"><colgroup><col style="width:6%" data-floor="36"><col style="width:30%" data-floor="160"><col style="width:14%" data-floor="80"><col style="width:14%" data-floor="80"><col style="width:36%" data-floor="220"></colgroup>
      <thead><tr><th></th><th>${_rdE(_rdT('dsn_f_folder'))}</th><th>${_rdE(_rdT('dsn_c_contracts'))}</th><th>${_rdE(_rdT('dsn_c_need'))}</th><th>${_rdE(_rdT('dsn_c_read_before'))}</th></tr></thead>
      <tbody>${line('all', _rdT('dsn_all_contracts'), _dsnLive())}${F.map(x => line(x.fid, x.name, x.cs)).join('')}</tbody></table></div>`;
}
function dsnNewPanel(){
  const ch = dsnChosen(), p = dsnPlan(ch.ids), row = (k, v) => `<div class="rfp-row"><span class="rfp-k">${_rdE(k)}</span><span class="rfp-v">${_rdE(v)}</span></div>`;
  const where = ch.where.includes('all') ? row(_rdT('dsn_all_contracts'), String(ch.ids.length))
    : ch.where.map(fid => row(_dsnFolderName(fid), String(dsnChosenIn(fid)))).join('');
  return `<div class="rfp-cap">${_rdE(_rdT('dsn_your_read'))}</div>${row(_rdT('dsn_chosen'), String(ch.ids.length))}
    ${row(_rdT('dsn_read_now'), p.unread > p.size ? _rdT('dsn_first_n', { n: p.size }) : String(p.unread))}${row(_rdT('dsn_left_later'), String(Math.max(0, p.unread - p.size)))}
    <div class="rfp-cap">${_rdE(_rdT('dsn_c_where'))}</div>${where}
    ${ch.where.includes('all') ? '' : `<div class="rfp-acts"><button type="button" class="rfp-pill" data-dsn-clear>${_rdE(_rdT('dsn_clear'))}</button></div>`}`;
}
/* BUILD A PACK (owner, 15 Nov 2026: "you curate your bundle of due diligence questions coming from your standards …
   There should only be one pack at a time. So you build a new pack, due diligence falls off into a drop down"). The row
   shows ONE pack — the one this person last built or chose (kept in this browser only, a convenience), else Due
   diligence; its name asks it, the arrow beside it opens the others with + Build a pack and Manage packs at the foot.
   Building and managing happen in Jambo's panel on New read. The questions offered come from OUR STANDARDS (the
   playbook's books, read here, never written), each showing the standard it checks — read again from the standards as
   they stand, so a changed standard changes the note, never the question; a person may add their own. A pack holds
   what one read answers (DSN_PACK_MAX = the server's COLUMN_Q_MAX); the server is the wall (POST/PUT/DELETE
   /api/columns/packs: its builder or an admin; the built-in pack changed, never deleted). */
const DSN_PACK_MAX = 8, DSN_PACK_KEY = 'hati.v1.dsnPack';
const _dsnStop = e => { e.preventDefault(); e.stopPropagation(); };
const _dsnPkKey = q => String(q || '').trim().replace(/\s+/g, ' ').toLowerCase();
/* the plain question each kind of standard asks of a paper; a standard not named here asks the general one */
const DSN_STD_Q = {
  'governing law': ["Which country's law governs this contract?", 'Governing law'],
  'data protection': ['Does the other side process personal data for us, and are there processing terms?', 'Personal data'],
  'liability cap': ['Is our liability capped, and at what?', 'Liability cap'],
  'payment terms': ['When must we pay an invoice under this contract?', 'Payment days'],
  'quality & rejection': ['Is there an agreed product specification and a window to reject goods?', 'Quality'],
  'confidentiality': ['How long does the duty to keep things confidential last?', 'Confidentiality'],
  'stamp duty': ['Has stamp duty been assessed and paid?', 'Stamp duty'],
};
function dsnStdQuestions(){
  let pb = {}; try { pb = (typeof playbook === 'function' ? playbook() : null) || (typeof DEFAULT_PLAYBOOK === 'object' ? DEFAULT_PLAYBOOK : {}) || {}; } catch (_){ pb = {}; }
  const seen = new Set(), groups = [];
  for (const k of Object.keys(pb)){
    const book = pb[k] || {}, items = [];
    let pos = [], rng = []; try { pos = book.positions || []; rng = book.ranges || []; } catch (_){ pos = []; rng = []; }
    const add = (cat, std) => { const c = String(cat || '').trim(); if (!c) return;
      const m = DSN_STD_Q[c.toLowerCase()], question = m ? m[0] : `What does this contract say about ${c.toLowerCase()}?`, key = _dsnPkKey(question);
      if (seen.has(key)) return; seen.add(key); items.push({ question, name: (m ? m[1] : c).slice(0, 40), std: (c + ' · ' + std).slice(0, 80), key }); };
    pos.forEach(x => { let note = ''; try { note = x.note || ''; } catch (_){ note = ''; } add(x.category, note || _rdT('std_' + (x.pos || 'preferred'))); });
    rng.forEach(x => add(x.label, x.note || (x.op + ' ' + x.value)));
    if (items.length) groups.push({ label: String(book.label || k), items });
  }
  return groups;
}
const _dsnPacks = () => { const A = _dscAC(); return (A && A.packs) || []; };
function dsnPackCur(){
  const P = _dsnPacks(); let id = '';
  try { id = localStorage.getItem(DSN_PACK_KEY) || ''; } catch (_){ id = ''; }
  return P.find(p => p.id === id) || P.find(p => p.builtin) || P[0] || null;
}
const dsnPackCurSet = id => { try { localStorage.setItem(DSN_PACK_KEY, id || ''); } catch (_){ /* this browser keeps nothing */ } };
const dsnPackMay = p => { const u = typeof currentUser === 'function' ? currentUser() : null; if (!u || !_dscMay()) return false;
  return u.role === 'admin' || (!p.builtin && String(p.by || '') === String(u.id)); };
function dsnPackRowHtml(){
  const cur = dsnPackCur(); if (!cur) return '';
  const on = !!(_dsc.pack && _dsc.pack.id === cur.id), open = !!_dsn.pkMenu, P = _dsnPacks(), may = _dscMay();
  const menu = open ? `<div class="dsn-pk-dd" role="menu"><div class="dsn-pk-h">${_rdE(_rdT('dsn_pk_packs'))}</div>${P.map(p => `<button type="button" role="menuitem" class="dsn-pk-i${p.id === cur.id ? ' is-on' : ''}" data-dsn-pkpick="${_rdE(p.id)}"><span class="dsn-pk-n">${_rdE(p.name)}</span><span class="dsn-pk-k">${(p.questions || []).length}</span></button>`).join('')}
    ${may ? `<hr><button type="button" role="menuitem" class="dsn-pk-i is-link" data-dsn-pkbuild>${_rdE(_rdT('dsn_pk_build'))}</button><button type="button" role="menuitem" class="dsn-pk-i is-link" data-dsn-pkmanage>${_rdE(_rdT('dsn_pk_manage'))}</button>` : ''}</div>` : '';
  return `<span class="dsn-pk${on ? ' is-on' : ''}${_dsn.pkFresh === cur.id ? ' is-fresh' : ''}"><button type="button" class="dsn-pk-a" data-dsc-pack="${_rdE(cur.id)}">${_rdE(_rdT('rdn_pack', { name: cur.name, n: (cur.questions || []).length }))}</button><button type="button" class="dsn-pk-v" data-dsn-pkmenu aria-haspopup="menu" aria-expanded="${open}" aria-label="${_rdE(_rdT('dsn_pk_more'))}"></button>${menu}</span>`;
}
/* the builder's state: what is ticked (by its words), the name, the line being typed, a refusal said in place */
function dsnPackStart(p){
  const qs = new Map(((p && p.questions) || []).map(x => [_dsnPkKey(x.question), { question: x.question, name: x.name, std: x.std || '' }]));
  _dsn.pk = { mode: 'build', id: p ? p.id : null, name: p ? p.name : '', qs, own: '', say: '' }; _dsn.pkMenu = false;
}
function dsnPackPanel(){
  const K = _dsn.pk, tick = on => `<span class="dsn-ck${on ? ' is-on' : ''}" aria-hidden="true">${on ? '✓' : ''}</span>`;
  if (K.mode === 'manage'){
    const P = _dsnPacks();
    const row = p => { const may = dsnPackMay(p), sub = p.builtin ? _rdTn('dsn_pk_n_builtin', (p.questions || []).length) : [_rdTn('dsn_questions', (p.questions || []).length), p.byName, p.at ? rdWhen(p.at) : ''].filter(Boolean).join(' · ');
      return `<div class="dsn-pkm-row"><div class="dsn-pkm-n"><b>${_rdE(p.name)}</b><span>${_rdE(sub)}</span></div>${may ? `<button type="button" class="ac-link" data-dsn-pkedit="${_rdE(p.id)}">${_rdE(_rdT('dsn_pk_edit'))}</button>` : ''}${may && !p.builtin ? `<button type="button" class="ac-link is-danger" data-dsn-pkdel="${_rdE(p.id)}">${_rdE(_rdT('dsn_pk_delete'))}</button>` : ''}</div>`; };
    return `<div class="rfp-cap">${_rdE(_rdT('dsn_pk_packs'))}</div>${P.map(row).join('')}
      <div class="dsn-pk-foot"><span class="dsn-pk-count">${_rdE(_rdTn('dsn_pk_n_packs', P.length))}</span><button type="button" class="rfp-pill" data-dsn-pkcancel>${_rdE(_rdT('dsn_pk_close'))}</button>${_dscMay() ? `<button type="button" class="ui-btn ui-btn-primary" data-dsn-pkbuild>${_rdE(_rdT('dsn_pk_build'))}</button>` : ''}</div>`;
  }
  const n = K.qs.size, full = n >= DSN_PACK_MAX, G = dsnStdQuestions(), fromStd = new Set();
  const line = (x, std) => { const on = K.qs.has(x.key || _dsnPkKey(x.question)), off = !on && full;
    return `<button type="button" class="dsn-pkq${on ? ' is-on' : ''}" data-dsn-pkq="${_rdE(x.key || _dsnPkKey(x.question))}"${off ? ' disabled' : ''} role="checkbox" aria-checked="${on}">${tick(on)}<span class="dsn-pkq-t"><b>${_rdE(x.question)}</b><span>${_rdE(std)}</span></span></button>`; };
  const groups = G.map(g => `<div class="rfp-cap">${_rdE(_rdT('dsn_pk_from_std', { book: g.label }))}</div>${g.items.map(x => { fromStd.add(x.key); return line(x, x.std); }).join('')}`).join('');
  const own = [...K.qs.entries()].filter(([k]) => !fromStd.has(k)).map(([k, x]) => line(Object.assign({ key: k }, x), x.std || _rdT('dsn_pk_yours'))).join('');
  return `<div class="rfp-cap">${_rdE(_rdT('dsn_pk_name'))}</div><input id="dsn-pk-name" class="dsn-pk-in" type="text" maxlength="40" autocomplete="off" placeholder="${_rdE(_rdT('dsn_pk_name_ph'))}" value="${_rdE(K.name)}">
    ${groups}${own ? `<div class="rfp-cap">${_rdE(_rdT('dsn_pk_own'))}</div>${own}` : ''}
    <div class="dsn-pk-ownbox"><input id="dsn-pk-own" class="dsn-pk-in" type="text" maxlength="300" autocomplete="off" placeholder="${_rdE(_rdT('dsn_pk_own_ph'))}" value="${_rdE(K.own)}"${full ? ' disabled' : ''}><button type="button" class="rfp-pill" data-dsn-pkadd${full ? ' disabled' : ''}>${_rdE(_rdT('dsn_pk_add'))}</button></div>
    ${full ? `<p class="dsn-pk-say" role="status">${_rdE(_rdT('dsn_pk_full', { n: DSN_PACK_MAX }))}</p>` : ''}${K.say ? `<p class="dsn-pk-say" role="alert">${_rdE(K.say)}</p>` : ''}
    <div class="dsn-pk-foot"><span class="dsn-pk-count">${_rdE(_rdT('dsn_pk_count', { n, max: DSN_PACK_MAX }))}</span><button type="button" class="rfp-pill" data-dsn-pkcancel>${_rdE(_rdT('dsn_pk_cancel'))}</button><button type="button" class="ui-btn ui-btn-primary" data-dsn-pksave${n && K.name.trim() ? '' : ' disabled'}>${_rdE(_rdT('dsn_pk_save'))}</button></div>`;
}
async function dsnPackSave(){
  const K = _dsn.pk; if (!K || K.busy) return;
  const body = { name: K.name.trim(), questions: [...K.qs.values()].map(x => ({ question: x.question, name: x.name, std: x.std || '' })) };
  K.busy = true;
  try {
    const r = await api(K.id ? 'columns/packs/' + encodeURIComponent(K.id) : 'columns/packs', K.id ? 'PUT' : 'POST', body);
    const p = r && r.pack; if (!p) throw new Error('');
    const A = _dscAC(); if (A){ A.packs = (A.packs || []).filter(x => x.id !== p.id).concat([p]); }
    dsnPackCurSet(p.id); _dsn.pkFresh = p.id; setTimeout(() => { if (_dsn.pkFresh === p.id){ _dsn.pkFresh = null; if (state.view === 'reads') renderReads(); } }, 1600);
    const made = !K.id; _dsn.pk = null;
    toast(_rdT(made ? 'dsn_pk_saved' : 'dsn_pk_changed', { name: p.name, n: (p.questions || []).length }), 'ok', made ? { action: { label: _rdT('dsn_pk_undo'), onClick: () => dsnPackDelete(p, { quiet: true }) } } : undefined);
  } catch (e){ K.say = (e && e.message) || _rdT('dsn_pk_fail'); K.busy = false; }
  renderReads();
}
async function dsnPackDelete(p, o){
  if (!p) return;
  if (!(o && o.quiet)){
    const yes = (typeof confirmDialog === 'function') ? await confirmDialog({ title: _rdT('dsn_pk_del_title', { name: p.name }), message: _rdT('dsn_pk_del_body'), confirmLabel: _rdT('dsn_pk_delete'), danger: true }) : true;
    if (!yes) return;
  }
  try { await api('columns/packs/' + encodeURIComponent(p.id), 'DELETE'); }
  catch (e){ toast((e && e.message) || _rdT('dsn_pk_fail'), 'err'); return; }
  const A = _dscAC(); if (A) A.packs = (A.packs || []).filter(x => x.id !== p.id);
  if (_dsc.pack && _dsc.pack.id === p.id) _dsc.pack = null;
  /* the pack in the row gone: the one most recently built takes its place, else the built-in one */
  const cur = (() => { try { return localStorage.getItem(DSN_PACK_KEY); } catch (_){ return ''; } })();
  if (cur === p.id){ const next = _dsnPacks().filter(x => !x.builtin).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0]; dsnPackCurSet(next ? next.id : ''); }
  if (!(o && o.quiet)) toast(_rdT('dsn_pk_deleted', { name: p.name }), 'ok', { action: { label: _rdT('dsn_pk_undo'), onClick: () => dsnPackRestore(p) } });
  renderReads();
}
function dsnPackAddOwn(){
  const K = _dsn.pk; if (!K) return;
  const q = String(K.own || '').trim().replace(/\s+/g, ' ');
  if (q.length < 3){ K.say = _rdT('dsc_say_short'); renderReads(); return; }
  if (typeof askColIsPortfolio === 'function' && askColIsPortfolio(q)){ K.say = _rdT('dsn_pk_portfolio'); renderReads(); return; }
  if (K.qs.size >= DSN_PACK_MAX) return;
  K.qs.set(_dsnPkKey(q), { question: q, name: q.slice(0, 40), std: '' }); K.own = ''; K.say = ''; renderReads();
  setTimeout(() => { const o = document.getElementById('dsn-pk-own'); if (o) o.focus({ preventScroll: true }); }, 0);
}
async function dsnPackRestore(p){
  try { const r = await api('columns/packs', 'POST', { id: p.id, name: p.name, questions: p.questions });
    const A = _dscAC(); if (A && r && r.pack) A.packs = (A.packs || []).filter(x => x.id !== p.id).concat([r.pack]); }
  catch (e){ toast((e && e.message) || _rdT('dsn_pk_fail'), 'err'); }
  renderReads();
}
const dsnChosenIn = fid => { const ids = new Set(dsnChosen().ids); return _dsnLive().filter(c => c.folder === fid && ids.has(String(c.id))).length; };
/* (3) WHILE IT READS */
function dsnReadingHtml(){
  const A = _dscAC(), b = A && A.busy, D = _dsn.done || {};
  const name = b ? (b.name || b.question || '') : (D.name || '');
  const askId = b ? (b.askId || (b.asks || [])[0]) : D.askId, got = (askId && A && A.ans[askId]) || {};
  const doneIds = b ? (b.doneIds || []).filter(id => got[id]) : (((_dsn.run && dsnRun(_dsn.run)) || {}).ids || []).filter(id => got[id]);
  const k = b ? b.done : (D.k || doneIds.length), n = b ? b.total : (D.n || k);
  const right = b ? `<button type="button" class="rfp-pill" id="dsc-stop">${_rdE(_rdT('ac_stop'))}</button>`
    : D.stopped && A && A.stopped ? `<button type="button" class="rfp-pill" id="dsc-carry">${_rdE(_rdT('dsc_carry', { n: (A.stopped.left || []).length }))}</button><button type="button" class="ui-btn ui-btn-primary" data-dsn-results>${_rdE(_rdT('dsn_open_results'))}</button>`
    : `<button type="button" class="ui-btn ui-btn-primary" data-dsn-results>${_rdE(_rdT('dsn_open_results'))}</button>`;
  const _gc = id => (typeof getContract === 'function' ? getContract(id) : null);
  const L = dsnLeadCols(((b && Array.isArray(b.all)) ? b.all : doneIds).map(_gc).filter(Boolean)); _dsn.readLead = L;
  const rows = doneIds.slice(b ? -DSN_ROWS_SHOWN : 0).map(id => { const c = _gc(id), a = got[id];
    const num = a && typeof askColClauseNo === 'function' ? askColClauseNo(a) : '', quote = a && a.found ? String(a.quote || '').trim() : '';
    return `<tr class="dsn-row${id === _dsc.liveCid ? ' is-sel' : ''}">${L.map(l => l.td(c, id)).join('')}<td class="rdn-c">${a ? _dsnChip(_rdTone(a, askId), _rdWord(a)) : ''}</td>
      <td class="rdn-c dsn-quote">${quote ? _rdE((num ? '§ ' + num + ' ' : '') + '“' + quote + '”') : `<span class="rdn-q">${_rdE(_rdT('dsn_no_words'))}</span>`}</td></tr>`; }).join('');
  const where = (_dsn.reading && _dsn.reading.whereWords) || '';
  return `<div class="cun-head rdn-head"><h2 class="ctf-h">${_rdE(_rdT(b ? 'dsn_reading' : D.stopped ? 'dsn_stopped' : 'dsn_read_done', { name }))}</h2><span class="ctf-hf">${_rdE([where, _rdTn('ac_n_contracts', (_dsn.reading && _dsn.reading.of) || n)].filter(Boolean).join(' · '))}</span><span class="apn-sp"></span>${right}</div>
    ${dsnSteps(2)}
    <div class="dsn-prog"><div><b>${k}</b> ${_rdE(_rdT('dsn_of_read', { n }))}</div><div class="dsc-live-bar" role="img" aria-label="${_rdE(_rdT('dsc_live_n', { k, n }))}"><i style="width:${n ? Math.round(k / n * 100) : 0}%"></i></div></div>
    ${b ? `<div class="dsn-rows"><table class="apn-table cun-table rdn-table dsn-table">${dsnColgroup(L.concat([{ w: 14, floor: 110 }, { w: 34, floor: 180 }]))}
      <thead><tr>${L.map(l => `<th>${_rdE(l.th)}</th>`).join('')}<th>${_rdE(_rdT('dsn_c_answer'))}</th><th>${_rdE(_rdT('dsn_c_says'))}</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${L.length + 2}" class="apn-none">${_rdE(_rdT('dsc_live_first'))}</td></tr>`}</tbody></table></div>${dsnLegoraHtml(b, got)}`
    : `<div class="cu-scroll" id="dsn-read-scroll"><table class="apn-table cun-table rdn-table dsn-table">${dsnColgroup(L.concat([{ w: 14, floor: 110 }, { w: 34, floor: 180 }]))}
      <thead><tr>${L.map(l => `<th>${_rdE(l.th)}</th>`).join('')}<th>${_rdE(_rdT('dsn_c_answer'))}</th><th>${_rdE(_rdT('dsn_c_says'))}</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${L.length + 2}" class="apn-none">${_rdE(_rdT('dsc_live_first'))}</td></tr>`}</tbody></table></div>`}`;
}
/* THE LEGORA WAY WHILE IT READS (owner, 15 Nov 2026, replacing the scan light and the waiting rows: "constant / rapid
   movement of the contracts"; drawn start to finish with a pause, artifacts UPVdyB87RwJ7wmw9sSanLL and
   MzNjqViovknShmU3V9h2MJ; "Build the legora way"). The reading page lives only for the length of a read, so nothing in
   the motion is pressed. Above: the DSN_ROWS_SHOWN newest answers, older ones moving up out of sight. Below, the rest of
   the page: the paper being read as a flipbook (its pages turning, a highlight scanning down it), "Reading now" with its
   name, party and number, a line that TYPES — what Jambo is looking for, then the words just found, in turn, on its own
   clock (dsnTypeTick) — and the next papers in line. Nothing here waits on an answer, so a pause while Jambo is slow
   never stills the page. Every motion carries a negative delay off the read's own start, so a repaint never restarts
   it; where less motion is asked it stands still. Words are only what HaTi holds: the question and the quotes found. */
/* the panel keeps the newest DSN_DRIFT_KEEP quotes, piled from the foot up to the top of the panel (owner, 15 Nov 2026:
   "the clause quotes should be piling up and filling the page as they scroll up … Make use of the space") */
const DSN_DRIFT_KEEP = 30;
const DSN_ROWS_SHOWN = 4, DSN_FLIP_S = 2.4, DSN_TYPE_MS = 2600, DSN_NEXT = 7;
const _dsnGone = () => (Date.now() - ((_dsn.reading && _dsn.reading.t0) || Date.now())) / 1000;
const _dsnDelay = (period, off) => `animation-delay:${(-(((_dsnGone() + (off || 0)) % period + period) % period)).toFixed(2)}s`;
/* the contract being read now: the first of the batch in hand not yet answered, else the first of the read not yet answered */
function dsnNowId(b, got){
  return ((b && b.ids) || []).find(id => !got[id]) || ((b && b.all) || []).find(id => !got[id]) || null;
}
function dsnLegoraHtml(b, got){
  const gc = id => (typeof getContract === 'function' ? getContract(id) : null);
  const id = dsnNowId(b, got), c = id ? gc(id) : null, name = c ? _rdName(c) : '';
  const next = ((b && b.all) || []).filter(x => !got[x] && x !== id).slice(0, DSN_NEXT).map(gc).filter(Boolean);
  const page = i => `<div class="dsn-pg" style="z-index:${10 - i};${_dsnDelay(DSN_FLIP_S, i * 0.45)}"><b>${_rdE(name)}</b>${'<i></i>'.repeat(13)}</div>`;
  return `<div class="dsn-leg" aria-hidden="true"><div class="dsn-book"><div class="dsn-pg is-top"><b>${_rdE(name)}</b>${'<i></i>'.repeat(13)}<span class="dsn-hl" style="${_dsnDelay(2.2)}"></span></div>${[0, 1, 2, 3, 4].map(page).join('')}</div>
    <div class="dsn-now">${c ? `<span class="dsn-tag">${_rdE(_rdT('dsn_now'))}</span><span class="dsn-now-n">${_rdE(name)}</span><span class="dsn-now-m">${_rdE([_dsnParty(c), _rdRef(c)].filter(Boolean).join(' · '))}</span>` : ''}<div class="dsn-typ" data-dsn-typ></div></div>
    ${next.length ? `<div class="dsn-next"><span>${_rdE(_rdT('dsn_next'))}</span>${next.map((x, i) => `<div class="dsn-mini" style="${_dsnDelay(1.6, i * 0.15)}"><b>${_rdE(_rdName(x))}</b><i></i><i></i><i></i></div>`).join('')}</div>` : ''}</div>`;
}
/* the typed line's turns: what Jambo is looking for, then the newest words found (never invented) */
function dsnTypeLines(){
  const A = _dscAC(), b = A && A.busy; if (!b) return [];
  const askId = b.askId || (b.asks || [])[0], got = (askId && A.ans[askId]) || {}, q = String(b.question || ((A.asks && A.asks[askId]) || {}).question || '').trim();
  const found = (b.doneIds || []).filter(id => got[id] && got[id].found && String(got[id].quote || '').trim()).slice(-3).reverse()
    .map(id => { const a = got[id], num = typeof askColClauseNo === 'function' ? askColClauseNo(a) : ''; return (num ? '§ ' + num + ' ' : '') + '“' + String(a.quote).trim().slice(0, 90) + '”'; });
  return (q ? [_rdT('dsn_looking', { q: q.slice(0, 90) })] : []).concat(found);
}
let _dsnTypeT = 0, _dsnTypeAt = -1;
function dsnTypeTick(){
  const el = document.querySelector('#rd-page [data-dsn-typ]'), A = _dscAC();
  if (!el || !(A && A.busy) || _dsn.screen !== 'reading'){ clearInterval(_dsnTypeT); _dsnTypeT = 0; _dsnTypeAt = -1; return; }
  const L = dsnTypeLines(), at = Math.floor(Date.now() / DSN_TYPE_MS);
  if (!L.length || (at === _dsnTypeAt && el.textContent)) return;
  _dsnTypeAt = at; const n = el.cloneNode(false); n.textContent = L[at % L.length]; n.style.setProperty('--ch', String(Math.min(90, n.textContent.length))); el.replaceWith(n);
}
function dsnTypeStart(){ _dsnTypeAt = -1; dsnTypeTick(); if (!_dsnTypeT) _dsnTypeT = setInterval(dsnTypeTick, 400); }
/* THE WORDS THAT SAY YES, IN YELLOW (owner, 15 Nov 2026: "highlight … where the search comes back affirmative";
   "Affirmative is the answer is yes and only words that say yes"; drawing 9fYJUU6vQFMteWzNMGgi2Q). Only a Yes answer,
   only the words Jambo named (`yesWords`, kept by the server only where they stand in the quote); found in the quote
   with any spacing; not found, nothing is marked — never a guess. Escaped piece by piece. */
function dsnYesMarked(a){
  const q = String((a && a.quote) || '').trim(), w = String((a && a.yesWords) || '').trim();
  if (!(a && a.yes === true) || !w) return _rdE(q);
  const re = new RegExp(w.split(/\s+/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'i'), m = re.exec(q);
  if (!m) return _rdE(q);
  return _rdE(q.slice(0, m.index)) + '<mark class="dsn-yes">' + _rdE(m[0]) + '</mark>' + _rdE(q.slice(m.index + m[0].length));
}
/* Jambo's panel while it reads: the words found so far, drifting up like credits, the newest joining at the foot */
function dsnDriftHtml(){
  const A = _dscAC(), b = A && A.busy, askId = b ? (b.askId || (b.asks || [])[0]) : null, got = (askId && A.ans[askId]) || {};
  const gc = id => (typeof getContract === 'function' ? getContract(id) : null);
  const items = ((b && b.doneIds) || []).filter(id => got[id] && got[id].found && String(got[id].quote || '').trim()).slice(-DSN_DRIFT_KEEP)
    .map(id => { const c = gc(id), a = got[id], tag = a.yes === true ? 'is-yes' : a.yes === false ? 'is-no' : '';
      return `<p><span>${_rdE([c ? _rdRef(c) : id, c ? _rdName(c) : ''].filter(Boolean).join(' · '))}${tag ? `<em class="dsn-yn ${tag}">${_rdE(_rdT(a.yes ? 'rd_tt_yes' : 'rd_tt_no'))}</em>` : ''}</span>“${dsnYesMarked(a)}”</p>`; }).join('');
  return `<div class="dsn-drift" aria-hidden="true"><div class="rfp-cap">${_rdE(_rdT('dsn_found_so_far'))}</div><div class="dsn-dcol"><div class="dsn-dreel" style="${_dsnDelay(9)}">${items || `<p class="is-quiet">${_rdE(_rdT('dsn_found_none'))}</p>`}</div></div></div>`;
}
const dsnRefHtml = c => (typeof refHtml === 'function') ? refHtml(c) : _rdE(_rdRef(c));
/* THE COLUMNS LEAD WITH WHAT EVERY ROW NEEDS, AND THE SUBJECT STEPS OUT (owner, 15 Nov 2026: "contract number should
   always be there. If you search a particular customer or supplier, then their name should not be in the body because
   they are the subject. If it is a folder for logistics then logistics should not be a column"; "Answer first"). Number
   and Contract always; Party and Folder only where the rows shown differ — one value on every row is the read's
   subject, named once in the line under the title instead (dsnSubject). One line a row. Results and the reading
   screen draw the same lead (dsnLeadCols). */
const _dsnParty = c => String((c && c.counterparty) || '').trim();
function dsnSubject(cs){
  const one = f => { const v = [...new Set(cs.map(f))]; return cs.length && v.length === 1 && v[0] ? v[0] : null; };
  return { party: one(_dsnParty), folder: one(c => c.folder || '') };
}
function dsnLeadCols(cs){
  const S = dsnSubject(cs), out = [
    { k: 'no', w: 9, floor: 80, th: _rdT('dsn_c_no'), td: c => `<td class="rdn-c dsn-no">${c ? dsnRefHtml(c) : ''}</td>` },
    { k: 'name', w: 20, floor: 150, th: _rdT('dsn_c_contract'), td: (c, id) => `<td><div class="cun-name">${_rdE(c ? _rdName(c) : id)}</div></td>` }];
  if (!S.party) out.push({ k: 'party', w: 14, floor: 100, th: _rdT('dsn_f_party'), td: c => `<td class="rdn-c">${_rdE(_dsnParty(c))}</td>` });
  if (!S.folder) out.push({ k: 'folder', w: 13, floor: 100, th: _rdT('dsn_f_folder'), td: c => `<td class="rdn-c">${_rdE(c ? _dsnFolderName(c.folder) : '')}</td>` });
  return out;
}
const dsnColgroup = W => { const t = W.reduce((n, x) => n + x.w, 0) || 1; return `<colgroup>${W.map(x => `<col style="width:${(x.w / t * 100).toFixed(1)}%" data-floor="${x.floor}">`).join('')}</colgroup>`; };
/* the subject, said once in the line under the title: the one party every row shares (the folder is already said there) */
const dsnSubjectWords = cs => { const S = dsnSubject(cs); return S.party || ''; };
/* (4) THE RESULTS OF ONE READ */
function dsnResultsShown(r){
  const rows = dsnRunRows(r); if (!rows) return null;
  const G = dsnGroups(rows), q = _dsn.q.trim().toLowerCase();
  if (_dsn.tab !== 'all' && !G.some(g => g.k === _dsn.tab)) _dsn.tab = 'all';
  const inTab = _dsn.tab === 'all' ? null : new Set((G.find(g => g.k === _dsn.tab) || { ids: [] }).ids);
  const hay = x => [_rdName(x.c), x.c.counterparty, _rdRef(x.c), _dsnFolderName(x.c.folder)].concat(x.a.map(a => a ? _rdWord(a) + ' ' + (a.quote || '') : '')).join(' ').toLowerCase();
  const list = rows.filter(x => (!inTab || inTab.has(x.id)) && (!q || q.split(/\s+/).every(w => hay(x).includes(w))))
    .sort((a, b) => Math.min(...a.a.map(x => x ? _dscRank(_rdTone(x)) : 9)) - Math.min(...b.a.map(x => x ? _dscRank(_rdTone(x)) : 9)));
  if (_dsn.sort && _dsn.sort.k){ const k = _dsn.sort.k, d = _dsn.sort.dir;
    list.sort((a, b) => d * String(dsnSortVal(a, k)).localeCompare(String(dsnSortVal(b, k)), undefined, { numeric: true, sensitivity: 'base' })); }
  return { rows, G, list };
}
function dsnResultsHtml(r){
  const S = dsnResultsShown(r), may = _dscMay(), left = Math.max(0, dsnRunOf(r) - r.n), pack = r.askIds.length > 1;
  const head = `<div class="rdsc-head"><div class="rdsc-top"><button type="button" class="ac-link rdt-back" data-dsn-back>${_rdE(_rdT('dsn_back'))}</button><h1 class="rdsc-nm" title="${_rdE(dsnRunName(r))}">${_rdE(dsnRunName(r))}</h1><span class="rdt-sp"></span>
      <button type="button" class="ui-btn ui-btn-sm" data-dsn-copy>${_rdE(_rdT('ac_chip_copy'))}</button>${left && may ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-dsn-more="${_rdE(r.id)}">${_rdE(_rdT('dsn_read_left', { n: left }))}</button>` : ''}</div>
    <div class="rdsc-sub">${_rdE([r.by, rdWhen(r.last || r.at), dsnRunWhere(r), S ? dsnSubjectWords(S.rows.map(x => x.c)) : '', _rdT('dsn_of_read_k', { k: r.n, n: dsnRunOf(r) })].filter(Boolean).join(' · '))}</div>
    <label class="dsn-search">${typeof icon === 'function' ? icon('search', 'w-4 h-4') : ''}<input type="search" id="dsn-q" autocomplete="off" spellcheck="false" placeholder="${_rdE(_rdTn('dsn_search', r.n))}" aria-label="${_rdE(_rdTn('dsn_search', r.n))}" value="${_rdE(_dsn.q)}"></label>
    ${S ? `<div class="rdsc-tiles" role="group" aria-label="${_rdE(_rdT('rd_filter'))}"><button type="button" class="rdsc-tile${_dsn.tab === 'all' ? ' is-on' : ''}" data-dsn-tab="all" aria-pressed="${_dsn.tab === 'all'}"><b>${S.rows.length}</b><span class="rdsc-tl">${_rdE(_rdT('dsn_all_read'))}</span><span class="rdsc-ts">${_rdE(_rdT('dsn_of_chosen', { n: dsnRunOf(r) }))}</span></button>${S.G.map(g => `<button type="button" class="rdsc-tile is-${g.c || 'gray'}${_dsn.tab === g.k ? ' is-on' : ''}" data-dsn-tab="${_rdE(g.k)}" aria-pressed="${_dsn.tab === g.k}"><b>${g.n}</b><span class="rdsc-tl" title="${_rdE(g.l)}">${_rdE(g.l)}</span><span class="rdsc-ts">${_rdE(_rdT('rd_sc_pct', { p: S.rows.length ? Math.round(g.n / S.rows.length * 100) : 0 }))}</span></button>`).join('')}</div>` : ''}</div>`;
  if (!S) return head + `<p class="dsc-quiet dsc-pad">${_rdE(_rdT('dsc_loading'))}</p>`;
  if (S.list.length && !S.list.some(x => x.id === _dsn.cid)) _dsn.cid = S.list[0].id;
  const names = r.askIds.map(k => ((typeof AC !== 'undefined' && AC.asks && AC.asks[k]) || {}).name || '');
  const L = dsnLeadCols(S.list.map(x => x.c));
  const rest = pack ? names.map((n, i) => ({ k: 'q' + i, w: Math.max(10, Math.round(44 / names.length)), floor: 90, th: n, sort: true }))
    : [{ k: 'ans', w: 13, floor: 110, th: _rdT('dsn_c_answer'), sort: true }, { k: 'says', w: 31, floor: 160, th: _rdT('dsn_c_says'), sort: true }, { k: 'act', w: 10, floor: 100, th: '' }];
  const W = L.concat(rest);
  const tr = x => { const a = x.a[0], tone = a ? _rdTone(a, r.askIds[0]) : 'none', num = a && typeof askColClauseNo === 'function' ? askColClauseNo(a) : '', quote = a && a.found ? String(a.quote || '').trim() : '';
    const act = !a || a.noWording ? '' : (!a.checked && tone === 'ruby' && quote) ? `<button type="button" class="rfp-a" data-dsn-clause="${_rdE(x.id)}">${_rdE(_rdT('dsc_open_clause'))}</button>`
      : `<button type="button" class="rfp-a${a.checked ? ' is-ck' : ''}" data-dsn-ck="${_rdE(x.id)}"${may ? '' : ' disabled'}>${_rdE(_rdT(a.checked ? 'dsc_checked' : 'dsc_mark'))}</button>`;
    const cells = pack ? x.a.map(y => `<td class="rdn-c">${y ? _dsnChip(dsnChipTone(y, null), _rdWord(y)) : '—'}</td>`).join('')
      : `<td class="rdn-c">${a ? _dsnChip(dsnChipTone(a, S.G), _rdWord(a)) : ''}</td><td class="rdn-c dsn-quote">${quote ? _rdE((num ? '§ ' + num + ' ' : '') + '“' + quote + '”') : `<span class="rdn-q">${_rdE(_rdT('dsn_no_words'))}</span>`}</td><td class="rdn-c">${act}</td>`;
    return `<tr class="dsn-row${x.id === _dsn.cid ? ' is-sel' : ''}" data-dsn-row="${_rdE(x.id)}" tabindex="0">${L.map(l => l.td(x.c, x.id)).join('')}${cells}</tr>`; };
  return head + `<div class="cu-scroll"><table class="apn-table cun-table rdn-table dsn-table">${dsnColgroup(W)}<thead><tr>${W.map(x => x.k === 'act' ? '<th></th>' : dsnSortTh(x.k, x.th)).join('')}</tr></thead>
    <tbody>${S.list.map(tr).join('') || `<tr><td colspan="${W.length}" class="apn-none">${_rdE(_rdT('rd_none_here'))}</td></tr>`}</tbody></table></div>`;
}
/* THE ROUTER: which screen stands (a read in flight is always its own screen) */
function dsnRender(host, o){
  const A = _dscAC(), busy = !!(A && A.busy);
  /* ARRIVING FROM ANOTHER PAGE LANDS ON THE LIST OF READS, however you came (a press inside Discover keeps its screen; a
     refresh puts back the place it kept, rdPlacePut; a read in flight is always its own screen) */
  if (!document.querySelector('#rd-page.dsn-page') && !busy){
    if (_dsn.resumed) _dsn.resumed = false; else { _dsn.screen = 'list'; _dsn.cid = null; _dsn.picked = false; }
  }
  if (busy) _dsn.screen = 'reading';
  if (_dsn.screen === 'results' && !(_dsn.run && dsnRun(_dsn.run))) _dsn.screen = _dsn.run ? 'results' : 'list';
  dscLiveTurn();
  let inner, panel = '', head = false;
  const r = _dsn.screen === 'results' ? dsnRun(_dsn.run) : null;
  if (_dsn.screen !== 'new') { _dsn.pk = null; _dsn.pkMenu = false; }
  if (_dsn.screen === 'new'){ AC.scope = { ids: dsnChosen().ids }; inner = dsnNewHtml(); panel = _dsn.pk ? dsnPackPanel() : dsnNewPanel(); }
  else if (_dsn.screen === 'reading'){ inner = dsnReadingHtml(); }
  else if (r){ inner = dsnResultsHtml(r); }
  else if (_dsn.screen === 'results'){ inner = `<div class="cun-head rdn-head"><button type="button" class="ac-link dsn-back" data-dsn-back>${_rdE(_rdT('dsn_back'))}</button></div><p class="dsc-quiet dsc-pad">${_rdE(_rdT('dsc_loading'))}</p>`; }
  else { _dsn.screen = 'list'; inner = dsnListHtml(); panel = dsnListPanel(); }
  void head;
  /* the choice stands from New read until the read ends; the list of reads and the results let it go */
  if ((_dsn.screen === 'list' || _dsn.screen === 'results') && !busy && !_dsc.starting && typeof AC !== 'undefined') AC.scope = null;
  /* a repaint keeps what is being typed and where the reader stood */
  const act = document.activeElement, keepId = act && act.closest && act.closest('#rd-page') && act.id ? act.id : '';
  const at = keepId && typeof listCaretAt === 'function' && (keepId === 'dsc-q' || keepId === 'dsn-q') ? listCaretAt('#' + keepId) : null;
  const sc0 = document.querySelector('#rd-page .cu-scroll'), top0 = sc0 ? sc0.scrollTop : 0, same = document.querySelector(`#rd-page[data-dsn-screen="${_dsn.screen}"]`);
  host.innerHTML = dsnPage(inner);
  const sc1 = host.querySelector('.cu-scroll'); if (sc1 && top0 && same && !(o && o.top)) sc1.scrollTop = top0;
  if (keepId && document.getElementById(keepId)){ if (at != null && typeof listCaretPut === 'function') listCaretPut('#' + keepId, at); else document.getElementById(keepId).focus({ preventScroll: true }); }
  if (_dsn.screen === 'reading' && busy) dsnTypeStart();
  dsnPanelPaint(panel, r);
  readsWire();
  if (typeof setActiveNav === 'function') setActiveNav('reads');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
function dsnPanelPaint(body, r){
  if (typeof insPaintPanel !== 'function') return;
  const base = { seat: RD_SEAT, head: false, jlHome: _rdT('nav_reads'), jlSay: rdJlSay };
  const A = _dscAC(), b = A && A.busy;
  if (_dsn.screen === 'reading' && b){
    insPaintPanel(Object.assign(base, { item: { id: 'drift' }, body: `<div class="rfp-panel is-drawn rdn-panel dsn-drift-panel">${dsnDriftHtml()}</div>`, jlTabWord: _rdT('dsc_tab_reading', { k: b.done, n: b.total }), jlPh: _rdT('jl_ph_any'), jlLinks: '' }));
    return;
  }
  if (_dsn.screen === 'reading'){
    const runIds = ((_dsn.run && dsnRun(_dsn.run)) || {}).ids || [], cid = _dsc.liveCid || runIds[runIds.length - 1] || null, askId = b ? (b.askId || (b.asks || [])[0]) : (_dsn.done && _dsn.done.askId);
    insPaintPanel(Object.assign(base, { item: { id: 'live:' + (cid || '') }, body: cid && askId ? `<div class="rfp-cap">${_rdE(_rdT('dsc_just_read'))}</div>${dscPaperHtml(askId, cid)}` : `<div class="rfp-panel is-drawn rdn-panel"><p class="ac-nl-hint">${_rdE(_rdT('dsc_live_first'))}</p></div>`,
      jlTabWord: _rdT(b ? 'dsc_tab_reading' : 'dsn_tab_done', { k: b ? b.done : 0, n: b ? b.total : 0 }), jlPh: _rdT('dsc_ph_clause'), jlLinks: cid && askId ? dscPaperLinksHtml(askId, cid) : '' }));
    return;
  }
  if (r && _dsn.cid){
    const k = r.askIds[0];
    insPaintPanel(Object.assign(base, { item: { id: 'paper:' + _dsn.cid }, body: dscPaperHtml(k, _dsn.cid), jlTabWord: _rdT('dsc_tab_paper'), jlPh: _rdT('dsc_ph_clause'), jlLinks: dscPaperLinksHtml(k, _dsn.cid) }));
    return;
  }
  const pk = _dsn.screen === 'new' && _dsn.pk;
  insPaintPanel(Object.assign(base, { item: { id: 'dsn:' + _dsn.screen + ':' + (_dsn.sel || '') + (pk ? ':pk:' + _dsn.pk.mode : '') }, body: `<div class="rfp-panel is-drawn rdn-panel${pk ? ' dsn-pk-panel' : ''}">${body}</div>`, jlPh: _rdT('jl_ph_any') },
    pk ? { jlTabWord: _rdT(_dsn.pk.mode === 'manage' ? 'dsn_pk_your_packs' : _dsn.pk.id ? 'dsn_pk_change' : 'dsn_pk_build_t') } : {}));
}
/* START A READ from New read, or the rest of a read from its results */
async function dsnAsk(more){
  const A = _dscAC(); if (!A || A.busy || _dsc.starting) return;
  if (!_dscMay()){ dscSay(_rdT('ac_btn_viewer')); return; }
  let o, ch;
  if (more){
    const r = dsnRun(more); if (!r) return;
    const w = Array.isArray(r.where) && r.where.length ? r.where : null;
    _dsn.pick = new Set(w || ['all']); _dsn.status = 'all'; _dsn.party = '';
    ch = dsnChosen();
    const p = r.packId ? (A.packs || []).find(x => x.id === r.packId) : null;
    o = p ? { pack: p } : { askId: r.askIds[0] };
  } else {
    const el = document.getElementById('dsc-q'); if (el && !_dsc.pack) _dsc.q = el.value;
    const q = String(_dsc.q || '').trim();
    if (!_dsc.pack && q.length < 3){ dscSay(_rdT('dsc_say_short')); return; }
    ch = dsnChosen();
    if (!ch.ids.length){ dscSay(_rdT('dsn_choose')); return; }
    o = _dsc.pack ? { pack: _dsc.pack } : (_dsc.askId ? { askId: _dsc.askId } : { question: q });
  }
  A.scope = { ids: ch.ids };
  _dsn.reading = { whereWords: ch.where.includes('all') ? _rdT('dsn_all_contracts') : ch.where.map(_dsnFolderName).join(', '), of: ch.ids.length, t0: Date.now() };
  Object.assign(o, { size: DSN_READ_MAX, where: ch.where, of: ch.ids.length, onRun: id => { _dsn.run = id; } });
  _dsc.say = ''; _dsc.liveCid = null; _dsc.liveAt = 0; _dsc.starting = true; _dsn.done = null; _dsn.screen = 'reading';
  renderReads({ top: true });
  let got = null;
  try { const pr = askColAskHere(o); setTimeout(() => { _dsc.starting = false; }, 0); got = await pr; } catch (_){ got = null; }
  _dsc.starting = false;
  if (got && (got.short || got.portfolio || got.none)){
    _dsn.screen = more ? 'results' : 'new';
    dscSay(_rdT(got.short ? 'dsc_say_short' : got.portfolio ? 'dsc_say_count' : 'dsn_all_read_here')); return; }
  if (got){
    const askId = (got.asks && got.asks[0] && got.asks[0].id) || null;
    _dsn.done = { name: (got.asks && got.asks[0] && (o.pack ? o.pack.name : got.asks[0].name)) || '', askId, k: got.done || 0, n: (got.done || 0) + ((got.left || []).length), stopped: !!got.stopped };
    if (got.runId) _dsn.run = got.runId;
    _dsc.q = ''; _dsc.askId = null; _dsc.pack = null;
  }
  _rd.loading = false;
  await rdLoad(true);
  renderReads();
}
/* Jambo's "read the next" on Discover only FILLS New read with that question (a chip never reads on its own) */
function dsnFill(r){
  const A = _dscAC(), p = r.pack && A ? (A.packs || []).find(x => x.id === r.pack.id) : null, a = A && A.asks ? A.asks[r.askIds[0]] : null;
  _dsc.pack = p || null; _dsc.askId = p ? null : r.askIds[0]; _dsc.q = p ? '' : ((a && a.question) || r.q || '');
  _dsn.pick = new Set(['all']); _dsn.status = 'all'; _dsn.party = '';
  dsnGo('new');
}
function dsnGo(screen, o){
  _dsn.screen = screen; Object.assign(_dsn, o || {});
  _dsn.picked = false;
  if (o && 'run' in o) _dsn.sort = null;
  if (screen !== 'new'){ _dsc.say = ''; }
  if (typeof rdKeep === 'function') rdKeep();
  renderReads({ top: true });
}
if (typeof document !== 'undefined' && !document._dsnWired){ document._dsnWired = true;
  const stop = e => { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); };
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'reads' || !document.querySelector('#rd-page.dsn-page')) return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (!t.closest('#rd-page') && !t.closest('#ins-panel')) return;
    let el;
    if (t.closest('#dsn-new')){ stop(e); _dsc.q = ''; _dsc.askId = null; _dsc.pack = null; dsnGo('new'); setTimeout(() => { const q = document.getElementById('dsc-q'); if (q) q.focus(); }, 0); return; }
    if (t.closest('[data-dsn-back]')){ stop(e); dsnGo('list', { cid: null, tab: 'all', q: '' }); return; }
    if (t.closest('#dsc-go')){ stop(e); dsnAsk(); return; }
    if (t.closest('[data-dsn-results]')){ stop(e); dsnGo(_dsn.run ? 'results' : 'list', { cid: null, tab: 'all', q: '' }); return; }
    if ((el = t.closest('[data-dsn-open]'))){ stop(e); dsnGo('results', { run: el.getAttribute('data-dsn-open'), cid: null, tab: 'all', q: '' }); return; }
    if ((el = t.closest('[data-dsn-more]'))){ stop(e); dsnAsk(el.getAttribute('data-dsn-more')); return; }
    if ((el = t.closest('[data-dsn-run]'))){ stop(e); const id = el.getAttribute('data-dsn-run');
      /* A PRESS CHOOSES, A SECOND OPENS (the list inspector's rule): the read chosen for you on arrival is not yet yours,
         so the first press on it shows its summary, never its results */
      if (_dsn.sel === id && _dsn.picked){ dsnGo('results', { run: id, cid: null, tab: 'all', q: '' }); return; }
      _dsn.sel = id; _dsn.picked = true; renderReads(); return; }
    if ((el = t.closest('[data-dsn-pick]'))){ stop(e); const k = el.getAttribute('data-dsn-pick');
      if (k === 'all') _dsn.pick = new Set(['all']);
      else { _dsn.pick.delete('all'); if (_dsn.pick.has(k)) _dsn.pick.delete(k); else _dsn.pick.add(k); if (!_dsn.pick.size) _dsn.pick.add('all'); }
      _dsn.party = ''; renderReads(); return; }
    if (t.closest('[data-dsn-clear]')){ stop(e); _dsn.pick = new Set(['all']); _dsn.party = ''; renderReads(); return; }
    if ((el = t.closest('[data-dsn-sort]'))){ stop(e); const k = el.getAttribute('data-dsn-sort');
      _dsn.sort = (_dsn.sort && _dsn.sort.k === k) ? { k, dir: -_dsn.sort.dir } : { k, dir: 1 }; renderReads(); return; }
    if ((el = t.closest('[data-dsn-tab]'))){ stop(e); _dsn.tab = el.getAttribute('data-dsn-tab'); _dsn.cid = null; renderReads(); return; }
    if ((el = t.closest('[data-dsn-clause]'))){ stop(e); const r = dsnRun(_dsn.run); if (r) dscLand(r.askIds[0], el.getAttribute('data-dsn-clause'), false); return; }
    if ((el = t.closest('[data-dsn-ck]'))){ stop(e); const r = dsnRun(_dsn.run);
      if (r && !el.disabled && typeof askColCheck === 'function') Promise.resolve(askColCheck(r.askIds[0], el.getAttribute('data-dsn-ck'))).catch(() => {}).then(() => renderReads()); return; }
    if ((el = t.closest('[data-dsn-row]'))){ stop(e); const id = el.getAttribute('data-dsn-row'); if (_dsn.cid !== id){ _dsn.cid = id; renderReads(); } return; }
    if (t.closest('[data-dsn-copy]')){ stop(e); const r = dsnRun(_dsn.run), S = r && dsnResultsShown(r); if (S && typeof askColCopyMany === 'function') askColCopyMany(r.askIds, S.list.map(x => x.id)); return; }
    /* Delete question asks first (askColDelete's own confirm) and cannot be undone; the list of reads is read again after */
    if ((el = t.closest('[data-dsn-del]'))){ stop(e); const r = dsnRun(el.getAttribute('data-dsn-del'));
      if (r && typeof askColDelete === 'function') Promise.resolve(askColDelete(r.askIds[0])).catch(() => {}).then(() => { _dsn.sel = null; rdLoad(true); }); return; }
    if ((el = t.closest('[data-dsn-keep]'))){ stop(e); const r = dsnRun(_dsn.sel);
      if (r && typeof askColKeep === 'function') Promise.resolve(askColKeep(r.askIds[0], el.getAttribute('data-dsn-keep') === '1')).catch(() => {}).then(() => rdLoad(true)); return; }
  }, true);
  document.addEventListener('change', e => {
    const s = e.target && e.target.closest ? e.target.closest('#rd-page.dsn-page select[data-dsn-f]') : null; if (!s) return;
    const k = s.getAttribute('data-dsn-f'), v = s.value;
    if (k === 'nfolder'){ _dsn.pick = new Set([v || 'all']); _dsn.party = ''; }
    else if (k === 'status') _dsn.status = v; else if (k === 'party') _dsn.party = v;
    else _dsn.f[k] = v;
    renderReads();
  });
  document.addEventListener('input', e => { const id = e.target && e.target.id; if (!_dsn.pk || typeof state === 'undefined' || state.view !== 'reads') return;
    if (id === 'dsn-pk-name'){ _dsn.pk.name = e.target.value; const b = document.querySelector('[data-dsn-pksave]'); if (b) b.disabled = !(_dsn.pk.qs.size && _dsn.pk.name.trim()); }
    if (id === 'dsn-pk-own') _dsn.pk.own = e.target.value; });
  document.addEventListener('keydown', e => { if (typeof state === 'undefined' || state.view !== 'reads') return;
    if (e.key === 'Escape' && _dsn.pkMenu){ e.preventDefault(); _dsn.pkMenu = false; renderReads(); return; }
    if (e.key === 'Enter' && e.target && e.target.id === 'dsn-pk-own'){ e.preventDefault(); dsnPackAddOwn(); } });
  document.addEventListener('pointerdown', e => { if (!_dsn.pkMenu || typeof state === 'undefined' || state.view !== 'reads') return;
    if (e.target && e.target.closest && e.target.closest('.dsn-pk')) return; _dsn.pkMenu = false; renderReads(); }, true);
  document.addEventListener('input', e => { if (e.target && e.target.id === 'dsn-q' && state.view === 'reads'){ _dsn.q = e.target.value; _dsn.cid = null; renderReads(); } });
  document.addEventListener('keydown', e => {
    if (typeof state === 'undefined' || state.view !== 'reads' || !e.target || !e.target.closest || !document.querySelector('#rd-page.dsn-page')) return;
    if (e.target.id === 'dsc-q' && e.key === 'Enter' && !e.isComposing){ stop(e); dsnAsk(); return; }
    const row = e.target.closest('#rd-page [data-dsn-run], #rd-page [data-dsn-row], #rd-page [data-dsn-pick]');
    if (row && e.target === row && (e.key === 'Enter' || e.key === ' ')){ stop(e); row.click(); return; }
    if (row && e.target === row && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){ stop(e);
      const to = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling; if (to && to.getAttribute('tabindex') === '0'){ const attr = ['data-dsn-run', 'data-dsn-row', 'data-dsn-pick'].find(a => to.hasAttribute(a)); to.click();
        const again = document.querySelector(`#rd-page [${attr}="${CSS.escape(to.getAttribute(attr))}"]`); if (again) again.focus(); } }
  }, true);
}

if (typeof document !== 'undefined' && !document._rdnWired){ document._rdnWired = true;
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'reads') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const A = _dscAC();
    let el;
    if ((el = t.closest('[data-rdn-table]'))){ e.preventDefault(); e.stopPropagation(); readsTableOpen(el.getAttribute('data-rdn-table')); return; }
    if (!t.closest('#rd-page.dsc-page') && !t.closest('#ins-panel')) return;
    if (t.closest('#dsc-stop')){ e.preventDefault(); e.stopPropagation(); if (typeof askColStop === 'function') askColStop(); return; }
    if (t.closest('#dsc-carry')){ e.preventDefault(); e.stopPropagation(); _dsc.liveCid = null; if (typeof askColCarryOn === 'function') Promise.resolve(askColCarryOn()).catch(() => {}).then(() => rdLoad(true)); return; }
    if (t.closest('[data-dsc-unpack]')){ e.preventDefault(); e.stopPropagation(); _dsc.pack = null; _dsc.say = ''; renderReads(); const q = document.getElementById('dsc-q'); if (q) q.focus(); return; }
    if (t.closest('[data-dsn-pkmenu]')){ _dsnStop(e); _dsn.pkMenu = !_dsn.pkMenu; renderReads(); return; }
    if ((el = t.closest('[data-dsn-pkpick]'))){ _dsnStop(e); if (A && A.busy) return;
      const p = _dsnPacks().find(x => x.id === el.getAttribute('data-dsn-pkpick')) || null; _dsn.pkMenu = false;
      if (p){ dsnPackCurSet(p.id); _dsc.pack = p; _dsc.q = ''; _dsc.askId = null; _dsc.say = ''; } renderReads(); return; }
    if (t.closest('[data-dsn-pkbuild]')){ _dsnStop(e); dsnPackStart(null); renderReads(); setTimeout(() => { const n = document.getElementById('dsn-pk-name'); if (n && typeof fieldFocus === 'function') fieldFocus(n); else if (n) n.focus(); }, 0); return; }
    if (t.closest('[data-dsn-pkmanage]')){ _dsnStop(e); _dsn.pk = { mode: 'manage' }; _dsn.pkMenu = false; renderReads(); return; }
    if (t.closest('[data-dsn-pkcancel]')){ _dsnStop(e); _dsn.pk = null; renderReads(); return; }
    if ((el = t.closest('[data-dsn-pkedit]'))){ _dsnStop(e); dsnPackStart(_dsnPacks().find(x => x.id === el.getAttribute('data-dsn-pkedit'))); renderReads(); return; }
    if ((el = t.closest('[data-dsn-pkdel]'))){ _dsnStop(e); dsnPackDelete(_dsnPacks().find(x => x.id === el.getAttribute('data-dsn-pkdel'))); return; }
    if (t.closest('[data-dsn-pksave]')){ _dsnStop(e); dsnPackSave(); return; }
    if (t.closest('[data-dsn-pkadd]')){ _dsnStop(e); dsnPackAddOwn(); return; }
    if ((el = t.closest('[data-dsn-pkq]')) && _dsn.pk){ _dsnStop(e); const k = el.getAttribute('data-dsn-pkq'), K = _dsn.pk; K.say = '';
      if (K.qs.has(k)) K.qs.delete(k);
      else if (K.qs.size < DSN_PACK_MAX){ const x = dsnStdQuestions().flatMap(g => g.items).find(i => i.key === k); if (x) K.qs.set(k, { question: x.question, name: x.name, std: x.std }); }
      renderReads(); return; }
    if ((el = t.closest('[data-dsc-pack]'))){ e.preventDefault(); e.stopPropagation(); if (A && A.busy) return; _dsn.pkMenu = false;
      const p = ((A && A.packs) || []).find(x => x.id === el.getAttribute('data-dsc-pack')) || null;
      _dsc.pack = (_dsc.pack && p && _dsc.pack.id === p.id) ? null : p; _dsc.q = ''; _dsc.askId = null; _dsc.say = ''; renderReads(); return; }
    if ((el = t.closest('[data-dsc-q]'))){ e.preventDefault(); e.stopPropagation(); if (A && A.busy) return;
      const id = el.getAttribute('data-dsc-q'), a = A && A.asks ? A.asks[id] : null;
      if (_dsc.askId === id){ _dsc.askId = null; _dsc.q = ''; } else if (a){ _dsc.askId = id; _dsc.q = a.question || ''; }
      _dsc.pack = null; _dsc.say = ''; renderReads(); const q = document.getElementById('dsc-q'); if (q) q.focus(); return; }
    if ((el = t.closest('[data-dsc-open]'))){ e.preventDefault(); e.stopPropagation(); dscLand(el.getAttribute('data-dsc-ask'), el.getAttribute('data-dsc-open'), false); return; }
    if ((el = t.closest('[data-dsc-redline]'))){ e.preventDefault(); e.stopPropagation(); dscLand(el.getAttribute('data-dsc-ask'), el.getAttribute('data-dsc-redline'), true); return; }
  }, true);
  /* the ask box keeps its words through every repaint; words typed over a question brought back are a new question */
  document.addEventListener('input', e => { if (e.target && e.target.id === 'dsc-q' && typeof state !== 'undefined' && state.view === 'reads'){
    _dsc.q = e.target.value; const A = _dscAC(), a = _dsc.askId && A && A.asks ? A.asks[_dsc.askId] : null;
    if (a && String(a.question || '') !== _dsc.q) _dsc.askId = null;
    if (_dsc.say){ _dsc.say = ''; const s = document.querySelector('#rd-page .dsc-say'); if (s) s.remove(); } } });
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
/* EVERY PRESS FROM READS LANDS ON THE READ, never first on Jambo's conversation (owner, 29 Oct 2026: the row's
   "Next 50 →" showed the talk, then the read; the panel's button, only drawn on Overview, did not): the words said
   on Reads count as seen before Contracts is painted (pdTalkSeenAll), so both presses are one door */
function rdOnContracts(then){
  if (typeof pdTalkSeenAll === 'function') try { pdTalkSeenAll(); } catch (_){}
  const go = () => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); if (typeof regFoldersShut === 'function') regFoldersShut(); if (typeof setView === 'function') setView('register'); };
  if (typeof dkLeavePageThen === 'function') dkLeavePageThen(go); else go();
  let n = 0;
  const tick = () => { if (document.querySelector('#reg-tbody') && typeof askColOn === 'function' && askColOn()){ then(); return; } if (++n < 40) setTimeout(tick, 100); };
  setTimeout(tick, 100);
}
/* ASK A NEW QUESTION: on the Discover page it is the ask box; where that page is not drawn (the phone-narrow window, the
   old look) the question is still asked from the Contracts list's panel, as before */
function readsAskNew(){
  if (state.view === 'reads' && document.querySelector('#rd-page.dsc-page')){ const q = document.getElementById('dsc-q'); if (q) q.focus(); return; }
  rdOnContracts(() => { if (typeof askColOpen === 'function') askColOpen(); });
}
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
/* OPEN THE TABLE STAYS ON THIS PAGE (round 4): the read table opens inside Reads, never by way of Contracts */
function readsTable(key){ readsTableOpen(key); }
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
    if (_rd.table){
      const tr = rdFind(_rd.table.key);
      if ((el = t.closest('[data-rdt-back]'))){ readsTableBack(); return; }
      if ((el = t.closest('[data-rdt-tab]'))){ _rd.table.tab = el.getAttribute('data-rdt-tab'); rdKeep(); rdTablePaint(); return; }
      if ((el = t.closest('[data-rdt-copy]')) && tr){ if (typeof askColCopyMany === 'function') askColCopyMany(tr.askIds, rdTableRows(tr).map(x => x.id)); return; }
      if ((el = t.closest('[data-rdt-again]')) && tr){ readsAgain(tr.key); return; }
      if ((el = t.closest('[data-rdt-go]')) && _rd.table.cid){ if (typeof AC !== 'undefined') AC.chosen = { askId: el.getAttribute('data-rdt-go'), cid: _rd.table.cid }; if (typeof askColGo === 'function') askColGo(); return; }
      if ((el = t.closest('[data-rdt-ck]')) && _rd.table.cid && !el.disabled){ const cid = _rd.table.cid; if (typeof askColCheck === 'function') askColCheck(el.getAttribute('data-rdt-ck'), cid).then(() => rdTablePaint()); return; }
      if ((el = t.closest('[data-rdt-row]'))){ const id = el.getAttribute('data-rdt-row'); if (_rd.table.cid === id) return; _rd.table.cid = id; rdKeep(); rdTablePaint(); return; }
    }
    if ((el = t.closest('[data-rd-next]'))){ e.stopPropagation(); readsNext(el.getAttribute('data-rd-next'), typeof acSize === 'function' ? acSize() : 50); return; }
    if ((el = t.closest('[data-rd-again]'))){ e.stopPropagation(); readsAgain(el.getAttribute('data-rd-again')); return; }
    if ((el = t.closest('[data-rd-act]')) && _rd.sel){
      const act = el.getAttribute('data-rd-act');
      if (act === 'next') readsNext(_rd.sel, Number(el.getAttribute('data-rd-n')) || (typeof acSize === 'function' ? acSize() : 50));
      else if (act === 'again') readsAgain(_rd.sel);
      else if (act === 'table') readsTable(_rd.sel);
      else if (act === 'bring') readsBring(_rd.sel);
      else if (act === 'risk') readsRisk(_rd.sel);
      else if (act === 'unlist'){ const r = rdFind(_rd.sel); if (r && typeof askColDrop === 'function'){ askColDrop(r.askIds[0]); renderReads(); } }
      else if (act === 'delete'){ const r = rdFind(_rd.sel); if (r && typeof askColDelete === 'function') Promise.resolve(askColDelete(r.askIds[0])).then(() => rdLoad(true)).catch(() => {}); }
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
  document.addEventListener('input', e => {
    if (state.view !== 'reads' || !_rd.table || !e.target || e.target.id !== 'rdt-q') return;
    _rd.table.q = e.target.value; rdTablePaint();
  });
  document.addEventListener('keydown', e => {
    if (state.view !== 'reads') return;
    const trow = e.target && e.target.closest ? e.target.closest('[data-rdt-row]') : null;
    if (trow && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); trow.click(); return; }
    if (trow && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
      const to = e.key === 'ArrowDown' ? trow.nextElementSibling : trow.previousElementSibling;
      if (to && to.hasAttribute('data-rdt-row')){ e.preventDefault(); to.click(); const again = document.querySelector(`[data-rdt-row="${CSS.escape(to.getAttribute('data-rdt-row'))}"]`); if (again) again.focus(); }
      return;
    }
    if (_rd.table && e.key === 'Escape' && !(e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable="true"]'))){ e.preventDefault(); readsTableBack(); return; }
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
  /* THE READ TABLE (round 4, the Legora way): the back line, the tabs and the box, a quiet table */
  .rd-card.is-table{display:flex;flex-direction:column;min-height:0}
  .rdt-head{display:flex;align-items:baseline;gap:6px 8px;padding:14px 16px 0;min-width:0;font-size:13px}
  .rdt-back{flex:none}
  .rdt-dot{color:var(--color-quiet);flex:none}
  .rdt-nm{font-weight:var(--w-strong);flex:none;white-space:nowrap}
  .rdt-sub{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rdt-sp{flex:1}
  .rdt-head .ac-link{white-space:nowrap;flex:none}
  .rdt-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px 8px;flex-wrap:wrap}
  .rdt-bar .reg-views{margin:0}
  .rdt-ask{flex:0 1 260px;min-width:160px}
  .rdt-t td{vertical-align:middle}
  .rdt-ans{display:inline-flex;align-items:center;gap:8px;min-width:0;max-width:100%}
  .rdt-ans .ac-ans{min-width:0;display:inline-flex;align-items:center;gap:6px}
  .rdt-w{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;padding-right:.2em}
  .rdt-sec{flex:none;font-size:11.5px;color:var(--color-quiet);background:var(--color-neutral-100);border-radius:6px;padding:1px 6px;white-space:nowrap}
  .rdt-ck{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;font-size:12.5px}
  .rdt-empty{padding:24px 16px;margin:0;color:var(--color-quiet)}
  .rdt-quote{margin:0;padding:8px 12px;border-left:3px solid var(--accent-solid);background:color-mix(in srgb,var(--color-accent) 6%,transparent);font-family:var(--font-doc);font-size:14px;line-height:1.5}
  .rdt-many{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px;font-size:13px}
  .rdt-t .ac-ans>i,.rdt-side .ac-ans>i,.rdt-many .ac-ans>i{width:8px;height:8px;border-radius:50%;flex:none;background:var(--st-gray-dot)}
  .rdt-t .ac-ans.tone-green>i,.rdt-side .ac-ans.tone-green>i,.rdt-many .ac-ans.tone-green>i{background:var(--st-green-dot)}
  .rdt-t .ac-ans.tone-amber>i,.rdt-side .ac-ans.tone-amber>i,.rdt-many .ac-ans.tone-amber>i{background:var(--st-amber-dot)}
  .rdt-t .ac-ans.tone-ruby>i,.rdt-side .ac-ans.tone-ruby>i,.rdt-many .ac-ans.tone-ruby>i{background:var(--st-ruby-dot)}
  #ins-panel .rdt-side{padding:8px 16px 16px;display:flex;flex-direction:column;gap:14px;min-width:0}
  #ins-panel .rdt-side .ac-fl{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px 12px;margin:0;font-size:13px;line-height:1.45}
  #ins-panel .rdt-side .ac-fl dt{font-size:12px;color:var(--color-quiet)}
  #ins-panel .rdt-side .ac-fl dd{margin:0;min-width:0}
  #ins-panel .rdt-side .ac-ans{display:inline-flex;align-items:center;gap:8px}
  #ins-panel .rdt-acts{display:flex;gap:8px;flex-wrap:wrap;margin:0}
`; }

Object.assign(window, { dsnRender, dsnChosen, dsnRuns, dsnGroups, dsnRunWhere, dsnAsk, discoverOpen, discoverLive, dscSlice, readsTableOpen, readsTableBack, rdTableRows, rdPlace, rdPlacePut, renderReads, readsOpen, readsShown, readParts, rdRows, readsFacts, readsNext, readsAskNew });
