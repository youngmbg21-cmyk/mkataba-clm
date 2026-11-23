'use strict';
/* f1195 — WHO SIGNS, ON THE WORKING PAPER (owner's pick by name, "the Legora + Stripe way", 23 Nov 2026; on every
   contract, not only amendments).
   (1) A NAMED SIGNER: the name in the paper's type with "signs 1st"/"signs 2nd" from the signing route's order, then
       "title, for company" in place of "For company"; read off pagesSignRows, the signing copy's own reading.
   (2) NOBODY NAMED: an amber "name · title" space; none for a Viewer or a sealed paper (`owed: false`).
   (3) PAINTED, NEVER STORED, PUT BACK WHOLE: a second paint draws once; pagesSignNamesOff restores the foot.
   (4) WIRED WHERE THE PAPER IS PAINTED (pdPaint → pdSignNamesPaint), stepping aside on the signing copy and while Fill in
       holds the lines (pd2FillSigPaint clears it). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const FOOT = '<div id="cv"><div class="rl-paper-foot"><div class="rl-sigline"><span class="rl-sigrule"></span><span class="rl-sigfor">For Highland Ltd</span></div>'
  + '<div class="rl-sigline"><span class="rl-sigrule"></span><span class="rl-sigfor">For Naivas</span></div></div></div>';
function world(){
  const dom = new JSDOM('<!doctype html><body>' + FOOT + '</body>', { runScripts: 'outside-only' });
  const W = dom.window;
  W.eval(`var FIRST_PARTY = 'Highland Ltd';
    function i18t(k, v){ v = v || {}; return ({ pd2_ps_signs: 'signs ' + v.nth, pg_sn_signed: 'signed', pg_sn_title_for: v.title + ', for ' + v.who, pg_sn_owed: 'name · title' })[k] || k; }
    function i18ord(n){ return n === 1 ? '1st' : n === 2 ? '2nd' : n + 'th'; }`);
  W.eval(R('js/pages.js'));
  return W;
}
const cv = W => W.document.getElementById('cv');
const said = W => [...cv(W).querySelectorAll('.rl-sigline')].map(el => el.textContent.replace(/\s+/g, ' ').trim());

test('f1195 (1) a named signer: name, order badge, title for company', () => {
  const W = world();
  const c = { id: 'MK-1', counterparty: 'Naivas', signatures: [], signerPlan: [
    { party: 'internal', name: 'Amina Otieno', role: 'Chief Executive Officer' }, { party: 'counterparty', name: 'Peter Kamau', role: 'Commercial Director' }] };
  assert.equal(W.pagesSignNames(cv(W), c), 2);
  assert.deepEqual(said(W), ['Amina Otienosigns 1stChief Executive Officer, for Highland Ltd', 'Peter Kamausigns 2ndCommercial Director, for Naivas']);
});

test('f1195 (2) nobody named: an amber space, none when it may not be owed', () => {
  const W = world(), c = { id: 'MK-2', counterparty: 'Naivas', signatures: [], signerPlan: [] };
  assert.equal(W.pagesSignNames(cv(W), c), 2);
  assert.equal(cv(W).querySelectorAll('.rl-sn-owed').length, 2);
  assert.equal(W.pagesSignNames(cv(W), c, { owed: false }), 0);
  assert.equal(cv(W).querySelectorAll('.rl-signames').length, 0);
});

test('f1195 (3) painted twice draws once; taken off, the foot is as it was', () => {
  const W = world(), c = { id: 'MK-1', counterparty: 'Naivas', signatures: [], signerPlan: [{ party: 'internal', name: 'Amina Otieno', role: 'CEO' }] };
  W.pagesSignNames(cv(W), c); W.pagesSignNames(cv(W), c);
  assert.equal(cv(W).querySelectorAll('.rl-signames').length, 2);
  W.pagesSignNamesOff(cv(W));
  assert.deepEqual(said(W), ['For Highland Ltd', 'For Naivas']);
});

test('f1195 (4) wired where the paper is painted, standing aside where it must', () => {
  const PD = strip(R('js/paperdesk.js'));
  assert.match(PD, /function pdPaint\(c\)\{[\s\S]{0,400}pdSignNamesPaint\(c \|\| pdContract\(\)\)/);
  const i = PD.indexOf('function pdSignNamesPaint('), fn = PD.slice(i, i + 700);
  assert.match(fn, /igSignOn\(c\)\) \|\| pd2FillOn\(c\.id\)/);
  assert.match(fn, /owed: !sealed && may/);
  assert.match(PD, /function pd2FillSigPaint\(c, cv\)\{\s*if \(typeof pagesSignNamesOff === 'function'\) pagesSignNamesOff\(cv\);/);
  assert.match(R('index.html'), /@media print\{ \.rl-sn-badge, \.rl-sn-owed\{display:none\} \}/);
});
