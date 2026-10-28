/* ============================================================
   f877 — ATTENTION TO DETAIL, OVER FOUR PICTURES (owner, 24 Oct 2026)
   ============================================================
   (1) Settings' You · Company: "the pill is round and bigger than the theme of
       the pills in the platform" — the bar gives the 30px pill the list heads'
       8px of room, no rule under it;
   (2) the Dossier: "add the 'open >' anywhere people have to click and fill in
       the fields just like it is in the top" — a door row carries "Open ›",
       not a bare arrow (pdCkGo);
   (3) the Deal page in the middle: "the card with the deals is so big that it
       is overlapping with the top card and … on the sides" — the deal is a card
       on the ground, the head's 12px in and a gap under it;
   (4) the Actions menu: "the scroll pill is too thick" — one thin scrollbar
       for every scroller that names none of its own.
   Measured at the parent (d7cfda3): every test here fails.

   Run: node --test test/f877-attention-to-detail.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I = R('index.html'), PD = R('js/paperdesk.js');

describe('f877 attention to detail', () => {
  test('1 Settings\' tab bar gives its pill room, no rule under it', () => {
    assert.match(I, /#app-shell \.st-cr \.st-headcard \.st-facebar\{padding:8px 0;border-bottom:0\}/);
  });
  test('2 a Dossier row you press to fill says "Open ›"', () => {
    /* RE-POINTED 28 Oct 2026 (Fill in the contract): the word is "Open" unless a line names its own (Fill in ›, Edit ›) */
    assert.match(PD, /function pdCkGo\(word\)\{ return `<span class="pd-ck-chev is-word" aria-hidden="true">\$\{_pdE\(_pdT\(word \|\| 'dos_go_open'\)\)\}\$\{PD_GO_TXT\}<\/span>`; \}/);
    for (const row of ['data-pd-ck-row="signers"', 'data-pd-og-row="people"', 'data-pd-og-row="web"', 'class="ds-ob-line']){
      const i = PD.indexOf(row); assert.ok(i >= 0, row);
      const line = PD.slice(PD.lastIndexOf('\n', i), PD.indexOf('\n', PD.indexOf('</button>', i)));
      assert.ok(line.includes('${pdCkGo()}') && !line.includes('<span class="pd-ck-chev" aria-hidden="true"></span>'), row + ' carries the word');
    }
    assert.match(I, /\.pd-ck-chev\.is-word::before\{content:none\}/);
  });
  test('3 the Deal stands as a card on the ground, in line with its head', () => {
    /* RE-POINTED 26 Oct 2026 (f939 (4), the owner: "the bottom card is not aligned with the top one on the right
       edge"): the body keeps its scrollbar's gutter and the head is given the same room */
    assert.match(I, /#modal-root \[data-pd-mid\^="deal:"\] \.dlg-pg-body\{background:transparent;padding:10px 12px 12px;scrollbar-gutter:stable\}/);
    assert.match(I, /#modal-root \[data-pd-mid\^="deal:"\] \.dlg-pg-body > \.deal-mid\{max-width:none;background:var\(--color-surface\);border-radius:20px;/);
  });
  test('4 one thin scrollbar wherever none is named', () => {
    assert.match(I, /:where\(html\) \*\{scrollbar-width:thin;scrollbar-color:var\(--color-neutral-300\) transparent\}/);
  });
});
