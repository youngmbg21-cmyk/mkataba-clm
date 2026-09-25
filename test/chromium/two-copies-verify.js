/* Chromium verification: TWO COPIES OF ONE CONTRACT (Young ruled 25 Sep 2026)
   ============================================================
   *"When a contract goes to the document page, the negotiation page as well,
   it should look like its on Microsoft Word waiting to be edited. But when you
   go to the signing page it should look exactly like how it was designed."*
   Built to the design "HaTi — Working copy and signing copy" with the owner's
   picks 1A 2B 3A 4A 5A 6A.

   EVERY CLAIM HERE IS A PIXEL OR A PRESS, which is why it is here and not in
   f383 (which proves the planner, the Word reader and the wiring in node):
     - the grey gap between two pages, and NO LINE OF WORDING crossing it —
       asked of every text rectangle on the paper against every gap;
     - "Page 2 of 6" in each page's foot, the faded letterhead in the working
       copy's top margin and the whole letterhead on the signing copy's page 1;
     - the size control ZOOMING the signing copy rather than re-breaking it;
     - the places to sign on the signing copy and nowhere else;
     - the signing copy staying white under the dark theme;
     - their signing link drawing the same signing copy.
   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than passing on an empty
   page. At the parent (aa997ca) none of it exists.

   Screenshots go to test/chromium/shots/two-copies/.
   Run: node test/chromium/two-copies-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../helpers');

/* HATI_SHOT_DIR puts the pictures where the runner may write (the shots
   folder is git-ignored and, in some sessions, unreadable). */
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'two-copies');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ID = 'MK-A2';
const DESIGN = { designId: 'classic-letterhead', companyName: 'Highland Corporate Ltd',
  registrationNumber: 'PVT-2019/4471', address: 'Nairobi, Kenya', footerText: 'Confidential' };

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* ONE READING OF A SHEET'S PAGES, asked of whichever sheet the selector names:
   its copy, its page count, its pages in VIEWPORT pixels, the gaps between
   them, and every line of wording that crosses a gap. A line crossing a gap
   is a line the grey band paints over — the one thing the page-maker exists
   never to do. */
const PAGES = sel => `(() => {
  const sheet = document.querySelector(${JSON.stringify(sel)});
  if (!sheet || !sheet._pgInfo) return null;
  const info = sheet._pgInfo, sr = sheet.getBoundingClientRect();
  const scale = sheet.offsetHeight ? sr.height / sheet.offsetHeight : 1;
  const pages = info.pages.map(p => ({ top: sr.top + p.top * scale, bot: sr.top + (p.top + p.h) * scale }));
  const gaps = [];
  for (let k = 0; k < pages.length - 1; k++) gaps.push({ top: pages[k].bot, bot: pages[k + 1].top });
  const crossing = [];
  const walk = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT, { acceptNode: n =>
    (/\\S/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('[data-pg-layer]'))) ? 1 : 3 });
  let lines = 0;
  while (walk.nextNode()) {
    const rg = document.createRange(); rg.selectNodeContents(walk.currentNode);
    for (const r of rg.getClientRects()) {
      if (r.height < 1 || r.width < 1) continue;
      lines++;
      for (const g of gaps) if (r.bottom > g.top + 0.5 && r.top < g.bot - 0.5) crossing.push(walk.currentNode.nodeValue.trim().slice(0, 40));
    }
  }
  const lay = sheet.querySelector(':scope > [data-pg-layer]');
  const attrs = s => lay ? Array.from(lay.querySelectorAll(s)).map(e => e.getAttribute('data-l') || e.textContent.trim()) : [];
  return { n: info.n, pageH: info.pageH, W: sheet.offsetWidth, scale: Math.round(scale * 1000) / 1000,
    gaps: gaps.map(g => Math.round(g.bot - g.top)), crossing, lines,
    feet: attrs('.pg-foot'), heads: attrs('.pg-head'), runs: attrs('.pg-run'), sfeet: attrs('.pg-sfoot'),
    dfeet: lay ? Array.from(lay.querySelectorAll('.pg-dfoot')).map(e => e.textContent.replace(/\\s+/g, ' ').trim()) : [],
    corners: lay ? lay.querySelectorAll('.pg-corner').length : 0,
    push: JSON.stringify(info.push) };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  await nameASigner(W.admin, ID);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    await page.evaluate(async id => { try { await ensureFull(getContract(id)); } catch (_) {} }, ID);
    /* ---- THE FIXTURE ----
       Twelve clauses of real length with stamped clause ids — long enough to
       run over several pages, and anchored, so a place to sign has a clause to
       sit under (a spot is anchored to a clause id and nothing else). */
    await page.evaluate(async id => {
      const c = getContract(id);
      const words = 'The Supplier shall deliver each consignment to the Buyer\'s plant within the agreed window, '
        + 'and every consignment shall meet the specification, the applicable standard and the quality plan agreed '
        + 'between the parties, failing which the Buyer may reject it within five days of delivery at the Supplier\'s cost. ';
      const titles = ['Definitions', 'Supply', 'Specification', 'Delivery', 'Price', 'Payment', 'Quality',
        'Rejection', 'Liability', 'Confidentiality', 'Termination', 'Execution'];
      c.format = 'rich';
      c.redlineText = titles.map((t, i) => {
        const n = String(i + 1).padStart(5, '0');
        return `<h2 data-clause-id="cl_tcv${n}">${i + 1}. ${t}</h2><p>${words.repeat(2)}</p><p>${words}</p>`;
      }).join('');
      c.signSpots = [];
      persist(c);
      await new Promise(r => setTimeout(r, 1400));   // persist is debounced
    }, ID);
    await page.evaluate(id => openWorkspace(id), ID);
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForTimeout(1300);

    /* ================= 1 — THE WORKING COPY IS PAGES (1A, 3A) */
    const work = await page.evaluate(PAGES('#doc-sheet-host .pg-sheet.pg-work'));
    check('1a the Document tab draws the WORKING copy, laid out as pages', !!(work && work.n >= 1),
      work ? `${work.n} page(s)` : 'no paged working copy');
    check('1b the contract runs over more than one page, a grey gap between each',
      !!(work && work.n >= 2 && work.gaps.every(g => g >= 19)), work ? `gaps ${work.gaps.join(',')}` : '—');
    check('1c NO LINE OF WORDING CROSSES A GAP — every line is on a page, none under the grey',
      !!(work && work.lines > 20 && work.crossing.length === 0),
      work ? `${work.lines} lines · crossing: ${JSON.stringify(work.crossing.slice(0, 3))}` : '—');
    check('1d every page carries its number, faded in its foot — "Page k of n"',
      !!(work && work.n >= 2 && work.feet.length === work.n
        && work.feet.every((f, k) => new RegExp(`\\b${k + 1}\\b.*\\b${work.n}\\b`).test(f))),
      work ? JSON.stringify(work.feet) : '—');
    check('1e Word\'s corner marks, four to a page', !!(work && work.n >= 1 && work.corners === 4 * work.n),
      work ? `${work.corners} marks on ${work.n} pages` : '—');
    await page.screenshot({ path: path.join(OUT, '01-working-copy.png') });

    /* ================= 2 — THE LETTERHEAD FADES INTO THE TOP MARGIN (2B) */
    await page.evaluate(d => {
      const c = getContract(state.activeId);
      c.branding = { ...(c.branding || {}), ...d };
      roomGoTab(c, 'sign'); roomGoTab(c, 'docs');
    }, DESIGN);
    await page.waitForTimeout(1300);
    const workD = await page.evaluate(PAGES('#doc-sheet-host .pg-sheet.pg-work'));
    const inFlow = await page.evaluate(() => {
      const sh = document.querySelector('#doc-sheet-host .pg-sheet.pg-work');
      if (!sh) return null;
      return Array.from(sh.querySelectorAll('[data-doc-design]')).filter(e => !e.closest('[data-pg-layer]')).length;
    });
    check('2a with a design, page one\'s top margin names the letterhead, faded — one line, not the letterhead',
      !!(workD && workD.heads[0] === DESIGN.companyName && inFlow === 0),
      workD ? `head "${workD.heads[0]}" · letterhead blocks in the wording: ${inFlow}` : '—');
    check('2b pages after the first carry the reference beside the name',
      !!(workD && workD.n >= 2 && await page.evaluate(() => {
        const r = document.querySelector('#doc-sheet-host .pg-work [data-pg-layer] .pg-head.is-run');
        return !!(r && r.getAttribute('data-r') === getContract(state.activeId).id);
      })), workD ? `${workD.heads.length} heads` : '—');
    await page.screenshot({ path: path.join(OUT, '02-working-copy-faded-letterhead.png') });

    /* ================= 3 — THE SIGNING COPY IS THE DESIGN AT FULL STRENGTH */
    await page.evaluate(() => {
      const c = getContract(state.activeId);
      c.signSpots = [];
      signSpotAdd(c, 'cl_tcv00012', (c.signerPlan.find(r => r.party === 'internal') || c.signerPlan[0]).id, 'signature');
      roomGoTab(c, 'sign');
    });
    await page.waitForTimeout(1600);
    const sign = await page.evaluate(PAGES('#doc-signwrap .pg-sheet.pg-sign'));
    check('3a the Signing tab draws the SIGNING copy on fixed A4 pages', !!(sign && sign.W === 794
      && Math.abs(sign.pageH - 794 * 297 / 210) < 1), sign ? `${sign.W} x ${sign.pageH} · ${sign.n} page(s)` : 'no signing copy');
    const head = await page.evaluate(() => {
      const sh = document.querySelector('#doc-signwrap .pg-sheet.pg-sign');
      const d = sh && sh.querySelector(':scope > [data-doc-design]');
      return d ? Math.round(d.getBoundingClientRect().top - sh.getBoundingClientRect().top) : null;
    });
    check('3b the whole letterhead is drawn at the head of page one', head != null && head >= 0 && head < 120,
      head == null ? 'no letterhead on the signing copy' : `${head}px below the page's edge`);
    check('3c NO LINE OF WORDING CROSSES A GAP on the signing copy either',
      !!(sign && sign.lines > 20 && sign.crossing.length === 0),
      sign ? `${sign.lines} lines · crossing: ${JSON.stringify(sign.crossing.slice(0, 3))}` : '—');
    check('3d the design\'s footer on EVERY page, carrying "Page k of n"',
      !!(sign && sign.n >= 1 && sign.dfeet.length === sign.n
        && sign.dfeet.every((f, k) => f.includes(DESIGN.footerText) && new RegExp(`\\b${k + 1}\\b.*\\b${sign.n}\\b`).test(f))),
      sign ? JSON.stringify(sign.dfeet) : '—');
    check('3e a slim running head on every page after the first, and none on page one',
      !!(sign && sign.n >= 2 && sign.runs.length === sign.n - 1 && sign.runs.every(r => r === DESIGN.companyName)),
      sign ? JSON.stringify(sign.runs) : '—');
    const spots = await page.evaluate(() => ({
      sign: document.querySelectorAll('#doc-signwrap .sig-spot').length,
      flags: document.querySelectorAll('#doc-signwrap .rl-sigline[data-pg-flag]').length,
      mine: (() => { const m = document.querySelector('#doc-signwrap .rl-sigline.pg-mine[data-pg-flag]');
        return m ? getComputedStyle(m, '::before').content : null; })() }));
    check('3f the places to sign are marked ON the signing copy (5A)', spots.sign >= 1 && spots.flags >= 2,
      JSON.stringify(spots));
    check('3g our own line says "Sign here" from the margin', /Sign here|Signera/.test(String(spots.mine)),
      String(spots.mine));
    await page.screenshot({ path: path.join(OUT, '03-signing-copy.png') });

    /* The page stepper names where the reader is and moves them. */
    const step = await page.evaluate(() => (document.getElementById('sc-page-out') || {}).textContent || null);
    check('3h the control row says which page is in view', !!(step && sign && new RegExp(`1\\D+${sign.n}`).test(step)), step);
    if (sign && sign.n >= 2) {
      await page.click('#sc-page-next');
      await page.waitForTimeout(500);
      const step2 = await page.evaluate(() => (document.getElementById('sc-page-out') || {}).textContent || null);
      check('3i pressing next page brings page two into view and says so', !!(step2 && /^\D*2\D/.test(step2)), step2);
      await page.evaluate(() => { const s = document.getElementById('doc-scroll'); if (s) s.scrollTop = 0; });
    } else check('3i pressing next page brings page two into view and says so', false, 'one page only');

    /* ================= 4 — THE SIZE CONTROL ZOOMS, IT DOES NOT RE-BREAK (4A) */
    const z0 = await page.evaluate(PAGES('#doc-signwrap .pg-sheet.pg-sign'));
    const zBtn = await page.$('#ws-tabrow-end [data-sc-zoom="1"]');
    if (zBtn) { await zBtn.click(); await page.waitForTimeout(700); }
    const z1 = await page.evaluate(PAGES('#doc-signwrap .pg-sheet.pg-sign'));
    const zOut = await page.evaluate(() => (document.getElementById('sc-zoom-out') || {}).textContent || null);
    check('4a pressing Larger makes the WHOLE page larger', !!(zBtn && z0 && z1 && z1.scale > z0.scale),
      z0 && z1 ? `${z0.scale} → ${z1.scale} (${zOut})` : 'no size control');
    check('4b …and the pages break exactly where they broke — nothing re-flows',
      !!(z0 && z1 && zBtn && z0.n === z1.n && z0.push === z1.push && z1.W === 794),
      z0 && z1 ? `${z0.n} → ${z1.n} pages, pushes ${z0.push === z1.push ? 'identical' : 'moved'}` : '—');
    const zb = await page.$('#ws-tabrow-end [data-sc-zoom="-1"]');
    if (zb) { await zb.click(); await page.waitForTimeout(400); }
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.signZoom'); } catch (_) {} });

    /* ================= 5 — THE WORKING COPY CARRIES NO PLACE TO SIGN (5A) */
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForTimeout(1000);
    const workSpots = await page.evaluate(() => ({
      spots: document.querySelectorAll('#doc-sheet-host .sig-spot').length,
      flags: document.querySelectorAll('#doc-sheet-host [data-pg-flag]').length,
      placed: (getContract(state.activeId).signSpots || []).length,
      copy: (document.getElementById('doc-sheet-host') || {}).getAttribute ? document.getElementById('doc-sheet-host').getAttribute('data-copy') : null }));
    check('5a a place to sign that EXISTS is not drawn on the working copy', workSpots.copy === 'work'
      && workSpots.placed >= 1 && workSpots.spots === 0 && workSpots.flags === 0, JSON.stringify(workSpots));

    /* ================= 6 — THE SIGNING COPY IS ALWAYS WHITE */
    await page.evaluate(() => { if (window.setDark) setDark(true); else document.documentElement.classList.add('dark'); });
    await page.waitForTimeout(500);
    const darkWork = await page.evaluate(() => { const s = document.querySelector('#doc-sheet-host .pg-work'); return s ? getComputedStyle(s).backgroundColor : null; });
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'sign'));
    await page.waitForTimeout(1100);
    const darkSign = await page.evaluate(() => { const s = document.querySelector('#doc-signwrap .pg-sign'); return s ? getComputedStyle(s).backgroundColor : null; });
    check('6a under the dark theme the working copy is the dark paper…', !!darkWork && darkWork !== 'rgb(255, 255, 255)', darkWork);
    check('6b …and the signing copy stays WHITE — it is the page that gets signed and printed',
      darkSign === 'rgb(255, 255, 255)', darkSign);
    await page.screenshot({ path: path.join(OUT, '04-signing-copy-dark.png') });
    await page.evaluate(() => { if (window.setDark) setDark(false); else document.documentElement.classList.remove('dark'); });
    await page.waitForTimeout(400);

    /* ================= 7 — THE PAGES YOU READ ARE THE PAGES THAT PRINT */
    const printed = await page.evaluate(() => {
      const s = document.querySelector('#doc-signwrap .pg-sheet.pg-sign');
      if (!s || !window.pagesPrintPages) return null;
      const box = document.createElement('div'); box.innerHTML = pagesPrintPages(s);
      const pp = box.querySelectorAll('.pp-page');
      return { pages: pp.length, n: s._pgInfo && s._pgInfo.n,
        feet: Array.from(pp).map(p => (p.querySelector('.pg-dfoot') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim()) };
    });
    check('7a printing makes one A4 sheet per page on the screen, each with the same foot',
      !!(printed && printed.pages >= 1 && printed.pages === printed.n
        && printed.feet.every((f, k) => new RegExp(`\\b${k + 1}\\b.*\\b${printed.n}\\b`).test(f))),
      JSON.stringify(printed));

    /* ================= 8 — THE NEGOTIATE PAGE IS THE WORKING COPY TOO */
    await page.evaluate(id => openRedlineWorkbench(id), ID);
    await page.waitForSelector('.redline-page .rl-paper', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1600);
    const nego = await page.evaluate(PAGES('.redline-page .rl-paper.pg-sheet'));
    check('8a the Negotiate page\'s paper is pages, with Word\'s corner marks',
      !!(nego && nego.n >= 1 && nego.corners === 4 * nego.n), nego ? `${nego.n} page(s), ${nego.corners} marks` : 'no paged paper');
    check('8b no line of wording crosses a gap there either',
      !!(nego && nego.lines > 20 && nego.crossing.length === 0),
      nego ? `${nego.lines} lines · crossing: ${JSON.stringify(nego.crossing.slice(0, 3))}` : '—');
    await page.screenshot({ path: path.join(OUT, '05-negotiate-working-copy.png') });

    /* ================= 9 — THEIR SIGNING LINK DRAWS THE SAME SIGNING COPY */
    const tok = await page.evaluate(async (id) => {
      const c = getContract(id);
      const payload = await buildSharePayload(c, 'deadbeef', null, { purpose: 'sign' });
      const res = await api('shares', 'POST', { payload: { ...payload, purpose: 'sign', purposeChosen: 'sign' },
        channel: 'link', recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, purpose: 'sign' });
      return res && res.token;
    }, ID).catch(e => 'ERR ' + e.message);
    const cp = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    cp.on('pageerror', e => errors.push('their page: ' + e.message));
    await cp.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
    await cp.waitForTimeout(2600);
    const theirs = await cp.evaluate(() => {
      const s = document.querySelector('#pt-doc .pg-sheet.pg-sign');
      if (!s) return null;
      const r = s.getBoundingClientRect();
      return { n: s._pgInfo && s._pgInfo.n, W: s.offsetWidth, shown: Math.round(r.width),
        flags: document.querySelectorAll('#pt-doc .rl-sigline[data-pg-flag]').length,
        mineIndex: Array.from(document.querySelectorAll('#pt-doc .rl-sigline[data-pg-flag]')).findIndex(e => e.classList.contains('pg-mine')),
        col: Math.round((s.parentElement && s.parentElement.parentElement || s).clientWidth) };
    });
    check('9a their signing link draws the signing copy, on A4 pages', !!(theirs && theirs.W === 794 && theirs.n >= 1),
      theirs ? JSON.stringify(theirs) : 'no signing copy on their page');
    check('9b …fitted to their column, never wider than it',
      !!(theirs && theirs.shown <= theirs.col + 1), theirs ? `${theirs.shown}px in a ${theirs.col}px column` : '—');
    check('9c their own line is the one marked "Sign here" — the second party\'s, never ours',
      !!(theirs && theirs.flags >= 2 && theirs.mineIndex === 1), theirs ? `mine at ${theirs.mineIndex} of ${theirs.flags}` : '—');
    await cp.evaluate(() => { const d = document.getElementById('pt-doc'); if (d) d.scrollIntoView({ block: 'start' }); });
    await cp.waitForTimeout(400);
    await cp.screenshot({ path: path.join(OUT, '06-their-signing-link.png') });

    check('10 no page errors anywhere in the journey', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the journey ran', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach(f => console.log(`  - ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
    process.exitCode = 1;
  }
})();
