/* ============================================================
   f265 — a pop-up window you can move out of the way
   ============================================================
   Owner-asked, 1 Sep 2026:

     "Make it so that the pop-up window with the notes regarding the redline can
      be dragged around the screen if needed. In fact, make all pop-up windows
      have the ability to be moved around."

   The recommendation the owner took: you grab a window by its TOP, the way
   Word, Windows and SAP's own dialogs are grabbed; it can never be put
   somewhere you cannot reach it; and it comes back to the middle next time.

   WHAT IS ASSERTED HERE AND WHAT IS NOT. jsdom lays nothing out, so every rect
   below is a stub and what these claims are about is the RULES — which press
   takes hold of a window, where it may and may not be put, what a reset
   restores, and that moving one writes nothing anywhere. That the window
   actually moves under a real mouse is measured in window-drag-verify, which is
   the only place it can be.

   The helper is lifted out of js/core.js between named landmarks and run in a
   window of its own: it is the shipped code, not a copy, and the first test
   fails if either landmark moves.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const dragSource = () => {
  const src = read('js/core.js');
  const from = src.indexOf('const DLG_GRAB_H');
  const to = src.indexOf('\nfunction openModal(html, opts={}){');
  assert.ok(from > 0 && to > from, 'the drag block is still where this test reads it');
  return src.slice(from, to);
};

/* A window of the shape every pop-up in this product has: a fixed full-screen
   frame, a scrim, and a panel with its own inline position, width and
   max-width — which is what makes the reset claim below worth making. */
const PANEL_STYLE = 'position:relative;width:100%;max-width:32rem;';
const stage = (opts = {}) => {
  const dom = new JSDOM(
    `<div id="frame" style="position:fixed;inset:0;display:grid;place-items:center">
       <div id="scrim" style="position:absolute;inset:0"></div>
       <div id="panel" role="dialog" style="${PANEL_STYLE}">
         <h3 id="head">Note on CHG-011</h3>
         <button id="x">close</button>
         <input id="box"/>
         <p id="body">the wording</p>
       </div>
     </div>`, { runScripts: 'outside-only' });
  const win = dom.window;
  if (opts.width != null) Object.defineProperty(win, 'innerWidth', { value: opts.width, configurable: true });
  if (opts.height != null) Object.defineProperty(win, 'innerHeight', { value: opts.height, configurable: true });
  /* `const` at the top of an eval makes a lexical binding rather than a
     property of the window; in the running app these three leave core.js on
     its own export line, which section 4 asserts. */
  win.eval(dragSource()
    + ';window.DLG_GRAB_H=DLG_GRAB_H;window.DLG_KEEP=DLG_KEEP;window.DLG_MIN_W=DLG_MIN_W;');
  const panel = win.document.getElementById('panel');
  /* THE ONE THING A STUB HAS TO SUPPLY, because jsdom lays nothing out. The
     window sits at 300,200 and is 400 x 300 — the middle of a 1200 x 800
     screen, which is where a centred dialog really lands. */
  const rect = opts.rect || { left: 300, top: 200, width: 400, height: 300 };
  panel.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width,
    bottom: rect.top + rect.height, x: rect.left, y: rect.top });
  return { win, panel, frame: win.document.getElementById('frame'), rect };
};
/* A press. jsdom has no PointerEvent, and MouseEvent carries every field this
   helper reads — clientX/clientY, button and target — so the listeners see
   exactly what a browser would give them apart from pointerId, which the
   helper is written to tolerate (a capture that cannot be taken is not a
   failure; see the try/catch it sits in). */
const press = (win, el, type, x, y) => {
  const e = new win.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  el.dispatchEvent(e);
  return e;
};
const dragBy = (s, dx, dy, from) => {
  const start = from || { x: s.rect.left + 40, y: s.rect.top + 10 };
  press(s.win, s.panel, 'pointerdown', start.x, start.y);
  press(s.win, s.win.document, 'pointermove', start.x + dx, start.y + dy);
  press(s.win, s.win.document, 'pointerup', start.x + dx, start.y + dy);
};
const at = panel => ({ left: parseFloat(panel.style.left), top: parseFloat(panel.style.top) });

/* ============================================================
   1 — IT CAN NEVER BE PUT WHERE YOU CANNOT REACH IT
   ============================================================ */
describe('f265 · a window stays on the screen', () => {

  test('the top never goes above the ceiling — the strip you grab it by is always there', () => {
    const s = stage();
    const p = s.win.dialogClampXY(300, -400, 400, 300);
    assert.equal(p.y, 0, 'dragged hard upwards it stops at the top of the screen');
  });

  test('some of it always stays on screen, in every direction', () => {
    const s = stage({ width: 1200, height: 800 });
    const keep = s.win.DLG_KEEP;
    const far = s.win.dialogClampXY(9999, 9999, 400, 300);
    assert.equal(far.x, 1200 - keep, 'it stops before the right edge swallows it');
    assert.equal(far.y, 800 - keep, 'and before the bottom does');
    const left = s.win.dialogClampXY(-9999, 10, 400, 300);
    assert.equal(left.x, keep - 400, 'and a strip of it is left at the left edge too');
  });

  test('a window smaller than the margin is not clamped to nothing', () => {
    const s = stage({ width: 1200, height: 800 });
    const p = s.win.dialogClampXY(-9999, 10, 60, 40);
    assert.equal(p.x, 0, 'the whole of a small window stays on screen rather than half of it');
  });

  test('nothing drags on a narrow window, where there is nowhere to move it to', () => {
    const s = stage({ width: 600 });
    assert.equal(s.win.dialogMayDrag(), false);
    s.win.dragDialog(s.panel);
    dragBy(s, 120, 60);
    assert.equal(s.panel.style.position, 'relative', 'the window did not move, and did not get pinned');
    assert.equal(s.panel.dataset.dlgMoved, undefined);
  });
});

/* ============================================================
   2 — WHERE YOU GRAB IT
   ============================================================ */
describe('f265 · you take hold of a window by its top', () => {

  test('a press in the top strip takes hold of it', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    dragBy(s, 150, 90);
    assert.deepEqual(at(s.panel), { left: 450, top: 290 }, 'the window followed the pointer');
  });

  test('a press BELOW the top strip does not — that is where the reader selects text', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    const body = s.win.document.getElementById('body');
    dragBy(s, 150, 90, { x: s.rect.left + 40, y: s.rect.top + s.win.DLG_GRAB_H + 20 });
    assert.equal(s.panel.style.position, 'relative', 'nothing moved');
    assert.ok(body, 'and the wording is still there to be selected');
  });

  test('THE ✕ IN THE CORNER IS STILL A CLOSE BUTTON', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    let closed = 0;
    const x = s.win.document.getElementById('x');
    x.addEventListener('click', () => { closed++; });
    press(s.win, x, 'pointerdown', s.rect.left + 360, s.rect.top + 12);
    press(s.win, x, 'click', s.rect.left + 360, s.rect.top + 12);
    assert.equal(s.panel.style.position, 'relative', 'the press did not take hold of the window');
    assert.equal(closed, 1, 'it pressed the button');
  });

  test('and a text box at the top of a window is still a text box', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    const box = s.win.document.getElementById('box');
    press(s.win, box, 'pointerdown', s.rect.left + 40, s.rect.top + 10);
    assert.equal(s.panel.style.position, 'relative');
  });

  test('the pointer says so, and only where it is true', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    press(s.win, s.panel, 'pointermove', s.rect.left + 40, s.rect.top + 10);
    assert.equal(s.panel.style.cursor, 'move', 'over the strip');
    press(s.win, s.panel, 'pointermove', s.rect.left + 40, s.rect.top + 200);
    assert.equal(s.panel.style.cursor, '', 'and nowhere else');
  });
});

/* ============================================================
   3 — WHAT A MOVE DOES, AND WHAT PUTS IT BACK
   ============================================================ */
describe('f265 · moving one, and putting it back', () => {

  test('a moved window is pinned, and keeps the width it had', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    dragBy(s, 100, 50);
    assert.equal(s.panel.style.position, 'fixed');
    assert.equal(s.panel.style.width, '400px', 'it does not change size as it moves');
    assert.equal(s.panel.style.maxWidth, 'none');
  });

  test('DOUBLE-CLICK PUTS IT BACK, and gives every declaration back exactly', () => {
    /* THE TRAP THIS EXISTS FOR: each of these dialogs writes its position, its
       width and its max-width as an INLINE style, so clearing ours would not
       fall back to theirs — it would delete them, and the window would come
       back the wrong width for the rest of the sitting. */
    const s = stage();
    s.win.dragDialog(s.panel);
    dragBy(s, 100, 50);
    press(s.win, s.panel, 'dblclick', s.rect.left + 40, s.rect.top + 10);
    assert.equal(s.panel.style.position, 'relative', 'centred again');
    assert.equal(s.panel.style.maxWidth, '32rem', 'and it is the width the dialog asked for');
    assert.equal(s.panel.style.width, '100%');
    assert.equal(s.panel.style.left, '');
    assert.equal(s.panel.dataset.dlgMoved, undefined);
  });

  test('THE WINDOW STAYS PUT WHEN ITS OWN CONTENTS ARE REDRAWN', () => {
    /* Several of these windows are built by a paint() written to be re-runnable,
       which replaces the very panel the helper is armed on; left in a variable
       the offset would die with it and the window would jump back to the middle
       under the reader's hand. NOTHING SHIPPED CALLS ONE A SECOND TIME TODAY —
       the note window closes on save rather than redrawing — so this claim is
       what exercises the frame at all, and it is why the offset is not a
       closure variable. */
    const s = stage();
    const release = s.win.dragDialog(s.panel);
    dragBy(s, 120, 60);
    const moved = at(s.panel);
    release();
    assert.equal(s.frame.dataset.dlgDx, '120', 'the offset is kept on the frame, which survives');
    assert.equal(s.frame.dataset.dlgDy, '60');
    /* the repaint: a brand-new panel in the same frame, armed again */
    const fresh = s.win.document.createElement('div');
    fresh.setAttribute('role', 'dialog');
    fresh.setAttribute('style', PANEL_STYLE);
    s.frame.appendChild(fresh);
    fresh.getBoundingClientRect = () => ({ ...s.rect, right: 700, bottom: 500, x: 300, y: 200 });
    s.win.dragDialog(fresh);
    assert.deepEqual(at(fresh), moved, 'it comes back where the reader left it');
  });

  test('and a fresh window with no offset behind it opens centred', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    assert.equal(s.panel.style.position, 'relative', 'untouched until somebody moves it');
    assert.equal(s.panel.style.left, '');
  });

  test('release unbinds — a closed window cannot still be dragged', () => {
    const s = stage();
    const release = s.win.dragDialog(s.panel);
    release();
    dragBy(s, 100, 50);
    assert.equal(s.panel.style.position, 'relative');
  });

  test('A NARROWER SCREEN DOES NOT LEAVE A MOVED WINDOW OFF THE SIDE OF IT', () => {
    /* A pinned window sits at a fixed pixel, so a browser dragged narrower — or
       a laptop undone from a second monitor — would otherwise leave one that was
       against the right edge off the screen entirely, reachable only by Escape. */
    const s = stage({ width: 1600, height: 900 });
    s.win.dragDialog(s.panel);
    dragBy(s, 900, 0);
    const far = at(s.panel);
    assert.ok(far.left > 1000, 'it is out at the right edge — ' + far.left);
    /* the panel reports where it now is, and the screen shrinks under it */
    s.panel.getBoundingClientRect = () => ({ left: far.left, top: far.top, width: 400, height: 300,
      right: far.left + 400, bottom: far.top + 300, x: far.left, y: far.top });
    Object.defineProperty(s.win, 'innerWidth', { value: 900, configurable: true });
    s.win.dispatchEvent(new s.win.Event('resize'));
    assert.ok(parseFloat(s.panel.style.left) <= 900 - s.win.DLG_KEEP,
      'it is clamped back on screen — ' + s.panel.style.left);
  });

  test('it cannot be dragged off the top, however hard', () => {
    const s = stage();
    s.win.dragDialog(s.panel);
    dragBy(s, 0, -900);
    assert.equal(at(s.panel).top, 0, 'the strip you grab it by is still on screen');
  });
});

/* ============================================================
   4 — IT MOVES A WINDOW AND DOES NOTHING ELSE
   ============================================================ */
describe('f265 · a move is not an act', () => {

  test('the helper writes nothing anywhere', () => {
    const src = dragSource();
    for (const forbidden of ['persist(', 'logAudit(', 'saveContract(', 'saveSettings(',
      'negoFileChange(', 'localStorage', 'api(']) {
      assert.ok(!src.includes(forbidden),
        `moving a window must not reach ${forbidden} — it is a view posture, not an act`);
    }
  });

  test('the position is not remembered between openings', () => {
    /* A window that opened in the corner a week later, with nothing on screen
       saying why, is the fault this product's own saved-filter rule warns
       about. The offset lives on the frame, which dies with the dialog. */
    const src = dragSource();
    assert.ok(!/localStorage|sessionStorage|hati\.v1/.test(src),
      'nothing about where a window was put is stored per browser');
  });

  test('EVERY POP-UP FAMILY ARMS IT — a ninth written later has to join this list', () => {
    const core = read('js/core.js');
    /* openModal is the door about sixty-nine dialogs come through, so it counts
       once. The other seven build their own overlay and each arms it itself. */
    const sites = [
      ['js/core.js', core, /_modalDrag = \(typeof dragDialog==='function'\) \? dragDialog\(panel\)/],
      ['js/core.js — confirmDialog', core, /alertdialog"\]'\)\) : null;\s*\n\s*const done=val=>/],
      ['js/core.js — promptDialog', core, /dragDialog\(ov\.querySelector\('\[role="dialog"\]'\)\) : null;\s*\n\s*const done=val=>/],
      ['js/views/negotiation.js — the redline note window', read('js/views/negotiation.js'),
        /undrag = window\.dragDialog\(panel, \{ frame: ov \}\)/],
      ['js/signature.js — the signature pad', read('js/signature.js'),
        /window\.dragDialog\(ov\.querySelector\('\.modal-in'\)\)/],
      ['js/templates.js — the new-stream box', read('js/templates.js'),
        /window\.dragDialog\(ov\.querySelector\('\[role="dialog"\]'\)\)/],
    ];
    for (const [name, src, re] of sites)
      assert.ok(re.test(src), `${name} arms the shared helper`);
    const portal = read('js/views/portal.js');
    assert.equal((portal.match(/window\.dragDialog\(/g) || []).length, 2,
      'the counterparty\'s two windows move too');
  });

  test('the helper is published, or every one of those calls is silence', () => {
    /* This codebase's most repeated defect: a name defined in one module and
       never put on window, read through a guard that is therefore always
       false. Six of the eight sites above call it exactly that way. */
    assert.match(read('js/core.js'), /Object\.assign\(window,\{[^]*\bdragDialog\b/,
      'dragDialog leaves js/core.js');
  });

  test('and the ways out of a dialog are untouched', () => {
    const core = read('js/core.js');
    assert.match(core, /_modalRelease = trapFocus\(panel\)/, 'the keyboard still stays inside it');
    assert.match(core, /if\(_modalDrag\)\{ try\{ _modalDrag\(\); \}catch\(e\)\{\} _modalDrag=null; \}\s*\n\s*document\.getElementById\('modal-root'\)\.innerHTML=''/,
      'closing releases the drag before the markup goes');
    assert.match(core, /document\.getElementById\('modal-scrim'\)\.addEventListener\('click',\(\)=>closeModalGuarded\(\)\)/,
      'the scrim still closes it, and still through the guard');
  });
});
