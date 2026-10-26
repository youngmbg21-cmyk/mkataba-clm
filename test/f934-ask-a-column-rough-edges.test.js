'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f934 — ASK A COLUMN, THE TWO ROUGH EDGES (owner, 26 Oct 2026)
   (1) The refusal of a counting question (and of a too-short one) is said
       UNDER the question box, never as a toast over the very box it points
       the reader to; typing in the box again clears it.
   (2) "Asked before in your team" never offers a counting question kept
       before the rule: the chip is not drawn (the server's summary leaves it
       out too — f893 2e).
   AT THE PARENT both refusals were toasts and the chips were unfiltered.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'askcolumn.js'), 'utf8');
const fnOf = name => { const m = new RegExp(`\\nfunction ${name}\\([^)]*\\)\\{[\\s\\S]*?\\n\\}`).exec(SRC); return m && m[0]; };
const runOf = (() => { const i = SRC.indexOf('async function askColRun('); return SRC.slice(i, SRC.indexOf('\n}\n', i)); })();

describe('f934 (1) the refusal is said under the box', () => {
  test('1a askColRun refuses through askColSay, never a toast', () => {
    assert.match(runOf, /askColIsPortfolio\(question\)\)\{ askColSay\(_acT\('ac_q_portfolio'\)\); return; \}/);
    assert.match(runOf, /question\.length < 3\)\{ askColSay\(_acT\('ac_q_short'\)\); return; \}/);
    assert.ok(!/toast\(_acT\('ac_q_(portfolio|short)'\)/.test(SRC), 'no toast carries either refusal');
  });
  test('1b askColSay writes the sentence under #ac-q, focuses the box, and typing clears it', () => {
    const dom = new JSDOM('<div id="ig-dock"><div id="ac-form"><div><label for="ac-q">Q</label><textarea id="ac-q"></textarea></div><div><input id="ac-name"></div></div></div>', { pretendToBeVisual: true });
    const { window } = dom;
    const toasts = [];
    const ctx = { document: window.document, toast: (m, k) => toasts.push([m, k]) };
    const src = fnOf('askColSay') + fnOf('askColSayClear') + '\nreturn { askColSay, askColSayClear };';
    const { askColSay, askColSayClear } = new Function('document', 'toast', src)(ctx.document, ctx.toast);
    askColSay('That asks about your contracts, not about the wording of one.');
    const say = window.document.getElementById('ac-q-say');
    assert.ok(say, 'the sentence has a home under the box');
    assert.equal(say.previousElementSibling.id, 'ac-q', 'it stands right under the question box');
    assert.equal(say.className, 'ac-why');
    assert.equal(say.getAttribute('role'), 'alert');
    assert.equal(say.hidden, false);
    assert.match(say.textContent, /not about the wording of one/);
    assert.equal(window.document.activeElement.id, 'ac-q', 'the box is focused, with nothing over it');
    assert.equal(toasts.length, 0, 'nothing is toasted over the box');
    askColSay('Second time, same home');
    assert.equal(window.document.querySelectorAll('#ac-q-say').length, 1, 'one home, re-used');
    askColSayClear();
    assert.equal(say.hidden, true, 'typing again clears it');
    assert.match(SRC, /if \(t\.id === 'ac-q'\)\{ askColSayClear\(\);/, 'the input listener clears it');
  });
  test('1c with no form on the screen the sentence falls back to a toast', () => {
    const dom = new JSDOM('<div></div>');
    const toasts = [];
    const src = fnOf('askColSay') + fnOf('askColSayClear') + '\nreturn { askColSay };';
    const { askColSay } = new Function('document', 'toast', src)(dom.window.document, (m, k) => toasts.push([m, k]));
    askColSay('no box here');
    assert.deepEqual(toasts, [['no box here', 'warn']]);
  });
});

describe('f934 (2) a counting question is not a chip', () => {
  test('2a the team chips are filtered through askColIsPortfolio before they are drawn', () => {
    assert.match(SRC, /const team = \(AC\.team \|\| \[\]\)\.filter\(a => !askColIsPortfolio\(a\.question\)\)\.slice\(0, 6\);/);
    const re = new RegExp(/const AC_PORTFOLIO_RE = (\/.*\/i);/.exec(SRC)[1].slice(1, -2), 'i');
    for (const q of ['how many of these', 'How many contracts have 30 day payment terms', 'Which of these are signed?']) assert.ok(re.test(q), q + ' is a counting question');
    for (const q of ['How much notice does each side need to end the contract early?', 'Is our liability capped, and at what?']) assert.ok(!re.test(q), q + ' asks the wording');
  });
});
