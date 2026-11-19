'use strict';
/* f1105 — CHASE NOW IS THE SEND SCREEN, AS A REMINDER; AND THE OTHER SIDE IS REMINDED BY ITSELF, WHERE ASKED (owner's pick,
   19 Nov 2026: "for the reminder email, use the feature we already have for sending emails in the contracts"; "Reply
   only, park upload"; the automatic reminders "as described": off for the company until an admin switches them on, then
   per obligation, 7 days before and on the day).
   (1) the chase goes to the person chosen on the screen — one of THEIR contacts on the STORED contract, named by id,
       never an address from the body — with the note written on the screen as its own paragraph;
   (2) a person who is gone, or is ours, is refused with the way forward; the preview reads the same person;
   (3) the overnight run reminds them 7 days before the day only where the company switch AND the obligation's are on;
   (4) on a computer every Chase door opens the page; the phone keeps its question; the page's parts as drawn.
   AT THE PARENT every test here fails: the route ignores contactId and the note, the sweep never writes to them, and
   there is no page. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const wait = ms => new Promise(r => setTimeout(r, ms));

describe('f1105 the chase and the reminders on the server', () => {
  let h, W;
  const box = async to => ((await W.admin.json('/api/outbox')).items || []).filter(m => m.to_addr === to);
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); W = await H.seedWorkspace(h, { approvalRules: [] });
    const c = H.fixtureContract('MK-RM1', 'Warehousing', 'Juno Logistics', H.FOLDER_A, 2.4e6, 'Signed', 'Words.');
    c.counterpartyEmail = 'desk@juno.example'; c.party = 'Highland Corporate Ltd';
    c.participants = [{ id: 'p-peter', name: 'Peter Kamau', email: 'peter@juno.example', role: 'negotiate', title: 'Legal' },
      { id: 'p-ours', name: 'Amina', email: 'amina@highland.example', role: 'sign' }];
    c.obligations = [{ id: 'ob-1', desc: 'Keep the goods insured', due: day(-3), party: 'theirs', status: 'open' },
      { id: 'ob-7', desc: 'Send the stock report', due: day(7), party: 'theirs', status: 'open', remindTheirs: true, remindTo: 'p-peter' },
      { id: 'ob-7b', desc: 'Return the pallets', due: day(7), party: 'theirs', status: 'open' }];
    await W.admin.json('/api/contracts/MK-RM1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  test('f1105 (1) the chase goes to the contact chosen, by id, with the note as its own paragraph', async () => {
    const r = await W.admin.json('/api/contracts/MK-RM1/chase', { method: 'POST', body: { obligationId: 'ob-1', contactId: 'p-peter', note: 'Our insurer asks for it by Friday.' } });
    assert.equal(r.to, 'peter@juno.example');
    const m = (await box('peter@juno.example')).find(x => /Keep the goods insured/.test(x.body));
    assert.ok(m, 'in the outbox, to Peter');
    const paras = m.body.split('\n\n');
    assert.equal(paras[1], 'Our insurer asks for it by Friday.', 'the note under the greeting');
    assert.equal((await box('desk@juno.example')).length, 0, 'not to the contract\'s own address');
  });

  test('f1105 (2) a person gone or ours is refused; an address in the body still is; the preview reads the same person', async () => {
    const gone = await W.admin.raw('/api/contracts/MK-RM1/chase', { method: 'POST', body: { obligationId: 'ob-1', contactId: 'p-nobody' } });
    assert.equal(gone.status, 409);
    const ours = await W.admin.raw('/api/contracts/MK-RM1/chase', { method: 'POST', body: { obligationId: 'ob-1', contactId: 'p-ours' } });
    assert.equal(ours.status, 409, 'one of ours is not chased');
    const addr = await W.admin.raw('/api/contracts/MK-RM1/chase', { method: 'POST', body: { obligationId: 'ob-1', email: 'x@y.example' } });
    assert.equal(addr.status, 400);
    const pv = await W.admin.json('/api/contracts/MK-RM1/chase-preview?obligationId=ob-1&contactId=p-peter');
    assert.equal(pv.to, 'peter@juno.example');
  });

  test('f1105 (3) the overnight run reminds them 7 days before, only where the company and the obligation say so', async () => {
    await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} }); await wait(400);
    assert.equal((await box('peter@juno.example')).filter(x => /stock report/.test(x.body)).length, 0, 'company switch off: nothing');
    await W.admin.json('/api/settings', { method: 'PUT', body: { remindTheirs: { on: true } } });
    await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} }); await wait(400);
    assert.equal((await box('peter@juno.example')).filter(x => /stock report/.test(x.body)).length, 1, 'on, and the obligation asks: Peter reminded');
    assert.equal((await box('desk@juno.example')).filter(x => /pallets/.test(x.body)).length, 0, 'an obligation not switched on is not');
    await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} }); await wait(400);
    assert.equal((await box('peter@juno.example')).filter(x => /stock report/.test(x.body)).length, 1, 'once per day mark');
  });
});

test('f1105 (4) on a computer every Chase door opens the page; the phone keeps its question; the page as drawn', () => {
  const O = strip(R('js/obligations.js'));
  const ch = O.slice(O.indexOf('async function obligationChase('), O.indexOf('async function obligationChase(') + 1400);
  assert.match(ch, /if\(_o\.confirm !== false && !_quiet && obRemindPageOn\(\)\)\{ obRemindOpen\(cid, obId\); return null; \}/);
  assert.match(O, /_o\.contactId \? \{ contactId: String\(_o\.contactId\) \} : \{\}, _o\.note \? \{ note: String\(_o\.note\)\.slice\(0, 600\) \} : \{\}/);
  assert.match(O, /function obRemindPageOn\(\)\{\s*return typeof window !== 'undefined' && \(window\.innerWidth \|\| 0\) >= 768/);
  const h = O.slice(O.indexOf('function obRemindHtml('), O.indexOf('function obRemindPaint('));
  for (const k of ['sh_lgx_person', 'sh_lgx_title', 'sh_lgx_email', 'obr_phone', 'sh_lgx_then', 'obr_what', 'obr_can', 'obr_how', 'obr_note_ph', 'sh_kv_goes', 'obr_again_h', 'sh_nl_mail_k', 'obr_hist_h', 'sh_kv_names', 'obr_send'])
    assert.ok(h.includes(`'${k}'`), k + ' drawn');
  assert.match(O, /row = contactSet\(c, cur \?/, 'the person is kept in the one address book');
  assert.match(strip(R('js/views/settings.js')), /remindtheirs:\{\s*tab:'platform', group:'intake'/);
});

test('f1105 (5) both books carry the words', () => {
  const i18 = R('js/i18n.js');
  for (const k of ['obr_title', 'obr_what', 'obr_can', 'obr_how', 'obr_again', 'obr_again_off', 'obr_goes', 'obr_send', 'obr_send_firm', 'obt_rem_theirs_auto', 'set_remind_theirs', 'set_remind_theirs_sub'])
    assert.equal((i18.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
});
