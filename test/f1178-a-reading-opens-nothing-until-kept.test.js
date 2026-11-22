/* ============================================================
   f1178 — a reading opens nothing until it is kept
   ============================================================
   Bug log: caReadSend (and the draft reader) queued the send screen / draft
   form from INSIDE the reading, so a reading caActOf then dropped (a question
   Jambo answers, another contract named) still opened the screen while the
   question also went to the model — and caTakesWords, which only asks, opened
   it too. The opener now rides on the act (caActLater) and runs only where
   caActOf keeps the reading (caActGo). Red at the parent: the readers queued
   their own timers.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CA = fs.readFileSync(path.join(__dirname, '..', 'js/copilotacts.js'), 'utf8');
const fnBody = name => { const i = CA.indexOf('function ' + name + '('); return i < 0 ? '' : CA.slice(i, CA.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('f1178 — the readers read; only a kept act opens', () => {
  test('(1) the send and draft readers queue no timer of their own', () => {
    assert.doesNotMatch(strip(fnBody('caReadSend')), /setTimeout/);
    assert.doesNotMatch(strip(fnBody('caActRead')), /setTimeout/);
  });
  test('(2) caActOf runs the opener only on the readings it keeps', () => {
    const b = strip(fnBody('caActOf'));
    assert.equal((b.match(/return caActGo\(r\)/g) || []).length, 2);
    assert.doesNotMatch(b, /return r;/);
  });
  test('(3) the opener travels out of sight and runs once', async () => {
    const ctx = { setTimeout: (fn) => fn() }; ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext(fnBody('caActLater') + '\n' + fnBody('caActGo') + '\nthis.caActLater = caActLater; this.caActGo = caActGo;', ctx);
    let n = 0; const a = ctx.caActLater({ kind: 'send' }, () => { n++; });
    assert.deepEqual(Object.keys(a), ['kind'], 'never in a copy of the act');
    assert.equal(n, 0, 'reading alone opens nothing');
    ctx.caActGo(a); ctx.caActGo(a);
    assert.equal(n, 1);
  });
});
