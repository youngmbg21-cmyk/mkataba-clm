/* Chromium verification: THE THREE BUTTON FIXES (Young, 26 Sep 2026, over three
   screenshots: "image 1, buttons should never wrap text. Image two, the buttons
   should be the same size and likely the size of the needs your decision card.
   Image 3, some buttons have dark outlines when the common approach is a light
   grey outline." Then: "fix the three button issues first").
   ====================================================================
   f386 pins what the sheets SAY. This file measures what a reader SEES, because
   every one of the three is a painted fact: whether a label takes one line or
   two once a long title squeezes its column, whether two cards' buttons are one
   size, and which colour each control's edge really paints — a rule can read
   right in the source and lose a cascade fight on the screen.

   THE STAGE is a new workspace with the sample portfolio (it carries approvals,
   a live negotiation, the checks card and the signing column at once). Three
   sections, run edges first on the untouched book, then the squeeze, then
   Home, so no stage leaks into another section's measurement:
     3 · one light grey edge — the Document tab's row the owner photographed,
         Home, Contracts, the Negotiate page, a sweep, the night theme, a wall;
     1 · no label wraps — the owner's own squeeze, long titles on the Approvals
         page at four widths, and a sweep of the working pages at 1024;
     2 · Home's two cards — a desk row STAGED on real records (the sample book
         has none) measured beside a decision row.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the fixes REPORTS its failures rather than passing on an empty page.
   Controls pass on both sides by design and are named. AT THE PARENT (4082f9d)
   11 of 17 fail, and print the owner's three screenshots back: the Document
   tab's row as navy · #CBD3D0 · #CBD3D0 · #E2E7E5, "Open the gate" 31px on two
   lines under long titles, 14 of 14 row-menu squares cut at 1024, and the
   desk's verbs at 28px / 13px / 600 with the lead act filled on every row.

   Run: node test/chromium/button-consistency-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'button-consistency');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const HELPERS = `(() => {
  const vis = el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!(r.width > 0 && r.height > 0) || cs.visibility === 'hidden' || cs.display === 'none') return false;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p); if (s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none') return false; }
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  /* How many lines a control's own words take: every text fragment, grouped by top. */
  const lines = el => { const tops = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => /\\S/.test(n.nodeValue) ? 1 : 3 });
    let n; while ((n = w.nextNode())) { const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width > 0.5 && b.height > 0.5) tops.push(b.top); }
    tops.sort((a, b) => a - b); let c = 0, last = -1e9; for (const t of tops) if (t - last > 4) { c++; last = t; } return c; };
  const label = el => (el.innerText || el.getAttribute('aria-label') || el.title || '').replace(/\\s+/g, ' ').trim().slice(0, 40);
  const who = el => (el.id ? '#' + el.id : '') + '.' + String(el.className || '').trim().split(/\\s+/).slice(0, 3).join('.');
  /* A LABELLED button: short words, nothing block-level inside, not a card. */
  const labelled = () => [...document.querySelectorAll('button, a.ui-btn, a.ui-link, [role=button], summary')]
    .filter(vis).filter(b => { const t = label(b); return t && t.length <= 48
      && !b.querySelector('div,p,li,ul,table,h1,h2,h3,h4,section') && b.getBoundingClientRect().height <= 44; });
  const wraps = () => labelled().filter(b => lines(b) > 1).map(b => who(b) + ' "' + label(b) + '" ' + Math.round(b.getBoundingClientRect().height) + 'px');
  const tok = v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;left:-9999px;border:1px solid var(' + v + ')';
    document.body.appendChild(e); const c = getComputedStyle(e).borderTopColor; e.remove(); return c; };
  const bg = v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;left:-9999px;background:var(' + v + ')';
    document.body.appendChild(e); const c = getComputedStyle(e).backgroundColor; e.remove(); return c; };
  const edge = el => el ? getComputedStyle(el).borderTopColor : null;
  window.__b = { vis, lines, label, who, labelled, wraps, tok, bg, edge };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd');
    await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke');
    await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample');
    if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await page.waitForTimeout(3500);
    await page.keyboard.press('Escape').catch(() => {});
    /* The owner's own look: the navy workspace in the light theme. */
    await page.evaluate(() => { try { setBrand('navy'); } catch (e) {} try { setDark(false); } catch (e) {} try { applyAppearance(); } catch (e) {} });
    const load = () => page.evaluate(HELPERS);
    await load();
    const id = await page.evaluate(() => { const c = state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]; return c && c.id; });
    ok('0-stage a contract under review to measure on', !!id, id || 'none');
    /* Resting controls: the pointer is parked where it hovers nothing. */
    const rest = () => page.mouse.move(2, 890);

    /* ════════ 3. ONE LIGHT GREY EDGE ════════ */
    await page.evaluate(i => { openWorkspace(i); setTimeout(() => { try { roomGoTab(getContract(i), 'docs'); } catch (e) {} }, 50); }, id);
    await page.waitForTimeout(1600); await load(); await rest();
    await page.screenshot({ path: path.join(OUT, '01-document-tab.png') });
    const row = await page.evaluate(() => {
      const b = window.__b, want = b.tok('--btn-edge');
      const pick = sel => [...document.querySelectorAll(sel)].find(b.vis) || null;
      const seg = pick('.doc-read-seg'), exp = pick('#ws-tabrow-end summary.ui-btn, summary.ui-btn'), nego = pick('#ws-to-nego'), step = pick('.rl-type-step');
      const lit = seg && seg.querySelector('button[aria-pressed="true"]');
      const seam = seg && seg.querySelector('button + button');
      return { want, fill: b.bg('--accent-fill'),
        seg: b.edge(seg), exp: b.edge(exp), nego: b.edge(nego), step: b.edge(step),
        seam: seam ? getComputedStyle(seam).borderLeftColor : null,
        litBg: lit ? getComputedStyle(lit).backgroundColor : null, litInk: lit ? getComputedStyle(lit).color : null };
    });
    ok('3a the row the owner photographed paints ONE edge — the switch, Export, Open Negotiate and the stepper',
      !!(row.seg && row.exp && row.nego && row.step) && [row.seg, row.exp, row.nego, row.step].every(c => c === row.want),
      `switch ${row.seg} · Export ${row.exp} · Open Negotiate ${row.nego} · stepper ${row.step} · token ${row.want}`);
    ok('3b and it is the LIGHT grey, #E2E7E5', row.want === 'rgb(226, 231, 229)', row.want);
    ok('3c the switch\'s seams are the same grey', !!row.seam && row.seam === row.want, `seam ${row.seam}`);
    ok('3d [control] its lit half is still FILLED, with white words — the fill says which is on',
      !!row.litBg && row.litBg === row.fill && row.litInk === 'rgb(255, 255, 255)', `${row.litBg} / ${row.litInk}`);

    await page.evaluate(i => openRedlineWorkbench(i, { blanksAsked: true }), id);
    await page.waitForTimeout(1800); await load(); await rest();
    await page.screenshot({ path: path.join(OUT, '02-negotiate.png') });
    const nego = await page.evaluate(() => {
      const b = window.__b, want = b.tok('--btn-edge');
      const wrap = [...document.querySelectorAll('.rl-actions .rl-segwrap:not(.rl-readwrap)')].find(b.vis);
      const second = wrap && wrap.querySelector('.rl-seg + .rl-seg');
      return { want, box: b.edge(wrap), seam: second ? getComputedStyle(second).borderLeftColor : null };
    });
    ok('3e the Negotiate page\'s Internal | Counterparty switch takes the same edge, with a seam',
      !!nego.box && nego.box === nego.want && nego.seam === nego.want, `box ${nego.box} · seam ${nego.seam}`);

    /* THE SWEEP: every outlined, UNFILLED, resting button-like control on the
       working pages. Cards are left out on purpose (the work order): a card
       is taller than any rung, or carries a block inside it. */
    const SWEEP = `(() => { const b = window.__b, want = b.tok('--btn-edge'), out = [];
      const sel = 'button, summary, [role=button], .doc-read-seg, .rl-segwrap, .reg-seg, .cal-seg, .rl-type-step, .reg-chip, .hm-rverb';
      for (const el of document.querySelectorAll(sel)) {
        if (!b.vis(el)) continue;
        const r = el.getBoundingClientRect(); if (r.height > 36) continue;
        if (el.querySelector('div,p,li,ul,table,h2,h3,h4,section')) continue;
        if (el.closest('#top-header')) continue;          /* the navy bar's controls are white-on-navy by design */
        const cs = getComputedStyle(el);
        if (!(parseFloat(cs.borderTopWidth) >= 0.5) || cs.borderTopStyle === 'none') continue;
        const col = cs.borderTopColor; if (/rgba\\([^)]*,\\s*0\\)$/.test(col) || col === 'transparent') continue;
        const face = cs.backgroundColor;
        const filled = !(face === 'rgba(0, 0, 0, 0)' || face === 'transparent' || face === 'rgb(255, 255, 255)');
        if (filled) continue;
        if (col !== want) out.push(b.who(el) + ' "' + b.label(el).slice(0, 18) + '" ' + col);
      }
      return { want, odd: out }; })()`;
    const swept = [];
    const sweepAt = async (where, go) => { await page.evaluate(go); await page.waitForTimeout(1300); await load(); await rest();
      const r = await page.evaluate(SWEEP); r.odd.forEach(x => swept.push(where + ' · ' + x)); };
    await sweepAt('home', () => setView('dashboard'));
    await sweepAt('contracts', () => { try { regSetScope(null); } catch (e) {} setView('register'); });
    await sweepAt('negotiations', () => openNegotiations({ list: true }));
    await sweepAt('approvals', () => setView('approvals'));
    await sweepAt('calendar', () => setView('calendar'));
    await sweepAt('signing', () => { const i = (state.contracts.find(c => c.status === 'Under Review') || {}).id; openWorkspace(i); setTimeout(() => { try { roomGoTab(getContract(i), 'sign'); } catch (e) {} }, 50); });
    ok('3f a sweep of seven working pages finds no outlined control resting on another edge',
      swept.length === 0, swept.length ? swept.slice(0, 8).join(' | ') : 'every one reads --btn-edge');

    const night = await page.evaluate(() => { try { setDark(true); applyAppearance(); } catch (e) {}
      const b = window.__b; const want = b.tok('--btn-edge');
      const el = [...document.querySelectorAll('.ui-btn:not(.ui-btn-primary)')].find(b.vis);
      const div = b.tok('--color-divider');
      const out = { want, div, btn: b.edge(el) };
      try { setDark(false); applyAppearance(); } catch (e) {}
      return out; });
    ok('3g [control] at night the edge stays VISIBLE — the stronger night grey, not the day token followed into the dark',
      night.want === 'rgb(54, 66, 63)' && night.btn === night.want && night.want !== night.div,
      `edge ${night.want} · button ${night.btn} · night divider ${night.div}`);

    const wall = await page.evaluate(i => { try { openShareModal(getContract(i)); } catch (e) {} return i; }, id);
    await page.waitForTimeout(1500); await load();
    const field = await page.evaluate(() => { const b = window.__b;
      const inp = [...document.querySelectorAll('#modal-root input[type=email], #modal-root input[type=text], #sh-email')].find(b.vis);
      const out = { field: b.edge(inp), line: b.tok('--field-line'), btn: b.tok('--btn-edge') };
      try { closeModal(); } catch (e) {}
      return out; });
    ok('3h [wall] a text box keeps its own stronger edge — it tells a reader where to type',
      !!field.field && field.field === field.line && field.field !== field.btn, `box ${field.field} · --field-line ${field.line}`);
    void wall;

    /* ════════ 1. NO LABEL WRAPS ════════ */
    /* THE OWNER'S OWN SQUEEZE: three contract titles lengthened, so the
       Approvals table gives the button column less room. At the parent this
       broke "Open the gate" onto two lines, 88 x 31. */
    await page.evaluate(() => { state.contracts.filter(c => c.status !== 'Signed').slice(0, 3).forEach(c => {
      if (!c._t0) c._t0 = c.name; c.name = c._t0 + ' — Master Services, Supply, Distribution and Logistics Framework for East Africa'; }); });
    const squeeze = [];
    for (const W of [1024, 1180, 1294, 1440]) {
      await page.setViewportSize({ width: W, height: 820 });
      await page.evaluate(() => setView('approvals'));
      await page.waitForTimeout(1200); await load();
      const r = await page.evaluate(() => { const b = window.__b;
        const go = [...document.querySelectorAll('.ap-go')].filter(b.vis);
        return { n: go.length, bad: go.filter(x => b.lines(x) > 1 || x.getBoundingClientRect().height > 26).map(x => b.label(x) + ':' + Math.round(x.getBoundingClientRect().height)) }; });
      squeeze.push({ W, ...r });
      if (W === 1024) await page.screenshot({ path: path.join(OUT, '03-approvals-1024.png') });
    }
    ok('1a the Approvals page\'s "Open the gate" stays one line under long titles, at 1024 to 1440',
      squeeze.every(s => s.n > 0 && s.bad.length === 0), squeeze.map(s => `${s.W}: ${s.n} buttons${s.bad.length ? ' — ' + s.bad.join(', ') : ''}`).join(' · '));

    await page.setViewportSize({ width: 1024, height: 820 });
    const wrapped = [];
    const wrapAt = async (where, go, arg) => { await page.evaluate(go, arg); await page.waitForTimeout(1300); await load();
      (await page.evaluate(() => window.__b.wraps())).forEach(x => wrapped.push(where + ' · ' + x)); };
    await wrapAt('contracts', () => { try { regSetScope(null); } catch (e) {} setView('register'); });
    await wrapAt('negotiations', () => openNegotiations({ list: true }));
    await wrapAt('approvals', () => setView('approvals'));
    for (const tab of ['terms', 'docs', 'sign'])
      await wrapAt('room-' + tab, i => { openWorkspace(i[0]); setTimeout(() => { try { roomGoTab(getContract(i[0]), i[1]); } catch (e) {} }, 50); }, [id, tab]);
    await wrapAt('negotiate', i => openRedlineWorkbench(i, { blanksAsked: true }), id);
    ok('1b at a 1024 window no labelled button on the working pages takes two lines', wrapped.length === 0,
      wrapped.length ? wrapped.slice(0, 6).join(' | ') : 'none');

    await page.evaluate(() => { try { regSetScope(null); } catch (e) {} setView('register'); });
    await page.waitForTimeout(1300); await load();
    const menu = await page.evaluate(() => { const cells = [...document.querySelectorAll('td.reg-cell-menu')].filter(window.__b.vis);
      return { n: cells.length, cut: cells.filter(td => td.scrollWidth > td.clientWidth + 0.5).length, w: cells[0] ? Math.round(cells[0].clientWidth) : 0 }; });
    ok('1c at 1024 the Contracts row menu\'s square fits its cell', menu.n > 0 && menu.cut === 0, `${menu.cut} of ${menu.n} cut · cell ${menu.w}px`);
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ════════ 2. HOME'S TWO CARDS, ONE BUTTON SIZE ════════ */
    /* A DESK ROW, STAGED ON REAL RECORDS — home-page-verify 11's own three
       states: an obligation of theirs past its date, an upload whose standards
       pass found something, and an agreement inside its renewal window. */
    const staged = await page.evaluate(() => {
      const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined' && c.status !== 'Signed');
      const [a, b, cc] = live; if (!a || !b || !cc) return null;
      a.status = 'Signed'; a.counterpartyEmail = 'ops@nordkust.example';
      a.obligations = [{ id: 'ob-desk', desc: 'Quarterly volume report', due: day(-4), party: 'theirs', status: 'open' }];
      b.source = 'upload';
      b.triage = { at: day(-1), seenAt: null, steps: { playbook: { ok: true, dev: 2, miss: 1, cats: ['Payment terms', 'Liability'] } } };
      cc.status = 'Signed'; cc.parentId = null; cc.expiry = day(40);
      cc.metadata = Object.assign({}, cc.metadata, { expiryDate: day(40), noticePeriodDays: 30 });
      setView('dashboard');
      return true;
    });
    await page.waitForTimeout(1500); await load(); await rest();
    await page.screenshot({ path: path.join(OUT, '04-home.png') });
    const home = await page.evaluate(() => { const b = window.__b;
      const m = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return { t: b.label(el), h: +r.height.toFixed(1), fs: cs.fontSize, fw: cs.fontWeight, px: cs.paddingLeft, bg: cs.backgroundColor, ink: cs.color, bw: cs.borderTopWidth, link: el.classList.contains('ui-link') }; };
      const desk = [...document.querySelectorAll('#hm-desk-rows [data-desk-act]')].filter(b.vis).map(m);
      const dec = [...document.querySelectorAll('.hm-rverb')].filter(b.vis).map(m);
      return { desk, dec, fill: b.bg('--accent-fill'), accent: getComputedStyle(document.body).getPropertyValue('--accent-ink').trim() }; });
    const boxes = home.desk.filter(x => !x.link);
    ok('2-stage a desk row and a decision row are both on Home', !!staged && boxes.length > 0 && home.dec.length > 0,
      `${home.desk.length} desk verbs · ${home.dec.length} decision verbs`);
    const d0 = home.dec[0] || {};
    ok('2a the desk\'s bordered verbs are the decision card\'s size: height, text size, weight and padding',
      boxes.length > 0 && boxes.every(x => Math.abs(x.h - d0.h) <= 0.6 && x.fs === d0.fs && x.fw === d0.fw && x.px === d0.px),
      `desk ${JSON.stringify(boxes.slice(0, 3).map(x => [x.t, x.h, x.fs, x.fw, x.px]))} · decision ${JSON.stringify([d0.t, d0.h, d0.fs, d0.fw, d0.px])}`);
    ok('2b none of the desk\'s verbs is filled — one filled button per area, never one per row',
      home.desk.length > 0 && home.desk.every(x => x.bg !== home.fill), JSON.stringify(home.desk.map(x => x.t + ':' + x.bg)));
    const plain = home.desk.filter(x => x.link);
    ok('2c Put away is the ladder\'s text button: no edge, and no taller than the row\'s own target',
      plain.length > 0 && plain.every(x => x.bw === '0px' && x.h <= 24.6), JSON.stringify(plain.map(x => x.t + ':' + x.h + ':' + x.bw)));

    ok('9 the pages drew without an error', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
