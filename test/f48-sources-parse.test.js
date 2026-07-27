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

/* Found while writing f50, and it had been sitting there quietly.

   js/clausemodel.js exported clauseById(html, id) → a clause of a document.
   js/playbook.js exported clauseById(id) → an entry of the clause library.
   Both land on window. Every module is its own ES module scope, so nothing
   breaks at load; the LATER import simply wins the name, and a caller of the
   loser gets a function with a different signature and no complaint from
   anyone. Nothing called the loser today — which is precisely why this would
   have been found the hard way.

   One name, one meaning, across the whole window namespace — unless the
   shadowing is deliberate and written down, which is what KNOWN_OVERRIDES is
   for. It carries exactly the two the codebase already declares in prose:
   js/approvals.js replaces core.js's legacy spend-threshold approval gate with
   the rule chain, and core.js itself reads the winner back through
   `((window.approvalState)||approvalState)(c)` so its label matches what the
   sign panel enforces. An override with a reason is a decision; an override
   without one is this bug. */
const KNOWN_OVERRIDES = {
  approvalState: 'js/approvals.js deliberately replaces core.js\'s legacy gate; '
    + 'core.js reads it back via window (see approvalLabel)',
  approveContract: 'same pair — the rule chain supersedes the threshold check',
};
test('f48 — no two modules claim the same name on window', () => {
  const clash = new Map();                       // name → the files that export it
  for (const rel of sources()){
    if (!rel.startsWith('js/')) continue;        // window is the browser's namespace
    const s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const m of s.matchAll(/Object\.assign\(\s*window\s*,\s*\{([\s\S]*?)\}\s*\)/g)){
      for (const raw of m[1].split(',')){
        const name = raw.split(':')[0].replace(/\/\/.*$/gm, '').trim();
        if (!/^[A-Za-z_$][\w$]*$/.test(name)) continue;
        if (!clash.has(name)) clash.set(name, []);
        if (!clash.get(name).includes(rel)) clash.get(name).push(rel);
      }
    }
  }
  const doubled = Array.from(clash.entries())
    .filter(([name, files]) => files.length > 1 && !KNOWN_OVERRIDES[name])
    .map(([name, files]) => `${name} — ${files.join(' and ')}`);
  /* And the allow-list may not rot: a name listed there must still be doubled,
     or the entry is describing a decision nobody is making any more. */
  for (const name of Object.keys(KNOWN_OVERRIDES))
    assert.ok((clash.get(name) || []).length > 1,
      `${name} is allow-listed as a deliberate override but is no longer doubled — `
      + 'delete the entry rather than leaving a note about something that stopped happening');
  assert.deepEqual(doubled, [],
    'two modules export the same name to window; whichever app.js imports last '
    + 'wins silently:\n' + doubled.join('\n'));
});
