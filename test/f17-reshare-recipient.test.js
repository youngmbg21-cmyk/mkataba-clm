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
      contractReadiness: () => [],
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
      contractReadiness: () => [], readinessPanelHtml: () => '',
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
      contractReadiness: () => [], readinessPanelHtml: () => '',
      isUpload: () => false,
    });
    await s.openShareModal({ id: 'MK-1', name: 'X', counterparty: 'Y', status: 'Under Review',
      value: 1, valueType: 'estimated', fields: {}, audit: [] });
    assert.ok(!/Filled in from the last time/.test(modalHtml));
    assert.match(modalHtml, /id="sh-name" type="text" value=""/);
  });
});

/* ============================================================
   F17 — THE ROUND GOES ON THE LINK THEY ARE ACTUALLY READING
   ============================================================
   Reported (Young, 12 Aug 2026) on MK-255: the owner refused a change of the
   counterparty's, their page never showed it, Publish Round was pressed, and
   the counterparty reloaded their link to find nothing had moved.

   THREE PLACES DECIDED WHICH LINK A NEW COPY BELONGS ON, and they disagreed.
   The round send was the strictest of the three: it wanted a durable link whose
   recipient email matched the contact's, exactly. But the contact's address is
   not necessarily the address any link was made with — counterpartyContact
   fills a missing one from the newest share that has any, or from the contract
   record (that is f126, above), and a link made by copying a URL carries no
   address at all. So the match failed and the send did the one thing it must
   never do quietly: it minted a SECOND live link, reported "sent", and left the
   reader holding a copy nothing would ever refresh.

   The fix is one predicate (shareIsStanding — can this be refreshed in place?)
   and one ordering (standingShareFor — the link the contact CAME FROM, then the
   address, then the name, then the newest standing link there is). The last
   step is what closes the hole: the quiet catch-up already refreshes every
   durable link on the contract, so a round send that refuses to touch one the
   catch-up would have updated is stricter than the product was a second ago. */
describe('F17 — the round refreshes the link they already hold', () => {
  const stage = (shares) => {
    const puts = [], posted = [];
    const s = core({
      api: async (p, m, body) => {
        if (/\/shares$/.test(p) && (m || 'GET') === 'GET') return { shares };
        if (/^shares\/.+\/payload$/.test(p) && m === 'PUT') { puts.push({ token: p.split('/')[1], body }); return { ok: true, notifySkipped: true }; }
        if (p === 'shares' && m === 'POST') { posted.push(body); return { token: 'brandnew', link: 'https://h/#share=t:brandnew', emailSent: true, emailConfigured: true }; }
        return {};
      },
      ensureFull: async () => {}, persist: () => {}, sha256: async () => 'h'.repeat(64),
      captureVersion: () => ({ n: 2 }), buildSharePayload: () => ({ v: 1, kind: 'hati-share' }),
    });
    return { s, puts, posted,
      run: () => s.reshareToLastRecipient({ id: 'MK-255', name: 'Kwetu', status: 'Under Review',
        counterparty: 'Nordfrakt Logistik AB', counterpartyEmail: 'erik@nordkust.se',
        audit: [], value: 1, valueType: 'estimated', fields: {}, rounds: [] }) };
  };
  const standing = (over = {}) => share({ durable: true, revokedAt: null, expiresAt: null, ...over });

  test('THE REPORTED CASE: their link was made by copying a URL, so it carries no address', async () => {
    /* This is the shape that minted a second link. lastShareRecipient reads the
       name off it and counterpartyContact fills the address in from the
       contract record — an address this link was never created with. */
    const t = stage([standing({ token: 'theirs', recipientEmail: '', channel: 'link' })]);
    const out = await t.run();
    assert.deepEqual(t.puts.map(p => p.token), ['theirs'],
      'the copy behind the URL they hold is the one refreshed');
    assert.equal(t.posted.length, 0, 'and no second live link is created');
    assert.equal(out.reused, true);
    assert.ok(!out.stranded, 'nothing was stranded, so nothing is warned about');
  });

  test('their link was made with a DIFFERENT address from the one on record', async () => {
    const t = stage([standing({ token: 'theirs', recipientEmail: 'old@nordkust.se' })]);
    await t.run();
    assert.deepEqual(t.puts.map(p => p.token), ['theirs']);
    assert.equal(t.posted.length, 0);
  });

  test('EVERY standing link is caught up, so whichever they hold is current', async () => {
    /* Two links, one address between them. Picking one and leaving the other
       is how a reader on the older URL watches a round never arrive — and the
       quiet catch-up already refreshes both, so the round send must too. */
    const t = stage([
      standing({ token: 'newer', recipientEmail: 'erik@nordkust.se', createdAt: '2026-08-05' }),
      standing({ token: 'older', recipientEmail: '', createdAt: '2026-08-01' }),
    ]);
    await t.run();
    assert.deepEqual(t.puts.map(p => p.token).sort(), ['newer', 'older']);
    assert.equal(t.posted.length, 0);
    /* The others are caught up SILENTLY — they are copies being kept honest,
       not sends, and a second audit line each would read as several rounds. */
    assert.equal(t.puts.filter(p => p.body.silent).length, 1, 'exactly one of them is the round');
  });

  test('a REVOKED or EXPIRED link is never counted as theirs', async () => {
    for (const dead of [{ revokedAt: '2026-08-01' }, { expiresAt: '2020-01-01T00:00:00Z' },
      { state: 'expired' }, { durable: false }]) {
      const t = stage([standing({ token: 'theirs', recipientEmail: 'erik@nordkust.se', ...dead })]);
      await t.run();
      assert.equal(t.puts.length, 0, `a ${JSON.stringify(dead)} link must not be refreshed`);
      assert.equal(t.posted.length, 1, 'a new link is the only thing left');
    }
  });

  test('AND WHEN A SECOND LINK IS UNAVOIDABLE, IT IS SAID OUT LOUD', async () => {
    /* The half of the fix that survives a case the matching cannot rescue. A
       link made before standing links existed cannot be refreshed in place —
       the server refuses — so a new one is the only option. What must not
       happen again is the owner being told "sent" while the URL the reader
       actually holds goes quietly dead. */
    const t = stage([standing({ token: 'theirs', durable: false, recipientEmail: 'erik@nordkust.se' })]);
    const c = { id: 'MK-255', name: 'Kwetu', status: 'Under Review', audit: [],
      counterparty: 'Nordfrakt Logistik AB', counterpartyEmail: 'erik@nordkust.se',
      value: 1, valueType: 'estimated', fields: {}, rounds: [] };
    const out = await t.s.reshareToLastRecipient(c);
    assert.equal(out.stranded, true, 'the caller is told, so it can say so on screen');
    assert.match((c.audit.map(a => a.detail || '').join(' ')), /NEW link/,
      'and the history says it too');
    /* Case-insensitive on purpose: the audit line is prose and the on-screen
       warning shouts, and pinning the shout here would make the two one string
       when they are deliberately two registers. */
    assert.match((c.audit.map(a => a.detail || '').join(' ')), /will not update/i);
    /* And the on-screen sentence is written ONCE, for all four surfaces. */
    assert.equal(typeof t.s.reshareStrandedLine, 'function');
    assert.match(t.s.reshareStrandedLine('Erik'), /NEW link/);
    assert.match(t.s.reshareStrandedLine('Erik'), /will NOT update/);
  });

  test('but the FIRST send strands nothing, and says nothing', async () => {
    /* No earlier link exists, so there is no dead copy to warn about. An
       always-on warning is furniture. */
    const t = stage([]);
    const c = { id: 'MK-255', name: 'Kwetu', status: 'Under Review', audit: [],
      counterparty: 'Nordfrakt Logistik AB', counterpartyEmail: 'erik@nordkust.se',
      value: 1, valueType: 'estimated', fields: {}, rounds: [] };
    const out = await t.s.reshareToLastRecipient(c);
    assert.equal(t.posted.length, 1);
    assert.ok(!out.stranded);
    assert.doesNotMatch((c.audit.map(a => a.detail || '').join(' ')), /NEW link/);
  });

  test('ONE PREDICATE, and the quiet catch-up asks the same one', () => {
    const s = core();
    assert.equal(typeof s.shareIsStanding, 'function');
    assert.equal(s.shareIsStanding(standing({})), true);
    assert.equal(s.shareIsStanding(standing({ durable: false })), false);
    assert.equal(s.shareIsStanding(standing({ revokedAt: '2026-01-01' })), false);
    assert.equal(s.shareIsStanding(standing({ expiresAt: '2020-01-01T00:00:00Z' })), false);
    assert.equal(s.shareIsStanding(null), false);
    /* Read from the source: the two callers must not drift back apart. The
       quiet refresh used to filter on `s.expired`, a field the shares list does
       not send — so it read undefined and passed everything. */
    const fs = require('node:fs'), path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const fn = src.slice(src.indexOf('async function refreshLiveShareQuietly'));
    assert.match(fn.slice(0, 1400), /standingShares\(shares\)/,
      'the quiet catch-up asks the shared predicate');
    assert.ok(!/s\.durable && !s\.revokedAt && !s\.expired/.test(src),
      'and the old hand-rolled filter is gone');
  });

  test('the share DIALOG keeps matching the typed address, deliberately', () => {
    /* standingShareFor ends by taking the newest standing link when nothing
       matches. That is right for a round — the question is where this
       negotiation is happening — and WRONG in the dialog, where the sender has
       just named a recipient. Reusing a stranger's link because it was the only
       one open would be a worse bug than the one the ordering fixes. */
    const fs = require('node:fs'), path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const dlg = src.slice(src.indexOf('const wantDurable='), src.indexOf('const wantDurable=') + 700);
    assert.match(dlg, /standingShares\(priorShares\)/, 'it shares the predicate');
    assert.ok(!/standingShareFor/.test(dlg), 'but not the round send\'s fallback');
    assert.match(dlg, /recipientEmail/, 'the typed address is the match');
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
        if (p === 'shares' && m === 'POST') { posted.push(body); return { token: 'newtok', link: 'https://h/#share=t:newtok', emailSent: true, emailConfigured: true }; }
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
    /* The wording is deliberately precise: "emailed" only when something
       actually left. F24 covers the outcomes where nothing does. */
    assert.match((c.audit || []).map(e => e.detail).join(' '), /Updated version emailed to Erik Lindqvist/,
      'a delivered send must be on the record as delivered');
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
