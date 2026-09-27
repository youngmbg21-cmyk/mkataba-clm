// HaTi — extracted module. Globals are window-attached on purpose: the app is
// written against a single global scope (inline onclick handlers, cross-module
// calls); modules give file isolation for editing, not scope isolation.
/* ============================================================
   VIEW: COPILOT'S WORK — THE AGENTS (Young ruled 27 Sep 2026: "Build the
   agents idea", over the "Work Board Options" artifact, option 2)
   ============================================================
   The artifact drew five agents, each a named job with its steps, what is
   ready for a person to look at, and what it finished. The owner picked the
   Agents shape over the Board. This is that page, built on what HaTi already
   does rather than on what the drawing pretended it did.

   ---- EVERY AGENT IS WORK HaTi ALREADY DOES, GATHERED UNDER ITS NAME ----
     round   Their round came back — the other side's pending asks, each with
             the redline co-pilot's first-pass answer (js/redlineplan.js:
             take it, push back, escalate, or read it). Deterministic; it
             spends nothing.
     renew   Renewals — the overnight desk's notice and renewal rows
             (deskItems, js/desknight.js), with the memo HaTi writes at night
             for a contract that has an owner (runRenewalPrep, server).
     paper   New paper — what auto-triage read when a contract arrived or was
             first sent (js/triage.js): brief, standards, obligations, fill.
     late    Late promises — the desk's chase rows: an obligation the other
             side is late on, with the chase ready to send.
     import  Archive import — the import queue's batches (c.migration), the
             contracts in each still waiting for somebody to confirm what was
             read.
   IT IS A READING. NO ROUTE, NO STORE, NO FIELD, NO SPEND (f399 greps this
   file). Every count is borrowed from the function that already owns it, so
   this page cannot print a number the Negotiations list, Home's Prepared for
   you card, the contract's arrival strip or the import page disagree with.

   ---- IT DECIDES NOTHING, AND EVERY ACT IS SOMEBODY ELSE'S ----
   A review panel opens on each item and carries only acts that already exist,
   pressing the very functions their own homes press: the negotiation page
   (openRedlineWorkbench — the one funnel, with its sealed-record wall and its
   blanks question), the notice letter (openNoticeDialog), the chase
   (obligationChase, which asks before it sends), putting a prepared row away
   (deskDismiss), marking what HaTi read as read (triageAck), the Overview and
   the brief (openWorkspace + roomGoTab, openCheckPanel), the import queue.
   Accepting or refusing the other side's change is deliberately NOT offered
   here: that act has one door, the negotiation page's own cards, where the
   desk rule, the review gate, the accept guard and the live-link catch-up
   all run. A second door would drift (THE ONE DOOR). f399 greps this file for
   negoResolve, negoFileChange, negoEditClause and the rest.

   WHAT THE DRAWING HAD AND THIS DOES NOT, said out loud rather than faked:
   "Send back with a note" (it would need a model to redo the work — a spend
   with nobody's press behind it), the Mine/Everyone switch, a live "spent
   today" figure, and the phone. */

/* The five, in the drawing's order. KEYS ARE STABLE ENGLISH; every word a
   reader sees is a dictionary key. */
const AG_KEYS = ['round', 'renew', 'paper', 'late', 'import'];
/* What each agent is. `steps` are the drawing's own, and `review` is the index
   of the step where a person looks — everything before it is the agent's own
   work, the step after it is what is finished. `door` names where its rules
   live, and is drawn only where a person can actually go there. */
const AG_DEF = {
  round:  { icon: 'nego',   review: 4, door: 'standards',
            steps: ['ag_st_read_theirs', 'ag_st_check_std', 'ag_st_past', 'ag_st_prepare', 'ag_st_review', 'ag_st_answered'] },
  renew:  { icon: 'cal',    review: 3, door: 'settings',
            steps: ['ag_st_find_ends', 'ag_st_how_went', 'ag_st_memo', 'ag_st_review', 'ag_st_decided'] },
  paper:  { icon: 'file',   review: 4, door: null,
            steps: ['ag_st_read_it', 'ag_st_brief', 'ag_st_check_std', 'ag_st_find_ob', 'ag_st_review', 'ag_st_read_done'] },
  late:   { icon: 'flag',   review: 2, door: 'obligations',
            steps: ['ag_st_find_late', 'ag_st_draft_chase', 'ag_st_review', 'ag_st_sent'] },
  import: { icon: 'import', review: 2, door: 'import',
            steps: ['ag_st_read_files', 'ag_st_key_terms', 'ag_st_review', 'ag_st_filed'] },
};
/* "Done recently" looks back this far. A window, stated on the section's own
   line — never an unbounded history the page would have to page through. */
const AG_RECENT_DAYS = 14;
/* A list that could grow with the book is bounded, and what it left out is
   counted and said (A CAP IS A FACT). */
const AG_DONE_MAX = 12;

/* THE AGENT ON SCREEN — per sitting, in memory, never stored. A stored
   choice would open somebody on an agent with nothing in it next week. */
let _agSel = null;
function agSel(D){
  if (_agSel && AG_KEYS.includes(_agSel)) return _agSel;
  /* Where nothing is chosen yet, the first agent with work READY leads, so the
     page opens on what is waiting rather than on the first name in a list. */
  const lead = D ? AG_KEYS.find(k => D.agents[k] && D.agents[k].ready.length) : null;
  return lead || AG_KEYS[0];
}
function agSetSel(k){ _agSel = AG_KEYS.includes(k) ? k : AG_KEYS[0]; }

const _agT = (k, v) => (typeof i18t === 'function') ? i18t(k, v || {}) : String(k);
const _agTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v || {}) : String(n);
const _agE = s => (typeof esc === 'function') ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _agIc = (name, cls) => `<svg class="${cls || ''}" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const _agRef = c => (typeof window !== 'undefined' && window.contractRef) ? contractRef(c) : (c && c.id) || '';
/* A DAY IN THE READER'S OWN WORDS, off the history tab's one printer — never
   fmtDocDate, which is the contract's formatter and writes English months. */
function _agDay(iso){
  if (!iso) return '';
  try { if (typeof histWhen === 'function'){ const w = histWhen(iso); return w && w.day ? w.day : String(iso); } } catch (_){}
  const t = Date.parse(String(iso));
  return isNaN(t) ? String(iso) : new Date(t).toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { day: 'numeric', month: 'short' });
}
function _agDaysSince(iso){
  const t = Date.parse(String(iso || ''));
  return isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : null;
}
const _agRecent = iso => { const d = _agDaysSince(iso); return d != null && d <= AG_RECENT_DAYS; };

/* THE BOOK THE AGENTS READ, and it is the live one: an archived or declined
   contract is one nobody is going to act on — the desk's own exclusion. */
function agBook(list){
  const cs = Array.isArray(list) ? list
    : ((typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : []);
  return cs.filter(c => c && !c.archived && c.status !== 'Declined');
}

/* ============================================================
   THE READINGS — plain data, not one character of markup
   ============================================================ */

/* ---- THEIR ROUND CAME BACK ----
   The contracts where the other side has asks waiting on THIS reader —
   negoNeedsYouIds, the one reading the rail's Negotiations door, the list's
   "Waiting on you" band and the workbench's own toolbar all ask — each with
   redlinePlan's answer per ask. Both read `c.changes` RAW: READING MUST NOT
   WRITE, and a page that initialised a negotiation by being looked at would
   stamp clause ids into every contract in the book. */
function agRoundItems(cs){
  const out = [];
  if (typeof negoNeedsYouIds !== 'function') return out;
  let std = 0;
  try { std = (typeof deskCfg === 'function') ? Number(deskCfg().staleDays || 0) : 0; } catch (_){ std = 0; }
  const nowIso = new Date().toISOString();
  for (const c of cs){
    if (!c || !Array.isArray(c.changes) || !c.changes.length) continue;
    let ids = [];
    try { ids = negoNeedsYouIds(c) || []; } catch (_){ ids = []; }
    if (!ids.length) continue;
    const want = new Set(ids.map(String));
    let plan = [];
    try { plan = (typeof redlinePlan === 'function') ? redlinePlan(c).filter(r => want.has(String(r.id))) : []; } catch (_){ plan = []; }
    const tally = { accept: 0, push: 0, escalate: 0, review: 0 };
    plan.forEach(r => { if (tally[r.verdict] != null) tally[r.verdict]++; });
    /* HOW LONG THE OLDEST OF THEIR ASKS HAS WAITED, and whether that is past
       the desk's own standard — the Inspector's asks table asks the same two
       things of the same two functions. */
    const asks = c.changes.filter(x => x && want.has(String(x.id)));
    const since = asks.map(x => String(x.createdAt || '')).filter(Boolean).sort()[0] || '';
    let over = false;
    if (std > 0 && since && typeof deskWorkingDaysBetween === 'function'){
      try { over = deskWorkingDaysBetween(since, nowIso) >= std; } catch (_){ over = false; }
    }
    out.push({ agent: 'round', kind: 'answer', key: 'answer:' + c.id, cid: c.id, c,
      n: ids.length, plan, tally, since, days: _agDaysSince(since), over, std,
      round: (c.negotiation && Number(c.negotiation.round)) || 1,
      tone: over ? 'amber' : '' });
  }
  /* WHAT HAS WAITED LONGEST LEADS — past the standard first. */
  return out.sort((a, b) => (Number(b.over) - Number(a.over)) || ((b.days || 0) - (a.days || 0)));
}
/* ANSWERED, NOT SENT YET: every ask of theirs is answered and a counter of ours
   is still waiting for Send all. `rlUnsentCount` is the number the page's own
   "Send all · N not sent" prints, and it is asked only where a negotiation
   already exists — its reading passes through the negotiation's own
   initialiser, which must never create one here. */
function agRoundDone(cs){
  const out = [];
  if (typeof rlUnsentCount !== 'function') return out;
  for (const c of cs){
    if (!c || !c.negotiation || typeof c.negotiation !== 'object' || !Array.isArray(c.changes)) continue;
    let needs = 1;
    try { needs = (typeof negoNeedsYouIds === 'function') ? negoNeedsYouIds(c).length : 1; } catch (_){ needs = 1; }
    if (needs) continue;
    let n = 0;
    try { n = rlUnsentCount(c, { side: 'owner' }); } catch (_){ n = 0; }
    if (!n) continue;
    out.push({ agent: 'round', kind: 'answered', key: 'answered:' + c.id, cid: c.id, c, n,
      at: String(c.updatedAt || c.lastEdited || '') });
  }
  return out;
}

/* ---- RENEWALS AND LATE PROMISES: the overnight desk, all of it ----
   Home draws AT MOST ONE OF EACH KIND; this page is the door onto the rest
   (desknight.js said the day would come). The same rows, the same keys, the
   same Put away — so a row put away here is gone from Home too. */
function agDeskRows(cs){
  try { return (typeof deskItems === 'function') ? deskItems(cs) : []; } catch (_){ return []; }
}
function agRenewItems(desk){
  return desk.filter(it => it.kind === 'notice' || it.kind === 'renewal').map(it => Object.assign({}, it, {
    agent: 'renew', key: 'desk:' + it.cid + ':' + it.key, deskKey: it.key,
    tone: it.urgent ? (it.kind === 'notice' || it.days <= 14 ? 'ruby' : 'amber') : '' }));
}
/* DECIDED: an answer recorded on the renewal card (or a notice served, which
   is the decision in its strongest form) in the last fortnight. renewalDecisionOf
   is the ONE reading of "is this decided", the card's own. */
function agRenewDone(cs){
  const out = [];
  if (typeof renewalDecisionOf !== 'function') return out;
  for (const c of cs){
    let d = null;
    try { d = renewalDecisionOf(c); } catch (_){ d = null; }
    if (!d || !_agRecent(d.at)) continue;
    out.push({ agent: 'renew', kind: 'decided', key: 'decided:' + c.id, cid: c.id, c, at: d.at, by: d.by || '',
      answer: d.answer, served: !!d.served });
  }
  return out;
}
function agLateItems(desk){
  return desk.filter(it => it.kind === 'chase').map(it => Object.assign({}, it, {
    agent: 'late', key: 'desk:' + it.cid + ':' + it.key, deskKey: it.key, tone: 'ruby' }));
}
/* SENT: a chase stamped on the obligation in the last fortnight — chasedAt is
   written before anything leaves, by obligationChase itself. */
function agLateDone(cs){
  const out = [];
  for (const c of cs){
    for (const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if (!o || !o.chasedAt || !_agRecent(o.chasedAt)) continue;
      out.push({ agent: 'late', kind: 'chased', key: 'chased:' + c.id + ':' + (o.id || ''), cid: c.id, c, ob: o,
        at: o.chasedAt, by: o.chasedBy || '' });
    }
  }
  return out;
}

/* ---- NEW PAPER ----
   triageCards is the arrival strip's own population: read, and nobody has
   acknowledged it. A reading STILL RUNNING is work in flight (triageBusy), and
   is drawn as working rather than as ready. */
function agPaperItems(cs){
  let list = [];
  try { list = (typeof triageCards === 'function') ? triageCards(cs) : []; } catch (_){ list = []; }
  return list.filter(c => !(typeof triageBusy === 'function' && triageBusy(c))).map(c => {
    const t = (typeof triageOf === 'function') ? triageOf(c) : (c.triage || null);
    const pb = t && t.steps && t.steps.playbook;
    const look = (pb && pb.ok) ? ((pb.dev || 0) + (pb.miss || 0)) : 0;
    return { agent: 'paper', kind: 'read', key: 'read:' + c.id, cid: c.id, c, at: (t && t.at) || '',
      look, tone: look ? 'amber' : '' };
  });
}
function agPaperWorking(cs){
  if (typeof triageBusy !== 'function') return [];
  return cs.filter(c => triageBusy(c)).map(c => ({ agent: 'paper', kind: 'reading', key: 'reading:' + c.id, cid: c.id, c }));
}
function agPaperDone(cs){
  const out = [];
  for (const c of cs){
    const t = (typeof triageOf === 'function') ? triageOf(c) : null;
    if (!t || !t.seenAt || !_agRecent(t.seenAt)) continue;
    out.push({ agent: 'paper', kind: 'seen', key: 'seen:' + c.id, cid: c.id, c, at: t.seenAt });
  }
  return out;
}

/* ---- ARCHIVE IMPORT ----
   By BATCH, which is how a person started it and how the import page lists
   it. `c.migration` is the durable record every imported contract carries;
   the in-flight queue is `state.mig`, read raw (migState would create it). */
function agImportBatches(cs){
  const by = new Map();
  for (const c of cs){
    const m = c && c.migration;
    if (!m || typeof m !== 'object') continue;
    const b = String(m.batch || '—');
    if (!by.has(b)) by.set(b, { batch: b, cs: [], review: 0, blocked: 0, at: '', by: '' });
    const g = by.get(b);
    g.cs.push(c);
    if (m.needsReview) g.review++;
    if (m.blocked) g.blocked++;
    if (String(m.importedAt || '') > g.at){ g.at = String(m.importedAt || ''); g.by = String(m.importedBy || ''); }
  }
  return [...by.values()].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
function agImportItems(batches){
  return batches.filter(g => g.review > 0).map(g => ({ agent: 'import', kind: 'import', key: 'import:' + g.batch,
    batch: g.batch, n: g.cs.length, review: g.review, blocked: g.blocked, at: g.at, by: g.by,
    tone: g.blocked ? 'amber' : '' }));
}
function agImportDone(batches){
  return batches.filter(g => g.review === 0 && _agRecent(g.at)).map(g => ({ agent: 'import', kind: 'filed',
    key: 'filed:' + g.batch, batch: g.batch, n: g.cs.length, at: g.at, by: g.by }));
}
function agImportWorking(){
  const M = (typeof state !== 'undefined' && state && state.mig) || null;
  if (!M || !M.running || !Array.isArray(M.queue)) return [];
  const done = M.queue.filter(q => q && q.status && q.status !== 'waiting').length;
  return [{ agent: 'import', kind: 'importing', key: 'importing:' + (M.batch || ''), batch: M.batch || '', done, n: M.queue.length }];
}

/* ---- EVERYTHING, ONCE ----
   ONE READING PER TURN, and it is dropped on a microtask — navCounts' own
   idiom — because the rail's count and the page both ask it inside one paint,
   and nothing that happens afterwards may be answered from it. */
let _agData = null;
function agentsData(list){
  if (!list && _agData) return _agData;
  const cs = agBook(list);
  const desk = agDeskRows(cs);
  const batches = agImportBatches(cs);
  const agents = {
    round:  { ready: agRoundItems(cs), working: [], done: agRoundDone(cs) },
    renew:  { ready: agRenewItems(desk), working: [], done: agRenewDone(cs) },
    paper:  { ready: agPaperItems(cs), working: agPaperWorking(cs), done: agPaperDone(cs) },
    late:   { ready: agLateItems(desk), working: [], done: agLateDone(cs) },
    import: { ready: agImportItems(batches), working: agImportWorking(), done: agImportDone(batches) },
  };
  /* The finished lists are newest first, and bounded. */
  AG_KEYS.forEach(k => {
    const a = agents[k];
    a.done.sort((x, y) => String(y.at || '').localeCompare(String(x.at || '')));
    a.doneMore = Math.max(0, a.done.length - AG_DONE_MAX);
  });
  const ready = AG_KEYS.reduce((n, k) => n + agents[k].ready.length, 0);
  const working = AG_KEYS.reduce((n, k) => n + agents[k].working.length, 0);
  const withReady = AG_KEYS.filter(k => agents[k].ready.length).length;
  const D = { agents, ready, working, withReady };
  if (!list){
    _agData = D;
    try { Promise.resolve().then(() => { _agData = null; }); } catch (_){ _agData = null; }
  }
  return D;
}
/* THE DOOR COUNT IS WHAT IS READY FOR REVIEW — the page head's own number,
   so the rail and the page cannot disagree. */
function agentsDoorCount(){
  try { return agentsData().ready; } catch (_){ return 0; }
}
/* Find one item by its key, among everything on the page. */
function agFind(key){
  const D = agentsData();
  for (const k of AG_KEYS){
    const a = D.agents[k];
    const hit = a.ready.concat(a.working, a.done).find(it => it.key === key);
    if (hit) return hit;
  }
  return null;
}

/* ============================================================
   THE DRAWING — computes nothing
   ============================================================ */
function agStatusLine(a){
  const parts = [];
  if (a.ready.length) parts.push(_agTn('ag_n_ready', a.ready.length, { n: a.ready.length }));
  if (a.working.length) parts.push(_agTn('ag_n_working', a.working.length, { n: a.working.length }));
  return parts.length ? parts.join(' · ') : _agT('ag_idle');
}
function agRowHtml(k, a, on){
  const def = AG_DEF[k];
  return `<button type="button" class="ag-row${on ? ' on' : ''}" data-ag-agent="${k}" aria-current="${on ? 'true' : 'false'}">
      <span class="ag-ic">${_agIc(def.icon)}</span>
      <span class="ag-rb"><span class="ag-nm">${_agE(_agT('ag_' + k))}</span><span class="ag-st">${
        a.working.length ? '<span class="ob-spin" aria-hidden="true"></span>' : ''}${_agE(agStatusLine(a))}</span></span>
      ${a.ready.length ? `<span class="ag-pill" title="${_agE(_agT('ag_ready_title'))}">${a.ready.length}</span>` : '<span></span>'}
    </button>`;
}
function agListHtml(D, sel){
  return `<nav class="ag-list" aria-label="${_agE(_agT('ag_list_label'))}">
      <div class="ag-list-h">${_agE(_agT('ag_list_head', { n: AG_KEYS.length }))}</div>
      ${AG_KEYS.map(k => agRowHtml(k, D.agents[k], k === sel)).join('')}
    </nav>`;
}
/* THE FACTS, and each is true of THIS product: who looks, who pays, when it
   runs. A fact HaTi does not hold (a per-agent spend limit) is not printed. */
function agFactsHtml(k){
  const kv = (label, val) => `<div><dt>${_agE(label)}</dt><dd>${val}</dd></div>`;
  const door = AG_DEF[k].door;
  let rules = '';
  if (door === 'standards') rules = `<button type="button" class="ui-link" data-ag-door="standards">${_agE(_agT('ag_door_standards'))}</button>`;
  else if (door === 'settings' && typeof isAdmin === 'function' && isAdmin() && typeof openSettingsAt === 'function')
    rules = `<button type="button" class="ui-link" data-ag-door="settings">${_agE(_agT('ag_door_settings'))}</button>`;
  else if (door === 'obligations') rules = `<button type="button" class="ui-link" data-ag-door="obligations">${_agE(_agT('ag_door_obligations'))}</button>`;
  else if (door === 'import') rules = `<button type="button" class="ui-link" data-ag-door="import">${_agE(_agT('ag_door_import'))}</button>`;
  return `<dl class="ag-facts">
      ${kv(_agT('ag_f_runs'), _agE(_agT('ag_' + k + '_runs')))}
      ${kv(_agT('ag_f_who'), _agE(_agT('ag_' + k + '_who')))}
      ${kv(_agT('ag_f_pays'), _agE(_agT('ag_' + k + '_pays')))}
      ${rules ? kv(_agT('ag_f_rules'), rules) : ''}
    </dl>`;
}
/* THE STEPS, with how many items stand at each. Before the review step only
   work IN FLIGHT stands anywhere (a reading still running); the review step
   holds what is ready; the last holds what finished in the recent window. */
function agStepsHtml(k, a){
  const def = AG_DEF[k];
  const stp = (label, n, cls) => `<span class="ag-stp ${cls}">${_agE(label)} <b>${n}</b></span>`;
  const arr = '<span class="ag-arr" aria-hidden="true">›</span>';
  const parts = def.steps.map((key, i) => {
    const label = (i + 1) + ' ' + _agT(key);
    if (i < def.review){
      const n = i === 0 ? a.working.length : 0;
      return stp(label, n, n ? 'is-live' : 'is-zero');
    }
    if (i === def.review) return stp(label, a.ready.length, a.ready.length ? 'is-rev' : 'is-zero');
    return stp(label, a.done.length, a.done.length ? 'is-done' : 'is-zero');
  });
  return `<div class="ag-flow" aria-label="${_agE(_agT('ag_steps'))}"><span class="ag-flow-l">${_agE(_agT('ag_steps'))}</span>${parts.join(arr)}</div>`;
}
/* ONE CARD, EVERY KIND. The sentence under the name is the item's own reading
   put into words, and the urgency line is drawn only where there is one. */
function agCardParts(it){
  const c = it.c || null;
  const who = c ? (c.counterparty || _agT('home_no_counterparty')) : '';
  const name = c ? (c.name || '') : '';
  let kind = '', sum = '', urg = '';
  if (it.kind === 'answer'){
    kind = _agT('ag_k_answer');
    const t = it.tally || {};
    const bits = [_agTn('ag_changes', it.n, { n: it.n })];
    if (t.accept) bits.push(_agT('ag_t_accept', { n: t.accept }));
    if (t.push) bits.push(_agT('ag_t_push', { n: t.push }));
    if (t.escalate) bits.push(_agT('ag_t_escalate', { n: t.escalate }));
    if (t.review) bits.push(_agT('ag_t_review', { n: t.review }));
    sum = bits.join(' · ');
    if (it.days != null) urg = (it.days === 0 ? _agT('ag_waiting_today') : _agTn('ag_waiting_days', it.days, { n: it.days }))
      + (it.over ? ' · ' + _agT('ag_past_std', { n: it.std }) : '');
  } else if (it.kind === 'notice'){
    kind = _agT('desk_kind_notice');
    sum = _agT(it.noticeKind === 'non-renewal' ? 'desk_nt_t_nonren' : 'desk_nt_t_term', { who });
    urg = _agTn('desk_days', it.days, { n: it.days }) + ' · ' + _agT('desk_nt_by', { date: _agDay(it.by) });
  } else if (it.kind === 'renewal'){
    kind = _agT('ag_k_renewal');
    const bits = [_agT('desk_ren_by', { date: _agDay(it.w && it.w.decideBy) })];
    if (it.memo) bits.push(_agT(it.prepared ? 'desk_ren_ready' : 'desk_ren_memo'));
    if (it.flags) bits.push(_agTn('desk_ren_flags', it.flags, { n: it.flags }));
    sum = bits.join(' · ');
    urg = it.days < 0 ? _agT('desk_ren_late') : _agTn('desk_days', it.days, { n: it.days });
  } else if (it.kind === 'read'){
    kind = _agT('desk_kind_read');
    sum = (typeof triageLine === 'function' ? triageLine(c) : '') || _agT('ag_read_nothing');
    urg = it.at ? _agT('ag_read_at', { date: _agDay(it.at) }) : '';
  } else if (it.kind === 'reading'){
    kind = _agT('desk_kind_read');
    sum = _agT('ag_reading_now');
  } else if (it.kind === 'chase'){
    kind = _agT('desk_kind_chase');
    sum = String((it.ob && it.ob.desc) || it.what || '');
    urg = _agTn('desk_late', it.days, { n: it.days }) + (it.noAddress ? ' · ' + _agT('desk_chase_noaddr') : '');
  } else if (it.kind === 'import'){
    kind = _agT('ag_k_import');
    sum = _agTn('ag_import_review', it.review, { n: it.review, of: it.n });
    urg = it.blocked ? _agTn('ag_import_blocked', it.blocked, { n: it.blocked }) : '';
  } else if (it.kind === 'importing'){
    kind = _agT('ag_k_import');
    sum = _agT('ag_importing', { done: it.done, n: it.n });
  }
  return { kind, who, name, sum, urg };
}
function agCardHtml(it){
  const p = agCardParts(it);
  const working = it.kind === 'reading' || it.kind === 'importing';
  const ref = it.c ? _agRef(it.c) : (it.batch ? _agT('ag_batch', { b: it.batch }) : '');
  const head = it.c ? `<span class="ag-cp">${_agE(p.who)}</span><span class="ag-cn">${_agE(p.name)}</span>`
    : `<span class="ag-cp">${_agE(_agT('ag_batch', { b: it.batch }))}</span>`;
  const body = `
      <span class="ag-stage ${working ? 'is-working' : 'is-ready'}">${working ? '<span class="ob-spin" aria-hidden="true"></span>' : ''}${
        _agE(_agT(working ? 'ag_stage_working' : 'ag_stage_ready'))}</span>
      <span class="ag-item-top"><span class="ag-kind">${_agE(p.kind)}</span>${it.c ? `<span class="ag-ref">${_agE(ref)}</span>` : ''}</span>
      ${head}
      ${p.sum ? `<span class="ag-sum">${_agE(p.sum)}</span>` : ''}
      ${p.urg ? `<span class="ag-urg${it.tone ? ' is-' + it.tone : ''}">${_agE(p.urg)}</span>` : ''}`;
  /* A READING IN FLIGHT IS NOT A DOOR: there is nothing to review yet, and a
     press that opened an empty panel would be a dead control dressed as a
     live one. */
  if (working) return `<div class="ag-item is-working" data-ag-key="${_agE(it.key)}">${body}</div>`;
  return `<button type="button" class="ag-item${it.tone ? ' is-' + it.tone : ''}" data-ag-open="${_agE(it.key)}" data-ag-key="${_agE(it.key)}"
      aria-label="${_agE([p.kind, p.who || ref, p.name].filter(Boolean).join(' · '))}">${body}</button>`;
}
/* WHAT FINISHED, with what it came to and who did it. Every row is a fact on
   the record; an agent that finished nothing in the window draws no table. */
function agDoneRow(it){
  const c = it.c;
  let what = '', result = '';
  if (it.kind === 'answered'){
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    result = _agTn('ag_done_unsent', it.n, { n: it.n });
  } else if (it.kind === 'decided'){
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    result = it.served ? _agT('ag_done_served') : _agT('rn_decided_' + (it.answer || 'renew'));
  } else if (it.kind === 'seen'){
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    result = (typeof triageLine === 'function' ? triageLine(c) : '') || _agT('ag_done_read');
  } else if (it.kind === 'chased'){
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    result = _agT('ag_done_chased', { what: (it.ob && it.ob.desc) || '' });
  } else if (it.kind === 'filed'){
    what = _agT('ag_batch', { b: it.batch });
    result = _agTn('ag_done_filed', it.n, { n: it.n });
  }
  const door = it.kind === 'answered'
    ? `<button type="button" class="ui-link" data-ag-go="nego" data-ag-cid="${_agE(it.cid)}">${_agE(_agT('ag_send_there'))}</button>` : '';
  return `<tr><td class="w">${_agE(_agDay(it.at))}</td><td class="t" title="${_agE(what)}">${_agE(what)}</td>
    <td>${_agE(result)}${door ? ' ' + door : ''}</td><td class="b">${_agE(it.by || '—')}</td></tr>`;
}
function agDoneHtml(a){
  if (!a.done.length) return '';
  const rows = a.done.slice(0, AG_DONE_MAX);
  return `<section class="ag-card ag-sec" aria-label="${_agE(_agT('ag_done_head'))}">
      <div class="ag-sec-h"><h3>${_agE(_agT('ag_done_head'))}</h3><span class="sub">${_agE(_agT('ag_done_window', { n: AG_RECENT_DAYS }))}</span></div>
      <div class="ag-tbl-wrap"><table class="ag-runs"><thead><tr><th>${_agE(_agT('ag_th_when'))}</th><th>${_agE(_agT('ag_th_what'))}</th><th>${_agE(_agT('ag_th_result'))}</th><th>${_agE(_agT('ag_th_by'))}</th></tr></thead>
      <tbody>${rows.map(agDoneRow).join('')}</tbody></table></div>
      ${a.doneMore ? `<p class="ag-more">${_agE(_agTn('ag_done_more', a.doneMore, { n: a.doneMore }))}</p>` : ''}
    </section>`;
}
/* THE AGENT'S OWN DOOR ONTO NEW WORK, where one exists and is the product's
   own: bringing in more files is the import page, bringing in a contract is
   the upload. The other three start by themselves and say so. */
function agRunHtml(k){
  if (k === 'import') return `<button type="button" class="ui-btn" data-ag-door="import">${_agE(_agT('ag_import_more'))}</button>`;
  if (k === 'paper' && typeof openUploadModal === 'function' && !(typeof canEdit === 'function' && !canEdit()))
    return `<button type="button" class="ui-btn" data-ag-door="upload">${_agE(_agT('ag_upload'))}</button>`;
  return `<span class="ag-self">${_agE(_agT('ag_runs_itself'))}</span>`;
}
function agPageHtml(k, D){
  const a = D.agents[k], def = AG_DEF[k];
  const items = a.working.concat(a.ready);
  return `<section class="ag-card ag-head" aria-label="${_agE(_agT('ag_' + k))}">
      <div class="ag-h-top"><span class="ag-ic is-big">${_agIc(def.icon)}</span><h2>${_agE(_agT('ag_' + k))}</h2><span class="sp"></span>${agRunHtml(k)}</div>
      <p class="ag-does">${_agE(_agT('ag_' + k + '_does'))}</p>
      ${agFactsHtml(k)}
      ${agStepsHtml(k, a)}
    </section>
    <section class="ag-card ag-sec" aria-label="${_agE(_agT('ag_ready_head'))}">
      <div class="ag-sec-h"><h3>${_agE(_agT('ag_ready_head'))}</h3><span class="sub">${_agE(_agTn('ag_n_items', items.length, { n: items.length }))}</span></div>
      ${items.length ? `<div class="ag-items">${items.map(agCardHtml).join('')}</div>`
        : `<p class="ag-empty">${_agE(_agT('ag_' + k + '_idle'))}</p>`}
    </section>
    ${agDoneHtml(a)}`;
}

/* THE PAGE HEAD'S FACTS LINE — painted into the header's own slot, the
   Obligations page's idiom, because it moves on a repaint with no view change. */
function agHeadFacts(D){
  /* Joined with a middle dot as plain text, the Obligations head's own shape. */
  return [D.ready ? _agTn('ag_head_ready', D.ready, { n: D.ready }) : _agT('ag_head_none'),
    D.working ? _agTn('ag_n_working', D.working, { n: D.working }) : '',
    _agT('ag_head_nothing_sent')].filter(Boolean).map(_agE).join(' · ');
}
function agPaintHead(){
  const el = (typeof document !== 'undefined') ? document.getElementById('page-head-facts') : null;
  if (el) el.innerHTML = agHeadFacts(agentsData());
}

function renderAgentsPage(){
  const host = document.getElementById('content'); if (!host) return;
  const D = agentsData();
  const sel = agSel(D);
  host.innerHTML = `<div class="ag-root view-enter" data-ag-root>
      ${agListHtml(D, sel)}
      <div class="ag-main" id="ag-main">${agPageHtml(sel, D)}</div>
    </div>`;
  agWire(host.querySelector('[data-ag-root]'));
  agPaintHead();
  if (typeof setActiveNav === 'function') setActiveNav('agents');
}
/* A REPAINT KEEPS THE READER'S PLACE: the page scroller and the list keep
   their scroll, the way keepScroll does for the in-page filters. */
function agRepaint(){
  if (typeof state === 'undefined' || !state || state.view !== 'agents') return;
  const sc = document.getElementById('content-scroll');
  const top = sc ? sc.scrollTop : 0;
  _agData = null;
  renderAgentsPage();
  if (sc) sc.scrollTop = top;
  if (typeof updateSidebarCounts === 'function') try { updateSidebarCounts(); } catch (_){}
}
/* ONE DELEGATED LISTENER PER ROOT, read off the element at press time. */
function agWire(root){
  if (!root || root.dataset.agBound) return;
  root.dataset.agBound = '1';
  root.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    const ag = t.closest('[data-ag-agent]');
    if (ag){ agSetSel(ag.getAttribute('data-ag-agent')); agRepaint(); return; }
    const op = t.closest('[data-ag-open]');
    if (op){ agOpenItem(op.getAttribute('data-ag-open')); return; }
    const go = t.closest('[data-ag-go]');
    if (go){ agGo(go.getAttribute('data-ag-go'), go.getAttribute('data-ag-cid')); return; }
    const door = t.closest('[data-ag-door]');
    if (door){ agDoor(door.getAttribute('data-ag-door')); return; }
  });
  /* The arrow keys walk the agents list, as a list of five should. */
  root.addEventListener('keydown', ev => {
    const row = ev.target && ev.target.closest ? ev.target.closest('[data-ag-agent]') : null;
    if (!row || (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp')) return;
    ev.preventDefault();
    const i = AG_KEYS.indexOf(row.getAttribute('data-ag-agent'));
    const k = AG_KEYS[(i + (ev.key === 'ArrowDown' ? 1 : AG_KEYS.length - 1)) % AG_KEYS.length];
    agSetSel(k); agRepaint();
    const next = document.querySelector(`[data-ag-agent="${k}"]`); if (next) next.focus();
  });
}
function agDoor(which){
  if (which === 'standards'){ if (typeof setView === 'function') setView('playbook'); return; }
  if (which === 'settings'){ if (typeof openSettingsAt === 'function') openSettingsAt('platform', 'copilot'); return; }
  if (which === 'obligations'){ if (typeof setView === 'function') setView('obligations'); return; }
  if (which === 'import'){ if (typeof setView === 'function') setView('migration'); return; }
  if (which === 'upload'){ if (typeof openUploadModal === 'function') openUploadModal(); return; }
}
/* WHERE THE READER ENDS UP: the contract, on the tab the item is about — the
   desk's own rule (a late promise lands on Obligations, a renewal and what
   HaTi read on the Overview). Every door closes the panel first. */
function agGo(where, cid){
  if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
  const c = (typeof getContract === 'function') ? getContract(cid) : null;
  if (where === 'nego'){ if (typeof openRedlineWorkbench === 'function') openRedlineWorkbench(cid); else if (typeof selectContract === 'function') selectContract(cid); return; }
  if (where === 'import'){ if (typeof setView === 'function') setView('migration'); return; }
  if (!c || typeof openWorkspace !== 'function') return;
  openWorkspace(cid);
  const tab = where === 'oblig' ? 'oblig' : where === 'contract' ? null : 'terms';
  if (tab && typeof roomGoTab === 'function') try { roomGoTab(getContract(cid), tab); } catch (_){}
}

/* ============================================================
   THE REVIEW PANEL — docked on the right, the page stays bright
   ============================================================ */
const AG_TONE = { green: 'is-green', amber: 'is-amber', ruby: 'is-ruby', steel: 'is-steel' };
function agKv(rows){
  return `<dl class="ag-kv">${rows.filter(r => r && r[1] != null && r[1] !== '').map(([k, v]) =>
    `<div><dt>${_agE(k)}</dt><dd>${_agE(v)}</dd></div>`).join('')}</dl>`;
}
function agPanelBody(it){
  const c = it.c;
  if (it.kind === 'answer'){
    const t = it.tally || {};
    const chip = (v, n) => n ? `<span class="ag-tag ${AG_TONE[(window.RLP_VERDICTS && RLP_VERDICTS[v] && RLP_VERDICTS[v].tone) || 'steel']}">${
      _agE(((window.RLP_VERDICTS && RLP_VERDICTS[v]) ? RLP_VERDICTS[v].label : v) + ' ' + n)}</span>` : '';
    const name = r => {
      const raw = r.clause || '';
      try { return (typeof negoClauseName === 'function') ? negoClauseName(raw) : ((typeof clauseNameShown === 'function') ? clauseNameShown(raw) : raw); }
      catch (_){ return raw; }
    };
    const rows = (it.plan || []).map(r => {
      const v = (window.RLP_VERDICTS && RLP_VERDICTS[r.verdict]) || { label: r.verdict, tone: 'steel' };
      return `<div class="ag-chg">
          <div class="ag-chg-t"><b>${_agE(name(r) || _agT('ng_this_clause'))}</b><span class="ag-tag ${AG_TONE[v.tone] || 'is-steel'}">${_agE(v.label)}</span></div>
          ${r.summary ? `<div class="ag-chg-ask">${_agE(_agT('ag_they_ask', { what: r.summary }))}</div>` : ''}
          ${(r.why || []).length ? `<div class="ag-chg-why">${(r.why || []).map(w => _agE(w)).join(' ')}</div>` : ''}
          ${r.precedent ? `<div class="ag-chg-prec">${_agE(r.precedent)}</div>` : ''}
        </div>`;
    }).join('');
    /* An ask the plan could not reach (a stage without js/redlineplan.js) is
       COUNTED rather than dropped: the reader is told how many are waiting. */
    const missing = Math.max(0, it.n - (it.plan || []).length);
    return `<p class="ag-p-meta">${_agE(_agT('ag_round_meta', { r: it.round, date: _agDay(it.since) }))}</p>
      <div class="ag-tally"><b>${_agE(_agTn('ag_changes', it.n, { n: it.n }))}</b>${chip('accept', t.accept)}${chip('push', t.push)}${chip('escalate', t.escalate)}${chip('review', t.review)}</div>
      <p class="ag-p-note">${_agE(_agT('ag_round_rests'))}</p>
      <div class="ag-chgs">${rows}</div>
      ${missing ? `<p class="ag-p-note">${_agE(_agTn('ag_round_unread', missing, { n: missing }))}</p>` : ''}`;
  }
  if (it.kind === 'notice'){
    return agKv([
      [_agT('ag_f_must_go'), _agDay(it.by)],
      [_agT('ag_f_notice'), it.notice ? _agTn('desk_days', it.notice, { n: it.notice }) : ''],
      [_agT('ag_f_ends'), _agDay(it.ends)],
      [_agT('ag_f_days_left'), _agTn('desk_days', it.days, { n: it.days })],
    ]) + `<p class="ag-p-note">${_agE(_agT('ag_notice_note'))}</p>`;
  }
  if (it.kind === 'renewal'){
    return agKv([
      [_agT('ag_f_decide_by'), _agDay(it.w && it.w.decideBy)],
      [_agT('ag_f_notice'), (it.w && it.w.notice) ? _agTn('desk_days', it.w.notice, { n: it.w.notice }) : _agT('ag_none_recorded')],
      [_agT('ag_f_memo'), it.memo ? _agT(it.prepared ? 'ag_memo_night' : 'ag_memo_you') : _agT('ag_memo_none')],
      [_agT('ag_f_look'), it.flags ? _agTn('desk_ren_flags', it.flags, { n: it.flags }) : _agT('ag_none_found')],
    ]) + `<p class="ag-p-note">${_agE(_agT(it.memo ? 'ag_renew_note_memo' : 'ag_renew_note'))}</p>`;
  }
  if (it.kind === 'read'){
    let tiles = [];
    try { tiles = (typeof triageTiles === 'function') ? triageTiles(c) : []; } catch (_){ tiles = []; }
    const tone = x => x.working ? 'is-live' : x.none ? 'is-steel' : x.ok ? 'is-green' : 'is-amber';
    return `<p class="ag-p-meta">${_agE(it.at ? _agT('ag_read_at', { date: _agDay(it.at) }) : '')}</p>
      <ul class="ag-tiles">${tiles.map(x => `<li class="${tone(x)}"><span class="d" aria-hidden="true"></span><span class="b"><b>${
        _agE(_agT(x.headKey))}</b>${x.detail ? `<span>${_agE(x.detail)}</span>` : ''}</span>${x.count != null ? `<span class="n">${_agE(String(x.count))}</span>` : ''}</li>`).join('')}</ul>`;
  }
  if (it.kind === 'chase'){
    const o = it.ob || {};
    const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || '');
    return agKv([
      [_agT('ag_f_what'), o.desc || ''],
      [_agT('ag_f_was_due'), _agDay(due)],
      [_agT('ag_f_late'), _agTn('desk_days', it.days, { n: it.days })],
      [_agT('ag_f_to'), it.noAddress ? _agT('desk_chase_noaddr') : String((c && c.counterpartyEmail) || '')],
    ]) + `<p class="ag-p-note">${_agE(_agT(it.noAddress ? 'ag_chase_noaddr_note' : 'ag_chase_note'))}</p>`;
  }
  if (it.kind === 'import'){
    return agKv([
      [_agT('ag_f_imported'), _agDay(it.at)],
      [_agT('ag_f_by'), it.by || ''],
      [_agT('ag_f_contracts'), String(it.n)],
      [_agT('ag_f_to_check'), String(it.review)],
      [_agT('ag_f_unread'), it.blocked ? String(it.blocked) : ''],
    ]) + `<p class="ag-p-note">${_agE(_agT('ag_import_note'))}</p>`;
  }
  return '';
}
/* THE ACTS — each the product's own, pressing the same function its own home
   presses. The lead act is the ladder's filled button (one per area), the
   rest secondary, and putting away is the ladder's text button. */
function agPanelActs(it){
  const B = (act, label, cls) => `<button type="button" class="${cls === 'lead' ? 'ui-btn ui-btn-primary' : cls === 'link' ? 'ui-link' : 'ui-btn'}" data-ag-act="${act}">${_agE(label)}</button>`;
  const ed = !(typeof canEdit === 'function' && !canEdit());
  if (it.kind === 'answer') return B('nego', _agT('ag_a_answer'), 'lead') + B('overview', _agT('ag_a_overview'), '');
  if (it.kind === 'notice') return B('notice', _agT('desk_nt_read'), 'lead') + B('overview', _agT('ag_a_renewal'), '') + (ed ? B('away', _agT('desk_discard'), 'link') : '');
  if (it.kind === 'renewal') return B('overview', _agT('ag_a_renewal'), 'lead') + (ed ? B('away', _agT('desk_discard'), 'link') : '');
  if (it.kind === 'read'){
    const hasBrief = !!(it.c && (it.c._brief || it.c._hasBrief));
    return B('overview', _agT('ag_a_overview'), 'lead') + (hasBrief ? B('brief', _agT('ag_a_brief'), '') : '')
      + (ed ? B('seen', _agT('ag_a_seen'), 'link') : '');
  }
  if (it.kind === 'chase') return (it.noAddress || !ed ? '' : B('chase', _agT('desk_chase_send'), 'lead'))
    + B('oblig', _agT('ag_a_oblig'), it.noAddress ? 'lead' : '') + (ed ? B('away', _agT('desk_discard'), 'link') : '');
  if (it.kind === 'import') return B('import', _agT('ag_a_import'), 'lead');
  return '';
}
let _agOpenKey = null;
function agOpenItem(key){
  const it = agFind(key);
  if (!it || typeof openSidePanel !== 'function') return;
  _agOpenKey = key;
  const p = agCardParts(it);
  const title = it.c ? [p.kind, _agRef(it.c)].filter(Boolean).join(' · ') : p.kind;
  const head = it.c
    ? `<div class="ag-p-head"><div class="ag-p-who">${_agE(p.who)}</div><div class="ag-p-name">${_agE(p.name)}</div><div class="ag-p-agent">${_agE(_agT('ag_' + it.agent))}</div></div>`
    : `<div class="ag-p-head"><div class="ag-p-who">${_agE(_agT('ag_batch', { b: it.batch }))}</div><div class="ag-p-agent">${_agE(_agT('ag_' + it.agent))}</div></div>`;
  openSidePanel(`<div class="ag-panel" data-ag-panel="${_agE(key)}">
      ${head}
      <div class="ag-p-body">${agPanelBody(it)}</div>
      <div class="ag-p-foot"><div class="ag-p-acts">${agPanelActs(it)}</div>
        <p class="ag-p-line">${_agE(_agT('ag_panel_line'))}</p></div>
    </div>`, { title, label: title, width: '520px' });
  const panel = document.querySelector('[data-ag-panel]');
  if (panel) panel.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest ? ev.target.closest('[data-ag-act]') : null;
    if (b) agRunAct(key, b.getAttribute('data-ag-act'));
  });
}
async function agRunAct(key, act){
  const it = agFind(key);
  if (!it) return;
  const c = it.c ? ((typeof getContract === 'function' && getContract(it.cid)) || it.c) : null;
  if (act === 'nego') return agGo('nego', it.cid);
  if (act === 'overview') return agGo('terms', it.cid);
  if (act === 'oblig') return agGo('oblig', it.cid);
  if (act === 'import') return agGo('import');
  if (act === 'notice'){ if (c && typeof openNoticeDialog === 'function') openNoticeDialog(c); return; }
  if (act === 'brief'){
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    if (!c) return;
    if (typeof selectContract === 'function') selectContract(c.id);
    if (typeof openCheckPanel === 'function') setTimeout(() => { try { openCheckPanel(getContract(c.id) || c, 'brief'); } catch (_){} }, 0);
    return;
  }
  if (act === 'away'){
    if (c && typeof deskDismiss === 'function' && deskDismiss(c, it.deskKey)){
      if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
      if (typeof toast === 'function') toast(_agT('ag_put_away'), 'ok');
      agRepaint();
    }
    return;
  }
  if (act === 'seen'){
    if (c && typeof triageAck === 'function' && triageAck(c)){
      if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
      if (typeof toast === 'function') toast(_agT('ag_marked_read'), 'ok');
      agRepaint();
    }
    return;
  }
  if (act === 'chase'){
    if (typeof obligationChase !== 'function' || !it.ob) return;
    /* obligationChase ASKS BEFORE IT SENDS, says what happened and stamps the
       obligation — nothing here repeats any of it. */
    await obligationChase(it.cid, it.ob.id);
    const still = agFind(key);
    if (!still && typeof closeModal === 'function') try { closeModal(); } catch (_){}
    agRepaint();
    return;
  }
}

Object.assign(window, { AG_KEYS, AG_DEF, AG_RECENT_DAYS, AG_DONE_MAX, agSel, agSetSel, agBook, agentsData, agentsDoorCount,
  agRoundItems, agRoundDone, agRenewItems, agRenewDone, agLateItems, agLateDone, agPaperItems, agPaperWorking, agPaperDone,
  agImportBatches, agImportItems, agImportDone, agImportWorking, agFind, agCardParts, agCardHtml, agPageHtml, agListHtml,
  agStepsHtml, agFactsHtml, agPanelBody, agPanelActs, agOpenItem, agRunAct, agPaintHead, agRepaint, renderAgentsPage });
