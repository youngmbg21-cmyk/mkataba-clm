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
     link    No link to sign (the SIXTH, Young ruled it 27 Sep 2026, second in
             the list) — a deal whose changes went out but whose other side has
             no working link to answer on, and a deal whose signer's turn has
             come but whose signing link ran out or was cancelled. Read off
             `_reach`, the server's one reading of their links (srvReach); the
             fresh link is the round send, or the Signing tab's own act.
     ours    Our promises (the SEVENTH, owner-ruled 27 Sep 2026) — what OUR side
             owes, due this week or late; the server's runOurPromises emails
             the assignee, else the contract's owner, 7 days before, on the day
             and the day after. Marking it done is the Obligations tab's act.
   THE AGENTS DO THEIR WORK ON THE SERVER (Young ruled 27 Sep 2026: "implement
   all the fixes"): each runs by the clock, on an event or when started, and
   every run is logged with what it did, skipped and cost. THIS PAGE STILL
   TALKS TO NO ROUTE ITSELF — js/agentruns.js is its one door (agentsStatus,
   agentRunNow, agentSendBack, shareKeepOpen, the quiet refresh), and f399 /
   f413 7d grep this file for any other.
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
/* FOUR MORE ON THE BOARD (Young, 7 Oct 2026: yes to Approvals, Requests, Week
   ahead and Dropped threads), first in the card's order. Each is a READING over
   the product's own readings — nothing runs on the server, nothing spends,
   nothing is stored — so they have no Settings row (ST_AGENT_KEYS is the
   server's seven). */
const AG_KEYS = ['approve', 'request', 'week', 'quiet', 'round', 'link', 'renew', 'paper', 'late', 'ours', 'import'];
const AG_READINGS = ['approve', 'request', 'week', 'quiet'];
/* What each agent is. `steps` are the drawing's own, and `review` is the index
   of the step where a person looks — everything before it is the agent's own
   work, the step after it is what is finished. `door` names where its rules
   live, and is drawn only where a person can actually go there. */
const AG_DEF = {
  approve: { icon: 'check', review: 1, door: null, steps: ['ag_st_ap_find', 'ag_st_ap_pack', 'ag_st_review', 'ag_st_ap_decided'] },
  request: { icon: 'req',   review: 1, door: null, steps: ['ag_st_rq_find', 'ag_st_rq_paper', 'ag_st_review', 'ag_st_rq_drafted'] },
  week:    { icon: 'cal',   review: 1, door: null, steps: ['ag_st_wk_find', 'ag_st_review'] },
  quiet:   { icon: 'chat',  review: 1, door: null, steps: ['ag_st_qt_find', 'ag_st_review', 'ag_st_qt_answered'] },
  round:  { icon: 'nego',   review: 4, door: 'standards',
            steps: ['ag_st_read_theirs', 'ag_st_check_std', 'ag_st_past', 'ag_st_prepare', 'ag_st_review', 'ag_st_answered'] },
  link:   { icon: 'out',    review: 2, door: null,
            steps: ['ag_st_find_stuck', 'ag_st_check_link', 'ag_st_review', 'ag_st_link_sent'] },
  renew:  { icon: 'cal',    review: 3, door: 'settings',
            steps: ['ag_st_find_ends', 'ag_st_how_went', 'ag_st_memo', 'ag_st_review', 'ag_st_decided'] },
  paper:  { icon: 'file',   review: 4, door: null,
            steps: ['ag_st_read_it', 'ag_st_brief', 'ag_st_check_std', 'ag_st_find_ob', 'ag_st_review', 'ag_st_read_done'] },
  late:   { icon: 'flag',   review: 2, door: 'obligations',
            steps: ['ag_st_find_late', 'ag_st_draft_chase', 'ag_st_review', 'ag_st_sent'] },
  /* OUR PROMISES (27 Sep 2026, owner-ruled) — the seventh: what OUR side owes,
     and the person who owes it reminded by email 7 days before, on the day
     and the day after (the server's runOurPromises). */
  ours:   { icon: 'check',  review: 2, door: 'obligations',
            steps: ['ag_st_find_ours', 'ag_st_remind_owner', 'ag_st_review', 'ag_st_kept'] },
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
/* The agent last chosen, for a door that lands on the Board instead (the
   page moved there, 7 Oct 2026): null when nobody has chosen one. */
function agSelKey(){ return _agSel; }

const _agT = (k, v) => (typeof i18t === 'function') ? i18t(k, v || {}) : String(k);
const _agTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v || {}) : String(n);
const _agE = s => (typeof esc === 'function') ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _agIc = (name, cls) => `<svg class="${cls || ''}" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const _agRef = c => (typeof window !== 'undefined' && window.contractRef) ? contractRef(c) : (c && c.id) || '';
/* A printed reference wears the one reference face (--font-ref); the rest of
   the line stays in the reading face. */
const _agWhatHtml = (what, c) => {
  const r = c ? _agRef(c) : '';
  const s = String(what || '');
  if (!r || !s.endsWith(r)) return _agE(s);
  return _agE(s.slice(0, s.length - r.length)) + '<span class="hati-ref">' + _agE(r) + '</span>';
};
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
    /* ONE ANSWER PER ASK: where Copilot prepared one when their round arrived,
       it is the answer the card and the panel carry — the co-pilot's quick
       reading stands only where Copilot has not answered. */
    const chById = new Map(c.changes.filter(Boolean).map(x => [String(x.id), x]));
    plan = plan.map(r => {
      const a = (typeof roundPrepOf === 'function') ? roundPrepOf(c, chById.get(String(r.id))) : null;
      return a ? Object.assign({}, r, { verdict: AG_PREP_PLAN[a.verdict] || r.verdict, prepared: true }) : r;
    });
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
    /* HOW MANY COPILOT HAS ALREADY ANSWERED — the answers it prepared when
       their round arrived (runRoundPrep, js/roundprep.js), riding the list. */
    const prepared = (typeof roundPrepOf === 'function') ? asks.filter(x => roundPrepOf(c, x)).length : 0;
    out.push({ agent: 'round', kind: 'answer', key: 'answer:' + c.id, cid: c.id, c, prepared,
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

/* ---- NO LINK TO SIGN (Young ruled 27 Sep 2026: "Fix it and build a sixth
   agent") ----
   TWO KINDS OF STUCK, and both are the SERVER'S reading of the links (`_reach`,
   srvReach) — the light list carries no links, and a second copy of the rule
   here would be free to disagree with the respond route that enforces it.
     reply  our changes went out, nothing of ours is unsent, nothing of theirs
            waits on us — and no copy of theirs can carry an answer back.
            negWhoseMove says exactly that as `why:'nocopy'`, the reading the
            Negotiations list, the contract's head and the phone all ask, so
            this list and the "Waiting on you · No live copy" rows are one set.
     sign   their signer's turn has come and the signing link they hold ran out
            or was cancelled. A route never sent is the Signing tab's business,
            and a contract they sign OUTSIDE HaTi never has a link — the server
            leaves both out, and so does this.
   A deal in dispute is frozen, so what stops it is the dispute, not the link.
   HOW LONG IT HAS BEEN STUCK counts from when the link stopped working, or
   from when our round went out if that came later. */
const AG_LINK_HOWS = new Set(['expired', 'revoked', 'answered', 'overtaken', 'signing', 'undelivered', 'readonly', 'bounced']);
function agLinkItems(cs){
  const out = [];
  for (const c of cs){
    const R = c && c._reach;
    if (!R || typeof R !== 'object') continue;
    if (typeof contractOnHold === 'function' && contractOnHold(c)) continue;
    let move = null;
    try { move = (typeof negoIsLive === 'function' && negoIsLive(c) && typeof negWhoseMove === 'function') ? negWhoseMove(c) : null; }
    catch (_){ move = null; }
    if (move && move.why === 'nocopy'){
      const L = R.last || null;
      const turnAt = (c.negotiation && c.negotiation.turnAt) || '';
      const since = [L && L.at, turnAt].filter(Boolean).map(String).sort().pop() || '';
      out.push({ agent: 'link', kind: 'reply', key: 'reply:' + c.id, cid: c.id, c, last: L, n: move.n || 0,
        since, days: _agDaysSince(since), tone: 'amber' });
    }
    const S = R.sign || null;
    const outside = (typeof signRouteOf === 'function') && signRouteOf(c) === 'outside';
    /* A SIGNER CANNOT SIGN where their link ran out, was cancelled, was used up
       without a signature, or its email was refused (27 Sep 2026: the two
       blind spots closed). */
    if (S && AG_SIGN_STUCK.includes(S.how) && !outside
        && !(typeof negoExecuted === 'function' && negoExecuted(c))){
      out.push({ agent: 'link', kind: 'sign', key: 'sign:' + c.id, cid: c.id, c, sign: S,
        since: S.at || '', days: _agDaysSince(S.at), tone: 'amber' });
    }
    /* ONE PARTY OF SEVERAL WHO CANNOT ANSWER — the deal still reads live on the
       list, because another party can; the agent names the one who cannot. */
    for (const P of (Array.isArray(R.parties) ? R.parties : [])){
      if (!P || !P.partyId) continue;
      out.push({ agent: 'link', kind: 'party', key: 'party:' + c.id + ':' + P.partyId, cid: c.id, c, party: P,
        since: P.at || P.sentAt || '', days: _agDaysSince(P.at || P.sentAt), tone: 'amber' });
    }
    /* A LINK ABOUT TO RUN OUT — before the deal is stuck, not after. An answer's
       only while it is really their move. */
    for (const X of (Array.isArray(R.soon) ? R.soon : [])){
      if (!X || !X.token) continue;
      if (X.kind === 'reply' && !(move && move.k === 'them')) continue;
      if (X.kind === 'sign' && (outside || (typeof negoExecuted === 'function' && negoExecuted(c)))) continue;
      out.push({ agent: 'link', kind: X.kind === 'sign' ? 'soon-sign' : 'soon', key: 'soon:' + c.id + ':' + X.kind, cid: c.id, c,
        soon: X, since: X.ends || '', days: null, left: _agDaysLeft(X.ends), tone: '' });
    }
  }
  /* WHAT IS ALREADY STUCK LEADS, longest first; a link still working follows,
     the soonest to run out first. */
  const soonish = it => it.kind === 'soon' || it.kind === 'soon-sign';
  return out.sort((a, b) => (Number(soonish(a)) - Number(soonish(b)))
    || (soonish(a) ? (a.left || 0) - (b.left || 0) : (b.days || 0) - (a.days || 0)));
}
const AG_SIGN_STUCK = ['expired', 'revoked', 'answered', 'bounced'];
/* Whole days until an instant, never below zero. */
function _agDaysLeft(iso){
  const t = Date.parse(String(iso || ''));
  return isFinite(t) ? Math.max(0, Math.ceil((t - Date.now()) / 86400000)) : null;
}
/* LINK SENT: the server names a working link that went out in the last
   fortnight to a deal whose earlier link had stopped working (`fresh`) — by
   whichever door it went, this page's or the negotiation's own. */
function agLinkDone(cs){
  const out = [];
  for (const c of cs){
    const F = (c && c._reach && Array.isArray(c._reach.fresh)) ? c._reach.fresh : [];
    for (const f of F){
      if (!f || !_agRecent(f.at)) continue;
      out.push({ agent: 'link', kind: 'relinked', key: 'relinked:' + c.id + ':' + (f.kind || ''), cid: c.id, c,
        at: f.at, by: f.by || '', fresh: f });
    }
  }
  return out;
}
/* What became of their link, in one clause. */
function agLinkHow(it){
  const L = it.kind === 'sign' ? it.sign : it.kind === 'party' ? it.party : it.last;
  if (!L) return _agT('ag_how_none');
  if (!AG_LINK_HOWS.has(L.how)) return '';
  const key = (it.kind === 'sign' ? 'ag_how_sign_' : 'ag_how_') + L.how;
  return _agT(key, { when: agOnDay(L.at) });
}
/* "on 24 Sept", or "today" — a day said inside a sentence. */
function agOnDay(iso){
  const t = Date.parse(String(iso || ''));
  if (!isFinite(t)) return '';
  /* The reader's own calendar day, not "within 24 hours". */
  return new Date(t).toDateString() === new Date().toDateString()
    ? _agT('ag_on_today') : _agT('ag_on_day', { date: _agDay(iso) });
}
const agStuckWords = days => days == null ? ''
  : days === 0 ? _agT('ag_stuck_today') : _agTn('ag_stuck_days', days, { n: days });
/* Who it last went to — a name, with the address where the two differ. */
function agSentTo(L){
  if (!L) return '';
  const name = String(L.to || '').trim(), mail = String(L.email || '').trim();
  return (name && mail && name !== mail) ? `${name} (${mail})` : (name || mail);
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
function agLateItems(desk, cs){
  return desk.filter(it => it.kind === 'chase').map(it => Object.assign({}, it, {
    agent: 'late', key: 'desk:' + it.cid + ':' + it.key, deskKey: it.key, tone: 'ruby' }))
    .concat(agLateFirmItems(cs || []));
}
/* ---- THE FIRMER CHASE (27 Sep 2026: "a firmer second one after a set number
   of days") ----
   A promise of theirs chased at least `secondAfter` days ago (the agent's own
   setting, off the server's status; 7 where it has not said) and still not
   done — the desk's own refusals otherwise: theirs, overdue, not held back by
   an earlier step. The chase itself is a person's press (obligationChase with
   `firm`), exactly as the first one is. */
function agLateFirmItems(cs){
  const out = [];
  const a = agStatusOf('late');
  const after = Number(a && a.secondAfter) || 7;
  for (const c of cs){
    if (!c || c.archived || (c.hold && c.hold.at)) continue;
    for (const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if (!o || !o.chasedAt) continue;
      if (typeof obligationIsTheirs === 'function' && !obligationIsTheirs(o)) continue;
      if (typeof obState === 'function' ? obState(o) !== 'overdue' : true) continue;
      if (typeof obligationBlocked === 'function' && obligationBlocked(o, c)) continue;
      const last = o.chaseFirmAt || o.chasedAt;
      const since = _agDaysSince(last);
      if (since == null || since < after) continue;
      const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || null);
      out.push({ agent: 'late', kind: 'chase-firm', key: 'firm:' + c.id + ':' + (o.id || ''), cid: c.id, c, ob: o,
        days: due ? _agDaysSince(due) : 0, since: last, tone: 'ruby',
        noAddress: !/.+@.+\..+/.test(String(c.counterpartyEmail || '').trim()) });
    }
  }
  return out;
}
/* SENT: a chase stamped on the obligation in the last fortnight — chasedAt is
   written before anything leaves, by obligationChase itself. */
function agLateDone(cs){
  const out = [];
  for (const c of cs){
    for (const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if (!o || !o.chasedAt) continue;
      if (_agRecent(o.chasedAt)) out.push({ agent: 'late', kind: 'chased', key: 'chased:' + c.id + ':' + (o.id || ''), cid: c.id, c, ob: o,
        at: o.chasedAt, by: o.chasedBy || '' });
      if (o.chaseFirmAt && _agRecent(o.chaseFirmAt)) out.push({ agent: 'late', kind: 'chased-firm', key: 'chasedfirm:' + c.id + ':' + (o.id || ''), cid: c.id, c, ob: o,
        at: o.chaseFirmAt, by: o.chaseFirmBy || '' });
    }
  }
  return out;
}

/* ---- OUR PROMISES ----
   What OUR side owes, still open, due inside the week or late by no more than
   the daily brief's own thirty days (`od <= 7 && od >= -30`, the server's
   window) — the promises the reminder emails are about. A step held back by an
   earlier one is nobody's work yet (obligationBlocked, the desk's own rule). */
const AG_OURS_AHEAD = 7, AG_OURS_FLOOR = -30;
function agOursItems(cs){
  const out = [];
  for (const c of cs){
    for (const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if (!o || (typeof obligationIsTheirs === 'function' ? obligationIsTheirs(o) : o.party === 'theirs')) continue;
      if (typeof obState === 'function' ? obState(o) === 'done' : o.status === 'done') continue;
      const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || null);
      if (!due || typeof daysUntil !== 'function') continue;
      const days = daysUntil(due);
      if (days == null || days > AG_OURS_AHEAD || days < AG_OURS_FLOOR) continue;
      if (typeof obligationBlocked === 'function' && obligationBlocked(o, c)) continue;
      out.push({ agent: 'ours', kind: 'ours', key: 'ours:' + c.id + ':' + (o.id || due), cid: c.id, c, ob: o, due, days,
        tone: days < 0 ? 'ruby' : days === 0 ? 'amber' : '' });
    }
  }
  return out.sort((a, b) => a.days - b.days);
}
/* KEPT: one of ours marked done in the window, by whoever marked it —
   obligationMarkDone's own stamp. */
function agOursDone(cs){
  const out = [];
  for (const c of cs){
    for (const o of (Array.isArray(c.obligations) ? c.obligations : [])){
      if (!o || !o.completedAt || !_agRecent(o.completedAt)) continue;
      if (typeof obligationIsTheirs === 'function' ? obligationIsTheirs(o) : o.party === 'theirs') continue;
      out.push({ agent: 'ours', kind: 'kept', key: 'kept:' + c.id + ':' + (o.id || ''), cid: c.id, c, ob: o,
        at: o.completedAt, by: o.completedBy || '' });
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
    if (!by.has(b)) by.set(b, { batch: b, cs: [], review: 0, blocked: 0, reading: 0, at: '', by: '' });
    const g = by.get(b);
    g.cs.push(c);
    /* STILL BEING READ ON THE SERVER (27 Sep 2026) is work in flight, not a
       contract waiting for a person — its details are not in yet. */
    if (m.reading === 'queued') g.reading++;
    else if (m.needsReview) g.review++;
    if (m.blocked) g.blocked++;
    if (String(m.importedAt || '') > g.at){ g.at = String(m.importedAt || ''); g.by = String(m.importedBy || ''); }
  }
  return [...by.values()].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
function agImportItems(batches){
  return batches.filter(g => g.review > 0).map(g => ({ agent: 'import', kind: 'import', key: 'import:' + g.batch,
    batch: g.batch, n: g.cs.length, review: g.review, blocked: g.blocked, at: g.at, by: g.by,
    /* The batch's own contracts ride along so the review panel can NAME the
       ones that could not be read and the ones still to check (27 Sep 2026)
       — the counts alone were the whole panel. */
    cs: g.cs, tone: g.blocked ? 'amber' : '' }));
}
function agImportDone(batches){
  return batches.filter(g => g.review === 0 && !g.reading && _agRecent(g.at)).map(g => ({ agent: 'import', kind: 'filed',
    key: 'filed:' + g.batch, batch: g.batch, n: g.cs.length, at: g.at, by: g.by }));
}
function agImportWorking(batches){
  const M = (typeof state !== 'undefined' && state && state.mig) || null;
  const out = [];
  if (M && M.running && Array.isArray(M.queue)){
    const done = M.queue.filter(q => q && q.status && q.status !== 'waiting').length;
    out.push({ agent: 'import', kind: 'importing', key: 'importing:' + (M.batch || ''), batch: M.batch || '', done, n: M.queue.length });
  }
  /* AND WHAT COPILOT IS STILL READING ON THE SERVER — carrying on whether or
     not the tab that started it is open. */
  for (const g of (batches || [])){
    if (!g.reading || out.some(x => x.batch === g.batch)) continue;
    out.push({ agent: 'import', kind: 'importing', key: 'importing:' + g.batch, batch: g.batch, done: g.cs.length - g.reading, n: g.cs.length, server: true });
  }
  return out;
}

/* ============================================================
   THE FOUR READINGS (7 Oct 2026)
   ============================================================ */
/* APPROVALS: what waits on THIS reader's yes — the Approvals page's own rows
   (apApprovalRows, the reader's own only), so the board and that page cannot
   disagree. The pack is read off the record; Approve and Refuse are the
   page's own acts (approvalDecideAsk), drawn only where approvalDecidableNow. */
function agApproveItems(){
  let rows = [];
  try { rows = (typeof apApprovalRows === 'function' ? apApprovalRows() : []) || []; } catch (_){ rows = []; }
  return rows.filter(r => r && r.mine && r.c).map(r => ({ agent: 'approve', kind: 'approve', key: 'approve:' + r.c.id, cid: r.c.id, c: r.c,
    days: r.idle || 0, rule: r.rule && r.rule !== '—' ? r.rule : '', asker: r.who || '', notAsked: !!r.notAsked, tone: (r.idle || 0) >= 3 ? 'amber' : '' }));
}
/* REQUESTS: the bell's own two readings — a request nobody holds yet, and a
   draft a lane made for you (intakeAlertRows / intakeLaneDraftRows). Draft it
   is the Requests page's own door (intakeDraft: the paper suggested, the
   form opened pre-filled; Create is still the person's press). */
function agRequestItems(){
  let open = [], lane = [];
  try { open = (typeof intakeAlertRows === 'function' ? intakeAlertRows() : []) || []; } catch (_){ open = []; }
  try { lane = (typeof intakeLaneDraftRows === 'function' ? intakeLaneDraftRows() : []) || []; } catch (_){ lane = []; }
  const cOf = id => (id && typeof getContract === 'function') ? getContract(id) || null : null;
  return [
    ...lane.map(r => ({ agent: 'request', kind: 'lane', key: 'lane:' + r.id, r, cid: r.contractId, c: cOf(r.contractId), at: r.createdAt || '', days: _agDaysSince(r.createdAt) })),
    ...open.map(r => ({ agent: 'request', kind: 'request', key: 'request:' + r.id, r, cid: null, c: null, at: r.createdAt || '', days: _agDaysSince(r.createdAt),
      tone: (_agDaysSince(r.createdAt) || 0) >= 3 ? 'amber' : '' })),
  ];
}
/* WEEK AHEAD: the next AG_WEEK_DAYS days of the reader's own dates, off the
   Calendar's ONE reading (calendarEvents + calEventMine) — expiries, renewal
   decisions and duties, never a negotiation round — each with the door that
   deals with it. One item, so the card says "N dates" once. */
const AG_WEEK_DAYS = 7;
function agWeekItems(){
  if (typeof calendarEvents !== 'function') return [];
  let evs = [];
  try { evs = calendarEvents() || []; } catch (_){ evs = []; }
  const today = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  const t = new Date(today + 'T00:00:00'); t.setDate(t.getDate() + AG_WEEK_DAYS);
  const end = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  const mine = evs.filter(e => e && e.type !== 'round' && !e.done && e.date >= today && e.date <= end
    && (typeof calEventMine !== 'function' || calEventMine(e)))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!mine.length) return [];
  return [{ agent: 'week', kind: 'week', key: 'week:' + today, evs: mine, from: today, to: end, cid: null, c: null, at: today, n: mine.length }];
}
/* DROPPED THREADS: a note from the other side that nobody on ours has
   answered for AG_QUIET_DAYS or more — the newest note in its thread is
   theirs and not marked done. READ RAW: `c.thread` and each change's
   `thread`, never negoNoteHome (it mints a list). One per contract, the
   oldest wait. */
const AG_QUIET_DAYS = 5;
function agQuietItems(cs){
  const out = [];
  for (const c of cs){
    if (!c || (typeof negoExecuted === 'function' && negoExecuted(c))) continue;
    let worst = null;
    const look = (list, ch) => {
      const L = (Array.isArray(list) ? list : []).filter(m => m && m.at).slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
      const last = L[L.length - 1];
      if (!last || last.side !== 'counterparty' || last.done) return;
      const d = _agDaysSince(last.at);
      if (d == null || d < AG_QUIET_DAYS) return;
      if (!worst || d > worst.days) worst = { m: last, ch, days: d };
    };
    look(c.thread, null);
    (Array.isArray(c.changes) ? c.changes : []).forEach(ch => look(ch && ch.thread, ch));
    if (worst) out.push({ agent: 'quiet', kind: 'quiet', key: 'quiet:' + c.id, cid: c.id, c, note: worst.m, ch: worst.ch, days: worst.days, at: worst.m.at, tone: worst.days >= 10 ? 'amber' : '' });
  }
  return out.sort((a, b) => b.days - a.days);
}

/* ---- EVERYTHING, ONCE ----
   ONE READING PER TURN, and it is dropped on a microtask — navCounts' own
   idiom — because the rail's count and the page both ask it inside one paint,
   and nothing that happens afterwards may be answered from it. */
let _agData = null;
/* The level an admin set for an agent ('auto' · 'ask' · 'mine'), read off
   the status the page already holds; absent = 'ask'. */
function agLevelOf(k){
  try {
    const s = (typeof agentsStatus === 'function') ? agentsStatus() : null;
    const a = s && s.agents && s.agents[k];
    return a && a.level ? String(a.level) : 'ask';
  } catch (_){ return 'ask'; }
}
function agentsData(list){
  if (!list && _agData) return _agData;
  const cs = agBook(list);
  const desk = agDeskRows(cs);
  const batches = agImportBatches(cs);
  const agents = {
    approve: { ready: agApproveItems(), working: [], done: [] },
    request: { ready: agRequestItems(), working: [], done: [] },
    week:    { ready: agWeekItems(), working: [], done: [] },
    quiet:   { ready: agQuietItems(cs), working: [], done: [] },
    round:  { ready: agRoundItems(cs), working: [], done: agRoundDone(cs) },
    link:   { ready: agLinkItems(cs), working: [], done: agLinkDone(cs) },
    renew:  { ready: agRenewItems(desk), working: [], done: agRenewDone(cs) },
    paper:  { ready: agPaperItems(cs), working: agPaperWorking(cs), done: agPaperDone(cs) },
    late:   { ready: agLateItems(desk, cs), working: [], done: agLateDone(cs) },
    ours:   { ready: agOursItems(cs), working: [], done: agOursDone(cs) },
    import: { ready: agImportItems(batches), working: agImportWorking(batches), done: agImportDone(batches) },
  };
  /* LEAVE IT TO ME (the permission ladder, 7 Oct 2026): an agent an admin
     has set so prepares nothing on the Board — it still watches and tells by
     email, as its own runner does. */
  AG_KEYS.forEach(k => { if (agLevelOf(k) === 'mine'){ agents[k].ready = []; agents[k].leftToYou = true; } });
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
/* A ROW'S INSIDE, apart from the row — so a repaint can change what a row
   SAYS without replacing the row the reader is looking at (agPaintList). */
function agRowInner(k, a){
  const def = AG_DEF[k];
  return `<span class="ag-ic">${_agIc(def.icon)}</span>
      <span class="ag-rb"><span class="ag-nm">${_agE(_agT('ag_' + k))}</span><span class="ag-st">${
        a.working.length ? '<span class="ob-spin" aria-hidden="true"></span>' : ''}${_agE(agStatusLine(a))}</span></span>
      ${a.ready.length ? `<span class="ag-pill" title="${_agE(_agT('ag_ready_title'))}">${a.ready.length}</span>` : '<span></span>'}`;
}
function agRowHtml(k, a, on){
  return `<button type="button" class="ag-row${on ? ' on' : ''}" data-ag-agent="${k}" aria-current="${on ? 'true' : 'false'}">${agRowInner(k, a)}</button>`;
}
/* ---- THE LIST IS DRAWN ONCE (Young ruled 27 Sep 2026: "make sure the
   highlighted card stays stagnant and does not move when you click around
   the different agents") ----
   A press rebuilt the whole page — list and all — and put the scroll back
   afterwards, so the column the reader was pressing in was torn out and
   redrawn under their hand. Now the rows are the same elements for as long as
   the page is up: this moves the highlight and rewrites what each row SAYS,
   and never replaces a row. */
function agPaintList(root, D, sel){
  if (!root || !D) return;
  root.querySelectorAll('[data-ag-agent]').forEach(b => {
    const k = b.getAttribute('data-ag-agent');
    const on = k === sel;
    b.classList.toggle('on', on);
    b.setAttribute('aria-current', on ? 'true' : 'false');
    if (D.agents[k]) b.innerHTML = agRowInner(k, D.agents[k]);
  });
}
/* A PRESS ON AN AGENT REPAINTS THE RIGHT SIDE ALONE, and lands at its top —
   another agent is somewhere else to go. */
function agShowAgent(k){
  agSetSel(k);
  const root = (typeof document !== 'undefined') ? document.querySelector('[data-ag-root]') : null;
  if (!root){ renderAgentsPage(); return; }
  const D = agentsData();
  const sel = agSel(D);
  agPaintList(root, D, sel);
  const main = document.getElementById('ag-main');
  if (main){ main.innerHTML = agPageHtml(sel, D); main.scrollTop = 0; }
}
function agListHtml(D, sel){
  return `<nav class="ag-list" aria-label="${_agE(_agT('ag_list_label'))}">
      <div class="ag-list-h">${_agE(_agT('ag_list_head', { n: AG_KEYS.length }))}</div>
      ${AG_KEYS.map(k => agRowHtml(k, D.agents[k], k === sel)).join('')}
    </nav>`;
}
/* THE FACTS, and each is true of THIS product: who looks, who pays, when it
   runs. A fact HaTi does not hold (a per-agent spend limit) is not printed. */
/* ---- HOW THE AGENT IS DOING — the server's log, through js/agentruns.js
   (agentsStatus). Absent (local mode, or before the first answer lands) the
   page says what it always said. ---- */
function agStatusOf(k){
  try {
    const s = (typeof agentsStatus === 'function') ? agentsStatus() : null;
    return s && s.agents ? (s.agents[k] || null) : null;
  } catch (_){ return null; }
}
function agMoneyShown(){
  try { const s = (typeof agentsStatus === 'function') ? agentsStatus() : null; return !!(s && s.money); } catch (_){ return false; }
}
const _agHour = h => String(Number(h) || 0).padStart(2, '0') + ':00';
/* "24 Sept 07:02" — a run is a moment, not a day. */
function _agWhenTime(iso){
  const t = Date.parse(String(iso || ''));
  if (!isFinite(t)) return '';
  let hm = '';
  try { hm = new Date(t).toLocaleTimeString((typeof langLocale === 'function') ? langLocale() : undefined, { hour: '2-digit', minute: '2-digit' }); } catch (_){ hm = ''; }
  return [_agDay(iso), hm].filter(Boolean).join(' ');
}
const _agUsd = n => '$' + (Number(n) || 0).toFixed(Number(n) > 0 && Number(n) < 0.01 ? 4 : 2);
/* WHEN IT RUNS NEXT, in words. */
function agNextWords(k){
  const a = agStatusOf(k);
  if (!a) return _agT('ag_' + k + '_runs');
  const n = a.next || {};
  if (n.kind === 'off') return _agT('ag_next_off');
  if (n.kind === 'event') return _agT('ag_next_event');
  if (n.kind === 'start') return _agT('ag_next_start');
  if (n.kind === 'paused') return _agT('ag_next_paused');
  if (n.kind === 'schedule')
    return _agT(n.day === 'tomorrow' ? 'ag_next_tomorrow' : n.day === 'soon' ? 'ag_next_soon' : 'ag_next_today', { at: _agHour(n.at) });
  return _agT('ag_' + k + '_runs');
}
/* WHAT A RUN DID, SKIPPED AND WHY — every word a dictionary key, every number
   the run's own report. A run that stopped says what stopped it. */
const AG_RESULT_KEYS = ['prepared', 'read', 'ready', 'firm', 'stuck', 'soon', 'checked', 'needReview', 'told', 'reminded', 'failed'];
const AG_STOPS = ['ceiling', 'agentLimit', 'cap', 'off', 'noKey', 'busy', 'gone', 'noStandards'];
function agRunResultWords(run){
  if (!run) return '';
  if (run.error) return _agT('ag_run_error', { why: String(run.error).slice(0, 120) });
  const r = run.result || {};
  const parts = [];
  for (const k of AG_RESULT_KEYS) if (Number(r[k]) > 0) parts.push(_agTn('ag_rr_' + k, Number(r[k]), { n: Number(r[k]) }));
  if (!parts.length) parts.push(_agT('ag_rr_nothing'));
  const sk = (r.skipped && typeof r.skipped === 'object') ? Object.entries(r.skipped).filter(e => Number(e[1]) > 0) : [];
  if (sk.length) parts.push(_agT('ag_rr_skipped', { list: sk.map(e => _agT('ag_skip_' + e[0]) + ' ' + e[1]).join(', ') }));
  for (const w of AG_STOPS) if (r[w]) parts.push(_agT('ag_stop_' + w));
  return parts.join(' · ');
}
/* The agents whose work Copilot does — the ones that spend. */
const AG_SPENDS = ['round', 'renew', 'paper', 'import'];
function agFactsHtml(k){
  const kv = (label, val) => `<div><dt>${_agE(label)}</dt><dd>${val}</dd></div>`;
  const door = AG_DEF[k].door;
  let rules = '';
  if (door === 'standards') rules = `<button type="button" class="ui-link" data-ag-door="standards">${_agE(_agT('ag_door_standards'))}</button>`;
  else if (door === 'settings' && typeof isAdmin === 'function' && isAdmin() && typeof openSettingsAt === 'function')
    rules = `<button type="button" class="ui-link" data-ag-door="settings">${_agE(_agT('ag_door_settings'))}</button>`;
  else if (door === 'obligations') rules = `<button type="button" class="ui-link" data-ag-door="obligations">${_agE(_agT('ag_door_obligations'))}</button>`;
  else if (door === 'import') rules = `<button type="button" class="ui-link" data-ag-door="import">${_agE(_agT('ag_door_import'))}</button>`;
  const a = agStatusOf(k);
  const last = a && Array.isArray(a.runs) && a.runs[0];
  let spent = '';
  if (a && agMoneyShown() && AG_SPENDS.includes(k) && a.spentToday != null){
    const lim = Number(a.cfg && a.cfg.limit) || 0;
    spent = _agE(lim > 0 ? _agT('ag_spent_of', { n: _agUsd(a.spentToday), lim: _agUsd(lim) }) : _agT('ag_spent', { n: _agUsd(a.spentToday) }));
  }
  return `<dl class="ag-facts">
      ${kv(_agT('ag_f_runs'), _agE(agNextWords(k)))}
      ${a ? kv(_agT('ag_f_last'), last ? `<span data-ag-last="${k}">${_agE(_agWhenTime(last.finishedAt || last.at))} · ${_agE(agRunResultWords(last))}</span>`
        : _agE(_agT('ag_never_ran'))) : ''}
      ${kv(_agT('ag_f_who'), _agE(_agT('ag_' + k + '_who')))}
      ${kv(_agT('ag_f_pays'), _agE(_agT('ag_' + k + '_pays')))}
      ${spent ? kv(_agT('ag_f_spent'), spent) : ''}
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
    /* The day it was read is on the card's foot now (agWhen), beside who it is
       for — printed here too it would be one fact twice on one card. */
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
  } else if (it.kind === 'reply'){
    kind = _agT('ag_k_reply');
    sum = [_agTn('ag_reply_out', it.n, { n: it.n }), agLinkHow(it)].filter(Boolean).join(' · ');
    urg = agStuckWords(it.days);
  } else if (it.kind === 'sign'){
    kind = _agT('ag_k_sign');
    sum = [agSignTurnWords(it, who), agLinkHow(it)].filter(Boolean).join(' · ');
    urg = agStuckWords(it.days);
  } else if (it.kind === 'party'){
    kind = _agT('ag_k_party');
    sum = [_agT('ag_party_stuck', { party: (it.party && it.party.party) || '' }), agLinkHow(it)].filter(Boolean).join(' · ');
    urg = agStuckWords(it.days);
  } else if (it.kind === 'soon' || it.kind === 'soon-sign'){
    kind = _agT('ag_k_soon');
    const X = it.soon || {};
    sum = _agT(it.kind === 'soon-sign' ? 'ag_soon_sign' : 'ag_soon_reply', { who: X.signer || X.to || '', date: _agDay(X.ends) });
    urg = _agTn('ag_soon_left', it.left || 0, { n: it.left || 0 });
  } else if (it.kind === 'ours'){
    kind = _agT('ag_k_ours');
    sum = String((it.ob && it.ob.desc) || '');
    urg = it.days < 0 ? _agTn('desk_late', -it.days, { n: -it.days }) : it.days === 0 ? _agT('ag_ours_today') : _agTn('ag_ours_in', it.days, { n: it.days });
  } else if (it.kind === 'chase-firm'){
    kind = _agT('ag_k_chase_firm');
    sum = _agT('ag_firm_sum', { what: String((it.ob && it.ob.desc) || ''), date: _agDay(it.ob && it.ob.chasedAt) });
    urg = _agTn('desk_late', it.days, { n: it.days }) + (it.noAddress ? ' · ' + _agT('desk_chase_noaddr') : '');
  }
  let whoNow = who;
  if (it.kind === 'approve'){
    kind = _agT('ag_k_approve');
    const v = (c && typeof fmtMoneyShortOf === 'function' && (typeof canViewValues !== 'function' || canViewValues()) && c.value) ? fmtMoneyShortOf(c) : '';
    sum = [name, v, it.notAsked ? _agT('sa_pg_not_asked') : _agT('ag_ap_pack')].filter(Boolean).join(' · ');
    urg = it.days ? _agTn('ag_waiting_days', it.days, { n: it.days }) : _agT('ag_waiting_today');
  } else if (it.kind === 'request' || it.kind === 'lane'){
    const R = it.r || {};
    kind = _agT('ag_k_request');
    whoNow = (c && c.counterparty) || R.counterparty || (R.by && R.by.name) || '';
    sum = it.kind === 'lane' ? _agT('ag_rq_lane', { title: R.title || (c && c.name) || '' })
      : _agT('ag_rq_open', { title: R.title || '', who: (R.by && R.by.name) || '' });
    urg = it.days ? _agTn('ag_waiting_days', it.days, { n: it.days }) : _agT('ag_rq_new');
  } else if (it.kind === 'week'){
    kind = _agT('ag_k_week');
    whoNow = _agT('ag_wk_range', { from: _agDay(it.from), to: _agDay(it.to) });
    const by = t => it.evs.filter(e => e.type === t).length;
    sum = [_agTn('ag_wk_n', it.n, { n: it.n }), by('obligation') ? _agTn('ag_wk_duties', by('obligation'), { n: by('obligation') }) : '',
      by('renewal') ? _agTn('ag_wk_decisions', by('renewal'), { n: by('renewal') }) : '', by('expiry') ? _agTn('ag_wk_ends', by('expiry'), { n: by('expiry') }) : ''].filter(Boolean).join(' · ');
    urg = _agT('ag_wk_first', { date: _agDay(it.evs[0].date) });
  } else if (it.kind === 'quiet'){
    kind = _agT('ag_k_quiet');
    sum = _agT('ag_qt_sum', { who: (it.note && it.note.who) || who });
    urg = _agTn('ag_qt_days', it.days, { n: it.days });
  }
  if (it.kind === 'answer' && it.prepared) sum = [_agTn('ag_prepared_n', it.prepared, { n: it.prepared }), sum].join(' · ');
  return { kind, who: whoNow, name, sum, urg };
}
/* Whose turn it is to sign, and how many more on the step are stuck with them. */
function agSignTurnWords(it, fallback){
  const S = it.sign || {};
  const more = Math.max(0, (Number(S.n) || 1) - 1);
  return _agT('ag_sign_turn', { who: S.signer || S.to || fallback || '' })
    + (more ? ' ' + _agTn('ag_sign_turn_more', more, { n: more }) : '');
}
/* ---- WHO IT IS FOR, AND WHEN — the card's foot (Young, 27 Sep 2026: "the
   copilot cards are not comprehensive or detailed compared to the mock up in
   the artifact") ----
   The drawing's foot is an avatar, a time and a cost. The first two are facts
   the record holds and are drawn; THE COST IS NOT, because HaTi books Copilot
   spend per person and per day, never per item — a figure here would be one
   this product invented. Each agent's head already says who pays.
   WHO IT IS FOR is the agent's own "Reviewed by" fact, read off the record:
   the negotiation's lead where the desk is claimed, whoever filed the paper,
   whoever started the import — and the contract's owner otherwise. Nobody
   named, nobody printed. */
const _agInitials = n => String(n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
const _agFirst = n => String(n || '').trim().split(/\s+/)[0] || '';
function agForName(it){
  const c = it && it.c;
  let n = '';
  try {
    if (it.kind === 'import' || it.kind === 'importing') n = String(it.by || '');
    else if (['answer', 'reply', 'party', 'soon'].includes(it.kind) && typeof deskLead === 'function'){ const l = deskLead(c); n = (l && l.name) || ''; }
    else if (it.kind === 'ours'){
      /* THE PERSON THE EMAIL REACHES: the assignee where that is a member,
         else the contract's owner (below). */
      const to = (typeof obligationReminderTo === 'function') ? obligationReminderTo(it.ob) : null;
      n = (to && to.name) || '';
    }
    else if (it.kind === 'read' || it.kind === 'reading'){
      const t = (typeof triageOf === 'function') ? triageOf(c) : (c && c.triage);
      n = (t && t.by) || '';
    }
    if (!n && c && typeof contractOwnerName === 'function') n = contractOwnerName(c) || '';
  } catch (_){ n = ''; }
  return String(n || '').trim();
}
/* "For you" where it is the reader's own, the full name on the hover. */
function agForWords(name, full){
  if (!name) return '';
  let me = '';
  try { me = String(((typeof currentUser === 'function') && currentUser() || {}).name || ''); } catch (_){ me = ''; }
  if (me && me.trim().toLowerCase() === name.trim().toLowerCase()) return _agT('ag_for_you');
  return _agT('ag_for', { who: full ? name : _agFirst(name) });
}
/* WHEN, where the record carries a day for this item. A notice and a renewal
   carry theirs on the card's urgency line already, so they print none here. */
function agWhen(it){
  if (it.kind === 'answer') return it.since ? _agT('ag_w_arrived', { date: _agDay(it.since) }) : '';
  if (it.kind === 'read') return it.at ? _agT('ag_read_at', { date: _agDay(it.at) }) : '';
  if (it.kind === 'chase'){
    const o = it.ob || {};
    const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || '');
    return due ? _agT('ag_w_was_due', { date: _agDay(due) }) : '';
  }
  if (it.kind === 'import') return it.at ? _agT('ag_w_imported', { date: _agDay(it.at) }) : '';
  if (it.kind === 'ours') return it.due ? _agT(it.days < 0 ? 'ag_w_was_due' : 'ag_w_due', { date: _agDay(it.due) }) : '';
  /* WHO IT LAST WENT TO is the fact this card is about, so it takes the slot. */
  if (['reply', 'sign', 'party', 'soon', 'soon-sign'].includes(it.kind)){
    const L = it.kind === 'sign' ? it.sign : it.kind === 'party' ? it.party : (it.kind === 'soon' || it.kind === 'soon-sign') ? it.soon : it.last;
    const to = L && String(L.to || L.email || '').trim();
    return to ? _agT('ag_w_sent_to', { who: to }) : '';
  }
  return '';
}
function agFootHtml(it){
  const who = agForName(it), when = agWhen(it);
  if (!who && !when) return '';
  return `<span class="ag-foot">${who ? `<span class="ag-av" aria-hidden="true">${_agE(_agInitials(who))}</span><span class="ag-for" title="${_agE(agForWords(who, true))}">${_agE(agForWords(who))}</span>` : ''}${
    who && when ? '<span class="ag-dot" aria-hidden="true">·</span>' : ''}${when ? `<span class="ag-when">${_agE(when)}</span>` : ''}</span>`;
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
      ${p.urg ? `<span class="ag-urg${it.tone ? ' is-' + it.tone : ''}">${_agE(p.urg)}</span>` : ''}
      ${agFootHtml(it)}`;
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
  } else if (it.kind === 'chased' || it.kind === 'chased-firm'){
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    result = _agT(it.kind === 'chased-firm' ? 'ag_done_chased_firm' : 'ag_done_chased', { what: (it.ob && it.ob.desc) || '' });
  } else if (it.kind === 'kept'){
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    result = _agT('ag_done_kept', { what: (it.ob && it.ob.desc) || '' });
  } else if (it.kind === 'filed'){
    what = _agT('ag_batch', { b: it.batch });
    result = _agTn('ag_done_filed', it.n, { n: it.n });
  } else if (it.kind === 'relinked'){
    const f = it.fresh || {};
    what = [c.counterparty, _agRef(c)].filter(Boolean).join(' · ');
    const to = f.signer || f.to || f.email || '';
    result = _agT(f.kind === 'sign' ? 'ag_done_fresh_sign' : (f.word ? 'ag_done_fresh_word' : 'ag_done_fresh'), { who: to });
  }
  const door = it.kind === 'answered'
    ? `<button type="button" class="ui-link" data-ag-go="nego" data-ag-cid="${_agE(it.cid)}">${_agE(_agT('ag_send_there'))}</button>` : '';
  return `<tr><td class="w">${_agE(_agDay(it.at))}</td><td class="t" title="${_agE(what)}">${_agWhatHtml(what, c)}</td>
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
  let out = '';
  if (k === 'import') out += `<button type="button" class="ui-btn" data-ag-door="import">${_agE(_agT('ag_import_more'))}</button>`;
  if (k === 'paper' && typeof openUploadModal === 'function' && !(typeof canEdit === 'function' && !canEdit()))
    out += `<button type="button" class="ui-btn" data-ag-door="upload">${_agE(_agT('ag_upload'))}</button>`;
  /* RUN NOW AND THE SETTINGS ARE AN ADMIN'S (the drawing's "Run now"; the
     rules live on the Settings page, never on this one). */
  const a = agStatusOf(k);
  const admin = typeof isAdmin === 'function' && isAdmin();
  if (admin && a && a.on)
    out += `<button type="button" class="ui-btn" data-ag-runnow="${k}"${a.running ? ' disabled aria-disabled="true"' : ''}>${
      _agE(_agT(a.running ? 'ag_running' : 'ag_runnow'))}</button>`;
  if (admin && a && typeof openSettingsAt === 'function')
    out += `<button type="button" class="ui-link" data-ag-door="agentsettings">${_agE(_agT('ag_settings'))}</button>`;
  return out || `<span class="ag-self">${_agE(_agT('ag_runs_itself'))}</span>`;
}
/* ---- EARLIER RUNS (the drawing's table): when, why it ran, what it did, who
   pressed, and — to an admin — what it cost. Bounded, and what it left out is
   counted (A CAP IS A FACT). ---- */
function agRunsHtml(k){
  const a = agStatusOf(k);
  if (!a || !Array.isArray(a.runs) || !a.runs.length) return '';
  const money = agMoneyShown();
  const rows = a.runs.map(r => `<tr data-ag-run="${_agE(r.id)}">
      <td class="w">${_agE(_agWhenTime(r.finishedAt || r.at))}</td>
      <td>${_agE(_agT('ag_why_' + r.trigger))}${r.subject ? ` <span class="ag-sub">${_agE(r.subject)}</span>` : ''}</td>
      <td>${_agE(agRunResultWords(r))}</td>
      <td>${_agE(r.by || _agT('ag_by_hati'))}</td>
      ${money ? `<td class="c">${_agE(r.cost != null ? _agUsd(r.cost) : '—')}</td>` : ''}</tr>`).join('');
  return `<section class="ag-card ag-sec" aria-label="${_agE(_agT('ag_runs_head'))}" data-ag-runs="${k}">
      <div class="ag-sec-h"><h3>${_agE(_agT('ag_runs_head'))}</h3></div>
      <div class="ag-tbl-wrap"><table class="ag-runs"><thead><tr><th>${_agE(_agT('ag_th_when'))}</th><th>${_agE(_agT('ag_th_why'))}</th><th>${
        _agE(_agT('ag_th_result'))}</th><th>${_agE(_agT('ag_th_by'))}</th>${money ? `<th class="c">${_agE(_agT('ag_th_cost'))}</th>` : ''}</tr></thead>
      <tbody>${rows}</tbody></table></div>
      ${a.more ? `<p class="ag-more">${_agE(_agTn('ag_runs_more', a.more, { n: a.more }))}</p>` : ''}
    </section>`;
}
/* RUN NOW. Work Copilot does is paid for, so it asks first and says who pays;
   the two that write only to colleagues run at once. */
async function agRunNowPress(k){
  if (typeof agentRunNow !== 'function') return;
  if (AG_SPENDS.includes(k) && typeof confirmDialog === 'function'){
    const ok = await confirmDialog({ title: _agT('ag_runnow_title', { name: _agT('ag_' + k) }),
      message: _agT('ag_runnow_msg_' + k), confirmLabel: _agT('ag_runnow') });
    if (!ok) return;
  }
  let r = null;
  try { r = await agentRunNow(k); }
  catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return; }
  if (typeof toast === 'function') toast(_agT('ag_runnow_done', { what: agRunResultWords({ result: r || {}, error: r && r.error }) }),
    (r && (r.error || r.ceiling || r.agentLimit || r.noKey)) ? 'warn' : 'ok');
  if (typeof agentsBeat === 'function') try { await agentsBeat(true); } catch (_){}
  agRepaint();
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
    ${agDoneHtml(a)}
    ${agRunsHtml(k)}`;
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
  /* THE PAGE UPDATES ITSELF (js/agentruns.js): the first beat fetches how
     each agent is and repaints once it lands; the watch asks again every half
     minute while this page is on screen. */
  if (typeof agentsWatch === 'function') agentsWatch();
  if (typeof agentsBeat === 'function') agentsBeat(false).catch(() => {});
}
/* A REPAINT KEEPS THE READER'S PLACE, and the list keeps its rows: after an
   act the counts move, so every row's words are rewritten in place and the
   right side is redrawn under its own scroll — never the page around them. */
function agRepaint(){
  /* ---- COPILOT'S WORK LIVES ON THE BOARD (Young, 7 Oct 2026: "Go with Below
     the card") ---- An act pressed in the panel under Prepared by Copilot
     repaints the board it was pressed on: the counts and the panel move, the
     reader's place stays (hbPaintBoard keeps the scroll). */
  if (typeof state !== 'undefined' && state && state.view === 'dashboard'){
    _agData = null;
    if (typeof hbPaintBoard === 'function') try { hbPaintBoard(); } catch (_){}
    if (typeof updateSidebarCounts === 'function') try { updateSidebarCounts(); } catch (_){}
    return;
  }
  if (typeof state === 'undefined' || !state || state.view !== 'agents') return;
  _agData = null;
  const root = document.querySelector('[data-ag-root]');
  if (!root){ renderAgentsPage(); }
  else {
    const sc = document.getElementById('content-scroll');
    const top = sc ? sc.scrollTop : 0;
    const main = document.getElementById('ag-main');
    const mtop = main ? main.scrollTop : 0;
    const D = agentsData();
    const sel = agSel(D);
    agPaintList(root, D, sel);
    if (main){ main.innerHTML = agPageHtml(sel, D); main.scrollTop = mtop; }
    if (sc) sc.scrollTop = top;
    agPaintHead();
  }
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
    if (ag){ agShowAgent(ag.getAttribute('data-ag-agent')); return; }
    const op = t.closest('[data-ag-open]');
    if (op){ agOpenItem(op.getAttribute('data-ag-open')); return; }
    const go = t.closest('[data-ag-go]');
    if (go){ agGo(go.getAttribute('data-ag-go'), go.getAttribute('data-ag-cid')); return; }
    const door = t.closest('[data-ag-door]');
    if (door){ agDoor(door.getAttribute('data-ag-door')); return; }
    const rn = t.closest('[data-ag-runnow]');
    if (rn && !rn.disabled){ agRunNowPress(rn.getAttribute('data-ag-runnow')); return; }
  });
  /* THE WHOLE RECORD IS ASKED FOR ON THE WAY TO THE PRESS (agWarmUp). */
  const warm = ev => {
    const op = ev.target && ev.target.closest ? ev.target.closest('[data-ag-open]') : null;
    if (op) agWarmUp(op.getAttribute('data-ag-open'));
  };
  root.addEventListener('pointerover', warm);
  root.addEventListener('focusin', warm);
  /* The arrow keys walk the agents list, as a list of five should. */
  root.addEventListener('keydown', ev => {
    const row = ev.target && ev.target.closest ? ev.target.closest('[data-ag-agent]') : null;
    if (!row || (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp')) return;
    ev.preventDefault();
    const i = AG_KEYS.indexOf(row.getAttribute('data-ag-agent'));
    const k = AG_KEYS[(i + (ev.key === 'ArrowDown' ? 1 : AG_KEYS.length - 1)) % AG_KEYS.length];
    agShowAgent(k);
    const next = document.querySelector(`[data-ag-agent="${k}"]`); if (next) next.focus();
  });
}
function agDoor(which){
  if (which === 'standards'){ if (typeof setView === 'function') setView('playbook'); return; }
  if (which === 'settings'){ if (typeof openSettingsAt === 'function') openSettingsAt('platform', 'copilot'); return; }
  if (which === 'agentsettings'){ if (typeof openSettingsAt === 'function') openSettingsAt('platform', 'agents'); return; }
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
  const tab = where === 'oblig' ? 'oblig' : where === 'sign' ? 'sign' : where === 'contract' ? null : 'terms';
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
/* ---- THE PANEL IS AS FULL AS THE DRAWING, AND EVERY LINE IS THE RECORD'S
   (Young, 27 Sep 2026: "the copilot cards are not comprehensive or detailed
   compared to the mock up in the artifact") ----
   The first build drew each item as a handful of facts and pointed at the page
   where the rest lived. The drawing's panel carries the work itself — the
   letter, the message, the memo, the brief, the departures, the obligations
   found — and every one of those is ALREADY ON THE RECORD in HaTi: noticeDraft
   writes the letter, the chase route's own dictionary keys write the message,
   the renewal memo and the brief are stored, the standards review and the
   obligations auto-triage found are kept on the contract. So each is drawn
   here from the reading that owns it. NOTHING IS ASKED OF A MODEL, NOTHING IS
   WRITTEN, and every act is still the product's own door.
   WHAT THE DRAWING HAD AND THIS STILL DOES NOT: a cost per item (HaTi books
   spend per person and per day, never per item), editing the letter or the
   message in the panel (the letter's own dialog and the chase route are the
   doors), and answering an ask here (the negotiation page is). */
const AG_DEP_MAX = 6;       // departures drawn from the standards review, then counted
const AG_OBS_MAX = 8;       // obligations drawn from what auto-triage holds, then counted
const AG_LIST_MAX = 8;      // names drawn from an import batch, then counted
const AG_QUOTE_MAX = 240;   // a quoted passage is cut here — it is the quote a reading rests on, not the clause

/* A PANEL SECTION is a small label over what it says — the drawing's own
   `.lbl`, never a band. Empty content draws nothing. */
function agSecHtml(label, inner, attrs){
  if (!inner) return '';
  return `<section class="ag-ps"${attrs || ''}><h4 class="ag-ps-h">${_agE(label)}</h4>${inner}</section>`;
}
const _agMore = n => n > 0 ? `<p class="ag-p-note">${_agE(_agTn('ag_more', n, { n }))}</p>` : '';
const _agCut = (s, n) => { const t = String(s || '').trim(); return t.length > n ? t.slice(0, n).trimEnd() + '…' : t; };

/* ---- THE RECORD, WHOLE, BEFORE ANYTHING READS WHAT ONLY IT CARRIES ----
   The page is drawn off the LIGHT list, and the brief and the renewal memo ride
   only a single contract's own read (`_brief`, `_renewalAdvice` — transport).
   So "Read the brief" opened an EMPTY panel from here (Young reported it
   27 Sep 2026: "the panel comes up but it has no brief in it but when i go
   through the overview door the brief works" — the Overview loads the record
   first). The loader is restoreHeavyFields, the Inspector's own and never
   ensureFull: it adds what the row lacks and copies nothing over what is on
   screen. ONE flight per contract, shared by the panel and the brief door. */
const _agLoads = new Map();
function agLoadWhole(c){
  if (!c || !c._light || c._loaded || typeof restoreHeavyFields !== 'function'
    || typeof API_MODE !== 'function' || !API_MODE()) return null;
  const id = String(c.id);
  if (_agLoads.has(id)) return _agLoads.get(id);
  const p = Promise.resolve().then(() => restoreHeavyFields(c)).catch(() => {})
    .then(() => { _agLoads.delete(id); });
  _agLoads.set(id, p);
  return p;
}
const agLoading = c => !!(c && _agLoads.has(String(c.id)));
/* ---- NO STUTTER ON OPENING A CARD (Young, 29 Sep 2026: "when i open one of
   the new cards, it opens up without a brief and flashed like a stutter then
   the brief appears") ----
   The panel drew off the light row, THEN asked for the whole record, and when
   it landed the whole body was redrawn: the brief popped in and everything
   under it jumped. The "Loading…" line meant to cover the gap never drew,
   because the fetch started after the first paint asked whether one was
   running. Now:
     · the fetch STARTS EARLY — when a pointer rests on a card or it takes
       focus (agWarmUp), only for the kinds whose panel reads what only the
       whole record carries (the brief, the renewal memo);
     · a press WAITS up to AG_OPEN_WAIT_MS for it, so the panel usually opens
       whole the first time;
     · past that, the brief's place is held by a placeholder of a brief's size
       (agSkelHtml), and when it lands only the sections that changed are
       swapped (agPanelRefresh), so nothing around them moves. */
const AG_NEEDS_WHOLE = new Set(['read', 'renewal']);
const AG_OPEN_WAIT_MS = 250;
function agWarmUp(key){
  const it = agFind(key);
  if (it && it.c && AG_NEEDS_WHOLE.has(it.kind)) agLoadWhole(it.c);
}
const agSkelHtml = () => `<div class="ag-skel" role="status" aria-busy="true" aria-label="${_agE(_agT('ct_loading_contract'))}"><span></span><span></span><span></span><span class="s"></span></div>`;

function agPanelBody(it){
  if (it.kind === 'answer') return agAnswerBody(it);
  if (it.kind === 'notice') return agNoticeBody(it);
  if (it.kind === 'renewal') return agRenewalBody(it);
  if (it.kind === 'read') return agReadBody(it);
  if (it.kind === 'chase') return agChaseBody(it);
  if (it.kind === 'import') return agImportBody(it);
  if (['reply', 'sign', 'party', 'soon', 'soon-sign'].includes(it.kind)) return agLinkBody(it);
  if (it.kind === 'chase-firm') return agChaseBody(it);
  if (it.kind === 'ours') return agOursBody(it);
  if (it.kind === 'approve') return agApproveBody(it);
  if (it.kind === 'request' || it.kind === 'lane') return agRequestBody(it);
  if (it.kind === 'week') return agWeekBody(it);
  if (it.kind === 'quiet') return agQuietBody(it);
  return '';
}
/* THE APPROVAL PACK: what an approver needs to say yes in a minute — the
   value against their own signing limit, the rule that asked, who asked and
   since when, the departures from our standards (the stored review's own
   verdicts, agStandardsInner) and the brief's opening (agBriefInner). */
function agApproveBody(it){
  const c = it.c;
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const showMoney = typeof canViewValues !== 'function' || canViewValues();
  const v = (showMoney && c && c.value && typeof fmtMoneyOf === 'function') ? fmtMoneyOf(c) : '';
  /* the reader's own signing limit, in the roster's own sentence */
  let capWords = '';
  try { capWords = (showMoney && me && typeof signCapText === 'function') ? String(signCapText(me) || '') : ''; } catch (_){ capWords = ''; }
  const facts = agKv([[_agT('ag_l_value'), v], [_agT('ag_l_your_limit'), capWords], [_agT('ap_pg_rule'), it.rule],
    [_agT('ap_pg_asked_by'), it.asker], [_agT('ap_pg_waiting'), it.days ? _agTn('ag_waiting_days', it.days, { n: it.days }) : _agT('ag_waiting_today')]]);
  const dep = agStandardsInner(c);
  const brief = agBriefInner(c);
  return facts + agSecHtml(_agT('ag_ap_dep'), dep || `<p class="ag-p-note">${_agE(_agT('ag_ap_no_review'))}</p>`) + agSecHtml(_agT('ag_ap_brief'), brief);
}
function agRequestBody(it){
  const R = it.r || {};
  const facts = agKv([[_agT('ag_l_asked_by'), (R.by && R.by.name) || ''], [_agT('ag_l_asked_on'), _agDay(R.createdAt)],
    [_agT('ag_l_counterparty'), R.counterparty || ''], [_agT('ag_l_value'), R.value ? String(R.value) : ''],
    [_agT('ag_l_needed_by'), R.neededBy ? _agDay(R.neededBy) : ''], [_agT('ag_l_lane'), R.lane ? String(R.lane) : '']]);
  const need = String(R.need || R.description || R.details || '').trim();
  return facts + (need ? agSecHtml(_agT('ag_rq_what'), `<p class="ag-p-text">${_agE(need)}</p>`) : '')
    + `<p class="ag-p-note">${_agE(_agT(it.kind === 'lane' ? 'ag_rq_lane_note' : 'ag_rq_note'))}</p>`;
}
function agWeekBody(it){
  const word = e => _agT(e.type === 'obligation' ? 'ag_wk_t_duty' : e.type === 'renewal' ? 'ag_wk_t_decide' : 'ag_wk_t_ends');
  const act = e => e.type === 'obligation' ? 'oblig' : 'terms';
  const rows = it.evs.map(e => `<div class="ag-wk"><b>${_agE(_agDay(e.date))}</b><span><span class="ag-wk-w">${_agE(e.type === 'obligation' ? (e.note || word(e)) : word(e))}</span><small>${_agE([e.cname, e.cref].filter(Boolean).join(' · '))}</small></span>
      <button type="button" class="ui-btn ui-btn-sm" data-ag-act="go|${_agE(e.cid)}|${act(e)}">${_agE(_agT(act(e) === 'oblig' ? 'ag_a_oblig' : 'ag_a_overview'))}</button></div>`).join('');
  return `<section class="ag-ps"><h4 class="ag-ps-h">${_agE(_agTn('ag_wk_head', it.n, { n: it.n }))}</h4>${rows}</section>
    <p class="ag-p-note">${_agE(_agT('ag_wk_note'))}</p>`;
}
function agQuietBody(it){
  const m = it.note || {};
  const where = it.ch ? (it.ch.clauseLabel || it.ch.clauseId || '') : _agT('ag_qt_contract');
  const r = _agReplies.get(it.key);
  const draft = !r ? '' : r.state === 'busy' ? `<p class="ag-p-note">${_agE(_agT('ag_qt_drafting'))}</p>`
    : r.state === 'err' ? `<p class="ag-p-note is-warn">${_agE(r.why || _agT('ag_qt_draft_failed'))}</p>`
    : agSecHtml(_agT('ag_qt_draft'), `<p class="ag-p-text">${_agE(r.text)}</p><p class="ag-p-note">${_agE(_agT('ag_qt_draft_foot'))}</p>`);
  return agKv([[_agT('ag_l_last_from'), [m.who, _agDay(m.at)].filter(Boolean).join(', ')], [_agT('ag_l_quiet'), _agTn('desk_days', it.days, { n: it.days })], [_agT('ag_l_about'), where]])
    + agSecHtml(_agT('ag_qt_note'), `<p class="ag-p-text">“${_agE(_agCut(m.text, 600))}”</p>`)
    + draft
    + (r ? '' : `<p class="ag-p-note">${_agE(_agT('ag_qt_hint'))}</p>`);
}
/* ---- A REPLY DRAFTED FOR A DROPPED THREAD (step 6, Young 8 Oct 2026) ----
   Copilot writes a short reply on a press (the Copilot chat route, its cost
   on that route's own meter); nothing is filed or sent. "Use this reply"
   opens the notes drawer in the note's OWN room, opens the reply box under
   the note and puts the words in it — the drawer's own Send reply is the one
   way out (rule 2), and the person presses it (rule 7). Kept per sitting. */
const _agReplies = new Map();
const AG_REPLY_WAIT_MS = 4000;
function agReplyPrompt(it){
  const c = it.c || {}, m = it.note || {}, ch = it.ch || null;
  const us = (typeof contractParty === 'function' && contractParty(c)) || 'our company';
  const clause = ch ? [ch.clauseLabel || '', String(ch.newText || ch.oldText || '').slice(0, 2000)].filter(Boolean).join('\n') : '';
  return 'Draft a short reply, on behalf of ' + us + ', to this note from ' + (c.counterparty || 'the other side') + ' about the contract "' + (c.name || '') + '".\n\n'
    + 'Their note:\n<<<\n' + String(m.text || '').slice(0, 2000) + '\n>>>\n\n'
    + (clause ? 'The clause it is about, as it stands:\n<<<\n' + clause + '\n>>>\n\n' : '')
    + 'Rules: three sentences at most; polite and plain; acknowledge their point; promise nothing that changes money, dates, liability or the wording, and say we will come back on any wording in our next round; no greeting line, no sign-off, no headings, no markdown. Write the reply only.';
}
async function agDraftReply(key){
  const it = agFind(key); if (!it) return;
  /* the spend lives with Copilot's other acts (caDraftReply): this page reads */
  if (typeof caDraftReply !== 'function'){ _agReplies.set(key, { state: 'err', why: _agT('ag_qt_draft_failed') }); agRepaint(); return; }
  _agReplies.set(key, { state: 'busy' }); agRepaint();
  const r = await caDraftReply(agReplyPrompt(it), it.cid);
  _agReplies.set(key, r.text ? { state: 'done', text: r.text }
    : { state: 'err', why: r.why === 'nokey' ? _agT('ag_qt_draft_nokey') : r.why === 'empty' ? _agT('ag_qt_draft_empty') : _agT('ag_qt_draft_failed') + (r.msg ? ' — ' + r.msg : '') });
  agRepaint();
}
function agUseReply(key){
  const it = agFind(key); const r = _agReplies.get(key);
  if (!it || !r || r.state !== 'done' || typeof openNotesPanel !== 'function') return;
  const c = (typeof getContract === 'function' && getContract(it.cid)) || it.c;
  const m = it.note || {};
  const nkey = (typeof negoNoteKey === 'function') ? negoNoteKey(m) : String(m.id || m.at || '');
  const room = (typeof negoNoteRoomKey === 'function') ? negoNoteRoomKey(c, m) : '';
  openNotesPanel(c.id, it.ch ? it.ch.id : null, { force: true });
  const css = v => (window.CSS && CSS.escape) ? CSS.escape(v) : String(v).replace(/"/g, '\\"');
  const t0 = Date.now();
  const tick = () => {
    const host = document.getElementById('panel-body');
    if (host){
      const tab = room ? host.querySelector(`[data-rl-np-room="${css(room)}"]:not(.on)`) : null;
      if (tab) tab.click();
      const box = host.querySelector(`[data-rl-np-rin="${css(nkey)}"]`);
      if (box){ box.value = r.text; box.dispatchEvent(new Event('input', { bubbles: true })); try { box.focus(); } catch (_){} return; }
      const reply = host.querySelector(`[data-rl-np-reply="${css(nkey)}"]`);
      if (reply && !reply._agPressed){ reply._agPressed = true; reply.click(); }
    }
    if (Date.now() - t0 < AG_REPLY_WAIT_MS) setTimeout(tick, 120);
    else if (typeof toast === 'function') toast(_agT('ag_qt_use_lost'), 'warn');
  };
  setTimeout(tick, 80);
}

/* ---- THEIR ROUND: every ask, the co-pilot's answer, and THEIR WORDING one
   press away ---- */
function agAnswerBody(it){
  const c = it.c;
  const t = it.tally || {};
  const chip = (v, n) => n ? `<span class="ag-tag ${AG_TONE[(window.RLP_VERDICTS && RLP_VERDICTS[v] && RLP_VERDICTS[v].tone) || 'steel']}">${
    _agE(((window.RLP_VERDICTS && RLP_VERDICTS[v]) ? RLP_VERDICTS[v].label : v) + ' ' + n)}</span>` : '';
  const name = r => {
    const raw = r.clause || '';
    try { return (typeof negoClauseName === 'function') ? negoClauseName(raw) : ((typeof clauseNameShown === 'function') ? clauseNameShown(raw) : raw); }
    catch (_){ return raw; }
  };
  const byId = new Map((Array.isArray(c && c.changes) ? c.changes : []).filter(Boolean).map(x => [String(x.id), x]));
  const rows = (it.plan || []).map(r => {
    const v = (window.RLP_VERDICTS && RLP_VERDICTS[r.verdict]) || { label: r.verdict, tone: 'steel' };
    /* THEIR WORDING is drawn by rlChangeWordingHtml, the ONE builder for "what
       this change proposed", from our chair — in a native <details>, so it
       needs no listener and a press repaints nothing. */
    let words = '';
    const ch = byId.get(String(r.id));
    if (ch && typeof rlChangeWordingHtml === 'function'){ try { words = rlChangeWordingHtml(ch, { side: 'owner' }); } catch (_){ words = ''; } }
    return `<div class="ag-chg">
        <div class="ag-chg-t"><b>${_agE(name(r) || _agT('ng_this_clause'))}</b><span class="ag-tag ${AG_TONE[v.tone] || 'is-steel'}">${_agE(v.label)}</span></div>
        ${r.summary ? `<div class="ag-chg-ask">${_agE(_agT('ag_they_ask', { what: r.summary }))}</div>` : ''}
        ${(!r.prepared && (r.why || []).length) ? `<div class="ag-chg-why">${(r.why || []).map(w => _agE(w)).join(' ')}</div>` : ''}
        ${r.precedent ? `<div class="ag-chg-prec">${_agE(r.precedent)}</div>` : ''}
        ${words ? `<details class="ag-words"><summary>${_agE(_agT('ag_show_wording'))}</summary><div class="ag-words-b">${words}</div></details>` : ''}
        ${agPrepHtml(c, ch)}
      </div>`;
  }).join('');
  /* An ask the plan could not reach (a stage without js/redlineplan.js) is
     COUNTED rather than dropped: the reader is told how many are waiting. */
  const missing = Math.max(0, it.n - (it.plan || []).length);
  /* WHICH BOOK OF YOUR STANDARDS it was measured against — the playbook's own
     name for it, the one the co-pilot read. */
  let book = '';
  try { if (typeof resolvePlaybook === 'function' && typeof playbookKeyFor === 'function'){ const pb = resolvePlaybook(playbookKeyFor(c)); book = (pb && pb.label) || ''; } } catch (_){ book = ''; }
  return `<p class="ag-p-meta">${_agE(_agT('ag_round_meta', { r: it.round, date: _agDay(it.since) }))}${book ? ' · ' + _agE(_agT('ag_round_book', { book })) : ''}</p>
    <div class="ag-tally"><b>${_agE(_agTn('ag_changes', it.n, { n: it.n }))}</b>${chip('accept', t.accept)}${chip('push', t.push)}${chip('escalate', t.escalate)}${chip('review', t.review)}</div>
    <p class="ag-p-note">${_agE(_agT('ag_round_rests'))}</p>
    <div class="ag-chgs">${rows}</div>
    ${missing ? `<p class="ag-p-note">${_agE(_agTn('ag_round_unread', missing, { n: missing }))}</p>` : ''}`;
}

/* ---- COPILOT'S PREPARED ANSWER TO ONE ASK (27 Sep 2026) ----
   What Copilot made of their ask when their round arrived: accept, counter
   (with the wording it would put back) or ask a colleague, with why and the
   standard it rests on. NOTHING IS FILED FROM HERE — answering is the
   negotiation page's own act, where Counter opens the clause editor with this
   wording as a card to Apply. Send back asks Copilot again with a note. */
const AG_PREP_TONE = { accept: 'is-green', counter: 'is-amber', reject: 'is-ruby', escalate: 'is-ruby' };
/* Copilot's three answers, in the co-pilot's own words for the card's tally. */
const AG_PREP_PLAN = { accept: 'accept', counter: 'push', reject: 'push', escalate: 'escalate' };
function agPrepHtml(c, ch){
  const a = (typeof roundPrepOf === 'function' && ch) ? roundPrepOf(c, ch) : null;
  if (!a) return '';
  const key = (typeof roundPrepKey === 'function') ? roundPrepKey(ch.clauseId, ch.newText) : '';
  const ed = !(typeof canEdit === 'function' && !canEdit());
  return `<div class="ag-prep" data-ag-prep="${_agE(key)}">
      <div class="ag-prep-h"><span class="ag-tag ${AG_PREP_TONE[a.verdict] || 'is-steel'}">${_agE(_agT('ag_prep_' + a.verdict))}</span>${
        a.standard ? `<span class="ag-sub">${_agE(_agT('ag_prep_rests', { what: a.standard }))}</span>` : ''}</div>
      ${a.why ? `<p class="ag-p-text">${_agE(a.why)}</p>` : ''}
      ${a.wording ? `<details class="ag-words"><summary>${_agE(_agT('ag_prep_wording'))}</summary><div class="ag-words-b">${_agE(a.wording)}</div></details>` : ''}
      ${a.sentBack ? `<p class="ag-p-note">${_agE(_agT('ag_sent_back_by', { who: a.sentBack.by || '', note: a.sentBack.note || '' }))}</p>` : ''}
      ${ed ? agSendBackHtml('round', key) : ''}
    </div>`;
}
/* ---- SEND BACK WITH A NOTE: one small box under what is being sent back —
   the note IS the confirmation, so no dialog asks again. ---- */
function agSendBackHtml(agent, key){
  return `<div class="ag-sb" data-ag-sb="${_agE(agent)}" data-ag-sb-key="${_agE(key || '')}">
      <button type="button" class="ui-link" data-ag-sb-open>${_agE(_agT('ag_sendback'))}</button>
      <div class="ag-sb-box" hidden>
        <textarea class="ag-sb-note" rows="2" maxlength="600" style="${(typeof HATI_FLD === 'string') ? HATI_FLD : ''}height:auto;min-height:var(--field-h)"
          placeholder="${_agE(_agT('ag_sendback_ph'))}" aria-label="${_agE(_agT('ag_sendback'))}"></textarea>
        <div class="ag-sb-acts"><button type="button" class="ui-btn ui-btn-primary" data-ag-sb-go>${_agE(_agT('ag_sendback_go'))}</button>
          <button type="button" class="ui-link" data-ag-sb-cancel>${_agE(_agT('act_cancel'))}</button>
          <span class="ag-sub">${_agE(_agT('ag_sendback_cost'))}</span></div>
      </div>
    </div>`;
}
async function agSendBackPress(key, box){
  const it = agFind(key);
  if (!it || !box || typeof agentSendBack !== 'function') return;
  const agent = box.getAttribute('data-ag-sb');
  const note = String((box.querySelector('.ag-sb-note') || {}).value || '').trim();
  if (!note){ if (typeof toast === 'function') toast(_agT('ag_sendback_empty'), 'warn'); return; }
  const go = box.querySelector('[data-ag-sb-go]');
  if (go){ go.disabled = true; go.textContent = _agT('ag_sendback_busy'); }
  let r = null;
  try { r = await agentSendBack(agent, { contractId: it.cid, key: box.getAttribute('data-ag-sb-key') || '', note }); }
  catch (e){
    if (go){ go.disabled = false; go.textContent = _agT('ag_sendback_go'); }
    if (typeof toast === 'function') toast((e && e.message) || String(e), 'err');
    return;
  }
  /* The new answer, where the route handed it back, is taken at once; the rest
     comes with the page's own quiet refresh. */
  const c = (typeof getContract === 'function' && getContract(it.cid)) || it.c;
  if (c && r && r.advice) c._renewalAdvice = r.advice;
  if (typeof agentsBeat === 'function') try { await agentsBeat(true); } catch (_){}
  if (typeof toast === 'function') toast(_agT('ag_sendback_done'), 'ok');
  agRepaint();
  agPanelRefresh(key);
}

/* ---- A NOTICE: the facts, why, and THE LETTER itself — noticeDraft's own
   text, the words the letter's dialog copies. Written from the record. ---- */
function agNoticeBody(it){
  const c = it.c;
  let nd = null;
  try { nd = (typeof noticeDraft === 'function') ? noticeDraft(c) : null; } catch (_){ nd = null; }
  const auto = it.noticeKind === 'non-renewal';
  const facts = agKv([
    [_agT('ag_f_ends'), _agDay(it.ends)],
    [_agT('ag_f_notice'), it.notice ? _agTn('desk_days', it.notice, { n: it.notice }) : ''],
    [_agT('ag_f_must_go'), it.by ? _agDay(it.by) + ' · ' + _agTn('desk_days', it.days, { n: it.days }) : ''],
    [_agT('ag_f_renews'), _agT(auto ? 'ag_renews_yes' : 'ag_renews_no')],
  ]);
  let why = _agT(auto ? 'ag_nt_why_auto' : 'ag_nt_why_end', { who: (c && c.counterparty) || '', date: _agDay(auto ? it.by : it.ends) });
  let d = null;
  try { d = (typeof renewalDecisionOf === 'function') ? renewalDecisionOf(c) : null; } catch (_){ d = null; }
  if (d && d.answer && !d.served) why += ' ' + _agT('ag_decided', { date: _agDay(d.at), what: _agT('rn_decided_' + d.answer) });
  const letter = (nd && nd.ok && nd.text) ? `<pre class="ag-letter">${_agE(nd.text)}</pre><p class="ag-p-note">${_agE(_agT('ag_notice_note'))}</p>` : '';
  return facts + agSecHtml(_agT('ag_s_why_notice'), `<p class="ag-p-text">${_agE(why)}</p>`) + agSecHtml(_agT('ag_s_letter'), letter);
}

/* ---- A RENEWAL: the facts, how it went, and Copilot's memo where one is
   written ---- */
function agRenewalBody(it){
  const c = it.c, w = it.w || {};
  let money = '';
  try {
    if (typeof canViewValues === 'function' && canViewValues() && (typeof isMonetary !== 'function' || isMonetary(c))
      && Number(c && c.value) > 0 && typeof fmtMoneyOf === 'function') money = fmtMoneyOf(c);
  } catch (_){ money = ''; }
  const facts = agKv([
    [_agT('ag_f_ends'), _agDay(w.expiry)],
    [_agT('ag_f_renews'), _agT(w.auto ? 'ag_renews_yes' : 'ag_renews_no')],
    [_agT('ag_f_decide_by'), w.decideBy ? _agDay(w.decideBy) + ' · ' + (it.days < 0 ? _agT('desk_ren_late') : _agTn('desk_days', it.days, { n: it.days })) : ''],
    [_agT('ag_f_notice'), w.notice ? _agTn('desk_days', w.notice, { n: w.notice }) : _agT('ag_none_recorded')],
    [_agT('ag_f_value'), money],
    [_agT('ag_f_look'), it.flags ? _agTn('desk_ren_flags', it.flags, { n: it.flags }) : _agT('ag_none_found')],
  ]);
  return facts + agSecHtml(_agT('ag_s_how_went'), agHowWentHtml(c)) + agMemoHtml(it);
}
/* HOW IT WENT is the contract's own obligations, read by the readings that own
   them: kept on their date (obligationOnTime — null where either date is
   missing, and then not counted), and late now (obState, a held-back step not
   counted, the worklist's own rule). Nothing to say, no section. */
function agHowWentHtml(c){
  const obs = (Array.isArray(c && c.obligations) ? c.obligations : []).filter(Boolean);
  let met = 0, late = 0, overdue = 0;
  for (const o of obs){
    let r = null; try { r = (typeof obligationOnTime === 'function') ? obligationOnTime(o) : null; } catch (_){ r = null; }
    if (r === true) met++; else if (r === false) late++;
    let st = ''; try { st = (typeof obState === 'function') ? obState(o) : ''; } catch (_){ st = ''; }
    let held = false; try { held = (typeof obligationBlocked === 'function') && !!obligationBlocked(o, c); } catch (_){ held = false; }
    if (st === 'overdue' && !held) overdue++;
  }
  const rows = [];
  if (met + late) rows.push([late ? 'amber' : 'green', _agT('ag_went_ontime', { n: met, m: met + late })]);
  if (overdue) rows.push(['ruby', _agTn('ag_went_overdue', overdue, { n: overdue })]);
  if (!rows.length) return '';
  return `<ul class="ag-went">${rows.map(([t, x]) => `<li class="is-${t}">${_agE(x)}</li>`).join('')}</ul>`;
}
/* COPILOT'S MEMO is the renewal adviser's own stored answer — its headline,
   its reasons, what to push on — and never a new call. */
function agMemoHtml(it){
  const c = it.c;
  const a = c && c._renewalAdvice;
  const d = a && a.data;
  if (d && (d.headline || (Array.isArray(d.because) && d.because.length))){
    const because = (Array.isArray(d.because) ? d.because : []).filter(Boolean).slice(0, 5);
    const push = (Array.isArray(d.pushOn) ? d.pushOn : []).filter(Boolean).slice(0, 5);
    return agSecHtml(_agT('ag_s_memo'), `${d.headline ? `<p class="ag-memo-h">${_agE(d.headline)}</p>` : ''}
      ${because.length ? `<ul class="ag-went">${because.map(x => `<li>${_agE(x)}</li>`).join('')}</ul>` : ''}
      ${push.length ? `<p class="ag-p-sub2">${_agE(_agT('ag_memo_push'))}</p><ol class="ag-asks">${push.map(x => `<li>${_agE(x)}</li>`).join('')}</ol>` : ''}
      ${d.watchIf ? `<p class="ag-p-note">${_agE(_agT('ag_memo_watch', { what: d.watchIf }))}</p>` : ''}
      ${a.at ? `<p class="ag-p-note">${_agE(_agT(a.overnight ? 'ag_memo_by_night' : 'ag_memo_by_you', { date: _agDay(a.at) }))}</p>` : ''}
      ${a.sentBack ? `<p class="ag-p-note">${_agE(_agT('ag_sent_back_by', { who: a.sentBack.by || '', note: a.sentBack.note || '' }))}</p>` : ''}
      ${(typeof canEdit === 'function' && !canEdit()) ? '' : agSendBackHtml('renew', '')}`);
  }
  if (it.memo && agLoading(c)) return agSecHtml(_agT('ag_s_memo'), agSkelHtml());
  return `<p class="ag-p-note">${_agE(_agT(it.memo ? 'ag_renew_note_memo' : 'ag_renew_note'))}</p>`;
}

/* ---- NEW PAPER: the arrival strip's five readings, each OPENED — the brief,
   the departures, the obligations found — under the tile's own head ---- */
function agReadBody(it){
  const c = it.c;
  let tiles = [];
  try { tiles = (typeof triageTiles === 'function') ? triageTiles(c) : []; } catch (_){ tiles = []; }
  const tone = x => x.working ? 'is-live' : x.none ? 'is-steel' : x.ok ? 'is-green' : 'is-amber';
  const head = x => `<h4 class="ag-ps-h ag-ps-tile ${tone(x)}" title="${_agE(x.hint || '')}"><span class="d" aria-hidden="true"></span><span class="t">${
    _agE(_agT(x.headKey))}</span>${x.count != null ? `<span class="n">${_agE(String(x.count))}</span>` : ''}</h4>`;
  const plain = x => x.detail ? `<p class="ag-p-text">${_agE(x.detail)}</p>` : '';
  const parts = tiles.map(x => {
    let inner = '';
    if (x.key === 'brief') inner = agBriefInner(c);
    else if (x.key === 'playbook') inner = agStandardsInner(c);
    else if (x.key === 'oblig') inner = agHeldInner(c);
    return `<section class="ag-ps" data-ag-tile="${_agE(x.key)}">${head(x)}${inner || plain(x)}</section>`;
  });
  const file = (c && c.upload && (c.upload.fileName || c.upload.name)) || '';
  return (file ? `<p class="ag-p-meta">${_agE(_agT('ag_read_file', { file }))}</p>` : '') + parts.join('');
}
/* THE BRIEF as it was written: the overview, then what is worth watching and
   why. Only the whole record carries it — until that lands, the section says
   it is loading rather than drawing a brief that is not there. */
function agBriefInner(c){
  const b = c && c._brief, d = b && b.data;
  if (!d) return (c && c._hasBrief && agLoading(c)) ? agSkelHtml() : '';
  const mark = s => (typeof briefMark === 'function') ? briefMark(String(s || '')) : _agE(s);
  const watch = (Array.isArray(d.watchouts) ? d.watchouts : []).filter(w => w && w.point);
  const odd = (Array.isArray(d.unusual) ? d.unusual : []).filter(u => u && (u.point || typeof u === 'string'));
  /* ---- THE WARNINGS ARE SAID IN ONE PLACE: THE BRIEF (Young, 7 Oct 2026: "there
     should be a button to click to read a brief which would then appear as a
     side panel as it does today") ---- The panel keeps the opening lines and
     COUNTS what is worth watching; Read the brief (the foot's lead act) opens
     the whole brief in the side panel the contract's own button opens. */
  const parts = [watch.length ? _agTn('ag_brief_watch', watch.length, { n: watch.length }) : '',
    odd.length ? _agTn('ag_brief_odd', odd.length, { n: odd.length }) : ''].filter(Boolean);
  return `${d.overview ? `<p class="ag-brief-o">${mark(d.overview)}</p>` : ''}
    ${parts.length ? `<p class="ag-p-note" data-ag-brief-count><b>${_agE(parts.join(' · '))}</b> ${_agE(_agT('ag_brief_in_brief'))}</p>` : ''}
    ${b.truncated ? `<p class="ag-p-note is-amber">${_agE(_agT('ag_brief_cut'))}</p>` : ''}`;
}
/* THE DEPARTURES are the stored standards review's open verdicts — their words
   (the quote the review rests on) beside your standard. A met standard is
   counted, never listed. */
function agStandardsInner(c){
  const r = c && c.playbook;
  const vs = (r && Array.isArray(r.verdicts)) ? r.verdicts.filter(Boolean) : [];
  if (!vs.length) return '';
  const isOpen = v => (typeof pbVerdictOpen === 'function') ? pbVerdictOpen(v) : !['aligned', 'ok', 'na'].includes(String(v.status || ''));
  const open = vs.filter(isOpen);
  const shown = open.slice(0, AG_DEP_MAX);
  const tag = v => v.escalate ? ['is-ruby', _agT('ag_dep_legal')]
    : String(v.status) === 'missing' ? ['is-amber', _agT('ag_dep_missing')] : ['is-amber', _agT('ag_dep_departs')];
  const cards = shown.map(v => {
    const [t, w] = tag(v);
    const q = _agCut(v.quote, AG_QUOTE_MAX);
    return `<div class="ag-dep"><div class="ag-dep-h"><b>${_agE(v.category || '')}</b><span class="ag-tag ${t}">${_agE(w)}</span></div>
      <dl>${q ? `<dt>${_agE(_agT('ag_dep_theirs'))}</dt><dd class="w">“${_agE(q)}”</dd>` : ''}${
        v.position ? `<dt>${_agE(_agT('ag_dep_std'))}</dt><dd>${_agE(v.position)}</dd>` : ''}</dl></div>`;
  }).join('');
  const met = vs.length - open.length;
  const back = r.sentBack ? `<p class="ag-p-note">${_agE(_agT('ag_sent_back_by', { who: r.sentBack.by || '', note: r.sentBack.note || '' }))}</p>` : '';
  const may = !(typeof canEdit === 'function' && !canEdit()) && !(typeof negoExecuted === 'function' && negoExecuted(c));
  return `${cards}${_agMore(open.length - shown.length)}${met ? `<p class="ag-p-note">${_agE(_agTn('ag_dep_met', met, { n: met }))}</p>` : ''}${back}${
    may ? agSendBackHtml('paper', '') : ''}`;
}
/* THE OBLIGATIONS FOUND are what auto-triage HOLDS for this contract, less any
   already on it (triageHeldObligations — the reading the Obligations tab's own
   Find asks). None is added from here: the foot's button opens the one review
   dialog where each is ticked. */
function agHeldInner(c){
  let held = [];
  try { held = (typeof triageHeldObligations === 'function') ? triageHeldObligations(c) : []; } catch (_){ held = []; }
  held = held.filter(x => x && x.desc);
  if (!held.length) return '';
  const shown = held.slice(0, AG_OBS_MAX);
  return `<ul class="ag-obs">${shown.map(o => {
      const theirs = String(o.party || '') === 'theirs';
      return `<li><span>${_agE(o.desc)}</span><span class="ag-tag ${theirs ? 'is-amber' : 'is-steel'}">${_agE(_agT(theirs ? 'ag_whose_theirs' : 'ag_whose_ours'))}</span></li>`;
    }).join('')}</ul>${_agMore(held.length - shown.length)}<p class="ag-p-note">${_agE(_agT('ag_obs_note'))}</p>`;
}
function agHeldCount(c){
  try { return ((typeof triageHeldObligations === 'function') ? triageHeldObligations(c) : []).filter(x => x && x.desc).length; }
  catch (_){ return 0; }
}

/* ---- A LATE PROMISE: the facts, where it comes from, and THE MESSAGE the
   chase will send ---- */
function agChaseBody(it){
  const c = it.c, o = it.ob || {};
  const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || '');
  let amount = '';
  try {
    const n = (typeof obligationAmount === 'function') ? obligationAmount(o) : null;
    if (n != null && typeof canViewValues === 'function' && canViewValues() && typeof obligationMoneyText === 'function') amount = obligationMoneyText(n, c);
  } catch (_){ amount = ''; }
  const owner = ((typeof contractOwnerName === 'function') && contractOwnerName(c)) || '';
  const facts = agKv([
    [_agT('ag_f_what'), o.desc || ''],
    [_agT('ag_f_was_due'), due ? _agDay(due) + ' · ' + _agTn('desk_late', it.days, { n: it.days }) : ''],
    [_agT('ag_f_whose'), _agT('ag_whose_theirs_named', { who: (c && c.counterparty) || '' })],
    [_agT('ag_f_owner_here'), owner],
    [_agT('ag_f_amount'), amount],
  ]);
  const quote = _agCut(o.quote, AG_QUOTE_MAX);
  return facts
    + (quote ? agSecHtml(_agT('ag_s_source'), `<p class="ag-quote">“${_agE(quote)}”</p>`) : '')
    + agSecHtml(_agT('ag_s_message'), it.noAddress ? '' : agChaseMailHtml(c, o, it.kind === 'chase-firm'))
    + `<p class="ag-p-note">${_agE(_agT(it.noAddress ? 'ag_chase_noaddr_note' : 'ag_chase_note'))}</p>`;
}
/* ---- OUR PROMISE: what it is, when, who is reminded, and the rule ----
   Marking it done is the Obligations tab's own act (openObligationDone, the
   note and the stamp) — THE ONE DOOR — so this panel opens the tab. */
function agOursBody(it){
  const c = it.c, o = it.ob || {};
  let amount = '';
  try {
    const n = (typeof obligationAmount === 'function') ? obligationAmount(o) : null;
    if (n != null && typeof canViewValues === 'function' && canViewValues() && typeof obligationMoneyText === 'function') amount = obligationMoneyText(n, c);
  } catch (_){ amount = ''; }
  const when = it.days < 0 ? _agTn('desk_late', -it.days, { n: -it.days }) : it.days === 0 ? _agT('ag_ours_today') : _agTn('ag_ours_in', it.days, { n: it.days });
  const who = agForName(it);
  const facts = agKv([
    [_agT('ag_f_what'), o.desc || ''],
    [_agT('ag_f_due'), it.due ? _agDay(it.due) + ' · ' + when : ''],
    [_agT('ag_f_whose'), _agT('ag_whose_ours')],
    [_agT('ag_f_reminded'), who || _agT('ag_ours_admins')],
    [_agT('ag_f_amount'), amount],
  ]);
  const quote = _agCut(o.quote, AG_QUOTE_MAX);
  return facts
    + (quote ? agSecHtml(_agT('ag_s_source'), `<p class="ag-quote">“${_agE(quote)}”</p>`) : '')
    + `<p class="ag-p-note">${_agE(_agT('ag_ours_note'))}</p>`;
}
/* THE MESSAGE, AS THE ROUTE WILL WRITE IT: POST /api/contracts/:id/chase's own
   dictionary keys, its own facts ({desc}, {name}, {id}, {due} — the due date
   as stored) and its own language rule (the recipient's, where the address is
   a colleague's, else the workspace default). So what is shown is what goes,
   bar the link, which the route adds only where a link to the agreement
   stands — said on the box's hover. */
function agChaseMail(c, o, firm){
  const S = (typeof window !== 'undefined' && window.STRINGS) || null;
  if (!S || !c) return null;
  const to = String(c.counterpartyEmail || '').trim();
  let L = (typeof window !== 'undefined' && window.I18N_DEFAULT) || 'en';
  try {
    const u = ((typeof getUsers === 'function') ? getUsers() : []).find(x => x && String(x.email || '').trim().toLowerCase() === to.toLowerCase());
    if (u && u.lang && S[u.lang]) L = u.lang;
  } catch (_){}
  const T = (k, v) => {
    let x = S[L] && S[L][k];
    if (x == null) x = (S.en || {})[k];
    if (x == null) return '';
    return v ? String(x).replace(/\{(\w+)\}/g, (m, y) => (v[y] == null ? m : String(v[y]))) : String(x);
  };
  const ref = _agRef(c);
  const vars = { desc: (o && o.desc) || '', name: c.name || ref, id: ref, due: (o && o.due) || '' };
  /* THE FIRMER ONE is the route's own `firm` keys, with the day the first went. */
  if (firm) vars.first = String((o && o.chasedAt) || '').slice(0, 10);
  const line = firm
    ? T((o && o.due) ? 'mail_ob_chase_firm_line' : 'mail_ob_chase_firm_line_nodate', vars)
    : T((o && o.due) ? 'mail_ob_chase_line' : 'mail_ob_chase_line_nodate', vars);
  return { to, subject: T(firm ? 'mail_ob_chase_firm_subject' : 'mail_ob_chase_subject', vars), body: `${T('mail_hello')},\n\n${line}\n\n${T('mail_automated_notice')}` };
}
function agChaseMailHtml(c, o, firm){
  const m = agChaseMail(c, o, firm);
  if (!m) return '';
  return `<div class="ag-mail" title="${_agE(_agT('ag_mail_link_note'))}"><dl class="ag-mail-h"><dt>${_agE(_agT('ag_mail_to'))}</dt><dd>${_agE(m.to)}</dd><dt>${
    _agE(_agT('ag_mail_subject'))}</dt><dd>${_agE(m.subject)}</dd></dl><div class="ag-mail-b">${_agE(m.body)}</div></div>`;
}

/* ---- AN IMPORT BATCH: the counts, and the contracts NAMED — the ones that
   could not be read and the ones waiting to be checked ---- */
function agImportBody(it){
  const cs = Array.isArray(it.cs) ? it.cs : [];
  /* The count of files that could not be read is NOT a fact here: the section
     below names each of them, and the two side by side said one thing twice. */
  const facts = agKv([
    [_agT('ag_f_imported'), _agDay(it.at)],
    [_agT('ag_f_by'), it.by || ''],
    [_agT('ag_f_contracts'), String(it.n)],
    [_agT('ag_f_to_check'), String(it.review)],
  ]);
  /* EACH BY THE FILE SOMEBODY IMPORTED — the name they would recognise, and
     the import page's own — with whose contract it is and its title beside. */
  const file = c => String((c && c.upload && c.upload.fileName) || '');
  const label = c => file(c) || String((c && c.name) || '') || _agRef(c);
  const second = c => [c && c.counterparty, file(c) ? (c && c.name) : ''].filter(Boolean).join(' · ');
  const list = arr => {
    const shown = arr.slice(0, AG_LIST_MAX);
    return `<ul class="ag-names">${shown.map(c => `<li><b>${_agE(label(c))}</b>${second(c) ? `<span>${_agE(second(c))}</span>` : ''}</li>`).join('')}</ul>${_agMore(arr.length - shown.length)}`;
  };
  const unread = cs.filter(c => c && c.migration && c.migration.blocked);
  const check = cs.filter(c => c && c.migration && c.migration.needsReview && !c.migration.blocked);
  return facts
    + (unread.length ? agSecHtml(_agT('ag_s_unread'), list(unread) + `<p class="ag-p-note">${_agE(_agT('ag_unread_note'))}</p>`) : '')
    + (check.length ? agSecHtml(_agT('ag_s_to_check'), list(check)) : '')
    + `<p class="ag-p-note">${_agE(_agT('ag_import_note'))}</p>`;
}

/* ---- NO LINK TO SIGN: what is stuck, what became of their link, who it last
   went to and for how long — every one a fact the server read off the link
   (srvReach), none of it guessed. ---- */
function agLinkBody(it){
  const cap = t => { const x = String(t || ''); return x ? x.charAt(0).toUpperCase() + x.slice(1) : ''; };
  if (it.kind === 'soon' || it.kind === 'soon-sign'){
    const X = it.soon || {};
    return agKv([
      [_agT('ag_f_situation'), _agT(it.kind === 'soon-sign' ? 'ag_soon_sign' : 'ag_soon_reply', { who: X.signer || X.to || '', date: _agDay(X.ends) })],
      [_agT('ag_f_sent_to'), agSentTo(X)],
      [_agT('ag_f_left'), _agTn('ag_stuck_n', it.left || 0, { n: it.left || 0 })],
    ]) + `<p class="ag-p-note">${_agE(_agT('ag_keep_note'))}</p>`;
  }
  const L = it.kind === 'sign' ? it.sign : it.kind === 'party' ? it.party : it.last;
  const facts = agKv([
    [_agT('ag_f_situation'), it.kind === 'sign' ? agSignTurnWords(it, (it.c && it.c.counterparty) || '')
      : it.kind === 'party' ? _agT('ag_party_stuck', { party: (it.party && it.party.party) || '' })
      : _agTn('ag_reply_out', it.n, { n: it.n })],
    [_agT('ag_f_link'), cap(agLinkHow(it))],
    [_agT('ag_f_sent_to'), agSentTo(L)],
    [_agT('ag_f_stuck'), it.days == null ? '' : _agTn('ag_stuck_n', it.days, { n: it.days })],
  ]);
  return facts + `<p class="ag-p-note">${_agE(_agT(it.kind === 'sign' ? 'ag_fresh_sign_note' : it.kind === 'party' ? 'ag_fresh_party_note' : 'ag_fresh_reply_note'))}</p>`;
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
    /* THE OBLIGATIONS FOUND have one door onto being added — the review dialog
       runFindObligations opens on the list auto-triage holds — and it is drawn
       only where something is held and the reader may add it. */
    const obs = ed ? agHeldCount(it.c) : 0;
    /* READ THE BRIEF LEADS where there is one (Young, 7 Oct 2026); the
       Overview stays one press away beside it. */
    return (hasBrief ? B('brief', _agT('ag_a_brief'), 'lead') : '') + B('overview', _agT('ag_a_overview'), hasBrief ? '' : 'lead')
      + (obs ? B('obs', _agTn('ag_a_obs', obs, { n: obs }), '') : '') + (ed ? B('seen', _agT('ag_a_seen'), 'link') : '');
  }
  if (it.kind === 'chase') return (it.noAddress || !ed ? '' : B('chase', _agT('desk_chase_send'), 'lead'))
    + B('oblig', _agT('ag_a_oblig'), it.noAddress ? 'lead' : '') + (ed ? B('away', _agT('desk_discard'), 'link') : '');
  if (it.kind === 'import') return B('import', _agT('ag_a_import'), 'lead');
  /* THE FRESH LINK, AND THE WAY ROUND IT WHERE THE PERSON IS WRONG — the send
     screen for an answer, the Signing tab for a signature. Somebody who may not
     send is shown where the work lives and nothing else. */
  if (it.kind === 'reply') return ed ? B('fresh', _agT('ag_a_fresh'), 'lead') + B('sendscreen', _agT('ag_a_send_screen'), '')
    : B('overview', _agT('ag_a_overview'), 'lead');
  if (it.kind === 'sign') return (ed ? B('fresh', _agT('ag_a_fresh'), 'lead') : '') + B('signing', _agT('ag_a_signing'), ed ? '' : 'lead');
  /* ONE PARTY OF SEVERAL: the send screen, with that party already chosen —
     the round send picks the first party, and this is not the first. */
  if (it.kind === 'party') return ed ? B('sendparty', _agT('ag_a_send_party'), 'lead') : B('overview', _agT('ag_a_overview'), 'lead');
  /* A LINK ABOUT TO RUN OUT: the same link, given more time. */
  if (it.kind === 'soon' || it.kind === 'soon-sign')
    return (ed ? B('keepopen', _agT('ag_a_keep_open'), 'lead') : '') + B(it.kind === 'soon-sign' ? 'signing' : 'nego',
      _agT(it.kind === 'soon-sign' ? 'ag_a_signing' : 'ct_open_negotiation'), ed ? '' : 'lead');
  if (it.kind === 'chase-firm') return (it.noAddress || !ed ? '' : B('chasefirm', _agT('ag_a_chase_firm'), 'lead'))
    + B('oblig', _agT('ag_a_oblig'), it.noAddress ? 'lead' : '');
  if (it.kind === 'ours') return B('oblig', _agT('ag_a_oblig'), 'lead');
  if (it.kind === 'approve'){
    let may = null; try { may = (typeof approvalDecidableNow === 'function') ? approvalDecidableNow(it.c) : null; } catch (_){ may = null; }
    return may ? B('approve', _agT('ap_pg_approve'), 'lead') + B('refuse', _agT('ag_a_refuse'), '') + B('overview', _agT('ins_open_contract'), 'link')
      : B('signing', _agT('ap_pg_open_gate'), 'lead') + B('overview', _agT('ins_open_contract'), '');
  }
  if (it.kind === 'request') return (ed ? B('ikdraft', _agT('ik_act_draft'), 'lead') : '') + B('ikopen', _agT('ag_a_request'), ed ? '' : 'lead');
  if (it.kind === 'lane') return B('overview', _agT('ag_a_draft_open'), 'lead') + B('ikopen', _agT('ag_a_request'), '');
  if (it.kind === 'week') return B('calendar', _agT('ag_a_calendar'), 'lead') + B('ics', _agT('ag_a_ics'), '');
  if (it.kind === 'quiet'){
    const r = _agReplies.get(it.key);
    if (r && r.state === 'done') return B('usereply', _agT('ag_a_use_reply'), 'lead') + B('draftreply', _agT('ag_a_redraft'), '') + B('notes', _agT('ag_a_answer_note'), 'link');
    return (ed ? B('draftreply', _agT('ag_a_draft_reply'), r && r.state === 'busy' ? '' : 'lead') : '') + B('notes', _agT('ag_a_answer_note'), ed ? '' : 'lead') + B('overview', _agT('ag_a_overview'), '');
  }
  return '';
}
/* THE PANEL'S HEAD is the drawing's: what the work IS, whose contract (its
   reference first — Young, 8 Oct 2026: "there is no contract number in the
   card for reference"), and which agent did it, when, for whom. */
function agPanelTitle(it){
  if (it.kind === 'answer') return _agT('ag_pt_answer', { n: it.round || 1 });
  if (it.kind === 'notice') return _agT(it.noticeKind === 'non-renewal' ? 'ag_pt_nonren' : 'ag_pt_term');
  if (it.kind === 'renewal') return _agT('ag_pt_renewal');
  if (it.kind === 'read') return _agT('ag_pt_read');
  if (it.kind === 'chase') return _agT('ag_pt_chase');
  if (it.kind === 'import') return _agT('ag_pt_import');
  if (it.kind === 'reply') return _agT('ag_pt_reply');
  if (it.kind === 'sign') return _agT('ag_pt_sign');
  if (it.kind === 'party') return _agT('ag_pt_party', { party: (it.party && it.party.party) || '' });
  if (it.kind === 'soon') return _agT('ag_pt_soon');
  if (it.kind === 'soon-sign') return _agT('ag_pt_soon_sign');
  if (it.kind === 'chase-firm') return _agT('ag_pt_chase_firm');
  if (it.kind === 'ours') return _agT('ag_pt_ours');
  if (it.kind === 'approve') return _agT('ag_pt_approve');
  if (it.kind === 'request') return _agT('ag_pt_request');
  if (it.kind === 'lane') return _agT('ag_pt_lane');
  if (it.kind === 'week') return _agT('ag_pt_week');
  if (it.kind === 'quiet') return _agT('ag_pt_quiet');
  return '';
}
function agPanelHeadHtml(it){
  const p = agCardParts(it);
  const title = agPanelTitle(it);
  const who = agForName(it), when = agWhen(it);
  const meta = [_agT('ag_' + it.agent), when, who ? agForWords(who, true) : ''].filter(Boolean).map(_agE).join(' · ');
  const sub = it.c
    ? `<div class="ag-p-sub">${typeof refHtml === 'function' ? `<span class="ag-p-ref">${refHtml(it.c)}</span>` : ''}<b class="ag-p-who">${_agE(p.who)}</b>${p.name ? `<span class="ag-p-name">${_agE(p.name)}</span>` : ''}</div>`
    : (it.batch != null ? `<div class="ag-p-sub"><b class="ag-p-who">${_agE(_agT('ag_batch', { b: it.batch }))}</b></div>`
      : `<div class="ag-p-sub"><b class="ag-p-who">${_agE(p.who)}</b>${it.r && it.r.title ? `<span class="ag-p-name">${_agE(it.r.title)}</span>` : ''}</div>`);
  return `<div class="ag-p-head">${title ? `<div class="ag-p-title">${_agE(title)}</div>` : ''}${sub}<div class="ag-p-agent">${meta}</div></div>`;
}
let _agOpenKey = null;
function agOpenItem(key){
  const it = agFind(key);
  if (!it || typeof openSidePanel !== 'function') return;
  _agOpenKey = key;
  /* THE RECORD, WHOLE (see agLoadWhole), asked for BEFORE the first paint so
     the paint knows it is on its way. Where this panel reads what only the
     whole record carries, the press waits a moment for it; every other panel
     draws at once and fills in behind, the Inspector's own idiom. */
  const load = agLoadWhole(it.c);
  if (!load) return agDrawPanel(key);
  if (!AG_NEEDS_WHOLE.has(it.kind)){ agDrawPanel(key); load.then(() => agPanelRefresh(key)); return; }
  let drawn = false;
  const draw = () => { if (drawn) return; drawn = true; if (_agOpenKey === key) agDrawPanel(key); };
  const t = setTimeout(draw, AG_OPEN_WAIT_MS);
  load.then(() => { if (!drawn){ clearTimeout(t); draw(); } else agPanelRefresh(key); });
}
function agDrawPanel(key){
  const it = agFind(key);
  if (!it || typeof openSidePanel !== 'function') return;
  const p = agCardParts(it);
  const title = it.c ? [p.kind, _agRef(it.c)].filter(Boolean).join(' · ') : p.kind;
  openSidePanel(`<div class="ag-panel" data-ag-panel="${_agE(key)}">
      ${agPanelHeadHtml(it)}
      <div class="ag-p-body">${agPanelBody(it)}</div>
      <div class="ag-p-foot"><div class="ag-p-acts">${agPanelActs(it)}</div>
        <p class="ag-p-line">${_agE(_agT('ag_panel_line'))}</p></div>
    </div>`, { title, label: title, width: '520px' });
  const panel = document.querySelector('[data-ag-panel]');
  if (panel) panel.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    const b = t.closest('[data-ag-act]');
    if (b){ agRunAct(key, b.getAttribute('data-ag-act')); return; }
    const sb = t.closest('[data-ag-sb]');
    if (!sb) return;
    const box = sb.querySelector('.ag-sb-box');
    if (t.closest('[data-ag-sb-open]')){ if (box){ box.hidden = false; const n = box.querySelector('textarea'); if (n) n.focus(); } return; }
    if (t.closest('[data-ag-sb-cancel]')){ if (box) box.hidden = true; return; }
    if (t.closest('[data-ag-sb-go]')) agSendBackPress(_agOpenKey || key, sb);
  });
}
/* WHAT LANDED IS SWAPPED IN PLACE: where the new body has the same sections as
   the one on screen, only the sections whose markup changed are replaced, so
   the reader's place and everything around the brief stay still. A body whose
   shape changed is redrawn whole. */
function agPanelRefresh(key){
  const panel = document.querySelector('[data-ag-panel]');
  if (!panel || panel.getAttribute('data-ag-panel') !== key) return;
  const it = agFind(key);
  if (!it) return;
  const b = panel.querySelector('.ag-p-body');
  if (b){
    const next = document.createElement('div');
    next.innerHTML = agPanelBody(it);
    const was = [...b.children], now = [...next.children];
    if (was.length && was.length === now.length){
      now.forEach((n, i) => { if (was[i].outerHTML !== n.outerHTML) was[i].replaceWith(n); });
    } else b.innerHTML = next.innerHTML;
  }
  const a = panel.querySelector('.ag-p-acts');
  if (a){ const html = agPanelActs(it); if (a.innerHTML !== html) a.innerHTML = html; }
}
async function agRunAct(key, act){
  const it = agFind(key);
  if (!it) return;
  const c = it.c ? ((typeof getContract === 'function' && getContract(it.cid)) || it.c) : null;
  /* a row's own door: "go|<contract>|<tab>" (Week ahead's rows) */
  if (String(act).startsWith('go|')){ const [, cid, tab] = String(act).split('|'); return agGo(tab === 'oblig' ? 'oblig' : 'terms', cid); }
  if (act === 'approve' || act === 'refuse'){
    if (!c || typeof approvalDecideAsk !== 'function') return agGo('sign', it.cid);
    const ok = await approvalDecideAsk(c, act === 'approve' ? 'approved' : 'refused');
    if (ok) agRepaint();
    return;
  }
  if (act === 'ikdraft'){ if (it.r && typeof intakeDraft === 'function') intakeDraft(it.r.id); return; }
  if (act === 'draftreply') return agDraftReply(key);
  if (act === 'usereply') return agUseReply(key);
  if (act === 'ikopen'){ if (it.r && typeof intakeGoTo === 'function') intakeGoTo(it.r.id); return; }
  if (act === 'calendar'){ if (typeof setView === 'function') setView('calendar'); return; }
  if (act === 'ics'){
    if (typeof calIcsFor !== 'function' || typeof downloadFile !== 'function' || !it.evs) return;
    downloadFile('hati-week-ahead.ics', calIcsFor(it.evs), 'text/calendar');
    if (typeof toast === 'function') toast(_agTn('ag_ics_done', it.evs.length, { n: it.evs.length }), 'ok');
    return;
  }
  if (act === 'notes'){
    if (!c) return;
    agGo('nego', c.id);
    return;
  }
  if (act === 'nego') return agGo('nego', it.cid);
  if (act === 'overview') return agGo('terms', it.cid);
  if (act === 'oblig') return agGo('oblig', it.cid);
  if (act === 'import') return agGo('import');
  if (act === 'signing') return agGo('sign', it.cid);
  if (act === 'fresh') return agFreshLink(key);
  if (act === 'keepopen'){
    if (!c || typeof shareKeepOpen !== 'function' || !it.soon) return;
    /* MORE TIME IS STILL REACH (4 Oct 2026): the one link check's keeping
       rows — the hold and the desk — asked before the press is spent. */
    if (typeof linkRefusal === 'function'){
      let no = null;
      try { no = linkRefusal(c, { purpose: it.soon.kind === 'sign' ? 'sign' : 'negotiate', keep: true }); } catch (_){ no = null; }
      if (no){ if (typeof toast === 'function') toast(no.why, 'err'); return; }
    }
    let r = null;
    try { r = await shareKeepOpen(c, it.soon.token); }
    catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return; }
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    if (typeof toast === 'function') toast(_agT('ag_kept_open', { date: _agDay(r && r.expiresAt) }), 'ok');
    agRepaint();
    return;
  }
  if (act === 'sendparty'){
    if (!c || typeof openShareModal !== 'function') return;
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    const pid = it.party && it.party.partyId;
    await openShareModal(c, { purpose: 'negotiate', handOver: true, onSent(){
      if (typeof roundHandedOver === 'function') roundHandedOver(c);
      agRepaint();
    } });
    /* THE PARTY IS CHOSEN on the dialog's own control, which says so and can be
       changed — never guessed behind the reader's back. */
    const sel = document.getElementById('sh-party-sel');
    if (sel && pid){ sel.value = pid; try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (_){} }
    return;
  }
  if (act === 'chasefirm'){
    if (typeof obligationChase !== 'function' || !it.ob) return;
    await obligationChase(it.cid, it.ob.id, { firm: true });
    const still = agFind(key);
    if (!still && typeof closeModal === 'function') try { closeModal(); } catch (_){}
    agRepaint();
    return;
  }
  if (act === 'sendscreen'){
    if (!c || typeof openShareModal !== 'function') return;
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    /* THE SEND SCREEN, AS THE NEGOTIATION'S OWN SEND OPENS IT: the round, a
       hand-over, and the turn moved only once something has really gone. */
    openShareModal(c, { purpose: 'negotiate', handOver: true, onSent(){
      if (typeof roundHandedOver === 'function') roundHandedOver(c);
      agRepaint();
    } });
    return;
  }
  if (act === 'notice'){ if (c && typeof openNoticeDialog === 'function') openNoticeDialog(c); return; }
  if (act === 'brief'){
    if (!c) return;
    /* THE BRIEF IS NOT ON THE LIST, so the whole record is loaded BEFORE the
       panel that shows it opens — the reason the Overview's door always worked
       and this one did not. The room then finds it loaded and asks nothing. */
    const load = agLoadWhole(c);
    if (load) await load;
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    /* ON THE BOARD THE BRIEF OPENS OVER THE BOARD: the side panel is the same
       one the contract's own Read the brief opens, and closing it leaves the
       reader where they pressed. Elsewhere the room is opened first, as it was. */
    const onBoard = typeof state !== 'undefined' && state && state.view === 'dashboard';
    if (!onBoard && typeof selectContract === 'function') selectContract(c.id);
    if (typeof openCheckPanel === 'function') setTimeout(() => { try { openCheckPanel(getContract(c.id) || c, 'brief'); } catch (_){} }, 0);
    return;
  }
  if (act === 'obs'){
    if (!c || typeof runFindObligations !== 'function') return;
    /* THE ONE DOOR ONTO ADDING THEM: runFindObligations offers the list
       auto-triage already holds, in the same review dialog the Obligations tab
       opens — nothing is added without a tick and nothing is paid for twice.
       The record is whole first, so the add saves what is on screen. */
    const load = agLoadWhole(c);
    if (load) await load;
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    try { await runFindObligations(c); } catch (_){}
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

/* ---- SEND A FRESH LINK: the product's own acts, ON THE PANEL'S ONE PRESS
   (Young, 4 Oct 2026: "i do not need another press to send the link. The one
   in the side panel should be enough" — reversing the 27 Sep "asks first").
   The panel the button sits in already names who it last went to; the press
   sends, and the toast says to whom. ----
   AN ANSWER goes by the round send — reshareToLastRecipient, the one the
   negotiation's own Send presses, with the desk, the reviewer and the review
   gate asked inside it — to the person the round send itself would pick
   (counterpartyContact), then the turn is handed over exactly as that Send
   hands it (negoHandOver). The share list is read FIRST, which reads again
   whether they can answer: somebody may have sent one in the meantime.
   A FRESH LINK IS A LINK: a Word file is not one, and the round send has no
   file to attach — so a Word row neither chooses who it goes to nor how.
   The send and its hand-over are ONE published act (resendRoundFresh,
   js/core.js), so nothing on this page stores anything of its own.
   A SIGNATURE goes by the Signing tab's own act (issueSigningAct → the signing
   route), run ON that tab: it repaints the room it lives in, and a named
   approval still holds the links. Neither path writes anything of its own. */
async function agFreshLink(key){
  const it = agFind(key);
  if (!it) return;
  const c = ((typeof getContract === 'function') && getContract(it.cid)) || it.c;
  if (!c) return;
  if (it.kind === 'reply'){
    if (typeof resendRoundFresh !== 'function') return;
    let shares = [];
    try { shares = (typeof contractShares === 'function') ? (await contractShares(c)) || [] : []; } catch (_){ shares = []; }
    if (typeof negoTheirCopy === 'function' && negoTheirCopy(c) === 'live'){
      if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
      if (typeof toast === 'function') toast(_agT('ag_fresh_fixed'), 'ok');
      agRepaint();
      return;
    }
    const links = shares.filter(s => s && s.channel !== 'word');
    const to = (typeof counterpartyContact === 'function') ? counterpartyContact(c, links) : null;
    const ch = (to && to.channel) || 'email';
    const reachable = !!to && ((ch === 'email' && to.email) || (ch === 'whatsapp' && to.phone) || ch === 'link');
    if (!reachable){
      if (typeof toast === 'function') toast(_agT('ag_fresh_nobody'), 'warn');
      return agRunAct(key, 'sendscreen');
    }
    const who = agSentTo({ to: to.name || to.email || to.phone, email: to.email });
    let out = null;
    try { out = await resendRoundFresh(c, { shares: links }); }
    catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return; }
    if (typeof closeModal === 'function') try { closeModal(); } catch (_){}
    const sent = !!(out && out.delivered);
    if (typeof toast === 'function') toast(_agT(sent ? 'ag_fresh_sent' : 'ag_fresh_made', { who }), sent ? 'ok' : 'warn');
    agRepaint();
    return;
  }
  if (it.kind === 'sign'){
    if (typeof issueSigningAct !== 'function') return;
    agGo('sign', c.id);
    setTimeout(() => { try { issueSigningAct(((typeof getContract === 'function') && getContract(c.id)) || c); } catch (_){} }, 0);
  }
}

Object.assign(window, { AG_REPLY_WAIT_MS, agReplyPrompt, agDraftReply, agUseReply, agLevelOf, AG_READINGS, AG_WEEK_DAYS, AG_QUIET_DAYS, agApproveItems, agRequestItems, agWeekItems, agQuietItems, agApproveBody, agRequestBody, agWeekBody, agQuietBody, agSelKey, AG_KEYS, AG_DEF, AG_RECENT_DAYS, AG_DONE_MAX, agSel, agSetSel, agBook, agentsData, agentsDoorCount,
  agRoundItems, agRoundDone, agRenewItems, agRenewDone, agLateItems, agLateDone, agPaperItems, agPaperWorking, agPaperDone,
  agImportBatches, agImportItems, agImportDone, agImportWorking, agFind, agCardParts, agCardHtml, agPageHtml, agListHtml,
  agStepsHtml, agFactsHtml, agPanelBody, agPanelActs, agOpenItem, agDrawPanel, agWarmUp, AG_NEEDS_WHOLE, AG_OPEN_WAIT_MS, agRunAct, agPaintHead, agRepaint, renderAgentsPage,
  agForName, agWhen, agFootHtml, agPanelTitle, agPanelHeadHtml, agLoadWhole, agChaseMail, agHowWentHtml, agMemoHtml,
  agBriefInner, agStandardsInner, agHeldInner, agPanelRefresh,
  agLinkItems, agLinkDone, agLinkHow, agLinkBody, agFreshLink, agSignTurnWords, agSentTo,
  agRowInner, agPaintList, agShowAgent, agOnDay,
  agStatusOf, agMoneyShown, agNextWords, agRunResultWords, agRunsHtml, agRunNowPress, AG_SPENDS, AG_SIGN_STUCK,
  agLateFirmItems, agPrepHtml, agSendBackHtml, agSendBackPress, AG_PREP_TONE });
