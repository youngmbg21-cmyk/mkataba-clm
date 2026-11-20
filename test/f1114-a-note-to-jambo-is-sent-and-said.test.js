'use strict';
/* f1114 — A NOTE TO JAMBO IS SENT, AND WHAT HAPPENED IS SAID IN THE BOX (owner, 20 Nov 2026, over a photo of an
   arrival check's "Change the suggestion" box on the Board: "Page is asking what i should ask jambo to do but i cant
   send a note" — Redo was pressed and nothing seemed to happen; the outcome was only an alert at the window's foot,
   which an iPad's keyboard can hide, and Enter did nothing).

   (1) the one box (agSendBackHtml) carries a line that says what happened (.ag-sb-say, a polite status) and a field
       whose keyboard key says Send (enterkeyhint)
   (2) the one press (agSendBackPress) says it IN the box: an empty note (and the field is made ready), Jambo at
       work, a refusal, done; a work item no longer found is said, never a silent nothing
   (3) Enter in the field presses the box's own Redo, delegated once on the document (every host's routing)
   (4) the new words in both books; the line wears the house tones
   Fails at the parent: no .ag-sb-say, no agSendBackSay, no Enter. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AG = read('js/views/agents.js').replace(/\/\*[\s\S]*?\*\//g, '');
const fn = name => { const a = AG.indexOf('function ' + name + '('); assert.ok(a >= 0, name + ' exists'); const b = AG.slice(a + 10).search(/\n(?:async )?function |\nif \(typeof document/); return AG.slice(a, a + 10 + (b < 0 ? 4000 : b)); };

test('f1114 (1) the box carries a status line and a Send key', () => {
  const h = fn('agSendBackHtml');
  assert.match(h, /<p class="ag-sb-say" role="status" aria-live="polite" hidden><\/p>/);
  assert.match(h, /class="ag-sb-note"[^>]*enterkeyhint="send"/);
});

test('f1114 (2) the press says each outcome in the box', () => {
  const p = fn('agSendBackPress');
  assert.match(p, /if \(!it \|\| typeof agentSendBack !== 'function'\)\{ agSendBackSay\(box, _agT\('ag_sendback_gone'\), 'err'\); return; \}/, 'never a silent nothing');
  assert.match(p, /agSendBackSay\(box, _agT\('ag_sendback_empty'\), 'warn'\);[\s\S]*?fieldFocus\(field\)/, 'an empty note is said and the field made ready');
  assert.match(p, /agSendBackSay\(box, _agT\('ag_sendback_busy'\)\);/, 'Jambo at work');
  assert.match(p, /agSendBackSay\(box, \(e && e\.message\) \|\| String\(e\), 'err'\);/, 'a refusal');
  assert.match(p, /agSendBackSay\(box, _agT\(landed \? 'ag_sendback_done' : 'ag_sendback_pending'\), landed \? 'ok' : 'warn'\);/, 'done');
  assert.match(fn('agSendBackSay'), /p\.textContent = text \|\| ''; p\.hidden = !text;/);
});

test('f1114 (3) Enter presses the box\'s own Redo, once, on the document', () => {
  const at = AG.indexOf('document._agSbEnter');
  assert.ok(at > 0, 'delegated once');
  const blk = AG.slice(at, at + 700);
  assert.match(blk, /e\.key !== 'Enter' \|\| e\.isComposing/);
  assert.match(blk, /classList\.contains\('ag-sb-note'\)/);
  assert.match(blk, /querySelector\('\[data-ag-sb-go\]'\)/);
  assert.match(blk, /if \(!go \|\| go\.disabled\) return;\s*e\.preventDefault\(\); go\.click\(\);/);
});

test('f1114 (4) the new words in both books; the line wears the house tones', () => {
  const I = read('js/i18n.js');
  assert.equal((I.match(/^    ag_sendback_gone: /gm) || []).length, 2);
  const CSS = read('index.html');
  assert.match(CSS, /\.ag-sb-say\{margin:0;font-size:13px;color:var\(--color-quiet\);\}/);
  for (const [k, t] of [['is-warn', 'amber'], ['is-err', 'ruby'], ['is-ok', 'green']])
    assert.match(CSS, new RegExp('\\.ag-sb-say\\.' + k + '\\{color:var\\(--st-' + t + '-fg\\);\\}'));
});
