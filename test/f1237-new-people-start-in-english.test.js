'use strict';
/* f1237 — NEW PEOPLE START IN ENGLISH, WHATEVER THE MARKET (owner, 25 Nov 2026: "people who are logging into the site
   as testers are advising that the site is opening up and it is in Swedish"; picked "new people always start in
   English"). langId: the person's own choice (their record, then this browser), else English — the workspace's
   market no longer picks a language. Red at the parent: a Swedish-market workspace opened a new person in Swedish. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const fnBody = name => { const i = SRC.indexOf('function ' + name + '('); assert.ok(i >= 0); return SRC.slice(i, SRC.indexOf('\n}', i) + 2); };
const run = ctx => { vm.createContext(ctx); vm.runInContext(fnBody('langId'), ctx); return ctx.langId(); };
const base = { STRINGS: { en: {}, sv: {} }, I18N_DEFAULT: 'en', I18N_LS: 'k', LANGUAGES: [{ id: 'en', market: 'kenya' }, { id: 'sv', market: 'sweden' }], jxId: () => 'sweden' };

test('f1237 (1) a new person in a Swedish-market workspace reads English', () => {
  assert.equal(run({ ...base, currentUser: () => ({ lang: null }), lsGet: () => null }), 'en');
  assert.equal(run({ ...base, currentUser: () => null, lsGet: () => null }), 'en', 'the sign-in page too');
});
test('f1237 (2) a person who chose Swedish keeps Swedish', () => {
  assert.equal(run({ ...base, currentUser: () => ({ lang: 'sv' }), lsGet: () => null }), 'sv');
  assert.equal(run({ ...base, currentUser: () => null, lsGet: () => 'sv' }), 'sv');
});
