/* nine-off-five-images-verify — THE PAINTED HALF (Young ruled 21 Sep 2026)
   =========================================================================
   f349 pins the source. What is here can be asked nowhere else: a card's
   MEASURED height, a menu's PAINTED corner, whether a chip really carries a
   number, whether a press really opens a panel, and whether the Horizon bar
   is really eight pixels tall on a rendered page.

   At the parent the cards measure two different heights, the fill tile draws
   a dash, the standards tile has no arrow, a press on a filter chip summons
   the operating system's own list and the bar draws 14px.

   Run: node test/chromium/nine-off-five-images-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'nine-off-five');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };

/* A CONTRACT THAT HAS BEEN READ, with the two tiles this run is about in a
   real state: a playbook review that ran, and a template form with a blank
   still open so the fill tile has a number to carry.
   IT IS MINTED THROUGH THE ROUTE, never pushed into the browser's own list —
   a contract that exists only in the browser draws no room at all, which is
   recorded in auto-triage-verify after three runs spent on it. Only the
   READING is written here, which is what a run would have left behind. */
const MARK = cid => {
  const c = state.contracts.find(x => x.id === cid);
  if (!c) return null;
  c.triage = { at: new Date().toISOString(), by: 'u1', steps: {
    brief: { ok: false, why: 'No brief yet' },
    playbook: { ok: true, cats: ['Governing law', 'Data protection'], dev: 2, miss: 1 },
    oblig: { ok: true, found: [{ desc: 'Pay each invoice within 60 days' }] },
    /* An older note with no `none` on it, so the tile falls through to the
       LIVE reading — the path the owner's own screen took. */
    fill: { ok: true, filled: [] } } };
  return c.id;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  /* Six published standards with names of very different lengths — the whole
     point of section 1 is that a long one must not make a taller card. */
  let firstTpl = null;
  for (const [name, description, category] of [
    ['Sales Distribution Agreement', 'Converted from Sales_Distribution_Agreement.docx (original stored: f_d5bf1d72)', 'sales'],
    ['Manufacturing OEM Agreement', '', 'procurement'],
    ['Procurement Value Stream Agreement', 'Commodity and ingredient supply into every plant we run', 'procurement'],
    ['Marketing Services Agreement', 'Short one.', 'marketing'],
    ['Corporate Professional Services and Advisory Agreement', '', 'corporate'],
    ['NDA', 'Confidentiality', 'corporate']]) {
    const tpl = await W.admin.json('/api/templates', { method: 'POST', body: { name, description, category } });
    const tid = tpl.template.id; const d = await W.admin.json('/api/templates/' + tid); const tv = d.versions[0].id;
    await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: { blocks: [
      { orderIndex: 0, blockType: 'heading', content: name },
      { orderIndex: 1, blockType: 'fixed_text', content: 'Between {{org_name}} and {{provider}}.' }],
      fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text' },
        /* REQUIRED, deliberately: tplFormOpenFields counts what a contract
           still OWES, and a field nobody has to answer is not owed. */
        { fieldKey: 'provider', label: 'Provider name', fieldType: 'short_text', required: true },
        { fieldKey: 'site', label: 'Delivery site', fieldType: 'short_text', required: true }] } });
    await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    if (!firstTpl) firstTpl = tid;
  }
  /* A REAL CONTRACT ON THE SERVER, from a standard whose form still has a
     blank in it — `provider` is answered by nothing, so the fill tile has a
     genuine open field to count rather than a number this file typed. */
  const made = (await W.admin.json(`/api/templates/${firstTpl}/contracts`,
    { method: 'POST', body: { folder: 'proc' } })).contract.id;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' }); await pause(400);
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go'); await pause(2600);
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} setView('register'); });
    await pause(1000);

    /* ═══ 1 · THE NEW AGREEMENT CARDS ═══ */
    await page.click('[data-page-new]'); await pause(900);
    /* RE-POINTED IN PLACE 22 Sep 2026 — Young chose proposal C, the cards
       became a rail of rows, and there is no grid left to stretch one row to
       another's height. The reasoning that produced these claims is kept in
       f349: reserving fixed the height BECAUSE a grid stretches. What still
       has to hold, and is what a reader actually feels, is that a long name
       does not wrap, every row measures the same, and the whole of what was
       cut rides the hover. */
    const cards = await page.evaluate(() => [...document.querySelectorAll('[data-wz-lib]')].map(d => {
      const r = d.getBoundingClientRect(), b = d.querySelector('.na-pick-n');
      return { h: Math.round(r.height), name: (b && b.textContent || '').slice(0, 20),
        nameH: b ? Math.round(b.getBoundingClientRect().height) : 0,
        cut: !!b && b.scrollWidth > b.clientWidth + 1,
        title: (d.getAttribute('title') || '') };
    }));
    await page.screenshot({ path: path.join(OUT, '01-cards.png') });
    const hs = [...new Set(cards.map(c => c.h))];
    check('1-stage six standards with names of very different lengths are drawn',
      cards.length === 6, `${cards.length} rows`);
    check('1a every row is exactly the same height',
      cards.length === 6 && hs.length === 1, `heights: ${hs.join(' · ')}`);
    check('1b and a rail row is a row, not a card — well under the old 86px',
      hs.length === 1 && hs[0] < 60, `${hs[0]}px`);
    check('1c a long name takes one line, like a short one, and is cut',
      new Set(cards.map(c => c.nameH)).size === 1 && cards.some(c => c.cut),
      cards.map(c => c.nameH).join('/') + ' · cut ' + cards.filter(c => c.cut).length);
    check('1d and the whole of what was cut is on the row\'s own hover',
      cards.every(c => c.title.split('\n')[0].length > 0)
      && cards.some(c => c.title.split('\n').length > 1),
      JSON.stringify(cards[0] && cards[0].title.slice(0, 70)));
    await page.evaluate(() => { const x = document.getElementById('na-x'); if (x) x.click(); });
    await pause(400);

    /* ═══ 2 · THE ARRIVAL STRIP ═══ */
    await page.evaluate(() => hydrate()); await pause(1200);
    const id = await page.evaluate(MARK, made);
    /* THE STRIP IS ON THE OVERVIEW TAB, and a record already Under Review
       opens on the Document tab — so the stage says which tab it means rather
       than hoping. */
    await page.evaluate(i => { openWorkspace(i); }, id); await pause(1400);
    await page.evaluate(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); }); await pause(1200);
    const strip = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('#kt-triage .kt-tri-tile')];
      const read = t => {
        const chip = t.querySelector('.kt-tri-chip'), hw = t.querySelector('.kt-tri-hw');
        return { head: (hw && hw.textContent || '').trim(), mark: (chip && chip.textContent || '').trim(),
          tone: chip ? chip.className.replace('kt-tri-chip', '').trim() : '',
          door: t.tagName === 'BUTTON', arrow: !!t.querySelector('.kt-tri-go') };
      };
      return { n: tiles.length, tiles: tiles.map(read) };
    });
    await page.screenshot({ path: path.join(OUT, '02-strip.png') });
    const fill = strip.tiles.find(t => /field/i.test(t.head));
    const std = strip.tiles.find(t => /standard/i.test(t.head));
    check('2-stage the strip is drawn with all five tiles', strip.n === 5, `${strip.n} tiles`);
    check('2a the open-fields tile carries a NUMBER, not a dash',
      !!fill && /^\d+$/.test(fill.mark) && Number(fill.mark) > 0, JSON.stringify(fill));
    check('2b and it reads as work owed, in amber',
      !!fill && fill.tone === 'is-warn', fill && fill.tone);
    check('2c the standards tile is a door and says so with an arrow',
      !!std && std.door && std.arrow, JSON.stringify(std));
    /* THE PRESS, not the attribute: a handler that is attached is not a
       handler that lands — this file's neighbours have paid for that twice. */
    const opened = await page.evaluate(async () => {
      const t = [...document.querySelectorAll('#kt-triage .kt-tri-tile')]
        .find(x => /standard/i.test((x.querySelector('.kt-tri-hw') || {}).textContent || ''));
      if (!t) return { pressed: false };
      t.click(); await new Promise(r => setTimeout(r, 700));
      return { pressed: true, panel: !!document.getElementById('playbook-section') };
    });
    check('2d and pressing it really opens the playbook review panel',
      opened.pressed && opened.panel, JSON.stringify(opened));

    /* ═══ 3 · THE DROPDOWN ═══ */
    await page.evaluate(() => { const b = document.querySelector('#context-panel [data-panel-close],.side-panel-x');
      if (b) b.click(); setView('register'); }); await pause(1200);
    const chip = await page.evaluate(() => { const c = document.querySelector('.reg-filterbar .reg-chip');
      if (!c) return null; const r = c.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
    check('3-stage the filter bar draws a chip', !!chip, JSON.stringify(chip));
    await page.mouse.click(chip.x, chip.y); await pause(400);
    const menu = await page.evaluate(() => {
      const el = document.querySelector('.hati-selmenu'); if (!el) return { drawn: false };
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const on = el.querySelector('.hati-selmenu-row.on');
      const rows = [...el.querySelectorAll('.hati-selmenu-row')];
      const rcs = rows[0] ? getComputedStyle(rows[0]) : null;
      /* A PAINTED PIXEL, never a rect: the ladder's hover card measured
         perfectly and was clipped away entirely (18 Sep). */
      const mid = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + 6));
      return { drawn: true, n: rows.length, radius: cs.borderTopLeftRadius,
        rowRadius: rcs ? rcs.borderTopLeftRadius : null, pos: cs.position,
        litBg: on ? getComputedStyle(on).backgroundColor : null,
        litInk: on ? getComputedStyle(on).color : null,
        painted: !!(mid && el.contains(mid)),
        below: Math.round(r.top) > Math.round(document.querySelector('.reg-filterbar .reg-chip')
          .getBoundingClientRect().bottom) - 2 };
    });
    await page.screenshot({ path: path.join(OUT, '03-menu.png') });
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent-fill').trim());
    check('3a a press on a chip draws HaTi\'s own list', menu.drawn && menu.n > 1, JSON.stringify(menu));
    check('3b it is really painted where it is measured', !!menu.painted, String(menu.painted));
    check('3c with the platform\'s card corner, not a square one',
      parseFloat(menu.radius) >= 8, menu.radius);
    check('3d and its rows with the platform\'s control corner',
      parseFloat(menu.rowRadius) > 0 && parseFloat(menu.rowRadius) < parseFloat(menu.radius),
      menu.rowRadius);
    /* [RELATION] the lit row is the workspace's own accent resolved live,
       never a colour typed here — so a brand change moves it. */
    check('3e the live row is the workspace\'s accent, in white',
      menu.litInk === 'rgb(255, 255, 255)' && !!accent, `${menu.litBg} on accent-fill ${accent}`);
    check('3f it opens under the chip it belongs to', !!menu.below, String(menu.below));
    /* A BUILD WITHOUT THE MENU MUST REPORT, NEVER ABORT. On a page that has
       never drawn one `rows[2]` is undefined, and a probe that throws takes
       every check after it down with it — a file that stops at sixteen proves
       nothing about the eight it never reached. */
    const picked = await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('.hati-selmenu-row')];
      if (rows.length < 3) return { word: null, sel: null, gone: null, face: null, none: true };
      const word = rows[2].textContent.trim(); rows[2].click();
      await new Promise(r => setTimeout(r, 600));
      const sel = document.querySelector('.reg-filterbar select');
      return { word, sel: sel ? sel.options[sel.selectedIndex].textContent.trim() : null,
        gone: !document.querySelector('.hati-selmenu'),
        face: ((document.querySelector('.reg-filterbar .reg-chip .reg-f-l') || {}).textContent || '').trim() };
    });
    check('3g a press writes the answer back to the select itself',
      !!picked.word && picked.sel === picked.word, `${picked.word} → ${picked.sel}`);
    check('3h the menu goes, and the chip says what is in force',
      !!picked.gone && !!picked.face && picked.face.indexOf(picked.word) >= 0, JSON.stringify(picked));
    await page.mouse.click(chip.x, chip.y); await pause(300);
    const o1 = await page.evaluate(() => !!document.querySelector('.hati-selmenu'));
    await page.mouse.click(chip.x, chip.y); await pause(300);
    const o2 = await page.evaluate(() => !!document.querySelector('.hati-selmenu'));
    check('3i the press that opens it closes it', o1 && !o2, `${o1} → ${o2}`);
    await page.mouse.click(chip.x, chip.y); await pause(250);
    await page.keyboard.press('Escape'); await pause(250);
    check('3j and Escape closes it', await page.evaluate(() => !document.querySelector('.hati-selmenu')));

    /* ═══ 4 · THE HORIZON BAR ═══ */
    await page.evaluate(() => {
      const base = state.contracts.find(c => c.expiry) || state.contracts[0];
      for (let i = 0; i < 6; i++) {
        const c = JSON.parse(JSON.stringify(base));
        c.id = 'HZ-' + i; c.name = 'Horizon ' + i;
        const d = new Date(Date.now() + (40 + i * 30) * 864e5).toISOString().slice(0, 10);
        c.expiry = d; c.metadata = Object.assign({}, c.metadata, { expiryDate: d });
        state.contracts.push(c);
      }
      setView('calendar');
    });
    await pause(1200);
    await page.click('[data-cal-view="horizon"]').catch(() => {}); await pause(1400);
    const bar = await page.evaluate(() => {
      const b = document.querySelector('.cal-hz-bar'); if (!b) return null;
      const r = b.getBoundingClientRect();
      const e = document.querySelector('.cal-hz-end');
      const er = e ? e.getBoundingClientRect() : null;
      return { h: Math.round(r.height), mid: Math.round(r.top + r.height / 2),
        endMid: er ? Math.round(er.top + er.height / 2) : null };
    });
    await page.screenshot({ path: path.join(OUT, '04-horizon.png') });
    check('4a the bar is the artifact\'s eight pixels', !!bar && bar.h === 8, bar && `${bar.h}px`);
    /* [RELATION] the tick marks the exact expiry day and sits on the bar's
       own centre line — the reason the top moved with the height. */
    check('4b and it still shares its centre line with the expiry tick',
      !!bar && bar.endMid != null && Math.abs(bar.mid - bar.endMid) <= 1,
      bar && `${bar.mid} vs ${bar.endMid}`);

    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
