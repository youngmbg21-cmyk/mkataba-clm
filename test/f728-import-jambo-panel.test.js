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
   RE-POINTED 19 Oct 2026 (lane E, round 22 built as drawn): a row of the
   batch may be a file that did not become a contract (its key 'q:<n>'); the
   row press is one listener armed at load; the panel's doors are the drawn
   ones (File it · Open the file · Link it · All the details); the panel is
   Jambo's shared frame (f772).
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
    ctx.migDay = d => 'D:' + d;
    vm.runInContext(constLine(MIG, 'migFieldLabel') + fnBody(MIG, 'migSideFacts') + ';this.facts=migSideFacts;', ctx);
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
    const ctx = { _migPick: null, getContract: id => (id === 'MK-1' || id === 'MK-2') ? { id, _light: false } : null, migSidePaint: () => { painted++; },
      migState: () => ({ queue: [{ name: 'copy.pdf', status: 'dupe' }] }), document: { querySelectorAll: () => [] } };
    vm.createContext(ctx);
    vm.runInContext(fnBody(MIG, 'migPickSet') + ';this.get=()=>_migPick;', ctx);
    ctx.migPickSet('MK-1'); assert.equal(ctx.get(), 'MK-1');
    ctx.migPickSet('MK-2'); assert.equal(ctx.get(), 'MK-2', 'another row moves it there');
    ctx.migPickSet('MK-2'); assert.equal(ctx.get(), null, 'pressed again, let go');
    ctx.migPickSet('MK-9'); assert.equal(ctx.get(), null, 'a file that is gone is never chosen');
    ctx.migPickSet('q:0'); assert.equal(ctx.get(), 'q:0', 'a file that did not become a contract is chosen too');
    ctx.migPickSet('q:7'); assert.equal(ctx.get(), null);
    assert.equal(painted, 6);
  });
});

describe('f728 (3) a row press chooses', () => {
  test('3a the row chooses; a double-click, and Enter on a chosen row, open', () => {
    assert.match(MIG, /if \(\(el = t\.closest\('\.mig-table tbody tr\[data-row\]'\)\)\)\{ migPickSet\(el\.getAttribute\('data-row'\)\); return; \}/);
    assert.match(MIG, /const id = tr\.getAttribute\('data-row'\); if \(getContract\(id\)\) selectContract\(id\);/, 'a double-click opens');
    assert.match(MIG, /if \(e\.key === 'Enter' && id === _migPick && getContract\(id\)\) selectContract\(id\); else migPickSet\(id\);/);
    assert.ok(!/addEventListener\('click',\s*\(\)\s*=>\s*selectContract/.test(MIG), 'a row press does not open');
    assert.match(fnBody(MIG, 'renderMigration'), /<aside class="ins-panel mig-side" id="mig-side"/);
  });
  test('3b the panel\'s doors as drawn: File it, Open the file, Link it, and the whole review kept', () => {
    const f = fnBody(MIG, 'migSideRowHtml');
    assert.match(f, /data-mig-file=/); assert.match(f, /data-mig-check-one=/); assert.match(f, /data-mig-side-link=/); assert.match(f, /data-open=/); assert.match(f, /data-mig-review-full=/);
    assert.match(MIG, /openMigReview\(c, \{ onDone:ok => /);
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
    assert.ok(!/!important/.test(fnBody(MIG, 'migSideRowHtml') + fnBody(MIG, 'migSidePaint') + fnBody(MIG, 'migSideSay')));
  });
});
