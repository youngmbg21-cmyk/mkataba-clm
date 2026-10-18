'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f728 — IMPORT: JAMBO'S PANEL BESIDE THE LIST (round 22, "The SAP way": the
   owner's word, 18 Oct 2026 — "you need a Jambo side panel")
   (1) A chosen file's facts are the review window's (MIG_CRITICAL, labelled
       by META_FIELDS), and one needs a person exactly when it is missing or
       read with low confidence — a contract that passes no money is not
       missing its value.
   (2) A press chooses; pressed again it is let go; a file that is gone is
       never chosen.
   (3) A row press CHOOSES now (it opened the contract); Open, a double-click
       and Enter on a chosen row still open it.
   (4) The words, in both books; no !important.
   AT THE PARENT (main before this change) every test here FAILS.
   The browser half: test/chromium/import-jambo-panel-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const MIG = R('js/views/migration.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const i = src.indexOf('const ' + name + ' ='); if (i < 0) return ''; return src.slice(i, src.indexOf(';\n', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f728 (1) a chosen file\'s facts', () => {
  const stage = () => {
    const ctx = { i18t: k => k, isMonetary: c => c.money !== false, fmtMoneyShortOf: c => 'KES ' + c.value, regDotDate: d => 'D:' + d,
      MIG_CRITICAL: ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value'],
      META_FIELDS: [{ k: 'counterparty', label: 'Counterparty' }, { k: 'contractType', label: 'Contract type' }, { k: 'effectiveDate', label: 'Effective date' },
        { k: 'expiryDate', label: 'Expiry date' }, { k: 'value', label: 'Value' }] };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(constLine(MIG, 'migFieldLabel') + constLine(MIG, 'migDay') + fnBody(MIG, 'migSideFacts') + ';this.facts=migSideFacts;', ctx);
    return ctx;
  };
  test('1a the review window\'s five, labelled as it labels them', () => {
    const F = stage().facts({ counterparty: 'Acme', value: 5, expiry: '2027-01-31', fields: { effDate: '2026-02-01' }, metadata: { contractType: 'Supply', confidence: {} } });
    assert.deepEqual(F.map(f => f.label), ['Counterparty', 'Contract type', 'Effective date', 'Expiry date', 'Value']);
    assert.deepEqual(F.map(f => f.text), ['Acme', 'Supply', 'D:2026-02-01', 'D:2027-01-31', 'KES 5']);
    assert.ok(F.every(f => !f.missing && !f.unsure));
  });
  test('1b missing or low confidence needs a person; no money passing is not missing', () => {
    const F = stage().facts({ counterparty: 'Acme', money: false, metadata: { contractType: 'NDA', confidence: { counterparty: 'low', value: 'low' }, renewalType: 'evergreen' } });
    const by = Object.fromEntries(F.map(f => [f.k, f]));
    assert.equal(by.counterparty.unsure, true, 'read with low confidence');
    assert.equal(by.effectiveDate.missing, true, 'not found');
    assert.equal(by.expiryDate.text, 'mig_side_evergreen', 'evergreen is an answer, not a gap');
    assert.equal(by.expiryDate.missing, false);
    assert.equal(by.value.text, 'mig_side_no_money');
    assert.equal(by.value.missing || by.value.unsure, false, 'a contract that passes no money is not missing its value');
  });
});

describe('f728 (2) choosing', () => {
  test('2a a press chooses, pressed again it is let go, a gone file is never chosen', () => {
    let painted = 0;
    const ctx = { _migPick: null, getContract: id => (id === 'MK-1' || id === 'MK-2') ? { id } : null, migSidePaint: () => { painted++; },
      document: { querySelectorAll: () => [] } };
    vm.createContext(ctx);
    vm.runInContext(fnBody(MIG, 'migPickSet') + ';this.get=()=>_migPick;', ctx);
    ctx.migPickSet('MK-1'); assert.equal(ctx.get(), 'MK-1');
    ctx.migPickSet('MK-2'); assert.equal(ctx.get(), 'MK-2', 'another row moves it there');
    ctx.migPickSet('MK-2'); assert.equal(ctx.get(), null, 'pressed again, let go');
    ctx.migPickSet('MK-9'); assert.equal(ctx.get(), null, 'a file that is gone is never chosen');
    assert.equal(painted, 4);
  });
});

describe('f728 (3) a row press chooses', () => {
  test('3a the row chooses; a double-click, and Enter on a chosen row, open', () => {
    const r = fnBody(MIG, 'renderMigration');
    assert.match(r, /el\.addEventListener\('click',\(\)=>migPickSet\(el\.getAttribute\('data-row'\)\)\)/);
    assert.match(r, /el\.addEventListener\('dblclick',\(\)=>selectContract\(el\.getAttribute\('data-row'\)\)\)/);
    assert.match(r, /if\(e\.key==='Enter'&&id===_migPick\) selectContract\(id\)/);
    assert.ok(!/\.forEach\(el=>el\.addEventListener\('click',\(\)=>selectContract/.test(r), 'a row press no longer opens');
    assert.match(r, /<aside class="mig-side" id="mig-side"/);
  });
  test('3b the panel\'s doors are the row\'s own: Review, Link, Open', () => {
    const f = fnBody(MIG, 'migSideFileHtml');
    assert.match(f, /data-mig-side-review=/); assert.match(f, /data-mig-side-link=/); assert.match(f, /data-open=/);
    assert.match(MIG, /const rv = t\.closest\('\[data-mig-side-review\]'\); if \(rv\) \{ const c = getContract\(rv\.getAttribute\('data-mig-side-review'\)\); if \(c\) openMigReview\(c\);/);
  });
});

describe('f728 (4) the words and the clothes', () => {
  test('4a in both books', () => {
    const keys = [...MIG.matchAll(/i18tn?\('(mig_side_[a-z_]+)'/g)].map(m => m[1]);
    assert.ok(keys.length >= 20, String(keys.length));
    for (const k of keys) for (const lang of ['en', 'sv']) {
      const plural = BOOKS[lang][k + '_one'] && BOOKS[lang][k + '_other'];
      assert.ok(BOOKS[lang][k] || plural, k + ' ' + lang);
    }
  });
  test('4b no !important', () => {
    assert.ok(!/!important/.test(fnBody(MIG, 'renderMigration')));
    assert.ok(!/!important/.test(fnBody(MIG, 'migSideHtml') + fnBody(MIG, 'migSideFileHtml') + fnBody(MIG, 'migSideBatchHtml')));
  });
});
