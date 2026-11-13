/* THE FILL IN FORM, THE LEGORA WAY (owner, 12 Nov 2026: three options drawn — The SAP Way, The Legora Way, One at a Time —
   and "Build The Legora Way"). New look on, the form opened in the middle on a paper with three things owed:
     1 · one quiet list: what is owed first, each with its amber dot; then what stands, each "§ n · quoted words" where read;
         the line under the title says how many are needed and ready
     2 · the chips All · Needed · Read from the paper narrow the rows (nothing saved, nothing moved)
     3 · Jambo's side names what is owed and the box asks "Tell Jambo the missing details…"
     4 · a sentence typed there is read through the one fill route (stood in here: no key), said under "You said" with what
         was found; Put all in fills the rows, writes NOTHING to the record; the foot counts "3 of 3 filled"
     5 · Save before Discard in the foot; Save stores what was put in
     6 · the owner's three screens: the chips and the foot each on one line, nothing sideways
   At the parent 1–5 fail: grouped heads Arrive · Fill · Sign, no chips, "As you type" beside it, the box asks about the contract.
   Run: node test/chromium/form-the-legora-way-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const OUT = path.join(__dirname, 'shots', 'form-the-legora-way');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const ID = 'MK-E1';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const open = async (W, H) => {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    /* the sign-in's own landing on the Board is waited for first, or it paints over the contract */
    await until(page, id => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract(id) && window._cnSignedIn === false, ID, 40000);
    await page.evaluate(async id => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand(id); }, ID);
    await until(page, () => typeof pdOnPaper === 'function' && pdOnPaper(), null, 20000);
    await page.evaluate(id => { try { pd2WalkClose(); } catch (_) {} pdFillOpen(id); }, ID);
    const up = await until(page, () => !!document.querySelector('[data-pd-mid^="form:"] #pd-og.is-form'), null, 15000);
    return { page, up };
  };
  try {
    let { page, up } = await open(1440, 780);
    await until(page, () => !!document.querySelector('[data-pd-mid^="form:"] .pd2-fm-chips button'), null, 5000);
    /* 1 */
    const L = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-list > tr')];
      const owed = rows.map(r => r.hasAttribute('data-pd2-owed')), firstKnown = owed.indexOf(false);
      const dot = r => getComputedStyle(r.querySelector('td.pd-og-f b'), '::before').backgroundColor;
      return { heads: document.querySelectorAll('[data-pd-mid^="form:"] .pd-fm-gh').length, n: rows.length, owed: owed.filter(Boolean).length,
        owedFirst: firstKnown > 0 && owed.slice(firstKnown).every(x => !x), dot: rows[0] ? dot(rows[0]) : '',
        cp: ((document.querySelector('[data-pd-mid^="form:"] tr[data-pd2-known="counterparty"] td.pd-og-a') || {}).textContent || '').trim(),
        under: ((document.getElementById('pd2-fm-under') || {}).textContent || '').trim() };
    });
    check('1 one quiet list: owed first with an amber dot, no group heads, "§ · quote" where read, needed and on record said',
      up && L.heads === 0 && L.owed === 3 && L.owedFirst && /rgb\(201, 138, 20\)/.test(L.dot) && /^§ \d+ · /.test(L.cp) && /3 needed · \d+ on record$/.test(L.under), L);
    /* 1b — THE ROW AS DRAWN (owner, 13 Nov 2026): every answer on one width and one height, the sentence under the name,
       one quiet line over what already stands, a tick only where there is an answer */
    const R = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-list > tr:not(.pd2-fm-sep)')];
      const box = r => r.querySelector('td.pd-og-v').getBoundingClientRect();
      const ins = [...document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-list td.pd-og-v :is(input:not([type=checkbox]), select, textarea, .dp-face)')].filter(e => e.getClientRects().length);
      const tick = r => getComputedStyle(r, '::after').visibility;
      return { lefts: [...new Set(rows.map(r => Math.round(box(r).left)))].length, widths: [...new Set(rows.map(r => Math.round(box(r).width)))],
        tall: ins.filter(e => e.getBoundingClientRect().height > 36).length, under: rows.filter(r => { const f = r.querySelector('td.pd-og-f'), a = r.querySelector('td.pd-og-a'); return a && a.getClientRects().length && a.getBoundingClientRect().top < f.getBoundingClientRect().bottom - 1; }).length,
        sep: document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-list > tr.pd2-fm-sep').length,
        ticks: rows.filter(r => r.hasAttribute('data-pd2-owed') && tick(r) !== 'hidden').length, known: rows.filter(r => !r.hasAttribute('data-pd2-owed') && tick(r) !== 'visible').length };
    });
    check('1b every answer starts on one edge at one width (300) and one height; the source line under its name; one line over what stands; ticks only on answers',
      R.lefts === 1 && R.widths.length === 1 && R.widths[0] === 300 && R.tall === 0 && R.under === 0 && R.sep === 1 && R.ticks === 0 && R.known === 0, R);
    /* 2 */
    const chips = await page.evaluate(() => [...document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-chip')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
    await page.click('[data-pd2-fm-chip="need"]').catch(() => {});
    const shownNeed = await page.evaluate(() => [...document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-list > tr')].filter(r => r.getClientRects().length).length);
    await page.click('[data-pd2-fm-chip="all"]').catch(() => {});
    const shownAll = await page.evaluate(() => [...document.querySelectorAll('[data-pd-mid^="form:"] .pd2-fm-list > tr')].filter(r => r.getClientRects().length).length);
    check('2 the chips All · Needed · Read from the paper narrow the rows and give them back',
      chips.length === 3 && /^All \d+$/.test(chips[0]) && chips[1] === 'Needed 3' && /^Read from the paper \d+$/.test(chips[2]) && shownNeed === 3 && shownAll === L.n, { chips, shownNeed, shownAll });
    /* 3 */
    const S = await page.evaluate(() => ({ side: ((document.querySelector('#ig-dock .pd2-fmj') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      ph: (document.getElementById('igd-input') || {}).placeholder || '' }));
    check('3 Jambo names what is owed and asks for it in one sentence; the box says so', /3 things are owed/.test(S.side) && /their signer/i.test(S.side) && S.ph === 'Tell Jambo the missing details…', S);
    await page.screenshot({ path: path.join(OUT, 'form.png') });
    /* 4 — Jambo's answer stood in (no key in the check); the route is the one fill route, with the sentence as `said` */
    await page.evaluate(() => { state.aiConfigured = true; const o = window.api;
      window.api = async function (p, m, body, opts){ if (p === 'ai/fill'){ window.__fill = body;
        const pick = k => (body.blanks || []).find(b => b.key === k);
        const date = (body.blanks || []).find(b => b.type === 'date'), text = (body.blanks || []).find(b => b.type === 'text' && b.key.indexOf('signer:') !== 0);
        return { fields: [date && { key: date.key, value: '2026-12-01' }, text && { key: text.key, value: 'refined sugar' }, pick('signer:name') && { key: 'signer:name', value: 'Wanjiru Otieno' }, pick('signer:email') && { key: 'signer:email', value: 'wanjiru@pixel.co.ke' }].filter(Boolean) }; }
        return o.call(this, p, m, body, opts); }; });
    const rec = () => page.evaluate(async id => { const r = await api('contracts/' + id); const c = r.contract || r; return JSON.stringify([c.fields || {}, c.signerPlan || [], c.effectiveDate || c.effective || '']); }, ID);
    const before = await rec();
    await page.fill('#igd-input', 'Starts 1 Dec 2026, it is refined sugar, Wanjiru Otieno signs for them at wanjiru@pixel.co.ke');
    await page.press('#igd-input', 'Enter');
    const said = await until(page, () => !!document.querySelector('#ig-dock [data-pd2-fmj-put]'), null, 8000);
    const Y = await page.evaluate(() => ({ said: (window.__fill || {}).said || '', you: ((document.querySelector('#ig-dock .pd2-fmj-you') || {}).textContent || '').replace(/\s+/g, ' ').trim() }));
    if (said) await page.click('#ig-dock [data-pd2-fmj-put]');
    await page.waitForTimeout(400);
    const P = await page.evaluate(() => ({ foot: ((document.querySelector('[data-pd-mid^="form:"] [data-pd2-fm-say]') || {}).textContent || '').trim(),
      name: ((document.querySelector('[data-pd-mid^="form:"] [data-pd-og-sg="tname"]') || {}).value || '') }));
    await page.waitForTimeout(1200);
    const after = await rec();
    check('4 a sentence goes to the one fill route as what was said; Put all in fills the rows and stores nothing',
      said && /Starts 1 Dec 2026/.test(Y.said) && /You said/.test(Y.you) && /1 December 2026/.test(Y.you) && /^3 of 3 filled · nothing is saved until Save$/.test(P.foot) && P.name === 'Wanjiru Otieno' && after === before, { said, Y, P, same: after === before });
    await page.screenshot({ path: path.join(OUT, 'put.png') });
    /* 5 */
    const F = await page.evaluate(() => { const f = document.querySelector('[data-pd-mid^="form:"] .pd-fm-f'); const bs = [...f.querySelectorAll('.ui-btn')].filter(b => b.getClientRects().length);
      return bs.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(b => b.textContent.trim()); });
    await page.click('[data-pd-mid^="form:"] [data-pd-fm-save]');
    const stored = await until(page, id => { const c = getContract(id); return !document.querySelector('[data-pd-mid]') && /refined sugar/.test(JSON.stringify(c.fields || {})); }, ID, 10000);
    check('5 Save before Discard; Save stores what was put in', F.join() === 'Save,Discard' && stored, { F, stored });
    await page.close();
    /* 6 */
    for (const [nm, W, H] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      ({ page, up } = await open(W, H));
      await until(page, () => !!document.querySelector('[data-pd-mid^="form:"] .pd2-fm-chips button'), null, 5000);
      const G = await page.evaluate(() => { const ch = document.querySelector('[data-pd-mid^="form:"] .pd2-fm-chips'), f = document.querySelector('[data-pd-mid^="form:"] .pd-fm-f');
        const one = el => { if (!el) return false; const tops = new Set([...el.children].filter(x => x.getClientRects().length).map(x => Math.round(x.getBoundingClientRect().top))); return tops.size === 1; };
        return { chips: one(ch), foot: f ? [...f.querySelectorAll('.ui-btn')].every(b => b.getBoundingClientRect().height < 40) : false, side: document.documentElement.scrollWidth - innerWidth }; });
      check(`6 ${nm} the chips and the foot each on one line, nothing sideways`, up && G.chips && G.foot && G.side <= 0, G);
      await page.screenshot({ path: path.join(OUT, `screen-${nm}.png`) });
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
