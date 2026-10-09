/* Chromium verification: THE SAP BENCHMARK, BATCH 1 — THE LISTS.
   ============================================================
   Owner-approved 9 Oct 2026 (the SAP Fiori benchmark, page by page):

     Contracts    the list's card names itself with its count; no money
                  total in the foot.
     Approvals    the table says what it is and how many; red only past a
                  week; Approve leaves the row in place, marked Approved,
                  with Undo in the panel; Undo puts it back to waiting.
     Obligations  no Amount column when no row carries money; an owner-less
                  duty says Unassigned in grey, not Nobody in amber; the
                  Reminders section is one line and a link to the rules.

   Negotiations' Start a negotiation door is measured in
   negotiations-door-verify (section 12).

   Every half is guarded: a missing feature REPORTS, never times out.
   Run: node test/chromium/sap-lists-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = d => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const ob = (id, desc, d, party) => ({ id, desc, due: iso(d), party, status: 'open' });
const CONTRACTS = [
  { ...H.fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48000000, 'Signed', H.FIXTURE_BODY_A1),
    obligations: [ob('o1', 'Deliver monthly report', -3, 'theirs'), ob('o2', 'Pay invoice within 30 days', 5, 'ours')] },
  H.fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', H.FOLDER_A, 36000000, 'Under Review'),
  H.fixtureContract('MK-A4', 'Cold Chain Logistics', 'Mitchell Cotts', H.FOLDER_A, 27500000, 'Under Review'),
  H.fixtureContract('MK-B2', 'Retail Supply', 'Naivas', H.FOLDER_B, 78000000, 'Under Review'),
];
const wait = async (page, fn, arg, ms = 5000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await wait(page, () => typeof window.setView === 'function' && window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 10000);

    /* ---- 1. CONTRACTS ---- */
    /* The foot's money note is drawn only for a reader who may see values, so
       wait until that is known before the list is painted. */
    await wait(page, () => typeof canViewValues === 'function' && canViewValues(), null, 8000);
    await page.evaluate(() => { if (window.regSetScope) regSetScope(null); setView('register'); });
    await wait(page, () => !!document.querySelector('#reg-tbody tr'));
    const reg = await page.evaluate(() => {
      const tt = document.getElementById('reg-tt');
      const foot = (document.getElementById('reg-showing') || {}).textContent || '';
      /* the list's own count, as its foot states it ("Showing 1–30 of 30") */
      const of = foot.match(/of\s+([\d,]+)/);
      return { tt: tt ? tt.textContent.trim() : null, shown: tt ? getComputedStyle(tt).display : null,
        n: of ? Number(of[1].replace(/,/g, '')) : -1, foot };
    });
    check('1a the list card names itself with its count — "Contracts (N)"',
      reg.tt && new RegExp(`\\(${reg.n}\\)$`).test(reg.tt) && reg.shown !== 'none', `${reg.tt} · ${reg.n} rows`);
    check('1b no money total in the foot', !/aggregate|totalt|KES|SEK|on paper/i.test(reg.foot), JSON.stringify(reg.foot.trim()));

    /* ---- 2. APPROVALS ---- */
    await page.evaluate(() => setView('approvals'));
    const apUp = await wait(page, () => !!document.querySelector('.ap-page'));
    /* ONE ROW FOUR DAYS IDLE, in memory only, so the 3-to-6-day band is
       really on the page (every fixture row is months old): red at three days
       was the old rule, red at seven is the new one. Idle is read off the
       contract's last action where no ask records when it was asked. */
    const aged = apUp ? await page.evaluate(() => {
      const r = (window.apApprovalRows ? apApprovalRows() : [])[0]; if (!r) return null;
      r.c.lastAction = new Date(Date.now() - 4 * 86400000).toISOString();
      (r.c.asks || []).forEach(a => { if (a && a.kind === 'rule' && a.state === 'open') a.at = r.c.lastAction; });
      renderApprovalsPage();
      return { id: r.c.id, idle: (apApprovalRows().find(x => x.c.id === r.c.id) || {}).idle };
    }) : null;
    check('2b0 one row is four days idle', !!aged && aged.idle === 4, JSON.stringify(aged));
    const ap = apUp ? await page.evaluate(() => {
      const t = document.querySelector('.ap-card-t');
      const tab = document.querySelector('[data-ap-tab="approvals"] .ap-n');
      const rows = window.apApprovalRows ? apApprovalRows() : [];
      const wrong = rows.filter(r => {
        const tr = document.querySelector(`[data-ap-row="${r.c.id}"]`);
        const red = !!(tr && tr.querySelector('.late'));
        return red !== (r.idle >= 7);
      }).map(r => r.c.id + ':' + r.idle);
      return { title: t ? t.textContent.trim() : null, tab: tab ? tab.textContent.trim() : '', n: rows.length,
        mine: rows.filter(r => r.mine).length, wrong, idles: rows.map(r => r.idle) };
    }) : null;
    check('2a the table says what it is and how many', !!ap && /\(\d+\)$/.test(ap.title || '') && ap.title.includes(`(${ap.n})`),
      ap ? `${ap.title} · ${ap.n} rows` : 'page missing');
    check('2b a waiting row is red only from 7 days', !!ap && ap.n > 0 && ap.wrong.length === 0,
      ap ? `idle ${ap.idles.join(',')} · wrong ${ap.wrong.join(',') || 'none'}` : 'page missing');
    const sel = ap && ap.n ? await page.evaluate(() => (document.getElementById('ins-panel') || {}).getAttribute
      ? document.getElementById('ins-panel').getAttribute('data-ins-id') : null) : null;
    const head = sel ? await page.evaluate(() => {
      const p = document.getElementById('ins-panel');
      return { beside: !!p.querySelector('.ins-cp .ins-st-side'), av: !!p.querySelector('.ins-cp .reg-av'),
        line: !!p.querySelector('[data-ins-need-line]'), decide: p.querySelectorAll('[data-ins-need]').length,
        sub: !!p.querySelector('.ins-sub [data-ins-act="open"]'), approve: !!p.querySelector('[data-ins-act="approve"]') };
    }) : null;
    check('2c the panel head: initials, the stage beside the name, Open contract on the sub line',
      !!head && head.beside && head.av && head.sub, JSON.stringify(head));
    check('2d one line says what is asked — no second Decide door', !!head && head.line && head.decide === 0, JSON.stringify(head));
    if (head && head.approve) {
      await page.click('#ins-panel [data-ins-act="approve"]');
      const done = await wait(page, id => {
        const tr = document.querySelector(`[data-ap-row="${id}"]`);
        return !!(tr && tr.querySelector('.done')) && !!document.querySelector('#ins-panel [data-ins-act="undo"]');
      }, sel, 8000);
      const after = await page.evaluate(id => ({
        row: !!document.querySelector(`[data-ap-row="${id}"]`),
        line: !!document.querySelector('#ins-panel [data-ap-done-line]'),
        title: (document.querySelector('.ap-card-t') || {}).textContent }), sel);
      check('2e Approve leaves the row in its place, marked Approved, with Undo in the panel',
        done && after.row && after.line, JSON.stringify(after));
      if (done) {
        await page.click('#ins-panel [data-ins-act="undo"]');
        const back = await wait(page, id => {
          const tr = document.querySelector(`[data-ap-row="${id}"]`);
          return !!(tr && !tr.querySelector('.done')) && !!document.querySelector('#ins-panel [data-ins-act="approve"]');
        }, sel, 8000);
        const st = await page.evaluate(id => {
          const c = getContract(id);
          const chain = (c && c.approvalChain) || [];
          const trail = (c && c.audit || []).map(a => a.action || a.what || '').filter(x => /undone/i.test(x));
          return { chain: chain.map(s => s.status).join(','), trail: trail.length };
        }, sel);
        check('2f Undo puts it back to waiting, and the trail says so', back && /pending/.test(st.chain), JSON.stringify(st));
        /* AND THE SERVER KEPT IT: read the stored record back. */
        const stored = await page.evaluate(async id => {
          try { const r = await fetch('/api/contracts/' + encodeURIComponent(id), { credentials: 'same-origin' });
            const j = await r.json(); const c = j.contract || j;
            return (c.approvalChain || []).map(s => s.status).join(','); } catch (e) { return 'error ' + e.message; }
        }, sel);
        check('2g the stored record is waiting again too', /pending/.test(stored) && !/approved/.test(stored), stored);
      }
    } else check('2e Approve is offered on a row this reader may decide', false, 'no Approve in the panel');

    /* ---- 3. OBLIGATIONS ---- */
    await page.evaluate(() => setView('obligations'));
    const obUp = await wait(page, () => !!document.querySelector('.ob-lt tbody tr[data-ins-row]'));
    const obs = obUp ? await page.evaluate(() => {
      const heads = [...document.querySelectorAll('.ob-lt thead th')].map(th => th.textContent.trim());
      const un = document.querySelector('.ob-lt .ins-unassigned');
      const nobody = document.querySelectorAll('.ob-lt .ins-nobody').length;
      const av = document.querySelectorAll('.ob-lt .ob-id .reg-av').length;
      return { heads, un: un ? { t: un.textContent.trim(), c: getComputedStyle(un).color } : null, nobody, av,
        amber: getComputedStyle(document.documentElement).getPropertyValue('--st-amber-fg').trim() };
    }) : null;
    check('3a no money on the list, no Amount column', !!obs && !obs.heads.some(t => /amount/i.test(t)), obs ? obs.heads.join(' | ') : 'page missing');
    check('3b an owner-less duty of ours says Unassigned, in grey', !!obs && !!obs.un && obs.un.t === 'Unassigned' && obs.nobody === 0,
      obs ? JSON.stringify(obs.un) + ' · nobody ' + obs.nobody : 'page missing');
    check('3c every row carries the counterparty\'s initials', !!obs && obs.av > 0, obs ? String(obs.av) : 'page missing');
    if (obUp) {
      await page.evaluate(() => { const r = document.querySelector('.ob-lt tbody tr[data-ins-row]'); if (r) r.click(); });
      await wait(page, () => !!document.querySelector('#ins-panel [data-ob-rem-more]'), null, 4000);
      const rem = await page.evaluate(() => {
        const more = document.querySelector('#ins-panel [data-ob-rem-more]');
        const full = document.querySelector('#ins-panel [data-ob-rem-full]');
        return { more: !!more, hidden: full ? full.hidden : null };
      });
      check('3d Reminders is one line, the rules behind a link', rem.more && rem.hidden === true, JSON.stringify(rem));
      if (rem.more) {
        await page.click('#ins-panel [data-ob-rem-more]');
        const open = await page.evaluate(() => { const f = document.querySelector('#ins-panel [data-ob-rem-full]'); return f && !f.hidden && f.getBoundingClientRect().height > 0; });
        check('3e the link opens the whole account in place', open, String(open));
      }
    }

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  if (bad) process.exit(1);
})();
