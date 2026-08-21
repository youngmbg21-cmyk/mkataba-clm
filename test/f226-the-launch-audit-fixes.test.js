/* f226 — THE LAUNCH AUDIT'S FIXES (21 Aug 2026).
 *
 * The end-to-end launch audit (WORKORDER-e2e-launch-audit.md, report in
 * AUDIT-E2E-REPORT.md) drove a real server through an SME's whole working life
 * and came back with six confirmed defects. Every one is reproduced here as it
 * was reported, so a fix cannot quietly come undone.
 *
 * FOUR OF THE SIX ARE THE SAME CLASS, and it is the class this codebase's own
 * legal audit already closed everywhere else: THE BROWSER IS COSMETICS, THE
 * SERVER IS THE WALL. A rule enforced only in the pixels is not a rule — it is
 * a suggestion that holds until somebody sends the request themselves.
 *
 * Each test asserts THE STATE IT CREATED before it attacks it. An attack that
 * fails to arm reads exactly like one that succeeds (the D1/H2 lesson), so an
 * unarmed probe here would report a wall that was never built.
 */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startHatiWithMail, seedWorkspace } = require('./helpers.js');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const setup = async (h) => {
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  return admin;
};
/* A real member on a password of their own — a temp-password account is refused
   by passwordCurrent, which would make every write below read as a wall. */
const member = async (h, admin, name, email, role = 'legal') => {
  const created = await admin.json('/api/users', { method: 'POST', body: {
    name, email, role, password: 'temporary-pass-1' } });
  const c = h.client(email);
  await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
  await c.json('/api/password/change', { method: 'POST', body: {
    current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  return { client: c, user: created.user };
};
const put = (client, c, baseVersion) =>
  client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion } });

/* ============================================================
   1 — THE SIGNING CAP CANNOT BE DODGED BY CLAIMING A CHEAPER CURRENCY
   ============================================================
   The guard's own comment says the currency "comes off the STORED record …
   the half the person being capped does not get to restate on the way past".
   It read `(prev && prev.metadata) || (c && c.metadata) || {}`, which does the
   opposite the moment the stored record has NO metadata object — the ordinary
   shape of a template-made contract, whose value is typed on Key terms and
   never writes a metadata block. So a capped signer sent their signature and
   `metadata:{currency:'TZS'}` in ONE save and a sub-1 rate slipped a
   10,000,000 contract under a 5,000,000 cap. */
test('f226 — a capped signer cannot shrink a contract by renaming its currency', async (t) => {
  const h = await startHati();
  t.after(() => h.stop());
  const admin = await setup(h);
  const ed = await member(h, admin, 'Capped Editor', 'capped@example.co.ke');

  await admin.json('/api/settings', { method: 'PUT', body: { signCap: { on: true } } });
  await admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'TZS', rate: 0.05 } });
  await admin.json('/api/users/' + ed.user.id, { method: 'PATCH', body: { signCap: 5000000 } });

  /* ---- ARMED? Read back before anything is attacked. The workspace settings
     are read from the ADMIN's bootstrap on purpose: a non-admin's is stripped
     of them, which is its own rule and not this test's subject. ---- */
  const boot = await admin.json('/api/bootstrap');
  assert.equal(boot.settings?.signCap?.on, true, 'ARM: the cap rule must actually be on');
  assert.equal(boot.settings?.fxRates?.TZS?.rate, 0.05, 'ARM: the cheap rate is really on file');
  const mine = await ed.client.json('/api/bootstrap');
  assert.equal(mine.me.signCap, 5000000, 'ARM: this editor must actually be capped');

  const base = { id: 'MK-CAP', name: 'Supply agreement', status: 'Under Review',
    counterparty: 'Kabras Sugar', value: 10000000, folder: 'commercial' };
  delete base.metadata;                         // the shape that carried the bug
  await put(ed.client, base, 0);
  const stored = await ed.client.json('/api/contracts/MK-CAP');
  assert.equal(stored.metadata, undefined,
    'ARM: the stored record must carry NO metadata — that is the reported shape');

  const sign = () => ({ name: 'Capped Editor', email: 'capped@example.co.ke',
    at: new Date().toISOString(), method: 'session-authenticated', party: 'owner', verified: true });

  // The honest attempt is refused — proving the cap is armed and biting.
  const honest = await put(ed.client,
    { ...stored, signatures: [sign()] }, stored._v);
  assert.equal(honest.status, 403, 'ARM: an honest over-cap signature must be refused');

  // THE ATTACK: signature and a cheaper currency in the same save.
  const dodge = await put(ed.client,
    { ...stored, metadata: { currency: 'TZS' }, signatures: [sign()] }, stored._v);
  assert.equal(dodge.status, 403,
    'a currency claimed in the same save must not shrink the value under the cap');

  const after = await ed.client.json('/api/contracts/MK-CAP');
  assert.equal((after.signatures || []).length, 0, 'and no signature may have landed');
});

test('f226 — but a currency declared for the first time is not UNDER-counted either', async (t) => {
  /* The mirror of the fix, and the reason it reads BOTH and takes the larger
     rather than the stored record alone: a contract genuinely in a dearer
     currency, named for the first time in this very save, must be measured at
     what it is actually worth — not waved through in workspace money. */
  const h = await startHati();
  t.after(() => h.stop());
  const admin = await setup(h);
  const ed = await member(h, admin, 'Capped Editor', 'capped@example.co.ke');
  await admin.json('/api/settings', { method: 'PUT', body: { signCap: { on: true } } });
  await admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'USD', rate: 130 } });
  await admin.json('/api/users/' + ed.user.id, { method: 'PATCH', body: { signCap: 5000000 } });

  await put(ed.client, { id: 'MK-USD', name: 'Licence', status: 'Under Review',
    counterparty: 'Kabras Sugar', value: 100000, folder: 'commercial' }, 0);
  const stored = await ed.client.json('/api/contracts/MK-USD');
  assert.equal(stored.metadata, undefined, 'ARM: no stored currency');
  // 100,000 reads as 100,000 in workspace money (under the cap) but is
  // 13,000,000 once the USD it declares is honoured.
  const r = await put(ed.client, { ...stored, metadata: { currency: 'USD' },
    signatures: [{ name: 'Capped Editor', email: 'capped@example.co.ke', at: new Date().toISOString(),
      method: 'session-authenticated', party: 'owner', verified: true }] }, stored._v);
  assert.equal(r.status, 403, 'a dearer declared currency must be measured, not ignored');
});

/* ============================================================
   2 — THE WORDING FREEZES AT THE FIRST SIGNATURE, ON THE SERVER TOO
   ============================================================
   CLAUDE.md rules it as an implemented invariant and the browser honours it
   (negoWordingFrozen). The server's own lock engaged only once the record was
   FULLY executed, so between the first mark and the last — status still Under
   Review, no seal — a raw save rewrote the document underneath a signature
   that had already been given. */
test('f226 — a raw save cannot rewrite the wording after the first signature', async (t) => {
  const h = await startHati();
  t.after(() => h.stop());
  const admin = await setup(h);

  const SIXTY = '<h2>1. Payment</h2><p>Payable within sixty (60) days.</p>';
  await put(admin, { id: 'MK-FZ', name: 'Supply agreement', status: 'Under Review',
    counterparty: 'Kabras Sugar', folder: 'commercial', redlineText: SIXTY,
    signatures: [{ name: 'Grace Njeri', email: 'grace@kabras.example', at: new Date().toISOString(),
      method: 'email one-time code', party: 'counterparty', verified: true }],
    signerPlan: [{ id: 'r1', side: 'counterparty', name: 'Grace Njeri', signed: true },
      { id: 'r2', side: 'owner', name: 'Amina Otieno', signed: false }] }, 0);

  /* ---- ARMED? Partly signed, and NOT executed — or the older guard would be
     the one doing the refusing and this would prove nothing. ---- */
  const c = await admin.json('/api/contracts/MK-FZ');
  assert.equal(c.signatures.length, 1, 'ARM: one signature is on the record');
  assert.equal(c.status, 'Under Review', 'ARM: the record is NOT executed');
  assert.ok(!c.hash && !(c.execution && c.execution.at), 'ARM: no seal, no execution stamp');

  const attack = await put(admin,
    { ...c, redlineText: '<h2>1. Payment</h2><p>Payable within TEN (10) days.</p>' }, c._v);
  assert.equal(attack.status, 409, 'the wording is frozen while a signature stands');
  assert.ok(attack.json && attack.json.signedFreeze, 'and it says which rule refused');

  const after = await admin.json('/api/contracts/MK-FZ');
  assert.equal(after.redlineText, SIXTY, 'the stored wording did not move');
});

test('f226 — the freeze is the WORDING only; the contract still works', async (t) => {
  /* The browser's own scope, mirrored deliberately: "the point is that the
     words stop moving, not that the contract stops working". Taking the
     remaining signature, and the ordinary facts beside it, must still pass —
     or an SME with two signers is stuck between them. */
  const h = await startHati();
  t.after(() => h.stop());
  const admin = await setup(h);
  await put(admin, { id: 'MK-FZ2', name: 'Supply agreement', status: 'Under Review',
    counterparty: 'Kabras Sugar', folder: 'commercial',
    redlineText: '<h2>1. Payment</h2><p>Sixty days.</p>', obligations: [],
    signatures: [{ name: 'Grace Njeri', email: 'grace@kabras.example', at: new Date().toISOString(),
      method: 'email one-time code', party: 'counterparty', verified: true }] }, 0);
  const c = await admin.json('/api/contracts/MK-FZ2');
  assert.equal(c.signatures.length, 1, 'ARM: partly signed');

  const ok = await put(admin, { ...c,
    signatures: [...c.signatures, { name: 'Amina Otieno', email: 'admin@example.co.ke',
      at: new Date().toISOString(), method: 'session-authenticated', party: 'owner', verified: true }],
    obligations: [{ id: 'ob1', desc: 'Quarterly report', due: '2026-12-01', status: 'open' }],
    notes: 'chasing the second signature' }, c._v);
  assert.equal(ok.status, 200,
    'the second signature, obligations and notes must all still land');
});

/* ============================================================
   3 — WHO SPENT WHAT ON COPILOT IS ADMIN-ONLY ON EVERY ROUTE
   ============================================================
   /api/ai/spend carries `admin` precisely so the by-PERSON league table stays
   with admins — "a route more open than the page it feeds is a permission that
   exists only in the pixels". /api/ai/config is `auth` only, every signed-in
   browser calls it, and it embedded the WHOLE spend object; when that object
   gained byPerson the leak came with it. */
test('f226 — a non-admin never receives the per-person Copilot spend', async (t) => {
  const h = await startHati();
  t.after(() => h.stop());
  const admin = await setup(h);
  const ed = await member(h, admin, 'An Editor', 'ed@example.co.ke');
  const vw = await member(h, admin, 'A Viewer', 'vw@example.co.ke', 'viewer');

  await admin.json('/api/settings', { method: 'PUT', body: { aiKey: 'stub-key' } });
  const aiSearch = (cl, q) => cl.raw('/api/ai/search', { method: 'POST', body: { question: q,
    candidates: [{ id: 'MK-A1', name: 'Supply', counterparty: 'Kabras', text: 'supply agreement text' }] } });
  await aiSearch(admin, 'what supply deals do we have');
  await aiSearch(ed.client, 'which listings are live');

  /* ---- ARMED? There must be a league table to leak in the first place. ---- */
  const asAdmin = await admin.json('/api/ai/config');
  assert.ok(Array.isArray(asAdmin.spend?.byPerson) && asAdmin.spend.byPerson.length >= 1,
    'ARM: the admin can see a populated per-person ledger');

  for (const [who, cl] of [['editor', ed.client], ['viewer', vw.client]]) {
    const cfg = await cl.json('/api/ai/config');
    assert.equal(cfg.spend?.byPerson, undefined, `an ${who} must not receive byPerson`);
    assert.equal(cfg.spend?.unattributed, undefined, `nor the unattributed remainder (${who})`);
    const spend = await cl.raw('/api/ai/spend');
    assert.equal(spend.status, 403, `CONTROL: /api/ai/spend still refuses the ${who}`);
  }
});

/* ============================================================
   4 — SCHEDULED MAIL CARRIES A LINK THAT WORKS
   ============================================================
   Mail composed without a live request falls back to APP_URL, and with APP_URL
   unset to http://localhost — a dead link in a real inbox, worst of all in the
   nudge that goes to a COUNTERPARTY. render.yaml and DEPLOYMENT.md never asked
   for it, so the documented way to deploy produced exactly that. */
test('f226 — the deployment files require the public address, and the server says so', () => {
  assert.match(read('render.yaml'), /key: APP_URL/,
    'render.yaml must ask for APP_URL, or the documented deploy mails dead links');
  assert.match(read('DEPLOYMENT.md'), /\|\s*`APP_URL`\s*\|/,
    'and the environment-variable table must name it');
  const srv = read('server/server.js');
  assert.match(srv, /const appUrlWarn = \(\) => \{/,
    'a server started without it warns rather than letting an admin find out from a counterparty');
  assert.match(srv, /appUrlWarn\(\);/, 'and the warning is actually wired to the boot');
});

test('f226 — with APP_URL set, every scheduled mail links to the real address', async (t) => {
  const h = await startHatiWithMail({}, { APP_URL: 'https://hati.example.com' });
  t.after(() => h.stop());
  const admin = await setup(h);

  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  await put(admin, { id: 'MK-ML', name: 'Supply agreement', status: 'Signed',
    counterparty: 'Kabras Sugar', folder: 'proc', value: 100000, valueType: 'standard',
    template: 'RM', signedAt: '2026-01-01', fields: {}, metadata: { currency: 'KES' },
    comments: [], signatures: [], rounds: [],
    audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'seed' }],
    obligations: [{ id: 'ob1', desc: 'Quarterly report', due, status: 'open',
      assignee: 'admin@example.co.ke' }] }, 0);

  h.mail.reset();
  await admin.json('/api/reminders/run', { method: 'POST' });
  await admin.json('/api/daily-brief/run', { method: 'POST' });
  await new Promise(r => setTimeout(r, 400));   // the sends are fire-and-forget

  const links = h.mail.sent.flatMap(m => String(m.text || '').match(/https?:\/\/\S+/g) || []);
  assert.ok(links.length, 'ARM: the sweeps must actually have sent something with a link in it');
  const dead = links.filter(l => /localhost/.test(l));
  assert.deepEqual(dead, [], 'no scheduled mail may carry a localhost link');
  assert.ok(links.some(l => l.startsWith('https://hati.example.com')),
    'they carry the deployment\'s own public address');
});

/* ============================================================
   5 — WITHDRAWING A REQUEST IS THE REQUESTER'S OWN ACT
   ============================================================
   The guard read `(!isOwner && !isEditor)`, so any non-viewer passed for
   ANYBODY's request — the opposite of the sentence it refuses with. It mattered
   because 'withdrawn' is deliberately outside notifyIntakeDecision: the request
   vanished from the queue with no mail, no reason and no name on it, and the
   requester's row read "Withdrawn" as though they had done it themselves. */
test('f226 — one editor cannot withdraw another member\'s request', async (t) => {
  const h = await startHatiWithMail();
  t.after(() => h.stop());
  const admin = await setup(h);
  const asker = await member(h, admin, 'Vera Asker', 'vera@example.co.ke');
  const other = await member(h, admin, 'Other Editor', 'other@example.co.ke');

  const made = await asker.client.json('/api/intake', { method: 'POST', body: {
    title: 'Need paper', need: 'A supply agreement with Kabras', folder: '' } });
  const id = made.request.id;

  /* ---- ARMED? The request is open, and this route really does mail. ---- */
  assert.equal(made.request.status, 'open', 'ARM: the request starts open');

  const before = h.mail.sent.length;
  const attack = await other.client.raw('/api/intake/' + id, {
    method: 'PATCH', body: { status: 'withdrawn' } });
  assert.equal(attack.status, 403, 'only the person who asked may withdraw it');

  const still = await asker.client.json('/api/intake?mine=1');
  assert.equal(still.requests.find(r => r.id === id).status, 'open',
    'and the request is still standing');

  /* CONTROL — the two things that must NOT have been broken by narrowing it:
     the requester's own withdrawal, and an editor's ordinary decline (which
     always costs a reason and always mails). */
  const decline = await other.client.raw('/api/intake/' + id, {
    method: 'PATCH', body: { status: 'declined', note: 'we already have one' } });
  assert.equal(decline.status, 200, 'CONTROL: an editor may still DECLINE it');
  await new Promise(r => setTimeout(r, 400));   // the notice is fire-and-forget
  assert.ok(h.mail.sent.length > before, 'CONTROL: and declining still tells the requester');

  const mine = await asker.client.json('/api/intake', { method: 'POST', body: {
    title: 'Second ask', need: 'another one', folder: '' } });
  const own = await asker.client.raw('/api/intake/' + mine.request.id, {
    method: 'PATCH', body: { status: 'withdrawn' } });
  assert.equal(own.status, 200, 'CONTROL: the requester may still withdraw their own');
});

/* ============================================================
   6 — A RECORD KEEPS ENGLISH, AND A SCREEN FOLLOWS THE READER
   ============================================================
   applyParentLink wrote the audit line from RELATION_LABEL — the SCREEN's word
   — so a member working in Swedish wrote "Filed as a ändringsavtal of MK-P1"
   into the trail: a permanent record in two languages, with the English a/an
   article computed over a Swedish noun, beside a "Created" line from the same
   act that correctly stayed English. And RELATION_LABEL was itself frozen at
   module load (Object.fromEntries INVOKES the getters), so a reader who
   switched language mid-session kept the old word until they reloaded. */
test('f226 — the Linked audit line is English, and the screen word is not frozen', () => {
  const src = read('js/family.js');
  const fn = src.slice(src.indexOf('function applyParentLink'), src.indexOf('function clearParentLink'));
  assert.match(fn, /RELATION_DOC_WORD\[c\.relation\]/,
    'the audit RECORD takes the English word, like every other record in this product');
  assert.ok(!/RELATION_LABEL\[c\.relation\]/.test(fn),
    'and never the screen word, which follows the reader');

  assert.ok(!/const RELATION_LABEL = Object\.fromEntries/.test(src),
    'RELATION_LABEL must not be a load-time snapshot — fromEntries invokes the getters');
  assert.match(src, /Object\.defineProperty\(m, r\.k, \{ enumerable:true, get\(\)\{ return r\.label; \} \}\)/,
    'it reads through to the one source at the moment it is asked');
});

test('f226 — and it really writes English under a Swedish reader', () => {
  /* Driven through the REAL module against the REAL dictionary, because the
     fault was invisible to anything that guessed at the words: the record has
     to come out English while the SCREEN word beside it is Swedish, and the
     two must be read from the same run. */
  const vm = require('node:vm');
  const { STRINGS } = require('../js/i18n.js');
  assert.equal(STRINGS.sv.fa_amendment, 'Ändringsavtal',
    'ARM: the Swedish dictionary really does carry a different word');

  let lang = 'sv';
  const contracts = [{ id: 'MK-P1', name: 'Master', status: 'Signed' }];
  const box = {
    state: { contracts }, console,
    i18t: (k, vars) => String((STRINGS[lang] && STRINGS[lang][k]) != null
      ? STRINGS[lang][k] : (STRINGS.en[k] != null ? STRINGS.en[k] : k))
      .replace(/\{(\w+)\}/g, (m, v) => (vars && vars[v] != null ? vars[v] : m)),
    i18tn: k => k, esc: s2 => s2, icon: () => '',
    getContract: id => contracts.find(x => x.id === id),
    currentUser: () => ({ name: 'Sven Svensson' }),
    nowISO: () => '2026-08-21T00:00:00.000Z', todayStr: () => '21 Aug 2026',
    persist: () => {}, openModal: () => {}, closeModal: () => {}, toast: () => {},
    jxLocale: () => 'sv-SE', canEdit: () => true, nextId: () => 'MK-X', setView: () => {},
    FIRST_PARTY: 'Highland Corporate Ltd',
  };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(read('js/family.js'), box, { filename: 'family.js' });

  const child = { id: 'MK-C1', audit: [] };
  box.applyParentLink(child, 'MK-P1', 'amendment', '', { name: 'Sven Svensson' });
  assert.equal(child.audit[0].detail, 'Filed as an amendment of MK-P1',
    'the RECORD is English, with the article computed over the English word');

  assert.equal(box.RELATION_LABEL.amendment, 'Ändringsavtal',
    'while the SCREEN word still follows the Swedish reader');
  lang = 'en';
  assert.equal(box.RELATION_LABEL.amendment, 'Amendment',
    'and follows them again the moment they switch, with no reload');
});
