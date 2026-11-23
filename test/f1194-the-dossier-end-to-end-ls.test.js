'use strict';
/* f1194 — THE DOSSIER, END TO END, THE LEGORA + STRIPE WAY, STEP 1 OF 4 (owner, 23 Nov 2026: "build the dossier tab for a
   signed contract alongside the Dossier L+S … with motion"; four steps, the motion kept rare, auto pilot).

   (1) A SIGNED PAPER'S BLANK IS A FACT, NEVER WORK (owner's pick "Show it, Amend is the way"): the server refuses every
       field once executed, so the facts say "Left blank when signed" with no Fill in, the notes beside the paper carry no
       Fill in, the Clauses tab's Fill it in is grey with the reason, and nothing is owed (pd2Sealed = detailsOf's reading).
   (2) THE HEADLINE on a signed agreement with nothing owed says it is live (pd2_live_none), not "Nothing is owed".
   (3) THE LIFE OF THE DEAL: signed (else started) → today → ends, read off the record; no start or no end, no line.
   (4) WHAT WAS FOUND counts the Clauses tab's own points (stkLivePoints — the one list the tab's number counts), reviewed
       and blank points nowhere; nothing read, nothing drawn; a row lands on the paper's words, its foot is the tab's door.
   (5) THE ARRIVAL'S FACTS (who it is between, the value with its quote) only before the read and never on a signed
       paper; the value only with money rights.
   (6) THE MOTION joins the card's rare arrival only (jovPlay on .pd2-card.is-five), never on its own.
   (7) The words stand in both books. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = R('js/paperdesk.js');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

function ctxWith(extra){
  const ctx = Object.assign({ _pdE: s => String(s), _pdT: (k, o) => k + (o ? JSON.stringify(o) : ''), _pdTn: (k, n, o) => k + ':' + n + (o ? JSON.stringify(o) : ''),
    todayISO: () => '2026-01-01', regDotDate: s => s }, extra || {});
  ctx.window = ctx; vm.createContext(ctx);
  ['pd2Sealed', 'pd2LifeOf', 'pd2PointKind', 'pd2FoundHtml'].forEach(n => vm.runInContext(fnSrc(PD, n), ctx));
  vm.runInContext('this.PD2_FD_ROWS = 3;', ctx);
  return ctx;
}

describe('f1194 (1) a signed paper\'s blank is a fact, never work', () => {
  test('pd2Sealed reads executed, Signed or sealed — the same as detailsOf', () => {
    const c = ctxWith({ negoExecuted: x => !!x.ex });
    assert.equal(c.pd2Sealed({ status: 'Draft' }), false);
    assert.equal(c.pd2Sealed({ status: 'Signed' }), true);
    assert.equal(c.pd2Sealed({ hash: 'abc' }), true);
    assert.equal(c.pd2Sealed({ ex: true }), true);
    assert.equal(c.pd2Sealed(null), false);
  });
  test('the facts row: sealed says Left blank when signed, owes nothing, has no door', () => {
    const F = strip(fnSrc(PD, 'pd2Facts'));
    const i = F.indexOf('const sealed = pd2Sealed(c)'); assert.ok(i >= 0, 'the facts ask pd2Sealed');
    const sealedRow = F.slice(i, F.indexOf(': { k: \'blank\'', i));
    assert.match(sealedRow, /pd2_f_blank_signed/);
    assert.doesNotMatch(sealedRow, /owed|go:|data-pd-fill-key/);
  });
  test('the notes beside the paper: sealed has no Fill in', () => {
    const N = strip(fnSrc(PD, 'pd2Notes'));
    assert.match(N, /acts: sealed \? '' :/);
    assert.match(N, /pd2_n_blank_signed_w/);
  });
  test('the Clauses tab\'s Fill it in (point and preamble) is grey with the reason on a signed paper', () => {
    const B = R('js/views/breakdown.js');
    assert.equal((B.match(/window\.pd2Sealed\(c\)\) \? (` disabled aria-disabled="true" title="\$\{_bdE\(i18t\('pd2_n_blank_signed_w'\)\)\}"`|i18t\('pd2_n_blank_signed_w'\))/g) || []).length, 2);
    assert.match(PD, /Object\.assign\(window, \{[^}]*\bpd2Sealed,/);
  });
});

describe('f1194 (2) the headline on a signed agreement', () => {
  test('nothing owed on a sealed paper says it is live', () => {
    assert.match(strip(fnSrc(PD, 'dossierNextOf')), /pd2Sealed\(c\) \? _pdT\('pd2_live_none'\) : _pdT\('dos_owed_none'\)/);
  });
});

describe('f1194 (3) the life of the deal', () => {
  test('signed → today → ends, the share of the term gone', () => {
    const c = ctxWith({ effectiveExpiry: x => x.expiry });
    const L = c.pd2LifeOf({ signedAt: '2025-01-01', expiry: '2027-01-01' });
    assert.equal(L.word, 'pd2_life_signed'); assert.equal(L.from, '2025-01-01'); assert.equal(L.end, '2027-01-01');
    assert.ok(Math.abs(L.p - 0.5) < 0.01, 'a year of two gone: ' + L.p);
  });
  test('no signing day falls back to the day it took effect, said as Started', () => {
    const c = ctxWith({ effectiveExpiry: x => x.expiry });
    assert.equal(c.pd2LifeOf({ fields: { effDate: '2025-06-01' }, expiry: '2027-01-01' }).word, 'pd2_life_started');
  });
  test('no start or no end: no line, nothing guessed', () => {
    const c = ctxWith({ effectiveExpiry: x => x.expiry });
    assert.equal(c.pd2LifeOf({ expiry: '2027-01-01' }), null);
    assert.equal(c.pd2LifeOf({ signedAt: '2025-01-01' }), null);
  });
  test('the signed card draws it', () => {
    assert.match(strip(fnSrc(PD, 'pd2AmendCardOf')), /pd2LifeHtml\(c\)/);
  });
});

describe('f1194 (4) what was found is the Clauses tab\'s own count', () => {
  const pts = [{ status: 'need', title: 'Rent only goes up', clause: '3', quote: 'rises every year' },
    { status: 'need', title: 'No limit', clause: '9', quote: 'without limit', done: true },
    { status: 'look', title: 'Repairs', clause: '6', quote: 'the roof' },
    { status: 'note', title: 'Law', clause: '12' },
    { status: 'need', title: 'Deposit', blank: true }];
  const D = { read: { read: true } };
  test('counts live points only: reviewed and blank count nowhere', () => {
    const c = ctxWith({ stkLivePoints: () => pts });
    const h = c.pd2FoundHtml({ id: 'X' }, D);
    assert.match(h, /pd2_fd_n:3/, 'three live points');
    assert.match(h, /class="is-need" style="flex:1/); assert.match(h, /class="is-look" style="flex:1/); assert.match(h, /class="is-note" style="flex:1/);
    assert.doesNotMatch(h, /No limit|Deposit/);
  });
  test('a row lands on the paper\'s words; the foot is the Clauses tab\'s own door', () => {
    const c = ctxWith({ stkLivePoints: () => pts });
    const h = c.pd2FoundHtml({ id: 'X' }, D);
    assert.match(h, /data-pd2-fd-quote="rises every year"/);
    assert.match(h, /data-pd-tab="doc"/);
    assert.match(PD, /window\.igQuoteGo\(fq\.getAttribute\('data-pd2-fd-quote'\)/);
  });
  test('nothing read, or no reading, draws nothing', () => {
    const c = ctxWith({ stkLivePoints: () => pts });
    assert.equal(c.pd2FoundHtml({ id: 'X' }, { read: { read: false } }), '');
    const c2 = ctxWith({ stkLivePoints: () => null });
    assert.equal(c2.pd2FoundHtml({ id: 'X' }, D), '');
  });
  test('the tab\'s number and the Dossier read one list', () => {
    const B = R('js/views/breakdown.js');
    assert.match(strip(fnSrc(B, 'stkNeedCount')), /stkLivePoints\(c\)/);
    assert.match(PD, /\$\{nl \? pd2FoundHtml\(c, D\) : ''\}/);
  });
});

describe('f1194 (5) the arrival\'s facts', () => {
  test('only before the read, never on a signed paper; the value only with money rights', () => {
    const F = strip(fnSrc(PD, 'pd2Facts'));
    assert.match(F, /const arriving = nlF && !\(D && D\.read && D\.read\.read\) && !pd2Sealed\(c\);/);
    assert.match(F, /if \(arriving && R\.money && seeMoney\)/);
    assert.match(F, /const seeMoney = !\(typeof canViewValues === 'function' && !canViewValues\(\)\);/);
  });
});

describe('f1194 (6) the motion joins the card\'s rare arrival', () => {
  test('jovPlay, on the Dossier\'s card only, starts the parts\' arrival', () => {
    const C = R('js/components.js'); const P = fnSrc(C, 'jovPlay');
    assert.match(P, /if \(el\.matches\('\.pd2-card\.is-five'\)\)\{ const g = el\.closest\('#pd-glance'\);/);
    assert.match(P, /g\.classList\.add\('pd2-arrive'\)/);
  });
  test('the parts move only under .pd2-arrive', () => {
    const H = R('index.html');
    assert.match(H, /\.pd2-arrive :is\(\.pd2-life-fill, \.pd2-fd-bar i, \.pd2-two-l::before, \.pd2-dtl::before, \.pd2-fam-chain > i\)\{animation:jovDraw/);
    assert.doesNotMatch(H.replace(/\.pd2-arrive[^{]*\{[^}]*\}/g, ''), /\.pd2-(life|fd|two|dtl|fam-chain)[^{]*\{[^}]*animation:/);
  });
});

describe('f1194 (7) the words, both books', () => {
  test('each new word stands in English and Swedish', () => {
    const I = R('js/i18n.js');
    for (const k of ['pd2_life_signed', 'pd2_life_started', 'pd2_life_today', 'pd2_life_ends', 'pd2_live_none', 'pd2_f_blank_signed', 'pd2_n_blank_signed_w',
      'pd2_two_ours', 'pd2_two_theirs', 'pd2_dt_more_one', 'pd2_dt_more_other', 'pd2_fam_original', 'pd2_fam_none_yet', 'pd2_f_between',
      'pd2_fd_head', 'pd2_fd_none', 'pd2_fd_n_one', 'pd2_fd_n_other', 'pd2_fd_all_one', 'pd2_fd_all_other'])
      assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
  });
});
