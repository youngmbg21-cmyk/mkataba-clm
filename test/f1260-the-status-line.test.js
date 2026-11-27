'use strict';
/* f1260 — THE STATUS LINE (owner, 27 Nov 2026, the work order "what the assistant is doing"; reverses 28 Oct 2026's
   "no words, just a symbol"): while Jambo works, one line at the foot of the conversation says the step in plain words
   ("Reading MK-A1", "Looking at your duties"), with three small dots pulsing in turn, and Stop. The words follow the
   tool loop (browser) and the stream's progress (server, which now sends the contract's id); "Still working on it"
   after 20 seconds on one step; no tool name, code or "…"; still dots for less motion; Stop drops a late answer and
   says so with Ask again; "Jambo ›" carries the dots on the other face. */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CO = strip(R('js/components.js')), AI = strip(R('js/ai.js')), IG = strip(R('js/views/intelligence.js')), I = R('js/i18n.js'), H = R('index.html');

describe('f1260 (1) the line: words, three dots, Stop', () => {
  test('one builder draws the step in words, the dots hidden from screen readers, Stop only where an ask can stop', () => {
    assert.match(CO, /<span class="jb-step">\$\{e\(jamboStatusWords\(\)\)\}<\/span><span class="jb-dots" aria-hidden="true">/);
    assert.match(CO, /role="status" aria-live="polite" aria-busy="true"/);
    assert.match(CO, /data-jb-stop title="\$\{e\(tr\('jb_stop_tip'\)\)\}"\$\{JB_STATUS\.stop \? '' : ' hidden'\}/);
    assert.doesNotMatch(CO.slice(CO.indexOf('function jamboThinkingHtml'), CO.indexOf('function jamboThinkingHtml') + 900), /aria-label=/, 'the words are read, not a hidden label');
  });
  test('the words are patched in place, never a redraw; kept in view only near the bottom', () => {
    assert.match(CO, /const say = el\.querySelector\('\.jb-step'\); if \(say && say\.textContent !== w\) say\.textContent = w;/);
    assert.match(CO, /const JB_NEAR_BOTTOM = 80;/);
    assert.match(CO, /<= JB_NEAR_BOTTOM;/);
  });
  test('"Still working on it" after 20 seconds on one step; never "…"', () => {
    assert.match(CO, /const JB_STILL_MS = 20000;/);
    assert.match(CO, /Date\.now\(\) - S\.at >= JB_STILL_MS\) \? 'jb_st_still'/);
    assert.ok(CO.includes(".replace(/(…|\\.\\.\\.)\\s*$/, '')"), 'a trailing … is taken off');
  });
  test('every tool Jambo can use has its words, in both books, none ending in "…"', () => {
    const tools = [...new Set((R('js/ai.js').match(/name:'([a-z_]+)'/g) || []).map(x => x.slice(6, -1)))];
    for (const t of tools) assert.match(CO, new RegExp('\\b' + t + ": 'jb_st_"), t);
    const keys = [...new Set(CO.match(/'jb_st_[a-z_]+'/g).map(x => x.slice(1, -1)))].concat(['jb_st_still', 'jb_stop', 'jb_stop_tip', 'jb_stopped']);
    for (const k of keys) {
      const rows = I.match(new RegExp('\\b' + k + ": '([^']*)'", 'g')) || [];
      assert.equal(rows.length, 2, k);
      if (/^jb_st_/.test(k)) for (const r of rows) assert.doesNotMatch(r, /…'$|\.\.\.'$/, k);
    }
  });
  test('less motion: three still dots; "Jambo ›" carries them while an answer is on its way', () => {
    assert.match(H, /@media \(prefers-reduced-motion:reduce\)\{\.jb-thinking \.jb-dot, \.jb-door-fwd \.jb-fwd-dots > i\{animation:none;opacity:\.6\}\}/);
    assert.match(CO, /class="jb-door-back jb-door-fwd\$\{jamboThinkingNow\(\) \? ' is-busy' : ''\}"/);
    assert.match(H, /\.jb-door-fwd\.is-busy \.jb-fwd-dots\{display:inline-flex\}/);
  });
});

describe('f1260 (2) the words follow the work', () => {
  test('the browser\'s own tool loop names each tool before it runs', () => {
    assert.match(AI, /toolUses\.map\(t=>\{ if\(typeof window\.jamboStepSay==='function'\) try\{ jamboStepSay\(t\.name,t\.input\); \}catch\(_\)\{\} return \{type:'tool_result'/);
  });
  test('a streamed turn\'s progress names it; both chat boxes listen', () => {
    assert.match(AI, /function aiStreamRenderer\(\)\{\s*return ev=>\{\s*if\(ev&&ev\.type==='progress'&&typeof window\.jamboStepSay==='function'\) try\{ jamboStepSay\(ev\.tool, \{ id:ev\.ref \}\); \}catch\(_\)\{\}/);
    assert.match(IG, /copilotAsk\(msgs, ctx, stepEv, IG_QUIET\)/);
  });
  test('Stop ends the wait, says so with Ask again, and a late answer is dropped', () => {
    assert.match(AI, /jamboStopOn\(\(\)=>\{ ai\.busy=false; aiPush\('assistant',\{ text:`<div>\$\{_aiEsc\(i18t\('jb_stopped'\)\)\}<\/div>`, choices:\[\{ label:i18t\('ai_ask_again'\), retry:String\(q\) \}\] \}\); renderAIFeed\(\); \}\)/);
    assert.match(AI, /const finish=\(ans\)=>\{\s*if\(gen!=null&&typeof window\.jamboStopGone==='function'&&jamboStopGone\(gen\)\) return;/);
    assert.match(IG, /if\(gen!=null&&jamboStopGone\(gen\)\) return;/);
    assert.match(CO, /S\.gen\+\+; S\.stop = null;/);
  });
});

describe('f1260 (3) the server sends the contract each step reads', () => {
  let ai, h, W;
  before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h); });
  after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
  test('progress carries the tool and the id (the browser words it); nothing else changes', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 't1', name: 'get_contract', input: { id: 'MK-A1' } }],
      [{ type: 'tool_use', id: 't2', name: 'deliver_answer', input: { answer: 'Done.' } }]);
    const r = await W.admin.raw('/api/ai/chat/stream', { method: 'POST', body: { messages: [{ role: 'user', content: 'terms of MK-A1?' }] } });
    const evs = String(r.text).split('\n\n').filter(f => /event: progress/.test(f)).map(f => JSON.parse(f.split('\n').find(l => l.startsWith('data:')).slice(5)));
    assert.ok(evs.length >= 1, 'a progress event');
    assert.equal(evs[0].tool, 'get_contract');
    assert.equal(evs[0].ref, 'MK-A1');
  });
});
