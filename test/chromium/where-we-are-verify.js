/* ============================================================
   where-we-are-verify — the counterparty's page has tabs, and lands on
   "Where we are" (Young picked it off three options, 29 Sep 2026)
   ============================================================
   Measured in a real browser off the parity fixture (one contract, both
   seats, their page from the real buildSharePayload):

     1  a first visit lands on Where we are: the pane is painted over the
        contract, the tab is lit, the contract's own tools stand down;
     2  "Waiting on you" is the bell's own rows, one for one, and a row is a
        door that opens the Redlines tab;
     3  the History tab draws the history screen IN the page, not a pop-up;
     4  Notes and Focus are buttons on the page, not rows hidden in More, and
        Focus from another tab goes to the contract;
     5  the link's end date is printed in words, never as 2026-10-12;
     6  a Save in their clause editor asks for a reason, and the reason is held
        on the change until Send (the change's own `why`);
     7  a reload with nothing new from the other side keeps the tab they left.

   Every driven half is GUARDED: a missing control reports FAIL with what was
   missing. Waits ask for the state, bounded. Screenshots go to
   test/chromium/shots/where-we-are/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'where-we-are');
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
const until = async (page, fn, arg, ms = 5000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; }
};
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
  /* A first visit: nothing remembered for this link. */
  await page.evaluate(() => { try { localStorage.removeItem('hati.ptPlace.harness-token'); } catch (_){} });
  await page.evaluate(() => window.SHOW_COUNTERPARTY({ tab: 'landing', expiresAt: '2026-10-12T21:00:00.000Z' }));
  const landed = await until(page, () => { const p = document.getElementById('pt-where-pane'); return p && !p.hidden && !!p.querySelector('.pw-where'); });

  /* ---- 1 · the landing ---- */
  check('1a a first visit lands on Where we are', landed);
  await page.screenshot({ path: path.join(OUT, '01-where-we-are.png') });
  const l = await page.evaluate(() => {
    const pane = document.getElementById('pt-where-pane');
    const r = pane ? pane.getBoundingClientRect() : null;
    const mid = r ? document.elementFromPoint(r.left + r.width / 2, r.top + 60) : null;
    const lit = document.querySelector('.pw-tab[aria-selected="true"]');
    const tools = document.querySelector('.pw-rl-tools');
    return { lit: lit ? lit.id : null, onTop: !!(mid && pane.contains(mid)),
      toolsShown: tools ? getComputedStyle(tools).display !== 'none' : null,
      inert: !!(document.getElementById('pt-nego') || {}).inert,
      steps: document.querySelectorAll('.pw-journey .pw-jst').length,
      now: (document.querySelector('.pw-jst.is-now b') || {}).textContent || '' };
  });
  check('1b the Where we are tab is lit', l.lit === 'pt-tab-where', l.lit);
  check('1c the pane is what is painted, over the contract', l.onTop);
  check('1d the contract\'s own tools stand down off the Redlines tab', l.toolsShown === false, l.toolsShown);
  check('1e the contract under it takes no presses', l.inert);
  check('1f the journey has four steps and names the one in hand', l.steps === 4 && l.now.length > 0, `${l.steps} · ${l.now}`);

  /* ---- 2 · Waiting on you is the bell's rows ---- */
  const w = await page.evaluate(() => ({
    rows: [...document.querySelectorAll('#pt-where-pane .pw-wrow')].map(r => r.getAttribute('data-pt-kind')),
    bell: [...document.querySelectorAll('#pt-alerts-body .pt-alert')].map(r => r.getAttribute('data-pt-kind')) }));
  check('2a "Waiting on you" lists the bell\'s own rows, one for one',
    w.rows.length > 0 && w.rows.join(',') === w.bell.join(','), `${w.rows.join(',')} vs ${w.bell.join(',')}`);
  const door = await page.evaluate(() => { const b = document.querySelector('#pt-where-pane button.pw-wrow'); if (!b) return null; const k = b.getAttribute('data-pt-kind'); b.click(); return k; });
  check('2b a row is a door', !!door, door);
  if (door){
    const went = await until(page, () => document.getElementById('pw-page').dataset.ptTab === 'redlines');
    check('2c and it opens the Redlines tab', went);
  }

  /* ---- 3 · History is a tab ---- */
  const hasHist = await press(page, '#pt-hist');
  check('3a the History tab is there', hasHist);
  if (hasHist){
    const inPage = await until(page, () => !!document.querySelector('#pt-hist-pane #history-timeline'));
    const modal = await page.evaluate(() => !!document.querySelector('#modal-root #history-timeline'));
    check('3b it draws the history in the page', inPage);
    check('3c not as a pop-up', !modal);
    await page.screenshot({ path: path.join(OUT, '02-history.png') });
  }

  /* ---- 4 · Notes and Focus are on the page ---- */
  const nf = await page.evaluate(() => {
    const menu = document.getElementById('pt-more-menu');
    const notes = document.getElementById('pt-notes-door'), focus = document.getElementById('pt-focus');
    return { notes: !!notes && !(menu && menu.contains(notes)), focus: !!focus && !(menu && menu.contains(focus)),
      more: !!document.getElementById('pt-more'),
      inMore: [...document.querySelectorAll('#pt-more-menu [id^="pt-"]')].map(b => b.id),
      copies: [...document.querySelectorAll('#pt-where-pane [data-pt-copy]')].map(b => b.dataset.ptCopy),
      shared: !!document.querySelector('#pt-where-pane .pw-stands .ds-sheet') };
  });
  check('4a Notes is a button beside the bell, not a row in More', nf.notes);
  check('4b Focus is a button on the control row, not a row in More', nf.focus);
  /* REVERSED IN PLACE 4 Oct 2026 (Young: "delete the export button and keep
     it under the more button as it is designed today"). More is back because
     there is something in it again, and the page every party reads has the
     column the Copies card was holding. Notes and Focus staying OUT of it is
     what 4a and 4b are for and is untouched. */
  check('4e the copies are in More, and not also a card on the page',
    nf.more && nf.inMore.includes('pt-pdf') && nf.copies.length === 0,
    JSON.stringify({ more: nf.more, inMore: nf.inMore, copies: nf.copies }));
  check('4f and the page every party reads is drawn under the rule', nf.shared);
  await press(page, '#pt-notes-door');
  check('4c Notes opens the notes drawer', await until(page, () => (document.getElementById('pt-notes') || { classList: { contains: () => false } }).classList.contains('open')));
  await press(page, '#pt-notes-close');
  await press(page, '#pt-tab-where');
  await press(page, '#pt-tab-redlines');
  await press(page, '#pt-focus');
  const fo = await until(page, () => document.body.classList.contains('pw-focused'));
  check('4d Focus turns focus mode on', fo);
  await press(page, '[data-rl-focus-exit]');
  await until(page, () => !document.body.classList.contains('pw-focused'));

  /* ---- 5 · the end date in words ---- */
  const sub = await page.evaluate(() => (document.querySelector('.pw-id-sub') || {}).textContent || '');
  check('5a the link\'s end date is in words, not digits', /Oct/.test(sub) && !/\d{4}-\d{2}-\d{2}/.test(sub), sub.replace(/\s+/g, ' ').trim());

  /* ---- 6 · a reason after Save ---- */
  await press(page, '#pt-tab-redlines');
  const counter = await press(page, '#rl-changes-col .rl-card [data-rl-cp-editor-row]');
  check('6a a row opens the clause editor', counter);
  const open = counter && await until(page, () => !!document.getElementById('ce-clausebody'));
  if (open){
    await page.evaluate(() => {
      const box = document.getElementById('ce-clausebody'); box.focus();
      const sel = window.getSelection(); const r = document.createRange();
      r.selectNodeContents(box); r.collapse(false); sel.removeAllRanges(); sel.addRange(r);
    });
    await page.keyboard.type(' Deliveries are made on working days.');
    await until(page, () => { const b = document.querySelector('#ce-railfoot [data-ce-act="save"]'); return b && !b.disabled; });
    await press(page, '#ce-railfoot [data-ce-act="save"]');
    /* A spell list may stand first; its "Save as written" files. */
    const asked = await until(page, () => {
      if (document.getElementById('pd-input')) return true;
      const b = document.querySelector('#ce-railfoot [data-ce-act="save"]');
      if (document.querySelector('#ce-spell .sp-row') && b) b.click();
      return false;
    }, null, 15000);
    check('6b Save asks for a reason', asked);
    if (asked){
      await page.screenshot({ path: path.join(OUT, '03-reason.png') });
      await page.fill('#pd-input', 'Our sites only receive on working days.');
      await press(page, '#pd-ok');
      const held = await until(page, () => !document.getElementById('pd-input'));
      const why = await page.evaluate(() => {
        try { const raw = localStorage.getItem('hati.negoHeld.harness-token'); const h = raw ? JSON.parse(raw) : null;
          return Object.values((h && h.proposed) || {}).map(x => x.why || '').join('|'); } catch (_){ return 'unreadable'; }
      });
      check('6c the reason is held on the change, to go with Send', held && /working days/.test(why), why);
    }
    await press(page, '#clause-editor [data-ce-act="close"]');
    await until(page, () => !document.getElementById('clause-editor'));
  } else check('6b Save asks for a reason', false, 'the editor did not open');

  /* ---- 9 · round two (Young: "implement all", 29 Sep 2026) ---- */
  const turn = await page.evaluate(() => (document.getElementById('pt-turn') || {}).textContent || '');
  check('9a whose turn it is sits beside the title', /With /.test(turn), turn);
  const strip = await page.evaluate(() => /Your table/.test((document.querySelector('#pt-nego') || {}).textContent || ''));
  check('9b the grey "Your table" strip is gone', !strip);
  await press(page, '#pt-tab-signing');
  const sg = await page.evaluate(() => { const p = document.getElementById('pt-sign-pane');
    return p && !p.hidden ? { n: p.querySelectorAll('.ps-stage').length, turn: /Your turn/.test(p.textContent),
      seen: (() => { const r = p.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 80); return !!e && p.contains(e); })() } : null; });
  check('9c the Signing tab draws four stages, painted, and never "Your turn"', !!sg && sg.n === 4 && !sg.turn && sg.seen, JSON.stringify(sg));
  await page.screenshot({ path: path.join(OUT, '05-signing-tab.png') });
  await press(page, '#pt-tab-redlines');
  await press(page, '#rl-changes-col [data-nego-accept]');
  const sendAll = await until(page, () => !!document.querySelector('.rl-unsent-go'));
  check('9d an answer makes Send all appear', sendAll);
  if (sendAll){
    await press(page, '.rl-unsent-go');
    const asked = await until(page, () => /Send to /.test((document.getElementById('confirm-overlay') || {}).textContent || ''));
    check('9e Send shows what leaves first', asked);
    await page.screenshot({ path: path.join(OUT, '06-send-check.png') });
    await press(page, '#cf-cancel');
    await until(page, () => !document.getElementById('confirm-overlay'), null, 2000);
    const still = await page.evaluate(() => !!document.querySelector('.rl-unsent-go'));
    check('9f Keep working leaves the answer held', still);
  }

  /* ---- 7 · a reload keeps the tab they left ---- */
  await press(page, '#pt-hist');
  await page.evaluate(() => window.SHOW_COUNTERPARTY({ tab: 'landing' }));
  await until(page, () => !!document.querySelector('.pw-tab[aria-selected="true"]'));
  const keptInSitting = await page.evaluate(() => (document.querySelector('.pw-tab[aria-selected="true"]') || {}).id);
  check('7a a repaint keeps the reader\'s tab', keptInSitting === 'pt-hist', keptInSitting);
  const nextVisit = await page.evaluate(() => window.portalLandingTab(window.PORTAL_OPTS.payload));
  check('7b the next visit, with nothing new from them, opens where they left', nextVisit === 'history', nextVisit);

  /* ---- 8 · a phone's width ---- */
  await press(page, '#pt-tab-where');
  await page.setViewportSize({ width: 390, height: 844 });
  await until(page, () => document.documentElement.scrollWidth <= window.innerWidth, null, 3000);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('8a no sideways scroll at a phone\'s width', over <= 0, `${over}px`);
  await page.screenshot({ path: path.join(OUT, '04-phone.png'), fullPage: true });

  await browser.close(); srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length} of ${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
