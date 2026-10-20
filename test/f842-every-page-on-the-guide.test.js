'use strict';
/* f842 — EVERY NEW PAGE IS ON THE GUIDE (flow rule 9c; owner, 20 Oct 2026:
   "add a rule that any new pages need to be added to the guide page", then
   "yes add the check").

   Every word Jambo can open (CA_PLACES, js/copilotacts.js) is either a page —
   and then it has its row in the Guide (GUIDE_STAGES, or the Home and Settings
   rows guidePanelHtml draws at the top and foot) — or it is named below as
   not a page, with the reason. A new place word that is neither fails here.

   PAGES_NOT_ON_THE_GUIDE is the 20 Oct 2026 debt: pages that were already
   missing when the rule was made. It ONLY SHRINKS: a page on it that gains its
   Guide row fails (2) until it is taken off the list. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const APP = R('js/app.js');
const CA = R('js/copilotacts.js');

/* words that are not pages: acts, faces on one contract, ways of showing a page, panel tabs */
const NOT_A_PAGE = {
  redline: 'a face beside one contract',
  sign: 'a face beside one contract',
  share: 'a face beside one contract',
  fill: 'a face beside one contract',
  brief: 'one contract\'s brief',
  history: 'a contract\'s history',
  next: 'the next steps on one contract',
  needs: 'a card on Home',
  work: 'Jambo\'s work, a card on the Board',
  wall: 'a way of showing Contracts',
  list: 'a way of showing Contracts',
  upload: 'an act (the drop area)',
  back: 'an act (go back)',
  help: 'an answer, not a page',
  guide: 'a tab of the side panel',
  alerts: 'a tab of the side panel',
  activity: 'a tab of the side panel',
};
/* the 20 Oct 2026 debt — only shrinks */
const PAGES_NOT_ON_THE_GUIDE = {
  insights: 'Insights (view intel)',
  brain: 'The Brain map (view brain)',
};

const placeKeys = () => {
  const i = CA.indexOf('const CA_PLACES = [');
  assert.ok(i >= 0, 'CA_PLACES is found');
  const body = CA.slice(i, CA.indexOf('\n];', i));
  return [...body.matchAll(/\{\s*k:\s*'([a-z]+)'/g)].map(m => m[1]);
};
const guideKeys = () => {
  const i = APP.indexOf('const GUIDE_STAGES = [');
  assert.ok(i >= 0, 'GUIDE_STAGES is found');
  const body = APP.slice(i, APP.indexOf('\n];', i));
  const rows = [...body.matchAll(/rows:\s*\[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/'([a-z]+)'/g)].map(x => x[1]));
  const f = APP.slice(APP.indexOf('function guidePanelHtml('), APP.indexOf('\n}', APP.indexOf('function guidePanelHtml(')));
  const extra = [...f.matchAll(/guideRowHtml\('([a-z]+)'/g)].map(m => m[1]);
  return new Set(rows.concat(extra));
};

test('f842 (1) every page Jambo can open has its row in the Guide, or is named as not a page', () => {
  const guide = guideKeys(), keys = placeKeys();
  assert.ok(keys.length > 20 && guide.size > 10, 'both lists were read');
  const missing = keys.filter(k => !guide.has(k) && !NOT_A_PAGE[k] && !PAGES_NOT_ON_THE_GUIDE[k]);
  assert.deepEqual(missing, [], 'a new page needs its Guide row (flow rule 9c): ' + missing.join(', '));
});

test('f842 (2) the debt only shrinks: a page given its Guide row comes off the list', () => {
  const guide = guideKeys(), keys = placeKeys();
  for (const k of Object.keys(PAGES_NOT_ON_THE_GUIDE)) {
    assert.ok(keys.includes(k), `${k} is still a place word (else take it off the list)`);
    assert.ok(!guide.has(k), `${k} is on the Guide now: take it off PAGES_NOT_ON_THE_GUIDE`);
  }
});
