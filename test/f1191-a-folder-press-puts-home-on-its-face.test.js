/* ============================================================
   f1191 — a press on the Contracts place puts Home on its face first
   ============================================================
   Owner, 23 Nov 2026, with a photo: the bar said "Board" over the Folders and
   Jambo's panel stayed the Board's, so pressing a folder's row changed nothing
   beside it. Measured in a browser: with Home's face left on 'board' while the
   Contracts place stood drawn, every folder press repainted the Board's panel.
   ctfDockAgain (every press on the place's rows, tabs and back) now sets the
   face back to the paper face first, the bar following. Red at the parent:
   the face stayed 'board'.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const REG = fs.readFileSync(path.join(__dirname, '..', 'js/views/register.js'), 'utf8');
const fnBody = name => { const i = REG.indexOf('function ' + name + '('); return i < 0 ? '' : REG.slice(i, REG.indexOf('\n}', i) + 2); };
const line = name => { const i = REG.indexOf('function ' + name + '('); return i < 0 ? '' : REG.slice(i, REG.indexOf('\n', i)); };

function run(drawn){
  const hb = { face: 'board' }; let bar = 0, saved = 0, dock = 0;
  const ctx = { hbS: () => hb, hbSave: () => { saved++; }, deskBarPaint: () => { bar++; }, renderIntelDock: () => { dock++; },
    setTimeout: fn => fn(),
    document: { getElementById: id => id === 'ct-place' ? { getClientRects: () => (drawn ? [1] : []) } : null } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext((fnBody('ctfFaceSync') || '') + '\n' + line('ctfDockAgain') + '\nthis.go = ctfDockAgain;', ctx);
  ctx.go();
  return { face: hb.face, bar, saved, dock };
}
test('f1191 — a press on the drawn place sets the face, the bar and the panel follow; a hidden place changes nothing', () => {
  const on = run(true);
  assert.equal(on.face, 'paper'); assert.equal(on.bar, 1); assert.equal(on.saved, 1); assert.equal(on.dock, 1);
  const off = run(false);
  assert.equal(off.face, 'board', 'not drawn: the face is left alone'); assert.equal(off.bar, 0);
});
