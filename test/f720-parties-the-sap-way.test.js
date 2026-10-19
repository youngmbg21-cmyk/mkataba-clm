'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f720 — PARTIES, "THE SAP WAY" (round 19 of the redesign: the owner picked
   "The SAP way" by name and said "Leave it off" to a code-named deal on
   Parties, 17 Oct 2026)
   (1) A deal kept to its list is not on Parties (cuBook).
   (2) What waits on you at a party is said in words (cuNeedsOf, cuNeedsSay):
       the checklist's own items over the party's contracts, urgent first,
       then a negotiation whose move is ours that the checklist does not name.
   (3) A Status box (All · Live · Ended) narrows by the one reading cuBucket,
       and a refresh keeps it (cuPlace).
   (4) The panel lists what waits (each with its door) and the agreements.
   (5) The words, in both books.
   AT THE PARENT (round 17's head) every test here FAILS.
   The browser half: test/chromium/parties-sap-way-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CU = R('js/views/customers.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f720 (1) a deal kept to its list is not on Parties', () => {
  test('1a cuBook leaves the stand-in out by name', () => {
    const ctx = { state: { contracts: [{ id: 'A', counterparty: 'Alpha AB' }, { id: 'X', counterparty: 'Falcon AB', _codeNamed: true }, { id: 'B', counterparty: 'Beta AB', archived: true }] } };
    vm.createContext(ctx); vm.runInContext(fnBody(CU, 'cuNameOf') + fnBody(CU, 'cuBook'), ctx);
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.cuBook().map(c => c.id))), ['A']);
  });
});

describe('f720 (2) what waits on you, in words', () => {
  const stage = () => {
    const ctx = { i18t: (k, o) => k === 'cu_need_more' ? `${o.t} · +${o.n} more` : k,
      INS_NEED_VERB: { details: 1, approval: 1, quiet: 1 },
      needsYouOf: c => c.needs || [], insNeedWords: (c, it) => ({ title: it.kind + ':' + c.id }),
      regMoveWord: c => (c.ours ? { k: 'you' } : null) };
    vm.createContext(ctx);
    /* RE-POINTED 19 Oct 2026 (lane A2): the column says each item short (cuNeedShort,
       "2 redlines · 4 days", "an approval"), the panel whole (cuNeedTitle) */
    vm.runInContext(['cuWaitingOnYou', 'cuNeedsOf', 'cuNeedTitle', 'cuNeedShort', 'cuNeedsSay'].map(n => fnBody(CU, n)).join('\n'), ctx);
    return ctx;
  };
  test('2a the checklist\'s items, urgent first, then a move of ours it does not name', () => {
    const ctx = stage();
    const list = ctx.cuNeedsOf([{ id: 'A', needs: [{ kind: 'details' }, { kind: 'nope' }] }, { id: 'B', needs: [{ kind: 'approval', urgent: true }] }, { id: 'C', ours: true }]);
    assert.deepEqual(JSON.parse(JSON.stringify(list.map(x => x.it.kind + ':' + x.c.id))), ['approval:B', 'details:A', 'move:C']);
    assert.equal(ctx.cuNeedsSay(list), 'cu_need_approval_short · +2 more');
    assert.equal(ctx.cuNeedsSay([]), '');
    assert.equal(ctx.cuNeedTitle(list[2]), 'cu_need_move');
  });
  test('2b the column and the panel read the same words', () => {
    /* RE-POINTED 19 Oct 2026: the row's cells are one builder (cuCellHtml), so
       a column a reader hides or moves (Columns) draws the same words */
    assert.match(fnBody(CU, 'cuCellHtml'), /const ws = cuNeedsSay\(v\.needs\)/);
    /* RE-POINTED 19 Oct 2026 (round 19 as drawn, lane A2): the panel's facts
       are the drawing's five — Organisation no. · Owner · Live agreements ·
       Next to end · NDA; what waits is the panel's own section, its rows the
       same items the column says (cuNeedTitle) */
    const p = fnBody(CU, 'cuPaintCustomerPanel');
    assert.doesNotMatch(p, /k: 'waiting'/);
    assert.match(p, /k: 'org'[\s\S]*k: 'owner'[\s\S]*k: 'live'[\s\S]*k: 'next'[\s\S]*k: 'nda'/);
    assert.match(fnBody(CU, 'cuPanelNeedsHtml'), /const t = cuNeedTitle\(x\)/);
    assert.match(fnBody(CU, 'cuView'), /needs: cuNeedsOf\(items\)\.concat\(cuRequestsOf\(r\.key\)\)/);
  });
});

describe('f720 (3) the Status box', () => {
  /* RE-POINTED 19 Oct 2026 (round 19 as drawn, lane A2): the list opens on
     Live ("Parties 27 · live · sorted by name"), and Status is the PARTY's
     standing (cuStanding, read off cuBucket) — a live party still counts what
     has ended with it, so it no longer narrows the contracts a row counts */
  test('3a the party\'s standing by cuBucket, opening on Live, and a refresh keeps it', () => {
    assert.match(fnBody(CU, 'cuStanding'), /cuBucket\(c\) === 'active'/);
    assert.match(fnBody(CU, 'cuStatusWants'), /_cu\.status === 'all' \|\| cuStanding\(r\) === _cu\.status/);
    assert.doesNotMatch(fnBody(CU, 'cuFiltersOn'), /_cu\.status/);
    assert.match(fnBody(CU, 'cuPlace'), /status: _cu\.status/);
    assert.match(fnBody(CU, 'cuPlacePut'), /_cu\.status = \['live', 'ended', 'all'\]\.includes\(p\.status\) \? p\.status : 'live';/);
    assert.match(fnBody(CU, 'cuFilterBarHtml'), /key: 'status', cur: _cu\.status, def: 'live'/);
    assert.match(CU, /const _cu = \{[^}]*status: 'live'/);
  });
});

describe('f720 (4) the panel\'s two lists', () => {
  test('4a what waits, each with its door; the agreements, each its paper', () => {
    const p = fnBody(CU, 'cuPaintCustomerPanel');
    /* RE-POINTED 19 Oct 2026: one local `sec` stands for insSecHtml */
    assert.match(p, /sec\(i18t\('cu_col_waiting'\), r\.needs\.length, cuPanelNeedsHtml\(r\.needs\)/);
    assert.match(p, /sec\(i18t\('cu_panel_agreements'\), r\.items\.length, cuPanelAgreementsHtml\(r\.items\)/);
    assert.match(p, /const sec = \(t, n, b, cls\) => \(typeof insSecHtml === 'function' \? insSecHtml\(t, n, b, cls\)/);
    assert.match(fnBody(CU, 'cuPanelNeedsHtml'), /data-cu-need="\$\{_cuE\(x\.it\.kind\)\}" data-cu-id=/);
    assert.match(fnBody(CU, 'cuNeedGo'), /needsYouGo\(kind, id\)/);
    /* RE-POINTED 19 Oct 2026: the delegated listener returns after each door */
    assert.match(CU, /const a = t\.closest\('\[data-cu-ag\]'\); if \(a && typeof regOpenContract === 'function'\)\{ regOpenContract/);
  });
});

describe('f720 (5) the words', () => {
  test('5a in both books', () => {
    assert.equal(BOOKS.en.cu_status, 'Status');
    assert.equal(BOOKS.en.cu_panel_agreements, 'Agreements');
    for (const k of ['cu_status', 'cu_status_all', 'cu_status_live', 'cu_status_ended', 'cu_need_move', 'cu_need_more', 'cu_need_go_move', 'cu_panel_agreements'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
