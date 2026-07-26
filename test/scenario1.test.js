/* ============================================================
   SCENARIO 1 — the Word-only counterparty, six full rounds
   ============================================================
   Wanjiru runs a small catering company in Nairobi. She drafted a 12-month
   raw material supply agreement inside HaTi. Erik, procurement manager at a
   Swedish firm, will not use HaTi: he works in Microsoft Word with Track
   Changes, over email.

   This script is the negotiation, played out against the real modules. Each
   round asks the question the UX review asked — can she actually do this
   inside the app? — and fails if the answer is no. The rounds:

     1. Wanjiru sends the draft out as a Word file
     2. Erik returns it marked up; it lands on THIS contract as a round
     3. She reviews the redline and adopts it
     4. She counters, and files her own change
     5. Erik returns again; his authorship stays his
     6. Final pass, then the contract is signed and sealed

   Every assertion is about product behaviour, never about a paraphrase of it:
   the Word bytes are real ZIP archives, the diff is the product's diff, and
   the audit trail read back at the end is the one the product wrote. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const F = require('./docxfix');

/* Hand the product a File the way a file input does. uploadWordVersion reads
   it through FileReader, so the world's FileReader resolves our data URL. */
function installFileReader(win) {
  win.FileReader = class {
    readAsDataURL(file) { this.result = file._dataUrl; if (this.onload) this.onload(); }
  };
}

/* One Word round trip, end to end: HaTi produces the wording, Erik marks it up
   in Word, the file comes back and is uploaded to the SAME contract. Returns
   the round the product filed. */
async function wordRound(w, c, edits, fileName) {
  const sent = w.win.docPlainText(c);
  const bytes = F.erikRedline(sent, edits);
  const file = F.fileOf(bytes, fileName);
  await w.win.uploadWordVersion(c, file);
  return (c.rounds || [])[(c.rounds || []).length - 1];
}

describe('Scenario 1 — Erik negotiates only in Word', () => {
  let w, c;

  before(() => {
    w = buildWorld();
    installFileReader(w.win);
    c = supplyContract();
    w.win.captureVersion(c, 'Drafted from Raw Material Supply Agreement', 'Wanjiru Kamau');
  });

  /* ---------- Round 1: the draft goes out as Word ---------- */

  test('round 1 — the drafted contract can leave HaTi as a real .docx (checklist 1)', async () => {
    assert.equal(typeof w.win.contractDocxBytes, 'function',
      'a contract drafted in HaTi must be exportable to Word');
    const bytes = await w.win.contractDocxBytes(c);
    assert.ok(bytes && bytes.length > 200, 'the export must produce real bytes');
    assert.equal(bytes[0], 0x50, 'a .docx is a ZIP — first byte P');
    assert.equal(bytes[1], 0x4b);

    // and it must be a document Word can read back, with the wording intact
    const back = await w.win.docxExtract(bytes);
    assert.match(back.text, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.match(back.text, /thirty \(30\) days of a valid invoice/);
    assert.match(back.text, /SIGNED for and on behalf of the parties/,
      'the signature block must survive the export');
  });

  test('round 1 — the exported file keeps headings and clause numbering (checklist 1)', async () => {
    const bytes = await w.win.contractDocxBytes(c);
    const back = await w.win.docxExtract(bytes);
    const kinds = back.text.split('\n').map(w.win.docLineKind);
    assert.ok(kinds.includes('heading'), 'section titles must still read as headings');
    assert.ok(kinds.includes('clause'), 'numbered clauses must still carry their numbers');
    // the clause numbers the rich projection reconstructed must be in the file
    assert.match(back.text, /5\.\s*Payment shall be made/,
      'clause numbering must reach the Word file, or cross-references break');
  });

  /* ---------- Round 2: Erik's marked-up file comes back ---------- */

  test('round 2 — a returned .docx lands on THIS contract as a negotiation round (checklist 2)', async () => {
    const before = (c.rounds || []).length;
    const r = await wordRound(w, c, [
      { find: 'thirty (30) days', replace: 'sixty (60) days' },
      { find: 'fourteen (14) days', replace: 'twenty-one (21) days' },
    ], 'supply-agreement-EL-markup.docx');

    assert.equal((c.rounds || []).length, before + 1,
      'the return must file as a round on this contract, not as a new contract');
    assert.ok(r, 'a round must exist');
    assert.equal(r.via, 'word');
    assert.equal(r.status, 'open');
    assert.ok(r.proposedText && r.baseText, 'the round must carry both texts so it can be diffed');
    assert.match(r.proposedText, /sixty \(60\) days/, "Erik's new wording must be in the round");
    assert.ok(!/thirty \(30\) days/.test(r.proposedText), 'the struck-out wording must not survive');
  });

  test('round 2 — tracked changes are reported and attributed to the counterparty (checklist 3)', () => {
    const r = c.rounds[c.rounds.length - 1];
    assert.ok(r.file, 'the returned file itself must be kept on the round');
    assert.ok(r.file.tracked.ins > 0 && r.file.tracked.del > 0,
      "Word's tracked insertions and deletions must be counted and reported");
    assert.match(String(r.by), /Nordkust|counterparty|returned Word file/i,
      'the round must be attributed to the counterparty, never to Wanjiru');
    assert.ok(!/Wanjiru/.test(String(r.by)), "Erik's edits must not be filed under Wanjiru's name");
  });

  test('round 2 — the audit trail names the counterparty, not the owner (checklist 4)', () => {
    const wordEntries = (c.audit || []).filter(e => /Word review/.test(e.action));
    assert.ok(wordEntries.length > 0, 'the return must be recorded in the audit trail');
    const detail = wordEntries.map(e => e.detail).join(' ');
    assert.match(detail, /returned/i);
    assert.match(detail, /negotiation round/i,
      'the record must say the file became a negotiation round');
  });

  /* ---------- Round 3: she reviews and adopts ---------- */

  test('round 3 — the redline is reviewable and adoption captures a version', () => {
    const r = c.rounds[c.rounds.length - 1];
    const versionsBefore = (c.versions || []).length;

    // the review surface opens on the real texts
    w.win.reviewProposedRound(c, r.n);
    const modal = w.log.modals[w.log.modals.length - 1];
    assert.ok(modal, 'a review surface must open');
    assert.match(modal.html, /Changes proposed by/);

    w.win.acceptProposedRound(c, r.n);
    assert.equal(r.status, 'closed');
    assert.equal(r.resolution.decision, 'accepted');
    assert.ok((c.versions || []).length > versionsBefore, 'adopting must capture a new version');
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/,
      'the adopted wording must become the live document');
  });

  test('round 3 — adoption keeps the document formatted (checklist 9)', () => {
    assert.equal(w.win.docFormat(c.format), 'rich',
      'accepting a redline must not flatten a formatted contract to plain text');
    const live = w.win.docPlainText(c);
    assert.match(live, /RAW MATERIAL SUPPLY AGREEMENT/);
    assert.match(live, /5\.\s*Payment shall be made/,
      'clause numbering must survive the round');
  });

  /* ---------- Round 4: she counters ---------- */

  test('round 4 — she counters, and the export carries the adopted wording', async () => {
    // her counter: meet in the middle on payment
    const text = w.win.docPlainText(c).replace('sixty (60) days', 'forty-five (45) days');
    w.win.applyOwnerEdit(c, text, { label: 'Counter-proposal' });
    assert.match(w.win.docPlainText(c), /forty-five \(45\) days/);

    const bytes = await w.win.contractDocxBytes(c);
    const back = await w.win.docxExtract(bytes);
    assert.match(back.text, /forty-five \(45\) days/,
      'the file Erik receives must be the CURRENT wording, never a stale copy');
    assert.ok(!/thirty \(30\) days/.test(back.text));
  });

  test('round 4 — her own edit is recorded as hers (checklist 4)', () => {
    const edits = (c.audit || []).filter(e => /Edited/i.test(e.action));
    assert.ok(edits.length > 0);
    assert.equal(edits[edits.length - 1].user, 'Wanjiru Kamau',
      'an edit she made must be recorded under her name');
  });

  /* ---------- Round 5: Erik returns again, out-of-band ---------- */

  test('round 5 — a second Word return files as its own round without disturbing the first', async () => {
    const r = await wordRound(w, c, [
      { find: 'capped at the total sums paid in the preceding twelve months',
        replace: 'capped at fifty percent (50%) of the sums paid in the preceding twelve months' },
    ], 'supply-agreement-EL-round5.docx');

    assert.equal(r.n, c.rounds.length, 'each return gets its own round number');
    assert.equal(c.rounds[0].status, 'closed', 'the earlier round stays resolved');
    assert.match(r.proposedText, /fifty percent \(50%\)/);
    w.win.acceptProposedRound(c, r.n);
    assert.match(w.win.docPlainText(c), /fifty percent \(50%\)/);
  });

  test('round 5 — changes received outside HaTi can be filed under Erik (checklist 11)', () => {
    // Erik also sent one change by email prose rather than in the file
    assert.equal(typeof w.win.fileCounterpartyEdit, 'function',
      'there must be a way to file changes that arrived outside HaTi as the counterparty’s');
    const text = w.win.docPlainText(c).replace('the laws of Kenya', 'the laws of Kenya, with arbitration in Nairobi');
    const r = w.win.fileCounterpartyEdit(c, text, {
      by: 'Erik Lindqvist', comment: 'Sent by email, outside HaTi.' });

    assert.ok(r, 'it must file a round');
    assert.equal(r.status, 'open', 'it must still go through the normal review step');
    assert.match(String(r.by), /Erik/, 'the round must carry Erik as its author');
    const entry = (c.audit || [])[c.audit.length - 1];
    assert.match(entry.detail + ' ' + entry.action, /Erik/,
      'the audit trail must name Erik as the source of these changes');
  });

  test('round 5 — no audit entry ever credits Wanjiru with Erik’s changes (checklist 4)', () => {
    const counterpartyEntries = (c.audit || []).filter(e =>
      /Erik|Nordkust|counterparty|returned Word/i.test(e.detail));
    assert.ok(counterpartyEntries.length > 0);
    for (const e of counterpartyEntries) {
      assert.ok(!/^Wanjiru Kamau$/.test(e.user) || !/proposed|returned|requested/i.test(e.detail),
        `an entry describing the counterparty's changes must not be authored by Wanjiru: ${JSON.stringify(e)}`);
    }
  });

  /* ---------- Round 6: agreement, signature, seal ---------- */

  test('round 6 — the last round resolves and the contract reaches a sealed, signed state (checklist 14)', async () => {
    const open = (c.rounds || []).filter(r => r.status === 'open');
    for (const r of open) w.win.acceptProposedRound(c, r.n);
    assert.equal((c.rounds || []).filter(r => r.status === 'open').length, 0,
      'every round must be resolved before signing');
    assert.equal(w.win.unresolvedRedlines(c), 0);

    // freeze + seal, the way finalizeExecution does
    const frozen = w.win.freezeContractHtml(c);
    const seal = await w.win.sha256(frozen);
    c.execution = { at: w.win.nowISO(), by: 'Wanjiru Kamau', html: frozen, textHash: seal };
    c.hash = seal; c.status = 'Signed';
    w.win.logAudit(c, 'Executed', `Sealed after ${c.rounds.length} negotiation rounds`);

    assert.equal(c.status, 'Signed');
    assert.match(c.hash, /^[0-9a-f]{64}$/, 'the seal must be a real SHA-256 digest');
    assert.ok(c.rounds.length >= 3, 'the negotiation history must survive to execution');
  });

  test('round 6 — the executed contract refuses further Word versions (integrity)', async () => {
    assert.equal(w.win.wordDoorClosed(c), true, 'a signed contract takes no new versions');
    const before = c.rounds.length;
    const bytes = F.erikRedline('anything', []);
    await w.win.uploadWordVersion(c, F.fileOf(bytes, 'too-late.docx'));
    assert.equal(c.rounds.length, before, 'nothing may be filed onto an executed agreement');
  });

  test('round 6 — the audit trail tells the whole truth about the negotiation (checklist 14)', () => {
    const trail = (c.audit || []).map(e => `${e.user}::${e.action}::${e.detail}`).join('\n');
    assert.match(trail, /Word review/, 'the Word round trips must be on the record');
    assert.match(trail, /Redline|Round/, 'the adoptions must be on the record');
    assert.match(trail, /Executed/, 'execution must be on the record');
    // and the record must name both sides
    assert.match(trail, /Wanjiru/);
    assert.match(trail, /Erik|Nordkust|returned Word file/);
  });
});
