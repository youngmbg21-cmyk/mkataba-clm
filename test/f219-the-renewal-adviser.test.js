/* ============================================================
   F219 — the renewal adviser (W2-4, the gap-map order)
   ============================================================
   HaTi has sent renewal alarms since the sweep was built. An alarm says a
   date is coming; it does not say what to do about it, and "renew,
   renegotiate or let it lapse" is the actual decision somebody has to make
   — usually without re-reading the contract. This turns the alarm into a
   recommendation with its reasons named, and puts the way to act on it one
   press away.

   The rules pinned here:
   - THE DATES ARE NOT THE MODEL'S. Every fact the recommendation rests on is
     computed from the stored record and handed over as `signals`; the model
     weighs them and writes sentences. A confident wrong date is the one
     failure this feature cannot afford, so it is never asked for one.
   - THE CARD IS DRAWN BY THE DATES, not by the AI: renewalWindow decides
     whether it appears, and a workspace with no Copilot key still gets the
     card, the dates and the button.
   - A PROPOSAL, NOT A DECISION. Nothing renews, cancels or drafts anything;
     "Start the renewal" opens the family machinery's OWN dialog with the
     kind preselected — one creation door, not a second.
   - IT NEVER TRAVELS: our advice about their paper is stripped from the
     share payload, from PUT and from the client's save, like the brief.
   - AN AMENDMENT DOES NOT RENEW ITSELF, and a draft, declined or archived
     agreement is not up for renewal. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const isoDay = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const ADVICE = {
  verdict: 'renegotiate',
  headline: 'Worth renewing, but push on the payment days before you do.',
  because: ['They took 45 days to pay against your 30-day standard.', 'The value has not moved in two years.'],
  pushOn: ['Payment terms', 'Liability cap'],
  watchIf: 'They agree to 30 days without a price rise.',
};
const tu = input => [{ type: 'tool_use', id: 'tu_rn', name: 'renewal_advice', input }];

describe('F219 — the adviser, against a real server', () => {
  let ai, h, W;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: over.name || ('Renewal fixture ' + id), counterparty: 'Nandi Dairy',
    folder: FOLDER_A, status: 'Signed', fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    searchText: 'This supply agreement runs for two years and renews unless either party gives notice. '.repeat(6),
    ...over } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    await put('MK-RN-1', { name: 'Raw milk collection',
      metadata: { expiryDate: isoDay(75), noticePeriodDays: 30, renewalType: 'auto-renew' },
      rounds: [{ n: 1, at: isoDay(-400), status: 'closed' }],
      obligations: [{ id: 'o1', desc: 'Quarterly volume report', due: isoDay(-3), status: 'open' }] });
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('the signals are computed from the record — the model is never asked for a date', async () => {
    ai.script(tu(ADVICE));
    const r = await W.admin.json('/api/ai/renewal', { method: 'POST', body: { id: 'MK-RN-1' } });
    const sig = r.advice.signals;
    assert.equal(sig.expiry, isoDay(75), 'the effective expiry, family-aware');
    assert.equal(sig.decideBy, isoDay(45), 'expiry minus the 30 days notice — computed here, not guessed there');
    assert.equal(sig.daysToDecision, 45);
    assert.equal(sig.renewalType, 'auto-renew');
    assert.equal(sig.overdueObligations, 1, 'what is still owed is a reason to think twice');
    assert.equal(sig.roundsNegotiated, 1);
    const sent = ai.calls[ai.calls.length - 1].raw;
    assert.ok(sent.includes(isoDay(45)), 'and the dates are HANDED to the model');
    assert.match(sent, /never restate a date differently|use them as given/i,
      'with an instruction not to restate them');
  });

  test('the recommendation comes back whole and is cached until the facts move', async () => {
    const before = ai.calls.length;
    const again = await W.admin.json('/api/ai/renewal', { method: 'POST', body: { id: 'MK-RN-1' } });
    assert.equal(again.cached, true);
    assert.equal(ai.calls.length, before, 'unchanged facts are paid for once');
    assert.equal(again.advice.data.verdict, 'renegotiate');
    assert.equal(again.advice.data.pushOn.length, 2);

    /* MOVE A FACT AND IT REGENERATES BY ITSELF. Ticking off the overdue
       commitment is the realistic case — and the one an executed contract
       actually allows, since obligations are deliberately outside the
       post-signature immutability rule (they are kept BESIDE the wording,
       not part of it). The advice was resting on that overdue item, so it
       must not go on saying so once it is done. */
    ai.script(tu({ ...ADVICE, verdict: 'renew', headline: 'Carry on as it stands.' }));
    const c = await W.admin.json('/api/contracts/MK-RN-1'); const v = c._v;
    delete c._v; delete c._brief; delete c._renewalAdvice;
    c.obligations = [{ ...c.obligations[0], status: 'done' }];
    await W.admin.json('/api/contracts/MK-RN-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    const moved = await W.admin.json('/api/ai/renewal', { method: 'POST', body: { id: 'MK-RN-1' } });
    assert.notEqual(moved.cached, true, 'a settled commitment is a changed question');
    assert.equal(moved.advice.signals.overdueObligations, 0);
    assert.equal(moved.advice.data.verdict, 'renew');
  });

  test('it rides the record as transport, and a viewer may read it', async () => {
    const c = await W.admin.json('/api/contracts/MK-RN-1');
    assert.ok(c._renewalAdvice, 'carried on the full record');
    assert.equal(c._renewalAdvice.data.verdict, 'renew');
    const asViewer = await W.novalues.json('/api/contracts/MK-RN-1');
    assert.ok(asViewer._renewalAdvice, 'a colleague reads the recommendation');
    assert.equal(asViewer._renewalAdvice.signals.valueInWorkspaceCurrency, undefined,
      'but not the money inside it, if money is not theirs to see');
  });

  test('generating is editor-and-up, and scope is scope', async () => {
    await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only Two', email: 'viewer2@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const v = h.client('viewer2');
    await v.json('/api/login', { method: 'POST', body: { email: 'viewer2@example.co.ke', password: 'temporary-pass-1' } });
    const refused = await v.raw('/api/ai/renewal', { method: 'POST', body: { id: 'MK-RN-1' } });
    assert.equal(refused.status, 403, 'it spends Copilot money');
    const outOfScope = await W.restricted.raw('/api/ai/renewal', { method: 'POST', body: { id: 'MK-NOPE' } });
    assert.equal(outOfScope.status, 404);
  });

  test('our advice about their paper never travels to them', async () => {
    const full = await W.admin.json('/api/contracts/MK-RN-1');
    delete full._v;
    const mk = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'view', org: 'Highland Corporate Ltd', contract: full },
      recipient: { name: 'Outside Advisor', email: 'advisor@example.co.ke' }, channel: 'link', purpose: 'view' } });
    const token = (mk.token || (mk.link || '').split('share=')[1] || '').replace(/^t:/, '');
    const pub = h.client('public');
    const r = await pub.raw('/api/shares/' + encodeURIComponent(token));
    assert.equal(r.status, 200);
    assert.ok(!r.text.includes('Carry on as it stands'), 'the recommendation is stripped');
    assert.ok(!/_renewalAdvice/.test(r.text), 'not even as an empty field');
  });

  test('a forged recommendation pushed through a save is ignored', async () => {
    const c = await W.admin.json('/api/contracts/MK-RN-1'); const v = c._v;
    delete c._v; delete c._brief;
    c._renewalAdvice = { v: 1, data: { verdict: 'lapse', headline: 'FORGED' } };
    await W.admin.json('/api/contracts/MK-RN-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    const again = await W.admin.json('/api/contracts/MK-RN-1');
    assert.equal(again._renewalAdvice.data.headline, 'Carry on as it stands.', 'the table answers, not the record');
    assert.ok(!JSON.stringify(again).includes('FORGED'));
  });
});

describe('F219 — the window, and the card it draws', () => {
  test('renewalWindow is the one reading, and it refuses what is not up for renewal', () => {
    const ob = read('js/obligations.js');
    const fn = ob.slice(ob.indexOf('function renewalWindow'), ob.indexOf('function renewalDecisionsDue'));
    assert.match(fn, /c\.parentId \|\| c\.archived/, 'an amendment does not renew itself; a filed-away one is not up');
    assert.match(fn, /c\.status==='Declined' \|\| c\.status==='Draft'/, 'nor a draft or a dead deal');
    assert.match(fn, /effectiveExpiry/, 'family-aware — a signed amendment moves it');
    assert.match(fn, /missed: days<0/, 'a passed deadline stays ON the card, where it matters most');
    assert.match(fn, /inWindow: days<=RENEWAL_WINDOW_DAYS/, 'one named threshold, not a number inline');
    assert.match(ob, /const RENEWAL_WINDOW_DAYS = 90;/, 'the same 90 days the first reminder email uses');
  });

  test('the card draws from the dates, so no Copilot key still leaves it useful', () => {
    const ai = read('js/ai.js');
    const fn = ai.slice(ai.indexOf('function renewalCardHtml'), ai.indexOf('function renderRenewalSection'));
    assert.match(fn, /if\(!w\|\|!w\.inWindow\) return '';/, 'outside the window the column is what it always was');
    assert.match(fn, /rn_not_asked/, 'with no advice yet it says what asking would buy');
    assert.match(fn, /data-rn-start/, 'and the way to act is there either way');
    assert.ok(fn.indexOf('rn_decide_by') < fn.indexOf('a?`'),
      'the DATES print before the opinion — the fact leads');
  });

  test('"Start the renewal" opens the family machinery, not a second creation path', () => {
    const ai = read('js/ai.js');
    assert.match(ai, /openCreateAmendmentModal\(c,null,\{relation:'renewal'\}\)/);
    assert.ok(!/createAmendment\(/.test(ai), 'js/ai.js never mints a contract of its own');
    const fam = read('js/family.js');
    assert.match(fam, /const relOpen = \(opts && isRelation\(opts\.relation\)\) \? opts\.relation : 'amendment';/,
      'the dialog gained a preselect and defaults exactly as before');
  });

  test('the card is mounted on Key terms, above the family it belongs to', () => {
    const ct = read('js/views/contract.js');
    const fn = ct.slice(ct.indexOf('function renderKeyTermsSide'), ct.indexOf('function renderKeyTermsSide') + 900);
    assert.ok(fn.indexOf('renewal-host') < fn.indexOf('family-section'), 'the question of the week leads');
    assert.match(fn, /renderRenewalSection\(c\)/);
  });

  test('the feature is metered under its own name, and the words are in both languages', () => {
    assert.match(read('server/server.js'), /renewal: 'Renewal adviser'/,
      'named on arrival so its spend never lands in Other');
    const i18n = read('js/i18n.js');
    for (const k of ['rn_title', 'rn_decide_by', 'rn_missed', 'rn_ask', 'rn_start', 'rn_no_ai',
      'rn_verdict_renew', 'rn_verdict_renegotiate', 'rn_verdict_lapse', 'rn_verdict_unclear'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
