/* f653 — IMPORTING CONTRACTS READS WHAT THE CUSTOMER SENT, AND SAYS WHAT IT
   COULD NOT READ (owner-asked 9 Oct 2026, after the coverage report showed the
   import screen was the least-checked part of HaTi: about 15%).

   js/views/migration.js brings a whole portfolio in at once. Nobody looks at
   each contract as it lands, so every reading rule here is a promise kept with
   no person watching: a date read the wrong way round, or a value out by a
   million, is filed in silence and only found when a renewal is missed.

   These pin the reading rules as they stand — the CSV reader, the column
   names, the date order sniffed per FILE, money as Kenyan businesses write it,
   the status and stream words, the manifest's problems list and matching, the
   "fully migrated" gates and the pre-flight cost estimate. They describe
   today's behaviour (a CHARACTERISATION set); a red one means a rule moved. */
'use strict';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildWorld } = require('./world');
const { runFileInContext } = require('./vmcache');

let W, toasts;
before(async () => {
  const w = await buildWorld({ templates: true });   // templates.js defines FOLDERS
  W = w.win;
  const ctx = w.dom.getInternalVMContext();
  for (const f of ['js/migread.js', 'js/views/migration.js']) runFileInContext(path.join(__dirname, '..', f), ctx, f);
  /* The screen itself is not drawn here; the readings are. */
  toasts = [];
  W.toast = (msg, kind) => { toasts.push({ msg, kind }); };
  W.renderMigration = () => {};
});
const fresh = (extra = {}) => { W.state = { contracts: [], aiCfg: {}, ...extra }; toasts.length = 0; };
/* Lists made inside the page's window are another realm's arrays; read them
   back as plain data before comparing. */
const plain = x => JSON.parse(JSON.stringify(x));
const csvFile = (name, text) => ({ name, text: async () => text });

describe('f653 — the CSV reader', () => {
  test('(1) quoted commas, doubled quotes and Windows line ends read as one cell each', () => {
    const rows = W.parseCsv('a,"b, with comma","say ""hi"""\r\n1,2,3\r\n');
    assert.deepEqual(plain(rows), [['a', 'b, with comma', 'say "hi"'], ['1', '2', '3']]);
  });
  test('(2) blank lines are skipped, a last line with no line end is kept', () => {
    const rows = W.parseCsv('x,y\n\n , \n1,2');
    assert.deepEqual(plain(rows), [['x', 'y'], ['1', '2']]);
  });
  test('(3) nothing in, nothing out', () => {
    assert.equal(W.parseCsv('').length, 0);
    assert.equal(W.parseCsv(null).length, 0);
  });
});

describe('f653 — column names, however the customer wrote them', () => {
  test('(4) case, spaces and punctuation do not matter; the first match wins', () => {
    const m = W.migHeaderMap(['File Name', 'Vendor', 'Contract Value', 'End-Date', 'Department', 'Supplier']);
    assert.equal(m.file, 0);
    assert.equal(m.counterparty, 1, 'Vendor is the counterparty; the later Supplier column does not take it');
    assert.equal(m.value, 2);
    assert.equal(m.expiry, 3);
    assert.equal(m.folder, 4);
  });
  test('(5) an unknown column maps to nothing', () => {
    const m = W.migHeaderMap(['Notes', 'Owner']);
    assert.deepEqual({ ...m }, {});
  });
});

describe('f653 — dates: one order per FILE, never guessed per cell', () => {
  test('(6) a first number above 12 anywhere proves day-first', () => {
    const o = W.migDateOrder([['25/03/2024'], ['01/02/2024']], [0]);
    assert.deepEqual({ ...o }, { order: 'dmy', proven: true });
  });
  test('(7) a second number above 12 anywhere proves month-first', () => {
    const o = W.migDateOrder([['03/25/2024'], ['01/02/2024']], [0]);
    assert.deepEqual({ ...o }, { order: 'mdy', proven: true });
  });
  test('(8) both kinds in one file is a conflict, read day-first and flagged', () => {
    const o = W.migDateOrder([['25/03/2024'], ['03/25/2024']], [0]);
    assert.deepEqual({ ...o }, { order: 'dmy', proven: false, conflict: true });
  });
  test('(9) nothing to tell by falls back to the Kenyan day-first, unproven', () => {
    const o = W.migDateOrder([['01/02/2024'], ['2024-05-01']], [0]);
    assert.deepEqual({ ...o }, { order: 'dmy', proven: false });
  });
  test('(10) "01/03/2024" is 1 March day-first and 3 January month-first', () => {
    assert.equal(W.migParseDate('01/03/2024', 'dmy').value, '2024-03-01');
    assert.equal(W.migParseDate('01/03/2024', 'mdy').value, '2024-01-03');
  });
  test('(11) ISO, "1 March 2024", "March 1, 2024" and dotted dates all read', () => {
    assert.equal(W.migParseDate('2024-3-1').value, '2024-03-01');
    assert.equal(W.migParseDate('1 March 2024').value, '2024-03-01');
    assert.equal(W.migParseDate('March 1, 2024').value, '2024-03-01');
    assert.equal(W.migParseDate('01.03.2024').value, '2024-03-01');
  });
  test('(12) a date that only works the other way round is read that way AND said', () => {
    const r = W.migParseDate('25/03/2024', 'mdy');
    assert.equal(r.value, '2024-03-25');
    assert.match(r.problem, /only makes sense as day\/month/);
  });
  test('(13) a date that is not real is never stored — it is said', () => {
    for (const bad of ['2024-15-03', '31/02/2024', '2023-02-29', '32 March 2024']) {
      const r = W.migParseDate(bad);
      assert.equal(r.value, null, bad + ' must not be stored');
      assert.match(r.problem, /is not a real date/, bad);
    }
    assert.match(W.migParseDate('next spring').problem, /not a date HaTi can read/);
  });
  test('(14) a leap day in a leap year is real; an empty cell is simply empty', () => {
    assert.equal(W.migParseDate('29/02/2024').value, '2024-02-29');
    const e = W.migParseDate('  ');
    assert.equal(e.value, null);
    assert.equal(e.problem, undefined, 'an empty cell is not a problem');
  });
});

describe('f653 — money, as Kenyan businesses write it', () => {
  const val = v => W.migParseValue(v).value;
  test('(15) currency words, separators and the /= and /- endings drop away', () => {
    assert.equal(val('KES 2,500,000'), 2500000);
    assert.equal(val('2,500,000/='), 2500000);
    assert.equal(val('Kshs. 750,000/-'), 750000);
    assert.equal(val('Sh 1 200'), 1200);
  });
  test('(16) multipliers, English and Swahili, are applied — "2.5m" is not 2.5', () => {
    assert.equal(val('2.5m'), 2500000);
    assert.equal(val('1.2 million'), 1200000);
    assert.equal(val('3bn'), 3e9);
    assert.equal(val('750k'), 750000);
    assert.equal(val('milioni 2') || 0, 0, 'a multiplier BEFORE the number is not read');
    assert.equal(val('2 milioni'), 2000000);
    assert.equal(val('5 elfu'), 5000);
  });
  test('(17) what cannot be read is 0 WITH a sentence, never a silent 0', () => {
    for (const [bad, re] of [['about two hundred', /not a number/], ['2.5zz', /does not recognise "zz"/], ['-500', /is negative/]]) {
      const r = W.migParseValue(bad);
      assert.equal(r.value, 0, bad);
      assert.match(r.problem, re, bad);
    }
  });
  test('(18) an empty cell is 0 with no problem', () => {
    const r = W.migParseValue('');
    assert.equal(r.value, 0);
    assert.equal(r.problem, undefined);
  });
});

describe('f653 — status and stream words', () => {
  test('(19) status words land on HaTi\'s four stages; an unknown word is no answer', () => {
    assert.equal(W.migParseStatus('Executed'), 'Signed');
    assert.equal(W.migParseStatus('ACTIVE'), 'Signed');
    assert.equal(W.migParseStatus('In negotiation'), 'Under Review');
    assert.equal(W.migParseStatus('draft v2'), 'Draft');
    assert.equal(W.migParseStatus('Terminated'), 'Declined');
    assert.equal(W.migParseStatus('on hold'), null);
  });
  test('(20) a stream is found by its name or, failing that, by the contract type', () => {
    assert.equal(W.migParseFolder('Procurement'), 'proc');
    assert.equal(W.migParseFolder(''), null);
    assert.equal(W.migParseFolder('cold chain warehousing'), 'dist');
    assert.equal(W.migParseFolder('employment'), 'corp');
  });
});

describe('f653 — the manifest (the customer\'s own checklist)', () => {
  test('(21) a manifest is read, its problems listed by row and field, and said as a warning', async () => {
    fresh();
    await W.migLoadManifest(csvFile('list.csv', [
      'filename,counterparty,stream,status,value,effective date,expiry date',
      'acme.pdf,Acme Ltd,Procurement,Executed,KES 2.5m,01/02/2024,25/03/2026',
      'beta.docx,Beta Co,Sales,Draft,lots,2024-15-01,',
    ].join('\n')));
    const M = W.migState();
    assert.equal(M.manifest.length, 2);
    assert.equal(M.manifestName, 'list.csv');
    assert.equal(M.manifestDateOrder.order, 'dmy');
    assert.equal(M.manifestDateOrder.proven, true, '25/03 proves the file is day-first');
    const a = M.manifest[0];
    assert.deepEqual([a.file, a.counterparty, a.folder, a.status, a.value, a.effective, a.expiry],
      ['acme.pdf', 'Acme Ltd', 'proc', 'Signed', 2500000, '2024-02-01', '2026-03-25']);
    const probs = M.manifestProblems.map(p => [p.row, p.label, p.field]);
    assert.deepEqual(plain(probs), [[3, 'beta.docx', 'effective date'], [3, 'beta.docx', 'value']]);
    const last = toasts.at(-1);
    assert.match(last.msg, /2 rows, 2 values need attention/);
    assert.equal(last.kind, 'err', 'problems are said as a warning, not quietly');
  });
  test('(22) a file with no data rows, or no filename/name column, is refused — and the old manifest kept', async () => {
    fresh();
    await W.migLoadManifest(csvFile('good.csv', 'name,value\nAcme supply,100'));
    assert.equal(W.migState().manifest.length, 1);
    await W.migLoadManifest(csvFile('empty.csv', 'filename,value\n'));
    assert.equal(W.migState().manifestError.name, 'empty.csv');
    assert.match(W.migState().manifestError.reason, /no data rows/);
    await W.migLoadManifest(csvFile('nocol.csv', 'vendor,value\nAcme,100'));
    assert.match(W.migState().manifestError.reason, /"filename" or "name" column/);
    assert.equal(W.migState().manifestName, 'good.csv', 'a bad second file does not lose the first');
    assert.equal(toasts.at(-1).kind, 'err');
  });
  test('(23) a manifest row is matched by file name, with or without the extension, any case', async () => {
    fresh();
    await W.migLoadManifest(csvFile('m.csv', 'filename,counterparty\nAcme_Supply.PDF,Acme\nbeta,Beta'));
    assert.equal(W.migManifestRow('acme_supply.pdf').counterparty, 'Acme');
    assert.equal(W.migManifestRow('BETA.docx').counterparty, 'Beta');
    assert.equal(W.migManifestRow('gamma.pdf'), null);
    assert.equal(W.migManifestRow(''), null);
  });
  test('(24) a manifest loaded AFTER the contracts still finds them', async () => {
    fresh({ contracts: [{ id: 'c1', migration: {}, upload: { fileName: 'acme.pdf' } }, { id: 'c2', upload: { fileName: 'beta.pdf' } }] });
    await W.migLoadManifest(csvFile('m.csv', 'filename\nacme.pdf\nbeta.pdf'));
    const M = W.migState();
    assert.equal(M.manifest[0].matchedId, 'c1');
    assert.equal(M.manifest[1].matchedId, null, 'only IMPORTED contracts are matched');
  });
});

describe('f653 — what "fully migrated" means', () => {
  const ok = c => Object.fromEntries(W.migGates(c).map(g => [g.k, g.ok]));
  const whole = () => ({ counterparty: 'Acme', folder: 'proc', upload: { fileHash: 'h' }, expiry: '2027-01-01', migration: {} });
  test('(25) a complete contract passes all five gates, and each label is a sentence', () => {
    const gates = W.migGates(whole());
    assert.deepEqual(plain(gates.map(g => g.k)), ['file', 'cp', 'folder', 'term', 'review']);
    assert.ok(gates.every(g => g.ok));
    assert.ok(gates.every(g => typeof g.label === 'string' && g.label.length > 3), 'labels are words, not keys');
  });
  test('(26) each gate fails on its own missing fact', () => {
    assert.equal(ok({ ...whole(), upload: {} }).file, false);
    assert.equal(ok({ ...whole(), counterparty: '   ' }).cp, false);
    assert.equal(ok({ ...whole(), folder: 'nowhere' }).folder, false);
    assert.equal(ok({ ...whole(), expiry: '' }).term, false);
    assert.equal(ok({ ...whole(), migration: { needsReview: true } }).review, false);
  });
  test('(27) an evergreen contract needs no end date', () => {
    assert.equal(ok({ ...whole(), expiry: '', metadata: { renewalType: 'evergreen' } }).term, true);
  });
  test('(28) the sixth gate appears ONLY when the document looks like an amendment', () => {
    assert.equal(W.migGates(whole()).length, 5);
    const g = ok({ ...whole(), linkSuggestions: [{ id: 'p' }] });
    assert.equal(g.link, false, 'an unlinked possible amendment is not finished');
    assert.equal(ok({ ...whole(), linkSuggestions: [{ id: 'p' }], linkConfirmed: true }).link, true);
    assert.equal(ok({ ...whole(), linkSuggestions: [{ id: 'p' }], parentId: 'p' }).link, true);
  });
});

describe('f653 — the cost estimate shown before a batch runs', () => {
  test('(29) a photo is one page; a PDF is about one page per 40 KB, never less than one', () => {
    assert.equal(W.migGuessPages({ type: 'image/png', size: 9e6 }), 1);
    assert.equal(W.migGuessPages({ name: 'scan.JPG', size: 9e6 }), 1);
    assert.equal(W.migGuessPages({ name: 'a.pdf', size: 400000 }), 10);
    assert.equal(W.migGuessPages({ name: 'a.pdf', size: 10 }), 1);
  });
  test('(30) the estimate adds up pages and money, and the photo-reading cost stops at the page cap', () => {
    fresh({ aiCfg: { limits: { ocrMaxPages: 5 }, rates: { default: { in: 10, out: 50 } } } });
    const files = [{ name: 'a.pdf', size: 400000 }, { name: 'b.png', type: 'image/png', size: 1 }];
    const e = W.migEstimate(files);
    assert.equal(e.docs, 2);
    assert.equal(e.pages, 11);
    assert.equal(e.ocrPages, 6, '10 pages capped at 5, plus the photo');
    assert.equal(e.thorough, false);
    assert.ok(e.extractCost > 0 && e.ocrCost > 0);
    assert.equal(e.worstCase, e.extractCost + e.ocrCost);
  });
  test('(31) a dearer model makes a dearer estimate (the RELATION, not the number)', () => {
    const files = [{ name: 'a.pdf', size: 400000 }];
    fresh({ aiCfg: { rates: { default: { in: 1, out: 5 } } } });
    const cheap = W.migEstimate(files).worstCase;
    fresh({ aiCfg: { rates: { default: { in: 10, out: 50 } } } });
    const dear = W.migEstimate(files).worstCase;
    assert.ok(dear > cheap);
  });
});
