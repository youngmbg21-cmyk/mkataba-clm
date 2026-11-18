'use strict';
/* f1095 — NO PAGE FLASHES ROUND THE COVER (owner, 16 Nov 2026: "When i am on the cover page and i press to go back to
   contracts, a page of the paper and dossier flash before i land on contracts … i also see it when i am in the
   contracts page and i pick on a contract to view").
   Measured frame by frame before: Cover → Contracts painted the paper and Dossier for ~85ms (the handler closed the
   Cover, WAITED 60ms, then went); Contracts → a contract painted the paper for 25–45ms before the Cover (it was asked
   for 30ms later, then every 100ms).
   (1) A press on the Cover closes it and draws its destination in ONE turn: no timer between the two; the brief
       opens OVER the Cover (a page replacing a page never closes first, f1046).
   (2) A contract opened on purpose asks for its Cover AT ONCE; while the paper is on its way a plain veil in the
       page's own ground stands over it, bounded (CV_LAND_MS), and always taken away. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(read('js/paperdesk.js'));

test('f1095 (1) a press on the Cover goes in one turn, never after a wait', () => {
  const i = PD.indexOf("closest('[data-cv-go]')"); assert.ok(i > 0);
  const h = PD.slice(i, PD.indexOf('});', i));
  assert.doesNotMatch(h, /setTimeout/, 'no timer between closing the Cover and the destination');
  assert.match(h, /if \(k === 'brief' && typeof pd2BriefOpen === 'function'\)\{ pd2BriefOpen\(id\); return; \}\s*pdMidClose\(\);/, 'the brief opens over the Cover, before any close');
  assert.match(h, /pdMidClose\(\);\s*if \(k === 'red'\) pdRedOpen\(id\);/, 'close and go, the same turn');
  assert.match(h, /k === 'contracts' && typeof setView === 'function'\) setView\('register'\)/);
});

test('f1095 (2) the Cover is asked for at once, behind a bounded veil', () => {
  const land = PD.slice(PD.indexOf('function pdCoverLand('), PD.indexOf("document.addEventListener('click'", PD.indexOf('function pdCoverLand(')));
  assert.match(land, /if \(ready\(\) && pdCoverOpen\(id\)\) return true;\s*pdCoverVeil\(true\);/, 'at once, else the veil');
  assert.match(land, /if \(ready\(\)\)\{ pdCoverOpen\(id\); pdCoverVeil\(false\); return; \}/, 'the veil goes when the Cover stands');
  assert.match(land, /Date\.now\(\) - t0 < CV_LAND_MS\) setTimeout\(tick, 16\); else pdCoverVeil\(false\)/, 'bounded, and taken away on giving up');
  assert.doesNotMatch(land, /setTimeout\(tick, 100\)/, 'never a tenth of a second between looks');
  assert.match(strip(read('index.html')), /html\.lg-new #cv-veil\{position:fixed;[^}]*z-index:69;[^}]*background:var\(--color-surface\)\}/, 'under the page layer, the page\'s own ground');
});
