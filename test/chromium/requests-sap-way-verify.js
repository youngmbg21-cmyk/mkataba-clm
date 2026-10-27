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
    const days = await page.evaluate(() => {
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
    await until(() => { if (document.querySelectorAll('.ik-lt [data-ik-row]').length >= 3) return true;
      if (window.__ikList && !_intakeState.list.some(r => r.id === 'REQ-1042')){ _intakeState.list = window.__ikList; renderIntake(); } return null; }, null, 8000);
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE): the reference and the day asked ride the request's grey line (Asked one
       press away under Columns), so the cells are read by their head, not their place */
    const T = await page.evaluate(() => {
      const heads = [...document.querySelectorAll('.ik-lt thead th')].map(t => t.textContent.trim());
      const at = h => heads.indexOf(h);
      return { heads, rows: Object.fromEntries([...document.querySelectorAll('.ik-lt [data-ik-row]')].map(r => { const td = [...r.children];
        const wc = td[at('With')], w = wc ? wc.cloneNode(true) : null; if (w) w.querySelectorAll('.ins-av').forEach(x => x.remove());
        const sub = r.querySelector('td:first-child .ins-c2 > span');
        return [r.getAttribute('data-ik-row'), { with: w ? w.textContent.replace(/\s+/g, ' ').trim() : '', amber: !!(wc && wc.querySelector('.ins-nobody')),
          files: td[at('Files')] ? td[at('Files')].textContent.trim() : '', asked: sub ? (/asked (.+)$/.exec(sub.textContent.trim()) || [])[1] || '' : '' }]; })) };
    });
    check('1 the columns: Request · Kind · How it is handled · With · Files · Promised by (Asked under Columns)',
      JSON.stringify(T.heads) === JSON.stringify(['Request', 'Kind', 'How it is handled', 'With', 'Files', 'Promised by']), JSON.stringify(T.heads));
    const a = T.rows['REQ-1042'] || {}, b = T.rows['REQ-1039'] || {}, c = T.rows['REQ-1037'] || {};
    check('2a With: "You" with the lane that sent it; a colleague by name; "Nobody yet" in amber',
      /^You\b/.test(a.with) && /NDA lane/.test(a.with) && /Erik Ström/.test(c.with) && /Nobody yet/.test(b.with) && b.amber, JSON.stringify({ a, b, c }));
    check('2b Files counts the clip, none a dash; Asked says the day', a.files === '1' && c.files === '2' && b.files === '—' && a.asked === days.today, JSON.stringify({ a, b, c, today: days.today }));
    await page.click('.ik-lt [data-ik-row="REQ-1042"]');
    const P = await until(() => { const p = document.getElementById('ins-panel'); const f = p && p.querySelector('[data-ins-fact="with"] dd'); return f && /Kettle|NDA/.test(p.textContent) ? f.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('3 the panel\'s With says who and which lane sent it', !!P && /sent by the NDA lane/.test(P), String(P));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'requests-sap-way-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const ths = [...document.querySelectorAll('.ik-lt thead th')];
        const cut = ths.filter(t => t.scrollWidth > t.clientWidth + 1).map(t => t.textContent.trim());
        const t = document.querySelector('.ik-lt'), p = document.getElementById('ins-panel');
        /* the Request column leads now (27 Oct 2026) */
        const req = ths[0] ? Math.round(ths[0].getBoundingClientRect().width) : 0;
        const cellCut = [...document.querySelectorAll('.ik-lt .ik-files-n')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > e.closest('td').getBoundingClientRect().right + 1).length;
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
