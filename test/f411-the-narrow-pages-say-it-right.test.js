/* f411 — THE NARROW OBLIGATIONS, REQUESTS AND OUR STANDARDS PAGES GET THE
   WIDE PAGES' FIXES (the owner's list, 27 Sep 2026)

   Below 1040px of page each of these draws the shape it always drew, and the
   faults the wide Inspector shapes fixed on 26 Sep were still on it. Each is
   one line in BUGLOG; each is measured here against the page's own builders.

     1  "Due this month" was the calendar month: at the month's end it covered
        a few days and something due in five days sat under "Later". It is the
        next 30 days (the wide pages' own cutoff) and the heading says so —
        while Copilot's "thisMonth" stays the calendar month its server twin
        answers.
     2  the Obligations worklist: every band sum and the foot added money we
        owe to money owed to us, "Paid" read 0 on the page's opening view,
        "Nobody owns this" sat on every obligation of theirs, and dates were
        raw 2026-09-20 strings.
     3  the contract's Obligations tab: the same "Nobody owns this", raw dates
        and a netted money line; no word of a document that ends, of a chase,
        and no Chase; a paid step's chip repeated the date beside it.
     4  Requests: a declined request "done in 24 hours"; your own request twice
        for an editor; the queue newest first; "Waiting to be picked up (N)"
        counting requests somebody holds.
     5  Our standards: "Liability cap" twice, a limit and a position of one name.

   Red at the parent (01bf6cc), measured on 27 Sep: 17 of 20 — 1a–1d, 2a–2d,
   3a–3e, 4a–4c, 5a. The three controls, named, pass on both: 2e (our own
   unowned duty still says so), 4d (the asker's own list is untouched), 5b
   (two different names stay two chips). Two claims about the calendar are red
   at the parent only on some days, and their answer on this build is the same
   every day: 1a (five days away) is red at the parent in the last five days
   of a month, and 1b is red there on every day but the first of a 31-day
   month, where no date next month is within 30 days — on those days it
   compares nothing and says so. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

const isoIn = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ISO = /\b\d{4}-\d{2}-\d{2}\b/;

function obWorld(){
  const w = buildWorld({ intelView: true, contractView: true });
  const win = w.win;
  const roster = [{ id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' }];
  const mk = (id, over) => Object.assign({ id, name: 'Agreement ' + id, counterparty: 'Nordkust', status: 'Signed',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
    value: 1000000, obligations: [] }, over);
  const c1 = mk('MK-1', { obligations: [
    { id: 'a2', desc: 'Pay the first tranche', due: isoIn(-20), status: 'done', completedAt: isoIn(-21), assignee: 'Wanjiku Kamau', party: 'ours', amount: 400000 },
    { id: 'a3', desc: 'Pay the second tranche', due: isoIn(12), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours', amount: 300000, after: 'a2' },
  ] });
  const c2 = mk('MK-2', { obligations: [
    { id: 'b1', desc: 'Deliver the audited accounts', due: isoIn(-3), status: 'open', party: 'theirs', amount: 250000, chasedAt: isoIn(-1), chasedBy: 'Wanjiku Kamau' },
    { id: 'b2', desc: 'Undated duty', due: '', status: 'open', assignee: 'Nobody At All', party: 'ours' },
    { id: 'b4', desc: 'Renew the insurance', due: isoIn(5), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours', amount: 90000 },
    { id: 'b7', desc: 'Hold a certificate of insurance', status: 'open', party: 'theirs', doc: { until: isoIn(10) } },
  ] });
  win.state = Object.assign(win.state || {}, { contracts: [c1, c2], activeId: 'MK-2', view: 'obligations' });
  win.getUsers = () => roster;
  win.currentUser = () => roster[0];
  win.getContract = id => (win.state.contracts.find(x => x.id === id) || null);
  win.canEdit = () => true;
  win.insFits = () => false;                       // the narrow shape
  return { win, c1, c2 };
}
const holder = (win, html) => { const d = win.document.createElement('div'); d.innerHTML = html; return d; };

describe('f411 (1) — "soon" is the next 30 days', () => {
  test('1a something due in five days is in the soon band, whatever day of the month it is', () => {
    const { win, c2 } = obWorld();
    assert.equal(win.obligationBand(c2.obligations.find(o => o.id === 'b4'), c2), 'month');
  });
  test('1b a date in NEXT calendar month but within 30 days is soon too — never under "Later"', () => {
    const { win, c2 } = obWorld();
    const n = new Date(); const first = new Date(n.getFullYear(), n.getMonth() + 1, 1);
    const due = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`;
    const away = win.daysUntil(due);
    if (away > 30) return;          // the 1st of a 31-day month: nothing next month is within 30 days
    assert.equal(win.obligationBand({ id: 'x', desc: 'x', due, status: 'open', party: 'ours' }, c2), 'month', due + ' is ' + away + ' days away');
  });
  test('1c and 45 days away is later; the heading names the same number as the cutoff, in both books', () => {
    const { win, c2 } = obWorld();
    assert.equal(win.obligationBand({ id: 'y', desc: 'y', due: isoIn(45), status: 'open', party: 'ours' }, c2), 'later');
    const n = /const OB_WEEK_DAYS = \d+, OB_MONTH_DAYS = (\d+);/.exec(read('js/obligations.js'));
    assert.ok(n, 'the cutoff is one constant');
    const I18N = read('js/i18n.js');
    const labels = [...I18N.matchAll(/ob_band_month: '([^']*)'/g)].map(m => m[1]);
    assert.equal(labels.length, 2, 'both books');
    labels.forEach(l => assert.ok(l.includes(n[1]), 'the heading says ' + n[1] + ' days: ' + l));
  });
  test('1d Copilot\'s "thisMonth" is still the calendar month its server twin answers', () => {
    const AI = code(read('js/ai.js'));
    assert.match(AI, /_obCalMonth\(due\)\?'thisMonth':'later'/, 'named off the calendar month');
    assert.ok(!/band==='month'\?'thisMonth'/.test(AI), 'never obligationBand\'s 30 days');
    assert.match(code(read('server/server.js')), /if \(due\.slice\(0, 7\) === m\) band = 'thisMonth'/, 'the server twin is unchanged');
  });
});

describe('f411 (2) — the narrow Obligations worklist', () => {
  const page = () => { const { win } = obWorld(); win.document.body.innerHTML = '<div id="content"></div>';
    win.renderObligationsList(); return { win, host: win.document.getElementById('content') }; };
  test('2a GATE and fault: the narrow table is drawn — and an obligation of theirs carries no "Nobody owns this"', () => {
    const { win, host } = page();
    assert.equal(host.querySelector('.obw-page') && host.querySelector('.obw-page').getAttribute('data-ins'), '0', 'the narrow shape');
    const row = host.querySelector('[data-obw-row="b1"]');
    assert.ok(row, 'their row is drawn');
    assert.ok(!row.textContent.includes(win.i18t('ob_no_owner')), row.textContent);
  });
  test('2b no date is printed as a raw 2026-09-20 string — due, done or chased', () => {
    const { host } = page();
    const when = [...host.querySelectorAll('.obw-when')].map(td => td.textContent + ' ' + ((td.querySelector('[title]') || {}).title || ''));
    assert.ok(when.length, 'dates are drawn');
    when.forEach(t => assert.ok(!ISO.test(t), 'raw: ' + t));
  });
  test('2c every band sum says each direction apart — never one netted figure', () => {
    const { win, host } = page();
    const owe = win.i18t('ob_mw_owe', { amt: '§' }).split('§')[0].trim().toLowerCase();
    const owed = win.i18t('ob_mw_owed', { amt: '§' }).split('§')[0].trim().toLowerCase();
    const sums = [...host.querySelectorAll('.obw-bandsum')].map(x => x.textContent.toLowerCase());
    assert.ok(sums.length, 'a band carries money');
    sums.forEach(t => assert.ok(t.includes(owe) || t.includes(owed), 'a direction is named: ' + t));
  });
  test('2d the foot says each direction, and never "Committed" or a "Paid 0"', () => {
    const { win, host } = page();
    const foot = host.querySelector('.obw-total');
    assert.ok(foot, 'the foot is drawn');
    const t = foot.textContent;
    assert.ok(!t.includes(win.i18t('ob_roll_committed')), t);
    assert.ok(!/\b0\b/.test(t.replace(/[\d.,]+[MK]?/g, m => (m === '0' ? '0' : 'n'))), 'no zero figure: ' + t);
    const owed = win.i18t('ob_mw_owed', { amt: '§' }).split('§')[0].trim().toLowerCase();
    assert.ok(t.toLowerCase().includes(owed), 'what they owe us is said on its own: ' + t);
  });
  test('2e CONTROL: our own duty that nobody will be reminded of still says so', () => {
    const { win, host } = page();
    const row = host.querySelector('[data-obw-row="b2"]');
    assert.ok(row && row.textContent.includes(win.i18t('ob_no_owner')));
  });
});

describe('f411 (3) — the narrow contract Obligations tab', () => {
  const tab = (id = 'MK-2') => { const { win } = obWorld(); const c = win.getContract(id);
    return { win, c, box: holder(win, win.roomObligationsHtml(c)) }; };
  test('3a no "Nobody owns this" on theirs, and no raw dates', () => {
    const { win, box } = tab();
    const row = box.querySelector('[data-obt-row="b1"]');
    assert.ok(row && !row.textContent.includes(win.i18t('ob_no_owner')), row && row.textContent);
    const ours = box.querySelector('[data-obt-row="b2"]');
    assert.ok(ours && ours.textContent.includes(win.i18t('ob_no_owner')), 'our own unowned duty still says so: ' + (ours && ours.textContent));
    [...box.querySelectorAll('.obt-due')].forEach(x => assert.ok(!ISO.test(x.textContent), 'raw: ' + x.textContent));
  });
  test('3b the money line says each direction — no "paid X of Y" over both', () => {
    const { win, box } = tab();
    const line = box.querySelector('.obt-paid');
    assert.ok(line, 'the money line is drawn');
    const paidOf = win.i18t('ob_paid_of', { paid: '§', all: '¤' }).replace(/[§¤]/g, '').trim();
    assert.ok(!line.textContent.includes(paidOf), line.textContent);
    const owed = win.i18t('ob_mw_owed', { amt: '§' }).split('§')[0].trim().toLowerCase();
    assert.ok(line.textContent.toLowerCase().includes(owed), line.textContent);
  });
  test('3c a document they must hold says when it ends; a chased one says it was chased', () => {
    const { win, box } = tab();
    const doc = box.querySelector('[data-obt-row="b7"]');
    const ends = win.obDocSay(win.getContract('MK-2').obligations.find(o => o.id === 'b7')).t;
    assert.ok(doc && doc.textContent.includes(ends), 'the document: ' + (doc && doc.textContent));
    const chased = box.querySelector('[data-obt-row="b1"]');
    assert.ok(chased && chased.textContent.includes(win.i18t('ob_chased_short', { date: '§' }).split('§')[0].trim()), chased && chased.textContent);
  });
  test('3d Chase is on an open obligation of theirs, and on nothing of ours', () => {
    const { box } = tab();
    assert.ok(box.querySelector('[data-obt-chase="b1"]'), 'theirs');
    assert.ok(!box.querySelector('[data-obt-chase="b4"]'), 'not ours');
    assert.match(code(read('js/obligations.js')), /querySelectorAll\('\[data-obt-chase\]'\)[\s\S]{0,120}obligationChase\(c\.id, b\.getAttribute\('data-obt-chase'\)\)/,
      'wired to the one act');
  });
  test('3e a paid chain step\'s chip says "Paid" — the day is in its own column, once', () => {
    const { win, box } = tab('MK-1');
    const chip = box.querySelector('.obt-chip.is-done');
    assert.ok(chip, 'the paid chip');
    assert.equal(chip.textContent.trim(), win.i18t('ob_roll_paid'));
  });
});

describe('f411 (4) — the narrow Requests page', () => {
  function ik(){
    const w = buildWorld({ intakeView: true });
    const win = w.win;
    const me = { id: 'u1', name: 'Wanjiku Kamau', role: 'legal' };
    const ago = h => new Date(Date.now() - h * 3600e3).toISOString();
    win.currentUser = () => me; win.canEdit = () => true; win.insFits = () => false;
    return { win, me, ago };
  }
  test('4a a declined or withdrawn request does not say "done in"', () => {
    const { win, ago } = ik();
    const say = st => win.intakePromise({ id: 'R', status: st, createdAt: ago(30), decidedAt: ago(6) });
    const doneWord = win.i18tn('ik_done_hour', 24, { n: 24 }).replace(/\d+/g, '').trim();
    assert.match(say('declined').text, new RegExp(win.i18t('ik_declined_after', { t: '§' }).split('§')[0].trim()));
    assert.match(say('withdrawn').text, new RegExp(win.i18t('ik_withdrawn_after', { t: '§' }).split('§')[0].trim()));
    assert.ok(!say('declined').text.includes(doneWord.split(' ')[0]), say('declined').text);
    assert.notEqual(say('declined').tone, 'green');
  });
  test('4b the queue is the colleagues\' requests, past their promise first — yours is below, once', () => {
    const IK = code(read('js/views/intake.js'));
    const r = /const queue=intakeQueue\(\)\.filter\(r=>!\(me&&r\.by&&r\.by\.id===me\.id\)\)\s*\.sort\(\(a,b\)=>\(IK_RANK\.indexOf\(intakeStage\(a\)\)-IK_RANK\.indexOf\(intakeStage\(b\)\)\)\|\|ikSort\(a,b\)\);/;
    assert.match(IK, r, 'your own left out, in the wide page\'s order');
    assert.match(IK, /const IK_RANK=IK_GROUPS\.map\(g=>g\[0\]\);/, 'the order is the wide page\'s groups');
  });
  test('4c "Waiting to be picked up" counts only what nobody holds — the rest of the list is counted beside it', () => {
    const IK = code(read('js/views/intake.js'));
    assert.match(IK, /const waiting=queue\.filter\(r=>intakeStatusKey\(r\)==='open'\)\.length, held=queue\.length-waiting;/);
    assert.match(IK, /i18t\('ik_queue_head',\{n:waiting\}\)/);
    assert.match(IK, /if\(held\) bits\.push\(i18tn\('ik_head_held',held,\{n:held\}\)\);/);
    const I18N = read('js/i18n.js');
    assert.equal((I18N.match(/ik_head_held_other:/g) || []).length, 2, 'both books');
  });
  test('4d CONTROL: "What you have asked for" still lists your own requests', () => {
    assert.match(code(read('js/views/intake.js')), /\$\{mine\.length\?mine\.map\(r=>ikRowHtml\(r\)\)\.join\(''\):empty\(i18t\('ik_mine_empty'\)\)\}/);
  });
});

describe('f411 (5) — the narrow Our standards page', () => {
  const SET = read('js/views/settings.js');
  const grab = name => { const i = SET.indexOf(name); const j = SET.indexOf('\n', SET.indexOf('\n}', i) + 1); return SET.slice(i, j); };
  const chips = () => {
    const src = grab('function pbPosChip(') + '\n' + /const pbRangeChip = [^\n]*\n/.exec(SET)[0]
      + (SET.includes('function pbBookChipsHtml(') ? grab('function pbBookChipsHtml(') : 'function pbBookChipsHtml(p,r){ return p.map(pbPosChip).join("")+r.map(pbRangeChip).join(""); }');
    return new Function('PB_ESC', src + '; return pbBookChipsHtml;')(s => String(s));
  };
  test('5a a limit and a position of one name are ONE chip', () => {
    const html = chips()([{ category: 'Liability cap', pos: 'preferred', escalate: true }, { category: 'Governing law', pos: 'required' }],
      [{ label: 'Liability cap', op: '<=', value: '12 months' }]);
    assert.equal((html.match(/Liability cap/g) || []).length, 1, html);
    assert.match(html, /Liability cap &lt;= 12 months ⚑|Liability cap <= 12 months ⚑/, 'the figure, and the flag either carried');
  });
  test('5b CONTROL: two different names stay two chips', () => {
    const html = chips()([{ category: 'Governing law', pos: 'required' }], [{ label: 'Payment terms', op: '<=', value: 45 }]);
    assert.ok(html.includes('Governing law') && html.includes('Payment terms'));
  });
});
