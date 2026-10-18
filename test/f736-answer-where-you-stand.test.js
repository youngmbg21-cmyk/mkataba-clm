/* f736 — ANSWER WHERE YOU STAND, the imports trial (owner, 18 Oct 2026: "if I
   am in explorer and I say show me all imports, it does not take me to
   another window … assessment of current screen vs moving someone to another
   screen if the information is in multiple locations"; "yes, build the
   imports trial")

   Five claims, each asked where it lives:
     1 · ONE fact list (CA_HERE_FACTS): "imported" is c.migration, the Import
         page's own mark, read in both languages
     2 · a request to SEE is answered where you stand; a page named outright or
         the page's own act still goes there (caHereRead's three readings)
     3 · Explorer's reader reads the fact from that list (igConditions), so
         "show me all imports", "imports" and "which … were imported?" narrow
         or light the map, and it combines with the other facts
     4 · the AI's map filter carries the same fact, as a field, on both hosts
         (GRAPH_WHERE_KEYS `imported`, the card, the shared predicate)
     5 · Home's box asks the screen first, before any page word moves it, and
         the answer's door is the one mover (caGo)

   Run: node --test test/f736-answer-where-you-stand.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CA = fs.readFileSync(path.join(ROOT, 'js', 'copilotacts.js'), 'utf8');
const IG = fs.readFileSync(path.join(ROOT, 'js', 'views', 'intelligence.js'), 'utf8');
const SRV = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
const GW = require(path.join(ROOT, 'js', 'graphwhere.js'));
const fnOf = (src, head) => { const at = src.indexOf(head); if (at < 0) return ''; const open = src.indexOf('{', src.indexOf(')', at)); let d = 0;
  for (let i = open; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && !--d) return src.slice(at, i + 1); } return ''; };
const lineOf = (src, re) => { const m = src.match(re); return m ? m[0] : ''; };

/* the readings, run as the page runs them, on a stage whose screen we set —
   since the one rule (f737, 18 Oct 2026) with the map's real word readers */
const stage = require('./herestage').hereStage();
const read = (q, face) => { stage.face = face || 'explorer'; return stage.read ? stage.read(q) : undefined; };

describe('f736 (1) one fact list', () => {
  test('"imported" is the Import page\'s own mark, c.migration', () => {
    const f = stage.fact && stage.fact('imported');
    assert.ok(f, 'the fact is listed');
    assert.equal(f.page, 'import');
    assert.equal(f.of({ migration: { batch: 'b1' } }), true);
    assert.equal(f.of({}), false);
    for (const w of ['imports', 'imported', 'migrated', 'importerade', 'migrerade', 'importer', 'did we import']) assert.ok(f.re.test(w), w);
    assert.ok(!f.re.test('important') && !f.re.test('import'), 'never "important", never the bare verb');
  });
});

describe('f736 (2) answer where you stand; the page when it is the page you want', () => {
  test('a request to see, on a screen that can show it, is answered there', () => {
    for (const q of ['show me all imports', 'imports', 'the imported ones', 'which contracts were imported?', 'how many contracts were imported?',
      'where are the migrated contracts?', 'visa alla importerade avtal', 'vilka avtal har importerats?'.replace('har importerats', 'är importerade')]) {
      const r = read(q);
      assert.ok(r && r.fact === 'imported' && r.screen === 'explorer', 'here: ' + q);
    }
    assert.equal((read('show me all imports', 'paper') || {}).screen, 'contracts', 'the Contracts place answers too');
  });
  test('the page named outright, or its own act, goes to the page', () => {
    for (const q of ['open the import page', 'go to imports', 'take me to the imports', 'import old contracts', 'bulk upload', 'how do I import contracts?',
      'öppna importsidan', 'importera gamla avtal', 'jag vill importera avtal'])
      assert.equal(read(q), null, 'the page: ' + q);
  });
  test('a screen that shows no contracts answers nothing here, so the words go on as before', () => {
    for (const face of ['board', 'calendar']) assert.equal(read('show me all imports', face), null, face);
    stage.state.view = 'counter'; assert.equal(read('show me all imports'), null, 'Home'); stage.state.view = 'dashboard';
  });
  test('a long sentence that does not ask to see is not taken', () => {
    assert.equal(read('the risks in the contracts we imported from the old system last year'), null);
  });
});

describe('f736 (3) Explorer\'s reader reads the fact from the list', () => {
  test('igConditions asks caHereFact, never its own copy of the words', () => {
    const c = fnOf(IG, 'function igConditions(');
    assert.match(c, /const f=\(typeof window\.caHereFact==='function'\)\?caHereFact\('imported'\):null; const m=f&&t\.match\(f\.re\); if\(m\) add\('imported', f\.of, 'imported', m\[0\]\.trim\(\)\);/);
  });
});

describe('f736 (4) the AI\'s map filter carries the same fact, both hosts', () => {
  test('the key, on both hosts', () => {
    const keysOf = src => { const m = /const GRAPH_WHERE_KEYS ?= ?(\[[^\]]*\]);/.exec(src); return m ? vm.runInNewContext(m[1]) : []; };
    assert.ok(keysOf(SRV).includes('imported') && keysOf(IG).includes('imported'));
    assert.equal(JSON.stringify(keysOf(SRV)), JSON.stringify(keysOf(IG)), 'the same list');
  });
  test('the card carries it on both hosts, and the shared predicate reads it', () => {
    assert.match(fnOf(IG, 'function graphCopilotCard('), /imported:!!\(c&&c\.migration\)/);
    assert.match(fnOf(SRV, 'function copilotCardOf('), /imported: !!c\.migration/);
    const reads = { daysUntil: () => 0, folderIdOf: () => '' };
    assert.equal(GW.graphWhereHit({ imported: true }, { imported: true }, reads), true);
    assert.equal(GW.graphWhereHit({ imported: false }, { imported: true }, reads), false);
    assert.equal(GW.graphWhereHit({}, { imported: false }, reads), true, 'not imported reads as false');
  });
  test('the schema offers it as a yes/no and says what it is', () => {
    assert.match(lineOf(SRV, /\n\s+move: \{ type: 'string', enum: \['you', 'them'\] \}, archived: \{ type: 'boolean' \}, imported: \{ type: 'boolean' \} \} \};/), /imported/);
    assert.match(SRV, /imported \(true = brought in through Import contracts\)/);
  });
});

describe('f736 (5) Home\'s box asks the screen first; the door is the one mover', () => {
  const ask = fnOf(IG, 'async function intelAsk(');
  test('the screen is asked before any page word or the map of everyday words', () => {
    const here = ask.indexOf('caHereRead(q)'), act = ask.indexOf('caActOf(q)');
    assert.ok(here > -1 && act > -1 && here < act);
    assert.match(ask, /if\(!hereMap&&typeof window\.caActOf==='function'\)/, 'on Explorer no page word is read');
    assert.match(ask, /if\(here&&here\.screen==='contracts'&&typeof window\.caHereOnList==='function'\)/, 'the Contracts place narrows its list');
    assert.match(ask, /if\(hereMap\)\{ const m=intel\.history\.slice\(h0\)/, 'and on Explorer the door rides the map\'s own answer');
  });
  test('the list is narrowed by the map\'s own reading of the same words, and none found is said', () => {
    const on = fnOf(CA, 'function caHereOnList(');
    assert.match(on, /igConditions\(q\)/); assert.match(on, /igIdsWhere\(conds, caContracts\(\)\)/);
    assert.match(on, /if \(ids\.length && typeof regShowOnly === 'function'\) regShowOnly\(ids, what\);/, 'never an empty narrowing');
  });
  test('the door goes through caGo, and the names are published after they are defined', () => {
    assert.match(fnOf(CA, 'function caHerePress('), /caGo\(\{ kind: 'go', place: a\.page, state: 'ready' \}\)/);
    const pub = CA.indexOf('Object.assign(window, { CA_HERE_FACTS'), def = CA.indexOf('const CA_HERE_FACTS = [');
    assert.ok(def > -1 && pub > def, 'a name published above its definition throws as the page loads');
  });
  test('every new sentence is in both books', () => {
    const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
    for (const k of ['ca_here_list', 'ca_here_none_imported', 'ca_here_none_match', 'ca_here_also_imported', 'ca_here_open_import'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  });
});
