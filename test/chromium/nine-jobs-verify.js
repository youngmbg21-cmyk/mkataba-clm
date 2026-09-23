/* Chromium verification: NINE JOBS OFF ONE LIST (Young, 23 Sep 2026)
   ============================================================
   f369 proves the readings; this file proves what the owner SEES, with a real
   pointer where a pointer is what the report was about:

     1  the Add a party role list scrolls under the wheel and stays open
     2  our party row prints an email; the party form has no town box
     3  "Who else" lists the colleague who filed a change and the one who
        approved, each marked as added by HaTi
     4  the Document tab, left on X-ray, lands on Contract View next time
     5  the X-ray map draws one block per MARKED clause and nothing grey
     7  the head draws no "Send to counterparty"; Share is there
     8  A+ grows the X-ray panel's type
     9  the negotiate page's reading switch offers Redlined alone

   Every driven half is GUARDED so a build without it reports, never hangs.
   Run: node test/chromium/nine-jobs-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'nine-jobs');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const BODY = '<h1>SOFTWARE AS A SERVICE AGREEMENT</h1>'
  + Array.from({ length: 12 }, (_, k) => `<h2>${k + 1}. Clause ${k + 1}</h2><p>The Supplier shall perform the Services described in clause ${k + 1} with reasonable skill and care in accordance with good industry practice.</p>`).join('')
  + '<h2>13. Liability</h2><p>The Supplier\'s total liability shall be unlimited for all claims arising under this Agreement.</p>';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  const base = { counterparty: 'nShift Group A/S', party: 'Highland Corporate Ltd', folder: 'proc',
    fields: {}, comments: [], rounds: [], versions: [], signatures: [], compliance: {}, obligations: [] };
  await W.admin.json('/api/contracts/MK-N1', { method: 'PUT', body: { baseVersion: 0, contract: {
    ...base, id: 'MK-N1', name: 'SaaS agreement', status: 'Under Review', format: 'rich', redlineText: BODY,
    owner: { name: 'Amina Otieno' },
    changes: [{ id: 'CHG-001', clauseId: 'cl_x', author: 'Unrestricted Legal', authorSide: 'owner', status: 'pending',
      op: 'modify', summary: 'Tighter liability', createdAt: '2026-09-20T10:00:00Z' }],
    approvalChain: [{ ruleId: 'r1', name: 'Legal', status: 'approved', by: 'Amina Otieno', at: '2026-09-21T10:00:00Z' }],
    playbook: { at: '2026-09-22', verdicts: [{ category: 'Liability cap', status: 'deviation',
      quote: 'total liability shall be unlimited for all claims', note: 'Uncapped.' }] },
    audit: [] } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 950 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ===== 7. NO SEND TO COUNTERPARTY ===== */
    await page.evaluate(() => openWorkspace('MK-N1'));
    await page.waitForTimeout(1500);
    const head = await page.evaluate(() => ({
      send: !!document.querySelector('#ws-next-action[data-na="share"]'),
      share: !!document.getElementById('ws-share') }));
    check('7 the head draws no "Send to counterparty"', !head.send, head.send ? 'still drawn' : 'gone');
    check('7b Share is still the door', head.share, String(head.share));

    /* ===== 2 and 3. THE OVERVIEW ===== */
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'terms'));
    await page.waitForTimeout(1200);
    const parties = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#kt-parties .py-row')];
      return rows.map(r => (r.querySelector('.py-ct') || {}).textContent || '');
    });
    check('2 our party row prints an email', /@/.test(parties[0] || ''), JSON.stringify(parties));
    await page.evaluate(() => { const b = document.querySelector('[data-sec-toggle$="people"][aria-expanded="false"]'); if (b) b.click(); });
    await page.waitForTimeout(700);
    const people = await page.evaluate(() => [...document.querySelectorAll('[data-pt-auto]')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
    check('3 "Who else" names the colleague who filed a change', people.some(t => /Unrestricted Legal/.test(t) && /added by HaTi/i.test(t)), JSON.stringify(people));
    check('3b and the one who approved', people.some(t => /Amina Otieno/.test(t)), '');
    await page.evaluate(() => { const r = document.querySelector('[data-pt-auto]'); if (r) r.scrollIntoView({ block: 'center' }); });
    await page.screenshot({ path: path.join(OUT, '01-overview.png'), fullPage: false });

    /* ===== 1 and 2. THE PARTY POP-UP ===== */
    const opened = await page.evaluate(() => { const b = document.querySelector('[data-py-add]'); if (b) { b.click(); return true; } return false; });
    await page.waitForTimeout(600);
    const form = await page.evaluate(() => ({ addr: !!document.getElementById('py-addr'), role: !!document.getElementById('py-role') }));
    check('2b the party form has no town box', opened && !form.addr && form.role, JSON.stringify(form));
    let scrolled = null;
    if (form.role) {
      const box = await page.$('#py-role');
      const bb = await box.boundingBox();
      await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await page.waitForTimeout(400);
      const mb = await page.evaluate(() => { const m = document.querySelector('.hati-selmenu'); if (!m) return null;
        const r = m.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, can: m.scrollHeight > m.clientHeight }; });
      if (mb) {
        await page.mouse.move(mb.x, mb.y);
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(400);
        scrolled = await page.evaluate(() => { const m = document.querySelector('.hati-selmenu'); return m ? { open: true, top: m.scrollTop } : { open: false }; });
        scrolled.can = mb.can;
      }
    }
    check('1 the role list stays open under the wheel', !!scrolled && scrolled.open, JSON.stringify(scrolled));
    check('1b and it really moved', !!scrolled && (!scrolled.can || scrolled.top > 0), JSON.stringify(scrolled));
    await page.screenshot({ path: path.join(OUT, '02-party-list.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.waitForTimeout(300);

    /* ===== 5 and 8. THE X-RAY ===== */
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'docs'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const b = document.querySelector('[data-doc-read="2"]'); if (b) b.click(); });
    await page.waitForTimeout(1500);
    const map = await page.evaluate(() => {
      const sp = document.getElementById('doc-xr-spine');
      const rows = (typeof docXrayRows === 'function') ? docXrayRows(getContract('MK-N1')) : [];
      return { segs: sp ? sp.querySelectorAll('.doc-xr-seg').length : -1,
        grey: sp ? sp.querySelectorAll('.doc-xr-seg:not(.is-amber):not(.is-ruby):not(.is-steel)').length : -1,
        marked: rows.filter(r => r.tone).length, clauses: rows.length };
    });
    check('5 the map draws one block per marked clause', map.segs === map.marked && map.marked > 0, JSON.stringify(map));
    check('5b and nothing grey', map.grey === 0, JSON.stringify(map));
    await page.screenshot({ path: path.join(OUT, '03-xray.png') });
    const sizeOf = () => page.evaluate(() => { const t = document.querySelector('#doc-xray .doc-xr-t');
      return t ? parseFloat(getComputedStyle(t).fontSize) : 0; });
    const s0 = await sizeOf();
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /A\+|A⁺/.test(x.textContent) && x.offsetParent); if (b) { b.click(); b.click(); } });
    await page.waitForTimeout(600);
    const s1 = await sizeOf();
    check('8 A+ grows the X-ray panel\'s type', s0 > 0 && s1 > s0, `${s0}px → ${s1}px`);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /A-|A⁻/.test(x.textContent) && x.offsetParent); if (b) { b.click(); b.click(); } });

    /* ===== 4. LANDS ON CONTRACT VIEW ===== */
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'terms'));
    await page.waitForTimeout(700);
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'docs'));
    await page.waitForTimeout(1000);
    const tabBack = await page.evaluate(() => ({ mode: typeof docViewMode === 'function' ? docViewMode() : '?',
      xray: !document.getElementById('doc-xray')?.hidden }));
    check('4 back on the Document tab it is Contract View', tabBack.mode === 'paper' && !tabBack.xray, JSON.stringify(tabBack));
    await page.evaluate(() => { const b = document.querySelector('[data-doc-read="2"]'); if (b) b.click(); });
    await page.waitForTimeout(800);
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(800);
    await page.evaluate(() => openWorkspace('MK-N1'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'docs'));
    await page.waitForTimeout(1000);
    const pageBack = await page.evaluate(() => typeof docViewMode === 'function' ? docViewMode() : '?');
    check('4b and after another page too', pageBack === 'paper', pageBack);

    /* ===== 9. THE NEGOTIATE PAGE ===== */
    await page.evaluate(() => { if (window.openRedlineWorkbench) openRedlineWorkbench('MK-N1'); });
    await page.waitForTimeout(1800);
    const segs = await page.evaluate(() => [...document.querySelectorAll('.rl-readwrap [data-rl-read]')].map(b => b.getAttribute('data-rl-read')));
    check('9 the reading switch offers Redlined alone', segs.length >= 1 && segs.every(v => v === 'marks'), JSON.stringify(segs));
    await page.screenshot({ path: path.join(OUT, '04-negotiate.png') });

    check('10 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
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
