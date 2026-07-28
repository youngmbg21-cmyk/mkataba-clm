// HaTi — Doc Lab: a sandbox beside the Doc page, for trying the internal wall
// and the round it lives inside before moving the product onto either.
// Globals are window-attached like every module (see components.js).
//
// WHY THIS IS A SEPARATE PAGE AND NOT A BRANCH OF THE DOC PAGE
//
// The proposal on the table adds two things the product has never had:
//   · visibility — 'internal' | 'shared' — on a conversation, so a team can
//     talk among themselves while a deal is live.
//   · status — 'open' | 'resolved' — plus a link to a change, so a conversation
//     ends when the thing it was about is decided.
//
// Both are cheap to add and expensive to get wrong. Marking a note internal and
// having it reach the counterparty anyway is not a rendering bug, it is a client
// reading our negotiating position. So the approach gets proven somewhere that
// cannot do that damage, and only then moves into js/discuss.js and
// buildSharePayload().
//
// WHY THE LAB EDITS, WHEN THE DOCS PAGE DELIBERATELY DOES NOT
//
// f50 pins the rule for the real product: the Docs page reads, checks and signs
// — wording changes are tracked changes in the negotiation, or they are not
// changes at all. That rule is not under test here and is not weakened here.
//
// What the lab needs is the WHOLE LOOP in one place: change a clause, argue
// about it privately, send it, have the other side decide it, watch the
// conversation close. Half a loop cannot show whether the wall holds, because
// the interesting leaks are at the seams — an unsent draft, a note attached to
// a change that has not gone out yet. So the lab keeps its own copy of the
// document and its own changes, and the contract is never touched.
//
// WHAT MAKES THIS SANDBOX ACTUALLY SAFE
//
//   1. Everything lives in localStorage under one key of its own. Nothing here
//      goes through persist(), so no lab change or message can reach the
//      contract record, the server, or a portal link.
//   2. The lab's document is a COPY, taken once from the contract's working
//      wording. Editing it cannot write back.
//   3. Nothing in here re-implements the real accept/reject model. The rules it
//      does mirror — silence rejects, nobody rules on their own ask — are
//      mirrored because a sandbox that behaved differently from the product
//      would prove nothing about the product.
//
// THE TWO RULES IT COPIES FROM js/negotiation.js, AND WHY
//
//   1. SILENCE REJECTS. The working wording is BUILT from the accepted set on
//      every read, never mutated in place, so rejecting everything reproduces
//      the baseline exactly. The sample engine that prompted this experiment
//      wrote accepted text straight over the clause, which makes the original
//      unrecoverable and "reject" a lie.
//   2. NOBODY RULES ON THEIR OWN ASK. Enforced in labCanDecide, not in the
//      buttons, so a new control cannot route around it.
//
// AND ONE RULE OF ITS OWN
//
//   EXPLICIT ALLOW, twice. A thread travels only if visibility === 'shared'; a
//   change travels only if sent === true. Written the obvious way — "everything
//   not marked internal" — a field nobody set passes, which is exactly the
//   defect in the sample engine: `undefined !== 'internal_draft'` is true, so
//   every internal draft is sent, silently, with no error to notice.

/* ---------- the store ----------
   Its own key, deliberately. A lab that shared the contract record would be one
   forgotten persist() away from writing test wording into a real negotiation. */
const LAB_KEY = 'hati.lab.v1';
const LAB_INTERNAL = 'internal';
const LAB_SHARED   = 'shared';
const LAB_US   = 'owner';
const LAB_THEM = 'counterparty';

function labLoad(){
  try{ return JSON.parse(localStorage.getItem(LAB_KEY) || '{}') || {}; }
  catch(e){ return {}; }
}
function labFor(cid){
  const rec = labLoad()[cid];
  return {
    threads:   (rec && rec.threads)   || [],
    changes:   (rec && rec.changes)   || [],
    baseHtml:  (rec && rec.baseHtml)  || '',
    nextId:    (rec && rec.nextId)    || 1
  };
}
function labPut(cid, lab){
  const all = labLoad();
  all[cid] = { threads: lab.threads || [], changes: lab.changes || [],
    baseHtml: lab.baseHtml || '', nextId: lab.nextId || 1 };
  try{ localStorage.setItem(LAB_KEY, JSON.stringify(all)); }
  catch(e){ if(window.toast) toast('The lab could not save to this browser — it is out of space','err'); }
}
function labClear(cid){
  const all = labLoad(); delete all[cid];
  try{ localStorage.setItem(LAB_KEY, JSON.stringify(all)); }catch(e){}
}
const labUid = p => p + '_' + Math.random().toString(36).slice(2, 9);

/* ============================================================
   THE DOOR — everything this page exists to prove is in these two functions.
   ============================================================ */

/* Threads. Explicit allow: a conversation reaches the other side only by
   saying so. A forgotten field means it stays home, which is the failure you
   can live with. */
function labSharePayload(lab){
  const threads = (lab && lab.threads) || [];
  const changes = (lab && lab.changes) || [];
  return {
    threads: threads
      .filter(t => t.visibility === LAB_SHARED)
      .map(t => ({
        id: t.id, topicLabel: t.topicLabel, changeId: t.changeId || null,
        status: t.status, resolvedAt: t.resolvedAt || null,
        /* The internal NAME of whoever closed it stays behind and the
           organisation speaks instead — the same call buildSharePayload()
           already makes for whoever ruled on a change. */
        resolvedByOrg: t.resolvedBy ? t.resolvedBy.org : null,
        messages: (t.messages || []).map(m => ({
          id: m.id, author: m.author, org: m.org, body: m.body, at: m.at
        }))
      })),
    changes: labShareChanges(changes)
  };
}

/* Changes. Explicit allow again, on a different field: a change is on the
   table only once it has been SENT. A clause you are still drafting is your
   own business, and it is the seam where a wall most easily fails — the note
   is marked internal, but the half-written clause it is about is not. */
function labShareChanges(changes){
  return (changes || [])
    .filter(x => x.sent === true)
    .map(x => ({
      id: x.id, clauseId: x.clauseId, clauseLabel: x.clauseLabel,
      before: x.before, after: x.after,
      side: x.side, author: x.author, status: x.status,
      /* True by construction — nothing unsent is in this list. It travels
         anyway, because the reader's renderer asks, and a field that is absent
         reads as false: the counterparty's copy said "not sent" about the very
         changes they had just been sent. */
      sent: true,
      at: x.at, sentAt: x.sentAt || null,
      /* Who ruled stays behind; that they ruled does not. */
      decidedByOrg: x.decidedBy ? x.decidedBy.org : null,
      decidedAt: x.decidedAt || null
    }));
}

/* What was held back, counted rather than described. Shown to the OWNER only,
   so the person testing can see the door did something without the
   counterparty view revealing that anything exists behind it. */
function labWithheld(lab){
  const threads = ((lab && lab.threads) || []).filter(x => x.visibility !== LAB_SHARED);
  const drafts  = ((lab && lab.changes) || []).filter(x => x.sent !== true);
  return {
    threads: threads.length,
    messages: threads.reduce((n, x) => n + ((x.messages || []).length), 0),
    drafts: drafts.length
  };
}

/* ============================================================
   THE WORKING WORDING — built, never mutated
   ============================================================ */

/* What a clause says RIGHT NOW: its baseline wording unless a change to it was
   accepted. Selection, not mutation — which is what makes rejecting everything
   reproduce the baseline exactly, and what keeps the original recoverable
   however many rounds happen on top of it. */
function labClauseText(clause, changes){
  const taken = (changes || []).filter(x => x.clauseId === clause.clauseId && x.status === 'accepted');
  return taken.length ? taken[taken.length - 1].after : clause.text;
}
/* The one change still awaiting a decision on a clause, as a given side can see
   it. An unsent draft is visible only to the side that wrote it. */
function labPendingOn(changes, clauseId, side){
  return (changes || []).find(x => x.clauseId === clauseId && x.status === 'pending'
    && (x.sent === true || x.side === side)) || null;
}
/* Can this side decide this change? Two conditions, both in the model rather
   than in the buttons so a new control cannot route around them. */
function labCanDecide(change, side){
  if(!change || change.status !== 'pending') return false;
  if(change.sent !== true) return false;          // not on the table yet
  return change.side !== side;                    // nobody rules on their own ask
}

function labFileChange(lab, opts){
  const before = String(opts.before == null ? '' : opts.before);
  const after  = String(opts.after == null ? '' : opts.after);
  if(!after.trim() || after.trim() === before.trim()) return null;
  /* One live ask per clause per side, as the real model does: re-editing a
     clause you already have on the table revises that ask rather than opening
     a second one, because two pending changes to the same words cannot both
     be right. */
  const live = lab.changes.find(x => x.clauseId === opts.clauseId
    && x.status === 'pending' && x.side === opts.side);
  if(live){
    live.after = after;
    live.at = nowISO();
    live.revised = (live.revised || 0) + 1;
    if(live.sent) live.sent = false;              // a revised ask goes back in hand
    return live;
  }
  const ch = {
    id: 'L-' + String(lab.nextId++).padStart(3, '0'),
    clauseId: opts.clauseId,
    clauseLabel: opts.clauseLabel || opts.clauseId,
    before, after,
    side: opts.side, author: opts.author,
    status: 'pending', sent: false,
    at: nowISO()
  };
  lab.changes.push(ch);
  return ch;
}
function labSendChange(lab, id){
  const ch = lab.changes.find(x => x.id === id);
  if(!ch || ch.sent === true || ch.status !== 'pending') return null;
  ch.sent = true; ch.sentAt = nowISO();
  return ch;
}
function labDecide(lab, id, decision, user, side){
  const ch = lab.changes.find(x => x.id === id);
  if(!labCanDecide(ch, side)) return null;
  ch.status = decision === 'accepted' ? 'accepted' : 'rejected';
  ch.decidedAt = nowISO();
  ch.decidedBy = { name: (user && user.name) || 'You',
    org: side === LAB_US ? (window.FIRST_PARTY || 'This workspace') : 'The counterparty' };
  ch.closedThreads = labResolveLinked(lab, id, user, side);
  return ch;
}

/* ---------- auto-resolve ----------
   A conversation pinned to a change ends when the change is decided, and says
   who ended it. Accepting and rejecting both close it — the question "are we
   taking sixty days?" is answered either way. */
function labResolveLinked(lab, changeId, user, side){
  let n = 0;
  for(const t of lab.threads){
    if(t.changeId === changeId && t.status === 'open'){
      t.status = 'resolved';
      t.resolvedAt = nowISO();
      t.resolvedBy = { name: (user && user.name) || 'System',
        org: side === LAB_THEM ? 'The counterparty' : (window.FIRST_PARTY || 'This workspace') };
      n++;
    }
  }
  return n;
}

/* ============================================================
   THE LAB'S COPY OF THE DOCUMENT
   ============================================================ */

/* Taken once, from the contract's working wording, and kept. Re-reading the
   contract on every render would mean the lab quietly changed underneath a
   test in progress; and a copy is the only thing that makes editing safe. */
/* Ids are STAMPED into the copy as it is taken, not derived from it later.
   A clause the lab cannot address by id is a clause the lab cannot edit, and
   the working wording of a contract that has never been through a negotiation
   carries no ids at all — which is most of them. This is the same call
   js/negotiation.js makes when it opens a round, for the same reason. */
function labBaseline(c, lab){
  if(lab.baseHtml) return lab.baseHtml;
  const body = window.negoBodyOf ? negoBodyOf(c) : '';
  // clauseStampIds returns { html, stamped, headingless } — the html, not the record
  const stamped = (body && window.clauseStampIds) ? clauseStampIds(body) : null;
  lab.baseHtml = (stamped && stamped.html) || body || '';
  return lab.baseHtml;
}
function labClausesOf(lab){
  if(!lab.baseHtml || !window.clauseSegment) return [];
  try{ return clauseSegment(lab.baseHtml) || []; }catch(e){ return []; }
}
function labTopics(lab){
  const out = [{ value: 'general', label: 'The contract generally' }];
  for(const ch of lab.changes)
    out.push({ value: 'change:' + ch.id, changeId: ch.id,
      label: `Change ${ch.id} — ${ch.clauseLabel}` });
  return out;
}

/* ---------- seeding ----------
   An empty page tests nothing, and hand-typing four messages before every trial
   is how a sandbox stops being used. Wiped by the same button that clears the
   lab. */
function labSeed(c, lab){
  const clauses = labClausesOf(lab);
  if(!clauses.length) return false;
  const target = clauses[clauses.length - 1];
  const cp = c.counterparty || 'the counterparty';
  const ch = labFileChange(lab, {
    clauseId: target.clauseId,
    clauseLabel: window.clauseLabel ? clauseLabel(target) : (target.headingText || target.clauseId),
    before: target.text,
    after: target.text.replace(/\bthirty \(30\) days\b/i, 'sixty (60) days')
         + (/(thirty \(30\) days)/i.test(target.text) ? '' : ' Either party may terminate on sixty (60) days written notice.'),
    side: LAB_THEM, author: 'Amina Wanjiru · ' + cp
  });
  if(ch) labSendChange(lab, ch.id);
  const at = nowISO();
  lab.threads.push(
    { id: labUid('th'), visibility: LAB_SHARED, status: 'open',
      changeId: ch ? ch.id : null,
      topicLabel: ch ? `Change ${ch.id} — ${ch.clauseLabel}` : 'The contract generally',
      messages: [{ id: labUid('m'), author: 'Amina Wanjiru', org: cp, at,
        body: 'The longer notice period gives us time to re-tender if it comes to that. Nothing else on this clause.' }] },
    { id: labUid('th'), visibility: LAB_INTERNAL, status: 'open',
      changeId: ch ? ch.id : null,
      topicLabel: ch ? `Change ${ch.id} — ${ch.clauseLabel}` : 'The contract generally',
      messages: [{ id: labUid('m'), author: 'Sarah Chen', org: window.FIRST_PARTY || 'Us', at,
        body: 'This one is free to give — it matches our standard SLA. Take it, but hold the cure period where it is. If they come back on cure, that is the one to trade.' }] },
    { id: labUid('th'), visibility: LAB_INTERNAL, status: 'open',
      changeId: null, topicLabel: 'The contract generally',
      messages: [{ id: labUid('m'), author: 'David Otieno', org: window.FIRST_PARTY || 'Us', at,
        body: 'Finance want the value re-checked before we close this round. Do not send anything back until Thursday.' }] }
  );
  return true;
}

/* ============================================================
   RENDERING
   ============================================================ */
const LAB_CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px';
const LAB_H6   = 'margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
const LAB_GOLD = '#8a6a2a';

function labChip(text, kind){
  const pal = {
    internal: `background:#f4ecd8;color:${LAB_GOLD};border:1px solid rgba(138,106,42,.28)`,
    shared:   'background:var(--color-accent-100);color:var(--color-accent-800);border:1px solid var(--color-accent-300)',
    open:     'background:var(--color-bg);color:var(--color-neutral-700);border:1px solid var(--color-divider)',
    good:     'background:#e6f1ec;color:#1e6b4d;border:1px solid rgba(30,107,77,.25)',
    bad:      'background:#f9ecea;color:#8f322b;border:1px solid rgba(143,50,43,.22)',
    draft:    `background:transparent;color:${LAB_GOLD};border:1px dashed rgba(138,106,42,.5)`,
    quiet:    'background:transparent;color:var(--color-neutral-600);border:1px solid var(--color-divider)'
  }[kind] || '';
  return `<span class="badge" style="${pal}">${esc(text)}</span>`;
}
function labRedlineHtml(before, after){
  if(window.redlineOps && window.redlineOpsHtml){
    const ops = redlineOps(before, after);
    return redlineOpsHtml(ops, { insClass: 'lab-ins', delClass: 'lab-del' });
  }
  return `<span class="lab-del">${esc(before)}</span> <span class="lab-ins">${esc(after)}</span>`;
}

function labDocHtml(c, lab, side, external){
  const clauses = labClausesOf(lab);
  if(!clauses.length)
    return `<p style="font-size:12.5px;color:var(--color-neutral-600);line-height:1.6">This contract has no clause structure the lab can read yet. Open it on the Doc page first, or try one with drafted wording.</p>`;
  const changes = external ? labShareChanges(lab.changes) : lab.changes;
  return clauses.map(cl => {
    const label = window.clauseLabel ? clauseLabel(cl) : (cl.headingText || cl.clauseId);
    const now = labClauseText(cl, changes);
    const pending = labPendingOn(changes, cl.clauseId, side);
    const body = pending
      ? labRedlineHtml(pending.before, pending.after)
      : esc(now);
    return `
    <div style="margin:0 0 16px" data-lab-clause="${esc(cl.clauseId)}">
      <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-size:13.5px;font-weight:700">${esc(label)}</span>
        ${pending ? labChip(pending.sent ? 'change ' + pending.id : 'your draft ' + pending.id,
          pending.sent ? 'open' : 'draft') : ''}
      </div>
      <div style="font-size:14px;line-height:1.72">${body}</div>
      ${external ? '' : `<div style="margin-top:5px">
        <button class="ui-btn" data-lab-edit="${esc(cl.clauseId)}" style="font-size:11px;padding:3px 9px">Change this clause</button>
      </div>`}
    </div>`;
  }).join('');
}

function labChangeCardHtml(ch, side, external){
  const mine = ch.side === side;
  const canDecide = !external && labCanDecide(ch, side);
  return `
  <div style="border:1px solid var(--color-divider);background:var(--color-bg);border-radius:6px;padding:11px 13px;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-family:var(--font-mono);font-size:11.5px;color:var(--color-neutral-700)">${esc(ch.id)}</span>
      ${labChip(ch.clauseLabel, 'quiet')}
      ${ch.status === 'accepted' ? labChip('Accepted', 'good')
        : ch.status === 'rejected' ? labChip('Rejected', 'bad')
        : ch.sent ? labChip('Awaiting a decision', 'open') : labChip('Not sent', 'draft')}
    </div>
    <div style="font-size:12.5px;line-height:1.6">${labRedlineHtml(ch.before, ch.after)}</div>
    <div style="font-size:10.5px;color:var(--color-neutral-500)">${esc(ch.author)}${ch.revised ? ' · revised ' + ch.revised + '×' : ''}</div>
    ${ch.decidedAt ? `<div style="font-size:10.5px;color:var(--color-neutral-600)">Decided by ${esc(
      /* Their copy names the ORGANISATION — decidedByOrg is the only name in
         the payload — and ours names the colleague. Reading decidedBy.name on
         their side found nothing and printed "someone". */
      (external ? ch.decidedByOrg : (ch.decidedBy && ch.decidedBy.name)) || 'the other side')}${
      ch.closedThreads ? ` · ${ch.closedThreads} thread${ch.closedThreads === 1 ? '' : 's'} closed with it` : ''}</div>` : ''}
    ${external || ch.status !== 'pending' ? '' : `<div style="display:flex;gap:6px;flex-wrap:wrap">
      ${!ch.sent && mine ? `<button class="ui-btn ui-btn-primary" data-lab-send="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Send it</button>` : ''}
      ${canDecide ? `<button class="ui-btn" data-lab-accept="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Accept</button>
        <button class="ui-btn" data-lab-reject="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Reject</button>` : ''}
      ${ch.sent && mine ? `<span style="font-size:11px;color:var(--color-neutral-600);align-self:center">Yours — the other side decides this one.</span>` : ''}
    </div>`}
  </div>`;
}

function labThreadHtml(t, opts){
  const owner = !!(opts && opts.owner);
  const internal = t.visibility === LAB_INTERNAL;
  const resolved = t.status === 'resolved';
  const msgs = (t.messages || []).map(m => `
    <div style="display:flex;flex-direction:column;gap:3px">
      <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:600">${esc(m.author)}</span>
        <span style="font-size:10.5px;color:var(--color-neutral-500)">· ${esc(m.org || '')}</span>
      </div>
      <div style="font-size:12.5px;line-height:1.6;color:var(--color-neutral-800)">${esc(m.body)}</div>
      <div style="font-size:10px;color:var(--color-neutral-500)">${esc(fmtDT(m.at))}</div>
    </div>`).join('');
  return `
  <div style="border:1px solid ${internal ? 'rgba(138,106,42,.35)' : 'var(--color-divider)'};background:${internal ? '#faf5e9' : 'var(--color-surface)'};border-radius:6px;padding:11px 13px;display:flex;flex-direction:column;gap:9px;${resolved ? 'opacity:.66' : ''}">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      ${internal ? labChip('Internal', 'internal') : labChip('Shared', 'shared')}
      ${resolved ? labChip('Resolved', 'good') : labChip('Open', 'open')}
      ${t.changeId ? labChip('on ' + t.changeId, 'quiet') : ''}
    </div>
    <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(t.topicLabel || 'The contract generally')}</div>
    ${msgs}
    ${resolved ? `<div style="font-size:10.5px;color:#1e6b4d">Closed${t.resolvedAt ? ' on ' + esc(fmtDT(t.resolvedAt)) : ''}${
      owner && t.resolvedBy ? ' by ' + esc(t.resolvedBy.name) : (t.resolvedByOrg ? ' by ' + esc(t.resolvedByOrg) : '')}</div>` : ''}
    ${owner && !resolved ? `<div><button class="ui-btn" data-lab-resolve="${esc(t.id)}" style="font-size:11px;padding:4px 10px">Mark resolved</button></div>` : ''}
  </div>`;
}

function renderDocLab(){
  const content = document.getElementById('content');
  const c = getContract(state.activeId);

  if(!c){
    content.innerHTML = `
    <div class="view-enter" style="display:grid;place-items:center;min-height:60vh;padding:32px">
      <div style="text-align:center;max-width:420px">
        <h3 style="font-size:17px;margin:0 0 6px">No contract open</h3>
        <p style="font-size:13px;line-height:1.6;color:var(--color-neutral-700);margin:0 0 16px">The Doc Lab works on whichever contract is open, so open one from the register first. Nothing you do in the lab touches the contract itself.</p>
        <button class="ui-btn ui-btn-primary" onclick="setView('register')">Open the register</button>
      </div>
    </div>`;
    return;
  }
  if(window.API_MODE && API_MODE() && !c._loaded && window.ensureFull){
    content.innerHTML = `<div class="view-enter" style="display:grid;place-items:center;min-height:50vh;font-size:13px;color:var(--color-neutral-600)">Loading contract…</div>`;
    ensureFull(c).then(() => { if(state.activeId === c.id && state.view === 'doclab') renderDocLab(); }).catch(() => {});
    return;
  }

  const lab = labFor(c.id);
  const hadBase = !!lab.baseHtml;
  labBaseline(c, lab);
  if(!hadBase && lab.baseHtml) labPut(c.id, lab);

  const external = state.labView === 'external';
  const side = external ? LAB_THEM : (state.labSide === LAB_THEM ? LAB_THEM : LAB_US);
  const held = labWithheld(lab);
  const payload = labSharePayload(lab);
  const threadsToDraw = external ? payload.threads : lab.threads;
  const changesToDraw = external ? payload.changes : lab.changes;

  content.innerHTML = `
  <style>
    .lab-ins{color:#1e6b4d;background:rgba(46,135,99,.12);border-radius:2px;padding:0 2px;font-weight:600}
    .lab-del{color:#8f322b;background:rgba(176,69,60,.10);border-radius:2px;padding:0 2px;text-decoration:line-through}
  </style>
  <div class="view-enter" style="padding:14px 16px 24px;display:flex;flex-direction:column;gap:12px">

    <section style="${LAB_CARD};padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h3 style="font-size:16px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</h3>
          ${labChip('Sandbox', 'internal')}
        </div>
        <div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px">${esc(c.id)}${c.counterparty ? ' · ' + esc(c.counterparty) : ''} — a copy of the document you can edit freely. Nothing here is saved to the contract or sent anywhere.</div>
      </div>
      ${external ? '' : `
      <div style="display:inline-flex;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden;flex:none">
        <button id="lab-side-us" class="ui-btn" style="border:0;border-radius:0;font-size:12px;${side === LAB_US ? 'background:var(--color-neutral-800);color:#fff' : ''}">Acting as us</button>
        <button id="lab-side-them" class="ui-btn" style="border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px;${side === LAB_THEM ? 'background:var(--color-neutral-800);color:#fff' : ''}">Acting as them</button>
      </div>`}
      <div style="display:inline-flex;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden;flex:none">
        <button id="lab-int" class="ui-btn" style="border:0;border-radius:0;font-size:12px;${external ? '' : 'background:var(--color-accent);color:#fff'}">Your workspace</button>
        <button id="lab-ext" class="ui-btn" style="border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px;${external ? 'background:var(--color-accent);color:#fff' : ''}">Counterparty's view</button>
      </div>
    </section>

    ${external ? `
    <section style="${LAB_CARD};padding:11px 16px;background:var(--color-accent-100);border-color:var(--color-accent-300)">
      <div style="font-size:12px;line-height:1.6;color:var(--color-accent-900)">
        Drawn from what <code style="font-family:var(--font-mono);font-size:11px">labSharePayload()</code> returned — <b>${payload.changes.length} change${payload.changes.length === 1 ? '' : 's'}</b> and <b>${payload.threads.length} thread${payload.threads.length === 1 ? '' : 's'}</b>.
        Internal notes and unsent drafts are not hidden here; they were never put in the object this page is rendering.
      </div>
    </section>` : ((held.threads || held.drafts) ? `
    <section style="${LAB_CARD};padding:11px 16px;border-left:3px solid ${LAB_GOLD}">
      <div style="font-size:12px;line-height:1.6;color:var(--color-neutral-800)">
        Staying behind if this were shared right now: <b>${held.threads} internal thread${held.threads === 1 ? '' : 's'}</b> (${held.messages} message${held.messages === 1 ? '' : 's'})${held.drafts ? ` and <b>${held.drafts} unsent draft change${held.drafts === 1 ? '' : 's'}</b>` : ''}. Switch to the counterparty's view to check.
      </div>
    </section>` : '')}

    <div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(330px,1fr);gap:12px;align-items:start">

      <section style="${LAB_CARD};padding:18px 22px 26px;min-width:0">
        <h6 style="${LAB_H6};margin-bottom:14px">Working document${external ? ' · as they see it' : ' · the lab’s own copy'}</h6>
        <div style="font-family:var(--font-doc);color:var(--color-doc-text)">${labDocHtml(c, lab, side, external)}</div>
      </section>

      <div style="display:flex;flex-direction:column;gap:12px;min-width:0">

        <section style="${LAB_CARD};padding:14px 16px">
          <h6 style="${LAB_H6};margin-bottom:10px">Changes${external ? ' on the table' : ''}</h6>
          ${changesToDraw.length
            ? `<div style="display:flex;flex-direction:column;gap:8px">${changesToDraw.map(ch => labChangeCardHtml(ch, side, external)).join('')}</div>`
            : `<div style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">${external
                ? 'Nothing has been sent to them yet.'
                : 'No changes yet. Use <b>Change this clause</b> in the document, or seed a round below.'}</div>`}
        </section>

        <section style="${LAB_CARD};padding:14px 16px">
          <h6 style="${LAB_H6};margin-bottom:10px">Discussion${external ? ' · as they see it' : ''}</h6>
          ${threadsToDraw.length
            ? `<div style="display:flex;flex-direction:column;gap:9px">${threadsToDraw.map(t => labThreadHtml(t, { owner: !external })).join('')}</div>`
            : `<div style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">${external
                ? 'Nothing has been shared with them yet.'
                : 'No threads yet. Write one below, or seed a round.'}</div>`}
        </section>

        ${external ? `
        <section style="${LAB_CARD};padding:14px 16px">
          <div style="font-size:12px;line-height:1.6;color:var(--color-neutral-700)">A counterparty has no composer for internal notes, because internal is not a thing that exists on their side of the wall.</div>
        </section>` : `
        <section style="${LAB_CARD};padding:14px 16px;display:flex;flex-direction:column;gap:10px">
          <h6 style="${LAB_H6}">Write a message</h6>

          <div style="display:flex;gap:0;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden">
            <button id="lab-vis-int" class="ui-btn" style="flex:1;border:0;border-radius:0;font-size:12px;background:#f4ecd8;color:${LAB_GOLD};font-weight:600">Internal note</button>
            <button id="lab-vis-sh" class="ui-btn" style="flex:1;border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px">Send to ${esc(c.counterparty || 'the counterparty')}</button>
          </div>
          <input type="hidden" id="lab-vis" value="${LAB_INTERNAL}"/>
          <div id="lab-vis-note" style="font-size:11px;line-height:1.5;color:${LAB_GOLD}">This will stay inside ${esc(window.FIRST_PARTY || 'your organisation')}. It is not in the share payload.</div>

          <label style="display:block">
            <span style="font-size:10.5px;color:var(--color-neutral-600)">About</span>
            <select id="lab-topic" style="width:100%;font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:7px 9px;color:inherit;margin-top:3px">
              ${labTopics(lab).map(t => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join('')}
            </select>
          </label>

          <textarea id="lab-body" rows="3" placeholder="What do you want to say?" style="width:100%;font:inherit;font-size:12.5px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 10px;color:inherit;resize:vertical"></textarea>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="lab-send-msg" class="ui-btn ui-btn-primary" style="font-size:12px">Post to the lab</button>
            <button id="lab-seed" class="ui-btn" style="font-size:12px">Seed a round</button>
            <button id="lab-clear" class="ui-btn" style="font-size:12px">Clear the lab</button>
          </div>
        </section>`}

      </div>
    </div>

    <section style="${LAB_CARD};padding:14px 18px">
      <h6 style="${LAB_H6};margin-bottom:8px">What this page is proving</h6>
      <div style="font-size:12.5px;line-height:1.7;color:var(--color-neutral-800);max-width:78ch">
        The counterparty column is rendered <b>from</b> the object <code style="font-family:var(--font-mono);font-size:11px">labSharePayload()</code> hands back, not from the full list with the internal material styled out of sight. If the filter were wrong the material would appear here, because there would be nothing left to hide it.
        Two fields decide what travels, and both are explicit allow: a thread goes only if its visibility says <code style="font-family:var(--font-mono);font-size:11px">shared</code>, a change only once it has been sent. A field nobody set means it stays home.
        The wording is rebuilt from the accepted changes on every read rather than written over the clause, so rejecting everything reproduces the original exactly — and the side that proposed a change cannot be the side that accepts it.
      </div>
    </section>

  </div>`;

  wireDocLab(c, lab, side, external);
}

function wireDocLab(c, lab, side, external){
  const on = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
  const save = () => labPut(c.id, lab);
  const repaint = () => renderDocLab();
  const u = () => currentUser();

  on('lab-int', () => { state.labView = 'internal'; repaint(); });
  on('lab-ext', () => { state.labView = 'external'; repaint(); });
  on('lab-side-us',   () => { state.labSide = LAB_US;   repaint(); });
  on('lab-side-them', () => { state.labSide = LAB_THEM; repaint(); });

  /* ---- editing a clause ---- */
  document.querySelectorAll('[data-lab-edit]').forEach(b => b.addEventListener('click', () => {
    const clauseId = b.getAttribute('data-lab-edit');
    const cl = labClausesOf(lab).find(x => x.clauseId === clauseId);
    if(!cl) return;
    const changes = lab.changes;
    const live = labPendingOn(changes, clauseId, side);
    const current = live ? live.after : labClauseText(cl, changes);
    const label = window.clauseLabel ? clauseLabel(cl) : (cl.headingText || clauseId);
    const host = b.closest('[data-lab-clause]');
    if(!host || host.querySelector('[data-lab-editor]')) return;
    const box = document.createElement('div');
    box.setAttribute('data-lab-editor', '1');
    box.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:7px';
    box.innerHTML = `
      <div style="font-size:10.5px;color:var(--color-neutral-600)">Rewrite ${esc(label)} as ${side === LAB_US ? esc(window.FIRST_PARTY || 'us') : esc(c.counterparty || 'the counterparty')}. Nothing moves until the other side accepts it.</div>
      <textarea rows="5" style="width:100%;font:inherit;font-size:12.5px;font-family:var(--font-doc);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 10px;color:inherit;resize:vertical"></textarea>
      <div style="display:flex;gap:7px"><button class="ui-btn ui-btn-primary" data-lab-save style="font-size:11.5px">Propose it</button><button class="ui-btn" data-lab-cancel style="font-size:11.5px">Cancel</button></div>`;
    host.appendChild(box);
    const ta = box.querySelector('textarea');
    ta.value = current; ta.focus();
    box.querySelector('[data-lab-cancel]').addEventListener('click', () => box.remove());
    box.querySelector('[data-lab-save]').addEventListener('click', () => {
      const ch = labFileChange(lab, {
        clauseId, clauseLabel: label,
        before: labClauseText(cl, lab.changes),
        after: ta.value,
        side,
        author: (u() && u().name ? u().name : 'You') + ' · '
          + (side === LAB_US ? (window.FIRST_PARTY || 'us') : (c.counterparty || 'the counterparty'))
      });
      if(!ch){ if(window.toast) toast('Nothing changed in that clause', 'err'); return; }
      save(); repaint();
      if(window.toast) toast(`${ch.id} filed — it is yours until you send it`);
    });
  }));

  /* ---- sending and deciding ---- */
  document.querySelectorAll('[data-lab-send]').forEach(b => b.addEventListener('click', () => {
    const ch = labSendChange(lab, b.getAttribute('data-lab-send'));
    if(!ch) return;
    save(); repaint();
    if(window.toast) toast(`${ch.id} sent — it is on the other side's table now`);
  }));
  const decide = (id, decision) => {
    const ch = labDecide(lab, id, decision, u(), side);
    if(!ch){ if(window.toast) toast('You cannot decide your own ask — switch sides to answer it', 'err'); return; }
    save(); repaint();
    if(window.toast) toast(ch.closedThreads
      ? `${ch.id} ${decision}, and ${ch.closedThreads} linked thread${ch.closedThreads === 1 ? '' : 's'} closed with it`
      : `${ch.id} ${decision}`);
  };
  document.querySelectorAll('[data-lab-accept]').forEach(b =>
    b.addEventListener('click', () => decide(b.getAttribute('data-lab-accept'), 'accepted')));
  document.querySelectorAll('[data-lab-reject]').forEach(b =>
    b.addEventListener('click', () => decide(b.getAttribute('data-lab-reject'), 'rejected')));

  /* ---- messages ---- */
  const visIn = document.getElementById('lab-vis');
  const note  = document.getElementById('lab-vis-note');
  const bInt  = document.getElementById('lab-vis-int');
  const bSh   = document.getElementById('lab-vis-sh');
  function setVis(v){
    if(!visIn) return;
    visIn.value = v;
    const isInt = v === LAB_INTERNAL;
    if(bInt){ bInt.style.background = isInt ? '#f4ecd8' : ''; bInt.style.color = isInt ? LAB_GOLD : ''; bInt.style.fontWeight = isInt ? '600' : ''; }
    if(bSh){ bSh.style.background = isInt ? '' : 'var(--color-accent)'; bSh.style.color = isInt ? '' : '#fff'; bSh.style.fontWeight = isInt ? '' : '600'; }
    if(note){
      note.style.color = isInt ? LAB_GOLD : 'var(--color-accent-800)';
      note.textContent = isInt
        ? `This will stay inside ${window.FIRST_PARTY || 'your organisation'}. It is not in the share payload.`
        : `This goes to ${c.counterparty || 'the counterparty'} the next time the contract is shared.`;
    }
  }
  if(bInt) bInt.addEventListener('click', () => setVis(LAB_INTERNAL));
  if(bSh)  bSh.addEventListener('click', () => setVis(LAB_SHARED));

  on('lab-send-msg', () => {
    const body = (document.getElementById('lab-body') || {}).value || '';
    if(!body.trim()){ if(window.toast) toast('Write the message first', 'err'); return; }
    const sel = document.getElementById('lab-topic');
    const topic = labTopics(lab).find(t => t.value === (sel ? sel.value : 'general')) || { label: 'The contract generally' };
    lab.threads.push({
      id: labUid('th'),
      visibility: (visIn && visIn.value) === LAB_SHARED ? LAB_SHARED : LAB_INTERNAL,
      status: 'open',
      changeId: topic.changeId || null,
      topicLabel: topic.label,
      messages: [{ id: labUid('m'), author: (u() && u().name) || 'You',
        org: side === LAB_US ? (window.FIRST_PARTY || 'Us') : (c.counterparty || 'Them'),
        body: body.trim(), at: nowISO() }]
    });
    save(); repaint();
  });

  document.querySelectorAll('[data-lab-resolve]').forEach(b => b.addEventListener('click', () => {
    const t = lab.threads.find(x => x.id === b.getAttribute('data-lab-resolve'));
    if(!t) return;
    t.status = 'resolved'; t.resolvedAt = nowISO();
    t.resolvedBy = { name: (u() && u().name) || 'You',
      org: side === LAB_THEM ? 'The counterparty' : (window.FIRST_PARTY || 'This workspace') };
    save(); repaint();
  }));

  on('lab-seed',  () => {
    if(!labSeed(c, lab)){ if(window.toast) toast('This contract has no clauses the lab can read', 'err'); return; }
    save(); repaint();
  });
  on('lab-clear', () => { labClear(c.id); repaint(); });
}

if (typeof window !== 'undefined') Object.assign(window, {
  LAB_KEY, LAB_INTERNAL, LAB_SHARED, LAB_US, LAB_THEM,
  labLoad, labFor, labPut, labClear, labUid,
  labSharePayload, labShareChanges, labWithheld,
  labClauseText, labPendingOn, labCanDecide,
  labFileChange, labSendChange, labDecide, labResolveLinked,
  labBaseline, labClausesOf, labTopics, labSeed,
  renderDocLab, wireDocLab
});
