/* ============================================================
   f876 — ADVICE OR NO ADVICE ON THEIR REDLINE CARDS
   ============================================================
   The owner, 24 Oct 2026: "I do not understand the read it and why features";
   "the card only says read and why. There is nothing indicating that you need
   to pushback or the reason why"; picked "Advice or no advice", then "remove
   the set a rule. A regular employee is not allowed to set rules".
   (1) a verdict says what to do, bold with its dot, its reason under it at the
       card's full width; "Ask Jambo more" is the last of the card's verbs;
   (2) where Jambo has nothing to judge by: "No advice yet" and which rule is
       missing, no dot, no button (no "Why?", no door to set a rule);
   (3) the card has room inside: 18 at the sides, 16 above the clause name;
       the risk card beside it the same.
   Measured at the parent (729fc6f): every test here fails.

   Run: node --test test/f876-advice-or-no-advice.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnRegion = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j < 0 ? undefined : j)); };
const NG = R('js/views/negotiation.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of R('js/i18n.js').matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f876 advice or no advice', () => {
  test('1 a verdict: bold with its dot, the reason under it; "Ask Jambo more" only where there is advice', () => {
    const f = fnRegion(NG, 'rlRowReadHtml');
    assert.match(f, /\$\{R\.tone === 'none' \? '' : '<i aria-hidden="true"><\/i>'\}\$\{_ne\(R\.label\)\}/);
    assert.doesNotMatch(f, /data-rl-read-why/, 'no button inside the read');
    assert.match(fnRegion(NG, 'rlRowReadMoreHtml'), /if \(!R \|\| !R\.more\) return '';/);
    assert.match(NG, /const f = deaden\(face\), more = rlRowReadMoreHtml\(c, ch, side\);/);
    assert.equal(BOOKS.en.rl_read_more, 'Ask Jambo more');
    assert.ok(BOOKS.sv.rl_read_more);
  });
  test('2 nothing to judge by: "No advice yet" and which rule is missing, no button', () => {
    const f = fnRegion(NG, 'rlRowReadOf');
    assert.match(f, /return \{ key: 'none', tone: 'none', label: i18t\('rl_read_none'\), why, more: false \};/);
    assert.match(f, /why = said \? i18t\('rl_read_none_cat', \{ category: said \}\) : i18t\('rl_read_none_w'\);/);
    assert.equal(BOOKS.en.rl_read_none, 'No advice yet');
    assert.equal(BOOKS.en.rl_read_none_cat, 'Your playbook has no rule for {category}.');
    for (const k of ['rl_read_none', 'rl_read_none_w', 'rl_read_none_cat']) assert.ok(BOOKS.sv[k], k + ' sv');
    assert.doesNotMatch(fnRegion(NG, 'rlRowReadOf') + fnRegion(NG, 'rlRowReadHtml'), /stdPositionOpen|openPlaybookEditor/, 'no door to set a rule');
  });
  /* RE-POINTED 25 Oct 2026 (owner: "go with 16px, apply it everywhere"): 16 on every side, the card's own */
  test('3 room inside the card: 16 on every side; the risk card the same', () => {
    const I = R('index.html');
    assert.match(I, /\.redline-page \.rl-pile :is\(\.rl-card-d, \.rl-band \+ \.rl-card-d\)\{background:var\(--color-bg\);border-radius:var\(--radius-lg\);padding:16px;/);
    assert.match(I, /:is\(#ig-dock, body\) \.redline-page \.rl-card-d \.rl-card-head\{padding-top:0\}/);
    assert.match(I, /\.redline-page \.rk-row:not\(\.is-none\):not\(\.is-gone\)\{border:0;border-radius:var\(--radius-lg\);padding:16px;/);
  });
});
