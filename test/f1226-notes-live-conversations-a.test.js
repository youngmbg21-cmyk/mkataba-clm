'use strict';
/* f1226 — NOTES AS LIVE CONVERSATIONS, ROUND A (owner, 25 Nov 2026: "build the new notes as live conversation as drawn";
   drawing notes-live.html). Round B (the live connection, typing, presence) is later.
   (1) LIKES: six faces under any message, written by the server (POST /api/contracts/:id/notes/react), pressed again to
       take back; walls: signed in and may write, a face of the six, a note the record holds; an INTERNAL note's like stays
       on our record and never reaches the channel; a shared note's like is mirrored so the other side sees it; a save
       never moves a like (the stored record's)
   (2) A NOTE STARTS FROM THE PAPER: the highlight's "Add a note" offers the rooms, and the chosen room opens a NEW
       conversation pinned to those exact words, its box focused; one door (rlNoteFromSelection, the selection bar)
   (3) NO NOTE IS FORCED ON A REDLINE
   (4) THE ROOMS: a lock on Internal, an eye on theirs, the name ending in "…" (never wrapped, whole on hover)
   (5) DECIDED: pinned in our own room, a line on the History, Undo; never in their room
   (6) every new word in both books */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const { buildWorld } = require('./world');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const V = read('js/views/negotiation.js'), X = read('index.html'), S = read('server/server.js');
const LIKE = '\u{1F44D}';

describe('f1226 (1) likes: the server writes them, and the wall holds', () => {
  let h, W, A, viewer;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
    const c = H.fixtureContract('MK-LV1', 'Live Notes', 'Naivas Supermarkets', 'f-ops', 1000, 'Under Review');
    const at = new Date().toISOString();
    c.thread = [{ id: 'lv-in', side: 'owner', visibility: 'internal', who: 'Amina', at, text: 'An internal word.' },
      { id: 'lv-out', side: 'owner', visibility: 'shared', who: 'Amina', at, text: 'A word to them.' }];
    W = await H.seedWorkspace(h, { approvalRules: [], contracts: [c] });
    A = W.admin;
    /* the shared note's copy on the channel, as the send would have posted it */
    await A.json('/api/contracts/MK-LV1/messages', { method: 'POST', body: { topic: 'contract', body: 'A word to them.', meta: { id: 'lv-out' } } });
  });
  after(async () => { if (h) await h.stop(); });
  const channel = async () => (await A.json('/api/contracts/MK-LV1/messages')).messages;
  const stored = async () => (await A.json('/api/contracts/MK-LV1')).contract || (await A.json('/api/contracts/MK-LV1'));

  test('an internal like stays on our record and never reaches the channel', async () => {
    const r = await A.raw('/api/contracts/MK-LV1/notes/react', { method: 'POST', body: { key: 'lv-in', emoji: LIKE } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.reactions[LIKE].length, 1);
    assert.ok(r.json.reactions[LIKE][0].startsWith('u:'));
    const c = await stored();
    assert.deepEqual(c.thread.find(m => m.id === 'lv-in').reactions[LIKE], r.json.reactions[LIKE]);
    assert.ok((await channel()).every(m => !(m.meta && m.meta.reactions)), 'nothing internal crossed');
  });
  test('a like on a shared note is mirrored onto its channel copy, for them to see', async () => {
    const r = await A.raw('/api/contracts/MK-LV1/notes/react', { method: 'POST', body: { key: 'lv-out', emoji: LIKE } });
    assert.equal(r.status, 200);
    const row = (await channel()).find(m => m.meta && m.meta.id === 'lv-out');
    assert.ok(row && row.meta.reactions && row.meta.reactions[LIKE].length === 1, 'their copy carries the like');
  });
  test('pressed again it is taken back; only the six faces; a note the record holds', async () => {
    const r = await A.raw('/api/contracts/MK-LV1/notes/react', { method: 'POST', body: { key: 'lv-out', emoji: LIKE } });
    assert.equal(r.status, 200); assert.deepEqual(r.json.reactions, {});
    const row = (await channel()).find(m => m.meta && m.meta.id === 'lv-out');
    assert.ok(!(row.meta && row.meta.reactions), 'taken back on their copy too');
    assert.equal((await A.raw('/api/contracts/MK-LV1/notes/react', { method: 'POST', body: { key: 'lv-in', emoji: '\u{1F4A9}' } })).status, 400);
    assert.equal((await A.raw('/api/contracts/MK-LV1/notes/react', { method: 'POST', body: { key: 'nope', emoji: LIKE } })).status, 404);
  });
  test('a save never moves a like', async () => {
    const full = await A.json('/api/contracts/MK-LV1');
    const c = full.contract || full, v = full.version != null ? full.version : (c._v || 0);
    const before = c.thread.find(m => m.id === 'lv-in').reactions;
    c.thread.find(m => m.id === 'lv-in').reactions = { [LIKE]: ['u:forged', 'u:other'] };
    const put = await A.raw('/api/contracts/MK-LV1', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(put.status, 200, JSON.stringify(put.json));
    const after = (await stored()).thread.find(m => m.id === 'lv-in').reactions;
    assert.deepEqual(after, before, 'the stored record\'s likes stand');
  });
  test('the route\'s walls, in the server', () => {
    assert.match(S, /app\.post\('\/api\/contracts\/:id\/notes\/react', auth, editor, \(req, res\) => \{/);
    assert.match(S, /if \(hit\.m\.visibility === 'shared'\) mirror\(req\.params\.id, key, rx\);/, 'only a note that crossed carries its like across');
    assert.match(S, /if \(!row \|\| row\.side === MSG_SIDE_THEIR_TEAM \|\| row\.side === MSG_SIDE_ADVISER\) return res\.status\(404\)/, 'their team\'s room and an adviser\'s rows are never ours to touch');
    assert.match(S, /const rx = noteReactionsClean\(raw\.reactions\);\n  if \(rx\) out\.reactions = rx;/, 'the channel\'s allow-list takes the six faces only');
    assert.match(read('js/brainmap.js'), /\['notereact', 'POST \/api\/contracts\/:id\/notes\/react', 'wall', 2\]/);
  });
});

test('f1226 (2) a highlight\'s "Add a note" offers the rooms; the room opens a new conversation on those words', () => {
  const { win } = buildWorld({ negotiationView: true });
  assert.equal(typeof win.negoSelBarHtml, 'function'); assert.equal(typeof win.rlNoteRoomActs, 'function');
  const bar = win.document.createElement('div');
  bar.innerHTML = win.negoSelBarHtml([{ id: 'note:internal', room: 'internal', label: 'Internal' },
    { id: 'note:p:1', room: 'p:1', ext: true, label: 'Naivas Supermarkets East Africa Holdings Ltd', full: 'Naivas Supermarkets East Africa Holdings Ltd' }, { id: 'ask', label: 'Ask Jambo' }]);
  {
    const grp = bar.querySelector('.nego-selnote-grp');
    assert.ok(grp, 'one dark bubble');
    assert.match(grp.textContent, /^Add a note/);
    assert.equal(grp.querySelectorAll('.nego-selroom').length, 2, 'Internal and theirs');
    assert.equal(grp.querySelector('.nego-selroom.is-ext').getAttribute('title'), 'Naivas Supermarkets East Africa Holdings Ltd', 'the whole name on hover');
    assert.ok(bar.querySelector('[data-nego-ai="ask"]'), 'the other verbs stay beside it');
  }
  assert.match(V, /room: side === 'counterparty' \? 'external' : \(opts\.room \? negoRoomKey\(opts\.room\) : 'internal'\)/, 'the room chosen is the pin\'s');
  assert.match(V, /const newPin = \(!opened && pin && mayWrite && \(pin\.quote \|\| pin\.whole\)\) \? pin : null;/, 'a pin on words opens a new conversation');
  assert.match(V, /rlNpNewConvHtml\(c, newPin, room, side, other/);
  assert.match(V, /if \(pin && !reply && !extra\.pin\) _rlNpOpen = negoNoteKey\(msg\);/, 'its first message opens as the conversation');
  assert.match(V, /anchor: \(pin && pin\.quote\) \? \{ clauseId: pin\.clauseId, quote: pin\.quote \} : undefined/, 'anchored to those exact words');
  const C = read('js/copilotacts.js');
  assert.match(C, /const acts = CA_SEL_ACTIONS\(\)\.flatMap\(a => \(a\.id === 'note' && rooms\.length\) \? rooms : \[a\]\);/, 'Home\'s paper: the same bar, the same door');
  assert.match(V, /if \(rooms\.length\) acts\.unshift\(\.\.\.rooms\); else acts\.push\(\{ id: 'comment'/, 'the Redlines face: the same rooms');
});

test('f1226 (3) no note is forced on a redline', () => {
  assert.match(V, /function rlNoteAskAfterFile\(\)\{\n  return Promise\.resolve\(null\);\n\}/, 'filing asks for nothing');
  const P = read('js/views/portal.js');
  assert.equal((P.match(/portalAskReason\(/g) || []).length, 1, 'their "Why this change?" is called from nowhere (its definition only)');
  assert.match(read('js/i18n.js'), /ng_lv_new_hint: 'A redline never asks for a note\./);
});

test('f1226 (4) the rooms: a lock, an eye, the name ending in "…" in its own space', () => {
  assert.match(V, /\$\{r\.external \? RL_NP_EYE : RL_NP_LOCK\}<span class="rl-np-nm">/);
  assert.match(V, /\$\{un\[r\.key\] && r\.key !== room \? '<span class="rl-lv-dot" aria-hidden="true"><\/span>' : ''\}/, 'a green dot while it holds unread');
  assert.match(X, /\.rl-chat\.is-live \.rl-np-tab\.rl-np-room\.is-ext\{flex:0 1 auto;max-width:200px\}/);
  assert.match(X, /\.rl-chat\.is-live \.rl-np-tab\.rl-np-room \.rl-np-nm\{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/);
  assert.match(X, /\.nego-selbar button\.nego-selroom > span\{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/, 'the bubble\'s room too');
});

test('f1226 (5) decided: pinned in our room, on the History, undone; never in theirs', () => {
  const { win } = buildWorld({});
  const c = { id: 'MK-D', name: 'D', thread: [], audit: [] };
  const root = { id: 'r1', side: 'owner', visibility: 'internal', who: 'Amina', at: '2026-11-25T10:00:00Z', text: 'Thirty?' };
  const msg = { id: 'r2', side: 'owner', visibility: 'internal', who: 'Wanjiru', at: '2026-11-25T10:05:00Z', text: 'Hold at thirty days.', replyTo: 'r1' };
  c.thread.push(root, msg);
  const audit = [];
  const was = win.logAudit; win.logAudit = (cc, kind, line) => audit.push(line);
  try {
    const out = win.negoNoteDecide(c, null, root, msg, true, { id: 'u1', name: 'Wanjiru' });
    assert.ok(out && root.decided, 'pinned');
    assert.equal(root.decided.text, 'Hold at thirty days.');
    assert.equal(root.decided.by, 'Wanjiru');
    assert.match(audit.join('\n'), /Decided in the team's notes on the contract: “Hold at thirty days\.”/, 'a line on the History');
    win.negoNoteDecide(c, null, root, null, false, { id: 'u1', name: 'Wanjiru' });
    assert.equal(root.decided, undefined, 'Undo takes it back');
    assert.match(audit.join('\n'), /taken back by Wanjiru/);
    const shared = { id: 's1', side: 'owner', visibility: 'shared', who: 'Amina', at: '2026-11-25T11:00:00Z', text: 'To them' };
    c.thread.push(shared);
    assert.equal(win.negoNoteDecide(c, null, shared, shared, true), null, 'never in their room');
  } finally { win.logAudit = was; }
  assert.doesNotMatch(S.slice(S.indexOf('function msgMeta(raw)'), S.indexOf('const msgMetaRead')), /decided/, '`decided` never travels');
  assert.match(V, /data-rl-lv-undecide=/);
});

test('f1226 (6) every new word in both books; the Handbook says it', () => {
  const I = read('js/i18n.js'), sv = I.indexOf('\n  sv: {'), en = I.slice(0, sv), se = I.slice(sv);
  const keys = [...new Set([...V.matchAll(/i18tn?\('(ng_lv_[a-z_]+)'/g)].map(m => m[1]))];
  assert.ok(keys.length > 20);
  const has = (book, k) => book.includes('\n    ' + k + ': ') || (book.includes('\n    ' + k + '_one: ') && book.includes('\n    ' + k + '_other: '));
  assert.deepEqual(keys.filter(k => !has(en, k) || !has(se, k)), []);
  const HB = read('js/handbook.js');
  assert.match(HB, /Highlight words on the paper and the dark bubble says \{ui:ng_lv_add_note\}/);
  assert.match(HB, /Markera ord på papperet så säger den mörka bubblan \{ui:ng_lv_add_note\}/);
});
