/* f236 — EVERY COMMENT IN THE STYLESHEET IS CLOSED, AND CLOSED ONCE
   ============================================================
   Found 23 Aug 2026, from an owner report that the Settings and Our-standards
   tab rows looked cramped. They were: `.st-tab` had NO RULE AT ALL. Measured in
   a real browser, it computed `padding:0px` off the button reset, and the
   browser's own parsed stylesheet listed `.st-tabs`, `.st-tab:hover`,
   `.st-tab.on` and `.st-tabsub` while `.st-tab` itself was absent.

   THE CAUSE WAS A COMMENT, NOT A CASCADE. Two explanatory notes were written
   into that rule in separate passes and the second was inserted after the
   first had already been closed, leaving eight lines of prose and an orphaned
   terminator sitting in the stylesheet as raw CSS. A CSS parser recovers from
   garbage by skipping to the end of the next block — and the next block was
   the rule itself, so the whole thing was swallowed.

   IT HAPPENED TWICE. Writing the note that explains it reproduced it: spelling
   the terminator out inside a comment closes the comment on the spot. That is
   why this file exists rather than a promise to be careful.

   WHY A NODE TEST AND NOT A BROWSER ONE. The EFFECT belongs in a browser —
   white-band-and-tabs-verify asks the live page whether `.st-tab` is in the
   parsed stylesheet with its padding, because that is the only place the
   question can be answered. But the CAUSE is a property of the FILE, it is
   cheap to check, and it catches every rule the next stray terminator would
   swallow rather than the one somebody happened to notice. Both halves, on
   purpose: this one says the file is well formed, the browser one says the
   rule survived to the screen.

   THE CHECK IS NOT A REGEX OVER THE WHOLE FILE. index.html is markup with
   several <style> blocks in it, and `/*` appears in ordinary page text and in
   script; only the style blocks are scanned, each on its own, so a comment
   opened in one cannot appear to be closed by the next. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

/* Walks one stylesheet's text and reports every place a comment is opened
   inside another one or closed when none is open. CSS comments do not nest, so
   a `/*` inside a comment is harmless to the parser — but it is almost always
   somebody meaning to write prose, and it is how the second half of this bug
   was made, so it is reported too. */
function commentFaults(css){
  const faults = []; let depth = 0, i = 0;
  while (i < css.length){
    const open = css.indexOf('/*', i);
    const close = css.indexOf('*/', i);
    if (open === -1 && close === -1) break;
    if (open !== -1 && (close === -1 || open < close)){
      if (depth) faults.push({ kind: 'opened inside a comment', line: css.slice(0, open).split('\n').length });
      depth++; i = open + 2;
    } else {
      if (depth === 0) faults.push({ kind: 'closed with none open', line: css.slice(0, close).split('\n').length });
      else depth--;
      i = close + 2;
    }
  }
  if (depth) faults.push({ kind: 'left open at end of block', line: css.split('\n').length });
  return faults;
}

/* Every file this product actually styles from. index.html holds the platform
   sheet; the view files build their own with template literals, and a stray
   terminator there is the same defect one layer along. */
const STYLED = ['index.html', 'js/views/negotiation-css.js'];

describe('f236 — the stylesheet parses', () => {
  for (const rel of STYLED){
    test(`${rel}: every comment is opened once and closed once`, () => {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const blocks = rel.endsWith('.html')
        ? [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => ({
            css: m[1], at: src.slice(0, m.index).split('\n').length }))
        : [{ css: src, at: 1 }];
      assert.ok(blocks.length, `${rel} still carries a stylesheet to check`);
      const bad = [];
      for (const b of blocks)
        for (const f of commentFaults(b.css))
          bad.push(`${rel}:${b.at + f.line - 1} — comment ${f.kind}`);
      assert.deepEqual(bad, [], bad.join('\n'));
    });
  }

  /* ---- A BACKTICK IN A COMMENT ENDS THE STYLESHEET (23 Aug 2026) ----
     The same family as the swallowed rule above, in the ENCLOSING language.
     js/views/negotiation-css.js returns its CSS from a JS template literal, so
     a backtick anywhere inside it — including inside what looks like a comment,
     because a comment inside a template literal is just text — CLOSES the
     string. What follows is parsed as JavaScript.

     IT COSTS TWO DIFFERENT WAYS AND BOTH WERE MET IN ONE SITTING. An ODD
     backtick on a line is a SyntaxError, which is loud. A BALANCED PAIR is
     worse: the file parses perfectly, and the words between the two backticks
     are EVALUATED at call time — so `.redline-page` became a read of a
     variable named `page` and redlineLayoutCss() threw a ReferenceError the
     moment the negotiation page was drawn. Five such pairs were live in the
     file, written across two days, and nothing caught them: the linter passes,
     and only a test that actually CALLS the function can see it.

     So this checks both halves — no stray backticks, and the function really
     runs. CLAUDE.md already carried the rule in words ("no backticks in
     js/views/negotiation-css.js comments"); this is the net under it. */
  test('js/views/negotiation-css.js carries no backtick but its own two literals', () => {
    const rel = 'js/views/negotiation-css.js';
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const lines = src.split('\n');
    /* The only legitimate backticks are the ones opening and closing each
       template literal, and each of those sits alone at the end or start of
       its line. Anything else is inside the CSS text. */
    const stray = [];
    lines.forEach((l, i) => {
      if (!l.includes('`')) return;
      const t = l.trim();
      if (t === '`;' || t === '`' || t === '</style>`;' || /^(return|.*=)\s*`$/.test(t)) return;
      stray.push(`${rel}:${i + 1} — ${t.slice(0, 70)}`);
    });
    assert.deepEqual(stray, [], stray.join('\n'));
  });

  test('and its builders really run, which is where a balanced pair shows', () => {
    /* A balanced pair leaves the file PARSING and breaks it at CALL time, so
       reading the source is not enough — the function has to be run. */
    const vm = require('node:vm');
    const src = fs.readFileSync(path.join(ROOT, 'js/views/negotiation-css.js'), 'utf8');
    /* Enough of a document for the builders to reach the end of themselves.
       They inject a <style> element; nothing here asserts on that, only that
       the function completes and hands back a stylesheet. */
    /* Enough of a document for the builders to reach the end of themselves.
       redlineLayoutCss INJECTS a <style> rather than returning one, so what is
       captured is the text it assigned — which is the proof that wants making:
       the whole literal was evaluated without the string ending early. */
    const made = [];
    const el = () => { const e = { id: '', textContent: '', setAttribute(){},
      appendChild(){}, remove(){}, style: {}, classList: { add(){}, remove(){}, toggle(){} } };
      made.push(e); return e; };
    const ctx = { window: {},
      document: { getElementById: () => null, createElement: el, head: el(), body: el() },
      console, i18t: k => k, esc: x => x };
    vm.createContext(ctx);
    vm.runInContext(src, ctx);

    const layout = ctx.redlineLayoutCss || ctx.window.redlineLayoutCss;
    assert.equal(typeof layout, 'function', 'redlineLayoutCss is defined');
    layout();
    const sheet = made.map(e => e.textContent).join('');
    assert.ok(sheet.length > 500, 'redlineLayoutCss injected a whole stylesheet');
    assert.match(sheet, /\.rl-type-step\{/, 'and it reached the end of the file');

    const head = ctx.negoStyleHtml || ctx.window.negoStyleHtml;
    assert.equal(typeof head, 'function', 'negoStyleHtml is defined');
    const out = head();
    assert.ok(typeof out === 'string' && out.length > 500,
      'negoStyleHtml() returns a stylesheet');
  });

  /* THE RULE THIS WAS FOUND THROUGH, pinned by name. The check above would
     catch the cause anywhere; this one says the specific casualty is back, so
     a future edit that drops the rule some OTHER way still fails here. */
  test('.st-tab still declares its own box', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = html.match(/\n\s*\.st-tab\{([\s\S]*?)\}/);
    assert.ok(m, '.st-tab has a rule of its own');
    assert.match(m[1], /padding\s*:/, '.st-tab sets its own padding');
    assert.match(m[1], /border-bottom\s*:\s*2px solid transparent/,
      'and the transparent underline that reserves the row height');
  });

  /* AND IT IS THE ROOM TABS' BOX. The owner asked for these rows to be drawn
     like the contract room's (23 Aug 2026), so the two are pinned to each
     other as a RELATION — the numbers may move, they may not diverge. */
  test('.st-tab and .room-tab agree on the box', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const pad = cls => {
      const m = html.match(new RegExp('\\n\\s*\\.' + cls + '\\{([\\s\\S]*?)\\}'));
      return m && (m[1].match(/padding\s*:\s*([^;]+)/) || [])[1];
    };
    const gap = cls => {
      const m = html.match(new RegExp('\\n\\s*\\.' + cls + '\\{([\\s\\S]*?)\\}'));
      return m && (m[1].match(/gap\s*:\s*([^;]+)/) || [])[1];
    };
    assert.ok(pad('st-tab') && pad('room-tab'), 'both rules were found');
    assert.equal(String(pad('st-tab')).trim(), String(pad('room-tab')).trim(),
      'the tab hugs its text the same way on both');
    assert.equal(String(gap('st-tabs')).trim(), String(gap('room-tabs')).trim(),
      'and the row spaces them the same way');
  });
});
