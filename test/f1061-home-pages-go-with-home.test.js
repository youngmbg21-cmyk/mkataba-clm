'use strict';
/* f1061 — A FULL-PAGE SCREEN GOES BEFORE THE PAGE MOVES (owner, 15 Nov 2026: "I was on the email page then i clicked
   discover on jambo so i could go to discover page. Well it seem like the email is now above the discover page and the
   jambo has disappeared", then "check if this issue is anywhere else in hati"). Every full-page screen — the Send
   screen, a page beside Home's panel, any list's own page — is put away through its own guard before a move to another
   page (viewLayersClosed) or another tab of Home (hbPageLeaveThen), closed at once where nothing needs asking
   (closeModalFirst), so a screen the move opens next is never closed by a late answer. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const raw = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const read = f => strip(raw(f));
const region = (src, start, len) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, 'missing ' + name);
  let d = 0; for (let k = src.indexOf('{', i); k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}'){ d--; if (!d) return src.slice(i, k + 1); } } return ''; };

test('f1061 (1) a move to another page puts every full-page screen away first, guarded', () => {
  const a = read('js/app.js');
  const s = fnSrc(a, 'pageScreenStays');
  assert.match(s, /view!=='dashboard' && document\.querySelector\('#modal-root \.modal-in\[data-sh-page\], #modal-root \.modal-in\[data-dlg-home\]'\)/, 'Home\'s own screens go on a move off Home');
  assert.match(s, /#modal-root \.modal-in\[data-dlg-page\]:not\(\[data-dlg-home\]\):not\(\[data-sh-page\]\)/, 'every other full-page screen goes on any move');
  const v = region(a, 'function viewLayersClosed', 4000);
  assert.match(v, /closeModalFirst==='function' && pageScreenStays\(view\)/);
  assert.match(v, /if\(r===false\) return false;/, 'a reader who stays is kept where they were');
  assert.match(v, /if\(ok===false \|\| pageScreenStays\(view\)\) return;/);
});

test('f1061 (2) turning Home to another tab puts a screen in front away first', () => {
  const h = read('js/views/homeboard.js');
  assert.match(fnSrc(h, 'hbPageScreenUp'), /pdSendIsWaiting/, 'a Send screen waiting out of sight is kept');
  for (const fn of ['hbOpenExplorer', 'hbOpenCalendar', 'hbOpenContracts', 'hbOpenHome'])
    assert.match(fnSrc(h, fn), new RegExp('hbPageLeaveThen\\(' + fn + '\\)\\) return;'), fn + ' asks first');
  assert.match(fnSrc(h, 'hbSetFace'), /if \(s\.face === f\) return;\s*if \(typeof hbPageLeaveThen === 'function' && hbPageLeaveThen\(\(\) => hbSetFace\(f\)\)\) return;/, 'a tab turn asks first');
  assert.match(fnSrc(h, 'hbPageLeaveThen'), /closeModalFirst\(\);\s*if \(r === true\) return hbPageScreenUp\(\);/, 'closed at once, the turn goes straight on');
});

test('f1061 (3) a page opened beside Home\'s panel is marked as Home\'s', () => {
  const c = region(read('js/core.js'), 'function dlgPageAdopt', 4000);
  assert.match(c, /if\(page\.beside==='#ig-dock'\) panel\.setAttribute\('data-dlg-home',''\);/);
});

test('f1061 (4) closeModalFirst: at once with no question, kept on a no, and a late yes never closes a newer screen', async () => {
  const dom = new JSDOM('<!doctype html><body><div id="modal-root"></div></body>', { runScripts: 'outside-only' });
  const w = dom.window, d = w.document;
  w.eval(`var _modalGuard=null; function closeModal(){ _modalGuard=null; document.getElementById('modal-root').innerHTML=''; }
    ${fnSrc(raw('js/core.js'), 'closeModalFirst')}
    window.closeModalFirst=closeModalFirst; window.open1=(id,g)=>{ document.getElementById('modal-root').innerHTML='<div class="modal-in" id="'+id+'"></div>'; _modalGuard=g||null; };`);
  w.open1('a'); assert.strictEqual(w.closeModalFirst(), true, 'no question: closed now'); assert.equal(d.querySelector('.modal-in'), null);
  w.open1('b', () => true); assert.strictEqual(w.closeModalFirst(), true, 'a question that need not ask: closed now'); assert.equal(d.querySelector('.modal-in'), null);
  w.open1('c', () => false); assert.strictEqual(w.closeModalFirst(), false, 'a no: kept'); assert.ok(d.getElementById('c'));
  let yes; w.open1('e', () => new w.Promise(r => { yes = r; }));
  const p = w.closeModalFirst(); assert.equal(typeof p.then, 'function', 'asking: a promise');
  w.open1('f'); yes(true); assert.strictEqual(await p, true);
  assert.ok(d.getElementById('f'), 'a screen opened while the question was up is not closed by its late yes');
});
