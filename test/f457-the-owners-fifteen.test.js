/* F457 — THE OWNER'S FIFTEEN (Young, 3–4 Oct 2026)
 *
 * The readings behind the list Young built from iPad screenshots: the parts
 * that can be pinned without a browser. What is measured as drawn lives in
 * test/chromium/explorer-tidy-verify.js and where-we-are-verify.js.
 *
 *   (1) every spacing token a rule asks for exists — `.ds-sheet` asked for
 *       --s-5, which :root never had, so its whole padding was dropped and the
 *       words sat on the sheet's border;
 *   (2) one party, one group: names that differ only in capitals or spacing
 *       group together, printed in the book's own spelling; a different
 *       spelling stays a different name. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe('F457 (1) — a spacing token that is asked for exists', () => {
  test('every var(--s-N) in the page, the views and the server is defined in :root', () => {
    const html = read('index.html');
    const defined = new Set((html.match(/--s-\d+\s*:/g) || []).map(x => x.replace(/\s*:$/, '')));
    assert.ok(defined.has('--s-4'), 'the ladder moved: ' + [...defined].join(' '));
    const files = ['index.html'].concat(
      fs.readdirSync(path.join(__dirname, '..', 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
      fs.readdirSync(path.join(__dirname, '..', 'js', 'views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f));
    const missing = [];
    files.forEach(f => (read(f).match(/var\(--s-\d+\)/g) || []).forEach(u => {
      const k = u.slice(4, -1); if (!defined.has(k)) missing.push(f + ': ' + u); }));
    assert.deepEqual(missing, [], 'a rule naming a token :root does not have is dropped whole');
  });
  test('the deal-stands sheet is inset like the Overview (16px, the .sec-head inset)', () => {
    const html = read('index.html');
    const rule = (html.match(/\.ds-sheet\{[^}]*\}/) || [''])[0];
    assert.match(rule, /padding:var\(--s-4\)/, rule);
    assert.match(html, /#kt-overview \.sec-head\{ padding:16px 16px 2px; \}/, 'the Overview moved its inset; move this with it');
  });
});

describe('F457 (2) — one party, one group', () => {
  const { buildWorld } = require('./world');
  const world = () => {
    const w = buildWorld({ intelView: true }).win;
    w.state = { contracts: [
      { id: 'A', counterparty: 'Juno Logistics Ltd' }, { id: 'B', counterparty: 'Juno Logistics Ltd' },
      { id: 'C', counterparty: 'juno  logistics ltd ' }, { id: 'D', counterparty: 'Naivas Supermarkets' },
      { id: 'E', counterparty: 'Naivas Supermarket' }, { id: 'F', counterparty: '' }], settings: {} };
    return w;
  };
  test('capitals and spacing fold; the spelling most of the book uses is printed', () => {
    const w = world();
    assert.equal(w.graphPartyLabel('juno  logistics ltd '), 'Juno Logistics Ltd');
    assert.equal(w.groupLabelOf(w.state.contracts[2], 'counterparty'), 'Juno Logistics Ltd');
    assert.equal(w.groupLabelOf(w.state.contracts[0], 'counterparty'), 'Juno Logistics Ltd');
  });
  test('a different spelling is a different name — HaTi does not guess two parties are one', () => {
    const w = world();
    assert.equal(w.graphPartyLabel('Naivas Supermarket'), 'Naivas Supermarket');
    assert.equal(w.graphPartyLabel('Naivas Supermarkets'), 'Naivas Supermarkets');
  });
  test('no name is still "No counterparty"', () => {
    const w = world();
    assert.equal(w.groupLabelOf(w.state.contracts[5], 'counterparty'), 'No counterparty');
  });
});
