/* f1016 — DISCOVER IS A PAGE (owner, 12 Nov 2026; drawn first, artifact Ri22tYVLWnB74aVhDjzurp: "The Legora Way", then
   "the flow you described").
   In the new look the Contracts list's head carries a Discover pill where "+ Ask a column" stood; it opens the Reads
   page under its new name, and what is asked there is asked of the contracts that list shows as it is filtered. One
   ask box with one black button; chips that only fill the box; Kept · Packs · Every read; a question opens under its
   own row and the panel shows the paper its words were read from; while Jambo reads the panel shows the paper of the
   contract just read and Stop stands in the box. The old look keeps its own door.
   RED AT THE PARENT (c9aabab): no discoverOpen, no askColAskHere, no dscSlice, no dsc_* words. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const at = src.indexOf('function ' + name + '('); assert.ok(at >= 0, name); const next = src.indexOf('\nfunction ', at + 10); const nextA = src.indexOf('\nasync function ', at + 10);
  const ends = [next, nextA].filter(x => x > 0); return src.slice(at, ends.length ? Math.min(...ends) : src.length); };

const AC = strip(read('js/views/askcolumn.js')), RD = strip(read('js/views/reads.js')), REG = strip(read('js/views/register.js')), PD = strip(read('js/paperdesk.js'));
const I18N = read('js/i18n.js'), CSS = read('index.html');

/* RE-POINTED (owner, 15 Nov 2026: "Remove discover button but leave the door or discover link"): the new look draws no
   Discover button in the list's head; the way in from Contracts is the "discover" link above Jambo's box */
test('f1016 (1) the list\'s head: no Discover button in the new look, the old door in the old look', () => {
  const b = fnBody(AC, 'askColBtnHtml');
  assert.match(b, /newLookOn\(\)\) return '';/, 'the new look draws nothing in the list\'s head');
  assert.match(b, /data-ac-open /, 'the old look keeps "+ Ask a column"');
  assert.match(read('js/copilotacts.js'), /const CA_CHIPS_WALL = \[[^\]]*'reads'/, 'the Contracts page keeps its "discover" link above Jambo\'s box');
  assert.match(AC, /closest\('\[data-ac-discover\]'\)\)\{ e\.preventDefault\(\); if \(typeof window\.discoverOpen === 'function'\) discoverOpen\(\)/, 'the press opens the Discover page');
  assert.match(PD, /const disc = \(!c && !ac && typeof askColDiscoverHtml === 'function' && !\(typeof window\.newLookOn === 'function' && newLookOn\(\)\)\)/, 'no Discover section beside the list in the new look');
});

test('f1016 (2) the ask from Discover is the one read, over the Contracts list as filtered', () => {
  const b = fnBody(AC, 'askColAskHere');
  assert.match(b, /if \(AC\.busy \|\| !askColMay\(\)\) return null;/, 'an editor\'s, one read at a time');
  assert.match(b, /askColPlan\(\{ askId: a \? a\.id : null, size: o\.size \}\)/, 'the first not yet read of the list shown');
  assert.match(b, /askColReadRun\(base, plan\.pick, \{ name, onFirst: o\.onFirst \}\)/, 'the same run');
  assert.match(b, /askColRunEnd\(got, base, named\)/, 'the same end: the record, the stop, the rest offered');
  assert.match(b, /if \(askColIsPortfolio\(question\)\) return \{ portfolio: true \};/, 'a counting question is never read as a column');
  assert.match(b, /if \(!plan \|\| !plan\.pick\.length\) return \{ none: true \};/, 'nothing left to read is said, never a silent press');
  assert.doesNotMatch(b, /regState\(\)|R\.ask\b/, 'it brings no column onto any list');
  assert.match(read('js/views/askcolumn.js'), /Object\.assign\(window, \{ askColAskHere, askColShown,/, 'published');
  assert.match(fnBody(REG, 'regScopeWords'), /regOnCt\(R=>/, 'the list is said in words off the Contracts state');
  /* RE-POINTED (owner, 15 Nov 2026, the new Discover): the page chooses its own contracts (folders ticked on New read);
     the read goes to exactly those while Discover is in front, and its record keeps where and how many */
  assert.match(fnBody(AC, 'askColShown'), /if \(AC\.scope && Array\.isArray\(AC\.scope\.ids\) && typeof state !== 'undefined' && state\.view === 'reads'\) return AC\.scope\.ids\.slice\(\);/);
  assert.match(b, /base\.run\.where = o\.where/); assert.match(b, /base\.run\.of = Number\(o\.of\)/); assert.match(b, /got\.runId = base\.run\.id;/);
});

/* RE-POINTED (owner, 15 Nov 2026, the new Discover): New read has the one box and the one black button; chips only fill */
test('f1016 (3) New read: one box, one black button saying how many, chips that only fill it', () => {
  const n = fnBody(RD, 'dsnNewHtml');
  assert.match(n, /id="dsc-q"/); assert.match(n, /id="dsc-go"/);
  assert.match(n, /p\.unread <= p\.size \? _rdTn\('dsn_read_n', p\.unread\) : _rdT\('dsn_read_first', \{ k: p\.pick \}\)/, 'a cap is a fact: the button says how many');
  assert.doesNotMatch(n, /calls|rd_calls|ac_n_calls/, 'no Jambo cost is said');
  /* RE-POINTED (owner, 15 Nov 2026, build a pack): the pack's chip is drawn by the row's one builder, one pack at a time */
  /* RE-POINTED 22 Nov 2026 (P-42 review): the questions asked before are offered once, in the panel (dslNewHtml), not
     also as chips on the page (one door) */
  assert.match(n, /const packs = dsnPackRowHtml\(\);/); assert.match(fnBody(RD, 'dsnPackRowHtml'), /data-dsc-pack=/); assert.match(fnBody(RD, 'dslNewHtml'), /data-dsc-q=/);
  const wire = RD.slice(RD.indexOf('document._rdnWired = true'));
  assert.match(wire, /closest\('\[data-dsc-pack\]'\)[\s\S]{0,400}?_dsc\.pack = [\s\S]{0,120}?renderReads\(\)/, 'a pack chip fills the box');
  assert.doesNotMatch(wire.slice(wire.indexOf("closest('[data-dsc-pack]')"), wire.indexOf("closest('[data-dsc-open]')")), /askColAskHere|dsnAsk\(/, 'a chip never reads on its own');
  const r = fnBody(RD, 'dsnReadingHtml');
  assert.match(r, /id="dsc-stop"/, 'Stop stands while he reads'); assert.match(r, /id="dsc-carry"/, 'stopped, Carry on reads the rest');
});

/* RE-POINTED (owner, 15 Nov 2026, the new Discover): the panel shows the paper while reading and on the results */
test('f1016 (4) the panel: the paper just read, the chosen answer\'s paper, else the summary', () => {
  const p = fnBody(RD, 'dsnPanelPaint');
  assert.match(p, /if \(_dsn\.screen === 'reading'\)\{[\s\S]*?dscPaperHtml\(askId, cid\)/, 'a read in flight: the paper of the contract just read');
  /* RE-POINTED 19 Nov 2026 (owner: "All 4 should be there"): a result chosen shows EVERY place its answers were read,
     dscPaperAllHtml, which hands a one-question read to dscPaperHtml as before (f1113) */
  /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the result's own panel (dsnResultPanelHtml) carries the paper and its
     two acts as buttons under the title — Open the paper, Redline it — the same two doors */
  assert.match(p, /if \(r && _dsn\.cid\)\{[\s\S]*?dsnResultPanelHtml\(r, _dsn\.cid, focus\)/, 'a result chosen: its own panel');
  const rp = fnBody(RD, 'dsnResultPanelHtml');
  assert.match(rp, /dscPaperAllHtml\(r\.askIds, cid, focus\)/); assert.match(rp, /data-dsc-open=/); assert.match(rp, /data-dsc-redline=/);
  assert.match(fnBody(RD, 'dsnResultsShown'), /_dscRank\(_rdTone\(x\)\)/, 'the risky answers first');
  assert.match(fnBody(RD, 'dscLand'), /askColLandOn\(cid, quote\)/, 'Open clause is the one lander');
  assert.match(fnBody(RD, 'dscLand'), /openRedlineWorkbench\(cid\)/, 'redlining goes through the one door');
  /* RE-POINTED (owner, 15 Nov 2026: Jambo's panel on Discover, the Legora way, f1071): the read's summary is drawn by
     dslReadHtml, which dsnListPanel hands it to; Keep in Discover still stands on it */
  /* RE-POINTED 22 Nov 2026 (P-42 review): Keep is the results' own, on each question's column head (one door) */
  assert.match(fnBody(RD, 'dsnKeepHtml'), /data-dsn-keepq=/, 'Keep stands on the results');
  assert.doesNotMatch(RD.slice(RD.indexOf('const DSC_OPEN_MAX')), /negoFileChange|changes\.push|persist\(/, 'the page files nothing');
});

test('f1016 (5) the quote in its place: its own paragraph, the neighbours, never the whole paper', () => {
  const src = read('js/views/reads.js');
  /* RE-POINTED 19 Nov 2026: the quote is found by ONE finder, dscLocate, which dscSlice and the many-places paper share */
  const at = src.indexOf('function dscLocate(text, quote){'), end = src.indexOf('function dscPaperHtml(');
  assert.ok(at > 0 && end > at);
  const dscSlice = new Function('DSC_SLICE', src.slice(at, end) + '\nreturn dscSlice;')(280);
  const text = 'SUPPLY AGREEMENT\n8.3 The parties shall act in good faith.\n9.4 Nothing in this Agreement limits the liability of either party for loss arising under it.\n9.5 Any notice shall be in writing.';
  const s = dscSlice(text, 'Nothing in this  Agreement limits the liability');
  assert.equal(s.hit, 'Nothing in this Agreement limits the liability');
  assert.equal(s.pre, '9.4 '); assert.equal(s.post, ' of either party for loss arising under it.');
  assert.equal(s.before, '8.3 The parties shall act in good faith.'); assert.equal(s.after, '9.5 Any notice shall be in writing.');
  assert.equal(dscSlice(text, 'words that are not there at all'), null, 'a quote that is not in the wording is not placed');
  const long = 'A. ' + 'word '.repeat(600) + 'the cap is one year of fees. ' + 'more '.repeat(600);
  const l = dscSlice(long, 'the cap is one year of fees');
  assert.ok(l && l.pre.length < 600 && l.post.length < 600, 'a paper with no paragraphs is cut to the sentence');
});

test('f1016 (6) the name and the words, both books; "discover" typed', () => {
  for (const k of ['dsc_btn', 'dsc_ph', 'dsc_ask_n_one', 'dsc_ask_n_other', 'dsc_ask_first', 'dsc_tab_kept', 'dsc_tab_all', 'dsc_tab_paper', 'dsc_tab_reading', 'dsc_l_open', 'dsc_l_redline', 'dsc_say_all_read', 'dsc_say_count'])
    assert.equal(I18N.split(`    ${k}: `).length - 1, 2, k + ' is in both books');
  assert.match(I18N, /nav_reads: 'Discover',/); assert.match(I18N, /nav_reads: 'Upptäck',/);
  assert.match(read('js/copilotacts.js'), /\{ k: 'reads', w: \[[^\]]*'discover'/, '"discover" is a word of the place');
  assert.match(read('js/brainmap.js'), /\['discover', 'discoverOpen', 'see', 0\],\s*\['discoverask', 'askColAskHere', 'see', 1\]/, 'the Brain names both (rule 9)');
  assert.match(read('js/flowmap.js'), /k: 'reads', st: 'book', s: _w\('Discover: /, 'the flow map says it (rule 9e)');
  assert.match(read('js/handbook.js'), /title: \{ en: 'Discover: every question asked, and the next batch'/, 'the Handbook chapter (rule 9d)');
});

test('f1016 (7) a read asked on Discover never draws the Contracts list over the page', () => {
  /* found while re-taking the Handbook's pictures (12 Nov 2026): straight to Discover, the first answers repainted the
     Contracts list into the page's place, and the read went on under it */
  const src = read('js/views/askcolumn.js');
  assert.match(fnBody(strip(src), '_acRegRepaint'), /state\.view === 'reads'\) return;/, 'the list waits while Discover is in front');
  const bare = strip(src).split('\n').filter(l => /\bregRepaint\(\)/.test(l) && !/function _acRegRepaint|^\s*regRepaint\(\);\s*$/.test(l));
  assert.deepEqual(bare.filter(l => !/askColOn\(\) && typeof regRepaint === 'function'\) regRepaint\(\)/.test(l)), [], 'every other repaint of the list goes through _acRegRepaint');
});

test('f1016 (8) the old Discover section beside the list is never drawn in the new look, under a column card either', () => {
  /* the owner's picture, 12 Nov 2026: the old list of past questions came and went on Contracts' panel; askColPanelHtml
     drew it under a column's card, where the paperdesk's own gate did not reach */
  assert.match(fnBody(AC, 'askColDiscoverHtml'), /^function askColDiscoverHtml\(\)\{\s*if \(typeof window\.newLookOn === 'function' && newLookOn\(\)\) return '';/, 'the builder itself stands down in the new look');
});

/* RE-POINTED (15 Nov 2026): both Discover pills on Contracts are gone (the folder panel's with At a Glance, f1056; the list
   head's on the owner's word); Green Spark's styles go with them */
test('f1016 (9) no Discover pill on Contracts, and none of its styles left behind', () => {
  assert.doesNotMatch(REG + AC, /data-ac-discover>/, 'no Discover pill is drawn');
  assert.doesNotMatch(CSS, /ac-btn-dsc|rfp-dsc/, 'its styles are gone');
});

test('f1016 (10) THE SCORECARD: the read table on Discover wears its own head with coloured tiles that filter', () => {
  /* the owner picked "Scorecard" by name, 12 Nov 2026 (drawn first, artifact NN39v3eXJCf9y28T3DWN6o) */
  const head = fnBody(RD, 'rdScHeadHtml');
  assert.match(head, /data-rdt-back[\s\S]*id="rdt-q"[\s\S]*data-rdt-copy[\s\S]*ui-btn-primary ui-btn-sm" data-rdt-again/, 'back, the search box in the head, Copy, then the one black Ask again');
  assert.match(head, /class="rdsc-tile[^`]*data-rdt-tab="\$\{k\}"/, 'every tile is a filter, the tabs\' own door');
  assert.match(head, /if \(!n && k !== 'all' && !on\) return '';/, 'a tile with nothing behind it is not listed');
  assert.match(fnBody(RD, 'rdTableHtml'), /const head = _rdScOn\(\) \? rdScHeadHtml\(r, S, sub\) :/, 'the new look only');
  assert.match(RD, /\$\{tr && _rdScOn\(\) \? '' : readsBandHtml\(\)\}/, 'the old Reads band is gone over the table in the new look');
  assert.match(fnBody(RD, 'rdTableIn'), /tab === 'open'\) return !x\.a\.some\(a => a && a\.checked\)/, 'Not checked yet counts what nobody ticked');
  for (const t of ['amber', 'steel', 'ruby', 'green']) assert.match(CSS, new RegExp(`\\.rdsc-tile\\.is-${t}\\{background:color-mix\\(in srgb,var\\(--st-${t}-bg\\) 60%`), t + ': the view cards\' tone');
  for (const k of ['rd_sc_back', 'rd_sc_all', 'rd_sc_pct', 'rd_sc_ticked', 'rd_sc_of_list_one', 'rd_sc_of_list_other'])
    assert.equal(I18N.split(`    ${k}: `).length - 1, 2, k + ' is in both books');
});
