/* f879 — A SECTION MOVES AS ONE PIECE (owner picked "The Legora Way", 25 Oct 2026)

   The owner: "Currently it is very confusing for something that should be as
   easy as drag and drop or arrows to click which so that the whole clause is
   moving." Measured before the change: one press on a heading's up arrow moved
   the heading alone, so "7. Confidentiality" was left empty and its wording sat
   under "8. Data protection".

   Now a heading's grip, its Up · Down and Alt+↑/↓ carry the WHOLE section; a
   paragraph's own arrows never leave its section; the first heading of a typed
   paper is the title and stays put; the drop line says the number it will
   take; every move offers Undo. Red at the parent: none of tbMoveSection,
   data-tb-grip or data-tb-sec-up existed, and tbMove split the section. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');

const VERSION = blocks => ({
  version: { versionNumber: 1, status: 'draft' },
  blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })),
  fields: [],
});
const stage = async (blocks) => {
  const toasts = [];
  const sandbox = loadViews(
    ['js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'],
    {
      state: { contracts: [], settings: {}, aiConfigured: true, view: 'tpl-builder' },
      API_MODE: () => true,
      canEdit: () => true,
      copilotAvailable: () => true,
      toast: (msg, kind, opts) => { toasts.push({ msg, kind, opts }); },
      api: async (p) => {
        if (p === 'templates/tpl_1') return { template: { id: 'tpl_1', name: 'Warehousing Agreement', category: 'other' } };
        if (p === 'templates/tpl_1/versions/tv_1') return VERSION(blocks);
        if (p === 'org/branding') return { branding: { logoUrl: null, companyName: 'Mkataba', registrationNumber: '', address: '', defaultFooterText: '' } };
        throw new Error('unexpected api call: ' + p);
      },
    });
  await sandbox.openTemplateBuilder('tpl_1', 'tv_1');
  await new Promise(r => setTimeout(r, 0));
  const paper = () => sandbox.document.getElementById('tb-paperslot').innerHTML;
  /* the paper's own order: every heading and paragraph's words, top to bottom */
  const order = () => [...paper().matchAll(/data-tb-kind="(heading|text)"[^>]*>([^<]*)</g)].map(m => m[2]);
  const keyOf = head => sandbox.tbSections().find(s => s.head === head).k;
  return { w: sandbox, paper, order, keyOf, toasts };
};
const BOOK = [
  ['heading', 'Warehousing Agreement'],
  ['heading', 'Services'], ['fixed_text', 'Services wording.'],
  ['heading', 'Confidentiality'], ['fixed_text', 'Confidentiality one.'], ['fixed_text', 'Confidentiality two.'],
  ['heading', 'Data protection'], ['fixed_text', 'Data wording.'],
  ['heading', 'Liability'], ['fixed_text', 'Liability wording.'],
  ['signature_block', 'Supplier'],
];

describe('f879 — a section moves as one piece', () => {
  test('a heading\'s Up carries its whole section past the whole section above', async () => {
    const s = await stage(BOOK);
    assert.equal(typeof s.w.tbMoveSection, 'function', 'the section move exists');
    assert.ok(s.w.tbMoveSection(s.keyOf('Data protection'), -1));
    assert.deepEqual(s.order(), ['Warehousing Agreement', 'Services', 'Services wording.', 'Data protection', 'Data wording.',
      'Confidentiality', 'Confidentiality one.', 'Confidentiality two.', 'Liability', 'Liability wording.']);
  });

  test('the old heading arrow (tbMove on a heading) moves the whole section too — never the heading alone', async () => {
    const s = await stage(BOOK);
    const i = s.w.tbSections().find(x => x.head === 'Data protection').headIndex;
    s.w.tbMove(i, -1);
    assert.deepEqual(s.order().slice(3, 5), ['Data protection', 'Data wording.'], 'heading and wording together');
    assert.deepEqual(s.order().slice(5, 8), ['Confidentiality', 'Confidentiality one.', 'Confidentiality two.'], 'Confidentiality keeps its wording');
  });

  test('Down past the last section puts it after it; the signatures stay last', async () => {
    const s = await stage(BOOK);
    assert.ok(s.w.tbMoveSection(s.keyOf('Data protection'), +1));
    assert.deepEqual(s.order().slice(-4), ['Liability', 'Liability wording.', 'Data protection', 'Data wording.']);
    assert.match(s.paper(), /Data wording\.[\s\S]*tb-sigs/, 'the signatures still close the paper');
    assert.equal(s.w.tbMoveSection(s.keyOf('Data protection'), +1), false, 'the last section goes no further down');
  });

  test('the title heading neither moves nor is moved above', async () => {
    const s = await stage(BOOK);
    assert.equal(s.w.tbMoveSection(s.keyOf('Warehousing Agreement'), +1), false);
    assert.equal(s.w.tbMoveSection(s.keyOf('Services'), -1), false, 'the first clause cannot go above the title');
    assert.equal(s.order()[0], 'Warehousing Agreement');
  });

  test('a paragraph\'s arrows stay inside its section', async () => {
    const s = await stage(BOOK);
    const sec = s.w.tbSections().find(x => x.head === 'Confidentiality');
    s.w.tbMove(sec.body[0], -1);
    assert.deepEqual(s.order().slice(3, 6), ['Confidentiality', 'Confidentiality one.', 'Confidentiality two.'], 'it cannot climb over its heading');
    s.w.tbMove(sec.body[0], +1);
    assert.deepEqual(s.order().slice(3, 6), ['Confidentiality', 'Confidentiality two.', 'Confidentiality one.'], 'but it moves within its section');
  });

  test('the drop line says the number the section will take, and where', async () => {
    const s = await stage(BOOK);
    assert.equal(s.w.tbSecDropWords(s.keyOf('Data protection'), s.keyOf('Confidentiality')), 'Drop here: becomes 2, before Confidentiality');
    assert.equal(s.w.tbSecDropWords(s.keyOf('Services'), null), 'Drop here: becomes 4, after Liability');
  });

  test('a move says where it went with Undo, and Undo puts the paper back exactly', async () => {
    const s = await stage(BOOK);
    const before = s.order();
    s.w.tbMoveSectionTo(s.keyOf('Liability'), s.keyOf('Services'));
    const t = s.toasts[s.toasts.length - 1];
    assert.equal(t.msg, 'Moved Liability to 1'); assert.equal(t.kind, 'ok');
    assert.equal(t.opts.action.label, 'Undo');
    t.opts.action.onClick();
    assert.deepEqual(s.order(), before);
  });

  test('the paper draws the grip and Up · Down on each movable heading, and none on the title', async () => {
    const s = await stage(BOOK);
    const p = s.paper();
    const grips = [...p.matchAll(/data-tb-grip="/g)].length;
    assert.equal(grips, 4, 'one grip per movable section');
    assert.equal([...p.matchAll(/data-tb-sec-up="/g)].length, 4);
    assert.match(p, /data-tb-sec-up="[^"]+" disabled/, 'the first movable section\'s Up is greyed');
    assert.match(p, /data-tb-sec-down="[^"]+" disabled/, 'the last one\'s Down is greyed');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/templatebuilder.js'), 'utf8');
    assert.match(src, /\.tb-g button\.tb-grip\{[^}]*touch-action:none/, 'a finger on the iPad drags the grip, not the page');
    assert.match(src, /e\.altKey && \(e\.key === 'ArrowUp' \|\| e\.key === 'ArrowDown'\)/, 'Alt+↑/↓ in a heading');
  });

  test('both books carry the words', () => {
    const i18n = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    ['tb_grip', 'tb_sec_up', 'tb_sec_down', 'tb_drop_before', 'tb_drop_after', 'tb_moved', 'tb_move_undo_late']
      .forEach(k => assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k));
  });
});
