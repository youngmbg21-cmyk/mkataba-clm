/* ============================================================
   HOME (THE COUNTER) AND THE BAR'S RECENT (owner picked "Front desk", with
   Jambo's work first in line, 17 Oct 2026; "The SAP way" and the name Home,
   18 Oct 2026. The code keeps the name counter: the view, its ids, cn-*)
   ============================================================
   HOME is the first screen after signing in on a computer: Jambo's
   face, one box, a few chips, and the work that is yours. It keeps nothing
   of its own and files nothing — every row reads a list the house already
   keeps and its button is the door that already does the act:
     · Jambo's work first: his prepared work (hbAgentsData), opening its card
       on the Board (hbOpenAgent);
     · then each contract's owed item, the Board's own reading (hbNeedsList,
       needsYouOf), each pressed through its own door (hbNeedsPress);
     · then, for an admin, ONE row onto Settings' own list (stNeedsAll) —
       pointed to, never copied.
   THE BOX is Jambo's one word table: a place (caReadPlace → caGo) opens on
   the desk; anything else is asked of Jambo beside the page (intelAsk on
   Home), so there is one brain for every box. Typing never acts.

   HOME, RECENT AND BACK take the left menu's place on a computer (the owner
   picked "The SAP way" and the name Home, 18 Oct 2026; it reverses "Desk
   tabs"): no row above the page. The bar reads ‹ · Ha · the page's name ▾;
   the name opens Recent (Home, then the last six pages, newest first, × on
   each), ‹ goes back one page and the Ha mark is Home. Kept per person in
   this browser under their own key. The phone keeps its own screens and
   draws none of it.
   ============================================================ */

const _cnE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _cnT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _cnTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;

/* The Counter and the tabs are the computer's; below 768 the phone draws its own. */
function deskShellOn(){
  try { return !(typeof window.mPhone === 'function' && window.mPhone()); } catch (_){ return true; }
}

/* ---------------- HOME, RECENT AND BACK, IN THE TOP BAR ----------------
   THE SAP WAY (the owner picked it, and the name Home, 18 Oct 2026; reverses
   "Desk tabs"): no row of tabs above the page. The bar's left reads
   ‹ · Ha · the page's name ▾ — ‹ goes back one page, the Ha mark is Home,
   and the page's name opens Recent: Home first, then your last six pages,
   newest first, each with × to take it off now; the seventh page drops the
   oldest. Present this page is Recent's last row on Home's faces. Kept per
   person in this browser under their own key; the trail ‹ walks is this
   sitting's. Pressed again, Esc, or a press outside closes the menu. */
const DK_KEY = 'hati.v1.deskTabs';
const DK_RECENT = 6;   // pages Recent keeps; the seventh drops the oldest
let _dkMenuOpen = false;
function dkWho(){ const me = (typeof currentUser === 'function') ? currentUser() : null; return String((me && me.id) || 'me'); }
function dkAll(){ try { const v = JSON.parse(localStorage.getItem(DK_KEY) || '{}'); return (v && typeof v === 'object') ? v : {}; } catch (_){ return {}; } }
function dkTabs(){ const t = dkAll()[dkWho()]; return Array.isArray(t) ? t.filter(x => x && typeof x.k === 'string') : []; }
function dkSave(L){
  try {
    const all = dkAll();
    all[dkWho()] = L.slice().sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, DK_RECENT);
    localStorage.setItem(DK_KEY, JSON.stringify(all));
  } catch (_){}
}
/* Which page the reader is on: a face of Home, a contract on Home's paper,
   or any other page. Home itself is never a Recent row (it is the first). */
const DK_HOME_FACE = { board: 'home:board', calendar: 'home:calendar', explorer: 'home:explorer' };
function deskKeyNow(){
  if (typeof state === 'undefined' || !state || !state.view || state.view === 'counter') return null;
  const v = state.view;
  if (v === 'dashboard'){
    const f = (typeof hbFace === 'function') ? hbFace() : 'board';
    if (f === 'paper'){ const c = (typeof pdContract === 'function') ? pdContract() : null; return c ? 'c:' + c.id : 'home:contracts'; }
    /* a contract brought up is its own page, on its contract's row (round 7) */
    if (f === 'board' && typeof window.bsCardId === 'function'){ const id = window.bsCardId(); if (id) return 'c:' + id; }
    return DK_HOME_FACE[f] || 'home:board';
  }
  if (v === 'workspace' || v === 'doc') return state.activeId ? 'c:' + state.activeId : null;
  return 'v:' + v;
}
/* A page's name, read when it is drawn, so it follows the reader's language. */
const DK_VIEW_WORD = { redline: 'nav_negotiations', customers: 'nav_customers', approvals: 'nav_approvals', obligations: 'nav_obligations',
  mynotes: 'nav_mynotes', intel: 'nav_insights', jambo: 'nav_jambo', templates: 'nav_tpl_std', playbook: 'nav_tpl_std', migration: 'nav_import',
  intake: 'nav_intake', directory: 'nav_directory', team: 'nav_settings_rules', brain: 'nav_brain', register: 'nav_contracts' };
function deskTabLabel(k){
  k = String(k || '');
  if (k === 'home') return _cnT('dk_counter');
  if (k.startsWith('home:')){ const f = k.slice(5); return f === 'contracts' ? _cnT('nav_contracts') : _cnT('hb_face_' + f); }
  if (k.startsWith('c:')){
    const c = (typeof getContract === 'function') ? getContract(k.slice(2)) : null; if (!c) return '';
    const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
    const who = String(c.counterparty || c.name || '').trim();
    return who ? who + ' · ' + ref : String(ref);
  }
  if (k.startsWith('v:')){
    const v = k.slice(2); if (DK_VIEW_WORD[v]) return _cnT(DK_VIEW_WORD[v]);
    try { return (typeof shellTitleFor === 'function' && shellTitleFor(v)) || ''; } catch (_){ return ''; }
  }
  return '';
}
/* the page in front, as the bar names it: Home on Home */
function deskPageName(){
  /* THE BUILDER IS ITS OWN PAGE (round 21 draws its tab "Builder"; lane D,
     19 Oct 2026): it paints over the page it was opened from without a view
     of its own, so the bar asks it before the page underneath */
  if (typeof window !== 'undefined' && typeof window.tbOnScreen === 'function' && window.tbOnScreen()) return _cnT('tb_jl_word');
  const k = deskKeyNow();
  if (!k) return (typeof state !== 'undefined' && state && state.view === 'counter') ? _cnT('dk_counter') : '';
  return deskTabLabel(k);
}
/* THE TRAIL ‹ WALKS: this sitting's pages, oldest first ('home' is Home).
   Back goes to the page before this one and leaves the later ones behind,
   as a browser's back does. */
const DK_TRAIL_MAX = 50;
let _dkTrail = [];
function dkTrailNote(k){
  if (!k || _dkTrail[_dkTrail.length - 1] === k) return;
  _dkTrail.push(k); if (_dkTrail.length > DK_TRAIL_MAX) _dkTrail.shift();
}
function deskBackTarget(){
  const now = deskKeyNow() || 'home';
  for (let i = _dkTrail.length - 1; i >= 0; i--){
    const k = _dkTrail[i]; if (k === now) continue;
    if (k === 'home' || deskTabLabel(k)) return { k, i };
  }
  return null;
}
function deskGoBack(){
  const t = deskBackTarget(); if (!t) return false;
  _dkTrail = _dkTrail.slice(0, t.i + 1); _dkMenuOpen = false;
  if (t.k === 'home') deskGoCounter(); else deskTabOpen(t.k);
  deskBarPaint(); return true;
}
/* Asked after every page is drawn, every face turned and every paper put up.
   The bar is named at once; the page is KEPT in Recent (and on the trail)
   only once it has settled, so a door that passes through the Board on its
   way to a paper leaves one row, not two. */
const DK_SETTLE_MS = 300;
let _dkNoteT = 0;
function deskTabsSync(){
  if (!deskShellOn()) return;
  deskBarPaint();
  clearTimeout(_dkNoteT);
  _dkNoteT = setTimeout(() => {
    const k = deskKeyNow();
    if (k){
      const L = dkTabs(); let t = L.find(x => x.k === k);
      if (t) t.at = Date.now(); else { t = { k, at: Date.now() }; L.push(t); }
      /* ONE ROW PER CONTRACT, two ways to read it (round 7): it remembers
         whether its page or its paper was in front */
      if (k.startsWith('c:')) t.view = (typeof window.bsCardId === 'function' && window.bsCardId() && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'board') ? 'card' : 'paper';
      dkSave(L);
    }
    dkTrailNote(k || ((typeof state !== 'undefined' && state && state.view === 'counter') ? 'home' : null));
    deskBarPaint();
  }, DK_SETTLE_MS);
}
/* Recent's rows: newest first, at most six, the page in front among them */
function deskRecentRows(){
  const now = deskKeyNow();
  let L = dkTabs().filter(t => deskTabLabel(t.k));
  if (now && !L.some(t => t.k === now) && deskTabLabel(now)) L = L.concat([{ k: now, at: Date.now() }]);
  L = L.slice().sort((a, b) => (b.at || 0) - (a.at || 0));
  if (now){ const i = L.findIndex(t => t.k === now); if (i > 0) L.unshift(L.splice(i, 1)[0]); }
  return L.slice(0, DK_RECENT);
}
/* what a row is and when, under its name: "Contract · 25 min ago" */
function dkAgo(at, on){
  if (on) return _cnT('dk_ago_now');
  const m = Math.max(0, Math.round((Date.now() - (Number(at) || 0)) / 60000));
  if (m < 1) return _cnT('dk_ago_now');
  if (m < 60) return _cnT('dk_ago_min', { n: m });
  const h = Math.round(m / 60); if (h < 24) return _cnT('dk_ago_h', { n: h });
  const d = Math.round(h / 24); return d <= 1 ? _cnT('dk_ago_yesterday') : _cnT('dk_ago_days', { n: d });
}
function dkKindWord(k){
  if (k.startsWith('c:')) return _cnT('dk_kind_contract');
  if (k.startsWith('home:')) return _cnT('dk_counter');
  return '';
}
/* Present this page: Home's faces only, and not a contract's own page (round 7) */
function dkPresentOn(){
  if (typeof state === 'undefined' || !state || state.view !== 'dashboard' || typeof hbPresent !== 'function') return false;
  return !(typeof window.bsCardId === 'function' && window.bsCardId() && typeof hbFace === 'function' && hbFace() === 'board');
}
function deskRecentHtml(){
  const now = deskKeyNow(), home = !now && typeof state !== 'undefined' && state && state.view === 'counter';
  const tick = (typeof icon === 'function') ? icon('check2', 'dk-r-ic', 2) : '';
  const homeIc = '<svg class="dk-r-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-home"/></svg>';
  const playIc = '<svg class="dk-r-ic" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.5v9l7-4.5z"/></svg>';
  const row = t => {
    const on = t.k === now, w = deskTabLabel(t.k), away = _cnT('dk_put_away', { what: w });
    const sub = [dkKindWord(t.k), dkAgo(t.at, on)].filter(Boolean).join(' · ');
    return `<div class="dk-r${on ? ' is-on' : ''}"><button type="button" class="dk-r-go" role="menuitem" data-dk-go="${_cnE(t.k)}"${on ? ' aria-current="page"' : ''}><span class="dk-r-tick" aria-hidden="true">${on ? tick : ''}</span><span class="dk-r-w"><span class="dk-r-t">${_cnE(w)}</span><small>${_cnE(sub)}</small></span></button><button type="button" class="dk-r-x" data-dk-x="${_cnE(t.k)}" title="${_cnE(away)}" aria-label="${_cnE(away)}">×</button></div>`;
  };
  const rows = deskRecentRows();
  return `<div class="dk-r dk-r-home${home ? ' is-on' : ''}"><button type="button" class="dk-r-go" role="menuitem" data-dk-counter${home ? ' aria-current="page"' : ''}><span class="dk-r-tick" aria-hidden="true">${home ? tick : homeIc}</span><span class="dk-r-w"><span class="dk-r-t">${_cnE(_cnT('dk_counter'))}</span><small>${_cnE(_cnT('dk_home_sub'))}</small></span></button></div>
    <div class="dk-r-h">${_cnE(_cnT('dk_recent_head', { n: DK_RECENT }))}</div>
    ${rows.length ? rows.map(row).join('') : `<p class="dk-r-none">${_cnE(_cnT('dk_recent_none'))}</p>`}
    <p class="dk-r-foot">${_cnE(_cnT('dk_recent_foot', { n: DK_RECENT + 1 }))}</p>
    ${dkPresentOn() ? `<button type="button" class="dk-r-act" role="menuitem" data-dk-present>${playIc}${_cnE(_cnT('dk_present'))}</button>` : ''}`;
}
/* the bar's three: ‹ (grey with its reason when there is no page to go back
   to), the Ha mark, and the page's name, which holds Recent */
let _dkMenuHtml = '';
function deskBarPaint(){
  const on = deskShellOn();
  const back = document.getElementById('dk-back'), w = document.getElementById('dk-pg-w'), btn = document.getElementById('dk-page');
  if (back){
    back.hidden = !on;
    const can = !!deskBackTarget();
    back.disabled = !can;
    const tip = can ? _cnT('dk_back') : _cnT('dk_back_none');
    if (back.title !== tip){ back.title = tip; back.setAttribute('aria-label', tip); }
  }
  if (w) w.hidden = !on;
  if (btn){
    const name = deskPageName();
    const word = btn.querySelector('.dk-page-w'); if (word && word.textContent !== name) word.textContent = name;
    if (btn.title !== name) btn.title = name;
    btn.setAttribute('aria-expanded', String(_dkMenuOpen));
    btn.classList.toggle('is-open', _dkMenuOpen);
  }
  const menu = document.getElementById('dk-recent');
  if (menu){
    if (menu.hidden === _dkMenuOpen) menu.hidden = !_dkMenuOpen;
    const h = _dkMenuOpen ? deskRecentHtml() : '';
    if (_dkMenuHtml !== h || (_dkMenuOpen && !menu.firstChild)){ menu.innerHTML = h; _dkMenuHtml = h; }
  }
}
function deskRecentToggle(open){
  _dkMenuOpen = open == null ? !_dkMenuOpen : !!open;
  deskBarPaint();
  if (_dkMenuOpen){ const b = document.querySelector('#dk-recent .dk-r-go'); if (b && document.activeElement && document.activeElement.id === 'dk-page') try { b.focus({ preventScroll: true }); } catch (_){} }
}
/* a row's press: the door that already opens that page */
function deskTabOpen(k){
  k = String(k || ''); _dkMenuOpen = false;
  if (k === 'home'){ deskGoCounter(); return true; }
  if (k.startsWith('home:')){
    const f = k.slice(5);
    if (f === 'contracts' && typeof hbOpenContracts === 'function'){ hbOpenContracts(); return true; }
    if (f === 'calendar' && typeof hbOpenCalendar === 'function'){ hbOpenCalendar(); return true; }
    if (f === 'explorer' && typeof hbOpenExplorer === 'function'){ hbOpenExplorer(); return true; }
    if (typeof hbS !== 'function') return false;
    /* the Board row is the Board, not a contract's page on it (round 7) */
    const left = (typeof window.bsCardLeave === 'function') && window.bsCardLeave();
    if (state.view === 'dashboard' && typeof hbSetFace === 'function' && document.getElementById('hb-head')){
      if (left && hbFace() === 'board' && typeof hbPaintBoard === 'function') hbPaintBoard(); else hbSetFace('board');
      deskTabsSync(); return true; }
    const s = hbS(); s.face = 'board'; if (typeof hbSave === 'function') hbSave();
    if (typeof setView === 'function') setView('dashboard');
    return true;
  }
  if (k.startsWith('c:')){
    const c = (typeof getContract === 'function') ? getContract(k.slice(2)) : null;
    if (!c){ deskTabClose(k); return false; }
    const t = dkTabs().find(x => x.k === k);
    if (t && t.view === 'card' && typeof hbStripBring === 'function' && hbStripBring(c.id)) return true;
    if (typeof pdOpenOnHome === 'function'){ pdOpenOnHome(c.id, 'copilot'); return true; }
    if (typeof openWorkspace === 'function'){ openWorkspace(c.id); return true; }
    return false;
  }
  if (k.startsWith('v:')){
    const v = k.slice(2);
    if (v === 'redline' && typeof openNegotiations === 'function'){ openNegotiations({ list: true }); return true; }
    if (typeof setView === 'function'){ setView(v); return true; }
  }
  return false;
}
/* × takes a page off Recent; the page in front goes to the one used last, else Home */
function deskTabClose(k){
  const L = dkTabs(); const i = L.findIndex(t => t.k === k);
  const wasNow = deskKeyNow() === k;
  if (i < 0 && !wasNow) return;
  /* a contract's page taken off is let go, as its own × did (round 7) */
  if (i >= 0 && L[i].view === 'card' && typeof bsStripClose === 'function') bsStripClose(k.slice(2));
  if (i >= 0){ L.splice(i, 1); dkSave(L); }
  if (wasNow){
    const next = L.slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0];
    const keep = _dkMenuOpen;
    if (next) deskTabOpen(next.k); else deskGoCounter();
    _dkMenuOpen = keep;
  }
  deskBarPaint();
}
function deskGoCounter(){ _dkMenuOpen = false; if (typeof setView === 'function') setView('counter'); }

/* ---------------- THE COUNTER ---------------- */
const CN_ROWS = 7;          // contract rows in sight; "Show all N" brings the rest
const CN_POP_MAX = 40;      // every place; the list scrolls, and typing narrows it
const CN_PICK_UP = 3;       // open pages offered on a quiet day
let _cnAll = false;
/* JAMBO'S WORK LANDS ON THE BOARD'S CARD (LAND ON IT, owner 18 Oct 2026:
   "when you click on jambos work, it should take you to the jambos work card
   in the board"; and "remove the in-place list") — reverses round 23's Open
   in place: one list of Jambo's work, the Board's, and the row's Open is the
   door to it (hbOpenAgent, which lands on the card, lit). */
let _cnPop = null;          // { rows, on }

function cnNeeds(){ try { return (typeof hbNeedsList === 'function') ? (hbNeedsList() || []) : []; } catch (_){ return []; } }
function cnWork(){ try { return (typeof hbAgentsData === 'function') ? (hbAgentsData(null) || { ready: 0, rows: [] }) : { ready: 0, rows: [] }; } catch (_){ return { ready: 0, rows: [] }; } }
function cnCompany(){ try { return (typeof stNeedsAll === 'function') ? (stNeedsAll() || []) : []; } catch (_){ return []; } }
/* A BRAND-NEW WORKSPACE (no contract yet, the go-live list not done): the
   admin's one row is Home's own "Finish setting up — N left" door, the same
   reading (hbSetupLeft) and the same act (hbSetupGo); the company row after */
function cnSetup(){ try { const n = (typeof hbSetupLeft === 'function') ? hbSetupLeft() : null; return n > 0 ? n : 0; } catch (_){ return 0; } }
/* the number on "Needs you" is the rows under it: Jambo's work while he has
   prepared any, each contract's item, and the admin's one row */
function counterNeedsCount(){ return (cnWork().ready ? 1 : 0) + cnNeeds().length + ((cnSetup() || cnCompany().length) ? 1 : 0); }

function cnFace(size, cls){ return (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', size, cls) : ''; }
function cnJwRowHtml(A){
  const n = A.ready || 0;
  const who = [...new Set((A.rows || []).map(r => r.who || r.sum).filter(Boolean))].slice(0, 4);
  return `<div class="cn-r cn-jw">${cnFace(24, 'cn-r-face')}<div class="cn-w"><b>${_cnE(_cnT('cn_jw'))} <span class="cn-n">· ${_cnE(n ? _cnTn('cn_jw_n', n, { n }) : _cnT('cn_jw_none'))}</span></b><span>${_cnE(n ? who.join(' · ') : _cnT('cn_jw_rest'))}</span></div>${n ? `<button type="button" class="ui-btn ui-btn-sm" data-cn-jw>${_cnE(_cnT('cn_open'))}</button>` : ''}</div>`;
}
function cnNeedRowHtml(x){
  const c = x.c, it = x.it;
  const what = (typeof hbNyWhat === 'function') ? hbNyWhat(x) : '';
  const when = (typeof hbNyWhen === 'function') ? hbNyWhen(x) : '';
  const ref = (typeof refHtml === 'function') ? refHtml(c) : _cnE((typeof contractRef === 'function') ? contractRef(c) : c.id);
  const priv = c.folder && typeof streamIsPrivate === 'function' && streamIsPrivate(c.folder)
    ? ` <span class="cn-pill">${(typeof icon === 'function') ? icon('lock', 'cn-pill-ic') : ''}${_cnE(_cnT('cn_private', { stream: ((typeof FOLDERS !== 'undefined' && FOLDERS[c.folder]) || {}).name || '' }))}</span>` : '';
  const verb = (typeof INS_NEED_VERB !== 'undefined' && INS_NEED_VERB[it.kind]) ? _cnT(INS_NEED_VERB[it.kind]) : _cnT('cn_open');
  const sub = [ref + ' ' + _cnE(c.counterparty || ''), _cnE(c.name || ''), when ? (it.urgent ? `<span class="cn-late">${_cnE(when)}</span>` : _cnE(when)) : ''].filter(Boolean).join(' · ');
  return `<div class="cn-r"><div class="cn-w"><b>${_cnE(what)}${priv}</b><span>${sub}</span></div><button type="button" class="ui-btn ui-btn-sm" data-cn-need="${_cnE(it.kind)}" data-cn-id="${_cnE(c.id)}">${_cnE(verb)}</button></div>`;
}
function cnCompanyRowHtml(R){
  const sub = R.slice(0, 3).map(r => String(r.text || '').trim()).filter(Boolean).join(' · ');
  return `<div class="cn-r cn-co"><span class="cn-co-ic" aria-hidden="true">${(typeof icon === 'function') ? icon('building', 'cn-pill-ic') : ''}</span><div class="cn-w"><b>${_cnE(_cnT('cn_company'))} <span class="cn-n">· ${R.length}</span></b><span title="${_cnE(sub)}">${_cnE(sub)}</span></div><button type="button" class="ui-btn ui-btn-sm" data-cn-co>${_cnE(_cnT('cn_company_go'))}</button></div>`;
}
function cnSetupRowHtml(n){
  return `<div class="cn-r cn-co"><span class="cn-co-ic" aria-hidden="true">${(typeof icon === 'function') ? icon('building', 'cn-pill-ic') : ''}</span><div class="cn-w"><b>${_cnE(_cnTn('hb_setup_left', n, { n }))}</b></div><button type="button" class="ui-btn ui-btn-sm" data-cn-setup>${_cnE(_cnT('cn_open'))}</button></div>`;
}
function cnChipsHtml(A){
  const w = k => _cnT(k);
  const L = (A.ready ? [[w('ca_w_work'), 1]] : []).concat([[w('nav_contracts').toLowerCase()], [w('ca_w_calendar')], [w('ca_wall_draft')], [w('ca_wall_upload')]]);
  return L.map(([word, lead]) => `<button type="button" class="cn-chip${lead ? ' is-lead' : ''}" data-cn-ask="${_cnE(word)}">${_cnE(word)}</button>`).join('');
}
function counterHtml(){
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const name = String((me && me.name) || '').trim().split(/\s+/)[0] || _cnT('home_greet_there');
  const A = cnWork(), N = cnNeeds(), R = cnCompany(), S = cnSetup();
  const n = (A.ready ? 1 : 0) + N.length + ((S || R.length) ? 1 : 0);
  const shown = _cnAll ? N : N.slice(0, CN_ROWS);
  const quiet = !N.length && !R.length && !S;
  const rows = cnJwRowHtml(A) + shown.map(cnNeedRowHtml).join('') + (S ? cnSetupRowHtml(S) : R.length ? cnCompanyRowHtml(R) : '')
    + (quiet ? `<div class="cn-r"><div class="cn-w"><b>${_cnE(_cnT('cn_nothing'))}</b></div></div>` : '');
  const more = N.length > CN_ROWS ? `<div class="cn-foot"><button type="button" class="ui-link" data-cn-all aria-expanded="${_cnAll}">${_cnE(_cnAll ? _cnT('cn_show_fewer') : _cnT('cn_show_all', { n: N.length }))}</button></div>` : '';
  const open = quiet ? dkTabs().slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(t => deskTabLabel(t.k)).slice(0, CN_PICK_UP) : [];
  const pick = open.length ? `<section class="cn-card"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('cn_pick_up'))}</span></header>${open.map(t =>
    `<div class="cn-r"><div class="cn-w"><b>${_cnE(deskTabLabel(t.k))}</b></div><button type="button" class="ui-btn ui-btn-sm" data-dk-go="${_cnE(t.k)}">${_cnE(_cnT('cn_open'))}</button></div>`).join('')}</section>` : '';
  return `<div class="cn-page" id="cn-page"><div class="cn-in">
    <section class="cn-card cn-ask">${cnFace(40, 'cn-face')}<h1>${_cnE(_cnT('cn_hello', { name }))}</h1>
      <div class="cn-wrap"><div class="cn-box"><input id="cn-q" type="text" autocomplete="off" spellcheck="false" placeholder="${_cnE(_cnT('cn_box_ph'))}" aria-label="${_cnE(_cnT('cn_box_label'))}"><button type="button" class="ui-btn ui-btn-primary" data-cn-send>${_cnE(_cnT('cn_ask'))}</button></div><div class="ca-pop cn-pop" id="cn-pop" hidden></div></div>
      ${''/* THE HINT LINE UNDER THE BOX (owner, 18 Oct 2026, "Every Jambo box"):
             the one builder every Jambo ask box on a computer carries */}${typeof jamboHintHtml === 'function' ? jamboHintHtml() : ''}
      <div class="cn-chips">${cnChipsHtml(A)}</div></section>
    <section class="cn-card cn-needs" id="cn-needs"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('hb_ny_title'))}</span><span class="cn-cnt">${n}</span>${n ? `<span class="cn-hint">${_cnE(_cnT('cn_needs_hint'))}</span>` : ''}</header>${rows}${more}</section>
    ${pick}</div></div>`;
}
function renderCounter(){
  const host = document.getElementById('content'); if (!host) return;
  _cnPop = null;
  host.innerHTML = counterHtml();
  /* the box takes the keys straight away where there is a keyboard to type with */
  let fine = false; try { fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); } catch (_){ fine = false; }
  if (fine) setTimeout(() => { const q = document.getElementById('cn-q'); if (q && state.view === 'counter') try { q.focus({ preventScroll: true }); } catch (_){} }, 0);
}
/* the list's own data moved (a save, a new item): only the Needs card is drawn again */
function counterRepaint(){
  if (typeof state === 'undefined' || !state || state.view !== 'counter') return;
  const card = document.getElementById('cn-needs'); if (!card) return;
  const t = document.createElement('div'); t.innerHTML = counterHtml();
  const fresh = t.querySelector('#cn-needs'); if (fresh) card.replaceWith(fresh);
}

/* THE BOX: a place opens on the desk; anything else is Jambo's, beside the
   page — the one reader every Jambo box uses (caAskAnywhere), with the
   Counter's own rule that a question goes to Home's Jambo too */
function counterAsk(text){
  const t = String(text || '').trim(); if (!t) return false;
  /* a request to book or find time goes to the Calendar's own Jambo with its words (18 Oct 2026, #342) */
  if (typeof igBookAsk === 'function' && igBookAsk(t) && typeof calHandOff === 'function' && calHandOff(t)) return true;
  return (typeof caAskAnywhere === 'function') ? caAskAnywhere(text, { all: true }) : false;
}

/* "/" — the places, most used first: the same rows the Board's list draws (caSlashRows) */
function counterPopRead(inp){
  const m = /^\s*\/([\w\-åäöÅÄÖ'’]*)$/.exec(String(inp.value || ''));
  if (!m || typeof caSlashRows !== 'function'){ counterPopClose(); return; }
  /* on the Counter no contract is open, so the words that need one (redline, sign, share, fill in) are left out */
  const one = new Set((typeof CA_PLACES !== 'undefined' ? CA_PLACES : []).filter(p => p.need === 'one').map(p => p.k));
  const rows = caSlashRows(m[1].toLowerCase(), { max: 99 }).filter(r => !one.has(r.k)).slice(0, CN_POP_MAX);
  if (!rows.length){ counterPopClose(); return; }
  _cnPop = { rows, on: Math.min((_cnPop && _cnPop.on) || 0, rows.length - 1) };
  counterPopPaint();
}
function counterPopPaint(){
  const el = document.getElementById('cn-pop'); if (!el || !_cnPop) return;
  el.innerHTML = `<h5>${_cnE(_cnT('hb_pop_places'))}</h5><div role="listbox">${_cnPop.rows.map((r, i) =>
    `<div class="ca-opt${i === _cnPop.on ? ' on' : ''}" role="option" aria-selected="${i === _cnPop.on}" data-cn-pop="${i}"><span class="who"><b>${_cnE(r.word)}</b>${r.sub ? `<small>${_cnE(r.sub)}</small>` : ''}</span></div>`).join('')}</div><p class="ca-hint">${_cnE(_cnT('hb_pop_keys'))}</p>`;
  el.hidden = false;
}
function counterPopClose(){ _cnPop = null; const el = document.getElementById('cn-pop'); if (el){ el.hidden = true; el.innerHTML = ''; } }
function counterPopTake(i){
  const r = _cnPop && _cnPop.rows[i]; if (!r) return;
  const q = document.getElementById('cn-q'); if (q) q.value = '';
  counterPopClose(); counterAsk(r.word);
}

/* ---------------- PRESSES, ONE LISTENER EACH, ARMED ONCE ---------------- */
if (typeof document !== 'undefined' && !window._cnWired){
  window._cnWired = true;
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    let el;
    /* a row chosen from the keyboard hands the keyboard back to the page's name,
       never the top of the page (the menu it stood in is gone) */
    const fromMenu = e.detail === 0 && !!t.closest('#dk-recent');   /* asked before the press redraws the menu away */
    const keyBack = () => { if (fromMenu){ const b = document.getElementById('dk-page'); if (b) try { b.focus({ preventScroll: true }); } catch (_){} } };
    if ((el = t.closest('[data-dk-counter]'))){ deskGoCounter(); keyBack(); return; }
    if ((el = t.closest('[data-dk-back]'))){ deskGoBack(); return; }
    if ((el = t.closest('[data-dk-x]'))){ deskTabClose(el.getAttribute('data-dk-x')); return; }
    if ((el = t.closest('[data-dk-go]'))){ deskTabOpen(el.getAttribute('data-dk-go')); keyBack(); return; }
    if ((el = t.closest('[data-dk-present]'))){ _dkMenuOpen = false; deskBarPaint(); if (typeof hbPresent === 'function') hbPresent(true); return; }
    if ((el = t.closest('[data-dk-recent]'))){ deskRecentToggle(); return; }
    if (_dkMenuOpen && !t.closest('#dk-pg-w')){ _dkMenuOpen = false; deskBarPaint(); }
    if (!t.closest('#cn-page')) return;
    if ((el = t.closest('[data-cn-pop]'))){ counterPopTake(Number(el.getAttribute('data-cn-pop'))); return; }
    if (_cnPop && !t.closest('.cn-wrap')) counterPopClose();
    if ((el = t.closest('[data-cn-send]'))){ const q = document.getElementById('cn-q'); if (q){ const v = q.value; q.value = ''; counterPopClose(); counterAsk(v); } return; }
    if ((el = t.closest('[data-cn-ask]'))){ counterAsk(el.getAttribute('data-cn-ask')); return; }
    if ((el = t.closest('[data-cn-jw]'))){ if (typeof hbOpenAgent === 'function') hbOpenAgent(); return; }
    if ((el = t.closest('[data-cn-need]'))){ if (typeof hbNeedsPress === 'function') hbNeedsPress(el.getAttribute('data-cn-need'), el.getAttribute('data-cn-id')); return; }
    if (t.closest('[data-cn-setup]')){ if (typeof hbSetupGo === 'function') hbSetupGo(); return; }
    if ((el = t.closest('[data-cn-co]'))){ if (typeof openSettingsAt === 'function') openSettingsAt('company'); return; }
    if ((el = t.closest('[data-cn-all]'))){ _cnAll = !_cnAll; counterRepaint(); }
  });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'cn-q') counterPopRead(e.target); });
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && t.id === 'cn-q'){
      if (_cnPop && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
        e.preventDefault(); const n = _cnPop.rows.length;
        _cnPop.on = (_cnPop.on + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; counterPopPaint(); return;
      }
      if (e.key === 'Enter'){ e.preventDefault(); if (_cnPop){ counterPopTake(_cnPop.on); return; } const v = t.value; t.value = ''; counterAsk(v); return; }
      if (e.key === 'Escape'){ if (_cnPop) counterPopClose(); else t.value = ''; }
      return;
    }
    /* Recent: Esc closes it and hands the keyboard back to the page's name; the arrows walk its rows */
    if (_dkMenuOpen && t && t.closest && t.closest('#dk-pg-w')){
      if (e.key === 'Escape'){ e.preventDefault(); _dkMenuOpen = false; deskBarPaint(); const b = document.getElementById('dk-page'); if (b) try { b.focus(); } catch (_){} return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        const L = [...document.querySelectorAll('#dk-recent .dk-r-go, #dk-recent .dk-r-act')]; if (!L.length) return;
        e.preventDefault(); const i = L.indexOf(t.closest('.dk-r-go, .dk-r-act'));
        const j = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + L.length) % L.length;
        try { L[j].focus(); } catch (_){} return;
      }
    }
    if (e.key === 'Escape' && _dkMenuOpen){ _dkMenuOpen = false; deskBarPaint(); return; }
    /* "/" on the Counter, anywhere but a box, starts the list */
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && typeof state !== 'undefined' && state && state.view === 'counter'
      && !(t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]'))){
      const q = document.getElementById('cn-q'); if (!q) return;
      e.preventDefault(); q.value = '/'; try { q.focus(); } catch (_){} counterPopRead(q);
    }
  });
}

Object.assign(window, { deskShellOn, DK_KEY, DK_RECENT, DK_SETTLE_MS, deskKeyNow, deskTabLabel, deskPageName, deskTabsSync, deskRecentRows, deskRecentHtml, deskBarPaint, deskRecentToggle, deskBackTarget, deskGoBack, deskTabOpen, deskTabClose, deskGoCounter,
  CN_ROWS, renderCounter, counterHtml, counterRepaint, counterAsk, counterNeedsCount, counterPopRead, counterPopClose });
