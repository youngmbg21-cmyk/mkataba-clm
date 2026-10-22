/* ============================================================
   STILL OWED, THE SAP WAY (owner picked "The SAP way" by name, 21 Oct 2026)
   ============================================================
   Jambo's Dossier beside the paper asks each owed fact in ONE column, the
   label above its box (SAP's rule for a form under 600 wide): the label with
   Confirm on its right, where Jambo read it under that, the box(es) the full
   width. The old three-column grid gave a box ~108px of text, so a signer's
   name and email and the stream's chip were cut.
     1  at 1440x780 the signer's name, the signer's email and the stream's
        chip are measured whole (nothing cut), each Confirm inside the panel
     2  each of the signer's three boxes has its label above it
     3  an empty owed box is still amber
     4  nothing in the Still owed card falls past the panel's right edge
     5  beside the Board's card the held grid is drawn the same way: the
        reading full width, "Fill in ›" inside the panel
     6  Key terms (the same .pd-og clothes) keeps its table
     7  the owner's other two screens: the same measures
     8  a hand in a box whose label was scrolled away sees the label brought
        back, so Tab onto Confirm (now above the box) does not jump the panel
     node test/chromium/still-owed-sap-way-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, ckOpenRowOf } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'still-owed-sap-way');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ID = 'MK-SAP1';
const NAME = 'Christopher Kiprotich Wanyama', MAIL = 'christopher.k.wanyama@siginongroup.co.ke';
const TEXT = ['WAREHOUSING AND DISTRIBUTION SERVICES AGREEMENT', '',
  'This agreement is made between Highland Corporate Ltd (the Client) and Siginon Group Logistics Ltd (the Provider).', '',
  '1. Services', '', 'The Provider shall receive, store and dispatch the Client\'s finished goods at its Mombasa Road warehouse.', '',
  '2. Payment terms', '', 'The Client shall pay each correct invoice within 30 days of receipt.'].join('\n');

/* what the grid draws, measured in the page: text widths by the box's own font, edges against the panel */
const MEASURE = () => {
  const dock = document.getElementById('ig-dock'), feed = document.getElementById('igd-feed');
  const grid = document.querySelector('#ig-dock #pd-og, #ig-dock #pd-og-held');
  if (!dock || !grid) return { up: false };
  const edge = Math.min(dock.getBoundingClientRect().right, feed ? feed.getBoundingClientRect().right : Infinity);
  const cv = document.createElement('canvas').getContext('2d');
  const textW = (el, t) => { const s = getComputedStyle(el); cv.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; return cv.measureText(t).width; };
  const boxFits = el => { if (!el) return null; const s = getComputedStyle(el);
    const have = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    return { text: el.value, need: Math.round(textW(el, el.value || '')), have: Math.round(have), whole: textW(el, el.value || '') <= have + 1 && el.scrollWidth <= el.clientWidth + 1 }; };
  const chip = grid.querySelector('tr[data-pd-og-row="stream"] .pd-og-done');
  const sg = k => grid.querySelector(`[data-pd-og-sg="${k}"]`);
  /* RE-POINTED 21 Oct 2026: the two name boxes are search boxes over the directory now
     (the owner's "The SAP way" signer row), so each sits inside its own .pd-og-sb — the
     label still stands immediately above the box, which is what this reads. */
  const labelOver = el => { const w = el && el.closest ? (el.closest('.pd-og-sb') || el) : el;
    const p = w && w.previousElementSibling; return p && p.classList.contains('pd-og-ml') ? p.textContent.trim() : null; };
  const acts = [...grid.querySelectorAll('[data-pd-og-ok], [data-pd-og-go]')].map(b => ({ k: b.getAttribute('data-pd-og-ok') || b.getAttribute('data-pd-og-go'), right: Math.round(b.getBoundingClientRect().right) }));
  /* anything with its own words in the card that runs past the panel's right edge */
  const past = [];
  const card = document.getElementById('pd-needs');
  (card ? [...card.querySelectorAll('*')] : []).forEach(el => {
    if (!el.getClientRects().length || el.closest('.sr-only')) return;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && /\S/.test(n.nodeValue));
    if (!own && !/^(BUTTON|INPUT|SELECT)$/.test(el.tagName)) return;
    const r = el.getBoundingClientRect(); if (r.width && r.right > edge + 1) past.push((el.textContent || el.value || el.tagName).trim().slice(0, 40) + ' @' + Math.round(r.right));
  });
  const probe = document.createElement('div'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
  const amber = getComputedStyle(probe).backgroundColor; probe.remove();
  const val = grid.querySelector('[data-kt="value"]');
  /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): beside the Board what stands is on the row's one line */
  const read = grid.querySelector('tr[data-pd-og-row="value"] .pd-ck-v');
  const kt = document.querySelector('#ig-dock #pd-kt table.pd-og');
  return { up: true, edge: Math.round(edge), held: grid.id === 'pd-og-held',
    tname: boxFits(sg('tname')), temail: boxFits(sg('temail')),
    chip: chip ? { text: chip.textContent, need: chip.scrollWidth, have: chip.clientWidth, whole: chip.scrollWidth <= chip.clientWidth + 1 } : null,
    labels: ['ours', 'tname', 'temail'].map(k => labelOver(sg(k))),
    acts, actsIn: acts.length > 0 && acts.every(a => a.right <= edge + 1), past,
    amber: val ? getComputedStyle(val).backgroundColor === amber : null,
    theadShown: [...grid.querySelectorAll('thead th')].some(th => { const r = th.getBoundingClientRect(); return r.width > 2 && r.height > 2; }),
    read: read ? { w: Math.round(read.getBoundingClientRect().width), grid: Math.round(grid.getBoundingClientRect().width), whole: read.scrollWidth <= read.clientWidth + 1, line: !!read.closest('.pd-ck-hd') } : null,
    ktTable: kt ? getComputedStyle(kt).display : null };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c = Object.assign(fixtureContract(ID, 'Warehousing and Distribution Services Agreement', 'Siginon Group Logistics Ltd', 'dist', 0, 'Under Review', TEXT), {
    template: null, owner: { id: me.id, name: me.name }, fields: { value: '' }, metadata: { value: 0, currency: 'KES', contractType: 'Warehousing' },
    counterpartyName: NAME, counterpartyEmail: MAIL });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    check('0 the contract is staged', !!(put && put.ok), JSON.stringify(put).slice(0, 160));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, id => window.state && Array.isArray(state.contracts) && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });
    const open = async () => {
      await page.evaluate(() => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); setView('register'); });
      await waitFor(page, () => !!document.querySelector('#ct-place, #reg-root, .reg-card'), 6000);
      await page.evaluate(id => regOpenContract(id), ID);
      await waitFor(page, id => !!document.querySelector(`#pd-glance[data-pd-glance-for="${id}"]`), 12000, ID);
      await page.evaluate(id => { if (typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'copilot'); }, ID);
      return waitFor(page, () => !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'), 10000);
    };
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      const up = await open();
      await page.evaluate(() => { const r = document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'); if (r) r.scrollIntoView({ block: 'center' }); });
      await page.evaluate(() => document.fonts.ready); await pause(300);
      const m = up ? await page.evaluate(MEASURE) : { up: false };
      const at = `${w}x${hh}`;
      check(`1 ${at} the grid asks the signer beside the paper`, up && m.up, JSON.stringify({ up, m: m.up }));
      if (!m.up) continue;
      /* RE-POINTED 22 Oct 2026 (owner: "the highlighted feature should be deleted because the use for it is in
         the pop up feature for signer"): the signer's name and email boxes went; the Signer line is one line whose
         press opens the signing route, and what it says stands whole */
      const sg = await page.evaluate(() => { const r = document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'); if (!r) return null;
        const v = r.querySelector('.pd-ck-v'); return { boxes: r.querySelectorAll('input, select').length, door: !!r.querySelector('.pd-ck-hd[data-pd-og-route]'),
          whole: !!v && v.scrollWidth <= v.clientWidth + 1, words: v ? v.textContent : '' }; });
      check(`1a ${at} the Signer line carries no boxes and opens the signing route`, !!sg && sg.boxes === 0 && sg.door, JSON.stringify(sg));
      check(`1b ${at} what the Signer line says stands whole`, !!sg && sg.whole, JSON.stringify(sg));
      check(`1c ${at} the stream's chip is whole`, !!(m.chip && m.chip.whole), JSON.stringify(m.chip));
      check(`1d ${at} every Confirm sits inside the panel`, m.actsIn, JSON.stringify({ edge: m.edge, acts: m.acts }));
      /* RE-POINTED 22 Oct 2026: the signer's boxes (and their labels) went with the owner's ruling; none is left */
      check(`2 ${at} no signer box is left in the row`, !!sg && sg.boxes === 0, JSON.stringify(sg));
      check(`2a ${at} the column names take no room on screen`, m.theadShown === false);
      check(`3 ${at} an empty owed box is amber`, m.amber === true);
      check(`4 ${at} nothing in Still owed falls past the panel's edge`, m.past.length === 0, JSON.stringify(m.past));
      if (w === 1440) {
        check('6 Key terms keeps its table', m.ktTable === null || m.ktTable === 'table', m.ktTable);
        /* 8 the label and Confirm stand above the box: a hand in a box whose label was scrolled away sees it
           brought back, so Tab onto Confirm does not jump the panel */
        const tuck = await page.evaluate(() => { const f = document.getElementById('igd-feed'), b = document.querySelector('#ig-dock #pd-og [data-kt="value"]');
          if (!f || !b) return null; f.scrollTop += b.getBoundingClientRect().top - f.getBoundingClientRect().top - 4; return Math.round(b.getBoundingClientRect().top); });
        await ckOpenRowOf(page, '#ig-dock #pd-og [data-kt="value"]'); await page.click('#ig-dock #pd-og [data-kt="value"]');
        const atClick = await page.evaluate(() => { const b = document.querySelector('#ig-dock #pd-og [data-kt="value"]'), t = b.closest('tr'), f = document.getElementById('igd-feed');
          return { box: Math.round(b.getBoundingClientRect().top), rowIn: t.getBoundingClientRect().top >= f.getBoundingClientRect().top - 1 }; });
        /* the value row: the box, its "No money passes" tick, then Confirm */
        for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab');
          if (await page.evaluate(() => !!(document.activeElement && document.activeElement.hasAttribute('data-pd-og-ok')))) break; }
        const atTab = await page.evaluate(() => { const b = document.querySelector('#ig-dock #pd-og [data-kt="value"]'), a = document.activeElement;
          return { box: Math.round(b.getBoundingClientRect().top), on: a && a.getAttribute('data-pd-og-ok') }; });
        check('8 a hand in a box sees its label; Tab onto Confirm does not move the panel', tuck != null && atClick.rowIn && atTab.box === atClick.box && atTab.on === 'value', JSON.stringify({ tuck, atClick, atTab }));
        await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
        await page.screenshot({ path: path.join(OUT, `paper-${at}.png`) });
      }
    }
    /* ===== 5. BESIDE THE BOARD'S CARD ===== */
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.evaluate(() => { setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('board'); });
    await waitFor(page, () => !!document.getElementById('hb-board'), 8000);
    await page.evaluate(id => hbStripBring(id), ID);
    /* RE-POINTED 22 Oct 2026 (the Checklist): beside the Board a row is its one line, what stands on it */
    const held = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og-held tr[data-pd-og-row="value"] .pd-ck-v'), 12000);
    await pause(300);
    const mh = held ? await page.evaluate(MEASURE) : { up: false };
    check('5 beside the Board the held grid is drawn', held && mh.up && mh.held, JSON.stringify({ held, up: mh.up }));
    if (mh.up) {
      check('5a its reading stands whole on the row\'s line', !!(mh.read && mh.read.line && mh.read.whole), JSON.stringify(mh.read));
      check('5b its "Fill in ›" sits inside the panel; nothing past the edge', mh.actsIn && mh.past.length === 0, JSON.stringify({ acts: mh.acts, past: mh.past }));
      check('5c the stream\'s chip is whole there too', !!(mh.chip && mh.chip.whole), JSON.stringify(mh.chip));
      await page.screenshot({ path: path.join(OUT, 'held-1440x780.png') });
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
