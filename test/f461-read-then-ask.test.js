/* F461 — READ, THEN ASK, AND A BUTTON THAT SAYS "MAKE SMALLER"
 * (Young, 4 Oct 2026: "the expand button should turn into contract button
 * when the card is already expanded" · "the cards when expanded should have
 * some sort of summary explaining the charts … I have no idea what this is
 * saying" → "let's go with read then ask but the output of the ask should have
 * colors like copilot's read" → "build it and merge to main")
 *
 *   (A) the enlarge button is drawn by ONE builder in its three places; when
 *       the card is enlarged it points its arrows in and says Make smaller,
 *       to the hand and to a screen reader alike;
 *   (B) an enlarged chart opens with HaTi's reading — plain lines worked out
 *       from the chart's own numbers, every contract count a door — in place
 *       of the trend line's arithmetic; at normal size nothing changes;
 *   (C) one press asks Copilot "What could explain this?"; the answer lands in
 *       its own (amber) box, a sentence stating a count this chart does not
 *       hold is left out and the box says so, the answer is kept with its
 *       chart for the day, and a failure or a missing key is said.
 *
 * Measured as drawn: test/chromium/read-then-ask-verify.js. */
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
const text = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.)])/g, '$1').trim();

/* the owner's card, in small: 4 signed long ago, then nothing, then 11 and 14
   in the last two closed months; 20 not signed yet */
function world(){
  const w = buildWorld({ intelView: true }).win;
  const cs = []; let i = 0;
  const add = (signed, cp) => cs.push({ id: 'C' + (i++), name: 'C ' + i, counterparty: cp || 'Juno AB', status: signed ? 'Signed' : 'Under Review', value: 1000, expiry: mon(20),
    signedAt: signed || null, _raisedAt: mon(-40), folder: 'proc', audit: [], metadata: {} });
  for (let k = 0; k < 4; k++) add(mon(-30 - k));
  for (let k = 0; k < 11; k++) add(mon(-3, 3 + k));
  for (let k = 0; k < 14; k++) add(mon(-2, 3 + k), k % 2 ? 'Nordkraft AB' : 'Juno AB');
  for (let k = 0; k < 20; k++) add(null, 'Baltic Oy');
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u1', name: 'Me', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.why = {}; s.recipe = {}; s.digBig = false;
  return w;
}
/* the whole book, by month signed, counted — the owner's own picture */
const KEY = 'q:contracts by month signed';
function card(w, big){
  const s = w.hbS(); s.recipe[KEY] = { which: 'all', pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'count', trend: true };
  const D = w.hbDigData(KEY, 'all'), cs = w.hbListOf(D.ids, 'all');
  return { D, cs, html: w.hbChartHtml(D, cs, big) };
}

describe('F461 (A) — Make bigger, Make smaller', () => {
  test('one builder: arrows out and "Make bigger" at rest, arrows in and "Make smaller" when enlarged', () => {
    const w = world();
    const rest = w.hbBigBtnHtml(false, 'data-hb-digbig'), big = w.hbBigBtnHtml(true, 'data-hb-digbig');
    assert.match(rest, /title="Make bigger" aria-label="Make bigger"/);
    assert.match(big, /title="Make smaller" aria-label="Make smaller"/);
    assert.match(rest, /M2 6V2h4/); assert.match(big, /M6 2v4H2/);
    assert.match(big, /aria-pressed="true"/);
  });
  test('all three places draw it through the builder; the bare icon lives only there', () => {
    const HB = strip(read('js/views/homeboard.js'));
    /* the fourth caller is a story's chapter (f536, 6 Oct 2026) */
    assert.equal((HB.match(/hbBigBtnHtml\(/g) || []).length, 5, 'the builder and its four callers');
    assert.equal((HB.match(/\$\{_hbBigIc\}/g) || []).length, 0, 'nobody draws the icon by hand');
    assert.ok(!/aria-label="\$\{_hbE\(i18t\('hb_p_big'\)\)\}"/.test(HB), 'no label stuck on "Make bigger"');
  });
});

describe('F461 (B) — HaTi\'s reading on an enlarged chart', () => {
  test('the owner\'s picture, said in plain words from its own columns', () => {
    const w = world();
    const t = text(card(w, true).html);
    assert.match(t, /What this shows/);
    assert.match(t, /29 of the 49 contracts here have been signed\./);
    assert.match(t, /Most of them are in .+ and .+: 11 and 14, 25 in all\./);
    assert.match(t, /Nothing at all for \d+ months, from .+ to .+\./);
    assert.match(t, /4 are from before .+\./);
    assert.match(t, /20 contracts are not signed yet \(KES 20K\), so they are not on this chart\./, 'what is left off is said with its money');
  });
  test('it replaces the trend line\'s arithmetic only when enlarged', () => {
    const w = world();
    const big = card(w, true).html, rest = card(w, false).html;
    assert.ok(/class="hb-read"/.test(big) && !/hb-tr-say/.test(big));
    assert.ok(!/class="hb-read"/.test(rest), 'at normal size no reading');
    /* one burst after many empty months is not a trend (4 Oct 2026): said, never drawn */
    assert.ok(!/hb-tr-say/.test(rest) && !/class="hb-sv-trend"/.test(rest), 'no line through two busy months');
    assert.match(text(rest), /Not enough history yet for a trend\. It needs 6 months that hold contracts; there are 2\./);
  });
  test('every count of contracts is a door onto those contracts', () => {
    const w = world();
    const { html } = card(w, true);
    const read = html.slice(html.indexOf('class="hb-read"'), html.indexOf('</ul>'));
    const doors = read.match(/class="hb-read-n" data-hb-dig="([^"]+)"[^>]*>([^<]+)</g) || [];
    assert.ok(doors.length >= 3, doors.length + ' doors');
    const eleven = /data-hb-dig="(qm:[^"]+)"[^>]*>11</.exec(read);
    assert.ok(eleven, 'the 11 opens its month');
    assert.equal(w.hbDigData(eleven[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'), 'all').n, 11, 'and the month holds 11');
  });
  test('a grouping is read too: who has the most, as a door', () => {
    const w = world();
    const K = 'q:contracts by counterparty'; const D = w.hbDigData(K, 'all');
    const t = text(w.hbChartHtml(D, w.hbListOf(D.ids, 'all'), true));
    assert.match(t, /Juno AB has the most: 22 contracts \(45%\)\./);
  });
  test('it spends nothing and borrows the chart\'s own reading', () => {
    const HB = strip(read('js/views/homeboard.js'));
    assert.ok(!/\bapi\(|copilotAsk|intelAsk/.test(region(HB, 'hbReadingOf')));
    assert.match(region(HB, 'hbColsSvg'), /edges: cols\.filter\(c => c\.edge\)/);
  });
});

describe('F461 (C) — then ask: Copilot\'s answer in its own box', () => {
  test('one press: the prompt carries the columns and the contracts; the answer is kept for the day', async () => {
    const w = world();
    const { D, cs } = card(w, true);
    let sent = null;
    w.copilotAvailable = () => true;
    w.copilotAsk = async (msgs) => { sent = msgs[0].content; return { answer: 'Signing jumped late: 25 contracts landed in two months. 22 contracts were imported. Worth checking the 20 still open.' }; };
    await w.hbWhyAsk(KEY);
    assert.match(sent, /Columns \(label: value, contracts\):/);
    assert.match(sent, /C0, C1, C2/);
    const html = w.hbChartHtml(D, cs, true);
    assert.match(html, /class="hb-why"/);
    assert.match(text(html), /Copilot’s read/);
    assert.match(text(html), /25 contracts landed in two months/);
    assert.ok(!/22 contracts were imported/.test(text(html)), 'a count this chart does not hold is left out');
    assert.match(text(html), /1 sentence was left out: its number was not on HaTi’s fact sheet\./);
    assert.ok(!/data-hb-why="/.test(html), 'kept: no second press offered');
    assert.match(html, /data-hb-why-follow=/);
  });
  test('a different count is a different chart', async () => {
    const w = world();
    card(w, true);
    w.copilotAvailable = () => true;
    w.copilotAsk = async () => ({ answer: 'A late burst.' });
    await w.hbWhyAsk(KEY);
    w.state.contracts.push({ id: 'X1', name: 'X', counterparty: 'Juno AB', status: 'Signed', signedAt: mon(-2, 20), value: 1, folder: 'proc', audit: [], metadata: {} });
    const { html } = card(w, true);
    assert.ok(/data-hb-why="/.test(html) && !/class="hb-why"/.test(html), 'asked again for the new count');
  });
  test('a failure and a missing key are said where the reader looks', async () => {
    const w = world();
    card(w, true);
    w.copilotAvailable = () => false;
    let html = card(w, true).html;
    assert.match(html, /data-hb-why="[^"]*" disabled title="Asking Copilot needs a Copilot key/);
    w.copilotAvailable = () => true;
    w.copilotAsk = async () => { throw new Error('Daily Copilot budget reached'); };
    await w.hbWhyAsk(KEY);
    html = card(w, true).html;
    assert.match(html, /class="hb-why is-err"/);
    assert.match(text(html), /Copilot could not answer: Daily Copilot budget reached/);
    assert.match(text(html), /Try again/);
  });
  test('the kept answer survives a reload of the board record', async () => {
    const w = world();
    card(w, true);
    w.copilotAvailable = () => true;
    w.copilotAsk = async () => ({ answer: 'A late burst.' });
    await w.hbWhyAsk(KEY);
    /* a REAL reload: another person's sitting, then back — read from storage */
    const me = w.currentUser; w.currentUser = () => ({ id: 'u_other_sitting', name: 'X' }); w.hbS(); w.currentUser = me;
    assert.equal(w.hbS().why[KEY].text, 'A late burst.');
  });
  test('the check reads "N contracts" the way the map\'s own rule does', () => {
    const w = world();
    const c = w.hbWhyCheck('Most of it is 25 contracts. Then 7 signed contracts appeared. The rest waits.', new Set([25]));
    assert.equal(c.dropped, 1);
    assert.equal(c.text, 'Most of it is 25 contracts. The rest waits.');
  });
  test('every new word is in both books', () => {
    const I = read('js/i18n.js');
    for (const k of ['hb_read_title', 'hb_read_src', 'hb_read_open', 'hb_read_signed_other', 'hb_read_most_two', 'hb_read_quiet', 'hb_read_before_other', 'hb_read_unsigned_other',
      'hb_read_top_other', 'hb_cx_btn', 'hb_cx_cost_other', 'hb_cx_nokey', 'hb_cx_title', 'hb_cx_ok', 'hb_cx_dropped_one', 'hb_cx_failed', 'hb_cx_follow', 'hb_cx_lang'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});

/* (D) EVERY ENLARGED CARD READS (Young, 4 Oct 2026: "please review again as i
   do not see the options in the dashboard" → "build all three and merge to
   main"): the timeline (Ending in 90 days, Past end date), Value under
   contract, and the six ready-made panels open with HaTi's reading and the
   one ask, through the same builder. */
const day = off => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + off); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
function bookWorld(){
  const w = buildWorld({ intelView: true }).win;
  const cs = []; let i = 0;
  const add = (o) => cs.push(Object.assign({ id: 'K' + (i++), name: 'K ' + i, counterparty: 'Juno AB', status: 'Signed', value: 1000, folder: 'proc', audit: [], metadata: {}, _raisedAt: mon(-20) }, o));
  /* ending soon: three in the month after next, one in ten days, one in eighty */
  [10, 80].forEach(d => add({ expiry: day(d) }));
  for (let k = 0; k < 3; k++) add({ expiry: mon(2, 5 + k), counterparty: 'Nordkraft AB' });
  /* past their end, two still Executed */
  add({ expiry: day(-40) }); add({ expiry: day(-200) });
  /* later, and in review */
  for (let k = 0; k < 4; k++) add({ expiry: mon(14), status: 'Under Review', value: 9000 });
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null;
  w.contractExpired = c => !!c.expiry && c.expiry < day(0);
  w.renewalWindow = c => (c.expiry ? { expiry: c.expiry, expiresDays: Math.round((new Date(c.expiry + 'T00:00:00') - new Date(day(0) + 'T00:00:00')) / 864e5), decided: c.id === 'K0', inWindow: true, missed: c.id === 'K1' } : null);
  w.currentUser = () => ({ id: 'u1', name: 'Me', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.why = {}; s.recipe = {}; s.digBig = false; s.panels = []; s.path = [];
  return w;
}
const dig = (w, key, big) => { const s = w.hbS(); s.path = [key]; s.digBig = !!big; return w.hbFocusHtml(); };

describe('F461 (D) — every enlarged card reads', () => {
  test('Ending in 90 days, enlarged: when things end, the first one named, the busiest month a door', () => {
    const w = bookWorld();
    const big = dig(w, 'f:ending', true), t = text(big);
    assert.match(big, /class="hb-read"/);
    assert.match(t, /5 end in the next 90 days; the first is K0 \(Juno AB\), on /);
    /* the busiest month holds the three (a fourth may join it, by the day the test runs) */
    const bm = /The busiest month is .+ \d{4}: (\d) end then\./.exec(t);
    assert.ok(bm && Number(bm[1]) >= 3, 'the busiest month is said');
    assert.match(t, /4 of those ending soon have no renewal decision yet\./, 'K0 is decided');
    const m = new RegExp('data-hb-dig="(qm:[^"]+)"[^>]*>' + bm[1] + '<').exec(big);
    assert.ok(m, 'its count is a door'); assert.equal(w.hbDigData(m[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'), 'all').n, Number(bm[1]));
    assert.match(big, /data-hb-why="f:ending"/);
    assert.ok(!/class="hb-read"/.test(dig(w, 'f:ending', false)), 'at normal size nothing changes');
  });
  test('Past end date, enlarged: how many, since when, and how many still stand as Executed', () => {
    const w = bookWorld();
    const t = text(dig(w, 'f:past', true));
    assert.match(t, /2 have already passed their end date; the earliest ended in [A-Z][a-z]+ \d{4}\./);
    assert.match(t, /2 are past their end date but still marked /);
  });
  test('Value under contract can be made bigger, and then reads where the money sits, by stage', () => {
    const w = bookWorld();
    const rest = dig(w, 'f:value', false);
    assert.match(rest, /data-hb-digbig/, 'the enlarge button is there');
    assert.ok(!/class="hb-read"/.test(rest));
    const big = dig(w, 'f:value', true), t = text(big);
    assert.match(big, /hb-dig is-big|hb-dig[^"]* is-big/);
    assert.match(t, /Most of the value, .+ \(84%\), sits in .+, across 4 contracts\./);
    assert.match(t, /: .+ \(16%\), across 7 contracts\./);
    assert.match(big, /class="hb-read-n" data-hb-dig="st:Under Review"[^>]*>4</);
    assert.match(big, /data-hb-why="f:value"/);
  });
  test('the six ready-made panels: enlarged, each opens with a reading and the one ask; at normal size nothing changes', () => {
    const w = bookWorld();
    for (const kind of ['obl', 'fric', 'ren', 'pay', 'exp', 'val']){
      const big = w.hbPanelHtml({ id: 'p_' + kind, kind, big: true }, 'all'), rest = w.hbPanelHtml({ id: 'p_' + kind, kind, big: false }, 'all');
      assert.match(big, /class="hb-read"/, kind + ' reads when enlarged');
      assert.match(big, new RegExp('data-hb-why="hp:' + kind + '"'), kind + ' offers the ask');
      assert.ok(!/class="hb-read"/.test(rest), kind + ' at normal size');
    }
    assert.match(text(w.hbPanelHtml({ id: 'p', kind: 'ren', big: true }, 'all')), /The first to end is K0 \(Juno AB\), in \d+ days; its renewal is decided\./);
    assert.match(text(w.hbPanelHtml({ id: 'p', kind: 'ren', big: true }, 'all')), /1 has passed the date to decide on renewal and is still undecided\./);
  });
  test('each panel\'s reading says what its own lines do not, every count a door the panel already has', () => {
    const w = bookWorld();
    const T = (kind, d) => { const r = w.hbReadPanelOf(kind, d); return r ? r.lines.map(l => text(l).replace(/\( /g, '(')).join(' | ') : ''; };
    const H = (kind, d) => { const r = w.hbReadPanelOf(kind, d); return r ? r.lines.join(' ') : ''; };
    const obl = { rows: [{ cid: 'K0', what: 'Insurance certificate', who: 'Amina', late: 30 }, { cid: 'K0', what: 'Report', who: 'Amina', late: 3 }, { cid: 'K2', what: 'Audit', who: '', late: 9 }], n: 3, open: 5, soon: 1 };
    assert.equal(T('obl', obl), 'The longest overdue is “Insurance certificate” on K0 (Juno AB): 30 days late. | They sit on 2 contracts. | Amina holds the most of them: 2. | 1 has nobody assigned.');
    const fric = { live: 4, us: 3, them: 1, liveIds: ['K0', 'K1'], clauses: [{ label: 'Liability', n: 3, ids: ['K0'] }], cps: [{ name: 'Juno AB', rounds: 2.5, n: 2 }, { name: 'Nordkraft AB', rounds: 4.25, n: 1 }] };
    assert.equal(T('fric', fric), '“Liability” is argued over most: open in 3 negotiations. | Nordkraft AB takes the most rounds: 4.3 on average, in 1 negotiation. | 75% of the live ones are waiting on us.');
    assert.match(H('fric', fric), /data-hb-dig="cl:Liability"/);
    const pay = { sides: [{ key: 'supplier', n: 5, avg: 50, std: 45, over: 2, overIds: [], buckets: [{ i: 0, label: '0–30', ids: ['K0'] }, { i: 2, label: '46–60', ids: ['K1', 'K2', 'K3'] }] }], noSide: 0 };
    assert.equal(T('pay', pay), 'We pay suppliers: the largest group is 46–60 days (3 contracts). | We pay suppliers: 2 of 5 are over our standard (40%).');
    assert.match(H('pay', pay), /data-hb-dig="po:supplier"/);
    const exp = { rows: [{ k: 'uncapped', title: 'Uncapped liability', n: 3, ids: ['K0', 'K1', 'K2'] }, { k: 'auto', title: 'Auto-renewal', n: 1, ids: ['K0'] }, { k: 'law', title: 'Foreign law', n: 0, ids: [] }] };
    assert.equal(T('exp', exp), '“Uncapped liability” is found most: in 3 contracts. | 2 kinds of risk are found, across 3 contracts. | 1 kind is not found anywhere.');
    assert.equal(T('obl', { rows: [], n: 0 }), 'Nothing is overdue.');
  });
  test('asking from a panel: the prompt carries the panel\'s own numbers, the answer lands in the amber box for that panel', async () => {
    const w = bookWorld();
    let sent = null;
    w.copilotAvailable = () => true;
    w.copilotAsk = async (msgs) => { sent = msgs[0].content; return { answer: 'Executed holds the money. 9 contracts were renewed last week.' }; };
    await w.hbWhyAsk('hp:val');
    assert.match(sent, /A panel on the HaTi Home board: "Value by stage"\./);
    assert.match(sent, /Its numbers:/);
    /* RE-POINTED 5 Oct 2026 (Charts That Explain, Part 2): the prompt is HaTi's fact sheet */
    assert.match(sent, /^FACT SHEET — /);
    assert.match(sent, /Contracts behind it \(11\)/);
    const html = w.hbPanelHtml({ id: 'p', kind: 'val', big: true }, 'all');
    assert.match(html, /class="hb-why"/);
    assert.match(text(html), /Executed holds the money\./);
    assert.ok(!/9 contracts were renewed/.test(text(html)), 'a count the panel does not hold is left out');
    assert.equal(w.hbS().why['hp:val'].dropped, 1);
  });
  test('one builder draws the reading and the ask for every card', () => {
    const HB = strip(read('js/views/homeboard.js'));
    /* RE-POINTED 5 Oct 2026 (Charts That Explain, rec 6): every card's ask is
       drawn in one place; the board's own "Summarise my board" is the second */
    assert.equal((HB.match(/data-hb-why="\$\{/g) || []).length, 2, 'the card ask and the board summary');
    assert.match(region(HB, 'hbBoardSumHtml'), /data-hb-why="\$\{_hbE\(key\)\}"/);
    assert.match(region(HB, 'hbReadBlockHtml'), /class="hb-read"/);
    assert.match(region(HB, 'hbPanelHtml'), /hbReadSrcHtml\('hp:' \+ p\.kind\)/);
    for (const k of ['hb_read_tl_soon_other', 'hb_read_val_top_other', 'hb_read_obl_worst_other', 'hb_read_fric_clause_other', 'hb_read_ren_missed_other', 'hb_read_pay_over_other', 'hb_read_exp_top_other'])
      assert.equal((read('js/i18n.js').match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});
