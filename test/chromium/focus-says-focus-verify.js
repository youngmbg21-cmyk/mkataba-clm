/* EVERY FOCUS BUTTON SAYS "FOCUS" (Young, 7 Oct 2026, the one-build work
   order, part E)
   ============================================================
   Where the reader stands, at 1024 and 1440 wide:
     1. RETIRED 11 Oct 2026: the Document tab is gone (owner), and its
        control row's Focus door with it. The room's Focus lives in the ⋯
        menu (3), which still enters and leaves focus (3b).
     2. the Negotiate page's control row: the same.
     3. the ⋯ menu row says "Focus" (no longer "Focus mode").
     4. in Swedish every one of them says "Fokus".
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/focus-says-focus/ (or HATI_SHOT_DIR).
   Run: node test/chromium/focus-says-focus-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'focus-says-focus');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};

const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the agreed specification.</p>'
  + '<h2>2. Payment</h2><p>The Buyer shall pay each invoice within thirty days.</p>'
  + '<h2>3. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';


(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-FF1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 900000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    upload: { name: 'Supply.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 800 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));

    for (const w of [1024, 1440]){
      await page.setViewportSize({ width: w, height: 800 });
      /* 1a-1d RETIRED 11 Oct 2026: the Document tab is gone (owner), and the
         Focus door on its control row with it. */
      await page.evaluate(id => openWorkspace(id), ID);
      await until(page, () => !!document.getElementById('ws-tabs'));
      /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
         'redline' door now lands on Jambo's Redlines face beside Home's paper,
         which has no control row; 2a-2b measure the Negotiate PAGE's own
         control row, so the page is opened by name ({ page: true }), the
         engine the face is built from. */
      await page.evaluate(id => openRedlineWorkbench(id, { page: true }), ID);
      /* RE-POINTED 13 Oct 2026: the owner deleted the Negotiate control row's
         Focus button; Focus there is the ⋯ row (3). Held: the row draws none,
         and stays one line */
      await until(page, () => !!document.querySelector('.redline-page .rl-actions [data-rl-open-doc]'), null, 10000);
      const n = await page.evaluate(() => { const acts = [...document.querySelectorAll('.redline-page .rl-actions > *')].filter(el => el.getClientRects().length);
        const tops = acts.map(el => Math.round(el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2));
        return { door: !!document.querySelector('.redline-page .rl-focus-door'), n: acts.length, oneLine: tops.length > 0 && Math.max(...tops) - Math.min(...tops) <= 4 }; });
      check(!!n && !n.door, `2a @${w} the Negotiate control row draws no Focus button`, n && JSON.stringify(n));
      check(!!n && n.oneLine, `2b @${w} the Negotiate control row stays one line`, n && JSON.stringify(n));
      await shot(`nego-${w}.png`);
    }

    /* 3. the ⋯ menu row */
    await page.evaluate(id => openWorkspace(id), ID);
    await until(page, () => !!document.getElementById('ws-focus'));
    const m = await page.evaluate(() => { const b = document.getElementById('ws-focus'); if (!b) return null;
      const t = [...b.childNodes].filter(k => k.nodeType === 3 || (k.nodeType === 1 && !k.classList.contains('mnote') && k.tagName !== 'svg')).map(k => k.textContent).join('').trim(); return t; });
    check(m === 'Focus', '3 the ⋯ menu row says "Focus"', m);
    /* 3b the room's one Focus (the ⋯ row) enters focus and leaves it again -
       what 1c/1d proved on the retired Document-tab door */
    const fOn = await page.evaluate(() => { const b = document.getElementById('ws-focus'); if (!b) return null; b.click(); return true; });
    const entered = fOn && await until(page, () => (document.getElementById('ws-focus') || {}).getAttribute && document.getElementById('ws-focus').getAttribute('aria-pressed') === 'true' && (document.getElementById('ws-head') || {style: {}}).style.display === 'none' ? true : null);
    await page.keyboard.press('Escape');   /* the row's own hint: Esc to leave */
    const left = await until(page, () => (document.getElementById('ws-focus') || {}).getAttribute && document.getElementById('ws-focus').getAttribute('aria-pressed') === 'false' ? true : null);
    check(!!entered && !!left, '3b the ⋯ row enters focus (the head goes), and it can be left again', JSON.stringify({ entered: !!entered, left: !!left }));

    /* 4. Swedish */
    await page.evaluate(() => langSet('sv'));
    await page.waitForTimeout(400);
    await page.evaluate(id => openWorkspace(id), ID);
    await until(page, () => !!document.getElementById('ws-focus'));
    const sv = await page.evaluate(() => { const b = document.getElementById('ws-focus'); if (!b) return null;
      return { text: [...b.childNodes].filter(k => k.nodeType === 3 || (k.nodeType === 1 && !k.classList.contains('mnote') && k.tagName !== 'svg')).map(k => k.textContent).join('').trim() }; });
    /* RE-POINTED 13 Oct 2026: the Negotiate door is gone (owner); the ⋯ row is Focus's one door */
    check(!!sv && sv.text === 'Fokus', '4 in Swedish the ⋯ row says "Fokus"', JSON.stringify({ sv: sv && sv.text }));
    await shot('nego-sv.png');
    await page.evaluate(() => langSet('en'));
  } catch (e){
    console.log('  FAIL — stopped: ' + (e && e.message));
    failures++;
  }
  check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
