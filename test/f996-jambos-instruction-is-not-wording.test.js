/* ============================================================
   f996 — JAMBO'S INSTRUCTION IS NOT WORDING (owner, 10 Nov 2026)
   ============================================================
   A playbook draft for 3.3 came back as *Amend Section 3.3 to add: "…" Also
   amend Section 8.3 to add: "…"*, and the whole sentence — the instruction,
   the quote marks, 8.3's wording — was written over 3.3's quoted sentence.
   pbDraftRead keeps only THIS clause's wording and says it ADDS; pbFitAdd puts
   it after the block, every word already there kept; 8.3's ask comes back as
   `also`, written nowhere.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const W = () => buildWorld({ playbook: true }).win;
const DRAFT = 'Amend Section 3.3 to add: "The liquidated damages cap set forth in this Section 3.3 shall not limit Buyer\'s right to procure replacement Materials." '
  + 'Also amend Section 8.3 to add: "A failure by Supplier to maintain the minimum 95% OTIF delivery rate set forth in Section 3.2 shall constitute a material breach."';
const BODY = '<p>3.3 <b>Late Delivery Liquidated Damages.</b> If Supplier fails to deliver, Supplier shall pay Buyer liquidated damages equal to 1.0% of the total PO value, '
  + 'without prejudice to Buyer\'s right to cancel the order.</p><p>3.4 <b>Title and Risk.</b> Title passes on delivery.</p>';
const QUOTE = 'Supplier shall pay Buyer liquidated damages equal to 1.0% of the total PO value';

describe('f996 an instruction is read, never filed as wording', () => {
  test('the instruction splits: this clause gets only its quoted wording, as an ADD; 8.3 comes back as also', () => {
    const r = W().pbDraftRead(DRAFT, ['3', '3.3']);
    assert.ok(r);
    assert.equal(r.add, true);
    assert.match(r.words, /^The liquidated damages cap set forth in this Section 3\.3 shall not limit/);
    assert.doesNotMatch(r.words, /Amend|8\.3|OTIF|"/);
    assert.equal(r.also.length, 1);
    assert.equal(r.also[0].ref, '8.3');
    assert.match(r.also[0].words, /^A failure by Supplier/);
  });
  test('plain wording is not an instruction', () => {
    const w = W();
    assert.equal(w.pbDraftRead('Supplier shall pay Buyer 0.5% per day. The parties may amend Section 3 to add terms.', ['3']), null);
    assert.equal(w.pbDraftRead('', ['3']), null);
  });
  test('"to read" replaces', () => {
    const r = W().pbDraftRead('Amend Clause 9.1 to read: "This Agreement is governed by Kenyan law."', ['9']);
    assert.equal(r.add, false);
    assert.equal(r.words, 'This Agreement is governed by Kenyan law.');
  });
  test('the clause\'s own numbers come off its heading and its quoted block', () => {
    const refs = W().pbOwnRefs({ headingText: '3. Delivery, Title & Risk of Loss', bodyHtml: BODY }, QUOTE);
    assert.equal(JSON.stringify(refs), '["3","3.3"]');
  });
  test('ADDED, the quoted sentence and the bold title stay; the next block is untouched', () => {
    const w = W();
    const r = w.pbDraftRead(DRAFT, w.pbOwnRefs({ headingText: '3. Delivery', bodyHtml: BODY }, QUOTE));
    const fit = w.pbFitAdd(BODY, QUOTE, r.words);
    assert.ok(fit);
    assert.match(fit.html, /<b>Late Delivery Liquidated Damages\.<\/b> If Supplier fails to deliver, Supplier shall pay Buyer liquidated damages equal to 1\.0%/);
    assert.match(fit.html, /cancel the order\. The liquidated damages cap set forth in this Section 3\.3 shall not limit Buyer's right to procure replacement Materials\.<\/p><p>3\.4/);
    assert.doesNotMatch(fit.html, /Amend|OTIF/);
    assert.equal(w.pbFitAdd(fit.html, QUOTE, r.words), null, 'already there: nothing to add');
  });
  test('pbFitWording honours the add, and the producer and the editor read the placed draft', () => {
    const w = W();
    const cl = { headingText: '3. Delivery', bodyHtml: BODY };
    const fit = w.pbFitWording(cl, { quote: QUOTE }, '', 'The cap shall not limit replacement costs.', { add: true });
    assert.equal(fit.kind, 'draft');
    assert.match(fit.text, /liquidated damages equal to 1\.0%[\s\S]*cancel the order\. The cap shall not limit replacement costs\./);
    const neg = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
    assert.match(neg, /pbDraftRead\(draft,/);
    assert.match(neg, /data-pbr-draft', it => \(it\.draftFit && it\.draftFit\.text\) \|\| it\.draft\)/);
    const ce = fs.readFileSync(path.join(__dirname, '..', 'js/views/clauseeditor.js'), 'utf8');
    assert.match(ce, /kind === 'draft' && it\.draftFit && it\.draftFit\.html/);
    assert.match(ce, /applied \? _ceBase : _ceText/, 'an applied card is marked against what stands');
    assert.match(ce, /data-ce-also-go/);
  });
});
