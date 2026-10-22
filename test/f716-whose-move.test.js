'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f716 — NEGOTIATIONS, "WHOSE MOVE" (round 14 of the redesign: the owner
   picked "Whose move" by name, said yes to "Our move" and a Lead column, and
   no to a code-named deal on the list, 17 Oct 2026)
   (1) The words are our side's: "Our move", "Waiting on our side", "What is
       open"; "For signature" and "Neither" are tabs only where something is
       in them.
   (2) Who leads each deal is ONE reading (regNegoLeadOf) for the panel's Lead
       fact and the list's Lead column: "You" for the reader, else the first
       name, the whole name on the hover.
   (3) A deal kept to its list is not live for anyone outside it (negoIsLive),
       so the list, its counts and the Board agree.
   AT THE PARENT (21b8cdb) every test here FAILS.
   The browser half: test/chromium/whose-move-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const REG = R('js/views/register.js');
const NEG = R('js/views/negotiation.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f716 (1) our side\'s words, and only tabs that hold something', () => {
  test('1a "Our move", "Waiting on our side", "What is open", in both books', () => {
    assert.equal(BOOKS.en.reg_pill_your_move, 'Our move');
    assert.equal(BOOKS.sv.reg_pill_your_move, 'Vårt drag');
    assert.equal(BOOKS.en.ngl_band_you, 'Waiting on our side');
    assert.equal(BOOKS.en.ngl_n_waiting_other, '{n} waiting on our side');
    assert.equal(BOOKS.en.ngl_col_changes, 'What is open');
    for (const k of ['ngl_col_lead', 'ngl_lead_you', 'ngl_tab_sign']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
  test('1b every whose-move tab is drawn only where something is in it (or the reader stands on it); All always', () => {
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"):
       the rule "a choice that gives nothing is not listed" held for For
       signature and Neither; the shared list head's one tab builder now keeps
       it for every tab (Our move and Their move were drawn greyed at zero).
       The page hands it the five views with their counts (negoBandViews) and
       All kept. */
    const t = fnBody(REG, 'negoBandViews');
    assert.match(t, /\{ k:'', label:i18t\('reg_tab_all'\), n:\(book\|\|\[\]\)\.length, keep:true \}/);
    for (const [k, w] of [['you', 'reg_pill_your_move'], ['them', 'reg_pill_their_move'], ['out', 'ngl_tab_sign'], ['clear', 'ngl_tab_neither']])
      assert.match(t, new RegExp(`\\{ k:'${k}', label:i18t\\('${w}'\\), n:n\\.${k}, `), k);
    const INS = fs.readFileSync(path.join(__dirname, '..', 'js/views/inspector.js'), 'utf8');
    assert.match(INS, /filter\(v => v && \(v\.n !== 0 \|\| v\.keep \|\| String\(v\.k\) === String\(o\.cur\)\)\)/, 'the one builder leaves a zero out unless kept or lit');
  });
});

describe('f716 (2) who leads it', () => {
  const stage = me => { const ctx = { i18t: k => k, currentUser: () => me, deskLead: c => c.desk || null, contractOwnerName: c => (c.owner && c.owner.name) || '' };
    vm.createContext(ctx); vm.runInContext(fnBody(REG, 'regNegoLeadOf'), ctx); return ctx; };
  test('2a the desk\'s lead, else the owner; "You" for the reader, else the first name', () => {
    const { regNegoLeadOf } = stage({ id: 'u1', name: 'Maria Lindgren' });
    assert.deepEqual(JSON.parse(JSON.stringify(regNegoLeadOf({ owner: { id: 'u1', name: 'Maria Lindgren' } }))), { name: 'Maria Lindgren', mine: true, short: 'ngl_lead_you' });
    assert.deepEqual(JSON.parse(JSON.stringify(regNegoLeadOf({ owner: { id: 'u1', name: 'Maria Lindgren' }, desk: { id: 'u2', name: 'Lina Ek' } }))), { name: 'Lina Ek', mine: false, short: 'Lina' });
    assert.equal(regNegoLeadOf({}).short, '—', 'nobody named: a dash');
  });
  test('2b one reading for the panel\'s fact and the column', () => {
    /* RE-POINTED 18 Oct 2026 (Jambo's panel, round 14 as drawn: "Lead · You"):
       the panel says "You" for the reader's own deal, as the column does —
       still the one reading */
    assert.match(fnBody(REG, 'regNegoFacts'), /const ld=regNegoLeadOf\(c\), lead=ld\.mine\?ld\.short:ld\.name;/);
    assert.match(REG, /const ld=regNegoLeadOf\(c\);\n\s+CELL\.lead=`<td class="reg-lead" title="\$\{esc\(ld\.name\)\}">\$\{esc\(ld\.short\)\}<\/td>`;/);
    assert.match(REG, /const REG_COL_KEYS_NEGO_INS = \['mk','counterparty','round','changes','waiting','lead'\];/);
  });
});

describe('f716 (3) a deal kept to its list is not on the list', () => {
  test('3a not live for anyone outside its list, so the list and every count agree', () => {
    assert.match(fnBody(NEG, 'negoIsLive'), /if \(c\._codeNamed\) return false;/);
  });
});
