/* f551 — THE BOARD'S SERIES COLOURS PASS FOR COLOUR-BLIND READERS (work order O-24, 8 Oct 2026)
   f549 pins the hex values. This file pins WHY they were chosen, by working
   the five palette checks out in the test itself, so a later swap of one
   colour has to pass the same bar rather than just match a new string:
     lightness band · strength (chroma) · colour-blind separation (protan and
     deutan, Machado 2009 at full severity) · normal-vision separation ·
     contrast against the board card the colour is drawn on.
   Checked for BOTH brands' orders (Green swaps the first two, so its
   neighbours differ) on BOTH boards (light and dark), against the card as
   painted: --hb-card composited over the stage's middle colour, read out of
   index.html. Only the first four (the checked set) are held to it; the tail
   is for a fifth series and later. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'homeboard.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const setOf = name => {
  const m = new RegExp('const ' + name + ' = \\[([^\\]]*)\\]').exec(SRC);
  assert.ok(m, 'no ' + name);
  return [...m[1].matchAll(/'(#[0-9A-Fa-f]{6})'/g)].map(x => x[1]).slice(0, 4);
};

/* ---- colour arithmetic (OKLab, WCAG, Machado 2009) ---- */
const hex = h => [0, 2, 4].map(i => parseInt(h.replace('#', '').slice(i, i + 2), 16) / 255);
const toLin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lin = h => hex(h).map(toLin);
const lum = h => { const [r, g, b] = lin(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
function oklab([r, g, b]){
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]
};
const sim = (h, k) => { const c = lin(h), M = MACHADO[k]; return M.map(row => Math.max(0, Math.min(1, row[0] * c[0] + row[1] * c[1] + row[2] * c[2]))); };
const dE = (a, b, k) => { const x = oklab(k ? sim(a, k) : lin(a)), y = oklab(k ? sim(b, k) : lin(b)); return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const L = h => oklab(lin(h))[0];
const C = h => { const [, a, b] = oklab(lin(h)); return Math.hypot(a, b); };

const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] };
const CHROMA_FLOOR = 0.10, CVD_FLOOR = 8, NORMAL_FLOOR = 15, CONTRAST_MIN = 3;

/* ---- the card each colour is drawn on, as painted ---- */
const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
function cardOf(selector, fallback){
  const at = INDEX.indexOf(selector + '{');
  assert.ok(at > -1, 'no board block ' + selector);
  const body = INDEX.slice(at, INDEX.indexOf('}', at));
  const mid = /#([0-9A-Fa-f]{6}) 4[58]%/.exec(body);
  assert.ok(mid, 'the stage\'s middle colour in ' + selector);
  const card = /--hb-card:rgba\((\d+),(\d+),(\d+),([.\d]+)\)/.exec(body) || fallback;
  assert.ok(card, 'a card colour for ' + selector);
  const ground = hex('#' + mid[1]).map(v => v * 255), a = Number(card[4]);
  return { hex: toHex([1, 2, 3].map(i => Number(card[i]) * a + ground[i - 1] * (1 - a))), card };
}
const greenDark = cardOf('#ig-page.hb-dark,#hb-page.hb-dark');
const greenLight = cardOf('#ig-page.hb-light,#hb-page.hb-light');
const navyDark = cardOf(':root[data-brand="navy"] #ig-page.hb-dark,:root[data-brand="navy"] #hb-page.hb-dark', greenDark.card);
const navyLight = cardOf(':root[data-brand="navy"] #ig-page.hb-light,:root[data-brand="navy"] #hb-page.hb-light', greenLight.card);

const LIGHT = setOf('HB_HUES_LIGHT'), DARK = setOf('HB_HUES_DARK');
const swapFirstTwo = s => [s[1], s[0], ...s.slice(2)];
const CASES = [
  { name: 'Blue brand, light board', set: LIGHT, mode: 'light', card: navyLight.hex },
  { name: 'Blue brand, dark board', set: DARK, mode: 'dark', card: navyDark.hex },
  { name: 'Green brand, light board', set: swapFirstTwo(LIGHT), mode: 'light', card: greenLight.hex },
  { name: 'Green brand, dark board', set: swapFirstTwo(DARK), mode: 'dark', card: greenDark.hex }
];
const pairs = s => s.slice(1).map((c, i) => [s[i], c]);

test('f551 (0) the four checked colours and the four cards are read, not guessed', () => {
  assert.equal(LIGHT.length, 4); assert.equal(DARK.length, 4);
  for (const k of CASES) assert.match(k.card, /^#[0-9a-f]{6}$/, k.name);
  assert.match(SRC.replace(/\/\*[\s\S]*?\*\//g, ''), /set\[0\] = set\[1\]; set\[1\] = t;/, 'Green swaps the first two, as checked here');
});

for (const k of CASES){
  test(`f551 ${k.name}: the five checks`, () => {
    const [lo, hi] = BAND[k.mode];
    for (const c of k.set){
      assert.ok(L(c) >= lo && L(c) <= hi, `${c} lightness ${L(c).toFixed(3)} inside ${lo}–${hi}`);
      assert.ok(C(c) >= CHROMA_FLOOR, `${c} strength ${C(c).toFixed(3)} ≥ ${CHROMA_FLOOR}`);
      assert.ok(contrast(c, k.card) >= CONTRAST_MIN, `${c} contrast ${contrast(c, k.card).toFixed(2)} on the card ${k.card}`);
    }
    for (const [a, b] of pairs(k.set)){
      for (const kind of ['protan', 'deutan'])
        assert.ok(dE(a, b, kind) >= CVD_FLOOR, `${a}↔${b} ${kind} ΔE ${dE(a, b, kind).toFixed(1)} ≥ ${CVD_FLOOR}`);
      assert.ok(dE(a, b) >= NORMAL_FLOOR, `${a}↔${b} normal ΔE ${dE(a, b).toFixed(1)} ≥ ${NORMAL_FLOOR}`);
    }
  });
}

test('f551 (last) the colours the board used before would not pass — the check can say no', () => {
  const before = ['#7FA6EE', '#38CDB8', '#E0CB8F', '#C9A0E8'];
  const [lo, hi] = BAND.dark;
  const fails = before.filter(c => L(c) < lo || L(c) > hi || C(c) < CHROMA_FLOOR).length;
  assert.ok(fails > 0, 'the old pale set is refused by the same arithmetic');
});
