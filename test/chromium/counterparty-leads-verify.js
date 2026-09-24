/* COUNTERPARTY LEADS — the two tables, and the work order's four (21 Sep 2026)
   ========================================================================
   The PAINTED halves of f350. A width read out of REG_COL_W is a number in a
   list; a width read off a rendered table is the thing the owner is looking
   at, and "well spaced so we can see the most of the counterparty name" is a
   claim only a browser can answer.

   Run: node test/chromium/counterparty-leads-verify.js */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers.js');

const OUT = path.join(__dirname, 'shots', 'counterparty-leads');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    /* ============ 1 · CONTRACTS: THE COUNTERPARTY LEADS ============ */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });
    const READ = () => {
      const ths = [...document.querySelectorAll('.reg-table thead th')]
        .map(t => ({ t: t.textContent.replace(/[↑↓↕⇕▲▼]/g, '').trim(),
          w: +t.getBoundingClientRect().width.toFixed(0), sort: t.getAttribute('data-reg-sort') }));
      const r = document.querySelector('tr[data-row]');
      if (!r) return { err: 'no rows' };
      const tt = r.querySelector('.reg-title'), sb = r.querySelector('.reg-sub');
      const cs = e => e ? getComputedStyle(e) : null;
      const td = r.querySelector('td.reg-cell-title');
      const tc = r.querySelector('.reg-typecell');
      return { ths,
        title: tt ? { txt: tt.textContent.trim(), w: cs(tt).fontWeight, size: cs(tt).fontSize, col: cs(tt).color } : null,
        sub: sb ? { txt: sb.textContent.trim(), w: cs(sb).fontWeight, size: cs(sb).fontSize, col: cs(sb).color } : null,
        hover: td ? td.getAttribute('title') : null,
        typeCell: tc ? tc.textContent.trim() : null,
        /* the two lines are really stacked, not run together on one */
        stacked: !!(tt && sb && sb.getBoundingClientRect().top >= tt.getBoundingClientRect().bottom - 1),
        rowH: +r.getBoundingClientRect().height.toFixed(1) };
    };
    const C = await page.evaluate(READ);
    check('1a the Contracts table draws no CONTRACT TITLE column',
      !C.err && !C.ths.some(x => /contract title/i.test(x.t)), C.err || C.ths.map(x => x.t).join(' | '));
    check('1b the counterparty leads the identity cell, in the page ink at the heavier weight',
      !!C.title && +C.title.w >= 500 && C.title.col === 'rgb(20, 31, 29)',
      C.title && `"${C.title.txt}" ${C.title.w} ${C.title.size} ${C.title.col}`);
    check('1c the contract name sits UNDER it, a size down and in the quiet grey',
      !!C.sub && C.stacked && parseFloat(C.sub.size) < parseFloat(C.title.size)
        && C.sub.col !== C.title.col && +C.sub.w < +C.title.w,
      C.sub && `"${C.sub.txt}" ${C.sub.w} ${C.sub.size} ${C.sub.col} · stacked ${C.stacked}`);
    /* WELL SPACED: the counterparty is the widest column on the table, because
       it carries two facts where the two columns it replaced carried one each. */
    const widest = l => l.slice().sort((a, b) => b.w - a.w)[0];
    check('1d and it is the widest column on the page — "the most of the counterparty name"',
      !C.err && /counterparty/i.test(widest(C.ths).t), widest(C.ths) && `${widest(C.ths).t} ${widest(C.ths).w}px`);
    check('1e the kind and the round are still SAID, on that cell’s own hover',
      !!C.hover && /·/.test(C.hover), C.hover);
    check('1f and Contracts draws no Type column of its own', C.typeCell === null, String(C.typeCell));

    /* ============ 2 · NEGOTIATIONS: NOTHING DELETED, A COLUMN GAINED ====== */
    await page.evaluate(() => {
      (state.contracts || []).slice(0, 3).forEach(c => {
        try { const cl = negoClauseList(c); if (cl && cl[0])
          negoEditClause(c, cl[0].clauseId, '<p>Staged for the probe.</p>', {}); } catch (e) {}
      });
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => openNegotiations({ list: true }));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '02-negotiations.png') });
    const N = await page.evaluate(READ);
    /* A NAMED CONTROL: it holds before and after, which is the owner's own
       ask on this seat — "do not delete any column". It is here so a future
       pass cannot quietly drop one. */
    /* RE-POINTED IN PLACE 24 Sep 2026: "do not delete any column" was the
       owner's ask for THIS ruling; three days later he asked for one to go —
       "Remove the value stream column from both pages as well but not from
       the filter" — so the seat keeps every column EXCEPT the stream: seven,
       asked of its own key list, with the stream asserted absent. */
    const nKeys = await page.evaluate(() => REG_COL_KEYS_NEGO.length);
    check('2a the Negotiations table keeps every column but the value stream',
      !N.err && N.ths.length === nKeys && !(N.ths || []).some(x => /value stream/i.test(x.t)),
      N.err || `${N.ths && N.ths.length} of ${nKeys}: ` + (N.ths || []).map(x => x.t).join(' | '));
    check('2b the words that were under the contract name are a column of their own',
      !!N.typeCell && /·/.test(N.typeCell), N.typeCell);
    check('2c and it sits immediately right of the counterparty', (() => {
      if (N.err) return false;
      const i = N.ths.findIndex(x => /counterparty/i.test(x.t));
      return i >= 0 && /type/i.test(N.ths[i + 1] ? N.ths[i + 1].t : '');
    })(), N.ths && N.ths.map(x => x.t).join(' | '));
    check('2d that column sorts, like every column but the last',
      !N.err && N.ths.some(x => x.sort === 'kind') && N.ths[N.ths.length - 1].sort === null,
      N.ths && JSON.stringify(N.ths.map(x => x.sort)));
    check('2e the counterparty leads here too, and is the widest',
      !!N.title && N.stacked && /counterparty/i.test(widest(N.ths).t),
      N.title && `"${N.title.txt}" over "${N.sub && N.sub.txt}" · widest ${widest(N.ths).t} ${widest(N.ths).w}px`);

    /* BALANCE, MEASURED ACROSS THE TWO PAGES: the columns both seats share are
       cut identically in PIXELS, which is what a reader moving between them
       actually experiences. */
    /* FIVE since 24 Sep 2026: the owner took the value stream column off both
       seats (filter kept), and its width went back to the counterparty on both. */
    const shared = ['MK', 'Counterparty', 'Value', 'Expiry date', 'Status'];
    const wOf = (l, n) => { const x = l.find(y => y.t.toLowerCase() === n.toLowerCase()); return x ? x.w : null; };
    const pairs = shared.map(n => [n, wOf(C.ths || [], n), wOf(N.ths || [], n)]);
    /* A NAMED CONTROL for the same reason: this invariant held before this
       change and has to go on holding through it. */
    check('2f the five columns both tables share are cut identically, in pixels',
      pairs.every(([, a, b]) => a != null && a === b),
      pairs.map(([n, a, b]) => `${n} ${a}/${b}`).join(' · '));

    /* ============ 3 · THE NEW AGREEMENT POP-UP ============ */
    /* A COMPANY STANDARD IS PUBLISHED FIRST, because the cramped row the owner
       reported is the one BETWEEN the line-of-business heading and the
       company-standard cards above it — and a workspace with none draws no
       cards, so an instrument that did not stage one would report a gap of
       null on the very screen it exists to measure. */
    const tpl = await W.admin.json('/api/templates', { method: 'POST',
      body: { name: 'Warehousing Logistics Agreement', description: 'A 3PL logistics contract.', category: 'procurement' } });
    const tid = tpl.template.id;
    const tdet = await W.admin.json('/api/templates/' + tid);
    const tv = tdet.versions[0].id;
    await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: 'Warehousing Logistics Agreement' },
        { orderIndex: 1, blockType: 'fixed_text', content: 'Made between {{org_name}} and {{provider}}.' }],
      fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', defaultValue: '{{org.company_name}}' },
        { fieldKey: 'provider', label: 'Provider name', fieldType: 'short_text' }] } });
    await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} });
    await page.waitForTimeout(500);
    await page.evaluate(() => (window.openNewAgreement ? openNewAgreement({}) : openWizard()));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, '03-new-agreement.png') });
    const P = await page.evaluate(() => {
      const cs = e => e ? getComputedStyle(e) : null;
      const body = document.querySelector('.na-body'), card = document.querySelector('.na-card');
      const lob = document.querySelector('.na-lob select');
      const inp = document.querySelector('.na-card input');
      return { bodyBg: cs(body) && cs(body).backgroundColor,
        pageBg: (() => { const d = document.createElement('div');
          d.style.background = 'var(--color-bg)'; document.body.appendChild(d);
          const v = getComputedStyle(d).backgroundColor; d.remove(); return v; })(),
        cardBg: cs(card) && cs(card).backgroundColor, cardEdge: cs(card) && cs(card).borderColor,
        lobH: lob ? Math.round(lob.getBoundingClientRect().height) : null,
        fieldH: inp ? Math.round(inp.getBoundingClientRect().height) : null,
        /* THE RULE, not a pair of sections that may not both be drawn: a
           workspace with no company standard published draws one section, and
           an instrument that needs two would report a gap of null on a page
           where the gap is perfectly correct. */
        secGap: (() => { let g = null;
          for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
            for (const r of rules || []) if (r.selectorText === '.na-sec + .na-sec')
              g = Math.round(parseFloat(r.style.marginTop)); }
          return g; })(),
        secHeadMin: (() => { const sh = document.querySelector('.na-sec-h');
          return sh ? Math.round(sh.getBoundingClientRect().height) : null; })(),
        /* RE-POINTED IN PLACE 22 Sep 2026 — proposal C: the cards became a
           rail of rows, so the gap is measured from the last ROW of a shelf
           to the heading of the next. The CLAIM is the relation and it is
           unchanged. */
        realGap: (() => { const d = document.querySelector('.na-rows');
          const hs = [...document.querySelectorAll('.na-sec-h')];
          if (!d) return null;
          const db = d.getBoundingClientRect().bottom;
          const next = hs.map(x => x.getBoundingClientRect()).filter(r => r.top >= db - 1)
            .sort((a, b) => a.top - b.top)[0];
          return next ? Math.round(next.top - db) : null; })(),
        rows: document.querySelectorAll('.na-pick').length,
        /* A ROW THAT IS NOT THE CHOSEN ONE. The chosen one is FILLED now, not
           outlined, which is the Templates page's own lit-row treatment. */
        pickPlain: !!document.querySelector('.na-pick:not(.on)'),
        pickBg: (() => { const d = document.querySelector('.na-pick:not(.on)');
          return d ? getComputedStyle(d).backgroundColor : null; })(),
        onBg: (() => { const d = document.querySelector('.na-pick.on');
          return d ? getComputedStyle(d).backgroundColor : null; })(),
        railBg: (() => { const d = document.createElement('div');
          d.style.background = 'var(--accent-fill)'; document.body.appendChild(d);
          const v = getComputedStyle(d).backgroundColor; d.remove(); return v; })() };
    });
    /* NOT MERELY "different": at the parent the body painted nothing at all
       and transparent-against-white already read as a difference, so the
       claim passed on a screen the owner had just called too white. It is
       the PAGE'S OWN GROUND, resolved live — the thing that was missing. */
    check('3a the cards have the page’s own ground to be white against',
      !!P.bodyBg && P.bodyBg === P.pageBg && P.bodyBg !== P.cardBg,
      `body ${P.bodyBg} · page ${P.pageBg} · card ${P.cardBg}`);
    check('3b and the card edge is the token that stays visible on it',
      P.cardEdge === 'rgb(203, 211, 208)', P.cardEdge);
    check('3c the line-of-business control is the size of the controls beside it',
      P.lobH != null && P.fieldH != null && Math.abs(P.lobH - P.fieldH) <= 2, `lob ${P.lobH} · field ${P.fieldH}`);
    /* RE-POINTED IN PLACE 22 Sep 2026. The ground is still the claim, and on
       a rail it is the ROW that must not compete with it: an unchosen row
       paints nothing and the chosen one is filled in the accent. */
    check('3c2 an unchosen row paints nothing, and the chosen one is filled',
      P.rows > 0 && P.pickPlain && P.pickBg === 'rgba(0, 0, 0, 0)' && P.onBg === P.railBg,
      `${P.rows} rows · plain ${P.pickPlain} · resting ${P.pickBg} · lit ${P.onBg} · accent-fill ${P.railBg}`);
    /* THE OWNER'S OWN REPORT, MEASURED: the heading row under a shelf stands
       clear of it by MORE than the things inside that shelf stand from each
       other, which is what "so close to overlapping" was about. RE-POINTED IN
       PLACE 22 Sep 2026 — the 12px card gap became the rail's own row gap, so
       the RELATION is read off the stylesheet rather than typed. */
    check('3d and the heading row stands clear of the rows above it',
      P.rows > 0 && P.realGap != null && P.secGap != null && P.realGap >= P.secGap && P.secHeadMin >= 32,
      `rows→heading ${P.realGap}px against the ${P.secGap}px boundary · head row ${P.secHeadMin}px`);

    /* A DROPDOWN ON A PAGE THAT IS NOT THE CONTRACTS FILTER BAR draws HaTi's
       own list — which is the whole of the owner's third ask. */
    const menu = await page.evaluate(async () => {
      document.querySelectorAll('.hati-selmenu').forEach(x => x.remove());
      const sel = document.querySelector('.na-lob select') || document.querySelector('.na-card select');
      if (!sel) return { err: 'no select in the pop-up' };
      sel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 250));
      const m = document.querySelectorAll('.hati-selmenu');
      const one = m[0], cs = one && getComputedStyle(one);
      return { n: m.length, rows: one ? one.querySelectorAll('.hati-selmenu-row').length : 0,
        radius: cs && cs.borderRadius, pos: cs && cs.position };
    });
    check('3e a dropdown away from the Contracts page draws HaTi’s own list',
      !menu.err && menu.n === 1 && menu.rows > 0, menu.err || JSON.stringify(menu));
    check('3f exactly ONE menu — one root, one listener', menu.n === 1, String(menu.n));
    check('3g and it wears the platform’s card corner, over everything',
      menu.radius === '8px' && menu.pos === 'fixed', `${menu.radius} · ${menu.pos}`);
    await page.evaluate(() => { document.querySelectorAll('.hati-selmenu').forEach(x => x.remove());
      const m = document.getElementById('modal-root'); if (m) m.innerHTML = ''; });

    /* ============ 4 · THE BRIEF IS THE LAST BUTTON BEFORE SIGNING ========= */
    const id = await page.evaluate(() => (state.contracts || [])[0] && state.contracts[0].id);
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(800);
    await page.evaluate(i => roomGoTab(state.contracts.find(x => x.id === i), 'sign'), id);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, '04-before-you-sign.png') });
    const B = await page.evaluate(() => {
      const b = document.querySelector('#sc-brief');
      if (!b) return { drawn: false };
      const r = b.getBoundingClientRect();
      const run = document.querySelector('#sc-run');
      const st = document.querySelector('.sc-stage');
      const cs = getComputedStyle(b);
      const use = b.querySelector('use');
      const sym = use && document.querySelector(use.getAttribute('href'));
      return { drawn: true, label: b.textContent.trim(), act: b.getAttribute('data-kt-brief'),
        y: Math.round(r.y), h: Math.round(r.height),
        beforeRun: run ? r.y < run.getBoundingClientRect().y : true,
        beforeStages: st ? r.y < st.getBoundingClientRect().y : true,
        bg: cs.backgroundColor, col: cs.color, title: b.getAttribute('title'),
        mark: !!sym, markW: Math.round(b.querySelector('svg').getBoundingClientRect().width) };
    });
    check('4a the brief carries a button of its own on Before you sign', B.drawn, JSON.stringify(B));
    /* REVERSED IN PLACE 21 Sep 2026, on Young's word: "write brief should be the
       LAST button clicked ... not the first button in the signing page but last
       and mandatory". The old claim (first on the card, before every stage) is
       kept here because its reasoning is what makes this safe: the brief is a
       press that SPENDS, so it must be somewhere a reader arrives at on purpose.
       First, it was the thing you met before you had read anything; last, it is
       the thing you meet once everything else is settled — and it HOLDS. */
    check('4b it is the LAST button on the card, after every stage',
      B.drawn && !B.beforeRun && !B.beforeStages, `y ${B.y} · before run ${B.beforeRun} · before stages ${B.beforeStages}`);
    check('4c it presses the act the Overview card owns, never a second one',
      B.drawn && /^(run|open)$/.test(B.act || ''), B.act);
    check('4d it is the secondary button, never the filled one',
      B.drawn && B.bg === 'rgba(0, 0, 0, 0)', `${B.bg} on ${B.col}`);
    check('4e its mark is a sprite symbol that really paints',
      B.drawn && B.mark && B.markW > 0, `${B.mark ? 'found' : 'MISSING'} · ${B.markW}px`);
    check('4f and it says what the press costs', B.drawn && !!B.title && B.title.length > 20, B.title);

    /* ============ 5 · THE COPILOT RAIL NAMES ITS CLAUSE ============ */
    await page.evaluate(i => openRedlineWorkbench(state.contracts.find(x => x.id === i)), id);
    await page.waitForTimeout(1100);
    const opened = await page.evaluate(i => {
      const c = state.contracts.find(x => x.id === i);
      const cl = negoClauseList(c);
      if (!cl || !cl.length) return null;
      rlOpenClauseEditor(c, cl[0].clauseId, {});
      return cl[0].clauseId;
    }, id);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, '05-clause-editor.png') });
    const R = await page.evaluate(() => {
      const el = document.querySelector('.ce-ah-cl');
      if (!el) return { drawn: false };
      const sp = document.querySelector('.ce-ah .sp'), tabs = document.querySelector('#ce-tabs');
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const head = document.querySelector('.ce-ah');
      return { drawn: true, text: el.textContent.trim(), title: el.getAttribute('title'),
        afterLabel: !!(sp && r.x > sp.getBoundingClientRect().x),
        beforeTabs: !!(tabs && r.x < tabs.getBoundingClientRect().x),
        weight: cs.fontWeight, col: cs.color, nowrap: cs.whiteSpace,
        headH: head ? Math.round(head.getBoundingClientRect().height) : null };
    });
    check('5a the rail names the clause it is working on',
      !!(opened && R.drawn && R.text && R.text.length > 1), R.drawn ? R.text : 'not drawn');
    check('5b it sits between Copilot’s label and the tabs',
      R.drawn && R.afterLabel && R.beforeTabs, `after ${R.afterLabel} · before ${R.beforeTabs}`);
    check('5c it reads as the subject — the page ink at the title weight',
      R.drawn && +R.weight >= 600 && R.col === 'rgb(20, 31, 29)', `${R.weight} ${R.col}`);
    check('5d it elides rather than wrapping, and the whole name is on the hover',
      R.drawn && R.nowrap === 'nowrap' && !!R.title, `${R.nowrap} · "${R.title}"`);
    /* IT MUST NOT HAVE GROWN THE ROW: the rail head is one line, as it was. */
    check('5e and the head row is still one line', R.drawn && R.headH <= 44, `${R.headH}px`);

    check('no page error along the way', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
