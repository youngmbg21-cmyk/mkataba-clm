/* f1146 · THE TOP BOX FILTERS, JAMBO'S BOX ASKS (owner, 22 Nov 2026: "Apart from the discover page, there are pages where
   at the top the search shows an AI icon and states that you can ask a question of the page. In reality, they are only
   a filter for the list" — then "make them honest labels but jambo should have the ability to answer those questions").
   (1) Eleven list pages' top box wears the magnifying glass (never Jambo's spark) and says it filters; its words always
       narrow the list, and Enter hands nothing to Jambo (Contracts, Negotiations, Requests, People and Parties guessed).
   (2) Jambo's box at the side panel's foot carries the page's example question instead (jlPagePh), in both books.
   (3) One closing style rule draws the glass quiet and in line, above every page's own spark rule.
   Discover's box is not one of them: it really asks (it starts a read). The first Import screen's box asks too.
   AT THE PARENT (1)–(3) fail: the boxes wear the spark and "Ask about …", five hand Enter to Jambo, no jlPagePh. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* each page: its file, the box's own id (or attribute), and the words its box must say */
const BOXES = [
  ['approvals', 'js/views/approvalsview.js', 'id="apn-q"'],
  ['playbook', 'js/views/ladder.js', 'id="ld-q"'],
  ['our paper', 'js/views/library.js', '<label class="apn-ask tpln6-ask'],
  ['settings', 'js/views/settings.js', 'id="sdd-q"'],
  ['import batch', 'js/views/migration.js', 'id="mign-q"'],
  ['my notes', 'js/views/mynotes.js', 'id="mnn-q"'],
  ['contracts landing', 'js/views/register.js', 'id="ctf-q"'],
  ['negotiations', 'js/views/register.js', 'id="ngn-q"'],
  ['requests', 'js/views/intake.js', 'id="ikn-q"'],
  ['people', 'js/views/directory.js', 'id="dirn-q"'],
  ['parties', 'js/views/customers.js', 'id="cun-q"'],
];
const lineOf = (src, mark) => { const i = src.indexOf(mark); assert.ok(i >= 0, mark + ' drawn'); const a = src.lastIndexOf('\n', i), b = src.indexOf('\n', i); return src.slice(a + 1, b); };

test('f1146 (1) every one of the eleven top boxes is an honest filter: the glass, never the spark', () => {
  for (const [name, file, mark] of BOXES){
    const src = read(file), line = lineOf(src, mark);
    assert.match(line, /<label class="apn-ask[^"]*\bis-filter\b/, name + ': marked a filter');
    assert.doesNotMatch(line, /mkSpark|MIGN_SPARK|icon\('sparkle'/, name + ': no Jambo spark');
    assert.doesNotMatch(line, /is-spark/, name + ': no spark class');
  }
  /* My notes draws its glass from a name set just above the box */
  assert.match(read('js/views/mynotes.js'), /const glass = typeof icon === 'function' \? icon\('search', 'mnn-spark'\) : '';/);
  for (const [name, file, mark] of BOXES.filter(b => b[0] !== 'my notes')){
    assert.match(lineOf(read(file), mark), /icon\('search'/, name + ': the magnifying glass, drawn in line (no zero stroke)');
    assert.doesNotMatch(lineOf(read(file), mark), /icon\('search',[^)]*,\s*0\)/, name + ': a visible stroke');
  }
});

test('f1146 (1b) the words say filter (or find a setting), never "Ask about"', () => {
  const I = read('js/i18n.js');
  assert.match(strip(read('js/views/approvalsview.js')), /const askPh=i18t\('lh_filter_ph'\);/);
  assert.match(lineOf(read('js/views/ladder.js'), 'id="ld-q"'), /i18t\('lh_filter_ph'\)/);
  assert.match(lineOf(read('js/views/library.js'), '<label class="apn-ask tpln6-ask'), /i18t\('lh_filter_ph'\)/);
  assert.match(strip(read('js/views/settings.js')), /function sddAskPh\(a\)\{ return a\?i18t\('sdd_find_in',\{ area:i18t\('sdd_a_'\+a\) \}\):i18t\('sdd_find_ph'\); \}/);
  assert.match(lineOf(read('js/views/migration.js'), 'id="mign-q"'), /i18t\('mign_filter_ph'\)/);
  assert.match(strip(read('js/views/mynotes.js')), /function mnnAskPh\(\)\{ return i18t\('mnn_filter_ph'\); \}/);
  assert.match(lineOf(read('js/views/register.js'), 'id="ctf-q"'), /i18t\('lh_filter_ph'\)/);
  assert.match(strip(read('js/views/register.js')), /const askPh = i18t\('lh_filter_ph'\);/);
  assert.match(lineOf(read('js/views/intake.js'), 'id="ikn-q"'), /i18t\('lh_filter_ph'\)/);
  assert.match(strip(read('js/views/directory.js')), /const askPh = i18t\('lh_filter_ph'\);/);
  assert.match(strip(read('js/views/customers.js')), /function cunAskPh\(\)\{ return i18t\('lh_filter_ph'\); \}/);
  for (const k of ['sdd_find_in', 'mign_filter_ph', 'mnn_filter_ph']) assert.equal(I.split('    ' + k + ':').length, 3, k + ' in both books');
});

test('f1146 (1c) the top box never hands Enter to Jambo, and every word narrows', () => {
  const REG = strip(read('js/views/register.js'));
  assert.doesNotMatch(REG, /e\.target\.id !== 'ngn-q' \|\| e\.key !== 'Enter'/, 'Negotiations');
  assert.doesNotMatch(REG, /e\.target\.id === 'ctf-q' \? e\.target : null; if \(!q \|\| e\.key !== 'Enter'/, 'Contracts\' landing');
  assert.doesNotMatch(REG.slice(REG.indexOf('lhRegister(REG_CT_SEAT, {'), REG.indexOf('lcSeat:onList')), /\basks:true\b/, 'Contracts\' list');
  assert.doesNotMatch(strip(read('js/views/intake.js')), /e\.target\.id !== 'ikn-q' \|\| typeof state === 'undefined' \|\| state\.view !== 'intake'\) return;\s*const w = [^\n]*jlAsk/, 'Requests');
  assert.doesNotMatch(strip(read('js/views/directory.js')), /DIRN_ASK_RE|e\.target\.id !== 'dirn-q' \|\| e\.key !== 'Enter'/, 'People');
  assert.doesNotMatch(read('js/views/customers.js'), /cunAskGo/, 'Parties');
  assert.match(strip(read('js/views/customers.js')), /const narrow = !!q;/, 'Parties: words that name nothing narrow to nothing');
  assert.doesNotMatch(REG, /lhIsQuestion\(q\.value\)\) return;/, 'Contracts\' landing narrows on every word');
});

/* (2) the panel's box, run on its own */
function pagePh(here, opt){
  const INS = strip(read('js/views/inspector.js'));
  const a = INS.indexOf('const JL_PAGE_ASKS'), b = INS.indexOf('function jlFrame(');
  assert.ok(a >= 0 && b > a, 'jlPagePh exists before jlFrame');
  const words = { jl_ph_any: 'Ask Jambo, or type / for a place', jl_ph_list: 'Ask Jambo, or type / for a place' };
  const i18t = k => words[k] || ('[' + k + ']');
  const window = { guideHereKey: () => here };
  return new Function('window', 'i18t', INS.slice(a, b) + '; return jlPagePh;')(window, i18t)(opt);
}
test('f1146 (2) Jambo\'s box carries the page\'s own example question, in both books', () => {
  assert.equal(pagePh('approvals', { jlPh: 'Ask Jambo, or type / for a place' }), '[jl_ph_pg_approvals]', 'the plain words give way to the page\'s question');
  assert.equal(pagePh('parties', {}), '[jl_ph_pg_parties]');
  assert.equal(pagePh('contracts', { seat: 'negotiations' }), '[jl_ph_pg_negotiations]', 'Negotiations named by its seat');
  assert.equal(pagePh('approvals', { jlPh: 'Ask about this clause' }), 'Ask about this clause', 'a page\'s own words stand');
  assert.equal(pagePh('board', {}), 'Ask Jambo, or type / for a place', 'a page not among the eleven keeps the plain words');
  const I = read('js/i18n.js');
  for (const k of ['approvals', 'standards', 'ourpaper', 'settings', 'import', 'mynotes', 'contracts', 'negotiations', 'requests', 'people', 'parties'])
    assert.equal(I.split('    jl_ph_pg_' + k + ':').length, 3, 'jl_ph_pg_' + k + ' in both books');
  const INS = strip(read('js/views/inspector.js'));
  assert.match(INS, /const ph = jlPagePh\(opt\);/, 'the box is told on every paint');
  assert.match(INS, /jlAskHtml\(\{ placeholder: jlPagePh\(opt\) \}\)/, 'and when first drawn');
  assert.match(read('js/app.js'), /guideHereKey,/, 'the page\'s name is published');
  /* Contracts stands on Home: its box is Home's, told by hbPlaceholder on the 'paper' face with no contract in front */
  assert.match(strip(read('js/views/homeboard.js')), /function hbPlaceholder\(\)\{ const f = hbS\(\)\.face; return f === 'board' \? i18t\('hb_ask_ph'\) : f === 'paper' \? i18t\('jl_ph_pg_contracts'\) : null; \}/);
});

test('f1146 (3) one closing rule draws every glass quiet and in line, after the pages\' spark rules', () => {
  const H = read('index.html');
  const rule = 'html.lg-new :is(#ct-place, body) .apn-ask.is-filter svg, html.lg-new :is(#ct-place, body) .apn-ask.is-filter svg path{color:var(--color-quiet);fill:none;stroke:currentColor}';
  const at = H.indexOf(rule);
  assert.ok(at > 0, 'the rule is there');
  for (const old of ['.tpln6 .tpln6-ask svg{', '.ikn-page .apn-ask.ikn-ask > svg{', '#ct-place .ctf-page .ctf-ask svg{', '.dirn-page .dirn-ask svg path{', '.cun-page .cun-ask .cun-spark{'])
    assert.ok(H.indexOf(old) > 0 && H.indexOf(old) < at, old + ' comes before it');
  assert.doesNotMatch(H.slice(at, at + rule.length), /!important/);
});

test('f1146 (4) Discover\'s box and the first Import screen\'s box still ask (they really do)', () => {
  assert.match(read('js/views/reads.js'), /<label class="apn-ask dsn-lask">\$\{typeof icon === 'function' \? icon\('sparkle'/);
  assert.match(read('js/views/migration.js'), /<label class="apn-ask mign-ask">\$\{MIGN_SPARK\}<input id="mign-ask0"/);
});
