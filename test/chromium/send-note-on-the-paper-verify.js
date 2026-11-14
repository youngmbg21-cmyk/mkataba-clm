/* ============================================================
   THE NOTE LIES ON THE PAPER HOWEVER IT GOES (owner, 14 Nov 2026: "review how the email is squeezed in")
   ============================================================
   Driven in a real browser, the new look, a long note put in by shareNoteFill:
     1-3  for Email, WhatsApp and Word file: the box shows ALL its words (no scroll inside it, height = its words)
     4    the box wears no field border on the paper, whichever way it goes
     5    PLAIN LETTER (f1053): an empty note says so, "Write it for me" after it; step 1 open keeps 16px inside and
          lists its person once
   Red at the parent: WhatsApp and Word kept a three-row field that scrolled.
     node test/chromium/send-note-on-the-paper-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = process.env.HATI_NOTE_SHOTS || '';
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const ID = 'MK-NP1';
const NOTE = "Hoping you're doing well — when you have a moment, could you take a look at the latest version of the packaging agreement? There are a few points still open that I'd really value your thoughts on. No rush at all, just keen to keep things moving when it suits you. Thanks so much, as always, for your time on this.";
const SIZES = SHOTS ? [[1440, 780], [1536, 730], [1366, 950]] : [[1440, 780]];

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const c = Object.assign(fixtureContract(ID, 'Packaging Supply', 'Kabras Sugar Ltd', 'proc', 1200000, 'Under Review',
    'PACKAGING SUPPLY AGREEMENT\n\n1. Supply\n\nThe Supplier supplies cartons.\n\n2. Payment\n\nInvoices are payable within 30 days.'), {
    counterpartyEmail: 'legal@kabras.example' });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    check('0 the contract is staged', !!(put && put.ok));
    for (const [w, ht] of SIZES) {
      const page = await (await browser.newContext({ viewport: { width: w, height: ht } })).newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go', { timeout: 3000 }).catch(() => {});
      await waitFor(page, id => window.state && state.contracts && state.contracts.some(x => x.id === id), 15000, ID);
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(async () => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en');
        await stPrefSet('newLook', true); newLookApply(); });
      await page.evaluate(id => { pdOpenOnHome(id, 'copilot'); }, ID);
      await waitFor(page, id => window.intel && intel.paper && intel.paper.id === id && !!document.getElementById('ig-canvas'), 10000, ID);
      await page.evaluate(id => openShareModal(getContract(id)), ID);
      const up = await waitFor(page, () => !!document.querySelector('#sh-letter') && !!document.getElementById('sh-summary'), 10000);
      check(`${w}x${ht} the send screen opens`, !!up);
      if (!up) { await page.close(); continue; }
      for (const ch of ['email', 'whatsapp', 'word']) {
        const there = await page.evaluate(k => { const b = document.querySelector(`[data-share-ch="${k}"]`); if (b) b.click(); return !!b; }, ch);
        if (!there) { check(`${w}x${ht} ${ch}: the channel is offered`, false); continue; }
        await waitFor(page, k => { const b = document.querySelector(`[data-share-ch="${k}"]`); return b && b.getAttribute('aria-pressed') === 'true'; }, 3000, ch);
        await page.evaluate(([id, n]) => { const t = document.getElementById('sh-summary'); t.value = ''; return shareNoteFill(id, n); }, [ID, NOTE]);
        const m = await waitFor(page, () => { const t = document.getElementById('sh-summary'); if (!t || !t.getClientRects().length) return null;
          const cs = getComputedStyle(t);
          return { h: t.clientHeight, sh: t.scrollHeight, border: cs.borderTopWidth, rows: t.rows }; }, 3000);
        check(`${w}x${ht} ${ch}: every word of the note shows, nothing to scroll inside the box`, !!m && m.sh <= m.h + 1 && m.h > 60, m && JSON.stringify(m));
        check(`${w}x${ht} ${ch}: the box wears no field border on the paper`, !!m && parseFloat(m.border) === 0, m && m.border);
        if (SHOTS) { await page.evaluate(() => { const t = document.getElementById('sh-summary'); if (t) t.blur(); });
          await page.screenshot({ path: `${SHOTS}/note-${ch}-${w}x${ht}.png` }); }
      }
      /* PLAIN LETTER (owner's pick, 14 Nov 2026): back on Email, the note emptied — "Write it for me" on the note's own
         line; step 1 open keeps 16px inside its grey and lists its person once */
      await page.evaluate(() => { const b = document.querySelector('[data-share-ch="email"]'); if (b) b.click(); });
      await page.evaluate(() => { const t = document.getElementById('sh-summary'); t.value = ''; t.dispatchEvent(new Event('input', { bubbles: true })); try { shareLetterNoteFit(); } catch (_) {} });
      const pl = await waitFor(page, () => { const t = document.getElementById('sh-summary'), j = document.getElementById('sh-nl-jb');
        if (!t || !j || !t.getClientRects().length || !j.getClientRects().length) return null;
        const a = t.getBoundingClientRect(), b = j.getBoundingClientRect();
        return { sameLine: Math.abs(a.top - b.top) < 8 && b.left >= a.right, ph: t.placeholder }; }, 3000);
      check(`${w}x${ht} plain letter: an empty note says so, "Write it for me" right after it`, !!pl && pl.sameLine && /No note yet/.test(pl.ph), JSON.stringify(pl));
      await page.evaluate(() => { const s = document.querySelector('.sh-st[data-sh-st="to"]'); if (s && !s.classList.contains('is-open')) document.querySelector('[data-sh-st-go="to"]').click(); });
      const s1 = await waitFor(page, () => { const s = document.querySelector('.sh-st[data-sh-st="to"].is-open'); if (!s) return null;
        const r = s.getBoundingClientRect(), mk = s.querySelector('.sh-st-mk').getBoundingClientRect(), go = s.querySelector('.sh-st-go').getBoundingClientRect();
        const shown = [...s.querySelectorAll('#sh-st-ppl .sh-st-p, #sh-lt-tosay')].filter(e => e.getClientRects().length).length;
        return { top: Math.round(mk.top - r.top), left: Math.round(mk.left - r.left), right: Math.round(r.right - go.right), shown }; }, 3000);
      check(`${w}x${ht} step 1 open: 16px inside the grey, its person listed once`, !!s1 && s1.top >= 15 && s1.left >= 15 && s1.right >= 15 && s1.shown === 1, JSON.stringify(s1));
      check(`${w}x${ht} no script errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
      await page.close();
    }
  } catch (e) { check('the run finished', false, e.message); }
  finally { await browser.close(); if (h.stop) await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
