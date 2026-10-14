/* THEIR CONTACT, ASKED BESIDE THEIR EMAIL (13 Oct 2026, phase 1 item 6 of the
   best-in-class plan, "Send is one press"; the owner's pick: ask for the
   contact's name at creation so Send has nothing left to type).

   Measured before (first-contract-clock-verify): every creation door asked
   "Their email" and no door asked for the PERSON, so the name was typed twice
   later in the same sitting — the Send screen's name box and the signing
   route's other signer. Now every door that asks the address asks the name
   beside it, and both go into the address book through its one writer
   (contactSet), which the Send screen and the route already read.

   The doors: the New agreement form (wizard), the essentials form, the
   saved-template fill form, the upload form, the request form (whose answers
   the shared cleaner in js/intakelanes.js carries, on both hosts), and the
   server's company-template route. What a person sees is driven by
   test/chromium/contact-at-creation-verify.js; the clock's typed count fell
   14 → 13.

   Run: node --test --test-reporter=dot test/contact-at-creation.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

/* The last modal a door drew (f77's stage, the same stubs). */
function formOf(files, call){
  const modals = [];
  const TPL = { WH: { id: 'WH', kind: 'Warehousing & Cold-Chain Agreement', name: 'Warehousing',
    folder: 'proc', valueType: 'standard', ic: 'box', blurb: 'Storage and handling.' } };
  const sb = loadViews(files, { TEMPLATES: TPL, FOLDERS: STUB_FOLDERS,
    folderOptionsHtml: () => '<option value="proc">Procurement</option>',
    uploadMaxLabel: () => '25 MB', uploadTooBigMsg: () => 'too big', EXTRACT_MAX_CHARS: 200000,
    bindFolderSelect(){}, renderUploadSteps(){}, wireUploadModal(){}, OCR_TEXT_FLOOR: 200,
    myCreatableTemplates: () => Object.values(TPL),
    openModal: html => modals.push(String(html)), closeModal(){}, toast(){},
    canEdit: () => true, currentUser: () => ({ id: 'u', name: 'Wanjiru Kamau', role: 'legal' }),
    templateFields: () => [{ key: 'counterparty', label: 'Supplier corporate name',
      maps: 'counterparty', required: true, type: 'text' }],
    tplMapLabel: () => 'Counterparty', validateField: () => null,
    applyTemplateValues(){}, nextId: () => 'MK-1', todayStr: () => '28 Jul 2026',
    nowISO: () => '2026-07-28T00:00:00.000Z', persist(){}, setView(){},
    renderSideFolders(){}, uploadMax: () => 1e9, isUpload: () => false,
    state: { contracts: [], settings: {}, view: 'workspace' } });
  call(sb);
  return { sb, html: modals[modals.length - 1] || '' };
}

describe('every door that asks their email asks their contact beside it', () => {
  test('the New agreement form: the contact box comes right before the email box', () => {
    const { html } = formOf(['js/wizard.js'], sb => sb.openWizard('WH'));
    assert.match(html, /id="wz-cpname"/);
    assert.ok(html.indexOf('id="wz-cpname"') < html.indexOf('id="wz-cpemail"'), 'name, then address');
    assert.match(html, /Their contact/);
  });
  test('the upload form: under the pair "Received from" and their email', () => {
    const { html } = formOf(['js/views/contract.js'], sb => sb.openUploadModal());
    assert.match(html, /id="up-cpname"/);
    assert.ok(html.indexOf('id="up-cpemail"') < html.indexOf('id="up-cpname"'),
      'after the email box, so "Received from" stays level with it (upload-party-verify)');
  });
  test('the saved-template fill form', () => {
    const tpl = { id: 'ct_1', name: 'WH', folder: 'proc', text: 'Body', chars: 4,
      fields: [{ key: 'counterparty', label: 'Supplier', maps: 'counterparty', type: 'text' }] };
    const modals = [];
    const sb = loadViews(['js/templatefields.js', 'js/views/library.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      openModal: html => modals.push(String(html)), closeModal(){}, toast(){},
      canEdit: () => true, currentUser: () => ({ name: 'Wanjiru Kamau' }),
      customTemplates: () => [tpl], nextId: () => 'MK-1', todayStr: () => 'x',
      nowISO: () => '2026-07-28T00:00:00.000Z', fmtDT: () => 'x',
      persist(){}, setView(){}, renderSideFolders(){},
      state: { contracts: [], settings: {}, view: 'workspace' },
    });
    sb.openTemplateFillModal(tpl);
    const html = modals[modals.length - 1] || '';
    assert.match(html, /id="tf-cpname"/);
    assert.ok(html.indexOf('id="tf-cpname"') < html.indexOf('id="tf-cpemail"'));
    /* and the draft carries the name */
    sb.buildFromCustomTemplate(tpl, { counterparty: 'Nandi Traders Ltd' },
      { counterpartyEmail: 'ola@nandi.co.ke', counterpartyName: 'Ola Nordmann' });
    const c = sb.state.contracts[0];
    assert.equal(c.counterpartyEmail, 'ola@nandi.co.ke');
    assert.equal(c.counterpartyName, 'Ola Nordmann');
  });
  test('the essentials form: their contact sits directly before their email, and is never owed', () => {
    const sb = loadViews(['js/templatefields.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const keys = sb.CONTRACT_ESSENTIALS.map(f => f.key);
    assert.equal(keys.indexOf('cpname'), keys.indexOf('cpemail') - 1, keys.join(','));
    const f = sb.CONTRACT_ESSENTIALS.find(x => x.key === 'cpname');
    assert.equal(f.maps, null, 'it is the address book\'s, not a template field');
    assert.equal(f.label, 'Their contact');
    assert.match(read('js/components.js'), /const NEED_NEVER = new Set\(\[[^\]]*'cpname'/,
      'optional like the address: never amber');
  });
  test('the essentials put the name on an existing contract with the address', () => {
    const sb = loadViews(['js/templatefields.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      applyTemplateValues(){} });
    const c = { id: 'MK-2' };
    assert.equal(sb.applyContractEssentials(c, { cpname: 'Ola Nordmann', cpemail: 'ola@nandi.co.ke' }), true);
    assert.equal(c.counterpartyEmail, 'ola@nandi.co.ke');
    assert.equal(c.counterpartyName, 'Ola Nordmann');
    const d = { id: 'MK-3' };
    assert.equal(sb.applyContractEssentials(d, { cpname: 'Ola Nordmann' }), true, 'a name alone is something to keep');
    assert.equal(d.counterpartyName, 'Ola Nordmann');
  });
});

describe('the request carries it into the draft (js/intakelanes.js, both hosts)', () => {
  const IK = require('../js/intakelanes.js');
  test('the cleaner keeps a name, tidied and bounded', () => {
    assert.equal(IK.intakeAnswersClean({ cpname: '  Ola   Nordmann ' }).cpname, 'Ola Nordmann');
    assert.equal(IK.intakeAnswersClean({ cpname: 'x'.repeat(300) }).cpname.length, 120);
    assert.equal(IK.intakeAnswersClean({ cpname: '   ' }).cpname, undefined, 'an absence stays an absence');
    assert.ok(IK.INTAKE_ANSWER_KEYS.includes('cpname'));
  });
  test('the drafting screen is handed it, and the server\'s lane mint writes it on the record', () => {
    const r = { counterparty: 'Nandi Traders Ltd', answers: { cpname: 'Ola Nordmann', cpemail: 'ola@nandi.co.ke' } };
    assert.equal(IK.intakePrefillOf(r).cpname, 'Ola Nordmann');
    const c = IK.intakeAnswersOnto({}, r);
    assert.equal(c.counterpartyName, 'Ola Nordmann');
    assert.equal(c.counterpartyEmail, 'ola@nandi.co.ke');
  });
  test('the request form draws it in one row with who they are and their address', () => {
    assert.match(read('js/views/intake.js'),
      /<div class="sap-row3">\$\{cell\(byKey\('counterparty'\)\)\}\$\{cell\(byKey\('cpname'\)\)\}\$\{cell\(byKey\('cpemail'\)\)\}<\/div>/);
  });
});

describe('and the Send screen opens with it', () => {
  test('a record carrying their contact fills the Send screen\'s name and address', () => {
    const sb = loadViews(['js/richdoc.js', 'js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const c = { id: 'MK-4', counterparty: 'Nandi Traders Ltd', counterpartyEmail: 'ola@nandi.co.ke', counterpartyName: 'Ola Nordmann' };
    const pre = sb.shareModalPrefill([], c);
    assert.equal(pre.email, 'ola@nandi.co.ke');
    assert.equal(pre.name, 'Ola Nordmann');
  });
  test('the server\'s company-template route keeps the name it is sent', () => {
    const SRV = read('server/server.js');
    const at = SRV.indexOf("app.post('/api/templates/:id/contracts'");
    assert.ok(at > 0);
    assert.match(SRV.slice(at, at + 9000), /\.\.\.\(clean\(b\.counterpartyName\) \? \{ counterpartyName: clean\(b\.counterpartyName\)\.slice\(0, 120\) \} : \{\}\)/);
    assert.match(read('js/views/templatelib.js'), /counterpartyName: essentials\.cpname \|\| ''/);
  });
});
