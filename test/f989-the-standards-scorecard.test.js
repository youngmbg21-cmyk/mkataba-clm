'use strict';
/* f989 — OUR STANDARDS AS A SCORECARD (owner's pick by name, 10 Nov 2026: "score card"; the Contracts page "looks very
   condensed … the features are touching the lines")
   In the new look stdRowWordsHtml draws ONE slim bar split red · amber · green by share, its three counts beside it in
   the same order, on one line; the hover names what is missing; never checked stays "Not checked yet". The Contracts
   cell no longer adds the "missing: …" line, a non-monetary agreement says "No money" in grey, and Stream gets the room
   for its whole word. The old look keeps its three lamps. At the parent the claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function stage(newLook){
  const words = { std_row_unchecked: 'Not checked yet', std_row_of: '{met} of {total} met', std_row_missing_one: '1 missing', std_row_missing_other: '{n} missing',
    std_row_differ_one: '1 differs', std_row_differ_other: '{n} differ', reg_std_missing: 'missing: {list}' };
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null) ? v[k] : '');
  const sb = { console, i18t: (k, v) => fill(words[k] || k, v), i18tn: (k, n, v) => fill(words[k + (n === 1 ? '_one' : '_other')] || k, v), newLookOn: () => newLook };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(read('js/listlang.js'), sb, { filename: 'listlang.js' });
  vm.runInContext(read('js/standards.js'), sb, { filename: 'standards.js' });
  return sb;
}
const v = (s, cat) => ({ status: s, category: cat || s });

test('1 · one bar split by share, three counts beside it in one order, the missing named on the hover', () => {
  const sb = stage(true);
  const c = { playbook: { verdicts: [v('missing', 'Data protection'), v('deviation'), v('deviation'), v('deviation'), v('aligned'), v('na')] } };
  const h = sb.stdRowWordsHtml(c);
  assert.match(h, /^<span class="ls-score" role="img"/);
  const segs = [...h.matchAll(/<i style="width:([\d.]+)%;background:var\(--st-(\w+)-dot\)"><\/i>/g)].map(m => m[2] + ':' + m[1]);
  assert.deepEqual(segs, ['ruby:20.0', 'amber:60.0', 'green:20.0'], 'the bar by share, missing · differs · met');
  assert.match(h, /<em class="ls-score-n"><u class="is-ruby">1<\/u> · <u class="is-amber">3<\/u> · <u class="is-green">1<\/u><\/em>/);
  assert.match(h, /title="1 missing · 3 differ · 1 of 5 met — missing: data protection"/, 'the hover says it and names what is missing');
  assert.ok(!/ls-lamp/.test(h), 'no lamps in the new look');
  const none = sb.stdRowWordsHtml({ playbook: { verdicts: [v('aligned'), v('aligned')] } });
  assert.deepEqual([...none.matchAll(/--st-(\w+)-dot/g)].map(m => m[1]), ['green'], 'an empty share draws no segment');
  assert.match(sb.stdRowWordsHtml({}), /Not checked yet/);
});

test('2 · the old look keeps its three lamps', () => {
  const h = stage(false).stdRowWordsHtml({ playbook: { verdicts: [v('missing'), v('aligned')] } });
  assert.match(h, /class="ls-lights"/); assert.ok(!/ls-score/.test(h));
});

test('3 · the Contracts cell is one line, "No money" grey, Stream has the room for its word', () => {
  const REG = read('js/views/register.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(REG, /CELL\.standards=`<td style="overflow:hidden">\$\{window\.stdRowWordsHtml\?stdRowWordsHtml\(c\):''\}<\/td>`;/, 'no "missing:" line under the bar');
  assert.match(REG, /i18t\(\(typeof newLookOn==='function'&&newLookOn\(\)\)\?'reg_no_money':'reg_non_monetary_word'\)/);
  assert.match(REG, /const REG_COL_W_NL=\{ standing:12, stream:13, standards:17, expiry:12, value:11, owner:10 \};/);
  const I = read('js/i18n.js');
  assert.match(I, /reg_no_money: 'No money',/); assert.match(I, /reg_no_money: 'Inga pengar',/);
  const CSS = read('index.html').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(CSS, /html\.lg-new \.ls-score\{display:inline-flex;align-items:center;gap:10px;white-space:nowrap/);
  assert.match(CSS, /html\.lg-new \.ls-score-n\{[^}]*color:var\(--color-neutral-400\)/, 'the counts\' dots grey, each number its tone');
});
