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
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762; owner's ruling 17 Nov 2026, answer 2: the old road column
       under the five parts stays gone): Before you sign is the FIVE PARTS (pd2SignRowsHtml, [data-pd2-sg]) — the checks as
       rows, each side's signature as a row in the route's order ("<party> signs", "Your turn"), "Then" the sealed copies
       last, and ONE black button: the first open check's own door while something holds the signature, the card's Sign
       only when nothing holds and it is the reader's turn. The reader is read off those painted rows and buttons. */
    const ROAD = () => { const f = document.getElementById('pd-signface'); const w = f && f.querySelector('[data-pd2-sg]'); if (!w) return null;
      const vis = e => !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().height > 0;
      const stops = [...w.querySelectorAll('.pd2-sg-r')].map((x, i) => ({ k: i, cls: x.className.replace('pd2-sg-r ', ''), t: (x.querySelector('b') || {}).textContent || '', sub: (x.querySelector('small') || {}).textContent || '', vis: vis(x) }));
      const btns = [...w.querySelectorAll('button')].filter(vis);
      const sign = btns.find(b => b.hasAttribute('data-pd2-sign') || /^Sign\b/.test(b.textContent.trim()));
      const lead = btns.find(b => b.classList.contains('ui-btn-primary'));
      return { stops, btn: sign ? { vis: true, disabled: !!sign.disabled || sign.getAttribute('aria-disabled') === 'true', text: sign.textContent.replace(/\s+/g, ' ').trim() } : null,
        lead: lead ? { text: lead.textContent.trim(), door: [...lead.attributes].map(x => x.name).filter(n => /^data-pd-(ds|og)/.test(n))[0] || null } : null }; };
    const setPlan = plan => page.evaluate(p => { const c = getContract('MK-0391'); c.signerPlan = p; if (window.renderSignButton) renderSignButton(c); }, plan);

    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-0391', 'copilot'); });
    await until(() => !!document.getElementById('ig-canvas'));
    const at0 = await sheetAt();
    await page.evaluate(() => pdSignOpen('MK-0391'));
    await until(() => document.querySelectorAll('#pd-signface [data-pd2-sg] .pd2-sg-r').length >= 3);

    /* 1 the stops */
    const R1 = await page.evaluate(ROAD);
    const ks = R1.stops.map(s => s.k);
    void ks;
    check('1a the way to "signed" as rows: the checks, who signs, then sealed and sent, each drawn', R1.stops.length >= 3 && R1.stops.every(x => x.vis)
      && R1.stops.some(x => x.t === 'Who signs') && /sealed and sent/.test(R1.stops[R1.stops.length - 1].t), JSON.stringify(R1.stops));
    /* RETIRED 17 Nov 2026 (#762, owner's ruling): 1b "the road is at its first open stop, and the column's body stands open
       under it" — the road and its column stay gone (owner, 17 Nov 2026, answer 2) */
    check('1c "Nobody is named to sign yet" while no signer is', R1.stops.some(x => x.t === 'Who signs' && /Nobody is named/.test(x.sub) && /is-now/.test(x.cls)), JSON.stringify(R1.stops));
    /* the foot may stay for the route's own link ("Signing it their way…"); the Sign button is what is held back */
    check('2a nobody\'s turn on our side: no Sign button', !R1.btn || !R1.btn.vis, JSON.stringify({ foot: R1.foot, btn: R1.btn }));
    await shot(page, 'the-road-1440x780');

    /* 2 their turn; reserved for somebody else */
    await setPlan([{ id: 's-cp', party: 'counterparty', name: 'Henrik Dahl', email: 'henrik@helio.example', order: 1 }, { id: 's-us', party: 'internal', name: me.name, memberId: me.id, order: 2 }]);
    const R2 = await page.evaluate(ROAD);
    const theirStop = R2.stops.find(x => /Helio Energy AB signs/.test(x.t)), ourStop = R2.stops.find(x => /signs/.test(x.t) && !/Helio/.test(x.t));
    check('2b each step of the route is a row, in order, named for its side: theirs now, ours after', !!theirStop && !!ourStop && /is-turn/.test(theirStop.cls) && /is-later/.test(ourStop.cls)
      && /Henrik Dahl/.test(theirStop.sub) && theirStop.k < ourStop.k, JSON.stringify(R2.stops));
    check('2c their turn: no Sign button for us', !R2.btn || !R2.btn.vis, JSON.stringify({ foot: R2.foot, btn: R2.btn }));
    await setPlan([{ id: 's-us', party: 'internal', name: 'Somebody Else', memberId: 'u_somebody_else', order: 1 }]);
    const R3 = await page.evaluate(ROAD);
    check('2d the next signer reserved for somebody else: no Sign button', !R3.btn || !R3.btn.vis, JSON.stringify({ foot: R3.foot, btn: R3.btn }));

    /* 3 my turn */
    await setPlan([{ id: 's-us', party: 'internal', name: me.name, memberId: me.id, order: 1 }, { id: 's-cp', party: 'counterparty', name: 'Henrik Dahl', email: 'henrik@helio.example', order: 2 }]);
    const R4 = await page.evaluate(ROAD);
    const mine = R4.stops.find(x => x.t === 'Your turn');
    /* the five parts (owner, 15 Nov 2026, "Build as drawn"): my turn is said as our signing row, and while something
       still holds the signature the black button is the first open check's own door — never a Sign to press */
    check('3a my turn: our signing row says it is mine, before theirs', !!mine && /is-turn/.test(mine.cls) && new RegExp(me.name).test(mine.sub)
      && R4.stops.findIndex(x => /Helio Energy AB signs/.test(x.t)) > mine.k, JSON.stringify(R4.stops));
    check('3b while something still holds, no Sign: the black button is the first open check\'s door', !R4.btn && !!R4.lead && !!R4.lead.door, JSON.stringify({ btn: R4.btn, lead: R4.lead }));

    /* 4 signed */
    await page.evaluate(() => { const c = getContract('MK-0391'); c.status = 'Signed'; c.signerPlan.forEach(r => { r.signed = true; r.at = new Date().toISOString(); }); if (window.renderSignButton) renderSignButton(c); });
    await until(() => { const r = document.querySelectorAll('#pd-signface [data-pd2-sg] .pd2-sg-r'); return r.length && [...r].every(x => x.classList.contains('is-done')); }, null, 5000);
    const R5 = await page.evaluate(ROAD);
    /* RE-POINTED 17 Nov 2026 (#762): the receipt's own acts are measured by the signed face's checks; here every row ticked */
    check('4 signed: every row ticked, both sides\' signatures among them', R5.stops.length >= 3 && R5.stops.every(x => x.cls.includes('is-done'))
      && R5.stops.filter(x => /signed$/.test(x.t)).length === 2, JSON.stringify(R5.stops.map(x => x.cls + ':' + x.t)));
    await page.evaluate(() => { const c = getContract('MK-0391'); c.status = 'Under Review'; c.signerPlan = []; if (window.renderSignButton) renderSignButton(c); });

    /* 5 the paper and the screens */
    const at1 = await sheetAt();
    /* RE-POINTED (the gaps' third pass, 18 Oct 2026; round 10 as drawn: "the page arrows and size sit in
       the head card, so nothing is added above the paper … the signing copy starts a little higher than
       today, never lower"): it moves only up, by the zoom row's room */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the signing copy is drawn with its one caption line
       over it (".ig-sg-cap", BEFORE YOU SIGN AS DRAWN); that line, and nothing else, may stand above it */
    const capH = await page.evaluate(() => { const c = document.querySelector('#ig-paper .ig-sg-cap'); if (!c || !c.getClientRects().length) return 0;
      const cs = getComputedStyle(c); return Math.round(c.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0)); });
    check('5a the paper moves only up — nothing above the signing copy', at0 != null && at1 != null && at1 <= at0 + capH && at0 + capH - at1 <= 40, `${at0} → ${at1} (caption ${capH})`);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      /* RE-POINTED 17 Nov 2026 (#762): the head is the five parts' own head, the first stop their first row — both painted */
      const S = await page.evaluate(() => { const f = document.getElementById('pd-signface'), w = f && f.querySelector('[data-pd2-sg]'), hd = w && w.firstElementChild, st = w && w.querySelector('.pd2-sg-r');
        const r = hd && hd.getBoundingClientRect(), s = st && st.getBoundingClientRect();
        return { head: !!r && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, first: !!s && s.height > 0 && s.top >= 0 && s.bottom <= innerHeight, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
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
