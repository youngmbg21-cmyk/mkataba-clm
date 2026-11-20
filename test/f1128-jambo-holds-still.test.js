'use strict';
/* f1128 — JAMBO HOLDS STILL (owner, 20 Nov 2026: "when i type on it, the conversation history disappears then comes
   back. or when i type on the jambo window, when the results are about to comeback to jumps to the overview tab";
   "Fix 1, and stay on the answer for 2")
   1 · The conversation is drawn again on every turn, and every message replayed its arrival fade, so the whole history
       blinked out and back. A message drawn once is marked (jamboTurnSeen → data-jb-seen) and never fades again; only
       the newest arrives.
   2 · An answer that also named a place moved the page and shut the conversation (the panel landed on Overview). Now,
       when Jambo ANSWERED, nothing moves: the answer ends with one link (m.goTo → "Take me there ›", jbGoPress). Words
       that ASK to be taken somewhere ("take me to …", JB_REF_OPEN_RE) still move at once.
   At the parent none of this holds. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const CO = read('js/components.js'), AI = read('js/ai.js');

test('f1128 (1) a message already drawn does not fade in again', () => {
  const sb = { WeakSet };
  vm.createContext(sb);
  vm.runInContext(fnBody(CO, 'jamboTurnSeen') + '\nthis.f = jamboTurnSeen;', sb);
  const m = { role: 'assistant', text: 'x' };
  assert.equal(sb.f(m), false, 'the first drawing is its arrival');
  assert.equal(sb.f(m), true, 'every drawing after it is not');
  assert.match(strip(fnBody(CO, 'jamboTurnHtml')), /\$\{seen \? ' data-jb-seen' : ''\}/);
  assert.match(strip(read('index.html')), /\.jb-turn\[data-jb-seen\] \.ai-msg, \.jb-turn\[data-jb-seen\]\.ai-msg\{animation:none;\}/);
});

test('f1128 (2) an answer that names a place stays on the answer, with a link that goes there on a press', () => {
  const run = strip(fnBody(AI, 'aiGotoRun'));
  assert.match(run, /if\(!card&&!goAsk\)\{/, 'an answer stays unless the words asked to be taken');
  assert.match(run, /last\.goTo=jbGoKeep\(a\);/);
  assert.ok(run.indexOf('last.goTo=jbGoKeep(a);') < run.indexOf('caGo(a)'), 'before any move');
  assert.match(run, /const goAsk=!!\(typeof window\.JB_REF_OPEN_RE!=='undefined'&&window\.JB_REF_OPEN_RE&&window\.JB_REF_OPEN_RE\.test\(String\(q\|\|''\)\)\);/, '"take me to …" still moves');
  assert.match(strip(fnBody(CO, 'jamboTurnHtml')), /m && m\.goTo\) \? `<div class="ig-go-said jb-go-said"><button type="button" class="ui-link" data-jb-go=/, 'the link is drawn by the one turn builder');
  assert.match(AI, /closest\('\[data-jb-go\]'\)[\s\S]{0,120}jbGoPress\(b\.getAttribute\('data-jb-go'\)\)/, 'a press goes there');
  const I = read('js/i18n.js');
  assert.equal((I.match(/\n\s+jb_go_there: /g) || []).length, 2, 'both books');
});
