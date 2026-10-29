/* f956 — PLAIN WORDS, FOR A READER ANYWHERE (owner, 28 Oct 2026, round 18: "Premises is not plain english and pro
   rata should be the one in parenthesis. Plain english should go further to not making people have to pull a
   dictionary. Note that this will be an international platform").
   (1) ONE rule, word for word on both hosts, saying the order (everyday words first, the contract's word in brackets);
   (2) every plain reading carries it: the clause-by-clause edition and the Clauses tab's deep read (PLAIN_FOR_WHOM),
       the contract brief (Approvals' "Put it in plain words" too), the web look-up, and the chat on both hosts. */
const { describe, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const SERVER = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const AI = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
const ruleOf = src => { const m = src.match(/const AI_PLAIN_WORDS_RULE = "((?:[^"\\]|\\.)*)";/); return m ? m[1] : null; };

describe('f956 (1) one rule, both hosts', () => {
  test('word for word', () => {
    const a = ruleOf(AI), b = ruleOf(SERVER);
    assert.ok(a && b, 'both hosts declare AI_PLAIN_WORDS_RULE');
    assert.equal(a, b);
  });
  test('it says the order: the everyday meaning first, the contract\'s word in brackets', () => {
    const r = ruleOf(SERVER);
    assert.match(r, /everyday meaning FIRST/);
    assert.match(r, /contract's own word after it in brackets/);
    assert.match(r, /the property you rent \(the contract calls it the Premises\)/);
    assert.match(r, /\(the contract says pro-rata\)/);
    assert.match(r, /never need a dictionary/);
    assert.match(r, /second or third/);
  });
});

describe('f956 (2) every plain reading carries it', () => {
  test('the edition and the deep read, through their one shared line', () => {
    assert.match(SERVER, /const PLAIN_FOR_WHOM = '[^']*' \+ AI_PLAIN_WORDS_RULE;/);
    const read = SERVER.slice(SERVER.indexOf('const READ_PLAIN_RULE = ['), SERVER.indexOf("].join('\\n');", SERVER.indexOf('const READ_PLAIN_RULE = [')));
    const stakes = SERVER.slice(SERVER.indexOf('const STAKES_PLAIN_RULE = ['), SERVER.indexOf("].join('\\n');", SERVER.indexOf('const STAKES_PLAIN_RULE = [')));
    assert.match(read, /PLAIN_FOR_WHOM/); assert.match(stakes, /PLAIN_FOR_WHOM/);
  });
  test('the brief', () => {
    assert.match(SERVER, /return a short cover memo via contract_brief\. \$\{AI_PLAIN_WORDS_RULE\}/);
  });
  test('the chat, on both hosts', () => {
    assert.match(SERVER, /- \$\{AI_CARD_VERDICT_RULE\}\n- \$\{AI_PLAIN_WORDS_RULE\}/);
    assert.match(AI, /\$\{AI_CARD_VERDICT_RULE\} \$\{AI_PLAIN_WORDS_RULE\}/);
  });
});
