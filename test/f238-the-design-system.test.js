/* ============================================================
   f238 — THE DESIGN SYSTEM HAS ITS OTHER HALF, AND KEEPS IT
   ============================================================
   The 23 Aug 2026 design audit found one structural fact under almost every
   complaint: HaTi had a mature COLOUR system and essentially nothing else.
   91 of 120 :root tokens were colour; font-size, line-height, font-weight,
   z-index, transition-duration and border-width had ZERO tokens between them;
   and the fifteen non-colour tokens that did exist had zero consumers each.

   THIS FILE IS THE RATCHET. Every claim below is a thing that was measured
   wrong before the pass and must not quietly go back. It reads SOURCE, which
   is the right instrument for "does the system exist and is it reachable" —
   the companion claims about what actually DRAWS are browser work, because a
   rule that loses the cascade looks perfectly correct here (this codebase's
   own most expensive lesson, .rl-rej computing to border-width 0 for a year).

   Run: node --test test/f238-the-design-system.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const JS = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VIEWS = fs.readdirSync(path.join(ROOT, 'js/views')).filter(f => f.endsWith('.js'));

/* The hand-written sheet only. Line 74 is the COMPILED Tailwind blob, which is
   generated and must never be asserted on as though somebody wrote it. */
const SHEET = INDEX.split('\n').filter((l, i) => i !== 73).join('\n');

describe('f238 — the design system has its other half', () => {

  /* ---------- 1 · THE LADDERS EXIST ---------- */
  test('a spacing ladder exists, and every rung is a whole pixel', () => {
    for (const [tok, px] of [['--s-1','4px'],['--s-2','8px'],['--s-3','12px'],
                             ['--s-4','16px'],['--s-6','24px'],['--s-8','32px']]) {
      assert.match(SHEET, new RegExp(tok + ':\\s*' + px.replace('px','px')),
        tok + ' is ' + px);
    }
    /* THE FAULT THIS REPLACED: --space-1..8 was a 0.85x scaling of the real
       scale, so every rung was a fraction of a device pixel (3.4 / 6.8 / 10.2
       / 13.6 / 20.4 / 27.2px) — and it had zero consumers, while its own value
       had been hand-typed once as `padding:6.8px`. A fractional rung is the
       softness the 22 Aug type sweep spent 865 replacements removing. */
    const rungs = [...SHEET.matchAll(/--s-\d+:\s*([\d.]+)px/g)].map(m => m[1]);
    assert.ok(rungs.length >= 6, 'the ladder is declared');
    for (const r of rungs) assert.ok(!r.includes('.'), 'rung ' + r + 'px is a whole pixel');
    assert.doesNotMatch(SHEET, /--space-\d:\s*[\d.]+\.\d/, 'no fractional --space-* survives');
  });

  test('a type scale, a leading ladder and a weight set all exist', () => {
    for (const t of ['--t-page','--t-section','--t-card','--t-body','--t-meta',
                     '--t-label','--t-micro','--t-figure'])
      assert.match(SHEET, new RegExp(t + ':'), t + ' is declared');
    for (const t of ['--lh-tight','--lh-snug','--lh-base','--lh-relaxed','--lh-doc'])
      assert.match(SHEET, new RegExp(t + ':'), t + ' is declared');
    for (const t of ['--w-body','--w-label','--w-strong','--w-title'])
      assert.match(SHEET, new RegExp(t + ':'), t + ' is declared');
  });

  test('the product owns its own base leading, not the generated blob', () => {
    /* Before: 78.2% of 2,300 font-size declarations carried no line-height and
       the ONLY base in the product was html{line-height:1.5} inherited from the
       compiled Tailwind blob — a file this project is told never to edit. */
    assert.match(SHEET, /html\{[^}]*line-height:var\(--lh-base\)/,
      'HaTi\'s own sheet declares the base leading');
  });

  test('borders, focus, fields, layers and icons all have tokens', () => {
    for (const t of ['--rule','--rule-strong','--field-line',
                     '--focus-color','--focus-width','--focus',
                     '--field-h','--field-size','--field-lh','--field-pad-x',
                     '--z-modal','--z-toast','--icon','--tap-min'])
      assert.match(SHEET, new RegExp(t.replace(/[-]/g,'-') + ':'), t + ' is declared');
  });

  /* ---------- 2 · THE PAGE MEASURE IS ONE VALUE ---------- */
  test('every padded page root reads the page measure, none types its own', () => {
    /* MEASURED before: 11 page roots carrying 3 different measures, and the
       leftmost ink landing on 6 different verticals across the product. */
    const offenders = [];
    for (const f of VIEWS) {
      const src = JS('js/views/' + f);
      for (const m of src.matchAll(/class="view-enter"\s+style="padding:([^;"]+)/g))
        if (!m[1].includes('var(--page-pad')) offenders.push(f + ' -> ' + m[1]);
    }
    assert.deepEqual(offenders, [], 'a page root typed its own measure');
  });

  test('the shared page header lines up with the page under it', () => {
    /* It padded to 20px while the eleven bodies beneath padded to 16/18/20/0,
       so on 10 of 11 screens the title and its own content did not line up.
       STRENGTHENED 25 Aug 2026 (owner-asked: "the distance between the edge at
       the top and the header should be the same across all pages"). It used to
       carry a ternary — 10px on the inline-subtitle pages, 16 everywhere else —
       so the horizontal measure was shared and the VERTICAL one was not. It is
       ONE value now, which is a stronger claim than the one it replaces: the
       header cannot differ from page to page in either direction.
       REVERSED IN PLACE 25 Aug 2026, and the reversal is the point: this
       pinned the LITERAL `16px` down, and a literal is exactly what stopped
       the short-laptop block reaching this header. A window under 820px of
       page tightens --page-pad-t, every other view root followed it, and this
       one could not — so on every laptop the shared header sat 8px BELOW the
       pages it is meant to line up with. It reads the TOKEN in both
       directions now, which is the claim that was always meant. */
    const src = JS('js/app.js');
    assert.match(src, /host\.style\.padding='var\(--page-pad-t\) var\(--page-pad-x\) 0'/,
      '#page-head reads the page measure in BOTH directions, so a short window '
      + 'tightens it with every other page rather than leaving it behind');
    /* `padding='0'` is the OTHER branch — a page that draws its own head gets
       the shared one cleared — so the ban is on a typed LENGTH, not on a
       digit. A typed length is what broke this on every laptop. */
    assert.ok(!/host\.style\.padding='\d+px/.test(src),
      'and never a typed length, which is what broke this on every laptop');
    assert.ok(!/host\.style\.padding=inlineSub\?/.test(src),
      'and no branch can give one page a different top');
    /* AND THE TITLE'S TOP IS THE PADDING, with or without a subtitle. With
       flex-END a title block shorter than the act button was pushed down —
       measured, Contracts sat at 23px where Templates sat at 16 on the same
       header. */
    assert.match(src, /align-items:flex-start;justify-content:space-between/,
      'the header row starts its items at the top, so the title never drifts');
  });

  /* ---------- 3 · CONTRAST ---------- */
  /* ---- THE READING INKS ARE THE DESIGN'S OWN VALUES ----
     Owner-reported 24 Aug 2026: "the html has a very beautiful design on how
     they use the black fonts across the different pages but HaTi uses grey
     fonts instead which is not striking."
     THE 22 Aug RETUNE GOT THE HUE RIGHT AND THE DEPTH WRONG. It re-hued this
     ramp onto the brand's green-black family — which was correct and is kept —
     and every step landed a shade LIGHTER than the reference, so the whole
     product read one notch softer than the design on every screen at once.
     PINNED AS THE DESIGN'S LITERAL VALUES, deliberately and unlike almost every
     other check in this suite: these four are not "a dark ink" and "a label
     ink", they are the four the handover's own tokens.css declares, and the
     failure this guards against is exactly a well-meant retune drifting off
     them again. tokens.css: --ink #0E1A18, --ink2 #3B4A48, --ink3 #54635F,
     --ink4 #8A9997; and in dark #EAF1EF / #C6D4D0 / #9FB0AC / #6F817C. */
  test('the reading inks are the design\'s own, to the byte', () => {
    /* ANCHORED FORWARD FROM :root, not from the top of the file — "html.dark"
       appears in prose long before either block, and slicing on the first hit
       gives an empty root and seven false misses. */
    const r0 = SHEET.indexOf(':root{');
    const d0 = SHEET.indexOf('html.dark{', r0);
    const root = SHEET.slice(r0, d0);
    const dark = SHEET.slice(d0);
    const has = (src, decl) => src.includes(decl);
    for (const decl of ['--color-text:#0E1A18', '--color-neutral-600:#54635F',
                        '--color-neutral-500:#54635F', '--color-neutral-400:#8A9997',
                        '--color-neutral-700:#0E1A18', '--color-doc-text:#0E1A18',
                        '--color-doc-muted:#3B4A48'])
      assert.ok(has(root, decl), `light theme is missing ${decl}`);
    for (const decl of ['--color-text:#EAF1EF', '--color-neutral-600:#9FB0AC',
                        '--color-neutral-500:#9FB0AC', '--color-neutral-400:#6F817C',
                        '--color-neutral-700:#C6D4D0'])
      assert.ok(has(dark, decl), `dark theme is missing ${decl}`);
    /* AND NOTHING KEPT THE OLD ONES. A stray literal is how one screen comes
       to read a shade lighter than the rest of the product; the standalone
       documents (the evidence pack, the print root, the branding preview) are
       the deliberate exception, because they carry no stylesheet and a token
       there resolves to nothing. */
    assert.equal(/#1B2A28/i.test(root.replace(/\/\*[\s\S]*?\*\//g, '')), false,
      'the old primary ink is still declared somewhere in :root');
  });

  test('no text opacity ladder survives — an opacity is not an ink', () => {
    /* .text-ink/40…/60 put 54 elements of reading text between 2.36:1 and
       4.11:1 — five rungs under the AA floor. */
    assert.doesNotMatch(SHEET, /\.text-ink\\\/(40|45|50|55|60)\{color:color-mix/,
      'a faded reading ink came back');
  });

  test('the accent-as-text carriers read the token that has a dark answer', () => {
    /* html.dark redefines the surface, the ink and the whole neutral ramp and
       never redefines the accent — so a raw ramp step used as TEXT measured
       3.26:1 at night in teal and 1.58:1 in navy. */
    const btn = /\.ui-btn\{([^}]*)\}/.exec(SHEET);
    assert.ok(btn, '.ui-btn is defined');
    assert.match(btn[1], /color:var\(--accent-ink\)/, '.ui-btn reads --accent-ink');
    assert.match(SHEET, /\ba\{color:var\(--accent-ink\)/, 'the global link reads it too');
    assert.match(SHEET, /html\.dark\{\s*--accent-ink:/, '--accent-ink has a dark answer');
  });

  test('the one filled act does not put white on a 3.74:1 fill', () => {
    /* NOT the first match: `.ui-btn-lg.ui-btn-primary{font-weight:700}` also
       ends in that selector. Take the rule that carries the FILL. */
    const prim = [...SHEET.matchAll(/\.ui-btn-primary\{([^}]*)\}/g)]
      .map(m => m[1]).find(b => /background:/.test(b));
    assert.ok(prim, '.ui-btn-primary carries a fill');
    assert.match(prim, /background:var\(--color-accent-700\)/,
      'accent-700 (5.47:1 teal / 11.30:1 navy), not accent-600 (3.74:1)');
    /* AND --accent-solid IS UNTOUCHED: it is the nav's active fill and this
       codebase records it as a brand fill that must not flip with the theme. */
    assert.match(SHEET, /--accent-solid:var\(--color-accent-600\)/,
      '--accent-solid is still the brand fill it was');
  });

  /* ---------- 4 · THE FOCUS RING REACHES WHAT REFUSES AN OUTLINE ---------- */
  test('the focus ring is a box-shadow as well as an outline', () => {
    /* 91 inline `outline:none` declarations defeat any outline rule, and an
       inline declaration cannot be beaten without !important. Not one of them
       sets box-shadow, so the shadow reaches all of them. */
    const rule = /:focus-visible[^{]*\{([^}]*)\}/.exec(
      SHEET.slice(SHEET.indexOf('button:focus-visible')));
    assert.ok(rule, 'the global focus rule is there');
    assert.match(rule[1], /box-shadow:var\(--focus\)/,
      'the second declaration is the fix, not decoration');
  });

  test('the shared field constants carry no outline:none', () => {
    for (const f of ['js/core.js', 'js/review.js']) {
      const src = JS(f);
      for (const m of src.matchAll(/const (FLD|RV_FLD)\s*=\s*'([^']*)'/g))
        assert.ok(!m[2].includes('outline:none'),
          f + "'s " + m[1] + ' no longer kills its own focus ring');
    }
  });

  test('every field constant reads the field tokens, so no copy can drift', () => {
    /* Three disagreeing FLD constants, two of them in one file 1,300 lines
       apart; and RV_FLD carried a note saying it was a deliberate copy to be
       kept in step, which had already drifted 2px from what it quoted. */
    const all = JS('js/core.js') + JS('js/review.js');
    const decls = [...all.matchAll(/const (?:RV_)?FLD\s*=\s*'([^']*)'/g)].map(m => m[1]);
    assert.ok(decls.length >= 3, 'the field constants are still there');
    for (const d of decls) {
      assert.ok(d.includes('var(--field-h)'), 'a field constant types its own height');
      assert.ok(d.includes('var(--field-pad-y)'), 'a field constant types its own padding');
    }
  });

  /* ---------- 5 · THE CONTRACT PAPER FOLLOWS ITS READER ---------- */
  test('no fixed-size utility is applied to the contract paper', () => {
    /* MEASURED: .doc-surface moved 7.46 -> 14 -> 18.66px across the reader's
       three settings while every clause paragraph stayed a flat 15px, because
       it carried `text-[13.5px]` — a class whose COMPILED value the 22 Aug
       sweep moved to 15px while leaving its NAME saying 13.5. At the small
       setting the clause title drew smaller than the body beneath it. */
    const src = JS('js/views/contract.js');
    const clause = src.slice(src.indexOf('data-anchor="c${n}"'), src.indexOf('data-anchor="c${n}"') + 700);
    assert.ok(!/text-\[[\d.]+px\]/.test(clause),
      'the clause block pins no font size');
    const recital = src.slice(src.indexOf('data-anchor="recital"') - 300, src.indexOf('data-anchor="recital"'));
    assert.ok(!/text-\[[\d.]+px\]/.test(recital), 'the recital pins no font size');
  });

  /* ---------- 6 · THE THINGS THAT WERE SIMPLY BROKEN ---------- */
  test('the owner side has a print path', () => {
    /* body>*{display:none!important} with #print-root the one escape, and the
       only code that ever filled it was the counterparty's side — so the
       Document tab printed 0 characters against 2,092 on screen. */
    const app = JS('js/app.js');
    assert.match(app, /addEventListener\('beforeprint'/, 'something fills #print-root on print');
    assert.match(app, /addEventListener\('afterprint'/, 'and clears it afterwards');
    assert.match(app, /root\.innerHTML\.trim\(\)\)\s*return/,
      'it never overwrites a deliberate fill — portal.js composes its own');
  });

  test('the sign-in screen shows nothing from a session it does not have', () => {
    assert.match(JS('js/core.js'), /classList\.add\('pre-auth'\)/, 'renderAuth marks it');
    assert.match(JS('js/core.js'), /classList\.remove\('pre-auth'\)/, 'the shell clears it');
    assert.match(SHEET, /body\.pre-auth #ai-panel/, 'the Copilot panel is hidden there');
    assert.match(SHEET, /body\.pre-auth #context-panel/, 'and the activity panel');
  });

  test('a modal says it is a dialog and keeps the keyboard inside it', () => {
    const core = JS('js/core.js');
    const open = core.slice(core.indexOf('function openModal'), core.indexOf('function openModal') + 3000);
    assert.match(open, /role="dialog"/, 'it has the role');
    assert.match(open, /aria-modal="true"/, 'and announces itself as modal');
    assert.match(open, /e\.key!=='Tab'/, 'Tab cycles inside it');
    assert.match(core, /_modalOpener/, 'and focus goes back where it came from');
  });

  test('a text-styled button still clears the target-size floor', () => {
    /* "Forgot password?" — the only route back into a locked-out account —
       measured 366x17px, 7px under WCAG 2.5.8 at every width. */
    assert.match(JS('js/core.js'), /const LINKBTN='[^']*min-height:var\(--tap-min\)/,
      'LINKBTN carries a floor');
  });
});
