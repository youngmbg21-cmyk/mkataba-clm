/* HOW LONG CONTRACTS ARE KEPT, AND LEGAL HOLD — THE STREAM'S KEEPING TAB
   (owner picked "Keeping on each stream — the SAP way", 17 Oct 2026; piece 10
   of the sensitive contracts and governance plan)

   WHAT THIS PINS, driven in a real browser (the server's walls — who may,
   what is due, the family, legal hold, the trail — are f703's)
     1 a stream's page has a Keeping tab between Access and People: what it
       keeps, how many are on legal hold, the period from a list, and the
       held contracts in the On hold chip's ruby ("Legal hold · … since …")
     2 a period: "Then" asks what follows; Save stays on Keeping, says so with
       an 'ok', and shows what is due — "Due now: 2 contracts", ended before
       which day, how many are held back
     3 Needs your attention says "Ready to delete · Sales & Route-to-Market",
       and its Review opens the stream on Keeping
     4 Review the list → the due contracts; "Delete these 2" asks once more
       (danger); yes → an 'ok', nothing more due, the contracts leave this
       book, and the Needs row goes
     5 legal hold: End or pause greys Archive on a held contract, with why
     6 the owner's three screens: the tab, its list and its buttons fit
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/keeping-verify.js */
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
const yearsAgo = y => { const t = new Date(); t.setFullYear(t.getFullYear() - y);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const HOLD = { at: '2026-09-02T09:00:00.000Z', by: 'Amina Otieno', why: 'Dispute with the distributor' };
const K = (id, name, end, over = {}) => ({ ...H.fixtureContract(id, name, 'Rift Valley Distributors', H.FOLDER_B, 2e6, 'Signed'),
  expiry: end, metadata: { value: 2e6, currency: 'KES' }, ...over });

(async () => {
  const h = await H.startHati();
  const W = await H.seedWorkspace(h, { approvalRules: [], contracts: [
    K('KP-1', 'Distributor Agreement — Nyanza', yearsAgo(12)),
    K('KP-6', 'Cold-chain storage', yearsAgo(11)),
    K('KP-2', 'Shelf placement — Quickmart', yearsAgo(3)),
    K('KP-3', 'Settlement Agreement — Rift Valley', yearsAgo(12), { hold: HOLD }),
  ] });
  /* this quarter's access review is done: its ask is not what this check reads */
  for (const u of Object.values(W.users)) await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: u.id, verdict: 'keep' } });
  await W.admin.json('/api/access-review/done', { method: 'POST', body: {} });
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
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'KP-1'), null, { timeout: 20000 });
    const pane = () => until(() => { const p = document.querySelector('#st-ps .st-ps-pane'); const on = document.querySelector('#st-ps .st-ps-tab.is-on');
      return p && on && on.getAttribute('data-st-ps-tab') === 'keeping' && !/Reading the stream/.test(p.textContent) ? p.textContent.replace(/\s+/g, ' ').trim() : null; });

    console.log('\n1 · the Keeping tab');
    await page.evaluate(() => { setView('team'); settingsGoTab('company'); stDrawerOpen('stream:sales'); });
    const tabs = await until(() => { const t = [...document.querySelectorAll('#st-ps .st-ps-tab')].map(x => x.textContent.replace(/\s+/g, ' ').trim()); return t.length ? t : null; });
    check('1a the stream\'s tabs: Access · Keeping · People', !!tabs && tabs.length === 3 && tabs[0] === 'Access' && tabs[1] === 'Keeping' && /^People/.test(tabs[2]), JSON.stringify(tabs));
    if (await press('#st-ps [data-st-ps-tab="keeping"]', '1b Keeping')) {
      const t = await pane();
      const chip = await page.evaluate(() => { const c = document.querySelector('.st-kp-chip'); if (!c) return null; const s = getComputedStyle(c);
        const ref = document.createElement('span'); ref.style.color = 'var(--st-ruby-fg)'; document.body.appendChild(ref); const want = getComputedStyle(ref).color; ref.remove();
        return { text: c.textContent.trim(), ruby: s.color === want }; });
      check('1b no period yet; 1 on legal hold, listed: "Legal hold · Settlement Agreement — Rift Valley · since 2 Sep · Amina Otieno"', !!t
        && /^Kept after they end: No keeping period On legal hold: 1 Keep its contracts after they end for/.test(t)
        && /On legal hold — never deleted or archived while held Legal hold Settlement Agreement — Rift Valley\s?since 2 Sept? · Amina Otieno/.test(t)
        && !!chip && chip.ruby, JSON.stringify({ t: t && t.slice(0, 400), chip }));
    }

    console.log('\n2 · a period');
    /* a missing tab reports here rather than waiting out the clock below */
    if (!(await page.locator('#st-kp-years').count())) throw new Error('nothing to choose a period in (#st-kp-years)');
    await page.selectOption('#st-kp-years', '10');
    const asked = await until(() => { const t = (document.querySelector('#st-ps .st-ps-pane') || {}).textContent || '';
      const on = document.querySelector('input[name="st-kp-then"]:checked'); return /Then/.test(t) && on ? { then: on.value, t: t.replace(/\s+/g, ' ') } : null; });
    check('2a "Then": listed for an admin to delete (chosen) or kept archived; "Save to see what this period makes due."', !!asked && asked.then === 'delete'
      && /List them for an admin to delete\s?Nothing is deleted without an admin's yes Keep them, archived\s?Out of every list, still searchable/.test(asked.t)
      && /Save to see what this period makes due\./.test(asked.t), asked && asked.t.slice(0, 400));
    await press('#st-dsave', '2b Save');
    const told = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /kept 10 years after they end/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; });
    const due = await until(() => { const d = document.getElementById('st-kp-due'); const on = document.querySelector('#st-ps .st-ps-tab.is-on');
      return d && on && on.getAttribute('data-st-ps-tab') === 'keeping' ? d.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('2b an \'ok\'; the drawer stays on Keeping: "Due now: 2 contracts · Ended before … · 1 held back by legal hold"', !!told
      && /Sales & Route-to-Market: its contracts are kept 10 years after they end\./.test(told)
      && !!due && /^Due now: 2 contracts\s?Ended before .+ · 1 held back by legal hold Review the list$/.test(due), `${told} / ${due}`);
    await shot(page, 'keeping-tab-1440x780');

    console.log('\n3 · Needs your attention');
    await page.evaluate(() => stDrawerClose());
    const need = await until(() => { if (typeof renderTeam === 'function' && !document.querySelector('#st-att [data-st-need="keep:sales"]')) renderTeam();
      const r = document.querySelector('#st-att [data-st-need="keep:sales"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('3a "Ready to delete · Sales & Route-to-Market — 2 contracts past their keeping period, waiting for an admin\'s yes"', !!need
      && /Ready to delete · Sales & Route-to-Market 2 contracts past their keeping period, waiting for an admin's yes Review$/ /* two lines a row since round 25 */.test(need), need);
    if (await press('#st-att [data-st-need="keep:sales"] .st-need-go', '3b Review')) {
      const on = await until(() => { const d = document.getElementById('st-drawer'); const t = document.querySelector('#st-ps .st-ps-tab.is-on');
        return d && d.classList.contains('open') && t ? t.getAttribute('data-st-ps-tab') : null; });
      check('3b Review opens the stream on Keeping', on === 'keeping', on);
    }

    console.log('\n4 · the admin\'s yes');
    await until(() => !!document.querySelector('[data-st-kp-list]'));
    if (await press('[data-st-kp-list]', '4a Review the list')) {
      const rows = await until(() => { const r = [...document.querySelectorAll('.st-kp-tb tbody tr')].map(x => x.getAttribute('data-st-kp-row')); return r.length ? r : null; });
      const go = await page.evaluate(() => { const b = document.getElementById('st-kp-go'); return b ? { text: b.textContent.trim(), danger: b.classList.contains('ui-btn-danger') } : null; });
      check('4a the two due, and "Delete these 2" in the danger colour', !!rows && rows.slice().sort().join(',') === 'KP-1,KP-6' && !!go && go.text === 'Delete these 2' && go.danger, JSON.stringify({ rows, go }));
      await shot(page, 'keeping-list-1440x780');
      if (await press('#st-kp-go', '4b Delete these 2')) {
        /* the question is its own dialog, over the drawer */
        const ask = await until(() => { const d = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].find(x => /for good\?/.test(x.textContent) && !x.closest('#st-drawer'));
          return d ? d.textContent.replace(/\s+/g, ' ').trim() : null; });
        check('4b asked once more: "Delete 2 contracts for good?" — what goes, and that the trail keeps what each was', !!ask && /Delete 2 contracts for good\?/.test(ask)
          && /cannot be brought back; what each one was, and that you deleted it, stays in the trail\./.test(ask), ask && ask.slice(0, 300));
        await page.evaluate(() => { const d = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].find(x => /for good\?/.test(x.textContent) && !x.closest('#st-drawer'));
          const b = d && [...d.querySelectorAll('button')].find(x => /Delete these 2/.test(x.textContent)); if (b) b.click(); });
        const gone = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; const d = document.getElementById('st-kp-due');
          return /2 contracts deleted — each is in the trail\./.test(t) && d && /Nothing is due now/.test(d.textContent) ? { book: state.contracts.map(c => c.id).filter(id => /^KP-/.test(id)).sort() } : null; });
        check('4c an \'ok\', nothing more due, and they leave this book', !!gone && gone.book.join(',') === 'KP-2,KP-3', JSON.stringify(gone));
        await page.evaluate(() => stDrawerClose());
        const left = await until(() => { renderTeam(); return document.querySelector('#st-att [data-st-need="keep:sales"]') ? null : 'gone'; });
        check('4d the Needs row goes', left === 'gone', left);
      }
    }

    console.log('\n5 · legal hold');
    const end = await page.evaluate(() => { endOrPauseOpen(getContract('KP-3')); const li = document.querySelector('#end-overlay [data-end="archive"]');
      const r = li ? { off: li.classList.contains('is-off'), why: li.getAttribute('title') } : null; const ov = document.getElementById('end-overlay'); if (ov && ov._settle) ov._settle(false); else if (ov) ov.remove(); return r; });
    check('5 End or pause greys Archive on a held contract: "It is on legal hold; release the hold before it is archived."', !!end && end.off
      && end.why === 'It is on legal hold; release the hold before it is archived.', JSON.stringify(end));

    console.log('\n6 · the owner\'s three screens');
    await W.admin.json('/api/keeping/sales', { method: 'PUT', body: { years: 2, then: 'delete' } });
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      /* the period moved on the server: the page is read again */
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 20000 });
      await page.evaluate(() => { setView('team'); settingsGoTab('company'); stDrawerOpen('stream:sales@keeping'); });
      await until(() => !!document.querySelector('[data-st-kp-list]'));
      await page.evaluate(() => { const b = document.querySelector('[data-st-kp-list]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
      const fit = await until(() => { const d = document.getElementById('st-drawer'); if (!d || !d.classList.contains('open') || !document.getElementById('st-kp-go')) return null;
        const r = d.getBoundingClientRect(); if (Math.abs(r.right - innerWidth) > 1) return null;
        const cut = [...d.querySelectorAll('.st-kp-due button, .st-kp-tb td, .st-kp-hrow, .st-ps-tab')].filter(e => e.getBoundingClientRect().right > r.right + 1).length;
        /* a word is cut when its own width is more than the button's (clashes-verify's measure) */
        const btn = [...d.querySelectorAll('.st-kp-due .ui-btn')].filter(b => { const rg = document.createRange(); rg.selectNodeContents(b);
          return rg.getBoundingClientRect().width > b.getBoundingClientRect().width + 1; }).map(b => b.textContent.trim());
        return { cut, btn, page: document.documentElement.scrollWidth - innerWidth }; });
      await shot(page, `keeping-${vp.width}x${vp.height}`);
      check(`6 ${vp.width}×${vp.height}: the tab, its list and its buttons fit`, !!fit && fit.cut === 0 && fit.btn.length === 0 && fit.page <= 0, JSON.stringify(fit));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
