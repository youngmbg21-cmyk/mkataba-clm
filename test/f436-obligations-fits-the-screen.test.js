/* f436 — INSIGHTS · OBLIGATIONS FITS THE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026)
   ========================================================================
   The owner: "Make the pages fit with a page and for the cards to fit
   together without cards being taller than other cards and not covering
   spaces fully." On the Obligations tab the Reminder Line and its six tiles
   sat in the top part of the screen and a wide empty band filled the rest.

   The approved layout, pinned here as STRUCTURE (the real page is measured
   by obligations-report-verify 8):
   1  the six tiles lead, as the Insights figure strip (.igx-figs / .igx-fig),
      with exactly the doors they had;
   2  then ONE card, the Reminder Line, in the grid's remaining row;
   3  the lanes share that card's height and, past it, scroll INSIDE the card
      (#ob-rl-scroll is an .igx-scroll) with the dates row pinned;
   4  a lane grows from its own floor, so its dots ride its middle;
   5  the tab's old tile rules are gone, and nothing wins by !important.
   Fixture dates are OFFSETS from today. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = read('index.html');
const IG = read('js/views/intelligence.js');
const day = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

function stage(){
  const w = buildWorld({ intelView: true });
  const win = w.win;
  win.getUsers = () => ([{ id: 'u1', name: 'Amina Otieno', email: 'amina@example.co.ke' }]);
  win.obwGoFiltered = win.obwGoFiltered || (() => {});
  win.regShowOnly = win.regShowOnly || (() => {});
  let n = 0;
  const ob = o => Object.assign({ id: 'ob' + (++n), desc: 'Duty ' + n, due: '', recurring: 'none',
    assignee: '', status: 'open' }, o);
  win.state = { contracts: [
    { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', status: 'Signed', owner: { name: 'Former Colleague' },
      obligations: [
        ob({ due: day(12), assignee: 'Amina Otieno' }),
        ob({ due: day(12), assignee: 'Amina Otieno' }),       // same day: a stacked dot
        ob({ due: day(-9), assignee: 'Amina Otieno' }),
        ob({ due: day(8) }),
        ob({ due: day(3), party: 'theirs' }),
        ob({ due: day(-30), status: 'done', completedAt: day(-31), recurring: 'monthly' }),
      ] },
    { id: 'MK-3', name: 'Empty', counterparty: 'Kwezi', status: 'Signed', obligations: [] },
  ] };
  const html = win.intelObligationsHtml();
  const host = win.document.createElement('div');
  host.innerHTML = html;
  return { win, html, root: host.firstElementChild };
}

/* The Reminder Line's own stylesheet region — pin the region, not a byte count. */
function obCss(){
  const a = HTML.indexOf('Insights · Obligations: THE REMINDER LINE');
  assert.ok(a > 0, 'the Reminder Line block is in the stylesheet');
  const b = HTML.indexOf('.obw-only{', a);
  assert.ok(b > a);
  return HTML.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
}

test('1. the page is the fit grid: six figure tiles first, then one card', () => {
  const { root } = stage();
  assert.equal(root.id, 'ig-ob');
  assert.ok(root.classList.contains('igx-fit'), 'the tab is the shared fit grid');
  const kids = [...root.children];
  assert.equal(kids.length, 2, 'a figure strip and one card, nothing else');
  assert.ok(kids[0].classList.contains('igx-figs'), 'the figures lead');
  assert.match(kids[0].getAttribute('style') || '', /--igx-n:6/);
  assert.equal(kids[0].querySelectorAll(':scope > .igx-fig').length, 6, 'six tiles in the strip');
  assert.ok(kids[1].matches('section.igx-card'), 'the Reminder Line is one card in the remaining row');
  assert.equal(root.querySelectorAll('section').length, 1);
});

test('2. the tiles keep their doors, figures and tones', () => {
  const { root } = stage();
  const figs = [...root.querySelectorAll('.igx-figs > .igx-fig')];
  const doors = figs.map(f => f.getAttribute('data-ob-rl-door'));
  assert.deepEqual(doors.slice(0, 3), ['silent', 'late', 'ahead'], 'the order and the doors are unchanged');
  figs.forEach(f => {
    assert.ok(f.querySelector('.igx-fig-t') && f.querySelector('.igx-fig-n') && f.querySelector('.igx-fig-s'),
      'every tile is the shared label · figure · line');
    if (f.getAttribute('data-ob-rl-door')) assert.equal(f.tagName, 'BUTTON', 'a door tile is a button');
  });
  assert.ok(figs[0].querySelector('.igx-fig-n').classList.contains('igx-bad'), 'Will reach nobody is ruby');
  assert.ok(!/ob-rl-tile/.test(root.outerHTML), 'the old tile is not drawn');
});

test('3. the lanes scroll inside the card, the dates row pinned', () => {
  const { root } = stage();
  const card = root.querySelector('section.igx-card');
  const sc = card.querySelector('#ob-rl-scroll');
  assert.ok(sc && sc.classList.contains('igx-scroll'), 'the lanes live in the card’s own scroller');
  assert.ok(sc.querySelector('.ob-rl-grid > .ob-rl-row.is-head'), 'the dates row is inside the same scroller');
  assert.ok(card.querySelector('.ob-rl-legend') && !sc.querySelector('.ob-rl-legend'), 'the legend stays put, above');
  const css = obCss();
  assert.match(css, /\.ob-rl-row\.is-head\{[^}]*position:sticky;top:0/, 'the dates row stays at the top');
  assert.match(css, /\.ob-rl-row\.is-head\{[^}]*background:var\(--color-surface\)/, 'and covers the lanes under it');
});

test('4. the lanes share the height: a column at least the card tall, each lane growing from its floor', () => {
  const css = obCss();
  assert.match(css, /\.ob-rl-scroll\{[^}]*display:flex;flex-direction:column/);
  assert.match(css, /\.ob-rl-grid\{[^}]*flex:1 0 auto;display:flex;flex-direction:column/);
  assert.match(css, /\.ob-rl-grid > \.ob-rl-row:not\(\.is-head\)\{flex:1 0 auto\}/, 'a lane grows, and never shrinks');
  assert.match(css, /\.ob-rl-strip\{[^}]*align-self:stretch/, 'the strip fills its lane');
  const { html } = stage();
  assert.ok(/class="ob-rl-strip" style="min-height:\d+px"/.test(html), 'a lane’s height is a floor, not a size');
  assert.ok(!/class="ob-rl-strip" style="height:/.test(html));
  const tops = [...html.matchAll(/class="ob-rl-dot[^"]*" style="left:[\d.]+%;top:([^"]+)"/g)].map(m => m[1]);
  assert.ok(tops.length >= 3);
  tops.forEach(t => assert.match(t, /^calc\(50% [+-] -?\d+px\)$/, 'a dot rides the lane’s middle: ' + t));
  assert.ok(new Set(tops).size > 1, 'two on one day still stack');
});

test('5. the old tile rules are retired, and nothing wins by !important', () => {
  const css = obCss();
  assert.ok(!/\.ob-rl-tiles?\b/.test(css), 'the grammar’s .igx-fig replaced the tab’s own tile');
  assert.doesNotMatch(css, /!important/);
  assert.ok(!/ob-rl-tile/.test(IG.replace(/\/\*[\s\S]*?\*\//g, '')), 'nothing draws the old tile');
});
