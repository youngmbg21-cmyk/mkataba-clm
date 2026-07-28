// HaTi — Doc Lab: a sandbox beside the Doc page, for trying the internal wall
// before deciding whether to move the real product onto it.
// Globals are window-attached like every module (see components.js).
//
// WHY THIS IS A SEPARATE PAGE AND NOT A BRANCH OF THE DOC PAGE
//
// The proposal on the table adds two fields the product has never had:
//   · visibility — 'internal' | 'shared' — on a conversation, so a team can
//     talk among themselves while a deal is live.
//   · status — 'open' | 'resolved' — plus an optional link to a change, so a
//     conversation ends when the thing it was about is decided.
//
// Both are cheap to add and expensive to get wrong. Marking a message internal
// and having it reach the counterparty anyway is the single worst failure this
// product could have: it is not a rendering bug, it is a client reading your
// negotiating position. So the approach gets proven on a page that CANNOT do
// that damage, and only then moves into js/discuss.js and buildSharePayload().
//
// WHAT MAKES THIS SANDBOX ACTUALLY SAFE
//
//   1. Lab threads live in localStorage under their own key, never on the
//      contract record. Nothing here is persisted through persist(), so no lab
//      message can reach the server, the share payload or a portal link.
//   2. Lab decisions on a change are held in the same place. Accepting a change
//      HERE does not accept it there — the real negotiation is untouched, and
//      the real accept/reject guarantees (silence rejects; nobody rules on
//      their own ask) are not being re-implemented or weakened.
//   3. The document is rendered read-only through the real docBody(), so this
//      is the same contract you see on the Doc page rather than a mock-up of it.
//
// WHAT IS BEING TESTED, PRECISELY
//
// The counterparty view on this page is NOT the owner view with the internal
// notes hidden by CSS. It is rendered from the object labSharePayload() returns
// — the same shape of decision buildSharePayload() makes in js/core.js:1564.
// If the filter is wrong, this page shows it, because the material simply is
// not in the object the view is drawn from. Hiding with a stylesheet would test
// nothing: the data would still have been sent.

/* ---------- the store ----------
   Its own key, deliberately. A lab that shared the contract record would be one
   forgotten persist() away from writing test threads into a real negotiation. */
const LAB_KEY = 'hati.lab.v1';
const LAB_INTERNAL = 'internal';
const LAB_SHARED   = 'shared';

function labLoad(){
  try{ return JSON.parse(localStorage.getItem(LAB_KEY) || '{}') || {}; }
  catch(e){ return {}; }
}
function labFor(cid){
  const rec = labLoad()[cid];
  return { threads: (rec && rec.threads) || [], decisions: (rec && rec.decisions) || {} };
}
function labPut(cid, lab){
  const all = labLoad();
  all[cid] = { threads: lab.threads || [], decisions: lab.decisions || {} };
  try{ localStorage.setItem(LAB_KEY, JSON.stringify(all)); }
  catch(e){ if(window.toast) toast('The lab could not save to this browser — it is out of space','err'); }
}
function labClear(cid){
  const all = labLoad(); delete all[cid];
  try{ localStorage.setItem(LAB_KEY, JSON.stringify(all)); }catch(e){}
}
const labUid = p => p + '_' + Math.random().toString(36).slice(2, 9);

/* ---------- THE DOOR ----------
   Everything this page is for is in this one function.

   The rule is EXPLICIT ALLOW, and the difference from the obvious way to write
   it is the whole point. The sample engine that prompted this experiment filters
   with `c.visibility !== 'internal_draft'` — which passes anything whose
   visibility is undefined, so a thread created by a screen that forgot to set
   the field is sent. A filter written that way leaks by default and does it
   silently: no error, no warning, no failing test.

   Written this way, a thread reaches the other side only by saying so. A
   forgotten field means the conversation stays home, which is the failure you
   can live with. */
function labSharePayload(lab){
  const threads = (lab && lab.threads) || [];
  return {
    threads: threads
      .filter(t => t.visibility === LAB_SHARED)
      .map(t => ({
        id: t.id,
        topicLabel: t.topicLabel,
        changeId: t.changeId || null,
        status: t.status,
        resolvedAt: t.resolvedAt || null,
        /* The internal NAME of whoever closed the thread stays behind and the
           organisation speaks instead — the same call buildSharePayload()
           already makes for whoever ruled on a change. */
        resolvedByOrg: t.resolvedBy ? t.resolvedBy.org : null,
        messages: (t.messages || []).map(m => ({
          id: m.id, author: m.author, org: m.org, body: m.body, at: m.at
        }))
      }))
  };
}
/* What was held back, counted rather than described. Shown to the OWNER only,
   so the person testing can see the door did something without the counterparty
   view revealing that anything exists behind it. */
function labWithheld(lab){
  const threads = (lab && lab.threads) || [];
  const t = threads.filter(x => x.visibility !== LAB_SHARED);
  return { threads: t.length, messages: t.reduce((n, x) => n + ((x.messages || []).length), 0) };
}

/* ---------- auto-resolve ----------
   The second half of the proposal: a conversation pinned to a change ends when
   the change is decided, and says who ended it. Accepting and rejecting both
   close it — the question "are we taking 60 days?" is answered either way. */
function labResolveLinked(lab, changeId, user){
  let n = 0;
  for(const t of lab.threads){
    if(t.changeId === changeId && t.status === 'open'){
      t.status = 'resolved';
      t.resolvedAt = nowISO();
      t.resolvedBy = { name: (user && user.name) || 'System', org: window.FIRST_PARTY || 'This workspace' };
      n++;
    }
  }
  return n;
}

/* ---------- what a lab thread can be pinned to ----------
   Real changes off the real negotiation, read-only. A lab that invented its own
   changes would be testing a different product. */
function labChanges(c){
  const all = (window.negoAllChanges ? negoAllChanges(c) : []) || [];
  return all.filter(x => x.status !== 'superseded').slice(-8);
}
function labTopics(c){
  const out = [{ value: 'general', label: 'The contract generally' }];
  for(const ch of labChanges(c))
    out.push({ value: 'change:' + ch.id, label: `Change #${ch.id} — ${ch.summary || ch.clauseLabel || ch.clauseId}`, changeId: ch.id });
  return out;
}

/* ---------- seeding ----------
   An empty page tests nothing, and hand-typing four messages before every trial
   is how a sandbox stops being used. The seed is clearly labelled and wiped by
   the same button that clears the lab. */
function labSeed(c){
  const lab = labFor(c.id);
  const chs = labChanges(c);
  const pinned = chs.length ? chs[chs.length - 1] : null;
  const cp = c.counterparty || 'the counterparty';
  const at = nowISO();
  lab.threads = [
    { id: labUid('th'), visibility: LAB_SHARED, status: 'open',
      changeId: pinned ? pinned.id : null,
      topicLabel: pinned ? `Change #${pinned.id} — ${pinned.summary || pinned.clauseId}` : 'The contract generally',
      messages: [{ id: labUid('m'), author: 'Amina Wanjiru', org: cp, at,
        body: 'We need the longer notice period so we can re-tender if it comes to that. Nothing else on this clause.' }] },
    { id: labUid('th'), visibility: LAB_INTERNAL, status: 'open',
      changeId: pinned ? pinned.id : null,
      topicLabel: pinned ? `Change #${pinned.id} — ${pinned.summary || pinned.clauseId}` : 'The contract generally',
      messages: [{ id: labUid('m'), author: 'Sarah Chen', org: window.FIRST_PARTY || 'Us', at,
        body: 'This one is free to give — it matches our standard SLA. Take it, but hold the cure period where it is. If they come back on cure, that is the one to trade.' }] },
    { id: labUid('th'), visibility: LAB_INTERNAL, status: 'open',
      changeId: null, topicLabel: 'The contract generally',
      messages: [{ id: labUid('m'), author: 'David Otieno', org: window.FIRST_PARTY || 'Us', at,
        body: 'Finance want the value re-checked before we close this round. Do not send anything back until Thursday.' }] }
  ];
  labPut(c.id, lab);
}

/* ---------- rendering ---------- */
const LAB_CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px';
const LAB_H6   = 'margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
const LAB_GOLD = '#8a6a2a';

function labChipHtml(text, kind){
  const pal = {
    internal: `background:#f4ecd8;color:${LAB_GOLD};border:1px solid rgba(138,106,42,.28)`,
    shared:   'background:var(--color-accent-100);color:var(--color-accent-800);border:1px solid var(--color-accent-300)',
    open:     'background:var(--color-bg);color:var(--color-neutral-700);border:1px solid var(--color-divider)',
    resolved: 'background:#e6f1ec;color:#1e6b4d;border:1px solid rgba(30,107,77,.25)',
    pin:      'background:transparent;color:var(--color-neutral-600);border:1px solid var(--color-divider)'
  }[kind] || '';
  return `<span class="badge" style="${pal}">${esc(text)}</span>`;
}

function labThreadHtml(t, opts){
  const owner = !!(opts && opts.owner);
  const internal = t.visibility === LAB_INTERNAL;
  const resolved = t.status === 'resolved';
  const border = internal ? `1px solid rgba(138,106,42,.35)` : '1px solid var(--color-divider)';
  const bg = internal ? '#faf5e9' : 'var(--color-surface)';
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
  <div style="border:${border};background:${bg};border-radius:6px;padding:11px 13px;display:flex;flex-direction:column;gap:9px;${resolved ? 'opacity:.66' : ''}">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      ${internal ? labChipHtml('Internal', 'internal') : labChipHtml('Shared', 'shared')}
      ${resolved ? labChipHtml('Resolved', 'resolved') : labChipHtml('Open', 'open')}
      ${t.changeId ? labChipHtml('on #' + t.changeId, 'pin') : ''}
    </div>
    <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(t.topicLabel || 'The contract generally')}</div>
    ${msgs}
    ${resolved ? `<div style="font-size:10.5px;color:#1e6b4d">Closed ${t.resolvedAt ? 'on ' + esc(fmtDT(t.resolvedAt)) : ''}${
      owner && t.resolvedBy ? ' by ' + esc(t.resolvedBy.name) : (t.resolvedByOrg ? ' by ' + esc(t.resolvedByOrg) : '')}</div>` : ''}
    ${owner && !resolved ? `<div><button class="ui-btn" data-lab-resolve="${esc(t.id)}" style="font-size:11px;padding:4px 10px">Mark resolved</button></div>` : ''}
  </div>`;
}

function labChangeHtml(c, ch, lab){
  const decided = lab.decisions[ch.id];
  return `
  <div style="border:1px solid var(--color-divider);background:var(--color-bg);border-radius:6px;padding:11px 13px;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span style="font-family:var(--font-mono);font-size:11.5px;color:var(--color-neutral-700)">#${esc(ch.id)}</span>
      ${labChipHtml(ch.clauseLabel || ch.clauseId || 'clause', 'pin')}
      ${decided ? labChipHtml(decided.decision === 'accepted' ? 'Accepted (lab)' : 'Rejected (lab)', 'resolved') : labChipHtml(ch.status || 'pending', 'open')}
    </div>
    <div style="font-size:12.5px;line-height:1.5">${esc(ch.summary || 'Proposed change')}</div>
    <div style="font-size:10.5px;color:var(--color-neutral-500)">${esc(ch.author || 'Unknown')}${ch.roundN ? ' · round ' + ch.roundN : ''}</div>
    ${ch.hash ? `<div style="font-family:var(--font-mono);font-size:10px;color:var(--color-neutral-500);word-break:break-all">fingerprint ${esc(String(ch.hash).slice(0, 24))}</div>` : ''}
    ${decided ? '' : `<div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="ui-btn" data-lab-accept="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Accept in the lab</button>
      <button class="ui-btn" data-lab-reject="${esc(ch.id)}" style="font-size:11px;padding:4px 10px">Reject in the lab</button>
    </div>`}
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
  const external = state.labView === 'external';
  const payload = labSharePayload(lab);
  const held = labWithheld(lab);
  const changes = labChanges(c);

  /* The counterparty column is drawn from `payload` and the owner column from
     `lab`. Two different objects on purpose — see the note on labSharePayload. */
  const threadsToDraw = external ? payload.threads : lab.threads;

  let docHtml = '';
  try{
    docHtml = window.readOnlyDocHtml && window.docBody ? readOnlyDocHtml(docBody(c)) : '<p>The document could not be drawn here.</p>';
  }catch(e){
    docHtml = `<p style="font-size:12.5px;color:var(--color-neutral-600)">The document could not be drawn in the lab (${esc(e.message)}). The Doc page is unaffected.</p>`;
  }

  content.innerHTML = `
  <div class="view-enter" style="padding:14px 16px 24px;display:flex;flex-direction:column;gap:12px">

    <section style="${LAB_CARD};padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h3 style="font-size:16px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</h3>
          <span class="badge" style="background:#f4ecd8;color:${LAB_GOLD};border:1px solid rgba(138,106,42,.28)">Sandbox</span>
        </div>
        <div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px">${esc(c.id)}${c.counterparty ? ' · ' + esc(c.counterparty) : ''} — a copy of the Doc page for testing internal vs shared. Nothing here is saved to the contract or sent anywhere.</div>
      </div>
      <div style="display:inline-flex;border:1px solid var(--color-divider);border-radius:5px;overflow:hidden;flex:none">
        <button id="lab-int" class="ui-btn" style="border:0;border-radius:0;font-size:12px;${external ? '' : 'background:var(--color-accent);color:#fff'}">Your workspace</button>
        <button id="lab-ext" class="ui-btn" style="border:0;border-left:1px solid var(--color-divider);border-radius:0;font-size:12px;${external ? 'background:var(--color-accent);color:#fff' : ''}">Counterparty's view</button>
      </div>
    </section>

    ${external ? `
    <section style="${LAB_CARD};padding:11px 16px;background:var(--color-accent-100);border-color:var(--color-accent-300)">
      <div style="font-size:12px;line-height:1.6;color:var(--color-accent-900)">
        This column is drawn from what <code style="font-family:var(--font-mono);font-size:11px">labSharePayload()</code> returned — <b>${payload.threads.length} thread${payload.threads.length === 1 ? '' : 's'}</b>.
        The internal ones are not hidden here; they were never put in the object this page is rendering.
      </div>
    </section>` : (held.threads ? `
    <section style="${LAB_CARD};padding:11px 16px;border-left:3px solid ${LAB_GOLD}">
      <div style="font-size:12px;line-height:1.6;color:var(--color-neutral-800)">
        <b>${held.threads} thread${held.threads === 1 ? '' : 's'}</b> (${held.messages} message${held.messages === 1 ? '' : 's'}) would stay behind if this contract were shared right now. Switch to the counterparty's view to check.
      </div>
    </section>` : '')}

    <div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,1fr);gap:12px;align-items:start">

      <section style="${LAB_CARD};padding:18px 22px 26px;min-width:0">
        <h6 style="${LAB_H6};margin-bottom:12px">Working document · read-only in the lab</h6>
        <div class="hati-doc" style="font-family:var(--font-doc);color:var(--color-doc-text)">${docHtml}</div>
      </section>

      <div style="display:flex;flex-direction:column;gap:12px;min-width:0">

        ${external ? '' : `
        <section style="${LAB_CARD};padding:14px 16px">
          <h6 style="${LAB_H6};margin-bottom:10px">Changes on the real negotiation</h6>
          ${changes.length
            ? `<div style="display:flex;flex-direction:column;gap:8px">${changes.map(ch => labChangeHtml(c, ch, lab)).join('')}</div>
               <div style="font-size:10.5px;color:var(--color-neutral-600);margin-top:9px;line-height:1.5">Deciding one here records a <b>lab</b> decision and closes any thread pinned to it. The real negotiation is not touched.</div>`
            : `<div style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">This contract has no changes on it yet. The lab still works — threads can be filed against the contract generally.</div>`}
        </section>`}

        <section style="${LAB_CARD};padding:14px 16px">
          <h6 style="${LAB_H6};margin-bottom:10px">Discussion${external ? ' · as they see it' : ''}</h6>
          ${threadsToDraw.length
            ? `<div style="display:flex;flex-direction:column;gap:9px">${threadsToDraw.map(t => labThreadHtml(t, { owner: !external })).join('')}</div>`
            : `<div style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">${external
                ? 'Nothing has been shared with them yet.'
                : 'No lab threads yet. Write one below, or seed a few to try the switch straight away.'}</div>`}
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
              ${labTopics(c).map(t => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join('')}
            </select>
          </label>

          <textarea id="lab-body" rows="3" placeholder="What do you want to say?" style="width:100%;font:inherit;font-size:12.5px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 10px;color:inherit;resize:vertical"></textarea>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="lab-send" class="ui-btn ui-btn-primary" style="font-size:12px">Post to the lab</button>
            <button id="lab-seed" class="ui-btn" style="font-size:12px">Seed sample threads</button>
            <button id="lab-clear" class="ui-btn" style="font-size:12px">Clear the lab</button>
          </div>
        </section>`}

      </div>
    </div>

    <section style="${LAB_CARD};padding:14px 18px">
      <h6 style="${LAB_H6};margin-bottom:8px">What this page is proving</h6>
      <div style="font-size:12.5px;line-height:1.7;color:var(--color-neutral-800);max-width:78ch">
        The counterparty column is rendered from the object <code style="font-family:var(--font-mono);font-size:11px">labSharePayload()</code> hands back, not from the full list with the internal notes styled out of sight. That is the difference between testing a filter and testing a stylesheet — if the filter were wrong, the material would appear here, because there would be nothing left to hide it.
        The filter keeps only what is explicitly marked shared. A thread whose visibility was never set stays home, which is the failure worth having.
        Threads pinned to a change close themselves when that change is decided, and the counterparty is told the organisation closed it rather than which colleague did — the same call <code style="font-family:var(--font-mono);font-size:11px">buildSharePayload()</code> already makes.
      </div>
    </section>

  </div>`;

  wireDocLab(c);
}

function wireDocLab(c){
  const on = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
  const repaint = () => renderDocLab();

  on('lab-int', () => { state.labView = 'internal'; repaint(); });
  on('lab-ext', () => { state.labView = 'external'; repaint(); });

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

  on('lab-send', () => {
    const body = (document.getElementById('lab-body') || {}).value || '';
    if(!body.trim()){ if(window.toast) toast('Write the message first', 'err'); return; }
    const sel = document.getElementById('lab-topic');
    const topicVal = sel ? sel.value : 'general';
    const topic = labTopics(c).find(t => t.value === topicVal) || { label: 'The contract generally' };
    const u = currentUser();
    const lab = labFor(c.id);
    lab.threads.push({
      id: labUid('th'),
      visibility: (visIn && visIn.value) === LAB_SHARED ? LAB_SHARED : LAB_INTERNAL,
      status: 'open',
      changeId: topic.changeId || null,
      topicLabel: topic.label,
      messages: [{ id: labUid('m'), author: (u && u.name) || 'You',
        org: window.FIRST_PARTY || 'Us', body: body.trim(), at: nowISO() }]
    });
    labPut(c.id, lab);
    repaint();
  });

  on('lab-seed',  () => { labSeed(c); repaint(); });
  on('lab-clear', () => { labClear(c.id); repaint(); });

  document.querySelectorAll('[data-lab-resolve]').forEach(b => b.addEventListener('click', () => {
    const lab = labFor(c.id);
    const t = lab.threads.find(x => x.id === b.getAttribute('data-lab-resolve'));
    if(!t) return;
    const u = currentUser();
    t.status = 'resolved'; t.resolvedAt = nowISO();
    t.resolvedBy = { name: (u && u.name) || 'You', org: window.FIRST_PARTY || 'This workspace' };
    labPut(c.id, lab); repaint();
  }));

  const decide = (id, decision) => {
    const lab = labFor(c.id);
    const u = currentUser();
    lab.decisions[id] = { decision, at: nowISO(), by: (u && u.name) || 'You' };
    const closed = labResolveLinked(lab, id, u);
    labPut(c.id, lab);
    repaint();
    if(window.toast) toast(closed
      ? `Lab only: change #${id} ${decision}, and ${closed} linked thread${closed === 1 ? '' : 's'} closed with it`
      : `Lab only: change #${id} ${decision}`);
  };
  document.querySelectorAll('[data-lab-accept]').forEach(b =>
    b.addEventListener('click', () => decide(b.getAttribute('data-lab-accept'), 'accepted')));
  document.querySelectorAll('[data-lab-reject]').forEach(b =>
    b.addEventListener('click', () => decide(b.getAttribute('data-lab-reject'), 'rejected')));
}

if (typeof window !== 'undefined') Object.assign(window, {
  LAB_KEY, LAB_INTERNAL, LAB_SHARED,
  labLoad, labFor, labPut, labClear, labSharePayload, labWithheld,
  labResolveLinked, labChanges, labTopics, labSeed,
  renderDocLab, wireDocLab
});
