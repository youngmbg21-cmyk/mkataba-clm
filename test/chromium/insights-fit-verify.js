/* Chromium verification: INSIGHTS FITS THE SCREEN
   ============================================================
   Young, 29 Sep 2026: "Help propose designs to make the pages fit with a page
   and for the cards to fit together without cards being taller than other
   cards and not covering spaces fully. The pages should look balanced and
   professional." The owner picked "Fit to Screen" by name.

   Measured on the real page, for every tab the layout covers (Portfolio,
   Negotiation Friction, Obligations, Payment terms, Exposure — Explorer is a
   canvas already edge to edge), on a laptop (1440 × 900) and a desktop
   (1920 × 1080):
     a  the tab does not scroll — it fits one screen;
     b  the grid reaches the bottom of the page — no empty band under it;
     c  every card in a row shares its neighbours' top and bottom edges;
     d  no card hides content it cannot show — a long list scrolls inside it;
     e  the headline figures lead the tab, in the one shared tile.
   And on a narrow window (1000 wide) the rows stack into one column, which is
   allowed to scroll.

   Red at acdbe727 (the parent of the shared grammar): no tab draws .igx-fit,
   so every a–e claim reports missing rather than timing out.

   Screenshots go to test/chromium/shots/insights-fit/.
   Run: node test/chromium/insights-fit-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'insights-fit');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const TABS = [['frame', 'ig-frame', 'Portfolio'], ['friction', 'ig-friction', 'Negotiation Friction'],
  ['obligations', 'ig-oblig', 'Obligations'], ['payterms', 'ig-pt-body', 'Payment terms'],
  ['exposure', 'ig-exp-body', 'Exposure']];

/* A realistic book, built in the page: every tab has something to draw.
   Dates are offsets from today, so the answer never depends on the day. */
function seedBook() {
  const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const iso = off => new Date(Date.now() + off * 86400000).toISOString();
  const CP = ['Naivas Supermarkets', 'Kabras Sugar', 'Nandi Dairy', 'Safaricom PLC', 'Bamburi Cement', 'Britam Insurance',
    'Siginon Logistics', 'KenGen', 'Twiga Foods', 'Equity Bank', 'Kenya Airways', 'Davis & Shirtliff'];
  const CAT = ['services', 'customer', 'supplier', 'works', 'customer', 'lease'];
  const CL = ['Limitation of Liability', 'Payment Terms', 'Indemnity', 'Termination', 'Price Review', 'Governing Law', 'Warranties'];
  const ST = ['Signed', 'Signed', 'Signed', 'Under Review', 'Under Review', 'Draft', 'Signed', 'Under Review'];
  let seed = 7; const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const out = [];
  for (let i = 0; i < 34; i++) {
    const status = ST[i % ST.length], cp = CP[i % CP.length];
    const c = { id: 'MK-F' + (100 + i), name: ['Master Services', 'Supply Agreement', 'Works Contract', 'Software Licence', 'Office Lease', 'NDA'][i % 6] + ' — ' + cp.split(' ')[0],
      counterparty: cp, status, value: Math.round(r() * 60 + 2) * 1e6, expiry: day(-20 + i * 23), folder: 'proc', audit: [], rounds: [], valueType: 'standard',
      owner: { name: ['Amina Otieno', 'Brian Kariuki', 'Wanjiru Mwangi'][i % 3] },
      metadata: { category: CAT[i % CAT.length], liabilityCapped: r() < 0.3 ? 'uncapped' : 'capped', indemnityCapped: r() < 0.25 ? 'uncapped' : 'capped',
        priceReview: r() < 0.35 ? 'open' : 'index', renewalType: r() < 0.4 ? 'auto-renew' : 'fixed', noticePeriodDays: [14, 21, 30, 60, 90][i % 5],
        exclusivity: r() < 0.2 ? 'exclusive' : 'none', terminateForConvenience: r() < 0.5 ? 'no' : 'yes', effectiveDate: day(-300 + i * 9),
        paymentTerms: ['Net 30', 'Net 45', '60 days', 'Net 90', '30 days', 'Net 14', 'Net 60', '120 days'][i % 8] } };
    if (i < 26) {
      const nR = 1 + Math.floor(r() * 4), rounds = [];
      for (let k = 1; k <= nR; k++) {
        const ch = [];
        for (let j = 0; j < 1 + Math.floor(r() * 3); j++) ch.push({ id: `CHG-${i}-${k}-${j}`, clauseLabel: CL[Math.floor(r() * CL.length)],
          authorSide: r() < 0.55 ? 'owner' : 'counterparty', status: ['accepted', 'accepted', 'rejected'][Math.floor(r() * 3)],
          createdAt: iso(-200 + i * 5 + k * 3), resolvedAt: iso(-199 + i * 5 + k * 3), withdrawn: false });
        rounds.push({ n: k, changes: ch });
      }
      c.negotiation = { round: nR, rounds, startedAt: iso(-210 + i * 5), baselineBody: '<p>x</p>', baselineText: 'x', seq: 0, chainSeq: 0, chainHead: null, turn: 'owner', hashV: 2 };
      c.changes = [];
      if (status === 'Signed') c.execution = { at: iso(-190 + i * 5 + nR * 6) };
    }
    c.obligations = (i % 5 === 0) ? [] : Array.from({ length: 1 + (i % 4) }, (_, k) => ({ id: `ob-${i}-${k}`,
      desc: ['Deliver monthly report', 'Renew insurance certificate', 'Pay quarterly fee', 'Give renewal notice'][k % 4],
      due: day(Math.round(-60 + r() * 200)), party: k % 2 ? 'theirs' : 'ours', assignee: k % 2 ? '' : ['Amina Otieno', 'Brian Kariuki', ''][k % 3],
      status: r() < 0.2 ? 'done' : 'open', recurring: 'none', completedAt: iso(-10) }));
    out.push(c);
  }
  state.contracts = out;
}

async function measure(page, hostId) {
  return page.evaluate(id => {
    const host = document.getElementById(id);
    if (!host) return { missing: 'host' };
    const fit = host.querySelector('.igx-fit');
    if (!fit) return { missing: 'fit' };
    const hr = host.getBoundingClientRect(), fr = fit.getBoundingClientRect();
    const padB = parseFloat(getComputedStyle(host).paddingBottom) || 0;
    const rows = [...fit.querySelectorAll('.igx-row')].map(row => {
      const cards = [...row.children].filter(el => el.offsetParent !== null).map(el => el.getBoundingClientRect());
      const tops = cards.map(r => r.top), bots = cards.map(r => r.bottom);
      return { n: cards.length, dTop: cards.length ? Math.max(...tops) - Math.min(...tops) : 0,
        dBot: cards.length ? Math.max(...bots) - Math.min(...bots) : 0,
        stacked: cards.length > 1 && new Set(cards.map(r => Math.round(r.left))).size === 1 };
    });
    const clipped = [...fit.querySelectorAll('.igx-card')].filter(c => c.scrollHeight > c.clientHeight + 1)
      .map(c => (c.querySelector('h2,h3,b,strong') || c).textContent.trim().slice(0, 40));
    const first = fit.firstElementChild;
    const figs = fit.querySelector('.igx-figs');
    return {
      scrolls: host.scrollHeight > host.clientHeight + 1, over: host.scrollHeight - host.clientHeight,
      gap: Math.round((hr.bottom - padB) - fr.bottom),
      rows, clipped,
      figsLead: !!figs && (first === figs || (first && first.contains(figs)) || fit.querySelectorAll('.igx-figs').length === 1 && figs.getBoundingClientRect().top <= Math.min(...[...fit.querySelectorAll('.igx-card')].map(c => c.getBoundingClientRect().top)) + 1),
      tiles: figs ? figs.querySelectorAll('.igx-fig').length : 0,
    };
  }, hostId);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({});
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const [W, H] of [[1440, 900], [1920, 1080], [1000, 900]]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && typeof setView === 'function', null, { timeout: 15000 });
      await page.evaluate(seedBook);
      for (const [tab, hostId, label] of TABS) {
        await page.evaluate(t => { intel.tab = t; setView('intel'); }, tab);
        await page.waitForFunction(id => !!document.getElementById(id), hostId, { timeout: 8000 }).catch(() => {});
        await page.waitForFunction(() => document.fonts ? document.fonts.status === 'loaded' : true, null, { timeout: 5000 }).catch(() => {});
        const m = await measure(page, hostId);
        const at = `${label} at ${W}×${H}`;
        if (m.missing) { check(`${at}: the tab draws the fit grid`, false, 'no .igx-' + m.missing); continue; }
        if (W >= 1080) {
          check(`${at}: a  it fits one screen`, !m.scrolls, m.scrolls ? `scrolls ${m.over}px` : 'no scroll');
          check(`${at}: b  no empty band under the cards`, Math.abs(m.gap) <= 2, `${m.gap}px`);
          const bad = m.rows.filter(r => r.n > 1 && (r.dTop > 1 || r.dBot > 1));
          check(`${at}: c  cards in a row share top and bottom`, !bad.length, m.rows.map(r => `${r.n} cards Δ${r.dTop.toFixed(0)}/${r.dBot.toFixed(0)}`).join(' · ') || 'single-card rows');
          check(`${at}: d  no card hides what it cannot show`, !m.clipped.length, m.clipped.join(' | ') || 'clean');
          check(`${at}: e  the figures lead, in the shared tile`, m.figsLead && m.tiles >= 3, `${m.tiles} tiles`);
        } else {
          const side = m.rows.filter(r => r.n > 1 && !r.stacked);
          check(`${at}: narrow — the rows stack into one column`, !side.length, m.rows.map(r => r.stacked ? 'stacked' : `${r.n} side by side`).join(' · ') || 'single-card rows');
        }
        await page.screenshot({ path: path.join(OUT, `${tab}-${W}.png`) });
      }
      await ctx.close();
    }
    check('no page errors anywhere', !errors.length, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
