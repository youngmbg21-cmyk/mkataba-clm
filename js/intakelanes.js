/* ---- A REQUEST'S LANE AND ITS ANSWERS: ONE READING, TWO HOSTS (4 Oct 2026) ----
   The process review's Requests stream: the lanes ran only in an editor's
   OPEN browser, so a request a rule would have cleared in seconds waited for
   somebody to have HaTi open. They run on the server now (runIntakeLanes,
   server/server.js), and the Requests page still says which lane a request
   would take — so the matching rule is written ONCE, here, and both hosts ask
   it. Like js/roundprep.js: globals in the browser, a require on the server.

   AND THE ANSWERS A REQUEST CARRIES. The request form asks the same
   essentials Create asks (CONTRACT_ESSENTIALS, js/templatefields.js): our
   party, their name and email, the stream, the value and which side of the
   money we are on, the start and the end. All optional. They are kept on the
   request as plain strings under these keys — the essentials' own keys — so
   the drafting screen's prefill (draftApplyPrefill) and a lane's server mint
   read the same map. Nothing outside this list is ever stored. */

/* THE WORDS THAT MEAN "THEIR PAPER" — see js/views/intake.js's intakeRoad for
   why two words may sit between "their" and the noun. THEIR PAPER IS NEVER
   ROUTINE: no lane clears it, whatever else the lane says. */
const IK_THEIR_PAPER = /\btheir (?:own\s+)?(?:\w+\s+){0,2}(?:paper|terms|form|template|contract|agreement|draft|nda|msa)\b|\bthey (?:have )?sent\b|\bsent (?:us|their)\b|\breview (?:their|the attached)\b|\bon their paper\b/i;
const IK_MONEY = /(?:KES|Ksh|USD|EUR|GBP|\$|€|£)\s?[\d,.]+|\b\d[\d,.]*\s?(?:m|million|bn|billion)\b/i;

/* The answer keys a request may carry beyond its own columns (counterparty
   and folder are columns of their own, as they always were). */
const INTAKE_ANSWER_KEYS = ['party', 'cpemail', 'value', 'side', 'effDate', 'expiry'];
const INTAKE_SIDES = ['customer', 'supplier'];

/* Clean what a body or a stored row says into the map above: strings only,
   bounded, an email that looks like one, a value that is a number not below
   zero, a side from the list, a day as YYYY-MM-DD. Anything else is dropped,
   never guessed — an absence is an absence. An end before the start drops
   the end, because a term that runs backwards is a typo, not a fact. */
function intakeAnswersClean(a){
  const src = (a && typeof a === 'object') ? a : {};
  const out = {};
  const s = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
  const party = s(src.party, 200); if (party) out.party = party;
  const em = s(src.cpemail, 200); if (em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) out.cpemail = em;
  const vRaw = s(src.value, 40).replace(/[,\s]/g, '');
  if (vRaw && /^\d+(\.\d+)?$/.test(vRaw) && Number(vRaw) > 0) out.value = vRaw;
  const side = s(src.side, 20); if (INTAKE_SIDES.includes(side)) out.side = side;
  const day = v => { const d = s(v, 10); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''; };
  const eff = day(src.effDate); if (eff) out.effDate = eff;
  const exp = day(src.expiry); if (exp && !(eff && exp < eff)) out.expiry = exp;
  return out;
}

/* The prefill a request hands the drafting screen: its answers plus its two
   columns, keyed as the essentials and the built-in questions key them. */
function intakePrefillOf(r){
  if (!r) return {};
  const out = { ...intakeAnswersClean(r.answers) };
  if (r.counterparty) out.counterparty = String(r.counterparty);
  if (r.folder) out.folder = String(r.folder);
  return out;
}

/* WHICH LANE CLEARS THIS REQUEST, or null. `lanes` is the workspace's own
   list (settings → intakeLanes); `knownCp(name)` answers whether we have dealt
   with this counterparty before, asked of whichever book the host holds.
   Every condition a lane does not state is a condition it does not test. */
function intakeLaneMatch(r, lanes, knownCp){
  if (!r || r.status !== 'open' || r.lane || r.contractId) return null;
  const text = `${r.title || ''} ${r.need || ''}`;
  for (const L of (Array.isArray(lanes) ? lanes : [])){
    if (!L || L.on === false || !L.template) continue;
    if (L.folder && String(L.folder) !== String(r.folder || '')) continue;
    if (IK_THEIR_PAPER.test(text)) continue;
    if (L.knownOnly && !(typeof knownCp === 'function' && knownCp(r.counterparty))) continue;
    /* A FIGURE IN THE ASK IS A FIGURE THE LANE HAS TO BE ABLE TO CLEAR. A lane
       with a ceiling clears a stated value at or under it, refuses one over
       it, and refuses money mentioned only in the words, because the amount
       would be a guess. */
    if (L.maxValue != null && L.maxValue !== ''){
      const v = Number((intakeAnswersClean(r.answers)).value || 0);
      if (v > Number(L.maxValue)) continue;
      if (!v && IK_MONEY.test(text)) continue;
    }
    if (L.words){ try{ if (!new RegExp(L.words, 'i').test(text)) continue; }catch(_){ continue; } }
    return L;
  }
  return null;
}

/* THE REQUEST'S ANSWERS ONTO A FRESH RECORD — the server's lane mint. The
   same fields applyTemplateValues (js/templatefields.js) writes for these
   keys, each marked `high` because a person typed it. A template that carries
   no money (valueType 'none') takes no value. Returns the record. */
function intakeAnswersOnto(c, r){
  if (!c || !r) return c;
  const a = intakePrefillOf(r);
  c.fields = c.fields || {};
  c.metadata = c.metadata || {}; c.metadata.confidence = c.metadata.confidence || {};
  c.metadata.templateFields = c.metadata.templateFields || {};
  const set = (k, v) => { c.metadata[k] = v; c.metadata.confidence[k] = 'high'; };
  const field = (k, v) => { c.fields[k] = v; c.metadata.templateFields[k] = v; };
  if (a.party){ c.party = a.party; set('party', a.party); field('party', a.party); }
  if (a.counterparty){ c.counterparty = a.counterparty; set('counterparty', a.counterparty); field('counterparty', a.counterparty); }
  if (a.cpemail) c.counterpartyEmail = a.cpemail;
  if (a.value && c.valueType !== 'none'){ c.value = Number(a.value) || 0; set('value', c.value); field('value', c.value); }
  if (a.side){ set('category', a.side); field('side', a.side); }
  if (a.effDate){ c.fields.effDate = a.effDate; c.metadata.templateFields.effDate = a.effDate; set('effectiveDate', a.effDate); }
  if (a.expiry){ c.expiry = a.expiry; set('expiryDate', a.expiry); field('expiry', a.expiry); }
  return c;
}

/* ---- WHOSE A LANE'S DRAFT IS (4 Oct 2026, the process review's last gaps) ----
   A draft a lane minted on the server had NO OWNER: nobody's list, nobody's
   bell, nobody's reminders. Each lane names one (`ownerId`, picked on the
   lanes panel from the members who may draft); where it names nobody, or
   somebody who can no longer hold it, the draft is the admin's who last SAVED
   the lane (`savedById`, stamped by the server on PUT /api/settings and never
   read from a body), else the FIRST admin. ONE reading, both hosts: the
   panel says which of the three it will be, and the server's mint asks the
   same question, so the row and the record cannot disagree.

   `users` in the order the server keeps them (created first, first);
   `mayHold(u)` is the host's own extra test — the server asks whether the
   person can see the request's stream, the panel whether they can see the
   lane's. A Viewer never holds a draft: they may not draft at all. Returns
   { id, name, how } with how = 'named' | 'saver' | 'first', or null where the
   workspace has no admin to fall back on — an absence, never a guess. */
const _iklCreated = u => String((u && (u.createdAt || u.created_at)) || '');
function intakeLaneOwner(L, users, mayHold){
  const list = (Array.isArray(users) ? users : []).filter(u => u && u.id != null);
  const may = u => !!u && u.role !== 'viewer' && (typeof mayHold !== 'function' || !!mayHold(u));
  const byId = id => (id == null || id === '') ? null : (list.find(u => String(u.id) === String(id)) || null);
  const out = (u, how) => ({ id: u.id, name: String(u.name || ''), how });
  const named = byId(L && L.ownerId);
  if (named && may(named)) return out(named, 'named');
  const saver = byId(L && L.savedById);
  if (saver && saver.role === 'admin' && may(saver)) return out(saver, 'saver');
  const first = list.filter(u => u.role === 'admin')
    .map((u, i) => ({ u, i }))
    .sort((a, b) => _iklCreated(a.u).localeCompare(_iklCreated(b.u)) || a.i - b.i)
    .map(x => x.u).find(may);
  return first ? out(first, 'first') : null;
}

const IKL_API = { IK_THEIR_PAPER, IK_MONEY, INTAKE_ANSWER_KEYS, INTAKE_SIDES,
  intakeAnswersClean, intakePrefillOf, intakeLaneMatch, intakeAnswersOnto, intakeLaneOwner };
if (typeof window !== 'undefined') Object.assign(window, IKL_API);
if (typeof module !== 'undefined' && module.exports) module.exports = IKL_API;
