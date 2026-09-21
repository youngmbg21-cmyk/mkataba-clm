/* f353 — THE BRIEF IS THE LAST STEP, AND IT IS NOT OPTIONAL
   ============================================================================
   Young, 21 September 2026: *"write brief should be the last button clicked to
   verify that a user reads a brief of everything that has been updated before
   they sign. It should not be the first button in the signing page but last
   and mandatory."* Then, of the two questions put back to him: *"follow the
   gate, every signature."*

   THIS REVERSES the ruling of that same morning, which made the brief the
   FIRST button on the card; the reasoning there is why the control exists at
   all and is kept where it stands.

   WHAT THIS FILE PINS
     · a fourth stage, so only the brief moved — the readings keep their place
     · reading it HOLDS, and follows the gate: on `off` nothing holds, which
       is what off means
     · the reading lapses when EITHER half moves — the brief being rewritten,
       or any wording proposed after it — and the key is made of two facts the
       record can answer, never a second hasher
     · it is each signer's own; one person reading does not answer for another
     · what it proves is what it says: opened and pressed, never understood
     · what moved is read off the record by the memo's own deterministic
       reading — no model, no spend
     · it can never trap a signature: a brief that is missing, stale or cut
       short has its own row and its own way forward

   Run: node --test test/f353-the-brief-is-the-last-step.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const SIGNCHECK = read('js/signcheck.js');
const CONTRACT = read('js/views/contract.js');
const AI = read('js/ai.js');
const I18N = read('js/i18n.js');

const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

const w = () => {
  const world = buildWorld({ signcheck: true, metadata: true });
  world.win.currentUser = () => ({ id: 'u-ingrid', name: 'Ingrid Sjoberg' });
  world.win.openFindings = () => [];
  world.win.canViewValues = () => true;
  world.win.signBlockers = () => [];
  return world;
};
/* A contract whose brief stands: written after the last wording moved. */
const briefed = () => ({ id: 'MK-700', name: 'Nordwind supply', status: 'Under Review',
  audit: [], obligations: [], comments: [], metadata: {},
  changes: [{ id: 'CHG-1', at: '2026-09-01T10:00:00Z', status: 'accepted' }],
  _brief: { at: '2026-09-10T09:00:00Z', by: 'Copilot', data: { overview: 'A supply agreement.' } } });

/* ============================================================================
   1 · LAST, AND ONLY THE BRIEF MOVED
   ==========================================================================*/
describe('f353 (1) a fourth stage, not a reorder', () => {
  test('the brief is the last stage and the readings keep their place', () => {
    const { win } = w();
    assert.deepEqual(win.SIGN_STAGES, ['paper', 'read', 'people', 'sign']);
    assert.equal(win.signStageOf('brief'), 'sign');
    assert.equal(win.signStageOf('brief-read'), 'sign');
    /* THE OTHER READINGS DID NOT MOVE — reordering `read` after `people`
       would have taken the standards, the obligations, the record and the
       risk rows with it, and those sit where a separate ruling put them. */
    for (const k of ['standards-read', 'standard', 'obligations', 'record', 'risk'])
      assert.equal(win.signStageOf(k), 'read', k + ' is still a reading');
    for (const k of ['approval', 'turn', 'signers'])
      assert.equal(win.signStageOf(k), 'people', k + ' is still about people');
  });

  test('the control left the card head and is the last stage’s own act', () => {
    const b = fnBody(CONTRACT, 'signCheckCardHtml');
    assert.ok(/st==='sign'/.test(b), 'the brief button belongs to the last stage');
    assert.ok(/id="sc-brief"/.test(b), 'and keeps its id');
    /* THE HEAD DRAWS NO CONTROL: it carried this one and nothing else. */
    const head = b.slice(b.indexOf('class="kt-tri-head"'), b.indexOf('sc-finds'));
    assert.ok(!/<button/.test(head), 'nothing is pressable in the head any more');
  });

  test('it is drawn in every state, and opening a current brief spends nothing [CONTROL]', () => {
    const b = fnBody(CONTRACT, 'signCheckCardHtml');
    assert.ok(/briefStands\?'open':'run'/.test(b), 'open where one stands, write where none does');
    assert.ok(/br_open/.test(b) && /br_write/.test(b), 'and says which');
    /* ONE READING, TWO ASKERS: the button and the row must agree about
       whether a brief stands, or the card offers to write one that is
       already on the screen — measured, that is exactly what happened. */
    assert.ok(/signCheckBriefStands\(c,rc\.brief\)/.test(b), 'the card asks the one reading');
    assert.ok(/signCheckBriefStands\(c, rd\.brief\)/.test(fnBody(SIGNCHECK, 'signCheckRows')),
      'and so does the row');
  });
});

/* ============================================================================
   2 · IT HOLDS, AND IT FOLLOWS THE GATE
   ==========================================================================*/
describe('f353 (2) mandatory means it holds', () => {
  test('an unread brief holds under advise and under require', () => {
    const { win } = w();
    for (const gate of ['advise', 'require'])
      assert.equal(win.signCheckRowHolds({ kind: 'brief-read', settled: false }, gate), true,
        'it holds on ' + gate);
  });

  test('and nothing holds on `off`, which is what off means [CONTROL]', () => {
    const { win } = w();
    assert.equal(win.signCheckRowHolds({ kind: 'brief-read', settled: false }, 'off'), false);
  });

  test('it does not wait on the check having been run', () => {
    /* It is not a reading the check MAKES — the question is whether this
       signer opened the brief that stands, which `current` says nothing
       about. */
    const { win } = w();
    assert.equal(win.signCheckRowHolds({ kind: 'brief-read', settled: false, current: false }, 'advise'),
      true, 'an unrun check does not excuse it');
  });

  test('driven: the row is there, it holds, and it is the last stage', () => {
    const { win } = w();
    const c = briefed();
    const rows = win.signCheckRows(c);
    const row = rows.find(r => r.kind === 'brief-read');
    assert.ok(row, 'the row is drawn');
    assert.equal(row.holds, true, 'and it holds');
    assert.equal(row.stage, 'sign', 'at the end');
    assert.ok(win.signCheckHolding(c).some(r => r.kind === 'brief-read'),
      'the button’s own count carries it');
  });

  test('reading it settles the row rather than making it vanish', () => {
    const { win } = w();
    const c = briefed();
    win.briefMarkRead(c);
    const row = win.signCheckRows(c).find(r => r.kind === 'brief-read');
    assert.ok(row, 'it is still on the card');
    assert.equal(row.settled, true, 'settled');
    assert.equal(row.holds, false, 'and holding nothing');
    assert.ok(!win.signCheckHolding(c).some(r => r.kind === 'brief-read'),
      'and off the count the button reads');
  });
});

/* ============================================================================
   3 · IT LAPSES, AND IT IS EACH SIGNER'S OWN
   ==========================================================================*/
describe('f353 (3) a brief read on Monday means nothing after Tuesday', () => {
  test('the key is two facts off the record, never a second hasher', () => {
    const b = fnBody(SIGNCHECK, 'briefReadKey');
    assert.ok(/signCheckBriefAt\(c\)/.test(b), 'when wording last moved');
    assert.ok(/b\.at/.test(b), 'and when this brief was written');
    assert.ok(!/hash|playbookHashOf|simhash/i.test(b),
      'a browser twin of the server’s hash would call every brief stale for ever');
  });

  test('a change filed after the reading lapses it', () => {
    const { win } = w();
    const c = briefed();
    win.briefMarkRead(c);
    assert.equal(win.briefReadBy(c), true, 'read');
    c.changes.push({ id: 'CHG-2', at: '2026-09-20T08:00:00Z', status: 'pending' });
    assert.equal(win.briefReadBy(c), false, 'and the redline takes it back');
  });

  test('rewriting the brief lapses it too', () => {
    const { win } = w();
    const c = briefed();
    win.briefMarkRead(c);
    c._brief = { at: '2026-09-21T09:00:00Z', by: 'Copilot', data: { overview: 'Rewritten.' } };
    assert.equal(win.briefReadBy(c), false, 'a new brief is a new reading');
  });

  test('one signer reading it does not answer for the next', () => {
    const { win } = w();
    const c = briefed();
    win.briefMarkRead(c);
    assert.equal(win.briefReadBy(c), true);
    win.currentUser = () => ({ id: 'u-anders', name: 'Anders Ek' });
    assert.equal(win.briefReadBy(c), false, 'Anders has not read it');
  });

  test('the record carries who, when and against what — and nothing is back-dated', () => {
    const { win } = w();
    const c = briefed();
    const row = win.briefMarkRead(c);
    assert.ok(row.at && row.by === 'Ingrid Sjoberg' && row.key, 'all three');
    assert.equal(c.briefRead['u-ingrid'], row, 'stamped under the signer’s own id');
    const b = fnBody(SIGNCHECK, 'briefMarkRead');
    assert.ok(/new Date\(\)\.toISOString\(\)/.test(b), 'now, never a date somebody passed in');
  });
});

/* ============================================================================
   4 · IT CAN NEVER TRAP A SIGNATURE
   ==========================================================================*/
describe('f353 (4) a brief that is not there has its own row and its own way out', () => {
  test('no brief at all draws the WRITE row, never the read one [CONTROL]', () => {
    const { win } = w();
    const c = briefed(); delete c._brief;
    const rows = win.signCheckRows(c);
    assert.ok(rows.some(r => r.kind === 'brief'), 'the write row is there');
    assert.ok(!rows.some(r => r.kind === 'brief-read'), 'and not a second row about one brief');
  });

  test('a brief we cannot see asks for nothing [CONTROL]', () => {
    /* A light record carries the FLAG and not the brief: "we do not know" is
       not "unread", and a row here would hold a signature over an absence the
       reader cannot fix. */
    const { win } = w();
    const c = briefed(); delete c._brief; c._hasBrief = true;
    const rows = win.signCheckRows(c);
    assert.ok(!rows.some(r => r.kind === 'brief-read'), 'nothing is asked');
    assert.ok(!rows.some(r => r.kind === 'brief'), 'and nothing is claimed missing');
  });

  test('a cut-short brief is not something to confirm having read [CONTROL]', () => {
    const { win } = w();
    const c = briefed(); c._brief.truncated = true;
    assert.ok(!win.signCheckRows(c).some(r => r.kind === 'brief-read'));
  });

  test('and the panel offers the press only where the brief really stands', () => {
    const b = fnBody(AI, 'briefReadFootHtml');
    assert.ok(/b\.truncated/.test(b) && /stale === true/.test(b),
      'a brief about to be rewritten is not one to confirm');
    assert.ok(/briefReadKey\(c\)/.test(b),
      'and one with no date of its own cannot be stamped against, so it asks nothing');
    assert.ok(/br_read_done/.test(b), 'and once recorded it is a sentence, not a second press');
  });
});

/* ============================================================================
   5 · WHAT MOVED, AND WHAT THE RECORD CLAIMS
   ==========================================================================*/
describe('f353 (5) what moved is read off the record', () => {
  test('no model writes a word of it and nothing is spent', () => {
    const b = fnBody(AI, 'briefMoved');
    assert.ok(/negoMemo/.test(b), 'the deterministic reading this product already has');
    assert.ok(!/api\(|fetch\(|copilot|anthropic/i.test(b), 'no route, no spend');
    /* A CAP IS A FACT, NEVER A SILENT TRIM. */
    assert.ok(/over:/.test(b) && /counts/.test(b), 'and what was left out is counted');
  });

  test('the words say what was proved, and no more [CONTROL]', () => {
    const { win } = buildWorld({});
    const done = win.i18t('br_read_done');
    assert.ok(/read/i.test(done), 'it says read');
    assert.ok(!/understood|understand/i.test(done + win.i18t('br_mark_read') + win.i18t('br_read_note')),
      'HaTi cannot know a contract was understood and does not say so');
  });

  test('and the trail says the same thing', () => {
    assert.ok(/Read the brief before signing/.test(AI), 'one English audit line');
  });

  test('every new key is in both books', () => {
    for (const k of ['sc_stage_sign', 'sc_brief_read', 'sc_brief_read_done', 'sc_brief_read_w',
      'sc_brief_read_by', 'br_moved_head', 'br_moved_ours', 'br_moved_theirs',
      'br_read_note', 'br_mark_read', 'br_read_done']) {
      const n = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, k + ' is in both books exactly once');
    }
  });

  test('and every new name is published', () => {
    const { win } = w();
    for (const n of ['briefReadKey', 'briefReadOf', 'briefReadBy', 'briefMarkRead'])
      assert.ok(typeof win[n] === 'function', n + ' is reachable');
  });
});
