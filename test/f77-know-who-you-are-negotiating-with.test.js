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

   IT ASKS WITHOUT BLOCKING. A modal that fires on opening the negotiation is in
   the way of somebody who only wanted to look, and "skip" is a button you have
   to press to dismiss something you never asked for. It is a strip at the top
   of the room: ignore it and it waits, fill it in and it goes.

   SKIPPING MUST NOT REBUILD THE DEAD END. Ignore the strip, propose a change,
   and the send still appears — it just asks for the address at that moment
   instead of sending. The one thing that must never happen again is work with
   nowhere to go.

   AND THE FULL DIALOG DOES NOT DISAPPEAR. Purpose, expiry, channel and a
   covering message still matter — a signing link is not a negotiation link —
   so the strip carries a way through to all of it.
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

describe('F77 — asking who, once', () => {
  test('the strip appears when we have no address for them', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(p.strip, 'the owner is about to negotiate with somebody we cannot reach');
    assert.match(p.strip.textContent, /Nordfrakt Logistik AB/,
      'and it already knows who — only the address is missing');
  });

  test('ignoring it is enough — nothing has to be dismissed', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(!p.host.querySelector('[data-nego-modal]'),
      'a strip waits; a dialog would be standing in the way of somebody who only wanted to read');
  });

  test('filling it in records the contact and the strip goes', async () => {
    const r = await room();
    let p = r.paint();
    p.host.querySelector('[id="nego-cp-email"]').value = 'erik@nordfrakt.se';
    r.press(p.host.querySelector('[id="nego-cp-save"]'));
    assert.equal(r.calls.setContact.length, 1);
    assert.equal(r.calls.setContact[0].email, 'erik@nordfrakt.se');
  });

  test('once we know it, the strip is gone', async () => {
    const r = await room({ contact: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } });
    assert.ok(!r.paint().strip, 'asked once, not on every visit');
  });

  test('a bad address is refused rather than saved', async () => {
    const r = await room();
    const p = r.paint();
    p.host.querySelector('[id="nego-cp-email"]').value = 'not-an-address';
    r.press(p.host.querySelector('[id="nego-cp-save"]'));
    assert.equal(r.calls.setContact.length, 0);
  });

  test('the counterparty never sees it — it is not their question', async () => {
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const c = contract();
    win.negoInit(c);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik', persist: false });
    const host = win.document.querySelector('#nego-room') || win.document;
    assert.ok(!host.querySelector('[id="nego-cp-setup"]'));
  });

  test('nor does a viewer, who cannot act on it', async () => {
    const r = await room({ readonly: true });
    assert.ok(!r.paint().strip);
  });

  test('and the full dialog is still one press away', async () => {
    const r = await room();
    const p = r.paint();
    assert.ok(p.more, 'purpose, expiry, channel and a covering message all still matter');
    r.press(p.more);
    assert.equal(r.calls.dialog, 1);
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
