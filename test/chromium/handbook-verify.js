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
/* global state, currentUser, setView, openPanel, caGo, caUnderstand, caActOf, deskKeyNow, hbkOpen, hbkPlace, HANDBOOK_CHAPTERS, HANDBOOK_PARTS, contractRef, pdOpenOnHome, intel, ai, navLanding, landOff, closeModal, closeContextPanel, langSet */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'shots', 'handbook');
const IMG = path.join(ROOT, 'handbook', 'img');
const REVIEW = path.join(ROOT, 'docs', 'review-shots');
const SHOTS = process.env.HANDBOOK_SHOTS === '1';
/* HANDBOOK_ONLY=<chapter>[,<chapter>…] runs those recipes; a part's number ("3") runs all its chapters */
const ONLY = String(process.env.HANDBOOK_ONLY || '').split(',').map(x => x.trim()).filter(Boolean);
const onlyHas = k => !ONLY.length || ONLY.some(x => k === x || k.startsWith(x + '.'));
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
async function runStep(P, st, h){
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
  else if (st.type){ await P.fill(st.into || '#igd-input', st.type); await P.dispatchEvent(st.into || '#igd-input', 'input'); await P.waitForTimeout(300); }
  /* a state that needs a beat, a thing to wait for, or a reading the page itself does (Discover's kept answers) */
  else if (st.wait) await P.waitForTimeout(st.wait);
  else if (st.waitFor){ if (!(await until(P, s => !!document.querySelector(s), st.waitFor, st.ms || 10000))) throw new Error('never came: ' + st.waitFor); }
  else if (st.eval) await P.evaluate(new Function(st.eval));
  /* Jambo's answers slowed, so a read can be seen while it runs (Stop) */
  else if (st.aiSlow != null){ if (h && h.ai && typeof h.ai.slow === 'function') h.ai.slow(st.aiSlow); }
  /* THE NEW LOOK FOR THIS PICTURE (owner, 12 Nov 2026: "re-take the Handbook pictures in the new look"): switched on
     for the recipe that asks, and off again in reset, so no other picture changes look */
  /* the person must be signed in before their own setting can change (a page loaded with its contracts can still
     be a beat short of knowing who you are): wait for them, and fail if the look never switched */
  else if (st.newLook != null){ await until(P, () => typeof currentUser === 'function' && !!currentUser(), null, 10000);
    await P.evaluate(async on => { if (typeof stPrefSet === 'function') await stPrefSet('newLook', !!on); if (typeof newLookApply === 'function') newLookApply(); }, st.newLook);
    if (!(await until(P, on => document.documentElement.classList.contains('lg-new') === !!on, st.newLook, 5000))) throw new Error('the new look never switched ' + (st.newLook ? 'on' : 'off')); }
  await settle(P);
}
/* the boxes: the first element each selector finds, a red frame and a number drawn FROM ITS OWN RECT. A box is a
   selector or { sel, step }: its number is the STEP it shows (owner, 26 Oct 2026: "numbered marks on the pictures that
   match the steps"). Returns what was missed, what covers a whole panel, and the boxes' joint rect for the close-up. */
const PANEL_ROOTS = ['#ig-dock', '#ins-panel', '#st-side', '#context-panel', '#mig-side', '#content', '#app-shell', '#cal-plan', '#hb-board', '#ct-place', '#modal-root', '#set-page', 'body', 'main'];
async function drawBoxes(P, boxes){
  return P.evaluate(([boxes, roots]) => {
    document.querySelectorAll('.hbk-shot-box').forEach(x => x.remove());
    const miss = [], whole = [], rects = [];
    const sel = b => typeof b === 'string' ? b : b.sel;
    /* a box inside a long panel (the Guide's rows) is scrolled into view first, so the picture shows it */
    boxes.forEach(b => { let el = null; try { el = document.querySelector(sel(b)); } catch (_){ el = null; } if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    boxes.forEach((b, i) => {
      let el = null; try { el = document.querySelector(sel(b)); } catch (_){ el = null; }
      const r = el && el.getBoundingClientRect();
      if (!el || !r || r.width < 4 || r.height < 4){ miss.push(sel(b)); return; }
      /* A BOX IS A PLACE TO LOOK, NEVER A WHOLE PANEL (owner, 26 Oct 2026) */
      if (roots.some(q => { try { return el.matches(q); } catch (_){ return false; } }) || r.width * r.height > innerWidth * innerHeight * 0.3) whole.push(sel(b));
      rects.push(r);
      const d = document.createElement('div'); d.className = 'hbk-shot-box';
      d.style.cssText = `position:fixed;left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px;border:2px solid #C0392B;border-radius:6px;z-index:2147483000;pointer-events:none;box-sizing:border-box;`;
      const n = document.createElement('span'); n.textContent = String(typeof b === 'object' && b.step ? b.step : i + 1);
      n.style.cssText = 'position:absolute;left:-2px;top:-2px;transform:translate(-50%,-50%);background:#C0392B;color:#fff;font:600 13px/22px Inter,sans-serif;width:22px;height:22px;border-radius:50%;text-align:center;box-shadow:0 0 0 2px #fff;';
      d.appendChild(n); document.body.appendChild(d);
    });
    let clip = null;
    if (rects.length){
      const L = Math.min(...rects.map(r => r.left)) - 40, T = Math.min(...rects.map(r => r.top)) - 40, R = Math.max(...rects.map(r => r.right)) + 40, B = Math.max(...rects.map(r => r.bottom)) + 40;
      /* a close-up, never smaller than 560 × 350 and never past the window, about the frame's 16:10 */
      let w = Math.max(560, R - L), h = Math.max(350, B - T);
      if (w / h > 1.9) h = Math.round(w / 1.6); else if (h / w > 0.9) w = Math.round(h * 1.6);
      w = Math.min(w, innerWidth); h = Math.min(h, innerHeight);
      const cx = (L + R) / 2, cy = (T + B) / 2;
      const x = Math.max(0, Math.min(innerWidth - w, Math.round(cx - w / 2))), y = Math.max(0, Math.min(innerHeight - h, Math.round(cy - h / 2)));
      clip = { x, y, width: Math.round(w), height: Math.round(h) };
    }
    return { miss, whole, clip };
  }, [boxes, PANEL_ROOTS]);
}
const clearBoxes = P => P.evaluate(() => document.querySelectorAll('.hbk-shot-box').forEach(x => x.remove()));
/* back to a clean Home between recipes: a page in the middle shut, the panel let go, the landing off */
async function reset(P, base){
  /* a fresh load first, so what one picture left in the page's memory (a read stopped half-way, a Settings
     page open) never stands in the next; the steps below then bring it back to Home */
  if (base){
    await P.goto(base + '/', { waitUntil: 'networkidle' });
    await until(P, () => !!(window.state && state.view && Array.isArray(state.contracts) && state.contracts.length && typeof hbkOpen === 'function'), null, 20000);
    await P.evaluate(() => { state.aiConfigured = true; });
    /* a picture taken in the new look leaves it on (it is the person's own setting): off again for the next one */
    await P.evaluate(async () => { if (typeof newLookOn === 'function' && newLookOn() && typeof stPrefSet === 'function'){ await stPrefSet('newLook', false); if (typeof newLookApply === 'function') newLookApply(); } });
  }
  await P.evaluate(() => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} try { if (typeof closeContextPanel === 'function') closeContextPanel(); } catch (_){} try { if (typeof landOff === 'function') landOff(); } catch (_){}
    /* every face of Jambo's panel put away, so one picture's state never stands in the next */
    ['pdFillAway', 'pdRedAway', 'pdSignAway', 'pdAmendAway', 'pdSendAway', 'pdMidOff', 'pdTalkClose'].forEach(f => { try { if (typeof window[f] === 'function') window[f](); } catch (_){} });
    try { if (typeof pdSetTab === 'function') pdSetTab('copilot'); } catch (_){}
    /* the Contracts list back at rest: no column brought up, no set from another screen, Discover's form shut */
    try { const R = regState(); (R.ask || []).slice().forEach(id => { if (typeof askColDrop === 'function') askColDrop(id); }); R.ask = []; R.only = null; if (typeof askColClose === 'function') askColClose(); } catch (_){}
    setView('counter'); });
  await settle(P);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true }); if (SHOTS){ fs.mkdirSync(IMG, { recursive: true }); fs.mkdirSync(REVIEW, { recursive: true }); }
  const h = await startHati({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000' });
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const P = await ctx.newPage();
  ctx.on('page', p => { if (p !== P) setTimeout(() => p.close().catch(() => {}), 50); });
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await login(P, h.base);
    const book = await P.evaluate(() => ({ chapters: HANDBOOK_CHAPTERS.map(c => ({ k: c.k, part: c.part, shot: c.shot || null, shots: c.shots || null, noShot: !!c.noShot })), parts: HANDBOOK_PARTS.map(p => p.k) }));

    if (!ONLY.length){
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
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Handbook is one chapter in front (hbknRender):
         the parts down the left (.hbkn-part), the part in front opened to its chapters (.hbkn-ch), the chapter beside them
         (.hbkn-chapter), the day it was checked in the head (.ctf-hf), Jambo's panel beside with his box. RETIRED: the old
         page's "Which one do I need?" table and its chips (2b's first half) — the old look's part page */
      const page = await P.evaluate(() => ({ parts: [...document.querySelectorAll('.hbkn-part[data-hbk-part]')].map(b => b.getAttribute('data-hbk-part')), on: (document.querySelector('.hbkn-part.is-on') || { getAttribute: () => null }).getAttribute('data-hbk-part'),
        chapters: [...document.querySelectorAll('.hbkn-ch[data-hbkn-ch]')].map(s => s.getAttribute('data-hbkn-ch')), shown: !!document.querySelector('.hbkn-chapter'),
        panel: !!document.querySelector('#ins-panel.is-jambo'), ask: !!document.getElementById('jl-q'), checked: (document.querySelector('#hbk-page .ctf-hf') || {}).textContent }));
      check('2a the contents list the eight parts, Getting around first, the first part in front', page.parts.join() === book.parts.join() && page.on === 'around', JSON.stringify(page.parts));
      check('2b the part in front lists every chapter of the part, one chapter in front', page.shown && page.chapters.join() === book.chapters.filter(c => c.part === 'around').map(c => c.k).join(), JSON.stringify(page.chapters));
      check('2c Jambo\'s panel beside it, his box at the foot; the head says the day it was last checked', page.panel && page.ask && /checked against the app .*\d/.test(page.checked || ''), page.checked);
      /* every chapter, in both languages: the format's blocks, no marker left, no bare key printed */
      const FORMAT = ['.hbkn-eye', 'h2', '.hbkn-what', 'ol.hbkn-steps > li'];
      for (const lang of ['en', 'sv']){
        await P.evaluate(l => langSet(l), lang); await settle(P);
        const bad = [];
        for (const ck of book.chapters.map(c => c.k)){
          await P.evaluate(k => hbkOpen(k), ck);
          const r = await P.evaluate(([FORMAT, k]) => { const s = document.querySelector(`.hbkn-chapter[data-hbk-ch="${k}"]`); if (!s) return k + ': not drawn'; const out = [];
            FORMAT.forEach(sel => { if (!s.querySelector(sel)) out.push('no ' + sel); });
            if (/\{(ui|door):/.test(s.textContent)) out.push('raw marker');
            [...s.querySelectorAll('.hbk-ui, .hbk-chip')].forEach(u => { if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(u.textContent.trim())) out.push('bare key ' + u.textContent.trim()); });
            return out.length ? k + ': ' + out.join(', ') : null; }, [FORMAT, ck]);
          if (r) bad.push(r);
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
      const back = await P.evaluate(() => ({ place: hbkPlace(), cur: (document.querySelector('.hbkn-ch[aria-current="true"]') || {}).getAttribute ? document.querySelector('.hbkn-ch[aria-current="true"]').getAttribute('data-hbkn-ch') : null }));
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
      check('4b …and the press opens the Handbook on that chapter', await P.evaluate(() => state.view === 'handbook' && hbkPlace().chapter === '3.3' && !!document.querySelector('.hbkn-ch[aria-current="true"][data-hbkn-ch="3.3"]') && !!document.querySelector('.hbkn-chapter[data-hbk-ch="3.3"]')));

      /* ---- 4′ THE PAGE STANDS STILL (owner, 26 Oct 2026: "stop the Handbook jumping"; numbered steps; the
         contents fully visible) ---- */
      /* RE-POINTED 16 Nov 2026 (#762): one chapter in front — a chapter pressed in the contents is the one shown, at
         its top, the contents kept; a part pressed opens at its first chapter, at its top */
      await P.evaluate(() => hbkOpen('3.1')); await settle(P);
      const still = await P.evaluate(async () => {
        const body0 = document.getElementById('hbk-body'); if (body0) body0.scrollTop = 400;
        const nav0 = document.querySelector('#hbk-page .hbkn-nav');
        const ch = [...document.querySelectorAll('.hbkn-ch[data-hbkn-ch]')].filter(b => b.getAttribute('aria-current') !== 'true').pop(); const k = ch && ch.getAttribute('data-hbkn-ch');
        if (ch) ch.click(); await new Promise(r => setTimeout(r, 300));
        const body = document.getElementById('hbk-body');
        const shown = (document.querySelector('.hbkn-chapter') || { getAttribute: () => null }).getAttribute('data-hbk-ch');
        const out = { k, shown, top1: body ? body.scrollTop : -1, navKept: !!document.querySelector('#hbk-page .hbkn-nav'), sameNav: document.querySelector('#hbk-page .hbkn-nav') === nav0, behavior: body ? getComputedStyle(body).scrollBehavior : '' };
        if (body) body.scrollTop = 400;
        const part = [...document.querySelectorAll('.hbkn-part[data-hbk-part]')].find(r => r.getAttribute('data-hbk-part') !== hbkPlace().part); const pk = part && part.getAttribute('data-hbk-part');
        if (part) part.click(); await new Promise(r => setTimeout(r, 300));
        const b2 = document.getElementById('hbk-body'); const first = (HANDBOOK_CHAPTERS.find(c => c.part === pk) || {}).k;
        return Object.assign(out, { pk, partShown: (document.querySelector('.hbkn-chapter') || { getAttribute: () => null }).getAttribute('data-hbk-ch'), first, top2: b2 ? b2.scrollTop : -1 });
      });
      check('4′a a chapter pressed in the contents is the one in front, at its top, the contents kept', !!still.k && still.shown === still.k && still.top1 === 0 && still.navKept && still.behavior === 'auto', JSON.stringify(still));
      check('4′b a part opens at its first chapter, at its top, the contents kept', !!still.pk && still.partShown === still.first && still.top2 === 0, JSON.stringify(still));
      const steps = [];
      for (const ck of book.chapters.map(c => c.k)){
        await P.evaluate(k => hbkOpen(k), ck);
        steps.push(await P.evaluate(k => { const ch = document.querySelector(`.hbkn-chapter[data-hbk-ch="${k}"]`); const ol = ch && ch.querySelector('ol.hbkn-steps'); const ul = ch && ch.querySelector('.hbkn-more ul');
          return { k, li: ol ? ol.children.length : 0, num: ol ? getComputedStyle(ol.children[0] || ol).listStyleType + '|' + getComputedStyle(ol).listStyleType : '', dot: ul ? getComputedStyle(ul).listStyleType : 'disc' }; }, ck));
      }
      const numbered = x => /decimal/.test(x.num);
      check('4′c every chapter\'s steps are numbered 1, 2, 3 …, its "when" lines bulleted', steps.length && steps.every(x => x.li && numbered(x) && x.dot === 'disc'), JSON.stringify(steps.filter(x => !(x.li && numbered(x) && x.dot === 'disc')).slice(0, 4)));
      for (const [w, hgt] of SCREENS){
        await P.setViewportSize({ width: w, height: hgt }); await settle(P);
        const toc = await P.evaluate(() => { const t = document.querySelector('#hbk-page .hbkn-nav');
          const cut = [...t.querySelectorAll('.hbkn-part, .hbkn-ch')].filter(e => e.scrollWidth > e.clientWidth + 1 || getComputedStyle(e).textOverflow === 'ellipsis').length;
          const out = [...t.querySelectorAll('.hbkn-part, .hbkn-ch')].filter(r => r.getBoundingClientRect().right > t.getBoundingClientRect().right + 1).length;
          return { side: t.scrollWidth > t.clientWidth + 1, cut, out }; });
        check(`4′d at ${w}×${hgt}: the contents never scroll sideways, every part's words whole`, !toc.side && !toc.cut && !toc.out, JSON.stringify(toc));
      }
      await P.setViewportSize({ width: 1440, height: 780 });

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
    const chapters = book.chapters.filter(c => onlyHas(c.k));
    const seenPic = new Map();
    const crypto = require('node:crypto');
    for (const c of chapters){
      const shots = Array.isArray(c.shots) ? c.shots : (c.shot ? [c.shot] : []);
      if (!shots.length){ check(`6 ${c.k} has no picture by design, and says why`, c.noShot); continue; }
      for (const [i, sh] of shots.entries()){
        const nm = `${c.k}-${i + 1}`;
        await reset(P, h.base);
        let err = '';
        if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(0);
        try { for (const st of sh.go) await runStep(P, st, h); } catch (e){ err = String(e && e.message || e); }
        let got = { miss: sh.boxes.map(b => typeof b === 'string' ? b : b.sel), whole: [], clip: null };
        if (!err){ for (let t = 0; t < 20 && (got = await drawBoxes(P, sh.boxes)).miss.length; t++) await P.waitForTimeout(250); }
        check(`6 ${nm} the recipe lands and every box is found`, !err && !got.miss.length, err || (got.miss.length ? 'not found: ' + got.miss.join(' ; ') : `${sh.boxes.length} boxes`));
        check(`6′ ${nm} every box is a place to look, never a whole panel`, !got.whole.length, got.whole.join(' ; '));
        if (!err && !got.miss.length){
          const file = path.join(SHOTS ? IMG : OUT, `${nm}.png`);
          const buf = await P.screenshot({ path: file, clip: got.clip || undefined });
          /* NO PICTURE IS SHARED (owner, 26 Oct 2026): two pictures with the same pixels fail */
          const hash = crypto.createHash('sha1').update(buf).digest('hex');
          check(`6″ ${nm} is its own picture, shared with no other`, !seenPic.has(hash), seenPic.get(hash) || '');
          seenPic.set(hash, nm);
        }
        await clearBoxes(P);
      }
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
