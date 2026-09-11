/* ==========================================================================
   ONE CLAUSE, ONE PAIR OF HANDS (Young asked 10 Sep 2026)
   ==========================================================================
   *"to avoid collisions as far as multiple people editing the same clause,
   could we make it so that when user 1 is editing clause 5, it is locked to
   others until user 1 is out. When user 2 tries to click on the pencil symbol,
   they see the initials of User 1 and a short small line saying 'Locked by
   R. C.' or something to that effect?"*

   TWO COLLEAGUES ON OUR OWN SIDE BOTH HAVE THE RIGHT TO REDLINE — the desk
   already decides that — and until now nothing stopped them opening the same
   clause at the same minute. The second one to press Save filed a revision over
   wording the first was still writing, and neither was told.

   IT IS AN ADVISORY AND IT IS SAID SO PLAINLY, because that is what makes it
   safe. Nobody is denied a right they had; what is prevented is two people
   walking into each other by accident. That is why it EXPIRES, why the refusal
   names who holds it and when it lapses, and why a holder can always let go.

   ---- IT ADDS NO ROUTE AND NO TABLE ----
   `c.locks` is an ordinary field on the contract — absent on every record
   already on file, which is the whole migration story — so it rides the save
   every edit already makes and the 12-second live beat already refreshes it.
   A route of its own would be a second way for two browsers to disagree.

   ---- AND IT NEVER TRAVELS ----
   Who on our side happens to be typing is the most internal fact there is.
   buildSharePayload's allow-list does not carry `locks`, and f289 asserts that
   rather than assuming it.
   ========================================================================== */

/* TWO MINUTES. Long enough that nobody loses a clause they are still writing —
   every paint, pull and press refreshes it — and short enough that a browser
   that vanished (a closed laptop, a lost network) does not hold a clause for
   the rest of the afternoon. A lock nobody can clear is worse than no lock. */
const CLAUSE_LOCK_MS = 120000;
/* The window inside which a holder's own browser is still considered present.
   Deliberately the same number: two readings of "is this lock alive" is how the
   holder and everybody else come to disagree about it. */
const clauseLockLive = l => !!(l && l.at && (Date.now() - Date.parse(l.at)) < CLAUSE_LOCK_MS);

/* WHO IS ASKING. The id survives a rename and the name survives the account
   being deleted — the contract-owner reading, one field along. */
function clauseLockMe(){
  const u = (typeof window !== 'undefined' && window.currentUser) ? window.currentUser() : null;
  return u ? { id: u.id, name: u.name || '' } : null;
}
/* THE INITIALS Young asked for, off the same name the line prints, so the two
   cannot name different people. Two letters at most: a monogram is a glance,
   and a third letter turns it into a word. */
function clauseLockInitials(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] || '') : '';
  return (first + last).toUpperCase();
}
/* "R. C." — the shape Young wrote, which is the initials spaced and stopped. */
const clauseLockMonogram = name => clauseLockInitials(name).split('').map(ch => ch + '.').join(' ');

/* WHO HOLDS THIS CLAUSE, or null. Reads the record and NEVER writes: a reading
   that started a lock by being asked would take a clause off a colleague every
   time a card was drawn. */
function clauseLockOf(c, clauseId){
  /* NEVER ON THEIR SEAT. Who on our side is typing is the most internal fact
     there is, and the wall that matters is buildSharePayload's allow-list,
     which does not carry `locks` — so their page holds none by construction.
     This is the second answer to one question, said here so that a payload
     hand-built by somebody else could still not put a colleague's initials in
     front of the counterparty. */
  if (typeof window !== 'undefined' && window.PORTAL_MODE) return null;
  const id = String(clauseId || '');
  const l = (c && c.locks && id) ? c.locks[id] : null;
  return clauseLockLive(l) ? l : null;
}
/* HELD BY SOMEBODY ELSE — the only question the pencil, the card and the guard
   actually ask. Your own lock is not a lock to you. */
function clauseLockHeldByOther(c, clauseId){
  const l = clauseLockOf(c, clauseId);
  if (!l) return null;
  const me = clauseLockMe();
  /* NOBODY SIGNED IN IS REFUSED NOTHING AND SHOWN NOTHING, which is the same
     answer clauseLockTake gives — two readings that disagreed about whether the
     machinery is on would be a stage that draws a lock it will then let you
     walk straight through. A preview, a test world and the sign-in screen all
     behave exactly as they did before this existed. */
  if (!me) return null;
  if (l.by && String(l.by.id || '') === String(me.id || '')) return null;
  return l;
}
/* NOBODY SIGNED IN HOLDS NOTHING, and is refused nothing: a stage with no user
   (a preview, a test world, the counterparty's page) behaves exactly as it did
   before this existed. */
function clauseLockTake(c, clauseId){
  const me = clauseLockMe();
  const id = String(clauseId || '');
  if (!c || !id || !me) return true;
  const other = clauseLockHeldByOther(c, id);
  if (other) return false;
  if (!c.locks) c.locks = {};
  c.locks[id] = { by: me, at: new Date().toISOString() };
  return true;
}
/* Refreshing is taking it again, so there is ONE act rather than two that could
   come to disagree about what a lock is. */
const clauseLockKeep = (c, clauseId) => clauseLockTake(c, clauseId);
/* LETTING GO IS ONLY EVER YOUR OWN. An editor closing must not clear a lock a
   colleague took in the meantime — which is exactly what happens when two
   browsers race, and is the one way this feature could take a clause off
   somebody who is holding it correctly. */
function clauseLockRelease(c, clauseId){
  const id = String(clauseId || '');
  if (!c || !c.locks || !id || !c.locks[id]) return false;
  const me = clauseLockMe();
  const by = c.locks[id].by || {};
  if (me && String(by.id || '') !== String(me.id || '')) return false;
  delete c.locks[id];
  if (!Object.keys(c.locks).length) delete c.locks;
  return true;
}
/* Sweeping the lapsed ones is housekeeping, not a decision: every reading above
   already ignores them, so this only keeps the record from growing. */
function clauseLockSweep(c){
  if (!c || !c.locks) return false;
  let moved = false;
  Object.keys(c.locks).forEach(k => { if (!clauseLockLive(c.locks[k])){ delete c.locks[k]; moved = true; } });
  if (!Object.keys(c.locks).length) delete c.locks;
  return moved;
}
/* ---- AND IT HAS TO REACH THE OTHER BROWSER, OR IT IS A NOTE TO YOURSELF ----
   A lock held only in this tab tells a colleague nothing. It reaches them by
   its OWN tiny write — POST /api/contracts/:id/lock — and never by the
   whole-contract save, which is where it first rode and where it did three
   things wrong at once:

     · THE SAVE CARRIES AN OPTIMISTIC VERSION, so a refresh landing after a
       colleague's save came back 409 and saveContract put a BLOCKING dialog in
       front of the reader — "keep yours and overwrite theirs, or discard
       yours?" — over a heartbeat that changed nothing but a timestamp, every
       forty-five seconds, while they were typing.
     · THE MAP TRAVELLED WHOLE, so a browser whose record predated a colleague
       taking a lock wiped that colleague's lock on its next ordinary save.
     · AND IT MOVED THE VERSION, so every other browser watching the contract
       fetched the entire record and toasted "new activity" about a clause
       somebody had merely opened.

   The route MERGES one clause on the stored record, takes no baseVersion, and
   moves neither `version` nor `updated_at` — presence is not an edit. The
   reader learns of it from the twelve-second probe the bench already runs,
   which carries the live map (see rlStartLivePoll).

   THE LOCAL FALLBACK IS THE ORDINARY SAVE, because with no server there is no
   second browser to tell and nothing to conflict with.

   A SEALED RECORD TAKES NO COURTESY WRITE — aiNoteRead's own lesson. The editor
   refuses an executed contract outright, so this is unreachable in practice and
   is one line rather than a fault waiting for the day another door reaches it.

   WHAT IT STILL DOES NOT DO, said out loud: it is not PUSHED. A colleague
   learns of a lock on their next probe, so two people who open the same clause
   inside the same few seconds can still both get in. That is why the SERVER
   refuses the second one's filing rather than the browser being trusted, and
   why this is an advisory rather than a promise. */
function clauseLockSave(c, opts){
  if (!c) return false;
  const W = (typeof window !== 'undefined') ? window : null;
  if (!W) return false;
  const sealed = (typeof W.negoExecuted === 'function') ? W.negoExecuted(c) : (c.status === 'Signed');
  if (sealed) return false;
  const o = opts || {};
  if (o.clauseId && W.API_MODE && W.API_MODE() && typeof W.api === 'function'){
    /* Fire and forget. The reader is typing; a lock is a courtesy to somebody
       else and may never make them wait, and a refusal is already drawn by the
       door that asked (rlOpenClauseEditor) rather than by a background write. */
    try{
      W.api('contracts/' + c.id + '/lock', 'POST', { clauseId: String(o.clauseId), release: !!o.release })
        .then(r => { if (r && r.locks) clauseLockMerge(c, r.locks); })
        .catch(() => {});
    }catch(_){ }
    return true;
  }
  if (typeof W.persist === 'function'){ W.persist(c); return true; }
  return false;
}
/* THE SERVER'S MAP IS THE ONE THAT COUNTS, so an answer replaces ours whole
   rather than being folded into it: a merge that kept a local entry the server
   did not return would be this browser insisting on a lock the server has
   already given to somebody else. */
function clauseLockMerge(c, locks){
  if (!c) return false;
  const live = {};
  Object.keys(locks || {}).forEach(k => { if (clauseLockLive(locks[k])) live[k] = locks[k]; });
  const before = JSON.stringify(c.locks || {});
  if (Object.keys(live).length) c.locks = live; else delete c.locks;
  return JSON.stringify(c.locks || {}) !== before;
}
/* THE ONE SENTENCE, in the reader's own language, naming who holds it. Young
   asked for the monogram; the whole name is on the control's own title, because
   a monogram is a glance and two colleagues can share one. */
const _clT = (k, o) => (typeof window !== 'undefined' && window.i18t) ? window.i18t(k, o) : k;
function clauseLockLine(l){
  if (!l) return '';
  const name = String((l.by && l.by.name) || '').trim();
  const mono = clauseLockMonogram(name);
  return _clT('cl_locked_by', { who: mono || name || _clT('cl_a_colleague') });
}
function clauseLockTitle(l){
  if (!l) return '';
  const name = String((l.by && l.by.name) || '').trim() || _clT('cl_a_colleague');
  return _clT('cl_locked_title', { who: name });
}

/* ---- THE SIGN, ASKED ONCE AND DRESSED FOUR WAYS (Young asked 10 Sep 2026) ----
   *"When user 2 tries to click on the pencil symbol, they see the initials of
   User 1."* — and then, of the rest of them: put the initials on those too.

   FOUR CONTROLS OPEN THE CLAUSE EDITOR and only the pencil carried the
   monogram; the other three refused in words AFTER the press, which is the
   dead press this product's own rule exists to prevent. They ask this, once,
   at DRAW time, so the pencil, the card's Edit, the sparkle on a tracked
   change and the clause panel's Copilot button cannot come to disagree about
   who is holding a clause — the drawing may differ between them and does, the
   READING never may.

   IT RETURNS THE THREE PIECES AND DRESSES NOTHING. The pencil has a slot of
   its own and becomes the sign; the other three sit in fixed columns and in
   one-glyph boxes, so they stay exactly the size they were, go dead, and swap
   their leading mark for the monogram with the whole sentence on the hover.
   A monogram forced into the card's verb column would move a layout nobody
   asked to move. */
function clauseLockSign(c, clauseId){
  const l = clauseLockHeldByOther(c, clauseId);
  if (!l) return null;
  const name = String((l.by && l.by.name) || '').trim();
  return { mono: clauseLockInitials(name), say: clauseLockLine(l), title: clauseLockTitle(l), name };
}

if (typeof window !== 'undefined') Object.assign(window, {
  CLAUSE_LOCK_MS, clauseLockLive, clauseLockMe, clauseLockInitials, clauseLockMonogram,
  clauseLockOf, clauseLockHeldByOther, clauseLockTake, clauseLockKeep,
  clauseLockRelease, clauseLockSweep, clauseLockLine, clauseLockTitle, clauseLockSave,
  clauseLockMerge, clauseLockSign });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  CLAUSE_LOCK_MS, clauseLockLive, clauseLockInitials, clauseLockMonogram,
  clauseLockOf, clauseLockHeldByOther, clauseLockTake, clauseLockKeep,
  clauseLockRelease, clauseLockSweep, clauseLockSave, clauseLockMerge, clauseLockSign };
