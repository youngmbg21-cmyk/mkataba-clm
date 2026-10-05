/* f519 — VERIFIED VIEWS (work order "the board that answers right", Part 9,
   5 Oct 2026; Power BI's verified answers)

     A. the route: only an admin writes; the recipe is cleaned, the set is the
        whole book or a question (never a list of ids); a question answers one
        view only; an ordinary settings save never writes the list;
     B. asking a named question — normalised, exact — draws the stored card,
        free, marked VERIFIED with who and when; a near miss is read as usual;
     C. the count is the reader's own reach, re-read live;
     D. a non-admin sees no ⋯ row; an admin does;
     E. a stored recipe that no longer draws as set is SAID, never changed;
     F. Copilot is told the phrases. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const { J, boardWorld, openPlan, text } = require('./board-world');

describe('F519 (A) — the route', () => {
  let h, W;
  const view = (o) => Object.assign({ title: 'Payment terms', which: { all: true }, recipe: { pic: 'ring', split: { by: 'payterms' }, measure: 'count' }, phrases: ['payment terms for the board pack', 'board pack terms'] }, o || {});
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { contracts: [] }); });
  after(async () => { await h.stop(); });
  test('an admin sets a view; it rides the settings blob with who and when, the recipe cleaned', async () => {
    const r = await W.admin.json('/api/settings/board-verified', { method: 'PUT', body: view({ recipe: { pic: 'ring', split: { by: 'payterms' }, measure: 'count', colour: 'red', target: 'new' } }) });
    assert.ok(/^bv_/.test(r.view.id));
    const boot = await W.unrestricted.json('/api/bootstrap');
    const v = boot.settings.boardVerified[0];
    assert.deepEqual(v.recipe, { pic: 'ring', measure: 'count', split: { by: 'payterms' } });
    assert.deepEqual(v.which, { all: true });
    assert.equal(v.by, 'Amina Otieno'); assert.match(v.at, /^\d{4}-\d{2}-\d{2}$/);
  });
  test('only an admin may write it', async () => {
    const r = await W.unrestricted.raw('/api/settings/board-verified', { method: 'PUT', body: view({ phrases: ['x y z'] }) });
    assert.equal(r.status, 403);
  });
  test('a bad recipe, a list of ids, or no question is refused', async () => {
    for (const body of [view({ recipe: { pic: 'teapot' } }), view({ which: { ids: ['MK-1'] } }), view({ phrases: [] }), view({ title: '' })]) {
      const r = await W.admin.raw('/api/settings/board-verified', { method: 'PUT', body });
      assert.equal(r.status, 400, JSON.stringify(body));
    }
  });
  test('a question answers one view only', async () => {
    const r = await W.admin.raw('/api/settings/board-verified', { method: 'PUT', body: view({ title: 'Other', phrases: ['Board pack terms!'] }) });
    assert.equal(r.status, 409);
  });
  test('the same id is replaced, a date split survives the round trip, and a settings save never writes the list', async () => {
    const boot = await W.admin.json('/api/bootstrap'); const id = boot.settings.boardVerified[0].id;
    const r = await W.admin.json('/api/settings/board-verified', { method: 'PUT', body: view({ id, title: 'Endings', recipe: { pic: 'cols', split: { by: 'date', unit: 'q', date: 'end' }, window: { next: 4, unit: 'q' } } }) });
    assert.equal(r.boardVerified.length, 1);
    assert.deepEqual(r.view.recipe.split, { by: 'date', unit: 'q', date: 'end' });
    assert.deepEqual(r.view.recipe.window, { next: 4, unit: 'q' });
    await W.admin.json('/api/settings', { method: 'PUT', body: { boardVerified: [], somethingElse: 1 } });
    assert.equal((await W.admin.json('/api/bootstrap')).settings.boardVerified.length, 1);
    const off = await W.admin.json('/api/settings/board-verified', { method: 'PUT', body: { id, remove: true } });
    assert.equal(off.boardVerified.length, 0);
    assert.equal((await W.admin.raw('/api/settings/board-verified', { method: 'PUT', body: { id, remove: true } })).status, 404);
  });
});

const VIEWS = [{ id: 'bv_1', title: 'Suppliers by stage', which: { q: 'supplier contracts' }, recipe: { pic: 'bars', split: { by: 'status' }, measure: 'count' },
  phrases: ['supplier pipeline', 'Where are our suppliers?'], by: 'Amina Otieno', at: '2026-10-02' }];
const verWorld = (o) => boardWorld(Object.assign({ settings: { boardVerified: J(VIEWS) } }, o || {}));

describe('F519 (B, C) — a named question draws the stored card, counted live', () => {
  test('normalised and exact: free, VERIFIED, who and when', () => {
    const w = verWorld();
    const said = w.hbAsk('  where are our SUPPLIERS ');
    assert.ok(said, 'answered');
    const t = text(said);
    assert.match(t, /^VERIFIED Suppliers by stage: \d+ contracts/);
    assert.match(t, /Verified view · set by Amina Otieno, \d+ Oct · answers “supplier pipeline”, “Where are our suppliers\?”/);
    assert.match(t, /Free/);
    const s = w.hbS(), p = s.panels[s.panels.length - 1];
    assert.deepEqual(J(p.verified), { id: 'bv_1', by: 'Amina Otieno', at: '2026-10-02' });
    const { D, P } = openPlan(w);
    assert.equal(D.key, p.key, 'the card is the open one');
    assert.equal(P.pic, 'bars'); assert.equal(P.split.by, 'status');
    assert.ok(D.ids.every(id => w.getContract(id).metadata.category === 'supplier'), 'its set re-read');
  });
  test('asked again: one card, not two', () => {
    const w = verWorld();
    w.hbAsk('supplier pipeline'); w.hbAsk('supplier pipeline');
    assert.equal(w.hbS().panels.filter(p => p.verified).length, 1);
  });
  test('a near miss is not the verified view', () => {
    const w = verWorld();
    w.hbAsk('supplier pipeline by month');
    assert.equal(w.hbS().panels.filter(p => p.verified).length, 0);
  });
  test('the count is the reader\'s own reach', () => {
    const a = verWorld(); a.hbAsk('supplier pipeline');
    const all = openPlan(a).D.ids.length;
    const narrow = verWorld({ contracts: require('./board-precision').bookContracts().filter(c => c.folder === 'proc') });
    narrow.hbAsk('supplier pipeline');
    const D = openPlan(narrow).D;
    assert.ok(all > D.ids.length, `${all} > ${D.ids.length}`);
    assert.ok(D.ids.every(id => narrow.getContract(id)), 'never a contract outside the reader\'s book');
  });
});

describe('F519 (D) — the ⋯ row is an admin\'s', () => {
  const card = (admin) => {
    const w = boardWorld({ before: x => { x.isAdmin = () => admin; } });
    const { p } = w.hbAddCard({ all: true }, { pic: 'ring', split: { by: 'status' } }, 'Stages');
    w.hbPanelAct(p.id, 'more');
    return w.hbViewPanelHtml(p, 'all');
  };
  test('a non-admin sees no ⋯ and no row', () => {
    const h = card(false);
    assert.doesNotMatch(h, /data-hb-act="more"/); assert.doesNotMatch(h, /Verified view…/);
  });
  test('an admin sees ⋯, and the row once it is opened', () => {
    const h = card(true);
    assert.match(h, /data-hb-act="more"/); assert.match(h, /data-hb-act="verify">Verified view…</);
  });
});

describe('F519 (E, F) — a stale view is said; Copilot is told', () => {
  test('a ring over months cannot be drawn as set: the checker\'s line is said', () => {
    const w = boardWorld({ settings: { boardVerified: [Object.assign(J(VIEWS[0]), { which: { all: true }, recipe: { pic: 'ring', split: { by: 'date', unit: 'm', date: 'end' }, measure: 'count' } })] } });
    const t = text(w.hbAsk('supplier pipeline'));
    assert.match(t, /This verified view no longer draws as it was set: /);
    assert.deepEqual(J(w.state.settings.boardVerified[0].recipe.pic), 'ring', 'the stored view is never changed');
  });
  test('the data guide names the questions', () => {
    const w = verWorld();
    assert.match(w.hbDataGuide('all', 20000), /Verified views \(HaTi answers these questions itself[^)]*\): "Suppliers by stage" answers "supplier pipeline", "Where are our suppliers\?"/);
  });
});
