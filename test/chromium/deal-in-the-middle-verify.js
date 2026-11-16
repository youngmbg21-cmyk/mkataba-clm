/* ============================================================
   DEAL IN THE MIDDLE (now gone, f1084), RISKS LAND ON THEIR LIST, ONE NEGOTIATE PAGE LESS
   (owner, 23 Oct 2026: "get rid of this duplicate page but take the Deal
   board button … call it Deal"; picked "The Legora Way"; "when you press on
   risk to look at it should take you to where risks are … and place you
   there"; the File / Save button "prominent, slightly longer")
   ============================================================
   1  THE DEAL TAB AND THE CLOSE PLAN ARE GONE (owner, 16 Nov 2026, f1084):
      the Redlines face carries no Deal; its switch is Changes · Notes ·
      Ladder, at the owner's three screens (was: Deal opened the close plan,
      checks 1–7, removed with it)
   8  the old Negotiate page is not drawn over Home by a stray repaint
   9  the Dossier's Risks to look at › Open lands ON the face's risk list,
      no clause editor
   10 the clause editor's File / Save is a full-height control, 110px or
      wider, solid when greyed
   Every step is pressed, never called, where a person presses it; each wait
   asks for the state, bounded, and a missing part reports.
   Run: node test/chromium/deal-in-the-middle-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'deal-in-the-middle');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const DOC = ['WAREHOUSING AGREEMENT', '', '1. Scope', '', 'The Supplier shall deliver the Services described in Schedule 1.', '',
  '5. Payment', '', 'Customer shall pay each correct invoice within 90 days of receipt.', '',
  '26. Limitation of liability', '', 'Each Party\'s total liability shall not exceed twelve months of Charges.'].join('\n');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(120); } return false; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const W = await seedWorkspace(h, { approvalRules: [] });
    const me = (await W.admin.json('/api/bootstrap')).me;
    const r1 = fixtureContract('MK-R1', 'Warehousing Agreement', 'Parcelway ApS', FOLDER_A, 900000, 'Under Review', DOC);
    r1.owner = { id: me.id, name: me.name };
    await W.admin.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: r1, baseVersion: 0 } });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c.id === 'MK-R1'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    /* their ask on Payment, our unsent draft on Liability, and the free risk scan */
    await page.evaluate(async () => { const c = getContract('MK-R1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      negoInit(c);
      await negoFileProposal(c, negoBaseText(c).replace('90 days', '30 days'), { side: 'counterparty', author: 'Erik' });
      await negoFileProposal(c, negoBaseText(c).replace('twelve months', 'three months'), { side: 'owner', author: 'Me' });
      if (typeof runScanFor === 'function') await runScanFor(c); });

    const openFace = async () => {
      await page.evaluate(() => { if (typeof closeModal === 'function') try { closeModal(); } catch (_) { /* none open */ } openRedlineWorkbench('MK-R1'); });
      await pause(300);
      await page.evaluate(() => { const b = document.querySelector('#confirm-overlay #cf-cancel'); if (b) b.click(); });
      return waitFor(page, () => !!document.querySelector('#ig-dock [data-pd-rf]'), 10000);
    };
    /* a press on a part that is not there reports (false) rather than waiting out a timeout */
    const press = async sel => { const el = await page.$(sel); if (!el) return false; await el.click({ timeout: 4000 }).catch(() => false); return true; };

    /* 1 — no Deal on the face, at the three screens (f1084) */
    const seen = [];
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh }); await pause(300);
      const ok = await openFace();
      const b = ok ? await page.evaluate(() => ({ deal: document.querySelectorAll('[data-rl-deal], [data-rl-board], [data-deal-mid]').length,
        seg: [...document.querySelectorAll('#ig-dock .rl-seg[role="group"] button')].map(x => x.textContent.replace(/\d+/g, '').trim()) })) : null;
      seen.push({ w, hh, ok, b });
      await page.screenshot({ path: path.join(OUT, `1-face-${w}x${hh}.png`) });
    }
    check('1 the Redlines face carries no Deal and no close plan; the switch has no Deal, at the three screens',
      seen.every(x => x.ok && x.b && x.b.deal === 0 && !x.b.seg.includes('Deal')), seen);
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);
    await openFace();

    /* 8 — a stray repaint draws no Negotiate page over Home */
    await page.evaluate(() => { try { renderRedline(); } catch (_) { /* reported below */ } });
    await pause(600);
    const s8 = await page.evaluate(() => ({ view: state.view, page: !!document.querySelector('[data-rl-open-ws]') }));
    check('8 the old Negotiate page is not drawn over Home', s8.view === 'dashboard' && !s8.page, s8);

    /* 9 — Risks to look at › Open */
    await page.evaluate(() => { if (typeof pdRedClose === 'function') pdRedClose(); });
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the new look's Dossier card carries the risks'
       door (data-pd-gl-risks) on its own rows (the road's "fix" row, the risk quotes' "more"), not the old glance list */
    const rk = await waitFor(page, () => [...document.querySelectorAll('#ig-dock [data-pd-gl-risks]')].some(b => b.getBoundingClientRect().width > 0), 8000);
    if (rk) await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock [data-pd-gl-risks]')].find(x => x.getBoundingClientRect().width > 0); if (b) b.click(); });
    await waitFor(page, () => { const r = document.querySelector('#ig-dock #rl-risks'); return !!(r && r.classList.contains('is-landed')); }, 8000);
    const s9 = await page.evaluate(() => { const r = document.querySelector('#ig-dock #rl-risks'); const d = document.getElementById('ig-dock');
      const rr = r && r.getBoundingClientRect(), dr = d && d.getBoundingClientRect();
      return { face: pdFaceNow(), landed: !!(r && r.classList.contains('is-landed')), inView: !!(rr && dr && rr.top >= dr.top && rr.top < dr.bottom), editor: !!document.querySelector('#clause-editor') }; });
    check('9 Risks to look at › Open lands on the Redlines face\'s risk list, no clause editor', rk && s9.face === 'red' && s9.landed && s9.inView && !s9.editor, s9);
    await page.screenshot({ path: path.join(OUT, '9-risks.png') });

    /* 10 — the clause editor's File / Save */
    const cid = await page.evaluate(() => { const k = negoClauseList(getContract('MK-R1')).find(x => /Scope/.test(x.heading || x.label || x.text || '')) || negoClauseList(getContract('MK-R1'))[0]; return k && k.clauseId; });
    await page.evaluate(id => { if (typeof rlOpenClauseEditor === 'function') rlOpenClauseEditor(getContract('MK-R1'), id); }, cid);
    const ce = await waitFor(page, () => !!document.querySelector('#ce-railfoot [data-ce-act="save"]'), 8000);
    const s10 = ce ? await page.evaluate(() => { const b = document.querySelector('#ce-railfoot [data-ce-act="save"]'); const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, disabled: b.disabled, painted: !!at && (at === b || b.contains(at)) }; }) : null;
    check('10 File / Save is full height, 110px or wider, painted, solid when greyed', s10 && s10.w >= 110 && s10.h >= 30 && s10.painted && Number(s10.opacity) === 1, s10);
    await page.screenshot({ path: path.join(OUT, '10-editor.png') });

    check('no page errors', errors.length === 0, errors.length ? errors : 'none');
  } catch (e) {
    check('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    const fail = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - fail}/${results.length} passed — photographs in ${OUT}`);
    process.exit(fail ? 1 : 0);
  }
})();
