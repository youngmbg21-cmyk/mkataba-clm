/* ============================================================
   F275 — HaTi prepares the renewal note overnight
   ============================================================
   Young, 9 Sep 2026: "why cant we build the overnight feature then?" — and the
   answer was that ONE DECISION was missing rather than one night's code. Two of
   the desk's three kinds are instant readings: counting a late promise or
   unread paper at 3am gives the same rows as counting them when Home opens. The
   one genuinely PREPARED piece of work is HaTi writing the renewal memo, and
   that is the only thing on the desk that spends Copilot money with nobody
   pressing a button. Every charge in this product is booked to the person who
   set it off (f203), so somebody had to say who pays. Young ruled: THE PERSON
   WHOSE CONTRACT IT IS.

   The rules pinned here, and each is a way of failing that ruling:
   - THE OWNER PAYS. The call is metered against the contract's owner — not the
     admin, not the sweep, and never against nobody.
   - A CONTRACT WITH NO OWNER IS NOT PREPARED. Imported and uploaded paper has
     no owner and never will, and preparing it would be exactly the
     unattributed spend the ruling exists to prevent.
   - ONCE PER RENEWAL CYCLE, NOT ONCE A NIGHT. The signals carry daysToDecision,
     which moves every day, so the advice cache cannot bound this. The dedupe is
     the reminders table keyed on the DECISION DATE.
   - IT IS BOUNDED THREE WAYS: the switch, the nightly cap, and the workspace's
     own daily spend ceiling — which is middleware on every other AI path and
     therefore has to be asked by hand here.
   - IT WRITES NOTHING TO THE CONTRACT. The advice has its own table, so the
     sealed record a renewal question is always about is never touched.
   - AND THE DESK CAN SEE IT IN SERVER MODE. Home reads the LIGHT list; the memo
     rides only a single contract's own GET, so the fact travels as one word.

   THE LIFT IS THE CONDITION ON ALL OF IT: the route and the sweep go through
   one function, or the card a person runs and the card waiting in the morning
   come to say different things. f219 proves the route is unchanged. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const isoDay = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const ADVICE = { verdict: 'renegotiate', headline: 'Worth renewing, but push on the payment days.',
  because: ['They took 45 days to pay against your 30-day standard.'], pushOn: ['Payment terms'], watchIf: '' };
const tu = input => [{ type: 'tool_use', id: 'tu_rn', name: 'renewal_advice', input }];
const BODY = 'This supply agreement runs for two years and renews unless either party gives notice. '.repeat(6);

describe('F275 (1) — who pays, against a real server', () => {
  let ai, h, W, owner;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: over.name || ('Prep fixture ' + id), counterparty: 'Nandi Dairy',
    folder: FOLDER_A, status: 'Signed', fields: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], searchText: BODY,
    metadata: { expiryDate: isoDay(75), noticePeriodDays: 30 },
    ...over } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    owner = W.users.unrestricted;
    /* ONE eligible contract, and four that must each be refused for their own
       reason — a sweep that prepared everything would pass a test that only
       counted what it prepared. */
    await put('MK-OP-1', { name: 'Raw milk collection', owner: { id: owner.id, name: owner.name } });
    await put('MK-OP-2', { name: 'Migrated paper, nobody raised it' });               // no owner
    await put('MK-OP-3', { name: 'Still under review', status: 'Under Review',
      owner: { id: owner.id, name: owner.name } });                                   // not in force
    await put('MK-OP-4', { name: 'Ends in two years', metadata: { expiryDate: isoDay(700) },
      owner: { id: owner.id, name: owner.name } });                                   // outside the window
    await put('MK-OP-5', { name: 'Filed away', archived: { at: isoDay(-2), by: 'Amina' },
      owner: { id: owner.id, name: owner.name } });                                   // on the shelf
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('it prepares the one contract that qualifies, and charges the OWNER', async () => {
    ai.script(tu(ADVICE));
    const before = ai.calls.length;
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 1, 'one contract in the window with somebody to charge');
    assert.equal(ai.calls.length - before, 1, 'and exactly one Copilot call for it');

    const cfg = await W.admin.json('/api/ai/config');
    const people = cfg.spend.byPerson || [];
    const mine = people.find(p => p.userId === owner.id);
    assert.ok(mine, 'the charge is booked to the contract owner by name: ' + JSON.stringify(people));
    assert.equal(mine.requests, 1);
    assert.ok(!people.some(p => p.name === 'Amina Otieno'),
      'never to the admin — nobody pressed anything');
    assert.ok((cfg.spend.unattributed || 0) < 0.000001,
      'and never to nobody, which is the whole of what Young ruled on');
  });

  test('a contract with no owner is left alone rather than charged to nobody', async () => {
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.skipped.noOwner, 1, 'the migrated one is counted out by name');
    const c = await W.admin.json('/api/contracts/MK-OP-2');
    assert.ok(!c._renewalAdvice, 'and no note was written for it');
  });

  test('the three other refusals each hold', async () => {
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.skipped.notInForce, 1, 'paper still under review is not up for renewal');
    for (const id of ['MK-OP-3', 'MK-OP-4', 'MK-OP-5']) {
      const c = await W.admin.json('/api/contracts/' + id);
      assert.ok(!c._renewalAdvice, id + ' was not prepared');
    }
  });

  test('once per renewal cycle, not once a night', async () => {
    const before = ai.calls.length;
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 0, 'a second run prepares nothing');
    assert.equal(out.skipped.done, 1, 'and says why');
    assert.equal(ai.calls.length, before, 'no second call, no second charge');
  });

  test('the note is on the record it belongs to, stamped as HaTi’s own work', async () => {
    const c = await W.admin.json('/api/contracts/MK-OP-1');
    assert.ok(c._renewalAdvice, 'the memo is there');
    assert.equal(c._renewalAdvice.data.verdict, 'renegotiate');
    assert.equal(c._renewalAdvice.overnight, true, 'and says nobody asked for it');
    assert.equal(c._renewalAdvice.by, owner.name, 'written in the owner’s name, since they paid');
  });

  test('the light list carries the fact, so the desk can see it in server mode', async () => {
    const list = await W.admin.json('/api/contracts?limit=50');
    const row = list.rows.find(r => r.id === 'MK-OP-1');
    assert.equal(row._renewalPrep, 'night', 'one word, not the memo');
    assert.ok(!row._renewalAdvice, 'and never the memo itself on a list row');
    const other = list.rows.find(r => r.id === 'MK-OP-2');
    assert.equal(other._renewalPrep, undefined, 'absent where nothing was prepared');
  });

  test('nothing is written to the contract record', async () => {
    const c = await W.admin.json('/api/contracts/MK-OP-1');
    assert.equal(c._v, 1, 'the version has not moved since it was filed');
    assert.equal((c.audit || []).length, 0, 'and no audit line was added to a sealed record');
  });
});

describe('F275 (2) — the three bounds, against a real server', () => {
  let ai, h, W, owner;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: 'Bounded ' + id, counterparty: 'Nandi Dairy', folder: FOLDER_A, status: 'Signed',
    fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [],
    searchText: BODY, metadata: { expiryDate: isoDay(75), noticePeriodDays: 30 },
    owner: { id: owner.id, name: owner.name }, ...over } } });

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    owner = W.users.unrestricted;
    for (const n of [1, 2, 3, 4, 5]) await put('MK-BD-' + n, {});
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('the switch turns it off, and nothing is spent', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrep: false } });
    const before = ai.calls.length;
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.off, true);
    assert.equal(out.prepared, 0);
    assert.equal(ai.calls.length, before, 'a switch that leaves the spending on is not a switch');
    const cfg = await W.admin.json('/api/ai/config');
    assert.equal(cfg.limits.renewalPrep, false, 'and the panel reads it back');
  });

  test('absent means on — nothing already running has to be migrated', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrep: true } });
    const cfg = await W.admin.json('/api/ai/config');
    assert.equal(cfg.limits.renewalPrep, true);
    assert.equal(typeof cfg.limits.renewalPrepMax, 'number');
  });

  test('the nightly cap bounds a run and says it bit', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrepMax: 2 } });
    /* EXACTLY AS MANY ANSWERS AS THE CAP ALLOWS. The stand-in queues them, so a
       spare answer scripted here is handed to the NEXT test's first call — and
       the failure test below then gets a success it never asked for. */
    ai.script(tu(ADVICE)); ai.script(tu(ADVICE));
    const before = ai.calls.length;
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.prepared, 2, 'two of the three');
    assert.equal(out.cap, true, 'and the run says the cap is why it stopped');
    assert.equal(ai.calls.length - before, 2, 'a cap that does not bound the calls is a number on a page');
  });

  /* THE FAILURE CASE RUNS BEFORE THE CEILING ONE ON PURPOSE: a run that is
     stopped by the ceiling leaves its contracts undone, and a run that fails
     leaves ONE undone — so the ceiling test wants an untouched contract in
     front of it and this one wants exactly one. Ordered the other way round
     the ceiling's own run quietly prepares the contract this test is about. */
  test('a provider failure is retried tomorrow, never marked done', async () => {
    /* EVERY REMAINING CANDIDATE IS REFUSED, because the cap counts what was
       PREPARED and a run that prepares nothing is not stopped by it — so a
       single scripted 502 would refuse one contract and then be handed the
       stand-in's default answer for the next. A provider outage refuses them
       all, which is the real shape of this failure. */
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrepMax: 20 } });
    ai.script(502); ai.script(502); ai.script(502);
    const bad = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(bad.prepared, 0);
    assert.equal(bad.skipped.failed, 3, 'counted as failed rather than as prepared');
    ai.script(tu(ADVICE));
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrepMax: 1 } });
    const good = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(good.prepared, 1, 'and the next run picks it up — nothing was marked done');
  });

  test('the workspace spend ceiling stops the rest — middleware cannot reach here', async () => {
    /* THE PRECONDITION IS ASSERTED RATHER THAN ASSUMED. The ceiling can only be
       proved to bite by a run whose workspace has ALREADY spent past it, and a
       money setting is stored to four decimal places — so a "tiny" limit like
       0.000001 rounds to zero, which means DISABLED, and the test would pass by
       never being armed. */
    const spent = (await W.admin.json('/api/ai/config')).spend.cost;
    assert.ok(spent > 0.0001, 'three calls have been paid for: ' + spent);
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { renewalPrepMax: 20, dailySpendLimit: 0.0001 } });
    assert.equal((await W.admin.json('/api/ai/config')).limits.dailySpendLimit, 0.0001, 'the ceiling really is armed');
    const before = ai.calls.length;
    const out = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(out.ceiling, true, 'the run stops at the ceiling every other AI path is held to');
    assert.equal(out.prepared, 0);
    assert.equal(ai.calls.length, before, 'and spends nothing past it');
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { dailySpendLimit: 0 } });
  });

  test('with no Copilot key nothing runs and nothing is claimed', async () => {
    /* startHati always sets a key, so a workspace with none has to be asked
       for by name — a stage kinder than the thing it stands in for turns its
       test into a description. */
    const h2 = await startHati({ ANTHROPIC_API_KEY: '' });
    try {
      const W2 = await seedWorkspace(h2, { contracts: [] });
      const out = await W2.admin.json('/api/renewal-prep/run', { method: 'POST' });
      assert.equal(out.noKey, true);
      assert.equal(out.prepared, 0);
    } finally { await h2.stop(); }
  });

  test('only an admin may run it by hand', async () => {
    const r = await W.unrestricted.raw('/api/renewal-prep/run', { method: 'POST' });
    assert.equal(r.status, 403);
  });
});

describe('F275 (3) — the lift, the desk and the words', () => {
  test('there is ONE renewal advice builder and the route goes through it', () => {
    const s = read('server/server.js');
    assert.match(s, /async function aiRenewalAdvice\(/, 'the working core is lifted out');
    assert.match(s, /function renewalSignalsOf\(/, 'and so is the signals reading');
    /* The prompt is written ONCE. Two copies is how the memo a person runs and
       the memo waiting in the morning come to say different things — the
       aiPlaybookVerdicts lesson, one feature along. */
    const prompts = s.split('You are advising a business owner on an agreement coming up for renewal').length - 1;
    assert.equal(prompts, 1, 'one prompt, one place');
    const routeAt = s.indexOf("app.post('/api/ai/renewal'");
    const route = s.slice(routeAt, routeAt + 2000);
    assert.match(route, /aiRenewalAdvice\(/, 'the route calls it');
    assert.match(route, /renewalSignalsOf\(/, 'and the route reads its signals through it');
    assert.ok(!/anthropicMessages\(/.test(route), 'the route builds no call of its own');
  });

  test('the sweep names the owner as the payer, and never falls back to nobody', () => {
    const s = read('server/server.js');
    const at = s.indexOf('async function runRenewalPrep');
    assert.ok(at > 0, 'the sweep exists');
    const fn = s.slice(at, s.indexOf('\napp.post(\'/api/renewal-prep/run\'', at));
    assert.match(fn, /who:\s*\{\s*id:\s*String\(owner\.id\)/, 'the meter names the contract owner');
    assert.ok(!/aiWho\(/.test(fn), 'there is no request here to read a person off');
    assert.match(fn, /if \(!owner\)/, 'and no owner means no call at all');
  });

  test('it rides the same timer as the other two sweeps, under its own catch', () => {
    const s = read('server/server.js');
    const at = s.indexOf('function reminderSweep()');
    const fn = s.slice(at, s.indexOf('setTimeout(reminderSweep', at));
    assert.match(fn, /runReminders\(\)/);
    assert.match(fn, /runDailyBriefs\(\)/);
    assert.match(fn, /runRenewalPrep/, 'the third sweep is on the beat');
    /* THREE SWEEPS, THREE ADMIN-VISIBLE NOTES. That is the M-6 lesson stated as
       a claim rather than as a count of the word "catch": what has to be true is
       that each sweep's failure is recorded where an admin will see it, and that
       no sweep can take another down with it. */
    for (const tag of ['reminder sweep failure', 'daily brief failure', 'renewal prep failure'])
      assert.ok(fn.includes(tag), 'a sweep that fails silently is the fault this exists to close: ' + tag);
  });

  test('the word is transport and never reaches the record', () => {
    assert.match(read('js/core.js'), /delete payload\._renewalPrep;/,
      'stripped on save beside _hasBrief and _renewalAdvice');
    const s = read('server/server.js');
    assert.match(s, /_renewalPrep = v/, 'attached by the list route');
  });

  test('the desk asks the list’s word first, and says who wrote the note', () => {
    const src = read('js/desknight.js');
    assert.match(src, /c\._renewalPrep/, 'the light list’s twin is read');
    assert.match(src, /prepared: prep === 'night'/, 'and the row knows which');
    /* THE ORDER IS THE CLAIM. Read the memo first and Home is right in local
       mode and blind in server mode — the recorded defect class. */
    const at = src.indexOf('const prep =');
    const line = src.slice(at, src.indexOf(';', at));
    assert.ok(line.indexOf('_renewalPrep') < line.indexOf('_renewalAdvice'),
      'the list word is asked BEFORE the whole memo');
  });

  test('the desk reads it end to end', async () => {
    const { win } = await buildWorld({ desk: true });
    const base = { status: 'Signed', hash: 'h', folder: FOLDER_A, counterparty: 'Nandi Dairy',
      metadata: { expiryDate: isoDay(75), noticePeriodDays: 30 }, obligations: [], changes: [] };
    win.state.contracts = [
      { ...base, id: 'MK-N1', name: 'Waiting for you', _renewalPrep: 'night' },
      { ...base, id: 'MK-N2', name: 'You ran it', _renewalPrep: 'you' },
      { ...base, id: 'MK-N3', name: 'Nothing yet' },
    ];
    const items = [...win.deskItems(win.state.contracts)].filter(i => i.kind === 'renewal');
    const by = Object.fromEntries(items.map(i => [i.cid, i]));
    assert.equal(by['MK-N1'].memo, true);
    assert.equal(by['MK-N1'].prepared, true, 'HaTi wrote it');
    assert.equal(by['MK-N2'].memo, true);
    assert.equal(by['MK-N2'].prepared, false, 'somebody asked for it');
    assert.equal(by['MK-N3'].memo, false, 'and a row never claims a reading that has not happened');
  });

  test('the header still claims no clock time', () => {
    const en = read('js/i18n.js');
    const at = en.indexOf("desk_sec:");
    const line = en.slice(at, en.indexOf('\n', at));
    assert.ok(!/overnight|05:|night/i.test(line),
      'two of the three rows are instant readings and were never prepared at all — ' +
      'the fact belongs on the row it is true of, not in a heading over all three');
  });

  test('the new words are in both languages', () => {
    const s = read('js/i18n.js');
    for (const k of ['desk_ren_ready', 'set_renewal_prep', 'set_renewal_prep_body',
      'set_lim_renewal_max', 'set_lim_renewal_max_sub']) {
      assert.equal(s.split(k + ':').length - 1, 2, k + ' is written twice — once per book');
    }
  });

  test('the panel offers the switch and the cap', () => {
    const s = read('js/views/settings.js');
    assert.match(s, /id="ai-renewal-prep"/, 'money spent unasked has to be stoppable from a screen');
    assert.match(s, /ai-renewal-max/, 'and bounded from one');
    assert.match(s, /renewalPrep: !!document\.getElementById\('ai-renewal-prep'\)/, 'the save carries it');
  });
});
