/* f480 — ONE QUESTION SET, ONE ARRIVAL (the process review, 4 Oct 2026)
   ============================================================================
   Whether you were asked "which side of the money" depended on which door
   you came through: the wizard and the essentials form asked it, the
   saved-template fill never did. And two creation doors — the upload and the
   amendment — did not arrive through contractArrived, so Copilot did not read
   them and nobody named on the way in was claimed. An amendment was minted
   worth 0, which the readiness check took as an answer.

   WHAT THIS FILE PINS
     (1) the saved-template fill asks the SAME side field, borrowed by
         reference from CONTRACT_ESSENTIALS, and the answer reaches the record
     (2) the upload and the amendment arrive through contractArrived; the
         upload's tick-box still governs its reading, the amendment still
         lands on its Document tab
     (3) an amendment's value is empty, not nought

   Run: node --test test/f480-one-question-set.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); } catch(_){ return ''; } };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return '';
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0){ const ch = src[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
  return src.slice(m.index, i);
};
const LIB = read('js/views/library.js');

describe('f480 (1) the saved-template fill asks which side of the money', () => {
  test('the field is the essentials\' own, not a copy', () => {
    const fill = strip(fnBody(LIB, 'openTemplateFillModal'));
    assert.match(fill, /CONTRACT_ESSENTIALS\.find\(f=>f\.key==='side'\)/);
    assert.match(fill, /id="tf-side"/);
    assert.match(fill, /fs\.some\(f=>f\.maps==='category'\)/, 'and a template that asks it itself is not asked twice');
  });
  test('the answer is carried to the record through the same field', () => {
    const fill = strip(fnBody(LIB, 'openTemplateFillModal'));
    assert.match(fill, /buildFromCustomTemplate\(t, values, \{ counterpartyEmail:cpEmail\.trim\(\), party, folder, side \}\)/);
    const build = strip(fnBody(LIB, 'buildFromCustomTemplate'));
    assert.match(build, /applyTemplateValues\(c, \[sideF\], \{ side:opts\.side \}\)/);
  });
});

describe('f480 (2) every creation door arrives', () => {
  test('the upload arrives, with the tick-box\'s answer', () => {
    const up = strip(fnBody(read('js/views/contract.js'), 'submitUpload'));
    assert.match(up, /contractArrived\(c,\{ read:wantTriage \}\)/);
    assert.match(fnBody(read('js/triage.js'), 'contractArrived'), /o\.read === false\) return false/);
  });
  test('the amendment arrives, and still does not land on Key terms', () => {
    const fam = strip(read('js/family.js'));
    assert.match(strip(fnBody(fam, 'createAmendment')), /contractArrived\(c\)/);
    assert.ok(!/roomOpenOnTerms\s*\(/.test(fam));
  });
  test('an unticked upload claims and adopts but reads nothing', () => {
    const world = buildWorld({ participants: true, triage: true });
    const win = world.win;
    let read = 0;
    win.triageAndPaint = () => { read++; };
    assert.equal(typeof win.contractArrived, 'function', 'the arrival door is on this stage');
    const c = { id: 'MK-480', counterparty: 'Juno', counterpartyEmail: 'a@juno.co.ke', status: 'Draft' };
    win.contractArrived(c, { read: false });
    assert.equal(read, 0, 'no box, no reading');
    assert.equal(win.contactEmail(c), 'a@juno.co.ke');
    assert.ok((c.participants || []).some(p => p.main), 'the address is in the book');
  });
});

describe('f480 (3) an amendment is worth what nobody has said yet', () => {
  test('value is empty on a monetary family and 0 on a non-monetary one', () => {
    const body = strip(fnBody(read('js/family.js'), 'createAmendment'));
    assert.match(body, /value: \(parent\.valueType === 'none'\) \? 0 : null/);
  });
});
