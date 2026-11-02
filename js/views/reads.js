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
  card.innerHTML = `${P.head}<div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${P.body}</div>${P.foot}`;
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
  const chips = [{ label: _rdT('ac_btn'), run: () => readsAskNew() }];
  const first = qs.find(r => r.total > r.read);
  if (first) chips.push({ label: rdNextLabel(first, rdSizeNow()), run: () => readsNext(first.key, rdSizeNow()) });
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
  const tr = _rd.table ? rdFind(_rd.table.key) : null;
  if (_rd.table && !tr && _rd.rows && _rd.rows.length && _rd.at) _rd.table = null;
  const P = tr ? rdTableHtml(tr) : null;
  const card = P ? `<section class="ins-card rd-card is-table" aria-label="${_rdE(tr.name)}">${P.head}<div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${P.body}</div>${P.foot}</section>`
    : `<section class="ins-card rd-card" aria-label="${_rdE(_rdT('nav_reads'))}">
      <div class="ins-scroll rd-wrap scroll-thin" id="rd-scroll">${readsTableHtml(list)}</div>
      ${rdFootHtml(list)}
    </section>`;
  /* the new look (round 6, as drawn): its own page — kept questions and packs as one table, the panel reads the chosen one */
  if (!tr && wide && typeof window.newLookOn === 'function' && newLookOn()){ rdnRender(host); return; }
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
function rdnRender(host){
  const rows = (_rd.rows || []).filter(r => !r.pack);
  const q = rdWords();
  const kept = rows.filter(r => rdHit(r, q));
  const packs = rdnPacks().filter(x => !q || String(x.p.name || '').toLowerCase().includes(q));
  const notRun = rdnPacks().filter(x => !x.ran).length;
  const month = (typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10)).slice(0, 7);
  const calls = (((typeof AC !== 'undefined' && AC.reads && AC.reads.reads) || []).filter(r => String(r.at || '').slice(0, 7) === month).reduce((n, r) => n + (r.calls || 0), 0));
  const facts = [_rdTn('rdn_n_kept', rows.length), notRun ? _rdTn('rdn_n_notrun', notRun) : ''].filter(Boolean).join(' · ');
  const tab = (k, w, n) => `<button type="button" class="apn-tab${_rdn === k ? ' is-on' : ''}" data-rdn-tab="${k}">${_rdE(w)} <span>${n}</span></button>`;
  const body = (_rdn !== 'packs' ? kept.map(rdnRowHtml).join('') : '')
    + (packs.length ? `<tr class="rdn-grp"><td colspan="5">${_rdE(_rdT('rd_tab_packs'))}</td></tr>${packs.map(rdnPackRowHtml).join('')}` : '');
  if (!_rd.sel || !rows.some(r => r.key === _rd.sel)) _rd.sel = kept[0] ? kept[0].key : null;
  host.innerHTML = `<div class="view-enter sap-page ap-page is-ins apn-page cun-page rdn-page" id="rd-page" data-ins-page="reads" data-ins="1">
    <div class="ap-body is-ins"><section class="ap-card apn-card">
      <div class="cun-head"><h2 class="ctf-h">${_rdE(_rdT('nav_reads'))}</h2><span class="ctf-hf">${_rdE(facts)}</span></div>
      <div class="apn-bar"><label class="apn-box">${typeof icon === 'function' ? icon('search', 'w-3.5 h-3.5') : ''}<input id="rdn-q" type="search" autocomplete="off" placeholder="${_rdE(_rdT('lh_filter_ph'))}" value="${_rdE(_rd.q || '')}"></label><span class="apn-sp"></span>
        ${tab('kept', _rdT('rdn_tab_kept'), rows.length)}${tab('packs', _rdT('rd_tab_packs'), rdnPacks().length)}<span class="rdn-spent">${_rdE(_rdT('rdn_spent', { calls: _rdTn('rd_calls', calls) }))}</span></div>
      <div class="cu-scroll"><table class="apn-table cun-table rdn-table"><colgroup><col style="width:34%"><col style="width:22%"><col style="width:14%"><col style="width:12%"><col></colgroup>
        <thead><tr><th>${_rdE(_rdT('rdn_c_q'))}</th><th>${_rdE(_rdT('rdn_c_a'))}</th><th>${_rdE(_rdT('rd_col_read'))}</th><th>${_rdE(_rdT('rdn_c_spent'))}</th><th></th></tr></thead>
        <tbody>${body || `<tr><td colspan="5" class="apn-none">${_rdE(_rdT('ap_wl_none_match'))}</td></tr>`}</tbody></table></div>
      <div class="apn-foot rdn-foot"><span>${_rdE(_rdT('rdn_foot'))}</span>${_rd.sel ? `<button type="button" class="rfp-a" data-rdn-table="${_rdE(_rd.sel)}">${_rdE(_rdT('rdn_the_table'))}</button>` : ''}</div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${_rdE(_rdT('rd_panel_label'))}"></aside></div></div>`;
  rdnPanelPaint(rows);
  readsWire();
  if (typeof setActiveNav === 'function') setActiveNav('reads');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
function rdnPanelPaint(rows){
  if (typeof insPaintPanel !== 'function') return;
  const r = rows.find(x => x.key === _rd.sel) || null;
  const E = _rdE;
  const risk = rows.reduce((n, x) => n + (x.risk || 0), 0);
  const head = [_rdTn('rdn_p_kept', rows.length), risk ? _rdTn('rdn_p_risk', risk) : ''].filter(Boolean).join(' ');
  let card = '';
  if (r){
    const got = rdnAnswers(r.askIds[0]) || {};
    const xs = Object.entries(got).filter(([, a]) => a && a.found);
    const yes = xs.filter(([, a]) => a.yes === true).length, no = xs.filter(([, a]) => a.yes === false).length, other = xs.length - yes - no;
    const unread = Math.max(0, r.total - r.read), n = Math.max(1, r.total);
    const w = k => (k / n * 100).toFixed(2) + '%';
    const pick = xs.find(([, a]) => a.yes === true && a.quote) || xs.find(([, a]) => a.quote);
    const pc = pick && typeof getContract === 'function' ? getContract(pick[0]) : null;
    const m = pick ? /^\s*(\d+)/.exec(String(pick[1].clause || '')) : null;
    card = `<div class="pd2-ch-cap">${E(r.q || r.name)}</div><div class="rfp-bar"><i class="is-yes" style="width:${w(yes)}"></i><i class="is-no" style="width:${w(no + other)}"></i></div>
      <div class="rfp-counts">${E([yes || no ? _rdT('rdn_yes', { n: yes }) : '', yes || no ? _rdT('rdn_no', { n: no }) : '', other ? _rdTn('rdn_other', other) : '', unread ? _rdT('rdn_unread', { n: unread }) : ''].filter(Boolean).join(' · '))}</div>
      ${pick ? `<div class="rfp-q"><b>${E((pc && pc.name) || pick[0])} —</b><p><i>“${E(String(pick[1].quote).slice(0, 140))}${String(pick[1].quote).length > 140 ? '…' : ''}”</i><span>${m ? '§ ' + m[1] : ''}</span></p></div>` : ''}`;
  }
  const others = rows.filter(x => !r || x.key !== r.key).slice(0, 2).map(x => `<div class="rfp-ask"><button type="button" class="rfp-a" data-rd-row="${E(x.key)}">${E(x.q || x.name)}</button><span>${E(_rdTn('rd_calls', Math.max(0, x.total - x.read)))}</span></div>`);
  const packs = rdnPacks().filter(x => !x.ran).slice(0, 2).map(x => `<div class="rfp-ask"><button type="button" class="rfp-a" data-rdn-pack="${E(x.p.id)}">${E(_rdT('rdn_run_pack', { name: String(x.p.name || '').toLowerCase() }))}</button><span>${E(_rdTn('rd_calls', x.total))}</span></div>`);
  const ask = others.length || packs.length ? `<div class="pd2-ch-cap">${E(_rdT('reg_fp_ask_h'))}</div>${others.join('')}${packs.join('')}` : '';
  const turn = `<div class="pd2-turn"><i class="pd2-jface" aria-hidden="true"></i><div><b>${E(_rdT('cn2_jambo'))}</b><p>${E(_rdT('rdn_p_jambo'))}</p></div></div>`;
  insPaintPanel({ seat: RD_SEAT, item: { id: (r && r.key) || '__reads' }, head: false, body: `<div class="pd2-chosen cun-panel"><p class="pd2-ch-head">${E(head)}</p>${card}${ask}${turn}</div>`,
    jlHome: _rdT('nav_reads'), jlPh: _rdT('jl_ph_any'), jlSay: rdJlSay });
}
if (typeof document !== 'undefined' && !document._rdnWired){ document._rdnWired = true;
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'reads') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    let el;
    if ((el = t.closest('[data-rdn-tab]'))){ e.preventDefault(); _rdn = el.getAttribute('data-rdn-tab'); renderReads(); return; }
    if ((el = t.closest('[data-rdn-table]'))){ e.preventDefault(); e.stopPropagation(); readsTableOpen(el.getAttribute('data-rdn-table')); return; }
    if ((el = t.closest('[data-rdn-pack]'))){ e.preventDefault(); e.stopPropagation(); const p = ((typeof AC !== 'undefined' && AC.packs) || []).find(x => x.id === el.getAttribute('data-rdn-pack'));
      if (p) rdOnContracts(() => { if (typeof askColOpen === 'function') askColOpen({ pack: p }); }); }
  }, true);
  document.addEventListener('input', e => { if (e.target && e.target.id === 'rdn-q' && typeof state !== 'undefined' && state.view === 'reads'){ _rd.q = e.target.value; renderReads();
    const q = document.getElementById('rdn-q'); if (q){ q.focus(); const n = q.value.length; try { q.setSelectionRange(n, n); } catch (_){} } } });
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
  .rdt-w{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
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

Object.assign(window, { readsTableOpen, readsTableBack, rdTableRows, rdPlace, rdPlacePut, renderReads, readsOpen, readsShown, readParts, rdRows, readsFacts, readsNext, readsAskNew });
