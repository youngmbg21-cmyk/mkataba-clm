// HaTi — native in-app negotiation: the canonical change model.
// Globals are window-attached like every module (see components.js).
//
// THE PIVOT THIS MODULE EXISTS FOR
//
// Tracking a negotiation used to work cleanly only while the other side worked
// inside HaTi, and it fell apart the moment Word was involved. The split is
// gone: however a contract arrives — a built-in template, a customer's own
// template, or an uploaded .docx — once it is extracted into HaTi, every
// further round happens natively here. Word matters exactly once, to get a
// file's wording IN. It is never again the medium for tracking a change.
//
// WHAT A CHANGE IS, AND WHY IT IS NOT A ROUND
//
// js/versioning.js already models a proposal as a ROUND: one whole-document
// text pair (baseText → proposedText) whose divergences diffBlocks() segments
// into positional ids (b0, b1…). That is the right unit for "review what came
// back", and it stays. It is the wrong unit for a negotiation you can point at:
// b0 in round 3 is a different passage from b0 in round 2, so nothing about a
// block is quotable, addressable or hashable across rounds.
//
// A CHANGE is one clause's worth of divergence with a STABLE identity:
//
//   { id, clauseId, type, oldText, newText, hash, status,
//     author, authorSide, createdAt, summary, roundN, thread[] }
//
// `id` is a fingerprint (#CHG-012) allocated once and never reused. `hash` is a
// SHA-256 over the change's substance, so a change can be named out loud, filed
// to the audit trail, quoted in an email and verified later. `thread` is the
// light channel from js/discuss.js attached to that one fingerprint — a comment
// on a change opens no round and moves no document state.
//
// TWO RULES OUTRANK EVERY FEATURE HERE
//
//   1. Silence rejects. A change nobody decided is NOT in the document. The
//      opposite default — a clause quietly entering an agreement because
//      nobody looked at it — is unrecoverable once signed. This is the same
//      rule applyBlockDecisions() enforces, and it is enforced the same way:
//      negoResolvedText() builds the document FROM the accepted set, rather
//      than mutating a document and hoping the mutations were right.
//
//   2. The wording is verified, never trusted. Merging back into a formatted
//      document goes through richFromTextEdit(), which checks its own output's
//      text projection against what was agreed and refuses rather than guess.

/* ---------- clause segmentation ----------
   A clause needs an id that survives a renumbering-free round, because a
   change filed in round 2 must still point at the same clause in round 5.

   The line is the unit, and that is not a choice made here: richToText() emits
   exactly one line per block — a heading, a paragraph, a numbered item — and
   reconstructs ordered-list numbering while doing it, so a clause number is
   literal text in the projection. js/discuss.js already keys its conversation
   topics off that fact, with the reasoning spelled out there: a clause NUMBER
   is stable across rounds where a line INDEX shifts the moment a clause is
   inserted above it.

   So this reuses discussClauseKey() verbatim rather than inventing a second
   key. The payoff is direct: a comment about clause 5 and a change to clause 5
   carry the same topic id, so the two surfaces are talking about one thing. */
function negoClauseKey(line, i){
  return window.discussClauseKey ? discussClauseKey(line, i) : ('clause:#' + i);
}
/* The clauses of a text, in document order. Headings are carried as the TITLE
   of the clauses beneath them rather than as clauses of their own: a heading is
   not a term and cannot be negotiated, and docLineKind() already tells the two
   apart ("1. TERM" is a heading, "1. This Agreement runs for…" is a clause,
   because the first has no lowercase letters).

   Duplicate keys are suffixed rather than dropped. A malformed document really
   can number two clauses the same, and losing one of them here would lose it
   from the negotiation — the one failure this whole model exists to prevent. */
function negoClausesOf(text){
  const lines = String(text == null ? '' : text).split('\n');
  const out = [];
  const seen = new Map();
  let title = '';
  for (let i = 0; i < lines.length; i++){
    const line = lines[i];
    if (!line.trim()) continue;
    const kind = window.docLineKind ? docLineKind(line) : 'text';
    if (kind === 'heading'){ title = line.trim(); continue; }
    let id = negoClauseKey(line, i);
    if (seen.has(id)){                        // two clauses numbered the same
      const n = seen.get(id) + 1;
      seen.set(id, n);
      id = id + '~' + n;
    } else seen.set(id, 1);
    out.push({ id, num: (window.docClausePrefix ? docClausePrefix(line) : '') || '',
      title, text: line.trim(), lineIndex: i, kind });
  }
  return out;
}
/* The clauses of a contract's CURRENT working wording. */
const negoClauses = c => negoClausesOf(window.docPlainText ? docPlainText(c) : '');
/* A clause's display heading, the way the prototype's document pane labels it:
   "Clause 4 · Payment Terms" where both halves are known, the heading alone
   where the clause carries no number, and the number alone where there is no
   heading above it. Never invented: a clause with neither reads as its own
   opening words, which is what a lawyer would call it anyway. */
function negoClauseLabel(cl){
  if (!cl) return '';
  const num = String(cl.num || '').replace(/[.)]$/, '');
  const head = String(cl.title || '').trim();
  if (num && head) return `Clause ${num} · ${head.replace(/^\d+(?:\.\d+)*[.)]?\s+/, '')}`;
  if (num) return `Clause ${num}`;
  if (head) return head;
  return (window.discussTrim ? discussTrim(cl.text, 60) : String(cl.text || '').slice(0, 60));
}

/* ---------- the negotiation record ----------
   c.negotiation holds the BASELINE for the round in flight: the wording both
   sides are measuring this round's proposals against. It is a snapshot of the
   words, not a pointer to a version, for the same reason recordWordSent() keeps
   one — a version can be superseded, but what the parties were arguing about
   cannot un-happen. */
function negoInit(c, opts = {}){
  c.changes = Array.isArray(c.changes) ? c.changes : [];
  if (!c.negotiation || opts.reset){
    const text = (window.docPlainText ? docPlainText(c) : '') || '';
    c.negotiation = {
      baselineText: text,
      baselineFormat: (window.docFormat ? docFormat(c.format) : 'text'),
      baselineBody: (c.redlineText != null ? c.redlineText : null),
      round: 1,
      startedAt: (window.nowISO ? window.nowISO() : new Date().toISOString()),
      seq: 0,
    };
  }
  if (typeof c.negotiation.seq !== 'number') c.negotiation.seq = 0;
  if (typeof c.negotiation.round !== 'number') c.negotiation.round = 1;
  return c.negotiation;
}
const negoBaseText = c => (negoInit(c).baselineText || '');
const negoRound = c => negoInit(c).round;
const negoChanges = c => { negoInit(c); return c.changes; };
const negoChangeById = (c, id) => negoChanges(c).find(x => x.id === id) || null;
const negoPending = c => negoChanges(c).filter(x => x.status === 'pending');
const negoOpenChanges = c => negoPending(c);

/* A fingerprint id, allocated once per change and never reused — not even after
   a change is deleted, because a fingerprint that comes back meaning something
   else is worse than no fingerprint. Three digits to match #CHG-012. */
function negoNextId(c){
  const n = ++negoInit(c).seq;
  return 'CHG-' + String(n).padStart(3, '0');
}

/* ---------- the hash ----------
   What a fingerprint attests to: this clause, this kind of change, these exact
   words before and after, proposed by this party at this moment. Anything
   outside that list is deliberately excluded — a change's hash must not move
   when it is accepted, discussed or re-read, or it could not be used to verify
   the thing it names. Prefixed 0x and rendered in full on the record. */
function negoHashInput(ch){
  return [ 'hati-change-v1', ch.clauseId || '', ch.type || '',
    String(ch.oldText || '').replace(/\s+/g, ' ').trim(),
    String(ch.newText || '').replace(/\s+/g, ' ').trim(),
    ch.author || '', ch.createdAt || '' ].join('\n');
}
async function negoHash(ch){
  const hex = await sha256(negoHashInput(ch));
  return '0x' + hex;
}
/* The abbreviated form the change index shows. The full hash always travels on
   the record and in the title attribute — this is display only. */
const negoShortHash = h => {
  const s = String(h || '');
  return s.length > 20 ? s.slice(0, 10) + '…' + s.slice(-6) : s;
};

/* ---------- summarising a change ----------
   The prototype carries a hand-written line ("Payment terms extended from
   Net-30 to Net-45"). Prose that good cannot be generated honestly, so this
   states the fact instead: what goes, what arrives. diffBlocks() supplies the
   passages, which means the summary quotes the SAME fragments the reviewer sees
   highlighted in the document — it can never describe a change that is not
   there. An `opts.summary` from a caller who knows better always wins. */
function negoSummarise(type, oldText, newText){
  const trim = (s, n) => window.discussTrim ? discussTrim(s, n) : String(s || '').slice(0, n);
  if (type === 'insert') return 'New clause added — ' + trim(newText, 70);
  if (type === 'delete') return 'Clause deleted — ' + trim(oldText, 70);
  const blocks = (window.diffBlocks ? diffBlocks(oldText, newText) : []);
  if (!blocks.length) return 'Wording changed — ' + trim(newText, 70);
  const parts = blocks.slice(0, 2).map(b => {
    const before = trim(b.before, 34), after = trim(b.after, 34);
    if (before && after) return `“${before}” → “${after}”`;
    if (after) return `added “${after}”`;
    return `removed “${before}”`;
  });
  return parts.join('; ') + (blocks.length > 2 ? ` (+${blocks.length - 2} more)` : '');
}

/* ---------- the normaliser: a proposal becomes changes ----------
   Every route a proposal can arrive by ends here, and this is the ONLY place
   that turns wording into change records:

     · the counterparty's redline in the Negotiation tab
     · a returned .docx, read by docxExtract (js/docx.js) — Word's one job
     · wording received outside HaTi and filed under their name
     · the owner's own proposals back at them

   The comparison is per clause, keyed on the stable clause id, which gives all
   three kinds honestly: a clause in both texts whose wording differs is a
   MODIFY; one only in the proposal is an INSERT; one only in the baseline is a
   DELETE. A counterparty who renumbers the whole document produces deletes and
   inserts rather than a silent mismatch, which is the truthful reading of what
   they did.

   Nothing enters the document here. Filing a proposal only records what was
   proposed; the wording moves when a change is ACCEPTED, and not before. */
async function negoFileProposal(c, proposedText, opts = {}){
  negoInit(c);
  const base = String(opts.baseText != null ? opts.baseText : negoBaseText(c));
  const next = String(proposedText == null ? '' : proposedText);
  if (!next.trim()) return [];

  const side = opts.side === 'owner' ? 'owner' : 'counterparty';
  const author = String(opts.author || (side === 'owner'
    ? ((window.currentUser && window.currentUser()?.name) || 'This workspace')
    : (c.counterparty || 'The counterparty'))).trim();
  const createdAt = opts.at || (window.nowISO ? window.nowISO() : new Date().toISOString());
  const roundN = opts.roundN != null ? opts.roundN : negoRound(c);

  const baseClauses = negoClausesOf(base);
  const nextClauses = negoClausesOf(next);
  const byId = list => { const m = new Map(); for (const cl of list) m.set(cl.id, cl); return m; };
  const bMap = byId(baseClauses), nMap = byId(nextClauses);
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  const drafts = [];
  for (const cl of nextClauses){
    const was = bMap.get(cl.id);
    if (!was){ drafts.push({ clauseId: cl.id, type: 'insert', oldText: '', newText: cl.text, clause: cl }); continue; }
    if (norm(was.text) !== norm(cl.text))
      drafts.push({ clauseId: cl.id, type: 'modify', oldText: was.text, newText: cl.text, clause: cl });
  }
  for (const cl of baseClauses){
    if (!nMap.has(cl.id))
      drafts.push({ clauseId: cl.id, type: 'delete', oldText: cl.text, newText: '', clause: cl });
  }
  if (!drafts.length) return [];

  const filed = [];
  for (const d of drafts){
    /* A clause already carrying an undecided change from this same side is
       REPLACED, not duplicated. Two live proposals on one clause would make
       "accept both" mean nothing coherent, and the second proposal is plainly
       the one they mean. The superseded fingerprint is retired with its thread
       intact so the conversation survives the revision. */
    const live = negoChanges(c).find(x => x.clauseId === d.clauseId
      && x.status === 'pending' && x.authorSide === side);
    const ch = {
      id: negoNextId(c),
      clauseId: d.clauseId,
      type: d.type,
      oldText: d.oldText,
      newText: d.newText,
      hash: null,
      status: 'pending',
      author, authorSide: side,
      createdAt,
      roundN,
      clauseLabel: negoClauseLabel(d.clause),
      summary: String(opts.summary || '').trim() || negoSummarise(d.type, d.oldText, d.newText),
      note: (opts.notes && opts.notes[d.clauseId]) || null,
      thread: live ? (live.thread || []) : [],
      supersedes: live ? live.id : null,
    };
    ch.hash = await negoHash(ch);
    if (live){
      live.status = 'superseded';
      live.supersededBy = ch.id;
      live.thread = [];                       // the conversation moves with the change
    }
    c.changes.push(ch);
    filed.push(ch);
  }

  if (window.logAudit) logAudit(c, 'Negotiation',
    `${filed.length} change${filed.length === 1 ? '' : 's'} proposed by ${author}` +
    ` in round ${roundN} — ${filed.map(x => '#' + x.id).join(', ')}` +
    `${side === 'counterparty' ? ' (the counterparty\'s wording, recorded in their name)' : ''}` +
    `${opts.via ? ` · received via ${opts.via}` : ''}`);
  return filed;
}

/* ---------- the working document ----------
   negoResolvedText BUILDS the wording from the accepted set. It does not mutate
   a document and hope: rejecting every change reproduces the baseline exactly,
   which is the property that makes any of this safe to run on a legal
   instrument, and it is asserted directly in the tests.

   A PENDING change is not in the text. It is drawn as a redline over the text
   (negoRedlineHtml, below) so the reviewer sees what is being asked for, but
   the words on the page are still the baseline's until someone says yes. */
function negoResolvedText(c){
  negoInit(c);
  const base = negoBaseText(c);
  const accepted = negoChanges(c).filter(x => x.status === 'accepted');
  if (!accepted.length) return base;
  const byClause = new Map();
  for (const ch of accepted) byClause.set(ch.clauseId, ch);

  const lines = base.split('\n');
  const clauses = negoClausesOf(base);
  const lineToClause = new Map();
  for (const cl of clauses) lineToClause.set(cl.lineIndex, cl);

  const out = [];
  for (let i = 0; i < lines.length; i++){
    const cl = lineToClause.get(i);
    if (!cl){ out.push(lines[i]); continue; }         // headings and blanks pass through
    const ch = byClause.get(cl.id);
    if (!ch){ out.push(lines[i]); continue; }
    if (ch.type === 'delete') continue;               // accepted deletion: the clause goes
    out.push(ch.newText);
    byClause.delete(cl.id);
  }
  /* Accepted INSERTs name a clause the baseline never had, so there is no line
     to replace — they are appended in fingerprint order. Appending rather than
     guessing a position is deliberate: putting a new clause somewhere it was
     not asked to go would be inventing document structure. */
  for (const ch of accepted) if (byClause.has(ch.clauseId) && ch.type === 'insert') out.push(ch.newText);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* Write the resolved wording into the contract body, keeping the document
   FORMATTED wherever that can be verified. This is the same contract that
   acceptProposedRound() honours and it is honoured the same way: if
   richFromTextEdit() cannot verify that the rebuilt document says exactly what
   was agreed, the merge is abandoned for plain text AND the record says so,
   rather than leaving a 'rich' marker on a body that is not one. */
function negoCommitText(c, text){
  const wasRich = !!(window.isRich && isRich(c.format) && c.redlineText);
  let flattened = false;
  if (wasRich && window.richFromTextEdit){
    const merged = richFromTextEdit(c.redlineText, text);
    if (merged) c.redlineText = merged;
    else { c.redlineText = text; c.format = window.TEXT_FORMAT || 'text'; flattened = true; }
  } else {
    c.redlineText = text;
    if (wasRich){ c.format = window.TEXT_FORMAT || 'text'; flattened = true; }
  }
  /* An uploaded document's extracted text IS its reading view, so it follows
     the adopted wording — otherwise search, the Copilot review and the reading
     pane would all keep describing wording the parties have moved past. */
  if (c.upload && window.isUpload && window.isUpload(c)){
    c.upload.extractedText = text;
    c.upload.textChars = text.length;
  }
  return { flattened };
}

/* ---------- deciding a change ----------
   Accept merges that one clause into the clean text. Reject leaves the clause
   at the baseline and the ask becomes an open point. Reopen puts it back to
   pending. All three are reversible and all three are recorded with the RIGHT
   author: the person deciding is not the person who proposed, and an audit
   trail that conflated them would be the record lying. */
function negoResolve(c, id, status, opts = {}){
  negoInit(c);
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  if (!['pending', 'accepted', 'rejected'].includes(status)) return null;
  /* Read the permission through `window` deliberately, not as a bare call.
     js/core.js declares `const canEdit = …`, which is a LEXICAL binding rather
     than a property of the global object — so a bare `canEdit()` here resolves
     to that binding and cannot be substituted, while `window.canEdit` is the
     name every other module reaches this function by. Under ES modules the two
     are the same function; in a single shared script scope they are not, and the
     difference is a permission check that silently ignores its own subject.
     A decision taken by a named side is always someone acting AS that side —
     the counterparty holds no workspace role at all — so the role gate applies
     only to an unattributed call from inside the workspace. */
  if (!opts.side && typeof window.canEdit === 'function' && !window.canEdit()){
    if (window.toast) toast('Viewers cannot decide changes', 'err');
    return null;
  }
  if (c.status === 'Signed' || (window.wordDoorClosed && wordDoorClosed(c))){
    if (window.toast) toast('This contract is executed — record an amendment instead', 'err');
    return null;
  }
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  const prev = ch.status;
  if (prev === status) return ch;

  ch.status = status;
  ch.resolvedBy = status === 'pending' ? null : who;
  ch.resolvedAt = status === 'pending' ? null : (window.nowISO ? window.nowISO() : new Date().toISOString());
  ch.reply = String(opts.reply || ch.reply || '').slice(0, 2000) || null;

  const text = negoResolvedText(c);
  const { flattened } = negoCommitText(c, text);

  const verb = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'reopened';
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} ${verb} by ${who} — “${ch.summary}” on ${ch.clauseLabel || ch.clauseId},` +
    ` proposed by ${ch.author}` +
    `${status === 'accepted' ? ` · merged into the clean text · fingerprint ${ch.hash}` : ''}` +
    `${status === 'rejected' ? ' · the clause stays at the baseline and the ask travels back as an open point' : ''}` +
    `${status === 'pending' ? ` (was ${prev})` : ''}` +
    `${flattened ? ' · the merge could not be placed back into the formatted document, so it is now plain text' : ''}`);
  if (window.captureVersion && status !== 'pending')
    captureVersion(c, `#${ch.id} ${verb} — ${ch.clauseLabel || ch.clauseId}`, who);
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return ch;
}
/* Accept or reject everything still undecided, in one pass. Nothing pending is
   not an error and not a no-op dressed as success — it says so. */
function negoResolveAll(c, status, opts = {}){
  const pending = negoPending(c);
  if (!pending.length) return [];
  const out = [];
  for (const ch of pending){ if (negoResolve(c, ch.id, status, opts)) out.push(ch); }
  return out;
}

/* ---------- talking about a change ----------
   The light channel, attached to one fingerprint. It opens no round, captures
   no version and moves no wording — the same guarantee js/discuss.js makes for
   a clause, made for a change. That guarantee is asserted directly in the
   tests, because it is the whole reason this exists. */
function negoPostComment(c, id, text, opts = {}){
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  const body = String(text == null ? '' : text).trim();
  if (!body) return null;
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const who = String(opts.author || (side === 'counterparty'
    ? (c.counterparty || 'The counterparty')
    : ((window.currentUser && window.currentUser()?.name) || 'This workspace'))).trim();
  ch.thread = Array.isArray(ch.thread) ? ch.thread : [];
  const msg = { who, side, at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    text: body.slice(0, 2000) };
  ch.thread.push(msg);
  if (window.logAudit) logAudit(c, 'Negotiation',
    `Comment posted on #${ch.id} by ${who} — the contract is unchanged and no round was opened`);
  return msg;
}
/* The topic key a change's thread shares with js/discuss.js, so a conversation
   about clause 5 and a conversation about the change to clause 5 are the same
   conversation rather than two that never meet. */
const negoTopicFor = ch => ch ? ('change:' + ch.id) : null;

/* ---------- progress, and the one transition out ---------- */
function negoProgress(c){
  const live = negoChanges(c).filter(x => x.status !== 'superseded');
  const total = live.length;
  const done = live.filter(x => x.status !== 'pending').length;
  return { total, done, pending: total - done,
    pct: total ? Math.round((done / total) * 100) : 0 };
}
/* Ready to sign means every change on the table has an answer, from both
   sides, and there is at least one thing that was actually negotiated. It is a
   READ of the change set, never a stored flag — a flag could disagree with the
   changes it claims to summarise, and on this screen that disagreement would be
   an invitation to sign something nobody had finished arguing about. */
function negoReadyToSign(c){
  const p = negoProgress(c);
  return p.total > 0 && p.pending === 0;
}
/* Points the counterparty raised that were refused, and are therefore still
   live between the parties. A rejected change that simply vanishes from the
   document reads as agreement, and it is not.

   Two things this has to get right, and openPointsFor() in js/versioning.js
   already worked both of them out for the round model — the reasoning is the
   same here and is deliberately not re-derived:

     · It spans EVERY round, not the one in flight. A refusal in round 1 is
       still a refusal in round 5, and negoAdvanceRound archives the round's
       changes onto the record — so reading only the live set would quietly
       drop every earlier disagreement at the moment the round closed. That is
       exactly the failure the list exists to prevent, arriving through the
       back door.

     · A point stops being open in TWO ways, because a list that keeps showing
       settled items is a list people learn to ignore:
         — the wording they asked for is in the document anyway. It may have
           arrived by another route; either way they got it.
         — the wording it was measured AGAINST is gone. The clause has been
           renegotiated since, so neither side's original text stands and the
           old ask is about a passage that no longer exists. (Erik asks for
           EUR 250,000, is refused, and the parties later settle on EUR 500,000
           per event: he did not get what he asked for, but the point is spent,
           not outstanding.) */
function negoOpenPoints(c){
  const live = String((window.docPlainText ? docPlainText(c) : '') || '').replace(/\s+/g, ' ');
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const x of negoAllChanges(c)){
    if (x.status !== 'rejected' || x.authorSide !== 'counterparty') continue;
    const want = norm(x.newText), had = norm(x.oldText);
    if (want && live.includes(want)) continue;      // they got it in the end
    if (had && !live.includes(had)) continue;       // the clause has moved on since
    out.push({ id: x.id, clauseId: x.clauseId, clauseLabel: x.clauseLabel || null,
      round: x.roundN || null, before: x.oldText, after: x.newText,
      ask: x.note || null, reason: x.reply || null, by: x.author, at: x.resolvedAt || null });
  }
  return out;
}

/* ---------- advancing the round ----------
   The resolved wording becomes the baseline the NEXT round is measured against,
   and the decided changes are archived onto the round record so the history
   reads as a sequence of decisions rather than one ever-growing pile. */
function negoAdvanceRound(c, opts = {}){
  negoInit(c);
  const p = negoProgress(c);
  if (p.pending) return null;                 // an undecided change is not history yet
  const decided = negoChanges(c).filter(x => x.status === 'accepted' || x.status === 'rejected');
  if (!decided.length) return null;
  const n = c.negotiation.round;
  c.negotiation.rounds = Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  c.negotiation.rounds.push({ n, at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    baselineText: c.negotiation.baselineText,
    changes: decided.map(x => ({ id: x.id, clauseId: x.clauseId, type: x.type,
      oldText: x.oldText, newText: x.newText, hash: x.hash, status: x.status,
      author: x.author, authorSide: x.authorSide, summary: x.summary,
      resolvedBy: x.resolvedBy, resolvedAt: x.resolvedAt,
      thread: (x.thread || []).slice() })) });
  c.negotiation.baselineText = negoResolvedText(c);
  c.negotiation.baselineFormat = (window.docFormat ? docFormat(c.format) : 'text');
  c.negotiation.baselineBody = (c.redlineText != null ? c.redlineText : null);
  c.negotiation.round = n + 1;
  c.changes = [];                             // the archived set lives on the round
  if (window.logAudit) logAudit(c, 'Negotiation',
    `Round ${n} closed by ${opts.by || (window.currentUser && window.currentUser()?.name) || 'System'}` +
    ` — ${decided.filter(x => x.status === 'accepted').length} of ${decided.length} changes adopted;` +
    ` the agreed wording is now the baseline for round ${n + 1}`);
  return c.negotiation.rounds[c.negotiation.rounds.length - 1];
}
/* Every change this negotiation has ever carried, live and archived, newest
   round last. What the history panel and the evidence pack read. */
function negoAllChanges(c){
  negoInit(c);
  const out = [];
  for (const r of (c.negotiation.rounds || [])) out.push(...(r.changes || []).map(x => ({ ...x, roundN: r.n })));
  out.push(...negoChanges(c).filter(x => x.status !== 'superseded'));
  return out;
}

/* ---------- the redline, as HTML ----------
   Classed spans, not inline styles, so the colours come from HaTi's tokens in
   one place. wordDiff() does the segmentation — the same function the existing
   version-compare modal uses — so an accepted change looks identical in the new
   tab and in the old compare view, and neither can drift from the other. */
function negoDiffHtml(oldText, newText){
  const e = window.esc || (s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
  const parts = window.wordDiff ? wordDiff(oldText, newText) : [{ t: 'eq', text: newText }];
  return parts.map(p => p.t === 'eq' ? e(p.text)
    : p.t === 'add' ? `<span class="nego-ins">${e(p.text)}</span>`
    : `<span class="nego-del">${e(p.text)}</span>`).join('');
}

/* ---------- intake normalisation ----------
   The three ways a contract becomes negotiable, converging on ONE shape. This
   is the function that makes the pivot true: after it runs, nothing downstream
   can tell which route the contract arrived by.

     1. standard template  — drafted in the wizard from js/templates.js
     2. custom/user template — state.settings.customTemplates, js/views/library.js
     3. uploaded Word file — docxExtract() in js/docx.js, the one and only place
        Word's format matters from here on

   Paths 1 and 2 are already indistinguishable to callers: templateFields() in
   js/templatefields.js is a single accessor over built-in and custom templates
   alike, and both write the same c.redlineText/c.format pair. Path 3 arrives as
   extracted plain text and is lifted to the same rich-document shape by
   textToRich(), so a Word contract is negotiated as a document rather than as a
   wall of prose.

   Returns a descriptor of the normalised document. It does NOT invent wording:
   a contract with no body yet is reported as such rather than given one. */
function negoIntakePath(c){
  if (window.isUpload && window.isUpload(c)) return 'upload';
  if (c.templateId && window.customTemplates && customTemplates().some(t => t.id === c.templateId)) return 'custom-template';
  if (c.templateId) return 'custom-template';
  if (c.template && window.TEMPLATES && TEMPLATES[c.template]) return 'standard-template';
  return c.template ? 'standard-template' : 'unknown';
}
/* Extracted Word text → a rich document, ONE BLOCK PER LINE.
   docxExtract emits one line per Word paragraph, and a Word paragraph is a
   block, so this mapping is a faithful reading rather than a guess. It is also
   the only mapping that survives being negotiated.

   textToRich() is the general-purpose lift and it is the wrong tool here: it
   splits on BLANK lines, and extracted Word text has none, so a whole contract
   became a single <p> with <br> between the clauses. richToText's projection of
   that still reads correctly — which is why it looked fine — but
   richFromTextEdit's _lineUnits maps every one of those lines to the SAME <p>
   node, so rewriting one line rewrote the paragraph and took the other clauses
   with it. The verification caught the damage and fell back to plain text, so an
   uploaded contract quietly lost its formatting on the first accepted change.

   The first heading line is the document's title (<h1>); later ones are section
   headings (<h2>). docLineKind() decides which lines are headings — the same
   function the clause segmentation uses, so the two cannot disagree about what
   is a term and what is a label. */
function negoRichFromLines(text){
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let seenTitle = false;
  return String(text == null ? '' : text).split('\n').map(line => {
    const t = line.trim();
    if (!t) return '';
    const kind = window.docLineKind ? docLineKind(t) : 'text';
    if (kind !== 'heading') return `<p>${e(t)}</p>`;
    if (!seenTitle){ seenTitle = true; return `<h1>${e(t)}</h1>`; }
    return `<h2>${e(t)}</h2>`;
  }).filter(Boolean).join('');
}
function negoNormalizeDocument(c, opts = {}){
  const path = negoIntakePath(c);
  /* An uploaded document's wording lives in upload.extractedText until someone
     edits it. Lifting it into the rich model here — once, at intake — is what
     lets it be negotiated clause by clause like anything else, and it is the
     one and only place Word's format matters from now on. */
  if (path === 'upload' && c.redlineText == null){
    const text = (c.upload && c.upload.extractedText) || '';
    if (text.trim()){
      c.redlineText = negoRichFromLines(text);
      c.format = window.RICH_FORMAT || 'rich';
    }
  }
  const text = (window.docPlainText ? docPlainText(c) : '') || '';
  negoInit(c, opts);
  return {
    path,
    format: (window.docFormat ? docFormat(c.format) : 'text'),
    rich: !!(window.isRich && isRich(c.format)),
    text,
    body: (c.redlineText != null ? c.redlineText : null),
    clauses: negoClausesOf(text),
    changes: negoChanges(c),
    round: negoRound(c),
    baselineText: negoBaseText(c),
    empty: !text.trim(),
  };
}

if (typeof window !== 'undefined') Object.assign(window, {
  negoClauseKey, negoClausesOf, negoClauses, negoClauseLabel,
  negoInit, negoBaseText, negoRound, negoChanges, negoChangeById, negoPending, negoOpenChanges,
  negoNextId, negoHashInput, negoHash, negoShortHash, negoSummarise,
  negoFileProposal, negoResolvedText, negoCommitText, negoResolve, negoResolveAll,
  negoPostComment, negoTopicFor, negoProgress, negoReadyToSign, negoOpenPoints,
  negoAdvanceRound, negoAllChanges, negoDiffHtml,
  negoIntakePath, negoNormalizeDocument, negoRichFromLines });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  negoClausesOf, negoSummarise, negoHashInput, negoShortHash };
