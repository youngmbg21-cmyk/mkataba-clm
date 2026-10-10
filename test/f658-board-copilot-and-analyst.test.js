/* f658 — THE BOARD UPGRADE: COPILOT WORKING WITH YOU (C1–C8) AND THE ANALYST
   (A1–A10) (the owner's "Build all C and A ideas, then merge to main",
   10 Oct 2026, over the Board Upgrade Proposals page)
   C1 the recipe reads as one sentence; a press recounts for free
   C2 "Ask about this" carries the piece's contracts to the next question
   C3 follow-ups said many ways change the open chart; the trail and Back one step
   C4 Explain this chart answers in three labelled points
   C5 unusual columns are found by HaTi's own arithmetic, and say why
   C6/A9 how this was counted, and what it stands on, with a door to the gaps
   C7 suggestions read off the open chart
   C8 the explain box says its steps, and why it stopped
   A1 "/" moves · A2 groupings after "by" · A3 growth in % · A4 my questions ·
   A5 what if these do not renew · A6 forecast with a range · A7 the gallery ·
   A8 the monthly pack · A10 the keys
   Run: node --test test/f658-board-copilot-and-analyst.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SRC = read('js/views/homeboard.js');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
const INDEX = read('index.html');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function book(){
  const cs = [];
  const add = (id, cp, status, value, folder, o) => cs.push(Object.assign({ id, name: 'Agreement ' + id, counterparty: cp, status, value, folder, expiry: mon(10), audit: [], metadata: {} }, o || {}));
  const cps = ['Juno AB', 'Juno AB', 'Naivas', 'Juno AB', 'Bidco', 'Naivas', 'Sendy', 'Kevian', 'Tuskys', 'Coast Motors', 'Siginon', 'Juno AB'];
  for (let k = 0; k < 24; k++){
    const off = -1 - (k % 20);
    add('MK-' + (100 + k), cps[k % cps.length], 'Signed', 1e6 * (1 + (k % 5)), k % 3 ? 'proc' : 'sales',
      { signedAt: mon(off, 10) + 'T10:00:00.000Z', _raisedAt: mon(off - 1, 5) + 'T10:00:00.000Z', expiry: mon(1 + (k % 11)), metadata: k % 4 === 0 ? { renewalType: 'auto-renew' } : {} });
  }
  /* a spike: eight signed in one month two months back */
  for (let k = 0; k < 8; k++) add('MK-S' + k, 'Juno AB', 'Signed', 2e6, 'proc', { signedAt: mon(-6, 3 + k) + 'T10:00:00.000Z', _raisedAt: mon(-7, 3) + 'T10:00:00.000Z' });
  add('MK-200', 'Juno AB', 'Draft', 5e6, 'sales', { _raisedAt: mon(-2, 5) + 'T10:00:00.000Z' });
  add('MK-201', 'Bidco', 'Under Review', 7e6, 'proc', { _raisedAt: mon(-3, 5) + 'T10:00:00.000Z' });
  add('MK-203', 'Sendy', 'Signed', 0, 'sales');                                 /* no value, no signing date */
  return cs;
}
function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  /* the module's own state (the piece asked about, the trail, the gallery)
     is reached the way the page reaches it: as names on the one script */
  w.eval(read('js/views/homeboard.js').replace(/^(?:let|const) (_hbAskAbout|_hbFuSteps|HB_GALLERY|HB_ASK_ABOUT_MS)\b/gm, 'var $1'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  return w;
}
function card(w, recipe, q = 'contracts by stream'){
  const key = 'q:' + q;
  w.hbS().recipe = {}; w.hbCardSet(key, recipe);
  const D = w.hbDigData(key, 'all'); assert.ok(D, 'a card for ' + q);
  return { key, D, P: w.hbPlan(D), cs: w.hbListOf(D.ids, 'all') };
}
function region(name){
  const at = CODE.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = CODE.indexOf('{', CODE.indexOf(')', at));
  let d = 0;
  for (let i = open; i < CODE.length; i++){ if (CODE[i] === '{') d++; else if (CODE[i] === '}' && !--d) return CODE.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}

describe('f658 Copilot working with you', () => {
  test('C1 the recipe reads as one sentence, and a press says it costs nothing', () => {
    const w = world();
    const { D, P } = card(w, { split: { by: 'folder' }, pic: 'bars' });
    const row = w.hbRecipeRowHtml(D, P);
    assert.match(row, /class="hb-recipe is-sentence"/);
    assert.match(row, /hb-rjoin[^>]*>as</); assert.match(row, /hb-rjoin[^>]*>counting</);
    assert.match(row, /<i>Split<\/i>/, 'the part names stay for a screen reader');
    assert.match(INDEX, /\.hb-recipe\.is-sentence \.hb-rc i\{position:absolute;width:1px/);
    assert.match(region('hbRecipeRowHtml'), /hb-rmenu-foot[\s\S]*hb_rc_free/);
  });
  test('C2 "Ask about this" carries the piece and its contracts to the next question, for ten minutes', () => {
    const w = world();
    assert.equal(w.hbAskAboutLine(), '');
    w.eval("_hbAskAbout = { label: 'Mar 2026', say: '3 contracts', ids: ['MK-100','MK-101','MK-102'], one: null, at: Date.now() }");
    const line = w.hbAskAboutLine();
    assert.match(line, /Ask about this/); assert.match(line, /MK-100/); assert.match(line, /name the ones you mean by their reference/);
    w.eval('_hbAskAbout.at = Date.now() - HB_ASK_ABOUT_MS - 1');
    assert.equal(w.hbAskAboutLine(), '', 'a stale piece is not sent');
    assert.match(region('hbBoardNow'), /hbAskAboutLine\(\)/);
    assert.match(region('hbTipAsk'), /_hbAskAbout = \{/);
  });
  test('C3 follow-ups said many ways reach the open chart; the trail keeps them and Back one step undoes', () => {
    const w = world();
    for (const q of ['compare with last year', 'split by stream', 'break it down by stage', 'group by owner']) assert.ok(w.HB_FU.lead.test(' ' + q), q);
    const { key } = card(w, { split: { by: 'folder' }, pic: 'bars' });
    w.hbS().path = [key];
    w.eval(`_hbFuSteps.set(${JSON.stringify(key)}, ['by stage', 'only Juno AB'])`);
    const h = w.hbFuStepsHtml(key);
    assert.match(h, /hb-trail-step is-last[^>]*>only Juno AB/); assert.match(h, /data-hb-fu-back=/);
    assert.match(region('hbOnClick'), /\[data-hb-fu-back\][\s\S]*hbUndo\(\)/);
    assert.match(region('hbFollowUp'), /_hbFuSteps\.set\(r\.key/);
  });
  test('C4 the explanation is three labelled points, or the answer as written', () => {
    const w = world();
    const html = w.hbWhy3Html('What stands out: August doubled.\nWhy: Juno AB signed 9 together.\nWhat you might do: spread the renewals.');
    assert.match(html, /<ol class="hb-why3">/); assert.equal((html.match(/<li>/g) || []).length, 3);
    assert.equal(w.hbWhy3Html('A free paragraph with no labels.'), null);
    assert.match(w.hbWhy3Ask(), /What stands out:[\s\S]*Why:[\s\S]*What you might do:/);
  });
  test('C5 unusual columns are found by HaTi, and say why', () => {
    const w = world();
    const cols = [3, 4, 3, 4, 14, 3, 4, 3].map((y, i) => ({ b: '2026-0' + (i + 1), M: { y }, list: y > 10 ? Array.from({ length: y }, (_, k) => ({ counterparty: k < 9 ? 'Juno AB' : 'X' })) : [] }));
    const odd = w.hbOddCols(cols, 'm');
    assert.equal(odd.size, 1); assert.ok(odd.has(4));
    assert.match(odd.get(4), /4\.?\d*× the usual month/); assert.match(odd.get(4), /9 of the 14 with Juno AB/);
    assert.equal(w.hbOddCols([3, 4, 3, 4, 4, 3].map(y => ({ M: { y }, list: [] })), 'm').size, 0, 'a flat run has nothing unusual');
    assert.doesNotMatch(region('hbOddCols'), /copilot|api\(/i, 'no model is asked');
  });
  test('C6 + A9 how this was counted, and a door onto what it could not use', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'folder' }, pic: 'bars', measure: 'value' });
    const h = w.hbHowHtml(D, P, {}, cs);
    assert.match(h, /How this was counted:/); assert.match(h, /across \d+ contracts/);
    assert.match(h, /Based on (\d+) of (\d+) contracts\. 1 has no value/);
    const key = /data-hb-dig="([^"]+)"/.exec(h)[1].replace(/&amp;/g, '&');
    assert.equal(w.hbDigData(key, 'all').n, 1, 'the door opens exactly the one with no value');
    const c2 = card(w, { split: { by: 'folder' }, pic: 'bars' });
    assert.doesNotMatch(w.hbHowHtml(c2.D, c2.P, {}, c2.cs), /Based on/, 'a count leaves nothing out');
  });
  test('C7 suggestions are read off the open chart', () => {
    const w = world();
    const { key } = card(w, { split: { by: 'counterparty' }, pic: 'bars' });
    const sug = w.hbDataSuggestions(key);
    assert.ok(sug.some(x => /^Juno AB is \d+% of this — show only Juno AB$/.test(x)), sug.join(' | '));
    assert.ok(sug.some(x => /end in the next 90 days/.test(x)), sug.join(' | '));
    const d = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, pic: 'cols' }, 'contracts by month signed');
    assert.ok(w.hbDataSuggestions(d.key).includes('Compare this with last year'));
  });
  test('C8 the box says its steps, and why it stopped, with HaTi\'s reading standing', () => {
    const b = region('hbReadBlockHtml');
    assert.match(b, /hb_st_read[\s\S]*hb_st_count[\s\S]*hb_st_ask[\s\S]*hb_st_check/);
    assert.match(b, /steps\(err\)[\s\S]*hb_st_stood/);
  });
});

describe('f658 the analyst', () => {
  test('A1 "/" lists the moves; each starter question is one the board reads', () => {
    const w = world();
    const P = w.hbAskPopRows('/');
    assert.equal(P.mode, 'slash'); assert.ok(P.rows.length >= 8);
    assert.deepEqual(Array.from(w.hbAskPopRows('/tr').rows.map(r => r.k)), ['trend']);
    for (const k of ['compare', 'trend', 'top', 'growth', 'forecast']){
      const q = w.i18t('hb_sl_' + k + '_q'); const R = w.hbRecipeRead(q);
      assert.ok(R, k + ': "' + q + '" is read by the board');
    }
    assert.equal(w.hbRecipeRead(w.i18t('hb_sl_growth_q')).show, 'growth');
    assert.equal(w.hbRecipeRead(w.i18t('hb_sl_forecast_q')).pic, 'forecast');
  });
  test('A2 after "by" the groupings this book has; Tab takes one, Enter still asks', () => {
    const w = world();
    const P = w.hbAskPopRows('signed value by ');
    assert.equal(P.mode, 'by'); assert.ok(P.rows.some(r => r.word === 'value stream') && P.rows.some(r => r.word === 'counterparty'));
    assert.ok(w.hbAskPopRows('signed value by coun').rows.every(r => /coun/.test(r.word)));
    assert.equal(w.hbAskPopRows('contracts in ').mode, 'in');
    assert.match(region('hbAskPopRows'), /hbGroupingsHere\(\)/);
    assert.match(CODE, /const takesEnter = _hbPop\.mode === 'slash' \|\| _hbPop\.mode === 'gallery' \|\| _hbPop\.moved;/);
    for (const k of ['status', 'folder', 'counterparty', 'kind', 'payterms']){
      const R = w.hbRecipeRead('contracts by ' + w.i18t('hb_gw_' + k)); assert.ok(R && R.split && R.split.by === k, k);
    }
  });
  test('A3 growth in %: read from the words, said on each column', () => {
    const w = world();
    assert.equal(w.hbRecipeRead('signed value by month as growth in %').show, 'growth');
    const { D, P, cs } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, pic: 'cols', show: 'growth' }, 'signed by month');
    assert.equal(P.show, 'growth');
    const { R } = w.hbChartRun(D, cs, P);
    assert.match(R.body, />[+−]?\d+%<|>—</);
    const SRV = read('server/server.js');
    assert.match(SRV, /const GRAPH_CHART_SHOWS = \['running', 'share', 'growth'\];/);
  });
  test('A4 my questions: saved with a name, kept with the board, run again', async () => {
    const w = world();
    const { key } = card(w, { split: { by: 'folder' }, pic: 'bars' });
    w.promptDialog = async () => 'By stream';
    w.toast = () => {};
    w.hbMyqSave(key); await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(JSON.parse(JSON.stringify(w.hbS().myq)), [{ name: 'By stream', key }]);
    w._hbS = null; w.eval('_hbS = null');
    assert.equal(w.hbS().myq.length, 1, 'kept with the board');
    const G = w.hbAskPopRows('');
    assert.equal(G.mode, 'gallery'); assert.equal(G.rows[0].kind, 'myq'); assert.equal(G.rows[0].word, 'By stream');
    w.hbS().path = []; w.hbMyqRun(0);
    assert.deepEqual(Array.from(w.hbS().path), [key], 'run again: the view opens, read with today\'s dates');
  });
  test('A5 what if these do not renew: a scenario, dashed, said so, never stored', () => {
    const w = world();
    const { key, D, P, cs } = card(w, { split: { by: 'folder' }, pic: 'bars' }, 'contracts ending in the next 6 months');
    w.toast = () => {};
    w.hbWhatIfToggle(key);
    const { R } = w.hbChartRun(D, cs, P);
    assert.match(R.body, /class="hb-svg hb-wi"/); assert.match(R.body, /SCENARIO/); assert.match(R.body, /hb-sv-wi-scen/);
    assert.match(R.dataLines[0], /^SCENARIO, not on record/);
    assert.doesNotMatch(JSON.stringify(w.hbS()), /whatif|_hbWhatIf/i, 'nothing is stored');
    w.hbWhatIfToggle(key);
    assert.doesNotMatch(w.hbChartRun(D, cs, P).R.body, /hb-wi/);
  });
  test('A6 the forecast: a range, never one guessed number', () => {
    const w = world();
    const { D, P, cs } = card(w, { pic: 'forecast', measure: 'value' }, 'renewal forecast');
    assert.equal(P.pic, 'forecast'); assert.equal(P.split, null); assert.equal(P.window, null);
    const X = w.hbExtraSets('fc', P, cs);
    assert.equal(X.parts.length, 12);
    X.parts.forEach(p => assert.ok(p.lo <= p.hi, p.word));
    assert.equal(X.rate, null, 'too few decisions: no likely line');
    const { R } = w.hbChartRun(D, cs, P);
    assert.match(R.note, /No likely line/);
    w.state.contracts.slice(0, 6).forEach((c, i) => { c.renewalDecision = { answer: i < 3 ? 'renew' : 'lapse' }; });
    const X2 = w.hbExtraSets('fc', P, w.hbListOf(w.hbDigData('q:renewal forecast', 'all').ids, 'all'));
    assert.equal(X2.rate, 0.5); X2.parts.forEach(p => assert.ok(p.li >= p.lo && p.li <= p.hi));
    assert.match(read('server/server.js'), /'spread', 'forecast'\]/);
  });
  test('A7 the gallery: every view is a valid recipe, drawn as a card by the board\'s own applier', () => {
    const w = world();
    w.toast = () => {};
    for (const g of w.HB_GALLERY){ const clean = w.hbCardClean(g.recipe); assert.equal(clean.pic, g.recipe.pic, g.k); }
    const n0 = w.hbS().panels.length;
    w.hbGalleryRun('conc');
    assert.equal(w.hbS().panels.length, n0 + 1);
    assert.doesNotMatch(region('hbGalleryRun'), /copilot|intelAsk|api\(/i, 'no model is asked');
  });
  test('A8 the pack: offered when the board keeps a chart, a standalone page of pictures', () => {
    assert.match(CODE, /s\.panels\.some\(p => p\.kind === 'view'\) \? `<button type="button" class="hb-btn is-sm" data-hb-pack-dl>/);
    const p = region('hbPackMake');
    assert.match(p, /hbChartPngOf\(chart/); assert.match(p, /_hbSaveFile\(new Blob\(\[html\]/); assert.match(p, /hb_pack_none/);
    assert.doesNotMatch(p, /var\(--/, 'a standalone page carries no tokens');
  });
  test('A10 the keys: ↑ brings back the last question, "/" opens the moves, Ctrl/⌘+Enter asks', () => {
    assert.match(CODE, /e\.key === 'ArrowUp' && _hbAskHist\.length/);
    assert.match(region('hbSlashKey'), /e\.key !== '\/'/);
    assert.match(region('hbOnKey'), /if \(hbSlashKey\(e\)\) return;/);
    assert.match(CODE, /e\.key === 'Enter' && takesEnter && !e\.ctrlKey && !e\.metaKey/, 'Ctrl/⌘+Enter always asks');
  });
});

describe('f658 every new word is in both books', () => {
  test('English and Swedish', () => {
    const I = read('js/i18n.js');
    const keys = [...new Set([...SRC.matchAll(/i18tn?\('(hb_(?:rc_as|rc_counting|rc_free|fu_|cx3_|odd_|how_|sug_only|sug_soon|sug_cmp|st_|pop_|sl_|gw_|in_|myq_|gal_|wi_|fc_|read_fc|read_wi|pack_|pic_forecast|by_forecast|copy_foot_day)[a-z0-9_]*)'/g)].map(m => m[1]).filter(k => !/_$/.test(k)))];
    assert.ok(keys.length > 40, 'keys read: ' + keys.length);
    for (const k of keys){
      const n = (I.match(new RegExp('^\\s+' + k + '(?:_one|_other)?:', 'gm')) || []).length;
      assert.ok(n >= 2, k + ' is in both books');
    }
  });
});
