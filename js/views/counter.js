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
/* THE SEND SCREEN AS A PAGE IS IN FRONT (round 11's gaps, 18 Oct 2026: the
   drawing's desk tab "Send · MK-0382"; since the SAP way's bar it is the
   page's name in the bar): named while it is open, never kept in Recent nor
   on the trail ‹ walks — it goes when the screen goes, and ‹ is the paper */
const DK_SEND = 'send:';
function dkSendNow(){ try { const id = (typeof window.pdSendFor === 'function') ? window.pdSendFor() : null; return id ? DK_SEND + id : null; } catch (_){ return null; } }
/* a press on another page, or Home, puts the send screen away first — but
   not the paper the waiting letter stands over: going to it is not leaving */
function dkSendWaiting(){ try { return typeof window.pdSendIsWaiting === 'function' && !!window.pdSendIsWaiting(); } catch (_){ return false; } }
function dkLeaveSend(k){
  const now = dkSendNow(); if (!now || k === now) return;
  if (dkSendWaiting() && k === 'c:' + now.slice(DK_SEND.length)) return;
  if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
}
/* the same, through the screen's own guard (a typed note asks first, 22 Oct 2026): true while that question
   is up, and `go` runs once the screen has closed */
function dkLeaveSendThen(k, go){
  const now = dkSendNow(); if (!now || k === now) return false;
  if (dkSendWaiting() && k === 'c:' + now.slice(DK_SEND.length)) return false;
  if (typeof window.closeModalGuarded !== 'function'){ dkLeaveSend(k); return false; }
  Promise.resolve(window.closeModalGuarded()).then(ok => { if (ok !== false && !dkSendNow()) go(); });
  return true;
}
/* A PAGE IN FRONT GOES BEFORE THE BAR MOVES (owner, 20 Oct 2026: New agreement
   stayed up over Home when the HA mark was pressed, Jambo's panel gone from
   beside it): Home and a Recent row first put away a page standing in front
   (not the send screen, which dkLeaveSend keeps), through its own guard — a
   page with something typed asks first, and staying keeps the reader there */
function dkPageUp(){ return typeof document !== 'undefined' && !dkSendNow() && !!document.querySelector('#modal-root [data-dlg-page]'); }
function dkLeavePageThen(go){
  if (!dkPageUp() || typeof window.closeModalGuarded !== 'function') return false;
  Promise.resolve(window.closeModalGuarded()).then(ok => { if (ok !== false && !dkPageUp()) go(); });
  return true;
}
function deskKeyNow(){
  if (typeof state === 'undefined' || !state || !state.view || state.view === 'counter') return null;
  const v = state.view;
  /* the letter in front names the page; while it waits (Go to clause N) the
     paper is in front and the letter is Recent's first row */
  if (v === 'dashboard'){ const sk = dkSendNow(); if (sk && !dkSendWaiting()) return sk; }
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
  if (k.startsWith(DK_SEND)){
    const c = (typeof getContract === 'function') ? getContract(k.slice(DK_SEND.length)) : null; if (!c) return '';
    return _cnT('dk_send_tab', { ref: (typeof contractRef === 'function') ? contractRef(c) : c.id });
  }
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
  /* THE ONE SHEET IS A PAGE OF ITS OWN WHILE IT IS UP (the gaps, round 4,
     after the SAP bar, 18 Oct 2026): the bar names it "New agreement" */
  if (deskSheetUp()) return _cnT('na_title');
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
/* ONE TRAIL (owner, 19 Oct 2026): the bar's ‹ is one step up first — the
   clause editor opened from a Redlines row (‹ Redlines, ceRowBack), else the
   step of Jambo's panel (pdTrailBack) — then the pages walked */
function deskStepBack(press){
  const w = typeof window !== 'undefined' ? window : {};
  if (typeof w.clauseEditorOpen === 'function' && w.clauseEditorOpen()){
    if (typeof w.ceTrailOn === 'function' && w.ceTrailOn() && typeof w.ceRowBack === 'function'){ if (press) w.ceRowBack(); return true; }
    return false;
  }
  if (typeof w.pdTrail === 'function' && w.pdTrail()){ if (press) w.pdTrailBack(); return true; }
  /* JAMBO AS A TAB YOU FLIP TO (owner, 19 Oct 2026): a conversation beside a
     list, Import, Settings or the Calendar is one step up from its landing */
  if (typeof w.jamboTalkUp === 'function' && w.jamboTalkUp()){ if (press) w.jamboTalkBack(); return true; }
  return false;
}
function deskGoBack(){
  /* while the one sheet is up, ‹ is its way out: asked first, as Cancel asks,
     then back to the page the reader asked from (naSheetBack → deskSheetBackTo).
     The sheet is the page in front, so it goes before a step of the panel
     beside it — the sentence that drafted it stands in Jambo's conversation
     there (19 Oct 2026, one-sheet-as-drawn 7a) */
  if (deskSheetUp() && typeof window.naSheetBack === 'function'){ window.naSheetBack(); return true; }
  /* a page standing in the middle beside the Dossier: ‹ brings the paper back (the middle, 21 Oct 2026) */
  if (typeof window.pdMidClose === 'function' && window.pdMidClose()) return true;
  if (deskStepBack(true)){ deskBarPaint(); return true; }
  const t = deskBackTarget(); if (!t) return false;
  _dkTrail = _dkTrail.slice(0, t.i + 1); _dkMenuOpen = false;
  if (t.k === 'home') deskGoCounter(); else deskTabOpen(t.k);
  deskBarPaint(); return true;
}
/* THE ONE SHEET AND THE TRAIL: the page settled on when the sheet opened is
   where its ‹ returns (a page the reader is already on is not opened twice) */
function deskSheetUp(){ return typeof window !== 'undefined' && typeof window.naSheetUp === 'function' && !!window.naSheetUp(); }
function deskSheetFrom(){
  return _dkTrail[_dkTrail.length - 1] || ((typeof state !== 'undefined' && state && state.view === 'counter') ? 'home' : null);
}
function deskSheetBackTo(k){
  if (k){
    const here = k === 'home' ? (typeof state !== 'undefined' && state && state.view === 'counter') : deskKeyNow() === k;
    if (!here){ if (k === 'home') deskGoCounter(); else deskTabOpen(k); }
  }
  deskBarPaint();
  return !!k;
}
/* Asked after every page is drawn, every face turned and every paper put up.
   The bar is named at once; the page is KEPT in Recent (and on the trail)
   only once it has settled, so a door that passes through the Board on its
   way to a paper leaves one row, not two. */
const DK_SETTLE_MS = 300;
let _dkNoteT = 0;
function deskTabsSync(){
  if (!deskShellOn()) return;
  /* a page standing in the middle belongs to the page that opened it (the middle, 21 Oct 2026) */
  if (typeof window.pdMidStale === 'function') try { window.pdMidStale(); } catch (_){}
  deskBarPaint();
  clearTimeout(_dkNoteT);
  _dkNoteT = setTimeout(() => {
    const k = deskKeyNow();
    if (k && !k.startsWith(DK_SEND)){
      const L = dkTabs(); let t = L.find(x => x.k === k);
      if (t) t.at = Date.now(); else { t = { k, at: Date.now() }; L.push(t); }
      /* ONE ROW PER CONTRACT, two ways to read it (round 7): it remembers
         whether its page or its paper was in front */
      if (k.startsWith('c:')) t.view = (typeof window.bsCardId === 'function' && window.bsCardId() && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'board') ? 'card' : 'paper';
      dkSave(L);
    }
    if (!(k && k.startsWith(DK_SEND))) dkTrailNote(k || ((typeof state !== 'undefined' && state && state.view === 'counter') ? 'home' : null));
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
  /* THE WAITING LETTER IS ONE ROW AWAY (round 11's gaps, third pass — the
     drawing's "Send · MK-0382" tab): first, never kept */
  const sk = dkSendWaiting() ? dkSendNow() : null;
  if (sk) L = [{ k: sk, at: Date.now(), waiting: true }].concat(L.filter(t => t.k !== sk));
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
  if (k.startsWith(DK_SEND)) return _cnT('dk_kind_letter');
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
    const can = deskSheetUp() || deskStepBack(false) || !!deskBackTarget();
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
  if (k.startsWith(DK_SEND)){
    if (dkSendWaiting() && typeof window.pdSendWaitSet === 'function'){ window.pdSendWaitSet(false); deskBarPaint(); return true; }
    return !!dkSendNow();
  }
  if (dkLeavePageThen(() => deskTabOpen(k))) return true;
  if (dkLeaveSendThen(k, () => deskTabOpen(k))) return true;
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
  /* the send screen's page: × is its Cancel, its guard asked */
  if (String(k || '').startsWith(DK_SEND)){ if (typeof window.closeModalGuarded === 'function') window.closeModalGuarded(); else if (typeof closeModal === 'function') closeModal(); return; }
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
function deskGoCounter(){ _dkMenuOpen = false; if (dkLeavePageThen(deskGoCounter)) return; if (dkLeaveSendThen(null, deskGoCounter)) return; if (typeof setView === 'function') setView('counter'); }

/* ---------------- THE COUNTER ---------------- */
/* THREE ROWS IN SIGHT, AS DRAWN (round 23: Jambo's work, then three owed
   rows, then "Show 3 more · a note due today · Baltic Freight's 3 details ·
   Sara's NDA request"); "Show N more" brings the rest, by name */
const CN_ROWS = 3;
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
const _cnToday = () => (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
const _cnFirst = s => String(s || '').trim().split(/\s+/)[0] || '';
/* a name and its English possessive, for the words that say "{whos}" (agPoss) */
const _cnWho = n => ({ who: n, whos: (typeof agPoss === 'function') ? agPoss(n) : n + '\u2019s' });
/* NEEDS YOU, WHOLE (round 23's gaps, 18 Oct 2026: the drawing's list holds
   "a note due today" and "Sara's NDA request" beside each contract's items):
   each contract's owed item (hbNeedsList, the checklist's own reading), a
   note of yours that is due (mineNotesDue, My notes' own — the bell's
   note-due) and a request nobody holds yet (intakeAlertRows, the bell's
   request rows). An approval answered for somebody away carries whom for
   (approvalAnswersFor) and LEADS (round 23 as drawn: "Answer an approval for
   Jonas" above their late redlines, and the lead chip "Jonas's approval"):
   it is a colleague's work held while they are away, which nobody else will
   press; then the urgent; within that, each list's own order. */
function cnRows(){
  const out = cnNeeds().map(x => {
    let fw = null;
    if (x.it.kind === 'approval' && typeof approvalAnswersFor === 'function') try { fw = approvalAnswersFor(x.c); } catch (_){ fw = null; }
    return { k: 'c', kind: x.it.kind, urgent: !!x.it.urgent, x, fw };
  });
  let notes = []; try { notes = (typeof mineNotesDue === 'function') ? (mineNotesDue() || []) : []; } catch (_){ notes = []; }
  const today = _cnToday();
  notes.forEach(n => out.push({ k: 'note', kind: 'mynote', urgent: String(n.reviewBy || '') < today, n }));
  let reqs = []; try { reqs = (typeof intakeAlertRows === 'function') ? (intakeAlertRows() || []) : []; } catch (_){ reqs = []; }
  reqs.forEach(r => out.push({ k: 'req', kind: 'request', urgent: false, r }));
  /* a watch Jambo kept for you that has fired (the bell's 'watch' rows, js/jambopress.js) */
  let wts = []; try { wts = (typeof watchesFired === 'function') ? (watchesFired() || []) : []; } catch (_){ wts = []; }
  wts.forEach(w => out.push({ k: 'watch', kind: 'watch', urgent: false, w }));
  return out.map((y, i) => ({ y, i })).sort((a, b) => (Number(!!b.y.fw) - Number(!!a.y.fw)) || (Number(b.y.urgent) - Number(a.y.urgent)) || (a.i - b.i)).map(o => o.y);
}
/* WHAT WAITS FOR YOU, BY AGENT — the count of Jambo's work Home's row and
   the Board's Jambo's work card both draw (cnWork = hbAgentsData: the pieces
   each agent's pill counts) for anybody else who says it. Jambo's house says
   it on Your desk ("5 waiting for you") and in each room ("1 waiting for
   you"), and those words land on the Board's card (hbOpenAgent, LAND ON IT) —
   one reading, so the house, Home and the Board never disagree (round 23's
   gaps: the house counted its own record and the approvals desk, which the
   card never lists). */
function counterWorkByAgent(){
  const A = cnWork(), by = {};
  (A.rows || []).forEach(r => { if (r && r.k) by[r.k] = Number(r.pill != null ? r.pill : r.n) || 0; });
  return { ready: Number(A.ready) || 0, by };
}
/* A ROW'S DOOR LANDS ON ITS TARGET (LAND ON IT): the page opens, then the one
   lander brings the row named into view and lights it; it presses nothing */
const cnSel = v => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, '\\$&');
function cnLand(sel, gone){ if (typeof landOn === 'function') try { landOn(sel, { missing: _cnT(gone) }); } catch (_){} }
/* the number on "Needs you" is the rows under it: Jambo's work while he has
   prepared any, each owed row, and the admin's one row */
function counterNeedsCount(){ return (cnWork().ready ? 1 : 0) + cnRows().length + ((cnSetup() || cnCompany().length) ? 1 : 0); }

function cnFace(size, cls){ return (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', size, cls) : ''; }
function cnJwRowHtml(A){
  const n = A.ready || 0;
  const who = [...new Set((A.rows || []).map(r => r.who || r.sum).filter(Boolean))].slice(0, 4);
  /* its head says what the drawing says: "· 5 prepared · nothing sent or
     filed until you press" (round 23); the line under it, whose work it is */
  return `<div class="cn-r cn-jw">${''/* no mark in the row (Chambers, as drawn, 20 Oct 2026) */}<div class="cn-w"><b>${_cnE(_cnT('cn_jw'))} <span class="cn-n">· ${_cnE(n ? _cnTn('cn_jw_n', n, { n }) : _cnT('cn_jw_none'))}${n ? ' · ' + _cnE(_cnT('cn_jw_said')) : ''}</span></b><span>${_cnE(n ? who.join(' · ') : _cnT('cn_jw_rest'))}</span></div>${n ? `<button type="button" class="ui-btn ui-btn-sm" data-cn-jw>${_cnE(_cnT('cn_open'))}</button>` : ''}</div>`;
}
/* ---- A ROW OF NEEDS YOU, AS DRAWN (round 23's gaps) ----
   "Answer an approval for Jonas" (for Jonas · away until Friday) / "Power
   purchase agreement · Helio Energy AB · SEK 8.1 M" / Open approval. The
   title says the act, the line the agreement — its name, the party unless the
   title already names it (a salary's job title, as the Pay section reads it),
   the value where an approval or a signature turns on it, and how long it
   has waited; the reference rides the hover. The button opens its page. */
const CN_NEED_GO = { approval: 'cn_need_go_approval', refused: 'cn_need_go_approval', quiet: 'cn_need_go_redlines', review: 'cn_need_go_redlines',
  suggest: 'cn_need_go_redlines', details: 'det_need_verb', look: 'cn_open' };
function cnNeedVerb(kind){
  if (CN_NEED_GO[kind]) return _cnT(CN_NEED_GO[kind]);
  return (typeof INS_NEED_VERB !== 'undefined' && INS_NEED_VERB[kind]) ? _cnT(INS_NEED_VERB[kind]) : _cnT('cn_open');
}
function cnNeedTitle(y){
  const x = y.x, it = x.it;
  if (it.kind === 'approval') return y.fw ? _cnT('cn_need_approval_for', { who: _cnFirst(y.fw.name) }) : _cnT('cn_need_approval');
  if (it.kind === 'details') return _cnTn('cn_need_details', it.n || 1, { n: it.n || 1 });
  /* the act, as drawn ("Decide the renewal") — the renewal piece's own act's
     words (ag_a_renewal), not the checklist's heading */
  if (it.kind === 'renewal') return _cnT('ag_a_renewal');
  return (typeof hbNyWhat === 'function') ? hbNyWhat(x) : '';
}
/* TIME IN WORDS, NEVER AN ABBREVIATION (round 23 as drawn: "waiting 4 days";
   the renewal said "in 40d"): how long a row has waited, else how long until
   its day ("in 40 days"), else its day the way a person says it ("due Friday") */
function cnWhenWords(x){
  const it = x.it;
  if (x.age != null) return x.age > 0 ? _cnT('cn_waiting', { days: (typeof hbNyDays === 'function') ? hbNyDays(x.age) : x.age }) : '';
  if (it.kind === 'renewal' && it.d != null) return it.d <= 0 ? _cnT('ins_days_today') : _cnTn('ins_need_in', it.d, { n: it.d });
  const due = String(it.due || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(due) ? _cnT('cn_due', { day: cnDayWords(due) }) : '';
}
/* a day said the way a person says it: its weekday within the week, else the date */
function cnDayWords(iso){
  const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  const t = new Date(d + 'T00:00:00'), n = new Date(_cnToday() + 'T00:00:00');
  const days = Math.round((t - n) / 864e5);
  try { return (days >= 0 && days < 7) ? t.toLocaleDateString(loc, { weekday: 'long' }) : t.toLocaleDateString(loc, { day: 'numeric', month: 'short' }); } catch (_){ return d; }
}
function cnMayMoney(c){
  if (!c || !(Number(c.value) > 0) || typeof fmtMoneyShortOf !== 'function') return false;
  if (typeof canViewValues === 'function' && !canViewValues()) return false;
  if (typeof isMonetary === 'function' && !isMonetary(c)) return false;
  return !(typeof fxIsPay === 'function' && fxIsPay(c));
}
function cnNeedSub(y, title){
  const x = y.x, c = x.c, it = x.it;
  const bits = [];
  if (c.name) bits.push(_cnE(c.name));
  const pay = typeof fxIsPay === 'function' && fxIsPay(c);
  const party = String((pay && c.metadata && c.metadata.jobTitle) || c.counterparty || '').trim();
  if (party && !String(title).includes(party)) bits.push(_cnE(party));
  if ((it.kind === 'approval' || it.kind === 'sign') && cnMayMoney(c)) bits.push(_cnE(fmtMoneyShortOf(c)));
  const when = cnWhenWords(x);
  if (when) bits.push(it.urgent ? `<span class="cn-late">${_cnE(when)}</span>` : _cnE(when));
  return bits.join(' · ');
}
const _cnPill = (ic, words) => ` <span class="cn-pill">${(typeof icon === 'function') ? icon(ic, 'cn-pill-ic') : ''}${_cnE(words)}</span>`;
function cnNeedRowHtml(y){
  if (y.k === 'note') return cnNoteRowHtml(y);
  if (y.k === 'req') return cnReqRowHtml(y);
  if (y.k === 'watch') return cnWatchRowHtml(y);
  const x = y.x, c = x.c, it = x.it;
  const title = cnNeedTitle(y);
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  const priv = c.folder && typeof streamIsPrivate === 'function' && streamIsPrivate(c.folder)
    ? _cnPill('lock', _cnT('cn_private', { stream: ((typeof FOLDERS !== 'undefined' && FOLDERS[c.folder]) || {}).name || '' })) : '';
  const away = y.fw ? _cnPill('users', y.fw.until ? _cnT('cn_need_away', { who: _cnFirst(y.fw.name), day: cnDayWords(y.fw.until) }) : _cnT('cn_need_for', { who: _cnFirst(y.fw.name) })) : '';
  return `<div class="cn-r" title="${_cnE([ref, c.name].filter(Boolean).join(' · '))}"><div class="cn-w"><b>${_cnE(title)}${away}${priv}</b><span>${cnNeedSub(y, title)}</span></div><button type="button" class="ui-btn ui-btn-sm" data-cn-need="${_cnE(it.kind)}" data-cn-id="${_cnE(c.id)}">${_cnE(cnNeedVerb(it.kind))}</button></div>`;
}
/* a note of yours that is due: only you see it (My notes are private) */
function cnNoteRowHtml(y){
  const n = y.n, late = y.urgent;
  const text = String(n.title || n.body || '').replace(/\s+/g, ' ').trim();
  const c = n.contractId && typeof getContract === 'function' ? getContract(n.contractId) : null;
  const sub = [text ? `“${_cnE(text.length > 90 ? text.slice(0, 89).replace(/\s+\S*$/, '') + '…' : text)}”` : '', c ? _cnE(c.name || '') : '', _cnE(_cnT('cn_need_note_only'))].filter(Boolean).join(' · ');
  return `<div class="cn-r"><div class="cn-w"><b>${_cnE(late ? _cnT('cn_need_note_late', { day: cnDayWords(n.reviewBy) }) : _cnT('cn_need_note'))}</b><span>${sub}</span></div><button type="button" class="ui-btn ui-btn-sm" data-cn-note="${_cnE(n.id)}">${_cnE(_cnT('cn_need_go_note'))}</button></div>`;
}
/* a watch of yours that fired: what happened, what you asked to be told; the press lands on it (watchGo) */
function cnWatchRowHtml(y){
  const w = y.w || {};
  const said = (typeof watchFiredWords === 'function') ? watchFiredWords(w) : '';
  const asked = (typeof watchWords === 'function') ? _cnT('wt_bell_sub', { what: watchWords(w) }) : '';
  return `<div class="cn-r"><div class="cn-w"><b>${_cnE(said)}</b>${asked ? `<span>${_cnE(asked)}</span>` : ''}</div><button type="button" class="ui-btn ui-btn-sm" data-cn-watch="${_cnE(String(w.id || ''))}">${_cnE(_cnT('cn_open'))}</button></div>`;
}
/* a request nobody holds yet (the bell's), opened on Requests */
function cnReqRowHtml(y){
  const r = y.r || {}, who = (r.by && r.by.name) || '';
  const t = Date.parse(String(r.createdAt || '')), age = isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : null;
  const sub = [r.counterparty ? _cnE(r.counterparty) : '', age ? _cnE(_cnT('cn_waiting', { days: (typeof hbNyDays === 'function') ? hbNyDays(age) : age })) : ''].filter(Boolean).join(' · ');
  return `<div class="cn-r" title="${_cnE(String(r.id || ''))}"><div class="cn-w"><b>${_cnE(_cnT('cn_need_request', { ..._cnWho(_cnFirst(who)), title: r.title || '' }))}</b>${sub ? `<span>${sub}</span>` : ''}</div><button type="button" class="ui-btn ui-btn-sm" data-cn-req="${_cnE(String(r.id || ''))}">${_cnE(_cnT('cn_need_go_request'))}</button></div>`;
}
/* WHAT A REQUEST IS FOR, IN A WORD OR THREE ("Sara's NDA request"): the kind
   of agreement its own title names first — "NDA with Kettle & Co" → "NDA",
   "New supply agreement for Baltic" → "supply agreement" — read off the words
   the asker typed, never guessed: a title that names no agreement says
   nothing, and the short name is "Sara's request". */
const CN_REQ_WHAT_RE = /^\s*(?:(?:a|an|the|new|our|ett|en|nytt|ny|vårt|vår)\s+)?((?:(?!(?:the|a|an|this|that|our|their|my|its|your|den|det|vårt|vår|deras|er|review|check|draft|prepare|renew|sign|amend|update|need|needs|help|please|ask|get|make|write|create|send|granska|skriv|förnya|uppdatera|behöver)\s)[\p{L}&'’-]+\s+){0,2}?(?:agreement|contract|nda|non-?disclosure agreement|lease|licen[cs]e|mou|sow|statement of work|addendum|amendment|msa|dpa|sla|\p{L}*avtal|kontrakt|tillägg))(?=\s+(?:with|for|to|between|med|för|till|mellan)\b|\s*[–—:,(]|\s*$)/iu;
function cnReqWhat(r){
  const m = CN_REQ_WHAT_RE.exec(String((r && r.title) || '').replace(/\s+/g, ' '));
  if (!m) return '';
  const w = m[1].trim();
  /* a word the asker capitalised for the sentence is lowered; an acronym keeps its letters */
  return /^\p{Lu}[\p{Ll}'’-]*(\s|$)/u.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w;
}
/* THE SHORT NAME OF A ROW — the lead chip, and the names "Show 3 more" says
   ("a note due today · Baltic Freight's 3 details · Sara's NDA request") */
function cnNeedShort(y){
  if (y.k === 'note') return y.urgent ? _cnT('cn_sh_mynote_late') : _cnT('cn_sh_mynote');
  if (y.k === 'watch') return _cnT('wt_sh');
  if (y.k === 'req'){ const what = cnReqWhat(y.r), who = _cnWho(_cnFirst((y.r && y.r.by && y.r.by.name) || ''));
    return what ? _cnT('cn_sh_request_what', { ...who, what }) : _cnT('cn_sh_request', who); }
  const x = y.x, c = x.c, it = x.it, cp = String(c.counterparty || c.name || '').trim(), n = it.n || 1;
  if (it.kind === 'approval') return y.fw ? _cnT('cn_sh_approval_for', _cnWho(_cnFirst(y.fw.name))) : _cnT('cn_sh_approval', { who: cp });
  if (it.kind === 'quiet') return _cnTn('cn_sh_redlines', n, { ..._cnWho(cp), n });
  if (it.kind === 'details') return _cnTn('cn_sh_details', n, { ..._cnWho(cp), n });
  if (it.kind === 'renewal') return _cnT('cn_sh_renewal', _cnWho(cp));
  if (it.kind === 'sign') return _cnT('cn_sh_sign', { who: cp });
  if (['review', 'look', 'refused', 'join', 'note', 'suggest'].includes(it.kind) && it.who) return _cnT('cn_sh_' + it.kind, _cnWho(_cnFirst(it.who)));
  const w = (typeof hbNyWhat === 'function') ? hbNyWhat(x) : '';
  return w ? w.charAt(0).toLowerCase() + w.slice(1) : '';
}
/* a row's own door, as data attributes: the lead chip presses the same one */
function cnNeedDoorAttrs(y){
  if (y.k === 'note') return `data-cn-note="${_cnE(y.n.id)}"`;
  if (y.k === 'req') return `data-cn-req="${_cnE(String((y.r && y.r.id) || ''))}"`;
  if (y.k === 'watch') return `data-cn-watch="${_cnE(String((y.w && y.w.id) || ''))}"`;
  return `data-cn-need="${_cnE(y.x.it.kind)}" data-cn-id="${_cnE(y.x.c.id)}"`;
}
function cnCompanyRowHtml(R){
  const sub = R.slice(0, 3).map(r => String(r.text || '').trim()).filter(Boolean).join(' · ');
  return `<div class="cn-r cn-co"><span class="cn-co-ic" aria-hidden="true">${(typeof icon === 'function') ? icon('building', 'cn-pill-ic') : ''}</span><div class="cn-w"><b>${_cnE(_cnT('cn_company'))} <span class="cn-n">· ${R.length}</span></b><span title="${_cnE(sub)}">${_cnE(sub)}</span></div><button type="button" class="ui-btn ui-btn-sm" data-cn-co>${_cnE(_cnT('cn_company_go'))}</button></div>`;
}
function cnSetupRowHtml(n){
  return `<div class="cn-r cn-co"><span class="cn-co-ic" aria-hidden="true">${(typeof icon === 'function') ? icon('building', 'cn-pill-ic') : ''}</span><div class="cn-w"><b>${_cnE(_cnTn('hb_setup_left', n, { n }))}</b></div><button type="button" class="ui-btn ui-btn-sm" data-cn-setup>${_cnE(_cnT('cn_open'))}</button></div>`;
}
/* THE CHIPS, AS DRAWN ("Jonas's approval · contracts · calendar · draft a new
   agreement"): what is owed first leads — the first row's short name, its
   press the row's own door — then the three places. All four wear the same
   plain pill (the drawing's; the lead is first, not louder). */
function cnChipsHtml(rows){
  const w = k => _cnT(k);
  const first = (rows || [])[0];
  const lead = first ? cnNeedShort(first) : '';
  return (lead ? `<button type="button" class="cn-chip" data-cn-lead ${cnNeedDoorAttrs(first)}>${_cnE(lead)}</button>` : '')
    + [w('nav_contracts').toLowerCase(), w('ca_w_calendar'), w('ca_wall_draft')].map(word => `<button type="button" class="cn-chip" data-cn-ask="${_cnE(word)}">${_cnE(word)}</button>`).join('');
}
/* THE TWO-ROW CARD's one builder (components.js), read where it is drawn;
   a page loaded without it (a test's one-file world) draws the bare parts */
const _cnJbCard = o => (typeof jamboCardHtml === 'function') ? jamboCardHtml(o) : `${o.field || ''}${o.ctx || ''}${o.send || ''}${o.tail || ''}`;
const _cnJbSend = (a, l, o = {}) => (typeof jamboSendHtml === 'function') ? jamboSendHtml(a, l, o) : `<button type="${o.submit ? 'submit' : 'button'}" ${a || ''} aria-label="${l}" title="${o.title || l}"></button>`;

function counterHtml(){
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const name = String((me && me.name) || '').trim().split(/\s+/)[0] || _cnT('home_greet_there');
  const A = cnWork(), N = cnRows(), R = cnCompany(), S = cnSetup();
  const n = (A.ready ? 1 : 0) + N.length + ((S || R.length) ? 1 : 0);
  const shown = _cnAll ? N : N.slice(0, CN_ROWS);
  const quiet = !N.length && !R.length && !S;
  const rows = cnJwRowHtml(A) + shown.map(cnNeedRowHtml).join('');
  const after = (S ? cnSetupRowHtml(S) : R.length ? cnCompanyRowHtml(R) : '')
    + (quiet ? `<div class="cn-r"><div class="cn-w"><b>${_cnE(_cnT('cn_nothing'))}</b></div></div>` : '');
  /* "Show 3 more · a note due today · Baltic Freight's 3 details · Sara's NDA
     request": what waits behind the press, by name (A CAP IS A FACT) — the
     card's LAST line, as drawn, under the admin's own row */
  const hid = N.slice(CN_ROWS);
  const names = hid.slice(0, 3).map(cnNeedShort).filter(Boolean);
  const said = names.join(' · ') + (hid.length > 3 ? ' · ' + _cnT('cn_and_more', { n: hid.length - 3 }) : '');
  const more = N.length > CN_ROWS ? `<div class="cn-foot"><button type="button" class="ui-link" data-cn-all aria-expanded="${_cnAll}">${_cnE(_cnAll ? _cnT('cn_show_fewer') : _cnTn('cn_show_more', hid.length, { n: hid.length }))}</button>${_cnAll ? '' : `<span class="cn-foot-said">${_cnE(said)}</span>`}</div>` : '';
  const open = quiet ? dkTabs().slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(t => deskTabLabel(t.k)).slice(0, CN_PICK_UP) : [];
  const pick = open.length ? `<section class="cn-card"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('cn_pick_up'))}</span></header>${open.map(t =>
    `<div class="cn-r"><div class="cn-w"><b>${_cnE(deskTabLabel(t.k))}</b></div><button type="button" class="ui-btn ui-btn-sm" data-dk-go="${_cnE(t.k)}">${_cnE(_cnT('cn_open'))}</button></div>`).join('')}</section>` : '';
  _cnSig = cnSig(N, A);
  return `<div class="cn-page" id="cn-page"><div class="cn-in">
    <section class="cn-card cn-ask">${cnFace(26, 'cn-face')}<h1>${_cnE(_cnT('cn_hello', { name }))}</h1>
      <div class="cn-wrap">${''/* THE TWO-ROW CARD (owner picked it, 20 Oct 2026): the one builder */}${_cnJbCard({ cls: 'cn-card-box', field: `<textarea id="cn-q" rows="1" autocomplete="off" spellcheck="false" placeholder="${_cnE(_cnT('cn_box_ph'))}" aria-label="${_cnE(_cnT('cn_box_label'))}"></textarea>`, send: _cnJbSend('data-cn-send', _cnT('cn_ask')) })}<div class="ca-pop cn-pop" id="cn-pop" hidden></div></div>
      <div class="cn-chips" id="cn-chips">${cnChipsHtml(N)}</div></section>
    <section class="cn-card cn-needs" id="cn-needs"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('hb_ny_title'))}</span><span class="cn-cnt">${n}</span></header>${rows}${after}${more}</section>
    ${pick}</div></div>`;
}
/* what the card was drawn from, so a list that arrives later redraws it once */
let _cnSig = '';
/* THE BOX WRAPS: a long ask wraps onto new lines and the box grows with it,
   up to five lines, then scrolls; emptied, it is one line again */
function counterBoxFit(q){
  if (!q) return;
  /* the two-row card's one grower: up to six lines, then a thin bar */
  if (typeof jamboCardGrow === 'function'){ jamboCardGrow(q); if (!q.value) q.style.height = ''; return; }
  q.style.height = 'auto';
  q.style.height = q.value ? Math.min(q.scrollHeight, 120) + 'px' : '';
}
function cnSig(N, A){
  return [(A && A.ready) || 0, (A && A.rows || []).map(r => (r.items || []).map(i => i.key).join(',')).join(';'), N.map(y => y.k + ':' + y.kind + ':' + (y.x ? y.x.c.id : y.n ? y.n.id : y.r ? y.r.id : y.w ? y.w.id : '')).join(',')].join('|');
}
function renderCounter(){
  const host = document.getElementById('content'); if (!host) return;
  _cnPop = null;
  host.innerHTML = counterHtml();
  /* the box takes the keys straight away where there is a keyboard to type with */
  let fine = false; try { fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); } catch (_){ fine = false; }
  if (fine) setTimeout(() => { const q = document.getElementById('cn-q'); if (q && state.view === 'counter') try { q.focus({ preventScroll: true }); } catch (_){} }, 0);
  /* WHEN SOMETHING LOADS, SOMETHING MOVES: a note due or a request that
     arrives after the first paint is drawn when it comes */
  if (typeof mineLoad === 'function') try { mineLoad().then(counterFollow, () => {}); } catch (_){}
}
/* the list's own data moved (a save, a new item): only the Needs card is drawn again */
function counterRepaint(){
  if (typeof state === 'undefined' || !state || state.view !== 'counter') return;
  const card = document.getElementById('cn-needs'); if (!card) return;
  const t = document.createElement('div'); t.innerHTML = counterHtml();
  const fresh = t.querySelector('#cn-needs'); if (fresh) card.replaceWith(fresh);
  const chips = document.getElementById('cn-chips'), fc = t.querySelector('#cn-chips');
  if (chips && fc && chips.innerHTML !== fc.innerHTML) chips.innerHTML = fc.innerHTML;
}
/* asked after the side's counts are worked out (updateSidebarCounts) and when
   My notes arrive: the Counter is drawn again only where what it lists moved */
function counterFollow(){
  if (typeof state === 'undefined' || !state || state.view !== 'counter' || !document.getElementById('cn-needs')) return;
  let sig = ''; try { sig = cnSig(cnRows(), cnWork()); } catch (_){ return; }
  if (sig !== _cnSig) counterRepaint();
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
    if ((el = t.closest('[data-cn-send]'))){ const q = document.getElementById('cn-q'); if (q){ const v = q.value; q.value = ''; counterBoxFit(q); counterPopClose(); counterAsk(v); } return; }
    if ((el = t.closest('[data-cn-ask]'))){ counterAsk(el.getAttribute('data-cn-ask')); return; }
    if ((el = t.closest('[data-cn-jw]'))){ if (typeof hbOpenAgent === 'function') hbOpenAgent(); return; }
    /* a note of yours and a request nobody holds: their own pages, landing ON
       the row (LAND ON IT — My notes' row, Requests' row), lit */
    if ((el = t.closest('[data-cn-note]'))){ const id = el.getAttribute('data-cn-note'); if (typeof myNotesOpen === 'function') myNotesOpen(id); cnLand('[data-mn-row="' + cnSel(id) + '"]', 'cn_land_note_gone'); return; }
    if ((el = t.closest('[data-cn-watch]'))){ if (typeof watchGo === 'function') watchGo(el.getAttribute('data-cn-watch')); return; }
    if ((el = t.closest('[data-cn-req]'))){ const id = el.getAttribute('data-cn-req'); if (typeof intakeGoTo === 'function') intakeGoTo(id); cnLand('[data-ik-row="' + cnSel(id) + '"]', 'cn_land_req_gone'); return; }
    if ((el = t.closest('[data-cn-need]'))){ if (typeof hbNeedsPress === 'function') hbNeedsPress(el.getAttribute('data-cn-need'), el.getAttribute('data-cn-id')); return; }
    if (t.closest('[data-cn-setup]')){ if (typeof hbSetupGo === 'function') hbSetupGo(); return; }
    if ((el = t.closest('[data-cn-co]'))){ if (typeof openSettingsAt === 'function') openSettingsAt('company'); return; }
    if ((el = t.closest('[data-cn-all]'))){ _cnAll = !_cnAll; counterRepaint(); }
  });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'cn-q'){ counterBoxFit(e.target); counterPopRead(e.target); } });
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && t.id === 'cn-q'){
      if (_cnPop && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){
        e.preventDefault(); const n = _cnPop.rows.length;
        _cnPop.on = (_cnPop.on + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; counterPopPaint(); return;
      }
      if (e.key === 'Enter'){ e.preventDefault(); if (_cnPop){ counterPopTake(_cnPop.on); return; } const v = t.value; t.value = ''; counterBoxFit(t); counterAsk(v); return; }
      if (e.key === 'Escape'){ if (_cnPop) counterPopClose(); else { t.value = ''; counterBoxFit(t); } }
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

Object.assign(window, { deskStepBack, counterWorkByAgent, cnRows, cnNeedShort, cnWhenWords, cnReqWhat, CN_REQ_WHAT_RE, counterFollow, cnLand,
  deskShellOn, DK_KEY, DK_RECENT, DK_SETTLE_MS, deskKeyNow, deskTabLabel, deskPageName, deskSheetUp, deskSheetFrom, deskSheetBackTo, deskTabsSync, deskRecentRows, deskRecentHtml, deskBarPaint, deskRecentToggle, deskBackTarget, deskGoBack, deskTabOpen, deskTabClose, deskGoCounter,
  CN_ROWS, renderCounter, counterHtml, counterRepaint, counterAsk, counterNeedsCount, counterPopRead, counterPopClose });
