'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f923 — THE BRIEF IS BROUGHT, NEVER WRITTEN AGAIN (owner, 22 Oct 2026: "when
   i ask for the brief, sometimes hati writes a brief instead of bringing the
   brief from the side panel")

   Measured in a browser first: after "show me the brief for contract mk 382"
   opened MK-382's kept brief, "what about for mk 380" was read by nobody and
   went to the chat, which wrote MK-380's brief out itself; "summarise this
   contract" went to the chat too, and "what is this contract about" was a
   "which did you mean" card.

   (1) A FOLLOW-UP CARRIES THE LAST ACT: "what about X", "and X?", "same for
       X" with nothing else asked repeats what the conversation last did for
       a contract — read off the ONE conversation (intel.history), never
       stored apart; with nothing done before it, the words go on as before.
   (2) ONLY ACTS THAT OPEN SOMETHING TO READ are carried; a send or an
       amendment is never repeated by a follow-up.
   (3) "SUMMARISE THIS CONTRACT", "WHAT IS IT ABOUT" open the paper's kept
       brief (the brief place's words).
   (4) THE CHAT IS TOLD: a brief is opened (goto task brief), never written;
       word for word on both hosts, in both brains' rules.
   (5) READING WRITES NOTHING: the conversation is not added to by a read.
   AT THE PARENT (2a39d1b) (1), (3) and (4) FAIL.
   Run: node --test test/f923-the-brief-is-brought-never-rewritten.test.js
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const ACTS = R('js/copilotacts.js');
const MAP = R('js/jambomap.js');
const MS = R('vendor/minisearch-7.2.0.umd.js');
const AIJS = R('js/ai.js');
const SRV = R('server/server.js');

function stage({ paper = 'MK-382', history = [] } = {}){
  const contracts = [
    { id: 'MK-382', contractNo: 'MK-382', name: 'Freight Forwarding Agreement', status: 'Under Review', counterparty: 'AIT Worldwide Logistics Norway AS' },
    { id: 'MK-380', contractNo: 'MK-380', name: 'Warehousing & Cold-Chain Agreement', status: 'Under Review', counterparty: 'Verizon' },
    { id: 'MK-381', contractNo: 'MK-381', name: 'Supply', status: 'Signed', counterparty: 'Nordkust Industri AB' }];
  const ctx = { intel: { paper: paper ? { id: paper } : null, history: history.slice() } };
  Object.assign(ctx, {
    getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
    getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }), isAdmin: () => true,
    state: { contracts, view: 'dashboard' },
    i18t: k => k, setTimeout: () => 0,
    localStorage: { getItem: () => null, setItem: () => {} },
    needsYouOf: () => [],
    igHomePaperFace: () => true, igPaperUp: () => !!ctx.intel.paper,
    hbParse: () => null, hbS: () => ({ face: 'paper' }), hbSave: () => {}, hbFace: () => 'paper',
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(MS, ctx);
  vm.runInContext(ACTS, ctx);
  vm.runInContext(MAP, ctx);
  return ctx;
}
const said = (place, cid) => [{ role: 'user', text: `show me the ${place} for contract ${cid.toLowerCase().replace('-', ' ')}` },
  { role: 'assistant', text: '…', act: { kind: 'go', place, cid, state: 'ready' } }];
const go = u => u && { kind: u.kind, place: u.place, cid: u.cid };

describe('f923 (1) a follow-up carries the last act to the contract it names', () => {
  test('1a the owner\'s words: after MK-382\'s brief, "what about for mk 380" is MK-380\'s brief', () => {
    const ctx = stage({ history: said('brief', 'MK-382') });
    assert.deepEqual(go(ctx.caUnderstand('what about for mk 380', { box: 'home' })), { kind: 'go', place: 'brief', cid: 'MK-380' });
  });
  test('1b the other ways of following on', () => {
    const ctx = stage({ history: said('brief', 'MK-382') });
    for (const q of ['what about mk 380', 'and mk 380?', 'same for MK-380', 'how about MK-380', 'and for mk 380', 'ok, what about MK-380?', 'vad sägs om mk 380', 'samma för MK-380'])
      assert.deepEqual(go(ctx.caUnderstand(q, { box: 'home' })), { kind: 'go', place: 'brief', cid: 'MK-380' }, q);
  });
  test('1c the act carried is the one last done: History follows History', () => {
    const ctx = stage({ history: said('history', 'MK-382') });
    assert.deepEqual(go(ctx.caUnderstand('what about mk 380', { box: 'home' })), { kind: 'go', place: 'history', cid: 'MK-380' });
  });
  test('1d a chain follows on: the follow-up\'s own act is carried again', () => {
    const ctx = stage({ history: said('brief', 'MK-382').concat([{ role: 'user', text: 'what about mk 380' },
      { role: 'assistant', text: '…', act: { kind: 'go', place: 'brief', cid: 'MK-380', follow: true, state: 'ready' } }]) });
    assert.deepEqual(go(ctx.caUnderstand('and mk 381?', { box: 'home' })), { kind: 'go', place: 'brief', cid: 'MK-381' });
  });
  test('1e the chat answered in between: the ask before it says what was wanted', () => {
    const ctx = stage({ history: [{ role: 'user', text: 'summarise MK-382' }, { role: 'assistant', text: 'MK-382 is a freight agreement…' }] });
    assert.deepEqual(go(ctx.caUnderstand('what about mk 380', { box: 'home' })), { kind: 'go', place: 'brief', cid: 'MK-380' });
  });
  test('1f nothing done before it: the words go on as before (no act invented)', () => {
    const ctx = stage({ history: [] });
    assert.equal(ctx.caUnderstand('what about mk 380', { box: 'home' }), null);
  });
  test('1g a follow-up with words of its own is not a follow-up', () => {
    const ctx = stage({ history: said('brief', 'MK-382') });
    const u = ctx.caUnderstand('what about the termination clause in mk 380', { box: 'home' });
    assert.ok(!u || u.place !== 'brief', JSON.stringify(u));
  });
});

describe('f923 (2) only acts that open something to read are carried', () => {
  test('2a after a send or an amendment, a follow-up repeats nothing', () => {
    for (const act of [{ kind: 'go', place: 'share', cid: 'MK-382' }, { kind: 'door', door: 'amend', cid: 'MK-382' }]){
      const ctx = stage({ history: [{ role: 'user', text: 'x' }, { role: 'assistant', text: '…', act }] });
      const u = ctx.caUnderstand('what about mk 380', { box: 'home' });
      assert.ok(!u || !['share', 'amend'].includes(u.place || u.door), JSON.stringify(u));
    }
  });
});

describe('f923 (3) "summarise this contract" opens the kept brief', () => {
  test('3a with a paper up, each way of asking is the brief place, never the chat', () => {
    const ctx = stage({ paper: 'MK-382' });
    for (const q of ['summarise this contract', 'summarize this contract', 'summarise it', 'what is this contract about', "what's it about?", 'what is it about', 'give me a summary', 'summary of this contract', 'sammanfatta avtalet', 'vad handlar avtalet om']){
      const a = ctx.caActOf(q);
      assert.ok(a && a.kind === 'go' && a.place === 'brief', q + ' → ' + JSON.stringify(a && { kind: a.kind, place: a.place, picks: a.picks }));
    }
  });
});

describe('f923 (4) the chat is told: a brief is opened, never written', () => {
  const ruleOf = (src, name) => { const m = src.match(new RegExp('\\nconst ' + name + ' ?= ?(["\'])((?:\\\\.|(?!\\1).)*)\\1;')); return m ? m[2].replace(/\\'/g, "'") : null; };
  test('4a word for word on both hosts, navigation on and off', () => {
    for (const n of ['AI_BRIEF_RULE', 'AI_BRIEF_OFF_RULE']){
      const web = ruleOf(AIJS, n), srv = ruleOf(SRV, n);
      assert.ok(web && srv, n + ' on both hosts');
      assert.equal(web, srv, n + ' word for word');
      assert.match(web, /do not write one yourself/);
    }
    assert.match(ruleOf(SRV, 'AI_BRIEF_RULE'), /goto to task brief/);
  });
  test('4b in both brains\' rules, following the navigation switch', () => {
    assert.match(SRV, /- \$\{aiNavigateOn\(\) \? AI_BRIEF_RULE : AI_BRIEF_OFF_RULE\}/);
    assert.match(AIJS, /\$\{aiNavigateLocalOn\(\)\?AI_BRIEF_RULE:AI_BRIEF_OFF_RULE\}/);
    assert.match(SRV, /contract\\'s brief or summary \(task brief\)/, 'the goto field names the brief');
  });
});

describe('f923 (5) reading writes nothing', () => {
  test('5a the conversation is the same length after the reading', () => {
    const ctx = stage({ history: said('brief', 'MK-382') });
    const n = ctx.intel.history.length;
    ctx.caUnderstand('what about for mk 380', { box: 'home' });
    ctx.caActOf('what about for mk 380');
    assert.equal(ctx.intel.history.length, n);
  });
});
