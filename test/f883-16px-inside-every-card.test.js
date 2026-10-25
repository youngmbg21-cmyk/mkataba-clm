/* f883 — 16PX INSIDE EVERY CARD (owner, 25 Oct 2026: "ensure the words are not close to the edges of the
   cards … the top and the bottom should have the same distance to the edge so should the left and right
   edges"; "go with 16px, apply it everywhere")

   Measured before: the redline card's first line sat 0px under its top and 16px over its foot; Jambo's
   words 11/12 above and below, 12 at the sides; Settings, the Board's cards, New agreement, Calendar's head
   and the page heads all short or uneven. Now one block in HaTi's sheet sets 16px, and the tidy sweep
   measures every painted card on every page at the three screens.
   Red at the parent: neither the block nor the sweep's check existed. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HTML = read('index.html'), SWEEP = read('test/chromium/tidy-sweep-verify.js'), TL = read('js/views/templatelib.js');
const block = (() => { const i = HTML.indexOf('/* ==== 16PX INSIDE EVERY CARD'); return i < 0 ? '' : HTML.slice(i, HTML.indexOf('</style>', i)); })();

describe('f883 — 16px inside every card', () => {
  test('the redline card: 16px on every side, its head adds nothing on top', () => {
    assert.match(HTML, /\.rl-card-head\{padding-top:0\}/);
  });
  test('one block in HaTi\'s sheet carries the rule, scoped, never !important', () => {
    assert.ok(block, 'the block exists');
    assert.ok(!/!important/.test(block), 'no !important');
    for (const re of [
      /#app-shell :is\(\.jl-bub, \.st-jb-bub\)[^{]*\{padding:16px\}/,
      /#app-shell \.hb-board \.hb-bhead\.hb-card, #app-shell \.hb-board \.hb-inscard\{padding:16px\}/,
      /#app-shell \.st-cr \.st-card\{padding:16px\}/,
      /#na-root\.na-one :is\(\.na-ask, \.na-rail, \.na-read, \.na-theirs, \.na-card, \.na-file\)\{padding:16px\}/,
      /#app-shell \.cal-page\.is-home \.cal-head\{padding:16px\}/,
    ]) assert.match(block, re);
  });
  test('a template\'s page line keeps 16px too', () => {
    assert.match(TL, /#app-shell \.ph-card\.tpl-dt-line\{[^}]*padding:16px/);
  });
  test('the tidy sweep measures it on every page', () => {
    assert.match(SWEEP, /const CARD_ROOM = 16, CARD_ROOM_SLACK = 3;/);
    assert.match(SWEEP, /— 16px inside every card`, !m\.room\.length/);
  });
});
