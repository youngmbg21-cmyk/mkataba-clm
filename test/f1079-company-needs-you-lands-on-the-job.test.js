/* f1079 — "COMPANY NEEDS YOU" LANDS ON THE EXACT JOB (owner, 16 Nov 2026: "Make Company needs you land on the exact
   job"):
     1 the bell's and the Board's Company row press one door, cnCompanyGo; a panel row reaches it through ndRowGo
     2 driven: one job opens that job (its own door pressed); several open Settings and land on the first; the email
       warning alone presses its own door
     3 driven: stNeedGo presses the job's own door on the Settings page, and refuses a non-admin to My account
   At the parent (1)–(3) fail: the row opened Settings' front page (openSettingsAt('company')), no job.
   Run: node --test test/f1079-company-needs-you-lands-on-the-job.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\n}', i) + 2)); };
const CN = read('js/views/counter.js'), ST = read('js/views/settings.js');

test('f1079 (1) one door for the Company row, from the bell, the Board and a panel row', () => {
  assert.match(CN, /if \(\(el = t\.closest\('\[data-cn-co\]'\)\)\)\{ cnCompanyGo\(\); return; \}/);
  assert.match(body(CN, 'ndRowGo'), /if \(r\.company\) return cnCompanyGo\(r\);/);
});

test('f1079 (2) driven: one job, several, the email warning alone', () => {
  const run = (R, mail) => { const calls = [];
    const go = new Function('cnCompany', 'stNeedGo', 'openSettingsAt', body(CN, 'cnCompanyGo') + '\nreturn cnCompanyGo;')(
      () => R, k => { calls.push(['need', k]); return true; }, () => calls.push(['settings']));
    go(mail !== undefined ? { company: R, mail } : undefined); return calls; };
  assert.deepEqual(run([{ key: 'ask:1' }]), [['need', 'ask:1']]);
  assert.deepEqual(run([{ key: 'ask:1' }, { key: 'limits' }]), [['need', null]]);
  const m = []; run([], { go: () => m.push('outbox') }); assert.deepEqual(m, ['outbox']);
  assert.deepEqual(run([{ key: 'ask:1' }], { go: () => {} }), [['need', null]], 'a job and the email warning are two jobs');
});

test('f1079 (3) driven: stNeedGo presses the job\'s own door; a non-admin goes to My account', () => {
  const dom = new JSDOM('<div id="set-page"></div>');
  const doc = dom.window.document, pressed = [], calls = [];
  doc.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-st-panel]'); if (b) pressed.push(b.getAttribute('data-st-panel') + '|' + b.getAttribute('data-st-focus')); });
  const make = (admin, rows) => new Function('document', 'stIsAdmin', 'stNeedsAll', 'openSettingsAt', 'openMyAccount', 'landOn', 'setTimeout',
    body(ST, 'stNeedDoorEl') + '\n' + body(ST, 'stNeedGo') + '\nreturn stNeedGo;')(doc, () => admin, () => rows,
    t => calls.push('settings:' + t), () => calls.push('account'), sel => calls.push('land:' + sel), fn => fn());
  const rows = [{ key: 'limits', btn: 'data-st-panel="limits" data-st-focus="#st-lim-u1"' }, { key: 'backup', btn: 'data-st-panel="backup"' }];
  make(true, rows)('limits');
  assert.deepEqual(pressed, ['limits|#st-lim-u1']);
  assert.equal(doc.querySelectorAll('#set-page button').length, 0, 'the borrowed door is taken away again');
  calls.length = 0; make(true, rows)(null);
  assert.ok(calls.includes('settings:company') && calls.some(c => /^land:#ins-panel \[data-st-panel="limits"\]\[data-st-focus="#st-lim-u1"\]/.test(c)), calls.join(' '));
  calls.length = 0; make(false, rows)('limits');
  assert.deepEqual(calls, ['account']);
});
