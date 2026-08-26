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
const fs = require('node:fs');
const path = require('node:path');
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

/* Like world(), with an execution block at the foot of the paper — the case
   the insert anchor must step over. */
async function buildSignedWorld(){
  const w = buildWorld({ negotiationView: true, playbook: true });
  const { win } = w;
  const c = contractFixture({ redlineText: BASE + '\n' + [
    'SIGNED FOR BUYER — Company Stamp, Signature, Date, Director Name',
    'Name: full name',
    'Title: job title',
  ].join('\n') });
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

  test('a new clause lands BEFORE the signature block, never after it', async () => {
    const { win } = await buildSignedWorld();
    const c = win.state.contracts[0];
    const rev = win.playbookReviewHeuristic(c, win.docPlainText(c));
    const missing = win.rlPlaybookProposals(c, rev).find(it => it.v.status === 'missing' && !it.clauseId);
    assert.ok(missing, 'something is missing to insert');
    const ch = await win.rlFilePlaybookProposal(c, missing, missing.preferred);
    assert.ok(ch && ch.changeType === 'insertClause');
    /* The anchor sits AHEAD of the execution wording — text below the
       signatures can be argued as outside what was signed. */
    const clauses = win.negoClauseList(c);
    const anchor = clauses.find(cl => cl.clauseId === ch.afterClauseId);
    assert.ok(anchor, 'the anchor clause exists');
    assert.ok(!/signed for|in witness/i.test(anchor.text),
      'the insert never anchors on (or after) a clause carrying signature wording');
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

/* ============ OUR WORDING AND THE MODEL'S ARE TWO DIFFERENT THINGS ============
   Owner-reported 26 Aug 2026: a card labelled "Use our standard" served
   Copilot's improvisation — an instruction to a drafter citing GDPR — while the
   workspace's own approved Kenyan clause sat on the quieter button beside it.
   `preferred` read `v.redline || libCl.preferred`, the MODEL'S suggestion
   FIRST, and every surface then printed it under the workspace's name.

   Three named slots now. Nothing is lost and nothing wears another's label. */
describe('F131 — Fix 2b: whose wording is whose', () => {
  /* A review whose redline deliberately DIFFERS from the clause library, which
     is the only shape that can tell the two apart. */
  const rev = () => ({ verdicts: [
    { category: 'Data protection', status: 'missing', quote: '',
      position: 'Data protection clause preferred where personal data is involved',
      redline: 'Insert a data protection clause addressing GDPR obligations.', escalate: false },
  ] });

  test('preferred is the clause library\'s wording, never the model\'s', async () => {
    const { win, c } = await world();
    const it = win.rlPlaybookProposals(c, rev())[0];
    assert.ok(it, 'the verdict still proposes');
    assert.match(it.preferred, /Data Protection Act, 2019/,
      'our standard is the approved wording out of the clause library');
    assert.ok(!/GDPR/.test(it.preferred), 'and never what the model wrote');
  });

  test('the model\'s wording is kept — under its own name', async () => {
    const { win, c } = await world();
    const it = win.rlPlaybookProposals(c, rev())[0];
    assert.match(it.draft, /GDPR/, 'a draft carries the model\'s suggestion');
    assert.equal(it.leadKind, 'standard',
      'and the approved wording is what a card previews when there is one');
    assert.equal(it.lead, it.preferred, 'the preview and the first button agree');
  });

  test('a draft that merely repeats a library wording is not offered twice', async () => {
    const { win, c } = await world();
    const lib = win.clauseLibrary().find(x => x.category === 'Data protection');
    const r = rev(); r.verdicts[0].redline = lib.preferred;
    const it = win.rlPlaybookProposals(c, r)[0];
    assert.equal(it.draft, '', 'the same words under two names is two buttons doing one thing');
    assert.equal(it.preferred, lib.preferred, 'and the approved one is the one that stands');
  });

  test('a position the library has no entry for still proposes — as a draft', async () => {
    const { win, c } = await world();
    const r = { verdicts: [{ category: 'Nothing we hold wording for', status: 'missing',
      quote: '', position: 'a position', redline: 'Some wording the model wrote.', escalate: false }] };
    const it = win.rlPlaybookProposals(c, r)[0];
    assert.ok(it, 'the finding is not thrown away for want of a library entry');
    assert.equal(it.preferred, '', 'there is no approved wording to claim');
    assert.equal(it.leadKind, 'draft', 'so the card leads with the draft');
    assert.equal(it.lead, it.draft, 'and says so');
  });

  test('the review modal offers the draft, and draws no button with nothing behind it', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
    assert.match(SRC, /data-pbr-draft/, 'the draft is reachable on that screen too');
    assert.match(SRC, /it\.draft \? `<button data-pbr-draft/,
      'and only where there is a draft to file');
    assert.match(SRC, /it\.preferred \? `<button data-pbr-go/,
      'the preferred button used to draw unconditionally — a press that filed nothing');
    assert.match(SRC, /redlineStructuredHtml\(it\.oldText, it\.lead\)/,
      'the preview draws the same wording the first button serves');
  });
});

/* ============ IT REFUSES WHEN IT IS NOT SURE (owner-asked 26 Aug 2026) ======
   The cheap half of clause types. rlPbFindClause matched a rule to a clause by
   hunting for the quoted sentence and, failing that, GUESSING by shared words —
   half the quote's long words, counted by substring, winner takes it however
   close the runner-up. Contract clauses share a great many words, so the guess
   could land on the wrong clause and still look confident: the reported bug one
   step earlier in the chain. */
describe('F131 — Fix 2c: a match it is not sure of is no match', () => {
  test('a verbatim quote still locates its clause — containment is certain', async () => {
    const { win, c } = await world();
    const cl = win.negoClauseList(c).find(x => /90 days/.test(x.text));
    const hit = win.rlPbFindClause(c, cl.text.slice(0, 40));
    assert.ok(hit, 'the ordinary case is untouched');
    assert.equal(hit.clauseId, cl.clauseId);
  });

  test('words scattered across two clauses no longer buy either of them', async () => {
    const { win, c } = await world();
    /* MEASURED against the old matcher, which LOCATED all three of these and
       reported the result as that clause's own fight. Each is words the fixture
       really does contain — spread over the supply clause AND the payment one,
       which is precisely the coin toss that must answer "I do not know". */
    assert.equal(win.rlPbFindClause(c, 'invoices supply date estimated'), null,
      'half the words from each of two clauses is not a match to either');
    assert.equal(win.rlPbFindClause(c, 'supply invoices payable estimated annum'), null,
      'nor is a near tie between them');
    /* And the plainly hopeless cases, which the old bar already refused. */
    assert.equal(win.rlPbFindClause(c,
      'the party shall provide written notice within days under this agreement'), null);
    assert.equal(win.rlPbFindClause(c, 'zebra xylophone quasar meridian'), null);
  });

  test('a word is a WORD, not a run of letters inside another one', async () => {
    const { win, c } = await world();
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
    assert.match(src, /const have = _rlPbWords\(cl\.text\);/,
      'the clause is read as a set of words');
    assert.match(src, /if \(have\.has\(w\)\) hit\+\+;/,
      'and membership is the test — "days" used to score against "holidays"');
  });

  test('a tie is a no: the winner must be clear of the runner-up', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
    assert.match(src, /RL_PB_MATCH_MIN/, 'there is a bar');
    assert.match(src, /RL_PB_MATCH_LEAD/, 'and a lead over whatever came second');
    assert.match(src, /if \(bestScore - runnerUp < RL_PB_MATCH_LEAD\) return null;/,
      'two clauses scoring alike is the one state that must answer "I do not know"');
  });
});

/* ============ AND THE THIRD LANDING THAT REFUSING CREATES ================= */
describe('F131 — Fix 2d: a deviation nobody could place is neither verb', () => {
  const rev = quote => ({ verdicts: [
    { category: 'Liability cap', status: 'deviation', quote, position: 'p', redline: '', escalate: false },
  ] });

  test('the three landings are named once, off the verdict and the match', async () => {
    const { win, c } = await world();
    const cl = win.negoClauseList(c).find(x => /90 days/.test(x.text));
    const all = win.rlPlaybookProposals(c, { verdicts: [
      { category: 'Payment terms', status: 'deviation', quote: cl.text.slice(0, 40),
        position: 'p', redline: '', escalate: false },
      { category: 'Data protection', status: 'missing', quote: '', position: 'p', redline: '', escalate: false },
      { category: 'Liability cap', status: 'deviation',
        quote: 'the party shall provide written notice within days', position: 'p', redline: '', escalate: false },
    ] });
    const seen = all.map(it => `${it.v.category}=${it.landing}`).join('|');
    assert.equal(seen,
      'Payment terms=edit|Data protection=add|Liability cap=unplaced',
      'located edits, absent adds, and unplaced is its own answer');
  });

  test('the filing path refuses it — adding would duplicate a clause the document has', async () => {
    const { win, c } = await world();
    const it = win.rlPlaybookProposals(c, rev('the party shall provide written notice within days'))[0];
    assert.equal(it.landing, 'unplaced');
    const before = win.negoChanges(c).length;
    const ch = await win.rlFilePlaybookProposal(c, it, 'Some wording nobody asked to insert.');
    assert.equal(ch, null, 'it refuses');
    assert.equal(win.negoChanges(c).length, before, 'and nothing reaches the record');
  });

  test('the review modal offers it no verb at all, and says what to do instead', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
    assert.match(src, /it\.landing === 'unplaced'/, 'the modal asks the same reading');
    assert.match(src, /ng_pb_unplaced/, 'and names the state rather than drawing a dead button');
    const i18n = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    assert.equal((i18n.match(/^    ng_pb_unplaced:/gm) || []).length, 2, 'both languages');
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
