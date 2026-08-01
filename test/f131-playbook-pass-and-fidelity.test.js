/* ============================================================
   F131 — the playbook pass, the redline seam, and the cumulative read
   ============================================================
   Three of the gap-assessment fixes, held at their engine seams:

     · FIX 2 — Review vs Playbook. rlPlaybookProposals turns a review's
       verdicts into proposals (clause located by quote, preferred and
       fallback wording split, risk from escalate), and
       rlFilePlaybookProposal files one as an ordinary owner change — a
       modify when the clause was found, an insert when the position is
       missing. Nothing files without that call: the pass proposes, a
       person disposes.

     · FIX 1 / OI-5 — the seam between a deletion and its replacement.
       </del><ins> adjacency now carries a display-only gap that wears a
       class the Word writer strips, so the history stops reading
       "…days.forty-five…" while exports stay byte-honest.

     · FIX 4 — the cumulative read. negoOriginalBaselineText pins where the
       negotiation started (live baseline in round 1, the round-1 archive
       forever after), and negoClauseJourney counts ACCEPTED movement only —
       a fight the clause won is not a move. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes of raw sugar per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within 90 days from the date of invoice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-246', name: 'WH — Young',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Drafting',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

async function world(){
  const w = buildWorld({ negotiationView: true, playbook: true });
  const { win } = w;
  const c = contractFixture();
  /* cKind lives in the shell (metadata helpers) — the world doesn't load it,
     and the fixture's folder ('proc') already routes to the supply playbook,
     so the stub only needs to exist. */
  if (typeof win.cKind !== 'function') win.cKind = () => 'raw material supply';
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c };
}

describe('F131 — Fix 2: the playbook pass proposes, a person disposes', () => {
  test('a payment-terms deviation becomes a proposal aimed at the clause it quotes', async () => {
    const { win, c } = await world();
    const rev = win.playbookReviewHeuristic(c, win.docPlainText(c));
    const items = win.rlPlaybookProposals(c, rev);
    assert.ok(items.length >= 1, 'a 90-day payment term must trip the playbook');
    const pay = items.find(it => /payment/i.test(it.v.category));
    assert.ok(pay, 'the payment deviation is among the proposals');
    assert.ok(pay.clauseId, 'the quote locates the clause the fight is about');
    assert.match(pay.oldText, /90 days/, 'and it is the right clause');
    assert.ok(pay.preferred.trim(), 'the proposal carries the playbook wording to file');
    assert.equal(pay.v.status, 'deviation');
  });

  test('filing a located proposal is an ordinary owner modify with the playbook named on it', async () => {
    const { win, c } = await world();
    const rev = win.playbookReviewHeuristic(c, win.docPlainText(c));
    const pay = win.rlPlaybookProposals(c, rev).find(it => /payment/i.test(it.v.category) && it.clauseId);
    const before = win.negoChanges(c).length;
    const ch = await win.rlFilePlaybookProposal(c, pay, pay.preferred);
    assert.ok(ch, 'the change files');
    assert.equal(win.negoChanges(c).length, before + 1, 'exactly one change filed');
    assert.equal(ch.status, 'pending', 'proposed, not applied — the other side still decides');
    assert.equal(ch.authorSide, 'owner');
    assert.equal(ch.changeType, 'modify');
    assert.match(String(ch.note || ''), /^Playbook — /, 'the note names the position it enforces');
  });

  test('a MISSING position files as an insertClause at the end — no located clause required', async () => {
    const { win, c } = await world();
    const rev = win.playbookReviewHeuristic(c, win.docPlainText(c));
    const missing = win.rlPlaybookProposals(c, rev).find(it => it.v.status === 'missing' && !it.clauseId);
    assert.ok(missing, 'the fixture has no confidentiality/governing-law wording, so something is missing');
    const ch = await win.rlFilePlaybookProposal(c, missing, missing.preferred);
    assert.ok(ch, 'the insert files');
    assert.equal(ch.changeType, 'insertClause');
    assert.equal(ch.status, 'pending');
  });

  test('nothing proposes itself: aligned verdicts and empty reviews yield no items', async () => {
    const { win, c } = await world();
    assert.deepEqual(win.rlPlaybookProposals(c, { verdicts: [] }).length, 0);
    assert.equal(win.rlPlaybookProposals(c,
      { verdicts: [{ category: 'X', status: 'aligned', quote: '', position: '', redline: '', escalate: false }] }).length, 0);
    assert.equal(win.rlPlaybookProposals(c,
      { verdicts: [{ category: 'Zed', status: 'deviation', quote: '', position: 'watch this', redline: '', escalate: false }] }).length, 0,
      'a verdict with no proposable wording is review-only, not a proposal');
  });

  test('escalation positions wear high risk; the rest wear medium', async () => {
    const { win, c } = await world();
    const rev = win.playbookReviewHeuristic(c, win.docPlainText(c));
    const items = win.rlPlaybookProposals(c, rev);
    for (const it of items)
      assert.equal(it.risk, it.v.escalate ? 'high' : 'medium');
  });
});

describe('F131 — Fix 1 / OI-5: the seam between a deletion and its replacement', () => {
  test('the seam is opened by CSS, and by CSS alone — the renderer stays byte-honest', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const shell = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.match(shell, /del\[class\]\+ins\[class\]\{margin-inline-start:/,
      'the app shell separates adjacent classed marks visually');
    const { win } = await world();
    const html = win.redlineOpsHtml([
      { op: 'del', text: 'thirty (30) days (Net-30).' },
      { op: 'ins', text: 'forty-five (45) days' }]);
    assert.match(html, /<\/del><ins/, 'the markup itself stays welded — the gap is not a character');
    const projected = html.replace(/<[^>]+>/g, '');
    assert.equal(projected, 'thirty (30) days (Net-30).forty-five (45) days',
      'nothing the renderer emits can leak into a text projection (the f36 invariant)');
  });

  test('the standalone history export carries the same seam rule in its own stylesheet', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    assert.match(src, /\.ht-redline del\+ins\{margin-left:/,
      'the no-login report has no index.html to lean on — it opens the seam itself');
  });
});

describe('F131 — Fix 4: where the negotiation started, and what actually moved', () => {
  test('round 1 in flight reads the live baseline; the round-1 archive pins it forever', async () => {
    const { win, c } = await world();
    const original = win.negoBaseText(c);
    assert.equal(win.negoOriginalBaselineText(c), original);
    /* One accepted change, close the round — the baseline moves on, the
       original must not. */
    const filed = await win.negoFileProposal(c, original.replace('90 days', '45 days'),
      { side: 'counterparty', author: 'Them' });
    assert.equal(filed.length, 1);
    win.negoResolve(c, filed[0].id, 'accepted', { by: 'Us', side: 'owner' });
    win.negoAdvanceRound(c, { by: 'Us' });
    assert.notEqual(win.negoBaseText(c), original, 'the working baseline moved with the round');
    assert.equal(win.negoOriginalBaselineText(c), original, 'the original did not');
  });

  test('the journey counts accepted movement only, per clause label', async () => {
    const { win, c } = await world();
    const original = win.negoBaseText(c);
    const filed = await win.negoFileProposal(c, original.replace('90 days', '60 days'),
      { side: 'counterparty', author: 'Them' });
    win.negoResolve(c, filed[0].id, 'accepted', { by: 'Us', side: 'owner' });
    const rejected = await win.negoFileProposal(c, win.negoBaseText(c).replace('5000 metric tonnes', '9000 metric tonnes'),
      { side: 'counterparty', author: 'Them' });
    win.negoResolve(c, rejected[0].id, 'rejected', { by: 'Us', side: 'owner', reply: 'no' });
    const journey = win.negoClauseJourney(c);
    assert.equal(journey.length, 1, 'one clause moved; the rejected ask is not a move');
    assert.equal(journey[0].n, 1);
  });
});
