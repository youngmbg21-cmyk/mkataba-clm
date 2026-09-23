/* f367 — SIGNING WITHOUT THE FACTS: THE THREE QUICK FIXES (Young's go, 23 Sep 2026)

   Off the review of what a contract can be signed without. The owner took the
   recommended answers and said go on the three quick fixes named with them:

     1  A VALUE LEFT EMPTY IS NOT "NO MONEY PASSES". A contract made from a
        company standard with the value box empty (or "Skip for now") was
        stored valueType 'none', so the value was never asked for again — not
        at the Send screen, not at the Sign button. The mailroom did the same
        to every document it filed. The template answers the silence where it
        has something to say (the NDA category), and nothing is written
        otherwise.
     2  THE EFFECTIVE DATE A READING FOUND REACHES THE FIELD. The upload's own
        confirm copied the counterparty, the value and the expiry onto the
        record and left the effective date in the background, so the Overview
        printed "—" beside an expiry that arrived through the same press.
        One helper, metaEffDateOnto, for every door that saves a reading.
     3  AN EMPTY BOX IN OUR OWN PAPER HOLDS. A box left empty in one of
        HaTi's own templates was sealed as "—" and nothing asked about it. It
        is a readiness BLOCK now — the Send screen's tick and the Sign button
        both already know what to do with one — named box by box, counted off
        the fill panel's own reading, with a door that can still fill it.

   RED AT THE PARENT: every claim below except the ones marked [control] or
   [wall], which pass on both sides by design and prove the change is narrow.
   A name missing at the parent READS AS EMPTY rather than throwing, so the
   file reports one claim at a time.

   Run: node --test test/f367-signing-without-the-facts.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world.js');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CORE = read('js/core.js');
const CONTRACT = read('js/views/contract.js');
const MIGRATION = read('js/views/migration.js');
const I18N = read('js/i18n.js');

/* A function's own region, by brace-matching from its declaration — the
   region, never a byte count. */
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return '';
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) { const ch = src[i++]; if (ch === '{') depth++; else if (ch === '}') depth--; }
  return src.slice(m.index, i);
};

/* ============================================================================
   THE STAGE. The world runs the real modules but stubs the shell, so the few
   readings that live in js/core.js (which it does not load) are lifted out of
   that file as they are, and docBody is re-read from js/views/contract.js
   because the world replaces it with a stand-in.
   ==========================================================================*/
const LIFT = [
  (/const isMonetary = c => \{[\s\S]*?\n\};/.exec(CORE) || [''])[0],
  (/const PLACEHOLDER_RE = .*;/.exec(CORE) || [''])[0],
  fnBody(CORE, 'fmtDocAmount'), fnBody(CORE, 'fieldDisplayValue'), fnBody(CORE, 'readOnlyDocHtml'),
  fnBody(CORE, 'contractPlaceholders'), fnBody(CORE, 'contractReadiness'),
  fnBody(CONTRACT, 'docBody'),
  'window.isMonetary=isMonetary; window.contractPlaceholders=contractPlaceholders;'
    + ' window.contractReadiness=contractReadiness; window.readOnlyDocHtml=readOnlyDocHtml; window.docBody=docBody;',
].join('\n');
function stage(opts = {}){
  const w = buildWorld({ contractView: true, templates: true, blanks: true, metadata: true, signcheck: true, ...opts });
  const { win } = w;
  vm.runInContext(LIFT, w.dom.getInternalVMContext(), { filename: 'f367-lift' });
  win.isUpload = c => !!(c && c.source === 'upload');
  win.canEdit = () => true;
  win.canViewValues = () => true;
  win.fmtDocDate = v => String(v || '');
  win.signingRouteOpen = () => true;
  win.signingRouteMissing = () => null;
  win.openFindings = () => [];
  win.currentUser = () => ({ id: 'u-1', name: 'Amina Otieno', role: 'legal' });
  return { w, win };
}
const RM = (over = {}) => ({ id: 'MK-367', name: 'Raw material supply', counterparty: 'Acme Ltd',
  status: 'Under Review', source: 'template', template: 'RM', fields: {}, audit: [], changes: [],
  signatures: [], obligations: [], comments: [], value: 1200000, valueType: 'estimated', metadata: {}, ...over });
const safe = f => { try { return f(); } catch (_) { return undefined; } };

/* ============================================================================
   1 · A VALUE LEFT EMPTY IS NOT "NO MONEY PASSES" — against a real server
   ==========================================================================*/
describe('f367 (1) the automatic "no money" stamp is gone', () => {
  let h, w, supplyId, ndaId;
  const publish = async (name, category) => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name, category } });
    const id = r.template.id;
    const d = await w.admin.json('/api/templates/' + id);
    const vid = d.versions[0].id;
    await w.admin.json(`/api/templates/${id}/versions/${vid}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: name.toUpperCase() },
               { orderIndex: 1, blockType: 'fixed_text', content: 'Article 1. The parties agree as follows.' }],
      fields: [] } });
    await w.admin.json(`/api/templates/${id}/versions/${vid}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    return id;
  };
  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    supplyId = await publish('Supply standard', 'sales');
    ndaId = await publish('Mutual NDA standard', 'nda');
  });
  after(async () => { if (h) await h.stop(); });
  const make = async (id, body) => (await w.admin.json(`/api/templates/${id}/contracts`, { method: 'POST', body })).contract;
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);

  test('1a a value left EMPTY writes no value type at all', async () => {
    const c = await make(supplyId, { counterparty: 'Acme Ltd', value: '', folder: 'sales' });
    assert.equal(has(c, 'valueType') ? c.valueType : '(absent)', '(absent)',
      'an empty "if known" box was stored as "no money passes"');
    const back = await w.admin.json('/api/contracts/' + c.id);
    assert.ok(!back.valueType, 'and the stored record says nothing about money either');
  });
  test('1b "Skip for now" writes no value type either', async () => {
    const c = await make(supplyId, {});
    assert.equal(has(c, 'valueType') ? c.valueType : '(absent)', '(absent)');
  });
  test('1c [control] a typed value is still a figure', async () => {
    const c = await make(supplyId, { counterparty: 'Acme Ltd', value: '5000000', folder: 'sales' });
    assert.equal(c.valueType, 'estimated');
    assert.equal(c.value, 5000000);
  });
  test('1d [wall] a standard filed under NDA still answers "no money" — the template answers the silence', async () => {
    const c = await make(ndaId, { counterparty: 'Acme Ltd', value: '' });
    assert.equal(c.valueType, 'none', 'TEMPLATES.ND carries none; so does a company standard filed as an NDA');
  });
  test('1e the mailroom files a document with no claim about money', async () => {
    await w.admin.json('/api/settings', { method: 'PUT', body: { mailroom: { key: 'f367-mailroom-key-0123456789' } } });
    const r = await w.admin.raw('/api/mailroom', { method: 'POST',
      headers: { 'x-hati-mailroom-key': 'f367-mailroom-key-0123456789' },
      body: { from: 'counsel@acme.example', subject: 'Supply agreement for signature',
        attachments: [{ filename: 'supply.pdf', contentType: 'application/pdf',
          content: Buffer.from('%PDF-1.4 f367').toString('base64') }] } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.filed, 1);
    const back = await w.admin.json('/api/contracts/' + r.json.ids[0]);
    assert.ok(!back.valueType, `a document nobody has read was filed as "${back.valueType}"`);
  });
  /* [control] BECAUSE THE BROWSER WAS ALWAYS RIGHT: isMonetary has read a
     missing value type as money since it was written. What moved is that the
     server stopped writing "none" into the silence — 1a, 1b and 1e — and this
     proves what that silence now does on the screens that ask. */
  test('1f [control] and the browser reads that silence as money, so the value is asked for again', () => {
    const { win } = stage();
    const c = { id: 'MK-1', name: 'x', counterparty: 'Acme Ltd', status: 'Under Review', template: null,
      templateForm: { templateName: 'Supply standard' }, redlineText: '<p>Article 1.</p>', format: 'rich',
      value: 0, fields: {}, metadata: {} };
    assert.equal(win.isMonetary(c), true, 'no value type, no built-in template: money is assumed');
    const blocks = win.contractReadiness(c).filter(x => x.severity === 'block').map(x => x.key);
    assert.ok(blocks.includes('value'), 'the Send screen and the Sign button ask for the value again');
  });
});

/* ============================================================================
   2 · THE EFFECTIVE DATE A READING FOUND REACHES THE FIELD
   ==========================================================================*/
describe('f367 (2) the effective date reaches the Overview', () => {
  const upload = (over = {}) => ({ id: 'MK-2', name: 'SaaS', source: 'upload', status: 'Draft',
    fields: {}, audit: [], metadata: {}, value: 0, valueType: 'estimated', ...over });

  test('2a the upload confirm copies a confirmed effective date onto the record', () => {
    const { win } = stage();
    const c = upload();
    win.applyMetadata(c, { counterparty: 'Nordkust AB', value: 8000000, expiryDate: '2027-12-31',
      effectiveDate: '2026-10-01', confidence: {} });
    assert.equal(c.expiry, '2027-12-31', 'the expiry arrived, as it always did');
    assert.equal((c.fields || {}).effDate, '2026-10-01', 'and the effective date arrived beside it');
    assert.ok(String(safe(() => win.ktFactReads(c).effDate) || '').includes('2026-10-01'),
      'so the Overview prints it rather than a dash');
  });
  test('2b [control] fill only: a date already on the record is somebody\'s and stays', () => {
    const { win } = stage();
    const c = upload({ fields: { effDate: '2026-01-15' } });
    win.applyMetadata(c, { effectiveDate: '2026-10-01', confidence: {} });
    assert.equal(c.fields.effDate, '2026-01-15');
  });
  test('2c [wall] only an ISO day is a day — anything else writes nothing', () => {
    const { win } = stage();
    const c = upload();
    win.applyMetadata(c, { effectiveDate: '1 October 2026', confidence: {} });
    assert.ok(!(c.fields || {}).effDate, 'a date box cannot hold it and a screen would print NaN');
  });
  test('2d the one helper: fill by default, overwrite only where the caller says a person confirmed it', () => {
    const { win } = stage();
    const f = win.metaEffDateOnto;
    assert.equal(typeof f, 'function', 'metaEffDateOnto is published');
    const c = upload({ fields: { effDate: '2026-01-15' } });
    assert.equal(f(c, { effectiveDate: '2026-10-01' }), false, 'fill only by default');
    assert.equal(f(c, { effectiveDate: '2026-10-01' }, { overwrite: true }), true);
    assert.equal(c.fields.effDate, '2026-10-01');
    assert.equal(f(c, { effectiveDate: '2026-10-01' }, { overwrite: true }), false, 'nothing moved, nothing written');
  });
  test('2e every door that saves a reading asks the one helper', () => {
    assert.match(strip(fnBody(MIGRATION, 'applyReviewedMeta')), /metaEffDateOnto\(c,\s*m,\s*\{\s*overwrite:\s*true\s*\}\)/,
      'the import queue\'s confirm overwrites, like the expiry beside it');
    assert.match(strip(fnBody(MIGRATION, 'migRerunAi')), /metaEffDateOnto\(c,\s*meta\)/,
      'the import re-read fills, like the expiry beside it');
    assert.match(strip(fnBody(CONTRACT, 'fillKeyTermsFromDocument')), /metaEffDateOnto\(c,\s*meta\)/,
      'and Fill from document keeps no second copy of the rule');
    assert.ok(!/c\.fields\.effDate\s*=\s*meta\.effectiveDate/.test(strip(fnBody(CONTRACT, 'fillKeyTermsFromDocument'))));
  });
  test('2f [wall] the importer\'s own build is NOT a caller — sealed paper would freeze an unconfirmed reading', () => {
    const build = strip(fnBody(MIGRATION, 'migBuildAndSave'));
    assert.ok(/fields:\{\}/.test(build), 'the region is the build that writes the record');
    assert.ok(!/metaEffDateOnto|effDate/.test(build), 'the build writes no effective date of its own');
  });
});

/* ============================================================================
   3 · AN EMPTY BOX IN OUR OWN PAPER HOLDS
   ==========================================================================*/
describe('f367 (3) an empty box in HaTi\'s own paper is a blank to fill', () => {
  test('3a the one reading lists the empty boxes of our own paper, by name', () => {
    const { win } = stage();
    const boxes = safe(() => win.contractBoxesOpen(RM())) || [];
    /* JOINED, never deepEqual: an array born inside jsdom carries that realm's
       Array.prototype and deepStrictEqual refuses it however equal it is. */
    assert.equal(boxes.map(b => b.label).join('|'), 'Start date|Material',
      'the fill panel\'s own count, narrowed to the paper\'s own boxes');
    assert.ok(boxes.every(b => b.kind === 'field'), 'never the record\'s own boxes (counterparty, value)');
  });
  test('3b the readiness list blocks on them and names them', () => {
    const { win } = stage();
    const row = win.contractReadiness(RM()).find(x => x.key === 'blanks');
    assert.ok(row, 'no readiness row for the empty boxes');
    assert.equal(row.severity, 'block', 'a block: the Send screen asks for its tick');
    assert.match(row.label, /2 fields in the wording are still empty: Start date, Material\./);
    assert.equal([...row.fields].join('|'), 'effDate|material', 'the keys ride on the row');
  });
  test('3c one fact, said once: no separate "no effective date" line when the start date box is named', () => {
    const { win } = stage();
    const list = win.contractReadiness(RM());
    assert.ok(list.some(x => x.key === 'blanks'), 'the box is named');
    assert.ok(!list.some(x => x.key === 'effective'), 'and not repeated under "also worth knowing"');
  });
  test('3d the Sign button holds on them', () => {
    const { win } = stage();
    const b = (win.signBlockers(RM()) || []).find(x => x.key === 'blanks');
    assert.ok(b, 'signBlockers carries the row');
    assert.equal([...b.fields].join('|'), 'effDate|material');
    const rd = win.signReadiness(RM());
    const row = rd.holds.find(r => r.kind === 'blanks');
    assert.ok(row, 'and the one list before the signature holds on it');
    assert.equal(row.stage, 'paper', 'under "Is the paper final?"');
    assert.equal([...row.fields].join('|'), 'effDate|material');
  });
  test('3e the Overview marks the one box it owns — the start date — where the field is', () => {
    const { win } = stage();
    const marks = win.signFieldMarks(RM());
    assert.ok(marks.live, 'past Draft the Overview marks what holds');
    assert.ok(marks.fields.effDate && marks.fields.effDate.holds, 'the Effective cell says "Needed to sign"');
    assert.ok(!marks.fields.material, 'a box the Overview has no cell for is not invented one');
  });
  test('3f [control] a contract whose boxes are all answered has no such row and no mark', () => {
    const { win } = stage();
    const c = RM({ fields: { effDate: '2026-10-01', material: 'Sugar' } });
    assert.ok(!win.contractReadiness(c).some(x => x.key === 'blanks'));
    assert.ok(!(win.signBlockers(c) || []).some(x => x.key === 'blanks'));
    assert.ok(!win.signFieldMarks(c).fields.effDate);
  });
  test('3g [wall] an upload\'s placeholders are a different question and are not counted here', () => {
    const { win } = stage();
    const up = { id: 'MK-3', name: 'Their paper', source: 'upload', status: 'Under Review', counterparty: 'Acme',
      value: 100, fields: {}, metadata: {}, upload: { name: 'x.docx', extractedText: 'Signed for [Insert Company Name] on ______.' } };
    assert.equal((safe(() => win.contractBoxesOpen(up)) || []).length, 0);
    assert.ok(!win.contractReadiness(up).some(x => x.key === 'blanks'));
  });
  test('3h the row\'s door can still fill the box at every stage', () => {
    const { win } = stage();
    const door = c => { const h = safe(() => win.signCheckCardHtml(c)) || '';
      const m = /data-sc-(blanks|fix)="([^"]*)"/.exec(h.slice(h.indexOf(win.i18t('sc_row_blanks')))); return m ? m[1] + ':' + m[2] : ''; };
    assert.equal(door(RM({ status: 'Draft' })), 'blanks:docs', 'a draft: the fill panel lists every box');
    assert.equal(door(RM({ fields: { material: 'Sugar' } })), 'fix:effDate',
      'past Draft with only the start date open: the Overview cell fills it');
    assert.equal(door(RM({ fields: { effDate: '2026-10-01' } })), 'blanks:nego',
      'past Draft with a box only the wording holds: the words are proposed');
  });
  test('3i the row names itself and speaks both languages', () => {
    const cut = I18N.indexOf('\n  sv: {');
    assert.ok(cut > 0, 'the Swedish book is where it has always been');
    const en = I18N.slice(0, cut), sv = I18N.slice(cut);
    for (const k of ['rd_boxes_empty_one', 'rd_boxes_empty_other', 'sc_row_blanks', 'sc_short_blanks']) {
      assert.match(en, new RegExp('\\b' + k + ':'), k + ' in English');
      assert.match(sv, new RegExp('\\b' + k + ':'), k + ' in Swedish');
    }
  });
});
