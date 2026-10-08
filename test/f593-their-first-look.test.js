/* ============================================================
   f593 — AFTER THE FIRST SEND, IT IS THEIR MOVE: THEIR FIRST LOOK
   (functional review, 9 Oct 2026, the drafting walk: C4)
   ============================================================
   After the first send nothing is pending yet, and negWhoseMove answered
   "clear" before it ever asked whether they held the wording — so the room
   said Neither, the bell nothing, and their own page said "With you". Three
   screens, three answers.

   Now: handed to them (the turn is theirs) AND a live copy in their hands
   (the server's reading, `_reach.reply === 'live'`) is THEIR move, why
   'firstlook'. Anything less stays clear. The server reads the reach for a
   handed-over contract even with nothing pending (srvReachWanted), so the
   list carries the fact after a reload too.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ME = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
const SERVER = fs.readFileSync(path.join(__dirname, '..', 'server/server.js'), 'utf8');
const contract = () => ({ id: 'MK-593', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
  status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
  signatures: [], comments: [], format: 'rich',
  redlineText: '<h2>1. Services</h2><p>The Provider shall store the goods.</p>' });
function world(){
  const w = buildWorld({ user: ME, negotiationView: true, registerView: true });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => [ME];
  return w;
}
const reach = (c, mode) => { if (mode === 'unknown') delete c._reach; else c._reach = { reply: mode, last: null, sign: null, fresh: [] }; };

describe('f593 — their first look', () => {
  test('handed over, nothing pending, a live copy: their move, with them by name', () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    win.negoHandOver(c, { to: 'counterparty' });
    reach(c, 'live');
    const m = win.negWhoseMove(c);
    assert.equal(m.k, 'them');
    assert.equal(m.why, 'firstlook');
    assert.match(win.negoMovePillHtml(c), /Nordfrakt Logistik AB/, 'the pill says "With <counterparty>"');
  });
  test('no live copy, or nobody asked: still clear — never guessed', () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    win.negoHandOver(c, { to: 'counterparty' });
    reach(c, 'none');
    assert.equal(win.negWhoseMove(c).k, 'clear');
    reach(c, 'unknown');
    assert.equal(win.negWhoseMove(c).k, 'clear');
  });
  test('not handed over (the send was only queued — D1): still clear', () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    reach(c, 'live');
    assert.equal(win.negWhoseMove(c).k, 'clear');
  });
  test('the server reads the reach for a handed-over contract with nothing pending', () => {
    const i = SERVER.indexOf('function srvReachWanted(');
    const body = SERVER.slice(i, SERVER.indexOf('\n}\n', i));
    assert.match(body, /c\.negotiation && c\.negotiation\.turn === 'counterparty'\) return true/);
  });
});
