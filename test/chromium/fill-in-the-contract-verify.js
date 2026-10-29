/* ============================================================
   FILL IN THE CONTRACT — THE DOSSIER, THE LEGORA WAY (owner, 28 Oct 2026)
   ============================================================
   The owner picked "The Legora way" by name and walked it step by step
   ("Filling in a contract, step by step"), then said "Build it". What the
   walk drew, checked where the reader looks:

     1  the Dossier beside a paper reads across three columns — the name, what
        stands, one door — every name on one left edge, every value on one,
        every door ending on one right edge; no ring or dot before a row; the
        stage names stand over their rows as small group heads
     2  the owed details are ONE line, "Details · N needed", with Fill in ›;
        the Dossier holds no box to type in
     3  the Next card carries one button, "Fill in the contract ›"; "Confirm N
        read" and "Open in the middle" are gone
     4  the press turns the panel to the form beside the paper (its trail back
        "‹ Dossier"): each name OVER its box, owed boxes amber, group heads,
        the first owed box in the hand
     5  typed and Enter: the box turns white and ticked, the count moves, the
        next owed box takes the hand
     6  an amber spot pressed on the paper: its box takes the hand, and the
        row already answered is still there
     7  Save: back on the Dossier, a message says how many were saved, the
        Details line counts fewer
     8  the owner's three screens: the form never scrolls sideways, Save is in
        sight inside the panel
     9  no page errors

     node test/chromium/fill-in-the-contract-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'fill-in-the-contract');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ID = 'MK-FIC1';
/* an uploaded paper with blanks in its wording, as received paper comes */
const WORDING = ['<h1>SUPPLY AGREEMENT</h1>', '<h4>1. Parties</h4>',
  '<p>This Agreement is made between Highland Corporate Ltd of [Registered Address] and Kilimo Steel Ltd.</p>',
  '<h4>2. Term</h4>', '<p>Commencing on {{effective_date}} and running for two years.</p>', '<p>Delivery address: ________</p>',
  '<h4>3. Price</h4>', '<p>The Buyer shall pay the prices agreed in Schedule 2 within thirty (30) days.</p>',
  '<h4>4. Liability</h4>', '<p>Liability is capped at [Amount].</p>',
  '<h4>5. Law</h4>', '<p>This agreement is governed by the laws of Kenya.</p>'].join('');

/* the Dossier's lines, measured where they are painted */
const DOSSIER = () => {
  const dock = document.getElementById('ig-dock'); if (!dock) return { up: false };
  const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const R = el => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top) }; };
  const lines = [...dock.querySelectorAll('.pd-dossier.is-mix :is(.ds-read .ds-rr, #pd-og.is-dossier .pd-ck-hd, .ds-ob-line)')].filter(vis);
  const part = (el, sel) => { const x = el.querySelector(sel); return x && vis(x) ? R(x) : null; };
  const rows = lines.map(el => ({
    name: ((el.querySelector(':scope > .ds-nm, :scope > b') || {}).textContent || '').trim(),
    n: part(el, ':scope > .ds-nm, :scope > b'), v: part(el, ':scope > .ds-val, :scope > .pd-ck-v, :scope > .ds-this-v'),
    d: part(el, ':scope > .pd-go, :scope > .pd-ck-chev'),
    ring: [...el.querySelectorAll(':scope > .pd-ck-ring')].some(vis) }));
  const heads = [...dock.querySelectorAll('.pd-dossier.is-mix .ds-sp-st')].filter(vis).map(x => ((x.querySelector('b') || {}).textContent || '').trim());
  const nx = dock.querySelector('.ds-nx[data-ds-next]');
  const det = dock.querySelector('#pd-og.is-dossier tr[data-pd-og-row="details"]');
  return { up: !!dock.querySelector('#pd-glance'), rows, heads,
    boxes: [...dock.querySelectorAll('#pd-glance input:not([type=hidden]), #pd-glance select, #pd-glance textarea')].filter(vis).length,
    details: det ? det.textContent.replace(/\s+/g, ' ').trim() : '',
    nxBtns: nx ? [...nx.querySelectorAll('button')].filter(vis).map(b => b.textContent.replace(/\s+/g, ' ').trim()) : [],
    confirmRead: [...dock.querySelectorAll('[data-pd-og-all], [data-pd-ds-kt-mid]')].filter(vis).length,
    form: !!dock.querySelector('#pd-og.is-form') };
};
/* the form, measured */
const FORM = () => {
  const dock = document.getElementById('ig-dock'); const fm = dock && dock.querySelector('.pd-fm'); if (!fm) return { up: false };
  const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
  const rows = [...fm.querySelectorAll('tr.pd-fm-row')].map(r => {
    const lab = r.querySelector('td.pd-og-f b'), box = [...r.querySelectorAll('td.pd-og-v :is(.pd-og-in, .dp-face, select, .pd-fm-done)')].find(vis) || null;
    const lr = lab && lab.getBoundingClientRect(), br = box && box.getBoundingClientRect();
    return { key: r.getAttribute('data-pd-og-row'), cls: r.className, over: !!(lr && br && lr.bottom <= br.top + 1 && Math.abs(lr.left - br.left) < 2),
      bg: box ? getComputedStyle(box).backgroundColor : '', tick: getComputedStyle(r.querySelector('td.pd-og-v'), '::after').content };
  });
  const a = document.activeElement, ar = a && a.closest ? a.closest('tr.pd-fm-row') : null;
  const body = dock.querySelector('#pd-body'), save = fm.querySelector('[data-pd-fm-save]');
  const sr = save && save.getBoundingClientRect(), dr = dock.getBoundingClientRect();
  return { up: true, rows, heads: [...fm.querySelectorAll('tr.pd-fm-gh th > span:first-child')].map(x => x.textContent.trim()),
    count: ((fm.querySelector('[data-pd-fm-count]') || {}).textContent || '').trim(),
    focus: ar ? ar.getAttribute('data-pd-og-row') : '',
    trail: ((dock.querySelector('.pd-trail') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    sideways: body ? body.scrollWidth - body.clientWidth : 0,
    saveIn: !!(sr && vis(save) && sr.top >= dr.top && sr.bottom <= dr.bottom && sr.left >= dr.left && sr.right <= dr.right) };
};
const amber = bg => /rgb\(\s*2[3-5]\d,\s*2[0-4]\d,\s*1[6-9]\d|rgb\(\s*25[0-5],\s*24\d,\s*2[12]\d/.test(bg) || (() => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg); return !!m && +m[1] > +m[3] + 15 && +m[2] > +m[3]; })();
/* the surface token is the warm near-white the panel itself wears */
const white = bg => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg); return !!m && +m[1] >= 245 && +m[2] >= 245 && +m[3] >= 245; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = { id: ID, name: 'Supply Agreement', counterparty: 'Kilimo Steel Ltd', counterpartyEmail: 'legal@kilimo.example',
    party: 'Highland Corporate Ltd', folder: 'proc', status: 'Under Review', source: 'upload', format: 'rich', value: 0,
    template: null, fields: {}, redlineText: WORDING, owner: { id: me.id, name: me.name },
    upload: { fileName: 'supply.docx', fileHash: 'fic01', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    comments: [], rounds: [], versions: [], signatures: [], metadata: {}, compliance: { consent: false }, audit: [] };
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    check('0 the contract is staged', !!(put && put.ok));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, id => window.state && Array.isArray(state.contracts) && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });
    const open = async () => {
      await page.evaluate(() => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); setView('register'); });
      await waitFor(page, () => !!document.querySelector('#ct-place, #reg-root, .reg-card'), 6000);
      await page.evaluate(id => regOpenContract(id), ID);
      await waitFor(page, id => !!document.querySelector(`#pd-glance[data-pd-glance-for="${id}"]`), 12000, ID);
      await page.evaluate(id => { if (typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'copilot'); }, ID);
      const up = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og.is-dossier'), 12000);
      await page.evaluate(() => document.fonts.ready); await pause(250);
      return up;
    };
    check('0b the Dossier is up beside the paper', await open());

    console.log('\n1 · three columns, one edge each');
    const d0 = await page.evaluate(DOSSIER);
    const withAll = d0.rows.filter(r => r.n && r.v && r.d);
    const lefts = k => [...new Set(withAll.map(r => r[k].l))];
    check('1a the lines are measured', withAll.length >= 5, withAll.map(r => r.name).join(' · '));
    check('1b every name stands on one left edge', lefts('n').length === 1, lefts('n').join(','));
    check('1c every value stands on one left edge, right of the names', lefts('v').length === 1 && withAll.every(r => r.v.l > r.n.l), lefts('v').join(','));
    const rights = [...new Set(withAll.map(r => r.d.r))];
    check('1d every door ends on one right edge', rights.length === 1, rights.join(','));
    check('1e no ring or dot before a line', d0.rows.every(r => !r.ring));
    check('1f the stage names stand as group heads (Read, Fill in, Sign)', ['Read', 'Fill in', 'Sign'].every(w => d0.heads.includes(w)), d0.heads.join(' · '));

    console.log('\n2 · the owed details are one line');
    check('2a "Details · N needed · Fill in ›"', /^Details\s*\d+ needed.*Fill in ›$/.test(d0.details), d0.details);
    check('2b the Dossier holds no box to type in', d0.boxes === 0, d0.boxes);

    console.log('\n3 · the Next card has one button');
    check('3a "Fill in the contract ›", one button', d0.nxBtns.length === 1 && /^Fill in the contract ›$/.test(d0.nxBtns[0]), JSON.stringify(d0.nxBtns));
    check('3b no "Confirm N read", no "Open in the middle"', d0.confirmRead === 0, d0.confirmRead);
    await page.screenshot({ path: path.join(OUT, '1-dossier.png') });

    console.log('\n4 · the form beside the paper');
    await page.click('#ig-dock .ds-nx [data-pd-ds-fill]');
    const up = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og.is-form tr.pd-fm-row'), 6000);
    await waitFor(page, () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('tr.pd-fm-row')), 4000);
    const f0 = up ? await page.evaluate(FORM) : { up: false, rows: [], heads: [] };
    check('4a the form is up', up && f0.up);
    check('4b its way back is "‹ Dossier"', /Dossier.*Fill in the contract/.test(f0.trail), f0.trail);
    check('4c every name stands over its box', f0.rows.length >= 4 && f0.rows.every(r => r.over), f0.rows.filter(r => !r.over).map(r => r.key).join(','));
    check('4d the owed boxes are amber', f0.rows.filter(r => /is-amb/.test(r.cls)).every(r => amber(r.bg)), f0.rows.map(r => r.key + ':' + r.bg).join(' '));
    check('4e grouped under small heads', f0.heads.length >= 2, f0.heads.join(' · '));
    check('4f the first owed box is in the hand', !!f0.focus && f0.rows.length && f0.focus === f0.rows.find(r => /is-amb/.test(r.cls)).key, f0.focus);
    await page.screenshot({ path: path.join(OUT, '2-form.png') });

    console.log('\n5 · typed, and the hand moves on');
    const first = f0.focus;
    await page.keyboard.type('4800000'); await page.keyboard.press('Enter');
    await waitFor(page, k => { const a = document.activeElement, r = a && a.closest ? a.closest('tr.pd-fm-row') : null; return !!r && r.getAttribute('data-pd-og-row') !== k; }, 4000, first);
    /* the box's own colour change runs its course (a transition): asked for, bounded */
    await waitFor(page, k => { const r = document.querySelector(`tr.pd-fm-row[data-pd-og-row="${k}"] td.pd-og-v .pd-og-in`);
      const m = r && /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(r).backgroundColor); return !!m && +m[3] >= 245; }, 3000, first);
    const f1 = await page.evaluate(FORM);
    const r1 = f1.rows.find(r => r.key === first) || {};
    check('5a the answered box is white and ticked', /is-typed/.test(r1.cls || '') && white(r1.bg) && /✓/.test(r1.tick || ''), (r1.cls || '') + ' ' + r1.bg + ' ' + r1.tick);
    check('5b the count moves', f1.count !== f0.count, f0.count + ' → ' + f1.count);
    check('5c the next owed box takes the hand', !!f1.focus && f1.focus !== first, f1.focus);

    console.log('\n6 · a spot on the paper');
    const spot = await page.evaluate(() => { const el = document.querySelector('#ig-canvas [data-upblank]'); if (!el) return null; el.click(); return el.getAttribute('data-upblank'); });
    await waitFor(page, k => { const a = document.activeElement, r = a && a.closest ? a.closest('tr.pd-fm-row') : null; return !!r && r.getAttribute('data-pd-og-row') === k; }, 5000, spot);
    const f2 = await page.evaluate(FORM);
    check('6a its box takes the hand', !!spot && f2.focus === spot, spot + ' → ' + f2.focus);
    check('6b the row answered before is still there, ticked', f2.rows.some(r => r.key === first && /is-typed/.test(r.cls)), f2.rows.map(r => r.key).join(','));
    await page.keyboard.type('Plot 12, Athi River'); await page.keyboard.press('Enter'); await pause(300);

    console.log('\n7 · Save');
    await page.click('#ig-dock [data-pd-fm-save]');
    const back = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og.is-dossier') && !document.querySelector('#ig-dock #pd-og.is-form'), 6000);
    const said = await page.evaluate(() => [...document.querySelectorAll('[class*=toast]')].map(t => t.textContent.trim()).filter(Boolean).join(' | '));
    const d1 = await page.evaluate(DOSSIER);
    check('7a back on the Dossier', back);
    check('7b the message says what was saved', /Saved 2 details on MK-FIC1/.test(said), said);
    const nOf = s => +((/(\d+) needed/.exec(s) || [])[1] || 0);
    check('7c the Details line counts fewer', nOf(d1.details) === nOf(d0.details) - 2, d0.details + ' → ' + d1.details);

    console.log('\n8 · the owner\'s three screens');
    for (const [w, ht] of SCREENS){
      await page.setViewportSize({ width: w, height: ht }); await pause(300);
      await page.evaluate(() => { const b = document.querySelector('#ig-dock .ds-nx [data-pd-ds-fill]'); if (b) b.click(); });
      await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og.is-form'), 4000);
      await pause(250);
      const f = await page.evaluate(FORM);
      check(`8 ${w}×${ht} the form never scrolls sideways`, f.up && f.sideways <= 0, f.sideways);
      check(`8 ${w}×${ht} Save is in sight inside the panel`, f.saveIn);
      await page.screenshot({ path: path.join(OUT, `3-form-${w}x${ht}.png`) });
      await page.evaluate(() => { if (typeof pdFormClose === 'function') pdFormClose(); });
      await pause(200);
      await page.screenshot({ path: path.join(OUT, `4-dossier-${w}x${ht}.png`) });
    }

    console.log('\n9 · no page errors');
    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e){
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) process.exitCode = 1; else console.log('ALL PASS');
  }
})();
