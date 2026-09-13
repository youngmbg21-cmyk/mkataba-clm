/* ============================================================
   f306 — PROMPT & BUILD: an ask box on every section of the builder

   The template builder is where a company standard is written from nothing,
   and until now it had no Copilot in it at all. This net pins the shape of
   what was added, and — more importantly — the four walls that keep it from
   becoming a liability:

     1. THE OUTLINE WRITES NO WORDING. /api/ai/outline has no slot for it.
     2. ONE DRAFTING FUNCTION, NOT TWO. Template mode is a branch inside
        copilotPropose, sharing AI_PROPOSAL_FORMAT, so "I cannot draft this"
        comes back the same way in both rooms.
     3. ONE RANGE READER, TWO CALLERS. A template and the contracts drawn from
        it cannot disagree about what "45 days" means.
     4. ONE DOOR INTO THE RECORD. Nothing pushes a block but tbAddBlock, and a
        blank nobody has kept cannot ride a save.

   Every claim here was run against the commit before the feature and fails
   there — a green tally on a check that would pass either way is a
   description, not a net.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SERVER = read('server/server.js');
const AI = read('js/ai.js');
const PB = read('js/playbook.js');
const TB = read('js/views/templatebuilder.js');
const I18N = read('js/i18n.js');

/* The route's own body, so a claim about "the outline route" cannot be
   satisfied by a sentence somewhere else in a 13,000-line file. */
const OUTLINE = (() => {
  const at = SERVER.indexOf("app.post('/api/ai/outline'");
  /* Empty rather than a throw where the route is absent, so each claim below
     fails on its own against a build without the feature. One exception at
     load time collapses thirty-nine findings into one. */
  if (at < 0) return '';
  const end = SERVER.indexOf("app.post('/api/ai/obligations'", at);
  return SERVER.slice(at, end > at ? end : at + 6000);
})();

test('f306 — the outline route exists', () => {
  assert.ok(OUTLINE.length > 0, 'POST /api/ai/outline is the one new route this feature adds');
});

describe('f306 (1) — the outline writes no wording', () => {
  test('the schema offers a heading and an intent, and nothing else', () => {
    assert.match(OUTLINE, /name: 'propose_sections'/);
    assert.match(OUTLINE, /heading: \{ type: 'string'/);
    assert.match(OUTLINE, /intent: \{ type: 'string'/);
    /* The words a drafting schema would carry. None of them may appear as a
       field the model can fill: the answer has two strings per section. */
    for (const banned of ['proposedText', 'wording:', 'clause:', 'body:', 'text:'])
      assert.ok(!OUTLINE.includes(banned), `the outline schema must not carry ${banned}`);
  });

  test('the prompt says so out loud, twice', () => {
    assert.match(OUTLINE, /HEADINGS AND INTENT ONLY/);
    assert.match(OUTLINE, /never a draft clause/);
  });

  test('it is editor-gated, metered to a person, and budgeted', () => {
    assert.match(OUTLINE, /auth, editor, rlAiLight, aiFeature\('outline'\), aiBudgetGuard, capAiInput/);
    // f203's rule: every metered call names who is paying for it
    assert.match(OUTLINE, /who: aiWho\(req\)/);
  });

  test('it is named on the spend panel, so its cost is not filed under Other', () => {
    /* f128's rule, learned the hard way by the document converter: a feature
       recordAiCall does not recognise spends into the Other bucket, where the
       one figure an admin wants becomes unreadable. */
    assert.match(SERVER, /outline: 'Template outline'/);
  });

  test('the playbook’s own positions are not the model’s to propose', () => {
    assert.match(OUTLINE, /DO NOT propose them/);
    assert.match(OUTLINE, /will be added separately/);
  });

  test('a heading that came back empty never reaches the tick list', () => {
    assert.match(OUTLINE, /typeof x\.heading === 'string' && x\.heading\.trim\(\)/);
    assert.match(OUTLINE, /Copilot proposed no sections/);
  });
});

describe('f306 (2) — one drafting function, not two', () => {
  test('copilotPropose branches to template mode and both names are published', () => {
    assert.match(AI, /if \(o\.template\) return copilotProposeTemplate\(o\);/);
    assert.match(AI, /async function copilotProposeTemplate\(o\)\{|async function copilotProposeTemplate\(o\) \{/);
    assert.match(AI, /copilotPropose,copilotProposeTemplate,AI_TEMPLATE_RULE/);
  });

  test('template mode returns through the SAME answer format', () => {
    const at = AI.indexOf('async function copilotProposeTemplate');
    const body = AI.slice(at, AI.indexOf('async function copilotPropose(opts)', at));
    assert.ok(body.includes('AI_PROPOSAL_FORMAT()'),
      'template mode must reuse AI_PROPOSAL_FORMAT — it is what makes "I cannot draft this" come back as advice with empty wording');
    assert.ok(body.includes('aiParseProposal(raw)'), 'and the same parser');
    assert.ok(body.includes('aiDropRestatedHeading'), 'the heading is already on the page');
    /* The typography repair measures the answer against a passage, and a
       section written for the first time has none. */
    assert.ok(!body.includes('aiPreserveTypography'),
      'template mode must not run the repair that measures against a passage it does not have');
  });

  test('the template rule asks for blanks, in the product’s own form', () => {
    assert.match(AI, /\{\{lower_snake_case\}\}/);
    assert.match(AI, /reusable TEMPLATE, not into one signed contract/);
    assert.match(AI, /Do not invent figures that were not asked for/);
  });

  test('it is shown only what HaTi actually has, and asked to say what it kept', () => {
    const at = AI.indexOf('async function copilotProposeTemplate');
    const body = AI.slice(at, AI.indexOf('async function copilotPropose(opts)', at));
    assert.ok(body.includes("o.library ?"), 'the workspace’s own wording is offered when there is one');
    assert.ok(body.includes("o.standard ?"), 'the playbook position, when there is one');
    assert.ok(body.includes("o.precedent ?"), 'a settled figure, when there is one');
    assert.match(body, /WHAT YOU KEPT/);
  });
});

describe('f306 (3) — one range reader, two callers', () => {
  test('pbRangeRead exists and is published', () => {
    assert.match(PB, /function pbRangeRead\(key, text\)/);
    assert.match(PB, /PB_RANGE_READERS,pbRangeRead,/);
    // f295 pins PB_TEXT_MIN and playbookText as neighbours — they stay neighbours
    assert.match(PB, /PB_TEXT_MIN,playbookText,/);
  });

  test('the heuristic asks for it by name rather than carrying the patterns', () => {
    assert.match(PB, /if\(r\.key==='paymentDays'\)\{ const m=pbRangeRead\(r\.key,t\);/);
    assert.match(PB, /else if\(r\.key==='liabilityMonths'\)\{ const m=pbRangeRead\(r\.key,t\);/);
    /* ONE home, so the two screens cannot drift: each pattern appears exactly
       once in the file, inside the reader. */
    const pay = PB.match(/within\\s\+\(\\d\{1,3\}\)/g) || [];
    assert.equal(pay.length, 1, 'the payment pattern lives in exactly one place');
  });

  test('it reads across line wrapping, and null is not zero', () => {
    const w = loadViews(['js/playbook.js'], { state: { settings: {} } });
    assert.equal(w.pbRangeRead('paymentDays', 'pay within 45\n days of the invoice')[1], '45');
    assert.equal(w.pbRangeRead('paymentDays', 'the parties shall behave'), null);
    assert.equal(w.pbRangeRead('nosuchkey', 'within 45 days of invoice'), null);
  });
});

describe('f306 (4) — a section is a reading over the flat block list', () => {
  const load = () => loadViews(
    ['js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'],
    { state: { settings: {} }, API_MODE: () => false, canEdit: () => true });

  const BLOCKS = [
    { blockType: 'branding', content: '', _k: 1 },
    { blockType: 'heading', content: 'Confidentiality', _k: 2 },
    { blockType: 'field_group', content: 'Each party shall keep the other’s information secret.', _k: 3 },
    { blockType: 'fixed_text', content: 'It survives for three (3) years.', _k: 4 },
    { blockType: 'heading', content: 'Prices and payment terms', _k: 5 },
  ];

  test('a heading owns the wording blocks that follow it', () => {
    const secs = load().tbSections(BLOCKS);
    assert.equal(secs.length, 2);
    /* Joined rather than deep-compared: the sandbox is its own realm, so an
       array it built has its own prototype and deepStrictEqual refuses it. */
    assert.equal(secs[0].body.join(','), '2,3', 'both wording blocks belong to the heading above them');
    assert.equal(secs[1].body.length, 0, 'a heading with nothing under it is still a section');
  });

  test('a block before the first heading belongs to no section', () => {
    const secs = load().tbSections(BLOCKS);
    assert.ok(!secs.some(s => s.body.includes(0)), 'the branding block is in no section');
  });

  test('the key is the heading block’s own, so an arrow press cannot move it', () => {
    const w = load();
    assert.equal(w.tbSections(BLOCKS)[0].k, 2);
    const moved = [BLOCKS[1], BLOCKS[2], BLOCKS[3], BLOCKS[0], BLOCKS[4]];
    assert.equal(w.tbSections(moved)[0].k, 2, 'the same section, at a different index');
  });

  test('the section’s text is its wording blocks joined, and nothing else', () => {
    const w = load();
    const s = w.tbSections(BLOCKS)[0];
    const t = w.tbSectionText(s, BLOCKS);
    assert.ok(t.includes('secret'), 'the first block');
    assert.ok(t.includes('three (3) years'), 'and the second');
    assert.ok(!t.includes('Confidentiality'), 'the heading is not part of the wording');
  });
});

describe('f306 (5) — your own paper, before any spend', () => {
  const w = () => loadViews(['js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'],
    { state: { settings: {} }, API_MODE: () => false, canEdit: () => true });

  test('a heading finds the workspace’s own wording through CLAUSE_KINDS', () => {
    const lib = w().tbLibraryFor('Confidentiality');
    assert.ok(lib, 'the clause library answers a confidentiality heading');
    assert.ok(lib.preferred.length > 40, 'and it carries real wording, not a label');
    assert.equal(lib.kind.category, 'Confidentiality');
  });

  test('a heading the library says nothing about offers nothing', () => {
    assert.equal(w().tbLibraryFor('Schedule 1 — the Products'), null);
    assert.equal(w().tbLibraryFor(''), null);
  });

  test('the playbook position for a section is one sentence, or nothing', () => {
    const win = w();
    assert.match(String(win.tbStandardFor('Governing law', 'other')), /Governing law/);
    assert.equal(win.tbStandardFor('Schedule 1 — the Products', 'other'), null);
  });
});

describe('f306 (6) — the playbook counts, and a deviation never blocks', () => {
  const w = () => loadViews(['js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'],
    { state: { settings: {} }, API_MODE: () => false, canEdit: () => true });

  test('an empty template covers nothing, and says how many there are', () => {
    const c = w().tbCoverage([], 'other');
    assert.equal(c.covered, 0);
    assert.ok(c.total > 0, 'the baseline book has positions');
    assert.ok(c.rows.every(r => r.state === 'open'));
  });

  test('a written section covers its position', () => {
    const blocks = [
      { blockType: 'heading', content: 'Governing law and dispute resolution', _k: 1 },
      { blockType: 'field_group', content: 'This Agreement is governed by the laws of Kenya.', _k: 2 },
    ];
    const c = w().tbCoverage(blocks, 'other');
    const law = c.rows.find(r => r.category === 'Governing law');
    assert.equal(law.state, 'hit');
    assert.equal(law.where.head, 'Governing law and dispute resolution');
    assert.equal(c.covered, 1);
  });

  test('a HEADING with no wording under it covers nothing', () => {
    const c = w().tbCoverage([{ blockType: 'heading', content: 'Governing law', _k: 1 }], 'other');
    assert.equal(c.rows.find(r => r.category === 'Governing law').state, 'open',
      'an empty section is not a covered position');
  });

  test('a figure outside a stated range is a deviation, and is counted as covered', () => {
    const blocks = [
      { blockType: 'heading', content: 'Prices and payment terms', _k: 1 },
      { blockType: 'field_group', content: 'The Buyer shall pay within 60 days of the invoice.', _k: 2 },
    ];
    const c = w().tbCoverage(blocks, 'other');
    const pay = c.rows.find(r => r.category === 'Payment terms');
    assert.equal(pay.state, 'dev', '60 against an outer limit of 45');
    assert.equal(pay.figure, 60);
    assert.equal(pay.want, 45);
    assert.equal(c.deviations, 1);
    /* THE OWNER'S RULING, 12 Sep 2026: a deviation is recorded, never a block.
       It counts towards coverage precisely because the section IS written. */
    assert.ok(c.covered >= 1, 'a deviation still covers the position');
  });

  test('a figure inside the range is aligned', () => {
    const blocks = [
      { blockType: 'heading', content: 'Prices and payment terms', _k: 1 },
      { blockType: 'field_group', content: 'The Buyer shall pay within 30 days of the invoice.', _k: 2 },
    ];
    const pay = w().tbCoverage(blocks, 'other').rows.find(r => r.category === 'Payment terms');
    assert.equal(pay.state, 'hit');
    assert.equal(w().tbCoverage(blocks, 'other').deviations, 0);
  });

  test('the book is named, never guessed at silently', () => {
    const win = w();
    assert.equal(win.tbPbKey('nda'), 'nda');
    assert.equal(win.tbPbKey('procurement'), 'supply');
    assert.equal(win.tbPbKey('employment'), '_default', 'nothing maps by guesswork');
    assert.ok(String(win.tbCoverage([], 'other').label).length > 0, 'the card can print which book answered');
  });
});

describe('f306 (7) — one door into the record', () => {
  test('nothing pushes a block but tbAddBlock', () => {
    const pushes = TB.match(/_tb\.blocks\.push\(/g) || [];
    assert.equal(pushes.length, 1, 'exactly one push, and it is tbAddBlock’s');
    const at = TB.indexOf('function tbAddBlock');
    const body = TB.slice(at, at + 700);
    assert.ok(body.includes('_tb.blocks.push('), 'the one push is inside tbAddBlock');
  });

  test('the outline and the coverage door both press that act', () => {
    assert.match(TB, /function tbOutlineAdd\(\)[\s\S]{0,400}tbAddBlock\('heading', x\.heading\)/);
    assert.match(TB, /data-tb-cover-add[\s\S]{0,400}tbAddBlock\('heading', name\)/);
  });

  test('the add-block button no longer carries its own copy of the act', () => {
    assert.match(TB, /getElementById\('tb-addblock'\)[\s\S]{0,200}tbAddBlock\(document\.getElementById\('tb-addtype'\)\.value\)/);
  });

  test('accepted wording lands on the block content a keystroke fills', () => {
    const at = TB.indexOf('async function tbAccept');
    const body = TB.slice(at, at + 600);
    assert.match(body, /_tb\.blocks\[bi\]\.content = a\.text/);
    assert.match(body, /_tb\.dirty = true/);
  });
});

describe('f306 (8) — a blank nobody kept cannot ride a save', () => {
  test('proposals are held outside _tb.fields', () => {
    assert.match(TB, /_tb\.proposed = \(_tb\.proposed \|\| \[\]\)\.concat\(rows\)/);
    const at = TB.indexOf('async function tbBlanksRun');
    const body = TB.slice(at, at + 1200);
    assert.ok(!body.includes('_tb.fields.push'), 'the reader never writes a field');
  });

  test('keeping one places the marker AND creates the field, in that order', () => {
    const at = TB.indexOf('function tbKeepBlank');
    const body = TB.slice(at, at + 1200);
    assert.ok(body.indexOf('{{') < body.indexOf('_tb.fields.push'),
      'the marker goes into the wording before the field exists — a field with nothing pointing at it is the bug this order prevents');
    assert.match(body, /_tb\.proposed\.splice\(i, 1\)/);
  });

  test('tbSave still writes the same two shapes, and no client key', () => {
    const at = TB.indexOf('async function tbSave');
    const body = TB.slice(at, at + 700);
    assert.match(body, /blocks: _tb\.blocks\.map\(\(b, i\) => \(\{ orderIndex: i, blockType: b\.blockType, content: b\.content \}\)\)/);
    assert.ok(!body.includes('_tb.proposed'), 'a proposal is not part of a save');
    assert.ok(!body.includes('_k'), 'the client key never travels');
  });
});

describe('f306 (9) — every failure speaks, and every string is in both books', () => {
  test('each way it can fail has its own sentence', () => {
    for (const k of ['tb_pb_nokey', 'tb_pb_ceiling', 'tb_pb_busy', 'tb_pb_failed', 'tb_pb_no_wording'])
      assert.ok(I18N.includes(k + ':'), `${k} is written down`);
    assert.match(TB, /function tbSay\(e\)/);
    assert.match(TB, /kind === 'noKey'/);
    assert.match(TB, /kind === 'spendCap'/);
    assert.match(TB, /kind === 'rateLimit'/);
  });

  test('an answer that is not wording is kept as an answer, not filed', () => {
    const at = TB.indexOf('async function tbDraft');
    const body = TB.slice(at, at + 2200);
    assert.match(body, /if \(!String\(made\.proposedText \|\| ''\)\.trim\(\)\)/);
    assert.match(body, /answered:/);
    assert.ok(!/answered[\s\S]{0,200}_tb\.blocks/.test(body), 'nothing reaches the record on that branch');
  });

  test('no key is drawn as a sentence on the section, never silence', () => {
    assert.match(TB, /copilotAvailable\(\)\)\)\n\s*return `<div[^`]*tb_pb_nokey/);
  });

  test('the two dictionaries carry the same Prompt & Build keys', () => {
    const cut = I18N.indexOf("tb_add_block: 'Lägg");
    assert.ok(cut > 0, 'the Swedish book is where it was');
    const keys = side => {
      const out = new Set();
      for (const m of side.matchAll(/^ {4}(tb_pb_[a-z0-9_]+):/gm)) out.add(m[1]);
      return out;
    };
    const en = keys(I18N.slice(0, cut));
    const sv = keys(I18N.slice(cut));
    assert.ok(en.size >= 40, 'the feature carries its own strings');
    assert.deepEqual([...en].filter(k => !sv.has(k)), [], 'nothing is English-only');
    assert.deepEqual([...sv].filter(k => !en.has(k)), [], 'and nothing is Swedish-only');
  });
});

describe('f306 (10) — what the screen refuses to grow', () => {
  test('no band, strip, banner or notice was added (the Six Questions, Q2)', () => {
    for (const w of ['class="band"', 'ct_banner', 'rl-notices', 'hm-banner'])
      assert.ok(!TB.includes(w), `${w} has no business on this screen`);
  });

  test('no second preview pane — the Design step already previews', () => {
    assert.ok(!TB.includes('docPaperHeadHtml') && !TB.includes('renderDocHtml'),
      'the builder draws no paper, and this change did not give it any');
  });

  test('the opening ask is drawn on an empty template only', () => {
    assert.match(TB, /if \(_tb\.blocks\.length && !_tb\.outline\)/);
    assert.match(TB, /tb_pb_building/);
  });
});

/* ============================================================
   f306 (11) — and it draws. The three sections above read functions; this one
   reads the MARKUP the builder actually generates, because a reading that is
   right and a screen that never prints it is the fault this codebase has paid
   for most often.
   ============================================================ */
describe('f306 (11) — what the screen prints', () => {
  const VERSION = blocks => ({
    version: { versionNumber: 1, status: 'draft' },
    blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })),
    fields: [],
  });
  const stage = async (blocks, { configured = true } = {}) => {
    const sandbox = loadViews(
      ['js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'],
      {
        state: { contracts: [], settings: {}, aiConfigured: configured, view: 'tpl-builder' },
        API_MODE: () => true,
        canEdit: () => true,
        copilotAvailable: () => configured,
        api: async (p) => {
          if (p === 'templates/tpl_1') return { template: { id: 'tpl_1', name: 'Distributor Agreement', category: 'other' } };
          if (p === 'templates/tpl_1/versions/tv_1') return VERSION(blocks);
          if (p === 'org/branding') return { branding: { logoUrl: null, companyName: 'Mkataba', registrationNumber: '', address: '', defaultFooterText: '' } };
          throw new Error('unexpected api call: ' + p);
        },
      });
    await sandbox.openTemplateBuilder('tpl_1', 'tv_1');
    await new Promise(r => setTimeout(r, 0));
    return sandbox.document.getElementById('content').innerHTML;
  };

  test('an EMPTY template opens on the sentence box, and says it writes no wording', async () => {
    const html = await stage([]);
    assert.ok(html.includes('Describe the agreement you need'), 'the opening ask is drawn');
    assert.ok(html.includes('Propose sections'), 'and its press');
    assert.ok(html.includes('writes no wording at this step'), 'and the promise under it');
    assert.ok(html.includes('id="tb-brief-in"'), 'a real box, not a picture of one');
  });

  test('a template with blocks in it does NOT draw the sentence box', async () => {
    const html = await stage([['heading', 'Confidentiality']]);
    assert.ok(!html.includes('Describe the agreement you need'),
      'the opening ask is for an empty template only — the owner’s ruling, 12 Sep 2026');
  });

  test('every empty section carries an ask box, on its own heading row', async () => {
    const html = await stage([['heading', 'Confidentiality'], ['heading', 'Brand and trade marks']]);
    assert.equal((html.match(/Tell Copilot what this section should say/g) || []).length, 2,
      'one box per section, and no more');
    assert.ok(html.includes('Draft this section'), 'and the press beside it');
  });

  test('a section the clause library answers offers it FREE, and says so', async () => {
    const html = await stage([['heading', 'Confidentiality']]);
    assert.ok(/Use our /.test(html), 'the workspace’s own wording is offered');
    assert.ok(html.includes('no read — this one is in your library'),
      'and the cost line says it spends nothing');
  });

  test('a section the library says nothing about costs one read', async () => {
    const html = await stage([['heading', 'Brand and trade marks']]);
    assert.ok(!/Use our /.test(html), 'nothing of the workspace’s own to offer');
    assert.ok(html.includes('one read'), 'so the press has a price on it');
  });

  test('a section that already carries wording gets no ask box', async () => {
    const html = await stage([['heading', 'Confidentiality'], ['field_group', 'Each party shall keep the other’s information secret.']]);
    assert.ok(!html.includes('Tell Copilot what this section should say'),
      'the box is for an empty section; a written one is left alone');
  });

  test('the playbook card draws, names its book, and offers a door per gap', async () => {
    const html = await stage([['heading', 'Confidentiality']]);
    assert.ok(html.includes('Against your playbook'), 'the card is on the page');
    assert.ok(html.includes('All contracts (baseline)'), 'and names which book answered');
    assert.ok(html.includes('+ Add the section'), 'a missing position is a door');
    assert.ok(html.includes('data-tb-cover-add'), 'a real press');
    assert.ok(html.includes('Counted from the playbook'), 'and says where the count comes from');
  });

  test('the count sits in the card head, not in a band', async () => {
    const html = await stage([['heading', 'Confidentiality']]);
    assert.ok(html.includes('Playbook'), 'the count is drawn');
    const head = html.slice(html.indexOf('tb-addtype') - 1200, html.indexOf('tb-addtype'));
    assert.ok(head.includes('Playbook'), 'beside the Add block control, in the card head');
  });

  test('with no Copilot key the section says so and keeps the ordinary box', async () => {
    const html = await stage([['heading', 'Confidentiality']], { configured: false });
    assert.ok(html.includes('Copilot is not connected'), 'the reason is on the section');
    assert.ok(!html.includes('Draft this section'), 'and nothing pretends to work');
    assert.ok(html.includes('Add a wording block with + Add block'),
      'a section with nothing to type into is told how to get a box, not pointed at one that is not there');
  });

  test('a section that HAS a wording block is pointed at it, not at Add block', async () => {
    const html = await stage([['heading', 'Confidentiality'], ['field_group', '']], { configured: false });
    assert.ok(html.includes('Write this section yourself'), 'the box is right there');
    assert.ok(!html.includes('Add a wording block with'), 'so it is not told to make one');
    assert.ok(html.includes('Wording — use {{field_key}} where a blank sits'),
      'and the plain textarea this screen has always had is untouched');
  });

  test('the block list itself is unchanged — arrows, delete, add, all still drawn', async () => {
    const html = await stage([['heading', 'Confidentiality'], ['field_group', 'x']]);
    assert.ok(html.includes('data-tb-up="0"') && html.includes('data-tb-down="0"'), 'the arrows');
    assert.ok(html.includes('data-tb-del="1"'), 'the delete');
    assert.ok(html.includes('tb-addblock') && html.includes('tb-addtype'), 'the add control');
    assert.ok(html.includes('data-tb-content="1"'), 'and the ordinary editor');
  });
});
