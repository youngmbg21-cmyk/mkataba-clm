'use strict';
/* f1139 — PARTIES AS DRAWN (P-25, the owner's pick 20 Nov 2026: "L+S and ring"; rebuilt to the drawing 21 Nov 2026)
   1 · Under each party's name, the words that name it on the paper ("between … and …"), verbatim from the paper's own
       wording, the nearest such words; a paper that never names the party so gives none — never an invented line.
   2 · On paper says its currency in the head ("On paper (KES)") and the cells the figure alone; the column is not drawn
       for a reader without money rights.
   3 · The Waiting on you worklist: Jambo's finds carry the paper's own words of the first duty with its § and how many
       more; details are "Fill in the details of …"; a renewal is "Decide the renewal"; the kinds are soft badges (Details
       grey, Jambo's finds violet, Late red).
   4 · The panel, no cards and no money: two figures and the ring in its middle, Open on Contracts with Edit; on All the
       party's own facts, on Waiting on you what waits with its act (and no "needs your attention" link); a timeline;
       contacts with + Add a contact under them.
   5 · The head: + Add a party (the one door to a new agreement), the ask box with Jambo's mark; Enter on a question asks
       Jambo (jlAsk), a party's name only narrows the rows.
   At the parent none of this holds, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const CU = read('js/views/customers.js');
const CSS = read('index.html');

test('f1139 (1) the paper\'s own words name the party, verbatim; none where the paper has none', () => {
  const sb = {}; vm.createContext(sb);
  vm.runInContext(fnBody(CU, 'cunWordsIn') + '\nthis.f = cunWordsIn;', sb);
  const text = 'SUPPLY AGREEMENT Between Highland Corporate Ltd and Saw Sawa LLC This agreement is made between Highland Corporate Ltd (the "Buyer") and Saw Sawa LLC (the "Supplier").';
  assert.equal(sb.f(text, 'Saw Sawa LLC'), 'Between Highland Corporate Ltd and Saw Sawa LLC', 'the nearest words, as the paper writes them');
  assert.equal(sb.f(text, 'saw sawa llc'), 'Between Highland Corporate Ltd and Saw Sawa LLC', 'the name matched whatever its case');
  assert.equal(sb.f(text, 'Topeca LLC'), '', 'a party the paper does not name gets nothing');
  assert.equal(sb.f('This lease is between the Landlord and the Tenant.', 'Jengo Properties'), '', 'no invented line');
  const row = strip(fnBody(CU, 'cunRowHtml'));
  assert.match(row, /const pw = cunPaperWords\(v\);/);
  assert.match(row, /class="cun-pq"/);
  assert.match(CSS, /html\.lg-new \.cun-page \.cun-pq\{[^}]*font-family:var\(--font-doc\)[^}]*text-overflow:ellipsis/);
});

test('f1139 (2) On paper: the currency in the head, the figure alone in the cell, the column gone without money rights', () => {
  /* RE-POINTED 22 Nov 2026 (P-25 review): one form down the column — the house shortener keeps both decimals ({ even: true }) */
  const sb = { jxCurrency: () => 'KES' }; vm.createContext(sb);
  vm.runInContext(read('js/jurisdiction.js').match(/const fmtMoneyShortIn = [\s\S]*?return `\$\{c\} ` \+ n; \};/)[0] + '\n' + fnBody(CU, 'cunPaperSay') + '\nthis.f = cunPaperSay; this.g = fmtMoneyShortIn;', sb);
  assert.equal(sb.f(10500000), '10.50M');
  assert.equal(sb.f(12000000), '12.00M', '"12.00M" beside "10.50M", as drawn');
  assert.equal(sb.g(12000000, 'KES'), 'KES 12M', 'a sentence or a tile keeps the short form');
  const cols = strip(fnBody(CU, 'cunCols'));
  assert.match(cols, /k === 'paper' && cur \? i18t\('cun_c_paper_in', \{ cur \}\)/);
  assert.match(read('js/i18n.js'), /cun_c_paper_in: "On paper \(\{cur\}\)"/);
  /* RE-POINTED 22 Nov 2026 (P-25 review): cunKeys also leaves out Waiting on you where nothing waits anywhere (noWork) */
  assert.match(CU, /function cunKeys\(noWork\)\{ return CUN_KEYS\.filter\(k => \(k !== 'paper' \|\| !\(typeof canViewValues === 'function' && !canViewValues\(\)\)\) && \(k !== 'waiting' \|\| !noWork\)\); \}/);
});

test('f1139 (3) the worklist as drawn: the paper\'s words under Jambo\'s finds, the words of each kind, its soft badge', () => {
  const sb = { obReviewWaiting: () => [{ quote: 'unless earlier terminated by either Party giving thirty (30) days’ notice', clause: '3' }, { quote: 'x', clause: '4' }, { clause: '5' }, {}],
    i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n, v) => k + ':' + n + JSON.stringify(v) };
  vm.createContext(sb);
  vm.runInContext(fnBody(CU, 'cunPromiseQuote') + '\nthis.f = cunPromiseQuote;', sb);
  const q = sb.f({ id: 'A' });
  assert.equal(q.q, 'unless earlier terminated by either Party giving thirty (30) days’ notice');
  assert.equal(q.at, 'cun_q_sec_more:3{"s":"3","n":3}');
  const verb = strip(fnBody(CU, 'cunWaitVerb'));
  assert.match(verb, /k === 'details' \? \(short \|\| !nm \? i18t\('cun_w_details_all'\) : i18t\('cun_w_details_of', \{ name: nm \}\)\)/);
  assert.match(verb, /k === 'renewal' \? i18t\('cun_w_renew'\)/);
  assert.match(verb, /k === 'promises' \? i18tn\('cun_w_whose', n, \{ n \}\)/);
  assert.match(CU, /details: \['cun_k_details', 'gray'\], promises: \['cun_k_jambo', 'violet'\]/);
  const wr = strip(fnBody(CU, 'cunWaitRowHtml'));
  assert.match(wr, /cunPromiseQuote\(x\.c\)/); assert.match(wr, /class="cun-badge is-\$\{kd\.tone\}"/); assert.match(wr, /cunGoWord\(x\)/);
  assert.match(read('js/i18n.js'), /cun_k_jambo: "Jambo’s finds"/);
});

test('f1139 (4) the panel as drawn: no cards, no money; facts on All, what waits on Waiting on you; timeline; contacts', () => {
  const p = strip(fnBody(CU, 'cunPanelFiveHtml'));
  assert.match(p, /if \(wait\)\{[\s\S]*key: 'waits'[\s\S]*\} else \{[\s\S]*key: 'facts'/, 'what waits on one tab, the facts on the other');
  assert.match(p, /link: \{ label: cunGoWord\(x\), attr: `data-cu-need=/);
  assert.doesNotMatch(p, /data-cun-attn|fmtMoney|cunMoney|fxHome|\.value\b/, 'no attention link, no money');
  assert.match(p, /class="cun5-figs"/); assert.match(p, /cun_p_not_signed/);
  assert.match(p, /foot: mayAdd \? \{ label: i18t\('cun_p_add_ct'\), attr: `data-cun-add-ct=/);
  assert.match(p, /avatarTone: tone/);
  /* RE-POINTED 22 Nov 2026 (P-25 review): since People joined the batch the panel reads one tone for both pages
     (avatarTone, Parties; avaTone, People) */
  assert.match(read('js/components.js'), /const _avaT = o\.avatarTone && JOV5_TONES\[o\.avatarTone\] \? o\.avatarTone : /);
  assert.match(CSS, /html\.lg-new \.cun5 \.jov5-group,html\.lg-new \.cun5 \.jov5-group\.is-form\{background:none;box-shadow:none/, 'no cards');
  const tl = strip(fnBody(CU, 'cunTimelineRows'));
  assert.match(tl, /tone: 'green'/); assert.match(tl, /tone: 'amber'/); assert.match(tl, /tone: 'red'/); assert.match(tl, /tone: 'hollow'/);
});

test('f1139 (5) the head: + Add a party is the one door to a new agreement; the ask box asks Jambo', () => {
  assert.match(CU, /data-cun-add\]'\); if \(add\)\{ e\.preventDefault\(\); if \(cunAddMay\(\)\) openNewAgreement\(\{ door: true \}\);/);
  assert.match(strip(fnBody(CU, 'cunAddMay')), /canEdit/);
  const ask = strip(fnBody(CU, 'cunAskGo'));
  assert.match(ask, /if \(names \|\| typeof jlAsk !== 'function'\) return false;/);
  assert.match(ask, /jlAsk\(t, \{ typed: true \}\)/);
  assert.match(CU, /icon\('mkSpark', 'cun-spark', 0\)/);
  assert.match(read('js/i18n.js'), /cun_ask_ph: "Ask about a party: “who do we owe the most to\?”"/);
});

/* (6) THE REVIEW'S DIFFERENCES (P-25/P-26 review, 22 Nov 2026), each red at the parent: the chips of My notes, Parties
   and People are ONE rule (dashed, the chosen solid, never a fill); a grey "—" where nothing waits; no foot line; no
   "Waiting on you" column for a reader for whom nothing waits anywhere; the Waiting on you timeline started · late ·
   the next step; People's badges the house's soft badge */
test('f1139 (6) the review\'s differences: one chip rule, the dash, no foot, the timeline, the badges', () => {
  assert.match(CSS, /html\.lg-new :is\(\.mnn-page,\.cun-page,\.dirn-page\) \.apn-bar \.apn-tab\.is-chip\{[^}]*border:1px dashed var\(--color-neutral-300\);background:none/);
  assert.match(CSS, /html\.lg-new :is\(\.mnn-page,\.cun-page,\.dirn-page\) \.apn-bar \.apn-tab\.is-chip\.is-on\{border-style:solid;[^}]*background:none/);
  assert.doesNotMatch(CSS, /html\.lg-new \.mnn-page \.apn-bar \.apn-tab\.is-chip\{/, 'one rule, not a copy per page');
  const row = strip(fnBody(CU, 'cunRowHtml'));
  assert.match(row, /\$\{ws\.late \? ` · \$\{esc\(i18t\('cun_late'\)\)\}` : ''\}<\/span>` : '<span class="apn-none-c">—<\/span>'\}<\/td>`/);
  assert.doesNotMatch(strip(fnBody(CU, 'cunRender')), /apn-foot|cun_foot/, 'no foot line');
  assert.match(strip(fnBody(CU, 'cunNoWork')), /return !\(list \|\| \[\]\)\.some\(v => \(v\.needs \|\| \[\]\)\.some\(x => x && x\.it\)\);/);
  assert.match(CU, /\(k !== 'waiting' \|\| !noWork\)/);
  const tl = strip(fnBody(CU, 'cunTimelineRows'));
  assert.match(tl, /\} else if \(wait\)\{[\s\S]*c\.createdAt[\s\S]*tone: 'green', t: i18t\('cun_tl_started'/);
  assert.match(tl, /tone: 'hollow', t: w\.it\.kind === 'details' \? i18t\('cun_tl_next_details'\)/);
  assert.match(tl, /past\.slice\(-3\)\.concat\(now\.slice\(0, 3\), late\.slice\(0, 3\), next\.slice\(0, 2\), ahead\.slice\(0, 2\)\)/);
  const I = read('js/i18n.js');
  assert.match(I, /cun_tl_started: "\{name\} started"/); assert.match(I, /cun_tl_started: "\{name\} påbörjat"/);
  assert.match(I, /cun_tl_next_details: "Details still to fill in"/); assert.match(I, /cun_tl_next_details: "Uppgifter kvar att fylla i"/);
  const D = read('js/views/directory.js');
  assert.doesNotMatch(D, /class="reg-badge|class="apn-st/, 'People wears the house soft badge');
  assert.match(fnBody(D, 'dirnRowHtml'), /<span class="cun-badge is-\$\{tone\}"/);
  assert.match(CSS, /html\.lg-new \.cun-badge\{[^}]*border-radius:6px[^}]*font-size:var\(--t-label\)/);
});
