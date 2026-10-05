/* f507 — THE THREAD: the Document tab's one card for reading a clause
   (Young, 5 Oct 2026: "Build Thread with Quiet's typography … noting that
   add note feature has been deleted from the worth a look panel")
   ============================================================================
   Three things sat on the Document tab for one job: the three-position switch
   (Contract View · Plain View · Risk View), the Plain English column laid over
   the paper, and the X-ray panel with its clause map. The owner asked for one
   screen with all of it, plain English PER CLAUSE on request rather than the
   whole contract at once. Three options were drawn (Facing, Marked, Ledger),
   then three on Facing (Thread, Strand, Quiet); the owner picked THREAD with
   QUIET's typography.

   WHAT THE THREAD IS. One card in the right column, every clause a row with a
   bead; the OPEN row is the clause at the line 24px below the paper's top.
   Scrolling the paper opens the row at the line; pressing a row glides the
   paper until that clause is at the line; ‹ › step one clause. The open row
   holds: the reading in the paper's own face and size (or "Explain this
   clause", which reads ONE clause, with "Explain all N"), WORTH A LOOK (the
   one light-red area; marks as sentences with a coloured rule, NO "Add a
   note"), WHO DOES WHAT, and what has been argued.

   WHAT WENT. The switch, the Plain column, the X-ray panel, the Checks card
   and the Activity & comments card on the Document tab (the owner: "they are
   essentially redundant"), the DNA strand in the margin (it stays on the
   Explorer). The checks live in the room head and the Thread's "not yet read
   · Run" line presses the SAME door.

   WHY THESE CLAIMS ARE PINNED ON SOURCE AND SHEET: thread-verify.js drives the
   real page; this file holds the shape that cannot drift without being seen —
   the line, the glide's hold, the one funnel, the one-clause route, the face,
   and the absences. Every claim here was RED at unmodified main, save the
   Explorer-strand control, which passes on both sides by design. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');
const SERVER = read('server/server.js');
const RISKS = read('js/risks.js');
const JS_FILES = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)
  .concat(fs.readdirSync(path.join(ROOT, 'js', 'views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f));
const ALL_JS = JS_FILES.map(f => read(f)).join('\n');

/* The REGION of a top-level function, to its own closing brace at column 0
   (pin the region, not a byte count). */
const region = (src, name) => {
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at >= 0, name + ' exists');
  const end = src.indexOf('\n}\n', at);
  return src.slice(at, end + 3);
};
const THREAD = CONTRACT.slice(CONTRACT.indexOf('const DOC_THREAD_LINE'), CONTRACT.indexOf('function wireDocCanvas'));

describe('f507 (1) — one card, where the layers were', () => {
  test('the Document tab draws the Thread in the right column, hidden until painted', () => {
    assert.match(CONTRACT, /<div id="doc-thread" class="doc-th" hidden><\/div>/);
  });
  test('and NOT the switch, the Plain column, the X-ray panel, the Checks card or the Activity card', () => {
    for (const gone of ['data-doc-read="', 'id="doc-read"', 'id="doc-xray"', 'id="checks-card"', 'id="feed"',
      'function docReadSwitchHtml', 'function docViewSet', 'function docViewMode', 'function renderChecksCard',
      'function renderFeed', 'function wireComments', 'function docXrayPaint', 'function docReadFlags'])
      assert.ok(!ALL_JS.includes(gone), 'gone from js/: ' + gone);
  });
  test('the strand stays on the Explorer and is not drawn on the Document tab', () => {
    assert.ok(CONTRACT.includes('function docXraySpineHtml'), 'the builder is kept for the Explorer');
    assert.ok(!THREAD.includes('docXraySpineHtml'), 'and the Thread never calls it');
    assert.match(read('js/views/intelligence.js'), /docXraySpineHtml/, 'the Explorer still does');
  });
  test('the other hosts that repainted the Checks card now repaint the Thread', () => {
    for (const f of ['js/ai.js', 'js/obligations.js', 'js/views/templatelib.js']) {
      const s = read(f);
      assert.ok(!s.includes('renderChecksCard('), f + ' no longer presses the card');
      assert.match(s, /docThreadPaint\(/, f + ' repaints the Thread');
    }
  });
  test('the old names are published no more, and every published name is declared', () => {
    const pubAt = CONTRACT.lastIndexOf('Object.assign(window');
    /* comments stripped first: a word in a note beside a name is not a name */
    const pub = CONTRACT.slice(pubAt, CONTRACT.indexOf('});', pubAt)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const old of ['docViewSet', 'docViewMode', 'docReadSet', 'renderChecksCard', 'renderFeed', 'wireComments', 'docXrayPaint', 'docReadFlags', 'docXrayFollow'])
      assert.ok(!new RegExp('\\b' + old + '\\b').test(pub), 'not published: ' + old);
    for (const now of ['docThreadPaint', 'docThreadOn', 'docThreadAtLine', 'docThreadGoTo', 'DOC_THREAD_LINE', 'docReadPaint', 'docReadOn'])
      assert.ok(new RegExp('\\b' + now + '\\b').test(pub), 'published: ' + now);
    /* THE LESSON OF THE FIRST LOAD: a name on the publish list that nothing
       declares throws at module load and takes the whole app down. */
    const names = [...pub.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map(m => m[1])
      .filter(n => !['Object', 'assign', 'window'].includes(n));
    const undeclared = names.filter(n => !new RegExp('(?:^|\\n)\\s*(?:async\\s+)?(?:function\\*?\\s+' + n + '\\s*\\(|(?:const|let|var)\\s+' + n + '\\b|(?:const|let|var)\\s[^;\\n]*,\\s*' + n + '\\s*=)').test(CONTRACT));
    assert.deepEqual(undeclared, [], 'every published name is declared in the file');
  });
});

describe('f507 (2) — the line decides the open row', () => {
  test('ONE line, 24px below the paper\'s top, measured live', () => {
    assert.match(THREAD, /const DOC_THREAD_LINE = 24;/);
    const at = region(CONTRACT, 'docThreadAtLine');
    assert.match(at, /getBoundingClientRect\(\)\.top\+DOC_THREAD_LINE\+0\.5/, 'the line is the scroller\'s top plus the constant');
    assert.match(at, /getBoundingClientRect\(\)\.top<=line\) here=i;/, 'the LAST row that has reached the line');
  });
  test('a scroll of the paper opens the row at the line, off the last walk — never a re-walk', () => {
    const arm = region(CONTRACT, 'docThreadFollowArm');
    assert.match(arm, /addEventListener\('scroll'/);
    assert.match(arm, /\{passive:true\}/, 'and never blocks the paper\'s scroll');
    assert.match(arm, /requestAnimationFrame/, 'one answer per frame');
    assert.match(arm, /docThreadOpen\(c,docThreadAtLine\(\)\)/);
    const open = region(CONTRACT, 'docThreadOpen');
    assert.ok(!open.includes('docReadSheet('), 'a scroll never walks the sheet');
    assert.match(open, /const cache=_docThreadCache;/, 'it reads the last paint\'s walk');
  });
  test('a press GLIDES the paper to the line, and the end of the glide reconciles', () => {
    const go = region(CONTRACT, 'docThreadGoTo');
    assert.match(go, /sc\.scrollTop-DOC_THREAD_LINE\+1/, 'the target puts the clause on the line');
    assert.match(go, /scrollTo\(\{top:target,behavior:'smooth'\}\)/, 'a glide, not a jump');
    assert.match(go, /docThreadReduce\(\)/, 'unless the reader asked for no motion');
    assert.match(go, /_docThreadHold = target>max \? i : -1;/,
      'a clause the paper cannot bring up to the line (the last ones) is HELD open');
    const settle = region(CONTRACT, 'docThreadSettle');
    assert.match(settle, /held>=0\?held:docThreadAtLine\(\)/, 'the line wins unless the row is held');
  });
  test('the risk door lands on the worst-marked clause and glides there once', () => {
    assert.match(region(CONTRACT, 'riskViewOpen'), /_docThreadWant='risk'/);
    const paint = region(CONTRACT, 'docThreadPaint');
    assert.match(paint, /XR_GRADES\.find\(g=>rows\.some\(x=>x\.tone===g\)\)/, 'worst first is the risk list\'s own order');
    assert.match(paint, /if\(land>=0\) setTimeout\(\(\)=>\{ try\{ docThreadGoTo\(docThreadCur\(c\),land\); \}/);
  });
});

describe('f507 (3) — what the open row holds', () => {
  const body = region(CONTRACT, 'docThreadBodyHtml');
  test('the reading, in the paper\'s face and size (Quiet\'s typography)', () => {
    assert.match(body, /<div class="doc-th-plain">\$\{docReadMark\(p\)\}<\/div>/, 'the brief\'s own bold');
    assert.match(INDEX, /\.doc-th-plain\{ font-family:var\(--dr-face,var\(--font-doc\)\); font-size:var\(--dr-size,calc\(13\.5px \* var\(--doc-scale,1\)\)\)/,
      'the face and size are the paper\'s, measured off it');
    assert.match(region(CONTRACT, 'docThreadFace'), /--dr-face/, 'measured once per paint');
  });
  test('or "Explain this clause" — ONE clause, with "Explain all" beside it and the cost said', () => {
    const ex = region(CONTRACT, 'docThreadExplainHtml');
    assert.match(ex, /data-th-explain="\$\{i\}"/);
    assert.match(ex, /data-th-explain-all/);
    assert.match(ex, /th_cost/, 'the cost is by the button');
    assert.match(ex, /docThreadNoAi\(\)/, 'not connected is known before the press, greyed with why');
    const wire = region(CONTRACT, 'docThreadWire');
    assert.match(wire, /docReadRun\(cur,\{only:\[i\],force:ex\.hasAttribute\('data-th-force'\)\}\)/, 'one row to the route');
    assert.match(wire, /docReadRun\(cur,\{\}\)/, 'Explain all is the whole contract, as before');
  });
  test('WORTH A LOOK: the one light-red area, marks as sentences with a coloured rule, and NO "Add a note"', () => {
    assert.match(body, /<div class="doc-th-look\$\{marks\?' has':''\}">/);
    assert.match(body, /docXrayMarkHtml\(m,''\)/, 'the X-ray\'s own mark, with an EMPTY foot');
    assert.ok(!THREAD.includes('riskMarkFootHtml') && !THREAD.includes('data-rk-note'),
      'the owner: "add note feature has been deleted from the worth a look panel"');
    assert.match(INDEX, /\.doc-th-look\.has\{[^}]*--st-ruby-dot/, 'the wash is the ruby tint');
    assert.match(INDEX, /\.doc-th-look \.doc-xr-mark::before\{[^}]*width:3px/, 'a rule, not a chip');
    assert.match(INDEX, /\.doc-th \.doc-xr-k\{ display:none/, 'no section captions inside a row');
  });
  test('WHO DOES WHAT, drawn by its own builder, and what has been argued', () => {
    assert.match(body, /docXrayWho\(c,rows,i\)/);
    assert.match(body, /docXrayWhoHtml\(who\)/);
    assert.match(body, /ladderRungs\(c,cid\)/);
  });
  test('where a reading has not been run the row says so with the room head\'s OWN door', () => {
    const un = region(CONTRACT, 'docThreadUnrunHtml');
    assert.match(un, /data-room-check="\$\{k\}"/, 'one act, not two');
    assert.match(body, /docThreadUnrunHtml\(c,\['risk','playbook'\]\)/);
    assert.match(body, /docThreadUnrunHtml\(c,\['oblig'\]\)/);
  });
  test('the row\'s state says what is known: marks in the worst tone, Read, or Reading…', () => {
    const st = region(CONTRACT, 'docThreadStates');
    assert.match(st, /th_look_n/);
    assert.match(st, /class="is-read"/);
    assert.match(st, /class="is-wait"/);
    assert.match(st, /\(!_docThreadOnly\|\|_docThreadOnly\.has\(i\)\)/, 'only the rows this press asked for wait');
  });
});

describe('f507 (4) — the route reads ONE clause and keeps the keys global', () => {
  test('`only` narrows what is read, and what it skipped is counted and said', () => {
    assert.match(SERVER, /const onlyAsk = Array\.isArray\(req\.body && req\.body\.only\)/);
    assert.match(SERVER, /const pending = onlyAsk \? wanted\.filter\(i => onlyAsk\.has\(i\)\) : wanted;/);
    assert.match(SERVER, /const skipped = wanted\.length - pending\.length;/);
    assert.match(SERVER, /truncated, over, unmatched, partial, failed, skipped, items \};/, 'skipped travels with the edition');
    assert.match(SERVER, /!\(Number\(r\.skipped\) > 0\)/, 'an edition with skipped rows is never served as whole');
  });
  test('the browser sends `only` and remembers which rows it asked for', () => {
    const run = region(CONTRACT, 'docReadRun');
    assert.match(run, /const only=\(opts&&Array\.isArray\(opts\.only\)\)\?opts\.only\.filter\(Number\.isInteger\):null;/);
    assert.match(run, /only\?\{only\}:\{\}/, 'on the body only when asked');
    assert.match(run, /_docThreadOnly=only\?new Set\(only\):null;/);
  });
});

describe('f507 (5) — the funnel, the words, the narrow window', () => {
  test('the Thread rides the sheet\'s own funnel and every tab change', () => {
    assert.match(region(CONTRACT, 'wireDocCanvas'), /docThreadPaint\(c\);/);
    assert.match(CONTRACT, /if\(_wsTab==='docs'\) docThreadPaint\(c\);/, 'applyWsTabs');
    assert.match(CONTRACT, /function docReadPaint\(c\)\{ docThreadPaint\(c\); \}/, 'the name every other caller presses');
    assert.match(CONTRACT, /function docReadOn\(\)\{ return docThreadOn\(\); \}/);
  });
  test('below 1024 it stands down, as the layers before it did', () => {
    assert.match(THREAD, /const docThreadOn = \(\) => docReadFits\(\) && _wsTab === 'docs';/);
    assert.match(region(CONTRACT, 'docThreadPaint'), /card\.hidden=!on;/);
  });
  test('its words are in both books', () => {
    for (const k of ['th_label', 'th_read', 'th_read_at', 'th_of', 'th_prev', 'th_next', 'th_explain', 'th_explain_title', 'th_cost',
      'th_explain_all_one', 'th_explain_all_other', 'th_explain_all_title', 'th_no_ai', 'th_moved', 'th_unrun_scan', 'th_unrun_pb',
      'th_unrun_oblig', 'th_run', 'th_look_n_one', 'th_look_n_other'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ': ', 'gm')) || []).length, 2, k);
  });
  test('the risks card\'s "Add a note" builder is kept with no caller, said out loud', () => {
    assert.match(RISKS, /function riskMarkFootHtml\(c, m\)/, 'kept');
    assert.ok(!ALL_JS.replace(/\/\*[\s\S]*?\*\//g, '').match(/riskMarkFootHtml\(c,\s*m\)|riskMarkFootHtml\(c,m\)/g)
      || !CONTRACT.replace(/\/\*[\s\S]*?\*\//g, '').includes('riskMarkFootHtml('), 'and the Document tab never calls it');
  });
});
