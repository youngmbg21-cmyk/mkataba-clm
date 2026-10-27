/* f862 — A QUESTION ASKED WHILE JAMBO IS STILL ANSWERING WAITS ITS TURN
   (owner, 22 Oct 2026: "fix the bug where Jambo drops questions while busy").

   Before: every Jambo box returned on "busy" — Home's panel and the chat
   window kept the words in the box and Send did nothing, without a word; the
   panel beside the lists and the list head said "still answering" and took
   nothing; the clause editor dropped it. Now each hands the words to ONE queue
   (jamboAskLater, js/components.js): a transient 'ok' line says they are next,
   and they are asked through the same door, in order, the moment that host
   is free.
     (1) the queue: in order, waits while busy, one line said per question,
         asked through the door it came from.
     (2) every Jambo box that refused on busy now hands its words to it.
   Red at the parent: (1) jamboAskLater does not exist; (2) every host returns. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

function stage(){
  const C = read('js/components.js');
  const a = C.indexOf('const JB_LATER_TICK'); const b = C.indexOf('Object.assign(window,{JB_LATER_TICK');
  assert.ok(a > 0 && b > a, 'the queue lives in js/components.js');
  const timers = []; const toasts = [];
  const ctx = { window: {}, setTimeout: (f) => { timers.push(f); return timers.length; } };
  ctx.window.toast = (m, k) => toasts.push([m, k]);
  ctx.window.i18t = k => k;
  vm.createContext(ctx);
  vm.runInContext(C.slice(a, b) + ';this.jamboAskLater=jamboAskLater;this.jamboLaterCount=jamboLaterCount;', ctx);
  const flush = (n = 50) => { for (let i = 0; i < n && timers.length; i++) timers.shift()(); };
  return { ctx, toasts, flush };
}

describe('f862 (1) the queue', () => {
  test('1a a question waits while Jambo is busy, then is asked through its own door, in order', () => {
    const { ctx, toasts, flush } = stage();
    let busy = true; const asked = [];
    assert.equal(ctx.jamboAskLater('open explorer', () => busy, q => asked.push(['home', q])), true);
    assert.equal(ctx.jamboAskLater('and the late ones?', () => busy, q => asked.push(['window', q])), true);
    assert.equal(ctx.jamboLaterCount(), 2);
    flush(5);
    assert.deepEqual(asked, [], 'nothing is asked while he is still answering');
    busy = false; flush();
    assert.deepEqual(asked, [['home', 'open explorer'], ['window', 'and the late ones?']]);
    assert.equal(ctx.jamboLaterCount(), 0);
    assert.deepEqual(toasts, [['jb_ask_later', 'ok'], ['jb_ask_later', 'ok']], 'each said once, as a transient line');
  });
  test('1b empty words, or no door to ask through, take nothing', () => {
    const { ctx, toasts } = stage();
    assert.equal(ctx.jamboAskLater('   ', () => true, () => {}), false);
    assert.equal(ctx.jamboAskLater('x', null, () => {}), false);
    assert.equal(ctx.jamboAskLater('x', () => true, null), false);
    assert.deepEqual(toasts, []);
  });
  test('1c a door that fails does not stop the questions behind it', () => {
    const { ctx, flush } = stage();
    const asked = [];
    ctx.jamboAskLater('one', () => false, () => { throw new Error('boom'); });
    ctx.jamboAskLater('two', () => false, q => asked.push(q));
    flush();
    assert.deepEqual(asked, ['two']);
  });
});

describe('f862 (2) every Jambo box hands its words to the queue', () => {
  const body = (file, sig) => { const s = strip(read(file)); const i = s.indexOf(sig); assert.ok(i >= 0, sig); return s.slice(i, i + 900); };
  test('2a Home\'s panel (intelAsk), and its Send leaves the box', () => {
    const f = body('js/views/intelligence.js', 'async function intelAsk(');
    assert.match(f, /if\(intel\.busy\)\{[^}]*jamboAskLater\(q, *\(\)=>intel\.busy, *w=>intelAsk\(w, *opts\)\)/);
    assert.doesNotMatch(f, /if\(!q\|\|intel\.busy\) return/);
    const go = strip(read('js/views/intelligence.js')).match(/const go=\(\)=>\{[^\n]*\n[^\n]*/);
    assert.ok(go && !/intel\.busy/.test(go[0]), 'Send no longer stops on busy: ' + (go && go[0]));
  });
  test('2b the chat window and side panel (aiSubmit, aiAskWords)', () => {
    assert.match(body('js/ai.js', 'async function aiSubmit('), /if\(ai\.busy\)\{[^\n]*jamboAskLater\(q, *\(\)=>ai\.busy, *w=>aiSubmit\(w\)\)/);
    assert.match(body('js/ai.js', 'async function aiAskWords('), /if\(ai\.busy\)\{[^\n]*jamboAskLater\(q, *\(\)=>ai\.busy, *w=>aiAskWords\(w(, *opts)?\)\)/);
  });
  test('2c the panel beside the lists (jlBusySay) and the list head (_lhLater)', () => {
    assert.match(body('js/views/inspector.js', 'function jlBusySay('), /jamboAskLater\(t, *_jlBusy, *w => jlAsk\(w\)\)/);
    const ins = strip(read('js/views/inspector.js'));
    assert.equal((ins.match(/return jlBusySay\(\)/g) || []).length, 0, 'every busy return passes the words');
    const lh = strip(read('js/views/listhead.js'));
    assert.match(lh, /function _lhLater\(seat, t, busy\)\{[^}]*jamboAskLater\(t, busy, w => lhAsk\(seat, w\)\)/);
    assert.equal((lh.match(/return _lhLater\(seat, t,/g) || []).length, 3, 'the list, Home and the window seats');
  });
  test('2d the clause editor (ceAsk)', () => {
    assert.match(body('js/views/clauseeditor.js', 'async function ceAsk('), /if \(_ceBusy\)\{[^}]*jamboAskLater\(q, \(\) => _ceBusy, w => ceAsk\(w, opts\)\)/);
  });
  test('2e both books say the line', () => {
    const I = read('js/i18n.js');
    assert.equal((I.match(/\bjb_ask_later:/g) || []).length, 2);
  });
});
