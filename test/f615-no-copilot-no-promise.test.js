/* ============================================================
   f615 — with no Copilot, the upload dialog promises no Copilot calls
   (9 Oct 2026 review)
   ============================================================
   Measured: with no key the "Read this contract now" line still said "About
   three Copilot calls", and the brief then failed. triageOptInHtml now asks
   copilotAvailable() and says plainly that the Copilot readings will not run
   and the local risk scan still does.
   ============================================================ */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'js/views/contract.js'), 'utf8');
const FN = SRC.slice(SRC.indexOf('function triageOptInHtml(ext){'),
  SRC.indexOf('/* Named progress line for an upload'));
const I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const en = key => { const m = I18N.match(new RegExp('\\n    ' + key + ": '((?:[^'\\\\]|\\\\.)*)'")); return m ? m[1] : key; };

const draw = available => {
  const ctx = { esc: s => String(s), i18t: en, copilotAvailable: () => available };
  vm.createContext(ctx);
  vm.runInContext(FN + '\nthis.out = triageOptInHtml("docx");', ctx);
  return ctx.out;
};

test('f615 with Copilot connected the line names its cost; without it, it promises nothing it cannot keep', () => {
  assert.ok(FN.length > 100, 'the function was found');
  const on = draw(true), off = draw(false);
  assert.match(on, /About three Copilot calls/);
  assert.ok(!/three Copilot calls/.test(off), 'no Copilot calls promised without Copilot');
  assert.match(off, /Copilot is not connected/);
  assert.match(off, /local risk scan still does/);
  assert.match(I18N, /ct_triage_optin_sub_noai: 'Copilot är inte anslutet/, 'and in Swedish');
});
