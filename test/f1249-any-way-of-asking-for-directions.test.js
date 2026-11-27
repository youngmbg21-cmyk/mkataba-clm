/* f1249 — ANY REASONABLE WAY OF ASKING FOR DIRECTIONS GETS THE GUIDED STEPS (owner, 27 Nov 2026: "the walk me through,
   show me, how do I, and any other reasonable phrase should help you get the guidance for direction to do something").
   teachGuideOf (js/teach.js) reads the opening that asks to be guided and finds the Handbook chapter for what follows;
   teachHowOf answers with that chapter's own steps ahead of the door that only opens the page. Red at the parent:
   "how do I create a new contract", "walk me through creating a new contract", "show me how to create a new contract"
   and "help me create a new contract" got no steps (jmRead opened New agreement, or nothing read them). A lesson about
   one's own data and a chart are not directions. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../js/teach.js');
const H = require('../js/handbook.js');
const W = require('../js/walkplan.js');
describe('f1249 any reasonable way of asking for directions', () => {
  const was = {};
  const put = { hbkFind: H.hbkFind, hbkChapterOf: H.hbkChapterOf, hbkPlainOf: H.hbkPlainOf, walkAsked: W.walkAsked, askRouteOf: W.askRouteOf,
    navNorm: q => ' ' + String(q).toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim() + ' ', navReadHandbook: () => null };
  for (const k of Object.keys(put)){ was[k] = global[k]; global[k] = put[k]; }
  const guided = [
    ['how do I create a new contract', '2.1'], ['walk me through creating a new contract', '2.1'], ['show me how to create a new contract', '2.1'],
    ['guide me through creating a new contract', '2.1'], ['help me create a new contract', '2.1'], ['teach me how to create a contract', '2.1'],
    ['can you show me how to create a new contract?', '2.1'], ['what are the steps to upload a contract', '2.2'], ['help me upload a contract', '2.2'],
    ['walk me through sending a contract for signing', '4.3'], ['how can I send a contract for signing', '4.3'], ['show me how to add a colleague', '7.1'],
    ['hur skapar jag ett nytt avtal', '2.1'], ['hur gör jag för att ladda upp ett avtal', '2.2'], ['hur lägger jag till en kollega', '7.1'],
    ['visa mig hur man skickar ett avtal för signering', '4.3'], ['guida mig genom att ladda upp ett avtal', '2.2']];
  for (const [q, k] of guided) test('guided steps: ' + q, () => assert.equal(T.teachGuideOf(q), k));
  const not = ['walk me through my renewals', 'show me value by stream', 'show me', 'help me with Naivas', 'how should I handle the liability cap',
    'what is our liability cap', 'show me signed contracts', 'walk me through MK-B2', 'how do I negotiate the indemnity clause'];
  for (const q of not) test('not directions: ' + q, () => assert.equal(T.teachGuideOf(q), null));
  test('a move stays a move', () => assert.equal(T.teachHowOf('how do I get to the calendar'), null));
  test('teachHowOf asks it before the page\'s door', () => {
    const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../js/teach.js'), 'utf8');
    assert.match(src, /function teachHowOf\(q\)\{[\s\S]{0,300}const g = teachGuideOf\(q\); if \(g && teachWalkSteps\(teachChapter\(g\)\)\.length\) return g;[\s\S]{0,200}navReadHandbook\(q, t\)/);
  });
  test('restore', () => { for (const k of Object.keys(was)) global[k] = was[k]; });
});
