/* f297 — THE INSIGHTS PAGE PRINTS COPILOT'S NOTICE UNDER THE ANSWER, NEVER AS
   A POP-UP (owner-asked 11 Sep 2026: "remove such pops in this page", off a red
   toast reading "One quoted excerpt could not be matched to the contract
   text…" drawn over an answer that already carried the same sentence in amber).

   api() surfaces every Copilot `notice` as a toast for all of its ~200 callers.
   The Insights dock has printed that same notice under the answer since it was
   built, so on this page the toast was one fact said twice. The fix is a flag
   (`IG_QUIET`, api()'s own `opts.quiet`), passed on EVERY Copilot call the page
   makes — and the safety property is the other half: a caller that goes quiet
   MUST still print the notice, or a cap has become a silent trim.

   Claims 1-3 are SOURCE claims, because "every call on this page" is a sweep
   and only the source can be swept. Claim 4 is behaviour on the real builder.
   Claim 5 is the CONTROL: the main Copilot panel was not in the ask and its
   toast must still fire. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const INTEL = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
const AI = fs.readFileSync(path.join(ROOT, 'js/ai.js'), 'utf8');
const API = fs.readFileSync(path.join(ROOT, 'js/api.js'), 'utf8');

/* Every `copilotAsk(` CALL in the file (the reference inside a comment or a
   string is not a call), found by walking to the matching close paren so a
   multi-line argument list is read whole. */
function copilotCalls(src) {
  const out = [];
  let i = 0;
  for (;;) {
    i = src.indexOf('copilotAsk(', i);
    if (i < 0) break;
    let depth = 0, j = i + 'copilotAsk'.length;
    for (; j < src.length; j++) {
      if (src[j] === '(') depth++;
      else if (src[j] === ')') { depth--; if (!depth) break; }
    }
    out.push(src.slice(i, j + 1));
    i = j;
  }
  return out;
}

test('f297 (1) every Copilot call on the Insights page asks for quiet — a fifth call added later has to as well', () => {
  const calls = copilotCalls(INTEL);
  assert.ok(calls.length >= 4, 'the page makes at least the four calls it made when this was written: ' + calls.length);
  for (const c of calls) assert.match(c, /IG_QUIET\s*,?\s*\)$/, 'a call without the quiet flag:\n' + c);
  assert.match(INTEL, /const IG_QUIET=\{quiet:true\}/, 'the flag is api()\'s own opts.quiet');
});

test('f297 (2) …and every one of them prints the notice where the reader is looking — quiet is never silent', () => {
  /* Three calls hand their answer to intelPushChatResult; the friction
     commentary keeps its own html. Each path goes through igNoticeHtml, the ONE
     line, so a caller cannot print the sentence its own way or not at all. */
  assert.match(INTEL, /function igNoticeHtml\(notice\)/);
  const inPush = /function intelPushChatResult\(res\)\{[\s\S]*?igNoticeHtml\(res\.notice\)[\s\S]*?\n\}/.test(INTEL);
  assert.ok(inPush, 'intelPushChatResult prints the notice through igNoticeHtml');
  assert.match(INTEL, /frictionAI=\{busy:false,key,html:rich\.html\+igNoticeHtml\(res\.notice\)/,
    'the friction commentary prints it too — it does not go through intelPushChatResult');
  // no second copy of the amber line written out beside the one builder
  const inline = INTEL.match(/text-\[11px\] text-amber-700 mt-2"/g) || [];
  assert.equal(inline.length, 1, 'the amber notice line is written ONCE, in igNoticeHtml');
});

test('f297 (3) copilotAsk forwards opts to api(), and api() reads opts.quiet as "no toast, nothing else"', () => {
  assert.match(AI, /async function copilotAsk\(messages, context, onEvent, opts\)/);
  assert.match(AI, /return await api\('ai\/chat','POST',\{ messages, context \}, opts\);/);
  // the streaming path is deliberately untouched — no quiet caller streams
  assert.match(AI, /apiStream\('ai\/chat\/stream',\{ messages, context \}, onEvent\)/);
  assert.match(API, /if\(data&&data\.notice&&!\(opts&&opts\.quiet\)&&typeof toast==='function'\) toast\(data\.notice,'err'\);/);
});

test('f297 (4) on the real page an answer carrying a notice draws it under the answer, escaped, and pushes nothing else', () => {
  const w = buildWorld({ intelView: true });
  const win = w.win;
  const before = win.eval('intel.history.length');
  win.intelPushChatResult({ answer: 'The contract runs to June 2028.', notice: 'One <quoted> excerpt could not be matched', cards: [] });
  const last = win.eval('intel.history[intel.history.length-1]');
  assert.equal(win.eval('intel.history.length'), before + 1);
  assert.equal(last.role, 'assistant');
  assert.match(last.text, /June 2028/);
  assert.match(last.text, /text-amber-700[^>]*>One &lt;quoted&gt; excerpt could not be matched</, 'the notice is drawn under the answer, escaped');
  // and an answer with no notice draws no empty amber line
  win.intelPushChatResult({ answer: 'Plain.', cards: [] });
  const plain = win.eval('intel.history[intel.history.length-1]');
  assert.ok(!/text-amber-700/.test(plain.text), 'no notice, no line');
});

test('f297 (5) CONTROL — the main Copilot panel was not in the ask: its call passes no quiet flag and its own inline line stands', () => {
  const calls = copilotCalls(AI).filter(c => !c.startsWith('copilotAsk(messages, context, onEvent'));
  assert.ok(calls.length >= 1);
  for (const c of calls) assert.ok(!/IG_QUIET|quiet/.test(c), 'the main panel still gets the toast:\n' + c);
  assert.match(AI, /if\(res\.notice\) text\+=`<div class="text-\[11px\] text-amber-700 mt-2 leading-relaxed">/,
    'its own inline line is untouched');
});
