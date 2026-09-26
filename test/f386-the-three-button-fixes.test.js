/* f386 — THE THREE BUTTON FIXES (Young, 26 Sep 2026, over three screenshots:
   "image 1, buttons should never wrap text. Image two, the buttons should be the
   same size and likely the size of the needs your decision card. Image 3, some
   buttons have dark outlines when the common approach is a light grey outline."
   Then: "fix the three button issues first").

   The work order (WORKORDER-button-consistency.md) measured each in a real
   browser; this file pins what a source can honestly answer, and
   button-consistency-verify measures what only a rendered page knows (a label
   on one line, the edge each control really paints, the two cards' verbs side
   by side).

   RED AT THE PARENT (4082f9d, the commit that wrote the work order), 9 of 14: no list of
   families said nowrap, the row menu cell kept its full padding, Home's desk
   verbs were their own 28px family with the lead act filled on every row, and
   --btn-edge was the darker --rule-strong with three families naming their own
   edge. Claims marked [wall] and [control] pass on both sides by design.

   Run: node --test test/f386-the-three-button-fixes.test.js */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = read('index.html');
const HOME = read('js/views/home.js');
const REG = read('js/views/register.js');
const NCSS = read('js/views/negotiation-css.js');
const CAL = read('js/views/calendar.js');
const CORE = read('js/core.js');
const PF = read('js/views/portfolio.js');

/* The families the sweep found drawing a LABELLED button — short words, nothing
   block-level inside — across every page, the room's tabs, the Negotiate page
   and the main dialogs. */
const FAMILIES = ['ui-btn', 'ui-link', 'hm-rverb', 'hm-tri-b', 'hm-cz', 'sc-stage-act', 'cg', 'sec-f-n', 'reg-chip',
  'reg-seg', 'cal-seg', 'cal-link', 'tpl-btn-xs', 'std-open', 'sh-theme', 'nav-section-head', 'rl-btn', 'rl-livelist', 'rl-pb-btn'];

const nowrapList = () => {
  const m = HTML.match(/\n  :is\(([^)]*)\)\{white-space:nowrap;\}/);
  return m ? m[1].split(',').map(s => s.trim()).filter(Boolean) : null;
};

describe('f386 (1) a button\'s words never wrap', () => {
  test('ONE list says it, once, for every family', () => {
    const list = nowrapList();
    assert.ok(list, 'a single :is(...) rule states white-space:nowrap');
    for (const f of FAMILIES) assert.ok(list.includes('.' + f), '.' + f + ' is on the list');
    assert.equal((HTML.match(/\{white-space:nowrap;\}/g) || []).length >= 1, true);
  });
  test('every entry is ONE class, so the list keeps a single class\'s weight', () => {
    /* :is() takes the weight of its heaviest argument. One id or a second class
       in the list would silently lift every family above the rules that dress
       it, which is a cascade fight nobody would see in the source. */
    for (const s of nowrapList() || ['missing']) assert.match(s, /^\.[a-z][a-z0-9-]*$/, 'a lone class: ' + s);
  });
  test('[wall] no sheet tells a family to wrap after it', () => {
    const sheets = { 'index.html': HTML, 'js/views/negotiation-css.js': NCSS, 'js/views/calendar.js': CAL, 'js/views/register.js': REG };
    const hits = [];
    for (const [f, s] of Object.entries(sheets))
      for (const fam of FAMILIES)
        for (const m of s.matchAll(new RegExp('\\.' + fam + '(?![a-z0-9-])[^{}]*\\{[^}]*white-space:normal', 'g')))
          hits.push(f + ': ' + m[0].slice(0, 80));
    assert.deepEqual(hits, []);
  });
  test('the everyday button no longer promises a two-line label', () => {
    const at = HTML.indexOf('.ui-btn{display:inline-flex');
    const note = HTML.slice(at, HTML.indexOf('transition:', at));
    assert.ok(!/two-line label still grows/.test(note), 'the comment said the opposite of the rule');
  });
  test('the row menu\'s cell takes less side padding, so its square fits a 3% column', () => {
    /* MEASURED: 28px of column at a 1024 window against 22 + two ordinary
       paddings = 35. 2px a side is 26. The column keeps its percentage, so the
       widths still sum to 100. */
    assert.match(REG, /\.reg-table td\.reg-cell-menu\{overflow:visible;text-overflow:clip;padding:0 2px\}/);
    const w = REG.match(/const REG_COL_W\s*=\s*\[([^\]]+)\]/);
    assert.ok(w, 'the widths are declared');
    const cols = w[1].split(',').map(Number);
    assert.equal(cols.reduce((a, b) => a + b, 0), 100, '[control] they still sum to 100');
    const narrowest = (1024 - 64 - 32) * cols[cols.length - 1] / 100;
    assert.ok(22 + 2 * 2 <= narrowest, `22px square + 4px of padding fits ${narrowest.toFixed(1)}px`);
  });
});

describe('f386 (2) Home\'s two cards use one button size', () => {
  /* The one reading both rows ask, evaluated, not pattern-matched. */
  const fnSrc = (() => { const i = HOME.indexOf('function hmRowBtnCls('); return i < 0 ? '' : HOME.slice(i, HOME.indexOf('\n}\n', i) + 2); })();
  const cls = fnSrc ? new Function(fnSrc + '; return hmRowBtnCls;')() : null;
  test('ONE reading names the classes, and they are the ladder\'s own', () => {
    assert.ok(cls, 'hmRowBtnCls exists');
    assert.equal(cls(''), 'ui-btn ui-btn-sm hm-tri-b', 'an ordinary verb is the row rung');
    assert.equal(cls('is-p'), 'ui-btn ui-btn-sm ui-btn-accent hm-tri-b is-p', 'the lead act takes the accent\'s INK, not a fill');
    assert.equal(cls('is-plain'), 'ui-link hm-tri-b is-plain', 'Put away is the ladder\'s text button');
  });
  test('the desk\'s row and the dormant triage row both ask it', () => {
    const desk = HOME.slice(HOME.indexOf('function deskRowHtml('), HOME.indexOf('function deskRowHtml(') + 900);
    assert.match(desk, /const B=\(act,label,cls\)=>`<button type="button" class="\$\{hmRowBtnCls\(cls\)\}"/);
    assert.equal((HOME.match(/class="\$\{hmRowBtnCls\('(is-p|is-plain|)'\)\}" data-tri-act=/g) || []).length, 3,
      'the triage row\'s three verbs');
    assert.ok(!/class="hm-tri-b[" ]/.test(HOME), 'no row hands out the old class alone');
  });
  test('.hm-tri-b is a hook and states no box of its own', () => {
    const rules = [...HTML.matchAll(/\n  \.hm-tri-b(\.[a-z-]+)?\{([^}]*)\}/g)];
    assert.ok(rules.length >= 1, 'the rule is still there for the hook');
    for (const r of rules)
      assert.ok(!/height|padding|font-size|font-weight|background|border|color/.test(r[2]),
        'a box written here would beat the ladder by coming later: ' + r[0].trim());
  });
  test('[control] the decision card\'s verb is the row rung the desk now wears', () => {
    const r = HTML.match(/\n  \.hm-rverb\{([^}]*)\}/);
    assert.ok(r);
    assert.match(r[1], /height:var\(--ctl-h-sm\)/);
    assert.match(r[1], /padding:0 var\(--pad-ctl-x-sm\)/);
    assert.match(r[1], /font-size:var\(--t-meta\);font-weight:var\(--w-label\)/);
  });
});

describe('f386 (3) one light grey edge on every outlined control', () => {
  test('the token is the light grey by day and stays visible at night, each said once', () => {
    assert.match(HTML, /\n  :root\{ --btn-edge:var\(--color-divider\); \}/);
    assert.match(HTML, /\n  html\.dark\{ --btn-edge:var\(--rule-strong\); \}/);
    assert.equal((HTML.match(/--btn-edge:/g) || []).length, 2, 'one day value, one night value');
    assert.match(HTML, /--color-divider:#E2E7E5;/, 'the day value is the stepper\'s own light grey');
  });
  test('every family that named its own edge reads the token now', () => {
    const want = [
      [HTML, /\.doc-read-seg\{[^}]*border:1px solid var\(--btn-edge\)/, 'the Contract View switch'],
      [HTML, /\.doc-read-seg button \+ button\{\s*border-left:1px solid var\(--btn-edge\)/, 'and its seams'],
      [HTML, /\.hm-rverb\{[^}]*border:1px solid var\(--btn-edge\)/, 'Home\'s decision verb'],
      [HTML, /\.reg-filterbar \.reg-chip\{[^}]*border:1px solid var\(--btn-edge\)/, 'the Contracts filter chips'],
      [HTML, /\.reg-seg\{[^}]*border:1px solid var\(--btn-edge\)/, 'the Contracts switch'],
      [HTML, /\.reg-seg button \+ button\{border-left:1px solid var\(--btn-edge\);\}/, 'and its seam'],
      [HTML, /\.ui-btn-secondary\{[^}]*border-color:var\(--btn-edge\)/, 'the secondary button'],
      [HTML, /\.rl-np-send\{[^}]*border:1px solid var\(--btn-edge\)/, 'the notes drawer\'s Add note'],
      [NCSS, /\.redline-page \.rl-cp-head \.rl-segwrap\{[^}]*border:1px solid var\(--btn-edge\)/, 'the seat switch and the clause panel\'s pair'],
      [NCSS, /\.rl-segwrap \.rl-seg \+ \.rl-seg\{border-left:1px solid var\(--btn-edge\)\}/, 'and their seam'],
      [NCSS, /\.rl-type-step\{height:28px;[^}]*border:1px solid var\(--btn-edge\)/, 'the text-size stepper'],
      [NCSS, /html\.dark \.rl-type-step\{[^}]*border-color:var\(--btn-edge\)/, 'and its night rule'],
      [NCSS, /\.redline-page \.rl-q-tab\{[^}]*border:1px solid var\(--btn-edge\)/, 'the queue tab'],
      [NCSS, /\.redline-page \.rl-pb-btn\{[^}]*border:1px solid var\(--btn-edge\)/, 'the playbook button'],
      [NCSS, /\.redline-page #ws-head \.rl-pb-btn\{[^}]*border:1px solid var\(--btn-edge\)/, 'and its head-row dress'],
      [CAL, /\.cal-seg\{[^}]*border:1px solid var\(--btn-edge\)/, 'the calendar\'s switches'],
      [CAL, /\.cal-seg > :is\(span,a,button\) \+ :is\(span,a,button\)\{border-left:1px solid var\(--btn-edge\)\}/, 'and their seams'],
      [CORE, /border:1px solid \$\{on\?'var\(--color-accent\)':'var\(--btn-edge\)'\}/, 'the Send dialog\'s purpose buttons'],
      [PF, /data-pf-fixcats style="[^"]*border:1px solid var\(--btn-edge\)/, 'Insights\' Read them now'],
    ];
    for (const [src, re, what] of want) assert.match(src, re, what);
  });
  test('[control] a switch still FILLS its lit half — the fill says which is on', () => {
    assert.match(HTML, /\.doc-read-seg button\[aria-pressed="true"\]\{ background:var\(--accent-fill\); color:#fff;/);
    assert.match(NCSS, /\.redline-page \.rl-cp-head \.rl-segwrap \.rl-seg\.on\{background:var\(--color-accent-700\);color:#fff;/);
    assert.match(CAL, /\.cal-seg span\.on,\.cal-seg a\.on,\.cal-seg button\.on\{background:var\(--color-accent-700\);color:#fff;/);
  });
  test('[wall] a text box keeps its own stronger edge — it tells a reader where to type', () => {
    assert.match(HTML, /--field-line:#8A9795;/);
    assert.match(CORE, /const HATI_FLD='width:100%;height:var\(--field-h\);[^']*var\(--field-line/);
  });
  test('[wall] a filled button\'s edge is its fill', () => {
    const all = [...HTML.matchAll(/\n  \.ui-btn-primary\{[^}]*\}/g)].map(m => m[0]);
    assert.ok(all.length >= 1);
    assert.ok(all.some(r => /border-color:var\(--accent-fill\)|border:1px solid var\(--accent-fill\)/.test(r)), 'the filled act keeps its own edge');
  });
});
