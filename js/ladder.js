/* ============================================================
   THE CLAUSE LADDER (Young ruled 14 Sep 2026)
   ============================================================
   A clause that goes back and forth four times has four moves on it. The
   paper shows the last two — that is the window, and it is right: after
   round three the marks from round one are noise. But the other moves did
   not stop existing, and until now nothing on the screen could reach them.
   A lawyer in round five who has to prove what was said in round two had
   the audit trail and nothing else.

   THIS IS THE READING. Every move on ONE clause, oldest first, across every
   closed round AND the live set, with what each one stands on. It decides
   nothing, spends nothing and writes nothing.

   READING MUST NOT WRITE. negoClauseList, negoChanges, negoAllChanges and
   negoRound all call negoInit, which CREATES a negotiation on a contract
   that has none and stamps clause ids into the stored body. A ladder drawn
   beside a clause is asked on every paint of every clause, so a reading here
   that initialised would rewrite the book by being looked at. Everything
   below reads `c.changes` and `c.negotiation` RAW and never calls a name
   that does not.

   IT BORROWS EVERY OTHER READING. The figure a clause is argued in is
   js/precedent.js's own (PRECEDENT_TOPICS carries the reader, the unit and
   which direction is worse); the standard is js/playbook.js's; the name a
   clause is shown under is clauseNameShown. This file adds no vocabulary of
   its own — a second answer to "what is this clause about" is how two
   screens come to disagree.

   NO ROUTE, NO STORE, NO FIELD. Nothing here is persisted and nothing is
   sent. f313 greps this file for fetch/api/route names and fails on one. */

/* How many rungs a reading will carry. A clause argued sixty times is a
   different problem from the one this feature solves, and a list that long
   stops being readable; the excess is COUNTED and said, never trimmed in
   silence. */
const LADDER_CAP = 60;

/* ---- WHICH MOVES EXIST, AND WHICH ROUND EACH BELONGS TO ----
   A closed round keeps its own copy of the changes that settled in it
   (negoAdvanceRound pushes `{n, at, baselineBody, baselineText, changes}`),
   and the live set is `c.changes`. Reading both is what makes this a ladder
   rather than a list of this round's arguments. */
function ladderMoves(c){
  const out = [];
  if (!c) return out;
  const neg = c.negotiation;
  const rounds = (neg && Array.isArray(neg.rounds)) ? neg.rounds : [];
  rounds.forEach(r => {
    const n = Number(r && r.n) || 0;
    const list = (r && Array.isArray(r.changes)) ? r.changes : [];
    list.forEach(ch => { if (ch && ch.id) out.push({ ch, round: n, closed: true }); });
  });
  /* THE LIVE ROUND'S NUMBER IS THE NEGOTIATION'S, not a count of rounds: a
     change filed before the first round closed carries roundN 1 and belongs
     to round 1 whatever has happened since. The change's own stamp wins
     where it has one. */
  const live = Number(neg && neg.round) || 1;
  const now = (Array.isArray(c.changes)) ? c.changes : [];
  now.forEach(ch => { if (ch && ch.id) out.push({ ch, round: Number(ch.roundN) || live, closed: false }); });
  return out;
}

/* THE ORDER IS THE ORDER THEY WERE FILED. `seq` is the fingerprint chain's
   own counter (negoIssue stamps it and never reuses one), so it is the only
   reading of "which came first" that cannot be argued with — a clock can be
   wrong and two changes can share a second. Round first, because a closed
   round's moves all precede the live set whatever their seq; then seq; then
   arrival, which is the honest fallback for a record filed before seq
   existed. */
function _ladderOrder(a, b){
  if (a.round !== b.round) return a.round - b.round;
  const sa = Number(a.ch.seq), sb = Number(b.ch.seq);
  if (Number.isFinite(sa) && Number.isFinite(sb) && sa !== sb) return sa - sb;
  return a.i - b.i;
}

/* ---- EVERY MOVE ON ONE CLAUSE ----
   Oldest first, numbered from 1. A superseded move is KEPT: it is part of
   how the clause got here, and dropping it is how a ladder comes to disagree
   with the audit trail. It is marked, so a reader can see it was replaced
   rather than answered. */
function ladderRungs(c, clauseId){
  const id = String(clauseId || '');
  if (!c || !id) return [];
  const rows = ladderMoves(c)
    .map((x, i) => Object.assign({ i }, x))
    .filter(x => String(x.ch.clauseId || '') === id);
  rows.sort(_ladderOrder);
  return rows.slice(0, LADDER_CAP).map((x, k) => {
    const ch = x.ch;
    return {
      n: k + 1,
      id: ch.id,
      round: x.round,
      closed: x.closed,
      side: ch.authorSide === 'counterparty' ? 'counterparty' : 'owner',
      author: ch.author || '',
      at: ch.createdAt || '',
      status: ch.status || 'pending',
      withdrawn: !!ch.withdrawn,
      replacement: !!ch.replacement,
      kind: ch.changeType || 'modify',
      text: String(ch.newText == null ? '' : ch.newText),
      oldText: String(ch.oldText == null ? '' : ch.oldText),
      say: ch.why || '',
      summary: ch.summary || '',
      label: ch.clauseLabel || '',
      ch
    };
  });
}
/* What was left out, said rather than trimmed in silence. */
function ladderOverflow(c, clauseId){
  const id = String(clauseId || '');
  if (!c || !id) return 0;
  const n = ladderMoves(c).filter(x => String(x.ch.clauseId || '') === id).length;
  return n > LADDER_CAP ? n - LADDER_CAP : 0;
}

/* ---- WHAT A RUNG STANDS ON ----
   Every change records the wording it was MEASURED AGAINST (`oldText`), so
   "what does this stand on" is answered by the record and never guessed: the
   latest earlier rung whose result is this rung's starting point. Null where
   it stands on the clause as it was before anybody moved — R0. */
function ladderUnder(rungs, r){
  if (!r || !Array.isArray(rungs)) return null;
  const from = String(r.oldText || '').trim();
  if (!from) return null;
  for (let k = rungs.indexOf(r) - 1; k >= 0; k--){
    if (String(rungs[k].text || '').trim() === from) return rungs[k];
  }
  return null;
}
/* R0 — the clause before anybody moved. It is the FIRST rung's own starting
   point, which is the record's answer; with no rungs there is nothing to
   say, and a caller that wants the clause as it stands asks the clause. */
function ladderBaseText(rungs){
  return (Array.isArray(rungs) && rungs.length) ? String(rungs[0].oldText || '') : '';
}
/* Which rungs are still arguable. `countered` is a parked ask — it is on the
   table but its counter is what gets decided — and `superseded` was written
   over. Neither is live; both stay on the ladder. */
const LADDER_DEAD = { superseded: 1, countered: 1, rejected: 1, accepted: 1 };
function ladderLive(rungs){
  return (Array.isArray(rungs) ? rungs : []).filter(r => !LADDER_DEAD[r.status] && !r.withdrawn);
}
function ladderTop(rungs){
  const live = ladderLive(rungs);
  return live.length ? live[live.length - 1] : null;
}
function ladderSettled(rungs){
  return (Array.isArray(rungs) ? rungs : []).find(r => r.status === 'accepted') || null;
}

/* ---- A COUNT, NEVER A VERDICT (Young ruled 17 Sep 2026) ----
   *"What if the counterparty accepts one change and declines another change in
   the same clause. What appears on the highlighted green area?"* — and the
   answer was that nothing honest could. The chip printed `Settled · R1
   accepted` off ladderSettled, which finds the FIRST accepted rung; on a
   clause carrying an accepted change and a refused one it announced the
   accepted one and said nothing about the other. A decision in this product
   is made on a CHANGE (negoResolve takes a change id) and a clause holds a
   LIST of them, so any single word on the clause is false the moment two of
   them go different ways. "Partly settled" would be no better — it names no
   part.

   *"If you want a line on the clause, make it a count, not a verdict: '3
   changes · 2 agreed · 1 refused'. A count can't be wrong."*

   IT COUNTS RUNGS, WHICH IS WHAT THE LADDER ALREADY IS — no second population
   and no second reading of what settled means: `accepted` is agreed and
   `rejected` or `withdrawn` is refused, exactly as ladderChip's own branches
   read them. `open` is everything still on the table and is what tells the
   chip this clause is not settled at all. */
function ladderTally(rungs){
  const list = Array.isArray(rungs) ? rungs : [];
  let agreed = 0, refused = 0, open = 0;
  for (const r of list){
    if (!r) continue;
    if (r.status === 'accepted') agreed++;
    else if (r.status === 'rejected' || r.withdrawn) refused++;
    else open++;
  }
  return { n: list.length, agreed, refused, open };
}

/* The words, built once so the chip and anything that reads it later cannot
   disagree. Each part is DROPPED where it is zero — "2 changes · 2 agreed · 0
   refused" invites the reader to work out that nothing was refused, which is
   the sentence saying it. */
function ladderTallyText(t){
  if (!t || !t.n) return '';
  const bits = [_ladderTn('ng_rung_n_changes', t.n, { n: t.n })];
  if (t.agreed)  bits.push(_ladderTn('ng_rung_n_agreed', t.agreed, { n: t.agreed }));
  if (t.refused) bits.push(_ladderTn('ng_rung_n_refused', t.refused, { n: t.refused }));
  return bits.join(' · ');
}

/* ---- WHOSE MOVE THE PAPER IS SHOWING ----
   The words on the chip, and the class that colours it. Relative to the
   READER: the same clause says "your move" on one seat and "their move" on
   the other, which is the same rule the marks themselves follow.
   Null where there is nothing to say — a clause nobody has touched carries
   no chip, because a chip saying "no moves" is furniture. */
/* ---- IS THIS RUNG OF OURS STILL UNSENT (14 Sep 2026) ----
   The RAW twin of negoUnsentAsks, which reads through negoPending → negoInit
   and may not be asked by a reading drawn beside every clause. Same rule:
   an ask of ours filed after the last hand-over (negotiation.turnAt), or
   held back by a solo send (negotiation.holdIds), has not reached the other
   side; where nothing has ever been handed over, our own asks are unsent and
   theirs never are. Asked only of the reader's own rungs — the other side's
   copy is on our record because it was sent. */
function ladderUnsent(c, r, viewerSide){
  if (!c || !r || !r.ch) return false;
  const mine = (r.side === 'counterparty') === (viewerSide === 'counterparty');
  if (!mine || r.status !== 'pending' || r.withdrawn) return false;
  const neg = c.negotiation || null;
  const hb = (neg && Array.isArray(neg.holdIds)) ? neg.holdIds : [];
  if (hb.includes(r.id)) return true;
  const at = neg && neg.turnAt;
  return at ? String(r.ch.createdAt || '') > String(at) : viewerSide !== 'counterparty';
}
/* ---- WHAT THE PLAIN WORDS UNDER TWO MOVES ARE (14 Sep 2026) ----
   The line the artifact prints under a stacked clause. The window draws the
   top move against the one beneath it, so the words carrying no mark are the
   wording the LOWER move was written on — somebody's proposal, not the agreed
   text — and this says so, with the figure where the clause is argued in
   one. Null where the clause is not a stack: a lone ask is drawn against the
   agreed wording and the plain words are the contract's own. */
function ladderBaseline(c, clauseId, viewerSide){
  const rungs = ladderRungs(c, clauseId);
  const top = ladderTop(rungs);
  if (!top) return null;
  const under = ladderUnder(rungs, top);
  if (!under) return null;
  const below = ladderUnder(rungs, under);
  const mine = s => (s === 'counterparty') === (viewerSide === 'counterparty');
  const topic = ladderTopic(rungs);
  return {
    below: below ? { n: below.n, who: mine(below.side) ? 'you' : 'them',
      fig: ladderFigure(topic, below.text) } : null,
    baseFig: ladderFigure(topic, ladderBaseText(rungs)),
    unit: (topic && topic.unit) || ''
  };
}
function ladderChip(c, clauseId, viewerSide){
  const rungs = ladderRungs(c, clauseId);
  if (!rungs.length) return null;
  const mine = s => (s === 'counterparty') === (viewerSide === 'counterparty');
  /* ---- NOTHING LEFT ON THE TABLE IS A COUNT, NOT A VERDICT ----
     See ladderTally. This used to print `Settled · R{n} accepted` off the
     FIRST accepted rung, which is a claim about one change wearing the whole
     clause's clothes. The tally is drawn wherever every rung is settled —
     whichever way each one went — so a clause with one agreed and one refused
     now says so instead of announcing the agreed one. `ng_rung_settled` and
     the two single-rung sentences below are STALE, inert in both books. */
  const tally = ladderTally(rungs);
  if (!tally.open) return { cls: tally.refused && !tally.agreed ? 'grey' : 'settled',
    key: 'tally', n: rungs[rungs.length - 1].n, tally, text: ladderTallyText(tally) };
  const top = ladderTop(rungs);
  if (!top) return null;
  const under = ladderUnder(rungs, top);
  const who = mine(top.side) ? 'you' : 'them';
  const key = under
    ? (mine(under.side) ? 'ng_rung_on_yours' : 'ng_rung_on_theirs')
    : 'ng_rung_plain';
  /* "· not sent" on our own unsent top move — the one fact about the chip
     that the column's band also carries, said here because the paper is
     where the reader is looking (the artifact's chip, 14 Sep 2026). */
  const unsent = who === 'you' && ladderUnsent(c, top, viewerSide);
  return {
    cls: who === 'you' ? 'you' : 'them',
    key: 'move', n: top.n, under: under ? under.n : 0, unsent,
    text: _ladderT(key, { n: top.n, u: under ? under.n : 0,
      who: _ladderT(who === 'you' ? 'ng_rung_your_move' : 'ng_rung_their_move') })
      + (unsent ? ' · ' + _ladderT('ng_rung_not_sent') : '')
  };
}
/* The dictionary, asked safely: this file loads on stages that carry no
   i18n, and a head that throws takes the clause with it. */
function _ladderT(key, vars){
  try { if (typeof i18t === 'function') return i18t(key, vars || {}); } catch (_){}
  return String(key);
}
/* The plural sibling. `i18tn` is the product's own and takes the count; a
   tally that said "1 changes" would be the first thing a reader noticed. */
function _ladderTn(key, n, vars){
  try { if (typeof i18tn === 'function') return i18tn(key, n, vars || {}); } catch (_){}
  return String(key);
}

/* ---- THE FIGURE A CLAUSE IS ARGUED IN ----
   BORROWED WHOLE from js/precedent.js: PRECEDENT_TOPICS already carries, per
   clause kind, the reader that pulls the number out of the wording, the unit
   it is counted in and which direction is worse. A second table here would
   be a second answer to the same question.
   Null where the clause is not about a number, which is most of them — a
   governing-law argument has no figure and inventing one would put noise on
   every board. */
function ladderTopic(rungs){
  if (!Array.isArray(rungs) || !rungs.length) return null;
  if (typeof window === 'undefined' || typeof window.precedentTopicOf !== 'function') return null;
  for (const r of rungs){
    const t = window.precedentTopicOf(r.ch);
    if (!t || typeof t.num !== 'function') continue;
    /* A TOPIC THAT CANNOT FIND ITS OWN FIGURE IN THE CLAUSE IS NOT THIS
       CLAUSE'S TOPIC (measured 14 Sep 2026: an INSURANCE clause read as
       "liability" off the words "product liability insurance", and the board
       then printed the liability fallback beside it). precedentTopicOf reads
       the heading first and the wording second, and the second reading is
       right for counting precedent and wrong for naming a standard. So a
       topic that carries a figure reader must find a figure in at least one
       of the clause's wordings, or it is refused here. */
    const has = [r.text, r.oldText].some(x => ladderFigure(t, x) != null)
      || rungs.some(x => ladderFigure(t, x.text) != null);
    if (has) return t;
  }
  return null;
}
function ladderFigure(topic, text){
  if (!topic || typeof topic.num !== 'function') return null;
  try { const n = topic.num(String(text || '')); return (n == null || !Number.isFinite(Number(n))) ? null : Number(n); }
  catch (_){ return null; }
}
/* R0 → R1 → R2 …, each with its figure and whose it was. The one arithmetic
   behind the panel's track, the board's distance and the figure control. */
function ladderTrack(c, clauseId, viewerSide){
  const rungs = ladderRungs(c, clauseId);
  const topic = ladderTopic(rungs);
  if (!topic) return null;
  const mine = s => (s === 'counterparty') === (viewerSide === 'counterparty');
  const rows = [];
  const base = ladderFigure(topic, ladderBaseText(rungs));
  if (base != null) rows.push({ lab: 0, n: base, who: 'base' });
  rungs.forEach(r => {
    const n = ladderFigure(topic, r.text);
    if (n == null) return;
    rows.push({ lab: r.n, n,
      who: r.status === 'accepted' ? 'ok'
        : (r.status === 'rejected' || r.withdrawn) ? 'no'
        : (mine(r.side) ? 'you' : 'them') });
  });
  if (rows.length < 2) return null;
  return { unit: topic.unit || '', dir: topic.dir || '', category: topic.category || '', rows };
}

/* ---- WHERE ONE CLAUSE STANDS ----
   The deal board's row, and every figure in it is borrowed. THE STANDARD IS
   THE PLAYBOOK'S OWN RANGE, read through pbRangeRead so the board and the
   playbook pass cannot disagree about what "45 days" means.
   THERE IS NO WALK-AWAY COLUMN and the absence is deliberate: the playbook
   holds a position and no walk-away, so a walk-away here would be a number
   this product invented and then showed a lawyer as their own policy. What
   stands beside the standard instead is PRECEDENT — what this workspace has
   actually settled at — which is a fact on the record. */
function ladderStandard(c, rungs, topic){
  if (!topic || typeof window === 'undefined') return null;
  if (typeof window.playbookKeyFor !== 'function' || typeof window.resolvePlaybook !== 'function') return null;
  let pb = null;
  try { pb = window.resolvePlaybook(window.playbookKeyFor(c)); } catch (_){ return null; }
  if (!pb || !Array.isArray(pb.ranges)) return null;
  /* The range whose reader answers on this clause's own wording. Asked of
     the wording rather than matched by name, so a playbook that renames its
     ranges still lands on the right clause. */
  const text = (ladderTop(rungs) || rungs[rungs.length - 1] || {}).text || ladderBaseText(rungs);
  const shape = r => ({ key: r.key, label: r.label || '', op: r.op || '', value: Number(r.value), note: r.note || '' });
  for (const r of pb.ranges){
    if (!r || !r.key) continue;
    let hit = null;
    try { hit = (typeof window.pbRangeRead === 'function') ? window.pbRangeRead(r.key, text) : null; } catch (_){}
    if (hit) return shape(r);
  }
  /* BY TOPIC where the wording defeats the range reader (14 Sep 2026): the
     playbook's readers match "within 30 days" and "12 months' fees" and not
     the drafted "thirty (30) days" — so on exactly the paper this ladder is
     about, every standard read as absent. The range's key names the topic it
     is about, and that pairing is the playbook's own (LADDER_RANGE_TOPIC
     mirrors PB_RANGE_READERS' keys), so the standard is still the playbook's
     and nothing is guessed. */
  const want = LADDER_RANGE_TOPIC[topic.key];
  if (want){ const r = pb.ranges.find(x => x && x.key === want); if (r) return shape(r); }
  return null;
}
const LADDER_RANGE_TOPIC = { payment: 'paymentDays', liability: 'liabilityMonths' };
function ladderStand(c, clauseId, viewerSide){
  const rungs = ladderRungs(c, clauseId);
  if (!rungs.length) return null;
  const mine = s => (s === 'counterparty') === (viewerSide === 'counterparty');
  const topic = ladderTopic(rungs);
  const acc = ladderSettled(rungs);
  const top = ladderTop(rungs);
  /* ---- WHERE EACH SIDE STANDS, WHICH IS NOT THE SAME AS WHAT IS LIVE ----
     A PARKED ASK IS STILL THEIR POSITION. `countered` means a counter is
     written on top of it and the pair is decided together; it has not been
     answered, withdrawn or replaced, so the wording in it is still the last
     thing that side asked for. Reading only ladderLive made the board print
     "no ask yet" on the most argued clause on the page, because the moment
     you counter them their ask stops being live — MEASURED on a real page.
     Refused, withdrawn and superseded rungs are NOT positions: the first two
     were taken off the table and the third was written over. */
  const standing = rungs.filter(r => r.status !== 'rejected' && r.status !== 'superseded' && !r.withdrawn);
  const theirs = standing.slice().reverse().find(r => !mine(r.side)) || null;
  const ours = standing.slice().reverse().find(r => mine(r.side)) || null;
  const row = {
    clauseId, rungs, topic, accepted: acc, top, theirs, ours,
    label: (typeof window !== 'undefined' && typeof window.clauseNameShown === 'function')
      ? window.clauseNameShown(rungs[0].label || '') : String(rungs[0].label || ''),
    moves: rungs.length,
    state: acc ? 'settled'
      : !top ? (rungs.some(r => r.status === 'rejected') ? 'refused' : 'quiet')
      : mine(top.side) ? 'with' : 'awaiting',
    standard: null, theirFig: null, ourFig: null, dist: null, unit: (topic && topic.unit) || ''
  };
  if (topic){
    row.standard = ladderStandard(c, rungs, topic);
    row.theirFig = theirs ? ladderFigure(topic, theirs.text) : null;
    row.ourFig = ours ? ladderFigure(topic, ours.text) : ladderFigure(topic, ladderBaseText(rungs));
    if (row.theirFig != null && row.ourFig != null) row.dist = Math.abs(row.theirFig - row.ourFig);
  }
  return row;
}
/* ---- WHAT THIS WORKSPACE HAS ACTUALLY SETTLED AT ----
   The worst figure this book has agreed to MORE THAN ONCE — not the average,
   which is a number nobody ever signed, and not the extreme, which may be the
   one deal everybody regrets. THAT RULE IS precedentSuggestions' OWN and this
   is the second place it is applied; it cannot call that function because it
   drops exactly the case this column wants (a held figure that already matches
   the library, which is still the answer to "what do we settle at"). Both
   readings take their numbers from precedentMine, so they cannot count
   different rounds — only the same rule is written twice, and it is written
   here where the second reader can see it.
   NEVER ON THE COUNTERPARTY'S SEAT: the caller is the wall, and the board is
   drawn for our seat by construction. */
function ladderSettledFigure(topicKey){
  if (typeof window === 'undefined' || typeof window.precedentMine !== 'function') return null;
  let row = null;
  try { row = (window.precedentMine() || {})[String(topicKey || '')]; } catch (_){ return null; }
  if (!row || !row.numbers) return null;
  const nums = (row.numbers.oursAccepted || []).concat(row.numbers.theirsAccepted || [])
    .filter(n => n != null && Number.isFinite(Number(n))).map(Number);
  if (!nums.length) return null;
  const counts = new Map();
  nums.forEach(n => counts.set(n, (counts.get(n) || 0) + 1));
  const repeated = [...counts.entries()].filter(([, k]) => k > 1).map(([v]) => v);
  if (!repeated.length) return null;
  const topic = (typeof window.precedentTopicByKey === 'function') ? window.precedentTopicByKey(topicKey) : null;
  const worse = (topic && topic.dir === 'lower-is-worse') ? Math.min(...repeated) : Math.max(...repeated);
  return { figure: worse, seen: counts.get(worse) || 0, of: nums.length, unit: row.unit || '' };
}
/* EVERY CLAUSE WITH A MOVE ON IT, sorted by how far apart the two sides
   still are. A clause nobody has touched is not an open point and is not a
   row: the board is what is being argued, not a table of contents.
   Ordering: a figure gap ranks by its own size; a wording argument with no
   number ranks above every settled row and below every measurable gap,
   because "we disagree and cannot measure it" is real but unrankable. */
function ladderBoard(c, viewerSide){
  const seen = Object.create(null);
  const ids = [];
  ladderMoves(c).forEach(x => {
    const id = String(x.ch.clauseId || '');
    if (!id || seen[id]) return;
    seen[id] = 1; ids.push(id);
  });
  const rows = ids.map(id => ladderStand(c, id, viewerSide)).filter(Boolean);
  const rank = r => {
    if (r.state === 'settled' || r.state === 'quiet') return -1;
    if (r.dist != null) return 1000 + r.dist;
    return 500;
  };
  rows.sort((a, b) => rank(b) - rank(a));
  return rows;
}

/* ---- A FIGURE, WRITTEN BACK INTO THE WORDING (14 Sep 2026) ----
   The artifact's "Write it into the clause": the sentence is written from
   the figure, in words and digits, and everything else in the clause is
   left exactly as it stands. It touches the ONE figure the clause is argued
   in — the first "words (digits) unit" for the topic's unit, else the first
   bare "digits unit" — and answers the text unchanged where there is none,
   so a caller can tell "nothing to write" from "written". English words,
   because contract text is never translated. */
const LADDER_ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const LADDER_TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function ladderWords(n){
  n = Math.round(Number(n));
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 20) return LADDER_ONES[n];
  if (n < 100) return LADDER_TENS[Math.floor(n / 10)] + (n % 10 ? '-' + LADDER_ONES[n % 10] : '');
  if (n < 1000) return LADDER_ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + ladderWords(n % 100) : '');
  return String(n);
}
function ladderWriteFigure(text, n, unit){
  const t = String(text == null ? '' : text);
  const k = Math.round(Number(n));
  if (!Number.isFinite(k)) return t;
  const u = String(unit || '').replace(/s$/, '');
  if (!u) return t;
  const word = u + (k === 1 ? '' : 's');
  const paren = new RegExp('\\b[a-z]+(?:-[a-z]+)?(?: (?:hundred|and) [a-z-]+)* \\((\\d{1,3})\\) ((?:calendar |working |business )?)' + u + 's?\\b', 'i');
  if (paren.test(t)) return t.replace(paren, (m, d, q) => ladderWords(k) + ' (' + k + ') ' + q + word);
  const bare = new RegExp('\\b(\\d{1,3}) ((?:calendar |working |business )?)' + u + 's?\\b', 'i');
  if (bare.test(t)) return t.replace(bare, (m, d, q) => k + ' ' + q + word);
  return t;
}
/* ---- THE PLAYBOOK'S FALLBACK FOR THIS TOPIC (14 Sep 2026) ----
   The clause library holds a preferred wording and a fallback wording per
   topic (js/playbook.js); the fallback's figure, read by the topic's own
   reader, is the "as far as we can go" the artifact's card and scale draw.
   Read through window and never guessed: a topic with no library clause, or
   a fallback with no figure in it, answers null and the surface says so. */
function ladderFallback(topic){
  if (!topic || typeof window === 'undefined' || typeof window.clauseById !== 'function') return null;
  let cl = null;
  try { cl = topic.clause ? window.clauseById(topic.clause) : null; } catch (_){ return null; }
  if (!cl) return null;
  const text = String(cl.fallback || '');
  const n = ladderFigure(topic, text);
  return { text, figure: n, preferred: String(cl.preferred || '') };
}
/* Is a figure on the acceptable side of a bound, given which direction is
   worse for us. lower-is-worse (a liability cap, a notice period we need)
   accepts a figure AT OR ABOVE the bound; higher-is-worse (payment days)
   accepts one at or below. */
function ladderWithin(topic, figure, bound){
  if (figure == null || bound == null || !topic) return null;
  return topic.dir === 'lower-is-worse' ? figure >= bound : figure <= bound;
}

if (typeof window !== 'undefined') Object.assign(window, {
  LADDER_CAP, ladderMoves, ladderRungs, ladderOverflow, ladderUnder, ladderBaseText,
  ladderLive, ladderTop, ladderSettled, ladderTally, ladderTallyText, ladderChip, ladderTopic, ladderFigure,
  ladderTrack, ladderStandard, ladderSettledFigure, ladderStand, ladderBoard,
  ladderUnsent, ladderBaseline, ladderWords, ladderWriteFigure, ladderFallback, ladderWithin
});
