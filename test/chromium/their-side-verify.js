/* Chromium verification — THEIR SIDE MIRRORS OURS (Young picked "Mirror",
   "Signing copy" and HaTi's own spell check, 28 Sep 2026).
   ============================================================
   What jsdom cannot see, measured in a real browser off the parity fixture
   (one contract, both seats, the counterparty's page from the real
   buildSharePayload):

     1  their change column is our flat row, in our piles, with no Open;
     2  their head wears the room head's shape — the state word, the key on the
        control row with its swatches actually painted — and the contract did
        not move down for it;
     3  their Counter opens the clause editor, and nothing on it says Copilot;
     4  a Save with misspelt new words lists them beside the Save, a suggestion
        goes in, "Save as written" files, and the draft is held on their page
        (Send all appears) — the spell check is real, fetched from /vendor;
     5  their signing page: no bands, four stages, the pad's intent line, and
        no sideways scroll at a phone's width.

   Every driven half is GUARDED: a missing control reports FAIL with what was
   missing rather than sitting out a 30-second wait. Waits ask for the state,
   bounded. Screenshots go to test/chromium/shots/their-side/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'their-side');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* A bounded wait that ASKS FOR THE STATE and answers whether it arrived. */
const until = async (page, fn, arg, ms = 5000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; }
};
/* A press through the page's own DOM, so a missing control is a false, not a
   thirty-second retry loop. */
const press = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await until(page, () => !!document.querySelector('#rl-changes-col .rl-card'));
  await page.screenshot({ path: path.join(OUT, '01-their-page.png') });

  /* ---- 1 · the column ---- */
  const col = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#rl-changes-col .rl-card')];
    return { n: rows.length, flat: rows.filter(r => r.classList.contains('rl-card-d')).length,
      open: document.querySelectorAll('#rl-changes-col .rl-open-btn, #rl-changes-col .rl-receipt').length,
      bands: [...document.querySelectorAll('#rl-changes-col [data-rl-band]')].map(b => b.getAttribute('data-rl-band')),
      withLabel: (document.querySelector('#rl-changes-col [data-rl-band="with"]') || {}).textContent || '' };
  });
  check('1a every row on their seat is our flat row', col.n > 0 && col.flat === col.n, `${col.flat} of ${col.n}`);
  check('1b no boxed card and no Open', col.open === 0, col.open);
  check('1c our piles are drawn', col.bands.includes('awaiting') && col.bands.includes('with'), col.bands.join(','));
  check('1d "With …" names the sender, not them', /Wanjiru Catering/i.test(col.withLabel), col.withLabel.trim());

  /* ---- 2 · the head ---- */
  const head = await page.evaluate(() => {
    const box = el => el ? el.getBoundingClientRect() : null;
    const sw = document.querySelector('.pw-id-row2 .rl-ctl-legend .rl-lg');
    const doc = document.querySelector('#pt-nego .rl-doc') || document.querySelector('.rl-doc');
    const id = box(document.querySelector('.pw-id'));
    return { stat: (document.querySelector('.pw-id-titlerow .pw-id-stat') || {}).textContent || '',
      swatchW: sw ? Math.round(box(sw).width) : 0,
      docTop: doc ? Math.round(box(doc).top) : null, headBottom: id ? Math.round(id.bottom) : null };
  });
  check('2a the state word sits beside the title', head.stat.trim().length > 0, head.stat);
  check('2b the key on the control row paints its swatches', head.swatchW >= 8, `${head.swatchW}px`);
  check('2c the contract starts within 80px of the head (no band pushed it down)',
    head.docTop != null && head.headBottom != null && head.docTop - head.headBottom <= 80,
    `head ends ${head.headBottom}, paper starts ${head.docTop}`);

  /* ---- 3 · Counter opens the editor, with no Copilot ---- */
  const counterSel = '#rl-changes-col [data-rl-band="awaiting"] ~ .rl-card [data-rl-cp-editor-row], #rl-changes-col .rl-card [data-rl-cp-editor-row]';
  const pressed = await press(page, counterSel);
  check('3a their row carries a door onto the editor', pressed);
  const open = pressed && await until(page, () => !!document.getElementById('clause-editor'));
  check('3b the clause editor opens for them', open);
  if (open){
    const ce = await page.evaluate(() => {
      const r = document.querySelector('#clause-editor .ce-rail');
      return { copilot: /Copilot/.test(r ? r.textContent : ''), ask: !!document.getElementById('ce-ask'),
        tabs: [...document.querySelectorAll('#clause-editor [data-ce-tab]')].map(b => b.getAttribute('data-ce-tab')) };
    });
    check('3c nothing on the rail says Copilot', !ce.copilot);
    check('3d no ask box, no conversation, no scan', !ce.ask && !ce.tabs.includes('chat') && !ce.tabs.includes('scan'), ce.tabs.join(','));

    /* ---- 4 · the spell check at Save ---- */
    const typed = await page.evaluate(() => {
      const box = document.getElementById('ce-clausebody');
      if (!box) return false;
      box.focus();
      const sel = window.getSelection(); const r = document.createRange();
      r.selectNodeContents(box); r.collapse(false); sel.removeAllRanges(); sel.addRange(r);
      return true;
    });
    check('4a the clause is open for typing', typed);
    if (typed){
      await page.keyboard.type(' Any disputte goes to arbitraton.');
      await page.evaluate(() => { const h = document.querySelector('#clause-editor .ce-ah-cl'); if (h) h.click(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
      await until(page, () => { const b = document.querySelector('#ce-railfoot [data-ce-act="save"]'); return b && !b.disabled; });
      await press(page, '#ce-railfoot [data-ce-act="save"]');
      const listed = await until(page, () => !!document.querySelector('#ce-spell .sp-row'), null, 15000);
      check('4b the Save lists the misspelt new words', listed);
      const sp = await page.evaluate(() => ({
        words: [...document.querySelectorAll('#ce-spell .sp-w')].map(x => x.textContent),
        fix: (document.querySelector('#ce-spell [data-sp-fix]') || {}).textContent || '',
        label: (document.querySelector('#ce-railfoot [data-ce-act="save"]') || {}).textContent || '' }));
      check('4c both slips, and only those', sp.words.join(',') === 'disputte,arbitraton', sp.words.join(','));
      check('4d each carries a suggestion', sp.fix === 'dispute', sp.fix);
      check('4e the Save now says it files as written', /Save as written/.test(sp.label), sp.label);
      await page.screenshot({ path: path.join(OUT, '02-spell-list.png') });
      await press(page, '#ce-spell [data-sp-fix]');
      await until(page, () => document.querySelectorAll('#ce-spell .sp-row').length === 1);
      const after = await page.evaluate(() => ({
        rows: document.querySelectorAll('#ce-spell .sp-row').length,
        fixed: /Any dispute goes/.test((document.querySelector('#ce-doc') || {}).textContent || '') }));
      check('4f a suggestion goes into the wording and leaves the list', after.rows === 1 && after.fixed, JSON.stringify(after));
      await press(page, '#ce-railfoot [data-ce-act="save"]');
      await until(page, () => !document.querySelector('#ce-spell .sp-row'));
      await press(page, '#clause-editor [data-ce-act="close"]');
      await until(page, () => !document.getElementById('clause-editor'));
      const held = await until(page, () => !!document.querySelector('.rl-unsent-go'));
      check('4g "Save as written" filed it, and it is held on their page to send', held);
      await page.screenshot({ path: path.join(OUT, '03-after-save.png') });
    }
  }

  /* ---- 5 · the signing page ---- */
  await page.evaluate(() => {
    document.getElementById('share-root').innerHTML = '';
    const c = window.CONTRACT;
    for (const ch of negoChanges(c)) if (ch.status === 'pending') ch.status = 'accepted';
    const payload = buildSharePayload(c, { purpose: 'sign' });
    payload.purpose = 'sign'; payload.purposeChosen = 'sign';
    payload.contract.signatures = [{ party: 'first', name: 'Wanjiru Kamau', title: 'Director', at: '2026-09-27T11:02:00.000Z' }];
    renderSharePortal(payload, { token: 't-sign', purpose: 'sign', emailConfigured: true,
      share: { purpose: 'sign', recipientName: 'Amina Wanjiru', recipientEmail: 'amina@nordfrakt.se' } });
  });
  await until(page, () => !!document.querySelector('.ps-stages'));
  const sign = await page.evaluate(() => ({
    bands: !!document.getElementById('pt-agreed') || !!document.getElementById('pt-history'),
    stages: document.querySelectorAll('.ps-stages > .ps-stage').length,
    word: (document.getElementById('pt-sign-word') || {}).textContent || '',
    dark: !!document.querySelector('#share-root .ps-page > header') || !(document.querySelector('.ps-page > .pw-id')) }));
  check('5a no bands above the wording', !sign.bands);
  check('5b the four stages', sign.stages === 4, sign.stages);
  check('5c the Sign button names the signer', /^Sign as Amina Wanjiru$/.test(sign.word), sign.word);
  check('5d the dark bar is gone; the head is the negotiation page\'s', !sign.dark);
  await page.screenshot({ path: path.join(OUT, '04-signing.png') });
  /* The parity fixture does not load the pad; the product does. */
  await page.addScriptTag({ url: '/js/signature.js' });
  await page.evaluate(() => { const t = document.getElementById('pt-title'); if (t) t.value = 'CFO'; });
  await press(page, '#pt-sign');
  const pad = await until(page, () => !!document.getElementById('sig-intent'));
  check('5e the pad opens with the intent line', pad);
  await page.evaluate(() => { const c = document.getElementById('sig-cancel'); if (c) c.click(); });
  await page.setViewportSize({ width: 390, height: 844 });
  /* The signing copy fits itself to its column on the resize (signCopyWatch); asked for, bounded. */
  await until(page, () => document.documentElement.scrollWidth <= window.innerWidth, null, 4000);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 0) console.log(await page.evaluate(() => [...document.body.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 6).map(e => e.tagName + '.' + String(e.className).slice(0, 30) + '#' + e.id + ' r=' + Math.round(e.getBoundingClientRect().right)).join('\n')));
  check('5f no sideways scroll at a phone\'s width', over <= 0, `${over}px`);
  await page.screenshot({ path: path.join(OUT, '05-signing-phone.png') });

  await browser.close(); srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length} of ${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
