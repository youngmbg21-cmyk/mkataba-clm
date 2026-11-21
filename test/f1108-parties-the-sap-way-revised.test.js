'use strict';
/* f1108 — PARTIES, THE SAP WAY, REVISED (owner's pick, 19 Nov 2026: "Draw sap way … replace the last column and standing
   with something else. Waiting on you should be the last column"; "Build it")
   1 · The columns: Party · Streams · Agreements · On paper · Ends next · Waiting on you — Standing and the row's button
       are gone (one word cannot say many contracts' stages; one button cannot say which of many contracts).
   2 · Streams: the first stream, then "+N" (all named on hover); the party cell has no pills.
   3 · Agreements counts signed and in progress; Ends next is the signed contract that ends soonest.
   4 · Waiting on you is a count: things, on how many contracts, late.
   5 · The panel: the streams among the facts; under facts and contacts two links, all agreements and those that need
       your attention, each opening Contracts showing only those.
   At the parent none of this holds, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const CU = read('js/views/customers.js');

test('f1108 (1) the columns as drawn; Waiting on you last; no Standing, no button', () => {
  assert.match(CU, /const CUN_KEYS = \['streams', 'agreements', 'paper', 'ends', 'waiting'\];/);
  const row = strip(fnBody(CU, 'cunRowHtml'));
  assert.doesNotMatch(row, /cun-act-b|cun-st"|standing:/, 'no row button, no Standing cell');
  assert.doesNotMatch(row, /cun-sub">\$\{facts \? [^}]*\}\$\{chips\}/, 'no pills under the name');
});

/* the readings, run for real */
function world(){
  const sb = { i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n, v) => k + ':' + n, todayISO: () => '2026-11-19',
    effectiveExpiry: c => c.expiry, cuDay: d => 'day ' + d };
  vm.createContext(sb);
  vm.runInContext(['cunCounts', 'cunSplitOf', 'cunEndsNextOf', 'cunWaitSay'].map(n => fnBody(CU, n)).join('\n') + '\nthis.f = { cunCounts, cunSplitOf, cunEndsNextOf, cunWaitSay };', sb);
  return sb.f;
}

test('f1108 (2) many contracts at different stages: counted, and which signed one ends next', () => {
  const f = world();
  const v = { items: [
    { id: 'A', name: 'Old supply', status: 'Signed', expiry: '2026-01-01' },
    { id: 'B', name: 'Transport', status: 'Signed', expiry: '2027-06-30' },
    { id: 'C', name: 'Warehouse', status: 'Signed', expiry: '2028-01-18' },
    { id: 'D', name: 'Draft deal', status: 'Draft', expiry: '2026-12-01' },
    { id: 'E', name: 'In review', status: 'Under Review' },
    { id: 'F', name: 'Shelved', status: 'Signed', expiry: '2026-12-31', archived: true },
    { id: 'G', name: 'Declined', status: 'Declined' }] };
  assert.deepEqual(JSON.parse(JSON.stringify(f.cunCounts(v))), { signed: 3, open: 2 });
  assert.equal(f.cunSplitOf(v), 'cun_split_signed:3 · cun_split_open:2');
  const n = f.cunEndsNextOf(v);
  assert.equal(n.id, 'B', 'an ended or shelved one never; a draft never');
});

test('f1108 (3) what waits is a count across contracts, late said', () => {
  const f = world();
  const w = f.cunWaitSay([{ it: { kind: 'move', urgent: true }, c: { id: 'A' } }, { it: { kind: 'move' }, c: { id: 'B' } }, { it: { kind: 'details' }, c: { id: 'A' } }, { it: { kind: 'request' }, r: { id: 'R1' } }]);
  assert.equal(w.n, 4); assert.equal(w.head, 'cun_w_things:4'); assert.equal(w.on, 'cun_w_on:2'); assert.equal(w.late, true);
  assert.deepEqual(JSON.parse(JSON.stringify(w.ids)).sort(), ['A', 'B']);
  assert.equal(f.cunWaitSay([]), null);
});

test('f1108 (4) the panel: streams in the facts; two links under facts and contacts', () => {
  const p = strip(fnBody(CU, 'cunPanelFiveHtml'));
  assert.match(p, /facts\.push\(\{ k: i18t\('cun_c_streams'\)/);
  /* RE-POINTED 21 Nov 2026 (P-25, as drawn): the drawing has no "needs your attention" link in the panel — on Waiting on
     you the panel lists WHAT WAITS ON YOU, each with its act (data-cu-need), in place of the facts */
  assert.match(p, /data-cun-cts=/); assert.match(p, /data-cu-need=/); assert.doesNotMatch(p, /data-cun-attn=/);
  /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): all the agreements on Contracts is the
     panel's black button (act, data-cun-cts) and what needs attention its own group above the facts; facts, a timeline of
     the agreements, then contacts */
  assert.match(p, /const act = \{ label: i18t\('cun_p_open_cts'\), attr: `data-cun-cts=/);
  assert.ok(p.indexOf("key: 'waits'") < p.indexOf("key: 'facts'") && p.indexOf("key: 'facts'") < p.indexOf("key: 'timeline'") && p.indexOf("key: 'timeline'") < p.indexOf("key: 'contacts'"), 'what waits (Waiting on you) or the facts (All), a timeline, then contacts');
  assert.doesNotMatch(p, /CUN_PANEL_AGS/, 'no list of three agreements');
  assert.match(CU, /closest\('\[data-cun-attn\]'\)[\s\S]{0,400}regShowOnly\(ws\.ids/, 'the attention link shows only the contracts waiting on you');
});

test('f1108 (5) hidden money is not drawn at all: no On paper column, never a column of dashes (f259)', () => {
  const run = may => {
    const sb = { canViewValues: () => may };
    vm.createContext(sb);
    vm.runInContext(CU.match(/const CUN_KEYS = [^\n]*\n/)[0] + fnBody(CU, 'cunKeys') + '\nthis.k = cunKeys(); this.n = cunKeys(true);', sb);
    return JSON.parse(JSON.stringify(sb.k));
  };
  assert.deepEqual(run(true), ['streams', 'agreements', 'paper', 'ends', 'waiting']);
  assert.deepEqual(run(false), ['streams', 'agreements', 'ends', 'waiting'], 'no On paper column for a reader without money rights');
  /* RE-POINTED 22 Nov 2026 (P-25 review): cunCols(noWork) passes on whether anything waits anywhere (cunNoWork), so a
     reader with nothing waiting gets no Waiting on you column either, with no gap */
  assert.match(strip(fnBody(CU, 'cunCols')), /\.\.\.cunKeys\(noWork\)\.map/, 'the header is drawn from the same keys');
});
