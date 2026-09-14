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
    assert.match(TB, /function tbOutlineAdd\(opts = \{\}\)[\s\S]{0,400}tbAddBlock\('heading', x\.heading\)/);
    /* The Playbook tab's door: the handler, not the button's markup. */
    assert.match(TB, /hit\('\[data-tb-cover-add\]'\)[\s\S]{0,500}tbAddBlock\('heading', name\)/);
  });

  test('the add-block button no longer carries its own copy of the act', () => {
    assert.match(TB, /hit\('#tb-addblock'\)[\s\S]{0,200}tbAddBlock\(document\.getElementById\('tb-addtype'\)\.value\)/);
  });

  test('five doors arrive at one reading of the section in hand', () => {
    /* tbFocus is the only writer of _tb.focus besides the open (the first
       section still to write). */
    assert.equal((TB.match(/_tb\.focus = /g) || []).length, 2, 'tbFocus, and the open');
    for (const door of ['[data-tb-tag]', '[data-tb-step]', '[data-tb-next]', '[data-tb-cover-draft]', '[data-tb-pick]'])
      assert.ok(TB.includes(`hit('${door}')`), `${door} is a door`);
    assert.match(TB, /hit\('\[data-tb-tag\]'\)\)\) \{ tbFocus\(/);
    assert.match(TB, /hit\('\[data-tb-step\]'\)\)\) \{ tbStep\(/);
    assert.match(TB, /function tbStep\(d\)[\s\S]{0,300}tbFocus\(/);
  });

  test('Apply, typing and a kept blank are the only three things that write a block', () => {
    const writes = TB.match(/_tb\.blocks\[[a-z]+\]\.content = [^;]+;/g) || [];
    assert.deepEqual(writes.map(w => w.replace(/\s+/g, ' ')), [
      '_tb.blocks[bi].content = a.text;',
      '_tb.blocks[bi].content = _tb.blocks[bi].content.split(p.find).join(\'{{\' + p.key + \'}}\');',
      '_tb.blocks[i].content = tbReadEditable(el);',
    ]);
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

  test('no key is drawn as a sentence in the rail, never silence', () => {
    assert.match(TB, /if \(!on\) return tbAiHtml\(i18t\('tb_pb_nokey'\), 'amber'\)/);
    assert.match(TB, /\$\{on \? '' : 'disabled'\}>➤/, 'and the send button is greyed with the reason on its hover');
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
   for most often. Since 13 Sep 2026 the builder is THE PAPER AND THE RAIL:
   the page is painted once and the paper and the rail into their own slots,
   so the two slots are read here beside the page.
   ============================================================ */
describe('f306 (11) — what the screen prints', () => {
  const VERSION = blocks => ({
    version: { versionNumber: 1, status: 'draft' },
    blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })),
    fields: [],
  });
  const stage = async (blocks, { configured = true, width } = {}) => {
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
    if (width) { sandbox.innerWidth = width; if (sandbox.window) sandbox.window.innerWidth = width; }
    await sandbox.openTemplateBuilder('tpl_1', 'tv_1');
    await new Promise(r => setTimeout(r, 0));
    const read = () => ({
      page: sandbox.document.getElementById('content').innerHTML,
      paper: sandbox.document.getElementById('tb-paperslot').innerHTML,
      rail: sandbox.document.getElementById('tb-railslot').innerHTML,
    });
    return { w: sandbox, ...read(), read };
  };

  test('an EMPTY template opens on the one question, in the rail, and says it writes no wording', async () => {
    const s = await stage([]);
    assert.ok(s.rail.includes('What is this template for?'), 'the opening question is the rail’s first line');
    assert.ok(s.rail.includes('not the wording'), 'and it says no wording is written at this step');
    assert.ok(s.rail.includes('id="tb-ask"'), 'a real box, not a picture of one');
    assert.ok(s.rail.includes('e.g. Two-year distributor agreement'), 'with the sentence box’s own placeholder');
    assert.ok(s.rail.includes('No sections yet'), 'and the foot says where things stand');
    assert.ok(s.paper.includes('Distributor Agreement'), 'the paper carries the template’s name as its title');
  });

  test('a template with blocks in it does NOT ask the opening question', async () => {
    const s = await stage([['heading', 'Confidentiality']]);
    assert.ok(!s.rail.includes('What is this template for?'),
      'the opening ask is for an empty template only — the owner’s ruling, 12 Sep 2026');
  });

  test('every empty section is drawn on the paper with its placeholder; the ask box exists ONCE, in the rail', async () => {
    const s = await stage([['heading', 'Confidentiality'], ['heading', 'Brand and trade marks']]);
    assert.equal((s.paper.match(/data-tb-ph="/g) || []).length, 2, 'one placeholder per empty section');
    assert.equal((s.rail.match(/id="tb-ask"/g) || []).length, 1, 'one box, in the rail');
    assert.ok(!s.paper.includes('id="tb-ask'), 'and none under the headings');
    assert.equal((s.paper.match(/data-tb-tag="/g) || []).length, 2, 'the ✦ tag on every section');
  });

  test('the section in hand at open is the first still to write, and the rail names it', async () => {
    const s = await stage([['heading', 'Parties'], ['field_group', 'This Agreement is made between…'], ['heading', 'Confidentiality']]);
    assert.ok(s.rail.includes('Section 2 · Confidentiality'), 'the focus card names the empty one');
    assert.ok(s.paper.includes('data-tb-sec="3"') && /data-tb-sec="3"[^>]*is-on|is-on[^>]*data-tb-sec="3"/.test(s.paper), 'and the paper frames it');
  });

  test('a section the clause library answers offers it FREE, and says so', async () => {
    const s = await stage([['heading', 'Confidentiality']]);
    assert.ok(/Use our /.test(s.rail), 'the workspace’s own wording is offered as a chip');
    assert.ok(s.rail.includes('no read — this one is in your library'), 'and the chip says it spends nothing');
  });

  test('a section the library says nothing about costs one read', async () => {
    const s = await stage([['heading', 'Brand and trade marks']]);
    assert.ok(!/Use our /.test(s.rail), 'nothing of the workspace’s own to offer');
    assert.ok(s.rail.includes('title="one read"'), 'so the send has a price on it');
  });

  test('a section that already carries wording is greeted, not asked, and gets the four refinements', async () => {
    const s = await stage([['heading', 'Confidentiality'], ['field_group', 'Each party shall keep the other’s information secret.']]);
    assert.ok(!s.paper.includes('data-tb-ph='), 'no placeholder under a written section');
    for (const chip of ['Shorter', 'Firmer', 'Make it mutual', 'Plain English']) assert.ok(s.rail.includes(`>${chip}<`), chip);
    assert.ok(s.rail.includes('Tell me what'), 'the thread opens with a greeting for the section');
  });

  test('the playbook is a TAB on the rail: it names its book and offers a door per gap', async () => {
    const s = await stage([['heading', 'Confidentiality']]);
    s.w.tbSetTab('playbook');
    const rail = s.read().rail;
    assert.ok(rail.includes('Against your playbook'), 'the card is on the tab');
    assert.ok(rail.includes('All contracts (baseline)'), 'and names which book answered');
    assert.ok(rail.includes('data-tb-cover-add') || rail.includes('data-tb-cover-draft'), 'a missing position is a door');
    assert.ok(rail.includes('Counted from the playbook'), 'and says where the count comes from');
  });

  test('the count sits on the tab and in the card head — nowhere above the paper', async () => {
    const s = await stage([['heading', 'Confidentiality']]);
    s.w.tbSetTab('playbook');
    const rail = s.read().rail;
    assert.match(rail, /class="chip [a-z]+">\d+ of \d+</, 'n of m in the card head');
    const strip = s.page.slice(0, s.page.indexOf('tb-paperslot'));
    assert.ok(!strip.includes('Playbook'), 'the strip above the paper says nothing about the playbook — one place says it');
  });

  test('with no Copilot key the rail says so, the box is greyed, and the paper still types', async () => {
    const s = await stage([['heading', 'Confidentiality']], { configured: false });
    assert.ok(s.rail.includes('Copilot is not connected'), 'the reason is in the rail');
    assert.match(s.rail, /<textarea id="tb-ask"[^>]*disabled/, 'the box is greyed');
    assert.ok(s.paper.includes('contenteditable="true"'), 'and the paper is still a place to write');
  });

  test('the paper keeps every block control — arrows, delete, add, and the editable itself', async () => {
    const s = await stage([['heading', 'Confidentiality'], ['field_group', 'x']]);
    assert.ok(s.paper.includes('data-tb-up="0"') && s.paper.includes('data-tb-down="0"'), 'the arrows');
    assert.ok(s.paper.includes('data-tb-del="1"'), 'the delete');
    assert.ok(s.paper.includes('id="tb-addblock"') && s.paper.includes('id="tb-addtype"'), 'the add control');
    assert.ok(s.paper.includes('data-tb-content="1"'), 'and the editable');
  });

  test('a blank is a chip on the paper, and reads back as its marker', async () => {
    const s = await stage([['heading', 'Payment'], ['field_group', 'Pay within {{payment_days}} days.']]);
    assert.ok(s.paper.includes('data-tb-blank="payment_days"'), 'the marker is drawn as a chip');
    assert.ok(s.paper.includes('tb-bl is-new'), 'amber, because no field is declared for it yet');
    assert.ok(!s.paper.includes('{{payment_days}}'), 'the raw marker is not on the paper');
    const node = { childNodes: [
      { nodeType: 3, nodeValue: 'Pay within ' },
      { nodeType: 1, tagName: 'SPAN', getAttribute: k => (k === 'data-tb-blank' ? 'payment_days' : null), childNodes: [] },
      { nodeType: 3, nodeValue: ' days.' }] };
    assert.equal(s.w.tbReadEditable(node), 'Pay within {{payment_days}} days.', 'the record never learns the chips exist');
  });

  test('below 1,024px the rail is not drawn and the paper still types', async () => {
    const s = await stage([['heading', 'Confidentiality']], { width: 1000 });
    assert.equal(s.rail, '', 'no rail');
    assert.ok(!s.paper.includes('data-tb-tag='), 'and no ✦, because there is no rail to receive it');
    assert.ok(s.paper.includes('contenteditable="true"'), 'the paper is still a place to write');
    assert.ok(s.w.TB_RAIL_MIN === 1024, 'the clause editor’s own line');
  });

  test('Apply lands on the paper, the receipt names the section, and the walk moves on to the next empty one', async () => {
    const s = await stage([['heading', 'Parties'], ['field_group', ''], ['heading', 'Definitions'], ['field_group', '']]);
    s.w.tbSetWalk(true);
    s.w.tbFocus(1);
    s.w.tbTurn(1, { who: 'ai', text: 'Drafted.', card: { src: 'Copilot drafted', tone: 'ai', text: 'This Agreement is made between the parties named below.', before: '' } });
    await s.w.tbAccept(1, 0);
    const out = s.read();
    assert.ok(out.paper.includes('This Agreement is made between the parties named below.'), 'the wording is on the paper');
    assert.ok(out.rail.includes('Applied to 1 · Parties'), 'the receipt names the section');
    assert.ok(out.rail.includes('Section 2 · Definitions'), 'and the next empty section is now in hand');
    assert.ok(out.rail.includes('what should it say?'), 'with its question, in HaTi’s own words');
  });

  test('the walk’s question is HaTi’s own — no read', () => {
    const body = TB.slice(TB.indexOf('function tbQuestionFor'), TB.indexOf('function tbRestsLine'));
    assert.ok(!/api\(|copilotPropose|copilotAsk/.test(body), 'composed from the outline and the playbook, never asked of the model');
  });

  /* ============================================================
     THE DIVIDER (Young asked 14 Sep 2026: "you can drag / pull a separator
     one side to be bigger than the other. Leave all else the same.")
     The clause editor's own mechanism, ported; the arithmetic is proved here
     without a browser and the drag is driven in prompt-and-build-verify 12.
     ============================================================ */
  test('the page carries ONE separator between the paper and the rail, and nothing else on it moved', async () => {
    const s = await stage([['heading', 'Confidentiality'], ['heading', 'Term']]);
    assert.equal((s.page.match(/id="tb-resizer"/g) || []).length, 1, 'one handle');
    assert.match(s.page, /id="tb-resizer" class="tb-resizer" role="separator" aria-orientation="vertical" tabindex="0"/, 'a real separator a keyboard can reach');
    assert.ok(s.page.includes('id="tb-paperslot"') && s.page.includes('id="tb-railslot"'), 'the paper and the rail are still the two slots');
    assert.equal((s.paper.match(/data-tb-tag="/g) || []).length, 2, 'the ✦ tags are untouched');
    assert.ok(s.rail.includes('id="tb-ask"'), 'and the rail still holds the one ask box');
  });

  test('the sheet dresses the handle itself and hides it where there is no rail', () => {
    const css = TB.slice(TB.indexOf('function tbStyleHtml'), TB.indexOf('function tbStyleHtml') + 6000);
    assert.match(css, /\.tb-resizer\{position:absolute;top:0;bottom:0;width:14px/, 'the editor\'s handle, value for value, in this page\'s own sheet');
    assert.match(css, /\.tb-resizer\[data-rl-at-limit\] span\{background:var\(--st-amber-dot\)\}/, 'and it says when it will not go further');
    assert.match(css, /\.tb-page\.no-rail > \.tb-resizer\{display:none\}/, 'no rail, no handle');
    assert.match(css, /\.tb-page\{[^}]*position:relative/, 'the grid is the handle\'s frame');
  });

  test('the arithmetic: both stops in both directions, and the floors are the editor\'s own', async () => {
    const s = await stage([]);
    const w = s.w;
    const CE = read('js/views/clauseeditor.js');
    const ce = /const CE_LEFT_MIN = (\d+), CE_RIGHT_MIN = (\d+);/.exec(CE);
    assert.ok(ce, 'the editor states its floors');
    assert.equal(w.TB_LEFT_MIN, Number(ce[1]), 'the paper\'s floor is the editor\'s paper floor');
    assert.equal(w.TB_RIGHT_MIN, Number(ce[2]), 'the rail\'s floor is the editor\'s rail floor — it is the same rail');
    const J = v => JSON.parse(JSON.stringify(v));   /* the sandbox's objects are another realm's */
    assert.deepEqual(J(w.tbSplit(1200, 0.5)), { left: 600, limit: null }, 'inside both stops');
    assert.deepEqual(J(w.tbSplit(1200, 0.1)), { left: 540, limit: 'min' }, 'on a wide window the FRACTION floor binds and says min');
    assert.deepEqual(J(w.tbSplit(800, 0.45)), { left: w.TB_LEFT_MIN, limit: 'min' }, 'on a narrower one the PIXEL floor binds and says min');
    assert.deepEqual(J(w.tbSplit(1200, 0.95)), { left: 1200 - w.TB_RIGHT_MIN, limit: 'max' }, 'the rail keeps its floor at the other end');
    assert.equal(w.tbSplit(500, 0.5).left, 250, 'on a window too narrow for both floors the fraction alone answers');
    assert.equal(w.TB_SPLIT_KEY, 'hati.v1.tbLeftFrac', 'its own memory — never the editor\'s key');
  });

  test('the wiring: the handle is bound once, from the paper\'s own wiring, and observed', () => {
    assert.match(TB, /_tb\._fits = tbRailFits\(\);\n  tbWireSplit\(\);/, 'wired with the page');
    const body = TB.slice(TB.indexOf('function tbWireSplit'), TB.indexOf('function tbWireSplit') + 3500);
    assert.match(body, /rez\.dataset\.tbSplitBound/, 'bound once per element');
    assert.match(body, /pointerFrac/, 'the pointer\'s position, never its travel');
    assert.match(body, /grabDx = \(hb\.left \+ hb\.width \/ 2\) - e\.clientX/, 'a grab offset');
    assert.match(body, /new ResizeObserver\(\(\) => tbFitSplit\(\)\)/, 'the grid is observed');
    assert.match(body, /e\.key === 'Home' \|\| e\.key === 'Enter'/, 'the keyboard puts the sheet\'s columns back');
    assert.match(body, /rez\.addEventListener\('dblclick', \(\) => \{ clear\(\); tbFitSplit\(\); \}\)/, 'so does a double-click');
    const fit = TB.slice(TB.indexOf('function tbFitSplit'), TB.indexOf('function tbWireSplit'));
    assert.match(fit, /_tbPad\(grid\)\.l/, 'the grid\'s own padding is taken off, or the handle sits a page-margin left of the seam');
  });
  /* ============================================================
     THE PAPER SCROLLS INSIDE ITS COLUMN AND THE RAIL STAYS (Young asked
     14 Sep 2026: "a scrolling feature for the contract being created on the
     left just like in the editor page … the right hand side … should stay
     intact and not move"). The page is --view-h tall, as the register and the
     contract room are; the geometry is measured in prompt-and-build-verify 13.
     Every claim here is red at the parent.
     ============================================================ */
  test('everything under the strip is inside ONE scroller; the strip and the rail are outside it', async () => {
    /* The stage's DOM is a fake (test/dom.js), so the page is read as the
       markup it printed; the geometry is measured in prompt-and-build-verify 13. */
    const s = await stage([['heading', 'Confidentiality'], ['fixed_text', 'Each party keeps the other\'s secrets.']]);
    const at = m => s.page.indexOf(m);
    const open = at('<div class="tb-scroll scroll-thin" id="tb-scroll">');
    assert.ok(open > 0, 'the paper column has its own scroller, wearing the shell\'s thin scrollbar');
    assert.equal((s.page.match(/id="tb-scroll"/g) || []).length, 1, 'exactly one');
    assert.ok(at('<div class="tb-left">') < at('id="tb-back"') && at('id="tb-back"') < open, 'the strip comes first in the paper\'s column, above the scroller');
    for (const inside of ['id="tb-paperslot"', 'id="tb-branding"'])
      assert.ok(open < at(inside) && at(inside) < at('id="tb-railslot"'), inside + ' is inside the scroller, before the rail\'s slot');
    /* NO SECOND SAVE AND PUBLISH (Young ruled 14 Sep 2026): the strip does not
       scroll away, so the foot pair was the same two acts twice on one screen. */
    for (const gone of ['tb-strip-foot', 'tb-save-bottom', 'tb-publish-bottom', 'tb-dirty-bottom'])
      assert.ok(!s.page.includes(gone), gone + ' is retired');
    assert.equal((s.page.match(/ui-btn-primary/g) || []).length, 1, 'ONE filled button on the page — Publish, in the strip');
    assert.equal((s.page.match(/id="tb-save"/g) || []).length, 1, 'and one Save');
    assert.ok(at('id="tb-railslot"') > 0 && at('id="tb-resizer"') > at('id="tb-railslot"'), 'the rail\'s slot and the handle are the column\'s siblings, after it');
  });

  test('the sheet: the page is --view-h tall, the column stacks strip over scroller, the rail is the row\'s height and never sticky', () => {
    const css = TB.slice(TB.indexOf('function tbStyleHtml'), TB.indexOf('function tbStyleHtml') + 9000);
    assert.match(css, /\.tb-page\{[^}]*height:var\(--view-h\)[^}]*\}/, 'the shell\'s own measured room, as the register and the contract room');
    assert.match(css, /\.tb-page\{[^}]*grid-template-rows:minmax\(0,1fr\)/, 'one row that may shrink');
    assert.match(css, /\.tb-left\{min-width:0;min-height:0;display:flex;flex-direction:column\}/, 'the column stacks the strip over the scroller');
    assert.match(css, /\.tb-left > \.tb-strip\{flex:none\}/, 'the strip keeps its height');
    assert.match(css, /\.tb-scroll\{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 2px 28px\}/, 'the scroller takes the rest, with no padding above the paper (refusal 3)');
    assert.match(css, /#tb-railslot\{min-width:0;min-height:0;display:flex;flex-direction:column\}/, 'the rail\'s slot is the row');
    const rail = /\.tb-rail\{([^}]*)\}/.exec(css);
    assert.ok(rail, 'the rail rule');
    assert.ok(!/sticky|100vh|420px|align-self/.test(rail[1]), 'never sticky, never the window\'s height, no floor of its own: ' + rail[1]);
    assert.match(rail[1], /flex:1;min-height:0/, 'it fills its slot');
    assert.match(css, /\.tb-page\.no-rail > #tb-railslot\{display:none\}/, 'no rail, no empty second row');
  });

  test('the shell\'s scrollbar channel is given back while the page is up, and returned on the way out', async () => {
    const s = await stage([['heading', 'Term']]);
    const d = s.w.document;
    /* The stage has no shell and its elements' classList is a stub: give the
       scroller the class is painted on a classList that remembers, then paint. */
    const sc = d.getElementById('content-scroll');
    const cls = new Set();
    sc.classList = { add: c => cls.add(c), remove: c => cls.delete(c), toggle: (c, on) => { if (on) cls.add(c); else cls.delete(c); return cls.has(c); }, contains: c => cls.has(c) };
    s.w.tbPaint();
    assert.ok(cls.has('view-fixed'), 'the class VIEW_OWNS_HEIGHT paints for the five views, painted by the page itself');
    const APP = read('js/app.js');
    assert.match(APP, /classList\.toggle\('view-fixed', VIEW_OWNS_HEIGHT\.includes\(view\)\)/, 'the shell still paints the same class from the view name');
    assert.match(TB, /classList\.toggle\('view-fixed', !!on\)/, 'and this page toggles that class and no other');
    /* The two ways out, read at their doors (the stub DOM cannot press Back;
       prompt-and-build-verify 13f presses it for real). */
    const leave = TB.slice(TB.indexOf('function tbLeave'), TB.indexOf('async function tbSave'));
    assert.match(leave, /const go = \(\) => \{ tbGutter\(false\); openTemplateLibDetail\(_tb\.tid\); \};/, 'Back gives it back before the template\'s own page paints');
    const pub = TB.slice(TB.indexOf('async function tbPublish'), TB.indexOf('function tbFieldModal'));
    assert.ok(pub.indexOf('tbGutter(false)') > pub.indexOf('tbSave(true)') && pub.indexOf('tbGutter(false)') < pub.indexOf('openDesignStep('), 'Publish gives it back before the Design step paints');
  });

  test('a repaint holds the reader\'s place in the paper, synchronously and once', () => {
    const paint = TB.slice(TB.indexOf('function tbPaint(opts = {})'), TB.indexOf('THE DIVIDER (Young asked'));
    assert.ok(paint.indexOf('const held = opts.fresh ? null : tbHoldScroll();') > 0 && paint.indexOf('const held = opts.fresh ? null : tbHoldScroll();') < paint.indexOf('.innerHTML = `'), 'held before the write, unless this is a fresh open');
    assert.match(TB.slice(TB.indexOf('async function openTemplateBuilder'), TB.indexOf('PROMPT & BUILD')), /tbPaint\(\{ fresh: true \}\);/, 'a fresh open is a navigation and lands at the top of the paper');
    assert.ok(paint.indexOf('tbRestoreScroll(held);') > paint.indexOf('tbPaintBranding();'), 'put back after the column is painted');
    assert.ok(!/keepScroll\(/.test(TB), 'not keepScroll: its second restore on the next frame would undo the scrollIntoView an Add block does a tick later');
    assert.match(TB, /function tbHoldScroll\(\) \{ const el = document\.getElementById\('tb-scroll'\); return el \? el\.scrollTop : null; \}/, 'the scroller\'s own place, null where there is none');
  });
});
