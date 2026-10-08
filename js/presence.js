// HaTi — WHO IS IN THE ROOM: which colleagues have this contract open right now.
/* ============================================================
   THE GAP THIS FILLS

   Young picked "On this contract" by name from three: a row of initials in the
   contract's header, and nothing on the paper.

   Two people open the same agreement on a Tuesday afternoon and neither knows.
   The product already stops them colliding INSIDE a clause — the clause lock
   has recorded who is typing where since September, and refuses the second
   pencil by name — but a lock is about the forty seconds somebody is in a box.
   It says nothing about the hour two colleagues spend working the same
   contract in parallel, each assuming they are alone, and finding out from the
   audit trail afterwards.

   SO THE HEAD SAYS WHO ELSE IS HERE. A row of initials, the quietest thing a
   header can carry, beside the facts that are already there.

   AND NOTHING ON THE PAPER, which was the owner's own instruction and is also
   the right answer: cursors and coloured names in the wording are a document
   people stop trusting. The agreement's pixels are the agreement's
   (CLAUDE.md's third question), and a presence mark that moved while somebody
   was reading a liability cap would be the worst possible place to spend them.

   IT IS THE SAME FACT THE CLAUSE LOCK ALREADY KEEPS, ONE STEP WIDER, so it is
   written in the same place on the record and under the same discipline: a
   merge on the stored row, JSON only, never `version` and never `updated_at`.
   The lock route's own words — "presence is not an edit, and a record that read
   as edited every forty-five seconds would churn the register's own updated
   column and every watcher in the workspace".

   WHY IT IS ITS OWN ROUTE AND NOT THE LOCK'S. Two acts, not one: holding a
   clause is an EDITOR's act and the route refuses anybody else, while reading
   a contract is something a viewer does all day and a viewer in the room is
   exactly who you want to see. One door per act is the rule; two doors onto
   one act is the thing it forbids.

   READING NEVER WRITES. presenceHere answers out of what the last beat
   brought back. It never fetches, so a renderer cannot turn a repaint into a
   request — the lesson deskInit and reviewInit both record.

   AND IT NEVER TRAVELS. The counterparty must not learn how many of our
   people are reading their paper, which is a negotiating fact. buildSharePayload
   is an allow-list so that is true by construction, and the share route strips
   the field as well, because an allow-list holds only until somebody adds a
   field.
   ============================================================ */

/* ---- EVERY SHELL FUNCTION IS REACHED THROUGH `window` ----
   js/core.js declares its shell as `const api = …`, `const currentUser = …`. A
   `const` at the top of a script is a LEXICAL binding, not a property of the
   global object, so a bare call here resolves to core.js's own copy and can
   never be substituted in a harness. js/desk.js and js/review.js both carry
   this warning in almost these words; it is repeated rather than shared
   because the trap is invisible when you fall into it.

   `state` is the opposite case and is left BARE on purpose: it is core.js's
   `const state` and there is no window.state at all. */
const PRESENCE_BEAT_MS = 25000;
/* THREE MISSED BEATS. Two would make a slow network look like somebody leaving
   the room, and the cost of being wrong in that direction is a colleague
   believing they are alone. */
const PRESENCE_GONE_MS = 75000;
/* ---- AN ASK LIVES UNTIL THE ASKER LEAVES, NOT UNTIL THEY LOOK AWAY (gap E,
   4 Oct 2026, the process review's last gaps) ----
   "Ask for it" is kept alive by the asker's own beat (/here refreshes their
   asks), and the beat says nothing while the tab is hidden — so somebody who
   asked for a clause and switched tab to read their mail fell out of the queue
   after the lock's two minutes, although they had not left.

   SO A HIDDEN TAB KEEPS A SECOND, SLOWER BEAT THAT DOES ONE THING: it keeps
   this reader's own asks (`askOnly`). It does not say they are here — the
   server stamps no room for it — so the face row still drops a hidden reader
   after PRESENCE_GONE_MS, exactly as before. It runs only while this reader has
   an ask on the contract, and stops once the server says none is left.

   HOW SLOW: a browser that has throttled a hidden tab wakes it about once a
   minute, so a beat may arrive up to a minute late. The beat plus that minute
   has to stay inside the ask's own window (the lock's two minutes) with room to
   spare — f494 pins that relation, not the number.

   AND LEAVING TAKES THE ASKS AWAY (`leave`): the page closing (pagehide, the
   one event that fires on every way out, including the back-forward cache —
   beforeunload does not fire reliably on phones), or the reader leaving the
   contract inside the app. The holder's queue then stops naming somebody who
   is gone, instead of naming them for two more minutes.
   Leaving inside the app is measured after PRESENCE_LEAVE_MS, because setView
   stops the beat between the room and the negotiate page of the SAME contract
   — that is not leaving, and the beat starting again on it cancels the leave. */
const PRESENCE_ASK_BEAT_MS = 40000;
const PRESENCE_LEAVE_MS = 10000;
const _pzMe = () => (window.currentUser ? window.currentUser() : null) || null;
const _pzE = s => String(s == null ? '' : s)
  .replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/* WHAT THE LAST BEAT BROUGHT BACK, per contract. Per sitting and in memory
   only: this is the most perishable fact in the product and nothing about it
   belongs in the record the browser keeps. */
const _pzSeen = Object.create(null);
let _pzTimer = null, _pzCid = null, _pzBusy = false, _pzAfter = null, _pzWas = null;
/* The hidden tab's ask beat, and the leaves waiting out their grace, per
   contract. Per sitting and in memory, like everything else in this file. */
let _pzAskTimer = null, _pzAskBusy = false;
const _pzAskDone = Object.create(null);
const _pzLeave = Object.create(null);

/* Is this a surface that should say anything at all? Never on the
   counterparty's page — who is in our room is ours — and never without a
   server, because there is nobody else to be in the room. */
function presenceOn(){
  if (typeof window === 'undefined') return false;
  if (window.PORTAL_MODE && (typeof PORTAL_MODE === 'function' ? PORTAL_MODE() : PORTAL_MODE)) return false;
  if (!(typeof window.API_MODE === 'function' && window.API_MODE())) return false;
  return !!_pzMe();
}
const _pzLive = r => !!(r && r.at && (Date.now() - Date.parse(r.at)) < PRESENCE_GONE_MS);
/* ---- THE ONE READING ----
   The colleagues who are here and are not you, live only, newest arrival last
   so the row does not reshuffle itself between paints. Reads the cache; never
   fetches. */
function presenceHere(c){
  const cid = String((c && c.id) || c || '');
  if (!cid || !presenceOn()) return [];
  const me = _pzMe() || {};
  return (_pzSeen[cid] || [])
    .filter(r => _pzLive(r) && String(r.id || '') !== String(me.id || ''))
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
/* ---- SAYING SO ----
   One call, and the answer IS the reading. A latch raised before the promise
   exists, because an async body runs synchronously only to its first await —
   the rule this codebase records at "A LATCH MAY NOT BE ITS OWN PROMISE". */
async function presenceSay(cid){
  const id = String(cid || '');
  if (!id || !presenceOn() || _pzBusy) return null;
  /* NOT BEFORE THE RECORD IS ON THE SERVER (9 Oct 2026 review): a fresh upload
     opened its room before its first save landed, and the beat drew a 404 in
     the console every time. A record the server has sent or saved carries its
     version (`_v`); without one there is nobody to be in the room with yet,
     and the next beat asks again. */
  const rec = (typeof window.getContract === 'function') ? window.getContract(id) : null;
  if (rec && rec._v == null) return null;
  _pzBusy = true;
  try {
    /* WHERE THIS READER IS LOOKING rides the beat that was already going
       (idea 14). It is one clause id and it is worked out from the painted
       page, so a reader on a list, a dashboard or a signed contract sends
       nothing at all. */
    const spot = presenceSpotNow();
    const r = await window.api('contracts/' + encodeURIComponent(id) + '/here', 'POST',
      spot ? { spot } : {}, { quiet: true });
    const rows = (r && Array.isArray(r.here)) ? r.here : [];
    /* AND THE WALK, after the answer and before the paint: arriving at the
       leader's clause is what the reader is waiting for, and the row's lit face
       should already say who they are following when they get there. */
    try{ presenceWalk(rows); }catch(_){}
    const before = JSON.stringify(_pzSeen[id] || []);
    _pzSeen[id] = rows;
    /* REPAINT ONLY WHERE IT MOVED. A header that redrew itself every
       twenty-five seconds would steal the reader's hover and, on the
       negotiation page, their scroll. */
    if (JSON.stringify(rows) !== before && typeof _pzAfter === 'function') { try { _pzAfter(id); } catch (_){} }
    return rows;
  } catch (_){
    /* A BEAT THAT FAILS SAYS NOTHING. It is not an alert and it is not a
       toast: nobody asked for this and a network blip is not news. The row
       simply empties as the last answer ages out. */
    return null;
  } finally { _pzBusy = false; }
}
/* ---- THE BEAT ----
   Started when a contract is opened and stopped when it is left. It says
   nothing about being here while the window is hidden, which is both the
   courteous thing and the honest one: a tab behind three others is not
   somebody in the room. Only the slower ask beat runs then (gap E, above). */
function presenceStart(cid, after){
  const id = String(cid || '');
  if (!id || !presenceOn()) return false;
  /* COMING BACK INSIDE THE GRACE IS NOT LEAVING: the room and the negotiate
     page of one contract are two surfaces, and setView stops the beat between
     them. */
  if (_pzLeave[id]){ if (typeof clearTimeout === 'function') clearTimeout(_pzLeave[id]); delete _pzLeave[id]; }
  if (_pzCid === id && _pzTimer) { _pzAfter = after || _pzAfter; return true; }
  presenceStop();
  /* A DIFFERENT CONTRACT IS A DIFFERENT ROOM, so whoever was being followed in
     the last one is not being followed here — the names, the clauses and the
     colleagues are all different. Same contract, the follow stands. */
  if (String(_pzWas || '') !== id){ _pzFollow = null; _pzWent = null; }
  _pzCid = id;
  _pzWas = id;
  _pzAfter = after || null;
  presenceSay(id);
  if (typeof setInterval !== 'function') return true;
  _pzTimer = setInterval(() => {
    if (_pzCid !== id){ presenceStop(); return; }
    if (typeof document !== 'undefined' && document.hidden) return;
    presenceSay(id);
  }, PRESENCE_BEAT_MS);
  /* AND THE HIDDEN TAB'S OWN BEAT, which keeps this reader's asks and nothing
     else. Visible, it stands aside: the ordinary beat keeps them already. */
  _pzAskTimer = setInterval(() => {
    if (_pzCid !== id) return;
    if (typeof document === 'undefined' || !document.hidden) return;
    presenceKeepAsks(id);
  }, PRESENCE_ASK_BEAT_MS);
  return true;
}
function presenceStop(){
  if (_pzTimer && typeof clearInterval === 'function') clearInterval(_pzTimer);
  if (_pzAskTimer && typeof clearInterval === 'function') clearInterval(_pzAskTimer);
  const left = _pzCid;
  /* WHICH CONTRACT IT WAS, kept so that following survives a move between the
     room and the negotiate page — the same contract, two surfaces, and setView
     stops the beat between them. Following a DIFFERENT contract's colleague is
     meaningless, so that is where it is dropped: in presenceStart. */
  _pzWas = _pzCid || _pzWas;
  _pzTimer = null; _pzAskTimer = null; _pzCid = null; _pzAfter = null;
  /* LEAVING THE CONTRACT TAKES THIS READER'S ASKS WITH THEM — once the grace
     has passed without the beat starting on it again. */
  if (left) presenceLeaveSoon(left);
}
function presenceWatching(){ return _pzCid; }

/* ---- WHICH ASKS ARE MINE (gap E) ----
   The newest of this reader's asks on the contract as this browser holds it,
   as a signature, or '' when there are none. READS ONLY, and deliberately not
   asked whether the ask is still live by this browser's clock: on a hidden tab
   nothing refreshes the local copy, so a live-only reading would talk itself
   out of keeping the very ask it exists to keep. The SERVER judges what is
   alive; this only decides whether there is anything worth asking it about. */
function presenceMyAsks(cid){
  const id = String(cid || '');
  const me = _pzMe();
  const c = (id && me && typeof window.getContract === 'function') ? window.getContract(id) : null;
  const locks = (c && c.locks && typeof c.locks === 'object' && !Array.isArray(c.locks)) ? c.locks : null;
  if (!locks) return '';
  let sig = '';
  Object.keys(locks).forEach(k => {
    const asked = (locks[k] && Array.isArray(locks[k].asked)) ? locks[k].asked : [];
    asked.forEach(r => {
      if (!r || String(r.id || '') !== String(me.id || '')) return;
      const at = String(r.at || '') + '|' + k;
      if (at > sig) sig = at;
    });
  });
  return sig;
}
/* ---- THE HIDDEN TAB'S BEAT ----
   One quiet call that keeps this reader's own asks and says nothing about
   being here. When the server answers that none is left (handed to somebody
   else, released, lapsed), it stops asking until this reader asks again — a
   new ask is a new signature. A latch raised before the promise exists. */
async function presenceKeepAsks(cid){
  const id = String(cid || '');
  if (!id || !presenceOn() || _pzAskBusy) return null;
  const sig = presenceMyAsks(id);
  if (!sig || _pzAskDone[id] === sig) return null;
  _pzAskBusy = true;
  try {
    const r = await window.api('contracts/' + encodeURIComponent(id) + '/here', 'POST',
      { askOnly: true }, { quiet: true });
    const n = (r && typeof r.asks === 'number') ? r.asks : null;
    if (n === 0) _pzAskDone[id] = sig;
    return n;
  } catch (_){
    /* A beat that fails says nothing, like the ordinary one. */
    return null;
  } finally { _pzAskBusy = false; }
}
/* ---- LEAVING ----
   Sent so that it survives the page going away: a keepalive request where the
   browser has one, a beacon where it does not. Fire and forget — there is
   nobody left to read an answer. Sent only when this reader has an ask here,
   so leaving a contract you never asked about costs nothing. */
function presenceLeave(cid){
  const id = String(cid || '');
  if (!id || !presenceOn()) return false;
  const sig = presenceMyAsks(id);
  if (!sig || _pzAskDone[id] === sig) return false;
  _pzAskDone[id] = sig;
  const path = 'contracts/' + encodeURIComponent(id) + '/here';
  const body = { leave: true };
  const keeps = typeof Request === 'function' && 'keepalive' in Request.prototype;
  if (!keeps && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && typeof Blob === 'function'){
    try { if (navigator.sendBeacon('api/' + path, new Blob([JSON.stringify(body)], { type: 'application/json' }))) return true; } catch (_){}
  }
  try {
    const p = window.api(path, 'POST', body, { quiet: true, keepalive: true });
    if (p && typeof p.catch === 'function') p.catch(() => {});
    return true;
  } catch (_){ return false; }
}
function presenceLeaveSoon(cid){
  const id = String(cid || '');
  if (!id || !presenceMyAsks(id) || typeof setTimeout !== 'function') return false;
  if (_pzLeave[id] && typeof clearTimeout === 'function') clearTimeout(_pzLeave[id]);
  _pzLeave[id] = setTimeout(() => {
    delete _pzLeave[id];
    if (_pzCid !== id) presenceLeave(id);
  }, PRESENCE_LEAVE_MS);
  return true;
}

/* ============================================================
   FOLLOW ME — walking through it together (idea 14, 4 Oct 2026)
   ============================================================
   Young picked "Follow me": one leader, the others' pages follow, one press to
   stop.

   THE GAP. Two people on a call, both with the contract open, and the whole
   first minute of every clause goes on "which one are you on — no, the one
   above that". A screen share solves it by taking one person's whole machine
   and giving everybody else a video of it; what people actually want is to be
   looking at the same clause on their own screen, with their own text size,
   their own notes and their own hands.

   SO IT IS A DESTINATION AND NOT A MIRROR. What travels is one clause id —
   where the leader is looking — and the follower's own page goes there,
   through the SAME door a press on a card already uses (rlJumpToClause). No
   cursor, no selection, no scroll position, no keystrokes: the follower keeps
   every power they had, and if they scroll away they simply arrive again when
   the leader moves on.

   THERE IS NO INVITATION AND NOTHING TO ACCEPT. A leader does not start a
   session; a follower picks a name from the row that is already there and
   presses it. That is the whole of the feature, and it is why there is nothing
   to clean up when a call ends: following is per sitting, and a reload is out.

   AND THE WAY OUT IS THE WAY IN — the same face, pressed again. NO BAND was
   added for it, which is the owner's standing rule: a strip saying "Following
   Amina · Stop" would say what the lit face already says, and the cheapest
   channel that does the job is inline state. If the owner wants a strip they
   will ask for one. */
/* WHERE THIS READER IS LOOKING. The clause at the CENTRE of the paper, which
   is what "looking at" means on a page you scroll — not the clause whose
   pencil was last pressed, which is where the reader WAS. Measured off the
   painted page (elementFromPoint), because a rect is not a painted pixel.
   READS ONLY, and answers null anywhere there is no paper. */
function presenceSpotNow(){
  if (typeof document === 'undefined') return null;
  const doc = document.getElementById('rl-doc')
    || document.querySelector('#view-redline #rl-doc, .redline-page #rl-doc');
  const box = doc || document.getElementById('doc-scroll');
  if (!box || !box.getBoundingClientRect) return null;
  const r = box.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const x = Math.round(r.left + r.width / 2);
  const y = Math.round(Math.max(r.top, 0) + Math.min(r.height, (window.innerHeight || r.height)) / 2);
  const el = document.elementFromPoint(x, y);
  const cl = el && el.closest ? el.closest('[data-clause]') : null;
  return cl ? (cl.getAttribute('data-clause') || null) : null;
}
/* Per sitting, in memory, and one at a time: following two people would be two
   pages fighting over one scroll. */
let _pzFollow = null, _pzWent = null;
function presenceFollowing(){ return _pzFollow; }
function presenceFollow(id){
  const to = String(id || '');
  _pzFollow = (to && _pzFollow !== to) ? to : null;
  _pzWent = null;
  if (_pzCid) presencePaint(_pzCid);
  if (_pzFollow && _pzCid) presenceSay(_pzCid);
  return _pzFollow;
}
/* ---- AND THE WALK ----
   Asked after every beat, and it moves the page only when the leader's spot
   has CHANGED since the last time it was followed. Without that the follower's
   page would re-centre itself every twenty-five seconds on a clause they are
   already reading, which is the page taking the reader's place rather than
   keeping up with somebody else.

   IT GOES THROUGH THE DOOR A PRESS ALREADY USES. rlJumpToClause lights the
   clause and scrolls to it; nothing here knows how to move a page of its own,
   so the follower's arrival looks exactly like their own press. */
function presenceWalk(rows){
  if (!_pzFollow) return false;
  const lead = (rows || []).find(r => r && String(r.id) === String(_pzFollow));
  /* THE LEADER LEFT THE ROOM, so there is nobody to follow. Stood down rather
     than left pointing at a name that is gone. */
  if (!lead){ _pzFollow = null; _pzWent = null; return false; }
  const spot = lead.spot ? String(lead.spot) : '';
  if (!spot || spot === _pzWent) return false;
  _pzWent = spot;
  if (typeof window.rlJumpToClause !== 'function') return false;
  try{ return !!window.rlJumpToClause(spot); }catch(_){ return false; }
}

/* ---- THE ROW ----
   Initials, the desk's own shortener so one face never reads two ways in one
   header, and the whole name on the hover. A count takes over past
   PRESENCE_FACES because six initials in a header is a crowd rather than a
   fact — the same ruling the signing route's own face row keeps.

   IT DRAWS NOTHING WHEN NOBODY IS HERE. An empty slot with a caption would be
   a band about an absence, which is the thing the owner ruled out by name. */
const PRESENCE_FACES = 4;
function presenceInitials(name){
  if (window.deskInitials) { try { return deskInitials(name); } catch (_){} }
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
function presenceRowHtml(c){
  const here = presenceHere(c);
  if (!here.length) return '';
  const shown = here.slice(0, PRESENCE_FACES);
  const extra = here.length - shown.length;
  const all = here.map(r => String(r.name || '')).filter(Boolean).join(', ');
  const say = window.i18tn ? i18tn('pz_here', here.length, { n: here.length }) : (here.length + ' here');
  /* ---- EACH FACE IS THE WAY IN AND THE WAY OUT (idea 14) ----
     A button, because it does something; lit while it is the one being
     followed; and the same press stops. NO BAND was added for the state —
     the owner's standing rule, and the lit face plus its own sentence says
     everything a strip would. The title is the sentence: a face alone cannot
     say "press this to walk through the contract with them". */
  /* ---- AND THE FACE IS A BUTTON ONLY WHERE THE WALK CAN WORK ----
     The walk goes through rlJumpToClause, which needs the negotiate page's
     paper. On the Document tab there is no such page, so a face drawn as a
     button there would be a control that quietly does nothing — the dead-button
     fault this codebase names in four other places. Presence (idea 5) is drawn
     everywhere; Follow me (idea 14) is offered where it works, and the row is
     the same width either way. */
  const canWalk = typeof document !== 'undefined'
    && !!(document.getElementById('view-redline') || document.querySelector('.redline-page'))
    && typeof window.rlJumpToClause === 'function';
  const faceHtml = r => {
    if (!canWalk) return `<span class="pz-face" title="${_pzE(r.name || '')}">${_pzE(presenceInitials(r.name))}</span>`;
    const on = String(presenceFollowing() || '') === String(r.id);
    const t = on ? i18t('pz_following', { who: r.name || '' }) : i18t('pz_follow', { who: r.name || '' });
    return `<button type="button" class="pz-face${on ? ' is-following' : ''}" data-pz-follow="${_pzE(r.id)}"
      aria-pressed="${on ? 'true' : 'false'}" title="${_pzE(t)}">${_pzE(presenceInitials(r.name))}</button>`;
  };
  return `<span class="pz-row" data-pz-here="${here.length}" title="${_pzE(say + (all ? ' — ' + all : ''))}" aria-label="${_pzE(say)}">${
    shown.map(faceHtml).join('')}${
    extra > 0 ? `<span class="pz-more">+${extra}</span>` : ''}</span>`;
}
/* ---- THE SLOT ----
   WIRE WHERE YOU PAINT. The contract room builds its head once per render, so
   anything that changes on its own needs a slot it can repaint into — the
   rulebook's own rule, learnt on the status chip and the fact row. This fills
   `#ws-presence` wherever it exists and does nothing where it does not, so one
   function serves the room, the negotiate page and any head added later. */
function presencePaint(cid){
  if (typeof document === 'undefined') return false;
  const c = (window.getContract && cid) ? getContract(cid) : null;
  const html = c ? presenceRowHtml(c) : '';
  let any = false;
  document.querySelectorAll('[data-pz-slot]').forEach(el => { el.innerHTML = html; any = true; });
  return any;
}

/* ---- ONE DELEGATED PRESS, ARMED AT MODULE LOAD ----
   The row is painted into a slot on a head that is rebuilt every render, so a
   listener bound to the faces would be bound to faces that no longer exist by
   the second paint. Delegated on the document, which is this codebase's own
   rule for exactly that, and it resolves the LIVE element at press time. */
if (typeof document !== 'undefined') document.addEventListener('click', ev => {
  const t = ev.target;
  if (!t || !t.closest) return;
  const f = t.closest('[data-pz-follow]');
  if (!f) return;
  ev.preventDefault(); ev.stopPropagation();
  presenceFollow(f.getAttribute('data-pz-follow'));
});

/* ---- AND THE PAGE GOING AWAY (gap E) ----
   Armed once at module load. Every leave still waiting out its grace goes now,
   and so does the contract being watched — the page will not be here to send
   them later. The beat itself is left alone: a page restored from the
   back-forward cache carries on beating, and the reader asks again if they
   still want the clause. */
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('pagehide', () => {
  Object.keys(_pzLeave).forEach(k => {
    if (typeof clearTimeout === 'function') clearTimeout(_pzLeave[k]);
    delete _pzLeave[k];
    presenceLeave(k);
  });
  if (_pzCid) presenceLeave(_pzCid);
});

Object.assign(window, {
  PRESENCE_BEAT_MS, PRESENCE_GONE_MS, PRESENCE_FACES, PRESENCE_ASK_BEAT_MS, PRESENCE_LEAVE_MS,
  presenceOn, presenceHere, presenceSay, presenceStart, presenceStop, presenceWatching,
  presenceMyAsks, presenceKeepAsks, presenceLeave,
  presenceInitials, presenceRowHtml, presencePaint,
  presenceSpotNow, presenceFollow, presenceFollowing, presenceWalk,
});
