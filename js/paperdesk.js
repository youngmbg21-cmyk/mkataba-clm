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
   pdDealHtml and pdHistHtml have no caller and are STALE. */
/* THE OVERVIEW TAB IS GONE FROM HOME'S PANEL (owner, 13 Oct 2026: "delete the
   overview tab from document page"); a door that named it lands on Jambo */
const PD_TABS = ['copilot', 'doc', 'oblig'];
const PD_TAB_ALIAS = { deal: 'doc', hist: 'copilot', facts: 'copilot' };
/* THE ARTIFACT'S SYMBOLS, EXACTLY (owner, 10 Oct 2026: "use the Symbols that
   were in the artifact before not the ones in hati"): typed marks, each held
   to its text face (U+FE0E), never the left menu's drawings. */
const PD_TAB_GLYPH = { copilot: '\u2726', facts: '\u25A6', doc: '\u25A2', oblig: '\u2691', hist: '\u25F7', deal: '\u21C4' };
const PD_TAB_ICON = PD_TAB_GLYPH;
/* the room's own words for its tabs; Copilot and Deal have no room tab */
/* THE DOCUMENT TAB IS CALLED CLAUSES (owner, 11 Oct 2026): Home's face is
   "Document" now, and this tab holds the clause list. */
const PD_TAB_NAME = { copilot: 'pd_tab_copilot', facts: 'tab_overview', doc: 'pd_tab_clauses', oblig: 'tab_obligations', hist: 'tab_history', deal: 'pd_tab_deal' };
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
  if (!c) return null;
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
  const rows = obs.map((o, i) => {
    if (!o) return '';
    let due = '';
    try { const d = (typeof obligationDueSay === 'function') ? obligationDueSay(o, c) : null; due = d && typeof d === 'object' ? [d.day, d.sub].filter(Boolean).join(' · ') : String(o.due || ''); } catch (_){ due = String(o.due || ''); }
    const theirs = (typeof obligationIsTheirs === 'function') ? obligationIsTheirs(o) : o.party === 'theirs';
    let acts = [];
    try { acts = (typeof obPanelActs === 'function') ? obPanelActs(o, c, i, 'tab').filter(a => a.k !== 'reopen') : []; } catch (_){ acts = []; }
    const words = (o.quote && typeof igQuoteGo === 'function') ? pdBtn(_pdT('pd_show_words'), () => igQuoteGo(o.quote, true)) : '';
    return `<div class="pd-ob ${theirs ? 'is-theirs' : 'is-ours'}"><div class="pd-ob-h"><span class="pd-tag ${theirs ? 'is-theirs' : 'is-ours'}">${_pdE(_pdT(theirs ? 'pd_theirs' : 'pd_ours'))}</span><span class="pd-ob-t">${_pdE(o.desc || o.title || '')}</span></div>
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
const PD_ROOM_TAB = { facts: 'terms', oblig: 'oblig', sign: 'sign', hist: 'history', deal: 'redline', doc: 'docs', copilot: 'terms', fill: 'details', red: 'redline' };
function pdOpenOnHome(id, tab){
  const c = (typeof getContract === 'function') ? getContract(id) : null; if (!c) return false;
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
    _pdFill = String(id); _pdRed = null; tab = 'copilot';
    /* already on this paper: the panel turns, nothing else moves */
    if (window.state && state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
      && typeof intel === 'object' && intel && intel.paper && String(intel.paper.id) === String(id)){
      pdSetTab('copilot'); intel.dockOpen = true;
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
      pdFillLand();
      return true;
    }
  }
  /* THE REDLINES FACE (stage 3): Jambo's tab, the face open on this contract,
     the paper Redlined while it is (pdRedPaper) */
  if (tab === 'red'){
    _pdRed = String(id); _pdFill = null; _pdFillKey = null; tab = 'copilot';
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
  if (!(window.state && state.view === 'dashboard') && typeof setView === 'function') setView('dashboard');
  igWalk([id], 0, { tab: tab || 'copilot' });
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
  return `<div class="pd-ff-r"><h3>${_pdE(_pdT('pd_ff_title'))}</h3><span data-pd-ff-pill>${
      d.left ? pdPill('warn', _pdTn('det_left_n', d.left, { n: d.left })) : pdPill('ok', _pdT('pd_ff_all_in'))}</span>
      <button type="button" class="pd-ff-x" data-pd-ff-close title="${_pdE(close)}" aria-label="${_pdE(close)}">×</button></div>
    <div class="det-bar" aria-hidden="true"><i data-pd-ff-bar style="width:${pct}%"></i></div>
    <span class="pd-ff-n" data-pd-ff-count>${_pdE(_pdT('det_n_of_m', { done, all: d.all }))} · ${_pdE(_pdT('det_saved_note'))}</span>`;
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
  return `<div class="pd-ff" data-pd-ff="${_pdE(c.id)}">
    <div class="pd-ff-h" data-pd-ff-head>${pdFillHeadHtml(c)}
      ${''/* in the head that stays in sight: the last box is at the foot of the form */}<div data-pd-ff-done>${pdFillDoneHtml(c)}</div></div>
    <div id="det-basics" class="pd-ff-basics"></div>
    <div id="pd-fill" class="pd-ff-paper"></div>
  </div>`;
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
  const n = host.querySelector('[data-pd-ff-count]'); if (n) n.textContent = `${_pdT('det_n_of_m', { done, all: d.all })} · ${_pdT('det_saved_note')}`;
  const fin = host.querySelector('[data-pd-ff-done]'); if (fin) fin.innerHTML = pdFillDoneHtml(c);
  try { if (typeof detMarkOpen === 'function') detMarkOpen(c); } catch (_){}
  try { if (typeof detPaintPaperEmpties === 'function') detPaintPaperEmpties(); } catch (_){}
  if (typeof window !== 'undefined' && window.caChipsHtml){
    const chips = document.querySelector('#ig-dock [data-ig-chips]');
    if (chips){ const h = caChipsHtml();
      /* drawn again with their press, as renderIntelDock binds them */
      if (h){ chips.innerHTML = h; chips.querySelectorAll('[data-igsug]').forEach(b => b.addEventListener('click', () => { if (typeof intelAsk === 'function') intelAsk(b.getAttribute('data-igsug')); })); } }
  }
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
    if (e.target.closest && e.target.closest('[data-pd-ff-close]')){ e.preventDefault(); pdFillClose(); }
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
  pdFillWire(host);
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
/* the face's own way out, at the end of the column's head: Open Negotiate
   (the page itself, still on the rail) and × back to the conversation */
function pdRedHeadEndHtml(c){
  const close = _pdT('act_close');
  /* three siblings of the head's own parts: the sheet puts × at the end of
     the first line, and Open Negotiate under it, at the end of the round's */
  return `<button type="button" class="pd-rf-x" data-pd-rf-close title="${_pdE(close)}" aria-label="${_pdE(close)}">×</button>`
    + `<span class="pd-rf-br" aria-hidden="true"></span>`
    + `<button type="button" class="ui-link pd-rf-nego" data-pd-rf-nego="${_pdE(c.id)}">${_pdE(_pdT('ct_open_negotiate'))}</button>`;
}
/* the Negotiate page's own options, this host's repaint and root */
function pdRedOpts(c){
  const base = (typeof rlBenchOpts === 'function')
    ? rlBenchOpts(c, { side: 'owner', hostId: 'pd-redface', again: pdRedRepaint, scope: '#pd-redface' })
    : { side: 'owner', hostId: 'pd-redface', rerender: pdRedRepaint };
  return Object.assign({}, base, { cpPanel: false, headEnd: pdRedHeadEndHtml(c) });
}
function pdRedFaceHtml(c){
  if (!c || typeof rlColumnHtml !== 'function') return '';
  try { if (typeof negoEnsureStyle === 'function') negoEnsureStyle(); } catch (_){}
  try { if (typeof redlineLayoutCss === 'function') redlineLayoutCss(); } catch (_){}
  let col = '';
  try { col = rlColumnHtml(c, pdRedOpts(c)); } catch (e){ col = pdEmpty((e && e.message) || String(e), 'alert'); }
  return `<div class="redline-page rl-face" data-rl-side-mode="changes" data-pd-rf="${_pdE(c.id)}"><div id="nego-root" class="rl-root">${col}</div>${pdRedFootHtml(c)}</div>`;
}
/* THE COLUMN'S OWN ACTS, AT ITS FOOT (the design the owner picked): the
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
  try { if (typeof rlWireClauseTools === 'function') rlWireClauseTools(c, host, opts); } catch (_){}
  try { if (typeof redlineSyncProxies === 'function') redlineSyncProxies(host); } catch (_){}
  try { if (typeof chatFieldWire === 'function') chatFieldWire(host); } catch (_){}
  pdRedWire(host);
  pdRedPaperWire();
  /* what the Negotiate page loads after it paints — the thread from their
     page and the share list (Send all in one press needs their address) */
  try { if (typeof rlBenchCatchUp === 'function') rlBenchCatchUp(c, () => { if (pdRedShows() && String(pdRedFor()) === String(c.id)) pdRedRepaint(); }); } catch (_){}
  const keep = _pdRedTop != null ? _pdRedTop : top; _pdRedTop = null;
  const sc = host.querySelector('#nego-cards');
  if (sc && keep){ if (typeof rlRestoreScroll === 'function') rlRestoreScroll(sc, keep); else sc.scrollTop = keep; }
}
/* the face's own presses, bound once per host: ×, Open Negotiate, and a row's
   note count (notes stay on Negotiate until stage 5: it opens there, on that
   change, with the change's notes up — the page's own press) */
function pdRedWire(host){
  if (!host || host.dataset.pdRfBound) return;
  host.dataset.pdRfBound = '1';
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-pd-rf-close]')){ e.preventDefault(); pdRedClose(); return; }
    const go = t.closest('[data-pd-rf-nego]');
    if (go){ e.preventDefault(); if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(go.getAttribute('data-pd-rf-nego')); return; }
    const notes = t.closest('[data-rl-notes]');
    if (notes){
      e.preventDefault(); e.stopPropagation();
      const c = pdContract(); const id = notes.getAttribute('data-rl-notes');
      if (!c || typeof openRedlineWorkbench !== 'function' || !openRedlineWorkbench(c.id)) return;
      setTimeout(() => {
        const cc = (typeof getContract === 'function' && getContract(c.id)) || c;
        try { if (typeof rlLinkFocus === 'function') rlLinkFocus(cc, id, 'face'); } catch (_){}
        const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(id)) : String(id);
        const b = document.querySelector(`#view-redline [data-rl-notes="${q}"]`);
        if (b) b.click();
      }, 0);
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

const PD_BODY = { facts: pdFactsHtml, doc: pdDocHtml, oblig: pdObligHtml };
/* THE TITLE ROW: one button per tab, the lit one carrying its name. `brain`
   is the engine's own words (copilotBrainInfo), said on Copilot's hover. */
/* JAMBO'S OWN TAB WEARS HIS FACE (owner, 12 Oct 2026: "replace where there
   are the copilot symbols with Jambo's symbol"); the other tabs keep their glyph */
function pdTabGlyphHtml(t){
  if (t === 'copilot' && typeof jamboFaceHtml === 'function') return jamboFaceHtml('hello', 20, 'pd-tab-face').replace('<img', '<img data-ink-exempt');   /* a picture carries no ink */
  return PD_TAB_GLYPH[t] + '\uFE0E';
}
function pdHeadHtml(brain){
  const tabs = pdOnPaper() ? PD_TABS : ['copilot'];
  const lit = tabs.includes(_pdTab) ? _pdTab : 'copilot';
  const c = pdOnPaper() ? pdContract() : null;
  return tabs.map(t => {
    const name = _pdT(PD_TAB_NAME[t]);
    const tip = t === 'copilot' && brain ? name + ' · ' + brain : name;
    const on = t === lit, cnt = pdTabCount(t, c);
    return `<button type="button" role="tab" class="pd-tab${on ? ' on' : ''}" data-pd-tab="${t}" aria-selected="${on}" aria-label="${_pdE(cnt ? _pdT('pd_tab_n', { name, n: cnt.n }) : name)}" title="${_pdE(tip)}"><span class="pd-tab-i"><span class="pd-tab-g" aria-hidden="true">${pdTabGlyphHtml(t)}</span>${cnt ? `<span class="pd-tab-n is-${cnt.tone}">${cnt.n > 99 ? '99+' : cnt.n}</span>` : ''}</span><span class="pd-tab-w">${_pdE(name)}</span></button>`;
  }).join('');
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
      if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    const a = t.closest('[data-pd-act]'); const fn = a ? _pdActs.get(a.getAttribute('data-pd-act')) : null;
    if (!fn) return;
    e.preventDefault();
    try { await fn(); } catch (err){ if (typeof toast === 'function') toast((err && err.message) || String(err), 'err'); }
    setTimeout(() => pdPaint(), 0);
  });
}

Object.assign(window, { PD_LOOK_RE, pdRedOk, pdTheirOpen, pdMovedWords, pdChangeKind, PD_NEGO_WAIT_MS, pdNegoThen, pdGoClause, pdSendWaiting, PD_ROOM_TAB, pdOpenOnHome, PD_TAB_ICON, PD_TAB_GLYPH, PD_TAB_NAME, PD_TABS, pdTabCount, pdTabCountPaint, pdTabGlyphHtml, pdTop, pdPill, pdList, pdEmpty, PD_GO_ARROW, PD_HIST_MAX, pdSetTab, pdTab, pdOnPaper, pdShowsDesk, pdHeadHtml, pdBodyHtml, pdDocHtml, pdContract, pdBtn, pdRoom, pdFactsHtml, pdObligHtml,
  pdHistHtml, pdDealHtml, PD_BODY, pdHtml, pdPaint, pdFillPaint,
  pdRedFor, pdRedShows, pdRedOpen, pdRedLand, pdRedSeen, pdRedAway, pdRedClose, pdRedPaper, pdRedHeadEndHtml, pdRedOpts, pdRedFaceHtml, pdRedFootHtml, pdRedScrollOf, pdRedRepaint, pdRedFacePaint, pdRedWire, pdRedPaperWire,
  PD_FILL_TRIES, PD_FILL_BEAT_MS, pdFillFor, pdFillShows, pdFillOpen, pdFillSeen, pdFillAway, pdFillClose, pdFillHeadHtml, pdFillDoneHtml, pdFillFaceHtml, pdFillFacePaint, pdFillCounts, pdFillKeyOf, pdFillEcho, pdFillWire, pdFillLand, pdFillRefresh });
