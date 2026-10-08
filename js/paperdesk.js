/* ============================================================
   THE PAPER'S DESK — one contract, worked from Home's Paper side
   (Young, 8 Oct 2026: "Yes to all decisions, build them" — the "Home first"
   proposal: the Paper becomes a desk for one contract, its readings beside
   the wording, its acts in place.)
   ============================================================
   The tabs of the Copilot panel while Home's Paper holds a contract (Header
   Icons, below) — Overview · Document · Signing · Obligations · History · Deal
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
const PD_TABS = ['copilot', 'facts', 'doc', 'sign', 'oblig', 'hist', 'deal'];
/* each tab's symbol — the one the left menu draws for the same thing */
const PD_TAB_ICON = { copilot: 'spark', facts: 'grid', doc: 'file', sign: 'check', oblig: 'flag', hist: 'clock', deal: 'nego' };
/* the room's own words for its tabs; Copilot and Deal have no room tab */
const PD_TAB_NAME = { copilot: 'pd_tab_copilot', facts: 'tab_overview', doc: 'tab_document', sign: 'tab_signing', oblig: 'tab_obligations', hist: 'tab_history', deal: 'pd_tab_deal' };
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
function pdBtn(label, fn, o){
  o = o || {};
  const dis = o.disabled ? ` disabled aria-disabled="true"${o.why ? ` title="${_pdE(o.why)}"` : ''}` : (o.title ? ` title="${_pdE(o.title)}"` : '');
  return `<button type="button" class="ui-btn ui-btn-sm${o.lead ? ' ui-btn-primary' : ''}" data-pd-act="${o.disabled ? '' : pdAct(fn)}"${dis}>${_pdE(label)}</button>`;
}
/* the room, on a tab — the way out where the work needs its own page */
function pdRoom(c, tab){
  return () => { if (typeof openWorkspace !== 'function') return; openWorkspace(c.id);
    if (tab && typeof roomGoTab === 'function') try { roomGoTab(getContract(c.id), tab); } catch (_){} };
}
const pdH = t => `<div class="pd-h">${_pdE(t)}</div>`;
const pdNote = t => `<p class="pd-note">${_pdE(t)}</p>`;

/* ---- FACTS: the Overview's own reading ---- */
function pdFactsHtml(c){
  const F = (typeof ktFactReads === 'function') ? ktFactReads(c) : {};
  const parties = (typeof contractParties === 'function') ? (contractParties(c) || []) : [];
  const pr = parties.length ? parties : [{ name: (typeof contractParty === 'function' ? contractParty(c) : ''), side: 'ours' }, { name: c.counterparty || '', side: 'theirs' }];
  const ini = n => String(n || '').split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const who = pr.filter(p => p && p.name).map(p => `<div class="pd-party"><i>${_pdE(ini(p.name))}</i><span>${_pdE(p.name)}<small>${_pdE(_pdT(p.side === 'theirs' ? 'pd_side_theirs' : 'pd_side_ours'))}</small></span></div>`).join('');
  /* ktFactReads returns escaped words already */
  const rows = [
    ['pd_f_type', F.contractType], ['pd_f_value', F.money], ['pd_f_eff', F.effDate], ['pd_f_expiry', F.expiry],
    ['pd_f_notice', F.notice], ['pd_f_stage', _pdE((typeof statusLabel === 'function') ? statusLabel(c.status) : (c.status || ''))],
    ['pd_f_owner', _pdE((typeof contractOwnerName === 'function' ? contractOwnerName(c) : '') || '')], ['pd_f_stream', F.stream],
  ].filter(([, v]) => v);
  const kv = `<dl class="pd-kv">${rows.map(([k, v]) => `<dt>${_pdE(_pdT(k))}</dt><dd>${v}</dd>`).join('')}</dl>`;
  let blanks = [];
  try { blanks = (typeof contractBlanksOpen === 'function') ? (contractBlanksOpen(c) || []) : []; } catch (_){ blanks = []; }
  const missing = blanks.length ? pdH(_pdTn('pd_missing', blanks.length, { n: blanks.length }))
    + blanks.slice(0, 6).map(b => `<div class="pd-row"><i class="is-warn">!</i><span>${_pdE(b.label || b.name || b.key || '')}</span>${pdBtn(_pdT('pd_fill'), pdRoom(c, 'terms'))}</div>`).join('')
    + (blanks.length > 6 ? pdNote(_pdT('pd_more_n', { n: blanks.length - 6 })) : '') : '';
  /* THE RENEWAL, where its window is open: the notice desk's own dialog */
  let renew = '';
  try {
    const win = (typeof renewalWindow === 'function') ? renewalWindow(c) : null;
    if (win && win.inWindow && typeof openNoticeDialog === 'function'){
      const say = win.decided ? _pdT('pd_renewal_decided') : _pdT('pd_renewal_by', { date: String(win.decideBy || '').slice(0, 10) });
      renew = pdH(_pdT('pd_renewal')) + `<div class="pd-row"><i class="${win.decided ? 'is-ok' : 'is-warn'}">${win.decided ? '✓' : '!'}</i><span>${_pdE(say)}</span>${pdBtn(_pdT('pd_notice'), () => openNoticeDialog(getContract(c.id) || c))}</div>`;
    }
  } catch (_){ renew = ''; }
  const brief = (typeof openCheckPanel === 'function') ? pdBtn(_pdT('pd_read_brief'), async () => {
    const cc = getContract(c.id) || c;
    try { if (cc._light && !cc._loaded && typeof ensureFull === 'function') await ensureFull(cc); } catch (_){}
    openCheckPanel(getContract(c.id) || cc, 'brief'); }, { lead: true }) : '';
  return pdH(_pdT('pd_parties')) + who + pdH(_pdT('pd_terms')) + kv + missing + renew
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
    return `<div class="pd-ob"><div class="pd-ob-h"><span class="pd-tag ${theirs ? 'is-theirs' : 'is-ours'}">${_pdE(_pdT(theirs ? 'pd_theirs' : 'pd_ours'))}</span><b>${_pdE(o.desc || o.title || '')}</b></div>
      ${due ? `<small>${_pdE(due)}</small>` : ''}<div class="pd-acts">${acts.map(a => pdBtn(a.label, a.run, { lead: a.kind === 'accent', title: a.title })).join('')}${words}</div></div>`;
  }).join('');
  const head = obs.length ? pdH(_pdTn('pd_obs_n', obs.length, { n: obs.length })) : pdNote(_pdT('pd_obs_none'));
  const add = may ? `<div class="pd-acts">${typeof openObligationForm === 'function' ? pdBtn(_pdT('pd_ob_add'), () => openObligationForm(getContract(c.id) || c)) : ''}${typeof runFindObligations === 'function' ? pdBtn(_pdT('pd_ob_find'), () => runFindObligations(getContract(c.id) || c)) : ''}</div>` : '';
  return head + rows + add;
}

/* ---- DOCUMENT: what is still to fill on the paper, the form, the files ----
   The clause list is the strip down the paper's left edge, so it is not drawn
   again here. Blanks come off the paper (contractBlanksOpen); the form owed is
   tplFormPending; PDF and Word are the room's own exports. */
function pdDocHtml(c){
  let blanks = [];
  try { blanks = (typeof contractBlanksOpen === 'function') ? (contractBlanksOpen(c) || []) : []; } catch (_){ blanks = []; }
  let formOwed = false;
  try { formOwed = (typeof tplFormPending === 'function') ? !!tplFormPending(c) : false; } catch (_){ formOwed = false; }
  const fill = blanks.length ? pdH(_pdTn('pd_missing', blanks.length, { n: blanks.length }))
    + blanks.slice(0, 8).map(b => `<div class="pd-row"><i class="is-warn">!</i><span>${_pdE(b.label || b.name || b.key || '')}</span>${pdBtn(_pdT('pd_fill'), pdRoom(c, 'contract'))}</div>`).join('')
    + (blanks.length > 8 ? pdNote(_pdT('pd_more_n', { n: blanks.length - 8 })) : '')
    : pdNote(_pdT('pd_doc_no_blanks'));
  const form = formOwed ? pdH(_pdT('pd_doc_form')) + `<div class="pd-row"><i class="is-warn">!</i><span>${_pdE(_pdT('pd_doc_form_owed'))}</span>${pdBtn(_pdT('pd_doc_form_go'), pdRoom(c, 'contract'), { lead: true })}</div>` : '';
  const files = pdH(_pdT('pd_doc_files')) + `<div class="pd-acts">${typeof exportPDF === 'function' ? pdBtn(_pdT('pd_doc_pdf'), () => exportPDF(getContract(c.id) || c)) : ''}${pdBtn(_pdT('pd_doc_open'), pdRoom(c, 'contract'))}</div>`;
  return form + fill + files + pdNote(_pdT('pd_doc_foot'));
}

/* ---- OPEN ONE CONTRACT ON HOME'S PAPER, ON A TAB, FROM ANYWHERE (the nine
   flow rules' rule 6, Young 8 Oct 2026: approvals leave the Board; the bell and
   the checklist open the contract on the Paper with the approval pack on the
   Signing tab). Below 768px the phone has no Paper: the room's own tab. */
const PD_ROOM_TAB = { facts: 'terms', oblig: 'obligations', sign: 'sign', hist: 'history', deal: 'redline', doc: 'contract', copilot: 'terms' };
function pdOpenOnHome(id, tab){
  const c = (typeof getContract === 'function') ? getContract(id) : null; if (!c) return false;
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
/* THE APPROVAL PACK, where this reader may decide now: the Approvals agent's
   own body (value against your limit, the rule, what departs from our
   standards, the brief) — one builder, drawn here instead of on the Board. */
function pdApprovalPackHtml(c){
  let d = null; try { d = (typeof approvalDecidableNow === 'function') ? approvalDecidableNow(c) : null; } catch (_){ d = null; }
  if (!d || typeof agApproveBody !== 'function') return '';
  let it = null; try { it = (typeof agApproveItems === 'function') ? (agApproveItems() || []).find(x => x && x.cid === c.id) || null : null; } catch (_){ it = null; }
  let body = ''; try { body = agApproveBody(it || { c, rule: '', asker: '', days: 0 }); } catch (_){ body = ''; }
  const acts = (typeof approvalDecideAsk === 'function') ? `<div class="pd-acts">${pdBtn(_pdT('pd_approve'), () => approvalDecideAsk(getContract(c.id) || c, 'approved'), { lead: true })}${pdBtn(_pdT('pd_refuse'), () => approvalDecideAsk(getContract(c.id) || c, 'refused'))}</div>` : '';
  return `<section class="pd-pack" data-pd-pack="1">${pdH(_pdT('pd_pack_head'))}${body}${acts}</section>`;
}
/* ---- SIGNING: the list the Sign button reads, each gap with its act ---- */
function pdSignDoor(c, b){
  const k = b.key;
  if ((k === 'approval' || k === 'signapproval') && typeof approvalDecidableNow === 'function' && approvalDecidableNow(c) && typeof approvalDecideAsk === 'function')
    return pdBtn(_pdT('pd_approve'), () => approvalDecideAsk(getContract(c.id) || c, 'approved'), { lead: true })
      + pdBtn(_pdT('pd_refuse'), () => approvalDecideAsk(getContract(c.id) || c, 'refused'));
  if (k === 'signers' && typeof openSignerPlanEditor === 'function') return pdBtn(_pdT('pd_name_signers'), () => openSignerPlanEditor(getContract(c.id) || c));
  if (k === 'negotiation' && typeof openRedlineWorkbench === 'function') return pdBtn(_pdT('pd_negotiate'), () => openRedlineWorkbench(c.id));
  const door = (typeof caReadyDoor === 'function') ? caReadyDoor(k) : 'sign';
  return pdBtn(_pdT('ca_ready_go_' + door), door === 'nego' ? () => openRedlineWorkbench(c.id) : pdRoom(c, door === 'contract' ? 'contract' : door === 'terms' ? 'terms' : 'sign'));
}
function pdSignHtml(c){
  const signed = (typeof contractSignedAt === 'function') ? contractSignedAt(c) : null;
  if (signed || /^(Signed|Executed|Active|Expired|Terminated)$/.test(String(c.status || '')))
    return pdNote(signed ? _pdT('pd_signed', { when: (typeof fmtDocDate === 'function' && fmtDocDate(String(signed).slice(0, 10))) || String(signed).slice(0, 10) }) : _pdT('pd_signed_nodate')) + `<div class="pd-acts">${pdBtn(_pdT('pd_open_copy'), pdRoom(c, 'sign'))}</div>`;
  let bl = [];
  try { bl = (typeof signBlockers === 'function') ? signBlockers(c) : []; } catch (_){ bl = []; }
  const rows = bl.map(b => `<div class="pd-row"><i class="is-warn">!</i><span>${_pdE(b.label)}</span><span class="pd-row-acts">${pdSignDoor(c, b)}</span></div>`).join('');
  const plan = (typeof signerPlan === 'function') ? signerPlan(c) : [];
  const signers = plan.length ? plan.map(s => `<div class="pd-row"><i class="${s.signed ? 'is-ok' : ''}">${s.signed ? '✓' : '·'}</i><span>${_pdE(s.name || '')}<small>${_pdE(_pdT(s.party === 'internal' ? 'pd_side_ours' : 'pd_side_theirs'))}</small></span><span></span></div>`).join('')
    : pdNote(_pdT('pd_no_signers'));
  const send = (typeof openShareModal === 'function') ? pdBtn(_pdT('pd_send_sign'), () => openShareModal(getContract(c.id) || c, { purpose: 'sign' }),
    { lead: !bl.length, disabled: !!bl.length, why: _pdTn('pd_settle_first', bl.length, { n: bl.length }) }) : '';
  return pdApprovalPackHtml(c) + pdH(bl.length ? _pdTn('pd_to_settle', bl.length, { n: bl.length }) : _pdT('pd_ready_to_sign')) + rows
    + pdH(_pdT('pd_signers')) + signers
    + `<div class="pd-acts">${send}${pdBtn(_pdT('pd_open_copy'), pdRoom(c, 'sign'))}</div>`
    + pdNote(_pdT('pd_sign_foot'));
}

/* ---- HISTORY: the trail, newest first; the cap is said ---- */
function pdHistHtml(c){
  let ev = [];
  try { ev = (typeof roomHistoryEvents === 'function') ? roomHistoryEvents(c).slice().reverse() : []; } catch (_){ ev = []; }
  if (!ev.length) return pdNote(_pdT('pd_hist_none'));
  const shown = ev.slice(0, PD_HIST_MAX);
  const rows = shown.map(e => {
    let w = { day: String(e.at || '').slice(0, 10), time: '' };
    try { if (typeof histWhen === 'function') w = histWhen(e.at) || w; } catch (_){}
    return `<div class="pd-ev"><small>${_pdE([w.day, w.time].filter(Boolean).join(' · '))}</small><span>${_pdE(e.text || e.summary || '')}</span>${e.actor ? `<small>${_pdE(e.actor)}</small>` : ''}</div>`;
  }).join('');
  const more = ev.length > shown.length ? pdNote(_pdT('pd_hist_more', { k: shown.length, n: ev.length })) + `<div class="pd-acts">${pdBtn(_pdT('pd_hist_all'), pdRoom(c, 'history'))}</div>` : '';
  return pdH(_pdTn('pd_hist_n', ev.length, { n: ev.length })) + rows + more;
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
  if (!live) return pdNote(_pdT('pd_deal_none')) + (go ? `<div class="pd-acts">${go}</div>` : '');
  let sheet = '';
  try { sheet = (typeof standsHtml === 'function') ? standsHtml(c, { lately: false }) : ''; } catch (_){ sheet = ''; }
  let unsent = 0;
  try { unsent = (c.negotiation && typeof rlUnsentCount === 'function') ? rlUnsentCount(c, {}) : 0; } catch (_){ unsent = 0; }
  const send = (unsent && may) ? pdBtn(_pdTn('pd_send_waiting', unsent, { n: unsent }), () => pdSendWaiting(getContract(c.id) || c), { lead: true, title: _pdT('pd_send_waiting_title') }) : '';
  const theirs = pdTheirOpen(c);
  const name = ch => { const raw = ch.clauseLabel || ch.headingText || ''; return (typeof clauseNameShown === 'function' && raw) ? clauseNameShown(raw) : raw; };
  const row = ch => `<div class="pd-row pd-chg"><i class="${pdChangeKind(ch) === 'look' ? 'is-warn' : 'is-ok'}">${pdChangeKind(ch) === 'look' ? '!' : '·'}</i><span>${_pdE(name(ch) || _pdT('pd_a_clause'))}${ch.summary ? `<small>${_pdE(ch.summary)}</small>` : ''}</span>${
    may ? pdBtn(_pdT('pd_answer_nego'), () => pdGoClause(getContract(c.id) || c, ch.clauseId)) : ''}</div>`;
  const minor = theirs.filter(ch => pdChangeKind(ch) === 'minor'), look = theirs.filter(ch => pdChangeKind(ch) !== 'minor');
  const changes = theirs.length
    ? (minor.length ? pdH(_pdTn('pd_minor_n', minor.length, { n: minor.length })) + minor.map(row).join('') : '')
      + (look.length ? pdH(_pdTn('pd_look_n', look.length, { n: look.length })) + look.map(row).join('') : '')
      + pdNote(_pdT('pd_sort_foot'))
    : '';
  return (send ? `<div class="pd-acts">${send}</div>` : '') + `<div class="pd-deal">${sheet}</div>` + changes + (go ? `<div class="pd-acts">${go}</div>` : '');
}

const PD_BODY = { facts: pdFactsHtml, doc: pdDocHtml, sign: pdSignHtml, oblig: pdObligHtml, hist: pdHistHtml, deal: pdDealHtml };
/* THE TITLE ROW: one button per tab, the lit one carrying its name. `brain`
   is the engine's own words (copilotBrainInfo), said on Copilot's hover. */
function pdHeadHtml(brain){
  const tabs = pdOnPaper() ? PD_TABS : ['copilot'];
  const lit = tabs.includes(_pdTab) ? _pdTab : 'copilot';
  return tabs.map(t => {
    const name = _pdT(PD_TAB_NAME[t]);
    const tip = t === 'copilot' && brain ? name + ' · ' + brain : name;
    const on = t === lit;
    return `<button type="button" role="tab" class="pd-tab${on ? ' on' : ''}" data-pd-tab="${t}" aria-selected="${on}" aria-label="${_pdE(name)}" title="${_pdE(tip)}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-${PD_TAB_ICON[t]}"/></svg>${on ? `<span class="ig-dock-title pd-tab-w">${_pdE(name)}</span>` : ''}</button>`;
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

Object.assign(window, { PD_LOOK_RE, pdRedOk, pdTheirOpen, pdMovedWords, pdChangeKind, PD_NEGO_WAIT_MS, pdNegoThen, pdGoClause, pdSendWaiting, PD_ROOM_TAB, pdOpenOnHome, pdApprovalPackHtml, PD_TAB_ICON, PD_TAB_NAME, PD_TABS, PD_HIST_MAX, pdSetTab, pdTab, pdOnPaper, pdShowsDesk, pdHeadHtml, pdBodyHtml, pdDocHtml, pdContract, pdBtn, pdRoom, pdFactsHtml, pdObligHtml,
  pdSignDoor, pdSignHtml, pdHistHtml, pdDealHtml, PD_BODY, pdHtml, pdPaint });
