/* f361 — THE CONTRACT TYPE IS A CHOICE, AND THE WORDS ARE THE PRODUCT'S OWN
   ============================================================================
   Young, 22 September 2026: *"make the contract type on the overview a dropdown
   too"* — the morning after the same ask for a party's role word.

   THE TWO ARE NOT THE SAME FIELD AND THIS FILE IS MOSTLY ABOUT WHY.

   A party's role word is what THE PAPER calls them, so a Swedish contract says
   "Leverantör" and offering Swedish words is right. `metadata.contractType` is
   a MATCHING KEY: playbookKeyFor lowercases it and runs it past the built-in
   type patterns, copilotPlaybookKey on the server mirrors that pass for pass,
   and f133 requires the two hosts to answer the same key. A translated word
   would match none of them and take the baseline book instead of the right
   one, in silence. So the words offered here are English and come off
   TEMPLATES — the SAME words cKind writes onto every drafted contract.

   WHAT THIS FILE PINS
     · the field is still FREE TEXT on the record, so the extraction review and
       the upload confirm — which both branch on `type` — are untouched, and a
       reading off the paper can still be corrected there in any words at all
     · the picker OFFERS and never REFUSES: a blank leads, whatever is already
       on the record leads the words where it is not one of them, and a last
       row types the document's own words
     · every word offered resolves to a real playbook — none of the twelve
       falls through to the baseline by accident
     · the fallback literal has not drifted from js/templates.js
     · A SENTINEL NEVER REACHES THE RECORD

   18 of the 20 claims are RED at the parent. The two that pass are marked
   [wall]: contractType was free text before and must stay so, and there were
   no translated type words to find. Both would go red the day somebody
   reversed this, which is what they are for.

   Run: node --test test/f361-the-contract-type-is-a-choice.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const META = read('js/metadata.js');
const CONTRACT = read('js/views/contract.js');
const I18N = read('js/i18n.js');
const TPL = read('js/templates.js');

/* READ CODE, NOT PROSE — this file's notes name the very things some claims
   assert the absence of. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* The one function on the screen that draws a metadata box. PIN THE REGION:
   from its own `function` to the next one at column zero. */
function region(src, name) {
  const a = src.indexOf('function ' + name + '(');
  assert.ok(a > 0, name + ' was found');
  const b = src.indexOf('\nfunction ', a + 1);
  return src.slice(a, b > a ? b : src.length);
}

/* ============================================================================
   1 · THE FIELD IS STILL FREE TEXT, AND IT OFFERS WORDS
   ==========================================================================*/
describe('f361 (1) free text on the record, a list on the screen', () => {
  test('[wall] contractType keeps type "text" — the other two screens branch on that', () => {
    const { win } = buildWorld({ metadata: true });
    const f = (win.META_FIELDS || []).find(x => x.k === 'contractType');
    assert.ok(f, 'contractType is a metadata field');
    /* THE WALL. openMetaReview and the upload confirm both do
       `if(f.type==='select')`; turning this into a select would make those two
       screens DROP whatever Copilot read when it is off the list. */
    assert.equal(f.type, 'text', 'the record still takes any words at all');
    assert.ok(!f.opts, 'and it is not a closed list');
  });

  test('and it carries `picks` — words to offer, which is a different thing', () => {
    const { win } = buildWorld({ metadata: true });
    const f = (win.META_FIELDS || []).find(x => x.k === 'contractType');
    assert.ok(Array.isArray(f.picks) && f.picks.length >= 12,
      'the twelve words are offered');
    /* category is the closed list beside it and must not have grown one. */
    const cat = (win.META_FIELDS || []).find(x => x.k === 'category');
    assert.ok(!cat.picks, 'a closed list does not need offering');
  });

  test('no other field grew a picks list by accident', () => {
    const { win } = buildWorld({ metadata: true });
    const withPicks = (win.META_FIELDS || []).filter(f => f.picks).map(f => f.k);
    assert.deepEqual(withPicks, ['contractType'],
      'exactly one field offers words today');
  });
});

/* ============================================================================
   2 · THE WORDS ARE THE PRODUCT'S OWN, AND ENGLISH FOR A REASON
   ==========================================================================*/
describe('f361 (2) the words come off TEMPLATES', () => {
  test('the fallback literal has not drifted from js/templates.js', () => {
    const { win } = buildWorld({ metadata: true });
    const kinds = [];
    const re = /^\s*[A-Z]{2}:\{ id:'[A-Z]{2}', name:'[^']*', kind:'([^']*)'/gm;
    for (let m; (m = re.exec(TPL));) if (!kinds.includes(m[1])) kinds.push(m[1]);
    assert.ok(kinds.length >= 12, 'the template kinds were read');
    /* A NO-DRIFT WALL, not a pin on any particular string: the literal is the
       fallback for a stage without js/templates.js, and a fallback that says
       something else is a second vocabulary. */
    assert.deepEqual([...(win.CONTRACT_TYPE_FALLBACK || [])], kinds,
      'the fallback is exactly what TEMPLATES says');
  });

  test('a stage without templates.js still answers, from that fallback', () => {
    const { win } = buildWorld({ metadata: true });
    assert.ok(!win.TEMPLATES, 'this stage really has no template table');
    assert.deepEqual(win.contractTypeKinds(), [...win.CONTRACT_TYPE_FALLBACK],
      'and the reading still answers the twelve');
  });

  test('the reading asks TEMPLATES, so a thirteenth template is offered too', () => {
    const src = strip(META);
    const a = src.indexOf('function contractTypeKinds');
    const body = src.slice(a, src.indexOf('\n}', a));
    assert.ok(/TEMPLATES/.test(body), 'the twelve are read, not typed');
    assert.ok(/\.kind/.test(body), "off each template's own kind column");
  });

  test('EVERY word offered resolves to a real playbook — none lands on the baseline', () => {
    /* THIS IS THE CLAIM THE ENGLISH CHOICE RESTS ON. Staged the way f133
       stages it: playbookKeyFor asks contractTypeRead and CKIND_SAYS_NOTHING,
       which live in js/core.js, and a mirror test measuring the FALLBACK is
       measuring the wrong thing. These are core.js's own two lines. */
    const { win } = buildWorld({ standards: true, metadata: true });
    win.cKind = () => 'External Document';
    win.CKIND_SAYS_NOTHING = /^(external document|contract)$/i;
    win.contractTypeRead = c => {
      const k = String((c ? win.cKind(c) : '') || '').trim();
      if (k && !win.CKIND_SAYS_NOTHING.test(k)) return k;
      return String(((c && c.metadata) || {}).contractType || '').trim() || k;
    };
    const got = {};
    for (const w of win.contractTypeKinds()) {
      /* An UPLOAD with no template and no value stream, which is the contract
         this picker exists for: with nothing read, the key would be
         '_default', so anything else is the word doing the work. */
      got[w] = win.playbookKeyFor({
        id: 'X', source: 'upload', template: null, folder: null,
        metadata: { contractType: w } });
    }
    const baseline = Object.keys(got).filter(w => got[w] === '_default');
    assert.deepEqual(baseline, [],
      'these offered words match no playbook pattern: ' + baseline.join(', '));
    /* And the control: a contract nobody read still takes the baseline, so the
       claim above is about the words and not about the stage. */
    assert.equal(win.playbookKeyFor({
      id: 'X', source: 'upload', template: null, folder: null, metadata: {} }),
    '_default', '[control] nothing read is still the baseline');
  });
});

/* ============================================================================
   3 · IT OFFERS AND NEVER REFUSES
   ==========================================================================*/
describe('f361 (3) whatever is on the record is kept', () => {
  test('an off-list reading LEADS the list rather than being lost', () => {
    const { win } = buildWorld({ metadata: true });
    const out = win.metaPickOptions(win.contractTypeKinds(), 'Master Services Agreement');
    assert.equal(out[0].v, 'Master Services Agreement',
      "Copilot's own reading is the first thing offered");
    assert.equal(out.length, win.contractTypeKinds().length + 1);
  });

  test('a word already on the list is not offered twice', () => {
    const { win } = buildWorld({ metadata: true });
    const n = win.contractTypeKinds().length;
    assert.equal(win.metaPickOptions(win.contractTypeKinds(), 'NDA').length, n);
    /* FOLDED, because the paper and the picker need not agree on capitals. */
    assert.equal(win.metaPickOptions(win.contractTypeKinds(), 'nda').length, n);
  });

  test('nothing on the record adds nothing', () => {
    const { win } = buildWorld({ metadata: true });
    const n = win.contractTypeKinds().length;
    for (const v of ['', '   ', null, undefined])
      assert.equal(win.metaPickOptions(win.contractTypeKinds(), v).length, n,
        JSON.stringify(v) + ' is not a word');
  });

  test('the box is a select, the blank leads and the last row types your own', () => {
    const box = region(CONTRACT, 'ovMetaBoxHtml');
    const a = box.indexOf('if(f.picks)');
    assert.ok(a > 0, 'the picks branch is drawn');
    const b = box.indexOf('if(f.type===', a);
    const branch = box.slice(a, b > a ? b : box.length);
    assert.ok(/<select /.test(branch), 'it is a select');
    assert.ok(/metaPickOptions/.test(branch),
      'and it asks the one reading, not a second copy');
    /* THE BLANK LEADS — clearing a term is an answer, which is the rule the
       closed-list branch beside it already states. */
    assert.ok(branch.indexOf('<option value=""') < branch.indexOf('list.map('),
      'the empty option is written before the words');
    assert.ok(/META_PICK_OTHER/.test(branch) && /me_type_another/.test(branch),
      'and the last row is the one that types your own words');
  });
});

/* ============================================================================
   4 · A SENTINEL NEVER REACHES THE RECORD
   ==========================================================================*/
describe('f361 (4) the last row, and the wall behind it', () => {
  test('the handler asks the ELEMENT which event to listen for', () => {
    const w = strip(CONTRACT);
    const a = w.indexOf("document.querySelectorAll('[data-ktm]')");
    assert.ok(a > 0, 'the one handler was found');
    const body = w.slice(a, a + 2600);
    /* A `picks` field is text on the record and a SELECT on the screen, and a
       select answers on `change`. Asked of the tag, so the two cannot
       disagree — the old line asked the type alone. */
    assert.ok(/tagName==='SELECT'/.test(body),
      'the event follows the element, not only the type');
  });

  test('a cancelled name box writes nothing and puts the value back', () => {
    const w = strip(CONTRACT);
    const a = w.indexOf("document.querySelectorAll('[data-ktm]')");
    const body = w.slice(a, a + 2600);
    assert.ok(/promptNewName/.test(body), 'the last row opens the name box');
    /* THE WALL. There is no Save on this grid — every box writes as it is
       answered — so a cancel must return before anything is written. */
    const cancel = body.indexOf('if(!word)');
    const write = body.indexOf('c.metadata[key]=');
    assert.ok(cancel > 0 && write > cancel,
      'the cancel returns before the record is touched');
    assert.ok(/inp\.value\s*=\s*last;\s*return;/.test(body),
      'and the box goes back to what it was');
  });

  test('the sentinel is one word, published, and is not a type anybody drafts', () => {
    const { win } = buildWorld({ metadata: true });
    assert.equal(typeof win.META_PICK_OTHER, 'string');
    assert.ok(win.META_PICK_OTHER.startsWith('__'),
      'it cannot be mistaken for a word off the paper');
    assert.ok(!win.contractTypeKinds().includes(win.META_PICK_OTHER),
      'and it is never one of the words offered');
  });
});

/* ============================================================================
   5 · THE TWO NEW SENTENCES ARE IN BOTH BOOKS
   ==========================================================================*/
describe('f361 (5) both books', () => {
  test('me_type_another and me_type_ph are each in both books exactly once', () => {
    for (const k of ['me_type_another', 'me_type_ph']) {
      const n = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, k + ' is in both books exactly once');
    }
  });

  test('[wall] the WORDS offered are not translated — that is the whole ruling', () => {
    /* A per-word key would mean a Swedish workspace storing a Swedish word,
       which playbookKeyFor matches on and would silently take the baseline
       book for. If somebody adds one tomorrow, this fails. */
    for (const w of ['Raw Material Supply', 'Retail Listing', 'Professional Services'])
      assert.ok(!new RegExp("me_ctype_[a-z_]+: '" + w).test(I18N),
        w + ' is a record word and keeps English');
    const src = strip(META);
    const a = src.indexOf('const CONTRACT_TYPE_FALLBACK');
    const body = src.slice(a, src.indexOf('function metaPickOptions', a));
    assert.ok(!/i18t\(/.test(body),
      'nothing in the word list asks the dictionary');
  });
});
