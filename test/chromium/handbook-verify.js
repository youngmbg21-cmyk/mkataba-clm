/* Chromium verification: THE HANDBOOK — the instruction book inside HaTi.
   ============================================================
   Owner, 26 Oct 2026: "a page with a link in the guide page that shows
   instructions … the same exact instructions format … in subsections … and a
   rule that whenever the platform changes or new features added, the guide
   instruction book is updated accordingly" (docs/PLAN-the-handbook.md).

   Claims: the Guide's row opens the Handbook; the word "handbook" and "/"
   read as its place; the page draws the contents (eight parts), the part in
   front with its "Which one do I need?" table and every chapter in the
   Discover guide's format, with no raw marker and no bare dictionary key
   left in either language; a door chip takes you there through Jambo's one
   mover and a door the reader may not use is greyed with why; a refresh lands
   on the same chapter; "how do I …" typed in a Jambo box lands on the
   chapter; and EVERY CHAPTER'S PICTURE RECIPE FINDS WHAT IT BOXES on the
   seeded world (the rule's reach into the pictures: a screen that changed
   under a chapter fails here until the chapter is rewritten).

   HANDBOOK_SHOTS=1 also writes the pictures to handbook/img/<chapter>.png
   (1440 × 780, the red boxes and numbers drawn from the elements' own
   positions) and the three-screen photos of the page to docs/review-shots.
   HANDBOOK_ONLY=<chapter> runs one recipe.
   Screenshots go to test/chromium/shots/handbook/.
   Run: node test/chromium/handbook-verify.js */
/* global state, setView, openPanel, caGo, caUnderstand, caActOf, deskKeyNow, hbkOpen, hbkPlace, HANDBOOK_CHAPTERS, HANDBOOK_PARTS, contractRef, pdOpenOnHome, intel, ai, navLanding, landOff, closeModal, closeContextPanel, langSet */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld } = require('../nav-world');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'shots', 'handbook');
const IMG = path.join(ROOT, 'handbook', 'img');
const REVIEW = path.join(ROOT, 'docs', 'review-shots');
const SHOTS = process.env.HANDBOOK_SHOTS === '1';
const ONLY = process.env.HANDBOOK_ONLY || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}
/* a bounded wait for the app to stand still: nothing busy, nothing landing, two equal paints a beat apart */
async function settle(P){
  let prev = '';
  for (let i = 0; i < 30; i++){
    const now = await P.evaluate(() => { const busy = (window.intel && intel.busy) || (window.ai && ai.busy) || (typeof navLanding === 'function' && navLanding());
      return JSON.stringify([!!busy, state.view, document.body.innerHTML.length]); }).catch(() => '');
    if (now && now === prev && !JSON.parse(now)[0]) return;
    prev = now; await P.waitForTimeout(200);
  }
}
async function login(P, base){
  await P.goto(base + '/', { waitUntil: 'networkidle' });
  await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
  await until(P, () => !!(window.state && state.view && Array.isArray(state.contracts) && state.contracts.length && typeof hbkOpen === 'function'), null, 20000);
  await P.evaluate(() => { state.aiConfigured = true; });
}
/* the recipe's steps, each through a door HaTi already has */
async function runStep(P, st){
  if (st.place) await P.evaluate(k => caGo({ kind: 'go', place: k }), st.place);
  else if (st.view) await P.evaluate(v => setView(v), st.view);
  else if (st.open){ const id = await P.evaluate(([ref, face]) => { const c = state.contracts.find(x => String((typeof contractRef === 'function') ? contractRef(x) : x.id) === ref || x.id === ref); if (!c) throw new Error('no contract ' + ref); pdOpenOnHome(c.id, face || 'copilot'); return c.id; }, [st.open, st.face]);
    /* the paper in front before the next step (a page opened in the middle while the dock still paints is put away as stale) */
    await until(P, id => typeof deskKeyNow === 'function' && deskKeyNow() === 'c:' + id && !!document.getElementById('ig-dock'), id, 8000); }
  else if (st.panel) await P.evaluate(f => openPanel(f), st.panel);
  else if (st.fn) await P.evaluate(([fn, args, ref, arg]) => { const f = window[fn]; if (typeof f !== 'function') throw new Error('no function ' + fn);
    let a = Array.isArray(args) ? args.slice() : [];
    if (ref){ const c = state.contracts.find(x => String((typeof contractRef === 'function') ? contractRef(x) : x.id) === ref || x.id === ref); if (!c) throw new Error('no contract ' + ref); a = [arg === 'id' ? c.id : c].concat(a); }
    return f(...a); }, [st.fn, st.args || null, st.ref || null, st.arg || null]);
  else if (st.click){ const el = await P.$(st.click); if (!el) throw new Error('nothing to press at ' + st.click); await el.click(); }
  else if (st.type){ await P.fill('#cn-q', st.type); await P.dispatchEvent('#cn-q', 'input'); await P.waitForTimeout(300); }
  await settle(P);
}
/* the boxes: the first element each selector finds, a red frame and a number drawn FROM ITS OWN RECT */
async function drawBoxes(P, boxes){
  return P.evaluate(boxes => {
    document.querySelectorAll('.hbk-shot-box').forEach(x => x.remove());
    const miss = [];
    boxes.forEach((sel, i) => {
      let el = null; try { el = document.querySelector(sel); } catch (_){ el = null; }
      const r = el && el.getBoundingClientRect();
      if (!el || !r || r.width < 4 || r.height < 4){ miss.push(sel); return; }
      const d = document.createElement('div'); d.className = 'hbk-shot-box';
      d.style.cssText = `position:fixed;left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px;border:2px solid #C0392B;border-radius:6px;z-index:2147483000;pointer-events:none;box-sizing:border-box;`;
      const n = document.createElement('span'); n.textContent = String(i + 1);
      n.style.cssText = 'position:absolute;left:-2px;top:-2px;transform:translate(-50%,-50%);background:#C0392B;color:#fff;font:600 12px/18px Inter,sans-serif;width:18px;height:18px;border-radius:50%;text-align:center;';
      d.appendChild(n); document.body.appendChild(d);
    });
    return miss;
  }, boxes);
}
const clearBoxes = P => P.evaluate(() => document.querySelectorAll('.hbk-shot-box').forEach(x => x.remove()));
/* back to a clean Home between recipes: a page in the middle shut, the panel let go, the landing off */
async function reset(P){
  await P.evaluate(() => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} try { if (typeof closeContextPanel === 'function') closeContextPanel(); } catch (_){} try { if (typeof landOff === 'function') landOff(); } catch (_){} setView('counter'); });
  await settle(P);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true }); if (SHOTS){ fs.mkdirSync(IMG, { recursive: true }); fs.mkdirSync(REVIEW, { recursive: true }); }
  const h = await startHati({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000' });
  await seedNavWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const P = await ctx.newPage();
  ctx.on('page', p => { if (p !== P) setTimeout(() => p.close().catch(() => {}), 50); });
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await login(P, h.base);
    const book = await P.evaluate(() => ({ chapters: HANDBOOK_CHAPTERS.map(c => ({ k: c.k, part: c.part, shot: c.shot || null, noShot: !!c.noShot })), parts: HANDBOOK_PARTS.map(p => p.k) }));

    if (!ONLY){
      /* ---- 1 the doors in ---- */
      await P.evaluate(() => { setView('counter'); openPanel('guide'); });
      await until(P, () => document.querySelector('[data-gd-go="handbook"]'));
      const rows = await P.evaluate(() => [...document.querySelectorAll('#context-panel .gd > [data-gd-go]')].map(b => b.getAttribute('data-gd-go')));
      check('1a the Guide draws the Handbook\'s row at the foot, above Settings', rows.slice(-2).join() === 'handbook,settings', rows.join());
      await P.click('[data-gd-go="handbook"]'); await settle(P);
      check('1b pressing it lands on the Handbook page, the panel let go, the bar naming it', await P.evaluate(() => state.view === 'handbook' && !!document.getElementById('hbk-page') && !document.getElementById('context-panel').classList.contains('open') && /handbook/i.test((document.getElementById('dk-page') || {}).textContent || '')));
      const reads = await P.evaluate(() => ['handbook', 'the handbook', 'instructions', 'handbok', '/handbook'].map(q => { let a = null; try { a = caUnderstand(q, { box: 'list' }) || caActOf(q); } catch (_){ a = null; } return [q, a && a.kind, a && a.place]; }));
      check('1c "handbook", "instructions" and "handbok" read as the place; "/" lists it', reads.every(r => r[1] === 'go' && r[2] === 'handbook'), JSON.stringify(reads));
      const slash = await P.evaluate(() => (window.caSlashRows ? caSlashRows('') : []).map(r => r.k));
      check('1d "/" lists the Handbook among the places', slash.includes('handbook'), slash.join());

      /* ---- 2 the page ---- */
      const page = await P.evaluate(() => ({ parts: [...document.querySelectorAll('[data-hbk-part]')].map(b => b.getAttribute('data-hbk-part')), on: (document.querySelector('.hbk-toc-row.is-on') || {}).getAttribute ? document.querySelector('.hbk-toc-row.is-on').getAttribute('data-hbk-part') : null,
        table: !!document.querySelector('.hbk-pick table'), ths: [...document.querySelectorAll('.hbk-pick th')].map(x => x.textContent.trim()), chips: document.querySelectorAll('.hbk-chips .hbk-chip').length,
        chapters: [...document.querySelectorAll('.hbk-ch')].map(s => s.getAttribute('data-hbk-ch')), panel: !!document.querySelector('#ins-panel.is-jambo'), ask: !!document.getElementById('jl-q'), checked: (document.querySelector('.hbk-checked') || {}).textContent }));
      check('2a the contents list the eight parts, Getting around first, the first part in front', page.parts.join() === book.parts.join() && page.on === 'around', JSON.stringify(page.parts));
      check('2b the part in front: "Which one do I need?" (You want to… · Use · Where · Cost), chips, every chapter of the part', page.table && page.ths.join('|') === 'You want to…|Use|Where|Cost' && page.chips === page.chapters.length && page.chapters.length === book.chapters.filter(c => c.part === 'around').length, JSON.stringify([page.ths, page.chips, page.chapters]));
      check('2c Jambo\'s panel beside it, his box at the foot; the foot says the day it was last checked', page.panel && page.ask && /\d{4}-\d{2}-\d{2}/.test(page.checked || ''), page.checked);
      /* every chapter, in both languages: the format's blocks, no marker left, no bare key printed */
      const FORMAT = ['.hbk-eyebrow', 'h2', '.hbk-what', '.hbk-blk', '.hbk-path', '.hbk-tip', '.hbk-cost', '.hbk-pics'];
      for (const lang of ['en', 'sv']){
        await P.evaluate(l => langSet(l), lang); await settle(P);
        const bad = [];
        for (const pk of book.parts){
          await P.evaluate(k => hbkOpen(null, { part: k }), pk); await settle(P);
          const r = await P.evaluate(FORMAT => [...document.querySelectorAll('.hbk-ch')].map(s => { const k = s.getAttribute('data-hbk-ch'); const html = s.innerHTML; const out = [];
            FORMAT.forEach(sel => { if (!s.querySelector(sel)) out.push('no ' + sel); });
            if (/\{(ui|door):/.test(s.textContent)) out.push('raw marker');
            [...s.querySelectorAll('.hbk-ui, .hbk-chip')].forEach(u => { if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(u.textContent.trim())) out.push('bare key ' + u.textContent.trim()); });
            if (!s.querySelector('.hbk-blk h3') || s.querySelectorAll('.hbk-blk').length < 3) out.push('blocks');
            return out.length ? k + ': ' + out.join(', ') : null; }).filter(Boolean), FORMAT);
          bad.push(...r);
        }
        check(`2d (${lang}) every chapter draws the format whole, no raw marker, no bare dictionary key`, !bad.length, bad.join(' | ') || `${book.chapters.length} chapters`);
      }
      await P.evaluate(() => langSet('en')); await settle(P);

      /* ---- 3 the doors out, and back ---- */
      await P.evaluate(() => hbkOpen('5.1')); await settle(P);
      const grey = await P.evaluate(() => { hbkOpen('3.1'); const d = document.querySelector('#hbk-3\\.1 [data-hbk-door="redline"]'); return d ? { disabled: d.disabled, title: d.title } : null; });
      check('3a a contract\'s face with no contract open is greyed with why, never dead', !!grey && grey.disabled && /open a contract/i.test(grey.title), JSON.stringify(grey));
      await P.evaluate(() => hbkOpen('5.1')); await settle(P);
      await P.click('#hbk-5\\.1 [data-hbk-door="oblig"]'); await settle(P);
      check('3b a door chip takes you there through Jambo\'s one mover (Obligations)', await P.evaluate(() => state.view === 'obligations'), await P.evaluate(() => state.view));
      await P.evaluate(() => setView('handbook')); await settle(P);
      const back = await P.evaluate(() => ({ place: hbkPlace(), cur: (document.querySelector('.hbk-ch[aria-current="true"]') || {}).getAttribute ? document.querySelector('.hbk-ch[aria-current="true"]').getAttribute('data-hbk-ch') : null }));
      check('3c coming back, the page stands where it was left (the part and the chapter)', back.place.part === 'keep' && back.place.chapter === '5.1' && back.cur === '5.1', JSON.stringify(back));
      await P.evaluate(() => hbkOpen('3.3')); await settle(P); await P.waitForTimeout(400);
      await P.reload({ waitUntil: 'networkidle' });
      await until(P, () => !!(window.state && state.view && typeof hbkPlace === 'function'), null, 20000); await settle(P);
      const re = await P.evaluate(() => ({ view: state.view, place: hbkPlace() }));
      check('3d a refresh lands at the same spot: the Handbook, part 3, chapter 3.3', re.view === 'handbook' && re.place.part === 'agree' && re.place.chapter === '3.3', JSON.stringify(re));

      /* ---- 4 "how do I …" ---- */
      const asks = await P.evaluate(() => [['how do I send this for review', '3.3'], ['how do I put a contract on legal hold', '5.7'], ['how does the bell work', '0.3'], ['how do I get them to sign MK-B2', null], ['hur fungerar klockan', '0.3']]
        .map(([q, want]) => { let a = null; try { a = caUnderstand(q, { box: 'list' }); } catch (e){ a = { err: String(e) }; } return [q, want, a && a.place === 'handbook' ? a.chapter : (a ? (a.kind + ':' + (a.place || a.act || '')) : null)]; }));
      check('4a a how-to question lands on its chapter in both languages; a contract named stays its own reader\'s', asks.every(([, want, got]) => want ? got === want : !/^\d/.test(String(got))), JSON.stringify(asks));
      await P.evaluate(() => caGo(caUnderstand('how do I send this for review', { box: 'list' }))); await settle(P);
      check('4b …and the press opens the Handbook on that chapter', await P.evaluate(() => state.view === 'handbook' && hbkPlace().chapter === '3.3' && !!document.querySelector('.hbk-ch[aria-current="true"][data-hbk-ch="3.3"]')));

      /* ---- 5 the three screens ---- */
      for (const [w, hgt] of SCREENS){
        await P.setViewportSize({ width: w, height: hgt }); await P.evaluate(() => hbkOpen('3.3')); await settle(P);
        const fit = await P.evaluate(() => { const pg = document.getElementById('hbk-page'); const body = document.getElementById('hbk-body'); const doc = document.documentElement;
          return { overX: doc.scrollWidth > doc.clientWidth, pageBottom: pg.getBoundingClientRect().bottom <= window.innerHeight + 1, scrolls: body.scrollHeight > body.clientHeight, panel: !!document.querySelector('#ins-panel.is-jambo') }; });
        check(`5 at ${w}×${hgt}: nothing spills sideways, the page fits the window and scrolls inside itself, Jambo beside`, !fit.overX && fit.pageBottom && fit.scrolls && fit.panel, JSON.stringify(fit));
        await P.screenshot({ path: path.join(OUT, `handbook-${w}x${hgt}.png`) });
        if (SHOTS) await P.screenshot({ path: path.join(REVIEW, `handbook-${w}x${hgt}.png`) });
      }
      await P.setViewportSize({ width: 1440, height: 780 });
    }

    /* ---- 6 every chapter's picture recipe finds what it boxes (and, asked, takes the picture) ---- */
    const chapters = book.chapters.filter(c => !ONLY || c.k === ONLY);
    for (const c of chapters){
      if (!c.shot){ check(`6 ${c.k} has no picture by design, and says why`, c.noShot); continue; }
      await reset(P);
      let err = '';
      try { for (const st of c.shot.go) await runStep(P, st); } catch (e){ err = String(e && e.message || e); }
      let miss = err ? c.shot.boxes : [];
      if (!err){ for (let i = 0; i < 20 && (miss = await drawBoxes(P, c.shot.boxes)).length; i++) await P.waitForTimeout(250); }
      check(`6 ${c.k} the recipe lands and every box is found`, !err && !miss.length, err || (miss.length ? 'not found: ' + miss.join(' ; ') : `${c.shot.boxes.length} boxes`));
      if (!err && !miss.length){
        const file = path.join(SHOTS ? IMG : OUT, `${c.k}.png`);
        await P.screenshot({ path: file });
      }
      await clearBoxes(P);
    }
    await reset(P);
    check('7 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e){
    console.error('HARNESS', e); failures++;
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
