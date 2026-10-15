/* Chromium verification: THE COMPACT BUTTON LADDER (Young picked "Compact" on
   26 Sep 2026, off the "HaTi Button Audit" page: "Implement compact and merge
   to main").
   ====================================================================
   Three heights — 22 in rows and cards, 28 everywhere else, 32 for an area's
   one big act — with text boxes at 28, ONE label weight, text buttons in one
   look, drawn icons only, and a dialog's buttons kept in view while its body
   scrolls. The node file f385 pins what the stylesheet SAYS; this one measures
   what a reader SEES, on the real pages, because a rule can read right and
   lose a cascade fight on the screen.

   WHY A BROWSER FILE. Every claim here is a painted geometry or a computed
   style: a height, a weight, whether a button 0.5px outside its drawn box
   still takes the press, whether a dialog's Save is inside the panel when the
   window is short, where the contract's first line lands.

   REFUSAL 3 — THE CONTRACT'S PIXELS. The first line of the agreement is
   measured on the Document tab, the Negotiate page and the Signing tab and
   compared with the parent's own measurement ON THIS VERY STAGE (PARENT_INK
   below, read by running this file against dd84c62). Chrome may not grow; the
   paper may gain.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the ladder REPORTS its failures rather than passing on an empty
   page. Controls pass on both sides by design and are named. At the parent
   21 of 29 fail: it prints 30px everywhere, a 48px Sign at weight 600, the
   Negotiate row's verbs at 24/600, 34-36px boxes in the New agreement pop-up,
   an 18px Cancel, and "Run →" typed on every checks row.

   Run: node test/chromium/compact-ladder-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'compact-ladder');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* The first line of the agreement at the parent (dd84c62), on this stage, at
   1440 × 900 — MEASURED by running this very file there (26 Sep 2026), not
   typed from memory. Refusal 3 is "no growth", so each is a CEILING. On the
   branch all three read the same to the tenth of a pixel: the rows above the
   paper keep their own heights, so shorter buttons inside them move nothing. */
/* RE-MEASURED 6 Oct 2026 (Clean Sans, Young picked it): the Negotiate
   paper's title is set in Geist now, whose glyphs sit 1px lower inside the
   SAME line box. Measured against main on this stage: the title (H3
   .rl-paper-title) is at top 284.7, height 29.8 on both sides — nothing
   moved down; only the ink of a different face. 286.7 at main → 287.7. */
/* MOVED BY THE OWNER, 8 Oct 2026 ("the background also needs to be exactly
   like the home page redlined version. No differences at all"): the Document
   tab and the Negotiate page take Home Redlined's 29px above the sheet and its
   34px top margin, so their first line sits lower by that gap and no more
   (271.9 → 297.0, 287.7 → 317.8, measured on this stage). The Signing tab was
   not asked and keeps its line. */
const PARENT_INK = { nego: 317.8, sign: 301.9 };   /* docs: 297.0 retired 11 Oct 2026: the Document tab is gone (owner) */

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;

/* One reading of the page, installed once per load. */
const HELPERS = `(() => {
  const vis = el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!(r.width > 0 && r.height > 0) || cs.visibility === 'hidden' || cs.display === 'none') return false;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p); if (s.opacity === '0' || s.visibility === 'hidden') return false; }
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const box = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return { t: (el.innerText || el.getAttribute('aria-label') || el.title || '').replace(/\\s+/g, ' ').trim().slice(0, 30),
      h: +r.height.toFixed(1), w: +r.width.toFixed(1), x: +r.left.toFixed(1), y: +r.top.toFixed(1),
      fw: cs.fontWeight, fs: cs.fontSize, td: cs.textDecorationLine, color: cs.color,
      svg: !!el.querySelector('svg'), primary: el.classList.contains('ui-btn-primary') }; };
  const tok = v => { const e = document.createElement('i'); e.style.color = 'var(' + v + ')';
    document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
  const ink = sel => { const root = document.querySelector(sel); if (!root) return null;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n =>
      (/\\S/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('[data-pg-layer]'))) ? 1 : 3 });
    let n; while ((n = w.nextNode())) { const r = document.createRange(); r.selectNodeContents(n);
      const b = r.getBoundingClientRect(); if (b.height > 0 && b.width > 0) return +b.top.toFixed(1); }
    return null; };
  /* A typed arrow, caret, cross, tick, star or emoji standing in for an icon
     in a button's own words. */
  const GLYPH = /[➤✉📄👤→←↗↻▾▸▼►✕✓✔✗✖★]/u;
  const glyphs = () => [...document.querySelectorAll('button, a.ui-btn, [role=button]')].filter(vis)
    .filter(b => !b.closest('#side-nav') && GLYPH.test(b.innerText || ''))
    .map(b => (b.id || b.className || b.tagName).toString().slice(0, 30) + ': ' + (b.innerText || '').trim().slice(0, 24));
  window.__m = { vis, box, tok, ink, glyphs };
})()`;

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    /* THE STAGE: a new workspace with the sample portfolio, which is what
       carries a live negotiation, a draft, the checks card and the signing
       column all at once. */
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
    const load = () => page.evaluate(HELPERS);
    await load();
    const ids = await page.evaluate(() => {
      const cs = state.contracts;
      const rev = cs.find(c => c.status === 'Under Review' && c.negotiation && (c.changes || []).length)
        || cs.find(c => c.status === 'Under Review');
      return { rev: rev && rev.id };
    });
    ok('0-stage a contract under review to measure on', !!ids.rev, ids.rev || 'none');
    /* A LIVE ASK OF THEIRS, filed through the funnel, so the Negotiate page
       draws a redline row with its verbs. Staged BEFORE anything is measured,
       so the parent's run of this file stands on the very same page. */
    const staged = await page.evaluate(async id => {
      const c = getContract(id); if (!c) return 0;
      negoInit(c);
      await negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'forty-five (45) days', why: 'Staged for the ladder.' });
      return (c.changes || []).length;
    }, ids.rev);
    ok('0-stage and a live ask of theirs is on it', staged > 0, staged + ' change(s)');
    const glyphHits = [];
    const sweep = async where => { const g = await page.evaluate(() => window.__m.glyphs()); g.forEach(x => glyphHits.push(where + ' · ' + x)); };

    /* ════════ 1. THE CONTRACTS PAGE ════════ */
    /* THE FULL TABLE IS STAGED (re-pointed in place 26 Sep 2026): from about
       a 1104 window the page draws the list Inspector, whose rows carry no
       menu — it moved into the panel beside them, an ordinary icon button —
       and inspector-verify measures that shape. 1c/1d are about the ROW's
       menu, which the full table still draws at every narrower window;
       insForce(false) is the page's own stage door onto it, in memory, and
       is handed back after this section. */
    await page.evaluate(() => { if (window.insForce) insForce(false); });
    await page.evaluate(() => { try { regSetScope(null); } catch (e) {} (regPlaceSet({ show: 'list' }), setView('register')); });
    await page.waitForFunction(() => [...document.querySelectorAll('.reg-row-more')].some(b => b.getBoundingClientRect().height > 0)
      && !!document.querySelector('#page-head button, .ct-head .reg-seg'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });
    const c1 = await page.evaluate(() => {
      const m = window.__m;
      /* RE-POINTED 15 Oct 2026 (step 7): the Contracts head is the place's
         own head on Home — its controls are the Wall | List switch (measured
         whole, as the bar measures a switch) and Adapt filters; "+ Draft new
         agreement" left the head in step 3. */
      const head = [...document.querySelectorAll('#page-head button, .page-head button, .ct-head .reg-seg, .ct-head button.reg-chip')].filter(m.vis).map(m.box);
      /* RE-POINTED 9 Oct 2026 (SAP benchmark): a band filter is a label over a
         BOX — the box is the control, so the box is what sits on the rung. */
      /* RE-POINTED 10 Oct 2026 — follows "filters BESIDE the tabs, label
         inside the box" (owner, 10 Oct 2026, `.reg-tabbar`; reverses 9 Oct's
         own row there): in the tab bar the CHIP is the box (label and value
         on one line inside it), so the chip is what sits on the rung there;
         elsewhere a band filter is still a label over its `.reg-f-v` box. */
      const bar = [...document.querySelectorAll('.reg-chip, .reg-seg')].filter(m.vis)
        .map(e => { const v = e.querySelector('.reg-f-v');
          if (e.closest('.reg-tabbar')) return m.box(e);
          return v && m.vis(v) ? Object.assign(m.box(v), { t: m.box(e).t }) : m.box(e); });
      const more = [...document.querySelectorAll('.reg-row-more')].find(m.vis);
      let edge = null;
      if (more) { const r = more.getBoundingClientRect(), x = r.left + r.width / 2;
        const a = document.elementFromPoint(x, r.top - 0.5), b = document.elementFromPoint(x, r.bottom + 0.5);
        edge = { h: +r.height.toFixed(1), w: +r.width.toFixed(1), above: !!(a && more.contains(a)), below: !!(b && more.contains(b)) }; }
      return { head, bar, edge };
    });
    ok('1a the page head\'s buttons are the everyday rung (28)',
      c1.head.length > 0 && c1.head.every(b => near(b.h, 28)), JSON.stringify(c1.head.map(b => b.t + ':' + b.h)));
    ok('1b the filter bar\'s chips and switches are the same height as the buttons',
      c1.bar.length > 0 && c1.bar.every(b => near(b.h, 28)), JSON.stringify(c1.bar.map(b => b.t.slice(0, 12) + ':' + b.h)));
    ok('1c a row\'s menu is the row rung, a square (22 × 22)',
      !!c1.edge && near(c1.edge.h, 22) && near(c1.edge.w, 22), JSON.stringify(c1.edge));
    ok('1d and a press half a pixel outside its drawn box still reaches it (a 24px target)',
      !!c1.edge && c1.edge.above && c1.edge.below, JSON.stringify(c1.edge));
    await sweep('contracts');
    await page.evaluate(() => { if (window.insForce) insForce(null); });

    /* ════════ 2. THE CONTRACT ROOM'S HEAD (Overview) ════════ */
    await page.evaluate(id => openWorkspace(id), ids.rev);
    await page.waitForTimeout(1500);
    await load();
    await page.screenshot({ path: path.join(OUT, '02-room-overview.png') });
    const c2 = await page.evaluate(() => {
      const m = window.__m;
      const acts = [...document.querySelectorAll('#ws-head .room-acts button')].filter(m.vis).map(el => ({ ...m.box(el), sq: el.classList.contains('room-check') || el.classList.contains('ui-btn-icon') }));
      return { acts };
    });
    ok('2a every button in the room\'s head is the everyday rung (28)',
      c2.acts.length >= 3 && c2.acts.every(b => near(b.h, 28)), JSON.stringify(c2.acts.map(b => (b.t || 'icon') + ':' + b.h)));
    /* A CONTROL here — the room's own head already read 500 at the parent;
       the same Share on the Negotiate page read 400, and 5b is that measure. */
    /* RE-POINTED 7 Oct 2026 (Young's type formula, off the HaTi Platform mockup): a button's word is 600 — still ONE weight for every button. */
    ok('2b CONTROL every word in that row is one weight (600) — the filled face says which leads, never the weight',
      c2.acts.filter(b => b.t && !b.sq).every(b => b.fw === '600'), JSON.stringify(c2.acts.filter(b => b.t && !b.sq).map(b => b.t + ':' + b.fw)));
    await sweep('room');

    /* ════════ 3. THE OVERVIEW'S TAB ROW, AND HOME'S DOCUMENT ════════
       RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner). Its
       tab-row door onto Negotiate stands on the Overview's row; its paper,
       zoom and Thread live on Home's Document face (the Thread on the side
       panel's Clauses tab). The Focus door (3e) and the Document tab's own
       first-line measure (3d) are RETIRED with the tab: the room draws no
       Focus door now, and the parent's number was the tab's. */
    await page.evaluate(id => roomGoTab(getContract(id), 'terms'), ids.rev);
    await page.waitForFunction(() => !!document.querySelector('#ws-tabrow-end #ws-to-nego'), null, { timeout: 8000 }).catch(() => {});
    await load();
    const c3row = await page.evaluate(() => {
      const m = window.__m;
      return [...document.querySelectorAll('#ws-tabrow-end .ui-btn')].filter(m.vis).map(m.box);
    });
    await page.evaluate(id => pdOpenOnHome(id, 'doc'), ids.rev);
    await page.waitForFunction(() => {
      const r = document.querySelector('#pd-thread .doc-th-row.is-open');
      return !!r && r.getBoundingClientRect().height > 0 && !!document.querySelector('#ig-paper-scroll .paper-zc .rl-type-step');
    }, null, { timeout: 15000 }).catch(() => {});
    await load();
    await page.screenshot({ path: path.join(OUT, '03-document.png') });
    const c3 = await page.evaluate(() => {
      const m = window.__m;
      const zoom = [...document.querySelectorAll('#ig-paper-scroll .paper-zc .rl-type-step')].filter(m.vis).map(m.box);
      /* RE-POINTED 5 Oct 2026 (the Thread): the switch and the Checks card
         are gone; the Thread's ‹ › are the small rung's squares. */
      const segs = [...document.querySelectorAll('#pd-thread .doc-th-row.is-open .doc-th-step')].filter(m.vis).map(m.box);
      return { zoom, segs };
    });
    const slot = c3row.concat(c3.zoom);
    ok('3a the Overview\'s tab-row door and the Document\'s zoom are one height (28)',
      c3row.length >= 1 && c3.zoom.length >= 1 && slot.every(b => near(b.h, 28)), JSON.stringify(slot.map(b => b.t.slice(0, 14) + ':' + b.h)));
    /* RE-POINTED 13 Oct 2026 (Stakes as drawn, owner: "This is how the
       panel should look like"): Home's open row carries no ‹ › steppers -
       the deep dive walks the points instead. Asserted as absent. */
    ok('3b Home\'s open row draws no ‹ › steppers (Stakes as drawn)',
      c3.segs.length === 0, JSON.stringify(c3.segs.map(b => b.w + '×' + b.h)));
    /* 3c "the Thread's text buttons (Explain all, Run) are the text button"
       RETIRED 11 Oct 2026: the Document tab is gone (owner), and the Thread's
       Run lines were that tab's alone - on Home they would press the room
       head's door, which Home does not carry (docThreadUnrunHtml answers ''
       there). What is left on the open row is Plain, an ordinary button: it
       stands on the everyday rung at the one weight. */
    const plainBtn = await page.evaluate(() => { const m = window.__m;
      return [...document.querySelectorAll('#pd-thread .doc-th-row.is-open [data-th-explain]')].filter(m.vis).map(m.box); });
    ok('3c the open row\'s Plain is the everyday rung (28) at the one weight (600)',
      plainBtn.length > 0 && plainBtn.every(b => near(b.h, 28) && b.fw === '600'),
      JSON.stringify(plainBtn.map(b => b.t + ':' + b.h + '/' + b.fw)));
    await sweep('document');

    /* ════════ 4. THE SIGNING TAB ════════ */
    await page.evaluate(id => openWorkspace(id), ids.rev);   /* back from Home (section 3) */
    await page.waitForFunction(() => !!document.querySelector('#ws-tabs [data-ws-tab="sign"]'), null, { timeout: 8000 }).catch(() => {});
    await page.evaluate(id => roomGoTab(getContract(id), 'sign'), ids.rev);
    await page.waitForTimeout(1500);
    await load();
    const c4 = await page.evaluate(() => {
      const m = window.__m; const b = document.getElementById('sign-btn');
      if (b) b.scrollIntoView({ block: 'center' });
      return { sign: b ? m.box(b) : null, ink: m.ink('#doc-canvas') ?? m.ink('.doc-surface') };
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '04-signing.png') });
    ok('4a the Sign button is the one large act (32)', !!c4.sign && near(c4.sign.h, 32), JSON.stringify(c4.sign));
    ok('4b and it reads at the same weight as every other button', !!c4.sign && c4.sign.fw === '600', c4.sign && c4.sign.fw);
    await sweep('signing');

    /* ════════ 5. THE NEGOTIATE PAGE ════════ */
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): every door now
       lands on Jambo's Redlines face beside Home's paper, which draws no head
       control row, no seat switch and no room head; this section measures the
       Negotiate PAGE's own furniture, so it opens the page by name
       ({ page: true }), the engine the face is built from. */
    await page.evaluate(id => openRedlineWorkbench(id, { page: true }), ids.rev);
    await page.waitForTimeout(2000);
    await load();
    await page.screenshot({ path: path.join(OUT, '05-negotiate.png') });
    const c5 = await page.evaluate(() => {
      const m = window.__m;
      /* Deal board is a TAB since 7 Oct 2026 (it stands the row's height beside Redlined), so it left this list of controls */
      const row = [...document.querySelectorAll('.redline-page .rl-head .rl-segwrap:not(.rl-readwrap), .redline-page .rl-head .rl-type-step, .redline-page .rl-head .rl-livelist')].filter(m.vis).map(m.box);
      const seat = [...document.querySelectorAll('.redline-page .rl-head .rl-segwrap:not(.rl-readwrap) .rl-seg')].filter(m.vis)
        .map(b => ({ t: b.innerText.trim(), on: b.classList.contains('on'), fw: getComputedStyle(b).fontWeight }));
      const verbs = [...document.querySelectorAll('.redline-page .rl-card-d .rl-card-face button')].filter(m.vis).map(m.box);
      const checks = [...document.querySelectorAll('#ws-head .room-check')].filter(m.vis).map(m.box);
      return { row, seat, verbs, checks, ink: m.ink('.rl-paper') ?? m.ink('#rl-doc') };
    });
    ok('5a the negotiate control row is one height (28)',
      c5.row.length >= 2 && c5.row.every(b => near(b.h, 28)), JSON.stringify(c5.row.map(b => b.t.slice(0, 14) + ':' + b.h)));
    ok('5b the seat switch\'s resting half reads at the label weight, the lit half bolder',
      c5.seat.length === 2 && c5.seat.filter(s => !s.on).every(s => s.fw === '500') && c5.seat.filter(s => s.on).every(s => Number(s.fw) >= 600),
      JSON.stringify(c5.seat));
    ok('5c a redline row\'s verbs are the row rung (22), one weight',
      c5.verbs.length > 0 && c5.verbs.every(b => near(b.h, 22) && b.fw === '500'), JSON.stringify(c5.verbs.slice(0, 6).map(b => b.t + ':' + b.h + '/' + b.fw)));
    /* RE-POINTED 13 Oct 2026: the Focus door left the row (owner), so the row is
       measured on its doors (Open workspace, Open document) and the seat switch;
       the Obligations and Risk scan squares are gone, the Notes square stays */
    ok('5e the one check symbol left (Notes) is a square of the head row\'s rung',
      c5.checks.length === 1 && c5.checks.every(b => near(b.w, 28) && near(b.h, 28)), JSON.stringify(c5.checks.map(b => b.w + '×' + b.h)));
    ok('5d REFUSAL 3: the contract\'s first line on the Negotiate page did not move down',
      c5.ink != null && (PARENT_INK.nego == null || c5.ink <= PARENT_INK.nego + 0.5),
      `first ink ${c5.ink} · parent ${PARENT_INK.nego}`);
    await sweep('negotiate');
    ok('4c REFUSAL 3: the contract\'s first line on the Signing tab did not move down',
      c4.ink != null && (PARENT_INK.sign == null || c4.ink <= PARENT_INK.sign + 0.5),
      `first ink ${c4.ink} · parent ${PARENT_INK.sign}`);

    /* ════════ 6. A DIALOG IN A SHORT WINDOW ════════
       The obligation form is long enough to scroll at 460px and short enough
       not to at 900 — the one dialog that shows both halves of the rule. */
    await page.evaluate(id => openWorkspace(id), ids.rev);
    await page.waitForTimeout(1200);
    await page.setViewportSize({ width: 1280, height: 460 });
    await page.evaluate(id => openObligationForm(getContract(id)), ids.rev);
    await page.waitForTimeout(900);
    await load();
    await page.screenshot({ path: path.join(OUT, '06-dialog-short.png') });
    const foot = () => page.evaluate(() => {
      const m = window.__m, panel = document.querySelector('#modal-root [role=dialog]');
      if (!panel) return null;
      const f = [...panel.querySelectorAll('.dlg-foot,[data-dlg-foot]')].find(x => x.getClientRects().length);
      const pr = panel.getBoundingClientRect();
      const btns = f ? [...f.querySelectorAll('button')].filter(m.vis).map(m.box) : [];
      return { scrolls: panel.hasAttribute('data-scrolls'), found: !!f, hair: f ? getComputedStyle(f).boxShadow : '',
        inView: btns.length > 0 && btns.every(b => b.y >= pr.top - 0.5 && b.y + b.h <= pr.bottom + 0.5),
        order: btns.map(b => b.t + (b.primary ? '*' : '')), xs: btns.map(b => b.x), hs: btns.map(b => b.h) };
    });
    const d1 = await foot();
    ok('6a in a short window the dialog scrolls, and its foot is found and pinned', !!d1 && d1.scrolls && d1.found, JSON.stringify(d1));
    ok('6b its buttons are inside the panel without scrolling', !!d1 && d1.inView, JSON.stringify(d1 && d1.order));
    /* REVERSED 10 Oct 2026 (SAP pop-ups, owner's go): the act first and
       filled, Cancel LAST — SAP's order, and the same in the DOM. */
    ok('6c the main act first and filled, Cancel last, one height',
      !!d1 && d1.order.length >= 2 && /\*$/.test(d1.order[0]) && /^Cancel$/.test(d1.order[d1.order.length - 1]) && d1.xs[0] < d1.xs[d1.xs.length - 1] && d1.hs.every(x => near(x, 28)),
      JSON.stringify(d1 && { order: d1.order, hs: d1.hs }));
    await page.evaluate(() => closeModal());
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.evaluate(id => openObligationForm(getContract(id)), ids.rev);
    await page.waitForTimeout(900);
    await load();
    const d2 = await foot();
    ok('6d CONTROL in a tall window the same dialog does not scroll, and draws no hairline over its foot',
      !!d2 && !d2.scrolls && (d2.hair === 'none' || d2.hair === ''), JSON.stringify(d2 && { scrolls: d2.scrolls, hair: d2.hair }));
    await page.evaluate(() => closeModal());

    /* ════════ 7. THE NEW AGREEMENT POP-UP ════════ */
    await page.evaluate(() => openNewAgreement({ door: true }));
    await page.waitForTimeout(1400);
    await load();
    await page.screenshot({ path: path.join(OUT, '07-new-agreement.png') });
    const c7 = await page.evaluate(() => {
      const m = window.__m, root = document.getElementById('modal-root');
      const fields = [...root.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]), select')].filter(m.vis).map(m.box);
      /* A PAGE NOW (SAP pop-ups, 10 Oct 2026): the acts stand in its head. */
      const foot = [...root.querySelectorAll(root.querySelector('.dlg-pg-acts') ? '.dlg-pg-acts button' : '.na-foot button, [data-dlg-foot] button, .dlg-foot button')].filter(m.vis).map(m.box);
      return { fields, foot };
    });
    ok('7a every one-line box in the pop-up is the everyday height (28)',
      c7.fields.length > 0 && c7.fields.every(b => near(b.h, 28)), JSON.stringify(c7.fields.map(b => b.h)));
    ok('7b its acts are the main act first … Cancel last, one height',
      c7.foot.length >= 2 && c7.foot[0].primary && /^Cancel$/.test(c7.foot[c7.foot.length - 1].t) && c7.foot.every(b => near(b.h, 28)),
      JSON.stringify(c7.foot.map(b => b.t + (b.primary ? '*' : '') + ':' + b.h)));
    await sweep('new-agreement');
    await page.evaluate(() => closeModal());

    /* ════════ 8. DRAWN ICONS ONLY ════════ */
    ok('8a no button on any page visited draws a typed glyph where an icon belongs', glyphHits.length === 0,
      glyphHits.join(' | ') || 'none');

    /* ════════ 9. NOTHING THREW ════════ */
    ok('9a no page errors on the way', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
