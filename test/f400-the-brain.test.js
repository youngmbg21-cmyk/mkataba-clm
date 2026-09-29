'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f400 — THE BRAIN: HaTi AS A NETWORK OF NEURONS, READ FROM ITS OWN CODE
   (Young ruled 27 Sep 2026: "Now go build and merge to main. Put it as a page
   before home", over the "HaTi Brain" artifact; and before it, "for every code
   update it should update brain automatically")

   The walls first — the page writes nothing, touches no contract and spends
   nothing; the reader is pure and decides nothing about the disk. Then the
   door (registered everywhere a view must be, and first in the Work group,
   directly before Home). Then the reading itself, run over THIS repository:
   every named part is found, the links are the code's own and not its
   comments', and a flow can only name parts that exist. Then the difference
   between two readings, and the server that keeps them: a first reading is a
   baseline, a second reading of the same code adds nothing, and a code
   change — staged by rewriting what the last reading remembered — is kept as
   an update that names the part the code grew.
   AT THE PARENT (972d681) every claim FAILS: none of the files exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const ROOT = path.join(__dirname, '..');
const R = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
const VIEW = R('js/views/brain.js');
const MAP = R('js/brainmap.js');
const APP = R('js/app.js');
const CORE = R('js/core.js');
const AI = R('js/ai.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const SERVER = R('server/server.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
let B = null; try { B = require('../js/brainmap.js'); } catch (_) {}
const files = () => {
  const out = {};
  const walk = rel => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
    const r = rel + '/' + e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.js')) out[r] = fs.readFileSync(path.join(ROOT, r), 'utf8'); } };
  walk('js'); walk('server');
  return out;
};

describe('f400 (1) — the walls', () => {
  test('1a the page is a reading: no store, no contract act, no model', () => {
    assert.ok(VIEW.length > 5000, 'js/views/brain.js is on the floor');
    const C = code(VIEW);
    for (const bad of ['persist(', 'localStorage', 'sessionStorage', 'lsSet(', 'negoFileChange(', 'negoResolve(', 'changes.push',
      'signDocument(', 'approveContract(', 'copilotAsk(', 'anthropic', 'saveContract('])
      assert.ok(!C.includes(bad), bad + ' — the Brain draws the platform, it does not act on it');
    const calls = [...C.matchAll(/\bapi\(\s*'([^']+)'/g)].map(m => m[1]);
    assert.deepEqual(calls, ['brain'], 'the one thing the page asks the server is what the code says');
  });
  test('1b the reader is pure: it is handed the files and touches no disk', () => {
    assert.ok(MAP.length > 3000, 'js/brainmap.js is on the floor');
    const C = code(MAP);
    for (const bad of ['require(', 'readFileSync', 'fetch(', 'process.', 'document.', 'localStorage'])
      assert.ok(!C.includes(bad), bad + ' in the reader');
    assert.match(MAP, /if \(typeof module !== 'undefined' && module\.exports\) module\.exports = BRAIN_API;/, 'one file, both hosts');
  });
  test('1c the frame loop stops itself when the page is left', () => {
    assert.match(VIEW, /if \(!b \|\| !b\.cv \|\| !b\.cv\.isConnected \|\| \(typeof state !== 'undefined' && state && state\.view !== 'brain'\)\)/);
  });
  test('1d a background spark never names a part: a name is drawn from where a flow LANDED', () => {
    assert.match(VIEW, /b\.reached\.set\(p\.b, p\.step\)/, 'a flow pulse arriving records its landing');
    assert.match(VIEW, /S\.hubs\.filter\(h => wiring \|\| b\.reached\.has\(h\.id\)/, 'the labels read the landings, never a glow');
    assert.ok(!/h\.heat > \.3 \|\| h === b\.hover/.test(VIEW), 'the old "glowing brightly enough" rule is gone');
  });
});

describe('f400 (2) — the door', () => {
  test('2a registered everywhere a view must be', () => {
    assert.match(HTML, /<button data-view="brain" class="nav-item"[^>]*data-i18n-title="nav_brain_title">/);
    assert.match(HTML, /<use href="#i-brain"\/>/);
    assert.match(HTML, /<symbol id="i-brain" viewBox="0 0 16 16">/, 'the sprite carries the symbol the door asks for');
    assert.match(APP, /import '\.\/brainmap\.js';\s*[^\n]*\n\s*import '\.\/views\/brain\.js';/);
    assert.match(APP, /else if\(view==='brain'\) renderBrainPage\(\);/);
    assert.match(APP, /case 'brain':\s*return \[i18t\('nav_brain'\), ''\];/);
    assert.match(APP, /brain:'the Brain'/, 'VIEW_LABEL names it');
    assert.match(CORE, /setView\(\['brain','dashboard',/, 'a refresh lands back on it');
    assert.match(AI, /brain: 'the Brain'/, 'Copilot knows the page');
    assert.match(VIEW, /Object\.assign\(window, \{ renderBrainPage,/);
  });
  /* RE-POINTED 29 Sep 2026 (Young: "move the Brain tab in the nav panel to be
     the last tab below team and settings"). */
  test('2b it is the last door in the menu, directly after Settings & Rules, and carries no count', () => {
    const nav = HTML.slice(HTML.indexOf('data-section="work"'), HTML.indexOf('</nav>', HTML.indexOf('data-section="work"')));
    const doors = [...nav.matchAll(/<button data-view="([a-z]+)" class="nav-item/g)].map(m => m[1]);
    assert.equal(doors[doors.length - 1], 'brain', doors.join(' · '));
    assert.equal(doors[doors.length - 2], 'team', 'Settings & Rules sits directly above it');
    assert.equal(doors[0], 'dashboard', 'Home leads the menu again');
    const btn = HTML.slice(HTML.indexOf('data-view="brain"'), HTML.indexOf('</button>', HTML.indexOf('data-view="brain"')));
    assert.ok(!btn.includes('nav-count'), 'a picture of the platform owes nobody anything');
    assert.match(HTML, /<button data-view="dashboard" class="nav-item active"/, 'Home is still the page HaTi opens on');
  });
});

describe('f400 (2b) — the page fills the whole screen (Young, 27 Sep 2026)', () => {
  test('2c it owns its height and its head: on VIEW_OWNS_HEIGHT and PAGE_OWNS_HEADER', () => {
    const list = name => { const m = APP.match(new RegExp('const ' + name + " = \\[([^\\]]*)\\]")); return m ? m[1] : ''; };
    assert.match(list('VIEW_OWNS_HEIGHT'), /'brain'/, 'the shell measures the room for it');
    assert.match(list('PAGE_OWNS_HEADER'), /'brain'/, 'no title row between the shell bar and the brain');
  });
  test('2d the page is exactly --view-h tall and the stage takes what the card has left', () => {
    const root = (VIEW.match(/'\.br-root\{[^']*'/) || [''])[0];
    const stage = (VIEW.match(/'\.br-stage\{[^']*'/) || [''])[0];
    assert.match(root, /height:var\(--view-h\)/, root);
    assert.match(root, /grid-template-rows:minmax\(0,1fr\)/, root);
    assert.match(stage, /flex:1 1 auto/, stage);
    assert.doesNotMatch(stage, /100vh|clamp\(/, 'no guessed height from the window');
  });
});

describe('f400 (2e) — a drag turns the brain the way the finger goes (Young, 27 Sep 2026)', () => {
  test('2e the side facing you moves right when the pointer moves right, and down when it moves down', () => {
    const pj = (VIEW.match(/function brPj\(x, y, z\)\{[\s\S]*?\n\}/) || [''])[0];
    const mv = (VIEW.match(/b\.rot\s*([+-])=\s*dx\s*\*\s*([\d.]+)/) || []);
    const tv = (VIEW.match(/b\.tiltOff\s*\+\s*dy\s*\*\s*([\d.]+)/) || []);
    assert.ok(pj && mv[1] && tv[1], 'the projection and both drag lines are found');
    const _br = { W: 800, H: 600, CY: .5, panX: 0, panY: 0, SC: 1 };
    const brPj = new Function('_br', pj + '; return brPj;')(_br);
    const at = (rot, tilt) => { _br.cR = Math.cos(rot); _br.sR = Math.sin(rot); _br.cT = Math.cos(tilt); _br.sT = Math.sin(tilt); };
    const turn = (rot, dx) => mv[1] === '-' ? rot - dx * Number(mv[2]) : rot + dx * Number(mv[2]);
    for (const rot0 of [-1.05, 0, .8]){
      at(rot0, .3);
      // the point on the side facing the reader: largest depth of a ring round the middle
      let front = null; for (let a = 0; a < 6.28; a += .01){ const p = [Math.cos(a) * 100, 0, Math.sin(a) * 100], q = brPj(...p); if (!front || q[3] > front.q[3]) front = { p, q }; }
      at(turn(rot0, 20), .3);
      assert.ok(brPj(...front.p)[0] > front.q[0], 'dragging right moves the facing side right (turn ' + rot0 + ')');
      at(rot0, .3 + 20 * Number(tv[1]));
      assert.ok(brPj(...front.p)[1] > front.q[1], 'dragging down moves the facing side down (turn ' + rot0 + ')');
    }
  });
});

describe('f400 (3) — the reading, over this repository', () => {
  const map = B ? B.brainRead(files()) : null;
  test('3a every named part is found in the code, with its file and line', () => {
    assert.ok(map, 'the reader loads');
    const missing = B.BRAIN_PARTS.filter(p => !map.parts[p.id] || !map.parts[p.id].found).map(p => p.id + ' (' + p.code + ')');
    assert.deepEqual(missing, [], 'a part the catalogue names and the code does not have would be a neuron for nothing');
    const neg = map.parts.funnel;
    assert.equal(neg.file, 'js/negotiation.js');
    assert.match(files()[neg.file].split('\n')[neg.line - 1], /function negoFileChange\(/, 'the line is where the part is defined');
  });
  test('3b the links are the code\'s own: real calls, never words in a comment', () => {
    assert.ok(map.edges.length >= 5, map.edges.length + ' links');
    const has = (a, b) => map.edges.some(e => e[0] === a && e[1] === b);
    assert.ok(has('brief', 'model'), 'the brief route calls anthropicMessages');
    assert.ok(has('putguard', 'frozen'), 'the save route reads EXECUTED_IMMUTABLE');
    const fx = { 'js/a.js': 'function negoFileChange(c){\n  /* buildSharePayload is mentioned here only */\n  // and runScan here\n  return 1;\n}\nfunction buildSharePayload(){}\nfunction runScan(){}\n' };
    const m2 = B.brainRead(fx);
    assert.deepEqual(m2.edges.filter(e => e[0] === 'funnel'), [], 'a name in a comment is not a hand-off');
    const fx2 = { 'js/a.js': 'function negoFileChange(c){ return buildSharePayload(c); }\nfunction buildSharePayload(){}\n' };
    assert.deepEqual(B.brainRead(fx2).edges.filter(e => e[0] === 'funnel'), [['funnel', 'payload']], 'a call is');
  });
  test('3c what the code publishes is read: every window name, every route', () => {
    assert.ok(map.published.length > 1000, map.published.length + ' names');
    assert.ok(map.published.some(p => p.name === 'renderBrainPage' && p.file === 'js/views/brain.js'));
    assert.ok(map.published.some(p => p.name === 'GET /api/brain' && p.file === 'server/server.js'));
  });
  test('3d every part a flow names is still in the code', () => {
    assert.deepEqual(map.flowGaps, []);
    const gone = B.brainRead({ 'js/a.js': 'function submitUpload(){}' });
    assert.ok(gone.flowGaps.some(g => g.flow === 'upload' && g.step === 2 && g.part === 'docx'), 'a flow naming a missing part is reported, never skipped');
  });
  test('3e a new part sits by the file it lives in', () => {
    assert.equal(B.brainRegionOfFile('js/negotiation.js'), 'nego');
    assert.equal(B.brainRegionOfFile('server/server.js'), 'wall');
    assert.equal(B.brainRegionOfFile('js/views/home.js'), 'see');
    assert.equal(B.brainFloorOfFile('js/views/home.js'), 0);
    assert.equal(B.brainFloorOfFile('js/core.js'), 1);
    assert.equal(B.brainFloorOfFile('server/server.js'), 2);
  });
});

describe('f400 (4) — two readings, and what changed', () => {
  test('4a a first reading is a baseline: nothing is called new', () => {
    const d = B.brainDiff(null, { parts: {}, edges: [], published: [{ name: 'x', file: 'js/a.js' }] });
    assert.equal(d.first, true); assert.deepEqual(d.born, []);
  });
  test('4b a name the code grew is born, one it dropped is retired, a link is added', () => {
    const prev = { parts: { funnel: { found: true } }, edges: [], published: [{ name: 'old', file: 'js/a.js' }] };
    const next = { parts: { funnel: { found: false } }, edges: [['brief', 'model']], published: [{ name: 'fresh', file: 'js/negotiation.js' }] };
    const d = B.brainDiff(prev, next);
    assert.deepEqual(d.born, [{ name: 'fresh', file: 'js/negotiation.js', reg: 'nego', floor: 1 }]);
    assert.deepEqual(d.retired, ['old']);
    assert.deepEqual(d.edgesAdded, [['brief', 'model']]);
    assert.deepEqual(d.lost, ['funnel'], 'a named part the code no longer has is said by name');
  });
  test('4c a cap is a fact: past BRAIN_DIFF_MAX the rest is counted', () => {
    const many = Array.from({ length: B.BRAIN_DIFF_MAX + 5 }, (_, i) => ({ name: 'n' + i, file: 'js/a.js' }));
    const d = B.brainDiff({ parts: {}, edges: [], published: [] }, { parts: {}, edges: [], published: many });
    assert.equal(d.born.length, B.BRAIN_DIFF_MAX); assert.equal(d.bornMore, 5);
  });
  test('4d the fingerprint moves with the shape of the code, not with a comment', () => {
    const a = B.brainRead({ 'js/a.js': 'function negoFileChange(){ return buildSharePayload(); }\nfunction buildSharePayload(){}\nObject.assign(window,{negoFileChange});' });
    const b = B.brainRead({ 'js/a.js': '/* a new note */\nfunction negoFileChange(){ return buildSharePayload(); }\nfunction buildSharePayload(){}\nObject.assign(window,{negoFileChange});' });
    const c = B.brainRead({ 'js/a.js': 'function negoFileChange(){ return buildSharePayload(); }\nfunction buildSharePayload(){}\nObject.assign(window,{negoFileChange, brandNew});' });
    assert.equal(B.brainKey(a), B.brainKey(b));
    assert.notEqual(B.brainKey(a), B.brainKey(c));
  });
});

describe('f400 (5) — every word in both books', () => {
  const book = lang => I18N.slice(I18N.indexOf(lang === 'en' ? '  en: {' : '  sv: {'), lang === 'en' ? I18N.indexOf('  sv: {') : undefined);
  const has = (bk, k) => new RegExp('\\n\\s*' + k + '(_one|_other)?\\s*:').test(bk);
  test('5a the literal keys the page asks for', () => {
    const keys = [...new Set([...VIEW.matchAll(/_brTn?\('([a-z_]+)'/g)].map(m => m[1]).filter(k => !/_$/.test(k)))];
    assert.ok(keys.length > 40, keys.length + ' keys');
    for (const lang of ['en', 'sv']){ const bk = book(lang); assert.deepEqual(keys.filter(k => !has(bk, k)), [], lang); }
  });
  test('5b every part, area, floor, flow and step has its words', () => {
    const want = ['nav_brain', 'nav_brain_title'];
    B.BRAIN_PARTS.forEach(p => want.push('brn_p_' + p.id, 'brn_pd_' + p.id));
    B.BRAIN_REGIONS.forEach(r => want.push('brn_r_' + r, 'brn_rb_' + r));
    for (let i = 0; i < B.BRAIN_FLOORS; i++) want.push('brn_floor_' + i, 'brn_floor_s_' + i);
    B.BRAIN_FLOWS.forEach(f => { want.push('brn_f_' + f.id, 'brn_fs_' + f.id, 'brn_flead_' + f.id); f.steps.forEach((s, i) => want.push('brn_step_' + f.id + '_' + (i + 1))); });
    for (const lang of ['en', 'sv']){ const bk = book(lang); assert.deepEqual(want.filter(k => !has(bk, k)), [], lang); }
    assert.ok(!has(book('en'), 'brn_step_upload_' + (B.BRAIN_FLOWS[0].steps.length + 1)), 'no step sentence for a step the flow does not have');
  });
});

describe('f400 (6) — the server reads the code and keeps what changed', () => {
  test('6a signed in only; a first reading is a baseline; a second reading of the same code adds nothing; a change is kept', { timeout: 120000 }, async () => {
    assert.match(SERVER, /app\.get\('\/api\/brain', auth,/);
    const { startHati, Client } = require('./helpers');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hati-brain-'));
    const login = async h => { const c = new Client(h.base, 'admin'); await c.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } }); return c; };
    let h = await startHati({ HATI_DATA: dir });
    try {
      const anon = new Client(h.base, 'anon');
      assert.equal((await anon.raw('/api/brain')).status, 401, 'the code is described only to a signed-in member');
      const admin = new Client(h.base, 'admin');
      await admin.json('/api/setup', { method: 'POST', body: { org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke', password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
      const r1 = await admin.json('/api/brain');
      assert.equal(Object.values(r1.parts).filter(p => p.found).length, B.BRAIN_PARTS.length, 'every part found by the server too');
      assert.ok(r1.edges.length >= 5 && r1.published > 1000);
      assert.equal(r1.builds.length, 1); assert.equal(r1.builds[0].diff.first, true, 'the first reading on a server is a baseline');
      const r2 = await admin.json('/api/brain');
      assert.equal(r2.builds.length, 1, 'asking again adds nothing');
    } finally { await h.stop(); }
    // A code update, staged: what the last reading remembers lacks one name and has another fingerprint.
    const db = new DatabaseSync(path.join(dir, 'hati.db'));
    const last = JSON.parse(db.prepare("SELECT json FROM store WHERE key='brain.lastMap'").get().json);
    last.map.published = last.map.published.filter(p => p.name !== 'renderBrainPage');
    last.key = 'before-the-update';
    db.prepare("UPDATE store SET json=? WHERE key='brain.lastMap'").run(JSON.stringify(last));
    const builds = JSON.parse(db.prepare("SELECT json FROM store WHERE key='brain.builds'").get().json);
    builds[0].key = 'before-the-update';
    db.prepare("UPDATE store SET json=? WHERE key='brain.builds'").run(JSON.stringify(builds));
    db.close();
    h = await startHati({ HATI_DATA: dir });
    try {
      const admin = await login(h);
      const r3 = await admin.json('/api/brain');
      assert.equal(r3.builds.length, 2, 'the restart read the code again and kept the difference');
      assert.equal(r3.builds[0].diff.first, false);
      assert.deepEqual(r3.builds[0].diff.born.map(b => b.name), ['renderBrainPage'], 'the part the code grew is named');
      assert.equal(r3.builds[0].diff.born[0].reg, 'see');
    } finally { await h.stop(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} }
  });
});
