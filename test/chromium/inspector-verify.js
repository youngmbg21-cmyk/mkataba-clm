/* Chromium verification: THE LIST INSPECTOR (Young picked it by name, 26 Sep
   2026, off the "Contract List Options" page — option 3 — "Build Inspector
   and apply to the approvals and signing pages as well").
   ====================================================================
   f387 pins what the code SAYS. This file measures what a reader SEES and
   DOES on the real app: a press selects and the panel follows, a second press
   opens, the arrows move, the filter row stays one line on the list's own
   card at every laptop width in both languages, the list fits its pane, and
   the floor the drawing listed is on the screen — "&" not "&amp;", "29 live",
   quiet empty views, a quiet reference, one sort arrow, one filled button.

   THE STAGE is a new workspace with the sample portfolio, plus one real
   negotiation waiting on us (the other side's ask, filed through the
   product's own funnel) and one with the other side, so the Negotiations page
   has both groups to draw.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than timing out. Controls
   pass on both sides by design and are named. AT THE PARENT (486b7b0) 28 of
   32 FAIL (2e was added after the first build; at 3cc28b1, that build, it is
   the one failure — the counterparty column 504px on Contracts and 536px on
   Negotiations) — the page has no panel, a press opens the contract, the heads
   read "MK | Counterparty | Status | Move | …", the page prints "&amp;" and
   "n/m" (1i and 1j are the drawing's floor, and they bite), the head says
   "29 agreements", three buttons are filled. The four that pass are the
   stage, the two CONTROLS (4a the full table below the width line, 4b a
   press opening there) and the page-error sweep.

   1q counts a line off the CENTRES of boxes with a HEIGHT: its first draft
   counted tops, and the row's zero-height spacer (centred on the line) read
   as a second line at every width while every chip sat at one top. A
   probe's own sentinel is not data.

   Run: node test/chromium/inspector-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'inspector');
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
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    /* RE-POINTED 20 Oct 2026 (Chambers): the bar's language switch is gone;
       the language is Settings › You's, whose one writer is langSet */
    await page.evaluate(() => { if (typeof window.langSet === 'function') window.langSet('en'); }); await page.waitForTimeout(800);

    /* ---- the stage: one negotiation waiting on us, one with them ---- */
    const staged = await page.evaluate(async () => {
      const pickTwo = state.contracts.filter(c => c.status !== 'Signed' && c.status !== 'Declined' && !c.archived).slice(0, 2);
      if (pickTwo.length < 2) return null;
      const file = async (c, side, days) => {
        c.changes = []; delete c.negotiation;
        negoInit(c);
        const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
        const cl = cls[Math.min(2, cls.length - 1)];
        const now = negoClauseNowById(c, cl.clauseId);
        const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
        await negoEditClause(c, cl.clauseId, body.replace(/<\/p>(?![\s\S]*<\/p>)/, ' Payment is due within sixty (60) days.</p>'),
          { side, author: side === 'counterparty' ? (c.counterparty || 'Them') : 'Young Mbagaya' });
        const last = c.changes[c.changes.length - 1];
        if (last) last.createdAt = new Date(Date.now() - days * 864e5).toISOString();
      };
      await file(pickTwo[0], 'counterparty', 9);
      await file(pickTwo[1], 'owner', 4);
      pickTwo[1].negotiation.turnAt = new Date(Date.now() - 3 * 864e5).toISOString();
      /* "They can answer" is the SERVER'S reading since 27 Sep 2026 (srvReach,
         f412), carried on the record as `_reach` — staged here as it arrives.
         It stubbed a standing link on the share cache before. */
      pickTwo[1]._reach = { reply: 'live', last: null, sign: null, fresh: [] };
      return { you: pickTwo[0].id, them: pickTwo[1].id, youCp: pickTwo[0].counterparty };
    });
    ok('the stage: two live negotiations, one waiting on us and one with them', !!staged, JSON.stringify(staged));

    /* ================= 1 · CONTRACTS: HOME'S CONTRACTS PLACE, THE LIST ================= */
    /* RE-POINTED AT STEP 7 OF THE OVERNIGHT WORK ORDER (15 Oct 2026): the
       Contracts page is Home's Contracts place and its List is drawn "without
       the inspector side panel" (the owner's drawing), six columns, a row's one
       press opening the paper. 1a–1b measure that; 1c–1e (a press selects, the
       arrows move the selection on Contracts) retired with the panel — the
       inspector's own mechanics are measured where it still stands
       (four-inspectors-verify, and section 4 below on Negotiations). */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Contracts opens on its Folders; the List is the
       Folders' "List" pill ([data-ctf-show="list"]), which draws the place's List ([data-ct-show="list"]) */
    const toContracts = async () => { await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); }); await page.waitForTimeout(600);
      await page.click('[data-ctf-show="list"]').catch(() => {}); await page.waitForTimeout(900); };
    const toNego = async () => { await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1000); };
    await toContracts();
    const shape = await page.evaluate(() => ({
      place: !!document.querySelector('[data-reg-home][data-ct-show="list"]'),
      ins: document.querySelector('[data-ins-page]') ? document.querySelector('[data-ins-page]').getAttribute('data-ins') : null,
      heads: [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent.replace(/[▲▼↕]/g, '').trim()),
      panel: !!document.getElementById('ins-panel'),
    }));
    ok('1a Contracts at 1440 is Home\'s Contracts place, the List, and no panel beside it', shape.place && !shape.panel && shape.ins === null, JSON.stringify(shape));
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way"): the
       List is the new drawing's Agreement · Stage · Ends · Value — the
       reference rides under the party ("kind · ref") and Owner waits under
       Columns — and the row's ⋯ unheaded */
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE, owner: "keep contracts … as designed"): Stream and Our standards stand where Stage stood */
    /* RE-POINTED 16 Nov 2026 (#762): the new look's List (THE NEW LOOK IS THE ONLY LOOK: "a status = dot + word") adds
       Standing after the agreement, and draws no ⋯ column — a row's one press opens it (1f) */
    /* RE-POINTED (P-31, owner's pick 20 Nov 2026: Contracts the Legora + Stripe way): Our playbook steps out of the
       List; Needs you stands before Ends */
    ok('1b the List is the drawing\'s columns, in plain words: Agreement · Standing · Stream · Needs you · Ends · Value', shape.heads.join('|') === 'Agreement|Standing|Stream|Needs you|Ends|Value', shape.heads.join(' | '));
    await page.screenshot({ path: path.join(OUT, '1-contracts-1440.png') });

    const rows = await page.$$('#reg-tbody tr[data-row]');
    if (rows.length > 2) {
      /* 1f–1h: a row opens that contract on Home's Document — one press, a
         double-click, Enter (the panel's Open contract went with the panel) */
      const HOME = () => ({ view: state.view, id: (window.intel && intel.paper) ? intel.paper.id : null });
      const id3 = await rows[2].getAttribute('data-row');
      await page.click(`#reg-tbody tr[data-row="${id3}"] td:nth-child(2)`); await page.waitForTimeout(900);
      const opened = await page.evaluate(HOME);
      ok('1f a row\'s one press opens that contract, on Home\'s Document', opened.view === 'dashboard' && opened.id === id3, JSON.stringify(opened));
      await toContracts();
      const rows2 = await page.$$('#reg-tbody tr[data-row]');
      const id2 = await rows2[1].getAttribute('data-row');
      await rows2[1].dblclick(); await page.waitForTimeout(900);
      const dbl = await page.evaluate(HOME);
      ok('1g a double-click opens it', dbl.view === 'dashboard' && dbl.id === id2, JSON.stringify(dbl));
      await toContracts();
      const id1 = await page.evaluate(() => document.querySelector('#reg-tbody tr[data-row]').getAttribute('data-row'));
      await page.focus('#reg-tbody tr[data-row]'); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      const ent = await page.evaluate(HOME);
      ok('1h Enter opens it', ent.view === 'dashboard' && ent.id === id1, JSON.stringify(ent));
      await toContracts();
    } else {
      for (const n of ['1f a row\'s one press opens that contract', '1g a double-click opens it', '1h Enter opens it'])
        ok(n, false, 'fewer than three rows on the List');
    }

    /* the floor, on the screen */
    const floor = await page.evaluate(() => {
      const rowsText = [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(r => r.innerText).join('\n');
      const heads = [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent);
      /* the reference rides under the party now (Part 8): "kind · ref" */
      const mk = document.querySelector('#reg-tbody tr .reg-mk') || document.querySelector('#reg-tbody tr .reg-sub .hati-ref');
      const tok = v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;color:var(' + v + ')'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
      /* the Wall | List switch's lit half is a STATE drawn the way the paper's
         Clean | Redline switch draws it, not an act: it is counted apart */
      /* THE HEAD IS HOME'S (#hb-head) now that the place is on Home; Jambo's
         panel beside it (#ig-dock, its Ask) is an area of its own */
      const filled = [...document.querySelectorAll('#page-head button, #hb-head button')].filter(b => !b.hasAttribute('data-ct-show')).filter(b => {
        const r = b.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
        const cs = getComputedStyle(b); return cs.backgroundColor === tok('--accent-fill').replace('rgb(', 'rgb(') && cs.color === 'rgb(255, 255, 255)'; });
      const bgOf = el => getComputedStyle(el).backgroundColor;
      return {
        amp: /&amp;/.test(rowsText), nm: /\bn\/m\b/.test(rowsText),
        facts: (document.getElementById('reg-head-facts') || {}).textContent || '',
        factsSlot: !!document.querySelector('[data-reg-home] .ct-head #reg-head-facts'),
        say: ((document.querySelector('[data-reg-home] .ct-say') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        restBook: (() => { if (typeof regRestBase !== 'function') return null; const R = state.reg || {}; let b = regRestBase();
          if (R.type && R.type !== 'all') b = b.filter(c => String(c.folder) === String(R.type)); return b.length; })(),
        /* RE-POINTED 16 Oct 2026: the place's stages are the Stage box (owner:
           "take the status choices and put them in a dropdown"); a stage with
           nothing in it is not offered, and no choice prints "(0)" */
        /* RE-POINTED AGAIN 21 Oct 2026 (Part 8, the Legora way): the stages
           are a group under "+ Filter" and the views are tabs; no choice and
           no tab prints a zero, and an empty stage is not offered */
        zeroCounts: [...document.querySelectorAll('[data-lh-seat="contracts"] select[data-lh-add] option, [data-lh-seat="contracts"] select[data-lh-f] option')].filter(o => /\(0\)\s*$/.test(o.textContent)).length
          + [...document.querySelectorAll('[data-lh-seat="contracts"] .reg-views [role="tab"] .n')].filter(n => n.textContent.trim() === '0').length,
        zeroTabs: [...document.querySelectorAll('[data-lh-seat="contracts"] .reg-views [role="tab"].is-zero')].filter(t => t.getAttribute('data-reg-view') !== '').length,
        stageOpts: (() => { const g = [...document.querySelectorAll('[data-lh-seat="contracts"] select[data-lh-add] optgroup')].find(x => x.label === i18t('reg_chip_stage'));
          return g ? g.querySelectorAll('option').length : 0; })(),
        idle: heads.some(t => /↕/.test(t)),
        mkInk: mk ? getComputedStyle(mk).color : null,
        /* a button the reader can see (the Display cog's closed pop-up holds
           its own lit density switch, which is not on screen) */
        placeFilled: [...document.querySelectorAll('[data-reg-home] button')].filter(b => !b.hasAttribute('data-ct-show')).filter(b => {
          const r = b.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
          const cs = getComputedStyle(b); return cs.backgroundColor === tok('--accent-fill') && cs.color === 'rgb(255, 255, 255)'; }).length,
        /* RE-POINTED 16 Nov 2026 (#762): the new look draws the page's head IN the place (.ct-head): its filled buttons, by name, and where they stand */
        placeFilledAt: [...document.querySelectorAll('[data-reg-home] button')].filter(b => !b.hasAttribute('data-ct-show')).filter(b => {
          const r = b.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
          const cs = getComputedStyle(b); return (cs.backgroundColor === tok('--accent-fill') || cs.backgroundColor === tok('--color-text')) && cs.color === 'rgb(255, 255, 255)'; })
          .map(b => (b.closest('.ct-head') ? 'head:' : 'place:') + b.textContent.trim()),
        liveBook: state.contracts.filter(c => c && !c.archived && c.status !== 'Declined' && !c.parentId && !c._codeNamed).length,
        headGround: (() => { for (let e = document.querySelector('.reg-band[data-lh-seat="contracts"]'); e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor, a = (b.match(/[\d.]+/g) || []);
          if (b && b !== 'transparent' && !(a.length === 4 && Number(a[3]) === 0)) return b; } return null; })(),
        litShow: [...document.querySelectorAll('[data-reg-home] [data-ct-show][aria-pressed="true"]')].map(b => b.getAttribute('data-ct-show')),
        accent: tok('--accent-ink'),
        filled: filled.map(b => b.innerText.trim()),
        /* RE-POINTED 21 Oct 2026 (Part 8): the list's own card head is gone;
           the filters are chips in the head's white card, which stands over
           the list */
        barInCard: !document.querySelector('[data-reg-home] .reg-card > .reg-cardhead'),
        filtersInBand: !!document.querySelector('.reg-band[data-lh-seat="contracts"] .lh-chips [data-lh-add], .reg-band[data-lh-seat="contracts"] .lh-chips [data-lh-chip]'),
        bandBg: document.querySelector('.reg-band[data-lh-seat="contracts"]') ? bgOf(document.querySelector('.reg-band[data-lh-seat="contracts"]')) : null,
      };
    });
    ok('1i a name prints "&", never "&amp;"', !floor.amp);
    ok('1j "Non-monetary", never "n/m"', !floor.nm);
    /* RE-POINTED 16 Nov 2026 (#762): the new look's head says, as drawn, "N · money on paper · N signed" (regHeadFactsHtml
       over regFolderRead) — its first number is the live book; the word "live" went with the old head */
    /* RE-POINTED 20 Nov 2026 (#802, owner 19 Nov 2026: "delete the words beside the header name because they are
       pushing the buttons to the right"): the head carries no facts line beside the name any more; the count of the
       book is said by the sentence over the list (regCtSayHtml, "You hold N contracts, M of them signed"), whose N is
       the list's own book at rest (regRestBase) */
    /* RE-POINTED 20 Nov 2026 (owner: "delete the highlighted parts"): the sentence over the list is gone too */
    ok('1k the head draws no facts line, and no sentence stands over the list', !floor.factsSlot && floor.restBook > 0 && floor.say === '',
      { facts: floor.factsSlot, say: floor.say, book: floor.restBook, live: floor.liveBook });
    ok('1l a stage with nothing in it is not offered, and no choice prints a zero', floor.stageOpts >= 2 && floor.zeroTabs === 0 && floor.zeroCounts === 0, `${floor.stageOpts} stage choices, ${floor.zeroTabs} empty offered, ${floor.zeroCounts} zeros printed`);
    ok('1m no idle sort arrows', !floor.idle);
    /* (its "the selected one is" half retired with the selection, step 7) */
    ok('1n the resting reference is not an accent', floor.mkInk && floor.mkInk !== floor.accent,
      `resting ${floor.mkInk} · accent ${floor.accent}`);
    /* RE-POINTED 7 Oct 2026 (Young, the mockup's panel): one filled button PER
       AREA — the page head's Draft new agreement and the panel's lead act. */
    /* RE-POINTED AT STEP 7: no panel, so the place itself fills no act; the
       page head fills at most one; the switch lights the one view shown */
    /* RE-POINTED 16 Nov 2026 (#762): the page's head stands IN the place (.ct-head) — so the one filled button allowed is
       the head's (New agreement), and none anywhere else in the place */
    ok('1o one filled button in each area: the place\'s head at most one, none elsewhere in the place (its switch lights its view)', floor.placeFilledAt.filter(x => /^head:/.test(x)).length <= 1
      && !floor.placeFilledAt.some(x => /^place:/.test(x)) && floor.filled.length <= 1 && floor.litShow.join() === 'list', floor.placeFilledAt.join(' | ') + ' · ' + floor.filled.join(' | ') + ' · lit ' + floor.litShow.join());
    /* RE-POINTED 9 Oct 2026 (SAP benchmark, owner-approved): the filters sit in
       the page's white band; the list's own head (name, count, Sort, Display)
       is its card's top row. */
    /* RE-POINTED 16 Nov 2026 (#762): ONE SHEET — the head band is clear over the page's white sheet, so the white is read
       off the nearest painted ground under it */
    ok('1p the filters sit in the white head card; the list draws no card head of its own', floor.barInCard && floor.filtersInBand && floor.headGround === 'rgb(255, 255, 255)',
      `no card head ${floor.barInCard} · filters in the head ${floor.filtersInBand} · band ${floor.bandBg}`);

    /* the one line, at every laptop width, in both languages */
    const lineRep = [];
    for (const lang of ['en', 'sv']) {
      await page.evaluate(l => { if (typeof window.langSet === 'function') window.langSet(l); }, lang); await page.waitForTimeout(700);
      for (const W of [1104, 1280, 1440, 1920]) {
        await page.setViewportSize({ width: W, height: 900 }); await toContracts();
        const m = await page.evaluate(() => {
          /* the chip row of the list head (Part 8), where the card's own
             filter bar stood */
          const bar = document.querySelector('[data-lh-seat="contracts"] .lh-chips') || document.querySelector('.reg-card > .reg-filterbar'), sc = document.getElementById('reg-scroll');
          /* a line is counted off the CENTRES of the things a reader sees.
             The row's spacer is a zero-HEIGHT box with a width, centred on
             the line — counted by its top it read as a second line at every
             width while every chip sat at one top (measured). A box with no
             height occupies no line. */
          const chips = bar ? [...bar.children].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) : [];
          /* RE-MEASURED AT THE INTEGRATION (19 Oct 2026): centres are grouped by
             their distance, never by rounding into fixed 6px buckets — two
             centres 0.01px apart (170.99 and 171.00, measured) straddled a
             bucket's edge and read as two lines. A wrapped line still sits a
             whole control (28px) lower, far past the 6px kept here. */
          const cs = chips.map(x => { const r = x.getBoundingClientRect(); return r.top + r.height / 2; }).sort((a, b) => a - b);
          const mids = new Set(); let line = 0; cs.forEach((y, i) => { if (i && y - cs[i - 1] > 6) line++; mids.add(line); });
          return { ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'), lines: chips.length ? mids.size : 0,
            fits: sc ? sc.scrollWidth <= sc.clientWidth + 1 : false, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        lineRep.push({ lang, W, ...m, html: await page.evaluate(() => document.documentElement.lang) });
      }
    }
    /* the List has no inspector line to cross since step 7; its own line (four
       columns below REG_HOME_NARROW_W of place) sits below these widths and is
       crossed in 4d–4f */
    const bad = lineRep.filter(r => r.lines !== 1 || !r.fits || r.over > 0 || r.html !== r.lang);
    ok('1q the filter row is one line and the list fits its pane, 1104–1920, both languages', bad.length === 0,
      bad.length ? JSON.stringify(bad) : `${lineRep.length} measured`);
    await page.evaluate(() => { if (typeof window.langSet === 'function') window.langSet('en'); }); await page.waitForTimeout(700);
    await page.setViewportSize({ width: 1440, height: 900 }); await toContracts();

    /* RETIRED 16 Nov 2026 (#762): 1r "Display opens, sets the row density, and Escape shuts it" — old look only: the
       Display cog lives in the list head's filter bar (.reg-filterbar), which the drawn new-look head does not show
       (index.html: ".ct-head :is(.lh-add,.lh-sp,.reg-filterbar,…){display:none}") */

    /* ================= 2 · NEGOTIATIONS ================= */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Negotiations is ONE table (.ngn-table) beside Jambo's
       panel: Agreement (party · reference · value on its line) · Round · Whose move (with how long) · Open asks (each ask
       quoted with its §) · Lead · Last; whose move are the tabs Live · Your move · Their move ([data-ngn-tab]); the chosen
       round's panel is THE PRESSED ROUND ALONE (ngnPanelFiveHtml). Each claim asked of its new place. */
    await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1200);
    /* RE-POINTED (P-29, owner's pick 20 Nov 2026: Negotiations the Legora + Stripe way): the columns are Agreement ·
       Whose move (a soft badge) · Rounds (a strip) · Open asks (theirs, a count) · Lead · Waiting · the act (no head);
       the first open ask's words and § ride the agreement cell (.ngn-ql); NO money in a row nor in the panel; the tabs
       are chips (count in their span); the chosen deal's panel has NO tiles: its name, a whose-move tag, the facts block
       (.ngn-pfacts: Round, Open asks, the strip) and its act (.jov5-go). */
    const MONEY = /\b(KES|SEK|EUR|USD)\s?[\d.]+/;
    const ng = await page.evaluate(MONEY_SRC => { const MONEY = new RegExp(MONEY_SRC); return {
      ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'),
      heads: [...document.querySelectorAll('.ngn-table thead th')].map(t => t.textContent.trim()),
      moves: [...document.querySelectorAll('.ngn-table tr[data-ngn-row] .apn-st')].map(x => x.textContent.trim()),
      asks: [...document.querySelectorAll('.ngn-table tr[data-ngn-row]')].map(r => ({ yours: r.classList.contains('is-yours'),
        n: ((r.querySelector('td.ngn-n') || {}).textContent || '').trim(), ql: ((r.querySelector('.ngn-ql') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        /* RE-POINTED 21 Nov 2026 (P-29, as drawn): the wait is its own right-aligned cell (td.ngn-wait) */
        wait: ((r.querySelector('.ngn-wait') || {}).textContent || '').trim() })),
      money: [...document.querySelectorAll('.ngn-table tr[data-ngn-row]')].some(x => MONEY.test(x.textContent)),
      tabs: [...document.querySelectorAll('[data-ngn-tab]')].map(x => x.getAttribute('data-ngn-tab') + ':' + ((x.querySelector('span') || {}).textContent || '')),
      chips: [...document.querySelectorAll('[data-ngn-tab]')].every(x => x.classList.contains('apn-tab') && x.classList.contains('is-chip')),
      views: !!document.querySelector('[data-reg-view]'),
      /* RE-POINTED 21 Nov 2026 (P-29, as drawn): the chosen deal's panel is drawn without cards (.ngn5): its badge (.ngn5-tag), name (.ngn5-t),
         Round · Open asks · Rounds (.ngn5-figs), the act in black (.ngn5-k) and Open the redlines beside it (.ngn5-acts) */
      panel: (() => { const p = document.querySelector('#ins-panel .ngn-panel'); if (!p) return null;
        return { title: !!p.querySelector('.ngn5-t'), tag: ((p.querySelector('.ngn5-tag') || {}).textContent || '').trim(),
          glance: p.querySelectorAll('.jov5-glance').length, facts: ((p.querySelector('.ngn5-figs') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
          strip: !!p.querySelector('.ngn5-figs .ngn-rs'), money: MONEY.test(p.textContent),
          go: ((p.querySelector('.ngn5-k') || {}).textContent || '').trim(), link: [...p.querySelectorAll('.ngn5-acts [data-ngn-open]')].map(x => x.textContent.trim()) }; })(),
    }; }, MONEY.source);
    ok('2a Negotiations draws the list and the panel: Agreement · Whose move · Rounds · Open asks · Lead · Waiting · the act, and no money in a row', ng.ins === '1'
      && ng.heads.filter(Boolean).join('|') === 'Agreement|Whose move|Rounds|Open asks|Lead|Waiting' && ng.heads[ng.heads.length - 1] === '' && !ng.money, ng.heads.join(' | ') + ` · money ${ng.money}`);
    ok('2b whose move is a badge, a row of yours counts their open asks and quotes the first with its §, and the wait is said',
      ng.moves.includes('Your move') && ng.moves.includes('Their move') && ng.moves.every(m => /^(Your move|Their move|Settled)$/.test(m))
      && ng.asks.some(a => a.yours && /^[1-9]\d*$/.test(a.n) && /§/.test(a.ql)) && ng.asks.some(a => a.wait && a.wait !== '—'), `${ng.moves.join(' | ')} · ${JSON.stringify(ng.asks)}`);
    ok('2c only the tabs that have rows are drawn, as chips carrying their counts, and no Contracts views', !ng.views && ng.chips
      && ng.tabs.some(t => /^you:[1-9]/.test(t)) && ng.tabs.some(t => /^them:[1-9]/.test(t)) && ng.tabs.every(t => !/:0$/.test(t) || /^live:/.test(t)), ng.tabs.join(' | '));
    /* was: the panel's three numbers (unsent · asks · round) — the chosen deal's panel carries no tiles and no money */
    ok('2d the panel leads with the chosen deal: its name, whose move, Round and Open asks with the rounds strip, its act, no tiles and no money', !!ng.panel && ng.panel.title
      && /^(Your move|Their move|Settled)$/.test(ng.panel.tag) && ng.panel.glance === 0 && /round/i.test(ng.panel.facts) && /Open asks/.test(ng.panel.facts) && ng.panel.strip && !ng.panel.money
      && (ng.panel.go === 'Open the redlines' || (/^(Answer|Send|Remind|Before you sign)$/.test(ng.panel.go) && ng.panel.link.includes('Open the redlines'))), JSON.stringify(ng.panel));
    /* 2e RETIRED 15 Oct 2026 (the overnight work order, step 7). */
    await page.screenshot({ path: path.join(OUT, '2-negotiations-1440.png') });

    /* ================= 3 · APPROVALS & SIGNING ================= */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Approvals is ONE table (.apn-table) beside Jambo's
       panel; the chosen approval's panel is THE FIVE PARTS with NO button — Approve and Decline stay on the row
       (apnLeadFiveHtml, owner 16 Nov 2026) */
    await page.evaluate(() => setView('approvals')); await page.waitForTimeout(1000);
    const ap = await page.evaluate(() => ({
      ins: document.querySelector('[data-ins-page="approvals"]')?.getAttribute('data-ins'),
      rows: [...document.querySelectorAll('.apn-table tbody tr[data-ap-row]')].map(r => r.getAttribute('data-ap-row')),
      /* RE-POINTED (P-30, owner's pick 20 Nov 2026): no row carries Approve or Decline; the chosen approval's panel does (its acts, [data-apn-act]) */
      rowActs: [...document.querySelectorAll('.apn-table tbody tr[data-ap-row][data-ap-kind="approval"]')].every(r => !r.querySelector('[data-ap-approve], [data-ap-refuse]')),
      panelBtns: document.querySelectorAll('#ins-panel [data-ins-act]').length,
      pid: document.getElementById('ins-panel')?.getAttribute('data-ins-id'),
    }));
    ok('3a Approvals draws the list and the panel; no row carries a decision, the panel draws no old act button', ap.ins === '1' && ap.rowActs && ap.panelBtns === 0 && !!ap.pid, JSON.stringify({ ins: ap.ins, rowActs: ap.rowActs, panelBtns: ap.panelBtns, pid: ap.pid }));
    await page.screenshot({ path: path.join(OUT, '3-approvals-1440.png') });
    if (ap.rows.length > 1 && ap.pid) {
      const other = ap.rows.find(id => id !== ap.pid);
      await page.click(`.apn-table tbody tr[data-ap-row="${other}"] td:first-child`); await page.waitForTimeout(300);
      const s = await page.evaluate(() => ({ view: state.view, pid: document.getElementById('ins-panel').getAttribute('data-ins-id') }));
      ok('3b a press selects on Approvals too', s.view === 'approvals' && s.pid === other, JSON.stringify(s));
    } else ok('3b a press selects on Approvals too', false, 'fewer than two approval rows, or no panel');
    /* RETIRED 16 Nov 2026 (#762): 3c "the panel's Signing-tab door opens that contract on its Signing tab" and 3d "the
       panel's way to the paper (Workspace / Open Before you sign) lands on Home" — old look only: the approval's panel
       draws no button (Approve and Decline on the row); the row's own press and Enter land on Before you sign
       (every-door-lands-on-home-verify, Approvals row) */
    const HOMED = () => ({ view: state.view, id: (window.intel && intel.paper) ? intel.paper.id : null,
      tab: document.querySelector('#ig-dock .pd-tab.on')?.getAttribute('data-pd-tab') || null });
    const obCid = await page.evaluate(() => { const c = state.contracts.find(x => !x.archived); if (!c) return null;
      c.obligations = (c.obligations || []).concat([{ id: 'ob-ins-3e', desc: 'Send the quarterly report', due: todayISO(), party: 'us', status: 'open' }]); return c.id; });
    await page.evaluate(() => setView('obligations')); await page.waitForTimeout(1200);
    const obRow = (await page.$(`[data-ins-page="obligations"] .obt-cols [data-ob-key="${obCid}::ob-ins-3e"]`)) || (await page.$('[data-ins-page="obligations"] .obt-cols [data-ins-row]')); if (obRow) { await obRow.click(); await page.waitForTimeout(500); }
    const obPid = await page.evaluate(() => document.getElementById('ins-panel')?.getAttribute('data-ins-id'));
    /* RE-POINTED 18 Nov 2026 (owner's pick by name, "Five Parts"; f1094): a chosen duty's panel draws no Workspace door
       now; its contract row is the door (data-obp-contract → obOpenContract), landing on Home's paper, that contract */
    /* RE-POINTED 19 Nov 2026 ("We owe · They owe", f1099): the duty is a line in a column; its panel's door to the paper is
       "Open the paper" (data-obt-paper → obOpenContract) */
    const obBtn = await page.$('#ins-panel [data-obt-paper], #ins-panel [data-obp-contract]');
    if (obBtn) {
      await obBtn.click(); await page.waitForTimeout(1200);
      const r = await page.evaluate(HOMED);
      /* (the Obligations-tab landing went with the Document door, 15 Oct 2026) */
      ok('3e Obligations: the contract row lands on Home, on that contract', r.view === 'dashboard' && !!r.id && r.id === obCid, JSON.stringify({ ...r, obCid, obPid }));
    } else ok('3e Obligations: the contract row lands on Home', false, 'no contract row in the panel');

    /* ================= 4 · BELOW THE LINE, AND A WIDTH THAT CROSSES IT ================= */
    /* RE-POINTED AT STEP 7: the Contracts List draws no inspector, so the
       inspector's line is measured where it still stands — Negotiations, the
       same builder on its own seat; the List's own line (its four narrow
       columns) is crossed in 4d–4f */
    await page.setViewportSize({ width: 1024, height: 800 }); await toNego();
    const narrow = await page.evaluate(() => ({ ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'), panel: !!document.getElementById('ins-panel'),
      heads: document.querySelectorAll('.reg-table thead th').length, keys: regColKeys().length, full: !regInspecting() }));
    ok('4a [control] at 1024 Negotiations keeps its full table', narrow.ins !== '1' && !narrow.panel && narrow.full && narrow.heads === narrow.keys, JSON.stringify(narrow));
    const nrow = await page.$('#reg-tbody tr[data-row]');
    const nid = nrow ? await nrow.getAttribute('data-row') : null;
    if (nrow) { await page.click(`#reg-tbody tr[data-row="${nid}"] td:nth-child(2)`); await page.waitForTimeout(900); }
    /* a Negotiations row opens Jambo's Redlines face beside Home's paper (stage 5) */
    const nopen = await page.evaluate(() => ({ view: state.view, id: (window.intel && intel.paper) ? intel.paper.id : null, face: window.pdFaceNow ? pdFaceNow() : '' }));
    ok('4b [control] and one press opens it, on Home\'s paper, Redlines beside it', nopen.view === 'dashboard' && nopen.id === nid && nopen.face === 'red', JSON.stringify(nopen));
    await toNego();
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(700);
    const grown = await page.evaluate(() => ({ ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'), view: state.view }));
    ok('4c widening the window past the line repaints the page into the inspector’s shape', grown.ins === '1' && grown.view === 'redline', JSON.stringify(grown));
    /* THE CONTRACTS PLACE'S LIST HAS A LINE OF ITS OWN (step 7; the checkers
       found it unguarded in a browser): below REG_HOME_NARROW_W of PLACE it
       draws its four narrow columns, and a width crossing that line repaints
       it in the same sitting (regHomeWatch) — both ways, never panning */
    const listShape = () => page.evaluate(() => { const t = document.querySelector('[data-reg-home] .reg-table'), sc = document.querySelector('[data-reg-home] #reg-scroll');
      return { heads: document.querySelectorAll('[data-reg-home] .reg-table thead th').length, narrow: !!(t && t.classList.contains('is-hnarrow')),
        /* Owner waits under Columns at rest (Part 8), so the wide shape draws the rest */
        wide: REG_COL_KEYS_HOME.filter(k => k !== 'owner').length, few: REG_COL_KEYS_HOME_NARROW.length, pan: sc ? sc.scrollWidth - sc.clientWidth : -1,
        place: (document.getElementById('ct-place') || {}).clientWidth || 0 }; });
    const shapeIs = (want, ms = 5000) => (async () => { const t0 = Date.now(); let v;
      while (Date.now() - t0 < ms) { v = await listShape(); if (want(v)) return v; await page.waitForTimeout(150); } return v; })();
    await toContracts();
    const w1 = await shapeIs(v => v.heads === v.wide && !v.narrow);
    ok('4d [control] at 1440 the place\'s List draws its wide columns', w1.heads === w1.wide && !w1.narrow && w1.pan <= 1, JSON.stringify(w1));
    await page.setViewportSize({ width: 820, height: 1180 });
    const n1 = await shapeIs(v => v.heads === v.few && v.narrow);
    ok('4e narrowed to an 820 tablet in the same sitting, it repaints to its four columns and does not pan', n1.heads === n1.few && n1.narrow && n1.pan <= 1, JSON.stringify(n1));
    await page.setViewportSize({ width: 1440, height: 900 });
    const w2 = await shapeIs(v => v.heads === v.wide && !v.narrow);
    ok('4f widened again, its wide columns come back', w2.heads === w2.wide && !w2.narrow && w2.pan <= 1, JSON.stringify(w2));

    /* ================= 5 · ONE LOOK, AND ITS WORDS READ =================
       RE-POINTED 20 Oct 2026: the owner removed dark mode ("Let's not
       implement the dark theme. Remove it from HaTi."), so the night pass is
       gone with the night. Its claim — the panel's words read (AA) on the
       surface they sit on — is asked of the one look HaTi has (5a), and no
       night look is left for the list panel to wear (5b). */
    await toNego();
    const look = await page.evaluate(() => {
      const p = document.getElementById('ins-panel'); if (!p) return null;
      const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
      /* the surface a word sits on: the nearest box that paints a ground */
      const ground = el => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor, a = (b.match(/[\d.]+/g) || []);
        if (b && b !== 'transparent' && !(a.length === 4 && Number(a[3]) === 0)) return b; } return 'rgb(255, 255, 255)'; };
      /* RE-POINTED 16 Nov 2026 (#762): the chosen round's panel is the five parts — its headline (.jov5-title) and a
         fact's small line (.jov5-rt > span) are the words read */
      const cpE = p.querySelector('.jov5-title'), dtE = p.querySelector('.jov5-group .jov5-rt > span');
      if (!cpE || !dtE) return { missing: [!cpE && '.jov5-title', !dtE && '.jov5-rt > span'].filter(Boolean) };
      const cpBg = ground(cpE), dtBg = ground(dtE);
      return { cpBg, dtBg, cp: ratio(getComputedStyle(cpE).color, cpBg), dt: ratio(getComputedStyle(dtE).color, dtBg) };
    });
    ok('5a the panel\'s words (Negotiations) read on the surface under them (AA)', !!look && !look.missing && look.cp >= 4.5 && look.dt >= 4.5, JSON.stringify(look));
    const night = await page.evaluate(() => ({ dark: document.documentElement.classList.contains('dark'),
      panel: !!document.getElementById('ins-panel'),
      fns: ['setDark', 'applyAppearance', 'setTheme', 'toggleDark'].filter(n => typeof window[n] === 'function') }));
    ok('5b no night look: the dark class never lands and no switch for it is published', !night.dark && night.fns.length === 0 && night.panel, JSON.stringify(night));

    ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
