/* f584 — FILLING IN THE BLANKS DOES NOT LAPSE AN APPROVAL (B6, 8 Oct 2026).
   ============================================================
   The 9 Oct review: the Signing tab asks for its blanks to be filled, and
   filling them lapsed the approval that had just been given — the stamp
   hashed every field. A filled blank is not a change (the rule the outside
   route keeps, ohBlankHits); a term filled in at approval that moves, the
   value, the wording and the parties still are. Asked of all three stamps:
     (1) a rule step's, in the browser (approvalStamp / approvalDrift);
     (2) the same, at the wall (srvApprovalStamp / srvApprovalStampMoved);
     (3) a named person's yes, both hosts (js/signapproval.js saStamp/saDrift);
   and a stamp made before (v1) is compared exactly as it always was.
   Run: node --test test/f584-a-filled-blank-keeps-the-approval.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const AP = fs.readFileSync(path.join(__dirname, '..', 'js', 'approvals.js'), 'utf8');
const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const SA = require('../js/signapproval.js');

const lift = (src, name) => (new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`).exec(src) || [''])[0];
const browser = new Function('fmtMoneyShort', lift(AP, 'approvalStamp') + '\n' + lift(AP, '_apHash') + '\n' + lift(AP, '_apLegacyDoc') + '\n'
  + lift(AP, 'approvalDrift') + '\nreturn { approvalStamp, approvalDrift };')(v => String(v));
const srvHashLine = /const srvApHash = [^\n]*\n/.exec(SRV)[0];
const server = new Function(srvHashLine + lift(SRV, 'srvApprovalStamp') + '\n' + lift(SRV, 'srvApprovalStampMoved') + '\nreturn { srvApprovalStamp, srvApprovalStampMoved };')();

const base = () => ({ id: 'MK-1', value: 6000000, party: 'Highland', counterparty: 'Juno Limited', redlineText: 'Words.',
  fields: { effDate: '2026-10-01', paymentDays: '', noticeDays: '' } });

describe('f584 (1)(2) a rule step — browser and wall agree', () => {
  const cases = [
    ['a blank filled in afterwards', c => { c.fields.paymentDays = '30'; }, false],
    ['two blanks filled in afterwards', c => { c.fields.paymentDays = '30'; c.fields.noticeDays = '60'; }, false],
    ['a term filled at approval that moved', c => { c.fields.effDate = '2026-11-01'; }, true],
    ['a term filled at approval that was emptied', c => { c.fields.effDate = ''; }, true],
    ['the value', c => { c.value = 60000000; }, true],
    ['the wording', c => { c.redlineText = 'Other words.'; }, true],
    ['the parties', c => { c.counterparty = 'Someone Else AB'; }, true],
  ];
  for (const [name, move, lapses] of cases) test(`${name}: ${lapses ? 'lapses' : 'does not lapse'}`, () => {
    const c = base(); const step = { stamp: browser.approvalStamp(c) }; const sStamp = server.srvApprovalStamp(c);
    move(c);
    assert.equal(browser.approvalDrift(step, c).length > 0, lapses, 'browser');
    assert.equal(server.srvApprovalStampMoved(sStamp, server.srvApprovalStamp(c)), lapses, 'server');
    assert.equal(server.srvApprovalStampMoved(step.stamp, server.srvApprovalStamp(c)), lapses, 'a stamp the browser wrote, read at the wall');
  });
  test('a v1 stamp is compared as it always was — nothing given before lapses on deploy, a change still does', () => {
    const c = base();
    const legacy = (() => { const doc = String(c.redlineText) + '\u0000' + JSON.stringify(c.fields) + '\u0000';
      let h = 0; for (let i = 0; i < doc.length; i++) h = (h * 31 + doc.charCodeAt(i)) >>> 0; return { value: c.value, doc: h.toString(16) }; })();
    assert.equal(browser.approvalDrift({ stamp: legacy }, c).length, 0);
    assert.equal(server.srvApprovalStampMoved(legacy, server.srvApprovalStamp(c)), false);
    c.redlineText = 'Other words.';
    assert.ok(browser.approvalDrift({ stamp: legacy }, c).length);
    assert.equal(server.srvApprovalStampMoved(legacy, server.srvApprovalStamp(c)), true);
  });
});

describe('f584 (3) a named person\'s yes', () => {
  test('a blank filled in afterwards is not a change; a filled term that moved is', () => {
    const c = base(); const stamp = SA.saStamp(c);
    c.fields.paymentDays = '30';
    assert.deepEqual(SA.saDrift(stamp, c), []);
    c.fields.effDate = '2026-12-01';
    assert.ok(SA.saDrift(stamp, c).includes('dates') || SA.saDrift(stamp, c).includes('wording'));
    const c2 = base(); const s2 = SA.saStamp(c2); c2.fields.noticeDays = '60'; c2.redlineText = 'Other words.';
    assert.ok(SA.saDrift(s2, c2).includes('wording'));
  });
  test('a v1 stamp still compares the old way', () => {
    const c = base(); const v2 = SA.saStamp(c);
    const v1 = { ...v2, v: 1 };
    delete v1.fields;
    v1.wording = SA.saHash(SA.saText(c.redlineText) + '\u0000' + Object.keys(c.fields).sort().map(k => `${k}=${SA.saText(c.fields[k])}`).join('\u0001')
      + '\u0000' + '' + '\u0000' + '');
    assert.deepEqual(SA.saDrift(v1, c), [], 'unchanged reads unchanged');
    c.fields.paymentDays = '30';
    assert.deepEqual(SA.saDrift(v1, c), ['wording'], 'and under v1 a fill still read as a change — as before');
  });
});
