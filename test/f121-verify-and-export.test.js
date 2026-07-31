/* ============================================================
   f121 — the record verifies, and the export stands alone (WP-2.5 + WP-2.4)
   ============================================================
   WP-2.5: one answer for "is this record intact" — the change chain (every
   fingerprint recomputed from stored content), the seal, and the E5
   live-vs-sealed comparison, with the FIRST broken link named. A verdict
   that says "something is wrong" without saying where is one nobody can act
   on; a "Verified" that verified nothing is the fakery this product exists
   to remove.

   WP-2.4: the export is for a reader with NO login — auditor, counsel, a
   court. It carries the whole story with every filter off, each change as
   its rendered redline, and the integrity statement embedded WITH the time
   it was run: a verification result with no "when" reads as a permanent
   property of the document, and it is a property of a moment. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

async function record(){
  const W = buildWorld({ negotiationView: true });
  const win = W.win;
  const c = { id: 'MK-V1', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' };
  win.negoInit(c);
  const cl4 = win.negoClauseList(c).find(x => x.num === '4');
  const ask = await win.negoFileChange(c, { clauseId: cl4.clauseId, changeType: 'modify',
    oldText: cl4.text, newText: F.PROTO_ASKS['4'].text, clauseLabel: 'Clause 4 · Payment Terms' },
    { side: 'counterparty', author: 'Erik Lindqvist', note: 'Cash cycle is 40 days on our side' });
  win.negoResolve(c, ask.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau',
    reply: 'Net-30 is priced into the rates' });
  const cl9 = win.negoClauseList(c).find(x => x.num === '9');
  const del = await win.negoDeleteClause(c, cl9.clauseId,
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, del.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  return { W, win, c, ask, del };
}

describe('f121 — WP-2.5: verify, naming the first broken link', () => {
  test('an untampered record verifies green, with its own timestamp', async () => {
    const { win, c } = await record();
    const r = await win.negoIntegrityReport(c);
    assert.equal(r.ok, true);
    assert.ok(r.chain.checked >= 2, 'the chain was actually walked');
    assert.match(r.detail, /Record verified/);
    assert.match(r.detail, /no alteration found/);
    assert.ok(r.at, 'the verdict carries when it was run');
    assert.match(win.negoVerifyResultHtml(r), /data-verify-ok="1"/);
  });

  test('a tampered record fails, and the FIRST broken change is named', async () => {
    const { win, c, ask } = await record();
    // The tamper: rewrite the archived ask's stored wording after the fact.
    const archived = c.negotiation.rounds[0].changes.find(x => x.id === ask.id);
    archived.newText = archived.newText.replace('forty-five (45)', 'sixty (60)');
    const r = await win.negoIntegrityReport(c);
    assert.equal(r.ok, false);
    assert.equal(r.chain.failedAt, ask.id, 'the first broken link is identified, not just "failed"');
    assert.match(r.firstBroken, /does not match its own fingerprint/);
    const html = win.negoVerifyResultHtml(r);
    assert.match(html, /data-verify-ok="0"/);
    assert.match(html, new RegExp(ask.id), 'the panel names the change');
    assert.match(html, /Nothing has been changed by this check/);
  });

  test('on an executed contract the seal is part of the answer', async () => {
    const { win, c } = await record();
    // sealString is core.js's; the world stands the shell in, so it is stated
    // here the way the shell states persist and toast.
    win.sealString = cc => 'seal|' + cc.id + '|' + String(cc.redlineText || '');
    c.status = 'Signed';
    c.hash = await win.sha256(win.sealString(c));
    const good = await win.negoIntegrityReport(c);
    assert.equal(good.seal && good.seal.ok, true, 'a true seal verifies');
    c.hash = 'deadbeef'.repeat(8);
    const bad = await win.negoIntegrityReport(c);
    assert.equal(bad.ok, false);
    assert.match(bad.firstBroken, /seal does NOT match/i);
  });

  test('the timeline screen carries both doors', async () => {
    const { win, c } = await record();
    const html = win.negoTimelineScreenHtml(c, {});
    assert.match(html, /id="ht-verify"/);
    assert.match(html, /id="ht-export"/);
    assert.match(html, /id="ht-verify-result"/, 'the verdict has a home that does not scroll away');
  });
});

describe('f121 — WP-2.4: the export stands alone', () => {
  test('every change and decision appears, with the integrity statement and its time', async () => {
    const { win, c, ask, del } = await record();
    const r = await win.negoIntegrityReport(c);
    const html = win.negoHistoryExportHtml(c, r);
    assert.match(html, /^<!doctype html>/i, 'a complete document, not a fragment');
    for (const id of [ask.id, del.id])
      assert.ok(html.includes('#' + id), `change ${id} is in the report`);
    assert.match(html, /Rejected by Wanjiru Kamau/);
    assert.match(html, /Accepted by Wanjiru Kamau/);
    assert.match(html, /Cash cycle is 40 days/, 'the stated reason travels');
    assert.match(html, /class="ht-redline"/, 'each change is a rendered redline');
    assert.match(html, /Record verified/, 'the WP-2.5 result is embedded');
    assert.ok(html.includes(String(r.at).slice(0, 19).replace('T', ' ')),
      'and WHEN it was run — a result with no time reads as a permanent property');
    assert.match(html, /not yet executed, so no seal to check/,
      'honest about a draft: no seal is a fact, not a gap papered over');
    assert.ok(!/src=|href=|fetch\(/.test(html),
      'self-contained: nothing references the app or the network');
  });

  test('a failed verification is exported as a failure — the report never launders it', async () => {
    const { win, c, ask } = await record();
    c.negotiation.rounds[0].changes.find(x => x.id === ask.id).newText += ' TAMPERED';
    const r = await win.negoIntegrityReport(c);
    const html = win.negoHistoryExportHtml(c, r);
    assert.match(html, /Integrity check FAILED/);
    assert.ok(html.includes('#' + ask.id), 'with the first broken link named in it');
  });

  test('an executed record exports its seal for independent comparison', async () => {
    const { win, c } = await record();
    win.sealString = cc => 'seal|' + cc.id + '|' + String(cc.redlineText || '');
    c.status = 'Signed';
    c.hash = await win.sha256(win.sealString(c));
    const r = await win.negoIntegrityReport(c);
    const html = win.negoHistoryExportHtml(c, r);
    assert.ok(html.includes(c.hash), 'the seal is printed so a reader can compare it elsewhere');
  });
});
