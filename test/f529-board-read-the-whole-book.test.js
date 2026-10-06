/* f529 — CHARTS THAT EXPLAIN, PART 7: CHART WHAT CONTRACTS SAY
   (Young, 5 Oct 2026, "HaTi Board: Charts That Explain", recommendation 7:
   "Read each contract once for key terms (liability cap, auto-renewal, notice
   period, price increases) and run the playbook check across the whole book
   overnight")
   ============================================================================
     (1) ON BY DEFAULT for the pilots (Young, 6 Oct 2026) — an admin can turn
         it off; off, it reads nothing and spends nothing;
     (2) THE READING — once per wording; a term that asserts something
         (a cap, a renewal, a price rule, a notice period) is believed only
         with a quote that is in the wording, else 'unclear'; the owner pays;
         a contract with no owner is skipped by name; a second run spends
         nothing; a failure marks nothing done;
     (3) THE CHECK ACROSS THE BOOK — an open contract with no check takes the
         verdicts as its ordinary playbook record; an EXECUTED one is never
         written: its check is kept beside it;
     (4) TRANSPORT — the list carries states and verdict statuses only (no
         quotes), the single record the quotes; a save never stores it;
     (5) THE BOARD — three new splits (liability cap, renews by itself, price
         increases), 'not read yet' a group of its own, standards counted off
         the overnight check too; one language with the server; both books;
     (6) an admin-only drawer, its cost said beside the switch.
   Run: node --test test/f529-board-read-the-whole-book.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const TEXT = 'This Supply Agreement is made between Highland Corporate Ltd and Nordkust Industri AB. '
  + 'The Supplier\'s total liability under this Agreement shall not exceed the fees paid in the twelve months before the claim. '
  + 'The Supplier may increase its prices once a year in line with the consumer price index. '
  + 'This Agreement is governed by the laws of Sweden and continues for two years. ';
const TERMS = {
  liabilityCap: { state: 'capped', quote: 'total liability under this Agreement shall not exceed the fees paid' },
  autoRenew: { state: 'yes', quote: 'renews automatically for further one-year periods' },   /* not in the wording */
  notice: { days: 90, quote: 'ninety days written notice' },                                   /* not in the wording */
  priceIncrease: { state: 'indexed', quote: 'increase its prices once a year in line with the consumer price index' },
};
const VERDICTS = [{ category: 'Payment terms', status: 'deviation', quote: '', position: '≤ 45 days' }];
const PLAYBOOK = { _default: { label: 'All contracts', positions: [{ category: 'Data protection', pos: 'preferred', escalate: false }],
  ranges: [{ key: 'paymentDays', op: '<=', value: 45, label: 'Payment terms' }] } };
/* the stand-in answers whichever tool it is asked for */
const answer = body => {
  const t = body.tool_choice && body.tool_choice.name;
  if (t === 'key_terms') return [{ type: 'tool_use', id: 'tu_k', name: 'key_terms', input: TERMS }];
  if (t === 'playbook_review') return [{ type: 'tool_use', id: 'tu_p', name: 'playbook_review', input: { verdicts: VERDICTS } }];
  return 500;
};

describe('f529 (1)–(4) the overnight reading, against a real server', () => {
  let ai, h, W, owner;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: 'Supply ' + id, counterparty: 'Nordkust Industri AB', folder: FOLDER_A, status: 'Under Review',
    template: null, fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
    signatures: [], comments: [], changes: [], value: 1000, redlineText: '<h2>1. Terms</h2><p>' + TEXT + '</p>', format: 'rich', ...over } } });
  const run = () => W.admin.json('/api/board/reading/run', { method: 'POST' });
  const kinds = () => ai.calls.map(c => c.body.tool_choice && c.body.tool_choice.name);

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    owner = W.users.unrestricted;
    const own = { id: owner.id, name: owner.name };
    await put('MK-BR-1', { owner: own });                         // open: read and checked onto the record
    await put('MK-BR-2', { owner: own, status: 'Signed' });       // executed: read, checked BESIDE it
    await put('MK-BR-3', {});                                     // no owner
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('(1) on by default; turned off, a run reads nothing and spends nothing', async () => {
    const st = await W.admin.json('/api/board/reading');
    assert.equal(st.on, true, 'on for the pilots');
    await W.admin.json('/api/board/reading', { method: 'PUT', body: { on: false } });
    assert.equal((await W.admin.json('/api/board/reading')).on, false, 'an admin can turn it off');
    const out = await run();
    assert.equal(out.off, true);
    assert.equal(ai.calls.length, 0);
    const refused = await W.unrestricted.raw('/api/board/reading');
    assert.equal(refused.status, 403, 'the drawer is an admin\'s');
  });

  test('(2)(3) on: each owned contract is read once and checked; the owner pays; quotes decide', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: PLAYBOOK } });
    await W.admin.json('/api/board/reading', { method: 'PUT', body: { on: true } });
    for (let i = 0; i < 4; i++) ai.script(answer);   /* two readings, two checks */
    const out = await run();
    assert.equal(out.read, 2, JSON.stringify(out));
    assert.equal(out.checked, 2, JSON.stringify(out));
    assert.equal(out.skipped.noOwner, 1);
    assert.deepEqual(kinds().sort(), ['key_terms', 'key_terms', 'playbook_review', 'playbook_review']);
    const c1 = await W.admin.json('/api/contracts/MK-BR-1');
    assert.equal(c1._book.terms.liabilityCap.state, 'capped', 'a cap with its own words is believed');
    assert.ok(c1._book.terms.liabilityCap.quote);
    assert.equal(c1._book.terms.autoRenew.state, 'unclear', 'a renewal whose quote is not in the wording is not');
    assert.equal(c1._book.terms.notice.days, null, 'nor a notice period');
    assert.equal(c1._book.terms.priceIncrease.state, 'indexed');
    assert.ok(c1.playbook && c1.playbook.overnight && c1.playbook.verdicts.length === 1, 'an open record takes the check');
    assert.ok((c1.audit || []).some(a => a.action === 'Playbook' && /overnight/.test(a.detail) && a.detail.includes(owner.name)));
    const c2 = await W.admin.json('/api/contracts/MK-BR-2');
    assert.ok(!c2.playbook, 'an executed record is never written');
    assert.equal(c2._book.pb.verdicts.length, 1, 'its check is kept beside it');
    const cfg = await W.admin.json('/api/ai/config');
    const mine = (cfg.spend.byPerson || []).find(p => p.userId === owner.id);
    assert.ok(mine && mine.requests >= 4, 'booked to the owner: ' + JSON.stringify(cfg.spend.byPerson));
  });

  test('(2) once per wording: a second run spends nothing; a new wording is read again', async () => {
    const n0 = ai.calls.length;
    let out = await run();
    assert.equal(ai.calls.length, n0, JSON.stringify(out));
    const cur = await W.admin.json('/api/contracts/MK-BR-1');
    await W.admin.json('/api/contracts/MK-BR-1', { method: 'PUT', body: { baseVersion: cur._v, contract: { ...cur, redlineText: cur.redlineText + '<p>A new sentence on delivery times and places for the goods.</p>' } } });
    ai.script(answer);
    out = await run();
    assert.equal(out.read, 1, JSON.stringify(out));
    assert.deepEqual(kinds().slice(n0), ['key_terms'], 'the check is not run twice');
  });

  test('(2) a failure marks nothing done and is tried again', async () => {
    await put('MK-BR-4', { owner: { id: owner.id, name: owner.name }, playbook: { key: 'x', label: 'x', verdicts: [{ category: 'A', status: 'aligned' }] } });
    ai.script(500);
    let out = await run();
    assert.equal(out.skipped.failed, 1, JSON.stringify(out));
    let c = await W.admin.json('/api/contracts/MK-BR-4');
    assert.ok(!c._book, 'nothing kept on a failure');
    ai.script(answer);
    out = await run();
    assert.equal(out.read, 1);
    c = await W.admin.json('/api/contracts/MK-BR-4');
    assert.ok(c._book && c._book.terms);
  });

  test('(4) the list carries states only; a save never stores the reading', async () => {
    const list = await W.admin.json('/api/contracts?limit=50');
    const rows = Array.isArray(list) ? list : (list.contracts || list.rows || []);
    const r1 = rows.find(c => c.id === 'MK-BR-1');
    assert.ok(r1 && r1._book && r1._book.terms.liabilityCap.state === 'capped', JSON.stringify(r1 && r1._book));
    assert.ok(!('quote' in r1._book.terms.liabilityCap), 'no quotes on the list');
    const r2 = rows.find(c => c.id === 'MK-BR-2');
    assert.deepEqual(Object.keys(r2._book.pb.verdicts[0]).sort(), ['category', 'status']);
    const cur = await W.admin.json('/api/contracts/MK-BR-4');
    await W.admin.json('/api/contracts/MK-BR-4', { method: 'PUT', body: { baseVersion: cur._v, contract: { ...cur, name: 'Renamed' } } });
    assert.match(read('server/server.js'), /delete c\._book;/);
    assert.match(read('js/core.js'), /delete payload\._book;/);
  });
});

describe('f529 (5) the board charts what the contracts say', () => {
  function world(){
    const cs = [];
    const add = (id, book, o) => cs.push(Object.assign({ id, name: id, counterparty: 'P ' + id, status: 'Signed', value: 1e6, folder: 'proc', audit: [], metadata: {} }, book ? { _book: book } : {}, o || {}));
    add('MK-1', { terms: { liabilityCap: { state: 'uncapped' }, autoRenew: { state: 'yes' }, priceIncrease: { state: 'at_will' } } });
    add('MK-2', { terms: { liabilityCap: { state: 'capped' }, autoRenew: { state: 'no' }, priceIncrease: { state: 'fixed' } } });
    add('MK-3', { terms: { liabilityCap: { state: 'weird' } } });
    add('MK-4', null);
    add('MK-5', { pb: { verdicts: [{ category: 'Payment terms', status: 'deviation' }] } });
    const w = buildWorld({ intelView: true }).win;
    w.state = { contracts: cs, settings: {}, view: 'dashboard' };
    w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } };
    w.cKind = () => 'Contract'; w.getContract = id => cs.find(c => c.id === id) || null;
    w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
    w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
    w.eval(read('js/views/homeboard.js'));
    w.hbPaintBoard = () => {};
    return { w, cs };
  }
  test('three splits, unread and unclear their own groups', () => {
    const { w, cs } = world();
    assert.deepEqual(cs.map(c => w.hbGroupOf(c, 'liabcap')), ['uncapped', 'capped', 'unclear', 'unread', 'unread']);
    assert.deepEqual(cs.map(c => w.hbGroupOf(c, 'autorenew')), ['yes', 'no', 'unclear', 'unread', 'unread']);
    assert.deepEqual(cs.map(c => w.hbGroupOf(c, 'priceup')), ['at_will', 'fixed', 'unclear', 'unread', 'unread']);
    assert.equal(w.hbGroupLabel('liabcap', 'uncapped'), 'No liability cap');
    assert.equal(w.hbGroupWord('autorenew'), 'By automatic renewal');
  });
  test('the overnight check counts against our standards; coverage says what was read', () => {
    const { w, cs } = world();
    assert.equal(w.hbStdStateOf(cs[4]), 'off');
    assert.deepEqual([...w.hbStdBreaches(cs[4])], ['Payment terms']);
    assert.equal(w.hbStdStateOf(cs[3]), 'unchecked');
    const cov = w.hbCoverageOf(cs);
    assert.equal(cov.terms, 3);
    const sheet = w.hbFactSheet({ title: 'T', cs, reading: { lines: [] } });
    assert.match(sheet.text, /Key terms read from the wording \(liability cap, renewal, price increases\): 3 of 5\./);
  });
  test('the words reach the split', () => {
    const { w } = world();
    for (const [q, by] of [['contracts by liability cap', 'liabcap'], ['value by auto-renewal', 'autorenew'], ['show contracts by price increases', 'priceup']]){
      const R = w.hbRecipeRead(q);
      assert.ok(R && R.split && R.split.by === by, q + ' → ' + JSON.stringify(R && R.split));
    }
  });
  test('one language with the server; both books', () => {
    const srv = read('server/server.js');
    for (const k of ['liabcap', 'autorenew', 'priceup']){
      assert.match(srv, new RegExp("GRAPH_CHART_SPLITS = \\[[^\\]]*'" + k + "'"));
      assert.match(srv, new RegExp(k + ": '" + k + "'"));
    }
    const I18N = read('js/i18n.js');
    const keys = [...new Set((I18N.match(/^    (?:hb_kt_|hb_by_liabcap|hb_by_autorenew|hb_by_priceup|st_book_|st_p_book)\w*:/gm) || []).map(x => x.trim()))];
    assert.ok(keys.length >= 30, keys.length);
    keys.forEach(k => assert.equal((I18N.match(new RegExp('^    ' + k, 'gm')) || []).length, 2, k));
  });
});

describe('f529 (6) the drawer', () => {
  test('admin-only routes; the cost is said beside the switch', () => {
    const srv = read('server/server.js');
    assert.match(srv, /app\.get\('\/api\/board\/reading', auth, admin,/);
    assert.match(srv, /app\.put\('\/api\/board\/reading', auth, admin,/);
    assert.match(srv, /app\.post\('\/api\/board\/reading\/run', auth, admin,/);
    assert.match(srv, /AGENT_DEFAULTS\.book = \{ on: true,/);
    const st = read('js/views/settings.js');
    assert.match(st, /st_book_on[\s\S]{0,200}st_book_cost/, 'the cost sits under the switch');
    assert.match(st, /agents:\{[\s\S]{0,1600}id="st-book"[\s\S]{0,200}wire\(\)\{ stAgentsPaint\(\); stBookLoad\(\); \}/, 'it sits with the overnight agents, not a fifth Copilot row');
  });
});
