'use strict';
/* f1192 — AN AMENDMENT IS APPROVED ON THE VALUE IT BRINGS (owner, 23 Nov 2026: "fix the approval gap for amendments").
   Create files no value of its own (the MAP's ruling stands); the new figure is the amendment's suggestion
   (c.amendFacts.value, its currency beside it). A value rule — on the page AND on the server — measures that figure until
   a person sets one, so "Value ≥ KES 5M" asks for approval on an amendment raising the price to 92M. Nothing is written. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}'){ d--; if (!d) return src.slice(i, k + 1); } } return src.slice(i); };
const AP = R('js/approvals.js'), SRV = R('server/server.js'), FAM = R('js/family.js');

for (const [host, src, name] of [['page', AP, 'approvalValueView'], ['server', SRV, 'srvApprovalValueView']]) {
  test(`f1192 (${host}) the amendment's own suggestion is what a value rule measures`, () => {
    const view = new Function(`${fnOf(src, name)}\nreturn ${name};`)();
    const kid = { id: 'MK-201', parentId: 'MK-B1', value: null, amendFacts: { value: 92000000, currency: 'SEK' } };
    const v = view(kid);
    assert.equal(v.value, 92000000, 'the new figure');
    assert.equal(v.metadata.currency, 'SEK', 'in the agreement\'s currency');
    assert.equal(kid.value, null, 'nothing written');
    assert.equal(view({ id: 'A', parentId: 'P', value: 7, amendFacts: { value: 9 } }).value, 7, 'a value a person set wins');
    assert.equal(view({ id: 'B', parentId: 'P', value: null, amendFacts: { expiry: '2028-06-30' } }).value, null, 'an amendment that moves no money keeps none');
    assert.equal(view({ id: 'C', value: null, amendFacts: { value: 9 } }).value, null, 'only an amendment (a child) is read so');
  });
}

test('f1192 both rule readers measure through it, and Create keeps the currency', () => {
  assert.match(fnOf(AP, 'ruleMatches'), /approvalValueView\(c\)/);
  assert.match(fnOf(SRV, 'srvRuleMatches'), /fxHome\(srvApprovalValueView\(c\)\)/);
  assert.match(FAM, /if\(\/\^\[A-Z\]\{3\}\$\/\.test\(cur\)\) out\.currency = cur;/);
});
