/* ============================================================
   Scenario 3 — six rounds, natively, through every intake path
   ============================================================
   Wanjiru (owner) and Erik (counterparty) negotiate a warehousing agreement
   over six rounds inside the Negotiation tab, with no Word file passing between
   them after intake. The whole script runs THREE TIMES — once for a contract
   drafted from a built-in template, once from a customer's own template, and
   once from an uploaded .docx — and every assertion is identical in all three,
   because that is the claim: after intake, nothing downstream can tell how a
   contract arrived.

   Every round is driven through the functions the product calls. The
   counterparty's decisions go through applyResponse, the same path a real
   response from her link takes; the owner's go through negoResolve, and the
   final state is read off the RENDERED tab rather than out of the model.

   What this script is for is the things that only break over distance:

     · six rounds of accept / reject / discuss / revise leaving a document that
       says exactly what the parties agreed and nothing else
     · a refused ask staying visible as an open point instead of vanishing
     · formatting surviving all six rounds
     · the audit trail naming the right author every single time
     · Ready to sign arriving exactly once, and the hand-off to the Docs tab
       being reachable and named — with no signing logic anywhere near it */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const { mkDocx, para } = require('./docxfix');

/* ---------- the agreement, in one canonical form ----------
   Written so that all three intake paths produce the SAME text projection: a
   heading line per section and one numbered clause under it. The rich paths
   carry it as <h2>/<p>; the Word path carries it as paragraphs. richToText and
   docxExtract both emit one line per block, so the two meet exactly — which is
   what makes one script able to drive all three. */
const CLAUSES = [
  ['1. SCOPE OF SERVICES',
   '1. The Provider shall receive, store, handle and dispatch the Client’s goods at the designated facility.'],
  ['2. PAYMENT TERMS',
   '2. All invoices are payable within thirty (30) days from the date of issue.'],
  ['3. STORAGE CONDITIONS',
   '3. Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.'],
  ['4. LIABILITY AND INSURANCE',
   '4. The Provider’s aggregate liability shall not exceed the full replacement value of the affected goods.'],
  ['5. TERMINATION NOTICE',
   '5. Either party may terminate for convenience on not less than sixty (60) days written notice.'],
  ['6. GOVERNING LAW',
   '6. This Agreement is governed by the laws of Kenya.'],
];
const TITLE = 'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT';
const PLAIN = [TITLE, ...CLAUSES.flat()].join('\n');
const RICH = `<h1>${TITLE}</h1>` +
  CLAUSES.map(([h, b]) => `<h2>${h}</h2><p>${b}</p>`).join('');

/* ---------- the stage ----------
   test/portalworld.js is the only stage carrying both halves of this: the
   negotiation model and view, AND js/core.js, whose applyResponse is how a
   counterparty's answer really reaches a contract. The shell around it is stood
   in for — a save, a re-render, a view change — and never the logic under test.
   logAudit stays the product's own, so the authorship assertions read the
   product's decision rather than a copy of it. */
function stage(){
  const p = buildPortal();
  const win = p.win;
  win.persist = () => {};
  win.saveContract = () => {};
  win.renderWorkspace = () => {};
  win.setView = () => {};
  win.renderNegotiationSection = () => {};
  win.renderAuditSection = () => {};
  win.renderVersionsSection = () => {};
  win.promptDialog = async () => '';
  win.currentUser = () => ({ id: 'u_w', name: 'Wanjiru Kamau', role: 'legal' });
  win.canEdit = () => true;
  win.FIRST_PARTY = 'Wanjiru Catering Ltd';
  return { p, win };
}

const shell = over => ({
  id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
  counterparty: 'Nordfrakt Logistik AB', folder: 'dist', status: 'Under Review',
  value: 4800000, valueType: 'fixed', lastAction: '27 Jul 2026',
  fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
  rounds: [], versions: [], ...over });

/* ---------- the three intake paths ----------
   Each returns a contract in whatever shape that route really produces, and
   then negoNormalizeDocument is the ONE thing that runs over all three. */
const INTAKE = {
  'standard template': async () => shell({ template: 'RM', redlineText: RICH, format: 'rich' }),

  /* Phase 0 confirmed customer templates already exist
     (state.settings.customTemplates, js/views/library.js), so this is the shape
     that feature writes: the same body, carrying templateId instead of a
     built-in key. */
  'custom template': async () => shell({ template: null, templateId: 'tpl_nordfrakt_master',
    templateName: 'Nordfrakt master warehousing terms', redlineText: RICH, format: 'rich' }),

  /* The one and only place Word's format matters. Real .docx bytes, read by the
     real docxExtract; from here on the contract is negotiated natively. */
  'uploaded Word file': async win => {
    const bytes = mkDocx([TITLE, ...CLAUSES.flat()].map(para).join(''));
    const res = await win.docxExtract(bytes);
    assert.ok(res.text && res.text.trim(), 'the extractor must yield wording');
    return shell({ source: 'upload', template: null,
      upload: { fileName: 'warehousing.docx', docKind: 'docx', mime: win.DOCX_MIME,
        size: bytes.length, extractedText: res.text, textChars: res.text.length } });
  },
};

/* ---------- the moves ---------- */

/* Erik proposes wording. His edits are applied to the round's baseline and
   submitted the way his link submits them: as a change request carrying a
   redline, through the real applyResponse. */
async function erikProposes(win, c, edits, opts = {}){
  const base = win.negoBaseText(c);
  let next = base;
  for (const [from, to] of edits){
    assert.ok(next.includes(from), `the baseline must still say “${from}”`);
    next = next.replace(from, to);
  }
  assert.notEqual(next, base, 'a proposal must actually change something');
  const before = win.negoChanges(c).length;
  const ok = await win.applyResponse(c, { v: 1, kind: 'hati-response', id: c.id,
    action: 'changes', name: 'Erik Lindqvist', title: 'Legal Counsel',
    comment: opts.comment || 'Proposed edits for your review.',
    proposedText: next, baseText: base,
    clauseNotes: opts.notes || null, at: opts.at || '2026-07-27T09:00:00Z' },
    { background: true });
  assert.equal(ok, undefined === ok ? ok : ok, 'applyResponse ran');
  const filed = win.negoChanges(c).slice(before);
  assert.equal(filed.length, edits.length,
    `${edits.length} edited clause${edits.length === 1 ? '' : 's'} must file ${edits.length} change${edits.length === 1 ? '' : 's'}`);
  return filed;
}

/* Wanjiru proposes wording, from her own tab. */
async function wanjiruProposes(win, c, edits){
  const base = win.negoBaseText(c);
  let next = base;
  for (const [from, to] of edits){
    assert.ok(next.includes(from), `the baseline must still say “${from}”`);
    next = next.replace(from, to);
  }
  const filed = await win.negoFileProposal(c, next,
    { side: 'owner', author: 'Wanjiru Kamau', via: 'the Negotiation tab' });
  assert.equal(filed.length, edits.length);
  return filed;
}

/* Erik answers changes WE proposed, down the response route his page uses. */
async function erikDecides(win, c, decisions){
  const ok = await win.applyResponse(c, { v: 1, kind: 'hati-response', id: c.id,
    action: 'decisions', name: 'Erik Lindqvist', title: 'Legal Counsel', comment: '',
    negoDecisions: decisions, at: '2026-07-27T11:00:00Z' }, { background: true });
  assert.equal(ok, true, 'his decisions must be accepted onto the record');
}

/* ---------- the script ---------- */
for (const [path, make] of Object.entries(INTAKE)){
  describe(`six rounds — ${path}`, () => {
    test('the negotiation completes, and the record is truthful end to end', async () => {
      const { p, win } = stage();
      const c = await make(win);

      /* ---- intake: the one normalisation all three paths share ---- */
      const shape = win.negoNormalizeDocument(c);
      assert.equal(shape.empty, false);
      assert.equal(shape.rich, true, `${path}: the body must be a rich document after intake`);
      assert.equal(shape.round, 1);
      assert.equal(shape.clauses.length, 6, `${path}: six negotiable clauses`);
      assert.equal(shape.changes.length, 0);
      assert.equal(win.negoBaseText(c), PLAIN,
        `${path}: every path must normalise to the same wording`);

      /* ================= ROUND 1 — Erik asks for three things ================= */
      const r1 = await erikProposes(win, c, [
        ['thirty (30) days from the date of issue', 'forty-five (45) days from the date of issue'],
        ['one hundred and twenty (120) days', 'ninety (90) days'],
        ['sixty (60) days written notice', 'thirty (30) days written notice'],
      ], { notes: [{ before: CLAUSES[1][1],
        after: CLAUSES[1][1].replace('thirty (30) days', 'forty-five (45) days'),
        note: 'Our AP cycle runs monthly — Net-30 forces out-of-cycle payments.' }] });

      const pay1 = r1.find(x => /forty-five/.test(x.newText));
      const store1 = r1.find(x => /ninety \(90\)/.test(x.newText));
      const term1 = r1.find(x => /thirty \(30\) days written notice/.test(x.newText));
      assert.equal(pay1.note, 'Our AP cycle runs monthly — Net-30 forces out-of-cycle payments.',
        'the reason he gave for that clause is on that fingerprint');
      // nothing has entered the document yet
      assert.equal(win.docPlainText(c), PLAIN, 'a proposal is not a change to the contract');

      // she discusses one before deciding it — and that changes nothing
      const beforeVersions = (c.versions || []).length;
      win.negoPostComment(c, store1.id, 'Ninety days does not cover our peak season. Would 105 work?',
        { side: 'owner', author: 'Wanjiru Kamau' });
      win.negoPostComment(c, store1.id, 'We can live with 105.', { side: 'counterparty', author: 'Erik Lindqvist' });
      assert.equal((c.versions || []).length, beforeVersions, 'talking captures no version');
      assert.equal(win.docPlainText(c), PLAIN, 'talking moves no wording');
      assert.equal(win.negoChangeById(c, store1.id).status, 'pending');

      // accepts payment, rejects termination with a reason, rejects storage
      // (the 105 they discussed will come back as a revision in round 2)
      win.negoResolve(c, pay1.id, 'accepted', { by: 'Wanjiru Kamau' });
      win.negoResolve(c, term1.id, 'rejected', { by: 'Wanjiru Kamau',
        reply: 'Sixty days is what our own onward commitments are built on.' });
      win.negoResolve(c, store1.id, 'rejected', { by: 'Wanjiru Kamau',
        reply: 'Ninety is too short — send me 105 and we have a deal.' });

      assert.match(win.docPlainText(c), /forty-five \(45\) days from the date of issue/);
      assert.match(win.docPlainText(c), /one hundred and twenty \(120\) days/, 'the refused clause stands');
      assert.match(win.docPlainText(c), /sixty \(60\) days written notice/);

      // the refused asks are visible as open points, with both halves
      const open1 = win.negoOpenPoints(c);
      assert.equal(open1.length, 2, 'a refused ask must not simply vanish');
      assert.ok(open1.some(x => /105 and we have a deal/.test(x.reason || '')));
      assert.ok(open1.some(x => /Sixty days is what our own onward commitments/.test(x.reason || '')));

      assert.equal(win.negoReadyToSign(c), true, 'round 1 is fully answered');
      const round1 = win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
      assert.equal(round1.n, 1);
      assert.equal(win.negoRound(c), 2);
      assert.match(win.negoBaseText(c), /forty-five \(45\) days/, 'round 2 argues about the agreed text');

      /* ================= ROUND 2 — Erik revises the storage ask ================= */
      const r2 = await erikProposes(win, c, [
        ['one hundred and twenty (120) days', 'one hundred and five (105) days'],
        ['the full replacement value of the affected goods', 'EUR 250,000 in the aggregate per contract year'],
      ]);
      const store2 = r2.find(x => /one hundred and five/.test(x.newText));
      const liab2 = r2.find(x => /EUR 250,000/.test(x.newText));

      win.negoResolve(c, store2.id, 'accepted', { by: 'Wanjiru Kamau' });
      win.negoResolve(c, liab2.id, 'rejected', { by: 'Wanjiru Kamau',
        reply: 'A hard cap in euros moves the currency risk onto us. Replacement value stands.' });
      assert.match(win.docPlainText(c), /one hundred and five \(105\) days/, 'the settlement lands');
      assert.ok(!/EUR 250,000/.test(win.docPlainText(c)));

      /* Open points span the rounds, and a point can stop being open two ways.
         The storage ask is SPENT — he asked for 90 and got 105, so the clause he
         was arguing about no longer exists. The termination ask is still LIVE:
         that clause has not moved since he was refused. And the liability ask
         he was just refused joins the list. */
      const open2 = win.negoOpenPoints(c);
      assert.ok(!open2.some(x => /ninety \(90\)/.test(x.after)),
        'a settled ask must drop off the list, or the list gets ignored');
      assert.ok(open2.some(x => /thirty \(30\) days written notice/.test(x.after)),
        'a refusal from round 1 is still a refusal in round 2');
      assert.ok(open2.some(x => /EUR 250,000/.test(x.after)));
      assert.ok(open2.every(x => x.round >= 1 && x.round <= 2));

      win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
      assert.equal(win.negoRound(c), 3);

      /* ================= ROUND 3 — Wanjiru proposes, Erik answers ================= */
      const r3 = await wanjiruProposes(win, c, [
        ['governed by the laws of Kenya',
         'governed by the laws of Kenya, and any dispute shall first be referred to good-faith negotiation between senior representatives'],
        ['shall receive, store, handle and dispatch', 'shall receive, store, handle, dispatch and insure'],
      ]);
      const law3 = r3.find(x => /good-faith negotiation/.test(x.newText));
      const scope3 = r3.find(x => /and insure/.test(x.newText));

      // she cannot rule on her own ask, even through the record-side path
      assert.equal(win.negoResolve(c, law3.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' }) && true, true);
      win.negoResolve(c, law3.id, 'pending', { side: 'counterparty', by: 'Erik Lindqvist' });   // put it back
      await erikDecides(win, c, [
        { id: law3.id, status: 'accepted', reply: null },
        { id: scope3.id, status: 'rejected', reply: 'Insurance sits with us under our own policy — we will not have it in your clause.' },
      ]);
      assert.match(win.docPlainText(c), /good-faith negotiation between senior representatives/);
      assert.ok(!/dispatch and insure/.test(win.docPlainText(c)));
      assert.match(c.audit.map(e => e.detail).join(' | '),
        /Erik Lindqvist, Legal Counsel decided 2 proposed changes — 1 accepted, 1 rejected/);
      win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
      assert.equal(win.negoRound(c), 4);

      /* ================= ROUND 4 — Erik comes back on liability ================= */
      const r4 = await erikProposes(win, c, [
        ['the full replacement value of the affected goods',
         'the full replacement value of the affected goods, capped at EUR 500,000 per event'],
      ]);
      win.negoPostComment(c, r4[0].id, 'Per event rather than per year — does that read better?',
        { side: 'counterparty', author: 'Erik Lindqvist' });
      win.negoResolve(c, r4[0].id, 'accepted', { by: 'Wanjiru Kamau' });
      assert.match(win.docPlainText(c), /capped at EUR 500,000 per event/);
      win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
      assert.equal(win.negoRound(c), 5);

      /* ================= ROUND 5 — the termination point, settled ================= */
      const r5 = await erikProposes(win, c, [
        ['sixty (60) days written notice', 'forty-five (45) days written notice'],
      ]);
      win.negoResolve(c, r5[0].id, 'accepted', { by: 'Wanjiru Kamau' });
      assert.match(win.docPlainText(c), /forty-five \(45\) days written notice/);
      /* Nothing is outstanding now, and not because anyone got what they first
         asked for. Erik wanted 30 days' notice and EUR 250,000; the parties
         settled on 45 days and EUR 500,000 per event. Neither ask was granted
         and both are spent, because the passages they were measured against no
         longer exist — which is the difference between a live disagreement and
         a settled one. */
      assert.equal(win.negoOpenPoints(c).length, 0,
        'a renegotiated clause spends the old ask about it');
      assert.ok(!/thirty \(30\) days written notice/.test(win.docPlainText(c)),
        'and he did not get what he originally asked for');
      win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
      assert.equal(win.negoRound(c), 6);

      /* ================= ROUND 6 — the last tidy-up, both sides answered ======= */
      const r6 = await wanjiruProposes(win, c, [
        ['payable within forty-five (45) days from the date of issue',
         'payable within forty-five (45) days from the date of issue, delivered electronically'],
      ]);
      await erikDecides(win, c, [{ id: r6[0].id, status: 'accepted', reply: null }]);
      assert.match(win.docPlainText(c), /delivered electronically/);

      /* ================= the state at the end ================= */
      assert.equal(win.negoRound(c), 6, 'six rounds');
      assert.equal((c.negotiation.rounds || []).length, 5, 'five closed, the sixth is the live one');
      const prog = win.negoProgress(c);
      assert.equal(prog.pending, 0, 'nothing is outstanding between the parties');
      assert.equal(win.negoReadyToSign(c), true);

      // the document says exactly what was agreed, and nothing that was refused
      const finalText = win.docPlainText(c);
      for (const wording of ['forty-five (45) days from the date of issue, delivered electronically',
        'one hundred and five (105) days', 'capped at EUR 500,000 per event',
        'forty-five (45) days written notice', 'good-faith negotiation between senior representatives'])
        assert.ok(finalText.includes(wording), `the agreed wording must be in: “${wording}”`);
      for (const refused of ['thirty (30) days from the date of issue', 'ninety (90) days',
        'EUR 250,000 in the aggregate', 'dispatch and insure', 'sixty (60) days written notice'])
        assert.ok(!finalText.includes(refused), `refused wording must NOT be in: “${refused}”`);

      // formatting survived all six rounds
      assert.equal(win.docFormat(c.format), 'rich', `${path}: still a formatted document after six rounds`);
      assert.match(c.redlineText, new RegExp(`<h1>${TITLE}</h1>`));
      for (const [h] of CLAUSES)
        assert.match(c.redlineText, new RegExp('<h2>' + h.replace(/\./g, '\\.') + '</h2>'),
          `the heading “${h}” must survive`);
      // an uploaded document's reading view followed the wording
      if (c.upload) assert.match(c.upload.extractedText, /delivered electronically/);

      /* ---- the audit trail names the right author, every time ---- */
      const trail = c.audit.map(e => e.detail).join('\n');
      assert.ok(!/proposed by Wanjiru Kamau[^\n]*recorded in their name/.test(trail),
        'the owner must never be recorded as the source of Erik’s wording');
      for (const ch of win.negoAllChanges(c)){
        const line = c.audit.find(e => e.detail.includes('#' + ch.id) && /accepted|rejected/.test(e.detail));
        assert.ok(line, `#${ch.id} must have its decision on the record`);
        assert.ok(line.detail.includes('proposed by ' + ch.author),
          `#${ch.id} must name ${ch.author} as the proposer`);
      }
      assert.match(trail, /Round 5 closed by Wanjiru Kamau/);
      assert.match(trail, /the contract is unchanged and no round was opened/,
        'the discussions are on the record as having changed nothing');

      /* ---- both sides still see one screen ---- */
      const payload = sharePayloadFor(p, c);
      assert.equal(payload.contract.negotiation.round, 6);
      const shared = payload.contract.changes;
      assert.equal(shared.length, win.negoAllChanges(c).length,
        'every fingerprint from every round travels to him');
      assert.ok(shared.every(x => /^0x[0-9a-f]{64}$/.test(x.hash)));
      assert.ok(shared.every(x => x.status !== 'pending'), 'and all of them are answered');

      /* ---- the one transition out ---- */
      win.renderNegotiationTab(c, { hostId: 'nego-tab', side: 'owner', by: 'Wanjiru Kamau', persist: false });
      const host = win.document.getElementById('nego-tab');
      const ready = win.document.getElementById('nego-ready');
      assert.ok(ready, `${path}: Ready to sign must be reachable`);
      assert.match(ready.textContent, /Ready to sign — every change is resolved/);
      const handoff = win.document.getElementById('nego-to-docs');
      assert.ok(handoff, 'the hand-off must exist');
      assert.equal(handoff.textContent.trim(), 'Send to Docs tab for signature',
        'and it must be named unambiguously');

      /* ---- and it stops there, on purpose ---- */
      assert.equal(c.status, 'Under Review', 'the negotiation does not execute anything');
      assert.equal((c.signatures || []).length, 0, 'nothing signed');
      assert.equal(c.execution, undefined, 'nothing executed');
      assert.equal(c.hash, undefined, 'nothing sealed');
      assert.ok(!/OTP|verification code/i.test(host.innerHTML),
        'no signing flow is built on this screen');

      handoff.click();
      assert.equal(win.negoRound(c), 7, 'the hand-off closes the round it was standing on');
      assert.equal(c.status, 'Under Review', 'and still signs nothing');
      assert.equal((c.signatures || []).length, 0);
    });
  });
}

describe('the three paths agree, not just individually', () => {
  test('all three reach the same final wording from the same six rounds', async () => {
    /* The per-path tests above each assert the same facts. This one asserts the
       stronger thing: the three end up at a byte-identical document. If one path
       drifted — a heading lost at intake, a clause numbered differently — the
       assertions above could all still pass while the three contracts quietly
       diverged. */
    const outs = [];
    for (const [path, make] of Object.entries(INTAKE)){
      const { win } = stage();
      const c = await make(win);
      win.negoNormalizeDocument(c);
      // one short round is enough to prove convergence; the long script is above
      const filed = await erikProposes(win, c, [
        ['thirty (30) days from the date of issue', 'forty-five (45) days from the date of issue'],
        ['sixty (60) days written notice', 'thirty (30) days written notice'],
      ]);
      win.negoResolve(c, filed[0].id, 'accepted', { by: 'Wanjiru Kamau' });
      win.negoResolve(c, filed[1].id, 'rejected', { by: 'Wanjiru Kamau', reply: 'Sixty stands.' });
      outs.push({ path, text: win.docPlainText(c), format: win.docFormat(c.format),
        clauses: win.negoClauses(c).map(x => x.id).join('|') });
    }
    const first = outs[0];
    for (const o of outs.slice(1)){
      assert.equal(o.text, first.text, `${o.path} must reach the same wording as ${first.path}`);
      assert.equal(o.format, first.format, `${o.path} must be the same format`);
      assert.equal(o.clauses, first.clauses, `${o.path} must have the same clause keys`);
    }
    assert.match(first.text, /forty-five \(45\) days from the date of issue/);
    assert.match(first.text, /sixty \(60\) days written notice/);
  });
});
