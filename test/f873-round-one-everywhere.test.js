/* ============================================================
   f873 — ROUND 1 OF THE UI UPGRADE: EVERYWHERE AT ONCE
   ============================================================
   The owner's "all yes, start round 1" (24 Oct 2026), off the before-and-after
   report. Five things that reach every page at once:
   (1) a firmer grey: the one grey that carried most small text, #66666B, is
       #4B4B50 (the owner's pick "The Legora Way"); 400 stays for lines;
   (2) the width handle's grip shows only where the hand is (hover, drag,
       keyboard) on a device that can hover; a finger still sees it;
   (3) money is never cut: the two columns that cut it (Approvals' value,
       Parties' paper) are 112 wide;
   (4) one placeholder for every Jambo box, in both books; beside a contract
       it names the contract;
   (5) HaTi's own dropdown face on sign-up, History and Import (sign-up also
       arms the press, since it paints before startApp).
   Measured at the parent (0e002c3): every test here fails.

   Run: node --test test/f873-round-one-everywhere.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const INDEX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
/* the function's region: from its head to the next top-level function */
const fnRegion = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

describe('f873 (1) a firmer grey', () => {
  test('1a the small-text greys are #4B4B50; the line grey stays', () => {
    for (const t of ['--color-neutral-500', '--color-neutral-600', '--st-gray-fg', '--nav-ink', '--hb-ink-2', '--hb-mute'])
      assert.match(INDEX, new RegExp(t + ':#4B4B50'), t);
    assert.match(INDEX, /--color-neutral-400:#6A6A6F/);
    assert.doesNotMatch(strip(INDEX), /--color-neutral-(500|600):#66666B/);
  });
});

describe('f873 (2) the width handle shows where the hand is', () => {
  test('2a hidden at rest only where the device can hover; hover, drag and keyboard draw it', () => {
    const m = INDEX.match(/@media \(hover:hover\)\{\s*\.ig-resizer span\{opacity:0;[^}]*\}\s*\.ig-resizer:hover span,\.ig-resizer\[data-drag\] span,\.ig-resizer:focus-visible span\{opacity:1\}\s*\}/);
    assert.ok(m, 'the hover-only grip rule');
  });
});

describe('f873 (3) money is never cut', () => {
  test('3a Approvals\' value and Parties\' paper columns are 112 wide', () => {
    assert.match(R('js/views/approvalsview.js'), /t:i18t\('reg_col_value'\),right:true,w:112\}/);
    assert.match(R('js/views/customers.js'), /k: 'paper', label: i18t\('cu_col_paper'\), r: 1, w: 112 \}/);
  });
});

describe('f873 (4) one placeholder for every Jambo box', () => {
  const GENERAL = ['na_ask_ph', 'int_ask_portfolio', 'ai_side_ph', 'pd_ask_any', 'st_jb_ph', 'jl_ph_any', 'jl_ph_list', 'jl_ph_week', 'hb_ask_ph', 'cn_box_ph'];
  test('4a the same words on every box, in both books', () => {
    for (const k of GENERAL){
      assert.equal(BOOKS.en[k], 'Ask Jambo, or type / for a place', 'en ' + k);
      assert.equal(BOOKS.sv[k], 'Fråga Jambo, eller skriv / för en plats', 'sv ' + k);
    }
  });
  test('4b beside a contract, and on its history, the box names the contract', () => {
    for (const k of ['int_ask_contract', 'pd_ask_hist']){
      assert.equal(BOOKS.en[k], 'Ask Jambo about {ref}…', 'en ' + k);
      assert.equal(BOOKS.sv[k], 'Fråga Jambo om {ref}…', 'sv ' + k);
    }
  });
});

describe('f873 (5) HaTi\'s own dropdowns on sign-up, History and Import', () => {
  test('5a sign-up arms the press and dresses its face', () => {
    assert.match(strip(fnRegion(R('js/core.js'), 'renderAuth')), /selectMenuSweep\(\); selectFaceDress\(root\);/);
  });
  test('5b History\'s filters and Import\'s boxes are dressed after each paint', () => {
    assert.match(strip(fnRegion(R('js/views/contract.js'), 'roomPaintHistory')), /host\.innerHTML=html; host\._histHtml=html;\s*try\{ if\(typeof selectFaceDress==='function'\) selectFaceDress\(host\); \}/);
    assert.match(strip(fnRegion(R('js/views/migration.js'), 'renderMigration')), /selectFaceDress\(document\.getElementById\('content'\)\)/);
  });
});
