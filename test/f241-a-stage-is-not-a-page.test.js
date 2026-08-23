/* f241 — A STAGE IS A CLAIM ABOUT A CONTRACT, NOT ABOUT WHICH PAGE IS OPEN
   ========================================================================
   Owner-reported 23 Aug 2026: a contract negotiated for a week, with the
   counterparty signalling they were ready to sign, still read "Drafting" at the
   top of its own page — and in the register, in every filter, in the dashboard
   pipeline and in the reports.

   TWO FAULTS, PULLING IN OPPOSITE DIRECTIONS, and neither alone explains it.

     1. NOTHING PROMOTED. Draft → Under Review was written in exactly one place,
        the share DIALOG. A round published onto the standing link the
        counterparty already holds does not go through that dialog — it
        refreshes the link in place — so the commonest act in the product moved
        no status at all. Nor did the phone's own share sheet, which posts to
        /api/shares itself.
     2. SOMETHING DEMOTED. Opening a negotiation took the PREVIOUS occupant of
        the bench off it, back to Draft, on the premise that "the bench holds
        one agreement at a time". This workspace runs eighteen live
        negotiations, so clicking through them knocked them down one at a time;
        arrival promoted nothing back; and the announcement it rested on was a
        BARE toast call, which draws nothing by design — so it had never once
        appeared. Only the audit trail knew.

   THE FIX IS ONE ACT AND ONE REMOVAL. `contractLeavesDrafting` is the act, and
   every send door calls it; `redlineEvict` is a stub. The demotion's own tests
   are REVERSED IN PLACE in f91 rather than deleted — the bounds it was careful
   about (never a signed, declined or closed contract) are the bounds a future
   "tidy the pipeline" idea would break first, so they are still pinned there.

   WHY THIS FILE IS SOURCE-READING. buildWorld deliberately never loads the
   shell (f215's rule) — measured: `contractLeavesDrafting` is `undefined` on a
   built world, because world.js stands its own `logAudit` and `todayStr` in for
   core.js's. So what can be asked here is that the funnel EXISTS and that every
   door goes through it; what it DOES is asked in drafting-stage-verify, on a
   real server, by publishing a real round. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const CORE = read('js/core.js');
const NEGO = read('js/views/negotiation.js');
const MOB = read('js/mobile-contract.js');
const CONTRACT = read('js/views/contract.js');
const APPROV = read('js/approvals.js');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* ================================================ 1 — ONE ACT */
describe('f241 (1) — leaving Drafting is one named act', () => {
  const body = strip(CORE).match(/function contractLeavesDrafting[\s\S]*?\n\}/)[0];

  test('it exists, and it is published so both shells can reach it', () => {
    assert.match(strip(CORE), /function contractLeavesDrafting\(c, why\)/);
    assert.match(CORE, /Object\.assign\(window,\{[\s\S]*?contractLeavesDrafting[\s\S]*?\}\)/,
      'the phone and the negotiation page read it through window — the ES-module rule');
  });

  test('ONLY from Draft — every other stage is somebody’s decision', () => {
    assert.match(body, /c\.status!=='Draft'\)\s*return false/,
      'Under Review, Signed and Declined are not this function’s to overturn');
    assert.match(body, /c\.status='Under Review'/);
  });

  test('it says what moved the contract, in the record', () => {
    assert.match(body, /logAudit\(c,'Status changed'/);
    assert.match(body, /\$\{why\}/, 'the reason is the caller’s and travels into the line');
  });

  test('IT DOES NOT SAVE — every caller is mid-send and saves once', () => {
    assert.ok(!/persist\(/.test(body),
      'saving here would make it twice on every send');
  });

  test('but it DOES repaint, guarded — a status that moves without its head is a stale page', () => {
    assert.match(body, /updateStatusUI/);
    assert.match(body, /renderActionBar/);
    assert.ok((body.match(/try\{/g) || []).length >= 2,
      'those live in another module and must never take a send down with them');
  });

  test('and it reports whether it moved anything', () => {
    assert.match(body, /return true/);
  });
});

/* ============================================== 2 — EVERY DOOR GOES THROUGH IT */
describe('f241 (2) — every send door goes through the one act', () => {
  test('the share dialog no longer carries its own copy of the line', () => {
    const s = strip(CORE);
    const calls = [...s.matchAll(/contractLeavesDrafting\(/g)].length;
    assert.ok(calls >= 3, 'declaration plus at least the two doors in this file');
    /* The rule may be WRITTEN once. Anything else assigning Under Review in
       core.js would be a second opinion about when a draft stops being one. */
    const assigns = [...s.matchAll(/status\s*=\s*'Under Review'/g)].length;
    assert.equal(assigns, 1, 'core.js sets Under Review in exactly one place');
  });

  test('THE ROUND SEND IS COVERED AT ITS FUNNEL, not at one of its four presses', () => {
    const rec = strip(CORE).match(/const record=\(r,reused\)=>\{[\s\S]*?\n  \};/)[0];
    assert.match(rec, /contractLeavesDrafting\(c,/,
      'four doors reach record(); a promotion at one press is three that disagree');
    /* AFTER THE SEND. record() runs only once something has left, so a send
       that throws moves no status — and above the persist already there, so
       the whole act stays ONE save. */
    assert.ok(rec.indexOf('contractLeavesDrafting') < rec.indexOf('persist(c)'),
      'it must sit above the save that was already here');
  });

  test('and the negotiation page does NOT repeat it at its own press', () => {
    assert.ok(!/contractLeavesDrafting/.test(strip(NEGO)),
      'Publish Round reaches it through reshareToLastRecipient like the other three');
  });

  test('THE PHONE IS A THIRD DOOR and it is closed too', () => {
    const fn = strip(MOB).match(/async function mShareCreate\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /window\.contractLeavesDrafting/,
      'this sheet posts to /api/shares itself and never saw the dialog');
    assert.match(fn, /persist\(c\)/, 'and saves, because no desktop caller is doing it for it');
    const at = fn.indexOf('contractLeavesDrafting'), send = fn.indexOf("api('shares'");
    assert.ok(send > -1 && at > send, 'after the send, so a failure moves nothing');
  });

  test('nothing else in the product promotes a draft on a SEND', () => {
    /* The three remaining writers are all deliberate and none of them is a
       send: an approval, the "send for review" button, and the key-terms
       handler that notices a draft has become reviewable. */
    const others = [['js/views/contract.js', CONTRACT], ['js/approvals.js', APPROV],
      ['js/mobile-contract.js', MOB]];
    for (const [name, src] of others)
      for (const m of strip(src).matchAll(/.{110}status\s*=\s*'Under Review'/g))
        assert.ok(/review|approv|keyTerms|Key terms/i.test(m[0]),
          `${name} promotes somewhere that is not an approval or a review step: ${m[0].slice(-90)}`);
  });
});

/* ================================================ 3 — NOTHING DEMOTES */
describe('f241 (3) — the bench moves nobody’s stage', () => {
  test('redlineEvict is a stub, kept so no caller can bring the demotion back', () => {
    const s = strip(NEGO);
    assert.match(s, /function redlineEvict\(\)\{ return null; \}/,
      'published on window and called by openRedlineWorkbench — a deletion would '
      + 'be a caller away from being reintroduced');
  });

  test('RL_DEMOTABLE is gone, and is not published either', () => {
    const s = strip(NEGO);
    assert.ok(!/RL_DEMOTABLE/.test(s),
      'a list of demotable statuses is the shape the removed feature had');
  });

  test('NOTHING ANYWHERE MOVES A CONTRACT TO Draft', () => {
    for (const [name, src] of [['negotiation.js', NEGO], ['core.js', CORE],
      ['contract.js', CONTRACT], ['mobile-contract.js', MOB]]){
      const hits = [...strip(src).matchAll(/status\s*=\s*'Draft'/g)];
      assert.deepEqual(hits.map(h => h[0]), [],
        `${name} still puts a contract back to Draft`);
    }
  });

  test('and the bench still records WHAT IS ON IT — that half was never the fault', () => {
    const s = strip(NEGO);
    assert.match(s, /_redlineHeldId = c \? c\.id : null/,
      'recorded on the PAINT, which is what the repaint-is-not-a-navigation rule reads');
    assert.match(s, /const redlineHeldId = \(\) => _redlineHeldId/);
  });
});
