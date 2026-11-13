'use strict';
/* f1042 — BRAIN WELCOME: JAMBO'S OVERVIEW ON THE BOARD OPENS ON THE BRAIN (owner picked it, 13 Nov 2026: "the jambo
   panel here should be more front page jambo … it is part of the page that welcomes you to hati").

   (1) the welcome as drawn (hbBoardHelloHtml): the brain card first, his one line, the count under it, the day's
       three numbers and ONE black button; the reader is not named twice; no head sentence, no facts list.
   (2) every number is a door onto the list it counts, and a 0 is not a door (a dead button never wears a live
       one's clothes): late and "show all" → Needs you on All (the late stand first there), prepared → Jambo's tab,
       ending soon → the list behind the book's Ending figure. Existing doors only (hbWelcomeGo).
   (3) the brain is the Explorer's own: its shape, lobes and places, the reader's contracts grouped by party, Still
       until pressed at the Explorer's resting rate, a mouse drag only, no AI, nothing written.
   (4) both books say every word; the brain's night is a token.
   The browser half (it is drawn, it fits the three screens): test/chromium/brain-welcome-photos.js. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

function world({ need = 5, ready = 2, late = 1, oldest = 9, brain = true } = {}){
  const w = buildWorld({ intelView: true }).win;
  const mk = (id, status) => ({ id, name: 'Agreement ' + id, counterparty: 'Party ' + id, status, value: 100000, valueType: 'estimated', folder: 'f1', fields: {},
    metadata: { startDate: ago(300) }, expiry: '', createdAt: ago(300) + 'T09:00:00Z', comments: [], audit: [], signatures: [] });
  w.state = { contracts: [mk('A', 'Signed'), mk('B', 'Under Review'), mk('C', 'Draft')], settings: {}, view: 'dashboard' };
  w.FOLDERS = { f1: { id: 'f1', name: 'Stream' } };
  w.currentUser = () => ({ id: 'u_f1042', name: 'Maria Lind', role: 'admin' });
  w.eval(read('js/components.js'));
  w.eval(read('js/views/homeboard.js'));
  const went = [];
  w.counterNeedsCount = () => need;
  w.hbAgentsData = () => ({ ready, rows: [], done: [] });
  w.ndRead = () => ({ jambo: [], you: [], n: need, late, oldest, news: [] });
  w.ndOpenBoard = tab => { went.push('needs:' + tab); return true; };
  w.hbFigDoor = k => { went.push('fig:' + k); return true; };
  /* the world loads the Explorer's code: the card is stood in for here (its drawing is the browser's), or taken away */
  w.igMiniBrainHtml = brain ? () => '<div class="hbw-brain" data-hb-brain></div>' : undefined;
  w.hbS().face = 'board';
  return { w, went };
}

describe('f1042 (1) the welcome as drawn', () => {
  test('1a the brain first, then his line, the count, the three numbers, one black button', () => {
    const { w } = world();
    const html = w.hbBoardHelloHtml();
    const at = s => html.indexOf(s);
    assert.ok(at('class="hbw-brain"') > 0 && at('class="hbw-brain"') < at('class="hbw-say"') && at('class="hbw-say"') < at('class="hbw-trio"') && at('class="hbw-trio"') < at('class="hbw-acts"'), 'in the order drawn');
    assert.ok(html.includes('<h3 class="hbw-say">I have 2 things ready for you.</h3>'));
    assert.ok(html.includes('<p class="hbw-sub">5 need you in all. The oldest has waited 9 days.</p>'), html.match(/hbw-sub">[^<]*/));
    assert.equal((html.match(/ui-btn-primary/g) || []).length, 1, 'ONE black button');
    assert.match(html, /<button type="button" class="ui-btn ui-btn-primary" data-hbw="late">Start with the late ones<\/button><button type="button" class="jov-lnk" data-hbw="all">Show all 5<\/button>/);
    assert.match(html, /class="jov"/, 'still the one builder\'s frame');
    assert.ok(!/jov-head|jov-fact/.test(html), 'no head sentence, no facts list');
  });
  test('1b the reader is not named here (the page\'s head greets them)', () => {
    assert.ok(!/Maria/.test(world().w.hbBoardHelloHtml()));
  });
  test('1c nothing prepared: the Counter\'s number is his line; nothing late: the black button shows what needs you, alone', () => {
    const html = world({ ready: 0, late: 0, oldest: null }).w.hbBoardHelloHtml();
    assert.ok(html.includes('<h3 class="hbw-say">5 things need you today.</h3>'));
    assert.ok(!/hbw-sub/.test(html), 'nothing more to say under it');
    assert.match(html, /<div class="hbw-acts"><button type="button" class="ui-btn ui-btn-primary" data-hbw="all">Show what needs you<\/button><\/div>/);
  });
  test('1d nothing waiting: said, and no button', () => {
    const html = world({ need: 0, ready: 0, late: 0, oldest: null }).w.hbBoardHelloHtml();
    assert.ok(html.includes('<h3 class="hbw-say">Nothing needs you right now.</h3>'));
    assert.ok(!/hbw-acts/.test(html));
  });
  test('1e where the Explorer\'s code is not loaded, the welcome still stands without its card', () => {
    const html = world({ brain: false }).w.hbBoardHelloHtml();
    assert.ok(!/hbw-brain/.test(html) && /hbw-say/.test(html));
  });
});

describe('f1042 (2) every number is a door, and a 0 is not', () => {
  test('2a late and prepared are buttons; ending soon, with none ending, is not', () => {
    const html = world().w.hbBoardHelloHtml();
    assert.match(html, /<button type="button" class="hbw-n is-late" data-hbw="late"><b>1<\/b><span>late<\/span><\/button>/);
    assert.match(html, /<button type="button" class="hbw-n" data-hbw="jambo"><b>2<\/b><span>prepared<\/span><\/button>/);
    assert.match(html, /<span class="hbw-n is-none"><b>0<\/b><span>ending soon<\/span><\/span>/);
  });
  test('2b each door is an existing one', () => {
    const { w, went } = world();
    ['late', 'all', 'jambo', 'ending'].forEach(k => w.hbWelcomeGo(k));
    assert.deepEqual(went, ['needs:all', 'needs:all', 'needs:jambo', 'fig:f:ending']);
  });
  test('2c the late stand first on All (the button\'s promise)', () => {
    assert.match(code(read('js/views/counter.js')), /if \(_nd\.tab === 'all'\) L = L\.map\(\(r, i\) => \(\{ r, i \}\)\)\.sort\(\(a, b\) => \(Number\(!!b\.r\.late\) - Number\(!!a\.r\.late\)\)/);
  });
  test('2d the presses are delegated once (the panel is redrawn under them)', () => {
    const HB = code(read('js/views/homeboard.js'));
    assert.match(HB, /window\._hbwWired = true;\s*document\.addEventListener\('click', e => \{\s*const b = e\.target && e\.target\.closest && e\.target\.closest\('\[data-hbw\]'\)/);
  });
});

describe('f1042 (3) the brain is the Explorer\'s own', () => {
  const IG = code(read('js/views/intelligence.js'));
  const a = IG.indexOf('function igMiniBook('), b = IG.indexOf("document.addEventListener('visibilitychange',()=>{ if(!document.hidden) igMiniWake(); });");
  const MINI = IG.slice(a, b);
  test('3a its region is found', () => { assert.ok(a > 0 && b > a); });
  test('3b the Explorer\'s shape, lobes, places and colours; the reader\'s contracts by party', () => {
    for (const name of ['igbTissue()', 'igbSlot(i)', 'igbCortex(', 'igbBasis(d)', 'IGB_GOLD', 'IGB_STATUS_COL[c.status]', "groupLabelOf(c,'counterparty')", 'IGB_TILT[0]', 'IGB_SCALE[0]', 'IGB_CY[0]', 'IGB_JIG', 'IGB_TURN_RATE'])
      assert.ok(MINI.includes(name), name);
    assert.match(MINI, /!c\.archived&&c\.status!=='Declined'&&\(typeof window\.canAccessFolder!=='function'\|\|window\.canAccessFolder\(c\.folder\)\)/, 'only what the reader can see');
  });
  test('3c Still until pressed, at the Explorer\'s resting rate; Turning draws every frame; alive only while on screen', () => {
    assert.match(MINI, /if\(!_igMini\.on\) _igMini\.spin=false;/);
    assert.match(MINI, /if\(M\.spin\|\|M\.hold\) requestAnimationFrame\(igMiniTick\);\s*else M\.timer=setTimeout\([^;]*;[^;]*;\s*\},1000\/IG_JIG_FPS\);/);
    assert.match(MINI, /if\(!L\.length\|\|document\.hidden\)\{ M\.on=false; return; \}/);
  });
  test('3d a mouse drag turns it, never a finger (a swipe is the panel\'s)', () => {
    assert.match(MINI, /if\(!cv\|\|e\.pointerType!=='mouse'\|\|e\.button!==0\) return;/);
  });
  test('3e it reads only: no AI, no save', () => {
    assert.ok(!/api\(|fetch\(|persist\(|\/api\/ai/.test(MINI));
  });
  test('3f its names are published', () => {
    assert.match(IG, /Object\.assign\(window,\{ igMiniBrainHtml, igMiniWake, igMiniModel, igMiniBook, igMiniDraw \}\);/);
    assert.match(code(read('js/views/homeboard.js')), /hbOpenExplorer, hbWelcomeGo, /);
  });
});

describe('f1042 (4) both books, and the token', () => {
  test('4a every word in both books', () => {
    const I = read('js/i18n.js');
    for (const k of ['hbw_ready_one', 'hbw_ready_other', 'hbw_needs_one', 'hbw_needs_other', 'hbw_all_one', 'hbw_all_other', 'hbw_late', 'hbw_prepared', 'hbw_ending', 'hbw_start_late', 'hbw_show_needs', 'hbw_show_all_one', 'hbw_show_all_other', 'hbw_open_explorer', 'hbw_brain_aria'])
      assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
  });
  test('4b the brain\'s night is a token, used by name', () => {
    const H = read('index.html');
    assert.match(H, /--brain-stage:radial-gradient\(/);
    assert.match(H, /\.hbw-brain\{[^}]*background:var\(--brain-stage\)/);
    assert.match(H, /\.hbw-ctl\{[^}]*color:var\(--brain-ink\)/);
  });
});
