/* f328 — A REFUSAL, A COUNT, A SPINNER AND A DATE
   ============================================================
   Four reports off two screenshots, 17 September 2026.

   1 · *"The copilot error reason code is filling into the box where the
     drafted clause sits and when you apply it applies in the contract."*
     Section 3 of a Transportation Management template read "Without seeing
     HaTi's own standard wording … I risk drafting something that …" — a
     refusal, drawn as wording and written into the template.

   2 · *"What if the counterparty accepts one change and declines another
     change in the same clause. What appears on the highlighted green area?"*
     — over a clause heading badged `SETTLED · R1 ACCEPTED`. Nothing honest
     could appear, and the owner's own answer is the fix: *"make it a count,
     not a verdict: '3 changes · 2 agreed · 1 refused'. A count can't be
     wrong."*

   3 · *"when the copilot is reading, make the highlight features active or
     spinning so someone knows something is happening."*

   4 · *"clean up the NaN.NaN.NaN bug"* — the What Copilot read table's WHEN
     column on the risk scan's row.

   Run: node --test test/f328-a-refusal-a-count-a-spinner-and-a-date.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = f => { try{ return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); }
  catch(_){ return ''; } };
/* Comments come off first: every file below explains the doors it must never
   use, and an un-stripped grep finds the warning and reports it as the fault. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const AI_SRC = read('js/ai.js');
const TB = read('js/views/templatebuilder.js');
const TB_CODE = strip(TB);
const LADDER = read('js/ladder.js');
const CONTRACT = read('js/views/contract.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');

/* A function's own braces, never a byte count — this file's own subject on
   two of its four items, and the rule CLAUDE.md states twice. */
const fnBody = (src, name) => {
  const m = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return '';
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

/* ---- THE GUARD, LIFTED WITHOUT LOADING THE MODULE ----
   js/ai.js wires the page at load, so the patterns are read out of the source
   between two named anchors and evaluated on their own. They are the file's
   own characters, not a copy. */
const guard = (() => {
  const a = AI_SRC.indexOf('const AI_NOT_WORDING');
  const b = AI_SRC.indexOf('function aiSplitDisclaimer');
  if (a < 0 || b < a) return null;
  try {
    return new Function(AI_SRC.slice(a, b).replace(/\bi18t\(/g, 'String(')
      + '; return { aiLooksConversational, AI_MODEL_VOICE, AI_MODEL_INSTRUMENT };')();
  } catch (_) { return null; }
})();

const REPORTED = "Without seeing HaTi's own standard wording or understanding the specific "
  + "service categories you contract for, I risk drafting something that either doesn't "
  + "match your market practice or overstates commitments.";

/* ============================================================ */
describe('f328 (1) the reported refusal is not wording', () => {
  test('the guard is on this stage at all', () => {
    assert.ok(guard && typeof guard.aiLooksConversational === 'function',
      'the patterns were lifted — every claim below is vacuous without them');
  });
  test('the sentence the owner sent back is caught', () => {
    assert.equal(guard.aiLooksConversational(REPORTED), true,
      '"I risk drafting" — the twelfth verb, after a list that named eleven');
  });
  test('and it is caught by the VOICE, not by some other pattern', () => {
    assert.equal(guard.AI_MODEL_VOICE.test(REPORTED), true);
  });
  test('the verb list is inverted — what a CONTRACT says after "I" is the exempt list', () => {
    assert.ok(guard.AI_MODEL_INSTRUMENT, 'the exempt list is its own published name');
    for (const v of ['hereby', 'agree', 'acknowledge', 'covenant', 'warrant',
      'certify', 'appoint', 'guarantee', 'waive', 'indemnify'])
      assert.ok(new RegExp('(^|\\|)' + v + '(\\||$)').test(guard.AI_MODEL_INSTRUMENT),
        v + ' is a contract verb and must stay exempt');
  });
  test('so real first-person instrument wording still reaches the card', () => {
    for (const s of [
      'I hereby appoint the Attorney to act on my behalf.',
      'I, the undersigned, hereby certify that the statements above are true.',
      'I agree to be bound by the terms of this Agreement.',
      'I irrevocably guarantee payment of all sums due under this Guarantee.',
      'I acknowledge receipt of the Confidential Information.',
      'I waive any right of set-off in respect of such sums.',
    ]) assert.equal(guard.aiLooksConversational(s), false, s);
  });
  test('and the roman numeral is still a roman numeral', () => {
    assert.equal(guard.aiLooksConversational('Article I can be amended only in writing.'), false);
  });
  test('"and I or" is an OCR slash, not anybody speaking', () => {
    assert.equal(guard.aiLooksConversational(
      'the Company and I or the Affiliated Companies may suffer loss.'), false,
      '"and/or" with the slash read as a capital I — three of them in the corpus');
  });
  test('every phrasing the old list named is still caught', () => {
    for (const s of ['I cannot draft this from what you have shown me.',
      "I'm not able to propose wording for that clause.",
      'The contract text I received is truncated.',
      'I would suggest a shorter notice period here.',
      'I need the passage before I can draft anything.'])
      assert.equal(guard.aiLooksConversational(s), true, s);
  });
});

/* ============================================================ */
describe('f328 (2) the builder is a second wall, not a second reading', () => {
  test('tbCardWording is one reading with two askers', () => {
    const b = fnBody(TB, 'tbCardWording');
    assert.ok(b, 'the reading exists');
    assert.match(b, /aiLooksConversational/, 'it asks the product’s own guard');
    /* A stage without that module answers "wording", which is how this page
       behaved before the wall — a net that turned the page off would be worse
       than the fault. */
    assert.match(b, /typeof aiLooksConversational === 'function'/,
      'and a stage without it keeps the old behaviour');
    const askers = (TB_CODE.match(/tbCardWording\(/g) || []).length;
    assert.ok(askers >= 3, `the card, the press and the definition (${askers})`);
  });
  test('the press refuses, in words, and writes nothing', () => {
    const b = fnBody(TB, 'tbAccept');
    assert.ok(b.indexOf('tbCardWording(a)') < b.indexOf('_tb.blocks[bi].content'),
      'asked BEFORE anything is written');
    assert.match(b, /tb_not_wording/, 'and it says why rather than doing nothing');
  });
  test('and the card draws nothing to press', () => {
    const b = fnBody(TB, 'tbTurnHtml');
    const at = b.indexOf('tbCardWording(a)');
    assert.ok(at > 0, 'the card asks it too');
    assert.ok(at < b.indexOf('data-tb-use'),
      'the refusal returns BEFORE the Apply button is built');
  });
  test('the prompt already had somewhere for a refusal to go', () => {
    assert.match(AI_SRC, /cannot draft\s*'\s*\+\s*'from what you were shown, say so in "advice" and return proposedText as an empty string/,
      'AI_PROPOSAL_FORMAT names the channel — the guard is what makes it land there');
  });
  test('and an empty proposedText has always drawn no card', () => {
    /* tbDraft is where the proposal arrives; tbSend is the ask box's press. */
    const b = fnBody(TB, 'tbDraft');
    assert.match(b, /answered: String\(made\.advice/,
      'the honest branch is the one the fix routes into');
  });
});

/* ============================================================ */
describe('f328 (3) the clause says a count, never a verdict', () => {
  const stage = () => buildWorld({ ladder: true });
  /* ONE CLAUSE, TWO CHANGES, DECIDED DIFFERENTLY — the owner's own question,
     built as a record. */
  const mixed = () => ({
    id: 'MK-T', changes: [
      { id: 'CHG-1', clauseId: 'cl_1', authorSide: 'counterparty', changeType: 'modify',
        oldText: 'Thirty (30) days.', newText: 'Sixty (60) days.', status: 'accepted',
        seq: 1, createdAt: '2026-09-11T09:00:00.000Z' },
      { id: 'CHG-2', clauseId: 'cl_1', authorSide: 'counterparty', changeType: 'modify',
        oldText: 'Sixty (60) days.', newText: 'Ninety (90) days.', status: 'rejected',
        seq: 2, createdAt: '2026-09-12T09:00:00.000Z' },
    ],
  });
  test('the tally counts rungs and nothing else', async () => {
    const w = await stage();
    const t = w.win.ladderTally(w.win.ladderRungs(mixed(), 'cl_1'));
    assert.equal(t.n, 2); assert.equal(t.agreed, 1);
    assert.equal(t.refused, 1); assert.equal(t.open, 0);
  });
  test('and the chip says BOTH, where the verdict said one', async () => {
    const w = await stage();
    const chip = w.win.ladderChip(mixed(), 'cl_1', 'owner');
    assert.ok(chip, 'a settled clause still carries a chip');
    assert.equal(chip.key, 'tally', 'a tally, not a verdict');
    assert.match(chip.text, /2 changes/);
    assert.match(chip.text, /1 agreed/);
    assert.match(chip.text, /1 refused/,
      'the refusal the old badge could not mention');
    assert.ok(!/Settled/i.test(chip.text), 'and no word claiming an outcome for the clause');
  });
  test('a zero part is dropped, never printed as zero', async () => {
    const w = await stage();
    const c = mixed(); c.changes[1].status = 'accepted';
    const chip = w.win.ladderChip(c, 'cl_1', 'owner');
    assert.match(chip.text, /2 changes · 2 agreed/);
    assert.ok(!/refused/.test(chip.text), '"0 refused" is the sentence saying nothing was');
  });
  test('one change reads as one change', async () => {
    const w = await stage();
    const c = mixed(); c.changes = [c.changes[0]];
    const chip = w.win.ladderChip(c, 'cl_1', 'owner');
    assert.match(chip.text, /^1 change · 1 agreed$/, 'singular, and nothing else');
  });
  test('anything still on the table is not a tally at all', async () => {
    const w = await stage();
    /* THE READING FIRST, or this is vacuously true of a build that has no
       tally at all — which is exactly what it was against the parent. */
    assert.equal(typeof w.win.ladderTally, 'function', 'the tally is on this stage');
    const c = mixed(); c.changes[1].status = 'pending';
    const chip = w.win.ladderChip(c, 'cl_1', 'owner');
    assert.notEqual(chip.key, 'tally', 'a live move is what the chip is about');
  });
  test('the three verdict sentences have no caller left', () => {
    const code = strip(LADDER) + strip(read('js/views/negotiation.js'));
    for (const k of ['ng_rung_settled', 'ng_rung_refused', 'ng_rung_withdrawn'])
      assert.ok(!code.includes(k), k + ' is stale on the face');
  });
  test('but they stay in BOTH books, inert', () => {
    const en = I18N.slice(I18N.indexOf('  en: {'), I18N.indexOf('  sv: {'));
    const sv = I18N.slice(I18N.indexOf('  sv: {'));
    for (const k of ['ng_rung_settled', 'ng_rung_refused', 'ng_rung_withdrawn']) {
      assert.ok(en.includes(k + ':'), k + ' left in English');
      assert.ok(sv.includes(k + ':'), k + ' left in Swedish');
    }
  });
  test('the tally is a READING — no route, no store, no field', () => {
    const b = fnBody(LADDER, 'ladderTally') + fnBody(LADDER, 'ladderTallyText');
    /* THE FUNCTIONS FIRST — an empty grep is not a passing net. */
    assert.ok(b.length > 200, 'both readings are there to be swept');
    for (const bad of ['api(', 'fetch(', 'persist(', 'localStorage'])
      assert.ok(!b.includes(bad), 'ladderTally must not ' + bad);
  });
});

/* ============================================================ */
describe('f328 (4) a reading in flight turns', () => {
  test('the busy mark is the product’s own spinner, not a second one', () => {
    const b = fnBody(CONTRACT, 'ktTriageStripHtml');
    assert.match(b, /class="ob-spin"/, 'the obligations scan’s spinner');
    assert.ok(!/&hellip;/.test(b), 'the static ellipsis is gone');
    assert.match(b, /aria-hidden="true"/, 'and it is not read aloud');
  });
  test('the tile says it is busy to a screen reader', () => {
    assert.match(fnBody(CONTRACT, 'ktTriageStripHtml'), /aria-busy="true"/);
  });
  test('the spinner has a reduced-motion answer, because .ob-spin does', () => {
    assert.match(INDEX, /@media \(prefers-reduced-motion: reduce\)\{ \.ob-spin\{ animation:none; \} \}/,
      'it comes with the spinner rather than being written twice');
  });
  test('and the chip does not change size to hold it', () => {
    assert.match(INDEX, /\.kt-tri-chip\.is-busy \.ob-spin\{[^}]*margin:0/,
      '.ob-spin’s trailing margin is dropped — nothing follows it in the chip');
    assert.match(INDEX, /\.kt-tri-chip\.is-busy \.ob-spin\{[^}]*width:9px/,
      'and it is sized to the mark it replaces');
  });
  test('the tone still claims nothing while it works', () => {
    assert.match(INDEX, /\.kt-tri-chip\.is-busy\{background:var\(--color-neutral-100\)/,
      'neutral: nothing has been found and nothing has failed');
  });
});

/* ============================================================ */
describe('f328 (5) a day is a day, and nothing prints NaN', () => {
  /* THE ONE PRINTER, lifted by name and run on its own characters. */
  const dot = (() => {
    const b = fnBody(CONTRACT, 'ktDayDot');
    if (!b) return null;
    try { return new Function('regDotDate', 'esc',
      'const window={regDotDate};' + b + ';return ktDayDot;')(
      iso => { const d = new Date(iso + 'T00:00:00');
        return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; },
      x => x); } catch (_) { return null; }
  })();
  test('the printer was lifted', () => assert.ok(typeof dot === 'function'));
  test('an ISO day prints a day', () => {
    assert.equal(dot('2026-09-17'), '17.09.2026');
    assert.equal(dot('2026-09-17T14:32:00.000Z'), '17.09.2026', 'and an ISO stamp is one too');
  });
  test('THE REPORTED BUG: a locale sentence prints nothing, never NaN', () => {
    for (const s of ['17 Sept 2026, 14:32', '17 sep. 2026 14:32', 'yesterday', 'x', '—']) {
      const out = dot(s);
      assert.ok(!/NaN/.test(out), `"${s}" printed ${out}`);
      assert.equal(out, '', 'a reading that cannot answer says nothing');
    }
  });
  test('the scan stamps a day BESIDE its sentence, rather than instead of it', () => {
    const b = fnBody(AI_SRC, 'runScan');
    assert.match(b, /at:new Date\(\)\.toLocaleString/,
      '`at` is still the sentence the findings panel prints, in its own language');
  });
  /* REVERSED IN PLACE, 22 Sep 2026. The claim above used to continue:

         assert.match(b, /on:\(typeof todayStr==='function'\)\?todayStr\(\)/,
           'and `on` is the ISO day a formatter can read');

     — which pinned the DEFECT and called it the fix. todayStr() returns
     "22 Sept 2026", so ktDayDot refused it and this row printed an em-dash on
     every record ever scanned; the assertion and its own message contradicted
     each other and nobody read them together. A CHECK THAT READS THE SOURCE
     LINE CANNOT SEE THE VALUE, so this asks what the product actually writes:
     the `on:` expression is lifted out of runScan and EVALUATED. */
  /* THE STAGE IS THE PRODUCT'S OWN. A first draft of this evaluated the `on:`
     expression with only todayISO defined, so `typeof todayStr` answered
     'undefined', the expression took its ISO fallback and the claim PASSED at
     the parent — measuring the fallback instead of the real pair, which is a
     trap this codebase has already paid for once. Both names are bound here
     with the bodies js/core.js really gives them. */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const realTodayStr = () => new Date().toLocaleDateString('en-SE', { day: '2-digit', month: 'short', year: 'numeric' });
  const scanOnExpr = () => {
    const b = fnBody(AI_SRC, 'runScan');
    const m = b.match(/on:([\s\S]*?),\n\s*lang:/);
    assert.ok(m, 'the scan stamps `on` beside `lang`');
    return m[1].replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
  };
  test('and the day it stamps really is an ISO day', () => {
    const expr = scanOnExpr();
    const onStage = new Function('todayStr', 'todayISO', 'return (' + expr + ');')(realTodayStr, () => iso(new Date()));
    assert.equal(onStage, iso(new Date()),
      'what runScan writes, on a stage carrying core exactly as the product does');
    const bare = new Function('return (' + expr + ');')();
    assert.match(String(bare), /^\d{4}-\d{2}-\d{2}$/,
      'and the fallback, for a stage without js/core.js, answers the same shape');
  });
  test('the day the scan stamps is one ktDayDot will PRINT', () => {
    /* THE TWO HALVES MEASURED AGAINST EACH OTHER: the writer's real value
       handed to the reader that was refusing it. */
    const dot = fnBody(read('js/views/contract.js'), 'ktDayDot');
    const re = dot.match(/\/\^[^/]+\/(?=\.test)/);
    assert.ok(re, 'ktDayDot states the shape it accepts');
    const shape = new RegExp(re[0].slice(1, -1));
    const written = new Function('todayStr', 'todayISO', 'return (' + scanOnExpr() + ');')(realTodayStr, () => iso(new Date()));
    assert.ok(shape.test(String(written).slice(0, 10)),
      `the reader refused what the scan wrote: ${JSON.stringify(written)}`);
    assert.ok(!shape.test(realTodayStr()),
      'and a display string is still refused — that half was always right');
  });
  test('ONE reading answers "today as a day", and it is published', () => {
    const CORE = read('js/core.js');
    assert.match(CORE, /const todayISO = \(\) => \{/, 'it lives beside todayStr, which is what it keeps being confused with');
    assert.ok(!/toISOString/.test(fnBody(CORE, 'todayISO') || CORE.slice(CORE.indexOf('const todayISO'), CORE.indexOf('const todayISO') + 400)),
      'LOCAL, never UTC — toISOString puts today on yesterday west of Greenwich');
    assert.ok(/todayISO/.test(CORE.split('Object.assign(window').slice(1).join('')),
      'a name missing from the publish list cannot be read by ai.js, notice.js or the calendar');
    for(const [f, why] of [['js/notice.js', 'the served-notice wall'], ['js/views/calendar.js', 'the calendar']]){
      assert.match(read(f), /window\.todayISO === 'function'/, `${why} asks the one reading`);
    }
  });
  test('and there is ONE printer, where there were FOUR', () => {
    /* This table's, the record grid's, the documents rows' and the room's fact
       row. THE SAME NaN WAS ALREADY REPORTED ONCE — 13 Sep 2026, "364 days to
       NaN.NaN.NaN" on the room's fact row — and fixed there by changing what
       that one caller handed in. Four days later it arrived from a different
       copy. A fault fixed at one of four call sites is waiting for the next. */
    const code = strip(CONTRACT);
    const uses = (code.match(/const dot=(?:ktDayDot|iso=>esc\(ktDayDot)/g) || []).length;
    assert.equal(uses, 4, 'every one of them asks the same reading');
    assert.ok(!/const dot=iso=>\(?iso/.test(code), 'and not one keeps a copy of the formatting');
  });
  test('the room fact row that reported it in September asks it too', () => {
    const b = fnBody(CONTRACT, 'roomFactsHtml');
    assert.match(b, /const dot=ktDayDot/, 'the 13 Sep NaN cannot come back through this row');
  });
  test('and the table reads the day, not the sentence', () => {
    /* RE-POINTED IN PLACE 26 Sep 2026 (the list inspector): the Overview's readings
     are COUNTED in ktReadingsRows and DRAWN in ktReadingsRowsHtml, split so the
     panel beside the lists reads the same rows — the claim is about the two
     together, which is the one place the readings live. */
    const b = fnBody(CONTRACT, 'ktReadingsRows');
    assert.match(b, /when: \(c&&c\.scan&&c\.scan\.on\)\|\|''/);
    assert.ok(!/c\.scan\.at/.test(b), 'the sentence never reaches the formatter again');
  });
  test('every other row on that table already hands it an ISO day', () => {
    const b = fnBody(CONTRACT, 'ktReadingsRows');
    for (const src of ['c._brief.at', 'c.playbook.checkedAt', 'c.obligationsReadAt', 'c._readings.at'])
      assert.ok(b.replace(/\s+/g, '').includes(src.replace(/\s+/g, '')),
        src + ' is still what its row reads');
  });
});

/* ============================================================ */
describe('f328 (6) every new name published, every new key in both books', () => {
  test('the new readings are reachable from another module', () => {
    assert.match(LADDER, /ladderTally, ladderTallyText/);
    assert.match(AI_SRC, /AI_MODEL_VOICE,AI_MODEL_INSTRUMENT,/);
    assert.match(TB, /openTemplateBuilder, tbCardWording,/);
  });
  test('both dictionaries carry every key this work added', () => {
    const en = I18N.slice(I18N.indexOf('  en: {'), I18N.indexOf('  sv: {'));
    const sv = I18N.slice(I18N.indexOf('  sv: {'));
    for (const k of ['ng_rung_n_changes_one', 'ng_rung_n_changes_other',
      'ng_rung_n_agreed_one', 'ng_rung_n_agreed_other',
      'ng_rung_n_refused_one', 'ng_rung_n_refused_other', 'tb_not_wording']) {
      assert.ok(en.includes(k + ':'), k + ' in English');
      assert.ok(sv.includes(k + ':'), k + ' in Swedish');
    }
  });
});
