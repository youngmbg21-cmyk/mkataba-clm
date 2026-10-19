/* f737 — ANSWER WHERE YOU STAND, ONE RULE FOR EVERY SCREEN (owner, 18 Oct
   2026: "When I type show me all contracts in explorer it takes me to the
   contracts page"; "why do you have to code such a rule in isolation? It
   should be a simple rule or code to show in your page unless it is not
   possible or you are instructed to go to another page"; "Yes")

   Six claims (and 3b), each asked where it lives:
     1 · on Explorer, a request the map's own reader reads WHOLE is answered
         there, whatever the fact — every contract, a stage, whose move, a
         side, a window of days, mine — in both languages
     2 · the door under the answer is the page that also holds that fact (the
         ONE list, CA_HERE_FACTS), else the Contracts list narrowed the same
     3 · the page named outright, a "/" row, or an act another page does still
         goes there; words the reader cannot read whole go on as before
     4 · the Contracts place answers with its list (every contract: the place
         at rest); a screen that shows no contracts answers nothing here
     5 · the routing asks the rule first in every box on Home, and a pressed
         place row still goes to its page
     6 · the map's reader reads "every contract" in the rule's words, and every
         new sentence is in both books

   Run: node --test test/f737-show-it-here-first.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { hereStage, CA, IG, fnOf } = require('./herestage');

const ROOT = path.join(__dirname, '..');
const AI = fs.readFileSync(path.join(ROOT, 'js', 'ai.js'), 'utf8');
const stage = hereStage();
const read = (q, face, view) => { stage.face = face || 'explorer'; stage.state.view = view || 'dashboard'; return stage.read ? stage.read(q) : undefined; };

describe('f737 (1) on Explorer, words the map reads whole are answered on the map', () => {
  test('every contract, in the words people use', () => {
    for (const q of ['show me all contracts', 'Show me all contracts.', 'all contracts', 'every contract', 'contracts', 'the contracts', 'everything',
      'show all the contracts', 'list all agreements', 'all of them', 'visa alla avtal', 'alla avtal', 'avtalen', 'visa allt']){
      const r = read(q);
      assert.ok(r && r.kind === 'here' && r.all === true && r.screen === 'explorer', 'every contract, here: ' + q);
    }
  });
  test('a group by any fact the reader knows', () => {
    for (const q of ['show me signed contracts', 'signed contracts', 'drafts', 'which contracts are waiting on us?', 'show me negotiations',
      'contracts expiring in 90 days', 'show me my contracts', 'show me suppliers', 'show me overdue contracts', 'the imported ones',
      'how many signed contracts are there?', 'visa signerade avtal', 'vilka avtal väntar på oss?', 'where are the migrated contracts?']){
      const r = read(q);
      assert.ok(r && r.kind === 'here' && r.all === false && r.screen === 'explorer' && r.what, 'here: ' + q);
    }
  });
});

describe('f737 (2) the door is the page that also holds them', () => {
  test('a fact with its own page opens that page; any other set, the Contracts list', () => {
    const page = q => (read(q) || {}).page;
    assert.equal(page('show me all imports'), 'import');
    assert.equal(page('show me negotiations'), 'negotiations');
    assert.equal(page('which contracts are waiting on them?'), 'negotiations');
    assert.equal(page('show me suppliers'), 'parties');
    assert.equal(page('show me overdue contracts'), 'oblig');
    assert.equal(page('show me signed contracts'), 'contracts');
    assert.equal(page('show me all contracts'), 'contracts');
    for (const f of stage.CA_HERE_FACTS.concat([stage.CA_HERE_LIST])) assert.ok(f.page && f.also, 'each door says what is there: ' + f.k);
  });
  test('the door is pressed through the one mover; the list opens on the set the map shows', () => {
    const press = fnOf(CA, 'function caHerePress(');
    assert.match(press, /caGo\(\{ kind: 'go', place: 'contracts', reg: \{ only: \{ ids: a\.ids\.slice\(\), label: String\(a\.what \|\| ''\) \} \}, state: 'ready' \}\)/);
    assert.match(press, /caGo\(\{ kind: 'go', place: a\.page, state: 'ready' \}\)/);
    const ask = fnOf(IG, 'async function intelAsk(');
    assert.match(ask, /const shown=intelActive\(\)\.ids, ids=shown\?\[\.\.\.shown\]:null;/, 'the ids are what the map shows after it answered');
    assert.match(ask, /if\(m&&!m\.act&&!ownDoor&&!\(list&&!\(ids&&ids\.length\)\)\) m\.act=Object\.assign\(\{\}, here, list\?\{ ids \}:\{\}\);/, 'none shown, no door');
    assert.match(ask, /const ownDoor=list&&!!m&&Array\.isArray\(m\.listIds\)&&m\.listIds\.length>0;/, 'the map\'s own door to the list is the one door, never a second');
  });
});

describe('f737 (3) the page when it is the page you want; the rest as before', () => {
  test('the page named, a "/" row, or an act another page does', () => {
    for (const q of ['open contracts', 'go to contracts', 'take me to the contracts', 'open the contracts page', '/negotiations', '/contracts',
      'go to negotiations', 'show me the negotiations page', 'import old contracts', 'öppna avtal', 'gå till förhandlingar'])
      assert.equal(read(q), null, 'the page: ' + q);
  });
  test('a word for a page that is not a group of contracts stays that page\'s', () => {
    assert.ok(stage.place && stage.place('draft') && stage.place('draft').place === 'draft', 'the stage reads place words');
    for (const q of ['draft', 'utkast', 'list', 'wall', 'sign', 'history', 'needs me'])
      assert.equal(read(q), null, 'the page\'s word: ' + q);
    for (const q of ['draft a contract', 'Draft a contract', 'draft an agreement with us', 'review', 'review all', 'skriv ett avtal'])
      assert.equal(read(q), null, 'an act, even where its verb is a stage\'s word: ' + q);
    for (const q of ['show me overdue obligations', 'visa förfallna åtaganden', 'which approvals are late?'])
      assert.equal(read(q), null, 'another kind of thing: its page: ' + q);
    assert.ok(read('contracts with overdue obligations'), 'contracts named, the screen shows them');
  });
  test('words the reader cannot read whole are not taken', () => {
    for (const q of ['draft an NDA', 'what is the total value of signed contracts?', 'summarise the signed contracts', 'export signed contracts',
      'MK-12', 'show me MK-12', 'signed contracts that mention force majeure', 'board', 'calendar', 'obligations', 'what needs me',
      'book a meeting with legal', 'which template should I start from?', 'compare signed with drafts'])
      assert.equal(read(q), null, 'as before: ' + q);
  });
});

describe('f737 (3b) on Explorer the map itself must read them as a set to show', () => {
  test('a narrowing, never a question back ("suppliers": arrange by what?)', () => {
    const r = fnOf(CA, 'function caHereRead(');
    assert.match(r, /if \(screen === 'explorer' && typeof igRecipeParse === 'function'\)\{/);
    assert.match(r, /if \(!acts\.some\(x => x\.narrow\) \|\| acts\.some\(x => x\.ask \|\| x\.unknownFact\)\) return null;/);
    assert.match(fnOf(IG, 'function igRecipeParse('), /\|where are\|where's\|markera\|lys upp\|vilka\|visa vilka\|var är\|var finns\)\\s\+\(\.\+\)\$\//, '"where are the …" is shown, as "which" is');
  });
});

describe('f737 (4) the Contracts place answers with its list; other screens answer nothing here', () => {
  test('the Contracts place: every contract is the place at rest; a group, its list narrowed', () => {
    const all = read('show me all contracts', 'paper');
    assert.ok(all && all.all === true && all.screen === 'contracts' && !all.page, 'no door to itself');
    const signed = read('show me the signed contracts', 'paper');
    assert.ok(signed && signed.screen === 'contracts' && signed.what && !signed.page, 'the list, narrowed; no door to itself');
    assert.equal((read('show me all imports', 'paper') || {}).page, 'import', 'a fact with its own page keeps its door');
    assert.ok(read('hur många avtal är importerade?', 'paper'), 'Swedish everyday words are read away (the map\'s filler misses å, ä, ö)');
  });
  test('the Board, the Calendar and the Home page show no group of contracts', () => {
    for (const face of ['board', 'calendar']) assert.equal(read('show me signed contracts', face), null, face);
    assert.equal(read('show me signed contracts', 'explorer', 'counter'), null, 'Home');
  });
  test('the place narrows by the same reading, and every contract goes through the place word\'s own move', () => {
    const ask = fnOf(IG, 'async function intelAsk(');
    assert.match(ask, /if\(here&&here\.screen==='contracts'&&here\.all&&typeof window\.caGo==='function'\)\{\s*const go=\{ kind:'go', place:'contracts', state:'ready' \};/);
    const on = fnOf(CA, 'function caHereOnList(');
    assert.match(on, /if \(!conds\.length\) return null;/);
    assert.doesNotMatch(on, /c\.field === here\.fact/, 'any condition narrows the list, not one fact');
  });
});

describe('f737 (5) every box on Home asks the rule; a pressed place still goes', () => {
  test('the window and the other boxes hand Home\'s Jambo what the screen in front answers', () => {
    /* RE-POINTED 19 Oct 2026 (owner: "I want hati to do what the user asks in
       plain language"): what the one reader reads (caUnderstand, `u`) is
       handed to Home's own box too, beside the place words and the rule */
    assert.match(fnOf(CA, 'function caAskAnywhere('), /if \(!opts\.all && !u && !caReadPlace\(t\) && !caTakesWords\(t\) && !caHereRead\(t\)\) return false; intelAsk\(t\); return true;/);
    assert.match(fnOf(AI, 'async function aiSubmit('), /if\(go&&window\.caHereRead&&caHereRead\(q\)\) go=null;/, 'and says no place it did not go to');
  });
  test('a pressed place row ("/", ⌘K) is said as "/" says it, so it goes to the page', () => {
    assert.match(fnOf(CA, 'function caPlaceRun('), /return intelAsk\(caHereRead\(word\) \? '\/' \+ caSlashWord\(k\) : word\);/);
  });
});

describe('f737 (6) one reading of every contract; both books', () => {
  test('the map\'s reader reads every contract in the rule\'s words', () => {
    assert.match(fnOf(IG, 'function igRecipeParse('), /\(window\.CA_HERE_ALL_RE instanceof RegExp&&CA_HERE_ALL_RE\.test\(q\)\)\) return \{ acts:\[\{ everything:true \}\], rest:'' \};/);
    const pub = CA.indexOf('Object.assign(window, { CA_HERE_FACTS'), def = CA.indexOf('const CA_HERE_ALL_RE');
    assert.ok(def > -1 && pub > def && /CA_HERE_ALL_RE, CA_HERE_EXTRA_RE/.test(CA.slice(pub, CA.indexOf('\n', pub))), 'published, after it is defined');
  });
  test('every door\'s sentence is in both books', () => {
    const I18N = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
    const keys = new Set();
    for (const f of stage.CA_HERE_FACTS.concat([stage.CA_HERE_LIST])){ keys.add(f.also); keys.add('ca_here_open_' + f.page); if (f.none) keys.add(f.none); }
    for (const k of keys) assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
  });
});
