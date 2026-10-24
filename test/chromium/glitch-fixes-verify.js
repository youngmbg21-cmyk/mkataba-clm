/* ============================================================
   THE GLITCH FIXES (owner, 24 Oct 2026: "fix all the bugs in the list";
   docs/GLITCH-AUDIT-2026-10-23.md is the list)
   ============================================================
   Each finding the audit measured, pressed the way a person presses it,
   in a real browser:
     1  "board" asked on Home after a contract's History shows the Board,
        and the Board's tab pressed while a contract stands on it does too
     2  a contract opened from the Approvals list (landing on Before you
        sign) is left with ONE press of the bar's ‹, back on Approvals, and
        the ‹ says so; a face opened by the reader on the page is still one
        step up
     3  one press draws Jambo's panel once: opening a contract from a list,
        from Home's box, turning the Dossier's tabs, Redlines
     4  what is hidden is not drawn: the Board while a contract opens from
        Home, the closed right-hand panel on a page move; a contract brought up
        on the Board draws the Board once
     5  a double press on a list row draws its panel once before it opens
     6  a "limit reached" answer to a reading HaTi started by itself says
        nothing in a red box (a quiet caller); a pressed one still does
     7  a tab in Jambo's panel is as wide as its words: "Overview" beside
        "99+" is whole, at the three screens, in English and Swedish, and the
        head never spills
     8  the Dossier's last line at the panel's foot is the end of a list that
        scrolls, not words under words
   Counting is not timing: a part drawn twice is counted by the writes to
   it, which do not depend on the machine's speed.
     node test/chromium/glitch-fixes-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'glitch-fixes');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
const ONLY = process.env.HATI_GF_ONLY ? new RegExp(process.env.HATI_GF_ONLY) : null;
const part = n => !ONLY || ONLY.test(String(n));

/* every write of a whole part of the page, by the part's id */
const COUNT_WRITES = () => {
  window.__gfW = {};
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get: d.get, set(v){
    if (this.id) window.__gfW[this.id] = (window.__gfW[this.id] || 0) + 1; return d.set.call(this, v); } });
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  await ctx.addInitScript(COUNT_WRITES);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message.split('\n')[0]));
  const where = () => page.evaluate(() => { let hb = {}; try { hb = hbS(); } catch (_){}
    return { view: state.view, face: hb.face, card: (typeof bsCardId === 'function' && bsCardId()) || null, trail: (typeof pdTrail === 'function' && pdTrail()) ? pdTrail().back : null }; });
  const home = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.evaluate(() => setView('counter'));
    await waitFor(page, () => !!document.getElementById('cn-q') && !!document.getElementById('cn-q').offsetParent); await pause(200); };
  const ask = async w => { await page.fill('#cn-q', w); await page.press('#cn-q', 'Enter'); };
  const writes = () => page.evaluate(() => { const w = window.__gfW; window.__gfW = {}; return w; });
  const settle = async () => { await pause(900); };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A1'), 20000);
    await page.evaluate(() => { if (langId() !== 'en') langSet('en'); });
    await pause(800);

    if (part(1)){
      /* ---- 1  THE BOARD ASKED FOR IS THE BOARD ---- */
      await home(); await ask('MK-A1'); await waitFor(page, () => hbS().face === 'paper');
      await page.locator(':is(.jb-chip,a,button):text-is("history") >> visible=true').first().click();
      const up = await waitFor(page, () => !!bsCardId());
      check('1 (stage) the History link brings the contract up on the Board', up, JSON.stringify(await where()));
      await home(); await ask('board'); await settle();
      const w1 = await where();
      check('1a "board" on Home shows the Board, not the contract left on it', w1.view === 'dashboard' && w1.face === 'board' && !w1.card, JSON.stringify(w1));
      await page.evaluate(() => hbStripBring('MK-A1', 'hist')); await waitFor(page, () => !!bsCardId());
      await page.evaluate(() => hbSetFace('board')); await settle();
      const w2 = await where();
      check('1b the Board\'s own tab, pressed with a contract on it, shows the Board', w2.face === 'board' && !w2.card, JSON.stringify(w2));
    }

    if (part(2)){
      /* ---- 2  ONE ‹ LEAVES A CONTRACT THE LIST OPENED ---- */
      await home(); await page.evaluate(() => setView('approvals'));
      await waitFor(page, () => !!document.querySelector('#content tbody tr[data-ap-row]'));
      await pause(400);
      await page.locator('#content tbody tr[data-ap-row] >> visible=true').first().dblclick();
      await waitFor(page, () => state.view === 'dashboard' && hbS().face === 'paper');
      await pause(900);
      const w0 = await where();
      check('2 (stage) the row opens its contract with a face up', w0.view === 'dashboard' && !!w0.trail, JSON.stringify(w0));
      const tip = await page.evaluate(() => document.getElementById('dk-back').title);
      check('2c ‹ says where it goes', /^Back to Approvals/.test(tip), tip);
      await page.click('#dk-back'); await settle();
      const w1 = await where();
      check('2a one ‹ goes back to Approvals', w1.view === 'approvals', JSON.stringify(w1));
      /* a face the reader opens on the page is still one step up */
      await home(); await ask('MK-B2'); await waitFor(page, () => hbS().face === 'paper'); await pause(900);
      await page.click('[data-pd-tab="red"]'); await waitFor(page, () => typeof pdTrail === 'function' && !!pdTrail()); await pause(400);
      await page.click('#dk-back'); await settle();
      const w2 = await where();
      check('2b a face opened on the page: ‹ steps the panel back first, the paper stays', w2.view === 'dashboard' && w2.face === 'paper' && !w2.trail, JSON.stringify(w2));
    }

    if (part(3)){
      /* ---- 3  ONE PRESS, JAMBO'S PANEL DRAWN ONCE ---- */
      /* the first time a contract is opened in a sitting it is read from the
         server: the panel stands while it loads and is drawn again with it
         (WHEN SOMETHING LOADS, SOMETHING MOVES) — two at most; opened again,
         nothing loads and the panel is drawn once */
      const once = async (name, setup, press) => {
        await setup(); await pause(700); await writes();
        await press(); await settle(); await pause(600);
        const w1 = await writes();
        await setup(); await pause(700); await writes();
        await press(); await settle(); await pause(600);
        const w = await writes();
        check(`3 ${name}: Jambo's panel drawn at most twice the first time (loading, loaded)`, (w1['ig-dock'] || 0) <= 2, JSON.stringify(w1));
        check(`3 ${name}: … and once the next time`, (w['ig-dock'] || 0) <= 1, JSON.stringify(w));
      };
      await once('a contract opened from Approvals', async () => { await home(); await page.evaluate(() => setView('approvals')); await waitFor(page, () => !!document.querySelector('#content tbody tr[data-ap-row]')); },
        () => page.locator('#content tbody tr[data-ap-row] >> visible=true').first().dblclick());
      await once('a contract opened from Home\'s box', home, () => ask('MK-A1'));
      await once('the Dossier\'s Clauses tab', async () => { await home(); await ask('MK-A1'); await waitFor(page, () => hbS().face === 'paper'); }, () => page.click('[data-pd-tab="doc"]'));
      await once('Redlines on a contract under review', async () => { await home(); await ask('MK-B2'); await waitFor(page, () => hbS().face === 'paper'); }, () => page.click('[data-pd-tab="red"]'));
    }
    if (part(4)){
      /* ---- 4  WHAT IS HIDDEN IS NOT DRAWN ---- */
      await home(); await pause(500); await writes();
      await ask('MK-A2'); await waitFor(page, () => hbS().face === 'paper'); await settle();
      const w1 = await writes();
      check('4a a contract opened from Home: the Board it passes is not drawn', !(w1['hb-board'] > 0), JSON.stringify(w1));
      check('4b a page move with the right-hand panel shut does not draw it', !(w1['panel-body'] > 0), JSON.stringify(w1));
      await home(); await ask('MK-A1'); await waitFor(page, () => hbS().face === 'paper'); await pause(800); await writes();
      await page.evaluate(() => hbStripBring('MK-A1', 'hist')); await waitFor(page, () => !!bsCardId()); await settle();
      const w2 = await writes();
      check('4c a contract brought up on the Board draws the Board once', (w2['hb-board'] || 0) <= 1, JSON.stringify(w2));
      await page.click('#cmd-panel'); await waitFor(page, () => state.panelOpen); await pause(500);
      const shown = await page.evaluate(() => (document.getElementById('panel-body') || {}).textContent || '');
      check('4d opened, the right-hand panel is drawn', shown.trim().length > 0, shown.trim().slice(0, 80));
      await page.click('#cmd-panel'); await pause(400);
    }

    if (part(5)){
      /* ---- 5  A DOUBLE PRESS DRAWS THE ROW'S PANEL ONCE ---- */
      await home(); await page.evaluate(() => setView('approvals'));
      await waitFor(page, () => !!document.querySelector('#content tbody tr[data-ap-row]')); await pause(500);
      const row = page.locator('#content tbody tr[data-ap-row] >> visible=true').nth(1);
      await writes(); await row.dblclick(); await settle();
      const w = await writes();
      check('5 a double press on a list row draws its panel once on the way in', (w['jl-body'] || 0) <= 1, JSON.stringify(w));
    }

    if (part(6)){
      /* ---- 6  A QUIET READING SAYS NO RED BOX ---- */
      const said = await page.evaluate(async () => {
        const real = window.fetch;
        window.fetch = (u, o) => /api\/ai\//.test(String(u)) ? Promise.resolve(new Response(JSON.stringify({ error: 'Jambo limit reached — try again in a few minutes' }), { status: 429, headers: { 'Content-Type': 'application/json' } })) : real(u, o);
        const before = document.querySelectorAll('#toast-root .toast-in[data-toast-kind="err"]').length;
        let quietErr = '';
        try { await api('ai/brief', 'POST', { id: 'MK-A1', text: 'x' }, { quiet: true }); } catch (e){ quietErr = e.message; }
        const afterQuiet = document.querySelectorAll('#toast-root .toast-in[data-toast-kind="err"]').length;
        try { await api('ai/brief', 'POST', { id: 'MK-A1', text: 'x' }); } catch (_){}
        const afterLoud = document.querySelectorAll('#toast-root .toast-in[data-toast-kind="err"]').length;
        window.fetch = real;
        return { quiet: afterQuiet - before, loud: afterLoud - afterQuiet, quietErr };
      });
      check('6a a quiet caller is handed the limit, no red box', said.quiet === 0 && /limit/i.test(said.quietErr), JSON.stringify(said));
      check('6b a pressed reading still says it in a red box', said.loud === 1, JSON.stringify(said));
    }

    if (part(7)){
      /* ---- 7  A TAB IS AS WIDE AS ITS WORDS ---- */
      for (const lang of ['en', 'sv']){
        await page.evaluate(l => { if (langId() !== l) langSet(l); }, lang); await pause(600);
        for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
          await page.setViewportSize({ width: w, height: hh });
          for (const where of ['board', 'MK-A1']){
            await home(); await ask(where); await waitFor(page, () => !!document.querySelector('#ig-dock .igd-head .pd-tab')); await pause(700);
            const r = await page.evaluate(() => {
              const head = document.querySelector('#ig-dock .igd-head');
              /* the count a busy book shows, put on the first tab as the book would */
              const t0 = head.querySelector('.pd-tab'); let n = t0.querySelector('.pd-tab-n');
              if (!n){ n = document.createElement('span'); n.className = 'pd-tab-n is-warn'; (t0.querySelector('.pd-tab-i') || t0).appendChild(n); }
              n.textContent = '99+';
              const tabs = [...head.querySelectorAll('.pd-tab')].map(t => { const wd = t.querySelector('.pd-tab-w');
                return { t: (wd ? wd.textContent : t.textContent).trim(), cut: !!wd && wd.scrollWidth > wd.clientWidth + 1 }; });
              const hr = head.getBoundingClientRect();
              const spill = [...head.children].some(c => { const r = c.getBoundingClientRect(); return r.width > 0 && (r.right > hr.right + 1 || r.left < hr.left - 1); });
              return { tabs, spill, sideways: head.scrollWidth > head.clientWidth + 1 };
            });
            check(`7 ${lang} ${w}x${hh} ${where}: every tab's name whole beside a 99+, nothing spills`, !r.tabs.some(t => t.cut) && !r.spill && !r.sideways, JSON.stringify(r));
            if (lang === 'en' && where === 'board') await page.screenshot({ path: path.join(OUT, `7-tabs-${w}x${hh}.png`) });
          }
        }
      }
      await page.evaluate(() => { if (langId() !== 'en') langSet('en'); }); await page.setViewportSize({ width: 1440, height: 780 }); await pause(500);
    }

    if (part(8)){
      /* ---- 8  THE DOSSIER'S FOOT IS A SCROLLING LIST'S END ---- */
      await home(); await ask('MK-A1'); await waitFor(page, () => hbS().face === 'paper'); await pause(1200);
      const r = await page.evaluate(() => { const f = document.getElementById('igd-feed'); if (!f) return null;
        const last = [...f.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getClientRects().length).pop();
        const before = { sh: f.scrollHeight, ch: f.clientHeight };
        f.scrollTop = f.scrollHeight;
        const fr = f.getBoundingClientRect(), lr = last.getBoundingClientRect();
        return { ...before, whole: lr.bottom <= fr.bottom + 1 && lr.top >= fr.top - 1, last: last.textContent.trim().slice(0, 40) };
      });
      check('8 the Dossier\'s last line is reached by scrolling its list, whole', !!r && r.whole, JSON.stringify(r));
      await page.screenshot({ path: path.join(OUT, '8-dossier-foot-scrolled.png') });
    }
  } catch (e) {
    check('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    console.log(`\n${pass}/${pass + fail} passed`);
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    process.exit(fail ? 1 : 0);
  }
})();
