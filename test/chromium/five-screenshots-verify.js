/* Chromium verification: FIVE OFF FOUR SCREENSHOTS (Young, 19 Sep 2026).
   =====================================================================
   All five are PAINT, which is why this file exists beside f337:

     · "make the highlighted KPIs to be KPI cards" — whether four figures read
       as cards is a question about boxes, borders and edges on a screen;
     · "delete this card" — the only proof is that it is not painted;
     · "shading should fill the whole shaded button" — the fault was 1px of
       page showing along the top, bottom and corners of the lit half. A
       stylesheet read cannot see it; two measured rects can;
     · "focus mode button in the editor page is not working" — it DREW, it was
       hit-testable, it was wired on the OTHER page. Only a real press on THIS
       page shows it, which is exactly the hole yesterday's 11c left: it drove
       the contract room, where the button has always worked;
     · obligations in amber — a bar drawn by an inset box-shadow is invisible
       in the markup either way. REVERSED the same evening: the bar is not
       what was asked for, the WORDS are (duty-marks-verify). What 5b–5f ask
       now is that a promise puts no bar on a clause.

   MEASURED AT THE PARENT (ae0c041): 17 of 29 RED, and each reproduces the
   report in the owner's own words —
     · not one .igf-kpi drawn;
     · "Biggest by contracted value" painted, 1 of it;
     · the lit half measured a 3px gap top AND bottom inside the box, a 2px
       radius inside a square corner, and the box `overflow:visible`;
     · the negotiate page's Focus button was hit-testable and pressing it left
       the head standing at 146px — page false, body false;
     · 5b–5f were the obligations bar and are REVERSED in place, so they pass
       at the parent for the wrong reason and pass here for the right one —
       they are named controls now, not claims about this change.
   The twelve that pass are CONTROLS: that the friction brief draws off a real
   negotiation, that the Portfolio tab and its counterparty door are there,
   that the Contract-View switch this one is matched TO already fills its box,
   that the room's own Focus button was never broken, that the real document
   builder yields clauses and the edition paints, and that no page error fires.

   Run: node test/chromium/five-screenshots-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'five');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* EVERY DRIVEN HALF IS GUARDED, so a build WITHOUT the feature REPORTS its
   failures rather than throwing on the third check and proving nothing about
   the seventeen after it. This file is run against the parent before it is
   trusted. */
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2600);

    /* ═══════════ 1 · THE FRICTION FIGURES ARE KPI CARDS ═══════════
       THE STAGE IS BUILT FIRST, because the seeded book has no negotiations at
       all and the friction page then draws its empty state — measured, `deals`
       came back 0 and not one figure resolved, so every claim under it would
       have passed on a page with nothing on it. Real changes are filed through
       the real funnel and decided through the real act, so the four readings
       are counted from the record exactly as they are in the product. */
    const seeded = await drive(page, async () => {
      const live = (state.contracts || []).filter(c => c.status !== 'Declined').slice(0, 3);
      let n = 0;
      for (const c of live){
        let cls = [];
        try { cls = negoClauseList(c); } catch (_) { continue; }
        if (!cls.length) continue;
        for (const [k, side] of [[0, 'owner'], [1, 'counterparty']]){
          const cl = cls[k]; if (!cl) continue;
          const body = (cl.bodyHtml || '<p></p>') + '<p>Amended for the test stage.</p>';
          try {
            await negoFileChange(c, { clauseId: cl.clauseId, changeType: 'modify',
              oldText: cl.text, newText: (cl.text || '') + ' Amended for the test stage.',
              bodyHtml: body, clauseLabel: negoClauseLabel(cl) },
              { author: side === 'owner' ? 'Amina Otieno' : 'Their Counsel', side });
            n++;
          } catch (_) {}
        }
        const chs = (c.changes || []).slice();
        try { if (chs[0]) await negoResolve(c, chs[0].id, 'accepted'); } catch (_) {}
        try { if (chs[1]) await negoResolve(c, chs[1].id, 'rejected'); } catch (_) {}
      }
      return { filed: n, deals: (typeof intelFrictionStats === 'function')
        ? intelFrictionStats(null).deals : -1 };
    }, undefined, { filed: 0, deals: -1 });
    await pause(1200);
    await drive(page, () => { setView('intel'); }, undefined, null);
    await pause(700);
    await drive(page, () => { intelGoTab('friction'); }, undefined, null);
    await pause(1600);

    const fr = await drive(page, () => {
      const host = document.getElementById('ig-friction');
      const cards = Array.from(document.querySelectorAll('.igf-kpi'));
      const box = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y),
          bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopColor,
          side: cs.borderLeftWidth, radius: cs.borderTopLeftRadius,
          tag: el.tagName, label: (el.querySelector('.igf-kpi-t') || {}).textContent,
          n: (el.querySelector('.igf-kpi-n') || {}).textContent };
      };
      return { drawn: !!host && host.getBoundingClientRect().height > 0,
        n: cards.length, cards: cards.map(box),
        grid: cards.length ? getComputedStyle(cards[0].parentElement).display : null };
    }, undefined, { drawn: false, n: 0, cards: [], grid: null });

    check('1a CONTROL — the friction brief draws off a real negotiation',
      fr.drawn === true && seeded.deals > 0, `${seeded.deals} deals, ${seeded.filed} changes filed`);
    /* EVERY FIGURE THE PAGE HAS IS A CARD — the page's own rule is that an
       absent reading draws nothing, so the count is what the book supports and
       is reported rather than assumed. */
    check('1b every figure the page has is drawn as a card', fr.n >= 2, `${fr.n} cards`);
    /* A CARD IS A BOX WITH AN EDGE. At the parent these were bare divs in a
       2-column grid — no background, no border, no corner. */
    const boxed = (fr.cards || []).filter(c =>
      /rgb\(255, 255, 255\)/.test(c.bg) && parseFloat(c.side) >= 1 && parseFloat(c.radius) >= 1);
    check('1c every one is a real box — white, edged, cornered', boxed.length === fr.n && fr.n > 0,
      `${boxed.length} of ${fr.n}`);
    /* THE TONE EDGE, and ONE colour across all four: HaTi holds no target for
       any of these readings, so none of them earns a verdict tone. */
    const tops = [...new Set((fr.cards || []).map(c => c.border))];
    check('1d one 3px tone edge, the same on every one', tops.length === 1 && /^3px/.test(tops[0] || ''),
      tops.join(' | '));
    /* `every` on an empty list is true, so each of these says CARDS EXIST as
       well as what is true of them — or a build that draws none of them passes
       the two claims under the one that caught it. */
    check('1e the label leads and the figure follows',
      (fr.cards || []).length > 0
        && fr.cards.every(c => (c.label || '').trim().length > 3 && (c.n || '').trim().length > 0),
      (fr.cards || []).map(c => (c.label || '').trim() + '=' + (c.n || '').trim()).join(' · '));
    /* NOT A BUTTON — no door exists behind any of these four. */
    check('1f and none of them promises a press',
      (fr.cards || []).length > 0 && fr.cards.every(c => c.tag === 'DIV'),
      (fr.cards || []).map(c => c.tag).join(','));
    await page.screenshot({ path: path.join(OUT, '01-friction-kpis.png') });

    /* ═══════════ 2 · BIGGEST BY CONTRACTED VALUE IS NOT PAINTED ═══════════ */
    /* THE PORTFOLIO TAB'S KEY IS 'frame' — IG_TABS names it, and a probe
       asking for 'portfolio' silently stayed where it was and made the claim
       under it pass on the wrong page. */
    await drive(page, () => { intelGoTab('frame'); }, undefined, null);
    await pause(1600);
    const pf = await drive(page, () => {
      /* THE HOST IS #ig-frame — the Portfolio tab is painted INTO the Insights
         frame, not into a panel of its own. A probe looking for a host that
         never existed reports "not drawn" and makes the claim under it pass on
         an empty page, which is a description. */
      const host = document.getElementById('ig-frame');
      const cards = Array.from(host ? host.querySelectorAll('*') : [])
        .filter(el => el.children.length === 0 && /biggest/i.test(el.textContent || ''));
      return { drawn: !!host && host.getBoundingClientRect().height > 0
          && host.querySelectorAll('[data-pf-cat],[data-pf-cp],[data-pf-open]').length > 0,
        biggest: cards.length,
        text: cards.map(e => (e.textContent || '').trim().slice(0, 40)),
        cpDoors: document.querySelectorAll('[data-pf-cp]').length };
    }, undefined, { drawn: false, biggest: -1, text: [], cpDoors: -1 });

    check('2a CONTROL — the Portfolio tab draws', pf.drawn === true, String(pf.drawn));
    check('2b nothing on the page says "biggest" any more', pf.biggest === 0,
      `${pf.biggest}: ${(pf.text || []).join(' | ')}`);
    /* THE DOOR SURVIVES THE CARD. Every row of that table pressed data-pf-cp;
       so does every dot of the risk map, and one handler answers both. */
    check('2c CONTROL — the counterparty filter is still on the page', pf.cpDoors > 0,
      `${pf.cpDoors} doors`);
    await page.screenshot({ path: path.join(OUT, '02-portfolio.png') });

    /* ═══════════ 3 · THE SHADING FILLS THE WHOLE SHADED HALF ═══════════
       Measured as two rects, because that is the whole report: the lit half
       was 26px inside a 28px box with a radius on it and no clip, so a
       hairline of page showed along its top, bottom and four corners. */
    const cid = await drive(page, () => {
      const c = (state.contracts || []).find(x => x.status !== 'Signed') || state.contracts[0];
      return c ? c.id : null;
    }, undefined, null);
    await drive(page, id => openRedlineWorkbench(id), cid, null);
    await pause(2400);

    const seg = await drive(page, () => {
      const wrap = document.querySelector('#view-redline .rl-actions .rl-segwrap:not(.rl-readwrap)');
      if (!wrap) return { err: 'the seat switch is not drawn' };
      const on = wrap.querySelector('.rl-seg.on') || wrap.querySelector('.rl-seg');
      if (!on) return { err: 'no lit half' };
      const w = wrap.getBoundingClientRect(), s = on.getBoundingClientRect();
      const wc = getComputedStyle(wrap), sc = getComputedStyle(on);
      const bw = parseFloat(wc.borderTopWidth) || 0;
      /* THE INNER BOX is the wrap less its own border. The fill must reach it
         on the top and bottom edges, to within half a device pixel. */
      const innerTop = w.top + bw, innerBot = w.bottom - bw;
      return { wrapH: +w.height.toFixed(1), segH: +s.height.toFixed(1),
        gapTop: +(s.top - innerTop).toFixed(2), gapBot: +(innerBot - s.bottom).toFixed(2),
        radius: sc.borderTopLeftRadius, clip: wc.overflow,
        fill: sc.backgroundColor, box: wc.backgroundColor };
    }, undefined, { err: 'blocked' });

    check('3a the seat switch is on the page', !seg.err, seg.err || `${seg.wrapH}px box`);
    check('3b the lit half takes the box\'s full height',
      !seg.err && Math.abs(seg.gapTop) < 0.6 && Math.abs(seg.gapBot) < 0.6,
      seg.err || `gap ${seg.gapTop} top / ${seg.gapBot} bottom`);
    check('3c and its corners are the box\'s corners, not a pill\'s',
      !seg.err && parseFloat(seg.radius) === 0, seg.err || seg.radius);
    check('3d the box clips, so nothing can show through at the corner',
      !seg.err && /hidden|clip/.test(seg.clip || ''), seg.err || seg.clip);
    /* THE CONTROL IT WAS TOLD TO RESEMBLE. Measured the same way on the
       Document tab, so "they match" is a RELATION and not a typed number. */
    await drive(page, id => { openWorkspace(id); }, cid, null);
    await pause(1500);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(900);
    const ref = await drive(page, () => {
      const wrap = document.querySelector('.doc-read-seg');
      if (!wrap) return { err: 'not drawn' };
      const on = wrap.querySelector('[aria-pressed="true"]') || wrap.querySelector('button');
      const w = wrap.getBoundingClientRect(), s = on.getBoundingClientRect();
      const bw = parseFloat(getComputedStyle(wrap).borderTopWidth) || 0;
      return { gapTop: +(s.top - (w.top + bw)).toFixed(2), gapBot: +((w.bottom - bw) - s.bottom).toFixed(2) };
    }, undefined, { err: 'blocked' });
    check('3e CONTROL — the switch it is matched TO measures the same way',
      !ref.err && Math.abs(ref.gapTop) < 0.6 && Math.abs(ref.gapBot) < 0.6,
      ref.err || `gap ${ref.gapTop} / ${ref.gapBot}`);

    /* ═══════════ 4 · FOCUS MODE ON THE NEGOTIATE PAGE ═══════════
       The hole yesterday's check left: it pressed the button in the CONTRACT
       ROOM, where it has always worked. The negotiate page draws the SAME
       button from the SAME builder and wired only the menu row's id. */
    await drive(page, id => openRedlineWorkbench(id), cid, null);
    await pause(2200);
    const nf = await drive(page, async () => {
      const b = document.querySelector('#view-redline .room-focus[data-ws-focus]');
      if (!b) return { err: 'no Focus button on the negotiate page' };
      const r = b.getBoundingClientRect();
      /* A RECT IS NOT A PAINTED PIXEL — the lesson the ladder's hover card
         wrote down. elementFromPoint is the instrument. */
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const painted = !!hit && (hit === b || b.contains(hit));
      const headBefore = document.querySelector('#view-redline #ws-head');
      const hBefore = headBefore ? Math.round(headBefore.getBoundingClientRect().height) : -1;
      b.click();
      await new Promise(r2 => setTimeout(r2, 400));
      const pg = document.getElementById('view-redline');
      const head = document.querySelector('#view-redline #ws-head');
      return { w: Math.round(r.width), h: Math.round(r.height), painted, hBefore,
        onPage: !!pg && pg.classList.contains('rl-focus'),
        onBody: document.body.classList.contains('rl-focused'),
        hAfter: head ? Math.round(head.getBoundingClientRect().height) : -1,
        exit: !!document.querySelector('#view-redline .rl-focus-exit') };
    }, undefined, { err: 'blocked' });

    check('4a the negotiate page draws the same Focus button', !nf.err,
      nf.err || `${nf.w}x${nf.h}`);
    check('4b it is PAINTED — nothing sits over it', nf.painted === true, String(nf.painted));
    check('4c pressing it really turns focus mode on', nf.onPage === true && nf.onBody === true,
      `page ${nf.onPage} / body ${nf.onBody}`);
    check('4d and the head really goes away', nf.hBefore > 0 && nf.hAfter === 0,
      `${nf.hBefore}px before / ${nf.hAfter}px after`);
    check('4e the way out is drawn', nf.exit === true, String(nf.exit));
    await page.screenshot({ path: path.join(OUT, '04-focus-on.png') });

    /* AND IT COMES BACK. Focus mode hides the head, so the button that turned
       it on goes with it — the exit chip is the way out, as it always was. */
    const back = await drive(page, async () => {
      const x = document.querySelector('#view-redline .rl-focus-exit');
      if (!x) return { err: 'no way out' };
      x.click();
      await new Promise(r => setTimeout(r, 400));
      const head = document.querySelector('#view-redline #ws-head');
      return { h: head ? Math.round(head.getBoundingClientRect().height) : -1,
        onBody: document.body.classList.contains('rl-focused') };
    }, undefined, { err: 'blocked' });
    /* GATED ON FOCUS HAVING GONE ON, or a build where the button does nothing
       passes this by never having hidden anything. */
    check('4f and the head comes back at its own height',
      nf.onPage === true && !back.err && back.h > 0 && back.onBody === false,
      back.err || `${back.h}px`);

    /* THE ROOM'S OWN BUTTON WAS NEVER BROKEN — the control that says this fix
       is narrow. */
    await drive(page, id => { openWorkspace(id); }, cid, null);
    await pause(1500);
    const room = await drive(page, async () => {
      const b = document.querySelector('.room-focus[data-ws-focus]');
      if (!b) return { err: 'not drawn' };
      b.click();
      await new Promise(r => setTimeout(r, 300));
      const head = document.getElementById('ws-head');
      const on = !!head && getComputedStyle(head).display === 'none';
      b.click();
      return { on };
    }, undefined, { err: 'blocked' });
    check('4g CONTROL — the contract room\'s button still works', room.on === true,
      room.err || String(room.on));

    /* ═══════════ 5 · A PROMISE IS MARKED IN AMBER ═══════════
       The edition is staged for real: the scripted provider answers the rows
       the route actually sends, and the obligation is given a quote taken out
       of the paper the reader is looking at — so the placing is the product's
       own rlPbFindClause, not a fixture agreeing with itself. */
    await drive(page, () => { openWorkspace('MK-A2'); }, undefined, null);
    await pause(1600);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(900);

    const rows = await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      try { return docReadClauses(c).map((x, i) => ({ i, heading: x.heading, text: (x.text || '').slice(0, 150) })); }
      catch (_) { return []; }
    }, undefined, []);
    check('5a CONTROL — the real document builder yields clauses to read',
      rows.length >= 3, `${rows.length}`);

    /* THE OBLIGATION'S QUOTE IS LIFTED OUT OF CLAUSE 2's OWN WORDING. */
    const target = rows[2] || rows[1] || rows[0] || { i: 0, text: '' };
    const quote = String(target.text || '').split(/(?<=\.)\s/)[0].slice(0, 120);
    const put = await drive(page, async q => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      c.obligations = (c.obligations || []).concat([{ id: 'ob_test1', desc: 'Test promise',
        due: '', recurring: 'none', assignee: '', status: 'open', quote: q }]);
      const flags = (typeof docReadFlags === 'function') ? docReadFlags(c) : new Map();
      return { placed: flags.size, ids: [...flags.keys()],
        whys: [...flags.values()].map(v => String(v.why || '').slice(0, 60)) };
    }, quote, { placed: -1, ids: [], whys: [] });
    /* ---- REVERSED IN PLACE, 19 Sep 2026 evening (Young ruled it) ----
       This asked that an obligation put a BAR on its clause. That was the
       wrong answer to *"highlight obligations in Amber"* twice over: it is a
       fact about the CLAUSE where the ask was about the WORDS, and once the
       words are lit one colour would be saying two things on one screen. So
       the bar keeps its two judgements — your playbook disagreed, the risk
       scan flagged it — and the promise is on the wording, driven in
       duty-marks-verify. What is asked here is the REVERSAL. */
    check('5b an obligation no longer puts a bar on its clause', put.placed === 0,
      `${put.placed} placed · ${(put.whys || []).join(' | ')}`);
    check('5c and no sentence about a promise is left on the bar',
      !(put.whys || []).some(w => /promise|åtagande/i.test(w)), (put.whys || []).join(' | '));

    /* NOW THE PAINT. The edition is asked for, and the entry facing that
       clause must carry the amber bar — which is an inset box-shadow and is
       invisible in the markup either way. */
    ai.script(body => {
      const txt = JSON.stringify(body).slice(0, 200000);
      const keys = [...txt.matchAll(/\[R(\d+)\]/g)].map(m => +m[1]);
      const uniq = [...new Set(keys)];
      return [{ type: 'tool_use', id: 'tu_read', name: 'clause_readings', input: {
        readings: uniq.map(k => ({ i: k, key: 'R' + k, heading: (rows[k] || {}).heading || '',
          plain: 'In plain words, this clause says what it says.' })) } }];
    });
    await drive(page, async () => {
      const b = document.querySelector('[data-doc-read="1"]');
      if (b) b.click();
      await new Promise(r => setTimeout(r, 4200));
    }, undefined, null);
    await pause(1200);

    const amber = await drive(page, () => {
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      const watch = notes.filter(n => n.classList.contains('dr-watch'));
      const shot = watch.map(n => {
        const cs = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        return { shadow: cs.boxShadow, title: (n.getAttribute('title') || '').slice(0, 70),
          w: Math.round(r.width), h: Math.round(r.height) };
      });
      return { notes: notes.length, watch: watch.length, shot };
    }, undefined, { notes: 0, watch: 0, shot: [] });

    check('5d CONTROL — the plain English edition really painted', amber.notes >= 3,
      `${amber.notes} entries`);
    /* REVERSED with 5b: the obligation was the only thing on this stage that
       could have marked a clause, so the bar must now be absent. The bar
       ITSELF is not retired and is still driven by its own two sources in
       plain-english-verify — what is pinned here is that a promise is not one
       of them. */
    check('5e no clause is barred by a promise alone', amber.watch === 0,
      `${amber.watch} marked`);
    check('5f and nothing on the page says the bar is about an obligation',
      !(amber.shot || []).some(s => /promise|Obligations/i.test(s.title)),
      (amber.shot || []).map(s => s.title).join(' | ').slice(0, 140));
    await page.screenshot({ path: path.join(OUT, '05-plain-english-amber.png') });

    if (blocked.length) check('nothing was blocked', false, blocked.slice(0, 3).join(' | '));
    if (errors.length) check('no page errors', false, errors.slice(0, 3).join(' | '));
    else check('no page errors', true);
  } catch (e) {
    check('the run completed', false, String(e && e.message).slice(0, 220));
  } finally {
    await browser.close();
    await h.stop();
    if (ai && ai.stop) await ai.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
