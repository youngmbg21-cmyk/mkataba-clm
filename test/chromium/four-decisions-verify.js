/* Chromium verification: THE OWNER'S FOUR DECISIONS (25 Oct 2026: "Q1 Legora way, Q2 Short words,
   Q3 Two lines, Q4 Skip"), measured at the three screens on the painted page.

     Q1  Jambo's ask list on the Board: every chart row ends in "Draw ›", whole, inside its row.
     Q2  A paper with a letter waiting: five tabs — Dossier · Send · Clauses · Redlines · Jambo — every
         word whole, "Email" (was "Send", owner 25 Oct 2026) carrying the whole name on hover, and the panel's › still in the panel.
     Q3  A long name takes two lines before "…": a person's contracts on People and the Dossier's
         "Who else" row; a one-line door row keeps its 44px.
     Q4  Skip: nothing built.

   Run: node test/chromium/four-decisions-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'four-decisions');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [
  { k: 'laptop-a', w: 1440, h: 780 },
  { k: 'laptop-b', w: 1536, h: 730 },
  { k: 'ipad', w: 1366, h: 950 },
];

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
    const until = async (fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
    const settle = async () => { await page.evaluate(() => document.fonts.ready).catch(() => {}); await page.waitForTimeout(400); };
    const clean = async () => {
      await page.keyboard.press('Escape').catch(() => {}); await page.keyboard.press('Escape').catch(() => {});
      await ev(() => { try { closeModal(); } catch (_) {} });
      await until(() => !document.querySelector('#modal-root .modal-in'), undefined, 3000);
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
    await until(() => document.querySelector('#hb-board .hb-card, #cn-page'), undefined, 15000);
    const reviewId = await ev(() => (state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]).id);

    for (const S of SCREENS) {
      await page.setViewportSize({ width: S.w, height: S.h });
      const at = S.k;
      const shot = n => page.screenshot({ path: path.join(OUT, `${S.k}-${n}.png`) }).catch(() => {});

      /* ---- Q1 · "Draw ›" on every chart row ---- */
      await clean(); await ev(() => { setView('dashboard'); try { hbSetFace('board'); } catch (_) {} });
      await until(() => document.querySelector('#igd-input') && typeof hbFace === 'function' && hbFace() === 'board');
      await page.click('#igd-input').catch(() => {});
      const pop = await until(() => document.querySelectorAll('#hb-askpop .hb-pop-opt').length >= 5);
      await settle(); await shot('q1-ask-list');
      if (!pop) check(`${at} · Q1 — the ask list opened`, false);
      else {
        const rows = await ev(() => [...document.querySelectorAll('#hb-askpop .hb-pop-opt')].map(r => {
          const go = r.querySelector('.hb-pop-go'), rb = r.getBoundingClientRect();
          if (!go) return { t: r.textContent.trim().slice(0, 20), go: null };
          const g = go.getBoundingClientRect(), who = r.querySelector('.who').getBoundingClientRect();
          return { t: r.querySelector('.who b').textContent, go: go.textContent.trim(), inside: g.right <= rb.right + 0.5 && g.left >= who.right - 0.5, cut: go.scrollWidth > go.clientWidth + 0.5 }; }));
        const bad = (rows || []).filter(x => x.go !== 'Draw ›' || !x.inside || x.cut);
        check(`${at} · Q1 — every chart row in Jambo's ask list ends in "Draw ›", whole, inside its row`, rows && rows.length >= 7 && !bad.length,
          bad.length ? bad.map(x => `${x.t}: ${x.go == null ? 'no act word' : x.go + (x.cut ? ' cut' : '') + (x.inside ? '' : ' outside')}`).join(' · ') : `${rows.length} rows`);
        await page.keyboard.press('Escape').catch(() => {});
      }

      /* ---- Q1b · every "/" list's place rows end in "Open ›" (25 Oct 2026, item 1 after the picks): one builder,
             three lists — the Board's, a list page's panel, and every other box's (Settings' Jambo) ---- */
      for (const [name, go, box, list, only] of [
        /* (Home's box went with Home, 10 Nov 2026: the Board's below is where you land) */
        /* the Board's list also carries its own moves (/compare, /trend…), which fill a question: no "Open" there */
        ['the Board', () => { setView('dashboard'); try { hbSetFace('board'); } catch (_) {} }, '#igd-input', '#hb-askpop', '[data-hb-pop-kind="place"]'],
        ['Approvals\' panel', () => setView('approvals'), '#jl-q', '[data-jl-pop]'],
        /* RE-POINTED 16 Nov 2026 (#762): Settings' Jambo box is the list panel's #jl-q, its "/" list the panel's own pop [data-jl-pop] */
        ['Settings\' Jambo box', () => openSettingsAt('you'), '#jl-q', '[data-jl-pop]'],
      ]){
        await clean(); await ev(go);
        const up = await until(sel => { const b = document.querySelector(sel); return !!(b && b.getBoundingClientRect().width); }, box);
        if (!up){ check(`${at} · Q1b — ${name}: its box is drawn`, false); continue; }
        await page.click(box).catch(() => {});
        await page.keyboard.type('/');
        const open = await until(sel => document.querySelectorAll(sel + ' .ca-opt').length >= 2, list, 5000);
        await settle();
        if (!open){ check(`${at} · Q1b — ${name}: "/" lists the places`, false); await page.keyboard.press('Backspace').catch(() => {}); continue; }
        const rows = await ev(([sel, only]) => [...document.querySelectorAll(sel + ' .ca-opt' + (only || ''))].filter(r => r.getBoundingClientRect().width).map(r => {
          const g = r.querySelector('.ca-go'), rb = r.getBoundingClientRect();
          return { t: (r.querySelector('.who b') || r).textContent.trim(), go: g ? g.textContent.trim() : null, inside: !!g && g.getBoundingClientRect().right <= rb.right + 0.5, cut: !!g && g.scrollWidth > g.clientWidth + 0.5 }; }), [list, only]);
        const bad = (rows || []).filter(x => x.go !== 'Open ›' || !x.inside || x.cut);
        if (S.k === 'laptop-a') await shot('q1b-' + name.replace(/\W+/g, '-').toLowerCase());
        check(`${at} · Q1b — ${name}: every "/" place row ends in "Open ›", whole, inside its row`, rows && rows.length >= 2 && !bad.length, bad.length ? bad.map(x => `${x.t}: ${x.go || 'no act word'}`).join(' · ') : `${rows.length} rows`);
        await page.keyboard.press('Backspace').catch(() => {});
      }

      /* ---- Q2 · five tabs with a letter waiting ---- */
      await clean(); await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
      await until(() => document.querySelector('#ig-paper'));
      await ev(id => openShareModal(getContract(id)), reviewId);
      await until(() => document.querySelector('#modal-root .modal-in[data-sh-page]'));
      await until(() => document.querySelector('#ig-dock .igd-head [data-pd-tab="copilot"]'), undefined, 4000);
      await page.click('#ig-dock .igd-head [data-pd-tab="copilot"]').catch(() => {});
      const five = await until(() => document.querySelector('#ig-dock .igd-head [data-pd-send-back]'), undefined, 5000);
      await settle(); await shot('q2-five-tabs');
      if (!five) check(`${at} · Q2 — the waiting letter's tab is drawn`, false, await ev(() => JSON.stringify({ modal: !!document.querySelector('#modal-root .modal-in[data-sh-page]'),
        tabs: [...document.querySelectorAll('#ig-dock .igd-head [data-pd-tab], #ig-dock .igd-head button')].map(b => (b.getAttribute('data-pd-tab') || b.id || '') + ':' + b.textContent.trim().slice(0, 14)) })));
      else {
        const m = await ev(() => { const hd = document.querySelector('#ig-dock > .igd-head'), dock = document.querySelector('#ig-dock').getBoundingClientRect();
          const tabs = [...hd.querySelectorAll(':scope > .pd-tab')].map(t => { const w = t.querySelector('.pd-tab-w') || t, r = document.createRange(); r.selectNodeContents(w);
            const tr = t.getBoundingClientRect(); return { t: w.textContent.trim(), cut: r.getBoundingClientRect().width > w.getBoundingClientRect().width + 0.5 || tr.right > dock.right }; });
          const send = hd.querySelector('[data-pd-send-back]'), x = document.getElementById('igd-collapse'), xr = x && x.getBoundingClientRect();
          return { tabs, word: send.textContent.trim(), tip: send.title, fold: !!xr && xr.width > 0 && xr.right <= dock.right && xr.left >= dock.left }; });
        const bad = m.tabs.filter(t => t.cut);
        /* RE-POINTED 28 Oct 2026 ("Door above the box"): no Jambo tab, so four */
        /* RE-POINTED 23 Nov 2026 (Dossier L+S step 2, PLAN THE READ): a paper not read yet that the reader may plan carries
           the Plan tab beside the Dossier (pd2PlanTabOn) — four tabs, and the fifth only when that rule says so */
        const planOn = await ev(id => typeof pd2PlanTabOn === 'function' && !!pd2PlanTabOn(getContract(id)), reviewId, false);
        /* RE-POINTED 24 Nov 2026 (owner: the Editor as a tab, as drawn): where the paper may be redlined (pdEdTabOn) the
           Editor tab stands too — counted only when that rule says so */
        const edOn = await ev(id => typeof pdEdTabOn === 'function' && !!pdEdTabOn(getContract(id)), reviewId, false);
        const want = 4 + (planOn ? 1 : 0) + (edOn ? 1 : 0), planDrawn = m.tabs.some(t => /^Plan\b/.test(t.t)), edDrawn = m.tabs.some(t => /^Editor\b/.test(t.t));
        check(`${at} · Q2 — four tabs (and Plan only where the paper may be planned), every word whole`, m.tabs.length === want && planDrawn === !!planOn && edDrawn === !!edOn && !bad.length, m.tabs.map(t => t.t + (t.cut ? ' (cut)' : '')).join(' · ') + (planOn ? ' · plan rule on' : '') + (edOn ? ' · editor rule on' : ''));
        check(`${at} · Q2 — the letter's tab says "Email" (owner, 25 Oct 2026: "calling the tab send makes no sense"), its hover the whole name`, m.word === 'Email' && m.tip === 'Before you send', `"${m.word}" · hover "${m.tip}"`);
        check(`${at} · Q2 — the panel's › stays in the panel`, m.fold);
      }
      await clean();

      /* RETIRED 16 Nov 2026 (#762): Q3 "the Dossier's Who else row reads whole" and "a one-line door row keeps its 44px" —
         the Dossier's door rows (.pd-ck-hd: Who else, Signer, …) were the old look's list; the new look's Dossier is ONE
         card (pd2CardHtml) with no such rows. The field-label line below still stands where any such row is drawn. */
      await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
      await settle(); await shot('q3-dossier');
      const labels = await ev(() => [...document.querySelectorAll('#ig-dock #pd-og.is-sap tr.pd-og-row:not(.is-saved):not(.is-door):not(.is-named) .pd-ck-hd')].filter(b => b.getBoundingClientRect().height).map(b => Math.round(b.getBoundingClientRect().height)));
      check(`${at} · Q3 — a field's label line above its box stays one 20px line`, labels && labels.every(x => x <= 21), JSON.stringify(labels));

      /* ---- Q3 · two lines: a person's contracts on People ---- */
      await clean(); await ev(() => setView('directory'));
      await until(() => document.querySelector('#content table tbody tr'));
      /* RE-POINTED 21 Nov 2026 (P-26, as drawn): the panel no longer lists "Named on, most recent" (Show their contracts
         opens them all); the agreements it names are in what waits on the person (.dirn-w-t) and the timeline of what
         they did (.dirn-tl li > button). The rule stands: each name whole in two lines or fewer. The rows are walked
         until a person whose panel names an agreement is chosen. */
      const NAMES = () => [...document.querySelectorAll('.ins-panel :is(.dirn-w-t, .dirn-tl li > button)')];
      await ev(`window.__q3names = ${NAMES.toString()}`);
      let list = false;
      const nRows = await ev(() => document.querySelectorAll('#dir-tbody [data-dir-row]').length, undefined, 0);
      for (let i = 1; i <= Math.min(nRows || 0, 12) && !list; i++){
        await page.click(`#dir-tbody [data-dir-row]:nth-child(${i}) .cun-name`).catch(() => {});
        list = await until(() => window.__q3names().length > 0, undefined, 1500);
      }
      /* RE-POINTED 22 Nov 2026 (P-26 review): the sample book's one person (the admin) has nothing in her timeline — no
         signature, ask or proposal names her — so no panel names an agreement and the rule had nothing to measure. Where
         the walk finds none, her signature is put on three of her agreements (the long "Regulatory" one first) in this
         page's memory only, and her panel's timeline then names them; the rule measured is unchanged */
      if (!list){
        await ev(() => { const me = currentUser(); const p = (dirBook() || []).find(x => x.side === 'ours' && String(x.email || '').toLowerCase() === String(me.email || '').toLowerCase()); if (!p) return;
          const cs = (p.contracts || []).map(id => getContract(id)).filter(Boolean).sort((a, b) => (/Regulatory/.test(b.name) ? 1 : 0) - (/Regulatory/.test(a.name) ? 1 : 0)).slice(0, 3);
          cs.forEach((c, i) => { c.signatures = (Array.isArray(c.signatures) ? c.signatures : []).concat([{ name: me.name, email: me.email, at: new Date(Date.now() - (i + 1) * 864e5).toISOString() }]); });
          renderDirectory(); });
        await page.click('#dir-tbody [data-dir-row]:first-child .cun-name').catch(() => {});
        list = await until(() => window.__q3names().length > 0, undefined, 3000);
      }
      await settle(); await shot('q3-people');
      if (!list) check(`${at} · Q3 — People: a person's contracts are listed`, false);
      else {
        const ns = await ev(() => window.__q3names().map(n => ({ t: n.textContent.trim(), lines: Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight || 20)), cut: n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1 })));
        const bad = ns.filter(x => x.cut || x.lines > 2);
        const long = ns.find(x => /Regulatory/.test(x.t));
        check(`${at} · Q3 — People: every contract name whole in two lines or fewer`, ns.length && !bad.length && (!long || !long.cut), bad.map(x => `"${x.t}" ${x.cut ? 'cut' : x.lines + ' lines'}`).join(' · ') || ns.map(x => `${x.t.slice(0, 22)}… ${x.lines}`).join(' · '));
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
