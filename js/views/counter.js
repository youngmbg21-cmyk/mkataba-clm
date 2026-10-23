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
/* THREE ROWS OF EACH GROUP IN SIGHT (Round A, the one desk): "Show all N"
   lands on the Board, where the whole of it stands */
const CN_ROWS = 3;
const CN_POP_MAX = 40;      // every place; the list scrolls, and typing narrows it
const CN_PICK_UP = 3;       // open pages offered on a quiet day
let _cnPop = null;          // { rows, on }

function cnNeeds(){ try { return (typeof hbNeedsList === 'function') ? (hbNeedsList() || []) : []; } catch (_){ return []; } }
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
/* WHAT WAITS FOR YOU, BY AGENT — the Jambo rows of the one desk (ndRead),
   counted by agent: one per piece, the rows the Board's "Jambo prepared" tab
   lists. Jambo's house says it on Your desk ("5 waiting for you") and in each
   room, and those words land on the Board's card (hbOpenAgent, LAND ON IT) —
   one reading, so the house, Home and the Board never disagree. */
function counterWorkByAgent(){
  const by = {}; let ready = 0;
  try { ndRead().jambo.forEach(r => { by[r.agent] = (by[r.agent] || 0) + 1; ready++; }); } catch (_){ /* no reading, nothing said */ }
  return { ready, by };
}
/* A ROW'S DOOR LANDS ON ITS TARGET (LAND ON IT): the page opens, then the one
   lander brings the row named into view and lights it; it presses nothing */
const cnSel = v => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, '\\$&');
function cnLand(sel, gone){ if (typeof landOn === 'function') try { landOn(sel, { missing: _cnT(gone) }); } catch (_){} }
/* the number on "Needs you" is the things in the one reading (ndRead): Jambo's
   prepared pieces, each owed thing (a bundle counts its contracts) and the
   admin's one row */
function counterNeedsCount(){ try { return ndRead().n; } catch (_){ return 0; } }

function cnFace(size, cls){ return (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', size, cls) : ''; }
/* A ROW'S TITLE SAYS THE ACT ("Answer an approval for Jonas"); the rest of
   the row is the one desk's (ndParts) */
function cnNeedTitle(y){
  const x = y.x, it = x.it;
  if (it.kind === 'approval') return y.fw ? _cnT('cn_need_approval_for', { who: _cnFirst(y.fw.name) }) : _cnT('cn_need_approval');
  if (it.kind === 'details') return _cnTn('cn_need_details', it.n || 1, { n: it.n || 1 });
  /* the act, as drawn ("Decide the renewal") — the renewal piece's own act's
     words (ag_a_renewal), not the checklist's heading */
  if (it.kind === 'renewal') return _cnT('ag_a_renewal');
  return (typeof hbNyWhat === 'function') ? hbNyWhat(x) : '';
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
const _cnPill = (ic, words) => ` <span class="cn-pill">${(typeof icon === 'function') ? icon(ic, 'cn-pill-ic') : ''}${_cnE(words)}</span>`;
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
/* THE SHORT NAME OF A ROW — the lead chip ("Jonas's approval") */
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
/* ============================================================
   THE ONE DESK — NEEDS YOU, ONE READING (Round A; the owner picked "The
   Legora Way" by name, 22 Oct 2026: artifact 4ULFepJn9VYKh98XgJjnTA, pictures
   QyvWJ1giHgyhWKuFF9bhG5)
   ============================================================
   ONE list of what waits, and whose move it is: what Jambo has prepared
   (the agents' own ready pieces, agentsData) and what only you can do (Home's
   own rows, cnRows, and the admin's one row). A waiting thing and the piece
   Jambo prepared for it are ONE row, the piece's (ND_MERGE): their redlines
   and his drafted answer, a renewal and its memo, a new contract's details
   and his read, a request and the paper he found. More than three contracts
   owing details read as one row (ND_BUNDLE_MIN). It reads, never writes, and
   is walked once per task (_ndMemo, as hbNeedsList).
   TWO DRAWINGS OF IT, ONE READING: Home draws the top three of each group
   (ndHomeHtml) and "Show all N" lands on the Board, where the whole of it
   stands under Your book (ndBoardHtml, inside hbPrepHtml's card). Each row's
   words come from ONE builder (ndParts), so the two never say different
   things; every button is ONE word on ONE width and presses a door that
   already exists. */
const ND_PAGE = 12;
const ND_BUNDLE_MIN = 4;
const ND_MERGE = { answer: ['quiet'], renewal: ['renewal'], notice: ['renewal'], read: ['details'] };
const ND_KIND_OF = { approval: 'approval', refused: 'approval', sign: 'sign', quiet: 'review', review: 'review', suggest: 'review', look: 'review', details: 'details', renewal: 'renewal' };
const ND_KINDS = ['approval', 'sign', 'review', 'details', 'renewal', 'duty', 'ask', 'jambo'];
const ND_BTN = { approval: 'decide', refused: 'decide', renewal: 'decide', sign: 'sign', quiet: 'review', review: 'review', suggest: 'review', look: 'review', details: 'fill', join: 'answer', request: 'answer' };
/* the kinds whose `days` count forward to a day, not how long they waited */
const ND_NOT_WAITED = ['renewal', 'notice', 'soon', 'soon-sign', 'week', 'ours'];
let _ndMemo = null;
/* the Board card's own choices, for the sitting; a refresh keeps them through the Board's place (ndPlace) */
let _nd = { tab: 'all', kind: 'any', q: '', more: 0 };

function ndPieces(){
  let D = null; try { D = (typeof agentsData === 'function') ? agentsData() : null; } catch (_){ D = null; }
  if (!D || !D.agents) return [];
  const keys = Array.isArray(window.AG_KEYS) ? AG_KEYS : [];
  const off = Array.isArray(window.HB_OFF_BOARD) ? HB_OFF_BOARD : ['approve', 'ours'];
  const out = [];
  keys.forEach(k => { if (off.includes(k) || !D.agents[k]) return;
    (D.agents[k].ready || []).forEach(it => { if (it && it.key) out.push({ it, agent: it.agent || k }); }); });
  return out;
}
/* THE BELL'S OWN SIGNALS, SPLIT IN TWO (the rest of Round A: the owner
   picked "The Legora Way" for the bell, 23 Oct 2026, artifact
   WPfQyLgvpcjbTswNtGzwth). buildAlerts stays the one sweep of what the bell
   hears. What asks nothing of you is NEWS (ND_NEWS): drawn under the bell's
   News tab, never counted. Everything else is work: work the one desk already
   holds is not drawn twice (the row of that kind on that contract, ND_AL_ROWS,
   or the piece Jambo prepared for it, ND_AL_PIECES), and the rest joins the
   one desk as a row of its own ('al'), so nothing the bell rang about is lost
   now that it counts what Home counts. */
const ND_NEWS = ['review-out', 'ap-cleared', 'gift', 'settings-answer', 'finding-sent', 'finding-answer', 'stream-self'];
const ND_AL_ROWS = { 'review-mine': ['review'], suggest: ['suggest'], look: ['look'], details: ['details'], 'note-mine': ['note'], approval: ['approval', 'refused'], 'ap-refused': ['refused'], 'desk-quiet': ['quiet'], 'desk-join': ['join'], negotiation: ['quiet'], renewal: ['renewal'], signature: ['sign'] };
const ND_AL_PIECES = { negotiation: ['answer'], 'desk-quiet': ['answer'], renewal: ['renewal', 'notice'], details: ['read'] };
/* the admin's own list (stNeedsAll) already holds these three: the setup or company row stands for them */
const ND_AL_ADMIN = ['settings-ask', 'access-review', 'email-off'];
const ND_AL_KIND = { negotiation: 'review', 'review-back': 'review', 'suggest-back': 'review', 'cp-ready': 'sign', 'cp-accepted': 'sign', handover: 'sign', signature: 'sign', link: 'sign', mailroom: 'details', renewal: 'renewal', obligation: 'duty', 'cert-lapsed': 'duty', approval: 'approval', 'ap-refused': 'approval', 'desk-quiet': 'review', 'review-mine': 'review', details: 'details' };
const ND_AL_BTN = { negotiation: 'review', 'review-back': 'review', 'suggest-back': 'review', 'desk-quiet': 'review', 'review-mine': 'review', 'cp-ready': 'sign', 'cp-accepted': 'sign', signature: 'sign', approval: 'decide', 'ap-refused': 'decide', renewal: 'decide', mailroom: 'look', details: 'fill', 'finding-ask': 'answer', 'settings-ask': 'answer', 'desk-join': 'answer' };
function ndIsNews(a){ return !!a && (ND_NEWS.includes(a.kind) || (a.kind === 'watch' && !a.fired)); }
function ndAlerts(){
  let L = []; try { L = (typeof buildAlerts === 'function') ? (buildAlerts() || []) : []; } catch (_){ L = []; }
  return { work: L.filter(a => a && !ndIsNews(a)), news: L.filter(ndIsNews) };
}
const _ndCid = it => (it && (it.cid || (it.c && it.c.id))) || '';
function ndAlCovered(a, rows, P, admin){
  /* the same sources Home's own rows read: a note due, a request nobody holds, a watch Jambo kept */
  if (a.kind === 'note-due' || (a.kind === 'request' && !a.lane) || (a.kind === 'watch' && a.fired)) return true;
  if (ND_AL_ADMIN.includes(a.kind)) return admin;
  const cid = String(a.id || '');
  if (a.kind === 'request' && a.lane) return P.some(p => p.it.kind === 'lane' && p.it.r && String(p.it.r.id) === String(a.rid));
  if (!cid) return false;
  const kinds = ND_AL_ROWS[a.kind] || [], pk = ND_AL_PIECES[a.kind] || [];
  if (rows.some(y => y.k === 'c' && String(y.x.c.id) === cid && kinds.includes(y.x.it.kind))) return true;
  if (P.some(p => String(_ndCid(p.it)) === cid && (pk.includes(p.it.kind) || (a.kind === 'link' && p.agent === 'link')))) return true;
  /* a duty or an ending this week is in the week's piece (agWeekItems, the Calendar's own reading) */
  const wk = P.find(p => p.it.kind === 'week'), evs = (wk && Array.isArray(wk.it.evs)) ? wk.it.evs : [];
  if (a.kind === 'obligation' && a.obId) return evs.some(e => e && e.type === 'obligation' && String(e.obId) === String(a.obId));
  if (a.kind === 'renewal' && a.ends) return evs.some(e => e && e.type === 'expiry' && String(e.cid) === cid);
  return false;
}
const _ndHash = t => { let h = 0; const x = String(t || ''); for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const ndAlKey = a => 'al:' + a.kind + ':' + (a.id || '') + ':' + _ndHash(a.text);
const _ndAge = iso => { const t = Date.parse(String(iso || '')); return isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : null; };
function ndAgeOf(y){
  if (y.k === 'c') return y.x && y.x.age != null ? y.x.age : null;
  if (y.k === 'req') return _ndAge(y.r && y.r.createdAt);
  return null;
}
function ndPieceAge(it){
  if (!it || ND_NOT_WAITED.includes(it.kind)) return null;
  const d = Number(it.days); return isFinite(d) && d >= 0 ? d : null;
}
function ndKindOf(y){ return y.k === 'c' ? (ND_KIND_OF[y.x.it.kind] || 'ask') : 'ask'; }
function ndRead(){
  if (_ndMemo) return _ndMemo;
  const P = ndPieces();
  const rows = cnRows();
  /* the rows a piece stands for: its row carries their lateness and their wait */
  const coverOf = it => {
    const cid = it.cid || (it.c && it.c.id), ks = ND_MERGE[it.kind] || [];
    const rq = (it.kind === 'request' || it.kind === 'lane') && it.r && it.r.id;
    return rows.filter(y => (y.k === 'c' && cid && y.x.c.id === cid && ks.includes(y.x.it.kind)) || (rq && y.k === 'req' && y.r && y.r.id === rq));
  };
  P.forEach(p => { p.cov = coverOf(p.it); });
  const covered = new Set(P.flatMap(p => p.cov));
  const Y = rows.filter(y => !covered.has(y));
  const det = Y.filter(y => y.k === 'c' && y.x.it.kind === 'details');
  const bundle = det.length >= ND_BUNDLE_MIN;
  const ages = L => L.map(ndAgeOf).filter(a => a != null);
  const you = [];
  let bundled = false;
  Y.forEach(y => {
    if (bundle && y.k === 'c' && y.x.it.kind === 'details'){
      if (bundled) return; bundled = true;
      const a = ages(det);
      you.push({ g: 'you', key: 'b:details', kind: 'details', bundle: det, n: det.length, late: det.filter(d => d.urgent).length, age: a.length ? Math.max(...a) : null });
      return;
    }
    const id = y.k === 'c' ? y.x.c.id + ':' + y.x.it.kind : y.k === 'note' ? y.n.id : y.k === 'req' ? (y.r && y.r.id) : (y.w && y.w.id);
    you.push({ g: 'you', key: y.k + ':' + id, kind: ndKindOf(y), y, n: 1, late: y.urgent ? 1 : 0, age: ndAgeOf(y) });
  });
  const S = cnSetup(), R = cnCompany();
  const AL = ndAlerts(), seen = new Set();
  AL.work.forEach(a => { if (ndAlCovered(a, rows, P, !!(S || R.length))) return;
    const key = ndAlKey(a); if (seen.has(key)) return; seen.add(key);
    you.push({ g: 'you', key, kind: ND_AL_KIND[a.kind] || 'ask', al: a, n: 1, late: a.late ? 1 : 0, age: null }); });
  if (S) you.push({ g: 'you', key: 'setup', kind: 'ask', setup: S, n: 1, late: 0, age: null });
  else if (R.length) you.push({ g: 'you', key: 'company', kind: 'ask', company: R, n: 1, late: 0, age: null });
  const tone = it => it.tone === 'ruby' ? 2 : it.tone === 'amber' ? 1 : 0;
  const jambo = P.map(({ it, agent, cov }, i) => {
    const a = [ndPieceAge(it)].concat(ages(cov)).filter(x => x != null);
    return { g: 'jambo', key: 'p:' + it.key, kind: 'jambo', it, agent, n: 1, late: (it.tone === 'ruby' || cov.some(y => y.urgent)) ? 1 : 0, age: a.length ? Math.max(...a) : null, i };
  }).sort((a, b) => (b.late - a.late) || (tone(b.it) - tone(a.it)) || (a.i - b.i));
  const all = jambo.concat(you);
  const A = all.map(r => r.age).filter(a => a != null);
  const D = { jambo, you, n: all.reduce((s, r) => s + r.n, 0), late: all.reduce((s, r) => s + r.late, 0), oldest: A.length ? Math.max(...A) : null, news: AL.news };
  _ndMemo = D;
  setTimeout(() => { _ndMemo = null; }, 0);
  return D;
}
const ndThings = L => (L || []).reduce((s, r) => s + r.n, 0);
/* "2 late · the oldest has waited 8 days" — said only where there is something to say */
function ndSumWords(D){
  const days = n => (typeof hbNyDays === 'function') ? hbNyDays(n) : String(n);
  return [D.late ? _cnTn('nd_late', D.late, { n: D.late }) : '', D.oldest ? _cnT('nd_oldest', { days: days(D.oldest) }) : ''].filter(Boolean).join(' · ');
}
function ndStepOf(r){
  const def = (window.AG_DEF && AG_DEF[r.agent]) || null;
  return def && Array.isArray(def.steps) && def.review != null ? { n: def.review + 1, of: def.steps.length } : null;
}
const _ndCall = (fn, it, d) => { try { return (typeof window[fn] === 'function') ? window[fn](it) : d; } catch (_){ return d; } };
const _ndText = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
/* WHAT A ROW SAYS — the one builder both drawings read: its title, the
   agreement, who or what asked, how long it has waited, its one-word button
   and the door it presses (attrs: the door's own data attribute). */
function ndParts(r){
  const P = { title: '', deal: '', who: '', when: '', late: !!r.late, btn: 'open', attrs: '', step: null, read: '', ref: '', line: '', tag: '', pills: '', priv: '' };
  const days = n => (typeof hbNyDays === 'function') ? hbNyDays(n) : String(n);
  if (r.g === 'jambo'){
    const it = r.it, c = it.c || null;
    const parts = _ndCall('agCardParts', it, {}) || {};
    P.title = _ndCall('agPieceTitle', it, '') || _ndCall('agPanelTitle', it, '');
    /* a piece about no one contract says its own sum there ("8 dates · 3 duties") */
    P.deal = c ? [c.name, c.counterparty].filter(Boolean).join(' · ') : (it.r && it.r.title) || parts.sum || _ndText(_ndCall('agPieceRefHtml', it, ''));
    P.step = ndStepOf(r);
    P.who = P.step ? _cnT('nd_who_jambo', P.step) : _cnT('nd_read');
    /* a chase says how late, a renewal how long until its day, the rest how long they waited */
    const d = Number(it.days);
    P.when = (it.kind === 'chase' || it.kind === 'chase-firm') ? String(parts.urg || '').split(' · ')[0]
      : (it.kind === 'renewal' || it.kind === 'notice') && isFinite(d) ? (d <= 0 ? String(parts.urg || '').split(' · ')[0] : _cnTn('ins_need_in', d, { n: d }))
      : r.age != null ? days(r.age) : String(parts.urg || '').split(' · ')[0];
    P.read = _cnT('nd_read_' + r.agent);
    P.ref = _ndCall('agPieceRefHtml', it, '');
    P.line = _ndCall('agPieceLine', it, '');
    P.btn = 'look';
    P.attrs = `data-nd-look="${_cnE(it.key)}"`;
    return P;
  }
  if (r.bundle){
    const names = [...new Set(r.bundle.map(y => String(y.x.c.counterparty || y.x.c.name || '').trim()).filter(Boolean))];
    P.title = _cnTn('nd_bundle_details', r.n, { n: r.n });
    P.deal = names.slice(0, 3).join(' · ') + (names.length > 3 ? ' · ' + _cnT('nd_and_more', { n: names.length - 3 }) : '');
    P.when = r.age != null ? days(r.age) : '';
    P.tag = _cnT('nd_bundle_tag', { n: r.n });
    P.btn = 'fill'; P.attrs = 'data-nd-bundle="details"';
    return P;
  }
  if (r.al){
    /* a bell signal of its own: its words, its contract, its own door (a.go) */
    const a = r.al, c = (a.id && typeof getContract === 'function') ? getContract(a.id) : null;
    P.title = String(a.text || '');
    P.deal = c ? [c.name, c.counterparty].filter(Boolean).join(' · ') : String(a.sub || a.name || '');
    P.who = c ? String(a.sub || '') : '';
    P.ref = (c && typeof refHtml === 'function') ? refHtml(c) : '';
    P.btn = ND_AL_BTN[a.kind] || 'open';
    P.attrs = `data-nd-al="${_cnE(r.key)}"`;
    return P;
  }
  if (r.setup){ P.title = _cnTn('hb_setup_left', r.setup, { n: r.setup }); P.attrs = 'data-cn-setup'; return P; }
  if (r.company){
    P.title = _cnT('cn_company') + ' · ' + r.company.length;
    P.deal = r.company.slice(0, 3).map(x => String(x.text || '').trim()).filter(Boolean).join(' · ');
    P.attrs = 'data-cn-co'; return P;
  }
  const y = r.y;
  P.attrs = cnNeedDoorAttrs(y);
  if (y.k === 'note'){
    const n = y.n, text = String(n.title || n.body || '').replace(/\s+/g, ' ').trim();
    P.title = y.urgent ? _cnT('cn_need_note_late', { day: cnDayWords(n.reviewBy) }) : _cnT('cn_need_note');
    P.deal = text ? '“' + (text.length > 90 ? text.slice(0, 89).replace(/\s+\S*$/, '') + '…' : text) + '”' : '';
    P.who = _cnT('cn_need_note_only');
    P.when = y.urgent ? '' : _cnT('ins_days_today');
    return P;
  }
  if (y.k === 'req'){
    const R = y.r || {}, who = (R.by && R.by.name) || '';
    P.title = _cnT('cn_need_request', { ..._cnWho(_cnFirst(who)), title: R.title || '' });
    P.deal = R.counterparty || '';
    P.who = who;
    P.when = r.age != null ? days(r.age) : '';
    P.btn = 'answer';
    return P;
  }
  if (y.k === 'watch'){
    const w = y.w || {};
    P.title = (typeof watchFiredWords === 'function') ? watchFiredWords(w) : '';
    P.deal = (typeof watchWords === 'function') ? _cnT('wt_bell_sub', { what: watchWords(w) }) : '';
    return P;
  }
  const x = y.x, c = x.c, it = x.it;
  P.title = cnNeedTitle(y);
  const pay = typeof fxIsPay === 'function' && fxIsPay(c);
  const party = String((pay && c.metadata && c.metadata.jobTitle) || c.counterparty || '').trim();
  P.deal = [c.name, party && !String(P.title).includes(party) ? party : '', (it.kind === 'approval' || it.kind === 'sign') && cnMayMoney(c) ? fmtMoneyShortOf(c) : ''].filter(Boolean).join(' · ');
  /* a colleague's hand-off carries their note first (the bell's own row did: "A pass is a hand-off") */
  if (it.kind === 'look' && it.note) P.deal = '\u201c' + String(it.note) + '\u201d · ' + P.deal;
  P.who = y.fw ? _cnT('cn_need_for', { who: _cnFirst(y.fw.name) }) : String(it.who || '');
  if (x.age != null) P.when = days(x.age);
  else if (it.kind === 'renewal' && it.d != null) P.when = it.d <= 0 ? _cnT('ins_days_today') : _cnTn('ins_need_in', it.d, { n: it.d });
  else { const due = String(it.due || '').slice(0, 10); P.when = /^\d{4}-\d{2}-\d{2}$/.test(due) ? _cnT('cn_due', { day: cnDayWords(due) }) : ''; }
  P.btn = ND_BTN[it.kind] || 'open';
  const priv = c.folder && typeof streamIsPrivate === 'function' && streamIsPrivate(c.folder)
    ? _cnPill('lock', _cnT('cn_private', { stream: ((typeof FOLDERS !== 'undefined' && FOLDERS[c.folder]) || {}).name || '' })) : '';
  const away = y.fw ? _cnPill('users', y.fw.until ? _cnT('cn_need_away', { who: _cnFirst(y.fw.name), day: cnDayWords(y.fw.until) }) : _cnT('cn_need_for', { who: _cnFirst(y.fw.name) })) : '';
  P.pills = away + priv; P.priv = priv;
  /* the contract's number in its one dress (refHtml) — the owner's "there is no contract number in the card", 8 Oct 2026 */
  P.ref = (typeof refHtml === 'function') ? refHtml(c) : _cnE((typeof contractRef === 'function') ? contractRef(c) : c.id);
  return P;
}
const _ndBtnHtml = (P, attrs) => `<button type="button" class="ui-btn ui-btn-sm nd-btn" ${attrs != null ? attrs : P.attrs}>${_cnE(_cnT('nd_btn_' + P.btn))}</button>`;
const _ndStepHtml = P => P.step ? `<span class="nd-step" title="${_cnE(_cnT('nd_step_title', P.step))}">${_cnE(_cnT('nd_step', P.step))}</span>` : '';
const _ndTagHtml = P => P.tag ? `<span class="nd-tag">${_cnE(P.tag)}</span>` : '';

/* ---- HOME: THE TOP THREE OF EACH GROUP, EACH ROW TWO LINES ----
   Jambo's work first (his rows say what he read), then your move; a group
   holding more than three says "Show all N", which lands on the Board. */
function ndHomeRowHtml(r){
  const P = ndParts(r);
  const sub = r.g === 'jambo'
    ? `<i class="nd-read">${_cnE(_cnT('nd_read'))}</i> ${_cnE(P.read)}${P.ref ? ' · ' + P.ref : ''}`
    : _cnE(P.deal);
  const hover = r.g === 'jambo' ? P.line : [_ndText(P.ref), P.deal].filter(Boolean).join(' · ');
  return `<div class="cn-r nd-r" data-nd-row="${_cnE(r.key)}"${hover ? ` title="${_cnE(hover)}"` : ''}><div class="cn-w"><b><span class="nd-t">${_cnE(P.title)}</span>${_ndStepHtml(P)}${_ndTagHtml(P)}${P.pills}</b><span>${sub}</span></div>`
    + `<span class="nd-when${P.late ? ' cn-late' : ''}">${_cnE(P.when)}</span>${_ndBtnHtml(P)}</div>`;
}
function ndHomeHtml(D){
  const group = (g, L) => {
    if (!L.length) return '';
    const n = ndThings(L);
    const all = L.length > CN_ROWS ? `<button type="button" class="ui-link nd-all" data-nd-all="${g}">${_cnE(_cnT('cn_show_all', { n }))}</button>` : '';
    return `<div class="nd-g" data-nd-g="${g}"><span class="nd-g-t">${_cnE(_cnT('nd_g_' + g))}</span><span class="cn-n">· ${n}</span>${all}</div>${L.slice(0, CN_ROWS).map(ndHomeRowHtml).join('')}`;
  };
  return group('jambo', D.jambo) + group('you', D.you);
}

/* ---- THE BELL'S PANEL: ALL OF IT, IN HOME'S OWN ROWS ----
   The Alerts panel's Needs you tab (alertsPanelHtml, js/app.js): how many are
   late and how long the oldest has waited, then both groups whole, every row
   Home's own (ndHomeRowHtml) — no "Show all": the panel scrolls. */
function ndPanelHtml(D){
  const group = (g, L) => L.length ? `<div class="nd-g" data-nd-g="${g}"><span class="nd-g-t">${_cnE(_cnT('nd_g_' + g))}</span><span class="cn-n">· ${ndThings(L)}</span></div>${L.map(ndHomeRowHtml).join('')}` : '';
  const sum = ndSumWords(D);
  return (sum ? `<div class="nd-pan-sum">${_cnE(sum)}</div>` : '') + group('jambo', D.jambo) + group('you', D.you);
}

/* ---- THE BOARD: ALL OF IT, UNDER YOUR BOOK ----
   Tabs (All · Your move · Jambo prepared), the kinds there are (a kind with
   nothing in the tab is not listed), a find box, five columns, twelve rows at
   a time. Jambo's rows open his piece IN PLACE under the row (Look, the
   piece's own body and acts: opts.look); every other row presses its door. */
function ndKindsOf(L){
  const by = {}; L.forEach(r => { by[r.kind] = (by[r.kind] || 0) + r.n; });
  return ND_KINDS.filter(k => by[k]).map(k => ({ k, n: by[k] }));
}
/* the Board's own share of the reading: a brand-new workspace's "Finish setting up" row stays Home's — the empty
   Board stands its own setup door (hbSetupDoorHtml), never a second one */
function ndOnBoard(D){ const you = D.you.filter(r => !r.setup); return { jambo: D.jambo, you, n: ndThings(D.jambo) + ndThings(you) }; }
function ndInTab(D){ const B = ndOnBoard(D); return _nd.tab === 'jambo' ? B.jambo : _nd.tab === 'you' ? B.you : B.jambo.concat(B.you); }
function ndBoardList(D){
  let L = ndInTab(D);
  if (_nd.kind !== 'any') L = L.filter(r => r.kind === _nd.kind);
  const q = String(_nd.q || '').trim().toLowerCase();
  if (q) L = L.filter(r => { const P = ndParts(r); return [P.title, P.deal, P.who, _ndText(P.ref)].join(' ').toLowerCase().includes(q); });
  /* All: the late first, then Jambo's, then yours — each in its own order */
  if (_nd.tab === 'all') L = L.map((r, i) => ({ r, i })).sort((a, b) => (Number(!!b.r.late) - Number(!!a.r.late)) || (a.i - b.i)).map(o => o.r);
  return L;
}
function ndBoardRowHtml(r, opts){
  const P = ndParts(r);
  const piece = r.g === 'jambo';
  const look = piece && opts && typeof opts.look === 'function' ? opts.look(r.it) : '';
  const btn = piece
    ? `<button type="button" class="ui-btn ui-btn-sm nd-btn${look ? ' is-on' : ''}" data-hb-ag-look="${_cnE(r.it.key)}" aria-expanded="${!!look}">${_cnE(_cnT('nd_btn_look'))}</button>`
    : _ndBtnHtml(P);
  return `<div class="nd-br${look ? ' is-look' : ''}" data-nd-row="${_cnE(r.key)}"${piece ? ` data-hb-ag-item="${_cnE(r.it.key)}" data-nd-agent="${_cnE(r.agent)}"` : ''}>`
    + `<span class="nd-c nd-c-what"${piece && P.line ? ` title="${_cnE(P.line)}"` : ''}><b>${_cnE(P.title)}</b>${_ndTagHtml(P)}${P.priv}</span>`
    + `<span class="nd-c nd-c-deal" title="${_cnE([P.deal, _ndText(P.ref)].filter(Boolean).join(' · '))}">${_cnE(P.deal)}${P.ref ? (P.deal ? ' · ' : '') + P.ref : ''}</span><span class="nd-c nd-c-who">${_cnE(P.who)}</span>`
    + `<span class="nd-c nd-c-when${P.late ? ' cn-late' : ''}">${_cnE(P.when)}</span><span class="nd-c nd-c-next">${btn}</span>${look}</div>`;
}
function ndBoardRowsHtml(D, opts){
  const L = ndBoardList(D);
  if (!L.length) return `<div class="nd-none">${_cnE(_cnT(ndInTab(D).length ? 'nd_none_found' : 'cn_nothing'))}</div>`;
  const cap = ND_PAGE * (1 + (_nd.more || 0));
  const shown = L.slice(0, cap), rest = L.slice(cap);
  let foot = '';
  if (rest.length){
    const by = ndKindsOf(rest).map(x => (x.k === 'jambo' ? _cnT('nd_k_jambo') : _cnT('nd_k_' + x.k)).toLowerCase() + ' ' + x.n);
    foot = `<div class="nd-more"><button type="button" class="ui-link" data-nd-more>${_cnE(_cnTn('cn_show_more', Math.min(ND_PAGE, rest.length), { n: Math.min(ND_PAGE, rest.length) }))}</button><span>${_cnE(_cnT('nd_next', { list: by.join(' · ') }))}</span></div>`;
  }
  return shown.map(r => ndBoardRowHtml(r, opts)).join('') + foot;
}
function ndBoardHtml(opts){
  const o = opts || {};
  const D = ndRead();
  const B = ndOnBoard(D);
  /* nothing waits: no card (the least attention), unless the foot has news of what was done */
  if (!B.n && !o.keep) return '';
  const inTab = ndInTab(D);
  const kinds = ndKindsOf(inTab);
  if (_nd.kind !== 'any' && !kinds.some(x => x.k === _nd.kind)) _nd.kind = 'any';
  const sum = [_cnTn('nd_things', B.n, { n: B.n }), ndSumWords(D)].filter(Boolean).join(' · ');
  const home = Math.min(CN_ROWS, B.jambo.length) + Math.min(CN_ROWS, B.you.length);
  const tab = (k, n) => `<button type="button" class="nd-tab${_nd.tab === k ? ' on' : ''}" data-nd-tab="${k}" aria-pressed="${_nd.tab === k}">${_cnE(_cnT('nd_tab_' + k))} <span class="nd-tab-n">${n}</span></button>`;
  const chip = (k, n) => `<button type="button" class="nd-chip${_nd.kind === k ? ' on' : ''}" data-nd-kind="${k}" aria-pressed="${_nd.kind === k}">${_cnE(_cnT('nd_k_' + k))}${n != null ? ' ' + n : ''}</button>`;
  const jamboOn = _nd.tab === 'jambo' || _nd.kind === 'jambo';
  return `<section class="hb-card nd-card" id="hm-agents"><header class="hb-ch"><span class="hb-ct">${_cnE(_cnT('hb_ny_title'))}</span><span class="hb-cs">${_cnE(sum)}</span><span class="hb-grow"></span>${B.n ? `<span class="hb-cs nd-home-shows">${_cnE(_cnT('nd_home_shows', { n: home }))}</span>` : ''}</header>`
    + `<div class="nd-bar"><div class="nd-tabs">${tab('all', B.n)}${tab('you', ndThings(B.you))}${tab('jambo', ndThings(B.jambo))}</div>`
    + `<input type="search" id="nd-q" class="nd-find" autocomplete="off" placeholder="${_cnE(_cnT('nd_find_ph'))}" aria-label="${_cnE(_cnT('nd_find_label'))}" value="${_cnE(_nd.q)}"></div>`
    + (kinds.length > 1 ? `<div class="nd-chips">${chip('any', null)}${kinds.map(x => chip(x.k, x.n)).join('')}</div>` : '')
    + (jamboOn && o.chase ? o.chase : '')
    + `<div class="nd-cols"><span>${_cnE(_cnT('nd_col_what'))}</span><span>${_cnE(_cnT('nd_col_deal'))}</span><span>${_cnE(_cnT('nd_col_who'))}</span><span>${_cnE(_cnT('nd_col_when'))}</span><span>${_cnE(_cnT('nd_col_next'))}</span></div>`
    + `<div class="nd-rows" id="nd-rows">${ndBoardRowsHtml(D, o)}</div>${o.foot || ''}</section>`;
}
/* the find box narrows the rows only: the box being typed in is never redrawn */
function ndRowsRepaint(){
  const el = document.getElementById('nd-rows'); if (!el) return;
  const o = (typeof window.hbNdOpts === 'function') ? hbNdOpts() : {};
  el.innerHTML = ndBoardRowsHtml(ndRead(), o);
}
function ndBoardRepaint(){ if (typeof hbPaintBoard === 'function') try { hbPaintBoard(); } catch (_){} }
/* "Show all N" and Look from Home, and every door onto the card: the Board,
   the tab named, the row named in view (twelve more at a time until it is) */
function ndShow(tab, key){
  _nd = { tab: ['all', 'you', 'jambo'].includes(tab) ? tab : 'all', kind: 'any', q: '', more: 0 };
  if (key){ const L = ndBoardList(ndRead()); const i = L.findIndex(r => r.key === key || (r.it && r.it.key === key)); if (i >= ND_PAGE) _nd.more = Math.floor(i / ND_PAGE); }
}
function ndOpenBoard(tab, key){
  ndShow(tab, key ? 'p:' + key : null);
  if (key && typeof window.hbAgLookSet === 'function') hbAgLookSet(key);
  if (typeof hbOpenAgent === 'function') return hbOpenAgent(null, key || null);
  return false;
}
function ndPlace(){ return { tab: _nd.tab, kind: _nd.kind, q: _nd.q }; }
function ndPlacePut(p){
  if (!p || typeof p !== 'object') return;
  _nd = { tab: ['all', 'you', 'jambo'].includes(p.tab) ? p.tab : 'all', kind: ND_KINDS.includes(p.kind) ? p.kind : 'any', q: String(p.q || '').slice(0, 120), more: 0 };
}
/* the bundled details: the very contracts the row counted, on the Contracts list */
function ndBundleGo(){
  const r = ndRead().you.find(x => x.bundle); if (!r) return false;
  const ids = r.bundle.map(y => y.x.c.id);
  if (typeof regShowOnly === 'function'){ regShowOnly(ids, _cnT('nd_bundle_said')); return true; }
  return false;
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
  /* THE ONE DESK (Round A): Needs you is ONE reading (ndRead) — Jambo's
     prepared work and your move, the top three of each, "Show all N" onto
     the Board where the whole of it stands */
  const D = ndRead();
  const quiet = !D.n;
  const rows = quiet ? `<div class="cn-r"><div class="cn-w"><b>${_cnE(_cnT('cn_nothing'))}</b></div></div>` : ndHomeHtml(D);
  const sum = ndSumWords(D);
  /* the lead chip: the first of your own rows that names one contract's act */
  const lead = D.you.find(r => r.y);
  const open = quiet ? dkTabs().slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(t => deskTabLabel(t.k)).slice(0, CN_PICK_UP) : [];
  const pick = open.length ? `<section class="cn-card"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('cn_pick_up'))}</span></header>${open.map(t =>
    `<div class="cn-r"><div class="cn-w"><b>${_cnE(deskTabLabel(t.k))}</b></div><button type="button" class="ui-btn ui-btn-sm" data-dk-go="${_cnE(t.k)}">${_cnE(_cnT('cn_open'))}</button></div>`).join('')}</section>` : '';
  _cnSig = ndSig(D);
  return `<div class="cn-page" id="cn-page"><div class="cn-in">
    <section class="cn-card cn-ask">${cnFace(26, 'cn-face')}<h1>${_cnE(_cnT('cn_hello', { name }))}</h1>
      <div class="cn-wrap">${''/* THE TWO-ROW CARD (owner picked it, 20 Oct 2026): the one builder */}${_cnJbCard({ cls: 'cn-card-box', field: `<textarea id="cn-q" rows="1" autocomplete="off" spellcheck="false" placeholder="${_cnE(_cnT('cn_box_ph'))}" aria-label="${_cnE(_cnT('cn_box_label'))}"></textarea>`, send: _cnJbSend('data-cn-send', _cnT('cn_ask')) })}<div class="ca-pop cn-pop" id="cn-pop" hidden></div></div>
      <div class="cn-chips" id="cn-chips">${cnChipsHtml(lead ? [lead.y] : [])}</div></section>
    <section class="cn-card cn-needs nd-home" id="cn-needs"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('hb_ny_title'))}</span><span class="cn-cnt">${D.n}</span>${sum ? `<span class="nd-sum">${_cnE(sum)}</span>` : ''}</header>${rows}</section>
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
function ndSig(D){
  /* the admin's row carries its own number (how much is left to set up, what the company needs): a change in it redraws */
  return D.jambo.concat(D.you).map(r => r.key + ':' + r.n + ':' + r.late + ':' + (r.setup || (r.company ? r.company.length : ''))).join(',');
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
  let sig = ''; try { sig = ndSig(ndRead()); } catch (_){ return; }
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
    /* THE ONE DESK's own presses, on Home, on the Board's card and in the bell's panel
       (a row pressed in the panel steps the panel aside before its door is taken) */
    const inPanel = !!t.closest('#panel-body .nd-pan');
    const step = () => { if (inPanel && typeof closeContextPanel === 'function') try { closeContextPanel(); } catch (_){} };
    if ((el = t.closest('[data-nd-all]'))){ ndOpenBoard(el.getAttribute('data-nd-all')); return; }
    if ((el = t.closest('[data-nd-look]'))){ step(); ndOpenBoard('jambo', el.getAttribute('data-nd-look')); return; }
    if ((el = t.closest('[data-nd-bundle]'))){ step(); ndBundleGo(); return; }
    /* a bell signal's row presses the bell's own door; from the slide-out panel the panel steps aside first */
    if ((el = t.closest('[data-nd-al]'))){ const k = el.getAttribute('data-nd-al');
      let r = null; try { r = ndRead().you.find(x => x.key === k) || null; } catch (_){ r = null; }
      step();
      if (r && r.al && typeof r.al.go === 'function') r.al.go(); return; }
    if ((el = t.closest('[data-nd-tab]'))){ _nd = { ..._nd, tab: el.getAttribute('data-nd-tab'), more: 0 }; ndBoardRepaint(); return; }
    if ((el = t.closest('[data-nd-kind]'))){ _nd = { ..._nd, kind: el.getAttribute('data-nd-kind'), more: 0 }; ndBoardRepaint(); return; }
    if ((el = t.closest('[data-nd-more]'))){ _nd = { ..._nd, more: (_nd.more || 0) + 1 }; ndRowsRepaint(); return; }
    /* a row of your move on the Board's card presses the same door as on Home */
    if (!t.closest('#cn-page') && !t.closest('#hm-agents.nd-card') && !inPanel) return;
    if (inPanel && t.closest('[data-cn-note],[data-cn-watch],[data-cn-req],[data-cn-need],[data-cn-setup],[data-cn-co]')) step();
    if ((el = t.closest('[data-cn-pop]'))){ counterPopTake(Number(el.getAttribute('data-cn-pop'))); return; }
    if (_cnPop && !t.closest('.cn-wrap')) counterPopClose();
    if ((el = t.closest('[data-cn-send]'))){ const q = document.getElementById('cn-q'); if (q){ const v = q.value; q.value = ''; counterBoxFit(q); counterPopClose(); counterAsk(v); } return; }
    if ((el = t.closest('[data-cn-ask]'))){ counterAsk(el.getAttribute('data-cn-ask')); return; }
    /* a note of yours and a request nobody holds: their own pages, landing ON
       the row (LAND ON IT — My notes' row, Requests' row), lit */
    if ((el = t.closest('[data-cn-note]'))){ const id = el.getAttribute('data-cn-note'); if (typeof myNotesOpen === 'function') myNotesOpen(id); cnLand('[data-mn-row="' + cnSel(id) + '"]', 'cn_land_note_gone'); return; }
    if ((el = t.closest('[data-cn-watch]'))){ if (typeof watchGo === 'function') watchGo(el.getAttribute('data-cn-watch')); return; }
    if ((el = t.closest('[data-cn-req]'))){ const id = el.getAttribute('data-cn-req'); if (typeof intakeGoTo === 'function') intakeGoTo(id); cnLand('[data-ik-row="' + cnSel(id) + '"]', 'cn_land_req_gone'); return; }
    if ((el = t.closest('[data-cn-need]'))){ if (typeof hbNeedsPress === 'function') hbNeedsPress(el.getAttribute('data-cn-need'), el.getAttribute('data-cn-id')); return; }
    if (t.closest('[data-cn-setup]')){ if (typeof hbSetupGo === 'function') hbSetupGo(); return; }
    if ((el = t.closest('[data-cn-co]'))){ if (typeof openSettingsAt === 'function') openSettingsAt('company'); return; }
  });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'cn-q'){ counterBoxFit(e.target); counterPopRead(e.target); }
    if (e.target && e.target.id === 'nd-q'){ _nd = { ..._nd, q: e.target.value, more: 0 }; ndRowsRepaint(); } });
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

Object.assign(window, { deskStepBack, counterWorkByAgent, cnRows, cnNeedShort, cnReqWhat, CN_REQ_WHAT_RE, counterFollow, cnLand,
  deskShellOn, DK_KEY, DK_RECENT, DK_SETTLE_MS, deskKeyNow, deskTabLabel, deskPageName, deskSheetUp, deskSheetFrom, deskSheetBackTo, deskTabsSync, deskRecentRows, deskRecentHtml, deskBarPaint, deskRecentToggle, deskBackTarget, deskGoBack, deskTabOpen, deskTabClose, deskGoCounter,
  ND_PAGE, ND_BUNDLE_MIN, ND_MERGE, ND_KINDS, ND_NEWS, ndIsNews, ndAlerts, ndAlCovered, ndPieces, ndRead, ndOnBoard, ndParts, ndSumWords, ndHomeHtml, ndPanelHtml, ndBoardHtml, ndBoardRowsHtml, ndRowsRepaint, ndShow, ndOpenBoard, ndPlace, ndPlacePut, ndBundleGo,
  CN_ROWS, renderCounter, counterHtml, counterRepaint, counterAsk, counterNeedsCount, counterPopRead, counterPopClose });
