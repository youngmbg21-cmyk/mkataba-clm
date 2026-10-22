/* JAMBO'S PANEL, "TABS AND FACES" (round 3 of the redesign: the owner picked
   "Tabs and faces" by name, 17 Oct 2026; js/paperdesk.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace with a
   contract whose other side sent two redlines
     1 with the contract on Home's paper, Jambo's tab opens on Needs you here
       above the contract at a glance: Jambo's prepared work on THIS contract
       first, then what it owes the reader; its number is its rows; "All N" is
       the Counter's own number, and his tab carries the same number
     2 the two cards never say the same thing twice: the details still owed
       stay the glance's own row
     3 a row's button opens its door (Jambo's work on the Board), and every
       face's head opens with "‹ Jambo", which brings his tab back; the face's
       × is still at the end of its head
     4 "All N" opens the Counter
     5 the folded strip carries his face and the same count; a press opens him
     6 it fits the owner's three screens: both cards and the ask box in view
       without scrolling the panel, nothing past its right edge
   Waits ask for the state, bounded; a part that is missing reports instead of
   waiting out the clock.
   Run: node test/chromium/jambos-panel-verify.js */
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
const DOC = ['MASTER SERVICES AGREEMENT', '',
  '1. Parties and purpose', '', 'This Master Services Agreement is made between Lindqvist & Co AB, Stockholm (the Customer), and Nordvik Logistik AB, Gothenburg (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care.', '',
  '7. Limitation of liability', '', 'Each party\'s total liability under this Agreement shall not exceed 50% of the fees paid in the twelve months before the claim.', '',
  '11. Payment terms', '', 'The Customer shall pay each correct invoice within 30 days of receipt.'].join('\n');

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4.2e6, 'Under Review', DOC);
  c0.metadata.currency = 'SEK'; c0.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Per', email: 'per@nordvik.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Lindqvist', sharedBy: 'Maria', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, { timeout: 20000 });
    /* their two redlines come back through the link, as a real round does */
    const cls = await page.evaluate(async () => { const c = getContract('MK-0382'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Standard in our contracts' }; };
    await h.client('per').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Per', id: 'MK-0382', at: new Date().toISOString(),
      negoProposed: [ask(/50%/, '50%', '100%'), ask(/30 days/, '30 days', '60 days')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await until(() => (getContract('MK-0382').changes || []).length >= 2, null, 10000);

    /* the panel slides to its width (a CSS transition): a measure waits for it to land */
    const settled = () => until(() => { const d = document.getElementById('ig-dock'); if (!d) return false;
      return Math.abs(d.getBoundingClientRect().width - parseFloat(d.style.width || '0')) < 2; }, null, 4000);
    const open = async () => { await page.evaluate(() => pdOpenOnHome('MK-0382', 'copilot'));
      const ok = await until(() => !!document.getElementById('pd-glance'), null, 10000); await settled(); return ok; };

    console.log('\n1 · Needs you here, above the glance');
    await open();
    const nd = await until(() => { const el = document.getElementById('pd-needs'), gl = document.getElementById('pd-glance');
      if (!el || !gl) return null;
      /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): Needs you here's rows are the dossier's Still owed card,
         after What Jambo read; "Still owed · N" counts every row (a "N more" row stands for N) */
      const rows = [...el.querySelectorAll('.pd-gl-row:not(.is-done)')];
      const jw = rows.find(r => r.classList.contains('is-jw'));
      const read = gl.querySelector('[data-pd-ds-card="read"]');
      /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): "Needs you N" ABOVE Jambo read, its number beside the words */
      return { before: gl.contains(el) && !!read && !!(el.compareDocumentPosition(read) & Node.DOCUMENT_POSITION_FOLLOWING),
        title: (el.querySelector('.pd-gl-h b').textContent + ' ' + ((el.querySelector('.pd-gl-h .ds-ck-n') || {}).textContent || '')).trim(), n: ((el.querySelector('.pd-gl-h .ds-ck-n') || {}).textContent || '').trim(),
        /* RE-POINTED 20 Oct 2026 (the Legora way): the owed facts are the grid's rows */
        rows: rows.reduce((a, r) => a + Number((/(\d+) more/.exec(r.textContent) || [])[1] || 1), 0) + el.querySelectorAll('#pd-og tr.pd-og-row:not(.is-saved):not(.is-named)').length, firstJw: !!jw, jwFace: !!(jw && jw.querySelector('svg.jambo-mark.jambo-face')),
        kinds: rows.map(r => r.getAttribute('data-pd-nd-kind') || 'jw'),
        all: (el.querySelector('[data-pd-nd-all]') || {}).textContent || '', counter: counterNeedsCount(),
        badge: (document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || '' }; }, null, 10000);
    check('1a Needs you is the dossier\'s card above Jambo read', !!nd && nd.before && /^Needs you \d+$/.test(nd.title), JSON.stringify(nd));
    /* RE-POINTED 20 Oct 2026 (Chambers): on a computer his face is the ✦ mark (jamboFaceHtml's svg.jambo-mark), not the bird */
    check('1b Jambo\'s prepared work on this contract is one of its rows, with his face (the ✦ mark)', !!nd && nd.firstJw && nd.jwFace, nd && nd.kinds.join(','));
    check('1d its number is its rows', !!nd && Number(nd.n) === nd.rows, nd && (nd.n + ' / ' + nd.rows));
    /* RE-POINTED 20 Oct 2026: Still owed's head says "everything, one list" where "all N" stood (the dossier as drawn) */
    check('1e Still owed\'s head carries no "all N" of its own', !!nd && !nd.all, nd && nd.all);
    /* RE-POINTED 22 Oct 2026 (owner: "1, drawing"): the tab beside a paper carries this contract's Needs you number */
    check('1f his tab carries the same number', !!nd && Number(nd.badge) === Number(nd.n), nd && (nd.badge + ' / ' + nd.n));
    await shot(page, 'jambos-panel-1440x780');

    console.log('\n2 · the two cards do not say it twice');
    const gl = await page.evaluate(() => [...document.querySelectorAll('#pd-glance [data-pd-gl]')].map(r => r.getAttribute('data-pd-gl')).concat(document.querySelector('#pd-glance #pd-og') ? ['grid'] : []));
    check('2a the details still owed are the grid\'s rows, not Needs you here\'s', !!nd && !nd.kinds.includes('details') && gl.includes('grid'), JSON.stringify({ needs: nd && nd.kinds, glance: gl }));

    console.log('\n3 · a row\'s door, and the way back to Jambo');
    if (await press('#pd-needs [data-pd-nd-jw]', '3a Jambo\'s work row')) {
      /* RE-POINTED 21 Oct 2026 (THE MIDDLE, owner: "When you press, you never leave dossier … everything
         needed comes to you"): the piece stands in the middle beside the Dossier, the paper's face kept;
         "‹ Paper" brings the paper back (the-middle-verify measures the rest) */
      const mid = await until(() => state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'paper'
        && !!document.querySelector('#modal-root [data-pd-mid] .ag-panel') && !!document.querySelector('#ig-dock [data-pd-mid-back]'), null, 8000);
      check('3a a prepared piece\'s See it brings it to the middle beside the Dossier, the paper\'s face kept', !!mid);
      await page.evaluate(() => { if (typeof pdMidClose === 'function') pdMidClose(); });
    }
    await page.evaluate(() => pdOpenOnHome('MK-0382', 'fill'));
    {
      /* RE-POINTED 20 Oct 2026 — THE LEGORA WAY (owner: "Why should I have to go
         elsewhere to enter the details?"): a door asking for Fill in opens no
         face; the tabs stay, the Dossier is the tab and its grid's first owed
         row takes the hand — nothing to go back from */
      const ff = await until(() => { const og = document.querySelector('#ig-dock #pd-og'); if (!og) return null;
        const a = document.activeElement, head = document.querySelector('#ig-dock .igd-head');
        return { face: !!document.getElementById('pd-fillface'), back: !!document.querySelector('#ig-dock [data-pd-back="fill"]'), tab: pdTab(),
          hand: !!(a && a.closest && a.closest('#pd-og')), tabs: head ? [...head.querySelectorAll('[data-pd-tab]')].map(t => t.getAttribute('data-pd-tab')).join() : '' }; }, null, 8000);
      /* the landing is bounded beats after the paint: the hand is asked for, not assumed at the first frame */
      if (ff && !ff.hand) ff.hand = !!(await until(() => { const a = document.activeElement; return !!(a && a.closest && a.closest('#pd-og')); }, null, 4000));
      check('3b Fill in: no face — the tabs stay, the Dossier is the tab, its grid\'s row in the hand',
        !!ff && !ff.face && ff.tab === 'copilot' && ff.hand && ff.tabs.split(',').length > 1, JSON.stringify(ff));
      await shot(page, 'jambos-panel-fill-1440x780');
      check('3c nothing to go back from: no "‹" for a face that is not there', !!ff && !ff.back);
    }
    await page.evaluate(() => pdOpenOnHome('MK-0382', 'red'));
    /* RE-POINTED 19 Oct 2026 (ONE TRAIL, owner): the trail line under the tabs reads "‹ Jambo  Jambo / Redlines" */
    const rf = await until(() => { const top = document.querySelector('#pd-redface .rl-idx-top'); if (!top) return null;
      const tr = document.querySelector('#ig-dock > .pd-trail'); const w = tr && tr.querySelector('.pd-trail-w b'), b = tr && tr.querySelector('[data-pd-back="red"]');
      if (!(w && b)) return null;
      return { word: w.textContent.trim(), back: b.textContent.trim(), sameLine: Math.abs(w.getBoundingClientRect().top - b.getBoundingClientRect().top) < 10,
        headBack: !!top.querySelector('[data-pd-back]'), headX: !!top.querySelector('[data-pd-rf-close]'),
        first: (top.querySelector('.rl-idx-title') || {}).textContent || '' }; }, null, 10000);
    /* RE-POINTED 19 Oct 2026 (JAMBO AS A TAB YOU FLIP TO): "‹ Overview" */
    check('3d the Redlines face: the trail line reads "‹ Dossier" · Redlines; the column\'s head opens with "Redlines N", no ‹ Jambo, no ×',
      !!rf && rf.word === 'Redlines' && rf.back === 'Dossier' && rf.sameLine && !rf.headBack && !rf.headX && /^Redlines/.test(rf.first.trim()), JSON.stringify(rf));
    await shot(page, 'jambos-panel-redlines-1440x780');
    if (await press('#ig-dock [data-pd-back="red"]', '3e ‹ Jambo on Redlines')) {
      const back = await until(() => !(window.pdRedShows && pdRedShows()) && !!document.getElementById('pd-glance'), null, 6000);
      check('3e "‹ Jambo" closes Redlines and brings his tab back', !!back);
    }

    /* RE-POINTED 20 Oct 2026: "all N" is retired with Needs you here's head; the tab's number stays the Counter's (1f) */

    console.log('\n5 · the folded strip');
    await open();
    if (await press('#igd-collapse', '5a the fold')) {
      await settled();
      const st = await until(() => { const d = document.getElementById('igd-expand'); if (!d) return null;
        return { face: !!d.querySelector('svg.jambo-mark.igd-door-face'), n: (d.querySelector('.pd-tab-n') || {}).textContent || '', counter: (pdTabCount('copilot', pdContract()) || {}).n || 0,
          words: (d.querySelector('.igd-door-w') || {}).textContent || '' }; }, null, 6000);
      /* RE-POINTED 20 Oct 2026 (Chambers): his face on a computer is the ✦ mark, not the bird */
      /* RE-POINTED 22 Oct 2026 (owner: "1, drawing"): the count is his tab's own, this contract's Needs you */
      check('5a the strip carries his face (the ✦ mark) and the count his tab carries', !!st && st.face && Number(st.n) === st.counter, JSON.stringify(st));
      await shot(page, 'jambos-panel-folded-1440x780');
      if (await press('#igd-expand', '5b the strip')) {
        const opened = await until(() => intel.dockOpen && !!document.getElementById('pd-needs'), null, 6000);
        check('5b a press on the strip opens him again, on Needs you here', !!opened);
      }
    }

    console.log('\n6 · the owner\'s three screens');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await open(); await settled();
      const fit = await until(() => { const dock = document.getElementById('ig-dock'), feed = document.getElementById('igd-feed'),
        nd = document.getElementById('pd-needs'), gl = document.getElementById('pd-glance'), box = document.getElementById('igd-input');
        if (!dock || !feed || !nd || !gl || !box) return null;
        const f = feed.getBoundingClientRect(), g = gl.getBoundingClientRect(), b = box.getBoundingClientRect(), d = dock.getBoundingClientRect(), n = nd.getBoundingClientRect();
        const wide = [...dock.querySelectorAll('#pd-needs *, #pd-glance *')].filter(e => e.getBoundingClientRect().right > d.right + 1).length;
        /* RE-POINTED 20 Oct 2026: the dossier opens at its top, Still owed begun in view */
        return { top: n.top >= d.top && n.top < f.bottom && feed.scrollTop === 0, glance: g.top < f.bottom, box: b.bottom <= innerHeight + 1 && b.top >= 0, wide, scroll: feed.scrollHeight - feed.clientHeight }; }, null, 8000);
      /* RE-POINTED 18 Oct 2026 (rounds 3 and 6 as drawn): the glance now says
         their round and EACH of their asks, so on a short screen it can be
         longer than the panel — which then opens at its TOP (Needs you here
         first, never scrolled past), the glance begins in view, the box
         stands, and the rest is a scroll away. PASS 3 (round 3's Compare,
         "it stays at the top"): Needs you here is PINNED above the
         conversation's scroller (#pd-pin), not inside it */
      check(`6 ${w}×${ht}: the dossier at its top, Still owed begun, the ask box in view, nothing past the panel's edge`, !!fit && fit.top && fit.glance && fit.box && fit.wide === 0, JSON.stringify(fit));
      await shot(page, `jambos-panel-${w}x${ht}`);
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, (e && e.stack) || String(e));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
