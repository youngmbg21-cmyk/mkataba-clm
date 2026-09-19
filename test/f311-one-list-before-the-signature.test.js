/* ============================================================
   f311 — ONE LIST BEFORE THE SIGNATURE (the signing flow rebuilt, 13 Sep 2026)
   ============================================================
   The signing audit found five surfaces each printing their own number and
   none of them a door; the owner said "go" with the defaults as written:
   escalations are cleared by the colleague asked or an admin; escalations,
   approvals, whose turn, blanks and unnamed signers hold the button; ordinary
   departures and risk findings are shown and acceptable with a reason; the
   intent statement moves into the signature pad.

   Every claim is a measurement of the reading, a driven act, or a wall on the
   server. Against the parent most of them fail — the reading did not exist.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SIGNCHECK = read('js/signcheck.js');
const CONTRACT = read('js/views/contract.js');
const SIGNATURE = read('js/signature.js');
const SERVER = read('server/server.js');
const APP = read('js/app.js');
const HOME = read('js/views/home.js');
const I18N = read('js/i18n.js');

const TEXT = 'This Supply Agreement is made between Highland Corporate Ltd and Nordkust Industri AB. '
  + '1. Supply. The Supplier shall supply the goods to the agreed specification. '
  + '2. Payment. The Buyer shall pay each undisputed invoice within 60 days of receipt. '
  + '3. Governing law. This Agreement is governed by the laws of California. ';

function contract(over = {}){
  return { id: 'MK-311', name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', source: 'upload', folder: 'dist', fields: {}, metadata: {}, audit: [],
    rounds: [], versions: [], signatures: [], comments: [], changes: [], obligations: [],
    value: 4800000, valueType: 'estimated', compliance: {},
    upload: { name: 'supply.docx', extractedText: TEXT }, ...over };
}
const ME = { id: 'u-me', name: 'Amina Otieno', role: 'legal', email: 'amina@example.co.ke' };
const ADMIN = { id: 'u-adm', name: 'Wanjiru Kamau', role: 'admin', email: 'admin@example.co.ke' };
const COL = { id: 'u-col', name: 'Dan Wekesa', role: 'legal', email: 'dan@example.co.ke' };
function bench(over = {}, who = ME){
  const w = buildWorld({ signcheck: true, contractView: true });
  const { win } = w;
  const c = contract(over);
  /* A BRIEF ON FILE, NEWER THAN ANY CHANGE (15 Sep 2026) — see the same note in
     f308. The brief is a reading of the check now, so a bench contract heading
     for signature carries one; the tests about the brief take it away. */
  if (!Object.prototype.hasOwnProperty.call(over, '_brief'))
    c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Bench', truncated: false, data: {} };
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, settings: {} });
  win.getContract = id => (id === c.id ? c : null);
  win.canViewValues = () => true;
  win.signingRouteOpen = () => true;
  win.signingRouteMissing = () => null;
  win.currentUser = () => who;
  /* js/ai.js is not on this stage; its one reading of open findings is
     stood in for exactly (findings less the dismissed ids). */
  win.openFindings = cc => !cc.scan ? [] : cc.scan.findings.filter(x => !cc.scan.dismissed.includes(x.id));
  win.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Governing law' }, { category: 'Payment terms' }] });
  return { w, win, c };
}
const esc = (over = {}) => ({ category: 'Governing law', status: 'deviation', escalate: true,
  position: 'Swedish law', quote: 'laws of California', ...over });
const dev = (over = {}) => ({ category: 'Payment terms', status: 'deviation', escalate: false,
  position: '<= 45 days', quote: 'within 60 days', ...over });
const withBook = (win, c, verdicts) => { c.playbook = { label: 'Default',
  wordingHash: win.playbookHashOf(win.playbookText(c)), verdicts }; c.obligationsReadHash = c.playbook.wordingHash; };

describe('f311 (1) — the gate, advise by default, and what holds', () => {
  test('advise is the default in the browser and on the server', () => {
    const { win } = bench();
    assert.equal(win.signCheckGate(), 'advise');
    assert.equal(win.SIGN_CHECK_GATE_DEFAULT, 'advise');
    assert.match(strip(SERVER), /function scGate\(\)\{[\s\S]*?: 'advise';\n\}/, 'the server mirrors it');
  });
  test('an escalated departure holds; an ordinary one is shown and does not', () => {
    const { win, c } = bench();
    withBook(win, c, [esc(), dev()]);
    const rd = win.signReadiness(c);
    assert.equal(rd.n, 1, 'one thing holds');
    assert.equal(rd.holds[0].kind, 'standard'); assert.equal(rd.holds[0].escalate, true);
    assert.equal(rd.noted.length, 1, 'the ordinary departure is noted, not held');
    assert.equal(rd.noted[0].category, 'Payment terms');
  });
  test('off holds nothing; require holds everything open', () => {
    const { win, c } = bench();
    withBook(win, c, [esc(), dev()]);
    win.state.settings.signCheckGate = 'off';
    assert.equal(win.signReadiness(c).n, 0);
    assert.equal(win.signReadiness(c).noted.length, 2, 'but both are still shown');
    win.state.settings.signCheckGate = 'require';
    assert.equal(win.signReadiness(c).n, 2);
  });
  test('a high risk finding is a row that never holds', () => {
    const { win, c } = bench();
    withBook(win, c, []);
    c.scan = { at: 'x', dismissed: [], findings: [{ id: 'r1', sev: 'high', title: 'Unlimited liability', what: 'No cap.', anchor: 'doc' },
      { id: 'r2', sev: 'low', title: 'Minor', what: 'x', anchor: 'doc' }] };
    win.state.settings.signCheckGate = 'require';
    const rd = win.signReadiness(c);
    assert.equal(rd.n, 0);
    assert.equal(rd.noted.filter(r => r.kind === 'risk').length, 1, 'high only, shown');
  });
  test('the intent tick-box is gone from the list and from the page; the signers row joined it', () => {
    const m = /function signBlockers\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.doesNotMatch(m[0], /add\('consent'/);
    assert.match(m[0], /add\('signers'/);
    assert.doesNotMatch(CONTRACT, /data-comp="consent"/, 'no tick-box on the Signing tab');
    const { win, c } = bench();
    win.signingRouteMissing = () => 'both';
    assert.ok(win.signBlockers(c).some(b => b.key === 'signers'));
  });
  test('the reading leaves the record byte-identical and starts no negotiation', () => {
    const { win, c } = bench();
    withBook(win, c, [esc()]);
    const before = JSON.stringify(c);
    win.signReadiness(c); win.signCheckCardHtml(c);
    assert.equal(JSON.stringify(c), before);
    assert.equal(c.negotiation, undefined);
  });
  test('a light record leaves the two hash rows out rather than guessing them', () => {
    const { win, c } = bench();
    withBook(win, c, [dev()]);
    delete c.upload.extractedText;   /* what HEAVY strips */
    const rows = win.signReadiness(c, { light: true }).rows.map(r => r.kind);
    assert.ok(!rows.includes('obligations') && !rows.includes('standards-read'), rows.join(','));
  });
});

describe('f311 (2) — escalate means somebody else', () => {
  test('the signer may not accept an escalated departure; the colleague asked or an admin may', () => {
    const { win, c } = bench();
    const v = esc();
    assert.equal(win.signCheckMayAccept(c, v, ME), false, 'not the signer alone');
    assert.equal(win.signCheckMayAccept(c, v, ADMIN), true, 'an admin may');
    v.escalation = { to: { id: COL.id, name: COL.name }, by: ME.name, at: '2026-09-13T08:00:00.000Z' };
    assert.equal(win.signCheckMayAccept(c, v, COL), true, 'the colleague asked may');
    assert.equal(win.signCheckMayAccept(c, v, ME), false, 'the signer still may not');
    assert.equal(win.signCheckMayAccept(c, dev(), ME), true, 'an ordinary departure: the signer may');
  });
  test('an acceptance is judged by its stamp, never by who is looking', () => {
    const { win } = bench();
    const v = esc({ escalation: { to: { id: COL.id, name: COL.name }, at: 'x' } });
    v.accepted = { by: ME.name, byId: ME.id, role: 'legal', at: 'x', why: 'fine' };
    assert.equal(win.signCheckAcceptedProperly(v), false);
    v.accepted = { by: COL.name, byId: COL.id, role: 'legal', at: 'x', why: 'fine' };
    assert.equal(win.signCheckAcceptedProperly(v), true);
    v.accepted = { by: ADMIN.name, byId: ADMIN.id, role: 'admin', at: 'x', why: 'fine' };
    assert.equal(win.signCheckAcceptedProperly(v), true);
  });
  test('a wrongly accepted escalation still holds, and the row says so', () => {
    const { win, c } = bench();
    withBook(win, c, [esc({ escalation: { to: { id: COL.id, name: COL.name }, at: 'x' },
      accepted: { by: ME.name, byId: ME.id, role: 'legal', at: 'x', why: 'fine' } })]);
    const rd = win.signReadiness(c);
    assert.equal(rd.n, 1);
    assert.equal(rd.holds[0].badAccept, true);
    assert.match(win.signCheckCardHtml(c), /was not the person it was escalated to/);
  });
  test('the card offers Ask a colleague to the signer and Accept to the admin', () => {
    const a = bench(); withBook(a.win, a.c, [esc()]);
    const html = a.win.signCheckCardHtml(a.c);
    assert.match(html, /data-sc-escalate="0"/, 'the signer is offered the ask');
    assert.doesNotMatch(html, /data-sc-accept="0"/, 'and not the acceptance');
    const b = bench({}, ADMIN); withBook(b.win, b.c, [esc()]);
    const bh = b.win.signCheckCardHtml(b.c);
    assert.match(bh, /data-sc-accept="0"/, 'an admin may accept');
    assert.match(bh, /data-sc-escalate="0"/, 'and may still hand it to the person who owns the standard');
  });
  test('signCheckAccept refuses the signer on an escalated finding, in words', async () => {
    const { win, c } = bench();
    withBook(win, c, [esc()]);
    const said = [];
    win.toast = (m, k) => said.push([m, k]);
    win.promptDialog = async () => 'should not be asked';
    const ok = await win.signCheckAccept(c, 0);
    assert.equal(ok, false);
    assert.ok(!c.playbook.verdicts[0].accepted, 'nothing stamped');
    assert.ok(said.some(x => /escalated/.test(x[0]) && x[1] === 'warn'), JSON.stringify(said));
  });
  test('the acceptance stamps who, by id and role', async () => {
    const { win, c } = bench({}, ADMIN);
    withBook(win, c, [esc()]);
    win.toast = () => {}; win.persist = () => {};
    win.promptDialog = async () => 'Traded in round 2.';
    assert.equal(await win.signCheckAccept(c, 0), true);
    const a = c.playbook.verdicts[0].accepted;
    assert.equal(a.byId, ADMIN.id); assert.equal(a.role, 'admin');
    assert.equal(win.signReadiness(c).n, 0, 'and the hold is gone');
  });
});

describe('f311 (3) — every row is a door, and the button is the list', () => {
  test('the button quotes the reading and lands on the list while anything holds', () => {
    const m = /function renderSignButton\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.match(m[0], /signReadiness\(c\)/, 'it asks the one reading');
    assert.match(m[0], /sc_btn_to_settle/); assert.match(m[0], /sc_btn_noted/);
    assert.match(m[0], /signLandOnList\(c\)/, 'the held press is a door');
    assert.doesNotMatch(m[0], /ct_high_findings/, 'the red line is a row now, not a sentence');
    assert.doesNotMatch(m[0], /blockers\.map\(b=>/, 'and so is the paragraph of blockers');
  });
  test('a record disagreement offers the paper\'s own value in one press, and it works', () => {
    const { win, c } = bench();
    withBook(win, c, []);
    c.metadata = { value: 5200000, expiryDate: '2027-03-31' };
    const html = win.signCheckCardHtml(c);
    assert.match(html, /data-sc-take="value"/); assert.match(html, /data-sc-take="expiryDate"/);
    win.toast = () => {}; win.persist = () => {};
    assert.equal(win.signCheckTake(c, 'value'), true);
    assert.equal(c.value, 5200000);
    assert.equal(win.signCheckTake(c, 'expiryDate'), true);
    assert.equal(c.expiry, '2027-03-31');
    assert.equal(win.signReadiness(c).rows.filter(r => r.kind === 'record').length, 0, 'and the rows are gone');
    assert.ok(c.audit.some(a => /set from the wording before signing/.test(a.detail || a.action || JSON.stringify(a))), 'stamped on the trail');
  });
  test('a risk finding offers Read it and Dismiss with a reason; the dismissal is recorded', async () => {
    const { win, c } = bench();
    withBook(win, c, []);
    c.scan = { at: 'x', dismissed: [], findings: [{ id: 'r1', sev: 'high', title: 'Unlimited liability', what: 'No cap.', anchor: 'doc' }] };
    const html = win.signCheckCardHtml(c);
    assert.match(html, /data-sc-risk-read="r1"/); assert.match(html, /data-sc-risk-dismiss="r1"/);
    win.toast = () => {}; win.persist = () => {};
    win.promptDialog = async () => 'Covered by insurance.';
    assert.equal(await win.signRiskDismiss(c, 'r1'), true);
    assert.deepEqual(Array.from(c.scan.dismissed), ['r1']);
    assert.equal(win.signReadiness(c).rows.filter(r => r.kind === 'risk').length, 0);
  });
  test('settled rows fold under their count, and the holds lead', () => {
    const { win, c } = bench({}, ADMIN);
    withBook(win, c, [dev({ accepted: { by: 'W', byId: 'x', role: 'legal', at: '2026-09-01T00:00:00.000Z', why: 'ok' } }), esc()]);
    const rd = win.signReadiness(c);
    assert.equal(rd.rows[0].escalate, true, 'the escalation leads');
    assert.equal(rd.settled.length, 1);
    const html = win.signCheckCardHtml(c);
    assert.match(html, /data-sc-fold="1"/); assert.match(html, /1 settled/);
  });
  test('the card and the acts are wired in the one paint of the column', () => {
    const m = /function renderSignSide\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    for (const d of ['data-sc-escalate', 'data-sc-take', 'data-sc-risk-read', 'data-sc-risk-dismiss', 'data-sc-signers', 'data-sc-fold'])
      assert.match(m[0], new RegExp(d), d);
    /* ---- REVERSED IN PLACE (Young reported it 19 Sep 2026) ----
       This pinned "hands the contract, NOT the field name", a deliberate
       narrowing from 13 Sep. It was wrong, and the screenshot is the proof:
       every one of these rows landed on the counterparty box, so "Value is
       blank" put the caret in the wrong field. The field rides the attribute
       and always did. What the claim really guards is that the CONTRACT is
       still the first argument — which it is — so it is pinned that way. */
    assert.match(m[0], /focusKeyTerms\(c,\s*b\.getAttribute\('data-sc-fix'\)\)/,
      'Fix on Key terms hands the contract FIRST and the field it was drawn for');
  });
});

describe('f311 (4) — the intent line is the pad\'s first line', () => {
  test('captureSignature asks the pad for it, and the pad refuses to adopt without it', () => {
    assert.match(strip(CONTRACT), /openSignaturePad\(\{ name, intent:true \}\)/);
    const pad = SIGNATURE;   /* the pad's own markup carries a slash pair that strip() reads as a comment */
    assert.match(pad, /id="sig-intent"/);
    assert.match(pad, /ct_intend_to_sign/, 'the same words as before');
    assert.match(pad, /if\(opts\.intent && !\(q\('#sig-intent'\)&&q\('#sig-intent'\)\.checked\)\)\{\s*toast\(i18t\('ct_tick_intent_first'\),'err'\)/);
    assert.match(pad, /consent:!!opts\.intent/, 'the answer rides out on the result');
  });
  test('the counterparty\'s page does not ask for it (their own consent is theirs)', () => {
    assert.match(read('js/views/portal.js'), /openSignaturePad\(\{ name \}\)/);
  });
  test('signDocument stamps consent off the pad and never asks for a tick first', () => {
    const m = /async function signDocument\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.doesNotMatch(m[0], /ct_tick_intent_first/);
    assert.equal((m[0].match(/signConsentStamp\(c,sig\)/g) || []).length, 2, 'both paths');
    const { win, c } = bench();
    win.logAudit = (cc, a, d) => cc.audit.push({ action: a, detail: d });
    win.signConsentStamp(c, { consent: true });
    assert.equal(c.compliance.consent, true);
    assert.ok(c.audit.some(a => a.action === 'Consent'));
  });
});

describe('f311 (5) — upstream quotes the same number', () => {
  test('the head says how much stands in the way, and sign-scroll is retired', () => {
    const m = /function wsNextAction\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.doesNotMatch(m[0], /'sign-scroll'/);
    assert.match(m[0], /signHeadLabel\(c\)/);
    const { win, c } = bench();
    withBook(win, c, [esc()]);
    assert.equal(win.signHeadLabel(c), 'Sign · 1 to settle');
    withBook(win, c, [dev()]);
    assert.equal(win.signHeadLabel(c), 'Sign');
  });
  test('the head\'s press lands on the list while anything holds', () => {
    assert.match(strip(CONTRACT), /if\(holds\)\{ signLandOnList\(c\); return; \}/);
  });
  test('the bell\'s signature row and Home\'s decision row read it, light where the record is', () => {
    assert.match(strip(APP), /signReadiness\(c,\{ light:!!\(c\._light&&!c\._loaded\) \}\)\.n/);
    assert.match(strip(HOME), /signReadiness\(c,\{ light:!!\(c\._light&&!c\._loaded\) \}\)\.n/);
    assert.match(HOME, /home_sign_row/);
  });
  test('the words are in both books', () => {
    for (const k of ['sc_ready_head', 'sc_btn_to_settle', 'sc_btn_noted', 'ct_sign_n_to_settle', 'sc_ask_colleague',
      'sc_accept_not_you', 'sc_take_btn', 'sc_read_btn', 'sc_dismiss_btn', 'home_sign_row', 'al_sign_sub_one', 'mail_esc_line'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f311 (6) — the server is the wall', () => {
  let h, W;
  const ID = 'MK-S311';
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
      id: ID, name: 'Escalation wall fixture', counterparty: 'Nordkust Industri AB',
      folder: FOLDER_A, status: 'Under Review', fields: {}, metadata: {}, audit: [], rounds: [],
      versions: [], signatures: [], comments: [], changes: [], obligations: [],
      value: 100000, valueType: 'estimated' } } });
  });
  after(async () => { await h.stop(); });
  const put = async (client, patch) => {
    const seen = await client.json('/api/contracts/' + ID);
    return client.json('/api/contracts/' + ID, { method: 'PUT',
      body: { contract: { ...seen, ...patch }, baseVersion: seen._v } });
  };
  const sig = () => [{ name: 'Wanjiru Kamau', email: 'admin@example.co.ke',
    at: new Date().toISOString(), method: 'session-authenticated' }];
  const refused = async fn => { try { await fn(); return null; } catch (e) { return String(e.message || (e.body && e.body.error) || e); } };

  test('on the default gate an escalated departure refuses the signature; an ordinary one does not', async () => {
    await put(W.admin, { signatures: [], playbook: { label: 'D', verdicts: [
      { category: 'Payment terms', status: 'deviation' } ] } });
    assert.ok(!(await put(W.admin, { signatures: sig() })).error, 'ordinary: signs');
    await put(W.admin, { signatures: [], playbook: { label: 'D', verdicts: [
      { category: 'Governing law', status: 'deviation', escalate: true } ] } });
    const r = await refused(() => put(W.admin, { signatures: sig() }));
    assert.match(String(r), /escalated departure/i, 'escalated: refused');
  });
  test('accepted by the signer it still refuses; by the colleague asked it lets go', async () => {
    const col = W.users.unrestricted, other = W.users.restricted;
    await put(W.admin, { signatures: [], playbook: { label: 'D', verdicts: [
      { category: 'Governing law', status: 'deviation', escalate: true,
        escalation: { to: { id: col.id, name: col.name }, at: new Date().toISOString() },
        accepted: { by: other.name, byId: other.id, role: 'legal', at: new Date().toISOString(), why: 'fine' } } ] } });
    assert.match(String(await refused(() => put(W.admin, { signatures: sig() }))), /not escalated to/i);
    await put(W.admin, { signatures: [], playbook: { label: 'D', verdicts: [
      { category: 'Governing law', status: 'deviation', escalate: true,
        escalation: { to: { id: col.id, name: col.name }, at: new Date().toISOString() },
        accepted: { by: col.name, byId: col.id, role: 'legal', at: new Date().toISOString(), why: 'fine' } } ] } });
    assert.ok(!(await put(W.admin, { signatures: sig() })).error, 'the colleague asked settles it');
    await put(W.admin, { signatures: [] });
  });
  test('the escalate route takes an id, never an address, and tells only somebody who can open the contract', async () => {
    const bad = await W.admin.raw('/api/contracts/' + ID + '/escalate', { method: 'POST',
      body: { email: 'x@y.z', memberId: W.users.unrestricted.id } });
    assert.equal(bad.status, 400);
    const ok = await W.admin.json('/api/contracts/' + ID + '/escalate', { method: 'POST',
      body: { memberId: W.users.unrestricted.id, category: 'Governing law', note: 'Can we live with this?' } });
    assert.equal(ok.ok, true); assert.equal(ok.told, true);
    /* MK-S311 sits in FOLDER_A, which the restricted member CAN open; a
       member out of scope is refused rather than written to. */
    const outId = 'MK-S311B';
    await W.admin.json('/api/contracts/' + outId, { method: 'PUT', body: { contract: {
      id: outId, name: 'Out of reach', counterparty: 'X', folder: 'dist', status: 'Under Review',
      fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
      changes: [], obligations: [], value: 1, valueType: 'estimated' } } });
    const far = await W.admin.raw('/api/contracts/' + outId + '/escalate', { method: 'POST',
      body: { memberId: W.users.restricted.id } });
    assert.equal(far.status, 403);
  });
});

describe('f311 (7) — the check has to have been run (owner-reported 13 Sep 2026)', () => {
  /* "the platform allows me to sign if i meet all the other requirements but
     before i run check which is nonsensical." A row that says nothing has read
     this wording holds until the sweep has run against THIS wording. */
  test('an unread playbook and a never-read obligations list each hold on the default gate', () => {
    const { win, c } = bench();
    c.playbook = undefined; c.obligationsReadHash = undefined;
    const rd = win.signReadiness(c);
    const kinds = rd.holds.map(r => r.kind);
    assert.ok(kinds.includes('standards-read'), 'nothing has read it against the playbook: holds');
    assert.ok(kinds.includes('obligations'), 'nothing has read it for promises: holds');
    assert.equal(rd.holds.find(r => r.kind === 'obligations').never, true);
    assert.match(win.signCheckCardHtml(c), /data-sc-run="1"/, 'the row carries Run the check');
  });
  test('once the sweep has run against this wording, those rows stop holding', () => {
    const { win, c } = bench();
    c.playbook = undefined; c.obligationsReadHash = undefined;
    c.signCheck = { at: new Date().toISOString(), by: 'W', wordingHash: win.playbookHashOf(win.playbookText(c)) };
    const rd = win.signReadiness(c);
    assert.equal(rd.holds.length, 0, 'the check ran: what it found follows the gate; what it did not read no longer holds');
    assert.ok(rd.noted.some(r => r.kind === 'standards-read'), 'but the row is still shown');
  });
  test('a review that read older wording holds too, and off holds nothing', () => {
    const { win, c } = bench();
    withBook(win, c, []);
    c.playbook.wordingHash = 'stale-hash';
    assert.ok(win.signReadiness(c).holds.some(r => r.kind === 'standards-read' && r.stale), 'stale: holds');
    win.state.settings.signCheckGate = 'off';
    assert.equal(win.signReadiness(c).n, 0);
  });
  test('the reason boxes wrap, and say where the reason lives', () => {
    const m = /async function signCheckAccept\([\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.match(m[0], /multiline:true/);
    const d = /async function signRiskDismiss\([\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.match(d[0], /multiline:true/);
    const { STRINGS } = require('../js/i18n.js');
    assert.match(STRINGS.en.sc_accept_msg, /History tab/);
    assert.match(STRINGS.sv.sc_accept_msg, /Historik/);
  });
});

describe('f311 (8) — the Term fact prints the date the term was read from', () => {
  /* Owner-reported: "Term · 364 days to NaN.NaN.NaN". The length came from
     the wording's own expiry (metadata) and the date from an EMPTY record
     field. */
  test('a term read from the wording alone prints its end date, never NaN', () => {
    const { win, c } = bench();
    if (typeof win.roomFactsHtml !== 'function') return;   /* not on this stage */
    c.expiry = ''; c.fields = { effDate: '2026-08-01' }; c.metadata = { effectiveDate: '2026-08-01', expiryDate: '2027-07-31' };
    win.regDotDate = iso => { const d = new Date(iso + 'T00:00:00');
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
    const html = win.roomFactsHtml(c);
    assert.doesNotMatch(html, /NaN/);
    assert.match(html, /31\.07\.2027/);
  });
});
