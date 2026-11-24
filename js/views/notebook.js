/* ============================================================
   THE NOTEBOOK PAGE, THE LEGORA + STRIPE WAY (owner's pick, 23 Nov 2026, as drawn on the Handbook's frame)
   ============================================================
   Laws, the company's own policies and anyone's own research, kept for Jambo to quote. As drawn:
   the head (title, "documents Jambo may quote", + Add a document), tabs with their counts (All ·
   Company · Mine), a quiet filter box and "+ Kind · + Status · + Added by" chips, ONE calm table —
   each row the document's name with the words Jambo last quoted from it and their section, a soft
   badge for its kind and its status, its shelf, how often quoted, the day last checked, and a
   due check answered IN THE ROW (Mark checked). A row's first press CHOOSES it (Jambo's panel:
   badges, the quote, "Where I quote it" bars, a timeline, Open · Mark checked · Replace); the
   second press, or Open, OPENS it in the middle (the document by its sections, the ones Jambo
   quoted lightly marked, ‹ Notebook back).

   THE SERVER IS THE WALL (POST /api/notebook…): the page only offers what the reader may do —
   the Company shelf's Add, Mark checked and Replace are an admin's; Mine is the writer's. A file
   is read by THE ONE READER (uploadReadFile, no metadata read, so no AI but a scan's OCR) and its
   words sent; the server cuts the sections (js/notebook.js). Nothing here spends AI. */
const NB_SEAT = 'notebook';
let _nb = { docs: null, err: '', mayAdd: false, tab: 'all', q: '', fKind: '', fStatus: '', fBy: '', menu: null, pick: null, open: null, full: new Map(), busy: false };
const _nbE = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
const _nbT = (k, v) => (typeof i18t === 'function' ? i18t(k, v) : k);
const _nbTn = (k, n, v) => (typeof i18tn === 'function' ? i18tn(k, n, v) : String(n));
const NB_KIND_TONE = { law: 'steel', policy: 'violet', research: 'gray' };
const NB_STATUS_TONE = { ok: 'green', due: 'amber', none: 'gray' };
function nbDay(iso){
  const d = String(iso || '').slice(0, 10); if (!d) return '—';
  return (typeof regDotDate === 'function') ? regDotDate(d) : d;
}
function nbKindBadge(k){ return `<span class="hbkn-bd is-${NB_KIND_TONE[k] || 'gray'}">${_nbE(_nbT('nb_kind_' + k))}</span>`; }
function nbStatusBadge(s){ return `<span class="hbkn-bd is-${NB_STATUS_TONE[s] || 'gray'}">${_nbE(_nbT('nb_st_' + s))}</span>`; }
/* the quoted words as said: without the number the badge already says (an older count kept it) */
const nbWordsShown = w => (typeof window.nbWordsOf === 'function' ? window.nbWordsOf(w) : String(w || ''));
const nbMayWrite = d => !!d && (d.mine || !!_nb.mayAdd);
/* only an admin moves a document across shelves (the server is the wall) */
const nbMayMove = d => !!d && !!_nb.mayAdd;
/* ---- the record: one read, kept for the sitting; every press reads the answer the server gives ---- */
async function nbLoad(force){
  if (_nb.docs && !force) return _nb.docs;
  if (!(typeof API_MODE === 'function' && API_MODE())){ _nb.docs = []; _nb.err = _nbT('nb_needs_server'); return _nb.docs; }
  try { const r = await api('notebook'); _nb.docs = Array.isArray(r && r.docs) ? r.docs : []; _nb.mayAdd = !!(r && r.mayAddCompany); _nb.err = ''; }
  catch (e) { _nb.docs = _nb.docs || []; _nb.err = _nbT('nb_load_fail'); }
  return _nb.docs;
}
async function nbFull(id){
  if (_nb.full.has(id)) return _nb.full.get(id);
  try { const r = await api('notebook/' + encodeURIComponent(id)); if (r && r.doc){ _nb.full.set(id, r.doc); return r.doc; } } catch (_) {}
  return null;
}
function nbPut(doc){
  if (!doc) return; _nb.full.delete(doc.id);
  const L = _nb.docs || (_nb.docs = []); const i = L.findIndex(x => x.id === doc.id);
  if (i >= 0) L[i] = doc; else L.unshift(doc);
}
const nbDocOf = id => (_nb.docs || []).find(d => d.id === id) || null;
/* ---- the list: tabs, filters, one table ---- */
function nbShown(){
  const q = String(_nb.q || '').trim().toLowerCase(), words = q ? q.split(/\s+/) : [];
  return (_nb.docs || []).filter(d => (_nb.tab === 'all' || (_nb.tab === 'mine' ? d.mine : !d.mine))
    && (!_nb.fKind || d.kind === _nb.fKind) && (!_nb.fStatus || d.status === _nb.fStatus) && (!_nb.fBy || d.addedBy === _nb.fBy)
    && (!words.length || words.every(w => [d.name, d.fileName, d.last && d.last.words, d.last && d.last.n, _nbT('nb_kind_' + d.kind)].join(' ').toLowerCase().includes(w))));
}
function nbChoices(kind){
  const L = _nb.docs || [];
  if (kind === 'kind') return ['law', 'policy', 'research'].filter(k => L.some(d => d.kind === k)).map(k => [k, _nbT('nb_kind_' + k)]);
  if (kind === 'status') return ['due', 'none', 'ok'].filter(k => L.some(d => d.status === k)).map(k => [k, _nbT('nb_st_' + k)]);
  return [...new Set(L.map(d => d.addedBy).filter(Boolean))].sort().map(w => [w, w]);
}
const NB_F = { kind: 'fKind', status: 'fStatus', by: 'fBy' };
function nbChipHtml(kind){
  const E = _nbE, set = _nb[NB_F[kind]], opts = nbChoices(kind);
  /* a filter choice with no rows is not listed; a chip with one choice or none is not drawn unless it is set */
  if (!set && opts.length < 2) return '';
  const label = _nbT('nb_f_' + kind), word = set ? ((opts.find(o => o[0] === set) || [set, set])[1]) : '';
  const menu = _nb.menu === kind ? `<div class="hbkn-menu" role="listbox">${opts.map(([k, w]) => `<button type="button" role="option" class="hbkn-opt${k === set ? ' is-on' : ''}" data-nb-pick-f="${kind}" data-nb-v="${E(k)}">${E(w)}</button>`).join('')}</div>` : '';
  return `<span class="hbkn-chipw"><button type="button" class="hbkn-chip${set ? ' is-set' : ''}" data-nb-f="${kind}" aria-expanded="${_nb.menu === kind}">${set ? E(label + ': ' + word) + '<span class="hbkn-x" aria-hidden="true">×</span>' : '+ ' + E(label)}</button>${menu}</span>`;
}
function nbTabsHtml(){
  const L = _nb.docs || [], n = { all: L.length, company: L.filter(d => !d.mine).length, mine: L.filter(d => d.mine).length };
  return `<div class="apn-bar nb-tabs">${['all', 'company', 'mine'].map(k => `<button type="button" class="apn-tab is-chip${_nb.tab === k ? ' is-on' : ''}${_nb.tab === k && k !== 'all' ? ' is-narrow' : ''}" data-nb-tab="${k}" aria-pressed="${_nb.tab === k}">${_nbE(_nbT('nb_tab_' + k))} <span>${n[k]}</span></button>`).join('')}</div>`;
}
/* the words Jambo last quoted from it, with their section; never a word invented */
function nbQuoteLine(d){
  if (!d.last || !d.last.words) return `<span class="nb-rq is-none">${_nbE(_nbT('nb_st_none'))}</span>`;
  return `<span class="nb-rq"><span class="nb-sec">${_nbE(d.last.n)}</span> “${_nbE(nbWordsShown(d.last.words))}”</span>`;
}
function nbRowHtml(d){
  const E = _nbE, on = _nb.pick === d.id;
  const act = d.status === 'due' && nbMayWrite(d) ? `<button type="button" class="ui-btn ui-btn-sm" data-nb-check="${E(d.id)}">${E(_nbT('nb_check'))}</button>` : '';
  return `<tr class="hbkn-row nb-row${on ? ' is-on' : ''}" data-nb-row="${E(d.id)}" tabindex="0"${on ? ' aria-selected="true"' : ''}>`
    + `<td class="hbkn-tt nb-doc"><b>${E(d.name)}</b>${nbQuoteLine(d)}</td><td>${nbKindBadge(d.kind)}</td>`
    + `<td class="nb-shelf">${E(_nbT('nb_shelf_' + (d.mine ? 'mine' : 'company')))}</td><td>${nbStatusBadge(d.status)}</td>`
    + `<td class="hbkn-n">${Number(d.quoted) || 0}</td><td class="hbkn-n nb-day">${E(nbDay(d.checkedAt))}</td><td class="nb-act">${act}</td></tr>`;
}
function nbListHtml(){
  const E = _nbE, L = nbShown(), all = (_nb.docs || []).length;
  const flt = `<div class="hbkn-flt"><label class="hbkn-fbox"><span aria-hidden="true">⌕</span><input type="search" id="nb-q" autocomplete="off" placeholder="${E(_nbT('nb_filter_ph'))}" value="${E(_nb.q)}" aria-label="${E(_nbT('nb_filter_ph'))}"></label>`
    + `${nbChipHtml('kind')}${nbChipHtml('status')}${nbChipHtml('by')}</div>`;
  if (_nb.docs == null) return `<div class="nb-wait">${typeof busyHtml === 'function' ? busyHtml(_nbT('nb_loading')) : E(_nbT('nb_loading'))}</div>`;
  if (!all) return `${nbTabsHtml()}<p class="hbkn-none nb-empty">${E(_nb.err || _nbT('nb_none_yet'))}</p>`;
  const head = ['nb_th_doc', 'nb_th_kind', 'nb_th_shelf', 'nb_th_status', 'nb_th_quoted', 'nb_th_checked', ''].map((k, i) => `<th${i === 4 || i === 5 ? ' class="hbkn-n"' : ''}>${k ? E(_nbT(k)) : ''}</th>`).join('');
  const table = L.length ? `<table class="hbkn-tbl nb-tbl"><thead><tr>${head}</tr></thead><tbody>${L.map(nbRowHtml).join('')}</tbody></table>`
    : `<p class="hbkn-none">${E(_nbT('nb_none_match', { n: all }))}</p>`;
  return nbTabsHtml() + flt + `<div class="hbkn-list scroll-thin" id="nb-list">${table}</div>`;
}
/* ---- reading: the document by its sections, the quoted ones lightly marked ---- */
function nbReadHtml(d){
  const E = _nbE, by = d.bySec || {};
  if (!Array.isArray(d.sections)) return `<div class="nb-wait">${typeof busyHtml === 'function' ? busyHtml(_nbT('nb_loading')) : E(_nbT('nb_loading'))}</div>`;
  const secs = d.sections.map((s, i) => { const q = Number(by[s.n]) || 0;
    const paras = String(s.text || '').split('\n').filter(Boolean).map(p => `<p>${E(p)}</p>`).join('');
    return `<section class="nb-s${q ? ' is-quoted' : ''}" data-nb-sec="${E(s.n)}" id="nb-s-${i}">${s.n && s.part === 0 ? `<div class="nb-sn"><span class="nb-sec">${E(s.n)}</span>${q ? `<span class="hbkn-bd is-green">${E(_nbTn('nb_quoted_n', q, { n: q }))}</span>` : ''}</div>` : ''}${paras}</section>`; }).join('');
  return `<article class="nb-paper"><div class="hbkn-eye">${nbKindBadge(d.kind)} ${E(_nbT('nb_shelf_' + (d.mine ? 'mine' : 'company')))} · ${E(_nbTn('nb_sections', d.sections.length, { n: d.sections.length }))}</div>`
    + `<h2 class="hbkn-t">${E(d.name)}</h2>${d.cut ? `<p class="nb-cut">${E(_nbT('nb_read_cut'))}</p>` : ''}${secs}</article>`;
}
/* ---- Jambo's panel: the notebook · a document chosen or open ---- */
function nbBarsHtml(d){
  const rows = Object.entries(d.bySec || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!rows.length) return '';
  const max = Math.max(...rows.map(r => Number(r[1])));
  return `<div class="nb-bars">${rows.map(([n, v]) => `<button type="button" class="nb-bar" data-nb-go-sec="${_nbE(n)}"><span>${_nbE(n)}</span><i style="--nb-w:${Math.max(6, Math.round(Number(v) / max * 100))}%"></i><b>${Number(v)}</b></button>`).join('')}</div>`;
}
function nbWhereSaid(last){
  if (!last) return '';
  const where = last.cid ? [last.cname, last.cno].filter(Boolean).join(' · ') : _nbT('nb_in_answer');
  return _nbT('nb_quoted_last', { where });
}
function nbTimelineHtml(d){
  const E = _nbE, rows = [];
  if (d.last) rows.push([_nbT('nb_tl_quoted'), nbDay(d.last.at) + ', ' + _nbT('nb_tl_in', { where: d.last.cid ? [d.last.cname, d.last.cno].filter(Boolean).join(' · ') : _nbT('nb_in_answer') })]);
  if (d.checkedAt) rows.push([_nbT('nb_tl_checked'), _nbT('nb_tl_by', { who: d.checkedBy || '—', d: nbDay(d.checkedAt) })]);
  rows.push([_nbT('nb_tl_added'), _nbT('nb_tl_by', { who: d.addedBy || '—', d: nbDay(d.addedAt) }) + (d.inForce ? ' · ' + _nbT('nb_tl_in_force', { d: nbDay(d.inForce) }) : '')]);
  return `<ol class="hbkn-tl nb-tl">${rows.map(([k, v]) => `<li><i aria-hidden="true"></i><span><b>${E(k)}</b> ${E(v)}</span></li>`).join('')}</ol>`;
}
function nbChosenPanelHtml(d, reading){
  const E = _nbE;
  const badges = `<p class="jov5-eb hbkn-peb">${nbKindBadge(d.kind)}<span class="hbkn-bd is-gray">${E(_nbT('nb_shelf_' + (d.mine ? 'mine' : 'company')))}</span>${nbStatusBadge(d.status)}</p>`;
  const quote = d.last && d.last.words ? `<blockquote class="nb-pq"><span class="nb-sec">${E(d.last.n)}</span> “${E(nbWordsShown(d.last.words))}”</blockquote><p class="nb-pqs">${E(nbWhereSaid(d.last))}</p>` : '';
  const bars = nbBarsHtml(d);
  const acts = [reading ? '' : `<button type="button" class="ui-btn ui-btn-primary" data-nb-open="${E(d.id)}">${E(_nbT('nb_open'))}</button>`,
    nbMayWrite(d) ? `<button type="button" class="ui-btn" data-nb-check="${E(d.id)}">${E(_nbT('nb_check'))}</button>` : '',
    nbMayWrite(d) ? `<button type="button" class="ui-btn" data-nb-replace="${E(d.id)}">${E(_nbT('nb_replace'))}</button>` : '',
    /* MOVE BETWEEN SHELVES: an admin's own document onto the Company shelf, a Company one onto their own */
    nbMayMove(d) ? `<button type="button" class="ui-btn" data-nb-move="${E(d.id)}">${E(_nbT(d.mine ? 'nb_move_company' : 'nb_move_mine'))}</button>` : '',
    nbMayWrite(d) ? `<button type="button" class="ui-btn" data-nb-delete="${E(d.id)}">${E(_nbT('nb_delete'))}</button>` : ''].filter(Boolean).join('');
  /* the acts come first, under the quote, so none falls below a short screen's fold; the chart and timeline follow */
  const groups = [];
  if (acts) groups.push({ html: `<div class="nb-acts">${acts}</div>` });
  if (bars) groups.push({ label: _nbT('nb_where_quote') + ' · ' + _nbTn('nb_times', d.quoted, { n: d.quoted }), html: bars });
  groups.push({ label: _nbT('nb_timeline'), html: nbTimelineHtml(d) });
  return `<div class="jl-words is-ov">${typeof jamboOverviewHtml === 'function' ? jamboOverviewHtml({ before: badges, title: d.name, sub: '', mid: quote, groups }, 'nb-ch') : ''}</div>`;
}
function nbOverviewPanelHtml(){
  const L = _nb.docs || [], c = L.filter(d => !d.mine).length, m = L.length - c, due = L.filter(d => d.status === 'due');
  const ask = q => ({ verb: q, run: () => { if (typeof jlAsk === 'function') jlAsk(q); else if (typeof caAskAnywhere === 'function') caAskAnywhere(q); } });
  const groups = due.length ? [{ label: _nbT('nb_ov_due'), rows: due.slice(0, 4).map(d => ({ mark: 'scroll', t: d.name, s: _nbT('nb_ov_due_s', { d: nbDay(d.checkedAt) }), attr: `data-nb-pick="${_nbE(d.id)}"` })) }] : [];
  return `<div class="jl-words is-ov">${typeof jamboOverviewHtml === 'function' ? jamboOverviewHtml({ eyebrow: _nbT('nav_notebook'), title: _nbT('nb_ov_t'),
    sub: L.length ? _nbTn('nb_ov_sub', L.length, { n: L.length, c, m }) : _nbT('nb_ov_empty'), groups,
    /* NOTHING TO QUOTE, NOTHING TO ASK (owner, 24 Nov 2026): an empty notebook shows no example questions, whose answer could only be
       "the notebook does not cover it"; its one press is Add a document. The questions come back with the first document. */
    asks: L.length ? [ask(_nbT('nb_ov_q1')), ask(_nbT('nb_ov_q2'))] : [],
    act: L.length || _nb.docs == null || _nb.err ? null : { label: _nbT('nb_add'), run: () => nbAddOpen() } }, 'nb') : ''}</div>`;
}
function nbPanelPaint(){
  if (typeof insPaintPanel !== 'function') return;
  const id = _nb.open || _nb.pick, d0 = id ? nbDocOf(id) : null, d = d0 ? Object.assign({}, d0, _nb.full.get(id) || {}, d0) : null;
  if (!d) insPaintPanel({ seat: NB_SEAT, jlWord: _nbT('nav_notebook'), item: { id: 'notebook' }, head: false, tabCount: 0, body: nbOverviewPanelHtml() });
  else insPaintPanel({ seat: NB_SEAT, jlWord: d.name, item: { id: 'nb:' + d.id }, head: false, tabCount: 0, jlTab2: { label: d.name, run: () => {} }, body: nbChosenPanelHtml(d, !!_nb.open) });
  const hp = document.getElementById('ins-panel'); if (!hp) return;
  const t2 = hp.querySelector('[data-jl-tab2]'), home = hp.querySelector('[data-jl-home]');
  if (t2 && home){ t2.classList.add('on'); home.classList.remove('on'); } else if (home) home.classList.add('on');
  /* THE PANEL'S OVERVIEW LETS GO (every list page's rule): the chosen row goes; while reading, back to the list */
  hp._jlBack = () => { if (_nb.open){ _nb.pick = _nb.open; _nb.open = null; renderNotebook(); return true; } if (_nb.pick){ _nb.pick = null; renderNotebook(); return true; } return false; };
}
/* ---- the page ---- */
function renderNotebook(){
  const host = document.getElementById('content'); if (!host) return;
  if (typeof keepScrollIn === 'function' && !renderNotebook._in){ renderNotebook._in = true;
    const same = renderNotebook._drawn === (_nb.open || null);
    try { return keepScrollIn(host, () => renderNotebook(), same ? null : '#nb-read, #nb-read *'); } finally { renderNotebook._in = false; } }
  renderNotebook._drawn = _nb.open || null;
  /* ARRIVING ON THE PAGE READS THE LIST AGAIN: the copy loaded at the start (for the bell) may be older than a
     document added since; a redraw while on the page reads nothing */
  const arriving = !document.getElementById('nb-page');
  if ((_nb.docs == null || arriving) && !_nb.busy){ _nb.busy = true; nbLoad(_nb.docs != null).then(() => { _nb.busy = false; nbAlertsRepaint(); if (typeof state !== 'undefined' && state.view === 'notebook') renderNotebook(); }); }
  const wide = typeof window.insFits === 'function' && insFits();
  const d = _nb.open ? nbDocOf(_nb.open) : null;
  if (_nb.open && !d && _nb.docs != null) _nb.open = null;
  const reading = !!(_nb.open && d);
  const full = reading ? _nb.full.get(d.id) : null;
  if (reading && !full) nbFull(d.id).then(x => { if (x && _nb.open === d.id && state.view === 'notebook') renderNotebook(); });
  const E = _nbE;
  const add = _nb.docs != null && !_nb.err ? `<button type="button" class="ui-btn ui-btn-primary" data-nb-add id="nb-add">${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') + ' ' : ''}${E(_nbT('nb_add'))}</button>` : '';
  const head = reading
    ? `<div class="cun-head hbkn-crumb"><button type="button" class="ctf-back" data-nb-back>‹ ${E(_nbT('nav_notebook'))}</button><span class="hbkn-cpart">· ${E(d.name)}</span><span class="ctf-sp"></span></div>`
    : `<div class="cun-head"><h2 class="ctf-h">${E(_nbT('nav_notebook'))}</h2><span class="ctf-hf">${E(_nbT('nb_sub'))}</span><span class="ctf-sp"></span>${add}</div>`;
  const body = reading ? `<div class="hbkn-body nb-read scroll-thin" id="nb-read">${nbReadHtml(full || d)}</div>` : nbListHtml();
  host.innerHTML = `<div class="view-enter sap-page ap-page is-ins apn-page nb-page${reading ? ' is-reading' : ' is-book'}" id="nb-page" data-ins-page="${NB_SEAT}" data-ins="${wide ? 1 : 0}">
    <div class="ap-body is-ins"><section class="ap-card apn-card hbkn-card nb-card" aria-label="${E(_nbT('nav_notebook'))}">${head}${body}</section>
    ${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${E(_nbT('nb_panel_label'))}"></aside>` : ''}</div></div>`;
  if (wide) nbPanelPaint();
  nbWire();
  if (typeof setActiveNav === 'function') setActiveNav('notebook');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* A ROW CHOOSES; PRESSED AGAIN IT OPENS (the list pages' rule) */
function nbRowPress(id){
  if (!nbDocOf(id)) return;
  if (_nb.pick === id){ nbOpen(id); return; }
  _nb.pick = id;
  document.querySelectorAll('#nb-page [data-nb-row]').forEach(r => { const on = r.getAttribute('data-nb-row') === id; r.classList.toggle('is-on', on); if (on) r.setAttribute('aria-selected', 'true'); else r.removeAttribute('aria-selected'); });
  nbPanelPaint();
}
/* THE ONE DOOR ONTO A DOCUMENT: the row's second press, Open, a door from elsewhere */
function nbOpen(id, sec){
  _nb.pick = id; _nb.open = id; _nb.goSec = sec || null;
  if (typeof state !== 'undefined' && state.view === 'notebook') renderNotebook(); else if (typeof setView === 'function') setView('notebook');
  nbFull(id).then(x => { if (!x) return; if (state.view === 'notebook') renderNotebook(); if (_nb.goSec) nbGoSec(_nb.goSec); });
}
function nbGoSec(n){
  const el = document.querySelector(`#nb-read [data-nb-sec="${CSS.escape(String(n))}"]`); _nb.goSec = null;
  if (!el) return false;
  if (typeof landOn === 'function') landOn(el, { block: 'start' }); else el.scrollIntoView({ block: 'start' });
  return true;
}
/* MARK CHECKED, WITH UNDO: a person says it is still current; the check before it comes back on Undo */
async function nbCheck(id){
  const d = nbDocOf(id); if (!d || !nbMayWrite(d)) return;
  let r; try { r = await api('notebook/' + encodeURIComponent(id) + '/checked', 'POST', {}); } catch (e) { toast((e && e.message) || _nbT('nb_load_fail'), 'err'); return; }
  nbPut(r.doc); renderNotebook();
  const was = r.was;
  toast(_nbT('nb_checked_ok', { name: d.name }), 'ok', { action: { label: _nbT('act_undo'), onClick: async () => {
    try { const u = await api('notebook/' + encodeURIComponent(id) + '/unchecked', 'POST', { was }); nbPut(u.doc); if (state.view === 'notebook') renderNotebook(); toast(_nbT('nb_checked_undone'), 'ok'); }
    catch (e) { toast((e && e.message) || _nbT('nb_load_fail'), 'err'); } } } });
}
/* DELETE, WITH UNDO (owner, 24 Nov 2026): it leaves the list and Jambo's reach at once; Undo brings it back */
async function nbDelete(id){
  const d = nbDocOf(id); if (!d || !nbMayWrite(d)) return;
  try { await api('notebook/' + encodeURIComponent(id), 'DELETE'); } catch (e) { toast((e && e.message) || _nbT('nb_load_fail'), 'err'); return; }
  _nb.docs = (_nb.docs || []).filter(x => x.id !== id); _nb.full.delete(id);
  if (_nb.pick === id) _nb.pick = null; if (_nb.open === id) _nb.open = null;
  renderNotebook(); nbAlertsRepaint();
  toast(_nbT('nb_deleted', { name: d.name }), 'ok', { action: { label: _nbT('act_undo'), onClick: async () => {
    try { const r = await api('notebook/' + encodeURIComponent(id) + '/restore', 'POST', {}); nbPut(r.doc); _nb.pick = id;
      if (state.view === 'notebook') renderNotebook(); nbAlertsRepaint(); toast(_nbT('nb_restored', { name: d.name }), 'ok'); }
    catch (e) { toast((e && e.message) || _nbT('nb_load_fail'), 'err'); } } } });
}
/* MOVE BETWEEN SHELVES, WITH UNDO: pressed again from the toast, it goes back */
async function nbMove(id, undo){
  const d = nbDocOf(id); if (!d || !nbMayMove(d)) return;
  const to = d.mine ? 'company' : 'mine';
  let r; try { r = await api('notebook/' + encodeURIComponent(id) + '/shelf', 'POST', { shelf: to }); } catch (e) { toast((e && e.message) || _nbT('nb_load_fail'), 'err'); return; }
  nbPut(r.doc); if (_nb.tab !== 'all') _nb.tab = 'all';
  if (state.view === 'notebook') renderNotebook(); nbAlertsRepaint();
  const say = _nbT(to === 'company' ? 'nb_moved_company' : 'nb_moved_mine', { name: d.name });
  if (undo) toast(say, 'ok'); else toast(say, 'ok', { action: { label: _nbT('act_undo'), onClick: () => nbMove(id, true) } });
}
/* THE BELL KNOWS WHAT IS DUE A CHECK (owner, 24 Nov 2026): the documents this reader may mark, past twelve months */
function nbDueDocs(){ return (_nb.docs || []).filter(d => d.status === 'due' && nbMayWrite(d)); }
function nbAlertsRepaint(){ try { if (typeof updateSidebarCounts === 'function'){ if (typeof navCountsClear === 'function') navCountsClear(); updateSidebarCounts(); } } catch (_){} }
/* loaded once at the start, so the bell and the Guide's count know before the page is opened; nothing due = nothing repainted (a repaint mid-press on another page moved its place) */
function nbLoadForAlerts(){ return nbLoad().then(() => { if (nbDueDocs().length) nbAlertsRepaint(); }, () => {}); }
/* ---- ADD, AND REPLACE: HaTi's one edit pop-up; the file read by the one reader ---- */
function nbAddOpen(replaceId){
  const rep = replaceId ? nbDocOf(replaceId) : null;
  if (rep && !nbMayWrite(rep)) return;
  const E = _nbE;
  const kinds = ['law', 'policy', 'research'].map(k => ({ v: k, t: _nbT('nb_kind_' + k) }));
  const shelves = (_nb.mayAdd ? ['company', 'mine'] : ['mine']).map(k => ({ v: k, t: _nbT('nb_shelf_' + k) }));
  const file = `<span class="nb-file"><input type="file" id="nb-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" hidden><button type="button" class="ui-btn ui-btn-sm" data-nb-choose>${E(_nbT('nb_add_choose'))}</button><span class="nb-fname" id="nb-fname">${E(_nbT('nb_add_nofile'))}</span></span>`;
  const rows = [{ k: _nbT('nb_add_file'), type: 'html', valueHtml: file }];
  if (!rep){
    rows.push({ k: _nbT('nb_add_name'), id: 'nb-name', ph: _nbT('nb_add_name_ph'), max: 160 },
      { k: _nbT('nb_add_kind'), id: 'nb-kind', type: 'select', opts: kinds, value: 'law' },
      { k: _nbT('nb_add_shelf'), id: 'nb-shelf', type: 'select', opts: shelves, value: _nb.mayAdd && _nb.tab !== 'mine' ? 'company' : 'mine' },
      { k: _nbT('nb_add_inforce'), id: 'nb-inforce', type: 'date' });
  }
  const form = lgpOpen({ id: 'nb-add-form', title: rep ? _nbT('nb_replace_t', { name: rep.name }) : _nbT('nb_add_t'), sub: rep ? _nbT('nb_replace_sub') : _nbT('nb_add_sub'),
    rows, note: !rep && !_nb.mayAdd ? _nbT('nb_add_company_admin') : '', primary: { label: rep ? _nbT('nb_replace_go') : _nbT('nb_add_go'), attr: 'id="nb-go"' }, cancelAttr: 'data-lgp-close id="nb-cancel"', focus: false });
  if (!form) return;
  const inp = document.getElementById('nb-file');
  form.querySelector('[data-nb-choose]')?.addEventListener('click', () => inp && inp.click());
  inp?.addEventListener('change', () => { const f = inp.files && inp.files[0]; const s = document.getElementById('nb-fname'); if (s) s.textContent = f ? f.name : _nbT('nb_add_nofile');
    const nm = document.getElementById('nb-name'); if (f && nm && !nm.value.trim()) nm.value = (typeof fileTitleOf === 'function' ? fileTitleOf(f.name) : f.name.replace(/\.[a-z0-9]+$/i, '')); });
  form.addEventListener('submit', e => e.preventDefault());
  document.getElementById('nb-go')?.addEventListener('click', async e => { e.preventDefault(); await nbAddRun(form, rep); });
}
function nbFormSay(form, msg){
  let p = form.querySelector('.lgp-err'); if (!msg){ if (p) p.remove(); return; }
  if (!p){ p = document.createElement('p'); p.className = 'lgp-err'; p.setAttribute('role', 'alert'); form.querySelector('.lgp-bd')?.appendChild(p); }
  p.textContent = msg;
}
async function nbAddRun(form, rep){
  const go = document.getElementById('nb-go'); if (!go || go.disabled) return;
  const f = document.getElementById('nb-file')?.files?.[0];
  if (!f){ nbFormSay(form, _nbT('nb_add_need_file')); return; }
  const name = rep ? rep.name : (document.getElementById('nb-name')?.value || '').trim();
  if (!name){ nbFormSay(form, _nbT('nb_add_need_name')); return; }
  nbFormSay(form, ''); go.disabled = true; const label = go.textContent; go.textContent = _nbT('nb_add_reading');
  try {
    let text = '';
    if (/^text\//.test(f.type) || /\.(txt|md)$/i.test(f.name)) text = await f.text();
    else { const rd = (typeof uploadReadFile === 'function') ? await uploadReadFile(f, { meta: false, max: (typeof window !== 'undefined' && window.NB_TEXT_MAX) || 2000000 }) : { refused: _nbT('nb_load_fail') };
      if (rd.refused){ nbFormSay(form, rd.refused); return; } text = rd.extractedText || ''; }
    if (!text.trim()){ nbFormSay(form, _nbT('nb_add_unread')); return; }
    const NBX = (typeof window !== 'undefined' && window.NB_TEXT_MAX) || 2000000;
    const cut = text.length >= NBX;
    const body = rep ? { text, fileName: f.name, cut } : { shelf: document.getElementById('nb-shelf')?.value || 'mine', name,
      kind: document.getElementById('nb-kind')?.value || 'law', inForce: document.getElementById('nb-inforce')?.value || '', text, fileName: f.name, cut };
    const r = rep ? await api('notebook/' + encodeURIComponent(rep.id), 'PUT', body) : await api('notebook', 'POST', body);
    if (typeof closeModal === 'function') closeModal();
    nbPut(r.doc); _nb.pick = r.doc.id; if (!rep && _nb.tab !== 'all' && (_nb.tab === 'mine') !== !!r.doc.mine) _nb.tab = 'all';
    renderNotebook();
    const n = r.doc.sections;
    toast(_nbTn(rep ? 'nb_replace_done' : 'nb_add_done', n, { n }) + (r.doc.cut ? ' ' + _nbT('nb_read_cut') : ''), r.doc.cut ? 'warn' : 'ok');
  } catch (e) { nbFormSay(form, (e && e.message) || _nbT('nb_load_fail')); }
  finally { if (go.isConnected){ go.disabled = false; go.textContent = label; } }
}
/* ---- presses: one listener on the page, one on document for the panel (it lives outside the page) ---- */
function nbWire(){
  const page = document.getElementById('nb-page'); if (!page || page.dataset.nbBound) return;
  page.dataset.nbBound = '1';
  page.addEventListener('click', e => { const t = e.target && e.target.closest ? e.target : null; if (!t) return; let el;
    if (t.closest('[data-nb-add]')){ nbAddOpen(); return; }
    if (t.closest('[data-nb-back]')){ _nb.pick = _nb.open; _nb.open = null; renderNotebook(); return; }
    if ((el = t.closest('[data-nb-tab]'))){ _nb.tab = el.getAttribute('data-nb-tab'); renderNotebook(); return; }
    if ((el = t.closest('[data-nb-pick-f]'))){ const k = NB_F[el.getAttribute('data-nb-pick-f')], v = el.getAttribute('data-nb-v'); _nb[k] = _nb[k] === v ? '' : v; _nb.menu = null; renderNotebook(); return; }
    if ((el = t.closest('[data-nb-f]'))){ const kind = el.getAttribute('data-nb-f');
      if (t.closest('.hbkn-x')){ _nb[NB_F[kind]] = ''; _nb.menu = null; } else _nb.menu = _nb.menu === kind ? null : kind;
      renderNotebook(); return; }
    if ((el = t.closest('[data-nb-check]'))){ e.stopPropagation(); nbCheck(el.getAttribute('data-nb-check')); return; }
    if ((el = t.closest('[data-nb-row]'))) nbRowPress(el.getAttribute('data-nb-row')); });
  page.addEventListener('keydown', e => { const r = e.target && e.target.closest && e.target.closest('[data-nb-row]');
    if (r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); nbRowPress(r.getAttribute('data-nb-row')); }
    if (e.key === 'Escape' && _nb.menu){ _nb.menu = null; renderNotebook(); } });
  page.addEventListener('input', e => { if (!e.target || e.target.id !== 'nb-q') return; _nb.q = e.target.value;
    const at = e.target.selectionStart; renderNotebook(); const q = document.getElementById('nb-q'); if (q){ q.focus({ preventScroll: true }); try { q.setSelectionRange(at, at); } catch (_){} } });
}
if (typeof document !== 'undefined' && !document._nbWired){ document._nbWired = true;
  document.addEventListener('click', e => { if (typeof state === 'undefined' || state.view !== 'notebook') return;
    const el = e.target && e.target.closest && e.target.closest('#ins-panel [data-nb-open], #ins-panel [data-nb-check], #ins-panel [data-nb-replace], #ins-panel [data-nb-move], #ins-panel [data-nb-delete], #ins-panel [data-nb-go-sec], #ins-panel [data-nb-pick]'); if (!el) return;
    e.preventDefault();
    if (el.hasAttribute('data-nb-open')) nbOpen(el.getAttribute('data-nb-open'));
    else if (el.hasAttribute('data-nb-check')) nbCheck(el.getAttribute('data-nb-check'));
    else if (el.hasAttribute('data-nb-replace')) nbAddOpen(el.getAttribute('data-nb-replace'));
    else if (el.hasAttribute('data-nb-move')) nbMove(el.getAttribute('data-nb-move'));
    else if (el.hasAttribute('data-nb-delete')) nbDelete(el.getAttribute('data-nb-delete'));
    else if (el.hasAttribute('data-nb-pick')) nbRowPress(el.getAttribute('data-nb-pick'));
    else { const n = el.getAttribute('data-nb-go-sec'); const id = _nb.open || _nb.pick; if (_nb.open) nbGoSec(n); else if (id) nbOpen(id, n); } });
  /* a press outside an open filter menu closes it */
  document.addEventListener('pointerdown', e => { if (!_nb.menu) return; if (e.target && e.target.closest && e.target.closest('.hbkn-chipw')) return; _nb.menu = null; if (typeof state !== 'undefined' && state.view === 'notebook') renderNotebook(); }, true);
}
/* A REFRESH LANDS AT THE SAME SPOT: the tab, the filters and the document open */
function nbPlace(){ return { tab: _nb.tab, fKind: _nb.fKind, fStatus: _nb.fStatus, fBy: _nb.fBy, open: _nb.open, pick: _nb.pick }; }
function nbPlacePut(p){ if (!p) return; ['tab', 'fKind', 'fStatus', 'fBy', 'open', 'pick'].forEach(k => { if (p[k] != null) _nb[k] = p[k]; }); }
/* the count on the Guide's row and the jump window: documents due a check that this reader may mark */
function nbDueCount(){ return (_nb.docs || []).filter(d => d.status === 'due' && nbMayWrite(d)).length; }
Object.assign(window, { renderNotebook, nbLoad, nbLoadForAlerts, nbDueDocs, nbDelete, nbMove, nbOpen, nbRowPress, nbCheck, nbAddOpen, nbShown, nbListHtml, nbRowHtml, nbChosenPanelHtml, nbOverviewPanelHtml, nbPanelPaint, nbReadHtml, nbPlace, nbPlacePut, nbDueCount, nbFilters: _nb });
