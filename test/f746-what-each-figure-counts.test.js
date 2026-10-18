'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f746 — YOUR BOOK, WHAT EACH FIGURE COUNTS (round 17 of the redesign, "Then
   and now", as drawn; the owner's "build all the gaps", 18 Oct 2026)
   (1) Under Value under contract, one line says what it counts and leaves
       out (hbValueSay): the workspace currency, each rate a converted
       contract was counted at, how many were left out for want of a rate,
       and what adds nothing — pay, a private stream's contracts (by stream),
       a deal seen only by its code name. A reading of fxCounted; nothing
       converted or guessed here.
   (2) Under Ending in 90 days, how many have a decision filed
       (hbEndingDecided, the renewal window's own reading); the change says
       "to decide" while more are ending than six months ago and some are
       undecided.
   (3) The table's change says the value's change as money ("+KES 16M"),
       never a percent; the card's head says every figure is a door.
   (4) Today's insights says its count as a pill and "what moved most since
       <month> · worked out this morning from your book".
   AT THE PARENT (8dc306a) every test here FAILS: hbValueSay and
   hbEndingDecided do not exist, the value line names only the left out, the
   change is a percent and the head says nothing of doors.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HB = read('js/views/homeboard.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const ahead = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function world(contracts, settings = {}){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts, settings, view: 'dashboard' };
  w.FOLDERS = { f1: { id: 'f1', name: 'Sales' }, f2: { id: 'f2', name: 'HR private' } };
  w.currentUser = () => ({ id: 'u_f746', name: 'Maria Lind', role: 'admin' });
  w.eval(read('js/views/homeboard.js'));
  return w;
}
const mk = (id, o = {}) => Object.assign({ id, name: 'Agreement ' + id, counterparty: 'Party ' + id, status: 'Signed', value: 1000000, folder: 'f1', fields: {},
  metadata: { startDate: ago(300) }, createdAt: ago(300) + 'T09:00:00Z', comments: [], audit: [], signatures: [] }, o);

describe('f746 (1) what the value counts, said under it', () => {
  test('1a the currency, the rate counted at, the left out, the not added', () => {
    const cs = [mk('K'), mk('E', { metadata: { currency: 'EUR', startDate: ago(300) } }), mk('N', { metadata: { currency: 'NOK', startDate: ago(300) } }),
      mk('P', { metadata: { category: 'employment', startDate: ago(300) } }), mk('H', { folder: 'f2' }),
      { id: 'F', name: 'Project Falcon', counterparty: '', folder: 'f1', status: 'Under Review', _codeNamed: true, _light: true }];
    const w = world(cs, { fxRates: { EUR: { rate: 140, at: '2026-10-01' } }, privateStreams: { f2: { on: true } } });
    const home = w.fxHomeCode();
    const say = w.hbValueSay(cs.map(c => c.id));
    const rate = Number(140).toLocaleString(w.jxLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    assert.equal(say, `in ${home} · EUR at ${rate} · 1 in NOK left out, no rate · pay, HR private and Project Falcon not added`);
  });
  test('1b one currency, nothing left out: the line says the currency alone', () => {
    const w = world([mk('A'), mk('B')]);
    assert.equal(w.hbValueSay(['A', 'B']), 'in ' + w.fxHomeCode());
  });
  test('1c it is the value row\'s line in the table, in the quiet ink', () => {
    const w = world([mk('A'), mk('B', { metadata: { currency: 'NOK', startDate: ago(300) } })]);
    const html = w.hbBookHtml(w.hbBookData('all'), null, null);
    const row = (html.match(/data-hb-fig="value">([\s\S]*?)<\/div>/) || [])[1] || '';
    assert.match(row, new RegExp(`<span class="hb-fig-left is-split">in ${w.fxHomeCode()} · 1 in NOK left out, no rate</span>`));
  });
  test('1d it reads fxCounted and writes nothing', () => {
    const fn = code(HB.slice(HB.indexOf('function hbValueSay('), HB.indexOf('function hbEndingDecided(')));
    assert.match(fn, /fxCounted\(c\)/);
    assert.ok(!/persist\(|api\(|\.value\s*=[^=]/.test(fn));
  });
});

describe('f746 (2) ending in 90 days: the decisions filed', () => {
  test('2a how many of those ending have a decision filed, and "to decide" on the change', () => {
    const cs = [mk('A', { expiry: ahead(30), metadata: { startDate: ago(300) } }), mk('B', { expiry: ahead(40), metadata: { startDate: ago(20) }, createdAt: ago(20) + 'T09:00:00Z' }),
      mk('C', { expiry: ahead(50), metadata: { startDate: ago(15) }, createdAt: ago(15) + 'T09:00:00Z' })];
    const w = world(cs);
    w.renewalWindow = c => ({ decided: c.id === 'A' });
    assert.equal(w.hbEndingDecided(['A', 'B', 'C']), 1);
    const real = w.hbFigSeries;
    w.hbFigSeries = (k, dd) => k === 'ending' ? [{ v: 1, at: ago(180) }, { v: 3, at: ago(0) }] : real(k, dd);
    const d = w.hbBookData('all');
    assert.equal(d.figs.ending.n, 3, 'three signed, ending inside 90 days');
    const html = w.hbBookHtml(d, null, null);
    const row = (html.match(/data-hb-fig="ending">([\s\S]*?)<\/div>/) || [])[1] || '';
    assert.match(row, /<span class="hb-fig-left is-split">1 has a decision filed<\/span>/);
    assert.match(row, /<b class="hb-vs-n is-warn">\+2 to decide<\/b>/, 'more ending than six months ago, two undecided');
    w.renewalWindow = () => ({ decided: true });
    const all = (w.hbBookHtml(w.hbBookData('all'), null, null).match(/data-hb-fig="ending">([\s\S]*?)<\/div>/) || [])[1] || '';
    assert.match(all, /<b class="hb-vs-n[^"]*">\+2<\/b>/, 'every one decided: nothing to decide, the change alone');
  });
  test('2b no reading of the renewal window, no line', () => {
    const w = world([mk('A')]);
    w.renewalWindow = undefined;
    assert.equal(w.hbEndingDecided(['A']), null);
  });
  test('2c "to decide" rides only a change, never "Same"', () => {
    const w = world([mk('A')]);
    w.hbFigSeries = () => [{ v: 2, at: ago(180) }, { v: 2, at: ago(0) }];
    assert.match(w.hbVsHtml('ending', w.hbBookData('all'), 'warn', true, 'to decide'), /<b class="hb-vs-n">Same<\/b>/);
    w.hbFigSeries = () => [{ v: 2, at: ago(180) }, { v: 4, at: ago(0) }];
    assert.match(w.hbVsHtml('ending', w.hbBookData('all'), 'warn', true, 'to decide'), /<b class="hb-vs-n is-warn">\+2 to decide<\/b>/);
  });
});

describe('f746 (3) the change as money; every figure a door', () => {
  test('3a the table\'s value change is an amount, the long form keeps its percent', () => {
    const w = world([mk('A')]);
    w.hbFigSeries = () => [{ v: 1000000, at: ago(180) }, { v: 3000000, at: ago(0) }];
    const d = w.hbBookData('all');
    assert.match(w.hbVsHtml('value', d, '', true), new RegExp(`>\\+${w.fxHomeCode()} 2M<`));
    assert.match(w.hbVsHtml('value', d, ''), />\+200%</);
  });
  test('3b Your book\'s head says each figure opens the list behind it', () => {
    const w = world([mk('A')]);
    const html = w.hbBookHtml(w.hbBookData('all'), null, null);
    assert.match(html, /<span class="hb-cs">[^<]* against today · each figure opens the list behind it<\/span>/);
  });
});

describe('f746 (4) Today\'s insights, its head as drawn', () => {
  test('4a its count a pill, then what moved most since the month six months ago', () => {
    const fn = code(HB.slice(HB.indexOf('function hbInsCardHtml('), HB.indexOf('/* ---- ONE CONTRACT ROW')));
    assert.match(fn, /'hb_ins_sub_moved'/);
    assert.match(fn, /<span class="hb-pill hb-ins-n">\$\{_hbE\(_hbN\(I\.length\)\)\}<\/span>/);
    assert.match(fn, /i18t\(sub, \{ m: hbThenWord\(true\) \}\)/);
    const w = world([mk('A')]);
    assert.equal(w.i18t('hb_ins_sub_moved', { m: 'April' }), 'what moved most since April · worked out this morning from your book');
  });
});
