/* ============================================================
   THE CHECK BEFORE SIGNING, AS A WALL — one reading for both hosts
   (the process review's signing-links stream, 4 Oct 2026)
   ============================================================
   js/signcheck.js is the card and the button; server/server.js is the wall.
   They used to answer "does the check hold this signature" with two pieces of
   arithmetic, and on the default gate (advise) they disagreed: the browser held
   an unread brief and an escalated departure whose acceptance had gone stale
   under moved wording, and the server held neither. This file is the part both
   of them can answer from the RECORD ALONE, loaded by the browser (js/app.js)
   and required by the server — the signapproval.js pattern — so the screen and
   the wall ask the same questions of the same record.

   THE RULE ON "advise", chosen to match the documented intent (signcheck.js's
   gate comment and the owner's rulings of 13 and 21 Sep 2026):
     · the CONTRACT is held by an escalated departure that the colleague it was
       escalated to (or an admin) has not accepted — or whose acceptance was
       given against wording that has since moved (`staleQuote`);
     · OUR OWN SIGNER is held, in the app, by a brief that stands for this
       wording and that THEY have not read (each signer's own; the counterparty
       is never asked about our brief).
   On "require" every open departure holds too; on "off" nothing does.

   WHAT STAYS THE BROWSER'S ALONE, SAID HERE RATHER THAN DISCOVERED: whether the
   standards and obligations readings were made against THIS wording is a text
   hash the browser computes over the painted document (playbookHashOf over
   docPlainText). A server twin would have to agree byte for byte or it would
   refuse real signatures for ever, so that question holds the in-app button
   and is not a wall. The browser is therefore never LESS strict than the wall:
   everything this file holds, the card holds by calling it.

   It spends nothing, writes nothing and calls no route. */

/* ---- WHEN WORDING WAS LAST PROPOSED ----
   The newest date a filed change carries, across c.changes and the closed
   rounds, read RAW (READING MUST NOT WRITE). negoFileChange stamps createdAt
   and a revision moves updatedAt; `at`/`filedAt` stay for older shapes. 0 is
   "we do not know". signcheck.js's signCheckBriefAt is this function. */
const SG_PROPOSED_AT_KEYS = ['createdAt', 'updatedAt', 'at', 'filedAt'];
function sgLastProposedAt(c){
  let last = 0;
  const walk = list => (Array.isArray(list) ? list : []).forEach(ch => {
    if (!ch) return;
    for (const k of SG_PROPOSED_AT_KEYS){
      const t = Date.parse(String(ch[k] || '')) || 0;
      if (t > last) last = t;
    }
  });
  walk(c && c.changes);
  const n = c && c.negotiation;
  if (n && Array.isArray(n.rounds)) n.rounds.forEach(r => walk(r && r.changes));
  return last;
}

/* ---- IS A DEPARTURE SETTLED ----
   Accepted, by somebody entitled to accept it, against the wording that is
   there now. An ordinary departure may be accepted by anyone who can sign; an
   escalated one only by the colleague it was escalated to, or an admin. The
   admin question is asked of the STAMPED acceptance (its role, or `isAdmin`
   on its byId — the server looks the id up on the users table, the browser on
   its roster), never of who is looking. */
function sgAcceptedProperly(v, isAdmin){
  const a = v && v.accepted;
  if (!a || !a.at) return false;
  if (!v.escalate) return true;
  const to = v.escalation && v.escalation.to;
  if (to && to.id && a.byId && String(to.id) === String(a.byId)) return true;
  if (String(a.role || '') === 'admin') return true;
  if (a.byId && typeof isAdmin === 'function'){
    try { if (isAdmin(String(a.byId))) return true; } catch (_) {}
  }
  return false;
}
function sgDepartureSettled(v, isAdmin){
  const a = v && v.accepted;
  return !!(a && a.at) && sgAcceptedProperly(v, isAdmin) && !a.staleQuote;
}

/* ---- THE DEPARTURES THAT HOLD SIGNING, PER GATE ----
   One row per open departure ({i, category, escalate, why}); `holds` is the
   gate's answer for it. `why` is a machine word the two hosts turn into their
   own sentence: 'unaccepted', 'escalated', 'wrong-person', 'stale'. */
const SG_GATES = ['off', 'advise', 'require'];
function sgGateOf(v){ return SG_GATES.includes(v) ? v : 'advise'; }
function sgDepartures(c, opts){
  const o = opts || {};
  const gate = sgGateOf(o.gate);
  const pb = c && c.playbook;
  const out = [];
  if (!pb || !Array.isArray(pb.verdicts)) return out;
  pb.verdicts.forEach((v, i) => {
    if (!v || (v.status !== 'deviation' && v.status !== 'missing')) return;
    if (sgDepartureSettled(v, o.isAdmin)) return;
    const a = v.accepted;
    const why = (a && a.at)
      ? (sgAcceptedProperly(v, o.isAdmin) ? 'stale' : 'wrong-person')
      : (v.escalate ? 'escalated' : 'unaccepted');
    const holds = gate === 'require' || (gate === 'advise' && !!v.escalate);
    out.push({ i, category: String(v.category || ''), escalate: !!v.escalate, why, holds });
  });
  return out;
}

/* ---- THE BRIEF, READ BY THIS SIGNER ----
   A brief STANDS for this wording when it is there, was not cut short, and no
   wording has been proposed since it was written. The stamp a signer leaves
   (c.briefRead[who].key) is made against exactly that brief and that wording,
   so either half moving lapses it. `brief` is {at, truncated}: the browser
   passes c._brief, the server its own briefs-table row. */
function sgBriefKey(c, brief){
  const made = brief && brief.at ? String(brief.at) : '';
  if (!made) return '';
  return made + '|' + String(sgLastProposedAt(c) || 0);
}
function sgBriefStands(c, brief){
  if (!brief || !brief.at || brief.truncated) return false;
  const made = Date.parse(String(brief.at)) || 0;
  const moved = sgLastProposedAt(c);
  if (made && moved && moved > made) return false;
  return !!sgBriefKey(c, brief);
}
function sgBriefReadBy(c, brief, who){
  const key = sgBriefKey(c, brief);
  if (!key || !who) return false;
  const all = (c && c.briefRead) || null;
  const row = all && all[String(who)];
  return !!(row && row.at && String(row.key || '') === key);
}
/* Owed: a brief stands, the gate is not off, and this signer has no stamp
   against it. A signer we cannot name is never asked — there is nobody whose
   reading could be recorded. */
function sgBriefReadOwed(c, brief, who, gate){
  if (sgGateOf(gate) === 'off') return false;
  if (!who) return false;
  if (!sgBriefStands(c, brief)) return false;
  return !sgBriefReadBy(c, brief, who);
}

/* ---- WHAT HOLDS, IN ONE LIST ----
   `forSigner` {who, brief} asks the in-app signer's own question as well; a
   signing link (or the counterparty's signature) leaves it out. Each row is
   {kind:'standard'|'brief-read', ...}. Empty where nothing holds. */
function sgHolds(c, opts){
  const o = opts || {};
  const gate = sgGateOf(o.gate);
  if (gate === 'off' || !c) return [];
  const rows = sgDepartures(c, { gate, isAdmin: o.isAdmin }).filter(r => r.holds)
    .map(r => ({ kind: 'standard', ...r }));
  const s = o.forSigner;
  if (s && sgBriefReadOwed(c, s.brief, s.who, gate)) rows.push({ kind: 'brief-read' });
  return rows;
}

const SG_API = { SG_GATES, SG_PROPOSED_AT_KEYS, sgGateOf, sgLastProposedAt, sgAcceptedProperly,
  sgDepartureSettled, sgDepartures, sgBriefKey, sgBriefStands, sgBriefReadBy, sgBriefReadOwed, sgHolds };
if (typeof window !== 'undefined') Object.assign(window, SG_API);
if (typeof module !== 'undefined' && module.exports) module.exports = SG_API;
