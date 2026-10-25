/* ============================================================
   f878 — THE DEAL PAGE IS THE CLOSE PLAN (owner picked "The Close Plan",
   25 Oct 2026; replaces the Legora list of 24 Oct, which quoted the Redlines
   column back beside itself)
   ============================================================
   (1) every point sits under what to do with it, read off the playbook and
       the record (dealPlanOf): room to give · hold firm · needs a rule ·
       waiting on them · agreed — run here against stubbed readings;
   (2) the page draws that reading: head, road, groups, rows; no tabs;
   (3) a row's doors are the existing ones: Send (the card's own), Open
       clause, Chase (the Send screen), Ask an admin (the tracked ask; an
       admin, the standard) — never Accept / Counter / Reject;
   (4) both books carry every new word.
   Measured at the parent (eb67b55): every test here fails but 3b, which
   guards a ruling the old page already kept.

   Run: node --test test/f878-the-close-plan.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NG = R('js/views/negotiation.js'), PD = R('js/paperdesk.js'), I18N = R('js/i18n.js');
const fnRegion = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

/* the reading, alone, against stubs for what it borrows */
function planner(over = {}){
  const src = ['dealWordsOf', 'dealHeldWords', 'dealSecOf', 'dealStandardOf', 'dealPlanOf'].map(n => fnRegion(NG, n)).join('\n');
  const window = Object.assign({
    LADDER_RANGE_TOPIC: { liability: 'liabilityMonths' },
    pbStandardsFor: () => ({ standards: over.standards || [] }),
    precedentTopicOf: () => null,
    ladderUnsent: (c, rg) => !!rg.unsent,
    ladderFallback: () => over.fallback || null,
    ladderWithin: (t, n, b) => n >= b,
    clauseById: id => (over.library || {})[id] || null,
    rlpJudge: () => over.judge || null,
    redlineShownBlocks: () => []
  }, over.window || {});
  const ctx = { window, i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), rlPrecedentSay: () => '', rlAgoWords: () => '3 days ago',
    rlPlainReasonOf: () => '', rlChangeOps: () => [] };
  Object.assign(ctx, window);
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.dealPlanOf;
}
const C = { id: 'MK-1', negotiation: { turnAt: '2026-10-01' } };

describe('f878 (1) every point under what to do with it', () => {
  test('1a our figure with room above the fallback is room to give, the room counted', () => {
    const p = planner({ fallback: { figure: 6 } })(C, { label: '5. Limitation of liability', topic: { key: 'liability' }, ourFig: 12, unit: 'months', state: 'with', ours: { ch: { id: 'a' }, unsent: true } }, 'you', 'owner');
    assert.equal(p.k, 'give'); assert.equal(p.room, 6); assert.equal(p.unsent, 'a');
  });
  test('1b our figure at the fallback is hold firm', () => {
    const p = planner({ fallback: { figure: 6 } })(C, { label: 'Liability', topic: { key: 'liability' }, ourFig: 6, state: 'with', ours: { ch: { id: 'a' } } }, 'you', 'owner');
    assert.equal(p.k, 'hold');
  });
  test('1c a preferred wording with no fallback in the library is hold firm; a fallback wording is room', () => {
    const std = { category: 'Data protection', pos: 'preferred', clause: 'cl-dp' };
    const row = { label: '11. Data Protection', state: 'with', ours: { ch: { id: 'b' } } };
    assert.equal(planner({ standards: [std], library: { 'cl-dp': { preferred: 'x' } } })(C, row, 'you', 'owner').k, 'hold');
    assert.equal(planner({ standards: [std], library: { 'cl-dp': { preferred: 'x', fallback: 'y' } } })(C, row, 'you', 'owner').k, 'give');
  });
  test('1d no standard for the point is "needs a rule"', () => {
    const p = planner()(C, { label: '7. Quality & Rejection', state: 'with', ours: { ch: { id: 'c' } } }, 'you', 'owner');
    assert.equal(p.k, 'rule');
  });
  test('1e their ask is Jambo\'s read of their row: accept → room, push → hold, review → a rule', () => {
    const row = { label: '9. Payment', state: 'awaiting', theirs: { ch: { id: 't' } } };
    assert.equal(planner({ judge: { verdict: 'accept', why: ['in'] } })(C, row, 'you', 'owner').k, 'give');
    assert.equal(planner({ judge: { verdict: 'push', why: ['out'] } })(C, row, 'you', 'owner').k, 'hold');
    assert.equal(planner({ judge: { verdict: 'review', why: [] } })(C, row, 'you', 'owner').k, 'rule');
  });
  test('1f sent and unanswered is waiting on them; settled is agreed', () => {
    const plan = planner();
    assert.equal(plan(C, { label: 'Law', state: 'with', ours: { ch: { id: 'd' }, at: '2026-09-01' } }, 'them', 'owner').k, 'wait');
    assert.equal(plan(C, { label: 'Pay', state: 'settled' }, 'done', 'owner').k, 'agreed');
  });
});

describe('f878 (2) the page draws the reading', () => {
  const f = fnRegion(NG, 'dealViewHtml');
  test('2a head, road, groups and rows; no tabs', () => {
    assert.match(f, /dealPlanFacts\(c, side\)/);
    assert.match(f, /id="deal-road"/);
    assert.match(f, /data-deal-grp="\$\{k\}"/);
    assert.match(f, /class="deal-pr\$\{cmp \? ' is-open' : ''\}" data-deal-row=/);
    assert.doesNotMatch(f, /deal-tab/);
    assert.doesNotMatch(NG, /DEAL_TABS|dealTabSet/);
  });
  test('2b the groups in the order drawn', () => {
    assert.match(NG, /const DEAL_PLAN_GROUPS = \['give', 'hold', 'rule', 'wait', 'agreed'\];/);
  });
  test('2c Copy as memo names its contract and copies the plan; it rides the way-back line, the road beside the head', () => {
    assert.match(f, /data-deal-memo="\$\{id\}"/);
    assert.match(NG, /dm \? dealPlanMemoText\(mc\) : rlBoardMemoText\(mc\)/);
    assert.match(fnRegion(PD, 'pdDealOpen'), /acts: \['deal-road'\]/);
    assert.match(fnRegion(PD, 'pdDealOpen'), /cr\.appendChild\(memo\)/);
  });
  test('2d a point they asked on opens on its name to compare both wordings (option 2, kept in the plan)', () => {
    const f = fnRegion(NG, 'dealViewHtml');
    assert.match(f, /data-deal-toggle="\$\{_nea\(r\.clauseId\)\}"/);
    assert.match(f, /class="deal-cmp"/);
    assert.match(f, /rlChangeWordingHtml\(ch, \{ side, changedOnly: true \}\)/);
  });
});

describe('f878 (3) the doors are the existing ones', () => {
  test('3a Chase opens the Send screen; Ask an admin is the tracked ask, an admin the standard itself', () => {
    assert.match(PD, /if \(c && typeof openShareModal === 'function'\) openShareModal\(c\);/);
    assert.match(PD, /stdPositionOpen\(cat\)/);
    assert.match(PD, /stAskDirect\('playbook', _pdT\('ng_plan_ask_what'/);
  });
  test('3b no Accept / Counter / Reject on the page (the owner, 3 Oct)', () => {
    const f = fnRegion(NG, 'dealViewHtml');
    assert.doesNotMatch(f, /ng_accept|ng_counter|ng_reject|data-rl-accept|data-rl-reject/);
  });
});

describe('f878 (4) both books', () => {
  test('4a every ng_plan_ word is in English and Swedish', () => {
    const keys = [...new Set((NG + PD).match(/ng_plan_[a-z_]+/g))].filter(k => !k.endsWith('_'));
    assert.ok(keys.length > 30, 'the page speaks in ng_plan_ words');
    const plural = k => ['ng_plan_head', 'ng_plan_unseen'].includes(k);
    for (const k of keys){
      const want = plural(k) ? [k + '_one', k + '_other'] : [k];
      for (const w of want){
        const n = (I18N.match(new RegExp('\\n\\s+' + w + ':', 'g')) || []).length;
        assert.equal(n, 2, w + ' in both books');
      }
    }
  });
});
