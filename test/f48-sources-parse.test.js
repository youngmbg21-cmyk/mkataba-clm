/* f48 — every source file actually parses
   ============================================================
   This exists because of a break that reached a passing-looking checkpoint.

   A prompt string in server/server.js and js/ai.js was written inside a
   template literal and contained the words `negotiation` and `changesOmitted`
   in BACKTICKS — which closed the literal. server.js stopped booting, and the
   only test that noticed was the one that spawns the real server, where it
   surfaced as "server exited" inside a before() hook rather than as a syntax
   error anyone would recognise. js/ai.js had the same break and NOTHING
   noticed, because the browser modules are evaluated by test/world.js only for
   the files it loads.

   `node --check` is the real parser. A file that does not parse cannot be
   tested, so this runs first and says which file and why. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIRS = ['js', 'js/views', 'server', 'test'];

function sources(){
  const out = [];
  for (const d of DIRS){
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs))
      if (f.endsWith('.js')) out.push(path.join(d, f));
  }
  return out.sort();
}

test('f48 — every .js source parses', () => {
  const files = sources();
  assert.ok(files.length > 30, `expected the whole tree, found ${files.length} files`);
  const broken = [];
  for (const rel of files){
    try { execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' }); }
    catch (e){
      const why = String(e.stderr || e.message).split('\n')
        .filter(l => /SyntaxError|Error:/.test(l))[0] || 'did not parse';
      broken.push(`${rel}: ${why.trim()}`);
    }
  }
  assert.deepEqual(broken, [],
    'these files do not parse, so nothing that imports them can be trusted:\n' + broken.join('\n'));
});

test('f48 — index.html loads only files that exist', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const missing = [];
  for (const m of html.matchAll(/<script\s+src="(\.\/)?([^"]+\.js)"/g)){
    const rel = m[2];
    if (/^https?:/.test(rel)) continue;
    if (!fs.existsSync(path.join(ROOT, rel))) missing.push(rel);
  }
  assert.deepEqual(missing, [], 'index.html references script files that are not there');
});

test('f48 — app.js imports only modules that exist', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const missing = [];
  for (const m of app.matchAll(/^import\s+'\.\/([^']+)'/gm))
    if (!fs.existsSync(path.join(ROOT, 'js', m[1]))) missing.push(m[1]);
  assert.deepEqual(missing, [], 'js/app.js imports modules that are not there');
});
