'use strict';
/* f1066 — JAMBO'S PANELS, THE FIVE PARTS, THE REMAINING EIGHT (owner, 15 Nov 2026: "push and build all eight"): Where we
   are, Redlines with changes on the table, Deal, Ladder, Notes, Their view, Clauses after a reading, the side panel's
   Notes.
   (1) Jambo's Redlines face: one switch — Changes · Notes · Deal · Ladder — every part still inside .rl-idx-top; the
       column's state a headline; Send all in a card (not on Notes, not on the Ladder); the Ladder a face of its own;
       Changes presses back the one that stands (Notes, the Ladder or the Deal), never a new act.
   (2) Their view says whose eyes these are and its way back (the paper's own Redline press), never "Press the ✎ Edit".
   (3) Where we are, Deal and Clauses after a reading speak the five parts by their own presses: data-ds-share; the
       plan's own doors (data-deal-sendall / -chase / -ask); the counts off stkClauseTally.
   (4) an empty notes room — the side panel's and the column's — says how notes work.
   (5) every word in both books.
   AT THE PARENT every test here fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, start, end) => { const i = src.indexOf(start); assert.ok(i >= 0, start + ' is there'); const j = end ? src.indexOf(end, i + start.length) : -1; return strip(src.slice(i, j > i ? j : i + 8000)); };
const NEGO = read('js/views/negotiation.js'), PD = read('js/paperdesk.js');

test('f1066 (1) the Redlines face: one switch, a headline, Send all in a card, the Ladder its own face', () => {
  assert.match(NEGO, /\$\{five \? `<span class="rl-seg" role="group">\$\{five\.seg\}\$\{rlHeadNotesHtml\(c, opts\)\}\$\{rlHeadDealHtml\(c, opts\)\}<\/span>/, 'the switch, inside the head');
  const f = region(NEGO, 'function rlFiveHead(c, opts, k){', 'function rlTheirViewFive(');
  assert.match(f, /opts\.dealDoor && rlHeadOurs\(opts\)/, 'Jambo\'s face, our seat');
  assert.match(f, /data-rl-head-changes=/);
  assert.match(NEGO, /five && sendH && !five\.lad && !notesOn \? `<div class="rl-five-act">/, 'Send all in its card, not on Notes or the Ladder');
  assert.match(NEGO, /\$\{five && five\.lad \? ' is-ladder-face' : ''\}/);
  assert.match(PD, /if \(t\.closest\('\[data-rl-head-changes\]'\)\)\{[^\n]*\n[^\n]*\[data-rl-notes-all\]\[aria-pressed="true"\][^\n]*\[data-rl-ladder\]\[aria-expanded="true"\][^\n]*\[data-rl-deal\]\[aria-pressed="true"\]/, 'Changes presses back the one that stands');
  assert.match(read('index.html'), /#rl-changes-col\.is-ladder-face #nego-cards, html\.lg-new #ig-dock #rl-changes-col\.is-ladder-face #rl-risks\{display:none\}/, 'the Ladder face drawn whole by its own block');
  const lad = region(NEGO, 'function rlLadderFiveHtml(', '/* their view, the five parts');
  assert.match(lad, /ladderRungs|rungs\.map\(r =>/); assert.match(lad, /ladderStand\(c, id, side\)/, 'the steps as rows, then the playbook (owner: the card-in-card ladder was too cluttered)');
  assert.match(NEGO, /mid: roomsHtml \|\| ''/, 'the notes rooms under the headline');
  assert.match(read('index.html'), /\.doc-th-row\.is-open\.pd2-lit\{[^}]*background:var\(--color-surface\);box-shadow:0 0 0 1px var\(--color-divider\)\}/, 'the open clause a white card');
});

test('f1066 (2) their view says whose eyes these are, and its way back', () => {
  const tv = region(NEGO, 'function rlTheirViewFive(c){', '/* AN EMPTY NOTES ROOM');
  assert.match(tv, /attr: 'data-rl-tv-back=""'/);
  assert.match(NEGO, /if \(tv\) return `<div class="rl-cards-empty rl-tv-five" data-rl-five>\$\{tv\}<\/div>`;/);
  assert.match(PD, /if \(t\.closest\('\[data-rl-tv-back\]'\)\)\{ e\.preventDefault\(\); const r = document\.querySelector\('\[data-ig-red="1"\]'\)/, 'the paper\'s own Redline press');
  assert.equal((NEGO.match(/class="rl-cards-empty"/g) || []).length, 2, 'f246 still holds');
});

test('f1066 (3) Where we are, Deal and Clauses after a reading, by their own presses', () => {
  const ws = region(PD, 'function pd2StandsFaceHtml(c){', 'return `<div class="pd2-st-face">');
  assert.match(ws, /attr: may \? `data-ds-share data-ds-cid="\$\{E\(c\.id\)\}"`/);
  const dl = region(NEGO, 'function dealPanelNewHtml(c){', 'function dealPlanMemoText(');
  assert.match(dl, /attr: `data-deal-sendall="\$\{id\}"`/); assert.match(dl, /attr: `data-deal-chase="\$\{id\}"`/); assert.match(dl, /data-deal-ask="\$\{_nea\(f\.by\.rule\[0\]\.r\.clauseId\)\}"/);
  const cl = region(read('js/views/breakdown.js'), 'function stkMarqueeHtml(c, all, busy){', 'THE SAME HEAD AS REDLINES');
  assert.match(cl, /g\(T\.need, i18t\('jov5_cl_g_need'\), T\.need > 0\)\}\$\{g\(T\.look, i18t\('jov5_cl_g_look'\)\)\}\$\{g\(T\.fine/, 'the counts off the one tally');
  assert.match(cl, /\$\{stkViewHtml\(\)\}\$\{jov5HeadHtml/, 'the company view\'s line kept');
});

test('f1066 (4) an empty notes room says how notes work, in both rooms', () => {
  assert.match(NEGO, /`<div class="rl-np-empty is-five">\$\{rlNotesEmptyFive\(c, ext, other\)\}<\/div>`/, 'the side panel\'s');
  assert.match(NEGO, /`<div class="rl-fn-empty is-five">\$\{rlNotesEmptyFive\(c, ext, ext \? roomName\(cur\) : '', `<div class="rl-fn-tabs is-five"/, 'the column\'s, its rooms under the headline');
});

test('f1066 (5) every word of the round is in both books', () => {
  const W = buildWorld().win; const S = W.eval('typeof STRINGS !== "undefined" ? STRINGS : null'); assert.ok(S && S.en && S.sv);
  const keys = new Set();
  for (const f of ['js/paperdesk.js', 'js/views/negotiation.js', 'js/views/breakdown.js'])
    for (const m of read(f).matchAll(/['"](jov5_(?:ws|dl|cl|nt|rl|lad|tv)_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 40, 'the round\'s words are found');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  assert.deepEqual([...keys].filter(k => !has(S.en, k) || !has(S.sv, k)), []);
});
