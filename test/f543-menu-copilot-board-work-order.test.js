'use strict';
/* F543 — THE MENU, THE ONE COPILOT DOOR, TWO BOARD FAULTS (Young, 7 Oct 2026,
   WORKORDER-menu-copilot-board-fixes.md)
     (W-1) ☰ is always in the bar and hides the whole menu at every width
           (8 Oct 2026); the choice is remembered (NAV_HIDE_KEY).
     (W-2) "Collapse menu" is a row at the foot of the menu; the small arrow
           at the top is gone.
     (W-3) the Copilot block at the foot is deleted; the bar's spark is the
           one door, drawn bigger. (Since 20 Oct 2026, Chambers: the spark is
           the bar's quieter ink, and the language is set in Settings › You.)
     (W-4) a step counter never passes its limit: once the steps are used the
           run says it is writing.
     (W-5) a ring in a narrow story chapter stands tall: legend under the
           ring, drawn narrow enough that nothing is cut off or scrolls. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}
const html = read('index.html'), app = read('js/app.js'), hb = read('js/views/homeboard.js'), i18n = read('js/i18n.js');

test('(W-1) the ☰ that hid the whole menu is gone, and nobody is left hidden', () => {
  /* RE-POINTED 12 Oct 2026 (owner: "delete the highlighted button
     functionality for excluding the nav panel"): no button, no hiding, and a
     choice remembered from before is cleared so the menu comes back. */
  assert.doesNotMatch(html, /id="nav-toggle"/, 'the button is gone');
  assert.doesNotMatch(html, /#nav-toggle/, 'and its rules');
  assert.doesNotMatch(app, /function (toggleNavHidden|navHidden|paintNavToggle)\b/);
  assert.match(app, /localStorage\.removeItem\(NAV_HIDE_KEY\)/, 'an old hidden menu comes back');
  const a = region(app, 'applyRail');
  assert.doesNotMatch(a, /nav-hidden|'0px'/, 'the menu never gives its column away');
  for (const k of ['sh_nav_hide', 'sh_nav_show', 'sh_rail_collapse', 'sh_rail_expand'])
    assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in both books (inert where retired)');
});

test('(W-2) "Collapse menu" sits at the foot; the arrow at the top is gone', () => {
  const head = html.slice(html.indexOf('<div class="rail-head">'), html.indexOf('<nav id="nav"'));
  assert.doesNotMatch(head, /cmd-rail/, 'no toggle left in the menu head');
  const foot = html.slice(html.indexOf('<div class="nav-foot">'), html.indexOf('<div class="foot-wrap"'));
  assert.match(foot, /id="cmd-rail"/);
  assert.match(foot, /class="rf-label" data-i18n="sh_rail_collapse"/);
  assert.match(region(app, 'paintRailToggle'), /sh_rail_collapse':'sh_rail_expand'/, 'the words follow the state');
});

test('(W-3) one Copilot door: the foot block is gone, the bar spark is bigger', () => {
  assert.doesNotMatch(html, /id="side-copilot"/);
  assert.doesNotMatch(app, /getElementById\('side-copilot'\)/);
  /* RE-POINTED 20 Oct 2026 (CHAMBERS, owner-picked by name): the bar is white
     and the spark is its quieter ink, --bar-ink-2, with a 17px mark; still the
     bigger 36px door. */
  assert.match(html, /#top-header #cmd-ai\{width:36px;height:36px;color:var\(--bar-ink-2\);\}/);
  assert.match(html, /#top-header #cmd-ai svg\{width:17px;height:17px;\}/);
  assert.match(html, /<button id="cmd-ai"[\s\S]{0,400}data-ai-badge/, 'the amber dot stays on the spark');
  /* RE-POINTED 20 Oct 2026: the bar's language switch is gone (CHAMBERS) and
     with it the painter that gave it a home in the drawer; the language is
     changed in Settings › You, whose buttons write through langSet. */
  assert.doesNotMatch(html, /id="lang-switch"/, 'no language switch in the bar');
  /* By name in the CODE, comments stripped (a history note may still name
     it): not only `function placeLanguageSwitch(` — a const or a call left
     behind would be the same painter by another spelling. */
  const appCode = app.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(appCode, /\bplaceLanguageSwitch\b/, 'nor the painter that moved it');
  const st = read('js/views/settings.js');
  assert.match(st, /data-st-lang="\$\{esc\(l\.id\)\}"/, 'Settings › You draws the language buttons');
  assert.match(st, /closest\('\[data-st-lang\]'\)[\s\S]{0,300}langSet\(id\)/, 'and they write through langSet');
});

test('(W-4) a step counter never passes its limit', () => {
  const ctx = vm.createContext({ HB_DD_STEPS: 5 });
  vm.runInContext(region(hb, 'hbStepInProgress'), ctx);
  const f = (n, max) => ctx.hbStepInProgress({ steps: Array(n).fill({}), max });
  assert.equal(f(0, 15), 1);
  assert.equal(f(14, 15), 15);
  assert.equal(f(15, 15), null, 'all 15 used: writing, never "16 of up to 15"');
  assert.equal(f(5), null, 'the board’s own limit when none is stated');
  assert.match(region(hb, 'hbDdStepsHtml'), /hb_dd_writing/);
  assert.ok(hb.includes("hbStepInProgress(run) ? i18t('hb_sy_going'") && hb.includes(": i18t('hb_sy_deep_writing')"), 'the story pill caps too');
});

test('(W-5) a ring in a narrow chapter stands tall, legend under it', () => {
  const r = region(hb, 'hbRingSvg');
  /* Re-pointed 7 Oct 2026 (work order O-22): both shapes take the card's
     measured width where it has one. Re-pointed again 8 Oct 2026: a ring ON
     A BOARD CARD keeps the step's height, so it sits beside its legend there;
     off a card (a story chapter) a narrow ring still stands tall. */
  assert.match(r, /const tall = !fitted && \(!!\(D && D\.narrow\) \|\| \(fw > 0 && fw < 760\)\)/);
  assert.match(r, /W = tall \? \(fw \|\| 440\) : \(fw \|\| 1000\)/, 'narrow enough to fit a chapter at the board’s 12px floor');
  assert.match(r, /legY = tall \? 2 \* R \+ 44/, 'the legend starts under the ring');
  const ch = region(hb, 'hbStoryChapterHtml');
  assert.ok(ch.indexOf('D.narrow = !wide') > -1 && ch.indexOf('D.narrow = !wide') < ch.indexOf('hbStoryPicHtml('), 'decided before the picture is drawn');
  assert.match(html, /\.hb-sy-pic \.hb-ring\.is-tall\{max-width:520px/);
});
