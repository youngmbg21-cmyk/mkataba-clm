/* ============================================================
   f201 — the company's legal details live with the company, not with the design

   The registered name, registration number and address were four unlabelled
   boxes inside the COMPANY DESIGN step, under the logo upload and the accent
   picker. A legal name is not a design decision: it is the same kind of fact
   as the market and the currency — something true about the company which
   happens to get printed on paper — so it belongs on Company & market, where
   somebody would look for it.

   A MOVE, NOT A COPY. Two places to type one fact is the fault this codebase
   is built to avoid, so this file asserts BOTH directions: the fields are on
   the new panel AND gone from the old step. A copy would pass a one-sided
   test.

   ONE FINDING WORTH RECORDING, because the work order was written on the
   opposite belief. The order said `passwordCurrent` means "changing the
   company's registered details asks for your password before it saves", and
   that the Company & market panel would therefore need a password prompt it
   does not have. IT DOES NOT MEAN THAT. `passwordCurrent` refuses anybody who
   is still on a temporary password ("Set your own password before making
   changes") — a first-login gate, not a per-save credential check. Nothing in
   the product has ever prompted for a password to save branding: grep the
   client for it and there is nothing. So there was no prompt to move, no
   prompt to drop, and nothing to keep off the market dropdown — which, being
   `admin`, already carries the very same gate (admin calls passwordCurrent).
   The protection travels because the ROUTE is unchanged, and this file proves
   it still refuses rather than assuming it.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

const brand = () => W.admin.json('/api/org/branding').then(r => r.branding || {});

/* ============================================================
   CD-1 — THE FIELDS MOVED
   ============================================================ */
describe('f201 — the fields are on Company & market', () => {
  const set = read('js/views/settings.js');
  const panel = set.slice(set.indexOf('  company:{'), set.indexOf('  folders:{'));

  test('the panel draws a labelled box for each of the three', () => {
    for (const id of ['st-co-name', 'st-co-reg', 'st-co-addr'])
      assert.match(panel, new RegExp(`id="${id}"`), id);
    for (const k of ['st_company_name', 'st_reg_number', 'st_company_address'])
      assert.match(panel, new RegExp(k), `${k} labels one of them`);
  });

  test('with its own Save — the panel writes nothing until it is pressed', () => {
    assert.match(panel, /id="st-co-save"/);
    /* The established shape here: the Copilot engine panel and the account page
       both carry per-section Saves inside a 'done' drawer. The market beside
       these writes on change and has no Save on purpose (a gate armed only if
       you remember to press Save is a gate that is off when it matters), so one
       foot cannot honestly promise both. */
    assert.ok(!/foot:'save'/.test(panel), 'the panel itself stays a done panel');
  });

  test('the save carries THREE KEYS and nothing else', () => {
    const wire = panel.slice(panel.indexOf("st-co-save'"));
    const call = wire.slice(wire.indexOf('saveOrgBranding('), wire.indexOf('saveOrgBranding(') + 200);
    assert.match(call, /companyName/); assert.match(call, /registrationNumber/); assert.match(call, /address/);
    for (const k of ['logoUrl', 'designId', 'accentColor', 'structureId', 'defaultFooterText'])
      assert.ok(!new RegExp(k).test(call),
        `${k} belongs to the design step — a save from here that carried it would revert whatever it did last, silently`);
  });

  test('a workspace that never filled these in is not given an answer', () => {
    /* D-3. The org name typed at setup is a display fallback and must not be
       promoted into the legal name field — it is a placeholder on the box, not
       a value in it. */
    assert.match(panel, /placeholder="\$\{esc\(\(getOrg\(\)&&getOrg\(\)\.name\)\|\|''\)\}"/,
      'the org name is the placeholder');
    assert.match(panel, /value="\$\{PB_ATTR\(\(ob&&ob\.companyName\)\|\|''\)\}"/,
      'and the value is the stored legal name, or empty');
  });

  test('the row behind the drawer is repainted where it stands, never by a page rebuild', () => {
    const wire = panel.slice(panel.indexOf("st-co-save'"));
    assert.match(wire.slice(0, 900), /stRepaintRow\('company'\)/);
    assert.ok(!/renderTeam\(\)/.test(wire.slice(0, 900)),
      'a rebuild empties seven server-filled panels — THE SETTINGS PAGE HOLDS STILL');
  });
});

describe('f201 — and they are GONE from the design step', () => {
  const ds = read('js/views/designstep.js');

  test('the three boxes are not drawn any more', () => {
    for (const id of ['ds-b-name', 'ds-b-reg', 'ds-b-addr'])
      assert.ok(!new RegExp(`id="${id}"`).test(ds), `${id} is still drawn — this would be a copy, not a move`);
  });

  test('nor harvested', () => {
    const fn = ds.slice(ds.indexOf('function dsHarvestIdentity'), ds.indexOf('function dsHarvest()'));
    for (const id of ['ds-b-name', 'ds-b-reg', 'ds-b-addr'])
      assert.ok(!new RegExp(id).test(fn), id);
  });

  test('nor sent — the step asserts no fact it does not own', () => {
    const fn = ds.slice(ds.indexOf('function dsOrgPayload'), ds.indexOf('async function dsPublish'));
    const body = fn.slice(fn.indexOf('return {'));
    for (const k of ['companyName', 'registrationNumber', 'address:'])
      assert.ok(!new RegExp(k).test(body),
        `${k} is still sent — a stale tab would then refuse an Editor's ordinary design save`);
  });

  test('D-2: the footer text stayed, because it really is a design choice', () => {
    assert.match(ds, /id="ds-b-footer"/);
    const fn = ds.slice(ds.indexOf('function dsOrgPayload'), ds.indexOf('async function dsPublish'));
    assert.match(fn, /defaultFooterText/);
  });

  test('the step still READS the name — the preview prints it on the paper', () => {
    assert.match(ds, /ds_identity_moved/, 'and it says where the field went');
  });

  test('the retired signpost keys are named as retired rather than left to rot', () => {
    const i18n = read('js/i18n.js');
    const near = i18n.slice(i18n.indexOf('st_company_details_btn') - 400, i18n.indexOf('st_company_details_btn') + 60);
    assert.match(near, /RETIRED/, 'st_company_details_btn / _note pointed at the design step');
  });
});

/* ============================================================
   CD-1 — THE SAME ROUTE, THE SAME RECORD, NO MIGRATION
   ============================================================ */
describe('f201 — saving from the new home writes what the old one wrote', () => {
  test('an admin can save the three, and they read back unchanged', async () => {
    await W.admin.json('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Highland Corporate Limited', registrationNumber: 'PVT-2019-4471',
      address: 'Ngong Road, Nairobi, Kenya' } });
    const b = await brand();
    assert.equal(b.companyName, 'Highland Corporate Limited');
    assert.equal(b.registrationNumber, 'PVT-2019-4471');
    assert.equal(b.address, 'Ngong Road, Nairobi, Kenya');
  });

  test('a design save afterwards does NOT wipe them', async () => {
    /* THE FAULT THIS PREVENTS, and it is why the route changed at all. The row
       is written with ON CONFLICT DO UPDATE, so every key the request did not
       carry used to be stored as null. That was harmless while ONE screen owned
       the whole row; the moment two screens write it, a partial save from
       either wipes what the other owns. */
    await W.admin.json('/api/org/branding', { method: 'PUT', body: {
      logoPosition: 'top-left', accentColor: '#1a7f6b', accentSource: 'manual' } });
    const b = await brand();
    assert.equal(b.companyName, 'Highland Corporate Limited', 'the legal name survived a design save');
    assert.equal(b.registrationNumber, 'PVT-2019-4471');
    assert.equal(b.address, 'Ngong Road, Nairobi, Kenya');
    assert.equal(b.logoPosition, 'top-left', 'and the design landed');
  });

  test('and an identity save does not wipe the design', async () => {
    await W.admin.json('/api/org/branding', { method: 'PUT', body: { companyName: 'Highland Corporate Ltd' } });
    const b = await brand();
    assert.equal(b.companyName, 'Highland Corporate Ltd');
    assert.equal(b.logoPosition, 'top-left', 'the design survived an identity save');
    assert.equal(b.accentColor, '#1a7f6b');
  });

  test('ABSENT IS NOT null — a key that IS sent, as null, still clears', async () => {
    await W.admin.json('/api/org/branding', { method: 'PUT', body: { accentColor: null, accentSource: null } });
    const b = await brand();
    assert.ok(!b.accentColor, 'sending null clears it');
    assert.equal(b.companyName, 'Highland Corporate Ltd', 'and nothing else moved');
    assert.equal(b.logoPosition, 'top-left');
  });

  test('no new storage and no migration — the same columns as before', () => {
    const src = read('server/server.js');
    const route = src.slice(src.indexOf("app.put('/api/org/branding'"), src.indexOf("app.get('/api/org/profile-values'"));
    assert.match(route, /INSERT INTO org_branding/, 'the same table');
    assert.ok(!/ALTER TABLE/.test(route) && !/addColumnIfMissing/.test(route), 'no new column');
  });
});

/* ============================================================
   CD-2 — THE PROTECTION TRAVELS, AND IT IS NOT WHAT ITS NAME SUGGESTS
   ============================================================ */
describe('f201 — the guard on the route still refuses', () => {
  test('passwordCurrent is a must-set-your-own-password gate, not a prompt', () => {
    const src = read('server/server.js');
    const fn = src.slice(src.indexOf('const passwordCurrent'), src.indexOf('const editor ='));
    assert.match(fn, /mustChangePassword/);
    assert.ok(!/bcrypt|compare|req\.body\.password/.test(fn),
      'it checks a flag on the account; it does not verify a credential on the request');
    /* And nothing in the client has ever asked for one. */
    for (const f of ['js/core.js', 'js/views/settings.js', 'js/views/designstep.js'])
      assert.ok(!/passwordCurrent/.test(read(f)), `${f} sends no password to this route`);
  });

  test('and it really refuses somebody who has not set their own password', async () => {
    const made = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Fresh Admin', email: 'fresh@example.co.ke', role: 'admin', password: 'temporary-pass-1' } });
    assert.ok(made.user.id);
    const c = h.client('fresh@example.co.ke');
    await c.json('/api/login', { method: 'POST', body: { email: 'fresh@example.co.ke', password: 'temporary-pass-1' } });
    const r = await c.raw('/api/org/branding', { method: 'PUT', body: { companyName: 'Whatever Ltd' } });
    assert.equal(r.status, 403, 'the route is still guarded after the move');
    assert.equal(r.json.mustChangePassword, true);
    assert.equal((await brand()).companyName, 'Highland Corporate Ltd', 'and nothing was written');
  });

  test('THE MARKET DROPDOWN IS UNTOUCHED and asks for no password either', () => {
    /* The work order warned against putting a password prompt on the market
       dropdown, which shares this panel but not this route. There is no prompt
       to put anywhere — and the market's own route is `admin`, which calls the
       very same passwordCurrent, so the two already agree. */
    const src = read('server/server.js');
    const line = src.slice(src.indexOf("app.put('/api/org/jurisdiction'"), src.indexOf("app.put('/api/org/jurisdiction'") + 120);
    assert.match(line, /auth, admin,/, 'admin-gated, and admin calls passwordCurrent');
    const set = read('js/views/settings.js');
    const panel = set.slice(set.indexOf('  company:{'), set.indexOf('  folders:{'));
    const market = panel.slice(panel.indexOf("getElementById('set-market')"));
    assert.ok(!/password/i.test(market.slice(0, 1200)), 'the dropdown collects no credential');
  });
});

/* ============================================================
   CD-3 / D-1 — WHO MAY CHANGE THEM, AND THE BROWSER AGREEING WITH THE SERVER
   ============================================================ */
describe('f201 — D-1: the legal identity is an admin\'s', () => {
  test('an Editor is refused, in words that say who can and where', async () => {
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Editor Renamed Us Ltd' } });
    assert.equal(r.status, 403);
    assert.match(r.json.error, /admin/i);
    assert.match(r.json.error, /Company & market/, 'and where an admin does it');
    assert.deepEqual(Array.from(r.json.adminOnly), ['companyName']);
    assert.equal((await brand()).companyName, 'Highland Corporate Ltd', 'nothing moved');
  });

  test('the DESIGN is untouched — that is what the Editor permission was for', async () => {
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: {
      logoPosition: 'top-center', designId: null } });
    assert.equal(r.status, 200);
    assert.equal((await brand()).logoPosition, 'top-center');
  });

  test('ASKED AS A DIFFERENCE — carrying the identity along unchanged passes', async () => {
    const b = await brand();
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: {
      companyName: b.companyName, registrationNumber: b.registrationNumber, address: b.address,
      logoPosition: 'top-left' } });
    assert.equal(r.status, 200, 'nothing moved, so nothing is refused');
    assert.equal((await brand()).logoPosition, 'top-left');
  });

  test('the closure is NAMED, the way the August 2026 settings closures were', () => {
    const set = read('js/views/settings.js');
    const list = set.slice(set.indexOf('const SET_CLOSURES'), set.indexOf('WHICH TAB IS UP'));
    assert.match(list, /legal-identity/);
    assert.match(list, /registered name/i);
    assert.match(list, /design .*unchanged|unchanged and still theirs/i,
      'a closure that does not say what SURVIVED reads as a bigger loss than it is');
  });

  test('and the browser agrees: the panel that holds them is admin-only', () => {
    const set = read('js/views/settings.js');
    /* renderTeam ITSELF is the gate — the page is admin-only, and the company
       panel lives on it. A route that permits what no screen offers is how a
       capability becomes invisible rather than removed; here they match. */
    const fn = set.slice(set.indexOf('function renderTeam'), set.indexOf('function renderTeam') + 700);
    assert.match(fn, /!isAdmin\(\)/);
    assert.match(fn, /renderMyAccountPage\(\)/);
  });
});

/* ============================================================
   CD-4 — THE ROW'S SUMMARY LINE IS UNCHANGED
   ============================================================ */
describe('f201 — the row still states the legal name, the market and the currency', () => {
  test('its reading did not change', () => {
    const set = read('js/views/settings.js');
    const panel = set.slice(set.indexOf('  company:{'), set.indexOf('  folders:{'));
    const st = panel.slice(panel.indexOf('state(){'), panel.indexOf('body(){'));
    assert.match(st, /ob&&ob\.companyName/);
    assert.match(st, /jxName\?jxName\(\):jxId\(\)/);
    assert.match(st, /jxCurrency\(\)/);
  });
});

/* ============================================================
   BOTH LANGUAGES
   ============================================================ */
describe('f201 — every new word exists in both languages', () => {
  test('the new keys are in en and sv', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['st_company_legal_sub', 'st_company_legal_note', 'st_company_legal_saved',
      'st_company_design_sub', 'st_company_design_btn', 'ds_footer_placeholder', 'ds_identity_moved']) {
      const hits = i18n.match(new RegExp(`\\b${k}:`, 'g')) || [];
      assert.equal(hits.length, 2, `${k} appears ${hits.length} times, expected en + sv`);
    }
  });

  test('the footer placeholder stopped being hardcoded English on the way past', () => {
    const ds = read('js/views/designstep.js');
    assert.ok(!/placeholder="Footer text/.test(ds));
  });
});
