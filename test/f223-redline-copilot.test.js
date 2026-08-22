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
  const band = neg.slice(neg.indexOf('function rlPlanBandHtml'), neg.indexOf('function rlUnsentBandHtml'));

  test('THE BUTTONS ARE THE CARDS OWN — no second decision path', () => {
    assert.match(band, /data-nego-accept="/, 'accept is the card\'s accept');
    assert.match(band, /data-rl-ask-review="/, 'escalate is the existing internal-review door');
    assert.match(band, /data-rl-cp-open="/, 'and pushing back opens the clause panel');
    for (const forbidden of ['negoResolve(', 'negoFileChange(', 'changes.push', 'persist('])
      assert.ok(!band.includes(forbidden), 'the band must not ' + forbidden);
  });

  test('the plan engine writes nothing at all', () => {
    const src = read('js/redlineplan.js');
    for (const forbidden of ['negoResolve', 'negoFileChange', 'persist(', 'logAudit', 'api(', 'fetch('])
      assert.ok(!src.includes(forbidden), 'the engine must not ' + forbidden);
    assert.ok(!/ai\//.test(src), 'and it calls no model — the judging is deterministic and explainable');
  });

  test('the band is never drawn on their seat, or for a narrowed reviewer', () => {
    assert.match(band, /if \(side === 'counterparty' \|\| \(typeof PORTAL_MODE !== 'undefined' && PORTAL_MODE\)\) return '';/,
      'our playbook and our history, read aloud — never to the other side');
    assert.match(band, /if \(opts\.readonly/, 'nor over a read-only copy');
    assert.match(band, /rlActorHeld\(c, opts\)\) return '';/,
      'nor to a reviewer whose hands are narrowed');
  });

  test('the fold is a posture, and its rows are deliberately not wired', () => {
    const wire = neg.slice(neg.indexOf("data-rl-plan-toggle]')"), neg.indexOf("data-nego-accept]')"));
    assert.match(wire, /rlPlanSetOpen\(!rlPlanIsOpen\(\)\)/);
    assert.match(neg, /their buttons carry the cards' own attributes and are picked up\n     by the very handlers below/,
      'said out loud, because wiring them here would be the second path');
  });

  /* ============================================================
     THE STEPPER DOES NOT REACH THE BAND (owner-reported 22 Aug 2026)
     ============================================================
     "The font adjuster should not adjust the fonts in the copilot's first
     pass ... it should be stagnant like the cards but the fonts should be
     bigger as it is barely legible." Every size in the band was written as
     calc(px * var(--doc-scale,1)) and --doc-scale is what the A-/A+ stepper
     writes on the page root, while the change cards below are plain px. At
     the reported 11px setting that is a scale of 0.73: an 8.4px heading and
     7.3px chips beside a 12.5px card badge.

     Both halves are pinned here — nothing in the band may follow the stepper
     again, and nothing in it may be smaller than the cards it reads. */
  const planRules = () => {
    const css = read('js/views/negotiation-css.js');
    return css.split('\n').filter(l => /\.rl-plan/.test(l) && !/^\s*(\/\*|\*|.*\$\{'')/.test(l));
  };

  test('no size in the band follows the reader\'s document type', () => {
    const bad = planRules().filter(l => /doc-scale/.test(l) && !/--doc-scale:1/.test(l));
    assert.deepEqual(bad, [], 'the paper scales; the furniture does not');
    assert.match(read('js/views/negotiation-css.js'),
      /\.rl-plan\{[^}]*--doc-scale:1/,
      'and the pin is there besides, so a rule added inside the band later cannot bring it back');
  });

  test('the shut band is one line: empty verdicts draw no chip, and the title gives', () => {
    /* Four chips plus a title plus a caret do not fit a 300px column once the
       band stops shrinking with the reader's document type — measured, the
       title wrapped to four lines, and a folded band is meant to be one. A
       chip reading zero is furniture (the alert dot's own rule), and the
       verdict itself is not lost: every row below still names its own. */
    assert.match(band, /const chip = v => \(n\[v\] \?/,
      'a verdict with nothing in it draws no chip');
    assert.ok(!/\$\{n\[v\] \|\| 0\}/.test(band), 'and never a zero');
    assert.match(band, /class="rl-plan-bar"[\s\S]{0,220}title="/,
      'the whole sentence rides on the bar\'s hover, since the title can ellipsise');
    assert.match(read('js/views/negotiation-css.js'),
      /\.rl-plan-title\{[^}]*white-space:nowrap/,
      'the title gives and the chips do not — one line while it is shut');
  });

  test('and nothing in the band is smaller than the cards it is a reading of', () => {
    /* The card's own type: id 11.5 mono, badge 12.5, meta 12. The band takes
       that neighbourhood, so the two objects measure alike. */
    const sizes = planRules().join('\n').match(/font-size:([\d.]+)px/g).map(m => parseFloat(m.slice(10)));
    assert.ok(sizes.length >= 8, 'every piece of the band states a size — ' + sizes.length);
    assert.equal(sizes.filter(n => n < 11.5).length, 0,
      'nothing under the card id\'s 11.5 — ' + sizes.join(', '));
    assert.ok(sizes.includes(13), 'the bar\'s heading leads at 13');
  });

  test('the words exist in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['rp_title', 'rp_note', 'rp_v_accept', 'rp_v_push', 'rp_v_escalate', 'rp_v_review',
      'rp_why_within', 'rp_why_outside', 'rp_why_no_standard'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
