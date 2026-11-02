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
let _mn = { sel:null, mode:'view', filter:'all', ct:'', q:'', form:null, fresh:null };
const MN_WHEN = [['tomorrow',1],['week',7],['two',14],['pick',null],['none',null]];
/* A REFRESH LANDS AT THE SAME SPOT (the owner's rule; PLACE_PARTS.mynotes):
   the tab, the Note and Contract boxes and the chosen note. A half-written
   note is not a place: it comes back through its own draft, as before. */
function mnPlace(){ return { filter:_mn.filter, ct:_mn.ct, q:_mn.q, sel:_mn.mode === 'view' ? _mn.sel : null }; }
function mnPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _mn.filter = MN_TABS.some(t => t[0] === p.filter) ? p.filter : 'all';
  _mn.ct = p.ct ? String(p.ct) : ''; _mn.q = p.q ? String(p.q) : '';
  /* the chosen note waits for the list: it is chosen on the first paint
     that has notes, and only if it is still among them */
  _mnBack = p.sel ? String(p.sel) : null;
}
let _mnBack = null;

const _mnE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const _mnToday = () => (typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10));
const _mnAdd = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* "Tue 20 Oct" — the weekday, then the day, no comma (round 20 as drawn) */
const _mnDay = iso => { try{ const d = new Date(iso + 'T00:00:00'); return `${d.toLocaleDateString(langLocale(), { weekday:'short' })} ${d.toLocaleDateString(langLocale(), { day:'numeric', month:'short' })}`; }catch(_){ return iso; } };
const _mnShort = iso => { try{ return new Date(iso + 'T00:00:00').toLocaleDateString(langLocale(), { day:'numeric', month:'short' }); }catch(_){ return iso; } };

/* WHERE A NOTE STANDS: one reading for the row's pill, the panel, the tabs
   and Jambo's words (round 20 as drawn: "Review today", "Review Tue 20 Oct",
   "No review day", "Reviewed 14 Oct"). DUE is the bell's own reading
   (mineNotesDue: a review day on or before today, not yet reviewed) — a day
   past is "late" inside it; LATER is a day still ahead. */
function myNoteState(n){
  if (!n) return { k:'later', word:'' };
  if (n.reviewedAt) return { k:'done', word:i18t('mn_reviewed_on', { d:_mnShort(String(n.reviewedAt).slice(0, 10)) }) };
  if (!n.reviewBy) return { k:'none', word:i18t('mn_no_day') };
  const t = _mnToday();
  if (n.reviewBy < t) return { k:'late', word:i18t('mn_overdue', { d:_mnShort(n.reviewBy) }) };
  if (n.reviewBy === t) return { k:'today', word:i18t('mn_pill_today') };
  return { k:'later', word:i18t('mn_review_on', { d:_mnDay(n.reviewBy) }) };
}
/* THE TABS (round 20 as drawn): All · Due today · Later · Reviewed, each
   with the count of the list it opens */
const MN_TABS = [['all','mn_tab_all'],['today','mn_tab_today'],['later','mn_tab_later'],['done','mn_tab_done']];
const mnInTab = (n, k) => { const st = myNoteState(n).k;
  return k === 'today' ? (st === 'today' || st === 'late') : k === 'later' ? st === 'later' : k === 'done' ? st === 'done' : true; };
/* the find box's words: a note's title and words, the passage it holds, and
   the contract it names */
function mnHit(n, q){
  if (!q) return true;
  const c = _mnContract(n.contractId);
  return [n.title, n.body, n.quote, c && _mnRef(c), c && c.name, c && c.counterparty].some(x => String(x || '').toLowerCase().includes(q));
}
/* the Contract filter's cut: '' any, '-' no contract, else that contract */
const mnCtPass = (n, ct) => !ct || (ct === '-' ? !n.contractId : String(n.contractId || '') === String(ct));
const mnWords = () => String(_mn.q || '').trim().toLowerCase();
const mnTabNow = () => (MN_TABS.some(t => t[0] === _mn.filter) ? _mn.filter : 'all');
/* THE NOTES THE BOX AND THE CONTRACT CHIP LEAVE — ONE READING for every
   tab's number and the list under it: the number on a tab is the list it
   opens (lane A3's second pass) */
function mnBoxed(){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const q = mnWords();
  return all.filter(n => mnCtPass(n, _mn.ct) && mnHit(n, q));
}
function myNotesShown(){
  const f = mnTabNow();
  const list = mnBoxed().filter(n => mnInTab(n, f));
  /* DUE FIRST, THEN NEWEST (the list's own head says so) */
  const rank = n => ({ late:0, today:1, later:2, none:3, done:4 }[myNoteState(n).k]);
  return list.slice().sort((a, b) => rank(a) - rank(b) || (myNoteState(a).k === 'later' ? String(a.reviewBy || '9').localeCompare(String(b.reviewBy || '9')) : 0) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}
const _mnContract = id => (id && typeof getContract === 'function') ? getContract(id) : null;
const _mnRef = c => c ? (c.contractNo || c.id) : '';
function _mnCtName(c){ return c ? String(c.counterparty || c.name || '') : ''; }
const _mnLock = () => (typeof icon === 'function') ? icon('lock', 'mn-lock') : '';

/* THE HEAD, THE LEGORA WAY (the owner's pick, 21 Oct 2026, Part 8: "every
   list page the Legora way"; js/views/listhead.js). ONE white card: the title
   row as round 20 drew it ("My notes 5 · 🔒 private to you · Jambo reads them
   only when you ask", + New note at its end), then the one box to search or
   ask in, the tabs All · Due today · Later · Reviewed (a tab with no notes is
   left out unless it is lit; All always stands), then the chip row: the
   Contract filter only once it is ADDED through "+ Filter", and Columns at
   its end. The page keeps every reading and every kept value (_mn, mnPlace);
   the head counts nothing and stores nothing. THE NOTES STAY PRIVATE: the
   box narrows the list in this browser, and a question typed in it goes to
   the panel's own Jambo door (jlAsk) exactly as if typed there — no note is
   handed to him. REVERSES round 20's band (the tabs and the labelled boxes
   "Note" and "Contract" on one row) and its list card's own head. */
const MN_SEAT = 'mynotes';
/* the Contract filter, its choices read off the notes the words and the tab
   leave (every OTHER cut held), so no choice gives no rows; a choice that
   would keep every row narrows nothing and is not offered either */
function mnCtFilter(){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const q = mnWords(), tab = mnTabNow();
  const base = all.filter(n => mnHit(n, q) && mnInTab(n, tab));
  const count = v => base.filter(n => mnCtPass(n, v)).length;
  const cts = [...new Set(all.map(n => String(n.contractId || '')).filter(Boolean))].map(id => _mnContract(id)).filter(Boolean);
  const opts = [...cts.map(c => [String(c.id), `${_mnRef(c)} · ${_mnCtName(c)}`, count(String(c.id))]),
    ...(all.some(n => !n.contractId) ? [['-', i18t('mn_no_contract'), count('-')]] : [])]
    .filter(o => o[2] < base.length || String(o[0]) === String(_mn.ct || ''));
  return { k:'ct', label:i18t('mn_box_contract'), cur:_mn.ct || '', def:'', opts };
}
/* the columns a reader may hide or move (Columns); the note itself always leads */
const mnColDefs = () => [
  { k:'contract', label:i18t('mn_col_contract'), w:'32%' },
  { k:'review', label:i18t('mn_col_review2'), w:'184px' },
  { k:'written', label:i18t('mn_col_written'), w:'84px' },
];
const mnColKeys = () => { const keys = mnColDefs().map(c => c.k); return typeof lcShown === 'function' ? lcShown(MN_SEAT, keys) : keys; };
const mnKeep = () => { if (typeof placeSave === 'function'){ try{ placeSave(); }catch(_){ /* the place is a convenience */ } } };
/* the page says, at its own render, what the head draws and how each press
   ends in the page's own writer, repaint and place */
function mnHeadReg(){
  if (window.LC_PAGES) window.LC_PAGES[MN_SEAT] = { cols:() => mnColDefs().map(c => ({ k:c.k, label:c.label })), repaint:() => renderMyNotes() };
  if (typeof lhRegister !== 'function') return null;
  return lhRegister(MN_SEAT, {
    noun:'notes',
    total:() => (typeof mineList === 'function' ? mineList('note').length : 0),
    q:() => _mn.q || '',
    setQuery:w => { _mn.q = String(w == null ? '' : w); mnRowsPaint(); },
    boxId:'mn-q', boxAttrs:{ 'data-mn-q':true },
    tabAttr:'data-mn-tab', tabsLabel:i18t('mn_filter'), tabNow:mnTabNow,
    /* the list card's head said the order ("due first, then newest"): each tab says it on hover */
    tabs:() => { const boxed = mnBoxed();
      return MN_TABS.map(([k, key]) => ({ k, label:i18t(key), n:boxed.filter(n => mnInTab(n, k)).length, keep:k === 'all', title:i18t('mn_order_title') })); },
    tab:k => { _mn.filter = MN_TABS.some(t => t[0] === k) ? k : 'all'; renderMyNotes(); mnKeep(); },
    filters:() => [mnCtFilter()],
    apply:p => { if (p && Object.prototype.hasOwnProperty.call(p, 'ct')) _mn.ct = String(p.ct == null ? '' : p.ct); renderMyNotes(); mnKeep(); },
  });
}
function myNotesBandHtml(){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const top = `<div class="mn-head2 ph-top"><div class="mn-hl"><h1 class="mn-t1">${_mnE(i18t('nav_mynotes'))}</h1><span class="mn-hn">${all.length}</span><span class="mn-hs">${_mnLock()}${_mnE(i18t('mn_head_sub'))}</span></div>
      <button type="button" class="ui-btn ui-btn-primary" id="mn-new">${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : ''}${_mnE(i18t('mn_new_btn'))}</button></div>`;
  return typeof lhHtml === 'function' ? lhHtml(MN_SEAT, { frame:'card', cls:'mn-band', top }) : `<div class="sap-band mn-band ph-card">${top}</div>`;
}
/* the review pill: today amber, a day ahead quiet, none grey, done green, late red */
const mnPillHtml = st => `<span class="mn-pill is-${st.k}">${_mnE(st.word)}</span>`;
function myNotesTableHtml(list){
  if (!list.length){
    const t = (typeof mineList === 'function' && mineList('note').length) ? i18t('mn_none_here') : i18t('mn_empty');
    return typeof emptyStateHtml === 'function' ? emptyStateHtml({ title:t, sub:i18t('mn_empty_sub') }) : `<p class="mn-empty">${_mnE(t)}</p>`;
  }
  const byK = Object.fromEntries(mnColDefs().map(c => [c.k, c]));
  /* THE LIST'S COLUMNS (owner, 28 Oct 2026, listCols): the note and its contract always stand; where the room is
     short Review steps aside first, then the day written; a reader's own widths are kept */
  const MN_RANK = { review:1, written:2 }, px = w => Number(String(w).replace('px', '')) || 0;
  const FIT = typeof listCols === 'function'
    ? listCols(MN_SEAT, [{ k:'name' }, ...mnColKeys().filter(k => byK[k]).map(k => ({ k, w: k === 'contract' ? 300 : px(byK[k].w), rank: MN_RANK[k] }))], () => renderMyNotes())
    : { cols:[{ k:'name' }, ...mnColKeys().filter(k => byK[k]).map(k => ({ k, w: px(byK[k].w) || 300 }))] };
  const keys = FIT.cols.slice(1).map(c => c.k), fitW = Object.fromEntries(FIT.cols.map(c => [c.k, c]));
  const tag = c => typeof listColTag === 'function' ? listColTag(c) : `<col${c.w ? ` style="width:${c.w}px"` : ''}>`;
  const grip = k => typeof listGripHtml === 'function' ? listGripHtml(MN_SEAT, k) : '';
  const cell = (k, n, st, c) => k === 'contract' ? `<td class="c">${c ? `${typeof refHtml === 'function' ? refHtml(c) : _mnE(_mnRef(c))} <span class="cp">${_mnE(_mnCtName(c))}</span>` : '<span class="cp">—</span>'}</td>`
    : k === 'review' ? `<td>${mnPillHtml(st)}</td>`
    : `<td class="w">${_mnE(_mnShort(String(n.createdAt || '').slice(0, 10)))}</td>`;
  return `<table class="ins-lt mn-t" data-list-seat="${_mnE(MN_SEAT)}"><colgroup>${tag(Object.assign({}, FIT.cols[0], { name:true }))}${keys.map(k => tag(fitW[k])).join('')}</colgroup><thead><tr><th>${_mnE(i18t('mn_col_note'))}${grip('name')}</th>${keys.map(k => `<th data-mn-col="${k}">${_mnE(byK[k].label)}${grip(k)}</th>`).join('')}</tr></thead><tbody>${
    list.map(n => { const st = myNoteState(n), c = _mnContract(n.contractId);
      return `<tr data-mn-row="${_mnE(n.id)}" data-ins-row="${_mnE(n.id)}" tabindex="0" class="${String(n.id) === String(_mn.sel) && _mn.mode === 'view' ? 'is-sel' : ''}${String(n.id) === String(_mn.fresh) ? ' is-fresh' : ''}"${String(n.id) === String(_mn.sel) && _mn.mode === 'view' ? ' aria-current="true"' : ''}>
        <td class="t"><span title="${_mnE(n.title)}">${_mnE(n.title)}</span></td>
        ${keys.map(k => cell(k, n, st, c)).join('')}</tr>`; }).join('')
  }</tbody></table>`;
}
/* the foot: "1–5 of 5" — every note behind the tab, the box and the chip is
   drawn, so nothing more is offered; no foot under an empty list (its own
   words say it) */
const mnFootHtml = list => (list.length && typeof lhFootHtml === 'function') ? lhFootHtml(MN_SEAT, list.length, list.length, 0, { cls:'ins-foot' }) : '';
/* THE NOTE, AS DRAWN (round 20, scene "My notes"): "🔒 My note · written 15
   Oct", its title, the review pill and the contract's reference, Mark
   reviewed · Snooze a week · Open MK-…, its words, Contract and Review as
   rows ("Today, Mon 19 Oct · in your bell"), the private line, Delete note.
   ONE BUILDER for Jambo's panel (a wide window) and the card's own side (a
   narrow one). */
function myNoteParts(n){
  const st = myNoteState(n), c = _mnContract(n.contractId);
  const open = !n.reviewedAt;
  const acts = open
    ? [{ k:'reviewed', kind:'accent', label:i18t('mn_mark_reviewed'), attrs:'data-mn-act="reviewed"' },
       { k:'snooze', label:i18t('mn_snooze'), attrs:'data-mn-act="snooze"' }]
    : [{ k:'unreview', label:i18t('mn_review_again'), attrs:'data-mn-act="unreview" data-mn-undo' }];
  if (c) acts.push({ k:'open', label:i18t('mn_open', { ref:_mnRef(c) }), attrs:'data-mn-act="open"' });
  const day = n.reviewBy ? `${_mnDay(n.reviewBy)}` : '';
  const review = st.k === 'done' ? st.word
    : st.k === 'none' ? i18t('mn_rv_none')
    : st.k === 'today' ? i18t('mn_rv_today', { d:day })
    : st.k === 'late' ? i18t('mn_rv_late', { d:day })
    : i18t('mn_rv_on', { d:day });
  const ctLine = c ? [_mnRef(c), c.name || '', c.counterparty || ''].filter(Boolean).join(' · ') : '';
  const pills = mnPillHtml(st) + (c ? `<span class="mn-ref-chip">${_mnE(_mnRef(c))}</span>` : '');
  const rows = [{ k:'contract', label:i18t('mn_row_contract'), v:c ? _mnE(ctLine) : '' }, { k:'review', label:i18t('mn_row_review'), v:_mnE(review), tone:st.k === 'late' ? 'ruby' : '' }];
  const body = `<div class="mn-note">
      ${n.quote ? `<q class="mn-q">${_mnE(n.quote)}</q>` : ''}
      <p class="mn-body">${_mnE(n.body)}</p></div>
    ${typeof insRowsHtml === 'function' ? insRowsHtml(rows, 'mn-rows') : ''}
    <div class="mn-foot2"><p class="mn-priv">${_mnLock()}<span>${_mnE(i18t('mn_private_all'))}</span></p>
      <button type="button" class="ui-btn ui-btn-sm mn-del" data-mn-act="delete">${_mnE(i18t('mn_delete_note'))}</button></div>`;
  return { head:{ eyebrow:`<span class="mn-eb">${_mnLock()}${_mnE(i18t('mn_eb', { d:_mnShort(String(n.createdAt || '').slice(0, 10)) }))}</span>`, title:n.title || '', pills, acts }, body };
}
function myNoteViewHtml(n){
  if (!n) return `<p class="mn-side-empty">${_mnE(i18t('mn_pick'))}</p>`;
  const p = myNoteParts(n);
  return (typeof insItemHeadHtml === 'function' ? insItemHeadHtml(p.head) : `<h3 class="mn-h">${_mnE(n.title)}</h3>`) + p.body;
}
/* WITH NOTHING CHOSEN, Jambo says the ledger in words counted from it (no
   call), and that he reads a note only when asked; a chip is the page's own
   door */
function mnJlSay(){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const n = all.length, due = all.filter(x => mnInTab(x, 'today')).length, later = all.filter(x => mnInTab(x, 'later')).length;
  const lines = [n ? i18tn('jl_mn_say_n', n, { n }) : i18t('jl_mn_say_none')];
  if (due) lines.push(i18tn('jl_mn_say_due', due, { n:due }));
  if (later) lines.push(i18tn('jl_mn_say_later', later, { n:later }));
  lines.push(i18t('jl_mn_say_priv'));
  const chips = [];
  if (due) chips.push({ label:i18t('jl_mn_chip_due'), run:() => { _mn.filter = 'today'; _mn.mode = 'view'; renderMyNotes(); if (typeof jlLand === 'function') jlLand('first'); } });
  chips.push({ label:i18t('jl_mn_chip_new'), run:() => myNotesNew() });
  return { lines:[_mnE(lines.join(' '))], chips, src:i18t('jl_mn_src') };
}
function _mnWhenDate(f){
  const w = MN_WHEN.find(x => x[0] === f.when);
  if (!w) return '';
  if (w[0] === 'pick') return f.date || '';
  return w[1] == null ? '' : _mnAdd(_mnToday(), w[1]);
}
function myNoteFormHtml(f, o){
  const ok = !!String(f.body || '').trim();
  const dd = _mnWhenDate(f), c = _mnContract(f.contractId);
  const q = String(f.query || '').toLowerCase();
  const hits = (state.contracts || []).filter(x => !x.archived && (!q || [x.contractNo, x.id, x.name, x.counterparty].join(' ').toLowerCase().includes(q))).slice(0, 8);
  const whenWord = k => i18t('mn_when_' + k);
  /* in Jambo's panel the head already says "New note" */
  return `<div class="mn-form${o && o.panel ? ' is-panel' : ''}">
    ${o && o.panel ? '' : `<h3 class="mn-h">${_mnE(i18t('mn_new_title'))}</h3>`}
    <label for="mn-body">${_mnE(i18t('mn_f_note'))}<textarea id="mn-body" rows="5" maxlength="4000" placeholder="${_mnE(i18t('mn_f_note_ph'))}">${_mnE(f.body || '')}</textarea></label>
    <label for="mn-title">${_mnE(i18t('mn_f_title'))} <span class="mn-hint">${_mnE(i18t('mn_f_title_hint'))}</span><input id="mn-title" type="text" maxlength="120" value="${_mnE(f.title || '')}"></label>
    <div class="mn-field"><label for="mn-ct">${_mnE(i18t('mn_f_contract'))} <span class="mn-hint">${_mnE(i18t('mn_optional'))}</span></label>
      ${c ? `<div class="mn-chosen">${typeof refHtml === 'function' ? refHtml(c) : _mnE(_mnRef(c))}<span>${_mnE(c.name || '')} · ${_mnE(_mnCtName(c))}</span><button type="button" data-mn-act="ct-clear" aria-label="${_mnE(i18t('mn_ct_clear'))}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : '×'}</button></div>`
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
/* TWO SHAPES, ONE PAGE (round 20 as drawn): where the width holds Jambo's
   panel (insFits, the lists' own rule) the note opens in HIS panel at the
   window's edge — the list inspector's (insPaintPanel), "Note" in its head,
   the ask box at its foot; narrower, in the card's own side as before. The
   head, the table and the note's builder are one in both. */
/* WHICH NOTE IS CHOSEN once the list is read: wide, the lists' own rule
   (insPick: the one chosen while it is still listed, else the first);
   narrow, the same by hand */
function mnChoose(list, wide){
  if (_mn.mode !== 'view') return;
  if (wide && typeof insPick === 'function'){ _mn.sel = insPick(MN_SEAT, list.map(n => String(n.id))); }
  else if (!list.some(n => String(n.id) === String(_mn.sel))) _mn.sel = list[0] ? list[0].id : null;
}
/* the note (or the new note's form, or Jambo's own words) beside the list:
   Jambo's panel when wide, the card's own side when narrow */
function mnSidePaint(wide){
  const n = _mn.sel ? (typeof mineGet === 'function' ? mineGet(_mn.sel) : null) : null;
  if (!wide){
    const side = document.querySelector('#mn-page .mn-split > #mn-side');
    if (side) side.innerHTML = _mn.mode === 'new' ? myNoteFormHtml(_mn.form) : myNoteViewHtml(n);
    return;
  }
  /* Jambo's panel: the note ("Note"), the new note's form ("New note"), or
     his own words with nothing chosen */
  const base = { seat:MN_SEAT, jlSay:mnJlSay, jlWord:i18t('jl_w_note') };
  if (_mn.mode === 'new' && _mn.form) insPaintPanel(Object.assign(base, { jlWord:i18t('mn_new_title'), item:{ id:'new' },
    head:{ eyebrow:`<span class="mn-eb">${_mnLock()}${_mnE(i18t('mn_eb_new'))}</span>`, title:i18t('mn_new_title') },
    body:`<div class="mn-side mn-side-panel" id="mn-side">${myNoteFormHtml(_mn.form, { panel:true })}</div>` }));
  else if (n){ const p = myNoteParts(n); insPaintPanel(Object.assign(base, { item:{ id:n.id }, head:p.head, acts:p.head.acts, body:`<div class="mn-side mn-side-panel" id="mn-side">${p.body}</div>` })); }
  else insPaintPanel(Object.assign(base, { empty:i18t('mn_pick') }));
}
/* THE BOX'S WORDS NARROW THE ROWS ONLY (the head's setQuery): the table,
   its foot and — only when the chosen note left the list — the note beside
   it. The head is never redrawn here (its numbers follow through the head's
   own lhHeadSync), so the caret stays where the reader is typing. */
function mnRowsPaint(){
  const page = document.getElementById('mn-page');
  if (state.view !== 'mynotes' || !page){ if (state.view === 'mynotes') renderMyNotes(); return; }
  const wide = page.getAttribute('data-ins') === '1';
  const was = String(_mn.sel);
  const list = myNotesShown();
  mnChoose(list, wide);
  const sc = document.getElementById('mn-scroll');
  if (sc) sc.innerHTML = myNotesTableHtml(list);
  if (wide){ const tb = page.querySelector('.mn-t tbody'); if (tb) tb.setAttribute('data-ins-on', '1'); }
  const card = page.querySelector('.mn-card2');
  if (card){
    const old = card.querySelector(`[data-lh-foot="${MN_SEAT}"]`), html = mnFootHtml(list);
    /* in place, so the live region is heard when the count moves (lhFootPut) */
    if (old){ if (!(typeof lhFootPut === 'function' && lhFootPut(old, html))){ if (html) old.outerHTML = html; else old.remove(); } }
    else if (html) card.insertAdjacentHTML('beforeend', html);
  }
  if (_mn.mode === 'view' && String(_mn.sel) !== was) mnSidePaint(wide);
}
function renderMyNotes(){
  const host = document.getElementById('content'); if (!host) return;
  if (typeof mineLoaded === 'function' && !mineLoaded() && typeof mineLoad === 'function')
    mineLoad().then(() => { if (state.view === 'mynotes') renderMyNotes(); });
  const wide = typeof window.insFits === 'function' && insFits() && typeof window.insPaintPanel === 'function';
  const list = myNotesShown();
  if (_mnBack && (typeof mineLoaded !== 'function' || mineLoaded())){
    if (list.some(n => String(n.id) === _mnBack)){ _mn.mode = 'view'; _mn.sel = _mnBack; if (typeof insSelect === 'function') insSelect(MN_SEAT, _mnBack); }
    _mnBack = null;
  }
  mnChoose(list, wide);
  const n = _mn.sel ? (typeof mineGet === 'function' ? mineGet(_mn.sel) : null) : null;
  const keep = document.activeElement && document.activeElement.id && document.activeElement.closest && document.activeElement.closest('#mn-page') ? document.activeElement.id : '';
  const caret = keep ? document.activeElement.selectionStart : null;
  /* the new look (round 6, as drawn): its own page and the note's panel */
  if (wide && _mn.mode !== 'new' && typeof window.newLookOn === 'function' && newLookOn()){ mnnRender(host, list, n); return; }
  /* the head says, at this render, what it draws (before it is drawn) */
  mnHeadReg();
  const card = `<section class="ins-card mn-card2" aria-label="${_mnE(i18t('nav_mynotes'))}">
      ${wide ? `<div class="ins-scroll mn-wrap scroll-thin" id="mn-scroll">${myNotesTableHtml(list)}</div>`
        : `<div class="mn-split"><div class="mn-wrap scroll-thin" id="mn-scroll">${myNotesTableHtml(list)}</div>
          <aside class="mn-side scroll-thin" id="mn-side">${_mn.mode === 'new' ? myNoteFormHtml(_mn.form) : myNoteViewHtml(n)}</aside></div>`}
      ${mnFootHtml(list)}
    </section>`;
  host.innerHTML = `<div class="view-enter sap-page ins-page mn-page mn-ins${wide ? '' : ' is-narrow'}" id="mn-page" data-ins-page="mynotes" data-ins="${wide ? 1 : 0}"><style>${myNotesCss()}</style>
    ${myNotesBandHtml()}
    <div class="ins-body">${card}${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${_mnE(i18t('mn_panel_label'))}"></aside>` : ''}</div></div>`;
  if (wide){
    const tb = host.querySelector('.mn-t tbody'); if (tb) tb.setAttribute('data-ins-on', '1');
    mnSidePaint(true);
  }
  if (typeof lcPlace === 'function') lcPlace(MN_SEAT);
  /* THE CARET GOES TO THE NOTE BOX when the form first draws (asked of the
     paint itself, not of a timer racing it); later repaints keep it where the
     reader had it. */
  if (_mn.mode === 'new' && _mn.form && _mn.form.focus){ _mn.form.focus = false; const b = document.getElementById('mn-body'); if (b) b.focus(); }
  else if (keep && document.getElementById(keep)){ const el = document.getElementById(keep); el.focus(); try{ if (caret != null) el.setSelectionRange(caret, caret); }catch(_){} }
  myNotesWire();
  if (typeof setActiveNav === 'function') setActiveNav('mynotes');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* ---- MY NOTES, AS DRAWN (the new look, round 6) ----
   "My notes · Private · 4 notes · 1 due", + New note; the box and the tabs All · Due · Reviewed; one table — the
   note (its words and when it was written or reviewed), its contract, when it is due (today in amber), and its one
   word (Review, Review again, Open); the foot "Never on a contract, a share or the history". The panel: the note in
   one sentence, THE NOTE in its own grey, BESIDE IT, READ FOR YOU (its contract's approval and end), Jambo's line
   and the DOORS — every press the page's own (data-mn-act, the contract's own door). */
function mnnWhen(n){
  const st = myNoteState(n);
  if (st.k === 'done') return i18t('mnn_reviewed', { d: _mnShort(String(n.reviewedAt).slice(0, 10)), again: n.reviewBy ? _mnShort(n.reviewBy) : '' });
  return i18t('mnn_written', { d: _mnShort(String(n.createdAt || '').slice(0, 10)) });
}
function mnnRowHtml(n){
  const st = myNoteState(n), c = _mnContract(n.contractId);
  const due = st.k === 'today' || st.k === 'late' ? `<span class="mnn-due">${_mnE(st.k === 'late' ? st.word : i18t('mnn_today'))}</span>` : n.reviewBy ? _mnE(_mnShort(n.reviewBy)) : '—';
  const word = st.k === 'done' ? 'mn_review_again' : st.k === 'today' || st.k === 'late' ? 'mnn_review' : 'mnn_open';
  const on = String(n.id) === String(_mn.sel);
  return `<tr data-mn-row="${_mnE(n.id)}" data-ins-row="${_mnE(n.id)}" tabindex="0" class="${on ? 'is-sel' : ''}"><td><div class="cun-name">${_mnE(n.title || n.body || '')}</div><div class="cun-sub">${_mnE(mnnWhen(n))}</div></td>
    <td class="cun-wait"><b class="mnn-ct">${c ? _mnE(c.name || '') + ' · ' + (typeof refHtml === 'function' ? refHtml(c) : _mnE(_mnRef(c))) : '—'}</b></td><td class="cun-wait">${due}</td>
    <td class="cun-go"><span class="rfp-a">${_mnE(i18t(word))}</span></td></tr>`;
}
function mnnRender(host, list, n){
  const all = typeof mineList === 'function' ? mineList('note') : [];
  const due = all.filter(x => ['today', 'late'].includes(myNoteState(x).k)).length;
  const done = all.filter(x => myNoteState(x).k === 'done').length;
  const tabs = [['all', i18t('mn_tab_all'), all.length], ['today', i18t('mnn_tab_due'), due], ['done', i18t('mn_tab_done'), done]];
  const tab = mnTabNow();
  const facts = [i18t('mnn_private'), i18tn('mnn_n', all.length, { n: all.length }), due ? i18t('mnn_n_due', { n: due }) : ''].filter(Boolean).join(' · ');
  host.innerHTML = `<div class="view-enter sap-page ap-page is-ins apn-page cun-page mnn-page" id="mn-page" data-ins-page="mynotes" data-ins="1">
    <div class="ap-body is-ins"><section class="ap-card apn-card">
      <div class="cun-head"><h2 class="ctf-h">${_mnE(i18t('nav_mynotes'))}</h2><span class="ctf-hf">${_mnE(facts)}</span><span class="ctf-sp"></span>
        <button type="button" class="ui-btn ui-btn-primary ctf-new" id="mn-new">${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : '+'}${_mnE(i18t('mnn_new'))}</button></div>
      <div class="apn-bar"><label class="apn-box">${typeof icon === 'function' ? icon('search', 'w-3.5 h-3.5') : ''}<input id="mnn-q" type="search" autocomplete="off" placeholder="${_mnE(i18t('lh_filter_ph'))}" value="${_mnE(_mn.q || '')}"></label><span class="apn-sp"></span>
        ${tabs.filter(t => t[2] || t[0] === 'all' || t[0] === tab).map(t => `<button type="button" class="apn-tab${tab === t[0] ? ' is-on' : ''}" data-mnn-tab="${t[0]}">${_mnE(t[1])} <span>${t[2]}</span></button>`).join('')}</div>
      <div class="cu-scroll"><table class="apn-table cun-table mnn-table"><colgroup><col style="width:42%"><col style="width:30%"><col style="width:12%"><col></colgroup>
        <thead><tr><th>${_mnE(i18t('mn_col_note'))}</th><th>${_mnE(i18t('mn_row_contract'))}</th><th>${_mnE(i18t('mnn_c_due'))}</th><th></th></tr></thead>
        <tbody>${list.map(mnnRowHtml).join('') || `<tr><td colspan="4" class="apn-none">${_mnE(all.length ? i18t('mn_none_here') : i18t('mn_empty'))}</td></tr>`}</tbody></table></div>
      <div class="apn-foot">${_mnE(i18t('mnn_foot'))}</div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${_mnE(i18t('mn_panel_label'))}"></aside></div></div>`;
  if (typeof insPaintPanel === 'function'){
    const base = { seat: MN_SEAT, jlSay: mnJlSay, jlWord: i18t('jl_w_note') };
    if (n) insPaintPanel(Object.assign(base, { item: { id: n.id }, head: false, body: mnnPanelHtml(n) }));
    else insPaintPanel(Object.assign(base, { empty: i18t('mn_pick') }));
  }
  myNotesWire();
  if (typeof setActiveNav === 'function') setActiveNav('mynotes');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
function mnnPanelHtml(n){
  const E = _mnE, st = myNoteState(n), c = _mnContract(n.contractId);
  const head = (st.k === 'today' || st.k === 'late' ? i18t('mnn_p_due', { what: String(n.title || n.body || '') }) : st.k === 'done' ? i18t('mnn_p_done', { what: String(n.title || n.body || '') }) : String(n.title || n.body || ''));
  const row = (l, v, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(v)}</b><i>${E(src || '')}</i></div>`;
  let rows = '';
  if (c){
    let ap = null; try { ap = (typeof window.approvalState === 'function') ? window.approvalState(c) : null; } catch (_){ ap = null; }
    if (ap && ap.required && !ap.ok) rows += row(i18t('mnn_p_approval'), [c.name || '', i18t('mnn_p_asked')].filter(Boolean).join(', '), _mnRef(c));
    if (c.expiry){ const nd = Number((c.metadata || {}).noticePeriodDays) || 0; rows += row(i18t('mnn_p_ends'), [_mnShort(String(c.expiry).slice(0, 10)), nd ? i18t('mnn_p_notice', { n: nd }) : ''].filter(Boolean).join(' · '), _mnRef(c)); }
  }
  let mine = false; try { mine = !!(c && typeof approvalDecidableNow === 'function' && approvalDecidableNow(c)); } catch (_){ mine = false; }
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${E(w)}</button><span>${E(cost)}</span></div>`;
  const doors = (c ? (mine ? door(`data-mnn-ap="${E(c.id)}"`, i18t('mnn_p_open_ap'), i18t('pd2_ch_free')) : door('data-mn-act="open"', i18t('mn_open', { ref: _mnRef(c) }), i18t('pd2_ch_free'))) : '')
    + (n.reviewedAt ? door('data-mn-act="unreview"', i18t('mn_review_again'), i18t('pd2_ch_free')) : door('data-mn-act="reviewed"', i18t('mn_mark_reviewed'), i18t('pd2_ch_free')))
    + door('data-mn-act="delete"', i18t('mn_delete_note'), '');
  return `<div class="pd2-chosen cun-panel" id="mn-side"><p class="pd2-ch-head">${E(head)}</p><div class="pd2-ch-cap">${E(i18t('mnn_p_note'))}</div><div class="mnn-note">${n.quote ? `<q>${E(n.quote)}</q>` : ''}<p>${E(n.body || '')}</p></div>
    ${rows ? `<div class="pd2-ch-cap">${E(i18t('mnn_p_beside'))}</div><div class="pd2-ch-tbl">${rows}</div>` : ''}
    <div class="pd2-turn"><i class="pd2-jface" aria-hidden="true"></i><div><b>${E(i18t('cn2_jambo'))}</b><p>${E(i18t('mnn_p_jambo'))}</p></div></div>
    <div class="pd2-ch-cap">${E(i18t('pd2_ch_doors'))}</div>${doors}</div>`;
}
if (typeof document !== 'undefined' && !document._mnnWired){ document._mnnWired = true;
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'mynotes') return;
    const ap = e.target && e.target.closest ? e.target.closest('[data-mnn-ap]') : null;
    if (ap){ e.preventDefault(); e.stopPropagation(); const id = ap.getAttribute('data-mnn-ap');
      if (typeof apShowRow === 'function') apShowRow(id); if (typeof insSelect === 'function') insSelect('approvals', id); if (typeof setView === 'function') setView('approvals'); return; }
    const t = e.target && e.target.closest ? e.target.closest('[data-mnn-tab]') : null; if (!t) return;
    e.preventDefault(); _mn.filter = t.getAttribute('data-mnn-tab'); renderMyNotes();
  });
  document.addEventListener('input', e => { if (!e.target || e.target.id !== 'mnn-q' || typeof state === 'undefined' || state.view !== 'mynotes') return;
    _mn.q = e.target.value; renderMyNotes(); const q = document.getElementById('mnn-q'); if (q){ q.focus(); const k = q.value.length; try { q.setSelectionRange(k, k); } catch (_){} } });
}
/* A NEW NOTE, from + New note, a contract's ⋯ menu or a highlight on the
   paper (the contract and the words already filled in). */
function myNotesNew(seed){
  const s = seed || {};
  _mn.mode = 'new';
  _mn.form = { body:'', title:'', contractId:s.contractId || '', quote:s.quote || '', clauseId:s.clauseId || '', when:'week', date:'', query:'', listOpen:false, focus:true };
  _mn.filter = 'all'; _mn.ct = ''; _mn.q = '';
  /* a door that writes the box's words says so to the box (a question left
     standing there goes) */
  if (typeof lhBoxSet === 'function') lhBoxSet(MN_SEAT, '');
  if (state.view !== 'mynotes' && typeof setView === 'function') setView('mynotes'); else renderMyNotes();
}
function myNotesOpen(id){
  _mn.mode = 'view'; _mn.sel = id; _mn.filter = 'all'; _mn.ct = ''; _mn.q = ''; _mn.form = null;
  if (typeof lhBoxSet === 'function') lhBoxSet(MN_SEAT, '');
  if (typeof insSelect === 'function') insSelect('mynotes', id);
  if (state.view !== 'mynotes' && typeof setView === 'function') setView('mynotes'); else renderMyNotes();
}
async function myNoteSave(){
  const f = _mn.form; if (!f || !String(f.body || '').trim()) return;
  const reviewBy = _mnWhenDate(f);
  try{
    const it = await mineSave('note', { body:f.body, title:f.title, contractId:f.contractId || '', quote:f.quote || '', clauseId:f.clauseId || '', reviewBy });
    _mn.mode = 'view'; _mn.sel = it.id; _mn.fresh = it.id; _mn.form = null;
    if (typeof insSelect === 'function') insSelect('mynotes', it.id);
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
    /* a note being written is kept: + New note brings its form back (after
       ‹ Jambo put his own words in the panel) rather than starting it again */
    if ((el = hit('#mn-new'))){ if (_mn.mode === 'new' && _mn.form){ if (typeof insSelect === 'function') insSelect('mynotes', 'new'); renderMyNotes(); return; } myNotesNew(); return; }
    if ((el = hit('#mn-cancel'))){ _mn.mode = 'view'; _mn.form = null; renderMyNotes(); return; }
    if ((el = hit('#mn-save'))){ if (!el.disabled) myNoteSave(); return; }
    if ((el = hit('[data-mn-when]'))){ _mn.form.when = el.getAttribute('data-mn-when'); renderMyNotes(); if (_mn.form.when === 'pick'){ const d = document.getElementById('mn-date'); if (d) d.focus(); } return; }
    if ((el = hit('[data-mn-ct]'))){ _mn.form.contractId = el.getAttribute('data-mn-ct'); _mn.form.listOpen = false; renderMyNotes(); return; }
    if ((el = hit('[data-mn-act="ct-clear"]'))){ _mn.form.contractId = ''; _mn.form.query = ''; _mn.form.listOpen = true; renderMyNotes(); const i = document.getElementById('mn-ct'); if (i) i.focus(); return; }
    if ((el = hit('#mn-ct'))){ if (_mn.form && !_mn.form.listOpen){ _mn.form.listOpen = true; renderMyNotes(); } return; }
    if ((el = hit('[data-mn-act]'))){ myNoteAct(el.getAttribute('data-mn-act')); return; }
    if ((el = hit('[data-mn-row]'))){
      if (_mn.mode === 'new' && _mn.form && String(_mn.form.body || '').trim()){ if (typeof toast === 'function') toast(i18t('mn_finish_first'), 'warn'); return; }
      /* the row already chosen, pressed again (a double press): nothing changes, nothing is drawn again (the glitch audit, 24 Oct 2026) */
      if (_mn.mode === 'view' && !_mn.form && String(_mn.sel) === String(el.getAttribute('data-mn-row'))) return;
      _mn.mode = 'view'; _mn.form = null; _mn.sel = el.getAttribute('data-mn-row'); _mn.fresh = null;
      if (typeof insSelect === 'function') insSelect('mynotes', _mn.sel);
      renderMyNotes(); return; }
    if (_mn.form && _mn.form.listOpen && !hit('.mn-picker')){ _mn.form.listOpen = false; renderMyNotes(); }
  });
  /* the tabs, the box and the Contract chip are the list head's own presses
     (js/views/listhead.js): each ends in mnHeadReg's writers above */
  document.addEventListener('input', e => {
    if (state.view !== 'mynotes') return;
    if (!_mn.form) return;
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
    /* the arrows walk the rows, as on every list beside Jambo's panel */
    if (row && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
      const to = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling;
      if (to && to.hasAttribute('data-mn-row')){ e.preventDefault(); to.click(); const again = document.querySelector(`[data-mn-row="${CSS.escape(to.getAttribute('data-mn-row'))}"]`); if (again) again.focus({ preventScroll:false }); }
    }
  });
}
/* THE RAIL'S COUNT follows the store (mineChanged → here). */
function paintMyNotesCount(){
  if (typeof updateSidebarCounts === 'function'){ try{ if (typeof navCountsClear === 'function') navCountsClear(); updateSidebarCounts(); }catch(_){} }
}
function myNotesCss(){ return `
  .mn-page{min-height:0}
  /* THE HEAD CARD (round 20's title row, Part 8's rows under it): the page's
     name, its count and the private line, + New note at the end; then the
     list head's box, tabs and chips (js/views/listhead.js, index.html) */
  .mn-ins .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:var(--s-2)}
  .mn-head2{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap}
  .mn-hl{display:flex;align-items:baseline;gap:6px 10px;flex-wrap:wrap;min-width:0}
  .mn-t1{margin:0;font-family:var(--font-title);font-size:20px;font-weight:var(--w-title-serif);letter-spacing:-.01em;line-height:1.2;color:var(--color-text)}
  .mn-hn{color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
  .mn-hs{display:inline-flex;align-items:center;gap:5px;font-size:var(--t-meta);color:var(--color-neutral-600)}
  .mn-lock{width:12px;height:12px;flex:none}
  .mn-ins.is-narrow .ins-body{grid-template-columns:minmax(0,1fr)}
  .mn-ins.is-narrow .mn-card2{min-height:0}
  .mn-split{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 380px}
  .mn-wrap{min-width:0;overflow:auto}
  /* "No notes yet." stands clear of its card's top, as every empty list's words do (the detail round, 25 Oct 2026: it sat 1px under the edge) */
  .mn-wrap > .hati-empty{padding:24px 16px}
  .mn-side{border-left:1px solid var(--color-divider);padding:var(--s-4);overflow:auto;display:flex;flex-direction:column;gap:10px;min-width:0}
  .mn-side.mn-side-panel{border-left:0;padding:0;overflow:visible;gap:0}
  @media (max-width:1039px){ .mn-split{grid-template-columns:minmax(0,1fr)} .mn-side{border-left:0;border-top:1px solid var(--color-divider)} }
  /* THE LIST: the lists' own table, a row a line, the review as a pill */
  .mn-t tbody tr{cursor:pointer}
  /* a row a line, as drawn: a note's title, its contract, its review day */
  .ins-lt.mn-t tbody td{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:37px}
  .mn-t tbody tr:hover td{background:var(--surface-2, var(--color-neutral-50))}
  .mn-t tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent)}
  .mn-t tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid)}
  .mn-t tr.is-fresh td{animation:mnFresh 1.6s ease-out}
  @keyframes mnFresh{from{background:var(--st-green-bg)}to{background:transparent}}
  @media (prefers-reduced-motion:reduce){ .mn-t tr.is-fresh td{animation:none} }
  .mn-t td.t{color:var(--color-text)}
  .mn-t .cp,.mn-t td.w{color:var(--color-neutral-600)}
  .mn-t tr:focus{outline:none}
  .mn-t tr:focus-visible td{box-shadow:inset 0 2px 0 var(--focus-color),inset 0 -2px 0 var(--focus-color)}
  .mn-pill{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;font-size:11.5px;font-weight:var(--w-label);white-space:nowrap;border:1px solid transparent}
  .mn-pill.is-late{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .mn-pill.is-today{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .mn-pill.is-later{background:var(--color-surface);border-color:var(--color-divider);color:var(--color-neutral-600,var(--color-text))}
  /* on the chosen row's tint a grey pill keeps an edge, so it still reads */
  .ins-lt tbody tr.is-sel .mn-pill.is-none{box-shadow:inset 0 0 0 1px var(--color-divider)}
  .mn-pill.is-none{background:var(--st-gray-bg);color:var(--st-gray-fg)}
  .mn-pill.is-done{background:var(--st-green-bg);color:var(--st-green-fg)}
  /* THE NOTE IN JAMBO'S PANEL (and the card's side, narrower) */
  .mn-eb{display:inline-flex;align-items:center;gap:5px}
  .mn-ref-chip{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;background:var(--color-accent-50);color:var(--accent-ink);
    font-family:var(--font-ref, var(--font-code));font-size:var(--t-label);white-space:nowrap}
  .mn-note{padding:12px 16px 4px;display:flex;flex-direction:column;gap:10px}
  .mn-side:not(.mn-side-panel) .mn-note{padding:0}
  .mn-rows{border-bottom:0}
  .mn-foot2{padding:8px 16px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
  .mn-side:not(.mn-side-panel) .mn-foot2{padding:0}
  .mn-h{margin:0;font-size:var(--t-h3, 16px);font-weight:var(--w-strong)}
  .mn-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:var(--t-label);color:var(--color-neutral-600)}
  .mn-q{display:block;font-style:italic;font-size:var(--t-meta);border-left:2px solid var(--color-accent-600);padding-left:8px;color:var(--color-neutral-700,var(--color-text))}
  .mn-body{margin:0;font-size:var(--t-body);line-height:1.6;white-space:pre-wrap;color:var(--color-text)}
  .mn-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .mn-acts .g{flex:1}
  .mn-del{color:var(--st-ruby-fg);border-color:var(--st-ruby-line, var(--st-ruby-fg))}
  .mn-del:hover{background:var(--st-ruby-bg)}
  [data-mn-undo]{background:var(--st-amber-bg);border-color:var(--st-amber-line);color:var(--st-amber-fg)}
  .mn-priv{display:flex;align-items:flex-start;gap:6px;margin:0;font-size:var(--t-label);font-weight:400;color:var(--color-neutral-600);line-height:1.45}
  .mn-priv .mn-lock{margin-top:2px}
  .mn-side-empty,.mn-hint{margin:0;font-size:var(--t-label);font-weight:400;color:var(--color-neutral-600)}
  .mn-form{display:flex;flex-direction:column;gap:12px}
  .mn-form.is-panel{padding:14px 16px}
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
  .mn-when button[aria-pressed="true"]{background:var(--accent-fill);border-color:var(--accent-fill);color:#fff}
  .mn-when button:focus-visible{outline:2px solid var(--color-accent-600);outline-offset:2px}
`; }

Object.assign(window, { mnPlace, mnPlacePut, renderMyNotes, myNotesNew, myNotesOpen, myNoteState, myNotesShown, paintMyNotesCount });
