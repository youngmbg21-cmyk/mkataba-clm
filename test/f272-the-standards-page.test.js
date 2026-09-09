/* ============================================================
   F272 — The standards page: the row opens, and the playbook learns
   ============================================================
   Owner-asked 9 Sep 2026 off a screenshot of "Our standards", then ruled on
   four decisions at the foot of the design put to them: "build all four as
   you recommended."

     1. the closed clause row states Required or Preferred — READ from the
        playbook every time it is drawn, never stored twice;
     2. it keeps ONE LINE of the wording, clipped by WIDTH not by counting
        characters;
     3. the learned proposals read the LAST QUARTER, and only where there are
        enough settled rounds to mean anything;
     4. the clause library and the negotiation playbook stay TWO TABS.

   THE CONTROL COMES FIRST AND IT IS THE POINT OF SECTION 1. playbookKeyFor
   opens by calling cKind and playbook() reads `state` bare, and rlpRangeFor's
   own swallowed try means a stage that answers neither reports "no standard"
   for everything — so a file like this one goes green against a product that
   never reached its own reading. f223 recorded that trap in its own words and
   this file pays it forward: nothing below is worth anything until the stage
   is proved to answer.

   AND ONE DECISION IS DELIBERATELY NO CODE. Ruling 4 was to leave the two
   tabs apart, so what this file asserts for it is that nothing merged them. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const STD = read('js/standards.js');
const SET = read('js/views/settings.js');
const LIB = read('js/views/library.js');
const I18N = read('js/i18n.js');

/* A settled round, dated. The DATE is the whole subject of ruling 3, so it is
   a parameter here rather than the fixed stamp f222's fixture carries. */
const change = o => ({
  id: o.id, clauseId: o.clauseId || 'c1', clauseLabel: o.label || '',
  oldText: o.oldText || '', newText: o.newText || '',
  status: o.status, withdrawn: !!o.withdrawn,
  authorSide: o.side || 'counterparty', author: o.author || 'Them',
  createdAt: o.at, updatedAt: o.at,
});
const contract = (id, changes, extra) => Object.assign({
  id, name: id + ' agreement', counterparty: 'Kabras Sugar', status: 'Signed',
  folder: 'proc', fields: {}, metadata: {}, obligations: [], audit: [],
  rounds: [], versions: [], signatures: [], comments: [], changes,
  negotiation: { round: 2 },
}, extra || {});

const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();

/* THE FIXTURE IS THE CLAIM. Payment settled at 45 three times INSIDE the
   quarter, and at 90 twice over a year ago. Payment is higher-is-worse, so
   the worst REPEATED figure is 90 read over all time and 45 read over the
   quarter — the window does not merely trim the count, it CHANGES THE ANSWER,
   which is the only way to prove ruling 3 rather than describe it. */
function book(){
  return [
    contract('MK-1', [
      change({ id: 'C1', label: 'Payment terms', status: 'accepted', at: daysAgo(10),
        oldText: 'within thirty (30) days', newText: 'within forty-five (45) days' }),
    ]),
    contract('MK-2', [
      change({ id: 'C2', label: 'Payment terms', status: 'accepted', at: daysAgo(20),
        oldText: 'within thirty (30) days', newText: 'within forty-five (45) days' }),
      change({ id: 'C3', label: 'Payment terms', status: 'accepted', at: daysAgo(30),
        oldText: 'within thirty (30) days', newText: 'within forty-five (45) days' }),
    ]),
    contract('MK-3', [
      change({ id: 'C4', label: 'Payment terms', status: 'accepted', at: daysAgo(400),
        oldText: 'within thirty (30) days', newText: 'within ninety (90) days' }),
      change({ id: 'C5', label: 'Payment terms', status: 'accepted', at: daysAgo(420),
        oldText: 'within thirty (30) days', newText: 'within ninety (90) days' }),
    ]),
  ];
}
function stage(contracts, settings){
  const { win } = buildWorld({ standards: true });
  win.state = Object.assign(win.state || {}, {
    contracts: contracts || [], settings: settings || {},
  });
  return win;
}

describe('F272 — the standards page', () => {

  /* ---------------------------------------------------------------
     1 · THE CONTROL — the stage really reads a playbook and a library
     --------------------------------------------------------------- */
  describe('1 · the stage answers before anything else is asserted', () => {
    test('the playbook and the clause library both answer', () => {
      const win = stage();
      assert.equal(typeof win.playbook, 'function', 'the playbook engine is on the stage');
      const pb = win.playbook();
      assert.ok(pb && typeof pb === 'object' && Object.keys(pb).length,
        'and it returns real positions, not an empty object');
      assert.ok(win.clauseLibrary().length >= 6, 'and the library carries HaTi\'s own six');
    });
    test('a stance really resolves — so a null below means null, not a dead stage', () => {
      const win = stage();
      const pay = win.clauseLibrary().find(c => c.id === 'cl-pay');
      const st = win.stdStanceOf(pay);
      assert.ok(st && st.pos, 'payment terms carries a position');
    });
  });

  /* ---------------------------------------------------------------
     2 · RULING 1 — the stance is READ, never stored twice
     --------------------------------------------------------------- */
  describe('2 · the closed row states the position, read from the playbook', () => {
    test('it comes off the playbook and there is no second store', () => {
      const win = stage();
      const pay = win.clauseLibrary().find(c => c.id === 'cl-pay');
      assert.equal(win.stdStanceOf(pay).pos, 'preferred');
      const conf = win.clauseLibrary().find(c => c.id === 'cl-conf');
      assert.equal(win.stdStanceOf(conf).pos, 'required');
      /* THE WHOLE CONDITION THE OWNER PUT ON THIS: one fact stored in two
         places is the thing that drifts, and a reading cannot drift from its
         own source. Nothing here writes a stance onto a clause record. */
      assert.ok(!/\.stance\s*=|stance:/.test(STD),
        'the stance is never written onto a record');
      assert.ok(!/saveClauseLibrary|savePlaybook|persist\(/.test(STD),
        'and the reading layer writes nothing at all');
    });
    test('a position true of some contract types says SOME, never ALL', () => {
      const win = stage();
      const conf = win.clauseLibrary().find(c => c.id === 'cl-conf');
      const st = win.stdStanceOf(conf);
      assert.equal(st.scope, 'some', 'no baseline covers the rest');
      assert.ok(st.types.length, 'and it names the types it IS true of');
    });
    test('a clause the playbook says nothing about draws no chip at all', () => {
      const win = stage();
      const term = win.clauseLibrary().find(c => c.id === 'cl-term');
      assert.equal(win.stdStanceOf(term), null,
        'silence is the honest answer, not a guessed "Preferred"');
      assert.ok(/if \(!st\) return '';/.test(SET),
        'and the chip builder draws nothing for it');
    });
    test('partial is drawn quieter than the whole, never louder', () => {
      const chip = SET.slice(SET.indexOf('function stdStanceChipHtml'),
        SET.indexOf('function stdFallbackChipHtml'));
      assert.match(chip, /st\.scope === 'some'[\s\S]*?border:1px solid/,
        'an outline where it is true of some types');
      assert.match(chip, /background:var\(--st-ruby-bg\)/, 'a fill where it is the position');
    });
  });

  /* ---------------------------------------------------------------
     3 · RULING 2 — one line, clipped by WIDTH
     --------------------------------------------------------------- */
  describe('3 · the closed row keeps one line of the wording', () => {
    test('the cut is a width, never a character count', () => {
      assert.match(LIB, /\.std-clip\{[^}]*white-space:nowrap[^}]*text-overflow:ellipsis/,
        'the row ends where the row ends');
      const rc = SET.slice(SET.indexOf('function renderClauseLibrary'),
        SET.indexOf('/* ---- playbook viewer'));
      assert.ok(!/\.slice\(0,\s*1[0-9][0-9]\)|substring\(0,\s*1[0-9][0-9]\)/.test(rc),
        'and no 140-character cut survives anywhere in the row');
    });
    test('the whole of it is one hover away', () => {
      const rc = SET.slice(SET.indexOf('function renderClauseLibrary'),
        SET.indexOf('/* ---- playbook viewer'));
      assert.match(rc, /class="std-clip" title="\$\{esc\(String\(cl\.preferred\|\|''\)\)\}"/,
        'nothing is hidden silently');
    });
    test('the fallback is on the closed row too, which it never was', () => {
      const win = stage();
      const pay = win.clauseLibrary().find(c => c.id === 'cl-pay');
      const fb = win.stdFallbackOf(pay);
      assert.equal(fb.figure, 45, 'read as a FIGURE, which is what a reader decides against');
      assert.equal(fb.unit, 'days');
      assert.match(SET, /std_no_fallback/, 'and "no fallback" is a real answer, drawn');
    });
  });

  /* ---------------------------------------------------------------
     4 · RULING 3 — the last quarter, and a floor under it
     --------------------------------------------------------------- */
  describe('4 · what the playbook learns is windowed, and floored', () => {
    test('the window is a quarter and it is stated on the card', () => {
      const win = stage();
      assert.equal(win.STD_WINDOW_DAYS, 92, 'a quarter');
      const w = win.stdWindow();
      assert.ok(w.to - w.from > 90 * 86400000, 'and it really spans one');
      assert.match(SET, /std_learn_win/, 'the card prints the window it read');
      assert.equal((I18N.match(/std_learn_win:/g) || []).length, 2, 'in both languages');
    });
    test('a round outside the window is not read', () => {
      const win = stage(book());
      const learned = win.stdLearned();
      const pay = learned.proposals.concat(learned.holding).find(x => x.key === 'payment');
      assert.ok(pay, 'payment is read');
      assert.equal(pay.figure, 45,
        'the quarter settled at 45; the 90 from over a year ago is not the line any more');
      assert.equal(pay.settled, 3, 'and only the three rounds inside the window were counted');
      assert.equal(pay.seen, 3);
    });
    test('the same book read WITHOUT the window answers 90 — the control', () => {
      const win = stage(book());
      const all = win.precedentMine();
      const nums = all.payment.numbers.oursAccepted.concat(all.payment.numbers.theirsAccepted);
      assert.equal(nums.length, 5, 'all five rounds are genuinely in the book');
      const t = win.precedentTopicByKey('payment');
      assert.equal(win.stdHeld(all.payment, t).figure, 90,
        'so read over all time this page would still be proposing a line nobody has '
        + 'held in a year — which is exactly what ruling 3 was about');
    });
    test('below the floor nothing is proposed at all', () => {
      /* One settled round inside the quarter is an anecdote, not a pattern. */
      const thin = [contract('MK-9', [
        change({ id: 'X1', label: 'Payment terms', status: 'accepted', at: daysAgo(5),
          oldText: 'within thirty (30) days', newText: 'within sixty (60) days' }),
      ])];
      const win = stage(thin);
      const learned = win.stdLearned();
      assert.equal(learned.proposals.length, 0, 'nothing proposed');
      assert.equal(learned.holding.length, 0, 'and nothing claimed as held either');
      assert.equal(win.STD_MIN_ROUNDS, win.PRECEDENT_MIN,
        'the floor is the one this product already had');
    });
    test('the panel draws NOTHING where there is nothing to propose', () => {
      const panel = SET.slice(SET.indexOf('function renderPrecedentPanel'),
        SET.indexOf('async function stdOpenPreferred'));
      assert.match(panel, /if\(!sug\.length\)\{ host\.innerHTML=''; return; \}/,
        'with nothing to say it draws nothing at all');
      assert.ok(!/holding\.length[^]{0,40}\bsug\b/.test(panel.slice(0, panel.indexOf('host.innerHTML=`'))),
        'and holding rows alone never open the card');
    });
    test('a position being met says so and offers nothing to press', () => {
      const win = stage(book());
      const learned = win.stdLearned();
      for (const h of learned.holding)
        assert.ok(!h.moves, 'a holding row carries no move');
      assert.match(SET, /std_learn_hold_line/, 'and the card names them');
    });
  });

  /* ---------------------------------------------------------------
     5 · THE REVERSAL — a preferred is opened, never written
     --------------------------------------------------------------- */
  describe('5 · moving what the company ASKS FOR opens the editor', () => {
    test('the card can propose a preferred, which precedentSuggestions never does', () => {
      const win = stage(book());
      const pay = win.stdLearned().proposals.find(x => x.key === 'payment');
      assert.ok(pay, 'payment is proposed');
      assert.ok(pay.moves.includes('preferred'),
        'the preferred says 30 and nobody has held 30 this quarter — so it is named');
      /* AND THE FUNCTION IT REVERSES IS UNTOUCHED. */
      const PC = read('js/precedent.js');
      const fn = PC.slice(PC.indexOf('function precedentSuggestions'),
        PC.indexOf('/* "Last three times'));
      assert.ok(!/preferred/.test(fn),
        'precedentSuggestions still answers only about fallbacks');
    });
    test('and adopting one WRITES NOTHING — it opens the clause editor', () => {
      const fn = SET.slice(SET.indexOf('async function stdOpenPreferred'),
        SET.indexOf('async function precedentAdopt'));
      assert.match(fn, /confirmDialog/, 'it asks first');
      assert.match(fn, /openClauseEditor\(i\)/, 'and hands the wording to a person');
      assert.ok(!/saveClauseLibrary|savePlaybook|persist\(/.test(fn),
        'a human hand stays on the wording HaTi drafts with');
    });
    test('the fallback keeps the ordinary write, and is told WHICH figure', () => {
      const fn = SET.slice(SET.indexOf('async function precedentAdopt'),
        SET.indexOf('/* ---- A FIRST PLAYBOOK'));
      assert.match(fn, /confirmDialog/, 'moving the line the company holds asks first');
      assert.match(fn, /saveClauseLibrary\(lib\)/, 'and writes the way hand-editing would');
      assert.match(fn, /async function precedentAdopt\(key,row\)/,
        'the caller supplies the row, or it would silently adopt the all-time figure');
      assert.match(fn, /row\|\|\(precedentSuggestions\(\)/,
        'and absent, every older caller behaves exactly as before');
    });
  });

  /* ---------------------------------------------------------------
     6 · IDEA 21 — a first playbook, read off what was signed
     --------------------------------------------------------------- */
  describe('6 · what your own signed contracts say', () => {
    const signedBook = () => [
      contract('S-1', [], { metadata: { paymentTerms: '30 days from invoice', governingLaw: 'Kenya' } }),
      contract('S-2', [], { metadata: { paymentTerms: 'Net 30', governingLaw: 'Kenya' } }),
      contract('S-3', [], { metadata: { paymentTerms: 'within 30 days', governingLaw: 'Kenya' } }),
      contract('S-4', [], { metadata: { paymentTerms: 'within 60 days', governingLaw: 'Kenya' } }),
    ];
    test('it is offered only where nobody here has saved a standard', () => {
      assert.equal(stage(signedBook()).stdDraftWorthOffering(), true);
      const saved = stage(signedBook(), { clauseLibrary: [{ id: 'x', category: 'a', name: 'b' }] });
      assert.equal(saved.stdDraftWorthOffering(), false,
        'a workspace that has written its own standards is not offered a first one');
    });
    test('"no standards yet" is NOT the state, and the card does not claim it', () => {
      /* clauseLibrary() and playbook() both fall back to HaTi's own, so every
         workspace has six standards from its first minute. The design said
         "no standards yet" and that would be printed over six visible ones. */
      assert.ok(stage([]).clauseLibrary().length >= 6);
      assert.match(I18N, /std_draft_still_default: 'You are still on HaTi/,
        'so the card says what is actually true');
      assert.ok(!/std_no_standards_yet/.test(I18N), 'and the untrue wording exists nowhere');
    });
    test('a pattern that DIFFERS from the standard is proposed', () => {
      const win = stage(signedBook());
      const d = win.stdDraftFromSigned();
      const pay = d.rows.find(r => r.key === 'payment');
      assert.equal(pay.value, 30, 'three of four signed at 30');
      assert.equal(pay.seen, 3);
      assert.equal(pay.have, 4);
      assert.equal(pay.current, 30, 'and the standard already says 30');
      assert.equal(pay.agrees, true);
      assert.equal(pay.proposed, false, 'so it is good news and offers nothing to press');
    });
    test('a standard that disagrees with the book IS proposed', () => {
      const b = signedBook().map(c => Object.assign(c, {
        metadata: Object.assign({}, c.metadata, { paymentTerms: 'within 60 days' }) }));
      const win = stage(b);
      const pay = win.stdDraftFromSigned().rows.find(r => r.key === 'payment');
      assert.equal(pay.value, 60, 'every one of them signed at 60');
      assert.equal(pay.agrees, false, 'and the standard says 30');
      assert.equal(pay.proposed, true);
    });
    test('a thin or a split book proposes nothing', () => {
      const thin = stage([contract('S-1', [], { metadata: { paymentTerms: '60 days' } })]);
      assert.equal(thin.stdDraftFromSigned().rows.find(r => r.key === 'payment').proposed, false,
        'one contract is not a pattern');
      const split = stage([
        contract('S-1', [], { metadata: { paymentTerms: '30 days' } }),
        contract('S-2', [], { metadata: { paymentTerms: '45 days' } }),
        contract('S-3', [], { metadata: { paymentTerms: '60 days' } }),
        contract('S-4', [], { metadata: { paymentTerms: '90 days' } }),
      ]);
      assert.equal(split.stdDraftFromSigned().rows.find(r => r.key === 'payment').proposed, false,
        'four contracts that do not agree carry no usual figure');
    });
    /* ------------------------------------------------------------
       THE GOVERNING LAW ROW — owner-reported 9 Sep 2026
       ------------------------------------------------------------
       The row printed "Nothing to compare — your standard is wording, not a
       figure" while the standard sat visible eight rows below saying Sweden.
       That sentence described the CARD's limit and read as a fact about the
       RECORD, and with the comparison missing the card was silently dropping
       the strongest finding it can make: a Required standard the signed book
       does not follow. It is a real comparison now, and it is the product's
       own — jxNamesHome, which the playbook check and the risk scan ask. */
    const lawStage = (laws, market) => {
      const win = stage(laws.map((l, i) =>
        contract('L-' + i, [], { metadata: { governingLaw: l } })));
      if (market) win.getOrg = () => ({ jurisdiction: market });
      return win;
    };
    const lawRow = win => win.stdDraftFromSigned().rows.find(r => r.key === 'law');

    test('the governing law row compares against the workspace\'s own market', () => {
      const win = lawStage(['Kenya', 'Kenya', 'Kenya']);
      assert.equal(win.jxName(), 'Kenya', 'the control: the stage really has a market');
      const law = lawRow(win);
      assert.equal(law.compare, 'home', 'it is a home comparison, not a figure one');
      assert.equal(law.current, 'Kenya',
        'so the standard column names the market rather than saying there is nothing to compare');
      assert.equal(law.seen, 3);
      assert.equal(law.have, 3);
      assert.equal(law.differ, 0);
      assert.equal(law.agrees, true, 'all three name home');
    });

    test('and it COUNTS the ones that do not — the finding the card used to drop', () => {
      /* The owner's own screen: ten recorded governing laws, all different,
         a Swedish workspace. At most one can name Sweden, and the card said
         nothing at all about it. */
      const win = lawStage(['California', 'Delaware', 'England and Wales', 'Sweden',
        'Singapore', 'New York', 'Ireland', 'Netherlands', 'Texas', 'Ontario'], 'sweden');
      assert.equal(win.jxName(), 'Sweden', 'the control: the market really moved');
      const law = lawRow(win);
      assert.equal(law.current, 'Sweden');
      assert.equal(law.have, 10);
      assert.equal(law.seen, 1, 'one of the ten names Sweden');
      assert.equal(law.differ, 9, 'and nine name something else');
      assert.equal(law.agrees, false);
    });

    test('the count it PRINTS is the match, not how many share a spelling', () => {
      /* Both are true of the same book and only one answers the reader's
         question. Written as one number they disagree the moment a subject is
         compared any way but by counting duplicates. */
      const win = lawStage(['California', 'California', 'California', 'Kenya']);
      const law = lawRow(win);
      assert.equal(law.topN, 3, 'California is the commonest');
      assert.equal(law.seen, 1, 'but one contract names home');
      assert.equal(law.differ, 3);
    });

    test('it proposes NOTHING — a governing law is moved by the market setting', () => {
      /* The ONE DOOR rule. A button here would be a second way into a
         settings act that already has one, and two doors onto one act drift. */
      const win = lawStage(['California', 'California', 'California', 'California']);
      const law = lawRow(win);
      assert.equal(law.agrees, false, 'the book plainly departs from the standard');
      assert.equal(law.proposed, false, 'and it still presses nothing');
      const draft = SET.slice(SET.indexOf('function renderStandardsDraft'),
        SET.indexOf('/* THE DRAFT CARD WRITES NOTHING EITHER'));
      assert.match(draft, /r\.proposed&&mayAdopt/,
        'the button is drawn off proposed alone, so the model is the wall');
    });

    test('without a market pack it falls back honestly, never to a guess', () => {
      /* ASSERTED AT SOURCE, and that is the honest way round rather than a
         convenience. This harness runs these files as classic scripts sharing
         one scope, so jurisdiction.js's own top-level const survives deleting
         the window copy — the absence cannot be staged here at all, and a test
         that pretended to stage it would be describing itself. What CAN be
         pinned is the guard, and the behaviour of the branch it falls into. */
      const home = STD.slice(STD.indexOf('const _stdHomeName'),
        STD.indexOf('const stdSignedBook'));
      assert.match(home, /typeof jxName === 'function'/, 'the market is asked, never assumed');
      assert.match(home, /: null/, 'and its absence answers null rather than a guess');
      assert.match(home, /typeof jxNamesHome === 'function'/,
        'so is the reading of whether a law names home');
      /* And a row whose current is null draws the sentence that says so —
         which is what the governing law row would fall back to, and is what
         the liability row does today. */
      const law = lawRow(lawStage(['Kenya']));
      assert.equal(law.current, 'Kenya', 'the control: with a pack it really compares');
      const liab = stage([]).stdDraftFromSigned().rows.find(r => r.key === 'liability');
      assert.equal(liab.current, null);
      assert.match(SET, /std_no_figure_to_compare/, 'and the card says so in words');
    });

    test('"what you usually sign" stops claiming one where there is none', () => {
      /* California was printed under that heading having been seen once in
         ten — it won the alphabetical tie-break, not a count. */
      const win = lawStage(['California', 'Delaware', 'England and Wales', 'Sweden',
        'Singapore', 'New York', 'Ireland', 'Netherlands', 'Texas', 'Ontario'], 'sweden');
      const law = lawRow(win);
      assert.equal(law.value, 'California', 'the reading still knows the commonest');
      assert.equal(law.pattern, false, 'but one in ten is not a usual value');
      const draft = SET.slice(SET.indexOf('const grey=t=>'),
        SET.indexOf('const why=r=>'));
      assert.match(draft, /if\(!r\.pattern\) return grey\(i18t\('std_no_usual'\)\)/,
        'so the cell says the absence rather than the alphabet');
      assert.match(draft, /if\(!r\.have\) return '—'/,
        'and nothing on file is still the em-dash it always was');
    });

    test('nothing on file is not a disagreement', () => {
      /* "0 of your signed contracts carry one and they do not agree" — the
         card arguing with its own zero. */
      const wStart = SET.indexOf('const why=r=>{');
      const why = SET.slice(wStart, SET.indexOf('host.innerHTML=`', wStart));
      assert.match(why, /if\(!r\.have\) return esc\(i18t\('std_none_carry'\)\)/,
        'the empty column has a sentence of its own');
      assert.ok(why.indexOf("!r.have") < why.indexOf('std_disagree'),
        'and it is asked before the disagreement sentence');
    });

    test('"already matches" needs a pattern to match', () => {
      /* 3 of 7 reported "Already matches" because agrees was asked first: a
         standard equal to a MINORITY value is not agreement. */
      const wStart = SET.indexOf('const why=r=>{');
      const why = SET.slice(wStart, SET.indexOf('host.innerHTML=`', wStart));
      assert.ok(why.indexOf('!r.pattern') < why.indexOf('r.agrees===true'),
        'whether there is a pattern at all is asked before whether it matches');
      const win = stage([
        contract('T-1', [], { metadata: { noticePeriodDays: 30 } }),
        contract('T-2', [], { metadata: { noticePeriodDays: 45 } }),
        contract('T-3', [], { metadata: { noticePeriodDays: 60 } }),
        contract('T-4', [], { metadata: { noticePeriodDays: 90 } }),
      ]);
      const term = win.stdDraftFromSigned().rows.find(r => r.key === 'term');
      assert.equal(term.pattern, false, 'four contracts that do not agree carry no usual figure');
      assert.equal(term.agrees, true, 'even though the standard happens to equal one of them');
    });

    test('what it cannot read is NAMED, never quietly left out', () => {
      const win = stage(signedBook());
      const d = win.stdDraftFromSigned();
      assert.ok(d.unreadable.includes('Confidentiality'));
      assert.ok(d.unreadable.includes('Data protection'));
      assert.match(SET, /std_cannot_read/, 'and the card prints them');
      assert.equal((I18N.match(/std_cannot_read:/g) || []).length, 2, 'in both languages');
    });
    test('it reads the RECORD — the fields a person has already confirmed', () => {
      assert.ok(!/redlineText|contractFullBody|\bbody\b\s*\)/.test(
        STD.slice(STD.indexOf('const STD_DRAFT_SUBJECTS'), STD.indexOf('function stdUsingDefaults'))),
        'never a fresh read of the wording, which would rest on nothing anybody checked');
    });
    /* CORRECTED BEFORE IT SHIPPED, and the correction is the claim. The first
       build wrote the figure straight into the preferred as one flat sentence,
       which MEASURED in a browser replaced the company's drafted clause with
       "Payment terms at 60 days." — the very thing this feature's own written
       reasoning forbids one screen away. */
    test('adopting a standard WRITES NOTHING — it opens the clause editor', () => {
      const fn = SET.slice(SET.indexOf('function renderStandardsDraft'),
        SET.indexOf('/* THE DRAFT CARD WRITES NOTHING EITHER'));
      assert.ok(!/saveClauseLibrary|savePlaybook|persist\(/.test(fn),
        'a preferred is WORDING, and wording is written by a person');
      assert.match(fn, /stdOpenPreferred\(/,
        'and it goes through the learned card\'s own door, never a second one');
    });
    test('the two cards call the move by ONE name', () => {
      const draft = SET.slice(SET.indexOf('function renderStandardsDraft'),
        SET.indexOf('/* THE DRAFT CARD WRITES NOTHING EITHER'));
      assert.match(draft, /std_learn_move_pref/,
        'the same words the learned card uses — a control that said "Adopt" and '
        + 'then opened an editor would be naming somewhere it does not go');
    });
    test('and "adopt all" is gone rather than half-built', () => {
      assert.ok(!/data-std-adopt-all|stdAdoptDraft/.test(SET),
        'four editors do not open at once, so the control cannot honestly exist');
    });
  });

  /* ---------------------------------------------------------------
     7 · RULING 4 — the two tabs stay apart
     --------------------------------------------------------------- */
  describe('7 · the clause library and the negotiation playbook are two tabs', () => {
    test('nothing merged them', () => {
      assert.match(LIB, /PB_PAGE_TABS/, 'the tab list is still one list');
      const tabs = LIB.slice(LIB.indexOf('const PB_PAGE_TABS'), LIB.indexOf('const PB_PAGE_TABS') + 200);
      assert.match(tabs, /clauses/);
      assert.match(tabs, /playbook/);
    });
    test('and the row points AT that tab rather than growing a second door', () => {
      assert.match(SET, /data-pb-tab="playbook"\]'\)\?\.click\(\)/,
        'a proxy onto the door that exists, never a second one');
    });
  });

  /* ---------------------------------------------------------------
     8 · THE ROW OPENS — one at a time, in memory
     --------------------------------------------------------------- */
  describe('8 · the row opens', () => {
    test('one at a time, per sitting, never stored', () => {
      assert.match(SET, /let _stdOpenClause = null;/);
      assert.ok(!/localStorage[^\n]*stdOpen|stdOpen[^\n]*localStorage/.test(SET),
        'a stored open row would open a week later with nothing saying why');
    });
    test('the open row shows both halves and names them', () => {
      const rc = SET.slice(SET.indexOf('function renderClauseLibrary'),
        SET.indexOf('/* ---- playbook viewer'));
      assert.match(rc, /std_ask_for/, 'what we ask for');
      assert.match(rc, /std_go_down_to/, 'and what we will go down to');
      assert.match(rc, /std_no_fallback_note/, 'or that there is no fallback, which is an answer');
    });
    test('the press repaints this list and nothing else', () => {
      const wire = SET.slice(SET.indexOf("host.querySelectorAll('[data-std-open]')"),
        SET.indexOf("host.querySelectorAll('[data-std-pos]')"));
      assert.match(wire, /renderClauseLibrary\(\)/);
      assert.ok(!/renderTeam\(|setView\(/.test(wire),
        'the cards either side of it must not be rebuilt under the reader');
    });
  });

  /* ---------------------------------------------------------------
     9 · NO STORE, NO ROUTE, NO WRITES
     --------------------------------------------------------------- */
  describe('9 · the reading layer reads', () => {
    test('it is this workspace and nothing else', () => {
      assert.match(STD, /window\.state && Array\.isArray\(state\.contracts\)/,
        'the caller\'s own already-scoped bootstrap');
      assert.ok(!/\bapi\(|fetch\(/.test(STD), 'no route, and there must never be one');
      assert.ok(!/ai\//.test(STD), 'and no model: counting is not a job for one');
    });
    test('counting is not drawing', () => {
      assert.ok(!/innerHTML|<div|<span|document\./.test(STD),
        'the reading returns plain data and draws nothing');
    });
    test('it is its own file, loaded after the two it reads', () => {
      const app = read('js/app.js');
      assert.ok(app.indexOf("standards.js") > app.indexOf("precedent.js"),
        'STD_MIN_ROUNDS is read AT LOAD off PRECEDENT_MIN, so the order is load-bearing');
    });
  });

  /* ---------------------------------------------------------------
     10 · BOTH LANGUAGES
     --------------------------------------------------------------- */
  describe('10 · the words exist in both languages', () => {
    test('every key the page prints', () => {
      const keys = ['std_ask_for', 'std_go_down_to', 'std_no_fallback', 'std_no_fallback_note',
        'std_fallback_n', 'std_required', 'std_preferred', 'std_stance_all', 'std_stance_some',
        'std_open_clause', 'std_edit_wording', 'std_change_position', 'std_your_history',
        'std_hist_line', 'std_learn_title', 'std_learn_win', 'std_learn_line',
        'std_learn_move_pref', 'std_learn_move_fb', 'std_learn_holding', 'std_learn_hold_line',
        'std_learn_pref_q', 'std_learn_pref_msg', 'std_learn_pref_opened',
        'std_draft_still_default', 'std_draft_still_default_sub', 'std_draft_by_hand',
        'std_th_position', 'std_th_usually', 'std_th_standard', 'std_th_seen',
        'std_seen_of', 'std_seen_of_carrying', 'std_not_proposed', 'std_agrees',
        'std_cannot_read', 'std_adopt', 'std_adopt_q', 'std_adopt_msg', 'std_adopted',
        'std_adopt_none', 'std_unit_days', 'std_draft_pref_detail', 'std_standard_text', 'std_standard_none',
        /* The four the governing law fix added, 9 Sep 2026. */
        'std_no_usual', 'std_none_carry', 'std_seen_naming'];
      for (const k of keys)
        assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    });
    test('and every plural carries both forms in both books', () => {
      /* std_draft_adopt_all is STALE — the control went; the key stays paired
         and inert, because a key removed from one book and not the other is how
         a screen ends up half-English. */
      for (const k of ['std_show_rounds', 'std_draft_go', 'std_draft_title',
        'std_draft_adopt_all', 'std_disagree', 'std_law_differ'])
        for (const f of ['_one', '_other'])
          assert.equal((I18N.match(new RegExp('\\b' + k + f + ':', 'g')) || []).length, 2, k + f);
    });
  });
});
