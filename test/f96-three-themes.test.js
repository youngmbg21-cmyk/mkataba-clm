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
  /* THE FIXTURE IS THE SHELL AS BUILT (24 Aug 2026): one bordered group of two
     brand swatches and a light/dark toggle, in place of the three-row menu. */
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="sh-grp">
      <button id="brand-green" class="sh-sw" data-brand-pick="green" hidden><i></i></button>
      <button id="brand-navy" class="sh-sw" data-brand-pick="navy" hidden><i></i></button>
      <button id="theme-btn" class="sh-theme" aria-pressed="false"></button>
    </div></body></html>`, { url: 'https://hati.test/' });
  const win = dom.window;
  win.localStorage.clear();
  if (saved) win.localStorage.setItem('hati-theme', saved);
  const store = { get: k => win.localStorage.getItem(k) };
  win.state = { view: 'dashboard' };
  win.setView = () => {};
  win.toast = () => {};
  /* The swatches ask who is signed in. Default to an admin so the ordinary
     tests see them; the admin-only test overrides this. */
  win.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'admin' });
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

/* ============================================================
   REVERSED IN PLACE, 24 Aug 2026 — THE MENU BECAME TWO CONTROLS
   ============================================================
   This block asserted a menu of three mutually-exclusive rows: Green, Navy,
   Dark, each with a swatch and a tick. The enterprise design splits the two
   axes that were always underneath — and this file's own header already said
   they were there ("navy-at-night already works in the stylesheet and is one
   row away in the menu if anybody asks for it"). Somebody asked.

   THE BRAND IS THE WORKSPACE'S and the THEME IS THE PERSON'S, so they are two
   controls: two swatches, admin-only, and a Light/Dark toggle everyone gets.
   Four combinations replace three states, and navy-at-night is reachable for
   the first time.

   WHAT THE OLD CLAIMS WERE REALLY ABOUT SURVIVES, one for one: the control
   states what you are wearing, pressing it applies AND repaints itself, and
   nothing stored in anybody's browser moves. */
describe('F96 — brand and theme are two controls, not three rows', () => {
  test('the retired menu is gone from the markup and the code', () => {
    const html = src('index.html');
    assert.ok(!html.includes('data-theme-pick'),
      'the three-row menu is retired — flag any mention as stale');
    assert.ok(!html.includes('id="theme-menu"'));
    assert.ok(html.includes('data-brand-pick="green"') && html.includes('data-brand-pick="navy"'),
      'the two brand swatches are what replaced it');
    assert.ok(html.includes('id="theme-btn"'), 'and the light/dark toggle keeps its id');
  });

  test('the toggle says which theme you are wearing', () => {
    const s = stage('dark');
    s.win.applyTheme('dark');
    s.win.wireThemeMenu();
    const t = s.doc.getElementById('theme-btn');
    assert.match(t.textContent, /Dark/);
    assert.equal(t.getAttribute('aria-pressed'), 'true');
  });

  test('pressing it flips only the theme, and the brand stays put', () => {
    const s = stage('navy');
    s.win.applyTheme('navy');
    s.win.wireThemeMenu();
    assert.equal(s.win.darkNow(), false);
    s.win.setDark(true);
    assert.equal(s.win.darkNow(), true);
    assert.equal(s.win.brandNow(), 'navy', 'navy at night — the combination the menu could not reach');
    assert.equal(s.root.getAttribute('data-brand'), 'navy');
    assert.ok(s.root.classList.contains('dark'));
  });

  test('pressing a swatch flips only the brand, and the theme stays put', () => {
    const s = stage();
    s.win.setDark(true);
    s.win.setBrand('navy');
    assert.equal(s.win.brandNow(), 'navy');
    assert.equal(s.win.darkNow(), true, 'the theme is not collateral damage');
  });

  test('NOTHING STORED IN ANYBODY\'S BROWSER MOVES', () => {
    /* The single legacy key is the only thing an existing reader has. Each of
       its three values still opens exactly the workspace it always did. */
    for (const [saved, brand, dark] of [['green','green',false],['navy','navy',false],['dark','green',true]]){
      const s = stage(saved);
      assert.equal(s.win.brandNow(), brand, saved + ' -> brand');
      assert.equal(s.win.darkNow(), dark, saved + ' -> dark');
    }
  });

  test('the swatches are ADMIN-ONLY and the toggle is not', () => {
    const s = stage();
    s.win.currentUser = () => ({ id:'u1', name:'Ed', role:'editor' });
    s.win.wireThemeMenu();
    assert.equal(s.doc.getElementById('brand-navy').hidden, true, 'an editor sees no brand swatch');
    assert.ok(!s.doc.getElementById('theme-btn').hidden, 'but light/dark is everybody\'s');
    s.win.currentUser = () => ({ id:'u2', name:'Amina', role:'admin' });
    s.win.wireThemeMenu();
    assert.equal(s.doc.getElementById('brand-navy').hidden, false, 'an admin does');
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

/* ============================================================ */
describe('F96 — the Copilot is a layer, not a hole', () => {
  const css = src('index.html');

  /* WHAT WENT WRONG. The conversation area was painted var(--color-bg) — the
     PAGE's own background — so in every theme the drawer's body was exactly
     the colour of the platform behind it and the panel had no visible surface
     of its own, only a shadow at its edge. Worst in dark, where page and feed
     were both the darkest tone the theme owns. */
  test('the chat backdrop has a token of its own', () => {
    assert.match(css, /id="ai-feed"[^>]*style="background:var\(--color-chat-bg\);"/,
      'the feed must not borrow the page background');
  });

  /* Read the value out of each palette block rather than trusting one
     definition: a theme that overrides --color-bg and forgets this is exactly
     how the blend comes back. */
  /* THE BLOCK IS FOUND BY MATCHING ITS BRACES, NOT BY ASSUMING WHAT FOLLOWS
     THE OPENING ONE. This read used to anchor on the literal
     `  :root{\n    --color-bg:` and slice to the first `\n  }` in the FILE —
     so the day somebody wrote a comment between `:root{` and the first token
     (22 Aug, the ink retune), the anchor stopped matching, indexOf returned
     -1, the slice came back EMPTY and all three tokens read undefined. The
     test then failed on a claim that was still perfectly true: the three
     colours are #F4F6F6, #ffffff and #eef2f7. A fragile anchor accusing the
     product of a fault it does not have is worse than no test. */
  const tokenIn = (blockOpen, name) => {
    const at = css.indexOf(blockOpen);
    assert.ok(at > 0, 'the ' + name + ' palette is still there');
    let depth = 0, end = at;
    for (let i = css.indexOf('{', at); i < css.length; i++){
      if (css[i] === '{') depth++;
      else if (css[i] === '}'){ depth--; if (depth === 0){ end = i; break; } }
    }
    const block = css.slice(at, end);
    const grab = k => (block.match(new RegExp('--' + k + ':\\s*(#[0-9a-fA-F]{3,8})')) || [])[1];
    return { bg: grab('color-bg'), surface: grab('color-surface'), chat: grab('color-chat-bg') };
  };

  for (const [start, name] of [['  :root{', 'light'], ['  html.dark{', 'dark']]) {
    test(`${name}: the chat backdrop is its own tone, apart from the page and the panel`, () => {
      const t = tokenIn(start, name);
      assert.ok(t.bg && t.surface && t.chat, `${name} defines all three`);
      assert.notEqual(t.chat.toLowerCase(), t.bg.toLowerCase(),
        'the same colour as the page is the blend this fixes');
      assert.notEqual(t.chat.toLowerCase(), t.surface.toLowerCase(),
        'the same colour as the panel leaves the conversation with no edge');
    });
  }
});
