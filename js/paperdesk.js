/* ============================================================
   THE PAPER'S DESK — one contract, worked from Home's Paper side
   (Young, 8 Oct 2026: "Yes to all decisions, build them" — the "Home first"
   proposal: the Paper becomes a desk for one contract, its readings beside
   the wording, its acts in place.)
   ============================================================
   A panel beside the paper (#ig-desk, drawn by igPaperHtml on Home only) with
   five tabs — Facts · Obligations · Signing · History · Deal. EVERY TAB IS A
   READING THE CONTRACT'S OWN PAGES ALREADY MAKE, never a second copy:
   ktFactReads (the Overview), obPanelActs (the Obligations tab's acts),
   signBlockers (the list the Sign button reads), roomHistoryEvents (the
   History tab), standsHtml (where the deal stands). Acts open the product's
   own dialogs over Home; only what needs its own page leaves (the signing
   copy, Negotiate, the Overview for editing facts).
   READING MUST NOT WRITE: nothing here initialises a negotiation or saves.
   ============================================================ */
const PD_TABS = ['facts', 'oblig', 'sign', 'hist', 'deal'];
const PD_HIST_MAX = 40;          // trail rows drawn; the rest are counted and one press away
const PD_OPEN_MIN_W = 1000;      // the paper area under which the desk starts folded
let _pdTab = 'facts';
let _pdOpen = null;              // null = decided by the width; true/false = the reader's press, this sitting
const _pdActs = new Map();       // act id -> function, refilled at every paint (resolved at press time)

const _pdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _pdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _pdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;

function pdSetTab(t){ if (PD_TABS.includes(t)) _pdTab = t; _pdOpen = true; }
function pdTab(){ return _pdTab; }
/* the paper area is too narrow to hold the desk beside a full reading width */
function pdNarrow(){
  const host = document.getElementById('ig-paper');
  const w = host ? host.getBoundingClientRect().width : 0;
  return !!w && w < PD_OPEN_MIN_W;
}
function pdIsOpen(){
  if (_pdOpen !== null) return _pdOpen;
  return !pdNarrow();
}
/* ON A LAPTOP THE DESK OPENS OVER THE COPILOT PANEL (the proposal's own
   words: "the wording never gets narrower"): laid exactly over #ig-dock, one
   press ("Copilot") puts the panel back. */
function pdPlaceOver(host){
  const dock = document.getElementById('ig-dock');
  const over = !!(dock && pdNarrow());
  host.classList.toggle('is-over', over);
  if (!over){ host.style.cssText = ''; return false; }
  const r = dock.getBoundingClientRect();
  host.style.cssText = `position:fixed;left:${Math.round(r.left)}px;top:${Math.round(r.top)}px;width:${Math.round(r.width)}px;height:${Math.round(r.height)}px;z-index:30`;
  return true;
}
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
  return pdH(bl.length ? _pdTn('pd_to_settle', bl.length, { n: bl.length }) : _pdT('pd_ready_to_sign')) + rows
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

/* ---- DEAL: where the deal stands, the shared sheet (read RAW) ---- */
function pdDealHtml(c){
  const live = !!(c.negotiation && typeof c.negotiation === 'object') || (Array.isArray(c.changes) && c.changes.length);
  const may = (typeof negoMayStart !== 'function') || !!(negoMayStart(c) || {}).ok;
  const go = (may && typeof openRedlineWorkbench === 'function') ? pdBtn(_pdT('pd_negotiate'), () => openRedlineWorkbench(c.id), { lead: true }) : '';
  if (!live) return pdNote(_pdT('pd_deal_none')) + (go ? `<div class="pd-acts">${go}</div>` : '');
  let sheet = '';
  try { sheet = (typeof standsHtml === 'function') ? standsHtml(c, { lately: false }) : ''; } catch (_){ sheet = ''; }
  return `<div class="pd-deal">${sheet}</div>` + (go ? `<div class="pd-acts">${go}</div>` : '');
}

const PD_BODY = { facts: pdFactsHtml, oblig: pdObligHtml, sign: pdSignHtml, hist: pdHistHtml, deal: pdDealHtml };
function pdHtml(c){
  _pdActs.clear();
  const tabs = PD_TABS.map(t => `<button type="button" role="tab" class="pd-tab${t === _pdTab ? ' on' : ''}" data-pd-tab="${t}" aria-selected="${t === _pdTab}">${_pdE(_pdT('pd_tab_' + t))}</button>`).join('');
  let body = '';
  try { body = PD_BODY[_pdTab](c); } catch (e){ body = pdNote(_pdT('pd_failed')); }
  const back = pdNarrow() ? `<button type="button" class="pd-back" data-pd-fold="1" title="${_pdE(_pdT('pd_back_copilot_title'))}">${_pdE(_pdT('pd_back_copilot'))}</button>` : '';
  /* over the Copilot panel, "‹ Copilot" is the way back; beside the paper, × folds it */
  const x = back ? '' : `<span class="pd-sp"></span><button type="button" class="pd-x" data-pd-fold="1" title="${_pdE(_pdT('pd_fold'))}" aria-label="${_pdE(_pdT('pd_fold'))}">×</button>`;
  return `<div class="pd-tabs" role="tablist">${back}${tabs}${x}</div><div class="pd-body" id="pd-body">${body}</div>`;
}
/* THE ONE PAINTER, called by igPaintPaper after every paint of the paper. */
function pdPaint(c){
  const host = document.getElementById('ig-desk'); if (!host) return;
  c = c || pdContract(); if (!c){ host.hidden = true; return; }
  const open = pdIsOpen();
  host.classList.toggle('is-folded', !open);
  if (!open){
    _pdActs.clear(); host.classList.remove('is-over'); host.style.cssText = '';
    host.innerHTML = `<button type="button" class="pd-unfold" data-pd-fold="0" title="${_pdE(_pdT('pd_unfold'))}">${_pdE(_pdT('pd_unfold_word'))}</button>`;
    host.hidden = false; return;
  }
  const sc = host.querySelector('#pd-body'); const top = sc ? sc.scrollTop : 0;
  pdPlaceOver(host);
  host.innerHTML = pdHtml(c); host.hidden = false;
  const b2 = host.querySelector('#pd-body'); if (b2 && host.dataset.for === c.id + ':' + _pdTab) b2.scrollTop = top;
  host.dataset.for = c.id + ':' + _pdTab;
}
/* presses, read at press time; a repaint after an act shows what it changed */
if (typeof document !== 'undefined' && !document._pdWired){
  document._pdWired = true;
  document.addEventListener('click', async e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !t.closest('#ig-desk')) return;
    const tab = t.closest('[data-pd-tab]');
    if (tab){ _pdTab = tab.getAttribute('data-pd-tab'); pdPaint(); return; }
    const f = t.closest('[data-pd-fold]');
    if (f){ _pdOpen = f.getAttribute('data-pd-fold') === '0'; pdPaint(); return; }
    const a = t.closest('[data-pd-act]'); const fn = a ? _pdActs.get(a.getAttribute('data-pd-act')) : null;
    if (!fn) return;
    e.preventDefault();
    try { await fn(); } catch (err){ if (typeof toast === 'function') toast((err && err.message) || String(err), 'err'); }
    setTimeout(() => pdPaint(), 0);
  });
}

if (typeof window !== 'undefined' && !window._pdResize){
  window._pdResize = true;
  window.addEventListener('resize', () => { const h = document.getElementById('ig-desk'); if (h && !h.hidden && !h.classList.contains('is-folded')) pdPlaceOver(h); });
}

Object.assign(window, { pdNarrow, pdPlaceOver, PD_TABS, PD_HIST_MAX, PD_OPEN_MIN_W, pdSetTab, pdTab, pdIsOpen, pdContract, pdBtn, pdRoom, pdFactsHtml, pdObligHtml,
  pdSignDoor, pdSignHtml, pdHistHtml, pdDealHtml, PD_BODY, pdHtml, pdPaint });
