/* Chromium verification: JAMBO, ALIVE — RETIRED; THE PERCH IS GONE
   ============================================================
   Owner, 16 Oct 2026: "show me how we can make jambo more engaging than
   currently is where it is mostly stagnant and not moving" — four options
   drawn on the real page; the owner picked "Alive" by name: he sat on the
   chips row and breathed; he turned to the paper when words on it were
   chosen; while he worked, his thinking face and the turning ring; when
   something was done he hopped, and the row in the at-a-glance card ticked
   off.

   RE-POINTED 20 Oct 2026 (the owner picked "Chambers" by name): on a
   computer Jambo's face is the ✦ mark, not the bird, and THE PERCH IS GONE —
   jamboPerchMount, jamboHop, jamboBeat, jamboRest, jamboLookPaint,
   jamboWorkWords, .jb-perch, .jb-bird and the jbBreathe / jbHop keyframes
   were deleted (reverses "JAMBO, ALIVE", 16 Oct). So every check that asked
   for him to sit, breathe, think, hop or turn now asks that NOTHING of the
   perch comes back, at each of the moments that once woke him: the wall, a
   paper, the Clauses tab, an answer being written, a wait elsewhere, an 'ok'
   confirmation, words chosen on the paper, and a reader who asked for less
   motion. The tick-off of a row no longer owed was never his and stays
   (4a–4c), without the hop.

   Driven in a real browser on Home's Document face. Waits ask for the state,
   bounded. AT THE PARENT (d2b75c7), MEASURED in a worktree: every absence
   check FAILS (1a–3a and 5a — the perch, the bird and its keyframes are all
   there). 4a fails on both sides for another reason (the dossier's Still
   owed rows; the file was red on main before this change); 4b, 4c and 6a
   pass on both sides by design.

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
  /* WHAT IS LEFT OF THE PERCH, anywhere on Home's panel: nothing, and every
     Jambo face drawn there is the ✦ mark (an <svg>), never the bird */
  const perch = () => page.evaluate(() => {
    const dock = document.getElementById('ig-dock');
    const faces = dock ? [...dock.querySelectorAll('.jambo-face')] : [];
    return { dock: !!dock, perch: !!document.querySelector('.jb-perch, .jb-bird, .jb-say'),
      perched: !!(dock && (dock.classList.contains('jb-perched') || dock.classList.contains('jb-perched-ask'))),
      faces: faces.length, birds: faces.filter(f => f.tagName.toLowerCase() !== 'svg').length,
      marks: faces.filter(f => f.tagName.toLowerCase() === 'svg' && f.classList.contains('jambo-mark')).length };
  });
  const none = p => !!p && p.dock && !p.perch && !p.perched && p.birds === 0 && p.marks === p.faces;
  /* AN ABSENCE IS READ AFTER A BOUNDED ASK FOR THE THING TO COME UP, never a
     fixed pause: up to `ms` for any perch, bird or perched panel to appear */
  const perchComes = (ms = 1000) => until(() => { const d = document.getElementById('ig-dock');
    return document.querySelector('.jb-perch, .jb-bird, .jb-say') || (d && /\bjb-perched/.test(d.className))
      || (d && [...d.querySelectorAll('.jambo-face')].some(f => f.tagName.toLowerCase() !== 'svg')) ? true : null; }, null, ms);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 15000 });

    /* ============ 1. HE NO LONGER SITS ANYWHERE ============ */
    /* Contracts opens on the List (owner, 20 Oct 2026): this check walks the Wall */
    await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); hbOpenContracts(); });
    await until(() => !!document.querySelector('#ct-place [data-ig-pick]'));
    const w = await perch();
    check('1a on the wall no bird sits on the chips row — the perch is gone', none(w), JSON.stringify(w));
    /* RE-POINTED 18 Oct 2026 (round 13 as drawn): a press chooses the paper, a second opens it */
    await page.click('[data-ig-pick="MK-B2"]'); await page.click('[data-ig-pick="MK-B2"]');
    await until(() => intel.paper && intel.paper.id === 'MK-B2' && document.getElementById('pd-glance'));
    const p1 = await perch();
    await page.screenshot({ path: path.join(OUT, '1b-on-the-paper.png') });
    check('1b beside a paper neither: no perch, and any Jambo face on the panel is the ✦ mark, not the bird', none(p1), JSON.stringify(p1));
    await page.evaluate(() => { pdSetTab('doc'); renderIntelDock(); });
    const onDoc = await perch();
    await page.evaluate(() => { pdSetTab('copilot'); renderIntelDock(); });
    const onOwn = await perch();
    check('1c not on the Clauses tab, and not back on his own tab', none(onDoc) && none(onOwn), JSON.stringify({ onDoc, onOwn }));

    /* ============ 2. NOTHING OF HIS WORKS OR HOPS ============ */
    const fns = await page.evaluate(() => ['jamboPerchMount', 'jamboHop', 'jamboBeat', 'jamboRest', 'jamboLookPaint', 'jamboWorkWords']
      .filter(n => typeof window[n] === 'function'));
    check('2 nothing of the perch is published (jamboPerchMount, jamboHop, jamboBeat, jamboRest, jamboLookPaint, jamboWorkWords)', fns.length === 0, JSON.stringify(fns));
    await page.evaluate(() => { intel.busy = true; renderIntelDock(); });
    await perchComes();
    const p2 = await perch();
    await page.screenshot({ path: path.join(OUT, '2a-thinking.png'), clip: { x: 1050, y: 95, width: 390, height: 685 } });
    check('2a while he answers no perch comes up — no thinking bird, no ring over him', none(p2), JSON.stringify(p2));
    await page.evaluate(() => { intel.busy = false; renderIntelDock(); });
    /* a wait drawn by the house's own ring elsewhere on Home (a paper being opened on the wall, job 1) */
    await page.evaluate(() => { const s = document.createElement('span'); s.id = 'jb-probe'; s.innerHTML = busyHtml('Sending…'); document.getElementById('ig-strip').appendChild(s); });
    await perchComes();
    const p4 = await perch();
    check('2c a wait the screen shows elsewhere wakes no perch', none(p4), JSON.stringify(p4));
    await page.evaluate(() => document.getElementById('jb-probe').remove());
    await page.evaluate(() => toast('Sent to Naivas Supermarkets', 'ok'));
    await perchComes();
    const p5 = await perch();
    check('2e an act confirmed ("ok") wakes no perch either', none(p5), JSON.stringify(p5));

    /* ============ 3. NOTHING TURNS TO THE WORDS CHOSEN ON THE PAPER ============ */
    await page.evaluate(() => { const c = document.querySelector('#ig-paper p') || document.querySelector('#ig-paper .rl-clause') || document.querySelector('#ig-paper div');
      const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await perchComes();
    const look = await perch();
    await page.screenshot({ path: path.join(OUT, '3a-looking.png'), clip: { x: 640, y: 95, width: 800, height: 685 } });
    await page.evaluate(() => getSelection().removeAllRanges());
    check('3a words chosen on the paper: nothing of the perch turns to them', none(look), JSON.stringify(look));

    /* ============ 4. A ROW THAT GOES IS TICKED OFF ============ */
    /* RE-POINTED 20 Oct 2026 (the dossier): Still owed says each empty box by its own name, "<label> not recorded" */
    const g0 = await page.evaluate(() => [...document.querySelectorAll('#pd-glance [data-pd-gl]')].map(x => x.getAttribute('data-pd-gl')));
    /* the empty detail is filled (the way a save repaints the panel) */
    await page.evaluate(() => { const c = getContract('MK-B2'); c.fields = { ...(c.fields || {}), effDate: '2026-11-01' }; pdGlanceRepaint(); });
    const done = await until(() => { const d = document.querySelector('#pd-glance .pd-gl-row.is-done[data-pd-gl-done="fill"]');
      return d ? { text: d.textContent.trim(), struck: !!d.querySelector('s'), tick: !!d.querySelector('i') } : null; }, null, 2000);
    await page.screenshot({ path: path.join(OUT, '4a-ticked-off.png'), clip: { x: 1050, y: 95, width: 390, height: 300 } });
    /* RE-POINTED 20 Oct 2026 (Chambers): the tick-off stays; the hop went with the perch */
    check('4a the row no longer owed is ticked off in its own words, struck through',
      g0.includes('fill') && !!done && done.struck && done.tick && /(detail|not recorded)/.test(done.text), JSON.stringify({ g0, done }));
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
    /* RE-POINTED 20 Oct 2026 (Chambers): there is nothing of his left to move —
       the breathing and hopping keyframes are gone from every stylesheet */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    const still5 = await page.evaluate(() => { const names = [];
      for (const sh of document.styleSheets){ let rules = []; try { rules = [...sh.cssRules]; } catch (_){ continue; }
        const walk = rs => rs.forEach(r => { if (r.type === window.CSSRule.KEYFRAMES_RULE) names.push(r.name); else if (r.cssRules) walk([...r.cssRules]); }); walk(rules); }
      return { keyframes: names.filter(n => /^jb(Breathe|Hop)$/.test(n)), moving: [...document.querySelectorAll('#ig-dock *')].map(e => getComputedStyle(e).animationName).filter(n => /^jb/.test(n)) }; });
    check('5a for a reader who asked for less motion — and for everyone — nothing of the perch is left to move', still5.keyframes.length === 0 && still5.moving.length === 0, JSON.stringify(still5));
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
