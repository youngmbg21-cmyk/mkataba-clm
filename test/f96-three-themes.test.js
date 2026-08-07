/* ============================================================
   F96 — three themes, and the line between colour and meaning
   ============================================================
   Green, Navy and Dark. One personal choice, three named options, a swatch
   each and a tick on the one you are wearing.

   THE THEME IS NOT THE COMPANY'S BRAND COLOUR, and keeping those two apart is
   the whole design. The company already has an accent — the design step sets
   it, navy is among its presets, and it dresses the DOCUMENT: the letterhead,
   the PDF, what the counterparty receives. This picks the colour of the tool
   you work in. Wire them together and a company whose brand is claret gets a
   claret platform built from a ramp nobody designed, while one person's taste
   silently restyles every contract that leaves the building.

   TWO AXES UNDERNEATH, THREE OPTIONS ON TOP. The brand rides a data attribute
   and the lights ride a class, which are independent — so navy-at-night already
   works in the stylesheet and is one row away in the menu if anybody asks for
   it. Three are offered because three is what was asked for and three is what
   is easy to explain.

   AND THE LINE THAT MUST NOT MOVE: accepted stays green and rejected stays red
   on a navy platform. Those are not brand, they are the redline's grammar, and
   a lawyer reads them before they read anything else. The theme block is
   asserted to contain no status colour at all, so the rule cannot be broken by
   somebody adding "just one" green to it later.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* js/app.js on a small stage: a real document, and the handful of shell
   functions the theme code touches. Nothing about themes is reimplemented. */
function stage(saved){
  /* A REAL ORIGIN. jsdom serves a document with no url from an opaque origin,
     where localStorage throws — and window.localStorage is a getter, so
     assigning a fake one silently does nothing and every read comes back null.
     That cost a round of green-instead-of-navy failures. Give it an origin and
     use the real thing. */
  const dom = new JSDOM(`<!doctype html><html><body>
    <div style="position:relative">
      <button id="theme-btn" aria-expanded="false"><span id="theme-swatch"></span></button>
      <div id="theme-menu" class="room-menu hidden"></div>
    </div></body></html>`, { url: 'https://hati.test/' });
  const win = dom.window;
  win.localStorage.clear();
  if (saved) win.localStorage.setItem('hati-theme', saved);
  const store = { get: k => win.localStorage.getItem(k) };
  win.state = { view: 'dashboard' };
  win.setView = () => {};
  win.toast = () => {};
  const ctx = vm.createContext(win);
  /* The theme block's labels read through i18t(), so the dictionary goes in
     first — the same order js/app.js itself loads them. */
  vm.runInContext(src('js/i18n.js'), ctx, { filename: 'js/i18n.js' });
  const s = src('js/app.js');
  /* Only the theme block — js/app.js as a whole reaches for the entire shell. */
  const from = s.indexOf('const THEMES = [');
  const to = s.indexOf('/* ---------- Jurisdiction switcher');
  vm.runInContext(s.slice(from, to), ctx);
  return { win, doc: win.document, store,
    root: win.document.documentElement,
    press: el => el.dispatchEvent(new win.Event('click', { bubbles: true })) };
}

describe('F96 — three themes, and what each one sets', () => {
  test('Green is the default and sets nothing', () => {
    const s = stage();
    s.win.applyTheme('green');
    assert.equal(s.root.classList.contains('dark'), false);
    assert.equal(s.root.hasAttribute('data-brand'), false,
      'the default theme is the stylesheet as written — no attribute to undo');
  });

  test('Navy sets the brand and leaves the lights on', () => {
    const s = stage();
    s.win.applyTheme('navy');
    assert.equal(s.root.getAttribute('data-brand'), 'navy');
    assert.equal(s.root.classList.contains('dark'), false, 'Navy is a light theme');
  });

  test('Dark turns the lights off and leaves the brand alone', () => {
    const s = stage();
    s.win.applyTheme('dark');
    assert.equal(s.root.classList.contains('dark'), true);
    assert.equal(s.root.hasAttribute('data-brand'), false);
  });

  test('switching back cleans up after itself', () => {
    const s = stage();
    s.win.applyTheme('navy'); s.win.applyTheme('dark'); s.win.applyTheme('green');
    assert.equal(s.root.hasAttribute('data-brand'), false, 'no stale brand left behind');
    assert.equal(s.root.classList.contains('dark'), false);
  });
});

describe('F96 — the choice is remembered, and old choices still mean something', () => {
  test('picking a theme records it', () => {
    const s = stage();
    s.win.setTheme('navy');
    assert.equal(s.store.get('hati-theme'), 'navy');
    assert.equal(s.win.themeNow(), 'navy');
  });

  test('"light" from the old two-position switch means Green', () => {
    const s = stage('light');
    assert.equal(s.win.themeNow(), 'green', 'nobody is reset for having used the old control');
  });

  test('"dark" from the old switch still means Dark', () => {
    const s = stage('dark');
    assert.equal(s.win.themeNow(), 'dark', 'a month on dark is not undone by this change');
  });

  test('a theme that no longer exists falls back rather than breaking', () => {
    const s = stage('chartreuse');
    assert.equal(s.win.themeNow(), 'green');
  });

  test('the pre-paint script in the page agrees with the app', () => {
    /* It is deliberately duplicated — nothing is loaded that early — so the two
       copies have to be checked against each other rather than assumed. */
    const head = src('index.html').slice(0, 2000);
    assert.match(head, /if \(t === 'light'\) t = 'green'/);
    assert.match(head, /if \(t === 'dark'\) document\.documentElement\.classList\.add\('dark'\)/);
    assert.match(head, /else if \(t === 'navy'\) document\.documentElement\.setAttribute\('data-brand', 'navy'\)/);
  });
});

describe('F96 — the menu says which one you are wearing', () => {
  test('it offers exactly the three, each with a swatch', () => {
    const s = stage();
    s.win.wireThemeMenu();
    const rows = [...s.doc.querySelectorAll('[data-theme-pick]')];
    assert.deepEqual(rows.map(r => r.getAttribute('data-theme-pick')), ['green', 'navy', 'dark']);
    for (const r of rows) assert.ok(r.querySelector('.tsw'), 'every row shows the colour it names');
  });

  test('the one you are on is ticked, and only that one', () => {
    const s = stage('navy');
    s.win.applyTheme('navy');
    s.win.wireThemeMenu();
    const on = [...s.doc.querySelectorAll('[data-theme-pick]')].filter(r => r.getAttribute('aria-checked') === 'true');
    assert.equal(on.length, 1);
    assert.equal(on[0].getAttribute('data-theme-pick'), 'navy');
  });

  test('pressing a row applies it and re-ticks', () => {
    const s = stage();
    s.win.wireThemeMenu();
    s.press(s.doc.querySelector('[data-theme-pick="navy"]'));
    assert.equal(s.root.getAttribute('data-brand'), 'navy');
    assert.equal(s.store.get('hati-theme'), 'navy');
    const on = [...s.doc.querySelectorAll('[data-theme-pick]')].filter(r => r.getAttribute('aria-checked') === 'true');
    assert.equal(on[0].getAttribute('data-theme-pick'), 'navy', 'the menu keeps up with itself');
  });

  test('the button wears the theme it would open', () => {
    const s = stage('dark');
    s.win.applyTheme('dark');
    s.win.wireThemeMenu();
    assert.match(s.doc.getElementById('theme-swatch').getAttribute('style') || '', /linear-gradient/);
    assert.match(s.doc.getElementById('theme-btn').title, /Dark/);
  });

  test('the old toggle still works, and steps through all three', () => {
    const s = stage();
    s.win.toggleTheme(); assert.equal(s.win.themeNow(), 'navy');
    s.win.toggleTheme(); assert.equal(s.win.themeNow(), 'dark');
    s.win.toggleTheme(); assert.equal(s.win.themeNow(), 'green', 'the phone presses this one');
  });
});

describe('F96 — Navy changes colour and nothing else', () => {
  const css = src('index.html');
  const block = (() => {
    const i = css.indexOf(':root[data-brand="navy"]{');
    assert.ok(i > 0, 'the navy theme is declared');
    return css.slice(i, css.indexOf('}', i));
  })();

  test('it sets the same names the green ramp sets', () => {
    for (const n of ['--color-accent-600', '--color-accent-600-rgb', '--nav-bg', '--brand-hero-deep'])
      assert.ok(block.includes(n + ':'), `${n} is missing from Navy`);
  });

  test('every accent step has a hex AND a channel form', () => {
    for (const step of ['50','100','200','300','400','500','600','700','800','900']){
      assert.ok(block.includes(`--color-accent-${step}:`), `hex missing for ${step}`);
      assert.ok(block.includes(`--color-accent-${step}-rgb:`), `channels missing for ${step}`);
    }
  });

  test('it carries no spacing, size or radius — colour only', () => {
    for (const bad of ['padding', 'margin', 'font-size', 'border-radius', 'width', 'height'])
      assert.ok(!block.includes(bad), `Navy sets ${bad} — a theme that can move layout will`);
  });

  /* THE LINE THAT MUST NOT MOVE. */
  test('it touches no status colour: accepted stays green, rejected stays red', () => {
    for (const bad of ['--st-green', '--st-ruby', '--st-amber', '--n-ins', '--n-del',
                       '--n-accept', '--n-reject'])
      assert.ok(!block.includes(bad),
        `Navy sets ${bad} — the redline's grammar is not the brand's to change`);
  });

  test('and the green theme does not define the status colours either', () => {
    /* They live in their own block, so neither theme can quietly claim them. */
    const st = css.indexOf('--st-green-bg:');
    assert.ok(st > 0);
    assert.ok(css.lastIndexOf(':root[data-brand="navy"]{', st) < css.lastIndexOf(':root{', st),
      'the status palette sits outside any theme block');
  });
});
