'use strict';
/* f1149 — THE ACCESS CHECK (owner's pick 22 Nov 2026: "Build the Legora + Stripe way").
   An admin's press on the Settings landing reads who can see what: the guardrails in place, the concerns, what to change.
   (1) ONE reading by fixed rules, acRead: counts in, findings out; what is outright leads, in place comes last
   (2) a fact that is not known is left out, never guessed; nothing wrong means no concern
   (3) no model and no write: the block calls no AI route and saves nothing; its one server call records the check
   (4) the server's part is the trail line: admins only, the two counts only, clamped
   (5) the card is the admins', on the landing; a fix is a door to a setting that exists; "written in the trail" is
       said only when the server recorded it
   (6) every word in both books
   AT THE PARENT all six fail: there is no acRead, no card, no route. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const S = strip(read('js/views/settings.js'));
const SRV = strip(read('server/server.js'));
const I = read('js/i18n.js');
const fn = name => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); return S.slice(i, S.indexOf('\nfunction ', i + 10)); };
const block = () => { const a = S.indexOf("const AC_LEVELS="), b = S.indexOf("window._acWired=true", a); assert.ok(a >= 0 && b > a, 'the access check is there'); return S.slice(a, S.indexOf('\n}\n', b) + 3); };
const acRead = () => { const lv = S.slice(S.indexOf('const AC_LEVELS='), S.indexOf(';', S.indexOf('const AC_LEVELS=')) + 1);
  return new Function(lv + '\n' + fn('acRead') + '\nreturn acRead;')(); };
/* the workspace in the owner's drawing: four people, one admin, nothing set up yet */
const SEED = { people: 4, admins: 1, nonAdmins: 3, editors: 3, twoKnown: 4, twoOff: 4, twoOffAdmins: 1, twoMine: true, noCap: 3, streams: 6, noKeep: 6, due: 0,
  reviewLeft: 3, reviewTotal: 3, allStreams: 2, limited: 1, linkCode: false, invited: 0, server: true, q: { twostep: 'Two-step · Off' } };

test('f1149 (1) one reading by fixed rules: the drawing\'s twelve, seven of them concerns', () => {
  const list = acRead()(SEED), con = list.filter(x => !x.ok), ok = list.filter(x => x.ok);
  assert.equal(list.length, 12);
  assert.deepEqual(con.map(x => x.k), ['twostep', 'admins', 'cap', 'keep', 'review', 'allstreams', 'linkcode'], 'what is outright first, then as the rules list them');
  assert.deepEqual(con.map(x => x.level), ['high', 'medium', 'medium', 'gdpr', 'medium', 'low', 'low']);
  assert.deepEqual(ok.map(x => x.k), ['trail', 'adminsonly', 'limited', 'private', 'invited'], 'in place last, the standing guardrails leading');
  assert.equal(con[0].quote, 'Two-step · Off', 'a concern carries the setting\'s own words');
  assert.ok(ok.every(x => x.level === 'ok' && x.quote === ''));
  assert.ok(!list.some(x => x.k === 'due'), 'no period set anywhere: nothing can be past its period, so it is not said');
});
test('f1149 (2) the unknown is left out; nothing wrong, no concern', () => {
  const rd = acRead();
  const blind = rd(Object.assign({}, SEED, { twoKnown: 0, noKeep: null, due: null, reviewLeft: null, linkCode: null, invited: null, server: false }));
  for (const k of ['twostep', 'keep', 'due', 'review', 'linkcode', 'invited', 'trail']) assert.ok(!blind.some(x => x.k === k), k + ' is not guessed');
  const good = rd({ people: 5, admins: 2, nonAdmins: 3, editors: 3, twoKnown: 5, twoOff: 0, twoOffAdmins: 0, noCap: 0, streams: 4, noKeep: 0, due: 0,
    reviewLeft: 0, reviewTotal: 3, allStreams: 0, limited: 3, linkCode: true, invited: 0, server: true });
  assert.deepEqual(good.filter(x => !x.ok), [], 'every guardrail in place');
  assert.ok(good.some(x => x.k === 'due' && x.ok), 'with periods set, "nothing kept past its period" is said');
  assert.equal(rd(Object.assign({}, SEED, { twoOff: 1, twoOffAdmins: 0 })).find(x => x.k === 'twostep').level, 'medium', 'one editor without it is not "high"');
  assert.equal(rd(Object.assign({}, SEED, { people: 6, admins: 5 })).find(x => x.k === 'admins').many, true, 'too many admins is the same check');
});
test('f1149 (3) no model, no write', () => {
  const B = block();
  assert.doesNotMatch(B, /api\(\s*['"`]ai\b|\/api\/ai|aiAsk|copilot/i, 'nothing is sent to a model');
  assert.doesNotMatch(B, /\bsaveSettings\(|\bpersist\(|\bsaveState\(/, 'nothing is saved');
  const calls = [...B.matchAll(/\bapi\(\s*'([^']+)'(?:\s*,\s*'([A-Z]+)')?/g)].map(m => (m[2] || 'GET') + ' ' + m[1]);
  assert.deepEqual([...new Set(calls)].sort(), ['GET access-check', 'POST access-check'], 'its only calls: the last check\'s stamp, and the record');
  assert.doesNotMatch(B, /\.audit\b|bodyHtml|clauses\b|c\.changes/, 'no contract\'s wording or history is read');
});
test('f1149 (4) the server writes the trail line: admins only, two clamped counts', () => {
  assert.match(SRV, /ACCT_KINDS\.accesscheck = 'Ran the access check';/);
  assert.match(SRV, /app\.get\('\/api\/access-check', auth, admin,/);
  const i = SRV.indexOf("app.post('/api/access-check', auth, admin,"); assert.ok(i > 0, 'the record is an admin\'s');
  const r = SRV.slice(i, SRV.indexOf('\n});', i));
  assert.match(r, /n = v => Math\.max\(0, Math\.min\(99, Math\.floor\(Number\(v\) \|\| 0\)\)\)/);
  assert.match(r, /acctRecord\(req\.user, req\.user, 'accesscheck', `\$\{n\(b\.concerns\)\} concerns · \$\{n\(b\.inPlace\)\} in place`\)/);
  assert.deepEqual([...r.matchAll(/\bb\.(\w+)/g)].map(m => m[1]).sort(), ['concerns', 'inPlace'], 'nothing else is read from the body');
});
test('f1149 (5) the admins\' card; a fix is a door; "written" only when recorded', () => {
  assert.match(fn('sddCardHtml'), /if\(admin\) mid=acCardHtml\(\)\+mid;/);
  assert.match(fn('acRun'), /^function acRun\(\)\{\s*if\(!stIsAdmin\(\)\) return;/);
  const card = fn('acCardHtml');
  assert.match(card, /<span class="ac-mk" aria-hidden="true">/, 'the shield is a mark, never a button\'s words (f385)');
  assert.match(card, /<button type="button" class="jov5-go ac-go" data-ac-run>\$\{esc\(i18t\('ac_card_go'\)\)\}<\/button>/);
  const fix = fn('acFixGo').split('\n}\n')[0];
  assert.match(fix, /if\(!x\|\|x\.ok\) return;/, 'what is in place has no fix');
  assert.deepEqual([...new Set([...fix.matchAll(/\b(settingsGoPage|stDrawerOpen|api|saveSettings)\(/g)].map(m => m[1]))].sort(), ['settingsGoPage', 'stDrawerOpen'], 'doors only');
  const say = fn('acStampSay');
  assert.ok(say.indexOf("if(_ac.err) return i18t('ac_not_rec'") < say.indexOf("i18t('ac_checked'"), 'a check the server did not record says so first');
  assert.match(fn('acTableHtml'), /x\.ok\?'':`<button type="button" class="ui-link st-ls-lnk" data-ac-fix=/);
  assert.match(S, /const ST_LS_PAGES=\[[^\]]*'guard'\];/);
  assert.match(fn('stLsLetGo'), /stLsPick\(_stPage\)\) stLsPickSet\(_stPage,null\)/, 'Overview lets go of the chosen finding (f1148)');
});
test('f1149 (6) every word in both books', () => {
  const B = block();
  const keys = new Set([...B.matchAll(/i18tn?\('(ac_[a-z_]+)'/g)].map(m => m[1]).filter(k => !k.endsWith('_')));
  for (const k of ['twostep', 'admins', 'cap', 'keep', 'due', 'review', 'allstreams', 'linkcode', 'invited']) { keys.add('ac_f_' + k); keys.add('ac_y_' + k); keys.add('ac_n_' + k); keys.add('ac_ok_' + k); }
  for (const k of ['trail', 'adminsonly', 'private']) keys.add('ac_ok_' + k);
  for (const k of ['high', 'medium', 'low', 'gdpr', 'ok']) keys.add('ac_lv_' + k);
  for (const k of ['people', 'streams', 'sharing', 'records']) keys.add('ac_area_' + k);
  assert.ok(keys.size > 60, 'the words are read (' + keys.size + ')');
  const sv = I.indexOf('/* åtkomstkontrollen'); assert.ok(sv > 0);
  const en = I.slice(0, sv), se = I.slice(sv);
  const has = (book, k) => book.includes('\n    ' + k + ': "') || book.includes('\n    ' + k + '_one: "');
  assert.deepEqual([...keys].filter(k => !has(en, k) || !has(se, k)), [], 'in English and in Swedish');
});
