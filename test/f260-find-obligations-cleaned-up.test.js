/* f260 — Find obligations, AND THE THREE THINGS WRONG WITH IT (J-5.3)
   ========================================================================
   Owner-reported 30 Aug 2026, off a preferred-stock charter carrying 18
   proposals: *"what is the purpose of find obligations? It seems to have a bug
   today."*

   WHAT IT IS FOR, since the screen never says: it reads the wording with
   Copilot and proposes the ongoing duties it finds, each with the verbatim
   clause it came from. The reader ticks; nothing is saved until they confirm.

   THE THREE:
     1  NO DEDUPE — pressing it twice added everything twice. 18 → 36 → 54.
        With amounts on obligations, a duplicated list is duplicated MONEY,
        which is what makes it the one to fix first.
     2  EVERY PROPOSAL ARRIVED TICKED, which is what made (1) so easy to hit.
     3  THE CONFIRMATION WAS SILENT — a BARE toast prints nothing in this
        product, so the act that changed the record said nothing on screen.

   AND WHAT IS EXPLICITLY NOT TOUCHED: the scan, its prompt, its ceiling, the
   retry it offers on an empty result, and the read-stamp it writes. */
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

const w = buildWorld({ obligations: true, intelView: true });
const win = w.win;

describe('f260 (1) — the dedupe, and it is one reading', () => {
  const c = { id: 'MK-1', obligations: [
    { id: 'ob_a', desc: 'Deliver the quarterly volume report' },
    { id: 'ob_b', desc: 'Maintain product liability cover of KES 50,000,000.' },
  ]};

  test('a proposal already on the contract is recognised', () => {
    assert.equal(win.obligationAlreadyOn(c, { desc: 'Deliver the quarterly volume report' }), true);
    assert.equal(win.obligationAlreadyOn(c, { desc: 'Second tranche on commissioning' }), false);
  });

  test('and the same clause read twice is still the same obligation', () => {
    /* Matched on the DESCRIPTION, because the scan mints nothing and a proposal
       has no identity of its own — its wording is the only thing it and the
       stored obligation share. Whitespace collapsed and case folded, because
       the same clause read twice comes back punctuated a little differently. */
    assert.equal(win.obligationAlreadyOn(c, { desc: 'deliver   the quarterly VOLUME report' }), true);
    assert.equal(win.obligationAlreadyOn(c, { desc: 'Maintain product liability cover of KES 50,000,000' }), true,
      'a trailing full stop is not a different promise');
  });

  test('an empty proposal matches nothing, rather than everything', () => {
    assert.equal(win.obligationAlreadyOn(c, { desc: '' }), false);
    assert.equal(win.obligationAlreadyOn(c, {}), false);
    assert.equal(win.obligationAlreadyOn({ obligations: [] }, { desc: 'x' }), false);
    assert.equal(win.obligationAlreadyOn(null, { desc: 'x' }), false);
  });

  test('it is asked at the DRAW and again at the ADD', () => {
    /* The dialog can be open while another surface files an obligation. The
       checkbox is the sign; the check inside the handler is the wall. */
    const dlg = OB_CODE.slice(OB_CODE.indexOf('function openObligationsReview'));
    const body = dlg.slice(0, dlg.indexOf('\n}\n'));
    assert.match(body, /const dupe = found\.map\(o => obligationAlreadyOn\(c, o\)\);/, 'at the draw');
    /* The ADD's own check is the WALL — a proposal the reader ticked anyway,
       or one that became a duplicate while the dialog was open, is still not
       added twice. It does not count: what was already there is counted off
       the PROPOSALS, because the dialog unticks a duplicate on the reader's
       behalf and counting the ticked ones alone reported "1 added" and said
       nothing about the two it had set aside. */
    assert.match(body, /if\(obligationAlreadyOn\(c,o\)\) return;/, 'and at the add');
    assert.match(body, /let n=0, skipped=dupe\.filter\(d=>d\)\.length;/,
      'and the count is off the proposals, not off the boxes');
  });
});

describe('f260 (2) — a duplicate is SHOWN, not hidden', () => {
  const dlg = OB.slice(OB.indexOf('function openObligationsReview'));
  const body = dlg.slice(0, dlg.indexOf('\n}\n\n'));

  test('it is drawn, unticked, with a word saying why', () => {
    /* Never silently dropped: the reader has to be able to see that the scan
       found it AND that they already have it. */
    assert.match(body, /data-ob-pick="\$\{i\}"\$\{dupe\[i\]\?'':' checked'\}/,
      'the fresh ones stay ticked; a duplicate arrives unticked');
    assert.match(body, /ob_already_on/, 'and says why');
    assert.ok(!/found\.filter\(/.test(body), 'nothing is filtered out of the list');
  });

  test('the button counts what will actually be added', () => {
    assert.match(body, /const fresh = dupe\.filter\(d => !d\)\.length;/);
  });
});

/* ============================================================
   f260 (2b) — AND THE COUNT FOLLOWS THE TICKS (owner-reported 1 Sep 2026)
   ------------------------------------------------------------
   *"as I exclude or include any obligations, the count in the highlighted
   button should in live reflect the number of obligations checked only."*

   IT WAS WRITTEN ONCE, AT THE DRAW. The number was right the moment the window
   opened — it already left duplicates out, which is what (2) above built it for
   — and then never moved, so untick fifteen of twenty and the button still
   offered to add twenty.
   ============================================================ */
describe('f260 (2b) — the count follows the ticks', () => {
  const dlg = OB.slice(OB.indexOf('function openObligationsReview'));
  const body = dlg.slice(0, dlg.indexOf('\n}\n\n'));

  test('ONE PAINTER, and the markup carries no label of its own', () => {
    /* The first paint and every repaint go through one reading, so they cannot
       come to disagree about what the number means. */
    assert.match(body, /function obPaintAdd\(\)\{/, 'the one painter');
    assert.match(body, /<button id="or-add"[^>]*><\/button>/,
      'the button is drawn EMPTY — a label written into the markup would be a '
      + 'second copy that stops moving');
    assert.match(body, /obPaintAdd\(\);/, 'and it is painted on arrival');
  });

  test('it counts the TICKED boxes, live', () => {
    assert.match(body, /const n = obPicks\(\)\.filter\(cb => cb\.checked\)\.length;/,
      'the checked ones and nothing else');
    assert.match(body, /i18tn\('ob_add_n', n, \{ n \}\)/, 'and that is the number it prints');
    /* ONE DELEGATED LISTENER rather than one per row: the list runs to twenty
       on a real agreement. */
    assert.match(body, /modal\.addEventListener\('change'/, 'wired once, on the window');
    assert.match(body, /closest\('\[data-ob-pick\]'\)\) obPaintAdd\(\)/,
      'and only a tick repaints it');
  });

  test('ZERO IS TWO DIFFERENT SENTENCES, and both are refused', () => {
    /* Nothing ticked because the scan found nothing new is a fact about the
       scan; nothing ticked because the reader untied everything is their own
       choice. Telling them "nothing new to add" over a list full of new
       proposals would be the window arguing with itself. */
    assert.match(body, /i18t\(fresh \? 'ob_add_pick' : 'ob_add_none'\)/,
      'the state is read, not the number alone');
    assert.match(body, /btn\.disabled = !n;/,
      'and either way the press is refused BEFORE it happens — this product\'s '
      + 'own rule: grey where it can be known, never a refusal afterwards');
  });

  test('the new sentence is in both languages', () => {
    for (const lang of ['en', 'sv'])
      assert.ok(i18n.STRINGS[lang].ob_add_pick
        && String(i18n.STRINGS[lang].ob_add_pick).trim(), lang + '.ob_add_pick');
    assert.notEqual(i18n.STRINGS.en.ob_add_pick, i18n.STRINGS.sv.ob_add_pick,
      'and it is really translated');
  });
});

describe('f260 (3) — the confirmation is no longer silent', () => {
  const dlg = OB_CODE.slice(OB_CODE.indexOf('function openObligationsReview'));
  const body = dlg.slice(0, dlg.indexOf('\n}\n'));

  test('the toast carries a KIND, which is what makes it print at all', () => {
    /* A bare toast() call prints NOTHING in this product by design. */
    assert.match(body, /n \? 'ok' : 'warn'\);/);
    assert.ok(!/toast\(`Added \$\{n\}/.test(body), 'the hardcoded English is gone');
  });

  test('and it goes through the dictionary, saying what happened', () => {
    assert.match(body, /i18tn\('ob_added_n_dupes', n, \{ n, d: skipped \}\)/);
    assert.match(body, /i18tn\('ob_added_n', n, \{ n \}\)/);
    /* ZERO IS A DIFFERENT SENTENCE, NOT A PLURAL FORM: tn knows only _one and
       _other, so a _zero suffix would be a key nothing ever reads. */
    assert.match(body, /n === 0/);
    assert.match(body, /i18t\('ob_added_none_dupes', \{ d: skipped \}\)/);
  });

  test('and the surfaces that count obligations are repainted', () => {
    assert.match(body, /obligationSurfacesChanged\(\);/);
    assert.match(body, /roomPaintObligations\(c\)/);
  });
});

describe('f260 (4) — what is explicitly not touched', () => {
  test('the scan, its prompt and its ceiling', () => {
    assert.match(OB_CODE, /async function extractObligations/);
    /* The retry offered on an empty result is measured behaviour and correct. */
    assert.match(OB_CODE, /ob_none_found/);
    assert.match(OB_CODE, /'warn'/);
  });

  test('and the read-stamp the scan writes', () => {
    assert.match(OB_CODE, /if\(_obText && _obText\.length>=120\)\{ obligationsReadStamp\(c, _obText\); persist\(c\); \}/);
    /* Its DEFINITION also matches `obligationsReadStamp(c`, so the claim is
       counted off the CALLS — one, and it is the scan's. */
    const calls = (OB_CODE.match(/(?<!function )obligationsReadStamp\(c/g) || []);
    assert.equal(calls.length, 1, 'written by the SCAN and by nothing else');
  });

  test('nothing is saved until confirm', () => {
    const dlg = OB_CODE.slice(OB_CODE.indexOf('function openObligationsReview'));
    const head = dlg.slice(0, dlg.indexOf("document.getElementById('or-add')"));
    assert.ok(!/persist\(/.test(head), 'the dialog writes nothing while it is open');
  });
});

describe('f260 (5) — both languages', () => {
  for (const lang of ['en', 'sv']) {
    test(`${lang}: the new words are there`, () => {
      const d = i18n.STRINGS[lang];
      for (const k of ['ob_already_on', 'ob_add_n_one', 'ob_add_n_other', 'ob_add_none',
                       'ob_added_n_one', 'ob_added_n_other', 'ob_added_none',
                       'ob_added_n_dupes_one', 'ob_added_n_dupes_other', 'ob_added_none_dupes'])
        assert.ok(d[k] && String(d[k]).trim(), `${lang}.${k}`);
    });
  }
  test('and they are not the same words', () => {
    for (const k of ['ob_already_on', 'ob_add_none', 'ob_added_none'])
      assert.notEqual(i18n.STRINGS.en[k], i18n.STRINGS.sv[k], k);
  });
});
