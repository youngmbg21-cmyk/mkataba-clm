/* ============================================================
   f332 — THE SEVEN REPAIRS
   ============================================================
   Young, 18 Sep 2026: *"In an overnight run, implement ideas 4 through 9 and
   the 7 repairs."*  The seven are the repair list in "HaTi, today and next" —
   defects rather than missing capabilities, three of which lose somebody's
   work.  This file holds the claims for the seven; the six upgrades are in
   f333 beside it.

   Every claim below is red at the parent except those named as controls.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ------------------------------------------------------------------
   R1 — A RE-RUN DOES NOT THROW AWAY WHAT SOMEBODY DECIDED
   ------------------------------------------------------------------ */
describe('f332 (1) the standards check keeps accepted departures', () => {
  const PB = read('js/playbook.js');

  test('1a pbCarryDecisions exists and is published', () => {
    assert.match(PB, /function pbCarryDecisions\(prev, next\)/,
      'the carry is one named reading in js/playbook.js');
    assert.match(PB, /Object\.assign\(window,\{[^\n]*pbCarryDecisions/,
      'and it is published, or every caller reading it takes a silent fallback');
  });

  test('1b it is asked inside runPlaybookReview, so all eight callers inherit it', () => {
    const fn = PB.slice(PB.indexOf('async function runPlaybookReview'));
    const body = fn.slice(0, fn.indexOf('\nfunction deviationSummary'));
    assert.match(body, /pbCarryDecisions\(c && c\.playbook, r\)/,
      'the carry belongs in the funnel that BUILDS a review, not at each of its callers');
    /* the review has more than one caller, which is why it may not live at one */
    const callers = (read('js/views/contract.js') + read('js/views/negotiation.js') +
      read('js/triage.js') + read('js/views/clauseeditor.js')).match(/runPlaybookReview\(/g) || [];
    assert.ok(callers.length >= 5, 'runPlaybookReview has many callers: ' + callers.length);
  });

  const W = () => buildWorld({ standards: true }).win;

  test('1c an acceptance carries onto a departure that is still open', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days',
      accepted:{ by:'Amina', byId:'3', role:'admin', at:'2026-09-01T10:00:00Z', why:'agreed with finance', quote:'within 60 days' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'agreed with finance');
    assert.equal(out.verdicts[0].accepted.by, 'Amina');
    assert.ok(!out.verdicts[0].accepted.staleQuote, 'same wording, so it is not asked again');
  });

  test('1d the escalation is carried too — it is the other half of the decision', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Liability cap', status:'missing',
      escalation:{ to:{ id:'7', name:'Wanjiru' }, at:'2026-09-02T09:00:00Z' } }] };
    const next = { verdicts: [{ category:'Liability cap', status:'missing' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].escalation.to.name, 'Wanjiru');
  });

  test('1e two verdicts of one category are paired IN ORDER, never both from the first', () => {
    const w = W();
    /* the supply playbook really does carry "Liability cap" as a position AND
       as a range, so a map keyed on the category alone is wrong */
    const prev = { verdicts: [
      { category:'Liability cap', status:'missing', accepted:{ at:'x', why:'first', quote:'' } },
      { category:'Liability cap', status:'deviation', accepted:{ at:'x', why:'second', quote:'' } } ] };
    const next = { verdicts: [
      { category:'Liability cap', status:'missing' },
      { category:'Liability cap', status:'deviation' } ] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'first');
    assert.equal(out.verdicts[1].accepted.why, 'second');
  });

  test('1f nothing is carried onto a verdict that is now aligned', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation',
      accepted:{ at:'x', why:'we let it go', quote:'within 60 days' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'aligned', quote:'within 30 days' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted, undefined,
      'the departure was fixed — there is nothing left to have accepted');
  });

  test('1g wording that moved under the acceptance keeps the stamp and marks it', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days',
      accepted:{ by:'Amina', at:'x', why:'agreed with finance', quote:'within 60 days' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 75 days of receipt' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'agreed with finance', 'the reason is a record and is kept');
    assert.equal(out.verdicts[0].accepted.staleQuote, true, 'and it is asked again');
  });

  test('1h an acceptance with no quote on it is carried as it stands', () => {
    const w = W();
    /* one made before this was written: an absence is not a claim */
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days',
      accepted:{ at:'x', why:'older record' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 75 days' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'older record');
    assert.ok(!out.verdicts[0].accepted.staleQuote);
  });

  test('1i the acceptance records the wording it answered', () => {
    const CT = read('js/views/contract.js');
    const fn = CT.slice(CT.indexOf('async function signCheckAccept'));
    const body = fn.slice(0, fn.indexOf('\nasync function', 10));
    assert.match(body, /quote:String\(v\.quote\|\|''\)/,
      'without it a later re-run cannot tell a reworded departure from the same one');
  });

  test('1j a stale acceptance does not settle the row, and says why', () => {
    const SC = read('js/signcheck.js');
    assert.match(SC, /function signCheckAcceptStale\(v\)/);
    assert.match(SC, /signCheckAcceptStale,/, 'published');
    assert.match(SC, /settled: !!f\.accepted && properly && !stale/,
      'settled asks BOTH questions — who accepted it, and whether the paper has moved since');
    assert.match(SC, /staleAccept: !!f\.accepted && properly && stale/);
    assert.match(read('js/views/contract.js'), /r\.staleAccept.*sc_stale_accept/s,
      'and the row prints it rather than going quiet');
  });

  test('1k the sentence is in both books', () => {
    const I = read('js/i18n.js');
    assert.equal((I.match(/\n\s+sc_stale_accept:/g) || []).length, 2,
      'a key in one book leaves a screen half-English');
  });
});
