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
    assert.match(NV, /const why = rlRowWhyHtml\(ch\), keeps = rlRowKeepsHtml\(c, ch, side\), lock = rlRowLockHtml\(c, ch, side\), line = rlRowLineHtml\(ch, sub, fromRiskRow\);/, 'the row draws it');
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
    /* RE-POINTED 19 Oct 2026 (third pass): Ladder is the one verb builder
       every row shares, so it opens under its row on the face */
    assert.match(fnBody(NV, 'rlSuggestFaceHtml'), /data-dk-adopt=[\s\S]*data-dk-return=[\s\S]*rlLadderVerbHtml\(ch\)/, 'Adopt · Hand back · Ladder, the strip\'s own presses');
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
    /* RE-POINTED 18 Oct 2026 (round 9's gaps, second pass: "The notes open in
       the same panel"): Notes turns the column's body to the notes, and the
       same press turns it back */
    assert.match(NV, /rlFaceNotesSet\(_rlFnFor === String\(id\) \? null : id\);\s*rlHeadRepaint\(\);/, 'the notes open in the column');
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

/* ═══════════════════════════════════════════════════════════════════════════
   THE SECOND PASS (18 Oct 2026: the adversarial checker's differences against
   the picked drawing, round 9 "Piles" and its "E · Where Edit lands")
   (5) Notes opens the notes IN the column (rooms, ‹ Redlines, the line and
       the bubble, Write to Internal… with Post), the same press shuts them.
   (6) Inside a pile the paper's order; the clause named as the paper prints
       it; nothing under the settled fold beside Home's paper; no step chips on
       Home's paper; the count in a pill; the box asks for a number, a list or
       a contract beside Redlines (Ask about MK-… beside the letter).
   (7) Edit and Counter from a row land on the editor as drawn: ‹ Redlines,
       the act's title and their ask, the short shelf, the clause alone in its
       box with its step, the rail's three cards with the cost before the
       press, the foot walking their asks.
   AT b1ea174 (this lane's previous pass) and AT THE BASE every test here FAILS.
   The browser half: test/chromium/piles-second-pass-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const CE = R('js/views/clauseeditor.js');
const NCSS = R('js/views/negotiation-css.js');
const IGV = R('js/views/intelligence.js');
const RD = R('js/richdoc.js');
const CM = R('js/clausemodel.js');

describe('f756 (5) the notes open in the same panel', () => {
  test('5a the head\'s Notes turns the column\'s body to the notes, and the same press turns it back', () => {
    assert.match(fnBody(NV, 'rlFaceNotesOn'), /_rlFnFor && String\(c\.id\) === _rlFnFor && rlHeadOurs\(opts\)/, 'our seat, one contract, per sitting');
    assert.match(NV, /rlFaceNotesSet\(_rlFnFor === String\(id\) \? null : id\);\s*rlHeadRepaint\(\);/, 'press again and it closes');
    assert.match(NV, /closest\('\[data-rl-fn-back\]'\)\)\{ e\.preventDefault\(\); rlFaceNotesSet\(null\); rlHeadRepaint\(\); return; \}/, '‹ Redlines goes back');
    const head = fnBody(NV, 'rlHeadNotesHtml');
    assert.match(head, /aria-pressed="\$\{on \? 'true' : 'false'\}"/, 'pressed while open');
    assert.doesNotMatch(NV, /window\.openNotesPanel\(nb\.getAttribute\('data-rl-notes-all'\)\)/, 'not the drawer over the panel');
    const col = fnBody(NV, 'rlColumnHtml');
    assert.match(col, /const notesOn = rlFaceNotesOn\(c, opts\);/);
    assert.match(col, /\$\{notesOn \? rlFaceNotesHtml\(c, opts\) : ''\}/, 'drawn in the column\'s own scroller');
    assert.match(col, /<div id="rl-changes"\$\{notesOn \? ' hidden' : ''\}>/, 'the piles stay mounted, unseen');
    assert.match(PD, /function pdRedLand\(id\)\{[\s\S]{0,400}?rlFaceNotesSet\(null\)/, 'the face opens on its piles');
  });
  test('5b rooms as tabs (a lock on Internal, a count each), ‹ Redlines, the box and Post — the drawer\'s own readings and writers', () => {
    const fn = fnBody(NV, 'rlFaceNotesHtml');
    assert.match(fn, /negoNoteRoomList\(c, opts, side\)/, 'the one list of rooms');
    assert.match(fn, /rlNpRoomNow\(c, opts, side\)/, 'the room showing, the drawer\'s own state');
    assert.match(fn, /r\.external \? '' : RL_NP_LOCK/, 'a lock on Internal');
    assert.match(fn, /<b>\$\{byRoom\[r\.key\] \|\| 0\}<\/b>/, 'the count on each');
    assert.match(fn, /i18t\('ng_fn_internal'\)/, '"Internal"');
    assert.match(fn, /data-rl-fn-back[^>]*>‹ \$\{_ne\(i18t\('ng_fn_back'\)\)\}/, '‹ Redlines at the row\'s end');
    assert.match(fn, /rlChatThreads\(c, opts, room\)/, 'the threads, oldest first');
    assert.match(fn, /i18t\('ng_fn_ph', \{ room: roomName\(cur\) \}\)/, '"Write to Internal… type @ to name someone"');
    assert.match(fn, /rlNpTagMenuHtml\(c, room, opts\)/, 'the @ list');
    assert.match(fn, /data-rl-fn-post=[\s\S]*i18t\('ng_fn_post'\)/, 'Post');
    /* RE-POINTED 19 Oct 2026 (third pass): narrowed to one change (a row's
       "N notes"), Post files under that change; else as before */
    assert.match(NV, /rlNotesSend\(root, c, ch, \{ side: 'owner',[\s\S]{0,140}?\}, post\.getAttribute\('data-rl-fn-post'\)\)/, 'Post is the drawer\'s one send');
  });
  test('5c each note: the face, "Name · clause N · when", the bubble; the drawer\'s own presses under it', () => {
    const fn = fnBody(NV, 'rlFaceNoteHtml');
    assert.match(fn, /class="rl-fn-face"/);
    assert.match(fn, /data-rl-fn-clause="\$\{_nea\(cl\.id\)\}"/, 'the clause is a link');
    assert.match(fn, /rlAgoWords\(m\.at\)/, 'when, in words');
    assert.match(fn, /class="rl-fn-say"/, 'the words in a bubble');
    assert.match(fn, /rlNpNoteHtml\(m, room, side, '', \{ \.\.\.\(ctx \|\| \{\}\), actsOnly: true \}\)/, 'the verbs are the drawer\'s own');
    assert.match(NV, /if \(ctx && ctx\.actsOnly\) return acts;/);
    assert.match(fnBody(NV, 'rlFaceNoteClause'), /i18t\('ng_fn_clause', \{ n: num \}\)/, '"clause 11"');
    /* RE-POINTED 19 Oct 2026 (LAND ON IT, main's rule): the link lands on the
       clause through the one lander */
    assert.match(NV, /closest\('\[data-rl-fn-clause\]'\);\s*if \(go\)\{ e\.preventDefault\(\); rlLandOnClause\(go\.getAttribute\('data-rl-fn-clause'\)\);/, 'the link goes to the clause on the paper');
    assert.match(fnBody(NV, 'negoAfterPaint'), /rlPaintNoteMarks[\s\S]*rlFaceNotesWire\(host, c, opts \|\| \{\}\)/, 'wired after every paint, the marks first');
  });
});

describe('f756 (6) the column and the paper as drawn', () => {
  test('6a inside a pile, the paper\'s order: rlClauseOrderOf reads the stored baseline (RAW), a new clause after the one it follows', () => {
    const ctx = { window: {}, Map, String };
    ctx.window.clauseSegment = () => [{ clauseId: 'a' }, { clauseId: 'b' }, { clauseId: 'c' }];
    ctx.clauseSegment = ctx.window.clauseSegment;
    vm.createContext(ctx);
    vm.runInContext(fnBody(NV, 'rlClauseOrderOf') + '\n' + fnBody(NV, 'rlCardClausePos'), ctx);
    const pos = ctx.rlClauseOrderOf({ negotiation: { baselineBody: '<p>x</p>' } });
    assert.equal(pos.get('c'), 2);
    assert.equal(ctx.rlClauseOrderOf({}).size, 0, 'no negotiation, nothing initialised');
    assert.equal(ctx.rlCardClausePos({ clauseId: 'b' }, pos), 1);
    assert.equal(ctx.rlCardClausePos({ clauseId: 'new', afterClauseId: 'a' }, pos), 0.5);
    assert.equal(ctx.rlCardClausePos({ clauseId: 'zz' }, pos), 1e9);
    assert.match(fnBody(NV, 'rlCardSort'), /ranked\.sort\(\(a, b\) => \(at\(a\) - at\(b\)\) \|\| \(where\(a\) - where\(b\)\)\)/, 'the pile first, then the paper\'s order');
    assert.doesNotMatch(fnBody(NV, 'rlClauseOrderOf'), /negoClauseList|negoInit/, 'reading never writes');
  });
  test('6b the clause named as the paper prints it: "7. Liability cap", a shouting title in sentence case', () => {
    const g = { }; g.window = g; vm.createContext(g); vm.runInContext(CM.replace(/^export .*$/gm, ''), g);
    assert.equal(g.clauseNameAsDrafted('Clause 7 · Liability cap'), '7. Liability cap');
    assert.equal(g.clauseNameAsDrafted('Clause 11 · Payment terms'), '11. Payment terms');
    assert.equal(g.clauseNameAsDrafted('Clause 3 · SUPPLY & SPECIFICATION'), '3. Supply & specification');
    assert.equal(g.clauseNameAsDrafted('Clause 3 · quality & rejection'), '3. Quality & rejection', 'never opens in small letters');
    assert.equal(g.clauseNameAsDrafted('Clause 9 · Data Protection Act'), '9. Data Protection Act', 'never re-cased otherwise');
    assert.equal(g.clauseNameShown('Clause 7 · Liability cap'), '7. Liability Cap', 'every other screen keeps its voice');
    assert.match(fnBody(NV, 'rlRowClauseName'), /clauseNameAsDrafted\(raw\)/);
    assert.match(NV, /const who = _ne\(rlRowClauseName\(ch\)\);/, 'the row reads it');
  });
  test('6c beside Home\'s paper: no progress pile, the risk cards stay (owner, 19 Oct 2026); no step chips on Home\'s paper', () => {
    assert.match(fnBody(PD, 'pdRedOpts'), /noProgress: true/);
    assert.doesNotMatch(fnBody(PD, 'pdRedOpts'), /noRisks: true/, 'RE-POINTED 19 Oct 2026: the owner asked the risk cards back under the piles');
    assert.match(fnBody(NV, 'rlColumnHtml'), /\(!opts\.noRisks && !notesOn && typeof window\.rlRisksPileHtml === 'function'\)/);
    /* RE-POINTED 19 Oct 2026 (main's "NOTHING OF THE LADDER ON THE PAPER"):
       the chip itself draws only a pinned rung's reading with its way back,
       and the ladder beside Home's paper (the editor's rail, no verbs) offers
       no "Read as it stood" — so no step chip can reach Home's paper, and the
       round-9 switch that hid it (noRungs) is gone, never a second guard. */
    assert.match(fnBody(NV, 'redlineDocHtml'), /const pillFor = cl => rlLadderChipHtml\(c, cl, side, \{ pill: opts\.pill \}\)/);
    assert.match(fnBody(NV, 'rlLadderChipHtml'), /const at = rlReadMode\(\) === 'marks' \? rlReadAtRung\(c, id\) : null;\s*if \(!at\) return '';/);
    assert.match(fnBody(NV, 'rlFaceLadderHtml'), /rlLadderSectionHtml\(c, \{ clauseId: String\(ch\.clauseId\) \}, side, \{ editor: true \}\)/);
    assert.match(fnBody(NV, 'rlLadderSectionHtml'), /if \(!inEditor\) acts\.push\(/, 'the editor\'s ladder pins no rung');
    assert.doesNotMatch(NV + IGV, /noRungs/, 'no second guard');
  });
  test('6d "Redlines 4" in a grey pill; the box asks as drawn beside Redlines, and keeps "Ask about MK-…" beside the letter', () => {
    assert.match(NCSS, /\.redline-page \.rl-idx-title i\{display:inline-grid;[^}]*border-radius:9px;background:var\(--color-neutral-100\)/);
    assert.match(fnBody(IGV, 'igAskPlaceholder'), /if\(window\.pdRedShows&&pdRedShows\(\)&&!\(window\.pdSendShows&&pdSendShows\(\)\)\) return i18t\('hb_ask_ph'\);/);
  });
});

describe('f756 (7) where Edit lands from a row, as drawn', () => {
  test('7a a row\'s Counter or Edit says it came from a row; the editor dresses itself for it, our seat with Jambo only', () => {
    assert.match(NV, /\{ changeId: btn\.getAttribute\('data-rl-cp-editor-change'\) \|\| '', fromRow: !!btn\.closest\('\[data-nego-card\]'\) \}/);
    assert.match(CE, /const ceRowMode = \(\) => !!\(_ceOpts && _ceOpts\.fromRow\) && ceSide\(\) === 'owner' && !ceNoAi\(\);/);
    assert.match(CE, /page\.classList\.toggle\('ce-rowmode', ceRowMode\(\)\);/);
  });
  test('7b the head: ‹ Redlines (the page\'s own guarded way out, landing on the row), "Counter · 7. Liability cap", "Nordvik asks 100% · back lands on the same row", the short shelf, Exit', () => {
    const head = fnBody(CE, 'ceRowHeadPaint');
    /* RE-POINTED 19 Oct 2026 (owner: "bring this back to what it was before",
       "‹ Redlines at the top left"): ‹ Redlines alone leads the full shelf,
       the act's title rides its hover */
    /* RE-POINTED AGAIN 20 Oct 2026 (owner: "the way you get back … is not the
       same"): the panel trail's look — the back, then "Jambo / Redlines /
       <act · clause>", on its own row above the full shelf */
    assert.match(head, /class="ce-rowback" data-ce-act="row-back"[^>]*><svg[\s\S]*?<\/svg>\$\{_cee\(_cet\('ce_row_back'\)\)\}<\/button>/);
    assert.match(head, /<span class="ce-rowpath"/);
    assert.match(head, /<b>\$\{_cee\(ceRowTitle\(\)\)\}<\/b>/);
    assert.match(CE, /#clause-editor\.ce-rowmode \.ce-rowhead\{display:flex;[^}]*flex:1 0 100%/, 'its own row');
    assert.match(fnBody(CE, 'ceRowTitle'), /_cet\(theirs \? 'ce_row_counter' : 'ce_row_edit', \{ clause \}\)/);
    assert.match(fnBody(CE, 'ceRowTitle'), /clauseNameAsDrafted\(raw\)/, 'as the paper prints it');
    assert.match(fnBody(CE, 'ceRowSub'), /shareFigureOf\(/, 'their figure, the letter\'s own reading');
    assert.match(fnBody(CE, 'ceRowSub'), /_cet\('ce_row_lands'\)/);
    assert.match(fnBody(CE, 'ceRowBack'), /ceLeaveGuard\(\(\) => \{[\s\S]*rlCloseClauseEditor\(\{ repaint: true \}\);[\s\S]*rlLinkFocus\(c, id, 'card'\)/);
    assert.match(CE, /host\.innerHTML = richBarHtml\(\{ shelf: 'full', size: ceSizeNow\(\) \}\);/, 'the full shelf, as before');
    const ctx = { window: {} }; vm.createContext(ctx);
    const tools = /const RICH_BAR_TOOLS = \[[\s\S]*?\];/.exec(RD)[0];
    vm.runInContext(tools + '\n' + /const RICH_BAR_REDLINE = [^\n]*/.exec(RD)[0] + '\nconst RICH_BAR_ICON = new Proxy({}, { get: () => "<svg/>" });\nconst _rbT = k => k; const _rbA = s => String(s);\n'
      + fnBody(RD, 'richBarHtml').replace(/^function richBarHtml/, 'function richBarHtml'), ctx);
    const keys = [...ctx.richBarHtml({ shelf: 'redline' }).matchAll(/data-rb="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(keys, ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList', 'outdent', 'indent'], 'B I U • 1. ⇤ ⇥');
  });
  /* RE-POINTED 20 Oct 2026 (owner: "the paper that appears in the edit page
     is not the whole contract" … "bring the old one back"): from a row the
     WHOLE paper stays, the clause boxed with what its wording is; the rail is
     the editor's own (head, picker, ladder card, chips), the foot's draft
     time and Undo stay; round 9's cards are kept, not drawn */
  test('7c the paper: the whole paper, the clause in its box with what it is', () => {
    const dress = fnBody(CE, 'ceRowPaperDress');
    assert.doesNotMatch(dress, /ce-row-off|ceRowContextLine/);
    assert.match(dress, /all\.forEach\(\(el, i\) => el\.classList\.toggle\('ce-row-on', i === at\)\);/);
    assert.match(dress, /_cet\(ceRowIsCounter\(\) \? 'ce_row_is_counter' : 'ce_row_is_draft'\)/);
    assert.ok(!/function ceRowStep\(/.test(CE), 'the ladder step reading is gone from the editor');
    assert.doesNotMatch(CE, /ce-rowmode #ce-doc \.ce-row-off|ce-rowmode #ce-readbar|ce-rowmode \.ce-foot \.draft/);
    assert.doesNotMatch(CE, /ce-row-on #ce-clausebody\{border/, 'no blue box round the clause (owner, 20 Oct 2026)');
  });
  test('7d the rail as before: the ladder card leads, chips back, no row cards; the Risks tab always drawn from a row', () => {
    assert.match(fnBody(CE, 'ceRisksOn'), /if \(ceRowMode\(\)\) return true;/, 'the Risks tab always drawn from a row');
    const lane = fnBody(CE, 'ceRenderLane');
    assert.doesNotMatch(lane, /ceRowCardsHtml\(\)/);
    assert.match(lane, /lane\.innerHTML = \(_cePrep \? '' : ceLadderCardHtml\(\)\) \+ _ceThread\.map\(ceTurnHtml\)/);
    assert.doesNotMatch(CE, /const sc = ceRowStdCard\(\)/, 'no standard\'s card pushed at the open');
    assert.doesNotMatch(CE, /ce-rowmode \.ce-ah \.sp\{display:none\}|ce-rowmode #ce-pick\{display:none\}/);
  });
  test('7e the foot walks their asks: "‹ 1 of 2 of their asks ›" and Save; a held clause is said, the page stays', () => {
    const walk = fnBody(CE, 'ceWalkNow');
    assert.match(walk, /if \(ceRowMode\(\)\)\{\s*const asks = ceRowAsks\(\);/);
    assert.match(fnBody(CE, 'ceRenderFoot'), /w\.asks \? \(w\.k \? _cet\('ce_walk_asks_of', \{ k: w\.k, n: w\.n \}\)/);
    assert.match(fnBody(CE, 'ceRowAsks'), /x\.authorSide === 'counterparty' && !x\.withdrawn && x\.status === 'pending'/);
    assert.match(fnBody(CE, 'ceRowGo'), /clauseLockHeldByOther\(_ceC, a\.clauseId\)[\s\S]*ceSay\(why\)/);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   THE THIRD PASS (19 Oct 2026): the adversarial checker's differences on the
   face, the paper and the editor — fitted to main's newer rules (LAND ON IT;
   nothing of the ladder on the paper or in the editor).
   AT THE PARENT (d47fadb, the merge of main) and AT THE BASE every test here
   FAILS. The browser half: test/chromium/redlines-third-pass-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const CSSN = R('js/views/negotiation-css.js');
const PZ = R('js/presence.js');
const RVJ = R('js/review.js');
function stage8(extra = {}){
  const ctx = { window: {}, JSON, String, Set, Map, Array, Object, Number, Promise,
    i18t: (k, v) => k + (v ? '[' + Object.entries(v).map(([a, b]) => a + '=' + b).join(',') + ']' : ''),
    i18tn: (k, n) => k + ':' + n,
    _ne: x => String(x == null ? '' : x), _nea: x => String(x == null ? '' : x), ...extra };
  vm.createContext(ctx);
  return ctx;
}
describe('f756 (8) the third pass: the face as drawn', () => {
  test('8a Ladder opens the clause\'s ladder UNDER ITS ROW on the face, one row at a time, and the same press folds it', () => {
    const ctx = stage8({ rlLadderSectionHtml: (c, cl, side, o) => `[ladder ${cl.clauseId} ${o && o.editor ? 'reading' : 'acts'}]`,
      rlPlaybookSecHtml: (c, id) => `[playbook ${id}]` });
    vm.runInContext(['let _rlFaceLad = null;', fnBody(NV, 'rlFaceLadderOpen'), fnBody(NV, 'rlFaceLadderSet'), fnBody(NV, 'rlFaceLadderHtml'), fnBody(NV, 'rlLadderVerbHtml')].join('\n'), ctx);
    const c = { id: 'MK-1' }, ch = { id: 'CHG-1', clauseId: 'cl_7' }, other = { id: 'CHG-2', clauseId: 'cl_11' };
    const face = { hostId: 'pd-redface' };
    assert.equal(ctx.rlFaceLadderHtml(c, ch, 'owner', face), '', 'shut at rest');
    assert.match(ctx.rlLadderVerbHtml(ch), /data-rl-ladder="cl_7" data-rl-ladder-ch="CHG-1"\s+aria-expanded="false"/);
    ctx.rlFaceLadderSet('CHG-1');
    assert.equal(ctx.rlFaceLadderHtml(c, ch, 'owner', face), '<div class="rl-row-ladder" data-rl-row-ladder="CHG-1">[ladder cl_7 reading][playbook cl_7]</div>',
      'the clause panel\'s own sections, the steps as a reading (the row carries the verbs), our standard and fallback');
    assert.equal(ctx.rlFaceLadderHtml(c, other, 'owner', face), '', 'one row at a time');
    assert.equal(ctx.rlFaceLadderHtml(c, ch, 'owner', { hostId: 'nego-root' }), '', 'the page keeps its clause panel');
    assert.equal(ctx.rlFaceLadderHtml(c, ch, 'counterparty', face), '', 'our seat only');
    assert.match(ctx.rlLadderVerbHtml(ch), /aria-expanded="true"/);
    const h = NV.slice(NV.indexOf("const lad = t.closest('[data-rl-ladder]');"), NV.indexOf('const lscope = lad.closest'));
    assert.match(h, /lad\.closest\('#pd-redface'\) \? lad\.getAttribute\('data-rl-ladder-ch'\) : null/);
    assert.match(h, /rlFaceLadderSet\(rlFaceLadderOpen\(\) === faceRow \? null : faceRow\);[\s\S]*pdRedRepaint\(\)/, 'the same press folds it');
    assert.match(NV, /\$\{rowStrips \? `<div class="rl-card-actions">\$\{deaden\(rowStrips\)\}<\/div>` : ''\}\s*\$\{rlFaceLadderHtml\(c, ch, side, opts\)\}\s*<\/article>/, 'drawn under the row');
    for (const f of ['pdRedLand', 'pdRedClose']) assert.match(fnBody(PD, f), /rlFaceLadderSet\(null\)/, f + ' lets it go');
  });
  test('8b a row\'s "N notes" opens THAT change\'s notes in the same panel, on the room that holds them; Post files under it', () => {
    const notes = { internal: [{ id: 'n1' }], 'p:nordvik': [{ id: 'n2' }] };
    const ctx = stage8({ negoNoteRoomList: () => [{ key: 'internal' }, { key: 'p:nordvik', external: true }],
      rlNpRoomNow: () => 'internal', negoRoomNotes: (c, ch, k) => (ch && ch.id === 'CHG-1' ? [] : []).concat(ch && ch.id === 'CHG-2' && k === 'p:nordvik' ? notes[k] : []) });
    vm.runInContext(['let _rlFnFor = null;', 'let _rlFnChange = null;', fnBody(NV, 'rlFaceNotesSet'), fnBody(NV, 'rlFaceNotesChange'), fnBody(NV, 'rlFaceNotesRoomFor')].join('\n'), ctx);
    ctx.rlFaceNotesSet('MK-1', 'CHG-2');
    assert.equal(ctx.rlFaceNotesChange(), 'CHG-2');
    assert.equal(ctx.rlFaceNotesRoomFor({}, { id: 'CHG-2' }), 'p:nordvik', 'the room showing holds none of them: the first room that does');
    assert.equal(ctx.rlFaceNotesRoomFor({}, { id: 'CHG-1' }), 'internal', 'none anywhere: the room showing');
    ctx.rlFaceNotesSet(null); assert.equal(ctx.rlFaceNotesChange(), null, 'closing lets the narrowing go');
    const fn = fnBody(NV, 'rlFaceNotesHtml');
    assert.match(fn, /const mine = x => !only \|\| \(x\.ch && String\(x\.ch\.id\) === String\(only\.id\)\);/);
    assert.match(fn, /rlChatRows\(c, opts\)\.filter\(mine\)/, 'the rooms count that change\'s notes');
    assert.match(fn, /rlChatThreads\(c, opts, room\)\.filter\(mine\)/, 'the list is that change\'s');
    assert.match(fn, /data-rl-fn-change="/);
    assert.match(fn, /data-rl-fn-all>\$\{_ne\(i18t\('ng_fn_all'\)\)\}/, 'and the way to every note');
    assert.match(NV, /if \(t\.closest\('\[data-rl-fn-all\]'\)\)\{ e\.preventDefault\(\); rlFaceNotesSet\(_rlFnFor, null\);/);
    assert.match(NV, /const ch = onCh && Array\.isArray\(c\.changes\)[\s\S]{0,120}\n\s*Promise\.resolve\(rlNotesSend\(root, c, ch,/, 'Post files under the change');
    const w = fnBody(PD, 'pdRedWire');
    assert.match(w, /rlFaceNotesSet\(c\.id, ch\.id\)/);
    assert.match(w, /if \(again\) rlFaceNotesSet\(null\);/, 'pressed again on the same row, the piles come back');
  });
  test('8c Discard last asks first on BOTH seats (owner decision D3, 9 Oct 2026; kept on 19 Oct 2026: "Keep asking first")', () => {
    const h = NV.slice(NV.indexOf("host.querySelectorAll('[data-rl-retract]')"), NV.indexOf('/* ---------- ONE SIDEBAR, TWO MODES'));
    assert.match(h, /if \(window\.confirmDialog && !\(await confirmDialog\(\{ danger: true,/, 'every seat is asked before a draft goes');
    assert.doesNotMatch(h, /side === 'counterparty' && window\.confirmDialog/, 'not their seat only');
    assert.doesNotMatch(NV, /rlDiscardUndo|rlDiscardSnap|RL_DISCARD_UNDO_MS/, 'no Undo in place of the question');
  });
  test('8d every live verb on a pile wears the accent ink; Reject and Discard last stay red', () => {
    assert.match(CSSN, /\.redline-page \.rl-pile \.rl-card-d \.rl-card-verbs button\.rl-verb-ai,\s*html\.dark \.redline-page \.rl-pile \.rl-card-d \.rl-card-verbs button\.rl-verb-ai,\s*\.redline-page \.rl-pile \.rl-card-d \.rl-card-face \[data-rl-ladder\],\s*\.redline-page \.rl-pile \.rl-card-d \.rl-card-face \[data-rl-ask-review\],\s*\.redline-page \.rl-pile \.rl-card-d \.rl-card-face \.rl-sg-back\{color:var\(--accent-ink\)\}/);
    assert.match(CSSN, /\.redline-page \.rl-card-d \.rl-card-face \.rl-rej,\s*\.redline-page \.rl-card-d \.rl-card-face \[data-rl-retract\]\{color:var\(--st-ruby-fg\)\}/);
    const at = CSSN.indexOf('.redline-page .rl-pile .rl-card-d .rl-card-verbs button.rl-verb-ai,');
    const dead = CSSN.indexOf('.redline-page .rl-pile .rl-card-d .rl-card-verbs button.is-locked,');
    assert.ok(at > 0 && dead > at, 'a dead door keeps the label shade in the piles too, later in the sheet at the same weight');
  });
  test('8e "Here now": filled circles, one colour per person (the house\'s avatar tone), overlapping, white initials', () => {
    assert.match(PZ, /const tone = r => \(typeof window\.regAvatarTone === 'function'\) \? window\.regAvatarTone\(r\.name \|\| r\.id \|\| ''\) : 0;/);
    assert.match(R('js/views/register.js'), /negoBandTabsHtml,regAvatarHtml,regAvatarTone,/, 'the tone reading is published once');
    assert.match(CSSN, /\.redline-page \.rl-head-here \.pz-face\{width:22px;height:22px;font-size:9\.5px;[^}]*color:#fff;\s*border:2px solid var\(--color-surface\);margin-left:-6px;/);
    for (let t = 1; t <= 4; t++) assert.match(CSSN, new RegExp('\\.rl-head-here \\.pz-face\\.pz-t-' + t + '\\{background:'), 'tone ' + t);
  });
  test('8f a colleague\'s suggestion is marked on the paper with a dashed underline, apart from our draft', () => {
    assert.match(NV, /const sgCls = \(side !== 'counterparty' && rlIsOpenSuggestion\(c, ch\)\) \? ' rl-sg-marks' : '';/);
    assert.match(NV, /<div class="nego-body\$\{sgCls\}">\$\{redlineOpsBlocksHtml\(ops, \{ title: tip, who: whoM, shape \}\)\}/);
    assert.match(CSSN, /\.rl-doc \.rl-sg-marks ins\.rl-us,\.nego-doc \.rl-sg-marks ins\.rl-us\{background:transparent;text-decoration-style:dashed;/);
  });
  test('8g "their asks came …" only while the move is ours; once our answer went, the round\'s own day', () => {
    const ctx = stage8({ rlAgoWords: () => '4 days ago', negoRoundSince: c => c.negotiation.roundAt });
    ctx.window.negoRoundSince = ctx.negoRoundSince; ctx.window.langLocale = () => 'en-GB';
    vm.runInContext(fnBody(NV, 'rlRoundLabelHtml'), ctx);
    const theirs = { authorSide: 'counterparty', status: 'countered', createdAt: '2026-10-15T09:00:00Z' };
    const ours = ctx.rlRoundLabelHtml({ negotiation: { round: 2, turn: 'owner', roundAt: '2026-10-14T09:00:00Z' }, changes: [theirs] }, {});
    assert.match(ours, /ng_round_asks_came\[n=2,ago=4 days ago\]/, 'our move: when their asks came');
    const sent = ctx.rlRoundLabelHtml({ negotiation: { round: 3, turn: 'counterparty', roundAt: '2026-10-19T09:00:00Z' }, changes: [theirs] }, {});
    assert.match(sent, /ng_round_since\[n=3,day=/, 'with them: the round\'s own day, no "asks came"');
  });
  test('8h no review banner over the head on the face: the "Out for review" pile carries Remind (each row its Cancel)', () => {
    assert.match(fnBody(PD, 'pdRedOpts'), /waitingInPile: true/);
    assert.match(RVJ, /for \(const rv of \(opts\.waitingInPile \? \[\] : st\.waiting\)\)\{/, 'the banner skips what is out with a colleague there');
    const ctx = stage8();
    const rv = { id: 'REV-2', reviewer: { name: 'Sara Nyström' } };
    ctx.window.reviewOpenFor = () => rv; ctx.reviewOpenFor = ctx.window.reviewOpenFor;
    ctx.window.reviewMayCancel = () => true; ctx.reviewMayCancel = ctx.window.reviewMayCancel;
    ctx.window.reviewMaySee = () => true; ctx.reviewMaySee = ctx.window.reviewMaySee;
    vm.runInContext(fnBody(NV, 'rlReviewPileActsHtml'), ctx);
    const h = ctx.rlReviewPileActsHtml({}, [{ id: 'CHG-12' }, { id: 'CHG-13' }], { waitingInPile: true });
    assert.equal(h, '<span class="rl-band-acts"><button type="button" class="rl-band-act" data-rv-act="rv-remind:REV-2">ng_pile_remind_who[who=Sara]</button></span>',
      'one Remind per review, named where the review lets this reader see, the review\'s own handler');
    assert.equal(ctx.rlReviewPileActsHtml({}, [{ id: 'CHG-12' }], {}), '', 'the page keeps its banner');
    ctx.window.reviewMaySee = () => false; ctx.reviewMaySee = ctx.window.reviewMaySee;
    assert.match(ctx.rlReviewPileActsHtml({}, [{ id: 'CHG-12' }], { waitingInPile: true }), />rv_remind_btn</, 'unnamed where the wall says so');
    assert.match(NV, /<b>\$\{n\}<\/b>\$\{b === 'review' \? rlReviewPileActsHtml\(c, inBand\(\), opts\) : ''\}<\/div>/);
  });
  test('8i the pile with the other side is named for the party: "With Nordvik Logistik AB"', () => {
    assert.match(NV, /const named = side === 'counterparty' \|\| \(!many && !!String\(c\.counterparty \|\| ''\)\.trim\(\)\);/);
    assert.match(NV, /\? i18t\(named \? 'ng_band_with_named' : 'ng_band_with', \{ who: otherSide \}\)/);
  });
  /* RE-POINTED 19 Oct 2026 (owner): the strip as it was before, from a row
     too — no bar spanning the window, no Exit; ‹ Redlines is the way out,
     and Esc presses it */
  test('8j the editor from a row: the strip as before, no Exit, Esc is ‹ Redlines, no step number', () => {
    assert.doesNotMatch(CE, /#clause-editor\.ce-rowmode \.ce-grid\{padding-top:45px\}/);
    assert.doesNotMatch(CE, /#clause-editor\.ce-rowmode #ce-head\{position:absolute/);
    assert.match(CE, /#clause-editor\.ce-rowmode \.ce-exit\{display:none\}/);
    assert.match(CE, /if \(ceRowMode\(\)\)\{ ceRowBack\(\); return; \}/);
    assert.ok(!/ce-row-step|function ceRowStep\(/.test(CE.replace(/ceRowStep STALE/, '')), 'no step chip in the editor');
  });
  test('8k the doors this lane added land through the one lander (LAND ON IT)', () => {
    assert.match(fnBody(NV, 'rlLandOnClause'), /window\.landOn\(\(\) => rlClauseEl\(clauseId\), \{ block: 'center', focus: false, \.\.\.opts \}\)/);
    assert.match(fnBody(NV, 'rlClauseEl'), /getElementById\('ig-paper'\)/, 'Home\'s paper first');
    assert.match(fnBody(NV, 'rlLandOnRow'), /#pd-redface \[data-nego-card="\$\{q\}"\]/);
    assert.match(fnBody(CE, 'ceRowBack'), /rlLandOnRow\(id, \{ delay: 80 \}\)/, '‹ Redlines lands on the same row');
    assert.match(NV, /if \(go\)\{ e\.preventDefault\(\); rlLandOnClause\(go\.getAttribute\('data-rl-fn-clause'\)\); return; \}/, 'a note\'s clause link');
  });
});
