/* DISCOVER — THE THREE SCREENS (CLAUDE.md: "every visual change is
   photographed at ALL THREE before a merge, a fit check runs at the
   shortest"). Not a test: it drives each new screen of docs/PLAN-jambo-
   discover.md at 1440×780, 1536×730 and 1366×950, measures that nothing
   scrolls sideways (the page, Jambo's panel, the list's cells inside their
   column), and saves a picture of each to DISCOVER_SHOTS (default
   test/chromium/shots/discover-screens). Exits 1 when a fit check fails.
   Run: node test/chromium/discover-photos.js */
/* global regPlaceSet, setView, state, api, regState, regRepaint, askColBring, askColSummary, renderIntelDock, openSettingsAt,
   regOpenContract, pdContract, apSetTab, cuSelectParty, closeModal */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const OUT = process.env.DISCOVER_SHOTS || path.join(__dirname, 'shots', 'discover-screens');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const until = async (page, fn, arg, ms = 10000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
let bad = 0;
const fit = async (page, name) => {
  const m = await page.evaluate(() => {
    const over = el => el ? el.scrollWidth - el.clientWidth : 0;
    const cells = [...document.querySelectorAll('td.ac-cell .ac-ans')].filter(a => { const td = a.closest('td'); return a.getBoundingClientRect().right > td.getBoundingClientRect().right + 1; }).length;
    return { page: document.documentElement.scrollWidth - window.innerWidth, dock: over(document.querySelector('#ig-dock')), ins: over(document.querySelector('#ins-panel')), cells };
  });
  const ok = m.page <= 0 && m.dock <= 1 && m.ins <= 1 && m.cells === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'FITS' : 'SPILLS'}  ${name}  ${JSON.stringify(m)}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedDiscoverWorld(h);
  const CAP = 'Is our liability capped, and at what?';
  const k = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: ['DV-11'] } });
  await W.admin.json('/api/columns/' + k.ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees', fact: true } });
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r-dv', name: 'Finance director', order: 1,
    cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } }] } });
  await W.admin.json('/api/contracts/DV-AP1', { method: 'PUT', body: { baseVersion: 0, contract: { id: 'DV-AP1', name: 'Managed IT Services', counterparty: 'Equity Bank',
    folder: 'sales', status: 'Under Review', value: 145000000, expiry: '2028-01-31', valueType: 'standard', template: 'RM', fields: {}, metadata: { value: 145000000, currency: 'KES' },
    comments: [], audit: [], signatures: [], format: 'text', redlineText: 'MANAGED IT SERVICES\n\n1. Liability\nNothing in this Agreement limits the Supplier\'s liability arising from the Services.' } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [wd, ht] of SCREENS) {
      const page = await browser.newPage({ viewport: { width: wd, height: ht } });
      const tag = `${wd}x${ht}`;
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 11 && typeof window.regPlaceSet === 'function', null, 20000);
      const list = async () => { await page.evaluate(() => { try { if (document.querySelector('#modal-root [role="dialog"]')) closeModal(); } catch (_) {} regPlaceSet({ show: 'list' }); setView('register'); });
        await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]')); };
      /* 1 the column, the Legora way */
      await list();
      await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: ['DV-01', 'DV-02', 'DV-03', 'DV-04', 'DV-05', 'DV-06', 'DV-07', 'DV-08', 'DV-09', 'DV-10', 'DV-11'],
        texts: { 'DV-11': 'COURIER SERVICES. The liability of either party under this agreement is limited to the fees paid in the twelve months before the claim, and nothing more.' } } });
      await page.evaluate(id => { regState().ask = [id]; regRepaint(); return askColSummary(true).then(() => askColBring(id)); }, k.ask.id);
      await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans').length >= 10 && /answered/.test((document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || ''));
      await page.waitForTimeout(300);
      await fit(page, `${tag} 1 the column`); await page.screenshot({ path: path.join(OUT, `${tag}-1-column.png`) });
      /* 2 Discover under the greeting */
      await page.evaluate(() => { regState().ask = []; regRepaint(); });
      await list();
      await page.evaluate(() => askColSummary(true).then(() => renderIntelDock()));
      await until(page, () => !!document.querySelector('#ig-dock #ac-disc [data-ac-pack]'));
      await fit(page, `${tag} 2 discover`); await page.screenshot({ path: path.join(OUT, `${tag}-2-discover.png`) });
      /* 3 the pack form */
      await page.click('#ig-dock [data-ac-pack]'); await until(page, () => !!document.querySelector('#ig-dock [data-ac-pack-form]'));
      await fit(page, `${tag} 3 pack form`); await page.screenshot({ path: path.join(OUT, `${tag}-3-pack.png`) });
      await page.click('#ig-dock [data-ac-cancel]');
      /* 4 the company facts in Settings */
      await page.evaluate(() => openSettingsAt('platform', 'facts'));
      await until(page, () => /Liability cap/.test((document.querySelector('#fa-panel') || {}).innerText || ''));
      await fit(page, `${tag} 4 settings facts`); await page.screenshot({ path: path.join(OUT, `${tag}-4-facts.png`) });
      /* 5 Unusual for you on DV-04's Dossier */
      await list();
      await page.evaluate(() => regOpenContract('DV-04'));
      await until(page, () => typeof pdContract === 'function' && pdContract() && pdContract().id === 'DV-04');
      await until(page, () => /Unusual for you/.test((document.querySelector('[data-ac-odd-for="DV-04"]') || {}).innerText || ''));
      /* the panel's face change crossfades: the picture waits for it to end */
      await page.waitForTimeout(900);
      await fit(page, `${tag} 5 dossier`); await page.screenshot({ path: path.join(OUT, `${tag}-5-dossier.png`) });
      /* 6 what you are approving */
      await page.evaluate(() => { apSetTab('approvals'); setView('approvals'); });
      if (await until(page, () => !!document.querySelector('[data-ap-row="DV-AP1"]'))) await page.click('[data-ap-row="DV-AP1"]');
      await until(page, () => !!document.querySelector('#ins-panel [data-ap-what-for]'));
      await fit(page, `${tag} 6 approvals`); await page.screenshot({ path: path.join(OUT, `${tag}-6-approvals.png`) });
      /* 7 the party's two minutes */
      await page.evaluate(() => cuSelectParty('siginon group'));
      /* the brief written on an earlier screen is kept: shown, not asked again */
      await until(page, () => !!document.querySelector('#ins-panel [data-cu-brief]') || !!document.querySelector('#ins-panel .cu-br-text'));
      if (await page.$('#ins-panel [data-cu-brief]')) await page.click('#ins-panel [data-cu-brief]');
      await until(page, () => !!document.querySelector('#ins-panel .cu-br-text'));
      await page.waitForTimeout(400);
      await fit(page, `${tag} 7 party`); await page.screenshot({ path: path.join(OUT, `${tag}-7-party.png`) });
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(bad ? `${bad} screens spill` : 'every screen fits');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
