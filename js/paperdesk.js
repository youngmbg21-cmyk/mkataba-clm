/* ============================================================
   THE PAPER'S DESK — one contract, worked from Home's Paper side
   (Young, 8 Oct 2026: "Yes to all decisions, build them" — the "Home first"
   proposal: the Paper becomes a desk for one contract, its readings beside
   the wording, its acts in place.)
   ============================================================
   The tabs of the Copilot panel while Home's Paper holds a contract (Header
   Icons, below) — Overview · Document · Obligations · History · Deal (Signing left, 10 Oct 2026)
   beside Copilot. EVERY TAB IS A
   READING THE CONTRACT'S OWN PAGES ALREADY MAKE, never a second copy:
   ktFactReads (the Overview), obPanelActs (the Obligations tab's acts),
   signBlockers (the list the Sign button reads), roomHistoryEvents (the
   History tab), standsHtml (where the deal stands). Acts open the product's
   own dialogs over Home; only what needs its own page leaves (the signing
   copy, Negotiate, the Overview for editing facts).
   READING MUST NOT WRITE: nothing here initialises a negotiation or saves.
   ============================================================ */
/* HEADER ICONS (Young, 8 Oct 2026, "Header Icons. Do not build yet" → "build
   all the steps"): the desk is no longer a column beside the paper. Its tabs
   are SYMBOLS in the Copilot panel's own title row, where "Intelligence panel"
   and the engine badge stood: Copilot first, then the contract room's own tabs
   under the room's own names (one view, two sizes — the Paper and the room are
   one view; Focus is the full size). The lit symbol says its name; the others
   say theirs on the hover. Off the Paper (the Board, Explorer) only Copilot's
   symbol is drawn. The engine's name rides Copilot's hover. */
/* NO SIGNING TAB (owner, 10 Oct 2026: "delete signing tab"): what stands
   before a signature is the contract's own Signing tab; an approval waiting
   on you opens on the Approvals & signing page (pdOpenOnHome). */
/* NO DEAL AND NO HISTORY TAB (owner, 11 Oct 2026: "delete the deal tab ...
   and also delete history"): the deal's progress is the contract's Where we
   are tab and its trail the History tab. A door that still asks for Deal
   lands on Clauses with their changes marked on the paper (PD_TAB_ALIAS);
   pdDealHtml and pdHistHtml have no caller and are STALE. SINCE STAGE 4 OF
   THE ONE-PAGE HOME PLAN (14 Oct 2026) they come back as Board views:
   pdOpenOnHome(id, 'deal' | 'hist') opens the Board's own (hbOpenView); the
   alias is left for a walk through several contracts on the paper. */
/* THE OVERVIEW TAB IS GONE FROM HOME'S PANEL (owner, 13 Oct 2026: "delete the
   overview tab from document page"); a door that named it lands on Jambo */
const PD_TABS = ['copilot', 'doc', 'oblig', 'menu'];
const PD_TAB_ALIAS = { deal: 'doc', hist: 'copilot', facts: 'copilot' };
/* THE ARTIFACT'S SYMBOLS, EXACTLY (owner, 10 Oct 2026: "use the Symbols that
   were in the artifact before not the ones in hati"): typed marks, each held
   to its text face (U+FE0E), never the left menu's drawings. */
const PD_TAB_GLYPH = { copilot: '\u2726', facts: '\u25A6', doc: '\u25A2', oblig: '\u2691', hist: '\u25F7', deal: '\u21C4', menu: '\u2630', findings: '\u25C7' };
const PD_TAB_ICON = PD_TAB_GLYPH;
/* the room's own words for its tabs; Copilot and Deal have no room tab */
/* THE DOCUMENT TAB IS CALLED CLAUSES (owner, 11 Oct 2026): Home's face is
   "Document" now, and this tab holds the clause list. */
const PD_TAB_NAME = { copilot: 'pd_tab_copilot', facts: 'tab_overview', doc: 'pd_tab_clauses', oblig: 'tab_obligations', hist: 'tab_history', deal: 'pd_tab_deal', menu: 'pd_tab_menu', findings: 'pd_tab_findings' };
const PD_HIST_MAX = 40;          // trail rows drawn; the rest are counted and one press away
let _pdTab = 'copilot';
const _pdActs = new Map();       // act id -> function, refilled at every paint (resolved at press time)

const _pdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _pdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _pdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;

function pdSetTab(t){ t = PD_TAB_ALIAS[t] || t; if (PD_TABS.includes(t)) _pdTab = t; }
function pdTab(){ return _pdTab; }
/* the contract's tabs are drawn only while Home's Paper holds a contract */
function pdOnPaper(){
  try { return typeof igHomePaperFace === 'function' && igHomePaperFace() === true && !!pdContract(); } catch (_){ return false; }
}
/* the panel shows a contract tab (not Copilot's conversation) */
function pdShowsDesk(){ return pdOnPaper() && _pdTab !== 'copilot'; }
function pdContract(){
  const p = (typeof intel === 'object' && intel) ? intel.paper : null;
  return p && typeof getContract === 'function' ? getContract(p.id) : null;
}
let _pdSeq = 0;
function pdAct(fn){ const id = 'a' + (++_pdSeq); _pdActs.set(id, fn); return id; }
/* LIFTED (Young picked it by name off the side-panel proposal, 8 Oct 2026,
   "build Lifted, and yes to words under the symbols"): the panel is a white
   card lifted off a soft grey ground, each symbol carries its word and, where
   work waits, its count, and every tab opens the same way — its name, a status
   pill, then tidy lists whose rows end in a link, the one filled button last.
   A ROW'S ACT IS A LINK (o.go); a button stays a button where it decides
   (Approve) or leads the tab. */
const PD_GO_ARROW = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-right"/></svg>';
function pdBtn(label, fn, o){
  o = o || {};
  const dis = o.disabled ? ` disabled aria-disabled="true"${o.why ? ` title="${_pdE(o.why)}"` : ''}` : (o.title ? ` title="${_pdE(o.title)}"` : '');
  /* o.glow: the change Copilot answered at the reader's ask — its door glows (rlPaintCopilotAnswers) */
  const glow = o.glow ? ` data-rl-glow-for="${_pdE(o.glow)}"` : '';
  if (o.go && !o.lead) return `<button type="button" class="pd-go${o.glow ? ' rl-glow' : ''}"${glow} data-pd-act="${o.disabled ? '' : pdAct(fn)}"${dis}>${_pdE(label)}${PD_GO_ARROW}</button>`;
  return `<button type="button" class="ui-btn ui-btn-sm${o.lead ? ' ui-btn-primary' : ''}" data-pd-act="${o.disabled ? '' : pdAct(fn)}"${dis}>${_pdE(label)}</button>`;
}
/* the room, on a tab — the way out where the work needs its own page */
function pdRoom(c, tab){
  return () => { if (typeof openWorkspace !== 'function') return; openWorkspace(c.id);
    if (tab && typeof roomGoTab === 'function') try { roomGoTab(getContract(c.id), tab); } catch (_){} };
}
const pdH = t => `<div class="pd-h">${_pdE(t)}</div>`;
const pdNote = t => `<p class="pd-note">${_pdE(t)}</p>`;
/* the tab's own head: its name and where it stands */
const pdPill = (tone, t) => `<span class="pd-pill is-${tone}"><i></i>${_pdE(t)}</span>`;
const pdTop = (tab, pill) => `<div class="pd-top"><h3>${_pdE(_pdT(PD_TAB_NAME[tab]))}</h3>${pill || ''}</div>`;
/* rows sit in one bordered list */
const pdList = rows => rows ? `<div class="pd-list">${rows}</div>` : '';
/* an empty tab says so in the product's one empty state */
function pdEmpty(title, ic){
  if (typeof emptyStateHtml === 'function') try { return `<div class="pd-empty">${emptyStateHtml({ title, icon: ic })}</div>`; } catch (_){}
  return pdNote(title);
}
/* THE COUNT ON A SYMBOL is the length of the list behind it, read the same
   way the tab reads it: Document = the clause list's own "N to review" (the
   marks the thread counts, docThreadMarks over the same walk), Obligations =
   the duties recorded, Deal = their changes still open. Nothing is counted
   that the tab does not draw. */
function pdTabCount(t, c){
  /* the Findings tab counts the hand-offs owed this reader, never the list */
  if (t === 'findings') return typeof igFindingsCount === 'function' ? igFindingsCount() : null;
  /* HIS TAB CARRIES THE COUNT while no paper is up (Jambo's note, 15 Oct
     2026): what needs you, the Board's "Needs you" card's own number */
  /* on the Board only, where the card is: the count walks the book, and
     Explorer, Calendar and the wall redraw this tab often (measured: the walk
     on every redraw held Explorer's still map long enough to shift its dots) */
  if (!c && t === 'copilot'){
    const onBoard = !!(window.state && state.view === 'dashboard') && (typeof hbFace === 'function') && hbFace() === 'board';
    const n = (onBoard && typeof hbNeedsCount === 'function') ? hbNeedsCount() : 0;
    return n ? { n, tone: 'warn' } : null; }
  if (!c) return null;
  /* WITH A PAPER UP HIS FACE CARRIES THE COUNTER'S OWN NUMBER (owner picked
     "Tabs and faces" by name, round 3, 17 Oct 2026): the "All N" that Needs
     you here opens, read once per paint (the list is kept for the task) */
  if (t === 'copilot'){
    const onPaper = typeof igHomePaperFace === 'function' && igHomePaperFace() === true;
    let n = 0; try { n = (onPaper && typeof counterNeedsCount === 'function') ? counterNeedsCount() : 0; } catch (_){ n = 0; }
    return n ? { n, tone: 'warn' } : null;
  }
  try {
    if (t === 'doc'){
      const n = (typeof docThreadHomeMarks === 'function') ? docThreadHomeMarks(c) : 0;
      return n ? { n, tone: 'warn' } : null;
    }
    if (t === 'oblig'){ const n = Array.isArray(c.obligations) ? c.obligations.filter(Boolean).length : 0; return n ? { n, tone: 'quiet' } : null; }
    if (t === 'deal'){ const n = pdTheirOpen(c).length; return n ? { n, tone: 'warn' } : null; }
  } catch (_){}
  return null;
}

/* the count on one symbol, put back in place when its list repaints */
function pdTabCountPaint(t, c){
  const b = document.querySelector(`#ig-dock [data-pd-tab="${t}"] .pd-tab-i`); if (!b) return;
  const cnt = pdTabCount(t, c || pdContract());
  let n = b.querySelector('.pd-tab-n');
  if (!cnt){ if (n) n.remove(); return; }
  if (!n){ n = document.createElement('span'); b.appendChild(n); }
  n.className = 'pd-tab-n is-' + cnt.tone; n.textContent = cnt.n > 99 ? '99+' : String(cnt.n);
}

/* ---- FACTS: the Overview's own reading ---- */
function pdFactsHtml(c){
  const F = (typeof ktFactReads === 'function') ? ktFactReads(c) : {};
  const parties = (typeof contractParties === 'function') ? (contractParties(c) || []) : [];
  const pr = parties.length ? parties : [{ name: (typeof contractParty === 'function' ? contractParty(c) : ''), side: 'ours' }, { name: c.counterparty || '', side: 'theirs' }];
  const ini = n => String(n || '').split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const who = `<div class="pd-parties">${pr.filter(p => p && p.name).map(p => `<div class="pd-party"><i>${_pdE(ini(p.name))}</i><span>${_pdE(p.name)}<small>${_pdE(_pdT(p.side === 'theirs' ? 'pd_side_theirs' : 'pd_side_ours'))}</small></span></div>`).join('')}</div>`;
  /* ktFactReads returns escaped words already */
  const rows = [
    ['pd_f_type', F.contractType], ['pd_f_value', F.money], ['pd_f_eff', F.effDate], ['pd_f_expiry', F.expiry],
    ['pd_f_notice', F.notice], ['pd_f_stage', _pdE((typeof statusLabel === 'function') ? statusLabel(c.status) : (c.status || ''))],
    ['pd_f_owner', _pdE((typeof contractOwnerName === 'function' ? contractOwnerName(c) : '') || '')], ['pd_f_stream', F.stream],
  ].filter(([, v]) => v);
  const kv = `<dl class="pd-kv">${rows.map(([k, v]) => `<div><dt>${_pdE(_pdT(k))}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  /* ---- FILLING IN IS THE DETAILS TAB'S (owner, 12 Oct 2026: "Home's
     Document panel loses its form and shows N details to fill + a Fill in on
     Details button") ---- The count is the tab's own (detailsOf); the form
     that stood here (#pd-fill) and the list of blanks are gone from Home. */
  let left = 0;
  try { left = (typeof detailsOf === 'function') ? detailsOf(c).left : 0; } catch (_){ left = 0; }
  const may = (typeof canEdit !== 'function') || canEdit();
  const missing = left ? pdList(`<div class="pd-row"><i class="is-warn">!</i><span>${_pdE(_pdTn('det_to_fill', left, { n: left }))}</span>${
      may ? pdBtn(_pdT('det_fill_in_on'), pdRoom(c, 'details'), { go: true }) : ''}</div>`) : '';
  /* THE RENEWAL, where its window is open: the notice desk's own dialog */
  let renew = '';
  try {
    const win = (typeof renewalWindow === 'function') ? renewalWindow(c) : null;
    if (win && win.inWindow && typeof openNoticeDialog === 'function'){
      const say = win.decided ? _pdT('pd_renewal_decided') : _pdT('pd_renewal_by', { date: String(win.decideBy || '').slice(0, 10) });
      renew = pdH(_pdT('pd_renewal')) + pdList(`<div class="pd-row"><i class="${win.decided ? 'is-ok' : 'is-warn'}">${win.decided ? '✓' : '!'}</i><span>${_pdE(say)}</span>${pdBtn(_pdT('pd_notice'), () => openNoticeDialog(getContract(c.id) || c), { go: true })}</div>`);
    }
  } catch (_){ renew = ''; }
  const brief = (typeof openCheckPanel === 'function') ? pdBtn(_pdT('pd_read_brief'), async () => {
    const cc = getContract(c.id) || c;
    try { if (cc._light && !cc._loaded && typeof ensureFull === 'function') await ensureFull(cc); } catch (_){}
    openCheckPanel(getContract(c.id) || cc, 'brief'); }, { lead: true }) : '';
  const top = pdTop('facts', left ? pdPill('warn', _pdTn('det_to_fill', left, { n: left })) : pdPill('ok', _pdT('pd_st_complete')));
  /* The fill form drawn here from 11 Oct 2026 (#pd-fill) moved to the room's
     Details tab on 12 Oct 2026; this panel points there (see `missing`). */
  return top + pdH(_pdT('pd_parties')) + who + pdH(_pdT('pd_terms')) + kv
    + `<div data-pd-missing>${missing}</div>` + renew
    + `<div class="pd-acts">${brief}</div>`
    + pdNote(_pdT('pd_facts_foot'));
}

/* ---- OBLIGATIONS: each duty, whose, when; its words on the paper; the
   Obligations tab's own acts (obPanelActs: chase, mark done, edit) ---- */
function pdObligHtml(c){
  const obs = Array.isArray(c.obligations) ? c.obligations : [];
  const may = (typeof canEdit !== 'function') || canEdit();
  /* THE ROW PRESSED IS THE ROW CHOSEN (15 Oct 2026: the Board's Obligations
     view went; an obligation's row on the list lands here): the list's own
     choice for this contract (insSelected, set by obOpenContract) is marked */
  const chosen = (typeof insSelected === 'function') ? insSelected('oblig:' + c.id) : null;
  const rows = obs.map((o, i) => {
    if (!o) return '';
    let key = ''; try { key = (typeof obKeyOf === 'function') ? String(obKeyOf(c.id, o, i)) : ''; } catch (_){ key = ''; }
    let due = '';
    try { const d = (typeof obligationDueSay === 'function') ? obligationDueSay(o, c) : null; due = d && typeof d === 'object' ? [d.day, d.sub].filter(Boolean).join(' · ') : String(o.due || ''); } catch (_){ due = String(o.due || ''); }
    const theirs = (typeof obligationIsTheirs === 'function') ? obligationIsTheirs(o) : o.party === 'theirs';
    let acts = [];
    try { acts = (typeof obPanelActs === 'function') ? obPanelActs(o, c, i, 'tab').filter(a => a.k !== 'reopen') : []; } catch (_){ acts = []; }
    const words = (o.quote && typeof igQuoteGo === 'function') ? pdBtn(_pdT('pd_show_words'), () => igQuoteGo(o.quote, true)) : '';
    return `<div class="pd-ob ${theirs ? 'is-theirs' : 'is-ours'}${chosen && key === String(chosen) ? ' is-chosen' : ''}" data-pd-ob-key="${_pdE(key)}"><div class="pd-ob-h"><span class="pd-tag ${theirs ? 'is-theirs' : 'is-ours'}">${_pdE(_pdT(theirs ? 'pd_theirs' : 'pd_ours'))}</span><span class="pd-ob-t">${_pdE(o.desc || o.title || '')}</span></div>
      ${due ? `<small>${_pdE(due)}</small>` : ''}<div class="pd-acts">${acts.map(a => pdBtn(a.label, a.run, { lead: a.kind === 'accent', title: a.title })).join('')}${words}</div></div>`;
  }).join('');
  const n = obs.filter(Boolean).length;
  const head = pdTop('oblig', n ? pdPill('quiet', _pdTn('pd_obs_n', n, { n })) : '') + (n ? '' : pdEmpty(_pdT('pd_obs_none'), 'flag'));
  const add = may ? `<div class="pd-acts">${typeof openObligationForm === 'function' ? pdBtn(_pdT('pd_ob_add'), () => openObligationForm(getContract(c.id) || c)) : ''}${typeof runFindObligations === 'function' ? pdBtn(_pdT('pd_ob_find'), () => runFindObligations(getContract(c.id) || c)) : ''}</div>` : '';
  return head + pdList(rows) + add;
}

/* ---- DOCUMENT: THE CLAUSE LIST (owner, 10 Oct 2026: "When i migrate the
   clause to paper, put it under the document tab in the panel. Remove whats
   currently there.") ---- the contract's own Document tab's thread, drawn by
   its one painter (docThreadPaint) on Home's paper: the colour filter, the
   open clause with Plain and its marks, the beads down the line. The blanks
   list, the copies and the left-edge sentence are gone from here. The host
   is empty until the painter fills it. */
function pdDocHtml(c){
  return `<div id="pd-thread" class="doc-th pd-th" data-pd-thread="${_pdE(c && c.id)}"></div>`;
}

/* ---- OPEN ONE CONTRACT ON HOME'S PAPER, ON A TAB, FROM ANYWHERE (the nine
   flow rules' rule 6, Young 8 Oct 2026: approvals leave the Board; the bell and
   the checklist open the contract on the Paper with the approval pack on the
   Signing tab). Below 768px the phone has no Paper: the room's own tab. */
/* the room's / the phone's own tab keys (ROOM_TABS, M_TAB_FOR_ROOM): the phone
   fallback below lands on them (BUGLOG 10 Oct 2026: 'contract' and
   'obligations' were no tab's key, so those two landed nowhere) */
/* OPENING A FACE THAT WATCHES IS AN ARRIVAL (POLL_ON_ARRIVAL's rule for the
   pages the Redlines and Before you sign faces replaced, stage 5): what came
   in meanwhile is collected now, not on the next slow beat */
function pdArrived(){ if (typeof pollNow === 'function') try { pollNow('opened face'); } catch (_){} }
const PD_ROOM_TAB = { facts: 'terms', oblig: 'oblig', sign: 'sign', hist: 'history', deal: 'redline', doc: 'docs', copilot: 'terms', plain: 'terms', fill: 'details', red: 'redline', signing: 'sign' };
/* WHERE A CONTRACT OPENS FOR THIS PERSON (their own choice — the You tab's
   "A contract opens on", js/core.js contractOpensOn; owner, 16 Oct 2026):
   the ordinary "open this contract" doors ask for 'open' and land on the
   face the reader chose. A face this contract has shut (Redlines on a sealed
   one, Before you sign on a signed one — caChipShut, the chips' own rule)
   lands on Jambo instead. A door that names its own place never asks this. */
function pdOpenTabOf(c){
  const v = (typeof contractOpensOn === 'function') ? contractOpensOn() : 'jambo';
  const shut = k => typeof caChipShut === 'function' && !!caChipShut(c, k);
  if (v === 'fill') return 'fill';
  if (v === 'clauses') return 'doc';
  if (v === 'red') return shut('redline') ? 'copilot' : 'red';
  if (v === 'signing') return shut('sign') ? 'copilot' : 'signing';
  return 'copilot';
}
function pdOpenOnHome(id, tab){
  const c = (typeof getContract === 'function') ? getContract(id) : null; if (!c) return false;
  if (tab === 'open') tab = pdOpenTabOf(c);
  /* THE DEAL AND HISTORY DOORS LAND ON THE BOARD (the one-page Home plan,
     stage 4, 14 Oct 2026): the Board's own view for this contract — the
     Negotiate page's deal board and the room's trail, drawn a second time.
     (A walk on the paper that names Deal still marks their changes there,
     PD_TAB_ALIAS; that is a walk through several contracts, not this door.) */
  if ((tab === 'deal' || tab === 'hist') && typeof hbOpenView === 'function') return hbOpenView(c.id, tab);
  /* SIGNING LEFT THE PAPER (10 Oct 2026): an approval waiting on you opens
     the Approvals & signing page with its row chosen — the page that already
     decides it (Approve · Refuse in its panel). */
  if (tab === 'sign'){
    if (typeof apSetTab === 'function' && typeof insSelect === 'function' && typeof setView === 'function'){
      apSetTab('approvals'); insSelect('approvals', id); setView('approvals'); return true;
    }
    if (typeof openWorkspace === 'function') openWorkspace(id);
    if (typeof roomGoTab === 'function') try { roomGoTab(getContract(id), 'sign'); } catch (_){}
    return true;
  }
  const phone = typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 768;
  if (phone || typeof igWalk !== 'function'){
    if (typeof openWorkspace === 'function') openWorkspace(id);
    if (tab && typeof roomGoTab === 'function') try { roomGoTab(getContract(id), PD_ROOM_TAB[tab] || 'terms'); } catch (_){}
    return true;
  }
  /* THE FILL IN FACE (stage 2): Jambo's tab, with the face open on this contract */
  if (tab === 'fill'){
    /* coming from this contract's Redlines or Before you sign face, the paper
       beside it was drawn for that face (Redlined, the signing copy) */
    const turned = _pdSign === String(id) || _pdRed === String(id);
    _pdFill = String(id); _pdRed = null; _pdSign = null; _pdAmend = null; tab = 'copilot';
    /* already on this paper: the panel turns, nothing else moves */
    if (window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
      && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
      pdSetTab('copilot'); intel.dockOpen = true;
      if (turned) pdSignPaper(id);
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
      pdFillLand();
      return true;
    }
  }
  /* THE REDLINES FACE (stage 3): Jambo's tab, the face open on this contract,
     the paper Redlined while it is (pdRedPaper) */
  if (tab === 'red'){
    _pdRed = String(id); _pdFill = null; _pdFillKey = null; _pdSign = null; _pdAmend = null; tab = 'copilot';
    pdArrived();
    if (window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
      && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
      pdSetTab('copilot'); intel.dockOpen = true;
      pdRedPaper(id);
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
      return true;
    }
    pdRedPaper(id, { quiet: true });
  }
  /* THE BEFORE YOU SIGN FACE (stage 5): Jambo's tab, the face open on this
     contract, the paper the signing copy while it is (igPaperHtml) */
  if (tab === 'signing'){
    _pdSign = String(id); _pdRed = null; _pdFill = null; _pdFillKey = null; _pdAmend = null; tab = 'copilot';
    pdArrived();
    if (window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
      && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
      pdSetTab('copilot'); intel.dockOpen = true;
      pdSignPaper(id);
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
      return true;
    }
  }
  /* THE AMEND FACE (owner, 15 Oct 2026, "Beside the paper"): Jambo's tab, the
     face open on this signed agreement, the paper marked while it is */
  if (tab === 'amend'){
    _pdAmend = String(id); _pdRed = null; _pdFill = null; _pdFillKey = null; _pdSign = null; tab = 'copilot';
    if (window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
      && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
      pdSetTab('copilot'); intel.dockOpen = true;
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
      pdAmendPaperPaint();
      return true;
    }
  }
  /* THE PAPER, PLAIN (the overnight work order, step 2: the Workspace door
     lands on "the paper on Jambo's tab"): a face left open on this contract
     (Fill in, Redlines, Before you sign) is put away, so the door lands on
     the conversation, not on the face an earlier press left up. 'copilot'
     keeps a face for the same contract (pdRedSeen's rule); 'plain' does not. */
  if (tab === 'plain'){
    const turned = _pdSign === String(id) || _pdRed === String(id);
    const was = _pdFill || _pdRed || _pdSign;
    _pdFill = null; _pdFillKey = null; _pdRed = null; _pdSign = null; _pdAmend = null; tab = 'copilot';
    if (was) pdPresenceOff(was);
    if (window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
      && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
      pdSetTab('copilot'); intel.dockOpen = true;
      if (turned && typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){}
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
      return true;
    }
  }
  /* already on this paper: the Menu tab turns, nothing else moves (Jambo's Menu card) */
  if (tab === 'menu' && window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
    && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
    pdSetTab('menu'); intel.dockOpen = true;
    if (typeof renderIntelDock === 'function') renderIntelDock();
    return true;
  }
  if (!(window.state && state.view === 'dashboard') && typeof setView === 'function') setView('dashboard');
  igWalk([id], 0, { tab: tab || 'copilot' });
  /* the chosen obligation is brought into sight once the tab is drawn (bounded) */
  if (tab === 'oblig' && typeof document !== 'undefined'){ let n = 0; const go = () => { const r = document.querySelector('#pd-body .pd-ob.is-chosen');
    if (r){ try { r.scrollIntoView({ block: 'nearest' }); } catch (_){} return; } if (++n < 20) setTimeout(go, 50); }; setTimeout(go, 0); }
  if (_pdFill === String(id)) pdFillLand();
  return true;
}

/* ============================================================
   FILL IN THE DETAILS, BESIDE THE PAPER
   (the one-page Home plan, stage 2, docs/PLAN-one-page-home.md; the owner
   picked "Form" by name on 14 Oct 2026, with all three recommendations: a new
   draft and an upload land here alike; every way into filling in from outside
   the room opens this face — the room's Details tab stays for someone already
   in the room until stage 5; a company template's answers show on the paper
   as they are typed and reach its wording on Fill the document)
   ============================================================
   A FACE OF JAMBO'S TAB, NOT A FOURTH TAB: while it is open it stands where
   the conversation stands, and the box and the chips stay at the panel's
   foot, so a word can still be typed. Its × goes back to the conversation.
   IT OWNS NO WRITER. The contract's own details are the Details tab's boxes
   (detPaintBasics → wireKeyTerms), the paper's questions are its form
   (paintContractForm into #pd-fill, the Home host formHostEl already knows),
   and what is owed is detailsOf — the count the checklist, the bell and the
   Contracts filter read. As a box is typed in, its words are shown on the
   paper at once (pdFillEcho, display only); the writer stores them when the
   box is left, and the paper is drawn again from the record. */
/* ---- WHO IS IN THE ROOM, ON A FACE TOO (stage 5) ----
   The room's head and the Negotiate page started the presence beat for the
   contract on them; their work is done on these faces now, so a face that
   draws starts it (presenceStart keeps a running beat), and its × stops it.
   Leaving Home stops it as setView always has. */
function pdPresenceOn(c){
  if (c && c.id && typeof presenceStart === 'function') try { presenceStart(c.id, typeof presencePaint === 'function' ? presencePaint : undefined); } catch (_){}
}
function pdPresenceOff(id){
  if (id && typeof presenceWatching === 'function' && typeof presenceStop === 'function' && String(presenceWatching() || '') === String(id)) try { presenceStop(); } catch (_){}
}
/* THE PAPER PUT AWAY OR TURNED ENDS THE BEAT: the wall (no paper) or another
   contract on the paper means nobody here is on the one the beat names, even
   if the face that started it was never closed by its ×. Home only: the room
   or the Negotiate page opened by name keeps its own beat until setView. */
function pdPresenceLeft(nowId){
  if (!(window.state && state.view === 'dashboard')) return;
  const was = (typeof presenceWatching === 'function') ? String(presenceWatching() || '') : '';
  if (was && was !== String(nowId || '')) pdPresenceOff(was);
}
let _pdFill = null;          // the contract the face is open for, or null
let _pdFillKey = null;       // the box a landing asked for (a blank's key), once
const PD_FILL_TRIES = 25;    // a landing waits for the face's boxes at most this many beats
const PD_FILL_BEAT_MS = 80;
function pdFillFor(){ return _pdFill; }
function pdFillDetails(c){ try { return (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ return null; } }
/* the face is up: Home's paper holds the contract it was opened for, Jambo's
   tab is lit, and the contract still has details to ask */
function pdFillShows(){
  if (!_pdFill || _pdTab !== 'copilot' || !pdOnPaper()) return false;
  const c = pdContract(); if (!c || String(c.id) !== _pdFill) return false;
  const d = pdFillDetails(c);
  return !!(d && d.live && d.all);
}
function pdFillOpen(id, opts){
  const o = opts || {};
  _pdFillKey = o.key ? String(o.key) : null;
  return pdOpenOnHome(id, 'fill');
}
/* ANOTHER CONTRACT ASKED FOR PUTS THE FACE AWAY: read off the request
   (igAnalyze), never off a paint — a paint can still show the last contract
   while the new one loads, and that must not close the face it came for */
function pdFillSeen(id){ if (_pdFill && String(id) !== _pdFill){ _pdFill = null; _pdFillKey = null; } }
/* put away without a paint: a question asked in the box shows its answer */
function pdFillAway(){ _pdFill = null; _pdFillKey = null; }
function pdFillClose(){
  pdPresenceOff(_pdFill);
  _pdFill = null; _pdFillKey = null;
  /* the panel is never redrawn under a hand in the face (renderIntelDock's
     guard) — and the × itself is in the face, so the hand is let go first */
  const a = (typeof document !== 'undefined') ? document.activeElement : null;
  if (a && a.closest && a.closest('#pd-fillface') && typeof a.blur === 'function') a.blur();
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
function pdFillHeadHtml(c){
  const d = pdFillDetails(c) || { all: 0, left: 0 };
  const done = d.all - d.left;
  const pct = d.all ? Math.round(done * 100 / d.all) : 100;
  const close = _pdT('act_close');
  return `<div class="pd-ff-r">${pdBackHtml('fill')}<h3>${_pdE(_pdT('pd_ff_title'))}</h3><span data-pd-ff-pill>${
      d.left ? pdPill('warn', _pdTn('det_left_n', d.left, { n: d.left })) : pdPill('ok', _pdT('pd_ff_all_in'))}</span>
      <button type="button" class="pd-ff-x" data-pd-ff-close title="${_pdE(close)}" aria-label="${_pdE(close)}">×</button></div>
    <div class="det-bar" aria-hidden="true"><i data-pd-ff-bar style="width:${pct}%"></i></div>
    <span class="pd-ff-n" data-pd-ff-count>${_pdE(_pdT('det_n_of_m', { done, all: d.all }))} · ${_pdE(_pdT('pd_ff_saved'))}</span>${pdFillPrivateHtml(c)}`;
}
/* EVERY STEP STARTS THE NEXT (rule 4): with nothing left, the face says so
   and offers the next act — the redlines, or the send screen. A company
   template whose answers have not reached its wording says that instead: the
   press is the form's own Fill the document, just below. */
function pdFillDoneHtml(c){
  const d = pdFillDetails(c); if (!d || d.left) return '';
  const press = !!(typeof tplFormPending === 'function' && tplFormPending(c));
  const may = (typeof canEdit !== 'function') || canEdit();
  let acts = '';
  if (!press && may){
    const nego = (typeof negoMayStart !== 'function') || !!(negoMayStart(c) || {}).ok;
    const them = String(c.counterparty || '').trim();
    /* the redlines beside the paper (stage 3) */
    if (nego && typeof openRedlineWorkbench === 'function') acts += pdBtn(_pdT('pd_ff_redlines'), () => pdRedOpen(c.id), { lead: true });
    if (typeof openShareModal === 'function') acts += pdBtn(them ? _pdT('ca_share_out', { who: them }) : _pdT('ca_share_out_none'), () => openShareModal(getContract(c.id) || c));
  }
  return `<div class="pd-ff-done"><i aria-hidden="true">✓</i><span>${_pdE(_pdT(press ? 'pd_ff_done_press' : 'pd_ff_done'))}</span></div>${acts ? `<div class="pd-acts pd-ff-next">${acts}</div>` : ''}`;
}
function pdFillFaceHtml(c){
  _pdActs.clear();
  /* OWED FIRST (round 8 of the redesign: the owner picked "Owed first" by
     name, 17 Oct 2026): one worklist — what is still owed, from the
     contract's details and the paper's questions alike, under "Still to
     fill"; the answered ones folded under one line; then the document and
     the stream. THE PAINTERS ARE UNTOUCHED: their hosts are laid flat in the
     face (.pd-ff-work) and each row is placed by a mark set when the face is
     painted (pdFillMark), so every box keeps its own writer, and a box being
     answered stays where it is until the face is drawn again. */
  return `<div class="pd-ff pd-ff-work${_pdFillFolded ? '' : ' is-filled-open'}" data-pd-ff="${_pdE(c.id)}">
    <div class="pd-ff-h" data-pd-ff-head>${pdFillHeadHtml(c)}
      ${''/* in the head that stays in sight: the last box is at the foot of the form */}<div data-pd-ff-done>${pdFillDoneHtml(c)}</div></div>
    <div class="pd-ff-owh" data-pd-ff-owh></div>
    <div class="pd-ff-fdh" data-pd-ff-fdh></div>
    <div class="pd-ff-doc" data-pd-ff-doc></div>
    ${''/* AN NDA'S TWO FACTS AND PAY EACH HAVE A CARD OF THEIR OWN (the gaps, round 8
           "Compare": "Confidentiality · 2 to confirm", "Pay · kept apart from deal value"):
           the NDA's rows are detNdaRows', standing between this heading and its edge by
           CSS order; the Pay card is drawn whole here, its one door payEditOpen */}<div class="pd-ff-ndh" data-pd-ff-ndh></div>
    <div class="pd-ff-pay" data-pd-ff-pay></div>
    <div id="det-basics" class="pd-ff-basics"></div>
    <div id="pd-fill" class="pd-ff-paper"></div>
    ${''/* AS DRAWN, EACH PART IS A CARD (the gaps, 18 Oct 2026): the rows stand between
           their heading and these edges, by CSS order, in the painters' own hosts */}<div class="pd-ff-owend" data-pd-ff-owend aria-hidden="true"></div><div class="pd-ff-fdend" data-pd-ff-fdend aria-hidden="true"></div><div class="pd-ff-ndend" data-pd-ff-ndend aria-hidden="true" hidden></div>
    ${pdFillStreamHtml(c)}
    <div class="pd-ff-wait" data-pd-ff-wait></div>
  </div>`;
}
/* ---- A PRIVATE STREAM SAYS SO, AND JAMBO WAITS FOR A PRESS (the gaps,
   round 8 "Compare: employment agreement in a private stream", 18 Oct 2026) ----
   "Private · Board · only the people named on Board see it" under the face's
   count, and at its foot "Jambo reads a private stream's contract only when
   someone presses. Read it now · about SEK 1": the stream's own reading
   (streamIsPrivate), the one press the strip already has (bsGo 'read'), its
   cost said first (aiCostWords, else its count of calls). */
function pdFillPrivateHtml(c){
  if (!c || typeof streamIsPrivate !== 'function' || !streamIsPrivate(c.folder)) return '';
  const F = (typeof FOLDERS === 'object' && FOLDERS) || {};
  const name = (F[c.folder] && F[c.folder].name) || String(c.folder || '');
  return `<span class="pd-ff-priv"><span class="pd-ff-lock"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>${_pdE(_pdT('pd_ff_private', { stream: name }))}</span> ${_pdE(_pdT('pd_ff_private_who', { stream: name }))}</span>`;
}
/* PAY, AS DRAWN: "Pay · kept apart from deal value · never added to a total",
   its parts (Part · How often · Amount) read off the record's one reading
   (payPartsOf), base pay first — "not filled in yet · needed before signing"
   while it is owed — and its one door, Edit pay › (payEditOpen) */
function pdFillPayHtml(c, owed){
  if (!c || !(typeof fxIsPay === 'function' && fxIsPay(c))) return '';
  const head = `<div class="pd-ff-card-h"><h4>${_pdE(_pdT('bs_pay'))}</h4><span class="pd-ff-note">· ${_pdE(_pdT('bs_pay_note'))}</span></div>`;
  if (typeof canViewValues === 'function' && !canViewValues()) return head + `<p class="pd-ff-note">${_pdE(_pdT('bs_pay_hidden'))}</p>`;
  let rows = []; try { rows = (typeof payPartsOf === 'function') ? (payPartsOf(c) || []) : []; } catch (_){ rows = []; }
  if (!rows.some(r => r && r.kind === 'base')) rows = [{ kind: 'base', every: (c.pay && c.pay.every) || '', amount: null, words: '' }].concat(rows);
  const every = k => (typeof bsPayEvery === 'function' ? bsPayEvery(k) : '') || '—';
  const money = n => (typeof bsPayMoney === 'function') ? bsPayMoney(c, n) : String(n);
  const tr = r => {
    const base = r.kind === 'base';
    const amt = Number(r.amount) > 0 ? _pdE(money(r.amount)) : r.words ? _pdE(r.words)
      : (base && owed) ? `<span class="pd-ff-owe">${_pdE(_pdT('pd_ff_pay_owed'))}</span>` : '—';
    return `<tr${base ? ' class="is-base"' : ''}><td>${base ? `<b>${_pdE(_pdT('bs_pay_base'))}</b>` : _pdE(r.label || '')}</td><td>${_pdE(every(r.every))}</td><td>${amt}</td></tr>`;
  };
  const may = (typeof bsPayMay === 'function') ? !!bsPayMay(c) : false;
  return head + `<table class="pd-ff-pay-t"><thead><tr><th>${_pdE(_pdT('bs_pay_col_part'))}</th><th>${_pdE(_pdT('bs_pay_col_every'))}</th><th>${_pdE(_pdT('bs_pay_col_amount'))}</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody></table>${
    may && typeof payEditOpen === 'function' ? `<button type="button" class="pd-ff-use pd-ff-pay-edit" data-pd-ff-pay-edit="${_pdE(c.id)}">${_pdE(_pdT('bs_pay_edit'))}</button>` : ''}`;
}
/* the cost a press says arrives after the face is drawn (aiCostWords): its foot is said again */
const PD_COST_EVENT = 'hati:aicost';   // AI_COST_EVENT (js/views/intelligence.js)
if (typeof document !== 'undefined') document.addEventListener(PD_COST_EVENT, () => {
  if (!pdFillShows()) return; const c = pdContract(); if (c) pdFillGroupsPaint(c); });
function pdFillWaitHtml(c){
  let w = null; try { w = (typeof bsReadWait === 'function') ? bsReadWait(c) : null; } catch (_){ w = null; }
  if (!w) return '';
  if (w.busy) return `<p class="pd-ff-wait-t">${(typeof busyHtml === 'function') ? busyHtml(_pdT('jb_reading')) : _pdE(_pdT('jb_reading'))}</p>`;
  const cost = (typeof aiCostWords === 'function') ? aiCostWords(['brief', 'playbook', 'obligations'], _pdT('jb_read_cost')) : _pdT('jb_read_cost');
  const may = (typeof canEdit !== 'function') || canEdit();
  return `<p class="pd-ff-wait-t">${_pdE(_pdT('pd_ff_wait'))} ${may ? `<button type="button" class="pd-ff-use" data-pd-ff-read="${_pdE(c.id)}">${_pdE(_pdT('jb_read_now'))}</button>` : ''}<span class="pd-ff-cost"> · ${_pdE(cost)}</span></p>`;
}
/* the fold of what is answered: shut by default, kept as the reader left it for the sitting */
let _pdFillFolded = true;
/* WHICH ROWS ARE OWED, read once when the face is painted (detailsOf, by key;
   a box detailsOf does not count goes by what it holds). A row drawn again by
   its own painter carries no mark until the next count, which marks it. */
function pdFillRowKey(row, c){
  const k = row.getAttribute('data-cd-key'); if (k) return k;
  const b = row.querySelector('[data-blankf],[data-tplf]'); return b ? (pdFillKeyOf(b, c) || b.getAttribute('data-blankf') || '') : '';
}
function pdFillRows(host){
  return [...host.querySelectorAll('#det-basics .cd-fld[data-cd-key]')].concat([...host.querySelectorAll('#pd-fill label')].filter(l => l.querySelector('[data-blankf],[data-tplf]')));
}
/* the rows that stand in a card of their own: an NDA's two facts, and pay */
const PD_FF_NDA_KEYS = ['ndaDir', 'ndaEnds'];
function pdFillCardOf(row, c){
  const k = row.getAttribute('data-cd-key') || '';
  if (PD_FF_NDA_KEYS.includes(k)) return 'nda';
  if (k === 'value' && typeof fxIsPay === 'function' && fxIsPay(c)) return 'pay';
  return '';
}
function pdFillMark(c, all){
  const host = document.getElementById('pd-fillface'); if (!host || !c) return;
  /* THE PAINTERS' OWN WRAPPERS STATE display:flex INLINE, which no sheet rule
     outranks (never !important): they are laid flat where the markup's own
     value lives, as the strip's Focus does (WRITTEN ON THE ELEMENT) */
  host.querySelectorAll('#pd-fill > div, #pd-fill details.pd-fill-done > div').forEach(el => {
    /* the questions' own head ("Blanks in this document · 0 of 3") is the face's head now */
    const want = el.querySelector('label, [data-tplf-fill], details') ? 'contents' : 'none';
    if (el.style.display !== want) el.style.display = want; });
  const d = pdFillDetails(c) || { items: [] };
  const open = new Map((d.items || []).map(x => [String(x.key), !!x.open]));
  pdFillRows(host).forEach(r => {
    const card = pdFillCardOf(r, c);
    if (card) r.setAttribute('data-pd-ff-card', card); else r.removeAttribute('data-pd-ff-card');
    if (!all && r.hasAttribute('data-pd-owed')) return;
    const k = pdFillRowKey(r, c);
    const box = r.querySelector('input:not([type="checkbox"]),select,textarea');
    const owed = open.has(k) ? open.get(k) : !!(box && !String(box.value == null ? '' : box.value).trim());
    r.setAttribute('data-pd-owed', owed ? '1' : '0');
  });
  pdFillGroupsPaint(c);
}
/* the two headings and the document's line, from the marks and the record */
function pdFillGroupsPaint(c){
  const host = document.getElementById('pd-fillface'); if (!host || !c) return;
  const d = pdFillDetails(c) || { left: 0 };
  const all = pdFillRows(host);
  /* an NDA's two facts and pay stand in cards of their own: "Still to fill" counts the rest */
  const rows = all.filter(r => !r.getAttribute('data-pd-ff-card'));
  const owedN = rows.filter(r => r.getAttribute('data-pd-owed') !== '0').length;
  const filled = rows.filter(r => r.getAttribute('data-pd-owed') === '0');
  const items = (d.items || []);
  const ndaOpen = items.filter(x => x && x.kind === 'nda' && x.open).length;
  const payOwed = items.some(x => x && x.key === 'value' && x.open) && all.some(r => r.getAttribute('data-pd-ff-card') === 'pay') ? 1 : 0;
  const leftHere = Math.max(0, (d.left || 0) - ndaOpen - payOwed);
  const owh = host.querySelector('[data-pd-ff-owh]');
  /* the questions' own heading is laid away; the one fact about the machinery it carried on its hover
     (an answer to somebody else's placeholder is a working note) rides this heading's hover */
  const note = ((host.querySelector('#pd-fill h6[title]') || {}).title || '').trim();
  if (owh) owh.innerHTML = owedN ? `<h4${note ? ` title="${_pdE(note)}"` : ''}>${_pdE(_pdT('pd_ff_owed'))}</h4>${leftHere ? `<span class="pd-ff-cnt">${leftHere}</span>` : `<span class="pd-ff-cnt is-ok">✓</span>`}` : '';
  /* CONFIDENTIALITY, its own card: "N to confirm" until a person confirms both */
  const nd = all.filter(r => r.getAttribute('data-pd-ff-card') === 'nda');
  const ndh = host.querySelector('[data-pd-ff-ndh]');
  if (ndh){ const h = nd.length ? `<h4>${_pdE(_pdT('pd_ff_nda'))}</h4>${ndaOpen ? `<span class="pd-ff-cnt">${_pdE(_pdTn('pd_ff_nda_n', ndaOpen, { n: ndaOpen }))}</span>` : `<span class="pd-ff-cnt is-ok">✓</span>`}` : '';
    if (ndh.innerHTML !== h) ndh.innerHTML = h; }
  const nde = host.querySelector('[data-pd-ff-ndend]'); if (nde) nde.hidden = !nd.length;
  /* PAY, its own card in the row's place (the row itself is laid away) */
  const pay = host.querySelector('[data-pd-ff-pay]');
  if (pay){ const h = pdFillPayHtml(c, !!payOwed); if (pay.innerHTML !== h) pay.innerHTML = h; }
  all.filter(r => r.getAttribute('data-pd-ff-card') === 'pay').forEach(r => { if (r.style.display !== 'none') r.style.display = 'none'; });
  const wait = host.querySelector('[data-pd-ff-wait]');
  if (wait){ const h = pdFillWaitHtml(c); if (wait.innerHTML !== h) wait.innerHTML = h; }
  const fdh = host.querySelector('[data-pd-ff-fdh]');
  if (fdh){
    const names = filled.map(r => pdFillLabelOf(r)).filter(Boolean);
    const shown = names.slice(0, PD_GL_SUB_MAX).join(' · ') + (names.length > PD_GL_SUB_MAX ? ' …' : '');
    const openF = host.querySelector('.pd-ff').classList.contains('is-filled-open');
    fdh.innerHTML = filled.length ? `<button type="button" class="pd-ff-fold" data-pd-ff-fold aria-expanded="${openF}"><b>${_pdE(_pdT('pd_ff_filled'))}</b><span class="pd-ff-cnt">${filled.length}</span><small>${_pdE(shown)}</small><i aria-hidden="true">${openF ? '▴' : '▾'}</i></button>` : '';
  }
  /* THE FOLD HOLDS ON EVERY ROW: the paper's questions state display:block on
     their own element, which no sheet rule outranks (never !important), so an
     answered question stood in sight under a shut "Filled" (measured, 18 Oct
     2026). The fold is written on the element, the painter's own value kept
     to give back. */
  const shut = !host.querySelector('.pd-ff').classList.contains('is-filled-open');
  rows.forEach(r => {
    if (!r.hasAttribute('data-pd-disp')) r.setAttribute('data-pd-disp', r.style.display || '');
    const want = (shut && r.getAttribute('data-pd-owed') === '0') ? 'none' : r.getAttribute('data-pd-disp');
    if (r.style.display !== want) r.style.display = want;
  });
  const fe = host.querySelector('[data-pd-ff-fdend]'); if (fe) fe.hidden = shut || !filled.length;
  const oe = host.querySelector('[data-pd-ff-owend]'); if (oe) oe.hidden = !owedN;
  /* THE DOCUMENT, AS DRAWN: how many answers stand on the paper and not yet in
     the wording (tplFormPendingKeys, the one reading Fill the document closes),
     and Fill the document in the card — a press on the form's own button, the
     one act; its state is the form's own. Built once, then written in place,
     so a press that commits the last answer is never redrawn from under the hand. */
  const doc = host.querySelector('[data-pd-ff-doc]');
  if (doc){
    const own = host.querySelector('#pd-fill [data-tplf-fill]');
    if (!(c.templateForm && own)){ if (doc.innerHTML) doc.innerHTML = ''; }
    else {
      if (!doc.querySelector('[data-pd-ff-docfill]'))
        doc.innerHTML = `<div class="pd-ff-doc-t"><h4>${_pdE(_pdT('pd_ff_doc'))}</h4><span data-pd-ff-doc-say></span></div><button type="button" class="ui-btn ui-btn-sm" data-pd-ff-docfill></button>`;
      let keys = []; try { keys = (typeof tplFormPendingKeys === 'function') ? tplFormPendingKeys(c) : []; } catch (_){ keys = []; }
      let pend = false; try { pend = !!(typeof tplFormPending === 'function' && tplFormPending(c)); } catch (_){ pend = false; }
      const say = !pend ? _pdT('pd_ff_doc_in') : keys.length ? _pdTn('pd_ff_doc_n', keys.length, { n: keys.length }) : _pdT('pd_ff_doc_pending');
      const sp = doc.querySelector('[data-pd-ff-doc-say]'); if (sp && sp.textContent !== say) sp.textContent = say;
      const b = doc.querySelector('[data-pd-ff-docfill]');
      const lab = String(own.textContent || '').trim() || _pdT('tl_fill_doc');
      if (b.textContent !== lab) b.textContent = lab;
      b.disabled = !!own.disabled; b.title = own.title || '';
    }
  }
  pdFillExtrasPaint(c);
}
/* ---- UNDER AN OWED BOX, AND WHERE IT LANDS (the gaps, round 8 "Owed
   first", 18 Oct 2026) ----
   OUR STANDARD, WHERE ONE NAMES THIS FACT: "Our standard for termination:
   90 days · Use it" — stdValueFor reads it off Our standards' own wording,
   never guessed; Use it puts it in the box and tells the box the way a
   person's typing does (input, change), so the box's own writer stores it.
   WHERE IT LANDS: "clause 3" at the row's head, read off the paper beside it
   (the box's own spot, contractFieldPeer, and the clause heading above it);
   the row being typed in says "on the paper · clause 3". A press puts the
   cursor in the box, which lights its spot on the paper. Nothing is written
   by drawing these. */
const PD_FF_BOX = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="file"]),textarea,select';
function pdFillBoxOf(row){ return row ? row.querySelector(PD_FF_BOX) : null; }
function pdFillLabelOf(row){ const sp = [...row.querySelectorAll('.cd-lab, span')].find(x => !x.closest('[data-pd-ff-at],[data-pd-ff-std]'));
  return ((sp || {}).textContent || '').replace(/\s*\*\s*$/, '').trim(); }
const PD_FF_UNIT = { days: 'pd_ff_u_days', months: 'pd_ff_u_months', years: 'pd_ff_u_years' };
function pdFillStdOf(row){
  const box = pdFillBoxOf(row);
  if (!box || box.tagName === 'SELECT' || !['text', 'number', 'textarea', ''].includes(String(box.type || box.tagName.toLowerCase()).toLowerCase())) return null;
  if (String(box.value || '').trim()) return null;
  const v = (typeof stdValueFor === 'function') ? stdValueFor(pdFillLabelOf(row)) : null;
  if (!v || !PD_FF_UNIT[v.unit]) return null;
  const said = _pdTn(PD_FF_UNIT[v.unit], v.figure, { n: v.figure });
  return { ...v, said, put: String(box.type || '').toLowerCase() === 'number' ? String(v.figure) : said };
}
/* the clause a spot on the paper sits under: the nearest heading above it that opens with a number */
const PD_FF_CLAUSE_NUM = /^\s*(?:clause|article|section|§)?\s*(\d{1,3}(?:\.\d{1,3})*)[.)]?(?:\s|$)/i;
function pdFillSpotClause(node, root){
  if (!node) return '';
  const H = 'h1,h2,h3,h4,h5,h6';
  const a = node.closest ? node.closest('[data-anchor]') : null;
  if (a){ const h = a.querySelector(H); const m = h && PD_FF_CLAUSE_NUM.exec(h.textContent || ''); if (m) return m[1]; }
  let el = node;
  while (el && el !== root && el.parentElement){
    let sib = el.previousElementSibling;
    while (sib){
      const hs = sib.matches(H) ? [sib] : [...sib.querySelectorAll(H)];
      for (let i = hs.length - 1; i >= 0; i--){ const m = PD_FF_CLAUSE_NUM.exec(hs[i].textContent || ''); if (m) return m[1]; }
      sib = sib.previousElementSibling;
    }
    el = el.parentElement;
  }
  return '';
}
function pdFillSpotOf(row, c){
  const k = pdFillRowKey(row, c); if (!k || typeof contractFieldPeer !== 'function') return null;
  let node = null; try { node = contractFieldPeer(k, 'paper'); } catch (_){ node = null; }
  if (!node) return null;
  const n = pdFillSpotClause(node, document.getElementById('ig-canvas'));
  return n ? { key: k, n } : null;
}
function pdFillExtrasPaint(c){
  const host = (typeof document !== 'undefined') ? document.getElementById('pd-fillface') : null; if (!host || !c) return;
  const kind = pdFillStdKind(c);
  pdFillRows(host).forEach(r => {
    /* where it lands, on every row the paper carries */
    const at = pdFillSpotOf(r, c);
    let link = r.querySelector(':scope > [data-pd-ff-at]');
    if (at){
      const h = `<span class="pd-ff-on">${_pdE(_pdT('pd_ff_on_paper'))} · </span>${_pdE(_pdT('pd_ff_at', { n: at.n }))}`;
      /* at the end of the row, drawn at its head: the row's own label stays its first words */
      if (!link){ link = document.createElement('button'); link.type = 'button'; link.className = 'pd-ff-at'; link.setAttribute('data-pd-ff-at', ''); r.appendChild(link); }
      if (link.innerHTML !== h) link.innerHTML = h;
      r.classList.add('has-at');
    } else if (link){ link.remove(); r.classList.remove('has-at'); }
    /* our standard, under an owed box still empty — named for the kind of
       contract whose book applies (the gaps, round 8: "Our standard for
       freight: 6 months"), the topic's own name only where no book is named */
    const owedRow = r.getAttribute('data-pd-owed') === '1';
    const std = owedRow ? pdFillStdOf(r) : null;
    let hint = r.querySelector(':scope > [data-pd-ff-std]');
    if (std){
      const what = kind || std.category.toLowerCase();
      const h = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3.5 2.5h7.5v11H3.5z"/><path d="M6 5.5h3M6 8h3"/></svg><span>${_pdE(_pdT('pd_ff_std', { what, value: std.said }))}</span><button type="button" class="pd-ff-use" data-pd-ff-use="${_pdE(std.put)}">${_pdE(_pdT('pd_ff_use'))}</button>`;
      if (!hint){ hint = document.createElement('div'); hint.className = 'pd-ff-std'; hint.setAttribute('data-pd-ff-std', ''); r.appendChild(hint); }
      if (hint.innerHTML !== h) hint.innerHTML = h;
    } else if (hint) hint.remove();
    /* AN EXAMPLE OF THE ANSWER IN AN OWED BOX (the gaps, round 8: "e.g. 1
       November 2026", "e.g. 6 months", "A number") — display only, never a value */
    if (owedRow) pdFillExample(r, std);
  });
  pdFillPaperMarks(c);
}
/* the kind of contract whose book of our standards applies (playbookKeyFor), in its own words */
function pdFillStdKind(c){
  let label = '';
  try { const key = (typeof playbookKeyFor === 'function') ? playbookKeyFor(c) : ''; label = (typeof resolvePlaybook === 'function') ? String((resolvePlaybook(key) || {}).label || '') : ''; } catch (_){ label = ''; }
  return label.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
const PD_FF_EG_DATE = /\b(?:date|start|starts|end|ends|until|from|expiry|datum|slut|från|till)\b/i;
const PD_FF_EG_SPAN = /\b(?:notice|period|term|duration|length|months?|days?|years?|uppsägning|period|tid|månader|dagar)\b/i;
const PD_FF_EG_NUM = /\b(?:value|amount|price|fee|fees|sum|cost|spend|number|belopp|värde|pris|avgift|summa)\b/i;
const PD_FF_EG_MONTHS = 6;
function pdFillExample(row, std){
  const box = pdFillBoxOf(row); if (!box || box.tagName === 'SELECT') return;
  const label = pdFillLabelOf(row);
  const type = String(box.type || '').toLowerCase();
  let eg = '';
  if (type === 'date' || PD_FF_EG_DATE.test(label)){
    const t = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
    const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
    let loc; try { loc = (typeof langLocale === 'function') ? langLocale() : undefined; } catch (_){ loc = undefined; }
    let w = ''; try { w = d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (_){ w = d.toISOString().slice(0, 10); }
    eg = _pdT('pd_ff_eg', { x: w });
  } else if (type === 'number' || PD_FF_EG_NUM.test(label)) eg = _pdT('pd_ff_eg_num');
  else if (PD_FF_EG_SPAN.test(label)) eg = _pdT('pd_ff_eg', { x: std ? std.said : _pdTn('pd_ff_u_months', PD_FF_EG_MONTHS, { n: PD_FF_EG_MONTHS }) });
  if (!eg) return;
  /* a dressed date shows its face's words (data-ph, datePickDress); a text box its placeholder */
  if (type === 'date'){ if (box.getAttribute('data-ph') !== eg) box.setAttribute('data-ph', eg); }
  else if (box.placeholder !== eg) box.placeholder = eg;
}
/* ---- THE PAPER BESIDE FILL IN SAYS WHAT IS OWED (the gaps, round 8: "owed
   is amber everywhere"; the typed answers not yet in the wording carry a
   dotted accent underline) ----
   Marks painted after the paper is drawn, never stored: a blank of the paper's
   form that detailsOf counts open is amber; an answer the wording does not
   carry yet (tplFormPendingKeys, the one reading Fill the document closes)
   is underlined. Taken off again when the face goes. */
function pdFillPaperMarks(c){
  const cv = (typeof document !== 'undefined') ? document.getElementById('ig-canvas') : null; if (!cv) return;
  const on = pdFillShows() && c && String(c.id) === _pdFill;
  const owe = new Set(), pend = new Set();
  if (on){
    const d = pdFillDetails(c) || { items: [] };
    (d.items || []).forEach(x => { if (x && x.open) owe.add(String(x.key)); });
    let keys = []; try { keys = (typeof tplFormPendingKeys === 'function') ? tplFormPendingKeys(c) : []; } catch (_){ keys = []; }
    keys.forEach(k => pend.add(String(k)));
  }
  cv.querySelectorAll('.hati-field[data-field-key], .pd-ff-owe-mark').forEach(el => {
    el.classList.toggle('pd-ff-owe-mark', on && el.classList.contains('hati-field') && owe.has(el.getAttribute('data-field-key'))); });
  cv.querySelectorAll('.hati-field-done[data-field-key], .pd-ff-pend').forEach(el => {
    el.classList.toggle('pd-ff-pend', on && el.classList.contains('hati-field-done') && pend.has(el.getAttribute('data-field-key'))); });
}
/* ---- THE STREAM, ASKED AND NEVER OWED (the overnight work order, step 6;
   the demo's fillFace) ----
   A segmented choice of the company's streams — FOLDERS, the one map
   foldersFromSettings fills, as far as this reader may see them
   (visibleFolders), the contract's own kept on the list — with the current
   one lit. NEVER COUNTED: it is not in detailsOf, has no data-kt, and
   pdFillKeyOf reads past it. A press moves the contract through the ONE
   stream writer (ktFolderMove: the question, the 'Re-filed' line, the save);
   a person who may not re-file sees the choice greyed with the reason, which
   is the server's own wall (403 folderMove) said before the press. */
function pdFillStreamMay(){
  return (typeof mayReFile === 'function') && !!mayReFile() && !(typeof PORTAL_MODE !== 'undefined' && PORTAL_MODE)
    && ((typeof canEdit !== 'function') || canEdit());
}
function pdFillStreamHtml(c){
  if (!c) return '';
  const F = (typeof FOLDERS === 'object' && FOLDERS) || {};
  const list = ((typeof visibleFolders === 'function') ? visibleFolders() : Object.values(F)).slice();
  if (c.folder && F[c.folder] && !list.some(f => f.id === c.folder)) list.unshift(F[c.folder]);
  if (!list.length) return '';
  const may = pdFillStreamMay();
  const why = may ? '' : _pdT('pd_ff_stream_ro');
  const seg = list.map(f => `<button type="button" data-pd-stream="${_pdE(f.id)}" aria-pressed="${f.id === c.folder ? 'true' : 'false'}"${may ? '' : ` disabled aria-disabled="true" title="${_pdE(why)}"`}>${_pdE(f.name)}</button>`).join('');
  /* AS DRAWN, THE RULE'S OWN DOOR (the gaps, round 8 "Owed first", 18 Oct
     2026): "Moving a contract to another stream is an admin's act. · Ask an
     admin" — the Ask-an-admin record sent in one press (stAskDirect), and once
     sent, when and whom it was asked of, until an admin answers */
  let ro = '';
  if (!may){
    const asked = (typeof stAskOpenFor === 'function') ? stAskOpenFor('refile:' + c.id) : null;
    const who = (typeof stAdminsSaid === 'function') ? stAdminsSaid() : '';
    const door = (typeof stAskDirect === 'function' && !(typeof PORTAL_MODE !== 'undefined' && PORTAL_MODE));
    ro = `<span class="pd-ff-ro">${_pdE(_pdT('pd_ff_stream_admin'))}${asked
      ? ` <span class="pd-ff-asked">${_pdE(_pdT('st_ask_sent_h', { who, day: (typeof stDay === 'function') ? stDay(asked.createdAt) : '' }))}</span>`
      : door ? ` <button type="button" class="pd-ff-use" data-pd-ff-ask>${_pdE(_pdT('st_ask_go'))}</button>` : ''}</span>`;
  }
  return `<div class="pd-ff-stream" data-pd-ff-stream>
    <span class="pd-ff-sl">${_pdE(_pdT('pd_ff_stream'))} <span>· ${_pdE(_pdT('pd_ff_stream_never'))}</span></span>
    <div class="pd-ff-seg" role="group" aria-label="${_pdE(_pdT('pd_ff_stream'))}">${seg}</div>
    ${ro}
  </div>`;
}
/* the ask, sent; the row then says when, and whom */
async function pdFillStreamAsk(){
  const c = pdContract(); if (!c || typeof stAskDirect !== 'function') return null;
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  const a = await stAskDirect(_pdT('pd_ff_ask_words', { ref, name: String(c.name || '').trim() }).replace(/\s+/g, ' ').trim(), 'refile:' + c.id);
  pdFillStreamRepaint((typeof getContract === 'function' && getContract(c.id)) || c);
  return a;
}
function pdFillStreamRepaint(c){
  const el = (typeof document !== 'undefined') ? document.querySelector('#pd-fillface [data-pd-ff-stream]') : null; if (!el || !c) return;
  const t = document.createElement('div'); t.innerHTML = pdFillStreamHtml(c);
  if (t.firstElementChild) el.replaceWith(t.firstElementChild);
}
async function pdFillStreamPick(id){
  const c = pdContract(); if (!c || !id || String(c.folder || '') === String(id)) return false;
  if (!pdFillStreamMay() || typeof ktFolderMove !== 'function') return false;
  let ok = false;
  try { ok = await ktFolderMove(c, id); } catch (_){ ok = false; }
  pdFillStreamRepaint((typeof getContract === 'function' && getContract(c.id)) || c);
  return ok;
}
/* the count, the bar, the pill and the next step, IN PLACE — never a repaint
   under the hand that is typing */
function pdFillCounts(c){
  const host = document.getElementById('pd-fillface'); if (!host) return;
  c = (c && typeof getContract === 'function' && getContract(c.id)) || c || pdContract();
  if (!c || String(c.id) !== _pdFill) return;
  const d = pdFillDetails(c); if (!d) return;
  const done = d.all - d.left;
  const pill = host.querySelector('[data-pd-ff-pill]');
  if (pill) pill.innerHTML = d.left ? pdPill('warn', _pdTn('det_left_n', d.left, { n: d.left })) : pdPill('ok', _pdT('pd_ff_all_in'));
  const bar = host.querySelector('[data-pd-ff-bar]'); if (bar) bar.style.width = (d.all ? Math.round(done * 100 / d.all) : 100) + '%';
  const n = host.querySelector('[data-pd-ff-count]'); if (n) n.textContent = `${_pdT('det_n_of_m', { done, all: d.all })} · ${_pdT('pd_ff_saved')}`;
  const fin = host.querySelector('[data-pd-ff-done]'); if (fin) fin.innerHTML = pdFillDoneHtml(c);
  try { if (typeof detMarkOpen === 'function') detMarkOpen(c); } catch (_){}
  try { if (typeof detPaintPaperEmpties === 'function') detPaintPaperEmpties(); } catch (_){}
  pdFillMark(c, false);
  pdChipsRepaint();
}
/* THE CHIPS FOLLOW THE CONTRACT AS A FACE CHANGES IT (stage 6): what is owed
   leads them, and a door the contract has shut is not offered — a box filled
   in, or a signature given (which freezes the wording), changes both without
   the panel being drawn again. Drawn again with their press, as
   renderIntelDock binds them. */
/* FILL IN AND BEFORE YOU SIGN DRAW NO CHIPS (the gaps, rounds 8 and 10, 18
   Oct 2026: "nothing between the stream card and the ask box except Jambo
   perched"): each face carries its own acts; the row stays, empty, as his perch */
function pdChipsQuiet(){ return !!(pdFillShows() || pdSignShows()); }
function pdChipsRepaint(){
  if (typeof window === 'undefined' || !window.caChipsHtml) return;
  pdNeedsRepaint();
  pdGlanceRepaint();
  const chips = document.querySelector('#ig-dock [data-ig-chips]'); if (!chips) return;
  if (pdChipsQuiet()){ chips.querySelectorAll('button').forEach(b => b.remove()); return; }
  const h = caChipsHtml(); if (!h || h === chips.innerHTML) return;
  chips.innerHTML = h;
  chips.querySelectorAll('[data-igsug]').forEach(b => b.addEventListener('click', () => { if (typeof intelAsk === 'function') intelAsk(b.getAttribute('data-igsug')); }));
}
/* what a box holds, shown on the paper at once (display only: the box's own
   writer stores it when the box is left, and the paper is drawn again from
   the record then) */
function pdFillKeyOf(el, c){
  if (!el || !el.getAttribute) return '';
  const kt = el.getAttribute('data-kt'); if (kt) return ['counterparty', 'value', 'effDate'].includes(kt) ? kt : '';
  const bf = el.getAttribute('data-blankf'); if (bf) return bf;
  const tf = el.getAttribute('data-tplf');
  if (tf != null && c && c.templateForm && Array.isArray(c.templateForm.fields)){ const f = c.templateForm.fields[Number(tf)]; return f && f.fieldKey ? String(f.fieldKey) : ''; }
  return '';
}
function pdFillEcho(key, value){
  const cv = document.getElementById('ig-canvas'); if (!cv || !key) return 0;
  const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(key)) : String(key).replace(/["\\]/g, '\\$&');
  const v = String(value == null ? '' : value).trim();
  let n = 0;
  cv.querySelectorAll(`span[data-sync="${q}"],span[data-field="${q}"],span[data-field-key="${q}"]`).forEach(sp => {
    if (!sp.hasAttribute('data-pd-was')) sp.setAttribute('data-pd-was', sp.textContent);
    sp.textContent = v || sp.getAttribute('data-pd-was'); n++;
  });
  if (typeof uploadBlankPaint === 'function') try { n += uploadBlankPaint(key, value) || 0; } catch (_){}
  return n;
}
/* bound once per face host: the echo while typing, the counts and the paper
   after a box is left, and the × */
function pdFillWire(host){
  if (!host || host.dataset.pdFfBound) return;
  host.dataset.pdFfBound = '1';
  host.addEventListener('input', e => { const c = pdContract(); const k = pdFillKeyOf(e.target, c); if (k) pdFillEcho(k, e.target.value); });
  host.addEventListener('change', () => {
    setTimeout(() => { const c = pdContract(); if (!c) return;
      pdFillCounts(c);
      /* a contract detail's own writer moves only the record: the paper beside
         it is drawn again here, as the blanks' writer already does */
      if (typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){} }, 0);
  });
  host.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-pd-ff-close]')){ e.preventDefault(); pdFillClose(); return; }
    if (e.target.closest && e.target.closest('[data-pd-ff-fold]')){ e.preventDefault();
      const ff = host.querySelector('.pd-ff'); if (ff){ ff.classList.toggle('is-filled-open'); _pdFillFolded = !ff.classList.contains('is-filled-open'); }
      pdFillGroupsPaint(pdContract()); return; }
    const sb = e.target.closest ? e.target.closest('[data-pd-stream]') : null;
    if (sb && !sb.disabled){ e.preventDefault(); pdFillStreamPick(sb.getAttribute('data-pd-stream')); return; }
    const t = e.target.closest ? e.target : null; if (!t) return;
    /* OUR STANDARD, PUT IN THE BOX the way typing does: the box's own writer stores it */
    const use = t.closest('[data-pd-ff-use]');
    if (use){ e.preventDefault();
      const box = pdFillBoxOf(use.closest('[data-pd-owed]')); if (!box) return;
      box.value = use.getAttribute('data-pd-ff-use');
      box.dispatchEvent(new Event('input', { bubbles: true })); box.dispatchEvent(new Event('change', { bubbles: true }));
      return; }
    /* WHERE IT LANDS: the cursor into the box, its spot lit on the paper */
    const at = t.closest('[data-pd-ff-at]');
    if (at){ e.preventDefault();
      const row = at.closest('[data-pd-owed]'), box = pdFillBoxOf(row), c = pdContract();
      if (box) try { box.focus({ preventScroll: true }); } catch (_){}
      const k = row && c ? pdFillRowKey(row, c) : '';
      if (k && typeof contractFieldLight === 'function' && typeof contractFieldPeer === 'function') try { contractFieldLight(contractFieldPeer(k, 'paper')); } catch (_){}
      return; }
    /* FILL THE DOCUMENT, in the document's card: the form's own button pressed — the one act */
    const df = t.closest('[data-pd-ff-docfill]');
    if (df){ e.preventDefault();
      const own = host.querySelector('#pd-fill [data-tplf-fill]'); if (own && !own.disabled) own.click();
      setTimeout(() => { const c = pdContract(); if (c) pdFillGroupsPaint(c); }, 0);
      return; }
    if (t.closest('[data-pd-ff-ask]')){ e.preventDefault(); pdFillStreamAsk(); return; }
    /* pay's one door, and the read a private contract waits for (the strip's own press) */
    const pe = t.closest('[data-pd-ff-pay-edit]');
    if (pe){ e.preventDefault(); if (typeof payEditOpen === 'function') payEditOpen(pe.getAttribute('data-pd-ff-pay-edit')); return; }
    const rd = t.closest('[data-pd-ff-read]');
    if (rd){ e.preventDefault(); if (typeof bsGo === 'function'){ bsGo('read', rd.getAttribute('data-pd-ff-read'));
        setTimeout(() => { const c = pdContract(); if (c) pdFillGroupsPaint(c); }, 0); } }
  });
}
/* after renderIntelDock drew the face's host: its parts, from their own painters */
function pdFillFacePaint(c){
  const host = document.getElementById('pd-fillface'); if (!host) return;
  c = c || pdContract(); if (!c) return;
  try { if (typeof detPaintBasics === 'function') detPaintBasics(c); } catch (_){}
  try { if (typeof paintContractForm === 'function') paintContractForm(c); } catch (_){}
  /* the room's own clothes: HaTi's date faces, an owed empty box amber */
  try { if (typeof popupControlsDress === 'function') popupControlsDress(host); } catch (_){}
  try { if (typeof detPaintPaperEmpties === 'function') detPaintPaperEmpties(); } catch (_){}
  /* the paper questions' own "Show N filled" fold is laid flat: the face's one fold holds them */
  host.querySelectorAll('#pd-fill details.pd-fill-done').forEach(x => { x.open = true; });
  pdFillMark(c, true);
  pdFillWire(host);
  pdPresenceOn(c);
}
/* land the cursor in the box asked for, else the first one still owed —
   bounded, because the face is painted by the render a landing asks for */
function pdFillLand(){
  let tries = 0;
  const go = () => {
    const host = document.getElementById('pd-fillface');
    const c = pdContract();
    if (host && c && host.querySelector('[data-kt],[data-blankf],[data-tplf]')){
      const key = _pdFillKey; _pdFillKey = null;
      /* a hand already in one of the face's boxes is never moved: the reader
         got there first */
      const here = document.activeElement;
      if (!key && here && here !== host && host.contains(here)) return;
      let box = null;
      if (key) box = (typeof contractFieldPeer === 'function' ? contractFieldPeer(key, 'panel') : null) || host.querySelector(`[data-kt="${key}"]`);
      if (!box) box = host.querySelector('.cd-fld.is-open input, .cd-fld.is-open select')
        || host.querySelector('[data-blankf]:not([value]), [data-blankf][value=""]')
        || host.querySelector('[data-tplf]');
      /* an answered box sits in the "Show N filled" fold, opened first — the face's own fold too (round 8) */
      const fold = box && box.closest ? box.closest('details') : null; if (fold && !fold.open) fold.open = true;
      const row = box && box.closest ? box.closest('[data-pd-owed="0"]') : null;
      const ff = host.querySelector('.pd-ff');
      if (row && ff && !ff.classList.contains('is-filled-open')){ ff.classList.add('is-filled-open'); _pdFillFolded = false; pdFillGroupsPaint(c); }
      if (box){ try { box.focus({ preventScroll: true }); } catch (_){ try { box.focus(); } catch (_e){} }
        try { box.scrollIntoView({ block: 'center' }); } catch (_){} }
      return;
    }
    if (++tries < PD_FILL_TRIES) setTimeout(go, PD_FILL_BEAT_MS);
  };
  setTimeout(go, PD_FILL_BEAT_MS);
}
/* a write that moved the record's facts from elsewhere (Fill from document):
   the face is drawn again, unless a box in it is under the reader's hand */
function pdFillRefresh(){
  if (!pdFillShows()) return;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#pd-fillface')) { pdFillCounts(pdContract()); return; }
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* ============================================================
   REDLINES, BESIDE THE PAPER
   (the one-page Home plan, stage 3, docs/PLAN-one-page-home.md; the owner
   picked "Column" by name on 14 Oct 2026, with all three recommendations:
   the paper turns Redlined while the face is open and goes back when it
   closes; every door from outside opens this face, the Negotiate page
   staying on the rail until stage 5; notes stay on Negotiate until stage 5,
   a row's note count opening Negotiate on that change)
   ============================================================
   A FACE OF JAMBO'S TAB, like Fill in: it stands where the conversation
   stands, the box and the chips at the panel's foot. IT OWNS NO BUILDER AND
   NO WRITER. The column is the Negotiate page's own (rlColumnHtml) with the
   page's own options (rlBenchOpts), wired by the page's own wiring
   (wireNegotiationTab, rlWireClauseTools) scoped to this host — every verb
   files through the one funnel with the same refusals, and nothing leaves
   until Send. Its door is the page's door: pdRedOpen asks
   openRedlineWorkbench, whose walls (sealed, blanks) come first, and which
   hands over to pdRedLand. Edit and Counter open the clause editor over
   Home; Exit lands back here, at the same spot. */
let _pdRed = null;           // the contract the face is open for, or null
function pdRedFor(){ return _pdRed; }
/* the face is up: Home's paper holds the contract it was opened for and
   Jambo's tab is lit */
function pdRedShows(){
  if (!_pdRed || _pdTab !== 'copilot' || !pdOnPaper()) return false;
  const c = pdContract(); return !!(c && String(c.id) === _pdRed);
}
/* THE FACE'S DOOR IS THE NEGOTIATE PAGE'S DOOR: its walls first */
function pdRedOpen(id){
  if (typeof openRedlineWorkbench !== 'function') return false;
  return openRedlineWorkbench(id, { face: true });
}
/* past the walls: the face on this contract. False where Home has no paper
   (the phone), and the caller carries on to the Negotiate page. */
function pdRedLand(id){
  const phone = typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 768;
  if (phone || typeof igWalk !== 'function') return false;
  return pdOpenOnHome(id, 'red');
}
/* another contract asked for puts the face away (igAnalyze), as Fill in's */
function pdRedSeen(id){ if (_pdRed && String(id) !== _pdRed) _pdRed = null; }
function pdRedAway(){ _pdRed = null; }
function pdRedClose(){
  const id = _pdRed; _pdRed = null;
  pdPresenceOff(id);
  pdRedPaper(id);
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* THE PAPER TURNS REDLINED WHILE THE FACE IS OPEN, AND BACK WHEN IT CLOSES
   (the owner's yes, decision 1): igRedOn reads pdRedFor, so nothing is stored.
   A Clean chosen before the face opened is let go so the marks show; a press
   on Clean while it is open still wins; closing leaves what was there. */
function pdRedPaper(id, o){
  if (_pdRed && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id) && intel.paper.red === false) delete intel.paper.red;
  if (o && o.quiet) return;
  if (typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){}
}
/* the face's own way out, at the end of the column's head: × back to the
   conversation. OPEN NEGOTIATE WENT WITH THE PAGE (stage 5: the Negotiate
   page folded into Home, the owner's yes to decision 1) — the notes, the
   notices and the page's own menu are all beside the paper now. */
function pdRedHeadEndHtml(c){
  const close = _pdT('act_close');
  /* siblings of the head's own parts: the sheet puts × at the end of the
     first line; the break keeps the round's line under it */
  return `<button type="button" class="pd-rf-x" data-pd-rf-close title="${_pdE(close)}" aria-label="${_pdE(close)}">×</button>`
    + `<span class="pd-rf-br" aria-hidden="true"></span>`;
}
/* the Negotiate page's own options, this host's repaint and root */
function pdRedOpts(c){
  const base = (typeof rlBenchOpts === 'function')
    ? rlBenchOpts(c, { side: 'owner', hostId: 'pd-redface', again: pdRedRepaint, scope: '#pd-redface' })
    : { side: 'owner', hostId: 'pd-redface', rerender: pdRedRepaint };
  return Object.assign({}, base, { cpPanel: false, headStart: pdBackHtml('red'), headEnd: pdRedHeadEndHtml(c) });
}
function pdRedFaceHtml(c){
  if (!c || typeof rlColumnHtml !== 'function') return '';
  try { if (typeof negoEnsureStyle === 'function') negoEnsureStyle(); } catch (_){}
  try { if (typeof redlineLayoutCss === 'function') redlineLayoutCss(); } catch (_){}
  let col = '';
  const o = pdRedOpts(c);
  try { col = rlColumnHtml(c, o); } catch (e){ col = pdEmpty((e && e.message) || String(e), 'alert'); }
  /* THE PAGE'S NOTICES CAME WITH IT (stage 5): a review in play, a desk that
     holds this reader — the same stack the Negotiate page drew in flow above
     its work (rlFloatingNoticesHtml, nothing floating, owner 23 Aug 2026),
     drawn here above the column; it draws nothing on an ordinary negotiation */
  let notices = '';
  try { notices = (typeof rlFloatingNoticesHtml === 'function') ? rlFloatingNoticesHtml(c, o) : ''; } catch (_){ notices = ''; }
  /* THE PAGE'S ONE SEND, WHEN ONLY ANSWERS ARE WAITING (stage 5): with no
     drafts of ours unsent, the Negotiate page's #nego-send stood in its turn
     banner, which the column does not draw — and the column's own "Send to
     <them>" is a proxy that presses it. The button is carried here, hidden,
     so the proxy has its target; the banner itself is not drawn. */
  let send = '';
  if (!/id="nego-send"/.test(col) && typeof negoTurnBannerHtml === 'function'){
    try { const m = String(negoTurnBannerHtml(c, o) || '').match(/<button id="nego-send"[\s\S]*?<\/button>/); if (m) send = `<div hidden data-pd-rf-send>${m[0]}</div>`; } catch (_){ send = ''; }
  }
  return `<div class="redline-page rl-face" data-rl-side-mode="changes" data-pd-rf="${_pdE(c.id)}">${notices ? `<div class="pd-rf-notices">${notices}</div>` : ''}<div id="nego-root" class="rl-root">${col}${send}</div></div>`;
}
/* THE FOOT IS NOT DRAWN (owner, 15 Oct 2026): with changes on the table the
   face shows only them; Draft from our standards, Edit a clause and Add a
   clause are Menu rows (pdMenuHtml). The empty column keeps its own three at
   its top (rlEmptyColumnActsHtml). This builder stays for the Menu's rows.
   WAS: THE COLUMN'S OWN ACTS, AT ITS FOOT (the design the owner picked): the
   Negotiate page's own three buttons from their own builders — Draft from our
   standards (its More row), Edit a clause (its control row; the clause being
   read on Home's paper) and Add a clause — wired by rlWireClauseTools as there.
   Each greys itself with its reason; nothing here files or sends. */
function pdRedFootHtml(c){
  if (!c || typeof rlPrepareRowHtml !== 'function') return '';
  const o = { side: 'owner', cpPanel: false };
  const executed = !!(typeof negoExecuted === 'function' && negoExecuted(c));
  const edit = (typeof rlEditClauseBtnHtml === 'function') ? rlEditClauseBtnHtml(c, o, 'owner', 'rl-empty-edit rl-edit-clause-door') : '';
  const add = (!executed && typeof rlAddClauseBtnHtml === 'function') ? rlAddClauseBtnHtml(c, o, 'owner', 'rl-empty-edit') : '';
  return `<div class="rl-empty-acts pd-rf-foot">${executed ? '' : rlPrepareRowHtml(c, false)}${edit}${add}</div>`;
}
/* where the column was scrolled, read before a repaint and put back after */
function pdRedScrollOf(){
  const sc = (typeof document !== 'undefined') ? document.querySelector('#pd-redface #nego-cards') : null;
  return sc ? sc.scrollTop : 0;
}
/* the host's repaint: the paper (its marks moved) and the face, same spot */
function pdRedRepaint(){
  if (!pdRedShows()) return;
  const top = pdRedScrollOf();
  if (typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){}
  _pdRedTop = top;
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
let _pdRedTop = null;        // a scroll the next paint puts back, once
/* after renderIntelDock drew the face: the Negotiate page's own wiring,
   scoped to this host, and the scroll put back */
function pdRedFacePaint(c, top){
  const host = document.getElementById('pd-redface'); if (!host || !c) return;
  const opts = pdRedOpts(c);
  const root = host.querySelector('.redline-page'); if (root) root._rlRerender = opts.rerender;
  try { if (typeof wireNegotiationTab === 'function') wireNegotiationTab(c, opts); } catch (_){}
  try { if (typeof negoAfterPaint === 'function') negoAfterPaint(c, opts, host); } catch (_){}
  /* the Negotiate page's live probe (a colleague's change, their round,
     Jambo's answers) and its presence beat, for the face (stage 5) */
  try { if (typeof rlStartLivePoll === 'function') rlStartLivePoll(c); } catch (_){}
  pdPresenceOn(c);
  try { if (typeof rlWireClauseTools === 'function') rlWireClauseTools(c, host, opts); } catch (_){}
  try { if (typeof redlineSyncProxies === 'function') redlineSyncProxies(host); } catch (_){}
  try { if (typeof chatFieldWire === 'function') chatFieldWire(host); } catch (_){}
  pdRedWire(host);
  pdRedPaperWire();
  /* the chips read the face as drawn: an empty column's own Edit a clause
     button means no chip repeats it (caEditChipBtn) */
  pdChipsRepaint();
  /* what the Negotiate page loads after it paints — the thread from their
     page and the share list (Send all in one press needs their address) */
  try { if (typeof rlBenchCatchUp === 'function') rlBenchCatchUp(c, () => { if (pdRedShows() && String(pdRedFor()) === String(c.id)) pdRedRepaint(); }); } catch (_){}
  const keep = _pdRedTop != null ? _pdRedTop : top; _pdRedTop = null;
  const sc = host.querySelector('#nego-cards');
  if (sc && keep){ if (typeof rlRestoreScroll === 'function') rlRestoreScroll(sc, keep); else sc.scrollTop = keep; }
}
/* the face's own presses, bound once per host: × and a row's note count.
   THE NOTE OPENS HERE (stage 5: the Negotiate page folded into Home) — the
   page's own press, done for this face's contract: on our seat the note's own
   window (openChangeNoteDialog), else the change's thread in the shell's
   drawer (openNotesPanel), which stands over Jambo's panel */
function pdRedWire(host){
  if (!host || host.dataset.pdRfBound) return;
  host.dataset.pdRfBound = '1';
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-pd-rf-close]')){ e.preventDefault(); pdRedClose(); return; }
    const notes = t.closest('[data-rl-notes]');
    if (notes){
      e.preventDefault(); e.stopPropagation();
      const c = pdContract(); const id = notes.getAttribute('data-rl-notes');
      if (!c || !id) return;
      const ch = (typeof negoChangeById === 'function') ? negoChangeById(c, id) : null;
      if (ch && typeof openChangeNoteDialog === 'function'){
        const me = (typeof currentUser === 'function' && currentUser()) || null;
        Promise.resolve(openChangeNoteDialog(c, ch, { author: (me && me.name) || undefined })).then(out => { if (out) pdRedRepaint(); });
        return;
      }
      if (typeof openNotesPanel === 'function') openNotesPanel(c.id, id);
    }
  });
}
/* A PRESS ON A CHANGED CLAUSE ON THE PAPER PICKS ITS ROW, as on the Negotiate
   page — while the face is up. Bound once on Home's paper host. */
function pdRedPaperWire(){
  const paper = document.getElementById('ig-paper');
  if (!paper || paper.dataset.pdRfBound) return;
  paper.dataset.pdRfBound = '1';
  paper.addEventListener('click', e => {
    if (!pdRedShows()) return;
    const a = e.target && e.target.closest ? e.target.closest('[data-nego-card-anchor]') : null;
    if (!a) return;
    const id = String(a.getAttribute('data-nego-card-anchor') || '').split(/\s+/)[0];
    const c = pdContract();
    if (id && c && typeof rlLinkFocus === 'function') try { rlLinkFocus(c, id, 'clause'); } catch (_){}
  });
}

/* ============================================================
   BEFORE YOU SIGN, BESIDE THE PAPER
   (the one-page Home plan, stage 5, docs/PLAN-one-page-home.md; the owner
   picked "Checklist" by name on 14 Oct 2026, with all three recommendations:
   the Negotiate page folds into Home; the room's Details, Signing,
   Obligations and History tabs go; once both have signed the face stays as
   the receipt)
   ============================================================
   A FACE OF JAMBO'S TAB, like Fill in and Redlines: it stands where the
   conversation stands, the box and the chips at the panel's foot. IT OWNS NO
   BUILDER AND NO WRITER. The room's Signing column was always four slots
   filled by one painter — #sign-seal-acts, #sign-side, #sign-block and
   #sign-wrap, which renderSignButton fills (and through it renderSignSide,
   the approval panel's wiring and the signature block). The face draws the
   same four slots, so the same painter fills them here: the before-you-sign
   list, the approval asked of you, the approval gate, the signing order and
   its editor, the places on the paper, the signature block and the Sign
   button, every press the room's own. Only one view is drawn at a time
   (#content), so the slots' ids are never on the page twice.
   THE PAPER BESIDE IT IS THE SIGNING COPY while the face is open (igPaperHtml
   reads pdSignFor), with the places to sign and every signature given marked
   on it as the Signing tab marked them; closing puts back the paper that was
   there. Nothing is signed until Sign is pressed and the pad is finished —
   the pad, its intent line and the server's checks are unchanged. */
let _pdSign = null;          // the contract the face is open for, or null
function pdSignFor(){ return _pdSign; }
/* the face is up: Home's paper holds the contract it was opened for and
   Jambo's tab is lit */
function pdSignShows(){
  if (!_pdSign || _pdTab !== 'copilot' || !pdOnPaper()) return false;
  const c = pdContract(); return !!(c && String(c.id) === _pdSign);
}
/* the one door: false where Home has no paper (the phone), and the caller
   carries on to the phone's own screens */
function pdSignOpen(id){ return pdOpenOnHome(id, 'signing'); }
/* ---- THE WAY BACK TO JAMBO (owner picked "Tabs and faces" by name, round 3
   of the redesign, 17 Oct 2026) ----
   Every face's head opens with "‹ Jambo", as a desk tab's crumb opens with
   "‹ The counter"; its × stays at the end. Both do the face's one close (the
   map below, pressed by the one delegated listener) — nothing new is done. */
const PD_BACK_CLOSE = { fill: () => pdFillClose(), red: () => pdRedClose(), signing: () => pdSignClose(), amend: () => pdAmendClose() };
function pdBackHtml(face){
  const t = _pdT('pd_back_jambo');
  return `<button type="button" class="pd-back" data-pd-back="${_pdE(face)}" title="${_pdE(t)}" aria-label="${_pdE(t)}"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg>${_pdE(_pdT('pd_tab_copilot'))}</button>`;
}
/* WHICH FACE IS UP, FOR A REFRESH (the owner's rule: a refresh lands at the
   same spot; stage 5 — the Negotiate page a refresh used to land back on
   folded into the Redlines face): the face's door word, or '' */
function pdFaceNow(){
  if (pdAmendShows()) return 'amend';
  if (pdSignShows()) return 'signing';
  if (pdRedShows()) return 'red';
  if (pdFillShows()) return 'fill';
  return '';
}
const PD_FACE_WORDS = ['fill', 'red', 'signing', 'amend'];
/* another contract asked for puts the face away (igAnalyze), as Fill in's */
function pdSignSeen(id){ if (_pdSign && String(id) !== _pdSign) _pdSign = null; }
function pdSignAway(){ _pdSign = null; }
function pdSignClose(){
  const id = _pdSign; _pdSign = null;
  pdPresenceOff(id);
  const a = (typeof document !== 'undefined') ? document.activeElement : null;
  if (a && a.closest && a.closest('#pd-signface') && typeof a.blur === 'function') a.blur();
  pdSignPaper(id);
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* the paper beside it turns to the signing copy, and back when the face closes */
function pdSignPaper(id){
  if (typeof intel !== 'object' || !intel || !intel.paper || String(intel.paper.id) !== String(id)) return;
  if (typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){}
}
/* SIGNED, OR STILL OPEN: the head's word and pill read the one list the Sign
   button reads (signReadiness), never a count of its own */
/* "TO SETTLE" COUNTS ONLY WHAT SOMEBODY HERE CAN SETTLE (the gaps, round 10
   "The road", 18 Oct 2026: "1 to settle" while Jonas's yes waits and Helio
   signs first): another signer's turn is a wait, not a thing to settle — the
   road says whose it is at their own stop, and the pill says it waits on them
   only when nothing else of ours is left. Read off the same one list. */
function pdSignState(c){
  const closed = !!(c && (c.status === 'Signed' || (typeof negoExecuted === 'function' && negoExecuted(c))));
  let rd = { holds: [], noted: [] };
  if (!closed) try { rd = (typeof signReadiness === 'function') ? signReadiness(c) : rd; } catch (_){}
  const all = rd.holds || [];
  const waits = all.filter(h => h && h.kind === 'turn').length;
  const holds = all.length - waits, noted = (rd.noted || []).length;
  return { closed, holds, waits, noted };
}
/* whose turn the road waits on, in the pill's few words: theirs, or a colleague's by first name */
function pdSignWaitsWord(c){
  const ns = (c && typeof nextSigner === 'function') ? nextSigner(c) : null;
  if (!ns || ns.party === 'counterparty') return _pdT('pd_sf_waits_theirs');
  const who = pdFirstName(ns.name);
  return who ? _pdT('pd_sf_waits_on', { who }) : _pdT('pd_sf_waits_theirs');
}
function pdSignPillHtml(c){
  const s = pdSignState(c);
  if (s.closed) return pdPill('ok', _pdT('pd_st_signed'));
  if (s.holds) return pdPill('warn', _pdTn('sc_n_to_settle', s.holds, { n: s.holds }));
  if (s.waits) return pdPill('quiet', pdSignWaitsWord(c));
  if (s.noted) return pdPill('quiet', _pdTn('sc_n_noted', s.noted, { n: s.noted }));
  return pdPill('ok', _pdT('pd_st_ready'));
}
function pdSignHeadHtml(c){
  const close = _pdT('act_close');
  const s = pdSignState(c);
  /* signed, the title says so and the pill would say it twice */
  return `<div class="pd-sf-r">${pdBackHtml('signing')}<h3>${_pdE(_pdT(s.closed ? 'pd_st_signed' : 'pd_sf_title'))}</h3><span data-pd-sf-pill>${s.closed ? '' : pdSignPillHtml(c)}</span>
      <button type="button" class="pd-sf-x" data-pd-sf-close title="${_pdE(close)}" aria-label="${_pdE(close)}">×</button></div>`;
}
/* ONCE BOTH HAVE SIGNED THE FACE IS THE RECEIPT (the owner's yes, decision
   3), and EVERY STEP STARTS THE NEXT (rule 4): what the signature starts —
   the duties it begins, read RAW off c.obligations — one press from the
   Board's Obligations view. Nothing is counted that the view does not draw. */
function pdSignNextHtml(c){
  if (!pdSignState(c).closed) return '';
  const obs = (Array.isArray(c.obligations) ? c.obligations : []).filter(o => o && o.status !== 'done');
  const due = o => { try { return String(((typeof obligationDue === 'function') ? obligationDue(o) : (o && o.due)) || '').slice(0, 10); } catch (_){ return ''; } };
  const first = obs.slice().filter(o => due(o)).sort((a, b) => due(a).localeCompare(due(b)))[0] || null;
  let when = '';
  /* the date in the words the Obligations view says it in (obligationDueSay) */
  if (first) try { const d = (typeof obligationDueSay === 'function') ? obligationDueSay(first, c) : null; when = (d && typeof d === 'object' && d.day) ? String(d.day) : due(first); } catch (_){ when = due(first); }
  const say = !obs.length ? _pdT('pd_sf_next_none')
    : first ? _pdTn('pd_sf_next_n', obs.length, { n: obs.length, what: first.desc || first.title || '', when })
    : _pdTn('pd_sf_next_nodue', obs.length, { n: obs.length });
  const go = (obs.length && typeof hbOpenView === 'function')
    ? `<button type="button" class="pd-go" data-pd-sf-oblig="${_pdE(c.id)}">${_pdE(_pdT('pd_sf_next_go'))}${PD_GO_ARROW}</button>` : '';
  return `<section class="pd-sf-next"><h6>${_pdE(_pdT('pd_sf_next_head'))}</h6><p>${_pdE(say)}</p>${go}</section>`;
}
/* ---- THE ROAD (round 10 of the redesign: the owner picked "The road" by
   name and said yes to the Sign button appearing only to the person whose
   turn it is, 17 Oct 2026) ----
   The way to "signed" as stops: the checks, the yes where an approval is
   asked, each step of the signing route, sealed and sent. Each stop is a
   READING of what the column already reads (signReadiness, signSteps,
   nextSigner) — nothing here holds, writes or decides. The column's own body
   stands open under the stop the road is at, its buttons wired by their
   painters as before; the Sign button stands only in the stop of the person
   whose turn it is (grey with its reason where something still holds), and
   nowhere for anyone else. */
const PD_RD_YES = ['approval', 'signapproval'];
const PD_RD_SIGN = ['turn', 'signers', 'spots', 'signcap', 'signfolder'];
/* whose turn it is, read as the signing act reads it (signDocument): the next
   signer on our side, and either reserved for this person or for anyone */
function pdSignMine(c){
  if (!c || pdSignState(c).closed || typeof nextSigner !== 'function') return false;
  const ns = nextSigner(c); if (!ns || ns.party !== 'internal') return false;
  const u = (typeof currentUser === 'function') ? currentUser() : null;
  return !ns.memberId || !!(u && String(u.id) === String(ns.memberId));
}
/* ---- THE ROAD AS DRAWN, EVERY PART (the owner's yes of 18 Oct 2026 to
   build every gap between the picked drawing and HaTi) ----
   READY TO SIGN NAMES ITS CHECKS: the holds that are neither the yes nor the
   signing turn are grouped into the checks a reader knows by name — the
   wording, our standards, the promises, the details and the brief — "5
   checks clear: wording, standards, …", or "3 to settle: standards, …".
   A kind this map does not name is about the paper (SIGN_STAGE_OF's honest
   default), so it counts against the wording. */
const PD_RD_CHECKS = [
  ['wording', ['negotiation', 'placeholders', 'blanks', 'docs', 'hold', 'ho-blanks', 'signcheck']],
  ['standards', ['standards-read', 'standard', 'risk']],
  ['promises', ['obligations', 'oblig-gaps']],
  ['details', ['fields', 'counterparty', 'value', 'record']],
  ['brief', ['brief', 'brief-read']],
];
function pdRoadCheckOf(kind){ const hit = PD_RD_CHECKS.find(x => x[1].includes(String(kind || ''))); return hit ? hit[0] : 'wording'; }
function pdRoadCheckNames(keys){ return keys.map(k => _pdT('pd_rd_ck_' + k)).join(', '); }
/* A DAY, AS A PERSON SAYS IT: within the week ahead its weekday's name in
   the reader's language ("Friday"), today "today", else the date ("22 Oct") */
const PD_RD_WEEK_DAYS = 6;
function pdDayWord(iso){
  const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const t = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  const at = Date.parse(d + 'T12:00:00Z'), now = Date.parse(t + 'T12:00:00Z');
  const ahead = Math.round((at - now) / 864e5);
  let loc; try { loc = (typeof langLocale === 'function') ? langLocale() : undefined; } catch (_){ loc = undefined; }
  try {
    if (ahead === 0) return _pdT('pd_rd_today');
    if (ahead > 0 && ahead <= PD_RD_WEEK_DAYS) return new Date(at).toLocaleDateString(loc, { weekday: 'long', timeZone: 'UTC' });
    return new Date(at).toLocaleDateString(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  } catch (_){ return d; }
}
/* the working day after the last day away: when they are back */
function pdBackDay(iso){
  const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const x = new Date(d + 'T12:00:00Z');
  do x.setUTCDate(x.getUTCDate() + 1); while (x.getUTCDay() === 0 || x.getUTCDay() === 6);
  return pdDayWord(x.toISOString().slice(0, 10));
}
/* WHOM THE READER ANSWERS FOR, TODAY: the When you're away rule the
   bootstrap carried (state.away.covering) — a reading; the server is the
   wall (awayCovers). Null where the reader stands in for nobody by that id. */
function pdAwayOf(personId){
  if (personId == null || personId === '') return null;
  const a = (typeof state === 'object' && state) ? state.away : null;
  const t = (typeof todayISO === 'function') ? todayISO() : '';
  const r = (a && Array.isArray(a.covering)) ? a.covering.find(x => x && String(x.userId) === String(personId) && (!t || (x.from <= t && t <= x.to))) : null;
  return r ? { id: String(personId), name: String(r.userName || ''), to: String(r.to || '') } : null;
}
const pdFirstName = n => String(n || '').trim().split(/\s+/)[0] || '';
/* ---- A NAMED PERSON'S YES ON THE ROAD ----
   The one approval the stop is about (the first that still holds, else the
   last one given), read through the approval's own readings
   (signApprovalStateOf, saMayDecide) and nothing else: the capacity this
   reader would decide it in, whether they asked it, and — where they stand
   in for the approver today — whom for. */
function pdRoadYesOf(c){
  if (!c || typeof signApprovalStateOf !== 'function') return null;
  let st; try { st = signApprovalStateOf(c); } catch (_){ return null; }
  if (!st || st.started || !st.rows.length) return null;
  const row = st.rows.find(r => r.status !== 'approved') || st.rows[st.rows.length - 1];
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const req = row.req || null;
  let as = null;
  if (req && row.status === 'pending' && me && typeof saMayDecide === 'function') try { as = saMayDecide(req, me) || null; } catch (_){ as = null; }
  const asker = !!(req && req.askedBy && me && String(req.askedBy.id) === String(me.id));
  const n = row.need || {};
  const away = as === 'deputy' ? (pdAwayOf(n.approverId) || pdAwayOf(n.backupId)) : null;
  /* their signature waits for them: the person stood in for is also one of our signers */
  const signs = !!(away && (Array.isArray(c.signerPlan) ? c.signerPlan : []).some(s => s && s.party !== 'counterparty' && String(s.memberId || '') === away.id));
  return { row, req, status: row.status, as, asker, away, signs, approverId: String(n.approverId || ''), approver: String(n.approverName || '') };
}
function pdRoadYesTitle(y){
  if (!y) return _pdT('pd_rd_yes');
  return y.approverId ? _pdT('pd_rd_yes_of', { who: y.approver }) : _pdT('pd_rd_yes_admin');
}
/* the frame is drawn where the yes is the reader's work: at the open stop,
   or wherever a request waits that this reader may decide */
function pdRoadYesFramed(y, isCur){ return !!y && y.status !== 'approved' && (isCur || (y.status === 'pending' && !!y.as)); }
/* WHAT THE YES COVERS, in one sentence: who asked, the round as it stands,
   the money it was stamped with, the signers — a change undoes it */
function pdRoadYesFacts(c, y){
  const req = y.req; if (!req) return '';
  const s = req.shows || {};
  const parts = [s.round ? _pdT('pd_rd_y_round', { n: s.round }) : _pdT('pd_rd_y_now')];
  if (s.value != null){
    let cur = ''; try { cur = (typeof contractCurrency === 'function') ? contractCurrency(c) : ''; } catch (_){ cur = ''; }
    parts.push((typeof fmtMoneyShortIn === 'function') ? fmtMoneyShortIn(Number(s.value) || 0, s.currency || cur) : String(s.value));
  }
  if (Array.isArray(s.signers) && s.signers.length) parts.push(_pdT('pd_rd_y_signers'));
  const what = parts.length > 1 ? parts.slice(0, -1).join(', ') + _pdT('pd_rd_y_and') + parts[parts.length - 1] : parts[0];
  return _pdT('pd_rd_y_facts', { who: (req.askedBy && req.askedBy.name) || '', what });
}
let _pdRdShow = false;      // the checks unfolded under Ready to sign, for the sitting
let _pdRdMoved = false;     // "What moved" opened under the yes, for the sitting
function pdRoadYesHtml(c, y){
  const st = y.status, req = y.req;
  const chip = (t, cls) => `<span class="pd-rd-st${cls ? ' ' + cls : ''}">${_pdE(t)}</span>`;
  const sep = t => `<i>${_pdE(t)}</i>`;
  const asked = req && req.askedAt && st !== 'unasked' ? _pdT('pd_rd_st_asked', { day: pdDayWord(req.askedAt) }) : _pdT('pd_rd_st_unasked');
  /* WHERE THE APPROVAL STANDS, on the stop itself: asked › waiting › approved · or refused, lapsed */
  const states = `<div class="pd-rd-states" role="img" aria-label="${_pdE(_pdT('pd_rd_st_aria'))}">${chip(asked, st === 'unasked' ? 'is-cur' : 'is-past')}${sep('›')}${
    chip(_pdT('pd_rd_st_waiting'), st === 'pending' ? 'is-cur' : (st === 'unasked' ? '' : 'is-past'))}${sep('›')}${chip(_pdT('pd_rd_st_approved'), st === 'approved' ? 'is-ok' : '')}${
    sep(_pdT('pd_rd_st_or'))}${chip(_pdT('pd_rd_st_refused'), st === 'refused' ? 'is-bad' : '')}${chip(_pdT('pd_rd_st_lapsed'), st === 'lapsed' ? 'is-cur' : '')}</div>`;
  /* JAMBO'S LINE WHERE THE STAND-IN RULE APPLIES: said at the stop it is
     about, from the When you're away rule — the yes may be given for them,
     their signature never */
  const first = pdFirstName((y.away && y.away.name) || y.approver);
  const standin = (st === 'pending' && y.as === 'deputy' && y.away)
    ? `<div class="pd-rd-jline">${(typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 22, 'pd-rd-face') : ''}<span>${_pdE(_pdT(y.signs ? 'pd_rd_standin' : 'pd_rd_standin_nosign', { who: first, day: pdDayWord(y.away.to) }))}</span></div>` : '';
  /* the facts: the drawn sentence while it waits; otherwise the approval
     row's own sentence (refused with its reason, lapsed with what moved,
     not yet asked with who approves) — one reading with the column's row */
  let facts = '';
  if (st === 'pending') facts = pdRoadYesFacts(c, y);
  else if (typeof signApprovalRowWhy === 'function'){
    let rows = []; try { rows = (typeof signApprovalRows === 'function') ? signApprovalRows(c) : []; } catch (_){ rows = []; }
    const sa = rows.find(r => r && r.need && y.row && y.row.need && String(r.need.key) === String(y.row.need.key));
    try { facts = sa ? signApprovalRowWhy(c, sa) : ''; } catch (_){ facts = ''; }
  }
  const note = (st === 'pending' && req && req.note) ? `<p class="pd-rd-note">“${_pdE(req.note)}”</p>` : '';
  const acts = [];
  if (st === 'pending' && y.as){
    /* the approval's own acts (signApprovalDecide, openSignApprovalRefuse): an admin deciding in another's place says why */
    const lab = y.as === 'deputy' && first ? _pdT('pd_rd_approve_for', { who: first }) : y.as === 'admin' ? _pdT('pd_rd_approve_why') : _pdT('pd_rd_approve');
    acts.push(`<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-pd-rd-approve="${_pdE(req.id)}" data-pd-rd-as="${_pdE(y.as)}">${_pdE(lab)}</button>`);
    acts.push(`<button type="button" class="ui-btn ui-btn-sm" data-pd-rd-refuse="${_pdE(req.id)}">${_pdE(_pdT('pd_rd_refuse'))}</button>`);
  } else if (st === 'pending' && req && (y.asker || ((typeof currentUser === 'function') && (currentUser() || {}).role === 'admin'))){
    acts.push(`<button type="button" class="ui-btn ui-btn-sm" data-pd-rd-remind="${_pdE(req.id)}">${_pdE(_pdT('pd_rd_remind', { who: pdFirstName(y.approver) || _pdT('sa_admins') }))}</button>`);
  } else if (st === 'unasked' || st === 'refused' || st === 'lapsed'){
    let can = { ok: false, why: '' }; try { can = (typeof signApprovalRequestable === 'function') ? signApprovalRequestable(c) : can; } catch (_){}
    const lab = _pdT(st === 'refused' ? 'pd_rd_change_again' : st === 'lapsed' ? 'pd_rd_send_again' : 'pd_rd_send');
    /* a dead button says why where HaTi knows it; the approver is never offered their own ask */
    const mayEdit = (typeof canEdit !== 'function') || canEdit();
    if (can.ok) acts.push(`<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-pd-rd-ask="1">${_pdE(lab)}</button>`);
    else if (mayEdit && can.why && can.why !== _pdT('sa_you_approve_it') && can.why !== _pdT('sa_nothing_to_ask'))
      acts.push(`<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" disabled aria-disabled="true" title="${_pdE(can.why)}">${_pdE(lab)}</button>`);
  }
  /* WHAT MOVED: the brief's own reading of what this round changed (briefMoved, as the approval card read it) */
  let moved = null; try { moved = (st === 'pending' && typeof briefMoved === 'function') ? briefMoved(c) : null; } catch (_){ moved = null; }
  const hasMoved = !!(moved && moved.rows && moved.rows.length);
  if (hasMoved) acts.push(`<button type="button" class="pd-rd-lk" data-pd-rd-moved aria-expanded="${_pdRdMoved}">${_pdE(_pdT('pd_rd_moved'))}</button>`);
  const movedHtml = (hasMoved && _pdRdMoved) ? `<ul class="pd-rd-mv">${moved.rows.map(x => `<li><b>${_pdE(x.clause)}</b> — ${_pdE(x.said || _pdT('br_moved_nosay'))}</li>`).join('')}${
    moved.over ? `<li class="pd-rd-mv-more">${_pdE(_pdT('br_moved_more', { n: moved.over }))}</li>` : ''}</ul>` : '';
  /* THE EMAIL'S LINK LANDS HERE (HASH_GO approval → #sa-card): the frame is the
     approval asked of you, so it carries the card's id where the card would
     have been drawn — the column's own card is not drawn on this face */
  const id = (st === 'pending' && y.as) ? ' id="sa-card"' : '';
  return `<div class="pd-rd-card sa-card"${id} data-pd-rd-yes="${_pdE(st)}"${req ? ` data-sa-req="${_pdE(req.id)}"` : ''}>${states}${standin}${facts ? `<p class="pd-rd-facts">${_pdE(facts)}</p>` : ''}${note}${
    acts.length ? `<div class="pd-rd-acts">${acts.join('')}</div>` : ''}${movedHtml}</div>`;
}
function pdRoadStops(c){
  const s = pdSignState(c);
  let rd = { holds: [], rows: [] };
  if (!s.closed) try { rd = (typeof signReadiness === 'function') ? (signReadiness(c) || rd) : rd; } catch (_){}
  const holds = rd.holds || [];
  const checks = holds.filter(h => !PD_RD_YES.includes(h.kind) && !PD_RD_SIGN.includes(h.kind));
  const yes = holds.filter(h => PD_RD_YES.includes(h.kind));
  const yesSettled = (rd.rows || []).some(r => r && r.kind === 'signapproval' && r.settled);
  const stops = [];
  const ready = s.closed || !checks.length;
  const open = PD_RD_CHECKS.map(x => x[0]).filter(k => checks.some(h => pdRoadCheckOf(h.kind) === k));
  /* A CHECK IS CLEAR ONLY WHERE IT CAME BACK CLEAR (the gaps, round 10, 18 Oct
     2026: "4 checks clear: wording, standards, promises, details" names checks
     that passed): one the gate lets through without holding — not read yet, or
     a finding shown — is named apart, never counted as clear */
  const noted = (rd.noted || []).filter(h => !PD_RD_YES.includes(h.kind) && !PD_RD_SIGN.includes(h.kind));
  const unclear = PD_RD_CHECKS.map(x => x[0]).filter(k => !open.includes(k) && noted.some(h => pdRoadCheckOf(h.kind) === k));
  const clear = PD_RD_CHECKS.map(x => x[0]).filter(k => !open.includes(k) && !unclear.includes(k));
  stops.push({ k: 'ready', done: ready, t: _pdT('pd_rd_ready'),
    sub: ready ? [clear.length ? _pdTn('pd_rd_checks_clear', clear.length, { n: clear.length, names: pdRoadCheckNames(clear) }) : '',
        unclear.length ? _pdT('pd_rd_checks_unclear', { names: pdRoadCheckNames(unclear) }) : ''].filter(Boolean).join(' · ')
      : `${_pdTn('sc_n_to_settle', checks.length, { n: checks.length })}: ${pdRoadCheckNames(open)}` });
  /* the named yes, where one is asked (a rule's approval keeps the stop's own words) */
  const named = !s.closed && (yes.some(h => h.kind === 'signapproval') || (!yes.length && yesSettled));
  const y = named ? pdRoadYesOf(c) : null;
  /* ONCE SIGNING HAS BEGUN, AND ON THE RECEIPT, the yes is read off the
     record itself (c.signApprovals, the last word per approver): every stop
     ticked, "Approved by Maria for Jonas, 19 Oct", never a stop that vanished */
  const given = pdRoadYesGiven(c);
  const kept = !yes.length && !yesSettled && (s.closed || pdRoadStarted(c)) && given.length > 0;
  if (yes.length || yesSettled || kept){
    const req = (y && y.status === 'approved' && y.req) ? y.req : (!yes.length && given.length ? given[given.length - 1] : null);
    const by = req && req.decidedBy ? String(req.decidedBy.name || '') : '';
    const said = req ? _pdT('pd_rd_y_given', { who: (typeof awayByLabel === 'function') ? awayByLabel(by, req.for) : by, day: pdDayWord(req.decidedAt) }) : '';
    stops.push({ k: 'yes', done: s.closed || !yes.length, t: (y && yes.every(h => h.kind === 'signapproval')) ? pdRoadYesTitle(y)
        : (kept && req && req.approverName) ? _pdT('pd_rd_yes_of', { who: String(req.approverName) }) : _pdT('pd_rd_yes'),
      sub: yes.length ? String(yes[0].short || yes[0].label || '') : (said || _pdT('pd_rd_yes_done')), yes: y });
  }
  /* while a yes still holds, no signing link opens and nobody signs */
  const yesHolds = yes.length > 0;
  let steps = []; try { steps = (typeof signSteps === 'function') ? signSteps(c) : []; } catch (_){ steps = []; }
  const now = (typeof signStepNow === 'function') ? signStepNow(c) : 0;
  const mine = pdSignMine(c);
  let ours = ''; try { ours = (typeof contractParty === 'function') ? String(contractParty(c) || '') : ''; } catch (_){ ours = ''; }
  if (!steps.length && !s.closed) stops.push({ k: 'who', done: false, t: _pdT('pd_rd_who'), sub: _pdT('pd_rd_nobody') });
  steps.forEach(st => {
    const theirs = st.rows.every(r => r && r.party === 'counterparty');
    const party = theirs ? (String(c.counterparty || '').trim() || _pdT('ng_the_counterparty')) : (ours || _pdT('pd_rd_us'));
    const names = st.rows.map(r => String((r && r.name) || '').trim()).filter(Boolean).join(' · ');
    const done = st.rows.every(r => r && r.signed);
    const here = !done && st.n === now;
    const isMine = here && mine && st.rows.some(r => r && r.party === 'internal');
    /* a signer of ours who is away: when they are back, and that nobody signs for them */
    const away = done ? null : st.rows.map(r => (r && r.party !== 'counterparty' && !r.signed) ? pdAwayOf(r.memberId) : null).find(Boolean);
    /* signed, the day each signed ("Henrik Dahl · signed 20 Oct"); else what the stop waits for */
    const signedDay = done ? st.rows.map(r => r && r.at).filter(Boolean).sort().pop() : '';
    const state = done ? (signedDay ? _pdT('pd_rd_signed_on', { day: pdDayWord(signedDay) }) : _pdT('pd_rd_signed'))
      : yesHolds ? _pdT(theirs ? 'pd_rd_after_yes_theirs' : 'pd_rd_after_yes')
      : here ? _pdT(isMine ? 'pd_rd_turn_you' : 'pd_rd_turn') : _pdT('pd_rd_after');
    const sub = away ? [names, _pdT('pd_rd_back', { day: pdBackDay(away.to) }), _pdT('pd_rd_only_they')] : [names, state];
    stops.push({ k: 'step' + st.n, done, mine: isMine, here: here && !isMine && !yesHolds, ids: st.rows.map(r => String((r && r.id) || '')).filter(Boolean),
      t: _pdT('pd_rd_signs', { party }), sub: sub.filter(Boolean).join(' · ') });
  });
  const obs = (Array.isArray(c.obligations) ? c.obligations : []).filter(o => o && o.status !== 'done').length;
  stops.push({ k: 'sealed', done: s.closed, t: _pdT('pd_rd_sealed'),
    sub: [_pdT('pd_rd_copies'), obs ? _pdTn('pd_rd_obls', obs, { n: obs }) : ''].filter(Boolean).join(' · ') });
  const cur = stops.findIndex(x => !x.done);
  const at = cur < 0 ? stops.length - 1 : cur;
  const yesAt = stops.findIndex(x => x.k === 'yes');
  const framed = yesAt >= 0 && pdRoadYesFramed(stops[yesAt].yes, yesAt === at);
  /* WHO SIGNS CAN STILL CHANGE until the first signature (signingLocked), for someone who may edit */
  let locked = true; try { locked = s.closed || (typeof signingLocked === 'function' ? !!signingLocked(c) : true); } catch (_){ locked = true; }
  const route = !locked && ((typeof canEdit !== 'function') || canEdit()) && typeof openSignerPlanEditor === 'function';
  /* ANOTHER SIGNER'S TURN IS THEIR STOP'S OWN (the gaps, round 10: "the
     current one is open with its buttons, later ones say what they wait
     for"): the column does not stand open under it — its readings, the yes
     and the signing order are other stops' — only that signer's own buttons */
  const theirTurn = !s.closed && !!(stops[at] && stops[at].here);
  return { stops, cur: at, mineAt: stops.findIndex(x => x.mine), closed: s.closed, yesAt: framed ? yesAt : -1,
    /* while the yes is framed — the open stop, or the reader's own work — or
       another signer's stop is the open one, the column folds behind Ready to
       sign's "Show" */
    fold: framed || theirTurn, theirAt: theirTurn ? at : -1, route };
}
/* the yes on the record: the last approved request per approver, never one withdrawn or replaced */
function pdRoadYesGiven(c){
  const list = (c && Array.isArray(c.signApprovals)) ? c.signApprovals : [];
  const last = new Map();
  list.forEach(r => { if (r && r.key != null) last.set(String(r.key), r); });
  return [...last.values()].filter(r => r.status === 'approved' && r.decidedAt);
}
/* signing has begun: a signature on the record, or a handover in progress (saStarted's own reading) */
function pdRoadStarted(c){
  if (typeof saStarted === 'function') try { return !!saStarted(c); } catch (_){}
  return !!(c && Array.isArray(c.signatures) && c.signatures.length);
}
/* THE OPEN STOP'S OWN BUTTONS, where it is another signer's turn: the
   signing order's own buttons for those signers (Email their signing link,
   Tell, Remind — drawn by renderSignSide), pressed through, never a second act */
const PD_RD_ROW_ACTS = ['data-sp-send', 'data-sp-notify'];
function pdRoadTheirActs(host, x){
  if (!host || !x || !Array.isArray(x.ids)) return '';
  const cssq = v => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&');
  const out = [];
  x.ids.forEach(id => PD_RD_ROW_ACTS.forEach(a => {
    const b = host.querySelector(`#sign-side [${a}="${cssq(id)}"]`); if (!b) return;
    const off = !!b.disabled;
    out.push(`<button type="button" class="ui-btn ui-btn-sm" data-pd-rd-press="${_pdE(a)}" data-pd-rd-row="${_pdE(id)}"${off ? ` disabled aria-disabled="true" title="${_pdE(b.getAttribute('title') || '')}"` : ''}>${_pdE(b.textContent.replace(/\s+/g, ' ').trim())}</button>`);
  }));
  return out.length ? `<div class="pd-rd-acts">${out.join('')}</div>` : '';
}
/* drawn in place after every paint of the column (pdSignCounts): the stops,
   and where the column's body and the Sign button stand among them */
function pdRoadPaint(c){
  const host = (typeof document !== 'undefined') ? document.getElementById('pd-signface') : null; if (!host || !c) return;
  const w = host.querySelector('[data-pd-road]'); if (!w) return;
  const R = pdRoadStops(c);
  const h = R.stops.map((x, i) => {
    const framed = i === R.yesAt && !!x.yes;
    const show = (x.k === 'ready' && R.fold) ? ` · <button type="button" class="pd-rd-lk" data-pd-rd-show aria-expanded="${_pdRdShow}">${_pdE(_pdT(_pdRdShow ? 'pd_rd_hide' : 'pd_rd_show'))}</button>` : '';
    const acts = i === R.theirAt ? pdRoadTheirActs(host, x) : '';
    return `<div class="pd-road-stop ${x.done ? 'is-done' : i === R.cur ? 'is-now' : 'is-later'}${framed ? ' is-framed' : ''}${i === R.stops.length - 1 ? ' is-last' : ''}" data-pd-road-stop="${_pdE(x.k)}" style="order:${2 * i + 2}">
      <i class="pd-road-dot" aria-hidden="true">${x.done ? '✓' : (i === R.cur || framed) ? '!' : ''}</i><div class="pd-road-t"><b>${_pdE(x.t)}</b>${
        framed ? pdRoadYesHtml(c, x.yes) : (x.sub ? `<small>${_pdE(x.sub)}${show}</small>` : '')}${acts}</div></div>`; }).join('');
  if (w.innerHTML !== h) w.innerHTML = h;
  /* the foot line: who signs can change until the first signature, and the route's own editor */
  const rf = host.querySelector('[data-pd-rd-foot]');
  if (rf){ const fh = R.route ? `<span>${_pdE(_pdT('pd_rd_change_line'))}</span><button type="button" class="ui-btn ui-btn-sm" data-pd-rd-route>${_pdE(_pdT('pd_rd_change'))}</button>` : '';
    if (rf.innerHTML !== fh) rf.innerHTML = fh;
    rf.style.order = String(2 * R.stops.length + 6); rf.style.display = fh ? '' : 'none'; }
  const body = host.querySelector('.pd-sf-body');
  if (body){
    /* folded behind Ready to sign's "Show" while the yes is the work; shown, it stands under Ready to sign */
    body.style.order = String(R.fold ? 3 : 2 * R.cur + 3);
    body.style.display = (R.fold && !_pdRdShow) ? 'none' : '';
  }
  const foot = host.querySelector('.pd-sf-foot');
  if (foot){ const show = R.mineAt >= 0;
    /* THE SIGN BUTTON ONLY IN THE READER'S OWN STOP, and nothing else at the
       foot (the gaps, round 10: "the foot follows the last stop"): "Signing it
       their way…" (#sign-paper) is a choice of route, and its door is the
       Menu tab's row now (#ws-m-their-way, roomActsRowsHtml) */
    const paperRoute = foot.querySelector('#sign-paper'); if (paperRoute) paperRoute.style.display = 'none';
    foot.style.order = String(show ? 2 * R.mineAt + 3 : 2 * R.cur + 4);
    foot.style.display = show ? '' : 'none';
    const btn = foot.querySelector('#sign-btn'); if (btn) btn.style.display = show ? '' : 'none';
    /* the button's own line under it ("Press to go to the first thing…") goes with it */
    const line = btn && btn.nextElementSibling; if (line && line.tagName === 'P') line.style.display = show ? '' : 'none';
    foot.toggleAttribute('data-pd-road-mine', show); }
}
function pdSignFaceHtml(c){
  if (!c) return '';
  _pdActs.clear();
  /* OPEN, the Sign button is held at the foot; SIGNED, the face is a receipt
     read top to bottom — the seal's two acts, what starts now, the sealed
     line and the copies, then the record of who approved and signed */
  const closed = pdSignState(c).closed;
  const wrap = `<div id="sign-wrap"></div>`;
  return `<div class="pd-sf is-road${closed ? ' is-closed' : ''}" data-pd-sf="${_pdE(c.id)}">
    <div class="pd-sf-h" data-pd-sf-head>${pdSignHeadHtml(c)}</div>
    <div class="pd-road-w" data-pd-road></div>
    <div class="pd-sf-body scroll-thin sign-one">
      <div id="sign-seal-acts" class="sign-seal-acts"></div>
      <div data-pd-sf-next>${pdSignNextHtml(c)}</div>
      ${closed ? `<div class="pd-sf-wrap">${wrap}</div>` : ''}
      <div id="sign-side" style="display:flex;flex-direction:column"></div>
      <div class="pd-sf-block"><div id="sign-block"></div></div>
    </div>
    ${closed ? '' : `<div class="pd-sf-foot">${wrap}</div>`}
    <div class="pd-rd-foot" data-pd-rd-foot style="display:none"></div>
  </div>`;
}
/* what the paper beside the face was drawn with: a signature or a mark made
   since is drawn on it at once (pdSignCounts asks after every paint of the
   column) */
function pdSignPaperSig(c){
  if (!c) return '';
  const sigs = Array.isArray(c.signatures) ? c.signatures.length : 0;
  const marks = Array.isArray(c.signSpots) ? c.signSpots.filter(x => x && x.image).length : 0;
  return [c.status || '', sigs, marks].join(':');
}
/* the head's pill and the receipt's next step, IN PLACE — renderSignButton
   calls this after every paint of the column it fills, wherever it is */
function pdSignCounts(c){
  const host = (typeof document !== 'undefined') ? document.getElementById('pd-signface') : null; if (!host) return;
  c = (c && typeof getContract === 'function' && getContract(c.id)) || c || pdContract();
  if (!c || String(c.id) !== _pdSign) return;
  const head = host.querySelector('[data-pd-sf-head]'); if (head) head.innerHTML = pdSignHeadHtml(c);
  const next = host.querySelector('[data-pd-sf-next]'); if (next) next.innerHTML = pdSignNextHtml(c);
  pdRoadPaint(c);
  /* the face's shape follows the contract closing (the Sign button's foot
     becomes the receipt's line), and the paper takes a signature given */
  const root = host.querySelector('.pd-sf');
  if (root && root.classList.contains('is-closed') !== pdSignState(c).closed){ setTimeout(() => { if (pdSignShows() && typeof renderIntelDock === 'function') renderIntelDock(); }, 0); }
  const paper = document.getElementById('ig-paper');
  if (paper && paper.dataset.pdSfSig != null && paper.dataset.pdSfSig !== pdSignPaperSig(c)){ setTimeout(() => { if (pdSignShows()) pdSignPaper(c.id); }, 0); }
  pdChipsRepaint();
}
/* bound once per face host: × and the receipt's next step; every other press
   in the column is bound by the painter that drew it */
function pdSignWire(host){
  if (!host || host.dataset.pdSfBound) return;
  host.dataset.pdSfBound = '1';
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-pd-sf-close]')){ e.preventDefault(); pdSignClose(); return; }
    const ob = t.closest('[data-pd-sf-oblig]');
    if (ob && typeof hbOpenView === 'function'){ e.preventDefault(); hbOpenView(ob.getAttribute('data-pd-sf-oblig'), 'oblig'); return; }
    pdRoadPress(e, t);
  });
}
/* THE ROAD'S OWN PRESSES (the gaps, 18 Oct 2026): every one is an act that
   already exists — the approval's decision and refusal (signApprovalDecide,
   openSignApprovalRefuse), its reminder and its request (signApprovalRemind,
   openSignApprovalDialog), the route's editor (openSignerPlanEditor) — and
   two folds of this sitting (the checks, what moved). Nothing is written here. */
async function pdRoadPress(e, t){
  const c = (typeof getContract === 'function' && _pdSign) ? (getContract(_pdSign) || pdContract()) : pdContract(); if (!c) return;
  const hit = sel => t.closest(sel);
  let b;
  if (hit('[data-pd-rd-show]')){ e.preventDefault(); _pdRdShow = !_pdRdShow; pdRoadPaint(c); return; }
  if (hit('[data-pd-rd-moved]')){ e.preventDefault(); _pdRdMoved = !_pdRdMoved; pdRoadPaint(c); return; }
  if (hit('[data-pd-rd-route]')){ e.preventDefault(); if (typeof openSignerPlanEditor === 'function') openSignerPlanEditor(c); return; }
  /* another signer's stop: the signing order's own button for that signer, pressed */
  if ((b = hit('[data-pd-rd-press]'))){ e.preventDefault();
    const a = b.getAttribute('data-pd-rd-press'), id = b.getAttribute('data-pd-rd-row');
    if (!PD_RD_ROW_ACTS.includes(a)) return;
    const host = document.getElementById('pd-signface');
    const row = host ? [...host.querySelectorAll(`#sign-side [${a}]`)].find(x => x.getAttribute(a) === id) : null;
    if (row && !row.disabled) row.click(); else if (typeof toast === 'function') toast(_pdT('sa_gone'), 'warn');
    return; }
  if (hit('[data-pd-rd-ask]')){ e.preventDefault(); if (typeof openSignApprovalDialog === 'function') openSignApprovalDialog(c); return; }
  if ((b = hit('[data-pd-rd-remind]'))){ e.preventDefault(); b.disabled = true;
    try { if (typeof signApprovalRemind === 'function') await signApprovalRemind(c, b.getAttribute('data-pd-rd-remind')); } finally { b.disabled = false; } return; }
  /* APPROVE AND REFUSE ARE THE LISTS' OWN ACT (signApprovalDecideAsk: the
     refusal's window, an admin's why), for the request this stop names */
  const yesB = hit('[data-pd-rd-approve]') || hit('[data-pd-rd-refuse]');
  if (yesB){ e.preventDefault();
    const id = yesB.getAttribute('data-pd-rd-approve') || yesB.getAttribute('data-pd-rd-refuse');
    const y = pdRoadYesOf(c);
    if (!y || !y.req || String(y.req.id) !== String(id) || !y.as || typeof signApprovalDecideAsk !== 'function'){ if (typeof toast === 'function') toast(_pdT('sa_gone'), 'warn'); return; }
    yesB.disabled = true;
    try { await signApprovalDecideAsk(c, { req: y.req, as: y.as }, yesB.hasAttribute('data-pd-rd-approve') ? 'approved' : 'refused'); } finally { yesB.disabled = false; }
  }
}
/* after renderIntelDock drew the face's host: the Signing column's own painter */
function pdSignFacePaint(c){
  const host = document.getElementById('pd-signface'); if (!host) return;
  c = c || pdContract(); if (!c) return;
  try { if (typeof renderSignButton === 'function') renderSignButton(c); } catch (e){
    const side = document.getElementById('sign-side'); if (side) side.innerHTML = pdNote((e && e.message) || String(e));
  }
  pdSignCounts(c);
  pdSignWire(host);
  pdPresenceOn(c);
}
/* THE SIGNING COPY ON HOME'S PAPER: its pages, sized to the column, then the
   places to sign and every signature given — the Signing tab's own painters,
   on this canvas (igPaintPaper calls this after a paint of the signing copy) */
function pdSignPaperPaint(c){
  const host = document.getElementById('ig-paper'); if (!host || !c) return;
  host.dataset.pdSfSig = pdSignPaperSig(c);
  const sheet = host.querySelector('.pg-sheet.pg-sign'); const cv = document.getElementById('ig-canvas');
  const theySign = !!(typeof signRouteOf === 'function' && signRouteOf(c) === 'outside');
  const sealed = !!(typeof docSealedCopy === 'function' && docSealedCopy(c));
  if (cv && !theySign){
    if (typeof signSpotsPaint === 'function') try { signSpotsPaint(c, cv); } catch (_){}
    /* "SIGN HERE" ONLY FOR WHOEVER'S TURN IT IS (the gaps, round 10: the
       signature lines are named for each signer, with no flag): the road's
       own rule — Sign shows only in the reader's own stop — on the paper too */
    if (!sealed && pdSignMine(c) && typeof pagesSignFlags === 'function') try { pagesSignFlags(cv, 0); } catch (_){}
    if (typeof pagesSignMarks === 'function' && typeof pagesSignRows === 'function') try { pagesSignMarks(cv, pagesSignRows(c, c.signatures || [])); } catch (_){}
  }
  /* its pages, sized and stepped by the Signing tab's own controls (the
     room's page arrows ‹ 1/n › and size, scControlsHtml) — standing on the
     paper's line since the gaps of round 10 (igSignCopyHtml), pressed through
     its one listener; here the paper's scroller is watched for the page in
     view, once per scroller (scWireControls on a host with no buttons of its own) */
  const fit = () => { if (typeof scApplyZoom === 'function') try { scApplyZoom(); } catch (_){}
    if (typeof scPaintPage === 'function') try { scPaintPage(); } catch (_){} };
  if (sheet && typeof signCopyWatch === 'function' && !sheet._pgRO){
    try { signCopyWatch(sheet, c, fit); } catch (_){}
  }
  if (sheet && typeof scWireControls === 'function' && !host.querySelector('[data-sc-page], [data-sc-zoom]')) try { scWireControls(host); } catch (_){}
  else if (sheet) fit();
}

/* ============================================================
   AMEND, BESIDE THE PAPER (owner, 15 Oct 2026: picked "Beside the paper" by
   name from the amendment designs)
   ============================================================
   A FACE OF JAMBO'S TAB, like Fill in, Redlines and Before you sign. Offered
   only on a signed agreement (amendmentExecuted, the Menu row's own test).
   Pressing a clause on the signed paper adds it as a numbered change; the
   paper shows each change as a redline mark painted after the render (the
   number, the signed words struck, the new words under them) — MARKS IT NEVER
   STORES: nothing here touches the signed record. The panel lists the same
   numbered changes with the amended deal's facts (a new end date, a new
   value), and "Create amendment draft" makes the linked draft through the one
   creator every amendment uses (createAmendment, js/family.js) with the same
   items and facts the dialog passes — no second minting path (rule 2). The
   changes are this sitting's; Jambo's drafting stays the dialog's ("Ask Jambo
   to draft the changes" opens it). */
let _pdAmend = null;                 // the signed agreement the face is open for
const _pdAm = { id: null, items: [], expiry: '', value: '' };
const PD_AMEND_ITEMS_MAX = 20;
function pdAmendFor(){ return _pdAmend; }
function pdAmendShows(){
  if (!_pdAmend || _pdTab !== 'copilot' || !pdOnPaper()) return false;
  const c = pdContract(); return !!(c && String(c.id) === _pdAmend);
}
function pdAmendMay(c){ return !!(c && typeof amendmentShutWhy === 'function' && !amendmentShutWhy(c)); }
/* the one door: false where Home has no paper (the phone) or the agreement is
   not signed — the caller keeps the dialog */
function pdAmendOpen(id){
  const c = (typeof getContract === 'function') ? getContract(id) : null;
  if (!pdAmendMay(c)) return false;
  if (typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 768) return false;
  if (_pdAm.id !== String(id)){ _pdAm.id = String(id); _pdAm.items = []; _pdAm.expiry = ''; _pdAm.value = ''; }
  return pdOpenOnHome(id, 'amend');
}
function pdAmendSeen(id){ if (_pdAmend && String(id) !== _pdAmend) _pdAmend = null; }
function pdAmendAway(){ _pdAmend = null; }
function pdAmendClose(){
  _pdAmend = null;
  const a = (typeof document !== 'undefined') ? document.activeElement : null;
  if (a && a.closest && a.closest('#pd-amendface') && typeof a.blur === 'function') a.blur();
  pdAmendPaperPaint();
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
/* the signed agreement's clauses, read off the wording it is drawn from (the
   dialog's own reading, amendParentClauses); a clause pressed on the paper is
   matched by id, else by its heading */
function pdAmendClauseOf(c, el){
  const id = String(el.getAttribute('data-anchor') || '');
  const head = el.querySelector('h1,h2,h3,h4,h5,h6,.rl-clause-top,strong');
  const label = String((head && head.textContent) || '').replace(/\s+/g, ' ').trim();
  const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
  let cls = []; try { cls = (typeof amendParentClauses === 'function') ? amendParentClauses(c) : []; } catch (_){ cls = []; }
  const hit = cls.find(x => x.id && x.id === id) || (label && cls.find(x => x.label === label)) || null;
  const signed = hit ? hit.text : (label && text.startsWith(label) ? text.slice(label.length).trim() : text);
  return { clauseId: id, clauseLabel: (hit && hit.label) || label, clauseNumber: (hit && hit.num) || '', op: 'replace', signed, amended: signed };
}
function pdAmendAdd(el){
  const c = pdContract(); if (!c || !el) return;
  const id = String(el.getAttribute('data-anchor') || '');
  if (!id || _pdAm.items.some(x => x.clauseId === id)) return;
  if (_pdAm.items.length >= PD_AMEND_ITEMS_MAX){ if (typeof toast === 'function') toast(_pdT('pd_am_max', { n: PD_AMEND_ITEMS_MAX }), 'warn'); return; }
  _pdAm.items.push(pdAmendClauseOf(c, el));
  pdAmendRepaint();
}
function pdAmendHeadHtml(c){
  const close = _pdT('act_close');
  return `<div class="pd-sf-r">${pdBackHtml('amend')}<h3>${_pdE(_pdT('pd_am_title', { ref: (typeof contractRef === 'function') ? contractRef(c) : c.id }))}</h3>
      <button type="button" class="pd-sf-x" data-pd-am-close title="${_pdE(close)}" aria-label="${_pdE(close)}">×</button></div>
    <p class="pd-am-sub">${_pdE(_pdT('pd_am_sub'))}</p>`;
}
function pdAmendItemHtml(it, i){
  const op = it.op === 'delete' ? 'delete' : it.op === 'insert' ? 'insert' : 'replace';
  const name = it.clauseLabel || _pdT(op === 'insert' ? 'fa_new_clause' : 'pd_a_clause');
  return `<li class="pd-am-it" data-pd-am-i="${i}"><div class="pd-am-ih"><b class="pd-am-n">${i + 1}</b><span class="pd-am-nm">${_pdE(name)}</span>
      <span class="pd-am-op">${_pdE(_pdT('fa_op_' + op))}</span>
      <button type="button" class="pd-am-rm" data-pd-am-rm="${i}" title="${_pdE(_pdT('pd_am_remove'))}" aria-label="${_pdE(_pdT('pd_am_remove'))}">×</button></div>
    ${op === 'delete' ? `<p class="pd-am-del">${_pdE(it.signed || '')}</p>`
      : `<label class="pd-am-lb">${_pdE(_pdT('fa_amended_wording'))}<textarea rows="3" data-pd-am-txt="${i}">${_pdE(it.amended || '')}</textarea></label>`}
    ${op === 'insert' ? '' : `<button type="button" class="pd-am-lk" data-pd-am-op="${i}">${_pdE(_pdT(op === 'delete' ? 'pd_am_reword' : 'pd_am_delete'))}</button>`}</li>`;
}
function pdAmendFactsHtml(c){
  const end = (typeof dateOnly === 'function') ? (dateOnly(c.expiry) || '') : String(c.expiry || '').slice(0, 10);
  const money = (typeof isMonetary !== 'function') || isMonetary(c);
  const now = (typeof fmtMoneyOf === 'function' && Number(c.value) > 0) ? fmtMoneyOf(c) : '';
  return `<section class="pd-am-facts"><h6>${_pdE(_pdT('pd_am_deal'))}</h6>
    <label class="pd-am-f"><span>${_pdE(_pdT('pd_am_end'))}${end ? `<small>${_pdE(_pdT('pd_am_now', { v: end }))}</small>` : ''}</span><input type="date" data-pd-am-fact="expiry" value="${_pdE(_pdAm.expiry)}"></label>
    ${money ? `<label class="pd-am-f"><span>${_pdE(_pdT('pd_am_value'))}${now ? `<small>${_pdE(_pdT('pd_am_now', { v: now }))}</small>` : ''}</span><input type="number" min="0" step="any" inputmode="decimal" data-pd-am-fact="value" value="${_pdE(_pdAm.value)}"></label>` : ''}
  </section>`;
}
function pdAmendReady(){ return _pdAm.items.length > 0 || !!_pdAm.expiry || Number(_pdAm.value) > 0; }
function pdAmendFaceHtml(c){
  if (!c) return '';
  const list = _pdAm.items.length
    ? `<ol class="pd-am-list">${_pdAm.items.map(pdAmendItemHtml).join('')}</ol>`
    : `<p class="pd-am-none">${_pdE(_pdT('pd_am_none'))}</p>`;
  const ready = pdAmendReady();
  return `<div class="pd-sf pd-am" data-pd-am="${_pdE(c.id)}">
    <div class="pd-sf-h">${pdAmendHeadHtml(c)}</div>
    <div class="pd-am-body scroll-thin">
      ${list}
      <div class="pd-am-adds"><button type="button" class="ui-btn ui-btn-sm" data-pd-am-new>+ ${_pdE(_pdT('fa_add_new_clause'))}</button>
        ${typeof openCreateAmendmentModal === 'function' ? `<button type="button" class="pd-am-lk" data-pd-am-jambo>${_pdE(_pdT('pd_am_jambo'))}</button>` : ''}</div>
      ${pdAmendFactsHtml(c)}
    </div>
    <div class="pd-sf-foot pd-am-foot"><button type="button" class="ui-btn ui-btn-primary" data-pd-am-go${ready ? '' : ` disabled aria-disabled="true" title="${_pdE(_pdT('pd_am_go_why'))}"`}>${_pdE(_pdT('pd_am_go'))}</button>
      <button type="button" class="ui-btn" data-pd-am-close>${_pdE(_pdT('act_cancel'))}</button></div>
  </div>`;
}
/* the face's body in place (the panel itself is not rebuilt), then the marks */
function pdAmendRepaint(){
  const host = (typeof document !== 'undefined') ? document.getElementById('pd-amendface') : null;
  const c = pdContract();
  if (host && c){ const sc = host.querySelector('.pd-am-body'); const top = sc ? sc.scrollTop : 0; host.innerHTML = pdAmendFaceHtml(c); const sc2 = host.querySelector('.pd-am-body'); if (sc2) sc2.scrollTop = top; }
  pdAmendPaperPaint();
}
/* THE MARKS ON THE SIGNED PAPER: painted after every paint of the paper and
   after every change of the list, removed whole first — the canvas's markup
   is never kept with them */
function pdAmendPaperPaint(){
  const cv = (typeof document !== 'undefined') ? document.getElementById('ig-canvas') : null; if (!cv) return;
  cv.querySelectorAll('.pd-am-mk, .pd-am-insert').forEach(n => n.remove());
  cv.querySelectorAll('.pd-am-on').forEach(n => n.classList.remove('pd-am-on', 'pd-am-struck'));
  cv.classList.toggle('pd-am-picking', pdAmendShows());
  if (!pdAmendShows()) return;
  _pdAm.items.forEach((it, i) => {
    if (!it.clauseId) return;
    const el = cv.querySelector(`[data-anchor="${CSS.escape(it.clauseId)}"]`); if (!el) return;
    el.classList.add('pd-am-on');
    const mk = document.createElement('span'); mk.className = 'pd-am-mk'; mk.textContent = String(i + 1); mk.setAttribute('aria-hidden', 'true');
    el.insertBefore(mk, el.firstChild);
    const moved = it.op === 'delete' || String(it.amended || '').trim() !== String(it.signed || '').trim();
    if (moved) el.classList.add('pd-am-struck');
    if (it.op !== 'delete' && moved){
      const ins = document.createElement('div'); ins.className = 'pd-am-insert'; ins.textContent = String(it.amended || '');
      el.insertAdjacentElement('afterend', ins);
    }
  });
}
async function pdAmendCreate(){
  const c = pdContract(); if (!c || !pdAmendMay(c) || !pdAmendReady() || typeof createAmendment !== 'function') return;
  const items = _pdAm.items.map(it => ({ clauseId: it.clauseId || '', clauseLabel: it.clauseLabel || '', clauseNumber: it.clauseNumber || '', op: it.op, signed: it.signed || '', amended: it.amended || '', manual: true }));
  const facts = {}; if (_pdAm.expiry) facts.expiry = _pdAm.expiry; if (Number(_pdAm.value) > 0) facts.value = Number(_pdAm.value);
  const made = createAmendment(c, { relation: 'amendment', expiry: _pdAm.expiry || null, items, facts, skeleton: true });
  if (!made || made.error){ if (typeof toast === 'function') toast((made && made.error) || _pdT('pd_failed'), 'err'); return; }
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  if (typeof toast === 'function') toast(_pdT('fa_created', { id: (typeof contractRef === 'function') ? contractRef(made.contract) : made.contract.id, pid: ref, rel: _pdT('pd_am_rel') }), 'ok');
  _pdAm.id = null; _pdAm.items = []; _pdAm.expiry = ''; _pdAm.value = ''; _pdAmend = null;
  if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
  /* the draft lands where it is written: Home's paper (the dialog's own landing) */
  if (typeof regOpenContract === 'function') regOpenContract(made.contract.id);
  else if (typeof openWorkspace === 'function'){ openWorkspace(made.contract.id); if (typeof roomGoTab === 'function') roomGoTab(getContract(made.contract.id) || made.contract, 'docs'); }
}
function pdAmendWire(host){
  if (!host || host.dataset.pdAmBound) return;
  host.dataset.pdAmBound = '1';
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-pd-am-close]')){ e.preventDefault(); pdAmendClose(); return; }
    const rm = t.closest('[data-pd-am-rm]');
    if (rm){ e.preventDefault(); _pdAm.items.splice(Number(rm.getAttribute('data-pd-am-rm')), 1); pdAmendRepaint(); return; }
    const op = t.closest('[data-pd-am-op]');
    if (op){ e.preventDefault(); const it = _pdAm.items[Number(op.getAttribute('data-pd-am-op'))]; if (it){ it.op = it.op === 'delete' ? 'replace' : 'delete'; } pdAmendRepaint(); return; }
    if (t.closest('[data-pd-am-new]')){
      e.preventDefault();
      if (_pdAm.items.length >= PD_AMEND_ITEMS_MAX) return;
      _pdAm.items.push({ clauseId: '', clauseLabel: '', clauseNumber: '', op: 'insert', signed: '', amended: '' });
      pdAmendRepaint();
      const box = host.querySelector(`[data-pd-am-txt="${_pdAm.items.length - 1}"]`); if (box) box.focus();
      return;
    }
    if (t.closest('[data-pd-am-jambo]')){ e.preventDefault(); const c = pdContract(); if (c && typeof openCreateAmendmentModal === 'function') openCreateAmendmentModal(getContract(c.id) || c); return; }
    const go = t.closest('[data-pd-am-go]');
    if (go && !go.disabled){ e.preventDefault(); pdAmendCreate(); }
  });
  host.addEventListener('input', e => {
    const tx = e.target && e.target.closest ? e.target.closest('[data-pd-am-txt]') : null;
    if (tx){ const it = _pdAm.items[Number(tx.getAttribute('data-pd-am-txt'))]; if (it) it.amended = String(tx.value || '').slice(0, 4000); pdAmendPaperPaint(); }
    const f = e.target && e.target.closest ? e.target.closest('[data-pd-am-fact]') : null;
    if (f) _pdAm[f.getAttribute('data-pd-am-fact')] = String(f.value || '');
    const go = host.querySelector('[data-pd-am-go]');
    if (go){ const ok = pdAmendReady(); go.disabled = !ok; if (ok){ go.removeAttribute('aria-disabled'); go.removeAttribute('title'); } else { go.setAttribute('aria-disabled', 'true'); go.title = _pdT('pd_am_go_why'); } }
  });
}
function pdAmendFacePaint(){
  const host = document.getElementById('pd-amendface'); if (!host) return;
  pdAmendWire(host);
  pdAmendPaperPaint();
}
/* a press on a clause of the signed paper while the face is up adds it —
   never while words are being highlighted (that is the highlight menu's) */
if (typeof document !== 'undefined'){
  document.addEventListener('click', e => {
    if (!pdAmendShows()) return;
    const el = e.target && e.target.closest ? e.target.closest('#ig-canvas [data-anchor]') : null; if (!el) return;
    if (e.target.closest('.pd-am-mk, .pd-am-insert, a, button, input, textarea')) return;
    const sel = window.getSelection && window.getSelection(); if (sel && !sel.isCollapsed) return;
    pdAmendAdd(el);
  });
}

/* ---- HISTORY: the trail, newest first; the cap is said ---- */
function pdHistHtml(c){
  let ev = [];
  try { ev = (typeof roomHistoryEvents === 'function') ? roomHistoryEvents(c).slice().reverse() : []; } catch (_){ ev = []; }
  if (!ev.length) return pdTop('hist', '') + pdEmpty(_pdT('pd_hist_none'), 'clock');
  const shown = ev.slice(0, PD_HIST_MAX);
  const rows = shown.map(e => {
    let w = { day: String(e.at || '').slice(0, 10), time: '' };
    try { if (typeof histWhen === 'function') w = histWhen(e.at) || w; } catch (_){}
    return `<div class="pd-ev"><small class="pd-ev-when">${_pdE([w.day, w.time].filter(Boolean).join(' · '))}</small><span>${_pdE(e.text || e.summary || '')}</span>${e.actor ? `<small>${_pdE(e.actor)}</small>` : ''}</div>`;
  }).join('');
  const more = ev.length > shown.length ? pdNote(_pdT('pd_hist_more', { k: shown.length, n: ev.length })) + `<div class="pd-acts">${pdBtn(_pdT('pd_hist_all'), pdRoom(c, 'history'))}</div>` : '';
  return pdTop('hist', pdPill('quiet', _pdTn('pd_hist_n', ev.length, { n: ev.length }))) + `<div class="pd-trail">${rows}</div>` + more;
}

/* ---- DEAL: where the deal stands, their changes sorted, the round sent ----
   (step 3 of the build, Young 8 Oct 2026). READ RAW off c.changes: a reading
   never initialises a negotiation. Their open changes are sorted into "looks
   minor" and "needs a look" — anything touching money, dates, time, liability,
   termination, numbers or percentages ALWAYS needs a look; only wording with
   none of those, or a formatting-only change, looks minor. Nothing is ticked
   and nothing is accepted here: changing the wording stays on the Negotiate
   page (Home first), so each change's one press opens Negotiate on its clause.
   Sending the round presses the Negotiate page's own Send all — one postbox,
   every check it carries (rule 2). */
const PD_LOOK_RE = /\d|pay|price|fee|cost|value|amount|liab|indemn|damag|terminat|renew|expir|\bterm\b|date|deadline|day|week|month|year|interest|penalt|insur|warrant|exclusiv|currenc|KES|SEK|USD|EUR|GBP|%/i;
/* a live negotiation with something open — the only time the paper offers marks */
function pdRedOk(c){
  return !!(c && c.negotiation && typeof c.negotiation === 'object' && Array.isArray(c.changes)
    && c.changes.some(x => x && x.status === 'pending'));
}
function pdTheirOpen(c){
  return (c && Array.isArray(c.changes) ? c.changes : []).filter(x => x && x.status === 'pending' && x.authorSide === 'counterparty' && !x.superseded);
}
/* THE WORDS THAT MOVED decide, plus the clause's TOPIC: a clause number
   ("Article 2") is not a number in the deal, so the heading is read with its
   numbering taken off; the body is read only where it changed. */
function pdMovedWords(ch){
  const words = t => String(t || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean);
  const a = words(ch.oldText), b = words(ch.newText);
  const inA = new Set(a), inB = new Set(b);
  return [...a.filter(w => !inB.has(w)), ...b.filter(w => !inA.has(w))].join(' ');
}
function pdChangeKind(ch){
  if (!ch) return 'look';
  if (ch.formattingOnly) return 'minor';
  if (ch.changeType === 'insertClause' || ch.changeType === 'deleteClause') return 'look';
  const topic = [ch.clauseLabel, ch.headingText].filter(Boolean).join(' ').replace(/^\s*(article|clause|section|§)?\s*[\divxlc.]+\s*/i, '').replace(/\d+(\.\d+)*/g, ' ');
  const moved = pdMovedWords(ch) || [ch.summary, ch.newText].filter(Boolean).join(' ');
  return (PD_LOOK_RE.test(moved) || PD_LOOK_RE.test(topic)) ? 'look' : 'minor';
}
const PD_NEGO_WAIT_MS = 4000;
/* the Negotiate page, then (bounded) the thing to press or reach on it */
function pdNegoThen(c, then){
  if (typeof openRedlineWorkbench !== 'function') return;
  if (openRedlineWorkbench(c.id) === false) return;
  if (typeof then !== 'function') return;
  const t0 = Date.now();
  const tick = () => { if (then()) return; if (Date.now() - t0 < PD_NEGO_WAIT_MS) setTimeout(tick, 120); };
  setTimeout(tick, 60);
}
function pdGoClause(c, clauseId){
  pdNegoThen(c, () => { if (!document.querySelector('[data-clause-id], .rl-paper')) return false;
    if (typeof rlJumpToClause === 'function') try { rlJumpToClause(clauseId); } catch (_){} return true; });
}
function pdSendWaiting(c){
  pdNegoThen(c, () => { const b = document.getElementById('nego-send'); if (!b) return false; b.click(); return true; });
}
function pdDealHtml(c){
  const live = !!(c.negotiation && typeof c.negotiation === 'object') || (Array.isArray(c.changes) && c.changes.length);
  const may = (typeof negoMayStart !== 'function') || !!(negoMayStart(c) || {}).ok;
  const go = (may && typeof openRedlineWorkbench === 'function') ? pdBtn(_pdT('pd_negotiate'), () => openRedlineWorkbench(c.id)) : '';
  if (!live) return pdTop('deal', pdPill('quiet', _pdT('pd_st_notyet'))) + pdEmpty(_pdT('pd_deal_none'), 'nego') + (go ? `<div class="pd-acts pd-acts-c">${go}</div>` : '');
  let sheet = '';
  try { sheet = (typeof standsHtml === 'function') ? standsHtml(c, { lately: false }) : ''; } catch (_){ sheet = ''; }
  let unsent = 0;
  try { unsent = (c.negotiation && typeof rlUnsentCount === 'function') ? rlUnsentCount(c, {}) : 0; } catch (_){ unsent = 0; }
  const send = (unsent && may) ? pdBtn(_pdTn('pd_send_waiting', unsent, { n: unsent }), () => pdSendWaiting(getContract(c.id) || c), { lead: true, title: _pdT('pd_send_waiting_title') }) : '';
  const theirs = pdTheirOpen(c);
  const name = ch => { const raw = ch.clauseLabel || ch.headingText || ''; return (typeof clauseNameShown === 'function' && raw) ? clauseNameShown(raw) : raw; };
  const row = ch => `<div class="pd-row pd-chg"><i class="${pdChangeKind(ch) === 'look' ? 'is-warn' : 'is-ok'}">${pdChangeKind(ch) === 'look' ? '!' : '·'}</i><span>${_pdE(name(ch) || _pdT('pd_a_clause'))}${ch.summary ? `<small>${_pdE(ch.summary)}</small>` : ''}</span>${
    may ? pdBtn(_pdT('pd_answer_nego'), () => pdGoClause(getContract(c.id) || c, ch.clauseId), { go: true, glow: (window.rlCopilotAnswers && rlCopilotAnswers(c).some(r => r.ch.id === ch.id)) ? ch.id : '' }) : ''}</div>`;
  const minor = theirs.filter(ch => pdChangeKind(ch) === 'minor'), look = theirs.filter(ch => pdChangeKind(ch) !== 'minor');
  const changes = theirs.length
    ? (minor.length ? pdH(_pdTn('pd_minor_n', minor.length, { n: minor.length })) + pdList(minor.map(row).join('')) : '')
      + (look.length ? pdH(_pdTn('pd_look_n', look.length, { n: look.length })) + pdList(look.map(row).join('')) : '')
      + pdNote(_pdT('pd_sort_foot'))
    : '';
  const dealTop = pdTop('deal', theirs.length ? pdPill('warn', _pdTn('pd_st_answer', theirs.length, { n: theirs.length })) : pdPill('quiet', _pdT('pd_st_quiet')));
  return dealTop + (send ? `<div class="pd-acts">${send}</div>` : '') + `<div class="pd-deal">${sheet}</div>` + changes + (go ? `<div class="pd-acts">${go}</div>` : '');
}

/* ---- THE MENU TAB, DRAWN AS "NEXT UP" (owner, 15 Oct 2026: "add these lists
   in a new tab next to obligation called Menu"; picked "Next up" by name) ----
   ONE BUILDER, NOT A COPY: the rows are the paper's old ⋯ menu itself
   (roomMoreMenuHtml, every id kept, so roomMenuWire answers them), plus the
   Negotiate page's three (igNegoRowsHtml) and, on top of "Work on it", the
   Redlines column's three that left its foot (Draft from our standards, Edit
   a clause, Add a clause — their own builders). Three suggestions for the
   contract's stage come first; each presses the row it names, so the
   suggestion and the row are one act. A row that cannot be used stays grey
   with its reason, as it did in the ⋯. */
const PD_MENU_NEXT = {
  Draft: ['[data-rl-prepare]', '[data-ig-review]', '#ws-m-signers'],
  'Under Review': ['#ws-import', '[data-ig-memo]', '#ws-m-signers'],
  Signed: ['#ws-m-amend', '#ws-pdf', '#ws-end'],
  Declined: ['#ws-reopen', '#ws-pdf', '#ws-end']
};
function pdMenuGroups(c){
  if (typeof document === 'undefined' || typeof roomMoreMenuHtml !== 'function') return [];
  const may = (typeof canEdit !== 'function') || canEdit();
  const executed = !!(typeof negoExecuted === 'function' && negoExecuted(c));
  let clause = '';
  if (may && !executed){
    const o = { side: 'owner', cpPanel: false };
    try { clause += (typeof rlPrepareRowHtml === 'function') ? rlPrepareRowHtml(c, false) : ''; } catch (_){}
    try { clause += (typeof rlEditClauseBtnHtml === 'function') ? rlEditClauseBtnHtml(c, o, 'owner', 'rl-edit-clause-door') : ''; } catch (_){}
    try { clause += (typeof rlAddClauseBtnHtml === 'function') ? rlAddClauseBtnHtml(c, o, 'owner', '') : ''; } catch (_){}
  }
  let nego = ''; try { nego = (typeof igNegoRowsHtml === 'function') ? igNegoRowsHtml(c) : ''; } catch (_){}
  const box = document.createElement('div');
  box.innerHTML = roomMoreMenuHtml(c, { menuRow: clause + nego, noFocus: true });
  const menu = box.querySelector('#ws-more-menu') || box;
  /* each group keeps the ⋯ menu's own heading; "This contract" is called
     "Work on it" and the unheaded last group "The contract" (owner's names) */
  const head = { [_pdT('ct_this_contract')]: 'pd_menu_work', [_pdT('ct_export')]: 'ct_export', [_pdT('ct_view')]: 'ct_view' };
  const groups = []; let g = null;
  const open = () => { g = { key: 'pd_menu_contract', rows: [] }; groups.push(g); };
  open(); g.key = 'pd_menu_work';
  [...menu.children].forEach(el => {
    if (el.tagName === 'HR'){ open(); return; }
    if (el.classList.contains('mgroup')){ g.key = head[el.textContent.trim()] || g.key; return; }
    if (el.tagName === 'BUTTON') g.rows.push(el.outerHTML);
  });
  const out = [];
  groups.filter(x => x.rows.length).forEach(x => { const same = out.find(o => o.key === x.key); if (same) same.rows.push(...x.rows); else out.push(x); });
  return out.map(x => ({ key: x.key, title: _pdT(x.key), rows: x.rows }));
}
function pdMenuHtml(c){
  if (!c) return '';
  const groups = pdMenuGroups(c);
  if (!groups.length) return pdEmpty(_pdT('pd_failed'), 'alert');
  /* the suggestions read the rows as drawn: a grey row is never suggested */
  const box = document.createElement('div');
  box.innerHTML = groups.map(g => g.rows.join('')).join('');
  const st = (typeof negoExecuted === 'function' && negoExecuted(c)) ? 'Signed' : (PD_MENU_NEXT[c.status] ? c.status : 'Draft');
  const picked = [];
  const take = sel => { const b = box.querySelector(sel); if (b && !b.disabled && !picked.includes(b) && picked.length < 3) picked.push(b); };
  PD_MENU_NEXT[st].forEach(take);
  if (picked.length < 3) [...box.querySelectorAll('button')].forEach(b => { if (!b.disabled && !picked.includes(b) && picked.length < 3) picked.push(b); });
  const key = b => b.id ? '#' + b.id : ['data-rl-prepare', 'data-rl-edit-clause', 'data-rl-add-clause', 'data-rl-edit-first', 'data-ig-review', 'data-ig-pbreview', 'data-ig-memo'].map(a => b.hasAttribute(a) ? `[${a}]` : '').find(Boolean) || '';
  const word = b => { const x = b.cloneNode(true); x.querySelectorAll('[aria-hidden="true"], svg, .mnote').forEach(n => n.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); };
  const cards = picked.filter(b => key(b)).map((b, i) => `<button type="button" class="pd-mn-card${i === 0 ? ' is-lead' : ''}" data-pd-mn-go="${_pdE(key(b))}"><b>${_pdE(word(b))}</b>${b.title ? `<small>${_pdE(b.title)}</small>` : ''}<span class="pd-mn-go">${_pdE(_pdT(i === 0 ? 'pd_menu_start' : 'pd_menu_open'))}</span></button>`).join('');
  const stWord = (typeof statusLabel === 'function') ? statusLabel(st === 'Signed' ? 'Signed' : c.status) : '';
  return `<div class="pd-menu" data-pd-menu="${_pdE(c.id)}">
    ${cards ? `<div class="pd-mn-lead">${_pdE(_pdT('pd_menu_next', { stage: String(stWord) }))}</div><div class="pd-mn-cards">${cards}</div>` : ''}
    ${groups.map((g, i) => `<details class="pd-mn-g"${i === 0 ? ' open' : ''}><summary><span>${_pdE(g.title)}</span><span class="pd-mn-n">${g.rows.length}</span></summary><div class="pd-mn-rows room-menu">${g.rows.join('')}</div></details>`).join('')}
  </div>`;
}
/* its presses: the ⋯ menu's one wiring (roomMenuWire, by id), the Negotiate
   rows and the Redlines rows through their own doors; bound once per drawing */
function pdMenuWire(c){
  const m = (typeof document !== 'undefined') ? document.querySelector('#pd-body .pd-menu') : null;
  if (!m || !c || m.dataset.wired) return;
  m.dataset.wired = '1';
  const k = () => getContract(c.id) || c;
  const again = () => { if (typeof igPaintPaper === 'function') try { igPaintPaper(); } catch (_){} if (typeof renderIntelDock === 'function') renderIntelDock(); };
  if (typeof roomMenuWire === 'function') try { roomMenuWire(k()); } catch (_){}
  m.querySelector('[data-ig-review]')?.addEventListener('click', () => { if (typeof rlReviewDoor === 'function') rlReviewDoor(k(), again); });
  m.querySelector('[data-ig-pbreview]')?.addEventListener('click', () => { if (typeof rlOpenPlaybookReview === 'function') rlOpenPlaybookReview(k(), again); });
  m.querySelector('[data-ig-memo]')?.addEventListener('click', () => { if (typeof openNegoMemo === 'function') openNegoMemo(k()); });
  m.querySelector('[data-rl-prepare]')?.addEventListener('click', () => { if (typeof rlPrepareRedlines === 'function') rlPrepareRedlines(k(), again); });
  m.querySelector('[data-rl-add-clause]')?.addEventListener('click', ev => { ev.preventDefault(); if (ev.currentTarget.disabled) return; if (typeof rlAddClause === 'function') rlAddClause(k()); });
  m.querySelector('[data-rl-edit-clause]')?.addEventListener('click', ev => { ev.preventDefault(); if (typeof rlEditClausePress === 'function') rlEditClausePress(k(), ev.currentTarget); });
  m.querySelectorAll('[data-pd-mn-go]').forEach(card => card.addEventListener('click', () => {
    const row = m.querySelector('.pd-mn-rows ' + card.getAttribute('data-pd-mn-go'));
    if (row && !row.disabled) row.click();
  }));
}

/* ONE PRESS FROM OUTSIDE THE TAB (Jambo's Menu card, caMenuPress): open the
   Menu tab on that contract and press the row itself once it is drawn — the
   row's own wiring decides, so no second door is built (rule 2) */
const PD_MENU_PRESS_TRIES = 40;
function pdMenuPress(id, sel){
  if (!id || !sel || typeof pdOpenOnHome !== 'function') return false;
  if (pdOpenOnHome(id, 'menu') === false) return false;
  let n = 0;
  const tryPress = () => {
    const m = document.querySelector(`#pd-body .pd-menu[data-pd-menu="${CSS.escape(String(id))}"]`);
    const row = m && m.dataset.wired ? m.querySelector('.pd-mn-rows ' + sel) : null;
    if (row){ if (!row.disabled){ row.closest('details')?.setAttribute('open', ''); row.click(); } return; }
    if (++n < PD_MENU_PRESS_TRIES) setTimeout(tryPress, 50);
  };
  setTimeout(tryPress, 0);
  return true;
}

const PD_BODY = { facts: pdFactsHtml, doc: pdDocHtml, oblig: pdObligHtml, menu: pdMenuHtml };
/* THE TITLE ROW: one button per tab, the lit one carrying its name. `brain`
   is the engine's own words (copilotBrainInfo), said on Copilot's hover. */
/* JAMBO'S OWN TAB WEARS HIS FACE (owner, 12 Oct 2026: "replace where there
   are the copilot symbols with Jambo's symbol"); the other tabs keep their glyph */
function pdTabGlyphHtml(t){
  if (t === 'copilot' && typeof jamboFaceHtml === 'function') return jamboFaceHtml('hello', 20, 'pd-tab-face').replace('<img', '<img data-ink-exempt');   /* a picture carries no ink */
  return PD_TAB_GLYPH[t] + '\uFE0E';
}
function pdHeadHtml(brain){
  /* FINDINGS (Explorer stage 4): beside Jambo on Explorer's map, no paper up;
     the tab is the map's own (igFindingsShows), so the paper's tabs never meet it */
  const fd = !pdOnPaper() && typeof igFindingsTabOn === 'function' && igFindingsTabOn();
  const tabs = pdOnPaper() ? PD_TABS : (fd ? ['copilot', 'findings'] : ['copilot']);
  const lit = fd && typeof igFindingsShows === 'function' && igFindingsShows() ? 'findings' : (tabs.includes(_pdTab) ? _pdTab : 'copilot');
  const c = pdOnPaper() ? pdContract() : null;
  /* A WORD FOR WHAT THE PANEL HOLDS (the gaps, round 4 "One sheet", 18 Oct
     2026: "Jambo · New agreement · ›"): beside the one sheet, the agreement
     being drafted */
  const word = (!c && typeof naSheetUp === 'function' && naSheetUp()) ? `<span class="pd-head-word">${_pdE(_pdT('na_title'))}</span>` : '';
  return tabs.map(t => {
    const name = _pdT(PD_TAB_NAME[t]);
    const tip = t === 'copilot' && brain ? name + ' · ' + brain : name;
    const on = t === lit, cnt = pdTabCount(t, c);
    return `<button type="button" role="tab" class="pd-tab${on ? ' on' : ''}" data-pd-tab="${t}" aria-selected="${on}" aria-label="${_pdE(cnt ? _pdT('pd_tab_n', { name, n: cnt.n }) : name)}" title="${_pdE(tip)}"><span class="pd-tab-i"><span class="pd-tab-g" aria-hidden="true">${pdTabGlyphHtml(t)}</span>${cnt ? `<span class="pd-tab-n is-${cnt.tone}">${cnt.n > 99 ? '99+' : cnt.n}</span>` : ''}</span><span class="pd-tab-w">${_pdE(name)}</span></button>`;
  }).join('') + word;
}
function pdBodyHtml(c){
  _pdActs.clear();
  let body = '';
  try { body = (PD_BODY[_pdTab] || pdFactsHtml)(c); } catch (e){ body = pdNote(_pdT('pd_failed')); }
  return body;
}
/* kept for the readers that draw the desk whole (a stage, a test) */
function pdHtml(c){ return `<div class="pd-tabs" role="tablist">${pdHeadHtml('')}</div><div class="pd-body" id="pd-body">${pdBodyHtml(c)}</div>`; }
/* THE ONE PAINTER, called by igPaintPaper after every paint of the paper:
   the open tab's body is redrawn in place (the panel itself is not rebuilt),
   and the title row follows the paper coming and going. */
function pdPaint(c){
  const dock = document.getElementById('ig-dock'); if (!dock) return;
  /* the paper was drawn again: Fill in's marks on it follow (pdFillPaperMarks) */
  try { pdFillPaperMarks(c || pdContract()); } catch (_){}
  const head = dock.querySelector('[data-pd-head]');
  const want = pdOnPaper() ? 'paper' : 'off';
  if (head && head.getAttribute('data-pd-head') !== want){ if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
  if (!pdShowsDesk()) return;
  const host = document.getElementById('pd-body'); if (!host){ if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
  c = c || pdContract(); if (!c) return;
  /* THE CLAUSE LIST IS KEPT, NEVER REDRAWN FROM NOTHING: a paint of the paper
     repaints it in place (its open row, filter and scroll stay). */
  if (_pdTab === 'doc'){
    const th = host.querySelector('#pd-thread');
    if (!th || th.getAttribute('data-pd-thread') !== String(c.id)) host.innerHTML = pdBodyHtml(c);
    host.dataset.for = c.id + ':doc';
    if (typeof docThreadPaint === 'function') docThreadPaint(c);
    return;
  }
  /* THE FILL FORM IS KEPT, NEVER REDRAWN FROM NOTHING: an answer typed on the
     Overview repaints the paper, which paints this panel — the form itself is
     lifted out and put back, so the box the Tab key is moving to stays. */
  const keep = (_pdTab === 'facts' && host.dataset.for === c.id + ':facts') ? host.querySelector('#pd-fill') : null;
  const top = host.scrollTop;
  host.innerHTML = pdBodyHtml(c);
  if (_pdTab === 'facts'){
    const slot = host.querySelector('#pd-fill');
    if (keep && keep.firstElementChild && slot){
      slot.replaceWith(keep);
      const miss = host.querySelector('[data-pd-missing]'); if (miss) miss.remove();
    } else pdFillPaint(c);
  }
  if (_pdTab === 'menu') pdMenuWire(c);
  if (host.dataset.for === c.id + ':' + _pdTab) host.scrollTop = top;
  host.dataset.for = c.id + ':' + _pdTab;
}
/* the fill form into the Overview tab's slot; the old list of blanks only
   where the form drew nothing */
function pdFillPaint(c){
  const slot = document.getElementById('pd-fill'); if (!slot) return;
  const body = document.getElementById('pd-body'); if (body && c) body.dataset.for = c.id + ':facts';
  try { if (typeof paintContractForm === 'function') paintContractForm(c); } catch (_){ slot.innerHTML = ''; }
  const miss = document.querySelector('#pd-body [data-pd-missing]');
  if (miss && slot.firstElementChild) miss.remove();
}
/* presses, read at press time; a repaint after an act shows what it changed */
if (typeof document !== 'undefined' && !document._pdWired){
  document._pdWired = true;
  document.addEventListener('click', async e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#ig-dock')) return;
    const tab = t.closest('[data-pd-tab]');
    if (tab){ pdSetTab(tab.getAttribute('data-pd-tab'));
      if (typeof renderIntelDock === 'function') renderIntelDock();
      /* a face left behind another tab gives the paper back (stage 5): the
         paper is drawn again only if its copy moved (igPaperKey) */
      if (typeof igPaintPaper === 'function') try { igPaintPaper(); } catch (_){}
      return; }
    const a = t.closest('[data-pd-act]'); const fn = a ? _pdActs.get(a.getAttribute('data-pd-act')) : null;
    if (!fn) return;
    e.preventDefault();
    try { await fn(); } catch (err){ if (typeof toast === 'function') toast((err && err.message) || String(err), 'err'); }
    setTimeout(() => pdPaint(), 0);
  });
}

/* ============================================================
   JAMBO'S TAB ON HOME'S DOCUMENT FACE: THE WALL'S GREETING AND DROP AREA,
   AND A CONTRACT AT A GLANCE (the overnight work order, steps 4 and 5; the
   owner's "Go" on the demo's homeFace, 14 Oct 2026)
   ============================================================
   Drawn at the top of Jambo's conversation while no face is open, in place
   of the notebook's generic greeting (renderIntelDock):
   - THE WALL (no paper chosen): the greeting and the drop area. A Word or PDF
     file dropped there, or chosen with its button (the chip "upload a
     document" and the word "upload" open the same picker), goes through the
     existing upload path — uploadFromDrop: the reader, who we are, the name
     off the file (fileTitleOf), contractArrived — and lands on the paper with
     Fill in open while anything is owed (roomArrivesOnHome). The drop area's
     own sentence promises the reading, and its cost is said under it, the
     sentence the pop-up's tick-box carried (Six Questions 4). Reading, the
     area wears the turning ring; a refusal is said in it and in a toast.
   - A CONTRACT ON THE PAPER: "MK-… at a glance" — its stage (the head's own
     pill, contractStatusTextHtml), then one row per thing waiting, each with
     the button that opens its face. EVERY COUNT IS THE READING ITS OWN FACE
     USES — detailsOf (Fill in), riskOpenOf (Redlines' risks), the Send all
     count rlUnsentCount, signBlockers' signers row (Before you sign) — asked
     RAW: it spends nothing and writes nothing (no negotiation is started to
     count none, pdDealHtml's guard). A button asks Jambo's own word for its
     face (caReadPlace, the chips' one path), so a press and a typed word land
     alike; a door the contract has shut is grey with its reason. */
const PD_DROP_ACCEPT = '.pdf,.docx,.txt,.png,.jpg,.jpeg';
let _pdDrop = null;          // { state: 'reading' | 'refused', name, note, why }, or null
function pdDropMay(){ return (typeof canEdit !== 'function') || !!canEdit(); }
function pdWallHelloHtml(){
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const hour = new Date().getHours();
  const greet = _pdT(hour < 12 ? 'home_greet_morning' : hour < 17 ? 'home_greet_afternoon' : 'home_greet_evening');
  const first = String((me && me.name) || '').trim().split(/\s+/)[0] || _pdT('home_greet_there');
  const say = _pdT(pdDropMay() ? 'pd_wall_hello' : 'pd_wall_hello_view', { greet, name: first });
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 24, 'ai-face shrink-0 mt-0.5') : '';
  return `<div class="ai-msg flex gap-2 pd-hello">${face}<div class="min-w-0 flex-1"><div class="ai-bub rounded-2xl rounded-tl-md border px-3.5 py-2 text-[13px] leading-relaxed bg-canvas border-brand-100 text-brand-900">${_pdE(say)}</div></div></div>`;
}
function pdDropInner(){
  const d = _pdDrop;
  if (d && d.state === 'reading'){
    const w = _pdT('pd_drop_reading', { name: d.name });
    return `<span class="pd-drop-busy" aria-live="polite">${(typeof busyHtml === 'function') ? busyHtml(w) : _pdE(w)}</span>${d.note ? `<span class="pd-drop-sub">${_pdE(d.note)}</span>` : ''}`;
  }
  const ai = (typeof copilotAvailable !== 'function') || copilotAvailable();
  const ic = (typeof icon === 'function') ? icon('upload', 'w-5 h-5') : '';
  return `<span class="pd-drop-ic" aria-hidden="true">${ic}</span><b>${_pdE(_pdT('pd_drop_t'))}</b>
    <span class="pd-drop-sub">${_pdE(_pdT('pd_drop_sub'))}</span>
    <span class="pd-drop-cost">${_pdE(_pdT(ai ? 'pd_drop_cost' : 'pd_drop_cost_noai'))}</span>
    ${d && d.state === 'refused' ? `<span class="pd-drop-why" role="alert">${_pdE(d.why)}</span>` : ''}
    ${pdDropStreamHtml()}
    ${''/* HOME'S ONE FILLED ACT WEARS HOME'S DRESS (.hm-primary, the act
           "+ Draft new agreement" wore in the head until step 3): one class,
           so its night rung — the fill that stands off the dark page — is
           the same act's */}<button type="button" class="hm-primary" data-pd-drop-pick>${_pdE(_pdT(d && d.state === 'refused' ? 'pd_drop_again' : 'pd_drop_pick'))}</button>
    ${pdDropImportHtml()}`;
}
/* SEVERAL FILES GO TO THE IMPORTER (round 5, "Jambo's tray"): the upload
   pop-up's one door into it moved here with the pop-up's job — the same words
   and the same count of imports still waiting for a person */
function pdDropImportHtml(){
  if (typeof setView !== 'function') return '';
  let n = 0; try { n = (typeof navCounts === 'function') ? Number((navCounts() || {}).migration) || 0 : 0; } catch (_){ n = 0; }
  return `<span class="pd-drop-more">${_pdE(_pdT('ct_several_q'))} <button type="button" class="ui-link" data-pd-drop-import>${_pdE(_pdT('ct_import_contracts_link'))}</button>${
    n > 0 ? ` <span class="pd-drop-wait">· ${_pdE(_pdTn('ct_import_waiting', n, { n }))}</span>` : ''}</span>`;
}
/* ---- ONE WAY IN: THE TRAY (owner picked "Jambo's tray" by name and said
   "Yes" to one way in, round 5, 17 Oct 2026) ----
   On a computer every "upload a contract" door lands here — the Contracts
   place with no paper up, Jambo's panel open on its drop area, the stream
   asked in it and the cost said before the drop. The doors that opened the
   upload pop-up (the new-agreement menu's Upload, the + menu, a page's Upload,
   the arrivals agent's own door) ask here first; the pop-up stays for what the
   drop hands it (a signed copy coming back) and on the phone. Answers whether
   it took the door. */
function pdDropDoor(){
  if (typeof window === 'undefined' || (window.innerWidth && window.innerWidth < 768)) return false;
  if (typeof hbOpenContracts !== 'function' || !(typeof deskShellOn !== 'function' || deskShellOn())) return false;
  if (!pdDropMay()){ if (typeof toast === 'function') toast(_pdT('ct_viewers_no_add'), 'err'); return true; }
  if (typeof closeModal === 'function' && document.getElementById('modal-root') && document.getElementById('modal-root').children.length) try { closeModal(); } catch (_){}
  hbOpenContracts();
  if (typeof intel === 'object' && intel && !intel.dockOpen){ intel.dockOpen = true; if (typeof renderIntelDock === 'function') renderIntelDock(); if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){} }
  pdSetTab('copilot');
  /* LAND ON IT (owner, 18 Oct 2026): the drop area lit, Choose files ready */
  if (typeof landOn === 'function') landOn('#pd-drop', { focus: '[data-pd-drop-pick]' });
  return true;
}
/* ---- THE STREAM IS ASKED AT THE DROP (the fix round, 15 Oct 2026; the
   owner's ruling of 18 Sep: the stream is asked at every creation door) ----
   The pop-up asked every editor which stream a file goes into (#up-folder,
   the first stream they may see already chosen); a drop with no such box
   filed it silently, and Fill in's stream is a re-filer's only — the server
   refuses anyone else a move (403 folderMove). So the drop area asks it, the
   same choice the pop-up drew: the streams this person may see, the first
   chosen until they choose another, kept for the sitting. One stream asks
   nothing. Its press opens HaTi's own list (the body-wide selectMenuSweep). */
let _pdDropStream = '';
function pdDropStreams(){
  const F = (typeof FOLDERS === 'object' && FOLDERS) || {};
  return ((typeof visibleFolders === 'function') ? visibleFolders() : Object.values(F)).filter(f => f && f.id);
}
function pdDropStreamNow(){
  const L = pdDropStreams();
  return (L.find(f => f.id === _pdDropStream) || L[0] || {}).id || '';
}
function pdDropStreamHtml(){
  const L = pdDropStreams(); if (L.length < 2) return '';
  const now = pdDropStreamNow(), lab = _pdT('pd_ff_stream');
  return `<label class="pd-drop-stream"><span>${_pdE(lab)}</span><select id="pd-drop-stream" data-pd-drop-stream aria-label="${_pdE(lab)}">${
    L.map(f => `<option value="${_pdE(f.id)}"${f.id === now ? ' selected' : ''}>${_pdE(f.name || f.id)}</option>`).join('')}</select></label>`;
}
/* A viewer files nothing: no drop area, and the greeting does not offer one */
function pdDropHtml(){
  if (!pdDropMay()) return '';
  return `<div id="pd-drop" class="pd-drop${_pdDrop && _pdDrop.state === 'reading' ? ' is-busy' : ''}" data-pd-drop>${pdDropInner()}</div>`;
}
function pdDropPaint(){
  const el = (typeof document !== 'undefined') ? document.getElementById('pd-drop') : null; if (!el) return;
  el.classList.toggle('is-busy', !!(_pdDrop && _pdDrop.state === 'reading'));
  el.innerHTML = pdDropInner();
}
function pdWallHtml(){ return `<div class="pd-wall">${pdWallHelloHtml()}${pdDropHtml()}</div>`; }
/* THE FILE PICKER: one input, kept outside the panel (the panel is redrawn
   under it), found at press time, so a chip's press opens it in the press */
function pdDropInput(){
  let inp = document.getElementById('pd-drop-file');
  if (!inp){
    inp = document.createElement('input');
    inp.type = 'file'; inp.id = 'pd-drop-file'; inp.accept = PD_DROP_ACCEPT; inp.hidden = true; inp.tabIndex = -1;
    inp.setAttribute('aria-hidden', 'true');
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.value = ''; if (f) pdDropTake(f); });
    document.body.appendChild(inp);
  }
  return inp;
}
function pdDropBusyNow(){ return !!(_pdDrop && _pdDrop.state === 'reading') || ((typeof uploadDropBusy === 'function') && uploadDropBusy()); }
function pdDropPick(){
  if (!pdDropMay()){ if (typeof toast === 'function') toast(_pdT('ct_viewers_no_add'), 'err'); return false; }
  if (pdDropBusyNow()){ if (typeof toast === 'function') toast(_pdT('ca_drop_busy'), 'warn'); return false; }
  pdDropInput().click();
  return true;
}
/* WHEN SOMETHING LOADS, SOMETHING MOVES — WHEREVER THE READ STARTED (the
   fix round, 15 Oct 2026): "upload" typed with a contract on the paper, or
   from ⌘K on another page, opens the same picker with no drop area on
   screen to turn its ring, so the read is said in a toast that turns
   (toast {busy:true}) and goes when the file lands or is refused. */
const PD_DROP_TOAST_MS = 600000;
function pdDropToastOff(msg){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('#toast-root [data-toast-msg]').forEach(el => { if (el.dataset.toastMsg === msg) el.remove(); });
}
async function pdDropTake(file){
  if (!file || typeof uploadFromDrop !== 'function') return null;
  if (pdDropBusyNow()){ if (typeof toast === 'function') toast(_pdT('ca_drop_busy'), 'warn'); return { refused: _pdT('ca_drop_busy') }; }
  _pdDrop = { state: 'reading', name: file.name, note: '' };
  pdDropPaint();
  const said = _pdT('pd_drop_reading', { name: file.name });
  const away = !(typeof document !== 'undefined' && document.getElementById('pd-drop'));
  if (away && typeof toast === 'function') toast(said, 'ok', { busy: true, dwell: PD_DROP_TOAST_MS });
  let r = null;
  try {
    r = await uploadFromDrop(file, { folder: pdDropStreamNow(), step: (n, note) => { if (_pdDrop && _pdDrop.state === 'reading'){ _pdDrop.note = note || ''; pdDropPaint(); } } });
  } catch (e){ r = { refused: (e && e.message) || String(e) }; }
  if (away) pdDropToastOff(said);
  if (r && r.refused){
    _pdDrop = { state: 'refused', name: file.name, why: r.refused };
    if (typeof toast === 'function') toast(r.refused, 'err');
  } else _pdDrop = null;
  pdDropPaint();
  return r;
}
/* ---- A CONTRACT AT A GLANCE ---- */
const PD_GLANCE = { fill: ['pd_gl_details', 'pd_gl_fill', 'ca_w_fill'], redline: ['pd_gl_risks', 'pd_gl_redlines', 'ca_w_redline'],
  share: ['pd_gl_unsent', 'pd_gl_share', 'ca_w_share'], sign: ['pd_gl_signers', 'pd_gl_signing', 'ca_w_sign'],
  /* WHAT JAMBO FOUND (round 5, "Jambo's tray"): their doors are this panel's own tabs, so the fourth is the tab */
  std: ['pd_gl_std', 'pd_tab_clauses', '', 'doc'], oblig: ['pd_gl_obls', 'tab_obligations', '', 'oblig'] };
function pdGlanceRows(c){
  const rows = []; if (!c) return rows;
  let d = null; try { d = pdFillDetails(c); } catch (_){ d = null; }
  if (d && d.live && d.left) rows.push({ k: 'fill', n: d.left });
  /* THE RISKS THE REDLINES FACE DRAWS (rlRisksPileHtml): a list only where
     the scan has run and this person may act on the wording (riskMayAct) —
     before a scan the face offers the scan, not a count, so neither does this */
  let rk = 0; try { rk = (c.scan && typeof riskOpenOf === 'function' && (typeof riskMayAct !== 'function' || riskMayAct(c, {}))) ? riskOpenOf(c).length : 0; } catch (_){ rk = 0; }
  if (rk) rows.push({ k: 'redline', n: rk });
  /* WHAT JAMBO FOUND, WHILE SIGNING IS STILL AHEAD (owner picked "Jambo's
     tray" by name, round 5, 17 Oct 2026): the standards check's own count of
     departures (deviationSummary — a check not run says nothing) and the
     obligations recorded, read RAW, each opening this panel's own tab */
  if (pdSignAhead(c)){
    let sd = null; try { sd = (typeof deviationSummary === 'function') ? deviationSummary(c) : null; } catch (_){ sd = null; }
    const nd = sd ? (Number(sd.dev) || 0) + (Number(sd.miss) || 0) : 0;
    if (nd) rows.push({ k: 'std', n: nd });
    const obs = Array.isArray(c.obligations) ? c.obligations.filter(o => o && o.status !== 'done') : [];
    if (obs.length) rows.push({ k: 'oblig', n: obs.length });
  }
  let un = 0; try { un = (c.negotiation && typeof rlUnsentCount === 'function') ? rlUnsentCount(c, {}) : 0; } catch (_){ un = 0; }
  if (un) rows.push({ k: 'share', n: un });
  /* NOBODY NAMED TO SIGN only while signing is still ahead: signed, sealed or
     declined, the Before you sign face reads "Signed", and so does this card */
  let nobody = false; try { nobody = pdSignAhead(c) && (typeof signBlockers === 'function') && signBlockers(c).some(b => b && b.key === 'signers'); } catch (_){ nobody = false; }
  if (nobody) rows.push({ k: 'sign', n: 1 });
  return rows;
}
/* the Before you sign face's own "closed" (pdSignState), without its readiness read, and a declined deal */
function pdSignAhead(c){
  if (!c || c.status === 'Signed' || c.status === 'Declined') return false;
  return !(typeof negoExecuted === 'function' && negoExecuted(c));
}
function pdGlanceHtml(c){
  if (!c) return '';
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  let pill = ''; try { pill = (typeof contractStatusTextHtml === 'function') ? contractStatusTextHtml(c) : ''; } catch (_){ pill = ''; }
  const shut = k => (k === 'redline' && typeof negoMayStartLine === 'function') ? negoMayStartLine(c) : '';
  const btn = r => { const why = shut(r.k), label = _pdE(_pdT(PD_GLANCE[r.k][1]));
    return why ? `<button type="button" class="ui-btn ui-btn-sm" disabled aria-disabled="true" title="${_pdE(why)}">${label}</button>`
      : `<button type="button" class="ui-btn ui-btn-sm" data-pd-glance="${r.k}">${label}</button>`; };
  const rows = pdGlanceRows(c);
  /* each row's door: the face's word Jambo reads, or this panel's own tab */
  const btn2 = r => (PD_GLANCE[r.k][3] ? `<button type="button" class="ui-btn ui-btn-sm" data-pd-glance-tab="${PD_GLANCE[r.k][3]}">${_pdE(_pdT(PD_GLANCE[r.k][1]))}</button>` : btn(r));
  const said = r => r.k === 'sign' ? _pdT(PD_GLANCE.sign[0]) : _pdTn(PD_GLANCE[r.k][0], r.n, { n: r.n });
  const done = pdGlanceDone(c, rows, said);
  const doneHtml = done.map(d => `<div class="pd-gl-row is-done" data-pd-gl-done="${_pdE(d.k)}"><i aria-hidden="true">✓</i><span><s>${_pdE(d.text)}</s></span></div>`).join('');
  const body = rows.length
    ? rows.map(r => { const sub = pdGlanceSub(c, r);
        return `<div class="pd-gl-row" data-pd-gl="${r.k}"><span>${_pdE(said(r))}${sub ? `<small title="${_pdE(sub)}">${_pdE(sub)}</small>` : ''}</span>${btn2(r)}</div>`; }).join('') + doneHtml
    : doneHtml + `<div class="pd-gl-none"><i aria-hidden="true">✓</i><span>${_pdE(_pdT('pd_gl_none'))}</span></div>`;
  return `<div id="pd-glance" class="pd-glance" data-pd-glance-for="${_pdE(c.id)}"><div class="pd-gl-h"><b>${_pdE(_pdT('pd_gl_title', { ref }))}</b><span class="pd-gl-sp"></span>${pill}</div><div class="pd-gl-b">${pdGlanceBriefHtml(c)}${body}</div>${pdGlanceFootHtml(c)}</div>`;
}
/* ---- WHAT JAMBO FOUND, SAID WHERE IT IS (owner picked "Jambo's tray" by
   name, round 5, 17 Oct 2026) ----
   The brief's own first lines above the rows (its press opens the brief), a
   line under each row naming what it counts — the empty boxes, the risks'
   titles, the standards departed from, whose obligations — and, under the
   card, when Jambo read it on arrival. Every word is a reading the record
   already holds; nothing is asked, spent or written. */
const PD_GL_SUB_MAX = 3;
function pdGlanceSub(c, r){
  const few = L => { const a = L.filter(Boolean); return a.slice(0, PD_GL_SUB_MAX).join(', ') + (a.length > PD_GL_SUB_MAX ? ' …' : ''); };
  try {
    if (r.k === 'fill' && typeof detailsOf === 'function') return few(detailsOf(c).items.filter(x => x.open).map(x => x.label));
    if (r.k === 'redline' && typeof riskOpenOf === 'function') return few(riskOpenOf(c).map(it => (typeof riskTitleOf === 'function') ? riskTitleOf(it) : ''));
    if (r.k === 'std'){
      const v = (c.playbook && Array.isArray(c.playbook.verdicts)) ? c.playbook.verdicts : [];
      return few(v.filter(x => x && (x.status === 'deviation' || x.status === 'missing')).map(x => { const t = String(x.category || ''); return t.charAt(0).toUpperCase() + t.slice(1); }));
    }
    if (r.k === 'oblig'){
      const obs = (Array.isArray(c.obligations) ? c.obligations : []).filter(o => o && o.status !== 'done');
      const theirs = obs.filter(o => (typeof obligationIsTheirs === 'function') ? obligationIsTheirs(o) : o.party === 'theirs').length;
      return _pdT('pd_gl_obls_split', { theirs, ours: obs.length - theirs });
    }
  } catch (_){ return ''; }
  return '';
}
function pdGlanceBriefHtml(c){
  const d = (c && ((c._brief && c._brief.data) || (c._briefLite && c._briefLite.data))) || null;
  const t = String((d && d.overview) || '').trim(); if (!t) return '';
  return `<button type="button" class="pd-gl-brief" data-pd-gl-brief title="${_pdE(t)}"><em>${_pdE(_pdT('pd_gl_brief'))}</em><span>${_pdE(t)}</span></button>`;
}
function pdGlanceFootHtml(c){
  const t = c && c.triage; if (!t || !t.at) return '';
  const read = (typeof triageReadAnything === 'function') ? triageReadAnything(c) : true; if (!read) return '';
  const at = new Date(t.at); if (isNaN(at)) return '';
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  const today = at.toDateString() === new Date().toDateString();
  let when = ''; try { when = today ? at.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }) : at.toLocaleDateString(loc, { day: 'numeric', month: 'short' }); } catch (_){ when = String(t.at).slice(0, 10); }
  return `<div class="pd-gl-foot">${_pdE(_pdT('pd_gl_read', { when }))}</div>`;
}
/* ---- NEEDS YOU HERE (owner picked "Tabs and faces" by name, round 3 of the
   redesign, 17 Oct 2026) ----
   Above the contract at a glance on Jambo's tab: what THIS contract owes the
   reader, Jambo's prepared work on it first — the Counter's own two readings
   (hbAgentsData, needsYouOf), never a list of its own. Each row's button is its
   one door: a prepared piece opens on the Board's Jambo's work card
   (hbOpenAgent, the Counter's own), an owed item through needsYouGo (the
   checklist's, with its words insNeedWords and verb INS_NEED_VERB). "All N" is
   the Counter's own number (counterNeedsCount) and opens the Counter. Nothing
   owed here, no card: the glance below says the rest. NOT SAID TWICE: the
   details still owed are the glance's own row (with its tick when they are in,
   the owner's "Alive"), so the checklist's 'details' item is left to it.
   Reading writes nothing. */
function pdNeedsRows(c){
  const rows = []; if (!c) return rows;
  let A = null; try { A = (typeof hbAgentsData === 'function') ? hbAgentsData(null) : null; } catch (_){ A = null; }
  ((A && A.rows) || []).forEach(r => (r.items || []).forEach(it => {
    if (it && String(it.cid) === String(c.id)) rows.push({ jw: true, k: r.k, key: it.key, sum: it.sum || '', urg: it.urg || '' }); }));
  let L = []; try { L = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_){ L = []; }
  L.filter(it => it && it.kind !== 'details').forEach(it => rows.push({ it }));
  return rows;
}
function pdNeedRowHtml(c, r){
  if (r.jw){
    const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 22, 'pd-nd-face').replace('<img', '<img data-ink-exempt') : '';
    const sub = [r.sum, r.urg].filter(Boolean).join(' · ');
    return `<div class="pd-gl-row pd-nd-row is-jw">${face}<span><b>${_pdE(_pdT('cn_jw'))} · ${_pdE(_pdT('ag_' + r.k))}</b>${sub ? `<small title="${_pdE(sub)}">${_pdE(sub)}</small>` : ''}</span><button type="button" class="ui-btn ui-btn-sm" data-pd-nd-jw="${_pdE(r.k)}" data-pd-nd-key="${_pdE(r.key || '')}">${_pdE(_pdT('pd_nd_see'))}</button></div>`;
  }
  let w = null; try { w = (typeof insNeedWords === 'function') ? insNeedWords(c, r.it) : null; } catch (_){ w = null; }
  const verb = (typeof INS_NEED_VERB !== 'undefined' && INS_NEED_VERB[r.it.kind]) ? _pdT(INS_NEED_VERB[r.it.kind]) : _pdT('cn_open');
  /* insNeedWords' line is HTML already (its late days marked); its words plain on the hover */
  return `<div class="pd-gl-row pd-nd-row${r.it.urgent ? ' is-hot' : ''}" data-pd-nd-kind="${_pdE(r.it.kind)}"><span><b>${_pdE((w && w.title) || '')}</b>${w && w.sub ? `<small title="${_pdE(w.plain || '')}">${w.sub}</small>` : ''}</span><button type="button" class="ui-btn ui-btn-sm" data-pd-nd="${_pdE(r.it.kind)}" data-pd-nd-id="${_pdE(c.id)}">${_pdE(verb)}</button></div>`;
}
function pdNeedsHtml(c){
  const rows = pdNeedsRows(c); if (!rows.length) return '';
  let all = 0; try { all = (typeof counterNeedsCount === 'function') ? counterNeedsCount() : 0; } catch (_){ all = 0; }
  const more = (all && typeof deskGoCounter === 'function')
    ? `<button type="button" class="pd-go pd-nd-all" data-pd-nd-all title="${_pdE(_pdT('pd_nd_all_tip'))}">${_pdE(_pdT('pd_nd_all', { n: all }))}${PD_GO_ARROW}</button>` : '';
  return `<div id="pd-needs" class="pd-glance pd-needs" data-pd-needs-for="${_pdE(c.id)}"><div class="pd-gl-h"><b>${_pdE(_pdT('pd_nd_title'))}</b>${pdPill('quiet', String(rows.length))}<span class="pd-gl-sp"></span>${more}</div><div class="pd-gl-b">${rows.map(r => pdNeedRowHtml(c, r)).join('')}</div></div>`;
}
/* in place, with the glance, as a face or a save changes what is owed */
function pdNeedsRepaint(){
  const glance = (typeof document !== 'undefined') ? document.getElementById('pd-glance') : null; if (!glance) return;
  const c = pdContract(); if (!c || String(c.id) !== glance.getAttribute('data-pd-glance-for')) return;
  const el = document.getElementById('pd-needs'), html = pdNeedsHtml(c);
  if (!html){ if (el) el.remove(); return; }
  const t = document.createElement('div'); t.innerHTML = html;
  const nu = t.firstElementChild; if (!nu) return;
  if (!el) glance.before(nu); else if (nu.outerHTML !== el.outerHTML) el.replaceWith(nu);
}
/* ---- A ROW THAT GOES IS TICKED OFF FIRST (owner picked "Alive" by name, 16
   Oct 2026: "when something is done he hops, and the row in the at a glance
   card ticks off") ----
   The card remembers the rows it last drew for the contract in front; one that
   is no longer owed is drawn once more, struck through under a tick, for
   PD_GL_DONE_MS, and Jambo hops. Only between two readings of the WHOLE record
   (a light row's counts can differ from the full one's, which is a load, not
   a deed), and only for the same contract. Its own words, never new ones. */
const PD_GL_DONE_MS = 1800;
let _pdGlWas = null; const _pdGlDone = new Map();
function pdGlanceDone(c, rows, said){
  const whole = !!c && (c._loaded || !c._light), id = c ? String(c.id) : '';
  const now = Date.now(), keys = new Set(rows.map(r => r.k));
  if (!_pdGlWas || _pdGlWas.id !== id || !whole || !_pdGlWas.whole) _pdGlDone.clear();
  else {
    let went = false;
    _pdGlWas.rows.forEach((text, k) => { if (!keys.has(k) && !_pdGlDone.has(k)){ _pdGlDone.set(k, { k, text, until: now + PD_GL_DONE_MS }); went = true; } });
    if (went){
      if (typeof window !== 'undefined' && typeof window.jamboHop === 'function') try { jamboHop(); } catch (_){}
      setTimeout(pdGlanceRepaint, PD_GL_DONE_MS + 40);
    }
  }
  _pdGlWas = { id, whole, rows: new Map(rows.map(r => [r.k, said(r)])) };
  const out = [];
  _pdGlDone.forEach((d, k) => { if (d.until <= now || keys.has(k)) _pdGlDone.delete(k); else out.push(d); });
  return out;
}
/* in place, as the chips are, when a face or a save changes what is waiting */
function pdGlanceRepaint(){
  const el = (typeof document !== 'undefined') ? document.getElementById('pd-glance') : null; if (!el) return;
  const c = pdContract(); if (!c || String(c.id) !== el.getAttribute('data-pd-glance-for')) return;
  const t = document.createElement('div'); t.innerHTML = pdGlanceHtml(c);
  const nu = t.firstElementChild; if (nu && nu.outerHTML !== el.outerHTML) el.replaceWith(nu);
}
/* what Jambo's tab draws at its top on Home's Document face: the wall's
   greeting and drop area, or the paper's contract at a glance */
function pdJamboTopHtml(){
  /* ON THE BOARD: his greeting names what needs you (hbNeedsHelloHtml, the
     "Needs you" card's own reading; owner picked Jambo's note, 15 Oct 2026) */
  if (typeof igHomePaperFace !== 'function' || igHomePaperFace() !== true) return (typeof hbNeedsHelloHtml === 'function') ? hbNeedsHelloHtml() : '';
  const c = pdContract();
  return c ? pdNeedsHtml(c) + pdGlanceHtml(c) : pdWallHtml();
}
/* the presses, delegated once: the panel is redrawn under them */
if (typeof document !== 'undefined' && !document._pdJamboTopWired){
  document._pdJamboTopWired = true;
  const zone = e => (e.target && e.target.closest) ? e.target.closest('#pd-drop') : null;
  document.addEventListener('dragover', e => { const z = zone(e); if (!z) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; z.classList.add('is-over'); });
  document.addEventListener('dragleave', e => { const z = zone(e); if (z && !(e.relatedTarget && z.contains(e.relatedTarget))) z.classList.remove('is-over'); });
  document.addEventListener('drop', e => { const z = zone(e); if (!z) return; e.preventDefault(); z.classList.remove('is-over');
    const fl = (e.dataTransfer && e.dataTransfer.files) || [], f = fl[0];
    /* A CAP IS A FACT, NEVER A SILENT TRIM: two files dropped at once — the first is read, and that is said */
    if (f && fl.length > 1 && !pdDropBusyNow() && typeof toast === 'function') toast(_pdT('pd_drop_single', { name: f.name }), 'warn');
    if (f) pdDropTake(f); });
  document.addEventListener('change', e => { const s = (e.target && e.target.closest) ? e.target.closest('[data-pd-drop-stream]') : null; if (s) _pdDropStream = s.value || ''; });
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-pd-drop-pick]')){ e.preventDefault(); pdDropPick(); return; }
    if (t.closest('[data-pd-drop-import]')){ e.preventDefault(); if (typeof setView === 'function') setView('migration'); return; }
    const back = t.closest('[data-pd-back]');
    if (back){ e.preventDefault(); const go = PD_BACK_CLOSE[back.getAttribute('data-pd-back')]; if (go) go(); return; }
    if (t.closest('[data-pd-nd-all]')){ e.preventDefault(); if (typeof deskGoCounter === 'function') deskGoCounter(); return; }
    const jw = t.closest('[data-pd-nd-jw]');
    if (jw){ e.preventDefault(); if (typeof hbOpenAgent === 'function') hbOpenAgent(jw.getAttribute('data-pd-nd-jw'), jw.getAttribute('data-pd-nd-key') || null); return; }
    const nd = t.closest('[data-pd-nd]');
    if (nd){ e.preventDefault(); if (typeof needsYouGo === 'function') needsYouGo(nd.getAttribute('data-pd-nd'), nd.getAttribute('data-pd-nd-id')); return; }
    const gt = t.closest('[data-pd-glance-tab]');
    if (gt){ e.preventDefault(); pdSetTab(gt.getAttribute('data-pd-glance-tab')); if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    if (t.closest('[data-pd-gl-brief]')){ e.preventDefault(); const cc = pdContract();
      if (cc && typeof openCheckPanel === 'function') openCheckPanel(getContract(cc.id) || cc, 'brief'); return; }
    const g = t.closest('[data-pd-glance]');
    if (g && !g.disabled){ e.preventDefault(); const row = PD_GLANCE[g.getAttribute('data-pd-glance')]; if (row && typeof intelAsk === 'function') intelAsk(_pdT(row[2])); }
  });
}
/* ============================================================
   JAMBO, ALIVE (owner picked "Alive" by name, 16 Oct 2026: "how we can make
   jambo more engaging ... it is mostly stagnant and not moving")
   ============================================================
   He sits at the end of the chips row on his own tab of Home's panel (or on
   the ask box where no chips are drawn) and:
   - BREATHES while he waits (.jb-bird, CSS; still for a reader who asked for
     less motion);
   - TURNS to the paper when the reader chooses words on it (selectionchange);
   - WORKS where work is going on: his thinking face, and over him the turning
     ring with the words the screen already says ("Opening…", "Sending…"), or
     "Thinking…" while he answers — read off the house's one busy marker
     (.ob-spin) and intel.busy, nothing of his own to keep in step;
   - HOPS when something is done: an answer landing, a wait ending, an 'ok'
     confirmation, a row of the at-a-glance card ticked off (jamboHop).
   Nothing here writes, spends or sends; he draws nothing on the paper and
   takes no line of the panel's own (the chips row keeps room for him). He is
   decorative — the words he mirrors are on the screen already — so he is
   hidden from screen readers. */
const JB_BEAT_MS = 400, JB_HOP_MS = 650, JB_BUSY_SEL = '#ig-dock .ob-spin, #ig-paper .ob-spin, #ig-strip .ob-spin, #toast-root .ob-spin';
let _jbEl = null, _jbBeat = 0, _jbWorking = '', _jbHopT = 0;
function jamboPerchEl(){
  if (_jbEl) return _jbEl;
  const d = document.createElement('div');
  d.className = 'jb-perch'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<span class="jb-say" hidden></span><img class="jb-bird" alt="" draggable="false" width="36" height="36">';
  const img = d.querySelector('img'); if (img && typeof JAMBO_FACE === 'object') img.src = JAMBO_FACE.hello;
  _jbEl = d; return d;
}
/* where he sits: the chips row; else on the ask box over the conversation;
   on a face with no chips row (a reader who turned the chips off) he stays
   away rather than cover its controls */
function jamboPerchMount(dock){
  if (!dock || typeof document === 'undefined') return false;
  dock.classList.remove('jb-perched', 'jb-perched-ask');
  const on = !!(window.state && state.view === 'dashboard') && !pdShowsDesk() && typeof JAMBO_FACE === 'object';
  const ask = document.getElementById('igd-input');
  const chips = dock.querySelector('[data-ig-chips]'), feed = dock.querySelector('#igd-feed:not([hidden])');
  let host = null;
  if (on && ask){ if (chips){ host = chips; dock.classList.add('jb-perched'); }
    else if (feed && ask.parentElement){ host = ask.parentElement; dock.classList.add('jb-perched', 'jb-perched-ask'); } }
  if (!host){ jamboRest(); if (_jbEl && _jbEl.parentNode) _jbEl.remove(); return false; }
  host.appendChild(jamboPerchEl());
  if (!_jbBeat) _jbBeat = setInterval(jamboBeat, JB_BEAT_MS);
  /* his first look round waits for the panel's paint to finish: read inside
     it, the busy marker's layout check would make the browser lay the
     freshly drawn panel out twice (home-speed's Board ⇄ Paper switch) */
  setTimeout(jamboBeat, 0);
  return true;
}
function jamboRest(){ if (_jbBeat){ clearInterval(_jbBeat); _jbBeat = 0; } _jbWorking = ''; }
/* what is being worked on now, in the screen's own words ('' when nothing) */
function jamboWorkWords(){
  if (window.intel && intel.busy) return _pdT('jb_thinking');
  const spin = [...document.querySelectorAll(JB_BUSY_SEL)].find(x => !x.closest('.jb-perch') && x.offsetParent !== null);
  if (!spin) return '';
  const t = String((spin.parentElement && spin.parentElement.textContent) || '').replace(/\s+/g, ' ').trim();
  return t || _pdT('jb_thinking');
}
function jamboBeat(){
  const el = _jbEl;
  if (!el || !el.isConnected){ jamboRest(); return; }
  if (document.hidden) return;
  const w = jamboWorkWords(), was = _jbWorking;
  if (w === was) return;
  _jbWorking = w;
  const img = el.querySelector('.jb-bird'), say = el.querySelector('.jb-say');
  if (img && typeof JAMBO_FACE === 'object') img.src = w ? JAMBO_FACE.think : JAMBO_FACE.hello;
  el.classList.toggle('is-working', !!w);
  if (say){ say.hidden = !w; say.innerHTML = w && typeof busyHtml === 'function' ? busyHtml(w) : _pdE(w); }
  /* a wait that ends is a thing done */
  if (was && !w) jamboHop();
}
function jamboHop(){
  const el = _jbEl; if (!el || !el.isConnected) return false;
  el.classList.remove('is-hop'); void el.offsetWidth; el.classList.add('is-hop');
  clearTimeout(_jbHopT); _jbHopT = setTimeout(() => { if (_jbEl) _jbEl.classList.remove('is-hop'); }, JB_HOP_MS);
  return true;
}
/* he turns to the paper while words on it are chosen */
function jamboLookPaint(){
  const el = _jbEl; if (!el || !el.isConnected) return;
  let on = false;
  try { const s = window.getSelection && getSelection();
    const n = s && !s.isCollapsed && s.anchorNode; const e = n && (n.nodeType === 1 ? n : n.parentElement);
    on = !!(e && e.closest && e.closest('#ig-paper')); } catch (_){ on = false; }
  el.classList.toggle('is-look', on);
}
if (typeof document !== 'undefined' && !document._jbWired){
  document._jbWired = true;
  document.addEventListener('selectionchange', jamboLookPaint);
  /* an 'ok' confirmation — an act that left the building — is a thing done */
  const watch = () => { const root = document.getElementById('toast-root'); if (!root || root._jbWatched || typeof MutationObserver !== 'function') return !!(root && root._jbWatched);
    root._jbWatched = true;
    new MutationObserver(ms => { ms.forEach(m => m.addedNodes.forEach(n => { if (n && n.dataset && n.dataset.toastKind === 'ok') jamboHop(); })); }).observe(root, { childList: true });
    return true; };
  if (!watch()) document.addEventListener('DOMContentLoaded', watch, { once: true });
}
Object.assign(window, { pdAmendFor, pdAmendShows, pdAmendMay, pdAmendOpen, pdAmendSeen, pdAmendAway, pdAmendClose, pdAmendClauseOf, pdAmendAdd, pdAmendFaceHtml, pdAmendRepaint, pdAmendPaperPaint, pdAmendCreate, pdAmendFacePaint, PD_AMEND_ITEMS_MAX, pdMenuHtml, pdMenuWire, pdMenuPress, PD_MENU_PRESS_TRIES, pdMenuGroups, PD_MENU_NEXT, pdPresenceOn, pdPresenceOff, pdPresenceLeft, pdFaceNow, PD_FACE_WORDS, PD_LOOK_RE, pdRedOk, pdTheirOpen, pdMovedWords, pdChangeKind, PD_NEGO_WAIT_MS, pdNegoThen, pdGoClause, pdSendWaiting, PD_ROOM_TAB, pdOpenOnHome, pdOpenTabOf, PD_TAB_ICON, PD_TAB_GLYPH, PD_TAB_NAME, PD_TABS, pdTabCount, pdTabCountPaint, pdChipsQuiet, PD_FF_NDA_KEYS, pdFillCardOf, pdFillPrivateHtml, pdFillWaitHtml, PD_COST_EVENT, pdFillPayHtml, pdFillStdKind, PD_FF_EG_DATE, PD_FF_EG_SPAN, PD_FF_EG_NUM, PD_FF_EG_MONTHS, pdFillExample, pdFillPaperMarks, pdTabGlyphHtml, pdTop, pdPill, pdList, pdEmpty, PD_GO_ARROW, PD_HIST_MAX, pdSetTab, pdTab, pdOnPaper, pdShowsDesk, pdHeadHtml, pdBodyHtml, pdDocHtml, pdContract, pdBtn, pdRoom, pdFactsHtml, pdObligHtml,
  pdHistHtml, pdDealHtml, PD_BODY, pdHtml, pdPaint, pdFillPaint,
  pdRedFor, pdRedShows, pdRedOpen, pdRedLand, pdRedSeen, pdRedAway, pdRedClose, pdRedPaper, pdRedHeadEndHtml, pdRedOpts, pdRedFaceHtml, pdRedFootHtml, pdRedScrollOf, pdRedRepaint, pdRedFacePaint, pdRedWire, pdRedPaperWire,
  pdSignFor, pdSignShows, pdSignOpen, pdSignSeen, pdSignAway, pdSignClose, pdSignPaper, pdSignPaperSig, pdSignState, pdSignPillHtml, pdSignHeadHtml, pdSignNextHtml, PD_RD_YES, PD_RD_SIGN, pdSignMine, PD_RD_CHECKS, pdRoadCheckOf, pdRoadCheckNames, pdDayWord, pdBackDay, pdAwayOf, pdRoadYesOf, pdRoadYesTitle, pdRoadYesFramed, pdRoadYesFacts, pdRoadYesHtml, pdRoadPress, pdRoadStops, pdRoadPaint, pdSignFaceHtml, pdSignCounts, pdSignWire, pdSignFacePaint, pdSignPaperPaint,
  PD_FILL_TRIES, PD_FILL_BEAT_MS, pdFillFor, pdFillShows, pdFillOpen, pdFillSeen, pdFillAway, pdFillClose, pdFillHeadHtml, pdFillDoneHtml, pdFillFaceHtml, pdFillMark, pdFillGroupsPaint, pdFillRows, pdFillRowKey, pdFillFacePaint, pdFillCounts, pdFillKeyOf, pdFillEcho, pdFillWire, pdFillLand, pdFillRefresh,
  pdFillStreamMay, pdFillStreamHtml, pdFillStreamAsk, PD_FF_BOX, pdFillBoxOf, pdFillLabelOf, PD_FF_UNIT, pdFillStdOf, PD_FF_CLAUSE_NUM, pdFillSpotClause, pdFillSpotOf, pdFillExtrasPaint, pdFillStreamRepaint, pdFillStreamPick,
  PD_DROP_ACCEPT, pdDropMay, pdWallHelloHtml, pdDropInner, pdDropStreams, pdDropStreamNow, pdDropStreamHtml, pdDropHtml, pdDropPaint, pdWallHtml, pdDropInput, pdDropBusyNow, pdDropPick, PD_DROP_TOAST_MS, pdDropToastOff, pdDropTake,
  PD_GLANCE, PD_GL_SUB_MAX, pdGlanceSub, pdGlanceBriefHtml, pdGlanceFootHtml, pdDropImportHtml, pdDropDoor, pdGlanceRows, pdSignAhead, pdGlanceHtml, pdGlanceRepaint, pdJamboTopHtml, pdNeedsRows, pdNeedRowHtml, pdNeedsHtml, pdNeedsRepaint, pdBackHtml, PD_BACK_CLOSE, PD_GL_DONE_MS, pdGlanceDone,
  JB_BEAT_MS, JB_HOP_MS, jamboPerchMount, jamboRest, jamboWorkWords, jamboBeat, jamboHop, jamboLookPaint });
