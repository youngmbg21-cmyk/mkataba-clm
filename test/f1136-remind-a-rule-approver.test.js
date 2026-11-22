/* f1136 — REMIND A RULE'S APPROVER BY HAND (owner, 21 Nov 2026, P-30's "Remind Joseph")
   ============================================================
   On Approvals › Waiting on others, an approval a company RULE asked for (not one named person's) carries
   "Remind <the approver>", as drawn. POST /api/contracts/:id/rule-remind:
     (1) WHO MAY: a Viewer is refused; the approver themselves is refused; a contract outside the caller's
         folders is not found; a contract with no step waiting is refused — each in plain words;
     (2) ONE EMAIL to the step's approver, in the reminder's words, the plain app link landing on the decision
         (go 'approval', no token), and "sent" means sent (mailReport's emailSent / outbox);
     (3) THE RECORD the server writes: c.ruleReminds (who, whom, when) and a trail line; an ordinary save keeps it;
     (4) THE LIMIT: once a day per waiting step, said in plain words (429);
     (5) the panel and the words: the panel offers it only where the reader may remind, and shows the record.
   Run: node --test test/f1136-remind-a-rule-approver.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_B } = require('./helpers');

describe('f1136 — the route', () => {
  let h, W, viewer;
  const outbox = async (to, re) => ((await W.admin.json('/api/outbox')).items || [])
    .filter(m => (!to || m.to_addr === to) && (!re || re.test(m.subject || '')));
  const post = (cl, id) => cl.raw(`/api/contracts/${id}/rule-remind`, { method: 'POST', body: {} });
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    const adminId = (await W.admin.json('/api/bootstrap')).me.id;
    for (const [id, v] of [['MK-RR1', 50000000], ['MK-RR2', 1000]]) {
      const c = fixtureContract(id, 'Fuel Supply ' + id, 'Vivo Energy Kenya', FOLDER_B, v, 'Under Review', 'Words.');
      c.owner = { id: adminId, name: 'Amina Otieno' };
      await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    }
    await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r10', order: 1, name: 'Over 10 M',
      cond: { type: 'value', op: '>=', value: 10000000 }, approver: { kind: 'member', id: W.users.unrestricted.id, name: 'Unrestricted Legal' } }] } });
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('viewer@example.co.ke');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } }).catch(() => {});
  });
  after(async () => { await h.stop(); });

  test('(1) who may: not a Viewer, not the approver, not outside the folders, not when nothing waits', async () => {
    const v = await post(viewer, 'MK-RR1');
    assert.ok(v.status === 403, 'a Viewer is refused: ' + v.status + ' ' + v.text);
    const self = await post(W.unrestricted, 'MK-RR1');
    assert.equal(self.status, 403); assert.match(self.text, /waits on you/);
    const out = await post(W.restricted, 'MK-RR1');
    assert.ok([403, 404].includes(out.status), 'outside the folders: ' + out.status);
    const none = await post(W.admin, 'MK-RR2');
    assert.equal(none.status, 409); assert.match(none.text, /nobody to remind/);
    assert.equal((await outbox('everything@example.co.ke', /Reminder:/)).length, 0, 'nothing was sent by a refusal');
  });

  test('(2)(3) one email to the approver, landing on the decision; the record and the trail line', async () => {
    const r = await post(W.admin, 'MK-RR1');
    assert.equal(r.status, 200, r.text);
    const body = JSON.parse(r.text);
    assert.ok(body.emailSent || body.outbox, '"sent" is said as mailReport says it');
    const m = await outbox('everything@example.co.ke', /Reminder: .*waiting on your approval/);
    assert.equal(m.length, 1, 'one reminder to the approver');
    assert.match(m[0].body, /“Over 10 M”/);
    assert.match(m[0].body, /#contract=MK-RR1&tab=sign&go=approval/, 'the plain app link, landing on the decision');
    assert.doesNotMatch(m[0].body, /token=|\/s\//, 'nothing secret in the mail');
    const stored = await W.admin.json('/api/contracts/MK-RR1');
    const rec = (stored.ruleReminds || []).pop();
    assert.ok(rec && rec.ruleId === 'r10' && rec.by.name === 'Amina Otieno' && rec.to.includes('Unrestricted Legal'), JSON.stringify(rec));
    assert.ok((stored.audit || []).some(a => a.action === 'Reminded' && /Unrestricted Legal/.test(a.detail)), 'a line in the trail');
    /* an ordinary save from a copy without the record keeps the stored one */
    const v = stored._v; delete stored._v; delete stored.ruleReminds;
    const put = await W.admin.raw('/api/contracts/MK-RR1', { method: 'PUT', body: { contract: stored, baseVersion: v } });
    assert.equal(put.status, 200, put.text);
    assert.equal(((await W.admin.json('/api/contracts/MK-RR1')).ruleReminds || []).length, 1, 'the stored record wins');
  });

  test('(4) once a day per waiting step, said in plain words', async () => {
    const again = await post(W.admin, 'MK-RR1');
    assert.equal(again.status, 429);
    assert.match(again.text, /already been reminded about this approval today/);
    assert.equal((await outbox('everything@example.co.ke', /Reminder: .*waiting on your approval/)).length, 1, 'still one email');
  });
});

describe('f1136 (5) the panel and the words', () => {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const V = read('js/views/approvalsview.js');
  test('the panel offers Remind for a rule step only to who may remind, and draws the record', () => {
    const s = V.slice(V.indexOf('function apnRuleStepOf('), V.indexOf('async function apnRuleRemind('));
    assert.match(s, /mayActOn\(r\.c, me\)/); assert.match(s, /userCanApprove\(nx\.approver, me\)/); assert.match(s, /nx\.sa/);
    const lead = V.slice(V.indexOf('function apnLeadFiveHtml('), V.indexOf("/* the approver's word in a sentence"));
    assert.match(lead, /data-apn-act="ruleremind"/);
    assert.match(lead, /c\.ruleReminds/); assert.match(lead, /apn_tl_reminded/);
    assert.match(V, /await ruleStepRemind\(c, who\)/, 'the page presses the room\'s writer; it writes nothing itself');
    assert.match(read('js/approvals.js'), /api\('contracts\/'\+encodeURIComponent\(c\.id\)\+'\/rule-remind','POST'/);
  });
  test('both books carry the words; the server sentences are translated; the route is in the brain; it never travels', () => {
    const I = read('js/i18n.js');
    for (const k of ['apn_tl_reminded', 'apn_reminded_toast', 'apn_reminded_outbox', 'apn_remind_not_sent', 'apn_remind_t', 'srv_arm_today', 'srv_arm_self', 'brn_p_ruleremind', 'brn_pd_ruleremind'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in both books');
    assert.match(I, /["']They have already been reminded about this approval today\. You can remind them again tomorrow\.["']: 'srv_arm_today'/);
    assert.match(read('js/brainmap.js'), /\['ruleremind', 'POST \/api\/contracts\/:id\/rule-remind', 'sign', 2\]/);
    const S = read('server/server.js');
    assert.match(S, /delete payload\.contract\.ruleReminds;/);
    assert.match(S, /if \(prev && Array\.isArray\(prev\.ruleReminds\)\) c\.ruleReminds = prev\.ruleReminds; else delete c\.ruleReminds;/);
  });
});
