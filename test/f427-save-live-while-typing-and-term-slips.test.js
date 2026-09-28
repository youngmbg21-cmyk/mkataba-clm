/* f427 — SAVE IS LIVE WHILE TYPING, AND A MISSPELT DEFINED TERM IS CAUGHT
   (Young, 28 Sep 2026: "fix the greyed Save button while typing too And also
   fix the spelling error issue as it is not working")

   (1)  the foot asks the one filing reading of the box AS TYPED (ceBoxNow →
        ceCanFile(now)), and the typing listener repaints the foot in place.
   (2)  ceCanFile with no draft answers exactly what it always did.
   (3)  a capitalised word one slip from a term THIS contract capitalises is
        checked, with the term as its suggestion; a new name is not.
   (4)  a contract drawn from a template (no redlineText) is read through its
        negotiation's baseline, raw — its words are known, its terms found.
   Behaviour in a browser: their-edit-page-verify 3a2, 6a2, 6e.
   Red at the parent (0088b26): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CE = R('js/views/clauseeditor.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}
let S;
function spell(){
  if (S) return S;
  global.window = global.window || global;
  S = require('../js/spell.js');
  S.spellLoadFrom(fs.readFileSync(path.join(__dirname, '..', 'vendor', 'en-words-1.txt'), 'utf8'));
  return S;
}
const WORDING = 'The Supplier shall deliver the Goods to the Customer within thirty days. '
  + 'This Agreement is governed by the laws of Kenya. Many parties sign it.';

test('f427 (1) the foot asks the one reading of the box as typed, and typing repaints it', () => {
  const foot = code(region(CE, 'ceRenderFoot'));
  assert.match(foot, /const now = ceBoxNow\(\);/);
  assert.match(foot, /const anyToFile = ceCanFile\(now\);/);
  assert.match(foot, /\[discard, _cet\('ce_discard'\), liveMoved\]/);
  const box = code(region(CE, 'ceBoxNow'));
  assert.match(box, /if \(!ceIsTyping\(\)\) return null;/, 'nothing typed, nothing read');
  assert.doesNotMatch(box, /_ceText =|ceApply\(/, 'reading the box writes nothing');
  assert.match(code(CE), /page\.classList\.add\('ce-typed'\);\s*ceRenderFoot\(\);/,
    'the typing listener repaints the foot, in place');
});

test('f427 (2) with no draft, ceCanFile answers what it always did', () => {
  const f = code(region(CE, 'ceCanFile'));
  assert.match(f, /const tx = d \? d\.text : _ceText, hd = d \? d\.head : _ceHead;/);
  assert.match(f, /\(tx !== _ceBase \|\| hd !== _ceHeadBase\)\s*&& clauseEditorOpen\(\) && \(tx !== _ceOpenText \|\| hd !== _ceOpenHead\)/);
});

test('f427 (3) a slip of the contract\'s own term is caught; a new name is not', () => {
  const s = spell();
  const c = { redlineText: '<p>' + WORDING + '</p>' };
  const sus = t => (s.spellSuspects(WORDING, t, c) || []).map(x => x.word + ':' + (x.suggestions[0] || ''));
  assert.deepEqual(sus('The Suplier shall pay.'), ['Suplier:Supplier']);
  assert.deepEqual(sus('as the Custmer asks'), ['Custmer:Customer']);
  assert.deepEqual(sus('under this Agreemnt'), ['Agreemnt:Agreement']);
  assert.deepEqual(sus('signed by Wanjiru Kamau in Nairobi'), [], 'new names pass');
  assert.deepEqual(sus('notice to Mandy and Lars'), [], 'a name one slip from an ordinary word passes');
  assert.deepEqual(sus('the Supplier\'s Goods'), [], 'the term itself, and its possessive, pass');
});

test('f427 (4) a template-drawn contract is read through its baseline, raw', () => {
  const s = spell();
  const c = { negotiation: { baselineText: WORDING } };
  assert.ok(s.spellTermsFrom(c, '').has('supplier'), 'its terms are found');
  assert.ok(s.spellKnownFrom(c).has('governed'), 'its words are known');
  assert.deepEqual((s.spellSuspects('', 'The Suplier shall pay.', c) || []).map(x => x.word), ['Suplier']);
  assert.equal(c.negotiation.baselineText, WORDING, 'nothing written');
  assert.equal(Object.keys(c).join(), 'negotiation');
});
