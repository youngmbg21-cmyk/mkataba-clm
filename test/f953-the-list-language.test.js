/* f953 — THE LIST LANGUAGE, AND THE BAR IN BLACK (owner, 27 Oct 2026: Contracts "the Legora way", Our standards
   "In words" — "seems like we are stealing too much from Legora" took the three-colour bar away —, People "the SAP
   way", the other lists "the same way", "Black it is"; docs/MAP-HISTORY.md "THE LIST LANGUAGE")
     1 · one set of parts (js/listlang.js): a mark per state, a reading in words with its grey line, a soft chip that
         escapes what it is given; a stream's tone is never green (signed) or ruby (danger), a person's never amber
         or ruby
     2 · Our standards, in words, RAW over the stored check: no check is "Not checked yet" (never clean), the worst
         news leads, "does not apply" counts in neither the met nor the total
     3 · the bar is near-black with its sheen, its own token, and the green token is gone
     4 · Approvals' line above the table is no longer drawn: the rule rides every row
   At the parent (1) fails (no js/listlang.js), (2) fails (no stdRowReading), (3) fails (--bar-green) and (4) fails.
   Run: node --test test/f953-the-list-language.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function stage(){
  const words = { std_row_unchecked: 'Not checked yet', std_row_of: '{met} of {total} met', std_row_missing_one: '1 missing', std_row_missing_other: '{n} missing',
    std_row_differ_one: '1 differs', std_row_differ_other: '{n} differ', std_row_differs_one: '1 differs from ours', std_row_differs_other: '{n} differ from ours', std_row_all: 'All {n} met' };
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null) ? v[k] : '');
  const sb = { console, i18t: (k, v) => fill(words[k] || k, v), i18tn: (k, n, v) => fill(words[k + (n === 1 ? '_one' : '_other')] || k, v) };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(read('js/listlang.js'), sb, { filename: 'listlang.js' });
  vm.runInContext(read('js/standards.js'), sb, { filename: 'standards.js' });
  return sb;
}
const text = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('1 · one set of parts: a mark per state, words with their grey line, a chip that escapes', () => {
  const sb = stage();
  for (const k of ['done', 'part', 'todo', 'late', 'wait', 'draft', 'ask']) {
    const h = sb.listMarkHtml('amber', k, 'Why');
    assert.match(h, /^<span class="ls-mark" style="color:var\(--st-amber-dot\)" title="Why" aria-hidden="true"><svg /, k);
    assert.ok(h.includes(sb.LIST_MARK_PATHS[k]), k + ' draws its own shape');
  }
  assert.match(sb.listMarkHtml('purple', 'done'), /--st-gray-dot/, 'a tone the house does not have is grey, never a made-up colour');
  const w = sb.listWordHtml('ruby', '2 missing', '8 of 11 met');
  assert.equal(text(w), '2 missing 8 of 11 met');
  assert.match(w, /class="ls-word-v" style="color:var\(--st-ruby-fg\)"><i style="background:var\(--st-ruby-dot\)"><\/i>2 missing/);
  assert.equal(sb.listWordHtml('green', 'All met').includes('ls-word-m'), false, 'no grey line when there is nothing under it');
  assert.equal(sb.listChipHtml('steel', 'A & <B>'), '<span class="ls-chip" style="background:var(--st-steel-bg);color:var(--st-steel-fg)" title="A &amp; &lt;B&gt;">A &amp; &lt;B&gt;</span>');
  for (const key of ['proc', 'sales', 'dist', 'mktg', 'corp', 'mfg', 'legal', 'hr', 'x1', 'x2', 'x3']) assert.ok(!['green', 'ruby'].includes(sb.listStreamTone(key)), key);
  assert.notEqual(sb.listStreamTone('proc'), sb.listStreamTone('sales'), 'two house streams side by side never share a tone');
  for (const n of ['Amina Otieno', 'Grace Wanjiru', 'Kabras Sugar', 'X', '']) assert.ok(!['amber', 'ruby'].includes(sb.listAvatarTone(n)), n);
});

test('2 · Our standards in words, RAW: no check is never clean, the worst news leads, na counts in neither', () => {
  const sb = stage();
  assert.equal(sb.stdRowReading({}), null);
  assert.equal(text(sb.stdRowWordsHtml({})), 'Not checked yet');
  assert.equal(text(sb.stdRowWordsHtml({ playbook: { verdicts: [] } })), 'Not checked yet', 'an empty check is not "All 0 met"');
  const v = s => ({ status: s, category: s });
  const c = { playbook: { verdicts: [v('missing'), v('missing'), v('deviation'), v('aligned'), v('ok'), v('na')] } };
  assert.deepEqual(JSON.parse(JSON.stringify(sb.stdRowReading(c))), { miss: 2, off: 1, met: 2, total: 5 });
  assert.equal(text(sb.stdRowWordsHtml(c)), '2 missing 1 differs · 2 of 5 met');
  assert.match(sb.stdRowWordsHtml(c), /--st-ruby-fg/);
  const off = { playbook: { verdicts: [v('deviation'), v('aligned'), v('aligned')] } };
  assert.equal(text(sb.stdRowWordsHtml(off)), '1 differs from ours 2 of 3 met');
  assert.match(sb.stdRowWordsHtml(off), /--st-amber-fg/);
  const all = { playbook: { verdicts: [v('aligned'), v('ok'), v('na')] } };
  assert.equal(text(sb.stdRowWordsHtml(all)), 'All 2 met');
  assert.match(sb.stdRowWordsHtml(all), /--st-green-fg/);
  assert.equal(text(sb.stdRowWordsHtml({ playbook: { verdicts: [v('mystery'), v('aligned')] } })), '1 differs from ours 1 of 2 met',
    'a word no engine writes is work, never met (PB_SETTLED_STATUSES)');
});

test('3 · the bar is near-black with its sheen; the green token is gone', () => {
  const html = read('index.html');
  assert.match(html, /--bar-black:#111113;/);
  assert.match(html, /--bar-sheen:linear-gradient\(/);
  assert.match(html, /#top-header\{--bar-bg:var\(--bar-black\);/);
  assert.match(html, /background:var\(--bar-sheen\) var\(--bar-bg\);/);
  assert.doesNotMatch(html.replace(/\/\*[\s\S]*?\*\//g, ''), /--bar-green/);
});

test('4 · Approvals: the line above the table is not drawn; the rule rides every row', () => {
  const src = read('js/views/approvalsview.js').replace(/\/\*[\s\S]*?\*\//g, '');
  const at = src.indexOf('function renderApprovalsPage(');
  const fn = src.slice(at, src.indexOf('\nfunction ', at + 10));
  assert.doesNotMatch(fn, /apSameLineHtml\(/);
  assert.match(fn, /const same=Object\.assign\(\{\}, apSameCols\(W\.rows\), \{ why:false \}\);/);
  assert.match(fn, /<td class="ap-rule">\$\{apRuleHtml\(r\)\}<\/td>/);
  assert.match(fn, /<td class="ap-std">\$\{typeof stdRowWordsHtml==='function'\?stdRowWordsHtml\(r\.c\):''\}<\/td>/);
});
