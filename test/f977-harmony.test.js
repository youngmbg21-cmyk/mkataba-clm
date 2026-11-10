'use strict';
/* f977 — THE HARMONY REVIEW (owner's picks saved 9 Nov 2026, docs/PLAN-harmony.md; built behind the new-look switch).
   Round 1, every page:
   (1) ONE HEAD: Approvals and Obligations draw their own new-look title and the page head steps aside for them; the
       pages still on their own head take the same serif 26 through one pair of tokens, the old look's 20 kept.
   (2) PILL TO ACT, LINK TO GO: Parties' rows carry no "Open party" and People's no "Email" (both stay in the panel);
       the black act is the chosen row's only.
   (3) ONE VOICE: in the new look a panel tab carries a number only when the page counts its own list; Home's panel
       has no "Jambo" on each note and no "Likely next".
   (4) SAY IT ONCE: a column that reads the same on every row steps out (Approvals' rests, People's reach).
   (5) ONE COUNT: Home's sentence leads with the whole; Obligations' title count is its first tab's.
   (6) THE FOOT FOLLOWS and (7) ONE THING WHEN EMPTY live in the HARMONY block, every rule under html.lg-new. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };
const HTML = read('index.html');
const block = () => { const i = HTML.indexOf('/* ==== THE NEW LOOK: HARMONY'); assert.ok(i > 0, 'the HARMONY block is there'); return HTML.slice(i, HTML.indexOf('</style>', i)); };

test('f977 (1) one head', () => {
  const app = read('js/app.js');
  assert.match(app, /\(\(view==='approvals'\|\|view==='obligations'\)&&typeof window\.newLookOn==='function'&&newLookOn\(\)&&typeof insFits==='function'&&insFits\(\)\)/, 'the page head steps aside for both');
  assert.match(strip(fnBody(read('js/views/approvalsview.js'), 'apnRender')), /<div class="cun-head"><h2 class="ctf-h">\$\{esc\(i18t\('nav_approvals'\)\)\}<\/h2><span class="ctf-hf" id="page-head-facts">/);
  assert.match(strip(fnBody(read('js/obligations.js'), 'obnRender')), /<div class="cun-head"><h2 class="ctf-h">\$\{_obEsc\(i18t\('nav_obligations'\)\)\}<\/h2>/);
  for (const f of ['js/app.js', 'js/views/library.js']) assert.match(read(f), /font-size:var\(--ph-title-size,20px\);font-weight:var\(--ph-title-w,var\(--w-title-serif\)\)/, f + ': the old look keeps 20');
  assert.match(block(), /html\.lg-new\{--ph-title-size:26px;--ph-title-w:400\}/);
});

test('f977 (2) pill to act, link to go', () => {
  assert.doesNotMatch(strip(fnBody(read('js/views/customers.js'), 'cunRowHtml')), /data-cun-open/, 'no Open party in a row');
  assert.doesNotMatch(strip(fnBody(read('js/views/directory.js'), 'dirnRowHtml')), /data-dirn-mail/, 'no Email in a row');
  assert.match(read('js/views/directory.js'), /data-dirn-mail="\$\{E\(p\.key\)\}"/, 'Email stays in the panel');
  assert.match(block(), /tr:not\(\.is-sel\) \.apn-acts \.apn-ok/, 'black only on the chosen row');
});

test('f977 (3) one voice', () => {
  assert.match(strip(fnBody(read('js/views/inspector.js'), 'jlHeadPaint')), /opt\.tabCount != null \? Number\(opt\.tabCount\) \|\| 0 : \(\(typeof window\.newLookOn === 'function' && newLookOn\(\)\) \? 0 : jlCount\(\)\)/);
  const cn = read('js/views/counter.js');
  assert.doesNotMatch(cn, /cn2-who-j/, 'no Jambo on each note');
  /* (Home's panel and its "no Likely next" went with Home, 10 Nov 2026) */
  assert.ok(!/function cn2JlSay\(/.test(cn));
  assert.match(read('js/paperdesk.js'), /igHomePaperFace\(\) === true && !pdContract\(\) && !\(typeof window\.newLookOn === 'function' && newLookOn\(\)\);/);
});

test('f977 (4) say it once', () => {
  const ap = strip(fnBody(read('js/views/approvalsview.js'), 'apnRender'));
  assert.match(ap, /const same=rs\.length>1&&rs\.every\(x=>x!=null&&x===rs\[0\]\);/);
  assert.match(ap, /\$\{same\?'':`<th>\$\{esc\(i18t\('apn_col_rests'\)\)\}<\/th>`\}/);
  assert.match(strip(fnBody(read('js/views/directory.js'), 'dirnRender')), /const reachAny = list\.some/);
  assert.match(strip(fnBody(read('js/views/customers.js'), 'cunRowHtml')), /const org = rec\.orgNo \? i18t\('cun_org', \{ n: rec\.orgNo \}\) : '';/);
});

test('f977 (5) one count', () => {
  assert.match(strip(fnBody(read('js/views/counter.js'), 'cn2Say')), /const s = many \? _cnTn\('cn2_s_you', L\.length, \{ n: L\.length \}\) \+ ': ' \+ all : all;/);
  assert.match(strip(fnBody(read('js/obligations.js'), 'obnRender')), /open = book\.filter\(r => obnTabOf\(r, 'open'\)\)\.length;/);
});

test('f977 (6, 7) the foot follows, one thing when empty — every HARMONY rule waits on the switch', () => {
  const b = strip(block());
  assert.match(b, /html\.lg-new \.apn-card > \.apn-foot, html\.lg-new \.ctf-foot\{margin-top:0\}/);
  assert.match(b, /html\.lg-new \.cun-page\.is-empty :is\(\.apn-bar, thead, \.apn-foot\)\{display:none\}/);
  assert.match(b, /html\.lg-new \.mig-page:not\(:has\(table\)\) #mig-band\{display:none\}/);
  assert.doesNotMatch(b, /!important/);
  const rules = [...b.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(s => s && !/^@media/.test(s));
  assert.ok(rules.length > 10);
  for (const r of rules) assert.match(r.replace(/^@media[^{]*\{\s*/, ''), /^html\.lg-new\b/, r);
});

/* Round 2, the lists: EVEN TILES (the folders, the owner's pick by name), EVEN CARDS (the wall), GROUPED ROWS (Home),
   TWO LINES A ROW (Obligations), FOLD THE QUIET (the agenda), NAME THE CLAUSE (Negotiations), the week ahead at the
   weekend (Home's strip). */
test('f977 (8) even tiles: one builder for both folder views, no dots, a key above', () => {
  const reg = read('js/views/register.js'), cu = read('js/views/customers.js');
  const f = strip(fnBody(reg, 'regFoldersHtml'));
  assert.doesNotMatch(f, /ctf-dot|ctf-tab/, 'no unexplained dots, no faint folder tab');
  assert.match(f, /regTileBig\(r\.needN\)\}\$\{regTileBar\(r\.signed, r\.review, r\.n - r\.signed - r\.review\)\}/);
  assert.match(f, /\$\{regTileKeyHtml\(\)\}<div class="ctf-grid is-tiles">/);
  assert.match(strip(fnBody(cu, 'cunFolderCardHtml')), /regTileBig\(waitN\)/, 'Parties draws the same tile');
  assert.match(reg, /Object\.assign\(window,\{regTileBig,regTileBar,regTileKeyHtml,regFolderCount,/);
  assert.doesNotMatch(strip(fnBody(reg, 'regFoldersHeadHtml')), /ctf-hint/, 'the hint leaves the tab line');
  assert.match(block(), /html\.lg-new \.ctf-card\.is-tile\{[^}]*height:150px/);
});
test('f977 (9) even cards: the party its own line, one footer', () => {
  const ig = read('js/views/intelligence.js');
  assert.match(strip(fnBody(ig, 'igWallCardHtml')), /<span class="igw2-foot is-even"><span class="igw2-who">/);
  const foot = strip(fnBody(ig, 'igWallNlFootHtml'));
  assert.doesNotMatch(foot, /igw2-hint/, 'the how-to line is gone');
  assert.match(foot, /if\(list\.length>shown\.length\) return '';/, 'the paging foot stands alone');
});
test('f977 (10) grouped rows and the week ahead at the weekend', () => {
  /* RETIRED (owner, 10 Nov 2026: "Home page should be removed / deleted"): Home's grouped rows and its week line went
     with Home */
  const cn = read('js/views/counter.js');
  assert.ok(!/function (cn2Html|cn2GroupedHtml|cnWeekOf)\(/.test(cn));
});
test('f977 (12, 13, 15) two lines a row, fold the quiet, name the clause', () => {
  const ob = strip(fnBody(read('js/obligations.js'), 'obnRowHtml'));
  assert.doesNotMatch(ob, /<td class="obn-q">/, 'no middle column');
  assert.match(ob, /<div class="obn-q is-line">/);
  const cal = read('js/views/calendar.js');
  assert.match(cal, /else if\(gap\)\{ gap\.z=z; gap\.n\+\+; \} else gap=\{ a, z, n:1 \};/);
  assert.match(cal, /i18tn\('cal_nl_quiet_wks',gap\.n,\{ n:gap\.n \}\)/);
  assert.match(read('js/views/register.js'), /: `<span class="ngn-nm">\$\{E\(\[q\.s, q\.nm\]\.filter\(Boolean\)\.join\(' '\)\)\}<\/span>`/);
});

/* Round 3, a contract: PAPER LINE HOLDS ALL, SAME CARD TWICE, SAID ONCE, BOX FITS THE WAY. */
test('f977 (16) the paper: the sheet not a band lower on a wide desk, the opening on the headings\' edge, Change links', () => {
  const b = block();
  assert.match(b, /@media \(min-width:1300px\)\{ html\.lg-new #ig-paper-scroll > \.paper-zc-row\{--zc-room:0px\} \}/);
  assert.match(b, /html\.lg-new #ig-paper \.pg-sheet \.doc-surface#ig-canvas p\.px-2\.-mx-2\{margin-left:-8px;margin-right:-8px\}/);
  assert.match(read('js/paperdesk.js'), /\(f\.k === 'signer' \|\| f\.k === 'stream'\) \? _pdT\('pd2_go_change'\)/);
});
test('f977 (17) same card twice: Accept · Reject · Counter on every ask, the rest behind More', () => {
  const ng = read('js/views/negotiation.js');
  assert.match(ng, /if \(nlSame\)\{[\s\S]{0,600}out\.push\(acc, rej\);\s*if \(door\) out\.push\(relabel\(door, i18t\('ng_counter'\)\)\);/);
  assert.match(block(), /html\.lg-new #ig-dock :is\(\.rl-head-review, \[data-rl-head-review\]\)\{display:none\}/);
});
test('f977 (18, 19) said once; the box fits the way; the back line names its place once', () => {
  const pd = read('js/paperdesk.js');
  assert.match(pd, /holds\.length \? `<div class="pd2-sg-card is-held is-togo">/);
  assert.doesNotMatch(pd, /pd2_sg_holds', holds\.length/, 'the list is not said twice');
  assert.doesNotMatch(read('js/views/intelligence.js'), /i18t\('sg2_cap'\)\)\} · <span data-sg-cap-page>/, 'the page count is said once');
  assert.match(read('js/core.js'), /nb\.classList\.toggle\('is-nowhere',none\);/);
  assert.match(read('js/components.js'), /const path = nl && t\.path\.length > 1 && String\(t\.path\[0\]\) === String\(t\.up\) \? t\.path\.slice\(1\) : t\.path;/);
});

/* Round 4, other pages: ONE TOOLBAR (Explorer, the owner's note: only the toolbar), READABLE PREVIEW (Our paper),
   TIGHT SHEET (New agreement). Pulse board and Jambo's agents were "Not now". */
test('f977 (20, 22, 23) one toolbar, a readable preview, a tight sheet', () => {
  const b = block();
  assert.match(b, /html\.lg-new \.ig-brain \.ig-viewbar \.ig-lensrow\{position:static;display:flex\}/, 'the lenses join the one bar');
  assert.match(b, /html\.lg-new \.tpln-zoom\{zoom:\.72\}/);
  const lib = read('js/views/library.js');
  assert.match(lib, /<b class="tpln-name">\$\{_tplEsc\(card\.name\)\}<\/b>/);
  assert.doesNotMatch(lib, /i18t\('tpln_p_src_(book|learned)'\)/, 'no stray source words in the panel');
  assert.match(b, /html\.lg-new #na-root\.na-one \.na-closest \.na-pick\.na-close\{min-height:0\}/);
  assert.match(b, /html\.lg-new #modal-root \.na-why\{color:var\(--color-quiet\);font-weight:400\}/);
});

/* FIX ROUND 1 (the owner's drawn fix list, 9 Nov 2026): each pin fails at the parent */
test('f977 fix 1 · it scrolls where you are: the Contracts wall takes the room left and scrolls inside the sheet', () => {
  const css = read('index.html');
  assert.match(css, /html\.lg-new #ct-place \.ct-page \.ct-wall\{flex:1 1 0%;min-height:0;overflow-y:auto\}/);
  assert.match(css, /html\.lg-new \.tpln \.tpln-sheet\{position:sticky;top:8px;align-self:start\}/, 'Our paper\'s preview stays while the list scrolls');
});
test('f977 fix 3 · the Send letter always stands beside Jambo: from any page it lands on Home\'s paper first', () => {
  const core = read('js/core.js');
  const open = core.match(/async function openShareModal\(c, opts=\{\}\)\{[\s\S]{0,1400}/)[0];
  assert.match(open, /if\(c && !shareBesideJambo\(\) && [\s\S]*?state\.view!=='dashboard'[\s\S]*?window\.roomHomeLand\(c\.id\)/);
  assert.match(open, /for\(let i=0;i<40 && !shareBesideJambo\(\);i\+\+\)/, 'the wait is bounded');
});
test('f977 fix 5 · only the pile with the other side folds; your own piles stand open', () => {
  const ng = read('js/views/negotiation.js');
  assert.match(ng, /const RL_NL_FOLDS = \['with'\];/);
  assert.match(ng, /function rlPileFoldsNl\(b\)\{\s*return [^\n]*RL_NL_FOLDS\.includes\(b\);/);
});
test('f977 fix 6 · the Send letter is the white page: no border, no corner, one hairline at its left', () => {
  const css = read('index.html');
  const rules = [...css.matchAll(/html\.lg-new[^{\n]*#sh-letter\.sh-lt\.is-sap > \.sh-lt-mail\{([^}]*)\}/g)].map(m => m[1]);
  assert.ok(rules.length >= 2);
  for (const r of rules) { assert.doesNotMatch(r, /border:1px solid/); assert.doesNotMatch(r, /border-radius:var\(--radius\)/); }
  assert.ok(rules.some(r => /border-left:1px solid var\(--color-divider\)/.test(r)));
});
test('f977 fix 7 · the Board counts rows in the new look, the number Home says', () => {
  const cn = read('js/views/counter.js');
  assert.match(cn, /const ndRowsN = L => \(typeof newLookOn === 'function' && newLookOn\(\)\) \? \(L \|\| \[\]\)\.length : ndThings\(L\);/);
  assert.match(cn, /function ndOnBoard\(D\)\{[^\n]*n: ndRowsN\(D\.jambo\) \+ ndRowsN\(you\)/);
  assert.match(cn, /\$\{tab\('you', ndRowsN\(B\.you\)\)\}\$\{tab\('jambo', ndRowsN\(B\.jambo\)\)\}/);
});
test('f977 fix 8 · one column per question, its name and ⋯; the foot says only the count', () => {
  const ac = read('js/views/askcolumn.js');
  assert.doesNotMatch(strip(ac), /ac_nl_th_sub/, 'no "k of n read" in the head');
  assert.match(ac, /<span class="ac-th-w">\$\{_acE\(a\.name \|\| a\.question \|\| ''\)\}<\/span><button type="button" class="ac-th-more"/);
  const reg = read('js/views/register.js');
  const foot = reg.match(/function regNlFootHtml\(cs\)\{[\s\S]*?\n\}/)[0];
  assert.doesNotMatch(strip(foot), /reg_nl_foot_ask|reg_nl_foot_std|reg-nl-foot-r/);
  assert.match(reg, /i18t\('rfp_col_sub',\{ k, n, where:/, 'how far it is read is the panel\'s');
});
test('f977 fix · Our paper never prints "Invalid Date"', () => {
  const lib = read('js/views/library.js');
  const src = lib.match(/function tplnDayOf\(v\)\{[\s\S]*?\n\}/)[0];
  const tplnDayOf = Function(src + '; return tplnDayOf;')();
  assert.equal(tplnDayOf('not a day'), null);
  assert.equal(tplnDayOf(''), null);
  assert.equal(tplnDayOf('2026-03-04').getMonth(), 2);
  assert.equal(tplnDayOf(Date.UTC(2026, 4, 5, 12)).getUTCMonth(), 4);
  assert.match(lib, /if \(\/invalid\/i\.test\(mon\)\) mon = '';/);
});

/* FIX ROUND 2 (9 Nov 2026): every paper in pages. At the parent a negotiated contract's paper on Home (Clean, Redline,
   their view) and a template's own page stood as one long sheet: igPaperPaginate asked only for a .pg-sheet */
test('f977 fix 9 · every paper in pages: the negotiated paper on Home and a template\'s page are cut into pages', () => {
  const ig = read('js/views/intelligence.js');
  const fn = ig.match(/function igPaperPaginate\(c\)\{[\s\S]*?\n\}/)[0];
  assert.match(fn, /host\.querySelector\('\.ig-redpaper \.rl-zoom > \.rl-paper'\)/, 'the inner sheet, which carries the page margins');
  const tl = read('js/views/templatelib.js');
  assert.match(tl, /const sh = document\.querySelector\('#tpl-dt \.tpl-dt-sheet > \.blueprint'\); if \(sh && typeof window\.pagesWatch === 'function'\) pagesWatch\(sh, \{ mode: 'work'/);
  /* the clause editor keeps one sheet on purpose: a break re-drawn under the caret would move the words being typed */
  assert.match(read('js/views/negotiation.js'), /if \(sheet\.closest\('\.ce-paperwrap'\)\) return;/);
});

/* THE SEND PAGE IS THE WHITE PAGE (owner, 9 Nov 2026: "The whole page should be white not a card on top of a shaded
   backdrop"). At the parent the page stood on the desk's grey with its head and body inset 12px as a card */
test('f977 fix 6b · the Send page is white edge to edge in the new look: no inset, corner or lift', () => {
  const core = read('js/core.js');
  assert.match(core, /background:\(typeof newLookOn==='function'&&newLookOn\(\)\)\?'var\(--color-surface\)':'var\(--desk-ground, var\(--color-bg\)\)'/);
  const css = read('index.html');
  assert.match(css, /html\.lg-new #modal-root \.modal-in\[data-sh-page\] \.sh-hd\{top:0;margin:0;border:0;border-bottom:1px solid var\(--color-divider\);border-radius:0;box-shadow:none\}/);
  assert.match(css, /html\.lg-new #modal-root \.modal-in\[data-sh-page\] \.sh-lt-grid\{margin:0;border:0;border-radius:0;box-shadow:none;clip-path:none\}/);
});

/* ONE GAP ABOVE EVERY JAMBO BOX (owner, 9 Nov 2026: "why is there a massive gap between the links and the jambo button?").
   At the parent Home's panel kept an empty 16px line (+6) for the typed words' preview under the links, so its gap was
   ~43px where the list panels' was 13 */
test('f977 fix 10 · the empty preview line above the box takes no room, so every panel keeps one gap', () => {
  assert.match(read('index.html'), /html\.lg-new #ig-dock \.igd-foot > \.hb-pre:empty\{display:none\}/);
  assert.match(read('js/views/intelligence.js'), /<div id="igd-pre" class="hb-pre" aria-live="polite"><\/div>/, 'the line is drawn empty until there are words');
});

/* THE HEAD THAT STAYS PUT IS NEVER SEE-THROUGH (owner, 9 Nov 2026, Calendar › Horizon: the rows showed through
   "AGREEMENT … DECISION" as the list scrolled). At the parent the new look painted the sticky ruler transparent */
test('f977 fix 11 · the Horizon head stands on the page\'s white while the rows scroll under it', () => {
  const css = read('index.html');
  const rule = css.match(/html\.lg-new #app-shell \.cal-page\.is-nl \.cal-hz-card \.cal-hz-ruler\{[^}]*\}/)[0];
  assert.match(rule, /background:var\(--color-surface\)/);
  assert.doesNotMatch(rule, /background:transparent/);
  assert.match(read('js/views/calendar.js'), /\.cal-hz-ruler\{display:grid;[^}]*position:sticky;top:0;z-index:2;/, 'the head is the one that stays put');
});
