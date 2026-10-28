/* Chromium verification: THE DETAIL ROUND (owner, 25 Oct 2026: "fix items 1 to 11").
   =====================================================================
   The detail report of 24 Oct 2026 measured HaTi at the owner's three
   screens; reviewed against main on 25 Oct, eleven kinds of fault were left
   that need no decision of the owner's. Each is measured here on the painted
   page, at the three screens, where the reader looks:

     1  Calendar: a later week's label ("30 Nov – 4 Dec") stays inside its
        own cell; the page's head floats as a card, like every other page.
     2  Send screen: the head floats as a card; "Email is not set up yet…"
        stands with the cards' text, a gap under the box above it.
     3  Jambo's greeting has the panel's own margin on My notes, Obligations,
        Requests, Import and the Calendar.
     4  Jambo's tab keeps its word (never "J…") on Our paper and beside the
        New agreement sheet; no place word cut there either.
     5  Beside the New agreement sheet, Jambo's panel says something.
     6  The Dossier's act buttons keep their words.
     7  Key terms (and every page in the middle) is a card in line with its
        head, as the Deal page is.
     8  A page's head starts level with Jambo's panel beside it.
     9  Pills at the theme's heights: Needs you's chips 28, Our paper /
        Their paper 30, Settings' On/Off chip 22.
    10  "No notes yet." clear of its card's top; Import's head card no wider
        than its strip; a redline card's verbs start under its words.

   Run: node test/chromium/detail-round-verify.js
        HATI_DETAIL_ONLY=1,4 node test/chromium/detail-round-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'detail-round');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [
  { k: 'laptop-a', w: 1440, h: 780 },
  { k: 'laptop-b', w: 1536, h: 730 },
  { k: 'ipad', w: 1366, h: 950 },
];
const only = (process.env.HATI_DETAIL_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const on = n => !only.length || only.includes(String(n));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const blocked = [];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    const ev = async (fn, arg, fallback = null) => {
      try { return await page.evaluate(fn, arg); }
      catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
    };
    /* A WAIT ASKS FOR THE STATE, BOUNDED */
    const until = async (fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
    const settle = async () => { await page.evaluate(() => document.fonts.ready).catch(() => {}); await page.waitForTimeout(400); };
    const clean = async () => {
      await page.keyboard.press('Escape').catch(() => {}); await page.keyboard.press('Escape').catch(() => {});
      await ev(() => { try { closeModal(); } catch (_) {} });
      await until(() => !document.querySelector('#modal-root [data-dlg-page], #modal-root .modal-in'), undefined, 3000);
    };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd');
    await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke');
    await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample');
    if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await until(() => typeof state === 'object' && Array.isArray(state.contracts) && state.contracts.length > 5, undefined, 15000);
    await page.keyboard.press('Escape').catch(() => {});
    check('0 — signed in with the sample book', !!(await ev(() => state.contracts.length > 5)));
    /* the first page after signing in finishes landing (the Board's cards painted) before any door is pressed */
    await until(() => document.querySelector('#hb-board .hb-card, #cn-page'), undefined, 15000);
    const reviewId = await ev(() => (state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]).id);

    for (const S of SCREENS) {
      await page.setViewportSize({ width: S.w, height: S.h });
      const at = `${S.k}`;
      const shot = n => page.screenshot({ path: path.join(OUT, `${S.k}-${n}.png`) }).catch(() => {});

      /* ---- 1 · THE CALENDAR ---- */
      if (on(1) || on(3) || on(8)) {
        await clean(); await ev(() => setView('dashboard')); await until(() => document.querySelector('#ig-dock'), undefined, 4000); await ev(() => setView('calendar'));
        /* RE-POINTED 26 Oct 2026 (owner: "any page where there is a link to press on the first page needs a second tab
           for jambo"): the Calendar's panel opens on Overview (Your week); his greeting is under the Jambo tab, as in Settings */
        const ready = () => document.querySelectorAll('#hb-cal .cal-wkm-lab b').length >= 5 && document.querySelector('.cal-head') && document.querySelector('.cal-cop .cal-plan-tab');
        /* the first page after signing in may still be settling on the Board: asked once more, bounded */
        const there = (await until(ready, undefined, 5000)) || (await ev(() => setView('calendar')), await until(ready));
        await settle(); await shot('calendar');
        if (on(1)) {
          if (!there) check(`${at} · 1 — the Calendar opened`, false);
          else {
            const lab = await ev(() => [...document.querySelectorAll('.cal-wkm-row')].map(row => {
              const b = row.querySelector('.cal-wkm-lab b'), next = row.querySelector('.cal-wkm-d'); if (!b || !next) return null;
              const r = document.createRange(); r.selectNodeContents(b);
              return { t: b.textContent, over: Math.round(Math.max(...[...r.getClientRects()].map(x => x.right)) - next.getBoundingClientRect().left) };
            }).filter(Boolean));
            const worst = (lab || []).reduce((m, x) => x.over > m.over ? x : m, { over: -99 });
            check(`${at} · 1a — every later week's label stays in its own cell`, lab && lab.length >= 5 && worst.over <= 0, `${worst.t || '?'} ends ${worst.over}px into the next day`);
            const head = await ev(() => { const e = document.querySelector('.cal-head'), cs = getComputedStyle(e), r = e.getBoundingClientRect(), pr = e.parentElement.getBoundingClientRect();
              return { rad: parseFloat(cs.borderTopLeftRadius), shadow: cs.boxShadow !== 'none', inset: Math.round(r.left - pr.left) }; });
            check(`${at} · 1b — the Calendar's head floats as a card`, head && head.rad >= 16 && head.shadow && head.inset >= 8, JSON.stringify(head));
          }
        }
        if (on(3)){ await ev(() => { const t = document.querySelector('.cal-cop [data-cal-talk]'); if (t) t.click(); }); await until(() => document.querySelector('.cal-cop .jb-hello'), undefined, 4000);
          await greetCheck('Calendar');
          await ev(() => { const t = document.querySelector('.cal-cop [data-cal-talk-back]'); if (t) t.click(); }); }
        if (on(8)) await levelCheck('Calendar', '.cal-head');
      }

      /* ---- 3 + 8 · THE LIST PAGES ---- */
      for (const [v, name] of [['mynotes', 'My notes'], ['obligations', 'Obligations'], ['intake', 'Requests'], ['migration', 'Import'], ['approvals', 'Approvals'], ['customers', 'Customers']]) {
        if (!(on(3) || on(8) || on(10))) break;
        await clean(); await ev(v2 => setView(v2), v);
        await until(() => document.querySelector('.ins-panel.is-jambo, #ig-dock') && document.querySelector('.ph-card'));
        await settle();
        if (on(3) && !['approvals', 'customers'].includes(v)) await greetCheck(name);
        if (on(8)) await levelCheck(name, '.ph-card');
        if (on(8) && ['approvals', 'customers', 'obligations'].includes(v)) await bottomCheck(name);
        if (on(10) && v === 'mynotes') {
          const gap = await ev(() => { const e = document.querySelector('.mn-card2 .hati-empty'); const c = e && e.closest('section'); const r = document.createRange(); if (e) r.selectNodeContents(e);
            return e && c ? Math.round(r.getBoundingClientRect().top - c.getBoundingClientRect().top) : null; });
          check(`${at} · 10a — "No notes yet." clear of its card's top`, gap != null && gap >= 12, `${gap}px`);
        }
        if (on(10) && v === 'migration') {
          const w = await ev(() => { const hd = document.querySelector('#page-head .ph-card, .ph-card'), ft = document.querySelector('#content .ph-foot'); if (!hd || !ft) return null;
            const a = hd.getBoundingClientRect(), b = ft.getBoundingClientRect(); return { l: Math.round(a.left - b.left), r: Math.round(a.right - b.right) }; });
          check(`${at} · 10b — Import's head card is as wide as the strip under it`, w && Math.abs(w.l) <= 1 && Math.abs(w.r) <= 1, JSON.stringify(w));
          await shot('import');
        }
      }

      /* ---- 8 · CONTRACTS (a place on Home) ---- */
      if (on(8)) {
        await clean(); await ev(() => setView('register'));
        await until(() => document.querySelector('#ct-place .ph-card') && document.querySelector('#ig-dock'));
        await settle(); await levelCheck('Contracts', '#ct-place .ph-card'); await bottomCheck('Contracts');
      }

      /* ---- 4 · OUR PAPER ---- */
      if (on(4)) {
        await clean(); await ev(() => setView('templates'));
        await until(() => document.querySelector('#ins-panel .jl-head .jl-tab, #ins-panel .jl-head .pd-tab'));
        await settle(); await shot('our-paper');
        await tabsWhole('Our paper', '#ins-panel .jl-head');
      }

      /* ---- 4 + 5 + 9 · THE NEW AGREEMENT SHEET ---- */
      if (on(4) || on(5) || on(9)) {
        await clean(); await ev(() => setView('dashboard'));
        await until(() => document.querySelector('#ig-dock'));
        await ev(() => { try { hbSetFace('board'); } catch (_) {} });
        await until(() => typeof hbFace === 'function' && hbFace() === 'board', undefined, 4000);
        await ev(() => openNewAgreement());
        const up = await until(() => document.querySelector('#na-root') && document.querySelector('#ig-dock .igd-head'));
        await settle(); await shot('new-agreement');
        if (!up) check(`${at} · 4/5 — the New agreement sheet opened`, false);
        else {
          if (on(4)) await tabsWhole('New agreement', '#ig-dock .igd-head');
          if (on(8)) await levelCheck('New agreement', '#modal-root [data-dlg-page] .dlg-pg-head');
          if (on(5)) {
            const said = await ev(() => { const f = document.querySelector('#ig-dock #igd-feed'); return f ? (f.innerText || '').replace(/\s+/g, ' ').trim() : ''; });
            check(`${at} · 5 — beside the New agreement sheet Jambo's panel says something`, !!said, said ? `"${said.slice(0, 60)}"` : 'the panel is empty');
          }
          if (on(9)) {
            const hs = await ev(() => [...document.querySelectorAll('#na-root .na-ptab')].map(b => Math.round(b.getBoundingClientRect().height)));
            check(`${at} · 9b — Our paper / Their paper are 30px pills`, hs && hs.length && hs.every(x => x === 30), JSON.stringify(hs));
          }
        }
      }

      /* ---- 5b · THE SHEET OVER THE CALENDAR (25 Oct 2026): Jambo's line about it, and Cancel gives the Calendar its panel back ---- */
      if (on(5)) {
        await clean(); await ev(() => setView('calendar'));
        await until(() => document.querySelector('.cal-cop'));
        await ev(() => openNewAgreement());
        const up = await until(() => document.querySelector('#na-root') && document.querySelector('#ig-dock #igd-feed'));
        await settle(); await shot('new-agreement-over-calendar');
        const said = await ev(() => ({ cal: !!document.querySelector('#ig-dock .cal-cop'), words: ((document.querySelector('#ig-dock #igd-feed') || {}).innerText || '').replace(/\s+/g, ' ').trim() }));
        check(`${at} · 5b — over the Calendar, the panel beside the New agreement sheet says the sheet's line`, up && !said.cal && /New agreement/.test(said.words), JSON.stringify(said).slice(0, 140));
        /* RE-POINTED 28 Oct 2026 ("Door above the box"): no Jambo tab — the panel is in his own conversation's key */
        const tabs = await ev(() => ({ key: typeof pdTalkKey === 'function' ? pdTalkKey() : null }));
        check(`${at} · 5b — …in his own conversation (not the Calendar's)`, /^dock:/.test(tabs.key || ''), JSON.stringify(tabs));
        await clean();
        const back = await until(() => document.querySelector('#ig-dock .cal-cop'), undefined, 5000);
        check(`${at} · 5b — Cancel gives the Calendar its own panel back`, back);
      }

      /* ---- 9 · NEEDS YOU'S CHIPS, SETTINGS' ON/OFF ---- */
      if (on(9)) {
        await clean(); await ev(() => hbOpenAgent());
        await until(() => document.querySelector('.nd-chip'));
        await settle();
        const hs = await ev(() => [...document.querySelectorAll('.nd-chip')].filter(b => b.getBoundingClientRect().width).map(b => Math.round(b.getBoundingClientRect().height)));
        check(`${at} · 9a — Needs you's chips are 28px pills`, hs && hs.length && hs.every(x => x === 28), JSON.stringify(hs));
        await clean(); await ev(() => openSettingsAt('you'));
        await until(() => document.querySelector('.st-cr .chip.st-chip-off, .st-cr .chip.st-chip-on'));
        await settle();
        if (on(8)) await levelCheck('Settings', '.st-cr .st-headcard');
        const cs = await ev(() => [...document.querySelectorAll('.st-cr .chip.st-chip-off, .st-cr .chip.st-chip-on')].filter(b => b.getBoundingClientRect().width).map(b => Math.round(b.getBoundingClientRect().height)));
        check(`${at} · 9c — Settings' On/Off chip is a 22px pill`, cs && cs.length && cs.every(x => x === 22), JSON.stringify(cs));
      }

      /* ---- 6 + 7 · THE DOSSIER AND KEY TERMS ---- */
      if (on(6) || on(7) || on(2)) {
        await clean(); await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
        await until(() => document.querySelector('#ig-paper') && document.querySelector('#pd-glance, .pd-dossier'));
        await settle(); await shot('dossier');
        if (on(6)) {
          /* every contract in the sample book: the first act wears its WHOLE name, so the longest names show */
          const ids = await ev(() => state.contracts.filter(c => !c._fake).slice(0, 40).map(c => c.id));
          const seen = [], bad = [];
          for (const cid of ids || []) {
            await ev(x => pdOpenOnHome(x, 'copilot'), cid);
            if (!(await until(x => { const p = window.pdContract && pdContract(); return p && p.id === x && document.querySelector('#ig-dock .ds-acts-b.is-mq'); }, cid, 3000))) continue;
            const row = await ev(() => [...document.querySelectorAll('#ig-dock .ds-acts-b.is-mq > *')].filter(b => b.getBoundingClientRect().width).map(b => {
              const r = document.createRange(); r.selectNodeContents(b); const t = r.getBoundingClientRect(), cs = getComputedStyle(b), bx = b.getBoundingClientRect();
              const room = bx.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
              return { t: b.textContent.trim(), cut: t.width > room + 0.5, out: Math.round(bx.right - b.closest('#ig-dock').getBoundingClientRect().right) }; }));
            for (const x of row || []) { if (!seen.includes(x.t)) seen.push(x.t); if (x.cut || x.out > 0) bad.push(x.t); }
          }
          check(`${at} · 6 — the Dossier's act buttons keep their words`, seen.length > 2 && !bad.length, bad.length ? [...new Set(bad)].map(t => `"${t}" cut`).join(', ') : `${seen.length} buttons whole`);
          await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
          await until(x => { const p = window.pdContract && pdContract(); return p && p.id === x; }, reviewId, 4000);
        }
        if (on(7)) {
          await ev(id => pdKtOpen(id), reviewId);
          const up = await until(() => document.querySelector('#modal-root [data-pd-mid-kt]'));
          await settle(); await shot('key-terms');
          if (!up) check(`${at} · 7 — Key terms opened in the middle`, false);
          else {
            const m = await ev(() => { const hd = document.querySelector('#modal-root [data-dlg-page] .dlg-pg-head'), bd = document.querySelector('#modal-root [data-pd-mid] .dlg-pg-body > *');
              if (!hd || !bd) return null; const a = hd.getBoundingClientRect(), b = bd.getBoundingClientRect(); return { l: Math.round(b.left - a.left), r: Math.round(b.right - a.right) }; });
            check(`${at} · 7 — Key terms is a card in line with its head`, m && Math.abs(m.l) <= 1 && Math.abs(m.r) <= 1, JSON.stringify(m));
            if (on(8)) await levelCheck('Key terms', '#modal-root [data-dlg-page] .dlg-pg-head');
          }
          await clean();
        }
        if (on(2)) {
          await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
          await until(() => document.querySelector('#ig-paper'));
          await ev(id => openShareModal(getContract(id)), reviewId);
          const up = await until(() => document.querySelector('#modal-root .modal-in[data-sh-page] .sh-hd'));
          await until(() => document.querySelector('#sh-noemail'), undefined, 3000);
          await settle(); await shot('send');
          if (!up) check(`${at} · 2 — the Send screen opened`, false);
          else {
            const hd = await ev(() => { const e = document.querySelector('#modal-root .modal-in[data-sh-page] .sh-hd'), cs = getComputedStyle(e), r = e.getBoundingClientRect(), pr = e.closest('.modal-in').getBoundingClientRect();
              return { rad: parseFloat(cs.borderTopLeftRadius), shadow: cs.boxShadow !== 'none', inset: Math.round(r.left - pr.left) }; });
            check(`${at} · 2a — the Send screen's head floats as a card`, hd && hd.rad >= 16 && hd.shadow && hd.inset >= 8, JSON.stringify(hd));
            if (on(8)) await levelCheck('Send screen', '#modal-root .modal-in[data-sh-page] .sh-hd');
            const ln = await ev(() => { const p = document.querySelector('#sh-noemail'); if (!p || !p.getBoundingClientRect().width) return null;
              const box = p.previousElementSibling || p.parentElement.previousElementSibling; const card = document.querySelector('#pd-sendface .sh-lt-card');
              const pr = p.getBoundingClientRect(); const cardText = card ? card.getBoundingClientRect().left + parseFloat(getComputedStyle(card).paddingLeft) + parseFloat(getComputedStyle(card).borderLeftWidth) : null;
              const above = [...document.querySelectorAll('#share-readiness-wrap > *')].filter(e => e.getBoundingClientRect().height).pop();
              return { textIn: cardText == null ? null : Math.round(pr.left + parseFloat(getComputedStyle(p).paddingLeft) - cardText), gap: above ? Math.round(pr.top - above.getBoundingClientRect().bottom) : null }; });
            check(`${at} · 2b — "Email is not set up yet…" stands with the cards' text, clear of the box above`, ln && ln.textIn != null && Math.abs(ln.textIn) <= 1 && ln.gap != null && ln.gap >= 10, JSON.stringify(ln));
          }
          await clean();
        }
      }

      /* ---- 10c · A REDLINE CARD'S VERBS ---- */
      if (on(10)) {
        await clean();
        const id = await ev(() => {
          const base = state.contracts.find(c => c.status === 'Under Review') || state.contracts[0];
          const iso = off => new Date(Date.now() + off * 86400000).toISOString();
          const ch = (i, label) => ({ id: 'DR-CH-' + i, clauseId: 'cl-' + i, clauseLabel: label, authorSide: 'counterparty', status: 'pending', createdAt: iso(-3 - i), withdrawn: false, op: 'edit', bodyHtml: '<p>x</p>' });
          let c = state.contracts.find(x => x.id === 'DR-400');
          if (!c) { c = Object.assign({}, JSON.parse(JSON.stringify(base)), { id: 'DR-400', contractNo: 'DR-400', status: 'Under Review', _loaded: true, _light: false,
            changes: [ch(1, 'Clause 7 · INVOICING AND PAYMENT TERMS'), ch(2, 'Clause 12 · TERMINATION FOR CONVENIENCE')],
            negotiation: Object.assign({}, base.negotiation || {}, { round: 1, rounds: [{ n: 1, changes: [] }], turn: 'owner' }) }); state.contracts.unshift(c); }
          openRedlineWorkbench(c.id); return c.id;
        });
        const up = await until(() => document.querySelector('#ig-dock .rl-card-d .rl-idx-top, #ig-dock .rl-card-d'));
        await settle(); await shot('redlines');
        /* RE-POINTED 27 Oct 2026 (THE PICKED CARD): the row's FIRST verb is
           measured, not Accept by name — the suggested answer leads now. A
           bare word starts at its ink; a painted lead starts at its own box,
           which is what the eye reads as the row's start. */
        const m = await ev(() => [...document.querySelectorAll('#ig-dock .rl-card-d')].filter(c => c.getBoundingClientRect().width).slice(0, 2).map(card => {
          const verb = [...card.querySelectorAll('.rl-card-verbs button')].find(b => b.getBoundingClientRect().width); if (!verb) return null;
          const cs = getComputedStyle(card); const words = card.getBoundingClientRect().left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
          const vcs = getComputedStyle(verb);
          const start = (vcs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(vcs.backgroundColor)) ? verb : (verb.firstElementChild || verb);
          return Math.round(start.getBoundingClientRect().left - words); }).filter(x => x != null));
        check(`${at} · 10c — a redline card's verbs start under its words`, up && m && m.length && m.every(x => Math.abs(x) <= 1), JSON.stringify(m) + ' (' + id + ')');
        await ev(() => { state.contracts = state.contracts.filter(x => x.id !== 'DR-400'); });
      }

      async function greetCheck(name) {
        /* RE-POINTED 26 Oct 2026 (owner: "we will have an overview tab side panel in each page followed by the jambo
           tab"): his greeting is the Jambo tab's; what stands first on a page is its Overview (.jov), held to the same margin */
        const g = await ev(() => { const e = [...document.querySelectorAll('.jb-hello, .jov')].find(x => x.getBoundingClientRect().width); if (!e) return null;
          const p = e.closest('.ins-panel, #ig-dock, .cal-cop, .st-side, aside'); const a = e.getBoundingClientRect(), b = p.getBoundingClientRect();
          const cs = getComputedStyle(e); return { l: Math.round(a.left + parseFloat(cs.paddingLeft) - b.left), r: Math.round(b.right - a.right + parseFloat(cs.paddingRight)) }; });
        check(`${at} · 3 — ${name}: Jambo's greeting has the panel's margin`, g && g.l >= 12 && g.r >= 12, g ? `${g.l}px left · ${g.r}px right` : 'no greeting drawn');
      }
      async function bottomCheck(name) {
        const m = await ev(() => { const pn = [...document.querySelectorAll('.ins-panel.is-jambo, #ig-dock')].find(x => x.getBoundingClientRect().width); if (!pn) return null;
          const cards = [...document.querySelectorAll('#content .ap-card, #content .ins-card, #ct-place .reg-body > *')].filter(x => x.getBoundingClientRect().height > 100 && !x.closest('#ins-panel'));
          const low = cards.map(x => x.closest('.ap-body, .ins-body, .reg-body') || x).map(x => Math.round(x.getBoundingClientRect().bottom));
          return low.length ? { list: Math.max(...low), panel: Math.round(pn.getBoundingClientRect().bottom) } : null; });
        check(`${at} · 8 — ${name}: the list ends level with Jambo's panel`, m && Math.abs(m.list - m.panel) <= 1, JSON.stringify(m));
      }
      async function levelCheck(name, sel) {
        const m = await ev(s => { const hd = [...document.querySelectorAll(s)].find(x => x.getBoundingClientRect().width), pn = [...document.querySelectorAll('.ins-panel.is-jambo, #ig-dock, .cal-cop, .st-cr .st-side')].find(x => x.getBoundingClientRect().width);
          return hd && pn ? { head: Math.round(hd.getBoundingClientRect().top), panel: Math.round(pn.getBoundingClientRect().top) } : null; }, sel);
        check(`${at} · 8 — ${name}: the head starts level with Jambo's panel`, m && Math.abs(m.head - m.panel) <= 1, JSON.stringify(m));
      }
      async function tabsWhole(name, head) {
        const t = await ev(hs => { const h = document.querySelector(hs); if (!h) return null;
          return [...h.querySelectorAll('.pd-tab, .igd-head-w, .pd-head-word')].filter(x => x.getBoundingClientRect().width).map(x => {
            const w = x.querySelector('.pd-tab-w') || x; return { t: x.textContent.replace(/\s+/g, ' ').trim(), jambo: x.matches('.pd-tab-talk, .jl-tab'), cut: w.scrollWidth > w.clientWidth + 1, name: x.matches('[data-jl-word]') }; }); }, head);
        const bad = (t || []).filter(x => x.cut && !x.name);
        /* RE-POINTED 28 Oct 2026 ("Door above the box"): no Jambo tab on the landing — the head's tabs are whole */
        check(`${at} · 4 — ${name}: the head's words are whole`, t && t.length && !bad.length, t ? (bad.map(x => `"${x.t}" cut`).join(', ') || t.map(x => x.t).join(' · ')) : 'no head');
      }
    }
    check('every probe ran', blocked.length === 0, blocked.slice(0, 3).join(' | ') || undefined);
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || undefined);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed — shots in ${OUT}`);
  process.exit(fail ? 1 : 0);
})();
