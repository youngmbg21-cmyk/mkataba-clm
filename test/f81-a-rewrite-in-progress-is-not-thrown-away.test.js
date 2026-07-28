/* ============================================================
   F81 — clauses you have rewritten and not sent survive leaving the editor
   ============================================================
   The counterparty's "Propose your edits" panel is not a modal. It is a panel
   that hides the document, and it is shown and hidden by the SAME button — and
   the negotiation room's "Propose a change" presses that button too. So going
   in and out of it is the ordinary way round the page, not an unusual act.

   Every open reset PORTAL_CLAUSE_EDITS to {} unconditionally.

   WHAT THAT COST. Rewrite four clauses. Press "Review what changed" to check
   them against what the other side has asked for — which is exactly what a
   person negotiating a contract does. Come back. All four rewrites are gone.
   Nothing asked, nothing warned; the panel reopens showing the original wording
   in every box, which reads as the edits having been SENT rather than binned.
   The reader's own words, on a legal document, deleted by a navigation.

   Cancel had the other half of it: it discarded silently, with no dialog and no
   count, on a button sitting beside "Submit proposed edits".

   The draft ends in exactly two places, and neither of them is a repaint: it
   was sent, or its author said to throw it away — and the second is now asked
   for rather than assumed.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

/* Rewrite one clause the way a counterparty does: press "Change" on it, type
   into the box that replaces it, and press "Keep this change". */
function rewriteFirstClause(p, text) {
  const btn = p.win.document.querySelector('[data-cl-edit]');
  assert.ok(btn, 'the clause editor rendered no clause to change');
  const i = btn.getAttribute('data-cl-edit');
  btn.dispatchEvent(new p.win.Event('click', { bubbles: true }));
  const ta = p.win.document.querySelector(`[data-cl-input="${i}"]`);
  assert.ok(ta, 'pressing Change did not open an editable clause');
  ta.value = text;
  p.win.document.querySelector(`[data-cl-save="${i}"]`)
    .dispatchEvent(new p.win.Event('click', { bubbles: true }));
  return i;
}
/* What the editor currently shows for that clause — the staged wording if it
   has one, the original otherwise. */
function clauseShown(p, i) {
  const row = p.win.document.querySelector(`[data-cl="${i}"]`);
  return row ? String(row.textContent || '') : '';
}
const stagedCount = p => String(
  (p.win.document.getElementById('pt-cl-count') || {}).textContent || '');

const NEW_WORDING = 'Payment shall be made within sixty (60) days of a valid invoice.';

async function openEditor(p) {
  await p.click('pt-redline');
  assert.ok(p.win.document.querySelector('[data-cl-edit]'), 'the editor did not open');
}

describe('F81 — leaving the editor keeps the work', () => {
  test('closing and reopening keeps the rewritten clause', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    await openEditor(p);
    const i = rewriteFirstClause(p, NEW_WORDING);
    assert.match(clauseShown(p, i), /sixty \(60\)/, 'the rewrite was not staged at all');
    await p.click('pt-redline');                    // the same button hides it
    await p.click('pt-redline');                    // and shows it again
    assert.match(clauseShown(p, i), /sixty \(60\)/,
      'a clause the counterparty had rewritten was wiped by closing and reopening the editor');
  });

  test('the count of staged rewrites survives with it', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()));
    await openEditor(p);
    rewriteFirstClause(p, NEW_WORDING);
    await p.click('pt-redline');
    await p.click('pt-redline');
    assert.match(stagedCount(p), /1 change/i, 'the page forgot there was anything to send');
  });

  test('Cancel asks before discarding, and keeps it if they say no', async () => {
    const p = buildPortal();
    let asked = null;
    p.win.confirmDialog = async o => { asked = o; return false; };   // "Keep editing"
    p.open(sharePayloadFor(p, supplyContract()));
    await openEditor(p);
    const i = rewriteFirstClause(p, NEW_WORDING);
    await p.click('pt-redline-cancel');
    assert.ok(asked, 'Cancel threw away rewritten clauses without asking');
    assert.match(String(asked.title || ''), /discard/i);
    assert.match(String(asked.title || '') + String(asked.message || ''), /1 /,
      'the question has to say how much is about to be lost');
    await p.click('pt-redline');
    assert.match(clauseShown(p, i), /sixty \(60\)/, '"Keep editing" lost the edits anyway');
  });

  test('Cancel discards when they say yes', async () => {
    const p = buildPortal();
    p.win.confirmDialog = async () => true;
    p.open(sharePayloadFor(p, supplyContract()));
    await openEditor(p);
    const i = rewriteFirstClause(p, NEW_WORDING);
    await p.click('pt-redline-cancel');
    await p.click('pt-redline');
    assert.ok(!/sixty \(60\)/.test(clauseShown(p, i)), 'a confirmed discard did not discard');
  });

  test('an editor nobody typed into closes without a dialog', async () => {
    const p = buildPortal();
    let asked = false;
    p.win.confirmDialog = async () => { asked = true; return true; };
    p.open(sharePayloadFor(p, supplyContract()));
    await openEditor(p);
    await p.click('pt-redline-cancel');
    assert.equal(asked, false, 'closing an untouched editor should not need a decision');
  });

  test('sending clears the draft, so the next round starts clean', async () => {
    const p = buildPortal();
    p.open(sharePayloadFor(p, supplyContract()), { token: 'tok_test' });
    await openEditor(p);
    const i = rewriteFirstClause(p, NEW_WORDING);
    p.setValue('pt-name', 'Erik Lindqvist');
    p.setValue('pt-email', 'erik@nordkust.se');
    await p.click('pt-redline-submit');
    assert.ok(p.lastSent(), 'the redline was not sent');
    // the editor is still open on what they just sent; close it and open it
    // again, which is the next round
    await p.click('pt-redline');
    await p.click('pt-redline');
    assert.ok(!/sixty \(60\)/.test(clauseShown(p, i)),
      'wording that has already been sent came back as an unsent draft');
  });
});
