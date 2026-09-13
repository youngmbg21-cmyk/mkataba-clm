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
function signCheckReady(c){
  if (!c) return false;
  if (_scCall('negoExecuted', c)) return false;
  if (String(c.status || '') === 'Signed' || String(c.status || '') === 'Declined') return false;
  const route = _scCall('signingRouteOpen', c);
  if (route !== true) return false;
  return signCheckTableClear(c);
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

/* ---- THE ONE READING, AND THE ONLY THING THE CARD IS ALLOWED TO ASK ---- */
function signCheck(c){
  if (!c) return null;
  const ready = signCheckReady(c);
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
  return { ready, standards, obligations, record, open,
    anyOpen: !!(open.standards || open.obligations || open.record),
    checked, current: checked ? !!current : null };
}


/* ============================================================
   THE GATE, OFF BY DEFAULT (phase 5)
   ============================================================
   By default the card tells you things and blocks nothing at all. An admin can
   set it to `require`, and then it joins the things that already hold a
   signature back, in exactly their shape: one row in signBlockers, naming what
   is open.

   IT IS A SECOND ROW IN THE APPROVAL CHAIN'S KIND OF QUESTION, not a fourth
   kind of gate. The rulebook's line stands: the desk gates redlining and
   sending, the approval chain gates signing, the review gates sending. This
   gates signing, like the approval chain, and never anything else. */
const SIGN_CHECK_GATES = ['off', 'advise', 'require'];
function signCheckGate(){
  let st = null; try{ st = window.state; }catch(_){ st = null; }
  const v = st && st.settings && st.settings.signCheckGate;
  return SIGN_CHECK_GATES.includes(v) ? v : 'off';
}
/* THE ONE PREDICATE every enforcement point asks — the review gate's own shape,
   so a gate enforced in one place and not the other cannot happen. */
function signCheckApplies(c){ return !!c && signCheckGate() === 'require'; }
/* WHAT WOULD HOLD A SIGNATURE, counted. Null where the gate is off, where the
   moment has not come, or where nothing is open — a blocker that is always
   there is furniture. */
function signCheckBlocker(c){
  if (!signCheckApplies(c)) return null;
  const r = signCheck(c);
  if (!r || !r.ready || !r.anyOpen) return null;
  const n = (r.standards.open || 0) + (r.standards.unread ? 1 : 0)
    + (r.record.open || 0) + (r.obligations.unread === true ? 1 : 0);
  return n ? { key: 'signcheck', n } : null;
}

if (typeof window !== 'undefined') Object.assign(window, {
  SIGN_ACCEPT_MAX, SIGN_RECORD_ROWS, SIGN_CHECK_GATES,
  signCheckGate, signCheckApplies, signCheckBlocker,
  signCheck, signCheckReady, signCheckTableClear,
  signCheckStandards, signCheckObligations, signCheckRecord, signCheckRecordValue,
});
