/* EVERY PAGE TYPED IS A PAGE (the owner, 28 Oct 2026: "reads has not been set up as a page as a rule therefore when
   I type reads it goes to AI brain. Rule is all pages need to be going through a rule call when typed").
   Every page a person can open has a row on the Guide (rule 9c). Each row's word, typed alone in any of Jambo's
   boxes, must move there free (JB_PAGE_PLACES → jamboPageWordOf → caGo), never go to the brain. A row that is an
   act with a sheet of its own rather than a place is named below with its reason; the list only shrinks.
   At the parent (before this change) it fails on "reads". */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const NOT_TYPED_PAGES = {
  draft: 'opens the New agreement sheet: a card word ("draft") that a viewer is told about rather than moved to',
};

test('1 · every Guide row is a page word a box moves to', () => {
  const APP = read('js/app.js'), CA = read('js/copilotacts.js');
  const st = Function('return ' + APP.match(/const GUIDE_STAGES = (\[[\s\S]*?\n\]);/)[1])();
  const rows = st.flatMap(s => s.rows);
  /* Home and the Handbook and Settings stand on the Guide outside its stages */
  const panel = (APP.match(/function guidePanelHtml[\s\S]*?\n\}/) || [''])[0];
  const extra = [...panel.matchAll(/guideRowHtml\('([a-z]+)'/g)].map(m => m[1]);
  const pages = [...new Set(rows.concat(extra))];
  const jb = CA.match(/const JB_PAGE_PLACES = \[([\s\S]*?)\];/)[1].replace(/\/\*[\s\S]*?\*\//g, '').match(/'([a-z]+)'/g).map(x => x.slice(1, -1));
  const left = pages.filter(k => !jb.includes(k) && !NOT_TYPED_PAGES[k]);
  assert.deepEqual(left, [], 'these pages, typed, go to the brain instead of opening: ' + left.join(', '));
  for (const k of Object.keys(NOT_TYPED_PAGES)) assert.ok(pages.includes(k), `"${k}" is no longer on the Guide: take it off NOT_TYPED_PAGES`);
});

test('2 · each page word is a CA_PLACES word of its own place', () => {
  const CA = read('js/copilotacts.js');
  const places = CA.match(/const CA_PLACES\s*=\s*\[([\s\S]*?)\n\];/)[1];
  assert.match(places, /\{\s*k:\s*'reads',\s*w:\s*\[[^\]]*'reads'/, '"reads" is a word of the Reads place');
});

/* A PAGE'S NAME IN SEVERAL WORDS (owner, 9 Nov 2026: "when I type our paper or templates in the jambo, it does not
   take me to the page"). At the parent "our paper" went to the brain: only one word moved. */
test('3 · every name of every page, one word or several, moves there free', () => {
  const CA = read('js/copilotacts.js');
  const places = Function('return ' + CA.match(/const CA_PLACES\s*=\s*(\[[\s\S]*?\n\]);/)[1])();
  const jb = Function('return ' + CA.match(/const JB_PAGE_PLACES = (\[[\s\S]*?\]);/)[1])();
  const src = CA.match(/function jamboPageWordOf\(q\)\{[\s\S]*?\n\}/)[0];
  const fn = Function('CA_PLACES', 'JB_PAGE_PLACES', src + '; return jamboPageWordOf;')(places, jb);
  const bad = [];
  for (const p of places.filter(x => jb.includes(x.k))) for (const w of p.w){ const first = places.find(x => jb.includes(x.k) && x.w.includes(w)); const a = fn(w); if (!a || a.place !== first.k) bad.push(p.k + ':' + w); }
  assert.deepEqual(bad, [], 'typed, these names go to the brain: ' + bad.join(', '));
  for (const [w, k] of [['our paper', 'ourpaper'], ['templates', 'ourpaper'], ['Our Paper', 'ourpaper'], ['the people page', 'people'], ['my notes', 'mynotes']]) assert.equal((fn(w) || {}).place, k, w);
  for (const w of ['take me to our paper please', 'sign', 'history', 'what is due this week']) assert.equal(fn(w), null, w);
});
