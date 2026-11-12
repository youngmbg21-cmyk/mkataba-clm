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
/* A REFRESH LANDS AT THE SAME SPOT (PLACE_PARTS.reads): the tab, the box and the chosen row */
function rdPlace(){ return { filter: _rd.filter, q: _rd.q, sel: _rd.sel, table: _rd.table ? { key: _rd.table.key, tab: _rd.table.tab, q: _rd.table.q, cid: _rd.table.cid } : null }; }
function rdPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _rd.filter = RD_TABS.some(t => t[0] === p.filter) ? p.filter : 'all';
  _rd.q = p.q ? String(p.q) : '';
  _rdBack = p.sel ? String(p.sel) : null;
  _rd.table = p.table && p.table.key ? { key: String(p.table.key), tab: String(p.table.tab || 'all'), q: String(p.table.q || ''), cid: p.table.cid ? String(p.table.cid) : null, loaded: false } : null;
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
  const tabs = rdTableTabs(yn);
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
function rdTableHtml(r){
  const t = _rd.table, S = rdTableShown(r);
  /* the chosen row is kept until the answers are in (a refresh lands on it), then the first shown stands in */
  if (S.list.length && (!t.cid || !S.list.some(x => x.id === t.cid))) t.cid = S.list[0].id;
  const names = r.askIds.map(k => ((typeof AC !== 'undefined' && AC.asks && AC.asks[k]) || {}).name || r.name);
  const yes = S.yn ? S.rows.filter(x => rdTableIn(x, 'yes', true)).length : 0;
  const risk = S.rows.filter(x => rdTableIn(x, 'risk', false)).length;
  const sub = [r.q ? `“${r.q}”` : _rdT('rd_chip_pack', { n: r.askIds.length }), _rdTn('rd_tt_read', S.rows.length), r.by, r.when ? rdWhen(r.when) : ''].filter(Boolean).join(' · ');
  const tabs = typeof insViewTabsHtml === 'function' ? insViewTabsHtml({ views: S.tabs.map(([k, key]) => ({ k, label: _rdT(key), n: S.boxed.filter(x => rdTableIn(x, k, S.yn)).length, keep: k === 'all' })), cur: t.tab, attr: 'data-rdt-tab', label: _rdT('rd_filter') }) : '';
  const head = `<div class="rdt-head"><button type="button" class="ac-link rdt-back" data-rdt-back>${_rdE(_rdT('rd_tt_back'))}</button><span class="rdt-dot" aria-hidden="true">·</span><b class="rdt-nm">${_rdE(r.name)}</b><span class="rdt-sub" title="${_rdE(sub)}">${_rdE(sub)}</span><span class="rdt-sp"></span><button type="button" class="ac-link" data-rdt-copy>${_rdE(_rdT('ac_chip_copy'))}</button><button type="button" class="ac-link" data-rdt-again>${_rdE(_rdT('ac_again'))}</button></div>
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
  if (first) chips.push({ label: rdNextLabel(first, rdSizeNow()), run: () => ((typeof newLookOn === 'function' && newLookOn() && document.querySelector('#rd-page.dsc-page')) ? dscReadMore(first.key, rdSizeNow()) : readsNext(first.key, rdSizeNow())) });
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
  _rd.rows = rdRows();
  if (state.view === 'reads') renderReads();
}
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
    ${readsBandHtml()}
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
let _rdn = 'kept';
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
function rdnAnswerWords(r){
  const got = rdnAnswers(r.askIds[0]); if (!got) return '';
  const xs = Object.values(got).filter(a => a && a.found);
  const yes = xs.filter(a => a.yes === true).length, no = xs.filter(a => a.yes === false).length;
  const unread = Math.max(0, r.total - r.read);
  const dot = (cls, t) => `<span class="rdn-a"><i class="${cls}"></i>${_rdE(t)}</span>`;
  if (yes || no) return [yes ? dot('is-yes', _rdT('rdn_yes', { n: yes })) : '', no ? dot('is-no', _rdT('rdn_no', { n: no })) : '', unread ? dot('is-none', _rdT('rdn_unread', { n: unread })) : ''].join('');
  const by = new Map(); xs.forEach(a => { const k = String(a.answer || '').trim(); if (k) by.set(k, (by.get(k) || 0) + 1); });
  const top = [...by.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2);
  return top.map(([k, n], i) => dot(i ? 'is-amb' : 'is-yes', k + ' ' + n)).join('') + (unread ? dot('is-none', _rdT('rdn_unread', { n: unread })) : '');
}
function rdnRowHtml(r){
  const a = (typeof AC !== 'undefined' && AC.asks) ? (AC.asks[r.askIds[0]] || {}) : {};
  const sub = [r.kept ? _rdT('rdn_kept') : _rdT('rdn_asked'), _rdT('rdn_column'), a.rule ? _rdT('rdn_rule', { rule: a.rule }) : ''].filter(Boolean).join(' · ');
  const unread = Math.max(0, r.total - r.read);
  const act = unread ? `<button type="button" class="rfp-pill" data-rd-next="${_rdE(r.key)}">${_rdE(_rdT('rdn_more', { n: Math.min(unread, rdSizeNow()), calls: _rdTn('rd_calls', Math.min(unread, rdSizeNow())) }))}</button>`
    : `<button type="button" class="rfp-a" data-rdn-table="${_rdE(r.key)}">${_rdE(_rdT('rdn_open_table'))}</button>`;
  return `<tr data-rd-row="${_rdE(r.key)}" class="${_rd.sel === r.key ? 'is-sel' : ''}" tabindex="-1"><td><div class="cun-name">${_rdE(r.q || r.name)}</div><div class="cun-sub">${_rdE(sub)}</div></td>
    <td class="cun-wait">${rdnAnswerWords(r) || '—'}</td><td class="cun-wait">${_rdE(_rdT('rdn_of', { k: r.read, n: r.total }))}</td><td class="cun-wait">${_rdE(r.calls ? _rdTn('rd_calls', r.calls) : '—')}</td><td class="cun-go">${act}</td></tr>`;
}
function rdnPacks(){
  const packs = (typeof AC !== 'undefined' && Array.isArray(AC.packs)) ? AC.packs : [];
  const ran = new Set((_rd.rows || []).filter(r => r.pack).map(r => r.pack.id));
  const total = rdTotal();
  return packs.map(p => ({ p, ran: ran.has(p.id), row: (_rd.rows || []).find(r => r.pack && r.pack.id === p.id) || null, total }));
}
function rdnPackRowHtml(x){
  const qs = (x.p.questions || []).map(q => String(q.name || q.question || '').toLowerCase()).filter(Boolean).join(' · ');
  const n = (x.p.questions || []).length, read = x.row ? x.row.read : 0;
  return `<tr><td><div class="cun-name">${_rdE(_rdT('rdn_pack', { name: x.p.name, n }))}</div><div class="cun-sub">${_rdE(qs)}</div></td>
    <td class="cun-wait">${_rdE(x.ran ? _rdT('rdn_ran') : _rdT('rdn_not_run'))}</td><td class="cun-wait">${_rdE(_rdT('rdn_of', { k: read, n: x.total }))}</td><td class="cun-wait">${_rdE(x.row && x.row.calls ? _rdTn('rd_calls', x.row.calls) : '—')}</td>
    <td class="cun-go"><button type="button" class="rfp-pill" data-rdn-pack="${_rdE(x.p.id)}">${_rdE(_rdT('rdn_run_on', { n: x.total, calls: _rdTn('rd_calls', x.total) }))}</button></td></tr>`;
}
/* READS, AS DRAWN (owner, 8 Nov 2026, the Reads & Contracts drawing, step 7): "Reads · N questions · N answers kept"
   and + Ask a question on one line; the box and All · On a list · Not finished; one table — Question (its name, its
   words under), Read "k of n", Answers (the top three and Not found), On the list of, Asked (by · when); the panel reads
   the chosen question: its answers, where it shows (Open · Remove, Add to a list), Read the other N, Delete question.
   No cost is said. Every press is an existing door (readsNext, readsBring, askColOpen, askColDelete). */
function rdnGroups(r){
  const got = rdnAnswers(r.askIds[0]); if (!got) return [];
  const xs = Object.values(got).filter(Boolean);
  const nf = xs.filter(a => !a.found).length, found = xs.filter(a => a.found);
  const yn = found.filter(a => typeof a.yes === 'boolean');
  let g = [];
  if (yn.length && yn.length === found.length) g = [{ l: _rdT('rdn_yes', { n: '' }).trim(), n: yn.filter(a => a.yes).length, t: 'yes' }, { l: _rdT('rdn_no', { n: '' }).trim(), n: yn.filter(a => !a.yes).length, t: 'amb' }].filter(x => x.n);
  else { const by = new Map(); found.forEach(a => { const k = String(a.answer || '').trim(); if (k) by.set(k, (by.get(k) || 0) + 1); });
    g = [...by.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([l, n], i) => ({ l, n, t: i ? 'amb' : 'yes' })); }
  if (nf) g.push({ l: _rdT('ac_not_found'), n: nf, t: 'none' });
  return g;
}
function rdnOnList(r){
  const R = (typeof regState === 'function') ? regState() : (state.reg || {});
  if (!(Array.isArray(R.ask) && R.ask.includes(r.askIds[0]))) return '';
  return (R.type && R.type !== 'all' && typeof FOLDERS !== 'undefined' && FOLDERS[R.type]) ? FOLDERS[R.type].name : _rdT('nav_contracts');
}
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
let _rdnTabSet = false;
const _dscAC = () => (typeof AC !== 'undefined') ? AC : null;
const _dscMay = () => typeof askColMay !== 'function' || askColMay();
const _dscSize = () => (typeof acSize === 'function') ? acSize() : 50;
/* THE CONTRACTS THE ASK GOES TO: the Contracts list as it is filtered now, and that said in words */
function dscScope(){
  if (typeof regSetScope === 'function'){ try { regSetScope(null); } catch (_){ /* the list's own state */ } }
  let ids = []; try { ids = (typeof askColShown === 'function') ? askColShown() : []; } catch (_){ ids = []; }
  let words = ''; try { words = (typeof regScopeWords === 'function') ? regScopeWords() : ''; } catch (_){ words = ''; }
  return { ids, n: ids.length, words: words || _rdT('reg_tab_all') };
}
/* how many of them the next press reads: the first not yet read, a batch at most (a typed question is new to all) */
function dscPlanN(sc){
  const size = _dscSize(); let unread = sc.n;
  try {
    const ids = _dsc.pack ? ((typeof askColPackAskIds === 'function') ? askColPackAskIds(_dsc.pack) : []) : (_dsc.askId ? [_dsc.askId] : []);
    const whole = !_dsc.pack || ids.length === (_dsc.pack.questions || []).length;
    if (ids.length && whole && typeof askColUnread === 'function') unread = askColUnread(ids, sc.ids).length;
  } catch (_){ unread = sc.n; }
  return { size, unread, pick: Math.min(size, unread) };
}
function dscAskBtnHtml(sc){
  const A = _dscAC(), may = _dscMay();
  if (A && A.busy) return `<button type="button" class="dsc-btn is-quiet" id="dsc-stop">${_rdE(_rdT('ac_stop'))}</button>`;
  if (_dsc.starting) return `<button type="button" class="dsc-btn" disabled>${_rdE(_rdT('dsc_starting'))}</button>`;
  if (A && A.stopped && A.stopped.left && A.stopped.left.length && may) return `<button type="button" class="dsc-btn" id="dsc-carry">${_rdE(_rdT('dsc_carry', { n: A.stopped.left.length }))}</button>`;
  const p = dscPlanN(sc);
  const label = !sc.n ? _rdT('dsc_ask_none') : !p.unread ? _rdT('dsc_ask_all_read', { n: sc.n }) : p.unread <= p.size ? _rdTn('dsc_ask_n', p.unread) : _rdT('dsc_ask_first', { k: p.pick, n: p.unread });
  const off = !may || !sc.n || !p.unread;
  return `<button type="button" class="dsc-btn" id="dsc-go"${off ? ' disabled' : ''}${may ? '' : ` title="${_rdE(_rdT('ac_btn_viewer'))}"`}>${_rdE(label)}</button>`;
}
function dscChipsHtml(rows, sc){
  const A = _dscAC();
  const packs = ((A && A.packs) || []).map(p => `<button type="button" class="rfp-pill dsc-chip${_dsc.pack && _dsc.pack.id === p.id ? ' is-on' : ''}" data-dsc-pack="${_rdE(p.id)}">${_rdE(_rdT('rdn_pack', { name: p.name, n: (p.questions || []).length }))}</button>`).join('');
  const loose = rows.filter(r => !r.kept && !r.fact && r.q && !(typeof askColIsPortfolio === 'function' && askColIsPortfolio(r.q))).slice(0, DSC_CHIPS);
  const team = loose.map(r => `<button type="button" class="rfp-pill dsc-chip${_dsc.askId === r.askIds[0] ? ' is-on' : ''}" data-dsc-q="${_rdE(r.askIds[0])}" title="${_rdE(r.q)}">${_rdE(r.name || r.q)}</button>`).join('');
  return `<div class="dsc-chips">${packs}${team}${team ? `<span class="dsc-quiet">${_rdE(_rdT('dsc_chips_team'))}</span>` : ''}<span class="apn-sp"></span><span class="dsc-quiet dsc-scope">${_rdE(_rdT('dsc_scope'))} <b>${_rdE(sc.words)} · ${sc.n}</b></span></div>`;
}
function dscAskHtml(rows, sc){
  const A = _dscAC(), b = A && A.busy, may = _dscMay();
  const packOn = !b && !!_dsc.pack;
  const val = b ? (b.qCount > 1 ? (b.name || '') : (b.question || b.name || '')) : packOn ? _rdT('rdn_pack', { name: _dsc.pack.name, n: (_dsc.pack.questions || []).length }) : (_dsc.q || '');
  const lock = b || packOn || !may || _dsc.starting;
  return `<div class="dsc-ask${b ? ' is-busy' : ''}">${typeof icon === 'function' ? icon('sparkle', 'w-4 h-4') : ''}
      <input id="dsc-q" class="dsc-in" type="text" autocomplete="off" spellcheck="true" aria-label="${_rdE(_rdT('dsc_ph'))}" placeholder="${_rdE(_rdT('dsc_ph'))}" value="${_rdE(val)}"${lock ? ' readonly' : ''}>
      ${packOn ? `<button type="button" class="rfp-a" data-dsc-unpack>${_rdE(_rdT('dsc_unpack'))}</button>` : ''}${dscAskBtnHtml(sc)}</div>
    ${_dsc.say ? `<div class="dsc-say" role="status">${_rdE(_dsc.say)}</div>` : ''}${dscChipsHtml(rows, sc)}`;
}
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
function dscAnsRowHtml(askId, cid, a, o){
  const c = (typeof getContract === 'function') ? getContract(cid) : null;
  const tone = _rdTone(a, askId), num = (typeof askColClauseNo === 'function') ? askColClauseNo(a) : '';
  const quote = a && a.found ? String(a.quote || '').trim() : '';
  const words = quote ? `${num ? '§ ' + num + ' ' : ''}“${quote}”` : '';
  const may = _dscMay(), ck = a && a.checked;
  const act = o.live ? `<span class="dsc-quiet">${o.sel ? _rdE(_rdT('dsc_just_read')) : ''}</span>`
    : (!ck && tone === 'ruby' && quote) ? `<button type="button" class="rfp-a" data-dsc-go="${_rdE(cid)}">${_rdE(_rdT('dsc_open_clause'))}</button>`
    : (a && !a.noWording) ? `<button type="button" class="rfp-a${ck ? ' is-ck' : ''}" data-dsc-ck="${_rdE(cid)}"${may ? '' : ' disabled'} title="${_rdE(ck ? _rdT('ac_unmark', { who: ck.by, when: rdWhen(ck.at) }) : _rdT('ac_mark'))}">${_rdE(_rdT(ck ? 'dsc_checked' : 'dsc_mark'))}</button>` : '';
  return `<div class="dsc-a${o.sel ? ' is-sel' : ''}"${o.live ? '' : ` data-dsc-pick="${_rdE(cid)}" tabindex="0" role="button"`}><span class="ac-ans tone-${tone}"><i></i></span><span class="dsc-a-n">${_rdE(c ? _rdName(c) : cid)}</span><b class="dsc-a-w">${_rdE(_rdWord(a))}</b><span class="dsc-a-q${words ? '' : ' is-none'}">${_rdE(words || (a && a.noWording ? '' : _rdT('dsc_no_words')))}</span>${act}</div>`;
}
const _dscRank = t => t === 'ruby' ? 0 : t === 'amber' ? 1 : t === 'none' ? 2 : 3;
function dscOpenList(r){
  const askId = r.askIds[0], got = rdnAnswers(askId);
  if (!got) return null;
  return Object.keys(got).filter(id => got[id] && typeof getContract === 'function' && getContract(id)).map(id => ({ id, a: got[id], t: _rdTone(got[id], askId) }))
    .sort((x, y) => _dscRank(x.t) - _dscRank(y.t));
}
function dscOpenHtml(r){
  const xs = dscOpenList(r), askId = r.askIds[0];
  if (!xs) return `<tr class="dsc-opn"><td colspan="5"><div class="dsc-quiet dsc-pad">${_rdE(_rdT('dsc_loading'))}</div></td></tr>`;
  if (!xs.length) return `<tr class="dsc-opn"><td colspan="5"><div class="dsc-quiet dsc-pad">${_rdE(_rdT('dsc_open_none'))}</div></td></tr>`;
  return `<tr class="dsc-opn"><td colspan="5">${xs.slice(0, DSC_OPEN_MAX).map(x => dscAnsRowHtml(askId, x.id, x.a, { sel: x.id === _dsc.pick })).join('')}
    <div class="dsc-pad"><button type="button" class="rfp-a" data-rdn-table="${_rdE(r.key)}">${_rdE(_rdTn('dsc_all_answers', xs.length))}</button></div></td></tr>`;
}
function dscRowHtml(r, o){
  const open = !!(o && o.open), live = !!(o && o.live);
  const G = rdnGroups(r), list = rdnOnList(r);
  const ans = G.map(x => (typeof listChipHtml === 'function') ? listChipHtml(RDN_TONE[x.t] || 'gray', `${x.l} · ${x.n}`) : `${_rdE(x.l)} ${x.n}`).join(' ');
  const asked = live ? _rdT(o.stopped ? 'dsc_row_stopped' : 'dsc_row_reading') : _rdT('rdn2_asked', { by: r.by || (r.asked && r.asked.by) || '', when: r.when ? rdWhen(r.when) : '' }).replace(/^ · | · $/g, '');
  const sel = live || _rd.sel === r.key;
  return `<tr data-rd-row="${_rdE(r.key)}" class="dsc-row${sel ? ' is-sel' : ''}${open ? ' is-open' : ''}${live ? ' is-live' : ''}" tabindex="${live ? -1 : 0}" aria-expanded="${open ? 'true' : 'false'}"><td><div class="dsc-q1"><i class="dsc-cv" aria-hidden="true"></i><div class="dsc-q1b"><div class="cun-name">${_rdE(r.name || r.q)}</div><div class="cun-sub">${_rdE(r.q || '')}</div></div></div></td>
    <td class="rdn-c">${_rdE(_rdT('rdn_of', { k: r.read, n: r.total }))}${rdnProgHtml(r.read, r.total)}</td><td class="rdn-c">${ans || '—'}</td>
    <td class="rdn-c">${list ? _rdE(list) : `<span class="rdn-q">${_rdE(_rdT('rdn2_no_list'))}</span>`}</td><td class="rdn-c">${_rdE(asked)}</td></tr>`;
}
function dscPackRowHtml(x){
  const qs = (x.p.questions || []).map(q => String(q.name || q.question || '')).filter(Boolean).join(' · ');
  const n = (x.p.questions || []).length, read = x.row ? x.row.read : 0;
  return `<tr class="dsc-pack"><td><div class="dsc-q1"><i class="dsc-cv is-none" aria-hidden="true"></i><div class="dsc-q1b"><div class="cun-name">${_rdE(_rdT('rdn_pack', { name: x.p.name, n }))}</div><div class="cun-sub">${_rdE(qs)}</div></div></div></td>
    <td class="rdn-c">${_rdE(_rdT('rdn_of', { k: read, n: x.total }))}${rdnProgHtml(read, x.total)}</td><td class="rdn-c">${_rdE(x.ran ? _rdT('rdn_ran') : _rdT('rdn_not_run'))}</td><td class="rdn-c"><span class="rdn-q">${_rdE(_rdT('rdn2_no_list'))}</span></td>
    <td class="rdn-c"><button type="button" class="rfp-pill" data-dsc-pack="${_rdE(x.p.id)}">${_rdE(_rdT('dsc_pack_use'))}</button>${x.row ? ` <button type="button" class="rfp-a" data-rdn-table="${_rdE(x.row.key)}">${_rdE(_rdT('rdn_open_table'))}</button>` : ''}</td></tr>`;
}
/* the row a read in flight leads the table with: its question, how far it got, its answers as they land */
function dscLiveRows(rows){
  const A = _dscAC(), b = A && A.busy; if (!b) return { html: '', key: '' };
  const askId = b.askId || '', key = askId ? 'ask:' + askId : '';
  const base = rows.find(r => r.key === key) || null, total = rdTotal();
  const got = (askId && A.ans[askId]) || {};
  const read = Math.min(total, Object.keys(got).filter(id => got[id]).length);
  const r = Object.assign({ key: key || '__live', askIds: askId ? [askId] : [], name: b.qCount > 1 ? (b.name || '') : (b.name || (base && base.name) || ''), q: b.qCount > 1 ? '' : (b.question || ''), by: '', when: '', total }, base || {}, { read });
  const done = (b.doneIds || []).filter(id => got[id]);
  let inner = '';
  for (let i = done.length - 1; i >= Math.max(0, done.length - DSC_LIVE_MAX); i--) inner += dscAnsRowHtml(askId, done[i], got[done[i]], { live: true, sel: done[i] === _dsc.liveCid });
  const bar = `<div class="dsc-live-bar" role="img" aria-label="${_rdE(_rdT('dsc_live_n', { k: b.done, n: b.total }))}"><i style="width:${b.total ? Math.round(b.done / b.total * 100) : 0}%"></i></div>`;
  return { key, html: dscRowHtml(r, { open: true, live: true, stopped: !!b.stop }) + `<tr class="dsc-opn is-live"><td colspan="5">${bar}${inner || `<div class="dsc-quiet dsc-pad">${_rdE(_rdT('dsc_live_first'))}</div>`}</td></tr>` };
}
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
let _rdnPanelSel;
function rdnRender(host, o){
  const A = _dscAC(), busy = !!(A && A.busy);
  const rows = (_rd.rows || []).filter(r => !r.pack);
  const kept = rows.filter(r => r.kept || r.fact), packs = rdnPacks();
  if (!['kept', 'packs', 'all'].includes(_rdn)) _rdn = 'kept';
  /* a question just asked is nobody's kept one yet: the tab that shows it is Every read */
  if (!_rdnTabSet && _rdn === 'kept' && !kept.length && rows.length) _rdn = 'all';
  const sc = dscScope();
  dscLiveTurn();
  const live = busy ? dscLiveRows(rows) : { html: '', key: '' };
  const shown = (_rdn === 'kept' ? kept : _rdn === 'all' ? rows : []).filter(r => r.key !== live.key);
  /* the question the panel reads is one the table shows (a tab that hides it lets it go) */
  if (!busy && _rdn !== 'packs' && !shown.some(r => r.key === _rd.sel)) _rd.sel = shown[0] ? shown[0].key : null;
  if (_dsc.open && (busy || !shown.some(r => r.key === _dsc.open))){ _dsc.open = null; _dsc.pick = null; }
  const openRow = _dsc.open ? shown.find(r => r.key === _dsc.open) : null;
  if (openRow){ const xs = dscOpenList(openRow) || []; if (!xs.slice(0, DSC_OPEN_MAX).some(x => x.id === _dsc.pick)) _dsc.pick = xs[0] ? xs[0].id : null; }
  const answers = rows.reduce((n, r) => n + (r.read || 0), 0);
  const facts = _rdTn('rdn2_facts', rows.length, { q: rows.length, a: answers });
  const tab = (k, w, n) => `<button type="button" class="apn-tab${_rdn === k ? ' is-on' : ''}" data-rdn-tab="${k}">${_rdE(w)} <span>${n}</span></button>`;
  const body = _rdn === 'packs' ? (packs.map(dscPackRowHtml).join('') || `<tr><td colspan="5" class="apn-none">${_rdE(_rdT('dsc_none_packs'))}</td></tr>`)
    : (shown.map(r => dscRowHtml(r, { open: r.key === _dsc.open }) + (r.key === _dsc.open ? dscOpenHtml(r) : '')).join('') || (live.html ? '' : `<tr><td colspan="5" class="apn-none">${_rdE(_rdT(_rdn === 'kept' ? 'dsc_none_kept' : 'dsc_none'))}</td></tr>`));
  const PAGE = `<div class="view-enter sap-page ap-page is-ins apn-page cun-page rdn-page dsc-page" id="rd-page" data-ins-page="reads" data-ins="1">
    <div class="ap-body is-ins"><section class="ap-card apn-card">
      <div class="cun-head rdn-head"><h2 class="ctf-h">${_rdE(_rdT('nav_reads'))}</h2><span class="ctf-hf">${_rdE(facts)}</span></div>
      ${dscAskHtml(rows, sc)}
      <div class="apn-bar dsc-tabs">${tab('kept', _rdT('dsc_tab_kept'), kept.length)}${tab('packs', _rdT('rd_tab_packs'), packs.length)}${tab('all', _rdT('dsc_tab_all'), rows.length)}<span class="apn-sp"></span></div>
      <div class="cu-scroll"><table class="apn-table cun-table rdn-table rdn2 dsc-table"><colgroup><col style="width:32%"><col style="width:12%"><col style="width:27%"><col style="width:12%"><col style="width:17%"></colgroup>
        <thead><tr><th>${_rdE(_rdT('rdn_c_q'))}</th><th>${_rdE(_rdT('rd_col_read'))}</th><th>${_rdE(_rdT('rdn_c_a'))}</th><th>${_rdE(_rdT('rdn2_c_list'))}</th><th>${_rdE(_rdT('rdn2_c_asked'))}</th></tr></thead>
        <tbody>${live.html}${body}</tbody></table></div>
      <div class="apn-foot rdn-foot"><span>${_rdE(_rdT('rdn2_foot'))}</span>${_rd.sel ? `<button type="button" class="rfp-a" data-rdn-table="${_rdE(_rd.sel)}">${_rdE(_rdT('rdn_the_table'))}</button>` : ''}</div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${_rdE(_rdT('rd_panel_label'))}"></aside></div></div>`;
  /* A TAB PRESS ONLY CHANGES WHICH ROWS SHOW (Kept · Packs · Every read draw the one table), so it redraws only the rows
     (listRowsSwapHtml); anything it will not swap draws the whole page */
  if (o && o.rows && !busy && typeof listRowsSwapHtml === 'function'
    && listRowsSwapHtml({ page: '#rd-page.dsc-page', html: PAGE, table: '.rdn-table', tabSel: '[data-rdn-tab]', tabKey: 'data-rdn-tab', footSel: '.rdn-foot', also: '.rdn-head .ctf-hf' })){
    _rdnPanelSel = _rd.sel; dscPanelPaint(rows); return;
  }
  /* a repaint keeps what is being typed and where the reader stood (the ask box, a row, the list's own scroll) */
  const act = document.activeElement, inPage = act && act.closest && act.closest('#rd-page');
  const keepId = inPage && act.id ? act.id : '', keepRow = inPage && !keepId && act.getAttribute ? (act.getAttribute('data-rd-row') || '') : '';
  const keepPick = inPage && !keepId && !keepRow && act.getAttribute ? (act.getAttribute('data-dsc-pick') || '') : '';
  const at = keepId === 'dsc-q' && typeof listCaretAt === 'function' ? listCaretAt('#dsc-q') : null;
  const sc0 = document.querySelector('#rd-page.dsc-page .cu-scroll'), top0 = sc0 ? sc0.scrollTop : 0;
  host.innerHTML = PAGE;
  const sc1 = host.querySelector('.cu-scroll'); if (sc1 && top0 && !(o && o.top)) sc1.scrollTop = top0;
  if (keepId === 'dsc-q' && typeof listCaretPut === 'function') listCaretPut('#dsc-q', at);
  else if (keepId && document.getElementById(keepId)) document.getElementById(keepId).focus({ preventScroll: true });
  else if (keepRow){ const el = host.querySelector(`[data-rd-row="${CSS.escape(keepRow)}"]`); if (el) el.focus({ preventScroll: true }); }
  else if (keepPick){ const el = host.querySelector(`[data-dsc-pick="${CSS.escape(keepPick)}"]`); if (el) el.focus({ preventScroll: true }); }
  _rdnPanelSel = _rd.sel;
  dscPanelPaint(rows);
  readsWire();
  if (typeof setActiveNav === 'function') setActiveNav('reads');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* THE PANEL HAS THREE FACES: the paper of the contract just read (a read in flight), the paper an open question's
   chosen answer was read from, and — nothing open — the question's summary */
function dscPanelPaint(rows){
  if (typeof insPaintPanel !== 'function') return;
  const A = _dscAC(), b = A && A.busy;
  const base = { seat: RD_SEAT, head: false, jlHome: _rdT('nav_reads'), jlSay: rdJlSay };
  if (b){
    const word = _rdT(b.stop ? 'dsc_tab_stopped' : 'dsc_tab_reading', { k: b.done, n: b.total });
    const cid = _dsc.liveCid;
    const body = cid ? dscPaperHtml(b.askId, cid) : `<div class="rfp-panel is-drawn rdn-panel"><p class="ac-nl-hint">${_rdE(_rdT('dsc_live_first'))}</p></div>`;
    insPaintPanel(Object.assign(base, { item: { id: 'live:' + (cid || '') }, body, jlTabWord: word, jlPh: _rdT('dsc_ph_clause'), jlLinks: cid ? dscPaperLinksHtml(b.askId, cid) : '' }));
    return;
  }
  const r = _dsc.open ? rows.find(x => x.key === _dsc.open) : null;
  if (r && _dsc.pick){
    insPaintPanel(Object.assign(base, { item: { id: 'paper:' + _dsc.pick }, body: dscPaperHtml(r.askIds[0], _dsc.pick), jlTabWord: _rdT('dsc_tab_paper'), jlPh: _rdT('dsc_ph_clause'), jlLinks: dscPaperLinksHtml(r.askIds[0], _dsc.pick) }));
    return;
  }
  rdnPanelPaint(rows);
}
function dscPaperLinksHtml(askId, cid){
  return `<button type="button" class="jb-way" data-dsc-open="${_rdE(cid)}" data-dsc-ask="${_rdE(askId)}">${_rdE(_rdT('dsc_l_open'))}</button><button type="button" class="jb-way" data-dsc-redline="${_rdE(cid)}" data-dsc-ask="${_rdE(askId)}">${_rdE(_rdT('dsc_l_redline'))}</button>`;
}
function rdnPanelPaint(rows){
  if (typeof insPaintPanel !== 'function') return;
  const r = rows.find(x => x.key === _rd.sel) || null;
  const E = _rdE;
  const cap = t => `<div class="rfp-cap">${E(t)}</div>`;
  const row = (k, v, sub) => `<div class="rfp-row"><span class="rfp-k">${k}${sub ? `<small>${E(sub)}</small>` : ''}</span><span class="rfp-v">${v}</span></div>`;
  let card = '';
  if (r){
    const G = rdnGroups(r), n = Math.max(1, r.total), unread = Math.max(0, r.total - r.read), list = rdnOnList(r), may = _dscMay(), size = _dscSize();
    const sub = _rdT('rdn2_p_sub', { by: r.by || '', when: r.when ? rdWhen(r.when) : '', k: r.read, n: r.total }).replace(/^ · /, '');
    const bar = `<div class="rdn-bar" aria-hidden="true">${G.map(x => `<i class="rdn-b-${x.t}" style="width:${(x.n / n * 100).toFixed(2)}%"></i>`).join('')}</div>`;
    const ans = G.map(x => row(`<i class="rdn-dot rdn-b-${x.t}"></i>${E(x.l)}`, String(x.n))).join('');
    const where = list ? row(E(list), `<button type="button" class="rfp-a" data-rd-act="bring">${E(_rdT('rdn2_open'))}</button> · <button type="button" class="rfp-a" data-rd-act="unlist">${E(_rdT('rdn2_remove'))}</button>`, _rdT('rdn2_col_on'))
      : row(E(_rdT('rdn2_another')), `<button type="button" class="rfp-a" data-rd-act="bring">${E(_rdT('rdn2_add'))}</button>`);
    const more = unread > size ? _rdT('dsc_read_next', { n: size }) : _rdT('rdn2_read_more', { n: unread });
    const keep = may && !r.fact ? `<button type="button" class="rfp-pill" data-dsc-keep="${r.kept ? '0' : '1'}" title="${E(_rdT(r.kept ? 'ac_keep_off_tip' : 'ac_keep_on_tip'))}">${E(_rdT(r.kept ? 'ac_keep_off' : 'ac_keep_on'))}</button>` : '';
    card = `<p class="ac-nl-q">${E(r.q || r.name)}</p><p class="ac-nl-hint">${E(sub)}</p>
      ${G.length ? cap(_rdT('ac_nl_answers')) + bar + ans : ''}${cap(_rdT('rdn2_where'))}${where}
      <div class="rfp-acts">${unread && may ? `<button type="button" class="ui-btn ui-btn-primary rdn-go" data-rd-act="next" data-rd-n="${Math.min(unread, size)}">${E(more)}</button>` : ''}${keep}${may ? `<button type="button" class="rfp-pill" data-rd-act="delete">${E(_rdT('rdn2_delete'))}</button>` : ''}</div>`;
  }
  insPaintPanel({ seat: RD_SEAT, item: { id: (r && r.key) || '__reads' }, head: false, body: `<div class="rfp-panel is-drawn rdn-panel">${card}</div>`,
    jlHome: _rdT('nav_reads'), jlPh: _rdT('jl_ph_any'), jlSay: rdJlSay });
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
  if (state.view !== 'reads' && typeof setView === 'function') setView('reads'); else renderReads();
}
function dscSay(msg){ _dsc.say = String(msg || ''); renderReads(); }
/* ASK: what the box holds (typed words, a team question brought back, or a pack), of the list Contracts shows */
async function dscAsk(){
  const A = _dscAC(); if (!A || A.busy || _dsc.starting) return;
  if (!_dscMay()){ dscSay(_rdT('ac_btn_viewer')); return; }
  const el = document.getElementById('dsc-q'); if (el && !_dsc.pack) _dsc.q = el.value;
  const q = String(_dsc.q || '').trim();
  if (!_dsc.pack && q.length < 3){ dscSay(_rdT('dsc_say_short')); const again = document.getElementById('dsc-q'); if (again) again.focus(); return; }
  const sc = dscScope();
  const o = _dsc.pack ? { pack: _dsc.pack } : (_dsc.askId ? { askId: _dsc.askId } : { question: q });
  _dsc.say = ''; _dsc.open = null; _dsc.pick = null; _dsc.liveCid = null; _dsc.liveAt = 0; _dsc.starting = true; _rd.sel = null;
  renderReads({ top: true });
  let got = null;
  try { const p = askColAskHere(o); setTimeout(() => { _dsc.starting = false; }, 0); got = await p; } catch (_){ got = null; }
  _dsc.starting = false;
  if (got && got.short){ dscSay(_rdT('dsc_say_short')); return; }
  if (got && got.portfolio){ dscSay(_rdT('dsc_say_count')); return; }
  if (got && got.none){ dscSay(_rdT('dsc_say_all_read', { words: sc.words, n: sc.n })); return; }
  let key = null;
  if (got && got.asks && got.asks.length){
    key = _dsc.pack ? null : 'ask:' + got.asks[0].id;
    _dsc.q = ''; _dsc.askId = null; _dsc.pack = null;
  }
  _rd.loading = false;
  await rdLoad(true);
  /* THE QUESTION JUST READ IS IN FRONT, OPEN: a new one is nobody's kept question yet, so the tab that shows it is Every read */
  const row = key ? (_rd.rows || []).find(r => r.key === key) : null;
  if (row){
    if (_rdn !== 'all' && !(_rdn === 'kept' && (row.kept || row.fact))) _rdn = 'all';
    _rd.sel = key; _dsc.open = (got.stopped || got.err) ? null : key; _dsc.pick = null;
    renderReads({ top: true });
  }
}
async function dscReadMore(key, size){
  const A = _dscAC(); const r = rdFind(key); if (!r || !A || A.busy) return;
  if (typeof acSizeSet === 'function' && typeof AC_SIZES !== 'undefined' && AC_SIZES.includes(Number(size))) acSizeSet(size);
  const sc = dscScope();
  _dsc.say = ''; _dsc.open = null; _dsc.pick = null; _dsc.liveCid = null; _dsc.liveAt = 0;
  const p = r.pack ? (A.packs || []).find(x => x.id === r.pack.id) : null;
  let got = null;
  try { got = await askColAskHere(p ? { pack: p } : { askId: r.askIds[0] }); } catch (_){ got = null; }
  if (got && got.none){ dscSay(_rdT('dsc_say_all_read', { words: sc.words, n: sc.n })); return; }
  await rdLoad(true);
}
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
if (typeof document !== 'undefined' && !document._rdnWired){ document._rdnWired = true;
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'reads') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const A = _dscAC();
    let el;
    if ((el = t.closest('[data-rdn-tab]'))){ e.preventDefault(); _rdn = el.getAttribute('data-rdn-tab'); _rdnTabSet = true; renderReads({ rows: true, top: true }); return; }
    if ((el = t.closest('[data-rdn-table]'))){ e.preventDefault(); e.stopPropagation(); readsTableOpen(el.getAttribute('data-rdn-table')); return; }
    if (!t.closest('#rd-page.dsc-page') && !t.closest('#ins-panel')) return;
    if (t.closest('#dsc-go')){ e.preventDefault(); e.stopPropagation(); dscAsk(); return; }
    if (t.closest('#dsc-stop')){ e.preventDefault(); e.stopPropagation(); if (typeof askColStop === 'function') askColStop(); return; }
    if (t.closest('#dsc-carry')){ e.preventDefault(); e.stopPropagation(); _dsc.liveCid = null; if (typeof askColCarryOn === 'function') Promise.resolve(askColCarryOn()).catch(() => {}).then(() => rdLoad(true)); return; }
    if (t.closest('[data-dsc-unpack]')){ e.preventDefault(); e.stopPropagation(); _dsc.pack = null; _dsc.say = ''; renderReads(); const q = document.getElementById('dsc-q'); if (q) q.focus(); return; }
    if ((el = t.closest('[data-dsc-pack]'))){ e.preventDefault(); e.stopPropagation(); if (A && A.busy) return;
      const p = ((A && A.packs) || []).find(x => x.id === el.getAttribute('data-dsc-pack')) || null;
      _dsc.pack = (_dsc.pack && p && _dsc.pack.id === p.id) ? null : p; _dsc.q = ''; _dsc.askId = null; _dsc.say = ''; renderReads(); return; }
    if ((el = t.closest('[data-dsc-q]'))){ e.preventDefault(); e.stopPropagation(); if (A && A.busy) return;
      const id = el.getAttribute('data-dsc-q'), a = A && A.asks ? A.asks[id] : null;
      if (_dsc.askId === id){ _dsc.askId = null; _dsc.q = ''; } else if (a){ _dsc.askId = id; _dsc.q = a.question || ''; }
      _dsc.pack = null; _dsc.say = ''; renderReads(); const q = document.getElementById('dsc-q'); if (q) q.focus(); return; }
    if ((el = t.closest('[data-dsc-go]'))){ e.preventDefault(); e.stopPropagation(); const r = _dsc.open ? rdFind(_dsc.open) : null; if (r) dscLand(r.askIds[0], el.getAttribute('data-dsc-go'), false); return; }
    if ((el = t.closest('[data-dsc-ck]'))){ e.preventDefault(); e.stopPropagation(); const r = _dsc.open ? rdFind(_dsc.open) : null;
      if (r && !el.disabled && typeof askColCheck === 'function') Promise.resolve(askColCheck(r.askIds[0], el.getAttribute('data-dsc-ck'))).catch(() => {}).then(() => discoverLive(true)); return; }
    if ((el = t.closest('[data-dsc-open]'))){ e.preventDefault(); e.stopPropagation(); dscLand(el.getAttribute('data-dsc-ask'), el.getAttribute('data-dsc-open'), false); return; }
    if ((el = t.closest('[data-dsc-redline]'))){ e.preventDefault(); e.stopPropagation(); dscLand(el.getAttribute('data-dsc-ask'), el.getAttribute('data-dsc-redline'), true); return; }
    if ((el = t.closest('[data-dsc-keep]')) && _rd.sel){ e.preventDefault(); e.stopPropagation(); const r = rdFind(_rd.sel);
      if (r && typeof askColKeep === 'function') Promise.resolve(askColKeep(r.askIds[0], el.getAttribute('data-dsc-keep') === '1')).catch(() => {}).then(() => rdLoad(true)); return; }
    if ((el = t.closest('[data-rd-act="next"]')) && _rd.sel && t.closest('#ins-panel') && document.querySelector('#rd-page.dsc-page')){ e.preventDefault(); e.stopPropagation(); dscReadMore(_rd.sel, Number(el.getAttribute('data-rd-n')) || _dscSize()); return; }
    if ((el = t.closest('[data-dsc-pick]'))){ e.preventDefault(); e.stopPropagation(); const id = el.getAttribute('data-dsc-pick'); if (_dsc.pick !== id){ _dsc.pick = id; renderReads(); } return; }
    if ((el = t.closest('#rd-page.dsc-page [data-rd-row]'))){ e.preventDefault(); e.stopPropagation(); if (A && A.busy) return;
      const key = el.getAttribute('data-rd-row');
      _rd.sel = key; _dsc.open = _dsc.open === key ? null : key; _dsc.pick = null;
      if (typeof insSelect === 'function') insSelect(RD_SEAT, key);
      renderReads(); return; }
  }, true);
  /* the ask box keeps its words through every repaint; words typed over a question brought back are a new question */
  document.addEventListener('input', e => { if (e.target && e.target.id === 'dsc-q' && typeof state !== 'undefined' && state.view === 'reads'){
    _dsc.q = e.target.value; const A = _dscAC(), a = _dsc.askId && A && A.asks ? A.asks[_dsc.askId] : null;
    if (a && String(a.question || '') !== _dsc.q) _dsc.askId = null;
    if (_dsc.say){ _dsc.say = ''; const s = document.querySelector('#rd-page .dsc-say'); if (s) s.remove(); } } });
  document.addEventListener('keydown', e => {
    if (typeof state === 'undefined' || state.view !== 'reads' || !e.target || !e.target.closest) return;
    if (e.target.id === 'dsc-q' && e.key === 'Enter' && !e.isComposing){ e.preventDefault(); e.stopPropagation(); dscAsk(); return; }
    const pick = e.target.closest('#rd-page.dsc-page [data-dsc-pick]');
    if (pick && e.target === pick && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); e.stopPropagation(); pick.click(); return; }
    const row = e.target.closest('#rd-page.dsc-page [data-rd-row]');
    if (!row || e.target !== row) return;
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); e.stopPropagation(); row.click(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); e.stopPropagation();
      const all = [...document.querySelectorAll('#rd-page.dsc-page tr[data-rd-row]')], at = all.indexOf(row), to = all[at + (e.key === 'ArrowDown' ? 1 : -1)];
      if (!to) return;
      const key = to.getAttribute('data-rd-row'); _rd.sel = key; if (_dsc.open && _dsc.open !== key){ _dsc.open = null; _dsc.pick = null; }
      renderReads(); const again = document.querySelector('#rd-page.dsc-page tr[data-rd-row="' + CSS.escape(key) + '"]'); if (again) again.focus();
    }
  }, true);
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

Object.assign(window, { discoverOpen, discoverLive, dscScope, dscSlice, readsTableOpen, readsTableBack, rdTableRows, rdPlace, rdPlacePut, renderReads, readsOpen, readsShown, readParts, rdRows, readsFacts, readsNext, readsAskNew });
