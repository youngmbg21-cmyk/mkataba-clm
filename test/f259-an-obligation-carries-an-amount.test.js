/* f259 — AN OBLIGATION CARRIES AN AMOUNT (J-5.2)
   ========================================================================
   An obligation held a description, a due date, a cadence, an owner, a side
   and a completion record. **It could not hold a number.** So "Second tranche
   — KES 4,000,000" was prose: it could not be added up, charted, forecast or
   set against the contract's own value. Disbursement tracking is the market's
   word for the thing this one missing field prevented.

   WHAT IS PINNED:
     1  ONE field, blank by default, NEVER a zero — and absent means absent
     2  ONE arithmetic, asked by every surface
     3  the currency is the CONTRACT'S and is not stored beside it
     4  money obeys the product's EXISTING permission, not a new rule
     5  the dialog draws every field it drew before, with today's labels
     6  a band's sum rides the heading that already carries its count
     7  a cross-contract total CONVERTS and says what it left out
     8  obligations still never travel to the counterparty
     9  a record filed before this reads identically
    10  both languages */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const i18n = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const OB = read('js/obligations.js');
const OB_CODE = strip(OB);
const CSS = read('index.html');

const w = buildWorld({ obligations: true, intelView: true });
const win = w.win;

describe('f259 (1) — one field, and absent means absent', () => {
  test('blank by default and NEVER a zero', () => {
    /* A zero is a figure somebody typed; an obligation with no money on it
       must read as having none rather than as owing nothing. */
    assert.equal(win.obligationAmount({}), null);
    assert.equal(win.obligationAmount({ amount: '' }), null);
    assert.equal(win.obligationAmount({ amount: null }), null);
    assert.equal(win.obligationAmount({ amount: 'four million' }), null);
    assert.equal(win.obligationAmount({ amount: 4000000 }), 4000000);
    assert.equal(win.obligationAmount({ amount: '4000000' }), 4000000);
    assert.equal(win.obligationHasAmount({}), false);
    assert.equal(win.obligationHasAmount({ amount: 4000000 }), true);
  });

  test('an obligation saved without one carries NO amount key at all', () => {
    /* Which is what makes every record filed before this field existed read
       identically — there is nothing to migrate. */
    const save = OB_CODE.slice(OB_CODE.indexOf("const raw=(document.getElementById('of-amount')"));
    assert.match(save.slice(0, 300), /if\(raw!==''&&isFinite\(n\)&&n>0\) o\.amount=n;/,
      'the key is only written when a real figure was typed');
  });

  test('ONE arithmetic — a band sum and the foot ask the same function', () => {
    const rows = [{ o: { amount: 100 } }, { o: {} }, { o: { amount: 250 } }];
    assert.equal(win.obligationBandTotal(rows), 350, 'rows with no amount add nothing');
    assert.equal(win.obligationBandTotal([]), 0);
    assert.equal(win.obligationBandTotal([{ amount: 5 }, { amount: 7 }]), 12,
      'it takes a bare obligation as well as a row');
  });
});

describe('f259 (2) — the currency is the contract’s', () => {
  test('no currency is stored on the obligation', () => {
    /* A second currency beside the contract's own is a second answer that can
       drift from it. One contract, one currency. */
    const save = OB_CODE.slice(OB_CODE.indexOf('const o={ id:seed.id'), OB_CODE.indexOf('if(!o.desc)'));
    assert.ok(!/currency/.test(save), 'the save writes no currency');
    assert.match(OB_CODE, /contractCurrency\(c\)/, 'and the prefix reads the contract’s');
  });

  test('and the figure prints through the product’s own formatter', () => {
    assert.match(OB_CODE, /fmtMoneyShortIn\(n, contractCurrency\(c\)\)/);
  });
});

describe('f259 (3) — money obeys the permission the product already has', () => {
  test('it asks canViewValues and does not invent a rule', () => {
    assert.match(OB_CODE, /const obligationMoneyVisible = \(\) => \(typeof window\.canViewValues === 'function'\) \? !!canViewValues\(\) : true;/);
  });

  test('a reader without it sees NO amount, NO band sum and NO total', () => {
    /* NOT DRAWN AT ALL rather than drawn as dashes — the register's own
       convention, and the reason is that a column of dashes tells somebody a
       figure is being kept from them, which is a different message. */
    assert.match(OB_CODE, /\$\{money \? `<span class="obt-amt/, 'the tab column');
    assert.match(OB_CODE, /\$\{money \? `<td class="obw-amt/, 'the worklist column');
    assert.match(OB_CODE, /const foot = \(\(\) => \{\s*if\(!money\) return '';/, 'and the foot total');
    assert.match(OB_CODE, /\$\{obligationMoneyVisible\(\) \? `<label/, 'and the form’s own row');
  });

  test('and opening an obligation without the permission does not erase its figure', () => {
    /* The field is CARRIED FORWARD from the record rather than read off a
       control that is not on screen. */
    assert.match(OB_CODE, /if\(!obligationMoneyVisible\(\)\)\{\s*if\(seed\.amount!=null&&seed\.amount!==''\) o\.amount=Number\(seed\.amount\);/);
  });
});

describe('f259 (4) — the dialog draws everything it drew before', () => {
  const dlg = OB.slice(OB.indexOf('function openObligationForm'), OB.indexOf('async function runFindObligations'));
  test('every field, with today’s labels, in today’s order', () => {
    /* The first render of this dialog was drawn from intent rather than from
       the screen and got six things wrong — the worst being that it dropped
       the "Whose obligation is this?" toggle outright. */
    const order = ['ob_description', 'ob_due_date', 'ob_recurring', 'ob_amount', 'ob_whose', 'ob_assign_to'];
    let at = -1;
    for (const k of order) {
      const i = dlg.indexOf(`i18t('${k}')`);
      assert.ok(i > at, `${k} is drawn, and after the field before it`);
      at = i;
    }
    assert.match(dlg, /id="of-desc"/); assert.match(dlg, /id="of-due"/);
    assert.match(dlg, /id="of-recur"/); assert.match(dlg, /id="of-assignee"/);
    assert.match(dlg, /data-of-party=/, 'the Us / counterparty toggle is still there');
    assert.match(dlg, /i18t\('act_save'\)/, 'and Save is still Save');
  });

  test('Assign to still disappears when the obligation is theirs', () => {
    assert.match(OB_CODE, /getElementById\('of-assignee-wrap'\)\?\.classList\.toggle\('hidden', party==='theirs'\)/);
  });

  test('the party toggle still names the counterparty', () => {
    assert.match(dlg, /k==='theirs'\?\(\(c\.counterparty\|\|''\)\.replace/);
  });

  test('AMOUNT DRAWS ON BOTH SIDES OF THAT TOGGLE', () => {
    /* Money they owe us matters as much as money we owe them, so it is not
       hidden with Assign to. Its row is ABOVE the toggle and nothing in the
       party painter touches it. */
    assert.ok(dlg.indexOf("id=\"of-amount\"") < dlg.indexOf('data-of-party='),
      'the amount is drawn before the toggle, so no branch can hide it');
    const paint = OB_CODE.slice(OB_CODE.indexOf('const paintParty=()=>{'), OB_CODE.indexOf('document.querySelectorAll(\'[data-of-party]\')'));
    assert.ok(!/of-amount/.test(paint), 'and the toggle’s painter never touches it');
  });
});

describe('f259 (5) — the totals ride what is already on the screen', () => {
  test('a band’s sum sits in the heading that already carries its count', () => {
    /* No new box, no new panel, no band — the cheapest channel that carries
       the fact. */
    assert.match(OB_CODE, /<div class="obt-band">\$\{_obEsc\(i18t\(key\)\)\}<b>\$\{mine\.length\}<\/b>\$\{\s*money && sum \? `<i class="obt-bandsum">/);
    assert.match(OB_CODE, /<tr class="obw-band"><td colspan="\$\{money \? 6 : 5\}">/,
      'and the worklist band spans the column count it actually draws');
  });

  test('a cross-contract total CONVERTS and names what it left out', () => {
    /* Two rows on that page can be in two currencies, so a bare sum would add
       shillings to euros. A silent trim on a money headline is the fault the
       insights panels were rebuilt to stop. */
    const home = OB_CODE.slice(OB_CODE.indexOf('const homeSum = list =>'), OB_CODE.indexOf('const banded ='));
    assert.match(home, /fxHome\(\{ \.\.\.o\._c, value: n \}\)/);
    assert.match(home, /if\(h && h\.missing\)\{ missing\[h\.code \|\| '\?'\] =/);
    assert.match(OB_CODE, /ob_total_left_out/, 'and the foot says so');
  });

  test('the worklist table still sums to 100%', () => {
    const cols = ['obw-c', 'obw-side', 'obw-who', 'obw-amt', 'obw-when', 'obw-acts'];
    let total = 0;
    for (const k of cols) {
      const m = CSS.match(new RegExp('\\.' + k + '\\{[^}]*width:(\\d+)%'));
      assert.ok(m, k + ' states a width');
      total += Number(m[1]);
    }
    assert.equal(total, 100, 'the amount’s width came off the description column');
  });
});

describe('f259 (6) — what is explicitly not touched', () => {
  test('obligations still never travel to the counterparty', () => {
    const NEG = strip(read('js/negotiation.js'));
    const build = NEG.slice(NEG.indexOf('function buildSharePayload'));
    assert.ok(!/obligations/.test(build.slice(0, build.indexOf('\n}'))),
      'the share payload is unchanged, asserted rather than assumed');
  });

  test('the chase message stays one sentence and gains no figure', () => {
    const SRV = strip(read('server/server.js'));
    const chase = SRV.slice(SRV.indexOf('mail_ob_chase_line'), SRV.indexOf('mail_ob_chase_line') + 600);
    assert.ok(!/amount/.test(chase), 'no figure was added to the knock on the door');
  });

  test('and an obligation filed before this job draws identically', () => {
    const old = { id: 'ob_1', desc: 'Quarterly report', due: '2026-09-30', status: 'open' };
    assert.equal(win.obligationAmount(old), null);
    assert.equal(win.obligationBand(old), win.obligationBand({ ...old }));
    assert.equal(win.obState(old), win.obState({ ...old }));
  });
});

describe('f259 (7) — both languages', () => {
  for (const lang of ['en', 'sv']) {
    test(`${lang}: the new words are there`, () => {
      const d = i18n.STRINGS[lang];
      for (const k of ['ob_amount', 'ob_amount_ph', 'ob_amount_hint', 'ob_total',
                       'ob_total_left_out_one', 'ob_total_left_out_other'])
        assert.ok(d[k] && String(d[k]).trim(), `${lang}.${k}`);
    });
  }
  test('and they are translated, not copied', () => {
    for (const k of ['ob_amount', 'ob_amount_hint', 'ob_total'])
      assert.notEqual(i18n.STRINGS.en[k], i18n.STRINGS.sv[k], k);
  });
});
