/* ============================================================
   F271 — Copilot's read, inside an open change card
   ============================================================
   Owner-asked 9 Sep 2026, having first asked what a push-back would actually
   rest on: "if they simplify a clause, what would the copilot read?" The
   honest answer was that the engine judges by MEASUREMENT and only two of its
   six standards carry a figure — payment in days, liability in months — so on
   a simplification it answers "read it yourself" and has nothing else to say.
   Off three options the owner chose B: keep the deterministic read and add one
   more deterministic reading a simplification can use — WHAT CAME OUT.

   THE ENGINE IS NOT NEW. js/redlineplan.js has been dormant since the band
   version was deleted on 24 Aug ("delete the copilot first pass feature
   completely"); only the band went. What changed is that a card now OPENS.

   THE CONTROL COMES FIRST AND IT IS THE POINT OF THIS FILE. rlpRangeFor
   swallows its own exceptions, so a stage that cannot answer cKind — or that
   has no `state` to read a playbook out of — makes every lookup throw, the
   engine falls safely to "there is nothing to measure", and a file like this
   one goes green against a product that never reached its own judgement. f223
   recorded that trap in its own words. Section 1 proves the stage really
   judges before anything else is asserted. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');
const { cardOpened } = require('./cards');

const SRC = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = SRC('js/views/negotiation.js');
const PLAN = SRC('js/redlineplan.js');

/* One bench: a supply contract with a counterparty ask that moves the payment
   figure, and one of our own drafts beside it. */
async function bench(){
  const { win } = buildWorld({ negotiationView: true, copilotRead: true });
  const c = supplyContract();
  win.state.contracts = [c];
  win.state.activeId = c.id;
  win.negoInit(c);
  await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'counterparty', author: 'Amina Wanjiru' });
  await win.negoFileProposal(c, win.negoResolvedText(c) + '\nA cap on liability of 100% of fees.',
    { side: 'owner', author: 'Young Mbagaya' });
  const theirs = c.changes.find(x => x.authorSide === 'counterparty');
  const ours = c.changes.find(x => x.authorSide === 'owner');
  const read = id => {
    const m = cardOpened(win, c, id).match(/<div class="rl-cb-blk rl-rd"[\s\S]*?<\/p>\s*<\/div>/);
    return m ? m[0] : '';
  };
  return { win, c, theirs, ours, read };
}

describe('F271 (1) — the stage really judges, or nothing below means anything', () => {
  test('the playbook resolves and the engine measures against it', async () => {
    const { win, c, theirs } = await bench();
    assert.equal(win.playbookKeyFor(c), 'supply',
      'cKind answers, so the key comes off the contract rather than out of a swallowed throw');
    const range = win.rlpRangeFor(c, 'payment');
    assert.ok(range && range.value != null, 'and the playbook really carries a payment limit');
    const j = win.rlpJudge(c, theirs);
    assert.notEqual(j.verdict, 'review',
      'a change that moves the payment figure past the limit is MEASURED, never the fallback');
    assert.ok(String(j.why.join(' ')).includes(String(range.value)),
      'and the reason names the figure it rests on');
  });
});

describe('F271 (2) — the read, on their pending ask', () => {
  test('it draws, with a verdict and the reason it rests on', async () => {
    const { theirs, read } = await bench();
    const h = read(theirs.id);
    assert.ok(h, 'the block is on the open card');
    assert.match(h, /rl-rd-v/, 'it carries a verdict');
    assert.match(h, /rl-rd-why/, 'and the sentence it rests on');
  });

  test('our own draft gets no read — the engine\'s own third rule', async () => {
    const { ours, read } = await bench();
    assert.equal(read(ours.id), '',
      'proposing that we push back on ourselves is nonsense');
  });

  test('a settled change gets no read — advice on a decision already taken', async () => {
    const { c, theirs, read } = await bench();
    theirs.status = 'accepted';
    assert.equal(read(theirs.id), '', 'a record is not something to weigh');
    theirs.status = 'pending'; theirs.withdrawn = true;
    assert.equal(read(theirs.id), '', 'nor is an ask taken off the table');
    void c;
  });

  test('half the engine is not the engine — it draws nothing rather than a false "no standard"',
    async () => {
      const { win, theirs, read } = await bench();
      const keep = win.precedentTopicOf;
      win.precedentTopicOf = undefined;
      assert.equal(read(theirs.id), '',
        'rlpJudge answers "nothing to measure" without precedent.js, which is a wrong '
        + 'answer wearing a right one\'s clothes');
      win.precedentTopicOf = keep;
      assert.ok(read(theirs.id), 'and it comes back when the engine is whole');
    });
});

describe('F271 (3) — it spends nothing and decides nothing', () => {
  const region = () => {
    const i = NEGO.indexOf('function rlCardReadHtml');
    assert.ok(i > 0, 'the builder is there to be found');
    return NEGO.slice(i, NEGO.indexOf('\nfunction rlCardBodyHtml', i));
  };

  test('no model is called, from the builder or the engine', () => {
    for (const [name, src] of [['the card read', region()], ['the engine', PLAN]])
      for (const bad of ['copilotAsk', 'fetch(', "api(", 'ai/'])
        assert.ok(!src.includes(bad),
          `${name} must not reach for ${bad} — it is read off the record and costs nothing`);
  });

  test('and it files nothing and draws no verb of its own', () => {
    const r = region();
    for (const bad of ['negoFileChange', 'negoResolve', 'changes.push', 'persist(', 'logAudit',
      'data-nego-accept', 'data-nego-reject', 'data-rl-ask-review'])
      assert.ok(!r.includes(bad),
        `${bad} must not appear — the card's own verbs sit twelve pixels below it`);
  });

  test('the counterparty never reaches it', () => {
    /* STRUCTURAL RATHER THAN GUARDED: the body this read lives in is built by
       the flat-row shape, and that shape is drawn inside one condition. */
    assert.match(NEGO, /if \(side === 'owner' && !previewSeat\)\{/,
      'the flat row — and therefore the open body — is our own seat only');
    const i = NEGO.indexOf("if (side === 'owner' && !previewSeat){");
    assert.ok(NEGO.indexOf('rlCardBodyHtml(c, ch, opts, side, {', i) > i,
      'and the open body is built inside it');
  });
});

describe('F271 (4) — what came out', () => {
  const world = () => buildWorld({ negotiationView: true, copilotRead: true }).win;
  const cut = (win, a, b, over = {}) =>
    win.rlpWordsCut(Object.assign({ changeType: 'modify', ops: win.redlineOps(a, b) }, over));

  test('it counts the words and quotes what went', () => {
    const win = world();
    const r = cut(win, 'The Buyer shall pay within thirty (30) days.',
      'The Buyer shall pay within 30 days.');
    assert.ok(r && r.words > 0, 'a count');
    assert.ok(r.runs.length, 'and the removal itself');
    assert.match(r.runs.join(' '), /thirty/, 'quoted from the record');
  });

  test('the count is the words it lists, not the diff\'s own figure', () => {
    /* The card's running +N -N is the RAW diff, and this is a different
       question — how many words are actually gone. They may legitimately
       differ (a re-aligned token is deleted by the diff and removed from
       nothing), so what has to hold is that this line agrees with ITSELF. */
    const win = world();
    const r = cut(win,
      'The Supplier shall promptly deliver the Goods in writing to the Buyer.',
      'The Supplier shall deliver the Goods to the Buyer.');
    const listed = r.runs.concat().join(' ').split(/\s+/).filter(Boolean).length;
    assert.ok(r.more || r.words === listed,
      `with nothing held back the count is what is shown — ${r.words} vs ${listed}`);
    assert.ok(r.words >= listed, 'and it is never fewer than the words on screen');
  });

  test('a re-aligned word is not a removal', () => {
    const win = world();
    assert.equal(cut(win, 'The Buyer shall pay.', 'The Buyer shall pay promptly.'), null,
      'an addition that re-tokenises the word before it removed nothing');
    assert.equal(cut(win, 'pay, in full, on time', 'pay in full on time'), null,
      'and dropping two commas removed no word either');
  });

  test('the longest removals lead, and the rest are counted', () => {
    const win = world();
    const r = cut(win,
      'The Supplier shall promptly deliver the Goods in writing to the Buyer, and shall '
      + 'reasonably ensure that all material defects are notified without undue delay to the '
      + 'Buyer in writing.',
      'The Supplier shall deliver the Goods to the Buyer, and shall ensure that all defects '
      + 'are notified to the Buyer.');
    assert.ok(r.runs.length > 1, 'a scattered simplification really does give several runs');
    const lens = r.runs.map(x => x.length);
    assert.deepEqual(lens, lens.slice().sort((a, b) => b - a), 'ordered by length');
    assert.equal(r.runs.length, win.RLP_CUT_MAX, 'capped at the named ceiling');
    assert.equal(r.more, r.total - r.runs.length, 'and what is not named is counted');
  });

  test('a long removal is clipped at a WORD, never mid-word', () => {
    const win = world();
    const before = 'The Buyer shall pay each undisputed invoice in writing within thirty (30) '
      + 'days of the invoice date, provided that no material breach subsists at that time.';
    const r = cut(win, before, 'The Buyer shall pay.');
    const q = r.runs[0];
    assert.ok(q.length <= win.RLP_CUT_CHARS + 1, `clipped — ${q.length}`);
    assert.match(q, /…$/, 'and it says it is clipped');
    const head = q.replace(/…$/, '');
    /* A CLIP, NEVER A SPLICE: what is shown is a prefix of the real removal,
       and the character after it in the clause is a space — so it ends on a
       whole word rather than inside one. */
    const at = before.indexOf(head);
    assert.ok(at >= 0, 'the shown text is verbatim from the clause');
    /* A NON-WORD CHARACTER FOLLOWS IT — a space, or the punctuation the clip
       trimmed off its own tail. Either way it stops between words rather than
       inside one, which is the whole claim. */
    assert.match(before[at + head.length], /[\s,;:.]/,
      `stops on a word boundary — followed by ${JSON.stringify(before[at + head.length])}`);
  });

  test('a whole clause added or removed is not this reading', () => {
    const win = world();
    const ops = win.redlineOps('one two three', 'one');
    assert.equal(win.rlpWordsCut({ changeType: 'insertClause', ops }), null,
      'an inserted clause removes nothing');
    assert.equal(win.rlpWordsCut({ changeType: 'deleteClause', ops }), null,
      'and a deleted one removes everything and says so on its own row');
  });

  test('a change carrying no ops says nothing rather than guessing', () => {
    const win = world();
    assert.equal(win.rlpWordsCut({ changeType: 'modify', newText: 'x', oldText: 'y' }), null);
  });
});

describe('F271 (5) — the words, in both languages', () => {
  test('every key this read prints is written twice', () => {
    const i18n = SRC('js/i18n.js');
    const en = i18n.slice(i18n.indexOf('en: {'), i18n.indexOf('sv: {'));
    const sv = i18n.slice(i18n.indexOf('sv: {'));
    for (const k of ['ng_rd_title', 'ng_rd_title_tip', 'ng_rd_settled', 'ng_rd_cut',
      'ng_rd_cut_one', 'ng_rd_cut_other', 'ng_rd_among', 'ng_rd_cut_more'])
      for (const [name, side] of [['English', en], ['Swedish', sv]])
        assert.ok(new RegExp('\\b' + k + ':').test(side), `${k} is missing from ${name}`);
  });

  test('the verdict words are the engine\'s own — one vocabulary, not two', () => {
    const i = NEGO.indexOf('function rlCardReadHtml');
    const r = NEGO.slice(i, NEGO.indexOf('\nfunction rlCardBodyHtml', i));
    assert.match(r, /RLP_VERDICTS\[j\.verdict\]/,
      'the chip prints the engine\'s label rather than a second set of words');
  });
});
