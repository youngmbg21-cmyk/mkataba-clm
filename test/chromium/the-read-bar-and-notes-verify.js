/* THE READ'S BAR, ITS NOTES, AND THE PAPER WITH JAMBO'S PANEL FOLDED (owner, 8 Nov 2026, over four pictures: "the top bar
   … should be designed as seen in image 2 so spacing is not an issue plus all fonts should be the same size font and on a
   straight line across the bar. All the buttons from continue onwards should be visible"; "the notes should pop on the
   right of the paper as it reads on until the end"; "When you minimize jambo panel, the top bar should remain the same size
   and the back drop should always remain the brownish color"; "keep the buttons"). New look on, a paper with a long name,
   at the owner's three screens:
     1 · Watch the read's bar: the line's height, every word 13px on one straight line, every button (Watch/Continue,
         Start again, Speed, Slow · Normal · Fast, ×) whole and pressable, none under Jambo's panel
     2 · the notes beside the paper wait for the read: none before it starts, more as it reads on, all at the end, and they
         stay once the read is put away
     3 · Jambo's panel folded: the paper's line keeps its height and the desk keeps its brown ground
     4 · a paper that arrives plays the read by itself (owner, 12 Nov 2026: "Read plays by itself"), QUICK whatever speed is
         chosen, every note coming up, and read to the end it puts itself away (the paper's line back); 4b · Pause ends
         the quick run, Continue walks at the chosen speed
     5 · the read bar's × sits in the middle of its circle (owner, 12 Nov 2026; it sat 8px left)
   (The Redlines face keeping Clean · Redline · Their view is negotiate-new-look-verify 2.)
   At the parent 4 and 5 fail (nothing played on arrival; the icon sat 8px left). Earlier, at its own parent, 1–3 failed: a 24px serif title with a wrapping line; no notes during the read; a 36px line on a grey ground.
   Run: node test/chromium/the-read-bar-and-notes-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const SHOTS = process.env.READBAR_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const PARAS = [
  'This Raw Material Supply Agreement is made on [DATE] between Highland Corporate Ltd (the "Buyer") and Nandi Dairy (the "Supplier") for the supply of [GOODS] into the Buyer\'s production facilities in Kenya.',
  ['1. Supply & Specification', 'The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS standard, delivered DDP to the Buyer\'s plant.'],
  ['2. Price & Contract Value', 'The estimated annual contract value is KES 36,000,000, based on agreed per-tonne pricing reviewed quarterly against published commodity indices. Prices are exclusive of VAT and invoices fall due within 30 days of receipt.'],
  ['3. Quality & Rejection', 'Consignments failing specification or Public Health / KEBS requirements may be rejected within 3 days of delivery, with replacement at the Supplier\'s cost.'],
  ['4. Term and Renewal', 'This agreement runs until 30 June 2027 and renews for one year unless either party gives ninety days\' notice.']
];
const HTML = '<h1>Corporate Professional Services Agreement</h1><p>Between Highland Corporate Ltd and Nandi Dairy</p>' + PARAS.map(p => Array.isArray(p) ? `<h2>${p[0].replace('&', '&amp;')}</h2><p>${p[1]}</p>` : `<p>${p}</p>`).join('');

(async () => {
  const h = await startHati();
  const b = fixtureContract('MK-RB', 'Corporate Professional Services Agreement', 'Nandi Dairy', 'proc', 36000000, 'Under Review', 'x');
  Object.assign(b, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, expiry: '2027-06-30',
    upload: { name: 'Corporate_Professional_Services.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString(), uploadedBy: 'Amina Otieno' } });
  await seedWorkspace(h, { contracts: [b] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, VW, VH] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: VW, height: VH } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      /* the sign-in's own landing on the Board is waited for first: a contract opened before it was painted over (GitHub, 13 Nov 2026: laptop-b) */
      await until(page, () => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser() && window._cnSignedIn === false, null, 40000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand('MK-RB'); });
      /* the first screen meets a cold server: its wait is longer, still bounded (GitHub's main run, 12 Nov 2026: laptop-a timed out at 20s) */
      const up = await until(page, () => document.querySelectorAll('#pd2-notes .pd2-mn').length >= 2 && !!document.querySelector('#ig-strip'), null, nm === 'laptop-a' ? 45000 : 20000);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      const total = await page.evaluate(() => document.querySelectorAll('#pd2-notes .pd2-mn').length);
      const lineH = await page.evaluate(() => Math.round(document.getElementById('ig-strip').getBoundingClientRect().height));

      /* 1 · the read's bar */
      await page.evaluate(() => pd2WalkOpen('MK-RB'));
      const head = await until(page, () => !!document.getElementById('pd2-walk-head'), null, 8000);
      const B = head ? await page.evaluate(() => { const hd = document.getElementById('pd2-walk-head'), hr = hd.getBoundingClientRect(), d = document.getElementById('ig-dock').getBoundingClientRect();
        const parts = [...hd.querySelectorAll('.pd2-fh-t, .pd2-fh-m, .ui-btn, .pd2-wk-sp, .pd2-seg button')];
        const btns = [...hd.querySelectorAll('.ui-btn, .pd2-seg button, .pd2-wk-x')];
        const hidden = btns.filter(k => { const r = k.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !r.width || r.right > hr.right + 0.5 || r.right > d.left + 0.5 || !(e && (e === k || k.contains(e))); }).map(k => k.textContent.trim() || 'close');
        return { h: Math.round(hr.height), sizes: [...new Set(parts.map(k => getComputedStyle(k).fontSize))],
          lines: [...new Set(parts.map(k => { const r = k.getBoundingClientRect(); return Math.round(r.top + r.height / 2); }))],
          wraps: parts.filter(k => k.getBoundingClientRect().height > 34).map(k => k.className), hidden, n: btns.length }; }) : null;
      check(`${nm} 1 the read's bar: the line's height, every word 13px on one line, all ${B ? B.n : '?'} buttons whole and pressable`,
        up && !!B && B.h === lineH && B.sizes.length === 1 && B.sizes[0] === '13px' && B.lines.length === 1 && !B.wraps.length && !B.hidden.length && B.n === 6, { lineH, B });

      /* 2 · the notes wait for the read */
      const before = await page.evaluate(() => document.querySelectorAll('#pd2-notes .pd2-mn:not(.is-wk-hold)').length);
      if (head){ await page.click('[data-pd2-wk-speed="fast"]'); await page.click('[data-pd2-wk-play]'); }
      if (SHOTS){ await until(page, () => /Reading § 2/.test((document.getElementById('pd2-walk-foot') || {}).textContent || ''), null, 8000);
        await page.evaluate(() => { const b = document.querySelector('[data-pd2-wk-play]'); if (b) b.click(); });
        await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/read-mid-${nm}.png` });
        await page.evaluate(() => { const b = document.querySelector('[data-pd2-wk-play]'); if (b) b.click(); }); }
      const seen = [];
      const done = await until(page, () => { const n = document.querySelectorAll('#pd2-notes .pd2-mn:not(.is-wk-hold)').length;
        (window.__seen = window.__seen || []).push(n); return /Read whole/.test((document.getElementById('pd2-walk-foot') || {}).textContent || ''); }, null, 30000);
      seen.push(...await page.evaluate(() => [...new Set(window.__seen || [])]));
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/read-done-${nm}.png` });
      const atEnd = await page.evaluate(() => ({ shown: document.querySelectorAll('#pd2-notes .pd2-mn:not(.is-wk-hold)').length, all: document.querySelectorAll('#pd2-notes .pd2-mn').length }));
      await page.evaluate(() => pd2WalkClose());
      await until(page, () => !document.getElementById('pd2-walk-head'), null, 8000);
      const kept = await until(page, n => document.querySelectorAll('#pd2-notes .pd2-mn:not(.is-wk-hold)').length === n, total, 8000);
      const grew = seen.filter(n => n > 0 && n < total).length >= 1;
      check(`${nm} 2 the notes wait for the read: none before, more as it reads, all ${total} at the end, and they stay`,
        before === 0 && done && grew && atEnd.shown === total && atEnd.all === total && kept, { before, seen, atEnd, kept });

      /* 3 · Jambo's panel folded */
      const ground = await page.evaluate(() => getComputedStyle(document.querySelector('.ig-paper')).backgroundColor);
      await page.evaluate(() => { const b = document.getElementById('igd-collapse'); if (b) b.click(); });
      const folded = await until(page, () => !!document.querySelector('#ig-dock > .igd-door'), null, 8000);
      await page.waitForTimeout(300);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/folded-${nm}.png` });
      const F = await page.evaluate(() => ({ h: Math.round(document.getElementById('ig-strip').getBoundingClientRect().height),
        bg: getComputedStyle(document.querySelector('.ig-paper')).backgroundColor, desk: getComputedStyle(document.documentElement).getPropertyValue('--desk-ground').trim() }));
      check(`${nm} 3 Jambo's panel folded: the line keeps its height and the desk its brown ground`,
        folded && F.h === lineH && F.bg === ground && ground !== 'rgb(245, 245, 247)' && ground !== 'rgba(0, 0, 0, 0)', { lineH, ground, F });

      /* 4 · an arrival plays the read by itself, its notes coming up as it reads; 5 · the × sits in the middle of its circle */
      await page.evaluate(() => { try { pd2WalkClose(); } catch (_) {} const d = document.getElementById('igd-expand'); if (d) d.click(); roomHomeLand('MK-RB', { arrived: true }); });
      /* it plays by itself and QUICK, whatever speed is chosen (owner, 12 Nov 2026: "as fast as possible"): read whole within
         a few seconds of the bar showing, every note out */
      const opened = await until(page, () => !!document.getElementById('pd2-walk-foot'), null, 12000);
      const t0 = Date.now();
      /* read to the end, a quick run puts itself away: the bar goes and the paper's own line is back */
      const plays = opened && await until(page, () => !document.getElementById('pd2-walk-head') && !!document.getElementById('ig-strip') && document.getElementById('ig-strip').getBoundingClientRect().height > 0, null, 6000);
      const quickMs = Date.now() - t0;
      const rose = plays && await until(page, () => { const n = document.querySelectorAll('#pd2-notes .pd2-mn'); return n.length > 0 && document.querySelectorAll('#pd2-notes .pd2-mn:not(.is-wk-hold)').length === n.length; }, null, 4000);
      /* 4b · Pause ends the quick run: Continue walks at the chosen speed (Normal still on its clause a second later) */
      const P = await page.evaluate(async () => { const _pd2WalkAt = () => Number(((document.getElementById('pd2-walk-foot') || {}).innerText || '').match(/(\d+) of \d+/)?.[1] || -1); pd2WalkOpen('MK-RB'); pd2WalkReset(); pd2WalkPlay({ quick: true }); await new Promise(r => setTimeout(r, 150)); pd2WalkPlay();
        const at = _pd2WalkAt(); pd2WalkPlay(); await new Promise(r => setTimeout(r, 1000)); const later = _pd2WalkAt(); return { at, later }; });
      const X = await page.evaluate(() => { const x = document.querySelector('#pd2-walk-head .pd2-wk-x'), s = x && x.querySelector('svg'); if (!x || !s) return null;
        const r = x.getBoundingClientRect(), q = s.getBoundingClientRect(); return { dx: +((q.left + q.width / 2) - (r.left + r.width / 2)).toFixed(1), dy: +((q.top + q.height / 2) - (r.top + r.height / 2)).toFixed(1) }; });
      check(`${nm} 4 an arrival plays the read by itself, quick, every note comes up, and it puts itself away`, plays && rose && quickMs < 5000, { opened, plays, rose, quickMs });
      check(`${nm} 4b Pause ends the quick run: Continue walks at the chosen speed`, !!P && P.later - P.at <= 1, P);
      check(`${nm} 5 the × sits in the middle of its circle`, !!X && Math.abs(X.dx) <= 1 && Math.abs(X.dy) <= 1, X);
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
