/* ============================================================
   f318 — A SUGGESTION HAS AN ADDRESS
   ============================================================
   Young, 15 Sep 2026, of the redline that struck five sub-clauses of a
   limitation-of-liability clause to fix the cap in the sixth:

     "why would a suggestion try and delete clauses nobody complained about or
      not impact by our standards?"

   IT NEVER MEANT TO, and naming that precisely is what makes the fix small.
   A suggested wording is a piece of text with NO ADDRESS ON IT — it does not
   know which part of which clause it belongs in — and the act that puts
   wording into a clause knows exactly one move: replace everything. So on a
   clause that is a CONTAINER (a numbered heading with six rules under it) a
   suggestion about one of them takes the other five with it. Not as a
   decision. As collateral.

   THE ADDRESS ALREADY EXISTED AND WAS BEING THROWN AWAY: the finding quotes
   the wording it objected to, and pbQuoteBlock has always read a block out of
   that quote — which is how the FIGURE path keeps the rest of a clause byte
   for byte. One of the four suggestions was surgical and the other three were
   not, for no reason anyone would defend.

   SO THE ADDRESS IS READ FOR ALL OF THEM (pbFitInto), AND THE QUESTION BUILT
   IN SEPTEMBER BECOMES A SEATBELT: with an address nothing is lost, so
   pbUnquotedLoss counts zero and there is nothing to ask. The question is for
   the one case left — no address could be read.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const PB = read('js/playbook.js');
const CE = read('js/views/clauseeditor.js');

/* The owner's own screen: a limitation-of-liability clause of six parts, with
   the playbook disagreeing with exactly one of them. */
const BODY = [
  '<p>20.1 Nothing in this Agreement limits or excludes liability for death or personal injury caused by negligence.</p>',
  '<p>20.2 Neither Party is liable to the other for loss of profit, loss of goodwill or any indirect or consequential loss.</p>',
  '<p>20.3 Each Party\'s total aggregate liability arising in any Contract Year shall not exceed one hundred and twenty-five per cent (125%) of the net invoice value of Products purchased in the twelve (12) months immediately preceding the claim, or SEK 40,000,000, whichever is the lower.</p>',
  '<p>20.4 The cap in clause 20.3 does not apply to liability arising under clause 14 (Confidentiality) or clause 15 (Data Protection).</p>',
  '<p>20.5 Each Party shall take reasonable steps to mitigate any loss it suffers under this Agreement.</p>',
  '<p>20.6 No claim may be brought more than twenty-four (24) months after the claiming Party became aware of the circumstances.</p>',
].join('');
const QUOTE = 'or SEK 40,000,000, whichever is the lower';
const DRAFT = 'Each Party\'s total aggregate liability arising in any Contract Year shall not exceed '
  + 'one hundred and twenty-five per cent (125%) of the net invoice value of Products purchased in the '
  + 'twelve (12) months immediately preceding the claim, this cap being in any event not less than the '
  + 'net invoice value of Products purchased in the twelve (12) months immediately preceding the claim.';

describe('f318 (1) THE ADDRESS IS READ, AND IT IS THE FINDING\'S OWN QUOTE', () => {
  test('there is ONE reading of "put this wording where the finding points", published', () => {
    assert.match(PB, /function pbFitInto\(bodyHtml,quote,words\)\{/,
      'a named function, not an address worked out again at each call site');
    assert.match(PB, /pbFitWording,pbFitInto,pbUnquotedLoss,/,
      'published — the clause editor reads it by name through window');
  });

  test('it borrows the block reading, and refuses rather than guesses', () => {
    const body = PB.slice(PB.indexOf('function pbFitInto'), PB.indexOf('function pbFitWording'));
    assert.match(body, /const at=pbQuoteBlock\(bodyHtml,quote\);/,
      'the same reading the figure path uses — nothing here decides where a quote lives');
    assert.match(body, /if\(at<0\|\|blocks\[at\]==null\) return null;/,
      'no confident address is an honest null, and every caller falls back to what it had');
    assert.match(body, /if\(_pbFitNorm\(w\)===_pbFitNorm\(blocks\[at\]\)\) return null;/,
      'and wording identical to the block it lands in is not a change');
  });

  test('MEASURED: a fragment about part 3 leaves the other five exactly as they were', () => {
    const w = buildWorld({ playbook: true }).win;
    const into = w.pbFitInto(BODY, QUOTE, DRAFT);
    assert.ok(into, 'the address read');
    assert.equal(into.block, 2, 'the third block is the one the finding quoted');
    assert.equal(into.blocks, 6, 'and the clause is six parts, not one');
    for (const keep of ['20.1 Nothing', '20.2 Neither Party', '20.4 The cap',
      '20.5 Each Party shall take', '20.6 No claim'])
      assert.ok(into.html.includes(keep), `${keep} survived untouched`);
    assert.ok(!into.html.includes('SEK 40,000,000'),
      'and the one thing the playbook objected to is gone');
    assert.ok(into.html.includes('not less than'), 'replaced by our position');
  });

  test('MEASURED: with an address nothing is lost, so the question has nothing to ask', () => {
    const w = buildWorld({ playbook: true }).win;
    /* THE FAULT, stated as the number the reader was never shown. */
    assert.equal(w.pbUnquotedLoss(BODY, QUOTE, DRAFT), 5,
      'the fragment on its own would delete five parts nobody complained about');
    const into = w.pbFitInto(BODY, QUOTE, DRAFT);
    assert.equal(w.pbUnquotedLoss(BODY, QUOTE, into.text), 0,
      'addressed, it deletes none — which is what demotes the wall to a seatbelt');
  });

  test('MEASURED: no quote, no address — and that is when the seatbelt is owed', () => {
    const w = buildWorld({ playbook: true }).win;
    assert.equal(w.pbFitInto(BODY, '', DRAFT), null, 'a finding that quoted nothing places nothing');
    assert.equal(w.pbFitInto(BODY, 'wording that appears nowhere in this clause at all', DRAFT), null,
      'and a quote this clause does not carry places nothing');
    assert.ok(w.pbUnquotedLoss(BODY, '', DRAFT) > 0, 'so the loss is real and the question is owed');
  });

  test('MEASURED: a clause of ONE part is still replaced whole, and loses nothing', () => {
    const w = buildWorld({ playbook: true }).win;
    const one = '<p>Each party\'s liability is capped at SEK 40,000,000.</p>';
    const into = w.pbFitInto(one, 'capped at SEK 40,000,000', 'Each party\'s liability is capped at the fees paid in the last twelve (12) months.');
    assert.ok(into && into.block === 0 && into.blocks === 1,
      'the only block IS the clause — no special case, and nothing to protect');
  });
});

describe('f318 (2) EVERY SUGGESTION GETS ONE, NOT JUST THE FIGURE', () => {
  test('the model\'s draft is addressed at the shared reading', () => {
    assert.match(PB, /const into=body\?pbFitInto\(body,v&&v\.quote,draft\):null;/,
      'so the batch and the editor cannot come to disagree about where a draft goes');
    assert.match(PB, /if\(into\) return \{ kind:'draft', text:into\.text, preview:String\(draft\),\s*\n\s*html:into\.html, block:into\.block, blocks:n \};/,
      'it carries the fitted body, and the preview still shows the words themselves');
  });

  test('the editor addresses every FRAGMENT verb and exempts the fitted one', () => {
    assert.match(CE, /const fitInto = \(parts\[1\] !== 'fit' && it\.clauseId && window\.pbFitInto\)\s*\n\s*\? pbFitInto\(it\.oldHtml, it\.v && it\.v\.quote, words\) : null;/,
      'preferred, fallback and draft are fragments and are placed');
    assert.match(CE, /const fitHtml = \(parts\[1\] === 'fit' && it\.fit\) \? it\.fit\.html\s*\n\s*: \(fitInto \? fitInto\.html : null\);/,
      'fit already IS a fitted body — slotting one into a block would nest the clause in itself');
  });
});

describe('f318 (3) THE QUESTION IS A SEATBELT, AND IT IS THE SAME QUESTION', () => {
  test('it fires only where no address was read', () => {
    assert.match(CE, /if \(!fitHtml && window\.pbUnquotedLoss\)\{/,
      'an addressed suggestion loses nothing, so there is nothing to ask');
  });

  test('it is the review window\'s own words, not a second set', () => {
    for (const k of ['ng_pb_broad_title', 'ng_pb_broad_ask', 'ng_pb_broad_go'])
      assert.ok(CE.includes(`_cet('${k}'`), `${k} — two doors, one act, one sentence`);
    assert.match(CE, /_cet\('ng_pb_broad_ask', \{ n: gone, clause: name \}\)/,
      'and it says how many parts, and of what');
  });

  test('a refused question applies nothing and records nothing as taken', () => {
    assert.match(CE, /if \(!ok\) return false;/, 'the answer is the wall');
    assert.match(CE, /applyScan\(\)\.then\(done => \{[\s\S]*?if \(done && _pbTrace/,
      'Copilot is credited with wording that was actually applied, never with one refused');
  });

  test('a clause the finding could not place still ADDS rather than replaces', () => {
    assert.match(CE, /if \(!it\.clauseId\)\{ ceAddMissingClause\(it, words, scan\); return true; \}/,
      'the verb still follows the finding, never the button that was pressed');
  });
});
