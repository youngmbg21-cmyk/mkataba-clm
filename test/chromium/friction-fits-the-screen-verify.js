/* Chromium verification: NEGOTIATION FRICTION FITS THE SCREEN (owner-picked
   "Fit to Screen", 29 Sep 2026).
   =====================================================================
   "Make the pages fit with a page and for the cards to fit together without
   cards being taller than other cards and not covering spaces fully."

   Measured on the painted page, because the fault was paint: the details
   panel ran far below the window while the ranked list beside it stopped
   halfway, leaving a blank lower third under the list. f435 pins the
   structure; this asks what the reader sees, at the two screens the owner
   works on and at a narrow window where the page must become a column.

   MEASURED AT THE PARENT (616f3b30): 37 of 46 RED — no figure tile, the list
   stopping 80–90px above its panel at 1440 and 1920 (the blank the owner
   pointed at), no scroller in either card, the waiting list running the page
   to 1448px. The nine that pass are named: the page did not yet scroll on the
   clause lens with this book (the four "a" — true on both sides for this
   fixture; the waiting lens is where the parent scrolled), the [control]
   amber door, the two [wall]s at 1000px (a column that scrolls was already
   the narrow answer), no page errors, and every probe ran.

   Run: node test/chromium/friction-fits-the-screen-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'friction-fit');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* EVERY DRIVEN HALF IS GUARDED, so a build without the layout REPORTS rather
   than throwing on the first probe and proving nothing about the rest. */
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};
const waitFor = async (page, fn, arg) => {
  try { await page.waitForFunction(fn, arg, { timeout: 8000 }); return true; } catch (_) { return false; }
};

/* A BOOK WITH REAL FRICTION: 26 negotiations over ten clauses, several rounds,
   refusals nobody withdrew — enough that the waiting list is longer than any
   screen and the clause list is its full eight. Dates are offsets from now. */
function seedBook() {
  const iso = off => new Date(Date.now() + off * 86400000).toISOString();
  const CP = ['Naivas Supermarkets', 'Kabras Sugar', 'Nandi Dairy', 'Safaricom PLC', 'Bamburi Cement', 'Britam Insurance',
    'Siginon Logistics', 'KenGen', 'Twiga Foods', 'Equity Bank', 'Kenya Airways', 'Davis & Shirtliff'];
  const CL = ['Limitation of Liability', 'Payment Terms', 'Indemnity', 'Termination', 'Price Review', 'Governing Law',
    'Confidentiality', 'Service Levels', 'Intellectual Property', 'Warranties'];
  const ST = ['Signed', 'Signed', 'Signed', 'Under Review', 'Under Review', 'Draft', 'Signed', 'Under Review'];
  let seed = 7; const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const out = [];
  for (let i = 0; i < 26; i++) {
    const status = ST[i % ST.length], cp = CP[i % CP.length];
    const nR = 1 + Math.floor(r() * 4), rounds = [];
    for (let k = 1; k <= nR; k++) {
      const ch = [], m = 1 + Math.floor(r() * 3);
      for (let j = 0; j < m; j++) {
        const sts = ['accepted', 'accepted', 'rejected', 'accepted', 'rejected'];
        ch.push({ id: `CHG-${i}-${k}-${j}`, clauseLabel: CL[Math.floor(Math.pow(r(), 1.6) * CL.length)],
          authorSide: r() < 0.55 ? 'owner' : 'counterparty', status: sts[Math.floor(r() * sts.length)],
          createdAt: iso(-200 + i * 5 + k * 3), resolvedAt: iso(-199 + i * 5 + k * 3 + r() * 3), withdrawn: false });
      }
      rounds.push({ n: k, changes: ch });
    }
    const c = { id: 'MK-' + (1100 + i), name: ['Master Services', 'Supply Agreement', 'Works Contract', 'Software Licence', 'Office Lease', 'NDA'][i % 6] + ' — ' + cp.split(' ')[0],
      counterparty: cp, status, value: 5000000, folder: 'proc', audit: [], rounds: [], metadata: {}, valueType: 'standard',
      negotiation: { round: nR, rounds, startedAt: iso(-210 + i * 5), baselineBody: '<p>x</p>', baselineText: 'x', seq: 0, chainSeq: 0, chainHead: null, turn: 'owner', hashV: 2 },
      changes: [] };
    if (status === 'Signed') c.execution = { at: iso(-190 + i * 5 + nR * 6) };
    out.push(c);
  }
  state.contracts = out;
}

/* One reading of the tab as painted. */
function measure() {
  const host = document.getElementById('ig-friction');
  if (!host) return null;
  const R = el => { if (!el) return null; const r = el.getBoundingClientRect();
    return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height) }; };
  const list = host.querySelector('.igf-led-list'), det = host.querySelector('.igf-led-detail');
  const lsc = list && list.querySelector('.igx-scroll'), dsc = det && det.querySelector('.igx-scroll');
  /* Anything painted past its card's edge that is not inside a scroller of
     that card — the one place a long list is allowed to run on. */
  const spill = [];
  host.querySelectorAll('.igx-card').forEach(card => {
    const cr = card.getBoundingClientRect();
    card.querySelectorAll('*').forEach(el => {
      const sc = el.parentElement && el.parentElement.closest('.igx-scroll');
      if (sc && card.contains(sc)) return;
      const r = el.getBoundingClientRect(); if (!r.height || !r.width) return;
      if (r.bottom > cr.bottom + 1 || r.right > cr.right + 1) spill.push(String(el.className || el.tagName).slice(0, 40));
    });
  });
  const trs = [...host.querySelectorAll('.igf-led-table tbody tr')];
  const last = trs[trs.length - 1];
  const figs = [...host.querySelectorAll('.igx-figs > .igx-fig')];
  return {
    hostScrolls: host.scrollHeight > host.clientHeight + 1, hostBottom: Math.round(host.getBoundingClientRect().bottom),
    pageW: document.documentElement.scrollWidth, vw: innerWidth,
    cop: R(host.querySelector('.igf-led-cop')), figs: figs.length, figTops: [...new Set(figs.map(f => Math.round(f.getBoundingClientRect().top)))],
    figsR: R(host.querySelector('.igx-figs')), list: R(list), det: R(det),
    lsc: lsc ? { h: lsc.clientHeight, sh: lsc.scrollHeight } : null, dsc: dsc ? { h: dsc.clientHeight, sh: dsc.scrollHeight } : null,
    cards: host.querySelectorAll('.igx-card').length, rows: trs.length, gapUnderRows: (last && lsc) ? Math.round(lsc.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom) : null,
    spill,
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({});
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (W, H) => {
    const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    /* THE BOOK IS PUT IN AFTER THE PAGE HAS LOADED ITS OWN LIST — measured:
       seeded before the page is opened, opening Insights reloads the list and
       the tab draws its empty state over nothing. */
    await waitFor(page, () => typeof setView === 'function' && window.state && state.view
      && Array.isArray(state.contracts) && state.contracts.length > 0);
    await drive(page, () => { intel.tab = 'friction'; setView('intel'); }, undefined, null);
    await waitFor(page, () => document.getElementById('ig-friction'));
    await page.waitForLoadState('networkidle').catch(() => {});
    /* The sign-in's own list can still be landing (it is fetched in pages and
       replaces state.contracts as it goes), so the book is put in until it
       STAYS — asked as a state, bounded, never a fixed pause. */
    for (let i = 0; i < 6; i++) {
      await drive(page, seedBook, undefined, null);
      await drive(page, () => renderIntel(), undefined, null);
      await waitFor(page, () => document.querySelector('#ig-friction [data-igf-list="clauses"]'));
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(400);
      const stays = await drive(page, () => state.contracts.some(c => c.id === 'MK-1100')
        && !!document.querySelector('#ig-friction [data-igf-list="clauses"]'), undefined, false);
      if (stays) break;
    }
    return page;
  };
  const lens = async (page, k) => {
    await drive(page, l => { const b = document.querySelector(`#ig-friction [data-igf-lens="${l}"]`); if (b) b.click(); }, k, null);
    await waitFor(page, l => document.querySelector(`#ig-friction [data-igf-list="${l}"]`), k);
  };

  try {
    for (const [W, H] of [[1440, 900], [1920, 1080]]) {
      const page = await open(W, H);
      for (const dark of [false, true]) {
        await drive(page, d => setDark(d), dark, null);
        await waitFor(page, d => document.documentElement.classList.contains('dark') === d, dark);
        const tag = `${W}${dark ? ' dark' : ''}`;
        await lens(page, 'clauses');
        const m = await drive(page, measure, undefined, null) || {};
        check(`${tag} a — the tab fits: the page itself does not scroll`, m.hostScrolls === false, JSON.stringify({ scrolls: m.hostScrolls }));
        check(`${tag} b — Copilot's read first, then six figure tiles in one line`,
          !!m.cop && !!m.figsR && m.cop.b <= m.figsR.t && m.figs === 6 && (m.figTops || []).length === 1,
          `${m.figs} tiles · tops ${JSON.stringify(m.figTops)}`);
        check(`${tag} c — the list and its panel share top and bottom edges`,
          !!m.list && !!m.det && Math.abs(m.list.t - m.det.t) <= 1 && Math.abs(m.list.b - m.det.b) <= 1 && m.list.r < m.det.l,
          m.list && m.det ? `list ${m.list.t}–${m.list.b} · panel ${m.det.t}–${m.det.b}` : 'not drawn');
        check(`${tag} d — and reach the bottom of the window's page`,
          !!m.list && m.list.b <= m.hostBottom && m.hostBottom - m.list.b <= 24, m.list ? `${m.list.b} of ${m.hostBottom}` : 'not drawn');
        check(`${tag} e — the list's rows fill its card, no blank lower third`,
          m.rows === 8 && m.gapUnderRows != null && m.gapUnderRows <= 2 && m.gapUnderRows >= -2, `${m.rows} rows · ${m.gapUnderRows}px under the last`);
        check(`${tag} f — nothing runs past a card except inside its own scroller`,
          m.cards >= 3 && Array.isArray(m.spill) && m.spill.length === 0, `${m.cards} cards · ${JSON.stringify(m.spill)}`);
        check(`${tag} g — the panel's long lists scroll inside the panel`,
          !!m.dsc && m.dsc.h > 0 && m.dsc.sh >= m.dsc.h, JSON.stringify(m.dsc));
        await page.screenshot({ path: path.join(OUT, `${W}${dark ? '-dark' : ''}-clauses.png`) });

        for (const k of ['cps', 'wait']) {
          await lens(page, k);
          const n = await drive(page, measure, undefined, null) || {};
          check(`${tag} ${k} — same fit on this lens`,
            n.hostScrolls === false && !!n.list && !!n.det && Math.abs(n.list.b - n.det.b) <= 1 && Array.isArray(n.spill) && n.spill.length === 0,
            JSON.stringify({ scrolls: n.hostScrolls, list: n.list && n.list.b, det: n.det && n.det.b, spill: n.spill }));
          if (k === 'wait') check(`${tag} wait — a list longer than the card scrolls inside it`,
            !!n.lsc && n.lsc.sh > n.lsc.h + 10, JSON.stringify(n.lsc));
          await page.screenshot({ path: path.join(OUT, `${W}${dark ? '-dark' : ''}-${k}.png`) });
        }
      }
      await drive(page, () => setDark(false), undefined, null);

      if (W === 1440) {
        /* A PRESS ON A ROW DEEP IN A SCROLLED LIST keeps the list where it was:
           the ledger repaints under the press, and a list that jumped back to
           its top would lose the reader's place. */
        await lens(page, 'wait');
        const kept = await drive(page, async () => {
          const sc = document.querySelector('#ig-friction .igf-led-list .igx-scroll');
          if (!sc) return null;
          sc.scrollTop = 300; await new Promise(r => requestAnimationFrame(() => r()));
          const before = sc.scrollTop;
          const rows = [...sc.querySelectorAll('tbody tr')];
          const row = rows.find(r => { const b = r.getBoundingClientRect(), s = sc.getBoundingClientRect(); return b.top > s.top + 30 && b.bottom < s.bottom; });
          if (!row) return { before, after: -1 };
          const key = row.getAttribute('data-igf-row');
          row.click();
          await new Promise(r => requestAnimationFrame(() => r()));
          const sc2 = document.querySelector('#ig-friction .igf-led-list .igx-scroll');
          const sel = document.querySelector('#ig-friction tr.is-sel');
          return { before, after: sc2 ? sc2.scrollTop : -1, picked: !!sel && sel.getAttribute('data-igf-row') === key };
        }, undefined, null);
        check('1440 h — a press deep in the list picks that row and keeps the list where it was',
          !!kept && kept.before > 100 && Math.abs(kept.after - kept.before) <= 2 && kept.picked === true, JSON.stringify(kept));
        /* The amber figure still switches to the waiting list and back. */
        await lens(page, 'clauses');
        await drive(page, () => { const b = document.querySelector('#ig-friction [data-igf-go="wait"]'); if (b) b.click(); }, undefined, null);
        const onWait = await waitFor(page, () => document.querySelector('#ig-friction [data-igf-list="wait"]'));
        check('1440 i [control] — the amber figure still opens the waiting list', onWait);
      }
      await page.close();
    }

    /* BELOW THE GRAMMAR'S LINE the page is a plain column that scrolls. */
    const narrow = await open(1000, 800);
    const n = await drive(narrow, measure, undefined, null) || {};
    check('1000 [wall] — the list and its panel stack, one under the other',
      !!n.list && !!n.det && n.list.h > 0 && n.det.t >= n.list.b, n.list && n.det ? `list ends ${n.list.b}, panel starts ${n.det.t}` : 'not drawn');
    check('1000 [wall] — the page scrolls instead of squeezing, and never sideways',
      n.hostScrolls === true && n.pageW <= n.vw, JSON.stringify({ scrolls: n.hostScrolls, pageW: n.pageW, vw: n.vw }));
    await narrow.screenshot({ path: path.join(OUT, '1000-clauses.png') });
    await narrow.close();

    check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 300) || 'clean');
    check('every probe ran', blocked.length === 0, blocked.join(' | ').slice(0, 300) || 'none blocked');
  } catch (e) {
    check('the run completed', false, String((e && e.stack) || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
