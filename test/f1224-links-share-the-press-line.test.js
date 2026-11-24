'use strict';
/* f1224 — P-18, THE LINKS LINE SHARES ONE ROW WITH "Jambo ›" / "‹ Overview" (owner, 25 Nov 2026, on an iPad photo of a
   Dossier: "the green links above the jambo entry field should never ever as a rule be above the jambo or overview
   presses. They should always be next to them … long words should be shorted so they fit on the same line or simply be
   excluded … this is across hati")
   (1) where the press stands, the row drawn above the box (the contract's own links, a face's own) rides ITS line: the
       same words, pressing the row's own buttons; the row waits hidden
   (2) ONE row, never wrapped: measured in one place, a long word takes its short form, what still does not fit is left
       out from the end; no fixed "three at most" cap
   (3) fitted again on a repaint, a window resize and a panel's width change */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const C = read('js/components.js'), X = read('index.html');

function world(){
  const { win } = buildWorld({});
  win.eval(C);
  win.i18t = k => ({ ca_w_upload: 'upload', ca_w_draft: 'draft', jb_doors_label: 'Doors' }[k] || k);
  return win;
}

test('f1224 (1) the row above the box rides the press\'s line, pressing the row\'s own buttons', () => {
  const win = world(), d = win.document;
  const panel = d.createElement('div');
  panel.innerHTML = `<div data-ig-chips><button type="button" data-ca-chip="fill" class="jb-chip ca-chip-owed">fill in</button><button type="button" data-ca-chip="history" class="jb-chip">history</button></div>
    <div class="igd-foot"><div class="jb-door jb-door-fwd-line" data-jb-fwd-door><button type="button" class="jb-door-back jb-door-fwd">Jambo</button><span class="jb-door-sp"></span></div><div class="jb-card"></div></div>`;
  d.body.appendChild(panel);
  const door = panel.querySelector('.jb-door'), row = panel.querySelector('[data-ig-chips]');
  assert.equal(typeof win.jamboWaysCarry, 'function', 'one carrier');
  win.jamboWaysCarry(door, row);
  const nav = door.querySelector('.jb-ways.is-in-door.is-carried');
  assert.ok(nav, 'the links stand on the press\'s line');
  assert.deepEqual([...nav.querySelectorAll('button')].map(b => b.textContent), ['fill in', 'history']);
  assert.ok(nav.querySelector('button').classList.contains('ca-chip-owed'), 'an owed link stays marked');
  assert.equal(door.firstElementChild.className.includes('jb-door-back'), true, 'the press first, then the links');
  let pressed = '';
  row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { pressed = b.textContent; }));
  nav.querySelectorAll('button')[1].click();
  assert.equal(pressed, 'history', 'a carried link presses the row\'s own button');
  win.jamboWaysCarry(door, row);
  assert.equal(door.querySelectorAll('.jb-ways').length, 1, 'carried once, kept while the words are the same');
  assert.match(X, /html\.lg-new #ig-dock \[data-ig-chips\]:has\(\[data-ca-chip\]\):has\(~ \.igd-foot \.jb-door:not\(\[hidden\]\)\)\{display:none\}/, 'the row waits hidden while the press stands');
  assert.match(C, /if \(door && !old\.hidden\) jamboWaysCarry\(door, old\)/, 'a face\'s own row is carried too');
});

test('f1224 (2) one row, never wrapped: short forms first, then left out from the end', () => {
  const win = world(), d = win.document;
  const row = d.createElement('nav'); row.className = 'jb-ways is-above-foot';
  row.innerHTML = '<button type="button" class="jb-way" data-jb-way="upload">upload a document</button><button type="button" class="jb-way" data-jb-way="draft">draft a new agreement</button><button type="button" class="jb-way" data-jb-way="discover">discover</button>';
  d.body.appendChild(row);
  Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => 160 });
  win.jamboWaysFitOne(row);
  const b = [...row.querySelectorAll('button')];
  assert.deepEqual(b.map(x => x.textContent), ['upload', 'draft', 'discover'], 'each long word takes its short form');
  assert.ok(b.every(x => !x.classList.contains('is-fit-off')), 'and all fit');
  Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => 100 });
  win.jamboWaysFitOne(row);
  assert.deepEqual(b.map(x => x.classList.contains('is-fit-off')), [false, false, true], 'what still does not fit is left out from the end');
  Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => 600 });
  win.jamboWaysFitOne(row);
  assert.deepEqual(b.map(x => x.textContent), ['upload a document', 'draft a new agreement', 'discover'], 'with room, the full words come back');
  assert.ok(b.every(x => !x.classList.contains('is-fit-off')));
  assert.doesNotMatch(X, /\.jb-ways\.is-in-door \.jb-way:nth-of-type\(n\+4\)\{display:none\}/, 'no fixed cap of three');
  assert.doesNotMatch(X, /\[data-ig-chips\] \.jb-chip, \.jb-ways\.is-above-foot \.jb-way\):nth-of-type\(n\+4\)/);
  assert.match(X, /html\.lg-new :is\(#ig-dock \[data-ig-chips\], \.jb-ways\.is-above-foot\)\{flex-wrap:nowrap;overflow:hidden\}/, 'never wrapped');
  assert.match(X, /\.jb-ways > \.is-fit-off, \[data-ig-chips\] > \.is-fit-off\{display:none\}/);
});

test('f1224 (3) fitted in one place, again on a repaint, a resize and a panel\'s width change', () => {
  assert.match(C, /try \{ jamboWaysSync\(\); \} catch \(_\)\{ \/\* a convenience \*\/ \} try \{ jamboWaysFit\(\); \}/, 'after every sync');
  assert.match(C, /window\.addEventListener\('resize', \(\) => jamboWaysQueue\(\)\)/, 'on a resize');
  assert.match(C, /new ResizeObserver\(\(\) => \{ const w = el\.clientWidth; if \(w === last\) return; last = w; jamboWaysQueue\(\); \}\)\.observe\(el\)/, 'on a panel\'s width change');
  assert.match(C, /closest\('\.jb-ways, \[data-ig-chips\]'\)\) continue;/, 'its own writes wake nothing');
  assert.match(read('CLAUDE.md'), /THE LINKS LINE SHARES ONE ROW WITH "Jambo ›" \/ "‹ Overview"/);
  assert.match(read('docs/PARKING-LOT.md'), /### P-18[^\n]*\n- \*\*Added:\*\* 17 Nov 2026 · \*\*Status:\*\* Done/);
});
