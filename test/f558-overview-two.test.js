/* f558 — OVERVIEW 2, THE TIME MACHINE (work order O, part 7, 7 Oct 2026; O-36..O-42)
   (1) the tab sits right after the Overview and is painted on arrival; the
       Overview itself is untouched.
   (2) the model reads the record's own dates: signed, start, end, the notice
       deadline, the renewal year; nothing when the record holds nothing.
   (3) a duty's state on a date: done, late, due soon, coming up; repeats are
       drawn, never stored.
   (4) the measure: money by the date where obligations carry amounts, else
       the term left, else nothing (never guessed).
   (5) what you can do: stop the renewal until the notice deadline, too late
       after; the wording's windows; whether anything is late.
   (6) the dated-windows route drops a window whose quote is not in the
       wording, and counts it (O-40).
   (7) the colours are the design's, scoped to the tab, light and dark.
   (8) every new word is in both books. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CT = read('js/views/contract.js'), OV2 = read('js/views/overview2.js'), HTML = read('index.html'), I18N = read('js/i18n.js');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const iso = d => d.toISOString().slice(0, 10);
const T = new Date(); T.setUTCHours(0, 0, 0, 0);
const dayIn = n => iso(new Date(+T + n * 864e5));

function load(){
  const ctx = { window: {}, console, Date, Math, JSON, Number, String, Array, Object, isFinite, isNaN, Map, Set, RegExp };
  ctx.window = ctx;
  ctx.i18t = (k, p) => k + (p ? JSON.stringify(p) : '');
  ctx.i18tn = (k, n, p) => k + (p ? JSON.stringify(p) : '');
  ctx.todayISO = () => iso(T);
  ctx.document = { getElementById: () => null };
  vm.createContext(ctx);
  vm.runInContext(OV2, ctx);
  return ctx;
}
const base = over => Object.assign({ id: 'MK-1', name: 'Supply', counterparty: 'Juno', status: 'Signed', signedAt: dayIn(-210),
  fields: { effDate: dayIn(-200) }, expiry: dayIn(500), metadata: { renewalType: 'auto-renew', noticePeriodDays: 90 }, obligations: [] }, over || {});

/* RE-POINTED 9 Oct 2026: the owner asked for the Overview 2 TAB to go and the
   Overview to stay. The module stays loaded for its readings. */
test('f558 (1) the tab is gone, the Overview stays, the module still loads', () => {
  assert.ok(CT.indexOf("['terms','tab_overview'],") > -1, 'the Overview stays');
  assert.equal(CT.indexOf("['ov2','tab_overview_2'],"), -1, 'no Overview 2 tab');
  assert.doesNotMatch(CT, /_wsTab==='ov2'/);
  assert.doesNotMatch(CT, /<div data-ws-pane="ov2"/);
  assert.match(read('js/app.js'), /import '\.\/views\/overview2\.js';/);
});

test('f558 (2) the model reads the record\'s own dates', () => {
  const w = load();
  w.contractSignedAt = c => c.signedAt;
  w.effectiveExpiry = c => c.expiry;
  const M = w.ov2Model(base());
  assert.equal(iso(M.start), dayIn(-200));
  assert.equal(iso(M.end), dayIn(500));
  assert.equal(iso(M.noticeBy), dayIn(410), 'ninety days before the end');
  assert.equal(M.marks.map(m => m.l).join(','), 'ov2_m_signed,ov2_m_starts,ov2_m_notice,ov2_m_end_renews');
  assert.ok(M.bands.some(b => b.l === 'ov2_b_renewal_year'), 'the renewal year, if nobody acts');
  const N = w.ov2Model(base({ expiry: '', metadata: {} }));
  assert.equal(N.end, null, 'no end date is said, not guessed');
  assert.ok(!N.marks.some(m => m.l === 'ov2_m_notice'));
});

test('f558 (3) a duty\'s state on a date; repeats are drawn, never stored', () => {
  const w = load();
  w.contractSignedAt = c => c.signedAt; w.effectiveExpiry = c => c.expiry;
  const c = base({ obligations: [{ id: 'a', desc: 'Pay', due: dayIn(-5), recurring: 'monthly', status: 'open' }, { id: 'b', desc: 'Report', due: dayIn(10), status: 'open' }] });
  const M = w.ov2Model(c);
  assert.ok(M.occ.filter(x => x.t === 'Pay').length > 5, 'the monthly duty repeats on the track');
  assert.equal(c.obligations.length, 2, 'and nothing was stored');
  const late = M.occ.find(x => x.t === 'Pay' && !x.projected), soon = M.occ.find(x => x.t === 'Report');
  assert.equal(w.ov2OccState(late, M.today, M.today), 'r');
  assert.equal(w.ov2OccState(soon, M.today, M.today), 'a');
  assert.equal(w.ov2OccState(Object.assign({}, soon, { done: M.today }), M.today, M.today), 'g');
});

test('f558 (4) the measure: money, else the term left, else nothing', () => {
  const w = load();
  w.contractSignedAt = c => c.signedAt; w.effectiveExpiry = c => c.expiry; w.isMonetary = () => true;
  const M = w.ov2Model(base({ obligations: [{ id: 'a', desc: 'Pay', due: dayIn(-30), status: 'done', completedAt: dayIn(-28), amount: 100 }, { id: 'b', desc: 'Pay 2', due: dayIn(30), status: 'open', amount: 300 }] }));
  const m = w.ov2Measure(M, M.today);
  assert.equal(m.big, 100); assert.equal(m.frac, 0.25);
  const later = w.ov2Measure(M, new Date(+M.today + 40 * 864e5));
  assert.equal(later.big, 400, 'expected by a later date');
  const t = w.ov2Measure(w.ov2Model(base()), w.ov2Model(base()).today);
  assert.match(t.cap, /ov2_ms_term_left/);
  assert.equal(t.big, 500);
  assert.equal(w.ov2Measure(w.ov2Model(base({ expiry: '', fields: {}, signedAt: '' })), w.ov2Model(base()).today), null, 'nothing to measure is not drawn');
});

test('f558 (5) what you can do on a date', () => {
  const w = load();
  w.contractSignedAt = c => c.signedAt; w.effectiveExpiry = c => c.expiry;
  const c = base(); c.datedWindows = { ok: true, windows: [{ label: 'Prices fixed', kind: 'fixed', from: dayIn(-200), to: dayIn(100), clause: '4.1', rule: 'Prices cannot change.' }] };
  const M = w.ov2Model(c);
  const now = w.ov2Can(M, M.today).map(r => r[1]);
  assert.equal(now.join(','), 'ov2_c_stop,Prices fixed,ov2_c_nolate');
  assert.equal(w.ov2Can(M, M.today)[0][0], 'g', 'renewal can still be stopped');
  const after = w.ov2Can(M, new Date(+M.noticeBy + 864e5));
  assert.equal(after[0][0], 'r', 'too late after the notice deadline');
  assert.ok(!after.some(r => r[1] === 'Prices fixed'), 'the window is over');
});

describe('f558 (6) the dated windows are checked against the wording', () => {
  let h, ai, W;
  before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base }); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); await ai.stop(); });
  test('a window resting on words the contract does not hold is dropped and counted', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'w1', name: 'list_windows', input: { windows: [
      { label: 'Prices fixed', kind: 'fixed', from: '2026-02-01', to: '2027-01-31', clause: '4.1', rule: 'Prices cannot change.', quote: 'Prices are fixed until 31 January 2027' },
      { label: 'Exit fee', kind: 'fee', from: '2027-02-01', to: '2027-07-31', clause: '13.3', quote: 'an exit fee of one million' },
      { label: 'Bad dates', kind: 'other', from: '2027-13-01', to: '2027-01-01', quote: 'Prices are fixed' }] } }]);
    const r = await W.admin.json('/api/ai/windows', { method: 'POST', body: { text: 'Prices are fixed until 31 January 2027 and then follow the CPI. ' + 'x'.repeat(300), start: '2026-02-01', end: '2028-01-31' } });
    assert.equal(r.windows.length, 1);
    assert.equal(r.windows[0].label, 'Prices fixed');
    assert.equal(r.dropped, 2);
  });
});

test('f558 (7) the design\'s colours, scoped to the tab, light and dark', () => {
  for (const v of ['--ov2-surface:#FFFFFF', '--ov2-text:#141F1D', '--ov2-acc-fill:#264C9E', '--ov2-alt:#12796D', '--ov2-p3:#6E4BB8', '--ov2-g-bg:#DFF2E7', '--ov2-a-dot:#E8A317', '--ov2-r-fg:#B3261E', '--ov2-s-dot:#6F86BF'])
    assert.ok(HTML.includes(v), v);
  for (const v of ['--ov2-surface:#151B1A', '--ov2-acc-fill:#3560B4', '--ov2-a-fg:#EBAD46', '--ov2-s-fg:#8FA8DE'])
    assert.ok(HTML.includes(v), 'dark ' + v);
  assert.match(HTML, /:root:not\(\[data-brand="navy"\]\)\{--ov2-acc-fill:var\(--accent-fill/, 'Green takes its own accent ladder');
  assert.ok(!/\.ov2[^{]*\{[^}]*!important/.test(HTML), 'never !important');
});

test('f558 (8) every new word is in both books', () => {
  for (const k of ['tab_overview_2', 'ov2_life', 'ov2_play', 'ov2_today', 'ov2_duties', 'ov2_can', 'ov2_fam_title', 'ov2_fam_alone', 'ov2_fam_wins', 'ov2_parties',
    'ov2_m_signed', 'ov2_m_notice', 'ov2_b_renewal_year', 'ov2_c_stop', 'ov2_c_stop_late', 'ov2_say_nolate', 'ov2_say_next', 'ov2_ring_days', 'ov2_win_unread', 'ov2_ms_term_left'])
    assert.ok(inBoth(k), k);
});
