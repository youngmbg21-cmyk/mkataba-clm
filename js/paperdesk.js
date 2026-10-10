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
const PD_TABS = ['copilot', 'facts', 'doc', 'oblig', 'hist', 'deal'];
/* THE ARTIFACT'S SYMBOLS, EXACTLY (owner, 10 Oct 2026: "use the Symbols that
   were in the artifact before not the ones in hati"): typed marks, each held
   to its text face (U+FE0E), never the left menu's drawings. */
const PD_TAB_GLYPH = { copilot: '\u2726', facts: '\u25A6', doc: '\u25A2', oblig: '\u2691', hist: '\u25F7', deal: '\u21C4' };
const PD_TAB_ICON = PD_TAB_GLYPH;
/* the room's own words for its tabs; Copilot and Deal have no room tab */
const PD_TAB_NAME = { copilot: 'pd_tab_copilot', facts: 'tab_overview', doc: 'tab_document', oblig: 'tab_obligations', hist: 'tab_history', deal: 'pd_tab_deal' };
const PD_HIST_MAX = 40;          // trail rows drawn; the rest are counted and one press away
let _pdTab = 'copilot';
const _pdActs = new Map();       // act id -> function, refilled at every paint (resolved at press time)

const _pdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _pdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _pdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;

function pdSetTab(t){ if (PD_TABS.includes(t)) _pdTab = t; }
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
  let blanks = [];
  try { blanks = (typeof contractBlanksOpen === 'function') ? (contractBlanksOpen(c) || []) : []; } catch (_){ blanks = []; }
  const missing = blanks.length ? pdH(_pdTn('pd_missing', blanks.length, { n: blanks.length }))
    + pdList(blanks.slice(0, 6).map(b => `<div class="pd-row"><i class="is-warn">!</i><span>${_pdE(b.label || b.name || b.key || '')}</span>${pdBtn(_pdT('pd_fill'), pdRoom(c, 'terms'), { go: true })}</div>`).join(''))
    + (blanks.length > 6 ? pdNote(_pdT('pd_more_n', { n: blanks.length - 6 })) : '') : '';
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
  const top = pdTop('facts', blanks.length ? pdPill('warn', _pdTn('pd_missing', blanks.length, { n: blanks.length })) : pdPill('ok', _pdT('pd_st_complete')));
  return top + pdH(_pdT('pd_parties')) + who + pdH(_pdT('pd_terms')) + kv + missing + renew
    + `<div class="pd-acts">${brief}${pdBtn(_pdT('pd_edit_facts'), pdRoom(c, 'terms'))}</div>`
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
    return `<div class="pd-ob ${theirs ? 'is-theirs' : 'is-ours'}"><div class="pd-ob-h"><span class="pd-tag ${theirs ? 'is-theirs' : 'is-ours'}">${_pdE(_pdT(theirs ? 'pd_theirs' : 'pd_ours'))}</span><b>${_pdE(o.desc || o.title || '')}</b></div>
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
const PD_ROOM_TAB = { facts: 'terms', oblig: 'obligations', sign: 'sign', hist: 'history', deal: 'redline', doc: 'contract', copilot: 'terms' };
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
  if (!(window.state && state.view === 'dashboard') && typeof setView === 'function') setView('dashboard');
  igWalk([id], 0, { tab: tab || 'facts' });
  return true;
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

const PD_BODY = { facts: pdFactsHtml, doc: pdDocHtml, oblig: pdObligHtml, hist: pdHistHtml, deal: pdDealHtml };
/* THE TITLE ROW: one button per tab, the lit one carrying its name. `brain`
   is the engine's own words (copilotBrainInfo), said on Copilot's hover. */
function pdHeadHtml(brain){
  const tabs = pdOnPaper() ? PD_TABS : ['copilot'];
  const lit = tabs.includes(_pdTab) ? _pdTab : 'copilot';
  const c = pdOnPaper() ? pdContract() : null;
  return tabs.map(t => {
    const name = _pdT(PD_TAB_NAME[t]);
    const tip = t === 'copilot' && brain ? name + ' · ' + brain : name;
    const on = t === lit, cnt = pdTabCount(t, c);
    return `<button type="button" role="tab" class="pd-tab${on ? ' on' : ''}" data-pd-tab="${t}" aria-selected="${on}" aria-label="${_pdE(cnt ? _pdT('pd_tab_n', { name, n: cnt.n }) : name)}" title="${_pdE(tip)}"><span class="pd-tab-i"><span class="pd-tab-g" aria-hidden="true">${PD_TAB_GLYPH[t]}\uFE0E</span>${cnt ? `<span class="pd-tab-n is-${cnt.tone}">${cnt.n > 99 ? '99+' : cnt.n}</span>` : ''}</span><span class="pd-tab-w">${_pdE(name)}</span></button>`;
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
  const top = host.scrollTop;
  host.innerHTML = pdBodyHtml(c);
  if (host.dataset.for === c.id + ':' + _pdTab) host.scrollTop = top;
  host.dataset.for = c.id + ':' + _pdTab;
}
/* presses, read at press time; a repaint after an act shows what it changed */
if (typeof document !== 'undefined' && !document._pdWired){
  document._pdWired = true;
  document.addEventListener('click', async e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#ig-dock')) return;
    const tab = t.closest('[data-pd-tab]');
    if (tab){ _pdTab = tab.getAttribute('data-pd-tab');
      /* the Deal tab shows their changes on the paper too (Clean | Redlined says which) */
      const p = (typeof intel === 'object' && intel) ? intel.paper : null;
      if (_pdTab === 'deal' && p && !p.red && pdRedOk(pdContract())){ p.red = true; if (typeof igPaintPaper === 'function') igPaintPaper(); }
      if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    const a = t.closest('[data-pd-act]'); const fn = a ? _pdActs.get(a.getAttribute('data-pd-act')) : null;
    if (!fn) return;
    e.preventDefault();
    try { await fn(); } catch (err){ if (typeof toast === 'function') toast((err && err.message) || String(err), 'err'); }
    setTimeout(() => pdPaint(), 0);
  });
}

Object.assign(window, { PD_LOOK_RE, pdRedOk, pdTheirOpen, pdMovedWords, pdChangeKind, PD_NEGO_WAIT_MS, pdNegoThen, pdGoClause, pdSendWaiting, PD_ROOM_TAB, pdOpenOnHome, PD_TAB_ICON, PD_TAB_GLYPH, PD_TAB_NAME, PD_TABS, pdTabCount, pdTabCountPaint, pdTop, pdPill, pdList, pdEmpty, PD_GO_ARROW, PD_HIST_MAX, pdSetTab, pdTab, pdOnPaper, pdShowsDesk, pdHeadHtml, pdBodyHtml, pdDocHtml, pdContract, pdBtn, pdRoom, pdFactsHtml, pdObligHtml,
  pdHistHtml, pdDealHtml, PD_BODY, pdHtml, pdPaint });
