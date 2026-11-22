/* f1091 · OUR PAPER: SHELVES, THEN THE LEGORA WAY (owner's pick by prototype, 17 Nov 2026: "I LIKE the shelves landing
   page but the rest is legora"; "make the search filter to be above the kpi cards and similar to this" (Contracts);
   "both pages should have a similar looking filter"; "build it").
   (1) three steps in the new look: Shelves, a folder's list, the paper — the step decides what tplnHtml draws
   (2) Shelves: the filter line, then four figures (each the list it counts), then a coloured shelf per folder
   (3) the folder's list: the same filter line, one counted sentence, the chips, the quoted rows (grouped under All)
   (4) a row press chooses, a second opens; the head says the step with the way back above it; Esc goes back one step
   (5) the doors that led to the Templates table open the list; a refresh keeps the step, the folder and the words
   (6) Jambo's panel speaks for the step; the drawn parts in HaTi's sheet; every word in both books
   AT THE PARENT every test here fails. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const L = strip(read('js/views/library.js'));
const H = read('index.html');
const body = name => { const at = L.search(new RegExp('\\nfunction ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = L.slice(at + 10).search(/\n(?:function |if \(typeof document)/); return L.slice(at, nx < 0 ? undefined : at + 10 + nx); };

test('f1091 (1) the step decides what the book draws, in the new look only', () => {
  /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
  assert.match(L, /const _tplPf = \{.*view:'shelves', lf:'', lk:'', shelfPick:'' \};/);
  assert.match(body('tplnOn'), /newLookOn\(\) && tplListIns\(\)/);
  const h = body('tplnHtml');
  assert.match(h, /if \(tplnView\(\) === 'paper'\)\{ const x = tplnPicked\(rows\); if \(x\) return tplnPaperHtml\(x\); _tplPf\.view = 'list'; \}/, 'the paper only once one is chosen');
  assert.match(h, /if \(tplnView\(\) === 'list'\) return tplnListHtml\(rows\);\s*return tplnShelvesHtml\(rows\);/);
});

test('f1091 (2) Shelves: the ask box and chips, no figures; a calm card per folder, chosen in ink', () => {
  /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
  const s = body('tplnShelvesHtml');
  assert.match(s, /\$\{tplnFilterLineHtml\(rows, shelves\)\}<div class="tpln6-fcg">/, 'the ask box and chips, then a card per folder — no figure cards');
  assert.doesNotMatch(s, /tpln5-figs|tplnFigs\(/, 'the three numbers are not said again over the shelves');
  assert.match(s, /class="tpln6-fc\$\{on && on\.fid === sh\.fid \? ' is-on' : ''\}" role="button" tabindex="0" data-tpln-pickshelf="\$\{_tplEsc\(sh\.fid\)\}" style="--sd:var\(--st-\$\{tone\}-dot\)"/, 'a card per folder in its own colour; a press chooses it');
  assert.match(s, /class="tpln6-fp" data-tpln-open="\$\{_tplEsc\(tplPfKey\(x\.c\)\)\}"/, 'each named paper opens its paper');
  const f = body('tplnFilterLineHtml');
  assert.match(f, /<input type="search" data-tpln-q[^>]*placeholder="\$\{_tplEsc\(i18t\('tpln6_ask_ph'\)\)\}"/, 'one ask box');
  assert.match(f, /data-tpln-view="shelves"[\s\S]*data-tpln-view="list"/, 'Shelves · All as chips');
  assert.match(f, /i18t\('tpln6_shelf'\)[\s\S]*i18t\('tpln6_kind'\)/, '+ Shelf and + Kind');
  assert.match(body('tplnFigs'), /usedIds[\s\S]*st\.ids/, 'the tally\'s own contracts');
  assert.match(L, /return \{ used:recent\.length, usedIds:recent\.map\(c => c\.id\), checked/);
});

test('f1091 (3) All and a shelf: one calm table, grouped by folder under All, the quoted rows', () => {
  /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
  const l = body('tplnListHtml');
  assert.match(l, /\$\{tplnFilterLineHtml\(rows, shelves\)\}/);
  assert.doesNotMatch(l, /tplnSayHtml\(/, 'no counted sentence: the numbers are said once, in the panel');
  assert.match(l, /<table class="apn-table tpln6-table tpln-lrs">/);
  /* RE-POINTED 21 Nov 2026 (P-34, as drawn): All is ONE calm table — the shelves keep their order, no shelf heads between the rows */
  assert.doesNotMatch(l, /<tr class="tpln6-glab"/, 'no shelf heads between the rows under All');
  assert.match(l, /return rs\.map\(x => tplnRowHtml/, 'the rows, shelf after shelf');
  assert.match(l, /tplnRowHtml\(x\.c, x\.last\.cs\.length, tplPfKey\(x\.c\) === pick, max\)/);
  assert.match(body('tplnRowHtml'), /<small>(?:\\u00a7|§) 1 (?:\\u00b7|·)<\/small> (?:\\u201c|“)\$\{_tplEsc\(q\)\}(?:\\u201d|”)/, '§ 1 and the paper\'s opening words');
  assert.match(body('tplnFilter'), /\[data-tpln-glab\][\s\S]*g\.hidden = !any/, 'a folder\'s label steps aside when none of its rows stands');
});

test('f1091 (4) a row chooses, a second press opens; the head says the step; Esc goes back one step', () => {
  const c = body('tplnChoose');
  assert.match(c, /if \(_tplPf\.pick === k && tplnView\(\) === 'list'\)\{ _tplPf\.view = 'paper'; \}/);
  assert.match(L, /if\(tplnOn\(\)\)\{ tplnChoose\(k\); return; \}/, 'the book\'s row press');
  const hd = body('tplnHeadHtml');
  assert.match(hd, /data-tpln-back>(?:\\u2039|\u2039)/, 'the way back above the title');
  assert.match(hd, /data-paper-tab="standards"/, 'Our standards, its own page');
  assert.match(body('tplnBack'), /if \(tplnView\(\) === 'paper'\) _tplPf\.view = 'list';/);
  assert.match(L, /e\.key !== 'Escape'[\s\S]{0,200}tplnView\(\) === 'shelves'[\s\S]{0,400}tplnBack\(\);/);
  assert.match(L, /const hd=document\.querySelector\('\[data-tpln-head\]'\); if\(hd&&tplnOn\(\)\)\{ hd\.innerHTML=tplnHeadHtml\(tplnRowsNow\(\)\);/, 'the head is drawn with the book');
});

test('f1091 (5) the table\'s doors open the list; a refresh keeps the step, the folder and the words', () => {
  assert.match(L, /if\(k==='list'&&tplnOn\(\)\)\{ _tplPf\.view='list';/);
  assert.match(L, /function tplGoList\(name\)\{\n  if\(tplnOn\(\)\)\{ _tplPf\.view='list';[^\n]*_tplPf\.lq=String\(name\|\|''\)/);
  assert.match(L, /if\(tplnOn\(\)\)\{ _tplPf\.view='list'; _tplPf\.ls=k\.startsWith\('stream:'\)\?k\.slice\(7\):''/);
  assert.match(L, /view:tplnView\(\), ls:String\(_tplPf\.ls\|\|''\), lq:String\(_tplPf\.lq\|\|''\)/);
  assert.match(L, /if\(p&&\['shelves','list','paper'\]\.includes\(p\.view\)\) _tplPf\.view=p\.view;/);
  assert.match(L, /typing on Shelves|tplnView\(\) === 'shelves' && _tplPf\.lq\.trim\(\)\)\{ _tplPf\.view = 'list';/, 'typing on Shelves opens the list with the words kept');
});

test('f1091 (6) the panel speaks for the step; the drawn parts; both books', () => {
  const p = body('tplnPanelBody');
  /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
  assert.match(p, /tplnPanelHtml\(pick\.c, \{ open:v === 'list', paper:v === 'paper' \}\)/, 'the chosen paper; on the paper, what it holds');
  assert.match(p, /const o = tplnBookFive\(rows, sh\);/, 'the chosen shelf, a shelf\'s list, or the book');
  assert.match(L, /const P = tplnPanelBody\(\); insPaintPanel/);
  for (const r of [/html\.lg-new \.tpl-page\.is-tpln5 \.ph-top\{border-bottom:0/, /html\.lg-new \.tpln5-box\{flex:1;[^}]*border-bottom:1px solid var\(--color-divider\)/,
    /html\.lg-new \.tpln6-fcg\{display:grid;grid-template-columns:repeat\(auto-fill,minmax\(220px,1fr\)\)/, /html\.lg-new \.tpln6-fc\.is-on\{border-color:var\(--color-text\)/, /html\.lg-new \.tpln5\.is-paper\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(260px,320px\)/]) assert.match(H, r);
  const I = read('js/i18n.js'), sv = I.search(/\n {2}sv\s*:\s*\{/), EN = I.slice(0, sv), SV = I.slice(sv);
  const keys = new Set([...read('js/views/library.js').matchAll(/['"](tpln5_[a-z0-9_]+)['"]/g)].map(m => m[1]));
  /* RE-POINTED (P-34): the figures, the counted sentence and the tiles' words left the page; tpln6_ keys carry the new parts */
  assert.ok(keys.size >= 20, 'found ' + keys.size);
  const k6 = new Set([...read('js/views/library.js').matchAll(/['"](tpln6_[a-z0-9_]+)['"]/g)].map(m => m[1]));
  assert.deepEqual([...k6].filter(k => !new RegExp('\\b' + k + '(?:_one|_other)?:').test(EN) || !new RegExp('\\b' + k + '(?:_one|_other)?:').test(SV)), []);
  const has = (b, k) => new RegExp('\\b' + k + '(?:_one|_other)?:').test(b);
  assert.deepEqual([...keys].filter(k => !has(EN, k) || !has(SV, k)), []);
});

test('f1091 (7) FOLDER CARDS: at most three papers, the ones used most, "N more papers ›" beyond; a paper opens itself', () => {
  /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
  assert.match(L, /const TPLN_FC_SHOWN = 3;/);
  const s = body('tplnShelvesHtml');
  assert.match(s, /sh\.rows\.slice\(\)\.sort\(\(a, b\) => b\.last\.cs\.length - a\.last\.cs\.length\)\.slice\(0, TPLN_FC_SHOWN\)/, 'the three used most');
  assert.match(s, /more > 0 \? ' (?:\\u00b7|·) ' \+ i18t\('tpln6_top3'/, '"· the 3 used most" where it holds more');
  assert.match(s, /more > 0 \? `<button type="button" class="tpln6-more" data-tpln-shelf=/, '"N more papers ›" opens the shelf');
  assert.match(L, /e\.target\.matches\('\.tpln5-fc, \.tpln6-fc, tr\.tpln-lr'\)[\s\S]{0,120}e\.key === 'Enter' \|\| e\.key === ' '/, 'Enter presses a card');
  assert.match(L, /const sh = t\.closest\('\[data-tpln-open\]'\) \? null : t\.closest\('\[data-tpln-shelf\]'\);/, 'a paper on a card opens the paper, not the folder');
  assert.doesNotMatch(L, /tplnCfRoll|tplnCfSet|TPLN_CF_MS/, 'Cover flow is gone');
});

/* f1091 (8) · THREE ASKS, 17 Nov 2026 (owner: "increase the size of the paper to make better use of the empty space";
   "the landing page left as it is; "delete make it ours from here ... and simply add a door to New Agreements ...
   landing you to the exact contract in question"). AT THE PARENT every assertion here fails. */
test('f1091 (8) the paper fills its room; Make it ours is a door to New agreement, landing on the paper', () => {
  assert.match(H, /html\.lg-new \.tpln5\.is-paper \.tpln-zoom\{zoom:1\}/, 'the paper read at its own size');
  assert.match(H, /html\.lg-new \.tpln5\.is-paper \.tpln-sheet\{max-width:var\(--doc-sheet-max, 720px\);width:100%/, 'up to the agreement\'s measure');
  const v = body('tplPfVerbs');
  assert.match(v, /\['more', 'use', 'edit', 'ours'\]\.includes\(a\.k\)/, 'Make it ours is not pressed here');
  assert.match(v, /k:'ours', kind:'link', label:i18t\('tpln5_ours_door'\), run:\(\) => tplnOursGo\(card\.id\)/, 'its door in its place');
  assert.match(body('tplnOursGo'), /openNewAgreement\(\{ newPaper:true, start:'template', pick:bid \}\)/);
  assert.match(body('tplnOursGo'), /naNewPaperOk\(\)[\s\S]*newPaperBlock\(\)/, 'without the grant, the grant\'s refusal');
  assert.match(L, /a\.kind === 'link' \? 'tpln5-door'/, 'drawn as a green link, a way somewhere');
  const W = strip(read('js/wizard.js'));
  assert.match(W, /if\(o&&o\.newPaper\)\{ naNewPaperShow\(root,true\); if\(o\.start\) naNewPaperGo\(o\.start,\{ pick:o\.pick \}\); \}/, 'From scratch, then the start');
  assert.match(W, /openNewStandard\(\{ start:k\|\|'scratch', back, host, pick:\(x&&x\.pick\)\|\|null \}\)/);
  const N = strip(read('js/views/newstandard.js'));
  assert.match(N, /function nsLgTemplate\(o = \{\}\) \{\s*nsStyle\(\);\s*const st = \{ q: '', ls: '', more: false, pick: \(typeof TEMPLATES === 'object' && o\.pick && TEMPLATES\[o\.pick\]\) \? o\.pick : null,/, 'the paper arrives chosen');
  assert.match(N, /if \(st\.pick\) \{ const r = host\.querySelector[\s\S]{0,160}landOn\(r, \{ block: 'nearest' \}\)/, 'and in view, nothing pressed');
});
