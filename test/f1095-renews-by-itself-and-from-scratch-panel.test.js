'use strict';
/* f1095 — TWO BUGS LOGGED WHILE DRAWING THE TEN PANELS (owner, 18 Nov 2026: "Fix the bugs").
   (1) READ DOWN SAID NOTHING RENEWS BY ITSELF: it counted `c.autoRenew`, a field nothing in HaTi writes, so it always
       said "0 of the N renew by themselves" — while a contract read as auto-renewing (metadata.renewalType
       'auto-renew', what the overnight run renews on) said otherwise on its own paper. A contract's panels and its
       Cover read yet another unwritten flag (metadata.autoRenew). ONE reading now: contractRenewsItself(c).
   (2) NEW AGREEMENT → FROM SCRATCH SHOWED A DIFFERENT PANEL FROM VISIT TO VISIT: the third tab is not a paper, so the
       paper left behind (Our paper's or Their paper's hand) kept answering Jambo's panel, and nothing redrew it when the
       tab turned. Now neither hand answers while From scratch is up, and turning the tab redraws the panel.
   AT THE PARENT every test here fails: contractRenewsItself does not exist, read down reads c.autoRenew, the hands
   answer on From scratch. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, start, end) => { const i = src.indexOf(start); assert.ok(i >= 0, start + ' is there'); const j = end ? src.indexOf(end, i + start.length) : -1; return strip(src.slice(i, j > i ? j : i + 6000)); };

test('f1095 (1a) one reading says whether a contract renews by itself', () => {
  const W = buildWorld({ obligations: true }).win;
  assert.equal(typeof W.contractRenewsItself, 'function', 'published');
  assert.equal(W.contractRenewsItself({ metadata: { renewalType: 'auto-renew' } }), true, 'the renewal type read from the wording');
  assert.equal(W.contractRenewsItself({ metadata: { renewalType: 'fixed' } }), false);
  assert.equal(W.contractRenewsItself({ metadata: {} }), false, 'nothing recorded is not a renewal');
  assert.equal(W.contractRenewsItself({ autoRenew: true }), false, 'the unwritten top-level field is never read');
  assert.equal(W.contractRenewsItself({ metadata: { autoRenew: true } }), true, 'an older record\'s flag still counts');
});

test('f1095 (1b) read down and every contract panel read it, and no unwritten field is read', () => {
  const hb = region(read('js/views/homeboard.js'), 'function hbRdnRead(){', 'function hbRdnSentences');
  assert.match(hb, /const autoEnd = ending\.filter\(c => typeof contractRenewsItself === 'function' && contractRenewsItself\(c\)\)/);
  assert.doesNotMatch(hb, /c\.autoRenew\b/);
  const pd = strip(read('js/paperdesk.js'));
  assert.equal((pd.match(/contractRenewsItself\(c\)/g) || []).length, 5, 'the four renewal lines and the Cover');
  assert.doesNotMatch(pd, /metadata \|\| \{\}\)\.autoRenew/, 'no panel reads the unwritten flag');
  assert.match(region(read('js/obligations.js'), 'function renewalWindow', 'A DEADLINE OLDER'), /const auto = contractRenewsItself\(c\);/, 'the renewal window too');
});

test('f1095 (2) From scratch: neither paper answers Jambo\'s panel, and turning the tab redraws it', () => {
  const wz = region(read('js/wizard.js'), 'const npUp=()=>', 'root._naTheirSet');
  assert.match(wz, /const npUp=\(\)=>root\.classList\.contains\('is-newpaper'\);/);
  assert.match(wz, /_naOurs=\{ up:\(\)=>paper==='ours'&&naSheetUp\(\)&&!npUp\(\)/, 'Our paper\'s hand stands down');
  assert.match(wz, /_naTheirs=\{ up:\(\)=>\(paper==='theirs'\|\|paper==='kept'\)&&naSheetUp\(\)&&!npUp\(\)/, 'Their paper\'s hand stands down');
  assert.match(region(read('js/wizard.js'), 'function naNewPaperShow(root,on){', 'function naNewPaperGo'), /renderIntelDock\(\)/, 'the panel is drawn again as the tab turns');
});
