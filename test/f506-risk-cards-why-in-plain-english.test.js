/* f506 — EVERY RISK CARD ONE SIZE, "WHY" IN PLAIN ENGLISH, NO DOTTED LINE
   (Young, 5 Oct 2026: "implement your proposal for no dotted line plus 'why,
   in words' … Make sure the why is always in plain english.")
   ============================================================================
   The browser half is one-door-for-edits-verify 1i–1m; this pins, fast:
     (A) EVERY RISK-SCAN RULE HAS A PLAIN REASON in both books — a rule added
         tomorrow without one turns this red (ids read off the scanners);
     (B) THE PLAIN REASONS ARE PLAIN: no legal word from the list, one
         sentence, short;
     (C) THE CARD: the title on one line, "Why" as its own press that opens
         "Why it matters", read through riskWhyOf (the plain book first);
     (D) the linked clause draws no line on the paper.
   Run: node --test test/f506-risk-cards-why-in-plain-english.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const SCANNERS = read('js/ai.js') + read('js/views/contract.js');
const I18N = read('js/i18n.js');
const RK = strip(read('js/risks.js'));
const CSS = read('js/views/negotiation-css.js');

/* the rule ids the scanners can write (g-* are record blanks, never a risk card) */
const IDS = [...new Set([...SCANNERS.matchAll(/add\('((?:t|u|rm|pk|cm|eq|wh|ff|da|rl|mk|nd|le|ps)-[a-z]+)'/g)].map(m => m[1]))];
const book = which => {
  const at = I18N.indexOf(which === 'en' ? "    rk_why_open: 'Why'," : "    rk_why_open: 'Varför',");
  assert.ok(at > 0, 'the ' + which + ' book has the plain reasons');
  const out = {};
  for (const m of I18N.slice(at, at + 20000).matchAll(/\n {4}(rk_why_[a-z0-9_]+): '([^']*)',/g)) out[m[1]] = m[2];
  return out;
};
const EN = book('en'), SV = book('sv');
const keyOf = id => 'rk_why_' + id.replace(/[^a-z0-9]+/g, '_');

describe('f506 (A) every rule has a plain reason, in both books', () => {
  test('the scanners name rules (the read is not empty)', () => {
    assert.ok(IDS.length >= 40, IDS.length + ' rules');
    assert.ok(IDS.includes('t-liab') && IDS.includes('u-ocr') && IDS.includes('nd-inj'));
  });
  for (const id of IDS){
    test(id, () => {
      const k = keyOf(id);
      const has = b => Object.keys(b).some(x => x === k || x.startsWith(k + '_'));
      assert.ok(has(EN), 'English: ' + k);
      assert.ok(has(SV), 'Swedish: ' + k);
    });
  }
  test('both books hold the same keys', () => {
    assert.deepEqual(Object.keys(EN).sort(), Object.keys(SV).sort());
  });
});

describe('f506 (B) the plain reasons are plain', () => {
  const LEGAL = /indemnit|equitable|dilapidation|enforc|working capital|\bOTIF\b|\bMOQ\b|consideration|read down|restraint|step-in|quiet enjoyment|\bforum\b|jurisdiction|\bvest|lessor|lessee|liabilit|\bremed|covenant|excursion|\bBRS\b|stamp duty|heuristic|counterparty|herein|pursuant|thereof|whereas/i;
  for (const [k, v] of Object.entries(EN)){
    if (k === 'rk_why_open' || k === 'rk_why_title') continue;
    test(k, () => {
      assert.ok(!LEGAL.test(v), 'no legal word: ' + v);
      assert.ok(v.split(/\s+/).length <= 32, 'short: ' + v.split(/\s+/).length + ' words');
      assert.ok(!/\.\s+[A-Z]/.test(v.replace(/\.$/, '')), 'one sentence: ' + v);
    });
  }
});

describe('f506 (C) the card', () => {
  test('riskWhyOf reads the plain book first, by id and kind, and falls back to the stored reason', () => {
    const f = RK.match(/function riskWhyOf\(it\)\{[\s\S]*?\n\}/);
    assert.ok(f, 'riskWhyOf exists');
    assert.match(f[0], /it\.src === 'scan'/);
    assert.match(f[0], /'rk_why_' \+ String\(it\.id/);
    assert.match(f[0], /base \+ '_' \+ it\.kind/);
    assert.match(f[0], /return String\(it\.why \|\| ''\)\.trim\(\);/);
    assert.match(RK, /kind: String\(f\.kind \|\| ''\)/, 'a scan risk carries its kind');
  });
  test('"Why" is its own press that opens Why it matters; the title is one line', () => {
    const row = RK.match(/function _rkRowHtml\(c, it\)\{[\s\S]*?\n\}/)[0];
    assert.match(row, /data-rk-act="why" aria-expanded="\$\{open\}"/);
    assert.match(row, /_rkT\('rk_why_open'\)/);
    assert.match(row, /_rkT\('ai_why_matters'\)/);
    assert.match(row, /const why = riskWhyOf\(it\);/);
    assert.match(RK, /if \(act === 'why'\)\{ _rk\.whyOpen\[key\] = !_rk\.whyOpen\[key\]; rkRepaint\(c\); return; \}/);
    assert.match(read('js/risks.js'), /\.rk-row \.rk-top \.rk-t\{white-space:nowrap;overflow:hidden;text-overflow:ellipsis\}/);
    assert.match(read('js/risks.js'), /\.rk-why-btn\{margin-left:auto;/, 'at the right of the button row');
  });
});

describe('f506 (D) no dotted line', () => {
  test('a linked clause draws no outline on the paper; the pairing class stays', () => {
    assert.match(CSS, /\.redline-page \.rl-clause\.is-linked\{outline:none\}/);
    assert.doesNotMatch(CSS, /\.rl-clause\.is-linked\{outline:1px dotted/);
  });
});
