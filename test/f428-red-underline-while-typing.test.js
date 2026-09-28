/* f428 — THE RED UNDERLINE WHILE TYPING
   (Young, 28 Sep 2026: "yes add the red underlines while typing too")

   (1)  spellUnderline marks exactly the words the Save would list — a slip
        of a contract term and an ordinary slip — and nothing else: not a word
        that was on the page, not a new name, not a word inside a struck run.
   (2)  it writes nothing into the box, and turns the browser's own underline
        off on it; with no highlight support it stands down (null) and leaves
        the browser's underline on.
   (3)  both boxes are wired: the clause editor asks it a beat after a key and
        after every mount of the box, with the Save's own `before`
        (ceSpellBefore, shared with ceSaveChecked); the narrow panel's box on
        input with its Save's before and after; closing clears it.
   Behaviour in a browser: their-edit-page-verify 3a3, 6f, 6g, 7.
   Red at the parent (1cc4df5): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CE = R('js/views/clauseeditor.js'), NG = R('js/views/negotiation.js');
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
const WORDING = 'The Provider shall maintain insurance. Late payments incur a charge.';

function page({ highlights = true } = {}){
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  const win = dom.window;
  if (highlights){
    win.eval('window.CSS = { highlights: new Map() }; window.Highlight = class extends Set { constructor(...r){ super(r); } };');
  }
  win.eval(R('js/spell.js'));
  win.spellLoadFrom(R('vendor/en-words-1.txt'));
  return win;
}

test('f428 (1) the underline marks exactly what the Save would list', () => {
  const win = page();
  const d = win.document;
  const box = d.createElement('div');
  box.contentEditable = 'true';
  box.innerHTML = 'Late payments incur a charge. <del>Old recieves</del> The Provdier pays Wanjiru and recieves it.';
  d.body.appendChild(box);
  /* The Save reads the draft with the struck runs taken out (ceBoxHtml);
     so does this. */
  const after = () => { const k = box.cloneNode(true); k.querySelectorAll('del').forEach(x => x.remove()); return k.textContent; };
  const n = win.spellUnderline([box], WORDING, after, { redlineText: WORDING });
  const marked = [...win.CSS.highlights.get(win.SPELL_HL)].map(r => r.toString());
  assert.deepEqual(marked, ['Provdier', 'recieves'], 'the slip of "Provider", the ordinary slip; not the struck run, not a name');
  assert.equal(n, 2);
  const listed = Array.from(win.spellSuspects(WORDING, after(), { redlineText: WORDING }), x => x.word);
  assert.deepEqual(listed, ['Provdier', 'recieves'], 'the Save lists the same words');
});

test('f428 (2) it writes nothing, turns the browser underline off, and stands down without highlights', () => {
  const win = page();
  const box = win.document.createElement('div');
  box.innerHTML = 'The Provdier pays.';
  win.document.body.appendChild(box);
  const html = box.innerHTML;
  win.spellUnderline([box], WORDING, () => box.textContent, null);
  assert.equal(box.innerHTML, html, 'nothing written into the box');
  assert.equal(box.spellcheck, false);
  win.spellUnderlineClear();
  assert.equal(win.CSS.highlights.has(win.SPELL_HL), false, 'clear takes it away');
  const old = page({ highlights: false });
  const b2 = old.document.createElement('div');
  b2.innerHTML = 'The Provdier pays.';
  b2.spellcheck = true;
  old.document.body.appendChild(b2);
  assert.equal(old.spellUnderline([b2], WORDING, () => b2.textContent, null), null);
  assert.equal(b2.spellcheck, true, 'the browser keeps its own underline where HaTi cannot draw one');
});

test('f428 (3) both boxes are wired with their Save\'s own readings', () => {
  assert.match(code(region(CE, 'ceSaveChecked')), /spellSuspects\(ceSpellBefore\(\),/, 'the Save and the underline share one before');
  const mark = code(region(CE, 'ceSpellMark'));
  assert.match(mark, /spellUnderlineSoon : spellUnderline\)\(roots, ceSpellBefore\(\), ceSpellAfter, _ceC\)/);
  assert.match(mark, /if \(!clauseEditorOpen\(\) \|\| !ceIsTyping\(\)\)\{ spellUnderlineClear\(\); return; \}/);
  assert.match(code(region(CE, 'ceMarksMount')), /ceSpellMark\(false\)/, 'drawn again after the marks repaint the box');
  assert.match(code(CE), /ceRenderFoot\(\);\s*ceSpellMark\(true\);/, 'a beat after a keystroke');
  assert.match(code(region(CE, 'rlCloseClauseEditor')), /spellUnderlineClear\(\)/, 'closing clears it');
  assert.match(code(NG), /spellUnderlineSoon\(\[holder, headEl\]\.filter\(Boolean\), spellBefore, spellNow, c\)/,
    'the narrow panel passes its own Save\'s before and after');
});
