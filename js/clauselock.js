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
  /* ---- AND A REFRESH OF YOUR OWN LOCK KEEPS THE QUEUE ON IT (4 Oct 2026) ----
     Refreshing IS taking it again, which is the rule one line up and the whole
     reason there is one act here rather than two. Measured while building the
     baton: a bare new lock wiped the asks, and a holder's browser refreshes
     every few seconds while they type, so a colleague's ask vanished the
     moment the holder touched a key. The server keeps the same rule at the same
     place; this is the browser's copy of it, not the wall. */
  const had = c.locks[id];
  const keep = (clauseLockLive(had) && had.by && String(had.by.id || '') === String(me.id || '')
    && Array.isArray(had.asked)) ? had.asked.filter(r => r && r.id && clauseLockLive(r)) : [];
  c.locks[id] = keep.length ? { by: me, at: new Date().toISOString(), asked: keep }
    : { by: me, at: new Date().toISOString() };
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
/* ============================================================
   TAKE IT IN TURNS — the lock becomes a baton (idea 12, 4 Oct 2026)
   ============================================================
   Young picked "Take it in turns" by name from three. The lock above is an
   ADVISORY and that is what made it safe, but it left the second person with
   one thing to do: wait. Two minutes is not long; not knowing how long is.
   A colleague who reaches for a clause and is told somebody else has it has
   no way to say "I need this" and no way to know when it comes free, so they
   either sit refreshing or go round the wall by editing somewhere else.

   SO A REFUSAL CARRIES ITS WAY FORWARD, which is the rulebook's own rule said
   on a new door: the second person can ASK for the clause, the holder is told
   somebody is waiting, and handing it over is one press.

   NOTHING ABOUT THE WALL CHANGES. An ask takes no lock, moves no wording and
   refuses nothing — it is a request written on the lock, and the holder keeps
   every power they had including the power to ignore it. The lock still lapses
   on its own, so a holder who shut their laptop still frees the clause in two
   minutes whether they were asked or not.

   AND THE HAND-OVER IS DIRECT, which is the whole of why this is a baton
   rather than a Please-Finish button: releasing the lock and letting the asker
   race for it would hand the clause to whoever's browser polled first, which
   on a busy afternoon is not the person who asked. The holder names them, and
   the server moves the lock to that name in one write.

   WHO MAY DO WHAT, and the server keeps both: only the HOLDER may hand a
   clause over, and only to somebody who ASKED — a hand-over to a name that
   never asked would be a way of locking a colleague out of a clause from
   across the office. */
/* The live asks on a lock, in the order they were made, newest last. The same
   window the lock itself uses: two readings of "is this still live" is how a
   holder and an asker come to disagree about whether anybody is waiting. */
function clauseLockAsks(l){
  const rows = (l && Array.isArray(l.asked)) ? l.asked : [];
  return rows.filter(r => r && r.id && clauseLockLive(r)).sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
/* Have I already asked? One ask per person: a second press is not a louder
   ask, and a list that grew every time somebody pressed would turn "2 waiting"
   into a lie. */
function clauseLockAskedByMe(l, u){
  const me = u || clauseLockMe();
  if (!me) return null;
  return clauseLockAsks(l).find(r => String(r.id || '') === String(me.id || '')) || null;
}
/* ---- ASKING ----
   LOCALLY FIRST AND THEN THROUGH THE ROUTE, the shape clauseLockTake already
   has: the reader's own screen answers at once, and the server's copy is what
   the holder will see. It refuses on a clause that is not held by somebody
   else, because there is nothing there to ask for — the door that offers it
   has already asked the same question, and this is the wall behind the sign. */
function clauseLockAsk(c, clauseId){
  const me = clauseLockMe();
  const id = String(clauseId || '');
  if (!c || !id || !me) return false;
  const l = clauseLockHeldByOther(c, id);
  if (!l) return false;
  if (!Array.isArray(l.asked)) l.asked = [];
  if (!clauseLockAskedByMe(l, me)) l.asked.push({ id: me.id, name: me.name || '', at: new Date().toISOString() });
  clauseLockSave(c, { clauseId: id, ask: true });
  return true;
}
/* What MY lock is holding up. The mirror of clauseLockHeldByOther, and a
   separate reading because that one answers null for your own lock on purpose
   — your own lock is not a lock to you, but the queue on it is yours to see. */
function clauseLockMineWaiting(c, clauseId){
  const id = String(clauseId || '');
  const l = (c && c.locks && id) ? c.locks[id] : null;
  if (!clauseLockLive(l)) return [];
  const me = clauseLockMe();
  if (!me || !l.by || String(l.by.id || '') !== String(me.id || '')) return [];
  return clauseLockAsks(l);
}
/* ---- AND HANDING IT OVER ----
   ONLY YOUR OWN, and only to somebody who asked. Both are the server's to
   enforce and both are asked here as well, so the button is never drawn over
   an act the route will refuse. */
function clauseLockHandOver(c, clauseId, toId){
  const id = String(clauseId || '');
  const waiting = clauseLockMineWaiting(c, id);
  const to = waiting.find(r => String(r.id || '') === String(toId || '')) || waiting[0];
  if (!to) return null;
  c.locks[id] = { by: { id: to.id, name: to.name || '' }, at: new Date().toISOString() };
  clauseLockSave(c, { clauseId: id, handTo: to.id });
  return to;
}
/* ---- HANDING OVER, ASKED ONCE, FROM EITHER DOOR (4 Oct 2026, the process
   review) ----
   The act had one door — the editor rail's line — and it always went to the
   FIRST asker. It is offered now on the sign the holder sees on the paper too,
   and both doors press THIS, so the confirm, the toast and the repaint cannot
   come to differ between them. Where more than one colleague asked, the
   confirm carries a small picker (first asker chosen, so a plain yes is
   exactly the old act). The picker is put into the confirm after it opens;
   confirmDialog's own options are unchanged. Nothing is filed and the draft
   is kept, which is what the dialog says. */
function clauseLockHandOverAsk(c, clauseId, after){
  const W = (typeof window !== 'undefined') ? window : null;
  const id = String(clauseId || '');
  const rows = (c && id) ? clauseLockMineWaiting(c, id) : [];
  if (!W || !rows.length) return Promise.resolve(null);
  const go = toId => {
    const got = clauseLockHandOver(c, id, toId);
    if (!got) return null;
    if (typeof W.persist === 'function') try{ W.persist(c); }catch(_){ }
    if (W.toast) W.toast(_clT('cl_handed', { who: String(got.name || '') }), 'ok');
    if (typeof after === 'function') try{ after(got); }catch(_){ }
    return got;
  };
  if (typeof W.confirmDialog !== 'function') return Promise.resolve(go(rows[0].id));
  const many = rows.length > 1;
  let pick = rows[0].id;
  const asked = W.confirmDialog({ title: _clT('cl_hand_over'),
    message: many ? _clT('cl_hand_title_many') : _clT('cl_hand_title', { who: String(rows[0].name || '') }),
    confirmLabel: _clT('cl_hand_over') });
  if (many && typeof document !== 'undefined') try{
    const ok = document.querySelector('#confirm-overlay #cf-ok');
    const foot = ok && ok.parentElement;
    if (foot && foot.parentElement){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding-left:46px;margin:0 0 var(--s-4)';
      const lab = document.createElement('label');
      lab.setAttribute('for', 'cl-hand-to');
      lab.style.cssText = W.HATI_LBL || '';
      lab.textContent = _clT('cl_hand_to');
      const sel = document.createElement('select');
      sel.id = 'cl-hand-to';
      sel.style.cssText = W.HATI_FLD || '';
      rows.forEach(r => {
        const o = document.createElement('option');
        o.value = String(r.id); o.textContent = String(r.name || _clT('cl_a_colleague'));
        sel.appendChild(o);
      });
      sel.addEventListener('change', () => { pick = sel.value; });
      wrap.appendChild(lab); wrap.appendChild(sel);
      foot.parentElement.insertBefore(wrap, foot);
    }
  }catch(_){ }
  return asked.then(yes => (yes ? go(pick) : null));
}
/* THE TWO SENTENCES, in the reader's own language and in one place, so the
   sign, the editor's foot and the toast cannot each invent their own account
   of the same queue. */
function clauseLockWaitingLine(list){
  const n = (list || []).length;
  if (!n) return '';
  const T = (typeof window !== 'undefined' && window.i18tn) ? window.i18tn : null;
  const who = clauseLockMonogram(String((list[0] && list[0].name) || '')) || _clT('cl_a_colleague');
  return T ? T('cl_waiting', n, { n, who }) : (n + ' waiting');
}
function clauseLockAskedLine(l){
  const mine = clauseLockAskedByMe(l);
  return mine ? _clT('cl_asked_said') : '';
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
      /* THE BATON'S TWO VERBS RIDE THE SAME WRITE (4 Oct 2026). One door onto
         the lock map, as the note above insists: a second route would be a
         second way for two browsers to disagree about who holds a clause. */
      W.api('contracts/' + c.id + '/lock', 'POST', { clauseId: String(o.clauseId),
        release: !!o.release, ask: !!o.ask, handTo: o.handTo || null })
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
/* ---- WHICH ARRIVALS THIS SITTING HAS ALREADY ANNOUNCED ----
   Per sitting and in memory: a baton arriving is news exactly once, and the
   live poll asks every twelve seconds. Nothing here reaches the record — the
   rulebook's own rule that per-sitting marks never do. */
const _clSaid = Object.create(null);
function clauseLockMerge(c, locks){
  if (!c) return false;
  const live = {};
  Object.keys(locks || {}).forEach(k => { if (clauseLockLive(locks[k])) live[k] = locks[k]; });
  const before = JSON.stringify(c.locks || {});
  /* ---- THE BATON ARRIVING IS NEWS, AND THIS IS WHERE IT LANDS (4 Oct 2026) ----
     The ONE funnel the server's map comes through, which is why the notice is
     here and not at a press: a hand-over happens in somebody else's browser,
     so the only thing that can tell this reader is the answer that carries it.
     Asked as a DIFFERENCE — the clause was held by a colleague this reader had
     ASKED, and now it is theirs — so nothing is said on an ordinary refresh,
     and said once per clause per sitting.
     IT IS A TOAST, NOT A BAND. A transient confirmation of a thing that just
     happened is the cheapest channel that does the job; the clause is open to
     them from this moment and the pencil says so. */
  const me = clauseLockMe();
  if (me) Object.keys(live).forEach(k => {
    const was = (c.locks || {})[k], now = live[k];
    if (!was || !clauseLockLive(was)) return;
    const wasMine = was.by && String(was.by.id || '') === String(me.id || '');
    const nowMine = now.by && String(now.by.id || '') === String(me.id || '');
    if (wasMine || !nowMine) return;
    if (!clauseLockAskedByMe(was, me)) return;      // only a baton you asked for
    const key = String(c.id || '') + '|' + k;
    if (_clSaid[key]) return;
    _clSaid[key] = 1;
    if (typeof window !== 'undefined' && window.toast)
      window.toast(_clT('cl_your_turn', { who: String((was.by && was.by.name) || _clT('cl_a_colleague')) }), 'ok');
  });
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
  /* ---- AND WHETHER THIS READER HAS ALREADY ASKED (4 Oct 2026) ----
     On the SIGN, because the sign is what the reader reaching for the pencil
     finds, and a refusal carries its way forward on the same screen. Two
     pieces: may I ask, and have I. The sign still DRESSES NOTHING — the door
     that draws it decides whether it has room for the act. */
  const askedMine = !!clauseLockAskedByMe(l);
  return { mono: clauseLockInitials(name), say: clauseLockLine(l), title: clauseLockTitle(l), name,
    asked: askedMine, askedSay: askedMine ? clauseLockAskedLine(l) : '',
    mayAsk: !askedMine && !!clauseLockMe(), clauseId: String(clauseId || '') };
}

if (typeof window !== 'undefined') Object.assign(window, {
  CLAUSE_LOCK_MS,
  clauseLockAsks, clauseLockAskedByMe, clauseLockAsk, clauseLockMineWaiting,
  clauseLockHandOver, clauseLockHandOverAsk, clauseLockWaitingLine, clauseLockAskedLine, clauseLockLive, clauseLockMe, clauseLockInitials, clauseLockMonogram,
  clauseLockOf, clauseLockHeldByOther, clauseLockTake, clauseLockKeep,
  clauseLockRelease, clauseLockSweep, clauseLockLine, clauseLockTitle, clauseLockSave,
  clauseLockMerge, clauseLockSign });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  CLAUSE_LOCK_MS,
  clauseLockAsks, clauseLockAskedByMe, clauseLockAsk, clauseLockMineWaiting,
  clauseLockHandOver, clauseLockHandOverAsk, clauseLockWaitingLine, clauseLockAskedLine, clauseLockLive, clauseLockInitials, clauseLockMonogram,
  clauseLockOf, clauseLockHeldByOther, clauseLockTake, clauseLockKeep,
  clauseLockRelease, clauseLockSweep, clauseLockSave, clauseLockMerge, clauseLockSign };
