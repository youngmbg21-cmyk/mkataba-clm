/* f961 — NUMBERED DOTS ON THE PAPER (owner picked "The Legora way", round 9; "the reads should be automatic",
   28 Oct 2026). Browser check: test/chromium/paper-dots-verify.js. These pin the relations:
     (1) the dots are painted by the one painter of Jambo's answers on the paper, so the Redlines page and Home's paper
         both carry them, and their seat (which returns first) carries none
     (2) the reading is the one Jambo prepares when their round arrives (roundPrepOf) FIRST, else the card's free one
     (3) only their asks still waiting; painted, never stored: nothing written on the contract
     (4) the dot's words never become wording: skipped by the paper's text walks and by the Word file
     (5) Esc shuts only the open reading; the listener is bound once */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fn = name => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j < 0 ? undefined : j)); };

test('(1) the one painter of Jambo\'s answers paints the dots, after their seat has returned', () => {
  const body = fn('rlPaintCopilotAnswers');
  const ret = body.indexOf("opts.side === 'counterparty'"), call = body.indexOf('rlPaintPoints(root, c)');
  assert.ok(ret > 0 && call > ret, 'painted after the counterparty return');
});
test('(2) the prepared answer first, else the card\'s own reading', () => {
  const body = fn('rlPointReadOf');
  const a = body.indexOf('roundPrepOf('), b = body.indexOf('rlRowReadOf(');
  assert.ok(a > 0 && b > a, 'roundPrepOf before rlRowReadOf');
});
test('(3) only their waiting asks, and nothing written on the contract', () => {
  const body = fn('rlPaintPoints');
  assert.match(body, /authorSide !== 'counterparty' \|\| ch\.status !== 'pending' \|\| ch\.withdrawn \|\| ch\.superseded/);
  assert.doesNotMatch(body, /\bc\.\w+\s*=[^=]|\bch\.\w+\s*=[^=]|saveContract|contractSave|api\(/, 'reading never writes');
  assert.match(body, /querySelectorAll\('\.rl-pt'\)\.forEach\(e => e\.remove\(\)\)/, 'an old dot never stays');
});
test('(4) the dot is screen, never wording', () => {
  assert.match(src, /const RL_SUG_SKIP = '[^']*\.rl-pt[^']*'/);
  assert.match(fn('rlInlineCountTo'), /\.rl-sug-ins, \.rl-pt'/);
  const docx = fs.readFileSync(path.join(__dirname, '..', 'js', 'docx.js'), 'utf8');
  assert.match(docx, /DOCX_UI_CLASSES = \[[^\]]*'rl-pt'/);
});
test('(5) Esc shuts only the reading, bound once', () => {
  const i = src.indexOf('document._rlPtWired'); assert.ok(i > 0);
  const wire = src.slice(i, src.indexOf('\n}\n', i));
  assert.match(wire, /Escape[\s\S]*stopImmediatePropagation\(\)[\s\S]*rlPointShut\(null\)/);
  assert.match(wire, /\}, true\);/, 'keydown in the capture phase, ahead of the panel\'s own Esc');
});
