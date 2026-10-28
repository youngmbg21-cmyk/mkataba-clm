/* f954 — THE CARD'S VERDICT IS EXPLAINED, NEVER DENIED (owner picked A, 28 Oct 2026)
   The owner's screenshot: their row's card said "Take it" (rlRowReadOf, worked out without AI from the playbook and
   past rounds), and Jambo, asked why, answered "I haven't told you to take it … and I wouldn't". Asked which is best
   practice, the owner picked A: the card keeps its verdict, and Jambo explains it as the company's own position.
   (1) both engines carry ONE rule, word for word, and still refuse a verdict of their own;
   (2) what the card said travels as fields and is read the same way on both hosts. */
const { describe, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SERVER = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const AI = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
const ruleOf = src => { const m = src.match(/const AI_CARD_VERDICT_RULE = "((?:[^"\\]|\\.)*)";/); return m ? m[1] : null; };
const fnOf = (src, name) => {
  const i = src.indexOf('function ' + name + '('); if (i < 0) return null;
  let depth = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++){ if (src[k] === '{') depth++; else if (src[k] === '}'){ depth--; if (!depth) return src.slice(i, k + 1); } }
  return null;
};

describe('f954 (1) one rule, both engines', () => {
  test('the rule is stated on both hosts, word for word', () => {
    const a = ruleOf(AI), b = ruleOf(SERVER);
    assert.ok(a && b, 'both hosts declare AI_CARD_VERDICT_RULE');
    assert.equal(a, b);
    assert.match(a, /company's own position/);
    assert.match(a, /never deny it/);
    assert.match(a, /never make one up/);
  });
  test('both prompts carry it, and still refuse a verdict of Jambo\'s own', () => {
    assert.match(AI, /do not recommend accepting or rejecting one on your own judgement\. \$\{AI_CARD_VERDICT_RULE\}/);
    assert.match(SERVER, /Do not recommend accepting or rejecting a specific change on your own judgement;[^\n]*\n- \$\{AI_CARD_VERDICT_RULE\}/);
  });
});

describe('f954 (2) what the card said travels, read alike on both hosts', () => {
  const rows = [{ id: 'CHG-004', clause: '4. Governing Law', verdict: 'Take it', why: 'You agreed to this kind of ask 5 of 5 times before.' },
    { id: 'CHG-007', clause: '', verdict: 'Escalate', why: '' }];
  const run = (src, name) => (0, eval)('(' + fnOf(src, name) + ')');
  test('the two readers say the same sentence', () => {
    const a = run(AI, 'aiCardReadsSays'), b = run(SERVER, 'cardReadsSays');
    assert.equal(a(rows), b(rows));
    assert.match(a(rows), /CHG-004 \(4\. Governing Law\): "Take it" because You agreed to this kind of ask 5 of 5 times before\./);
    assert.match(a(rows), /no AI/);
    assert.equal(a([]), ''); assert.equal(b(null), '');
  });
  test('a cap is a fact: at most twelve rows, each clipped', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: 'C' + i, verdict: 'Take it', why: 'x'.repeat(900) }));
    const said = run(SERVER, 'cardReadsSays')(many);
    assert.equal((said.match(/"Take it"/g) || []).length, 12);
    assert.ok(!/x{301}/.test(said));
  });
  test('both hosts put it in front of the model', () => {
    assert.match(AI, /view\+=aiCardReadsSays\(ctx\.cardReads\);/);
    assert.match(SERVER, /view \+= cardReadsSays\(ctx\.cardReads\);/);
    assert.match(AI, /if\(reads\.length\) ctx\.cardReads=reads;/);
  });
});
