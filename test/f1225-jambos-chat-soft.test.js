'use strict';
/* f1225 — JAMBO'S CHAT, "SOFT" (the owner picked Soft by name, 25 Nov 2026; drawing jambo-chat.html)
   Only the bubbles change, never what goes inside them; ONE set of rules for every host of the conversation (the one turn
   builder jamboTurnHtml: igMsgHTML, aiMsgHtml, stJbTurnHtml), scoped, no !important:
   (1) the question a soft green bubble, its corner squared bottom-right; the answer a white bubble with a thin grey edge,
       corner squared bottom-left, holding all it holds today; errors keep their rose
   (2) ONE line under an answer: "Read from …" left, ✓ ✕ right; "Weighed by the stronger model" quiet, inside
   (3) a question and its answer one group, a clear gap before the next; the talk starts below the waves
   (4) the Handbook says it, in both books */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const X = read('index.html');
const block = () => { const i = X.indexOf('/* ==== JAMBO\'S CHAT, "SOFT"'); assert.ok(i > 0, 'the Soft block is there'); return X.slice(i, X.indexOf('</style>', i)); };

test('f1225 (1) the two bubbles; the answer holds everything; errors keep their rose', () => {
  const b = block();
  assert.match(b, /\.jb-turn :is\(\.ai-msg\.justify-end > \.ai-bub, \.st-jb-me\)\{[^}]*border-radius:10px 10px 3px 10px;background:var\(--st-green-bg\);color:var\(--color-text\)/, 'your question: soft green, ink words, squared toward you');
  assert.match(b, /\.ai-msg:not\(\.justify-end\):not\(:has\(> div > \.ai-bub\.bg-rose-50\)\) > div,\s*html\.lg-new:not\(#_\) \.jb-turn \.st-jb-msg > \.st-jb-bub\{[^}]*border:1px solid var\(--color-divider\);border-radius:10px 10px 10px 3px;background:var\(--color-surface\)/, 'his answer: the whole column a white bubble, thin grey edge, squared toward him');
  assert.match(b, /> div > \.jl-bub:not\(\.bg-rose-50\)\{padding:0;border:0;border-radius:0;background:none/, 'the words inside lose their own slab');
  assert.doesNotMatch(b, /!important/);
  for (const r of [...b.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(Boolean))
    assert.match(r, /^html\.lg-new:not\(#_\) /, 'scoped: ' + r);
  /* what goes inside is untouched: the builders still draw the same parts */
  const I = read('js/views/intelligence.js');
  assert.match(I, /<div class="ai-bub \$\{m\.err\?'rounded-2xl rounded-tl-md border px-3\.5 py-2 text-\[13px\] leading-relaxed bg-rose-50 border-rose-200 text-rose-800':'jl-bub'\}">/, 'an error answer keeps its rose');
});

test('f1225 (2) one line under an answer: where it read from, and ✓ ✕', () => {
  const b = block();
  assert.match(b, /\.jb-turn > \.jb-read, html\.lg-new:not\(#_\) \.jb-turn \.ai-msg \.ai-read\{display:flex;align-items:center;min-height:24px;[^}]*padding:0 64px 0 2px/, '"Read from" on the left, room kept for ✓ ✕');
  assert.match(b, /\.jb-turn \.hb-fb\{position:absolute;right:2px;bottom:0/, '✓ ✕ on the right of that line');
  assert.match(b, /\.jb-turn \.jb-deep\{margin:4px 0 0;font-size:12px;line-height:16px;color:var\(--color-neutral-600\)\}/, '"Weighed by the stronger model" small and quiet, inside');
});

test('f1225 (3) a question and its answer are one group; the talk starts below the waves', () => {
  const b = block();
  assert.match(b, /\.jb-turn \+ \.jb-turn\{margin-top:8px\}/);
  assert.match(b, /\.jb-turn \+ \.jb-turn:has\(\.ai-msg\.justify-end, \.st-jb-me\)\{margin-top:24px\}/, 'a clear gap before the next question');
  assert.match(b, /#igd-feed\.igd-talk, #app-shell \.ins-panel\.is-jambo #jl-talk-sc, \.st-cr #st-jb-feed\):has\(\.jb-turn\)\{padding-top:96px;[^}]*mask-image:linear-gradient\(to bottom, transparent 0, transparent 24px, black 96px\)\}/, 'below the waves, fading before it reaches them');
});

test('f1225 (4) the Handbook says the look, in both books', () => {
  const H = read('js/handbook.js');
  assert.match(H, /Your question is a soft green bubble on the right; Jambo\\'s answer a white bubble with a thin grey edge/);
  assert.match(H, /Din fråga är en mjuk grön bubbla till höger; Jambos svar en vit bubbla med tunn grå kant/);
  assert.match(H, /The green links stand on the same line as/);
  assert.match(H, /De gröna länkarna står på samma rad som/);
});
