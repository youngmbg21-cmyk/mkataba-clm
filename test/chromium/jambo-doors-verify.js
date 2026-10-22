/* EVERY DOOR AS A TOOL — Jambo names the exact thing, HaTi lands on it
   (Jambo works like Copilot, stage 2; docs/PLAN-jambo-copilot.md)
   ============================================================
   The AI's goto.door, already checked on the server (aiDoorOf; f867), is run
   in a real browser through the one place an answer's goto is run
   (aiGotoRun → navDoorOf → navGo), and the app is read for where it stands
   with the navigation exam's own readers (test/nav-read.js). No AI is called:
   what is measured is that each door lands where it says, through the doors
   that already exist, pressing nothing.
   AT THE PARENT every check fails: there is no door to run.
   Run: node test/chromium/jambo-doors-verify.js */
/* global state, setView, pdOpenOnHome, closeModal, landOff, aiGotoRun, api */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld } = require('../nav-world');
const { navWhereSrc, judge } = require('../nav-read');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

(async () => {
  const h = await startHati();
  await seedNavWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  let pass = 0, fail = 0;
  const errors = [];
  try {
    const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await P.waitForFunction(() => !!(window.currentUser && currentUser() && state.contracts && state.contracts.length), null, { timeout: 20000 });
    const ids = await P.evaluate(async () => {
      const users = (await api('bootstrap')).users || [];
      const reqs = (await api('intake')).requests || [];
      return { grace: (users.find(u => /Grace/.test(u.name)) || {}).id, request: (reqs.find(r => /distributor/i.test(r.title)) || {}).id };
    });
    const where = () => P.evaluate(src => new Function('return (' + src + ')()')(), navWhereSrc.toString()).catch(e => ({ error: String(e.message || e) }));
    /* the screen stands still: two equal readings a beat apart, nothing landing (bounded) */
    const settle = async () => {
      let prev = '';
      for (let i = 0; i < 30; i++){
        const now = await P.evaluate(src => JSON.stringify([typeof navLanding === 'function' && navLanding(), new Function('return (' + src + ')()')()]), navWhereSrc.toString()).catch(() => '');
        if (now && now === prev && !JSON.parse(now)[0]) return;
        prev = now; await P.waitForTimeout(250);
      }
    };
    const check = async (name, door, spot) => {
      let why;
      try {
        await P.evaluate(() => { try { closeModal(); } catch (_){} try { landOff(); } catch (_){} setView('dashboard'); pdOpenOnHome('MK-Z9', 'copilot'); });
        await settle();
        const before = await where();
        const ran = await P.evaluate(d => aiGotoRun({ task: '', door: d }, ''), door);
        await settle();
        const W = await where();
        why = ran ? judge(spot, W, before) : ['aiGotoRun did not run the door'];
        if (why.length) why.push('at ' + JSON.stringify(W).slice(0, 300));
      } catch (e){ why = ['threw: ' + String(e && e.message || e).split('\n')[0]]; }
      if (why.length){ fail++; console.log('FAIL  ' + name + ' — ' + why.join('; ')); } else { pass++; console.log('ok    ' + name); }
    };

    await check('1 a clause by its number', { kind: 'clause', contractId: 'MK-A1', num: '7' }, { page: 'paper', cid: 'MK-A1', clause: '7' });
    await check('2 a clause by the passage search_hati found', { kind: 'clause', contractId: 'MK-A1', quote: '6. Quality and rejection Sugar that does not meet the agreed specification' }, { page: 'paper', cid: 'MK-A1', clause: '6' });
    await check('3 a contract number written as the paper prints it', { kind: 'clause', contractId: 'mk-a1', num: '3' }, { page: 'paper', cid: 'MK-A1', clause: '3' });
    await check('4 a contract\'s obligations', { kind: 'contract', contractId: 'MK-C1', tab: 'oblig' }, { page: 'paper', cid: 'MK-C1', pane: 'oblig' });
    await check('5 a contract\'s history', { kind: 'contract', contractId: 'MK-B1', tab: 'hist' }, { page: 'paper', cid: 'MK-B1', pane: 'hist' });
    await check('6 what is owed (Fill in)', { kind: 'contract', contractId: 'MK-C2', tab: 'fill' }, { page: 'paper', cid: 'MK-C2', pane: 'fill' });
    await check('7 Before you sign (nothing signed)', { kind: 'contract', contractId: 'MK-A2', tab: 'sign' }, { page: 'paper', cid: 'MK-A2', pane: 'sign' });
    await check('8 the redlines', { kind: 'contract', contractId: 'MK-B2', tab: 'redlines' }, { page: 'paper', cid: 'MK-B2', pane: 'redlines' });
    await check('9 the brief', { kind: 'contract', contractId: 'MK-A1', tab: 'brief' }, { page: 'paper', cid: 'MK-A1', pane: 'brief' });
    await check('10 the letter (nothing sent)', { kind: 'contract', contractId: 'MK-C2', tab: 'send' }, { page: 'paper', cid: 'MK-C2', pane: 'send' });
    await check('11 compare with the original', { kind: 'contract', contractId: 'MK-A1', tab: 'compare' }, { page: 'paper', cid: 'MK-A1', pane: 'compare' });
    await check('12 Contracts, narrowed', { kind: 'contracts', stage: 'Signed', stream: 'proc' }, { page: 'contracts', filters: { stage: 'signed', stream: 'proc' } });
    await check('13 a party\'s folder', { kind: 'party', name: 'Juno Logistics' }, { page: 'parties', party: 'juno logistics' });
    await check('14 my own setting', { kind: 'you', key: 'lang' }, { page: 'settings', settings: { tab: 'you', row: 'lang' } });
    await check('15 a company setting', { kind: 'company', key: 'approvals' }, { page: 'settings', settings: { tab: 'company', page: 'approvals' } });
    await check('16 a person\'s signing limit', { kind: 'person', userId: ids.grace, row: 'cap' }, { page: 'settings', settings: { tab: 'company', person: 'Grace Wanjiru', row: 'signcap' } });
    await check('17 a standards book and row', { kind: 'standard', book: 'nda', row: 'liability' }, { page: 'standards', item: 'nda', row: 'liabilityMonths' });
    await check('18 one duty', { kind: 'obligation', contractId: 'MK-C1', obligationId: 'ob-count' }, { page: 'obligations', item: 'ob-count' });
    await check('19 this week\'s duties', { kind: 'duties', due: '7' }, { page: 'obligations', filters: { window: 'week' } });
    await check('20 a request', { kind: 'request', requestId: ids.request }, { page: 'requests', item: 'NDA for a new distributor' });
    /* a contract this browser does not hold is no door: nothing moves, and the task (none here) is the fallback */
    {
      const ran = await P.evaluate(() => aiGotoRun({ task: '', door: { kind: 'contract', contractId: 'MK-NOPE' } }, ''));
      if (ran) { fail++; console.log('FAIL  21 an unknown contract is no door — it ran'); } else { pass++; console.log('ok    21 an unknown contract is no door'); }
    }
  } finally {
    if (errors.length) { console.log('PAGE ERRORS  ' + [...new Set(errors)].slice(0, 5).join(' · ')); }
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
