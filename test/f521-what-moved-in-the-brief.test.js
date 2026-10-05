/* f521 — "WHAT MOVED" IN THE BRIEF (work order "the board that answers
   right", Part 11, 5 Oct 2026)

     A. the board hands over its shelf's top three, capped and dated, once per
        change (like kept views); the route refuses more, and drops a key that
        is not a shelf finding's;
     B. the brief that goes anyway prints them "as of" their day, each with a
        link that opens its chart on Home; a finding older than the brief's
        period is left out;
     C. the link opens the board at that card (HASH_GO.moved, never a token);
        an id no longer on the shelf just lands on the board;
     D. no new switch: the brief's own daily / weekly / off decides. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A } = require('./helpers');
const { read, strip, J, boardWorld } = require('./board-world');

const pad = n => String(n).padStart(2, '0');
const isoDay = off => { const d = new Date(Date.now() + off * 86400000); return d.toISOString().slice(0, 10); };

describe('F521 (A) — the board hands over its top three', () => {
  const world = () => {
    const sent = [];
    const w = boardWorld({ before: x => { x.API_MODE = () => true; x.api = (path, method, body) => { sent.push({ path, method, body: J(body) }); return Promise.resolve({ ok: true }); }; } });
    w.hbInsightsToday = () => ['pay', 'sign', 'rounds', 'ren', 'pay'].map((k, i) => ({ id: k + (i === 4 ? '.mine' : ''), title: 'Finding ' + i, say: 'up from ' + i }));
    w.eval('hbInsightsToday = window.hbInsightsToday');
    return { w, sent };
  };
  test('capped at three, dated, HaTi\'s own sentence', () => {
    const { w } = world();
    const out = J(w.hbMovedOf());
    assert.equal(out.length, 3);
    assert.deepEqual(out[0], { say: 'Finding 0 — up from 0', key: 'pay', at: w.hbToday() });
  });
  test('sent once per change, not on every paint', async () => {
    const { w, sent } = world();
    w.hbMovedSync(); w.hbMovedSync();
    assert.equal(sent.length, 1); assert.equal(sent[0].path, 'home/moved'); assert.equal(sent[0].method, 'PUT');
    assert.equal(sent[0].body.items.length, 3);
  });
  test('what was sent is this tab\'s own: the shared board record is never written (two tabs woke each other)', () => {
    const { w, sent } = world();
    const before = JSON.stringify(w.hbS());
    w.hbMovedSync();
    assert.equal(sent.length, 1);
    assert.equal(JSON.stringify(w.hbS()), before, 'no save, so no storage event for another tab');
  });
});

describe('F521 (B, D) — the brief prints them, in their period, with a link', () => {
  let h, W, mail;
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { if (h) await h.stop(); });
  test('the route keeps three at most and drops what is not a finding', async () => {
    assert.equal((await W.admin.raw('/api/home/moved', { method: 'PUT', body: { items: [1, 2, 3, 4].map(i => ({ say: 'x' + i, key: 'pay', at: isoDay(0) })) } })).status, 400);
    const r = await W.admin.json('/api/home/moved', { method: 'PUT', body: { items: [{ say: 'ok', key: 'pay', at: isoDay(0) }, { say: 'bad', key: '../x', at: isoDay(0) }, { say: 'no day', key: 'ren', at: 'today' }] } });
    assert.deepEqual(r.items.map(i => i.say), ['ok']);
  });
  test('a brief that goes anyway carries "What moved", as of its day, with a link; a stale one is left out', async () => {
    await W.admin.json('/api/home/moved', { method: 'PUT', body: { items: [
      { say: 'Payment days rose — 30 days → 55 days', key: 'pay', at: isoDay(0) },
      { say: 'Stale finding from last week', key: 'ren', at: isoDay(-5) }] } });
    /* something the admin must hear about today, so a brief goes */
    await W.admin.json('/api/contracts/MK-MV-1', { method: 'PUT', body: { contract: { id: 'MK-MV-1', name: 'Cold store lease', counterparty: 'Savannah Ltd',
      folder: FOLDER_A, status: 'Draft', fields: {}, metadata: { expiryDate: isoDay(20) }, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    await W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} });
    const t0 = Date.now(); let m = null;
    while (Date.now() - t0 < 3000 && !(m = mail.sent.find(x => x.to === 'admin@example.co.ke' && /What moved on your board/.test(x.text || x.body || '')))) await new Promise(r => setTimeout(r, 50));
    assert.ok(m, 'the admin\'s brief carries the section');
    const body = m.text || m.body || '';
    assert.match(body, new RegExp('Payment days rose — 30 days → 55 days \\(as of ' + isoDay(0) + '\\)'));
    assert.match(body, /\/#home&go=moved&card=pay\b/);
    assert.doesNotMatch(body, /Stale finding/, 'older than a daily brief\'s day');
    assert.doesNotMatch(body, /token=|#share|\/s\//, 'a link, never a token');
  });
  test('no new switch: the section reads only the brief\'s own cadence', () => {
    const src = strip(read('server/server.js'));
    const i = src.indexOf('function movedSec('), body = src.slice(i, src.indexOf('\n}\n', i));
    assert.match(body, /every === 'weekly' \? 7 : 1/);
    assert.doesNotMatch(body, /prefs\.(?!boardMoved)\w+|userPrefs\(u\)\.(?!boardMoved)\w+/);
    assert.doesNotMatch(src, /boardMoved(?:On|Off|Every|Mail)\b/);
    assert.match(src, /\+ movedSec\(L, u, every\)/);
  });
});

describe('F521 (C) — the link opens the card', () => {
  test('a shelf finding opens its own chart on the board', () => {
    const w = boardWorld();
    w.hbS().face = 'explorer';
    assert.equal(w.hbOpenFromLink('pay'), true);
    const s = w.hbS();
    assert.equal(s.face, 'board');
    assert.deepEqual(J(s.path), [w.hbInsKey('pay', false)]);
  });
  test('an id that is not a finding just lands on the board', () => {
    const w = boardWorld(); w.hbS().path = ['q:x'];
    assert.equal(w.hbOpenFromLink('nonsense'), false);
    assert.deepEqual(J(w.hbS().path), ['q:x']);
  });
  test('core.js: a narrow word, the same list, honoured before the contract link', () => {
    const src = read('js/core.js');
    assert.match(src, /const HASH_GO = \{ approval: \{ tab:'sign', sel:'#sa-card' \}, moved: \{ home:true \} \};/);
    const i = src.indexOf('function openFromHash(){');
    const body = src.slice(i, i + 1400);
    assert.ok(body.includes("/^#home&go=([a-z]+)&card=([a-z]+(?:\\.mine)?)$/i"), 'the narrow shape: a word, and a finding id');
    assert.match(body, /if\(!g\|\|!g\.home\) return false;/);
    assert.ok(body.indexOf('hbOpenFromLink') < body.indexOf('#contract='));
  });
});
