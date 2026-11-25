'use strict';
/* f1227 — NOTES AS LIVE CONVERSATIONS, ROUND B (owner, 25 Nov 2026: the live connection, typing, presence, Read, their
   like, Jambo on a press). Pinned on the live server:
   (1) ONE STREAM A TAB, PINGS NEVER WORDS: GET /api/live sends "notes moved on X, room R" and nothing of the note; an
       internal ping reaches only our side's members in scope — never a link's stream, never a member walled off the
       contract; a link's stream (GET /api/shares/:token/live) hears its own room
   (2) TYPING AND HERE: POST /api/live/beat is carried on the stream to our side in scope only, never stored, never to the
       other side; their beat (POST /api/shares/:token/live/beat) reaches us
   (3) READ hh:mm: written only by their link's route (POST /api/shares/:token/read), once; a post cannot carry it
   (4) THEIR LIKE: the same six through their own link, on a note of their own room; ours keeps theirs
   (5) JAMBO ON A PRESS (POST /api/ai/notes): reads only that conversation's room, the governance rule on the
       instruction, refuses without a key, sends and stores nothing
   (6) the page's halves: one stream closed on sign-out, the old check kept, the two presses greyed with the reason,
       every new word in both books, the Brain names the routes */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const V = read('js/views/negotiation.js'), P = read('js/views/portal.js'), S = read('server/server.js'), I = read('js/i18n.js'),
  B = read('js/brainmap.js'), C = read('js/core.js');
const LIKE = '\u{1F44D}';
const CID = 'MK-LV2';

/* a stream as a browser tab holds it: every event, parsed; stop() closes it */
function listen(base, pathname, cookie){
  const ctl = new AbortController(), events = [];
  let raw = '';
  const ready = fetch(base + pathname, { headers: cookie ? { Cookie: cookie } : {}, signal: ctl.signal }).then(async res => {
    if (res.status !== 200) { events.push({ event: 'status', data: res.status }); return; }
    const dec = new TextDecoder();
    try {
      for await (const chunk of res.body) {
        raw += dec.decode(chunk, { stream: true });
        let i;
        while ((i = raw.indexOf('\n\n')) >= 0) {
          const block = raw.slice(0, i); raw = raw.slice(i + 2);
          const ev = (block.match(/^event: (.*)$/m) || [])[1], data = (block.match(/^data: (.*)$/m) || [])[1];
          if (ev) events.push({ event: ev, data: data ? JSON.parse(data) : null, raw: block });
        }
      }
    } catch (_) { /* closed */ }
  }).catch(() => {});
  return { events, ready, stop(){ ctl.abort(); } };
}
const until = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await new Promise(r => setTimeout(r, 25)); } return !!fn(); };
const pause = ms => new Promise(r => setTimeout(r, ms));

describe('f1227 live notes, on the server', () => {
  let h, W, A, token, rowId, partyRoom;
  const streams = [];
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
    /* in the stream the restricted member may NOT see (FOLDER_B), so they are out of scope */
    const c = H.fixtureContract(CID, 'Live Notes B', 'Naivas Supermarkets', 'sales', 1000, 'Under Review');
    const at = new Date().toISOString();
    c.thread = [{ id: 'lv-in', side: 'owner', visibility: 'internal', who: 'Amina', at, text: 'Our internal floor is ninety days.' },
      { id: 'lv-out', side: 'owner', visibility: 'shared', who: 'Amina', at, text: 'Could you accept sixty days?' }];
    W = await H.seedWorkspace(h, { approvalRules: [], contracts: [c] });
    A = W.admin;
    await A.json('/api/contracts/' + CID + '/messages', { method: 'POST', body: { topic: 'contract', body: 'Could you accept sixty days?', meta: { id: 'lv-out' } } });
    const s = await A.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', contract: { id: CID, name: 'Live Notes B' } }, channel: 'link', purpose: 'negotiate',
      recipient: { name: 'Guliz Cetin' } } });
    token = s.token;
    assert.ok(token, 'a link was made: ' + JSON.stringify(s));
    const row = (await A.json('/api/contracts/' + CID + '/messages')).messages.find(m => m.meta && m.meta.id === 'lv-out');
    rowId = row.id;
  });
  after(async () => { streams.forEach(x => x.stop()); if (h) await h.stop(); });
  const open = (p, cookie) => { const x = listen(h.base, p, cookie); streams.push(x); return x; };
  const notesFor = (x, cid) => x.events.filter(e => e.event === 'notes' && e.data && e.data.c === cid);
  const beatsFor = (x, cid) => x.events.filter(e => e.event === 'beat' && e.data && e.data.c === cid);

  test('(1) a ping says what moved and never the words; internal reaches only our side in scope', async () => {
    const mine = open('/api/live', A.cookie), walled = open('/api/live', W.restricted.cookie), link = open('/api/shares/' + token + '/live');
    assert.ok(await until(() => mine.events.some(e => e.event === 'hello') && walled.events.some(e => e.event === 'hello') && link.events.some(e => e.event === 'hello')), 'each tab is greeted');
    const r = await A.raw('/api/contracts/' + CID + '/notes/react', { method: 'POST', body: { key: 'lv-in', emoji: LIKE } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.ok(await until(() => notesFor(mine, CID).length > 0), 'our own tab hears the internal ping');
    const ping = notesFor(mine, CID)[0];
    assert.equal(ping.data.room, 'internal');
    assert.deepEqual(Object.keys(ping.data).sort(), ['c', 'kind', 'room'], 'a ping carries what moved, nothing more');
    assert.ok(!/ninety|sixty|Amina/i.test(ping.raw), 'no words, no names in a ping');
    await pause(300);
    assert.equal(notesFor(walled, CID).length, 0, 'a member walled off the contract hears nothing');
    assert.equal(notesFor(link, CID).length, 0, 'an internal ping never reaches the other side');
  });

  test('(1b) their room\'s ping reaches us and their link, still without words', async () => {
    const mine = open('/api/live', A.cookie), link = open('/api/shares/' + token + '/live');
    assert.ok(await until(() => mine.events.some(e => e.event === 'hello') && link.events.some(e => e.event === 'hello')));
    const t0 = Date.now();
    const r = await fetch(h.base + '/api/shares/' + token + '/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'Guliz Cetin', topic: 'contract', body: 'Seventy-five days is our last word.' }) });
    assert.equal(r.status, 200);
    assert.ok(await until(() => notesFor(mine, CID).length > 0), 'our tab hears their message');
    assert.ok(Date.now() - t0 < 1500, 'within a second and a half on the test machine: ' + (Date.now() - t0) + 'ms');
    partyRoom = notesFor(mine, CID)[0].data.room;
    assert.match(partyRoom, /^p:/);
    assert.ok(!/Seventy|Guliz/.test(notesFor(mine, CID)[0].raw));
    assert.ok(await until(() => notesFor(link, CID).length > 0), 'their own room\'s ping reaches their link');
  });

  test('(1c) a link that may not stream is refused; a stream without a session is refused', async () => {
    assert.equal((await fetch(h.base + '/api/shares/not-a-token/live')).status, 404);
    const anon = await fetch(h.base + '/api/live'); assert.ok(anon.status === 401 || anon.status === 403, 'signed out: ' + anon.status);
  });

  test('(2) typing is carried to our side in scope, never stored, never to them; theirs reaches us', async () => {
    const other = open('/api/live', W.unrestricted.cookie), walled = open('/api/live', W.restricted.cookie), link = open('/api/shares/' + token + '/live');
    assert.ok(await until(() => [other, walled, link].every(x => x.events.some(e => e.event === 'hello'))));
    const b = await A.raw('/api/live/beat', { method: 'POST', body: { c: CID, room: 'internal', k: 'lv-in', typing: true } });
    assert.equal(b.status, 204);
    assert.ok(await until(() => beatsFor(other, CID).length > 0), 'a colleague in scope sees the typing');
    const beat = beatsFor(other, CID)[0].data;
    assert.equal(beat.typing, true); assert.equal(beat.k, 'lv-in'); assert.equal(beat.who.name, 'Amina Otieno');
    await pause(300);
    assert.equal(beatsFor(walled, CID).length, 0, 'a walled member sees none');
    assert.equal(beatsFor(link, CID).length + link.events.filter(e => e.event === 'beat').length, 0, 'our typing never reaches the other side');
    assert.equal((await W.restricted.raw('/api/live/beat', { method: 'POST', body: { c: CID, room: 'internal', k: 'lv-in', typing: true } })).status, 404, 'a walled member cannot beat on it');
    const stored = await A.raw('/api/contracts/' + CID);
    assert.ok(!/"typing"/.test(stored.text), 'typing is never stored on the record');
    const db = fs.readdirSync(h.dataDir).filter(f => /\.(db|sqlite|json)$/.test(f)).map(f => fs.readFileSync(path.join(h.dataDir, f), 'latin1')).join('');
    assert.ok(!/"typing":true/.test(db), 'nor anywhere the server keeps things');
    /* theirs reaches us */
    const theirs = await fetch(h.base + '/api/shares/' + token + '/live/beat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k: 'lv-out', typing: true }) });
    assert.equal(theirs.status, 204);
    assert.ok(await until(() => beatsFor(other, CID).some(e => e.data.who && e.data.who.name === 'Guliz Cetin' && e.data.typing)), 'their typing reaches our side');
    assert.ok(beatsFor(other, CID).filter(e => e.data.who.name === 'Guliz Cetin').every(e => /^p:/.test(e.data.room)), 'in their room');
  });

  test('(3) Read: written only by their link, once, and shown to us; a post cannot carry it', async () => {
    const forged = await A.json('/api/contracts/' + CID + '/messages', { method: 'POST', body: { topic: 'contract', body: 'Forged read.', meta: { id: 'lv-forge', readAt: '2026-01-01T00:00:00.000Z' } } });
    const fr = forged.messages.find(m => m.meta && m.meta.id === 'lv-forge');
    assert.ok(fr && !fr.meta.readAt, 'a post cannot write Read');
    const r = await fetch(h.base + '/api/shares/' + token + '/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [rowId] }) });
    assert.equal(r.status, 200); assert.equal((await r.json()).stamped, 1);
    const row = (await A.json('/api/contracts/' + CID + '/messages')).messages.find(m => m.id === rowId);
    assert.match(row.meta.readAt, /^\d{4}-\d{2}-\d{2}T/);
    const again = await (await fetch(h.base + '/api/shares/' + token + '/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [rowId] }) })).json();
    assert.equal(again.stamped, 0, 'the first time only');
    const theirOwn = (await A.json('/api/contracts/' + CID + '/messages')).messages.find(m => m.side !== 'owner');
    await fetch(h.base + '/api/shares/' + token + '/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [theirOwn.id] }) });
    assert.ok(!((await A.json('/api/contracts/' + CID + '/messages')).messages.find(m => m.id === theirOwn.id).meta || {}).readAt, 'only our messages are stamped');
    /* shown to us: the bubble draws the stamp, from the record */
    assert.match(V, /m\.readAt \? negoWhen\(m\.readAt\)/);
    assert.match(V, /ng_lv_read_at/);
  });

  test('(4) their like: the six, on their own room\'s note, through their link; ours keeps theirs', async () => {
    const bad = await fetch(h.base + '/api/shares/' + token + '/messages/' + rowId + '/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji: '\u{1F4A9}' }) });
    assert.equal(bad.status, 400, 'only the six');
    const r = await fetch(h.base + '/api/shares/' + token + '/messages/' + rowId + '/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji: LIKE }) });
    const d = await r.json();
    assert.equal(r.status, 200, JSON.stringify(d));
    assert.ok(d.me && /^x:/.test(d.me), 'their mark is the link\'s, never a person of ours');
    assert.deepEqual(d.reactions[LIKE], [d.me]);
    assert.equal((await fetch(h.base + '/api/shares/' + token + '/messages/999999/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji: LIKE }) })).status, 404, 'a note not of their room');
    /* our like on the same note keeps theirs */
    await A.json('/api/contracts/' + CID + '/notes/react', { method: 'POST', body: { key: 'lv-out', emoji: LIKE } });
    const row = (await A.json('/api/contracts/' + CID + '/messages')).messages.find(m => m.id === rowId);
    assert.equal(row.meta.reactions[LIKE].length, 2, 'both likes stand');
    assert.ok(row.meta.reactions[LIKE].includes(d.me));
  });

  test('(5) Jambo reads only that conversation\'s room, on the rule, and sends and stores nothing', async () => {
    h.ai.reset();
    h.ai.answerWith(name => name === 'notes_answer' ? { text: 'You hold ninety days; nothing is agreed.' } : null);
    const before = await A.raw('/api/contracts/' + CID);
    const msgs0 = (await A.json('/api/contracts/' + CID + '/messages')).messages.length;
    const r = await A.raw('/api/ai/notes', { method: 'POST', body: { contractId: CID, room: 'internal', root: 'lv-in', mode: 'summary' } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.text, 'You hold ninety days; nothing is agreed.');
    const sent = h.ai.lastPayloadText();
    assert.ok(sent.includes('ninety days'), 'the conversation was read');
    assert.ok(!sent.includes('sixty days') && !sent.includes('Seventy-five'), 'nothing from their room');
    assert.ok(sent.includes("THE COMPANY'S RULES ARE GONE THROUGH, NEVER AROUND"), 'the governance rule is on the instruction');
    assert.equal((await A.json('/api/contracts/' + CID + '/messages')).messages.length, msgs0, 'nothing sent');
    const after = await A.raw('/api/contracts/' + CID);
    assert.equal(JSON.stringify(after.json.thread || (after.json.contract || {}).thread), JSON.stringify(before.json.thread || (before.json.contract || {}).thread), 'nothing stored');
    const reply = await A.raw('/api/ai/notes', { method: 'POST', body: { contractId: CID, room: partyRoom, root: 'lv-out', mode: 'reply' } });
    assert.equal(reply.status, 200, JSON.stringify(reply.json));
    const sent2 = h.ai.lastPayloadText();
    assert.ok(sent2.includes('sixty days') && !sent2.includes('ninety days'), 'their room, never our internal words');
    assert.equal((await W.restricted.raw('/api/ai/notes', { method: 'POST', body: { contractId: CID, room: 'internal', root: 'lv-in', mode: 'summary' } })).status, 404, 'walled');
    h.ai.answerWith(null);
  });
});

describe('f1227 (5b) no key, no read', () => {
  let h, W;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off', ANTHROPIC_API_KEY: '' });
    const c = H.fixtureContract(CID, 'Live Notes B', 'Naivas Supermarkets', 'sales', 1000, 'Under Review');
    c.thread = [{ id: 'lv-in', side: 'owner', visibility: 'internal', who: 'Amina', at: new Date().toISOString(), text: 'A word.' }];
    W = await H.seedWorkspace(h, { approvalRules: [], contracts: [c] });
  });
  after(async () => { if (h) await h.stop(); });
  test('refused, and the refusal says why', async () => {
    const r = await W.admin.raw('/api/ai/notes', { method: 'POST', body: { contractId: CID, room: 'internal', root: 'lv-in', mode: 'summary' } });
    assert.equal(r.status, 400); assert.equal(r.json.needsKey, true);
  });
});

describe('f1227 (6) the page\'s halves', () => {
  test('one stream a tab, back after a drop, closed on sign-out, the old check kept', () => {
    assert.match(V, /new EventSource\(url\)/);
    assert.match(V, /function liveNotesStop\(/);
    assert.match(C, /function logout\(\)\{[\s\S]{0,200}liveNotesStop\(\)/);
    assert.match(V, /es\.onerror[\s\S]{0,600}setTimeout\(\(\) => \{ _lvRetry = null; liveNotesEnsure\(\); \}/);
    assert.match(C, /function pollThreadMessages|pollThreadMessages/, 'the old check stays');
    assert.match(P, /function portalLiveStart\(/);
    assert.match(P, /portalStartPolling\(token, d\)\{\s*portalStopPolling\(\);\s*portalLiveStart\(token, d\);/);
  });
  test('the two presses: over the box, ours only, greyed with the reason; nothing sent', () => {
    const f = V.slice(V.indexOf('function rlNpAiRowHtml('), V.indexOf('function rlNpSumHtml('));
    assert.match(f, /disabled title=/); assert.match(f, /ng_lv_ai_off/);
    assert.match(f, /side !== 'owner' \|\| PORTAL_MODE/);
    const g = V.slice(V.indexOf('async function rlNpAi('), V.indexOf('function rlNpLiveWire('));
    assert.ok(!/negoPostComment|negoFileChange|persist\(/.test(g), 'Jambo\'s answer is never posted, filed or saved');
  });
  test('every new word in both books; the Brain names the routes', () => {
    const keys = ['ng_lv_read_at', 'ng_lv_typing_one', 'ng_lv_here_one', 'ng_lv_ai_sum', 'ng_lv_ai_reply', 'ng_lv_ai_off', 'ng_lv_ai_sum_t', 'ng_lv_like_fail'];
    for (const k of keys) assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    for (const r of ['/api/live', '/api/live/beat', '/api/shares/:token/live', '/api/shares/:token/read', '/api/shares/:token/messages/:mid/react', '/api/ai/notes'])
      assert.ok(B.includes("'" + r + "'") || B.includes('"' + r + '"') || B.includes(r), r);
    assert.match(S, /app\.get\('\/api\/live', auth/);
  });
});
