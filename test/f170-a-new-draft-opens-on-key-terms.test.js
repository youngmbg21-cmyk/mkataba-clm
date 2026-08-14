/* ============================================================
   f170 — a contract you have just drafted opens on Key terms
   ============================================================
   Asked for directly (Young, 09 Aug 2026): "when you draft a contract it does
   not land you to document but rather lands you to Key terms first."

   It is the right order of work. A new draft's document is a template with
   blanks in it, and those blanks are filled from the terms — value, dates,
   parties, governing law. Landing on the document shows somebody the OUTPUT of
   a form they have not filled in, which reads as a half-finished contract
   rather than as a step they have not taken yet.

   THREE THINGS THIS HAS TO GET RIGHT, and they are the whole file:

   1. It happens ONCE. Coming back to the same contract later opens where the
      room has always opened. This is about where a NEW contract lands, not a
      permanent change to the room's default — a rule that kept firing would
      take the document away from somebody who wanted it.

   2. It is for DRAFTS. An uploaded agreement that is already executed has no
      terms to fill in and belongs on its document.

   3. Every creation path registers it. There is no single funnel for creating a
      contract the way negoFileChange is for changes — there are seven — so a
      flag set in one of them is a flag the other six never set.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const ME = { id: 'u_y', name: 'Young Mbagaya', role: 'admin', email: 'y@hati.co.ke' };

function contract(over = {}){
  return { id: 'MK-500', name: 'Kwetu', counterparty: 'Bull Logistics',
    template: 'WH', status: 'Draft', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    value: 1200000, redlineText: '<h1>Kwetu</h1><p>Body.</p>', format: 'rich', ...over };
}
function world(){
  const w = buildWorld({ user: ME, contractView: true, negotiationView: true });
  w.win.state = { settings: {}, contracts: [], activeId: 'MK-500', view: 'workspace' };
  w.win.getUsers = () => [ME];
  w.win.userById = id => (id === ME.id ? ME : null);
  w.win.saveSettings = () => {};
  return w;
}
/* wsTabDefaults decides the landing tab; roomCurrentTab reports what it chose.
   Asserting on the tab the room actually settles on, rather than on markup that
   happens to be passed the answer. */
const landOn = (win, c) => { win.wsTabDefaults(c); return win.roomCurrentTab(); };

describe('f170 · a new draft lands on Key terms', () => {

  test('a freshly created draft opens on terms, not on the document', () => {
    const { win } = world();
    /* The control: a contract nobody just created opens where it always has. */
    assert.equal(landOn(win, contract({ id: 'MK-CTRL' })), 'docs');

    const c = contract({ id: 'MK-501' });
    win.roomOpenOnTerms(c.id);
    assert.equal(landOn(win, c), 'terms');
  });

  test('the landing happens once — the second visit is the ordinary one', () => {
    const { win } = world();
    const c = contract({ id: 'MK-502' });
    win.roomOpenOnTerms(c.id);
    assert.equal(landOn(win, c), 'terms', 'first arrival');

    /* Opening another contract is what resets the room's memory of the tab. */
    landOn(win, contract({ id: 'MK-OTHER' }));
    assert.equal(landOn(win, c), 'docs',
      'coming back later must not keep taking the document away');
  });

  test('an executed agreement is not sent to Key terms — it has none to fill', () => {
    const { win } = world();
    const done = contract({ id: 'MK-503', status: 'Signed' });
    win.roomOpenOnTerms(done.id);
    assert.equal(landOn(win, done), 'docs');
  });

  test('an explicit tab request still wins', () => {
    /* Pressing "Document" on the workbench comes back through _wsTabWant, and a
       new-draft landing must not steal the tab somebody actually asked for. */
    const { win } = world();
    const c = contract({ id: 'MK-504' });
    win.roomOpenOnTerms(c.id);
    win.state.view = 'redline';
    win.openWorkspace = () => {};
    win.roomGoTab(c, 'docs');
    assert.equal(landOn(win, c), 'docs');
  });

  test('registering is harmless when the id is empty', () => {
    const { win } = world();
    assert.doesNotThrow(() => win.roomOpenOnTerms(null));
    assert.doesNotThrow(() => win.roomOpenOnTerms('MK-NOPE'));
  });

  test('Key terms is the first tab in the row, so the landing is also the leftmost', () => {
    const { win } = world();
    assert.equal(win.ROOM_TABS[0][0], 'terms');
  });
});

/* ============================================================
   EVERY CREATION PATH REGISTERS IT
   ============================================================
   Read off the SOURCE rather than by driving seven different flows, because
   what is being asserted is coverage: that no route to a new contract was
   missed. A future eighth route will fail this the moment it is added, which is
   the point — the same reason the change model's own map lists its side doors. */
describe('f170 · no creation route was missed', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const ROOT = path.join(__dirname, '..');

  const CREATORS = [
    'js/wizard.js',              // the guided draft
    'js/app.js',                 // straight from a built-in template
    'js/templatefields.js',      // a library template with a form
    'js/views/templatelib.js',   // the versioned standard-template library
    'js/views/library.js',       // the clause library's own draft
    'js/views/contract.js',      // "Draft new agreement" from the room
    'js/views/migration.js',     // an imported / migrated agreement
  ];

  for (const f of CREATORS){
    test(`${f} sends a new contract to Key terms`, () => {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      assert.match(src, /state\.contracts\.unshift\(c\);/,
        'this file is expected to create contracts');
      assert.match(src, /roomOpenOnTerms\(c\.id\)/,
        `${f} creates a contract without sending it to Key terms`);
    });
  }

  /* ============================================================
     THE ONE ROUTE THAT DELIBERATELY DOES NOT (14 Aug 2026)
     ============================================================
     An eighth creation site arrived — "Create an amendment", which writes a new
     draft from blank paper against a master agreement — and it lands on the
     DOCUMENT tab. That is an exception to the rule this whole file is about, so
     it is NAMED here and asserted rather than left to be discovered as a
     missing line in the list above.

     THE RULE'S OWN REASONING IS WHAT EXEMPTS IT. A new draft goes to Key terms
     because its document is a template full of blanks that are filled from the
     terms, so landing on the document shows somebody the output of a form they
     have not filled in. Neither half is true of an amendment: every term it has
     is copied from the parent at the moment it is created, and its document is
     the empty thing the reader pressed the button in order to go and write.

     It needs no flag to get there — wsTabDefaults already answers 'docs' for
     any contract that has not registered — so what is asserted is the ABSENCE,
     plus the comment that says the absence is a decision. A future ninth route
     that simply forgot the call would have no such comment. */
  test('js/family.js creates a contract and deliberately does NOT send it to Key terms', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/family.js'), 'utf8');
    assert.match(src, /state\.contracts\.unshift\(c\);/,
      'this file creates contracts too — it is a creation site');
    /* The CALL, not the word: the file names the function in the comment that
       explains why it is not calling it, which is exactly what we want to see. */
    assert.ok(!/roomOpenOnTerms\s*\(/.test(src),
      'and it must not register the Key terms landing');
    assert.match(src, /AND IT DOES NOT REGISTER roomOpenOnTerms/,
      'the exception is written down where the code is, not only here');
  });

  test('and an amendment therefore lands on the document', () => {
    const w = buildWorld({ user: ME, contractView: true, negotiationView: true });
    w.win.state = { settings: {}, contracts: [], activeId: null, view: 'workspace' };
    /* Nothing registered, status Draft — the exact state createAmendment leaves
       behind. The control above proves this is the room's own default rather
       than something this test arranged. */
    const c = contract({ id: 'MK-AMEND-1', parentId: 'MK-1042', relation: 'amendment' });
    assert.equal(landOn(w.win, c), 'docs');
  });
});
