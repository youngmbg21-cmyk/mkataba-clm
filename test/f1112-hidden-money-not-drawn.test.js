'use strict';
/* f1112 — HIDDEN MONEY IS NOT DRAWN AT ALL, EVERYWHERE (owner, 19 Nov 2026: "Do C")
   For a reader without money rights (canViewValues false) there is no Value column, cell, sum or box — never a
   dash, never an empty box:
   1 · Contracts and Negotiations: every shape of the list reads its columns through regColKeysSeat, which drops
       Value; Columns offers no Value; a width array read by position gives Value's share to the agreement.
   2 · The shared contract row, the pipeline card and the Calendar's ladder draw no figure.
   3 · Details neither asks for nor owes a Value; Key terms draws no Value cell.
   4 · The phone's list draws no Value under the counterparty.
   At the parent none of this holds, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const RG = read('js/views/register.js');
const oneLine = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n', i)); };
const GUARD = /typeof canViewValues===?'function'\s*&&\s*!canViewValues\(\)/;

test('f1112 (1) the list: no Value column on any shape, its width goes to the agreement', () => {
  const run = (may, all, w) => {
    const sb = { canViewValues: () => may, regColKeysSeatAll: () => all };
    vm.createContext(sb);
    vm.runInContext([oneLine(RG, 'regSeeMoney'), oneLine(RG, 'regMoneyCols'), fnBody(RG, 'regMoneyW')].join('\n') + '\nthis.f = { regMoneyCols, regMoneyW };', sb);
    return JSON.parse(JSON.stringify([sb.f.regMoneyCols(all), sb.f.regMoneyW(w.slice())]));
  };
  const all = ['mk', 'counterparty', 'value', 'expiry'];
  assert.deepEqual(run(true, all, [10, 50, 20, 20]), [all, [10, 50, 20, 20]]);
  assert.deepEqual(run(false, all, [10, 50, 20, 20]), [['mk', 'counterparty', 'expiry'], [10, 70, 20]]);
  assert.match(oneLine(RG, 'regColKeysSeat'), /return regMoneyCols\(regColKeysSeatAll\(\)\);/, 'every shape reads through it');
  assert.match(oneLine(RG, 'regCtShapeKeys'), /regMoneyCols\(/, 'Columns offers no Value');
  assert.match(RG, /const regColDefaults = \(\) => regMoneyW\(/);
  assert.match(strip(fnBody(RG, 'folderRowsHtml')), /\$\{!regSeeMoney\(\)\?'':/, 'the folder table\'s cell');
});

test('f1112 (2) the row, the card and the Calendar\'s ladder draw no figure', () => {
  assert.match(strip(fnBody(read('js/components.js'), 'contractRow')), GUARD);
  assert.match(strip(fnBody(read('js/views/queue.js'), 'pipeCard')), GUARD);
  assert.match(read('js/views/calendar.js'), /typeof canViewValues==='function'&&!canViewValues\(\)\)\?'':[^`]*`<div class="cal-lad-v">/);
});

test('f1112 (3) Details neither asks for nor owes a Value; Key terms has no Value cell', () => {
  const CT = read('js/views/contract.js');
  assert.match(strip(fnBody(CT, 'detailsOf')), /if\(seeMoney && \(money \|\| pay\)\) add\(recSec, 'value'/);
  assert.match(strip(fnBody(CT, 'ktFieldCell')).slice(0, 300), /if\(k==='value'&&typeof canViewValues==='function'&&!canViewValues\(\)\) return null;/);
});

test('f1112 (4) the phone\'s list draws no Value', () => {
  assert.match(read('js/mobile-screens.js'), /\(typeof canViewValues==='function'&&!canViewValues\(\)\) \? ''[^\n]*\n\s*: \(typeof fxIsPay==='function'&&fxIsPay\(c\)\)/);
});

test('f1112 (5) Jambo\'s duty review draws no Amount line for a reader without money rights', () => {
  assert.match(read('js/obligations.js'), /\$\{obligationMoneyVisible\(\) \? [^`]*`<dt>\$\{_obEsc\(i18t\('obd_amount'\)\)\}<\/dt>/);
});
