'use strict';
/* f968 — HOME IN THE NEW LOOK (round 2 of the Legora way rebuilt; owner, 31 Oct 2026, the six answers).
   (1) ONE LIST, MOST URGENT FIRST: cn2Rows puts late, then your move, then Jambo's prepared work, then this week, and
       keeps the desk's own order inside each; the "Finish setting up" row is not on it.
   (2) ONE SENTENCE COUNTED FROM THE LIST: "2 things are late, 1 waits on you and I prepared 1 for you."; nothing waiting
       says so.
   (3) THE PAPER'S WORDS ONLY WHERE KNOWN: their pending change quotes the words it proposes under its clause's number;
       a row of another kind quotes nothing.
   (4) BEHIND THE SWITCH: renderCounter draws the new Home only when newLookOn and the panel fits (cn2On); today's Home
       otherwise. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CN = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'counter.js'), 'utf8');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const i = src.indexOf('const ' + name + ' '); return i < 0 ? '' : src.slice(i, src.indexOf('\n', i)); };
const WORDS = { cn2_s_late_one: '{n} thing is late', cn2_s_late_other: '{n} things are late', cn2_s_you_one: '{n} waits on you', cn2_s_you_other: '{n} wait on you',
  cn2_s_jambo_one: 'I prepared {n} for you', cn2_s_jambo_other: 'I prepared {n} for you', cn2_s_and: ' and ', cn2_s_none: 'Nothing waits on you.' };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
function world(kinds){
  const ctx = { i18t: (k, v) => fill(WORDS[k] || k, v), i18tn: (k, n, v) => fill(WORDS[k + (n === 1 ? '_one' : '_other')] || k, { n, ...(v || {}) }),
    ndKindOfRow: r => kinds[r.key] };
  vm.createContext(ctx);
  vm.runInContext([constLine(CN, '_cnE'), constLine(CN, '_cnT'), constLine(CN, '_cnTn'), constLine(CN, 'CN2_RANK'), fnBody(CN, 'cn2Rows'), fnBody(CN, 'cn2Say'), fnBody(CN, 'cn2QuoteHtml')].join('\n'), ctx);
  return ctx;
}

test('f968 (1) one list, most urgent first, the desk\'s own order inside each kind; no set-up row', () => {
  const w = world({ j1: 'jambo', y1: 'you', l1: 'late', y2: 'week', l2: 'late', s: 'you' });
  const D = { jambo: [{ key: 'j1', g: 'jambo' }], you: [{ key: 'y1' }, { key: 'l1' }, { key: 'y2' }, { key: 'l2' }, { key: 's', setup: 3 }] };
  assert.deepEqual(w.cn2Rows(D).map(x => x.r.key), ['l1', 'l2', 'y1', 'j1', 'y2']);
});
test('f968 (2) one sentence counted from the list', () => {
  const w = world({});
  const L = ks => ks.map(k => ({ k }));
  assert.equal(w.cn2Say(L(['late', 'late', 'you', 'jambo'])), '2 things are late, 1 waits on you and I prepared 1 for you.');
  assert.equal(w.cn2Say(L(['you', 'week'])), '2 wait on you.');
  assert.equal(w.cn2Say([]), 'Nothing waits on you.');
});
test('f968 (3) the paper\'s words only where known', () => {
  const w = world({});
  const c = { changes: [{ authorSide: 'counterparty', status: 'pending', clauseLabel: '3. PAYMENT', newText: 'Payment is due within <b>sixty</b> (60) days of invoice.' },
    { authorSide: 'owner', status: 'pending', clauseLabel: '4. DELIVERY', newText: 'Ours.' }] };
  const html = w.cn2QuoteHtml({ y: { x: { c, it: { kind: 'quiet' } } } });
  assert.match(html, /<b class="cn2-sec">§ 3 Payment<\/b> — <q class="cn2-src">Payment is due within sixty \(60\) days of invoice\.<\/q>/);
  assert.ok(!/Ours/.test(html), 'only their pending changes');
  assert.equal(w.cn2QuoteHtml({ y: { x: { c, it: { kind: 'approval' } } } }), '', 'an approval quotes nothing');
  assert.equal(w.cn2QuoteHtml({ g: 'jambo' }), '');
});
test('f968 (4) behind the switch: the new Home only with newLookOn and room for the panel', () => {
  assert.match(fnBody(CN, 'cn2On'), /newLookOn\(\) && typeof insFits === 'function' && insFits\(\)/);
  assert.match(fnBody(CN, 'renderCounter'), /if \(cn2On\(\)\)\{ renderCounter2\(host\);/);
});
