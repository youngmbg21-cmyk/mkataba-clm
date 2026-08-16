/* ============================================================
   F97 — "Edit with Copilot": a proposal that can ADD, not only replace
   ============================================================
   Every Copilot proposal used to do exactly one thing: swap out the passage the
   reader highlighted. That is right for "make this tighter" and silently wrong
   for the other half of what people actually type — "add three bullet points
   about data retention after this clause". The model drafted the bullets and
   the splice put them ON TOP of the sentence they were meant to follow. No
   error, no warning, and wording nobody agreed to lose was gone.

   So a proposal now carries WHERE it goes as well as what it says. Four
   placements, and this file pins the six ways the feature can fail silently:

     · THE PLACEMENT HAS TO SURVIVE THE PARSE, and a model that omits it, or
       invents a fifth, must land on `replace` — the behaviour that existed
       before the field did — rather than on an insert at an offset nobody
       worked out.

     · AN ADDITION MUST NOT BE MEASURED AGAINST WHAT IT SITS BESIDE. The
       typography repair reshapes an answer to the shape of the passage a
       rewrite REPLACES, including its item count. Point it at an addition and
       it goes hunting for items that were never meant to be there — splitting a
       single added sentence at its own semicolon to reach the passage's count.
       A sub-paragraph break nobody drafted, inside wording about to be filed.

     · "AFTER" HAS TO KEEP THE SENTENCE. It is the entire difference between
       this feature and the bug it replaces, and it is one character of
       arithmetic away from being wrong.

     · A NEW CLAUSE IS A NEW CLAUSE, not a modify on the one above it — and it
       lands after the whole highlight, against an anchor re-checked at Apply.

     · ADDING TO A SPAN DELETES NOTHING. Replacing a highlight that crosses
       several blocks collapses them; running an ADDITION through that machinery
       would propose deletions for blocks the reader explicitly asked to keep.

     · AND THE REFUSALS STILL REFUSE. A selection spanning numbered clauses, one
       crossing a redline, and a clause that moved while the panel was open all
       still file nothing — an insert is a splice like any other and gets no
       private path into the contract. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const D = require('../js/docx.js');

/* ai.js wires the panel's buttons at load, so it needs a stage. Only the pure
   halves are exercised through this — the parse, the placement vocabulary, the
   two wording cleaners — which is all a node test can honestly assert about a
   chat panel. Same shape as F88's loader, deliberately: two different stages
   for one module is how the two files end up testing different code. */
function loadAi(){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s),
    toast(){}, lsGet(){ return null; }, lsSet(){}, getContract(){ return null; },
    currentUser(){ return { name: 'You' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  /* js/jurisdiction.js first, the order js/app.js loads it in: ai.js asks it
     what law this workspace is under and what money looks like. */
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'),
      sandbox, { filename: f });
  return sandbox;
}

/* The three bullets the whole feature exists for, in the form a model returns
   them: one per line, each with its own opening mark. */
const BULLETS = [
  '(a) Personal data shall be retained for no longer than twelve (12) months.',
  '(b) The Supplier shall delete all personal data within thirty (30) days of termination.',
  '(c) Deletion shall be certified in writing to the Customer.'
].join('\n');

/* ============================================================ */
describe('F97a — the placement survives the parse, or fails safe', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('the edit format names the field and the four values', () => {
    /* A function since the advice field answers to the Plain/Legal register
       (F107). The placement contract is the same in both. */
    for (const style of ['plain', 'legal']){
      ai.aiSetStyle(style);
      assert.match(ai.AI_EDIT_FORMAT(), /"placement"/);
      for (const p of ['replace', 'after', 'before', 'newClause'])
        assert.ok(ai.AI_EDIT_FORMAT().includes(p), `the model is told about "${p}" in ${style}`);
    }
  });

  test('and it forbids the one answer that loses wording', () => {
    /* A drafter who says "add" and gets `replace` loses the sentence they were
       building on. That instruction is the difference between this feature
       working and it being the bug it replaces, so it is stated to the model
       rather than hoped for. */
    assert.match(ai.AI_EDIT_FORMAT(), /ADD.*placement MUST NOT be "replace"/s);
  });

  test('and it asks for list items one per line', () => {
    /* docRichFromText rebuilds real list markup from line openers, so bullets
       have to ARRIVE as lines to survive as items. */
    assert.match(ai.AI_EDIT_FORMAT(), /ONE ITEM PER LINE/);
  });

  test('a stated placement is read back', () => {
    const p = ai.aiParseProposal(JSON.stringify({ advice: 'Adds a retention limb.',
      placement: 'after', proposedText: BULLETS }));
    assert.equal(p.placement, 'after');
    assert.equal(p.strict, true);
  });

  test('an absent placement is a replacement — the behaviour that predates the field', () => {
    const p = ai.aiParseProposal('{"advice":"Tighter.","proposedText":"Payable within thirty (30) days."}');
    assert.equal(p.placement, 'replace');
  });

  test('an invented placement is a replacement, not an insert at a guessed offset', () => {
    const p = ai.aiParseProposal(JSON.stringify({ advice: 'x',
      placement: 'somewhere-in-the-middle', proposedText: 'y' }));
    assert.equal(p.placement, 'replace');
  });

  test('a reply with no structure at all never claims a placement', () => {
    /* The model answered with bare wording and skipped the wrapper. It never
       said where that wording goes, and guessing "insert" from prose would
       splice at an offset nobody nominated. */
    const p = ai.aiParseProposal('The Supplier shall indemnify the Customer against direct loss only.');
    assert.equal(p.strict, false);
    assert.equal(p.placement, 'replace');
  });

  test('a heading is kept only where it means something', () => {
    const made = ai.aiParseProposal(JSON.stringify({ advice: 'x', placement: 'newClause',
      proposedText: BULLETS, headingText: '12. Data Retention' }));
    assert.equal(made.headingText, '12. Data Retention');
    const other = ai.aiParseProposal(JSON.stringify({ advice: 'x', placement: 'replace',
      proposedText: 'y', headingText: '12. Data Retention' }));
    assert.equal(other.headingText, '', 'a heading on a replacement is a field nobody reads');
  });

  test('normalising is case-tolerant and total', () => {
    assert.equal(ai.aiNormalizePlacement('AFTER'), 'after');
    assert.equal(ai.aiNormalizePlacement('newclause'), 'newClause');
    assert.equal(ai.aiNormalizePlacement(null), 'replace');
    assert.equal(ai.aiIsInsert('after'), true);
    assert.equal(ai.aiIsInsert('replace'), false);
  });
});

/* ============================================================ */
describe('F97b — an addition is not measured against what it sits beside', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  /* THE TRAP THIS WHOLE DESCRIBE EXISTS FOR, stated as what it actually does.
     aiPreserveTypography reshapes the answer to the shape of the passage it
     REPLACES — including its item count. That is right for a rewrite, where the
     answer stands in for the passage and should look like it. It is wrong for
     an addition, whose shape has nothing to do with the shape of whatever it
     happens to land next to.

     The damage runs toward SPLITTING, not joining: handed a passage of three
     sub-paragraphs and one added sentence, the repair goes looking for two more
     items and breaks the sentence at its own semicolon to find them. A
     sub-paragraph break nobody drafted, inside wording about to be filed as a
     redline. */
  test('the repair really would break an addition apart to match the passage', () => {
    const mangled = ai.aiPreserveTypography(
      'First sub-paragraph.\nSecond sub-paragraph.\nThird sub-paragraph.',
      'The Supplier shall retain personal data for twelve (12) months; and shall certify deletion.');
    assert.ok(mangled.split('\n').filter(Boolean).length > 1,
      'one added sentence came back as more than one line — this is correct for a rewrite and wrong for an insert');
  });

  test('so an addition is left in the shape it was drafted in', () => {
    const kept = ai.aiCleanAddedWording(
      'First sub-paragraph.\nSecond sub-paragraph.\nThird sub-paragraph.',
      'The Supplier shall retain personal data for twelve (12) months; and shall certify deletion.');
    assert.equal(kept.split('\n').filter(Boolean).length, 1,
      'one sentence in, one sentence out — nothing counted, nothing invented');
  });

  test('so added wording keeps every line it arrived with', () => {
    const kept = ai.aiCleanAddedWording('Payable within thirty (30) days.', BULLETS);
    const lines = kept.split('\n').filter(l => l.trim());
    assert.equal(lines.length, 3, 'three bullets in, three bullets out');
    assert.match(lines[0], /^\(a\)/);
    assert.match(lines[2], /^\(c\)/);
  });

  test('and those three lines become three limbs that KEEP their letters', () => {
    /* REVERSED IN PLACE, 16 Aug 2026 (owner-reported off a Copilot proposal):
       the wording came back reading "(a) Manufacture all products…" and what
       landed in the contract was "• Manufacture all products…" — the letters
       gone. This claim used to assert the item COUNT precisely because the
       letters were consumed into the markup, and that turned out to be the
       fault rather than the design: a lettered limb is cited as clause 1(b),
       exactly as a numbered one is cited as clause 7.1, and js/docx.js already
       states the rule for numbers — "Both keep their number: it is the
       citation."

       So they are paragraphs now, each carrying its own label. Still three
       limbs, still not one run-on, and the wording a contract is cited by
       survives. */
    const html = D.docRichFromText(BULLETS);
    assert.equal((html.match(/<li\b/g) || []).length, 0,
      'no list markup — no browser draws "(a)" as a list marker, so making one '
      + 'means throwing the label away');
    for (const label of ['(a)', '(b)', '(c)'])
      assert.ok(html.includes(label), `${label} survives into the document`);
    assert.equal((html.match(/<p>/g) || []).length, 3, 'three limbs, not one run-on');
  });

  test('a TRUE bullet still loses its mark and becomes a list item', () => {
    /* The other half of the same rule, and the reason the two patterns are
       separate now: a bullet mark carries no citation, so nothing is lost by
       letting the list draw its own. */
    const html = D.docRichFromText(
      '\u2022 Personal data is deleted on termination.\n\u2022 Deletion is certified in writing.');
    assert.equal((html.match(/<li\b/g) || []).length, 2);
    assert.ok(!html.includes('\u2022'), 'the mark is the list\'s, not the wording\'s');
  });

  test('markup is still refused where the clause it joins is plain', () => {
    const out = ai.aiCleanAddedWording('Payable within thirty (30) days.',
      '<p>Retention is <script>alert(1)</script>twelve months.</p>');
    assert.ok(!/[<>]/.test(out), 'a plain clause is a string; tags in it would be filed as visible text');
    assert.ok(!/alert/.test(out), 'and a script body is never contract wording');
  });

  test('and allowed where the clause it joins is rich', () => {
    const out = ai.aiCleanAddedWording('<p>Payable within <strong>thirty</strong> days.</p>',
      '<ul><li>One</li><li>Two</li></ul><script>alert(1)</script>');
    assert.match(out, /<li>One<\/li>/, 'a rich clause keeps the structure the answer carries');
    assert.ok(!/alert|script/.test(out), 'the allowlist still holds');
  });
});

/* ============================================================
   The workbench half. A rich contract, a real clause, and the page's own
   apply handler driven the way the proposal card drives it. */
const RICH = [
  '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
  '<h2>2. PAYMENT TERMS</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue.</p>',
  '<p>Interest accrues on any overdue amount at 2% per month.</p>',
  '<h2>8.2(a) Termination for convenience</h2>',
  '<ol><li>Either party may terminate on sixty (60) days notice.</li>',
  '<li>Accrued rights survive termination.</li></ol>',
].join('');

function contractFixture(){
  return { id: 'MK-960', name: 'Supply and Services Agreement',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich' };
}

/* The page, with the Copilot panel stubbed. `panel.cards` records what
   aiOpenProposal was handed — which is where onApply comes from, and driving
   THAT is how this file tests the splice without a real chat panel. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = contractFixture();

  const panel = { opened: [], pushed: [], proposals: [], sessions: [], cards: [], said: [] };
  win.openAI = (prefill, o) => panel.opened.push(o || {});
  win.aiPush = (role, m) => { panel.pushed.push({ role, m });
    if (role === 'assistant' && m && m.text) panel.said.push(String(m.text)); };
  win.renderAIFeed = () => {};
  win.copilotAvailable = () => true;
  win.copilotPropose = async o => { panel.proposals.push(o);
    return { advice: 'Adds a retention limb.', proposedText: opts.wording || BULLETS,
      strict: true, placement: opts.placement || 'after',
      headingText: opts.headingText || '' }; };
  win.aiOpenProposal = o => { panel.cards.push(o); return o; };
  win.aiOpenRephraseSession = o => { panel.sessions.push(o); return o; };
  win.aiCloseRephraseSession = () => {};
  win.aiNormalizePlacement = v => {
    const s = String(v == null ? '' : v).trim().toLowerCase();
    return ['replace', 'after', 'before', 'newClause'].find(p => p.toLowerCase() === s) || 'replace';
  };
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];

  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();

  const clause = win.negoClauseList(c).find(x => /PAYMENT/i.test(x.headingText));
  const action = win.RL_SEL_ACTIONS.find(a => a.id === 'edit');

  /* Ask, then answer, exactly as the panel does: the action is conversational,
     so it seeds a session and spends nothing until an instruction arrives. */
  const ask = async (text, instruction, extra = {}) => {
    panel.cards.length = 0;
    win.rlAiPropose({ c, action, text, clauseId: clause.clauseId,
      opts: { side: 'owner', by: 'Young Mbagaya', persist: false },
      again: () => {}, ...extra });
    await new Promise(r => setTimeout(r, 0));
    const session = panel.sessions[panel.sessions.length - 1];
    if (session && instruction !== undefined) await session.onPropose(instruction);
    return panel.cards[panel.cards.length - 1] || null;
  };
  const clauseText = () => String(win.negoClauseById(c, clause.clauseId).text || '');
  /* WHAT WAS FILED, WHICH IS NOT THE SAME AS WHAT THE CLAUSE SAYS. Nothing on
     this engine edits the document: a proposal becomes a tracked change and the
     baseline is untouched until somebody accepts it. So the wording to assert
     on is the change's newText — asserting on the clause would be asserting
     that a proposal had already been agreed. */
  const filed = () => {
    const ch = win.negoChanges(c).filter(x => x.clauseId === clause.clauseId).pop();
    return ch ? String(ch.newText || '') : '';
  };
  /* The clause moving under an open panel, done the way it really moves: the
     round's baseline is re-segmented on every read, so a mutated clause object
     is thrown away and only the baseline body counts. */
  const moveClauseUnderneath = (from, to) => {
    c.negotiation.baselineBody = String(c.negotiation.baselineBody).replace(from, to);
  };
  /* The clause leaving the document entirely while the panel is open — the
     anchor case, as opposed to the wording case above. */
  const dropClause = id => {
    c.negotiation.baselineBody = win.clauseRemove
      ? (win.clauseRemove(c.negotiation.baselineBody, id) ?? c.negotiation.baselineBody)
      : c.negotiation.baselineBody;
  };
  return { w, win, c, panel, clause, action, ask, clauseText, filed, moveClauseUnderneath, dropClause,
    changes: () => win.negoChanges(c) };
}

/* ============================================================ */
describe('F97c — the menu renamed rather than grew a fourth door', () => {
  test('the action is Edit, it offers placements, and rephrase is gone', async () => {
    const p = await page();
    const ids = p.win.RL_SEL_ACTIONS.map(a => a.id);
    assert.equal(ids.join(','), 'edit,shorten,standard', 'still three verbs');
    assert.match(p.action.label, /Edit with Copilot/);
    assert.equal(p.action.placements, true);
    /* The sparkle stays: Direct Edit on the clause toolbar already wears a
       pencil, and two near-identical marks doing different jobs is the thing
       the icon is there to prevent. */
    assert.match(p.action.label, /^✨/);
  });

  test('shorten is deliberately NOT offered placements', async () => {
    /* A shortening that inserts is not a shortening. The action carries its own
       instruction and cannot mean anything else, so offering the field would
       only invite the model to use it. */
    const p = await page();
    assert.ok(!p.win.RL_SEL_ACTIONS.find(a => a.id === 'shorten').placements);
  });

  test('the question it opens with leaves adding on the table', async () => {
    const p = await page();
    await p.ask('All invoices are payable within thirty (30) days from the date of issue.');
    assert.match(p.panel.sessions[0].greeting, /add or change/i);
  });

  test('and the ask sent to the model permits adding', async () => {
    const p = await page();
    await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      'add three bullet points on data retention after this');
    assert.match(p.panel.proposals[0].ask, /add to, or extend/);
    assert.equal(p.panel.proposals[0].placements, true);
  });
});

/* ============================================================ */
describe('F97d — "after" keeps the sentence it follows', () => {
  test('the highlighted wording is still there, and the bullets follow it', async () => {
    const p = await page({ placement: 'after' });
    const passage = 'All invoices are payable within thirty (30) days from the date of issue.';
    const card = await p.ask(passage, 'add three bullet points on data retention after this');
    assert.ok(card, 'a card was opened');
    assert.equal(card.placement, 'after');
    assert.equal(card.placements, true, 'so the reader can correct the guess');

    const baseline = p.clauseText();
    const res = card.onApply(card.proposedText, { placement: 'after' });
    assert.equal(res.ok, true);
    await new Promise(r => setTimeout(r, 0));

    const after = p.filed();
    assert.ok(after.includes(passage),
      'THE WHOLE POINT: the sentence the bullets were added after is still in the proposed wording');
    assert.ok(after.includes('twelve (12) months'), 'and the new wording is in it');
    assert.ok(after.indexOf('twelve (12) months') > after.indexOf(passage),
      'and it lands after, not before');
    assert.ok(after.length > baseline.length, 'the clause grew rather than swapped');
    assert.equal(p.clauseText(), baseline,
      'and the baseline is untouched — this is a proposal until the other side answers it');
  });

  test('the three bullets are filed as three limbs that keep their letters', async () => {
    /* THE END OF THE JOURNEY, and the reason aiCleanAddedWording must leave the
       lines alone. REVERSED IN PLACE, 16 Aug 2026: this used to assert the item
       count and say so explicitly — "the letters are consumed INTO the markup
       rather than kept as characters" — which is exactly what the owner
       reported as a fault. Wording that arrived as one run-on would still come
       back as a single block here; what is asserted now is that it did not, AND
       that the labels a contract is cited by survived the journey. */
    const p = await page({ placement: 'after' });
    const lines = s => s.split('\n').filter(l => l.trim()).length;
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      'add three bullet points on data retention after this');
    const wasLines = lines(p.clauseText());
    card.onApply(card.proposedText, { placement: 'after' });
    await new Promise(r => setTimeout(r, 0));

    const ch = p.changes().filter(x => x.clauseId === p.clause.clauseId).pop();
    for (const label of ['(a)', '(b)', '(c)'])
      assert.ok(String(ch.bodyHtml).includes(label),
        `${label} is on the record — the label is how the limb is cited`);
    assert.equal(lines(p.filed()), wasLines + 3,
      'and the clause gained exactly three sub-paragraphs — not one run-on, and not five');
  });

  test('and it files an ordinary modify, with the placement on the record', async () => {
    const p = await page({ placement: 'after' });
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      'add three bullets after this');
    card.onApply(card.proposedText, { placement: 'after' });
    await new Promise(r => setTimeout(r, 0));
    const ch = p.changes().find(x => x.clauseId === p.clause.clauseId);
    assert.ok(ch, 'a tracked change was filed — an insert gets no private path into the contract');
    assert.equal(ch.changeType, 'modify');
    assert.match(String(ch.note || ''), /Copilot — Edit \(added after\)/,
      'the record says what it did, not just which tool did it');
  });

  test('"before" puts it in front and still keeps the sentence', async () => {
    const p = await page({ placement: 'before' });
    const passage = 'All invoices are payable within thirty (30) days from the date of issue.';
    const card = await p.ask(passage, 'put a data retention limb in front of this');
    card.onApply(card.proposedText, { placement: 'before' });
    await new Promise(r => setTimeout(r, 0));
    const text = p.filed();
    assert.ok(text.includes(passage), 'the sentence survives');
    assert.ok(text.indexOf('twelve (12) months') < text.indexOf(passage), 'and the new wording precedes it');
  });

  test('replace still replaces — the old behaviour is untouched', async () => {
    const p = await page({ placement: 'replace', wording: 'All invoices are payable within sixty (60) days.' });
    const passage = 'All invoices are payable within thirty (30) days from the date of issue.';
    const card = await p.ask(passage, 'make this net sixty');
    card.onApply(card.proposedText, { placement: 'replace' });
    await new Promise(r => setTimeout(r, 0));
    const text = p.filed();
    assert.ok(!text.includes(passage), 'the passage was swapped out');
    assert.ok(text.includes('sixty (60) days'));
  });
});

/* ============================================================ */
describe('F97e — a new clause is a new clause', () => {
  test('it files insertClause after the current one, not a modify on it', async () => {
    const p = await page({ placement: 'newClause', headingText: '12. Data Retention' });
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      'add a new clause after this one covering data retention');
    assert.equal(card.placement, 'newClause');
    assert.equal(card.headingText, '12. Data Retention');

    const wasText = p.clauseText();
    card.onApply(card.proposedText, { placement: 'newClause', headingText: '12. Data Retention' });
    await new Promise(r => setTimeout(r, 0));

    const ch = p.changes().find(x => x.changeType === 'insertClause');
    assert.ok(ch, 'a whole new clause, filed as one');
    assert.equal(ch.afterClauseId, p.clause.clauseId, 'positioned after the clause it was proposed from');
    assert.match(ch.newText, /twelve \(12\) months/);
    assert.equal(p.clauseText(), wasText,
      'and the clause it follows is untouched — this is not an edit to it');
  });

  test('the anchor is re-checked at Apply, not trusted from when the panel opened', async () => {
    /* The one path that legitimately skips the PASSAGE check still depends on
       the anchor clause, and the panel is open for as long as the conversation
       lasts. Filed against a clause that has gone, the insert does not fail —
       negoDocHtml treats it as an orphan and drops it to the end of the
       document, which is a placement nobody chose and nothing announces. So it
       is refused here instead, like every other stale apply on this function. */
    const p = await page({ placement: 'newClause' });
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      'add a new clause after this one covering data retention');
    p.dropClause(p.clause.clauseId);
    const res = card.onApply(card.proposedText, { placement: 'newClause' });
    assert.equal(res.ok, false, 'refused rather than filed against a vanished anchor');
    assert.match(res.message, /no longer in the document/i);
    assert.equal(p.changes().filter(x => x.changeType === 'insertClause').length, 0);
  });
});

/* ============================================================
   A HIGHLIGHT ACROSS SEVERAL BLOCKS. Main's selection work taught this page to
   accept a drag across the paragraphs of a headingless document — the kind of
   contract that arrived as a wall of prose and was segmented one clause per
   paragraph. Replacing such a span collapses it: the head takes the new wording
   and the blocks the highlight ate are proposed for deletion.

   Adding to one must do neither of those things, and that is what these pin. */
const FLAT = ['<p>The Supplier shall deliver the goods to the named warehouse.</p>',
  '<p>Risk passes on delivery to that warehouse.</p>',
  '<p>Title passes on payment in full.</p>'].join('');

async function spanPage(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  const c = { id: 'MK-980', name: 'Flat Supply Agreement', counterparty: 'Naivas Supermarkets',
    template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [],
    rounds: [], versions: [], signatures: [], comments: [], redlineText: FLAT, format: 'rich' };
  const panel = { cards: [], said: [] };
  win.openAI = () => {}; win.renderAIFeed = () => {};
  win.aiPush = (role, m) => { if (role === 'assistant' && m && m.text) panel.said.push(String(m.text)); };
  win.copilotAvailable = () => true;
  win.copilotPropose = async () => ({ advice: 'a', proposedText: 'Delivery shall be certified in writing.',
    strict: true, placement: opts.placement || 'after' });
  win.aiOpenProposal = o => { panel.cards.push(o); return o; };
  win.aiOpenRephraseSession = o => { o.onPropose('x'); return o; };
  win.aiCloseRephraseSession = () => {};
  win.aiNormalizePlacement = v => ['replace', 'after', 'before', 'newClause']
    .includes(String(v)) ? String(v) : 'replace';
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const cls = win.negoClauseList(c);
  const parts = [
    { clauseId: cls[0].clauseId, text: 'to the named warehouse.', readings: [], occurrence: 0 },
    { clauseId: cls[1].clauseId, text: 'Risk passes on delivery', readings: [], occurrence: 0 }
  ];
  const text = 'to the named warehouse.\nRisk passes on delivery';
  await win.rlAiPropose({ c, action: win.RL_SEL_ACTIONS.find(a => a.id === 'edit'),
    text, clauseId: cls[0].clauseId, spans: true,
    passage: { text, readings: [], occurrence: 0, parts },
    opts: { side: 'owner', by: 'Young Mbagaya', persist: false }, again: () => {} });
  await new Promise(r => setTimeout(r, 0));
  return { win, c, cls, panel, card: panel.cards[panel.cards.length - 1],
    changes: () => win.negoChanges(c) };
}

describe('F97h — adding to a span keeps every block it covered', () => {
  test('a span is accepted at all on a headingless document', async () => {
    const p = await spanPage();
    assert.ok(p.card, 'main allows the drag across paragraphs; the refusal is for numbered clauses');
  });

  test('"after" edits one block and deletes none', async () => {
    /* Running an insert through the replace machinery would propose deletions
       for the blocks the reader explicitly asked to KEEP — the same silent loss
       this whole feature exists to stop, re-entering by the back door. */
    const p = await spanPage({ placement: 'after' });
    const res = p.card.onApply('Delivery shall be certified in writing.', { placement: 'after' });
    assert.equal(res.ok, true);
    await new Promise(r => setTimeout(r, 0));
    const chs = p.changes();
    assert.equal(chs.filter(x => x.changeType === 'deleteClause').length, 0,
      'nothing the reader highlighted is proposed for deletion');
    assert.equal(chs.length, 1, 'one block touched, not three');
    assert.equal(chs[0].clauseId, p.cls[1].clauseId, 'and it is the LAST block of the span');
    assert.match(chs[0].newText, /Risk passes on delivery/, 'whose own wording survives');
    assert.match(chs[0].newText, /certified in writing/);
  });

  test('"before" lands on the first block of the span', async () => {
    const p = await spanPage({ placement: 'before' });
    p.card.onApply('Delivery shall be certified in writing.', { placement: 'before' });
    await new Promise(r => setTimeout(r, 0));
    const chs = p.changes();
    assert.equal(chs.length, 1);
    assert.equal(chs[0].clauseId, p.cls[0].clauseId);
    assert.match(chs[0].newText, /The Supplier shall deliver/, 'the block survives');
  });

  test('a new clause lands after the whole highlight, not inside it', async () => {
    /* clauseId names the block the DRAG BEGAN IN. Anchoring a new clause there
       drops it into the middle of the wording the reader had just selected,
       which is the one place "after this" cannot mean. */
    const p = await spanPage({ placement: 'newClause' });
    p.card.onApply('Delivery shall be certified in writing.', { placement: 'newClause' });
    await new Promise(r => setTimeout(r, 0));
    const ins = p.changes().find(x => x.changeType === 'insertClause');
    assert.ok(ins, 'filed as a new clause');
    assert.equal(ins.afterClauseId, p.cls[1].clauseId,
      'after the last block the highlight covered');
    assert.notEqual(ins.afterClauseId, p.cls[0].clauseId,
      'not after the first, which would sit it inside the selection');
  });

  test('replacing a span still collapses it, exactly as main built it', async () => {
    const p = await spanPage({ placement: 'replace' });
    p.card.onApply('The Supplier shall deliver and certify.', { placement: 'replace' });
    await new Promise(r => setTimeout(r, 0));
    const chs = p.changes();
    assert.ok(chs.some(x => x.changeType === 'deleteClause' || /^\s*$/.test(String(x.newText || ''))
      || x.clauseId === p.cls[1].clauseId), 'the tail block is still dealt with');
    assert.ok(chs.some(x => x.clauseId === p.cls[0].clauseId && /deliver and certify/.test(x.newText || '')),
      'and the head still takes the new wording');
  });
});

/* ============================================================ */
describe('F97f — the refusals still refuse, and an insert is no exception', () => {
  test('a selection spanning two clauses files nothing', async () => {
    const p = await page();
    await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      undefined, { spans: true });
    assert.equal(p.panel.cards.length, 0, 'nothing was drafted');
    assert.equal(p.changes().length, 0, 'and nothing was filed');
    assert.ok(p.panel.said.some(s => /more than one clause/i.test(s)),
      'and it says so in the panel, where the reader is looking');
  });

  test('a selection crossing a redline files nothing', async () => {
    const p = await page();
    await p.ask('wording that is not in this clause at all', undefined, { marked: true });
    assert.equal(p.panel.cards.length, 0);
    assert.equal(p.changes().length, 0);
    assert.ok(p.panel.said.some(s => /pending edits/i.test(s)));
  });

  test('a clause that moved while the panel was open refuses at Apply', async () => {
    /* The panel is open for as long as the conversation lasts, and in that time
       a colleague can file against the same clause. An insert re-resolves its
       anchor against the LIVE wording for the same reason a replacement does:
       splicing at a drifted offset does not fail loudly, it files a redline
       that cuts a clause mid-sentence. */
    const p = await page({ placement: 'after' });
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.',
      'add three bullets after this');
    p.moveClauseUnderneath('All invoices are payable within thirty (30) days from the date of issue.',
      'This clause has been rewritten entirely by somebody else.');
    const res = card.onApply(card.proposedText, { placement: 'after' });
    assert.equal(res.ok, false, 'the apply is refused rather than spliced at a stale offset');
    assert.match(res.message, /changed while the panel was open/i);
  });

  test('a Copilot that is not connected drafts nothing and says so', async () => {
    const p = await page();
    p.win.copilotAvailable = () => false;
    await p.ask('All invoices are payable within thirty (30) days from the date of issue.');
    assert.equal(p.panel.cards.length, 0);
    assert.ok(p.panel.said.some(s => /not connected/i.test(s)));
  });
});

/* ============================================================ */
describe('F97g — the card says what it will do, and the reader can correct it', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  const card = over => ({ id: 'prop_1', status: 'open', text: BULLETS,
    clauseLabel: '2. PAYMENT TERMS', replacing: 'All invoices are payable within thirty (30) days.',
    placements: true, placement: 'after', headingText: '', ...over });

  test('an insert never says "Replacing"', () => {
    /* A card that says Replacing over wording about to be INSERTED tells the
       reader the opposite of what Apply will do, and they have no other way to
       find out before it happens. */
    const html = ai.aiProposalAnchorHtml(card());
    assert.match(html, /Inserting after/);
    assert.ok(!/Replacing/.test(html));
  });

  test('a replacement still does', () => {
    assert.match(ai.aiProposalAnchorHtml(card({ placement: 'replace' })), /Replacing/);
  });

  test('a new clause names the clause it follows, not the passage', () => {
    const html = ai.aiProposalAnchorHtml(card({ placement: 'newClause', headingText: '12. Data Retention' }));
    assert.match(html, /New clause after/);
    assert.match(html, /2\. PAYMENT TERMS/);
    assert.match(html, /12\. Data Retention/);
    assert.ok(!/payable within thirty/.test(html),
      'quoting the passage would read as though it were going somewhere');
  });

  test('the control offers all four, with the current one pressed', () => {
    const html = ai.aiProposalPlacementHtml(card());
    for (const x of ['replace', 'after', 'before', 'newClause'])
      assert.ok(html.includes(`data-place="${x}"`), `${x} is offered`);
    assert.match(html, /data-place="after"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-place="after"/);
  });

  test('and it is absent where the action never offered a choice', () => {
    assert.equal(ai.aiProposalPlacementHtml(card({ placements: false })), '');
    assert.equal(ai.aiProposalPlacementHtml(card({ status: 'applied' })), '',
      'a settled card decides nothing');
  });

  test('flipping the placement re-drafts nothing', () => {
    /* The wording on the card is what the reader has read and may have edited.
       Throwing it away because they corrected WHERE it goes would punish them
       for using the control. */
    const p = ai.aiOpenProposal({ advice: 'x', proposedText: BULLETS, placements: true,
      placement: 'replace', clauseLabel: '2. PAYMENT TERMS', replacing: 'something' });
    assert.equal(p.placement, 'replace');
    ai.aiProposalSetPlacement(p.id, 'newClause');
    assert.equal(p.placement, 'newClause');
    assert.equal(p.text, BULLETS, 'the wording is exactly as it was');
    assert.equal(p.status, 'open');
  });

  test('and a card that never offered the choice cannot be flipped', () => {
    const p = ai.aiOpenProposal({ advice: 'x', proposedText: 'y', placement: 'replace' });
    ai.aiProposalSetPlacement(p.id, 'after');
    assert.equal(p.placement, 'replace');
  });

  test('Apply hands the live placement to the caller', () => {
    /* Read off the card at the moment Apply is pressed, not off the model's
       original answer — the reader may have corrected it since, and that
       correction is the whole point of the control. */
    let saw = null;
    const p = ai.aiOpenProposal({ advice: 'x', proposedText: BULLETS, placements: true,
      placement: 'replace', onApply: (text, rec) => { saw = rec.placement; return { ok: true }; } });
    ai.aiProposalSetPlacement(p.id, 'after');
    ai.aiProposalApply(p.id);
    assert.equal(saw, 'after');
    assert.equal(p.status, 'applied');
  });
});

/* ============================================================
   The reason on the proposal card travels into the filed change
   ============================================================
   Every other way of filing a redline asks why; the Copilot's Apply was the
   one that did not, so a change drafted by the model arrived with LESS
   explanation than one typed by hand. The card now carries an optional reason
   box, and whatever it holds when Apply is pressed lands on the change as
   `why` — the field the other side reads — while `note` keeps its provenance
   job ("Copilot — Edit") and stays internal. */
describe('F97 — the reason typed on the proposal card is filed with the change', () => {
  test('card.why lands on the change as why, beside the provenance note', async () => {
    const p = await page({ wording: 'Payment within forty-five (45) days.', placement: 'replace' });
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.', 'extend to net-45');
    assert.ok(card, 'a proposal card must open');
    const res = await card.onApply(card.proposedText,
      { placement: 'replace', why: 'COPILOT-WHY our AP cycle runs monthly' });
    assert.ok(!res || res.ok !== false, 'the apply must not refuse');
    await new Promise(r => setTimeout(r, 0));
    const ch = p.win.negoChanges(p.c).slice(-1)[0];
    assert.ok(ch, 'a change was filed');
    assert.equal(ch.why, 'COPILOT-WHY our AP cycle runs monthly',
      'the reason travels on the field the other side reads');
    assert.match(String(ch.note || ''), /^Copilot — /,
      'and provenance stays its own field, internal as ever');
  });

  test('no reason typed files a change with none — skippable here too', async () => {
    const p = await page({ wording: 'Payment within forty-five (45) days.', placement: 'replace' });
    const card = await p.ask('All invoices are payable within thirty (30) days from the date of issue.', 'extend to net-45');
    await card.onApply(card.proposedText, { placement: 'replace' });
    await new Promise(r => setTimeout(r, 0));
    const ch = p.win.negoChanges(p.c).slice(-1)[0];
    assert.ok(!ch.why, 'optional means absent, not an empty string');
  });
});

