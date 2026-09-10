/* ============================================================================
   F278 — A CONTROL DOES WHAT YOU PRESS, AND NOTHING ELSE
   ----------------------------------------------------------------------------
   Two reports in one message (owner, 10 Sep 2026), and they are one complaint
   read from two screens:

     · "Where collapse and Expand are available, remove the feature where I
       scroll up they collapse automatically. Let the user click to collapse
       and expand."
     · "just like the alerts button, when i click on the chat button once it
       should appear which it does today but when i click on it again it
       should collapse."

   ONE HAD A SECOND OPINION AND THE OTHER HAD HALF A RULE. The contract room's
   fact row folded itself on scroll as well as on the press; the Chat door
   opened the drawer and could never shut it, while the two icons beside it
   had toggled since they were built.

   WHAT THIS FILE CAN AND CANNOT ASK. Both behaviours are the SHELL's and
   buildWorld deliberately never loads it, so what lives here is the SOURCE
   claim — the machinery is gone, the rule is written once and reads the scope.
   Whether the fold really holds still under a real scroll, and whether a real
   second press really shuts the drawer, are measurements on a rendered page and
   live in room-head-fold-verify and notes-two-rooms-verify.
   ========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const CONTRACT = fs.readFileSync('js/views/contract.js', 'utf8');
const APP = fs.readFileSync('js/app.js', 'utf8');
/* COMMENTS STRIPPED, because this file's own convention is that a retired name
   is RECORDED where it used to live — "these are STALE, flag any mention" —
   so a sweep that read the prose would fail on the note explaining the
   removal. The claim is that no CODE reaches them. */
const CODE = CONTRACT.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* ---------------------------------------------------------------- 1 */
test('f278 (1) the fact row has no second opinion about folding', () => {
  /* THE MACHINERY IS GONE, not merely unreachable. Each of these names was a
     way the snap could come back through a door nobody remembered. */
  for (const dead of ['_wsSnapBound', '_wsSnapApply', 'paintSnap'])
    assert.ok(!CODE.includes(dead),
      `${dead} is stale — the header no longer folds itself on scroll`);

  /* AND NO SCROLL LISTENER READS THE FACT ROW. The one other scroll listener
     in this file is the plain-English column's own sync, which keeps two
     columns in step and folds nothing. */
  const scrollers = CODE.match(/addEventListener\('scroll'/g) || [];
  assert.equal(scrollers.length, 1,
    'one scroll listener left in this file, and it is docReadSync');
  assert.ok(/sc\.addEventListener\('scroll',docReadSync/.test(CODE),
    'the survivor is the plain-English sync, by name');
});

/* ---------------------------------------------------------------- 2 */
test('f278 (2) the press is still the whole of the fold', () => {
  /* WHAT WAS NOT REMOVED, which is the other half of the claim: taking the
     snap away must not have taken the control with it. */
  assert.ok(/_wsFactsFolded=facts\.classList\.toggle\('is-folded'\); paint\(\);/
    .test(CONTRACT), 'the toggle still flips the class and repaints the control');
  assert.ok(/if\(_wsFactsFolded===true\) facts\.classList\.add\('is-folded'\);/
    .test(CONTRACT), "and the reader's own choice still survives a re-render");
  /* PER SITTING AND IN MEMORY — never persisted, or a reader who folded the
     facts to read one long clause finds another agreement's value hidden next
     week. */
  assert.ok(/^let _wsFactsFolded=null;$/m.test(CONTRACT),
    'the choice is a module value, not a stored preference');
  assert.ok(!/hati\.v1\.wsFacts|localStorage[\s\S]{0,40}FactsFolded/.test(CONTRACT),
    'nothing writes the fold to storage');
});

/* ---------------------------------------------------------------- 3 */
test('f278 (3) the notes door shuts on a second press, like the bell', () => {
  const fn = APP.slice(APP.indexOf('function openNotesPanel('),
                       APP.indexOf('function renderContextPanel('));
  assert.ok(/state\.panelOpen=!same;/.test(fn),
    'it flips the state rather than forcing it open');
  assert.ok(!/state\.panelOpen=true;/.test(fn),
    'the unconditional open is gone');
  /* IT IS THE BELL'S OWN RULE, so the two cannot come to disagree about what a
     second press means. */
  const other = APP.slice(APP.indexOf('function openPanel('),
                          APP.indexOf('function setNavDrawer('));
  assert.ok(/const same=state\.panelOpen&&panelFace\(\)===face;/.test(other)
    && /state\.panelOpen=!same;/.test(other),
    'openPanel still reads the same way — one rule, three doors');
});

/* ---------------------------------------------------------------- 4 */
test('f278 (4) and "the same thing" carries the scope', () => {
  const fn = APP.slice(APP.indexOf('function openNotesPanel('),
                       APP.indexOf('function renderContextPanel('));
  /* THE SCOPE IS WHAT MAKES IT SAFE. Written as "already on this face" alone,
     pressing one change's Notes row while another change's thread is up would
     CLOSE the drawer instead of swapping to it — two presses to move between
     two threads. So the contract and the change are both in the reading. */
  assert.ok(/panelFace\(\)==='notes'/.test(fn), 'the face is in the reading');
  assert.ok(/was\.contractId/.test(fn), 'and the contract');
  assert.ok(/was\.changeId/.test(fn), 'and the change');
  /* READ BEFORE IT IS WRITTEN, or the comparison is against itself and every
     press looks like the same press. */
  assert.ok(fn.indexOf('const was=state.notesFor') < fn.indexOf('state.notesFor={'),
    'the old scope is read before the new one is stored');
  /* THE SCOPE IS KEPT ON THE WAY OUT — reopening comes back to the same
     conversation, exactly as the bell comes back to alerts. */
  assert.ok(!/state\.notesFor=null|delete state\.notesFor/.test(fn),
    'closing does not forget which conversation it was showing');
  /* AND A SHUT DRAWER IS NOT DRAWN INTO, which is openPanel's own shape. */
  assert.ok(/if\(state\.panelOpen\) renderContextPanel\(\);/.test(fn),
    'the render is skipped when the press closed it');
});
