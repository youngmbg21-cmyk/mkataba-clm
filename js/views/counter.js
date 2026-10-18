/* ============================================================
   THE COUNTER AND THE DESK TABS (owner picked "Front desk", with Jambo's
   work first in line, and "Desk tabs", 17 Oct 2026 — Rounds 1 and 2 of the
   Counter redesign)
   ============================================================
   THE COUNTER is the first screen after signing in on a computer: Jambo's
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

   THE DESK TABS take the left menu's place on a computer: every page a
   person opens stays as a small tab after "‹ The counter", six in sight and
   the rest behind "+N more" (a press there opens the list, pressed again it
   closes), × puts one away, and they come back on a refresh — kept per
   person in this browser under their own key. ONE builder (deskTabsHtml),
   two hosts: Home's head row, in the place of its greeting and faces so the
   paper does not move down, and the shell's row above every other page.
   The phone keeps its own screens and draws neither.
   ============================================================ */

const _cnE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _cnT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _cnTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;

/* The Counter and the tabs are the computer's; below 768 the phone draws its own. */
function deskShellOn(){
  try { return !(typeof window.mPhone === 'function' && window.mPhone()); } catch (_){ return true; }
}

/* ---------------- THE DESK TABS ---------------- */
const DK_KEY = 'hati.v1.deskTabs';
const DK_SHOW = 6;     // tabs in sight; the rest wait behind "+N more"
const DK_KEEP = 24;    // tabs remembered at most; the longest unused go first
let _dkMoreOpen = false;
function dkWho(){ const me = (typeof currentUser === 'function') ? currentUser() : null; return String((me && me.id) || 'me'); }
function dkAll(){ try { const v = JSON.parse(localStorage.getItem(DK_KEY) || '{}'); return (v && typeof v === 'object') ? v : {}; } catch (_){ return {}; } }
function dkTabs(){ const t = dkAll()[dkWho()]; return Array.isArray(t) ? t.filter(x => x && typeof x.k === 'string') : []; }
function dkSave(L){
  try {
    const all = dkAll();
    const keep = L.length > DK_KEEP ? L.slice().sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, DK_KEEP).map(t => t.k) : null;
    all[dkWho()] = keep ? L.filter(t => keep.includes(t.k)) : L;
    localStorage.setItem(DK_KEY, JSON.stringify(all));
  } catch (_){}
}
/* Which page the reader is on, as a tab: a face of Home, a contract on
   Home's paper, or any other page. The Counter itself is never a tab. */
const DK_HOME_FACE = { board: 'home:board', calendar: 'home:calendar', explorer: 'home:explorer' };
function deskKeyNow(){
  if (typeof state === 'undefined' || !state || !state.view || state.view === 'counter') return null;
  const v = state.view;
  if (v === 'dashboard'){
    const f = (typeof hbFace === 'function') ? hbFace() : 'board';
    if (f === 'paper'){ const c = (typeof pdContract === 'function') ? pdContract() : null; return c ? 'c:' + c.id : 'home:contracts'; }
    /* a contract brought up is its own page, on its contract's tab (round 7) */
    if (f === 'board' && typeof window.bsCardId === 'function'){ const id = window.bsCardId(); if (id) return 'c:' + id; }
    return DK_HOME_FACE[f] || 'home:board';
  }
  if (v === 'workspace' || v === 'doc') return state.activeId ? 'c:' + state.activeId : null;
  return 'v:' + v;
}
/* A tab's name, read when it is drawn, so it follows the reader's language. */
const DK_VIEW_WORD = { redline: 'nav_negotiations', customers: 'nav_customers', approvals: 'nav_approvals', obligations: 'nav_obligations',
  mynotes: 'nav_mynotes', intel: 'nav_insights', jambo: 'nav_jambo', templates: 'nav_tpl_std', playbook: 'nav_tpl_std', migration: 'nav_import',
  intake: 'nav_intake', directory: 'nav_directory', team: 'nav_settings_rules', brain: 'nav_brain', register: 'nav_contracts' };
function deskTabLabel(k){
  k = String(k || '');
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
/* Asked after every page is drawn, every face turned and every paper put up.
   The row is drawn at once; the page is KEPT as a tab only once it has
   settled, so a door that passes through the Board on its way to a paper
   leaves one tab, not two. */
const DK_SETTLE_MS = 300;
let _dkNoteT = 0;
function deskTabsSync(){
  if (!deskShellOn()) return;
  deskTabsPaint();
  clearTimeout(_dkNoteT);
  _dkNoteT = setTimeout(() => {
    const k = deskKeyNow();
    if (k){
      const L = dkTabs(); let t = L.find(x => x.k === k);
      if (t) t.at = Date.now(); else { t = { k, at: Date.now() }; L.push(t); }
      /* ONE TAB PER CONTRACT, two ways to read it (round 7): it remembers
         whether its page or its paper was in front */
      if (k.startsWith('c:')) t.view = (typeof window.bsCardId === 'function' && window.bsCardId() && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'board') ? 'card' : 'paper';
      dkSave(L);
    }
    deskTabsPaint();
  }, DK_SETTLE_MS);
}
function deskTabsHtml(){
  const now = deskKeyNow();
  let L = dkTabs().filter(t => deskTabLabel(t.k));
  /* the page in front is drawn as a tab before it is kept */
  if (now && !L.some(t => t.k === now) && deskTabLabel(now)) L = L.concat([{ k: now, at: Date.now() }]);
  const inSight = new Set(L.slice().sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, DK_SHOW).map(t => t.k));
  if (now) inSight.add(now);
  const shown = L.filter(t => inSight.has(t.k)), rest = L.filter(t => !inSight.has(t.k));
  const tab = t => {
    const on = t.k === now, w = deskTabLabel(t.k), away = _cnT('dk_put_away', { what: w });
    return `<span class="dk-tab${on ? ' is-on' : ''}"><button type="button" class="dk-go" data-dk-go="${_cnE(t.k)}"${on ? ' aria-current="page"' : ''} title="${_cnE(w)}">${_cnE(w)}</button><button type="button" class="dk-x" data-dk-x="${_cnE(t.k)}" title="${_cnE(away)}" aria-label="${_cnE(away)}">×</button></span>`;
  };
  const more = rest.length ? `<span class="dk-more-w"><button type="button" class="dk-more" data-dk-more aria-expanded="${_dkMoreOpen}">${_cnE(_cnT('dk_more', { n: rest.length }))}</button>${_dkMoreOpen
    ? `<div class="dk-menu" role="menu">${rest.map(t => `<button type="button" role="menuitem" data-dk-go="${_cnE(t.k)}">${_cnE(deskTabLabel(t.k))}</button>`).join('')}</div>` : ''}</span>` : '';
  return `<nav class="dk-tabs" aria-label="${_cnE(_cnT('dk_tabs_label'))}"><button type="button" class="dk-back" data-dk-counter>‹ ${_cnE(_cnT('dk_counter'))}</button>${shown.map(tab).join('')}${more}</nav>`;
}
/* the two hosts: Home's head row draws its own (hbHeadHtml), the shell's row the rest */
const _dkPainted = new Map();
function deskTabsPaint(){
  const on = deskShellOn();
  const v = (typeof state !== 'undefined' && state) ? state.view : '';
  const row = document.getElementById('dk-row');
  if (row){
    /* a contract's own page by name (the room, the Negotiate page's bench) draws no row:
       its paper may not move down (the Six Questions' third); the Ha mark and the page's
       own way back stay */
    const paper = v === 'workspace' || v === 'doc' || (v === 'redline' && !!document.querySelector('#content .redline-page .rl-grid'));
    const show = on && !!v && v !== 'counter' && v !== 'dashboard' && !paper;
    /* the row's height is the page's to know: a page that owns its height reads --view-h */
    if (row.hidden === show){ row.hidden = !show; if (typeof syncViewHeight === 'function') try { syncViewHeight(); } catch (_){} }
    const h = show ? deskTabsHtml() : '';
    if (_dkPainted.get(row) !== h){ row.innerHTML = h; _dkPainted.set(row, h); }
  }
  const home = document.getElementById('dk-home');
  if (home){ const h = on ? deskTabsHtml() : ''; if (_dkPainted.get(home) !== h || !home.firstChild){ home.innerHTML = h; _dkPainted.set(home, h); } }
  /* A PRESS THAT REDRAWS THE ROW KEEPS THE KEYBOARD WHERE IT WAS: the tab pressed a moment
     ago gets focus back, never the top of the page */
  if (_dkFocus && Date.now() - _dkFocus.at < DK_FOCUS_MS){
    const a = document.activeElement;
    if (!a || a === document.body){
      const host = (row && !row.hidden) ? row : home;
      const b = host && host.querySelector(`[data-dk-go="${(window.CSS && CSS.escape) ? CSS.escape(_dkFocus.k) : _dkFocus.k}"]`);
      if (b) try { b.focus({ preventScroll: true }); } catch (_){}
    }
  }
}
const DK_FOCUS_MS = 2000;
let _dkFocus = null;   // { k, at }: the tab the keyboard was on
/* a tab's press: the door that already opens that page */
function deskTabOpen(k){
  k = String(k || ''); _dkMoreOpen = false;
  if (k.startsWith('home:')){
    const f = k.slice(5);
    if (f === 'contracts' && typeof hbOpenContracts === 'function'){ hbOpenContracts(); return true; }
    if (f === 'calendar' && typeof hbOpenCalendar === 'function'){ hbOpenCalendar(); return true; }
    if (f === 'explorer' && typeof hbOpenExplorer === 'function'){ hbOpenExplorer(); return true; }
    if (typeof hbS !== 'function') return false;
    /* the Board tab is the Board, not a contract's page on it (round 7) */
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
/* × puts a tab away; the page in front goes to the tab used last, else the Counter */
function deskTabClose(k){
  const L = dkTabs(); const i = L.findIndex(t => t.k === k); if (i < 0) return;
  const wasNow = deskKeyNow() === k;
  /* a contract's page put away is let go, as its own × did (round 7) */
  if (L[i].view === 'card' && typeof bsStripClose === 'function') bsStripClose(k.slice(2));
  L.splice(i, 1); dkSave(L);
  if (wasNow){
    const next = L.slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0];
    if (next) deskTabOpen(next.k); else deskGoCounter();
  }
  deskTabsPaint();
}
function deskGoCounter(){ _dkMoreOpen = false; if (typeof setView === 'function') setView('counter'); }

/* ---------------- THE COUNTER ---------------- */
const CN_ROWS = 7;          // contract rows in sight; "Show all N" brings the rest
const CN_POP_MAX = 40;      // every place; the list scrolls, and typing narrows it
const CN_PICK_UP = 3;       // open pages offered on a quiet day
/* words Jambo answers with a card beside the page, not a move */
const CN_ASKS_JAMBO = ['share', 'draft', 'help', 'next'];
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

/* THE BOX: a place opens on the desk; anything else is Jambo's, beside the page */
function counterAsk(text){
  const t = String(text || '').trim(); if (!t) return false;
  let a = null; try { a = (typeof caReadPlace === 'function') ? caReadPlace(t) : null; } catch (_){ a = null; }
  if (a && a.kind === 'go' && !CN_ASKS_JAMBO.includes(a.place) && typeof caGo === 'function' && caGo(a)) return true;
  if (typeof hbS !== 'function' || typeof setView !== 'function') return false;
  /* drafting is the wall's (where his New agreement card stands); the rest is asked on the Board */
  const toWall = !!(a && a.place === 'draft') || (typeof caIsDraftAsk === 'function' && caIsDraftAsk(t));
  if (toWall && typeof hbOpenContracts === 'function') hbOpenContracts();
  else { const s = hbS(); s.face = 'board'; if (typeof hbSave === 'function') hbSave(); setView('dashboard'); }
  let tries = 0;
  const ask = () => {
    if (document.getElementById('igd-input') && typeof intelAsk === 'function'){ try { intelAsk(t); } catch (_){} return; }
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
    if ((el = t.closest('[data-dk-counter]'))){ deskGoCounter(); return; }
    if ((el = t.closest('[data-dk-x]'))){ deskTabClose(el.getAttribute('data-dk-x')); return; }
    if ((el = t.closest('[data-dk-go]'))){ deskTabOpen(el.getAttribute('data-dk-go')); return; }
    if ((el = t.closest('[data-dk-more]'))){ _dkMoreOpen = !_dkMoreOpen; deskTabsPaint(); return; }
    if (_dkMoreOpen && !t.closest('.dk-more-w')){ _dkMoreOpen = false; deskTabsPaint(); }
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
  document.addEventListener('focusin', e => { const b = e.target && e.target.closest && e.target.closest('[data-dk-go]');
    _dkFocus = b ? { k: b.getAttribute('data-dk-go'), at: Date.now() } : null; });
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
    if (e.key === 'Escape' && _dkMoreOpen){ _dkMoreOpen = false; deskTabsPaint(); return; }
    /* "/" on the Counter, anywhere but a box, starts the list */
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && typeof state !== 'undefined' && state && state.view === 'counter'
      && !(t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]'))){
      const q = document.getElementById('cn-q'); if (!q) return;
      e.preventDefault(); q.value = '/'; try { q.focus(); } catch (_){} counterPopRead(q);
    }
  });
}

Object.assign(window, { deskShellOn, DK_KEY, DK_SHOW, DK_SETTLE_MS, deskKeyNow, deskTabLabel, deskTabsSync, deskTabsHtml, deskTabsPaint, deskTabOpen, deskTabClose, deskGoCounter,
  CN_ROWS, renderCounter, counterHtml, counterRepaint, counterAsk, counterNeedsCount, counterPopRead, counterPopClose });
