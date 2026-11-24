'use strict';
/* f1210 — NO COST UNDER AN ANSWER, AND THE THINKING DOTS STAY (owner, 24 Nov 2026, two screenshots: "Weighed by the
   stronger model · $0.094" under a Jambo answer — "I have stated many times … you do not quote the costs for the AI
   work"; and "when i ask a question in jambo, then i move to overview and then back to jambo, the thinking bubble
   … disappears which makes one think that jambo stopped working").
   (1) aiDeepLineHtml says only "Weighed by the stronger model", never a dollar figure, whoever reads (the server's
       admin-only `cost` is ignored); ai_deep_line_cost and mig_side_spent are retired (empty, both books).
   (2) every redraw of the side and list conversation that does not say asks aiThinkingNow (ai.busy · Home's
       intel.busy · the Playbook's ldJbThinking), so pressing the Jambo tab mid-question keeps the dots.
   Red at the parent: the line carried "$0.094"; a plain redraw drew no dots. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const A = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const { STRINGS } = require('../js/i18n.js');
const val = (L, k) => { const d = Object.getOwnPropertyDescriptor(STRINGS[L], k); return d && typeof d.value === 'string' ? d.value : ''; };

test('f1210 (1) the deep line never says what the answer cost', () => {
  const ctx = { i18t: k => k === 'ai_deep_line' ? 'Weighed by the stronger model' : k === 'ai_deep_line_cost' ? 'COST' : k, _aiEsc: s => s };
  vm.createContext(ctx); vm.runInContext(fnBody(A, 'aiDeepLineHtml'), ctx);
  const html = ctx.aiDeepLineHtml({ deep: { cost: 0.094 } });
  assert.match(html, /Weighed by the stronger model/);
  assert.doesNotMatch(html, /\$|COST|0\.09/);
  assert.equal(ctx.aiDeepLineHtml({}), '');
  for (const L of ['en', 'sv']) { assert.equal(val(L, 'ai_deep_line_cost'), '', L); assert.equal(val(L, 'mig_side_spent'), '', L); }
});

test('f1210 (2) a redraw keeps the dots while Jambo works', () => {
  const run = s => { const ctx = Object.assign({ window: {} }, s); ctx.window.intel = s.intel; ctx.window.ldJbThinking = s.ldJbThinking; vm.createContext(ctx); vm.runInContext(fnBody(A, 'aiThinkingNow'), ctx); return ctx.aiThinkingNow(); };
  assert.equal(run({ ai: { busy: true } }), true, 'the side panel\'s own question');
  assert.equal(run({ ai: { busy: false }, intel: { busy: true } }), true, 'Home\'s box');
  assert.equal(run({ ai: { busy: false }, ldJbThinking: () => true }), true, 'the Playbook writing a position');
  assert.equal(run({ ai: { busy: false } }), false);
  const feed = fnBody(A, 'renderAIFeed');
  assert.match(feed, /^function renderAIFeed\(typing\)\{/, 'no default of false');
  assert.match(feed, /if\(typing===undefined\) typing=aiThinkingNow\(\);/);
});
