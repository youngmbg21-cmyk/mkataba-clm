/* Chromium verification: ONE DOOR TO A NEW AGREEMENT, THE LEGORA WAY
   ============================================================
   The owner, 24 Oct 2026: "When i want a contract i get 2 different doors.
   Why is this" — then picked "The Legora way" by name off the One Door
   drawing, and asked: "i should be able to simply write the type of
   contract i want with the details in the jambo side panel and it drops me
   in step 2 with the details filled in", and "once created it should drop
   in the workspace window with dossier". Answered: pick the paper when it
   is clearly the closest; read the details from the words without AI.

   WHAT THIS PINS, in a real browser at 1440 x 780 (and the owner's other
   two screens for the fit):
     1 the word "new agreement" typed to Jambo opens the ONE sheet beside his
       panel — no card in the chat — with "Most used on our paper", nothing
       picked, and Jambo's line beside it
     2 the + button on Contracts opens the same sheet, no drop-down
     3 a sentence with details, typed in the side panel on the Contracts
       place, lands on the sheet with the paper picked and the details in its
       rows, each saying where it came from — the words quoted
     4 the sheet's two tabs: Their paper shows the drop zone, Create asks for
       the file first
     5 Create (our paper) lands in the Workspace with the Dossier beside the
       paper, on Fill in — not on the conversation
     6 the owner's three screens: the sheet's head and Create in view,
       nothing sideways
     7 no page errors
     8 "Distribution agreement Nordkap sent us" opens the sheet on Their paper
       with who sent it read from the words, and their file is filed under
       that name (as drawn: "Your words, if any, still fill the counterparty")
   Waits ask for the state, bounded. Red at unmodified main (1, 2, 3, 4, 5).
   Run: node test/chromium/one-door-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-door');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SAY = "Two-year supply agreement with Nandi Dairy, 45-day payment, 90 days' notice";

(async () => {
  try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {}
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: [H.fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48000000, 'Under Review')], approvalRules: [] });
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
    await until(() => window.state && state.contracts && state.contracts.length > 0, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const SHEET = () => { const r = document.getElementById('na-root'); if (!r) return null;
      const t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const panel = document.querySelector('[data-dlg-page]'), frame = panel && panel.parentElement, dock = document.getElementById('ig-dock');
      const fr = frame && frame.getBoundingClientRect(), dr = dock && dock.getBoundingClientRect();
      return { one: r.classList.contains('na-one'), paper: r.getAttribute('data-paper'), picked: r.classList.contains('is-picked'),
        head: t(document.querySelector('#wz-pick .na-step b')), rows: [...document.querySelectorAll('#na-closest .na-pick')].filter(vis).map(t),
        checked: [...document.querySelectorAll('#na-closest .na-pick[aria-checked="true"]')].length,
        beside: !!(fr && dr && vis(dock) && Math.abs(fr.right - dr.left) <= 2), card: t(document.getElementById('na-card-name')),
        src: [...document.querySelectorAll('#na-form .na-kt-r')].filter(vis).map(x => ({ term: t(x.firstElementChild), from: t(x.querySelector('.na-src')) })),
        drop: vis(document.getElementById('na-drop')), menu: !!document.getElementById('nd-menu'),
        chatCard: !!document.querySelector('#ig-dock [data-ca-act="draftform"]'),
        jambo: [...document.querySelectorAll('#ig-dock .pd-sheet-hello .ai-bub, #ig-dock .ai-msg .ai-bub')].filter(vis).map(t) }; };
    /* a photograph waits for the glide and crossfade to finish (bounded) */
    const still = () => page.waitForFunction(() => !document.getAnimations().some(a => a.playState === 'running'), null, { timeout: 3000 }).catch(() => {});
    const cancel = async () => { if (await page.evaluate(() => !!document.getElementById('na-root'))) { await page.click('#wz-pick-cancel'); await until(() => !document.getElementById('na-root'), null, 4000); } };

    /* 1 the word, on the Contracts place */
    await page.evaluate(() => setView('register')); await until(() => !!document.getElementById('igd-input'));
    await page.fill('#igd-input', 'new agreement'); await page.press('#igd-input', 'Enter');
    const s1 = await until(SHEET, null, 8000);
    check('1a "new agreement" opens the one sheet beside Jambo, no card in the chat', !!s1 && s1.one && s1.beside && !s1.chatCard, JSON.stringify(s1 && { one: s1.one, beside: s1.beside, chatCard: s1.chatCard }));
    check('1b with no words yet: "Most used on our paper", three rows, nothing picked', !!s1 && s1.head === 'Most used on our paper' && s1.rows.length === 3 && s1.checked === 0 && !s1.picked, JSON.stringify(s1 && { head: s1.head, rows: s1.rows.length, checked: s1.checked }));
    check('1c Jambo says what the sheet is for beside it', !!s1 && s1.jambo.some(x => /opened New agreement beside me/.test(x)), JSON.stringify(s1 && s1.jambo));
    await still(); await page.screenshot({ path: path.join(OUT, '01-word.png') });
    await cancel();

    /* 2 the + button */
    await page.evaluate(() => setView('register')); await page.waitForTimeout(300);
    const pressed = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /draft a new agreement|draft new agreement/i.test(x.textContent || '') && x.getClientRects().length); if (b) { b.click(); return b.textContent.trim(); } return ''; });
    const s2 = await until(SHEET, null, 6000);
    check('2 the + button opens the same sheet, no drop-down before it', !!pressed && !!s2 && s2.one && !s2.menu, JSON.stringify({ pressed, menu: s2 && s2.menu }));
    await cancel();

    /* 3 the sentence with details, in the side panel */
    await page.evaluate(() => setView('register')); await until(() => !!document.getElementById('igd-input'));
    await page.fill('#igd-input', SAY); await page.press('#igd-input', 'Enter');
    const s3 = await until(() => { const r = document.getElementById('na-root'); return r && r.classList.contains('is-picked') ? true : null; }, null, 10000) && await page.evaluate(SHEET);
    const from = k => ((s3 && s3.src) || []).find(x => new RegExp(k, 'i').test(x.term));
    check('3a the paper is picked: it is clearly the closest', !!s3 && s3.picked && !!s3.card, JSON.stringify(s3 && { picked: s3.picked, card: s3.card }));
    check('3b the details are in its rows, each quoting the words it came from',
      !!from('other company') && /Nandi Dairy/.test(from('other company').from) && !!from('Payment') && /45-day payment/.test(from('Payment').from) && !!from('End') && /Two-year/.test(from('End').from),
      JSON.stringify(s3 && s3.src));
    check('3c a box nobody said is "Not said yet", one the paper fills "The paper\'s own"',
      !!s3 && s3.src.some(x => /Not said yet/.test(x.from)) && s3.src.some(x => /The paper's own/.test(x.from)), JSON.stringify(s3 && s3.src.map(x => x.from)));
    await still(); await page.screenshot({ path: path.join(OUT, '03-sentence.png') });

    /* 4 their paper */
    await page.click('[data-na-paper="theirs"]');
    const s4 = await until(() => { const r = document.getElementById('na-root'); return r && r.getAttribute('data-paper') === 'theirs' ? { drop: !!document.getElementById('na-drop').getClientRects().length, create: document.getElementById('na-create').disabled, why: (document.getElementById('na-why') || {}).textContent || document.getElementById('na-create').title } : null; }, null, 4000);
    check('4 Their paper: the drop zone, and Create waits for their file', !!s4 && s4.drop && s4.create && /file/i.test(s4.why), JSON.stringify(s4));
    await still(); await page.screenshot({ path: path.join(OUT, '04-theirs.png') });
    await page.click('[data-na-paper="ours"]');

    /* 6 the owner's three screens: head and Create in view, nothing sideways */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250);
      const fit = await page.evaluate(() => { const b = document.getElementById('na-create'), r = b && b.getBoundingClientRect();
        const body = document.querySelector('[data-dlg-page] .dlg-pg-body') || document.getElementById('na-body');
        return { create: !!(r && r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth), sideways: body ? body.scrollWidth - body.clientWidth : 0, page: document.documentElement.scrollWidth - innerWidth }; });
      check(`6 ${w}x${ht}: Create in view, nothing sideways`, fit.create && fit.sideways <= 1 && fit.page <= 1, JSON.stringify(fit));
      await still(); await page.screenshot({ path: path.join(OUT, `06-sheet-${w}x${ht}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 5 Create lands in the Workspace with the Dossier */
    await page.evaluate(() => { const b = document.querySelector('#na-file [data-na-stream]'); if (b) b.click(); });
    await page.evaluate(() => { const m = [...document.querySelectorAll('#na-form input')].find(i => /supplied|material/i.test((i.closest('label') || {}).textContent || '')); if (m) { m.value = 'Raw milk'; m.dispatchEvent(new Event('input', { bubbles: true })); } });
    await until(() => !document.getElementById('na-create').disabled, null, 4000);
    await page.click('#na-create');
    const land = await until(() => !document.getElementById('na-root') && window.intel && intel.paper && document.querySelector('#ig-dock .ds-sp-st')
      ? { view: state.view, face: window.hbS && hbS().face, tab: window.pdTab && pdTab(), talk: !!document.querySelector('#ig-dock [data-jb-turns]'), fill: !!document.querySelector('#ig-dock .ds-sp-st.is-on, #ig-dock .ds-sp-st') } : null, null, 15000);
    check('5 Create lands in the Workspace with the Dossier beside the paper, not on the conversation',
      !!land && land.face === 'paper' && land.tab === 'copilot' && !land.talk, JSON.stringify(land));
    await still(); await page.screenshot({ path: path.join(OUT, '05-landed.png') });

    /* 8 their paper, read from the words: the sheet opens on Their paper, says who sent it, and the file is filed under that name */
    await page.evaluate(() => setView('register')); await until(() => !!document.getElementById('igd-input'));
    await page.fill('#igd-input', 'Distribution agreement Nordkap sent us'); await page.press('#igd-input', 'Enter');
    const s8 = await until(() => { const r = document.getElementById('na-root'); if (!r || r.getAttribute('data-paper') !== 'theirs') return null;
      const vis = el => !!(el && el.getClientRects().length);
      const said = [...document.querySelectorAll('#ig-dock .ca-dr-said')].pop();
      return { drop: vis(document.getElementById('na-drop')), with: [...document.querySelectorAll('#na-read [data-na-rd="with"] span')].map(x => x.textContent.trim()),
        said: said ? said.innerText.trim() : '', picked: r.classList.contains('is-picked') }; }, null, 8000);
    check('8a "… Nordkap sent us" opens the sheet on Their paper, nothing of ours picked', !!s8 && s8.drop && !s8.picked, JSON.stringify(s8));
    check('8b the row says who sent it, quoting the words', !!s8 && /^Nordkap\b/.test(s8.with[1] || '') && /^“Nordkap”$/.test(s8.with[s8.with.length - 1] || ''), JSON.stringify(s8 && s8.with));
    check('8c Jambo says it sounds like their paper', !!s8 && /^That sounds like their paper, so I opened the Their paper tab\./.test(s8.said), s8 && s8.said);
    await still(); await page.screenshot({ path: path.join(OUT, '08-theirs-from-words.png') });
    const n8 = await page.evaluate(() => state.contracts.length);
    await page.setInputFiles('#na-theirs-input', { name: 'nordkap-distribution.txt', mimeType: 'text/plain',
      buffer: Buffer.from('DISTRIBUTION AGREEMENT\n\n1. Appointment\n\nThe Supplier appoints the Distributor for the region.\n\n2. Term\n\nThis agreement runs for two years.\n') });
    await page.evaluate(() => { const b = document.querySelector('#na-file [data-na-stream]'); if (b) b.click(); });
    await until(() => !document.getElementById('na-create').disabled, null, 4000);
    await page.click('#na-create');
    const made8 = await until(n => state.contracts.length > n ? (state.contracts.find(c => /nordkap/i.test(String(c.name || '') + ' ' + String((c.upload || {}).name || ''))) || state.contracts[0] || {}).counterparty || '' : null, n8, 20000);
    check('8d Create files their file with the other company your words named', made8 === 'Nordkap', String(made8));

    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run', false, e && e.stack || String(e));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
