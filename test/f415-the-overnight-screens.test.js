/* f415 — THE OVERNIGHT RUN: COPILOT, DOCUMENTS, TEMPLATES, HOME, THE PHONE
   (the owner's list, 27 Sep 2026). One claim per item, pinned where it lives;
   the behaviour is driven where a pure function carries it.
   Red at a837d09: every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js'), AI = R('js/ai.js'), API = R('js/api.js'), IG = R('js/views/intelligence.js');
const CV = R('js/views/contract.js'), PB = R('js/playbook.js'), TB = R('js/views/templatebuilder.js');
const I18N = R('js/i18n.js'), IDX = R('index.html');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const fnOf = (src, head) => { const a = src.indexOf(head); return a < 0 ? '' : src.slice(a, src.indexOf('\n}', a)); };

test('f415 (c1) the Requests page sends its shelf as templates, and the route reads them unscoped', () => {
  assert.match(R('js/views/intake.js'), /api\('ai\/template','POST',\{ query:`\$\{r\.title\}\\n\\n\$\{r\.need\}`, templates:cands \}\)/);
  assert.match(SRV, /Array\.isArray\(req\.body && req\.body\.templates\) && req\.body\.templates\.length/);
});

test('f415 (c2) "thirty (30) days" is read, on both readers', () => {
  const a = PB.indexOf('const PB_FIG'), b = PB.indexOf('function pbRangeRead');
  const f = new Function(PB.slice(a, b) + '; return PB_RANGE_READERS;')();
  assert.equal(f.paymentDays('within thirty (30) days of the date of invoice')[1], '30');
  assert.equal(f.paymentDays('Payment terms: net forty-five (45) days')[1], '45');
  assert.equal(f.liabilityMonths('twelve (12) months of fees paid')[1], '12');
  assert.match(R('js/metadata.js'), /window\.pbRangeRead\('paymentDays', t\)/);
});

test('f415 (c4) Copilot’s reading asks for the six terms', () => {
  for (const k of ['volumeRebate', 'rebateTiers', 'rejectionWindowDays', 'exclusivity', 'indemnityCapped', 'terminateForConvenience'])
    assert.match(SRV, new RegExp('        ' + k + ': \\{ type:'), k);
});

test('f415 (c5 c7) a notice is said once, in amber; the stream keeps the line open', () => {
  assert.match(API, /toast\(data\.notice,'warn'\)/);
  assert.match(API, /toast\(final\.notice,'warn'\)/);
  assert.match(AI, /aiStreamRenderer\(\), \{ quiet:true \}\)/);
  assert.match(SRV, /res\.write\(': keep-alive\\n\\n'\)/);
});

test('f415 (c6) Plain English greys with its reason when Copilot is not connected', () => {
  assert.match(CV, /state\.aiConfigured===false&&!docReadHeld\(c\)/);
  assert.ok(inBoth('ct_read_no_ai'));
});

test('f415 (c8 c9 c10) the graph: amended end dates, Copilot’s grouping in the menu, one vocabulary in local mode', () => {
  assert.match(SRV, /function copilotEffExpiryOf\(list\)/);
  assert.match(IG, /const e=_gExpiryDay\(c\); return e&&c\.status!=='Declined'/);
  assert.match(fnOf(IG, 'function igPaintGroupSelect'), /intel\.groupBy==='custom'/);
  assert.match(fnOf(AI, 'async function aiLocalGraph'), /window\.graphWhereIds\(where\)/);
});

test('f415 (c11 c12 c13 c14) the standards tile, X-ray picks, the cover page, justified text', () => {
  assert.match(R('js/triage.js'), /function triagePlaybookNow\(c, p\)/);
  assert.match(CV, /const at=rows\.findIndex\(r=>r&&r\.el&&r\.el\.contains&&r\.el\.contains\(e\.target\)\);/);
  assert.match(CV, /const DOC_READ_FURNITURE='[^']*\[data-doc-design-cover\]'/);
  assert.match(CV, /const DOC_READ_ALIGN=new Set\(\['center','right','justify'\]\);/);
});

test('f415 (c16 c17) repeated passages are all lit; the old widen choice is carried once', () => {
  assert.match(AI, /for\(let k=0;k<nth&&at>=0;k\+\+\) at=flat\.indexOf\(probe, at\+probe\.length\);/);
  assert.match(IG, /nth:k \}\)\) break;/);
  assert.match(fnOf(IG, 'function _igDockPref'), /hati\.v1\.intelWide/);
});

test('f415 (d1 d2 d4 d5 d6 d13 d16 d17) the documents', () => {
  assert.ok(!/\+' \(Draft\)'|:' \(Draft\)'\)/.test(R('js/app.js') + R('js/wizard.js') + R('js/views/library.js')), 'no "(Draft)" in a new name');
  assert.match(CV, /function docSheetSig\(c\)\{/);
  assert.match(R('js/richdoc.js'), /buf\+=ch\.nodeValue\.replace\(\/\[\^\\S\\u00a0\]\+\/g,' '\)/);
  const d = R('js/docx.js'), a = d.indexOf('function _dxFieldName'), b = d.indexOf('function docxRunsHtml');
  const ranges = new Function(d.slice(a, b) + ';return docxPlaceholderRanges;')();
  const inner = '<w:sdt><w:sdtPr><w:alias w:val="Fee"/><w:showingPlcHdr/></w:sdtPr><w:sdtContent><w:r><w:t>[fee]</w:t></w:r></w:sdtContent></w:sdt>';
  const para = '<w:p><w:sdt><w:sdtPr><w:alias w:val="Box"/></w:sdtPr><w:sdtContent><w:r><w:t>The fee is </w:t></w:r>' + inner + '</w:sdtContent></w:sdt></w:p>';
  const r = ranges(para);
  assert.equal(r.length, 1); assert.equal(r[0][2], 'fee', 'the nested box is its own');
  assert.match(R('js/views/register.js'), /max-width:320px;min-width:0">/);
  assert.match(SRV, /"\(lower\(c\.id\) = \? OR lower\(COALESCE\(c\.contract_no,''\)\) = \?\)"/);
  assert.match(R('js/views/register.js'), /REG_BAR_FILTERS\.some\(f=>regFilterActive\(f\.k, st\)\)/);
  assert.match(R('js/views/migration.js'), /if\(lvl!=='high'\|\|was\[k\]==null\|\|was\[k\]===''\) continue;/);
});

test('f415 (t1 t2 t4 t5 t6 t7 t8 t9 t13 t16) the templates', () => {
  assert.match(R('js/triage.js'), /mintTemplateObligations\(c\) && typeof persist === 'function'/);
  assert.match(R('js/templatefields.js'), /function templateValueType\(t\)\{/);
  assert.ok(!/rides every contract drawn from it/.test(I18N));
  assert.match(R('js/app.js'), /window\.designStepOpen && designStepOpen\(\)/);
  assert.ok(inBoth('ds_leave_title') && inBoth('ds_leave_body') && inBoth('ds_leave_go'));
  assert.match(TB, /intent: \(_tb\.intent && _tb\.intent\[sec\.k\]\) \|\| '',/);
  assert.match(TB, /const find = category => secs\.find\(x => x\.text && \(\(x\.t && x\.t\.category === category\) \|\| named\(x, category\)\)\)/);
  assert.match(TB, /tbRailFits\(\) \? '' : `<button id="tb-addfield-strip"/);
  assert.match(R('js/views/designstep.js'), /toast\(w, 'warn'\)/);
  assert.match(I18N, /tf_side_none: 'Neither — no one pays'/);
  assert.match(R('js/views/settings.js'), /\[data-cl-del\]'\)\.forEach\(b=>b\.addEventListener\('click',\(\)=>\{ stdRemoveClause\(/);
});

test('f415 (h2 h4 h6 h7 h8 h9 h10 h11 h12 h13 h14) Home and the pages around it', () => {
  const OB = R('js/obligations.js');
  assert.match(OB, /if\(n\) logAudit\(c,'Obligation',`Added \$\{n\} obligation/);
  assert.match(I18N, /home_dd_sorted: 'anyone waiting on you first'/);
  assert.match(IDX, /\.hm-dk-tag\{[^}]*min-width:11ch/);
  assert.match(R('js/views/calendar.js'), /\.cal-hz-bar\{[^}]*min-width:8px/);
  assert.match(IDX, /html\.dark \.py-chip-inv\{ background:var\(--st-steel-bg\); \}/);
  assert.match(R('js/views/calendar.js'), /\.cal-seg a\.on \.c,\.cal-seg span\.on \.c,\.cal-seg button\.on \.c\{color:#fff;opacity:1\}/);
  assert.match(IDX, /\.obw-f select\{[^}]*border:1px solid var\(--field-line\)/);
  assert.ok(!/set_role_legal: 'Editor — edit &amp; sign'/.test(I18N));
  assert.match(SRV, /toLocaleDateString\(L === 'sv' \? 'sv-SE' : 'en-GB'/);
  assert.match(SRV, /if \(c && !c\.owner\) c\.owner = \{ id: u\.id, name: u\.name \}/);
  assert.match(R('js/desk.js'), /function deskWaitDays\(st\)\{/);
  for (const f of ['js/views/home.js', 'js/app.js', 'js/mobile-screens.js'])
    assert.match(R(f), /deskWaitDays\(/, f + ' prints the one count');
  assert.match(OB, /const mw = money \? obMoneyWords\(ch, c\) : null;/);
});

test('f415 (p2 p3 p4 p5 p7 p8 p10) the phone', () => {
  assert.match(IDX, /@media \(max-width:639px\)\{ \.ce-grid, \.field-grid\{/);
  const MS = R('js/mobile-screens.js');
  assert.match(MS, /id==='payterms'&&k\.sub\?/);
  assert.match(R('js/mobile-contract.js'), /window\.contractReadiness\(mc\)/);
  assert.match(R('js/app.js'), /else if\(view==='team'\)\{ if\(!\(window\.mPhone && window\.mAppActive && mPhone\(\) && mAppActive\(\)\)\) renderTeam\(\); \}/);
  assert.match(R('js/mobile-portal.js'), /\.pw-page \.rl-q-row\{ min-height:48px!important;/);
  assert.match(MS, /window\.regFiltersAtRest\(R\)/);
  assert.match(MS, /\(D\.myStaleDesks\|\|\[\]\)\.forEach/);
});
