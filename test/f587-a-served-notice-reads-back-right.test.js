/* f587 — A SERVED "LET IT LAPSE" READS BACK LIKE A RECORDED ONE (B10, 8 Oct 2026).
   ============================================================
   The 9 Oct review: a served non-renewal notice read back "Decided by a
   colleague … Decide-by was <the day it was served>" — renewalDecisionOf
   returned `by` as a bare string where the card reads `by.name`, and put the
   service day where the card prints the decide-by. Same shape now: `by` is a
   person, `decideBy` the decide-by date, the service day `servedOn`.
   Run: node --test test/f587-a-served-notice-reads-back-right.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('the served reading: by is a person, decideBy the decide-by date, servedOn the day it was served', () => {
  const { win } = buildWorld({ obligations: true, templates: true, templateFields: true, desk: true });
  win.noticeServed = c => (c && c.notice && c.notice.servedOn) ? c.notice : null;
  const c = { id: 'MK-N1', name: 'Distributor Agreement', counterparty: 'Savannah', status: 'Signed',
    execution: { at: new Date().toISOString() }, expiry: isoDay(150), fields: {},
    metadata: { expiryDate: isoDay(150), noticePeriodDays: 90, renewalType: 'auto-renew' },
    notice: { servedOn: isoDay(-1), way: 'email', at: new Date().toISOString(), by: 'Amina Otieno' },
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [] };
  const d = win.renewalDecisionOf(c);
  assert.equal(d.answer, 'lapse');
  assert.deepEqual({ ...d.by }, { name: 'Amina Otieno' }, 'a person, the shape the card reads (by.name)');
  assert.equal(d.decideBy, isoDay(60), 'the decide-by date: expiry less the notice period');
  assert.equal(d.servedOn, isoDay(-1), 'the day it was served is its own fact');
  assert.equal(d.served, true);
  assert.equal(JSON.stringify(c.notice.by), '"Amina Otieno"', 'reading wrote nothing');
});

/* ---------------------------------------------------------------- B15
   AN AUTO-RENEWING CONTRACT NOBODY DECIDED ON RENEWED ITSELF (B15, 8 Oct
   2026): after its end date passed with no notice served it read "Expired",
   and nobody was told it had renewed. The nightly sweep now says so — once —
   and rolls the end date on where the renewal term is recorded; where it is
   not, it guesses nothing and tells the owner the new date is not known. */
const { describe, before, after } = require('node:test');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
describe('f587 (B15) the nightly sweep and an auto-renewing contract', () => {
  let h, W, ownerId;
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] });
    ownerId = W.users.unrestricted.id;
    for (const [id, months] of [['MK-AR1', 12], ['MK-AR2', 0], ['MK-AR3', 12]]) {
      const c = fixtureContract(id, 'Distributor Agreement', 'Savannah', FOLDER_A, 480000, 'Signed', 'Words.');
      c.hash = 'h'; c.execution = { at: new Date(Date.now() - 400 * 864e5).toISOString() };
      c.owner = { id: ownerId, name: 'Unrestricted Legal' };
      c.expiry = isoDay(-10);
      c.metadata = { expiryDate: isoDay(-10), noticePeriodDays: 30, renewalType: 'auto-renew', ...(months ? { renewalTermMonths: months } : {}) };
      if (id === 'MK-AR3') c.notice = { servedOn: isoDay(-50), way: 'email', at: new Date().toISOString(), by: 'Amina Otieno' };
      await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    }
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    await new Promise(r => setTimeout(r, 400));
  });
  after(async () => { await h.stop(); });
  const mails = async re => ((await W.admin.json('/api/outbox')).items || []).filter(m => m.to_addr === 'everything@example.co.ke' && re.test(m.subject || ''));

  test('a known renewal term rolls the end date on, as a reading — the signed expiry is untouched', async () => {
    const x = await W.admin.json('/api/contracts/MK-AR1');
    assert.equal(x.expiry, isoDay(-10), 'the signed expiry is not rewritten');
    const ar = (x.autoRenewed || [])[0];
    assert.ok(ar && ar.from === isoDay(-10) && ar.to > isoDay(0), JSON.stringify(x.autoRenewed));
    assert.ok(x.audit.some(a => a.user === 'HaTi' && a.action === 'Renewed' && /Renewed itself on .* no notice was served/.test(a.detail)));
    assert.equal((await mails(/Renewed automatically.*Distributor/)).length >= 1, true, 'the owner is told');
  });
  test('an unknown renewal term is not guessed: the owner is told the new date is not known', async () => {
    const x = await W.admin.json('/api/contracts/MK-AR2');
    const ar = (x.autoRenewed || [])[0];
    assert.ok(ar && ar.from === isoDay(-10) && ar.to === null, JSON.stringify(x.autoRenewed));
    assert.ok(x.audit.some(a => a.action === 'Renewed' && /probably renewed itself/.test(a.detail)));
    assert.ok((await mails(/Probably renewed/)).length >= 1);
    assert.ok(x.audit.some(a => a.action === 'Renewed' && /waiting in the outbox/.test(a.detail)), 'and "sent" only where it went');
  });
  test('a served notice means it ended — nothing is said; and a second sweep says nothing twice', async () => {
    assert.ok(!(await W.admin.json('/api/contracts/MK-AR3')).autoRenewed);
    const before_ = (await mails(/renewed/i)).length;
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    await new Promise(r => setTimeout(r, 300));
    assert.equal((await mails(/renewed/i)).length, before_);
  });
  test('the browser does not paint it Expired', () => {
    const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
    const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const fn = CORE.slice(CORE.indexOf('function contractExpired(c){'), CORE.indexOf('/* ---- THE SEAL WITH ONE SIGNATURE ON IT'));
    const sb = vm.createContext({ window: { dateOnly: v => String(v).slice(0, 10), daysUntil: d => Math.round((Date.parse(d) - Date.now()) / 864e5) } });
    vm.runInContext('var window=this.window;var dateOnly=window.dateOnly,daysUntil=window.daysUntil;' + fn + ';this.f=contractExpired;', sb);
    const c = { status: 'Signed', expiry: isoDay(-10), metadata: { expiryDate: isoDay(-10) } };
    assert.equal(sb.f(c), true, '[control] an end date passed, nothing recorded: Expired');
    assert.equal(sb.f({ ...c, autoRenewed: [{ from: isoDay(-10), to: null }] }), false, 'probably renewed is not Expired');
  });
});
