/* f401 — THEIR COMMENT MARKERS OPEN ON A PRESS (the owner's list, 27 Sep 2026)

   "On the other side's page, pressing a numbered comment marker in the margin
   does nothing — the press crashes."

   PORTAL_MODE is a BOOLEAN: js/core.js declares it false and their page sets
   it true. Four presses in js/views/negotiation.js and one Copilot tool in
   js/ai.js called it as a FUNCTION behind a short-circuit, which never ran on
   our seat (false) and THREW on theirs. The margin marker's handler is the one
   the owner reported: it threw before reaching portalOpenNotes, so their notes
   aside never opened.

   Every claim is red at the parent (3ee647b) except the ones marked CONTROL. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* Their negotiation page — the one that mounts the notes aside (#pt-notes). */
function theirPage() {
  const p = buildPortal();
  const c = supplyContract();
  const payload = sharePayloadFor(p, c);
  payload.purpose = 'negotiate';
  p.open(payload);
  const errors = [];
  p.win.addEventListener('error', e => errors.push(e.message || String(e.error)));
  /* A marker exactly as rlPaintNoteMarks draws one: a button carrying the
     thread's key, the contract and (where it has one) the change it lives on. */
  const mark = p.win.document.createElement('button');
  mark.className = 'rl-note-mk';
  mark.setAttribute('data-rl-note-open', 'k1');
  mark.setAttribute('data-rl-note-c', c.id);
  (p.win.document.getElementById('pt-nego') || p.win.document.body).appendChild(mark);
  const press = () => mark.dispatchEvent(new p.win.Event('click', { bubbles: true }));
  const panel = () => p.win.document.getElementById('pt-notes');
  return { p, c, press, panel, errors };
}

test('f401 (1) no file calls PORTAL_MODE as a function without asking which shape it has', () => {
  const offenders = [];
  const walk = dir => {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
      const rel = path.join(dir, f);
      if (fs.statSync(path.join(ROOT, rel)).isDirectory()) { walk(rel); continue; }
      if (!/\.js$/.test(f)) continue;
      read(rel).split('\n').forEach((line, i) => {
        if (!/PORTAL_MODE\s*\(\s*\)/.test(line)) return;
        /* The safe forms ask the type first. */
        if (/typeof\s+PORTAL_MODE\s*===?\s*'function'/.test(line)) return;
        offenders.push(rel + ':' + (i + 1) + '  ' + line.trim());
      });
    }
  };
  walk('js');
  assert.deepEqual(offenders, [], 'a bare PORTAL_MODE() throws on their page, where it is the boolean true');
});

test('f401 (2) their page: pressing a margin marker opens their notes, and a second press closes them', () => {
  const t = theirPage();
  assert.ok(t.panel(), 'the stage mounts their notes aside');
  assert.equal(t.panel().classList.contains('open'), false, 'shut at rest');
  t.press();
  assert.deepEqual(t.errors, [], 'the press does not throw');
  assert.equal(t.panel().classList.contains('open'), true, 'the press opens their notes');
  t.press();
  assert.equal(t.panel().classList.contains('open'), false, 'the press that opened it closes it (the owner’s rule)');
  assert.deepEqual(t.errors, []);
});

test('f401 (3) CONTROL: the reading takes the flag as either shape, so a stage that stubs it as a function still works', () => {
  const t = theirPage();
  t.p.win.PORTAL_MODE = () => true;
  t.press();
  assert.deepEqual(t.errors, []);
  assert.equal(t.panel().classList.contains('open'), true);
});

test('f401 (4) the one reading in the negotiation page answers false on our seat and true on theirs', () => {
  const NEGO = read('js/views/negotiation.js');
  const m = NEGO.match(/function rlOnTheirPage\(\)\{[\s\S]*?\n\}/);
  assert.ok(m, 'rlOnTheirPage is the one reading');
  const fn = new Function('window', m[0] + '; return rlOnTheirPage();');
  assert.equal(fn({ PORTAL_MODE: false }), false);
  assert.equal(fn({ PORTAL_MODE: true }), true);
  assert.equal(fn({ PORTAL_MODE: () => true }), true);
  assert.equal(fn({ PORTAL_MODE: () => { throw new Error('x'); } }), false, 'a throwing stub is not their page');
  /* All four presses that used the old call ask it now. */
  const uses = (NEGO.match(/rlOnTheirPage\(\)/g) || []).length;
  assert.ok(uses >= 5, 'the definition plus the four presses (found ' + uses + ')');
});

test('f401 (5) their page: the Notes row handler no longer throws when it is pressed there', () => {
  const t = theirPage();
  /* The handler returns early when it cannot name a contract, which on this
     stage it cannot — so the stage names one, which is what makes the press
     reach the flag at all (without it this claim passes at the parent and
     proves nothing). */
  t.p.win.state.activeId = t.c.id;
  const row = t.p.win.document.createElement('button');
  row.setAttribute('data-rl-notes', 'CHG-001');
  t.p.win.document.body.appendChild(row);
  row.dispatchEvent(new t.p.win.Event('click', { bubbles: true }));
  assert.deepEqual(t.errors, [], 'no "PORTAL_MODE is not a function"');
});
