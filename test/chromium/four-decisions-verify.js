/* Chromium verification: THE OWNER'S FOUR DECISIONS (25 Oct 2026: "Q1 Legora way, Q2 Short words,
   Q3 Two lines, Q4 Skip"), measured at the three screens on the painted page.

     Q1  Jambo's ask list on the Board: every chart row ends in "Draw ›", whole, inside its row.
     Q2  A paper with a letter waiting: five tabs — Dossier · Send · Clauses · Redlines · Jambo — every
         word whole, "Send" carrying the whole name on hover, and the panel's › still in the panel.
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

      /* ---- Q2 · five tabs with a letter waiting ---- */
      await clean(); await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
      await until(() => document.querySelector('#ig-paper'));
      await ev(id => openShareModal(getContract(id)), reviewId);
      await until(() => document.querySelector('#modal-root .modal-in[data-sh-page]'));
      await until(() => document.querySelector('#ig-dock .igd-head [data-pd-tab="copilot"]'), undefined, 4000);
      await page.click('#ig-dock .igd-head [data-pd-tab="copilot"]').catch(() => {});
      const five = await until(() => document.querySelector('#ig-dock .igd-head [data-pd-send-back]'), undefined, 5000);
      await settle(); await shot('q2-five-tabs');
      if (!five) check(`${at} · Q2 — the waiting letter's tab is drawn`, false);
      else {
        const m = await ev(() => { const hd = document.querySelector('#ig-dock > .igd-head'), dock = document.querySelector('#ig-dock').getBoundingClientRect();
          const tabs = [...hd.querySelectorAll(':scope > .pd-tab')].map(t => { const w = t.querySelector('.pd-tab-w') || t, r = document.createRange(); r.selectNodeContents(w);
            const tr = t.getBoundingClientRect(); return { t: w.textContent.trim(), cut: r.getBoundingClientRect().width > w.getBoundingClientRect().width + 0.5 || tr.right > dock.right }; });
          const send = hd.querySelector('[data-pd-send-back]'), x = document.getElementById('igd-collapse'), xr = x && x.getBoundingClientRect();
          return { tabs, word: send.textContent.trim(), tip: send.title, fold: !!xr && xr.width > 0 && xr.right <= dock.right && xr.left >= dock.left }; });
        const bad = m.tabs.filter(t => t.cut);
        check(`${at} · Q2 — five tabs, every word whole`, m.tabs.length === 5 && !bad.length, m.tabs.map(t => t.t + (t.cut ? ' (cut)' : '')).join(' · '));
        check(`${at} · Q2 — the letter's tab says "Send", its hover the whole name`, m.word === 'Send' && m.tip === 'Before you send', `"${m.word}" · hover "${m.tip}"`);
        check(`${at} · Q2 — the panel's › stays in the panel`, m.fold);
      }
      await clean();

      /* ---- Q3 · two lines: the Dossier's door rows ---- */
      await ev(id => pdOpenOnHome(id, 'copilot'), reviewId);
      await until(() => [...document.querySelectorAll('#ig-dock .pd-ck-hd')].some(b => /Who else/.test(b.textContent)));
      await ev(() => { const b = [...document.querySelectorAll('#ig-dock .pd-ck-hd')].find(x => /Who else/.test(x.textContent)); if (b) b.scrollIntoView({ block: 'center' }); });
      await settle(); await shot('q3-dossier');
      const who = await ev(() => { const b = [...document.querySelectorAll('#ig-dock button.pd-ck-hd')].find(x => /Who else/.test(x.textContent)); if (!b) return null;
        const parts = [b.querySelector(':scope > b'), b.querySelector(':scope > .pd-ck-v')].filter(Boolean);
        return { cut: parts.filter(p => p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1).map(p => p.textContent.trim()), lines: parts.map(p => Math.round(p.getBoundingClientRect().height / 20)) }; });
      check(`${at} · Q3 — the Dossier's "Who else" row reads whole, two lines at most`, who && !who.cut.length && who.lines.every(n => n <= 2), JSON.stringify(who));
      const one = await ev(() => [...document.querySelectorAll('#ig-dock tr:is(.is-saved, .is-door, .is-named) button.pd-ck-hd')].filter(b => b.getBoundingClientRect().height && [...b.children].every(c => c.getBoundingClientRect().height <= 21)).map(b => Math.round(b.getBoundingClientRect().height)));
      check(`${at} · Q3 — a one-line door row keeps its 44px`, one && one.length && one.every(x => x === 44), JSON.stringify(one));
      const labels = await ev(() => [...document.querySelectorAll('#ig-dock #pd-og.is-sap tr.pd-og-row:not(.is-saved):not(.is-door):not(.is-named) .pd-ck-hd')].filter(b => b.getBoundingClientRect().height).map(b => Math.round(b.getBoundingClientRect().height)));
      check(`${at} · Q3 — a field's label line above its box stays one 20px line`, labels && labels.every(x => x <= 21), JSON.stringify(labels));

      /* ---- Q3 · two lines: a person's contracts on People ---- */
      await clean(); await ev(() => setView('directory'));
      await until(() => document.querySelector('#content table tbody tr'));
      await page.click('#content table tbody tr').catch(() => {});
      const list = await until(() => document.querySelector('.ins-panel .jl-ct-list .dir-ct-n'), undefined, 6000);
      await settle(); await shot('q3-people');
      if (!list) check(`${at} · Q3 — People: a person's contracts are listed`, false);
      else {
        const ns = await ev(() => [...document.querySelectorAll('.ins-panel .jl-ct-list .dir-ct-n')].map(n => ({ t: n.textContent.trim(), lines: Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight || 20)), cut: n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1 })));
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
