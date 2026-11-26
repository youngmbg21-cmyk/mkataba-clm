'use strict';
/* f1230 — THE NOTEBOOK FEEDS A NEW PAPER (owner's pick "The Legora + Stripe way", 26 Nov 2026): on New agreement's From
   nothing the person links Notebook documents, each with a line saying what to bring in, or none (Jambo decides).
   Propose the sections sends ids and notes only; the SERVER reads each document behind nbSees, leaves out and counts one
   the reader may not see, keeps a section's source only for a linked document and only labels it really prints; the
   contents page marks those sections "From the Notebook", and the Builder writes each from its own sections. */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const DPA = ['Data Processing Agreement, our model', '', '§ 3 Instructions',
  'The Processor acts only on the documented instructions of the Controller. MARK-INSTRUCTIONS', '',
  '§ 7 Sub-processors', 'The Processor shall not engage a sub-processor without prior written consent. MARK-SUBPROC', '',
  '§ 9 Breach notice', 'The Processor shall notify the Controller within 48 hours of a breach. MARK-BREACH'].join('\n');

let h, W, ai, dpa, secret;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  W = await seedWorkspace(h);
  dpa = (await W.admin.json('/api/notebook', { method: 'POST', body: { shelf: 'company', name: 'Data Processing Agreement, our model', kind: 'policy', text: DPA, fileName: 'dpa.txt' } })).doc;
  secret = (await W.unrestricted.json('/api/notebook', { method: 'POST', body: { shelf: 'mine', name: 'My private notes', kind: 'research', text: '§ 1 One\nMINE-SECRET-MARKER first.\n§ 2 Two\nMINE-SECRET-MARKER second.' } })).doc;
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
const promptOf = () => String(((ai.calls[ai.calls.length - 1] || {}).raw) || '');

describe('f1230 (1) Propose the sections reads the linked documents, behind the wall', () => {
  test('the note and the document reach Jambo; another person\'s Mine never does, and is counted', async () => {
    ai.reset();
    ai.script(() => [{ type: 'tool_use', id: 't1', name: 'propose_sections', input: { sections: [
      { heading: 'Data Protection', intent: 'How personal data is processed.', from_notebook: { doc: dpa.id, refs: ['§ 7', '§ 99'] } },
      { heading: 'Private', intent: 'x', from_notebook: { doc: secret.id, refs: ['§ 1'] } },
      { heading: 'Fees', intent: 'What is paid.' }] } }]);
    const r = await W.admin.json('/api/ai/outline', { method: 'POST', body: { sentence: 'A cloud subscription we buy', title: true,
      notebook: [{ id: dpa.id, note: 'Bring the breach notice' }, { id: secret.id, note: '' }] } });
    const p = promptOf();
    assert.match(p, /MARK-BREACH/, 'the linked document is read for Jambo');
    assert.match(p, /Bring the breach notice/, 'with the person\'s note');
    assert.doesNotMatch(p, /MINE-SECRET-MARKER/, 'a document on someone else\'s Mine shelf is never read');
    assert.equal(r.sections[0].nb.id, dpa.id);
    assert.deepEqual(r.sections[0].nb.refs, ['§ 7'], 'only labels the document really prints');
    assert.equal(r.sections[1].nb, undefined, 'no source from a document that was not read');
    assert.equal(r.sections[2].nb, undefined);
    assert.equal(r.notebook.unseen, 1, 'the one left out is counted');
    assert.deepEqual(r.notebook.docs.map(d => [d.id, d.used]), [[dpa.id, 1]]);
  });
  test('nothing linked asks nothing new', async () => {
    ai.reset();
    ai.script(() => [{ type: 'tool_use', id: 't2', name: 'propose_sections', input: { sections: [{ heading: 'Fees', intent: 'What is paid.' }] } }]);
    const r = await W.admin.json('/api/ai/outline', { method: 'POST', body: { sentence: 'A cloud subscription we buy', title: true } });
    assert.doesNotMatch(promptOf(), /NOTEBOOK DOCUMENTS/);
    assert.equal(r.notebook, undefined);
  });
});

describe('f1230 (2) a section proposed from the Notebook is written from its own sections', () => {
  test('only the labelled sections are read; someone else\'s document is not', async () => {
    ai.reset();
    ai.script(() => [{ type: 'tool_use', id: 't3', name: 'write_section', input: { text: 'The Processor shall not engage a sub-processor without consent.' } }]);
    const r = await W.admin.json('/api/ai/section', { method: 'POST', body: { sentence: 'A cloud subscription', heading: 'Sub-processors', notebook: { id: dpa.id, refs: ['§ 7'], note: 'keep it strict' } } });
    const p = promptOf();
    assert.match(p, /MARK-SUBPROC/); assert.doesNotMatch(p, /MARK-INSTRUCTIONS|MARK-BREACH/, 'only § 7');
    assert.match(p, /keep it strict/);
    assert.equal(r.notebook.id, dpa.id);
    ai.reset();
    ai.script(() => [{ type: 'tool_use', id: 't4', name: 'write_section', input: { text: 'Some wording.' } }]);
    const r2 = await W.admin.json('/api/ai/section', { method: 'POST', body: { sentence: 'A cloud subscription', heading: 'Notes', notebook: { id: secret.id, refs: ['§ 1'] } } });
    assert.doesNotMatch(promptOf(), /MINE-SECRET-MARKER/);
    assert.equal(r2.nbUnseen, true, 'said, never silent');
  });
});

describe('f1230 (3) the page: linked rows, the contents page and the Builder carry it', () => {
  const NS = strip(R('js/views/newstandard.js')), TB = strip(R('js/views/templatebuilder.js')), AI = R('js/ai.js'), I = R('js/i18n.js'), H = R('index.html');
  test('From nothing draws the Notebook rows and sends ids and notes only', () => {
    assert.match(NS, /\$\{nsnHtml\(st\)\}\s*<div class="nss-foot">/);
    assert.match(NS, /notebook: nbOut/);
    assert.match(NS, /const nsnBody = st => \(st\.nb \|\| \[\]\)\.map\(l => \(\{ id: l\.id, note: l\.mode === 'note'/);
    assert.match(NS, /data-nsn-mode="jambo"[\s\S]*data-nsn-mode="note"/, 'the choice answered in the row');
    assert.match(NS, /st\.nb\.length >= NSN_MAX/);
  });
  test('the contents page marks each section drawn from the Notebook; the panel says what each document gave', () => {
    assert.match(TB, /src: x\.nb \? 'nb' : tbSourceOf\(x\.heading\)/);
    assert.match(NS, /TONE = \{ lib: 'gray', std: 'green', ai: 'violet', nb: 'pink' \}/);
    assert.match(NS, /x\.nb \? `<span class="nsk-nb">/);
    assert.match(NS, /function nsnPanelHtml\(st\)/);
    assert.ok(H.includes('html.lg-new .nsk-t .tb-bdg.is-pink{'));
  });
  test('the Builder writes each such section from its own sections', () => {
    assert.match(TB, /\(_tb\.nb \|\| \(_tb\.nb = \{\}\)\)\[h\._k\]/);
    assert.match(TB, /nbx = nbOf \? \{ notebook: \{ id: nbOf\.id, refs: nbOf\.refs, note: nbOf\.note \} \} : \{\}/);
    assert.match(TB, /\.\.\.\(await tbNbFor\(sec\.k\)\)/);
    assert.match(AI, /o\.notebook \? `\\nTHE COMPANY'S NOTEBOOK/);
  });
  test('the words are in both books', () => {
    for (const k of ['nsn_head', 'nsn_link', 'nsn_m_jambo', 'nsn_m_note', 'nsn_b_say', 'tb_src_nb', 'nsj_from_nb', 'nsj_nb_none'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});

describe('f1230 (4) the card way in (owner\'s pick, 26 Nov 2026): a dashed card, a searchable shelf of four rows, a card a document', () => {
  const NS = strip(R('js/views/newstandard.js')), H = R('index.html'), I = R('js/i18n.js');
  test('nothing linked is ONE dashed card with its one press', () => {
    assert.match(NS, /if \(!L\.length && !st\.nbPick\) return `<div class="nsn"><div class="nsn-card is-empty">/);
    assert.match(NS, /nsn_empty_t[\s\S]{0,200}nsn_empty_s[\s\S]{0,200}data-nsn-pick aria-expanded="false">\$\{E\(i18t\('nsn_link_doc'\)\)\}/);
  });
  test('the shelf searches, shows four rows and scrolls the rest, with a count', () => {
    assert.match(NS, /const NSN_ROWS_SHOWN = 4;/);
    assert.match(NS, /String\(d\.name \|\| ''\)\.toLowerCase\(\)\.includes\(q\)/);
    assert.match(NS, /docs\.length > NSN_ROWS_SHOWN \? `<div class="nsn-pcount">/);
    assert.match(NS, /if \(e\.target && e\.target\.id === 'nsn-q'\) \{ st\.nbQ = e\.target\.value \|\| ''; const pb = document\.getElementById\('nsn-pbody'\); if \(pb\) pb\.innerHTML = nsnPickRowsHtml\(st\); return; \}/, 'typing redraws only the list, so the box keeps its words');
    assert.ok(H.includes('html.lg-new .nsn-plist{max-height:calc(var(--nsn-row-h) * 4);overflow-y:auto;'));
    assert.ok(H.includes('html.lg-new .nsn-prow{min-height:var(--nsn-row-h);'));
  });
  test('a linked document is a card; what to bring is typed, with its hint', () => {
    assert.match(NS, /return `<div class="nsn-card">\$\{mark\}/);
    assert.match(NS, /<p class="nsn-hint">\$\{E\(i18t\('nsn_note_hint'\)\)\}<\/p>/);
    assert.match(NS, /nsn_link_another/);
    for (const k of ['nsn_empty_t', 'nsn_search_ph', 'nsn_count_other', 'nsn_note_hint', 'nsn_link_another'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
