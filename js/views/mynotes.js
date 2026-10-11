// HaTi — My notes: a person's private ledger.
/* ============================================================================
   MY NOTES (Young, 10 Oct 2026, the "HaTi Proposals" artifact, Part 4: "keep
   the ledger but show me what happens when i click on new note")
   ----------------------------------------------------------------------------
   A table of the person's own notes — each may name a contract (and words in
   it) and a "review by" day — with the note open in a panel on the right, the
   same shape as HaTi's other lists: a press selects, the panel shows it whole.
   + New note puts the form in that panel; Save note stays grey until the note
   has words. A review day puts the note on the person's calendar and in the
   bell on the day; Mark reviewed closes it, Snooze moves it on.

   PRIVATE: stored through js/mine.js (/api/me/items, scoped to the person);
   never on a contract, a share, the history or a colleague's screen.
   Copilot reads them only when the person asks.
   ========================================================================== */
let _mn = { sel:null, mode:'view', filter:'all', form:null, fresh:null };
const MN_WHEN = [['tomorrow',1],['week',7],['two',14],['pick',null],['none',null]];

const _mnE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const _mnToday = () => (typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10));
const _mnAdd = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const _mnDay = iso => { try{ return new Date(iso + 'T00:00:00').toLocaleDateString(langLocale(), { weekday:'short', day:'numeric', month:'short' }); }catch(_){ return iso; } };
const _mnShort = iso => { try{ return new Date(iso + 'T00:00:00').toLocaleDateString(langLocale(), { day:'numeric', month:'short' }); }catch(_){ return iso; } };

/* WHERE A NOTE STANDS: one reading for the row's pill, the panel and the
   filters. */
function myNoteState(n){
  if (!n) return { k:'later', word:'' };
  if (n.reviewedAt) return { k:'done', word:i18t('mn_reviewed_on', { d:_mnShort(String(n.reviewedAt).slice(0, 10)) }) };
  if (!n.reviewBy) return { k:'none', word:i18t('mn_no_date') };
  const t = _mnToday();
  if (n.reviewBy < t) return { k:'late', word:i18t('mn_overdue', { d:_mnShort(n.reviewBy) }) };
  if (n.reviewBy <= _mnAdd(t, 7)) return { k:'soon', word:i18t('mn_review_on', { d:_mnShort(n.reviewBy) }) };
  return { k:'later', word:i18t('mn_review_on', { d:_mnShort(n.reviewBy) }) };
}
function myNotesShown(){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const f = _mn.filter;
  const list = f === 'due' ? all.filter(n => ['late', 'soon'].includes(myNoteState(n).k))
    : f === 'done' ? all.filter(n => !!n.reviewedAt)
    : f.startsWith('c:') ? all.filter(n => String(n.contractId || '') === f.slice(2))
    : all;
  const rank = n => ({ late:0, soon:1, later:2, none:3, done:4 }[myNoteState(n).k]);
  return list.slice().sort((a, b) => rank(a) - rank(b) || String(a.reviewBy || '9').localeCompare(String(b.reviewBy || '9')) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}
const _mnContract = id => (id && typeof getContract === 'function') ? getContract(id) : null;
const _mnRef = c => c ? (c.contractNo || c.id) : '';
function _mnCtName(c){ return c ? String(c.counterparty || c.name || '') : ''; }

function myNotesBarHtml(){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const due = all.filter(n => ['late', 'soon'].includes(myNoteState(n).k)).length;
  const cts = [...new Set(all.map(n => String(n.contractId || '')).filter(Boolean))].slice(0, 6);
  const chip = (k, w) => `<button type="button" class="mn-chip${_mn.filter === k ? ' on' : ''}" data-mn-filter="${_mnE(k)}" aria-pressed="${_mn.filter === k}">${w}</button>`;
  return `<div class="mn-bar">
    <div class="mn-chips" role="group" aria-label="${_mnE(i18t('mn_filter'))}">${chip('all', _mnE(i18t('mn_all', { n:all.length })))}${chip('due', _mnE(i18t('mn_due', { n:due })))}${chip('done', _mnE(i18t('mn_done')))}${
      cts.map(id => { const c = _mnContract(id); return c ? chip('c:' + id, _mnE(_mnRef(c))) : ''; }).join('')}</div>
    <span class="g"></span>
    <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" id="mn-new"${_mn.mode === 'new' ? ' disabled' : ''}>${_mnE(i18t('mn_new'))}</button>
  </div>`;
}
function myNotesTableHtml(list){
  if (!list.length){
    const t = (typeof mineList === 'function' && mineList('note').length) ? i18t('mn_none_here') : i18t('mn_empty');
    return typeof emptyStateHtml === 'function' ? emptyStateHtml({ title:t, sub:i18t('mn_empty_sub') }) : `<p class="mn-empty">${_mnE(t)}</p>`;
  }
  return `<table class="mn-t"><thead><tr><th>${_mnE(i18t('mn_col_note'))}</th><th>${_mnE(i18t('mn_col_contract'))}</th><th>${_mnE(i18t('mn_col_review'))}</th><th>${_mnE(i18t('mn_col_written'))}</th></tr></thead><tbody>${
    list.map(n => { const st = myNoteState(n), c = _mnContract(n.contractId);
      return `<tr data-mn-row="${_mnE(n.id)}" tabindex="0" class="${String(n.id) === String(_mn.sel) && _mn.mode === 'view' ? 'is-sel' : ''}${String(n.id) === String(_mn.fresh) ? ' is-fresh' : ''}">
        <td class="t">${_mnE(n.title)}</td>
        <td>${c ? `${typeof refHtml === 'function' ? refHtml(c) : _mnE(_mnRef(c))} <span class="cp">${_mnE(_mnCtName(c))}</span>` : '<span class="cp">—</span>'}</td>
        <td><span class="mn-pill is-${st.k}">${_mnE(st.word)}</span></td>
        <td class="w">${_mnE(_mnShort(String(n.createdAt || '').slice(0, 10)))}</td></tr>`; }).join('')
  }</tbody></table>`;
}
function myNoteViewHtml(n){
  if (!n) return `<p class="mn-side-empty">${_mnE(i18t('mn_pick'))}</p>`;
  const st = myNoteState(n), c = _mnContract(n.contractId);
  const open = !n.reviewedAt;
  return `<h3 class="mn-h">${_mnE(n.title)}</h3>
    <div class="mn-meta">${c ? `${typeof refHtml === 'function' ? refHtml(c) : _mnE(_mnRef(c))} ${_mnE(_mnCtName(c))}` : _mnE(i18t('mn_no_contract'))}</div>
    ${n.quote ? `<q class="mn-q">${_mnE(n.quote)}</q>` : ''}
    <p class="mn-body">${_mnE(n.body)}</p>
    <div class="mn-meta"><span class="mn-pill is-${st.k}">${_mnE(st.word)}</span><span>${_mnE(i18t('mn_written', { d:_mnShort(String(n.createdAt || '').slice(0, 10)) }))}</span></div>
    <div class="mn-acts">${open
      ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-mn-act="reviewed">${_mnE(i18t('mn_mark_reviewed'))}</button><button type="button" class="ui-btn ui-btn-sm" data-mn-act="snooze">${_mnE(i18t('mn_snooze'))}</button>`
      : `<button type="button" class="ui-btn ui-btn-sm mn-undo" data-mn-act="unreview">${_mnE(i18t('mn_undo'))}</button>`}
      ${c ? `<button type="button" class="ui-btn ui-btn-sm" data-mn-act="open">${_mnE(i18t('mn_open', { ref:_mnRef(c) }))}</button>` : ''}
      <span class="g"></span><button type="button" class="ui-btn ui-btn-sm mn-del" data-mn-act="delete">${_mnE(i18t('mn_delete'))}</button></div>
    <p class="mn-priv">${_mnE(i18t('mn_private'))}</p>`;
}
function _mnWhenDate(f){
  const w = MN_WHEN.find(x => x[0] === f.when);
  if (!w) return '';
  if (w[0] === 'pick') return f.date || '';
  return w[1] == null ? '' : _mnAdd(_mnToday(), w[1]);
}
function myNoteFormHtml(f){
  const ok = !!String(f.body || '').trim();
  const dd = _mnWhenDate(f), c = _mnContract(f.contractId);
  const q = String(f.query || '').toLowerCase();
  const hits = (state.contracts || []).filter(x => !x.archived && (!q || [x.contractNo, x.id, x.name, x.counterparty].join(' ').toLowerCase().includes(q))).slice(0, 8);
  const whenWord = k => i18t('mn_when_' + k);
  return `<div class="mn-form">
    <h3 class="mn-h">${_mnE(i18t('mn_new_title'))}</h3>
    <label for="mn-body">${_mnE(i18t('mn_f_note'))}<textarea id="mn-body" rows="5" maxlength="4000" placeholder="${_mnE(i18t('mn_f_note_ph'))}">${_mnE(f.body || '')}</textarea></label>
    <label for="mn-title">${_mnE(i18t('mn_f_title'))} <span class="mn-hint">${_mnE(i18t('mn_f_title_hint'))}</span><input id="mn-title" type="text" maxlength="120" value="${_mnE(f.title || '')}"></label>
    <div class="mn-field"><label for="mn-ct">${_mnE(i18t('mn_f_contract'))} <span class="mn-hint">${_mnE(i18t('mn_optional'))}</span></label>
      ${c ? `<div class="mn-chosen">${typeof refHtml === 'function' ? refHtml(c) : _mnE(_mnRef(c))}<span>${_mnE(c.name || '')} · ${_mnE(_mnCtName(c))}</span><button type="button" data-mn-act="ct-clear" aria-label="${_mnE(i18t('mn_ct_clear'))}">×</button></div>`
        : `<div class="mn-picker"><input id="mn-ct" type="text" autocomplete="off" value="${_mnE(f.query || '')}" placeholder="${_mnE(i18t('mn_f_contract_ph'))}">${
          f.listOpen ? `<div class="mn-list" role="listbox">${hits.length ? hits.map(x => `<button type="button" role="option" data-mn-ct="${_mnE(x.id)}"><span class="r">${_mnE(_mnRef(x))}</span><span>${_mnE(x.name || '')}</span><span></span><span class="mn-hint">${_mnE(_mnCtName(x))}</span></button>`).join('')
            : `<p class="mn-hint">${_mnE(i18t('mn_ct_none'))}</p>`}</div>` : ''}</div>`}
    </div>
    ${f.quote ? `<q class="mn-q">${_mnE(f.quote)}</q>` : ''}
    <div class="mn-field"><span class="mn-lab">${_mnE(i18t('mn_f_when'))}</span>
      <div class="mn-when" role="group">${MN_WHEN.map(([k, n]) => `<button type="button" data-mn-when="${k}" aria-pressed="${f.when === k}">${_mnE(whenWord(k))}${n ? ' · ' + _mnE(_mnShort(_mnAdd(_mnToday(), n))) : ''}</button>`).join('')}</div>
      ${f.when === 'pick' ? `<input id="mn-date" type="date" min="${_mnAdd(_mnToday(), 1)}" value="${_mnE(f.date || '')}">` : ''}
      <p class="mn-hint">${_mnE(dd ? i18t('mn_when_says', { d:_mnDay(dd) }) : f.when === 'pick' ? i18t('mn_when_pick_say') : i18t('mn_when_none_say'))}</p></div>
    <div class="mn-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" id="mn-save"${ok ? '' : ` disabled title="${_mnE(i18t('mn_need_words'))}"`}>${_mnE(i18t('mn_save'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" id="mn-cancel">${_mnE(i18t('mn_cancel'))}</button>${ok ? '' : `<span class="mn-hint">${_mnE(i18t('mn_need_words'))}</span>`}</div>
    <p class="mn-priv">${_mnE(i18t('mn_private'))}</p>
  </div>`;
}
function renderMyNotes(){
  const host = document.getElementById('content'); if (!host) return;
  if (typeof mineLoaded === 'function' && !mineLoaded() && typeof mineLoad === 'function')
    mineLoad().then(() => { if (state.view === 'mynotes') renderMyNotes(); });
  const list = myNotesShown();
  if (_mn.mode === 'view' && !list.some(n => String(n.id) === String(_mn.sel))) _mn.sel = list[0] ? list[0].id : null;
  const n = _mn.sel ? (typeof mineGet === 'function' ? mineGet(_mn.sel) : null) : null;
  const keep = document.activeElement && document.activeElement.id && document.activeElement.closest && document.activeElement.closest('#mn-page') ? document.activeElement.id : '';
  const caret = keep ? document.activeElement.selectionStart : null;
  host.innerHTML = `<div class="view-enter mn-page" id="mn-page"><style>${myNotesCss()}</style>
    <div class="mn-head"><span class="ttl">${_mnE(i18t('nav_mynotes'))}</span><span class="mn-sub">${_mnE(i18t('mn_sub'))}</span></div>
    <section class="mn-card">${myNotesBarHtml()}
      <div class="mn-split"><div class="mn-wrap scroll-thin">${myNotesTableHtml(list)}</div>
        <aside class="mn-side scroll-thin" id="mn-side">${_mn.mode === 'new' ? myNoteFormHtml(_mn.form) : myNoteViewHtml(n)}</aside></div>
    </section></div>`;
  /* THE CARET GOES TO THE NOTE BOX when the form first draws (asked of the
     paint itself, not of a timer racing it); later repaints keep it where the
     reader had it. */
  if (_mn.mode === 'new' && _mn.form && _mn.form.focus){ _mn.form.focus = false; const b = document.getElementById('mn-body'); if (b) b.focus(); }
  else if (keep && document.getElementById(keep)){ const el = document.getElementById(keep); el.focus(); try{ if (caret != null) el.setSelectionRange(caret, caret); }catch(_){} }
  myNotesWire();
  if (typeof setActiveNav === 'function') setActiveNav('mynotes');
}
/* A NEW NOTE, from + New note, a contract's ⋯ menu or a highlight on the
   paper (the contract and the words already filled in). */
function myNotesNew(seed){
  const s = seed || {};
  _mn.mode = 'new';
  _mn.form = { body:'', title:'', contractId:s.contractId || '', quote:s.quote || '', clauseId:s.clauseId || '', when:'week', date:'', query:'', listOpen:false, focus:true };
  _mn.filter = 'all';
  if (state.view !== 'mynotes' && typeof setView === 'function') setView('mynotes'); else renderMyNotes();
}
function myNotesOpen(id){
  _mn.mode = 'view'; _mn.sel = id; _mn.filter = 'all'; _mn.form = null;
  if (state.view !== 'mynotes' && typeof setView === 'function') setView('mynotes'); else renderMyNotes();
}
async function myNoteSave(){
  const f = _mn.form; if (!f || !String(f.body || '').trim()) return;
  const reviewBy = _mnWhenDate(f);
  try{
    const it = await mineSave('note', { body:f.body, title:f.title, contractId:f.contractId || '', quote:f.quote || '', clauseId:f.clauseId || '', reviewBy });
    _mn.mode = 'view'; _mn.sel = it.id; _mn.fresh = it.id; _mn.form = null;
    renderMyNotes();
    if (typeof toast === 'function') toast(reviewBy ? i18t('mn_saved_on', { d:_mnDay(reviewBy) }) : i18t('mn_saved'), 'ok');
  }catch(e){ if (typeof toast === 'function') toast(String((e && (e.error || e.message)) || i18t('mn_not_saved')), 'err'); }
}
async function myNoteAct(act){
  const n = _mn.sel && typeof mineGet === 'function' ? mineGet(_mn.sel) : null; if (!n) return;
  try{
    if (act === 'reviewed'){ await mineSave('note', { ...n, reviewedAt:new Date().toISOString() }, n.id); if (typeof toast === 'function') toast(i18t('mn_marked'), 'ok'); }
    else if (act === 'unreview'){ await mineSave('note', { ...n, reviewedAt:'', reviewBy:n.reviewBy && n.reviewBy >= _mnToday() ? n.reviewBy : _mnAdd(_mnToday(), 1) }, n.id); }
    else if (act === 'snooze'){ const d = _mnAdd(n.reviewBy && n.reviewBy > _mnToday() ? n.reviewBy : _mnToday(), 7);
      await mineSave('note', { ...n, reviewBy:d }, n.id); if (typeof toast === 'function') toast(i18t('mn_snoozed', { d:_mnDay(d) }), 'ok'); }
    else if (act === 'delete'){
      const ok = typeof confirmDialog === 'function' ? await confirmDialog({ title:i18t('mn_delete_q'), message:i18t('mn_delete_msg'), confirmLabel:i18t('mn_delete'), danger:true }) : true;
      if (!ok) return;
      await mineDelete(n.id); _mn.sel = null; if (typeof toast === 'function') toast(i18t('mn_deleted'), 'ok'); }
    else if (act === 'open'){ if (n.contractId && typeof openWorkspace === 'function') openWorkspace(n.contractId); return; }
    renderMyNotes();
  }catch(e){ if (typeof toast === 'function') toast(String((e && (e.error || e.message)) || i18t('mn_not_saved')), 'err'); }
}
function myNotesWire(){
  if (document._mnWired) return;
  document._mnWired = true;
  document.addEventListener('click', e => {
    if (state.view !== 'mynotes') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#mn-page')) return;
    const hit = s => t.closest(s); let el;
    if ((el = hit('#mn-new'))){ myNotesNew(); return; }
    if ((el = hit('#mn-cancel'))){ _mn.mode = 'view'; _mn.form = null; renderMyNotes(); return; }
    if ((el = hit('#mn-save'))){ if (!el.disabled) myNoteSave(); return; }
    if ((el = hit('[data-mn-filter]'))){ _mn.filter = el.getAttribute('data-mn-filter'); if (_mn.mode === 'view') _mn.sel = null; renderMyNotes(); return; }
    if ((el = hit('[data-mn-when]'))){ _mn.form.when = el.getAttribute('data-mn-when'); renderMyNotes(); if (_mn.form.when === 'pick'){ const d = document.getElementById('mn-date'); if (d) d.focus(); } return; }
    if ((el = hit('[data-mn-ct]'))){ _mn.form.contractId = el.getAttribute('data-mn-ct'); _mn.form.listOpen = false; renderMyNotes(); return; }
    if ((el = hit('[data-mn-act="ct-clear"]'))){ _mn.form.contractId = ''; _mn.form.query = ''; _mn.form.listOpen = true; renderMyNotes(); const i = document.getElementById('mn-ct'); if (i) i.focus(); return; }
    if ((el = hit('#mn-ct'))){ if (_mn.form && !_mn.form.listOpen){ _mn.form.listOpen = true; renderMyNotes(); } return; }
    if ((el = hit('[data-mn-act]'))){ myNoteAct(el.getAttribute('data-mn-act')); return; }
    if ((el = hit('[data-mn-row]'))){
      if (_mn.mode === 'new' && _mn.form && String(_mn.form.body || '').trim()){ if (typeof toast === 'function') toast(i18t('mn_finish_first'), 'warn'); return; }
      _mn.mode = 'view'; _mn.form = null; _mn.sel = el.getAttribute('data-mn-row'); _mn.fresh = null; renderMyNotes(); return; }
    if (_mn.form && _mn.form.listOpen && !hit('.mn-picker')){ _mn.form.listOpen = false; renderMyNotes(); }
  });
  document.addEventListener('input', e => {
    if (state.view !== 'mynotes' || !_mn.form) return;
    const id = e.target && e.target.id;
    if (id === 'mn-body'){ const had = !!String(_mn.form.body || '').trim(); _mn.form.body = e.target.value; if (had !== !!_mn.form.body.trim()) renderMyNotes(); }
    else if (id === 'mn-title') _mn.form.title = e.target.value;
    else if (id === 'mn-ct'){ _mn.form.query = e.target.value; _mn.form.listOpen = true; renderMyNotes(); }
    else if (id === 'mn-date'){ _mn.form.date = e.target.value; renderMyNotes(); }
  });
  document.addEventListener('keydown', e => {
    if (state.view !== 'mynotes') return;
    if (e.key === 'Escape' && _mn.form && _mn.form.listOpen){ _mn.form.listOpen = false; renderMyNotes(); return; }
    const row = e.target && e.target.closest ? e.target.closest('[data-mn-row]') : null;
    if (row && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); row.click(); }
  });
}
/* THE RAIL'S COUNT follows the store (mineChanged → here). */
function paintMyNotesCount(){
  if (typeof updateSidebarCounts === 'function'){ try{ if (typeof navCountsClear === 'function') navCountsClear(); updateSidebarCounts(); }catch(_){} }
}
function myNotesCss(){ return `
  .mn-page{height:var(--view-h, 100%);display:flex;flex-direction:column;min-height:0}
  .mn-head{flex:none;display:flex;flex-direction:column;gap:2px;background:var(--color-surface);padding:var(--page-pad-t, 16px) var(--s-6) var(--s-3);box-shadow:inset 0 -1px var(--color-divider)}
  .mn-head .ttl{font-size:var(--t-h2, 20px);font-weight:var(--w-title)}
  .mn-sub{font-size:var(--t-meta);color:var(--color-neutral-600)}
  .mn-card{flex:1;min-height:0;margin:var(--s-4) var(--s-6) 20px;display:flex;flex-direction:column;border:1px solid var(--color-divider);border-radius:var(--radius-lg);background:var(--color-surface);overflow:hidden}
  .mn-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--color-divider)}
  .mn-bar .g{flex:1}
  .mn-chips{display:flex;flex-wrap:wrap;gap:6px}
  .mn-chip{height:var(--ctl-h-sm);padding:0 10px;border:1px solid var(--color-divider);border-radius:999px;background:var(--color-surface);color:var(--color-neutral-700,var(--color-text));font:inherit;font-size:var(--t-label);font-weight:var(--w-label);cursor:pointer}
  .mn-chip.on{background:var(--color-accent-50);border-color:var(--color-accent-100);color:var(--accent-ink)}
  .mn-split{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 380px}
  .mn-wrap{min-width:0;overflow:auto}
  .mn-side{border-left:1px solid var(--color-divider);padding:var(--s-4);overflow:auto;display:flex;flex-direction:column;gap:10px;min-width:0}
  @media (max-width:1039px){ .mn-split{grid-template-columns:minmax(0,1fr)} .mn-side{border-left:0;border-top:1px solid var(--color-divider)} .mn-page{height:auto} }
  .mn-t{width:100%;border-collapse:collapse;font-size:var(--t-meta)}
  .mn-t th{position:sticky;top:0;background:var(--color-surface);text-align:left;font-weight:400;font-size:var(--t-micro);letter-spacing:.06em;text-transform:uppercase;color:var(--cap-ink, var(--color-neutral-600));padding:8px 12px;border-bottom:1px solid var(--color-divider)}
  .mn-t td{padding:9px 12px;border-bottom:1px solid var(--color-divider);vertical-align:top}
  .mn-t tr{cursor:pointer}
  .mn-t tr:hover td{background:var(--surface-2, var(--color-neutral-50))}
  .mn-t tr.is-sel td{background:var(--color-accent-50)}
  .mn-t tr.is-fresh td{animation:mnFresh 1.6s ease-out}
  @keyframes mnFresh{from{background:var(--st-green-bg)}to{background:transparent}}
  @media (prefers-reduced-motion:reduce){ .mn-t tr.is-fresh td{animation:none} }
  .mn-t td.t{font-weight:var(--w-label)}
  .mn-t .cp,.mn-t td.w{color:var(--color-neutral-600)}
  .mn-t tr:focus-visible{outline:2px solid var(--color-accent-600);outline-offset:-2px}
  .mn-pill{display:inline-block;padding:1px 7px;border-radius:3px;font-size:var(--t-label);font-weight:var(--w-label);white-space:nowrap}
  .mn-pill.is-late{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .mn-pill.is-soon{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .mn-pill.is-later,.mn-pill.is-none{background:var(--surface-2, var(--color-neutral-100));color:var(--color-neutral-700,var(--color-text))}
  .mn-pill.is-done{background:var(--st-green-bg);color:var(--st-green-fg)}
  .mn-h{margin:0;font-size:var(--t-h3, 16px);font-weight:var(--w-strong)}
  .mn-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:var(--t-label);color:var(--color-neutral-600)}
  .mn-q{display:block;font-style:italic;font-size:var(--t-meta);border-left:2px solid var(--color-accent-600);padding-left:8px;color:var(--color-neutral-700,var(--color-text))}
  .mn-body{margin:0;font-size:var(--t-body);line-height:1.6;white-space:pre-wrap}
  .mn-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .mn-acts .g{flex:1}
  .mn-del{color:var(--st-ruby-fg)}
  .mn-undo{background:var(--st-amber-bg);border-color:var(--st-amber-line);color:var(--st-amber-fg)}
  .mn-priv,.mn-side-empty,.mn-hint{margin:0;font-size:var(--t-label);font-weight:400;color:var(--color-neutral-600)}
  .mn-form{display:flex;flex-direction:column;gap:12px}
  .mn-form label,.mn-lab{display:flex;flex-direction:column;gap:4px;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700,var(--color-text))}
  .mn-form label .mn-hint{display:inline}
  .mn-form textarea,.mn-form input[type=text],.mn-form input[type=date]{font:inherit;font-size:var(--t-body);font-weight:400;padding:7px 9px;border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);color:var(--color-text);width:100%}
  .mn-form textarea{resize:vertical;min-height:110px;line-height:1.5}
  .mn-form textarea:focus,.mn-form input:focus{outline:none;border-color:var(--color-accent-600);box-shadow:0 0 0 1px var(--color-accent-600)}
  .mn-field{display:flex;flex-direction:column;gap:4px}
  .mn-picker{position:relative}
  .mn-list{position:absolute;left:0;right:0;top:100%;margin-top:2px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);box-shadow:0 10px 24px rgba(0,0,0,.14);z-index:5;max-height:240px;overflow:auto}
  .mn-list button{display:grid;grid-template-columns:auto minmax(0,1fr);gap:1px 8px;width:100%;text-align:left;border:0;background:none;padding:7px 9px;font:inherit;font-size:var(--t-meta);color:var(--color-text);cursor:pointer}
  .mn-list button:hover,.mn-list button:focus-visible{background:var(--color-accent-50);outline:none}
  .mn-list .r{font-family:var(--font-ref, var(--font-code));font-size:var(--t-label)}
  .mn-chosen{display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--color-accent-100);background:var(--color-accent-50);border-radius:var(--radius);font-size:var(--t-meta)}
  .mn-chosen button{margin-left:auto;border:0;background:none;color:var(--color-neutral-600);cursor:pointer;font:inherit;font-size:16px}
  .mn-when{display:flex;flex-wrap:wrap;gap:6px}
  .mn-when button{height:var(--ctl-h-sm);padding:0 10px;border:1px solid var(--color-divider);border-radius:999px;background:var(--color-surface);color:var(--color-neutral-700,var(--color-text));font:inherit;font-size:var(--t-label);font-weight:var(--w-label);cursor:pointer}
  .mn-when button[aria-pressed="true"]{background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff}
  .mn-chip:focus-visible,.mn-when button:focus-visible{outline:2px solid var(--color-accent-600);outline-offset:2px}
`; }

Object.assign(window, { renderMyNotes, myNotesNew, myNotesOpen, myNoteState, myNotesShown, paintMyNotesCount });
