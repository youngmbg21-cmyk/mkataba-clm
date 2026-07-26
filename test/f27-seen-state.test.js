/* ============================================================
   F27 — "under review" is two different situations
   ============================================================
   A contract sitting at "Under Review" could mean the counterparty is reading
   it and thinking, or that they never opened it and do not know it exists.
   Those call for opposite actions from the owner, and the app showed the same
   thing for both.

   The answer was already in the data: the server records when a link is first
   opened, and a durable link's opened-marker is cleared each time the wording
   is refreshed, so "opened" always means "opened THIS version". Nothing ever
   read it back. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function core(over = {}) {
  const s = loadViews(['js/richdoc.js', 'js/core.js', 'js/versioning.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  const me = { id: 'u_w', name: 'Wanjiru Kamau', role: over.role || 'legal', email: 'w@x.co.ke' };
  s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
  s.toast = () => {}; s.persist = () => {};
  Object.assign(s, over);
  return s;
}
const contract = (over = {}) => ({ id: 'MK-1', name: 'Supply Agreement',
  counterparty: 'Nordkust Industri AB', status: 'Under Review', audit: [], rounds: [], ...over });

const ago = days => new Date(Date.now() - days * 86400000).toISOString();
const share = (over = {}) => ({ token: 't1', recipientName: 'Erik Lindqvist',
  recipientEmail: 'erik@nordkust.se', channel: 'email', state: 'sent',
  createdAt: ago(1), sentAt: ago(1), firstOpenedAt: null, respondedAt: null,
  revokedAt: null, durable: true, ...over });

describe('F27 — reading the state', () => {
  let s;
  before(() => { s = core(); });

  test('sent but never opened', () => {
    const st = s.counterpartySeenState(contract(), [share()]);
    assert.equal(st.kind, 'unopened');
    assert.equal(st.who, 'Erik Lindqvist');
  });

  test('opened, no answer yet', () => {
    const st = s.counterpartySeenState(contract(), [share({ firstOpenedAt: ago(1), state: 'opened' })]);
    assert.equal(st.kind, 'opened');
  });

  test('answered — the round strip already speaks, so this stays quiet', () => {
    const st = s.counterpartySeenState(contract(), [share({ respondedAt: ago(0), state: 'changes' })]);
    assert.equal(st.kind, 'responded');
    assert.equal(s.counterpartySeenHtml(contract(), [share({ respondedAt: ago(0) })]), '');
  });

  test('the NEWEST share is the one that matters', () => {
    const st = s.counterpartySeenState(contract(), [
      share({ token: 'old', createdAt: ago(9), firstOpenedAt: ago(8) }),
      share({ token: 'new', createdAt: ago(1), firstOpenedAt: null }),
    ]);
    assert.equal(st.kind, 'unopened', 'an older copy having been read says nothing about this one');
  });

  test('a revoked or expired link is not the live state', () => {
    assert.equal(s.counterpartySeenState(contract(), [share({ revokedAt: ago(0) })]), null);
    assert.equal(s.counterpartySeenState(contract(), [share({ state: 'expired' })]), null);
  });

  test('an anonymous copy-link says nothing — there is nobody to have seen it', () => {
    assert.equal(s.counterpartySeenState(contract(), [share({
      recipientName: null, recipientEmail: null, recipientPhone: null, channel: 'link' })]), null);
  });

  test('nothing shared, nothing to say', () => {
    assert.equal(s.counterpartySeenState(contract(), []), null);
    assert.equal(s.counterpartySeenState(contract(), null), null);
  });

  test('an executed contract is past all this', () => {
    assert.equal(s.counterpartySeenState(contract({ status: 'Signed' }), [share()]), null);
  });
});

describe('F27 — what the owner is shown', () => {
  let s;
  before(() => { s = core(); });

  test('unopened is stated plainly, with how long it has been', () => {
    const html = s.counterpartySeenHtml(contract(), [share({ sentAt: ago(1), createdAt: ago(1) })]);
    assert.match(html, /has not opened the current version/);
    assert.match(html, /Erik Lindqvist/);
    assert.match(html, /1 day ago/);
  });

  test('after a few days it escalates and suggests what to do', () => {
    const html = s.counterpartySeenHtml(contract(), [share({ sentAt: ago(5), createdAt: ago(5) })]);
    assert.match(html, /5 days ago/);
    assert.match(html, /worth chasing|check the link reached them/,
      'silence for days usually means the message never arrived');
    assert.match(html, /seen-resend/, 'and the fix must be one click away');
  });

  test('opened is reported as opened, and does not nag', () => {
    const html = s.counterpartySeenHtml(contract(), [share({ firstOpenedAt: ago(2), state: 'opened' })]);
    assert.match(html, /opened the current wording/);
    assert.match(html, /2 days ago/);
    assert.ok(!/worth chasing/.test(html), 'they have it — that is not a problem to solve');
  });

  test('"today" reads as today, not "0 days ago"', () => {
    const html = s.counterpartySeenHtml(contract(), [share({ sentAt: ago(0), createdAt: ago(0) })]);
    assert.match(html, /Sent today/);
    assert.ok(!/0 day/.test(html));
  });

  test('a viewer is told the state but offered no button', () => {
    const v = core({ role: 'viewer' });
    const html = v.counterpartySeenHtml(contract(), [share({ sentAt: ago(5), createdAt: ago(5) })]);
    assert.match(html, /has not opened/);
    assert.ok(!/seen-resend/.test(html));
  });

  test('a hostile recipient name cannot inject markup', () => {
    const html = s.counterpartySeenHtml(contract(), [share({ recipientName: '<img src=x onerror=alert(1)>' })]);
    assert.ok(!/<img/.test(html));
    assert.match(html, /&lt;img/);
  });
});
