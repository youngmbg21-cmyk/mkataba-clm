/* Chromium verification: FOUR FIXES OFF ONE LONG CONTRACT (Young, 23 Sep 2026)
   ============================================================
   f367 proves the readings; this file proves what the owner SEES:

     1  a record already carrying the broken reading — the model's call syntax
        inside payment terms and governing law — prints clean on the deal card:
        no markup, governing law "Denmark", the disputes answer in Disputes
     3  on a 150-clause contract the X-ray map scrolls, every block is at least
        16px tall, pressing one lands on its clause, and the map follows the
        paper as it scrolls
     N  Draft new agreement opens two doors; the Contracts page carries no
        separate Upload button; the Upload door opens the upload dialog and the
        Draft door the drafting screen

   Every driven half is GUARDED so a build without it reports, never hangs.
   Run: node test/chromium/long-contract-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'long-contract');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BROKEN = {
  contractType: 'Software as a Service Agreement', category: 'supplier', currency: 'USD', value: 9000000,
  paymentTerms: 'Terms not specified in available text</paymentTerms><parameter name="value">0',
  governingLaw: 'Denmark</governingLaw><parameter name="disputes">The Danish Institute of Arbitration in accordance with its rules of arbitration, 3 arbitrators, Copenhagen, English language',
  disputes: '', noticePeriodDays: 30, liabilityCapped: 'capped', assignment: 'prohibited',
  confidentiality: 'Perpetual for confidential information',
};
const longBody = n => '<h1>SOFTWARE AS A SERVICE AGREEMENT</h1>' + Array.from({ length: n }, (_, k) =>
  `<p>${k + 1}.1\t<strong>Clause ${k + 1}.</strong> The Supplier shall perform the Services described in this clause with reasonable skill and care, in accordance with good industry practice and the Service Order agreed between the parties.</p>`).join('');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  const base = { counterparty: 'nShift Group A/S', party: 'Highland Corporate Ltd', folder: 'proc',
    status: 'Under Review', fields: {}, comments: [], rounds: [], versions: [], signatures: [],
    compliance: {}, audit: [], obligations: [] };
  await W.admin.json('/api/contracts/MK-LC1', { method: 'PUT', body: { baseVersion: 0, contract: {
    ...base, id: 'MK-LC1', name: 'SaaS agreement', value: 9000000, metadata: BROKEN,
    format: 'rich', redlineText: longBody(3) } } });
  await W.admin.json('/api/contracts/MK-LC2', { method: 'PUT', body: { baseVersion: 0, contract: {
    ...base, id: 'MK-LC2', name: 'Long SaaS agreement', format: 'rich', redlineText: longBody(150) } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ===== 1. THE BROKEN RECORD PRINTS CLEAN ===== */
    await page.evaluate(() => openWorkspace('MK-LC1'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-LC1'), 'terms'));
    await page.waitForTimeout(1400);
    const deal = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('.sec-fields .sec-f')].map(f => ({
        l: ((f.querySelector('.sec-f-l') || {}).textContent || '').trim().toLowerCase(),
        v: ((f.querySelector('.sec-f-v') || {}).textContent || '').replace(/\s+/g, ' ').trim() }));
      const get = l => (cells.find(c => c.l.startsWith(l)) || {}).v;
      return { markup: cells.filter(c => /<\/?[A-Za-z]|parameter name/.test(c.v)).map(c => c.l),
        law: get('governing law'), disputes: get('disputes'), pay: get('payment terms') };
    });
    check('1a no field on the deal card carries the reading\'s markup', deal.markup.length === 0, JSON.stringify(deal.markup));
    check('1b governing law reads "Denmark"', deal.law === 'Denmark', deal.law);
    check('1c the disputes answer is in Disputes', /^The Danish Institute of Arbitration/.test(deal.disputes || ''), deal.disputes);
    check('1d payment terms the contract does not state prints as a dash', /^[—-]$/.test(deal.pay || ''), deal.pay);
    await page.screenshot({ path: path.join(OUT, '01-deal.png') });

    /* ===== 3. THE MAP SCROLLS ===== */
    await page.evaluate(() => openWorkspace('MK-LC2'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-LC2'), 'docs'));
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.evaluate(() => { if (typeof docViewSet === 'function') docViewSet('xray');
      if (typeof applyWsTabs === 'function') applyWsTabs(getContract('MK-LC2')); });
    await page.waitForTimeout(1500);
    const map = await page.evaluate(() => {
      const sp = document.getElementById('doc-xr-spine');
      if (!sp) return null;
      const segs = [...sp.querySelectorAll('.doc-xr-seg')];
      return { n: segs.length, minH: Math.min(...segs.map(s => s.getBoundingClientRect().height)),
        scrolls: sp.scrollHeight > sp.clientHeight + 4,
        here: (sp.querySelector('.is-here') || {}).dataset ? sp.querySelector('.is-here').dataset.xrSeg : null };
    });
    check('3a the map is drawn for every clause', !!map && map.n >= 150, map ? map.n + ' blocks' : 'no map');
    check('3b every block is at least 16px tall', !!map && map.minH >= 15.5, map ? map.minH + 'px' : '—');
    check('3c the map scrolls on its own', !!map && map.scrolls, map ? String(map.scrolls) : '—');
    const follow = await page.evaluate(async () => {
      const sc = document.getElementById('doc-scroll'), sp = document.getElementById('doc-xr-spine');
      if (!sc || !sp) return null;
      const before = sp.scrollTop;
      sc.scrollTop = sc.scrollHeight * 0.7;
      await new Promise(z => setTimeout(z, 400));
      const here = sp.querySelector('.doc-xr-seg.is-here');
      return { before, after: sp.scrollTop, here: here ? Number(here.dataset.xrSeg) : -1 };
    });
    check('3d scrolling the paper moves the map with it', !!follow && follow.after > follow.before && follow.here > 50,
      follow ? `map ${follow.before} → ${follow.after}, here at clause ${follow.here}` : '—');
    const press = await page.evaluate(async () => {
      const sp = document.getElementById('doc-xr-spine');
      const seg = sp && sp.querySelector('.doc-xr-seg.is-here');
      if (!seg) return null;
      const want = Number(seg.dataset.xrSeg);
      seg.click();
      await new Promise(z => setTimeout(z, 700));
      const h4 = document.querySelector('#doc-xray .doc-xr-head h4');
      return { want, head: h4 ? h4.textContent.trim() : '' };
    });
    check('3e pressing a block lands the panel on its clause',
      !!press && new RegExp('Clause ' + (press.want) + '\\.').test(press.head), press ? press.head : '—');
    await page.screenshot({ path: path.join(OUT, '03-map.png') });
    await page.evaluate(() => { if (typeof docViewSet === 'function') docViewSet('paper'); });

    /* ===== N. TWO DOORS ===== */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1200);
    const upBtn = await page.evaluate(() => !!document.querySelector('[data-page-upload]'));
    check('Na the Contracts page carries no separate Upload button', !upBtn, upBtn ? 'still drawn' : 'gone');
    await page.click('[data-page-new]').catch(() => {});
    await page.waitForTimeout(700);
    const doors = await page.evaluate(() => [...document.querySelectorAll('[data-nd-door]')].map(b => b.getAttribute('data-nd-door')));
    check('Nb Draft new agreement opens two doors', doors.includes('draft') && doors.includes('upload'), JSON.stringify(doors));
    await page.screenshot({ path: path.join(OUT, '04-doors.png') });
    await page.click('[data-nd-door="upload"]').catch(() => {});
    await page.waitForTimeout(800);
    const up = await page.evaluate(() => !!document.getElementById('up-file'));
    check('Nc the Upload door opens the upload dialog', up, up ? 'upload dialog' : 'absent');
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForTimeout(400);
    await page.click('[data-page-new]').catch(() => {});
    await page.waitForTimeout(700);
    await page.click('[data-nd-door="draft"]').catch(() => {});
    await page.waitForTimeout(900);
    const na = await page.evaluate(() => !!document.getElementById('na-root'));
    check('Nd the Draft door opens the drafting screen', na, na ? 'drafting screen' : 'absent');

    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop?.();
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
