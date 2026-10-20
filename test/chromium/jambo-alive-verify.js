/* Chromium verification: JAMBO, ALIVE
   ============================================================
   Owner, 16 Oct 2026: "show me how we can make jambo more engaging than
   currently is where it is mostly stagnant and not moving" — four options
   drawn on the real page; the owner picked "Alive" by name: he sits on the
   chips row and breathes; he turns to the paper when words on it are chosen;
   while he works, his thinking face and the turning ring; when something is
   done he hops, and the row in the at-a-glance card ticks off.

   Driven in a real browser on Home's Document face. Waits ask for the state,
   bounded. Red at the parent (feb17f1): every check but 4b, 4c and 6a, the
   guards that hold there too — there is no perch, no tick-off and nothing
   moves.

   Run: node test/chromium/jambo-alive-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-alive');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 6000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(80); }
    return v; };
  const perch = () => page.evaluate(() => {
    const el = document.querySelector('#ig-dock .jb-perch');
    if (!el) return { on: false };
    const img = el.querySelector('.jb-bird'), say = el.querySelector('.jb-say');
    const r = el.getBoundingClientRect(), row = el.parentElement;
    const chips = row && row.matches('[data-ig-chips]') ? [...row.children].filter(k => k !== el).map(k => k.getBoundingClientRect()) : [];
    return { on: true, inChips: !!(row && row.matches('[data-ig-chips]')), w: Math.round(r.width),
      overChip: chips.some(k => k.right > r.left && k.left < r.right && k.bottom > r.top && k.top < r.bottom),
      anim: getComputedStyle(img).animationName, think: img.src === JAMBO_FACE.think,
      working: el.classList.contains('is-working'), hop: el.classList.contains('is-hop'), look: el.classList.contains('is-look'),
      say: say && !say.hidden ? say.textContent.trim() : '', ring: !!(say && !say.hidden && say.querySelector('.ob-spin')),
      hidden: el.getAttribute('aria-hidden') };
  });
  /* at rest = breathing, not working, not mid-hop. A paper opening wears the
     ring; he mirrors it and HOPS when it ends (0.65s) — a fixed pause landed
     on the hop one run in four (17 Oct 2026). Ask for the state, bounded. */
  const atRest = (ms = 3000) => until(() => { const el = document.querySelector('#ig-dock .jb-perch'), img = el && el.querySelector('.jb-bird');
    return img && !el.classList.contains('is-working') && !el.classList.contains('is-hop') && getComputedStyle(img).animationName === 'jbBreathe' ? true : null; }, null, ms);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 15000 });

    /* ============ 1. WHERE HE SITS ============ */
    /* Contracts opens on the List (owner, 20 Oct 2026): this check walks the Wall */
    await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); hbOpenContracts(); });
    await until(() => !!document.querySelector('#ct-place [data-ig-pick]'));
    await atRest();
    const w = await perch();
    check('1a on the wall he sits at the end of the chips row, over no chip, breathing',
      w.on && w.inChips && !w.overChip && w.anim === 'jbBreathe' && w.hidden === 'true', JSON.stringify(w));
    /* RE-POINTED 18 Oct 2026 (round 13 as drawn): a press chooses the paper, a second opens it */
    await page.click('[data-ig-pick="MK-B2"]'); await page.click('[data-ig-pick="MK-B2"]');
    await until(() => intel.paper && intel.paper.id === 'MK-B2' && document.getElementById('pd-glance'));
    await atRest();
    const p1 = await perch();
    await page.screenshot({ path: path.join(OUT, '1b-on-the-paper.png') });
    check('1b beside a paper too: the chips row\'s end, 36px, breathing', p1.on && p1.inChips && !p1.overChip && p1.w === 36 && p1.anim === 'jbBreathe', JSON.stringify(p1));
    await page.evaluate(() => { pdSetTab('doc'); renderIntelDock(); });
    const off = await until(() => !document.querySelector('#ig-dock .jb-perch') ? 'gone' : null, null, 2000);
    await page.evaluate(() => { pdSetTab('copilot'); renderIntelDock(); });
    const back = await until(() => !!document.querySelector('#ig-dock [data-ig-chips] .jb-perch'), null, 2000);
    check('1c not on the Clauses tab (no chips, no ask box there); back on his own tab', off === 'gone' && !!back);

    /* ============ 2. HE WORKS, AND HOPS WHEN IT IS DONE ============ */
    await page.evaluate(() => { intel.busy = true; renderIntelDock(); });
    const t1 = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); return el && el.classList.contains('is-working') ? true : null; }, null, 2000);
    const p2 = await perch();
    await page.screenshot({ path: path.join(OUT, '2a-thinking.png'), clip: { x: 1050, y: 95, width: 390, height: 685 } });
    check('2a while he answers: his thinking face, the turning ring and "Thinking…"', !!t1 && p2.think && p2.ring && p2.say === 'Thinking…', JSON.stringify(p2));
    await page.evaluate(() => { intel.busy = false; renderIntelDock(); });
    const hop1 = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); return el && el.classList.contains('is-hop') ? true : null; }, null, 2000);
    const p3 = await perch();
    check('2b the answer in, he hops and wears his own face again, the words gone', !!hop1 && !p3.think && !p3.working && p3.say === '', JSON.stringify(p3));
    /* a wait drawn by the house's own ring elsewhere on Home (a paper being opened on the wall, job 1) */
    await page.evaluate(() => { const s = document.createElement('span'); s.id = 'jb-probe'; s.innerHTML = busyHtml('Sending…'); document.getElementById('ig-strip').appendChild(s); });
    const p4 = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); const say = el && el.querySelector('.jb-say'); return say && !say.hidden ? say.textContent.trim() : null; }, null, 2000);
    check('2c a wait the screen shows elsewhere is his work too, in its own words', p4 === 'Sending…', String(p4));
    await page.evaluate(() => document.getElementById('jb-probe').remove());
    const hop2 = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); return el && el.classList.contains('is-hop') && !el.classList.contains('is-working') ? true : null; }, null, 2000);
    check('2d and when it ends, he hops', !!hop2);
    await page.waitForTimeout(800);
    await page.evaluate(() => toast('Sent to Naivas Supermarkets', 'ok'));
    const hop3 = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); return el && el.classList.contains('is-hop') ? true : null; }, null, 1500);
    check('2e an act confirmed ("ok") is a thing done: he hops', !!hop3);

    /* ============ 3. HE TURNS TO THE WORDS CHOSEN ON THE PAPER ============ */
    await page.evaluate(() => { const c = document.querySelector('#ig-paper p') || document.querySelector('#ig-paper .rl-clause') || document.querySelector('#ig-paper div');
      const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    const look = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); return el && el.classList.contains('is-look') ? true : null; }, null, 2000);
    await page.screenshot({ path: path.join(OUT, '3a-looking.png'), clip: { x: 640, y: 95, width: 800, height: 685 } });
    await page.evaluate(() => getSelection().removeAllRanges());
    const unlook = await until(() => { const el = document.querySelector('#ig-dock .jb-perch'); return el && !el.classList.contains('is-look') ? true : null; }, null, 2000);
    check('3a words chosen on the paper: he turns to them; let go: he turns back', !!look && !!unlook);

    /* ============ 4. A ROW THAT GOES IS TICKED OFF ============ */
    const g0 = await page.evaluate(() => [...document.querySelectorAll('#pd-glance [data-pd-gl]')].map(x => x.getAttribute('data-pd-gl')));
    /* the empty detail is filled (the way a save repaints the panel) */
    await page.evaluate(() => { const c = getContract('MK-B2'); c.fields = { ...(c.fields || {}), effDate: '2026-11-01' }; pdGlanceRepaint(); });
    const done = await until(() => { const d = document.querySelector('#pd-glance .pd-gl-row.is-done[data-pd-gl-done="fill"]');
      return d ? { text: d.textContent.trim(), struck: !!d.querySelector('s'), tick: !!d.querySelector('i'),
        hop: document.querySelector('#ig-dock .jb-perch').classList.contains('is-hop') } : null; }, null, 2000);
    await page.screenshot({ path: path.join(OUT, '4a-ticked-off.png'), clip: { x: 1050, y: 95, width: 390, height: 300 } });
    check('4a the row no longer owed is ticked off in its own words, struck through, and he hops',
      g0.includes('fill') && !!done && done.struck && done.tick && /detail/.test(done.text) && done.hop, JSON.stringify({ g0, done }));
    const gone = await until(() => !document.querySelector('#pd-glance .pd-gl-row.is-done') ? true : null, null, 4000);
    const still = await page.evaluate(() => [...document.querySelectorAll('#pd-glance [data-pd-gl]')].map(x => x.getAttribute('data-pd-gl')));
    check('4b then it leaves, and the rows still owed stay', !!gone && !still.includes('fill') && g0.filter(k => k !== 'fill').every(k => still.includes(k)), JSON.stringify(still));
    /* opening another paper ticks nothing off: its rows are not the last one's */
    /* Contracts opens on the List (owner, 20 Oct 2026): this check walks the Wall */
    await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); hbOpenContracts(); });
    await until(() => !!document.querySelector('#ct-place [data-ig-pick="MK-A2"]'));
    await page.click('[data-ig-pick="MK-A2"]'); await page.click('[data-ig-pick="MK-A2"]');
    await until(() => intel.paper && intel.paper.id === 'MK-A2' && document.getElementById('pd-glance'));
    await page.waitForTimeout(300);
    check('4c another contract ticks nothing off', await page.evaluate(() => !document.querySelector('#pd-glance .pd-gl-row.is-done')));

    /* ============ 5. LESS MOTION ============ */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    const still5 = await perch();
    check('5a for a reader who asked for less motion he stands still (the faces and words still change)', still5.on && still5.anim === 'none', JSON.stringify(still5));
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    check('6a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop?.();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} pass`);
    process.exit(failed ? 1 : 0);
  }
})();
