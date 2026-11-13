'use strict';
/* f1042 — THE SEND SCREEN TURNS IN PLACE (owner, 13 Nov 2026, the flash survey): "when I pick 'A Where we are
   page' on the Send screen, the screen flashes and is replaced by a new one, and I can no longer go back to 'The
   contract, round 1'." Two of the three "What goes" choices already turned the letter in place; the third called
   openShareModal again, so a NEW screen stood there knowing nothing of the old one and the way back led to itself.
   All three are turns of one screen now, and the form a sender leaves behind on the way to the route editor comes
   back WHOLE rather than two fields of it (one of which was never a box on this screen).
   Source-sliced: comments stripped, each check pinned to its function's own region.
   The browser half is test/chromium/send-screen-keeps-its-way-back-verify.js. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len = 4000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1042 (1) no "What goes" choice reopens the screen — all three are turns', () => {
  const s = read('js/core.js');
  const doors = region(s, "if(document.getElementById('sh-lt-else')){", 900);
  assert.match(doors, /data-sh-lt-else="status"[\s\S]{0,160}setKind\('status'\)/, 'a Where we are page turns the letter');
  assert.match(doors, /data-sh-lt-else="contract"[\s\S]{0,160}setKind\('contract'\)/, 'the contract turns the letter');
  assert.match(doors, /share-other[\s\S]{0,160}setKind\('history'\)/, 'the history turns the letter');
  assert.doesNotMatch(doors, /openShareModal\(/, 'and not one of them opens a new screen');
});

test('f1042 (2) the turn takes three kinds, and rebuilds the payload for the kind', () => {
  const s = read('js/core.js');
  const k = region(s, 'const setKind = k => {', 1200);
  assert.match(k, /purposeSel\s*=\s*\(k==='history'\|\|k==='status'\)\s*\?\s*k/, 'status is a kind of its own, not "not history"');
  assert.match(k, /payloadObj\s*=\s*buildSharePayload\(c,\s*docHash,\s*null,\s*\{\s*purpose:purposeSel\s*\}\)/, 'the payload is the kind’s');
});

test('f1042 (3) a Where we are page hides what a record hides', () => {
  const s = read('js/core.js');
  const k = region(s, 'const setKind = k => {', 4000);
  assert.match(k, /const rec = hist \|\| purposeSel==='status'/, 'both records read as one');
  for (const id of ['share-purpose-wrap', 'share-readiness-wrap', 'share-manifest-line', 'share-manifest'])
    assert.match(k, new RegExp(`getElementById\\('${id}'\\)\\?\\.classList\\.toggle\\('hidden',\\s*rec`), id + ' follows the record, not the history alone');
  assert.match(k, /share-signers'\)\?\.classList\.toggle\('hidden',\s*rec \|\| purposeSel!=='sign'\)/, 'who signs is hidden on a record');
});

test('f1042 (4) the whole form is carried away and back, not two fields', () => {
  const s = read('js/core.js');
  const edit = region(s, "document.getElementById('share-signer-edit')", 900);
  assert.match(edit, /const keep=shareFormTake\(\)/, 'the whole form is taken');
  assert.doesNotMatch(edit, /fval\('sh-msg'\)/, "and not the box that was never on this screen");
  const take = region(s, 'function shareFormTake', 1200);
  for (const f of ['sh-summary', 'sh-name', 'sh-email']) assert.ok(take.includes(f) || read('js/core.js').includes(`'${f}'`), f + ' is carried');
  assert.match(take, /sh-durable/, 'and whether the link is a standing one');
  assert.match(take, /sh-exp/, 'and how long it works');
  assert.match(take, /\[data-share-ch\]\[aria-pressed="true"\]/, 'and how it goes');
});

test('f1042 (5) the form is put back only once its fields and the channel setter exist', () => {
  const s = read('js/core.js');
  const i = s.indexOf('if(opts.resume) shareFormPut(opts.resume, setCh)');
  const j = s.indexOf('const setCh=k=>{');
  assert.ok(i > 0 && j > 0 && i > j, 'the put-back stands AFTER the one setter (a const read before it is a crash)');
  const put = region(s, 'function shareFormPut', 1200);
  assert.match(put, /keep\.fields\|\|\{ 'sh-summary':keep\.summary \}/, 'an older two-field resume still lands');
  assert.match(put, /setCh\(keep\.ch\)/, 'how it goes is put back through the screen’s own one setter');
});

test('f1042 (6) the form carried holds what the sender typed, and nothing else', () => {
  const s = read('js/core.js');
  const take = region(s, 'function shareFormTake', 1200);
  assert.doesNotMatch(take, /payload|purposeChosen|token|buildSharePayload/, 'no payload, no purpose, no token rides along');
});
