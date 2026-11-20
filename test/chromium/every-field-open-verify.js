/* EVERY ENTRY FIELD IS OPEN, THE LEGORA WAY (owner, 19 Nov 2026: "all of hati at once"; f1110).
     1 · at the owner's three screens, in eight places (New agreement, Ask for a contract, New event, Add approval
         rule, Discover's filters, Your account, Company and market, the Send screen), no visible entry field wears
         a box: no edge on its top, left or right, and no fill. The boxes that HOLD a field (Jambo's, search boxes)
         are not entry fields and are not counted.
     2 · New agreement's and the request's Who pays whom are pill buttons, not a dropdown or a segmented box
     3 · the pop-ups' rows put the label BESIDE the words (same line), the line under the row
     4 · the Send screen's To step draws ONE line under a row, never two (a row's own line + a field's)
     5 · nothing sideways; no page errors
   Red at the parent: 1 in every place but the Send screen; 2 (the request's dropdown, the segmented box); 3.
   Run: node test/chromium/every-field-open-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'every-field-open');
fs.mkdirSync(OUT, { recursive: true });
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 10000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const PLACES = [
  ['new agreement', () => openNewAgreement({}), () => !!document.querySelector('#na-root'),
    () => { const b = document.querySelector('.na-ask textarea, .na-ask input'); if (!b) return; b.value = 'Two-year equipment lease of a filling line with Foretag AB'; b.dispatchEvent(new Event('input', { bubbles: true })); b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); },
    () => !!document.querySelector('.na-kt-grid .na-kt-r')],
  /* RE-POINTED 19 Nov 2026 (f1119, the one edit pop-up in three steps): the first step measured alone; the named
     place walks to step two, where Who pays whom stands */
  ['ask for a contract, first step', () => openIntakeForm(), () => !!document.querySelector('#ik-title')],
  ['ask for a contract', () => openIntakeForm(), () => !!document.querySelector('#ik-title'),
    () => { document.getElementById('ik-title').value = 'x'; document.getElementById('ik-need').value = 'y'; document.getElementById('ik-next').click(); },
    () => { const w = document.querySelector('[data-pw-for="ik-e-side"]'); return !!w && !w.closest('[hidden]'); }],
  ['new event', () => calEventDialog(), () => !!document.querySelector('#cal-ev-title')],
  ['add approval rule', () => { setView('team'); openApprovalRuleEditor(); }, () => !!document.querySelector('#ar-cond')],
  ['discover filters', () => setView('reads'), () => !!document.querySelector('#rd-page select')],
  ['your account', () => openMyAccount(), () => !!document.querySelector('#acct-title')],
  ['company and market', () => openSettingsAt('company', 'company'), () => !!document.querySelector('#st-co-name')],
  ['send screen', () => { const c = state.contracts.find(x => /draft|review/i.test(x.status)) || state.contracts[0]; openShareModal(c); }, () => !!document.querySelector('.sh-lt-who input')],
];
const BOXES = '.jb-card, #cmd-palette, .sh-col-in, .cmd-search, .hist-q, .reg-chip, .reg-f-v, .jl-box, .ik-search, .lh-ask, .na-askbox, .na-ask, .rl-np-box, .rl-card-reply, .sdd-find, .tpln5-box, .nd-bar, .lin-wrap, .pd2-fm-mid';

(async () => {
  const h = await startHati(); await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [w, hh] of SCREENS){
      const P = await (await browser.newContext({ viewport: { width: w, height: hh } })).newPage();
      const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
      await P.goto(h.base + '/', { waitUntil: 'networkidle' });
      await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
      const ready = await until(P, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 1 && typeof window.openNewAgreement === 'function' && typeof window.currentUser === 'function' && !!currentUser(), null, 20000);
      check(ready, `${w}×${hh} signed in`);
      if (!ready){ await P.close(); continue; }
      for (const [name, open, isUp, then, thenUp] of PLACES){
        await P.evaluate(() => { try { closeModal(); } catch (_) {} });
        try { await P.evaluate(open); } catch (e) { check(false, `${w}×${hh} ${name}: opens`, String(e).slice(0, 120)); continue; }
        if (!await until(P, isUp, null, 10000)){ check(false, `${w}×${hh} ${name}: opens`); continue; }
        if (then){ await P.evaluate(then); await until(P, thenUp, null, 10000); }
        await P.waitForTimeout(400);
        const r = await P.evaluate(BOXES => {
          const boxed = [];
          for (const e of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=search]), select, textarea, .dp-face')){
            const b = e.getBoundingClientRect(); if (b.width < 40 || b.height < 14 || b.bottom < 0 || b.top > innerHeight || b.right < 0 || b.left > innerWidth) continue;
            const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') continue;
            if (/-q$/.test(e.id || '') || e.closest(BOXES)) continue;
            const sides = ['Top', 'Right', 'Left'].filter(k => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none' && !/, 0\)$/.test(s['border' + k + 'Color']));
            const filled = !/rgba\(0, 0, 0, 0\)|rgb\(255, 255, 255\)/.test(s.backgroundColor);
            if (sides.length || filled) boxed.push((e.id || e.className || e.tagName) + (sides.length ? ' edge' : '') + (filled ? ' fill' : ''));
          }
          const pw = [...document.querySelectorAll('.pw .na-seg-b')].filter(b => b.getBoundingClientRect().width > 0);
          const pwPill = pw.length ? pw.every(b => parseFloat(getComputedStyle(b).borderTopLeftRadius) >= 12) : null;
          const side = document.querySelector('#ik-e-side');
          /* the first label SHOWN (a sheet in steps keeps its other steps in the form, hidden); the one edit pop-up's
             lines (.lgp-row > .lgp-k) are such rows too (f1119) */
          const sapRow = [...document.querySelectorAll('.modal-in .sap-f > label, .modal-in .sap-f > .sap-lbl, .modal-in .lgp-row > .lgp-k')]
            .find(l => l.getClientRects().length && l.parentElement.querySelector('input:not([type=hidden]), select, textarea, .dp-face, .pw')) || null;
          let beside = null;
          if (sapRow){ const f = sapRow.parentElement.querySelector('input:not([type=hidden]), select, textarea, .dp-face, .pw'); if (f){ const a = sapRow.getBoundingClientRect(), c = f.getBoundingClientRect(); beside = c.left > a.right - 1 && Math.abs((a.top + a.bottom) / 2 - (c.top + c.bottom) / 2) < 30; } }
          let sendLines = null;
          const who = document.querySelector('.sh-lt-who input');
          if (who){ const row = who.closest('label'); sendLines = [parseFloat(getComputedStyle(who).borderBottomWidth) || 0, parseFloat(getComputedStyle(row).borderBottomWidth) || 0].filter(x => x > 0).length; }
          return { boxed, pwPill, sideIsSelect: !!(side && side.tagName === 'SELECT'), beside, sendLines, sideways: document.documentElement.scrollWidth - innerWidth };
        }, BOXES);
        check(r.boxed.length === 0, `1 ${w}×${hh} ${name}: no field wears a box`, r.boxed.slice(0, 6));
        if (name === 'new agreement') check(r.pwPill === true, `2 ${w}×${hh} ${name}: Who pays whom is pill buttons`, r.pwPill);
        if (name === 'ask for a contract'){
          check(!r.sideIsSelect && r.pwPill === true, `2 ${w}×${hh} ${name}: Who pays whom is pill buttons, not a dropdown`, r);
          check(r.beside === true, `3 ${w}×${hh} ${name}: the label stands beside the words`, r.beside);
        }
        if (name === 'add approval rule') check(r.beside === true, `3 ${w}×${hh} ${name}: the label stands beside the words`, r.beside);
        if (name === 'send screen') check(r.sendLines === 1, `4 ${w}×${hh} ${name}: one line under a row, not two`, r.sendLines);
        check(r.sideways <= 0, `5 ${w}×${hh} ${name}: nothing sideways`, r.sideways);
        await P.screenshot({ path: path.join(OUT, `${w}x${hh}-${name.replace(/\s+/g, '-')}.png`) });
      }
      check(errors.length === 0, `5 ${w}×${hh}: no page errors`, errors.join(' | '));
      await P.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
