/* f1074 · JAMBO'S PANEL ON DISCOVER, THE LEGORA WAY (owner, 15 Nov 2026: "Discover will be one of the centre pieces
   of the platform. Make it stand out but not too much. Refine with a bit of color"; "The blueish purple color is a no
   go … make the panels world class"; "New read in legora is disappointing" → redrawn; "If its 50 contracts what will
   the panel look like" → drawn; "Now build the Legora way for discover").
   (1) the read chosen: its question as the headline; ONE sentence counted from the read's own answers (how many need a
       look, how many are fine or within the rule, how many are not read yet with the page's own Read-the-rest press);
       a bar in the answers' own colours; each answer with the words it was read from, a press opening the results on
       that answer's tile; the long black Open the results.
   (2) nothing read yet: what Discover is for, an example answer marked in yellow, the four steps, New read (the page's
       own door).
   (3) New read: what will be read by name (five, then "and N more" with the parties), what was asked here before and
       how far, what comes back, three questions one contract can answer (a press fills the box and reads nothing).
   (4) nothing is spent, nothing boxed, no purple of its own; colour only through tokens.
   (5) every word in both books.
   AT THE PARENT every test here fails: none of it exists. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RD = strip(read('js/views/reads.js')), I18N = read('js/i18n.js');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function /); return src.slice(at, nx < 0 ? undefined : at + 10 + nx); };

/* the panel's block, run on its own with the page's readings stood in */
function panel(stub){
  const a = RD.indexOf('const DSL_DOCS_SHOWN'), b = RD.indexOf('function dsnListHtml(');
  assert.ok(a >= 0 && b > a, 'the Legora panel block exists');
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const words = { dsl_need_other: '{n} need a look.', dsl_need_one: '{n} needs a look.', dsl_need_none: 'Nothing needs a look.', dsl_fine: '{k} of the {n} read are fine.',
    dsl_fine_rule: '{k} of the {n} read are within your rule.', dsl_left_other: '{n} are not read yet:', dsl_read_them: 'read them', dsn_open_results: 'Open the results',
    dsl_more_other: 'and {n} more', dsl_parties_other: '{n} parties in all', dsl_new_t_other: '{n} contracts, each read once', dsl_new_all_other: 'All {n} are read on this press.',
    dsl_new_first_other: 'The first {n} are read on this press.', dsl_new_wait_other: '{n} wait for your next.', dsl_will_read: 'What will be read · {where}', rdn_of: '{k} of {n}' };
  const T = (k, v) => String(words[k] || k).replace(/\{(\w+)\}/g, (m, x) => (v && v[x] != null) ? v[x] : m);
  const env = Object.assign({ _rdE: E, _rdT: T, _rdTn: (k, n, v) => T(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v || {})), rdWhen: () => '15 Nov',
    _rdName: c => c.name, _dscMay: () => true, dsnRunOf: r => r.of, dsnRunName: r => r.name, dsnRunQuestion: r => r.q, askColClauseNo: a => (String(a.clause || '').match(/^\d+/) || [''])[0],
    dsnYesMarked: a => E(a.quote), dsnRunLeft: r => Math.max(0, (r.of || 0) - (r.n || 0)), _rdTone: a => a.tone, AC: { asks: {} }, _dsc: {}, _dsn: {}, _rd: { rows: [] }, rdnAnswers: () => null, rdnFailed: () => false, _dsnFolderName: f => f, getContract: () => null,
    dsnRun: id => ({ id }), _rdKey: q => String(q || '').trim().toLowerCase() }, stub || {});
  const names = Object.keys(env);
  return new Function(...names, RD.slice(a, b) + '; return { dslReadHtml, dslEmptyHtml, dslNewHtml };')(...names.map(k => env[k]));
}
const row = (id, party, answer, tone, quote) => ({ id, c: { id, name: id, counterparty: party }, a: [{ found: true, answer, tone, quote, clause: '9 · Liability' }] });

/* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the read chosen — badges, the question in the body's type, where · by ·
   when; then, parted by hairlines, the one counted sentence (with the page's own Read-the-rest press) and the ring with
   the answers as bars; "The one to look at" as a heading, the contract named, its words quoted, its §; Open the results a
   small black button. Keep is the results' own (one door); Delete question stays here, quiet. */
test('f1074 (1) the read chosen: badges, its question, one counted sentence, a ring and bars, the one to look at', () => {
  const rows = [row('a', 'Equity Bank', 'Not capped', 'ruby', 'Nothing limits the liability.'), row('b', 'Siginon', '12 months', 'green', 'shall not exceed the fees'), row('c', 'Kenafric', '12 months', 'green', 'shall not exceed the fees')];
  const G = [{ k: 'g:not capped', l: 'Not capped', n: 1, c: 'ruby', ids: ['a'] }, { k: 'g:12 months', l: '12 months', n: 2, c: 'green', ids: ['b', 'c'] }];
  const P = panel({ dsnRunRows: () => rows, dsnGroups: () => G, dsnRunWhere: () => 'Procurement', AC: { asks: { k1: { rule: 'one year of fees' } } } });
  const h = P.dslReadHtml({ id: 'r1', askIds: ['k1'], n: 3, of: 5, name: 'Liability cap', q: 'Is our liability capped, and at what?', by: 'Amina' });
  assert.match(h, /^<div class="dsl dsl6"><div class="dsl-hd"><div class="dsl-tags"><span class="apn-st is-amber">/, 'no cards: badges first');
  assert.match(h, /<h3 class="dsl-title">Is our liability capped, and at what\?<\/h3>/, 'the question is the headline');
  assert.match(h, /<b class="is-ruby">1 needs a look\.<\/b> 2 of the 3 read are within your rule\. 2 are not read yet: <button type="button" class="dsl-a" data-dsn-more="r1">read them<\/button>/, 'one counted sentence, with the page\'s own Read-the-rest press');
  assert.match(h, /<svg class="dsn-ring is-amber"[\s\S]*?>3\/5<\/text>/, 'a ring of found against chosen');
  assert.match(h, /data-dsn-gopen="r1" data-dsn-gtab="g:not capped"[^>]*><span class="dsl-bl">Not capped<\/span><u aria-hidden="true"><i class="is-ruby" style="width:50%"><\/i><\/u><b>1<\/b>/, 'each answer a bar, opening the results on it');
  assert.match(h, /<p class="dsl-h">dsl_lookone<\/p><button type="button" class="dsl-look1"[^>]*><b>a<\/b> · <span class="dsl-lq">“Nothing limits the liability\.”<\/span> <span class="dsl-ls">§ 9<\/span><\/button>/, 'the one to look at, named, quoted, its §');
  assert.match(h, /<button type="button" class="dsl-go is-small" data-dsn-open="r1">Open the results<\/button>/, 'the small black button');
  assert.match(h, /data-dsn-del="r1"/); assert.doesNotMatch(h, /data-dsn-keep=/, 'Keep is the results\' own');
  const none = P.dslReadHtml({ id: 'r2', askIds: ['k2'], n: 3, of: 3, name: 'X', q: 'Q?' });
  assert.match(none, /<b class="is-ruby">1 needs a look\.<\/b> 2 of the 3 read are fine\./, 'no rule: fine, not "within your rule"'); assert.doesNotMatch(none, /not read yet/, 'nothing left, nothing said');
  const loading = panel({ dsnRunRows: () => null, dsnGroups: () => [], dsnRunWhere: () => '' }).dslReadHtml({ id: 'r3', askIds: ['k'], n: 1, of: 1, name: 'X', q: 'Q?' });
  assert.match(loading, /dsc_loading/, 'answers still loading: said, never guessed');
  /* 22 Nov 2026 (owner: "the side panel says fetching the answers but nothing is happening"): once the asking has given up,
     the panel says so and offers Try again — never "Fetching…" for ever */
  const failed = panel({ dsnRunRows: () => null, dsnGroups: () => [], dsnRunWhere: () => '', rdnFailed: () => true }).dslReadHtml({ id: 'r3', askIds: ['k', 'k2'], n: 1, of: 1, name: 'X', q: 'Q?' });
  assert.doesNotMatch(failed, /dsc_loading/, 'no "Fetching" once it has given up');
  assert.match(failed, /dsc_load_failed <button type="button" class="dsl-a" data-dsn-refetch="k,k2">act_load_retry<\/button>/, 'said, with Try again for the read\'s questions');
  /* stopped (as drawn): "Stopped · N left", the ring of what was read, and "read them" is the stop's own carry */
  const st = P.dslReadHtml({ id: 'r1', askIds: ['k1'], n: 3, of: 5, name: 'Liability cap', q: 'Q?' }, { stopped: true, left: 2 });
  assert.match(st, /dsn_stopped_left_other/); assert.match(st, />3\/5<\/text>/); assert.match(st, /data-dsn-carry>read them/);
  assert.doesNotMatch(st, /data-dsn-open=|dsl_lookone/, 'stopped: no Open the results, no one to look at (as drawn)');
});

test('f1074 (2) nothing read yet: what it is for, an example marked in yellow, the steps, the page\'s own New read', () => {
  const h = panel().dslEmptyHtml();
  assert.match(h, /dsl_none_t[\s\S]*dsl_none_s/); assert.match(h, /<mark class="dsn-yes">dsl_eg_mark<\/mark>/, 'the words found, in Discover\'s own yellow');
  assert.match(h, /dsl_steps/); assert.match(h, /<button type="button" class="dsl-go is-small" data-dsn-new>dsn_new<\/button>/);
  assert.match(RD, /t\.closest\('#dsn-new, \[data-dsn-new\]'\)/, 'one door: the panel\'s New read is the page\'s');
});

/* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): New read's panel — what this press reads, counted as the button counts
   (dsnPlan: what was read before is said); three contracts by name with their party, then "and N more" and the
   parties; asked here before as the questions themselves, each once; questions one contract can answer. "What comes
   back" is the empty list's own example (dslEmptyHtml), not repeated here. */
test('f1074 (3) New read: the contracts by name, asked here before, questions one contract can answer', () => {
  const cs = Array.from({ length: 50 }, (_, i) => ({ id: 'c' + i, name: 'Supply ' + i, counterparty: 'P' + (i % 20) }));
  const by = Object.fromEntries(cs.map(c => [c.id, c]));
  const P = panel({ dsnChosen: () => ({ ids: cs.map(c => c.id), where: ['proc'] }), dsnPlan: ids => ({ size: 100, unread: ids.length, pick: ids.length }), getContract: id => by[id],
    _rd: { rows: [{ q: 'Is liability capped?', name: 'Liability cap', askIds: ['k1'], by: 'Amina Otieno' }, { q: 'Is liability capped?', name: 'Cap', askIds: ['k9'] }] }, rdnAnswers: () => ({ c0: { found: true }, c1: { found: true }, c2: { found: true } }), _dsnFolderName: () => 'Procurement' });
  const h = P.dslNewHtml();
  assert.match(h, /<h3 class="dsl-title is-sans">50 contracts, each read once<\/h3>/);
  assert.match(h, /All 50 are read on this press\./);
  assert.match(h, /What will be read · Procurement/);
  assert.equal((h.match(/class="dsl-doc"/g) || []).length, 3, 'three by name');
  assert.match(h, /<b>Supply 0 · P0<\/b>/, 'each with its party');
  assert.match(h, /data-dsl-all aria-expanded="false">and 47 more<\/button><span>20 parties in all<\/span>/, 'then how many more, and the parties');
  assert.match(h, /data-dsc-q="k1"[^>]*>Is liability capped\?<\/button><span> · 3 of 50 · Amina<\/span>/, 'asked here before: the question itself, how far, by whom');
  assert.equal((h.match(/data-dsc-q=/g) || []).length, 1, 'a question asked twice is offered once');
  assert.doesNotMatch(h, /dsl_back_lbl/, 'what comes back is the empty list\'s own example');
  assert.match(h, /data-dsl-eg="1">dsn_fix_g1[\s\S]*data-dsl-eg="3">dsn_fix_g3/, 'three questions one contract can answer: the page\'s own examples');
  assert.match(h, /data-dsn-clear>dsn_clear/, 'a folder chosen: the way back to all');
  const more = panel({ dsnChosen: () => ({ ids: cs.map(c => c.id), where: ['proc'] }), dsnPlan: () => ({ size: 20, unread: 50, pick: 20 }), getContract: id => by[id] }).dslNewHtml();
  assert.match(more, /The first 20 are read on this press\. 30 wait for your next\./, 'a cap is said, never a silent trim');
  /* the counts agree with the button: a question already answered for some reads only the rest, and says so */
  const some = panel({ dsnChosen: () => ({ ids: cs.slice(0, 11).map(c => c.id), where: ['all'] }), dsnPlan: () => ({ size: 100, unread: 1, pick: 1 }), getContract: id => by[id] }).dslNewHtml();
  assert.match(some, /dsl_new_some_one[\s\S]*dsl_new_before_other/, 'one read on this press, ten read before');
  const eg = RD.match(/if \(\(el = t\.closest\('\[data-dsl-eg\]'\)\)\)\{[^\n]*/);
  assert.ok(eg, 'the example\'s press'); assert.match(eg[0], /_dsc\.q = q;[\s\S]*renderReads\(\)/); assert.doesNotMatch(eg[0], /dsnAsk|api\(|askColAskHere/, 'it fills the box; it reads nothing');
});

test('f1074 (4) nothing spent, nothing boxed, only tokens; the panel is not wrapped again', () => {
  const a = RD.indexOf('const DSL_DOCS_SHOWN'), b = RD.indexOf('function dsnListHtml(');
  assert.doesNotMatch(RD.slice(a, b), /api\(|fetch\(|askColAskHere|aiAsk|intelChatAsk|dsnAsk\(/, 'counted from the read\'s own answers, no Jambo call');
  assert.match(fnBody(RD, 'dsnListPanel'), /return r \? dslReadHtml\(r\) : dslEmptyHtml\(\);/);
  /* RE-POINTED 22 Nov 2026 (P-42 review): the packs' pop-up open, the panel reads the pack (dsnPackPeekPanel) */
  assert.match(fnBody(RD, 'dsnNewPanel'), /if \(_dsc\.fix\) return dsnFixHtml\(\);\s*if \(_dsn\.pkMenu\) return dsnPackPeekPanel\(\);\s*return dslNewHtml\(\);/, '"how to ask it" still wins');
  assert.match(fnBody(RD, 'dsnPanelPaint'), /const dsl = !pk && \/\^<div class="dsl\[ "\]\/\.test\(body \|\| ''\);[\s\S]*body: dsl \? body :/);
  const H = read('index.html'), css = H.split('\n').filter(l => /\.dsl[- {]/.test(l) && /html\.lg-new/.test(l));
  assert.ok(css.length >= 30, 'its look');
  css.forEach(l => assert.doesNotMatch(l, /#[0-9a-fA-F]{3,8}\b/, 'colour only through tokens: ' + l.slice(0, 60)));
  assert.ok(css.some(l => /\.dsl mark\.dsn-yes\{[^}]*background:var\(--hl-yes\)/.test(l)), 'Discover\'s own yellow');
});

test('f1074 (5) every word of the panel is in both books', () => {
  const keys = new Set([...RD.matchAll(/['"](dsl_[a-z0-9_]+)['"]/g)].map(m => m[1]));
  ['dsl_need', 'dsl_left', 'dsl_new_t', 'dsl_new_first', 'dsl_new_wait', 'dsl_new_all', 'dsl_more', 'dsl_parties'].forEach(k => keys.add(k));
  const en = I18N.slice(0, I18N.search(/\n\s{2}sv\s*:\s*\{/)), sv = I18N.slice(I18N.search(/\n\s{2}sv\s*:\s*\{/));
  const has = (b, k) => new RegExp('\\b' + k + '(?:_one|_other)?:').test(b);
  assert.ok(keys.size >= 20, 'the words are found');
  assert.deepEqual([...keys].filter(k => !has(en, k) || !has(sv, k)), []);
});
