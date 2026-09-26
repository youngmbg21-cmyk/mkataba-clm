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
   pass on both sides by design and are named. AT THE PARENT (486b7b0) 27 of
   31 FAIL — the page has no panel, a press opens the contract, the heads
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
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

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
      const id = pickTwo[1].id, _sk = window.sharesKnown, _cs = window.cachedShares, _ss = window.standingShares;
      window.sharesKnown = c => (c && c.id === id) ? true : _sk(c);
      window.cachedShares = c => (c && c.id === id) ? [{ token: 'stub-' + id, durable: true }] : _cs(c);
      window.standingShares = l => (l || []).some(x => x && String(x.token || '').startsWith('stub-')) ? l : _ss(l);
      return { you: pickTwo[0].id, them: pickTwo[1].id, youCp: pickTwo[0].counterparty };
    });
    ok('the stage: two live negotiations, one waiting on us and one with them', !!staged, JSON.stringify(staged));

    /* ================= 1 · CONTRACTS, IN THE INSPECTOR'S SHAPE ================= */
    const toContracts = async () => { await page.evaluate(() => { regSetScope(null); setView('register'); }); await page.waitForTimeout(1000); };
    await toContracts();
    const shape = await page.evaluate(() => ({
      ins: document.querySelector('[data-ins-page]') ? document.querySelector('[data-ins-page]').getAttribute('data-ins') : null,
      heads: [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent.replace(/[▲▼↕]/g, '').trim()),
      panel: !!document.getElementById('ins-panel'),
      sel: (document.querySelector('#reg-tbody tr.is-sel') || { getAttribute: () => null }).getAttribute('data-row'),
      pid: (document.getElementById('ins-panel') || { getAttribute: () => null }).getAttribute('data-ins-id'),
    }));
    ok('1a Contracts at 1440 draws the list and the panel beside it', shape.ins === '1' && shape.panel, JSON.stringify({ ins: shape.ins, panel: shape.panel }));
    ok('1b the list is four columns, in plain words', shape.heads.join('|') === 'Ref|Counterparty and agreement|Stage|Value', shape.heads.join(' | '));
    ok('1c the first row is chosen on arrival and the panel names it', !!shape.sel && shape.sel === shape.pid, `row ${shape.sel} · panel ${shape.pid}`);
    await page.screenshot({ path: path.join(OUT, '1-contracts-1440.png') });

    const rows = await page.$$('#reg-tbody tr[data-row]');
    if (rows.length > 2 && shape.panel) {
      const id3 = await rows[2].getAttribute('data-row');
      await rows[2].click(); await page.waitForTimeout(300);
      const after = await page.evaluate(() => ({ view: state.view, pid: document.getElementById('ins-panel').getAttribute('data-ins-id'),
        sel: document.querySelector('#reg-tbody tr.is-sel').getAttribute('data-row') }));
      ok('1d a press SELECTS — the panel follows and nothing opens', after.view === 'register' && after.pid === id3 && after.sel === id3, JSON.stringify(after));
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
      const arrow = await page.evaluate(() => document.getElementById('ins-panel').getAttribute('data-ins-id'));
      const id4 = await rows[3].getAttribute('data-row');
      ok('1e the arrow key moves the selection, and the panel with it', arrow === id4, `${id3} → ${arrow}`);
      await page.click('#ins-panel [data-ins-act="open"]'); await page.waitForTimeout(900);
      const opened = await page.evaluate(() => ({ view: state.view, id: state.activeId }));
      ok('1f the panel’s Open contract opens that contract', opened.view === 'workspace' && opened.id === id4, JSON.stringify(opened));
      await toContracts();
      const rows2 = await page.$$('#reg-tbody tr[data-row]');
      const id2 = await rows2[1].getAttribute('data-row');
      await rows2[1].dblclick(); await page.waitForTimeout(900);
      const dbl = await page.evaluate(() => ({ view: state.view, id: state.activeId }));
      ok('1g a double-click opens it', dbl.view === 'workspace' && dbl.id === id2, JSON.stringify(dbl));
      await toContracts();
      await page.focus('#reg-tbody tr.is-sel'); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      const ent = await page.evaluate(() => ({ view: state.view }));
      ok('1h Enter opens it', ent.view === 'workspace', JSON.stringify(ent));
      await toContracts();
    } else {
      for (const n of ['1d a press SELECTS', '1e the arrow key moves the selection', '1f the panel’s Open contract opens that contract', '1g a double-click opens it', '1h Enter opens it'])
        ok(n, false, 'no panel on the page to drive');
    }

    /* the floor, on the screen */
    const floor = await page.evaluate(() => {
      const rowsText = [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(r => r.innerText).join('\n');
      const heads = [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent);
      const mk = document.querySelector('#reg-tbody tr:not(.is-sel) .reg-mk');
      const selMk = document.querySelector('#reg-tbody tr.is-sel .reg-mk');
      const tok = v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;color:var(' + v + ')'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
      const filled = [...document.querySelectorAll('#page-head button, #content button')].filter(b => {
        const r = b.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
        const cs = getComputedStyle(b); return cs.backgroundColor === tok('--accent-fill').replace('rgb(', 'rgb(') && cs.color === 'rgb(255, 255, 255)'; });
      const bgOf = el => getComputedStyle(el).backgroundColor;
      return {
        amp: /&amp;/.test(rowsText), nm: /\bn\/m\b/.test(rowsText),
        facts: (document.getElementById('reg-head-facts') || {}).textContent || '',
        zeroCounts: [...document.querySelectorAll('.reg-vtab.is-zero .n')].length,
        zeroTabs: document.querySelectorAll('.reg-vtab.is-zero').length,
        idle: heads.some(t => /↕/.test(t)),
        mkInk: mk ? getComputedStyle(mk).color : null, selInk: selMk ? getComputedStyle(selMk).color : null,
        accent: tok('--accent-ink'),
        filled: filled.map(b => b.innerText.trim()),
        barInCard: !!document.querySelector('.reg-card > .reg-filterbar'),
        bandBg: document.querySelector('.reg-band') ? bgOf(document.querySelector('.reg-band')) : null,
      };
    });
    ok('1i a name prints "&", never "&amp;"', !floor.amp);
    ok('1j "Non-monetary", never "n/m"', !floor.nm);
    ok('1k the head counts the live book, and says so', /\blive\b/.test(floor.facts), floor.facts);
    ok('1l a view with nothing in it prints no count', floor.zeroTabs > 0 && floor.zeroCounts === 0, `${floor.zeroTabs} quiet tabs, ${floor.zeroCounts} counts on them`);
    ok('1m no idle sort arrows', !floor.idle);
    ok('1n the resting reference is not an accent; the selected one is', floor.mkInk && floor.mkInk !== floor.accent && floor.selInk === floor.accent,
      `resting ${floor.mkInk} · selected ${floor.selInk} · accent ${floor.accent}`);
    ok('1o one filled button on the page', floor.filled.length === 1, floor.filled.join(' | '));
    ok('1p the filters are the list’s own card’s top row; the band paints no ground', floor.barInCard && /rgba\(0, 0, 0, 0\)|transparent/.test(String(floor.bandBg)),
      `bar in card ${floor.barInCard} · band ${floor.bandBg}`);

    /* the one line, at every laptop width, in both languages */
    const lineRep = [];
    for (const lang of ['en', 'sv']) {
      const b = await page.$('.lang-btn[data-lang="' + lang + '"]'); if (b) { await b.click(); await page.waitForTimeout(700); }
      for (const W of [1104, 1280, 1440, 1920]) {
        await page.setViewportSize({ width: W, height: 900 }); await toContracts();
        const m = await page.evaluate(() => {
          const bar = document.querySelector('.reg-card > .reg-filterbar'), sc = document.getElementById('reg-scroll');
          /* a line is counted off the CENTRES of the things a reader sees.
             The row's spacer is a zero-HEIGHT box with a width, centred on
             the line — counted by its top it read as a second line at every
             width while every chip sat at one top (measured). A box with no
             height occupies no line. */
          const chips = bar ? [...bar.children].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) : [];
          const mids = new Set(chips.map(x => { const r = x.getBoundingClientRect(); return Math.round((r.top + r.height / 2) / 6); }));
          return { ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'), lines: chips.length ? mids.size : 0,
            fits: sc ? sc.scrollWidth <= sc.clientWidth + 1 : false, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        lineRep.push({ lang, W, ...m });
      }
    }
    const bad = lineRep.filter(r => r.ins !== '1' || r.lines !== 1 || !r.fits || r.over > 0);
    ok('1q the filter row is one line and the list fits its pane, 1104–1920, both languages', bad.length === 0,
      bad.length ? JSON.stringify(bad) : `${lineRep.length} measured`);
    const back = await page.$('.lang-btn[data-lang="en"]'); if (back) { await back.click(); await page.waitForTimeout(700); }
    await page.setViewportSize({ width: 1440, height: 900 }); await toContracts();

    /* the Display menu */
    const disp = await page.$('#reg-display');
    if (disp) {
      await disp.click(); await page.waitForTimeout(150);
      const open = await page.evaluate(() => !document.getElementById('reg-display-pop').hidden);
      await page.click('button[data-reg-density="comfortable"]'); await page.waitForTimeout(500);
      const dens = await page.evaluate(() => regDensity());
      await page.click('#reg-display'); await page.click('button[data-reg-density="compact"]'); await page.waitForTimeout(500);
      await page.click('#reg-display'); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      const shut = await page.evaluate(() => document.getElementById('reg-display-pop').hidden);
      ok('1r Display opens, sets the row density, and Escape shuts it', open && dens === 'comfortable' && shut, JSON.stringify({ open, dens, shut }));
    } else ok('1r Display opens, sets the row density, and Escape shuts it', false, 'no Display control');

    /* ================= 2 · NEGOTIATIONS ================= */
    await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1200);
    const ng = await page.evaluate(() => ({
      ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'),
      heads: [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent.replace(/[▲▼↕]/g, '').trim()),
      moves: [...document.querySelectorAll('#reg-tbody tr[data-row] .ngl-w')].map(x => x.textContent.trim()),
      bands: [...document.querySelectorAll('#reg-tbody .ngl-band-k')].map(x => x.textContent.trim()),
      views: !!document.querySelector('.reg-views'),
      first: document.getElementById('ins-panel') ? [...document.getElementById('ins-panel').children].map(x => x.className)[1] : null,
      table: document.querySelector('#ins-panel .ins-table') ? document.querySelector('#ins-panel .ins-table').innerText : '',
    }));
    ok('2a Negotiations draws the list and the panel, with whose move as the third column', ng.ins === '1'
      && ng.heads.join('|') === 'Ref|Counterparty and agreement|Whose move|Value', ng.heads.join(' | '));
    ok('2b whose move carries the fact behind it', ng.moves.some(m => /^Yours · \d+ changes?$/.test(m)) && ng.moves.some(m => /^Theirs · (\d+ days?|today)$/.test(m)), ng.moves.join(' | '));
    ok('2c only the groups that have rows are drawn, and no Contracts views', !ng.bands.includes('Nothing outstanding') && !ng.views, ng.bands.join(' | '));
    ok('2d the panel leads with what is on the table', ng.first === 'ins-sec ins-table' && /Round \d+ · \d+/.test(ng.table) && /from .+ · \d+ days?/.test(ng.table),
      `${ng.first} · ${ng.table.replace(/\s+/g, ' ').slice(0, 120)}`);
    await page.screenshot({ path: path.join(OUT, '2-negotiations-1440.png') });

    /* ================= 3 · APPROVALS & SIGNING ================= */
    await page.evaluate(() => setView('approvals')); await page.waitForTimeout(1000);
    const ap = await page.evaluate(() => ({
      ins: document.querySelector('[data-ins-page="approvals"]')?.getAttribute('data-ins'),
      rows: [...document.querySelectorAll('.ap-table tbody tr[data-ap-row]')].map(r => r.getAttribute('data-ap-row')),
      buttons: document.querySelectorAll('.ap-table [data-ap-open]').length,
      pid: document.getElementById('ins-panel')?.getAttribute('data-ins-id'),
      lead: document.querySelector('#ins-panel [data-ins-act]')?.innerText.trim(),
    }));
    ok('3a Approvals draws the list and the panel; the row buttons moved into it', ap.ins === '1' && ap.buttons === 0 && !!ap.pid, JSON.stringify({ ins: ap.ins, buttons: ap.buttons, pid: ap.pid }));
    await page.screenshot({ path: path.join(OUT, '3-approvals-1440.png') });
    if (ap.rows.length > 1 && ap.pid) {
      await page.click(`.ap-table tbody tr[data-ap-row="${ap.rows[1]}"]`); await page.waitForTimeout(300);
      const s = await page.evaluate(() => ({ view: state.view, pid: document.getElementById('ins-panel').getAttribute('data-ins-id') }));
      ok('3b a press selects on Approvals too', s.view === 'approvals' && s.pid === ap.rows[1], JSON.stringify(s));
      await page.click('#ins-panel [data-ins-act]'); await page.waitForTimeout(1200);
      const g = await page.evaluate(() => ({ view: state.view, id: state.activeId, tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null }));
      ok('3c the panel’s lead act opens that contract on its Signing tab', g.view === 'workspace' && g.id === ap.rows[1] && (g.tab === 'sign' || g.tab == null), JSON.stringify(g));
    } else {
      ok('3b a press selects on Approvals too', false, 'fewer than two approval rows, or no panel');
      ok('3c the panel’s lead act opens that contract on its Signing tab', false, 'nothing to press');
    }

    /* ================= 4 · BELOW THE LINE, AND A WIDTH THAT CROSSES IT ================= */
    await page.setViewportSize({ width: 1024, height: 800 }); await toContracts();
    const narrow = await page.evaluate(() => ({ ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'), panel: !!document.getElementById('ins-panel'),
      heads: document.querySelectorAll('.reg-table thead th').length, keys: REG_COL_KEYS.length }));
    ok('4a [control] at 1024 the page keeps its full table', narrow.ins !== '1' && !narrow.panel && narrow.heads === narrow.keys, JSON.stringify(narrow));
    const nrow = await page.$('#reg-tbody tr[data-row]');
    const nid = nrow ? await nrow.getAttribute('data-row') : null;
    if (nrow) { await nrow.click(); await page.waitForTimeout(900); }
    const nopen = await page.evaluate(() => ({ view: state.view, id: state.activeId }));
    ok('4b [control] and one press opens there, as it always did', nopen.view === 'workspace' && nopen.id === nid, JSON.stringify(nopen));
    await toContracts();
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(700);
    const grown = await page.evaluate(() => ({ ins: document.querySelector('[data-ins-page]')?.getAttribute('data-ins'), view: state.view }));
    ok('4c widening the window past the line repaints the page into the inspector’s shape', grown.ins === '1' && grown.view === 'register', JSON.stringify(grown));

    /* ================= 5 · NIGHT ================= */
    await page.evaluate(() => { setDark(true); applyAppearance(); }); await toContracts();
    const night = await page.evaluate(() => {
      const p = document.getElementById('ins-panel'); if (!p) return null;
      const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
      const bg = getComputedStyle(p).backgroundColor;
      const cp = getComputedStyle(p.querySelector('.ins-cp')).color, dt = getComputedStyle(p.querySelector('.ins-facts dt')).color;
      return { bg, cp: ratio(cp, bg), dt: ratio(dt, bg) };
    });
    ok('5a at night the panel is the dark surface and its words read (AA)', !!night && night.cp >= 4.5 && night.dt >= 4.5, JSON.stringify(night));
    await page.screenshot({ path: path.join(OUT, '5-contracts-night.png') });
    await page.evaluate(() => { setDark(false); applyAppearance(); });

    ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
