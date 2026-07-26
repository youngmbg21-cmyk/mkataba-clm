/* ============================================================
   F33 — the email setting is said out loud on day one
   ============================================================
   Four reviews running, the same operational trap: a workspace with no mail
   provider cannot deliver anything, and the app only mentioned it AFTER a send
   had already failed ("Queued, not sent"). The first negotiation was where an
   owner discovered that her invitation never left the building.

   The server knew all along. It reports the answer when a share is created,
   when a link is opened, when a signing code is requested — every one of those
   is a moment where something has already gone wrong. The one call the app
   makes at sign-in, which already says whether the Copilot features are set up,
   never mentioned email at all.

   What makes this worth its own test file is how much hangs off the single
   setting: invitations, update notices, signing codes, the strength of every
   signature taken on the workspace, and now the questions channel between the
   parties. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

/* core.js with somebody signed in. `state`, `REMOTE` and `currentUser` are
   declared inside the module, so they cannot be handed in from outside — the
   test signs in the way the application does, by setting REMOTE in the same
   context the module runs in. */
function app({ email, role = 'admin' } = {}){
  const s = loadViews(['js/richdoc.js', 'js/core.js'],
    { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  vm.runInContext(
    `REMOTE={org:{name:'Wanjiru Catering Ltd'},me:{id:'u1',name:'Wanjiru Kamau',role:'${role}'},users:[]};` +
    `state.emailConfigured=${email};`, s);
  return s;
}

describe('F33 — the server says it at sign-in', () => {
  let h, W;
  after(async () => { if (h) await h.stop(); });

  test('a workspace with no mail provider says so on the sign-in call', async () => {
    h = await startHati();                       // the harness never sets a mail key
    W = await seedWorkspace(h);
    const b = await W.admin.json('/api/bootstrap');
    assert.equal(b.emailConfigured, false,
      'the app cannot warn early about something it is never told');
    assert.equal(typeof b.aiConfigured, 'boolean',
      'it sits beside the Copilot flag that was already there');
  });
});

describe('F33 — and reports the other answer honestly', () => {
  let h;
  after(async () => { if (h) await h.stop(); });

  test('a workspace with a mail provider reports it configured', async () => {
    h = await startHati({ RESEND_API_KEY: 'test-key', RESEND_BASE_URL: 'http://127.0.0.1:1' });
    const W = await seedWorkspace(h);
    const b = await W.admin.json('/api/bootstrap');
    assert.equal(b.emailConfigured, true);
  });
});

describe('F33 — the warning appears before anything is sent', () => {
  test('the dashboard carries a banner while email is unset', () => {
    const s = app({ email: false });
    const html = s.emailSetupBannerHtml();
    assert.ok(html, 'a workspace that cannot send anything must say so');
    assert.match(html, /Email isn’t set up yet/);
  });

  test('it names what actually breaks, not just that email is missing', () => {
    const html = app({ email: false }).emailSetupBannerHtml();
    assert.match(html, /review links/i);
    assert.match(html, /signing codes/i);
    // the consequence an owner would never guess at, and the one that matters
    // most once a contract is executed
    assert.match(html, /not independently verified/i,
      'a signature collected without email is weaker, and the banner must say so');
  });

  test('a configured workspace is not nagged', () => {
    assert.equal(app({ email: true }).emailSetupBannerHtml(), '');
  });

  test('only an admin is offered the fix — everyone else just gets the fact', () => {
    assert.match(app({ email: false, role: 'admin' }).emailSetupBannerHtml(), /email-setup-go/);
    assert.ok(!/email-setup-go/.test(app({ email: false, role: 'legal' }).emailSetupBannerHtml()),
      'sending a non-admin to a settings page they cannot change is a dead end');
  });

  test('nothing is claimed when the app is running with no server at all', () => {
    const s = loadViews(['js/richdoc.js', 'js/core.js'],
      { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, API_MODE: () => false });
    vm.runInContext('state.emailConfigured=false;', s);
    assert.equal(s.emailOff(), false,
      'static mode has no mail provider to configure — warning about it would be noise');
  });
});
