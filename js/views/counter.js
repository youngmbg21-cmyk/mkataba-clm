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
  /* THE BAR NAMES THE PAGE YOU ARE ON (Round 2, owner's yes 24 Oct 2026): the letter names it only while it
     stands in front, on the paper's face; gone to the Calendar, Explorer or a contract's History, the bar
     says that page, never "Send" (the letter still waits, Recent's first row) */
  if (v === 'dashboard'){ const sk = dkSendNow(); const onPaper = (typeof hbFace !== 'function') || hbFace() === 'paper';
    const card = typeof window.bsCardId === 'function' && !!window.bsCardId();
    if (sk && !dkSendWaiting() && onPaper && !card) return sk; }
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
  mynotes: 'nav_mynotes', reads: 'nav_reads', pulse: 'nav_pulse', intel: 'nav_insights', jambo: 'nav_jambo', templates: 'nav_tpl_std', playbook: 'nav_tpl_std', migration: 'nav_import',
  intake: 'nav_intake', directory: 'nav_directory', team: 'nav_settings_rules', brain: 'nav_brain', register: 'nav_contracts', handbook: 'nav_handbook' };
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
  /* A TEMPLATE'S OWN PAGE IS OUR PAPER'S (owner, 25 Oct 2026): it paints
     without a view of its own, so the bar asks it too — it said "Builder" */
  if (typeof document !== 'undefined' && document.getElementById('tpl-dt')) return _cnT('nav_tpl_std');
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
let _dkLand = null;   // { k, back }: the page last arrived on and the panel face it came with
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
  if (typeof w.pdTrail === 'function' && w.pdTrail()){
    /* A FACE THAT CAME WITH THE PAGE IS NOT A STEP (the glitch audit, 24 Oct
       2026: a contract opened from Approvals landed on Before you sign, and
       the first ‹ only turned the panel back to the Dossier — "I press twice
       to go back"). The face the door opened is part of the page it opened:
       ‹ goes back to the page before. A face the reader opened here is still
       one step up (One trail, 19 Oct 2026); the panel's own back and Esc are
       unchanged. */
    const t = w.pdTrail();
    if (_dkLand && t && _dkLand.k === deskKeyNow() && _dkLand.back === t.back && deskBackTarget()) return false;
    if (press) w.pdTrailBack(); return true; }
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
    if (!(k && k.startsWith(DK_SEND))){
      const nk = k || ((typeof state !== 'undefined' && state && state.view === 'counter') ? 'home' : null);
      /* the panel's face the page arrived with (deskStepBack) */
      if (nk && _dkTrail[_dkTrail.length - 1] !== nk){ let tb = null; try { const t = typeof window.pdTrail === 'function' ? window.pdTrail() : null; tb = t ? t.back : null; } catch (_){ tb = null; } _dkLand = { k: nk, back: tb }; }
      dkTrailNote(nk);
    }
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
    return `<div class="dk-r${on ? ' is-on' : ''}"><button type="button" class="dk-r-go" role="menuitem" data-dk-go="${_cnE(t.k)}"${on ? ' aria-current="page"' : ''}><span class="dk-r-tick" aria-hidden="true">${on ? tick : ''}</span><span class="dk-r-w"><span class="dk-r-t">${_cnE(w)}</span><small>${_cnE(sub)}</small></span></button><button type="button" class="dk-r-x" data-dk-x="${_cnE(t.k)}" title="${_cnE(away)}" aria-label="${_cnE(away)}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : '×'}</button></div>`;
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
    /* ‹ SAYS WHERE IT GOES (the glitch audit, 24 Oct 2026: it said only "Back", and a press that
       stepped the panel looked like one that did nothing) */
    let where = '';
    if (can && !deskSheetUp()){
      try {
        const w = typeof window !== 'undefined' ? window : {};
        const t = (deskStepBack(false) && typeof w.pdTrail === 'function') ? w.pdTrail() : null;
        if (t && t.up) where = String(t.up);
        else if (!deskStepBack(false)){ const bt = deskBackTarget(); if (bt) where = deskTabLabel(bt.k); }
      } catch (_){ where = ''; }
    }
    const tip = can ? (where ? _cnT('dk_back_to', { where }) : _cnT('dk_back')) : _cnT('dk_back_none');
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
    /* THE LIST STANDS IN FRONT OF EVERY PAGE (owner, 26 Oct 2026: "when you press on the highlighted filter, the
       dropdown does not appear" — on New agreement): the app's frame (#app-shell, position:fixed) is its own
       layer, so the list's z-index inside it could never rise above a page (z 70, drawn outside the frame) —
       it opened BEHIND the New agreement sheet and the send letter. While open it is lifted out to the body,
       fixed under the page's name, above pages and Jambo's window (75), below a question dialog (DLG_Z 80). */
    if (_dkMenuOpen && btn){
      if (menu.parentElement !== document.body) document.body.appendChild(menu);
      const r = btn.getBoundingClientRect();
      menu.classList.add('is-lifted');
      menu.style.top = Math.round(r.bottom + 8) + 'px'; menu.style.left = Math.round(r.left) + 'px';
    }
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
  /* your own signature leads Your move, under only a colleague's approval held while they are away
     (the bell's own order, owner-reported: "your own signature ranks first of all") */
  const sig = y => Number(y.k === 'c' && y.kind === 'sign');
  return out.map((y, i) => ({ y, i })).sort((a, b) => (Number(!!b.y.fw) - Number(!!a.y.fw)) || (sig(b.y) - sig(a.y)) || (Number(b.y.urgent) - Number(a.y.urgent)) || (a.i - b.i)).map(o => o.y);
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
  /* a signed copy that did not go out (flag D) */
  if (it.kind === 'copies') return _cnT('cn_sh_copies', _cnWho(cp));
  /* promises Jambo found, not yet confirmed (flag E) */
  if (it.kind === 'promises') return _cnTn('cn_sh_promises', n, { ..._cnWho(cp), n });
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
const ND_MERGE = { answer: ['quiet'], renewal: ['renewal'], notice: ['renewal'], read: ['details', 'promises'] };
const ND_KIND_OF = { approval: 'approval', refused: 'approval', sign: 'sign', copies: 'sign', promises: 'duty', quiet: 'review', review: 'review', suggest: 'review', look: 'review', details: 'details', renewal: 'renewal' };
const ND_KINDS = ['approval', 'sign', 'review', 'details', 'renewal', 'duty', 'ask', 'jambo'];
const ND_BTN = { approval: 'decide', refused: 'decide', renewal: 'decide', sign: 'sign', copies: 'look', promises: 'review', quiet: 'review', review: 'review', suggest: 'review', look: 'review', details: 'fill', join: 'answer', request: 'answer' };
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
/* the admin's own list (stNeedsAll) already holds these: the setup or company row stands for them, last of
   Your move. The mail warning (the owner moved it off the page onto the bell) leads that row's line */
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
  /* an ending is not the decision: it keeps ringing after the decision (the bell's two renewal rows), so only
     the week's own date stands for it */
  const ends = a.kind === 'renewal' && !!a.ends;
  const kinds = ends ? [] : (ND_AL_ROWS[a.kind] || []), pk = ends ? [] : (ND_AL_PIECES[a.kind] || []);
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
  /* a document the Mailroom gave you says it once, as its own line: reading it IS filling its details in (the bell's own rule) */
  const AL = ndAlerts(), mail = new Set(AL.work.filter(a => a.kind === 'mailroom').map(a => String(a.id)));
  const Y = rows.filter(y => !covered.has(y) && !(y.k === 'c' && y.x.it.kind === 'details' && mail.has(String(y.x.c.id))));
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
  const S = cnSetup(), R0 = cnCompany();
  const seen = new Set();
  AL.work.forEach(a => { if (ndAlCovered(a, rows, P, !!(S || R0.length))) return;
    const key = ndAlKey(a); if (seen.has(key)) return; seen.add(key);
    you.push({ g: 'you', key, kind: ND_AL_KIND[a.kind] || 'ask', al: a, n: 1, late: a.late ? 1 : 0, age: null }); });
  const mailOff = AL.work.find(a => a.kind === 'email-off') || null;
  const R = mailOff ? R0.filter(x => !(x && x.key === 'panel:mail')) : R0;
  if (S) you.push({ g: 'you', key: 'setup', kind: 'ask', setup: S, n: 1, late: 0, age: null });
  else if (R0.length) you.push({ g: 'you', key: 'company', kind: 'ask', company: R, mail: mailOff, n: 1, late: 0, age: null });
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
/* THE ONE DESK'S JAMBO ROWS FOR ONE CONTRACT (the Dossier, beside its paper): the same pieces and the
   same merge as ndRead (ND_MERGE: a piece carries the wait and the red of the rows it stands for), read
   off that contract's own checklist (L, needsYouOf) — never the whole book on a paper's paint */
function ndJamboFor(c, L){
  const cid = String((c && c.id) || ''); if (!cid) return [];
  const age = it => (typeof hbNyAge === 'function') ? hbNyAge(it) : null;
  return ndPieces().filter(p => String(_ndCid(p.it)) === cid).map((p, i) => {
    const ks = ND_MERGE[p.it.kind] || [], cov = (L || []).filter(it => it && ks.includes(it.kind));
    const a = [ndPieceAge(p.it)].concat(cov.map(age)).filter(x => x != null);
    return { g: 'jambo', key: 'p:' + p.it.key, kind: 'jambo', it: p.it, agent: p.agent, n: 1, late: (p.it.tone === 'ruby' || cov.some(it => it.urgent)) ? 1 : 0, age: a.length ? Math.max(...a) : null, i };
  });
}
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
  const P = { title: '', deal: '', who: '', when: '', late: !!r.late, btn: 'open', attrs: '', step: null, read: '', ref: '', line: '', tag: '', pills: '', priv: '', name: '', party: '' };
  const days = n => (typeof hbNyDays === 'function') ? hbNyDays(n) : String(n);
  /* the agreement's own name, without a trailing " — <the other side>" (bsShortName's reading) */
  const _ndName = c => { if (!c) return ''; try { if (typeof bsShortName === 'function') return String(bsShortName(c) || ''); } catch (_){} return String(c.name || ''); };
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
    if (c){ P.name = _ndName(c); P.party = String(c.counterparty || '').trim(); }
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
    /* its own line first — what came back, who asked, the note (owner, 13 Sep 2026: "what the other side did, in one line") — then the agreement */
    P.deal = [String(a.sub || ''), c ? [c.name, c.counterparty].filter(Boolean).join(' · ') : [a.name, a.ref].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
    /* good news stays green and flashes once on the sitting it is first seen (owner, 23 Aug 2026; the bell's own `news`) */
    P.good = a.tone === 'green'; P.news = !!a.news;
    if (a.hint) P.tip = String(a.hint);
    P.ref = (c && typeof refHtml === 'function') ? refHtml(c) : '';
    if (c){ P.name = _ndName(c); P.party = String(c.counterparty || '').trim(); P.note = String(a.sub || ''); }
    P.btn = ND_AL_BTN[a.kind] || 'open';
    P.attrs = `data-nd-al="${_cnE(r.key)}"`;
    return P;
  }
  if (r.setup){ P.title = _cnTn('hb_setup_left', r.setup, { n: r.setup }); P.attrs = 'data-cn-setup'; return P; }
  if (r.company){
    P.title = _cnT('cn_company') + ' · ' + (r.company.length + (r.mail ? 1 : 0));
    P.deal = [r.mail ? String(r.mail.text || '').trim() : ''].concat(r.company.slice(0, r.mail ? 2 : 3).map(x => String(x.text || '').trim())).filter(Boolean).join(' · ');
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
  if (it.kind === 'look' && it.note) P.note = '\u201c' + String(it.note) + '\u201d';
  P.who = y.fw ? _cnT('cn_need_for', { who: _cnFirst(y.fw.name) }) : String(it.who || '');
  if (x.age != null) P.when = days(x.age);
  else if (it.kind === 'renewal' && it.d != null) P.when = it.d <= 0 ? _cnT('ins_days_today') : _cnTn('ins_need_in', it.d, { n: it.d });
  else { const due = String(it.due || '').slice(0, 10); P.when = /^\d{4}-\d{2}-\d{2}$/.test(due) ? _cnT('cn_due', { day: cnDayWords(due) }) : ''; }
  P.btn = ND_BTN[it.kind] || 'open';
  /* the button says what happens (Round 2, 24 Oct 2026): an approval asked of you is "Approve…" */
  if (it.kind === 'approval') P.btn = 'approve';
  P.name = _ndName(c); P.party = party;
  P.money = (it.kind === 'approval' || it.kind === 'sign') && cnMayMoney(c) ? fmtMoneyShortOf(c) : '';
  /* a renewal's Decide says it reads the contract again (the renewal's one door, needsYouGo) */
  if (it.kind === 'renewal') P.tip = _cnT('ins_need_go_terms');
  const priv = c.folder && typeof streamIsPrivate === 'function' && streamIsPrivate(c.folder)
    ? _cnPill('lock', _cnT('cn_private', { stream: ((typeof FOLDERS !== 'undefined' && FOLDERS[c.folder]) || {}).name || '' })) : '';
  const away = y.fw ? _cnPill('users', y.fw.until ? _cnT('cn_need_away', { who: _cnFirst(y.fw.name), day: cnDayWords(y.fw.until) }) : _cnT('cn_need_for', { who: _cnFirst(y.fw.name) })) : '';
  P.pills = away + priv; P.priv = priv;
  /* the contract's number in its one dress (refHtml) — the owner's "there is no contract number in the card", 8 Oct 2026 */
  P.ref = (typeof refHtml === 'function') ? refHtml(c) : _cnE((typeof contractRef === 'function') ? contractRef(c) : c.id);
  return P;
}
const _ndBtnHtml = (P, attrs) => `<button type="button" class="ui-btn ui-btn-sm nd-btn" ${attrs != null ? attrs : P.attrs}${P.tip ? ` title="${_cnE(P.tip)}"` : ''}>${_cnE(_cnT('nd_btn_' + P.btn))}</button>`;
const _ndStepHtml = P => P.step ? `<span class="nd-step" title="${_cnE(_cnT('nd_step_title', P.step))}">${_cnE(_cnT('nd_step', P.step))}</span>` : '';
const _ndTagHtml = P => P.tag ? `<span class="nd-tag">${_cnE(P.tag)}</span>` : '';

/* ---- HOME: THE TOP THREE OF EACH GROUP, EACH ROW TWO LINES ----
   Jambo's work first (his rows say what he read), then your move; a group
   holding more than three says "Show all N", which lands on the Board. */
function ndHomeRowHtml(r){
  const P = ndParts(r);
  /* THE AGREEMENT LEADS (Round 2, owner's yes 24 Oct 2026; reverses "the contract's number LEADS the line"):
     the name in black, then the number, the other side and the ask in grey. A row about no one
     contract keeps its own words first. Jambo's prepared piece says "Review", the act it opens. */
  const named = !!P.name;
  const head = named ? P.name : P.title;
  const party = P.party && ![P.name, P.title].some(t => String(t).toLowerCase().includes(P.party.toLowerCase())) ? P.party : '';
  const sub = named
    ? [P.ref, _cnE(party), _cnE(P.title), _cnE(P.note || ''), _cnE(P.money || '')].filter(Boolean).join(' · ')
    : (P.ref ? P.ref + ' · ' : '') + (r.g === 'jambo' ? `<i class="nd-read">${_cnE(_cnT('nd_read'))}</i> ${_cnE(P.read)}` : _cnE(P.deal));
  const hover = r.g === 'jambo' ? P.line : [_ndText(P.ref), P.deal].filter(Boolean).join(' · ');
  /* MORNING LIGHT'S ROW (round 2 of the Legora way; owner, 31 Oct 2026: "build both, green link as drawn"):
     the other side's initials lead it (Jambo's own work wears his mark), its kind is a tinted word at the head
     of its second line, and its verb is a green link at the end, pressing the same door the button did */
  /* the new look's (built behind the switch until Home is approved); today's row keeps its one grey button */
  const nl = typeof newLookOn === 'function' && newLookOn();
  const bP = r.g === 'jambo' ? Object.assign({}, P, { btn: 'review' }) : P;
  const btn = nl ? _ndLinkHtml(bP) : _ndBtnHtml(bP);
  return `<div class="cn-r nd-r${named ? ' nd-named' : ''}${P.good ? ' nd-good' : ''}${P.news ? ' nd-news' : ''}" data-nd-row="${_cnE(r.key)}"${hover ? ` title="${_cnE(hover)}"` : ''}>${nl ? ndAvHtml(r, P) : ''}<div class="cn-w"><b><span class="nd-t">${_cnE(head)}</span>${named ? '' : _ndStepHtml(P)}${_ndTagHtml(P)}${P.pills}</b><span>${nl ? ndKindHtml(r) : ''}${sub}</span></div>`
    + `<span class="nd-when${P.late ? ' cn-late' : ''}">${_cnE(P.when)}</span>${btn}</div>`;
}
/* the verb as a green link: the button's own words and door, dressed as a link (the row's one press) */
const _ndLinkHtml = P => `<button type="button" class="ui-link nd-btn nd-link" ${P.attrs}${P.tip ? ` title="${_cnE(P.tip)}"` : ''}>${_cnE(_cnT('nd_btn_' + P.btn))}</button>`;
/* whose it is: the other side's initials in their own washed tone (the list language, regAvatarHtml), Jambo's mark on his */
function ndAvHtml(r, P){
  if (r.g === 'jambo') return `<span class="reg-av nd-av is-jambo" aria-hidden="true">${typeof icon === 'function' ? icon('sparkle', 'w-3.5 h-3.5') : ''}</span>`;
  /* the other side, else the agreement, else (a request) whoever asked; a row about no one has a quiet drawn mark, never letters read off its own title */
  const who = String(P.party || P.name || (r.y && r.y.k === 'req' ? P.who : '') || '').trim();
  if (who && typeof regAvatarHtml === 'function') return regAvatarHtml(who).replace('class="reg-av ', 'class="reg-av nd-av ');
  const ic = r.company ? 'building' : r.setup ? 'cog' : r.bundle ? 'list' : (r.y && r.y.k === 'note') ? 'pencil' : (r.y && r.y.k === 'watch') ? 'target' : 'info';
  return `<span class="reg-av nd-av is-none" aria-hidden="true">${typeof icon === 'function' ? icon(ic, 'w-3.5 h-3.5') : ''}</span>`;
}
/* its kind, in the one desk's own reading: late · prepared by Jambo · due this week · your move */
function ndKindOfRow(r){
  if (r.late) return 'late';
  if (r.g === 'jambo') return 'jambo';
  const due = String((r.y && r.y.x && r.y.x.it && r.y.x.it.due) || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(due) && typeof calToday === 'function'){
    const d = Math.round((new Date(due + 'T00:00:00') - new Date(calToday() + 'T00:00:00')) / 864e5);
    if (d >= 0 && d < CN_WEEK_DAYS) return 'week';
  }
  return 'you';
}
const ndKindHtml = r => { const k = ndKindOfRow(r); return `<span class="nd-kind is-${k}">${_cnE(_cnT('nd_kind_' + k))}</span>`; };
function ndHomeHtml(D){
  const group = (g, L) => {
    if (!L.length) return '';
    const n = ndThings(L);
    const all = L.length > CN_ROWS ? `<button type="button" class="ui-link nd-all" data-nd-all="${g}">${_cnE(_cnT('cn_show_all', { n }))}</button>` : '';
    /* the count is said once, in the card's head (Round 2): a group row carries none */
    return `<div class="nd-g" data-nd-g="${g}"><span class="nd-g-t">${_cnE(_cnT('nd_g_' + g))}</span>${all}</div>${L.slice(0, CN_ROWS).map(ndHomeRowHtml).join('')}`;
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

/* ---- THE BELL, THE NEW LOOK (round 7, as drawn) ----
   The same eight things Home lists (ndRead, in Home's own order, cn2Rows), each a dot in its kind's tone, what it
   is and where, and ONE Open that presses the row's own door; News under it, never counted (ndIsNews). */
function ndBellNlHtml(D){
  const L = cn2Rows(D), news = D.news || [];
  const row = x => { const r = x.r, P = ndParts(r);
    const title = P.title || P.name || '';
    const sub = r.g === 'jambo' ? _ndText(P.deal || P.line || '') : [P.name && P.name !== title ? P.name : '', P.party && !String(title).includes(P.party) && !String(P.name).includes(P.party) ? P.party : '', P.money || '', P.when || ''].filter(Boolean).join(' \u00b7 ');
    return `<div class="ndb-r" data-nd-row="${_cnE(r.key)}"><i class="ndb-dot is-${x.k}" aria-hidden="true"></i><div class="ndb-w"><b>${_cnE(title)}</b>${sub ? `<span>${_cnE(sub)}</span>` : ''}</div>`
      + `<button type="button" class="ui-btn ui-btn-sm ndb-open" ${P.attrs}${P.tip ? ` title="${_cnE(P.tip)}"` : ''}>${_cnE(_cnT('act_open'))}</button></div>`; };
  const newsRow = (a, i) => `<button type="button" class="ndb-r is-news" data-alert-i="${i}" data-alert-kind="${_cnE(a.kind || '')}"><i class="ndb-dot is-news" aria-hidden="true"></i><div class="ndb-w"><b>${_cnE(a.text || '')}</b>${(a.sub || a.name) ? `<span>${_cnE([a.name, a.sub].filter(Boolean).join(' \u00b7 '))}</span>` : ''}</div></button>`;
  return `<div class="ndb">${L.length ? `<div class="ndb-h">${_cnE(_cnT('ndb_need', { n: ndThings(D.jambo) + ndThings(D.you) }))}</div>${L.map(row).join('')}` : `<p class="ndb-none">${_cnE(_cnT('ap_nothing_needs_you'))}</p>`}`
    + (news.length ? `<div class="ndb-h">${_cnE(_cnT('ndb_news'))}</div>${news.map(newsRow).join('')}` : '') + `</div>`;
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
  return `<div class="nd-br${look ? ' is-look' : ''}${P.good ? ' nd-good' : ''}${P.news ? ' nd-news' : ''}" data-nd-row="${_cnE(r.key)}"${piece ? ` data-hb-ag-item="${_cnE(r.it.key)}" data-nd-agent="${_cnE(r.agent)}"` : ''}>`
    + `<span class="nd-c nd-c-what"${piece && P.line ? ` title="${_cnE(P.line)}"` : ''}><b>${_cnE(P.title)}</b>${_ndTagHtml(P)}${P.priv}</span>`
    /* the number first and never cut; the name gives way with "…" (owner, 23 Oct 2026) */
    + `<span class="nd-c nd-c-deal" title="${_cnE([_ndText(P.ref), P.deal].filter(Boolean).join(' · '))}">${P.ref}${P.ref && P.deal ? '<i class="nd-dot" aria-hidden="true">·</i>' : ''}${P.deal ? `<span class="nd-deal-t">${_cnE(P.deal)}</span>` : ''}</span>`
    /* no "Who or what asked" column (owner, 24 Oct 2026): empty on most rows; the search still reads it */
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
  const folded = ndFolded();
  return `<section class="hb-card nd-card${folded ? ' is-folded' : ''}" id="hm-agents"><header class="hb-ch"><span class="hb-ct">${_cnE(_cnT('hb_ny_title'))}</span><span class="hb-cs">${_cnE(sum)}</span><span class="hb-grow"></span>${B.n && !folded ? `<span class="hb-cs nd-home-shows">${_cnE(_cnT('nd_home_shows', { n: home }))}</span>` : ''}${ndFoldBtnHtml(folded)}</header>`
    + `<div class="nd-main" id="nd-main"${folded ? ' hidden' : ''}><div class="nd-bar"><div class="nd-tabs">${tab('all', B.n)}${tab('you', ndThings(B.you))}${tab('jambo', ndThings(B.jambo))}</div>`
    + `<input type="search" id="nd-q" class="nd-find" autocomplete="off" placeholder="${_cnE(_cnT('nd_find_ph'))}" aria-label="${_cnE(_cnT('nd_find_label'))}" value="${_cnE(_nd.q)}"></div>`
    + (kinds.length > 1 ? `<div class="nd-chips">${chip('any', null)}${kinds.map(x => chip(x.k, x.n)).join('')}</div>` : '')
    + (jamboOn && o.chase ? o.chase : '')
    + `<div class="nd-cols"><span>${_cnE(_cnT('nd_col_what'))}</span><span>${_cnE(_cnT('nd_col_deal'))}</span><span>${_cnE(_cnT('nd_col_when'))}</span><span>${_cnE(_cnT('nd_col_next'))}</span></div>`
    + `<div class="nd-rows" id="nd-rows">${ndBoardRowsHtml(D, o)}</div>${o.foot || ''}</div></section>`;
}
/* ---- THE CARD FOLDS TO ITS HEAD (owner, 25 Oct 2026: "add the ability for the needs you card to be able to be
   minimized") ----
   Hide on the card's own head line folds everything under it away, as the Insights card beside it does (the same
   button, the same words, the same store: the Board's own state, hbS().ndFold, kept for this person by hbSave).
   The head keeps the title and how many things wait, so nothing owed drops out of the count; Show opens it again
   (PRESS IT AGAIN AND IT CLOSES). Every door that sends you to the card (Show all N, Look, the bell's row) opens
   it first, so a door always lands on rows (ndShow). No band, no second door. The phone has no card to fold. */
function ndFolded(){ try { return typeof window.hbS === 'function' && !!hbS().ndFold; } catch (_){ return false; } }
function ndFoldSet(on){ try { if (typeof window.hbS !== 'function') return; const st = hbS(); if (!!st.ndFold === !!on) return; st.ndFold = !!on; if (typeof window.hbSave === 'function') hbSave(); } catch (_){} }
function ndFoldBtnHtml(folded){
  return `<button type="button" class="hb-btn is-sm nd-fold" data-nd-fold aria-expanded="${!folded}" aria-controls="nd-main" aria-label="${_cnE(_cnT(folded ? 'nd_fold_open' : 'nd_fold_shut'))}">${_cnE(_cnT(folded ? 'hb_ins_show' : 'hb_ins_hide'))}</button>`;
}
/* fold or open, then the Board draws the card again (its head's words follow the fold) */
function ndFoldApply(on){ ndFoldSet(!!on); ndBoardRepaint(); return true; }
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
  /* a door onto the card lands on its rows: a folded card is opened first */
  if (ndFolded()) ndFoldSet(false);
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
/* THE CHIPS UNDER THE BOX: the Board always first (owner, 27 Oct 2026: "add board as always an option to press when
   you are in the home page"). THE BOX PREDICTS (round 5, the Legora way; owner's yes 29 Oct 2026: "bring them to home
   page", which reverses 27 Oct's "remove the highlighted sign contract"): "Likely next:" and the next three things that
   wait, each said as a whole task ("answer Nandi Dairy's 2 changes") off the one desk's reading (ndRead, in Needs you's
   own order right under it: Jambo's prepared work, then your move), each pressing its own row's door (ndParts' attrs) — nothing is asked of Jambo and
   nothing costs. Nothing waiting: the usual places, board · contracts · calendar · draft a new agreement (owner: "the
   usual links apart from reads"). All wear the same underlined link. */
const CN_LIKELY_MAX = 3;
/* a sentence's first word made small only where it is a plain word ("A chase…" → "a chase…"), never a name ("Nordvik…") */
const CN_LK_SMALL = ['a', 'an', 'the', 'your', 'their', 'our', 'en', 'ett', 'din', 'ditt', 'dina', 'deras', 'vår', 'vårt', 'våra'];
const _cnLow = s => { s = String(s || '').trim(); const w = s.split(/\s+/)[0].toLowerCase(); return CN_LK_SMALL.includes(w) ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
/* a waiting thing said as the task it asks for — the short name's own reading (cnNeedShort's), with its verb */
function cnLikelyWords(r){
  if (!r) return '';
  if (r.bundle) return _cnTn('cn_lk_bundle', r.n, { n: r.n });
  /* a piece Jambo prepared is looked at before it goes anywhere: "review a chase to Kettle & Co" */
  if (r.g === 'jambo'){ const t = _cnLow(ndParts(r).title); return t ? _cnT('cn_lk_piece', { what: t }) : ''; }
  if (r.al || r.setup) return _cnLow(ndParts(r).title);
  const y = r.y; if (!y) return '';
  if (y.k === 'note') return y.urgent ? _cnT('cn_lk_mynote_late') : _cnT('cn_lk_mynote');
  if (y.k === 'watch') return _cnLow((typeof watchFiredWords === 'function') ? watchFiredWords(y.w || {}) : _cnT('wt_sh'));
  if (y.k === 'req'){ const what = cnReqWhat(y.r), who = _cnWho(_cnFirst((y.r && y.r.by && y.r.by.name) || ''));
    return what ? _cnT('cn_lk_request_what', { ...who, what }) : _cnT('cn_lk_request', who); }
  const x = y.x, c = x.c, it = x.it, cp = String(c.counterparty || c.name || '').trim(), n = it.n || 1;
  if (it.kind === 'approval') return y.fw ? _cnT('cn_lk_approval_for', _cnWho(_cnFirst(y.fw.name))) : _cnT('cn_lk_approval', { who: cp });
  if (it.kind === 'quiet') return _cnTn('cn_lk_redlines', n, { ..._cnWho(cp), n });
  if (it.kind === 'details') return _cnTn('cn_lk_details', n, { ..._cnWho(cp), n });
  if (it.kind === 'promises') return _cnTn('cn_lk_promises', n, { ..._cnWho(cp), n });
  if (['renewal', 'sign', 'copies'].includes(it.kind)) return _cnT('cn_lk_' + it.kind, _cnWho(cp));
  if (['review', 'look', 'refused', 'join', 'note', 'suggest'].includes(it.kind) && it.who) return _cnT('cn_lk_' + it.kind, _cnWho(_cnFirst(it.who)));
  return _cnLow((typeof hbNyWhat === 'function') ? hbNyWhat(x) : '');
}
/* the next things that wait, in Needs you's order, each with its words and its row's door */
function cnLikely(D){
  const B = ndOnBoard(D && Array.isArray(D.you) ? D : ndRead());
  return B.jambo.concat(B.you).map(r => ({ r, words: cnLikelyWords(r), attrs: ndParts(r).attrs })).filter(t => t.words && t.attrs).slice(0, CN_LIKELY_MAX);
}
function cnChipsHtml(D){
  const w = k => _cnT(k);
  const chip = word => `<button type="button" class="cn-chip" data-cn-ask="${_cnE(word)}">${_cnE(word)}</button>`;
  let L = []; try { L = cnLikely(D); } catch (_){ L = []; }
  if (!L.length) return [w('ca_w_board'), w('nav_contracts').toLowerCase(), w('ca_w_calendar'), w('ca_wall_draft')].map(chip).join('');
  return `<span class="cn-lk-h">${_cnE(_cnT('cn_lk_head'))}</span>${chip(w('ca_w_board'))}`
    + L.map(t => `<button type="button" class="cn-chip cn-lk" data-cn-lk="${_cnE(t.r.key)}" ${t.attrs}>${_cnE(t.words)}</button>`).join('');
}
/* THE TWO-ROW CARD's one builder (components.js), read where it is drawn;
   a page loaded without it (a test's one-file world) draws the bare parts */
const _cnJbCard = o => (typeof jamboCardHtml === 'function') ? jamboCardHtml(o) : `${o.field || ''}${o.ctx || ''}${o.send || ''}${o.tail || ''}`;
const _cnJbSend = (a, l, o = {}) => (typeof jamboSendHtml === 'function') ? jamboSendHtml(a, l, o) : `<button type="${o.submit ? 'submit' : 'button'}" ${a || ''} aria-label="${l}" title="${o.title || l}"></button>`;

/* ---- MORNING LIGHT: THE COUNTS AS COLOURED WORDS (round 2 of the Legora way, owner picked "Morning light", 31 Oct 2026) ----
   Under the greeting, the one desk's own counts (ndRead) as words you can press: late in ruby, waiting on you in amber,
   prepared by Jambo in violet; a count of nothing is not drawn. Each opens the Board's Needs you on that list (ndOpenBoard).
   A dot and a word, never the colour alone. Counted from the desk; no call. */
function cnCountsHtml(D){
  /* the new look's (owner, 31 Oct 2026): today's Home draws no counts line */
  if (!(typeof newLookOn === 'function' && newLookOn())) return '';
  const you = ndThings(D.you), jb = ndThings(D.jambo);
  const one = (tone, tab, n, key) => n ? `<button type="button" class="cn-ct is-${tone}" data-cn-count="${tab}"><i aria-hidden="true"></i>${_cnE(_cnT(key, { n }))}</button>` : '';
  const html = one('ruby', 'all', D.late, 'cn_ct_late') + one('amber', 'you', you, 'cn_ct_you') + one('violet', 'jambo', jb, 'cn_ct_jambo');
  /* the doors above the box (round 1) share this line on Home, at its end, so the card grows by one line, not two */
  const ways = (typeof jamboWaysHtml === 'function' && typeof jamboWaysHere === 'function') ? jamboWaysHtml(jamboWaysHere(), 'is-home') : '';
  return `<div class="cn-counts" id="cn-counts"${html || ways ? '' : ' hidden'}>${html}${ways}</div>`;
}
/* ---- YOUR WEEK (round 2 of the Legora way, Morning light; owner, 31 Oct 2026: "build both") ----
   Seven days from today as seven dots under the counts, read from the Calendar's own reading (calendarEvents)
   and the one desk's late count; nothing is moved or stored. Today is red while anything is late; a day with a
   decision or an end date amber; a day with one of our duties due green; nothing grey. The words at the line's end
   say the same. A day with something on it opens the Calendar's agenda ON that day (navLandWhen); today, red with
   nothing dated, opens what is late (the count's own door). An empty day is not a button. */
const CN_WEEK_DAYS = 7;
function cnWeekOf(D){
  if (typeof calendarEvents !== 'function' || typeof calToday !== 'function') return null;
  /* this week, Monday to Sunday, as drawn; today is marked where it falls */
  const today = calToday(), td = new Date(today + 'T00:00:00'), t0 = new Date(td.getFullYear(), td.getMonth(), td.getDate() - ((td.getDay() + 6) % 7));
  const iso = d => { const x = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const days = Array.from({ length: CN_WEEK_DAYS }, (_, i) => iso(i));
  let evs = [];
  /* the days already gone this week stay plain: what was missed on them is late, and said on today */
  try { evs = calendarEvents().filter(e => e && e.date >= today && e.date <= days[CN_WEEK_DAYS - 1]
    && (e.type === 'renewal' || e.type === 'expiry' || (e.type === 'obligation' && !e.done && !e.theirs && !e.waiting))); } catch (_){ evs = []; }
  return days.map(d => {
    const E = evs.filter(e => e.date === d);
    const decide = E.filter(e => e.type === 'renewal').length, ends = E.filter(e => e.type === 'expiry').length, due = E.filter(e => e.type === 'obligation').length;
    const late = d === today && !!(D && D.late);
    return { iso: d, today: d === today, late, decide, ends, due, n: E.length,
      tone: late ? 'ruby' : (decide || ends) ? 'amber' : due ? 'green' : 'none' };
  });
}
function cnWeekHtml(D){
  if (!(typeof newLookOn === 'function' && newLookOn())) return '';
  const W = cnWeekOf(D); if (!W) return '';
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  const dow = d => new Date(d.iso + 'T00:00:00').toLocaleDateString(loc, { weekday: 'short' }).replace(/\.$/, '');
  const list = f => W.filter(f).map(dow).join(', ');
  const say = [W.some(d => d.late) ? _cnT('cn_wk_late') : '',
    W.some(d => d.decide) ? _cnT('cn_wk_decide', { days: list(d => d.decide) }) : '',
    W.some(d => d.ends) ? _cnT('cn_wk_ends', { days: list(d => d.ends) }) : '',
    W.some(d => d.due) ? _cnT('cn_wk_due', { days: list(d => d.due) }) : ''].filter(Boolean).join(' · ') || _cnT('cn_wk_none');
  const day = d => {
    const inner = `<b>${_cnE(dow(d))}</b><i class="is-${d.tone}" aria-hidden="true"></i>`;
    const go = d.n ? `data-cn-wk="${d.iso}"` : d.late ? 'data-cn-count="all"' : '';
    if (!go) return `<span class="cn-wk-d${d.today ? ' is-today' : ''}">${inner}</span>`;
    const tip = d.n ? _cnT('cn_wk_open', { day: new Date(d.iso + 'T00:00:00').toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }) }) : _cnT('cn_wk_open_late');
    return `<button type="button" class="cn-wk-d${d.today ? ' is-today' : ''}" ${go} title="${_cnE(tip)}">${inner}</button>`;
  };
  return `<div class="cn-week" id="cn-week" role="group" aria-label="${_cnE(_cnT('cn_wk_title'))}"><span class="cn-wk-t">${_cnE(_cnT('cn_wk_title'))}</span>${W.map(day).join('')}<span class="cn-wk-say">${_cnE(say)}</span></div>`;
}
/* a day pressed: the Calendar, on its agenda, landed ON that day's row (the one lander, nothing pressed) */
function cnWeekGo(iso){
  if (typeof hbOpenCalendar !== 'function') return;
  hbOpenCalendar();
  if (typeof calSetView === 'function') try { calSetView('agenda'); } catch (_){}
  const find = () => document.querySelector(`#hb-cal [data-cal-ag-day="${String(iso).replace(/[^0-9-]/g, '')}"]`);
  if (typeof navLandWhen === 'function') navLandWhen(find, _cnT('cn_wk_missing'));
}
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
  const open = quiet ? dkTabs().slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(t => deskTabLabel(t.k)).slice(0, CN_PICK_UP) : [];
  const pick = open.length ? `<section class="cn-card"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('cn_pick_up'))}</span></header>${open.map(t =>
    `<div class="cn-r"><div class="cn-w"><b>${_cnE(deskTabLabel(t.k))}</b></div><button type="button" class="ui-btn ui-btn-sm" data-dk-go="${_cnE(t.k)}">${_cnE(_cnT('cn_open'))}</button></div>`).join('')}</section>` : '';
  _cnSig = ndSig(D);
  return `<div class="cn-page" id="cn-page"><div class="cn-in">
    <section class="cn-card cn-ask">${cnFace(26, 'cn-face')}<h1>${_cnE(_cnT('cn_hello', { name }))}</h1>${cnCountsHtml(D)}${cnWeekHtml(D)}
      <div class="cn-wrap">${''/* THE TWO-ROW CARD (owner picked it, 20 Oct 2026): the one builder */}${_cnJbCard({ cls: 'cn-card-box', field: `<textarea id="cn-q" rows="1" autocomplete="off" spellcheck="false" placeholder="${_cnE(_cnT('cn_box_ph'))}" aria-label="${_cnE(_cnT('cn_box_label'))}"></textarea>`, send: _cnJbSend('data-cn-send', _cnT('cn_ask')) })}<div class="ca-pop cn-pop" id="cn-pop" hidden></div></div>
      <div class="cn-chips" id="cn-chips">${cnChipsHtml(D)}</div></section>
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
  /* the new look's Home, behind the switch and where Jambo's panel fits (cn2On) */
  if (cn2On()){ renderCounter2(host); if (typeof mineLoad === 'function') try { mineLoad().then(counterFollow, () => {}); } catch (_){} return; }
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
  /* the look changed under a Home already drawn (the switch turned on or off): Home is drawn again whole, in the look now on */
  if (!!document.getElementById('cn2-page') !== cn2On()){ renderCounter(); return; }
  if (document.getElementById('cn2-page')){ cn2Repaint(); return; }
  const card = document.getElementById('cn-needs'); if (!card) return;
  const t = document.createElement('div'); t.innerHTML = counterHtml();
  const fresh = t.querySelector('#cn-needs'); if (fresh) card.replaceWith(fresh);
  const cts = document.getElementById('cn-counts'), fct = t.querySelector('#cn-counts');
  if (cts && fct && cts.outerHTML !== fct.outerHTML) cts.replaceWith(fct);
  const wk = document.getElementById('cn-week'), fwk = t.querySelector('#cn-week');
  if (wk && fwk && wk.outerHTML !== fwk.outerHTML) wk.replaceWith(fwk);
  const chips = document.getElementById('cn-chips'), fc = t.querySelector('#cn-chips');
  if (chips && fc && chips.innerHTML !== fc.innerHTML) chips.innerHTML = fc.innerHTML;
}
/* asked after the side's counts are worked out (updateSidebarCounts) and when
   My notes arrive: the Counter is drawn again only where what it lists moved */
function counterFollow(){
  if (typeof state === 'undefined' || !state || state.view !== 'counter' || !(document.getElementById('cn-needs') || document.getElementById('cn2-page'))) return;
  let sig = ''; try { sig = ndSig(ndRead()); } catch (_){ return; }
  if (sig !== _cnSig) counterRepaint();
}

/* THE BOX: a place opens on the desk; anything else is Jambo's, beside the
   page — the one reader every Jambo box uses (caAskAnywhere), with the
   Counter's own rule that a question goes to Home's Jambo too */
function counterAsk(text, opts = {}){
  const t = String(text || '').trim(); if (!t) return false;
  /* a request to book or find time goes to the Calendar's own Jambo with its words (18 Oct 2026, #342) */
  if (typeof igBookAsk === 'function' && igBookAsk(t) && typeof calHandOff === 'function' && calHandOff(t)) return true;
  /* HOME'S BOX READS WITH THE BRAIN FIRST (owner, 27 Oct 2026: "make the home page box go to AI first too";
     reverses "Overview's box … keep the free readers" for this one box): words TYPED here (Enter, the send
     button) are the Board's Jambo tab's — the Board opens on his tab and the chat reads the whole sentence, a
     page's name too (its goto lands there). A chip, a "/" row and no key keep the free readers, never a dead box. */
  /* …but a page's one name moves you there, free (owner, 28 Oct 2026, "Door above the box": "Only real page names move you") */
  if (opts.typed && typeof jamboPageGo === 'function' && jamboPageGo(t)) return true;
  if (opts.typed && counterTalkFirst()) return counterTalkAsk(t);
  return (typeof caAskAnywhere === 'function') ? caAskAnywhere(text, { all: true }) : false;
}
function counterTalkFirst(){
  try { return !!(window.caAiFirst && caAiFirst()) && typeof intelAsk === 'function' && typeof setView === 'function' && typeof hbS === 'function'; }
  catch (_){ return false; }
}
/* the Board, his tab turned to (pdTalkReopen), then the words as typed on that tab (intelAsk {typed}) */
function counterTalkAsk(t){
  const s = hbS(); s.face = 'board'; if (typeof hbSave === 'function') hbSave();
  setView('dashboard');
  let tries = 0;
  const ask = () => {
    if (document.getElementById('igd-input')){
      try { if (typeof pdTalkReopen === 'function' && !(typeof pdTalkShows === 'function' && pdTalkShows())) pdTalkReopen(); } catch (_){}
      try { intelAsk(t, { typed: true }); } catch (_){}
      return;
    }
    if (++tries < 30) setTimeout(ask, 100);
  };
  setTimeout(ask, 0);
  return true;
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
    `<div class="ca-opt${i === _cnPop.on ? ' on' : ''}" role="option" aria-selected="${i === _cnPop.on}" data-cn-pop="${i}"><span class="who"><b>${_cnE(r.word)}</b>${r.sub ? `<small>${_cnE(r.sub)}</small>` : ''}</span>${typeof caSlashGoHtml === 'function' ? caSlashGoHtml() : ''}</div>`).join('')}</div><p class="ca-hint">${_cnE(_cnT('hb_pop_keys'))}</p>`;
  el.hidden = false;
}
function counterPopClose(){ _cnPop = null; const el = document.getElementById('cn-pop'); if (el){ el.hidden = true; el.innerHTML = ''; } }
function counterPopTake(i){
  const r = _cnPop && _cnPop.rows[i]; if (!r) return;
  const q = document.getElementById('cn-q'); if (q) q.value = '';
  counterPopClose(); counterAsk(r.word);
}

/* ==== HOME, THE NEW LOOK (round 2 of the Legora way rebuilt; owner, 31 Oct 2026: "start Home", the six answers:
   one list, the box in Jambo's panel, the paper's words only where known, approvals off the week line, Jambo says only
   what he has read, his work opens in place) ====
   Drawn on the review room's Home: under the black bar the sheet (the warm top — the greeting, one sentence, the counts,
   your week — then ONE list of everything waiting, most urgent first, then its foot) and Jambo's panel beside it behind
   one line (his notes from what he has read, Likely next with each one's cost, the doors, his box). Behind the switch
   (newLookOn) and only where the panel fits (insFits); everything it reads is the one desk's (ndRead, ndParts); every
   press is an existing door. The first day (no contract yet) is its own sheet: three doors, and Jambo's set-up words. */
const CN2_SEAT = 'counter';
const CN2_RANK = { late: 0, you: 1, jambo: 2, week: 3 };
let _cn2Look = null;
function cn2On(){ return typeof newLookOn === 'function' && newLookOn() && typeof insFits === 'function' && insFits() && typeof insPaintPanel === 'function'; }
/* the one list: late, then your move, then Jambo's prepared work, then what falls this week; the desk's own order inside each */
function cn2Rows(D){
  return D.jambo.concat(D.you).filter(r => !r.setup).map((r, i) => ({ r, i, k: ndKindOfRow(r) }))
    .sort((a, b) => ((CN2_RANK[a.k] ?? 1) - (CN2_RANK[b.k] ?? 1)) || (a.i - b.i));
}
function cn2Name(){ const me = (typeof currentUser === 'function') ? currentUser() : null; return String((me && me.name) || '').trim().split(/\s+/)[0] || _cnT('home_greet_there'); }
function cn2Greet(){ const h = new Date().getHours(); return _cnT(h < 12 ? 'cn2_greet_m' : h < 18 ? 'cn2_greet_a' : 'cn2_greet_e', { name: cn2Name() }); }
/* the sentence under the greeting, counted from the list: "1 thing is late, 4 wait on you and I prepared 2 for you." */
function cn2Say(L){
  const n = k => L.filter(x => x.k === k).length;
  const parts = [n('late') ? _cnTn('cn2_s_late', n('late'), { n: n('late') }) : '', n('you') + n('week') ? _cnTn('cn2_s_you', n('you') + n('week'), { n: n('you') + n('week') }) : '',
    n('jambo') ? _cnTn('cn2_s_jambo', n('jambo'), { n: n('jambo') }) : ''].filter(Boolean);
  if (!parts.length) return _cnT('cn2_s_none');
  const s = parts.length > 1 ? parts.slice(0, -1).join(', ') + _cnT('cn2_s_and') + parts[parts.length - 1] : parts[0];
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}
/* signed this calendar month, and their value where it may be seen and added (fxCounted; a missing rate adds nothing) */
function cn2Signed(){
  const ym = (typeof todayISO === 'function' ? todayISO() : new Date().toISOString()).slice(0, 7);
  const L = (state.contracts || []).filter(c => { let d = ''; try { d = String((typeof contractSignedAt === 'function' && contractSignedAt(c)) || ''); } catch (_){ d = ''; } return d.slice(0, 7) === ym; });
  let sum = 0, code = '';
  const see = typeof canViewValues === 'function' ? canViewValues() : true;
  if (see) L.forEach(c => { const h = (typeof fxCounted === 'function') ? fxCounted(c) : (typeof fxHome === 'function' ? fxHome(c) : null); if (h && !h.missing && h.v){ sum += h.v; code = code || (typeof fxHomeCode === 'function' ? fxHomeCode() : h.code); } });
  return { ids: L.map(c => c.id), n: L.length, value: sum && see && typeof fmtMoneyShortIn === 'function' ? fmtMoneyShortIn(sum, code) : '' };
}
function cn2CountsHtml(L){
  const n = k => L.filter(x => x.k === k).length, S = cn2Signed();
  const one = (tone, num, words, attr) => num ? `<button type="button" class="cn-ct is-${tone}" ${attr}><i aria-hidden="true"></i>${_cnE(words)}</button>` : '';
  return `<div class="cn-counts" id="cn2-counts">${one('ruby', n('late'), _cnT('cn_ct_late', { n: n('late') }), 'data-cn-count="all"')}`
    + one('amber', n('you'), _cnT('cn2_ct_you', { n: n('you') }), 'data-cn-count="you"')
    + one('violet', n('jambo'), _cnT('cn_ct_jambo', { n: n('jambo') }), 'data-cn-count="jambo"')
    + one('green', n('week'), _cnT('cn2_ct_week', { n: n('week') }), 'data-cn2-cal')
    + one('gray', S.n, S.value ? _cnT('cn2_ct_signed_v', { n: S.n, v: S.value }) : _cnT('cn2_ct_signed', { n: S.n }), 'data-cn2-signed') + `</div>`;
}
/* THE PAPER'S WORDS, ONLY WHERE THEY ARE KNOWN (owner's answer 3): their changes quote the words they propose; owed
   details name the section their blanks stand in; every other row says only what waits */
function cn2QuoteHtml(r){
  const y = r && r.y, x = y && y.x, c = x && x.c, it = x && x.it; if (!c || !it) return '';
  if (it.kind === 'quiet'){
    const chs = (Array.isArray(c.changes) ? c.changes : []).filter(ch => ch && ch.authorSide === 'counterparty' && ch.status === 'pending' && ch.newText).slice(0, 2);
    return chs.map(ch => { const lab = String(ch.clauseLabel || ''), m = lab.match(/^\s*(\d+(?:\.\d+)*)[.)]?\s*(.*)$/);
      const sec = m ? '§ ' + m[1] + (m[2] ? ' ' + m[2].charAt(0) + m[2].slice(1).toLowerCase() : '') : lab;
      const w = String(ch.newText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); const short = w.length > 70 ? w.slice(0, 69).replace(/\s+\S*$/, '') + '…' : w;
      return ` · <b class="cn2-sec">${_cnE(sec)}</b> — <q class="cn2-src">${_cnE(short)}</q>`; }).join('');
  }
  if (it.kind === 'details' && typeof contractBlanks === 'function'){
    let B = []; try { B = contractBlanks(c).filter(b => b && !b.value && b.section); } catch (_){ B = []; }
    return [...new Set(B.map(b => b.section))].slice(0, 2).map(t => ` · <b class="cn2-sec">${_cnE(t)}</b>`).join('');
  }
  return '';
}
function cn2RowHtml(x){
  const r = x.r, P = ndParts(r), jb = r.g === 'jambo', key = jb && r.it ? r.it.key : '';
  const named = !!P.name, head = named ? P.name : P.title;
  const party = P.party && !String(head).toLowerCase().includes(P.party.toLowerCase()) ? P.party : '';
  const line = jb ? [_cnE(_cnT('nd_kind_jambo')), _cnE(P.when || '')].filter(Boolean).join(' · ') : [_cnE(party), P.ref, _cnE(P.money || '')].filter(Boolean).join(' · ');
  const what = jb ? _ndText(P.line || P.read) : (named ? P.title : P.deal);
  const when = !jb && P.when ? `<span class="${P.late ? 'cn2-late' : 'cn2-when'}">${_cnE(P.when)}</span> · ` : '';
  const open = jb && _cn2Look === key;
  const verb = jb ? `<button type="button" class="ui-link nd-btn nd-link" data-cn2-look="${_cnE(key)}" aria-expanded="${open}">${_cnE(_cnT(open ? 'cn2_close' : 'nd_btn_review'))}</button>` : _ndLinkHtml(P);
  const look = open ? `<div class="cn2-look" data-hb-ag-item="${_cnE(key)}">${typeof hbNdLookHtml === 'function' ? hbNdLookHtml(r.it) : ''}</div>` : '';
  return `<div class="cn2-row${open ? ' is-open' : ''}" data-nd-row="${_cnE(r.key)}"><div class="cn2-who">${ndAvHtml(r, P)}<div class="cn2-w"><div class="cn2-nm">${_cnE(head)}</div><div class="cn2-ln">${line}</div></div></div>`
    + `<div class="cn2-fx">${ndKindHtml(r)}${when}${_cnE(what || '')}${jb ? '' : cn2QuoteHtml(r)}</div><div class="cn2-ac">${verb}</div></div>${look}`;
}
function cn2Html(){
  if (!(state.contracts || []).length) return cn2FirstDayHtml();
  const D = ndRead(), L = cn2Rows(D);
  return `<div class="view-enter sap-page ins-page cn2-page" id="cn2-page" data-ins-page="${CN2_SEAT}" data-ins="1"><div class="ins-body">`
    + `<section class="ins-card cn2-sheet" aria-label="${_cnE(_cnT('nav_home'))}"><header class="cn2-top"><h1 class="cn2-hello">${_cnE(cn2Greet())}</h1><p class="cn2-say">${_cnE(cn2Say(L))}</p>${cn2CountsHtml(L)}${cnWeekHtml(D)}</header>`
    + `<div class="cn2-list scroll-thin" id="cn2-list">${L.length ? L.map(cn2RowHtml).join('') : `<p class="cn2-none">${_cnE(_cnT('cn_nothing'))}</p>`}</div>`
    + `<footer class="cn2-foot"><span>${_cnE(_cnTn('cn2_foot', L.length, { n: L.length }))}</span></footer></section>`
    + `<aside id="ins-panel" class="ins-panel" aria-label="${_cnE(_cnT('cn2_jambo'))}"></aside></div></div>`;
}
/* THE FIRST DAY (as drawn): nothing filed yet — three doors, each saying what it does, and the company's line */
function cn2FirstDayHtml(){
  const row = (k, ic, t, s, b, filled) => `<div class="cn2-fd"><span class="cn2-fd-i" aria-hidden="true">${typeof icon === 'function' ? icon(ic, 'w-4 h-4') : ''}</span><div class="cn2-fd-w"><div class="cn2-nm">${_cnE(_cnT(t))}</div><div class="cn2-fd-s">${_cnE(_cnT(s))}</div></div>`
    + `<button type="button" class="ui-btn${filled ? ' ui-btn-primary' : ''}" data-cn2-first="${k}">${_cnE(_cnT(b))}</button></div>`;
  const org = (typeof FIRST_PARTY !== 'undefined' && FIRST_PARTY) ? FIRST_PARTY : '';
  return `<div class="view-enter sap-page ins-page cn2-page is-first" id="cn2-page" data-ins-page="${CN2_SEAT}" data-ins="1"><div class="ins-body"><section class="ins-card cn2-sheet">`
    + `<header class="cn2-top is-plain"><h1 class="cn2-hello">${_cnE(cn2Greet())}</h1><p class="cn2-say is-strong">${_cnE(_cnT('cn2_fd_say'))}</p></header>`
    + `<div class="cn2-list" id="cn2-list"><div class="cn2-fds">${row('upload', 'filenew', 'cn2_fd_up', 'cn2_fd_up_s', 'cn2_fd_up_b', true)}${row('draft', 'pencil', 'cn2_fd_dr', 'cn2_fd_dr_s', 'cn2_fd_dr_b')}${row('import', 'upload', 'cn2_fd_im', 'cn2_fd_im_s', 'cn2_fd_im_b')}</div>${typeof pdDropTake === 'function' ? `<p class="cn2-fd-drop">${_cnE(_cnT('cn2_fd_drop'))}</p>` : ''}</div>`
    + `<footer class="cn2-foot"><span class="cn2-fd-lk"><button type="button" class="ui-link" data-cn2-go="settings">${_cnE(_cnT('cn2_fd_settings'))}</button><button type="button" class="ui-link" data-cn2-go="handbook">${_cnE(_cnT('cn2_fd_handbook'))}</button></span>`
    + `${org ? `<span>${_cnE(_cnT('cn2_fd_org', { org }))}${typeof isAdmin === 'function' && isAdmin() ? _cnE(_cnT('cn2_fd_admin')) : ''}</span>` : ''}</footer></section><aside id="ins-panel" class="ins-panel" aria-label="${_cnE(_cnT('cn2_jambo'))}"></aside></div></div>`;
}
/* JAMBO'S PANEL ON HOME: only what he has read or prepared (owner's answer 5), free; Likely next with each one's cost */
function cn2JlSay(){
  if (!(state.contracts || []).length){
    const never = ['send', 'change', 'guess'].map(k => `<div class="cn2-pr"><b>${_cnE(_cnT('cn2_never_' + k))}</b><span>${_cnE(_cnT('cn2_never_' + k + '_s'))}</span><span class="cn2-q">${_cnE(_cnT('cn2_rule'))}</span></div>`).join('');
    const once = [['settings', 'cn2_once_streams', 'cn2_once_streams_s'], ['people', 'cn2_once_people', 'cn2_once_people_s'], ['standards', 'cn2_once_std', 'cn2_once_std_s']]
      .map(([g, t, w]) => `<div class="cn2-lk"><button type="button" class="ui-link" data-cn2-go="${g}">${_cnE(_cnT(t))}</button><span class="cn2-q">${_cnE(_cnT(w))}</span></div>`).join('');
    const card = `<div class="cn2-jcard"><p>${_cnE(_cnT('cn2_fd_jb'))}</p><small>${_cnE(_cnT('cn2_fd_jb_src'))}</small></div>`;
    return { lines: [card], head: { html: card }, src: false,
      after: `<p class="cn2-eye">${_cnE(_cnT('cn2_never'))}</p>${never}<p class="cn2-eye">${_cnE(_cnT('cn2_once'))}</p>${once}` };
  }
  const D = ndRead(), L = cn2Rows(D);
  /* A PIECE OPEN UNDER ITS ROW (round 7, as drawn): his panel says what he read and what each press does — the
     week's three presses as they really work (a calendar file; put away until its dates change, Undo just after) */
  const open = _cn2Look ? D.jambo.find(r => r.it && r.it.key === _cn2Look) : null;
  if (open && open.it && open.it.kind === 'week'){
    const P = ndParts(open);
    const card = `<div class="cn2-jcard"><p>${_cnE(_cnT('cn2_wk_read', { what: _ndText(P.deal || P.line || '') }))}</p><small>${_cnE(_cnT('cn2_wk_by'))}</small></div>`;
    const pr = (a, b, c) => `<div class="pd2-ch-r"><span>${_cnE(_cnT(a))}</span><b>${_cnE(_cnT(b))}</b><i>${_cnE(_cnT(c))}</i></div>`;
    const tbl = `<div class="pd2-ch-cap">${_cnE(_cnT('cn2_wk_presses'))}</div><div class="pd2-ch-tbl">${pr('ag_a_calendar', 'cn2_wk_cal', 'cn2_free')}${pr('cn2_wk_add', 'cn2_wk_add_s', 'cn2_free')}${pr('cn2_wk_away', 'cn2_wk_away_s', 'cn2_wk_away_c')}</div>`;
    const turn = `<div class="pd2-turn"><i class="pd2-jface" aria-hidden="true"></i><div><b>${_cnE(_cnT('cn2_jambo'))}</b><p>${_cnE(_cnT('cn2_wk_plan'))}</p></div></div>`;
    return { lines: [card], head: { html: card }, src: false, after: `<div class="pd2-chosen">${tbl}${turn}</div>` };
  }
  const late = L.find(x => x.k === 'late');
  let head;
  if (late){ const P = ndParts(late.r); head = _cnT('cn2_jb_late', { what: P.name ? P.title : P.title, on: P.name || _ndText(P.deal) || '', when: P.when || '' }); }
  else if (L.length){ const P = ndParts(L[0].r); head = _cnTn('cn2_jb_first', L.length, { n: L.length, what: P.name || P.title }); }
  else head = _cnT('cn2_jb_none');
  const turns = D.jambo.slice(0, 3).map(r => { const P = ndParts(r); const k = r.it && r.it.key;
    return `<div class="cn2-turn"><span class="cn2-dot" aria-hidden="true"></span><div><b class="cn2-who-j">Jambo</b><span>${_cnE(_ndText(P.line || P.read || P.title))}</span>${k ? ` <button type="button" class="ui-link" data-cn2-look="${_cnE(k)}">${_cnE(_cnT('cn2_open_here'))}</button>` : ''}</div></div>`; }).join('');
  let lk = []; try { lk = cnLikely(D); } catch (_){ lk = []; }
  const likely = lk.length ? `<p class="cn2-eye">${_cnE(_cnT('cn_lk_head').replace(/:\s*$/, ''))}</p>` + lk.map(t => `<div class="cn2-lk"><button type="button" class="ui-link" ${t.attrs}>${_cnE(t.words.charAt(0).toUpperCase() + t.words.slice(1))}</button><span class="cn2-q">${_cnE(_cnT('cn2_free'))}</span></div>`).join('') : '';
  /* `lines` too: the panel reads a page's words through them (jlWordsHtml), and keeps the source line only with them */
  return { lines: [_cnE(head)], head: { html: _cnE(head) }, src: _cnT('cn2_jb_src'), after: turns + likely };
}
function cn2PanelPaint(){
  if (typeof insPaintPanel !== 'function' || !document.getElementById('ins-panel')) return;
  insPaintPanel({ seat: CN2_SEAT, jlSay: cn2JlSay, jlWord: _cnT('cn2_jambo'), jlHome: _cnT('cn2_jambo') });
  /* on Home the panel is his, as drawn: its tab says "Jambo", with no count (the counts stand on the page) */
  const tab = document.querySelector('#ins-panel [data-jl-home]');
  if (tab){ const w = tab.querySelector('.pd-tab-w'); if (w) w.textContent = _cnT('cn2_jambo'); tab.setAttribute('title', _cnT('cn2_jambo'));
    tab.querySelectorAll('[data-jl-n]').forEach(n => { n.hidden = true; }); }
}
function renderCounter2(host){
  const list = document.getElementById('cn2-list'), keep = list ? list.scrollTop : 0;
  host.innerHTML = cn2Html();
  cn2PanelPaint();
  const L2 = document.getElementById('cn2-list'); if (L2 && keep) L2.scrollTop = keep;
  if (typeof insWatchWidth === 'function') insWatchWidth();
  try { _cnSig = ndSig(ndRead()); } catch (_){}
}
function cn2Repaint(){ if (typeof state === 'undefined' || !state || state.view !== 'counter' || !document.getElementById('cn2-page')) return; const host = document.getElementById('content'); if (host) renderCounter2(host); }
/* a piece of Jambo's work opened in place under its row (owner's answer 6), and closed by the same press */
function cn2LookToggle(key){
  _cn2Look = _cn2Look === key ? null : key;
  if (typeof hbAgLookSet === 'function') hbAgLookSet(_cn2Look);
  cn2Repaint();
  if (_cn2Look){ const el = document.querySelector(`#cn2-list [data-hb-ag-item="${CSS.escape(_cn2Look)}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
}
function cn2FirstGo(k){
  if (k === 'upload'){ if (typeof pdDropDoor === 'function') pdDropDoor(); else if (typeof openUploadModal === 'function') openUploadModal(); return; }
  if (k === 'draft'){ if (typeof openNewAgreement === 'function') openNewAgreement(); return; }
  if (k === 'import' && typeof setView === 'function') setView('import');
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !window._cn2Wired){
  window._cn2Wired = true;
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    let el;
    if ((el = t.closest('[data-cn2-look]'))){ cn2LookToggle(el.getAttribute('data-cn2-look')); return; }
    if ((el = t.closest('#cn2-page .cn2-look'))){ if (typeof hbAgentWorkPress === 'function' && hbAgentWorkPress(t)) setTimeout(cn2Repaint, 400); return; }
    if ((el = t.closest('[data-cn2-first]'))){ cn2FirstGo(el.getAttribute('data-cn2-first')); return; }
    if ((el = t.closest('[data-cn2-go]'))){ if (typeof caGo === 'function') caGo({ kind: 'go', place: el.getAttribute('data-cn2-go'), cid: null }); return; }
    if ((el = t.closest('[data-cn2-cal]'))){ if (typeof hbOpenCalendar === 'function') hbOpenCalendar(); return; }
    if ((el = t.closest('[data-cn2-signed]'))){ const S = cn2Signed(); if (S.n && typeof regShowOnly === 'function') regShowOnly(S.ids, _cnT('cn2_ct_signed', { n: S.n })); return; }
  });
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
    if (_dkMenuOpen && !t.closest('#dk-pg-w, #dk-recent')){ _dkMenuOpen = false; deskBarPaint(); }
    /* THE ONE DESK's own presses, on Home, on the Board's card and in the bell's panel
       (a row pressed in the panel steps the panel aside before its door is taken) */
    const inPanel = !!t.closest('#panel-body .nd-pan');
    const step = () => { if (inPanel && typeof closeContextPanel === 'function') try { closeContextPanel(); } catch (_){} };
    if ((el = t.closest('[data-nd-all]'))){ ndOpenBoard(el.getAttribute('data-nd-all')); return; }
    if ((el = t.closest('[data-cn-count]'))){ ndOpenBoard(el.getAttribute('data-cn-count')); return; }
    if ((el = t.closest('[data-cn-wk]'))){ cnWeekGo(el.getAttribute('data-cn-wk')); return; }
    if ((el = t.closest('[data-nd-look]'))){ step(); ndOpenBoard('jambo', el.getAttribute('data-nd-look')); return; }
    if ((el = t.closest('[data-nd-bundle]'))){ step(); ndBundleGo(); return; }
    /* a bell signal's row presses the bell's own door; from the slide-out panel the panel steps aside first */
    if ((el = t.closest('[data-nd-al]'))){ const k = el.getAttribute('data-nd-al');
      let r = null; try { r = ndRead().you.find(x => x.key === k) || null; } catch (_){ r = null; }
      step();
      if (r && r.al && typeof r.al.go === 'function') r.al.go(); return; }
    if (t.closest('[data-nd-fold]')){ ndFoldApply(!ndFolded()); return; }
    if ((el = t.closest('[data-nd-tab]'))){ _nd = { ..._nd, tab: el.getAttribute('data-nd-tab'), more: 0 }; ndBoardRepaint(); return; }
    if ((el = t.closest('[data-nd-kind]'))){ _nd = { ..._nd, kind: el.getAttribute('data-nd-kind'), more: 0 }; ndBoardRepaint(); return; }
    if ((el = t.closest('[data-nd-more]'))){ _nd = { ..._nd, more: (_nd.more || 0) + 1 }; ndRowsRepaint(); return; }
    /* a row of your move on the Board's card presses the same door as on Home */
    if (!t.closest('#cn-page') && !t.closest('#hm-agents.nd-card') && !inPanel) return;
    if (inPanel && t.closest('[data-cn-note],[data-cn-watch],[data-cn-req],[data-cn-need],[data-cn-setup],[data-cn-co]')) step();
    if ((el = t.closest('[data-cn-pop]'))){ counterPopTake(Number(el.getAttribute('data-cn-pop'))); return; }
    if (_cnPop && !t.closest('.cn-wrap')) counterPopClose();
    if ((el = t.closest('[data-cn-send]'))){ const q = document.getElementById('cn-q'); if (q){ const v = q.value; q.value = ''; counterBoxFit(q); counterPopClose(); counterAsk(v, { typed: true }); } return; }
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
      if (e.key === 'Enter'){ e.preventDefault(); if (_cnPop){ counterPopTake(_cnPop.on); return; } const v = t.value; t.value = ''; counterBoxFit(t); counterAsk(v, { typed: true }); return; }
      if (e.key === 'Escape'){ if (_cnPop) counterPopClose(); else { t.value = ''; counterBoxFit(t); } }
      return;
    }
    /* Recent: Esc closes it and hands the keyboard back to the page's name; the arrows walk its rows */
    if (_dkMenuOpen && t && t.closest && t.closest('#dk-pg-w, #dk-recent')){
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

Object.assign(window, { deskStepBack, counterWorkByAgent, cnRows, cnNeedShort, cnLikely, cnLikelyWords, CN_LIKELY_MAX, cnReqWhat, CN_REQ_WHAT_RE, counterFollow, cnLand,
  deskShellOn, DK_KEY, DK_RECENT, DK_SETTLE_MS, deskKeyNow, deskTabLabel, deskPageName, deskSheetUp, deskSheetFrom, deskSheetBackTo, deskTabsSync, deskRecentRows, deskRecentHtml, deskBarPaint, deskRecentToggle, deskBackTarget, deskGoBack, deskTabOpen, deskTabClose, deskGoCounter,
  ND_PAGE, ND_BUNDLE_MIN, ND_MERGE, ND_KINDS, ND_NEWS, ndIsNews, ndAlerts, ndAlCovered, ndPieces, ndJamboFor, ndRead, ndOnBoard, ndParts, ndSumWords, ndHomeHtml, cnCountsHtml, CN_WEEK_DAYS, cnWeekOf, cnWeekHtml, cnWeekGo, ndAvHtml, ndKindOfRow, ndKindHtml, CN2_SEAT, CN2_RANK, cn2On, cn2Rows, cn2Say, cn2Signed, cn2CountsHtml, cn2QuoteHtml, cn2RowHtml, cn2Html, cn2FirstDayHtml, cn2JlSay, cn2PanelPaint, renderCounter2, cn2Repaint, cn2LookToggle, ndPanelHtml, ndBellNlHtml, ndBoardHtml, ndBoardRowsHtml, ndRowsRepaint, ndShow, ndOpenBoard, ndPlace, ndPlacePut, ndBundleGo, ndFolded, ndFoldSet, ndFoldBtnHtml, ndFoldApply,
  CN_ROWS, renderCounter, counterHtml, counterRepaint, counterAsk, counterTalkFirst, counterTalkAsk, counterNeedsCount, counterPopRead, counterPopClose });

/* THE FIRST DAY TAKES A DROPPED FILE ANYWHERE ON THE PAGE (round 7, as drawn): the drop area's own reader (pdDropTake) */
if (typeof document !== 'undefined' && !document._cn2FdDrop){ document._cn2FdDrop = true;
  document.addEventListener('dragover', e => { if (e.target && e.target.closest && e.target.closest('#cn2-page.is-first') && typeof pdDropTake === 'function'){ e.preventDefault(); } });
  document.addEventListener('drop', e => { const pg = e.target && e.target.closest && e.target.closest('#cn2-page.is-first'); if (!pg || typeof pdDropTake !== 'function') return;
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return; e.preventDefault(); pdDropTake(f, {}); });
}
