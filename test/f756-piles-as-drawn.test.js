'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f756 — PILES, AS DRAWN: THE READINGS (round 9's gaps: the owner's "build all
   the gaps", 18 Oct 2026; the picked option "Piles")
   (1) A row's changed words, cut around the edit (rlRowExcerptHtml): a READING
       over the change's stored ops — a few words before the first mark, the
       marks, the rest of the sentence after; a cut said with "…"; a struck run
       and its replacement two words; a whole clause added or struck said in
       its first words; empty where no ops (the argument line stays). The line
       sits in the argument line's slot with the argument on its hover.
   (2) The lock line on the row: "Erik is editing this clause" with the
       paper's own Ask for it (or Asked); our seat only; the row's Counter grey
       and plain beside it.
   (3) The piles' names: "Lina suggests" (one colleague), "Colleagues suggest",
       "Your suggestions, with Maria" on the author's seat; "Settled in round
       1" when everything settled came before this round, "Settled in rounds
       1–N" across several, "Settled this round" otherwise. A suggestion is a
       pile of its own on our seat only, between their answers and our drafts.
   (4) The column's head: "Redlines N" counts the rows in sight; Notes with
       its count, Here now (presence's own slot), the round with when their
       asks came, Send all, Ask for review (the review's own door) — our seat
       only; the Redlines face passes no progress pile, no ‹ Jambo, no ×.
   AT THE BASE (8dc306a) every test here FAILS.
   The browser half: test/chromium/piles-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NV = R('js/views/negotiation.js');
const PD = R('js/paperdesk.js');
/* a function's own text: one line where it closes on its own line, else to its closing brace at the margin */
const fnBody = (src, name) => {
  const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const line = src.slice(i, src.indexOf('\n', i));
  const bal = [...line].reduce((n, ch) => n + (ch === '{' ? 1 : ch === '}' ? -1 : 0), 0);
  return bal === 0 && /\}\s*$/.test(line) ? line : src.slice(i, src.indexOf('\n}', i) + 2);
};
const constLine = (src, name) => { const m = new RegExp('^const ' + name + ' = [^\\n]*$', 'm').exec(src); assert.ok(m, name + ' exists'); return m[0]; };

function stage(o = {}){
  const ctx = {
    i18t: (k, v) => k + (v ? '[' + Object.entries(v).map(([a, b]) => a + '=' + b).join(',') + ']' : ''),
    i18tn: (k, n) => k + ':' + n,
    _ne: x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    _nea: x => String(x == null ? '' : x).replace(/"/g, '&quot;'),
    window: {}, Date, isFinite, Set, Map,
  };
  ctx.window.currentUser = () => ({ name: o.me || 'Maria Lindgren' });
  ctx.window.deskLead = () => ({ name: 'Maria Lindgren' });
  ctx.window.deskSuggestion = ch => ch.suggested || null;
  ctx.window.negoRoundSince = c => c.negotiation && c.negotiation.roundAt;
  ctx.negoRoundSince = ctx.window.negoRoundSince;
  ctx.rlOnTheirPage = () => !!o.theirPage;
  ctx.rlLockSign = (c, id) => (o.lock && o.lock.clauseId === id ? o.lock : null);
  vm.createContext(ctx);
  const src = [
    ...['RL_EX_BEFORE', 'RL_EX_AFTER', 'RL_EX_MID', 'RL_EX_WHOLE', '_rlExWord'].map(n => constLine(NV, n)),
    ...['_rlExTokens', '_rlExHead', '_rlExTail', '_rlExMid', 'rlRowExcerptHtml', '_rlPlain', 'rlRowLineHtml', 'rlRowLockHtml',
      'rlRowIsMine', 'rlSuggestPileLabel', 'rlSettledAt', 'rlSettledPileLabel', 'rlLockedBtn'].map(n => fnBody(NV, n)),
  ].join('\n');
  vm.runInContext(src + '\nthis.__f = { rlRowExcerptHtml, rlRowLineHtml, rlRowLockHtml, rlSuggestPileLabel, rlSettledPileLabel, rlLockedBtn };', ctx);
  return ctx.__f;
}
const ops = (...xs) => xs.map(([op, text]) => ({ op, text }));

describe('f756 (1) the changed words, cut around the edit', () => {
  test('1a a few words before, the marks as two words, the rest of the sentence', () => {
    const f = stage();
    const h = f.rlRowExcerptHtml({ ops: ops(['keep', 'Each party\'s total liability under this Agreement in any contract year is capped at '], ['del', '50%'], ['ins', '100%'],
      ['keep', ' of the fees paid in that year. A second sentence that is not shown.']) });
    assert.equal(h, '<div class="rl-card-ex">… year is capped at <del>50%</del> <ins>100%</ins> of the fees paid in that year. …</div>');
  });
  test('1b nothing cut where nothing was cut; an untouched run between two marks is shortened in its middle', () => {
    const f = stage();
    assert.equal(f.rlRowExcerptHtml({ ops: ops(['keep', 'Pay within '], ['del', '30'], ['ins', '60'], ['keep', ' days.']) }),
      '<div class="rl-card-ex">Pay within <del>30</del> <ins>60</ins> days.</div>');
    const long = ' one two three four five six seven eight nine ten eleven twelve ';
    const h = f.rlRowExcerptHtml({ ops: ops(['keep', 'A '], ['del', 'x'], ['keep', long], ['ins', 'y'], ['keep', ' end.']) });
    assert.match(h, /<del>x<\/del> one two three … ten eleven twelve <ins>y<\/ins> end\./);
  });
  test('1c a whole clause added or struck: its first words; no ops: nothing, and the argument line stays', () => {
    const f = stage();
    assert.equal(f.rlRowExcerptHtml({ changeType: 'insertClause', newText: 'The Supplier keeps a register of every subcontractor it uses for this work and shares it.' }),
      '<div class="rl-card-ex"><ins>The Supplier keeps a register of every subcontractor it uses for this</ins> …</div>');
    assert.equal(f.rlRowExcerptHtml({ changeType: 'deleteClause', oldText: 'Short clause.' }), '<div class="rl-card-ex"><del>Short clause.</del></div>');
    assert.equal(f.rlRowExcerptHtml({ ops: ops(['keep', 'nothing marked']) }), '');
    assert.equal(f.rlRowLineHtml({}, '<div class="rl-card-sum">the argument</div>'), '<div class="rl-card-sum">the argument</div>');
  });
  test('1d in the argument line\'s slot, the argument on its hover; a stored op never rewritten', () => {
    const f = stage();
    const ch = { ops: ops(['keep', 'Pay within '], ['del', '30'], ['ins', '60'], ['keep', ' days.']) };
    const before = JSON.stringify(ch);
    const h = f.rlRowLineHtml(ch, '<div class="rl-card-sum">Step 1 · <b>theirs</b> · 30 → 60 days</div>', true);
    assert.match(h, /^<div class="rl-card-sum rl-card-ex" title="Step 1 · theirs · 30 → 60 days">/);
    assert.match(h, /<span class="rl-card-ex-tag">rk_from_scan<\/span><\/div>$/, 'a change from the scan still says so');
    assert.equal(JSON.stringify(ch), before, 'display only');
    assert.match(NV, /const why = rlRowWhyHtml\(ch\), lock = rlRowLockHtml\(c, ch, side\), line = rlRowLineHtml\(ch, sub, fromRiskRow\);/, 'the row draws it');
  });
});

describe('f756 (2) who holds the clause, on its row', () => {
  const lock = { clauseId: 'k11', name: 'Erik Sandberg', mono: 'ES', title: 'Erik Sandberg is editing', mayAsk: true };
  test('2a "Erik is editing this clause" with the paper\'s own Ask for it; Asked once asked', () => {
    const h = stage({ lock }).rlRowLockHtml({ id: 'MK' }, { clauseId: 'k11' }, 'owner');
    assert.match(h, /<b class="rl-lock-mono" aria-hidden="true">ES<\/b><span class="rl-card-lock-say">ng_row_lock_editing\[who=Erik\]<\/span>/);
    assert.match(h, /<button type="button" class="rl-card-lock-ask" data-rl-lock-ask="k11"/, 'the paper\'s own press');
    const asked = stage({ lock: { ...lock, mayAsk: false, asked: true, askedSay: 'Asked' } }).rlRowLockHtml({ id: 'MK' }, { clauseId: 'k11' }, 'owner');
    assert.match(asked, /<span class="rl-card-lock-asked"[^>]*>Asked<\/span>/);
    assert.ok(!/data-rl-lock-ask/.test(asked), 'asked once');
  });
  test('2b our seat only, and only on a held clause', () => {
    assert.equal(stage({ lock }).rlRowLockHtml({ id: 'MK' }, { clauseId: 'k11' }, 'counterparty'), '');
    assert.equal(stage({ lock, theirPage: true }).rlRowLockHtml({ id: 'MK' }, { clauseId: 'k11' }, 'owner'), '');
    assert.equal(stage({ lock }).rlRowLockHtml({ id: 'MK' }, { clauseId: 'k7' }, 'owner'), '');
  });
  test('2c the row\'s own verb beside it: grey and plain, no second monogram', () => {
    const f = stage();
    const plain = f.rlLockedBtn({ title: 't', mono: 'ES' }, 'rl-verb-ai', 'Counter', { mono: false });
    assert.match(plain, /class="rl-verb-ai is-locked" disabled/);
    assert.ok(!/rl-lock-mono/.test(plain));
    assert.match(f.rlLockedBtn({ title: 't', mono: 'ES' }, 'rl-verb-ai', 'Counter'), /rl-lock-mono/, 'elsewhere the monogram stays');
    assert.match(NV, /rlLockedBtn\(editLock, 'rl-edit rl-verb-ai', i18t\('ng_cp_copilot'\), \{ mono: side === 'counterparty' \}\)/, 'our row draws it plain; their seat keeps its monogram');
  });
});

describe('f756 (3) the piles\' names', () => {
  test('3a "Lina suggests", "Colleagues suggest", and on the author\'s seat whose turn it is', () => {
    const f = stage();
    assert.equal(f.rlSuggestPileLabel({}, [{ author: 'Lina Ek', suggested: { by: 'Lina Ek' } }]), 'ng_band_suggest_by[who=Lina]');
    assert.equal(f.rlSuggestPileLabel({}, [{ author: 'Lina Ek' }, { author: 'Erik Sandberg' }]), 'ng_band_suggest_many');
    assert.equal(stage({ me: 'Lina Ek' }).rlSuggestPileLabel({}, [{ author: 'Lina Ek', authorSide: 'owner' }]), 'ng_band_suggest_mine[who=Maria]');
  });
  test('3b "Settled in round 1", across rounds, or this round', () => {
    const f = stage();
    const c = n => ({ negotiation: { round: n, roundAt: '2026-10-13T00:00:00Z' } });
    const early = { resolvedAt: '2026-10-12T00:00:00Z' }, late = { resolvedAt: '2026-10-14T00:00:00Z' };
    assert.equal(f.rlSettledPileLabel(c(2), [early, early]), 'ng_band_settled_in[n=1]');
    assert.equal(f.rlSettledPileLabel(c(4), [early]), 'ng_band_settled_upto[n=3]');
    assert.equal(f.rlSettledPileLabel(c(2), [early, late]), 'ng_band_settled_upto[n=2]');
    assert.equal(f.rlSettledPileLabel(c(2), [late]), 'ng_band_accepted', 'all this round: the old name');
    assert.equal(f.rlSettledPileLabel(c(1), [early]), 'ng_band_accepted', 'round 1 has no earlier round');
  });
  test('3c a suggestion is its own pile, our seat only, between their answers and our drafts', () => {
    assert.match(NV, /const RL_CARD_BANDS = \['refused', 'awaiting', 'answered', 'suggest', 'drafts', 'review', 'held',\s*'with', 'accepted', 'withdrawn'\];/);
    assert.match(fnBody(NV, 'rlCardBand'), /if \(side !== 'counterparty' && c && rlIsOpenSuggestion\(c, ch\)\) return 'suggest';/);
    const sg = fnBody(NV, 'rlIsOpenSuggestion');
    assert.match(sg, /deskSuggestionOpen/, 'the desk\'s own reading of an open suggestion');
    assert.match(sg, /deskEnforced\(\)/, 'while the desk rule holds');
    assert.match(fnBody(NV, 'rlSuggestFaceHtml'), /data-dk-adopt=[\s\S]*data-dk-return=[\s\S]*data-rl-ladder=/, 'Adopt · Hand back · Ladder, the strip\'s own presses');
  });
});

describe('f756 (4) the column\'s head, and the face that hosts it', () => {
  test('4a the head in the drawing\'s order, every part an existing reading or door', () => {
    const col = fnBody(NV, 'rlColumnHtml');
    const order = ['rl-idx-title', 'rlHeadNotesHtml(c, opts)', 'rlHeadHereHtml(c, opts)', 'rlRoundLabelHtml(c, opts)', 'rlUnsentSendHtml(c, opts)', 'rlHeadReviewHtml(c, opts)'];
    const at = order.map(s => col.indexOf(s));
    assert.ok(at.every(i => i > 0), JSON.stringify(at));
    for (let i = 1; i < at.length; i++) assert.ok(at[i - 1] < at[i], order[i - 1] + ' before ' + order[i]);
    assert.match(col, /i18t\('ng_redlines_head_n', \{ n: openTotal \}\)/, '"Redlines N": the rows in sight');
    assert.match(fnBody(NV, 'rlHeadHereHtml'), /data-pz-slot="redlines"/, 'presence\'s own slot');
    assert.match(fnBody(NV, 'rlHeadReviewHtml'), /data-rl-review-go=/);
    assert.match(NV, /if \(c\) rlReviewDoor\(c, rlHeadRepaint\);/, 'the review\'s own door');
    assert.match(NV, /window\.openNotesPanel\(nb\.getAttribute\('data-rl-notes-all'\)\)/, 'the notes drawer');
  });
  test('4b "their asks came 4 days ago": the newest ask still on the table, read raw', () => {
    const lab = fnBody(NV, 'rlRoundLabelHtml');
    assert.match(lab, /x\.authorSide === 'counterparty' && !x\.withdrawn\s*&& \(x\.status === 'pending' \|\| x\.status === 'countered'\)/);
    assert.match(lab, /i18t\('ng_round_asks_came', \{ n: round, ago \}\)/);
  });
  test('4c the Redlines face passes no progress pile, no ‹ Jambo and no × of its own', () => {
    const o = fnBody(PD, 'pdRedOpts');
    assert.match(o, /cpPanel: false, noProgress: true/);
    assert.doesNotMatch(o, /headStart|headEnd/);
    assert.match(fnBody(NV, 'rlColumnHtml'), /opts\.noProgress/, 'the column honours it');
  });
});
