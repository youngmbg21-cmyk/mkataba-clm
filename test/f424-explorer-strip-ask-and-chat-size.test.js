/* f424 — EXPLORER'S STRIP ASKS, AND THE CHATS' TEXT IS THE BODY SIZE
   (Young, 28 Sep 2026: "implement ASK but I also want to state that the font
   in both copilot chatbots seem a bit big")

   (1)  the strip's builder draws clause numbers only when asked; Explorer asks,
        the Document tab's Risk View does not (its strip is unchanged).
   (2)  a press fills the question box and never sends: the press path calls
        no asking function, and it leaves a question the reader typed alone.
   (3)  the question names the clause and its worst flag, in words.
   (4)  both chats' bubbles carry one class the product sizes at --t-body on
        the desktop, and both question boxes too; the phone keeps its sizes.
   (5)  every new word is in both books.
   Behaviour in a browser: analyze-on-the-graph-verify 2s1–2s8.
   Red at the parent (e3684de): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js'), IG = R('js/views/intelligence.js'), AI = R('js/ai.js'), HTML = R('index.html'), I18N = R('js/i18n.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}

test('f424 (1) numbers on the blocks are Explorer\'s, asked for; the Document tab calls the builder bare', () => {
  const b = code(region(CT, 'docXraySpineHtml'));
  assert.match(b, /o\.numbers&&x\.cite/);
  assert.match(b, /doc-xr-num/);
  /* 5 Oct 2026 (the Thread): the Document tab draws no strand at all. */
  assert.doesNotMatch(code(region(CT, 'docThreadPaint')), /docXraySpineHtml/, 'the Document tab draws no strand');
  assert.match(code(region(IG, 'igStrandPaint')), /docXraySpineHtml\(rows,\{ numbers:true \}\)/);
});

test('f424 (2) a press fills the box and asks nothing, and a typed question is kept', () => {
  const p = code(region(IG, 'igStrandPress'));
  assert.doesNotMatch(p, /intelAsk\(|igPaperAsk\(|\bapi\(|fetch\(/, 'nothing is sent from a press');
  assert.match(p, /if\(had\.trim\(\) && had!==_igStrandLastAsk\) return;/);
  assert.match(p, /inp\.value=q;/);
});

test('f424 (3) the question names the clause and its worst flag', () => {
  const q = code(region(IG, 'igStrandQuestion'));
  assert.match(q, /docXrayLabel\(row\)/);
  assert.match(q, /igStrandTopMark\(row\)/);
  assert.match(code(region(IG, 'igStrandTopMark')), /IG_GRADE_RANK/);
  assert.match(IG, /const IG_GRADE_RANK=\['ruby','amber','steel'\];/);
});

test('f424 (4) both chats\' text is the body size on the desktop, the phone untouched', () => {
  assert.equal((AI.match(/class="ai-bub /g) || []).length, 3, 'welcome, question, answer');
  assert.equal((IG.match(/class="ai-bub /g) || []).length, 2, 'question, answer');
  /* AND EXPLORER'S GREETING, TITLE AND CARD NAME (Young, same day: "you have
     not decreased the font size in the copilot in the explorer page"). */
  assert.match(IG, /class="ig-welcome /);
  /* the title was the lit symbol's name under Header Icons (8 Oct 2026); since
     Lifted the same day every symbol carries its word, small, under it */
  assert.match(R('js/paperdesk.js'), /<span class="pd-tab-w">/);
  assert.match(IG, /class="ig-card-name /);
  const rule = /@media \(min-width:768px\)\{\s*\.ai-msg \.ai-bub,#ig-dock \.ig-welcome\{font-size:var\(--t-body\);line-height:1\.55\}\s*#ig-dock \.ig-dock-title,#ig-dock \.ig-card-name\{font-size:var\(--t-body\)\}\s*#ai-panel #ai-input,#ig-dock #igd-input\{font-size:var\(--t-body\)\}\s*\}/;
  assert.match(HTML, rule);
  assert.doesNotMatch(HTML.match(rule)[0], /!important/);
});

test('f424 (5) every new word is in both books', () => {
  for (const k of ['int_strip_q', 'int_strip_q_bare', 'int_strip_go', 'int_strip_asked', 'int_strip_more_one',
    'int_strip_more_other', 'int_grade_ruby', 'int_grade_amber', 'int_grade_steel'])
    assert.equal((I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length, 2, k);
});

/* ---------------------------------------------------------------- (6)
   ROMAN AND LETTERED NUMBERS (Young, 28 Sep 2026: "the clause numbers when in
   roman numeral numbers they do not appear in the dna strand so review the
   logic because contracts may have alphabetic or roman numeral numbers").
   Walked on a real sheet, through the one reading every surface shares. */
test('f424 (6) a Roman or lettered clause carries its number onto its block; look-alikes do not; X.1 rides in its article', () => {
  const { buildWorld } = require('./world');
  const win = buildWorld({ contractView: true }).win; const d = win.document;
  const root = d.createElement('div'); d.body.appendChild(root);
  root.innerHTML = '<h2>ARTICLE V: STANDARD OF CARE</h2><p>The Operator shall exercise reasonable care in storing Goods at all times.</p>'
    + '<h2>PART A: Definitions</h2><p>Words used in this Agreement have the meanings given here.</p>'
    + '<h2>IV. Term</h2><p>This Agreement runs for twelve months from the start date.</p>'
    + '<p>X.1 Definition of Confidential Information. Means any data disclosed.</p>'
    + '<h2>A Note on Terms</h2><p>Nothing here is numbered.</p>'
    + '<p>I am a sentence about U.S. dollars paid monthly.</p>';
  const c = { id: 'MK-R', name: 'Roman' };
  const rows = win.docXrayRows(c, root);
  assert.deepEqual(Array.from(rows, r => String(r.cite)), ['V', 'A', 'IV', ''], JSON.stringify(rows.map(r => [r.cite, r.name])));
  assert.ok(/Definition of Confidential Information/.test(rows[2].row.text), 'a Roman sub-clause stays inside its article, as before');
  rows.forEach(r => { r.tone = 'amber'; });   /* every clause on the map, whatever this stage's scan placed */
  const html = win.docXraySpineHtml(rows, { numbers: true });
  for (const n of ['V', 'A', 'IV'])
    assert.ok(html.includes(`<span class="doc-xr-num">${n}</span>`), n + ' is drawn on its block');
  assert.ok(!/doc-xr-num">(I|U)</.test(html), '"I am…" and "U.S." are never numbers');
});

/* ---------------------------------------------------------------- (7)
   EXPLORER'S ANSWERS ARE FORMATTED, AND ITS BOX WRAPS (Young, 28 Sep 2026).
   Behaviour in a browser: analyze-on-the-graph-verify 0a–0e. */
test('f424 (7) the graph answer goes through the side panel\'s renderer, the dock has its styles, and the box is a chat-field', () => {
  const g = code(region(IG, 'intelGraphApply'));
  assert.match(g, /aiRichText\(own\)/);
  assert.doesNotMatch(g, /'<br>'\+igEsc\(own\)/, 'the raw-escaped sentence is gone');
  assert.match(HTML, /#igd-feed ul\.ai-list\{list-style:disc\}/);
  assert.match(HTML, /#igd-feed \.ai-p\{margin:0 0 \.5em\}/);
  assert.match(IG, /<textarea id="igd-input" rows="1"[^>]*class="chat-field /);
  assert.doesNotMatch(IG, /<input id="igd-input"/);
  assert.match(code(region(IG, 'renderIntelDock')), /chatFieldSubmits\(e\)/);
  assert.match(code(region(IG, 'igStrandPress')), /chatFieldGrow\(inp\)/, 'a filled question opens the box to fit');
});
