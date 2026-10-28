/* NEGOTIATIONS, "WHOSE MOVE" (round 14 of the redesign: the owner picked
   "Whose move" by name, said yes to "Our move" and a Lead column, and no to a
   code-named deal on the list, 17 Oct 2026; js/views/register.js
   regNegoLeadOf, negoBandTabsHtml)

   WHAT THIS PINS, driven in a real browser on the Negotiations page
     1 the tabs say whose move it is from our side: All, then Our move ·
       Their move · For signature · Neither only where something is in them
       (RE-POINTED 21 Oct 2026, Part 8 "The Legora way": a tab with no rows
       is left out, Their move included)
     2 "Waiting on our side" is the Our move tab's own words (its hover — the
       group headings between the rows went with Part 8, Q2 "A — tabs only"),
       and the facts line counts it in the same words
     3 the columns: Ref · Counterparty and agreement · Round · What is open ·
       Waiting · Lead; Lead says "You" for the reader's own deal and a
       colleague's first name for theirs, the whole name on its hover
     4 a deal kept to its list is not on the list, nor in its counts
     5 the owner's three screens: every column head whole, the list and its
       panel in view, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/whose-move-verify.js */
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

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const colleague = W.users.unrestricted;
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
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* two live negotiations: ours, and one a colleague leads; and a deal kept to its list */
    await page.evaluate(async col => {
      for (const id of ['MK-A2', 'MK-B2']) { const c = getContract(id); if (c._light) await ensureFull(c); negoInit(c);
        const cl = negoClauseList(c);
        await negoEditClause(c, cl[0].clauseId, '<p>Payment falls due within thirty (30) days.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-30' });
        if (id === 'MK-B2') c.owner = { id: col.id, name: col.name };
        persist(c); }
      state.contracts.push({ id: 'MK-0412', contractNo: 'MK-0412', name: 'Project Falcon', counterparty: '', folder: getContract('MK-A2').folder, status: 'Under Review', _codeNamed: true, _light: true,
        negotiation: { round: 2, turn: 'counterparty' }, changes: [{ id: 'X', status: 'pending', authorSide: 'counterparty' }] });
    }, colleague);
    await page.evaluate(() => openNegotiations({ list: true }));
    await until(() => document.querySelectorAll('#reg-tbody tr[data-row]').length >= 2, null, 10000);
    const READ = () => {
      const tabs = [...document.querySelectorAll('.reg-views [data-reg-band]')].map(x => x.textContent.replace(/\d+/g, '').trim());
      const ourTab = (document.querySelector('.reg-views [data-reg-band="you"]') || {}).title || '';
      const bands = [...document.querySelectorAll('#reg-tbody .ngl-band-k')].map(x => x.textContent.trim());
      const heads = [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent.replace(/[▲▼↕]/g, '').trim());
      const rows = {}; document.querySelectorAll('#reg-tbody tr[data-row]').forEach(r => { const id = r.getAttribute('data-row') || r.getAttribute('data-id');
        const lead = r.querySelector('.reg-lead'); rows[id] = { lead: lead ? lead.textContent.trim() : null, hover: lead ? lead.getAttribute('title') : null }; });
      const all = (document.querySelector('.reg-views [data-reg-band=""] .n') || {}).textContent || '';
      return { tabs, ourTab, bands, heads, rows, all, facts: (document.getElementById('reg-head-facts') || document.querySelector('.ngl-facts') || document.querySelector('.reg-facts') || {}).textContent || '',
        coded: !!document.querySelector('#reg-tbody tr[data-row="MK-0412"]') || [...document.querySelectorAll('#reg-tbody')].some(t => /Project Falcon/.test(t.textContent)) };
    };
    const A = await page.evaluate(READ);
    const me = await page.evaluate(() => currentUser().name);
    /* both live deals wait on our side here, so Their move holds nothing and
       is not offered (Part 8: a tab with no rows is left out) */
    check('1 the tabs from our side: All · Our move; nothing empty offered', JSON.stringify(A.tabs) === JSON.stringify(['All', 'Our move']), JSON.stringify(A.tabs));
    const head = await page.evaluate(() => document.body.innerText);
    const facts = (head.match(/\d+ live[^\n]*/) || [''])[0];
    check('2 "Waiting on our side" is the Our move tab\'s own words, no group heading between the rows, and the facts line counts it so',
      A.ourTab === 'Waiting on our side' && !A.bands.length && /2 waiting on our side/.test(facts), JSON.stringify({ ourTab: A.ourTab, bands: A.bands, facts }));
    /* RE-POINTED 28 Oct 2026 (THE LIST LANGUAGE, owner: "keep" the Clauses in play): the reference, the round and the
       lead ride the grey line under the counterparty; Round and Lead are one press away under Columns */
    check('3a the columns: Counterparty and agreement · Clauses in play · What is open · Waiting · Value (Round and Lead under Columns)',
      /* RE-POINTED 28 Oct 2026 (ROOM TO SPREAD): where the list has the room, Ref, Round and Lead stand as
         columns together (the grey line's facts); else none of the three */
      ['Counterparty and agreement', 'What is open', 'Waiting'].every(h => A.heads.includes(h)) && (A.heads.includes('Ref') === A.heads.includes('Lead')), JSON.stringify(A.heads));
    const seat = await page.evaluate(() => (document.querySelector('[data-lc-btn]') || {}).getAttribute ? document.querySelector('[data-lc-btn]').getAttribute('data-lc-btn') : '');
    await page.click(`[data-lc-btn="${seat}"]`);
    await until(() => document.querySelector('[data-lc-pop] [data-lc-k="lead"]:not([disabled])'), null, 8000);
    await page.click('[data-lc-pop] [data-lc-k="lead"]');
    await until(() => document.querySelector('#reg-tbody .reg-lead'), null, 8000);
    await page.click(`[data-lc-btn="${seat}"]`);
    const B = await page.evaluate(READ);
    const mine = B.rows['MK-A2'] || {}, theirs = B.rows['MK-B2'] || {};
    check('3b Lead: "You" on the reader\'s own deal; a colleague\'s first name on theirs, the whole name on its hover',
      mine.lead === 'You' && mine.hover === me && theirs.lead === colleague.name.split(' ')[0] && theirs.hover === colleague.name, JSON.stringify({ mine, theirs }));
    check('4 a deal kept to its list is not on the list, nor in its count', !A.coded && A.all === '2', JSON.stringify({ coded: A.coded, all: A.all }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'whose-move-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const ths = [...document.querySelectorAll('.reg-table thead th')];
        const cut = ths.filter(t => { const s = t.querySelector('span, button') || t; return s.scrollWidth > s.clientWidth + 1 || t.scrollWidth > t.clientWidth + 1; }).map(t => t.textContent.trim());
        const panel = document.getElementById('ins-panel'), tb = document.querySelector('.reg-table');
        const r = x => x && x.getBoundingClientRect();
        return { cut, list: !!tb && r(tb).top < innerHeight && r(tb).left >= 0, panel: !!panel && r(panel).top < innerHeight && r(panel).right <= innerWidth + 1,
          side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: every column head whole, the list and its panel in view, nothing sideways`, !F.cut.length && F.list && F.panel && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `whose-move-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
