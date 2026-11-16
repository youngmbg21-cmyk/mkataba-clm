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
  assert.match(NEGO, /\$\{five \? `<span class="rl-seg" role="group">\$\{five\.seg\}\$\{rlHeadNotesHtml\(c, opts\)\}\$\{rlHeadLadderHtml\(c, opts\)\}<\/span>/, 'the switch, inside the head (its Deal removed, f1084)');
  const f = region(NEGO, 'function rlFiveHead(c, opts, k){', 'function rlTheirViewFive(');
  assert.match(f, /opts\.dealDoor && rlHeadOurs\(opts\)/, 'Jambo\'s face, our seat');
  assert.match(f, /data-rl-head-changes=/);
  /* RE-POINTED (owner's pick, 16 Nov 2026, "Cards first"): Send all ends the head's one line, no card and no headline on Changes */
  assert.match(NEGO, /five && sendH && !five\.lad && !notesOn \? `<div class="rl-five-act is-line">\$\{sendH\}<\/div>`/, 'Send all on the head\'s line, not on Notes or the Ladder');
  assert.match(NEGO, /\$\{five && five\.lad \? ' is-ladder-face' : ''\}/);
  assert.match(PD, /if \(t\.closest\('\[data-rl-head-changes\]'\)\)\{[^\n]*\n[^\n]*\[data-rl-notes-all\]\[aria-pressed="true"\][^\n]*\[data-rl-ladder\]\[aria-expanded="true"\]/, 'Changes presses back the one that stands');
  assert.match(read('index.html'), /#rl-changes-col\.is-ladder-face #nego-cards, html\.lg-new #ig-dock #rl-changes-col\.is-ladder-face #rl-risks\{display:none\}/, 'the Ladder face drawn whole by its own block');
  const lad = region(NEGO, 'function rlLadderFiveHtml(', '/* their view, the five parts');
  assert.match(lad, /ladderRungs|rungs\.map\(r =>/); assert.match(lad, /ladderStand\(c, id, side\)/, 'the steps as rows, then the playbook (owner: the card-in-card ladder was too cluttered)');
  assert.match(NEGO, /mid: roomsHtml \|\| ''/, 'the notes rooms under the headline');
  /* RE-POINTED (owner, 16 Nov 2026: Clauses "the Legora way", f1073): the open clause is no card — an amber line at its
     left on the white list */
  assert.match(read('index.html'), /\.doc-th-row\.is-open\.pd2-lit\{[^}]*background:none;box-shadow:inset 2px 0 0 var\(--st-amber-dot\)\}/, 'the open clause: an amber line, no card');
});

test('f1066 (2) their view says whose eyes these are, and its way back', () => {
  const tv = region(NEGO, 'function rlTheirViewFive(c){', '/* AN EMPTY NOTES ROOM');
  assert.match(tv, /attr: 'data-rl-tv-back=""'/);
  assert.match(NEGO, /if \(tv\) return `<div class="rl-cards-empty rl-tv-five" data-rl-five>\$\{tv\}<\/div>`;/);
  assert.match(PD, /if \(t\.closest\('\[data-rl-tv-back\]'\)\)\{ e\.preventDefault\(\); const r = document\.querySelector\('\[data-ig-red="1"\]'\)/, 'the paper\'s own Redline press');
  assert.equal((NEGO.match(/class="rl-cards-empty"/g) || []).length, 2, 'f246 still holds');
});

test('f1066 (3) Where we are and Clauses after a reading, by their own presses', () => {
  /* RE-POINTED 16 Nov 2026 (owner: the owner-side "Where the deal stands" page is deleted; the Cover says where it stands,
     f1085): its face is gone and its door opens the Cover */
  assert.ok(!/function pd2StandsFaceHtml\(/.test(PD), 'the Where-we-are face is gone');
  assert.match(PD, /function pd2StandsOpen\(id\)\{ return pdCoverOpen\(id\); \}/);
  /* the Deal's panel (dealPanelNewHtml) was removed with the close plan (owner, 16 Nov 2026, f1084) */
  assert.ok(!/function dealPanelNewHtml\(/.test(NEGO), 'the Deal panel is gone');
  const cl = region(read('js/views/breakdown.js'), 'function stkMarqueeHtml(c, all, busy){', 'THE SAME HEAD AS REDLINES');
  /* RE-POINTED (owner, 16 Nov 2026: "move the start with liability part to the top where clauses review is and remove
     everything else in between"; f1073): one line, where to start read off the one tally — no headline, no counts */
  assert.match(cl, /const at0 = lead != null \? lead : look;/, 'where to start, off the one tally');
  assert.match(cl, /\$\{stkViewHtml\(\)\}<p class="stk-lg-top">/, 'the company view\'s line kept, then the one line');
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
