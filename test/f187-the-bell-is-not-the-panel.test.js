/* ============================================================
   f187 — the bell and the panel stop being the same button
   ============================================================
   Owner's report, 12 Aug 2026: the two icons in the top bar do the same thing.
   They did, literally — the bell's click handler was
   `document.getElementById('cmd-panel')?.click()` and its own tooltip admitted
   it ("Notifications — the Activity panel carries the live feed"). Beside it
   was a blue dot written straight into index.html: always on, counting nothing,
   and long since trained out of everybody who uses the product. An always-on
   badge is worse than no badge.

   WHAT IS TRUE NOW. The panel icon opens ACTIVITY — the whole workspace,
   newest first. The bell opens ALERTS — what is waiting on THIS person. Same
   shell, two contents, and the panel says which it is showing.

   THE RULE THIS FEATURE COULD MOST EASILY BREAK is the one the codebase already
   has for the Negotiations door: one count, many surfaces. A bell saying 4 over
   a dashboard saying 3 is that fault in a new place, so every kind of alert is
   assembled from the function that already answers it and none is re-derived.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('f187 (1) — two buttons, two jobs', () => {
  test('THE BELL NO LONGER PRESSES THE OTHER BUTTON', () => {
    const app = read('js/app.js');
    assert.ok(!/hdr-notify'\)\?\.addEventListener\('click',\(\)=>document\.getElementById\('cmd-panel'\)/.test(app),
      'the handler that made them one button is gone');
    assert.match(app, /getElementById\('cmd-panel'\)\?\.addEventListener\('click',\(\)=>openPanel\('activity'\)\)/);
    assert.match(app, /getElementById\('hdr-notify'\)\?\.addEventListener\('click',\(\)=>openPanel\('alerts'\)\)/);
  });

  test('ONE PANEL, TWO CONTENTS — not two panels', () => {
    const html = read('index.html');
    assert.equal((html.match(/id="context-panel"/g) || []).length, 1,
      'there is one shell and both icons use it');
    /* And it says which it is showing: the heading is filled at render time. */
    assert.match(html, /id="panel-title"/);
    const app = read('js/app.js');
    const fn = app.slice(app.indexOf('function renderContextPanel'));
    assert.match(fn.slice(0, fn.indexOf('\n}')), /title\.textContent=alerts\?i18t\('sh_alerts'\):i18t\('sh_activity'\)/);
  });

  test('pressing one while the other is showing SWAPS the content', () => {
    const app = read('js/app.js');
    const fn = app.slice(app.indexOf('const openPanel=face=>'));
    const body = fn.slice(0, fn.indexOf('\n  };'));
    /* Only a press of the face already showing closes it; the other swaps. */
    assert.match(body, /const same=state\.panelOpen&&panelFace\(\)===face;/);
    assert.match(body, /state\.panelOpen=!same;/);
  });

  test('THE HARD-CODED DOT IS GONE, and its replacement is hidden at zero', () => {
    const html = read('index.html');
    const bell = html.slice(html.indexOf('id="hdr-notify"'), html.indexOf('id="cmd-panel"'));
    assert.match(bell, /id="hdr-notify-dot" hidden/, 'it starts hidden, not lit');
    assert.ok(!/background:var\(--accent-solid\);border:2px solid var\(--color-surface\);"><\/span>/.test(bell),
      'the always-on dot is not still there');
    const app = read('js/app.js');
    const fn = app.slice(app.indexOf('function updateAlertBadge'));
    assert.match(fn.slice(0, fn.indexOf('\n}')), /dot\.hidden=!n\|\|off;/);
  });

  test('the badge is refreshed on the same beat as the sidebar counts', () => {
    const app = read('js/app.js');
    const fn = app.slice(app.indexOf('function updateSidebarCounts'));
    assert.match(fn.slice(0, fn.indexOf('\nfunction ')), /updateAlertBadge\(\)/);
  });

  test('nothing anywhere marks an alert as merely SEEN', () => {
    /* Clearing on "you opened the panel" trains people to glance and dismiss —
       which is how the dot this replaces became invisible. It clears when the
       underlying thing is dealt with, and that is the whole mechanism: there is
       no seen-state to write. */
    const app = read('js/app.js');
    assert.ok(!/alertsSeen|markAlertsSeen|alertSeenAt/.test(app));
  });
});

describe('f187 (2) — the alerts are borrowed counts, never new ones', () => {
  test('every kind reads the function that already answers it', () => {
    const app = read('js/app.js');
    const body = app.slice(app.indexOf('function buildAlerts'), app.indexOf('function alertCount'));
    assert.match(body, /negoNeedsYouIds\(c\)\.length/, 'the Negotiations door’s own count');
    assert.match(body, /reviewState\(c\)/,             'the review’s own state');
    assert.match(body, /hmDashSlices\(\)/,             'the dashboard’s own approvals and renewals');
    assert.match(body, /nextSigner\(c\)/,              'the route’s own answer about whose turn it is');
  });

  test('IT READS WITHOUT WRITING', () => {
    /* The trap the Negotiations door already walked into once: negoChanges()
       runs negoInit(), which CREATES a negotiation on any contract that has
       none — and this runs over every contract in the workspace on every view
       change. */
    const app = read('js/app.js');
    const body = app.slice(app.indexOf('function buildAlerts'), app.indexOf('function alertCount'));
    /* The comment above the code names negoChanges to say why it is avoided,
       so the assertion is about a CALL — `negoChanges(c…` — not a mention. */
    assert.ok(!/negoChanges\(c/.test(body), 'never through negoChanges');
    assert.ok(!/negoInit\(c/.test(body));
    /* AND THE INDIRECT ROUTE, which is the one that actually shipped and was
       caught in the browser: reviewState reaches reviewScope, which asks
       negoUnsentAsks / negoPending — and those DO go through negoChanges. So a
       contract is only asked about a review once it demonstrably has one, read
       raw off c.review.requests. */
    assert.match(body, /Array\.isArray\(c\.review\.requests\)/);
    assert.match(body, /if\(!reqs\.length\) return;/);
  });

  test('EVERY ALERT IS A DOOR', () => {
    const app = read('js/app.js');
    const body = app.slice(app.indexOf('function buildAlerts'), app.indexOf('function alertCount'));
    /* Each push carries a `go` that opens the thing needing doing. */
    const pushes = body.match(/push\('/g) || [];
    assert.ok(pushes.length >= 6, 'six kinds of alert');
    assert.match(body, /openRedlineWorkbench\(c\.id\)/);
    assert.match(body, /roomGoTab\(c,'sign'\)/);
    const panel = app.slice(app.indexOf('function alertsPanelHtml'));
    assert.match(panel.slice(0, panel.indexOf('\n}')), /data-alert-i=/);
    const render = app.slice(app.indexOf('function renderContextPanel'));
    assert.match(render.slice(0, render.indexOf('\n}')), /closeContextPanel\(\);/,
      'and the panel gets out of the way when the door is taken');
  });

  test('"nothing needs you right now" is a real message, not a blank panel', () => {
    const app = read('js/app.js');
    const fn = app.slice(app.indexOf('function alertsPanelHtml'));
    assert.match(fn.slice(0, fn.indexOf('\n}')), /ap_nothing_needs_you/);
    const { STRINGS } = require('../js/i18n.js');
    assert.equal(STRINGS.en.ap_nothing_needs_you, 'Nothing needs you right now');
    assert.ok(STRINGS.sv.ap_nothing_needs_you, 'and it is translated');
  });

  test('ACTIVITY IS THE WORKSPACE, ALERTS ARE THE PERSON — and the panel says so', () => {
    const app = read('js/app.js');
    const a = app.slice(app.indexOf('function activityPanelHtml'));
    assert.match(a.slice(0, a.indexOf('\n}')), /ap_scope_workspace/);
    const b = app.slice(app.indexOf('function alertsPanelHtml'));
    assert.match(b.slice(0, b.indexOf('\n}')), /ap_scope_you/);
    const { STRINGS } = require('../js/i18n.js');
    assert.match(STRINGS.en.ap_scope_workspace, /whole workspace/i);
    assert.match(STRINGS.en.ap_scope_you, /waiting on you/i);
  });

  test('and both obey stream access by construction', () => {
    /* state.contracts IS the caller's already-scoped bootstrap — the server
       filtered it on the way out. A second browser-side filter here would be a
       copy of a server rule, free to disagree with it. */
    const app = read('js/app.js');
    const body = app.slice(app.indexOf('function buildAlerts'), app.indexOf('function alertCount'));
    assert.match(body, /const cs=\(state\.contracts\|\|\[\]\);/);
    assert.ok(!/userFolderAccess|folderScopeFor/.test(body));
  });

  test('every string is EN and SV', () => {
    const { STRINGS } = require('../js/i18n.js');
    ['sh_alerts', 'sh_activity', 'sh_alerts_none', 'sh_close_alerts', 'sh_close_activity',
     'ap_scope_workspace', 'ap_scope_you', 'ap_nothing_needs_you', 'ap_nothing_needs_you_sub',
     'ap_alerts_not_here', 'ap_activity_not_here',
     'al_review_mine', 'al_review_out', 'al_approval', 'al_signature', 'al_renewal_today']
      .forEach(k => {
        assert.ok(STRINGS.en[k], 'EN ' + k);
        assert.ok(STRINGS.sv[k], 'SV ' + k);
      });
    ['sh_alerts_n', 'al_nego', 'al_renewal_in', 'al_expiring_in'].forEach(k => {
      assert.ok(STRINGS.en[k + '_one'] && STRINGS.en[k + '_other'], 'EN ' + k);
      assert.ok(STRINGS.sv[k + '_one'] && STRINGS.sv[k + '_other'], 'SV ' + k);
    });
  });
});

/* REVERSED 13 Aug 2026, owner-reported: "the alerts and the activity buttons
   stop working when I am in the insights tab." They did, and it was this rule.
   The reason was real when it was written — the panel was a COLUMN then, and
   two right-hand columns, this one and the Intelligence dock, would have
   fought for the same width. It is a slide-over now. It takes no width from
   anything, and the product had already accepted that on this very page: the
   Copilot panel slides over the same space on Insights and was never
   suppressed. The machinery stays, because a disabled control with a reason is
   still the right shape if a page ever genuinely cannot host a layer; what
   changes is that nothing answers true. */
describe('f187 (3) — the suppression is a shape, and nothing wears it', () => {
  test('ONE PREDICATE, asked by the layout and by both buttons — and it says no', () => {
    const app = read('js/app.js');
    assert.match(app, /function panelSuppressed\(\)\{ return false; \}/,
      'Insights no longer refuses the layer');
    /* THE DUPLICATE IS GONE TOO. applyPanelLayout carried its own copy of the
       same view test, so relaxing the predicate alone would have left the
       buttons live and the panel still refusing to open. */
    const lay = app.slice(app.indexOf('function applyPanelLayout'));
    const show = lay.slice(lay.indexOf('const show'), lay.indexOf('\n', lay.indexOf('const show')));
    assert.match(show, /!panelSuppressed\(\)/, 'it asks the one predicate');
    assert.ok(!/view!==/.test(show), 'and carries no second copy of the rule');
    const open = app.slice(app.indexOf('const openPanel=face=>'));
    assert.match(open.slice(0, open.indexOf('\n  };')), /if\(panelSuppressed\(\)\) return;/);
    const badge = app.slice(app.indexOf('function updateAlertBadge'));
    const body = badge.slice(0, badge.indexOf('\n}'));
    assert.match(body, /btn\.disabled=off/, 'a disabled control, not a live one that does nothing');
    assert.match(body, /pan\.disabled=off/);
    assert.match(body, /ap_alerts_not_here/, 'and it says which page took the space');
  });

  test('so on Insights the badge is drawn and both buttons are live', () => {
    const app = read('js/app.js');
    /* The cost was never only a dead button: the badge is hidden while
       suppressed, so a reader on Insights could not see that nine things were
       waiting on them, with nothing on screen to say why the number had gone. */
    const badge = app.slice(app.indexOf('function updateAlertBadge'));
    assert.match(badge.slice(0, badge.indexOf('\n}')), /dot\.hidden=!n\|\|off/);
    const { STRINGS } = require('../js/i18n.js');
    /* The words stay in both languages — the shape is kept, not deleted. */
    ['ap_alerts_not_here', 'ap_activity_not_here'].forEach(k => {
      assert.ok(STRINGS.en[k] && STRINGS.sv[k], k);
    });
  });

  test('a toast is deliberately NOT the channel', () => {
    /* This product draws only error toasts (see toast in js/core.js: a kind of
       'ok' returns immediately), so an informational one would be a message
       nobody ever sees. */
    const core = read('js/core.js');
    const t = core.slice(core.indexOf('function toast(msg'));
    assert.match(t.slice(0, 200), /if\(!isErr\) return;/);
    const app = read('js/app.js');
    const open = app.slice(app.indexOf('const openPanel=face=>'));
    assert.ok(!/toast\(/.test(open.slice(0, open.indexOf('\n  };'))));
  });
});

describe('f187 (4) — the phone has no such pair', () => {
  test('the phone draws neither button, so it cannot inherit the fault', () => {
    const m = read('js/mobile.js');
    const head = m.slice(m.indexOf('function mHeadHtml'), m.indexOf('function mAccountSheetHtml'));
    assert.ok(!/hdr-notify|cmd-panel/.test(head));
    /* What it has instead is its own "Needs you" list on Home, built from the
       same slices — mNeedsYou in js/mobile-screens.js. */
    const scr = read('js/mobile-screens.js');
    assert.match(scr, /function mNeedsYou\(D\)/);
  });
});

describe('f187 (5) — the model, on a real stage', () => {
  const ME = { id: 'u_me', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@w.co.ke' };
  const BODY = '<h1>Supply</h1><h2>Clause 5 · Pricing</h2><p>Prices are fixed.</p>';
  const contract = over => ({ id: 'MK-A1', name: 'Supply Agreement', counterparty: 'Naivas',
    status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [],
    versions: [], signatures: [], comments: [], redlineText: BODY, format: 'rich', ...over });

  test('a change waiting on the reader becomes exactly one alert, and it is a door', () => {
    const w = buildWorld({ user: ME, negotiationView: true, contractView: true });
    const c = contract();
    w.win.negoInit(c);
    c.changes.push({ id: 'CHG-1', status: 'pending', authorSide: 'counterparty',
      clauseId: 'c1', kind: 'edit', author: 'Them', seq: 1 });
    w.win.state = Object.assign({}, w.win.state, { contracts: [c], view: 'dashboard' });
    w.win.getContract = id => (id === c.id ? c : null);
    /* buildAlerts lives in js/app.js, which this stage does not load — the
       model is the thing under test and it is exercised through the same
       functions it calls, so the assertion is that those agree. */
    assert.equal(w.win.negoNeedsYouIds(c).length, 1);
    assert.equal(w.win.negoIsLive(c), true);
    /* And answering it takes it away — which is what "the dot clears when the
       work is done" means. */
    c.changes[0].status = 'accepted';
    assert.equal(w.win.negoNeedsYouIds(c).length, 0);
  });
});
