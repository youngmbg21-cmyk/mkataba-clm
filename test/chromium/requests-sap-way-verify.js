/* REQUESTS, "THE SAP WAY" (round 20 of the redesign: the owner picked "The
   SAP way" by name for Requests and My notes, 17 Oct 2026;
   js/views/intake.js ikWithListHtml, ikFilesCellHtml)

   WHAT THIS PINS, driven in a real browser on Requests (the team's seat)
     1 the list's columns: Ref · Request · Kind · How it is handled · With ·
       Files · Asked · Promised by
     2 With says who holds it — "You" for the reader with the lane that sent
       it, a colleague's name, "Nobody yet" in amber; Files counts the clip;
       Asked says the day
     3 the panel's With says who and which lane sent it
     4 the owner's three screens: the list and its panel in view, every
       column head whole, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/requests-sap-way-verify.js */
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
  await H.seedWorkspace(h, { approvalRules: [] });
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
    await page.evaluate(() => setView('intake'));
    await until(() => window._intakeState && _intakeState.loaded, null, 10000);
    await page.evaluate(() => {
      const me = currentUser(), at = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
      /* the list is kept on window so a late load of the real one (a slow runner) can be answered by laying it
         back down (21 Oct 2026: GitHub drew no rows once, the server's list landing after this one) */
      window.__ikList = _intakeState.list = [
        { id: 'REQ-1042', title: 'Mutual NDA with Kettle & Co', need: 'A mutual NDA first.', counterparty: 'Kettle & Co', status: 'open', createdAt: at(0), by: { id: 'u-sara', name: 'Sara Nyström' }, assignee: { id: me.id, name: me.name }, lane: 'NDA', files: [{ id: 'f1', name: 'pilot-brief.pdf', size: 240000 }] },
        { id: 'REQ-1039', title: 'Reseller agreement for Denmark', need: 'A reseller.', status: 'open', createdAt: at(3), by: { id: 'u-lina', name: 'Lina Ek' }, files: [] },
        { id: 'REQ-1037', title: 'Event venue booking', need: 'A venue.', status: 'accepted', createdAt: at(4), by: { id: 'u-lina', name: 'Lina Ek' }, assignee: { id: 'u-erik', name: 'Erik Ström' }, files: [{ id: 'f2', name: 'a.pdf', size: 1 }, { id: 'f3', name: 'b.pdf', size: 1 }] },
      ];
      renderIntake();
      return { today: ikDay(at(0)) };
    });
    await until(() => { if (document.querySelectorAll('.ikn-table [data-ikn-row]').length >= 3) return true;
      if (window.__ikList && !_intakeState.list.some(r => r.id === 'REQ-1042')){ _intakeState.list = window.__ikList; renderIntake(); } return null; }, null, 20000);
    /* BOUNDED, AND SAID (20 Nov 2026): on a slow runner the page's own load can land over the three sample requests after
       the wait; the wait is 20 s, and if the rows are still not there the check says so rather than timing out on a press */
    const rowsIn = await page.evaluate(() => !!document.querySelector('.ikn-table [data-ikn-row="REQ-1042"]'));
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762; the owner's ruling 3, 17 Nov 2026: Requests as round
       6 drew it): ONE table (.ikn-table, rows tr[data-ikn-row]) — Request · Stream · Where it stands · Asked by, and the
       row's Start the draft. Who holds a request is said in Where it stands ("With <first name>", or "Needs an editor"
       in amber while nobody holds it); the asker and the day in Asked by; the files are the panel's ("1 file attached").
       RETIRED 17 Nov 2026 (#762, owner's ruling 3): the old columns Kind · How it is handled · With · Promised by · Files,
       and the lane on the row (the drawn row carries none) */
    /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way): the columns are Request · Status ·
       Steps · Asked by · Paper that fits · Waiting (Steps, then the paper, step aside where the room is short); who holds a
       request is the Status badge (span.apn-st: "With you", "With <first name>", "Needs an editor" is-amber); the day it
       was asked is the Waiting cell (td.ikn-wait, "today") */
    const T = await page.evaluate(() => {
      const heads = [...document.querySelectorAll('.ikn-table thead th')].map(t => t.textContent.trim());
      const at = h => heads.indexOf(h);
      return { heads, rows: Object.fromEntries([...document.querySelectorAll('.ikn-table [data-ikn-row]')].map(r => { const td = [...r.children];
        const wc = td[at('Status')], badge = wc && wc.querySelector('.apn-st');
        return [r.getAttribute('data-ikn-row'), { with: wc ? wc.textContent.replace(/\s+/g, ' ').trim() : '', amber: !!(badge && badge.classList.contains('is-amber')),
          asked: ((r.querySelector('td.ikn-wait') || {}).textContent || '').trim() }]; })) };
    });
    const ALL = ['Request', 'Status', 'Steps', 'Asked by', 'Paper that fits', 'Waiting'], hs = T.heads.filter(Boolean);
    check('1 the columns: Request · Status · Steps · Asked by · Paper that fits · Waiting (Steps and the paper may step aside)',
      ['Request', 'Status', 'Asked by', 'Waiting'].every(x => hs.includes(x)) && hs.every(x => ALL.includes(x)) && hs.every((x, i) => !i || ALL.indexOf(x) > ALL.indexOf(hs[i - 1])), JSON.stringify(T.heads));
    const a = T.rows['REQ-1042'] || {}, b = T.rows['REQ-1039'] || {}, c = T.rows['REQ-1037'] || {};
    check('2a With: "With you" for the reader; a colleague by name; "Needs an editor" in amber',
      /^With you/.test(a.with) && /^With Erik/.test(c.with) && /^Needs an editor/.test(b.with) && b.amber, JSON.stringify({ a, b, c }));
    if (!rowsIn) throw new Error('the three sample requests never stood on the list within 20 s (the page\'s own load came over them)');
    await page.click('.ikn-table [data-ikn-row="REQ-1042"]');
    const P = await until(() => { const p = document.getElementById('ins-panel'); return p && /Kettle/.test(p.textContent) ? p.innerText.replace(/\s+/g, ' ').trim() : null; });
    /* RE-POINTED 17 Nov 2026 (#762; the owner's picks on the drawings, 17 Nov 2026, "2 Bring it back"): the panel says
       each file as its own row — Files · its name (a door to it) · its size and who added it — instead of "1 file attached" */
    /* RE-POINTED 18 Nov 2026 (owner's pick by name, "Five Parts"; f1094): a file is a row of the five parts — its name,
       then under it "Files · its size · added by …" */
    /* RE-POINTED 21 Nov 2026 (P-32, as drawn): Read from the ask is label rows — "File" then its name (a door to it), its
       size and who added it on the name's own title */
    const fileBy = await page.evaluate(() => ((document.querySelector('#ins-panel [data-ikn-file]') || {}).title || ''));
    const fileSaid = /\bFile pilot-brief\.pdf\b/.test(P || '') && /added by Sara Nyström\b/.test(fileBy);
    check('2b Files counts the clip, none a dash; Asked says the day (the panel names the file and who added it)', a.asked === 'today' && fileSaid,
      JSON.stringify({ asked: a.asked, panel: (P || '').replace(/^.*?(Files)/, '$1').slice(0, 200) }));
    /* RE-POINTED 17 Nov 2026 (#762): the panel is Jambo's chosen-row panel; the lane that sent it is looked for in it */
    /* RE-POINTED 21 Nov 2026 (P-32, as drawn): the lane is a row read from the ask, "Came by NDA" */
    check('3 the panel says which lane sent it', !!P && /Came by NDA\b/.test(P), String(P).slice(0, 300));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'requests-sap-way-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      /* RE-POINTED 17 Nov 2026 (#762): the new look's table; no file count is drawn on a row */
      const F = await page.evaluate(() => { const ths = [...document.querySelectorAll('.ikn-table thead th')];
        const cut = ths.filter(t => t.scrollWidth > t.clientWidth + 1).map(t => t.textContent.trim());
        const t = document.querySelector('.ikn-table'), p = document.getElementById('ins-panel');
        /* the Request column leads now (27 Oct 2026) */
        const req = ths[0] ? Math.round(ths[0].getBoundingClientRect().width) : 0;
        /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way): no button on a row — every
           Waiting cell whole, and each Status badge inside its own cell */
        const cellCut = [...document.querySelectorAll('.ikn-table td.ikn-wait')].filter(e => e.scrollWidth > e.clientWidth + 1).length
          + [...document.querySelectorAll('.ikn-table .apn-st')].filter(e => e.getBoundingClientRect().right > e.closest('td').getBoundingClientRect().right + 1).length;
        return { cut, cellCut, req, list: !!t && t.getBoundingClientRect().top < innerHeight, panel: !!p && p.getBoundingClientRect().right <= innerWidth + 1, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`4 ${w}×${ht}: the list and its panel in view, every head, reference and file count whole, the request room to read, nothing sideways`, !F.cut.length && !F.cellCut && F.req >= 150 && F.list && F.panel && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `requests-sap-way-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
