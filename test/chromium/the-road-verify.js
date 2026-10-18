/* BEFORE YOU SIGN, "THE ROAD" (round 10 of the redesign: the owner picked
   "The road" by name and said yes to the Sign button appearing only to the
   person whose turn it is, 17 Oct 2026; js/paperdesk.js pdRoadStops)

   WHAT THIS PINS, driven in a real browser on a contract under review
     1 the way to "signed" as stops: Ready to sign, who signs (each step of the
       route, or "Nobody is named" while none is), Sealed and sent — the
       column's body open under the stop the road is at
     2 the Sign button is not drawn while it is nobody's turn on our side, nor
       while it is theirs, nor where the next signer is reserved for somebody
       else
     3 it stands in our signing stop where it is the reader's turn — grey
       with its reason while something still holds
     4 signed, every stop is ticked and the receipt stands under the last
     5 the paper does not move; the owner's three screens: the head in view,
       nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/the-road-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const DOC = ['POWER PURCHASE AGREEMENT', '', '1. Supply', '', 'The Seller delivers electricity from the Solberga solar park to the Buyer at the delivery point for the whole term.', '',
  '2. Price', '', 'The Buyer pays a fixed price per megawatt hour as set out in Schedule 1.'].join('\n');

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0391', 'Power purchase agreement', 'Helio Energy AB', H.FOLDER_A, 8100000, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-0391', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0391'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(async () => { const c = getContract('MK-0391'); if (c._light && window.ensureFull) await ensureFull(c); });
    const sheetAt = () => page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'), sh = document.querySelector('#ig-paper .pg-sheet, #ig-paper .doc-surface'); return sc && sh ? Math.round(sh.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop) : null; });
    const ROAD = () => { const f = document.getElementById('pd-signface'); if (!f) return null;
      const stops = [...f.querySelectorAll('[data-pd-road-stop]')].map(x => ({ k: x.getAttribute('data-pd-road-stop'), cls: x.className.replace('pd-road-stop ', ''), t: x.querySelector('b').textContent, sub: (x.querySelector('small') || {}).textContent || '', order: Number(x.style.order) }));
      const body = f.querySelector('.pd-sf-body'), foot = f.querySelector('.pd-sf-foot'), btn = document.getElementById('sign-btn');
      return { stops, bodyOrder: Number(body && body.style.order), foot: foot ? { order: Number(foot.style.order), shown: foot.style.display !== 'none' && !!foot.getClientRects().length } : null,
        btn: btn ? { vis: !!btn.getClientRects().length, disabled: !!btn.disabled || btn.getAttribute('aria-disabled') === 'true', text: btn.textContent.replace(/\s+/g, ' ').trim() } : null }; };
    const setPlan = plan => page.evaluate(p => { const c = getContract('MK-0391'); c.signerPlan = p; if (window.renderSignButton) renderSignButton(c); }, plan);

    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-0391', 'copilot'); });
    await until(() => !!document.getElementById('ig-canvas'));
    const at0 = await sheetAt();
    await page.evaluate(() => pdSignOpen('MK-0391'));
    await until(() => document.querySelectorAll('#pd-signface [data-pd-road-stop]').length >= 3);

    /* 1 the stops */
    const R1 = await page.evaluate(ROAD);
    const ks = R1.stops.map(s => s.k);
    check('1a the way to "signed" as stops: Ready to sign, who signs, sealed and sent', ks[0] === 'ready' && ks.includes('who') && ks[ks.length - 1] === 'sealed', JSON.stringify(R1.stops));
    check('1b the road is at its first open stop, and the column\'s body stands open under it', R1.stops[0].cls.includes('is-now') && R1.bodyOrder === R1.stops[0].order + 1, JSON.stringify({ body: R1.bodyOrder, first: R1.stops[0] }));
    check('1c "Nobody is named to sign yet" while no signer is', R1.stops.some(s => s.k === 'who' && /Nobody is named/.test(s.sub)), JSON.stringify(R1.stops));
    /* the foot may stay for the route's own link ("Signing it their way…"); the Sign button is what is held back */
    check('2a nobody\'s turn on our side: no Sign button', !R1.btn || !R1.btn.vis, JSON.stringify({ foot: R1.foot, btn: R1.btn }));
    await shot(page, 'the-road-1440x780');

    /* 2 their turn; reserved for somebody else */
    await setPlan([{ id: 's-cp', party: 'counterparty', name: 'Henrik Dahl', email: 'henrik@helio.example', order: 1 }, { id: 's-us', party: 'internal', name: me.name, memberId: me.id, order: 2 }]);
    const R2 = await page.evaluate(ROAD);
    const theirStop = R2.stops.find(s => /Helio Energy AB signs/.test(s.t)), ourStop = R2.stops.find(s => /signs/.test(s.t) && !/Helio/.test(s.t));
    check('2b each step of the route is a stop, in order, named for its side: theirs now, ours after', !!theirStop && !!ourStop && /their turn now/.test(theirStop.sub) && /after the step before/.test(ourStop.sub) && theirStop.order < ourStop.order, JSON.stringify(R2.stops));
    check('2c their turn: no Sign button for us', !R2.btn || !R2.btn.vis, JSON.stringify({ foot: R2.foot, btn: R2.btn }));
    await setPlan([{ id: 's-us', party: 'internal', name: 'Somebody Else', memberId: 'u_somebody_else', order: 1 }]);
    const R3 = await page.evaluate(ROAD);
    check('2d the next signer reserved for somebody else: no Sign button', !R3.btn || !R3.btn.vis, JSON.stringify({ foot: R3.foot, btn: R3.btn }));

    /* 3 my turn */
    await setPlan([{ id: 's-us', party: 'internal', name: me.name, memberId: me.id, order: 1 }, { id: 's-cp', party: 'counterparty', name: 'Henrik Dahl', email: 'henrik@helio.example', order: 2 }]);
    const R4 = await page.evaluate(ROAD);
    const mine = R4.stops.find(s => /your turn/.test(s.sub));
    check('3a my turn: the Sign button stands in our signing stop', !!mine && R4.foot && R4.foot.shown && R4.foot.order === mine.order + 1 && R4.btn && R4.btn.vis, JSON.stringify({ mine, foot: R4.foot }));
    check('3b grey, with its reason, while something still holds', R4.btn && /to settle/.test(R4.btn.text), JSON.stringify(R4.btn));

    /* 4 signed */
    await page.evaluate(() => { const c = getContract('MK-0391'); c.status = 'Signed'; c.signerPlan.forEach(r => { r.signed = true; r.at = new Date().toISOString(); }); if (window.renderSignButton) renderSignButton(c); });
    await until(() => { const r = document.querySelectorAll('#pd-signface [data-pd-road-stop]'); return r.length && [...r].every(x => x.classList.contains('is-done')); }, null, 5000);
    const R5 = await page.evaluate(ROAD);
    check('4 signed: every stop ticked, the receipt under the last', R5.stops.every(s => s.cls.includes('is-done')) && R5.bodyOrder === R5.stops[R5.stops.length - 1].order + 1, JSON.stringify({ stops: R5.stops.map(s => s.cls), body: R5.bodyOrder }));
    await page.evaluate(() => { const c = getContract('MK-0391'); c.status = 'Under Review'; c.signerPlan = []; if (window.renderSignButton) renderSignButton(c); });

    /* 5 the paper and the screens */
    const at1 = await sheetAt();
    check('5a the paper does not move', at0 != null && at1 === at0, `${at0} → ${at1}`);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const S = await page.evaluate(() => { const f = document.getElementById('pd-signface'), hd = f && f.querySelector('.pd-sf-h'), st = f && f.querySelector('[data-pd-road-stop]');
        const r = hd && hd.getBoundingClientRect(), s = st && st.getBoundingClientRect();
        return { head: !!r && r.top >= 0 && r.bottom <= innerHeight, first: !!s && s.bottom <= innerHeight, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: the head and the first stop in view, nothing sideways`, S.head && S.first && S.side, JSON.stringify(S));
      await shot(page, `the-road-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
