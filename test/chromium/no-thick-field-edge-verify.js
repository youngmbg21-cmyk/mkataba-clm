/* NO THICK OR DARK EDGE ON AN ENTRY FIELD (owner, 19 Nov 2026: "i never want to see thick outlines in entry fields
   apart from what is already on jambo. I have been saying this for weeks"; f1086)

   WHAT THIS PINS, in a real browser as an admin: on the pages a person types on most, every visible entry field is
   pressed, and neither it nor the box that holds it shows an outline, a glow, an edge thicker than 1px, or an edge
   that is not the one light grey (--color-neutral-300) — Jambo's own box (.jb-card) excepted, which keeps its green.
   At the parent the contacts pop-up's fields and New agreement's ask box draw a black edge when pressed, so it fails.
   Waits ask for the state, bounded; a page that cannot be reached reports.
   Run: node test/chromium/no-thick-field-edge-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const { seedRound6, R6_IN_PAGE } = require('../round6-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedRound6(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(150); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-CR'), null, 40000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(R6_IN_PAGE).catch(() => {});

    /* press every visible entry field and read its edge and its holder's; return the ones that show more than the light grey */
    const heavy = () => page.evaluate(() => {
      const GREY = (() => { const d = document.createElement('i'); d.style.color = 'var(--color-neutral-300)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })();
      const sel = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]):not([type=hidden]):not([type=file]),textarea,select';
      const bad = [];
      const edge = e => { const c = getComputedStyle(e); const sides = ['Top', 'Right', 'Bottom', 'Left'].map(s => [parseFloat(c['border' + s + 'Width']) || 0, c['border' + s + 'Color']]);
        return { o: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0, s: c.boxShadow !== 'none', sides }; };
      const wrong = x => x.o || x.s || x.sides.some(([w, col]) => w > 1.01 || (w > 0 && col !== GREY));
      const fields = [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 30 && r.height > 14 && r.bottom > 0 && r.top < innerHeight && !e.disabled; });
      for (const e of fields) {
        e.focus({ focusVisible: true });
        const holder = e.parentElement && e.parentElement.closest('.jl-box, .lh-ask, .apn-box, .na-askbox, .rl-np-box, .cmd-search, .hist-q, .sh-col-in, .reg-chip, .pc-f, label');
        const jambo = !!e.closest('.jb-card');
        const me = edge(e), hold = holder && !jambo ? edge(holder) : null;
        /* the rest-state edge of a field with no border is 0 wide and draws nothing: only what is visible is judged */
        if (wrong(me) || (hold && wrong(hold))) bad.push((e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' ' + JSON.stringify({ me, hold }).slice(0, 220));
        e.blur();
      }
      return { n: fields.length, bad };
    });
    const visit = async (name, fn, ready) => {
      await page.evaluate(fn).catch(() => {});
      const ok = await until(ready, null, 10000);
      if (!ok) { check(name + ': the page was reached', false, 'not drawn'); return; }
      await page.waitForTimeout(300);
      const R = await heavy();
      check(`${name}: no pressed field shows a ring, a glow, a thick or a dark edge (${R.n} fields)`, R.n > 0 && R.bad.length === 0, R.bad.slice(0, 3).join(' | '));
    };
    await visit('Parties', () => setView('customers'), () => !!document.querySelector('#cun-q'));
    await visit('Contacts pop-up', () => partyContactsOpen('naivas supermarkets', { add: true }), () => !!document.getElementById('pc-name'));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    await visit('Contracts', () => { regPlaceSet({ show: 'list' }); setView('register'); }, () => !!document.querySelector('#ct-place input[type="search"]'));
    await visit('People', () => setView('directory'), () => !!document.querySelector('#dirn-q'));
    await visit('New agreement', () => openNewAgreement(), () => !!document.querySelector('#dr-say'));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    await visit("A contract's Dossier", () => pdOpenOnHome('MK-B2', 'copilot'), () => !!document.querySelector('#igd-input'));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
