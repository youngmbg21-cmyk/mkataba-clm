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
    assert.equal((HB.match(/hbBigBtnHtml\(/g) || []).length, 4, 'the builder and its three callers');
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
    assert.match(t, /20 contracts are not signed yet, so they are not on this chart\./);
  });
  test('it replaces the trend line\'s arithmetic only when enlarged', () => {
    const w = world();
    const big = card(w, true).html, rest = card(w, false).html;
    assert.ok(/class="hb-read"/.test(big) && !/hb-tr-say/.test(big));
    assert.ok(!/class="hb-read"/.test(rest) && /hb-tr-say/.test(rest), 'at normal size nothing changes');
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
    assert.match(text(html), /1 sentence was left out: its count did not match HaTi’s\./);
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
    w.eval('_hbS = null;');
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
