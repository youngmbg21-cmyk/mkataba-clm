/* Chromium verification: THE BOARD UPGRADE — CHART QUALITY G1–G10
   (the owner's "Build" over the Board Upgrade Proposals, 10 Oct 2026)
   ============================================================
   On Home's board, the whole book by month signed, as a person uses it:
     1. G1 hovering a column lights it and steps the others back; nothing is
        outlined (the owner: "there should not be a black line outline during
        the press"); pressing brightens it, still with no line;
     2. G4 the hover card shows beside the piece: its share, the change from
        the month before, and "Open these N" — N the list the piece opens;
     3. G2 a fitted column sits on whole pixels; grid lines are crisp;
     4. G5 opened: Lines → Average and a typed Target are drawn; a word that
        is not a number is refused and said;
     5. G9 opened: Copy table puts the rows on the clipboard as a table;
        Copy as image copies (or saves) a picture and says so;
     6. G8 the four new pictures each draw on the board, no words outside the
        chart, every piece a door;
     7. G10 a card with one bar says its number plainly, with the views that
        would draw a real picture;
     8. the hover photographed on the dark board too; no page errors.
   Waits ask for the state, bounded.
   Screenshots: test/chromium/shots/board-upgrade/ (or HATI_SHOT_DIR).
   Run: node test/chromium/board-upgrade-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-upgrade');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SIGNED = [];
const add = (id, signed, raised, kind) => { const c = fixtureContract(id, 'Supply ' + id, 'Juno AB', 'proc', 1e6, 'Signed'); c.signedAt = signed; c.createdAt = raised; c.audit = [{ action: 'Created', at: raised + 'T09:00:00.000Z' }]; c.kind = kind; c.expiry = dayIn(7 + (SIGNED.length % 9), 15); SIGNED.push(c); };
for (let k = 0; k < 4; k++) add('MK-E' + k, dayIn(-8 - k, 20), dayIn(-9 - k, 2), 'Lease');
for (let k = 0; k < 9; k++) add('MK-J' + k, dayIn(-3, 3 + k), dayIn(-4, 1 + k), 'Supply');
for (let k = 0; k < 12; k++) add('MK-A' + k, dayIn(-2, 3 + k), dayIn(-2, 1), k % 2 ? 'Supply' : 'Services');
const BOOK = FIXTURES.concat(SIGNED);
const KEY = 'q:contracts by month signed';
const RECIPE = { which: 'all', pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'count' };

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); } catch (_){}
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const boardOne = async (id, key, R, which) => {
    await page.evaluate(({ id, key, R, which }) => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.path = []; s.digBig = false;
      s.panels = [Object.assign({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: true }, which ? { which } : {})];
      hbSave(); hbCardSet(key, JSON.parse(JSON.stringify(R)), { seed: true }); hbPaintBoard(); }, { id, key, R, which });
    const sel = `[data-hb-pid="${id}"]`;
    await until(s => !!document.querySelector(s + ' .hb-svg, ' + s + ' .hb-small, ' + s + ' .hb-chart'), sel);
    for (let k = 0; k < 2; k++){
      await page.evaluate(s => { const c = document.querySelector(s); if (!c) return; c.style.gridColumn = '1 / -1'; hbFitMeasure(); }, sel);
      await until(s => { const svg = document.querySelector(s + ' svg.hb-svg'); return !svg || Math.abs(Number(svg.getAttribute('data-hb-w')) - svg.getBoundingClientRect().width) <= 8; }, sel);
    }
    return sel;
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), SIGNED.map(c => c.id), { timeout: 20000 });
    if (!(await page.evaluate(() => typeof hbTipShow === 'function'))) throw new Error('this build has no hover card');
    await page.evaluate(() => { const s = hbS(); s.screen = 'light'; s.scrPick = 1; hbSave(); setView('dashboard'); });
    const sel = await boardOne('pchart', KEY, RECIPE);
    const colSel = sel + ' svg.hb-svg [data-hb-part]';
    check('0. the card is on the board with its columns', !!(await until(s => document.querySelectorAll(s).length >= 3, colSel)));

    /* 1 + 2: hover */
    const pick = await page.evaluate(s => { const all = [...document.querySelectorAll(s)]; const g = all.find(x => x.hasAttribute('data-hb-py')) || all[all.length - 1];
      const p = g.querySelector('path'), r = p.getBoundingClientRect(); return { dig: g.getAttribute('data-hb-dig'), x: r.left + r.width / 2, y: r.top + r.height / 2 + 2 }; }, colSel);
    await page.mouse.move(pick.x, pick.y);
    await until(() => { const t = document.getElementById('hb-tip'); return t && !t.hidden; });
    /* the fade is .16s — SLOW-RUNNER WAIT (10 Oct 2026, "get main to green"):
       a fixed 400 ms once read the other columns still at full strength on
       GitHub's runner, so the wait asks for the stepped-back state, bounded */
    await until(() => { const svg = document.querySelector('svg.hb-svg.hb-dim'); if (!svg) return false;
      const o = [...svg.querySelectorAll('[data-hb-part]')].find(x => !x.classList.contains('is-lit'));
      const p = o && o.querySelector('path'); return !!p && Number(getComputedStyle(p).opacity) < 0.6; });
    const hov = await page.evaluate(({ dig }) => {
      const svg = document.querySelector('svg.hb-svg.hb-dim'); const g = [...document.querySelectorAll('[data-hb-dig]')].find(x => x.getAttribute('data-hb-dig') === dig && x.closest('.hb-svg'));
      const p = g && g.querySelector('path'), cs = p ? getComputedStyle(p) : null;
      const other = svg && [...svg.querySelectorAll('[data-hb-part]')].find(x => x !== g);
      const oo = other ? getComputedStyle(other.querySelector('path')).opacity : null;
      const tip = document.getElementById('hb-tip');
      const n = (/(\d+)/.exec((tip.querySelector('.hb-tip-go') || {}).textContent || '') || [])[1];
      return { dim: !!svg, lit: !!(g && g.classList.contains('is-lit')), stroke: cs && cs.stroke, sw: cs && cs.strokeWidth, outline: cs && cs.outlineStyle, filter: cs && cs.filter, other: oo,
        tipText: tip.textContent, n: Number(n), want: hbDigData(dig, hbS().lens).n, share: !!tip.querySelector('.hb-tip-m'), titleHeld: g && g.querySelector('title') ? g.querySelector('title').textContent : 'x' };
    }, { dig: pick.dig });
    check('1a. G1 hovering lights the column and steps the others back', hov.dim && hov.lit && Number(hov.other) < 0.6, `dim ${hov.dim} lit ${hov.lit} other opacity ${hov.other}`);
    check('1b. G1 no outline on the hovered column', (hov.stroke === 'none' || hov.sw === '0px') && hov.outline === 'none', `stroke ${hov.stroke} ${hov.sw} outline ${hov.outline}`);
    check('1c. G1 a soft glow instead', /drop-shadow/.test(hov.filter || ''), hov.filter);
    check('2a. G4 the hover card shows the share and the change', hov.share && /%/.test(hov.tipText), hov.tipText.slice(0, 160));
    check('2b. G4 "Open these N" is the list the column opens', hov.n === hov.want, `${hov.n} vs ${hov.want}`);
    check('2c. G4 the browser\'s own tooltip is held back while the card shows', hov.titleHeld === '', JSON.stringify(hov.titleHeld));
    await page.screenshot({ path: path.join(OUT, '1-hover-light.png') });
    await page.mouse.down();
    await page.waitForTimeout(220);
    const press = await page.evaluate(({ dig }) => { const g = [...document.querySelectorAll('.hb-svg [data-hb-dig]')].find(x => x.getAttribute('data-hb-dig') === dig); const p = g && g.querySelector('path'), cs = p && getComputedStyle(p);
      return cs ? { stroke: cs.stroke, sw: cs.strokeWidth, outline: cs.outlineStyle, filter: cs.filter } : null; }, { dig: pick.dig });
    check('1d. G1 pressing: brighter, and still no line', press && (press.stroke === 'none' || press.sw === '0px') && press.outline === 'none' && /brightness/.test(press.filter || ''), JSON.stringify(press));
    await page.screenshot({ path: path.join(OUT, '2-press-light.png') });
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await until(() => { const t = document.getElementById('hb-tip'); return !t || t.hidden; });

    /* 3. G2 */
    const sharp = await page.evaluate(s => { const xs = [...document.querySelectorAll(s + ' svg.hb-svg path.hb-sv-col, ' + s + ' svg.hb-svg path.hb-sv-colpast')].filter(p => p.getAttribute('d')).map(p => Number((/^M(-?[\d.]+),/.exec(p.getAttribute('d')) || [])[1]));
      const g = document.querySelector(s + ' .hb-sv-grid'); return { xs, crisp: g ? getComputedStyle(g).shapeRendering : '' }; }, sel);
    check('3a. G2 every fitted column edge is on a whole pixel', sharp.xs.length >= 3 && sharp.xs.every(x => x % 1 === 0), sharp.xs.slice(0, 6).join(' '));
    check('3b. G2 grid lines are crisp', sharp.crisp === 'crispedges', sharp.crisp);

    /* 4. G5 opened: lines */
    await page.evaluate(k => { const s = hbS(); s.panels = []; s.path = [k]; hbSave(); hbPaintBoard(); }, KEY);
    await page.evaluate(({ k, R }) => { hbCardSet(k, R, { seed: true }); hbPaintBoard(); }, { k: KEY, R: RECIPE });
    await until(() => !!document.querySelector('#hb-focus [data-hb-lines]'));
    const tools = await page.evaluate(() => [...document.querySelectorAll('#hb-focus .hb-open-tools > *')].map(b => b.textContent.trim()).join(' | '));
    check('4a. G5/G9 opened: Lines, Copy as image and Copy table beside Show as table and Full screen', /Lines/.test(tools) && /Copy as image/.test(tools) && /Copy table/.test(tools) && /Show as table/.test(tools), tools);
    await page.click('#hb-focus [data-hb-lines]');
    await until(() => !!document.querySelector('.hb-lines-menu'));
    await page.click('.hb-lines-menu [data-hb-line="avg"]');
    check('4b. G5 the average is drawn', !!(await until(() => !!document.querySelector('#hb-focus .hb-sv-ref-avg'))));
    if (!(await page.evaluate(() => !!document.querySelector('#hb-ref-tgt-in')))) await page.click('#hb-focus [data-hb-lines]');
    await until(() => !!document.querySelector('#hb-ref-tgt-in'));
    await page.fill('#hb-ref-tgt-in', 'lots');
    await page.press('#hb-ref-tgt-in', 'Enter');
    const said = await until(() => { const t = [...document.querySelectorAll('.toast, [role="status"], [role="alert"]')].map(x => x.textContent).join(' '); return /not a number/i.test(t) ? t : null; });
    check('4c. G5 a target that is not a number is refused and said', !!said && !(await page.evaluate(() => !!document.querySelector('#hb-focus .hb-sv-ref-tgt'))), said && said.slice(0, 120));
    await page.fill('#hb-ref-tgt-in', '6');
    await page.press('#hb-ref-tgt-in', 'Enter');
    check('4d. G5 a typed target is drawn', !!(await until(() => !!document.querySelector('#hb-focus .hb-sv-ref-tgt'))));
    await page.screenshot({ path: path.join(OUT, '4-lines.png') });

    /* 5. G9 copies */
    await page.click('#hb-focus [data-hb-copy-tab]');
    const clip = await until(async () => { try { const t = await navigator.clipboard.readText(); return /\t/.test(t) ? t : null; } catch (_){ return null; } });
    const rows = clip ? clip.split('\n').slice(1).map(r => r.split('\t')) : [];
    check('5a. G9 Copy table puts the chart\'s rows on the clipboard, a column per field', rows.length >= 3 && rows.every(r => r.length === 2 && r[0] && /\d/.test(r[1])), clip ? clip.split('\n').slice(0, 3).join(' / ') : 'nothing on the clipboard');
    let dl = null; page.once('download', d => { dl = d; });
    await page.click('#hb-focus [data-hb-copy-img]');
    const img = await until(() => { const t = [...document.querySelectorAll('.toast, [role="status"], [role="alert"]')].map(x => x.textContent).join(' '); return /copied as an image|downloaded as a picture|could not be turned/i.test(t) ? t : null; }, null, 10000);
    check('5b. G9 Copy as image copies or saves a picture, and says which', !!img && !/could not be turned/i.test(img), (img || '').slice(0, 120) + (dl ? ' (downloaded)' : ''));
    await page.keyboard.press('Escape');
    await until(() => !document.querySelector('#hb-focus'));

    /* 6. G8 the four new pictures */
    const PICS = [
      { id: 'pwf', key: 'q:the book as a waterfall', cls: 'hb-wf', R: { which: 'all', pic: 'waterfall', measure: 'count', window: { last: 12, unit: 'm' } } },
      { id: 'pfn', key: 'q:contracts as a funnel', cls: 'hb-fn', R: { which: 'all', pic: 'funnel', measure: 'count' } },
      { id: 'psp', key: 'q:days to sign by type as a box plot', cls: 'hb-sp', R: { which: 'all', pic: 'spread', split: { by: 'kind' } } },
      { id: 'pmu', key: 'q:signed by quarter and stream', cls: 'hb-multi', R: { which: 'all', pic: 'multi', split: { by: 'date', unit: 'q', date: 'signed' }, split2: { by: 'folder' }, measure: 'count' } }];
    for (const o of PICS){
      const ps = await boardOne(o.id, o.key, o.R);
      const m = await until(({ s, cls }) => { const svg = document.querySelector(s + ' svg.hb-svg.' + cls); if (!svg) return null; const r = svg.getBoundingClientRect();
        const out = [...svg.querySelectorAll('text')].filter(t => { const b = t.getBoundingClientRect(); return b.width && (b.right > r.right + 3 || b.left < r.left - 3 || b.bottom > r.bottom + 3); }).length;
        const doors = [...svg.querySelectorAll('[data-hb-dig]')];
        const ok = doors.every(d => { const D = hbDigData(d.getAttribute('data-hb-dig'), hbS().lens); return !!D; });
        return { out, doors: doors.length, ok, h: Math.round(r.height) }; }, { s: ps, cls: o.cls });
      check(`6. G8 ${o.R.pic}: drawn, every piece a door that opens`, !!m && m.doors >= 1 && m.ok, m && `${m.doors} doors, ${m.h}px tall`);
      check(`6. G8 ${o.R.pic}: no words fall outside the chart`, !!m && m.out === 0, m && m.out);
      await page.waitForTimeout(900);   /* the pieces fade in over .5s, staggered */
      await page.screenshot({ path: path.join(OUT, `6-${o.R.pic}.png`) });
    }

    /* 7. G10 one value */
    const ps = await boardOne('pone', 'cd:one value', { pic: 'bars', split: { by: 'folder' }, measure: 'count' }, { ids: ['MK-E0', 'MK-E1'] });
    const one = await until(s => { const b = document.querySelector(s + ' .hb-small'); return b ? { figs: b.querySelector('.hb-small-figs').textContent, chips: b.querySelectorAll('[data-hb-rset]').length } : null; }, ps);
    check('7a. G10 one bar is said as its number', !!one && /2/.test(one.figs), one && one.figs);
    check('7b. G10 with the views that would draw a real picture', !!one && one.chips >= 2, one && one.chips);
    await page.screenshot({ path: path.join(OUT, '7-one-value.png') });
    await page.click(ps + ' .hb-small [data-hb-rset^="split:d:m"]');
    check('7c. G10 a press draws it by month', !!(await until(s => !!document.querySelector(s + ' svg.hb-svg.hb-cols'), ps)));

    /* 8. the dark board */
    await page.evaluate(() => { const s = hbS(); s.screen = 'dark'; s.scrPick = 1; hbSave(); hbApplyScreen(); });
    const sel2 = await boardOne('pchart', KEY, RECIPE);
    const p2 = await page.evaluate(s => { const g = [...document.querySelectorAll(s + ' svg.hb-svg [data-hb-part]')].pop(); const r = g.querySelector('path').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 + 2 }; }, sel2);
    await page.mouse.move(p2.x, p2.y);
    await until(() => { const t = document.getElementById('hb-tip'); return t && !t.hidden; });
    await page.screenshot({ path: path.join(OUT, '8-hover-dark.png') });
    check('8. no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
