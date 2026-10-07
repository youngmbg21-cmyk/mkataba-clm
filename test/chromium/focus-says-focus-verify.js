/* EVERY FOCUS BUTTON SAYS "FOCUS" (Young, 7 Oct 2026, the one-build work
   order, part E)
   ============================================================
   Where the reader stands, at 1024 and 1440 wide:
     1. the Document tab's control row: the Focus door shows the mark AND the
        word "Focus"; the row stays one line; pressing it enters focus and
        pressing again leaves.
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

/* the door's visible words, its mark, and whether its row is one line */
const doorOf = (page, sel) => page.evaluate(sel => {
  const d = document.querySelector(sel); if (!d || !d.getClientRects().length) return null;
  const row = d.parentElement;
  const kids = [...row.children].filter(k => k.getClientRects().length);
  const tops = new Set(kids.map(k => Math.round(k.getBoundingClientRect().top / 6)));
  return { text: d.textContent.replace(/\s+/g, ' ').trim(), mark: !!d.querySelector('svg'),
    pressed: d.getAttribute('aria-pressed'), oneLine: tops.size <= 1, h: Math.round(d.getBoundingClientRect().height) };
}, sel);

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
      await page.evaluate(id => { openWorkspace(id); roomGoTab(getContract(id), 'doc'); }, ID);
      await until(page, () => !!document.querySelector('.ws-focus-door'));
      const d = await doorOf(page, '.ws-focus-door');
      check(!!d && d.text === 'Focus' && d.mark, `1a @${w} the Document tab's Focus door shows the mark and the word "Focus"`, d && JSON.stringify(d));
      check(!!d && d.oneLine, `1b @${w} the Document tab's control row stays one line`, d && JSON.stringify(d));
      await shot(`doc-${w}.png`);
      if (w === 1024){
        const first = await page.evaluate(() => { const p = document.querySelector('.doc-surface p, .doc-surface h2'); return p ? Math.round(p.getBoundingClientRect().top) : null; });
        await page.evaluate(() => document.querySelector('.ws-focus-door').click());
        const on = await until(page, () => document.querySelector('.ws-focus-door[aria-pressed="true"]') ? true : null);
        check(!!on, '1c pressing it enters focus');
        await page.evaluate(() => { const b = document.querySelector('.ws-focus-door[aria-pressed="true"]') || document.querySelector('[data-ws-focus][aria-pressed="true"]'); if (b) b.click(); else wsFocusToggle(); });
        const off = await until(page, () => document.querySelector('.ws-focus-door[aria-pressed="false"]') ? true : null);
        const again = await page.evaluate(() => { const p = document.querySelector('.doc-surface p, .doc-surface h2'); return p ? Math.round(p.getBoundingClientRect().top) : null; });
        check(!!off && first === again, '1d pressing again leaves, and the first line of wording is where it was', JSON.stringify({ first, again }));
      }
      await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
      await until(page, () => !!document.querySelector('.redline-page .rl-focus-door'), null, 10000);
      const n = await doorOf(page, '.redline-page .rl-focus-door');
      check(!!n && n.text === 'Focus' && n.mark, `2a @${w} the Negotiate page's Focus door shows the mark and the word "Focus"`, n && JSON.stringify(n));
      check(!!n && n.oneLine, `2b @${w} the Negotiate control row stays one line`, n && JSON.stringify(n));
      await shot(`nego-${w}.png`);
    }

    /* 3. the ⋯ menu row */
    await page.evaluate(id => roomGoTab(getContract(id), 'doc'), ID);
    await until(page, () => !!document.querySelector('.ws-focus-door'));
    const m = await page.evaluate(() => { const b = document.getElementById('ws-focus'); if (!b) return null;
      const t = [...b.childNodes].filter(k => k.nodeType === 3 || (k.nodeType === 1 && !k.classList.contains('mnote') && k.tagName !== 'svg')).map(k => k.textContent).join('').trim(); return t; });
    check(m === 'Focus', '3 the ⋯ menu row says "Focus"', m);

    /* 4. Swedish */
    await page.evaluate(() => langSet('sv'));
    await page.waitForTimeout(400);
    await page.evaluate(id => { openWorkspace(id); roomGoTab(getContract(id), 'doc'); }, ID);
    await until(page, () => !!document.querySelector('.ws-focus-door'));
    const sv = await doorOf(page, '.ws-focus-door');
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page .rl-focus-door'), null, 10000);
    const svN = await doorOf(page, '.redline-page .rl-focus-door');
    check(!!sv && !!svN && sv.text === 'Fokus' && svN.text === 'Fokus', '4 in Swedish both doors say "Fokus"', JSON.stringify({ sv: sv && sv.text, svN: svN && svN.text }));
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
