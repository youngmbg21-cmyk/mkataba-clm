/* f1042 — AN ENTRY FIELD ON THE PAPER IS ALWAYS AMBER, AND ONLY FILL IN THE CONTRACT FILLS IT (owner, 13 Nov 2026: "the
   entry fields on the paper should always be amber and they can never be filled in unless you are on dossier and press
   on fill in the contract"). At the parent: a company standard's fields went grey off the Dossier tab, and a press on a
   field started filling (or opened the form in the middle). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IX = strip(R('index.html')), PD = strip(R('js/paperdesk.js')), CT = strip(R('js/views/contract.js'));

test('every unfilled field is amber on every tab, never on the signing copy, with no hand over it', () => {
  assert.match(IX, /#ig-canvas \.hati-field:not\(\.is-fieldlit\):not\(\.pg-sign \*\)\{background:var\(--st-amber-bg\);color:var\(--st-amber-fg\)\}/);
  assert.match(IX, /#ig-canvas :is\(\.hati-field\[data-field-key\], span\.up-blank\)\{cursor:auto\}/);
});

test('a press on a blank is swallowed: it starts nothing and opens nothing', () => {
  const i = PD.indexOf("const sp = t.closest('#ig-canvas [data-pd2-nb]"); assert.ok(i > 0);
  const h = PD.slice(i, i + 400);
  assert.match(h, /if \(sp\)\{ e\.preventDefault\(\); e\.stopPropagation\(\); return; \}/);
  assert.doesNotMatch(h, /pd2FillStart\(/, 'a press never starts the filling');
  assert.ok(!CT.includes('document._homeAnswerWired = true;'), 'the press-opens-the-form door is gone');
});

test('Fill in the contract stays the one way in', () => {
  assert.match(PD, /function pdFillGo\(id, key\)\{/);
  assert.match(PD, /pd2FillStart\(id, key \|\| ''\)/);
});

test('the Clauses tab\'s Fill it in goes through Fill in the contract, not the form', () => {
  const BD = strip(R('js/views/breakdown.js'));
  const i = BD.indexOf('function stkFillGo(c, p){'); assert.ok(i >= 0);
  const h = BD.slice(i, BD.indexOf('\n}', i));
  assert.match(h, /return pdFillGo\(c\.id, open \? open\.key : ''\)/, 'the Dossier\'s own door');
  assert.ok(h.indexOf('pdFillGo(') < h.indexOf('pdFillOpen('), 'the form only where that door is missing');
});

test('filling in from another tab draws the panel on the Dossier', () => {
  const i = PD.indexOf('function pd2FillStart(id, key){'); assert.ok(i >= 0);
  const h = PD.slice(i, PD.indexOf('\n}', i));
  assert.match(h, /if \(_pdTab !== 'copilot'\) try \{ pdSetTab\('copilot'\); if \(typeof renderIntelDock === 'function'\) renderIntelDock\(\); \}/);
});
