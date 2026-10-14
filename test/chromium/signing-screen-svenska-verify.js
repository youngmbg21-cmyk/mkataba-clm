/* ============================================================
   THE SIGNING SCREEN READS IN SVENSKA (the owner, 14 Oct 2026: "fix the
   Swedish signing screen English text")
   ============================================================
   Before you sign, beside Home's paper, walked in Swedish through the
   moments a person meets it: with things still holding the signature,
   ready (the signing order), the pad, after our signature (their turn, the
   signatures so far on the signing copy, the toast), and the receipt of a
   signed contract (its card on the paper, the copies panel). Every visible
   line of Jambo's panel, the paper's line, the signature block on the paper,
   the pad and the toasts is read, and a line that reads as English fails —
   except what is meant to stay:
     · the company's MARKET speaks its own law (jurisdiction.js — "Electronic
       signature(s) under the Business Laws (Amendment) Act 2020 (Kenya).");
     · the contract's own wording is never translated (only the signature
       block and the signed card on the paper are read, never the clauses).
   Then English still reads exactly as before, the order words follow the
   language ("1:a" · "1st"), and the panel fits at the owner's three screens.
   AT THE PARENT (main at cb2ea46) the seven Svenska claims 2a–5 fail (the
   order rows, the turn row, the line under Sign, the signatures so far, the
   toast, the receipt's copies panel were English); 1 holds there (that
   state's rows were already Swedish), and 6, 7, 8 are guards — the fit, the
   English and the errors.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'signing-screen-svenska');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

/* every visible line that reads as English, outside what is meant to stay */
const ENGLISH = () => {
  const EN = /\b(the|and|is|are|was|has|have|not|yet|of|this|that|with|their|your|you|signed|signature|signer|sign|waiting|already|when|every|party|here|they|own|link|print|copy|copies|open|read|before|after|who|none|seal|sealed|step|turn|next|first|ready|only|press|from|for|recorded|remaining|outstanding)\b/i;
  const KEEP = /Business Laws \(Amendment\) Act/;
  const out = [];
  const pad = (() => { const i = document.getElementById('sig-intent'); let e = i; while (e && e.parentElement && e.parentElement !== document.body) e = e.parentElement; return i ? e : null; })();
  const roots = [['face', document.getElementById('pd-signface')], ['strip', document.getElementById('ig-strip')], ['pad', pad],
    ['toast', document.getElementById('toast-root') || document.querySelector('.toast-stack')],
    ...[...document.querySelectorAll('#ig-paper [data-anchor="sig"], #ig-paper .seal-in')].map(e => ['paper', e])];
  for (const [name, root] of roots) {
    if (!root) continue;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length < 3) continue;
      const el = n.parentElement; if (!el) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
      if (EN.test(t) && !KEEP.test(t)) out.push(name + ': ' + t.slice(0, 120));
    }
    root.querySelectorAll('[title],[aria-label],[alt]').forEach(el => ['title', 'aria-label', 'alt'].forEach(a => {
      const v = el.getAttribute(a); if (v && EN.test(v) && !KEEP.test(v)) out.push(name + ' @' + a + ': ' + v.slice(0, 120)); }));
  }
  return [...new Set(out)];
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') }).catch(() => {});
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0 && window.currentUser && currentUser(), null, { timeout: 15000 });
    await pause(600);
    await page.evaluate(() => langSet('sv'));
    await waitFor(page, () => document.documentElement.lang === 'sv', 4000);

    /* ===== 1. WITH THINGS STILL HOLDING THE SIGNATURE ===== */
    await page.evaluate(() => pdSignOpen('MK-A2'));
    const up = await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A2"]') && !!document.querySelector('#ig-paper .pg-sheet.pg-sign'), 10000);
    await pause(500);
    const e1 = up ? await page.evaluate(ENGLISH) : ['(the face did not open)'];
    check('1 before signing, with holds: no English in the panel', up && e1.length === 0, e1.slice(0, 4).join(' | ') || 'none');

    /* ===== 2. READY: THE SIGNING ORDER ===== */
    await page.evaluate(async () => {
      const c = getContract('MK-A2'); await ensureFull(c); const me = currentUser();
      c.signerPlan = [{ id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false },
        { id: 'sg_cp', party: 'counterparty', name: 'Ola Nordmann', email: 'ola@nandi.co.ke', order: 2, signed: false }];
      state.settings = state.settings || {}; state.settings.signCheckGate = 'off'; await saveSettings();
      if (window.contractBoxesOpen && window.contractBlankSet) contractBoxesOpen(c).forEach(b => contractBlankSet(c, b.key, b.type === 'date' ? '2026-10-01' : 'Angivet', { quiet: true, hold: true }));
      persist(c); await flushSaves(); renderSignButton(c);
    });
    const ready = await waitFor(page, () => { const b = document.getElementById('sign-btn'); return !!b && signBlockers(getContract('MK-A2')).length === 0; }, 8000);
    const r2 = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#pd-signface .font-mono')].map(e => e.textContent.trim()).filter(t => /·/.test(t)),
      note: ((document.querySelector('#pd-signface #sign-btn + p') || {}).textContent || '').trim() }));
    const e2 = await page.evaluate(ENGLISH);
    check('2a ready: the signing order and the Sign button speak Swedish', ready && e2.length === 0, e2.slice(0, 4).join(' | ') || JSON.stringify(r2));
    check('2b the order words follow the language ("1:a", "2:a")', r2.rows.some(t => /^1:a · /.test(t)) && r2.rows.some(t => /^2:a · /.test(t)), JSON.stringify(r2.rows));
    check('2c the line under the Sign button is Swedish', /sigill/.test(r2.note), r2.note);
    await shot('2-ready');

    /* ===== 3. THE PAD ===== */
    await page.click('#sign-btn').catch(() => {});
    const pad = await waitFor(page, () => !!document.getElementById('sig-intent'), 6000);
    const e3 = pad ? await page.evaluate(ENGLISH) : ['(the pad did not open)'];
    check('3 the pad: Swedish, the market\'s law line aside', pad && e3.length === 0, e3.slice(0, 4).join(' | ') || 'none');
    await shot('3-pad');

    /* ===== 4. AFTER OUR SIGNATURE: THEIR TURN ===== */
    if (pad) {
      await page.click('[data-sig-tab="type"]').catch(() => {}); await page.fill('#sig-typed', 'Amina Otieno').catch(() => {});
      await page.click('#sig-intent').catch(() => {}); await page.click('#sig-adopt-go').catch(() => {});
      await waitFor(page, () => !document.getElementById('sig-intent'), 6000);
    }
    const partly = await waitFor(page, () => !!document.querySelector('#ig-paper [data-anchor="sig"]') && (getContract('MK-A2').signatures || []).length > 0, 10000);
    await pause(400);
    const e4 = await page.evaluate(ENGLISH);
    const block = await page.evaluate(() => ((document.querySelector('#ig-paper [data-anchor="sig"]') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 480));
    check('4a after our signature: the panel, the toast and the signatures so far are Swedish', partly && e4.length === 0, e4.slice(0, 4).join(' | ') || block);
    check('4b the signatures so far say "delvis signerat" and the form as a word', /delvis signerat/.test(block) && /skriven underskrift/.test(block), block);
    await page.evaluate(() => { const b = document.querySelector('#ig-paper [data-anchor="sig"]'); if (b) b.scrollIntoView({ block: 'center' }); });
    await shot('4-their-turn');

    /* ===== 5. THE RECEIPT OF A SIGNED CONTRACT ===== */
    await page.evaluate(() => pdSignOpen('MK-A1'));
    const rc = await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A1"]') && !!document.querySelector('#ig-paper .seal-in'), 10000);
    await pause(600);
    const e5 = rc ? await page.evaluate(ENGLISH) : ['(the receipt did not open)'];
    check('5 the receipt: the copies panel and the signed card are Swedish, the market\'s law line aside', rc && e5.length === 0, e5.slice(0, 4).join(' | ') || 'none');
    await page.evaluate(() => { const b = document.querySelector('#ig-paper .seal-in'); if (b) b.scrollIntoView({ block: 'center' }); });
    await shot('5-receipt');

    /* ===== 6. THE OWNER'S THREE SCREENS ===== */
    await page.evaluate(() => pdSignOpen('MK-A2'));
    await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A2"]'), 8000);
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await pause(500);
      const fit = await page.evaluate(() => { const f = document.getElementById('pd-signface'); const r = f && f.getBoundingClientRect();
        const over = f ? [...f.querySelectorAll('button, .font-mono, span')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1); }).map(e => e.textContent.trim().slice(0, 40)) : ['no face'];
        return { over: over.slice(0, 4), sideways: document.documentElement.scrollWidth - window.innerWidth }; });
      check(`6 ${w}×${hh}: the Swedish panel fits — nothing spills past its edge, nothing pushes the page sideways`, fit.over.length === 0 && fit.sideways <= 0, JSON.stringify(fit));
      await shot(`6-svenska-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ===== 7. ENGLISH READS AS BEFORE ===== */
    await page.evaluate(() => langSet('en'));
    await waitFor(page, () => document.documentElement.lang === 'en', 4000);
    await page.evaluate(() => pdSignOpen('MK-A2'));
    await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A2"]'), 8000);
    await pause(500);
    const en = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#pd-signface .font-mono')].map(e => e.textContent.trim()).filter(t => /·/.test(t)),
      block: ((document.querySelector('#ig-paper [data-anchor="sig"]') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 480) }));
    check('7 in English the same lines read as they always did ("1st", "partially signed", "type signature")',
      en.rows.some(t => /^1st · /.test(t)) && /partially signed/.test(en.block) && /type signature/.test(en.block), JSON.stringify(en));
    check('8 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
