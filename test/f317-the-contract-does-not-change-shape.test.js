/* ============================================================
   f317 — THE CONTRACT KEEPS ITS SHAPE, THE MARKER COMES INSIDE
          THE PAGE, AND THE WAY BACK IS A SIGN
   ============================================================
   Three reports off one screen, Young, 15 Sep 2026:

     "The comments numbers should be on the edge but inside the contract page.
      They should be similar to image 2 also in coloring where the number is
      dark and the ring background is light colored."

     "Image 3 and 4, where is says contract and contract workspace, there
      should be a back button but in sign format not words. The should take you
      to the same page as when you press on the contract and contract work
      space. The button should similar to image 5 with a blue outline like
      other buttons."

     "when you press the pencil button and you move to the editor page, the
      fonts of the contract change in some case they become bold. The contract
      should never change from one screen to another. Keep the contract shape
      as from screen to the next so please audit why the changes are happening
      and fix."

   THE THIRD IS ONE CAUSE WITH SEVERAL FACES, and it is worth stating plainly
   because the source looks correct either way: the redline's own block
   renderer takes a list of OPS — plain text plus a verdict per run — and
   rebuilds each line from that text. Text carries no bold, no italic, no
   level; so every mark the drafter put INSIDE a line was thrown away the
   moment a clause was drawn through ops rather than as markup, and the shape
   was re-GUESSED from the characters (a hanging marker read off the wording,
   a level read off the marker's depth). On a clause with no change on it the
   two screens agreed by luck; on a clause carrying one they did not, and which
   screen drew which way depended on which renderer the page reached for.

   THE FIX IS A MAP, NOT A RE-DERIVATION: the clause's own stored markup is
   read once into line → {tag, shape classes, inner html}, handed to the
   renderer, and a line nothing touched is drawn back out of that markup
   VERBATIM. A line that moved is still rebuilt from ops, because its words
   are not the drafter's any more — but its tag and its step are.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const RL = read('js/redline.js');
const NEGO = read('js/views/negotiation.js');
const CSS = read('js/views/negotiation-css.js');
const CONTRACT = read('js/views/contract.js');
const CE = read('js/views/clauseeditor.js');
const HTML = read('index.html');

describe('f317 (1) THE CONTRACT KEEPS ITS SHAPE FROM SCREEN TO SCREEN', () => {
  test('there is ONE reading of a clause\'s own shape, and it is published', () => {
    assert.match(RL, /function redlineShapeMap\(html\)/,
      'the map is a named function, not a shape re-derived at each call site');
    assert.match(RL, /redlineOpsBlocksHtml,\s*redlineShapeMap,/,
      'and it is on the export list — an unpublished name is unreachable from another module');
  });

  test('it keeps the TAG, the STEP and the MARKUP, and nothing else', () => {
    const body = RL.slice(RL.indexOf('function redlineShapeMap'),
      RL.indexOf('function redlineShapeMap') + 1400);
    assert.match(body, /tag:\s*el\.tagName\.toLowerCase\(\)/, 'the drafter\'s own tag');
    assert.match(body, /_RL_SHAPE_KEEP\.has\(c\)/,
      'only the shape vocabulary survives — a mark class is the renderer\'s to write');
    assert.match(body, /html:\s*el\.innerHTML/,
      'and the line\'s own markup, which is where the bold and the italic live');
  });

  test('the shape vocabulary is the FILE READERS\' own, and holds no mark class', () => {
    const set = RL.slice(RL.indexOf('_RL_SHAPE_KEEP'), RL.indexOf('_RL_SHAPE_KEEP') + 240);
    for (const k of ['rl-hang', 'hati-lv-1', 'hati-lv-2', 'hati-lv-3', 'hati-tight', 'hati-pb', 'hati-toc'])
      assert.ok(set.includes(`'${k}'`), `${k} is what the Word and PDF readers write, so it is shape`);
    for (const k of ['nego-ins', 'nego-del', 'rl-us', 'rl-them', 'rl-marker'])
      assert.ok(!set.includes(`'${k}'`), `${k} says what a renderer decided, never what the file said`);
  });

  test('a line said twice keeps the FIRST — a map is not a tally', () => {
    assert.match(RL, /if \(!key \|\| map\.has\(key\)\) return;/,
      'two identical lines cannot argue about which shape they had');
  });

  test('the renderer only honours a real map, and an absent one changes nothing', () => {
    assert.match(RL, /const shape = \(opts\.shape && typeof opts\.shape\.get === 'function'\) \? opts\.shape : null;/,
      'anything that is not a Map is not a shape — every older caller is byte-identical');
  });

  test('an untouched line is drawn from the drafter\'s own markup', () => {
    assert.match(RL, /if \(src && !opts\.attributed && group\.every\(o => o\.op === 'keep'\)\)/,
      'nothing moved, nobody is attributed: print what the file said');
    assert.match(RL, /return `<\$\{srcTag \|\| tag\} class="\$\{cls\}"\$\{bAttr\}>\$\{src\.html\}<\/\$\{srcTag \|\| tag\}>`/,
      'verbatim — re-rendering it from characters is the whole fault');
  });

  test('the tag is the source\'s, bounded to what a contract line may be', () => {
    assert.match(RL, /src && \/\^\(p\|h1\|h2\|h3\|h4\|li\)\$\/\.test\(src\.tag\)/,
      'a paragraph, a heading or a list item — never whatever markup happened to be there');
  });

  test('there is ONE reading of a clause\'s shape on the pages too, and it is published', () => {
    assert.match(NEGO, /function rlClauseShape\(cl\)\{/,
      'module scope, not one closure per surface — that is how five papers stay in step');
    assert.match(NEGO, /redlineShapeMap\(rlHangRichHtml\(/,
      'read off the SAME markup the clean reading draws, so the two cannot disagree');
    assert.match(NEGO, /rlSideWho, rlClauseShape,/,
      'published, because the clause editor reads it by name through window');
  });

  test('EVERY paper that draws the contract asks it — and a card is not a paper', () => {
    /* PIN THE RELATION: each of the five is named by the call that carries the
       shape, so a sixth paper added without one is the thing that goes red. */
    assert.match(NEGO, /redlineOpsBlocksHtml\(ops, \{ title: tip, who: whoM, shape \}\)/,
      'the negotiate page\'s marked reading');
    assert.match(NEGO, /rlLayeredHtml\(c, ch, side, \{ title: tip, shape: rlClauseShape\(cl\) \}\)/,
      'and its stacked reading, through rlLayeredHtml\'s own opts');
    assert.match(NEGO, /who: rlSideWho\(frontCh, side\), shape: fShape/, 'the front-matter region');
    assert.match(NEGO, /redlineOpsBlocksHtml\(ops, \{ who: rlSideWho\(ch, 'owner'\), shape \}\)/,
      'the contract room\'s own canvas');
    assert.match(CE, /function ceShapeMap\(\)\{/, 'and the clause editor, which is the page the report named');
    assert.match(CE, /redlineOpsBlocksHtml\(ops, \{ who: 'us', shape: ceShapeMap\(\) \}\)/,
      'its draft against what stands');
    assert.match(CE, /redlineOpsBlocksHtml\(ops, \{ shape: ceShapeMap\(\) \}\)/,
      'and its layered reading of a counter');
    assert.match(NEGO, /const redlineBody = \(ch, cl\) =>/,
      'the body builder is given the clause, because the shape belongs to the clause');
    assert.match(NEGO, /const clean = redlineBody\(ch, cl\);/, 'and the caller hands it over');
  });

  /* ---- THE MEASUREMENT. A claim about markup is a description until the
     renderer is actually run over a real clause. ---- */
  test('MEASURED: bold, italic and the step survive a clause that carries a mark', () => {
    const b = buildWorld({ contracts: ['MK-1'] });
    const w = b.win;
    const before = '<p><strong>3.1 Availability.</strong> The Supplier shall keep the Platform '
      + 'available for <em>ninety-nine per cent</em> of each month.</p>'
      + '<p class="hati-lv-1">3.2 The Supplier responds within four (4) hours.</p>';
    const oldText = w.richToText ? w.richToText(before) : '';
    const newText = oldText.replace('four (4) hours', 'two (2) hours');
    const ops = w.redlineOps(oldText, newText);
    const shape = w.redlineShapeMap(before);
    assert.ok(shape && shape.size >= 2, 'the map read both lines');

    const without = w.redlineOpsBlocksHtml(ops, {});
    const withShape = w.redlineOpsBlocksHtml(ops, { shape });

    assert.ok(!/<strong>/.test(without) && !/<em>/.test(without),
      'the parent\'s picture: rebuilt from characters, the drafter\'s marks are gone');
    assert.ok(/<strong>/.test(withShape), 'the bold lead-in is still bold');
    assert.ok(/<em>/.test(withShape), 'and the italic is still italic');
    assert.ok(/hati-lv-1/.test(withShape), 'and the second line keeps the step the file gave it');
    assert.match(withShape, /<del[^>]*>four \(4\)<\/del><ins[^>]*>two \(2\)<\/ins>/,
      'and the line that really moved is still drawn as a change');
    assert.ok(!/hati-lv-1/.test(without),
      'the parent re-guessed the step from the marker and lost the one the file gave');
  });

  test('MEASURED: a clause nothing touched comes back byte-identical in its words', () => {
    const b = buildWorld({ contracts: ['MK-1'] });
    const w = b.win;
    const body = '<p><strong>4.1 Fees.</strong> The Buyer shall pay within thirty (30) days.</p>';
    const t = w.richToText(body);
    const html = w.redlineOpsBlocksHtml(w.redlineOps(t, t), { shape: w.redlineShapeMap(body) });
    assert.ok(/<strong>4\.1 Fees\.<\/strong>/.test(html),
      'the lead-in the drafter set in bold is the lead-in the reader sees');
  });
});

describe('f317 (2) THE COMMENT NUMBER IS INSIDE THE PAGE, DARK ON LIGHT', () => {
  test('the marker is placed against the PAPER\'S OWN padding, never a flat number', () => {
    assert.match(CSS, /\.rl-clause \.rl-note-mk\{position:absolute;left:calc\(2px - var\(--rl-paper-pad,56px\)\)/,
      'a relation: the sheet\'s inset decides where the marker sits');
    assert.ok(!/\.rl-clause \.rl-note-mk\{position:absolute;left:-48px/.test(CSS),
      'the flat -48px was right at one rung of padding and outside the page at every other');
  });

  test('every paper rung states its padding as the token as well', () => {
    const pads = (CSS.match(/--rl-paper-pad:\s*\d+px/g) || []);
    assert.ok(pads.length >= 5,
      `the sheet changes inset with the window — every rung has to say so (${pads.length} found)`);
    /* The two the marker would fall off if they were missed. */
    assert.match(CSS, /--rl-paper-pad:20px/, 'the narrow window\'s working pane');
    assert.match(CSS, /--rl-paper-pad:26px/, 'and the tightest rung of all');
  });

  test('the number is dark and the ring is light — the owner\'s image 2', () => {
    const rule = CSS.slice(CSS.indexOf('.rl-clause .rl-note-mk{'),
      CSS.indexOf('.rl-clause .rl-note-mk.out'));
    assert.match(rule, /background:var\(--st-steel-bg\)/, 'a light ring');
    assert.match(rule, /color:var\(--accent-ink\)/, 'and a dark number in it');
    assert.ok(!/background:var\(--accent-fill\);color:#fff/.test(rule),
      'the parent filled the disc and printed the number white — the opposite');
  });

  test('a moved anchor keeps the same shape in amber, not a different one', () => {
    assert.match(CSS, /\.rl-note-mk\.out\{background:var\(--st-amber-bg\);color:var\(--st-amber-fg\)/,
      'light ground, dark ink, amber — one idea, two states');
  });
});

describe('f317 (3) THE WAY BACK IS A SIGN, AND IT IS THE SAME DOOR', () => {
  test('#ws-back is still ONE button with one id, one handler, two destinations', () => {
    assert.equal((CONTRACT.match(/id="ws-back"/g) || []).length, 1,
      'restyled, never replaced — the third time this control has changed face');
    assert.match(CONTRACT, /\$\{backC \? ' data-back="contract"' : ''\}/,
      'the negotiation still lands on the room, the room on the list');
  });

  test('it carries the sign and no word', () => {
    const nav = CONTRACT.slice(CONTRACT.indexOf('<nav class="room-crumb"'),
      CONTRACT.indexOf('</nav>', CONTRACT.indexOf('<nav class="room-crumb"')));
    assert.match(nav, /class="room-crumb-back"/, 'it has a class of its own to be dressed by');
    assert.match(nav, /<use href="#i-left"\/>/, 'the sprite\'s own left chevron');
    assert.ok(!/i18t\(backC \? 'pg_workspace' : 'ct_back_register'\)/.test(nav),
      'and the word it used to print is not ink any more');
  });

  test('the word is not LOST — it is the hover and the label', () => {
    const nav = CONTRACT.slice(CONTRACT.indexOf('<nav class="room-crumb"'),
      CONTRACT.indexOf('</nav>', CONTRACT.indexOf('<nav class="room-crumb"')));
    assert.match(nav, /title="\$\{esc\(backTitle\)\}" aria-label="\$\{esc\(backTitle\)\}"/,
      'a sign a reader cannot name is a guess; the keyboard and a screen reader still hear it');
  });

  test('the symbol it points at exists — a <use> at a missing one paints nothing', () => {
    assert.ok(HTML.includes('<symbol id="i-left"'),
      'no error, no warning, an arrow-shaped hole in the only way off the page');
  });

  test('it is a circle with the product\'s own outline', () => {
    const rule = HTML.slice(HTML.indexOf('.room-crumb .room-crumb-back{'),
      HTML.indexOf('.room-crumb .room-crumb-back svg'));
    assert.match(rule, /border-radius:50%/,
      'a circle is not a corner — the 26 Aug ruling, and why --radius is not read here');
    assert.match(rule, /border:1px solid var\(--btn-edge,var\(--color-accent-600\)\)/,
      '"like other buttons" is a token, not a blue: blue on navy, green on teal');
  });

  test('it is the size of the line it sits on, stated as that relation', () => {
    const rule = HTML.slice(HTML.indexOf('.room-crumb .room-crumb-back{'),
      HTML.indexOf('.room-crumb .room-crumb-back svg'));
    assert.match(rule, /width:calc\(var\(--t-label\) \* var\(--lh-tight\)\)/,
      'pin the relation, not the number — the row keeps its height, so the contract does not move');
    assert.match(rule, /height:calc\(var\(--t-label\) \* var\(--lh-tight\)\)/, 'square, so the circle is round');
  });

  test('and the press reaches further than the circle', () => {
    const at = HTML.indexOf('.room-crumb .room-crumb-back::before');
    const rule = at < 0 ? '(no rule)' : HTML.slice(at, at + 120);
    assert.match(rule, /::before\{\s*content:'';\s*position:absolute;\s*inset:-7px/,
      `a 14px target is too small for a finger, and growing the box would grow the chrome — ${rule.slice(0, 90)}`);
  });
});
