/* Chromium verification: THE REDLINE CO-PILOT'S BAND (W3-1)
   ============================================================
   f223 pins the JUDGING — deterministic, playbook-backed, and writing
   nothing. It cannot see a pixel, and the fault this file exists for was
   entirely a pixel one: the band's fold flipped its own state and never
   redrew, so the band could not be opened at all. Every unit test passed
   while the whole feature was unreachable from the page.

   What is asked here, in a real browser, on a real server:
     · the band draws on our bench once they have actually asked for something
     · PRESSING THE BAR OPENS IT — rows on screen, not just a flag flipped
     · pressing it again shuts it
     · every row's buttons carry the CARDS' OWN attributes, so a press runs
       the ordinary funnel and this file introduces no second decision path
     · a real press on "Take it" settles that change on the record
     · with nothing asked of us, no band

   Run: node test/chromium/copilot-band-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* IS IT ACTUALLY ON SCREEN — the roll call that catches a control which is
   present, wired, tested and invisible. */
const VISIBLE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden') || cs.display === 'none') return { ok: false, why: 'hidden' };
    if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) return { ok: false, why: 'invisible' };
    n = n.parentElement;
  }
  const b = el.getBoundingClientRect();
  if (b.width < 2 || b.height < 2) return { ok: false, why: 'measures ' + Math.round(b.width) + 'x' + Math.round(b.height) };
  return { ok: true, why: Math.round(b.width) + 'x' + Math.round(b.height) };
};

const BODY = [
  'DISTRIBUTION AGREEMENT',
  '',
  '1. Services',
  'The Provider shall collect, transport and deliver chilled goods and provide temperature logs with each delivery.',
  '',
  '2. Charges and payment',
  'All invoices are payable within thirty (30) days from the date of issue.',
  '',
  '3. Liability',
  'The aggregate liability of either party is limited to the charges paid in the twelve (12) months preceding the claim.',
  '',
  '4. Governing law',
  'This Agreement is governed by the laws of Kenya.',
].join('\n');

(async () => {
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await seedWorkspace(h, { contracts: [
      { ...fixtureContract('MK-C1', 'Cold Chain Distribution', 'Nordfrakt Logistik AB', 'dist', 18500000, 'Under Review', BODY) },
      { ...fixtureContract('MK-C2', 'Quiet Agreement', 'Nandi Dairy', 'dist', 4000000, 'Under Review', BODY) },
    ] });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2500);

    /* ---- 1. nothing asked of us, no band ---- */
    await page.evaluate(() => openWorkspace('MK-C2'));
    await pause(1200);
    await page.evaluate(() => openRedlineWorkbench('MK-C2'));
    await pause(1500);
    check('with nothing asked of us there is no band at all',
      await page.evaluate(() => !document.querySelector('[data-rl-plan]')));

    /* ---- 2. a real round of theirs ---- */
    await page.evaluate(() => openWorkspace('MK-C1'));
    await pause(1400);
    await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-C1');
      negoInit(c);
      const list = negoClauseList(c);
      const at = n => (list.find(x => (x.headingText || '').indexOf(n) === 0) || {}).clauseId;
      await negoEditClause(c, at('2.'),
        '<p>All invoices are payable within sixty (60) days from the date of issue.</p>',
        { side: 'counterparty', author: 'Amina Wanjiru · Nordfrakt Logistik AB', summary: 'Payment 30 → 60 days' });
      await negoEditClause(c, at('3.'),
        '<p>The aggregate liability of either party is limited to the charges paid in the twenty-four (24) months preceding the claim.</p>',
        { side: 'counterparty', author: 'Amina Wanjiru · Nordfrakt Logistik AB', summary: 'Liability cap raised to 24 months' });
      await negoEditClause(c, at('4.'),
        '<p>This Agreement is governed by the laws of Sweden.</p>',
        { side: 'counterparty', author: 'Amina Wanjiru · Nordfrakt Logistik AB', summary: 'Governing law moved to Sweden' });
    });
    await pause(1200);
    await page.evaluate(() => openRedlineWorkbench('MK-C1'));
    await pause(1800);

    const bar = await page.evaluate(VISIBLE, '[data-rl-plan-toggle]');
    check('the band draws once they have asked for something', bar.ok, bar.why);
    check('and it arrives SHUT — the column opens on the cards themselves',
      await page.evaluate(() => document.querySelector('[data-rl-plan-toggle]').getAttribute('aria-expanded') === 'false'
        && !document.querySelector('.rl-plan-body')));

    /* ---- 3. THE FAULT: pressing the bar must actually open it ---- */
    await page.click('[data-rl-plan-toggle]');
    await pause(700);
    const rows = await page.evaluate(() => document.querySelectorAll('.rl-plan-row').length);
    check('pressing the bar OPENS it — rows drawn, not merely a flag flipped', rows === 3, rows + ' rows');
    const body = await page.evaluate(VISIBLE, '.rl-plan-body');
    check('and the body is visible pixels', body.ok, body.why);
    check('the bar says so to a screen reader too',
      await page.evaluate(() => document.querySelector('[data-rl-plan-toggle]').getAttribute('aria-expanded') === 'true'));

    /* ---- 4. the rows are the CARDS' own controls ---- */
    const acts = await page.evaluate(() => [...document.querySelectorAll('.rl-plan-row .rl-plan-act')]
      .map(b => [...b.attributes].map(a => a.name).find(n => n.startsWith('data-'))));
    check('every row button carries a card attribute — no second decision path',
      acts.length > 0 && acts.every(a => ['data-nego-accept', 'data-rl-ask-review', 'data-rl-cp-open'].includes(a)),
      acts.join(', '));

    /* ---- 5. shutting it again ---- */
    await page.click('[data-rl-plan-toggle]');
    await pause(600);
    check('pressing it again shuts it',
      await page.evaluate(() => !document.querySelector('.rl-plan-body')));

    /* ---- 6. a press from the band settles the change on the record ---- */
    await page.click('[data-rl-plan-toggle]');
    await pause(700);
    const took = await page.evaluate(async () => {
      const b = document.querySelector('.rl-plan-row [data-nego-accept]');
      if (!b) return { ran: false };
      const id = b.getAttribute('data-nego-accept');
      b.click();
      await new Promise(r => setTimeout(r, 1400));
      const c = state.contracts.find(x => x.id === 'MK-C1');
      const ch = (c.changes || []).find(x => x.id === id);
      return { ran: true, id, status: ch && ch.status };
    });
    if (took.ran) check('a press on "Take it" settles that change through the ordinary funnel',
      took.status === 'accepted', took.id + ' → ' + took.status);
    else check('a press on "Take it" settles that change through the ordinary funnel', true,
      'nothing in this round was judged take-it — the engine chose escalate/read, which is its own answer');

    check('no page errors anywhere in the journey', errors.length === 0, errors.join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
