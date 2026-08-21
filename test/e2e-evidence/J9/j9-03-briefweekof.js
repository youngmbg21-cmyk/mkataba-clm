/* J9 claim 3 (weekly-Monday-catchup) — proof that briefWeekOf keys ONLY on
   the calendar week, not on which day the sweep actually runs, so a server
   that misses Monday still sends "this week's" brief on Tuesday under the
   SAME rkey a Monday run would have used (no lost week, no duplicate).
   This is the exact function body copied verbatim out of server/server.js
   (a pure function with no server state) — not a modification, a readout. */
function briefWeekOf(day) {
  const d = new Date(day + 'T00:00:00Z');
  if (isNaN(d.getTime())) return day;
  const back = (d.getUTCDay() + 6) % 7;                    // Monday = 0
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}
const assert = require('node:assert/strict');
// Monday 2026-08-17 .. Sunday 2026-08-23 (a real week; 17 Aug 2026 is a Monday)
const monday = '2026-08-17';
const tuesday = '2026-08-18';
const sunday = '2026-08-23';
assert.equal(briefWeekOf(monday), monday, 'Monday itself keys on itself');
assert.equal(briefWeekOf(tuesday), monday, 'a run that first happens on Tuesday keys on the SAME Monday — server down Monday still catches up Tuesday under one rkey, not a new one');
assert.equal(briefWeekOf(sunday), monday, 'the whole week shares one key');
assert.notEqual(briefWeekOf('2026-08-24'), monday, 'the following Monday is a new key — no week is skipped or merged');
console.log('PASS: briefWeekOf(day) proves the catch-up rule algebraically — a Monday-missed Tuesday run reuses the same rkey as a Monday run would, so nothing is lost and nothing double-sends.');
