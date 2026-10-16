'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f693 — THE CONTRACTS PLACE: FOUR BOXES ABOVE THE CARD, THE STAGES A BOX,
   AND "IN NEGOTIATION" (owner, 16 Oct 2026):
     "Image 1, add negotiation choice in the dropdown. Image 2, bring the
      highlighted filters above to the level below just above the bigger card.
      Then, take the status choices and put them in a dropdown as well. You
      will then have 4 dropdown filters above the card." — and, asked the
      order, "quick filter should be last".
   (1) Quick filters carries In negotiation: the contracts negoIsLive calls
       live — the reading the Negotiations list is made of — and its count is
       the rows it leaves.
   (2) The Stage box: the tabs' six in their order and words, each counted as
       the Quick filters box counts ("Drafting (2)"); a stage holding nothing
       is not offered unless it is the one chosen; a pick narrows, and Clear
       comes up while it does.
   (3) Words in both books; the paper being opened says so (job 1's ring).
   At the parent feb17f1 every test here fails: there is no 'nego' view, no
   Stage box on the place (it drew tabs) and no regStageOptsHtml.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const live = id => ({ negotiation: { rounds: [{ n: 1 }] }, changes: [{ id: 'ch-' + id, clauseId: 'c1', by: 'us' }] });
const BOOK = [
  { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', status: 'Signed', folder: 'sales', lastAction: '2026-10-02', metadata: {} },
  { id: 'MK-2', name: 'Listing', counterparty: 'Juno', status: 'Draft', folder: 'proc', lastAction: '2026-10-03', metadata: {} },
  { id: 'MK-3', name: 'Services', counterparty: 'Acme', status: 'Under Review', folder: 'sales', lastAction: '2026-10-04', metadata: {}, ...live('MK-3') },
  { id: 'MK-4', name: 'Haulage', counterparty: 'Bidco', status: 'Draft', folder: 'proc', lastAction: '2026-10-05', metadata: {}, ...live('MK-4') },
  /* a negotiation record on a signed deal is not live (negoIsLive's own rule) */
  { id: 'MK-5', name: 'Lease', counterparty: 'Twiga', status: 'Signed', folder: 'sales', lastAction: '2026-10-06', metadata: {}, ...live('MK-5') },
];
const world = (show = 'list') => {
  /* the Negotiations view's file stands beside the register: negoIsLive is its reading */
  const win = buildWorld({ registerView: true, negotiationView: true }).win;
  win.state = Object.assign({}, win.state || {}, { view: 'dashboard', contracts: BOOK.map(c => JSON.parse(JSON.stringify(c))) });
  win.insForce(true);
  const host = win.document.createElement('div'); host.id = 'ct-place'; win.document.body.appendChild(host);
  win.regPlaceSet({ show });
  win.renderRegister({ home: true, hostId: 'ct-place', nav: 'register' });
  return { win, doc: win.document };
};
const opts = (doc, id) => [...doc.getElementById(id).options].map(o => ({ v: o.value, t: o.textContent, on: o.selected }));
const pick = (win, doc, id, v) => { const s = doc.getElementById(id); s.value = v; s.dispatchEvent(new win.Event('change', { bubbles: true })); };

describe('f693 (1) Quick filters: In negotiation', () => {
  test('1a it is offered after Auto-renewing soon, with the count of live negotiations', () => {
    const { win, doc } = world();
    assert.equal(typeof win.negoIsLive, 'function', 'the Negotiations list\'s own reading is loaded');
    const o = opts(doc, 'reg-view-sel'), i = o.findIndex(x => x.v === 'nego');
    assert.ok(i > 0, 'In negotiation is a choice');
    assert.equal(o[i - 1].v, 'autosoon', 'after Auto-renewing soon');
    const want = win.state.contracts.filter(c => win.negoIsLive(c)).length;
    assert.equal(want, 2, 'the fixture: two live, one signed with a record');
    assert.equal(o[i].t, `In negotiation (${want})`);
  });
  test('1b a pick narrows to exactly the live negotiations', () => {
    const { win, doc } = world();
    pick(win, doc, 'reg-view-sel', 'nego');
    assert.equal(win.regState().view, 'nego');
    assert.deepEqual([...doc.querySelectorAll('#reg-tbody [data-row]')].map(r => r.getAttribute('data-row')).sort(), ['MK-3', 'MK-4']);
  });
});

describe('f693 (2) the Stage box on the place', () => {
  test('2a the four boxes above the card, Quick filters last; no tabs', () => {
    const { doc } = world('wall');
    const head = doc.querySelector('[data-reg-home] .ct-head');
    assert.deepEqual([...head.querySelectorAll('.ct-filters .reg-fb select')].map(x => x.id), ['reg-stage-sel', 'reg-type-sel', 'reg-category', 'reg-view-sel']);
    assert.equal(head.querySelectorAll('.ct-top select').length, 0, 'none beside the name');
    assert.equal(doc.querySelectorAll('[data-reg-home] [data-reg-stage]').length, 0);
  });
  test('2b its choices: the tabs\' order and words, each counted; an empty stage is not offered', () => {
    const { doc } = world();
    assert.deepEqual(opts(doc, 'reg-stage-sel').map(o => o.v + '|' + o.t),
      ['all|All', 'Draft|Drafting (2)', 'Under Review|In Review (1)', 'Signed|Executed (2)'],
      'Awaiting counterparty and Closed hold nothing here, so they are not listed');
  });
  test('2c a pick narrows, lights the box and brings up Clear; the chosen stage stays offered when it empties', () => {
    const { win, doc } = world();
    pick(win, doc, 'reg-stage-sel', 'Draft');
    assert.equal(win.regState().stage, 'Draft');
    assert.deepEqual([...doc.querySelectorAll('#reg-tbody [data-row]')].map(r => r.getAttribute('data-row')).sort(), ['MK-2', 'MK-4']);
    const chip = doc.getElementById('reg-stage-sel').closest('.reg-chip');
    assert.ok(chip.classList.contains('on'), 'the box is lit while it narrows');
    assert.ok(/Drafting \(2\)/.test(chip.textContent), 'the face says the stage chosen');
    assert.ok(doc.querySelector('#reg-clear-slot button, #reg-clear-slot [data-reg-clear], #reg-clear-slot .reg-clear') || /\S/.test((doc.getElementById('reg-clear-slot') || {}).textContent || ''), 'Clear while narrowed');
    /* both drafts leave the stage: the choice in force is still offered, at no count */
    win.state.contracts.forEach(c => { if (c.status === 'Draft') c.status = 'Declined'; });
    win.regRepaint();
    const o = opts(doc, 'reg-stage-sel');
    assert.ok(o.some(x => x.v === 'Draft' && x.on && x.t === 'Drafting'), JSON.stringify(o));
  });
  test('2d one reading for the tabs and the box (the full table keeps its tabs)', () => {
    const REG = R('js/views/register.js');
    const body = n => { const i = REG.indexOf('function ' + n + '('); return REG.slice(i, REG.indexOf('\nfunction ', i + 10)); };
    assert.match(body('regStageTabsHtml'), /regStageCounter\(\)/);
    assert.match(body('regStageOptsHtml'), /regStageCounter\(\)/);
  });
});

describe('f693 (3) the words, in both books', () => {
  const I18N = R('js/i18n.js');
  test('3a In negotiation and Opening… in English and Swedish', () => {
    for (const [k, en, sv] of [['reg_view_nego', 'In negotiation', 'Under förhandling'], ['igw_opening', 'Opening…', 'Öppnar…']]) {
      assert.ok(new RegExp(`${k}: ["']${en}["']`).test(I18N), k + ' en');
      assert.ok(new RegExp(`${k}: ["']${sv}["']`).test(I18N), k + ' sv');
    }
  });
});
