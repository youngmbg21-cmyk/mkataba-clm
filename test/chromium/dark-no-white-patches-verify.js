/* NO WHITE PATCHES AT NIGHT — the two pale accent rungs, and a walk.
 *
 * Young, 4 Oct 2026, with two screenshots: *"The attached images show that
 * when in dark mode you still have white patches. Fix this across the
 * platform."*
 *
 * ONE CAUSE, NOT A LIST. html.dark redefines the surface, the ink and the
 * whole neutral ramp, and deliberately does not redefine the accent ramp —
 * which was right for the rungs that carry TEXT and had already been answered
 * by --accent-ink. It was never answered for the two rungs that carry a
 * SURFACE. accent-50 (#F0F7F5) and accent-100 (#E1F0ED) are this product's
 * "this one is selected" wash, and at night they paint a near-white block on
 * a #151B1A page: our own party chip on the page every party reads, the
 * selected row in the Deal board, the lit filter chip over it, a hovered
 * template row, the avatar in the rail.
 *
 * MEASURED HERE at unmodified main, in dark, in BOTH brands:
 *     teal  accent-50  rgb(240,247,245) L=0.962   accent-100 rgb(225,240,237) L=0.928
 *     navy  accent-50  rgb(238,243,251) L=0.951   accent-100 rgb(220,229,247) L=0.896
 * against a body of L=0.07. After: a translucent accent-500 wash — the same
 * answer the compiled utilities bg-brand-50 and bg-brand-100 have given since
 * the Tailwind sweep — and daylight byte-identical in both brands.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. the two rungs, read in a real page, in both brands, dark AND light:
 *      dark is a wash the page can carry, light is exactly what it was;
 *   2. a walk of the platform in the dark, reporting any painted background
 *      bright enough to read as a white patch. The CONTRACT is skipped by
 *      name: a document is paper, and this is a check about furniture.
 *
 * Every driven half is guarded, so a screen that will not open REPORTS. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'dark-no-white-patches');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* Relative luminance, the same arithmetic the contrast work uses. A colour
   the page cannot be read against is one too bright to sit on #0E1312. */
const lum = c => {
  const m = /\(([^)]+)\)/.exec(c || ''); if (!m) return null;
  let p = m[1].replace('srgb', '').split(/[,\s/]+/).filter(Boolean).map(Number);
  if (/srgb/.test(c)) p = p.map((x, i) => i < 3 ? x * 255 : x);
  const a = p.length > 3 ? p[3] : 1;
  if (a < 0.5) return null;      /* a wash is not a patch */
  return +(((0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255).toFixed(3));
};
const BRIGHT = 0.78;

/* The sweep runs in the page: every visible element whose OWN background is
   painted and bright. The agreement itself is left out by name — paper is
   white because paper is white, and the signing copy pins itself to white on
   purpose (.pg-sign). */
const SWEEP = (bright) => {
  const lum2 = c => { const m = /\(([^)]+)\)/.exec(c || ''); if (!m) return null;
    let p = m[1].replace('srgb', '').split(/[,\s/]+/).filter(Boolean).map(Number);
    if (/srgb/.test(c)) p = p.map((x, i) => i < 3 ? x * 255 : x);
    const a = p.length > 3 ? p[3] : 1; if (a < 0.5) return null;
    return +(((0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255).toFixed(3)); };
  const where = el => { const b = []; let n = el, d = 0;
    while (n && n.nodeType === 1 && d++ < 3){ b.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '')
      + (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : '')); n = n.parentElement; }
    return b.join(' > '); };
  const hits = [];
  for (const el of document.querySelectorAll('body *')){
    const r = el.getBoundingClientRect();
    /* A PATCH IS SOMETHING YOU SEE, not a key. The legend dots that name an
       area are 10px circles carrying a deliberate literal colour, and a sweep
       that counts those is a sweep nobody can keep green. */
    if (r.width < 16 || r.height < 12 || r.width * r.height < 400) continue;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const L = lum2(cs.backgroundColor);
    if (L == null || L < bright) continue;
    if (el.closest('.doc-surface, .rl-paper, .pg-sign, #print-root, .sc-sheet')) continue;
    hits.push({ sel: where(el), bg: cs.backgroundColor, L, w: Math.round(r.width), h: Math.round(r.height),
      txt: (el.textContent || '').trim().slice(0, 24) });
  }
  /* a child repeating its parent's hit is one patch, not two */
  return hits.filter((o, i) => !hits.some((p, j) => j !== i && o.sel.startsWith(p.sel) && p.bg === o.bg));
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const pause = ms => new Promise(r => setTimeout(r, ms));
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const landed = await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0,
      null, { timeout: 15000 }).then(() => true, () => false);
    ok('0 the workspace is open', landed);

    /* ===== 1. THE TWO RUNGS, READ IN A REAL PAGE ===== */
    const rungs = {};
    for (const brand of ['green', 'navy']){
      for (const dark of [true, false]){
        await page.evaluate(b => setBrand(b), brand);
        await page.evaluate(d => setDark(d), dark);
        await pause(400);
        rungs[brand + (dark ? '/dark' : '/light')] = await page.evaluate(() => {
          const paint = v => { const d = document.createElement('div');
            d.style.cssText = 'position:fixed;left:-600px;top:0;width:40px;height:20px;background:var(' + v + ')';
            document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
          return { a50: paint('--color-accent-50'), a100: paint('--color-accent-100'),
            body: getComputedStyle(document.body).backgroundColor };
        });
      }
    }
    const say = k => `${k} 50=${rungs[k].a50} (${lum(rungs[k].a50)}) 100=${rungs[k].a100} (${lum(rungs[k].a100)})`;
    for (const brand of ['green', 'navy']){
      const d = rungs[brand + '/dark'];
      ok(`1 ${brand} · at night neither rung is a patch`,
        lum(d.a50) == null && lum(d.a100) == null, say(brand + '/dark'));
    }
    /* DAYLIGHT MUST NOT HAVE MOVED: these are the values main paints. */
    /* RE-PINNED 7 Oct 2026: the day values are the HaTi Platform mockup's tint
       and soft rungs (Young's palette move); the night answer is unchanged. */
    ok('1c teal by day is exactly what it was',
      rungs['green/light'].a50 === 'rgb(241, 249, 247)' && rungs['green/light'].a100 === 'rgb(227, 243, 239)',
      say('green/light'));
    ok('1d navy by day is exactly what it was',
      rungs['navy/light'].a50 === 'rgb(240, 244, 251)' && rungs['navy/light'].a100 === 'rgb(225, 233, 247)',
      say('navy/light'));

    /* ===== 2. A WALK OF THE PLATFORM, IN THE DARK ===== */
    await page.evaluate(() => setBrand('green'));
    await page.evaluate(() => setDark(true));
    await pause(500);
    const found = [];
    const walked = [];
    const look = async (where) => {
      const hits = await page.evaluate(SWEEP, BRIGHT);
      walked.push(where);
      hits.forEach(x => found.push({ where, ...x }));
    };
    for (const v of ['dashboard', 'register', 'redline', 'approvals', 'obligations', 'calendar',
      'templates', 'standards', 'team', 'people', 'intake', 'agents', 'brain']){
      const went = await page.evaluate(x => { try { setView(x); return true; } catch (_){ return false; } }, v);
      if (!went){ ok('2 ' + v + ' opens', false, 'setView refused'); continue; }
      await pause(1300);
      await look(v);
    }
    await page.evaluate(() => setView('intel')); await pause(1500);
    for (const t of ['portfolio', 'friction', 'obligations', 'payterms', 'exposure']){
      const went = await page.evaluate(x => { try { intelGoTab(x); return true; } catch (_){ return false; } }, t);
      if (!went){ ok('2 Insights ' + t + ' opens', false, 'intelGoTab refused'); continue; }
      await pause(1300);
      await look('intel/' + t);
    }
    const opened = await page.evaluate(() => {
      const c = state.contracts[0];
      if (!c || typeof openWorkspace !== 'function') return null;
      openWorkspace(c.id); return c.id;
    });
    ok('2a a contract room opens, so its tabs can be walked', !!opened, opened || 'no contract');
    if (opened){
      await pause(2500);
      for (const tab of ['terms', 'stands', 'document', 'signing', 'obligations', 'history']){
        const went = await page.evaluate(t => { try { roomGoTab(t); return true; } catch (_){ return false; } }, tab);
        if (!went) continue;
        await pause(1400);
        await look('room/' + tab);
      }
    }
    ok('2b the walk really covered the platform', walked.length >= 20, walked.length + ' screens');
    /* A NET FOR WHAT COMES NEXT. The claim this file was written for is check
       1, measured on the rungs themselves and red at the parent; this walk is
       what catches the next rule somebody writes with a daylight-only tint. */
    ok('2c and not one of them paints a white patch',
      found.length === 0, found.slice(0, 6).map(f => `${f.where}: ${f.sel} ${f.bg}`).join('  |  ') || 'none');

    await page.screenshot({ path: path.join(OUT, '1-dark.png') });
    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
