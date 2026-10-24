/* THE BRIEF AND HISTORY, THE SAP WAY (the owner picked both by name, 21 Oct
   2026; artifact YYsKmyj6C1kjgNZ1SH4nv7 — index.html "THE BRIEF" and "HISTORY,
   THE SAP WAY", js/views/contract.js roomHistoryHtml)
   WHAT THIS PINS, measured in a real browser on a contract with a live round:
     1 JAMBO'S PANEL BESIDE A PAPER (the Dossier): 384 wide; the head keeps the
       paper strip's height; the foot 56 with a 40 box; the tabs are words —
       no glyph over them except Jambo's mark, the count after the word; the
       sections are labels over rows: no box, no rule, no shaded band inside
       the body (Still owed's head row takes no room); 16 in from both edges;
       a label is sentence case, 24 above it
     2 REDLINES BESIDE THE PAPER: the piles are labels, not boxes or bands; the
       name in the serif; Notes joins Send all and Ask for review on one line
     3 BESIDE THE LISTS (Negotiations, a row chosen): 384 wide, head and foot
       56; the facts carry their "Facts" label; Needs you is rows, not a card;
       no rule between the sections
     4 HISTORY: one table — Time · Who · Side · What happened · Outcome — every
       entry the trail reads is a row; no lanes, no bubbles, no pills; the side
       and the outcome are each a straight column; the day a row with its
       count; the filters stand in the open (no Filter button), Clear at the
       band's end; the serif title
     5 the owner's three screens: the panel inside the window, nothing sideways,
       History's table whole
   Red at the parent (0392ded7): 19 of 25 (1a, 1c–1g, 2a–2d, 3a–3c, 4a, 4c–4f).
   1b, 4b, the three screens and "no page errors" pass there too: they are the
   CONTROLS, what must not move (the paper strip's line, every entry drawn,
   nothing sideways).
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/the-brief-and-sap-history-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/the-brief-and-sap-history-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

/* every box, rule or band drawn INSIDE a panel's body: a border on a side, a
   fill that is not the page's white, or a shadow — form controls, buttons and
   the ask box excepted (they are controls, not the panel's furniture) */
const BOXES = sel => {
  const root = document.querySelector(sel); if (!root) return null;
  const tr = c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent';
  const out = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('button, input, select, textarea, .jb-card, .ui-btn, .pd-tab, .dp-face, .tag-ini, .reg-av, .ds-spine, .pd-og-done, svg, [hidden]')) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none') continue;
    if (/^(I|SPAN)$/.test(el.tagName) && r.width <= 12 && r.height <= 12) continue;   /* a dot */
    const b = ['Top', 'Right', 'Bottom', 'Left'].some(k => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none' && tr(s['border' + k + 'Color']));
    const bg = tr(s.backgroundColor) && s.backgroundColor !== 'rgb(255, 255, 255)';
    if (b || bg || s.boxShadow !== 'none') out.push(`${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).slice(0, 2).join('.')}${b ? ' edge' : ''}${bg ? ' fill' : ''}`);
  }
  return out;
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* a live round: our ask, their ask */
    const me = await page.evaluate(() => currentUser().name);
    await page.evaluate(async me => { const c = getContract('MK-B2'); if (c._light && window.ensureFull) await ensureFull(c); negoInit(c); const cl = negoClauseList(c);
      await negoEditClause(c, cl[1].clauseId, '<p>The estimated annual contract value is KES 78,000,000, payable within 30 days of receipt, and the Supplier confirms each delivery in writing.</p>', { side: 'owner', author: me, summary: 'Our standard asks for written delivery notes.' });
      await negoEditClause(c, cl[3].clauseId, '<p>Either party may end this on ninety (90) days notice.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Our board needs a way out.' }); }, me);

    /* ================= 1. THE DOSSIER BESIDE A PAPER ================= */
    await page.evaluate(() => regOpenContract('MK-B2'));
    const up = await until(() => !!document.querySelector('#ig-dock .pd-glance .pd-gl-h') && !!document.querySelector('#ig-dock .igd-head .pd-tab'), null, 15000);
    if (!up) check('1 the Dossier beside the paper is drawn', false, 'no #ig-dock .pd-glance');
    else {
      await page.waitForTimeout(500);
      const D = await page.evaluate(() => {
        const d = document.getElementById('ig-dock'), dr = d.getBoundingClientRect();
        const head = d.querySelector('.igd-head'), foot = d.querySelector('.igd-foot, .igd-askbox') && (d.querySelector('.igd-foot') || d.querySelector('.igd-askbox').parentElement);
        const box = d.querySelector('.igd-askbox');
        const strip = document.getElementById('ig-strip');
        const tabs = [...head.querySelectorAll('.pd-tab')].map(t => {
          const g = t.querySelector('.pd-tab-g'), w = t.querySelector('.pd-tab-w'), n = t.querySelector('.pd-tab-n');
          const gs = g && getComputedStyle(g);
          return { glyph: !!g && gs.display !== 'none' && g.getBoundingClientRect().width > 0, mark: !!(g && g.querySelector('svg')),
            nAfter: n && !n.hidden && n.getBoundingClientRect().width > 0 ? n.getBoundingClientRect().left >= w.getBoundingClientRect().right - 1 : null,
            sameLine: g && w && gs.display !== 'none' ? Math.abs((g.getBoundingClientRect().top + g.getBoundingClientRect().bottom) / 2 - (w.getBoundingClientRect().top + w.getBoundingClientRect().bottom) / 2) < 4 : true };
        });
        /* RE-POINTED 23 Oct 2026 (Spine): the sections are the six stage lines down the spine, no section labels */
        const labels = [...d.querySelectorAll('.ds-sp-st')].filter(x => x.getBoundingClientRect().height > 0);
        const lab = labels[0], ls = lab && getComputedStyle(lab), lb = lab && getComputedStyle(lab.querySelector('b') || lab);
        const th = d.querySelector('.pd-og th');
        return { w: Math.round(dr.width), headH: Math.round(head.getBoundingClientRect().height), stripH: strip ? Math.round(strip.getBoundingClientRect().height) : null,
          footH: foot ? Math.round(foot.getBoundingClientRect().height) : null, boxH: box ? Math.round(box.getBoundingClientRect().height) : null,
          /* from the panel's inner edge (its own 1px line is not the gutter) */
          tabs, labels: labels.length, labLeft: lab ? Math.round(lab.getBoundingClientRect().left - dr.left - d.clientLeft) : null,
          labTop: ls ? ls.marginTop : null, labCase: lb ? lb.textTransform : null, labSize: lb ? lb.fontSize : null,
          thH: th ? Math.round(th.getBoundingClientRect().height) : null };
      });
      check('1a the panel is 384 wide (48 x 8)', D.w === 384, D.w);
      check('1b the head beside a paper keeps the paper strip\'s height, so the two lines meet', D.stripH != null && Math.abs(D.headH - D.stripH) <= 1, `head ${D.headH} · strip ${D.stripH}`);
      check('1c the foot is 56 with a 40 ask box', D.footH === 56 && D.boxH === 40, `foot ${D.footH} · box ${D.boxH}`);
      check('1d the tabs are words: no glyph over them but Jambo\'s mark, and a count stands after its word', D.tabs.length >= 3 && D.tabs.every(t => (t.glyph ? t.mark : true) && t.sameLine && t.nAfter !== false) && D.tabs.some(t => t.nAfter === true), JSON.stringify(D.tabs));
      const B = await page.evaluate(BOXES, '#igd-feed');
      /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"; asked about its lines, the owner said "no lines",
         keeping The Brief): no edge, band or shadow anywhere — only a fact's state ring and its amber "Missing" tag */
      const CK_DRAWN = /^(i\.pd-ck-ring[\w.-]* edge( fill)?|span\.pd-ck-pill fill)$/;
      const B2 = Array.isArray(B) ? B.filter(x => !CK_DRAWN.test(x)) : B;
      check('1e nothing is boxed inside the Dossier: no edge, band or shadow on a section, row or table cell', Array.isArray(B2) && B2.length === 0, JSON.stringify(B2 && B2.slice(0, 8)));
      /* RE-POINTED 23 Oct 2026 (owner picked "Marquee"): a section's label is in small capitals, 11px, still 16 in from the edge */
      check('1f the stages are six lines, each 16 in from the edge, named in sentence case', D.labels === 6 && D.labLeft === 16 && D.labCase === 'none', JSON.stringify(D));
      check('1g Still owed\'s head row takes no room (no band over the grid)', D.thH === 0, D.thH);
      if (OUT) await page.screenshot({ path: path.join(OUT, 'brief-dossier-1440x780.png') });
    }

    /* ================= 2. REDLINES BESIDE THE PAPER ================= */
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-B2', 'copilot'); });
    await page.waitForTimeout(600);
    await page.evaluate(() => pdRedOpen('MK-B2'));
    const red = await until(() => !!document.querySelector('#ig-dock .rl-pile'), null, 12000);
    if (!red) check('2 Redlines beside the paper is drawn', false, 'no #ig-dock .rl-pile');
    else {
      await page.waitForTimeout(500);
      const R = await page.evaluate(() => {
        const d = document.getElementById('ig-dock');
        const piles = [...d.querySelectorAll('.rl-pile')].map(p => { const s = getComputedStyle(p), b = p.querySelector('.rl-band'), bs = b && getComputedStyle(b);
          return { edge: s.borderTopWidth, bandBg: bs && bs.backgroundColor, bandEdge: bs && bs.borderBottomWidth }; });
        const t = d.querySelector('.rl-idx-title'), notes = d.querySelector('.rl-head-notes'), review = d.querySelector('.rl-head-review'), send = d.querySelector('.rl-unsent-go');
        const mid = el => el ? Math.round((el.getBoundingClientRect().top + el.getBoundingClientRect().bottom) / 2) : null;
        return { piles, face: t && getComputedStyle(t).fontFamily, notesY: mid(notes), reviewY: mid(review), sendY: mid(send),
          notesAfter: notes && review ? notes.getBoundingClientRect().left > review.getBoundingClientRect().right : null };
      });
      check('2a the piles are labels over their rows: no box round a pile, no shaded band', R.piles.length > 0 && R.piles.every(p => p.edge === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(p.bandBg) && p.bandEdge === '0px'), JSON.stringify(R.piles));
      check('2b the face\'s name is the serif', /Source Serif 4/.test(R.face || ''), R.face);
      check('2c Notes stands after Ask for review, on Send all\'s line', R.notesY != null && R.reviewY != null && Math.abs(R.notesY - R.reviewY) <= 2 && R.notesAfter === true, JSON.stringify(R));
      /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK, stage 2, the owner's pick "Boxes, as drawn"): each change is
         its own soft grey card — a FILL, never an edge or a lift; nothing else among the piles is boxed */
      const B0 = await page.evaluate(BOXES, '#ig-dock #rl-changes');
      const B = Array.isArray(B0) ? B0.filter(x => !/^article\.rl-card\.rl-card-d fill$/.test(x)) : B0;
      check('2d nothing is boxed among the piles but each change\'s own soft card (a fill, no edge, no lift)', Array.isArray(B) && B.length === 0, JSON.stringify(B && B.slice(0, 8)));
      if (OUT) await page.screenshot({ path: path.join(OUT, 'brief-redlines-1440x780.png') });
    }

    /* ================= 3. BESIDE THE LISTS ================= */
    await page.evaluate(() => openNegotiations());
    await until(() => !!document.querySelector('#content .ins-panel.is-jambo .jl-head') && !!document.querySelector('#content tr[data-row]'), null, 12000);
    await page.evaluate(() => { const r = document.querySelector('#content tr[data-row]'); if (r) r.click(); });
    const facts = await until(() => !!document.querySelector('#content .ins-panel.is-jambo .ins-facts'), null, 8000);
    if (!facts) check('3 Jambo\'s panel beside Negotiations shows a chosen row', false, 'no .ins-facts');
    else {
      await page.waitForTimeout(400);
      const L = await page.evaluate(() => {
        const p = document.querySelector('#content .ins-panel.is-jambo'), pr = p.getBoundingClientRect();
        const head = p.querySelector('.jl-head'), foot = p.querySelector('.jl-foot'), f = p.querySelector('.ins-facts');
        const secs = [...p.querySelectorAll('.ins-h, .ins-facts, .ins-sec')].map(x => getComputedStyle(x).borderBottomWidth);
        const need = p.querySelector('.jl-need');
        return { w: Math.round(pr.width), headH: Math.round(head.getBoundingClientRect().height), footH: Math.round(foot.getBoundingClientRect().height),
          label: getComputedStyle(f, '::before').content, secs, needEdge: need ? getComputedStyle(need).borderTopWidth : null };
      });
      check('3a the panel beside the lists is 384 wide, its head and foot 56', L.w === 384 && L.headH === 56 && L.footH === 56, JSON.stringify(L));
      check('3b the facts carry their label, "Facts"', /Facts/.test(L.label || ''), L.label);
      check('3c no rule between the sections; Needs you is rows, not a card', L.secs.every(b => b === '0px') && (L.needEdge == null || L.needEdge === '0px'), JSON.stringify(L));
      if (OUT) await page.screenshot({ path: path.join(OUT, 'brief-negotiations-1440x780.png') });
    }

    /* ================= 4. HISTORY, THE SAP WAY ================= */
    await page.evaluate(() => roomOpenAt('MK-B2', 'history'));
    const hist = await until(() => !!document.querySelector('.hist-trail .hist-ev'), null, 12000);
    if (!hist) check('4 History is drawn', false, 'no .hist-trail .hist-ev');
    else {
      await page.waitForTimeout(400);
      const T = await page.evaluate(() => {
        const t = document.querySelector('.hist-trail'), host = t.closest('[data-bs-host], #ws-history-pane') || t.parentElement;
        const rows = [...t.querySelectorAll('.hist-ev')];
        const heads = [...t.querySelectorAll('.hist-th > *')].map(x => x.textContent.trim());
        const left = sel => rows.map(r => r.querySelector(sel)).filter(Boolean).map(x => Math.round(x.getBoundingClientRect().left));
        const day = t.querySelector('.hist-day-h'), title = host.querySelector('.hist-title, .hist-head h6');
        return { cls: t.className, rows: rows.length, all: roomHistoryEvents(getContract('MK-B2'), {}).length, heads,
          bubbles: t.querySelectorAll('.hist-bub, .hist-pill, .hist-lh, .hist-inside').length,
          sideX: left('.hist-c-side'), ocX: left('.hist-c-oc'),
          sides: rows.map(r => (r.querySelector('.hist-c-side') || {}).textContent || '').map(x => x.trim()),
          day: day ? day.textContent.replace(/\s+/g, ' ').trim() : null,
          filterBtn: !!host.querySelector('#hist-filter-btn'), filters: [...host.querySelectorAll('[data-ht-filter]')].filter(s => s.getBoundingClientRect().width > 0).length,
          clear: !!host.querySelector('#ht-clear'), face: title ? getComputedStyle(title).fontFamily : null };
      });
      check('4a History is one table: Time · Who · Side · What happened · Outcome', /is-table/.test(T.cls) && T.heads.join('|') === 'Time|Who|Side|What happened|Outcome', JSON.stringify(T.heads));
      check('4b every entry the trail reads is a row of it', T.rows === T.all && T.rows >= 3, `${T.rows} of ${T.all}`);
      check('4c no lanes, no bubbles, no pills', T.bubbles === 0 && !/is-lanes/.test(T.cls), T.bubbles);
      check('4d the side and the outcome each stand in one straight column; the side is said in words', T.sideX.length === T.rows && new Set(T.sideX).size === 1 && T.ocX.length === T.rows && new Set(T.ocX).size === 1 && T.sides.includes('Ours') && T.sides.includes('Theirs'), JSON.stringify({ s: T.sideX, o: T.ocX, w: T.sides }));
      check('4e the day is a row with its count', !!T.day && /\d+ events?/.test(T.day), T.day);
      check('4f the filters stand in the open: no Filter button, the boxes shown, Clear at the band\'s end; the title is the serif', !T.filterBtn && T.filters >= 3 && T.clear && /Source Serif 4/.test(T.face || ''), JSON.stringify(T));
      if (OUT) await page.screenshot({ path: path.join(OUT, 'sap-history-1440x780.png') });

      /* ================= 5. THE OWNER'S THREE SCREENS ================= */
      for (const [w, ht] of SCREENS) {
        await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(500);
        const F = await page.evaluate(() => {
          const d = document.getElementById('ig-dock'), t = document.querySelector('.hist-trail');
          const dr = d && d.getBoundingClientRect(), tr = t && t.getBoundingClientRect();
          return { side: document.documentElement.scrollWidth - innerWidth, dock: dr ? dr.right <= innerWidth + 1 && dr.left >= 0 : null,
            table: tr ? tr.right <= (dr ? dr.left : innerWidth) + 1 : null, wrap: t ? t.scrollWidth - t.clientWidth : null };
        });
        check(`5 ${w}×${ht}: the panel inside the window, History's table whole beside it, nothing sideways`, F.side <= 0 && F.dock !== false && F.table !== false && (F.wrap == null || F.wrap <= 0), JSON.stringify(F));
        if (OUT) await page.screenshot({ path: path.join(OUT, `sap-history-${w}x${ht}.png`) });
      }
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close();
    await h.stop?.();
  }
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})();
