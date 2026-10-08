'use strict';
/* F543 — THE MENU, THE ONE COPILOT DOOR, TWO BOARD FAULTS (Young, 7 Oct 2026,
   WORKORDER-menu-copilot-board-fixes.md)
     (W-1) ☰ is always in the bar and hides the whole menu at every width
           (8 Oct 2026); the choice is remembered (NAV_HIDE_KEY).
     (W-2) "Collapse menu" is a row at the foot of the menu; the small arrow
           at the top is gone.
     (W-3) the Copilot block at the foot is deleted; the bar's spark is the
           one door, drawn bigger.
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

test('(W-1) the menu button is in the bar at every width and names what it does', () => {
  const btn = html.match(/<button id="nav-toggle"[^>]*>/)[0];
  assert.doesNotMatch(btn, /display:\s*none/, 'the button is no longer hidden above the phone width');
  assert.match(btn, /data-i18n-title="sh_nav_hide"/);
  assert.match(html, /#top-header #nav-toggle\{display:grid/);
  const t = region(app, 'toggleNavHidden');
  /* RE-POINTED 8 Oct 2026 (Young: the menu must "completely remove from the
     screen as the mock up designed it"): ☰ hides the menu at EVERY width; below
     the float line it also closes the floating layer, never opens it. */
  assert.match(t, /localStorage\.setItem\(NAV_HIDE_KEY/, 'the choice is remembered at every width');
  assert.match(t, /if\(hide&&navDrawerActive\(\)\) setNavDrawer\(false\)/, 'hiding below the line also shuts the floating menu');
  assert.doesNotMatch(t, /setNavDrawer\(!/, 'it no longer opens the floating menu');
  const a = region(app, 'applyRail');
  assert.match(a, /const gone=navHidden\(\);/, 'hidden at every width');
  assert.match(region(app, 'paintNavToggle'), /const shown=!navHidden\(\);/, 'and its words follow that one answer');
  assert.match(a, /'0px'/, 'a hidden menu gives its whole column back');
  assert.match(a, /sideNav\.style\.display=gone\?'none':'flex'/);
  for (const k of ['sh_nav_hide', 'sh_nav_show', 'sh_rail_collapse', 'sh_rail_expand'])
    assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in both books');
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
  assert.match(html, /#top-header #cmd-ai\{width:36px;height:36px;color:var\(--bar-ink\);\}/);
  assert.match(html, /<button id="cmd-ai"[\s\S]{0,400}data-ai-badge/, 'the amber dot stays on the spark');
  assert.match(region(app, 'placeLanguageSwitch'), /#side-nav \.nav-foot/, 'the language switch has a home in the drawer');
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
