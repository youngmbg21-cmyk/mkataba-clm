/* f661 — COPILOT KEEPS LISTS AS LISTS (owner, 11 Oct 2026,
   docs/WORKORDER-four-builds.md item 2: "in a real contract this clause likely
   goes into a bullet point format but copilot is not doing so").

   Three parts, pinned here: the rule both drafting formats carry, the same
   rule on the server's wording rule, and the net (aiListLines) that puts the
   line breaks back when a model runs (a)…(f) into one paragraph — breaks
   only, never a word. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AI = read('js/ai.js');

/* the net, lifted out of js/ai.js by its own region and run on its own */
const net = (() => {
  const i = AI.indexOf('const AI_LIST_ROMAN');
  const j = AI.indexOf('function aiListLines(');
  const k = AI.indexOf('\n}\n', j) + 3;
  assert.ok(i > 0 && j > i, 'the net is in js/ai.js');
  const box = {};
  vm.runInNewContext(AI.slice(i, k) + '\nthis.aiListLines = aiListLines;', box);
  return box.aiListLines;
})();
const words = s => String(s).trim().split(/\s+/).join(' ');

describe('f661 (1) — the rule', () => {
  test('both drafting formats carry the one list rule', () => {
    assert.match(AI, /const AI_LIST_RULE = \(\) =>/);
    const prop = AI.slice(AI.indexOf('const AI_PROPOSAL_FORMAT'), AI.indexOf('const AI_PLACEMENTS'));
    const edit = AI.slice(AI.indexOf('const AI_EDIT_FORMAT'), AI.indexOf('const AI_KEEP_TAGS'));
    assert.match(prop, /AI_LIST_RULE\(\)/, 'a replacement asks for lines');
    assert.match(edit, /AI_LIST_RULE\(\)/, 'an addition asks for lines');
    assert.match(AI.slice(AI.indexOf('const AI_LIST_RULE'), AI.indexOf('const AI_PROPOSAL_FORMAT')), /labels the document already uses/,
      'in the document\'s own list style');
  });
  test('the server\'s wording rule says the same', () => {
    const srv = read('server/server.js');
    const r = srv.slice(srv.indexOf('const AI_REDLINE_RULE'), srv.indexOf('const AI_REDLINE_RULE') + 3000);
    assert.match(r, /ONE POINT PER LINE/);
  });
  test('every proposal passes the net, and every card reaching the clause does too', () => {
    assert.match(AI, /proposedText: aiListLines\(/);
    assert.match(read('js/views/clauseeditor.js'), /window\.aiListLines \? aiListLines\(t\) : t/);
    assert.match(read('js/views/negotiation.js'), /window\.aiListLines \? aiListLines : String/);
  });
});

describe('f661 (2) — the net puts the lines back, and only the lines', () => {
  const owner = 'The Supplier shall: (a) process personal data only on documented written instruction; '
    + '(b) ensure that persons authorised have committed to confidentiality; (c) implement measures; '
    + 'and (d) at the termination of this Agreement, delete or return all personal data.';
  test('the owner\'s clause: a lead line and one point per line', () => {
    const out = net(owner).split('\n');
    assert.equal(out.length, 5);
    assert.equal(out[0], 'The Supplier shall:');
    assert.match(out[1], /^\(a\) process/);
    assert.match(out[3], /^\(c\) implement measures; and$/, '"; and" stays at the end of the point before');
    assert.match(out[4], /^\(d\) at the termination/);
  });
  test('not one word moves', () => { assert.equal(words(net(owner)), words(owner)); });
  test('roman and numbered points too', () => {
    assert.equal(net('It may: (i) one; (ii) two; or (iii) three.').split('\n').length, 4);
    assert.equal(net('It may: (1) one; (2) two.').split('\n').length, 3);
  });
  test('a citation in a sentence is never a list', () => {
    const s = 'Subject to clause 4(a) and (b) above, the Buyer may terminate.';
    assert.equal(net(s), s);
    assert.equal(net('Notice under (a) above: (b) is not a list.'), 'Notice under (a) above: (b) is not a list.');
  });
  test('one labelled point is not a list, and points out of order are left alone', () => {
    assert.equal(net('It shall: (a) pay.'), 'It shall: (a) pay.');
    assert.equal(net('It shall: (b) pay; (d) report.'), 'It shall: (b) pay; (d) report.');
  });
  test('wording already on its lines is untouched', () => {
    const s = 'It shall:\n(a) pay;\n(b) report.';
    assert.equal(net(s), s);
  });
});
