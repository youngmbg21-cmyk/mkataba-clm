/* ============================================================
   F387 — THE LIST INSPECTOR (Young picked it by name, 26 Sep 2026, off the
   "Contract List Options" page, option 3, and asked for it on the Approvals &
   signing page as well)
   ============================================================
   A press on a row SELECTS it and a panel beside the list says what that
   contract is; opening takes a second press — the panel's button, Enter, a
   double-click — and the arrows move the selection. Built with the floor the
   drawing listed for all three options: names print "&", "29 live" above and
   "All 30" below, "Non-monetary", days left only inside 90 days, plain column
   names with one sort arrow, a quiet reference, quiet empty views, no empty
   groups, no Contracts views on Negotiations, one filled button per page.

   RED AT THE PARENT (486b7b0): 31 of 33, MEASURED in a worktree at that
   commit (2k was added after the first build and is also red at 3cc28b1,
   its own parent). The two that pass are named: 5c is a [wall] (the Approvals page
   decides nothing, on both sides by design) and 5d a [control] (below the
   width line the old table and its row buttons are still there). 1b and 2i
   are the panel's own "reading must not write" and fail at the parent only
   because there was no panel to read — they are claims, not walls.

   A node stage has no layout, so its width reading answers "too narrow" and
   the register draws its full table exactly as every older test asserts. The
   panel's claims force the shape with insForce(true), which is the stage's
   own door onto it.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
/* Code only — a claim that a name is (or is not) CALLED must not be satisfied
   by the prose in a comment. */
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const INS = read('js/views/inspector.js');
const REG = read('js/views/register.js');
const AP = read('js/views/approvalsview.js');
const APP = read('js/app.js');
const I18N = read('js/i18n.js');
const DESK = read('js/desk.js');
const CT = read('js/views/contract.js');

const TODAY = new Date();
const isoIn = d => { const x = new Date(TODAY.getTime()); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

function fixture(id, over = {}){
  return { id, name: `Agreement ${id}`, counterparty: 'Kabras Sugar', template: 'RM',
    status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [],
    rounds: [], versions: [], signatures: [], comments: [], value: 1200000,
    lastAction: '01 Jul 2026', ...over };
}
/* A world with the register (and the inspector it brings), Contracts seat. */
function world(list, opts = {}){
  const w = buildWorld({ negotiationView: !!opts.nego, contractView: !!opts.nego, registerView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const calls = [];
  if (opts.nego) list.forEach(c => win.negoInit(c));
  win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: opts.nego ? 'redline' : 'register' });
  win.getContract = id => list.find(c => c.id === id) || null;
  /* The owner's name is the product's own reading; the register's stage
     stands in only what it cannot load. */
  if (typeof win.contractOwnerName !== 'function') win.contractOwnerName = c => (c && c.owner && c.owner.name) || '';
  if (opts.nego) win.setView = v => { win.state.view = v; if (v === 'redline') win.renderRedline(); };
  win.selectContract = id => calls.push(['open', id]);
  win.openWorkspace = id => calls.push(['open', id]);
  win.openRedlineWorkbench = id => calls.push(['nego', id]);
  if (opts.money === false) win.canViewValues = () => false;
  if (opts.monetary) win.isMonetary = opts.monetary;
  if (typeof win.insForce === 'function') win.insForce(opts.ins === undefined ? null : opts.ins);
  return { w, win, list, calls, byId: id => list.find(c => c.id === id),
    $: sel => win.document.querySelector(sel),
    $$: sel => [...win.document.querySelectorAll(sel)] };
}
const evt = (win, type, init) => new win.Event(type, Object.assign({ bubbles: true, cancelable: true }, init || {}));
const key = (win, k) => new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });

/* ============================================================ */
describe('f387 (1) the panel file, and what it may and may not do', () => {
  test('1a the inspector is its own file and publishes its names', () => {
    assert.ok(INS.length > 1000, 'js/views/inspector.js is there');
    for (const n of ['insFits', 'insForce', 'insPick', 'insPaintPanel', 'insListWire', 'insMarkRow',
      'insPanelHtml', 'insFacts', 'insTable', 'insLatest', 'insMoveCellHtml', 'insWatchWidth'])
      assert.match(INS, new RegExp('Object\\.assign\\(window, \\{[\\s\\S]*\\b' + n + '\\b'), n + ' is published');
  });
  test('1b READING MUST NOT WRITE — no call that starts a negotiation, saves or spends', () => {
    const c = code(INS);
    assert.ok(c.length > 1000, 'the file is there to read');
    for (const bad of ['negoTimeline(', 'negoInit(', 'negoChanges(', 'negoPending(', 'negoClauseList(',
      'persist(', 'flushSaves(', 'api(', 'fetch(', 'logAudit('])
      assert.ok(!c.includes(bad), bad + ' is never called by the panel');
  });
  test('1c every section borrows a reading the product already makes', () => {
    const c = code(INS);
    for (const r of ['ktReadingsRows(', 'regEndsSay(', 'negoMoveSay(', 'deskWorkingDaysBetween(',
      'fmtMoneyShortOf(', 'regStreamName(', 'contractOwnerName(', 'negoUnsentAsks('])
      assert.ok(c.includes(r), r + ' is borrowed rather than re-counted');
    assert.ok(!/fmtMoneyShort\(c\.value\)/.test(c), 'one contract is never printed in the workspace currency');
  });
  test('1d the Overview and the panel read the five readings from ONE place', () => {
    assert.match(CT, /function ktReadingsRows\(c\)\{/, 'the counting is its own function');
    assert.match(CT, /function ktReadingsRowsHtml\(c\)\{[\s\S]{0,400}const rows=ktReadingsRows\(c\);/, 'and the Overview draws from it');
    assert.match(CT, /docFillable,ktDayDot,ktReadingsRows,/, 'published, so the panel reaches it across the module line');
  });
  test('1e the desk publishes its own working-day walk (the "past your standard" line asks it)', () => {
    assert.match(DESK, /deskWorkingDaysBetween: _dkWorkingDaysBetween,/);
  });
  test('1f the width line is measured, forced only by a stage', () => {
    const c = code(INS);
    assert.match(c, /const INS_MIN_W = 1040;/);
    assert.match(c, /return w >= INS_MIN_W;/);
    assert.match(c, /if \(_insForce !== null\) return _insForce;/);
    assert.match(APP, /import '\.\/views\/inspector\.js';\s*\n\s*import '\.\/views\/approvalsview\.js';/,
      'loaded before the pages that draw it');
  });
});

/* ============================================================ */
describe('f387 (2) the Contracts list in the inspector’s shape', () => {
  const list = () => [
    fixture('MK-1', { name: 'Digital & Influencer Campaign', counterparty: 'Aleph Group', owner: { id: 'u1', name: 'Amina Otieno' },
      expiry: isoIn(45), audit: [
        { at: '2026-09-01T09:00:00.000Z', action: 'Created', detail: 'from a template', user: 'Amina' },
        { at: '2026-09-20T09:00:00.000Z', action: 'Edited', detail: 'the value', user: 'Amina' },
        { at: '2026-09-22T09:00:00.000Z', action: 'Shared', detail: 'with Aleph', user: 'Amina' },
        { at: '2026-09-24T09:00:00.000Z', action: 'Playbook', detail: 'checked', user: 'Amina' }] }),
    fixture('MK-2', { counterparty: 'Wasoko', expiry: isoIn(400) }),
    fixture('MK-3', { counterparty: 'Nampak', expiry: isoIn(-10), status: 'Signed' }),
  ];

  test('2a four columns — the reference, the counterparty over the agreement, the stage, the value', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    const heads = b.$$('.reg-table thead th').map(t => t.textContent.replace(/[▲▼]/g, '').trim());
    assert.deepEqual(heads, ['Ref', 'Counterparty and agreement', 'Stage', 'Value']);
    assert.ok(b.$('.reg-body.is-ins #ins-panel'), 'the panel sits beside the list');
    assert.equal(b.$('[data-ins-page="register"]').getAttribute('data-ins'), '1', 'the page records its shape');
    assert.equal(b.$$('#reg-tbody [data-menu]').length, 0, 'the row menu moved to the panel');
  });

  test('2b the first row is chosen, marked, and named by the panel', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    const sel = b.$('#reg-tbody tr.is-sel');
    assert.ok(sel, 'a row is selected on arrival');
    assert.equal(sel.getAttribute('data-row'), 'MK-1');
    assert.equal(sel.getAttribute('aria-current'), 'true');
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), 'MK-1');
    assert.match(b.$('#ins-panel .ins-cp').textContent, /Aleph Group/);
    assert.equal(b.$('#ins-panel .ins-sub').textContent.trim(), 'Digital & Influencer Campaign', 'an ampersand prints as one');
  });

  test('2c a press SELECTS and opens nothing; a double-click, Enter and the panel’s button open', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    const row = id => b.$(`#reg-tbody tr[data-row="${id}"]`);
    row('MK-2').dispatchEvent(evt(b.win, 'click'));
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), 'MK-2', 'the panel follows the press');
    assert.ok(row('MK-2').classList.contains('is-sel'));
    assert.ok(!row('MK-1').classList.contains('is-sel'), 'one row is selected at a time');
    assert.deepEqual(b.calls, [], 'a press opens nothing');
    row('MK-2').dispatchEvent(evt(b.win, 'dblclick'));
    assert.deepEqual(b.calls.pop(), ['open', 'MK-2'], 'a double-click opens the contract');
    row('MK-2').dispatchEvent(key(b.win, 'Enter'));
    assert.deepEqual(b.calls.pop(), ['open', 'MK-2'], 'Enter opens it');
    b.$('#ins-panel [data-ins-act="open"]').dispatchEvent(evt(b.win, 'click'));
    assert.deepEqual(b.calls.pop(), ['open', 'MK-2'], 'and so does the panel’s own button');
  });

  test('2d the arrows move the selection, and the panel with it', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    b.$('#reg-tbody tr[data-row="MK-1"]').dispatchEvent(key(b.win, 'ArrowDown'));
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), 'MK-2');
    b.$('#reg-tbody tr[data-row="MK-2"]').dispatchEvent(key(b.win, 'End'));
    assert.equal(b.$('#ins-panel').getAttribute('data-ins-id'), 'MK-3');
    assert.deepEqual(b.calls, [], 'moving opens nothing');
  });

  test('2e the facts: value, owner, and the end of the term in words', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    const fact = k => b.$(`#ins-panel [data-ins-fact="${k}"] dd`);
    assert.ok(fact('value'), 'the value is a fact');
    assert.match(fact('owner').textContent, /Amina Otieno/);
    assert.match(fact('ends').textContent, /in 45 days/, 'a near end says how near, in words');
    b.$('#reg-tbody tr[data-row="MK-2"]').dispatchEvent(evt(b.win, 'click'));
    assert.match(fact('ends').textContent, /months away/, 'a far one says months');
    b.$('#reg-tbody tr[data-row="MK-3"]').dispatchEvent(evt(b.win, 'click'));
    assert.match(fact('ends').textContent, /ended/, 'a passed one says so');
  });

  test('2f money only where the reader may see it — the fact is not drawn at all', () => {
    const b = world(list(), { ins: true, money: false });
    b.win.renderRegister();
    assert.equal(b.$('#ins-panel [data-ins-fact="value"]'), null);
  });

  test('2g Latest is the trail, newest first, three lines', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    const lines = b.$$('#ins-panel .ins-log li .t').map(x => x.textContent);
    assert.equal(lines.length, 3);
    assert.match(lines[0], /^Playbook/, 'newest first');
    assert.ok(!lines.some(l => /^Created/.test(l)), 'the fourth-newest is left to the History tab');
  });

  test('2h the panel’s ⋯ is the row menu, and a verb in it runs the row’s own act', () => {
    const b = world(list(), { ins: true });
    const done = [];
    b.win.contractSetArchived = async (c, on) => { done.push([c.id, on]); return false; };
    b.win.contractOnHold = () => false;
    b.win.renderRegister();
    const acts = b.$$('#ins-panel [data-ins-menu] [data-act]').map(x => x.getAttribute('data-act'));
    for (const k of ['open', 'share', 'archive', 'decline']) assert.ok(acts.includes(k), k + ' is in the panel’s menu');
    b.$('#ins-panel [data-ins-menu] [data-act="archive"]').dispatchEvent(evt(b.win, 'click'));
    assert.deepEqual(done, [['MK-1', true]], 'the row menu’s own act, on the chosen contract');
  });

  test('2i looking at a contract never starts a negotiation on it', () => {
    const b = world(list(), { ins: true });
    b.win.renderRegister();
    for (const id of ['MK-2', 'MK-3']) b.$(`#reg-tbody tr[data-row="${id}"]`).dispatchEvent(evt(b.win, 'click'));
    assert.ok(b.list.every(c => !c.negotiation), 'no record gained a negotiation by being looked at');
  });

  test('2k Open negotiation is offered where the Document tab says Open Negotiate — a change is on it', () => {
    /* Opening a contract can leave an EMPTY negotiation on the record, and the
       Document tab calls that "Start negotiating" (wsTabRowEndHtml reads
       c.changes.length). The panel may not call it an open negotiation: two
       doors onto one question, one answer. Red at 3cc28b1, where the panel
       asked only whether a negotiation object existed. */
    const opened = fixture('MK-4', { counterparty: 'Opened Only', negotiation: { round: 1, turn: 'owner' }, changes: [] });
    const argued = fixture('MK-5', { counterparty: 'Argued', negotiation: { round: 1, turn: 'owner' },
      changes: [{ id: 'CHG-9', status: 'pending', authorSide: 'counterparty', clauseId: 'c1', clauseLabel: '1. Term',
        summary: 'One year', seq: 1, createdAt: new Date().toISOString() }] });
    const b = world([opened, argued], { ins: true });
    b.win.renderRegister();
    const acts = id => { b.$(`#reg-tbody tr[data-row="${id}"]`).dispatchEvent(evt(b.win, 'click'));
      return b.$$('#ins-panel [data-ins-act]').map(x => x.getAttribute('data-ins-act')); };
    assert.deepEqual(acts('MK-4'), ['open'], 'an empty negotiation is not an open one');
    assert.deepEqual(acts('MK-5'), ['open', 'nego'], 'one with a change on it is, second to the contract');
    assert.match(code(CT), /const started=!!\(c\.negotiation&&Array\.isArray\(c\.changes\)&&c\.changes\.length\);/,
      '[control] the Document tab still reads it this way — the relation this claim holds the panel to');
  });

  test('2j below the line the page keeps its full table, and a press opens as it always did', () => {
    const b = world(list(), { ins: false });
    b.win.renderRegister();
    assert.equal(b.$('#ins-panel'), null, 'no panel');
    assert.equal(b.$$('.reg-table thead th').length, b.win.REG_COL_KEYS.length, 'the seat’s own columns');
    b.$('#reg-tbody tr[data-row="MK-2"]').dispatchEvent(evt(b.win, 'click'));
    assert.deepEqual(b.calls.pop(), ['open', 'MK-2'], 'one press opens, as before');
  });
});

/* ============================================================ */
describe('f387 (3) the Negotiations list in the inspector’s shape', () => {
  const pend = (c, id, side, created) => { c.changes.push({ id, status: 'pending', authorSide: side, clauseId: 'c1',
    clauseLabel: '2. Payment terms', summary: 'Sixty days, not thirty', kind: 'edit', author: side === 'owner' ? 'Us' : 'Them',
    seq: c.changes.length + 1, createdAt: created }); };
  const nw = () => {
    const a = fixture('MK-7', { counterparty: 'Aleph Group', changes: [], negotiation: { round: 2, turn: 'owner' } });
    pend(a, 'CHG-1', 'counterparty', new Date(Date.now() - 20 * 864e5).toISOString());
    const b = fixture('MK-8', { counterparty: 'Wasoko', changes: [], negotiation: { round: 1, turn: 'owner' } });
    pend(b, 'CHG-2', 'counterparty', new Date(Date.now() - 1 * 864e5).toISOString());
    return [a, b];
  };

  test('3a whose move with the fact behind it, and only the groups that have rows', () => {
    const b = world(nw(), { ins: true, nego: true });
    b.win.openNegotiations({ list: true });
    const heads = b.$$('.reg-table thead th').map(t => t.textContent.replace(/[▲▼]/g, '').trim());
    assert.deepEqual(heads, ['Ref', 'Counterparty and agreement', 'Whose move', 'Value']);
    const moves = b.$$('#reg-tbody tr[data-row] .ngl-w').map(x => x.textContent.trim());
    assert.ok(moves.length === 2 && moves.every(m => /^Yours · 1 change$/.test(m)), moves.join('|'));
    const bands = b.$$('#reg-tbody tr.ngl-band .ngl-band-k').map(x => x.textContent.trim());
    assert.deepEqual(bands, ['Waiting on you'], 'an empty group is not drawn');
    assert.equal(b.$('.reg-views'), null, 'the Contracts views are not drawn on this page');
  });

  test('3b the panel leads with what is on the table: the round, the ask, how long, the standard', () => {
    const b = world(nw(), { ins: true, nego: true });
    b.win.openNegotiations({ list: true });
    const t = b.$('#ins-panel .ins-table');
    assert.ok(t, 'on the table is drawn');
    assert.match(t.querySelector('h3').textContent, /Round 2 · 1/);
    assert.match(t.textContent, /from Aleph Group · 20 days/);
    assert.match(t.textContent, /past your 5-working-day standard/, 'twenty days is past the desk’s own five');
    const order = [...b.$('#ins-panel').children].map(x => x.className);
    assert.ok(order.indexOf('ins-sec ins-table') < order.findIndex(k => k === 'ins-facts'), 'the table leads, the facts follow');
    b.$('#reg-tbody tr[data-row="MK-8"]').dispatchEvent(evt(b.win, 'click'));
    assert.ok(!/past your/.test(b.$('#ins-panel .ins-table').textContent), 'a day-old ask is not past it');
  });

  test('3c the negotiation is the lead act, the contract the second; the row opens the negotiation', () => {
    const b = world(nw(), { ins: true, nego: true });
    b.win.openNegotiations({ list: true });
    const acts = b.$$('#ins-panel [data-ins-act]').map(x => x.getAttribute('data-ins-act'));
    assert.deepEqual(acts, ['nego', 'open']);
    assert.ok(b.$('#ins-panel [data-ins-act="nego"]').classList.contains('ui-btn-accent'), 'accent ink, never a second filled button');
    b.$('#reg-tbody tr[data-row="MK-7"]').dispatchEvent(evt(b.win, 'dblclick'));
    assert.deepEqual(b.calls.pop(), ['nego', 'MK-7']);
  });
});

/* ============================================================ */
describe('f387 (4) the floor under all three options, on the full table', () => {
  const book = () => [
    fixture('MK-1', { name: 'Media Buying — TV & Radio', expiry: isoIn(30) }),
    fixture('MK-2', { counterparty: 'SAP East Africa', expiry: isoIn(200) }),
  ];
  test('4a a name prints "&", never "&amp;amp;"', () => {
    const b = world(book(), { ins: false });
    b.win.renderRegister();
    const sub = b.$('#reg-tbody tr[data-row="MK-1"] .reg-sub');
    assert.equal(sub.textContent, 'Media Buying — TV & Radio');
    assert.ok(!/&amp;amp;/.test(b.$('#reg-tbody').innerHTML), 'escaped once, on the line and on the hover');
  });
  test('4b "Non-monetary", never "n/m"', () => {
    const b = world(book(), { ins: false, monetary: c => c.id !== 'MK-2' });
    b.win.renderRegister();
    const cell = b.$$('#reg-tbody tr[data-row="MK-2"] td').map(t => t.textContent.trim()).find(t => /monetary|n\/m/i.test(t));
    assert.equal(cell, 'Non-monetary');
  });
  test('4c the end of the term: days only inside 90, in words', () => {
    const b = world(book(), { ins: false });
    b.win.renderRegister();
    const row = id => b.$(`#reg-tbody tr[data-row="${id}"]`).textContent.replace(/\s+/g, ' ');
    assert.match(row('MK-1'), /in 30 days/);
    assert.ok(!/\bin \d+ days\b|· \d+ d\b/.test(row('MK-2')), 'a far date carries no count');
  });
  test('4d plain column names, and ONE sort arrow', () => {
    const b = world(book(), { ins: false });
    b.win.renderRegister();
    let heads = b.$$('.reg-table thead th').map(t => t.textContent.trim());
    for (const h of ['Ref', 'Counterparty and agreement', 'Stage', 'Whose move', 'Value', 'Signed', 'Ends', 'Owner'])
      assert.ok(heads.some(x => x.replace(/[▲▼]/g, '').trim() === h), h + ' is a head');
    assert.ok(!heads.some(h => /↕/.test(h)), 'no idle arrows');
    assert.equal(heads.filter(h => /[▲▼]/.test(h)).length, 0, 'sorted by a column not on the table: no arrow at all');
    b.win.regState().sort = 'value'; b.win.renderRegister();
    heads = b.$$('.reg-table thead th').map(t => t.textContent.trim());
    assert.deepEqual(heads.filter(h => /[▲▼]/.test(h)).map(h => h.replace(/[▲▼]/g, '').trim()), ['Value'],
      'the sorted column carries the one arrow');
    const th = REG.match(/\.reg-table th\{[^}]*\}/)[0];
    assert.match(th, /text-transform:none/, 'sentence case');
  });
  test('4e the reference is not a link', () => {
    const mk = REG.match(/\.reg-mk\{[^}]*\}/)[0];
    assert.ok(!/accent/.test(mk), 'the resting reference wears no accent');
  });
  test('4f a view with nothing in it is quiet; the head says "N live"', () => {
    const b = world(book(), { ins: false });
    b.win.renderRegister();
    const zero = b.$$('.reg-vtab.is-zero');
    assert.ok(zero.length >= 1, 'an empty view is marked quiet');
    assert.ok(zero.every(z => !z.querySelector('.n')), 'and prints no count');
    assert.match(code(REG), /i18tn\('ngl_n_live',n,/, 'the head counts the live book in the word "live"');
  });
  test('4g Display holds Table · Board, the density and the amendment fold', () => {
    const b = world(book(), { ins: false });
    b.win.renderRegister();
    const pop = b.$('#reg-display-pop');
    assert.ok(b.$('#reg-display') && pop, 'one Display control on the bar');
    assert.ok(pop.hidden, 'shut at rest');
    for (const sel of ['button[data-reg-mode="board"]', 'button[data-reg-density="comfortable"]', '#reg-flat'])
      assert.ok(pop.querySelector(sel), sel + ' is inside it');
    assert.equal(b.$('#reg-showing #reg-flat'), null, 'the foot is the count');
    b.$('#reg-display').dispatchEvent(evt(b.win, 'click'));
    assert.equal(b.$('#reg-display-pop').hidden, false, 'the button opens it');
  });
  test('4h the filters sit on the list’s own card; the name and the views on the page', () => {
    const b = world(book(), { ins: false });
    b.win.renderRegister();
    assert.ok(b.$('.reg-card > .reg-filterbar'), 'the bar is the card’s first row');
    assert.equal(b.$('.reg-band .reg-filterbar'), null, 'and not in the band');
    const band = REG.match(/\.reg-band\{[^}]*\}/)[0];
    assert.ok(!/background/.test(band), 'the band paints no ground');
    assert.ok(!/#page-head\{background:var\(--color-surface\)\}/.test(REG), 'nor the page head');
    assert.match(I18N, /\n    reg_adapt: 'More filters',/);
    assert.match(I18N, /\n    reg_adapt: 'Fler filter',/);
  });
});

/* ============================================================ */
describe('f387 (5) the Approvals & signing page', () => {
  test('5a the page draws the list and the panel in the inspector’s shape', () => {
    const c = code(AP);
    assert.match(c, /const INS=\(typeof insFits==='function'\)&&insFits\(\)/);
    assert.match(c, /<aside id="ins-panel" class="ins-panel"/);
    assert.match(c, /apInsPaint\(tab, tab==='approvals'\?ap:sg\)/);
    assert.match(c, /data-ins-page="approvals" data-ins="\$\{INS\?'1':'0'\}"/);
  });
  test('5b the lead act is the page’s own verb, and the row opens it on a second press', () => {
    const c = code(AP);
    assert.match(c, /run:c=>apOpenSigning\(c\.id\)/, 'the Signing tab, where the gate and the Sign button are');
    assert.match(c, /onOpen:pid=>apOpenSigning\(pid\)/);
    assert.match(c, /\{ k:'open', label:i18t\('ins_open_contract'\), run:c=>selectContract\(c\.id\) \}/);
  });
  test('5c [wall] the page still decides nothing', () => {
    const c = code(AP);
    for (const bad of ['approveContract(', 'rejectApprovalStep(', 'signDocument('])
      assert.ok(!c.includes(bad), bad + ' is never called from this page');
  });
  test('5d [control] below the line the old table stays, per-row buttons and all', () => {
    const c = code(AP);
    assert.match(c, /document\.querySelectorAll\('\[data-ap-open\]'\)\.forEach/, 'the row buttons are still wired where the table draws');
  });
});

/* ============================================================ */
describe('f387 (6) every new sentence in both books', () => {
  const book = lang => I18N.slice(I18N.indexOf(lang === 'en' ? '\n  en: {' : '\n  sv: {'),
    lang === 'en' ? I18N.indexOf('\n  sv: {') : I18N.indexOf('\nconst SRV_MSG'));
  test('6a the panel’s, the list’s and the Approvals page’s words', () => {
    const singles = ['ins_panel_label', 'ins_none', 'ins_none_rows', 'ins_open_contract', 'ins_open_nego', 'ins_more',
      'ins_your_move', 'ins_their_move', 'ins_f_value', 'ins_f_owner', 'ins_f_stream', 'ins_f_type', 'ins_f_signed',
      'ins_f_ends', 'ins_table', 'ins_table_n', 'ins_from', 'ins_over', 'ins_yours_unsent_row', 'ins_sent_to',
      'ins_days_today', 'ins_yours_unsent', 'ins_yours_nocopy', 'ins_theirs_today', 'ins_read', 'ins_latest',
      'ins_latest_loading', 'ins_latest_none', 'ins_latest_failed', 'ins_ap_sec', 'ins_ap_waits', 'ins_sg_sec',
      'ins_col_approval', 'reg_col_ref', 'reg_col_party', 'reg_col_stage', 'reg_col_ends', 'reg_col_owner_word',
      'reg_non_monetary_word', 'reg_ended', 'reg_ends_today', 'reg_display', 'reg_display_title',
      'reg_display_show_as', 'reg_nest_amendments'];
    const plurals = ['ins_more_asks', 'ins_days', 'ins_yours_n', 'ins_theirs_days', 'reg_ends_in', 'reg_ends_months'];
    for (const lang of ['en', 'sv']){
      const b = book(lang);
      for (const k of singles) assert.ok(b.includes('\n    ' + k + ':'), `${k} missing in ${lang}`);
      for (const k of plurals) assert.ok(b.includes('\n    ' + k + '_one:') && b.includes('\n    ' + k + '_other:'), `${k} plural missing in ${lang}`);
    }
  });
});
