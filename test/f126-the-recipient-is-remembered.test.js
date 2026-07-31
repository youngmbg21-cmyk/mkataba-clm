/* ============================================================
   f126 — the send stops asking for an address it already has
   ============================================================
   REPORTED FROM THE FIELD: "when I sent a redline, in some instances there was
   a pop-up asking for the counterparty's email on every sent message."

   THE FAULT. counterpartyContact returned the newest share WHOLE. A copy-link
   share records only a name and a WhatsApp share only a phone — neither
   carries an email — so one link copied to the clipboard shadowed a perfectly
   good address (the one recorded on the contract, or the one an earlier email
   share went to) for the rest of the negotiation. Every later send read
   `email: ''`, concluded it had nowhere to send, and reopened the dialog to
   ask a question the record could already answer. Once per round, for the life
   of the deal.

   THE RULE NOW: the newest share still decides WHO this is — name, channel,
   token — and the ADDRESS is a separate question, answered best-first: the
   most recent share that actually carries one, then the address recorded on
   the contract. A share without an email is not evidence that there is no
   email.

   AND THE SECOND HALF (#2): the two template-born creation paths recorded
   `counterparty:''` while spelling the typed name into the title, so the
   register's filters, the reports and the signing readiness check all read
   "counterparty not recorded" on a contract whose counterparty the operator
   had already named. Uploads always recorded it; all three now agree. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function core(){
  const w = loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts(){}, renderWorkspace(){}, setView(){}, renderSignButton(){},
    refreshStats(){}, API_MODE: () => true,
  });
  w.REMOTE = { me: { id: 'u1', name: 'Wanjiru Kamau' } };
  return w;
}
const share = (over = {}) => ({ token: 't' + Math.random().toString(36).slice(2, 6),
  recipientName: '', recipientEmail: '', recipientPhone: '', channel: 'link',
  createdAt: '2026-07-01', ...over });

describe('f126 — a share without an email does not erase the address we hold', () => {
  test('THE BUG: a copy-link share no longer shadows the contract\'s recorded address', () => {
    const w = core();
    const c = { id: 'MK-1', counterparty: 'Kabras Sugar', counterpartyEmail: 'buyer@kabras.co.ke' };
    const shares = [share({ recipientName: 'Kabras Sugar', channel: 'link', createdAt: '2026-07-30' })];
    const contact = w.counterpartyContact(c, shares);
    assert.equal(contact.email, 'buyer@kabras.co.ke',
      'the address the contract records answers when the newest share cannot');
    assert.equal(contact.name, 'Kabras Sugar', 'and the newest share still says who they are');
    assert.equal(contact.channel, 'link', 'including the channel they were reached on');
  });

  test('a WhatsApp share is the same case — phone recorded, email still known', () => {
    const w = core();
    const c = { id: 'MK-1', counterpartyEmail: 'buyer@kabras.co.ke' };
    const contact = w.counterpartyContact(c,
      [share({ recipientPhone: '+254700000000', channel: 'whatsapp', createdAt: '2026-07-30' })]);
    assert.equal(contact.email, 'buyer@kabras.co.ke');
    assert.equal(contact.phone, '+254700000000', 'the phone is not lost either');
  });

  test('an earlier EMAIL share answers when the newest share and the contract cannot', () => {
    const w = core();
    const c = { id: 'MK-1' };                       // nothing recorded on the contract
    const contact = w.counterpartyContact(c, [
      share({ recipientName: 'Erik', channel: 'link', createdAt: '2026-07-30' }),
      share({ recipientEmail: 'erik@nordfrakt.se', channel: 'email', createdAt: '2026-07-10' }),
    ]);
    assert.equal(contact.email, 'erik@nordfrakt.se',
      'the most recent share that actually carries an address');
  });

  test('the newest EMAIL share still wins over an older one — this is not a free-for-all', () => {
    const w = core();
    const contact = w.counterpartyContact({ id: 'MK-1', counterpartyEmail: 'old@kabras.co.ke' }, [
      share({ recipientEmail: 'current@kabras.co.ke', channel: 'email', createdAt: '2026-07-30' }),
      share({ recipientEmail: 'older@kabras.co.ke', channel: 'email', createdAt: '2026-07-01' }),
    ]);
    assert.equal(contact.email, 'current@kabras.co.ke');
  });

  test('with nothing known anywhere it still answers null — the dialog is right to open then', () => {
    const w = core();
    assert.equal(w.counterpartyContact({ id: 'MK-1' }, []), null);
    assert.equal(w.counterpartyContact({ id: 'MK-1' },
      [share({ recipientName: 'Nameless', channel: 'link' })]).email, '',
      'a name-only share on a contract with no address has no address to offer');
  });

  test('the dialog keeps remembering the first address, on whatever channel it was sent', () => {
    const w = core();
    const c = { id: 'MK-1' };
    assert.equal(w.shareRememberRecipient(c, { purpose: 'negotiate', email: 'a@b.co', name: 'A' }), true);
    assert.equal(c.counterpartyEmail, 'a@b.co');
    assert.equal(w.shareRememberRecipient(c, { purpose: 'negotiate', email: 'second@b.co' }), false,
      'first one wins — a one-off copy to counsel must not re-point the negotiation');
    assert.equal(w.shareRememberRecipient({ id: 'MK-2' }, { purpose: 'sign', email: 'md@b.co' }), false,
      'and a signing link is not a negotiating contact');
  });
});

describe('f126 — every category records the counterparty it was told about', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

  test('the wizard and custom-template paths record the name, like uploads always did', () => {
    assert.match(read('js/wizard.js'), /counterparty:cp,/,
      'the guided wizard files the name it collected');
    assert.match(read('js/views/library.js'), /counterparty:cp,/,
      'the custom-template path files the mapped counterparty field');
    assert.ok(!/counterparty:'',/.test(read('js/wizard.js')),
      'and neither leaves it blank while spelling the name into the title');
  });
});
