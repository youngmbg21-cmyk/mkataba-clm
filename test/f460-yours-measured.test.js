/* F460 — YOURS, MEASURED (Young picked it by name, 4 Oct 2026: "hati is a
 * company platform and not just me" … "build Yours, measured and merge to
 * main")
 *
 * Today's insights used to offer a picture when a number crossed a bar fixed
 * in the code (15% moved, one party at 20%), the same for every reader, and
 * filled empty places with plain views so a finding and filler looked alike.
 * Now:
 *   · a measure is compared with ITS OWN NORMAL — the trimmed range of the
 *     chart's own months over the past year — and only what lies outside it
 *     is a finding, said with the range ("72 days in Sept · normal 42–44");
 *   · the reader's OWN contracts are read first (the board question "my
 *     contracts"), the company's take a place left over, marked so;
 *   · too little history is said in words, never guessed;
 *   · a quiet day says so, and the usual pictures wait behind one press.
 *
 * Measured as drawn: test/chromium/insights-shelf-verify.js. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const { buildWorld } = require('./world');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const text = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* twelve past months of signings, `per` a month, `mine` of them owned by the
   reader. days(k, j) is how long contract j of month k took to sign. */
function world({ months = 12, per = 6, mine = 3, me = 'u_me', days } = {}){
  const w = buildWorld({ intelView: true }).win;
  const cs = [];
  for (let k = 0; k < months; k++) for (let j = 0; j < per; j++){
    const d = days(k, j, months), signed = mon(k - months, 3 + j), raised = new Date(Date.parse(signed + 'T00:00:00') - d * 864e5);
    cs.push({ id: 'C' + k + '_' + j, name: 'C ' + k + ' ' + j, counterparty: j % 2 ? 'Juno AB' : 'Kevian Kenya Ltd', status: 'Signed', value: 1e6, expiry: mon(k + 20),
      signedAt: signed, _raisedAt: raised.toISOString(), folder: 'proc', audit: [], metadata: { paymentTerms: '30 days' },
      owner: j < mine ? { id: 'u_me', name: 'Me' } : { id: 'u_x', name: 'Someone' } });
  }
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = () => null;
  w.contractExpired = () => false;
  w.currentUser = () => ({ id: me, name: me === 'u_me' ? 'Me' : 'Other', role: 'legal' });
  /* js/core.js's own reading, as the browser publishes it */
  w.contractOwnedBy = (c, u) => !!(c && u && c.owner && (c.owner.id ? String(c.owner.id) === String(u.id) : c.owner.name === u.name));
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  const s = w.hbS(); s.ins = null; s.insOff = {}; s.panels = [];
  return w;
}
/* steady around 42 days, with the last month slow — for the reader's own
   contracts only, or for everybody */
const steady = (k, j) => 41 + (k % 3);
const lateMine = (k, j, n) => (k === n - 1 && j < 3 ? 75 : steady(k, j));
const lateAll = (k, j, n) => (k === n - 1 ? 75 : steady(k, j));

describe('F460 — a finding is a number outside its own normal', () => {
  test('the normal range is the chart\'s own months; the finding says it with its unit once', () => {
    const w = world({ days: lateAll, mine: 0 });
    const f = w.hbInsFinding('sign', false);
    assert.ok(f && f.id, 'the last month is far outside the year\'s range');
    assert.equal(f.title, 'Contracts are taking longer to sign than normal');
    assert.match(f.say, /^75 days in .+ · normal 41–43 days$/);
    assert.equal(f.N.n, 12, 'twelve months counted');
    assert.match(f.rank, /^Highest of 12 months counted$/);
    assert.equal(f.tone, 'warn');
  });
  test('a number inside its range is calm, not news', () => {
    const w = world({ days: steady, mine: 0 });
    const f = w.hbInsFinding('sign', false);
    assert.ok(f && f.calm && !f.id);
  });
  test('too little history is said, never guessed — and the usual pictures open by themselves', () => {
    const w = world({ months: 4, days: lateAll, mine: 0 });
    assert.ok(w.hbInsFinding('sign', false).none, 'four months cannot make a normal');
    assert.equal(w.hbInsightsToday().length, 0);
    assert.equal(w.hbS().ins.young, true);
    assert.equal(w.hbInsUsualOpen(), true, 'a young book still shows its pictures');
    const I = w.hbInsightsToday();
    assert.match(text(w.hbInsRowHtml(I)), /not enough history yet to tell what is normal/);
    assert.match(w.hbShelfHtml(I), /hb-ins is-plain/);
  });
  test('the picture carries the range and lights the month it is about; its doors are taken off', () => {
    const w = world({ days: lateAll, mine: 0 });
    const f = w.hbInsFinding('sign', false);
    const t = w.hbInsThumb(f.C.R);
    assert.match(t, /class="hb-sv-band"/);
    assert.match(t, /class="hb-sv-collit"/);
    assert.ok(!/data-hb-dig|tabindex|role="button"/.test(t));
    assert.ok(!/hb-sv-band|hb-sv-collit/.test(w.hbInsChart(w.hbInsKey('sign')).R.body), 'the open chart is the board\'s own, untouched');
  });
});

describe('F460 — yours first, then the company\'s', () => {
  test('"my contracts" is a board question: the reader\'s own contracts, by the record\'s owner', () => {
    const w = world({ days: steady });
    const c = w.igConditions('show my contracts');
    assert.equal(c.length, 1);
    assert.equal(c[0].field, 'owner');
    assert.equal(c[0].label, 'Your contracts');
    assert.equal(w.state.contracts.filter(c[0].fn).length, 36);
    assert.equal(w.igConditions('average payment days of my signed contracts').filter(x => x.field === 'owner').length, 1);
    assert.equal(w.igConditions('waiting on us mine to answer').filter(x => x.field === 'owner').length, 0, '"mine to answer" is not ownership');
    for (const k of w.HB_INS_MEASURED) assert.equal(w.hbDigData(w.hbInsKey(k, true), 'all').n, 36, k + ': yours is your 36');
  });
  test('what is unusual in yours comes first, marked yours, with the company beside it', () => {
    const w = world({ days: lateMine });
    const I = w.hbInsightsToday();
    assert.equal(I[0].id, 'sign.mine');
    assert.match(I[0].say, /^75 days in .+ · your normal 41–43 days · company \d+ days$/);
    assert.ok(!I.some(x => x.id === 'sign'), 'never the same shape twice');
    const h = w.hbShelfHtml(I);
    assert.match(text(h), /Yours · 36/);
    assert.match(text(h), /Outside the normal range of your own contracts over the past year\./);
    assert.match(text(w.hbInsRowHtml(I)), /what moved outside normal in your contracts, then the company’s/);
  });
  test('a place yours leaves goes to the company\'s, marked so, with the reason', () => {
    const w = world({ days: lateAll });
    const I = w.hbInsightsToday();
    assert.equal(I[0].id, 'sign.mine', 'yours moved too');
    /* now a world where only the company's moved: the reader owns slow-free
       contracts, the others are late */
    const w2 = world({ days: (k, j, n) => (k === n - 1 && j >= 3 ? 110 : steady(k, j)) });
    const I2 = w2.hbInsightsToday();
    assert.equal(I2[0].id, 'sign');
    const h = text(w2.hbShelfHtml(I2));
    assert.match(h, /Company/);
    assert.match(h, /Nothing in your own contracts stood out, so the company’s takes this place\./);
  });
  test('too few of your own: the company\'s, and the row says so', () => {
    const w = world({ days: lateAll, me: 'u_nobody' });
    assert.equal(w.hbInsScope().few, true);
    const I = w.hbInsightsToday();
    assert.equal(I[0].id, 'sign');
    assert.match(text(w.hbInsRowHtml(I)), /you own too few contracts for pictures of your own, so these are the company’s/);
    assert.ok(!/Yours ·|>Company</.test(w.hbShelfHtml(I)), 'no scope chips when there is only one scope');
  });
  test('owning nearly everything is the company: no second, identical shelf', () => {
    const w = world({ days: lateAll, mine: 6 });
    assert.equal(w.hbInsScope().mine, false);
    assert.equal(w.hbInsightsToday()[0].id, 'sign');
  });
  test('Keep makes your own kept view, named so it stays true', () => {
    const w = world({ days: lateMine });
    w.hbAddView('sign', true);
    const p = w.hbS().panels[0];
    assert.equal(w.hbPanelWord(p), 'Your days to sign by month signed');
    assert.equal(p.key, w.hbInsKey('sign', true));
    assert.match(w.hbViewPanelHtml(p, 'all'), /hb-cols/);
  });
});

describe('F460 — a quiet day is said, not filled', () => {
  test('nothing unusual: the row says so and the usual pictures wait behind one press', () => {
    const w = world({ days: steady });
    const I = w.hbInsightsToday();
    assert.equal(I.length, 0);
    const row = w.hbInsRowHtml(I);
    assert.match(text(row), /nothing moved outside its normal range this morning/);
    assert.match(row, /data-hb-ins="usual"[^>]*>Show the usual pictures \(\d\)</);
    assert.equal(w.hbShelfHtml(I), '', 'no filler');
    w.hbPaintBoard = () => {};
    w.hbInsAct('usual');
    assert.match(w.hbShelfHtml(I), /hb-ins is-plain/);
    assert.match(w.hbInsRowHtml(I), />Hide the usual pictures</);
    w.hbInsAct('usual');
    assert.equal(w.hbShelfHtml(I), '');
  });
  test('a quiet choice is kept all day (an empty list is an answer, not a fault)', () => {
    const w = world({ days: steady });
    w.hbInsightsToday();
    const was = w.hbS().ins;
    w.hbInsightsToday();
    assert.equal(w.hbS().ins, was, 'not chosen again on every paint');
  });
  test('a place no finding filled says "nothing else stood out"', () => {
    const w = world({ days: lateMine });
    const h = text(w.hbShelfHtml(w.hbInsightsToday()));
    assert.match(h, /Nothing else stood out today\. Show the usual pictures \(\d\)/);
  });
});

describe('F460 — it spends nothing and borrows the board\'s own reading', () => {
  const HB = strip(read('js/views/homeboard.js'));
  test('no route, no model; the range is worked out from the chart\'s own columns', () => {
    for (const f of ['hbInsFinding', 'hbInsNormal', 'hbInsRenNormal', 'hbInsightsToday']) assert.ok(!/\bapi\(|intelAsk|copilotAsk/.test(region(HB, f)), f + ' spends nothing');
    assert.match(region(HB, 'hbColsSvg'), /cols: cols\.filter\(c => !c\.edge\)/, 'the chart hands its columns back');
    assert.match(region(HB, 'hbInsFinding'), /hbInsNormal\(C0\.R\)/);
  });
  test('the fixed bars are gone', () => {
    assert.ok(!/HB_INS_MIN_MOVE|HB_INS_CP_SHARE|HB_INS_CP_LEAD|HB_INS_REN_SHARE/.test(HB));
  });
  test('every new word is in both books', () => {
    const I = read('js/i18n.js');
    for (const k of ['hb_lens_mine', 'hb_ins_sub_mine', 'hb_ins_sub_few', 'hb_ins_sub_quiet', 'hb_ins_sub_young', 'hb_ins_usual_n', 'hb_ins_usual_hide', 'hb_ins_calm',
      'hb_ins_scope_mine', 'hb_ins_scope_co', 'hb_ins_rank_high', 'hb_ins_rank_low', 'hb_ins_s_norm', 'hb_ins_s_norm_mine', 'hb_ins_s_and_co', 'hb_ins_why_mine',
      'hb_ins_why_co', 'hb_ins_why_co_left', 'hb_ins_why_co_thin', 'hb_ins_why_ren_mine', 'hb_ins_why_ren_co', 'hb_ins_t_ren_above', 'hb_ins_view_sign_mine'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('F460 — renewals: the busiest quarter ahead against the year around it', () => {
  test('a bunched quarter is a finding; an even spread is not', () => {
    const R = (ys, at) => ({ unit: 'q', nowB: '2026-Q4', cols: ys.map((y, i) => ({ b: ['2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4', '2027-Q1', '2027-Q2', '2027-Q3'][i], y, n: y })) });
    const w = world({ days: steady });
    const N = w.hbInsRenNormal(R([2, 3, 2, 3, 3, 9, 2, 3]));
    assert.equal(N.out, 'above');
    assert.equal(N.last.b, '2027-Q1');
    assert.deepEqual([N.lo, N.hi], [2, 3]);
    assert.equal(w.hbInsRenNormal(R([2, 3, 2, 3, 3, 4, 2, 3])).out, '', 'four against two-to-three is not a bunch');
    assert.equal(w.hbInsRenNormal({ unit: 'q', nowB: '2026-Q4', cols: [{ b: '2026-Q4', y: 9, n: 9 }] }), null, 'no year around it: no normal');
  });
});

/* Young, 4 Oct 2026: "fix the shelf refresh fault". The board record's loader
   kept only bare shape names, so after a page refresh the day's "yours"
   findings (ids like sign.mine) were thrown away — and with the day, the
   book and the rule unchanged, nothing chose them again until tomorrow. */
describe('F460 — a refresh keeps the day\'s shelf', () => {
  /* a REAL reload: the board record is read once per sitting and per person,
     so another person signs in and back — the record is read from storage */
  const reload = w => { const me = w.currentUser; w.currentUser = () => ({ id: 'u_other_sitting', name: 'X' }); w.hbS(); w.currentUser = me; return w.hbS(); };
  test('your own findings, the scope and the open usual pictures come back after a reload', () => {
    const w = world({ days: lateMine });
    const first = w.hbInsightsToday().map(x => x.id);
    assert.deepEqual(Array.from(first), ['sign.mine']);
    w.hbS().ins.usual = w.hbToday(); w.hbSave();
    const ins = reload(w).ins;
    assert.deepEqual(Array.from(ins.list), ['sign.mine'], 'the id with .mine survives');
    assert.equal(ins.scope, 'mine');
    assert.equal(ins.usual, w.hbToday(), 'the usual pictures stay open');
    assert.equal(ins.young, false);
    assert.deepEqual(Array.from(w.hbInsightsToday().map(x => x.id)), Array.from(first), 'the shelf is the same after the refresh');
  });
  test('a young book stays young after a reload, and a word the loader does not know is dropped', () => {
    const w = world({ months: 4, days: lateAll, mine: 0 });
    w.hbInsightsToday();
    const raw = JSON.parse(w.localStorage.getItem(Object.keys(w.localStorage).find(k => /homeBoard/.test(k))));
    raw.ins.list = ['sign', 'evil.mine', 'pay.mine', '<b>'];
    raw.ins.scope = 'everyone';
    w.localStorage.setItem(Object.keys(w.localStorage).find(k => /homeBoard/.test(k)), JSON.stringify(raw));
    const ins = reload(w).ins;
    assert.deepEqual(Array.from(ins.list), ['sign', 'pay.mine']);
    assert.equal(ins.scope, 'co', 'an unknown scope falls back to the company');
    assert.equal(ins.young, true);
  });
});
