/* f243 — THE PHONE'S SIGNER PICKER, AND THE ONE AUTHORITY BEHIND IT.
 *
 * THE FAULT IT CLOSES. wsNextAction returns kind:'add-signers' whenever the
 * signing route is not open, and that is right — naming the signers is what
 * OPENS signing (11 Aug 2026), so on a contract with no route it genuinely is
 * the next thing to do. The phone draws that answer as its green primary and
 * mDoNextAction had no branch for it: no sheet, no toast, no navigation. A
 * filled primary button, the loudest control on the screen, doing absolutely
 * nothing — the worst shape a dead press can take, because the reader has just
 * been told this is the one thing left.
 *
 * IT REVERSES THE PHONE'S STANDING RULE, and that is the owner's decision
 * recorded in the work order rather than a drift. "The phone files no changes
 * of its own" has held since the mobile shell was built. What makes it
 * survivable is that it files this one through THE DESKTOP'S OWN AUTHORITY:
 * saveSignerPlan, lifted out of the editor's Save handler and now asked by
 * both. The row shape, the refusal, the audit line and the persist are one
 * piece of code with two editors; the phone decides only how a refusal is
 * SAID, because a toast is right on a laptop and a sheet's own error line is
 * right on a phone.
 *
 * THE HALF OF THE RULE THAT REALLY MATTERED IS UNTOUCHED and is asserted
 * below: the phone still files no NEGOTIATION changes.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world.js');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe('f243 · one authority, two editors', () => {
  test('saveSignerPlan exists, is published, and is where the rule lives', () => {
    const ap = read('js/approvals.js');
    assert.match(ap, /function saveSignerPlan\(c, rows\)/);
    assert.match(ap, /openSignerPlanEditor,saveSignerPlan,/, 'published for the phone to reach');
    /* Everything a route MEANS is in there: the row shape, the refusal that
       names the missing side, the audit line and the persist. */
    assert.match(ap, /order:out\.length\+1/);
    assert.match(ap, /ap_need_both_sides/);
    assert.match(ap, /logAudit\(c,'Signing route'/);
    assert.match(ap, /persist\(c\);\s*\n\s*return null;/);
  });

  test('the desktop editor asks it rather than keeping its own copy', () => {
    const ap = read('js/approvals.js');
    const at = ap.indexOf("getElementById('sp-save')");
    const block = ap.slice(at, at + 500);
    assert.match(block, /saveSignerPlan\(c, plan\)/);
    /* The arithmetic must not survive beside the call — two copies of "what a
       route is" is exactly what this extraction exists to prevent. */
    assert.ok(!/const ourN=out\.filter/.test(block), 'no second copy of the tally');
    assert.ok(!/out\.push\(\{ id:s\.id\|\|'sg_'/.test(block), 'no second copy of the row shape');
  });

  test('and the phone asks the same one, guarded', () => {
    const mc = read('js/mobile-contract.js');
    assert.match(mc, /saveSignerPlan\(c, \[st\.ours, st\.theirs\]\)/);
    /* Read through window, because js/approvals.js is a separate module and a
       bare cross-module read throws — the always-false-guard family in its
       safe direction. */
    assert.match(mc, /typeof window\.saveSignerPlan !== 'function'/);
    /* The phone builds NO row shape of its own. */
    assert.ok(!/\border:\s*out\.length|\bid:s\.id\|\|'sg_'/.test(mc),
      'the phone mints neither an order nor a row id — the shared saver does');
    assert.ok(!/ap_need_both_sides|ap_need_our_side/.test(mc), 'and repeats no refusal');
  });
});

describe('f243 · the dead press is answered', () => {
  test("mDoNextAction has a branch for the kind wsNextAction really returns", () => {
    const ct = read('js/views/contract.js');
    assert.match(ct, /kind:'add-signers'/, "wsNextAction still emits it");
    const mc = read('js/mobile-contract.js');
    assert.match(mc, /kind==='add-signers'\)\{ mOpenSheet\('signers'/,
      'and the phone answers it');
  });

  test('the sheet is registered, or it would open onto nothing', () => {
    /* mSheetHtml returns '' for an unknown key, so a branch in mDoNextAction
       with no entry here is a press that opens an empty layer — a dead press
       one step further along. */
    assert.match(read('js/mobile.js'), /s\.sheet==='signers'\)\s*inner = mSignersSheetHtml\(\)/);
    assert.match(read('js/mobile.js'), /k==='signers-save'/, 'and its Save is dispatched');
  });
});

describe('f243 · the rule the two editors share', () => {
  /* buildWorld deliberately loads neither js/approvals.js nor the mobile
     files, so saveSignerPlan is exercised in a VM of its own — it is a pure
     function of a contract and two rows, which is exactly what makes that
     honest. WHAT THE SHEET DRAWS, and the whole journey through it, is proved
     in signers-on-a-phone-verify: the phone shell only exists in a browser. */
  const vm = require('node:vm');
  const load = () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/approvals.js'), 'utf8');
    const audit = [];
    const ctx = { window: {}, document: { getElementById: () => null,
        querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style:{} }) },
      console, i18t: (k, v) => k + (v && v.them ? ':' + v.them : ''), esc: x => x,
      logAudit: (c, action, detail) => audit.push({ action, detail }),
      persist: () => {}, toast: () => {}, currentUser: () => null, getUsers: () => [],
      state: { contracts: [], settings: {} } };
    vm.createContext(ctx);
    try { vm.runInContext(src, ctx); } catch (e) { /* the file wires more than it needs */ }
    const fn = ctx.saveSignerPlan || (ctx.window && ctx.window.saveSignerPlan);
    assert.equal(typeof fn, 'function', 'saveSignerPlan loads');
    return { fn, audit };
  };

  test('two named sides file a route, numbered in order', () => {
    const { fn, audit } = load();
    const c = { id: 'MK-1', counterparty: 'Nordkust Industri AB' };
    const why = fn(c, [
      { party: 'internal', name: 'Amina Otieno', email: 'a@x.co', role: 'CEO' },
      { party: 'counterparty', name: 'Ola Berg', email: 'ola@y.se', role: '' }]);
    assert.equal(why, null, 'it saved');
    assert.equal(c.signerPlan.length, 2);
    assert.equal(c.signerPlan[0].order, 1);
    assert.equal(c.signerPlan[1].order, 2);
    assert.ok(c.signerPlan[0].id, 'an id is minted');
    assert.ok(audit.some(e => /Signing route/.test(e.action)), 'and the audit line written');
  });

  test('one side alone is refused, and the refusal NAMES the missing side', () => {
    const { fn } = load();
    const c = { id: 'MK-1', counterparty: 'Nordkust Industri AB' };
    const why = fn(c, [{ party: 'internal', name: 'Amina Otieno', email: 'a@x.co' }]);
    assert.ok(why, 'refused');
    assert.match(why, /need_their_side/, 'by naming which side is missing');
    assert.equal(c.signerPlan, undefined, 'and nothing was filed');
  });

  test('a blank row is dropped rather than counted', () => {
    /* The tally is a reading of what is about to be SAVED, not of the form:
       a row whose name was deleted counts in neither place. */
    const { fn } = load();
    const c = { id: 'MK-1', counterparty: 'X' };
    const why = fn(c, [
      { party: 'internal', name: 'Amina', email: 'a@x.co' },
      { party: 'counterparty', name: '', email: '' }]);
    assert.match(String(why), /need_their_side/);
  });

  test('a prior row\'s signature facts are carried, never re-minted', () => {
    /* THE REASON THE PHONE SENDS IDS BACK. Without them a re-save would hand
       back fresh rows and a signature already given would vanish from the
       route it was given to. */
    const { fn } = load();
    const c = { id: 'MK-1', counterparty: 'X', signerPlan: [
      { id: 'sg_a', party: 'internal', name: 'Amina', email: 'a@x.co', order: 1,
        signed: true, at: '2026-08-01', by: 'Amina', signature: { form: 'typed' } },
      { id: 'sg_b', party: 'counterparty', name: 'Ola', email: 'o@y.se', order: 2 }] };
    fn(c, [
      { id: 'sg_a', party: 'internal', name: 'Amina', email: 'a@x.co', role: 'CEO' },
      { id: 'sg_b', party: 'counterparty', name: 'Ola', email: 'o@y.se', role: '' }]);
    assert.equal(c.signerPlan[0].signed, true);
    assert.equal(c.signerPlan[0].at, '2026-08-01');
    assert.deepEqual(c.signerPlan[0].signature, { form: 'typed' });
    assert.equal(c.signerPlan[0].role, 'CEO', 'and the edit still lands');
  });

  test('a counterparty row never carries a memberId', () => {
    /* An internal signer signs on a session and a memberId is what binds the
       signature to the account; a counterparty has no account at all. */
    const { fn } = load();
    const c = { id: 'MK-1', counterparty: 'X' };
    fn(c, [
      { party: 'internal', name: 'A', email: 'a@x.co', memberId: 'u_1' },
      { party: 'counterparty', name: 'B', email: 'b@y.se', memberId: 'u_2' }]);
    assert.equal(c.signerPlan[0].memberId, 'u_1');
    assert.equal(c.signerPlan[1].memberId, '');
  });
});

describe('f243 · the half of the phone rule that still holds', () => {
  test('the phone files no NEGOTIATION changes of its own', () => {
    /* This is what "the phone files no changes" was really protecting: wording.
       A signing route is a different kind of fact and the owner ruled on it. */
    const src = read('js/mobile.js') + read('js/mobile-contract.js')
      + read('js/mobile-screens.js') + read('js/mobile-copilot.js');
    assert.ok(!/negoFileChange\(|changes\.push\(/.test(src));
  });

  test('and it grows no second signing rule', () => {
    const mc = read('js/mobile-contract.js');
    /* signingLocked is ASKED, never reimplemented. */
    assert.match(mc, /signingLocked\(c\)/);
    assert.ok(!/function signingLocked/.test(mc));
    assert.ok(!/signingRestart/.test(mc), 'restarting a route stays a computer act');
  });
});
