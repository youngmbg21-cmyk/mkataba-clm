/* EVERY JAMBO PANEL SLIDES (owner, 19 Oct 2026: "all the new jambo panels do
   not have a slider like in the redline page. They should all have one.";
   js/components.js splitHtml · splitWire · splitFit, its clients jlFrame /
   jlLayout (the panel beside the lists and Import), stSideHtml / stSplitFit
   (Settings) and igFitSplit (Home))

   WHAT THIS PINS, driven in a real browser as an admin, at the owner's three
   screens (1440×780, 1536×730, 1366×950), on Negotiations, Approvals &
   signing, Requests, People, Import and Settings (You and Company), and on
   Home's Board:
     a a grip is drawn at the seam, on the PANEL's side: its strip's left edge
       is the panel's left edge, a press 7px in lands on it, a press 3px to
       the left of the seam does NOT (the page's own scrollbar stays
       pressable), at rest the panel is its resting width (nothing stored)
     c dragged far left, the page keeps ITS floor — no column of its list is
       squeezed away (a fixed table keeps its columns, MEASURED) — and the
       grip goes amber (data-at-limit, the house's amber); dragged far right,
       the panel stops at its floor (340) and the grip goes amber
     d a double-click puts the resting width back and forgets the choice;
       ArrowLeft steps it wider, Enter puts it back
     b dragging left by 120px widens the panel by 120px (or to the page's
       floor, whichever comes first) — the handle follows the pointer — and
       the page beside it follows (its right edge is the seam); the width is
       stored in this browser
     e folded, there is no grip; opened again, it is back at the seam
     f after a refresh the panel keeps the width the reader chose (the list
       pages and Import share one width; Settings keeps its own)
     g Home's Board shows its grip at rest and it drags as before
   Waits ask for the state, bounded; a part whose control is missing reports.
   AT THE PARENT (4221f12) every panel but Home's has no grip: a–f fail on
   the six panels; g passes (Home's divider was already there — held here so
   the generalisation cannot lose it).
   Run: node test/chromium/every-jambo-panel-slides-verify.js
   One screen: HATI_SCREENS=1440x780 node test/chromium/every-jambo-panel-slides-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/every-jambo-panel-slides-verify.js
   (D-<panel>-rest-<W>x<H>.png, D-<panel>-dragged-<W>x<H>.png and
   D-<panel>-widest-<W>x<H>.png) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
/* HATI_SCREENS=1440x780 runs one screen (a quick look); unset, all three */
const SCREENS = (process.env.HATI_SCREENS ? process.env.HATI_SCREENS.split(',').map(s => s.split('x').map(Number)) : null) || [[1440, 780], [1536, 730], [1366, 950]];

/* the panels: how to open each, its grip, the panel element, the page's
   right edge beside it, its fold and unfold, its store */
const LIST = { grip: '#jl-resizer', key: 'hati.v1.jlW', min: 340, rest: () => 380,
  panel: () => document.querySelector('.ins-panel.is-jambo'),
  pageRight: () => document.getElementById('content-scroll').getBoundingClientRect().right,
  fold: '.ins-panel.is-jambo [data-jl-fold]', unfold: '.ins-panel.is-jambo [data-jl-door]' };
/* Settings' panel bleeds past its grid track into the page's padding: its
   width is the track's (the grid's right edge less the panel's left) */
const SETTINGS = { grip: '#st-resizer', key: 'hati.v1.stSideW', min: 340, rest: () => (innerWidth >= 1401 ? 380 : 344),
  panel: () => ({ getBoundingClientRect: () => { const s = document.getElementById('st-side').getBoundingClientRect(), c = document.querySelector('#set-page .st-cr-cols').getBoundingClientRect();
    return { left: s.left, right: c.right, width: c.right - s.left, top: s.top, bottom: s.bottom, height: s.height }; } }),
  pageRight: () => document.querySelector('#set-page .st-cr-left').getBoundingClientRect().right + parseFloat(getComputedStyle(document.querySelector('#set-page .st-cr-cols')).columnGap || 0),
  fold: '#st-side-head [data-st-side-fold]', unfold: '#st-side .st-side-unfold' };
const PANELS = [
  Object.assign({ name: 'negotiations', open: () => openNegotiations({ list: true }), ready: () => !!document.querySelector('#ins-panel.is-jambo #jl-resizer') && document.querySelectorAll('#reg-tbody tr[data-row]').length > 0 }, LIST),
  Object.assign({ name: 'approvals', open: () => setView('approvals'), ready: () => state.view === 'approvals' && !!document.querySelector('#ins-panel.is-jambo #jl-resizer') }, LIST),
  Object.assign({ name: 'requests', open: () => setView('intake'), ready: () => state.view === 'intake' && !!document.querySelector('#ins-panel.is-jambo #jl-resizer') }, LIST),
  Object.assign({ name: 'people', open: () => setView('directory'), ready: () => state.view === 'directory' && !!document.querySelector('#ins-panel.is-jambo #jl-resizer') }, LIST),
  Object.assign({ name: 'import', open: () => setView('migration'), ready: () => state.view === 'migration' && !!document.querySelector('#mig-side.is-jambo #jl-resizer') }, LIST),
  Object.assign({ name: 'settings-you',
    open: () => { if (state.view !== 'team') setView('team'); if (typeof settingsGoTab === 'function' && settingsTab() !== 'you') settingsGoTab('you'); },
    ready: () => state.view === 'team' && settingsTab() === 'you' && !!document.querySelector('#st-side #st-resizer') }, SETTINGS),
  Object.assign({ name: 'settings-company',
    open: () => { if (state.view !== 'team') setView('team'); if (settingsTab() !== 'company') settingsGoTab('company'); },
    ready: () => state.view === 'team' && settingsTab() === 'company' && !!document.querySelector('#st-board .st-cards') && !!document.querySelector('#st-side #st-resizer') }, SETTINGS),
];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W0 = await H.seedWorkspace(h, { approvalRules: [] });
  /* an approval waiting, so Approvals draws its list beside the panel (no signing here) */
  { const jonas = W0.users.unrestricted;
    const admin = (await W0.admin.json('/api/bootstrap')).me;
    await W0.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Over 10 M',
      cond: { type: 'value', op: '>=', value: 10000000 }, approver: { kind: 'member', id: jonas.id, name: 'Jonas Berg' } }] } });
    await W0.admin.json('/api/contracts/MK-AP1', { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
      H.fixtureContract('MK-AP1', 'Helio power purchase', 'Helio AB', H.FOLDER_A, 20000000, 'Draft'), { owner: { id: admin.id, name: admin.name } }) } });
    const c = await W0.admin.json('/api/contracts/MK-AP1'); const v = c._v; delete c._v; c.status = 'Under Review';
    await W0.admin.raw('/api/contracts/MK-AP1', { method: 'PUT', body: { contract: c, baseVersion: v } }); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const [W, HH] of SCREENS) {
      const tag = `${W}x${HH}`;
      console.log(`\n=== ${tag} ===`);
      const ctx = await browser.newContext({ viewport: { width: W, height: HH } });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
      page.setDefaultTimeout(6000);
      const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
      const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2') && state.contracts.some(c => c.id === 'MK-B2'), null, 20000);
      await page.keyboard.press('Escape').catch(() => {});
      /* two negotiations with a change on the table, so Negotiations draws its list (once: the server keeps them) */
      await page.evaluate(async () => {
        for (const id of ['MK-A2', 'MK-B2']) { const c = getContract(id); if (!c) continue; if (c._light) await ensureFull(c);
          if ((c.changes || []).length) continue; negoInit(c);
          const cl = negoClauseList(c);
          await negoEditClause(c, cl[0].clauseId, '<p>Payment falls due within sixty (60) days.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-60' });
          persist(c); }
      });
      /* the store starts empty on every screen: what rests is the panel's own width */
      await page.evaluate(() => { for (const k of ['hati.v1.jlW', 'hati.v1.stSideW', 'hati.v1.igDockW', 'hati.v1.jlFold']) localStorage.removeItem(k); });

      const open = async P => { for (let i = 0; i < 25; i++) { await page.evaluate(P.open).catch(() => {});
        if (await until(P.ready, null, 700)) return true; } return false; };
      const read = P => page.evaluate(([g, pan, pr, key]) => {
        const r = document.querySelector(g); if (!r) return null;
        const p = (new Function('return (' + pan + ')()'))(); const pb = p.getBoundingClientRect();
        const b = r.getBoundingClientRect(); const cs = getComputedStyle(r);
        const mid = Math.round(b.top + b.height / 2);
        const inside = document.elementFromPoint(Math.round(b.left) + 7, mid), beside = document.elementFromPoint(Math.round(pb.left) - 3, mid);
        const sp = r.querySelector('span'); const amber = (() => { const t = document.createElement('i'); t.style.background = 'var(--st-amber-dot)'; document.body.appendChild(t); const v = getComputedStyle(t).backgroundColor; t.remove(); return v; })();
        return { shown: !r.hidden && cs.display !== 'none' && b.width > 0, gl: Math.round(b.left), gw: Math.round(b.width), seam: Math.round(pb.left), pw: Math.round(pb.width),
          inGrip: !!(inside && (inside === r || r.contains(inside))), besideGrip: !!(beside && (beside === r || r.contains(beside))), beside: beside ? (beside.id || String(beside.className || beside.tagName)).slice(0, 40) : null,
          pageRight: Math.round((new Function('return (' + pr + ')()'))()), limit: r.getAttribute('data-at-limit'), amberNow: sp ? getComputedStyle(sp).backgroundColor === amber : false,
          stored: localStorage.getItem(key), sideways: (() => { const sc = document.getElementById('content-scroll'); return sc ? sc.scrollWidth - sc.clientWidth : 0; })(),
          /* the narrowest column of a fixed list beside the panel (null where the page draws none) */
          minCol: (() => { let m = null; document.querySelectorAll('#content table').forEach(t => { if (t.closest('.ins-panel') || !t.getBoundingClientRect().width || getComputedStyle(t).tableLayout !== 'fixed') return;
            t.querySelectorAll('thead th').forEach(th => { if (getComputedStyle(th).display === 'none') return; const w = th.getBoundingClientRect().width; m = m == null ? w : Math.min(m, w); }); }); return m == null ? null : Math.round(m); })() };
      }, [P.grip, P.panel.toString(), P.pageRight.toString(), P.key]);
      const gripAt = P => page.evaluate(g => { const r = document.querySelector(g).getBoundingClientRect(); return { x: r.left + 7, y: r.top + r.height / 2 }; }, P.grip);
      const drag = async (P, dx) => { const b = await gripAt(P);
        await page.mouse.move(b.x, b.y); await page.mouse.down();
        for (let i = 1; i <= 10; i++) await page.mouse.move(b.x + dx * i / 10, b.y);
        await page.mouse.up(); await page.mouse.move(5, 300); await page.waitForTimeout(150); };

      for (const P of PANELS) {
        await part(`${tag} ${P.name}`, async () => {
          if (!(await open(P))) { check(`${tag} ${P.name} a: the page opens with its grip`, false, 'no grip on the page'); return; }
          await page.waitForTimeout(250);
          const rest = await page.evaluate(P.rest);
          const A = await read(P);
          check(`${tag} ${P.name} a: a grip at the seam on the panel's side, the panel at rest (${rest}px)`,
            !!A && A.shown && Math.abs(A.gl - A.seam) <= 1 && A.gw === 14 && A.inGrip && !A.besideGrip && Math.abs(A.pw - rest) <= 1 && A.stored === null,
            JSON.stringify(A && { gl: A.gl, seam: A.seam, gw: A.gw, pw: A.pw, inGrip: A.inGrip, beside: A.beside, stored: A.stored }));
          await shot(`D-${P.name}-rest-${tag}.png`);
          /* c first: the far left tells how wide this page lets the panel go */
          await drag(P, -2000);
          const C2 = await read(P);
          await shot(`D-${P.name}-widest-${tag}.png`);
          check(`${tag} ${P.name} c: far left, the page keeps its floor (no column of its list squeezed away), the grip amber`,
            !!C2 && C2.pw > A.pw && C2.limit === 'max' && C2.amberNow && C2.sideways <= 0 && (C2.minCol == null || C2.minCol >= 40),
            JSON.stringify(C2 && { pw: C2.pw, limit: C2.limit, amber: C2.amberNow, page: C2.pageRight, minCol: C2.minCol }));
          const maxW = C2 ? C2.pw : A.pw + 120;
          await drag(P, 2000);
          const C1 = await read(P);
          check(`${tag} ${P.name} c: far right, the panel stops at its floor (${P.min}px), the grip amber`, !!C1 && C1.pw === P.min && C1.limit === 'min' && C1.amberNow, JSON.stringify(C1 && { pw: C1.pw, limit: C1.limit, amber: C1.amberNow }));
          await page.dblclick(P.grip);
          await page.waitForTimeout(150);
          const D1 = await read(P);
          check(`${tag} ${P.name} d: a double-click puts it back and forgets the choice`, !!D1 && Math.abs(D1.pw - rest) <= 1 && D1.stored === null, JSON.stringify(D1 && { pw: D1.pw, stored: D1.stored }));
          await drag(P, -120);
          const B = await read(P);
          const want = Math.min(rest + 120, maxW);
          check(`${tag} ${P.name} b: dragged 120px left, the panel follows the pointer (${want}px) and the page follows it`,
            !!B && Math.abs(B.pw - want) <= 2 && Math.abs(B.pageRight - B.seam) <= 2 && Number(B.stored) === B.pw && B.sideways <= 0,
            JSON.stringify(B && { pw: B.pw, pageRight: B.pageRight, seam: B.seam, stored: B.stored, sideways: B.sideways }));
          /* the dragged photo: the pointer away, the grip quiet */
          await shot(`D-${P.name}-dragged-${tag}.png`);
          await page.dblclick(P.grip);
          await page.waitForTimeout(150);
          await page.focus(P.grip); await page.keyboard.press('ArrowLeft');
          const D2 = await read(P);
          await page.keyboard.press('Enter');
          const D3 = await read(P);
          check(`${tag} ${P.name} d: ArrowLeft steps it wider, Enter puts it back`, !!D2 && D2.pw > rest && !!D3 && Math.abs(D3.pw - rest) <= 1 && D3.stored === null, `${D2 && D2.pw} → ${D3 && D3.pw}`);
          await page.mouse.move(5, 300);
          /* folded: no grip; opened: back at the seam */
          if (await page.locator(P.fold).count()) {
            await page.click(P.fold);
            const E1 = await until(g => { const r = document.querySelector(g); return (!r || r.hidden || getComputedStyle(r).display === 'none' || !r.getBoundingClientRect().width) ? 'gone' : null; }, P.grip, 3000);
            check(`${tag} ${P.name} e: folded, there is no grip`, E1 === 'gone', String(E1));
            if (await page.locator(P.unfold).count()) await page.click(P.unfold);
            const E2 = await until(g => { const r = document.querySelector(g); return (r && !r.hidden && r.getBoundingClientRect().width > 0) ? true : null; }, P.grip, 3000);
            const E3 = await read(P);
            check(`${tag} ${P.name} e: opened again, the grip is back at the seam`, !!E2 && !!E3 && Math.abs(E3.gl - E3.seam) <= 1, JSON.stringify(E3 && { gl: E3.gl, seam: E3.seam }));
          } else check(`${tag} ${P.name} e: the fold is on the panel`, false, 'no ' + P.fold);
        });
      }

      /* f: a refresh keeps the width the reader chose — the lists' one width, Settings' own */
      await part(`${tag} refresh`, async () => {
        const N = PANELS[0], S = PANELS[5], A = PANELS[1];
        await open(N); await drag(N, -90);
        const nW = (await read(N)).pw;
        await open(S); await drag(S, -60);
        const sW = (await read(S)).pw;
        await page.reload({ waitUntil: 'networkidle' });
        await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
        await page.keyboard.press('Escape').catch(() => {});
        await open(N); await page.waitForTimeout(200);
        const n2 = await read(N);
        check(`${tag} f: after a refresh Negotiations' panel keeps the chosen ${nW}px`, !!n2 && Math.abs(n2.pw - nW) <= 1, String(n2 && n2.pw));
        await open(A); await page.waitForTimeout(200);
        const a2 = await read(A);
        /* one frame, one width — the same stored choice, given only the room Approvals' own list leaves */
        check(`${tag} f: Approvals opens at the same width — one frame, one width (or at its own list's floor)`,
          !!a2 && a2.stored === String(nW) && (Math.abs(a2.pw - nW) <= 1 || (a2.pw < nW && a2.limit === 'max')), JSON.stringify(a2 && { pw: a2.pw, stored: a2.stored, limit: a2.limit }));
        await open(S); await page.waitForTimeout(300);
        const s2 = await read(S);
        check(`${tag} f: Settings keeps its own chosen ${sW}px`, !!s2 && Math.abs(s2.pw - sW) <= 1, String(s2 && s2.pw));
        await page.evaluate(() => { localStorage.removeItem('hati.v1.jlW'); localStorage.removeItem('hati.v1.stSideW'); });
      });

      /* g: Home's Board shows its grip at rest and it drags as before */
      await part(`${tag} home board`, async () => {
        await page.evaluate(() => { const s = hbS(); s.face = 'board'; hbSave(); setView('dashboard'); });
        const ok = await until(() => state.view === 'dashboard' && hbS().face === 'board' && document.getElementById('ig-resizer') && document.getElementById('ig-row').clientWidth > 0, null, 10000);
        if (!ok) { check(`${tag} g: Home's Board is up`, false, 'no Board'); return; }
        await page.waitForTimeout(300);
        const HB = { grip: '#ig-resizer', key: 'hati.v1.igDockW', panel: () => document.getElementById('ig-dock'), pageRight: () => document.getElementById('ig-dock').getBoundingClientRect().left };
        const g0 = await read(HB);
        check(`${tag} g: the Board shows its grip at the seam at rest (380px)`, !!g0 && g0.shown && Math.abs(g0.gl - g0.seam) <= 1 && g0.inGrip && !g0.besideGrip && g0.pw === 380, JSON.stringify(g0 && { gl: g0.gl, seam: g0.seam, pw: g0.pw, beside: g0.beside }));
        await shot(`D-home-board-rest-${tag}.png`);
        await drag(HB, -100);
        const g1 = await read(HB);
        check(`${tag} g: dragged 100px left, Home's panel is 100px wider`, !!g1 && g1.pw === 480 && Number(g1.stored) === 480, JSON.stringify(g1 && { pw: g1.pw, stored: g1.stored }));
        await shot(`D-home-board-dragged-${tag}.png`);
        await page.dblclick('#ig-resizer');
        /* Home's panel eases to its width (its own transition): asked for, bounded */
        await until(() => Math.round(document.getElementById('ig-dock').getBoundingClientRect().width) === 380, null, 3000);
        const g2 = await read(HB);
        check(`${tag} g: a double-click puts Home's back`, !!g2 && g2.pw === 380 && g2.stored === null, String(g2 && g2.pw));
      });
      await ctx.close();
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
