/* ============================================================
   F97 — the link mark gets its own column, and says when it is absent
   ============================================================
   The owner asked why some contracts had a traffic light and some did not.
   The honest answer was that the dot is not about the contract at all: the
   chip beside it says where the CONTRACT stands, the dot says what happened to
   the LINK that was sent. Two questions, one column, headed Status.

   So it has its own column now, headed Link, with a legend under the table.
   Three decisions, each of which the render made obvious and none of which
   were obvious before it.

   NOT SHARED IS A DASH. A blank cell says "I do not know" and cannot be told
   apart from a grey Sent dot missed at a glance. The dash says the true thing
   — nothing has gone out — which is precisely what the old design could not
   express, and precisely what was being asked.

   OPENED IS A RING. Opened and Signed were teal and emerald: a few degrees
   apart, in one column, and the two states furthest apart in meaning. The pair
   you most need to distinguish was the pair hardest to distinguish. A ring is
   not a hue, so it survives both a quick glance and a colour vision
   deficiency.

   AND THE RING DOES NOT FOLLOW THE THEME. Opened used the steel tone, which
   derives from the brand accent — so on Navy it turned navy. A colour that
   MEANS something must not move when somebody changes the platform's colour.
   That is the same rule the redline's green and red keep, and this is the
   third place it has had to be enforced.

   Two tables draw this signal — the register and the folder page — so every
   check below runs against both. That is the duplication rule, not thoroughness
   for its own sake: the first version of this change fixed the register and
   left the folder page carrying the old inline dot.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const core = src('js/core.js');
const reg = src('js/views/register.js');

describe('F97 — one builder, so the two tables cannot disagree', () => {
  test('the cell is built in one place', () => {
    assert.match(core, /const shareLinkCell = cid =>/,
      'a second opinion about what "not shared" looks like is how tables drift apart');
    assert.match(core, /shareLinkCell/, 'and it is exported');
  });

  test('both tables use it — neither hand-rolls its own', () => {
    const uses = reg.match(/shareLinkCell\(c\.id\)/g) || [];
    assert.equal(uses.length, 2, 'the register and the folder page, one each');
  });

  test('and neither still puts the mark inside the Status cell', () => {
    /* The whole point: two answers were sharing one column. */
    assert.ok(!/shareDot\(c\.id\)\$\{window\.questionDot/.test(reg),
      'the link dot is out of the status cell in the folder table');
    assert.ok(!/min-width:19px;flex:none">\$\{shareDot/.test(reg),
      'and out of it in the register');
  });

  test('both tables head the column, and explain what it is', () => {
    /* Heading and tooltip are dictionary keys now — the column is read in the
       reader's language. What this test is about is that BOTH tables carry
       them, which has not changed. */
    const heads = reg.match(/<th[^>]*>\$\{i18t\('reg_col_link'\)\}<\/th>/g) || [];
    assert.equal(heads.length, 2);
    const titled = reg.match(/title="\$\{i18t\('reg_link_title'\)\}"/g) || [];
    assert.equal(titled.length, 2, 'a column heading of one word earns a sentence');
  });

  test('both tables carry the legend', () => {
    const legends = reg.match(/shareLegendHtml\(/g) || [];
    assert.equal(legends.length, 2,
      'a column of coloured marks with no key is what started this');
  });

  test('the full-width rows were widened with the tables', () => {
    /* An empty-state row that still spans 7 of 8 columns leaves a ragged gap —
       the kind of thing only a rendered page shows. */
    assert.ok(!/colspan="7"/.test(reg), 'no row still spans the old column count');
    assert.equal((reg.match(/colspan="8"/g) || []).length, 3);
  });
});

describe('F97 — what the marks mean, and what they must not do', () => {
  test('not shared is a dash with a reason, not an empty cell', () => {
    assert.match(core, /shareLinkCell = cid => shareDot\(cid\)\s*\|\|/);
    assert.match(core, /title="\$\{i18t\('co_not_sent_anyone'\)\}"/);
    assert.match(core, /&mdash;/);
  });

  test('Opened is drawn as a ring', () => {
    assert.match(core, /const SHARE_RING = 'opened'/);
    const fn = core.slice(core.indexOf('const shareDotStyle'));
    const body = fn.slice(0, fn.indexOf('};'));
    assert.match(body, /st === SHARE_RING/);
    assert.match(body, /border:2\.5px solid/);
    assert.match(body, /background:transparent/);
  });

  /* THE RULE THAT KEEPS BEING BROKEN. */
  test('the ring takes a neutral, not the brand accent', () => {
    const fn = core.slice(core.indexOf('const shareDotStyle'));
    const body = fn.slice(0, fn.indexOf('};'));
    assert.match(body, /var\(--color-neutral-\d00\)/,
      'a neutral does not move when the platform changes colour');
    assert.ok(!/--color-accent|--st-steel/.test(body),
      'Opened followed the accent and turned navy on the Navy theme');
  });

  test('every other state keeps its meaning colour', () => {
    /* The label is a getter now — the reader sees the state in their own
       language. The COLOUR is what this test is about and has not moved. */
    for (const [st, tone] of [['changes','amber'], ['signed','green'], ['declined','ruby'], ['sent','gray']])
      assert.match(core, new RegExp(`${st}:\\s*\\{\\s*get label\\(\\)\\{[^}]+\\},\\s*dot:'var\\(--st-${tone}-dot\\)`),
        `${st} should stay ${tone}`);
  });

  test('the legend names the five states a reader actually meets', () => {
    assert.match(core, /const SHARE_LEGEND = \['sent','opened','changes','signed','declined'\]/,
      'expired and revoked are grey like Sent; naming all eight is longer than the thing it explains');
  });

  test('the legend draws its marks from the same style function as the rows', () => {
    const fn = core.slice(core.indexOf('function shareLegendHtml'));
    assert.match(fn.slice(0, fn.indexOf('\n}')), /shareDotStyle\(st\)/,
      'a legend with its own copy of the colours is a legend that will one day lie');
  });

  test('the mark carries no margin of its own', () => {
    /* It had margin-right:8px, which is what made it read as part of the chip
       next door. The cell does the spacing now. */
    const fn = core.slice(core.indexOf('const shareDot = cid =>'));
    assert.ok(!/margin-right/.test(fn.slice(0, fn.indexOf('};'))));
  });

  test('and it says Link, not Share, in its tooltip', () => {
    assert.match(core, /title="Link: \$\{m\.label\}/,
      'the column is called Link; the tooltip agreeing with the heading is free');
  });
});
