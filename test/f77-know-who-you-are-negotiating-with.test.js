/* ============================================================
   F77 — ask who, once, and then sending is just sending
   ============================================================
   The two sides did the same act by completely different means. The
   counterparty files an answer and a postbox appears under it: press, gone.
   The owner files a change and gets a button that opens a DIALOG — recipient,
   channel, expiry, a message, a summary to approve — because the address has
   always been collected at send time.

   That is the whole difference. Collect it once, at the start, and the owner's
   send becomes what the counterparty's already is.

   Three things this must get right.

   IT IS ASKED WHERE THEY ARE ALREADY NAMED. This started life as a strip across
   the top of the negotiation — "Negotiating with X? Add their email" — which
   put a question about the counterparty on a working surface, above the first
   word of the contract, and left it as the last banner standing between the two
   after everything else came down. The counterparty's NAME is a Key terms row.
   Their address is the same kind of fact, so it is the row underneath it.

   THE NEGOTIATION PAGE ASKS NOTHING. No strip, for any contract, in any state.

   SKIPPING MUST NOT REBUILD THE DEAD END. Never fill it in, propose a change,
   and the send still appears — it just asks for the address at that moment
   instead of sending. The one thing that must never happen again is work with
   nowhere to go.

   AND THE FULL DIALOG DOES NOT DISAPPEAR. Purpose, expiry, channel and a
   covering message still matter — a signing link is not a negotiation link —
   and Share in the room head is the door to all of it.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-770', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

async function room(opts = {}, over = {}){
  const { win } = buildWorld({ negotiationView: true, contractView: true });
  const c = contract(over);
  win.negoInit(c);
  const calls = { setContact: [], direct: 0, dialog: 0 };
  const propose = async num => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[num].summary });
  };
  const paint = () => {
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      onSetCounterparty: x => calls.setContact.push(x),
      onSendDirect: () => { calls.direct++; },
      onShareLink: () => { calls.dialog++; },
      ...opts });
    const host = win.document.querySelector('#nego-room') || win.document;
    return {
      strip: host.querySelector('[id="nego-cp-setup"]'),
      send: host.querySelector('[id="nego-send"]'),
      more: host.querySelector('[id="nego-cp-more"]'),
      host,
    };
  };
  const press = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  return { win, c, calls, propose, paint, press };
}

/* The Key terms panel, mounted and wired the way the tab mounts it, so a test
   presses the row a person presses rather than calling the setter behind it.

   The stage boots the negotiation modules, not the money-and-dates half of the
   shell, so the four readers this panel calls are supplied here. Stubs for the
   SHELL only — the panel's own behaviour is the thing under test. */
function ktShell(win){
  win.isMonetary = c => (c.valueType || 'estimated') !== 'none';
  win.fmtMoney = v => 'KES ' + Number(v || 0).toLocaleString('en-KE');
  win.fmtDocDate = v => String(v || '');
  win.streamLabel = () => 'Cost';
  win.keyTermsProgress = () => {};
  win.syncKeyTermsUI = () => {};
  win.renderAuditSection = () => {};
  win.todayStr = () => '06 Aug 2026';
}

function keyTerms(over = {}){
  const { win } = buildWorld({ contractView: true });
  ktShell(win);
  const c = contract(over);
  const host = win.document.createElement('div');
  host.id = 'kt-rows';
  win.document.body.appendChild(host);
  host.innerHTML = win.ktTermsRowsHtml(c, { editable: true });
  win.wireKtRows(c); win.wireKeyTerms(c);
  return { win, c, host,
    row: k => host.querySelector(`[data-kt-row="${k}"]`),
    field: k => host.querySelector(`[data-kt="${k}"]`),
    press: el => el.dispatchEvent(new win.Event('click', { bubbles: true })),
    type: (el, v) => { el.value = v; el.dispatchEvent(new win.Event('input', { bubbles: true })); } };
}

describe('F77 — asking who, once, where their name is asked', () => {
  test('their email is a Key terms row, directly under their name', () => {
    const k = keyTerms();
    assert.ok(k.row('counterparty'), 'the name is there, as it always was');
    assert.ok(k.row('cpEmail'), 'and the address is the fact underneath it');
    assert.match(k.row('cpEmail').textContent, /Their email/);
    assert.match(k.row('cpEmail').textContent, /Not set/,
      'read as a value, not as an empty box — nothing looks like a field until you touch it');
  });

  test('filling it in records the address on the contract', () => {
    const k = keyTerms();
    k.press(k.row('cpEmail').querySelector('[data-kt-edit]'));
    k.type(k.field('cpEmail'), 'erik@nordfrakt.se');
    assert.equal(k.c.counterpartyEmail, 'erik@nordfrakt.se');
  });

  test('and the row reads it back as a value, not as a filled-in box', () => {
    const k = keyTerms({ counterpartyEmail: 'erik@nordfrakt.se' });
    assert.match(k.row('cpEmail').querySelector('.kt-read').textContent, /erik@nordfrakt\.se/);
    assert.doesNotMatch(k.row('cpEmail').querySelector('.kt-read').textContent, /Not set/);
  });

  test('a signed contract states it and does not offer to change it', () => {
    const { win } = buildWorld({ contractView: true });
    ktShell(win);
    const c = contract({ status: 'Signed', counterpartyEmail: 'erik@nordfrakt.se' });
    const html = win.ktTermsRowsHtml(c, { editable: false });
    assert.match(html, /erik@nordfrakt\.se/, 'the record still says who it went to');
    assert.doesNotMatch(html, /data-kt="cpEmail"/, 'but there is nothing to type into');
  });
});

describe('F77 — and the negotiation page asks nothing at all', () => {
  test('no strip, on a contract we have no address for', async () => {
    const r = await room();
    assert.ok(!r.paint().strip,
      'this was the last banner between the top of the page and the contract');
  });

  test('nor when we do have one', async () => {
    const r = await room({ contact: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } });
    assert.ok(!r.paint().strip);
  });

  test('nor for the counterparty, who was never asked', async () => {
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const c = contract();
    win.negoInit(c);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik', persist: false });
    const host = win.document.querySelector('#nego-room') || win.document;
    assert.ok(!host.querySelector('[id="nego-cp-setup"]'));
  });

  test('nor for a viewer', async () => {
    const r = await room({ readonly: true });
    assert.ok(!r.paint().strip);
  });

  test('and nothing stands in the way of somebody who only wanted to read', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(!p.host.querySelector('[data-nego-modal]'),
      'no dialog fires on opening — that was true of the strip and stays true without it');
  });
});

describe('F77 — and then sending is just sending', () => {
  test('with an address known, the send goes straight out', async () => {
    const r = await room({ contact: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } });
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    const p = r.paint();
    assert.match(p.send.className, /nego-pulse/, 'the same flashing button as theirs');
    r.press(p.send);
    assert.equal(r.calls.direct, 1, 'no dialog — we already know where it goes');
    assert.equal(r.calls.dialog, 0);
  });

  test('without one, it asks instead of failing', async () => {
    const r = await room();
    await r.propose('4');
    r.win.negoHandOver(r.c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    await r.propose('5');
    const p = r.paint();
    assert.ok(p.send, 'the work still has somewhere to go — this is the dead end we removed');
    r.press(p.send);
    assert.equal(r.calls.dialog, 1, 'the dialog collects the address it needs');
    assert.equal(r.calls.direct, 0);
  });
});

/* ASKED ONCE, WHERE YOU ARE ALREADY NAMING THEM.

   Walked as a customer walks it: create a contract from a template, go to the
   negotiation, make a change, press send. The counterparty was asked for THREE
   TIMES in that one sitting — the wizard took their name, the negotiation strip
   took their email, and the share dialog asked for both again with empty boxes.

   The templates carry a name and nothing carried an address, so the address was
   collected at the two later points instead of the obvious first one. */
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

/* Whatever the last modal put on the screen. */
function formOf(files, call){
  const modals = [];
  /* A real object, not the catch-all proxy: openWizard lists templates with
     Object.values(), which a proxy without ownKeys answers as empty. */
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

describe('F77 — the address is asked for once, at the start', () => {
  test('the wizard offers a place to put it', () => {
    const { html } = formOf(['js/wizard.js'], sb => sb.openWizard('WH'));
    assert.match(html, /wz-cpemail/, 'beside the field that names them');
    assert.match(html, /Their email/);
  });

  test('the upload form offers one too', () => {
    const { html } = formOf(['js/views/contract.js'], sb => sb.openUploadModal());
    assert.match(html, /up-cpemail/,
      'a received contract has a counterparty to answer just as a drafted one does');
  });

  test('once the contract carries it, nothing asks again', () => {
    const sb = loadViews(['js/richdoc.js', 'js/core.js'],
      { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const known = { id: 'MK-KNOWN', counterparty: 'Young Mbagaya',
      counterpartyEmail: 'young@mkataba.co.ke' };
    const contact = sb.counterpartyContact(known, []);
    assert.ok(contact, 'the contract itself answers the question');
    assert.equal(contact.email, 'young@mkataba.co.ke');
    assert.equal(sb.shareModalPrefill([], known).email, 'young@mkataba.co.ke',
      'so even the dialog opens filled in rather than blank');
    assert.equal(sb.shareModalPrefill([], {}).email, '',
      'and stays blank where there is genuinely nothing to fill it with');
  });

  test('and the negotiation strip never appears for such a contract', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const known = contract({ id: 'MK-KNOWN', counterpartyEmail: 'young@mkataba.co.ke' });
    w.win.negoInit(known);
    w.win.negoResetView();
    w.win.openNegotiationRoom(known, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
      contact: { name: 'Young Mbagaya', email: 'young@mkataba.co.ke' },
      onSetCounterparty(){}, onSendDirect(){} });
    const host = w.win.document.querySelector('#nego-room') || w.win.document;
    assert.ok(!host.querySelector('[id="nego-cp-setup"]'),
      'the strip is a fallback for contracts that have no address, not a step');
  });
});

/* AND THE SAME QUESTION ON THE OTHER TEMPLATE ROUTE.

   Saved templates ("My templates") do not go through the guided wizard — they
   have their own fill form. Adding the address to the wizard alone left every
   contract made from a saved template exactly where it started: asked in the
   negotiation room, and again by the share dialog. */
describe('F77 — saved templates ask for it too', () => {
  const tpl = { id: 'ct_1', name: 'WH', folder: 'proc', text: 'Body', chars: 4,
    fields: [{ key: 'counterparty', label: 'Supplier', maps: 'counterparty', type: 'text' }] };
  const lib = () => {
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
    return { sb, modals };
  };

  test('the fill form offers a place for their email', () => {
    const { sb, modals } = lib();
    sb.openTemplateFillModal(tpl);
    assert.match(modals[modals.length - 1] || '', /tf-cpemail/,
      'the same question the built-in templates ask, because it is the same act');
  });

  test('and the draft carries it', () => {
    const { sb } = lib();
    sb.buildFromCustomTemplate(tpl, { counterparty: 'Young Mbagaya' },
      { counterpartyEmail: 'young@mkataba.co.ke' });
    assert.equal(sb.state.contracts[0].counterpartyEmail, 'young@mkataba.co.ke');
  });

  test('a template with no blanks still creates, with nothing invented', () => {
    const { sb } = lib();
    sb.buildFromCustomTemplate({ ...tpl, fields: [] }, {});
    assert.equal(sb.state.contracts[0].counterpartyEmail, undefined,
      'no form was shown, so nothing was asked — the negotiation strip covers it');
  });
});
