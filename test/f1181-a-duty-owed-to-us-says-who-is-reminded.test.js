/* ============================================================
   f1181 — a duty owed to us says who is reminded, as the server sends it
   ============================================================
   Bug log: the panel said "HaTi never reminds {cp} on its own. The admins are
   told once, the day after" for every duty of theirs, while runReminders
   writes to OUR colleague who watches it (7 days before, on the day, the day
   after; the admins four days late) and, where the company and the duty both
   ask, to THEIR side (7 days before and on the day). The sentence and the
   one line now read the same plan (obTheirsPlan). Red at the parent: the
   named colleague was never said.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const isoIn = d => { const t = new Date(); t.setUTCHours(12, 0, 0, 0); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
function book(theirsOn){
  const win = buildWorld({ intelView: true, contractView: true }).win;
  const roster = [{ id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' }];
  const c = { id: 'MK-2', name: 'Agreement', counterparty: 'Nordkust', status: 'Signed', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [
      { id: 't1', desc: 'Deliver the accounts', due: isoIn(30), status: 'open', party: 'theirs', assignee: 'Wanjiku Kamau', remindTheirs: true },
      { id: 't2', desc: 'Send the report', due: isoIn(30), status: 'open', party: 'theirs' },
    ] };
  win.state = Object.assign(win.state || {}, { contracts: [c], view: 'obligations', settings: Object.assign((win.state && win.state.settings) || {}, { remindTheirs: { on: theirsOn } }) });
  win.getUsers = () => roster; win.currentUser = () => roster[0];
  win.getContract = id => (id === c.id ? c : null);
  const plain = h => String(h).replace(/<[^>]+>/g, '');
  return { say: id => plain(win.obligationReminderSay(c.obligations.find(o => o.id === id), c)),
    line: id => plain(win.obligationReminderLine(c.obligations.find(o => o.id === id), c)), win };
}
describe('f1181 — who is written to about a duty owed to us', () => {
  test('(1) a colleague watching it is named, with the admins four days late', () => {
    const { say, win } = book(false);
    assert.match(say('t1'), /Wanjiku Kamau is reminded a week before/);
    assert.ok(say('t1').includes(win.i18t('ob_rem_theirs_off', { cp: 'Nordkust' })), 'their side is not written to: the company has it off');
    assert.doesNotMatch(say('t1'), /never reminds/);
  });
  test('(2) with the company and the duty both asking, their side is said as reminded', () => {
    const { say, line } = book(true);
    assert.match(say('t1'), /Nordkust is reminded by email a week before and on the day/);
    assert.match(line('t1'), /Nordkust|Wanjiku/);
  });
  test('(3) nobody watching and their side off: the admins the day after', () => {
    const { say, line, win } = book(false);
    assert.ok(say('t2').includes(win.i18t('ob_rem_admins_after')));
    assert.equal(line('t2'), win.i18t('ob_rem_l_theirs', { cp: 'Nordkust' }));
  });
});
