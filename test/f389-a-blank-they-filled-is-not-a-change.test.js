/* ============================================================
   f389 — a blank they filled in is not a change (Young ruled 26 Sep 2026:
   "yes, accept the filled-in blanks without asking")
   ============================================================
   A contract they sign their own way comes back signed, and the blanks the
   agreed words left — a ruled line for the date, "[Customer name]", a Word
   box — come back filled. The word check read every one of them as changed
   wording, so filing the copy needed the approver or an admin with a reason.
   It now reads words written WHERE A BLANK STANDS as a fill: the same wording,
   the fill listed on the result and kept on the record, nobody asked.

   What a blank is, is the upload panel's own reading (upHits in
   js/uploadblanks.js), so this file loads that reader beside js/outside.js the
   way the page does — into its own sandbox, published onto the global.

   Every claim below was run against the commit before this work (e2d34ea):
   16 of the 26 fail there, each on its own line. The ten marked [wall] and
   [control] pass there too, on purpose — a wall is what must NOT become a
   fill, and a control proves the stage bites.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* THE PANEL'S READER, loaded as the page loads it: a browser module that
   publishes onto `window`. A sandbox gives it one, and its four names are put
   on the global where js/outside.js asks for them. */
const UB = (() => {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(read('js/uploadblanks.js'), ctx, { filename: 'js/uploadblanks.js' });
  return ctx.window;
})();
const PANEL = ['upHits', 'upLabel', 'upLead', 'upStockPrompt'];
const withPanel = () => { for (const k of PANEL) global[k] = UB[k]; };
const withoutPanel = () => { for (const k of PANEL) delete global[k]; };
withPanel();
const O = require('../js/outside.js');
const MAX = O.OH_FILL_MAX || 20;

const AGREED = [
  { text: 'SUPPLY AGREEMENT', title: true },
  { text: 'This Agreement is made between Kijani Foods Ltd and Highland Corporate Ltd.' },
  { text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.', label: '1 · Term' },
  { text: '2. Delivery. The Supplier shall deliver the Goods to: ______________________', label: '2 · Delivery' },
  { text: '3. Fees. The Customer shall pay the fees within thirty days of invoice.', label: '3 · Fees' },
  { text: 'For and on behalf of Kijani Foods Ltd' },
  { text: 'Name: ______________________' },
  { text: 'Date: ______________________' },
];
const SIGNED = [
  'KIJANI FOODS LTD — SUPPLY AGREEMENT',
  'This Agreement is made between Kijani Foods Ltd and Highland Corporate Ltd.',
  '§1 Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.',
  '§2 Delivery. The Supplier shall deliver the Goods to: Warehouse 4, Mombasa Road, Nairobi',
  '§3 Fees. The Customer shall pay the fees within thirty days of invoice.',
  'For and on behalf of Kijani Foods Ltd',
  'Name: Wanjiru Kamau',
  'Date: 29 September 2026',
  'Signed for Kijani Foods Ltd: Wanjiru Kamau, 29 September 2026',
];
const cmp = (agreed, lines) => O.outsideCompare(agreed, Array.isArray(lines) ? lines.join('\n') : lines);
const fillOf = (r, text) => (r.fills || []).find(f => f.text === text);

describe('f389 (1) words written where a blank stands are a fill, not a change', () => {
  test('1a a ruled line they filled in reads as the same wording, and the fill is listed by the name the panel gives the blank', () => {
    const r = cmp(AGREED, SIGNED);
    assert.equal(r.same, true, JSON.stringify(r.changed.map(c => c.label)));
    assert.equal(r.changedCount, 0);
    assert.equal(r.fillCount, 3);
    const name = fillOf(r, 'Wanjiru Kamau');
    assert.ok(name, JSON.stringify(r.fills));
    assert.equal(name.name, 'Name', 'a ruled line goes by the words in front of it — the panel\'s own name');
    assert.equal(name.blank, '______________________');
  });
  test('1b a blank in the middle of a sentence takes the words written between the agreed words either side of it', () => {
    const r = cmp(AGREED, SIGNED);
    const f = fillOf(r, 'Warehouse 4, Mombasa Road, Nairobi');
    assert.ok(f, JSON.stringify(r.fills));
    assert.equal(f.label, '2 · Delivery', 'named by the clause it sits in');
  });
  test('1c a bracketed placeholder they filled is a fill, named by its own words', () => {
    const agreed = [{ text: 'This Agreement is made between [Customer name] of [Registered address] and Highland Corporate Ltd.' },
      { text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' }];
    const r = cmp(agreed, ['This Agreement is made between Kijani Foods Ltd of Plot 45, Mombasa Road, Nairobi and Highland Corporate Ltd.',
      '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.']);
    assert.equal(r.same, true, JSON.stringify(r.changed));
    assert.deepEqual((r.fills || []).map(f => [f.name, f.text]),
      [['Customer name', 'Kijani Foods Ltd'], ['Registered address', 'Plot 45, Mombasa Road, Nairobi']]);
  });
  test('1d [control] a blank they left empty is the same wording, with nothing listed', () => {
    const r = cmp(AGREED, SIGNED.map(l => l.replace(/Warehouse 4, Mombasa Road, Nairobi$|Wanjiru Kamau$|29 September 2026$/, '______')));
    assert.equal(r.same, true);
    assert.equal(r.fillCount || 0, 0);
  });
  test('1e a real change beside the fills still differs — one change, and the fills still listed', () => {
    const b = SIGNED.slice(); b[4] = b[4].replace('thirty', 'sixty');
    const r = cmp(AGREED, b);
    assert.equal(r.same, false);
    assert.equal(r.changedCount, 1, JSON.stringify(r.changed.map(c => c.label)));
    assert.equal(r.changed[0].label, '3 · Fees');
    assert.equal(r.fillCount, 3);
  });
  test('1f a paragraph with a real change AND a fill marks only the change: what was written in the blank is not drawn as one', () => {
    const b = SIGNED.slice(); b[3] = '§2 Delivery. The Supplier shall promptly deliver the Goods to: Warehouse 4';
    const r = cmp(AGREED, b);
    assert.equal(r.changedCount, 1);
    const t = s => (r.changed[0].b.find(x => x.s === s) || {}).t;
    assert.equal(t('promptly'), 'i', 'the word they added is marked');
    assert.equal(t('Warehouse'), 'k', JSON.stringify(r.changed[0].b));
    assert.equal(t('4'), 'k', 'what they wrote in the blank is not');
    assert.ok(fillOf(r, 'Warehouse 4'), JSON.stringify(r.fills));
  });
  test('1g a line that is only a named blank, written on, is pinned by the two paragraphs around it', () => {
    const agreed = [{ text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' },
      { text: 'For and on behalf of Kijani Foods Ltd' }, { text: '[Name of signatory]' },
      { text: 'Title: Chief Executive Officer' }, { text: '3. Fees. The Customer shall pay the fees within thirty days of invoice.' }];
    const r = cmp(agreed, ['1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.',
      'For and on behalf of Kijani Foods Ltd', 'Wanjiru Njeri Kamau', 'Title: Chief Executive Officer',
      '3. Fees. The Customer shall pay the fees within thirty days of invoice.']);
    assert.equal(r.same, true, JSON.stringify(r.inserted));
    assert.deepEqual((r.fills || []).map(f => [f.name, f.text]), [['Name of signatory', 'Wanjiru Njeri Kamau']]);
  });
  test('1h a placeholder they left exactly as it was is the agreed wording, and is not listed as a fill', () => {
    const agreed = [{ text: 'This Agreement is made between [Customer name] and Highland Corporate Ltd.' },
      { text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' }];
    const r = cmp(agreed, agreed.map(x => x.text));
    assert.equal(r.same, true);
    assert.equal(r.fillCount, 0);
  });
  test('1i a Word box handed over by its prompt and typed over is a fill, named by the name its file gave it', () => {
    const agreed = [{ text: 'The Buyer is Click or tap here to enter text. of Nairobi.', fields: [{ text: 'Click or tap here to enter text.', name: 'buyer_name' }] },
      { text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' }];
    const r = cmp(agreed, ['The Buyer is Kijani Foods Ltd of Nairobi.',
      '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.']);
    assert.equal(r.same, true, JSON.stringify(r.changed));
    assert.deepEqual((r.fills || []).map(f => [f.name, f.text]), [['Buyer name', 'Kijani Foods Ltd']]);
  });
});

describe('f389 (2) the walls: a fill is not a door for new wording', () => {
  test('2a [wall] more than a blank holds is a change — a blank holds a fact, not a clause', () => {
    const b = SIGNED.slice(); b[3] = '§2 Delivery. The Supplier shall deliver the Goods to: ' + Array.from({ length: MAX + 1 }, (_, i) => 'w' + i).join(' ');
    const r = cmp(AGREED, b);
    assert.equal(r.same, false);
    assert.equal(r.changed[0].label, '2 · Delivery');
  });
  test('2b [wall] words changed beside the blank are a change, whatever is in the blank', () => {
    const b = SIGNED.slice(); b[3] = '§2 Delivery. The Supplier shall deliver the Goods, at its own cost, to: Warehouse 4';
    const r = cmp(AGREED, b);
    assert.equal(r.same, false);
    assert.equal(r.changed[0].label, '2 · Delivery');
  });
  test('2c [wall] an agreed word struck where the blank stood is a change — a fill deletes nothing', () => {
    const agreed = [{ text: 'The price is ____ EUR per unit.' },
      { text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' }];
    const r = cmp(agreed, ['The price is 45,000 per unit.',
      '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.']);
    assert.equal(r.same, false, 'EUR was agreed and is gone');
  });
  test('2d [wall] a bracket that says what it is is not a blank: "[Reserved]" replaced is a change', () => {
    const agreed = [{ text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' },
      { text: '2. [Reserved]', label: '2' },
      { text: '3. Fees. The Customer shall pay the fees within thirty days of invoice.' }];
    const r = cmp(agreed, ['1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.',
      '2. The Supplier may terminate at will.', '3. Fees. The Customer shall pay the fees within thirty days of invoice.']);
    assert.equal(r.same, false);
    assert.equal(r.fillCount || 0, 0);
  });
  test('2e [wall] a sentence written on a line to SIGN on — a ruled line with no name — is text they added', () => {
    const agreed = [{ text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' },
      { text: 'For and on behalf of Kijani Foods Ltd' }, { text: '______________________' },
      { text: 'Title: Chief Executive Officer' }, { text: '3. Fees. The Customer shall pay the fees within thirty days of invoice.' }];
    const r = cmp(agreed, ['1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.',
      'For and on behalf of Kijani Foods Ltd', 'The Customer waives all claims for late delivery.', 'Title: Chief Executive Officer',
      '3. Fees. The Customer shall pay the fees within thirty days of invoice.']);
    assert.equal(r.same, false);
    assert.equal(r.inserted.length, 1);
  });
  test('2f [wall] a named line holds one line: a second line written under it is text they added', () => {
    const agreed = [{ text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.' },
      { text: '[Name of signatory]' }, { text: '3. Fees. The Customer shall pay the fees within thirty days of invoice.' }];
    const r = cmp(agreed, ['1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.',
      'Wanjiru Kamau', 'The Customer waives all claims for late delivery.',
      '3. Fees. The Customer shall pay the fees within thirty days of invoice.']);
    assert.equal(r.same, false);
    assert.equal(r.fillCount || 0, 0, JSON.stringify(r.fills));
  });
  test('2g [wall] their copy is never read for blanks: a bracket THEY added is words they added', () => {
    const b = SIGNED.slice(); b[4] = '§3 Fees. The Customer shall pay the fees [subject to board approval] within thirty days of invoice.';
    const r = cmp(AGREED, b);
    assert.equal(r.same, false);
    assert.ok(r.changed.some(c => c.label === '3 · Fees'), JSON.stringify(r.changed.map(c => c.label)));
  });
  test('2h [control] without the panel\'s reader no blank is read, and a fill reads as a change — the old answer, which asks a person', () => {
    withoutPanel();
    try {
      const r = cmp(AGREED, SIGNED);
      assert.equal(r.same, false);
      assert.equal(r.fillCount || 0, 0);
    } finally { withPanel(); }
  });
});

describe('f389 (3) one reading of what a blank is, and it is said out loud', () => {
  const SRC = read('js/outside.js');
  const region = (() => { const a = SRC.indexOf('function ohBlankHits('); const b = SRC.indexOf('function ohChunksBlanks('); return a >= 0 && b > a ? SRC.slice(a, b) : ''; })();
  test('3a the blank reading asks the upload panel\'s own reader and narrows it by the handover\'s, with no pattern of its own', () => {
    assert.ok(region, 'ohBlankHits is there');
    assert.match(region, /upHits\(/);
    assert.match(region, /OH_NOT_BLANK/);
    assert.doesNotMatch(region.replace(/\/\*[\s\S]*?\*\//g, ''), /_\{3,\}|\\\[\(|\\\{\\\{/, 'no second copy of the panel\'s shapes');
  });
  test('3b the record line says how many blanks were filled, whichever way the words went', () => {
    assert.match(O.outsideCompareLine(cmp(AGREED, SIGNED)), /^Same wording as agreed — \d+ parts match\. 3 blanks filled in\.$/);
    const b = SIGNED.slice(); b[4] = b[4].replace('thirty', 'sixty');
    assert.match(O.outsideCompareLine(cmp(AGREED, b)), /differs.*1 changed\. 3 blanks filled in\.$/);
  });
  test('3c both screens that show the check draw the fills, open, and the filing record keeps them', () => {
    const H = read('js/views/handover.js');
    assert.equal((H.match(/\$\{outsideFillsHtml\(r\)\}/g) || []).length, 2, 'the check dialog and the filing screen');
    assert.match(H, /<details class="ho-fills" open>/);
    const file = H.slice(H.indexOf('async function outsideFile('), H.indexOf('/* the dates, where a person confirmed them'));
    assert.match(file, /filled: Number\(cmp\.fillCount\) \|\| 0/);
    assert.match(file, /fills: \(cmp\.fills \|\| \[\]\)\.slice\(0, HO_FILLS_KEPT\)/);
  });
  test('3d the signed record says the count under "the same as agreed"', () => {
    const H = read('js/views/handover.js');
    const block = H.slice(H.indexOf('function outsideExecutionBlock('), H.indexOf('/* The open button inside the frozen block'));
    assert.match(block, /sc\.compare\.filled/);
    assert.match(block, /i18tn\('ho_fills'/);
  });
  test('3e both books carry the words', () => {
    const I = read('js/i18n.js');
    for (const k of ['ho_fills_one', 'ho_fills_other', 'ho_fills_title', 'ho_fill_blank'])
      assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
  test('3f the Word boxes are read off the agreed markup and handed to the check by their own words', () => {
    const H = read('js/views/handover.js');
    const walk = H.slice(H.indexOf('function outsideAgreedParas('), H.indexOf('function outsideAgreedPlain('));
    assert.match(walk, /RICH_WFIELD_CLASS/);
    assert.match(walk, /fields\.length \? \{ fields \} : \{\}/);
  });
});

/* ---------------------------------------------------------------------------
   (4) THE PAGE'S OWN WALK — the agreed words as the Signing tab reads them, in
   a world with the handover view and the panel's reader loaded as the page
   loads them. A Word box is the one blank the text cannot show, so it is read
   off the markup there.
   --------------------------------------------------------------------------- */
describe('f389 (4) a Word box, read off the agreed markup', () => {
  const { buildWorld } = require('./world');
  const world = () => buildWorld({ contractView: true, blanks: true }).win;
  const C = {
    id: 'RL-009', name: 'Order form', format: 'rich', signRoute: 'outside',
    redlineText: '<h1>ORDER FORM</h1><p>The Buyer is <span class="hati-wfield" data-wfield="buyer_name">Click or tap here to enter text.</span> of Nairobi.</p>'
      + '<p>Delivery by <span class="hati-wfield">     </span> at the latest.</p>'
      + '<p>1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.</p>',
  };
  const SIGNED_FORM = ['ORDER FORM', 'The Buyer is Kijani Foods Ltd of Nairobi.', 'Delivery by 15 November 2026 at the latest.',
    '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.'].join('\n');
  test('4a a box typed over, and an empty box written in, are both fills — named by the file\'s own name and by the words in front', () => {
    const w = world();
    const r = w.outsideCompare(w.outsideAgreedParas(C), SIGNED_FORM);
    assert.equal(r.same, true, JSON.stringify(r.changed));
    /* a list born inside the world has that realm's Array — compared as text */
    assert.equal(JSON.stringify((r.fills || []).map(f => [f.name, f.text])),
      JSON.stringify([['Buyer name', 'Kijani Foods Ltd'], ['Delivery by', '15 November 2026']]));
  });
  test('4b [wall] the agreed words do not move: a box keeps its prompt in the text the check compares', () => {
    const w = world();
    const texts = w.outsideAgreedParas(C).map(p => p.text);
    assert.ok(texts.includes('The Buyer is Click or tap here to enter text. of Nairobi.'), JSON.stringify(texts));
  });
  test('4c an empty box — Word pads it with spaces — reads as a ruled line, which is what it is on the page', () => {
    const w = world();
    const texts = w.outsideAgreedParas(C).map(p => p.text);
    assert.ok(texts.includes('Delivery by ___ at the latest.'), JSON.stringify(texts));
  });
});
