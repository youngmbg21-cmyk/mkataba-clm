/* ============================================================
   f1180 — a signed contract says "no returned file" before the pick
   ============================================================
   Bug log: the Import pop-up offered a signed contract its "Choose the Word
   file" button and only refused (co_import_executed) after a file had been
   chosen. On open, a signed contract's button is now grey with the reason
   under it; the pick keeps its own check. Red at the parent: nothing was said
   before the pick.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CORE = fs.readFileSync(path.join(__dirname, '..', 'js/core.js'), 'utf8');
const fnBody = name => { const i = CORE.indexOf('function ' + name + '('); return CORE.slice(i, CORE.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('f1180 — the refusal stands before the file button is wired, and the pick still checks', () => {
  const f = strip(fnBody('openImportModal'));
  const said = f.indexOf("note.textContent=i18t('co_import_executed'");
  const wired = f.indexOf("getElementById('imp-docx-go')?.addEventListener('click'");
  assert.ok(said > 0 && said < wired, 'said on open, before the button is wired');
  assert.match(f.slice(0, wired), /b\.disabled=true/, 'the button is grey');
  assert.match(f.slice(wired), /throw new Error\(i18t\('co_import_executed'/, 'the pick keeps its own check');
});
