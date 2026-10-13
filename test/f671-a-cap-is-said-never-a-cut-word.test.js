/* ============================================================
   f671 — A CAP IS SAID, NEVER A CUT WORD (owner, 13 Oct 2026)
   ============================================================
   The deep dive's red figure read "Not quantifiable from the contract wordi",
   its "how" stopped at "out of the general" and its ask at "Add new 18.4.1:
   "Suppl": the server held Jambo's prose to a length with a plain slice.
   aiClip cuts at a word and says "…"; quotes, references and clause numbers
   keep the plain slice because they are matched to the paper; a "figure"
   with no number in it is no figure.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const src = (SRV.match(/function aiClip\(v, n\)\{[\s\S]*?\n\}/) || [''])[0];
const aiClip = new Function(src + '\nreturn aiClip;')();
const route = name => { const i = SRV.indexOf(`app.post('${name}'`); return SRV.slice(i, SRV.indexOf('\n});', i)); };

describe('f671 a cap is said, never a cut word', () => {
  test('aiClip keeps a short text whole and cuts a long one at a word, with …', () => {
    assert.ok(src, 'aiClip is one named function');
    assert.equal(aiClip('Twelve months of fees.', 60), 'Twelve months of fees.');
    const out = aiClip('Not quantifiable from the contract wording because no figure is stated anywhere', 40);
    assert.ok(out.endsWith('…'), out);
    assert.ok(out.length <= 40, out);
    assert.ok(!/wordi…$/.test(out), 'never a cut word: ' + out);
    assert.match(out, /^Not quantifiable from the contract…$/);
  });
  test('both Clauses routes clip prose with aiClip, and quotes, refs and clause numbers stay a plain slice', () => {
    const list = route('/api/ai/breakdown'), point = route('/api/ai/breakdown/point');
    assert.match(list, /str = aiClip/);
    assert.match(point, /const str = aiClip;/);
    for (const k of ['raw(q.text, 600)', 'raw(i.ref, 24)', 'raw(p.quote, 600)', "raw(p.clause, 24)"]) assert.ok(list.includes(k), k);
    assert.ok(!/slice\(0, n\);[\s\S]*str = \(v, n\)/.test(point), 'no plain-slice str in the dive route');
  });
  test('a "figure" with no number is no figure, its words kept in how', () => {
    const point = route('/api/ai/breakdown/point');
    assert.match(point, /const fig = \/\\d\/\.test\(String\(d\.figure \|\| ''\)\) \? str\(d\.figure, 60\) : '';/);
    assert.match(point, /figure: fig, how,/);
  });
});
