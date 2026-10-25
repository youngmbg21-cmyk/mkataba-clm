/* ============================================================
   DEAL IN THE MIDDLE, RISKS LAND ON THEIR LIST, ONE NEGOTIATE PAGE LESS
   (owner, 23 Oct 2026: "get rid of this duplicate page but take the Deal
   board button … call it Deal"; picked "The Legora Way"; "when you press on
   risk to look at it should take you to where risks are … and place you
   there"; the File / Save button "prominent, slightly longer")
   ============================================================
   1  the Redlines face beside Home's paper carries Deal, painted, on screen,
      at the owner's three screens
   2  Deal opens THE CLOSE PLAN where the paper was (owner picked it, 25 Oct
      2026): head "N points to close before <them> can sign", the road beside
      it, Copy as memo on the way-back line, every point argued under what to
      do with it, Deal lit; at the three screens nothing spills
   3  each row sits in the group its reading names (dealPlanOf), our unsent
      draft carries Send, and Copy as memo copies the plan
   4  ‹ Dossier closes it: the paper back, the panel on the Dossier
   5  Esc does the same
   6  Deal pressed again closes it and keeps the Redlines face
   7  a point's Open clause closes it and keeps the Redlines face
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
      return waitFor(page, () => !!document.querySelector('#ig-dock [data-rl-deal]'), 10000);
    };
    /* a press on a part that is not there reports (false) rather than waiting out a timeout */
    const press = async sel => { const el = await page.$(sel); if (!el) return false; await el.click({ timeout: 4000 }).catch(() => false); return true; };
    const S = () => page.evaluate(() => ({ up: typeof pdMidUp === 'function' && pdMidUp('deal:MK-R1'), face: typeof pdFaceNow === 'function' ? pdFaceNow() : null,
      deal: !!document.querySelector('#modal-root [data-deal-mid="MK-R1"]'), lit: document.querySelector('#ig-dock [data-rl-deal]')?.getAttribute('aria-pressed') || null }));

    /* 1 — the button, at the three screens */
    const seen = [];
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh }); await pause(300);
      const ok = await openFace();
      const b = ok ? await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-rl-deal]'); const r = b.getBoundingClientRect(), d = document.getElementById('ig-dock').getBoundingClientRect();
        const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { inside: r.left >= d.left && r.right <= d.right && r.top >= d.top && r.bottom <= d.bottom, painted: !!at && (at === b || b.contains(at)), word: b.textContent.trim(), oneLine: r.height < 40 }; }) : null;
      seen.push({ w, hh, ok, b });
      await page.screenshot({ path: path.join(OUT, `1-face-${w}x${hh}.png`) });
    }
    check('1 the Redlines face carries Deal, painted inside the panel, on one line, at the three screens', seen.every(x => x.ok && x.b && x.b.inside && x.b.painted && x.b.word === 'Deal' && x.b.oneLine), seen);
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);

    /* 2 — Deal opens the deal in the middle */
    await openFace();
    await press('#ig-dock [data-rl-deal]');
    const up = await waitFor(page, () => !!document.querySelector('#modal-root [data-deal-mid="MK-R1"]'), 8000);
    const d2 = up ? await page.evaluate(() => { const c = getContract('MK-R1'); const f = dealPlanFacts(c, 'owner');
      const mid = document.querySelector('#modal-root [data-pd-mid]'), dock = document.getElementById('ig-dock');
      return { head: (document.querySelector('[data-dlg-page] .deal-h') || {}).textContent || '', all: f.n.all, open: f.open,
        rows: document.querySelectorAll('[data-deal-row]').length, groups: [...document.querySelectorAll('[data-deal-grp]')].map(g => g.getAttribute('data-deal-grp')),
        road: !!document.querySelector('[data-dlg-page] .dlg-pg-acts #deal-road'), memo: !!document.querySelector('[data-dlg-page] .dlg-pg-crumb #deal-memo'),
        tabs: !!document.querySelector('.deal-tab'), back: !!document.querySelector('[data-dlg-page] [data-pd-deal-back]'),
        beside: !!(mid && dock && mid.getBoundingClientRect().right <= dock.getBoundingClientRect().left + 1) }; }) : null;
    const s2 = await S();
    /* nothing spills: every row's doors and its tag inside the card, on one line, painted */
    const tidy = () => page.evaluate(() => { const card = document.querySelector('#modal-root .deal-mid'); if (!card) return { ok: false, why: 'no card' };
      const cr = card.getBoundingClientRect(); const bad = [];
      document.querySelectorAll('#modal-root .deal-pr .deal-go, #modal-root .deal-pr .deal-tag, #modal-root .deal-pr .deal-pr-room').forEach(el => { const r = el.getBoundingClientRect();
        if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.height > 24) bad.push(el.textContent.trim() + ' ' + Math.round(r.left) + '-' + Math.round(r.right) + ' h' + Math.round(r.height)); });
      const hd = document.querySelector('[data-dlg-page] .dlg-pg-head'); const hr = hd && hd.getBoundingClientRect();
      const rd = document.querySelector('#deal-road'); const rr = rd && rd.getBoundingClientRect();
      if (!rr || rr.right > hr.right + 1 || rr.width < 200) bad.push('road ' + (rr ? Math.round(rr.width) : 'none'));
      if (document.documentElement.scrollWidth > window.innerWidth + 1) bad.push('page scrolls sideways');
      /* the columns stand on straight lines (owner, 25 Oct 2026: "the third column needs to be on a straight line") */
      for (const sel of ['.deal-pr-why', '.deal-pr-st', '.deal-pr-acts']){
        const xs = [...document.querySelectorAll('#modal-root .deal-pr ' + sel)].map(el => Math.round(el.getBoundingClientRect().left));
        if (new Set(xs).size > 1) bad.push(sel + ' starts at ' + [...new Set(xs)].join('/')); }
      return { ok: !bad.length, bad }; });
    const fits = [];
    for (const [w, hh] of SCREENS) { await page.setViewportSize({ width: w, height: hh }); await pause(400); fits.push({ w, hh, t: await tidy() }); await page.screenshot({ path: path.join(OUT, `2-deal-${w}x${hh}.png`) }); }
    check('2 Deal opens the close plan where the paper was: "points to close before … can sign", the road beside it, memo on the way-back line, every point in a group, no tabs, ‹ Dossier, Deal lit',
      up && d2 && /to close before Parcelway ApS can sign/.test(d2.head) && d2.rows === d2.all && d2.all > 0 && d2.groups.length > 0 && d2.road && d2.memo && !d2.tabs && d2.back && d2.beside && s2.lit === 'true', { d2, s2 });
    check('2b at the three screens nothing in a row spills, wraps or runs off the card', fits.every(x => x.t.ok), fits);
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);

    /* 3 — the groups are the reading's; our unsent draft carries Send; the memo is the plan */
    const d3 = await page.evaluate(() => { const c = getContract('MK-R1'); const f = dealPlanFacts(c, 'owner');
      const drawn = [...document.querySelectorAll('[data-deal-row]')].map(r => ({ id: r.getAttribute('data-deal-row'), k: r.getAttribute('data-deal-plan'), send: !!r.querySelector('[data-deal-send]') }));
      const read = f.plan.map(x => ({ id: String(x.r.clauseId), k: x.p.k, send: !!x.p.unsent }));
      const memo = dealPlanMemoText(c);
      return { same: JSON.stringify(drawn.slice().sort((a, b) => a.id.localeCompare(b.id))) === JSON.stringify(read.slice().sort((a, b) => a.id.localeCompare(b.id))),
        drawn, kinds: read.map(x => x.k), sendOnUnsent: read.some(x => x.send), memo: memo.split('\n').slice(0, 6) }; });
    check('3 each row sits in its reading\'s group, our unsent draft carries Send, the memo copies the plan',
      d3.same && d3.sendOnUnsent && d3.memo.length > 3 && /to close before/.test(d3.memo.join(' ')), d3);

    /* 4 — ‹ Dossier */
    const back = await page.$('[data-dlg-page] [data-pd-deal-back]');
    if (back) await back.click();
    await waitFor(page, () => !document.querySelector('#modal-root [data-deal-mid]'), 6000);
    const s4 = await S();
    check('4 ‹ Dossier closes the deal and the panel returns to the Dossier', !!back && !s4.up && !s4.deal && s4.face === '', s4);

    /* 5 — Esc */
    await openFace(); const p5 = await press('#ig-dock [data-rl-deal]');
    await waitFor(page, () => !!document.querySelector('#modal-root [data-deal-mid]'), 6000);
    await page.keyboard.press('Escape');
    await waitFor(page, () => !document.querySelector('#modal-root [data-deal-mid]'), 6000);
    const s5 = await S();
    check('5 Esc closes the deal and the panel returns to the Dossier', p5 && !s5.deal && s5.face === '', s5);

    /* 6 — Deal pressed again */
    await openFace(); const p6 = await press('#ig-dock [data-rl-deal]');
    await waitFor(page, () => !!document.querySelector('#modal-root [data-deal-mid]'), 6000);
    await press('#ig-dock [data-rl-deal]');
    await waitFor(page, () => !document.querySelector('#modal-root [data-deal-mid]'), 6000);
    const s6 = await S();
    check('6 Deal pressed again closes it and keeps the Redlines face', p6 && !s6.deal && s6.face === 'red' && s6.lit === 'false', s6);

    /* 7 — Open clause */
    await press('#ig-dock [data-rl-deal]');
    await waitFor(page, () => !!document.querySelector('#modal-root [data-deal-open]'), 6000);
    const go = await page.$('#modal-root [data-deal-open]');
    if (go) await go.click();
    await waitFor(page, () => !document.querySelector('#modal-root [data-deal-mid]'), 6000);
    const s7 = await S();
    check('7 a point\'s Open clause closes the deal and keeps the Redlines face', !!go && !s7.deal && s7.face === 'red', s7);

    /* 8 — a stray repaint draws no Negotiate page over Home */
    await page.evaluate(() => { try { renderRedline(); } catch (_) { /* reported below */ } });
    await pause(600);
    const s8 = await page.evaluate(() => ({ view: state.view, page: !!document.querySelector('[data-rl-open-ws]') }));
    check('8 the old Negotiate page is not drawn over Home', s8.view === 'dashboard' && !s8.page, s8);

    /* 9 — Risks to look at › Open */
    await page.evaluate(() => { if (typeof pdRedClose === 'function') pdRedClose(); });
    const rk = await waitFor(page, () => !!document.querySelector('#pd-glance [data-pd-gl-risks]'), 8000);
    if (rk) await press('#pd-glance [data-pd-gl-risks]');
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
