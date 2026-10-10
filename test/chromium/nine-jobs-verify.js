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
    /* THE CONSTELLATION OVERVIEW (Young, 8 Oct 2026): at rest the parties are
       the `.ov-pty` rows of #ov-parties; the people on the contract and the
       party editors open with the ONE Edit (data-ov-edit="all"). */
    await page.waitForFunction(() => document.querySelectorAll('#ov-parties .ov-pty').length > 0, null, { timeout: 8000 }).catch(() => {});
    const parties = await page.evaluate(() =>
      [...document.querySelectorAll('#ov-parties .ov-pty')].map(r => (r.querySelector('small') || {}).textContent || ''));
    check('2 our party row prints an email', /@/.test(parties[0] || ''), JSON.stringify(parties));
    await page.evaluate(() => { const b = document.querySelector('[data-ov-edit="all"]'); if (b) b.click(); });
    /* RE-POINTED 10 Oct 2026 — follows THE DIRECTORY (Young picked it,
       9 Oct 2026: "for parties lets go with Directory"): Edit draws the people
       as one quiet line each (`participantsDirHtml`); a person HaTi added is a
       `[data-pt-pick="a:…"]` line carrying the "added by HaTi" tag. The old
       `[data-pt-auto]` row is now only the form behind a pressed line. */
    const AUTO = '[data-pt-pick^="a:"]';
    await page.waitForFunction(sel => document.querySelectorAll(sel).length > 0, AUTO, { timeout: 8000 }).catch(() => {});
    const people = await page.evaluate(sel => [...document.querySelectorAll(sel)].map(r => r.textContent.replace(/\s+/g, ' ').trim()), AUTO);
    check('3 "Who else" names the colleague who filed a change', people.some(t => /Unrestricted Legal/.test(t) && /added by HaTi/i.test(t)), JSON.stringify(people));
    check('3b and the one who approved', people.some(t => /Amina Otieno/.test(t)), '');
    await page.evaluate(sel => { const r = document.querySelector(sel); if (r) r.scrollIntoView({ block: 'center' }); }, AUTO);
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

    /* ===== 5 and 8. THE THREAD (was the X-ray) ===== */
    /* RE-POINTED 5 Oct 2026 (the Thread): the map and the panel became the
       Thread's rows. "One block per marked clause" is "every clause a row,
       the marked ones wearing their tone"; A+ grows the READING in the open
       row, which is set in the paper's own face and size. */
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'docs'));
    await page.waitForTimeout(1500);
    const map = await page.evaluate(() => {
      const th = document.getElementById('doc-thread');
      const rows = (typeof docXrayRows === 'function') ? docXrayRows(getContract('MK-N1')) : [];
      const drawn = th ? [...th.querySelectorAll('.doc-th-row')] : [];
      return { segs: drawn.length, toned: drawn.filter(r => /\bis-(ruby|amber|steel)\b/.test(r.className)).length,
        grey: drawn.filter(r => /\bis-(ruby|amber|steel)\b/.test(r.className) && !r.querySelector('.doc-th-state .is-ruby,.doc-th-state .is-amber,.doc-th-state .is-steel')).length,
        marked: rows.filter(r => r.tone).length, clauses: rows.length, switchGone: !document.querySelector('[data-doc-read]') };
    });
    check('5 the thread draws one row per clause, and the marked ones wear their tone', map.segs === map.clauses && map.toned === map.marked && map.marked > 0 && map.switchGone, JSON.stringify(map));
    check('5b and a toned row always says how many marks', map.grey === 0, JSON.stringify(map));
    await page.screenshot({ path: path.join(OUT, '03-thread.png') });
    /* a reading on the open row, so there is a line in the paper's face to measure */
    await page.evaluate(() => { const c = getContract('MK-N1'); const sheet = docReadSheet(c) || [];
      c._readings = { at: '2026-10-05', over: 0, items: sheet.map((r, i) => ({ i, heading: r.heading, plain: 'NJPLAIN' + i + ' a reading.' })) };
      docThreadPaint(c); });
    await page.waitForTimeout(400);
    const sizeOf = () => page.evaluate(() => { const t = document.querySelector('#doc-thread .doc-th-row.is-open .doc-th-plain');
      return t ? parseFloat(getComputedStyle(t).fontSize) : 0; });
    const s0 = await sizeOf();
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /A\+|A⁺/.test(x.textContent) && x.offsetParent); if (b) { b.click(); b.click(); } });
    await page.waitForTimeout(600);
    const s1 = await sizeOf();
    /* RE-POINTED 6 Oct 2026 (Panel Voice, Young: "the A⁻ / A⁺ buttons no
       longer change them"): the reading keeps the panel's size; only the paper grows. */
    check('8 A+ grows the paper, never the reading in the thread', s0 > 0 && s1 === s0, `${s0}px → ${s1}px`);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /A-|A⁻/.test(x.textContent) && x.offsetParent); if (b) { b.click(); b.click(); } });

    /* ===== 4. LANDS ON THE PAPER WITH THE THREAD BESIDE IT ===== */
    /* RE-POINTED 5 Oct 2026: there is no Contract View to land on any more —
       the paper and the thread are one screen. Coming back finds both up and
       no switch to have been left in the wrong position. */
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'terms'));
    await page.waitForTimeout(700);
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'docs'));
    await page.waitForTimeout(1000);
    const tabBack = await page.evaluate(() => ({ paper: !!document.getElementById('doc-canvas'),
      thread: !document.getElementById('doc-thread')?.hidden && document.querySelectorAll('#doc-thread .doc-th-row').length > 0,
      switchGone: !document.querySelector('[data-doc-read]') }));
    check('4 back on the Document tab the paper and the thread are both up, and there is no switch', tabBack.paper && tabBack.thread && tabBack.switchGone, JSON.stringify(tabBack));
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(800);
    await page.evaluate(() => openWorkspace('MK-N1'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-N1'), 'docs'));
    await page.waitForTimeout(1000);
    const pageBack = await page.evaluate(() => !document.getElementById('doc-thread')?.hidden && document.querySelectorAll('#doc-thread .doc-th-row').length > 0 && !document.querySelector('[data-doc-read]'));
    check('4b and after another page too', pageBack === true, String(pageBack));

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
