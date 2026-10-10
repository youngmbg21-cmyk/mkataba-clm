/* Chromium verification: THE BRAIN'S FIFTH VIEW, STACK (owner-approved
   10 Oct 2026, work order "The Brain's fifth view: Stack", the Journey design
   with its trips in the right-hand panel).
   ====================================================================
   f659 pins the route's counts and the words. This file measures what a
   reader SEES on the real Brain page: "Stack 5" in the bar and the key 5
   opening it, the canvas stepping aside and the stack's rings painted (a ring
   is what is under the pointer, not only a rect), the panel swapped for four
   trips with the open stop's gold "say this" box, a second trip renaming the
   stage, a ring pressed opening its stop in the panel, the arrows moving the
   parcel a stop, a glossary word explaining itself on keyboard focus, the
   counts read from GET /api/brain, no label clipped at 1280 or 1440 wide, a
   refresh coming back to Stack on the same trip and stop, leaving Stack
   putting the Brain's own panel back, and the Swedish words.
   Every claim is GATED on what it measures, so a build without the view
   REPORTS its failures rather than timing out.
   AT THE PARENT (eec0ebd) every check but the page-error sweep FAILS: there
   is no fifth view.
   Run: node test/chromium/brain-stack-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'brain-stack');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    await page.click('#su-go');
    await page.waitForFunction(() => window.state && typeof setView === 'function' && document.querySelector('[data-view="brain"]'), null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    const door = await page.$('[data-view="brain"]');
    if (door) await door.click();
    await page.waitForFunction(() => window.state && state.view === 'brain' && !!document.getElementById('br-cv'), null, { timeout: 15000 }).catch(() => {});

    /* ---- 1. the fifth view, by its button and by the key 5 ---- */
    const btn = await page.$('[data-br-view="4"]');
    const label = btn ? (await btn.textContent()).replace(/\s+/g, ' ').trim() : 'no button';
    ok('1a "Stack 5" sits in the bar after Lanes', /^Stack 5$/.test(label), label);
    if (!btn) throw new Error('no Stack view on this build');
    await page.mouse.click(5, 5);
    await page.keyboard.press('5');
    await page.waitForFunction(() => document.querySelector('[data-br-root]').classList.contains('is-stack') && document.querySelectorAll('#br-stack .br-sk-n').length === 6, null, { timeout: 5000 }).catch(() => {});
    const s1 = await page.evaluate(() => ({
      on: document.querySelector('[data-br-root]').classList.contains('is-stack'),
      pressed: document.querySelector('[data-br-view="4"]').getAttribute('aria-pressed'),
      cv: getComputedStyle(document.getElementById('br-cv')).display,
      title: document.getElementById('br-ov-t').textContent, sub: document.getElementById('br-ov-s').textContent,
      rings: document.querySelectorAll('#br-stack .br-sk-n').length }));
    ok('1b the key 5 opens it and lights its button', s1.on && s1.pressed === 'true', JSON.stringify({ on: s1.on, pressed: s1.pressed }));
    ok('1c the stage says the trip and its stops', /^Stack · You ask Copilot$/.test(s1.title) && /Your browser → The internet → The engine → The memory → Claude AI → Back to you/.test(s1.sub), s1.title + ' | ' + s1.sub);

    /* ---- 2. the canvas steps aside; the rings are what is painted ---- */
    const hit = await page.evaluate(() => {
      const c = document.querySelector('#br-sk-n0 .br-sk-ring'); if (!c) return null;
      const r = c.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const el = document.elementFromPoint(x, y);
      return { inRing: !!(el && el.closest && el.closest('#br-sk-n0')), what: el ? el.tagName + '.' + (el.getAttribute('class') || '') : 'nothing' };
    });
    ok('2a the canvas steps aside', s1.cv === 'none', 'canvas display ' + s1.cv);
    ok('2b six rings, and the first is what is under the pointer', s1.rings === 6 && !!hit && hit.inRing, JSON.stringify(hit));
    await page.screenshot({ path: path.join(OUT, '1-stack.png') });

    /* ---- 3. the panel: four trips, the open stop, the gold box ---- */
    const p3 = await page.evaluate(() => {
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const trips = [...document.querySelectorAll('#br-stk-panel [data-br-stk-trip]')];
      const now = document.querySelector('#br-stk-panel .br-st.is-now');
      const say = document.querySelector('#br-stk-panel .br-stk-say');
      const flows = document.querySelector('#br-panel > .br-psec');
      return { trips: trips.length, pressed: trips.findIndex(b => b.getAttribute('aria-pressed') === 'true'), now: now ? now.getAttribute('data-br-stk-stop') : null,
        say: say && vis(say) ? say.textContent.slice(0, 40) : '', sayBg: say ? getComputedStyle(say).backgroundColor : '',
        brainPanelHidden: !vis(flows), glance: (document.querySelector('#br-stk-panel .br-stk-gl') || {}).textContent || '' };
    });
    ok('3a the panel shows the four trips, the first chosen', p3.trips === 4 && p3.pressed === 0, JSON.stringify({ trips: p3.trips, pressed: p3.pressed }));
    ok('3b the open stop carries the gold "Say this to a developer" box', p3.now === '0' && /^Say this to a developer/.test(p3.say) && p3.sayBg !== 'rgba(0, 0, 0, 0)', p3.say + ' · ' + p3.sayBg);
    ok('3c the Brain\'s own panel (Process flows) steps aside', p3.brainPanelHidden);

    /* ---- 4. the counts are read from the route, never typed in ---- */
    await page.waitForFunction(() => !/reading the code/.test((document.querySelector('#br-stk-panel .br-stk-gl') || {}).textContent || 'reading the code'), null, { timeout: 8000 }).catch(() => {});
    const st = await page.evaluate(async () => { const r = await api('brain', 'GET'); return r && r.stack; });
    const gl = await page.evaluate(() => (document.querySelector('#br-stk-panel .br-stk-gl') || {}).textContent || '');
    ok('4a "at a glance" says the tables, routes and tests the server counted', !!st && gl.includes(st.tables + ' tables') && gl.includes(st.routes + ' routes') && gl.includes(String(st.tests.node)),
      st ? `${st.tables} tables, ${st.routes} routes, ${st.tests.node} tests · ${gl.slice(0, 160)}` : 'no stack');

    /* ---- 5. a second trip renames the stage; a ring opens its stop ---- */
    await page.click('#br-stk-panel [data-br-stk-trip="1"]');
    await page.waitForFunction(() => /You send for signing/.test(document.getElementById('br-ov-t').textContent), null, { timeout: 4000 }).catch(() => {});
    const t5 = await page.evaluate(() => document.getElementById('br-ov-t').textContent);
    ok('5a pressing the second trip changes the stage title', /^Stack · You send for signing$/.test(t5), t5);
    const ring = await page.$('#br-sk-n2 .br-sk-ring');
    if (ring) await ring.click();
    await page.waitForFunction(() => { const n = document.querySelector('#br-stk-panel .br-st.is-now'); return n && n.getAttribute('data-br-stk-stop') === '2'; }, null, { timeout: 4000 }).catch(() => {});
    const r5 = await page.evaluate(() => ({ now: (document.querySelector('#br-stk-panel .br-st.is-now') || { getAttribute: () => null }).getAttribute('data-br-stk-stop'),
      cap: document.getElementById('br-cap-k').textContent, here: !!document.querySelector('#br-sk-n2.is-here') }));
    ok('5b pressing ring 3 opens stop 3 in the panel, the caption and the ring', r5.now === '2' && /^Stop 3 of 6 · A link is made$/.test(r5.cap) && r5.here, JSON.stringify(r5));
    await page.mouse.click(5, 5);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => { const n = document.querySelector('#br-stk-panel .br-st.is-now'); return n && n.getAttribute('data-br-stk-stop') === '3'; }, null, { timeout: 3000 }).catch(() => {});
    const k5 = await page.evaluate(() => ({ now: (document.querySelector('#br-stk-panel .br-st.is-now') || { getAttribute: () => null }).getAttribute('data-br-stk-stop'), stack: document.querySelector('[data-br-root]').classList.contains('is-stack') }));
    ok('5c → moves the parcel one stop, and stays on Stack', k5.now === '3' && k5.stack, JSON.stringify(k5));

    /* ---- 6. a word explains itself on keyboard focus ---- */
    await page.click('#br-stk-panel [data-br-stk-stop="3"]');
    await page.waitForFunction(() => !!document.querySelector('#br-stk-panel .br-stk-open [data-br-term]'), null, { timeout: 3000 }).catch(() => {});
    const tip = await page.evaluate(() => { const w = document.querySelector('#br-stk-panel .br-stk-open [data-br-term]'); if (!w) return null; w.focus();
      const t = document.getElementById('br-stk-tip'); return { word: w.textContent, tab: w.tabIndex, shown: !!t && !t.hidden, text: t ? t.textContent : '' }; });
    ok('6a a dotted word is focusable and its meaning shows on focus', !!tip && tip.tab === 0 && tip.shown && tip.text.length > 20, JSON.stringify(tip));

    /* ---- 7. no label is clipped, at 1440 and at 1280 ---- */
    const clipped = () => page.evaluate(() => {
      const s = document.getElementById('br-stage').getBoundingClientRect(), out = [];
      document.querySelectorAll('#br-stack .br-sk-n text').forEach(t => { const r = t.getBoundingClientRect();
        if (r.left < s.left - .5 || r.right > s.right + .5 || r.top < s.top - .5 || r.bottom > s.bottom + .5) out.push(t.textContent); });
      return out;
    });
    for (const w of [1440, 1280]){
      await page.setViewportSize({ width: w, height: 800 });
      for (let i = 0; i < 4; i++){
        await page.click(`#br-stk-panel [data-br-stk-trip="${i}"]`).catch(() => {});
        await page.waitForFunction(i => document.querySelector(`#br-stk-panel [data-br-stk-trip="${i}"][aria-pressed="true"]`), i, { timeout: 3000 }).catch(() => {});
        const c = await clipped();
        ok(`7 ${w}px, trip ${i + 1}: every label sits inside the stage`, !c.length, c.join(', ') || 'all inside');
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(OUT, '2-ship.png') });

    /* ---- 8. a refresh comes back to Stack, on the same trip and stop ---- */
    await page.click('#br-stk-panel [data-br-stk-trip="1"]');
    await page.click('#br-stk-panel [data-br-stk-stop="3"]');
    await page.evaluate(() => { if (typeof placeSave === 'function') placeSave(); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && state.view === 'brain' && !!document.querySelector('#br-stk-panel .br-st.is-now'), null, { timeout: 15000 }).catch(() => {});
    const r8 = await page.evaluate(() => ({ stack: !!document.querySelector('[data-br-root].is-stack'), title: (document.getElementById('br-ov-t') || {}).textContent,
      now: (document.querySelector('#br-stk-panel .br-st.is-now') || { getAttribute: () => null }).getAttribute('data-br-stk-stop') }));
    ok('8 a refresh lands on Stack, the same trip and stop', r8.stack && /You send for signing/.test(r8.title) && r8.now === '3', JSON.stringify(r8));

    /* ---- 9. leaving Stack puts the Brain back as it was ---- */
    await page.click('[data-br-view="0"]');
    await page.waitForFunction(() => !document.querySelector('[data-br-root]').classList.contains('is-stack'), null, { timeout: 4000 }).catch(() => {});
    const r9 = await page.evaluate(() => {
      const vis = el => !!el && el.getClientRects().length > 0;
      return { cv: getComputedStyle(document.getElementById('br-cv')).display, title: document.getElementById('br-ov-t').textContent,
        flows: document.querySelectorAll('#br-panel > .br-psec [data-br-flow]').length, flowsShown: vis(document.querySelector('#br-panel > .br-psec')),
        stackGone: !vis(document.getElementById('br-stack')) && !vis(document.getElementById('br-stk-panel')) };
    });
    ok('9 the Brain view comes back with its own panel and canvas', r9.cv !== 'none' && r9.title === 'Brain view' && r9.flows > 0 && r9.flowsShown && r9.stackGone, JSON.stringify(r9));

    /* ---- 10. Swedish ---- */
    const sv = await page.$('.lang-btn[data-lang="sv"]');
    if (sv){ await sv.click(); }
    await page.waitForFunction(() => typeof langId === 'function' && langId() === 'sv', null, { timeout: 4000 }).catch(() => {});
    await page.evaluate(() => { if (state.view !== 'brain') setView('brain'); });
    await page.waitForFunction(() => !!document.querySelector('[data-br-view="4"]'), null, { timeout: 5000 }).catch(() => {});
    await page.click('[data-br-view="4"]').catch(() => {});
    await page.waitForFunction(() => !!document.querySelector('#br-stk-panel .br-stk-say'), null, { timeout: 4000 }).catch(() => {});
    const r10 = await page.evaluate(() => ({ head: ((document.querySelector('#br-stk-panel .br-ph h3') || {}).textContent || ''), say: ((document.querySelector('#br-stk-panel .br-stk-say b') || {}).textContent || '') }));
    ok('10 the panel speaks Swedish; the "say this" line stays technical', r10.head === 'Resor genom stacken' && r10.say === 'Säg detta till en utvecklare', JSON.stringify(r10));
  } catch (e) {
    ok('the walk ran to the end', false, e && e.message);
  } finally {
    ok('no page errors', !errs.length, errs.join(' | ') || 'clean');
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
