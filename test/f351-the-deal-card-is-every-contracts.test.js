/* f351 — THE DEAL CARD IS EVERY CONTRACT'S, AND EVERY FIELD CAN BE TYPED
   ============================================================================
   Young, 21 September 2026: *"the deal card in the overview page is very sales
   dimensional. The fields there should be ones that are found in most contracts
   no matter the type of contract. Also then you try to edit the details, you
   should be able to edit all fields."* Then, of the three questions that came
   back: *"narrow only, only where something is recorded, take all three."*

   MEASURED BEFORE A LINE MOVED: the deal card drew fifteen fields, FIVE of them
   (the volume rebate, its tier ladder, the price review, the rejection window
   and exclusivity) terms that exist only in a supply or distribution agreement;
   and `Edit these details` opened FOUR boxes against those fifteen values, so a
   term Copilot read wrong could not be put right by hand.

   WHAT THIS FILE PINS
     · the three terms nearly every agreement has are on the record AND in the
       extractor's own schema — a field nothing fills is a dash for ever
     · the fixed grid carries no supply-only term, and the five are not lost:
       they are the occasional group, drawn where the contract records them
     · "only where something is recorded" is the WHOLE rule — no guess is made
       about the kind of contract, and the group can never be a row of dashes
     · every field on both groups is a box in the edit posture, bar the one
       that is DERIVED from two others
     · the four with a home of their own keep it, so nothing writes a value or
       a notice period twice
     · the trail keeps English, derived from the key so it cannot drift

   Run: node --test test/f351-the-deal-card-is-every-contracts.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const META = read('js/metadata.js');
const I18N = read('js/i18n.js');
const SERVER = read('server/server.js');

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
const listOf = name => {
  const m = new RegExp('const ' + name + ' = \\[[\\s\\S]*?\\];').exec(CONTRACT);
  return m ? m[0] : '';
};

/* THE OVERVIEW'S OWN STAGE. js/views/contract.js reads isMonetary and
   fmtMoneyOf as bare globals off js/core.js, which no harness world loads —
   so they are supplied here as the two answers this file's contracts give:
   an NDA carries no money. Every other reading on the card is the real one. */
const ovWorld = () => {
  const w = buildWorld({ contractView: true, metadata: true });
  w.win.isMonetary = c => (c && c.valueType) !== 'none';
  w.win.fmtMoneyOf = c => 'SEK ' + Number((c && c.value) || 0).toLocaleString('en');
  return w;
};

const NEW_THREE = ['confidentiality', 'disputes', 'assignment'];
const SUPPLY_ONLY = ['volumeRebate', 'rebateTiers', 'priceReview',
  'rejectionWindowDays', 'exclusivity'];

/* ============================================================================
   1 · THE THREE TERMS NEARLY EVERY AGREEMENT HAS
   ==========================================================================*/
describe('f351 (1) confidentiality, disputes and assignment are on the record', () => {
  test('all three are fields, and each has the type its answer needs', () => {
    const { win } = buildWorld({ metadata: true });
    const by = Object.fromEntries((win.META_FIELDS || []).map(f => [f.k, f]));
    for (const k of NEW_THREE) assert.ok(by[k], k + ' is a metadata field');
    /* TEXT, because the paper's own words are the useful answer: "5 years from
       disclosure" on one contract and "perpetual for trade secrets" on the
       next; a dispute clause names a forum AND an institution. */
    assert.equal(by.confidentiality.type, 'text', 'confidentiality is as the paper writes it');
    assert.equal(by.disputes.type, 'text', 'so is the dispute clause');
    /* ASSIGNMENT really is a short closed list, and it is the one of the three
       a reader would want to count. */
    assert.equal(by.assignment.type, 'select', 'assignment is a closed list');
    assert.deepEqual(by.assignment.opts, ['consent', 'free', 'prohibited', 'unclear']);
  });

  test('every option has a name in both books, and none collides', () => {
    const { win } = buildWorld({ metadata: true });
    for (const v of ['consent', 'free', 'prohibited', 'unclear'])
      assert.ok(win.metaOptLabel(v) && win.metaOptLabel(v) !== v,
        v + ' is named, not printed raw');
    for (const k of ['me_confidentiality', 'me_disputes', 'me_assignment',
      'mo_assign_consent', 'mo_assign_free', 'mo_assign_prohibited']) {
      const n = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, k + ' is in both books exactly once');
    }
    /* META_OPT_LABEL is keyed by VALUE across every field, which is why the
       price option is 'nochange' and not 'fixed'. A collision would rename
       another field's answer. */
    const opts = (win.META_FIELDS || []).flatMap(f => f.opts || []);
    const dupes = opts.filter((v, i) => opts.indexOf(v) !== i);
    const bad = dupes.filter(v => ['consent', 'free', 'prohibited'].includes(v));
    assert.deepEqual(bad, [], 'assignment’s options are its own');
  });

  test('and the extractor is told to look for them — a field nothing fills is a dash for ever', () => {
    for (const k of NEW_THREE) {
      assert.ok(new RegExp('\\b' + k + ': \\{').test(SERVER), k + ' is in the tool schema');
      assert.ok(new RegExp('\\b' + k + ': conf').test(SERVER), k + ' carries a confidence');
      assert.ok(new RegExp('\\b' + k + ': span').test(SERVER), k + ' carries a source span');
    }
    /* SILENCE IS AN ANSWER: an agreement really can have no confidentiality
       clause, and "standard confidentiality applies" is not something the
       document said. */
    assert.ok(/no confidentiality clause at all, confidentiality is empty/.test(SERVER),
      'the prompt says empty is a real answer');
  });
});

/* ============================================================================
   2 · THE FIXED GRID CARRIES NOTHING THAT BELONGS TO ONE KIND OF CONTRACT
   ==========================================================================*/
describe('f351 (2) the deal card is every contract’s', () => {
  test('no supply-only term is on the fixed list, and all five are on the other', () => {
    const deal = listOf('OV_DEAL_FIELDS'), also = listOf('OV_ALSO_FIELDS');
    assert.ok(deal && also, 'both lists are declared');
    for (const k of SUPPLY_ONLY) {
      assert.ok(!deal.includes(k), k + ' is not drawn on every contract');
      assert.ok(also.includes(k), k + ' is still on the page, where it is recorded');
    }
    for (const k of NEW_THREE) assert.ok(deal.includes(k), k + ' is on every contract');
  });

  test('nothing guesses the kind of contract to decide what to print [CONTROL]', () => {
    /* A card headed "Terms for a supply agreement" on a record whose type HaTi
       read wrong is worse than no card — and it is a guess the product does not
       have to make, because the record already says which terms are answered. */
    /* A NAMED CONTROL: it passes at the parent too, where neither function
       exists and fnBody answers null — which is the point. It is here so that
       the rule cannot be broken later by a card that reads cKind to decide
       whether to draw itself. */
    const b = String(fnBody(CONTRACT, 'ktAlsoRecorded')) + String(fnBody(CONTRACT, 'ktAlsoFactsHtml'));
    assert.ok(!/contractType|cKind|category/.test(b),
      'the occasional group reads answers, never a contract kind');
  });
});

/* ============================================================================
   3 · DRIVEN — only where something is recorded
   ==========================================================================*/
const bare = () => ({ id: 'MK-500', name: 'A mutual NDA', status: 'Draft',
  valueType: 'none', audit: [], obligations: [], comments: [], metadata: {} });

describe('f351 (3) the occasional group is drawn only where it is answered', () => {
  test('a contract with none of them draws no card at all', () => {
    const { win } = ovWorld();
    const c = bare();
    assert.deepEqual(win.ktAlsoRecorded(c), [], 'nothing is recorded');
    assert.equal(win.ktAlsoFactsHtml(c), '', 'so there is nothing to draw');
    const html = win.ktOverviewTermsHtml(c, { editable: false });
    assert.ok(!/ov-also|Also recorded/i.test(html) && !html.includes(win.i18t('ov_also')),
      'and no card is drawn for it');
  });

  test('record one and the card appears, holding only that one', () => {
    const { win } = ovWorld();
    const c = bare();
    c.metadata.exclusivity = 'exclusive';
    assert.deepEqual(win.ktAlsoRecorded(c), ['exclusivity']);
    const body = win.ktAlsoFactsHtml(c);
    assert.ok(body.includes(win.metaOptLabel('exclusive')), 'it prints the answer');
    /* THE OWNER'S THIRD RULING: that group may never be a row of em-dashes. */
    assert.equal((body.match(/is-none/g) || []).length, 0,
      'and draws no field nobody has answered');
    for (const k of ['volumeRebate', 'rebateTiers', 'warrantyMonths'])
      assert.ok(!body.includes(win.ovMetaLabel(k)), k + ' is not drawn');
  });

  test('a zero is not an answer, which is how every other reader treats it', () => {
    const { win } = ovWorld();
    const c = bare();
    c.metadata.retentionPct = 0;
    c.metadata.warrantyMonths = '';
    assert.deepEqual(win.ktAlsoRecorded(c), [], '0 means "none stated"');
    c.metadata.retentionPct = 10;
    assert.deepEqual(win.ktAlsoRecorded(c), ['retentionPct']);
  });

  test('but a field in the FIXED grid still prints its dash', () => {
    /* His ruling, and the two halves are deliberately different: "nobody has
       answered this" is worth knowing about a term every contract has. */
    const { win } = ovWorld();
    const grid = win.ktDealFactsHtml(bare());
    assert.ok((grid.match(/is-none/g) || []).length >= 6,
      'the universal terms say when they are unanswered');
    assert.ok(grid.includes(win.ovMetaLabel('confidentiality')), 'confidentiality is on it');
  });
});

/* ============================================================================
   4 · DRIVEN — every field can be typed
   ==========================================================================*/
describe('f351 (4) edit these details opens every field', () => {
  test('each field on both lists is a box, and the derived one is not', () => {
    const { win } = ovWorld();
    const c = bare();
    const deal = win.ktDealFactsHtml(c, { edit: true });
    const also = win.ktAlsoFactsHtml(c, { edit: true });
    const boxes = (deal + also).match(/data-kt="[a-zA-Z]+"|data-ktm="[a-zA-Z]+"/g) || [];
    const names = new Set(boxes.map(b => b.split('"')[1]));
    for (const k of win.OV_DEAL_FIELDS.concat(win.OV_ALSO_FIELDS)) {
      if (win.OV_DERIVED_FIELDS.has(k)) {
        assert.ok(!names.has(k), k + ' is worked out from the dates, never typed');
        continue;
      }
      assert.ok(names.has(k), k + ' can be typed');
    }
  });

  test('the four with a home of their own keep it', () => {
    /* They are not metadata rows: the value strips its own thousand
       separators, and an empty notice period DELETES rather than storing a
       zero. A generic box would lose both. */
    const { win } = ovWorld();
    const deal = win.ktDealFactsHtml(bare(), { edit: true });
    for (const k of ['value', 'effDate', 'expiry', 'notice']) {
      assert.ok(deal.includes('data-kt="' + k + '"'), k + ' keeps its own writer');
      assert.ok(!deal.includes('data-ktm="' + k + '"'), k + ' is not also a metadata box');
    }
  });

  test('a closed list is a select whose empty option clears it', () => {
    const { win } = ovWorld();
    const c = bare(); c.metadata.assignment = 'consent';
    const box = win.ovMetaBoxHtml(c, 'assignment');
    assert.ok(/^<select /.test(box), 'a list is a list');
    assert.ok(box.includes('value=""'), 'clearing a term is an answer');
    assert.ok(/value="consent" selected/.test(box), 'and it opens on what is stored');
  });

  test('at rest nothing on the card is a box', () => {
    const { win } = ovWorld();
    const c = bare(); c.metadata.exclusivity = 'exclusive';
    const rest = win.ktDealFactsHtml(c) + win.ktAlsoFactsHtml(c);
    assert.ok(!/<input|<select/.test(rest), 'the resting card is a reading');
  });
});

/* ============================================================================
   5 · WHAT THE WRITER DOES, AND WHAT THE TRAIL SAYS
   ==========================================================================*/
describe('f351 (5) typing over a reading wins, and says who did it', () => {
  test('one handler for all of them, driven by the field’s own type', () => {
    const w = fnBody(CONTRACT, 'wireKeyTerms');
    assert.ok(/querySelectorAll\('\[data-ktm\]'\)/.test(w), 'one sweep, every box');
    assert.ok(/META_FIELDS\|\|\[\]\)\.find/.test(w), 'the type comes from the field set');
    /* A number box driven by `input` stores 9 on the way to 90 — the notice
       period's own rule, restated for every field that is not free text.
       RE-POINTED IN PLACE 22 Sep 2026: this pinned the ternary's own spelling,
       and the contract-type picker made the question the ELEMENT's as well as
       the type's — a `picks` field is free text on the record and a SELECT on
       the screen, and a select answers on `change`. The CLAIM is unchanged and
       is asked as the relation instead. */
    /* PIN THE REGION: wireKeyTerms carries TWO `const evt=` lines — the four
       fields with a home of their own have one too — so this is asked of the
       metadata sweep's own, not of whichever comes first in the file. */
    const at = w.indexOf("querySelectorAll('[data-ktm]')");
    const a2 = w.indexOf('const evt=', at);
    const evt = w.slice(a2, w.indexOf(';', a2));
    assert.ok(/'input'/.test(evt) && /'change'/.test(evt), 'the event is chosen, not assumed');
    assert.ok(/f\.type[!=]==?'text'/.test(evt),
      'only free text writes on every keystroke');
    assert.ok(/tagName==='SELECT'/.test(evt),
      'and a select answers on change whatever its field says');
  });

  test('an empty box clears the field rather than storing a zero', () => {
    const w = fnBody(CONTRACT, 'wireKeyTerms');
    assert.ok(/delete c\.metadata\[key\]/.test(w) && /delete c\.metadata\.confidence\[key\]/.test(w),
      'both the value and its confidence go');
    assert.ok(/confidence\[key\]='high'/.test(w),
      'and an answer somebody typed is read from the record from then on');
  });

  test('the trail keeps English, derived from the key so it cannot drift', () => {
    const { win } = buildWorld({ metadata: true });
    assert.equal(win.metaEnName('paymentTerms'), 'payment terms');
    assert.equal(win.metaEnName('rejectionWindowDays'), 'rejection window days');
    const w = fnBody(CONTRACT, 'wireKeyTerms');
    assert.ok(/metaEnName\(key\)/.test(w), 'the audit line names the field through it');
    /* A SECOND TABLE OF ENGLISH NAMES WAS THE OTHER ANSWER AND IS THE WORSE
       ONE: two lists to keep in step, and the day they drift the trail names a
       field the product no longer has. */
    assert.ok(!/META_EN\b|META_ENGLISH/.test(META), 'no second list of names');
  });

  test('every new name is published', () => {
    const { win } = ovWorld();
    for (const n of ['ktDealFactsHtml', 'ktAlsoFactsHtml', 'ktAlsoRecorded', 'ktFieldCell',
      'OV_DEAL_FIELDS', 'OV_ALSO_FIELDS', 'ovMetaBoxHtml', 'ovMetaLabel'])
      assert.ok(win[n] != null, n + ' is reachable from another module');
    assert.ok(buildWorld({ metadata: true }).win.metaEnName, 'and so is the English name');
  });
});
