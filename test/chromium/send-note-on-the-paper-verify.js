/* ============================================================
   THE NOTE LIES ON THE PAPER HOWEVER IT GOES (owner, 14 Nov 2026: "review how the email is squeezed in")
   ============================================================
   Driven in a real browser, the new look, a long note put in by shareNoteFill:
     1-3  for Email, WhatsApp and Word file: the box shows ALL its words (no scroll inside it, height = its words)
     4    the box wears no field border on the paper, whichever way it goes
     5    PLAIN LETTER (f1054): an empty note says so; TOP CORNER (f1059) "Write it for me" in the letter's top-right corner; step 1 open keeps 16px inside and
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
        /* RE-POINTED 15 Nov 2026 (TOP CORNER, the owner's pick, f1059): the button stands in the letter's top-right
           corner, level with its first line, off the note's line; nothing of it is in the email */
        const body = document.querySelector('#sh-letter .sh-lt-b').getBoundingClientRect();
        const first = document.querySelector('#sh-letter #sh-lt-before > .sh-lt-p').getBoundingClientRect();
        const words = (document.getElementById('sh-lt-before') || {}).textContent + (document.getElementById('sh-lt-after') || {}).textContent;
        return { corner: Math.abs(b.right - body.right) < 2 && Math.abs((b.top + b.height / 2) - (first.top + first.height / 2)) < 6,
          offNote: b.bottom <= a.top + 2, notInMail: !/Write it for me/.test(words), ph: t.placeholder }; }, 3000);
      check(`${w}x${ht} top corner: "Write it for me" in the letter's top-right corner, off the note's line, never in the email`, !!pl && pl.corner && pl.offNote && pl.notInMail && /No note yet/.test(pl.ph), JSON.stringify(pl));
      await page.evaluate(() => { const s = document.querySelector('.sh-st[data-sh-st="to"]'); if (s && !s.classList.contains('is-open')) document.querySelector('[data-sh-st-go="to"]').click(); });
      /* RE-POINTED 19 Nov 2026 (owner's pick, the steps the Legora way in the page; f1103): step 1 open is no grey box — the
         serif head names it, its person stands in the lines (Person · Email), listed once, nothing else beside */
      const s1 = await waitFor(page, () => { const s = document.querySelector('.sh-st[data-sh-st="to"].is-open'); if (!s) return null;
        const bg = getComputedStyle(s).backgroundColor, head = (document.getElementById('sh-lgx-t') || {}).textContent || '';
        const em = document.getElementById('sh-email'), shownEm = !!(em && em.getClientRects().length && em.value);
        const chips = [...s.querySelectorAll('#sh-st-ppl .sh-st-p, #sh-lt-tosay')].filter(e => e.getClientRects().length).length;
        return { grey: !/rgba\(0, 0, 0, 0\)|transparent/.test(bg), head, shown: (shownEm ? 1 : 0) + chips }; }, 3000);
      check(`${w}x${ht} step 1 open: no grey box, named by the head, its person listed once`, !!s1 && !s1.grey && /Who it goes to/.test(s1.head) && s1.shown === 1, JSON.stringify(s1));
      /* THE NOTE'S LIMIT (f1054 (5)): typed past it, the box stops at the most the email carries; near it, a count */
      const cap = await page.evaluate(async () => { const t = document.getElementById('sh-summary'); t.value = ''; t.focus();
        return { max: t.maxLength }; });
      if (cap && cap.max > 0) { await page.keyboard.insertText('x'.repeat(cap.max + 50)); }
      const capped = await waitFor(page, () => { const t = document.getElementById('sh-summary'), c = document.getElementById('sh-note-count');
        return t && c && !c.hidden ? { len: t.value.length, max: t.maxLength, say: c.textContent } : null; }, 3000);
      check(`${w}x${ht} the note stops at its limit and says how full it is`, !!capped && capped.max === 1000 && capped.len === 1000 && /1000 of 1000/.test(capped.say), JSON.stringify(capped));
      await page.evaluate(() => { const t = document.getElementById('sh-summary'); t.value = ''; t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); });
      check(`${w}x${ht} no script errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
      await page.close();
    }
  } catch (e) { check('the run finished', false, e.message); }
  finally { await browser.close(); if (h.stop) await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
