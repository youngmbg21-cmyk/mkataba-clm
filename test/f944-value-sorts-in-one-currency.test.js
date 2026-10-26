/* f944 — THE BUG LOG, BATCH 3: "SORT BY VALUE" RANKS IN ONE CURRENCY (the overnight build, 26 Oct 2026)

   BUGLOG's note: the Contracts list's value sort ranked by the raw number, so KES 1M stood above USD 100k.
   It ranks by what each value is worth in the workspace's currency now (fxHome, the one converter); a value
   with no rate is a blank — never a guessed figure — and sorts last in both directions, the house rule for
   blanks (regBlanksLast). A salary still ranks with the dashes (fxIsPay).

   Run: node --test test/f944-value-sorts-in-one-currency.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'register.js'), 'utf8');
const slice = (from, to) => { const i = SRC.indexOf(from); assert.ok(i >= 0, from); return SRC.slice(i, SRC.indexOf(to, i)); };

function stage(dir) {
  const blanks = slice('function regBlanksLast(', '\n}\n') + '\n}\n';
  const sortV = slice('const regSortValue=', '\nconst REG_CMP=');
  const cmpV = slice('  value:(a,b)=>', '\n  risk:');
  const RATES = { USD: 130, EUR: 140 };
  const fxHome = c => { const v = Number(c.value || 0), code = c.currency || 'KES';
    if (code === 'KES') return { v, missing: false }; const r = RATES[code]; return r ? { v: v * r, missing: false } : { v: 0, missing: true }; };
  return new Function('fxHome', 'fxIsPay', 'regState', blanks + sortV + '\nconst REG_CMP={\n' + cmpV + '\n};\nreturn REG_CMP.value;')(fxHome, c => !!c.pay, () => ({ dir }));
}
const BOOK = [
  { id: 'K1', value: 1e6, currency: 'KES' },
  { id: 'U1', value: 1e5, currency: 'USD' },      // 13M here
  { id: 'Z1', value: 9e9, currency: 'ZAR' },      // no rate: a blank
  { id: 'E1', value: 5e4, currency: 'EUR' },      // 7M here
];
const order = dir => { const cmp = stage(dir); return BOOK.slice().sort((a, b) => dir * cmp(a, b)).map(c => c.id); };

test('f944 (1) high to low: converted values in order, the unrated one last', () => {
  assert.deepEqual(order(-1), ['U1', 'E1', 'K1', 'Z1']);
});
test('f944 (2) low to high: still in order, the unrated one still last', () => {
  assert.deepEqual(order(1), ['K1', 'E1', 'U1', 'Z1']);
});

/* and the band counter beside it (the bug log, batch 3): a contract never stamped by the grouping counts as
   "neither", added to the rest, never resetting it */
test('f944 (3) negoBandCounts adds an unstamped contract to "neither"', () => {
  const fn = new Function(slice('function negoBandCounts(', '\n}\n') + '\n}\nreturn negoBandCounts;')();
  assert.deepEqual(fn([{ _ngBand: 'clear' }, { _ngBand: 'clear' }, {}, { _ngBand: 'you' }]), { you: 1, them: 0, out: 0, clear: 3 });
});
