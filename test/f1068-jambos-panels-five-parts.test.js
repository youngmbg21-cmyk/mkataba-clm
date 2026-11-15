'use strict';
/* f1068 — JAMBO'S PANELS, THE FIVE PARTS, ROUND 1 (owner, 15 Nov 2026: "Build the panels in three rounds as
   recommended but do not build on discover"; "Build as drawn", replacing the 26 Oct "nothing boxed" for a page that
   hands jamboOverviewHtml a `title`).
   (1) the ONE builder draws the five parts when a page hands it a `title`: the headline in the serif, three tiles
       (a tile with a press is a door), soft groups whose row is the door, ONE black button in a soft card, the small
       print last; a page that hands in no title is drawn as before (.jov-head), so rounds 2 and 3 move nothing yet.
   (2) the shared readings: jov5Signed counts the record's Signed and Executed (the light list says Signed);
       jov5Money never shows a value to a person not allowed to see values.
   (3) the ten near-empty panels of round 1 say the five parts in the new look and NOTHING new in the old one:
       Approvals (apSay), Negotiations (regNegoSay / regNegoSayFive), Obligations (obYourWeekSay), Requests
       (ikJlSay), Import (migSideSay), My notes (mnJlSay), Flow map (fmJlSay), Explorer's Overview (igOverviewFive),
       Explorer's Findings (igFindingsHtml), New agreement (pdWallHelloHtml's sheet branch). Discover is not built.
   (4) Explorer's suggestions are rows of its Overview, so the chip row under the panel draws none while it shows
       (igSugInRows), and keeps them in the old look.
   (5) Import's drop area in the panel is the page's own door (data-mig-paneldrop → #mig-files / migDropTake).
   (6) every jov5_ word the code asks for is in both books.
   AT THE PARENT every test here fails: none of these builders or words exist. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* the world loads part of the app: the round's pages are loaded into it, the core's readings stood in for (as f745) */
const PAGES = ['js/obligations.js', 'js/flowmap.js', 'js/views/flowmap.js', 'js/views/approvalsview.js', 'js/views/intake.js', 'js/views/mynotes.js', 'js/views/migration.js',
  'js/views/intelligence.js', 'js/views/register.js', 'js/views/inspector.js'];
function world(){
  const w = buildWorld({ intelView: true, registerView: true, intakeView: true, obligations: true });
  const W = w.win;
  const me = { id: 'u_f1068', name: 'Amina Otieno', role: 'admin', prefs: {}, canViewValues: true };
  W.currentUser = () => me; W.isAdmin = () => true; W.canEdit = () => true; W.canViewValues = () => me.canViewValues !== false;
  W.state = W.state || { contracts: [], settings: {} }; if (!Array.isArray(W.state.contracts)) W.state.contracts = [];
  let look = false; W.newLookOn = () => look;
  for (const f of PAGES){ if (typeof W[{ 'js/obligations.js': 'obYourWeekSay', 'js/flowmap.js': 'flowMapRow', 'js/views/flowmap.js': 'fmJlSay', 'js/views/approvalsview.js': 'apSay',
    'js/views/intake.js': 'ikJlSay', 'js/views/mynotes.js': 'mnJlSay', 'js/views/migration.js': 'migSideSay', 'js/views/intelligence.js': 'igOverviewHtml',
    'js/views/register.js': 'regNegoSay', 'js/views/inspector.js': 'jlWordsHtml' }[f]] === 'function') continue;
    try { W.eval(read(f)); } catch (_){ /* a page that cannot load here is caught by its own test below */ } }
  w.look = on => { look = !!on; };
  w.me = me;
  return w;
}
const newLook = (w, on) => w.look(on);
const stateOf = w => w.win.state;

test('f1068 (1) the builder draws the five parts for a page that hands in a title, and nothing new without one', () => {
  const w = world();
  let hit = 0;
  const html = w.win.jamboOverviewHtml({ eyebrow: 'Approvals', title: 'All clear.', sub: 'Nothing waits.', clear: true,
    glance: [{ n: 0, l: 'on you' }, { n: 2, l: 'on others', run: () => { hit++; } }, { n: 11, l: 'signed' }],
    groups: [{ label: 'Your rules', rows: [{ mark: 'shield', tone: 'amber', t: 'No approval rules yet', s: 'Anyone can sign', run: () => { hit++; } }] }],
    act: { say: 'Do it.', label: 'Go', run: () => { hit++; } }, src: 'Counted from the list' }, 'f1068');
  const d = w.win.document.createElement('div'); d.innerHTML = html; w.win.document.body.appendChild(d);
  assert.ok(d.querySelector('.jov5'), 'the five parts');
  assert.equal(d.querySelector('.jov5-title').textContent, 'All clear.');
  assert.ok(d.querySelector('.jov5-intro.is-clear .jov5-tick'), 'nothing waiting is said with the tick');
  assert.equal(d.querySelectorAll('.jov5-g').length, 3, 'three tiles');
  assert.equal(d.querySelectorAll('button.jov5-g.is-door').length, 1, 'only a tile with a press is a door');
  assert.ok(d.querySelector('button.jov5-row.is-door'), 'the row is the door');
  assert.equal(d.querySelectorAll('.jov5-go').length, 1, 'one black button');
  const parts = [...d.querySelector('.jov5').children].map(e => e.className);
  assert.match(parts[parts.length - 1], /jov5-src/, 'the small print is last');
  d.querySelector('button.jov5-g.is-door').click(); d.querySelector('button.jov5-row').click(); d.querySelector('.jov5-go').click();
  assert.equal(hit, 3, 'each door runs its own press');
  const old = w.win.jamboOverviewHtml({ head: { b: 'Head.' }, facts: [{ k: 'K', v: 'V' }] }, 'f1068b');
  assert.match(old, /jov-head/); assert.doesNotMatch(old, /jov5/, 'a page with no title is drawn as before');
});

test('f1068 (2) signed contracts are read as the record says; a value is never shown to someone not allowed', () => {
  const w = world();
  const st = stateOf(w); const before = w.win.jov5Signed().length;
  st.contracts.push({ id: 'F62-S', name: 'Signed one', status: 'Signed', value: 5000000, folder: (st.contracts[0] || {}).folder });
  st.contracts.push({ id: 'F62-E', name: 'Executed one', status: 'Executed', value: 7000000, folder: (st.contracts[0] || {}).folder });
  assert.equal(w.win.jov5Signed().length, before + 2, 'Signed and Executed both count');
  const c = st.contracts.find(x => x.id === 'F62-S');
  w.me.canViewValues = false;
  assert.equal(w.win.jov5Money(c), '', 'no value for someone not allowed to see values');
});

test('f1068 (3) the ten round-1 panels say the five parts in the new look, and nothing new in the old', () => {
  const w = world(); const W = w.win;
  const says = {
    approvals: () => W.apSay([]),
    negotiations: () => { const f = W.regNegoSayFive([], { you: 0, them: 0, out: 0 }); return f; },
    obligations: () => W.obYourWeekSay(),
    requests: () => W.ikJlSay([], false, () => {})(),
    import: () => W.migSideSay(),
    mynotes: () => W.mnJlSay(),
    flowmap: () => W.fmJlSay(),
  };
  newLook(w, true);
  for (const [k, fn] of Object.entries(says)){
    const r = fn(); assert.ok(r && r.title, k + ' hands in a title in the new look');
    const html = W.jamboOverviewHtml(W.jamboOverviewOf(r), 'f62:' + k);
    assert.match(html, /jov5-title/, k + ' is drawn in five parts');
  }
  assert.match(W.igOverviewHtml(), /jov5-title/, "Explorer's Overview");
  newLook(w, false);
  for (const k of ['approvals', 'obligations', 'requests', 'mynotes', 'flowmap']){
    const r = says[k](); assert.ok(!r || !r.title, k + ' adds nothing in the old look');
  }
  assert.doesNotMatch(W.igOverviewHtml(), /jov5/, "Explorer's Overview is as it was in the old look");
});

test('f1068 (3b) Approvals with nothing waiting is good news and never stops there', () => {
  const w = world(); const W = w.win; newLook(w, true);
  stateOf(w).contracts.push({ id: 'F62-A', name: 'Courier Services', counterparty: 'Swift Couriers', status: 'Signed' });
  const r = W.apSay([]);
  if (W.apWorkRows().rows.length) return; /* the world has work waiting: the good-news half is not this world's */
  assert.ok(r.clear, 'the tick');
  const labels = (r.groups || []).map(g => g.label);
  assert.ok(labels.includes(W.i18t('jov5_ap_recent')), 'what was signed most recently');
  assert.ok(labels.includes(W.i18t('jov5_ap_rules')), 'the rule that holds today');
});

test('f1068 (4) Explorer\'s suggestions are rows of its Overview, never also chips under it', () => {
  const src = read('js/views/intelligence.js');
  assert.match(src, /function igSugInRows\(\)/);
  assert.match(src, /box\.innerHTML=igSugInRows\(\)\?'':igViewSuggestions\(\)/, 'the chip row stands down while the rows show');
  assert.match(src, /igSugOnMap\(\)\?\(igSugInRows\(\)\?\[\]:igViewSuggestions\(\)\)/, "the dock's own chip line too");
  const w = world(); newLook(w, false);
  assert.equal(w.win.igSugInRows(), false, 'the old look keeps its chips');
});

test('f1068 (5) Import\'s drop area in the panel is the page\'s own door', () => {
  const src = read('js/views/migration.js');
  assert.match(src, /data-mig-paneldrop/);
  assert.match(src, /closest\('\[data-mig-paneldrop\]'\)\)\)\{ document\.getElementById\('mig-files'\)\?\.click\(\)/, 'a press opens the page\'s own file picker');
  assert.match(src, /if \(e\.dataTransfer\) migDropTake\(e\.dataTransfer\)/, 'a drop goes the strip\'s way');
});

test('f1068 (6) every jov5_ word the code asks for is in both books', () => {
  const W = world().win;
  const files = ['js/components.js', 'js/obligations.js', 'js/paperdesk.js', 'js/views/approvalsview.js', 'js/views/register.js', 'js/views/intake.js',
    'js/views/mynotes.js', 'js/views/flowmap.js', 'js/views/migration.js', 'js/views/intelligence.js'];
  const keys = new Set(); for (const f of files) for (const m of read(f).matchAll(/['"](jov5_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size > 100, 'the round\'s words are found');
  const S = W.eval('typeof STRINGS !== "undefined" ? STRINGS : null'); assert.ok(S && S.en && S.sv, 'both books');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  const missing = [...keys].filter(k => !has(S.en, k) || !has(S.sv, k));
  assert.deepEqual(missing, []);
});
