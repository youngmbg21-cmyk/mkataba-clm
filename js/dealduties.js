/* ============================================================
   WHO DOES WHAT — the one reading both sides tick
   (owner, 22 Nov 2026: "Build l+s and Legora way for the other side";
   the drawing "Agree who does what, before you sign")
   ============================================================
   ONE LIST, READ ONCE. The duties are the ones Jambo already read off the
   paper when the contract arrived (c.triage.steps.oblig.found: what must be
   done, the paper's own words, the clause, whose job). Nothing here asks a
   model: showing the list spends nothing, and a contract Jambo has not read
   shows no list (read: false), never a guessed one.

   WHOSE IS READ, NEVER GUESSED: a duty already on the contract's own
   obligations list carries the side a person gave it (party 'ours' or
   'theirs'); otherwise Jambo's reading of the wording (us · them · both);
   "unsure" stays NOT SAID, and a duty the paper does not give to anyone can
   not be ticked — it is settled in Redlines.

   A TICK AGREES THE READING, NOT THE CONTRACT. Each side (ours, theirs) says
   Agree or Not how we read it per line, as a company — never a person's name
   leaves the record. A tick is kept against the line it answered (its key,
   from the words and the clause) AND the side it was told (whose): a reading
   that moves takes the tick back with it. A line whose clause is still argued
   in Redlines (an open change on that clause) cannot be ticked yet.

   THE OVERLAP ONLY: what this reading gives the other side is the paper's
   words, the clause, whose job by SIDE, and each side's answer with its day.
   No amount, no kind, no "why", no person. Both hosts load this file — the
   browser (globals) and the server (require) — so the two can never read the
   list differently. c.dutyTicks is written by POST /api/contracts/:id/duties
   and POST /api/shares/:token/duties alone; the save route keeps the stored
   copy and the share payload never carries it (the live reading does). */

const DUTY_MAX = 40;                     // lines drawn; the rest is SAID (cut), never trimmed in silence
const DUTY_SIDES = ['ours', 'theirs'];
const DUTY_ANSWERS = ['yes', 'no'];
const DUTY_WHOSE = ['us', 'them', 'both', 'none'];
const DUTY_DESC_MAX = 240, DUTY_QUOTE_MAX = 400;

function dutyNorm(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
function dutyHash(s){
  let h = 0x811c9dc5; const t = String(s || '');
  for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ('0000000' + h.toString(16)).slice(-8);
}
/* the line's key: its words and its clause — the same line keeps its key across readings */
function dutyKeyOf(o){
  return 'd' + dutyHash([dutyNorm(o && o.desc).toLowerCase(), dutyNorm(o && o.quote).toLowerCase(), dutyNorm(o && o.clause)].join('|'));
}
/* the clause's top number ("7.2" → "7"), or '' */
function dutyTopNum(s){ const m = String(s || '').match(/(\d+)/); return m ? m[1] : ''; }
function dutyFound(c){
  const t = c && c.triage && typeof c.triage === 'object' ? c.triage : null;
  const o = t && t.steps && t.steps.oblig;
  return (o && o.ok && Array.isArray(o.found)) ? o.found.filter(x => x && dutyNorm(x.desc)) : null;
}
/* whose job: a person's side on the contract's own list first, else Jambo's reading of the wording */
function dutyWhoseOf(c, o){
  const k = dutyNorm(o && o.desc).toLowerCase();
  const rec = (Array.isArray(c && c.obligations) ? c.obligations : []).find(r => r && dutyNorm(r.desc).toLowerCase() === k);
  if (rec && (rec.party === 'ours' || rec.party === 'theirs')) return rec.party === 'theirs' ? 'them' : 'us';
  const p = String((o && o.party) || '');
  return p === 'us' || p === 'them' || p === 'both' ? p : 'none';
}
/* the clauses still argued: an open change (pending, not superseded, countered or withdrawn) on that clause's top number */
function dutyOpenNums(c){
  const out = new Set();
  (Array.isArray(c && c.changes) ? c.changes : []).forEach(ch => {
    if (!ch || ch.status !== 'pending' || ch.withdrawn || ch.superseded) return;
    const n = dutyTopNum(ch.clauseNumber || ch.clauseLabel || '');
    if (n) out.add(n);
  });
  return out;
}
function dutyExecuted(c){ return !!(c && ((c.execution && c.execution.at) || c.hash || c.status === 'Signed')); }
/* one side's answer to one line, kept only while the line still reads as it did when it was given */
function dutyTickOf(ticks, key, side, whose){
  const t = ticks && ticks[key] && ticks[key][side];
  if (!t || !DUTY_ANSWERS.includes(t.answer) || t.whose !== whose) return null;
  return { answer: t.answer, at: String(t.at || '') };
}
/* THE READING. rows in the paper's order (as Jambo read it), each with its state:
   none (the paper does not say whose) · open (its clause is argued) · disputed (a side said not how they read it) ·
   agreed (both said yes) · waits (one side or both still to answer: `waits` names them). Reading never writes. */
function dutyReading(c, o){
  const found = dutyFound(c);
  if (!found) return { read: false, rows: [], total: 0, cut: 0, counts: dutyCounts([]), executed: dutyExecuted(c) };
  const ticks = (c && c.dutyTicks && typeof c.dutyTicks === 'object') ? c.dutyTicks : {};
  const open = dutyOpenNums(c), seen = new Set(), all = [];
  found.forEach(f => {
    const key = dutyKeyOf(f); if (seen.has(key)) return; seen.add(key);
    const whose = dutyWhoseOf(c, f);
    const clause = dutyNorm(f.clause).slice(0, 16);
    const num = dutyTopNum(clause);
    const ours = dutyTickOf(ticks, key, 'ours', whose), theirs = dutyTickOf(ticks, key, 'theirs', whose);
    let state = 'waits';
    if (whose === 'none') state = 'none';
    else if (num && open.has(num)) state = 'open';
    else if ((ours && ours.answer === 'no') || (theirs && theirs.answer === 'no')) state = 'disputed';
    else if (ours && theirs) state = 'agreed';
    const waits = state === 'waits' ? DUTY_SIDES.filter(s => !(s === 'ours' ? ours : theirs)) : [];
    all.push({ key, desc: dutyNorm(f.desc).slice(0, DUTY_DESC_MAX), quote: dutyNorm(f.quote).slice(0, DUTY_QUOTE_MAX),
      clause, whose, state, waits, ours, theirs });
  });
  const rows = all.slice(0, DUTY_MAX);
  return { read: true, rows, total: all.length, cut: Math.max(0, all.length - DUTY_MAX), counts: dutyCounts(all), executed: dutyExecuted(c) };
}
function dutyCounts(rows){
  const n = { all: rows.length, agreed: 0, waitsOurs: 0, waitsTheirs: 0, open: 0, none: 0, disputed: 0, us: 0, them: 0, both: 0 };
  rows.forEach(r => {
    if (r.state === 'agreed') n.agreed++; else if (r.state === 'open') n.open++; else if (r.state === 'none') n.none++; else if (r.state === 'disputed') n.disputed++;
    if (r.state === 'waits'){ if (r.waits.includes('ours')) n.waitsOurs++; if (r.waits.includes('theirs')) n.waitsTheirs++; }
    if (r.whose === 'us' || r.whose === 'them' || r.whose === 'both') n[r.whose]++;
  });
  return n;
}
/* may this side answer this line now: '' or the reason, in words a test can read */
function dutyTickRefusal(c, key, side){
  if (!DUTY_SIDES.includes(side)) return 'side';
  const R = dutyReading(c);
  if (!R.read) return 'unread';
  if (R.executed) return 'signed';
  const row = R.rows.find(r => r.key === key);
  if (!row) return 'gone';
  if (row.state === 'none') return 'none';
  if (row.state === 'open') return 'open';
  return '';
}
/* the one writer of the map: one side's answer to one line ('clear' takes it back); returns the new map */
function dutyTickSet(c, key, side, answer, at){
  const R = dutyReading(c), row = R.rows.find(r => r.key === key);
  const map = (c && c.dutyTicks && typeof c.dutyTicks === 'object') ? JSON.parse(JSON.stringify(c.dutyTicks)) : {};
  if (!row) return map;
  const cur = Object.assign({}, map[key] || {});
  if (answer === 'clear') delete cur[side];
  else if (DUTY_ANSWERS.includes(answer)) cur[side] = { answer, whose: row.whose, at: String(at || '') };
  if (Object.keys(cur).length) map[key] = cur; else delete map[key];
  /* nothing kept for a line the reading no longer has */
  const live = new Set(R.rows.map(r => r.key));
  Object.keys(map).forEach(k => { if (!live.has(k)) delete map[k]; });
  return map;
}
/* what crosses to the other side: the overlap only (no amount, kind, why, person) */
function dutyPayload(c){
  const R = dutyReading(c);
  return { read: R.read, total: R.total, cut: R.cut, counts: R.counts, executed: R.executed,
    rows: R.rows.map(r => ({ key: r.key, desc: r.desc, quote: r.quote, clause: r.clause, whose: r.whose, state: r.state, waits: r.waits.slice(),
      ours: r.ours ? { answer: r.ours.answer, at: r.ours.at } : null, theirs: r.theirs ? { answer: r.theirs.answer, at: r.theirs.at } : null })) };
}

/* THE ANSWERS AS THE SERVER HOLDS THEM, AND OUR ANSWER'S ONE WRITER (moved here from the paper desk, 22 Nov 2026: the
   desk reads, it does not write, f563). Browser only: on a server the routes are the wall (GET/POST
   /api/contracts/:id/duties); without one, the same map on the contract (dutyTickSet), its trail line and a save. */
function dutyTicksLoad(id){
  if (typeof API_MODE !== 'function' || !API_MODE() || typeof api !== 'function') return Promise.resolve(null);
  return Promise.resolve(api('contracts/' + encodeURIComponent(id) + '/duties', 'GET', null, { quiet: true }))
    .then(r => (r && r.dutyTicks && typeof r.dutyTicks === 'object') ? r.dutyTicks : null).catch(() => null);
}
async function dutyAnswerSave(c, key, answer){
  if (typeof API_MODE === 'function' && API_MODE()){
    const r = await api('contracts/' + encodeURIComponent(c.id) + '/duties', 'POST', { key, answer });
    const live = (typeof getContract === 'function' && getContract(c.id)) || c;
    if (r && r.dutyTicks && Object.keys(r.dutyTicks).length) live.dutyTicks = r.dutyTicks; else delete live.dutyTicks;
    return true;
  }
  const map = dutyTickSet(c, key, 'ours', answer, (typeof nowISO === 'function') ? nowISO() : new Date().toISOString());
  if (Object.keys(map).length) c.dutyTicks = map; else delete c.dutyTicks;
  const row = dutyReading(c).rows.find(x => x.key === key) || {};
  if (typeof logAudit === 'function') logAudit(c, 'Who does what', `${answer === 'yes' ? 'Agreed the reading' : answer === 'no' ? 'Said it is not how they read it' : 'Took back their answer'}: ${String(row.desc || '').slice(0, 120)}`);
  if (typeof persist === 'function') persist(c);
  return true;
}
const DUTY_API = { DUTY_MAX, DUTY_SIDES, DUTY_ANSWERS, DUTY_WHOSE, dutyNorm, dutyHash, dutyKeyOf, dutyTopNum, dutyFound,
  dutyWhoseOf, dutyOpenNums, dutyExecuted, dutyTickOf, dutyReading, dutyCounts, dutyTickRefusal, dutyTickSet, dutyPayload, dutyTicksLoad, dutyAnswerSave };
if (typeof window !== 'undefined') Object.assign(window, DUTY_API);
if (typeof module !== 'undefined' && module.exports) module.exports = DUTY_API;
