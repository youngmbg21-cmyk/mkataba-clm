/* f663 — THE IMPORT SHEET'S HINT ROW NAMES REAL ANSWERS (BUGLOG 9 Oct 2026,
   fixed 12 Oct). A select field's options are {v,l} pairs since the side
   question learnt to say "not recorded"; bulkTemplateCsv joined them as
   strings, so the spreadsheet's hint row printed "[object Object] | …". */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

test('every select field hints its answers, never [object Object]', () => {
  const w = buildWorld({ templateFields: true }).win;
  /* a library template carrying the side question, as the bulk dialog passes one */
  /* the side question's own shape (TEMPLATE_BASE_FIELDS): {v,l} pairs, an empty first */
  const side = { key: 'side', label: 'Which side are we on?', type: 'select',
    opts: [{ v: '', l: 'Not recorded' }, { v: 'customer', l: 'We are the customer' }, { v: 'supplier', l: 'We are the supplier' }] };
  const t = { name: 'Supply', fields: [side, { key: 'n', label: 'N', type: 'num' }] };
  const csv = w.bulkTemplateCsv(t);
  assert.doesNotMatch(csv, /\[object Object\]/);
  assert.match(csv, /customer \| supplier/);
});
