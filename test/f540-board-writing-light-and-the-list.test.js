'use strict';
/* F540 — THE SAME EVENING'S SMALLER ORDERS (Young, 6 Oct 2026)
     (1) The board's writing is not bland: hbSay escapes first, then draws
         Copilot's good/bad marks and bold, bolds figures, and colours plainly
         good or bad words outside a negation. Every Copilot paragraph on the
         board goes through it; the prompts ask for the marks.
     (2) The board lands Light, Light before Dark; Explorer is always dark.
     (3) Present opens with no tool; the Pointer button turns it on.
     (4) HaTi's list closes on any press outside it, even for a select with no
         label round it, and leaving Edit with Copilot takes it away. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
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
const HB = read('js/views/homeboard.js');
function board(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: [], settings: {}, view: 'dashboard' };
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(HB);
  return w;
}

test('f540 (1) hbSay: marks, figures and plain good/bad words, escaped first', () => {
  const w = board();
  const h = w.hbSay('Signing took [[bad:12 days longer]], and **SEK 1.2M** is at risk. [[good:Leases signed on time]].');
  assert.match(h, /<span class="hb-bad">12 days longer<\/span>/);
  assert.match(h, /<b>SEK 1\.2M<\/b>/);
  assert.match(h, /<span class="hb-good">Leases signed on time<\/span>/);
  assert.match(h, /is <span class="hb-bad">at risk<\/span>/, 'a plainly bad word is red without a mark');
  const g = w.hbSay('4 contracts expired; 75% grew. No contracts are overdue.');
  assert.match(g, /<b class="hb-num">4 contracts<\/b>/);
  assert.match(g, /<b class="hb-num">75%<\/b>/);
  assert.match(g, /<span class="hb-bad">expired<\/span>/);
  assert.match(g, /<span class="hb-good">grew<\/span>/);
  assert.doesNotMatch(g, /hb-bad">overdue/, 'a negated bad word is not red');
  const x = w.hbSay('A <script>alert(1)</script> & MK-106 [[good:<img src=x>]]');
  assert.doesNotMatch(x, /<script|<img/, 'nothing Copilot wrote becomes markup');
  assert.doesNotMatch(x, /MK-<b/, 'a contract reference is not a figure');
  assert.equal(w.hbSayPlain('[[good:on time]] and **SEK 5M**'), 'on time and SEK 5M');
  /* every Copilot paragraph on the board is drawn by hbSay */
  for (const f of ['hbStoryHtml', 'hbStoryDeepHtml', 'hbDdHtml'].filter(n => HB.includes('function ' + n + '(')))
    assert.doesNotMatch(code(region(HB, f)), /_hbE\((?:words\.lead|para|run\.summary|c\.text|w\.text|a\.why)\)/, f + ' escapes without hbSay');
  assert.doesNotMatch(HB, /aiRichText\((?:kept\.text|run\.summary)\)/);
  /* the prompts ask for the marks, in the browser and on the server */
  assert.match(code(region(HB, 'hbStoryPrompt')), /HB_SAY_RULE/);
  assert.match(code(region(HB, 'hbSummaryPrompt')), /HB_SAY_RULE/);
  assert.match(read('server/server.js'), /'Three to five plain sentences:[^']*' \+ BOARD_SAY_RULE/);
  /* the lead fills the card */
  assert.doesNotMatch(read('index.html'), /\.hb-sy-lead\{[^}]*max-width:78ch/);
});

/* RE-POINTED 7 Oct 2026 (Young, "Follow dark mode"): with no screen of the
   reader's own the board is Light by day and Dark at night; a press on the
   board's Light | Dark is kept and wins. */
test('f540 (2) the board lands Light by day, Dark at night, the reader\'s press wins; Explorer is always dark', () => {
  const w = board();
  w.darkNow = () => false;
  assert.equal(w.hbS().screen, null, 'no screen of the reader\'s own');
  assert.equal(w.hbScreenNow(), 'light', 'by day');
  w.darkNow = () => true;
  assert.equal(w.hbScreenNow(), 'dark', 'at night');
  w.hbS().screen = 'light'; w.hbS().scrPick = 1;
  assert.equal(w.hbScreenNow(), 'light', 'a pressed Light holds at night');
  w.hbS().screen = null; w.hbS().scrPick = 0; w.darkNow = () => false;
  w.hbS().face = 'explorer';
  assert.equal(w.hbScreenNow(), 'dark', 'Explorer is dark whatever the board wears');
  const head = w.hbHeadHtml('');
  assert.match(head, /<div class="hb-seg hb-scr"[^>]* hidden/, 'no Light/Dark on Explorer');
  w.hbS().face = 'board';
  const h2 = w.hbHeadHtml('');
  assert.ok(h2.indexOf('data-hb-screen="light"') < h2.indexOf('data-hb-screen="dark"'), 'Light before Dark');
  /* a screen saved before the ruling is not kept; one the reader pressed is */
  assert.match(code(region(HB, 'hbS')), /HB_SCREENS\.includes\(v\.screen\) && v\.scrPick === 1/);
  assert.match(read('index.html'), /#hb-head \.hb-scr\[hidden\]\{display:none\}/);
});

test('f540 (3) Present opens with no tool', () => {
  const p = code(region(HB, 'hbPresent'));
  assert.match(p, /if \(on\)\{ _hbTool = '';/);
  assert.doesNotMatch(p, /_hbTool = 'pointer'/);
});

test('f540 (4) the list closes on a press outside it, and leaves with the editor', () => {
  const core = read('js/core.js');
  const arm = code(region(core, '_selMenuArmDoc'));
  assert.match(arm, /const anchor = _selMenuFor && _selMenuFor\.isConnected \? _selMenuAnchorEl\(_selMenuFor\) : null;/);
  assert.match(arm, /if \(anchor && ev\.target && ev\.target\.closest/);
  assert.match(code(region(read('js/views/clauseeditor.js'), 'rlCloseClauseEditor')), /selectMenuClose\(\)/);
  /* driven: a select with no label, its list open, a press elsewhere */
  /* the list's own code, from where it is declared to its wiring's end, run in a real DOM */
  const w = buildWorld({}).win;
  const a = core.indexOf('let _selMenuEl'), b = core.indexOf('function selectMenuSweep(');
  assert.ok(a > 0 && b > a, 'the list lives in core.js');
  w.eval(core.slice(a, b).replace(/^let /m, 'var ') + '\nwindow.selectMenuStandsDown = () => false; window.selectMenuOpen = selectMenuOpen; window.selectMenuShowing = selectMenuShowing; window.selectMenuWire = selectMenuWire;');
  const d = w.document;
  const sel = d.createElement('select'); sel.innerHTML = '<option>A</option><option>B</option>'; d.body.appendChild(sel);
  const out = d.createElement('button'); d.body.appendChild(out);
  w.selectMenuWire(d.body, 'select');
  w.selectMenuOpen(sel);
  assert.equal(w.selectMenuShowing(), true);
  const ev = new w.Event('pointerdown', { bubbles: true }); out.dispatchEvent(ev);
  assert.equal(w.selectMenuShowing(), false, 'a press outside closes it');
});
