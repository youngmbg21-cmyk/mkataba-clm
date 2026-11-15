'use strict';
/* f1060 — JAMBO'S PANEL HOLDS STILL (owner, 14 Nov 2026: "yes, plan that job", then "Go";
   docs/WORKORDER-jambos-panel-holds-still.md). Step 1: every button the panel binds is bound once per element
   (igOnce), so a part kept across a paint never acts twice. Step 2: where the panel must be written, the parts that
   would be written exactly as they stand are kept (igDockWrite); a different number of parts, or a part another
   painter fills, is written as before. The two helpers run here in a small page of their own. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const RAW = fs.readFileSync(path.join(__dirname, '..', 'js/views/intelligence.js'), 'utf8');
const IG = strip(RAW);
const fnSrc = name => { const i = RAW.indexOf('function ' + name + '('); assert.ok(i >= 0, 'missing ' + name);
  let d = 0, j = RAW.indexOf('{', i); for (let k = j; k < RAW.length; k++){ if (RAW[k] === '{') d++; else if (RAW[k] === '}'){ d--; if (!d) return RAW.slice(i, k + 1); } } return null; };
const body = name => { const i = IG.indexOf('function ' + name + '('); let d = 0, j = IG.indexOf('{', i);
  for (let k = j; k < IG.length; k++){ if (IG[k] === '{') d++; else if (IG[k] === '}'){ d--; if (!d) return IG.slice(i, k + 1); } } return ''; };

function stage(html){
  const dom = new JSDOM(`<!doctype html><body><div id="ig-dock">${html}</div></body>`, { runScripts: 'outside-only' });
  const w = dom.window;
  const sel = (RAW.match(/const IG_DOCK_FILLED_SEL='([^']+)'/) || [])[1];
  assert.ok(sel, 'IG_DOCK_FILLED_SEL found');
  w.eval(`var IG_DOCK_FILLED_SEL=${JSON.stringify(sel)};\n${fnSrc('igOnce')}\n${fnSrc('igDockWrite')}\nwindow.igOnce=igOnce; window.igDockWrite=igDockWrite;`);
  return { w, d: w.document, dock: w.document.getElementById('ig-dock') };
}

test('f1060 (1) every button Jambo\'s panel binds goes through igOnce — none bound raw on a paint', () => {
  const r = body('renderIntelDock');
  assert.ok(r.length > 1000, 'renderIntelDock found');
  assert.equal((r.match(/\.addEventListener\(/g) || []).length, 0, 'no raw binding left in the painter');
  assert.ok((r.match(/igOnce\(/g) || []).length >= 30, 'the panel\'s bindings go through igOnce');
  assert.match(r, /igDockWrite\(dock,_html\);/, 'the main write keeps what did not change');
});

test('f1060 (2) igOnce binds a listener once per element and kind, and a fresh element again', () => {
  const { w, d } = stage('<button id="b">x</button>');
  const b = d.getElementById('b'); let n = 0; const fn = () => n++;
  w.igOnce(b, 'click', 'go', fn); w.igOnce(b, 'click', 'go', fn); w.igOnce(b, 'click', 'go', fn);
  b.click(); assert.equal(n, 1, 'three paints, one press, one act');
  w.igOnce(b, 'click', 'other', () => { n += 10; }); b.click(); assert.equal(n, 12, 'another kind on the same element still binds');
  const c = d.createElement('button'); d.body.appendChild(c); w.igOnce(c, 'click', 'go', fn); c.click(); assert.equal(n, 13, 'a fresh element is bound');
  w.igOnce(null, 'click', 'go', fn); /* no element: nothing, no throw */
});

test('f1060 (3) igDockWrite keeps the parts that are the same and writes only the ones that changed', () => {
  const html = '<div class="head">Jambo</div><div class="body">One</div><div class="foot"><textarea id="q"></textarea></div>';
  const { w, dock } = stage(html);
  const [head, bodyEl, foot] = [...dock.children];
  dock.querySelector('#q').value = 'half typed';
  const kept = w.igDockWrite(dock, '<div class="head">Jambo</div><div class="body">Two</div><div class="foot"><textarea id="q"></textarea></div>');
  assert.equal(kept, 2, 'head and foot kept');
  assert.strictEqual(dock.children[0], head, 'the head is the same element');
  assert.notStrictEqual(dock.children[1], bodyEl, 'the body changed, so it is written');
  assert.equal(dock.children[1].textContent, 'Two');
  assert.strictEqual(dock.children[2], foot, 'the foot is the same element');
  assert.equal(dock.querySelector('#q').value, 'half typed', 'the box keeps its words');
});

test('f1060 (4) any doubt is written whole: another number of parts, another kind, or a part another painter fills', () => {
  const { w, dock } = stage('<div class="a">1</div><div class="b">2</div>');
  const a0 = dock.children[0];
  assert.equal(w.igDockWrite(dock, '<div class="a">1</div>'), 0, 'fewer parts: written whole');
  assert.notStrictEqual(dock.children[0], a0);
  const s2 = stage('<div class="a">1</div>');
  const a1 = s2.dock.children[0];
  assert.equal(s2.w.igDockWrite(s2.dock, '<section class="a">1</section>'), 0, 'another kind of part: written');
  assert.notStrictEqual(s2.dock.children[0], a1);
  const s3 = stage('<div class="h">x</div><div id="pd-redface"></div>');
  const red = s3.dock.children[1], h = s3.dock.children[0];
  assert.equal(s3.w.igDockWrite(s3.dock, '<div class="h">x</div><div id="pd-redface"></div>'), 1, 'only the head kept');
  assert.strictEqual(s3.dock.children[0], h);
  assert.notStrictEqual(s3.dock.children[1], red, 'a part another painter fills is always written fresh');
});
