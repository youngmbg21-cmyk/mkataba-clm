/* ============================================================
   F932 — three themes, and the line between colour and meaning
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

   ============================================================
   RE-POINTED 20 Oct 2026 — CHAMBERS: ONE LOOK, NO DARK, NO BRAND
   ============================================================
   The owner picked the "Chambers" design by name and said: "Let's not
   implement the dark theme. Remove it from HaTi. Only dark theme will be on
   the explorer and brain as designed today." So there is no Green, no Navy
   and no Dark any more: the theme code (THEMES … renderThemeMenu), the
   swatches, the light/dark toggle, the phone's theme button and the
   :root[data-brand="navy"] block are gone. Explorer's map and the Brain draw
   their own dark stage and never read a stored key.

   Every claim below that pinned a theme now pins that it is ABSENT, and that
   NOTHING A BROWSER KEPT CAN BRING ONE BACK: the pre-paint script reads
   nothing, adds no `dark` class and no `data-brand`, and clears the old keys
   once — the reader's, the counterparty's, the legacy single key and the
   brand — so an old stored "dark" lands on light, on our page and theirs.
   What the old claims were really about survives where it still means
   something: the redline's grammar (accepted green, rejected red, amber) is
   still nobody's theme — defined once, in the palette — the one palette
   still carries every accent step in hex AND channel form, and the chat
   backdrop is still its own tone. AT THE PARENT (d2b75c7) every absence
   claim here FAILS: the themes are all there.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* code without its comments: a comment may tell the story of what left */
const code = s => String(s).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const walk = (rel, out = []) => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
  const r = rel + '/' + e.name; if (e.isDirectory()) walk(r, out); else if (r.endsWith('.js')) out.push(r); } return out; };

/* THE PRE-PAINT SCRIPT, as the page carries it: the first script in the
   document, the one that runs before anything is painted. */
const HTML = src('index.html');
const SCRIPTS = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const PREPAINT = SCRIPTS.find(b => /hati-dark/.test(b)) || '';

/* ONE real document with a real origin (jsdom serves a document with no url
   from an opaque origin, where localStorage throws), reused for every
   combination: cleared, seeded, the script run on it as it really runs. */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://hati.test/' });
const win = dom.window, root = win.document.documentElement;
const ctx = vm.createContext(win);
function boot(stored, hash){
  win.localStorage.clear();
  win.location.hash = hash || '';
  for (const [k, v] of Object.entries(stored)) if (v !== null) win.localStorage.setItem(k, v);
  root.className = ''; root.removeAttribute('data-brand');
  vm.runInContext(PREPAINT, ctx);
  return { dark: root.classList.contains('dark'), brand: root.getAttribute('data-brand'),
    left: ['hati-dark', 'hati-dark-guest', 'hati-theme', 'hati-brand', 'hati-brand-blue-once'].filter(k => win.localStorage.getItem(k) !== null) };
}

const RETIRED = ['THEMES', 'THEME_KEY', 'themeNow', 'applyTheme', 'setTheme', 'toggleTheme', 'BRAND_KEY', 'DARK_KEY', 'BRANDS',
  'brandRead', 'brandWrite', 'brandNow', 'brandBlueOnce', 'DARK_KEY_GUEST', 'darkGuest', 'darkKey', 'darkNow', 'applyAppearance',
  'repaintForAppearance', 'setBrand', 'setDark', 'toggleDark', 'brandPickerVisible', 'paintAppearance', 'wireThemeMenu',
  'renderThemeMenu', 'M_THEME_SWATCH'];

describe('F932 — one look: a fresh browser lands on it, and nothing kept brings a theme back', () => {
  test('the pre-paint script is still the first script, and it reads nothing', () => {
    assert.ok(PREPAINT, 'the pre-paint script is there');
    assert.equal(SCRIPTS.indexOf(PREPAINT), 0, 'it runs before anything else');
    const body = code(PREPAINT);
    assert.doesNotMatch(body, /getItem/, 'nothing is read before the first paint');
    assert.doesNotMatch(body, /classList|setAttribute|data-brand|className/, 'and nothing is put on the page');
  });

  test('a fresh browser lands on light: no dark class, no brand', () => {
    const r = boot({});
    assert.equal(r.dark, false);
    assert.equal(r.brand, null, 'no brand attribute — there is no brand');
  });

  /* REVERSED IN PLACE, 20 Oct 2026 (Chambers). This was "the pre-paint script
     in the page agrees with the app, on every stored combination" — the
     script RUN against every combination of the keys and compared with
     brandNow() and darkNow(). There is no app answer left to agree with; the
     sweep stays, and now every combination must land on light with its keys
     cleared. Same breadth, the new ruling. */
  test('every old stored choice lands on light, and the old keys are cleared once', () => {
    let combinations = 0;
    for (const b of [null, 'green', 'navy']) for (const d of [null, '0', '1'])
      for (const l of [null, '', 'light', 'green', 'navy', 'dark', 'chartreuse']) for (const once of [null, '1']){
        const where = `brand=${b} dark=${d} legacy=${l} blue-once=${once}`;
        const r = boot({ 'hati-brand': b, 'hati-dark': d, 'hati-theme': l, 'hati-brand-blue-once': once });
        assert.equal(r.dark, false, 'dark came back at ' + where);
        assert.equal(r.brand, null, 'a brand came back at ' + where);
        assert.deepEqual(r.left, [], 'an old key was left behind at ' + where);
        combinations++;
      }
    assert.ok(combinations > 100, 'the sweep read back too short: ' + combinations);
  });

  test('only the old keys are cleared — the reader\'s other choices stand', () => {
    win.localStorage.clear();
    win.localStorage.setItem('hati.v1.docZoom', '120');
    win.localStorage.setItem('hati-dark', '1');
    vm.runInContext(PREPAINT, ctx);
    assert.equal(win.localStorage.getItem('hati.v1.docZoom'), '120', 'the paper\'s zoom survives');
    assert.equal(win.localStorage.getItem('hati-dark'), null);
  });

  /* REVERSED IN PLACE, 20 Oct 2026: "their page keeps its own light and
     dark" (Young, 4 Oct 2026) guarded the counterparty's page from our
     reader's dark. With no dark at all, their page — a share or an adviser
     link — lands on light whatever either side stored, and their key is
     cleared with ours. */
  test('their page too: a share or adviser link lands on light whatever either side stored', () => {
    for (const hash of ['#share=tok123', '#advice=abc'])
      for (const ours of [null, '0', '1']) for (const theirs of [null, '0', '1']){
        const where = `${hash} ours=${ours} theirs=${theirs}`;
        const r = boot({ 'hati-dark': ours, 'hati-dark-guest': theirs, 'hati-theme': 'dark', 'hati-brand': 'navy' }, hash);
        assert.equal(r.dark, false, 'dark at ' + where);
        assert.equal(r.brand, null, 'a brand at ' + where);
        assert.deepEqual(r.left, [], 'a key left at ' + where);
      }
  });
});

describe('F932 — the theme code is gone, and nothing asks for it', () => {
  test('js/app.js keeps none of the theme or brand machinery', () => {
    const app = code(src('js/app.js'));
    assert.doesNotMatch(app, /const THEMES = \[/, 'the theme block is gone');
    for (const n of RETIRED) assert.doesNotMatch(app, new RegExp('\\b' + n + '\\b'), n + ' is still in js/app.js');
  });

  test('no module anywhere names one, publishes one or calls one — the phone included', () => {
    const hits = [];
    for (const f of walk('js')){
      const c = code(src(f));
      for (const n of RETIRED) if (new RegExp('\\b' + n + '\\b').test(c)) hits.push(f + ': ' + n);
    }
    assert.deepEqual(hits, []);
  });

  test('nothing puts the dark class or a brand on the page', () => {
    const hits = walk('js').filter(f => /documentElement\.classList\.(?:add|toggle)\(\s*['"]dark['"]|setAttribute\(\s*['"]data-brand['"]/.test(code(src(f))));
    assert.deepEqual(hits, []);
  });
});

/* ============================================================
   REVERSED IN PLACE, 24 Aug 2026 — THE MENU BECAME TWO CONTROLS
   (two swatches, admin-only, and a Light/Dark toggle everyone got)
   REVERSED AGAIN, 20 Oct 2026 — CHAMBERS: NEITHER CONTROL IS LEFT
   ============================================================ */
describe('F932 — no theme control on any page', () => {
  test('the retired menu is gone, and so are the two controls that replaced it', () => {
    const html = code(HTML);
    assert.ok(!html.includes('data-theme-pick'), 'the three-row menu is retired — flag any mention as stale');
    assert.ok(!html.includes('id="theme-menu"'));
    assert.ok(!html.includes('data-brand-pick'), 'no brand swatch');
    assert.ok(!html.includes('id="brand-green"') && !html.includes('id="brand-navy"'));
    assert.ok(!html.includes('id="theme-btn"'), 'no light/dark toggle');
    assert.doesNotMatch(html, /class="[^"]*\bsh-grp\b/, 'no Appearance group in the bar');
  });

  test('the phone has no theme button either', () => {
    const phone = walk('js').filter(f => /\/mobile[^/]*\.js$/.test(f));
    assert.ok(phone.length, 'the phone\'s modules were found to look in');
    for (const f of phone){
      const c = code(src(f));
      assert.doesNotMatch(c, /data-m-act="theme"|m-theme-sw|M_THEME_SWATCH/, f);
    }
  });
});

describe('F932 — no brand block; the redline\'s grammar is still nobody\'s theme', () => {
  const css = code(HTML);

  test('no :root[data-brand] block, and no rule keyed on a brand', () => {
    assert.equal(css.indexOf(':root[data-brand="navy"]{'), -1, 'the navy theme is gone');
    assert.doesNotMatch(css, /data-brand/, 'no selector anywhere reads a brand');
  });

  /* The old claim — "every accent step has a hex AND a channel form" — held
     of Navy's block; it holds now of the one palette, and the relation is
     pinned rather than the number: each step's channels ARE its hex. */
  test('the one palette carries every accent step in hex AND channel form, and they agree', () => {
    const at = css.indexOf('  :root{');
    assert.ok(at > -1, 'the palette is there');
    let depth = 0, end = at;
    for (let i = css.indexOf('{', at); i < css.length; i++){
      if (css[i] === '{') depth++;
      else if (css[i] === '}'){ depth--; if (depth === 0){ end = i; break; } }
    }
    const block = css.slice(at, end);
    for (const step of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']){
      const hex = (block.match(new RegExp('--color-accent-' + step + ':\\s*#([0-9a-fA-F]{6})')) || [])[1];
      const rgb = (block.match(new RegExp('--color-accent-' + step + '-rgb:\\s*(\\d+) (\\d+) (\\d+)')) || []).slice(1).map(Number);
      assert.ok(hex, `hex missing for ${step}`);
      assert.equal(rgb.length, 3, `channels missing for ${step}`);
      assert.deepEqual(rgb, [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)), `${step}: the channels are not its hex`);
    }
  });

  /* THE LINE THAT MUST NOT MOVE, said the new way: accepted green, rejected
     red and amber are each defined ONCE, in the palette — no theme, brand or
     dark block anywhere can re-dress them. */
  test('accepted stays green, rejected stays red: each status colour is defined once, in the palette', () => {
    for (const tone of ['green', 'ruby', 'amber']) for (const part of ['bg', 'fg', 'dot', 'line']){
      const name = `--st-${tone}-${part}`;
      const at = [...css.matchAll(new RegExp(name + '\\s*:', 'g'))].map(m => m.index);
      assert.equal(at.length, 1, `${name} is defined ${at.length} times`);
      const open = css.lastIndexOf('{', at[0]);
      /* the selector: from the last rule's end (or the <style> it opens) to its brace */
      const sel = css.slice(css.lastIndexOf('}', open) + 1, open).replace(/^[\s\S]*<style[^>]*>/, '').trim();
      assert.equal(sel, ':root', `${name} sits under "${sel}", not in the palette`);
    }
  });
});

/* ============================================================ */
describe('F932 — the Copilot is a layer, not a hole', () => {
  const css = HTML;

  /* WHAT WENT WRONG. The conversation area was painted var(--color-bg) — the
     PAGE's own background — so in every theme the drawer's body was exactly
     the colour of the platform behind it and the panel had no visible surface
     of its own, only a shadow at its edge. Worst in dark, where page and feed
     were both the darkest tone the theme owns. */
  test('the chat backdrop has a token of its own', () => {
    assert.match(css, /id="ai-feed"[^>]*style="background:var\(--color-chat-bg\);"/,
      'the feed must not borrow the page background');
  });

  /* THE BLOCK IS FOUND BY MATCHING ITS BRACES, NOT BY ASSUMING WHAT FOLLOWS
     THE OPENING ONE (a fragile anchor accusing the product of a fault it does
     not have is worse than no test). */
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

  test('light: the chat backdrop is its own tone, apart from the page and the panel', () => {
    const t = tokenIn('  :root{', 'light');
    assert.ok(t.bg && t.surface && t.chat, 'light defines all three');
    assert.notEqual(t.chat.toLowerCase(), t.bg.toLowerCase(),
      'the same colour as the page is the blend this fixes');
    assert.notEqual(t.chat.toLowerCase(), t.surface.toLowerCase(),
      'the same colour as the panel leaves the conversation with no edge');
  });

  /* RE-POINTED 20 Oct 2026 (Chambers): the dark pass is gone with the dark
     palette — there is no second set of these three to fall behind. */
  /* REVIEWED 21 Oct 2026: the selector sweep read `\b(?:html|:root)` — a word
     boundary before ":" needs a letter in front, so a `:root.dark` rule could
     never be seen. The boundary now sits on `html` alone, and the sweep also
     reads the modules that carry their own sheets (negotiation-css.js, the
     calendar, the clause editor, portfolio, the phone), which held html.dark
     rules at the parent. */
  test('there is no dark palette left to blend: no html.dark block, no dark selector in the page or any module', () => {
    const DARK_SEL = /(?:\bhtml|:root)\.dark\b/;
    assert.ok(DARK_SEL.test(' :root.dark .x{}') && DARK_SEL.test('html.dark .x{}'), 'the sweep can see both spellings');
    assert.equal(css.indexOf('  html.dark{'), -1, 'the dark palette block is gone');
    assert.doesNotMatch(code(css), DARK_SEL, 'no rule is keyed on the dark class');
    const hits = walk('js').filter(f => DARK_SEL.test(code(src(f))));
    assert.deepEqual(hits, [], 'no module\'s own sheet is keyed on the dark class');
  });
});
