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

describe('f996 (2) "Open 8.3" carries Jambo\'s wording (owner, 10 Nov 2026)', () => {
  const ce = fs.readFileSync(path.join(__dirname, '..', 'js/views/clauseeditor.js'), 'utf8');
  test('the press carries the suggestion; the open consumes it and puts it on a card, nothing in the box', () => {
    assert.match(ce, /ceGoClause\(also\.getAttribute\('data-ce-also-go'\), a \? \{ carry: \{ ref: a\.ref, words: a\.words, add: !!a\.add, from \} \}/);
    assert.match(ce, /if \(carry\)\{ _ceOpts = \{ \.\.\._ceOpts \}; delete _ceOpts\.carry; \}/, 'consumed, so a later walk carries nothing');
    const fn = ce.slice(ce.indexOf('function ceOfferCarried('), ce.indexOf('async function ceStdApply('));
    assert.ok(!/ceApply\(/.test(fn), 'nothing reaches the box until Apply');
    assert.match(fn, /std: \{ kind: 'draft'/, 'Apply goes through ceStdApply and its seatbelt');
  });
  test('ADDED after the block numbered 8.3, the blocks before it untouched', () => {
    const w = W();
    const body = '<p>8.1 <b>Convenience.</b> Ninety days\' notice.</p><p>8.2 Insolvency ends it.</p><p>8.3 <b>Cause.</b> Material breach unremedied in 30 days.</p>';
    const fit = w.pbFitAdd(body, '', 'A failure to keep 95% OTIF is a material breach.', 2);
    assert.equal(fit.html, '<p>8.1 <b>Convenience.</b> Ninety days\' notice.</p><p>8.2 Insolvency ends it.</p><p>8.3 <b>Cause.</b> Material breach unremedied in 30 days. A failure to keep 95% OTIF is a material breach.</p>');
  });
});

/* ---- (3) THE OTHER CLAUSE'S ASK, EVERYWHERE (owner picked "File it too", 11 Nov 2026) ----
   The Playbook review window shows the clause editor's own box (one builder,
   rlAlsoHtml) whose Open carries the wording to that clause; Prepare redlines
   files it as that clause's OWN unsent draft through the funnel, added after
   its block, and says so in its one message. */
describe('f996 (3) the other clause\'s ask: the review window shows it, Prepare redlines files it', () => {
  const NEG = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
  const CE = fs.readFileSync(path.join(__dirname, '..', 'js/views/clauseeditor.js'), 'utf8');
  const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'y@w.co.ke' };
  const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
    + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the specification.</p>'
    + '<h2>2. Payment</h2><p>The Buyer shall pay each undisputed invoice within sixty (60) days of receipt.</p>'
    + '<h2>3. Termination</h2><p>Either party may terminate on ninety (90) days\' written notice.</p>';
  const ASK = 'Amend Section 2 to add: "Late payment carries interest at 2% per month." Also amend Section 3 to add: "Either party may terminate at once for an unpaid invoice older than ninety (90) days."';
  function world(){
    const w = buildWorld({ user: ME, negotiationView: true, contractView: true, playbook: true });
    const win = w.win;
    win.state = { settings: {}, contracts: [] };
    win.getUsers = () => [ME]; win.userById = () => ME; win.saveSettings = () => {}; win.persist = () => {};
    w.toasts = []; win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
    win.confirmDialog = async () => true;
    win.simhash64 = t => 'h' + String(t || '').length + ':' + String(t || '').slice(0, 40);
    if (typeof win.cKind !== 'function') win.cKind = () => 'Raw Material Supply Agreement';
    win.clauseLibrary = () => [];
    win.runPlaybookReview = async c => {
      const std = win.pbStandardsFor(c).standards;
      return { key: 'supply', label: 'Supply', source: 'ai', standards: std.length, checked: std.length, categories: std.map(x => x.category),
        wordingHash: win.playbookHashOf(win.playbookText(c)),
        verdicts: [{ category: 'Payment terms', status: 'deviation', quote: 'pay each undisputed invoice within sixty (60) days', position: 'Interest on late payment', redline: ASK, escalate: false }] };
    };
    return w;
  }
  const contract = () => ({ id: 'MK-F996', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', folder: 'proc', source: 'upload', fields: {}, metadata: {}, audit: [], rounds: [],
    versions: [], signatures: [], comments: [], value: 480000, redlineText: BODY, format: 'rich',
    upload: { name: 'x.docx', extractedText: 'x'.repeat(200) } });

  test('ONE box builder and ONE clause finder for both places; the window\'s Open carries the wording through the editor\'s door', () => {
    assert.match(CE, /rlAlsoHtml\(a, ceClauseIdByRef\(a\.ref\), k\)/, 'the clause editor draws the shared box');
    assert.match(CE, /negoClauseByRef\(_ceC, ref\)/, 'and finds the clause the shared way');
    assert.match(CE, /pbPlaceAt\(_ceText, ref, w, !!carry\.add\)/, 'and places it the shared way');
    assert.match(NEG, /it\.draftAlso : \[\]\)\.map\(\(a, k\) => rlAlsoHtml\(a,/, 'the review window draws the same box');
    assert.match(NEG, /rlWithEditorDoor\(c, d => d\.open\(id, \{ carry: \{ ref: a\.ref, words: a\.words, add: !!a\.add, from \} \}\)\)/, 'its Open opens the editor with the wording carried');
    const w = world().win;
    const html = w.rlAlsoHtml({ ref: '8.3', words: 'A failure is a breach.', add: true }, 'cl-8', 0);
    assert.match(html, /class="rl-also"/); assert.match(html, /data-ce-also-go="cl-8"/); assert.match(html, /Open 8\.3/);
    assert.doesNotMatch(w.rlAlsoHtml({ ref: '8.3', words: 'x', add: true }, null, 0), /data-ce-also-go/, 'no clause found, no dead button');
  });
  test('pbPlaceAt: added after the numbered block; "to read" replaces that block keeping its number; nothing to change is null', () => {
    const w = W();
    const body = '<p>8.1 Notice.</p><p>8.2 <b>Cause.</b> Material breach.</p>';
    assert.equal(w.pbPlaceAt(body, '8.2', 'Late delivery is a breach.', true).html, '<p>8.1 Notice.</p><p>8.2 <b>Cause.</b> Material breach. Late delivery is a breach.</p>');
    assert.equal(w.pbPlaceAt(body, '8.2', 'Any breach.', false).html, '<p>8.1 Notice.</p><p>8.2 Any breach.</p>');
    assert.equal(w.pbPlaceAt(body, '8.9', 'Any breach.', false), null, 'a replace with no block named changes nothing');
    assert.equal(w.pbPlaceAt(body, '8.2', 'Material breach.', true), null, 'already says it');
  });
  test('Prepare redlines files the other clause\'s ask as its OWN unsent draft, added, and says so once', async () => {
    const w = world(); const c = contract(); w.win.state.contracts.push(c);
    const out = await w.win.rlPrepareRedlines(c);
    assert.equal(out.filed, 2, 'clause 2 and clause 3'); assert.equal(out.also, 1);
    const drafts = (c.changes || []).filter(x => x.status === 'pending' && x.authorSide === 'owner' && !x.withdrawn);
    assert.equal(drafts.length, 2);
    const two = drafts.find(x => /sixty \(60\) days/.test(x.newText)), three = drafts.find(x => /ninety \(90\) days' written notice/.test(x.newText));
    assert.ok(two && /Late payment carries interest at 2% per month\./.test(two.newText) && !/Amend|Section 3/.test(two.newText), 'clause 2: only its own sentence');
    assert.ok(three && /written notice\. Either party may terminate at once for an unpaid invoice/.test(three.newText), 'clause 3: its own draft, ADDED after its wording');
    assert.equal(w.win.negoUnsentAsks(c, 'owner').length, 2, 'both unsent');
    assert.equal(w.toasts.length, 1);
    assert.match(w.toasts[0].text, /^2 drafts filed under Your drafts — nothing sent · 1 of them on 3, from Jambo’s advice on 2/);
  });
  test('a second press files nothing new for the other clause: its own draft is already waiting there', async () => {
    const w = world(); const c = contract(); w.win.state.contracts.push(c);
    await w.win.rlPrepareRedlines(c);
    const n = (c.changes || []).length;
    const out = await w.win.rlPrepareRedlines(c);
    assert.equal((c.changes || []).length, n, 'nothing new filed');
    assert.equal(out.also, 0); assert.equal(out.alsoBusy, 1);
  });
});
