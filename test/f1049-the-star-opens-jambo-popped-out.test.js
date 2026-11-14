'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f1049 — THE ✦ OPENS JAMBO ALREADY POPPED OUT (owner, 14 Nov 2026: "when you
   press the jambo button it is already in pop out mode other wise it is
   double pressing")

   (1) ONE PRESS: where the browser can keep a window on top (Document
       Picture-in-Picture) on a computer with a mouse, the ✦ asks for that
       window itself; nothing is opened in the page first.
   (2) EVERYWHERE ELSE THE WINDOW IN THE PAGE, AS BEFORE: no such window in
       the browser, an iPad or a phone, or the browser saying no.
   (3) PRESSED AGAIN IT CLOSES, and closing it opens nothing in HaTi; the
       Pop out button's own window still comes back into the panel.
   (4) THE ✦ IN THE BAR IS WIRED TO IT, and the ✦'s press never falls back to
       a window that cannot stay on top.

   AT THE PARENT every claim FAILS: there is no aiStarPress; the ✦ called
   aiWinToggle and Pop out was a second press.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const AI = read('js/ai.js');
const APP = read('js/app.js');
const fnOf = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* the ✦'s press on a stage: what it called, in order */
const stage = ({ pip = true, may = true, popped = null, ai = { open: false, win: false }, grant = true } = {}) => {
  const calls = [];
  const ctx = { calls, ai, _aiPop: popped,
    window: pip ? { documentPictureInPicture: { requestWindow: () => {} } } : {},
    aiPopMay: () => may,
    aiWinToggle: () => { calls.push('window-in-page'); return true; },
    aiPopOut: o => { calls.push('pop:' + JSON.stringify(o || {})); return Promise.resolve(grant); },
    aiPopBack: (closed, quiet) => { calls.push('back:' + !!closed + ':' + !!quiet); ctx._aiPop = null; } };
  vm.createContext(ctx);
  vm.runInContext([fnOf(AI, 'aiPopped'), fnOf(AI, 'aiStarPress')].join('\n'), ctx);
  return ctx;
};
const tick = () => new Promise(r => setTimeout(r, 5));

describe('f1049 (1) one press: the ✦ asks for the window that stays on top', () => {
  test('1a there is an aiStarPress, published', () => {
    assert.ok(fnOf(AI, 'aiStarPress'), 'js/ai.js has no aiStarPress');
    assert.match(AI.slice(AI.lastIndexOf('Object.assign(window,{')), /\baiStarPress\b/);
  });
  test('1b Chrome or Edge with a mouse: the press pops out, nothing opens in the page', async () => {
    const c = stage();
    c.aiStarPress(); await tick();
    assert.deepEqual([...c.calls], ['pop:{"star":true}']);
  });
});

describe('f1049 (2) everywhere else the window in the page, as before', () => {
  test('2a a browser with no such window', () => { const c = stage({ pip: false }); c.aiStarPress(); assert.deepEqual([...c.calls], ['window-in-page']); });
  test('2b an iPad or a phone', () => { const c = stage({ may: false }); c.aiStarPress(); assert.deepEqual([...c.calls], ['window-in-page']); });
  test('2c the browser says no: the window in the page opens instead', async () => {
    const c = stage({ grant: false });
    c.aiStarPress(); await tick();
    assert.deepEqual([...c.calls], ['pop:{"star":true}', 'window-in-page']);
  });
  test('2d the window in the page already open: the same press closes it, nothing pops', () => {
    const c = stage({ ai: { open: true, win: true } }); c.aiStarPress();
    assert.deepEqual([...c.calls], ['window-in-page']);
  });
});

describe('f1049 (3) pressed again it closes, and opens nothing in HaTi', () => {
  test('3a popped out on top: the ✦ closes it, quietly', () => {
    const c = stage({ popped: { win: { closed: false }, pip: true } }); c.aiStarPress();
    assert.deepEqual([...c.calls], ['back:false:true']);
  });
  test('3b a quiet way back opens no panel; any other way back opens Jambo in HaTi', () => {
    const back = code(fnOf(AI, 'aiPopBack'));
    assert.match(back, /function aiPopBack\(closed, quiet\)/);
    assert.match(back, /if\(quiet\)\{[^}]*\} else openAI\(\);/);
    assert.doesNotMatch(back.match(/if\(quiet\)\{([^}]*)\}/)[1], /openAI/);
  });
  test('3c the ✦\'s own window, closed by its ×, goes quietly; Put back does not', () => {
    const out = code(fnOf(AI, 'aiPopOut'));
    assert.match(out, /addEventListener\('pagehide', \(\) => aiPopBack\(true, star\)\)/);
    assert.match(out, /\[data-ai-popback\]'\)\.addEventListener\('click', \(\) => aiPopBack\(\)\)/);
  });
});

describe('f1049 (4) the wiring', () => {
  test('4a the ✦ in the bar calls aiStarPress', () => {
    assert.match(code(APP), /closest\?\.\('#cmd-ai'\)\)\{ aiStarPress\(\); return; \}/);
  });
  test('4b the ✦\'s press never opens a window that cannot stay on top', () => {
    const out = code(fnOf(AI, 'aiPopOut'));
    const i = out.indexOf('if(!win && star) return false;'), j = out.indexOf("window.open('', 'hati-jambo'");
    assert.ok(i > 0 && j > i, 'the star returns before the plain window is tried');
  });
});
