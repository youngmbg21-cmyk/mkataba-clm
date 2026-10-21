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

   HOME WAS REVERTED THE SAME DAY (Young: "Revert just the home page to how it
   was before"): images 2 and 3 are undone and their checks are gone from this
   file. The other four stand.

   WHY A BROWSER FILE. Three of the four are geometry or a computed style — a
   column that is not drawn, a strand that ends where the column ends, a
   weight — and the fourth is a JOURNEY across two pages, which only the real
   shell with its real router can walk.

   CONTROLS pass on both sides by design and prove the change is narrow: the
   Stream filter, the pressable floor under a strand's block, and the focus
   mode's own way out.

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
      /* the Negotiations list head's "+ Filter" (Part 8): its Stream group */
      addStream: (() => { const g = [...document.querySelectorAll('[data-lh-seat="negotiations"] select[data-lh-add] optgroup')]
        .find(x => x.label === i18t('reg_chip_stream')); return g ? g.querySelectorAll('option').length : 0; })(),
      plain: [...document.querySelectorAll('#reg-tbody tr')].every(r => r.hasAttribute('data-row')),
    }));
    /* the List of Home's Contracts place (step 7 of the overnight work order) */
    await page.evaluate(() => { regSetMode('table'); regPlaceSet({ show: 'list' }); setView('register'); });
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
    /* the left menu's place is the desk tabs' since 17 Oct 2026 (Round 2): the page is asked of Jambo's box */ await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'negotiations');
    await page.waitForTimeout(1500);
    const n1 = await heads();
    ok('1c the Negotiations table draws no value stream column either',
      n1.heads.length > 3 && !n1.heads.some(x => x.toLowerCase() === n1.stream.toLowerCase()), n1.heads.join(' | '));
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): on
       Negotiations the Stream filter is one of "+ Filter"'s groups, offering
       the streams that hold a row (never "All streams", never an empty one);
       and the group headings between the rows went (Q2 "A — tabs only"). */
    ok('1d CONTROL and its Stream filter is still there, under + Filter', n1.addStream >= 1, n1.addStream + ' streams offered');
    ok('1e no group heading between the rows: every row of the table is a contract',
      n1.band == null && n1.plain, `colspan ${n1.band} · plain ${n1.plain}`);
    await page.screenshot({ path: path.join(OUT, '02-negotiations.png') });

    /* ════════ 2 + 3. HOME — REVERTED THE SAME DAY ════════
       The decision card ending with its graph and filling the screen were
       built and then undone on the owner's word ("Revert just the home
       page to how it was before"). Their checks went with them; the
       restored card is measured by home-page-verify and
       runway-and-xray-verify, back as they were. */

    /* ════════ 4. THE THREAD RUNS TO THE BOTTOM OF ITS CARD, AND NO FURTHER ════════ */
    /* RE-POINTED 5 Oct 2026 (the Thread): the X-ray strand left the Document
       tab (it still draws on the Explorer); the Thread's row list is what runs
       to the bottom of its card now, scrolling inside it, never past the
       screen, every row head big enough to press. */
    /* RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner); the
       Thread lives on Home's Document, Clauses tab (#pd-thread, TH_HOSTS.home),
       so its card is measured there. */
    await page.evaluate(() => { pdOpenOnHome(state.contracts[0].id, 'doc'); });
    await page.waitForFunction(() => !!document.getElementById('pd-thread') && !!document.getElementById('ig-canvas'), null, { timeout: 15000 }).catch(() => {});
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
      docThreadPaint(c);
      return long.length;
    });
    ok('4-stage a contract with marked clauses', staged >= 3, staged + ' marked');
    await page.waitForFunction(() => document.querySelectorAll('#pd-thread .doc-th-row').length > 0, null, { timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, '04-thread.png') });
    const strand = await page.evaluate(() => {
      const th = document.getElementById('pd-thread');
      if (!th || th.hidden) return null;
      const box = th.querySelector('.doc-th-rows');
      const rows = [...th.querySelectorAll('.doc-th-row')];
      const r = th.getBoundingClientRect(), bx = box.getBoundingClientRect();
      return { n: rows.length, toEnd: Math.round(r.bottom - bx.bottom), pastScreen: Math.round(r.bottom - innerHeight),
        inside: box.scrollHeight >= box.clientHeight, toned: rows.filter(x => /\bis-(ruby|amber|steel)\b/.test(x.className)).length,
        min: Math.round(Math.min(...rows.map(s => s.querySelector('.doc-th-head').getBoundingClientRect().height))),
        strandGone: !document.getElementById('doc-xr-spine') };
    });
    ok('4a the row list runs to the bottom of its card, and the strand is gone from this tab', !!strand && strand.toEnd <= 2 && strand.toEnd >= 0 && strand.strandGone,
      strand ? `${strand.toEnd}px after the list · strand ${strand.strandGone ? 'gone' : 'still drawn'}` : 'no thread');
    ok('4b and it does not run past the screen', !!strand && strand.pastScreen <= 0 && strand.inside,
      strand ? `${strand.pastScreen}px past · scrolls inside ${strand.inside}` : 'no thread');
    ok('4c CONTROL every row head is big enough to press, and the marked rows wear a tone', !!strand && strand.min >= 24 && strand.toned >= 3,
      strand ? `${strand.min}px · ${strand.toned} toned` : 'no thread');

    /* ════════ 5. "WHY IT MATTERS" IS BOLD ════════ */
    const weights = await page.evaluate(async () => {
      const want = (() => { const p = document.createElement('span');
        p.style.fontWeight = 'var(--w-strong)'; document.body.appendChild(p);
        const w = getComputedStyle(p).fontWeight; p.remove(); return Number(w); })();
      /* the first toned row opened, so a mark with its reason is on screen */
      const go = document.querySelector('#pd-thread .doc-th-row.is-ruby [data-th-go], #pd-thread .doc-th-row.is-amber [data-th-go]');
      if (go) { go.click(); await new Promise(r => setTimeout(r, 1200)); }
      const xr = document.querySelector('#pd-thread .doc-th-row.is-open .doc-xr-why b');
      const xw = xr ? Number(getComputedStyle(xr).fontWeight) : null;
      const open = !!document.querySelector('#pd-thread .doc-th-row.is-open');
      openCheckPanel(state.contracts[0], 'brief');
      await new Promise(r => setTimeout(r, 700));
      const br = document.querySelector('#brief-section .br-why b');
      const bw = br ? Number(getComputedStyle(br).fontWeight) : null;
      /* The side panel is closed the way its own ✕ closes it. */
      if (typeof closeModal === 'function') closeModal();
      return { want, xw, bw, open };
    });
    /* RE-POINTED 13 Oct 2026 (Stakes as drawn, owner: "This is how the panel
       should look like but with a plain English button"): Home's open row
       carries only Plain English - the marks and their "Why it matters:" are
       not drawn there. Asserted as absent on an open row. */
    ok('5a Home\'s open row draws no "Why it matters:" (Stakes as drawn)', weights.open && weights.xw == null,
      JSON.stringify(weights));
    ok('5b and so is the brief panel\'s', weights.bw != null && weights.bw >= weights.want && weights.bw > 500,
      JSON.stringify(weights));

    /* ════════ 6. THE FOCUS CHIP STAYS ON ITS OWN PAGE ════════
       A real press on the room's focus door, then a real press on the rail,
       then back. RE-POINTED 11 Oct 2026: the Document tab (and its control-row
       door) is gone (owner); the room's ⋯ menu row (#ws-focus) is the door
       that stays on every tab, so it is pressed on the Signing tab. */
    await page.evaluate(() => { openWorkspace(state.contracts[0].id, { room: true }); });
    await page.waitForFunction(() => !!document.querySelector('.room-tabrow'), null, { timeout: 10000 }).catch(() => {});
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       Signing tab went home (Jambo's Before you sign face, where Home has no
       Focus); the room keeps Overview and Where we are, and its ⋯ row is on
       both — pressed on the Overview */
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'terms'); });
    await page.waitForFunction(() => state.view === 'workspace' && !!document.querySelector('#ws-tabs [data-ws-tab="terms"].on') && !!document.getElementById('ws-more'),
      null, { timeout: 8000 }).catch(() => {});
    await page.click('#ws-more').catch(() => {});
    const door = await page.waitForSelector('#ws-focus', { state: 'visible', timeout: 5000 }).catch(() => null);
    ok('6-stage the room offers its focus door (the ⋯ menu row)', !!door);
    if (door) await door.click();
    await page.waitForFunction(() => !!document.getElementById('ws-focus-out'), null, { timeout: 5000 }).catch(() => {});
    const on = await page.evaluate(() => ({
      chip: !!document.getElementById('ws-focus-out'),
      headHidden: (() => { const h = document.getElementById('ws-head'); return !!h && getComputedStyle(h).display === 'none'; })() }));
    ok('6a CONTROL focus mode is on, with its chip', on.chip && on.headHidden, JSON.stringify(on));
    /* Contracts is the fly-out's opener since step 7 of the overnight work
       order (its item went): a press opens Home's Contracts place */
    await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'contracts');
    await page.waitForTimeout(1200);
    const away = await page.evaluate(() => ({
      view: state.view,
      chip: !!document.getElementById('ws-focus-out'),
      words: [...document.querySelectorAll('button')].filter(b => /Exit focus/i.test(b.textContent)
        && b.getBoundingClientRect().width > 0).length }));
    await page.screenshot({ path: path.join(OUT, '05-contracts-after-focus.png') });
    ok('6b on another page there is no "Exit focus" chip', away.view === 'dashboard' && !away.chip && away.words === 0,
      JSON.stringify(away));
    /* ESCAPE ON ANOTHER PAGE IS THAT PAGE'S KEY, not the room's. */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.evaluate(() => openWorkspace(state.contracts[0].id, { room: true }));
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
