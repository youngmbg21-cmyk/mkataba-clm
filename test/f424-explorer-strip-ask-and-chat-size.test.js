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
  assert.match(code(region(CT, 'docXrayPaint')), /docXraySpineHtml\(rows\)/, 'the Document tab is unchanged');
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
  assert.match(IG, /class="ig-dock-title /);
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
