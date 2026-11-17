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
  assert.match(L, /const _tplPf = \{.*view:'shelves', lf:'' \};/);
  assert.match(body('tplnOn'), /newLookOn\(\) && tplListIns\(\)/);
  const h = body('tplnHtml');
  assert.match(h, /if \(tplnView\(\) === 'paper'\)\{ const x = tplnPicked\(rows\); if \(x\) return tplnPaperHtml\(x\); _tplPf\.view = 'list'; \}/, 'the paper only once one is chosen');
  assert.match(h, /if \(tplnView\(\) === 'list'\) return tplnListHtml\(rows\);\s*return tplnShelvesHtml\(rows\);/);
});

test('f1091 (2) Shelves: the filter line, four figures that open what they count, a shelf per folder', () => {
  const s = body('tplnShelvesHtml');
  /* RE-POINTED 17 Nov 2026 (the owner's pick, "build cover flow"): a row per folder, its papers a carousel */
  assert.match(s, /\$\{tplnFilterLineHtml\(rows, shelves\)\}<div class="tpln5-figs">\$\{figs\}<\/div><div class="tpln5-cf">/, 'the filter above the figures, a row per folder under them');
  for (const a of ['data-tpln-view="list"', 'data-tpln-ready', 'data-tpln-ids="used"', 'data-tpln-ids="changed"']) assert.ok(s.includes(a), a);
  assert.match(s, /' disabled'/, 'a 0 is no door');
  assert.match(s, /class="tpln5-cfr" role="button" tabindex="0" data-tpln-shelf="\$\{_tplEsc\(sh\.fid\)\}" style="--sd:var\(--st-\$\{tone\}-dot\)"/, 'a row per folder; its colour only a mark');
  assert.match(s, /class="tpln5-cfp\$\{k \? '' : ' is-on'\}" data-tpln-open="\$\{_tplEsc\(tplPfKey\(x\.c\)\)\}" style="--o:\$\{k\};--a:\$\{k\}"/, 'each paper a page in the carousel, opening its paper');
  const f = body('tplnFilterLineHtml');
  assert.match(f, /<input type="search" data-tpln-q[^>]*placeholder="\$\{_tplEsc\(i18t\('lh_filter_ph'\)\)\}"/, 'Filter this list, as Contracts');
  assert.match(f, /data-tpln-view="shelves"[\s\S]*data-tpln-view="list"/, 'Shelves · All at its right');
  assert.match(body('tplnFigs'), /usedIds[\s\S]*st\.ids/, 'the figures count the tally\'s own contracts');
  assert.match(L, /return \{ used:recent\.length, usedIds:recent\.map\(c => c\.id\), checked/);
});

test('f1091 (3) the folder\'s list, the Legora way: the same filter, a counted sentence, the chips, the quoted rows', () => {
  const l = body('tplnListHtml');
  assert.match(l, /\$\{tplnFilterLineHtml\(rows, shelves\)\}<p class="tpln5-say">\$\{tplnSayHtml\(shown, shelves\)\}<\/p>/);
  assert.match(l, /tplnChipsHtml\(rows\.map\(x => x\.c\)\)/);
  assert.match(l, /_tplPf\.ls \? '' : `<div class="tpln5-glab" data-tpln-glab>/, 'grouped by folder under All');
  assert.match(l, /tplnRowHtml\(x\.c, x\.last\.cs\.length, tplPfKey\(x\.c\) === pick\)/);
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
  assert.match(p, /tplnPanelHtml\(pick\.c, \{ open:v === 'list' \}\)/, 'the chosen paper, with Open the paper while the list is up');
  assert.match(p, /sh \? tplnShelfFive\(sh\) : tplnBookFive\(rows\)/);
  assert.match(L, /const P = tplnPanelBody\(\); insPaintPanel/);
  for (const r of [/html\.lg-new \.tpl-page\.is-tpln5 \.ph-top\{border-bottom:0/, /html\.lg-new \.tpln5-box\{flex:1;[^}]*border-bottom:1px solid var\(--color-divider\)/,
    /html\.lg-new \.tpln5-figs\{display:grid;grid-template-columns:repeat\(4,/, /html\.lg-new \.tpln5-cff\{[^}]*perspective:900px;overflow:hidden\}/,
    /html\.lg-new \.tpln5-cfp\{[^}]*transform:translateX\(calc\(var\(--o\) \* 140px\)\) rotateY\(calc\(var\(--o\) \* -42deg\)\)/, /html\.lg-new \.tpln5-cfp\.is-on\{[^}]*inset 0 3px 0 var\(--sd\)\}/, /html\.lg-new \.tpln5\.is-paper\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(260px,320px\)/]) assert.match(H, r);
  const I = read('js/i18n.js'), sv = I.search(/\n {2}sv\s*:\s*\{/), EN = I.slice(0, sv), SV = I.slice(sv);
  const keys = new Set([...read('js/views/library.js').matchAll(/['"](tpln5_[a-z0-9_]+)['"]/g)].map(m => m[1]));
  assert.ok(keys.size >= 30, 'found ' + keys.size);
  const has = (b, k) => new RegExp('\\b' + k + '(?:_one|_other)?:').test(b);
  assert.deepEqual([...keys].filter(k => !has(EN, k) || !has(SV, k)), []);
});

test('f1091 (7) Cover flow turns while pointed at, a key turns it one, less motion asked keeps it still; a paper opens itself', () => {
  assert.match(body('tplnCfRoll'), /tplnCfStill\(\)\) return;[\s\S]*setInterval\(\(\) => \{[\s\S]*?tplnCfSet\(row, \(row\._cfAt \|\| 0\) \+ 1\)/);
  assert.match(body('tplnCfSet'), /p\.style\.setProperty\('--o', o\); p\.style\.setProperty\('--a', Math\.abs\(o\)\); p\.classList\.toggle\('is-on', o === 0\)/);
  assert.match(L, /e\.key === 'ArrowRight' \|\| e\.key === 'ArrowLeft'/);
  assert.match(L, /const sh = t\.closest\('\[data-tpln-open\]'\) \? null : t\.closest\('\[data-tpln-shelf\]'\);/, 'a paper in a row opens the paper, not the folder');
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
