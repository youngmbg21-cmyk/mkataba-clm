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
   RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way", which
   reverses the four boxes above the card): the views are the list head's
   tabs (In negotiation among them, counted), and Stage is a "+ Filter"
   choice — the tabs' order and words, each counted, an empty stage not
   offered — standing as a chip once chosen. What each test protected is
   asked of the new home: the count is the rows, a pick narrows, the stage in
   force stays offered when it empties.
   (4) ADDED 22 Oct 2026 (the owner's answer to question 2, "B"): exactly the
   five drawn tabs; Term already ended, Auto-renewing soon, Overdue
   obligations and Details to fill are ONE "Quick filters" filter under
   + Filter, writing the tabs' own R.view.
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
/* the list head's own controls: a tab by its key, "+ Filter"'s choices of one filter, a chip's select */
const tab = (doc, k) => doc.querySelector(`[data-reg-home] [data-lh-seat="contracts"] [role="tablist"] [data-reg-view="${k}"]`);
/* the words "+ Filter" offers under one filter's heading (this harness's
   stand-in esc leaves quotes alone, so an option's JSON value is not read
   here); a choice made goes through the head's own writer, as the select's
   change does (spec.apply) */
const addOpts = (doc, label) => [...doc.querySelectorAll(`[data-reg-home] select[data-lh-add] optgroup[label="${label}"] option`)].map(o => o.textContent);
const addPick = (win, k, v) => win.LH_PAGES.contracts.apply({ [k]: v });

describe('f693 (1) Quick filters: In negotiation', () => {
  test('1a it is a tab, after Needs you in the drawing\'s order, with the count of live negotiations', () => {
    const { win, doc } = world();
    assert.equal(typeof win.negoIsLive, 'function', 'the Negotiations list\'s own reading is loaded');
    const b = tab(doc, 'nego');
    assert.ok(b, 'In negotiation is a tab');
    assert.deepEqual(JSON.parse(JSON.stringify(win.REG_CT_VIEWS)).slice(0, 4), ['needs', 'nego', 'expiring90', 'drafts'], 'All · Needs you · In negotiation · Ending in 90 days · Drafts');
    const want = win.state.contracts.filter(c => win.negoIsLive(c)).length;
    assert.equal(want, 2, 'the fixture: two live, one signed with a record');
    assert.equal(b.querySelector('.n').textContent, String(want), 'its number');
    assert.equal(b.firstChild.textContent.trim(), 'In negotiation');
  });
  test('1b a press narrows to exactly the live negotiations', () => {
    const { win, doc } = world();
    tab(doc, 'nego').click();
    assert.equal(win.regState().view, 'nego');
    assert.deepEqual([...doc.querySelectorAll('#reg-tbody [data-row]')].map(r => r.getAttribute('data-row')).sort(), ['MK-3', 'MK-4']);
  });
});

describe('f693 (2) the Stage box on the place', () => {
  test('2a no labelled box on the place: Stage is a "+ Filter" choice, never a tab row', () => {
    const { doc } = world('wall');
    const head = doc.querySelector('[data-reg-home] .ct-head');
    assert.equal(head.querySelectorAll('.reg-fb select, .ct-filters').length, 0, 'no labelled box');
    assert.equal(head.querySelectorAll('.ct-top select').length, 0, 'none beside the name');
    assert.ok(head.querySelector('select[data-lh-add] optgroup[label="Stage"]'), 'Stage under + Filter');
    assert.equal(doc.querySelectorAll('[data-reg-home] [data-reg-stage]').length, 0);
  });
  test('2b its choices: the tabs\' order and words, each counted; an empty stage, and All, are not offered', () => {
    const { doc } = world();
    assert.deepEqual(addOpts(doc, 'Stage'),
      ['Drafting (2)', 'In Review (1)', 'Executed (2)'],
      'Awaiting counterparty and Closed hold nothing here, so they are not listed; All changes nothing');
  });
  test('2c a pick narrows and stands as a chip with its ×; the chosen stage stays offered when it empties', () => {
    const { win, doc } = world();
    addPick(win, 'stage', 'Draft');
    assert.equal(win.regState().stage, 'Draft');
    assert.deepEqual([...doc.querySelectorAll('#reg-tbody [data-row]')].map(r => r.getAttribute('data-row')).sort(), ['MK-2', 'MK-4']);
    const chip = doc.querySelector('[data-reg-home] .lh-chip[data-lh-chip="stage"]');
    assert.ok(chip, 'the choice stands as a chip while it narrows');
    assert.ok(/Stage\s*Drafting/.test(chip.querySelector('label').textContent), 'the chip says the stage chosen');
    assert.ok(chip.querySelector('[data-lh-x]'), 'and carries its way back');
    /* both drafts leave the stage: the choice in force is still offered, at no count */
    win.state.contracts.forEach(c => { if (c.status === 'Draft') c.status = 'Declined'; });
    win.regRepaint();
    const o = [...doc.querySelectorAll('[data-reg-home] select[data-lh-f="stage"] option')].map(x => ({ v: x.value, t: x.textContent, on: x.selected }));
    assert.ok(o.some(x => x.v === 'Draft' && x.on && /^Drafting/.test(x.t)), JSON.stringify(o));
  });
  test('2d one reading for the tabs and the box (the full table keeps its tabs)', () => {
    const REG = R('js/views/register.js');
    const body = n => { const i = REG.indexOf('function ' + n + '('); return REG.slice(i, REG.indexOf('\nfunction ', i + 10)); };
    assert.match(body('regStageTabsHtml'), /regStageCounter\(\)/);
    assert.match(body('regStageOptsHtml'), /regStageCounter\(\)/);
  });
});

/* ═══ (4) EXACTLY THE FIVE DRAWN TABS; THE OLD QUICK FILTERS UNDER + FILTER ═══
   The owner, 22 Oct 2026, question 2 "B": "Move those four under + Filter —
   exactly the five drawn tabs. The four views are still one press away under
   + Filter." Term already ended · Auto-renewing soon · Overdue obligations ·
   Details to fill become ONE filter, "Quick filters", offering only those
   that hold rows, each counted; it reads and writes R.view, the very key the
   tabs write (one fact, one writer), so while one stands All is lit and
   counts the rows on screen, and its × puts R.view back to rest.
   The book is BOOK plus a lease whose term ended four months ago and a
   haulage deal with an obligation two months late — whole calendar months
   away from today, so the answer never depends on the day it runs. The
   world stands in for contractExpired, obState and detailsOf (it carries
   none of them); the reading under test is the head's, over regFiltered.
   RED AT e10e3af6: the four were tabs there (4a), + Filter had no Quick
   filters group (4b) and apply() refused the 'view' key (4c–4g). */
const iso4 = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthStart = off => { const n = new Date(); n.setHours(0, 0, 0, 0); return iso4(new Date(n.getFullYear(), n.getMonth() + off, 1)); };
const QUICK_BOOK = () => BOOK.map(c => ({ ...c, expiry: monthStart(18) })).concat([
  { id: 'MK-6', name: 'Old lease', counterparty: 'Twiga', status: 'Signed', folder: 'sales', lastAction: '2026-10-01', metadata: {}, expiry: monthStart(-4) },
  { id: 'MK-7', name: 'Haulage', counterparty: 'Bidco', status: 'Signed', folder: 'proc', lastAction: '2026-10-05', metadata: {}, expiry: monthStart(18),
    obligations: [{ id: 'o1', desc: 'Send the certificate', party: 'theirs', due: monthStart(-2), status: 'open' }] },
]);
const quickWorld = () => {
  const win = buildWorld({ registerView: true, negotiationView: true }).win;
  win.state = Object.assign({}, win.state || {}, { view: 'dashboard', contracts: QUICK_BOOK() });
  /* the world's stand-ins for three readings it does not carry */
  win.contractExpired = c => !!c && c.status === 'Signed' && !!c.expiry && win.daysUntil(c.expiry) < 0;
  win.obState = o => o.status === 'done' ? 'done' : (o.due && win.daysUntil(o.due) < 0 ? 'overdue' : 'open');
  win.detailsOf = c => ({ left: c && c.id === 'MK-2' ? 2 : 0 });
  win.insForce(true);
  const host = win.document.createElement('div'); host.id = 'ct-place'; win.document.body.appendChild(host);
  win.regPlaceSet({ show: 'list' });
  win.renderRegister({ home: true, hostId: 'ct-place', nav: 'register' });
  return { win, doc: win.document };
};
const HEAD = '[data-reg-home] [data-lh-seat="contracts"]';
const tabRow = doc => [...doc.querySelectorAll(`${HEAD} [role="tablist"] [data-reg-view]`)].map(b => ({
  k: b.getAttribute('data-reg-view'), lit: b.getAttribute('aria-selected') === 'true', n: b.querySelector('.n') ? Number(b.querySelector('.n').textContent) : null }));
const rowIds = doc => [...doc.querySelectorAll('#reg-tbody [data-row]')].map(r => r.getAttribute('data-row')).sort();

describe('f693 (4) exactly the five drawn tabs; the four old Quick filters under + Filter', () => {
  test('4a the tab row is All · Needs you · In negotiation · Ending in 90 days · Drafts, never the four, though they hold rows', () => {
    const { win, doc } = quickWorld();
    assert.deepEqual(J4(win.REG_CT_VIEWS), ['needs', 'nego', 'expiring90', 'drafts'], 'exactly the five drawn (with All)');
    const ks = tabRow(doc).map(t => t.k);
    assert.equal(ks[0], '', 'All first');
    for (const k of ['expired', 'autosoon', 'overdueob', 'details'])
      assert.ok(!ks.includes(k), k + ' is not a tab');
    assert.equal(win.regFiltered().length, 7, 'the book at rest');
    assert.equal(win.regViewCount('expired'), 1, 'the four still hold rows here: Term already ended');
  });
  test('4b + Filter offers ONE "Quick filters" group: only the four\'s choices that hold rows, each counted', () => {
    const { win, doc } = quickWorld();
    assert.ok(J4(win.REG_CT_FILTERS).includes('view'), 'the catalogue names it');
    assert.deepEqual(addOpts(doc, 'Quick filters'), ['Term already ended (1)', 'Overdue obligations (1)', 'Details to fill (1)'],
      'Auto-renewing soon holds nothing here, so it is not listed; the tabs\' views are not offered twice');
  });
  test('4c a choice narrows to its rows, stands as ONE chip with its ×, and All is lit counting the rows on screen', () => {
    const { win, doc } = quickWorld();
    addPick(win, 'view', 'expired');
    assert.equal(win.regState().view, 'expired', 'the same R.view the tabs write');
    assert.deepEqual(rowIds(doc), ['MK-6']);
    const chips = [...doc.querySelectorAll(`${HEAD} .lh-chip`)];
    assert.equal(chips.length, 1, 'one chip');
    assert.equal(chips[0].getAttribute('data-lh-chip'), 'view');
    assert.match(chips[0].querySelector('label').textContent, /Quick filters\s*Term already ended/);
    assert.ok(chips[0].querySelector('[data-lh-x="view"]'), 'its way back');
    const lit = tabRow(doc).filter(t => t.lit);
    assert.deepEqual(lit.map(t => t.k), [''], 'All is the lit tab');
    assert.equal(lit[0].n, 1, 'and its number is the rows behind it');
    assert.ok(!doc.querySelector(`${HEAD} select[data-lh-add] optgroup[label="Quick filters"]`), '+ Filter no longer offers the filter in force');
  });
  test('4d × puts R.view back to rest and the whole list comes back', () => {
    const { win, doc } = quickWorld();
    addPick(win, 'view', 'overdueob');
    assert.deepEqual(rowIds(doc), ['MK-7']);
    win.LH_PAGES.contracts.apply({ view: 'all' });
    assert.equal(win.regState().view, null, 'the rest the Clear buttons write (REG_FILTER_REST)');
    assert.equal(doc.querySelectorAll(`${HEAD} .lh-chip`).length, 0);
    assert.equal(rowIds(doc).length, 7);
  });
  test('4e one fact: a tab pressed while a Quick filter stands replaces it; All pressed keeps it', () => {
    const { win, doc } = quickWorld();
    addPick(win, 'view', 'details');
    assert.deepEqual(rowIds(doc), ['MK-2'], 'Details to fill');
    win.LH_PAGES.contracts.tab('');
    assert.equal(win.regState().view, 'details', 'All is already lit: its press changes nothing');
    win.LH_PAGES.contracts.tab('drafts');
    assert.equal(win.regState().view, 'drafts');
    assert.equal(doc.querySelectorAll(`${HEAD} .lh-chip`).length, 0, 'the chip went with it');
    assert.deepEqual(tabRow(doc).filter(t => t.lit).map(t => t.k), ['drafts']);
  });
  test('4f a door onto one of the four lands on it, its chip standing, the number on the door the rows behind it', () => {
    const { win, doc } = quickWorld();
    const n = win.regViewCount('expired');
    win.regGoFiltered({ view: 'expired', stage: 'all', sort: 'expiry' }, { open: false });
    win.renderRegister({ home: true, hostId: 'ct-place', nav: 'register' });
    assert.ok(doc.querySelector(`${HEAD} .lh-chip[data-lh-chip="view"]`), 'the chip says what is in force');
    assert.equal(rowIds(doc).length, n);
    /* a saved view carrying one of the four: the same */
    win.regPlaceSet({ view: null });
    win.localStorage.setItem(win.REG_SAVED_KEY, JSON.stringify([{ name: 'Late duties', set: { view: 'overdueob' } }]));
    win.LH_PAGES.contracts.useSaved('Late duties');
    assert.equal(win.regState().view, 'overdueob');
    assert.ok(doc.querySelector(`${HEAD} .lh-chip[data-lh-chip="view"]`), 'its chip stands');
    assert.deepEqual(rowIds(doc), ['MK-7']);
  });
  test('4g the phone is untouched: its views are still every one REG_VIEWS holds', () => {
    const { win } = quickWorld();
    assert.deepEqual(J4(win.REG_VIEWS.map(v => v.k)), ['expiring90', 'expired', 'autosoon', 'nego', 'overdueob', 'archived', 'details', 'needs', 'drafts']);
  });
});
function J4(x){ return JSON.parse(JSON.stringify(x)); }

describe('f693 (3) the words, in both books', () => {
  const I18N = R('js/i18n.js');
  test('3a In negotiation and Opening… in English and Swedish', () => {
    for (const [k, en, sv] of [['reg_view_nego', 'In negotiation', 'Under förhandling'], ['igw_opening', 'Opening…', 'Öppnar…']]) {
      assert.ok(new RegExp(`${k}: ["']${en}["']`).test(I18N), k + ' en');
      assert.ok(new RegExp(`${k}: ["']${sv}["']`).test(I18N), k + ' sv');
    }
  });
});
