/* Chromium verification: THE LIST'S COLUMNS, ONE RULE ON EVERY LIST
   (owner, 28 Oct 2026, over three screenshots of Approvals: "there should be
   a rule that one column should never take that much space"; "look at the
   side panel overlapping when it is on a laptop but not so when on a
   desktop"; "if there are multiple parties or a long name, the row expands
   which makes the page look unprofessional"; then "you are not able to
   adjust the size of your column. This needs to be added").

   WHAT THIS MEASURES, on the painted page, on every list a person can open,
   at the owner's three screens and the 1440 laptop zoomed to 125% and 150%:
     COVER    the list's table runs under the panel beside it (at rest)
     WIDE     the name column wider than its ceiling (LIST_NAME_MAX)
     TALL     a name on more than two lines
     GRIP     no head that can be dragged to widen its column
   and, once, on Approvals: a drag widens the column and is kept after the
   list draws again; a double press puts it back.

   Run: node test/chromium/list-columns-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* the owner's three screens, and the 1440 laptop at 125% and 150% zoom (a zoom is a smaller window) */
const SCREENS = process.env.ONLY_W ? [{k:'x',w:+process.env.ONLY_W,h:780}] : [
  { k: 'ipad', w: 1366, h: 950 }, { k: 'laptop-a', w: 1440, h: 780 }, { k: 'laptop-b', w: 1536, h: 730 },
  { k: 'zoom-125', w: 1152, h: 624 }, { k: 'zoom-150', w: 960, h: 520 },
  ...(process.env.SHOTS ? [{ k: 'desktop', w: 1920, h: 1000 }] : []),
];
const PAGES0 = [
  { k: 'parties', go: `setView('customers')` },
  { k: 'people', go: `setView('directory')` },
  { k: 'approvals', go: `setView('approvals')` },
  { k: 'requests', go: `setView('intake')` },
  { k: 'obligations', go: `setView('obligations')` },
  { k: 'negotiations', go: `openNegotiations({ list: true })` },
  { k: 'standards', go: `setView('playbook')` },
  { k: 'templates', go: `(async () => { setView('templates'); await new Promise(r => setTimeout(r, 900));
      const b = [...document.querySelectorAll('#content button, #content [role=tab]')].find(x => /^Templates/.test(x.textContent.trim())); if (b) b.click(); })()` },
  { k: 'contracts', go: `setView('register')`, own: true },
];
const PAGES = process.env.ONLY_P ? PAGES0.filter(p => process.env.ONLY_P.split(',').includes(p.k)) : PAGES0;
/* an owner-length name, so a long one is on the page to be measured */
const LONG = 'APEX LOGISTICS & WAREHOUSING KENYA LIMITED, NORDVANE CONSUMER BRANDS AB AND SAW SAWA LLC';

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? 'PASS  ' : 'FAIL  ') + n + (d ? ' — ' + d : '')); };

async function sweep(page, pages, errors){
    for (const S of SCREENS) {
      await page.setViewportSize({ width: S.w, height: S.h });
      for (const P of pages) {
        await page.evaluate(P.go).catch(e => errors.push(P.k + ': ' + String(e).slice(0, 120)));
        /* asks for the table, bounded */
        await page.waitForFunction(() => [...document.querySelectorAll('#content table, #ct-place table')]
          .some(t => !t.closest('[hidden]') && !t.closest('.ins-panel') && t.getBoundingClientRect().width > 200 && t.querySelector('tbody tr')), null, { timeout: 6000 }).catch(() => {});
        await page.waitForTimeout(500);
        const m = await page.evaluate(own => {
          const t = [...document.querySelectorAll('#content table, #ct-place table')]
            .find(x => !x.closest('[hidden]') && !x.closest('.ins-panel') && x.getBoundingClientRect().width > 200 && x.querySelector('tbody tr'));
          if (!t) return { none: true };
          const tb = t.getBoundingClientRect();
          const pan = [...document.querySelectorAll('#content .ins-panel, #ig-dock')].find(p => !p.closest('[hidden]') && !p.classList.contains('is-folded') && p.getBoundingClientRect().width > 0 && p.getBoundingClientRect().left > tb.left);
          const pl = pan ? pan.getBoundingClientRect().left : null;
          /* the table's own scroller may let it run on sideways; the part in sight is what may not lie under the panel */
          const sc = t.parentElement; const sr = sc.getBoundingClientRect();
          const right = Math.min(tb.right, sr.right);
          const th0 = t.querySelector('thead th');
          const nameW = th0 ? Math.round(th0.getBoundingClientRect().width) : 0;
          let tall = null;
          for (const tr of [...t.querySelectorAll('tbody tr')].slice(0, 40)) {
            const td = tr.querySelector('td'); if (!td || td.colSpan > 1) continue;
            for (const el of td.querySelectorAll('b, .ap-name, .cu-pn, .dir-name, .reg-title, .mig-fn, .ik-req b')) {
              const cs = getComputedStyle(el); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.35;
              const lines = Math.round(el.getBoundingClientRect().height / lh);
              if (lines > 2 && (!tall || lines > tall.lines)) tall = { lines, text: el.textContent.trim().slice(0, 50) };
            }
          }
          /* a list of several cards (Obligations' weeks; Late's heads are for a screen reader only) is one list */
          const seat = t.getAttribute('data-list-seat');
          const grips = seat ? document.querySelectorAll(`[data-list-seat="${seat}"] .lc-grip`).length
            : t.querySelectorAll('thead .lc-grip, tr:first-child > th .lc-grip, thead .reg-col-grip, thead [data-reg-grip]').length;
          return { cover: pl != null ? Math.round(right - pl) : null, nameW, tall, grips, max: window.LIST_NAME_MAX || 480, own };
        }, !!P.own);
        const tag = `${S.k} ${S.w}×${S.h} · ${P.k}`;
        if (m.none) { console.log(`skip  ${tag} — no list drawn here`); continue; }
        if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/lc-${P.k}-${S.w}.png` });
        ok(`${tag} COVER: the list ends before the panel`, m.cover == null || m.cover <= 1, `${m.cover}px past`);
        if (!P.own) ok(`${tag} WIDE: the name column within its ceiling`, m.nameW <= m.max + 2, `${m.nameW}px`);
        ok(`${tag} TALL: no name on more than two lines`, !m.tall, m.tall && JSON.stringify(m.tall));
        if (!P.own) ok(`${tag} GRIP: a column can be dragged wider`, m.grips > 0, `${m.grips} grips`);
      }
    }

}

(async () => {
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd');
    await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke');
    await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample');
    if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 5, null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    /* the workspace settles (its first reads) before the first list is asked for */
    await page.waitForFunction(() => typeof setView === 'function' && document.getElementById('content-scroll'), null, { timeout: 15000 });
    await page.waitForTimeout(2500);
    /* the long name rides the first few contracts, as the owner's own book does */
    await page.evaluate(L => { state.contracts.slice(0, 6).forEach(c => { c.counterparty = L; }); }, LONG);

    await sweep(page, PAGES, errors);

    /* ---- the drag, once, on Approvals at 1440 ---- */
    await page.setViewportSize({ width: 1536, height: 730 });
    await page.evaluate(`setView('approvals')`);
    await page.waitForSelector('table[data-list-seat="approvals"] .lc-grip', { timeout: 8000 }).catch(() => {});
    const g = await page.evaluate(() => { const gr = [...document.querySelectorAll('table[data-list-seat="approvals"] thead .lc-grip')].find(x => x.getAttribute('data-lc-k') === 'wait');
      if (!gr) return null; const r = gr.getBoundingClientRect(); const th = gr.closest('th'); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.round(th.getBoundingClientRect().width) }; });
    if (!g) ok('DRAG the Waiting column has a grip', false, 'no grip');
    else {
      await page.mouse.move(g.x, g.y); await page.mouse.down(); await page.mouse.move(g.x + 60, g.y, { steps: 6 }); await page.mouse.up();
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => { const gr = document.querySelector('table[data-list-seat="approvals"] thead .lc-grip[data-lc-k="wait"]'); return gr ? Math.round(gr.closest('th').getBoundingClientRect().width) : null; });
      const kept = await page.evaluate(() => (window.listColWidths ? listColWidths('approvals') : {}).wait || null);
      ok('DRAG pulling the edge widens Waiting, and the width is kept for this list', after > g.w + 20 && kept > 0, `${g.w} → ${after}px, kept ${kept}`);
      const g2 = await page.evaluate(() => { const gr = document.querySelector('table[data-list-seat="approvals"] thead .lc-grip[data-lc-k="wait"]'); const r = gr.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.dblclick(g2.x, g2.y);
      await page.waitForTimeout(500);
      const back = await page.evaluate(() => (window.listColWidths ? listColWidths('approvals') : {}).wait || null);
      ok('DRAG a double press on the edge puts the column back', back == null, String(back));
      const sorted = await page.evaluate(() => (window.regState ? null : null));
      void sorted;
    }
    /* ---- a book with duties and live negotiations (the sample has neither), the same sweep ---- */
    const H = require('../helpers');
    const day = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
    const C = [];
    for (let i = 0; i < 10; i++) {
      const c = { ...H.fixtureContract('MK-LC' + i, 'Warehousing and Transportation Services Agreement ' + i, i < 4 ? LONG : ['Saw Sawa LLC', 'AK Bank', 'Topeca LLC'][i % 3], H.FOLDER_B, 2e6 * (i + 1), i < 5 ? 'Signed' : 'Under Review') };
      c.obligations = [{ id: 'o' + i, desc: 'Send the insurance certificate for the cold-chain warehouse ' + i, party: i % 2 ? 'theirs' : 'ours', due: day(i * 3 - 2), status: 'open' }];
      if (i >= 5) Object.assign(c, { negotiation: { round: 2, rounds: [] }, changes: [{ id: 'CH' + i, clauseId: 'cl_a1', clauseLabel: 'Article 1', changeType: 'edit', status: 'pending', authorSide: 'counterparty', summary: 'Price', createdAt: day(-2), roundN: 2 }] });
      C.push(c);
    }
    const h2 = await H.startHati();
    try {
      await H.seedWorkspace(h2, { contracts: C, approvalRules: [] });
      const p2 = await browser.newPage({ viewport: { width: 1440, height: 780 } });
      p2.on('pageerror', e => errors.push(String(e).slice(0, 180)));
      await p2.goto(h2.base + '/', { waitUntil: 'networkidle' });
      await p2.fill('#li-email', 'admin@example.co.ke'); await p2.fill('#li-pass', 'adminpassword1'); await p2.click('#li-go');
      await p2.waitForFunction(() => typeof setView === 'function' && window.state && state.contracts && state.contracts.length === 10, null, { timeout: 15000 });
      await p2.waitForTimeout(1500);
      await sweep(p2, PAGES.filter(p => ['obligations', 'negotiations'].includes(p.k)), errors);
    } finally { await h2.stop().catch(() => {}); }

    ok('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e).slice(0, 300));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
