/* ============================================================
   A DOOR LOOKS LIKE A DOOR, AND CANCEL UNDOES (owner, 13 Oct 2026)
   ============================================================
   "add a cancel button to image 1 and make the deal, region, clause and
   words buttons to click on since it is simply not clear that you have doors
   to those tabs ... you should have a button directing you to click on the
   respective clauses otherwise you would not know that it is a door to the
   clause." Cancel: the owner picked "Undo and close".

   A  Complete the details: Cancel is the last button in the foot; it puts
      back what the boxes held when the page opened and closes the page;
      "Save and finish later" still keeps what was typed.
   B  Home's Breakdown panel: the four steps are buttons (Deal pressed on
      arrival — the landing is unchanged, owner's word); Region opens the
      first region on the left; a step with nothing behind it greys and says
      why; every clause row, connected region and region in the list wears an
      Open sign, and the row still opens it.

     node test/chromium/doors-look-like-doors-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'doors-look-like-doors');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, arg, ms = 8000) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const deal = (id, name) => ({ id, contractNo: id, name, counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  body: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(6) + '</p><h2>2. Payment</h2><p>'
    + 'Invoices are paid within thirty days of receipt. '.repeat(6) + '</p>' });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [deal('MK-B1', 'Haulage One')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => typeof getContract === 'function' && !!getContract('MK-B1'), null, 15000);

    /* ===== A. COMPLETE THE DETAILS: CANCEL ===== */
    await page.evaluate(() => { setView('register'); openNewAgreement({ pick: { kind: 'tid', id: 'RM' } }); });
    await waitFor(page, () => !!document.getElementById('wz-counterparty'));
    await page.fill('#wz-counterparty', 'Original Ltd');
    await page.click('#na-create');
    const cd = await waitFor(page, () => !!document.getElementById('cd-page'), null, 10000);
    const foot = cd ? await page.evaluate(() => [...document.querySelectorAll('#cd-page .cd-foot button')].map(b => b.id)) : [];
    check('A1 Complete the details has a Cancel, the last button in its foot', foot[foot.length - 1] === 'cd-cancel', JSON.stringify(foot));
    const id = await page.evaluate(() => state.activeId);
    const cp = '#cd-page [data-cd-key="counterparty"] input', val = '#cd-page [data-cd-key="value"] input';
    if (cd) {
      await page.fill(cp, 'Changed AB'); await page.press(cp, 'Tab');
      await page.fill(val, '5000'); await page.press(val, 'Tab');
      await pause(300);
      const typed = await page.evaluate(i => { const c = getContract(i); return { cp: c.counterparty, v: Number(c.value) }; }, id);
      await page.screenshot({ path: path.join(OUT, '01-complete-typed.png') });
      await page.click('#cd-cancel');
      await waitFor(page, () => !document.getElementById('cd-page'));
      await pause(300);
      const after = await page.evaluate(i => { const c = getContract(i); return { cp: c.counterparty, v: Number(c.value) || 0, open: !!document.getElementById('cd-page') }; }, id);
      check('A2 Cancel puts back what the boxes held and closes the page',
        typed.cp === 'Changed AB' && typed.v === 5000 && after.cp === 'Original Ltd' && after.v === 0 && !after.open,
        `typed ${JSON.stringify(typed)} → after ${JSON.stringify(after)}`);
      await page.evaluate(i => openCompleteDetails(getContract(i)), id);
      await waitFor(page, () => !!document.getElementById('cd-page'));
      await page.fill(val, '7000'); await page.press(val, 'Tab'); await pause(200);
      await page.click('#cd-later'); await pause(300);
      const kept = await page.evaluate(i => Number(getContract(i).value) || 0, id);
      check('A3 "Save and finish later" still keeps what was typed', kept === 7000, `value ${kept}`);
    }

    /* ===== B. THE BREAKDOWN PANEL ===== */
    await page.evaluate(() => {
      const c = getContract('MK-B1');
      c.breakdown = { ok: true, hash: String(triageWordingHash(c) || ''), at: new Date().toISOString(), head: 'Fix one', sub: 'Start with payment.',
        links: [{ a: 1, b: 2, why: 'The term limits how long you pay' }], dropped: 0, truncated: false,
        regions: [
          { name: 'Term', clauses: '1', status: 'fine', kind: 'protect', headline: 'Two years', items: [{ ref: '1', title: 'Term', status: 'fine', note: 'Runs two years' }], quotes: [] },
          { name: 'Payment', clauses: '2', status: 'need', kind: 'pay', headline: 'You pay in thirty days',
            items: [{ ref: '2', title: 'Payment', status: 'need', note: 'Thirty days' }, { ref: '2.1', title: 'Late fees', status: 'look', note: 'None stated' }],
            quotes: [{ text: 'Invoices are paid within thirty days of receipt.', source: 'Clause 2', mark: ['thirty days'] }] }] };
      setView('dashboard'); hbSetFace('breakdown');
    });
    await waitFor(page, () => !!document.querySelector('#hb-bd [data-bd-pick="MK-B1"]'));
    await page.click('#hb-bd [data-bd-pick="MK-B1"]');
    const up = await waitFor(page, () => !!document.querySelector('.bd-lens .bd-lvls'));
    const S = () => [...document.querySelectorAll('.bd-lens .bd-lvls > *')].map(b => ({ tag: b.tagName, k: b.getAttribute('data-bd-step'),
      sel: b.getAttribute('aria-selected'), off: !!b.disabled, why: b.title || '' }));
    let st = up ? await page.evaluate(S) : [];
    await page.screenshot({ path: path.join(OUT, '02-breakdown-deal.png') });
    check('B1 the four steps are buttons, Deal pressed on arrival (the landing is unchanged)',
      st.length === 4 && st.every(x => x.tag === 'BUTTON') && st[0].sel === 'true' && st.slice(1).every(x => !x.off), JSON.stringify(st));
    const dealOpen = await page.evaluate(() => [...document.querySelectorAll('.bd-lens .bd-slist button')].map(b => !!b.querySelector('.bd-open')));
    check('B2 every region in the whole-deal list wears an Open sign', dealOpen.length === 2 && dealOpen.every(Boolean), JSON.stringify(dealOpen));

    await page.click('.bd-lens [data-bd-step="region"]'); await pause(200);
    const reg = await page.evaluate(() => ({ kick: (document.querySelector('.bd-lens .bd-kick') || {}).textContent || '',
      sel: (document.querySelector('.bd-lens [aria-selected="true"]') || {}).getAttribute?.('data-bd-step'),
      rows: [...document.querySelectorAll('.bd-lens .bd-cls button')].map(b => ((b.querySelector('.bd-open') || {}).textContent || '').trim()),
      links: [...document.querySelectorAll('.bd-lens .bd-links button')].map(b => ((b.querySelector('.bd-open') || {}).textContent || '').trim()),
      leftFirst: ((document.querySelector('#hb-bd .bd-table tbody tr td b') || {}).textContent || '') }));
    await page.screenshot({ path: path.join(OUT, '03-breakdown-region.png') });
    check('B3 Region opens the first region on the left, and its step is pressed',
      reg.sel === 'region' && /Region 2/.test(reg.kick) && /Payment/.test(reg.leftFirst), JSON.stringify(reg));
    check('B4 every clause row says "Open clause", every connected region "Open region"',
      reg.rows.length === 2 && reg.rows.every(x => x === 'Open clause') && reg.links.length === 1 && reg.links[0] === 'Open region', JSON.stringify(reg));

    await page.click('.bd-lens .bd-cls button:nth-child(2)'); await pause(200);
    const cl = await page.evaluate(() => ({ sel: (document.querySelector('.bd-lens [aria-selected="true"]') || {}).getAttribute?.('data-bd-step'),
      h: (document.querySelector('.bd-lens-body h2') || {}).textContent || '' }));
    check('B5 a clause row still opens its clause', cl.sel === 'clause' && cl.h === 'Late fees', JSON.stringify(cl));
    await page.click('.bd-lens [data-bd-step="words"]'); await pause(200);
    const wd = await page.evaluate(() => ({ sel: (document.querySelector('.bd-lens [aria-selected="true"]') || {}).getAttribute?.('data-bd-step'),
      quote: !!document.querySelector('.bd-lens .bd-words mark') }));
    check('B6 the Words step opens the region\'s wording', wd.sel === 'words' && wd.quote, JSON.stringify(wd));

    /* a region with no wording: Words greys and says why */
    await page.click('.bd-lens [data-bd-step="deal"]'); await pause(150);
    await page.click('.bd-lens .bd-slist button:nth-child(2)'); await pause(200);
    st = await page.evaluate(S);
    const w = st.find(x => x.k === 'words') || {};
    check('B7 a step with nothing behind it greys and says why', w.off === true && /no wording/i.test(w.why), JSON.stringify(w));

    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
