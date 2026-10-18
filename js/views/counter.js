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
const CN_ROWS = 7;          // rows in sight; "Show N more" brings the rest
const CN_POP_MAX = 40;      // every place; the list scrolls, and typing narrows it
const CN_PICK_UP = 3;       // open pages offered on a quiet day
/* words Jambo answers with a card beside the page, not a move */
const CN_ASKS_JAMBO = ['share', 'draft', 'help', 'next'];
let _cnAll = false;
/* JAMBO'S WORK OPENS IN PLACE (round 23 of the redesign: the owner picked
   "Open in place" by name, 17 Oct 2026, and kept the word "Put away"): the
   first row of Needs you opens where it is — each prepared piece a row (what
   it is, the contract, one line) with Look · its own acts · Put away, the
   acts the house's own (agPanelActs → agRunAct, the one runner); Look opens
   the piece's whole body under its row. The house is one link away. Per
   sitting; nothing is sent or filed until a press.
   AS DRAWN (round 23's gaps, 18 Oct 2026, the owner's "build all the gaps"):
   each piece's row is its room's coloured tag, what it is in a few words, its
   reference and ONE sentence (agPieceTitle · agPieceRefHtml · agPieceLine);
   then Look, its ONE act (agRowActOf: Answer on Redlines, Fill in 3 details,
   Decide the renewal, Send the chase, Check the 3 files) and Put away — on
   every piece. Look stays "Look", pressed; its act is the filled button while
   the piece is open (one filled button per area: the open piece is the area).
   Look on a chase is the email whole (agLookHtml). Under the pieces, how far
   the seven agents may go and who set it (agLevelsSaid), with Ask an admin. */
let _cnJwOpen = false, _cnJwLook = null;
const CN_JW_MAX = 8;
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
   request rows). The urgent first; within that, each list's own order. An
   approval answered for somebody away carries whom for (approvalAnswersFor). */
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
  return out.map((y, i) => ({ y, i })).sort((a, b) => (Number(b.y.urgent) - Number(a.y.urgent)) || (a.i - b.i)).map(o => o.y);
}
/* WHAT WAITS FOR YOU, BY AGENT — the Counter's own count of Jambo's work
   (cnWork: the pieces it lists, each agent's pill) for anybody else who says
   it. Jambo's house says it on Your desk ("5 waiting for you") and in each
   room ("1 waiting for you"), and those words open the work here
   (counterOpenWork) — one reading, so the house and the Counter never
   disagree (round 23's gaps, second pass: the house counted its own record
   and the approvals desk, which the Counter never lists). */
function counterWorkByAgent(){
  const A = cnWork(), by = {};
  (A.rows || []).forEach(r => { if (r && r.k) by[r.k] = Number(r.pill != null ? r.pill : r.n) || 0; });
  return { ready: Number(A.ready) || 0, by };
}
/* the house's "waiting for you" lands here: the Counter, Jambo's work open,
   the agent's first piece in sight when one was named */
function counterOpenWork(k){
  _cnJwOpen = true; _cnJwLook = null;
  if (typeof setView === 'function') setView('counter');
  cnStatusWanted();
  const go = () => {
    const A = cnWork(), row = k ? (A.rows || []).find(r => r.k === k) : null, key = row && row.items && row.items[0] && row.items[0].key;
    const el = (key && document.querySelector(`[data-cn-ag-item="${(window.CSS && CSS.escape) ? CSS.escape(key) : key}"]`)) || document.getElementById('cn-jw-list');
    if (el && el.scrollIntoView) try { el.scrollIntoView({ block: 'nearest' }); } catch (_){}
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go); else go();
}
/* the number on "Needs you" is the rows under it: Jambo's work while he has
   prepared any, each owed row, and the admin's one row */
function counterNeedsCount(){ return (cnWork().ready ? 1 : 0) + cnRows().length + ((cnSetup() || cnCompany().length) ? 1 : 0); }

function cnFace(size, cls){ return (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', size, cls) : ''; }
function cnJwRowHtml(A){
  const n = A.ready || 0;
  const who = [...new Set((A.rows || []).map(r => r.who || r.sum).filter(Boolean))].slice(0, 4);
  const open = _cnJwOpen && n > 0;
  /* open, it says in its head what the drawing says: "· 5 prepared · nothing
     sent or filed until you press"; folded, whose work it is */
  const lead = n ? _cnTn('cn_jw_n', n, { n }) : _cnT('cn_jw_none');
  return `<div class="cn-r cn-jw${open ? ' is-open' : ''}">${cnFace(24, 'cn-r-face')}<div class="cn-w"><b>${_cnE(_cnT('cn_jw'))} <span class="cn-n">· ${_cnE(lead)}${open ? ' · ' + _cnE(_cnT('cn_jw_said')) : ''}</span></b>${open ? '' : `<span>${_cnE(n ? who.join(' · ') : _cnT('cn_jw_rest'))}</span>`}</div><button type="button" class="ui-btn ui-btn-sm" data-cn-jw aria-expanded="${open ? 'true' : 'false'}">${_cnE(_cnT(open ? 'cn_close' : 'cn_open'))}</button></div>${open ? cnJwPiecesHtml(A) : ''}`;
}
function cnJwPiecesHtml(A){
  const keys = (A.rows || []).flatMap(r => (r.items || []).map(x => x.key));
  const its = keys.map(k => (typeof agFind === 'function') ? agFind(k) : null).filter(Boolean);
  const shown = its.slice(0, CN_JW_MAX);
  const T = (fn, it, d) => { try { return (typeof window[fn] === 'function') ? window[fn](it) : d; } catch (_){ return d; } };
  const row = it => {
    const look = _cnJwLook === it.key;
    const title = T('agPieceTitle', it, '') || (T('agPanelTitle', it, '') || '');
    const line = T('agPieceLine', it, '') || ((T('agCardParts', it, {}) || {}).sum || '');
    const ref = T('agPieceRefHtml', it, '');
    const act = T('agRowActOf', it, null);
    const body = look ? (T('agLookHtml', it, '') || T('agPanelBody', it, '')) : '';
    const col = (typeof jhAgentColour === 'function') ? jhAgentColour(it.agent) : '';
    const tag = `<span class="cn-jw-tag"${col ? ` style="--c:${_cnE(col)}"` : ''}><i aria-hidden="true"></i>${_cnE(_cnT('ag_' + it.agent))}</span>`;
    /* ONE FILLED BUTTON PER AREA: the act is the quiet one, and the filled one
       while its piece is open under Look (the open piece is the area) */
    const actBtn = act ? `<button type="button" class="ui-btn ui-btn-sm${look ? ' ui-btn-primary' : ''}" data-ag-act="${_cnE(act.act)}">${_cnE(act.label)}</button>` : '';
    const mail = look && (it.kind === 'chase' || it.kind === 'chase-firm');
    return `<div class="cn-jw-i${look ? ' is-look' : ''}" data-cn-ag-item="${_cnE(it.key)}"><div class="cn-jw-r">
        <div class="cn-w"><b class="cn-jw-t">${tag}<span class="cn-jw-name">${_cnE(title)}</span>${ref ? `<span class="cn-jw-ref">${ref}</span>` : ''}</b><span class="cn-jw-line" title="${_cnE(line)}">${_cnE(line)}</span></div>
        <div class="cn-jw-acts"><button type="button" class="ui-link cn-jw-look${look ? ' is-on' : ''}" data-cn-look="${_cnE(it.key)}" aria-pressed="${look ? 'true' : 'false'}" aria-expanded="${look ? 'true' : 'false'}">${_cnE(_cnT('cn_jw_look'))}</button>${actBtn}<button type="button" class="ui-link" data-ag-act="away">${_cnE(_cnT('desk_discard'))}</button></div></div>
      ${look ? `<div class="cn-jw-body${mail ? ' is-mail' : ''}">${body}</div>` : ''}</div>`;
  };
  const more = its.length - shown.length;
  return `<div class="cn-jw-list" id="cn-jw-list">${shown.map(row).join('')}<div class="cn-jw-foot">${cnJwLevelsHtml()}<span class="cn-jw-sp"></span>${more > 0 ? `<span>${_cnE(_cnT('cn_jw_more', { n: more }))}</span>` : ''}<button type="button" class="ui-link" data-cn-house>${_cnE(_cnT('cn_jw_house'))}</button></div></div>`;
}
/* "All seven agents: Ask me first · set by Sara for everyone · Ask an admin"
   (round 23, "Open in place"): the levels the house keeps, in one line —
   agLevelsSaid's reading; where a person chose their own, it says so. A
   member asks an admin HERE (second pass, as drawn: "sends Sara your question
   as a request she answers; it waits in her Needs you until she does"): the
   tracked ask Settings makes (stAskDirect, the same record), sent from the
   Counter, which the reader never leaves; once sent the line says so where
   the button stood (stAskOpenOn). An admin changes it where it is set. */
let _cnLvAsking = false;
function cnLvAskState(){
  if (_cnLvAsking) return `<span class="cn-lv-asked">${(typeof busyHtml === 'function') ? busyHtml(_cnT('cn_lv_asking')) : _cnE(_cnT('cn_lv_asking'))}</span>`;
  let open = null; try { open = (typeof stAskOpenOn === 'function') ? stAskOpenOn('agents') : null; } catch (_){ open = null; }
  if (!open) return `<button type="button" class="ui-link" data-cn-lv-ask>${_cnE(_cnT('cn_lv_ask'))}</button>`;
  let who = ''; try { who = (typeof stAdminsSaid === 'function') ? stAdminsSaid() : ''; } catch (_){ who = ''; }
  return `<span class="cn-lv-asked" data-cn-lv-asked>${_cnE(who ? _cnT('cn_lv_asked', { who }) : _cnT('cn_lv_asked_any'))}</span>`;
}
async function cnLvAsk(){
  if (_cnLvAsking) return;
  const words = _cnT('cn_lv_ask_words');
  /* with no server to keep the ask (the static sample), Settings' own card says so */
  if (typeof stAskDirect !== 'function' || !(typeof API_MODE === 'function' && API_MODE())){ if (typeof stAskFrom === 'function') stAskFrom('agents', words); return; }
  _cnLvAsking = true; counterRepaint();
  try { await stAskDirect('agents', words, ''); }
  catch (e){ if (typeof toast === 'function') toast((e && e.message) || _cnT('cn_lv_ask_failed'), 'err'); }
  finally { _cnLvAsking = false; counterRepaint(); }
}
function cnJwLevelsHtml(){
  let L = null; try { L = (typeof agLevelsSaid === 'function') ? agLevelsSaid() : null; } catch (_){ L = null; }
  if (!L || !L.groups || !L.groups.length) return '';
  const lv = v => _cnT('st_agents_lv_' + v), ag = k => _cnT('ag_' + k);
  const head = L.groups.length === 1
    ? `${_cnE(L.n === 7 ? _cnT('cn_lv_all7') : _cnT('cn_lv_all', { n: L.n }))} <b>${_cnE(lv(L.groups[0].lv))}</b>`
    : L.groups.map(g => `${_cnE(g.keys.length === 1 ? _cnT('cn_lv_agent', { agent: ag(g.keys[0]) }) : _cnTn('cn_lv_n', g.keys.length, { n: g.keys.length }))} <b>${_cnE(lv(g.lv))}</b>`).join(' · ');
  const names = L.by.map(b => b.you ? _cnT('cn_lv_you') : _cnFirst(b.name)).filter(Boolean);
  const by = !names.length ? _cnT('cn_lv_start') : _cnT('cn_lv_by', { who: names.length < 2 ? names[0] : names.slice(0, -1).join(', ') + ' ' + _cnT('ag_ln_and') + ' ' + names[names.length - 1] });
  const mine = !L.mine.length ? '' : L.mine.length === 1 ? _cnT('cn_lv_mine_k', { lv: lv(L.mine[0].lv), agent: ag(L.mine[0].k) }) : _cnTn('cn_lv_mine', L.mine.length, { n: L.mine.length });
  const admin = typeof isAdmin === 'function' && isAdmin();
  const door = admin ? `<button type="button" class="ui-link" data-cn-lv-change>${_cnE(_cnT('cn_lv_change'))}</button>` : cnLvAskState();
  return `<span class="cn-lv" data-cn-levels>${head} · ${_cnE(by)}${mine ? ' · ' + _cnE(mine) : ''}</span>${door}`;
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
function cnNeedSub(y, title){
  const x = y.x, c = x.c, it = x.it;
  const bits = [];
  if (c.name) bits.push(_cnE(c.name));
  const pay = typeof fxIsPay === 'function' && fxIsPay(c);
  const party = String((pay && c.metadata && c.metadata.jobTitle) || c.counterparty || '').trim();
  if (party && !String(title).includes(party)) bits.push(_cnE(party));
  if ((it.kind === 'approval' || it.kind === 'sign') && cnMayMoney(c)) bits.push(_cnE(fmtMoneyShortOf(c)));
  const when = x.age != null ? (x.age > 0 ? _cnT('cn_waiting', { days: (typeof hbNyDays === 'function') ? hbNyDays(x.age) : x.age }) : '') : ((typeof hbNyWhen === 'function') ? hbNyWhen(x) : '');
  if (when) bits.push(it.urgent ? `<span class="cn-late">${_cnE(when)}</span>` : _cnE(when));
  return bits.join(' · ');
}
const _cnPill = (ic, words) => ` <span class="cn-pill">${(typeof icon === 'function') ? icon(ic, 'cn-pill-ic') : ''}${_cnE(words)}</span>`;
function cnNeedRowHtml(y){
  if (y.k === 'note') return cnNoteRowHtml(y);
  if (y.k === 'req') return cnReqRowHtml(y);
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
    <section class="cn-card cn-ask">${cnFace(40, 'cn-face')}<h1>${_cnE(_cnT('cn_hello', { name }))}</h1>
      <div class="cn-wrap"><div class="cn-box"><input id="cn-q" type="text" autocomplete="off" spellcheck="false" placeholder="${_cnE(_cnT('cn_box_ph'))}" aria-label="${_cnE(_cnT('cn_box_label'))}"><button type="button" class="ui-btn ui-btn-primary" data-cn-send>${_cnE(_cnT('cn_ask'))}</button></div><div class="ca-pop cn-pop" id="cn-pop" hidden></div></div>
      <div class="cn-chips" id="cn-chips">${cnChipsHtml(N)}</div></section>
    <section class="cn-card cn-needs" id="cn-needs"><header class="cn-h"><span class="cn-t">${_cnE(_cnT('hb_ny_title'))}</span><span class="cn-cnt">${n}</span>${n ? `<span class="cn-hint">${_cnE(_cnT('cn_needs_hint'))}</span>` : ''}</header>${rows}${after}${more}</section>
    ${pick}</div></div>`;
}
/* what the card was drawn from, so a list that arrives later redraws it once */
let _cnSig = '';
function cnSig(N, A){
  /* an ask of yours that arrived after the paint (Settings' list, read on its own beat) redraws the levels line too */
  let ask = ''; try { const a = (typeof stAskOpenOn === 'function') ? stAskOpenOn('agents') : null; ask = a ? String(a.id || 1) : ''; } catch (_){ ask = ''; }
  return [(A && A.ready) || 0, (A && A.rows || []).map(r => (r.items || []).map(i => i.key).join(',')).join(';'), N.map(y => y.k + ':' + y.kind + ':' + (y.x ? y.x.c.id : y.n ? y.n.id : y.r ? y.r.id : '')).join(','), ask].join('|');
}
function renderCounter(){
  const host = document.getElementById('content'); if (!host) return;
  _cnPop = null;
  host.innerHTML = counterHtml();
  /* the box takes the keys straight away where there is a keyboard to type with */
  let fine = false; try { fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); } catch (_){ fine = false; }
  if (fine) setTimeout(() => { const q = document.getElementById('cn-q'); if (q && state.view === 'counter') try { q.focus({ preventScroll: true }); } catch (_){} }, 0);
  /* WHEN SOMETHING LOADS, SOMETHING MOVES: a note due, a request, the agents'
     levels that arrive after the first paint are drawn when they come */
  if (typeof mineLoad === 'function') try { mineLoad().then(counterFollow, () => {}); } catch (_){}
  cnStatusWanted();
}
/* the agents' levels ride the agents' status, asked once a sitting */
function cnStatusWanted(){
  if (!_cnJwOpen || typeof agentsStatus !== 'function' || agentsStatus() || typeof agentsStatusLoad !== 'function') return;
  try { agentsStatusLoad().then(() => counterRepaint(), () => {}); } catch (_){}
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

/* THE BOX: a place opens on the desk; anything else is Jambo's, beside the page */
function counterAsk(text){
  const t = String(text || '').trim(); if (!t) return false;
  let a = null; try { a = (typeof caReadPlace === 'function') ? caReadPlace(t) : null; } catch (_){ a = null; }
  if (a && a.kind === 'go' && !CN_ASKS_JAMBO.includes(a.place) && typeof caGo === 'function' && caGo(a)) return true;
  /* JAMBO'S MAP (js/jambomap.js): everyday words for a page open it here as a
     place word does; a card (an act, "which did you mean?") is Jambo's, beside the Board */
  if (!a){ let m = null; try { m = (typeof jmRead === 'function') ? jmRead(t) : null; } catch (_){ m = null; }
    if (m && m.kind === 'go' && !m.missing && !CN_ASKS_JAMBO.includes(m.place) && typeof caGo === 'function' && caGo(m)) return true; }
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
    if ((el = t.closest('[data-cn-jw]'))){ _cnJwOpen = !_cnJwOpen; _cnJwLook = null; counterRepaint(); cnStatusWanted(); return; }
    if ((el = t.closest('[data-cn-look]'))){ const k = el.getAttribute('data-cn-look'); _cnJwLook = _cnJwLook === k ? null : k; counterRepaint(); return; }
    if ((el = t.closest('[data-cn-ag-item] [data-ag-act]'))){ const k = el.closest('[data-cn-ag-item]').getAttribute('data-cn-ag-item');
      if (typeof agRunAct === 'function'){ let r = null; try { r = agRunAct(k, el.getAttribute('data-ag-act')); } catch (_){ r = null; }
        Promise.resolve(r).then(() => setTimeout(counterRepaint, 0), () => setTimeout(counterRepaint, 0)); } return; }
    if ((el = t.closest('[data-cn-house]'))){ if (typeof setView === 'function') setView('jambo'); return; }
    /* how far the agents may go: a member asks an admin, here (cnLvAsk — the
       tracked ask, the admin's Needs you and bell); an admin opens the agents'
       own settings, where the level is set */
    if (t.closest('[data-cn-lv-ask]')){ cnLvAsk(); return; }
    if (t.closest('[data-cn-lv-change]')){ if (typeof openSettingsAt === 'function') openSettingsAt('company', 'agents'); return; }
    if ((el = t.closest('[data-cn-note]'))){ if (typeof myNotesOpen === 'function') myNotesOpen(el.getAttribute('data-cn-note')); return; }
    if ((el = t.closest('[data-cn-req]'))){ if (typeof intakeGoTo === 'function') intakeGoTo(el.getAttribute('data-cn-req')); return; }
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

Object.assign(window, { cnJwPiecesHtml, cnJwLevelsHtml, cnLvAsk, cnLvAskState, counterWorkByAgent, counterOpenWork, cnRows, cnNeedShort, cnReqWhat, CN_REQ_WHAT_RE, counterFollow, CN_JW_MAX, deskShellOn, DK_KEY, DK_SHOW, DK_SETTLE_MS, deskKeyNow, deskTabLabel, deskTabsSync, deskTabsHtml, deskTabsPaint, deskTabOpen, deskTabClose, deskGoCounter,
  CN_ROWS, renderCounter, counterHtml, counterRepaint, counterAsk, counterNeedsCount, counterPopRead, counterPopClose });
