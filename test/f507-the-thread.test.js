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
    /* RE-POINTED 5 Oct 2026: the line opens the nearest clause SHOWN (a section
       title, or a clause the colour filter hides, opens the one it belongs with),
       and only while the clauses are on screen (the Drawer). */
    assert.match(arm, /if\(c&&docThreadLive\(\)\) docThreadOpen\(c,docThreadLineRow\(\)\)/);
    assert.match(region(CONTRACT, 'docThreadLineRow'), /docThreadNearest\(rows, docThreadAtLine\(\)\)/);
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
    assert.match(settle, /held>=0\?held:docThreadLineRow\(\)/, 'the line wins unless the row is held');
  });
  test('the risk door lands on the worst-marked clause and glides there once', () => {
    assert.match(region(CONTRACT, 'riskViewOpen'), /_docThreadWant='risk'/);
    const paint = region(CONTRACT, 'docThreadPaint');
    assert.match(paint, /const worst=docThreadWorst\(rows\);/, 'worst first is the risk list\'s own order');
    assert.match(CONTRACT, /const docThreadWorst = rows => XR_GRADES\.find\(g=>\(rows\|\|\[\]\)\.some\(x=>!docThreadIsSec\(x\)&&x\.tone===g\)\)/);
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
  test('or PLAIN — ONE clause, with "All N clauses in plain English" beside it and the cost said', () => {
    const ex = region(CONTRACT, 'docThreadExplainHtml');
    assert.match(ex, /data-th-explain="\$\{i\}"/);
    assert.match(ex, /data-th-explain-all/);
    assert.match(ex, /th_cost/, 'the cost is by the button');
    assert.match(ex, /docThreadNoAi\(\)/, 'not connected is known before the press, greyed with why');
    const wire = region(CONTRACT, 'docThreadWire');
    assert.match(wire, /docReadRun\(cur,\{only:\[i\],force:ex\.hasAttribute\('data-th-force'\)\}\)/, 'one row to the route');
    assert.match(wire, /docReadRun\(cur,\{\}\)/, 'All N is the whole contract, as before');
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
  test('below 1024 it stands down, as the layers before it did — and while the drawer is shut', () => {
    assert.match(THREAD, /const docThreadOn = \(\) => docReadFits\(\) && _wsTab === 'docs';/);
    const paint = region(CONTRACT, 'docThreadPaint');
    assert.match(paint, /const up=on&&docThreadShowsClauses\(c\);/, 'RE-POINTED 5 Oct 2026: on screen = may be drawn AND the clauses are up');
    assert.match(paint, /card\.hidden=!up;/);
  });
  test('its words are in both books', () => {
    /* th_explain, th_explain_title and th_explain_all_* are INERT since Plain
       (5 Oct 2026) — kept in both books, drawn nowhere. */
    for (const k of ['th_label', 'th_read', 'th_read_at', 'th_of', 'th_prev', 'th_next', 'th_explain', 'th_explain_title', 'th_cost',
      'th_explain_all_one', 'th_explain_all_other', 'th_explain_all_title', 'th_no_ai', 'th_moved', 'th_unrun_scan', 'th_unrun_pb',
      'th_unrun_oblig', 'th_run', 'th_look_n_one', 'th_look_n_other',
      'th_plain', 'th_plain_title', 'th_plain_all_one', 'th_plain_all_other', 'th_plain_all_title', 'th_cannot_state', 'th_cannot_head',
      'th_cannot_say', 'th_clauses', 'th_door_title', 'th_close', 'th_filter_label', 'th_f_all', 'th_f_ruby', 'th_f_ruby_say',
      'th_f_amber', 'th_f_amber_say', 'th_f_steel', 'th_f_steel_say', 'th_f_zero', 'th_f_empty', 'th_of_shown'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ': ', 'gm')) || []).length, 2, k);
  });
  test('the risks card\'s "Add a note" builder is kept with no caller, said out loud', () => {
    assert.match(RISKS, /function riskMarkFootHtml\(c, m\)/, 'kept');
    assert.ok(!ALL_JS.replace(/\/\*[\s\S]*?\*\//g, '').match(/riskMarkFootHtml\(c,\s*m\)|riskMarkFootHtml\(c,m\)/g)
      || !CONTRACT.replace(/\/\*[\s\S]*?\*\//g, '').includes('riskMarkFootHtml('), 'and the Document tab never calls it');
  });
});

/* ============================================================================
   THE DRAWER, THE COLOUR FILTER, PLAIN (Young picked "Drawer", 5 Oct 2026)
   ============================================================================
   "when you land to documents page, form and links is the landing panel but
   you click on a button above which then brings you the clauses." The Thread
   above is now a DRAWER over Form & links; its open row grows; a section title
   is a label; a filter shows the clauses by the colour of their worst mark;
   and Plain never ends in silence. thread-drawer-verify.js drives the page;
   these claims hold the shape. Every one was RED at unmodified main. */
describe('f507 (6) — the Drawer: Form & links lands, the Clauses door brings the thread over it', () => {
  test('the form, the provenance, the links and the rounds keep their own height — nothing flexes them down', () => {
    const col = CONTRACT.slice(CONTRACT.indexOf('<div data-doc-col="docs"'), CONTRACT.indexOf('<div id="nego-section"'));
    assert.match(col, /^<div data-doc-col="docs" style="display:flex;flex-direction:column;gap:var\(--s-3\)">/,
      'the column is not squeezed into the window (the form was 136px of 1107)');
    assert.match(col, /<div id="doc-prov" class="empty:hidden">\$\{templateProvenanceHtml\(c\)\}<\/div>/, 'the provenance is a card the panel can be asked about');
    assert.match(INDEX, /#doc-right \[data-doc-col="docs"\] > \*\{ flex:none; \}/, 'no card shrinks below what it holds');
    assert.match(INDEX, /#doc-right\.is-clauses \[data-doc-col="docs"\] > :not\(#doc-thread\)\{ display:none; \}/, 'while the clauses are up they are the column');
  });
  test('the Clauses door leads the tab row\'s slot, drawn shut, and only docThreadPaint says whether it shows', () => {
    const end = region(CONTRACT, 'wsTabRowEndHtml');
    assert.match(end, /id="ws-th-door" class="ui-btn ws-th-door" hidden aria-expanded="false" aria-controls="doc-thread"/);
    assert.match(end, /return clauses\+step\+focus\+door;/);
    assert.match(region(CONTRACT, 'wsPaintTabRowEnd'), /#ws-th-door'\)\?\.addEventListener\('click',\(\)=>docThreadDrawerSet\(c,!docThreadDrawerShowing\(\),\{from:'door'\}\)\)/);
    const door = region(CONTRACT, 'docThreadDoorPaint');
    assert.match(door, /const show=docThreadOn\(\)&&has&&\(rows\|\|\[\]\)\.length>0;/, 'only where there is a panel to cover and a clause to show');
    assert.match(door, /docThreadSumHtml\(rows,'ws-th-door-sum'\)/, 'the same "N to look at" as the drawer\'s head');
  });
  test('ONE answer to "are the clauses on screen", decided once per landing', () => {
    const sc = region(CONTRACT, 'docThreadShowsClauses');
    assert.match(sc, /else _docThreadDrawer=!has;/, 'a landing opens on Form & links — or on the clauses where there is nothing else');
    assert.match(sc, /if\(_docThreadWant==='risk'\) _docThreadDrawer=true;/, 'a risk door opens it');
    assert.match(sc, /return !has\|\|!!_docThreadDrawer;/);
    assert.match(CONTRACT, /if\(_wsTab==='docs'&&_wsTabApplied!=='docs'\) docThreadLanding\(\);/, 'arriving on the tab is a landing');
    assert.match(read('js/app.js'), /\(view==='workspace'\|\|view==='doc'\)&&state\.view!==view&&typeof window!=='undefined'&&window\.docThreadLanding/,
      'and so is arriving in the room from another page');
    assert.match(read('js/core.js'), /window\.docThreadPanelMoved\) docThreadPanelMoved\(c\)/, 'the links card says when it fills');
  });
  test('× and Escape go back; Escape is heard first, and never past a dialog or from a box', () => {
    assert.match(region(CONTRACT, 'docThreadTopHtml'), /const close=has\?`<button type="button" class="ui-btn ui-btn-icon doc-th-x" data-th-close/,
      'no × where the clauses ARE the panel');
    assert.match(region(CONTRACT, 'docThreadWire'), /if\(t\.closest\('\[data-th-close\]'\)\)\{ docThreadDrawerSet\(cur,false\); return; \}/);
    const at = THREAD.indexOf("if(e.key!=='Escape'||e.defaultPrevented||!_docThreadUp");
    assert.ok(at > 0, 'the drawer hears Escape');
    const esc = THREAD.slice(at, THREAD.indexOf('docThreadDrawerSet(c,false);', at) + 40);
    assert.match(esc, /modal-root/, 'never past a dialog');
    assert.match(esc, /selectMenuShowing\(\)/, 'nor an open menu');
    assert.match(esc, /INPUT\|TEXTAREA\|SELECT/, 'nor from a box');
    assert.match(esc, /e\.stopImmediatePropagation\(\);\n\s*docThreadDrawerSet\(c,false\);/, 'one key, one act: focus mode does not also leave');
  });
  test('a refresh puts back the drawer and the colours', () => {
    assert.match(CONTRACT, /function roomPlace\(\)\{ return state\.activeId \? Object\.assign\(\{ tab:_wsTab \}, docThreadPlace\(\)\) : null; \}/);
    assert.match(region(CONTRACT, 'roomPlacePut'), /docThreadPlacePut\(p\);/);
    assert.match(region(CONTRACT, 'docThreadShowsClauses'), /if\(k&&String\(k\.id\)===id\)\{ _docThreadDrawer=!!k\.clauses; _docThreadTones=docThreadTonesClean\(k\.tones\); \}/);
  });
});

describe('f507 (7) — the colour filter', () => {
  test('All, then Red · Amber · Blue, each counting the clauses whose WORST mark is its colour', () => {
    const top = region(CONTRACT, 'docThreadTopHtml');
    assert.match(top, /const n=clauses\.filter\(x=>x\.tone===g\)\.length;/);
    assert.match(top, /data-th-tone=""/, 'All lets every clause through');
    assert.match(top, /const dead=!n&&!on;/, 'a colour nobody carries is greyed — unless it is pressed');
    assert.match(top, /aria-disabled="true"/);
    assert.match(top, /i18t\('th_f_zero',\{c:name\.toLowerCase\(\)\}\)/, 'and says why');
    assert.match(CONTRACT, /const DOC_THREAD_TONE_KEYS = \{ ruby:\['th_f_ruby','th_f_ruby_say'\], amber:\['th_f_amber','th_f_amber_say'\], steel:\['th_f_steel','th_f_steel_say'\] \};/);
  });
  test('any together; the steps and the paper\'s line go only through what it shows', () => {
    assert.match(region(CONTRACT, 'docThreadFilterSet'), /_docThreadTones\.includes\(tone\)\n?\s*\? _docThreadTones\.filter\(g=>g!==tone\) : _docThreadTones\.concat\(\[tone\]\)/);
    const wire = region(CONTRACT, 'docThreadWire');
    assert.match(wire, /const vis=docThreadVisible\(/, '‹ › step through the shown clauses');
    assert.match(wire, /!docThreadShown\(rows\[at\]\)\) return;/, 'a press on a hidden clause in the paper opens nothing');
    assert.match(region(CONTRACT, 'docThreadBodyHtml'), /i18t\('th_of_shown',\{i:k,n:vis\.length\}\)/, '"k of n shown"');
    assert.match(region(CONTRACT, 'docThreadFilterSet'), /if\(go>=0\) docThreadGoTo\(cur,go\);/, 'a hidden open clause gives way to the next shown, and the paper glides there');
  });
});

describe('f507 (8) — Plain always turns the clause into plain English, and never ends in silence', () => {
  test('the button says Plain, and All N clauses in plain English sits beside it', () => {
    const ex = region(CONTRACT, 'docThreadExplainHtml');
    assert.match(ex, /i18t\('th_plain'\)/);
    assert.match(ex, /i18tn\('th_plain_all',n,\{n\}\)/);
    assert.ok(!/i18t\('th_explain'\)|th_explain_all'/.test(THREAD), 'the old words are drawn nowhere');
  });
  test('the route: every clause gets a reading; an empty one is never landed, kept or served', () => {
    assert.match(SERVER, /'EVERY CLAUSE GETS A READING',/);
    assert.ok(!/Return an EMPTY reading for those/.test(SERVER), 'the rule that asked for empties is gone');
    assert.match(SERVER, /if \(!plain && list\[i\]\.kind !== 'section'\) \{ refuse\(r, want, i, true\); return; \}/, 'not landed — asked again');
    assert.match(SERVER, /const have = readEmptyClauseDrop\(readRowsGet\(id, hashes\), hashes, list\);/, 'a stored empty one is not an answer');
    assert.match(SERVER, /&& !readEditionHasEmptyClause\(r\.items\)\) \{/, 'nor is an edition holding one');
    assert.match(SERVER, /json LIKE '\{"plain":""%'/, 'and a real reading heals the stored empty row');
  });
  test('a clause still without a reading after the press says so on its row, with Plain to ask again', () => {
    const wire = region(CONTRACT, 'docThreadWire');
    assert.match(wire, /docThreadCannotMark\(now,\[i\]\);/);
    assert.match(region(CONTRACT, 'docThreadStates'), /i18t\('th_cannot_state'\)/);
    assert.match(region(CONTRACT, 'docThreadBodyHtml'), /if\(docThreadCannotOf\(c\)\.has\(i\)\)\n\s*parts\.push\(`<p class="doc-th-cannot">/);
    assert.match(region(CONTRACT, 'docThreadCannotMark'), /if\(cache\.plain\.has\(x\.el\)\) rec\.set\.delete\(i\); else rec\.set\.add\(i\);/);
  });
});

describe('f507 (9) — a section title is a label; the open row grows', () => {
  test('a section row draws no bead and no button', () => {
    const row = region(CONTRACT, 'docThreadRowHtml');
    assert.match(row, /if\(docThreadIsSec\(x\)\) return `<div class="doc-th-sec" data-th-row="\$\{i\}" data-th-sec role="listitem">/);
    assert.match(CONTRACT, /const docThreadShown = x => !!x && !docThreadIsSec\(x\)/, 'and is never opened');
  });
  test('the list is the one scroller', () => {
    assert.match(INDEX, /\.doc-th-rows\{ position:relative; flex:1 1 auto; min-height:0; overflow-y:auto;/);
    assert.ok(!/--th-max/.test(INDEX + THREAD));
  });
});

describe('f507 (10) — the pieces, in a browser world', () => {
  const { buildWorld } = require('./world');
  let win;
  const card = (id, html) => { const d = win.document; let el = d.getElementById(id);
    if (!el) { el = d.createElement('div'); el.id = id; d.body.appendChild(el); } el.innerHTML = html; return el; };
  test('Form & links has content only where a card does, or the record knows of rounds', () => {
    win = buildWorld({ contractView: true }).win;
    ['tplform-section', 'doc-prov', 'shares-section', 'nego-section'].forEach(id => card(id, ''));
    assert.equal(win.docPanelHas({ id: 'P1', rounds: [] }), false, 'nothing at all');
    assert.equal(win.docPanelHas({ id: 'P1', rounds: [{ n: 1 }] }), true, 'a round');
    card('doc-prov', '<div>Created from WH v1</div>');
    assert.equal(win.docPanelHas({ id: 'P1', rounds: [] }), true, 'a card with something in it');
  });
  test('a landing opens on Form & links where there is one, on the clauses where there is not', () => {
    card('doc-prov', '<div>Created from WH v1</div>');
    win.docThreadLanding();
    assert.equal(win.docThreadShowsClauses({ id: 'P2', rounds: [] }), false, 'Form & links');
    card('doc-prov', '');
    win.docThreadLanding();
    assert.equal(win.docThreadShowsClauses({ id: 'P3', rounds: [] }), true, 'the clauses ARE the panel');
  });
  test('the nearest shown clause skips a section title', () => {
    const rows = [{ row: { kind: 'section' } }, { row: { kind: 'clause' }, tone: '' }, { row: { kind: 'section' } }, { row: { kind: 'clause' }, tone: 'ruby' }];
    assert.equal(win.docThreadNearest(rows, 0), 1, 'a title at the top opens the clause under it');
    assert.equal(win.docThreadNearest(rows, 2), 1, 'a title further down keeps the clause before it');
    assert.deepEqual(Array.from(win.docThreadVisible(rows)), [1, 3]);
  });
});
