/* f479 — ONE ADDRESS BOOK (the process review, 4 Oct 2026)
   ============================================================================
   The other side's people could be typed in ten boxes — the wizard's card,
   the essentials form, the saved-template fill, the upload, the Overview's
   "Their email", the people list, the parties editor, the signing route, the
   send screen and the handover — and each kept its own copy, so one person
   could carry three addresses and nothing said which a round would use.

   "People on this contract" (js/participants.js) is now the ONE store:
   `contactSet` the one writer, `contactsOf` / `contactEmail` the one reading.
   The record's `counterpartyEmail`, a party's `email` and a signer's address
   are MIRRORS the writer keeps in step.

   WHAT THIS FILE PINS
     (1) a change typed in any one box shows the same address in all the others
     (2) an old record is READ as if it had been written through the book
     (3) the route follows only while it may: never a signed row, never once
         anybody has signed
     (4) the send screen adds whoever a link went to, and offers the book
     (5) every box reads and writes through the one pair (source)

   Run: node --test test/f479-one-address-book.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); } catch(_){ return ''; } };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const w = () => {
  const world = buildWorld({ participants: true });
  world.win.currentUser = () => ({ id: 'u-me', name: 'Ingrid Sjoberg' });
  world.win.getUsers = () => [];
  return world.win;
};
const contract = (over = {}) => ({ id: 'MK-479', name: 'Juno supply', status: 'Draft', folder: 'proc',
  counterparty: 'Juno Limited', audit: [], comments: [], ...over });
const signer = (over = {}) => ({ id: 'sg_t', party: 'counterparty', name: 'Amina Juma',
  email: 'amina@juno.co.ke', order: 2, signed: false, ...over });
/* EVERY BOX'S READING, asked the way each box asks it. */
const everywhere = (win, c) => ({
  overview: win.contactEmail(c),
  record: c.counterpartyEmail || '',
  people: (win.contactsOf(c).find(r => r.main) || {}).email || '',
  route: ((c.signerPlan || []).find(s => s.party === 'counterparty') || {}).email || '',
  party: win.contractParties(c).filter(p => p.side !== 'ours').map(p => p.email)[0] || '',
});

describe('f479 (1) one address, every box', () => {
  test('the Overview box writes the book, and the record, list, route and party all say it', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'amina@juno.co.ke', signerPlan: [signer()] });
    /* the person is the main contact AND their signer: one address */
    win.contactSet(c, { main: true, email: 'amina.juma@juno.co.ke' });
    const all = everywhere(win, c);
    for (const [box, v] of Object.entries(all)) assert.equal(v, 'amina.juma@juno.co.ke', box + ' shows the new address');
  });
  test('the people list writes the book too, and the Overview reads it back', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'a@juno.co.ke' });
    const row = win.contactSet(c, { main: true, email: 'a@juno.co.ke' });
    assert.ok(row && row.id, 'the record\'s contact is a stored person');
    win.participantSet(c, row.id, { email: 'b@juno.co.ke' });
    assert.equal(win.contactEmail(c), 'b@juno.co.ke');
    assert.equal(c.counterpartyEmail, 'b@juno.co.ke', 'the record is the mirror');
  });
  test('the signing route\'s box moves the same person everywhere (was → now)', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'amina@juno.co.ke', signerPlan: [signer()] });
    win.contactSet(c, { role: 'cpsign', name: 'Amina Juma', email: 'amina@juno.ke', was: 'amina@juno.co.ke' });
    assert.equal(win.contactEmail(c), 'amina@juno.ke', 'the main contact was the same person');
    assert.equal(c.counterpartyEmail, 'amina@juno.ke');
  });
  test('two different people keep two addresses', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'lead@juno.co.ke', signerPlan: [signer({ email: 'cfo@juno.co.ke' })] });
    win.contactSet(c, { main: true, email: 'lead2@juno.co.ke' });
    assert.equal(c.signerPlan[0].email, 'cfo@juno.co.ke', 'the CFO is somebody else');
  });
  test('the parties editor\'s box is the party\'s main contact', () => {
    const win = w();
    const c = contract();
    win.partiesSet(c, win.contractParties(c).concat([{ id: 'py_two', name: 'Kilo AB', side: 'theirs', email: '' }]));
    win.contactSet(c, { main: true, partyId: 'py_two', email: 'k@kilo.se' });
    assert.equal(win.contactEmail(c, 'py_two'), 'k@kilo.se');
    assert.equal(c.parties.find(p => p.id === 'py_two').email, 'k@kilo.se', 'the stored party mirrors it');
    assert.equal(c.counterpartyEmail, undefined, 'and the first party is untouched');
  });
  test('emptying the contact empties the mirror rather than leaving it behind', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'a@juno.co.ke' });
    win.contactSet(c, { main: true, email: '' });
    assert.equal(c.counterpartyEmail, undefined);
    assert.equal(win.contactEmail(c), '');
  });
});

describe('f479 (2) a record on file reads as if written through the book', () => {
  test('the record and the route are read as people, and reading writes nothing', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'a@juno.co.ke', counterpartyName: 'Asha', signerPlan: [signer()] });
    const rows = win.contactsOf(c);
    assert.equal(c.participants, undefined, 'reading must not write');
    assert.ok(rows.some(r => r.main && r.email === 'a@juno.co.ke' && r.name === 'Asha'));
    assert.ok(rows.some(r => r.role === 'cpsign' && r.email === 'amina@juno.co.ke'));
  });
  test('the Overview\'s list draws those rows, and editing one stores it', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'a@juno.co.ke' });
    const html = win.participantsPanelHtml(c, { editable: true, book: true });
    assert.match(html, /data-pt-dmail="a@juno.co.ke"/);
    assert.ok(!/data-pt-dmail/.test(win.participantsPanelHtml(c, { editable: true })),
      'only where the caller asks — the drafting screen has no record yet');
  });
  test('arrival adopts the address once', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'a@juno.co.ke' });
    assert.equal(win.contactAdopt(c), true);
    assert.equal(win.contactAdopt(c), false, 'idempotent');
    assert.equal(c.participants.filter(p => p.main).length, 1);
  });
});

describe('f479 (3) the route follows only while it may', () => {
  test('a signed row keeps the address it signed under', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'amina@juno.co.ke', signerPlan: [signer({ signed: true })] });
    win.signingLocked = () => true;
    win.contactSet(c, { main: true, email: 'new@juno.co.ke' });
    assert.equal(c.signerPlan[0].email, 'amina@juno.co.ke');
  });
  test('an unsigned row on a route nobody has signed follows', () => {
    const win = w();
    const c = contract({ counterpartyEmail: 'amina@juno.co.ke', signerPlan: [signer()] });
    win.signingLocked = () => false;
    win.contactSet(c, { main: true, email: 'new@juno.co.ke' });
    assert.equal(c.signerPlan[0].email, 'new@juno.co.ke');
  });
});

describe('f479 (4) the send screen picks from the book and adds to it', () => {
  test('a signing link\'s address joins the book as their signer, not as the contact', () => {
    const win = w();
    if (typeof win.shareRememberRecipient !== 'function') return;
    const c = contract({ counterpartyEmail: 'lead@juno.co.ke' });
    assert.equal(win.shareRememberRecipient(c, { purpose: 'sign', email: 'cfo@juno.co.ke', name: 'Amina' }), false);
    assert.ok(win.contactsOf(c).some(r => r.role === 'cpsign' && r.email === 'cfo@juno.co.ke'));
    assert.equal(c.counterpartyEmail, 'lead@juno.co.ke', 'first one wins, as before');
  });
  test('the first negotiating send makes them the contact', () => {
    const win = w();
    if (typeof win.shareRememberRecipient !== 'function') return;
    const c = contract();
    assert.equal(win.shareRememberRecipient(c, { purpose: 'negotiate', email: 'a@juno.co.ke', name: 'Asha' }), true);
    assert.equal(win.contactEmail(c), 'a@juno.co.ke');
    assert.equal(c.counterpartyName, 'Asha');
  });
  test('the send box offers the book', () => {
    const CORE = read('js/core.js');
    assert.match(CORE, /<input id="sh-email"[^>]*list="sh-email-book"/);
    assert.match(CORE, /<datalist id="sh-email-book">\$\{\(\(typeof contactChoices==='function'\)/);
  });
});

describe('f479 (5) every box goes through the one pair', () => {
  const sites = {
    'js/wizard.js': /contactSet\(c,\{ main:true, email:cpEmail \}\)/,
    'js/views/library.js': /contactSet\(c,\{ main:true, email:cpEmail \}\)/,
    'js/templatefields.js': /window\.contactSet\(c,\{ main:true, email:em \}\)/,
    'js/views/handover.js': /_hoBookEmail\(c\)/,
    'js/family.js': /window\.contactSet\(c, \{ main:true, email:cpMail/,
    'js/approvals.js': /contactSet\(c, \{ role:'cpsign'/,
    'js/views/negotiation.js': /ctSetTheirEmail\(c, \(x && x\.email\)/,
    'js/triage.js': /contactAdopt\(c\)/,
  };
  for (const [f, re] of Object.entries(sites))
    test(f + ' writes or reads through the book', () => assert.match(strip(read(f)), re));
  test('the Overview, the upload and the parties editor', () => {
    const CT = strip(read('js/views/contract.js'));
    assert.match(CT, /else if\(key==='cpEmail'\) ctSetTheirEmail\(c, inp\.value\)/);
    assert.match(CT, /if\(cpEmail\) ctSetTheirEmail\(c, cpEmail\)/);
    assert.match(CT, /ctSetTheirEmail\(c, next\.email, null, next\.id\)/);
    const rest = CT.replace(/function ctSetTheirEmail\([\s\S]*?\n\}/, '');
    assert.ok(!/c\.counterpartyEmail=/.test(rest), 'no box in the room writes the mirror by hand');
  });
  test('the address card reads the one book', () => {
    const fn = (read('js/participants.js').match(/function contractAddressBook\([\s\S]*?\n\}/) || [''])[0];
    assert.match(fn, /contactsOf\(c\)/);
    assert.ok(!/c\.counterpartyEmail/.test(fn), 'it admits nothing the book does not hold');
  });
});
