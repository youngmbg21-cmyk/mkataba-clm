/* ============================================================
   f592 — THE NEW AGREEMENT CARD KEEPS FAITH WITH WHAT IS TYPED
   (functional review, 9 Oct 2026, the drafting walk: C3, C5, C6)
   ============================================================
   C3 A company standard's card said "8 questions" — those were the essentials
      asked first; the template's own questions follow on the Document tab.
      The list now carries `questionCount`, and the card says both.
   C5 Cancel, ✕, Escape and the scrim threw away every typed answer, and so
      did pressing another row. Each way out now asks while anything holds
      text, and an answer typed on one row lands in the same box on the next.
   C6 A refused Create printed a toast over the dialog's own buttons; it now
      prints on the card's #wz-err line, like the essentials form's #ce-err.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { loadViews, STUB_FOLDERS } = require('./dom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const WZ = fs.readFileSync(path.join(ROOT, 'js/wizard.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 1); return src.slice(i, j < 0 ? undefined : j); };

const T = { RM: { id: 'RM', kind: 'Raw Materials Supply', name: 'Raw Materials Supply', blurb: 'x', folder: 'proc', valueType: 'estimated', ic: 'file' } };
function stage(doc, over = {}) {
  const toasts = [];
  const sb = loadViews(['js/wizard.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS, document: doc,
    openModal(){}, closeModal(){}, canEdit: () => true, isAdmin: () => true,
    currentUser: () => ({ name: 'Amina', role: 'admin' }),
    templateFields: () => [], tplMapLabel: () => '', saveSettings(){},
    toast: (m, k) => toasts.push([m, k]),
    state: { contracts: [], settings: {}, view: 'dashboard' },
    ...over,
  });
  return { sb, toasts };
}

describe('f592 (C6) — a refused Create says so under the boxes, not over the buttons', () => {
  test('the error lands on #wz-err and no toast is raised', () => {
    const dom = new JSDOM('<div id="na-form"><input id="wz-counterparty" value=""><div id="wz-err"></div></div>');
    const { sb, toasts } = stage(dom.window.document, { validateField: f => f.key === 'counterparty' ? 'Name the counterparty.' : null });
    sb.createFromWizard('RM', [{ key: 'counterparty', label: 'Counterparty' }]);
    assert.equal(dom.window.document.getElementById('wz-err').textContent, 'Name the counterparty.');
    assert.equal(toasts.length, 0, 'no toast on top of the dialog');
  });
  test('both the answer step and the card draw the line', () => {
    assert.match(region(WZ, 'wizardFormMount'), /\$\{WZ_ERR_HTML\}/, 'the New agreement card');
    assert.match(region(WZ, 'openWizard'), /\$\{WZ_ERR_HTML\}/, 'the answer step');
  });
});

describe('f592 (C5) — typed answers are carried, and never lost without a question', () => {
  test('a typed answer is read by key and written into the same box on the next form', () => {
    const dom = new JSDOM('<div id="a"><input id="wz-counterparty" value=""><input id="wz-cpemail" type="email" value=""><input id="wz-value" value="0"></div>'
      + '<div id="b"><input id="ce-counterparty" value=""><input id="ce-cpemail" value="pre@x.example"><input id="ce-other" value=""></div>');
    const d = dom.window.document;
    const { sb } = stage(d);
    d.getElementById('wz-counterparty').value = 'Juno Limited';
    d.getElementById('wz-cpemail').value = 'erik@juno.example';
    const kept = sb.naCarryRead(d.getElementById('a'), {});
    assert.deepEqual(JSON.parse(JSON.stringify(kept)), { counterparty: 'Juno Limited', cpemail: 'erik@juno.example' },
      'what was drawn (value 0) is not "typed"');
    sb.naCarryWrite(d.getElementById('b'), kept);
    assert.equal(d.getElementById('ce-counterparty').value, 'Juno Limited');
    assert.equal(d.getElementById('ce-cpemail').value, 'erik@juno.example', 'what the reader typed outranks a drawn default');
    assert.equal(d.getElementById('ce-other').value, '', 'a key nobody typed is left alone');
  });
  test('every way out asks while anything holds text', () => {
    const NA = region(WZ, 'openNewAgreement');
    assert.match(NA, /onBeforeClose:\s*\(\)=>naAskLeave\(\)/, 'Escape and the scrim');
    assert.match(NA, /const leave=async\(\)=>\{ if\(!\(await naAskLeave\(\)\)\) return;/, 'Cancel and the ✕');
    assert.match(NA, /naCarryRead\(host, kept\);[\s\S]{0,2000}naCarryWrite\(host, kept\);/, 'a row press carries');
    for (const k of ['na_leave_q', 'na_leave_body', 'na_leave_go', 'na_leave_stay'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  });
});

describe('f592 (C3) — the card counts the essentials and the template’s own questions apart', () => {
  let h, w;
  before(async () => { h = await startHati(); w = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('the list carries the published version’s own question count (signatures excluded)', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Count Form', category: 'sales' } });
    const id = r.template.id;
    const d = await w.admin.json('/api/templates/' + id);
    const vid = d.versions[0].id;
    await w.admin.json(`/api/templates/${id}/versions/${vid}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'field_group', content: '{{a}} {{b}} {{c}}' }],
      fields: [
        { fieldKey: 'a', label: 'A', fieldType: 'short_text' },
        { fieldKey: 'b', label: 'B', fieldType: 'short_text' },
        { fieldKey: 'c', label: 'Signer', fieldType: 'signature_name_title' },
      ] } });
    await w.admin.json(`/api/templates/${id}/versions/${vid}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    const list = await w.admin.json('/api/templates');
    assert.equal(list.templates.find(t => t.id === id).questionCount, 2);
  });
  test('a company standard’s card says details, and what follows', () => {
    const NA = region(WZ, 'openNewAgreement');
    assert.match(NA, /kind==='lib'\s*\? i18tn\('na_details', n, \{n\}\)\+\(follow\?' · '\+i18tn\('na_tpl_q_follow', follow, \{n:follow\}\):''\)/);
    for (const k of ['na_details_one', 'na_details_other', 'na_tpl_q_follow_one', 'na_tpl_q_follow_other'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  });
});
