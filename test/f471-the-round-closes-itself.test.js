/* ============================================================
   f471 — the round closes itself
   ============================================================
   THE FINDING (process review, 4 Oct 2026). Close round was a button that
   only came alive once nothing was left to send, could not be undone, and
   was optional — so on most negotiations nobody pressed it, the round number
   never moved, and every send was filed as "Round 1 — sent to …". The version
   list read as one round however many times the paper had changed hands.

   THE RULE NOW. A send that hands the table to the other side, after the
   round on the table has already gone out once, starts the next round
   (negoHandOver → negoAdvanceRound with `auto`). Where the table is quiet the
   decided changes are archived and the agreed wording becomes the baseline,
   exactly as the button did; where it is not, only the number moves and the
   open changes carry on. Ready to sign, the outside hand-over and — new —
   issuing a signing link close it too. The head says "Round N · since <day>"
   in the slot the button had: a fact, not a control.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 9 · Notices</h2><p>Notices are delivered by hand or by registered post.</p>';

const contract = (over = {}) => ({ id: 'MK-R7', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 100, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld(opts);
  w.win.state = { settings: {}, contracts: [] };
  let t = Date.parse('2026-10-01T08:00:00.000Z');
  w.win.nowISO = () => new Date(t += 60000).toISOString();
  return w;
}
const ask = (win, c, num, body, side = 'owner') => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  return win.negoEditClause(c, cl.clauseId, body, { side, author: side === 'owner' ? 'Wanjiru Kamau' : 'Erik', summary: 'ask' });
};
const send = (win, c) => win.negoHandOver(c, { to: 'counterparty', by: 'Wanjiru Kamau' });
const answer = (win, c) => win.negoHandOver(c, { to: 'owner', by: 'Erik' });
const sentLabels = c => (c.versions || []).map(v => v.label || '').filter(l => / — sent to Nordfrakt/.test(l));

describe('f471 (1) — each send that hands the table over is its own round', () => {
  test('the first send is round one; the next one after their answer is round two', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    const a = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    send(win, c);
    assert.equal(win.negoRound(c), 1, 'the first send is the first round\'s send');
    /* They accept it — the wording moves, so the next send is a new snapshot
       (an unchanged text is not filed twice, by captureVersion's own rule). */
    win.negoResolve(c, a.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    answer(win, c);
    await ask(win, c, '6', '<p>Liability is capped at six months of fees.</p>');
    const r = send(win, c);
    assert.equal(win.negoRound(c), 2, 'the send that hands it over again starts round two');
    assert.equal(r.roundMoved, true);
    const labels = sentLabels(c);
    assert.match(labels[0], /^Round 1 — sent to/);
    assert.equal(new Set(labels).size, labels.length, '"Round N — sent" no longer repeats');
    assert.ok((c.audit || []).some(x => /Turn handed to counterparty .* in round 2/.test(x.detail || '')),
      'the trail names the send for its own round');
    assert.equal(c.negotiation.rounds ? c.negotiation.rounds.length : 0, 0,
      'with an ask still open nothing is archived — an undecided change is not history');
  });

  test('a second batch while it is already theirs is the same round', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    send(win, c);
    await ask(win, c, '9', '<p>Notices may also be sent by email.</p>');
    send(win, c);
    assert.equal(win.negoRound(c), 1, 'the table did not change hands, so the round did not move');
  });

  test('where the table is quiet the send archives the round, as the button did', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    const a = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    send(win, c);
    win.negoResolve(c, a.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    answer(win, c);
    send(win, c);
    assert.equal(win.negoRound(c), 2);
    assert.equal(c.negotiation.rounds.length, 1, 'round one is in the history');
    assert.equal(c.negotiation.rounds[0].changes.length, 1);
    assert.match(win.negoBaseText(c), /forty-five \(45\) days/, 'the agreed wording is the new baseline');
    assert.equal(win.negoChanges(c).length, 0, 'and the table is empty for round two');
  });
});

describe('f471 (2) — the head says the round, and nothing to press', () => {
  test('"Round N · since <day>", our seat only, read RAW', async () => {
    const { win } = world({ negotiationView: true });
    const c = contract(); win.negoInit(c);
    await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    send(win, c); answer(win, c);
    await ask(win, c, '6', '<p>Liability is capped at six months of fees.</p>');
    send(win, c);
    const html = win.rlRoundLabelHtml(c, {});
    assert.match(html, /class="rl-round-at"/);
    assert.match(html, /Round 2 · since \d{1,2} Oct/);
    assert.ok(!/<button/.test(html), 'a fact, not a control');
    assert.equal(win.rlRoundLabelHtml(c, { side: 'counterparty' }), '');
    const raw = contract({ id: 'MK-R8' });
    assert.equal(win.rlRoundLabelHtml(raw, {}), '', 'no negotiation, no label');
    assert.equal(raw.negotiation, undefined, 'and drawing it started none');
  });

  test('the press that closed a round is gone from the page', () => {
    const VIEW = bare(read('js/views/negotiation.js'));
    assert.ok(!/querySelectorAll\('\[data-rl-close-round\]'\)/.test(VIEW), 'no handler for a button that is not drawn');
    assert.match(VIEW, /\$\{rlRoundLabelHtml\(c, opts\)\}/, 'the label is in the column head');
  });

  test('both books carry the words', () => {
    const I = read('js/i18n.js');
    const sv = I.indexOf('\n  sv: {');
    for (const k of ['ng_round_since', 'ng_round_since_title']){
      const at = I.indexOf(`    ${k}:`);
      assert.ok(at > 0 && at < sv, `${k} in English`);
      assert.ok(I.indexOf(`    ${k}:`, sv) > sv, `${k} in Swedish`);
    }
  });
});

describe('f471 (3) — a signing link closes the round, like the other two doors', () => {
  test('quiet table: archived; open table: refused; no negotiation: none started', async () => {
    const { win } = world();
    const c = contract(); win.negoInit(c);
    const a = await ask(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    assert.equal(win.negoRoundClosesForSigning(c, 'Wanjiru Kamau'), null, 'an open ask is not history');
    win.negoResolve(c, a.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    assert.ok(win.negoRoundClosesForSigning(c, 'Wanjiru Kamau'), 'settled — the round closes');
    assert.equal(c.negotiation.rounds.length, 1);
    const plain = contract({ id: 'MK-R9' });
    assert.equal(win.negoRoundClosesForSigning(plain), null);
    assert.equal(plain.negotiation, undefined, 'paper nobody negotiated is not given a negotiation');
  });

  test('both signing doors ask it', () => {
    const CORE = bare(read('js/core.js'));
    assert.match(CORE, /payloadObj\.purpose==='sign' && window\.negoRoundClosesForSigning/, 'the send screen');
    const route = CORE.slice(CORE.indexOf('async function issueSigningRouteLinks'), CORE.indexOf('let _shareOpenSeq'));
    assert.match(route, /negoRoundClosesForSigning\(c/, 'and the links issued from the route');
  });
});
