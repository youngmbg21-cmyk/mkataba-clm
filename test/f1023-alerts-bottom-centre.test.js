/* f1023 — ALERTS SIT AT THE BOTTOM CENTRE OF THE PAGE, CLEAR OF JAMBO (owner picked "The SAP Way", 12 Nov 2026).
   On a computer the alert stack stands bottom centre, above the page's foot, never in the bottom-right corner
   where Jambo's box is; toastPlace centres it on the page area left of any panel at the right edge, measured;
   the phone keeps its own place; every toast still goes by itself (the dwell table has no zero). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const core = strip(fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8'));
const html = strip(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'));
const mobile = fs.readFileSync(path.join(__dirname, '..', 'js', 'mobile.js'), 'utf8');

test('the desktop stack is bottom centre, not the right corner', () => {
  const m = html.match(/body:not\(\.m-on\) #toast-root\{([^}]*)\}/);
  assert.ok(m, 'a desktop rule for the stack');
  assert.match(m[1], /right:auto/); assert.match(m[1], /left:50%/); assert.match(m[1], /translateX\(-50%\)/);
  assert.match(m[1], /bottom:\d+px/);
});

test('toast() places the stack on the page area before it adds the alert', () => {
  const body = core.slice(core.indexOf('function toast(msg,kind,opts){'));
  const place = body.indexOf('toastPlace(root)'), add = body.indexOf('root.appendChild(el)');
  assert.ok(place > 0 && place < add, 'placed before it is added');
  const fn = core.slice(core.indexOf('function toastPlace('), core.indexOf('function toast(msg'));
  assert.match(fn, /elementFromPoint/, 'the right-hand panel is measured, never named');
  assert.match(fn, /m-on/, 'the phone keeps its own place');
});

test('the phone keeps its place above the tab bar', () => {
  assert.match(mobile, /body\.m-on #toast-root\{[^}]*bottom:calc\(/);
});

test('every toast still goes by itself', () => {
  const t = core.match(/const TOAST_KINDS = \{([\s\S]*?)\};/)[1];
  assert.ok(!/dwell:0\b/.test(t));
});
