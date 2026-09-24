/* Chromium verification: SIX OFF FIVE IMAGES (Young ruled 24 Sep 2026).
   ====================================================================
   *"Image 1, Remove the value stream column from both pages as well but not
   from the filter. Image 2, remove the highlighted alerts and end the card
   with only the graph in it. Image 3, extend the graph to cover the little
   space left to have a full screen when screen is at 100% zoom on a thinkpad.
   Image 4, make the DNA strand to cover until the bottom of the screen. It
   should not extend past the length of the screen. Image 5, the why it
   matters should be in bold font. Finally, when on focus mode, and you change
   pages, the exit focus esc should not move with you to other pages. It should
   stay where the focus mode is."*

   WHY A BROWSER FILE. Four of the six are geometry or a computed style — a
   card that reaches the bottom of the screen, a strand that ends where the
   column ends, a weight — and the sixth is a JOURNEY across two pages, which
   only the real shell with its real router can walk.

   CONTROLS pass on both sides by design and prove the change is narrow: the
   Stream filter, the tiles, the pressable floor under a strand's block, and
   the focus mode's own way out.

   Run: node test/chromium/six-off-five-images-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'six-off-five-images');
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
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3200);

    /* ════════ 1. NO VALUE STREAM COLUMN, THE FILTER STAYS ════════ */
    const heads = () => page.evaluate(() => ({
      heads: [...document.querySelectorAll('.reg-table thead th')]
        .map(t => t.textContent.replace(/[▲▼↕]/g, '').trim()),
      stream: i18t('reg_value_stream'),
      filter: (() => { const s = document.getElementById('reg-type-sel');
        return s ? s.options.length : 0; })(),
      band: (() => { const td = document.querySelector('tr.ngl-band td');
        return td ? td.colSpan : null; })(),
    }));
    await page.evaluate(() => { regSetMode('table'); setView('register'); });
    await page.waitForTimeout(1200);
    const c1 = await heads();
    ok('1a the Contracts table draws no value stream column',
      c1.heads.length > 3 && !c1.heads.some(x => x.toLowerCase() === c1.stream.toLowerCase()), c1.heads.join(' | '));
    ok('1b CONTROL the Stream filter is still on the Contracts bar, with streams to pick', c1.filter > 1,
      c1.filter + ' options');
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });
    /* The Negotiations list only draws over a LIVE negotiation — one change
       filed through the funnel makes one. */
    await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined' && !x.negotiation);
      if (!c) return;
      negoInit(c);
      await negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'forty-five (45) days', why: 'Staged.' });
    });
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(600);
    await page.click('.nav-item[data-view="redline"]');
    await page.waitForTimeout(1500);
    const n1 = await heads();
    ok('1c the Negotiations table draws no value stream column either',
      n1.heads.length > 3 && !n1.heads.some(x => x.toLowerCase() === n1.stream.toLowerCase()), n1.heads.join(' | '));
    ok('1d CONTROL and its Stream filter is still there', n1.filter > 1, n1.filter + ' options');
    ok('1e a group heading spans exactly the columns the table draws',
      n1.band != null && n1.band === n1.heads.length, `colspan ${n1.band} · ${n1.heads.length} columns`);
    await page.screenshot({ path: path.join(OUT, '02-negotiations.png') });

    /* ════════ 2 + 3. HOME: THE CARD ENDS WITH THE GRAPH, AND FILLS THE SCREEN ════════
       Staged: three renewals at known distances and a quiet desk sixty days
       old — the runway's own staging (runway-and-xray-verify 3). */
    const stageHome = () => page.evaluate(() => {
      const iso = n => { const d = new Date(); d.setDate(d.getDate() + n);
        const q = x => String(x).padStart(2, '0');
        return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate()); };
      const me = currentUser();
      const live = state.contracts.filter(c => c.status !== 'Declined' && !isArchived(c));
      [10, 35, 70].forEach((d, i) => { const c = live[i]; if (!c) return;
        c.metadata = c.metadata || {}; c.metadata.expiryDate = iso(d); c.metadata.noticePeriodDays = 0; c.expiry = iso(d); });
      const q = live[3];
      if (q) { q.desk = { leadId: me.id, leadName: me.name };
        q.changes = [{ id: 'x1', clauseId: 'cl_1', authorSide: 'counterparty', status: 'pending',
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), summary: 's', type: 'modify' }]; }
      setView('dashboard');
    });
    const home = () => page.evaluate(() => {
      const sc = document.getElementById('content-scroll');
      const card = [...document.querySelectorAll('.hm-card')].find(x => /needs your decision/i.test(x.textContent));
      if (!card) return null;
      const rail = card.querySelector('.hm-rw-rail');
      const last = card.lastElementChild;
      return {
        rows: card.querySelectorAll('.hm-rows .hm-row, #hm-dd-rows').length,
        lastIsGraph: !!last && last.classList.contains('hm-rw'),
        gapToBottom: Math.round(sc.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom),
        pad: parseFloat(getComputedStyle(document.querySelector('.hm-page')).paddingBottom) || 0,
        overflow: sc.scrollHeight - sc.clientHeight,
        rail: rail ? Math.round(rail.getBoundingClientRect().height) : 0,
        seeAll: !!card.querySelector('[data-hm-go="needsyou"]'),
        tiles: document.querySelectorAll('#kpi-grid [data-kpi-id]').length,
      };
    });
    for (const [w, hh] of [[1920, 950], [1366, 650]]) {
      await page.setViewportSize({ width: w, height: hh });
      await stageHome();
      await page.waitForTimeout(900);
      const m = await home();
      await page.screenshot({ path: path.join(OUT, `03-home-${w}x${hh}.png`) });
      ok(`2a ${w}x${hh} the decision card draws no rows`, !!m && m.rows === 0, m ? m.rows + ' rows' : 'no card');
      ok(`2b ${w}x${hh} and it ends with the graph`, !!m && m.lastIsGraph, m ? String(m.lastIsGraph) : 'no card');
      ok(`2c ${w}x${hh} "See all" is still the door onto the whole list`, !!m && m.seeAll);
      ok(`3a ${w}x${hh} the card reaches the bottom of the screen, less the page's own margin`,
        !!m && Math.abs(m.gapToBottom - m.pad) <= 2, m ? `${m.gapToBottom}px to the bottom · margin ${m.pad}px` : 'no card');
      ok(`3b ${w}x${hh} and the page does not scroll to get there`, !!m && m.overflow <= 1, m ? m.overflow + 'px' : 'no card');
      ok(`3c ${w}x${hh} the graph itself grew into the room`, !!m && m.rail > 76, m ? m.rail + 'px' : 'no card');
      ok(`3d ${w}x${hh} CONTROL the four tiles are still there`, !!m && m.tiles === 4, m ? m.tiles + ' tiles' : 'no card');
    }
    await page.setViewportSize({ width: 1500, height: 950 });

    /* ════════ 4. THE X-RAY STRAND RUNS TO THE BOTTOM, AND NO FURTHER ════════ */
    await page.evaluate(() => { selectContract(state.contracts[0].id); });
    await page.waitForTimeout(1000);
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(1000);
    const staged = await page.evaluate(() => {
      const c = state.contracts[0];
      let sheet = [];
      try { sheet = docReadSheet(c) || []; } catch (_) { sheet = []; }
      const snip = r => String(r.text || '').split(/\s+/).slice(0, 8).join(' ');
      const long = sheet.filter(r => String(r.text || '').split(/\s+/).length > 8).slice(0, 6);
      c.scan = { on: '2026-09-21', dismissed: [], findings: long.map((r, i) => ({ id: 'xf' + i,
        sev: i % 2 ? 'med' : 'high', kind: 'risk', title: 'T' + i, why: 'It could hurt you.', quote: snip(r) })) };
      c._brief = { at: '21 Sep 2026', data: { overview: 'x',
        watchouts: [{ point: 'A point.', why: 'Because it bites.', quote: long[0] ? snip(long[0]) : '' }], unusual: [] } };
      return long.length;
    });
    ok('4-stage a contract with marked clauses', staged >= 3, staged + ' marked');
    const xr = await page.$('[data-doc-read="2"]');
    if (xr) await xr.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '04-xray.png') });
    const strand = await page.evaluate(() => {
      const sp = document.getElementById('doc-xr-spine');
      if (!sp) return null;
      const segs = [...sp.querySelectorAll('.doc-xr-seg')];
      const r = sp.getBoundingClientRect(), last = segs[segs.length - 1].getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(sp).paddingBottom) || 0;
      return { n: segs.length, toEnd: Math.round(r.bottom - last.bottom), pad,
        scrolls: sp.scrollHeight > sp.clientHeight + 1, pastScreen: Math.round(r.bottom - innerHeight),
        min: Math.round(Math.min(...segs.map(s => s.getBoundingClientRect().height))) };
    });
    ok('4a the strand runs to the bottom of its strip', !!strand && Math.abs(strand.toEnd - strand.pad) <= 2,
      strand ? `${strand.toEnd}px after the last block · padding ${strand.pad}px` : 'no strand');
    ok('4b and it does not run past the screen', !!strand && !strand.scrolls && strand.pastScreen <= 0,
      strand ? `scrolls ${strand.scrolls} · ${strand.pastScreen}px past` : 'no strand');
    ok('4c CONTROL every block is still big enough to press (the 23 Sep floor)', !!strand && strand.min >= 16,
      strand ? strand.min + 'px' : 'no strand');

    /* ════════ 5. "WHY IT MATTERS" IS BOLD ════════ */
    const weights = await page.evaluate(async () => {
      const want = (() => { const p = document.createElement('span');
        p.style.fontWeight = 'var(--w-strong)'; document.body.appendChild(p);
        const w = getComputedStyle(p).fontWeight; p.remove(); return Number(w); })();
      const xr = document.querySelector('#doc-xray .doc-xr-why b');
      const xw = xr ? Number(getComputedStyle(xr).fontWeight) : null;
      openCheckPanel(state.contracts[0], 'brief');
      await new Promise(r => setTimeout(r, 700));
      const br = document.querySelector('#brief-section .br-why b');
      const bw = br ? Number(getComputedStyle(br).fontWeight) : null;
      /* The side panel is closed the way its own ✕ closes it. */
      if (typeof closeModal === 'function') closeModal();
      return { want, xw, bw };
    });
    ok('5a the X-ray\'s "Why it matters:" is bold', weights.xw != null && weights.xw >= weights.want && weights.xw > 500,
      JSON.stringify(weights));
    ok('5b and so is the brief panel\'s', weights.bw != null && weights.bw >= weights.want && weights.bw > 500,
      JSON.stringify(weights));
    await page.evaluate(() => { if (typeof docViewSet === 'function') docViewSet('paper'); });

    /* ════════ 6. THE FOCUS CHIP STAYS ON ITS OWN PAGE ════════
       A real press on the Document tab's own focus door, then a real press on
       the rail, then back. */
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(800);
    /* The Document tab's own door is [data-ws-focus-door] (the control row);
       [data-ws-focus] is the negotiate page's head square. */
    const door = await page.$('[data-ws-focus-door]');
    ok('6-stage the Document tab offers its focus door', !!door);
    if (door) await door.click();
    await page.waitForTimeout(500);
    const on = await page.evaluate(() => ({
      chip: !!document.getElementById('ws-focus-out'),
      headHidden: (() => { const h = document.getElementById('ws-head'); return !!h && getComputedStyle(h).display === 'none'; })() }));
    ok('6a CONTROL focus mode is on, with its chip', on.chip && on.headHidden, JSON.stringify(on));
    await page.click('.nav-item[data-view="register"]');
    await page.waitForTimeout(1200);
    const away = await page.evaluate(() => ({
      view: state.view,
      chip: !!document.getElementById('ws-focus-out'),
      words: [...document.querySelectorAll('button')].filter(b => /Exit focus/i.test(b.textContent)
        && b.getBoundingClientRect().width > 0).length }));
    await page.screenshot({ path: path.join(OUT, '05-contracts-after-focus.png') });
    ok('6b on another page there is no "Exit focus" chip', away.view === 'register' && !away.chip && away.words === 0,
      JSON.stringify(away));
    /* ESCAPE ON ANOTHER PAGE IS THAT PAGE'S KEY, not the room's. */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.evaluate(() => openWorkspace(state.contracts[0].id));
    await page.waitForTimeout(1200);
    const back = await page.evaluate(() => ({
      chip: !!document.getElementById('ws-focus-out'),
      headHidden: (() => { const h = document.getElementById('ws-head'); return !!h && getComputedStyle(h).display === 'none'; })() }));
    await page.screenshot({ path: path.join(OUT, '06-room-still-focused.png') });
    ok('6c coming back, focus mode is still on where it was left — chip and all', back.chip && back.headHidden,
      JSON.stringify(back));
    const chip = await page.$('#ws-focus-out');
    if (chip) await chip.click();
    await page.waitForTimeout(400);
    const off = await page.evaluate(() => ({
      chip: !!document.getElementById('ws-focus-out'),
      headShown: (() => { const h = document.getElementById('ws-head'); return !!h && getComputedStyle(h).display !== 'none'; })() }));
    ok('6d CONTROL and its chip still takes it out', !off.chip && off.headShown, JSON.stringify(off));

    ok('7a no page errors on the way', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
