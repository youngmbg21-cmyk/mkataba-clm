/* HaTi — WHAT COPILOT PROPOSED, AND WHAT BECAME OF IT (ideas 22 & 23)
   ══════════════════════════════════════════════════════════════════════════
   Two screens were asked for and they are ONE RECORDING seen twice:

     · idea 22 — the AI involvement record, a section in a contract's own
       evidence pack: when, on which clause, what Copilot proposed, what it
       rested on, what happened to it, and who decided.
     · idea 23 — acceptance metrics, in Settings → Build & launch → Copilot
       engine: the same facts rolled up across the workspace, by feature.

   NEITHER COULD BE COMPUTED FROM ANYTHING ON FILE. The product recorded that a
   change came from Copilot (`note` reads "Copilot — Simplify") and nothing
   else: not what was offered and never taken, and not whether wording that WAS
   taken went in word-for-word or was rewritten first. So the recording had to
   exist before either screen could say anything true, and this file is it.

   ---- IT ADDS NO ROUTE AND NO TABLE ----
   `c.aiTrace` is an ordinary field on the contract, so it rides the light list
   by construction (HEAVY spreads the record and strips five named things), and
   the workspace reading is counted in the browser off `state.contracts` — the
   caller's own already-scoped bootstrap. Same shelf as js/precedent.js and
   js/payterms.js: a deterministic reading with no view, no store of its own and
   no network verb. f276 sweeps this file for every one of them.

   ---- ITS OWN FILE, AND THAT IS LOAD-BEARING ----
   Four surfaces reach it — the clause editor, the obligations dialog, the
   change funnel and two readers. Written inside any one of them the others
   would reach it through `window` on a stage that does not carry that view,
   get `undefined`, and record NOTHING, silently: this codebase's most repeated
   defect (the rlPaperFootHtml family). Its own file, loaded before all of
   them, cannot fail that way.

   ---- COUNTING IS NOT DRAWING ----
   The Insights panels' own rule. `aiTracePack` and `aiTraceStats` return plain
   data and draw nothing; the evidence pack and the engine drawer draw it and
   count nothing.

   ---- THE HASH IS FOR EQUALITY, NEVER FOR ATTESTATION ----
   `aiTraceHash` answers one question: is this the same wording. It is a cheap
   deterministic hash over the TEXT PROJECTION, so a change of dressing that
   leaves the words alone still reads as "taken as-is" — which is what a reader
   means by it. IT IS NOT THE SEAL and must never be read as one: the seal is
   SHA-256 over the sealed wording, computed elsewhere, and the negotiation
   fingerprint is its own versioned thing. Nothing here is evidence of
   anything; it is a bookkeeping comparison.

   ---- FIVE OUTCOMES, AND THE FIFTH IS THE HONEST ONE ----
     · `proposed` — offered, and nothing has happened to it. Printed, and NEVER
       counted as a refusal: this codebase's own rule that a call which never
       got an answer is not a wrong answer.
     · `as-is`    — filed word-for-word.
     · `edited`   — filed after the reader changed it.
     · `refused`  — explicitly declined. An obligation unticked; a playbook
       deviation where the reader used the workspace's OWN standard instead of
       Copilot's draft.
     · `read`     — a reading rather than wording (a brief, a plain-English
       explanation). Counted apart and never in the percentages, because it was
       never a candidate for the agreement.

   ---- WHAT IS DELIBERATELY NOT RECORDED, said out loud ----
   Draft from a sentence. Its proposal becomes a CONTRACT, so a draft nobody
   took has no contract to be recorded on — the feature could only ever report
   as-is and edited, and a "not taken" column reading zero for it would be a
   lie by omission on the one row that could not answer. It stays out until it
   has somewhere honest to live.

   And APPLYING THE WORKSPACE'S OWN STANDARD IS NOT COPILOT'S WORDING TAKEN.
   rlPlaybookProposals names three wordings and only `draft` is Copilot's;
   `preferred` and `fallback` are the clause library's — approved here, editable
   in Settings. Counting a "Use our standard" press as a Copilot proposal
   accepted would be this product taking credit for its customer's own drafting.
   It is recorded as a refusal of the draft, which is exactly what it is.
   ══════════════════════════════════════════════════════════════════════════ */

/* A contract holds at most this many entries, oldest dropped first. It rides
   every list response, so the ceiling is a size decision rather than a
   judgement about how much history is interesting. */
const AI_TRACE_MAX = 40;
/* The short label and the "rested on" line are CAPPED rather than stored
   whole: what is wanted from them is recognition, and the wording itself is
   one press away on the clause the entry names. */
const AI_TRACE_WHAT_MAX = 90;
const AI_TRACE_RESTED_MAX = 70;

/* The vocabulary is owned HERE and nowhere else, so the pack and the drawer
   cannot come to disagree about what an outcome means. TAKEN is the two that
   reached the agreement; NOT TAKEN is the two that did not. */
const AI_TRACE_TAKEN = ['as-is', 'edited'];
const AI_TRACE_UNTAKEN = ['refused', 'proposed'];
const AI_TRACE_OUTCOMES = ['as-is', 'edited', 'refused', 'proposed', 'read'];

/* ---- THE FEATURE IS THE SURFACE THAT PROPOSED, NOT THE SPEND BUCKET ----
   The engine drawer already carries the server's AI_FEATURE_LABEL for the
   MONEY, and borrowing it here would be wrong twice over: the clause editor's
   Copilot spends on the `chat` route, so every redline proposal would sit under
   a row called "Copilot" that also holds every question anybody asked anywhere;
   and the question this table answers is which SURFACE offered wording, which
   is a different population from which route was billed. So the keys are this
   file's own, and ONE naming serves both readers — resolved at the moment it is
   read, so it follows a reader who changes language mid-sitting.

   THE EVIDENCE PACK KEEPS ENGLISH, and that is the rulebook's own rule rather
   than an oversight: the pack is a RECORD, read in a dispute by somebody who
   was never in this workspace, so a label that turned over with the reader's
   own setting would put two languages in one exhibit. */
const AI_TRACE_FEATURES = {
  redline:     { k: 'ai_tr_f_redline',     en: 'Redline (clause editor)' },
  playbook:    { k: 'ai_tr_f_playbook',    en: 'Playbook standards' },
  obligations: { k: 'ai_tr_f_obligations', en: 'Obligations found' },
};
const aiTraceFeatureEnglish = f =>
  (AI_TRACE_FEATURES[f] && AI_TRACE_FEATURES[f].en) || String(f || '');
function aiTraceFeatureLabel(f){
  const e = AI_TRACE_FEATURES[f];
  if (!e) return String(f || '');
  return (typeof window !== 'undefined' && window.i18t) ? i18t(e.k) : e.en;
}

const _aiTraceClip = (s, n) => {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

/* FNV-1a over the wording's own text. Never the markup: the funnel sanitises
   on the way in, so comparing stored HTML would read a tidy-up as an edit. */
function aiTraceHash(html){
  const src = (typeof window !== 'undefined' && window.richToText)
    ? window.richToText(String(html == null ? '' : html))
    : String(html == null ? '' : html).replace(/<[^>]*>/g, ' ');
  const t = src.replace(/\s+/g, ' ').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++){
    h ^= t.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36);
}

/* READING MUST NOT WRITE. Every reader here asks this, so a contract that has
   never met Copilot gains no field from being counted. */
const aiTraceList = c => (c && Array.isArray(c.aiTrace)) ? c.aiTrace : [];

/* ---- ONE WRITER ----
   Everything that records a proposal comes through here, so there is one place
   the shape is decided and one place the cap is applied. Returns the entry's
   id, which the caller holds on to if it will settle the entry later. */
function aiTraceNote(c, entry){
  if (!c || !entry || !entry.feature) return null;
  const list = Array.isArray(c.aiTrace) ? c.aiTrace : (c.aiTrace = []);
  const id = 'ai_' + Math.random().toString(36).slice(2, 8);
  const kind = entry.kind === 'reading' ? 'reading' : 'wording';
  list.push({
    id,
    at: (typeof window !== 'undefined' && window.nowISO) ? window.nowISO() : new Date().toISOString(),
    feature: String(entry.feature),
    kind,
    clauseId: entry.clauseId || null,
    clauseLabel: _aiTraceClip(entry.clauseLabel, AI_TRACE_WHAT_MAX),
    what: _aiTraceClip(entry.what, AI_TRACE_WHAT_MAX),
    hash: entry.hash || null,
    rested: _aiTraceClip(entry.rested, AI_TRACE_RESTED_MAX),
    outcome: kind === 'reading' ? 'read' : (entry.outcome || 'proposed'),
    by: entry.by || ((typeof window !== 'undefined' && window.currentUser && currentUser()) ? currentUser().name : '') || '',
    changeId: entry.changeId || null,
  });
  while (list.length > AI_TRACE_MAX) list.shift();
  return id;
}

const aiTraceById = (c, id) => aiTraceList(c).find(e => e && e.id === id) || null;

/* Wording has been taken into a draft. The hash is what the draft became, so
   the funnel can later say whether the reader changed it before filing. */
function aiTraceApplied(c, id, html){
  const e = aiTraceById(c, id);
  if (!e || e.outcome !== 'proposed') return false;
  e.hash = aiTraceHash(html);
  return true;
}

/* ---- TAKEN, WHERE THERE IS NO FUNNEL TO SETTLE IT ----
   The change funnel settles anything that becomes part of the agreement's
   wording, and it decides as-is against edited by comparing hashes because it
   HAS both texts. A surface that files something else — an obligation, which
   is a promise beside the contract rather than a clause in it — has no such
   comparison to make, so it says which outcome it means. `edited` is only ever
   passed by a surface that really does let the reader change the wording
   first; the obligations window does not, and says so where it calls this. */
function aiTraceTaken(c, id, opts){
  const e = aiTraceById(c, id);
  if (!e || e.outcome !== 'proposed') return false;
  e.outcome = (opts && opts.edited) ? 'edited' : 'as-is';
  if (opts && opts.changeId) e.changeId = opts.changeId;
  return true;
}

/* An explicit no. Never inferred from silence — a proposal nobody touched
   stays `proposed`, which is a different fact and is printed as one. */
function aiTraceRefuse(c, id, why){
  const e = aiTraceById(c, id);
  if (!e || e.outcome !== 'proposed') return false;
  e.outcome = 'refused';
  if (why) e.rested = _aiTraceClip(why, AI_TRACE_RESTED_MAX);
  return true;
}

/* ---- SETTLED AT THE FUNNEL, NOT AT THE PRESS ----
   negoFileChange is where every negotiation change is filed, so a proposal
   that reached the agreement by any door — the clause editor, the playbook
   rail, a caller written next year — is settled here without that door knowing
   it needs to. This is the rulebook's own rule about guards, applied to a
   record.

   THE NEWEST APPLIED PROPOSAL ON THAT CLAUSE, and only that one. A reader who
   takes card A, then takes card B over it, then files has used B; A's wording
   never reached the contract, so A stays `proposed` — offered, not taken —
   which is what that word means here. */
function aiTraceSettle(c, opts){
  const o = opts || {};
  if (!c || !o.clauseId) return null;
  const list = aiTraceList(c);
  for (let i = list.length - 1; i >= 0; i--){
    const e = list[i];
    if (!e || e.outcome !== 'proposed' || !e.hash) continue;
    if (String(e.clauseId || '') !== String(o.clauseId)) continue;
    e.outcome = (aiTraceHash(o.bodyHtml) === e.hash) ? 'as-is' : 'edited';
    if (o.changeId) e.changeId = o.changeId;
    if (o.by) e.by = o.by;
    return e;
  }
  return null;
}

/* ---- A SEALED RECORD TAKES NO COURTESY WRITE ----
   aiNoteRead's own reasoning, one field along: persist() is refused outright on
   an executed contract, so an advisory note written there answers a reader's
   press with a red "Save failed" over something that in fact arrived. This
   records in memory and declines to save; the entry rides the next ordinary
   save if there is one. */
function aiTraceSave(c){
  if (!c) return false;
  const sealed = (typeof window !== 'undefined' && typeof window.negoExecuted === 'function')
    ? window.negoExecuted(c) : (c.status === 'Signed');
  if (sealed) return false;
  if (typeof window !== 'undefined' && typeof window.persist === 'function') persist(c);
  return true;
}

/* ============================================================================
   IDEA 22 — one contract's record, for its evidence pack
   ==========================================================================*/
function aiTracePack(c){
  const rows = aiTraceList(c).map(e => ({
    at: e.at, feature: e.feature, kind: e.kind,
    featureLabel: aiTraceFeatureEnglish(e.feature),
    clause: e.clauseLabel || e.clauseId || null,
    proposed: e.what || null,
    restedOn: e.rested || null,
    outcome: e.outcome,
    change: e.changeId || null,
    by: e.by || null,
  }));
  const wording = rows.filter(r => r.kind === 'wording');
  const count = o => wording.filter(r => r.outcome === o).length;
  return {
    /* The pack states what this record IS, because a lawyer reading it in a
       dispute must not have to infer it: these are proposals, the agreement is
       the agreement, and a person decided every one of them. */
    note: 'Wording Copilot proposed on this contract, and what a person did with it. '
        + 'Nothing here is part of the agreement — the agreement is the sealed wording above.',
    proposals: wording.length,
    takenAsIs: count('as-is'),
    editedFirst: count('edited'),
    refused: count('refused'),
    notActedOn: count('proposed'),
    readings: rows.length - wording.length,
    entries: rows,
  };
}

/* ============================================================================
   IDEA 23 — the workspace, by feature
   ----------------------------------------------------------------------------
   The list is the caller's own already-scoped bootstrap, so scope holds by
   construction. It COUNTS and names nothing: the labels are the server's own
   AI_FEATURE_LABEL, already on /api/ai/config beside the spend, so the two
   tables in that drawer cannot come to call one feature by two names.
   ==========================================================================*/
function aiTraceStats(list){
  const out = new Map();
  let readings = 0;
  for (const c of (Array.isArray(list) ? list : [])){
    for (const e of aiTraceList(c)){
      if (!e) continue;
      if (e.kind === 'reading'){ readings++; continue; }
      const k = e.feature || 'other';
      const row = out.get(k) || { feature: k, proposals: 0, asIs: 0, edited: 0, refused: 0, pending: 0 };
      row.proposals++;
      if (e.outcome === 'as-is') row.asIs++;
      else if (e.outcome === 'edited') row.edited++;
      else if (e.outcome === 'refused') row.refused++;
      else row.pending++;
      out.set(k, row);
    }
  }
  const rows = Array.from(out.values()).sort((a, b) => b.proposals - a.proposals);
  const sum = k => rows.reduce((n, r) => n + r[k], 0);
  const proposals = sum('proposals');
  return {
    rows, readings, proposals,
    asIs: sum('asIs'), edited: sum('edited'),
    /* NOT TAKEN holds both halves on purpose: wording that was declined and
       wording nobody used. They are different facts and the record keeps them
       apart — a five-column table in a drawer this narrow is what would have to
       give, and the drawer's own note says what the column counts. */
    notTaken: sum('refused') + sum('pending'),
  };
}

/* ---- THE SHARES ARE ARITHMETIC, SO THEY ARE COUNTED HERE ----
   Written in the drawer they would be a drawing that computes, which is the
   rule this file opens by keeping. And they have to be counted in ONE place
   for a reason a reader can see: three independently rounded percentages sum
   to 99 or 101 often enough to be noticed, and a set of shares that does not
   add up is a set nobody trusts.

   NOT TAKEN TAKES THE RESIDUAL, deliberately. Somebody has to, and giving it
   to the column that flatters this product least is the honest direction for a
   number HaTi has an interest in. */
function aiTraceShares(d){
  const n = (d && d.proposals) || 0;
  if (!n) return { asIs: 0, edited: 0, notTaken: 0 };
  const asIs = Math.round(d.asIs / n * 100);
  const edited = Math.round(d.edited / n * 100);
  return { asIs, edited, notTaken: Math.max(0, 100 - asIs - edited) };
}

/* ---- WHAT HISTORY ALREADY HOLDS, AND WHAT IT CANNOT ----
   The recording above starts the day it ships, so on a workspace with a year
   of Copilot behind it the drawer opens empty and stays that way for weeks.
   That is honest and it is useless, and the owner said so.

   ONE HALF OF ONE COLUMN IS RECOVERABLE. Long before any of this, a change
   filed from Copilot's wording carried its provenance — `note` reads
   "Copilot — Simplify" — so a proposal that was TAKEN can be counted right
   back through the book. Nothing else can: the record never held what the
   model first said, so as-is against edited is unknowable, and it never held
   a proposal nobody used, so refused and never-acted-on are unknowable too.
   The drawer prints this as a COUNT with that limit written under it rather
   than as a table, because a table with one honest column and three guessed
   ones is worse than a sentence.

   PLAYBOOK FILINGS ARE DELIBERATELY NOT COUNTED, and this is the same rule
   the recording itself keeps: `Playbook — <category>` says a standard was
   filed and does NOT say which of the three wordings went in, and two of the
   three are the workspace's own clause library. Counting them would be HaTi
   taking credit for its customer's own drafting.

   IT READS WITHOUT WRITING. `c.changes` and the archived rounds are read RAW,
   never through negoAllChanges or negoChanges — both call negoInit, which
   creates a negotiation record and stamps clause ids into the document, so a
   sweep over the whole book would start a negotiation on every contract
   merely by counting it. */
const AI_TRACE_NOTE_RE = /^\s*copilot\b/i;
const aiTraceFromCopilot = ch => !!(ch && AI_TRACE_NOTE_RE.test(String(ch.note || '')));
function aiTraceHistory(list){
  let taken = 0, contracts = 0;
  for (const c of (Array.isArray(list) ? list : [])){
    if (!c) continue;
    /* Deduped on the change id: closing a round moves a change OFF c.changes
       and onto the round, so nothing should be in both — the guard is cheap
       and a double-counted figure is the one thing this must not print. */
    const seen = new Set();
    let n = 0;
    const take = ch => {
      if (!aiTraceFromCopilot(ch)) return;
      const k = ch.id || ('#' + n);
      if (seen.has(k)) return;
      seen.add(k); n++;
    };
    for (const ch of (Array.isArray(c.changes) ? c.changes : [])) take(ch);
    const rounds = (c.negotiation && Array.isArray(c.negotiation.rounds)) ? c.negotiation.rounds : [];
    for (const r of rounds) for (const ch of (Array.isArray(r && r.changes) ? r.changes : [])) take(ch);
    if (n){ taken += n; contracts++; }
  }
  return { taken, contracts };
}

Object.assign(window, {
  AI_TRACE_MAX, AI_TRACE_WHAT_MAX, AI_TRACE_RESTED_MAX,
  AI_TRACE_OUTCOMES, AI_TRACE_TAKEN, AI_TRACE_UNTAKEN, AI_TRACE_FEATURES,
  aiTraceFeatureLabel, aiTraceFeatureEnglish,
  aiTraceHash, aiTraceList, aiTraceNote, aiTraceById, aiTraceApplied,
  aiTraceRefuse, aiTraceTaken, aiTraceSettle, aiTraceSave, aiTracePack, aiTraceStats,
  aiTraceShares, aiTraceHistory, aiTraceFromCopilot, AI_TRACE_NOTE_RE,
});
