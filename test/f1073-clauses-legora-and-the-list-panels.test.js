/* f1073 · CLAUSES THE LEGORA WAY, THE REDLINES STRIP, ONE BAND ON APPROVALS, AND THE FOUR LIST PANELS (owner, 16 Nov 2026:
   "These pages still have old Panels: import, negotiations, approvals and signings, my notes. Also, the strip that holds
   changes, notes, deal and ladder buttons is not lined up straight. Finally, remove the cards in the clauses page"; on
   the drawing: "the grey strip on the lines is what Image 3 should look like … as if a patch was applied"; "move the
   start with liability part to the top where clauses review is and remove everything else in between"; "Build the
   legora way").
   (1) Clauses: ONE line — Clause review · the contract · where to start — then the list: no headline, no counts, no
       label; every-clause-read said nothing; the open clause an amber line, no card, no grey; the paper's typeface.
   (2) the Redlines strip: the track holds the pill (height from its padding), the parts centred.
   (3) Approvals: the chosen and hovered rows one grey band inside the row — no bar, no patch.
   (4) the four list panels speak the five parts in the new look, through the page's own presses.
   (5) every word in both books.
   AT THE PARENT every test here fails. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function /); return src.slice(at, nx < 0 ? undefined : at + 10 + nx); };
const H = read('index.html');

test('f1073 (1) Clauses: one line, then the clauses; the open one an amber line', () => {
  const BD = strip(read('js/views/breakdown.js'));
  const mq = fnBody(BD, 'stkMarqueeHtml');
  assert.match(mq, /<p class="stk-lg-top">\$\{E\(\[i18t\('stk_head'\), who\]/, 'Clause review · the contract');
  assert.match(mq, /i18t\('jov5_cl_start', \{ name: stkClauseName\(at0\) \}\)/, 'where to start, on the same line');
  assert.doesNotMatch(mq.slice(0, mq.indexOf('THE SAME HEAD AS REDLINES') > 0 ? mq.indexOf('THE SAME HEAD AS REDLINES') : mq.length), /jov5-glance|jov5HeadHtml/, 'no headline, no counts');
  assert.match(fnBody(BD, 'stkAllPaint'), /else if \(!k\) html = stkNewLookOn\(\) \? '' :/, 'every clause read: said nothing');
  assert.match(H, /html\.lg-new #ig-dock \.pd-th \.doc-th-lbl\{display:none\}/, 'no label over the list');
  assert.match(H, /\.doc-th-lbl ~ \.doc-th-rows\{flex:0 1 auto;min-height:0;margin:0 0 16px;padding:0 16px;border-radius:0;background:none\}/, 'the list on white, 16px in');
  assert.match(H, /\.doc-th-row\.is-open\.pd2-lit\{margin:0;padding:0 0 10px 14px;[^}]*background:none;box-shadow:inset 2px 0 0 var\(--st-amber-dot\)\}/, 'the open clause: an amber line, 14px inside it');
  assert.match(H, /\.doc-th-row \.doc-th-go:hover\{background:none\}/, 'no grey patch under the pointer');
  assert.match(H, /\.doc-th-row\.is-open \.doc-th-plain\{font-family:var\(--font-doc\)/, 'the plain English in the paper\'s typeface');
});

test('f1073 (2) the Redlines strip holds its pill, the parts centred', () => {
  assert.match(H, /#rl-changes-col\.is-five \.rl-seg\{[^}]*align-items:center;[^}]*padding:3px;[^}]*height:auto;min-height:34px;box-sizing:border-box\}/);
  assert.match(H, /#rl-changes-col\.is-five \.rl-seg > button\{flex:1 1 0;[^}]*justify-content:center;[^}]*height:28px;/);
});

test('f1073 (3) Approvals: one grey band inside the row, no bar, no patch', () => {
  assert.match(H, /html\.lg-new #ap-scroll \.apn-table tbody tr\.is-sel td\{background:var\(--surface-2\)\}/);
  assert.match(H, /tr\[data-ap-row\]:not\(\.is-sel\):hover td\{background:var\(--surface-2\)\}/, 'the hovered row: the same band');
  assert.doesNotMatch(H, /#ap-scroll \.apn-table tbody tr[^{]*td:first-child::before\{content:""/, 'no bar and no patch in the margin');
});

test('f1073 (4) the four list panels speak the five parts, by the page\'s own presses', () => {
  const AP = strip(read('js/views/approvalsview.js')), NG = strip(read('js/views/register.js')), MN = strip(read('js/views/mynotes.js')), MG = strip(read('js/views/migration.js'));
  assert.match(fnBody(AP, 'apnLeadHtml'), /if\(typeof jamboOverviewHtml==='function'\) return apnLeadFiveHtml\(r, rule\);/);
  const ap = fnBody(AP, 'apnLeadFiveHtml');
  assert.match(ap, /data-apn-go="clause" data-id=/, 'what the paper says opens the clause'); assert.doesNotMatch(ap, /act:/, 'no button: Approve and Decline stay on the row');
  assert.match(fnBody(NG, 'ngnPanelHtml'), /newLookOn\(\)\) return ngnPanelFiveHtml\(r, rows\);/);
  /* RE-POINTED (P-29, owner's pick 20 Nov 2026): the chosen deal's act (Answer · Send · Remind · Before you sign) is read by ngnActOf, the row's and the panel's one reading */
  const ng = fnBody(NG, 'ngnPanelFiveHtml') + fnBody(NG, 'ngnActOf');
  /* RE-POINTED 22 Nov 2026 (P-29 review): the overview's tabs are a line of links, each data-ngn-gotab="<tab>" (Live always among them) */
  assert.match(ng, /\['live', i18t\('ngn_tab_live'\), live\.length\][\s\S]*data-ngn-gotab="\$\{t\[0\]\}"/, 'the overview links to Live');
  for (const a of ['data-ngn-open=', 'data-ngn-send=', 'data-ngn-chase=']) assert.ok(ng.includes(a), a);
  /* RE-POINTED (owner, 16 Nov 2026: "the side panel information should reflect the contract you have pressed"): the
     panel is the pressed round's own; the page's overview is one press back and its rows choose (data-ngn-pick) */
  assert.match(ng, /<div class="ngn-panel jl-words is-ov" data-ngn-for="\$\{E\(c\.id\)\}">/, 'inside .ngn-panel, where the page listens');
  /* RE-POINTED 21 Nov 2026 (P-29, as drawn): the chosen deal's panel is drawn without cards; its name is the headline */
  assert.match(ng, /<div class="ngn5-t">\$\{E\(c\.name \|\| ''\)\}<\/div>/, 'the pressed round\'s name is the headline');
  assert.ok(ng.includes('data-ngn-pick='), 'a row of the overview chooses, as a row of the list does');
  assert.match(fnBody(MN, 'mnnPanelHtml'), /newLookOn\(\)\) return mnnPanelFiveHtml\(n\);/);
  const mn = fnBody(MN, 'mnnPanelFiveHtml');
  assert.match(mn, /act: \{ label: i18t\(n\.reviewedAt \? 'mn_review_again' : 'mn_mark_reviewed'\), attr: `data-mn-act=/); assert.match(mn, /data-mn-act="delete"/);
  assert.match(fnBody(MG, 'migNlPanelPaint'), /body: five \? migNlPanelFiveHtml\(r, rows, need\) :/);
  const mg = fnBody(MG, 'migNlPanelFiveHtml');
  /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way): the upgraded panel's main act is the
     file's own door (data-mign-go keyed by the row), a parked file answers with the queue's own presses */
  assert.match(mg, /a:`data-mign-go="\$\{E\(key\)\}" data-mign-need="1"`/); assert.match(mg, /data-mig-unsigned="draft"/, 'parked: the queue\'s own presses');
  assert.match(fnBody(MG, 'migNlKindOf'), /r\.q\.status === 'unsigned'/, 'parked: the queue\'s own word');
});

test('f1073 (5) every word in both books', () => {
  const I = read('js/i18n.js'), sv = I.search(/\n {2}sv\s*:\s*\{/), EN = I.slice(0, sv), SV = I.slice(sv);
  const keys = new Set();
  for (const f of ['js/views/approvalsview.js', 'js/views/register.js', 'js/views/mynotes.js', 'js/views/migration.js'])
    for (const m of read(f).matchAll(/['"]((?:apn5|ngn5|mnn5|mign5)_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 30, 'found ' + keys.size);
  const has = (b, k) => new RegExp('\\b' + k + '(?:_one|_other)?:').test(b);
  assert.deepEqual([...keys].filter(k => !has(EN, k) || !has(SV, k)), []);
});
