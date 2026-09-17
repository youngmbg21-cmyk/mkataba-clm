/* ============================================================
   f322 — THE REQUESTS QUEUE GROWS A CLOCK, A LANE AND A TRACKER
   (S4 + S3 + S5 of HaTi's Next Fifteen, 16 Sep 2026)
   ============================================================
   *"What it does not carry is the four things that turn an inbox into a
   queue: how it was routed, who is holding it, when it was promised, and a
   way for the person who asked to find out without asking again."*

   THE THREE FACTS ARE THREE DIFFERENT KINDS OF FACT and the sections follow
   that split, because the ways they can go wrong are different:

     · ROAD is WORKED OUT, so section 1 is about what it read and section 2
       about what it refuses to conclude. It has to SAY what it read, or a
       routing nobody can question is a routing nobody can correct.
     · PROMISED is a PROMISE somebody typed. Section 3's whole business is
       that nothing in this file computes a date — the moment it did, the
       column would stop being a commitment and start being a forecast.
     · THE TRACKER is a page with NO LOGIN, so section 5 is a wall: what it
       carries is exactly the request the reader already wrote, and never a
       value, an address or anybody else's request.

   THE LANE (section 4) has one condition it may not switch off: it never
   clears a request about the other side's own paper. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intake.js'), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const SET = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');

const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const ago = mins => new Date(Date.now() - mins * 60000).toISOString();
const REQ = (o) => Object.assign({ id: 'REQ-1', title: '', need: '', counterparty: '',
  folder: '', status: 'open', by: { id: 'u1', name: 'A' }, createdAt: ago(60) }, o || {});

function world(contracts){
  const w = buildWorld({ intakeView: true });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: contracts || [], settings: win.state && win.state.settings || {} });
  return win;
}

describe('f322 (1) the road is worked out, and it says what it read', () => {
  const book = [{ id:'MK-1', counterparty:'Kabras Sugar Ltd', status:'Executed' }];
  test('1a our own template, a counterparty we know, no money — routine', () => {
    const w = world(book);
    const r = w.intakeRoad(REQ({ title:'Renew the Kabras sugar supply',
      need:'Same terms as last year if we can.', counterparty:'Kabras Sugar Ltd' }));
    assert.equal(r.k, 'routine');
    assert.ok(r.why, 'and it says why');
  });
  test('1b their own paper from a counterparty nobody has dealt with — close read', () => {
    const w = world(book);
    const r = w.intakeRoad(REQ({ title:'Review their haulage terms',
      need:'Coastal Freight sent their own paper for the coast route.', counterparty:'Coastal Freight Ltd' }));
    assert.equal(r.k, 'close');
    assert.match(r.why, /nobody/, 'the reason names the half that made it close');
    assert.match(r.why, /paper/);
  });
  test('1c their paper from a counterparty we HAVE dealt with is ordinary work', () => {
    const w = world([{ id:'MK-1', counterparty:'Mombasa Haulage Co' }]);
    const r = w.intakeRoad(REQ({ title:'Review their haulage terms',
      need:'Mombasa Haulage sent their own paper.', counterparty:'Mombasa Haulage Co' }));
    assert.equal(r.k, 'standard', 'either half alone is ordinary work');
  });
  test('1d two words may sit between "their" and the noun — measured, it cleared a lane once', () => {
    const w = world(book);
    assert.ok(w.IK_THEIR_PAPER.test('Their own NDA template arrived for the depot.'));
    assert.ok(w.IK_THEIR_PAPER.test('they sent their draft'));
    assert.ok(!w.IK_THEIR_PAPER.test('their side of the agreement is signed'),
      'three words apart is a sentence about our own paper');
  });
  test('1e a lane that fired outranks every judgement', () => {
    const w = world(book);
    const r = w.intakeRoad(REQ({ lane:'Standard NDA', need:'they sent their own paper' }));
    assert.equal(r.k, 'lane');
    assert.match(r.why, /Standard NDA/, 'a rule that fired is a fact, and it is named');
  });
  test('1f every road has a label in both books', () => {
    const w = world(book);
    Object.keys(w.IK_ROADS).forEach(k=>{
      assert.ok(w.IK_ROADS[k].label, k + ' has no label');
      assert.equal((I18N.match(new RegExp('ik_road_' + k + ':', 'g')) || []).length, 2, k);
    });
  });
});

describe('f322 (2) the reading writes nothing, and asks no route', () => {
  test('2a no route, no fetch, no model', () => {
    const road = CODE.slice(CODE.indexOf('function intakeRoad'), CODE.indexOf('const IK_STOPPED'));
    assert.ok(!/api\(|fetch\(|anthropic|copilot/i.test(road));
  });
  test('2b it reads the book the reader can already see, and changes nothing', () => {
    const cs = [{ id:'MK-1', counterparty:'Kabras Sugar Ltd' }];
    const before = JSON.stringify(cs);
    const w = world(cs);
    const r = REQ({ counterparty:'Kabras Sugar Ltd', need:'x' });
    const snap = JSON.stringify(r);
    w.intakeRoad(r);
    assert.equal(JSON.stringify(cs), before);
    assert.equal(JSON.stringify(r), snap, 'the request is byte-identical after being read');
  });
  test('2c a request with no counterparty is not a close read by default', () => {
    const w = world([]);
    assert.equal(w.intakeRoad(REQ({ need:'Please draft the usual thing.' })).k, 'routine',
      'an over-cautious default would mark the whole queue and the column would stop meaning anything');
  });
});

describe('f322 (3) the promise is a promise, never a prediction', () => {
  test('3a nothing here computes a date', () => {
    const p = CODE.slice(CODE.indexOf('function intakePromise'), CODE.indexOf('function intakePastDue'));
    assert.ok(!/setDate\(|addDays|\+ *\d+ *\* *86400000|workingDays|median/i.test(p),
      'the column prints the date a person typed and how far off it is');
  });
  test('3b no promise is an em-dash, never a guess', () => {
    const w = world([]);
    assert.equal(w.intakePromise(REQ({})), null);
    assert.match(w.ikClockHtml(REQ({})), /&mdash;/);
  });
  test('3c a date that has passed is over, in ruby', () => {
    const w = world([]);
    const p = w.intakePromise(REQ({ promisedAt: day(-2) }));
    assert.equal(p.k, 'over'); assert.equal(p.tone, 'ruby');
  });
  test('3d a date promised for today is not late at one minute past midnight', () => {
    const w = world([]);
    const p = w.intakePromise(REQ({ promisedAt: day(0) }));
    assert.notEqual(p.k, 'over', 'the day ends at 23:59, not at 00:00');
  });
  test('3e the clock stops when the ball is theirs', () => {
    const w = world([]);
    const done = REQ({ status:'done', createdAt: ago(240), decidedAt: ago(236) });
    assert.equal(w.intakeStoppedAt(done), done.decidedAt);
    assert.equal(w.intakeMinutes(done), 4, 'four minutes, frozen — not four minutes and counting');
    const p = w.intakePromise(done);
    assert.equal(p.k, 'done'); assert.match(p.text, /4/);
  });
  test('3f the median is over what actually FINISHED this month, and refuses to be one', () => {
    const w = world([]);
    const one = [REQ({ id:'a', status:'done', createdAt: ago(2880), decidedAt: ago(1440) })];
    assert.equal(w.intakeMedianDays(one), null, 'a middle value of one is a number dressed as a statistic');
    assert.equal(w.IK_MEDIAN_MIN, 2);
    const two = one.concat([REQ({ id:'b', status:'done', createdAt: ago(2880), decidedAt: ago(1440) })]);
    assert.equal(w.intakeMedianDays(two), 1);
    const open = [REQ({ id:'c', createdAt: ago(99999) }), REQ({ id:'d', createdAt: ago(99999) })];
    assert.equal(w.intakeMedianDays(open), null, 'nothing has finished');
  });
  test('3g the heading counts what is past its date, over the same queue it names', () => {
    const w = world([]);
    const q = [REQ({ id:'a', promisedAt: day(-1) }), REQ({ id:'b', promisedAt: day(9) }), REQ({ id:'c' })];
    assert.equal(w.intakePastDue(q), 1);
  });
});

describe('f322 (4) a lane fires, and names itself on the record', () => {
  const lanes = (w, L) => { w.state.settings = w.state.settings || {}; w.state.settings.intakeLanes = L; return w; };
  test('4a four conditions and a destination — and nothing else', () => {
    const w = lanes(world([]), [{ on:true, name:'NDA', template:'ND', words:'nda', folder:'', knownOnly:false }]);
    const hit = w.intakeLaneFor(REQ({ title:'NDA for the trial', need:'Standard mutual NDA.' }));
    assert.ok(hit); assert.equal(hit.name, 'NDA');
  });
  test('4b a lane NEVER clears a request about the other side\'s own paper', () => {
    const w = lanes(world([]), [{ on:true, name:'NDA', template:'ND', words:'nda', knownOnly:false }]);
    assert.equal(w.intakeLaneFor(REQ({ title:'A new NDA for the depot',
      need:'Their own NDA template arrived for the depot.' })), null,
      'whatever else the rule says — this is the one condition it may not switch off');
    assert.match(CODE, /if\(IK_THEIR_PAPER\.test\(text\)\) continue;/);
  });
  test('4c a lane with a ceiling refuses an ask that mentions money, rather than guessing the amount', () => {
    const w = lanes(world([]), [{ on:true, name:'NDA', template:'ND', maxValue:100000, knownOnly:false }]);
    assert.equal(w.intakeLaneFor(REQ({ title:'NDA', need:'Worth about KES 17.8M.' })), null);
    assert.ok(w.intakeLaneFor(REQ({ title:'NDA', need:'Nothing unusual.' })));
  });
  test('4d off, unnamed, or already cleared: no lane', () => {
    const w = world([]);
    assert.equal(lanes(w, [{ on:false, name:'NDA', template:'ND' }]).intakeLaneFor(REQ({ need:'x' })), null);
    assert.equal(lanes(w, [{ on:true, name:'NDA', template:'' }]).intakeLaneFor(REQ({ need:'x' })), null);
    assert.equal(lanes(w, [{ on:true, name:'NDA', template:'ND' }]).intakeLaneFor(REQ({ need:'x', lane:'Old' })), null);
    assert.equal(lanes(w, [{ on:true, name:'NDA', template:'ND' }]).intakeLaneFor(REQ({ need:'x', status:'done' })), null);
  });
  test('4e a workspace that has written no lanes has no lanes', () => {
    const w = world([]);
    assert.deepEqual(w.intakeLanes(), []);
    assert.equal(w.intakeLaneFor(REQ({ need:'x' })), null);
  });
  test('4f it presses the ordinary creation path and mints nothing itself', () => {
    const run = CODE.slice(CODE.indexOf('async function intakeRunLanes'), CODE.indexOf('async function intakeSetStatus'));
    assert.match(run, /createFromTemplate\(L\.template\)/);
    assert.ok(!/state\.contracts\.(push|unshift)|nextId\(/.test(run));
    assert.ok(!/signatures|signDocument|'Signed'|'Executed'/.test(run), 'a lane never signs anything');
  });
  test('4g the rule lives in Settings and the queue only READS it', () => {
    assert.match(SET, /lanes:\{\s*\n\s*tab:'platform'/);
    assert.match(SET, /state\.settings\.intakeLanes\s*=/, 'Settings writes');
    assert.ok(!/state\.settings\.intakeLanes\s*=/.test(CODE), 'the queue never writes the rule');
    assert.match(CODE, /const intakeLanes = \(\) =>/);
  });
  test('4h the lane is written ONCE on the record and never rewritten', () => {
    assert.match(SRV, /const lane = r\.lane \|\| \(isEditor \? \(clean\(b\.lane\)/,
      'a rule that fired is a fact about what happened');
  });
});

describe('f322 (5) the tracker is a page outside the app, and it is a wall', () => {
  test('5a a token per request, minted once, from crypto', () => {
    assert.match(SRV, /const track = rid\(24\);/);
    assert.equal((SRV.match(/track_token/g) || []).length >= 4, true);
    assert.ok(!/UPDATE intake_requests SET[^;]*track_token=/.test(SRV), 'no route hands out a second');
  });
  test('5b the page takes no input and writes nothing', () => {
    const pg = SRV.slice(SRV.indexOf('function trackPageHtml'), SRV.indexOf("app.get('/track/:token'") + 900);
    assert.ok(!/<form|<input|<button|<textarea/.test(pg), 'a page that cannot be acted on cannot be abused into acting');
    assert.ok(!/app\.(post|patch|put|delete)\(['"]\/track/.test(SRV));
  });
  test('5c it carries the request and nothing else — no value, no address, no wording', () => {
    const pg = SRV.slice(SRV.indexOf('function trackPageHtml'), SRV.indexOf("app.get('/track/:token'"));
    ['email', 'value', 'redline', 'body', 'counterparty', 'signature'].forEach(w=>{
      assert.ok(!new RegExp('r\\.' + w, 'i').test(pg), 'the tracker page reads r.' + w);
    });
  });
  test('5d a bad token is the same answer as a missing one', () => {
    const rt = SRV.slice(SRV.indexOf("app.get('/track/:token'"), SRV.indexOf("app.get('/track/:token'") + 1200);
    assert.match(rt, /res\.status\(404\)/);
    assert.match(rt, /\[0-9a-f\]\{20,64\}/, 'a malformed token never reaches the database');
    assert.ok(!/error:.*token/i.test(rt), 'and the page cannot be used to find out which tokens exist');
  });
  test('5e the link is built in the browser and never invented where there is no token', () => {
    const w = world([]);
    assert.equal(w.intakeTrackUrl(REQ({})), null);
    assert.match(String(w.intakeTrackUrl(REQ({ trackToken:'abc' }))), /\/track\/abc$/);
    assert.ok(!/Tracker link/.test(w.ikClockHtml(REQ({}))), 'a link that cannot work is not drawn');
  });
});

describe('f322 (6) absent stays absent, and an editor is the only one who may say', () => {
  test('6a a request on file reads exactly as it did', () => {
    assert.match(SRV, /assignee: r\.assignee_id \? \{ id: r\.assignee_id/,
      'a key written as null would make every request on file read as "answered, with nothing"');
    assert.match(SRV, /promisedAt: r\.promised_at \|\| null, lane: r\.lane \|\| null/);
    const w = world([]);
    const r = REQ({});
    assert.equal(r.assignee, undefined);
    assert.equal(w.intakePromise(r), null);
  });
  test('6b the assignee is LOOKED UP, never taken from the body', () => {
    const p = SRV.slice(SRV.indexOf("app.patch('/api/intake/:id'"), SRV.indexOf("app.patch('/api/intake/:id'") + 4000);
    assert.match(p, /SELECT id,name FROM users WHERE id=\?/);
    assert.ok(!/assignee_name=\?[^;]*b\.assigneeName/.test(p), 'a name in a request body is a name anybody could type');
  });
  test('6c a viewer may not set any of the three', () => {
    const p = SRV.slice(SRV.indexOf("app.patch('/api/intake/:id'"), SRV.indexOf("app.patch('/api/intake/:id'") + 4000);
    assert.match(p, /if \(isEditor && b\.assignee !== undefined\)/);
    assert.match(p, /if \(isEditor && b\.promisedAt !== undefined\)/);
    assert.match(p, /isEditor \? \(clean\(b\.lane\)/);
  });
  test('6d a promised date is a day, and anything else is refused', () => {
    const p = SRV.slice(SRV.indexOf("app.patch('/api/intake/:id'"), SRV.indexOf("app.patch('/api/intake/:id'") + 4000);
    assert.match(p, /\\d\{4\}-\\d\{2\}-\\d\{2\}/);
    assert.match(p, /A promised date is a day/);
  });
  test('6e undefined leaves the stored value exactly as it was', () => {
    const p = SRV.slice(SRV.indexOf("app.patch('/api/intake/:id'"), SRV.indexOf("app.patch('/api/intake/:id'") + 4000);
    assert.match(p, /let asgId = r\.assignee_id, asgName = r\.assignee_name;/);
    assert.match(p, /let promised = r\.promised_at;/);
  });
});

describe('f322 (7) every name this page grew is reachable', () => {
  test('7a published', () => {
    const w = world([]);
    ['intakeRoad','intakePromise','intakeMedianDays','intakePastDue','intakeTrackUrl',
     'intakeLanes','intakeLaneFor','intakeRunLanes','intakePick','intakePromiseAsk',
     'ikClockHtml','IK_ROADS','IK_MEDIAN_MIN','intakeMinutes','intakeStoppedAt'].forEach(n=>{
      assert.notEqual(typeof w[n], 'undefined', n + ' is not published');
    });
  });
  test('7b the three facts are drawn with a label above a value', () => {
    const w = world([]);
    const h = w.ikClockHtml(REQ({ assignee:{ id:'u1', name:'Tomás' }, promisedAt: day(4) }));
    assert.match(h, /Road/); assert.match(h, /With/); assert.match(h, /Promised/);
    assert.match(h, /Tomás/);
  });
});
