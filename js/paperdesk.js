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
   overview tab from document page"); a door that named it lands on the first
   tab — CALLED "OVERVIEW" SINCE 19 OCT 2026 (owner: "the first tab beside a
   contract is renamed Overview"; it holds Needs you here, the glance and the
   chips). Its key stays 'copilot'; "Jambo" now names only the conversation
   the panel flips to (pdTalkKey, jamboTalkShows). */
/* the Menu tab is retired into the dossier's All acts fold (owner, 20 Oct 2026) */
const PD_TABS = ['copilot', 'doc', 'oblig'];
const PD_TAB_ALIAS = { deal: 'doc', hist: 'copilot', facts: 'copilot', menu: 'copilot' };
/* THE ARTIFACT'S SYMBOLS, EXACTLY (owner, 10 Oct 2026: "use the Symbols that
   were in the artifact before not the ones in hati"): typed marks, each held
   to its text face (U+FE0E), never the left menu's drawings. */
const PD_TAB_GLYPH = { copilot: '\u2726', facts: '\u25A6', doc: '\u25A2', oblig: '\u2691', hist: '\u25F7', deal: '\u21C4', menu: '\u2630', findings: '\u25C7', guide: '\u25A4' };
const PD_TAB_ICON = PD_TAB_GLYPH;
/* the room's own words for its tabs; Copilot and Deal have no room tab */
/* THE DOCUMENT TAB IS CALLED CLAUSES (owner, 11 Oct 2026): Home's face is
   "Document" now, and this tab holds the clause list. */
const PD_TAB_NAME = { copilot: 'pd_tab_overview', facts: 'tab_overview', doc: 'pd_tab_clauses', oblig: 'tab_obligations', hist: 'tab_history', deal: 'pd_tab_deal', menu: 'pd_tab_menu', findings: 'pd_tab_findings', guide: 'pd_tab_guide' };
const PD_HIST_MAX = 40;          // trail rows drawn; the rest are counted and one press away
let _pdTab = 'copilot';
const _pdActs = new Map();       // act id -> function, refilled at every paint (resolved at press time)

const _pdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _pdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _pdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;

/* THE LANDING TAB'S NAME: beside a paper it is the contract's Dossier
   (owner picked "The Dossier", 20 Oct 2026); elsewhere on Home, Overview */
function pdLandName(){ return _pdT(pdOnPaper() ? 'pd_tab_dossier' : 'pd_tab_overview'); }
function pdSetTab(t){ t = PD_TAB_ALIAS[t] || t; if (PD_TABS.includes(t)) _pdTab = t; }
function pdTab(){ return _pdTab; }
/* the contract's tabs are drawn only while Home's Paper holds a contract */
function pdOnPaper(){
  try { return typeof igHomePaperFace === 'function' && igHomePaperFace() === true && !!pdContract(); } catch (_){ return false; }
}
/* the panel shows a contract tab (not Copilot's conversation) */
function pdShowsDesk(){ return pdOnPaper() && _pdTab !== 'copilot' && !pdSendShows(); }
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
    /* A PAPER CHOSEN ON THE WALL (round 13 as drawn): his tab carries the
       Counter's own number, as it does beside a paper — read on the press that
       chose it, never on the wall's own redraws */
    /* ONE NUMBER ON ONE DOOR (pass 4, rounds 13, 7 and 12 as drawn: the same
       figure on his tab beside a chosen paper, a page brought up, its History,
       and the wall at rest — as beside a paper): the Counter's own "Needs you"
       (counterNeedsCount), the list "All N" opens. The Board at rest carries the
       same Counter number (round 17: the card left the Board). */
    const wall = !onBoard && typeof igHomePaperFace === 'function' && igHomePaperFace() === true && !pdContract();
    if (pdHolds() || wall){
      let k = 0; try { k = (typeof counterNeedsCount === 'function') ? counterNeedsCount() : 0; } catch (_){ k = 0; }
      return k ? { n: k, tone: 'warn' } : null;
    }
    /* on the Board: the Counter's own number since round 17 (the card left
       the Board; his greeting says "What needs you is on the Counter: N things") */
    const n = !onBoard ? 0 : (typeof counterNeedsCount === 'function') ? counterNeedsCount() : (typeof hbNeedsCount === 'function') ? hbNeedsCount() : 0;
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
      /* THE NUMBER ON THE DOOR IS THE LIST'S (owner said yes, 21 Oct 2026):
         Clause review's "need you" once Jambo has read these words; before
         that, the paper's own marks the list then shows */
      const r = (typeof stkNeedCount === 'function') ? stkNeedCount(c) : null;
      const n = r != null ? r : (typeof docThreadHomeMarks === 'function') ? docThreadHomeMarks(c) : 0;
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
  /* a door naming the retired face lands on the grid (pdFillOpen) */
  if (tab === 'fill') return pdFillOpen(id, _pdFillKey ? { key: _pdFillKey } : {});
  if (tab === 'fill-face-retired'){
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
  /* the face retired (the Legora way): it is never drawn */
  return false;
}
function pdFillShowsRetired(){
  if (!_pdFill || _pdTab !== 'copilot' || !pdOnPaper()) return false;
  const c = pdContract(); if (!c || String(c.id) !== _pdFill) return false;
  const d = pdFillDetails(c);
  return !!(d && d.live && d.all);
}
/* THE FILL IN FACE RETIRED (the Legora way, owner, 20 Oct 2026): every
   door that asked for it (the checklist, the bell, the Contracts filter,
   Negotiate's "Fill them in", a blank pressed on the paper, Jambo's "fill
   in", the Board's rows) opens the paper on its Dossier and lands on the
   grid's row, its box in the hand — answered where it is asked */
function pdFillOpen(id, opts){
  const o = opts || {};
  _pdFillFloor = null; _pdFillKey = null;
  const ok = pdOpenOnHome(id, 'plain');
  if (ok !== false) pdOgLand(id, o.key || '');
  return ok;
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
  /* ONE TRAIL (owner, 19 Oct 2026): the way back is the panel's trail line
     (pdTrailHtml), so the head is the name and the count — no ‹ Jambo, no × */
  return `<div class="pd-ff-r">${pdTrailHtml({ inHead: true })}<h3 class="sr-only">${_pdE(_pdT('pd_ff_title'))}</h3><span data-pd-ff-pill>${
      d.left ? pdPill('warn', _pdTn('det_left_n', d.left, { n: d.left })) : pdPill('ok', _pdT('pd_ff_all_in'))}</span></div>
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
   someone presses. Read it now · about …": the stream's own reading
   (streamIsPrivate), the one press the strip already has (bsGo 'read'), its
   cost said first, in Jambo calls (owner, 18 Oct 2026: never money). */
function pdFillPrivateHtml(c){
  if (!c || typeof streamIsPrivate !== 'function' || !streamIsPrivate(c.folder)) return '';
  const F = (typeof FOLDERS === 'object' && FOLDERS) || {};
  const name = (F[c.folder] && F[c.folder].name) || String(c.folder || '');
  return `<span class="pd-ff-priv"><span class="pd-ff-lock"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>${_pdE(_pdT('pd_ff_private', { stream: name }))}</span> ${_pdE(_pdT('pd_ff_private_who', { stream: name }))}</span>`;
}
/* PAY, AS DRAWN: "Pay · kept apart from deal value · never added to a total",
   its parts (Part · How often · Amount) read off the record's one reading
   (payPartsOf), base pay first — "● not filled in yet · needed before
   signing" while it is owed, the house's amber pill with its dot, as drawn —
   and its one door, Edit pay › (payEditOpen) */
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
      : (base && owed) ? pdPill('warn', _pdT('pd_ff_pay_owed')) : '—';
    return `<tr${base ? ' class="is-base"' : ''}><td>${base ? `<b>${_pdE(_pdT('bs_pay_base'))}</b>` : _pdE(r.label || '')}</td><td>${_pdE(every(r.every))}</td><td>${amt}</td></tr>`;
  };
  const may = (typeof bsPayMay === 'function') ? !!bsPayMay(c) : false;
  return head + `<table class="pd-ff-pay-t"><thead><tr><th>${_pdE(_pdT('bs_pay_col_part'))}</th><th>${_pdE(_pdT('bs_pay_col_every'))}</th><th>${_pdE(_pdT('bs_pay_col_amount'))}</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody></table>${
    may && typeof payEditOpen === 'function' ? `<button type="button" class="pd-ff-use pd-ff-pay-edit" data-pd-ff-pay-edit="${_pdE(c.id)}">${_pdE(_pdT('bs_pay_edit'))}</button>` : ''}`;
}
function pdFillWaitHtml(c){
  let w = null; try { w = (typeof bsReadWait === 'function') ? bsReadWait(c) : null; } catch (_){ w = null; }
  if (!w) return '';
  if (w.busy) return `<p class="pd-ff-wait-t">${(typeof busyHtml === 'function') ? busyHtml(_pdT('jb_reading')) : _pdE(_pdT('jb_reading'))}</p>`;
  const cost = _pdT('pd_ff_wait_cost');
  const may = (typeof canEdit !== 'function') || canEdit();
  /* AS DRAWN: Jambo's small face, the line straight under the Pay card (CSS
     order), the cost said in Jambo calls, in lower case mid-line */
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 22, 'pd-ff-wait-face') : '';
  return `<p class="pd-ff-wait-t">${face}<span>${_pdE(_pdT('pd_ff_wait'))} ${may ? `<button type="button" class="pd-ff-use" data-pd-ff-read="${_pdE(c.id)}">${_pdE(_pdT('jb_read_now'))}</button>` : ''}<span class="pd-ff-cost"> · ${_pdE(cost)}</span></span></p>`;
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
  /* AN ANSWERED BOX NEVER MOVES UNDER THE HAND, AT THE LIST'S END TOO (19 Oct
     2026, ONE TRAIL took a line of the face's height): while the face stays
     open its work never gets shorter, so a scroll at the end is not pulled up
     (and the sheet keeps the browser's scroll anchoring off, #pd-fillface) */
  const w = host.querySelector('.pd-ff-work');
  if (w){
    if (!_pdFillFloor || _pdFillFloor.id !== String(c.id)) _pdFillFloor = { id: String(c.id), h: 0 };
    _pdFillFloor.h = Math.max(_pdFillFloor.h, w.offsetHeight);
    w.style.minHeight = _pdFillFloor.h + 'px';
  }
}
let _pdFillFloor = null;     // the face's tallest work this opening (pdFillMark)
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
  });
  pdFillPaperMarks(c);
}
/* the kind of contract whose book of our standards applies (playbookKeyFor), in its own words */
function pdFillStdKind(c){
  let label = '';
  try { const key = (typeof playbookKeyFor === 'function') ? playbookKeyFor(c) : ''; label = (typeof resolvePlaybook === 'function') ? String((resolvePlaybook(key) || {}).label || '') : ''; } catch (_){ label = ''; }
  return label.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
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
  /* THE GRID ASKS (the Legora way): while the Dossier stands beside this
     paper with no face over it, its owed blanks are amber on the paper */
  const on = !!(c && pdOgShows(c));
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
    const asked = (typeof stAskOpenOn === 'function') ? stAskOpenOn('refile:' + c.id) : null;
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
  const a = await stAskDirect('refile:' + c.id, _pdT('pd_ff_ask_words', { ref, name: String(c.name || '').trim() }).replace(/\s+/g, ' ').trim(), '');
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
    /* WHERE IT LANDS: its spot on the paper, brought into view and lit by the
       house's one lander (LAND ON IT, owner, 18 Oct 2026), the cursor kept in
       the box so the answer is typed where it was asked */
    const at = t.closest('[data-pd-ff-at]');
    if (at){ e.preventDefault();
      const row = at.closest('[data-pd-owed]'), box = pdFillBoxOf(row), c = pdContract();
      const k = row && c ? pdFillRowKey(row, c) : '';
      const spot = (k && typeof contractFieldPeer === 'function') ? (() => { try { return contractFieldPeer(k, 'paper'); } catch (_){ return null; } })() : null;
      if (spot && typeof landOn === 'function') landOn(spot, { block: 'center', focus: false });
      if (box) try { box.focus({ preventScroll: true }); } catch (_){}
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
  /* the face opens on its piles, never on the notes or a ladder left open last time */
  if (typeof rlFaceNotesSet === 'function') rlFaceNotesSet(null);
  if (typeof rlFaceLadderSet === 'function') rlFaceLadderSet(null);
  return pdOpenOnHome(id, 'red');
}
/* another contract asked for puts the face away (igAnalyze), as Fill in's */
function pdRedSeen(id){ if (_pdRed && String(id) !== _pdRed) _pdRed = null; }
function pdRedAway(){ _pdRed = null; }
function pdRedClose(){
  const id = _pdRed; _pdRed = null;
  if (typeof rlFaceNotesSet === 'function') rlFaceNotesSet(null);
  if (typeof rlFaceLadderSet === 'function') rlFaceLadderSet(null);
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
/* pdRedHeadEndHtml (the column head's ×) WENT (round 9's gaps, third pass):
   ‹ Jambo in the panel's own row closes the face, as drawn; no caller was
   left. data-pd-rf-close is STALE with it. */
/* the Negotiate page's own options, this host's repaint and root */
function pdRedOpts(c){
  const base = (typeof rlBenchOpts === 'function')
    ? rlBenchOpts(c, { side: 'owner', hostId: 'pd-redface', again: pdRedRepaint, scope: '#pd-redface' })
    : { side: 'owner', hostId: 'pd-redface', rerender: pdRedRepaint };
  /* ‹ Jambo is the panel's own row now (pdFaceTabHtml, round 9 as drawn) and
     the column's head carries no × (the drawing has none: ‹ Jambo closes);
     no progress pile beside the paper — the head says the round */
  /* RISKS TO LOOK AT STAY UNDER THE PILES (owner, 19 Oct 2026: "where are
     risks cards with the why drop down buttons? … restore them"): round 9's
     gaps had taken them off this face (noRisks); the risk scan lives in the
     Redlines card, here as on the Negotiate page */
  /* …and no review banner over the head for what is out with a colleague:
     the "Out for review" pile says it, with Remind and Cancel on its head
     (waitingInPile, round 9's gaps, third pass) */
  return Object.assign({}, base, { cpPanel: false, noProgress: true, waitingInPile: true });
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
  /* who is here now, in the column's head as drawn (round 9's gaps): its slot
     is new with every paint, so it is filled at once, not on the next beat */
  try { if (typeof presencePaint === 'function') presencePaint(c.id); } catch (_){}
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
/* the face's own presses, bound once per host: a row's note count.
   THE NOTE OPENS HERE (stage 5: the Negotiate page folded into Home) — the
   page's own press, done for this face's contract: on our seat the note's own
   window (openChangeNoteDialog), else the change's thread in the shell's
   drawer (openNotesPanel), which stands over Jambo's panel */
function pdRedWire(host){
  if (!host || host.dataset.pdRfBound) return;
  host.dataset.pdRfBound = '1';
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const notes = t.closest('[data-rl-notes]');
    if (notes){
      e.preventDefault(); e.stopPropagation();
      const c = pdContract(); const id = notes.getAttribute('data-rl-notes');
      if (!c || !id) return;
      const ch = (typeof negoChangeById === 'function') ? negoChangeById(c, id) : null;
      /* A ROW'S "N notes" OPENS THAT CHANGE'S NOTES IN THIS PANEL (round 9's
         gaps, third pass: "This opens that change's notes", one room per
         side) — the head's own notes view, narrowed to the change, on the room
         that holds them; pressed again on the same row, the piles come back */
      if (ch && typeof rlFaceNotesSet === 'function'){
        const again = typeof rlFaceNotesChange === 'function' && rlFaceNotesChange() === String(ch.id);
        if (again) rlFaceNotesSet(null);
        else {
          if (typeof rlFaceNotesRoomFor === 'function' && typeof rlNpSetRoom === 'function') rlNpSetRoom(rlFaceNotesRoomFor(c, ch, pdRedOpts(c)));
          rlFaceNotesSet(c.id, ch.id);
        }
        pdRedRepaint();
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
const PD_BACK_CLOSE = { fill: () => pdFillClose(), red: () => pdRedClose(), signing: () => pdSignClose(), amend: () => pdAmendClose(),
  /* the send screen's face: its way back is the screen's own Cancel (the
     letter and its face go together, and its guard is asked) */
  /* THE BACK WHILE THE LETTER IS UP RETURNS TO THE PANEL IT CAME FROM (owner,
     19 Oct 2026; was round 11's "turns the panel back to Jambo"): the letter
     stays on the desk with what is typed in it; "Before you send" waits as a
     tab of the panel's head (pdSendBack). Cancel on the letter is still the
     way to put the screen away. */
  send: () => pdSendAway(),
  /* JAMBO AS A TAB YOU FLIP TO (19 Oct 2026): the conversation's back is the landing, as left */
  talk: () => pdTalkBack(),
  /* ONE TRAIL (owner, 19 Oct 2026): one step up inside Redlines — the notes
     or the ladder the column turned to, back to the piles */
  'red-notes': () => { if (typeof rlFaceNotesSet === 'function') rlFaceNotesSet(null); pdRedRepaint(); },
  'red-ladder': () => { if (typeof rlFaceLadderSet === 'function') rlFaceLadderSet(null); pdRedRepaint(); } };
/* ---- ONE TRAIL (owner picked "One trail" by name, 19 Oct 2026; reverses
   round 9's and 11's "‹ Jambo at the row's end" and round 3's "‹ Jambo · name
   · count · ×") ----
   Every face of Jambo's panel — Fill in, Redlines, Before you sign, an
   amendment, Before you send — draws ONE line under the panel's tabs (which
   stay): its one back, always at the line's start and named for where it
   goes, then where you are ("Jambo / Redlines / Notes"). The back is one step
   up; Esc and the bar's ‹ press the same (pdTrailBack). ONE reading, pdTrail. */
function pdTrail(){
  /* JAMBO AS A TAB YOU FLIP TO (owner, 19 Oct 2026): while the panel shows
     the conversation, the one back returns to the landing it came from */
  if (pdTalkShows()){ const w = pdLandWord(); return { back: 'talk', up: w, path: [w, _pdT('pd_tab_copilot')] }; }
  const send = typeof pdSendShows === 'function' && pdSendShows();
  const face = send ? 'send' : pdFaceNow();
  if (!face) return null;
  /* the faces live under the first tab, Overview (19 Oct 2026; was "Jambo");
     Before you send goes back to the face it was opened over */
  const jb = pdLandName();
  if (send){ const f = pdFaceNow(); const under = f ? pdFaceWordOf(f) : jb;
    return { back: face, up: under, path: (f ? [jb, under] : [jb]).concat([_pdT(PD_FACE_WORD.send)]) }; }
  /* signed, Before you sign is the receipt and says so */
  let word = _pdT(PD_FACE_WORD[face] || 'pd_tab_copilot');
  if (face === 'signing'){ try { const sc = pdContract(); if (sc && pdSignState(sc).closed) word = _pdT('pd_st_signed'); } catch (_){} }
  if (face === 'red'){
    const c = pdContract();
    const notes = !!(c && typeof rlFaceNotesOn === 'function' && rlFaceNotesOn(c, { side: 'owner' }));
    const lad = !notes && typeof rlFaceLadderOpen === 'function' && rlFaceLadderOpen();
    if (notes) return { back: 'red-notes', up: word, path: [jb, word, _pdT('ig_line_notes')] };
    if (lad) return { back: 'red-ladder', up: word, path: [jb, word, _pdT('ng_row_ladder')] };
  }
  return { back: face, up: jb, path: [jb, word] };
}
/* THE FACES WITH A HEAD OF THEIR OWN (Fill in, Before you sign, an
   amendment) carry the trail IN that head, in its title's place — the same
   spot under the tabs, no extra line (the road and the owed list keep their
   height); Redlines and Before you send draw it as its own line */
const PD_TRAIL_IN_HEAD = ['fill', 'signing', 'amend'];
function pdTrailHtml(o){
  const t = pdTrail(); if (!t) return '';
  const inHead = PD_TRAIL_IN_HEAD.includes(t.back);
  if (!(o && o.inHead) && inHead) return '';
  if (o && o.inHead && !inHead) return '';
  /* THE CLOTHES FOLLOW THE BUILDER: the one trail builder every Jambo panel
     draws (jamboTrailHtml, components.js); Home's back answers data-pd-back */
  return jamboTrailHtml(Object.assign({ attr: 'data-pd-back' }, t), { inHead: !!(o && o.inHead) });
}
/* THE LINE FOLLOWS THE FACE IN PLACE: a face opened or turned without the
   panel being rebuilt (a hand in Fill in keeps it standing) still shows its
   trail, so nothing under it moves on the next rebuild */
function pdTrailSync(){
  const dock = (typeof document !== 'undefined') ? document.getElementById('ig-dock') : null; if (!dock) return;
  const head = dock.querySelector(':scope > .igd-head'); if (!head) return;
  const html = pdTrailHtml();
  const el = dock.querySelector(':scope > .pd-trail');
  if (!html){ if (el) el.remove(); }
  else if (el){ if (el.outerHTML !== html) el.outerHTML = html; }
  else head.insertAdjacentHTML('afterend', html);
  if (typeof deskBarPaint === 'function') try { deskBarPaint(); } catch (_){}
}
/* the trail's back, pressed by Esc and the bar's ‹: true where there was a step */
function pdTrailBack(){
  const t = pdTrail(); if (!t) return false;
  const go = PD_BACK_CLOSE[t.back]; if (!go) return false;
  go(); return true;
}
function pdBackHtml(face){
  const t = _pdT('pd_trail_back', { to: pdLandName() });
  return `<button type="button" class="pd-back" data-pd-back="${_pdE(face)}" title="${_pdE(t)}" aria-label="${_pdE(t)}"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg>${_pdE(pdLandName())}</button>`;
}
/* ---- JAMBO AS A TAB YOU FLIP TO, AND BACK — HOME'S PANEL (owner, 19 Oct
   2026: "you land on the page and if you want to chat with jambo it takes
   you to a new jambo tab but you can go back to the landing side panel") ----
   The panel lands on its own face (Overview, Redlines, Fill in, Before you
   sign, an amendment, Before you send; on the Board and Explorer the first
   tab's own words). Words asked in the box turn it to the conversation —
   the trail "‹ <landing>  <landing> / Jambo" over it; the back, Esc and the
   bar's ‹ return to the landing as it was left. ONE record (components.js,
   jamboTalk*); the page is the key, so a different page, contract, face or
   tab lands fresh. What is said here is the one conversation
   (intel.history), drawn from where this page began (_pdTalk.from). */
let _pdTalk = { from: 0, seen: 0, last: null };
function pdFaceWordOf(f){
  if (f === 'signing'){ try { const sc = pdContract(); if (sc && pdSignState(sc).closed) return _pdT('pd_st_signed'); } catch (_){} }
  return (PD_FACE_WORD[f] ? _pdT(PD_FACE_WORD[f]) : pdLandName());
}
/* the landing's name, which the trail's back carries */
function pdLandWord(){
  if (typeof pdSendShows === 'function' && pdSendShows()) return _pdT(PD_FACE_WORD.send);
  const f = pdFaceNow();
  return f ? pdFaceWordOf(f) : pdLandName();
}
/* the page Home's panel is for: the paper (its contract, face or tab), else
   the Home face and what it holds; null off Home */
function pdTalkKey(){
  try {
    if (typeof state === 'undefined' || !state || state.view !== 'dashboard') return null;
    const face = (typeof hbFace === 'function') ? hbFace() : '';
    if (face === 'calendar') return 'cal:week';
    const c = pdOnPaper() ? pdContract() : null;
    if (c) return 'dock:p:' + c.id + ':' + ((pdSendShows() ? 'send' : pdFaceNow()) || _pdTab);
    const held = pdHeldContract();
    const tab = (typeof igFindingsShows === 'function' && igFindingsShows()) ? 'findings' : (typeof igGuideShows === 'function' && igGuideShows()) ? 'guide' : 'copilot';
    return 'dock:' + face + ':' + pdHolds() + ':' + (held ? held.id : '') + ':' + tab;
  } catch (_){ return null; }
}
/* the conversation a page's key belongs to: the contract on the paper, or
   the Home face and what it holds — its face or tab left out */
function pdTalkScope(k){
  k = String(k || ''); const p = k.split(':');
  if (p[0] !== 'dock') return k;
  return p[1] === 'p' ? p.slice(0, 3).join(':') : p.slice(0, -1).join(':');
}
function pdTalkShows(){ const k = pdTalkKey(); return !!(k && k.indexOf('dock:') === 0 && typeof jamboTalkShows === 'function' && jamboTalkShows(k)); }
/* THE WAY BACK TO THE CONVERSATION (owner picked "A Jambo tab", 19 Oct
   2026): once words were said on this page, a "Jambo" tab stands after the
   panel's own tabs; it opens the conversation as it was, pressed again it
   goes back (PRESS IT AGAIN AND IT CLOSES). Nothing said here, no tab. */
function pdTalkHas(){
  const k = pdTalkKey(); if (!k || k.indexOf('dock:') !== 0 || typeof jamboTalkKey !== 'function' || jamboTalkKey() !== k) return false;
  const H = (typeof intel === 'object' && intel && Array.isArray(intel.history)) ? intel.history : [];
  return H.length > _pdTalk.from;
}
function pdTalkReopen(){
  const k = pdTalkKey(); if (!k || k.indexOf('dock:') !== 0 || typeof jamboTalkOpen !== 'function') return false;
  if (typeof jamboTalkLand === 'function') jamboTalkLand(k);
  _pdTalk.byTab = true;
  jamboTalkOpen(k, document.getElementById('ig-dock'));
  if (typeof renderIntelDock === 'function') renderIntelDock();
  if (typeof deskBarPaint === 'function') try { deskBarPaint(); } catch (_){}
  return true;
}
/* THE JAMBO TAB IS ALWAYS THERE (owner, 20 Oct 2026: "jambo keeps
   disappearing from the top of the panel"; reverses "nothing shows before your
   first question"): pressed before a word, it opens his conversation, empty,
   his box ready */
function pdTalkTabHtml(){
  if (!pdTalkKey() || pdTalkKey().indexOf('dock:') !== 0) return '';
  const on = pdTalkShows(), name = _pdT('pd_tab_copilot');
  return `<button type="button" role="tab" class="pd-tab pd-tab-talk${on ? ' on' : ''}" data-pd-talk aria-selected="${on}" title="${_pdE(name)}">${typeof jamboTalkTabInner === 'function' ? jamboTalkTabInner() : _pdE(name)}</button>`;
}
/* asked by renderIntelDock before it draws: a new page lands fresh; new words
   in the conversation (asked here, or an answer coming) turn the panel to it */
function pdTalkSync(dock){
  const k = pdTalkKey(); if (!k || typeof jamboTalkLand !== 'function') return false;
  const H = (typeof intel === 'object' && intel && Array.isArray(intel.history)) ? intel.history : [];
  const len = H.length;
  /* a new page begins where the last page drawn left off: words put in the
     conversation since (a question asked as the page arrived) are this page's */
  /* AN ANSWER STILL ON ITS WAY BELONGS TO THE PAGE THAT ASKED (19 Oct 2026):
     a page that lands while Jambo is busy marks it stale; the late words (no
     question of this page's among them) fall before this page's conversation,
     never turning its panel (jambo-tab-and-back-verify 2a) */
  /* THE CONVERSATION IS THE CONTRACT'S, NOT THE TAB'S (owner, 20 Oct 2026:
     "jambo panel seems to lose the chat history when i am moving between tabs
     in the jambo panel"; reverses "a face or tab lands fresh"): another tab or
     face of the same contract (or of the same Home face) lands on its own
     content, and its Jambo tab opens the words said before; another contract
     is still fresh. An answer on its way is kept, never turning the panel. */
  const was = jamboTalkKey();
  if (jamboTalkLand(k)){
    if (was && pdTalkScope(was) === pdTalkScope(k) && _pdTalk.from <= len){ _pdTalk = { from: _pdTalk.from, seen: len, last: _pdTalk.last, quiet: !!(typeof intel === 'object' && intel && intel.busy) }; }
    else { const from = Math.min(len, _pdTalk.last == null ? len : _pdTalk.last); _pdTalk = { from, seen: from, stale: !!(typeof intel === 'object' && intel && intel.busy) }; }
  }
  /* A CONVERSATION THAT SHRANK (an exchange put away, the bin, a reset) lost
     words from BEFORE the ones drawn: where this page's words begin moves back
     with them, so what was on screen stays on screen (one-sheet-as-drawn 14) */
  if (_pdTalk.last != null && len < _pdTalk.last){ _pdTalk.from = Math.max(0, _pdTalk.from - (_pdTalk.last - len)); _pdTalk.seen = Math.min(_pdTalk.seen, len); }
  if (len < _pdTalk.from) _pdTalk = { from: len, seen: len };
  if (_pdTalk.stale && len > _pdTalk.seen){ const H1 = H.slice(_pdTalk.seen); if (!H1.some(m => m && m.role === 'user')) _pdTalk.from = _pdTalk.seen = len; else _pdTalk.stale = false; }
  if (_pdTalk.stale && !(typeof intel === 'object' && intel && intel.busy)) _pdTalk.stale = false;
  _pdTalk.last = len;
  if (k.indexOf('dock:') !== 0) return false;
  /* NOTHING SAID HERE, NO CONVERSATION VIEW (19 Oct 2026): a conversation
     cleared under an open view puts the landing back — an empty talk is never
     what the panel shows (home-held-contract-verify 3g) */
  if (len <= _pdTalk.from && !_pdTalk.byTab && !(typeof intel === 'object' && intel && intel.busy) && jamboTalkShows(k) && typeof jamboTalkClose === 'function'){ jamboTalkClose(); _pdTalk.seen = len; }
  /* THE READER'S HAND WINS: an answer that lands after they went back is kept
     in the conversation for the next flip, never pulled up over the landing */
  /* A GUIDE ROW IS NOT TYPING (19 Oct 2026): a press on Explorer's Guide runs
     its words through intelAsk, and the map changes while the Guide stays up
     and reads Showing — the words it put in the conversation are seen, never
     a turn to the conversation (explorer-guide-tab-verify 3b) */
  if (k.slice(-6) === ':guide'){ _pdTalk.seen = len; _pdTalk.quiet = false; return false; }
  if (_pdTalk.quiet && len > _pdTalk.seen){ const H2 = H.slice(_pdTalk.seen); if (!H2.some(m => m && m.role === 'user')){ _pdTalk.seen = len; if (!(intel && intel.busy)) _pdTalk.quiet = false; } }
  if (len > _pdTalk.seen){ _pdTalk.quiet = false; jamboTalkOpen(k, dock); _pdTalk.seen = len; }
  return jamboTalkShows(k);
}
/* where this page's conversation begins in the one conversation */
function pdTalkFrom(){ return _pdTalk.from; }
/* the view closed, its words seen; the landing's scrolls handed back */
function pdTalkClose(){
  const keep = (typeof jamboTalkClose === 'function') ? jamboTalkClose() : [];
  _pdTalk.byTab = false;
  _pdTalk.seen = _pdTalk.last = (typeof intel === 'object' && intel && Array.isArray(intel.history)) ? intel.history.length : 0;
  _pdTalk.quiet = !!(typeof intel === 'object' && intel && intel.busy);
  return keep;
}
function pdTalkBack(){
  const keep = pdTalkClose();
  if (typeof renderIntelDock === 'function') renderIntelDock();
  if (typeof jamboScrollPut === 'function') jamboScrollPut(keep);
  if (typeof deskBarPaint === 'function') try { deskBarPaint(); } catch (_){}
}
if (typeof jamboTalkHost === 'function') jamboTalkHost('dock', pdTalkBack, k => pdTalkKey() === k);
/* ---- BEFORE YOU SEND, A FACE OF JAMBO'S PANEL (round 11's gaps, 18 Oct
   2026: "The letter" as drawn — the letter on the desk, Jambo's panel beside
   it saying what stays here and why, what they never see, something else to
   send, with the ask box at its foot) ----
   IT OWNS NO BUILDER AND NO WRITER: the send screen builds its own column
   (shareSummaryStepHtml, its ids and listeners) and hands the NODE here
   (pdSendOpen); the face keeps it across the panel's repaints
   (pdSendFacePaint) and gives it back when the screen closes (pdSendClose,
   the screen's onClose). A question asked in the box is answered under it;
   nothing here sends. Not kept through a refresh: the screen is not. */
let _pdSend = null;          // { id, node, away } while the send screen is a page beside the panel
function pdSendFor(){ return _pdSend ? _pdSend.id : null; }
/* the screen is up (the letter on the desk), whichever face the panel shows */
function pdSendHeld(){ return !!_pdSend && typeof state !== 'undefined' && !!state && state.view === 'dashboard'; }
/* the panel shows "Before you send" — not while ‹ Jambo has turned it to
   Jambo's own words (away) */
function pdSendShows(){ return pdSendHeld() && !_pdSend.away; }
function pdSendAway(){
  if (!_pdSend) return;
  _pdSend.away = true;
  /* BACK TO THE PANEL IT CAME FROM (owner, 19 Oct 2026: "Before you send's
     back returns to the panel it came from (normally Redlines)"; reverses
     round 11's "turns the panel to Jambo with the letter waiting"): the face
     that stood under the letter (Redlines, from its Send all; Fill in;
     Before you sign) stays up and shows again, else Overview; the letter
     still waits on the desk, "Before you send" one tab away (pdSendBack) */
  _pdTab = 'copilot';
  if (typeof renderIntelDock === 'function') renderIntelDock();
}
function pdSendBack(){
  if (!_pdSend) return;
  _pdSend.away = false;
  if (typeof renderIntelDock === 'function') renderIntelDock();
  /* the column was out of sight: the letter's painter fills it again */
  try { const L = document.getElementById('sh-letter'); if (L && typeof L._shPaint === 'function') L._shPaint(); } catch (_){}
}
function pdSendOpen(id, node){
  if (!id) return false;
  const keep = _pdSend && _pdSend.id === String(id) ? _pdSend.node : null;
  if (keep && node && keep !== node && keep.parentNode) keep.parentNode.removeChild(keep);
  _pdSend = { id: String(id), node: node || keep || null };
  if (typeof intel === 'object' && intel) intel.dockOpen = true;
  if (typeof renderIntelDock === 'function') renderIntelDock();
  if (typeof igSyncDockWidth === 'function') try { igSyncDockWidth(); } catch (_){}
  return true;
}
/* ---- THE LETTER WAITS (round 11's gaps, third pass, 19 Oct 2026: "Go to
   clause 7 — the paper scrolls to clause 7 and lights it. The letter waits in
   its desk tab and is one tab away") ----
   "Go to clause N" on the stays card puts the letter page out of sight, NOT
   away: the screen, what is typed in it and every choice stay as they were;
   the paper comes up with the clause landed on; "Before you send" stays in the
   panel and the card's own button reads "Back to the letter"; the bar's
   Recent carries the letter as its first row ("Send · MK-0382"). Back brings
   the page up again where it was. Cancel and Send are still its only ends. */
function pdSendIsWaiting(){ return !!(_pdSend && _pdSend.waiting); }
function pdSendWaitSet(on){
  if (!_pdSend) return false;
  _pdSend.waiting = !!on;
  if (typeof shareLetterPagePlace === 'function') try { shareLetterPagePlace(); } catch (_){}
  if (typeof renderIntelDock === 'function') renderIntelDock();
  if (typeof deskBarPaint === 'function') try { deskBarPaint(); } catch (_){}
  return true;
}
function pdSendClose(){
  if (!_pdSend) return;
  const n = _pdSend.node; _pdSend = null;
  if (n && n.parentNode) n.parentNode.removeChild(n);
  if (typeof renderIntelDock === 'function') renderIntelDock();
  /* THE PAPER UNDER THE LETTER IS DRAWN AGAIN (19 Oct 2026, drafting-stage
     1e): a send through the letter moves the stage (Draft → Under Review)
     and the round while the page covers the paper, and the face under it
     (Redlines) skips its own repaint while it is not showing — so the
     paper's line still said "Drafting" once the letter went. Put away, the
     paper reads the record again, as every other face's close does. */
  if (typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){}
}
function pdSendFaceHtml(){ return `<div id="pd-send-slot" class="pd-send-slot${pdSendIsWaiting() ? ' is-waiting' : ''}" data-pd-send="${_pdE(pdSendFor() || '')}"></div>`; }
/* while the panel shows Jambo's own words the column waits in the panel,
   unseen, so every box and choice in it is still in the page for Send */
function pdSendKeepHtml(){ return (pdSendHeld() && !pdSendShows()) ? `<div hidden data-pd-send-kept>${pdSendFaceHtml()}</div>` : ''; }
function pdSendFacePaint(){
  const slot = (typeof document !== 'undefined') ? document.getElementById('pd-send-slot') : null;
  if (slot && _pdSend && _pdSend.node && _pdSend.node.parentNode !== slot) slot.appendChild(_pdSend.node);
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
  const s = pdSignState(c);
  /* signed, the title says so and the pill would say it twice */
  /* the way back is the panel's trail line (ONE TRAIL, owner 19 Oct 2026) */
  return `<div class="pd-sf-r">${pdTrailHtml({ inHead: true })}<h3 class="sr-only">${_pdE(_pdT(s.closed ? 'pd_st_signed' : 'pd_sf_title'))}</h3><span data-pd-sf-pill>${s.closed ? '' : pdSignPillHtml(c)}</span></div>`;
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
/* THE NUMBER MATCHES WHAT IT NAMES (the gaps, round 10, the second check): a
   check that holds twice is named once with its count — "promises (2)" */
function pdRoadCheckNames(keys, counts){ return keys.map(k => { const n = counts ? (counts[k] || 0) : 0;
  return n > 1 ? _pdT('pd_rd_ck_n', { name: _pdT('pd_rd_ck_' + k), n }) : _pdT('pd_rd_ck_' + k); }).join(', '); }
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
function pdRoadYesOf(c, at){
  if (!c || typeof signApprovalStateOf !== 'function') return null;
  let st; try { st = signApprovalStateOf(c); } catch (_){ return null; }
  if (!st || st.started || !st.rows.length) return null;
  /* one approver's yes: the row asked for (each yes at its own stop), else the first that still holds */
  const row = (at && st.rows.find(r => r && r.need && at.need && String(r.need.key) === String(at.need.key)))
    || st.rows.find(r => r.status !== 'approved') || st.rows[st.rows.length - 1];
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
/* ---- A RULE'S YES AT ITS OWN STOP (the gaps, round 10, the second check,
   18 Oct 2026: "each yes the deal waits on is drawn at its own stop with its
   states and its own buttons") ----
   The value rule's approval (approvalState's rule steps, the chain that is
   sequential, so its NEXT step) beside a named person's yes: read through the
   approvals' own readings — approvalState, approvalDecidableNow (may this
   reader decide it, now), approverForOf (whom a stand-in answers for) — and
   decided through the lists' one door, approvalDecideAsk. Null where no rule
   asks this contract for a yes. */
function pdRoadRuleOf(c){
  if (!c || typeof approvalState !== 'function') return null;
  let ap = null; try { ap = approvalState(c); } catch (_){ ap = null; }
  if (!ap || !ap.required) return null;
  const rules = (ap.chain || []).filter(x => x && !x.sa);
  if (!rules.length) return null;
  const step = rules.find(x => x.status !== 'approved') || rules[rules.length - 1];
  let d = null; try { d = (typeof approvalDecidableNow === 'function') ? approvalDecidableNow(c) : null; } catch (_){ d = null; }
  const mine = !!(d && d.kind === 'rule' && d.step && String(d.step.ruleId) === String(step.ruleId) && step.status !== 'approved');
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  let fw = null; try { fw = (mine && typeof approverForOf === 'function') ? approverForOf(step.approver, me) : null; } catch (_){ fw = null; }
  const a = step.approver || {};
  const who = (typeof approverLabelOf === 'function') ? approverLabelOf(a) : '';
  return { step, status: step.status, mine, for: fw, who, member: a.kind === 'member', admin: a.kind !== 'member' && a.role === 'admin' };
}
function pdRoadRuleTitle(r){
  if (r.member) return _pdT('pd_rd_yes_of', { who: r.who });
  if (r.admin) return _pdT('pd_rd_yes_admin');
  const t = _pdT('pd_rd_yes_of', { who: r.who }); return t.charAt(0).toUpperCase() + t.slice(1);
}
/* the stop's own line when it is not the open one: who approves and the rule, or how it ended */
function pdRoadRuleSub(c, r){
  const st = r.step;
  if (st.status === 'approved') return _pdT('pd_rd_y_given', { who: (typeof awayByLabel === 'function') ? awayByLabel(st.by || '', st.for) : String(st.by || ''), day: pdDayWord(st.at) });
  if (st.status === 'rejected') return _pdT('pd_rd_st_refused');
  if (st.status === 'stale') return _pdT('pd_rd_st_lapsed');
  const t = _pdT('pd_rd_rule_sub', { who: r.who, rule: st.name || '' }); return t.charAt(0).toUpperCase() + t.slice(1);
}
/* framed where it is the open stop, or wherever the reader has something to do on it: decide it
   (any state but approved), or — an editor — send a refused or lapsed one back */
function pdRoadRuleFramed(r, isCur){
  if (!r || r.status === 'approved') return false;
  if (isCur || r.mine) return true;
  return (r.status === 'rejected' || r.status === 'stale') && ((typeof canEdit !== 'function') || canEdit());
}
let _pdRdId = false;        // the one #sa-card on the face, given while the stops are drawn
function pdRoadRuleHtml(c, r){
  const st = r.status, step = r.step;
  const chip = (t, cls) => `<span class="pd-rd-st${cls ? ' ' + cls : ''}">${_pdE(t)}</span>`;
  const sep = t => `<i>${_pdE(t)}</i>`;
  /* WHERE IT STANDS: a rule asks by itself, so it starts at Waiting — › Approved · or Refused, Lapsed */
  const states = `<div class="pd-rd-states" role="img" aria-label="${_pdE(_pdT('pd_rd_st_aria'))}">${chip(_pdT('pd_rd_st_waiting'), st === 'pending' ? 'is-cur' : 'is-past')}${sep('›')}${
    chip(_pdT('pd_rd_st_approved'), st === 'approved' ? 'is-ok' : '')}${sep(_pdT('pd_rd_st_or'))}${chip(_pdT('pd_rd_st_refused'), st === 'rejected' ? 'is-bad' : '')}${chip(_pdT('pd_rd_st_lapsed'), st === 'stale' ? 'is-cur' : '')}</div>`;
  /* the stand-in's line, from the When you're away rule: the yes may be given for them */
  const first = pdFirstName((r.for && r.for.name) || '');
  const away = (st === 'pending' && r.mine && r.for) ? pdAwayOf(r.for.id) : null;
  const standin = away ? `<div class="pd-rd-jline">${(typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 22, 'pd-rd-face') : ''}<span>${_pdE(_pdT('pd_rd_standin_nosign', { who: first, day: pdDayWord(away.to) }))}</span></div>` : '';
  let facts = '';
  if (st === 'pending'){
    let cur = ''; try { cur = (typeof contractCurrency === 'function') ? contractCurrency(c) : ''; } catch (_){ cur = ''; }
    const money = Number(c.value) > 0 && typeof fmtMoneyShortIn === 'function' ? fmtMoneyShortIn(Number(c.value), cur) : '';
    const what = money ? _pdT('pd_rd_y_now') + _pdT('pd_rd_y_and') + money : _pdT('pd_rd_y_now');
    facts = _pdT('pd_rd_rule_facts', { rule: step.name || '', who: r.who, what });
  } else if (st === 'rejected') facts = step.comment ? _pdT('pd_rd_rule_refused_why', { by: step.by || '', why: step.comment }) : _pdT('pd_rd_rule_refused', { by: step.by || '' });
  else if (st === 'stale') facts = _pdT('pd_rd_rule_lapsed');
  const acts = [];
  /* THE COLUMN'S OWN CHOICES, ON THE STOP: whoever may decide the step now
     (approvalDecidableNow) approves — "again" over a refusal or a lapse — or
     refuses; whoever may edit sends a refused or lapsed step back */
  if (r.mine){
    const again = st === 'rejected' || st === 'stale';
    acts.push(`<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-pd-rd-rule="approved">${_pdE(again ? _pdT('pd_rd_approve_again') : first ? _pdT('pd_rd_approve_for', { who: first }) : _pdT('pd_rd_approve'))}</button>`);
    acts.push(`<button type="button" class="ui-btn ui-btn-sm" data-pd-rd-rule="refused">${_pdE(_pdT('pd_rd_refuse'))}</button>`);
  }
  if ((st === 'rejected' || st === 'stale') && ((typeof canEdit !== 'function') || canEdit())){
    /* sent back through the column's own act (resubmitApproval behind #ap-resubmit), pressed */
    acts.push(`<button type="button" class="ui-btn ui-btn-sm${r.mine ? '' : ' ui-btn-primary'}" data-pd-rd-resubmit>${_pdE(_pdT(st === 'rejected' ? 'pd_rd_change_again' : 'pd_rd_send_again'))}</button>`);
  }
  let moved = null; try { moved = (st === 'pending' && typeof briefMoved === 'function') ? briefMoved(c) : null; } catch (_){ moved = null; }
  const hasMoved = !!(moved && moved.rows && moved.rows.length);
  if (hasMoved) acts.push(`<button type="button" class="pd-rd-lk" data-pd-rd-moved="rule" aria-expanded="${_pdRdMoved === 'rule'}">${_pdE(_pdT('pd_rd_moved'))}</button>`);
  const movedHtml = (hasMoved && _pdRdMoved === 'rule') ? pdRoadMovedHtml(moved) : '';
  /* the approval email's link and Needs you land on the first yes this reader may give (#sa-card) */
  const id = (st === 'pending' && r.mine && !_pdRdId) ? (_pdRdId = true, ' id="sa-card"') : '';
  return `<div class="pd-rd-card sa-card"${id} data-pd-rd-rule-card="${_pdE(st)}">${states}${standin}${facts ? `<p class="pd-rd-facts">${_pdE(facts)}</p>` : ''}${
    acts.length ? `<div class="pd-rd-acts">${acts.join('')}</div>` : ''}${movedHtml}</div>`;
}
function pdRoadMovedHtml(moved){
  return `<ul class="pd-rd-mv">${moved.rows.map(x => `<li><b>${_pdE(x.clause)}</b> — ${_pdE(x.said || _pdT('br_moved_nosay'))}</li>`).join('')}${
    moved.over ? `<li class="pd-rd-mv-more">${_pdE(_pdT('br_moved_more', { n: moved.over }))}</li>` : ''}</ul>`;
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
let _pdRdMoved = '';        // the stop whose "What moved" is open ('rule', or a named yes's key), for the sitting
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
  const mk = 'sa:' + String((y.row && y.row.need && y.row.need.key) || '');
  if (hasMoved) acts.push(`<button type="button" class="pd-rd-lk" data-pd-rd-moved="${_pdE(mk)}" aria-expanded="${_pdRdMoved === mk}">${_pdE(_pdT('pd_rd_moved'))}</button>`);
  const movedHtml = (hasMoved && _pdRdMoved === mk) ? pdRoadMovedHtml(moved) : '';
  /* THE EMAIL'S LINK LANDS HERE (HASH_GO approval → #sa-card): the frame is the
     approval asked of you, so it carries the card's id where the card would
     have been drawn — the column's own card is not drawn on this face; one
     id on the face, the first yes in road order this reader may give */
  const id = (st === 'pending' && y.as && !_pdRdId) ? (_pdRdId = true, ' id="sa-card"') : '';
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
      : `${_pdTn('sc_n_to_settle', checks.length, { n: checks.length })}: ${pdRoadCheckNames(open, checks.reduce((m, h) => { const k = pdRoadCheckOf(h.kind); m[k] = (m[k] || 0) + 1; return m; }, {}))}` });
  /* EACH YES AT ITS OWN STOP (the gaps, round 10, the second check, 18 Oct
     2026): a rule's approval (one stop, the chain's next step — the one hold
     the list carries for it) and every named person's yes (one stop each, the
     list's one hold each), so the pill counts what the road shows */
  /* once signing has begun, a rule's step nobody approved took no part (the
     link's own wall stops asking it then): only a yes given stays on the road */
  const rule0 = pdRoadRuleOf(c);
  const rule = (rule0 && (s.closed || pdRoadStarted(c)) && rule0.status !== 'approved') ? null : rule0;
  if (rule) stops.push({ k: 'rule', done: s.closed || !yes.some(h => h.kind === 'approval'), t: pdRoadRuleTitle(rule), sub: pdRoadRuleSub(c, rule), rule });
  let sa = null; try { sa = (typeof signApprovalStateOf === 'function') ? signApprovalStateOf(c) : null; } catch (_){ sa = null; }
  const saRows = (!s.closed && sa && !sa.started && Array.isArray(sa.rows)) ? sa.rows : [];
  const said = req => { const by = req && req.decidedBy ? String(req.decidedBy.name || '') : '';
    return req ? _pdT('pd_rd_y_given', { who: (typeof awayByLabel === 'function') ? awayByLabel(by, req.for) : by, day: pdDayWord(req.decidedAt) }) : _pdT('pd_rd_yes_done'); };
  if (saRows.length){
    saRows.forEach((row, i) => {
      const y = pdRoadYesOf(c, row);
      const done = row.status === 'approved';
      const sub = done ? said(y && y.req) : row.status === 'pending' ? `${_pdT('pd_rd_st_asked', { day: pdDayWord(row.req && row.req.askedAt) })} · ${_pdT('pd_rd_st_waiting')}`
        : _pdT(row.status === 'refused' ? 'pd_rd_st_refused' : row.status === 'lapsed' ? 'pd_rd_st_lapsed' : 'pd_rd_st_unasked');
      stops.push({ k: i ? 'yes' + (i + 1) : 'yes', done, t: pdRoadYesTitle(y), sub, yes: y });
    });
  } else if (yes.some(h => h.kind === 'signapproval')){
    /* a hold the rows cannot name (a reader the server measured for): its own words */
    const h = yes.find(x => x.kind === 'signapproval');
    stops.push({ k: 'yes', done: false, t: _pdT('pd_rd_yes'), sub: String(h.short || h.label || '') });
  } else if (s.closed || pdRoadStarted(c)){
    /* ONCE SIGNING HAS BEGUN, AND ON THE RECEIPT, the yes is read off the
       record itself (c.signApprovals, the last word per approver): every stop
       ticked, "Approved by Maria for Jonas, 19 Oct", never a stop that vanished */
    pdRoadYesGiven(c).forEach((req, i) => stops.push({ k: i ? 'yes' + (i + 1) : 'yes', done: true,
      t: req.approverName ? _pdT('pd_rd_yes_of', { who: String(req.approverName) }) : _pdT('pd_rd_yes_admin'), sub: said(req) }));
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
  /* each yes is framed where it is the open stop, or the reader's own to give */
  stops.forEach((x, i) => { x.framed = x.yes ? pdRoadYesFramed(x.yes, i === at) : x.rule ? pdRoadRuleFramed(x.rule, i === at) : false; });
  const yesAt = stops.findIndex(x => x.framed);
  const framed = yesAt >= 0;
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
    /* …ONLY ONCE READY TO SIGN IS TICKED (19 Oct 2026, counterparty-leads 4e;
       round 10 as drawn: "the current one is open with its buttons" — the
       drawing's "Show" sits beside "4 checks clear"). While Ready to sign is
       itself the open stop ("5 to settle: … the brief"), its checks and their
       buttons — Write the brief, last and mandatory (Young, 21 Sep 2026) —
       stand open under it, even when a later yes is the reader's to give. */
    fold: (framed || theirTurn) && !!(stops[0] && stops[0].done), theirAt: theirTurn ? at : -1, route };
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
  _pdRdId = false;
  const h = R.stops.map((x, i) => {
    const framed = !!x.framed;
    const show = (x.k === 'ready' && R.fold) ? ` · <button type="button" class="pd-rd-lk" data-pd-rd-show aria-expanded="${_pdRdShow}">${_pdE(_pdT(_pdRdShow ? 'pd_rd_hide' : 'pd_rd_show'))}</button>` : '';
    const acts = i === R.theirAt ? pdRoadTheirActs(host, x) : '';
    return `<div class="pd-road-stop ${x.done ? 'is-done' : i === R.cur ? 'is-now' : 'is-later'}${framed ? ' is-framed' : ''}${i === R.stops.length - 1 ? ' is-last' : ''}" data-pd-road-stop="${_pdE(x.k)}" style="order:${2 * i + 2}">
      <i class="pd-road-dot" aria-hidden="true">${x.done ? '✓' : (i === R.cur || framed) ? '!' : ''}</i><div class="pd-road-t"><b>${_pdE(x.t)}</b>${
        framed ? (x.rule ? pdRoadRuleHtml(c, x.rule) : pdRoadYesHtml(c, x.yes)) : (x.sub ? `<small>${_pdE(x.sub)}${show}</small>` : '')}${acts}</div></div>`; }).join('');
  if (w.innerHTML !== h) w.innerHTML = h;
  /* the foot line: who signs can change until the first signature, and the route's own editor */
  const rf = host.querySelector('[data-pd-rd-foot]');
  if (rf){ const fh = R.route ? `<span>${_pdE(_pdT('pd_rd_change_line'))}</span><button type="button" class="ui-btn ui-btn-sm" data-pd-rd-route>${_pdE(_pdT('pd_rd_change'))}</button>` : '';
    if (rf.innerHTML !== fh) rf.innerHTML = fh;
    rf.style.order = String(2 * R.stops.length + 6); rf.style.display = fh ? '' : 'none'; }
  /* THE FACE BECOMES THE RECEIPT (the gaps, round 10, the second check): once
     sealed, who approved and who signed when are said once, on the ticked stops
     — the column's own record of them (the executed line, the approval gate,
     the signing order) is not drawn under it. Its host states display inline,
     so the fold is WRITTEN ON THE ELEMENT. */
  const side = host.querySelector('#sign-side');
  if (side){ const want = R.closed ? 'none' : 'flex'; if (side.style.display !== want) side.style.display = want; }
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
    if (ob && typeof hbOpenView === 'function'){ e.preventDefault(); hbOpenView(ob.getAttribute('data-pd-sf-oblig'), 'oblig');
      /* LAND ON IT (owner, 18 Oct 2026): on the contract's own obligations, lit — the one lander */
      if (typeof landOn === 'function') landOn(() => document.querySelector('#obw-one-host table, #obw-one-host .obt, #obw-one-host'), { block: 'start', focus: false });
      return; }
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
  if ((b = hit('[data-pd-rd-moved]'))){ e.preventDefault(); const k = b.getAttribute('data-pd-rd-moved') || ''; _pdRdMoved = _pdRdMoved === k ? '' : k; pdRoadPaint(c); return; }
  /* A RULE'S YES: the lists' one door (approvalDecideAsk), only while the rule's step is this reader's to decide */
  if ((b = hit('[data-pd-rd-rule]'))){ e.preventDefault();
    const d = (typeof approvalDecidableNow === 'function') ? approvalDecidableNow(c) : null;
    if (!d || d.kind !== 'rule' || typeof approvalDecideAsk !== 'function'){ if (typeof toast === 'function') toast(_pdT('sa_gone'), 'warn'); return; }
    b.disabled = true;
    try { await approvalDecideAsk(c, b.getAttribute('data-pd-rd-rule') === 'approved' ? 'approved' : 'refused'); } finally { b.disabled = false; }
    return; }
  if (hit('[data-pd-rd-resubmit]')){ e.preventDefault();
    const own = document.querySelector('#pd-signface #ap-resubmit');
    if (own && !own.disabled) own.click(); else if (typeof toast === 'function') toast(_pdT('sa_gone'), 'warn');
    return; }
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
    /* the yes this stop names — each named yes has its own stop, so its own request */
    let rows = []; try { rows = ((typeof signApprovalStateOf === 'function' ? signApprovalStateOf(c) : null) || {}).rows || []; } catch (_){ rows = []; }
    const at = rows.find(r => r && r.req && String(r.req.id) === String(id)) || null;
    const y = at ? pdRoadYesOf(c, at) : null;
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
    if (typeof scPaintPage === 'function') try { scPaintPage(); } catch (_){}
    /* laid out into pages: its clause headings marked again for Follow me
       (igPaperClauseMarks), and a reader following someone taken again to
       where they are — the pages moved every clause (presenceReWalk) */
    if (typeof igPaperClauseMarks === 'function') try { igPaperClauseMarks(c); } catch (_){}
    if (typeof presenceReWalk === 'function') try { presenceReWalk(); } catch (_){} };
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
  /* the way back is the panel's trail line (ONE TRAIL, owner 19 Oct 2026) */
  return `<div class="pd-sf-r">${pdTrailHtml({ inHead: true })}<h3 class="sr-only">${_pdE(_pdT('pd_am_title', { ref: (typeof contractRef === 'function') ? contractRef(c) : c.id }))}</h3></div>
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
/* ---- ACTS IN DAYLIGHT (the dossier, owner 20 Oct 2026) ----
   The stage's own acts as buttons (the first filled), then the contract's
   whole ⋯ list folded under one line that names what is in it, then the
   family with Where we are and History. The rows are the room ⋯ menu's own
   (pdMenuGroups) and are drawn ONCE, in the fold; an act button presses its
   row there (pdMenuWire over this root), so a press does exactly what the
   row does and nothing is decided twice. The Menu tab is retired into this. */
const DOSSIER_ACTS_MAX = 3;
const DOSSIER_ROW_ATTRS = ['data-rl-prepare', 'data-rl-edit-clause', 'data-rl-add-clause', 'data-rl-edit-first', 'data-ig-review', 'data-ig-pbreview', 'data-ig-memo'];
function dossierRowKey(b){ return b.id ? '#' + b.id : DOSSIER_ROW_ATTRS.map(a => b.hasAttribute(a) ? `[${a}]` : '').find(Boolean) || ''; }
function dossierRowWord(b){ const x = b.cloneNode(true); x.querySelectorAll('[aria-hidden="true"], svg, .mnote').forEach(n => n.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); }
/* the stage's acts: PD_MENU_NEXT's picks for the stage, then the first live rows */
function dossierActsPick(c, groups){
  const G = groups || pdMenuGroups(c); if (!G.length || typeof document === 'undefined') return [];
  const box = document.createElement('div');
  box.innerHTML = G.map(g => g.rows.join('')).join('');
  const st = (typeof negoExecuted === 'function' && negoExecuted(c)) ? 'Signed' : (PD_MENU_NEXT[c.status] ? c.status : 'Draft');
  const picked = [];
  const take = b => { if (b && !b.disabled && !picked.includes(b) && picked.length < DOSSIER_ACTS_MAX && dossierRowKey(b)) picked.push(b); };
  PD_MENU_NEXT[st].forEach(sel => take(box.querySelector(sel)));
  if (picked.length < DOSSIER_ACTS_MAX) [...box.querySelectorAll('button')].forEach(take);
  return picked.map(b => ({ key: dossierRowKey(b), word: dossierRowWord(b), tip: b.title || '' }));
}
function pdNextUpHtml(c){
  if (!c) return '';
  const groups = pdMenuGroups(c);
  const acts = groups.length ? dossierActsPick(c, groups) : [];
  const stWord = (typeof statusLabel === 'function') ? statusLabel((typeof negoExecuted === 'function' && negoExecuted(c)) ? 'Signed' : c.status) : '';
  const btns = acts.map((a, i) => `<button type="button" class="ui-btn ui-btn-sm${i === 0 ? ' ui-btn-primary' : ''}" data-pd-mn-go="${_pdE(a.key)}"${a.tip ? ` title="${_pdE(a.tip)}"` : ''}>${_pdE(a.word)}</button>`).join('');
  const actsCard = acts.length ? `<div class="pd-glance ds-card ds-acts" data-pd-ds-card="acts"><div class="pd-gl-h"><b>${_pdE(_pdT('dos_acts', { stage: String(stWord) }))}</b><span class="pd-gl-sp"></span></div><div class="ds-acts-b">${btns}</div></div>` : '';
  /* ALL ACTS, FOLDED: the line names the first few, the count is the rows' */
  const all = groups.reduce((n, g) => n + g.rows.length, 0);
  let names = [];
  if (all){ const box = document.createElement('div'); box.innerHTML = groups.map(g => g.rows.join('')).join('');
    names = [...box.querySelectorAll('button')].map(dossierRowWord).filter(Boolean).slice(0, 3).map(w => w.charAt(0).toLowerCase() + w.slice(1)); }
  const allFold = all ? `<details class="ds-fold" data-ds-fold="acts"><summary><span>${_pdE(_pdT('dos_all_acts', { list: names.join(', ') }))}</span><span class="pd-mn-n">${all}</span></summary>
    ${groups.map(g => `<div class="pd-mn-g"><div class="ds-fold-h">${_pdE(g.title)}</div><div class="pd-mn-rows room-menu">${g.rows.join('')}</div></div>`).join('')}</details>` : '';
  return `<div class="pd-menu pd-nx ds-nx" data-pd-menu="${_pdE(c.id)}">${actsCard}${allFold}${dossierFamilyFoldHtml(c)}</div>`;
}
/* THE FAMILY, WHERE WE ARE AND HISTORY, folded under one line */
function dossierFamilyFoldHtml(c){
  let rows = []; try { rows = (typeof bsFamRows === 'function') ? bsFamRows(c) : []; } catch (_){ rows = []; }
  const kids = Math.max(0, rows.length - 1);
  const said = rows.length ? _pdTn('dos_fam_n', kids, { n: kids }) : _pdT('dos_fam_none');
  const fam = rows.length ? `<div class="ds-fam">${rows.map(r => String(r.c.id) === String(c.id)
      ? `<span class="ds-fam-p is-here">${_pdE((typeof contractRef === 'function') ? contractRef(r.c) : r.c.id)} · ${_pdE(r.label)}</span>`
      : `<button type="button" class="ds-fam-p" data-pd-ds-fam="${_pdE(r.c.id)}">${_pdE((typeof contractRef === 'function') ? contractRef(r.c) : r.c.id)} · ${_pdE(r.label)}</button>`).join('<span aria-hidden="true">→</span>')}</div>` : '';
  let acts = []; try { acts = (typeof familyActs === 'function') ? familyActs(c) : []; } catch (_){ acts = []; }
  const actsHtml = acts.map(a => `<button type="button" class="ui-btn ui-btn-sm" data-pd-ds-famact="${_pdE(a.k)}"${a.shut ? ` disabled aria-disabled="true" title="${_pdE(a.shut)}"` : ''}>${_pdE(a.label)}</button>`).join('');
  const reads = `<button type="button" class="ui-btn ui-btn-sm" data-pd-ds-page="where">${_pdE(_pdT('tab_where_we_are'))}</button><button type="button" class="ui-btn ui-btn-sm" data-pd-ds-page="hist">${_pdE(_pdT('tab_history'))}</button>`;
  return `<details class="ds-fold" data-ds-fold="family"><summary><span>${_pdE(_pdT('dos_fam_line', { fam: said }))}</span></summary>${fam}<div class="ds-acts-b">${actsHtml}${reads}</div></details>`;
}
function pdMenuHtml(c){
  if (!c) return '';
  const groups = pdMenuGroups(c);
  if (!groups.length) return pdEmpty(_pdT('pd_failed'), 'alert');
  return `<div class="pd-menu" data-pd-menu="${_pdE(c.id)}">
    ${groups.map((g, i) => `<details class="pd-mn-g"${i === 0 ? ' open' : ''}><summary><span>${_pdE(g.title)}</span><span class="pd-mn-n">${g.rows.length}</span></summary><div class="pd-mn-rows room-menu">${g.rows.join('')}</div></details>`).join('')}
  </div>`;
}
/* its presses: the ⋯ menu's one wiring (roomMenuWire, by id), the Negotiate
   rows and the Redlines rows through their own doors; bound once per drawing */
function pdMenuWire(c, root){
  const m = root || ((typeof document !== 'undefined') ? document.querySelector('#pd-body .pd-menu') : null);
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
  /* the rows stand in the dossier's All acts fold: the landing is brought up first
     (a conversation or a face over it is put away, as a tab press does) */
  ['pdFillAway', 'pdRedAway', 'pdSignAway'].forEach(f => { if (typeof window !== 'undefined' && typeof window[f] === 'function') try { window[f](); } catch (_){} });
  if (pdTalkShows()) try { pdTalkBack(); } catch (_){}
  if (pdOpenOnHome(id, 'copilot') === false) return false;
  let n = 0;
  const tryPress = () => {
    const m = document.querySelector(`#ig-dock .pd-nx[data-pd-menu="${CSS.escape(String(id))}"]`);
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
  /* the landing tab, Overview, wears a plain mark; his face is the Jambo tab's (19 Oct 2026) */
  if (t === 'copilot') return (typeof JAMBO_LAND_GLYPH === 'string') ? JAMBO_LAND_GLYPH : '\u25A6\uFE0E';
  return PD_TAB_GLYPH[t] + '\uFE0E';
}
/* ---- THE FACE TAB (the panel's row while a face is up, as rounds 8, 9, 10
   and 11 draw it; the gaps, 18 Oct 2026) ----
   Jambo's own tab, then the face's word — "Fill in", "Redlines", "Before you
   sign", "Before you send" — and "‹ Jambo" at the row's end beside the fold
   (pdFaceBackHtml, drawn by renderIntelDock's head). The contract's other
   tabs come back with the conversation. ONE builder for every face, so a face
   added tomorrow is dressed by the same row; the faces' own heads no longer
   draw ‹ Jambo or ×. */
const PD_FACE_WORD = { fill: 'pd_face_w_fill', red: 'pd_face_w_red', signing: 'pd_face_w_signing', amend: 'pd_face_w_amend', send: 'pd_face_w_send' };
/* WHICH FACES TAKE THE PANEL'S ROW: Redlines (round 9) and Before you send
   (round 11). Fill in, Before you sign and an amendment keep round 3's own
   head — ‹ Jambo · name · count · × — the owner's answer (3), 18 Oct 2026 —
   and the contract's tabs stay above them. */
const PD_FACE_ROW = ['red', 'send'];
function pdFaceUp(){
  if (typeof pdSendShows === 'function' && pdSendShows()) return 'send';
  const f = pdFaceNow();
  return PD_FACE_ROW.includes(f) ? f : '';
}
/* pdFaceBackHtml (‹ Jambo at the tab row's end) is STALE: ONE TRAIL draws the back (pdTrailHtml) */
function pdHeadHtml(brain){
  const face = pdFaceUp();
  /* FINDINGS (Explorer stage 4): beside Jambo on Explorer's map, no paper up;
     the tab is the map's own (igFindingsShows), so the paper's tabs never meet it */
  const fd = !face && !pdOnPaper() && typeof igFindingsTabOn === 'function' && igFindingsTabOn();
  /* THE GUIDE (owner picked "On this view", 19 Oct 2026): beside Findings, what the view in front can do */
  const gd = !face && !pdOnPaper() && typeof igGuideTabOn === 'function' && igGuideTabOn();
  /* THE TABS STAY WHILE A FACE IS UP (ONE TRAIL, owner 19 Oct 2026): the
     face lives under Jambo's tab; Clauses and back to Jambo brings it back */
  const tabs = pdOnPaper() ? PD_TABS : ['copilot'].concat(fd ? ['findings'] : [], gd ? ['guide'] : []);
  const lit = pdTalkShows() ? '' : face ? 'copilot' : fd && typeof igFindingsShows === 'function' && igFindingsShows() ? 'findings'
    : gd && typeof igGuideShows === 'function' && igGuideShows() ? 'guide' : (tabs.includes(_pdTab) ? _pdTab : 'copilot');
  const c = pdOnPaper() ? pdContract() : null;
  /* A WORD FOR WHAT THE PANEL HOLDS (the gaps, round 4 "One sheet", 18 Oct
     2026: "Jambo · New agreement · ›"): beside the one sheet, the agreement
     being drafted */
  const word = (!c && typeof naSheetUp === 'function' && naSheetUp()) ? `<span class="pd-head-word">${_pdE(_pdT('na_title'))}</span>` : '';
  /* the face's word is the trail line's (pdTrailHtml), not the tab row's */
  /* the letter is up and the panel turned to Jambo: "Before you send" waits
     as a tab after Jambo's, one press back (round 11's gaps, second pass) */
  const sendBack = (pdSendHeld() && !pdSendShows()) ? `<button type="button" class="pd-tab pd-tab-face" data-pd-send-back title="${_pdE(_pdT(PD_FACE_WORD.send))}"><span class="pd-tab-w">${_pdE(_pdT(PD_FACE_WORD.send))}</span></button>` : '';
  return tabs.map(t => {
    const name = t === 'copilot' ? pdLandName() : _pdT(PD_TAB_NAME[t]);
    const tip = t === 'copilot' && brain ? name + ' · ' + brain : name;
    const on = t === lit, cnt = pdTabCount(t, c);
    return `<button type="button" role="tab" class="pd-tab${on ? ' on' : ''}" data-pd-tab="${t}" aria-selected="${on}" aria-label="${_pdE(cnt ? _pdT('pd_tab_n', { name, n: cnt.n }) : name)}" title="${_pdE(tip)}"><span class="pd-tab-i"><span class="pd-tab-g" aria-hidden="true">${pdTabGlyphHtml(t)}</span>${cnt ? `<span class="pd-tab-n is-${cnt.tone}">${cnt.n > 99 ? '99+' : cnt.n}</span>` : ''}</span><span class="pd-tab-w">${_pdE(name)}</span></button>${t === 'copilot' ? sendBack : ''}`;
  }).join('') + pdTalkTabHtml() + word;
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
  pdTrailSync();
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
    if (tab){
      /* a tab pressed while the panel talks: the conversation view closes;
         the landing's own tab pressed is its way back, as it was left */
      const was = pdTalkShows() ? pdTalkKey() : null, keep = was ? pdTalkClose() : null;
      pdSetTab(tab.getAttribute('data-pd-tab'));
      if (typeof renderIntelDock === 'function') renderIntelDock();
      if (keep && pdTalkKey() === was && typeof jamboScrollPut === 'function') jamboScrollPut(keep);
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
  return `<div class="ai-msg flex gap-2 pd-hello">${face}<div class="min-w-0 flex-1"><div class="ai-bub jl-bub">${_pdE(say)}</div></div></div>`;
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
  /* THEIR ROUND, AND EACH OF THEIR ASKS (round 6 as drawn): who sent how
     many and when, "Your move." · Redlines; then one row per ask that waits
     on us — "Clause 7: they ask for …" · their ask · Go to it — the first
     PD_GL_ASKS_MAX, the rest said in one line (a cap is a fact) */
  const asks = pdTheirAsks(c);
  if (asks.length){
    rows.push({ k: 'move', n: asks.length });
    asks.slice(0, PD_GL_ASKS_MAX).forEach(ch => rows.push({ k: 'ask:' + ch.id, kind: 'ask', ch, n: 1 }));
    if (asks.length > PD_GL_ASKS_MAX) rows.push({ k: 'asks-more', n: asks.length - PD_GL_ASKS_MAX });
  }
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
  /* RISKS NOT READ YET (round 3; the owner's answer of 18 Oct 2026: "the
     row says the read is FREE — it uses HaTi's own rules"): where the risk
     scan has not run and this person may act on the wording, its press runs
     the scan (runScanFor: HaTi's own rules, no model), and the row says so
     before it */
  let unread = false; try { unread = !c.scan && pdSignAhead(c) && typeof runScanFor === 'function' && (typeof riskMayAct !== 'function' || riskMayAct(c, {})) && (typeof canEdit !== 'function' || canEdit()); } catch (_){ unread = false; }
  if (unread) rows.push({ k: 'scan', n: 1 });
  return rows;
}
/* ---- THE GLANCE AS DRAWN (rounds 3 and 6 of the redesign; the owner's
   "build all the gaps", 18 Oct 2026) ----
   Their asks that wait on us, read RAW (negoNeedsYouIds — the reading the
   Negotiations list bands by — never negoChanges, which would start a
   negotiation), and each said in plain words from its own stored ops: the
   words that go and the words that come, quoted, never a sentence invented
   about what they mean (negoSummariseOps' rule). Reading writes nothing. */
const PD_GL_ASKS_MAX = 3;
const PD_GL_QUOTE = 40;
function pdTheirAsks(c){
  let ids = []; try { ids = (typeof negoNeedsYouIds === 'function') ? negoNeedsYouIds(c) : []; } catch (_){ ids = []; }
  const set = new Set(ids.map(String));
  return (Array.isArray(c && c.changes) ? c.changes : []).filter(x => x && set.has(String(x.id)));
}
/* the heading of the clause an ask is on, as recorded (never a negotiation started to find it) */
function pdAskHeading(c, ch){
  let label = String((ch && ch.clauseLabel) || '').trim();
  if (!label && ch && ch.clauseId && typeof negoClauseNowById === 'function'){ try { const k = negoClauseNowById(c, ch.clauseId); label = String((k && (k.heading || k.label)) || '').trim(); } catch (_){ label = ''; } }
  return label;
}
/* "Clause 7" where the clause carries a number, else its name */
function pdAskClause(c, ch){
  const label = pdAskHeading(c, ch);
  let num = ''; try { num = (typeof clauseParseHeading === 'function') ? String((clauseParseHeading(label) || {}).num || '').replace(/[.\s]+$/, '') : ''; } catch (_){ num = ''; }
  if (num) return _pdT('pd_gl_clause_n', { n: num });
  let name = label; try { if (typeof clauseNameShown === 'function') name = clauseNameShown(label) || label; } catch (_){}
  return name || _pdT('ds_a_clause');
}
/* THEIR ASK IN WORDS (round 6 as drawn: "Clause 11: they ask for 60 days to
   pay, up from 30."). Read off the change's own stored ops, never a sentence
   invented about what it means: the first stretch they changed, widened to
   whole words; where both sides of it are numbers, what the number is OF —
   the words that follow it on the paper, up to PD_GL_CONTEXT words and never
   past a stop — and which way it moved ("up from 30"). Any other change is
   quoted, whole words, as before. */
const PD_GL_CONTEXT = 4;
const PD_GL_DAYS_FOR = { payment: 'pd_gl_days_pay', term: 'pd_gl_days_notice' };
const PD_GL_GLUE = new Set(['of', 'the', 'a', 'an', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'than', 'that', 'which', 'per', 'its', 'their', 'our', 'av', 'och', 'eller', 'i', 'på', 'till', 'för', 'med', 'från', 'än', 'som', 'per', 'den', 'det', 'de']);
const PD_GL_NUM_RE = /^[^\d\s]{0,4}\s?\d[\d\s.,]*\s?(%|percent|per cent|procent)?$/i;
function pdAskParts(ch){
  const ops = (Array.isArray(ch && ch.ops) ? ch.ops : []).filter(Boolean);
  let i = ops.findIndex(op => op.op !== 'keep'); if (i < 0) return null;
  let b = '', a = '', j = i;
  for (; j < ops.length && ops[j].op !== 'keep'; j++){ if (ops[j].op === 'del') b += ops[j].text || ''; else a += ops[j].text || ''; }
  const pre = i > 0 ? String(ops[i - 1].text || '') : '', post = j < ops.length ? String(ops[j].text || '') : '';
  /* whole words: a change that starts or ends inside a word takes the rest of it */
  const head = (pre.match(/[^\s.,;:()]+$/) || [''])[0], tail = (post.match(/^[^\s.,;:()]+/) || [''])[0];
  return { b: head + b + tail, a: head + a + tail, post: post.slice(tail.length) };
}
function pdAskSay(c, ch){
  const clause = pdAskClause(c, ch);
  if (ch.changeType === 'insertClause') return _pdT('pd_gl_ask_new', { clause });
  if (ch.changeType === 'deleteClause') return _pdT('pd_gl_ask_del', { clause });
  const flat = t => String(t || '').replace(/\s+/g, ' ').trim();
  const cut = t => { const x = flat(t); return x.length > PD_GL_QUOTE ? x.slice(0, PD_GL_QUOTE - 1) + '…' : x; };
  const P = pdAskParts(ch);
  if (!P) return _pdT('pd_gl_ask_words', { clause });
  const b = flat(P.b), a = flat(P.a);
  const num = t => { const m = String(t).replace(/[^\d.,]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'); const n = parseFloat(m); return isFinite(n) ? n : null; };
  if (b && a && PD_GL_NUM_RE.test(b) && PD_GL_NUM_RE.test(a) && num(a) !== num(b)){
    /* what the number is of: the words after it, to a stop, without a dangling "of the" */
    const words = flat(String(P.post).split(/[.;:,()\n]/)[0]).split(' ').filter(Boolean).slice(0, PD_GL_CONTEXT);
    while (words.length && PD_GL_GLUE.has(words[words.length - 1].toLowerCase())) words.pop();
    /* DAYS SAID BY WHAT THE CLAUSE IS (round 6 as drawn: "60 days to pay"):
       a number of days in a payment clause is days to pay, in a termination
       clause days' notice — read off the clause's own heading (clauseKind,
       the one reading), never guessed from anything else */
    let kind = null; try { kind = (typeof clauseKind === 'function') ? clauseKind({ title: pdAskHeading(c, ch) }) : null; } catch (_){ kind = null; }
    const days = /^(days?|dagar|dag)$/i.test(words[0] || '') && PD_GL_DAYS_FOR[kind];
    const what = days ? _pdT(days, { n: a }) : cut([a].concat(words).join(' '));
    return _pdT(num(a) > num(b) ? 'pd_gl_ask_up' : 'pd_gl_ask_down', { clause, what, b });
  }
  if (b && a) return _pdT('pd_gl_ask_swap', { clause, a: cut(a), b: cut(b) });
  if (a) return _pdT('pd_gl_ask_add', { clause, a: cut(a) });
  if (b) return _pdT('pd_gl_ask_cut', { clause, b: cut(b) });
  return _pdT('pd_gl_ask_words', { clause });
}
/* how long ago their newest ask came */
function pdGlAgo(iso){
  const t = Date.parse(String(iso || '')); if (!isFinite(t)) return '';
  const d = Math.max(0, Math.floor((Date.now() - t) / 864e5));
  return d === 0 ? _pdT('pd_gl_ago_today') : _pdTn('pd_gl_ago_days', d, { n: d });
}
function pdGlMoveSay(c, asks){
  const at = asks.map(x => String(x.createdAt || x.at || '')).filter(Boolean).sort().pop() || '';
  const who = String((c && c.counterparty) || '').trim() || _pdT('ng_door_them');
  return _pdTn('pd_gl_sent', asks.length, { who, n: asks.length, ago: pdGlAgo(at) }).replace(/\s+\./, '.');
}
/* "Go to it": their ask on Home's paper — the paper Redlined (the ask is
   drawn there only) and the clause brought up and lit (igPaperGoClause, the
   one door Follow me walks through too) */
function pdGlGoTo(clauseId){
  const p = (typeof intel !== 'undefined' && intel) ? intel.paper : null;
  if (p && p.red !== true && p.red !== 'theirs'){ p.red = true; if (typeof igPaintPaper === 'function') try { igPaintPaper(); } catch (_){} }
  return (typeof igPaperGoClause === 'function') ? igPaperGoClause(clauseId) : null;
}
/* the Before you sign face's own "closed" (pdSignState), without its readiness read, and a declined deal */
function pdSignAhead(c){
  if (!c || c.status === 'Signed' || c.status === 'Declined') return false;
  return !(typeof negoExecuted === 'function' && negoExecuted(c));
}
/* ---- THE DOSSIER (owner picked "The Dossier" by name, with 4b, the Board's
   card as its mirror, 20 Oct 2026: "build the dossier and the 4b") ----
   ONE reading of where a contract stands, for the panel beside the paper and
   the Board's card alike (dossierOf): the six stages it walks, what Jambo has
   read of it, and everything still owed on it in one list. Every figure is a
   reading the record already holds — detailsOf, signBlockers, the asks that
   wait on us (pdTheirAsks), the unsent count, needsYouOf, riskOpenOf,
   deviationSummary, the obligations Jambo found (triageHeldObligations),
   contractBlanks — nothing is asked, spent or written. A stage's number is
   the count of owed rows filed under it, so the number on the spine is the
   list under it. */
const DOSSIER_STAGES = ['arrive', 'read', 'fill', 'nego', 'sign', 'live'];
const DOSSIER_FILL_MAX = 4;
const DOSSIER_ASKS_MAX = 3;
/* which stage each owed kind belongs to (Needs you's own kinds, insNeedWords') */
const DOSSIER_STAGE_OF = { late: 'live', fill: 'fill', signer: 'fill', details: 'fill', ask: 'nego', share: 'nego', quiet: 'nego', review: 'nego',
  join: 'nego', suggest: 'nego', note: 'nego', look: 'nego', approval: 'sign', sign: 'sign', refused: 'sign', renewal: 'live' };
function dossierNowStage(c){
  if (!c) return 'arrive';
  if (c.status === 'Signed' || c.status === 'Declined' || (typeof negoExecuted === 'function' && negoExecuted(c))) return 'live';
  if (c.status === 'Under Review'){
    let signing = false; try { signing = typeof negoAnySignature === 'function' && !!negoAnySignature(c); } catch (_){ signing = false; }
    return signing ? 'sign' : 'nego';
  }
  return 'fill';
}
/* the blanks are read off the paper, which draws the paper: once per wording */
const _dossierBlanks = new Map();
function dossierBlanks(c){
  if (!c || typeof contractBlanks !== 'function') return null;
  const key = String(c.id) + ':' + String(c.version || c.updatedAt || '') + ':' + String((c.fields && JSON.stringify(c.fields).length) || 0);
  if (_dossierBlanks.has(key)) return _dossierBlanks.get(key);
  let L = []; try { L = contractBlanks(c) || []; } catch (_){ L = []; }
  const r = L.length ? { total: L.length, filled: L.filter(b => String((b && b.value) || '').trim()).length } : null;
  if (_dossierBlanks.size > 40) _dossierBlanks.clear();
  _dossierBlanks.set(key, r);
  return r;
}
/* WHAT JAMBO READ: the arrival reading's own facts, each said only where it ran */
function dossierRead(c){
  const t = (c && c.triage) || null;
  const read = !!(t && t.at) && ((typeof triageReadAnything !== 'function') || !!triageReadAnything(c));
  let stale = false; try { stale = read && typeof triageReadingStale === 'function' && ['brief', 'playbook', 'oblig'].some(k => triageReadingStale(c, k)); } catch (_){ stale = false; }
  const bd = (c && ((c._brief && c._brief.data) || (c._briefLite && c._briefLite.data))) || null;
  const brief = String((bd && bd.overview) || '').trim();
  let risks = null;
  try { if (c.scan && typeof riskOpenOf === 'function') { const L = riskOpenOf(c); risks = { n: L.length, titles: L.slice(0, 3).map(it => (typeof riskTitleOf === 'function') ? riskTitleOf(it) : '').filter(Boolean) }; } } catch (_){ risks = null; }
  let mayScan = false; try { mayScan = !c.scan && typeof runScanFor === 'function' && (typeof riskMayAct !== 'function' || riskMayAct(c, {})) && (typeof canEdit !== 'function' || canEdit()); } catch (_){ mayScan = false; }
  let std = null; try { std = (typeof deviationSummary === 'function') ? deviationSummary(c) : null; } catch (_){ std = null; }
  let found = []; try { found = (typeof triageHeldObligations === 'function') ? (triageHeldObligations(c) || []) : []; } catch (_){ found = []; }
  let tally = null; try { tally = (found.length && typeof obReviewTally === 'function') ? obReviewTally(c, found) : null; } catch (_){ tally = null; }
  const recorded = (Array.isArray(c.obligations) ? c.obligations : []).filter(Boolean).length;
  return { read, stale, at: read ? t.at : null, brief, risks, mayScan, std: (std && std.total) ? std : null,
    obl: (found.length || recorded) ? { found: found.length, recorded, left: tally ? tally.left : 0 } : null,
    blanks: dossierBlanks(c) };
}
/* STILL OWED, ONE LIST: the details still empty, a signer nobody named, their
   asks that wait on us, our changes not sent, then everything Needs you here
   counts (Jambo's prepared work, looks, approvals, notes …) — said once each */
function dossierOwed(c){
  const out = []; if (!c) return out;
  let d = null; try { d = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ d = null; }
  const open = (d && d.live) ? d.items.filter(x => x && x.open) : [];
  open.slice(0, DOSSIER_FILL_MAX).forEach(x => out.push({ k: 'fill:' + x.key, kind: 'fill', key: x.key, label: x.label }));
  /* what is owed but not drawn as its own row is said as a count (a cap is a fact) */
  const rest = Math.max(open.length, (d && d.live && d.left) || 0) - Math.min(open.length, DOSSIER_FILL_MAX);
  if (rest > 0) out.push({ k: 'fill-more', kind: 'fill', more: rest, n: rest });
  let nobody = false; try { nobody = pdSignAhead(c) && (typeof signBlockers === 'function') && signBlockers(c).some(b => b && b.key === 'signers'); } catch (_){ nobody = false; }
  if (nobody) out.push({ k: 'signer', kind: 'signer' });
  const needs = (pdNeedsRows(c) || []).concat(pdNoteRows(c) || []);
  const quiet = needs.some(r => r && r.it && r.it.kind === 'quiet');
  const asks = pdTheirAsks(c);
  if (asks.length && !quiet){
    asks.slice(0, DOSSIER_ASKS_MAX).forEach(ch => out.push({ k: 'ask:' + ch.id, kind: 'ask', ch }));
    if (asks.length > DOSSIER_ASKS_MAX) out.push({ k: 'asks-more', kind: 'ask', more: asks.length - DOSSIER_ASKS_MAX, n: asks.length - DOSSIER_ASKS_MAX });
  }
  let un = 0; try { un = (c.negotiation && typeof rlUnsentCount === 'function') ? rlUnsentCount(c, {}) : 0; } catch (_){ un = 0; }
  if (un) out.push({ k: 'share', kind: 'share', n: un });
  /* AN OBLIGATION PAST ITS DAY (the Board card's own reading, bsObRows): one row, the first named */
  let late = []; try { late = (typeof bsObRows === 'function') ? (((bsObRows(c) || {}).rows) || []).filter(r => r && r.st === 'overdue') : []; } catch (_){ late = []; }
  if (late.length) out.push({ k: 'late', kind: 'late', n: late.length, what: late[0].what, days: pdDaysSince(late[0].due) });
  needs.forEach((r, i) => out.push({ k: 'need:' + (r.note ? 'mynote' : r.jw ? 'jw:' + r.k + ':' + (r.key || i) : (r.it && r.it.kind) || i), kind: r.note ? 'note' : r.jw ? 'jw' : ((r.it && r.it.kind) || 'ask'), need: r }));
  return out;
}
/* the row count a row stands for (a "and N more" row stands for N) */
function dossierRowN(r){ return r && r.more ? r.more : 1; }
function dossierOf(c){
  if (!c) return null;
  const owed = dossierOwed(c), now = dossierNowStage(c), read = dossierRead(c);
  const n = {}; DOSSIER_STAGES.forEach(k => { n[k] = 0; });
  owed.forEach(r => { const s = DOSSIER_STAGE_OF[r.kind] || now; n[s] = (n[s] || 0) + dossierRowN(r); });
  const at = DOSSIER_STAGES.indexOf(now);
  const stages = DOSSIER_STAGES.map((k, i) => {
    if (k === 'read') return { k, state: read.read ? 'done' : (n[k] ? 'on' : 'later'), n: n[k] };
    if (k === 'arrive') return { k, state: 'done', n: 0 };
    if (n[k]) return { k, state: 'on', n: n[k] };
    return { k, state: i < at ? 'done' : i === at ? 'now' : 'later', n: 0 };
  });
  return { c, now, stages, read, owed, owedN: owed.reduce((s, r) => s + dossierRowN(r), 0) };
}
/* ONE SPINE, two hosts (the panel's dossier and the Board's card) */
function dossierSpineHtml(D, o){
  if (!D) return '';
  const cls = (o && o.cls) || '';
  return `<div class="ds-spine${cls ? ' ' + cls : ''}" role="list" aria-label="${_pdE(_pdT('dos_spine'))}">${D.stages.map(s => {
    const mark = s.state === 'done' ? '✓' : s.n ? String(s.n > 99 ? '99+' : s.n) : s.state === 'now' ? '•' : '·';
    const tip = _pdT('dos_st_' + s.k) + (s.n ? ' · ' + _pdTn('dos_st_n', s.n, { n: s.n }) : s.state === 'done' ? ' · ' + _pdT('dos_st_done') : '');
    return `<span class="ds-st is-${s.state}${s.n ? ' has-n' : ''}" role="listitem" data-ds-st="${s.k}" title="${_pdE(tip)}"><i aria-hidden="true">${_pdE(mark)}</i>${_pdE(_pdT('dos_st_' + s.k))}</span>`;
  }).join('')}</div>`;
}
/* the reading's day in the reader's words */
function dossierDay(iso){
  const at = new Date(iso); if (isNaN(at)) return '';
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  try { return at.toDateString() === new Date().toDateString() ? at.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }) : at.toLocaleDateString(loc, { day: 'numeric', month: 'short' }); } catch (_){ return String(iso).slice(0, 10); }
}
const PD_GO_TXT = ' ›';
function dossierGo(attr, word, extra){ return `<button type="button" class="pd-go ds-go" ${attr}${extra || ''}>${_pdE(word)}${PD_GO_TXT}</button>`; }
function dossierReadHtml(c, D){
  const R = D.read, may = (typeof canEdit !== 'function') || !!canEdit();
  const head = R.read
    ? `<span class="ds-when">${_pdE(_pdT(R.stale ? 'dos_read_stale' : 'dos_read_same', { when: dossierDay(R.at) }))}</span>${R.stale && may ? `<button type="button" class="ui-btn ui-btn-sm" data-pd-ds-read title="${_pdE(_pdT('jb_read_cost'))}">${_pdE(_pdT('dos_read_again'))}</button>` : ''}`
    : `<span class="ds-when">${_pdE(_pdT('dos_read_not'))}</span>${may ? `<button type="button" class="ui-btn ui-btn-sm" data-pd-ds-read title="${_pdE(_pdT('jb_read_cost'))}">${_pdE(_pdT('jb_read_now'))}</button>` : ''}`;
  const row = (k, html, door) => `<div class="pd-gl-row ds-row" data-pd-ds="${k}"><span>${html}</span>${door || ''}</div>`;
  const rows = [];
  const clip = (t, n) => { const x = String(t || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; };
  rows.push(R.brief ? row('brief', `<i class="ds-ok" aria-hidden="true">✓</i> ${_pdE(_pdT('dos_brief', { line: clip(R.brief, 70) }))}`, dossierGo('data-pd-gl-brief', _pdT('dos_go_read')))
    : row('brief', _pdE(_pdT('dos_brief_none'))));
  /* a door this contract has shut is grey with its reason (the Redlines face's own rule, negoMayStartLine) */
  let shut = ''; try { shut = (typeof negoMayStartLine === 'function') ? (negoMayStartLine(c) || '') : ''; } catch (_){ shut = ''; }
  const risksGo = shut ? `<button type="button" class="pd-go ds-go" disabled aria-disabled="true" title="${_pdE(shut)}">${_pdE(_pdT('dos_go_open'))}${PD_GO_TXT}</button>` : dossierGo('data-pd-gl-risks', _pdT('dos_go_open'));
  if (R.risks) rows.push(R.risks.n ? row('risks', `<b>${R.risks.n}</b> ${_pdE(_pdTn('dos_risks', R.risks.n, { n: R.risks.n }))}${R.risks.titles.length ? ' — ' + _pdE(R.risks.titles.join(', ')) : ''}`, risksGo)
    : row('risks', `<i class="ds-ok" aria-hidden="true">✓</i> ${_pdE(_pdT('dos_risks_none'))}`));
  else if (R.mayScan) rows.push(row('risks', _pdE(_pdT('dos_risks_unread')), `<button type="button" class="ui-btn ui-btn-sm" data-pd-gl-scan title="${_pdE(_pdT('pd_gl_scan_cost'))}">${_pdE(_pdT('pd_gl_scan_go'))}</button>`));
  if (R.std){ const s = R.std, off = s.dev + s.miss, met = Math.max(0, s.total - off);
    rows.push(s.ok && s.complete ? row('std', `<i class="ds-ok" aria-hidden="true">✓</i> ${_pdE(_pdT('dos_std_all', { n: s.total }))}`, dossierGo('data-pd-ds-std', _pdT('dos_go_open')))
      : row('std', `<b>${_pdE(_pdT('dos_k_of_n', { k: met, n: s.total }))}</b> ${_pdE(_pdT('dos_std_met'))}${off ? ' — ' + _pdE(_pdTn('dos_std_off', off, { n: off })) : ''}`, dossierGo('data-pd-ds-std', _pdT('dos_go_open')))); }
  if (R.obl){ const o = R.obl;
    rows.push(row('oblig', `<b>${o.found}</b> ${_pdE(_pdT('dos_obl', { r: o.recorded }))}`, o.left ? dossierGo('data-pd-ds-obl', _pdT('dos_go_review')) : dossierGo('data-pd-glance-tab="oblig"', _pdT('dos_go_open')))); }
  if (R.blanks){ const b = R.blanks;
    rows.push(row('blanks', `<b>${b.total}</b> ${_pdE(_pdT('dos_blanks', { f: b.filled }))}`, b.filled < b.total ? dossierGo('data-pd-ds-fill=""', _pdT('dos_go_fill')) : '')); }
  return `<div class="pd-glance ds-card ds-read" data-pd-ds-card="read"><div class="pd-gl-h"><b>${_pdE(_pdT('dos_read_title'))}</b><span class="pd-gl-sp"></span>${head}</div><div class="pd-gl-b">${rows.join('')}</div></div>`;
}
function dossierOwedHtml(c, D, o){
  const held = !!(o && o.held);
  const said = r => r.kind === 'fill' ? (r.more ? _pdTn('dos_fill_more', r.more, { n: r.more }) : _pdT('dos_owed_empty', { label: r.label }))
    : r.kind === 'signer' ? _pdT('dos_owed_signer')
    : r.k === 'asks-more' ? _pdTn('pd_gl_asks_more', r.more, { n: r.more })
    : r.ch ? pdAskSay(c, r.ch)
    : r.kind === 'share' ? _pdTn('pd_gl_unsent', r.n, { n: r.n })
    : r.kind === 'late' ? _pdTn('dos_late', r.n, { n: r.n, what: r.what, days: r.days }) : '';
  /* THE FACTS ARE THE GRID (the Legora way): the rows below are the rest */
  const isFact = r => r.kind === 'fill' || r.kind === 'signer';
  const grid = pdOgHtml(c, { held });
  const rest = grid ? D.owed.filter(r => !isFact(r)) : D.owed;
  const mine = rest.filter(r => !r.need);
  const done = pdGlanceDone(c, mine, said);
  const rowHtml = r => {
    if (r.need) return pdNeedRowHtml(c, r.need);
    const amb = (r.kind === 'fill' && !r.more) ? `<span class="ds-owed-l">${_pdE(r.label)}</span> ${_pdE(_pdT('dos_owed_empty_w'))}`
      : r.kind === 'signer' ? `<span class="ds-owed-l">${_pdE(_pdT('dos_signer'))}</span> ${_pdE(_pdT('dos_signer_w'))}` : _pdE(said(r));
    const sub = r.ch ? `<small>${_pdE(_pdT('dos_waits', { ago: pdGlAgo(r.ch.createdAt || r.ch.at) }))}</small>` : '';
    const door = r.kind === 'fill' ? dossierGo(`data-pd-ds-fill="${_pdE(r.key || '')}"`, _pdT('dos_go_fill_in'))
      : r.kind === 'signer' ? dossierGo('data-pd-glance="sign"', _pdT('dos_go_name'))
      : r.kind === 'ask' ? dossierGo('data-pd-glance="redline"', _pdT('dos_go_reply'))
      : r.kind === 'share' ? dossierGo('data-pd-glance="share"', _pdT('dos_go_send'))
      : r.kind === 'late' ? dossierGo('data-pd-glance-tab="oblig"', _pdT('dos_go_open')) : '';
    return `<div class="pd-gl-row ds-row" data-pd-gl="${_pdE(r.kind === 'signer' ? 'sign' : r.kind)}"${r.ch ? ` data-pd-gl-ch="${_pdE(r.ch.id)}"` : ''}><span>${amb}${sub}</span>${door}</div>`;
  };
  /* a ticked-off row names its kind (fill · signer · ask · share), as the old glance's did */
  const doneHtml = done.map(d => `<div class="pd-gl-row is-done" data-pd-gl-done="${_pdE(String(d.k).split(':')[0].replace(/-more$/, '').replace(/^signer$/, 'sign'))}"><i aria-hidden="true">✓</i><span><s>${_pdE(d.text)}</s></span></div>`).join('');
  /* FILL THE DOCUMENT, the company template's one press, where the answers are owed to the wording
     (tplFormPending, the signing list's and the link check's own reading) */
  let pend = 0; try { pend = (!held && typeof tplFormPending === 'function' && tplFormPending(c)) ? ((typeof tplFormPendingKeys === 'function' ? tplFormPendingKeys(c).length : 0) || 1) : 0; } catch (_){ pend = 0; }
  const docFill = pend ? `<div class="pd-gl-row ds-row" data-pd-gl="docfill"><span>${_pdE(_pdTn('pd_ff_doc_n', pend, { n: pend }))}</span>${((typeof canEdit !== 'function') || canEdit()) ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary hati-fill-btn" data-pd-og-docfill="${_pdE(c.id)}">${_pdE(_pdT('tl_fill_doc'))}</button>` : ''}</div>` : '';
  const body = (D.owed.length || grid || docFill) ? grid + docFill + rest.map(rowHtml).join('') + doneHtml
    : doneHtml + `<div class="pd-gl-none"><i aria-hidden="true">✓</i><span>${_pdE(_pdT('dos_owed_none'))}</span></div>`;
  /* the head says how many Jambo read, and stores them in one press */
  const readN = grid ? pdOgReadN(c) : 0;
  const may = (typeof canEdit !== 'function') || !!canEdit();
  const sub = readN ? `<span class="ds-when">· ${_pdE(_pdTn('og_read_n', readN, { n: readN }))}</span>${!held && may ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary pd-og-all" data-pd-og-all>${_pdE(_pdTn('og_confirm_all', readN, { n: readN }))}</button>` : ''}`
    : `<span class="ds-when">${_pdE(_pdT('dos_owed_sub'))}</span>`;
  return `<div id="pd-needs" class="pd-glance ds-card ds-owed" data-pd-ds-card="owed" data-pd-needs-for="${_pdE(c.id)}"><div class="pd-gl-h"><b>${_pdE(_pdT('dos_owed_title', { n: D.owedN }))}</b>${readN ? '' : '<span class="pd-gl-sp"></span>'}${sub}</div><div class="pd-gl-b">${body}</div></div>`;
}
/* ============================================================
   THE LEGORA WAY: STILL OWED IS A REVIEW GRID (owner picked "The Legora way"
   by name, 20 Oct 2026: "Why should I have to go elsewhere to enter the
   details?")
   ============================================================
   One row per owed fact, answered where it is asked: the fact and where
   Jambo read it (the clause, the passage quoted; a press lights it on the
   paper), what he read already in the box, and Confirm. Confirm all stores
   every reading at once; a fact the wording does not hold is amber and asks
   for it in the same row. Nothing takes the reader anywhere, so there is no
   way back to design. THE SAVERS ARE THE PRODUCT'S OWN: the contract's boxes
   are wireKeyTerms' (data-kt), a blank's wireBlankForm's (data-blankf), a
   template question's tplFormCommit (data-tplf), the NDA's two facts ndaSet,
   the signers saveSignerPlan (a route needs both sides, so both are asked on
   the one row). Beside the Board the grid is drawn read-only: each row's
   door opens the paper with that row ready (the Board reads, never takes
   typing). */
const _pdOgSaved = new Map();   // contract id → the facts confirmed here this sitting [{ key, label, words }]
function pdOgSavedOf(c){ return (c && _pdOgSaved.get(String(c.id))) || []; }
function pdOgSavedAdd(c, f, words){
  const k = String(c.id), L = (_pdOgSaved.get(k) || []).filter(x => x.key !== f.key);
  L.push({ key: f.key, label: f.label, words: String(words || '') }); _pdOgSaved.set(k, L);
}
/* the wording's NDA reading on its own, whatever a person has confirmed of it
   (ndaOf answers the confirmed record whole, so a half-confirmed NDA would
   lose the other half's reading) */
function pdOgNdaRead(c){
  try { return (typeof ndaOf === 'function') ? ndaOf(Object.assign({}, c, { nda: null })) : null; } catch (_){ return null; }
}
function pdOgDay(iso){
  const t = (typeof window !== 'undefined' && window.fmtDocDate) ? window.fmtDocDate(iso) : '';
  return t || String(iso || '');
}
/* THE ROWS: detailsOf's open facts in its order, then the signers where
   signing is ahead and nobody is named */
function pdOgFacts(c){
  const out = []; if (!c) return out;
  let d = null; try { d = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ d = null; }
  const open = (d && d.live) ? d.items.filter(x => x && x.open) : [];
  const N = open.some(x => x.kind === 'nda') ? pdOgNdaRead(c) : null;
  const onPaper = k => { try { return !!(typeof contractFieldPeer === 'function' && contractFieldPeer(k, 'paper')); } catch (_){ return false; } };
  open.forEach(x => {
    const f = { key: x.key, kind: x.kind, label: x.label, read: null, from: null, sec: x.sec };
    if (x.kind === 'nda' && N){
      if (x.key === 'ndaDir' && N.dir){ f.read = { dir: N.dir, words: _pdT('nda_dir_' + N.dir) };
        f.from = { clause: N.dirClause || '', quote: N.dirQuote || '', read: true }; }
      if (x.key === 'ndaEnds'){
        if (N.ends || N.forGood) f.read = { ends: N.forGood ? '' : N.ends, forGood: !!N.forGood, trade: !!N.trade,
          words: N.forGood ? _pdT('nda_for_good') : pdOgDay(N.ends) };
        /* the wording says how long, from a day the record does not hold yet: quoted, the day asked */
        if (N.quote || f.read) f.from = { clause: N.clause || '', quote: N.quote || '', read: true };
      }
    }
    /* OUR STANDARD, WHERE ONE NAMES THIS FACT (owner's yes, 18 Oct 2026, kept in the grid): read off Our
       standards' own wording, never guessed — it stands in the box as the reading, and Confirm stores it */
    if (!f.read && (x.kind === 'blank' || x.kind === 'tplf') && typeof stdValueFor === 'function'){
      let v = null; try { v = stdValueFor(x.label); } catch (_){ v = null; }
      if (v && PD_FF_UNIT[v.unit]){ const said = _pdTn(PD_FF_UNIT[v.unit], v.figure, { n: v.figure });
        /* named for the kind of contract whose book applies (the face's rule, pdFillStdKind) */
        let kind = ''; try { kind = (typeof pdFillStdKind === 'function') ? (pdFillStdKind(c) || '') : ''; } catch (_){ kind = ''; }
        f.read = { words: said, put: said, figure: v.figure }; f.from = { std: kind || v.category || '', said }; }
    }
    if (!f.from) f.from = (x.kind === 'blank' || x.kind === 'tplf' || onPaper(x.key)) ? { spot: true } : { none: 'wording' };
    if (x.key === 'value' && typeof fxIsPay === 'function' && fxIsPay(c)) f.pay = true;
    out.push(f);
  });
  let nobody = false; try { nobody = pdSignAhead(c) && (typeof signBlockers === 'function') && signBlockers(c).some(b => b && b.key === 'signers'); } catch (_){ nobody = false; }
  if (nobody) out.push({ key: 'signers', kind: 'signer', label: _pdT('dos_signer'), read: null, from: { none: 'people' } });
  return out;
}
const PD_OG_INP = 'pd-og-in';
/* ---- THE SIGNER ROW, THE SAP WAY (the owner picked it by name, 21 Oct 2026) ----
   "adding signer should be next to the signers area not at the bottom. Also when i
   click on add signers it takes me to a different location … it should be possible
   that you can add without being taken to a different page unless there is a pop up.
   Also, I should also be able to search within our directory to enter the right
   person and their respective email."
   Both signer boxes are SEARCH boxes over the directory: typing filters, a quiet list
   drops OVER the rows under it (the counterparty's own people first, then the rest),
   picking a row fills the name AND the email together, and somebody outside the
   directory is still typed by hand — the box is still a typing box. NOTHING IS STORED
   HERE: saveSignerPlan stays the one authority, reached by this row's own Confirm. */
function _pdSgFold(v){ return String(v == null ? '' : v).trim().toLowerCase(); }
function pdSgInitials(name, email){
  const n = String(name || '').trim();
  if (n){ const w = n.split(/[\s-]+/).filter(Boolean);
    return String((w[0] || '')[0] || '').toUpperCase() + String((w.length > 1 ? (w[w.length - 1] || '')[0] : (w[0] || '')[1]) || '').toUpperCase(); }
  return String(email || '?').slice(0, 2).toUpperCase();
}
/* ONE READING, THE DIRECTORY'S OWN (dirBook — the one address book, contactsOf, is
   already inside it; where it is not up yet, this contract's own contacts). A person's
   second word is WHAT THE RECORD HOLDS — their title, their party, or their role in
   HaTi — never a job title HaTi does not have. Nothing here writes. */
function pdSgPeople(c, side){
  const S = v => String(v == null ? '' : v).trim();
  let book = []; try { book = (typeof dirBook === 'function') ? (dirBook() || []) : []; } catch (_){ book = []; }
  const me = (typeof currentUser === 'function' && currentUser()) || null;
  const mk = o => ({ id: S(o.id), name: S(o.name) || S(o.email), email: S(o.email), sub: S(o.sub), at: S(o.at),
    you: !!(me && o.id != null && S(o.id) && String(o.id) === String(me.id)) });
  const bookOf = new Map(book.filter(p => p && p.side === 'ours' && p.id).map(p => [String(p.id), p]));
  const ours = ((typeof getUsers === 'function' ? getUsers() : []) || []).filter(u => u && u.role !== 'viewer')
    .map(u => { const b = bookOf.get(String(u.id)) || {};
      return mk({ id: u.id, name: u.name || u.email, email: u.email, sub: S(u.title) || S(b.title) || S(b.hati) }); })
    .filter(p => p.name);
  if (side === 'ours') return ours;
  let theirs = book.filter(p => p && p.side === 'theirs' && (S(p.name) || S(p.email)))
    .map(p => mk({ name: p.name, email: p.email, sub: S(p.title) || S(p.partyName), at: p.partyName }));
  if (!theirs.length){
    let rows = []; try { rows = (typeof contactsOf === 'function') ? (contactsOf(c) || []) : []; } catch (_){ rows = []; }
    const seen = new Set();
    theirs = rows.filter(r => r && (S(r.name) || S(r.email)))
      .filter(r => { const k = _pdSgFold(r.email) || _pdSgFold(r.name); if (seen.has(k)) return false; seen.add(k); return true; })
      .map(r => mk({ name: r.name, email: r.email, sub: S(c && c.counterparty), at: S(c && c.counterparty) }));
  }
  const cp = _pdSgFold(c && c.counterparty);
  return theirs.filter(p => _pdSgFold(p.at) === cp)
    .concat(theirs.filter(p => _pdSgFold(p.at) !== cp))
    .concat(ours);
}
/* what the typing narrows to: the name or the address carrying the words typed */
function pdSgMatches(rows, q){
  const w = _pdSgFold(q).split(/\s+/).filter(Boolean);
  if (!w.length) return rows.slice();
  return rows.filter(p => { const hay = _pdSgFold(p.name) + ' ' + _pdSgFold(p.email) + ' ' + _pdSgFold(p.sub);
    return w.every(x => hay.includes(x)); });
}
const PD_SG_GLYPH = '<svg class="pd-og-sb-g" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>';
/* a search box in the owed box's own clothes, the glyph at its right */
function pdSgBoxHtml(o){
  const E = _pdE;
  return `<div class="pd-og-sb"><input type="text" class="${PD_OG_INP}" data-pd-og-sb="${E(o.side)}" data-pd-og-sg="${E(o.name)}"`
    + ` data-og-id="${E(o.uid || '')}" data-og-picked="${E(o.value || '')}" value="${E(o.value || '')}" placeholder="${E(o.ph)}"`
    + ` aria-label="${E(o.label)}" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list">${PD_SG_GLYPH}</div>`;
}
/* ONE BUILDER for a signer on their side — the row paints the first, "+ Add another
   signer" adds the next: the same label, search box, label and address box */
function pdSgTheirHtml(c, o){
  const E = _pdE, v = o || {};
  const them = (c && c.counterparty) || _pdT('ct_a_counterparty');
  const ml = w => `<span class="pd-og-ml" aria-hidden="true">${E(w)}</span>`;
  return ml(_pdT('og_sg_their_name', { them }))
    + pdSgBoxHtml({ side: 'theirs', name: 'tname', value: v.name || '',
      ph: _pdT('og_sg_their_name', { them }), label: _pdT('og_sg_their_name', { them: (c && c.counterparty) || '' }) })
    + ml(_pdT('og_sg_their_email'))
    + `<input type="email" class="${PD_OG_INP}" data-pd-og-sg="temail" value="${E(v.email || '')}" placeholder="${E(_pdT('og_sg_their_email'))}" aria-label="${E(_pdT('og_sg_their_email'))}">`;
}
const PD_OG_QUOTE_MAX = 84;   // a passage drawn in the grid: about two lines of the fact's column
/* every box carries a placeholder, so an empty one is amber by :placeholder-shown (AN EMPTY OWED BOX IS AMBER EVERYWHERE) */
/* (the form's boxes carry their own inline clothes; in the grid the grid's class dresses them, so the amber can show) */
function pdOgPh(html){ return String(html).replace(/^(<(?:input|select|textarea)[^>]*?)\sstyle="[^"]*"/, '$1').replace(/^<(input)(?![^>]*\splaceholder="[^"]+")/, '<$1 placeholder=" "'); }
function pdOgBoxHtml(c, f){
  const E = _pdE;
  if (f.kind === 'kt'){
    if (f.pay) return `<button type="button" class="pd-go ds-go" data-pd-og-pay="${E(c.id)}">${E(_pdT('bs_pay_edit'))}</button>`;
    if (f.key === 'value') return `<input type="text" inputmode="numeric" class="${PD_OG_INP}" data-kt="value" value="" placeholder="${E(_pdT('og_ph_value'))}" aria-label="${E(f.label)}">`
      + `<label class="pd-og-nm"><input type="checkbox" data-kt="nonmonetary"${c.valueType === 'none' ? ' checked' : ''}> ${E(_pdT('og_no_money'))}</label>`;
    if (f.key === 'effDate') return `<input type="date" class="${PD_OG_INP}" data-kt="effDate" value="" aria-label="${E(f.label)}">`;
    return `<input type="text" class="${PD_OG_INP}" data-kt="${E(f.key)}" value="" placeholder=" " aria-label="${E(f.label)}">`;
  }
  if (f.kind === 'nda'){
    if (f.key === 'ndaDir'){
      const v = (f.read && f.read.dir) || '';
      const dirs = (typeof NDA_DIRS !== 'undefined' && NDA_DIRS) || ['mutual', 'ours', 'theirs'];
      return `<select class="${PD_OG_INP}" data-pd-og-nda="dir" aria-label="${E(f.label)}"><option value="">${E(_pdT('og_choose'))}</option>${
        dirs.map(k => `<option value="${E(k)}"${k === v ? ' selected' : ''}>${E(_pdT('nda_dir_' + k))}</option>`).join('')}</select>`;
    }
    const r = f.read || {};
    /* the NDA editor's own parts, kept (owner's picks, 17–18 Oct 2026): for good, trade secrets, and who the reminder goes to */
    const owner = (typeof contractOwnerName === 'function' && contractOwnerName(c)) || '';
    return `<input type="date" class="${PD_OG_INP}" data-pd-og-nda="ends" value="${E(r.ends || '')}"${r.forGood ? ' disabled' : ''} aria-label="${E(f.label)}">`
      + `<label class="pd-og-nm"><input type="checkbox" data-pd-og-nda="forGood"${r.forGood ? ' checked' : ''}> ${E(_pdT('nda_for_good'))}</label>`
      + `<label class="pd-og-nm"><input type="checkbox" data-pd-og-nda="trade"${r.trade ? ' checked' : ''}> ${E(_pdT('nda_trade_ck'))}</label>`
      + `<span class="pd-og-src pd-og-remind">${E(owner ? _pdT('nda_ed_remind', { who: owner }) : _pdT('nda_ed_remind_noone'))}</span>`;
  }
  if (f.kind === 'tplf'){
    const fields = (c.templateForm && c.templateForm.fields) || [];
    const idx = fields.findIndex(x => x && String(x.fieldKey) === String(f.key));
    const fd = fields[idx]; if (!fd || typeof tplFormInputHtml !== 'function') return '';
    const vals = c.templateForm.values || {};
    const put = (f.read && f.read.put && !String(vals[fd.fieldKey] || '').trim()) ? (fd.fieldType === 'number' ? String(f.read.figure) : f.read.put) : vals[fd.fieldKey];
    return pdOgPh(String(tplFormInputHtml(fd, put, idx)).replace(/^<(input|select|textarea)/, `<$1 class="${PD_OG_INP}"`));
  }
  if (f.kind === 'blank'){
    let b = null; try { b = (typeof contractBlanks === 'function') ? (contractBlanks(c) || []).find(x => x && String(x.key) === String(f.key)) : null; } catch (_){ b = null; }
    if (!b || typeof blankFormInputHtml !== 'function') return '';
    if (f.read && f.read.put && !String(b.value == null ? '' : b.value).trim()) b = Object.assign({}, b, { value: b.type === 'number' ? String(f.read.figure) : f.read.put });
    return pdOgPh(String(blankFormInputHtml(b)).replace(/^<input/, `<input class="${PD_OG_INP}"`).replace(/\splaceholder=""/, ''));
  }
  if (f.kind === 'signer'){
    const me = (typeof currentUser === 'function' && currentUser()) || null;
    const members = ((typeof getUsers === 'function' ? getUsers() : []) || []).filter(u => u && u.role !== 'viewer');
    const plan = Array.isArray(c.signerPlan) ? c.signerPlan : [];
    const ours = plan.find(s => s && s.party !== 'counterparty'), theirs = plan.find(s => s && s.party === 'counterparty');
    const pick = (ours && ours.memberId) || (me && me.id) || '';
    const them = (typeof counterpartyContact === 'function' ? counterpartyContact(c) : null) || {};
    const tName = (theirs && theirs.name) || (them.name && !(typeof signerIsCompany === 'function' && signerIsCompany(c, { party: 'counterparty', name: them.name })) ? them.name : '');
    const tMail = (theirs && theirs.email) || (typeof contactEmail === 'function' ? contactEmail(c) : '') || them.email || '';
    /* THE SAP WAY (owner picked it by name, 21 Oct 2026): a label above each of the signer's boxes,
       in the box's own words (the box keeps its aria-label, so the label is not read twice); both
       name boxes SEARCH the directory (pdSgPeople), and "+ Add another signer" adds the next one here
       rather than at the bottom of the panel — the row answers its own question. */
    const ml = w => `<span class="pd-og-ml" aria-hidden="true">${E(w)}</span>`;
    const u0 = members.find(u => String(u.id) === String(pick)) || members[0] || null;
    const ourWords = u0 ? ((u0.name || u0.email) + (me && String(u0.id) === String(me.id) ? ' · ' + _pdT('og_you') : '')) : '';
    return ml(_pdT('og_sg_ours'))
      + pdSgBoxHtml({ side: 'ours', name: 'ours', uid: u0 ? u0.id : '', value: ourWords,
        ph: _pdT('og_sg_ours'), label: _pdT('og_sg_ours') })
      + pdSgTheirHtml(c, { name: tName, email: tMail })
      + `<button type="button" class="jb-chip pd-og-sg-add" data-pd-og-sg-add>${E(_pdT('og_sg_add'))}</button>`;
  }
  return '';
}
function pdOgFromHtml(c, f){
  const E = _pdE, F = f.from || {};
  if (F.quote){
    /* the passage as said, cut at a word to two lines' worth; the whole of it on hover, and lit on the paper by the press */
    const q = String(F.quote).trim(), cut = q.length > PD_OG_QUOTE_MAX ? q.slice(0, PD_OG_QUOTE_MAX).replace(/\s+\S*$/, '') + '…' : q;
    const said = /^["“]/.test(cut) ? cut : '“' + cut + (cut.endsWith('…') ? '' : '”');
    return `<span class="pd-og-src"><button type="button" class="pd-og-cl" data-pd-og-quote="${E(q)}" title="${E(_pdT('og_show_on_paper'))}">${E(F.clause ? '§' + F.clause : _pdT('og_the_wording'))}</button> <q title="${E(q)}">${E(said)}</q></span>`;
  }
  if (F.std != null) return `<span class="pd-og-src" data-pd-ff-std>${E(_pdT('pd_ff_std', { what: F.std || _pdT('og_the_wording'), value: F.said || '' }))}</span>`;
  if (F.read) return `<span class="pd-og-src">${E(F.clause ? _pdT('det_nda_read_clause', { n: F.clause }) : _pdT('det_nda_from_wording'))}</span>`;
  if (F.spot){
    /* where it lands: the clause the blank sits under on the paper beside (pdFillSpotClause, the face's own reading) */
    let n = ''; try { const sp = (typeof contractFieldPeer === 'function') ? contractFieldPeer(f.key, 'paper') : null; n = sp ? pdFillSpotClause(sp, document.getElementById('ig-canvas')) : ''; } catch (_){ n = ''; }
    return `<span class="pd-og-src"><button type="button" class="pd-og-cl" data-pd-og-spot="${E(f.key)}" title="${E(_pdT('og_show_on_paper'))}">${E(n ? '§' + n : _pdT('og_on_paper'))}</button> ${E(n ? _pdT('og_on_paper_lc') : (f.sec || ''))}</span>`;
  }
  return `<span class="pd-og-src is-none">${E(_pdT(F.none === 'people' ? 'og_from_people' : 'og_not_in_wording'))}</span>`;
}
/* the grid; held (beside the Board) it reads only, each row a door to the paper */
function pdOgHtml(c, o){
  const held = !!(o && o.held);
  const may = (typeof canEdit !== 'function') || !!canEdit();
  const rows = pdOgFacts(c), saved = pdOgSavedOf(c).filter(x => !rows.some(r => r.key === x.key));
  const E = _pdE;
  const tr = f => {
    const box = held || !may ? `<span class="pd-og-read${f.read ? '' : ' is-amb'}">${E(f.read ? f.read.words : _pdT('og_not_read'))}</span>` : pdOgBoxHtml(c, f);
    /* THE ROW'S ONE POP-UP (owner, 21 Oct 2026): "Order the signing ›" under Confirm is the only
       door left from here to the signing route editor — the bottom "name a signer" chip went, and
       an owed fact is otherwise answered where it is asked */
    const route = (!held && may && f.kind === 'signer' && typeof openSignerPlanEditor === 'function')
      ? `<button type="button" class="pd-og-order" data-pd-og-route="${E(c.id)}">${E(_pdT('og_sg_order'))}</button>` : '';
    const act = held ? `<button type="button" class="pd-go ds-go" data-pd-og-go="${E(f.key)}" title="${E(_pdT('og_fill_beside'))}">${E(_pdT('dos_go_fill_in'))}${PD_GO_TXT}</button>`
      : (may && !f.pay) ? `<button type="button" class="pd-og-ok" data-pd-og-ok="${E(f.key)}">${E(_pdT('og_confirm'))}</button>` + route : '';
    return `<tr class="pd-og-row${f.read ? ' is-read' : ' is-amb'}" data-pd-og-row="${E(f.key)}" data-pd-og-kind="${E(f.kind)}"><td class="pd-og-f"><b>${E(f.label)}</b>${pdOgFromHtml(c, f)}</td><td class="pd-og-v">${box}</td><td class="pd-og-a">${act}</td></tr>`;
  };
  const stream = (() => { const F = (typeof FOLDERS === 'object' && FOLDERS) || {}; const n = c.folder && F[c.folder] ? F[c.folder].name : '';
    return n ? `<tr class="pd-og-row is-saved" data-pd-og-row="stream"><td class="pd-og-f"><b>${E(_pdT('ct_value_stream'))}</b><span class="pd-og-src is-none">${E(_pdT('og_stream_set'))}</span></td><td class="pd-og-v"><span class="pd-og-done">${E(n)}</span></td><td class="pd-og-a"><span class="pd-og-said">${E(_pdT('og_saved'))}</span></td></tr>` : ''; })();
  const done = saved.map(x => `<tr class="pd-og-row is-saved" data-pd-og-row="${E(x.key)}"><td class="pd-og-f"><b>${E(x.label)}</b></td><td class="pd-og-v"><span class="pd-og-done">${E(x.words)}</span></td><td class="pd-og-a"><span class="pd-og-said">${E(_pdT('og_saved'))}</span></td></tr>`).join('');
  if (!rows.length && !done) return '';
  return `<table id="${held ? 'pd-og-held' : 'pd-og'}" class="pd-og" data-pd-og-for="${E(c.id)}"><thead class="sr-only"><tr><th>${E(_pdT('og_col_fact'))}</th><th>${E(_pdT('og_col_read'))}</th><th><span class="sr-only">${E(_pdT('og_confirm'))}</span></th></tr></thead><tbody>${rows.map(tr).join('')}${done}${stream}</tbody></table>`;
}
/* the grid is up for this contract: its Dossier is the tab, beside its paper, no face over it */
function pdOgShows(c){
  if (!c || _pdTab !== 'copilot' || !pdOnPaper() || pdFaceNow()) return false;
  if (typeof pdSendShows === 'function' && pdSendShows()) return false;
  if (typeof pdTalkShows === 'function' && pdTalkShows()) return false;
  const p = pdContract(); return !!(p && String(p.id) === String(c.id));
}
/* how many rows Confirm all would store: the ones Jambo read, still unanswered */
function pdOgReadN(c){ return pdOgFacts(c).filter(f => f.read).length; }
/* ---- KEY TERMS, UNDER THE GRID (owner's pick, 20 Oct 2026: "a folded Key
   terms list shows every term with a Change on its line. The Board card's
   door opens the paper there. Nothing is typed on the Board.") ----
   The terms the Board card lists (who we are, the other party, the eight of
   the Overview's sheet — ovEssKeys — with the term as its two dates) and the
   answered facts of the grid. Change turns that one line into its box, the
   product's own (ktFieldCell's edit posture: wireKeyTerms writes it as typed;
   an NDA's facts, a template question and a blank as the grid's rows do);
   Done puts the line back. Folded until asked for; a door that asks opens it. */
let _pdKtOpen = null;           // the contract whose Key terms are unfolded
let _pdKtEdit = null;           // { id, key } — the one line being changed
function pdKtKeys(c){
  let ess = []; try { ess = (typeof ovEssKeys === 'function') ? ovEssKeys(c) : []; } catch (_){ ess = []; }
  const out = ['party', 'counterparty', 'cpEmail'];
  ess.forEach(k => { if (k === 'term') out.push('effDate', 'expiry'); else if (!out.includes(k)) out.push(k); });
  return out;
}
function pdKtFacts(c){
  if (!c) return [];
  let d = null; try { d = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ d = null; }
  const owed = new Set(((d && d.items) || []).filter(x => x && x.open).map(x => x.key));
  const rows = [];
  let N = null;
  pdKtKeys(c).forEach(k => {
    if (owed.has(k)) return;   // still owed: the grid asks it
    if (k === 'ndaDir' || k === 'ndaEnds'){
      /* what a person confirmed of this fact, else what the wording says (a half-confirmed NDA keeps the other half's reading) */
      if (!N){ const rec = (typeof ndaClean === 'function') ? ndaClean(c.nda) : null; const R = pdOgNdaRead(c) || {};
        N = { rec, R, who: rec && rec.who }; }
      const has = k === 'ndaDir' ? !!(N.rec && N.rec.dir) : !!(N.rec && (N.rec.ends || N.rec.forGood));
      const src = has ? N.rec : N.R;
      const view = { dir: src.dir || '', ends: src.forGood ? '' : (src.ends || ''), forGood: !!src.forGood, trade: !!(src.trade || (N.R && N.R.trade)), period: N.R.period, latest: N.R.latest };
      const words = k === 'ndaDir' ? (view.dir ? _pdT('nda_dir_' + view.dir) : '') : ((typeof ndaUntilWords === 'function' ? ndaUntilWords(view) : '') || '');
      const from = has ? null : (k === 'ndaDir' ? (N.R.dirQuote ? { clause: N.R.dirClause || '', quote: N.R.dirQuote } : null) : (N.R.quote ? { clause: N.R.clause || '', quote: N.R.quote } : null));
      rows.push({ key: k, kind: 'nda', label: _pdT(k === 'ndaDir' ? 'nda_f_dir' : 'nda_f_ends'), html: _pdE(words || '—'), from,
        sub: has ? (N.who ? _pdT('nda_confirmed_by', { who: N.who }) : _pdT('nda_confirmed')) : (words ? _pdT('det_nda_not_conf') : ''),
        read: { dir: view.dir, ends: view.ends, forGood: view.forGood, trade: view.trade, words } });
      return;
    }
    /* who we are and their address are the record's own boxes (wireKeyTerms), not sheet cells */
    if (k === 'party' || k === 'cpEmail'){
      const v = k === 'party' ? ((typeof contractParty === 'function' ? contractParty(c) : '') || c.party || '') : ((typeof ctTheirEmail === 'function' ? ctTheirEmail(c) : '') || '');
      rows.push({ key: k, kind: 'kt', label: _pdT(k === 'party' ? 'bs_t_our' : 'og_their_email_l'), html: _pdE(v || '—'), value: k === 'party' ? (c.party || '') : v });
      return;
    }
    let cell = null; try { cell = (typeof ktFieldCell === 'function') ? ktFieldCell(c, k, false, null) : null; } catch (_){ cell = null; }
    if (!cell) return;
    rows.push({ key: k, kind: 'ktm', label: String(cell[0] || '').replace(/<[^>]*>/g, ''), html: String(cell[1] || '').trim() || '—' });
  });
  /* the paper's own answered questions, after the record's terms */
  ((d && d.items) || []).filter(x => x && !x.open && (x.kind === 'tplf' || x.kind === 'blank')).forEach(x => {
    rows.push({ key: x.key, kind: x.kind, label: x.label, html: _pdE(pdKtAnswer(c, x) || '—') });
  });
  return rows;
}
function pdKtAnswer(c, x){
  if (x.kind === 'tplf') return String(((c.templateForm || {}).values || {})[x.key] || '');
  let b = null; try { b = (typeof contractBlanks === 'function') ? (contractBlanks(c) || []).find(y => y && String(y.key) === String(x.key)) : null; } catch (_){ b = null; }
  return b ? String(b.value == null ? '' : b.value) : '';
}
function pdKtBoxHtml(c, f){
  if (f.kind === 'nda' || f.kind === 'tplf' || f.kind === 'blank') return pdOgBoxHtml(c, f);
  if (f.kind === 'kt'){
    /* who we are: our own entities offered (the Details form's own list, uploadPartyOptions) */
    let opts = []; try { opts = (f.key === 'party' && typeof uploadPartyOptions === 'function') ? (uploadPartyOptions() || []) : []; } catch (_){ opts = []; }
    const list = opts.length ? `<datalist id="pd-kt-party-list">${opts.map(v => `<option value="${_pdE(v)}"></option>`).join('')}</datalist>` : '';
    return `<input type="${f.key === 'cpEmail' ? 'email' : 'text'}" class="${PD_OG_INP}" data-kt="${_pdE(f.key)}" value="${_pdE(f.value || '')}" aria-label="${_pdE(f.label)}"${f.key === 'party' ? ` placeholder="${_pdE((typeof contractParty === 'function' ? contractParty(c) : '') || '')}"${list ? ' list="pd-kt-party-list"' : ''}` : ''}>${list}`;
  }
  let cell = null; try { cell = (typeof ktFieldCell === 'function') ? ktFieldCell(c, f.key, true, null) : null; } catch (_){ cell = null; }
  return cell ? String(cell[1] || '') : f.html;
}
function pdKtHtml(c){
  const may = (typeof canEdit !== 'function') || !!canEdit();
  const rows = pdKtFacts(c); if (!rows.length) return '';
  const open = _pdKtOpen === String(c.id);
  const ed = (_pdKtEdit && _pdKtEdit.id === String(c.id)) ? _pdKtEdit.key : '';
  const E = _pdE;
  const tr = f => {
    const on = ed === f.key && may;
    const act = !may ? '' : on ? `<button type="button" class="pd-og-ok" data-pd-kt-done="${E(f.key)}">${E(_pdT('og_done'))}</button>`
      : `<button type="button" class="pd-og-ok" data-pd-kt-change="${E(f.key)}">${E(_pdT('og_change'))}</button>`;
    const said = (f.from ? pdOgFromHtml(c, f) : '') + (f.sub ? `<span class="pd-og-src is-none">${E(f.sub)}</span>` : '');
    return `<tr class="pd-og-row${on ? ' is-changing' : ''}" data-pd-og-row="${E(f.key)}" data-pd-og-kind="${E(f.kind)}"><td class="pd-og-f"><b>${E(f.label)}</b>${said}</td><td class="pd-og-v">${on ? pdKtBoxHtml(c, f) : `<span class="pd-kt-v">${f.html}</span>`}</td><td class="pd-og-a">${act}</td></tr>`;
  };
  return `<details id="pd-kt" class="ds-fold pd-kt" data-pd-og-for="${E(c.id)}"${open ? ' open' : ''}><summary><span>${E(_pdT('og_kt_title'))}</span><span class="ds-when">${E(_pdTn('og_kt_n', rows.length, { n: rows.length }))}</span></summary>
    <table class="pd-og pd-kt-t"><tbody>${rows.map(tr).join('')}</tbody></table></details>`;
}
/* THE DOOR ONTO THE KEY TERMS: the paper on its Dossier, the list unfolded,
   the line asked for (if any) open for changing and in the hand */
function pdKtOpen(id, key){
  _pdKtOpen = String(id);
  _pdKtEdit = key ? { id: String(id), key: String(key) } : null;
  const ok = pdOpenOnHome(id, 'plain');
  if (ok === false) return false;
  let tries = 0;
  const go = () => {
    const f = document.querySelector(`#ig-dock #pd-kt[data-pd-og-for="${CSS.escape(String(id))}"]`);
    if (!f){ if (++tries < PD_FILL_TRIES) setTimeout(go, PD_FILL_BEAT_MS); return; }
    if (!f.open) f.open = true;
    const row = key ? f.querySelector(`tr[data-pd-og-row="${CSS.escape(String(key))}"]`) : null;
    if (typeof landOn === 'function') landOn(row || f, { block: 'center', focus: false });
    const box = row && row.querySelector('input:not([type=checkbox]):not([disabled]), select, textarea');
    if (box) try { box.focus({ preventScroll: true }); } catch (_){}
  };
  setTimeout(go, PD_FILL_BEAT_MS);
  return true;
}
/* ---- THE GRID'S PRESSES (bound once, on the document; the live row and
   the live contract are read at the press) ---- */
let _pdOgPending = false;       // a repaint asked for while a hand was in the grid
function pdOgHost(){ return (typeof document !== 'undefined') ? document.getElementById('pd-og') : null; }
/* the grid, or the Key terms under it: both hold rows the same presses answer */
function pdOgHostOf(el){ return el && el.closest ? el.closest('#pd-og, #pd-kt') : null; }
function pdOgContract(host){
  const h = host || pdOgHost(); const id = h && h.getAttribute('data-pd-og-for'); if (!id) return null;
  const c = pdContract(); if (!c || String(c.id) !== String(id)) return null;
  return (typeof getContract === 'function' && getContract(c.id)) || c;
}
/* the boxes' own writers, bound once per grid drawn */
function pdOgWire(host, c){
  if (!host || !c || host.dataset.pdOgWired) return;
  host.dataset.pdOgWired = '1';
  try { if (typeof wireKeyTerms === 'function') wireKeyTerms(c); } catch (_){}
  try { if (typeof wireBlankForm === 'function') wireBlankForm(c, host); } catch (_){}
}
/* a hand in the grid is never repainted under (renderIntelDock asks this too) */
function pdOgHolds(){
  const a = (typeof document !== 'undefined') ? document.activeElement : null;
  return !!(a && a.closest && a.closest('#ig-dock #pd-og, #ig-dock #pd-kt'));
}
/* after the grid is drawn: HaTi's own date and choice faces, and the boxes' writers */
function pdOgPaint(host){
  const hs = host ? [host] : ['pd-og', 'pd-kt'].map(id => document.getElementById(id)).filter(Boolean);
  hs.forEach(h => {
    if (h.dataset.pdOgDressed) return;
    h.dataset.pdOgDressed = '1';
    try { if (typeof popupControlsDress === 'function') popupControlsDress(h); } catch (_){}
    const c = pdOgContract(h); if (c) pdOgWire(h, c);
  });
}
function pdOgRepaint(){
  _pdOgPending = false;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#pd-og, #pd-kt') && typeof a.blur === 'function') a.blur();
  pdGlanceRepaint();
  try { pdFillPaperMarks(pdContract()); } catch (_){}
}
/* the next row still owed takes the hand (EVERY STEP STARTS THE NEXT) */
function pdOgNext(after){
  const host = pdOgHost(); if (!host) return;
  const rows = [...host.querySelectorAll('tr.pd-og-row:not(.is-saved)')];
  const r = rows.find(x => x.getAttribute('data-pd-og-row') !== after) || null;
  const box = r && r.querySelector('input:not([type=checkbox]):not([disabled]), select, textarea');
  if (box) try { box.focus({ preventScroll: true }); } catch (_){}
}
function pdOgSay(msg, kind){ if (typeof toast === 'function') toast(msg, kind || 'warn'); }
/* STORE ONE ROW through its own writer; false (and why, said) when it cannot */
function pdOgConfirm(c, key, o){
  const inKt = !!(o && o.kt);
  const host = inKt ? document.getElementById('pd-kt') : pdOgHost(); if (!host || !c) return false;
  const row = host.querySelector(`tr[data-pd-og-row="${CSS.escape(String(key))}"]`); if (!row) return false;
  /* a box left (Tab) has already stored its answer, so the row's fact may no
     longer be owed: the row itself says what it was, and Confirm ticks it */
  const f = (inKt ? pdKtFacts(c) : pdOgFacts(c)).find(x => x.key === key)
    || { key, kind: row.getAttribute('data-pd-og-kind') || '', label: ((row.querySelector('.pd-og-f b') || {}).textContent || key).trim() };
  pdOgWire(host, c);
  const ask = el => { if (!(o && o.quiet)){ pdOgSay(_pdT('og_type_first', { what: f.label })); if (el) try { el.focus(); } catch (_){} } return false; };
  let words = '';
  if (f.kind === 'kt'){
    const nm = row.querySelector('[data-kt="nonmonetary"]');
    if (f.key === 'value' && nm && nm.checked){ if (c.valueType !== 'none'){ nm.dispatchEvent(new Event('change', { bubbles: true })); } words = _pdT('og_no_money'); }
    else {
      const el = row.querySelector('[data-kt]'); const v = el ? String(el.value || '').trim() : '';
      if (!v) return ask(el);
      el.dispatchEvent(new Event(el.type === 'date' ? 'change' : 'input', { bubbles: true }));
      words = f.key === 'value' ? ((typeof fmtMoneyOf === 'function') ? fmtMoneyOf(c) : v) : el.type === 'date' ? pdOgDay(v) : v;
    }
  } else if (f.kind === 'blank' || f.kind === 'tplf'){
    const el = row.querySelector('[data-blankf],[data-tplf]'); const v = el ? String(el.value || '').trim() : '';
    if (!v) return ask(el);
    el.dispatchEvent(new Event('change', { bubbles: true }));
    words = el.type === 'date' ? pdOgDay(v) : (el.tagName === 'SELECT' && el.selectedOptions[0] ? el.selectedOptions[0].textContent : v);
  } else if (f.kind === 'nda'){
    if (typeof ndaSet !== 'function') return false;
    const base = Object.assign({ dir: '', ends: '', forGood: false, trade: false, clause: '' }, (typeof ndaFacts === 'function' && ndaFacts(c.nda)) || {});
    const N = pdOgNdaRead(c) || {};
    let v;
    if (f.key === 'ndaDir'){ const el = row.querySelector('[data-pd-og-nda="dir"]'); const d = el ? el.value : '';
      if (!d) return ask(el);
      v = Object.assign(base, { dir: d }); words = _pdT('nda_dir_' + d); }
    else { const el = row.querySelector('[data-pd-og-nda="ends"]'), fg = row.querySelector('[data-pd-og-nda="forGood"]');
      const good = !!(fg && fg.checked), day = el ? el.value : '';
      if (!good && !day) return ask(el);
      const tr = row.querySelector('[data-pd-og-nda="trade"]');
      v = Object.assign(base, { ends: good ? '' : day, forGood: good, trade: tr ? !!tr.checked : (base.trade || !!N.trade), clause: base.clause || N.clause || '' });
      words = good ? _pdT('nda_for_good') : pdOgDay(day); }
    const r = ndaSet(c, v) || {};
    if (r.err){ pdOgSay(r.err, 'err'); return false; }
  } else if (f.kind === 'signer'){
    if (typeof saveSignerPlan !== 'function') return false;
    /* OUR SIGNER is the person the search box picked (its id), or — typed by hand — the
       colleague whose name or address it names; THEIR SIGNERS are the name/address pairs
       in the row, in order, however many "+ Add another signer" drew. */
    const sel = row.querySelector('[data-pd-og-sg="ours"]');
    const names = [...row.querySelectorAll('[data-pd-og-sg="tname"]')];
    const mails = [...row.querySelectorAll('[data-pd-og-sg="temail"]')];
    const uid = sel ? String(sel.getAttribute('data-og-id') || sel.value || '').trim() : '';
    let u = uid && typeof userById === 'function' ? userById(uid) : null;
    if (!u && sel && String(sel.value || '').trim() && typeof getUsers === 'function'){
      const w = _pdSgFold(String(sel.value).split(' · ')[0]);
      u = (getUsers() || []).find(x => x && x.role !== 'viewer' && (_pdSgFold(x.name) === w || _pdSgFold(x.email) === w)) || null;
    }
    if (!u){ if (sel && String(sel.value || '').trim() && !(o && o.quiet)) pdOgSay(_pdT('og_sg_pick_ours')); return ask(sel); }
    const theirs = names.map((tn, i) => ({ name: String(tn.value || '').trim(), email: mails[i] ? String(mails[i].value || '').trim() : '' }))
      .filter(x => x.name);
    if (!theirs.length) return ask(names[0]);
    const plan = (Array.isArray(c.signerPlan) ? c.signerPlan : []).slice();
    const keep = plan.filter(x => x && x.name);
    if (!keep.some(x => x.party !== 'counterparty')) keep.push({ party: 'internal', name: u.name || u.email, email: u.email || '', role: (typeof signerTitle === 'function' ? signerTitle(u) : '') || '', memberId: u.id });
    theirs.forEach(t => { if (!keep.some(x => x.party === 'counterparty' && _pdSgFold(x.name) === _pdSgFold(t.name)))
      keep.push({ party: 'counterparty', name: t.name, email: t.email, role: '' }); });
    const why = saveSignerPlan(c, keep);
    if (why){ pdOgSay(why, 'err'); return false; }
    words = [u.name || u.email].concat(theirs.map(t => t.name)).join(' · ');
  } else return false;
  if (!inKt) pdOgSavedAdd(c, f, words);
  try { if (typeof detailsChanged === 'function') detailsChanged(c); } catch (_){}
  if (!(o && o.hold)){ pdOgRepaint(); pdOgNext(key); }
  return true;
}
/* FILL THE DOCUMENT: the box still under the hand is stored first (its own
   writer), then the answers go into the wording (tplFormApply) — done on the
   press's way DOWN, because storing the box repaints the dossier and a click
   whose button was redrawn between down and up is dropped (the form's own
   rule, renderTemplateFormSection's) */
let _pdOgDocDown = false;
function pdOgDocFill(){
  const c = pdContract(); const live = c && ((typeof getContract === 'function' && getContract(c.id)) || c);
  if (!live || typeof tplFormApply !== 'function') return false;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#pd-og, #pd-kt') && a.hasAttribute('data-tplf') && typeof tplFormCommit === 'function') tplFormCommit(live, Number(a.getAttribute('data-tplf')), a.value);
  tplFormApply(live);
  try { if (typeof detailsChanged === 'function') detailsChanged(live); } catch (_){}
  pdOgRepaint();
  if (typeof igPaperRefresh === 'function') try { igPaperRefresh(); } catch (_){}
  return true;
}
/* Done on a changed line: an NDA's fact, a template question or a blank is
   stored as the grid stores it; a record term was stored as it was typed */
function pdKtDone(c, key){
  const f = pdKtFacts(c).find(x => x.key === key);
  if (f && (f.kind === 'nda' || f.kind === 'tplf' || f.kind === 'blank')){
    if (!pdOgConfirm(c, key, { kt: true, hold: true })) return false;
  } else {
    const a = document.activeElement;
    if (a && a.closest && a.closest('#pd-kt') && typeof a.blur === 'function') a.blur();
  }
  _pdKtEdit = null;
  pdOgRepaint();
  if (typeof toast === 'function') toast(f && f.kind === 'nda' ? _pdT('nda_saved') : _pdT('og_kt_saved', { what: f ? f.label : '' }), 'ok');
  return true;
}
/* ---- THE QUIET LIST UNDER A SIGNER BOX ----
   It FLOATS over the rows under it — the rows below never move — and is flipped ABOVE
   the box where the panel has no room under it (a row near the foot). HaTi's own list
   dress (.hati-selmenu's white, hairline, radius-lg). Built on a press and on typing,
   taken down by a press outside, by Esc and by a pick; never in the markup at rest, so
   a row at rest measures exactly as it did. Nothing here writes to the record. */
const PD_SG_MAX = 24;            // rows built at once; the list stands five tall and scrolls
function pdSgRowHtml(p, on){
  const E = _pdE;
  const sub = p.sub ? `<span class="pd-og-dd-sub"> · ${E(p.sub)}</span>` : '';
  const you = p.you ? `<span class="pd-og-dd-sub"> · ${E(_pdT('og_you'))}</span>` : '';
  const mail = p.email && _pdSgFold(p.email) !== _pdSgFold(p.name) ? `<span class="pd-og-dd-e">${E(p.email)}</span>` : '';
  return `<button type="button" role="option" aria-selected="${on ? 'true' : 'false'}" class="pd-og-dd-row${on ? ' on' : ''}"`
    + ` data-pd-og-pick="${E(p.name)}" data-og-mail="${E(p.email)}" data-og-uid="${E(p.id || '')}">`
    + `<span class="pd-og-av" aria-hidden="true">${E(pdSgInitials(p.name, p.email))}</span>`
    + `<span class="pd-og-dd-t"><span class="pd-og-dd-n"><b>${E(p.name)}</b>${sub}${you}</span>${mail}</span></button>`;
}
let _pdSgUp = false;             // a list is up somewhere: a press elsewhere need not look
function pdSgListClose(){
  if (typeof document === 'undefined' || !_pdSgUp) return;
  _pdSgUp = false;
  [...document.querySelectorAll('#ig-dock #pd-og .pd-og-dd')].forEach(el => {
    const box = el.parentNode && el.parentNode.querySelector('[data-pd-og-sb]');
    if (box) box.setAttribute('aria-expanded', 'false');
    el.remove();
  });
}
function pdSgListShowing(box){ const w = box && box.closest ? box.closest('.pd-og-sb') : null; return !!(w && w.querySelector('.pd-og-dd')); }
function pdSgListOpen(box){
  if (!box || !box.closest) return false;
  const wrap = box.closest('.pd-og-sb'); if (!wrap) return false;
  pdSgListClose();
  const c = pdOgContract(pdOgHostOf(box)); if (!c) return false;
  const picked = box.getAttribute('data-og-picked') || '', typed = String(box.value || '');
  /* a box still holding the person it was filled with lists everybody, so the reader can change it */
  const q = (picked && _pdSgFold(typed) === _pdSgFold(picked)) ? '' : typed;
  const rows = pdSgMatches(pdSgPeople(c, box.getAttribute('data-pd-og-sb')), q);
  if (!rows.length) return false;
  const el = document.createElement('div');
  el.className = 'pd-og-dd'; el.setAttribute('role', 'listbox'); el.setAttribute('aria-label', _pdT('og_sg_list'));
  el.innerHTML = rows.slice(0, PD_SG_MAX).map((p, i) => pdSgRowHtml(p, i === 0)).join('');
  wrap.appendChild(el);
  _pdSgUp = true;
  box.setAttribute('aria-expanded', 'true');
  const feed = box.closest('#igd-feed') || box.closest('#ig-dock');
  const fr = feed ? feed.getBoundingClientRect() : null;
  const br = box.getBoundingClientRect(), h = el.offsetHeight;
  const floor = Math.min(window.innerHeight, fr ? fr.bottom : window.innerHeight);
  const roof = Math.max(0, fr ? fr.top : 0);
  if (floor - br.bottom < h + 8 && br.top - roof > h + 8) el.classList.add('is-up');
  return true;
}
/* their signer's own address box: the one after this search box, before the next signer's */
function pdSgMailFor(box){
  const wrap = box && box.closest ? box.closest('.pd-og-sb') : null;
  let n = wrap ? wrap.nextElementSibling : null;
  while (n){
    if (n.matches && n.matches('[data-pd-og-sg="temail"]')) return n;
    if (n.matches && n.matches('.pd-og-sb')) return null;
    n = n.nextElementSibling;
  }
  return null;
}
/* A PICK FILLS THE NAME AND THE ADDRESS TOGETHER (the owner's ask). Nothing is filed:
   the row's Confirm is still what reaches saveSignerPlan. */
function pdSgPick(btn){
  const wrap = btn && btn.closest ? btn.closest('.pd-og-sb') : null;
  const box = wrap && wrap.querySelector('[data-pd-og-sb]'); if (!box) return false;
  const name = btn.getAttribute('data-pd-og-pick') || '', mail = btn.getAttribute('data-og-mail') || '';
  box.value = name;
  box.setAttribute('data-og-picked', name);
  box.setAttribute('data-og-id', btn.getAttribute('data-og-uid') || '');
  if (box.getAttribute('data-pd-og-sb') === 'theirs' && mail){ const mb = pdSgMailFor(box); if (mb) mb.value = mail; }
  pdSgListClose();
  try { box.focus({ preventScroll: true }); } catch (_){}
  return true;
}
function pdSgStep(box, by){
  const wrap = box.closest('.pd-og-sb'), el = wrap && wrap.querySelector('.pd-og-dd'); if (!el) return false;
  const rows = [...el.querySelectorAll('.pd-og-dd-row')]; if (!rows.length) return false;
  let i = rows.findIndex(r => r.classList.contains('on')); i = Math.max(0, Math.min(rows.length - 1, (i < 0 ? 0 : i) + by));
  rows.forEach(r => { r.classList.remove('on'); r.setAttribute('aria-selected', 'false'); });
  rows[i].classList.add('on'); rows[i].setAttribute('aria-selected', 'true');
  try { rows[i].scrollIntoView({ block: 'nearest' }); } catch (_){}
  return true;
}
if (typeof document !== 'undefined' && !document._pdOgWired){
  document._pdOgWired = true;
  /* THE LIST ANSWERS THE KEYBOARD FIRST (capture, ahead of the row's own Enter = Confirm):
     ↑↓ walk it, Enter picks the lit row, Esc takes it down and only it */
  document.addEventListener('keydown', e => {
    const t = e.target;
    const box = t && t.closest ? t.closest('#ig-dock #pd-og [data-pd-og-sb]') : null; if (!box) return;
    const up = pdSgListShowing(box);
    if (e.key === 'Escape'){ if (!up) return; pdSgListClose(); e.stopPropagation(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      if (!up){ if (e.key === 'ArrowDown') pdSgListOpen(box); } else pdSgStep(box, e.key === 'ArrowDown' ? 1 : -1);
      e.preventDefault(); e.stopPropagation(); return;
    }
    if (e.key === 'Enter' && up && !e.isComposing){
      const lit = box.closest('.pd-og-sb').querySelector('.pd-og-dd-row.on');
      if (lit){ pdSgPick(lit); e.preventDefault(); e.stopPropagation(); }
    }
  }, true);
  /* a press inside the list keeps the hand in the box (so no repaint lands under it) */
  document.addEventListener('pointerdown', e => {
    const t = e.target;
    if (t && t.closest && t.closest('#ig-dock #pd-og .pd-og-dd')){ e.preventDefault(); return; }
    if (t && t.closest && t.closest('#ig-dock #pd-og .pd-og-sb')) return;
    pdSgListClose();
  }, true);
  /* TYPING FILTERS: the list is rebuilt under the box, and a name typed over a picked
     person is no longer that person */
  document.addEventListener('input', e => {
    const box = e.target && e.target.closest ? e.target.closest('#ig-dock #pd-og [data-pd-og-sb]') : null; if (!box) return;
    box.setAttribute('data-og-id', '');
    box.setAttribute('data-og-picked', '');
    if (!pdSgListOpen(box)) pdSgListClose();
  });
  document.addEventListener('focusin', e => {
    const host = pdOgHostOf(e.target); if (!host) return;
    const c = pdOgContract(host); if (c) pdOgWire(host, c);
    /* THE SAP WAY puts a row's label and Confirm ABOVE its box: a hand in a box sees what it answers, so the
       row's head is brought into view by the least scroll (else a Tab onto Confirm would jump the panel) */
    const tr = host.id === 'pd-og' && e.target.closest('td.pd-og-v') ? e.target.closest('tr[data-pd-og-row]') : null;
    const feed = tr && tr.closest('#igd-feed');
    if (tr && feed){
      const fr = feed.getBoundingClientRect(), rr = tr.getBoundingClientRect();
      if (rr.top < fr.top && rr.height <= fr.height) feed.scrollTop -= Math.ceil(fr.top - rr.top);
    }
    /* A CURSOR IN A BOX LIGHTS ITS WORD ON THE PAPER (the fill form's own rule, wireFieldLink's) */
    if (c && typeof contractFieldKeyOf === 'function' && typeof contractFieldLight === 'function'){
      let k = ''; try { k = contractFieldKeyOf(e.target, c) || ''; } catch (_){ k = ''; }
      if (!k){ const r = e.target.closest('tr[data-pd-og-row]'); k = r ? r.getAttribute('data-pd-og-row') : ''; }
      let spot = null; try { spot = k && typeof contractFieldPeer === 'function' ? contractFieldPeer(k, 'paper') : null; } catch (_){ spot = null; }
      if (spot) contractFieldLight(spot); else if (typeof contractFieldUnlight === 'function') contractFieldUnlight();
    }
  });
  /* a hand leaving the grid lets a repaint asked for meanwhile happen */
  document.addEventListener('focusout', e => {
    if (pdOgHostOf(e.target) && typeof contractFieldUnlight === 'function') setTimeout(() => { if (!pdOgHolds()) contractFieldUnlight(); }, 0);
    if (!_pdOgPending || !pdOgHostOf(e.target)) return;
    setTimeout(() => { if (!pdOgHolds() && _pdOgPending) pdOgRepaint(); }, 0);
  });
  document.addEventListener('change', e => {
    const t = e.target; const h = pdOgHostOf(t); if (!h) return;
    const c = pdOgContract(h); if (!c) return;
    /* a template question's own writer (the Complete-details page's, as there) */
    if (t.hasAttribute('data-tplf') && typeof tplFormCommit === 'function'){ tplFormCommit(c, Number(t.getAttribute('data-tplf')), t.value); try { detailsChanged(c); } catch (_){} }
    if (t.getAttribute('data-pd-og-nda') === 'forGood'){ const d = t.closest('tr').querySelector('[data-pd-og-nda="ends"]'); if (d) d.disabled = t.checked; return; }
    /* an answer stored as the box is left: the dossier is drawn again once the hand leaves the grid (pdGlanceRepaint waits for it) */
    /* asked after the press that left the box has moved the hand (a click on the next box must land on it) */
    if (t.matches('[data-kt],[data-ktm],[data-blankf],[data-tplf]')){ _pdOgPending = true; setTimeout(() => { if (_pdOgPending && !pdOgHolds()) pdOgRepaint(); }, 0); }
  });
  document.addEventListener('toggle', e => {
    const f = e.target; if (!(f && f.id === 'pd-kt')) return;
    _pdKtOpen = f.open ? f.getAttribute('data-pd-og-for') : null;
    if (!f.open && _pdKtEdit) _pdKtEdit = null;
  }, true);
  /* WHAT A BOX HOLDS SHOWS ON THE PAPER AS IT IS TYPED (display only; the box's own writer stores it — the face's rule, pdFillEcho) */
  document.addEventListener('input', e => {
    const t = e.target; if (!pdOgHostOf(t)) return;
    const c = pdOgContract(pdOgHostOf(t)); if (!c) return;
    const k = pdFillKeyOf(t, c); if (k) pdFillEcho(k, t.value);
  });
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const b = e.target && e.target.closest ? e.target.closest('#ig-dock #pd-needs [data-pd-og-docfill]') : null;
    if (!b || b.disabled || b.closest('[data-pd-held-dossier]')) return;
    e.preventDefault(); _pdOgDocDown = true; setTimeout(() => { _pdOgDocDown = false; }, 1500);
    pdOgDocFill();
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const t = e.target; if (!t || !t.closest || t.tagName === 'TEXTAREA') return;
    const row = t.closest('#pd-og tr[data-pd-og-row], #pd-kt tr.is-changing[data-pd-og-row]'); if (!row) return;
    e.preventDefault(); const kt = !!row.closest('#pd-kt'); const c = pdOgContract(pdOgHostOf(row)); if (!c) return;
    if (kt) pdKtDone(c, row.getAttribute('data-pd-og-row')); else pdOgConfirm(c, row.getAttribute('data-pd-og-row'));
  });
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#ig-dock')) return;
    /* ---- THE SIGNER ROW'S OWN PRESSES (21 Oct 2026) ---- */
    const pick = t.closest('#pd-og .pd-og-dd-row');
    if (pick){ e.preventDefault(); pdSgPick(pick); return; }
    const sb = t.closest('#pd-og [data-pd-og-sb]');
    /* ONE LIST PER PRESS, AND THE SAME PRESS TAKES IT DOWN (there is no system picker
       behind it any more: the box is a typing box, not a <select>) */
    if (sb){ if (pdSgListShowing(sb)) pdSgListClose(); else pdSgListOpen(sb); return; }
    const addSg = t.closest('#pd-og [data-pd-og-sg-add]');
    if (addSg){ e.preventDefault(); const c = pdOgContract(); const v = addSg.closest('td.pd-og-v'); if (!c || !v) return;
      pdSgListClose();
      addSg.insertAdjacentHTML('beforebegin', pdSgTheirHtml(c, {}));
      const box = [...v.querySelectorAll('[data-pd-og-sg="tname"]')].pop();
      if (box) try { box.focus({ preventScroll: true }); } catch (_){}
      return; }
    /* THE ROW'S ONE POP-UP: the signing route, over this page, landing back on the row */
    const rt = t.closest('#pd-og [data-pd-og-route]');
    if (rt){ e.preventDefault(); const c = pdOgContract(); if (!c || typeof openSignerPlanEditor !== 'function') return;
      const id = c.id; pdSgListClose();
      openSignerPlanEditor((typeof getContract === 'function' && getContract(id)) || c,
        { onDone(){ pdOgRepaint(); pdOgLand(id, 'signers'); } });
      return; }
    const ok = t.closest('#pd-og [data-pd-og-ok]');
    if (ok){ e.preventDefault(); const c = pdOgContract(); if (c) pdOgConfirm(c, ok.getAttribute('data-pd-og-ok')); return; }
    if (t.closest('[data-pd-og-all]') && !t.closest('[data-pd-held-dossier]')){ e.preventDefault(); const c = pdOgContract(); if (!c) return;
      const keys = pdOgFacts(c).filter(f => f.read).map(f => f.key);
      let n = 0; keys.forEach(k => { if (pdOgConfirm(c, k, { quiet: true, hold: true })) n++; });
      pdOgRepaint(); pdOgNext('');
      if (n) pdOgSay(_pdTn('og_confirmed_n', n, { n }), 'ok');
      return; }
    const q = t.closest('#pd-og [data-pd-og-quote], #pd-kt [data-pd-og-quote]');
    if (q){ e.preventDefault(); if (typeof igQuoteGo === 'function') igQuoteGo(q.getAttribute('data-pd-og-quote')); return; }
    const sp = t.closest('#pd-og [data-pd-og-spot]');
    if (sp){ e.preventDefault(); let el = null; try { el = (typeof contractFieldPeer === 'function') ? contractFieldPeer(sp.getAttribute('data-pd-og-spot'), 'paper') : null; } catch (_){ el = null; }
      if (el && typeof landOn === 'function') landOn(el, { block: 'center', focus: false }); else pdOgSay(_pdT('og_not_on_paper'));
      return; }
    const ch = t.closest('#pd-kt [data-pd-kt-change]');
    if (ch){ e.preventDefault(); const c = pdOgContract(pdOgHostOf(ch)); if (!c) return; pdKtOpen(c.id, ch.getAttribute('data-pd-kt-change')); pdOgRepaint(); return; }
    const dn = t.closest('#pd-kt [data-pd-kt-done]');
    if (dn){ e.preventDefault(); const c = pdOgContract(pdOgHostOf(dn)); if (c) pdKtDone(c, dn.getAttribute('data-pd-kt-done')); return; }
    const df = t.closest('#pd-needs [data-pd-og-docfill]');
    if (df && !t.closest('[data-pd-held-dossier]')){ e.preventDefault(); if (_pdOgDocDown){ _pdOgDocDown = false; return; } pdOgDocFill(); return; }
    const pay = t.closest('#pd-og [data-pd-og-pay], #pd-kt [data-pd-og-pay]');
    if (pay){ e.preventDefault(); if (typeof payEditOpen === 'function') payEditOpen(pay.getAttribute('data-pd-og-pay')); return; }
  });
}
/* LAND ON THE ROW (every Fill in door since the face retired): the paper on
   the Dossier, the grid's row brought into view and lit, its box in the hand
   — bounded, because the dossier is painted by the render the landing asks for */
let _pdOgLand = null;
function pdOgLand(id, key){
  _pdOgLand = { id: String(id), key: key ? String(key) : '' };
  let tries = 0;
  const go = () => {
    const want = _pdOgLand; if (!want) return;
    const host = pdOgHost();
    if (host && host.getAttribute('data-pd-og-for') === want.id){
      _pdOgLand = null;
      const q = want.key ? `tr[data-pd-og-row="${CSS.escape(want.key)}"]:not(.is-saved)` : 'tr.pd-og-row:not(.is-saved)';
      /* a fact already answered is changed on its Key terms line, not the first owed row */
      if (want.key && !host.querySelector(q)){ const c = pdOgContract(host);
        if (c && pdKtFacts(c).some(f => f.key === want.key)){ pdKtOpen(want.id, want.key); return; } }
      const row = host.querySelector(q) || host.querySelector('tr.pd-og-row:not(.is-saved)');
      if (!row) return;
      if (typeof landOn === 'function') landOn(row, { block: 'center', focus: false });
      const box = row.querySelector('input:not([type=checkbox]):not([disabled]), select, textarea');
      if (box) try { box.focus({ preventScroll: true }); } catch (_){}
      return;
    }
    /* nothing owed any more: the Still owed card itself */
    const card = document.querySelector(`#ig-dock #pd-needs[data-pd-needs-for="${CSS.escape(want.id)}"]`);
    if (card && !host){ _pdOgLand = null;
      const c = pdContract();
      if (want.key && c && String(c.id) === want.id && pdKtFacts(c).some(f => f.key === want.key)){ pdKtOpen(want.id, want.key); return; }
      if (typeof landOn === 'function') landOn(card, { block: 'nearest', focus: false }); return; }
    if (++tries < PD_FILL_TRIES) setTimeout(go, PD_FILL_BEAT_MS); else _pdOgLand = null;
  };
  setTimeout(go, PD_FILL_BEAT_MS);
}
function pdGlanceHtml(c, o){
  if (!c) return '';
  const D = dossierOf(c);
  /* A PRIVATE CONTRACT SAYS WHO MAY OPEN IT, beside the paper too (the Board card's own row, bsPrivateOf; the Fill in face said it) */
  let P = null; try { P = (!(o && o.held) && typeof bsPrivateOf === 'function') ? bsPrivateOf(c) : null; } catch (_){ P = null; }
  const priv = P ? `<div class="pd-glance ds-card ds-private" data-pd-ds-card="private"><div class="pd-gl-b">${pdCardGlanceRowHtml(c, { k: 'private', P })}</div></div>` : '';
  return `<div id="pd-glance" class="pd-dossier" data-pd-glance-for="${_pdE(c.id)}">${priv}${dossierSpineHtml(D)}${dossierReadHtml(c, D)}${dossierOwedHtml(c, D, o)}${(o && o.held) ? '' : pdKtHtml(c)}</div>`;
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
    if (r.k === 'move') return _pdT('pd_gl_your_move');
    if (r.kind === 'ask') return _pdT('pd_gl_their_ask');
    if (r.k === 'sign') return _pdT('pd_gl_signers_sub');
    if (r.k === 'scan') return _pdT('pd_gl_scan_cost');
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
  /* A BUTTON THAT SAYS WHAT IT OPENS (owner, 20 Oct 2026: "the highlighted
     'the brief' should be a button called Contract Briefing"): the label is a
     button onto the brief (the same door, openCheckPanel), its first lines under it */
  return `<div class="pd-gl-brief"><button type="button" class="ui-btn ui-btn-sm pd-gl-brief-b" data-pd-gl-brief>${_pdE(_pdT('pd_gl_brief_btn'))}</button><span title="${_pdE(t)}">${_pdE(t)}</span></div>`;
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
function pdNeedsRows(c, o){
  const rows = []; if (!c) return rows;
  /* the details owed are the glance's row beside a paper; where no glance
     stands (a paper chosen on the wall, round 13) they are a row here */
  const keepDetails = !!(o && o.details);
  let A = null; try { A = (typeof hbAgentsData === 'function') ? hbAgentsData(null) : null; } catch (_){ A = null; }
  ((A && A.rows) || []).forEach(r => (r.items || []).forEach(it => {
    if (it && String(it.cid) === String(c.id)) rows.push({ jw: true, k: r.k, key: it.key, sum: it.sum || '', urg: it.urg || '' }); }));
  let L = []; try { L = (typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []; } catch (_){ L = []; }
  L = L.filter(it => it && (keepDetails || it.kind !== 'details'));
  /* THEIR REDLINES are owed after the desk's quiet standard (the owner's
     answer of 18 Oct 2026: "after 5 quiet days, unchanged"): needsYouOf's own
     'quiet' row, the same that the checklist, the bell and Home count — never
     a row of this panel's own before it */
  const rank = k => { const o = (typeof NEEDS_YOU_ORDER !== 'undefined' && NEEDS_YOU_ORDER) || []; const i = o.indexOf(k); return i < 0 ? 99 : i; };
  L.map((it, i) => ({ it, i })).sort((x, y) => (Number(!!y.it.urgent) - Number(!!x.it.urgent)) || (rank(x.it.kind) - rank(y.it.kind)) || (x.i - y.i))
    .forEach(o => rows.push({ it: o.it }));
  return rows;
}
/* ---- A NOTE OF YOURS DUE ON THIS CONTRACT (round 3 as drawn: "1 note due
   today · “Check Nordvik's insurance broker.” · only you · Open note") ----
   My notes' own reading (mineNotesDue — the rail's count and the bell's),
   narrowed to the paper in front. PRIVATE: the store answers only for the
   person signed in (/api/me/items), so only the note's owner ever sees the
   row. Loaded once if this sitting has not loaded it yet, then the card is
   painted again in place. Reading writes nothing. */
let _pdMineAsked = false;
function pdNoteRows(c){
  if (!c || typeof mineNotesDue !== 'function') return [];
  if (typeof mineLoaded === 'function' && !mineLoaded()){
    if (!_pdMineAsked && typeof mineLoad === 'function'){ _pdMineAsked = true;
      Promise.resolve(mineLoad()).then(() => { try { pdNeedsRepaint(); } catch (_){} }, () => {}); }
    return [];
  }
  let due = []; try { due = (mineNotesDue() || []).filter(n => n && String(n.contractId || '') === String(c.id)); } catch (_){ due = []; }
  if (!due.length) return [];
  due.sort((a, b) => String(a.reviewBy || '').localeCompare(String(b.reviewBy || '')));
  const today = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  return [{ note: true, n: due.length, first: due[0], late: String(due[0].reviewBy || '') < today }];
}
/* the clause numbers their waiting asks are on ("clauses 7 and 11"), or '' */
function pdAskClausesSay(c){
  const nums = []; let all = true;
  pdTheirAsks(c).forEach(ch => { let n = ''; try { n = String(((typeof clauseParseHeading === 'function') ? clauseParseHeading(String(ch.clauseLabel || '')) : {}).num || '').replace(/[.\s]+$/, ''); } catch (_){ n = ''; }
    if (!n) all = false; else if (!nums.includes(n)) nums.push(n); });
  if (!nums.length || !all) return '';
  const list = nums.length > 1 ? nums.slice(0, -1).join(', ') + ' ' + _pdT('pd_nd_and') + ' ' + nums[nums.length - 1] : nums[0];
  return _pdTn('pd_nd_clause', nums.length, { list });
}
/* ---- JAMBO'S WORK HERE, IN THE DRAWING'S WORDS (round 3 as drawn: "Jambo's
   work · Nordvik's answer" over "Prepared overnight: a counter on each
   redline", whole) ----
   Their round came back is named by whose answer it is (the party's first
   word, as the paper's line and the desk say it), and its line says when it
   was prepared — the answers are made as their round arrives (runRoundPrep),
   so the day their asks came is the day — and what: an answer to each
   redline, to some of them, or, where Jambo answered none, the quick
   reading's tally. Every word is read off the agent's own piece
   (agRoundItems); nothing is written. Other agents keep their own name and
   line. */
function pdPartyShort(name){
  const w = String(name || '').trim().split(/\s+/).filter(Boolean);
  const i = w.length > 1 && /^(the|den|det|de)$/i.test(w[0]) ? 1 : 0;
  return (w[i] || '').replace(/[,.;:]+$/, '');
}
function pdPreparedWhen(iso){
  const t = Date.parse(String(iso || '')); if (!isFinite(t)) return '';
  const d = new Date(t), now = new Date(), day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const gap = Math.round((day(now) - day(d)) / 864e5);
  if (gap === 0) return d.getHours() < 6 ? _pdT('pd_nd_jw_overnight') : _pdT('pd_nd_jw_today');
  if (gap === 1 && d.getHours() >= 18) return _pdT('pd_nd_jw_overnight');
  if (gap === 1) return _pdT('pd_nd_jw_yesterday');
  let on = ''; try { on = d.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { day: 'numeric', month: 'short' }); } catch (_){ on = ''; }
  return _pdT('pd_nd_jw_on', { day: on });
}
function pdJwSay(c, r){
  if (!c || !r || r.k !== 'round' || typeof agentsData !== 'function') return null;
  let it = null; try { const D = agentsData(); it = ((D && D.agents && D.agents.round && D.agents.round.ready) || []).find(x => x && String(x.cid) === String(c.id)) || null; } catch (_){ it = null; }
  if (!it) return null;
  const who = pdPartyShort(c.counterparty) || _pdT('ng_door_them');
  const n = Number(it.n) || 0, p = Number(it.prepared) || 0, t = it.tally || {};
  const tally = [t.accept ? _pdT('ag_t_accept', { n: t.accept }) : '', t.push ? _pdT('ag_t_push', { n: t.push }) : '',
    t.escalate ? _pdT('ag_t_escalate', { n: t.escalate }) : '', t.review ? _pdT('ag_t_review', { n: t.review }) : ''].filter(Boolean).join(' · ');
  const what = p && p >= n ? _pdTn('pd_nd_jw_each', n, { n }) : p ? _pdT('pd_nd_jw_some', { p, n }) : tally;
  const when = pdPreparedWhen(it.since);
  const sub = what ? _pdT(p ? 'pd_nd_jw_prepared' : 'pd_nd_jw_read', { when: when || _pdT('pd_nd_jw_today'), what }) : '';
  return { what: _pdT('pd_nd_jw_answer', { who }), sub };
}
function pdNeedRowHtml(c, r){
  if (r.note){
    const words = String((r.first && (r.first.title || r.first.body)) || '').replace(/\s+/g, ' ').trim();
    const q = words.length > 60 ? words.slice(0, 59) + '…' : words;
    let day = ''; try { day = (typeof regDotDate === 'function') ? regDotDate(r.first.reviewBy) : String(r.first.reviewBy || ''); } catch (_){ day = String(r.first.reviewBy || ''); }
    const title = r.late ? _pdTn('pd_nd_note_late', r.n, { n: r.n, day }) : _pdTn('pd_nd_note', r.n, { n: r.n });
    const sub = [q ? '\u201c' + q + '\u201d' : '', _pdT('pd_nd_only_you')].filter(Boolean).join(' · ');
    return `<div class="pd-gl-row pd-nd-row is-note${r.late ? ' is-hot' : ''}" data-pd-nd-kind="mynote"><span><b>${_pdE(title)}</b><small title="${_pdE(sub)}">${_pdE(sub)}</small></span><button type="button" class="ui-btn ui-btn-sm" data-pd-nd-note="${_pdE((r.first && r.first.id) || '')}">${_pdE(_pdT('pd_nd_open_note'))}</button></div>`;
  }
  if (r.jw){
    const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 22, 'pd-nd-face').replace('<img', '<img data-ink-exempt') : '';
    const J = pdJwSay(c, r);
    const sub = J ? J.sub : [r.sum, r.urg].filter(Boolean).join(' · ');
    return `<div class="pd-gl-row pd-nd-row is-jw">${face}<span><b>${_pdE(_pdT('cn_jw'))} · ${_pdE(J ? J.what : _pdT('ag_' + r.k))}</b>${sub ? `<small title="${_pdE(sub)}">${_pdE(sub)}</small>` : ''}</span><button type="button" class="ui-btn ui-btn-sm" data-pd-nd-jw="${_pdE(r.k)}" data-pd-nd-key="${_pdE(r.key || '')}">${_pdE(_pdT('pd_nd_see'))}</button></div>`;
  }
  let w = null; try { w = (typeof insNeedWords === 'function') ? insNeedWords(c, r.it) : null; } catch (_){ w = null; }
  /* their redlines waiting say which clauses and open the redlines (round 3 as drawn: "waiting 4 days · clauses 7 and 11 · Open redlines") */
  const quiet = r.it.kind === 'quiet';
  const verb = quiet ? _pdT('pd_nd_open_red') : (typeof INS_NEED_VERB !== 'undefined' && INS_NEED_VERB[r.it.kind]) ? _pdT(INS_NEED_VERB[r.it.kind]) : _pdT('cn_open');
  const cl = quiet ? pdAskClausesSay(c) : '';
  const sub = w && w.sub ? w.sub + (cl ? ' · ' + _pdE(cl) : '') : (cl ? _pdE(cl) : '');
  const plain = [(w && w.plain) || '', cl].filter(Boolean).join(' · ');
  /* insNeedWords' line is HTML already (its late days marked); its words plain on the hover */
  return `<div class="pd-gl-row pd-nd-row${r.it.urgent ? ' is-hot' : ''}" data-pd-nd-kind="${_pdE(r.it.kind)}"><span><b>${_pdE((w && w.title) || '')}</b>${sub ? `<small title="${_pdE(plain)}">${sub}</small>` : ''}</span><button type="button" class="ui-btn ui-btn-sm" data-pd-nd="${_pdE(r.it.kind)}" data-pd-nd-id="${_pdE(c.id)}">${_pdE(verb)}</button></div>`;
}
function pdNeedsHtml(c){
  const rows = pdNeedsRows(c).concat(pdNoteRows(c)); if (!rows.length) return '';
  let all = 0; try { all = (typeof counterNeedsCount === 'function') ? counterNeedsCount() : 0; } catch (_){ all = 0; }
  const more = (all && typeof deskGoCounter === 'function')
    ? `<button type="button" class="pd-go pd-nd-all" data-pd-nd-all title="${_pdE(_pdT('pd_nd_all_tip'))}">${_pdE(_pdT('pd_nd_all', { n: all }))}${PD_GO_ARROW}</button>` : '';
  return `<div id="pd-needs" class="pd-glance pd-needs" data-pd-needs-for="${_pdE(c.id)}"><div class="pd-gl-h"><b>${_pdE(_pdT('pd_nd_title'))}</b>${pdPill('quiet', String(rows.length))}<span class="pd-gl-sp"></span>${more}</div><div class="pd-gl-b">${rows.map(r => pdNeedRowHtml(c, r)).join('')}</div></div>`;
}
/* in place, with the glance, as a face or a save changes what is owed */
function pdNeedsRepaint(){
  /* Still owed is a card of the dossier: it repaints with it */
  if (typeof document !== 'undefined' && document.getElementById('pd-glance') && !document.getElementById('pd-pin')){ pdGlanceRepaint(); return; }
  const pin = (typeof document !== 'undefined') ? document.getElementById('pd-pin') : null; if (!pin) return;
  const c = pdContract(); if (!c || String(c.id) !== pin.getAttribute('data-pd-pin-for')) return;
  const html = pdNeedsHtml(c);
  if (pin.innerHTML !== html) pin.innerHTML = html;
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
  /* a hand in the grid keeps its box: drawn again once it leaves */
  if (pdOgHolds()){ _pdOgPending = true; return; }
  const t = document.createElement('div'); t.innerHTML = pdGlanceHtml(c);
  const nu = t.firstElementChild; if (nu && nu.outerHTML !== el.outerHTML) el.replaceWith(nu);
  pdOgPaint();
}
/* what Jambo's tab draws at its top on Home's Document face: the wall's
   greeting and drop area, or the paper's contract at a glance */
function pdJamboTopHtml(){
  /* A CONTRACT HELD WITH NO PAPER UP (the redesign's gaps, 18 Oct 2026): a
     paper chosen on the wall (round 13), a contract brought up as a page
     (round 7) or its History (round 12) — Jambo says that contract */
  const held = pdHeldTopHtml(); if (held != null) return held;
  /* ON THE BOARD: his greeting says the book and where the owed work went
     (hbBoardHelloHtml, round 17 as drawn: Needs you is Home's now) */
  if (typeof igHomePaperFace !== 'function' || igHomePaperFace() !== true) return (typeof hbBoardHelloHtml === 'function') ? hbBoardHelloHtml() : '';
  const c = pdContract();
  /* ASK A COLUMN (owner picked "In Jambo's panel", 20 Oct 2026): beside the
     Contracts list his panel holds the question, then the answers' why */
  const ac = (!c && typeof askColPanelHtml === 'function') ? askColPanelHtml() : '';
  return c ? pdGlanceHtml(c) + pdNextUpHtml(c) : (ac || pdWallHtml());
}
/* NEEDS YOU HERE STAYS AT THE TOP OF THE TAB (round 3, "Tabs and faces" — the
   Compare's reason it won over Conversation: "the checklist would scroll
   away"): drawn above the conversation, outside its scroller, so a question
   asked and answered never pushes it out of view. The glance and the talk
   scroll under it. Its host is drawn even empty, so a repaint has a home. */
function pdJamboPinHtml(){
  /* THE DOSSIER CARRIES STILL OWED (owner, 20 Oct 2026): nothing is pinned above it */
  return '';
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
    if (t.closest('[data-pd-send-back]')){ e.preventDefault(); pdSendBack(); return; }
    if (t.closest('#ig-dock [data-pd-talk]')){ e.preventDefault(); if (pdTalkShows()) pdTalkBack(); else pdTalkReopen(); return; }
    /* "all N": Home's Needs you, landed on (hbNeedsOpen → landOn) */
    if (t.closest('[data-pd-nd-all]')){ e.preventDefault(); if (typeof hbNeedsOpen === 'function') hbNeedsOpen(); else if (typeof deskGoCounter === 'function') deskGoCounter(); return; }
    const jw = t.closest('[data-pd-nd-jw]');
    if (jw){ e.preventDefault(); if (typeof hbOpenAgent === 'function') hbOpenAgent(jw.getAttribute('data-pd-nd-jw'), jw.getAttribute('data-pd-nd-key') || null); return; }
    const nd = t.closest('[data-pd-nd]');
    if (nd){ e.preventDefault(); if (typeof needsYouGo === 'function') needsYouGo(nd.getAttribute('data-pd-nd'), nd.getAttribute('data-pd-nd-id')); return; }
    const nn = t.closest('[data-pd-nd-note]');
    /* Open note: My notes, on that note's row, lit (LAND ON IT) */
    if (nn){ e.preventDefault(); const nid = nn.getAttribute('data-pd-nd-note');
      if (typeof myNotesOpen === 'function') myNotesOpen(nid);
      if (nid && typeof landOn === 'function') landOn(() => document.querySelector(`[data-mn-row="${CSS.escape(nid)}"]`), { block: 'nearest', focus: false });
      return; }
    if (t.closest('[data-pd-gl-risks]')){ e.preventDefault(); const cc = pdContract(); const full = cc && ((typeof getContract === 'function' && getContract(cc.id)) || cc);
      let first = null; try { first = (full && typeof riskOpenOf === 'function') ? riskOpenOf(full)[0] : null; } catch (_){ first = null; }
      if (first && typeof riskEditStart === 'function') riskEditStart(full, first.key); return; }
    const gg = t.closest('[data-pd-gl-go]');
    if (gg){ e.preventDefault(); pdGlGoTo(gg.getAttribute('data-pd-gl-go')); return; }
    /* Read it: the press that spends — the Clauses tab's own deep read
       (stkRun, the read its head runs), and the tab opened where the reading
       is drawn as it comes */
    if (t.closest('[data-pd-gl-scan]')){ e.preventDefault(); const cc = pdContract();
      if (cc && typeof runScanFor === 'function') Promise.resolve(runScanFor(getContract(cc.id) || cc)).then(() => { try { pdGlanceRepaint(); pdNeedsRepaint(); } catch (_){} }, () => {});
      return; }
    const gt = t.closest('[data-pd-glance-tab]');
    if (gt){ e.preventDefault(); pdSetTab(gt.getAttribute('data-pd-glance-tab')); if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    if (t.closest('[data-pd-gl-brief]')){ e.preventDefault(); const cc = pdContract();
      if (cc && typeof openCheckPanel === 'function') openCheckPanel(getContract(cc.id) || cc, 'brief'); return; }
    /* THE DOSSIER'S DOORS (owner, 20 Oct 2026): each lands where its work is done */
    const full = () => { const cc = pdContract(); return cc && ((typeof getContract === 'function' && getContract(cc.id)) || cc); };
    const dsf = t.closest('[data-pd-ds-fill]');
    if (dsf){ e.preventDefault(); const cc = full(); const key = dsf.getAttribute('data-pd-ds-fill') || '';
      if (cc) pdFillOpen(cc.id, key ? { key } : {}); return; }
    if (t.closest('[data-pd-ds-obl]')){ e.preventDefault(); const cc = full();
      let found = []; try { found = (cc && typeof triageHeldObligations === 'function') ? triageHeldObligations(cc) : []; } catch (_){ found = []; }
      if (cc && found.length && typeof openObligationsReview === 'function') openObligationsReview(cc, found, () => { try { pdGlanceRepaint(); } catch (_){} });
      return; }
    if (t.closest('[data-pd-ds-std]')){ e.preventDefault(); const cc = full(); if (cc && typeof openCheckPanel === 'function') openCheckPanel(cc, 'playbook'); return; }
    const dsr = t.closest('[data-pd-ds-read]');
    if (dsr){ e.preventDefault(); const cc = full(); if (!cc || dsr.disabled || typeof triageAndPaint !== 'function') return;
      dsr.disabled = true; if (typeof busySet === 'function') try { busySet(dsr, true); } catch (_){}
      Promise.resolve((cc._light && !cc._loaded && typeof ensureFull === 'function') ? ensureFull(cc) : null).catch(() => {})
        .then(() => triageAndPaint(getContract(cc.id) || cc, { asked: true, again: true })).catch(() => {})
        .then(() => { try { pdGlanceRepaint(); } catch (_){} });
      return; }
    const dfam = t.closest('[data-pd-ds-fam]');
    if (dfam){ e.preventDefault(); if (typeof hbStripBring === 'function') hbStripBring(dfam.getAttribute('data-pd-ds-fam')); return; }
    const dfa = t.closest('[data-pd-ds-famact]');
    if (dfa){ e.preventDefault(); if (dfa.disabled) return; const cc = full();
      if (cc && typeof familyActRun === 'function') familyActRun(cc, dfa.getAttribute('data-pd-ds-famact'), () => { if (typeof renderIntelDock === 'function') renderIntelDock(); }); return; }
    const dpg = t.closest('[data-pd-ds-page]');
    if (dpg){ e.preventDefault(); const cc = full(); if (cc && typeof hbStripBring === 'function') hbStripBring(cc.id, dpg.getAttribute('data-pd-ds-page')); return; }
    const g = t.closest('[data-pd-glance]');
    if (g && !g.disabled){ e.preventDefault(); const row = PD_GLANCE[g.getAttribute('data-pd-glance')]; if (row && typeof intelAsk === 'function') intelAsk(_pdT(row[2])); }
  });
}
/* ============================================================
   THE CONTRACT IN FRONT, SAID BY JAMBO (the redesign's gaps: rounds 13, 7
   and 12; the owner's "build all the gaps", 18 Oct 2026)
   ============================================================
   Three things Home can hold with no paper up, and Jambo's tab says each:
   - a paper CHOSEN on the Contracts wall (round 13, "Wall of papers"): its
     name, its facts — Stage with its round · Stream · Value · Ends · Owner ·
     Last move — what it asks of the reader (Needs you here's own rows), and
     its two doors: Open the paper, Life line and details;
   - a contract BROUGHT UP as a page on the desk (round 7, "Read down"):
     "<ref> at a glance" — what is late, whose move it is, what a signed
     amendment changed and set, the notice day — with its next steps as chips;
   - that page's HISTORY (round 12, "Two sides"): "<ref> · History" — how much
     happened lately, the newest entry, what is still open and whose move it
     is, the Redlines door, and the questions worth asking as chips.
   Every line is a reading the house already makes (contractStatusMeta,
   insFacts, igWallValue, needsYouOf, bsLifeData, bsAmendMarks, dealStands,
   histMoveOf, histSummaryOf); nothing is asked of a model, spent or written.
   The panel's head names what it holds (pdHeadWord); the ask box says which
   contract it asks about (pdAskPlaceholder) and a question asked there goes
   with that contract's wording (intelAsk → igPaperAsk(q, id)). */
const PD_HELD_CHIPS = { card: ['oblig', 'history', 'amend'], open: ['redline', 'history', 'oblig'] };
/* the contract brought up as a page, while the Board is what Home shows */
function pdCardNow(){
  try {
    if (!(typeof window !== 'undefined' && window.state && state.view === 'dashboard')) return null;
    if (typeof hbFace !== 'function' || hbFace() !== 'board') return null;
    const id = (typeof bsCardId === 'function') ? bsCardId() : null;
    return id && typeof getContract === 'function' ? (getContract(id) || null) : null;
  } catch (_){ return null; }
}
function pdCardPage(c){
  const st = (c && typeof bsStrip === 'function') ? bsStrip(c.id) : null;
  return (st && st.page) || 'ov';
}
/* what Jambo's tab holds: 'chosen' (a paper chosen on the wall), 'card' (a
   contract brought up as a page), 'hist' (its History page), or '' */
function pdHolds(){
  try {
    if (typeof igHomePaperFace === 'function' && igHomePaperFace() === true)
      return (!pdContract() && typeof igWallChosen === 'function' && igWallChosen()) ? 'chosen' : '';
  } catch (_){ return ''; }
  const c = pdCardNow(); if (!c) return '';
  return pdCardPage(c) === 'hist' ? 'hist' : 'card';
}
function pdHeldContract(){
  const k = pdHolds();
  if (k === 'chosen') return (typeof igWallChosen === 'function') ? igWallChosen() : null;
  return k ? pdCardNow() : null;
}
/* the word the panel's head says beside Jambo's tab: what it holds */
function pdHeadWord(){
  /* A NEW AGREEMENT IN FRONT IS NOT THE CARD BEHIND IT (owner, 20 Oct 2026:
     "it brings the card from board"): while the drafting form stands over the
     Board the head names no card ("New agreement  MK-B2 · Dossier" was two
     contracts at once); the conversation beside it stays where it was */
  if (typeof document !== 'undefined' && document.getElementById('na-root')) return '';
  const k = pdHolds(); if (!k) return '';
  if (k === 'chosen') return _pdT('pd_ch_head');
  const c = pdCardNow(); const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : '';
  return k === 'hist' ? _pdT('pd_hg_head', { ref }) : _pdT('dos_held_head', { ref });
}
/* the ask box's words: which contract a question goes with */
function pdAskPlaceholder(){
  const k = pdHolds(); if (!k) return null;
  if (k === 'chosen') return _pdT('pd_ask_any');
  const c = pdCardNow(); if (!c) return null;
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  return k === 'hist' ? _pdT('pd_ask_hist', { ref }) : _pdT('int_ask_contract', { ref });
}
/* the contract a question in the box is about, with no paper up: the page's */
function pdAskContractId(){
  const k = pdHolds(); if (k !== 'card' && k !== 'hist') return null;
  const c = pdCardNow(); return c ? String(c.id) : null;
}
/* ---- small readings ---- */
function pdDaysSince(iso){
  const t = Date.parse(String(iso || '')); if (!isFinite(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 864e5));
}
function pdAgoWords(iso){
  const d = pdDaysSince(iso); if (d == null) return '';
  return d === 0 ? _pdT('pd_ago_today') : _pdTn('pd_ago_days', d, { n: d });
}
/* the stage as the paper's line says it (round 6): its words, its dot, its round */
function pdStageWords(c){
  let m = null; try { m = (typeof contractStatusMeta === 'function') ? contractStatusMeta(c) : null; } catch (_){ m = null; }
  const n = (typeof igLineRound === 'function') ? igLineRound(c) : 0;
  const label = (m && m.label) || ((typeof statusLabel === 'function') ? statusLabel(c && c.status) : String((c && c.status) || ''));
  return { dot: (m && m.dot) || 'var(--st-gray-dot)', label, round: n ? _pdT('ig_line_round', { n }) : '' };
}
/* ---- LAST MOVE: the newest thing that happened between the sides ----
   Read RAW off the record the list already carries (the changes, their
   answers, the signatures — dealStands' own sources): who sent how many
   redlines in that round, who answered, who signed; else the day it was
   signed, else the day it last changed. The parties are named, never a
   person (dsPartyNames). Null where nothing is known. */
function pdLastMove(c){
  if (!c || c._codeNamed) return null;
  let parties = []; try { parties = (typeof dsPartyNames === 'function') ? (dsPartyNames(c) || []) : []; } catch (_){ parties = []; }
  const us = parties.find(p => p && p.ours), them = (typeof dsThem === 'function') ? dsThem(parties) : parties.find(p => p && !p.ours);
  const nameOf = side => ((side === 'owner' ? us : them) || {}).name
    || (side === 'owner' ? ((typeof contractParty === 'function' && contractParty(c)) || (typeof FIRST_PARTY !== 'undefined' ? FIRST_PARTY : '')) : String(c.counterparty || ''));
  const chs = ((typeof dsChanges === 'function') ? dsChanges(c) : (Array.isArray(c.changes) ? c.changes.filter(Boolean) : [])).filter(x => x.status !== 'superseded');
  const ev = [];
  chs.forEach(x => {
    const side = x.authorSide === 'counterparty' ? 'counterparty' : 'owner';
    const at = x.createdAt || x.at || '';
    if (at) ev.push({ k: 'ask', at, side, round: Number(x.roundN) || 0, id: x.id });
    if ((x.status === 'accepted' || x.status === 'rejected') && x.resolvedAt) ev.push({ k: 'answer', at: x.resolvedAt, side: side === 'owner' ? 'counterparty' : 'owner' });
  });
  (Array.isArray(c.signatures) ? c.signatures : []).forEach(s => { if (s && s.at) ev.push({ k: 'sign', at: s.at, who: String(s.name || '') }); });
  ev.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const top = ev[0];
  if (top){
    if (top.k === 'sign') return { text: _pdT('pd_lm_signed', { who: top.who || nameOf('counterparty') }), at: top.at };
    if (top.k === 'ask'){
      const n = ev.filter(e => e.k === 'ask' && e.side === top.side && e.round === top.round).length;
      let unsent = false;
      if (top.side === 'owner') try { unsent = ((typeof negoUnsentAsks === 'function') ? negoUnsentAsks(c) : []).some(x => x && x.id === top.id); } catch (_){ unsent = false; }
      return { text: unsent ? _pdTn('pd_lm_drafted', n, { n }) : _pdTn('pd_lm_sent', n, { n, who: nameOf(top.side) }), at: top.at };
    }
    const day = String(top.at).slice(0, 10);
    const n = ev.filter(e => e.k === 'answer' && e.side === top.side && String(e.at).slice(0, 10) === day).length;
    return { text: _pdTn('pd_lm_answered', n, { n, who: nameOf(top.side) }), at: top.at };
  }
  const signed = c.signedAt || c._signedAt || '';
  if (signed) return { text: _pdT('pd_lm_signed_plain'), at: signed };
  const at = c._lastAuditAt || c.updatedAt || '';
  return at ? { text: _pdT('pd_lm_touched'), at } : null;
}
/* ---- A PAPER CHOSEN ON THE WALL (round 13) ---- */
/* THEIR REDLINES WAITING ON OUR SIDE, as drawn (pass 3, 18 Oct 2026: "Answer
   2 redlines · Clause 7 Liability cap · clause 11 Payment terms · Open
   redlines"): a row of the panel's own while it is our move and their changes
   are open (histMoveOf, the History lines' reading; RAW, nothing
   initialised), for a reader who may answer them (deskMayRedline). Past the
   desk's standard the checklist's own row says it, urgent, with the wait
   (needsYouOf 'quiet'), so this row stands aside then — never said twice. */
function pdClauseSaid(raw, lower){
  let s = String(raw || '').trim();
  try { if (s && typeof negoClauseName === 'function') s = negoClauseName(s) || s; } catch (_){ /* the stored label stands */ }
  if (!s || (typeof DS_INSIDE_ID !== 'undefined' && DS_INSIDE_ID.test(s))) return _pdT('ds_a_clause');
  const m = s.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
  return m ? _pdT(lower ? 'pd_ch_clause_lc' : 'pd_ch_clause', { n: m[1], name: m[2] }) : s;
}
const PD_CH_CLAUSES_MAX = 3;
function pdTheirAsksRow(c){
  if (!c || c._codeNamed) return null;
  let m = null; try { m = (typeof histMoveOf === 'function') ? histMoveOf(c) : null; } catch (_){ m = null; }
  if (!m || m.k !== 'you' || !m.theirs.length) return null;
  try { if (typeof deskMayRedline === 'function' && !deskMayRedline(c)) return null; } catch (_){ /* the seat is the desk's to say */ }
  let late = false; try { late = ((typeof needsYouOf === 'function') ? (needsYouOf(c) || []) : []).some(x => x && x.kind === 'quiet'); } catch (_){ late = false; }
  if (late) return null;
  const seen = new Set(), names = [];
  m.theirs.forEach(ch => { const k = String((ch && (ch.clauseId || ch.clauseLabel || ch.id)) || ''); if (seen.has(k)) return; seen.add(k); names.push(ch.clauseLabel || ch.headingText || ch.clauseId || ''); });
  const said = names.map((raw, i) => pdClauseSaid(raw, i > 0));
  const shown = said.slice(0, PD_CH_CLAUSES_MAX), more = said.length - shown.length;
  return { n: m.theirs.length, sub: shown.join(' · ') + (more ? ' · ' + _pdTn('pd_ch_more', more, { n: more }) : ''), plain: said.join(' · ') };
}
function pdTheirAsksRowHtml(c, r){
  if (!r) return '';
  const may = !(typeof negoMayStart === 'function') || !!(negoMayStart(c) || {}).ok;
  return `<div class="pd-gl-row pd-nd-row" data-pd-nd-kind="answer"><span><b>${_pdE(_pdTn('pd_ch_answer', r.n, { n: r.n }))}</b>${r.sub ? `<small title="${_pdE(r.plain)}">${_pdE(r.sub)}</small>` : ''}</span>${may ? `<button type="button" class="ui-btn ui-btn-sm" data-pd-ch-red="${_pdE(c.id)}" title="${_pdE(_pdT('pd_ch_go_red_tip'))}">${_pdE(_pdT('pd_ch_go_red'))}</button>` : ''}</div>`;
}
function pdChosenFacts(c){
  const out = []; if (!c) return out;
  const st = pdStageWords(c);
  out.push({ k: 'stage', label: _pdT('pd_ch_stage'), v: [st.label, st.round].filter(Boolean).join(' · '), dot: st.dot });
  let stream = ''; try { stream = (typeof regStreamName === 'function') ? regStreamName(c) : ''; } catch (_){ stream = ''; }
  if (!stream && typeof FOLDERS === 'object' && FOLDERS && FOLDERS[c.folder]) stream = FOLDERS[c.folder].name || '';
  const priv = !c._codeNamed && typeof streamIsPrivate === 'function' && !!streamIsPrivate(c.folder);
  out.push({ k: 'stream', label: _pdT('pd_ch_stream'), v: stream || '—', lock: priv });
  if (c._codeNamed) return out;
  /* the value the wall writes under the paper (igWallValue: pay and no money
     a dash); no row at all where values are not the reader's to see */
  if (!(typeof canViewValues === 'function' && !canViewValues())){
    const v = (typeof igWallValue === 'function') ? igWallValue(c) : '';
    /* AS AMENDED, the page's own figure (pass 3): igWallValue reads the value
       a signed amendment set, and the row says which amendment set it */
    let from = null; try { const e = (typeof effectiveTerm === 'function') ? effectiveTerm(c, 'value') : null; from = (e && e.from) || null; } catch (_){ from = null; }
    const ref = (from && v && v !== '—') ? ((typeof contractRef === 'function') ? contractRef(from) : String(from.id || '')) : '';
    out.push({ k: 'value', label: _pdT('pd_ch_value'), v: v || '—', sub: ref ? _pdT('pd_ch_value_amended', { ref }) : '' });
  }
  const F = (typeof insFacts === 'function') ? insFacts(c) : [];
  const ends = F.find(x => x.k === 'ends');
  out.push({ k: 'ends', label: _pdT('pd_ch_ends'), v: (ends && ends.v) || '—' });
  let owner = ''; try { owner = (typeof contractOwnerName === 'function' && contractOwnerName(c)) || ''; } catch (_){ owner = ''; }
  let mine = false; try { mine = !!(owner && typeof contractOwnedBy === 'function' && typeof currentUser === 'function' && contractOwnedBy(c, currentUser())); } catch (_){ mine = false; }
  out.push({ k: 'owner', label: _pdT('pd_ch_owner'), v: mine ? _pdT('ngl_lead_you') : (owner || '—') });
  const lm = pdLastMove(c);
  out.push({ k: 'last', label: _pdT('pd_ch_last'), v: lm ? lm.text : '—', sub: lm ? pdAgoWords(lm.at) : '' });
  return out;
}
function pdChosenHtml(c){
  if (!c) return '';
  const id = _pdE(c.id), ref = (typeof contractRef === 'function') ? contractRef(c) : String(c.id);
  const facts = pdChosenFacts(c);
  const lock = (typeof icon === 'function') ? icon('lock', 'w-3 h-3') : '';
  const rows = facts.map(f => `<div class="pd-ch-f" data-pd-ch-f="${f.k}"><dt>${_pdE(f.label)}</dt><dd>${f.dot ? `<i class="pd-ch-dot" style="background:${f.dot}" aria-hidden="true"></i>` : ''}${f.lock ? `<span class="pd-ch-lock" title="${_pdE(_pdT('igw_private_title', { s: f.v }))}">${lock}</span>` : ''}<span>${_pdE(f.v)}</span>${f.sub ? ` <small>${_pdE(f.sub)}</small>` : ''}</dd></div>`).join('');
  const stream = (facts.find(f => f.k === 'stream') || {}).v || '';
  const sub = c._codeNamed ? [ref, stream].filter(Boolean).join(' · ') : [ref, c.counterparty].filter(Boolean).join(' · ');
  /* A DEAL KEPT TO ITS LIST says its rule in the stop's own words, and no
     door it would refuse (codeNameStop) */
  if (c._codeNamed) return `<div id="pd-chosen" class="pd-chosen" data-pd-chosen-for="${id}"><h3 class="pd-ch-name">${_pdE(c.name || ref)}</h3><p class="pd-ch-ref">${_pdE(sub)}</p><dl class="pd-ch-facts">${rows}</dl><p class="pd-ch-rule">${_pdE(_pdT('cn_stop', { code: c.name || ref }))}</p></div>`;
  /* NEEDS YOU: Needs you here's own rows (Jambo's work on it first, then the
     checklist), the details owed among them — no glance stands beside it here */
  const nd = pdNeedsRows(c, { details: true });
  /* their redlines first among what is owed (Jambo's prepared work on it still leads) */
  const ask = pdTheirAsksRow(c);
  const jw = nd.filter(r => r.jw), rest = nd.filter(r => !r.jw);
  const body = jw.map(r => pdNeedRowHtml(c, r)).join('') + pdTheirAsksRowHtml(c, ask) + rest.map(r => pdNeedRowHtml(c, r)).join('');
  const needs = body ? `<div class="pd-ch-h">${_pdE(_pdT('pd_ch_needs'))}</div><div class="pd-glance pd-needs pd-ch-needs"><div class="pd-gl-b">${body}</div></div>` : '';
  return `<div id="pd-chosen" class="pd-chosen" data-pd-chosen-for="${id}"><h3 class="pd-ch-name">${_pdE(c.name || ref)}</h3><p class="pd-ch-ref">${_pdE(sub)}</p>
    <dl class="pd-ch-facts">${rows}</dl>${needs}
    <div class="pd-ch-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-pd-ch-open="${id}" title="${_pdE(_pdT('pd_ch_open_tip'))}">${_pdE(_pdT('pd_ch_open'))}</button><button type="button" class="ui-btn ui-btn-sm" data-pd-ch-life="${id}" title="${_pdE(_pdT('pd_ch_life_tip'))}">${_pdE(_pdT('pd_ch_life'))}</button></div></div>`;
}
/* ---- A CONTRACT BROUGHT UP AS A PAGE: "<ref> at a glance" (round 7) ----
   The page's own reading (bsLifeData): the obligations late, oldest first;
   whose move while a negotiation is live (histMoveOf); the newest signed
   amendment of this original — the clauses it changed (its own record,
   c.amends) and the value it set (bsAmendMarks); and the notice day. */
/* WHAT A PAGE STILL OWES, AS DRAWN (pass 4, the CFO agreement's glance:
   "Private · Board. Only Maria and Erik open it; every open is recorded." ·
   "2 details to fill: collective agreement and pension provider. · Fill in" ·
   "Nobody is named to sign yet. · Signing"): the private stream's line
   (bsPrivateOf), the details owed (detailsOf, the one reading), and a
   signer nobody has named while it is still to sign (bsLifeData's own
   signers) — so "Nothing is late, and nothing here waits on you" is said
   only where it is true. */
const PD_CG_NAMES_MAX = 3;
function pdListSay(list){
  const shown = list.slice(0, PD_CG_NAMES_MAX), more = list.length - shown.length;
  const parts = more ? shown.concat([_pdTn('pd_ch_more', more, { n: more })]) : shown;
  try { return new Intl.ListFormat((typeof langLocale === 'function') ? langLocale() : undefined, { style: 'long', type: 'conjunction' }).format(parts); } catch (_){ return parts.join(', '); }
}
/* an owed detail said in a sentence: the record's own boxes in words a
   person would say ("the start date", not the table's "Effective"); a
   template's or the paper's question by its own label */
const PD_CG_DET_WORD = { effDate: 'pd_cg_det_effdate', value: 'pd_cg_det_value', counterparty: 'pd_cg_det_counterparty' };
function pdDetWord(c, x){
  if (x && x.kind === 'kt' && PD_CG_DET_WORD[x.key]){
    const pay = x.key === 'value' && typeof fxIsPay === 'function' && fxIsPay(c);
    return _pdT(pay ? 'pd_cg_det_pay' : PD_CG_DET_WORD[x.key]);
  }
  const l = String((x && x.label) || '').trim();
  return l ? l.charAt(0).toLocaleLowerCase() + l.slice(1) : '';
}
function pdCardGlanceRows(c){
  const rows = []; if (!c) return rows;
  let D = null; try { D = (typeof bsLifeData === 'function') ? bsLifeData(c) : null; } catch (_){ D = null; }
  const P = (typeof bsPrivateOf === 'function') ? bsPrivateOf(c) : null;
  if (P) rows.push({ k: 'private', P });
  const O = D && D.O;
  const late = O ? O.rows.filter(r => r && r.st === 'overdue') : [];
  if (late.length){ const r = late[0]; rows.push({ k: 'late', n: late.length, what: r.what, days: pdDaysSince(r.due), theirs: !!r.theirs, due: r.due }); }
  let mv = null; try { mv = (typeof histMoveOf === 'function') ? histMoveOf(c) : null; } catch (_){ mv = null; }
  if (mv && (mv.k === 'you' || mv.k === 'them' || mv.open)) rows.push({ k: 'move', mv });
  let det = null; try { det = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ det = null; }
  if (det && det.left) rows.push({ k: 'details', n: det.left, names: det.items.filter(x => x && x.open).map(x => pdDetWord(c, x)).filter(Boolean) });
  const exec = !!((typeof negoExecuted === 'function' && negoExecuted(c)) || c.status === 'Signed');
  if (D && !exec && !c.archived && c.status !== 'Declined' && !(Array.isArray(D.signers) && D.signers.length)) rows.push({ k: 'signer' });
  let am = []; try { am = (typeof bsAmendMarks === 'function') ? bsAmendMarks(c) : []; } catch (_){ am = []; }
  if (am.length){
    const a = am[am.length - 1], kid = (typeof getContract === 'function') ? getContract(a.id) : null;
    const items = (kid && Array.isArray(kid.amends)) ? kid.amends.filter(Boolean) : [];
    /* WHAT IT DID, in the words it was made with (pass 4): the clauses it
       changes where they were picked, else the note its maker wrote
       (relationNote, applyParentLink's own) — never a purpose guessed */
    rows.push({ k: 'amend', a, n: am.length, changed: items.map(it => [it.clauseNumber, (typeof negoClauseName === 'function') ? negoClauseName(it.clauseLabel || '') : it.clauseLabel].filter(Boolean).join(' ')).filter(Boolean),
      note: String((kid && kid.relationNote) || '').replace(/\s+/g, ' ').trim().slice(0, 140) });
  }
  const M = D && D.M;
  if (M && M.noticeBy && M.end && M.noticeBy < M.end) rows.push({ k: 'notice', d: M.noticeBy, auto: !!M.auto, rt: Number(((c.metadata) || {}).renewalTermMonths) || 0, end: M.end });
  return rows;
}
/* a day as people say it: "12 Oct", the year only where it is not this one
   (histWhen's own rule); a Date is read as the day it names */
function pdShortDay(d){
  const iso = (d instanceof Date) ? (isNaN(d) ? '' : d.toISOString().slice(0, 10)) : String(d || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  if (iso === ((typeof todayISO === 'function') ? todayISO() : '')) return _pdT('pd_ago_today');
  try { const w = (typeof histWhen === 'function') ? histWhen(iso) : null; if (w && w.day) return w.day; } catch (_){ /* the day as stored */ }
  return (typeof bsDay === 'function') ? bsDay(iso) : iso;
}
function pdCardGlanceRowHtml(c, r){
  const day = pdShortDay;
  const go = (attr, val, word) => `<button type="button" class="ui-btn ui-btn-sm" ${attr}="${_pdE(val)}">${_pdE(_pdT(word))}</button>`;
  if (r.k === 'late'){
    const d = r.days == null ? 0 : r.days;
    const said = _pdTn('pd_cg_late', r.n, { n: r.n, what: r.what, days: _pdTn('pd_cg_days', d, { n: d }) });
    const sub = [_pdT(r.theirs ? 'pd_cg_theirs' : 'pd_cg_ours'), r.due ? _pdT('pd_cg_due', { d: day(r.due) }) : ''].filter(Boolean).join(' · ');
    return `<div class="pd-gl-row" data-pd-cg="late"><span>${_pdE(said)}${sub ? `<small>${_pdE(sub)}</small>` : ''}</span>${go('data-pd-cg-go', 'oblig', 'tab_obligations')}</div>`;
  }
  if (r.k === 'move'){
    const m = r.mv, n = m.theirs.length;
    const said = m.k === 'you' ? (n ? _pdTn('pd_cg_move_you', n, { n }) : _pdT('pd_cg_move_you_plain'))
      : m.k === 'them' ? _pdT('pd_cg_move_them', { who: m.party || _pdT('co_them') }) : _pdTn('pd_cg_move_open', m.open, { n: m.open });
    const sub = m.days == null ? '' : m.days === 0 ? _pdT('pd_cg_since_today') : _pdTn('pd_cg_days', m.days, { n: m.days });
    const may = !(typeof negoMayStart === 'function') || !!(negoMayStart(c) || {}).ok;
    return `<div class="pd-gl-row" data-pd-cg="move"><span>${_pdE(said)}${sub ? `<small>${_pdE(sub)}</small>` : ''}</span>${may ? go('data-pd-cg-go', 'red', 'pd_gl_redlines') : ''}</div>`;
  }
  if (r.k === 'amend'){
    const a = r.a, what = r.changed.length ? r.changed.slice(0, 2).join(', ') + (r.changed.length > 2 ? ' …' : '') : (r.note || '');
    const key = 'pd_cg_amend' + (what ? (r.changed.length ? '_changed' : '_note') : '') + (a.value ? '_value' : '');
    return `<div class="pd-gl-row" data-pd-cg="amend"><span>${_pdE(_pdT(key, { w: a.label, d: day(a.d), what, v: a.value }))}</span>${go('data-pd-cg-bring', a.id, 'pd_cg_bring')}</div>`;
  }
  if (r.k === 'private'){
    const P = r.P, who = P.first.length ? pdListSay(P.first) : '';
    const said = who ? _pdT('pd_cg_private', { s: P.stream, who }) : _pdT('pd_cg_private_plain', { s: P.stream });
    return `<div class="pd-gl-row" data-pd-cg="private"><span>${_pdE(said)}</span></div>`;
  }
  if (r.k === 'details'){
    const said = r.names.length ? _pdTn('pd_cg_details', r.n, { n: r.n, list: pdListSay(r.names) }) : _pdTn('pd_cg_details_plain', r.n, { n: r.n });
    return `<div class="pd-gl-row" data-pd-cg="details"><span>${_pdE(said)}</span>${go('data-pd-cg-go', 'fill', 'pd_cg_fill')}</div>`;
  }
  if (r.k === 'signer') return `<div class="pd-gl-row" data-pd-cg="signer"><span>${_pdE(_pdT('pd_cg_signer'))}</span>${go('data-pd-cg-go', 'sign', 'pd_cg_signing')}</div>`;
  if (r.k === 'notice'){
    const said = r.auto ? (r.rt ? _pdTn('pd_cg_notice_renews', r.rt, { d: day(r.d), n: r.rt }) : _pdT('pd_cg_notice_renews_plain', { d: day(r.d) }))
      : _pdT('pd_cg_notice_ends', { d: day(r.d), e: day(r.end) });
    return `<div class="pd-gl-row" data-pd-cg="notice"><span>${_pdE(said)}</span></div>`;
  }
  return '';
}
function pdCardGlanceHtml(c){
  if (!c) return '';
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  let pill = ''; try { pill = (typeof contractStatusTextHtml === 'function') ? contractStatusTextHtml(c) : ''; } catch (_){ pill = ''; }
  const rows = pdCardGlanceRows(c);
  const body = rows.length ? rows.map(r => pdCardGlanceRowHtml(c, r)).join('')
    : `<div class="pd-gl-none"><i aria-hidden="true">✓</i><span>${_pdE(_pdT('pd_cg_none'))}</span></div>`;
  const lock = (typeof bsPrivatePillHtml === 'function') ? bsPrivatePillHtml(c) : '';
  return `<div id="pd-cardglance" class="pd-glance pd-cglance" data-pd-held-for="${_pdE(c.id)}"><div class="pd-gl-h"><b>${_pdE(_pdT('pd_gl_title', { ref }))}</b><span class="pd-gl-sp"></span>${pill}${lock}</div><div class="pd-gl-b">${body}</div></div>`;
}
/* ---- ITS HISTORY: "<ref> · History" (round 12) ----
   histSummaryOf, the trail's own few lines: the last two weeks, the newest
   entry, what is still open and whose move it is (the Redlines door). */
function pdHistGlanceHtml(c){
  if (!c) return '';
  const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
  let S = null; try { S = (typeof histSummaryOf === 'function') ? histSummaryOf(c) : null; } catch (_){ S = null; }
  if (!S) return '';
  const day = e => { if (pdDaysSince(e.at) === 0 && String(e.at).slice(0, 10) === ((typeof todayISO === 'function') ? todayISO() : '')) return _pdT('pd_ago_today');
    try { const w = (typeof histWhen === 'function') ? histWhen(e.at) : null; return (w && w.day) || ''; } catch (_){ return ''; } };
  const first = S.recent ? _pdTn('pd_hg_recent', S.recent, { n: S.recent })
    : S.total ? _pdTn('pd_hg_quiet', S.total, { n: S.total }) : _pdT('pd_hg_none');
  const nw = S.newest ? _pdT('pd_hg_newest', { what: (typeof histNewestWords === 'function') ? histNewestWords(S.newest) : '', d: day(S.newest) }) : '';
  /* A PRIVATE CONTRACT'S HISTORY LEADS WITH ITS WALL (pass 4, round 12 as
     drawn: "Private · Board. Only Maria and Erik open it; every open is in
     this History." · "3 opens in the last two weeks."): who may open it
     (bsPrivateOf) and how often it was opened lately (its opens, _opens) */
  const P = (typeof bsPrivateOf === 'function') ? bsPrivateOf(c) : null;
  let rowA;
  if (P){
    const who = P.first.length ? pdListSay(P.first) : '';
    const said = who ? _pdT('pd_hg_private', { s: P.stream, who }) : _pdT('pd_hg_private_plain', { s: P.stream });
    const t0 = Date.now() - 14 * 864e5;
    const opens = (Array.isArray(c._opens) ? c._opens : []).filter(o => { const t = Date.parse(String((o && o.at) || '')); return isFinite(t) && t >= t0; }).length;
    const sub = opens ? _pdTn('pd_hg_opens', opens, { n: opens }) : '';
    rowA = `<div class="pd-gl-row" data-pd-hg="private"><span>${_pdE(said)}${sub ? `<small>${_pdE(sub)}</small>` : ''}</span></div>`;
  } else rowA = `<div class="pd-gl-row" data-pd-hg="recent"><span>${_pdE(first)}${nw ? `<small title="${_pdE(nw)}">${_pdE(nw)}</small>` : ''}</span></div>`;
  let rowB = '';
  const m = S.move;
  /* NOTHING SHARED YET (pass 4: "Nothing has been shared with Annika Holm
     yet."): no negotiation, nothing sent on the trail, no link made */
  if (!m && pdNeverShared(c)){
    const to = (typeof histTheirPerson === 'function' && histTheirPerson(c)) || String(c.counterparty || '').trim();
    if (to) rowB = `<div class="pd-gl-row" data-pd-hg="unshared"><span>${_pdE(_pdT('pd_hg_unshared', { who: to }))}</span></div>`;
  }
  if (m){
    const cl = list => (typeof histClausesSay === 'function') ? histClausesSay(list) : '';
    const said = m.theirs.length ? _pdTn('pd_hg_theirs_open', m.theirs.length, { n: m.theirs.length, list: cl(m.theirs) })
      : m.ours.length ? _pdTn('pd_hg_ours_open', m.ours.length, { n: m.ours.length, list: cl(m.ours) }) : _pdT('pd_hg_open_none');
    const who = m.party || _pdT('co_them');
    const mv = m.k === 'you' ? (m.days == null ? _pdT('pd_hg_move_you_plain') : m.days === 0 ? _pdT('pd_hg_move_you_today') : _pdTn('pd_hg_move_you', m.days, { n: m.days }))
      : m.k === 'them' ? (m.days == null ? _pdT('pd_hg_move_them_plain', { who }) : m.days === 0 ? _pdT('pd_hg_move_them_today', { who }) : _pdTn('pd_hg_move_them', m.days, { n: m.days, who })) : '';
    const may = !(typeof negoMayStart === 'function') || !!(negoMayStart(c) || {}).ok;
    rowB = `<div class="pd-gl-row" data-pd-hg="open"><span>${_pdE(said)}${mv ? `<small>${_pdE(mv)}</small>` : ''}</span>${may ? `<button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="red">${_pdE(_pdT('pd_gl_redlines'))}</button>` : ''}</div>`;
  }
  /* AS DRAWN (the SAP way's History, 21 Oct 2026): the serif "History of MK-A2", then "In his words" over his rows */
  return `<div id="pd-histglance" class="pd-glance pd-hglance" data-pd-held-for="${_pdE(c.id)}"><h3 class="pd-hg-title">${_pdE(_pdT('pd_hg_title', { ref }))}</h3><div class="pd-gl-h"><b>${_pdE(_pdT('pd_hg_words'))}</b></div><div class="pd-gl-b">${rowA}${rowB}</div></div>`;
}
/* the History page's questions worth asking, read off its record: what came
   in the newest round with changes, who decided the newest decided clause */
/* EVERY ROUND'S CHANGES, read RAW (pass 3, 18 Oct 2026): a round that closed
   keeps its decided changes on negotiation.rounds[].changes, and the open
   round's are c.changes — negoTimeline's own two sources, so "who decided
   clause 12" is still asked once round 1 has closed and round 2 is open.
   [{ ch, n }]: the change and the round it was made in. */
function pdHistChanges(c){
  const out = []; if (!c) return out;
  const neg = c.negotiation || null;
  ((neg && Array.isArray(neg.rounds)) ? neg.rounds : []).forEach(r => ((r && Array.isArray(r.changes)) ? r.changes : []).forEach(ch => {
    if (ch && ch.status !== 'superseded') out.push({ ch, n: Number(r.n) || Number(ch.roundN) || 0 }); }));
  const live = (typeof dsChanges === 'function') ? dsChanges(c) : (Array.isArray(c.changes) ? c.changes.filter(Boolean) : []);
  const open = Number(neg && neg.round) || 0;
  live.forEach(ch => { if (ch && ch.status !== 'superseded') out.push({ ch, n: Number(ch.roundN) || open || 1 }); });
  return out;
}
/* never sent to the other side: no turn handed, no link on the trail, no
   share on record (cachedShares, where the page has read them) */
function pdNeverShared(c){
  if (!c || (typeof negoExecuted === 'function' && negoExecuted(c)) || c.status === 'Signed') return false;
  if (c.negotiation && c.negotiation.turnAt) return false;
  let ev = []; try { ev = (typeof roomHistoryEvents === 'function') ? roomHistoryEvents(c) : []; } catch (_){ ev = []; }
  if (ev.some(e => e && (e._k === 'link' || e._k === 'handover' || e._k === 'round-closed'))) return false;
  let sh = []; try { sh = (typeof cachedShares === 'function') ? (cachedShares(c) || []) : []; } catch (_){ sh = []; }
  return !sh.length;
}
/* the trail's other questions (pass 4, round 12 as drawn: "who opened it ·
   what Erik changed"): who opened a private contract, where it was opened;
   what the newest colleague on our side changed, where somebody other than
   the reader did something on the trail */
function pdHistAlso(c){
  const out = []; if (!c) return out;
  if (Array.isArray(c._opens) && c._opens.length) out.push(_pdT('pd_hq_opened'));
  let ev = []; try { ev = (typeof roomHistoryEvents === 'function') ? roomHistoryEvents(c).slice().reverse() : []; } catch (_){ ev = []; }
  const me = String(((typeof currentUser === 'function' && currentUser()) || {}).name || '').trim().toLowerCase();
  let ours = null; try { ours = (typeof _histOurPeople === 'function') ? _histOurPeople() : null; } catch (_){ ours = null; }
  const lane = e => (typeof histLaneOf === 'function') ? histLaneOf(e, ours) : '';
  const x = ev.find(e => e && e.actor && e.actor !== 'System' && String(e.actor).trim().toLowerCase() !== me && e._k !== 'opened' && e._k !== 'access' && lane(e) === 'ours');
  if (x) out.push(_pdT('pd_hq_changed', { who: String(x.actor).trim().split(/\s+/)[0] }));
  return out;
}
function pdHistQuestions(c){
  const out = []; if (!c) return out;
  const all = pdHistChanges(c);
  const rounds = all.map(x => x.n).filter(n => n > 0);
  const r = rounds.length ? Math.max(...rounds) : 0;
  if (r) out.push(_pdT('pd_hq_round', { n: r }));
  const dec = all.map(x => x.ch).filter(x => (x.status === 'accepted' || x.status === 'rejected') && x.resolvedAt)
    .sort((a, b) => String(b.resolvedAt).localeCompare(String(a.resolvedAt)))[0];
  if (dec){
    let lab = String(dec.clauseLabel || ''); try { if (lab && typeof negoClauseName === 'function') lab = negoClauseName(lab) || lab; } catch (_){ /* the stored label stands */ }
    const m = lab.match(/^(\d+(?:\.\d+)*)/);
    if (m || (lab && !(typeof DS_INSIDE_ID !== 'undefined' && DS_INSIDE_ID.test(lab)))) out.push(m ? _pdT('pd_hq_decided_n', { n: m[1] }) : _pdT('pd_hq_decided', { clause: lab }));
  }
  return out.concat(pdHistAlso(c));
}
/* ---- THE CHIPS FOR WHAT IS HELD ----
   null: not one of these, the panel's own chips stand. '' : none drawn (a
   paper chosen on the wall, as drawn). A page's chips press their own door
   (data-pd-held-chip); a question is put in the box for the reader to ask,
   its cost on the box (data-ca-fill, the house's own way). */
const PD_CHIP_CLS = 'jb-chip';
/* THE CHIPS CHANGE WITH THE CONTRACT (pass 4, round 7 as drawn: the signed
   supply agreement "obligations · history · amend", the private employment
   draft "fill in · pay · who can open it"): what it owes leads — details to
   fill (detailsOf), its pay (fxIsPay, payEditOpen), who may open its private
   stream (an admin's door, bsPrivateOf) — then the page's usual next steps;
   three at most, none that would take you nowhere. History's are the
   questions its trail can answer, then one door. */
const PD_HELD_CHIPS_MAX = 3;
const PD_HELD_CHIP_WORD = { pay: 'pd_chip_pay', access: 'pd_chip_access' };
function pdHeldOwes(c){
  const exec = !!((typeof negoExecuted === 'function' && negoExecuted(c)) || c.status === 'Signed');
  let det = 0; try { det = (!exec && typeof detailsOf === 'function') ? (detailsOf(c).left || 0) : 0; } catch (_){ det = 0; }
  const pay = !!(typeof fxIsPay === 'function' && fxIsPay(c) && typeof payEditOpen === 'function');
  const access = !!((typeof bsPrivateOf === 'function') && bsPrivateOf(c) && typeof isAdmin === 'function' && isAdmin());
  return { exec, det, pay, access };
}
function pdHeldChips(c, k){
  if (!c) return [];
  const shut = w => (typeof caChipShut === 'function' && w !== 'fill') ? !!caChipShut(c, w) : false;
  const O = pdHeldOwes(c);
  if (k === 'hist'){
    const qs = pdHistQuestions(c).slice(0, PD_HELD_CHIPS_MAX - 1).map(q => ({ fill: q }));
    let live = null; try { live = (typeof histMoveOf === 'function') ? histMoveOf(c) : null; } catch (_){ live = null; }
    const door = live && !shut('redline') ? 'redline' : O.det ? 'fill' : shut('redline') ? '' : 'redline';
    return qs.concat(door ? [{ go: door }] : []);
  }
  const out = [];
  if (O.det) out.push('fill');
  if (O.pay) out.push('pay');
  if (O.access) out.push('access');
  (O.exec ? PD_HELD_CHIPS.card : PD_HELD_CHIPS.open).forEach(w => { if (!out.includes(w) && !shut(w)) out.push(w); });
  return out.slice(0, PD_HELD_CHIPS_MAX).map(w => ({ go: w }));
}
function pdPanelChipsHtml(){
  const k = pdHolds(); if (!k) return null;
  if (k === 'chosen') return '';
  if (typeof jamboChipsOn === 'function' && !jamboChipsOn()) return '';
  const c = pdCardNow();
  const label = w => PD_HELD_CHIP_WORD[w] ? _pdT(PD_HELD_CHIP_WORD[w]) : (typeof caNextLabel === 'function') ? caNextLabel(w) : w;
  return pdHeldChips(c, k).map(x => x.fill
    ? `<button type="button" data-ca-fill="${_pdE(x.fill)}" class="${PD_CHIP_CLS}">${_pdE(x.fill)}</button>`
    : `<button type="button" data-pd-held-chip="${_pdE(x.go)}" class="${PD_CHIP_CLS}">${_pdE(label(x.go))}</button>`).join('');
}
/* THE CHIPS SIT RIGHT UNDER THE CARD (pass 3, 18 Oct 2026; rounds 7 and 12 as
   drawn: "obligations · history · amend" under "MK-0377 at a glance", the
   questions and redline under "MK-0382 · History"), not in the panel's foot
   row — which a page brought up leaves empty (renderIntelDock), so Jambo
   perches on the ask box. Not the paper's chips row ([data-ig-chips]):
   pdChipsRepaint writes the paper's own next steps into that one. */
function pdHeldChipsHtml(){
  const k = pdHolds(); if (k !== 'card' && k !== 'hist') return '';
  const inner = pdPanelChipsHtml();
  /* AS DRAWN (21 Oct 2026): beside History the links carry their label, "Next steps" */
  return inner ? `<div class="pd-held-chips" data-pd-held-chips>${k === 'hist' ? `<div class="pd-held-lbl">${_pdE(_pdT('pd_hg_next'))}</div>` : ''}${inner}</div>` : '';
}
/* ---- LAND ON IT (owner, 18 Oct 2026; pass 4): every door these panels hold
   names the one thing it opens on and arrives there, lit, through the one
   lander (landOn) — the contract's own table on Obligations, its History
   page, the first change waiting on Redlines, the first box still owed on
   Fill in, the Sign button, the pay editor, the stream's page, the page a
   contract is brought up on, the paper itself. It presses nothing. */
const PD_HELD_LAND_TRIES = 80;
const PD_HELD_LAND = {
  oblig: () => document.querySelector('#obw-one-host'),
  history: id => document.querySelector(`#bs-strip-${CSS.escape(String(id))}[data-bs-on="hist"]`),
  amend: () => document.querySelector('#pd-amendface'),
  red: () => document.querySelector('#pd-redface [data-nego-card]') || document.querySelector('#pd-redface'),
  fill: () => document.querySelector('#pd-fillface [data-pd-owed="1"]') || document.querySelector('#pd-fillface'),
  sign: () => document.querySelector('#pd-signface #sign-btn') || document.querySelector('#pd-signface .pd-road-stop.is-now') || document.querySelector('#pd-signface'),
  pay: id => document.querySelector(`[data-bs-host="pay"][data-bs-cid="${CSS.escape(String(id))}"]`),
  access: () => document.querySelector('#st-ps'),
  page: id => document.querySelector(`#bs-strip-${CSS.escape(String(id))}`),
  paper: id => ((window.intel && intel.paper && String(intel.paper.id) === String(id)) ? document.querySelector('#ig-paper') : null),
};
const PD_HELD_LAND_STILL = new Set(['page', 'paper', 'history']);
function pdHeldLand(kind, id){
  const k = kind === 'redline' ? 'red' : kind;
  const f = PD_HELD_LAND[k]; if (!f || typeof landOn !== 'function') return null;
  return landOn(() => f(id), { tries: PD_HELD_LAND_TRIES, block: PD_HELD_LAND_STILL.has(k) ? 'start' : 'nearest', focus: PD_HELD_LAND_STILL.has(k) ? false : undefined });
}
/* a page's door, for its contract (the chips and the glance's buttons) */
function pdHeldGo(c, w){
  const done = pdHeldOpen(c, w);
  if (done && c) pdHeldLand(w, c.id);
  return done;
}
function pdHeldOpen(c, w){
  if (!c) return false;
  if (w === 'oblig') return (typeof obOpenContract === 'function') ? (obOpenContract(c.id), true) : false;
  if (w === 'history') return (typeof bsStripPage === 'function') ? bsStripPage(c.id, 'hist') : false;
  if (w === 'amend') return (typeof pdAmendOpen === 'function') ? pdAmendOpen(c.id) : false;
  if (w === 'redline' || w === 'red') return pdRedOpen(c.id);
  if (w === 'fill') return pdFillOpen(c.id);
  if (w === 'sign') return pdSignOpen(c.id);
  if (w === 'pay') return (typeof payEditOpen === 'function') ? payEditOpen(c.id) : false;
  if (w === 'access'){ const P = (typeof bsPrivateOf === 'function') ? bsPrivateOf(c) : null;
    if (P && typeof openSettingsAt === 'function'){ openSettingsAt('company', 'stream:' + P.fid); return true; } return false; }
  return false;
}
/* ---- WHAT IS HELD FOLLOWS THE DESK ----
   The Board's paint (bsPaintHosts) asks: another thing held (a page brought
   up or put away, its History opened) draws the panel again; the same thing
   held has its card drawn again in place when the record moved under it. */
let _pdHeldWas = null;
function pdHeldSig(){ const k = pdHolds(), c = pdHeldContract(); return k + ':' + (c ? c.id : ''); }
function pdHeldFollow(){
  const dock = (typeof document !== 'undefined') ? document.getElementById('ig-dock') : null; if (!dock) return;
  const sig = pdHeldSig();
  if (_pdHeldWas !== null && sig !== _pdHeldWas){ _pdHeldWas = sig; if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
  _pdHeldWas = sig;
  const k = pdHolds(), c = pdHeldContract(); if (!k || !c) return;
  const el = document.querySelector('#ig-dock [data-pd-held-for], #ig-dock #pd-chosen');
  const html = k === 'hist' ? pdHistGlanceHtml(c) : k === 'card' ? pdCardDossierHtml(c) : pdChosenHtml(c);
  if (!el){ if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
  const t = document.createElement('div'); t.innerHTML = html;
  let card = el;
  const nu = t.firstElementChild; if (nu && nu.outerHTML !== el.outerHTML){ el.replaceWith(nu); card = nu; }
  /* and the chips under it, in place */
  const row = document.querySelector('#ig-dock [data-pd-held-chips]'), want = pdHeldChipsHtml();
  if (!want){ if (row) row.remove(); return; }
  const t2 = document.createElement('div'); t2.innerHTML = want; const nr = t2.firstElementChild;
  if (row){ if (nr && nr.outerHTML !== row.outerHTML) row.replaceWith(nr); }
  else if (nr) card.after(nr);
}
function pdHeldTopHtml(){
  _pdHeldWas = pdHeldSig();
  const k = pdHolds(), c = pdHeldContract(); if (!k || !c) return null;
  return (k === 'hist' ? pdHistGlanceHtml(c) : k === 'card' ? pdCardDossierHtml(c) : pdChosenHtml(c)) + pdHeldChipsHtml();
}
/* ---- THE DOSSIER BESIDE THE BOARD'S CARD (owner, 20 Oct 2026: "yes make it
   the dossier") ----
   A contract brought up on the Board: Jambo's panel draws the same dossier as
   beside its paper (pdGlanceHtml, pdNextUpHtml — one builder, a second host),
   so the card and the panel say one thing. THE BOARD REVIEWS, THE WORKSPACE
   ACTS: any press inside it first opens the contract beside its paper, then
   presses the same door on the paper's own dossier — never a second copy of
   an act wired here. */
const PD_HELD_DOS_TRIES = 40;
function pdCardDossierHtml(c){
  const g = pdGlanceHtml(c, { held: true }).replace('<div id="pd-glance" class="pd-dossier"', '<div id="pd-glance" class="pd-dossier" data-pd-held-dossier');
  const nx = pdNextUpHtml(c).replace('class="pd-menu pd-nx ds-nx"', 'class="pd-menu ds-nx" data-pd-held-dossier');
  /* A PRIVATE CONTRACT SAYS WHO MAY OPEN IT FIRST, as the card did (bsPrivateOf, the card's own row) */
  let P = null; try { P = (typeof bsPrivateOf === 'function') ? bsPrivateOf(c) : null; } catch (_){ P = null; }
  const priv = P ? `<div class="pd-glance ds-card ds-private" data-pd-ds-card="private"><div class="pd-gl-b">${pdCardGlanceRowHtml(c, { k: 'private', P })}</div></div>` : '';
  /* one holder, so the panel follows the page in place (pdHeldFollow) */
  return `<div class="pd-held-dos" data-pd-held-for="${_pdE(c.id)}">${priv}${g}${nx}</div>`;
}
/* the same door on the paper's dossier: its id, else its first data-* mark */
function pdHeldDoorSel(b){
  if (b.id) return '#' + CSS.escape(b.id);
  const a = [...b.attributes].find(x => /^data-(pd|ig|rl)-/.test(x.name));
  return a ? `[${a.name}="${CSS.escape(a.value)}"]` : '';
}
if (typeof document !== 'undefined' && !document._pdHeldDosWired){
  document._pdHeldDosWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const host = t.closest('[data-pd-held-dossier]'); if (!host) return;
    const b = t.closest('button'); if (!b || !host.contains(b)) return;
    /* the Board's own readings (a family member, Where we are, History) stay on the Board */
    if (b.closest('summary') || b.matches('[data-pd-ds-fam], [data-pd-ds-page], [data-pd-cg-go]')) return;
    e.preventDefault(); e.stopPropagation();
    if (b.disabled) return;
    const id = host.getAttribute('data-pd-glance-for') || host.getAttribute('data-pd-menu'), sel = pdHeldDoorSel(b);
    /* a grid row beside the Board: the paper, its row ready (the Board reads, the paper takes the answer) */
    const og = b.getAttribute('data-pd-og-go');
    if (id && og != null){ ['pdFillAway', 'pdRedAway', 'pdSignAway'].forEach(f => { if (typeof window[f] === 'function') try { window[f](); } catch (_){} });
      if (pdTalkShows()) try { pdTalkBack(); } catch (_){}
      pdFillOpen(id, { key: og }); return; }
    if (!id || !sel) return;
    /* the dossier itself, not a face left up over it */
    ['pdFillAway', 'pdRedAway', 'pdSignAway'].forEach(f => { if (typeof window[f] === 'function') try { window[f](); } catch (_){} });
    if (pdTalkShows()) try { pdTalkBack(); } catch (_){}
    if (pdOpenOnHome(id, 'copilot') === false) return;
    let n = 0;
    const press = () => {
      const on = document.querySelector(`#ig-dock #pd-glance[data-pd-glance-for="${CSS.escape(String(id))}"]:not([data-pd-held-dossier])`);
      const nx = document.querySelector(`#ig-dock .pd-nx[data-pd-menu="${CSS.escape(String(id))}"]`);
      const root = on && (on.querySelector(sel) ? on : (nx && nx.dataset.wired ? nx : null));
      const row = root ? root.querySelector(sel) : null;
      if (row){ if (!row.disabled) row.click(); return; }
      if (++n < PD_HELD_DOS_TRIES) setTimeout(press, 50);
    };
    setTimeout(press, 0);
  }, true);
}
if (typeof document !== 'undefined' && !document._pdHeldWired){
  document._pdHeldWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#ig-dock')) return;
    const op = t.closest('[data-pd-ch-open]');
    if (op){ e.preventDefault(); const id = op.getAttribute('data-pd-ch-open'); if (typeof igWallOpen === 'function' && igWallOpen(id) !== false) pdHeldLand('paper', id); return; }
    const rd = t.closest('[data-pd-ch-red]');
    if (rd){ e.preventDefault(); const id = rd.getAttribute('data-pd-ch-red'); if (typeof igWallLetGo === 'function') igWallLetGo(); if (pdRedOpen(id) !== false) pdHeldLand('red', id); return; }
    const lf = t.closest('[data-pd-ch-life]');
    if (lf){ e.preventDefault(); const id = lf.getAttribute('data-pd-ch-life'); if (typeof igWallLetGo === 'function') igWallLetGo(); if (typeof hbStripBring === 'function' && hbStripBring(id) !== false) pdHeldLand('page', id); return; }
    const br = t.closest('[data-pd-cg-bring]');
    if (br){ e.preventDefault(); const id = br.getAttribute('data-pd-cg-bring'); if (typeof hbStripBring === 'function' && hbStripBring(id) !== false) pdHeldLand('page', id); return; }
    const g = t.closest('[data-pd-cg-go]');
    if (g){ e.preventDefault(); pdHeldGo(pdCardNow(), g.getAttribute('data-pd-cg-go')); return; }
    const ch = t.closest('[data-pd-held-chip]');
    if (ch){ e.preventDefault(); pdHeldGo(pdCardNow(), ch.getAttribute('data-pd-held-chip')); }
  });
}
/* JAMBO, ALIVE (16 Oct 2026) — the bird that perched on the chips row — left
   with the bird on a computer when the owner picked Chambers (20 Oct 2026):
   Jambo is the ✦ mark there (jamboFaceHtml). */
/* ESC IS ONE STEP UP (ONE TRAIL): where nothing above the panel holds the
   key and nobody is typing, Esc presses the trail's back */
if (typeof document !== 'undefined' && !document._pdTrailEsc){
  document._pdTrailEsc = true;
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const a = document.activeElement;
    if (a && a.matches && a.matches('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) return;
    if (document.querySelector('[data-top-overlay]')) return;
    const mr = document.getElementById('modal-root'); if (mr && mr.innerHTML.trim()) return;
    if (typeof clauseEditorOpen === 'function' && clauseEditorOpen()) return;
    /* JAMBO AS A TAB YOU FLIP TO (19 Oct 2026): a conversation up beside a
       list, Import, Settings or the Calendar turns back the same way */
    if (pdTrailBack() || (typeof jamboTalkBack === 'function' && jamboTalkBack())) e.preventDefault();
  });
}
Object.assign(window, { pdOgShows, pdKtOpen, pdKtFacts, pdKtHtml, pdOgPaint, pdOgFacts, pdOgHtml, pdOgConfirm, pdOgLand, pdOgHolds, pdOgReadN, pdCardDossierHtml, DOSSIER_STAGES, DOSSIER_STAGE_OF, dossierOf, dossierNowStage, dossierRead, dossierOwed, dossierSpineHtml, dossierActsPick, dossierFamilyFoldHtml, pdLandName,
  PD_TRAIL_IN_HEAD, pdTrail, pdTrailHtml, pdTrailSync, pdTrailBack, pdFaceWordOf, pdLandWord, pdTalkKey, pdTalkScope, pdTalkShows, pdTalkHas, pdTalkReopen, pdTalkTabHtml, pdTalkSync, pdTalkFrom, pdTalkClose, pdTalkBack, pdAmendFor, pdAmendShows, pdAmendMay, pdAmendOpen, pdAmendSeen, pdAmendAway, pdAmendClose, pdAmendClauseOf, pdAmendAdd, pdAmendFaceHtml, pdAmendRepaint, pdAmendPaperPaint, pdAmendCreate, pdAmendFacePaint, PD_AMEND_ITEMS_MAX, pdMenuHtml, pdNextUpHtml, pdMenuWire, pdMenuPress, PD_MENU_PRESS_TRIES, pdMenuGroups, PD_MENU_NEXT, pdPresenceOn, pdPresenceOff, pdPresenceLeft, pdFaceNow, PD_FACE_WORDS, PD_LOOK_RE, pdRedOk, pdTheirOpen, pdMovedWords, pdChangeKind, PD_NEGO_WAIT_MS, pdNegoThen, pdGoClause, pdSendWaiting, PD_ROOM_TAB, pdOpenOnHome, pdOpenTabOf, PD_TAB_ICON, PD_TAB_GLYPH, PD_TAB_NAME, PD_TABS, pdTabCount, pdTabCountPaint, pdChipsQuiet, PD_FF_NDA_KEYS, pdFillCardOf, pdFillPrivateHtml, pdFillWaitHtml, pdFillPayHtml, pdFillStdKind, pdFillPaperMarks, pdTabGlyphHtml, pdTop, pdPill, pdList, pdEmpty, PD_GO_ARROW, PD_HIST_MAX, pdSetTab, pdTab, pdOnPaper, pdShowsDesk, pdHeadHtml, pdBodyHtml, pdDocHtml, pdContract, pdBtn, pdRoom, pdFactsHtml, pdObligHtml, PD_FACE_WORD, PD_FACE_ROW, pdFaceUp, pdSendFor, pdSendIsWaiting, pdSendWaitSet, pdSendHeld, pdSendShows, pdSendAway, pdSendBack, pdSendKeepHtml, pdSendOpen, pdSendClose, pdSendFaceHtml, pdSendFacePaint,
  pdHistHtml, pdDealHtml, PD_BODY, pdHtml, pdPaint, pdFillPaint,
  pdRedFor, pdRedShows, pdRedOpen, pdRedLand, pdRedSeen, pdRedAway, pdRedClose, pdRedPaper, pdRedOpts, pdRedFaceHtml, pdRedFootHtml, pdRedScrollOf, pdRedRepaint, pdRedFacePaint, pdRedWire, pdRedPaperWire,
  pdSignFor, pdSignShows, pdSignOpen, pdSignSeen, pdSignAway, pdSignClose, pdSignPaper, pdSignPaperSig, pdSignState, pdSignPillHtml, pdSignHeadHtml, pdSignNextHtml, PD_RD_YES, PD_RD_SIGN, pdSignMine, PD_RD_CHECKS, pdRoadCheckOf, pdRoadCheckNames, pdDayWord, pdBackDay, pdAwayOf, pdRoadRuleOf, pdRoadRuleTitle, pdRoadRuleSub, pdRoadRuleFramed, pdRoadRuleHtml, pdRoadMovedHtml, pdRoadYesOf, pdRoadYesTitle, pdRoadYesFramed, pdRoadYesFacts, pdRoadYesHtml, pdRoadPress, pdRoadStops, pdRoadPaint, pdSignFaceHtml, pdSignCounts, pdSignWire, pdSignFacePaint, pdSignPaperPaint,
  PD_FILL_TRIES, PD_FILL_BEAT_MS, pdFillFor, pdFillShows, pdFillOpen, pdFillSeen, pdFillAway, pdFillClose, pdFillHeadHtml, pdFillDoneHtml, pdFillFaceHtml, pdFillMark, pdFillGroupsPaint, pdFillRows, pdFillRowKey, pdFillFacePaint, pdFillCounts, pdFillKeyOf, pdFillEcho, pdFillWire, pdFillLand, pdFillRefresh,
  pdFillStreamMay, pdFillStreamHtml, pdFillStreamAsk, PD_FF_BOX, pdFillBoxOf, pdFillLabelOf, PD_FF_UNIT, pdFillStdOf, PD_FF_CLAUSE_NUM, pdFillSpotClause, pdFillSpotOf, pdFillExtrasPaint, pdFillStreamRepaint, pdFillStreamPick,
  PD_DROP_ACCEPT, pdDropMay, pdWallHelloHtml, pdDropInner, pdDropStreams, pdDropStreamNow, pdDropStreamHtml, pdDropHtml, pdDropPaint, pdWallHtml, pdDropInput, pdDropBusyNow, pdDropPick, PD_DROP_TOAST_MS, pdDropToastOff, pdDropTake,
  PD_GLANCE, PD_GL_SUB_MAX, pdGlanceSub, pdGlanceBriefHtml, pdGlanceFootHtml, pdDropImportHtml, pdDropDoor, pdGlanceRows, pdSignAhead, PD_GL_ASKS_MAX, pdTheirAsks, pdAskHeading, pdAskClause, PD_GL_CONTEXT, PD_GL_DAYS_FOR, pdAskParts, pdAskSay, pdGlAgo, pdGlMoveSay, pdGlGoTo, pdNoteRows, pdPartyShort, pdPreparedWhen, pdJwSay, pdAskClausesSay, pdGlanceHtml, pdGlanceRepaint, pdJamboTopHtml, pdJamboPinHtml, pdNeedsRows, pdNeedRowHtml, pdNeedsHtml, pdNeedsRepaint, pdBackHtml, PD_BACK_CLOSE, PD_GL_DONE_MS, pdGlanceDone,
  PD_HELD_CHIPS, pdCardNow, pdCardPage, pdHolds, pdHeldContract, pdHeadWord, pdAskPlaceholder, pdAskContractId, pdDaysSince, pdAgoWords, pdShortDay, pdStageWords, pdLastMove,
  pdClauseSaid, PD_CH_CLAUSES_MAX, pdTheirAsksRow, pdTheirAsksRowHtml, pdChosenFacts, pdChosenHtml, pdCardGlanceRows, pdCardGlanceRowHtml, pdCardGlanceHtml, pdHistGlanceHtml, pdHistChanges, pdHistQuestions, pdNeverShared, pdHistAlso, pdListSay, PD_CG_NAMES_MAX, PD_CG_DET_WORD, pdDetWord, PD_HELD_CHIPS_MAX, PD_HELD_CHIP_WORD, pdHeldOwes, PD_CHIP_CLS, pdHeldChips, pdPanelChipsHtml, pdHeldChipsHtml, pdHeldGo, pdHeldOpen, PD_HELD_LAND, PD_HELD_LAND_TRIES, PD_HELD_LAND_STILL, pdHeldLand, pdHeldSig, pdHeldFollow, pdHeldTopHtml });
