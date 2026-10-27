/* f942 — THE BUG LOG, BATCH 2: A TOAST'S BUTTON DOES WHAT IT SAYS (the overnight build, 26 Oct 2026)

   BUGLOG's note: after "learn this standard" the Undo on its toast did nothing — the action was handed as
   `run`, and toast() presses `onClick` only, so the changed standard stayed changed. Every toast action in
   the app is handed as onClick now, and toast() still presses onClick:
     1 · toast() presses the action's onClick
     2 · no toast action anywhere in js/ is handed a `run` (or any other key) in its place

   Run: node --test test/f942-a-toast-button-is-pressed.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const bare = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const files = d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => path.join(d, f));

test('f942 (1) toast() presses the action\'s onClick', () => {
  const core = bare(fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8'));
  const at = core.indexOf('function toast(msg,kind,opts)');
  assert.ok(at > 0);
  assert.match(core.slice(at, core.indexOf('\nfunction ', at + 10)), /act\.onClick/);
});

test('f942 (2) every toast action is handed as onClick', () => {
  const bad = []; let seen = 0;
  for (const f of files('js').concat(files('js/views'))) {
    const src = bare(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    const re = /toast\([^;]*?\{\s*action\s*:\s*\{\s*label\s*:[^,]*?\)\s*,\s*([A-Za-z_$]+)\s*[:(]/g;
    let m;
    while ((m = re.exec(src))) { seen++; if (m[1] !== 'onClick') bad.push(`${f}: ${m[1]}`); }
  }
  assert.ok(seen >= 3, `the sweep reads the toast actions (${seen} found)`);
  assert.deepEqual(bad, []);
});
