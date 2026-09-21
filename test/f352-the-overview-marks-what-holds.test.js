/* f352 — BEFORE SIGNING, THE OVERVIEW MARKS THE FIELDS THAT HOLD IT
   ============================================================================
   Young, 21 September 2026: *"before signing, critical fields in the overview
   page have to be highlighted before signing so that user can go back and fill
   them in."*

   THE WHOLE DESIGN IS THAT "CRITICAL" IS NOT A NEW LIST. Before you sign
   already knows exactly what is missing; what it could not do was say it where
   the field actually is, so a reader had to hold a list in their head and walk
   back to the Overview to act on it. signFieldMarks TRANSLATES rows that
   already exist into the field each one is about — it decides nothing, counts
   nothing of its own, and cannot end up printing a different number from the
   list it reads.

   WHAT THIS FILE PINS
     · the marks are signReadiness' own rows, not a second judgement
     · a DRAFT is never marked — an amber "needed to sign" on every blank of a
       brand-new agreement is an alarm about work nobody has started
     · a hold outranks a note on one field: one cell, one mark
     · a hold is a DOOR and it is focusKeyTerms — the same act as the signing
       list's own "Fix on Overview"
     · one reading behind the marks and the count on the head
     · every cell reserves its line for the whole signing phase, so a mark
       appearing or clearing moves nothing

   Run: node --test test/f352-the-overview-marks-what-holds.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const SIGNCHECK = read('js/signcheck.js');
const SECTION = read('js/section.js');
const I18N = read('js/i18n.js');

const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

/* A world that can answer signReadiness. js/signcheck.js reads the blockers
   and the scan through window, so the two the Overview's own marks rest on are
   supplied as the only answers these contracts give. */
const markWorld = (opts) => {
  const w = buildWorld({ contractView: true, metadata: true, signcheck: true });
  w.win.isMonetary = c => (c && c.valueType) !== 'none';
  w.win.fmtMoneyOf = c => 'SEK ' + Number((c && c.value) || 0).toLocaleString('en');
  w.win.openFindings = () => [];
  w.win.canViewValues = () => true;
  w.win.signBlockers = ((opts && opts.blockers) || (() => []));
  return w;
};
const live = () => ({ id: 'MK-600', name: 'Nordwind supply', status: 'Under Review',
  value: 4200000, audit: [], obligations: [], comments: [], metadata: {} });

/* ============================================================================
   1 · THE MARKS ARE THE CHECK'S OWN ROWS
   ==========================================================================*/
describe('f352 (1) critical is not a new list', () => {
  test('signFieldMarks reads signReadiness and judges nothing itself', () => {
    const b = fnBody(SIGNCHECK, 'signFieldMarks');
    assert.ok(b, 'the reading is there');
    assert.ok(/signReadiness\(c\)/.test(b), 'it reads the one list');
    /* NO SECOND JUDGEMENT: no threshold, no severity of its own, no field list
       beyond the translation of a row's kind into the field it is about. */
    assert.ok(!/playbook|openFindings|obligation|>=|MIN\b/.test(b),
      'it makes no judgement of its own');
  });

  test('a hold outranks a note on the same field — one cell, one mark', () => {
    const b = fnBody(SIGNCHECK, 'signFieldMarks');
    assert.ok(/mark\.holds && !cur\.holds/.test(b), 'the more serious one wins');
  });

  test('and the count on the head is the same reading', () => {
    const b = fnBody(CONTRACT, 'ktOverviewTermsHtml');
    assert.ok(/ovSignMarks\(c\)/.test(b), 'asked once');
    assert.ok(/marks\.fields/.test(b) && /holds/.test(b),
      'and counted off the marks themselves, never re-derived');
    assert.ok(/i18tn\('ov_hold_n'/.test(b), 'printed as the head’s own chip');
  });
});

/* ============================================================================
   2 · DRIVEN — who is marked and who is not
   ==========================================================================*/
describe('f352 (2) a draft is a form, not a contract waiting on you', () => {
  test('nothing is marked while it is a Draft', () => {
    const { win } = markWorld({ blockers: () => [{ key: 'value', label: 'Add the contract value' }] });
    const c = live(); c.status = 'Draft';
    const m = win.signFieldMarks(c);
    assert.equal(m.live, false, 'the phase has not started');
    assert.equal(m.n, 0, 'and nothing is marked');
    assert.equal(win.ovSignMarks(c), null, 'so the card draws no line at all');
  });

  test('past Draft, a holding blocker marks its own field', () => {
    const { win } = markWorld({ blockers: () => [{ key: 'value', label: 'Add the contract value' }] });
    const c = live();
    const m = win.signFieldMarks(c);
    assert.ok(m.live, 'the phase has started');
    assert.ok(m.fields.value, 'the value is marked');
    assert.equal(m.fields.value.holds, true, 'and it holds');
    assert.equal(m.holds, 1);
  });

  test('a sealed record is never marked', () => {
    const { win } = markWorld({ blockers: () => [{ key: 'value', label: 'Add the contract value' }] });
    const c = live(); c.status = 'Signed';
    assert.equal(win.signFieldMarks(c).live, false, 'a signed contract is finished');
  });

  test('the record disagreeing with the paper is a note, not a hold', () => {
    const { win } = markWorld({ blockers: () => [] });
    const c = live();
    /* The wording says one counterparty and the record another. */
    c.counterparty = 'Nordwind GmbH';
    c.metadata.counterparty = 'Nordwind Holdings AB';
    const m = win.signFieldMarks(c);
    assert.ok(m.fields.counterparty, 'the field is marked');
    assert.equal(m.fields.counterparty.holds, false, 'but it does not hold under the default gate');
    assert.equal(m.noted, 1);
  });
});

/* ============================================================================
   3 · DRIVEN — what the card draws
   ==========================================================================*/
describe('f352 (3) the mark is a door, and it is the one that already exists', () => {
  test('a hold draws a real button carrying the field it is about', () => {
    const { win } = markWorld({ blockers: () => [{ key: 'value', label: 'Add the contract value' }] });
    const c = live();
    const grid = win.ktDealFactsHtml(c);
    assert.ok(/<button type="button" class="sec-f-n is-hold" data-ov-fix="value"/.test(grid),
      'a real button, not a div somebody listens to');
    assert.ok(grid.includes(win.i18t('ov_needed_to_sign')), 'and it says what it is');
  });

  test('pressing it is focusKeyTerms — the signing list’s own act', () => {
    const b = fnBody(CONTRACT, 'renderKeyTerms');
    assert.ok(/data-ov-fix/.test(b), 'the door is wired where it is painted');
    assert.ok(/focusKeyTerms\(live,f\)/.test(b), 'through the one act');
    /* TWO PLACES, ONE ACT: the signing list's own Fix on Overview presses the
       same function, with the same field name. */
    assert.ok(/data-sc-fix[\s\S]{0,120}focusKeyTerms\(c, b\.getAttribute\('data-sc-fix'\)\)/.test(CONTRACT),
      'and so does Before you sign');
  });

  test('a note is a sentence, never a door', () => {
    const { win } = markWorld({ blockers: () => [] });
    const c = live();
    c.counterparty = 'Nordwind GmbH';
    c.metadata.counterparty = 'Nordwind Holdings AB';
    const rec = win.ktRecordFactsHtml(c);
    assert.ok(/<span class="sec-f-n" title=/.test(rec), 'it is said, not offered');
    assert.ok(!/data-ov-fix="counterparty"/.test(rec), 'there is nothing to press');
  });

  test('every cell reserves the same line for the whole signing phase', () => {
    const { win } = markWorld({ blockers: () => [{ key: 'value', label: 'Add the contract value' }] });
    const grid = win.ktDealFactsHtml(live());
    const cells = (grid.match(/class="sec-f"/g) || []).length;
    const lines = (grid.match(/class="sec-f-n/g) || []).length;
    assert.equal(lines, cells, 'one line per cell, marked or not');
    /* AND A CONTRACT NOBODY IS WAITING ON DRAWS NONE, so the card a reader
       sees every day is exactly what it was. */
    const { win: w2 } = markWorld({ blockers: () => [] });
    const draft = live(); draft.status = 'Draft';
    assert.equal((w2.ktDealFactsHtml(draft).match(/sec-f-n/g) || []).length, 0,
      'a draft keeps its old shape to the byte');
  });

  test('the marks stand down in the edit posture [CONTROL]', () => {
    /* The boxes ARE the way to answer them; an amber wash round a field
       somebody is typing in is shouting about the work they are doing. */
    const { win } = markWorld({ blockers: () => [{ key: 'value', label: 'Add the contract value' }] });
    const ed = win.ktDealFactsHtml(live(), { edit: true });
    assert.ok(!/is-hold/.test(ed), 'nothing is marked while it is being filled in');
  });
});

/* ============================================================================
   4 · THE SHAPE IT RESTS ON
   ==========================================================================*/
describe('f352 (4) the line is opt-in, so five other screens did not move', () => {
  test('a caller that passes no note gets the markup it had', () => {
    const { win } = buildWorld({});
    const plain = win.sectionFieldHtml('Label', 'Value');
    assert.ok(!/sec-f-n/.test(plain), 'no line where none was asked for');
    const reserved = win.sectionFieldHtml('Label', 'Value', '', '', '');
    assert.ok(/<span class="sec-f-n"><\/span>/.test(reserved), 'an empty note still reserves it');
  });

  test('the cell is dressed by :has, so the builder learns no class', () => {
    const HTML = read('index.html');
    assert.ok(/\.sec-f:has\(\.sec-f-n\.is-hold\)/.test(HTML), 'the cell reads its own line');
    assert.ok(/\.sec-f-n\{[^}]*min-height/.test(HTML.replace(/\s+/g, ' ')),
      'and the line is reserved whether or not it says anything');
  });

  test('every new key is in both books', () => {
    for (const k of ['ov_needed_to_sign', 'ov_paper_differs', 'ov_paper_says',
      'ov_hold_n_one', 'ov_hold_n_other']) {
      const n = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, k + ' is in both books exactly once');
    }
  });

  test('and every new name is published', () => {
    const { win } = markWorld({});
    for (const n of ['signFieldMarks', 'SIGN_FIELD_OF', 'ovSignMarks', 'ovFieldMarkOf',
      'ovFieldNoteHtml', 'OV_MARK_ALIAS'])
      assert.ok(win[n] != null, n + ' is reachable');
    assert.ok(/signFieldMarks/.test(SIGNCHECK.slice(SIGNCHECK.indexOf('Object.assign(window'))),
      'the reading is on the publish list');
    assert.ok(/f\[4\]/.test(SECTION), 'and the field builder passes the fifth element through');
  });
});
