/* f287 — THE BAR SPEAKS THE CONTRACT'S OWN LANGUAGE (Young asked 10 Sep 2026)
   ==========================================================================
   *"When I begin to make written edits with the tools I have been provided,
   they do not match up with the document itself. The bullet points do not work
   together with how the sentences or bullets points in the contract are
   designed. They do not speak the same language."*

   THERE WERE TWO RIVAL WAYS TO INDENT A LINE. A contract in this product is a
   MARKER IN A HANGING GUTTER — 2.1, (a), a bullet — with the wording hanging
   beside it; that is what the paper draws, what the text projection carries and
   what the redline files. The four list tools called `document.execCommand`,
   which builds a browser <ul>/<ol> at its own padding, so a limb typed with the
   bar sat at a different indent from the limb above it and could not be
   continued from.

   AND THERE WERE TWO BARS. Work mode's went through richBarPress; the room's
   own inline editor called execCommand itself, so the same press produced
   different wording depending which editor you were in.

   WHAT IS PROVED HERE: the four acts write the document's own vocabulary, they
   continue the contract's own sequence, a plain sentence moves, a NUMBER is
   never rewritten by a sideways move, the tools remain toggles, and both
   editors reach exactly one set of hands. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* A contenteditable box holding real paragraphs, with a real selection over the
   blocks named — which is the only thing these acts read. */
function stage(win, html){
  const d = win.document;
  const box = d.createElement('div');
  box.setAttribute('contenteditable', 'true');
  box.innerHTML = html;
  d.body.appendChild(box);
  const pick = (a, b) => {
    const r = d.createRange();
    r.setStart(box.children[a], 0);
    r.setEnd(box.children[b == null ? a : b], 0);
    const sel = win.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
  };
  return { box, pick, text: i => box.children[i].textContent,
    cls: i => box.children[i].getAttribute('class') || '' };
}

test('f287 — the bar speaks the contract’s own language', async t => {
  const { win } = await buildWorld();

  /* ---------- (1) A MARKER, NOT A BROWSER LIST ---------- */

  await t.test('Bullets writes a marker into the paragraph, never a <ul>', () => {
    const s = stage(win, '<p>One.</p><p>Two.</p>');
    s.pick(0, 1);
    win.richBarPress('insertUnorderedList');
    assert.equal(s.box.querySelectorAll('ul,li').length, 0,
      'THE REPORTED FAULT: a browser list is a second way to indent a line');
    assert.equal(s.text(0), '•\tOne.');
    assert.equal(s.text(1), '•\tTwo.');
  });

  await t.test('and the marker is CHARACTERS, so the projection carries it', () => {
    const s = stage(win, '<p>One.</p>');
    s.pick(0);
    win.richBarPress('insertUnorderedList');
    /* The redline diffs the text projection. A marker that lived in markup
       would be invisible to it, so the other side would never see the line
       become a bullet. */
    const flat = win.richToText(s.box.innerHTML);
    assert.match(flat, /^•\s+One\.$/m,
      'the projection collapses the tab to a space, exactly as it does for a '
      + 'marker the Word reader wrote — what matters is that the marker is in it');
    const sp = win.redlineSplitMarker(flat.split('\n')[0]);
    assert.equal(sp && sp.marker, '•', 'and the gutter walk reads it straight back');
  });

  await t.test('Numbers continues the contract’s own sequence', () => {
    const s = stage(win, '<p>3.\tThe third.</p><p>A fourth.</p><p>A fifth.</p>');
    s.pick(1, 2);
    win.richBarPress('insertOrderedList');
    assert.equal(s.text(1), '4.\tA fourth.', 'it reads the line above, not "1."');
    assert.equal(s.text(2), '5.\tA fifth.');
  });

  await t.test('a run that has been interrupted starts again at one', () => {
    /* An unmarked paragraph between two lists means the first has ended. A
       number carried across it would cite a clause that is not there. */
    const s = stage(win, '<p>7.\tSeven.</p><p>Some prose.</p><p>Next.</p>');
    s.pick(2);
    win.richBarPress('insertOrderedList');
    assert.equal(s.text(2), '1.\tNext.');
  });

  await t.test('the marker shape follows the step, as legal drafting sets one', () => {
    const s = stage(win, '<p class="hati-lv-1">A limb.</p><p class="hati-lv-2">A sub-limb.</p>');
    s.pick(0); win.richBarPress('insertOrderedList');
    s.pick(1); win.richBarPress('insertOrderedList');
    assert.equal(s.text(0), '(a)\tA limb.', '2.1, then (a)');
    assert.equal(s.text(1), '(i)\tA sub-limb.', 'then (i)');
  });

  await t.test('both tools are still toggles', () => {
    const s = stage(win, '<p>One.</p><p>Two.</p>');
    s.pick(0, 1);
    win.richBarPress('insertUnorderedList');
    win.richBarPress('insertUnorderedList');
    assert.equal(s.text(0), 'One.', 'pressed again it takes the marker off');
    assert.equal(s.text(1), 'Two.');
  });

  /* ---------- (2) THE STEP ---------- */

  await t.test('Indent moves a PLAIN SENTENCE, which is most of what is indented', () => {
    const s = stage(win, '<p>An ordinary sentence.</p>');
    s.pick(0);
    win.richBarPress('indent');
    assert.equal(s.cls(0), 'hati-lv-1', 'the same class the Word reader writes');
    assert.equal(s.text(0), 'An ordinary sentence.', 'and not one character moves');
  });

  await t.test('Outdent brings it back, and level 0 carries no class at all', () => {
    const s = stage(win, '<p class="hati-lv-1">A limb.</p>');
    s.pick(0);
    win.richBarPress('outdent');
    assert.equal(s.cls(0), '', 'the default is silence');
  });

  await t.test('the ladder is bounded at both ends', () => {
    const s = stage(win, '<p>One.</p>');
    s.pick(0);
    for(let i = 0; i < 6; i++) win.richBarPress('indent');
    assert.equal(s.cls(0), 'hati-lv-3');
    for(let i = 0; i < 6; i++) win.richBarPress('outdent');
    assert.equal(s.cls(0), '');
  });

  await t.test('a BULLET follows the step and a NUMBER never does', () => {
    /* The glyph ladder is this product's own reading of how deep a bullet is,
       so a dot left at the wrong rung would say one thing while the step said
       another. A number is a citation — "subject to clause 2.1" — and nothing
       that moves a line sideways may rewrite it. */
    const s = stage(win, '<p>•\tA bullet.</p><p>2.1\tA numbered clause.</p>');
    s.pick(0, 1);
    win.richBarPress('indent');
    assert.equal(s.text(0), '◦\tA bullet.', 'the glyph steps down its own ladder');
    assert.equal(s.text(1), '2.1\tA numbered clause.', 'THE CITATION IS UNTOUCHED');
    assert.equal(s.cls(1), 'hati-lv-1', 'and it still moved');
  });

  /* ---------- (3) WHAT IT DOES NOT TOUCH ---------- */

  await t.test('a marker set in BOLD is read and rewritten as one', () => {
    /* Word writes a clause number bold and HaTi's own reader stores it that
       way, so the split has to walk markup rather than assume a text node. */
    const s = stage(win, '<p><strong>2.1</strong>\tOne.</p>');
    s.pick(0);
    win.richBarPress('insertUnorderedList');
    assert.equal(s.text(0), '•\tOne.', 'the old marker goes, whatever it was wearing');
    assert.equal(s.box.querySelectorAll('strong').length, 0);
  });

  await t.test('the marker is plain text, never welded into the first word', () => {
    const s = stage(win, '<p><strong>Delivery.</strong> The goods.</p>');
    s.pick(0);
    win.richBarPress('insertOrderedList');
    assert.match(s.box.innerHTML, /^<p>1\.\t<strong>Delivery\.<\/strong>/,
      'a number inside a bold run would come back out bold on the next edit');
  });

  await t.test('the rest of the bar is execCommand exactly as it was', () => {
    const src = strip(read('js/richdoc.js'));
    const i = src.indexOf('function richBarPress');
    const fn = src.slice(i, src.indexOf('\n}', i));
    assert.match(fn, /k === 'bold' \|\| k === 'italic'[\s\S]{0,200}execCommand\(k\)/,
      'bold, italic, underline and strike are untouched');
    assert.match(fn, /richBarShape\(k\)[\s\S]{0,160}execCommand\(k\)/,
      'and the four shape tools fall back to what they did where there is no paragraph');
  });

  /* ---------- (4) ONE SET OF HANDS ---------- */

  await t.test('both editors reach the SAME acts', () => {
    /* Work mode's bar went through richBarPress and the room's inline editor
       called execCommand itself, so one press produced two different results.
       A second implementation of one act is how they came to disagree. */
    const nego = strip(read('js/views/negotiation.js'));
    const i = nego.indexOf("data-nego-fmt]').forEach");
    assert.ok(i > 0, 'the room still wires its own bar');
    const wire = nego.slice(i, i + 600);
    assert.match(wire, /richBarPress\(cmd\)/,
      'the room asks the one set of hands');
    const ce = strip(read('js/views/clauseeditor.js'));
    assert.match(ce, /richBarPress\(k\)/, 'and so does work mode');
  });

  await t.test('the reading of what a marker IS has exactly one home', () => {
    const src = strip(read('js/richdoc.js'));
    assert.match(src, /window\.redlineSplitMarker/,
      'the bar asks the product’s own marker reading rather than carrying a copy');
    assert.doesNotMatch(src, /const RL_MARKER|new RegExp\('\^\(\\\\s\*\)'/,
      'and there is no second pattern here that could drift from it');
  });

  await t.test('a host is told which presses move a paragraph’s SHAPE', () => {
    /* Those four owe the paper a repaint — the marker has to land in its
       gutter and the step has to move the line — where a dressing change does
       not. Named once in richdoc, or the two lists come apart. */
    const win2 = win;
    assert.ok(win2.RICH_SHAPE_KEYS && win2.RICH_SHAPE_KEYS.has('indent'));
    assert.ok(win2.RICH_SHAPE_KEYS.has('insertUnorderedList'));
    assert.equal(win2.RICH_SHAPE_KEYS.has('bold'), false);
    const ce = strip(read('js/views/clauseeditor.js'));
    assert.match(ce, /window\.RICH_SHAPE_KEYS && window\.RICH_SHAPE_KEYS\.has\(k\)/,
      'work mode asks that list rather than carrying four names of its own');
    assert.match(ce, /cePullText\(\{ repaint: ceBarMovesShape\(k\) \}\)/,
      'and forces the repaint the sanitiser cannot signal');
  });

  await t.test('it decides nothing and files nothing', () => {
    const src = strip(read('js/richdoc.js'));
    const i = src.indexOf('function richBarShape');
    const fn = src.slice(i, src.indexOf('\n}\n', i));
    for(const bad of ['negoFileChange', 'negoEditClause', 'persist(', 'logAudit', 'changes.push'])
      assert.ok(!fn.includes(bad), 'the bar is a set of hands, not a way in: ' + bad);
  });
});
