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
   A lock held only in this tab tells a colleague nothing, so taking one and
   letting one go each ride the ordinary save every other act on this page
   already makes. There is no route of its own: a second way for two browsers
   to disagree about a contract is the last thing this needs.

   A SEALED RECORD TAKES NO COURTESY WRITE — aiNoteRead's own lesson, one field
   along. Unreachable in practice (the editor refuses an executed contract
   outright, because the wording is frozen), and one line to close rather than
   a fault waiting for the day some other door reaches this.

   WHAT IT DOES NOT DO, said out loud: it is not pushed. A colleague sees the
   lock when their browser next reads the contract — opening it, or the beat
   that refreshes an open one — so two people who open the same clause in the
   same few seconds can still both get in. That is why the SERVER refuses the
   second one's filing, and why this is an advisory rather than a promise. */
function clauseLockSave(c){
  if (!c) return false;
  const sealed = (typeof window !== 'undefined' && typeof window.negoExecuted === 'function')
    ? window.negoExecuted(c) : (c.status === 'Signed');
  if (sealed) return false;
  if (typeof window !== 'undefined' && typeof window.persist === 'function'){ window.persist(c); return true; }
  return false;
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

if (typeof window !== 'undefined') Object.assign(window, {
  CLAUSE_LOCK_MS, clauseLockLive, clauseLockMe, clauseLockInitials, clauseLockMonogram,
  clauseLockOf, clauseLockHeldByOther, clauseLockTake, clauseLockKeep,
  clauseLockRelease, clauseLockSweep, clauseLockLine, clauseLockTitle, clauseLockSave });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  CLAUSE_LOCK_MS, clauseLockLive, clauseLockInitials, clauseLockMonogram,
  clauseLockOf, clauseLockHeldByOther, clauseLockTake, clauseLockKeep,
  clauseLockRelease, clauseLockSweep, clauseLockSave };
