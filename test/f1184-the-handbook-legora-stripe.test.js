'use strict';
/* f1184 — THE HANDBOOK, THE LEGORA + STRIPE WAY (owner: "build it and merge", 23 Nov 2026, as drawn).
   (1) The book is ONE table: every chapter, in the book's order, grouped by part, each row its title, its own first
       sentence, where it is in HaTi, its steps and its pictures as a soft badge.
   (2) The filters narrow it: the words typed, a part, pictures only; a count says how many of all are shown.
   (3) A row's first press chooses it, the second opens it (hbknRowPress); the panel shows the chosen chapter with
       Read the chapter.
   (4) Reading: each step its own line with its number; each picture under the step its boxes mark (hbknShotStep);
       the panel's timeline is each step's own opening words, never invented (hbknStepShort).
   At the parent all four fail: the Handbook was one chapter beside a contents column. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const world = () => { const W = buildWorld({ handbookView: true }).win; W.newLookOn = () => true; return W; };

test('f1184 (1) the book is one table of every chapter, grouped by part', () => {
  const W = world();
  assert.equal(typeof W.hbknBookHtml, 'function', 'the book is drawn');
  const d = W.document.createElement('div'); d.innerHTML = W.hbknBookHtml();
  const rows = [...d.querySelectorAll('[data-hbkn-row]')].map(r => r.getAttribute('data-hbkn-row'));
  assert.deepEqual(rows, [...W.HANDBOOK_CHAPTERS.map(c => c.k)], 'every chapter, in the book\'s order');
  assert.deepEqual([...d.querySelectorAll('[data-hbkn-grp]')].map(g => g.getAttribute('data-hbkn-grp')), [...W.HANDBOOK_PARTS.map(p => p.k)], 'a group a part');
  const r = d.querySelector('[data-hbkn-row="4.1"]');
  assert.ok(r.querySelector('.hbkn-tt b').textContent.startsWith('Approvals'), 'the title');
  assert.ok(r.querySelector('.hbkn-tt span').textContent.length > 20, 'its own first sentence');
  assert.ok(r.querySelector('.hbkn-wh [data-hbk-door]'), 'where it is, its door a link');
  assert.equal(r.querySelector('.hbkn-n').textContent, String(W.HANDBOOK_CHAPTERS.find(c => c.k === '4.1').how.length), 'its steps counted');
  assert.match(r.querySelector('.hbkn-p .hbkn-bd').textContent, /picture/, 'its pictures, a soft badge');
});

test('f1184 (2) the filters narrow the book and the count says so', () => {
  const W = world();
  const F = W.hbknFilters;
  F.fPart = 'sign';
  const L = W.hbknShown();
  assert.deepEqual([...L.map(c => c.k)], [...W.HANDBOOK_CHAPTERS.filter(c => c.part === 'sign').map(c => c.k)], 'a part');
  F.fPart = ''; F.q = 'zzzz-no-such-word';
  assert.equal(W.hbknShown().length, 0, 'a word no chapter holds shows none, never the whole book');
  const d = W.document.createElement('div'); d.innerHTML = W.hbknBookHtml();
  assert.ok(d.querySelector('.hbkn-none'), 'and says how to see them all');
  F.q = ''; F.fPics = true;
  assert.ok(W.hbknShown().every(c => (c.shots || (c.shot ? [c.shot] : [])).length > 0), 'pictures only');
});

test('f1184 (3) a row chooses, pressed again it opens; the panel offers Read the chapter', () => {
  const src = read('js/views/handbook.js');
  const at = src.indexOf('function hbknRowPress('); assert.ok(at > 0, 'the row press');
  const R = src.slice(at, src.indexOf('\n}', at));
  assert.match(R, /if \(_hbkn\.pick === k\)\{ _hbk\.part = c\.part; _hbk\.chapter = c\.k;/, 'the second press opens');
  assert.match(R, /_hbkn\.pick = k;[\s\S]*hbknPanelPaint\(\);/, 'the first chooses and shows it in the panel');
  const W = world(); const c = W.HANDBOOK_CHAPTERS.find(x => x.k === '4.1');
  assert.ok(W.hbknChosenPanelHtml(c).includes('data-hbkn-read="4.1"'), 'Read the chapter');
});

test('f1184 (4) reading: numbered steps, each picture under its step, the timeline in the step\'s own words', () => {
  const W = world(); const c = W.HANDBOOK_CHAPTERS.find(x => x.k === '4.1');
  const d = W.document.createElement('div'); d.innerHTML = W.hbknChapterHtml(c);
  const lis = [...d.querySelectorAll('ol.hbkn-steps > li')];
  assert.equal(lis.length, c.how.length);
  assert.ok(lis.every((li, i) => li.querySelector('.hbkn-sn').textContent === String(i + 1)), 'each step its number');
  const shots = c.shots || [c.shot];
  shots.forEach((sh, i) => { const at = W.hbknShotStep(sh, c.how.length);
    assert.ok(lis[at - 1].querySelector(`img[data-hbk-pic="4.1-${i + 1}"]`), `picture ${i + 1} under step ${at}`); });
  assert.equal(W.hbknShotStep({ boxes: [{ step: 5 }, { step: 3 }] }, 7), 3, 'the first step its boxes mark');
  assert.equal(W.hbknShotStep({}, 7), 7, 'no box: after the last step');
  const plain = s => String(s.en || s).replace(/\{(ui|door):[a-z0-9_]+\}/g, '');
  c.how.forEach(h => { const t = W.hbknStepShort(h).replace(/…$/, '');
    assert.ok(plain(W.hbknPlainForTest ? h : h).length >= 0 && t.length > 0, 'a line for every step'); });
  assert.equal(W.hbknStepShort({ en: 'Read a row: the agreement with the other side.' }), 'Read a row', 'up to its first stop, never a word added');
});
