/* THE DOOR EXAM, WHERE THE READER TYPES (owner, 23 Oct 2026: "stop taking
   short cuts and do what is necessary for jambo to get things right")
   ============================================================
   1. COVERAGE, read off the running app: every door in HaTi's own lists —
      the parts of a contract (NAV_ACTS), the places (NAV_PLACES), the paper's
      menu rows (CA_MENU), the place words (CA_PLACES) — must have a sentence
      in test/door-exam.js. A door with none FAILS, so a new door cannot ship
      without one. Every Settings page and card (SET_PANELS, the You rows, the
      Company pages) is asked by its OWN title, read off the app: nothing to
      write, nothing to forget.
   2. LANDING: every sentence is typed into a real Jambo box — the Board's,
      a list's panel, Settings' own — over test/nav-world.js, and the app is
      read for where it stands (test/nav-read.js). A menu row and a place word
      are READ: the row or the place Jambo takes them for.
   Required green: one miss fails. Run: node test/chromium/door-exam-verify.js
   (DOOR_EXAM_ONLY=act|place|menu|ca|st for one list). */
/* global state, setView, hbSetFace, pdOpenOnHome, closeModal, landOff, closeContextPanel, navLanding, intel, ai, caUnderstand, caActOf,
   NAV_ACTS, NAV_PLACES, CA_MENU, CA_PLACES, hbPresent, deskRecentToggle */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld } = require('../nav-world');
const { navWhereSrc, judge } = require('../nav-read');
const { DOOR_EXAM, DOOR_BOXES } = require('../door-exam');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ONLY = process.env.DOOR_EXAM_ONLY || '';
/* a place word whose contract door is the nav reader's own: "share MK-A2" is the letter (its act 'send') */
const CA_NAV_ACT = { share: 'send' };

let failures = 0;
const out = (ok, what, detail) => { console.log((ok ? 'LAND ' : 'MISS ') + ' ' + what + (detail ? ' — ' + detail : '')); if (!ok) failures++; };

(async () => {
  const h = await startHati({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000' });
  await seedNavWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  /* a report opens in a new tab: counted, then shut */
  await ctx.addInitScript(() => { window.__popups = 0; const o = window.open; window.open = function(){ window.__popups++; return o.apply(this, arguments); }; });
  const P = await ctx.newPage();
  ctx.on('page', p => { if (p !== P) setTimeout(() => p.close().catch(() => {}), 50); });
  const errors = [];
  P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await P.waitForFunction(() => !!(window.currentUser && currentUser() && typeof setView === 'function' && state.contracts && state.contracts.length), null, { timeout: 20000 });
    await P.evaluate(() => { state.aiConfigured = true; });

    const settle = async () => {
      let prev = '';
      for (let i = 0; i < 24; i++){
        const now = await P.evaluate(src => { const busy = (window.intel && intel.busy) || (window.ai && ai.busy) || (typeof navLanding === 'function' && navLanding()); return JSON.stringify([busy, new Function('return (' + src + ')()')()]); }, navWhereSrc.toString()).catch(() => '');
        if (now && now === prev && !JSON.parse(now)[0]) return;
        prev = now;
        await P.waitForTimeout(250);   // a bounded poll: two equal readings a beat apart
      }
    };
    const where = () => P.evaluate(src => new Function('return (' + src + ')()')(), navWhereSrc.toString()).catch(e => ({ error: String(e.message || e) }));
    /* RE-PINNED 28 Oct 2026 (owner picked "Door above the box": every word TYPED in a box is the brain's but a page's
       one name): this exam is of the free readers, so each box is asked as a chip asks it — its own reader, not typed */
    const chipAsk = async (sel, fn, q) => { await P.waitForSelector(sel, { state: 'visible', timeout: 6000 }); await P.evaluate(([f, w]) => window[f](w), [fn, q]); };
    async function typeInto(box, q){
      /* RE-PINNED 26 Oct 2026 (owner: on the Board short commands are Overview's, everything typed on the Jambo tab goes to the AI, igBoardTalkFirst): this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
      if (box === 'board'){ await P.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { if (typeof pdTalkBack === 'function') pdTalkBack(); } }); return chipAsk('#igd-input', 'intelAsk', q); }
      if (box === 'list'){ await P.evaluate(() => setView('approvals')); await settle(); return chipAsk('#jl-q', 'jlAsk', q); }
      if (box === 'settings'){ await P.evaluate(() => setView('team')); await settle(); return chipAsk('#st-jb-q', 'stJbBoxAsk', q); }
      throw new Error('no such box ' + box);
    }
    /* EVERY SENTENCE STARTS FROM THE SAME PLACE: nothing open over the page, nothing landed, Present and
       Recent shut, and the Board (its own box) or a contract no sentence names open on Home (the others) */
    async function fresh(box){
      await P.evaluate(b => {
        try { closeModal(); } catch (_){} try { landOff(); } catch (_){} try { closeContextPanel(); } catch (_){}
        try { hbPresent(false); } catch (_){} try { deskRecentToggle(false); } catch (_){}
        try { if (typeof window.pdSendClose === 'function') window.pdSendClose(); } catch (_){}
        const d = document.querySelector('#st-drawer.open'); if (d && typeof window.stDrawerClose === 'function') window.stDrawerClose();
        if (window.ai && Array.isArray(ai.history)) ai.history.length = 0;
        if (window.intel){ intel.history = []; intel.fdTab = false; }
        try { if (typeof window.regState === 'function'){ const R = window.regState(); R.view = null; } } catch (_){}
        setView('dashboard');
        if (b === 'board') hbSetFace('board'); else pdOpenOnHome('MK-Z9', 'copilot');
      }, box);
      await settle();
    }

    /* ---- 1. COVERAGE: HaTi's own lists of doors, each with a sentence ---- */
    const lists = await P.evaluate(() => ({
      act: (window.NAV_ACTS || []).map(x => x[0]),
      place: (window.NAV_PLACES || []).map(x => x[0]),
      menu: (window.CA_MENU || []).map(x => x[0]),
      ca: (window.CA_PLACES || []).map(x => ({ k: x.k, w: (x.w || [])[0] || x.k, one: x.need === 'one' })),
    }));
    const have = new Set(DOOR_EXAM.map(L => L.door));
    for (const list of ['act', 'place', 'menu']){
      if (ONLY && ONLY !== list) continue;
      const missing = lists[list].filter(k => !have.has(list + ':' + k));
      out(!missing.length, `every ${list} door has a sentence in test/door-exam.js`, missing.length ? 'none for: ' + missing.join(', ') : `${lists[list].length} doors`);
    }

    /* ---- 2. THE PLACE WORDS, READ: each word reads as its own place ---- */
    if (!ONLY || ONLY === 'ca'){
      for (const p of lists.ca){
        const q = p.one ? `${p.w} MK-A2` : p.w;
        const got = await P.evaluate(q => { let a = null; try { a = caUnderstand(q, { box: 'list' }) || caActOf(q); } catch (_){ a = null; }
          return a ? { kind: a.kind, place: a.place || null, act: (a.nav && a.nav.act) || null } : null; }, q);
        const ok = !!got && got.kind === 'go' && (got.place === p.k || (got.place === 'nav' && got.act === (CA_NAV_ACT[p.k] || p.k)));
        out(ok, `[ca:${p.k}] "${q}"`, got ? `read as ${got.kind} ${got.place || ''} ${got.act || ''}` : 'read as nothing');
      }
    }

    /* ---- 3. THE MENU ROWS, READ: each sentence is that row, for the contract named ---- */
    for (const L of DOOR_EXAM.filter(x => x.read)){
      if (ONLY && ONLY !== 'menu') continue;
      const got = await P.evaluate(q => { let a = null; try { a = caActOf(q); } catch (_){ a = null; }
        if (!a){ try { a = caUnderstand(q, { box: 'list' }); } catch (_){ a = null; } }
        return a ? { kind: a.kind, menu: a.menu || null, cid: a.cid || null } : null; }, L.q);
      out(!!got && got.kind === L.read.kind && got.menu === L.read.menu && !!got.cid, `[${L.door}] "${L.q}"`, got ? `read as ${got.kind} ${got.menu || ''} ${got.cid || ''}` : 'read as nothing');
    }

    /* ---- 4. EVERY TYPED SENTENCE, FROM EVERY BOX, LANDS ---- */
    /* every Settings page and card, by the title the app itself gives it (navStTitles: SET_PANELS, the Company
       pages, the You rows); a title that is also a place's word is asked with "settings", as a person would */
    const st = (!ONLY || ONLY === 'st') ? await P.evaluate(() => window.navStTitles().map(x => {
      const [kind, k] = x.id.split(':');
      return { door: 'st:' + x.id, q: x.place ? x.title + ' settings' : x.title,
        spot: { page: 'settings', settings: kind === 'you' ? { tab: 'you' } : { page: k } } };
    })) : [];
    const typed = DOOR_EXAM.filter(x => x.spot && (!ONLY || x.door.startsWith(ONLY + ':'))).concat(st);
    for (const L of typed){
      /* a Settings page asked by name in Settings' own box is the finder's answer there (Settings lands, never presses) */
      const boxes = DOOR_BOXES.filter(b => !(b === 'settings' && (L.door.startsWith('st:') || (L.spot.page === 'settings'))));
      for (const box of boxes){
        let why = [];
        try {
          await fresh(box);
          const before = await where();
          await typeInto(box, L.q);
          await settle();
          const W = await where();
          why = judge(L.spot, W, before);
        } catch (e){ why = ['could not be typed: ' + String(e && e.message || e).split('\n')[0]]; }
        out(!why.length, `[${L.door} · ${box}] "${L.q}"`, why.join('; '));
      }
    }
  } catch (e){ out(false, 'the exam ran', String(e && e.message || e)); }
  out(!errors.length, 'no page errors', [...new Set(errors)].slice(0, 3).join(' | '));
  await browser.close(); await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
