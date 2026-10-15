/* ============================================================
   F223 — the redline co-pilot (W3-1, the gap-map order)
   ============================================================
   When the other side sends a round back, somebody answers every change in
   it — and the answer to most of them is already written down. The playbook
   says what this company accepts; the precedent memory says what it has
   actually accepted before. This proposes a first-pass answer per change.

   THIS FILE IS THE EVALUATION SET the work order asked for before the
   feature was built: the decision matrix driven case by case, so a change
   to the judging can never quietly move a verdict.

   The rules pinned:
   - IT DECIDES NOTHING. Every button in the band carries the CARDS' OWN
     data attributes, so a press runs through the ordinary funnel — the desk
     rule, the review gate, the accept guard, the live-link catch-up. There
     is no second decision path, which is the only reason this is safe.
   - IT IS DETERMINISTIC AND IT EXPLAINS ITSELF. Every verdict names the
     position or figure it rests on; where the playbook is silent it says so
     and recommends nothing. A guess dressed as a recommendation is the one
     thing this feature must never produce.
   - IT ANSWERS ONLY THEIR ASKS. Our own drafts are ours to send or revise.
   - NEVER ON THEIR SEAT: it reads out our playbook, our fallbacks and our
     negotiating history. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { px: tokenPx } = require('./tokens');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* The judging needs the playbook's ranges, the precedent topics and the
   plan itself. Loaded in the order the app loads them. */
function world(contracts) {
  const w = buildWorld({});
  w.win.state = { contracts: contracts || [], settings: {} };
  w.win.eval(read('js/templates.js'));
  /* playbookKeyFor reads cKind, which js/core.js supplies in the real app and
     this harness does not — mirrored here rather than stubbed to something
     simpler, because WHICH playbook applies is exactly what the judging
     turns on. Without it every lookup throws, the engine falls safely to
     'review', and this file would pass while proving nothing about the
     matrix it exists to pin. */
  w.win.isUpload = c => !!(c && c.upload);
  w.win.cKind = c => w.win.isUpload(c) ? 'External Document'
    : ((w.win.TEMPLATES[c.template] || {}).kind || 'Contract');
  w.win.eval(read('js/playbook.js'));
  w.win.eval(read('js/precedent.js'));
  w.win.eval(read('js/redlineplan.js'));
  return w.win;
}
const ask = (o) => ({
  id: o.id, clauseId: o.clauseId || 'c1', clauseLabel: o.label || '',
  oldText: o.oldText || '', newText: o.newText || '',
  status: o.status || 'pending', withdrawn: !!o.withdrawn,
  authorSide: o.side || 'counterparty', author: 'Them',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
});
const deal = (changes) => ({
  id: 'MK-R1', name: 'Supply agreement', counterparty: 'Kabras Sugar',
  status: 'Under Review', folder: 'proc', template: 'RM',
  fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
  signatures: [], comments: [], changes, negotiation: { round: 2 },
});

describe('F223 — the decision matrix', () => {
  test('INSIDE the standard → take it, and it says which standard', () => {
    const c = deal([ask({ id: 'CHG-1', label: 'Payment terms',
      oldText: 'within thirty (30) (30) days', newText: 'within forty-five (45) days' })]);
    const win = world([c]);
    const [row] = win.redlinePlan(c);
    assert.equal(row.verdict, 'accept', '45 days is inside a "<= 45" standard');
    assert.equal(row.figure, 45);
    assert.match(row.why.join(' '), /45/, 'the figure it read');
    assert.match(row.why.join(' '), /<=\s*45/, 'and the position it measured against');
  });

  test('OUTSIDE a standard the playbook escalates → escalate, not push', () => {
    const c = deal([ask({ id: 'CHG-2', label: 'Payment terms',
      oldText: 'within thirty (30) days', newText: 'within ninety (90) days' })]);
    const win = world([c]);
    const [row] = win.redlinePlan(c);
    assert.equal(row.verdict, 'escalate',
      'the playbook marks the payment range escalate — outside it is somebody else\'s call');
    assert.equal(row.figure, 90);
  });

  test('a liability cap below the floor is caught the same way, in the other direction', () => {
    const c = deal([ask({ id: 'CHG-3', label: 'Liability cap',
      oldText: 'twelve (12) months', newText: 'capped at three (3) months fees' })]);
    const win = world([c]);
    const [row] = win.redlinePlan(c);
    assert.equal(row.figure, 3);
    assert.notEqual(row.verdict, 'accept', 'three months is under a ">= 12" floor');
  });

  test('a liability cap at the floor is taken', () => {
    const c = deal([ask({ id: 'CHG-4', label: 'Liability cap',
      oldText: 'six (6) months', newText: 'capped at twelve (12) months fees' })]);
    const win = world([c]);
    assert.equal(win.redlinePlan(c)[0].verdict, 'accept', 'exactly the floor is inside it');
  });

  test('moving governing law abroad escalates on sight', () => {
    const c = deal([ask({ id: 'CHG-5', label: 'Governing law',
      oldText: 'the laws of Kenya', newText: 'governed by the laws of England and Wales' })]);
    const win = world([c]);
    const [row] = win.redlinePlan(c);
    assert.equal(row.verdict, 'escalate');
    assert.match(row.why.join(' '), /governing law/i);
  });

  test('NO STANDARD MEANS NO RECOMMENDATION — and it says so', () => {
    const c = deal([ask({ id: 'CHG-6', label: 'Delivery schedule',
      oldText: 'Tuesdays', newText: 'Thursdays, by 4pm' })]);
    const win = world([c]);
    const [row] = win.redlinePlan(c);
    assert.equal(row.verdict, 'review', 'a guess dressed as a recommendation is the one forbidden output');
    assert.match(row.why.join(' '), /nothing to measure it against/i);
    assert.equal(row.topic, null);
  });

  test('a standard with no figure to read is read by a person', () => {
    const c = deal([ask({ id: 'CHG-7', label: 'Data protection',
      oldText: 'the Data Protection Act', newText: 'personal data may be processed as needed' })]);
    const win = world([c]);
    const [row] = win.redlinePlan(c);
    assert.equal(row.verdict, 'review');
    assert.equal(row.topic, 'dp');
  });
});

describe('F223 — what it will and will not answer for', () => {
  test('only THEIR pending asks — never ours, never settled ones', () => {
    const c = deal([
      ask({ id: 'CHG-1', label: 'Payment terms', newText: 'within forty-five (45) days' }),
      ask({ id: 'CHG-2', label: 'Payment terms', newText: 'within forty-five (45) days', side: 'owner' }),
      ask({ id: 'CHG-3', label: 'Payment terms', newText: 'within forty-five (45) days', status: 'accepted' }),
      ask({ id: 'CHG-4', label: 'Payment terms', newText: 'within forty-five (45) days', withdrawn: true }),
    ]);
    const win = world([c]);
    const plan = win.redlinePlan(c);
    assert.equal(plan.length, 1, 'their one live ask');
    assert.equal(plan[0].id, 'CHG-1');
  });

  test('the worst news is read first', () => {
    const c = deal([
      ask({ id: 'CHG-1', label: 'Payment terms', newText: 'within forty-five (45) days' }),
      ask({ id: 'CHG-2', label: 'Delivery schedule', newText: 'Thursdays' }),
      ask({ id: 'CHG-3', label: 'Governing law', newText: 'governed by the laws of England and Wales' }),
    ]);
    const win = world([c]);
    // spread into THIS realm: the array is built inside the jsdom sandbox
    assert.deepEqual([...win.redlinePlan(c).map(r => r.verdict)], ['escalate', 'review', 'accept'],
      'the things somebody must think about come before the ones they can wave through');
  });

  test('it carries what our own history says about that standard', () => {
    const past = {
      id: 'MK-OLD', name: 'Last year', counterparty: 'Kabras Sugar', status: 'Signed', folder: 'proc',
      fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
      signatures: [], comments: [], negotiation: { round: 3 },
      changes: [
        ask({ id: 'OLD-1', label: 'Payment terms', status: 'accepted', newText: 'within forty-five (45) days' }),
        ask({ id: 'OLD-2', label: 'Payment terms', status: 'rejected', newText: 'within ninety (90) days' }),
      ],
    };
    const c = deal([ask({ id: 'CHG-1', label: 'Payment terms', newText: 'within forty-five (45) days' })]);
    const win = world([c, past]);
    const [row] = win.redlinePlan(c);
    assert.match(row.precedent, /Kabras Sugar/);
    assert.match(row.precedent, /agreed 1/);
    assert.match(row.precedent, /held 1/);
  });

  test('an empty round plans nothing', () => {
    const c = deal([]);
    assert.equal(world([c]).redlinePlan(c).length, 0);
  });
});

describe('F223 — it decides nothing', () => {
  const neg = read('js/views/negotiation.js');
  const css = read('js/views/negotiation-css.js');
  /* THE BAND IS DELETED (owner, 15 Oct 2026: "Delete the retired features").
     It was a `return ''` stub since 24 Aug 2026 (WO-3, "delete the copilot
     first pass feature completely"). Its engine, js/redlineplan.js, stays:
     the change cards (rlCardReadHtml) and Jambo's agents read its verdicts. */
  test('the band, its fold and its styling are gone', () => {
    for (const gone of ['rlPlanBandHtml', 'rlPlanIsOpen', 'rlPlanSetOpen', '_rlPlanOpen', 'data-rl-plan-toggle'])
      assert.ok(!neg.includes(gone), gone + ' is deleted');
    assert.ok(!/\.rl-plan/.test(css), 'no .rl-plan rule is left');
  });

  test('the plan engine writes nothing at all', () => {
    const src = read('js/redlineplan.js');
    for (const forbidden of ['negoResolve', 'negoFileChange', 'persist(', 'logAudit', 'api(', 'fetch('])
      assert.ok(!src.includes(forbidden), 'the engine must not ' + forbidden);
    assert.ok(!/ai\//.test(src), 'and it calls no model — the judging is deterministic and explainable');
  });

  test('the engine\'s words stay in both languages; the band\'s own are inert', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['rp_v_accept', 'rp_v_push', 'rp_v_escalate', 'rp_v_review', 'rp_why_within', 'rp_why_outside', 'rp_why_no_standard'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    for (const k of ['rp_title', 'rp_note'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':[^\\n]*inert since 15 Oct 2026', 'g')) || []).length, 2, k + ' inert in both books');
  });
});
