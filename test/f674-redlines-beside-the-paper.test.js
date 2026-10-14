'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f674 — REDLINES, BESIDE THE PAPER (the one-page Home plan, stage 3; the
   owner picked "Column" by name on 14 Oct 2026, with all three
   recommendations: the paper turns Redlined while the face is open and back
   when it closes; every door from outside opens the face, the Negotiate page
   staying on the rail until stage 5; notes stay on Negotiate until stage 5)

   (1) ONE BUILDER, TWO HOSTS: the Negotiate page's column is rlColumnHtml,
       called by the page (redlinePanesHtml) and by Jambo's Redlines face
       (pdRedFaceHtml); the face is handed the page's own options
       (rlBenchOpts) and the page's own wiring; paperdesk.js copies no pile,
       row or verb builder.
   (2) THE FACE'S DOOR IS THE PAGE'S DOOR: pdRedOpen asks
       openRedlineWorkbench, whose sealed wall and blanks ask come before it
       hands over to the face; the phone carries on to its own page.
   (3) THE PAPER: Redlined while the face is open (igRedOn reads pdRedFor), a
       press on Clean still wins, and closing leaves what was there.
   (4) EVERY DOOR FROM OUTSIDE: the word, the checklist's waiting-redlines
       and suggestion rows, the bell's negotiation, suggestion and quiet-desk
       rows, the list panels' Negotiation door and Fill in's next step open the
       face. A REVIEW's rows still open the page: handing it back is the page's
       review notice, which the face does not draw.
   (5) A row's note count opens Negotiate on that change, with its notes.
   (6) Edit and Counter open the clause editor over Home; its repaint is the
       face's, which keeps the column's place.
   (7) Shown only for its contract on Jambo's tab; another contract, or a
       question asked, puts it away.
   AT THE PARENT every claim FAILS: none of these names exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const NEGO = R('js/views/negotiation.js');
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const APP = R('js/app.js');
const HOME = R('js/views/home.js');
const INS = R('js/views/inspector.js');
const CA = R('js/copilotacts.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

describe('f674 (1) one column, two hosts', () => {
  test('1a the page draws its column through rlColumnHtml, once', () => {
    const panes = strip(fnBody(NEGO, 'redlinePanesHtml'));
    assert.match(panes, /\$\{rlColumnHtml\(c, opts\)\}/);
    assert.doesNotMatch(panes, /<aside class="rl-col rl-side/, 'the column markup lives in its builder');
    const col = strip(fnBody(NEGO, 'rlColumnHtml'));
    assert.match(col, /<aside class="rl-col rl-side/);
    assert.match(col, /redlineChangeCardsHtml\(c, \{ \.\.\.opts, cpPanel: opts\.cpPanel !== false \}\)/, 'the page keeps its clause panel door; a host without one says so');
    assert.match(col, /rlUnsentSendHtml\(c, opts\)/);
    assert.match(col, /rlRisksPileHtml\(c, \{ \.\.\.opts, side \}\)/);
    assert.match(col, /\$\{opts\.headEnd \|\| ''\}/, 'a host\'s own way out rides the head');
  });
  test('1b the face is that builder, with the page\'s own options and wiring', () => {
    const html = strip(fnBody(PD, 'pdRedFaceHtml'));
    assert.match(html, /rlColumnHtml\(c, pdRedOpts\(c\)\)/);
    assert.match(html, /class="redline-page rl-face"/, 'the column\'s clothes are scoped to .redline-page');
    const opts = strip(fnBody(PD, 'pdRedOpts'));
    assert.match(opts, /rlBenchOpts\(c, \{ side: 'owner', hostId: 'pd-redface', again: pdRedRepaint, scope: '#pd-redface' \}\)/);
    assert.match(opts, /cpPanel: false/);
    const paint = strip(fnBody(PD, 'pdRedFacePaint'));
    ['wireNegotiationTab(c, opts)', 'negoAfterPaint(c, opts, host)', 'rlWireClauseTools(c, host, opts)', 'redlineSyncProxies(host)'].forEach(w =>
      assert.ok(paint.includes(w), w));
    assert.match(paint, /rlBenchCatchUp\(c,/, 'the thread and the share list are loaded as the page loads them');
  });
  test('1c the page builds its options and catch-up from the same two functions', () => {
    const rr = strip(fnBody(NEGO, 'renderRedline'));
    assert.match(rr, /const opts = rlBenchOpts\(c, \{ side \}\);/);
    assert.match(rr, /rlBenchCatchUp\(c, \(\) =>/);
    const bo = strip(fnBody(NEGO, 'rlBenchOpts'));
    assert.equal((bo.match(/renderRedline\(\)/g) || []).length, 1, 'every repaint is the host\'s; the page is only the default');
    assert.match(bo, /rerender: \(\) => again\(\)/);
    assert.match(bo, /`\$\{scope\} \[data-rl-send\], \$\{scope\} \[data-rl-blast\]`/, 'the send buttons grey on the host that pressed');
  });
  test('[wall] 1d paperdesk.js copies no pile, row or verb builder (true before stage 3 too; it must stay true)', () => {
    const pd = strip(PD);
    ['RL_CARD_BANDS', 'rlRowFaceVerbs', 'redlineChangeCardsHtml(', 'negoResolve(', 'negoFileChange(', 'changes.push('].forEach(w =>
      assert.ok(!pd.includes(w), w + ' is not in the face'));
  });
  test('1e the foot is the page\'s three acts from their own builders', () => {
    const foot = strip(fnBody(PD, 'pdRedFootHtml'));
    assert.match(foot, /rlPrepareRowHtml\(c, false\)/);
    assert.match(foot, /rlEditClauseBtnHtml\(c, o, 'owner'/);
    assert.match(foot, /rlAddClauseBtnHtml\(c, o, 'owner'/);
    const ed = strip(fnBody(NEGO, 'rlEditClauseBtnHtml'));
    assert.match(ed, /to === 'panel' && opts\.cpPanel === false\) \? i18t\('ce_too_narrow'\)/, 'no clause panel here: greyed with the reason');
  });
});

describe('f674 (2) the face\'s door is the page\'s door', () => {
  test('2a pdRedOpen asks openRedlineWorkbench for the face', () => {
    assert.match(strip(fnBody(PD, 'pdRedOpen')), /openRedlineWorkbench\(id, \{ face: true \}\)/);
  });
  test('2b the sealed wall and the blanks ask come first', () => {
    const w = strip(fnBody(NEGO, 'openRedlineWorkbench'));
    const wall = w.indexOf('negoMayStart(held).ok'), blanks = w.indexOf('negoBlanksAsk(held)'), face = w.indexOf('opts.face && typeof window.pdRedLand');
    assert.ok(wall > 0 && blanks > wall && face > blanks, 'wall, then blanks, then the face');
    assert.ok(face < w.indexOf("setView('redline')"), 'the face is taken before the page is drawn');
  });
  test('2c the phone carries on to its own page', () => {
    const land = strip(fnBody(PD, 'pdRedLand'));
    assert.match(land, /window\.innerWidth < 768/);
    assert.match(land, /return false/);
    assert.match(land, /pdOpenOnHome\(id, 'red'\)/);
  });
});

describe('f674 (3) the paper turns Redlined while the face is open', () => {
  test('3a igRedOn reads pdRedFor, and a press on Clean still wins', () => {
    const r = strip(fnBody(IG, 'igRedOn'));
    assert.match(r, /pdRedFor\(\)===String\(p\.id\)/);
    assert.match(r, /p\.red===true\|\|\(p\.red!==false&&/);
  });
  test('3b opening lets go of a Clean chosen before; nothing is stored', () => {
    const p = strip(fnBody(PD, 'pdRedPaper'));
    assert.match(p, /intel\.paper\.red === false\) delete intel\.paper\.red/);
    assert.match(p, /if \(_pdRed &&/, 'only while the face is open');
  });
  test('3c the line under a stacked clause wears Negotiate\'s clothes on Home\'s paper too', () => {
    const css = R('js/views/negotiation-css.js');
    assert.match(css, /:is\(\.redline-page, \.ig-redpaper\) \.rl-baseline\{display:flex/);
    assert.match(css, /\.ig-redpaper\.is-clean \.rl-baseline\{display:none\}/);
  });
});

describe('f674 (4) every door from outside opens the face', () => {
  test('4a the word', () => {
    assert.match(CA, /redline: c => \(typeof pdRedOpen === 'function'\) \? pdRedOpen\(c\.id\)/);
  });
  test('4b the checklist\'s waiting redlines and suggestions; a review still on the page', () => {
    const g = strip(fnBody(HOME, 'needsYouGo'));
    assert.match(g, /openRedlineWorkbench\(c\.id, kind==='review' \? \{\} : \{ face: true \}\)/,
      'handing a review back is the page\'s review notice, which the face does not draw');
  });
  test('4c the bell\'s negotiation, suggestion and quiet-desk rows; its review rows still on the page', () => {
    const b = strip(APP.slice(APP.indexOf('function buildAlerts'), APP.indexOf('function alertCount')));
    const rv = b.slice(b.indexOf("push('review-mine'"), b.indexOf("deskSuggestionsFor || window.deskSuggestionsBackTo"));
    const face = (b.match(/openRedlineWorkbench\((?:x\.)?c\.id, \{ face: true \}\)/g) || []).length;
    assert.ok(face >= 3, 'negotiation, suggestion, quiet desk: ' + face);
    assert.equal((rv.match(/openRedlineWorkbench\(c\.id\)/g) || []).length, 3, 'the three review rows');
    assert.equal((rv.match(/face: true/g) || []).length, 0);
  });
  test('4d the list panels\' Negotiation door', () => {
    assert.match(INS, /if \(insNegoDoorState\(c\)\.ok\) openRedlineWorkbench\(c\.id, \{ face: true \}\)/);
  });
  test('4e Fill in\'s next step', () => {
    assert.match(strip(fnBody(PD, 'pdFillDoneHtml')), /pdRedOpen\(c\.id\)/);
  });
});

describe('f674 (5) notes stay on Negotiate until stage 5', () => {
  test('5 a row\'s note count opens Negotiate on that change, and the page\'s own press shows its notes', () => {
    const w = strip(fnBody(PD, 'pdRedWire'));
    assert.match(w, /closest\('\[data-rl-notes\]'\)/);
    assert.match(w, /e\.stopPropagation\(\)/, 'the document\'s own note dialog does not open over Home');
    assert.match(w, /openRedlineWorkbench\(c\.id\)/);
    assert.match(w, /#view-redline \[data-rl-notes="\$\{q\}"\]/);
  });
});

describe('f674 (6) Edit and Counter open the editor over Home; Exit lands back', () => {
  test('6a the editor\'s repaint is the face\'s, through the page\'s own door', () => {
    const w = strip(fnBody(NEGO, 'wireNegotiationTab'));
    assert.match(w, /rlOpenClauseEditor\(c, clauseId,\s*\{ \.\.\.opts, side, again,/);
    assert.match(strip(fnBody(PD, 'pdRedOpts')), /again: pdRedRepaint/);
  });
  test('6b the repaint keeps the column\'s place, and so does any panel repaint', () => {
    const rp = strip(fnBody(PD, 'pdRedRepaint'));
    assert.match(rp, /const top = pdRedScrollOf\(\)/);
    assert.match(rp, /_pdRedTop = top/);
    const dock = strip(fnBody(IG, 'renderIntelDock'));
    assert.match(dock, /const _redTop=\(typeof window\.pdRedScrollOf==='function'\)\?pdRedScrollOf\(\):0;/);
    assert.match(dock, /pdRedFacePaint\(pc,_redTop\)/);
  });
  test('6c a card press finds the clause on Home\'s paper', () => {
    const lf = strip(fnBody(NEGO, 'rlLinkFocus'));
    assert.match(lf, /document\.querySelector\('\.redline-page\.rl-face'\)/);
    assert.match(lf, /homePaper\.querySelector\('\[data-nego-card-anchor~="'/);
    const pw = strip(fnBody(PD, 'pdRedPaperWire'));
    assert.match(pw, /if \(!pdRedShows\(\)\) return;/);
    assert.match(pw, /rlLinkFocus\(c, id, 'clause'\)/);
  });
});

describe('f674 (7) shown only for its contract, on Jambo\'s tab', () => {
  test('7a the face draws only while the paper holds its contract', () => {
    const s = strip(fnBody(PD, 'pdRedShows'));
    assert.match(s, /_pdTab !== 'copilot' \|\| !pdOnPaper\(\)/);
    assert.match(s, /String\(c\.id\) === _pdRed/);
  });
  test('7b another contract, or a question, puts it away; Fill in and Redlines are one at a time', () => {
    assert.match(strip(fnBody(IG, 'igAnalyze')), /pdRedSeen\(id\)/);
    assert.match(IG, /if\(typeof window\.pdRedAway==='function'\) pdRedAway\(\);/);
    const open = strip(fnBody(PD, 'pdOpenOnHome'));
    assert.match(open, /_pdFill = String\(id\); _pdRed = null;/);
    assert.match(open, /_pdRed = String\(id\); _pdFill = null;/);
  });
  test('7c the panel draws the face where the conversation stands, the box at its foot', () => {
    const dock = strip(fnBody(IG, 'renderIntelDock'));
    assert.match(dock, /pdRedShows\(\)\)\?`<div id="pd-redface" class="pd-redface flex-1 min-h-0">\$\{pdRedFaceHtml\(pdContract\(\)\)\}<\/div><div id="igd-feed" hidden><\/div>`/);
  });
});
