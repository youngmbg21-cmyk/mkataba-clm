/* ============================================================
   THE CHECK BEFORE A CONTRACT IS SIGNED  (owner-approved 13 Sep 2026)
   ============================================================
   WORKORDER-pre-signature-check.md, Part A, phase 2. The owner's own words:
   *"once any contract is ready for signing, it should have another sweep to see
   where it stands against company policy and any new obligations."*

   THE PROBLEM IT ANSWERS. A contract is read when it ARRIVES from outside, and
   never read again. But the wording that gets signed is not the wording that
   arrived: rounds of redlines move clauses, add promises and change figures the
   record may not have followed. So at the moment a contract is ready to sign,
   somebody has to be able to ask three questions and get three answers.

   THIS FILE IS THE READING AND NOTHING ELSE.
     · it SPENDS nothing — every answer is already on the record;
     · it WRITES nothing — READING MUST NOT WRITE, so c.changes and
       c.negotiation are read RAW and negoInit is never reached (the alerts
       panel's own rule, and this is asked on every paint of the Signing tab);
     · it DECIDES nothing — a deviation stays a deviation until a person
       accepts it in writing, and the card draws what is here.

   AN ABSENCE IS STATED, NEVER GUESSED. No playbook saved, no figure in the
   wording, a review filed before it recorded which wording it read: each of
   those is its own answer, and none of them is "fine".
   ============================================================ */

/* Every name this file reaches for lives in another module, so each is asked
   through window with a guard: a stage that loads this file without one of
   them must draw a smaller answer rather than throw. */
const _scW = n => { try{ return window[n]; }catch(_){ return undefined; } };
const _scCall = (n, ...a) => { const f = _scW(n); try{ return typeof f === 'function' ? f(...a) : null; }catch(_){ return null; } };
const _scStr = v => String(v == null ? '' : v).trim();

/* ---- IS THIS THE MOMENT THE CHECK IS ABOUT ----
   Signers named on both sides, nothing left on the negotiating table, and the
   record not already sealed. Before that the card draws nothing at all: a
   check of wording still being argued over is a check of something that will
   not be signed. */
/* ---- READING A CONTRACT DOES NOT REQUIRE KNOWING WHO WILL SIGN IT
   (Young ruled 15 Sep 2026) ----
   *"how do you trigger running the brief again, the standard checks, and the
   obligations once more before you sign?"* — you could not, and this is why.

   THIS USED TO REFUSE UNTIL A SIGNER WAS NAMED ON EACH SIDE, which hid the
   three readings and the Run control with them. So the card said "3 to
   settle", the reader settled three things, and only THEN did three more
   appear. The list understated its own length every time.

   AND IT IS BACKWARDS. You read a contract and then decide who signs it, not
   the other way round. The only precondition the readings actually have is
   wording to read. The signers question is a ROW in the list — it holds a
   signature, as it always did — never a condition on the list being drawn.

   WHAT REPLACES IT IS A WAITING STATE, NOT A SECOND HIDING PLACE: while the
   negotiation is still open the readings are drawn and say they are waiting,
   because reading wording that is about to move spends money on an answer
   that will be wrong. signCheckTableClear is that question and it kept its
   name; what changed is that its answer is now SAID rather than obeyed in
   silence. */
function signCheckReady(c){
  if (!c) return false;
  if (_scCall('negoExecuted', c)) return false;
  if (String(c.status || '') === 'Signed' || String(c.status || '') === 'Declined') return false;
  return true;
}
/* Why the readings cannot run yet, or null. One reason today; a second joins
   this function rather than growing a second guard somewhere else. */
function signCheckWaiting(c){
  if (!c) return null;
  return signCheckTableClear(c) ? null : 'nego';
}
/* THE TABLE, READ WITHOUT STARTING A NEGOTIATION. negoOpenPoints reaches
   negoAllChanges, which runs negoInit and CREATES a negotiation on a contract
   that has none — so it is asked only where one already exists. A contract
   nobody has ever proposed anything on has nothing open by construction. */
function signCheckTableClear(c){
  if (!c || !c.negotiation) return true;
  const pts = _scCall('negoOpenPoints', c);
  return !Array.isArray(pts) || pts.length === 0;
}

/* ---- WHERE THE FINAL WORDING STANDS AGAINST YOUR PLAYBOOK ----
   `none`  — no playbook is saved for this kind of contract, so there is
             nothing to stand against and the tile says so.
   `unread`— a playbook exists and nothing has read this contract against it.
   `stale` — true / false / null, straight from playbookStale: null means the
             review was filed before reviews recorded which wording they read,
             which is "we do not know", not "fresh".
   A deviation is OPEN until somebody accepts it in writing (see
   signCheckAccept); an accepted one keeps its reason and stops holding
   anything up. */
const SIGN_ACCEPT_MAX = 240;
function signCheckStandards(c){
  const book = _scCall('resolvePlaybook', _scCall('playbookKeyFor', c));
  const has = !!(book && (Array.isArray(book.positions) || Array.isArray(book.ranges)));
  const rev = c && c.playbook;
  if (!has) return { none: true, unread: false, stale: null, total: 0, open: 0, findings: [] };
  if (!rev || !Array.isArray(rev.verdicts))
    return { none: false, unread: true, stale: null, total: 0, open: 0, findings: [] };
  /* THE INDEX IS THE VERDICT'S OWN POSITION IN c.playbook.verdicts, taken
     BEFORE the filter — it is what "accept this one" writes against, and an
     index into a filtered list would stamp a reason onto whichever verdict
     happened to sit at that position in the whole. */
  const findings = rev.verdicts
    .map((v, i) => ({ v, i }))
    .filter(x => x.v && (x.v.status === 'deviation' || x.v.status === 'missing'))
    .map(({ v, i }) => ({ i, category: _scStr(v.category), status: v.status,
      escalate: !!v.escalate, position: _scStr(v.position), quote: _scStr(v.quote),
      accepted: (v.accepted && v.accepted.at) ? { by: _scStr(v.accepted.by), at: v.accepted.at,
        why: _scStr(v.accepted.why) } : null }));
  return { none: false, unread: false, stale: _scCall('playbookStale', c),
    label: _scStr(rev.label), total: rev.verdicts.length,
    open: findings.filter(f => !f.accepted).length, findings };
}

/* ---- WHAT THE FINAL WORDING PROMISES, AND WHAT THE LIST HOLDS ----
   `unread` is the question that matters here: the obligations on file were
   read out of some wording, and rounds of redlines can add a promise nobody
   recorded. obligationsReadHash is the stamp the scan leaves; comparing it to
   the wording NOW is the whole reading. null where nothing has ever read it,
   or where the hasher is not on this stage. */
function signCheckObligations(c){
  const list = Array.isArray(c && c.obligations) ? c.obligations : [];
  const text = _scCall('playbookText', c) || '';
  let unread = null;
  const seen = _scStr(c && c.obligationsReadHash);
  if (!seen) unread = null;                       /* never read: we do not know */
  else {
    const now = _scCall('playbookHashOf', text);
    unread = now ? (String(now) !== seen) : null;
  }
  const dateless = list.filter(o => o && !_scStr(o.due)).length;
  /* Nobody the reminder can reach is a fact about a promise, not a complaint:
     obligationReminderTo is the browser twin the Insights page already asks. */
  const ownerless = list.filter(o => {
    if (!o) return false;
    const to = _scCall('obligationReminderTo', c, o);
    return !to;
  }).length;
  return { total: list.length, unread, readAt: _scStr(c && c.obligationsReadAt) || null,
    dateless, ownerless };
}

/* ---- THE RECORD AGAINST THE PAPER ----
   Arithmetic, and free. `metadata` is what was READ OUT OF THE WORDING; the
   fields beside it are what the record SAYS. Where the paper carries no figure
   the row is `unknown` and agrees with nothing — an absence, stated.

   MONEY ONLY WHERE THE READER MAY SEE VALUES, asked once, so a reader without
   that right is not shown a value row at all rather than shown dashes. */
const SIGN_RECORD_ROWS = [
  { field: 'value', money: true },
  { field: 'effectiveDate' },
  { field: 'expiryDate' },
  { field: 'counterparty' },
];
function signCheckRecordValue(c, field){
  const f = (c && c.fields) || {};
  if (field === 'value') return c && c.value != null && c.value !== '' ? String(c.value) : '';
  if (field === 'effectiveDate') return _scStr(f.effDate);
  if (field === 'expiryDate') return _scStr((c && c.expiry) || f.expiry || '');
  if (field === 'counterparty') return _scStr(c && c.counterparty);
  return '';
}
function signCheckRecord(c){
  const m = (c && c.metadata) || {};
  const kept = (c && c.recordAccepted) || {};
  const mayMoney = _scCall('canViewValues') !== false;
  const rows = [];
  for (const spec of SIGN_RECORD_ROWS){
    if (spec.money && !mayMoney) continue;
    const paper = _scStr(m[spec.field]);
    const record = _scStr(signCheckRecordValue(c, spec.field));
    const unknown = !paper;
    /* Numbers compare as numbers and text as folded text: "KES 36000000" and
       "36,000,000" are the same figure, and a row that says otherwise would
       send somebody to fix a record that is already right. */
    const same = unknown ? null
      : spec.field === 'value'
        ? Number(String(record).replace(/[^\d.-]/g, '')) === Number(String(paper).replace(/[^\d.-]/g, ''))
        : record.replace(/\s+/g, ' ').toLowerCase() === paper.replace(/\s+/g, ' ').toLowerCase();
    rows.push({ field: spec.field, record, paper, unknown,
      agrees: same, kept: (kept[spec.field] && kept[spec.field].at) ? kept[spec.field] : null });
  }
  return { rows, open: rows.filter(r => r.agrees === false && !r.kept).length };
}

/* ---- THE BRIEF IS READ ON ARRIVAL AND NEVER AGAIN (Young ruled 15 Sep 2026) ----
   Four things are read when a contract arrives — the brief, our standards, the
   obligations and the filing — and before a signature the check re-ran TWO of
   them. The brief is the one written for a person rather than for a rule, and
   it was the one nobody ever looked at again, however far the wording moved in
   negotiation.

   STALENESS IS ASKED OF THE RECORD, NOT OF A HASH, and that is a deliberate
   limit. The brief's own inputHash is computed on the SERVER over the text it
   sent; the browser cannot reproduce it, and a second hasher that drifted
   would call fresh briefs stale for ever — the same trap the overnight
   playbook sweep is deliberately kept out of. So the question asked here is
   one the record can answer exactly: HAS ANY WORDING BEEN PROPOSED SINCE THIS
   BRIEF WAS WRITTEN. c.changes and c.negotiation.rounds are read RAW.

   IT CAN OVER-REPORT, and that is the safe direction: a change that was
   refused moved no wording, and this will still offer a re-read. Offering a
   reading nobody needed costs one press; hiding one they did costs a signature
   over a summary of wording that is no longer there. */
function signCheckBriefAt(c){
  let last = 0;
  const walk = list => (list || []).forEach(ch => {
    const t = Date.parse(String((ch && (ch.at || ch.filedAt)) || '')) || 0;
    if (t > last) last = t;
  });
  walk(c && c.changes);
  const n = c && c.negotiation;
  if (n && Array.isArray(n.rounds)) n.rounds.forEach(r => walk(r && r.changes));
  return last;
}
function signCheckBrief(c){
  const b = (c && c._brief) || null;
  /* THE BRIEF IS TRANSPORT, so a record that is not the heavy one carries the
     FLAG and not the brief. A brief we cannot see is not a brief that is not
     there: it answers "we do not know", draws no row and offers no re-read,
     because guessing here spends the reader's money on a reading that may be
     perfectly current. */
  if (!b && c && c._hasBrief) return { none: false, unknown: true, stale: null, at: '', by: '', truncated: false };
  if (!b) return { none: true, stale: null, at: '', by: '', truncated: false };
  const at = String(b.at || '');
  const made = Date.parse(at) || 0;
  const moved = signCheckBriefAt(c);
  /* Null is "we do not know", exactly as playbookStale answers it: no date on
     the brief, or no dated change to compare it with. */
  const stale = (!made || !moved) ? null : moved > made;
  return { none: false, stale, at, by: String(b.by || ''), truncated: !!b.truncated };
}

/* ---- THE ONE READING, AND THE ONLY THING THE CARD IS ALLOWED TO ASK ---- */
function signCheck(c){
  if (!c) return null;
  const ready = signCheckReady(c);
  const waiting = signCheckWaiting(c);
  const brief = signCheckBrief(c);
  const standards = signCheckStandards(c);
  const obligations = signCheckObligations(c);
  const record = signCheckRecord(c);
  /* WHAT WOULD HOLD A SIGNATURE if the gate is set to require. Three questions,
     named here once so the card, the blocker and the server cannot come to
     three different answers about what "open" means. */
  const open = {
    standards: standards.open > 0 || standards.unread === true,
    obligations: obligations.unread === true,
    record: record.open > 0,
  };
  const checked = (c.signCheck && c.signCheck.at) ? c.signCheck : null;
  const current = checked && checked.wordingHash
    && String(checked.wordingHash) === String(_scCall('playbookHashOf', _scCall('playbookText', c) || '') || '');
  return { ready, waiting, brief, standards, obligations, record, open,
    anyOpen: !!(open.standards || open.obligations || open.record),
    checked, current: checked ? !!current : null };
}


/* ============================================================
   THE GATE — ADVISE BY DEFAULT (13 Sep 2026, the signing flow rebuilt)
   ============================================================
   Three settings, one meaning each, read here and mirrored by the server's
   scGate so the browser and the wall cannot disagree:
     off     — nothing on the check holds a signature; the rows are still drawn.
     advise  — THE DEFAULT. An ESCALATED departure holds until the colleague
               asked, or an admin, clears it. Everything else on the check is
               shown and can be accepted by the signer with a written reason.
     require — every open row on the check holds.
   The owner's ruling on the defaults (13 Sep 2026): "escalations, approvals,
   turn, blanks and signers hold; departures and risk findings are shown and
   acceptable with a reason."

   IT IS A SECOND ROW IN THE APPROVAL CHAIN'S KIND OF QUESTION, not a fourth
   kind of gate. The desk gates redlining and sending, the review gates
   sending; this gates signing, like the approval chain, and nothing else. */
const SIGN_CHECK_GATES = ['off', 'advise', 'require'];
const SIGN_CHECK_GATE_DEFAULT = 'advise';
function signCheckGate(){
  let st = null; try{ st = window.state; }catch(_){ st = null; }
  const v = st && st.settings && st.settings.signCheckGate;
  return SIGN_CHECK_GATES.includes(v) ? v : SIGN_CHECK_GATE_DEFAULT;
}
/* Kept for the callers that asked the old yes/no question: "does the check
   hold anything at all on this workspace". */
function signCheckApplies(c){ return !!c && signCheckGate() !== 'off'; }

/* ---- ESCALATE MEANS SOMEBODY ELSE ----
   A finding the playbook marks `escalate` is one the person about to sign may
   not wave through alone. `v.escalation` is the ask — {to:{id,name}, by, byId,
   at, note} — stamped by signCheckEscalate; `v.accepted` is the answer, and
   carries `byId` so the wall can tell who gave it.
   WHO MAY ACCEPT: an ordinary departure, anyone who can sign; an escalated
   one, the colleague it was sent to, or an admin. Nobody asked yet is not a
   loophole — the signer still cannot, and an admin still can. */
function signCheckMayAccept(c, v, user){
  if (!v) return false;
  if (!v.escalate) return true;
  const u = user || _scCall('currentUser') || null;
  if (!u) return false;
  if (String(u.role || '') === 'admin') return true;
  const to = v.escalation && v.escalation.to;
  return !!(to && to.id && String(to.id) === String(u.id));
}
/* An escalated finding accepted by somebody who was not allowed to: the
   record shows an acceptance and the wall must still hold. Asked of the
   stamped acceptance, never of who is looking. */
function signCheckAcceptedProperly(v){
  const a = v && v.accepted;
  if (!a || !a.at) return false;
  if (!v.escalate) return true;
  if (String(a.role || '') === 'admin') return true;
  const to = v.escalation && v.escalation.to;
  return !!(to && to.id && a.byId && String(to.id) === String(a.byId));
}

/* ---- THE ROWS OF THE CHECK, AND WHICH OF THEM HOLD ----
   One row per finding, per record disagreement, and one for the obligations
   read — the itemised shape of signCheck's three counts, so the card, the
   button and the server count the same things. `holds` is the gate's answer
   for THIS row; `settled` rows are kept so the card can fold them under a
   count rather than silently dropping what a colleague already dealt with. */
function signCheckRowHolds(row, gate){
  const g = gate || signCheckGate();
  if (row.settled) return false;
  if (g === 'off') return false;
  if (g === 'require') return true;
  /* THE CHECK HAS TO HAVE BEEN RUN (owner-reported 13 Sep 2026: "the
     platform allows me to sign if I meet all the other requirements but
     before I run the check, which is nonsensical"). A row that says nothing
     has read this wording — against the playbook, or for promises — holds
     until the sweep has run against THIS wording (`current`), on advise as
     on require. What the reading then FINDS follows the gate as before. */
  /* A ROW THAT CANNOT RUN YET DOES NOT HOLD. The negotiation row above it is
     already holding for the same reason, and one fact holding a signature
     twice reads as two problems. */
  if (row.waiting) return false;
  if (row.kind === 'brief' || row.kind === 'standards-read' || row.kind === 'obligations') return !row.current;
  return row.kind === 'standard' && !!row.escalate;      /* advise */
}

/* ---- THREE STAGES, IN THE ORDER A PERSON ASKS THEM (Young ruled 15 Sep 2026) ----
   *"Review the best approach to managing the final check and offer a seamless
   solution that is straightforward for a user."*

   The rows were ordered by WEIGHT, which is correct machinery and tells a
   reader nothing about why any row is there. Three named questions do:
     1  Is the paper final?            — the wording, and the blanks in it
     2  Has anyone read THIS version?  — the four readings, and what they found
     3  Who approves, and who signs?   — the people
   The order is not a preference: settling the negotiation invalidates the
   readings, so the readings sit AFTER it and not beside it.

   A kind missing from this map lands in stage 1, which is the honest default:
   an unrecognised blocker is something about the paper until somebody says
   otherwise, and it draws at the top where it will be seen. */
const SIGN_STAGES = ['paper', 'read', 'people'];
const SIGN_STAGE_OF = {
  negotiation: 'paper', fields: 'paper', placeholders: 'paper', docs: 'paper',
  brief: 'read', 'standards-read': 'read', standard: 'read', obligations: 'read',
  record: 'read', risk: 'read',
  approval: 'people', turn: 'people', signers: 'people', spots: 'people',
  cap: 'people', folder: 'people',
};
const signStageOf = kind => SIGN_STAGE_OF[String(kind || '')] || 'paper';
function signCheckRows(c, r){
  const rd = r || signCheck(c);
  if (!rd || !rd.ready) return [];
  const rows = [];
  /* THE BRIEF LEADS THE READINGS: it is the one written for a person, so it is
     the one a reader looks at first. Absent is its own answer — a contract
     nobody has ever briefed is not "fine". */
  if (rd.brief.none || rd.brief.stale === true || rd.brief.truncated)
    rows.push({ kind: 'brief', key: 'brief', never: !!rd.brief.none,
      stale: rd.brief.stale === true, truncated: !!rd.brief.truncated,
      at: rd.brief.at, settled: false, escalate: false });
  const s = rd.standards;
  if (s.unread === true || s.stale === true)
    rows.push({ kind: 'standards-read', key: 'standards-read', stale: s.stale === true, settled: false, escalate: false });
  s.findings.forEach(f => {
    const v = c.playbook && Array.isArray(c.playbook.verdicts) ? c.playbook.verdicts[f.i] : null;
    const properly = signCheckAcceptedProperly(v);
    rows.push({ kind: 'standard', key: 'std:' + f.i, i: f.i, category: f.category, status: f.status,
      position: f.position, quote: f.quote, escalate: f.escalate,
      escalation: v && v.escalation ? v.escalation : null,
      accepted: f.accepted, settled: !!f.accepted && properly,
      /* accepted, but by somebody who may not: shown as open, said in words */
      badAccept: !!f.accepted && !properly });
  });
  /* Never read is its own row: `unread` null is "nothing has ever read this
     wording for promises", which is not "fine" — an absence, stated. */
  if (rd.obligations.unread === true || rd.obligations.unread == null)
    rows.push({ kind: 'obligations', key: 'obligations', never: rd.obligations.unread == null,
      settled: false, escalate: false });
  rd.record.rows.filter(x => x.agrees === false).forEach(x => rows.push({
    kind: 'record', key: 'rec:' + x.field, field: x.field, record: x.record, paper: x.paper,
    kept: x.kept, settled: !!x.kept, escalate: false }));
  const gate = signCheckGate();
  rows.forEach(row => {
    row.current = rd.current === true;
    row.stage = signStageOf(row.kind);
    /* Only the READINGS wait — a departure the review already found is a fact
       about wording on the table now, and settling it is work the reader can
       do while the round is open. */
    row.waiting = !!(rd.waiting && (row.kind === 'brief'
      || row.kind === 'standards-read' || row.kind === 'obligations'));
    row.waitingWhy = row.waiting ? rd.waiting : '';
    row.holds = signCheckRowHolds(row, gate);
  });
  return rows;
}
/* The check rows that hold a signature RIGHT NOW. The one count signBlockers'
   row carries and signReadiness reads — so the two cannot drift. */
function signCheckHolding(c){
  return signCheckRows(c).filter(x => x.holds);
}
function signCheckBlocker(c){
  if (!c) return null;
  const n = signCheckHolding(c).length;
  return n ? { key: 'signcheck', n } : null;
}

/* ============================================================
   ONE LIST BEFORE THE SIGNATURE (13 Sep 2026 — the signing audit's piece 1)
   ============================================================
   Five surfaces each printed their own number: the button, the check card,
   the red risk line, the head, Home. signReadiness is the one reading of
   "what stands between this reader and signing", and every one of them
   quotes it.

   A ROW IS ONE THING TO SETTLE, in the order of its weight:
     · the rows signBlockers already carries (approval, turn, negotiation,
       blanks, fields, cap, folder, spots, signers) — every one HOLDS;
     · the check's own rows (standards, obligations, record) — holding or
       merely shown, by the gate;
     · the risk scan's open high findings — shown, never holding.
   `holds` is what stops the button; `noted` is what the signer is signing
   over with their eyes open; `settled` is what was dealt with. */
const SIGN_RISK_SEV = 'high';
function signReadiness(c, opts){
  if (!c) return { rows: [], holds: [], noted: [], settled: [], open: [], n: 0 };
  const rows = [];
  const bl = _scCall('signBlockers', c) || [];
  bl.filter(b => b && b.key !== 'signcheck').forEach(b => rows.push({
    kind: b.key, key: 'bl:' + b.key, label: b.label, short: b.short,
    stage: signStageOf(b.key), holds: true, settled: false }));
  /* THE LIGHT LIST: a register row carries no wording (HEAVY strips an
     upload's text), so the two rows that hash the wording — "the review is
     about earlier wording", "the wording moved since the obligations were
     read" — cannot be answered off it and would answer wrongly. A caller
     reading a light record says so, and those two rows are left out rather
     than guessed. The rest is on the record and survives the list. */
  const light = !!(opts && opts.light);
  signCheckRows(c).filter(r => !(light && (r.kind === 'brief'
    || r.kind === 'standards-read' || r.kind === 'obligations')))
    .forEach(r => rows.push(r));
  const findings = _scCall('openFindings', c) || [];
  findings.filter(f => f && f.sev === SIGN_RISK_SEV).forEach(f => rows.push({
    kind: 'risk', key: 'risk:' + f.id, id: f.id, title: f.title, what: f.what, fix: f.fix,
    anchor: f.anchor, stage: signStageOf('risk'), holds: false, settled: false }));
  /* HOLDING FIRST, then what is merely open, then what was settled — and
     escalations lead the holds, because they are the ones the signer cannot
     settle alone. */
  const rank = r => r.settled ? 3 : r.holds ? (r.escalate ? 0 : 1) : 2;
  const ordered = rows.map((r, i) => ({ r, i })).sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i).map(x => x.r);
  const holds = ordered.filter(r => r.holds);
  const noted = ordered.filter(r => !r.holds && !r.settled);
  const settled = ordered.filter(r => r.settled);
  return { rows: ordered, holds, noted, settled, open: holds.concat(noted), n: holds.length };
}

if (typeof window !== 'undefined') Object.assign(window, {
  SIGN_ACCEPT_MAX, SIGN_RECORD_ROWS, SIGN_CHECK_GATES, SIGN_CHECK_GATE_DEFAULT, SIGN_RISK_SEV,
  signCheckGate, signCheckApplies, signCheckBlocker, signCheckMayAccept, signCheckAcceptedProperly,
  signCheckRowHolds, signCheckRows, signCheckHolding, signReadiness,
  signCheck, signCheckReady, signCheckTableClear, signCheckWaiting,
  signCheckBrief, signCheckBriefAt, SIGN_STAGES, SIGN_STAGE_OF, signStageOf,
  signCheckStandards, signCheckObligations, signCheckRecord, signCheckRecordValue,
});
