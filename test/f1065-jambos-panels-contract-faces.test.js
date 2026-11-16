'use strict';
/* f1065 — JAMBO'S PANELS, THE FIVE PARTS, ROUND 3b (owner, 15 Nov 2026: "push and start round 3b"): a contract's faces —
   the Dossier (signed and draft), Fill in, the brief, Obligations, Before you sign, Before you send, Redlines with
   nothing on the table, and Clauses not read yet.
   (1) the stage line is labelled: six steps, each its name under its mark, keeping the spine's class, its label and
       one mark per stage (what the Dossier's one-card check counts); the card keeps where it stands as its first word.
   (2) each face says the five parts in the new look only and keeps its own presses: the Dossier's card (the long black
       button, Jambo's read); Fill in's rows (data-pd2-fp-go, the walk's head "On the paper"); the brief's "I have read
       this" (the brief's own act, pd2BriefRead); Obligations' Find them in the wording (runFindObligations) with the
       renewal block kept; Before you sign's first open check's own door (fill, standards, who signs — the signer door
       now answers inside the signing face); Redlines' three buttons still inside .rl-empty-acts; Clauses' head keeps
       .stk-view and data-stk-run.
   (3) on a contract the one black button is the long one (owner, 15 Nov 2026), and Before you send is dressed in the
       panel only (#pd-sendface), never the Send screen's own column.
   (4) the clause list wears the drawing (a label, one soft group, the number in its mark) while its BEHAVIOUR stays —
       it follows the paper (owner, 15 Nov 2026: the behaviour, not the look); the name's text is whole.
   (5) every word of the round in both books, and none collides with an older key.
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
const PD = read('js/paperdesk.js');

test('f1065 (1) the stage line is labelled, and the card keeps where it stands first', () => {
  const W = buildWorld().win;
  if (typeof W.pd2StepsHtml !== 'function') W.eval(read('js/paperdesk.js').replace(/^\s*(import|export)\b.*$/gm, ''));
  assert.equal(typeof W.pd2StepsHtml, 'function', 'the labelled stage line exists');
  const D = { stages: ['arrive', 'read', 'fill', 'nego', 'sign', 'live'].map((k, i) => ({ k, state: i < 2 ? 'done' : 'later', n: 0 })) };
  const d = W.document.createElement('div');
  d.innerHTML = W.pd2StepsHtml(D, 'fill', 'Arrive · Read · Fill · Negotiate · Sign · Live');
  const sp = d.querySelector('.pd2-spine.is-steps[data-pd2-spine]');
  assert.ok(sp, 'it keeps the spine\'s class and mark');
  assert.equal(sp.getAttribute('aria-label'), 'Arrive · Read · Fill · Negotiate · Sign · Live');
  assert.equal(sp.querySelectorAll('i').length, 6, 'one mark per stage');
  assert.equal(sp.querySelectorAll('i.is-focus').length, 1, 'the stage in hand');
  assert.equal(sp.querySelectorAll('i em').length, 6, 'each its name under it');
  const c = d.ownerDocument.createElement('div');
  c.innerHTML = W.pd2CardFiveHtml({ id: 'X', counterparty: 'Toyota Kenya', contractNo: 'DV-D1' }, '', 'Fill · 1 to do', 'Fill in 1 detail', '<p class="pd2-card-say">s</p>', '<span class="pd2-spine"></span>', '<button class="pd2-card-go">Go</button>');
  /* RE-POINTED 16 Nov 2026 (owner: no eyebrow, the same facts are said elsewhere; f1088): the card opens on its headline */
  assert.equal(c.querySelector('.pd2-card-top'), null, 'no eyebrow');
  assert.equal(c.querySelector('.pd2-card').firstElementChild.className, 'pd2-next', 'the headline first');
  assert.ok(c.querySelector('.pd2-card.is-five .pd2-card-act .pd2-card-go'), 'the long black button in its own soft card');
});

test('f1065 (2) each contract face says the five parts in the new look, by its own presses', () => {
  assert.match(region(PD, 'function pd2CardHtml(c, D){', 'function pd2ClausePoints('), /if \(typeof window\.newLookOn === 'function' && newLookOn\(\)\)\s*return pd2CardFiveHtml\(c, '', at,/);
  const fill = region(PD, 'function pd2FillFaceHtml(c, D){', 'const PD2_REST_NAMED');
  assert.match(fill, /rows\.replace\(\/\(<div class="pd2-fp" \[\^>\]\*>\)\/g/, 'the same rows, a mark added');
  assert.match(fill, /W\.length \? head \+ `<div class="pd2-fp-list is-five">/, 'the walk\'s own head kept');
  const brief = region(PD, 'function pd2BriefFaceHtml(c, D){', 'if (typeof document');
  assert.match(brief, /label: _pdT\('br_mark_read'\), attr: `data-pd2-br-read="\$\{E\(c\.id\)\}"`/);
  assert.match(PD, /const pr = t\.closest\('#ig-dock \[data-pd2-br-read\]'\);\s*if \(pr\)\{[^}]*pd2BriefRead\(c\)/, 'the brief\'s own act');
  const ob = region(PD, 'function pdObligHtml(c){', 'return `<div class="pd-obm-tab">${head}');
  assert.match(ob, /runFindObligations\(getContract\(c\.id\) \|\| c\)/); assert.match(ob, /mid: rn,/, 'the renewal block kept');
  assert.match(ob, /say: _pdT\('pd_obs_none'\)/, '"No obligations are recorded yet" still said after the renewal');
  const sg = region(PD, 'function pd2SignRowsHtml(c){', 'function pdSignFaceHtml(');
  assert.match(sg, /w: 'jov5_sg_go_fill'/); assert.match(sg, /w: 'jov5_sg_go_std'/); assert.match(sg, /data-pd-og-route="\$\{E\(c\.id\)\}"`, w: 'jov5_sg_go_who'/);
  assert.match(PD, /t\.closest\('#pd-og \[data-pd-og-route\], #pd-glance \[data-pd-og-route\], #pd-signface \[data-pd-og-route\]'\)/, 'the signer door answers in the signing face');
  const NEGO = read('js/views/negotiation.js');
  const rl = region(NEGO, 'function rlEmptyColumnActsHtml(', 'function rlAskColleague(');
  assert.match(rl, /<div class="rl-empty-acts is-five">.*\$\{sendBtn\}\$\{prepare\}<\/div>`\s*\+ `.*\$\{edit\}\$\{add\}<\/div><\/div>`/s, 'every button inside .rl-empty-acts');
  assert.equal((NEGO.match(/class="rl-cards-empty"/g) || []).length, 2, 'one class, two emptinesses (f246)');
  const BD = read('js/views/breakdown.js');
  const st = region(BD, 'function stkHeadHtml(c, b, all){', '/* MARQUEE');
  assert.match(st, /<div class="stk-head is-empty is-five">\$\{view\}/, 'the company view\'s line kept in the head');
  assert.match(st, /data-stk-run>\$\{_bdE\(i18t\(waits \? 'jb_read_now' : 'stk_read_clauses'\)\)\}/);
});

test('f1065 (3) the long black button on a contract, and Before you send dressed in the panel only', () => {
  const H = read('index.html');
  assert.match(H, /html\.lg-new #ig-dock \.pd2-dossier \.jov5-acts > \.jov5-go\{width:100%;height:var\(--ctl-h\)/);
  assert.match(H, /html\.lg-new \.pd2-sg\.is-five > \.pd2-sg-go\{width:100%;height:var\(--ctl-h\)/);
  const send = H.split('\n').filter(l => /sh-lt-verdict > h4\{display:flex;align-items:center;gap:12px/.test(l));
  assert.equal(send.length, 1); assert.match(send[0], /^ {2}html\.lg-new #ig-dock #pd-sendface /, 'the panel only');
});

test('f1065 (4) the clause list wears the drawing, its text and behaviour untouched', () => {
  const C = read('js/views/contract.js');
  const row = region(C, 'function docThreadRowHtml(x,i){', 'function docThreadRowsBy(');
  assert.match(row, /<span class="doc-th-num">\$\{esc\(num\[0\]\)\}<\/span>\$\{esc\(lab\.slice\(num\[0\]\.length\)\)\}/, 'the name\'s text is whole ("1. Definitions"); the number only wrapped');
  assert.match(row, /data-n="\$\{esc\(num\[1\]\)\}"/, 'the number in its round mark');
  assert.match(C, /<div class="doc-th-lbl"><span>\$\{esc\(i18t\('jov5_th_in'/, 'the label over the list');
  const H = read('index.html');
  const rules = H.split('\n').filter(l => /\.doc-th-lbl/.test(l));
  assert.ok(rules.length >= 8, 'the look');
  assert.ok(rules.every(l => !/scroll-behavior|scrollTop|pointer-events/.test(l)), 'only the look: nothing that moves the list or the paper');
});

test('f1065 (5) every word of the round is in both books, none colliding', () => {
  const W = buildWorld().win; const S = W.eval('typeof STRINGS !== "undefined" ? STRINGS : null'); assert.ok(S && S.en && S.sv);
  const keys = new Set();
  for (const f of ['js/paperdesk.js', 'js/views/negotiation.js', 'js/views/breakdown.js'])
    for (const m of read(f).matchAll(/['"](jov5_(?:pd|fp|bf|cob|ob|sg|rl|cl)_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 30, 'the round\'s words are found');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  assert.deepEqual([...keys].filter(k => !has(S.en, k) || !has(S.sv, k)), []);
  const I = read('js/i18n.js');
  assert.equal((I.match(/^ {4}jov5_ob_find_q:/gm) || []).length, 2, 'the Obligations page\'s own words keep their one line per book');
});
