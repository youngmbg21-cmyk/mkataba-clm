/* ============================================================
   f486 — A LANE'S DRAFT IS READ ON ARRIVAL, ONCE, AND ITS OWNER IS TOLD
   (4 Oct 2026, the process review's last gaps: lane drafts)
   ============================================================
   The browser half of f485. A draft a lane minted on the server never
   passed through contractArrived, so Copilot's arrival reading waited until
   somebody sent it. Now the first editor's browser that holds such a draft
   claims it (POST /api/contracts/:id/arrival) and arrives it through the
   ONE door every creation uses — contractArrived with `elsewhere` (it
   claims nothing this screen holds for a draft of its own) and `read:false`
   — then the ONE launcher, triageAndPaint, awaited, one contract at a time.
   The bell tells the draft's owner (the `request` kind), and the lanes panel
   has the owner picker.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

/* A stage with the real Requests module, the real arrival door and the real
   people-on-this-contract model; the server and the reading are doubles that
   RECORD, because what is under test is who calls what, and how often. */
function stage(o = {}) {
  const w = buildWorld({ intakeView: true, triage: true, participants: true,
    canEdit: o.canEdit, apiMode: o.apiMode, user: o.user });
  const { win } = w;
  win.state = win.state || { contracts: [], settings: {} };
  win.state.contracts = (o.book || []).map(c => ({ ...c }));
  win._intakeState.list = o.queue || [];
  win._intakeState.loaded = true;
  const calls = [];
  const claims = new Set(o.claimable || []);
  win.api = async (p, method, body) => {
    calls.push({ p, method: method || 'GET' });
    const m = /^contracts\/([^/]+)\/arrival$/.exec(p);
    if (m && method === 'POST') { const id = decodeURIComponent(m[1]); const ok = claims.delete(id); return { claimed: ok }; }
    const g = /^contracts\/([^/]+)$/.exec(p);
    if (g && (method || 'GET') === 'GET') return (o.server || {})[decodeURIComponent(g[1])] || null;
    return {};
  };
  win.contractsTakeRow = async row => { win.state.contracts.unshift({ ...row, _light: true, _loaded: false }); return true; };
  win.ensureFull = async c => { c._loaded = true; c._light = false; };
  const reads = []; let running = 0, most = 0;
  win.triageAndPaint = async c => {
    running++; most = Math.max(most, running); reads.push(c.id);
    await new Promise(r => setImmediate(r));
    c.triage = { at: 'now', steps: {} };
    running--;
    return c.triage;
  };
  const arrived = [];
  const real = win.contractArrived;
  win.contractArrived = (c, opts) => { arrived.push({ id: c.id, opts: { ...(opts || {}) } }); return real(c, opts); };
  return { ...w, calls, reads, arrived, most: () => most };
}
const LANE_REQ = (id, cid, extra = {}) => ({ id, title: 'NDA for ' + id, status: 'drafted', lane: 'Routine NDA',
  contractId: cid, by: { id: 'u_ask', name: 'Asha' }, createdAt: '2026-10-01T09:00:00Z', ...extra });

describe('f486 (1) the first editor\'s browser reads a lane draft once', () => {
  test('1a it claims, arrives through the one door with `elsewhere`, and reads — once', async () => {
    const s = stage({ book: [{ id: 'MK-1', status: 'Draft', template: 'ND', arrivalOwed: { at: 'x', lane: 'Routine NDA' } },
      { id: 'MK-2', status: 'Draft', template: 'ND' }], claimable: ['MK-1'] });
    const [a, b] = await Promise.all([s.win.intakeLaneArrivals(), s.win.intakeLaneArrivals()]);
    assert.equal(a + b, 1, 'two beats at once read it once');
    assert.deepEqual(s.reads, ['MK-1'], 'only the one owed its reading');
    assert.deepEqual(s.arrived.map(x => x.id), ['MK-1']);
    assert.equal(s.arrived[0].opts.elsewhere, true, 'it arrived somewhere else');
    assert.equal(s.arrived[0].opts.read, false, 'the reading is the awaited launcher\'s, not a second start');
    assert.equal(s.calls.filter(c => /\/arrival$/.test(c.p)).length, 1, 'one claim');
    assert.ok(!s.win.state.contracts[0].arrivalOwed, 'nothing owed any more on this copy');
    assert.equal(await s.win.intakeLaneArrivals(), 0, 'and the next beat has nothing to do');
  });
  test('1b a draft another browser already claimed is not read here', async () => {
    const s = stage({ book: [{ id: 'MK-3', status: 'Draft', template: 'ND', arrivalOwed: { at: 'x' } }], claimable: [] });
    assert.equal(await s.win.intakeLaneArrivals(), 0);
    assert.deepEqual(s.reads, []);
    assert.ok(!s.win.state.contracts[0].arrivalOwed, 'and this copy stops asking');
  });
  test('1c several at once are read one after another, never side by side', async () => {
    const book = ['MK-4', 'MK-5', 'MK-6'].map(id => ({ id, status: 'Draft', template: 'ND', arrivalOwed: { at: 'x' } }));
    const s = stage({ book, claimable: book.map(c => c.id) });
    assert.equal(await s.win.intakeLaneArrivals(), 3);
    assert.equal(s.most(), 1, 'triageRun\'s own rule: sequential');
  });
  test('1d a lane draft the queue names and the book lacks is taken into the book, then read', async () => {
    const s = stage({ book: [], queue: [LANE_REQ('REQ-1', 'MK-9')],
      server: { 'MK-9': { id: 'MK-9', status: 'Draft', template: 'ND', arrivalOwed: { at: 'x' }, _v: 1 } }, claimable: ['MK-9'] });
    assert.equal(await s.win.intakeLaneArrivals(), 1);
    assert.ok(s.win.state.contracts.some(c => c.id === 'MK-9'), 'on the Contracts list without a reload');
    assert.deepEqual(s.reads, ['MK-9']);
  });
  test('1e a Viewer\'s browser, or one with no server, asks nothing', async () => {
    const owed = [{ id: 'MK-7', status: 'Draft', arrivalOwed: { at: 'x' } }];
    const v = stage({ book: owed, claimable: ['MK-7'], canEdit: false });
    assert.equal(await v.win.intakeLaneArrivals(), 0); assert.equal(v.calls.length, 0);
    const l = stage({ book: owed, claimable: ['MK-7'], apiMode: false });
    assert.equal(await l.win.intakeLaneArrivals(), 0); assert.equal(l.calls.length, 0);
  });
});

describe('f486 (2) the one door: what this screen holds is not the lane draft\'s', () => {
  test('2a `elsewhere` leaves the people and the request held for a draft of this screen\'s own', () => {
    const s = stage();
    const { win } = s;
    win.participantsHold([{ id: 'p1', name: 'Grace', email: 'grace@x.example', side: 'ours', role: 'reviewer' }]);
    win.intakeHoldDraft('REQ-HELD');
    const lane = { id: 'MK-20', status: 'Draft' };
    win.contractArrived(lane, { elsewhere: true, read: false });
    assert.ok(!(lane.participants || []).length, 'nobody named on another screen is put on it');
    assert.ok(!lane.intakeRequestId, 'and it is not claimed for the request held there');
    assert.equal(win.intakeHeldDraft(), 'REQ-HELD', 'the hold is still there for the draft it belongs to');
    const mine = { id: 'MK-21', status: 'Draft' };
    win.contractArrived(mine, { read: false });
    assert.equal((mine.participants || []).length, 1, 'a draft made here claims them, as before');
  });
});

describe('f486 (3) the owner is told, in the bell', () => {
  test('3a the rows are the drafted lane requests held by the reader, and nobody else\'s', () => {
    const me = { id: 'u_me', name: 'Me', role: 'legal' };
    const s = stage({ user: me, queue: [
      LANE_REQ('REQ-1', 'MK-1', { assignee: { id: 'u_me', name: 'Me' } }),
      LANE_REQ('REQ-2', 'MK-2', { assignee: { id: 'u_other', name: 'Other' } }),
      LANE_REQ('REQ-3', 'MK-3', { assignee: { id: 'u_me', name: 'Me' }, status: 'done' }),
      LANE_REQ('REQ-4', 'MK-4', { assignee: { id: 'u_me', name: 'Me' }, lane: null }),
    ] });
    assert.deepEqual(s.win.intakeLaneDraftRows().map(r => r.id), ['REQ-1'],
      'gone once the draft leaves Drafting (done); a hand-made draft is not news to its maker');
  });
  test('3b the bell draws them as the `request` kind, with a door to the draft', () => {
    const APP = bare(read('js/app.js'));
    const i = APP.indexOf('intakeLaneDraftRows().forEach');
    assert.ok(i > 0, 'the bell asks the one reading');
    const slice = APP.slice(i, i + 700);
    assert.match(slice, /push\('request',c,i18t\('al_lane_draft'/);
    assert.match(slice, /openWorkspace\(c\.id\)/, 'the press opens the draft itself');
  });
});

describe('f486 (4) the pieces are wired where the reader looks', () => {
  test('4a triageAndPaint hands back its promise, so a sweep can wait for it', () => {
    const C = bare(read('js/views/contract.js'));
    const i = C.indexOf('function triageAndPaint(c, opts)');
    const body = C.slice(i, C.indexOf('function triageRepaintSurfaces', i));
    assert.match(body, /return Promise\.resolve\(onServer\)/);
    assert.match(body, /return triageRun\(c,/);
  });
  test('4b the sweep runs when the book and queue first land, and on the queue\'s beat', () => {
    const CORE = bare(read('js/core.js'));
    const i = CORE.indexOf("window.loadIntake&&loadIntake().then(");
    assert.ok(/intakeLaneArrivals\(\)/.test(CORE.slice(i, i + 400)), 'startApp');
    const IK = bare(read('js/views/intake.js'));
    const r = IK.indexOf('async function intakeRefresh(');
    assert.ok(/intakeLaneArrivals\(\)/.test(IK.slice(r, IK.indexOf('function intakeSweepStart', r))), 'intakeRefresh');
  });
  test('4c the lanes panel has the owner picker, and keeps a lane\'s id across saves', () => {
    const S = bare(read('js/views/settings.js'));
    const i = S.indexOf('lanes:{');
    const panel = S.slice(i, S.indexOf('renewals:{', i));
    assert.match(panel, /class="ln-owner"/);
    assert.match(panel, /intakeLaneOwner\(/, 'the default is named by the server\'s own reading');
    assert.match(panel, /data-lane-id=/);
    assert.match(panel, /keep \|\| \('lane_'/, 'a new id only for a new lane');
  });
  test('4d both books carry every new sentence', () => {
    const I18N = read('js/i18n.js');
    const sv = I18N.indexOf('\n  sv: {');
    for (const k of ['set_lane_owner', 'set_lane_owner_tip', 'set_lane_owner_saver', 'set_lane_owner_first',
      'al_lane_draft', 'al_lane_draft_sub', 'mail_ik_lane_subject', 'mail_ik_lane_lead', 'mail_ik_lane_where']) {
      const en = I18N.indexOf('\n    ' + k + ':'), sw = I18N.indexOf('\n    ' + k + ':', sv);
      assert.ok(en > 0 && en < sv, 'English: ' + k);
      assert.ok(sw > sv, 'Swedish: ' + k);
    }
  });
});
