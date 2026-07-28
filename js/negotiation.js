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
// A CHANGE is one CLAUSE's worth of divergence with a stable identity, anchored
// on a durable clause id that lives in the document itself (js/clausemodel.js).
//
// WHAT CHANGED IN THIS MODULE, AND WHY
//
// Four defects, each recorded in BUGLOG with its before-evidence:
//
//   1. Clause identity was fake. Clauses were found by flattening the rich
//      document to text and re-inferring headings with an all-caps heuristic;
//      the prototype's own six-clause contract came back as FOURTEEN nameless
//      fragments with line-index ids. Identity now comes from the DOM and is
//      ASSIGNED, not derived — see js/clausemodel.js.
//   2. Redlines were re-diffed at render time, so the same change could render
//      differently on different days. The ops are computed once, STORED on the
//      record, and rendered from storage — see js/redline.js.
//   3. The hash covered a change but nothing chained one change to the next.
//      Every hash issuance now carries prevChangeHash and verifyChangeChain()
//      recomputes the whole history from stored content.
//   4. Accepting a change round-tripped the document through plain text
//      (negoResolvedText → richFromTextEdit), which is the mechanism behind the
//      B-004 formatting-loss bug. Acceptance now edits the rich DOM by clause
//      id. There is no lossy step left to guard against.
//
// TWO RULES OUTRANK EVERY FEATURE HERE
//
//   1. Silence rejects. A change nobody decided is NOT in the document. The
//      opposite default — a clause quietly entering an agreement because
//      nobody looked at it — is unrecoverable once signed. So the working
//      document is BUILT from the accepted set rather than mutated in place,
//      and rejecting everything reproduces the baseline exactly. That is now
//      asserted at the canonicalRich level, not merely on a text projection.
//
//   2. Nobody rules on their own ask. Enforced in the model, not in the UI, so
//      no new caller can route around it.

/* ---------- clause reading ----------
   The negotiation reads clauses from js/clausemodel.js and nowhere else. There
   is deliberately no second segmentation in this file: the old one existed
   because the model could not read the document it was given, and having two
   answers to "what is a clause" is how a change comes to be filed against a
   passage nobody is looking at. */
const negoClauseLabel = cl => (window.clauseLabel ? clauseLabel(cl) : '');

/* The rich body a negotiation runs on. A contract that is already rich is used
   as it stands; a plain-text one is lifted to the same shape so that every
   intake path converges here — which is what makes the three paths produce one
   normalised document rather than three that merely look alike. */
function negoBodyOf(c){
  if (window.isRich && isRich(c.format) && c.redlineText) return c.redlineText;
  const text = (window.docPlainText ? docPlainText(c) : '') || '';
  return text.trim() ? negoRichFromLines(text) : '';
}
/* The clauses of the round's baseline — what this round's proposals are
   measured against. */
function negoClauseList(c){
  negoInit(c);
  return window.clauseSegment ? clauseSegment(c.negotiation.baselineBody || '') : [];
}
const negoClauseById = (c, id) => negoClauseList(c).find(cl => cl.clauseId === id) || null;
/* The clauses of the contract's CURRENT working wording. */
const negoClauses = c => (window.clauseSegment ? clauseSegment(negoBodyOf(c)) : []);

/* ---------- the negotiation record ----------
   c.negotiation holds the BASELINE for the round in flight: the wording both
   sides are measuring this round's proposals against. It is a snapshot of the
   document, not a pointer to a version, for the same reason recordWordSent()
   keeps one — a version can be superseded, but what the parties were arguing
   about cannot un-happen.

   The baseline is kept as RICH HTML with clause ids stamped in, so a change can
   be applied to it by id without the document ever passing through plain text.
   baselineText is kept alongside it as the text projection, because the round
   model, the seal and search all read text and none of them should have to
   learn about clauses. */
function negoInit(c, opts = {}){
  c.changes = Array.isArray(c.changes) ? c.changes : [];
  if (!c.negotiation || opts.reset){
    const body = negoStampContract(c);
    c.negotiation = {
      baselineBody: body,
      baselineText: (window.richToText ? richToText(body) : ''),
      baselineFormat: (window.docFormat ? docFormat(c.format) : 'text'),
      round: 1,
      turn: 'owner',
      startedAt: (window.nowISO ? window.nowISO() : new Date().toISOString()),
      seq: 0,
      chainHead: null,
      chainSeq: 0,
      hashV: 2,
    };
  }
  const n = c.negotiation;
  if (typeof n.seq !== 'number') n.seq = 0;
  if (typeof n.round !== 'number') n.round = 1;
  if (typeof n.chainSeq !== 'number') n.chainSeq = 0;
  if (n.chainHead === undefined) n.chainHead = null;
  if (!n.baselineBody) n.baselineBody = negoStampContract(c);
  if (n.baselineText == null) n.baselineText = (window.richToText ? richToText(n.baselineBody) : '');
  return n;
}
/* Stamp durable clause ids into the contract's own body, once, and keep them.
   Writing them back into c.redlineText is the point: the id has to live in the
   document, or it is just another lookaside table that can fall out of step
   with the thing it describes. Idempotent — a second call stamps nothing. */
function negoStampContract(c){
  const body = negoBodyOf(c);
  if (!body.trim()) return '';
  if (!window.clauseStampIds) return body;
  const { html, stamped } = clauseStampIds(body);
  if (stamped && window.isRich && isRich(c.format) && c.redlineText != null) c.redlineText = html;
  return html;
}

const negoBaseText = c => (negoInit(c).baselineText || '');
const negoBaseBody = c => (negoInit(c).baselineBody || '');
const negoRound = c => negoInit(c).round;
const negoChanges = c => { negoInit(c); return c.changes; };
const negoChangeById = (c, id) => negoChanges(c).find(x => x.id === id) || null;
const negoPending = c => negoChanges(c).filter(x => x.status === 'pending');
const negoOpenChanges = c => negoPending(c);

/* A fingerprint id, allocated once per change and never reused — not even
   after a change is deleted, because a fingerprint that comes back meaning
   something else is worse than no fingerprint. Three digits, as #CHG-012.

   The id names the SLOT; the hash names the CONTENT. Revising a pending change
   keeps the id and issues a new hash, so a precise citation is id@hash. */
function negoNextId(c){
  const n = ++negoInit(c).seq;
  return 'CHG-' + String(n).padStart(3, '0');
}

/* ---------- the hash chain ----------
   What a fingerprint attests to: this contract, this clause, this kind of
   change, these exact words before and after, proposed by this party at this
   moment, following THIS predecessor.

   The canonical string is settled here and stamped `hashV: 2` on every record,
   so a future change to it is detectable rather than a silent verification
   failure. Its fields, in order:

     contractRef | clauseId | changeType | oldText | newText
                 | author | createdAt | prevChangeHash

   Two deliberate exclusions. STATUS is not in it — a change's hash must not
   move when it is accepted, rejected, discussed or reopened, or it could not be
   used to verify the thing it names, and "a decision never moves a hash" is an
   invariant this session inherited and has to keep. NUMBER and TITLE are not in
   it either, because they are presentation: renumbering a contract must not
   invalidate its history.

   Whitespace is NOT normalised. The old v1 input collapsed runs of whitespace
   before hashing, which meant a whitespace-only edit hashed identically to no
   edit at all. The ops carry whitespace exactly (js/redline.js), so the hash
   does too.

   prevChangeHash chains each ISSUANCE to the one before it in CREATION order —
   never status order. A revision of a pending change is an issuance like any
   other, so a revised change's new hash chains onto its own prior wording, and
   every earlier wording stays recoverable from the chain. */
const NEGO_HASH_V = 2;
function negoHashInput(contractRef, iss){
  return ['hati-change-v2',
    String(contractRef == null ? '' : contractRef),
    String(iss.clauseId || ''),
    String(iss.changeType || ''),
    String(iss.oldText == null ? '' : iss.oldText),
    String(iss.newText == null ? '' : iss.newText),
    String(iss.author || ''),
    String(iss.createdAt || ''),
    String(iss.prevChangeHash || ''),
  ].join('\n');
}
async function negoHash(contractRef, iss){
  return '0x' + await sha256(negoHashInput(contractRef, iss));
}
/* Take the next link in the chain. The ONLY place a hash is issued, so the
   chain cannot acquire an unlinked member.

   TWO KINDS OF LINK, and the difference is the point:

     · a NEW change chains onto the contract's chain head — the hash issued
       most recently, whatever change it belonged to. That is what puts every
       change in one verifiable creation order.
     · a REVISION of a pending change chains onto THAT CHANGE'S own previous
       hash, not onto the head. A revision is a new wording of an existing ask,
       so its predecessor is the wording it replaced — which is what makes
       "recover this change as it stood two revisions ago" a walk rather than a
       search, and what makes a citation id@hash precise.

   `seq` is stamped on every issuance either way, so creation order survives
   independently of which link was taken, and verifyChangeChain can rebuild
   both expectations from stored content alone. */
async function negoIssue(c, iss, opts = {}){
  const n = negoInit(c);
  negoInvalidateVerification(c);
  iss.prevChangeHash = (opts.revisionOf !== undefined ? opts.revisionOf : n.chainHead) || null;
  iss.seq = ++n.chainSeq;
  iss.hashV = NEGO_HASH_V;
  iss.hash = await negoHash(c.id, iss);
  n.chainHead = iss.hash;
  return iss;
}
/* The abbreviated form the change index shows. The full hash always travels on
   the record and in the title attribute — this is display only. */
const negoShortHash = h => {
  const s = String(h || '');
  return s.length > 20 ? s.slice(0, 10) + '…' + s.slice(-6) : s;
};

/* Every hash issuance this negotiation has ever made, in creation order:
   current wordings, prior revisions of them, and everything archived onto a
   closed round. What verifyChangeChain walks. */
function negoIssuances(c){
  negoInit(c);
  const out = [];
  const take = ch => {
    for (const r of (ch.revisions || [])) out.push({ ...r, id: ch.id, revision: true });
    out.push({ ...ch, revisions: undefined });
  };
  for (const r of (c.negotiation.rounds || [])) for (const ch of (r.changes || [])) take(ch);
  for (const ch of c.changes) take(ch);
  return out.sort((a, b) => (a.seq || 0) - (b.seq || 0));
}
/* ---------- verification ----------
   Recompute every hash from STORED content and check that each links to the one
   before it. This is what makes the prototype's "Verified" pill mean something:
   it rendered unconditionally there, which is the exact fakery the prototype is
   criticised for.

   Reports the FIRST broken link by name rather than a bare false, because
   "something in this history does not verify" is not an actionable statement
   about a legal document. */
async function verifyChangeChain(c){
  negoInit(c);
  const list = negoIssuances(c);
  let prev = null;                       // the hash issued immediately before, in creation order
  const lastOf = new Map();              // and the previous hash of each change's own history
  for (const iss of list){
    if (iss.hashV !== NEGO_HASH_V)
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'unknown-hash-version',
        detail: `#${iss.id} was written under hash format v${iss.hashV || 1}; this build verifies v${NEGO_HASH_V}` };
    /* A revision must follow its own previous wording; anything else must
       follow whatever was issued immediately before it. Rebuilt here from the
       stored records rather than trusted, so a reordered or removed issuance
       shows up as a broken link rather than passing quietly. */
    const isRevision = lastOf.has(iss.id);
    const expectPrev = isRevision ? lastOf.get(iss.id) : prev;
    if ((iss.prevChangeHash || null) !== expectPrev)
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'broken-link',
        detail: isRevision
          ? `#${iss.id} does not follow its own previous wording — a revision is missing from the record`
          : `#${iss.id} does not follow the change before it — the chain was reordered or a link is missing` };
    const expect = await negoHash(c.id, iss);
    if (expect !== iss.hash)
      return { ok: false, checked: list.length, failedAt: iss.id || null, seq: iss.seq || null,
        reason: 'content-altered',
        detail: `#${iss.id} does not match its own fingerprint — the stored wording has been altered since it was filed` };
    prev = iss.hash;
    lastOf.set(iss.id, iss.hash);
  }
  /* Every hash recomputed and every link matched — but on WHAT digest? If
     crypto.subtle was unavailable this whole chain was built and checked with a
     32-bit rolling hash, and "these two weak digests agree" is not evidence
     that the wording is unaltered. Reported as unverifiable, not as verified. */
  if (window.sha256IsReal && !sha256IsReal())
    return { ok: false, checked: list.length, failedAt: null, seq: null,
      reason: 'weak-digest',
      detail: 'This browser has no SHA-256 available (crypto.subtle needs a secure context), '
        + 'so these fingerprints were computed with a weak substitute and cannot be verified. '
        + 'Open this page over https to check the chain.' };
  return { ok: true, checked: list.length, failedAt: null, reason: null,
    detail: list.length ? `${list.length} change record${list.length === 1 ? '' : 's'} verified against their fingerprints`
      : 'nothing filed yet' };
}

/* The verification the "Verified" pill reads.
   verifyChangeChain is async — it hashes — and rendering is not, so the result
   is computed once and cached on the record for the render to read. The cache
   is a TRANSIENT: it is never persisted and never trusted across a change, so a
   stale pass cannot outlive the content it was about. negoRefreshVerification
   is called whenever the change set moves. */
const negoVerifyCached = c => (c && c._chainVerify) || null;
async function negoRefreshVerification(c){
  const v = await verifyChangeChain(c);
  try { Object.defineProperty(c, '_chainVerify', { value: v, writable: true, enumerable: false, configurable: true }); }
  catch (_) { c._chainVerify = v; }
  return v;
}
const negoInvalidateVerification = c => { if (c) c._chainVerify = null; };

/* ---------- summarising a change ----------
   The prototype carries a hand-written line ("Payment terms extended from
   Net-30 to Net-45"), and 2.5 says the proposer writes one. Where they do, it
   is used verbatim and never touched.

   Where they skip it, the MECHANICAL diff stands in: what goes, what arrives,
   quoted from the stored ops so the summary quotes the same fragments the
   reviewer sees highlighted. Prose describing a legal change is never
   generated — a machine-invented "liability was relaxed" on a clause that
   tightened it is worse than no summary at all. */
function negoSummariseOps(changeType, ops, oldText, newText){
  const trim = (s, n) => {
    const t = String(s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  if (changeType === 'insertClause') return 'New clause added — ' + trim(newText, 70);
  if (changeType === 'deleteClause') return 'Clause deleted — ' + trim(oldText, 70);
  const regions = [];
  let cur = null;
  for (const op of (ops || [])){
    if (op.op === 'keep'){ if (cur){ regions.push(cur); cur = null; } continue; }
    cur = cur || { before: '', after: '' };
    if (op.op === 'del') cur.before += op.text; else cur.after += op.text;
  }
  if (cur) regions.push(cur);
  if (!regions.length) return 'Wording changed — ' + trim(newText, 70);
  const parts = regions.slice(0, 2).map(r => {
    const b = trim(r.before, 34), a = trim(r.after, 34);
    if (b && a) return `“${b}” → “${a}”`;
    if (a) return `added “${a}”`;
    return `removed “${b}”`;
  });
  return parts.join('; ') + (regions.length > 2 ? ` (+${regions.length - 2} more)` : '');
}

/* ---------- filing a change ----------
   ONE function files every change, whichever surface produced it: inline
   editing in the working pane, a returned .docx read by docxExtract, wording
   received outside HaTi and filed under their name, or the owner's own
   proposals. Nothing enters the document here — filing records what was
   PROPOSED, and the wording moves only when a change is accepted.

   1.5, the update-in-place rule: a clause carries at most ONE pending change
   per side per round. Re-editing it re-diffs against the round baseline and
   UPDATES the record — same #CHG id, new ops, new hash chained onto the
   previous revision's hash — so every prior wording stays recoverable from the
   chain. Two live proposals on one clause would make "accept both" mean
   nothing coherent, and the second is plainly the one they mean.

   The one case that is NOT a revision: a new wording arriving after the other
   side has already DECIDED. That is not a correction of an outstanding ask, it
   is a counter-proposal to a settled point, and it gets a new id in the next
   round. Quietly folding it into the decided change would rewrite what the
   other side agreed to. */
async function negoFileChange(c, draft, opts = {}){
  negoInit(c);
  const side = opts.side === 'owner' ? 'owner' : 'counterparty';
  const author = String(opts.author || (side === 'owner'
    ? ((window.currentUser && window.currentUser()?.name) || 'This workspace')
    : (c.counterparty || 'The counterparty'))).trim();
  const at = opts.at || (window.nowISO ? window.nowISO() : new Date().toISOString());
  const roundN = opts.roundN != null ? opts.roundN : negoRound(c);

  const oldText = String(draft.oldText == null ? '' : draft.oldText);
  const newText = String(draft.newText == null ? '' : draft.newText);
  const ops = (draft.changeType === 'modify' && window.redlineOps)
    ? redlineOps(oldText, newText)
    : draft.changeType === 'insertClause' ? [{ op: 'ins', text: newText }]
    : [{ op: 'del', text: oldText }];

  /* A no-op produces NO record. Saving a clause you looked at and did not
     change must not file a fingerprint against it — an index full of empty
     changes is an index nobody reads. */
  if (draft.changeType === 'modify' && window.redlineIsNoop && redlineIsNoop(ops)) return null;

  const live = c.changes.find(x => x.clauseId === draft.clauseId
    && x.status === 'pending' && x.authorSide === side && x.roundN === roundN);

  if (live){
    /* A revision: same slot, new content, new link in the chain. The previous
       wording is pushed onto revisions[] with its hash intact, which is what
       makes "recover the wording as it stood two revisions ago" a read rather
       than an archaeology exercise. */
    live.revisions = Array.isArray(live.revisions) ? live.revisions : [];
    live.revisions.push({ seq: live.seq, hash: live.hash, hashV: live.hashV,
      prevChangeHash: live.prevChangeHash, clauseId: live.clauseId, changeType: live.changeType,
      oldText: live.oldText, newText: live.newText, author: live.author,
      createdAt: live.createdAt, ops: live.ops, bodyHtml: live.bodyHtml,
      summary: live.summary });
    live.changeType = draft.changeType;
    live.oldText = oldText;
    live.newText = newText;
    live.bodyHtml = draft.bodyHtml != null ? draft.bodyHtml : live.bodyHtml;
    live.headingText = draft.headingText != null ? draft.headingText : live.headingText;
    live.ops = ops;
    live.createdAt = at;
    live.updatedAt = at;
    live.summary = String(opts.summary || '').trim() || negoSummariseOps(draft.changeType, ops, oldText, newText);
    await negoIssue(c, live, { revisionOf: live.revisions[live.revisions.length - 1].hash });
    if (window.logAudit) logAudit(c, 'Negotiation',
      `#${live.id} revised by ${author} — “${live.summary}” on ${live.clauseLabel || live.clauseId};` +
      ` revision ${live.revisions.length + 1}, fingerprint ${live.hash},` +
      ` chained onto ${negoShortHash(live.prevChangeHash)} — the previous wording remains on the record`);
    return live;
  }

  const cl = negoClauseById(c, draft.clauseId);
  const ch = {
    id: negoNextId(c),
    clauseId: draft.clauseId,
    changeType: draft.changeType,
    oldText, newText,
    bodyHtml: draft.bodyHtml || null,
    headingText: draft.headingText || null,
    afterClauseId: draft.afterClauseId || null,
    ops,
    hash: null, hashV: NEGO_HASH_V, prevChangeHash: null, seq: 0,
    revisions: [],
    status: 'pending',
    author, authorSide: side,
    createdAt: at, updatedAt: at,
    roundN,
    clauseLabel: draft.clauseLabel || negoClauseLabel(cl) || null,
    summary: String(opts.summary || '').trim() || negoSummariseOps(draft.changeType, ops, oldText, newText),
    note: opts.note || null,
    thread: [],
    needsReview: !!draft.needsReview,
    needsReviewWhy: draft.needsReviewWhy || null,
  };
  await negoIssue(c, ch);
  c.changes.push(ch);
  if (window.logAudit && !opts.quiet) logAudit(c, 'Negotiation',
    `#${ch.id} proposed by ${author} in round ${roundN} — “${ch.summary}”` +
    ` on ${ch.clauseLabel || ch.clauseId} · fingerprint ${ch.hash}` +
    `${side === 'counterparty' ? ' (the counterparty\'s wording, recorded in their name)' : ''}` +
    `${opts.via ? ` · received via ${opts.via}` : ''}`);
  return ch;
}

/* ---------- the three change types, as callable edits ---------- */

/* An edit to one clause's body, arriving as RICH content from the editor. The
   comparison is against the ROUND BASELINE, not against the working document,
   so re-editing a clause twice in one turn produces one change measuring the
   whole distance travelled rather than two measuring halves of it. */
async function negoEditClause(c, clauseId, newBodyHtml, opts = {}){
  negoInit(c);
  const cl = negoClauseById(c, clauseId);
  if (!cl) return null;
  const body = window.sanitizeRich ? sanitizeRich(newBodyHtml) : String(newBodyHtml || '');
  const newText = window.richToText ? richToText(body) : '';
  return negoFileChange(c, { clauseId, changeType: 'modify',
    oldText: cl.text, newText, bodyHtml: body, clauseLabel: negoClauseLabel(cl) }, opts);
}
/* A new clause, placed where it was proposed. `afterClauseId` is the clause it
   follows — null puts it at the top. The id is minted at FILING time and
   written into the document when the change is accepted, so a change and the
   clause it creates are the same clause from the first moment either exists. */
async function negoInsertClause(c, afterClauseId, clause, opts = {}){
  negoInit(c);
  const taken = new Set(negoClauseList(c).map(x => x.clauseId).filter(Boolean));
  for (const x of negoChanges(c)) if (x.clauseId) taken.add(x.clauseId);
  const clauseId = window.clauseNewId ? clauseNewId(taken) : ('cl_' + Date.now().toString(36));
  const body = window.sanitizeRich ? sanitizeRich(clause.bodyHtml || '') : String(clause.bodyHtml || '');
  const newText = window.richToText ? richToText(body) : '';
  const headingText = String(clause.headingText || '').trim();
  return negoFileChange(c, { clauseId, changeType: 'insertClause',
    oldText: '', newText, bodyHtml: body, headingText, afterClauseId: afterClauseId || null,
    clauseLabel: headingText ? negoClauseLabel(clauseParseHeading(headingText)) : 'New clause' }, opts);
}
/* A proposed deletion. The wording is NOT removed here and is not removed when
   the change is filed — it is struck through in the working pane and stays in
   the document until someone accepts the deletion. */
async function negoDeleteClause(c, clauseId, opts = {}){
  negoInit(c);
  const cl = negoClauseById(c, clauseId);
  if (!cl) return null;
  return negoFileChange(c, { clauseId, changeType: 'deleteClause',
    oldText: cl.text, newText: '', clauseLabel: negoClauseLabel(cl) }, opts);
}

/* ---------- a whole proposed document becomes changes ----------
   The route a returned .docx and a pasted redraft arrive by. The comparison is
   per clause, keyed on the durable clause id, which gives all three kinds
   honestly: a clause in both whose wording differs is a modify; one only in the
   proposal is an insertClause; one only in the baseline is a deleteClause.

   Matching by id first and by POSITION second is the part worth stating. A
   document that has been through Word has no clause ids on it — Word does not
   carry our attributes — so the returned text is aligned to the baseline
   clause by clause in document order, and a clause whose wording moved is
   still recognised as the same clause. That is the honest reading of what a
   counterparty who edited our file actually did. */
async function negoFileProposal(c, proposedText, opts = {}){
  negoInit(c);
  const next = String(proposedText == null ? '' : proposedText);
  if (!next.trim()) return [];
  /* Did the proposal arrive as a DOCUMENT or as a text projection? A returned
     .docx and a pasted redraft arrive as text, and text has no list structure
     in it — so a proposal lifted from text must be merged back into the
     baseline clause's own markup rather than used as-is, or accepting it would
     replace an <ol start="3"> with a flat <p> and silently lose the document's
     numbering. That is the B-004 failure class, and this is where it would
     otherwise re-enter through the whole-document route. */
  const fromText = !/<[a-z]/i.test(next);
  const proposedBody = fromText ? negoProposedBodyFromText(c, next) : next;
  const baseClauses = negoClauseList(c);
  const nextClauses = window.clauseSegment ? clauseSegment(proposedBody) : [];
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  const byId = new Map();
  for (const cl of nextClauses) if (cl.clauseId) byId.set(cl.clauseId, cl);
  /* Clauses the returned document could not be matched to by id, in order —
     the Word case. */
  const loose = nextClauses.filter(cl => !cl.clauseId || !baseClauses.some(b => b.clauseId === cl.clauseId));
  const usedLoose = new Set();

  const filed = [];
  const matchedBase = new Set();
  for (let i = 0; i < baseClauses.length; i++){
    const was = baseClauses[i];
    let now = byId.get(was.clauseId) || null;
    if (!now){
      /* fall back to position among the unmatched, which is how a Word round
         trip has to be read: same slot, possibly reworded */
      const cand = loose[i] !== undefined && !usedLoose.has(i) ? loose[i] : null;
      if (cand){ now = cand; usedLoose.add(i); }
    }
    if (!now) continue;
    matchedBase.add(was.clauseId);
    if (norm(was.text) === norm(now.text)) continue;
    const ch = await negoFileChange(c, { clauseId: was.clauseId, changeType: 'modify',
      oldText: was.text, newText: now.text,
      bodyHtml: fromText ? negoBodyFromText(was.bodyHtml, now.text) : now.bodyHtml,
      clauseLabel: negoClauseLabel(was) },
      { ...opts, note: negoNoteFor(opts.notes, now.text, was.clauseId) || opts.note || null, quiet: true });
    if (ch) filed.push(ch);
  }
  for (let i = 0; i < loose.length; i++){
    if (usedLoose.has(i)) continue;
    const cl = loose[i];
    if (!cl.text.trim()) continue;
    const after = baseClauses[Math.min(i, baseClauses.length) - 1] || null;
    const ch = await negoInsertClause(c, after ? after.clauseId : null,
      { headingText: cl.headingText, bodyHtml: cl.bodyHtml }, { ...opts, quiet: true });
    if (ch) filed.push(ch);
  }
  for (const was of baseClauses){
    if (matchedBase.has(was.clauseId)) continue;
    const ch = await negoDeleteClause(c, was.clauseId, { ...opts, quiet: true });
    if (ch) filed.push(ch);
  }

  if (filed.length && window.logAudit){
    const side = opts.side === 'owner' ? 'owner' : 'counterparty';
    const author = String(opts.author || (side === 'owner'
      ? ((window.currentUser && window.currentUser()?.name) || 'This workspace')
      : (c.counterparty || 'The counterparty'))).trim();
    logAudit(c, 'Negotiation',
      `${filed.length} change${filed.length === 1 ? '' : 's'} proposed by ${author}` +
      ` in round ${negoRound(c)} — ${filed.map(x => '#' + x.id).join(', ')}` +
      `${side === 'counterparty' ? ' (the counterparty\'s wording, recorded in their name)' : ''}` +
      `${opts.via ? ` · received via ${opts.via}` : ''}`);
  }
  return filed;
}

/* A proposal that arrived as TEXT, lifted back into a document.

   THIS IS THE FIX FOR THE PHANTOM-CHANGE BUG (B-010). It matters which way the
   lift is done, and the obvious way is wrong.

   negoRichFromLines() builds a document from nothing but the lines, and it has
   to decide what is a heading from the text alone — so it promotes any line in
   CAPITALS. In a real contract the signature block and the schedule titles are
   in capitals on their own lines:

       BUYER: SUPPLIER:
       SCHEDULE A: MATERIAL SPECIFICATIONS

   In the SOURCE document those are paragraphs inside the miscellaneous clause.
   Lifted from text they become HEADINGS, which opens clauses the baseline does
   not have — so the clause they were sitting in appears truncated (a phantom
   deletion) and each promoted line appears as a brand-new clause (a phantom
   insertion). Opening a contract and touching nothing produced a screen full of
   changes nobody had made.

   The baseline is right there and already knows the answer. richFromTextEdit()
   maps the new lines onto the baseline's OWN block structure — a paragraph
   stays a paragraph, a list item stays a list item — and verifies its own
   output before returning it. So the proposal is segmented exactly as the
   baseline is, and only wording that genuinely moved can register as a change.

   negoRichFromLines stays as the fallback for the one case it is right for: a
   document that has no prior structure to preserve, either because there is no
   baseline yet or because the edit changed the shape so much that the mapping
   could not be verified. */
function negoProposedBodyFromText(c, text){
  const base = negoBaseBody(c);
  if (base && base.trim() && window.richFromTextEdit){
    const merged = richFromTextEdit(base, text);
    if (merged) return merged;
  }
  return negoRichFromLines(text);
}

/* The reason a counterparty gave for ONE clause, matched to the change filed
   for that clause. Keyed on the wording they annotated — a reply composed
   against a text projection carries no clause ids — with the clause id accepted
   too, for callers that do have one. Substring matching is allowed in one
   direction only: a note written about a whole clause still belongs to it when
   the clause is one line of a longer block. */
function negoNoteFor(notes, text, clauseId){
  if (!notes) return null;
  if (clauseId && notes[clauseId]) return notes[clauseId];
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const want = norm(text);
  if (!want) return null;
  if (notes[want]) return notes[want];
  for (const k of Object.keys(notes)){
    const kk = norm(k);
    if (kk && (want.includes(kk) || kk.includes(want))) return notes[k];
  }
  return null;
}

/* Put edited TEXT back into a clause's own markup.
   richFromTextEdit() maps the new lines onto the existing block structure and
   VERIFIES its own output's text projection against what was asked for; it
   returns null rather than guess. Where it can do the job, the clause keeps its
   list, its numbering and its inline marks. Where it cannot, the clause falls
   back to paragraphs — and only that clause, not the document. */
function negoBodyFromText(oldBodyHtml, newText){
  if (window.richFromTextEdit && oldBodyHtml){
    const merged = richFromTextEdit(oldBodyHtml, newText);
    if (merged) return merged;
  }
  return String(newText || '').split('\n').filter(l => l.trim())
    .map(l => `<p>${_negoEsc(l.trim())}</p>`).join('');
}

/* ---------- the working document ----------
   negoResolvedBody BUILDS the document from the accepted set. It does not
   mutate a document and hope: rejecting every change reproduces the baseline
   exactly, and because this works on the rich DOM that equality holds at the
   canonicalRich level rather than only on a text projection.

   A PENDING change is not in the document. It is drawn as a redline over it
   (from the STORED ops) so the reviewer sees what is being asked for, but the
   words are still the baseline's until someone says yes.

   Order is deliberate. Modifications first, then insertions, then deletions:
   an insertion anchored on a clause that is also being deleted still lands in
   the position it was proposed for, rather than falling off the end of the
   document because its anchor evaporated. */
function negoResolvedBody(c){ return negoBuildBody(c, x => x.status === 'accepted'); }
/* ---------- the document as it would read if everything were agreed ----------
   THE SAME BUILDER, over the accepted set PLUS the pending one.

   Reading a redline and reading a contract are two different acts, and the room
   only supported the first. Every screen in it draws what is being asked for —
   struck-through wording, inserted wording, a fingerprint in the margin — which
   is exactly right for deciding a change and exactly wrong for the question
   everybody asks next: what does this actually say if we agree to all of it?
   Answering it meant accepting every change to see, which is a decision, not a
   look.

   So this is a READ and nothing else: it builds a document, writes nothing, and
   the changes stay pending. A refused ask is not in it — silence still rejects,
   and a rejected change is settled, not outstanding.

   Withdrawn asks are excluded for the same reason: the side that made them has
   taken them off the table, so a document that assumed them would be assuming
   agreement to wording nobody is asking for any more. */
function negoCleanBody(c){
  return negoBuildBody(c, x => x.status === 'accepted'
    || (x.status === 'pending' && !x.withdrawn));
}
const negoCleanText = c => (window.richToText ? richToText(negoCleanBody(c)) : '');
function negoBuildBody(c, take){
  negoInit(c);
  let body = negoBaseBody(c);
  if (!window.clauseReplaceBody) return body;
  const accepted = negoChanges(c).filter(x => x.status !== 'superseded' && take(x))
    .slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));

  for (const ch of accepted){
    if (ch.changeType !== 'modify') continue;
    const next = clauseReplaceBody(body, ch.clauseId, ch.bodyHtml || `<p>${_negoEsc(ch.newText)}</p>`);
    if (next != null) body = next;
  }
  for (const ch of accepted){
    if (ch.changeType !== 'insertClause') continue;
    const has = clauseSegment(body).some(cl => cl.clauseId === ch.clauseId);
    if (has) continue;
    let out = clauseInsert(body, ch.afterClauseId, { clauseId: ch.clauseId,
      headingText: ch.headingText || '', bodyHtml: ch.bodyHtml || `<p>${_negoEsc(ch.newText)}</p>` });
    if (!out){
      /* The clause it was to follow is gone — accepted for deletion in an
         earlier round, most likely. It goes to the end of the document and the
         record says so, rather than being dropped for want of an anchor. */
      const last = clauseSegment(body).slice(-1)[0];
      out = clauseInsert(body, last ? last.clauseId : null, { clauseId: ch.clauseId,
        headingText: ch.headingText || '', bodyHtml: ch.bodyHtml || `<p>${_negoEsc(ch.newText)}</p>` });
    }
    if (out) body = out.html;
  }
  for (const ch of accepted){
    if (ch.changeType !== 'deleteClause') continue;
    const next = clauseRemove(body, ch.clauseId);
    if (next != null) body = next;
  }
  return body;
}
const _negoEsc = s => String(s == null ? '' : s).replace(/[&<>]/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
/* The text projection of the resolved document. Kept because the round model,
   the seal, search and the Copilot all read text — but it is now a READ of the
   rich document rather than the medium the document travels through. */
const negoResolvedText = c => (window.richToText ? richToText(negoResolvedBody(c)) : '');

/* Write the resolved document back into the contract.
   THIS IS 1.6, AND IT IS THE POINT. A rich contract is written as rich: the
   clause's body blocks were replaced in place, by id, on the DOM. There is no
   text round trip, so richFromTextEdit is never called, so the B-004
   formatting-loss failure class cannot occur — it is retired rather than
   guarded against. A plain-text contract is written as text, exactly as
   before. */
function negoCommitBody(c, body){
  const wasRich = !!(window.isRich && isRich(c.format) && c.redlineText != null);
  const text = window.richToText ? richToText(body) : '';
  if (wasRich){
    c.redlineText = window.sanitizeRich ? sanitizeRich(body) : body;
  } else {
    c.redlineText = text;
  }
  if (c.upload && window.isUpload && window.isUpload(c)){
    c.upload.extractedText = text;
    c.upload.textChars = text.length;
  }
  return { flattened: false, text };
}
/* Kept for callers that still speak text (js/wordflow.js, the round model). */
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
  if (c.upload && window.isUpload && window.isUpload(c)){
    c.upload.extractedText = text;
    c.upload.textChars = text.length;
  }
  return { flattened };
}

/* ---------- deciding a change ----------
   Accept merges that one clause into the document. Reject leaves the clause at
   the baseline and the ask becomes an open point. Reopen puts it back to
   pending. All three are reversible, all three are recorded with the RIGHT
   author — the person deciding is not the person who proposed — and none of
   them moves a hash. */
function negoResolve(c, id, status, opts = {}){
  negoInit(c);
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  if (!['pending', 'accepted', 'rejected'].includes(status)) return null;
  /* Read the permission through `window` deliberately, not as a bare call.
     js/core.js declares `const canEdit = …`, which is a LEXICAL binding rather
     than a property of the global object — so a bare `canEdit()` here resolves
     to that binding and cannot be substituted, while `window.canEdit` is the
     name every other module reaches this function by. */
  if (!opts.side && typeof window.canEdit === 'function' && !window.canEdit()){
    if (window.toast) toast('Viewers cannot decide changes', 'err');
    return null;
  }
  /* NOBODY RULES ON THEIR OWN ASK. Enforced here, in the model, and not only in
     the UI — a side that could accept its own proposal could adopt wording the
     other party never saw. */
  if (opts.side && opts.side === ch.authorSide && status !== 'pending'){
    if (window.toast) toast('You cannot decide your own proposal', 'err');
    return null;
  }
  if (c.status === 'Signed' || (window.wordDoorClosed && wordDoorClosed(c))){
    if (window.toast) toast('This contract is executed — record an amendment instead', 'err');
    return null;
  }
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  const prev = ch.status;
  if (prev === status) return ch;

  negoInvalidateVerification(c);
  ch.status = status;
  /* A withdrawal answers ONE rejection. Rule on the change again — reopen it,
     accept it, refuse it afresh — and the acknowledgement is about a decision
     that no longer stands, so it goes with it. Leaving it would let a stale
     withdrawal report the parties as aligned over a live disagreement. */
  if (ch.withdrawn) ch.withdrawn = null;
  ch.resolvedBy = status === 'pending' ? null : who;
  ch.resolvedAt = status === 'pending' ? null : (window.nowISO ? window.nowISO() : new Date().toISOString());
  ch.reply = String(opts.reply || ch.reply || '').slice(0, 2000) || null;

  negoCommitBody(c, negoResolvedBody(c));

  const verb = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'reopened';
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} ${verb} by ${who} — “${ch.summary}” on ${ch.clauseLabel || ch.clauseId},` +
    ` proposed by ${ch.author}` +
    `${status === 'accepted' ? ` · merged into the clean text · fingerprint ${ch.hash}` : ''}` +
    `${status === 'rejected' ? ' · the clause stays at the baseline and the ask travels back as an open point' : ''}` +
    `${status === 'pending' ? ` (was ${prev})` : ''}`);
  if (window.captureVersion && status !== 'pending')
    captureVersion(c, `#${ch.id} ${verb} — ${ch.clauseLabel || ch.clauseId}`, who, { auto: true });
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

/* ---------- withdrawing an ask ----------
   THE DEADLOCK THIS EXISTS TO BREAK.

   "Ready to sign" is gated on the parties being aligned, and a rejected change
   is not agreement — it is one side asking for something and the other side
   saying no. If "aligned" meant only "nothing pending", a refusal would count
   as settled and the button would go green over a live disagreement. If it
   meant "everything accepted", a single refusal would block signature forever
   and neither party could ever get out, which is worse than the bug it fixes.

   So a rejected change is settled when THE PARTY WHO ASKED accepts the refusal
   and takes the ask off the table. That is this verb. It is an acknowledgement,
   not a second rejection: the change keeps its status, its author, its
   fingerprint and its reply, and the record still reads "proposed, refused,
   and the proposer let it go" rather than pretending the ask never happened.

   Only the proposer may press it. A side that could withdraw the OTHER side's
   ask could clear the board of every objection raised against its own wording
   and then report the deal as aligned — the same class of thing negoResolve's
   "nobody rules on their own ask" rule exists to prevent, in the other
   direction. */
function negoWithdraw(c, id, opts = {}){
  negoInit(c);
  const ch = negoChangeById(c, id);
  if (!ch) return null;
  if (ch.status !== 'rejected'){
    if (window.toast) toast('Only a refused ask can be withdrawn', 'err');
    return null;
  }
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (side !== ch.authorSide){
    if (window.toast) toast('Only the side that asked for this can withdraw it', 'err');
    return null;
  }
  if (ch.withdrawn) return ch;                    // idempotent; pressing twice is not two events
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  ch.withdrawn = { by: who, side, at: (window.nowISO ? window.nowISO() : new Date().toISOString()) };
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} withdrawn by ${who} — “${ch.summary}” was refused and the side that asked for it has`
    + ` accepted the refusal; the point is no longer outstanding between the parties`);
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return ch;
}
/* Put a withdrawn ask back on the table. The counterpart to the verb above, for
   the same reason every other decision on this screen is reversible: a control
   that cannot be undone is one people are afraid to press. */
function negoUnwithdraw(c, id, opts = {}){
  const ch = negoChangeById(c, id);
  if (!ch || !ch.withdrawn) return null;
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (side !== ch.authorSide) return null;
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  ch.withdrawn = null;
  if (window.logAudit) logAudit(c, 'Negotiation',
    `#${ch.id} put back on the table by ${who} — the withdrawal was undone and the refused ask is outstanding again`);
  return ch;
}

/* ---------- talking about a change ----------
   The light channel, attached to one fingerprint. It opens no round, captures
   no version and moves no wording — the same guarantee js/discuss.js makes for
   a clause, made for a change.

   Each comment is stamped with the hash CURRENT WHEN IT WAS WRITTEN. A thread
   outlives the wording it is about: revise a pending change and yesterday's
   objection may be about text that no longer exists. Stamping lets the thread
   say so ("written against an earlier revision") instead of silently
   presenting an old argument as if it were about today's words. */
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
    text: body.slice(0, 2000), atHash: ch.hash || null };
  ch.thread.push(msg);
  if (window.logAudit) logAudit(c, 'Negotiation',
    `Comment posted on #${ch.id} by ${who} — the contract is unchanged and no round was opened`);
  return msg;
}
/* Is this comment about wording that has since been revised? A read, never a
   stored flag, so it cannot disagree with the change it describes. */
const negoCommentIsStale = (ch, msg) => !!(ch && msg && msg.atHash && ch.hash && msg.atHash !== ch.hash);
/* The topic key a change's thread shares with js/discuss.js. */
const negoTopicFor = ch => ch ? ('change:' + ch.id) : null;

/* ---------- ONE THREAD PER CHANGE, OUT OF TWO STORES ----------

   A comment on a fingerprint has always had two places to live, and each side
   was reading only one of them.

     ch.thread          — written by negoPostComment, onto the contract record
                          the screen is reading. The owner's record IS the
                          contract, so their own comments landed here and stayed.
     share_messages     — the discussion channel, keyed by topic. The
                          counterparty's copy of the contract is assembled from
                          a share payload and thrown away on the next repaint,
                          so their replies cannot be written to it and go here
                          instead, under topic `change:<id>`.

   The card rendered ch.thread and nothing else. So the owner asked for input on
   a change, the counterparty answered, the answer was filed — correctly, and
   visibly in the discussion panel — and the card that asked the question showed
   no reply at all. Each side could see its own half of a conversation and
   neither could see the other's.

   This is the read that puts them back together. It merges, it does not move
   anything: both stores keep exactly what they held, and the ordering is by
   time so an exchange reads in the order it happened.

   Identical text from the same side in both stores is ONE message, not two —
   the owner's comments are written to the thread and posted to the channel, so
   without this every one of them would appear twice on their own screen. */
function negoThreadOf(c, ch){
  const own = (ch && Array.isArray(ch.thread)) ? ch.thread : [];
  const all = (c && Array.isArray(c._messages)) ? c._messages : [];
  if (!ch || !all.length) return own;
  const topic = negoTopicFor(ch);
  const key = m => `${m.side || ''}|${String(m.text || '').replace(/\s+/g, ' ').trim()}`;
  const have = new Set(own.map(key));
  const extra = [];
  for (const m of all){
    if (!m || String(m.topic || '') !== topic) continue;
    const one = { who: m.author, side: m.side, at: m.at, text: m.body, atHash: null };
    if (have.has(key(one))) continue;
    have.add(key(one));
    extra.push(one);
  }
  if (!extra.length) return own;
  return own.concat(extra)
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
}

/* ---------- progress, and the one transition out ---------- */
function negoProgress(c){
  const live = negoChanges(c).filter(x => x.status !== 'superseded');
  const total = live.length;
  const done = live.filter(x => x.status !== 'pending').length;
  return { total, done, pending: total - done,
    pct: total ? Math.round((done / total) * 100) : 0 };
}
/* Ready to sign means every change on the table has an answer and there is at
   least one thing that was actually negotiated. It is a READ of the change set,
   never a stored flag — a flag could disagree with the changes it claims to
   summarise, and on this screen that disagreement would be an invitation to
   sign something nobody had finished arguing about. */
function negoReadyToSign(c){
  const p = negoProgress(c);
  return p.total > 0 && p.pending === 0;
}
/* ---------- are the parties actually aligned? ----------
   What gates "Ready to sign", and a stricter question than negoReadyToSign
   above. That one asks whether every change has AN ANSWER, which is the right
   question for "is this round finished". This one asks whether the answers
   amount to AGREEMENT, which is the only honest basis for telling someone a
   contract is ready to be signed.

   The two differ on exactly one case, and it is the case that matters: a
   refused ask. It has an answer, so the round is finished; it is not agreement,
   so the deal is not. It stops being outstanding when the side that asked for
   it withdraws it — see negoWithdraw.

     pending                       → outstanding: nobody has answered
     rejected, not withdrawn       → contested: answered, and the answer was no
     rejected, withdrawn           → settled: the asker let it go
     accepted                      → settled: it is in the wording

   A contract with no changes at all is aligned. There is nothing to disagree
   about, and a first-draft contract sent out clean is the commonest signing
   case there is — refusing to call that aligned would gate the button on a
   negotiation that never happened.

   A READ of the change set, never a stored flag, for the same reason
   negoReadyToSign is: a flag could disagree with the changes it claims to
   summarise, and on this button that disagreement is an invitation to sign
   something nobody had finished arguing about. */
function negoAlignment(c){
  /* Reads c.changes DIRECTLY rather than through negoChanges, which calls
     negoInit and would create a negotiation record — and stamp clause ids into
     the document — on any contract merely asked the question. The dashboard
     asks it of every contract in the portfolio, most of them loaded as
     summaries with their bodies stripped, and a read must not write. */
  const live = (Array.isArray(c && c.changes) ? c.changes : []).filter(x => x && x.status !== 'superseded');
  const pending = live.filter(x => x.status === 'pending');
  const contested = live.filter(x => x.status === 'rejected' && !x.withdrawn);
  return { aligned: !pending.length && !contested.length,
    total: live.length, pending, contested,
    outstanding: pending.concat(contested) };
}
/* What is stopping this, in words, for the disabled button to say. Never
   "not ready yet": a control that refuses without saying why teaches nothing,
   and the reader is the one person who can clear it. */
function negoAlignmentWhy(c, side){
  const a = negoAlignment(c);
  if (a.aligned) return '';
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const bits = [];
  if (a.pending.length)
    bits.push(`${a.pending.length} change${a.pending.length === 1 ? '' : 's'} still waiting on a decision`);
  if (a.contested.length){
    const mine = a.contested.filter(x => x.authorSide === me).length;
    const theirs = a.contested.length - mine;
    if (mine) bits.push(`${mine} of your asks refused — withdraw ${mine === 1 ? 'it' : 'them'} or keep negotiating`);
    if (theirs) bits.push(`${theirs} refused ask${theirs === 1 ? '' : 's'} the other side has not withdrawn`);
  }
  return bits.join(' · ');
}

/* ---------- signalling readiness ----------
   A SIGNAL, NEVER AN INFERENCE. The old rule read the change set and decided
   for the reader that they were ready — resolve the last change and the link
   silently became a signature request. Nobody said they were ready; the
   arithmetic said it for them.

   So readiness is a thing a person does, recorded with who did it, when, and
   which side they were on. The gate above decides whether they MAY press it;
   pressing it is still theirs. It changes no wording, opens no round and signs
   nothing — it tells the other side the deal is done being argued about, and
   the other side is the one who issues the signing link. */
function negoSignalReady(c, opts = {}){
  negoInit(c);
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const a = negoAlignment(c);
  if (!a.aligned){
    if (window.toast) toast('Not everything is settled yet — ' + negoAlignmentWhy(c, side), 'err');
    return null;
  }
  const who = String(opts.by || (window.currentUser && window.currentUser()?.name)
    || (side === 'counterparty' ? (c.counterparty || 'The counterparty') : 'This workspace'));
  const n = c.negotiation;
  n.ready = (n.ready && typeof n.ready === 'object') ? n.ready : {};
  const sig = { by: who, side, at: opts.at || (window.nowISO ? window.nowISO() : new Date().toISOString()),
    email: opts.email || null, round: n.round || 1,
    changes: a.total, accepted: negoChanges(c).filter(x => x.status === 'accepted').length,
    withdrawn: negoChanges(c).filter(x => x.withdrawn).length };
  n.ready[side] = sig;
  if (window.logAudit) logAudit(c, 'Ready to sign',
    `${who} signalled that ${side === 'counterparty' ? 'the counterparty' : 'this workspace'} is ready to sign`
    + ` — round ${sig.round}, ${sig.changes} change${sig.changes === 1 ? '' : 's'} settled`
    + `${sig.accepted ? ` (${sig.accepted} adopted into the wording)` : ''}`
    + `${sig.withdrawn ? `, ${sig.withdrawn} ask${sig.withdrawn === 1 ? '' : 's'} withdrawn` : ''}`
    + '. Nothing has been signed — a signing link has still to be issued.');
  c.lastAction = window.todayStr ? window.todayStr() : c.lastAction;
  return sig;
}
/* Who has signalled, read back. `null` rather than a made-up default, so a
   caller cannot mistake "nobody has said so" for "they said no".

   `stale` is COMPUTED, never stored. A readiness signal describes a change set
   at a moment: everything settled, nothing contested. Propose a new ask after
   it, reopen a decided one, or refuse something afresh, and the signal is still
   a true record of what was said and no longer a true description of where the
   deal stands. Deleting it would erase the fact that it was given; leaving it
   unqualified would have the owner issue a signing link for a contract that had
   gone back into negotiation. So it is kept, and marked. */
const negoReadySignal = (c, side) => {
  const n = (c && c.negotiation && c.negotiation.ready) || null;
  if (!n) return null;
  const sig = n[side === 'counterparty' ? 'counterparty' : 'owner'] || null;
  if (!sig) return null;
  return { ...sig, stale: !negoAlignment(c).aligned };
};
/* Points the counterparty raised that were refused, and are therefore still
   live between the parties. A rejected change that simply vanishes from the
   document reads as agreement, and it is not.

   Two things this has to get right, and openPointsFor() in js/versioning.js
   already worked both out for the round model — the reasoning is the same here
   and is deliberately not re-derived:

     · It spans EVERY round, not the one in flight. A refusal in round 1 is
       still a refusal in round 5.
     · A point stops being open in TWO ways: the wording they asked for is in
       the document anyway (they got it, by whatever route), or the wording it
       was measured AGAINST is gone (the clause has been renegotiated since, so
       the old ask is about a passage that no longer exists). */
function negoOpenPoints(c){
  const live = String((window.docPlainText ? docPlainText(c) : '') || '').replace(/\s+/g, ' ');
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const x of negoAllChanges(c)){
    if (x.status !== 'rejected' || x.authorSide !== 'counterparty') continue;
    /* A withdrawn ask is not an open point. They asked, we said no, and they
       accepted that — listing it as still live between the parties would
       contradict the acknowledgement they gave. */
    if (x.withdrawn) continue;
    const want = norm(x.newText), had = norm(x.oldText);
    if (want && live.includes(want)) continue;      // they got it in the end
    if (had && !live.includes(had)) continue;       // the clause has moved on since
    out.push({ id: x.id, clauseId: x.clauseId, clauseLabel: x.clauseLabel || null,
      round: x.roundN || null, before: x.oldText, after: x.newText,
      ask: x.note || null, reason: x.reply || null, by: x.author, at: x.resolvedAt || null });
  }
  return out;
}

/* ---------- what changed, as a summary a person can read ----------
   What the Share dialog puts in front of the sender before it sends anything,
   and what travels to the counterparty alongside the link.

   Every line is QUOTED FROM THE RECORD, never composed. A change's summary is
   either the sentence the proposer typed or the mechanical "what goes → what
   arrives" built from its stored ops — the same text the change index shows.
   Machine-written prose about a legal change ("liability was relaxed") is the
   one thing this must not produce, because a reader would act on it.

   Only changes still on the table are listed. A decided change is history, and
   history is what the version list is for. */
function negoChangeSummary(c){
  negoInit(c);
  const live = negoChanges(c).filter(x => x.status !== 'superseded');
  const label = ch => ch.clauseLabel || ch.clauseId || 'this contract';
  const kind = ch => ch.changeType === 'insertClause' ? 'New clause'
    : ch.changeType === 'deleteClause' ? 'Deletion' : 'Amended';
  const lines = live.map(ch => ({
    id: ch.id, status: ch.status, changeType: ch.changeType,
    clause: label(ch), kind: kind(ch), summary: ch.summary || '',
    author: ch.author, mine: ch.authorSide === 'owner',
    text: `#${ch.id} · ${label(ch)} — ${ch.summary || kind(ch)}`,
  }));
  const pending = lines.filter(x => x.status === 'pending').length;
  const accepted = lines.filter(x => x.status === 'accepted').length;
  const rejected = lines.filter(x => x.status === 'rejected').length;
  return {
    round: negoRound(c),
    total: lines.length, pending, accepted, rejected,
    lines,
    /* The plain-text form that goes into an email body. Built here rather than
       at the send site so the dialog and the message cannot disagree about what
       was said to have changed. */
    text: lines.length
      ? `Round ${negoRound(c)} — ${lines.length} change${lines.length === 1 ? '' : 's'} on the table`
        + `${pending ? `, ${pending} awaiting a decision` : ''}:\n`
        + lines.map(x => `  • ${x.text}`).join('\n')
      : `Round ${negoRound(c)} — no changes have been proposed yet. The document is as it stands.`,
  };
}

/* ---------- what Copilot is told about this page ----------
   The room opens HaTi's OWN Copilot panel — same markup, same behaviour, same
   engine — so nothing here builds a chat surface. What it builds is the
   CONTEXT: this contract, this round, these clauses, these changes, so an
   answer is about the negotiation on the screen rather than about contracts in
   general. js/ai.js merges it in aiChatContext() when the room is open.

   Nothing here edits the document, and nothing downstream can: the context is a
   read. A suggestion is text a person reads and may then act on, and acting on
   it goes through negoEditClause like any other edit, filed in that person's
   name. A machine quietly altering a legal instrument is the failure this
   module exists to prevent.

 Capped, because a schedule can be
   thousands of words and a request that never returns is worse than one that
   answers from slightly less. The changes are the part that matters and they
   are sent in full. */
const NEGO_CTX_CHARS = 24000;
function negoCopilotContext(c){
  negoInit(c);
  const clip = (s, n) => { const t = String(s || ''); return t.length > n ? t.slice(0, n) + '…[truncated]' : t; };
  return {
    surface: 'negotiation-room',
    contractId: c.id || null,
    name: c.name || null,
    counterparty: c.counterparty || null,
    round: negoRound(c),
    turn: negoTurn(c),
    readyToSign: negoReadyToSign(c),
    clauses: negoClauseList(c).map(cl => ({ id: cl.clauseId, label: negoClauseLabel(cl),
      text: clip(cl.text, 2000) })),
    changes: negoChanges(c).filter(x => x.status !== 'superseded').map(ch => ({
      id: ch.id, clause: ch.clauseLabel || ch.clauseId, type: ch.changeType,
      status: ch.status, summary: ch.summary, author: ch.author,
      currentWording: clip(ch.oldText, 1200), proposedWording: clip(ch.newText, 1200) })),
    workingText: clip(negoResolvedText(c), NEGO_CTX_CHARS),
  };
}

/* The negotiation record, reduced to what an ANSWER can be built from.

   This is the twin of copilotNegotiation() in server/server.js. There are two
   because the server is a standalone Node process that loads none of these
   modules, and the browser-direct (BYOK) Copilot never reaches the server at
   all — so both engines have to be able to describe a negotiation, and they
   have to describe it the SAME way or an answer would depend on which brain
   happened to be configured. f47 asserts the two field sets match exactly;
   that test is the thing keeping them honest.

   Every field is a READ of what the parties actually did. Nothing here is an
   opinion about the contract: Copilot reports the record and the judgement
   stays with the reader. */
const NEGO_COPILOT_CAP = 60;
function negoCopilotRecord(c){
  const n = c && c.negotiation;
  const live = Array.isArray(c && c.changes) ? c.changes.filter(x => x && x.status !== 'superseded') : [];
  const rounds = (n && Array.isArray(n.rounds)) ? n.rounds : [];
  const archived = rounds.reduce((acc, r) =>
    acc.concat((r.changes || []).map(x => ({ ...x, roundN: r.n }))), []);
  const all = archived.concat(live);
  if (!n && !all.length) return { active: false, changes: [] };

  const clip = (v, k) => { const t = String(v || ''); return t.length > k ? t.slice(0, k) + '…' : t; };
  const one = x => ({
    id: x.id, round: x.roundN || null, clause: x.clauseLabel || x.clauseId || '',
    type: x.changeType || x.type || 'modify', status: x.status || 'pending',
    proposedBy: x.author || '', side: x.authorSide || '',
    summary: clip(x.summary, 200),
    decidedBy: x.resolvedBy || null, decidedAt: x.resolvedAt || null,
    reasonGiven: clip(x.reply || x.note || '', 300) || null,
    currentWording: clip(x.oldText, 600), proposedWording: clip(x.newText, 600),
  });
  const byStatus = k => all.filter(x => (x.status || 'pending') === k).length;
  const versions = Array.isArray(c.versions) ? c.versions : [];
  return {
    active: true,
    round: (n && n.round) || 1,
    turn: (n && n.turn) || 'owner',
    roundsClosed: rounds.length,
    totalChanges: all.length,
    pending: byStatus('pending'), accepted: byStatus('accepted'), rejected: byStatus('rejected'),
    readyToSign: all.length > 0 && byStatus('pending') === 0,
    /* Newest first, so a cap drops the oldest rather than the freshest — and
       the count of what was dropped travels, so a truncated list can never be
       mistaken for a complete one. */
    changes: all.slice(-NEGO_COPILOT_CAP).reverse().map(one),
    changesOmitted: Math.max(0, all.length - NEGO_COPILOT_CAP),
    versionCount: versions.length,
    versions: versions.slice(-20).reverse().map(v => ({ n: v.n, at: v.at || null,
      by: v.by || '', label: clip(v.label, 120) })),
  };
}

/* ---------- looking at any two versions ----------
   The two panes were fixed: this round's baseline on the left, this round's
   working copy on the right. That is the right default and it is not the only
   question people have. "What did this clause say before we conceded it in
   round 2" is answerable from the version list, and was not reachable.

   Every snapshot the contract carries is offered — the live pair plus every
   captureVersion() record — and any two can be put side by side.

   ONE RULE governs what happens then, and it is the reason this is not simply
   a rendering change: a comparison of two OLD versions is HISTORY. The
   fingerprints on the right belong to the round in flight; the differences
   between v2 and v5 are not proposals and there is nobody to accept them. So
   picking anything other than the live pair puts the screen in a read-only
   comparison, and says so. Offering Accept on a difference nobody proposed
   would be inventing a decision. */
/* The comparison key for "is this the same document?". Whitespace-insensitive,
   because two snapshots of one wording taken through different paths differ by
   line breaks and by nothing a reader would call a version. */
const _negoSameDoc = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

function negoVersionOptions(c){
  negoInit(c);
  const baseline = {
    key: 'baseline', kind: 'live',
    /* The prototype's own words for these two panes, kept: "Original Baseline"
       and "Working Version" are what the screen has always called them, and a
       dropdown is no reason to rename the thing it selects. */
    label: `Original Baseline · round ${negoRound(c)}`,
    sub: 'the wording this round is measured against',
    body: negoBaseBody(c), text: negoBaseText(c),
  };
  const working = {
    key: 'working', kind: 'live',
    label: `Working Version · round ${negoRound(c)}`,
    sub: 'proposed redline',
    body: negoResolvedBody(c), text: negoResolvedText(c),
  };
  /* OLDEST FIRST, top to bottom. The list reads as the sequence the document
     actually went through — the wording this round started from, then each
     saved version in the order it was taken, then what is on the table now —
     rather than the newest-first order it had, which put the original at the
     bottom of a list whose first entry changed every round, so "which one did
     we start from" was answered by a different row each time. */
  const versions = [];
  /* The versions a person is offered to compare against: named snapshots and
     the milestones. The event copies the system keeps for its own baselines are
     not versions of the document and are not listed — see listedVersions. */
  for (const v of (window.listedVersions ? listedVersions(c) : (c.versions || []))){
    const body = v.body != null && String(v.body).trim()
      ? String(v.body)
      : negoRichFromLines(v.text || '');
    versions.push({ key: 'v' + v.n, kind: 'version', n: v.n,
      label: `v${v.n} · ${v.label || 'Saved'}`,
      sub: [v.by, v.at ? String(v.at).slice(0, 10) : null].filter(Boolean).join(' · '),
      body, text: v.text || '' });
  }
  return [baseline, ...versions, working];
}

/* ---- WHAT THE DROPDOWN OFFERS, AND WHY IT IS NOT EVERYTHING ----

   Every milestone the product passes takes a snapshot: the template being
   applied, each hand-over, each round closing, the send, the signature. All of
   them are real records and all of them belong in the version history — but a
   pane selector is not the version history. It asks "which two documents do you
   want side by side", and two entries holding WORD FOR WORD the same document
   are not two answers to it.

   That is not hypothetical. A contract opened for the first time offered three
   choices — Original Baseline, Working Version, and `v1 · Template "WH"` — of
   which the first and the third were the identical document under two names.
   One round of negotiation added more of exactly that kind, and the list became
   something to pick through rather than read.

   So a version is OFFERED only when it says something no entry above it already
   says. Nothing is renamed, merged or thrown away: negoVersionOptions still
   returns every one of them, which is what negoVersionByKey resolves against
   and what the version history panel reads — a key that used to work still
   works, it simply is not on the menu when a clearer name for the same document
   already is. */
function negoVersionChoices(c, keep){
  const all = negoVersionOptions(c);
  const wanted = new Set([].concat(keep || []).filter(Boolean));
  const seen = new Set();
  const out = [];
  for (const o of all){
    const key = _negoSameDoc(o.text || '');
    /* The live pair is always on the menu — they are the two panes' home
       position, and a selector you cannot get back to the live round from is
       the trap the compare bar exists to prevent. So is anything currently
       selected: a <select> whose own value is missing from its options renders
       as blank or silently reassigns itself. */
    if (o.kind === 'live' || wanted.has(o.key) || !key || !seen.has(key)) out.push(o);
    if (key) seen.add(key);
  }
  return out;
}
const negoVersionByKey = (c, key) => negoVersionOptions(c).find(v => v.key === key) || null;
/* Is this pair the live negotiation, or a look back at history? */
const negoIsLivePair = (left, right) =>
  (left || 'baseline') === 'baseline' && (right || 'working') === 'working';

/* Two versions, compared clause by clause.
   Clause ids are durable and live in the document, so a clause can be followed
   across versions even when it has been renumbered or had clauses inserted
   above it — which is exactly what makes this comparison meaningful rather
   than a line-by-line guess. A clause present in one side only is reported as
   added or removed rather than silently skipped. */
function negoCompareVersions(c, leftKey, rightKey){
  const left = negoVersionByKey(c, leftKey || 'baseline');
  const right = negoVersionByKey(c, rightKey || 'working');
  if (!left || !right) return null;
  const seg = html => (window.clauseSegment ? clauseSegment(html || '') : []);
  const L = seg(left.body), R = seg(right.body);
  const byId = list => { const m = new Map(); for (const cl of list) if (cl.clauseId) m.set(cl.clauseId, cl); return m; };
  let lMap = byId(L), rMap = byId(R);

  /* MATCHING TWO SNAPSHOTS THAT DO NOT SHARE CLAUSE IDS.

     A clause is normally matched to its earlier self by the durable id stamped
     into the document. Older snapshots have none: an id is stamped when the
     negotiation starts, so anything captured before that — the template being
     applied, the first share — carries an unstamped body. Matching on id alone
     then found NOTHING in common and reported the two versions as a complete
     replacement: every clause Removed, every clause Added, on two documents
     that differ by one sentence. That is not a diff, it is a failure to
     compare, and it looked like the contract had been rewritten.

     Where the ids do not meet, fall back to what a reader would use: the
     clause's heading, and failing that its position. Both sides get a synthetic
     key so the rest of this function is unchanged — it still matches by key,
     the key is simply derived rather than stored. */
  const overlap = [...rMap.keys()].filter(k => lMap.has(k)).length;
  if (!overlap && (L.length || R.length)){
    const norml = cl => String(negoClauseLabel(cl) || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const keyed = list => {
      const used = new Map();
      return list.map((cl, i) => {
        const h = norml(cl);
        const base = h ? 'h:' + h : 'p:' + i;
        const n = (used.get(base) || 0) + 1;
        used.set(base, n);
        return { ...cl, clauseId: n > 1 ? `${base}#${n}` : base };
      });
    };
    const L2 = keyed(L), R2 = keyed(R);
    L.length = 0; L.push(...L2);
    R.length = 0; R.push(...R2);
    lMap = byId(L); rMap = byId(R);
  }
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  const rows = [];
  const seen = new Set();
  for (const cl of R){
    const was = cl.clauseId ? lMap.get(cl.clauseId) : null;
    if (was) seen.add(cl.clauseId);
    if (!was){
      rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'added',
        ops: [{ op: 'ins', text: cl.text }], oldText: '', newText: cl.text });
      continue;
    }
    if (norm(was.text) === norm(cl.text)){
      rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'same',
        ops: [{ op: 'keep', text: cl.text }], oldText: was.text, newText: cl.text });
      continue;
    }
    rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'changed',
      ops: (window.redlineOps ? redlineOps(was.text, cl.text) : []),
      oldText: was.text, newText: cl.text });
  }
  for (const cl of L){
    if (!cl.clauseId || seen.has(cl.clauseId)) continue;
    rows.push({ clauseId: cl.clauseId, label: negoClauseLabel(cl), state: 'removed',
      ops: [{ op: 'del', text: cl.text }], oldText: cl.text, newText: '' });
  }
  const moved = rows.filter(r => r.state !== 'same');
  return { left, right, rows, moved: moved.length,
    live: negoIsLivePair(left.key, right.key),
    summary: moved.length
      ? `${moved.length} clause${moved.length === 1 ? '' : 's'} differ between ${left.label} and ${right.label}`
      : `${left.label} and ${right.label} say the same thing` };
}

/* ---------- the turn model ----------
   Whose move it is. Built on the existing share/response routes — no new
   endpoints, no websockets — because a public no-login URL that mutates a
   contract per click must not exist. */
function negoTurn(c){ return negoInit(c).turn === 'counterparty' ? 'counterparty' : 'owner'; }
function negoHandOver(c, opts = {}){
  const n = negoInit(c);
  const to = opts.to === 'owner' ? 'owner' : 'counterparty';
  if (n.turn === to) return null;
  n.turn = to;
  n.turnAt = (window.nowISO ? window.nowISO() : new Date().toISOString());
  const by = String(opts.by || (window.currentUser && window.currentUser()?.name) || 'System');
  /* Every turn close snapshots a version, so version compare keeps working and
     the history reads as a sequence of hand-offs rather than a pile of edits. */
  /* LISTED, and it has to be. A hand-over is the one moment in a negotiation
     that a person can name afterwards — "the draft we sent them on Tuesday",
     "what came back". Filed unlisted, a negotiation conducted entirely through
     tracked changes in the room produced a version list reading "0 versions",
     so there was nothing to compare and nothing to go back to unless somebody
     had remembered to press Snapshot before every send. The per-change copies
     stay unlisted; these are the milestones, one per turn. */
  if (window.captureVersion) captureVersion(c, `Round ${n.round} — sent to ${to === 'counterparty' ? (c.counterparty || 'the counterparty') : 'the owner'}`, by, { auto: true, listed: true });
  if (window.logAudit) logAudit(c, 'Negotiation',
    `Turn handed to ${to} by ${by} in round ${n.round} — ${negoPending(c).length} change(s) awaiting a decision`);
  return { turn: to, at: n.turnAt };
}
/* The banner both sides read. A READ of the change set and the turn, so it can
   never claim a state the record does not support. */
function negoTurnBanner(c, side){
  negoInit(c);
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const turn = negoTurn(c);
  const other = me === 'owner' ? (c.counterparty || 'the counterparty') : ((window.FIRST_PARTY) || 'the owner');
  const mine = negoPending(c).filter(x => x.authorSide !== me).length;
  if (turn === me)
    return { mine: true, text: mine
      ? `Your turn — ${mine} change${mine === 1 ? '' : 's'} to review`
      : 'Your turn — propose changes or send it back' };
  const sent = c.negotiation.turnAt || null;
  return { mine: false, sentAt: sent, text: `Waiting on ${other}${sent ? '' : ''}` };
}

/* ---------- advancing the round ----------
   The resolved wording becomes the baseline the NEXT round is measured
   against, and the decided changes are archived onto the round record so the
   history reads as a sequence of decisions rather than one ever-growing pile.
   The archived records keep their hashes and their revisions, which is what
   lets verifyChangeChain walk a six-round history. */
function negoAdvanceRound(c, opts = {}){
  negoInit(c);
  const p = negoProgress(c);
  if (p.pending) return null;                 // an undecided change is not history yet
  const decided = negoChanges(c).filter(x => x.status === 'accepted' || x.status === 'rejected');
  if (!decided.length) return null;
  const n = c.negotiation.round;
  c.negotiation.rounds = Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds : [];
  c.negotiation.rounds.push({ n, at: (window.nowISO ? window.nowISO() : new Date().toISOString()),
    baselineBody: c.negotiation.baselineBody,
    baselineText: c.negotiation.baselineText,
    changes: decided.map(x => ({ ...x, thread: (x.thread || []).slice(),
      revisions: (x.revisions || []).slice() })) });
  const body = negoResolvedBody(c);
  c.negotiation.baselineBody = body;
  c.negotiation.baselineText = (window.richToText ? richToText(body) : '');
  c.negotiation.baselineFormat = (window.docFormat ? docFormat(c.format) : 'text');
  c.negotiation.round = n + 1;
  c.changes = [];                             // the archived set lives on the round
  /* A round closing makes the agreed wording the new baseline — that is an
     update to the contract, so it is listed even though nobody asked for it. */
  if (window.captureVersion) captureVersion(c, `Round ${n} closed`, opts.by
    || (window.currentUser && window.currentUser()?.name) || 'System', { auto: true, listed: true });
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
/* A change's wording as it stood at a given hash — the prior revisions being
   recoverable is what makes update-in-place safe. */
function negoRevisionAt(c, id, hash){
  const ch = negoAllChanges(c).find(x => x.id === id);
  if (!ch) return null;
  if (ch.hash === hash) return { ...ch, current: true };
  const r = (ch.revisions || []).find(x => x.hash === hash);
  return r ? { ...r, id, current: false } : null;
}

/* ---------- the redline, as HTML ----------
   RENDERED FROM THE STORED OPS. Never re-diffed. What a reviewer sees is a
   picture of the record, so what was reviewed is provably what was decided on
   — the property that was missing when the diff algorithm changed mid-session
   and the same change started rendering differently on different days. */
function negoChangeHtml(ch, opts = {}){
  if (!ch) return '';
  if (Array.isArray(ch.ops) && ch.ops.length && window.redlineOpsHtml)
    return redlineOpsHtml(ch.ops, opts);
  const e = window.esc || _negoEsc;
  return e(ch.newText || '');
}
/* Kept for callers that hold two strings and no record (the compare surfaces).
   New code files a change and renders its ops. */
function negoDiffHtml(oldText, newText){
  return window.redlineOps ? redlineOpsHtml(redlineOps(oldText, newText)) : _negoEsc(newText);
}

/* ---------- intake normalisation ----------
   The three ways a contract becomes negotiable, converging on ONE shape. This
   is the function that makes the pivot true: after it runs, nothing downstream
   can tell which route the contract arrived by.

     1. standard template  — drafted in the wizard from js/templates.js
     2. custom/user template — state.settings.customTemplates, js/views/library.js
     3. uploaded Word file — docxExtract() in js/docx.js, the one and only place
        Word's format matters from here on

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
   the only mapping that survives being negotiated: textToRich() splits on BLANK
   lines, and extracted Word text has none, so a whole contract became a single
   <p> and rewriting one line took the other clauses with it.

   The first heading line is the document's title (<h1>); later ones are section
   headings (<h2>). docLineKind() decides which lines are headings. */
/* STRUCTURE COMES FROM THE WORDING, NOT FROM THE LINE BREAKS.

   This used to emit one <p> per line of the source text, which is only correct
   if every line of the source is a paragraph. Neither intake path produces
   that. The structured PDF reader emits one line per VISUAL line, so a sentence
   that wrapped three times became three paragraphs and "1. Services" became
   body text; the fallback scrape emitted no line breaks at all, so the entire
   agreement became a single paragraph with its page footers inside it.

   docRichFromText reads the numbering, the bullet marks and the capitalisation
   the contract already uses to say what its own parts are, and treats the line
   breaks as what they are — where the page happened to end. Kept as a named
   function because the whole intake path calls it by this name. */
function negoRichFromLines(text){
  if (window.docRichFromText) return docRichFromText(text);
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
     lets it be negotiated clause by clause like anything else. */
  if (path === 'upload' && c.redlineText == null){
    const text = (c.upload && c.upload.extractedText) || '';
    if (text.trim()){
      c.redlineText = negoRichFromLines(text);
      c.format = window.RICH_FORMAT || 'rich';
    }
  }
  negoInit(c, opts);
  negoMigrate(c);
  const body = negoBodyOf(c);
  const text = (window.docPlainText ? docPlainText(c) : '') || '';
  return {
    path,
    format: (window.docFormat ? docFormat(c.format) : 'text'),
    rich: !!(window.isRich && isRich(c.format)),
    text,
    body,
    clauses: negoClauses(c),
    changes: negoChanges(c),
    round: negoRound(c),
    turn: negoTurn(c),
    baselineText: negoBaseText(c),
    baselineBody: negoBaseBody(c),
    empty: !text.trim(),
  };
}

/* ---------- migration ----------
   Contracts that predate this model carry changes keyed to line strings
   (`clause:#3`) rather than to clause ids. Their clause ids are stamped on
   first open by negoInit; this re-keys the changes.

   Each old change is matched by its `oldText` against the clause bodies of the
   baseline. Anything that matches is re-anchored and carries on. Anything that
   does NOT match is flagged `needsReview` and left visible — never silently
   dropped, because a dropped change is an ask that quietly stops being asked,
   which is the one failure this whole model exists to prevent.

   A contract with nothing pending migrates with nothing to do. */
function negoMigrate(c){
  negoInit(c);
  const changes = c.changes || [];
  if (!changes.length) return { migrated: 0, flagged: 0, already: true };
  const stale = changes.filter(x => !x.hashV || x.hashV < NEGO_HASH_V
    || !/^cl_/.test(String(x.clauseId || '')));
  if (!stale.length) return { migrated: 0, flagged: 0, already: true };

  const clauses = negoClauseList(c);
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const byText = new Map();
  for (const cl of clauses) byText.set(norm(cl.text), cl);

  let migrated = 0, flagged = 0;
  for (const x of stale){
    const want = norm(x.oldText || x.newText);
    let cl = byText.get(want) || null;
    if (!cl && want) cl = clauses.find(k => norm(k.text).includes(want) || want.includes(norm(k.text))) || null;
    /* The change record shape moves too: type → changeType, and the ops it
       never had are computed once, here, from the wording it does have. */
    if (!x.changeType) x.changeType = x.type === 'insert' ? 'insertClause'
      : x.type === 'delete' ? 'deleteClause' : 'modify';
    if (!Array.isArray(x.ops) || !x.ops.length)
      x.ops = x.changeType === 'modify' && window.redlineOps
        ? redlineOps(x.oldText || '', x.newText || '')
        : x.changeType === 'insertClause' ? [{ op: 'ins', text: x.newText || '' }]
        : [{ op: 'del', text: x.oldText || '' }];
    if (cl){
      x.clauseId = cl.clauseId;
      x.clauseLabel = x.clauseLabel || negoClauseLabel(cl);
      x.needsReview = false;
      migrated++;
    } else {
      /* Kept, shown, and marked. The wording is still on the record; what is
         lost is only the certainty about WHICH clause it belongs to, and that
         is exactly what a human is being asked to restore. */
      x.needsReview = true;
      x.needsReviewWhy = 'This change was filed before clauses had durable ids, and its original '
        + 'wording no longer matches any clause in the document. It has been kept for review — '
        + 'confirm which clause it belongs to before deciding it.';
      flagged++;
    }
  }
  if (window.logAudit && (migrated || flagged)) logAudit(c, 'Negotiation',
    `Clause identity migrated — ${migrated} change${migrated === 1 ? '' : 's'} re-anchored to durable clause ids`
    + (flagged ? `; ${flagged} could not be matched and ${flagged === 1 ? 'is' : 'are'} flagged for review (none dropped)` : ''));
  return { migrated, flagged, already: false };
}

if (typeof window !== 'undefined') Object.assign(window, {
  negoClauseLabel, negoClauses, negoClauseList, negoClauseById, negoBodyOf,
  negoInit, negoStampContract, negoBaseText, negoBaseBody, negoRound,
  negoChanges, negoChangeById, negoPending, negoOpenChanges,
  negoNextId, negoHashInput, negoHash, negoIssue, negoIssuances, negoShortHash,
  verifyChangeChain, negoVerifyCached, negoRefreshVerification, negoInvalidateVerification, NEGO_HASH_V,
  negoSummariseOps, negoFileChange, negoEditClause, negoInsertClause, negoDeleteClause,
  negoNoteFor, negoProposedBodyFromText, negoBodyFromText, negoFileProposal, negoResolvedBody, negoResolvedText, negoCommitBody, negoCommitText,
  negoResolve, negoResolveAll, negoWithdraw, negoUnwithdraw,
  negoPostComment, negoCommentIsStale, negoTopicFor, negoThreadOf,
  negoBuildBody, negoCleanBody, negoCleanText,
  negoProgress, negoReadyToSign, negoOpenPoints,
  negoAlignment, negoAlignmentWhy, negoSignalReady, negoReadySignal,
  negoChangeSummary, negoCopilotContext, NEGO_CTX_CHARS,
  negoCopilotRecord, NEGO_COPILOT_CAP,
  negoVersionOptions, negoVersionChoices, negoVersionByKey, negoIsLivePair, negoCompareVersions,
  negoTurn, negoHandOver, negoTurnBanner,
  negoAdvanceRound, negoAllChanges, negoRevisionAt,
  negoChangeHtml, negoDiffHtml,
  negoIntakePath, negoNormalizeDocument, negoRichFromLines, negoMigrate });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  negoHashInput, negoShortHash };
