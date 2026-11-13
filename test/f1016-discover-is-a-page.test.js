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

test('f1016 (1) the list\'s head: Discover in the new look, the old door in the old look', () => {
  const b = fnBody(AC, 'askColBtnHtml');
  assert.match(b, /newLookOn\(\)\)\s*return `<button[^`]*data-ac-discover[^`]*dsc_btn/, 'the new look draws the Discover pill');
  assert.match(b, /data-ac-open /, 'the old look keeps "+ Ask a column"');
  assert.ok(b.indexOf('data-ac-discover') < b.indexOf('data-ac-open '), 'the look is asked first');
  assert.match(AC, /closest\('\[data-ac-discover\]'\)\)\{ e\.preventDefault\(\); if \(typeof window\.discoverOpen === 'function'\) discoverOpen\(\)/, 'the press opens the Discover page');
  assert.match(PD, /const disc = \(!c && !ac && typeof askColDiscoverHtml === 'function' && !\(typeof window\.newLookOn === 'function' && newLookOn\(\)\)\)/, 'no Discover section beside the list in the new look');
  assert.match(CSS, /\.ac-btn\.ac-btn-dsc::before\{content:none\}/, 'the pill carries no "+"');
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
  assert.match(fnBody(RD, 'dscScope'), /askColShown\(\)[\s\S]*regScopeWords\(\)/, 'the page asks the list and says which');
});

test('f1016 (3) the page: one box, one black button, chips that only fill it, three tabs', () => {
  const ask = fnBody(RD, 'dscAskHtml'), btn = fnBody(RD, 'dscAskBtnHtml'), chips = fnBody(RD, 'dscChipsHtml');
  assert.match(ask, /id="dsc-q"/); assert.match(btn, /id="dsc-go"/);
  assert.match(btn, /if \(A && A\.busy\) return `<button[^`]*id="dsc-stop"/, 'Stop stands in the box while he reads');
  assert.match(btn, /id="dsc-carry"/, 'stopped, the same place reads the rest');
  assert.match(btn, /p\.unread <= p\.size \? _rdTn\('dsc_ask_n', p\.unread\) : _rdT\('dsc_ask_first', \{ k: p\.pick, n: p\.unread \}\)/, 'a cap is a fact: the button says how many');
  assert.doesNotMatch(btn + ask + chips, /calls|rd_calls|ac_n_calls/, 'no Jambo cost is said');
  assert.match(chips, /data-dsc-pack=/); assert.match(chips, /data-dsc-q=/);
  const wire = RD.slice(RD.indexOf('document._rdnWired = true'));
  assert.match(wire, /closest\('\[data-dsc-pack\]'\)[\s\S]{0,400}?_dsc\.pack = [\s\S]{0,120}?renderReads\(\)/, 'a pack chip fills the box');
  assert.doesNotMatch(wire.slice(wire.indexOf("closest('[data-dsc-pack]')"), wire.indexOf("closest('[data-dsc-go]')")), /askColAskHere|dscAsk\(/, 'a chip never reads on its own');
  const page = fnBody(RD, 'rdnRender');
  assert.match(page, /tab\('kept', _rdT\('dsc_tab_kept'\), kept\.length\)\}\$\{tab\('packs', _rdT\('rd_tab_packs'\), packs\.length\)\}\$\{tab\('all', _rdT\('dsc_tab_all'\), rows\.length\)\}/);
  assert.match(page, /listRowsSwapHtml\(\{ page: '#rd-page\.dsc-page'/, 'a tab press redraws only the rows');
});

test('f1016 (4) a question opens under its row; the panel has three faces', () => {
  const p = fnBody(RD, 'dscPanelPaint');
  assert.match(p, /if \(b\)\{[\s\S]*?dscPaperHtml\(b\.askId, cid\)/, 'a read in flight: the paper of the contract just read');
  assert.match(p, /if \(r && _dsc\.pick\)\{[\s\S]*?dscPaperHtml\(r\.askIds\[0\], _dsc\.pick\)[\s\S]*?jlLinks: dscPaperLinksHtml/, 'an answer chosen: its paper, the two links above Jambo\'s box');
  assert.match(p, /rdnPanelPaint\(rows\);\s*\}$/, 'closed: the question\'s summary');
  assert.match(fnBody(RD, 'dscOpenList'), /sort\(\(x, y\) => _dscRank\(x\.t\) - _dscRank\(y\.t\)\)/, 'the risky answers first');
  assert.match(fnBody(RD, 'dscLand'), /askColLandOn\(cid, quote\)/, 'Open clause is the one lander');
  assert.match(fnBody(RD, 'dscLand'), /openRedlineWorkbench\(cid\)/, 'redlining goes through the one door');
  assert.match(fnBody(RD, 'rdnPanelPaint'), /data-dsc-keep=/, 'Keep in Discover stands on the question\'s summary');
  assert.doesNotMatch(RD.slice(RD.indexOf('const DSC_OPEN_MAX')), /negoFileChange|changes\.push|persist\(/, 'the page files nothing');
});

test('f1016 (5) the quote in its place: its own paragraph, the neighbours, never the whole paper', () => {
  const src = read('js/views/reads.js');
  const at = src.indexOf('function dscSlice(text, quote){'), end = src.indexOf('function dscPaperHtml(');
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
