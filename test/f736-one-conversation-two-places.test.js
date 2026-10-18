'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f736 — ONE CONVERSATION, SAID WHERE THE READER IS LOOKING (Jambo's panel
   beside the lists, 18 Oct 2026)

   (1) THE FEED IS WHERE THE READER LOOKS: while Jambo's panel beside a list is
       on screen and his window is not open, his conversation is said in the
       panel (#jl-feed); with the window open, in the window. A panel feed that
       is not on screen (a hidden tab, a folded panel) is never chosen.
   (2) ONE COPY ON THE PAGE AT A TIME: drawing in one host empties the other,
       so a chart's canvas id is never drawn twice; beside a list an empty
       conversation draws nothing (Jambo has said the page above it).
   (3) ONE TURN: the window's box and the panel's box ask through the same
       aiAskWords — one reading of the words, one spend; the streaming words,
       the proposal cards' buttons and the scroll follow the feed it chose.
   (4) AN ANSWER SAID WHERE THE READER LOOKS LIGHTS NO LAUNCHER (aiUnreadIfAway);
       closing the window gives the conversation back to the panel.
   (5) THE SAME DRESS: the answer styles (paragraphs, lists, tables) are the
       window's, scoped to both feeds at the id's weight.

   AT THE PARENT (8dc306a) every claim FAILS: the feed was #ai-feed alone.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const AI = read('js/ai.js');
const HTML = read('index.html');
const fnOf = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* a page of two feeds: the window's, and the panel's inside its scroller */
const page = ({ listShown = true, listThere = true } = {}) => {
  const el = (id, parent) => ({ id, innerHTML: 'old ' + id, isConnected: true, parentElement: parent, scrollTop: 0, scrollHeight: 50,
    querySelectorAll: () => [], closest: () => null });
  const box = { getClientRects: () => (listShown ? [{}] : []) };
  const els = { 'ai-feed': el('ai-feed', { getClientRects: () => [{}] }) };
  if (listThere) els['jl-feed'] = el('jl-feed', box);
  return { els, document: { getElementById: id => els[id] || null } };
};
const stage = (names, extra) => { const ctx = Object.assign({ window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(names.map(n => fnOf(AI, n)).join('\n'), ctx); return ctx; };

describe('f736 (1) the feed is where the reader looks', () => {
  const names = ['aiListFeed', 'aiFeedEl'];
  test('1a the panel beside a list is on screen, the window shut: the panel', () => {
    const p = page();
    const c = stage(names, { document: p.document, ai: { open: false } });
    assert.equal(c.aiFeedEl().id, 'jl-feed');
  });
  test('1b the window open: the window, even with the panel up', () => {
    const p = page();
    assert.equal(stage(names, { document: p.document, ai: { open: true } }).aiFeedEl().id, 'ai-feed');
  });
  test('1c the panel not on screen (a hidden tab, folded) or not there at all: the window', () => {
    assert.equal(stage(names, { document: page({ listShown: false }).document, ai: { open: false } }).aiFeedEl().id, 'ai-feed');
    assert.equal(stage(names, { document: page({ listThere: false }).document, ai: { open: false } }).aiFeedEl().id, 'ai-feed');
    assert.equal(stage(names, { document: page({ listShown: false }).document, ai: { open: false } }).aiListFeed(), null);
  });
  test('1d "on screen" is the feed\'s scroller, because an empty feed draws nothing of its own', () => {
    assert.match(code(fnOf(AI, 'aiListFeed')), /const box=f && f\.parentElement;/);
  });
});

describe('f736 (2) one copy on the page at a time', () => {
  test('2a beside a list, an empty conversation draws nothing — and the window\'s copy is emptied', () => {
    const p = page();
    const c = stage(['aiListFeed', 'aiFeedEl', 'renderAIFeed'], { document: p.document, ai: { open: false, history: [] }, aiProposals: new Map(), AI_PROPOSAL_OPEN: 'open' });
    c.renderAIFeed();
    assert.equal(p.els['jl-feed'].innerHTML, '', 'the panel draws no greeting: Jambo said the page above');
    assert.equal(p.els['ai-feed'].innerHTML, '', 'and the window holds no second copy');
  });
  test('2b drawing in either host empties the other', () => {
    const f = code(fnOf(AI, 'renderAIFeed'));
    assert.match(f, /const feed=aiFeedEl\(\);\s*if\(!feed\) return;\s*const inList=feed\.id==='jl-feed';\s*\{ const other=document\.getElementById\(inList\?'ai-feed':'jl-feed'\); if\(other&&other!==feed\) other\.innerHTML=''; \}/);
  });
});

describe('f736 (3) one turn, whichever box asked', () => {
  test('3a the window\'s box takes its words out and asks through aiAskWords — the one turn', () => {
    assert.match(code(fnOf(AI, 'aiSubmit')), /return aiAskWords\(q\);\s*\}$/);
    assert.match(code(fnOf(AI, 'aiAskWords')), /^async function aiAskWords\(qRaw\)\{\s*const q=String\(qRaw\|\|''\)\.trim\(\); if\(!q\|\|ai\.busy\) return;/, 'empty or busy: nothing asked twice');
    assert.match(AI, /Object\.assign\(window,\{[\s\S]*\baiAskWords,aiFeedEl,aiListFeed,aiUnreadIfAway\b/);
  });
  test('3b the streaming words, the proposal cards\' buttons and the scroll follow the feed it chose', () => {
    const st = code(fnOf(AI, 'aiStreamRenderer'));
    assert.equal((st.match(/aiFeedEl\(\)/g) || []).length, 2);
    assert.doesNotMatch(st, /getElementById\('ai-feed'\)/);
    assert.match(code(fnOf(AI, 'aiWireProposals')), /const feed = aiFeedEl\(\);/);
    assert.match(code(fnOf(AI, 'renderAIFeed')), /const sc=inList\?\(feed\.closest\('\.jl-body'\)\|\|feed\):feed; sc\.scrollTop=sc\.scrollHeight;/);
    assert.equal((code(AI).match(/getElementById\('ai-feed'\)/g) || []).length, 1, 'the window\'s feed is named once, by aiFeedEl (the sweep asks for the other host by a choice)');
  });
});

describe('f736 (4) an answer said where the reader looks lights no launcher', () => {
  test('4a beside a list: no badge; the window shut and no panel: the badge, as before', () => {
    let badge = 0;
    const p = page();
    const c = stage(['aiListFeed', 'aiUnreadIfAway'], { document: p.document, ai: { open: false, unread: false }, updateAIBadge: () => badge++ });
    c.aiUnreadIfAway();
    assert.equal(c.ai.unread, false); assert.equal(badge, 0);
    const q = stage(['aiListFeed', 'aiUnreadIfAway'], { document: page({ listThere: false }).document, ai: { open: false, unread: false }, updateAIBadge: () => badge++ });
    q.aiUnreadIfAway();
    assert.equal(q.ai.unread, true); assert.equal(badge, 1);
  });
  test('4b every answer path asks it, none lights the badge on its own', () => {
    const f = code(fnOf(AI, 'aiAskWords'));
    assert.ok((f.match(/aiUnreadIfAway\(\);/g) || []).length >= 4);
    assert.doesNotMatch(f, /if\(!ai\.open\)\{ ai\.unread=true;/);
  });
  test('4c closing the window gives the conversation back to the panel', () => {
    assert.match(code(fnOf(AI, 'closeAI')), /if\(aiListFeed\(\)\) try\{ renderAIFeed\(\); \}catch\(_\)\{\}/);
  });
});

describe('f736 (5) the same dress in both feeds', () => {
  test('5a paragraphs, lists, quotes, code, tables and rules are dressed in both, at the id\'s weight', () => {
    for (const sel of ['.ai-p{', 'ul.ai-list{', 'ol.ai-list{', '.ai-list li{', '.ai-quote{', '.ai-code{', '.ai-table{', 'hr{', '.ai-target{'])
      assert.ok(HTML.includes(':is(#ai-feed,#jl-feed) ' + sel), sel);
    assert.ok(!/^#ai-feed \.ai-p\{/m.test(HTML), 'no rule left for the window alone');
  });
});
