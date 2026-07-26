/* ============================================================
   F17 — the app remembers who it is negotiating with
   ============================================================
   The share dialog opened blank every time. Six rounds meant retyping the same
   counterparty's address six times: five or six chances to send a live contract
   to the wrong person, and enough friction to discourage a round that was
   needed. The server had stored the recipient on every share row since shares
   existed — nothing ever read it back.

   These run against the real helpers in js/core.js, and against the real
   markup openShareModal produces. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

/* core.js DECLARES currentUser, canEdit, buildSharePayload and friends, so a
   value passed into loadViews as an override is overwritten the moment the file
   evaluates. Anything standing in for a core function has to be assigned after
   the load — the modules read their globals at call time, so a late assignment
   is the one that counts. */
function core(over = {}) {
  const s = loadViews(['js/richdoc.js', 'js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  /* Identity comes through the real seam. `const currentUser` is a lexical
     binding inside core.js, so assigning s.currentUser would not change what
     canEdit() sees — but currentUser reads window.REMOTE, which is how server
     mode signs a user in for real. Setting it is signing in, not faking it. */
  const me = { id: 'u_w', name: 'Wanjiru Kamau', role: over.role || 'legal', email: 'w@x.co.ke' };
  s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
  s.toast = () => {};
  s.renderAuditSection = () => {}; s.renderSharesSection = () => {}; s.refreshShareOverview = () => {};
  s.renderWorkspace = () => {}; s.setView = () => {};
  Object.assign(s, over);
  return s;
}

const share = (over = {}) => ({ token: 't1', recipientName: 'Erik Lindqvist',
  recipientEmail: 'erik@nordkust.se', recipientPhone: null, channel: 'email',
  createdAt: '2026-07-26T08:00:00.000Z', state: 'opened', ...over });

describe('F17 — reading the last recipient back', () => {
  test('the most recent share names the counterparty', () => {
    const s = core();
    const last = s.lastShareRecipient([share()]);
    assert.equal(last.email, 'erik@nordkust.se');
    assert.equal(last.name, 'Erik Lindqvist');
    assert.equal(last.channel, 'email');
  });

  test('the NEWEST share wins, whatever order the server returned them in', () => {
    const s = core();
    const last = s.lastShareRecipient([
      share({ token: 'old', recipientEmail: 'old@nordkust.se', createdAt: '2026-07-20T08:00:00.000Z' }),
      share({ token: 'new', recipientEmail: 'new@nordkust.se', createdAt: '2026-07-26T08:00:00.000Z' }),
      share({ token: 'mid', recipientEmail: 'mid@nordkust.se', createdAt: '2026-07-23T08:00:00.000Z' }),
    ]);
    assert.equal(last.email, 'new@nordkust.se');
  });

  test('a WhatsApp share is remembered as WhatsApp, with its number', () => {
    const s = core();
    const last = s.lastShareRecipient([share({ channel: 'whatsapp',
      recipientEmail: null, recipientPhone: '+254712345678' })]);
    assert.equal(last.channel, 'whatsapp');
    assert.equal(last.phone, '+254712345678');
  });

  test('a revoked or expired link still identifies the person', () => {
    const s = core();
    // the link died; the counterparty did not
    const last = s.lastShareRecipient([share({ state: 'revoked' })]);
    assert.equal(last.email, 'erik@nordkust.se');
  });

  test('an anonymous copy-link share names nobody, and is skipped', () => {
    const s = core();
    assert.equal(s.lastShareRecipient([
      share({ token: 'anon', recipientName: null, recipientEmail: null, recipientPhone: null,
        channel: 'link', createdAt: '2026-07-27T08:00:00.000Z' }),
      share(),
    ]).email, 'erik@nordkust.se', 'a link with no recipient tells us nothing about who to send to');
  });

  test('no history at all is not an error', () => {
    const s = core();
    assert.equal(s.lastShareRecipient([]), null);
    assert.equal(s.lastShareRecipient(null), null);
    // field-by-field, not deepEqual: the object is built inside the vm realm
    // and does not share Node's Object.prototype
    for (const empty of [s.shareModalPrefill([]), s.shareModalPrefill(undefined)]) {
      assert.equal(empty.name, ''); assert.equal(empty.email, '');
      assert.equal(empty.phone, ''); assert.equal(empty.channel, 'email');
    }
  });
});

describe('F17 — the dialog opens already filled in', () => {
  test('prefill carries name, email and channel', () => {
    const s = core();
    const pre = s.shareModalPrefill([share()]);
    assert.equal(pre.name, 'Erik Lindqvist');
    assert.equal(pre.email, 'erik@nordkust.se');
    assert.equal(pre.channel, 'email');
  });

  test('the rendered dialog really carries the values, and says why', async () => {
    let modalHtml = '';
    const s = core({
      openModal: html => { modalHtml = String(html); return { innerHTML: '' }; },
      api: async (p) => (p === 'contracts/MK-1/shares' ? { shares: [share()] } : {}),
      ensureFull: async () => {}, captureVersion: () => null, persist: () => {},
      sha256: async () => 'h'.repeat(64),
      buildSharePayload: () => ({ v: 1, kind: 'hati-share' }),
      contractReadiness: () => ({ ok: true, blocks: [] }),
      readinessPanelHtml: () => '',
      isUpload: () => false,
    });
    await s.openShareModal({ id: 'MK-1', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      status: 'Under Review', value: 1, valueType: 'estimated', fields: {}, audit: [] });

    assert.match(modalHtml, /value="Erik Lindqvist"/, "the recipient's name must be filled in");
    assert.match(modalHtml, /value="erik@nordkust\.se"/, 'their email must be filled in');
    assert.match(modalHtml, /Filled in from the last time you shared/,
      'a prefilled field must say where it came from, or it reads as a mistake');
  });

  test('a quote in a stored name cannot break out of the input attribute', async () => {
    let modalHtml = '';
    const s = core({
      openModal: html => { modalHtml = String(html); return { innerHTML: '' }; },
      api: async () => ({ shares: [share({ recipientName: 'Erik" onfocus="alert(1)' })] }),
      ensureFull: async () => {}, captureVersion: () => null, persist: () => {},
      sha256: async () => 'h'.repeat(64), buildSharePayload: () => ({}),
      contractReadiness: () => ({ ok: true, blocks: [] }), readinessPanelHtml: () => '',
      isUpload: () => false,
    });
    await s.openShareModal({ id: 'MK-1', name: 'X', counterparty: 'Y', status: 'Under Review',
      value: 1, valueType: 'estimated', fields: {}, audit: [] });
    assert.ok(!/onfocus="alert/.test(modalHtml), 'a stored value must not escape its attribute');
    assert.match(modalHtml, /&quot;/);
  });

  test('a contract never shared before opens blank, with no explanation banner', async () => {
    let modalHtml = '';
    const s = core({
      openModal: html => { modalHtml = String(html); return { innerHTML: '' }; },
      api: async () => ({ shares: [] }),
      ensureFull: async () => {}, captureVersion: () => null, persist: () => {},
      sha256: async () => 'h'.repeat(64), buildSharePayload: () => ({}),
      contractReadiness: () => ({ ok: true, blocks: [] }), readinessPanelHtml: () => '',
      isUpload: () => false,
    });
    await s.openShareModal({ id: 'MK-1', name: 'X', counterparty: 'Y', status: 'Under Review',
      value: 1, valueType: 'estimated', fields: {}, audit: [] });
    assert.ok(!/Filled in from the last time/.test(modalHtml));
    assert.match(modalHtml, /id="sh-name" type="text" value=""/);
  });
});

describe('F17 — "Send updated version"', () => {
  const resolved = { n: 1, status: 'closed', by: 'Erik Lindqvist', comment: 'Net-60.',
    resolution: { decision: 'accepted', by: 'Wanjiru Kamau', at: '2026-07-26T10:00:00.000Z' } };

  test('the button appears only once a round has actually been decided', () => {
    const s = core();
    const hosts = {};
    s.document.getElementById = id => (hosts[id] = hosts[id] || {
      innerHTML: '', querySelectorAll: () => [], addEventListener() {} });

    s.renderNegotiationSection({ id: 'MK-1', status: 'Under Review',
      rounds: [{ n: 1, status: 'open', by: 'Erik', comment: 'x', resolution: null }] });
    assert.ok(!/nego-reshare/.test(hosts['nego-section'].innerHTML),
      'nothing has been decided yet — there is no updated version to send');

    s.renderNegotiationSection({ id: 'MK-1', status: 'Under Review', rounds: [resolved] });
    assert.match(hosts['nego-section'].innerHTML, /nego-reshare/);
    assert.match(hosts['nego-section'].innerHTML, /Send updated version/);
  });

  test('a signed contract offers no reshare', () => {
    const s = core();
    const hosts = {};
    s.document.getElementById = id => (hosts[id] = hosts[id] || {
      innerHTML: '', querySelectorAll: () => [], addEventListener() {} });
    s.renderNegotiationSection({ id: 'MK-1', status: 'Signed', rounds: [resolved] });
    assert.ok(!/nego-reshare/.test(hosts['nego-section'].innerHTML));
  });

  test('a viewer is not offered it either', () => {
    const s = core({ role: 'viewer' });
    const hosts = {};
    s.document.getElementById = id => (hosts[id] = hosts[id] || {
      innerHTML: '', querySelectorAll: () => [], addEventListener() {} });
    s.renderNegotiationSection({ id: 'MK-1', status: 'Under Review', rounds: [resolved] });
    assert.ok(!/nego-reshare/.test(hosts['nego-section'].innerHTML));
  });

  test('it posts one share to the remembered recipient and records it (checklist 5)', async () => {
    const posted = [];
    const s = core({
      api: async (p, m, body) => {
        if (p === 'contracts/MK-1/shares') return { shares: [share()] };
        if (p === 'shares' && m === 'POST') { posted.push(body); return { token: 'newtok', link: 'https://h/#share=t:newtok' }; }
        return {};
      },
      ensureFull: async () => {}, persist: () => {}, sha256: async () => 'h'.repeat(64),
      captureVersion: () => ({ n: 2 }), buildSharePayload: () => ({ v: 1, kind: 'hati-share' }),
    });
    const c = { id: 'MK-1', name: 'Supply Agreement', status: 'Under Review', audit: [],
      value: 1, valueType: 'estimated', fields: {}, rounds: [resolved] };

    const out = await s.reshareToLastRecipient(c);
    assert.equal(posted.length, 1, 'one press must send exactly one share');
    assert.equal(posted[0].recipient.email, 'erik@nordkust.se',
      'it must go to the person we were already negotiating with');
    assert.equal(posted[0].channel, 'email', 'and by the channel they used');
    assert.equal(out.recipient.name, 'Erik Lindqvist');
    assert.match((c.audit || []).map(e => e.detail).join(' '), /Updated version sent to Erik Lindqvist/,
      'the send must be on the record');
  });

  test('with nobody on record it refuses rather than sending into the void', async () => {
    const s = core({ api: async () => ({ shares: [] }), ensureFull: async () => {},
      persist: () => {}, sha256: async () => 'h'.repeat(64), captureVersion: () => null });
    await assert.rejects(
      s.reshareToLastRecipient({ id: 'MK-1', name: 'X', status: 'Under Review', audit: [], fields: {} }),
      /not been shared with anyone/);
  });

  test('a viewer cannot reshare', async () => {
    const s = core({ role: 'viewer' });
    await assert.rejects(
      s.reshareToLastRecipient({ id: 'MK-1', name: 'X', status: 'Under Review', audit: [], fields: {} }),
      /Viewers cannot share/);
  });
});
