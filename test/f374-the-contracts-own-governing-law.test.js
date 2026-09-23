/* ============================================================
   f374 — THE CONTRACT'S OWN GOVERNING LAW UNDER THE TITLE
   (fix 7, Young ruled 23 Sep 2026: "A, show the governing law the contract
   names")
   ============================================================
   On the negotiation page the small line under the title read
   "Contract · Jurisdiction: Sweden (EU/GDPR)" on a contract governed by Kenyan
   law. It was copied from the WORKSPACE'S market setting — where this company
   sits — and presented as a fact about the paper.

   What the owner approved: the line shows the law the contract itself names —
   the same "Governing law" HaTi already shows on the Overview — and if HaTi has
   not read the contract's governing law, it says nothing about the law rather
   than guess.

   Run: node --test test/f374-the-contracts-own-governing-law.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const NEGO = fs.readFileSync(path.join(ROOT, 'js', 'views', 'negotiation.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* A body with no front matter, so the paper draws its label head — the head
   that carries the line. */
const BODY = '<h2>1. Supply</h2><p>The Supplier shall supply the goods.</p><h2>2. Law</h2><p>This Agreement is governed by the laws of Kenya.</p>';
const fixture = (over = {}) => ({ id: 'MK-374', name: 'Warehousing and Logistics Services Agreement',
  counterparty: 'Apex Logistics', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
  audit: [], rounds: [], versions: [], signatures: [], comments: [], redlineText: BODY, format: 'rich', ...over });

function paperLine(c, region, opts = {}){
  const w = buildWorld({ negotiationView: true, metadata: opts.metadata !== false });
  const { win } = w;
  win.state = Object.assign({}, win.state, { region, contracts: [c], activeId: c.id });
  win.negoInit(c);
  const html = win.redlineDocHtml(c, {});
  const box = win.document.createElement('div');
  box.innerHTML = html;
  const sub = box.querySelector('.rl-paper-sub');
  return { win, sub: sub ? sub.textContent.replace(/\s+/g, ' ').trim() : null };
}

describe('f374 the line under the title names the contract’s own law', () => {
  test('THE REPORT: a Kenyan-law contract in a Swedish workspace says Kenya, never Sweden', () => {
    const { sub } = paperLine(fixture({ metadata: { governingLaw: 'Kenya' } }), 'SE');
    assert.ok(sub, 'the line is drawn');
    /* AT THE PARENT: "Contract · Jurisdiction: Sweden (EU/GDPR)". */
    assert.match(sub, /Governing law: Kenya/, sub);
    assert.ok(!/Sweden|Jurisdiction/.test(sub), 'the workspace\'s market is not a fact about this paper: ' + sub);
  });

  test('where HaTi has not read the contract\'s governing law, the line says nothing about the law', () => {
    const { sub } = paperLine(fixture(), 'KE');
    assert.ok(sub != null, 'the line still carries what kind of document this is');
    assert.ok(!/Governing law|Jurisdiction|Kenya|Sweden/.test(sub), 'and no law at all — never a guess: ' + sub);
  });

  test('it is the same reading the Overview prints — the record\'s own words, spacing folded', () => {
    const { win } = paperLine(fixture(), 'KE');
    assert.equal(typeof win.contractGoverningLaw, 'function', 'one reading, published');
    assert.equal(win.contractGoverningLaw({ metadata: { governingLaw: '  England   and Wales ' } }), 'England and Wales');
    assert.equal(win.contractGoverningLaw({ metadata: {} }), '');
    assert.equal(win.contractGoverningLaw({}), '');
    assert.equal(win.contractGoverningLaw(null), '');
  });

  test('a stage without the metadata module draws the same line off the same field', () => {
    const { sub } = paperLine(fixture({ metadata: { governingLaw: 'Kenya' } }), 'SE', { metadata: false });
    assert.match(sub || '', /Governing law: Kenya/, sub);
  });

  test('it speaks the reader\'s language; the law itself is the record\'s and is never translated', () => {
    assert.equal((I18N.match(/ng_paper_law: '/g) || []).length, 2, 'in both books');
    assert.match(I18N, /ng_paper_law: 'Governing law: \{law\}'/);
    assert.match(I18N, /ng_paper_law: 'Tillämplig lag: \{law\}'/);
  });

  test('[wall] the paper no longer reads the workspace\'s market at all', () => {
    const c = code(NEGO);
    assert.ok(!/RL_REGION/.test(c), 'the region table is gone');
    assert.ok(!/Jurisdiction: \$\{/.test(c), 'and the line never prints a jurisdiction');
    const at = c.indexOf('function redlineDocHtml(');
    const body = c.slice(at, c.indexOf('\nfunction ', at + 10));
    assert.ok(!/state\.region/.test(body), 'the paper builder asks nothing of the market setting');
  });
});
