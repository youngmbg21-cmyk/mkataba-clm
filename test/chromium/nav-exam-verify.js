/* THE NAVIGATION EXAM, WHERE THE READER TYPES
   ============================================================
   (owner, 22 Oct 2026: "Make HaTi navigable by typing, the way Power BI is
   navigable by pressing")
   Every sentence of test/nav-exam.js is typed into a real Jambo box in a real
   browser, over the world of test/nav-world.js, and the app is then READ for
   where it stands (navWhere, below: the app's own location readers, put into
   the exam's one vocabulary). A sentence passes only when EVERY part of its
   spot matches: the page, the contract, what stands beside it, the clause
   landed, the party chosen, the exact rows Contracts shows, the Settings tab,
   page, person and row, the one thing chosen, or the reply kind.
   It is a MEASUREMENT: it prints the score by section and by box and every
   miss with what happened instead, writes them to NAV_EXAM_OUT when given,
   and fails only when the score falls below NAV_EXAM_MIN (a ratchet that each
   stage raises; it never goes down).
   Run: node test/chromium/nav-exam-verify.js            (all)
        NAV_EXAM_ONLY=clause node …                      (one section)  */
/* global state, hbS, pdContract, pdTab, pdFaceNow, pdSendShows, hbCvNow, regPlaceUp, regFiltered, regScope, insSelected,
   settingsTab, settingsPlace, SET_PANELS, obwPlace, intel, ai, tplPlace, tplPfChosen, tplOverviewData, getContract,
   setView, pdSendFor, hbOpenHome, hbSetFace, hbOpenCalendar, settingsGoTab, rlOpenClauseEditor, negoClauseList, openTemplateBuilder,
   api, aiWinToggle, openAI, mPhone, mS, bsCardId, bsStrip, closeModal, landOff, pdOpenOnHome, navLanding, deskPageName */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld } = require('../nav-world');
const { navWhereSrc, judge } = require('../nav-read');   // where the app stands, and the judgement (shared with the Jambo exam)
const { NAV_EXAM } = require('../nav-exam');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
/* THE RATCHET: the score may not fall below this. Stage 0 measured 81 of 194 before anything was built
   (22 Oct 2026); a run moves by a sentence or two on timing, so the floor sits a little under. Each stage
   raises it and none lowers it. */
const NAV_EXAM_FLOOR = 194;
const MIN = Number(process.env.NAV_EXAM_MIN || NAV_EXAM_FLOOR);
const ONLY = process.env.NAV_EXAM_ONLY || '';   // a section's name, or its first words

(async () => {
  /* the exam asks two hundred things in a few minutes: the per-minute AI ceiling is raised for it, as
     f128 does, so an unplaced ask is answered and never "Jambo limit reached" */
  const h = await startHati({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000' });
  await seedNavWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const results = [];
  const errors = [];
  const pages = {};
  /* one signed-in page per seat (the admin at a computer, a member at a computer, the admin on a phone) */
  async function seat(who, w, hh){
    const key = who + w;
    if (pages[key]) return pages[key];
    const ctx = await browser.newContext({ viewport: { width: w, height: hh } });
    const P = await ctx.newPage();
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    const cred = who === 'legal' ? ['everything@example.co.ke', 'their-own-pass-9'] : ['admin@example.co.ke', 'adminpassword1'];
    await P.fill('#li-email', cred[0]); await P.fill('#li-pass', cred[1]); await P.click('#li-go');
    await P.waitForFunction(() => !!(window.currentUser && currentUser() && typeof setView === 'function' && state.contracts && state.contracts.length), null, { timeout: 20000 });
    await P.evaluate(() => { state.aiConfigured = true; });
    pages[key] = P;
    return P;
  }
  const settle = async P => {
    let prev = '';
    for (let i = 0; i < 24; i++){
      const now = await P.evaluate(src => { const busy = (window.intel && intel.busy) || (window.ai && ai.busy) || (typeof navLanding === 'function' && navLanding()); return JSON.stringify([busy, new Function('return (' + src + ')()')()]); }, navWhereSrc.toString()).catch(() => '');
      if (now && now === prev && !JSON.parse(now)[0]) return;
      prev = now;
      await P.waitForTimeout(250);   // a bounded poll for the app to stand still: two equal readings a beat apart
    }
  };
  const where = P => P.evaluate(src => new Function('return (' + src + ')()')(), navWhereSrc.toString()).catch(e => ({ error: String(e.message || e) }));

  /* WHERE EACH BOX IS, AND HOW A PERSON TYPES INTO IT */
  async function typeInto(P, box, q){
    const fillEnter = async sel => { await P.waitForSelector(sel, { state: 'visible', timeout: 6000 }); await P.fill(sel, q); await P.press(sel, 'Enter'); };
    /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): everything typed on a Jambo tab goes to the AI (igTalkFirst); this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
    if (box === 'home' || box === 'board'){ await P.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); } }); return fillEnter('#igd-input'); }
    if (box === 'chat' || box === 'phone'){
      await P.evaluate(() => { const i = document.getElementById('ai-input'); const shown = i && i.offsetParent;
        if (!shown){ if (typeof aiWinToggle === 'function') aiWinToggle(); else if (typeof openAI === 'function') openAI(); } });
      return fillEnter('#ai-input');
    }
    if (box === 'list'){ await P.evaluate(() => setView('approvals')); await settle(P); return fillEnter('#jl-q'); }
    if (box === 'settings'){ await P.evaluate(() => { setView('team'); }); await settle(P); return fillEnter('#st-jb-q'); }
    if (box === 'calendar'){ await P.evaluate(() => hbOpenCalendar()); await settle(P); return fillEnter('#cal-plan-in'); }
    if (box === 'editor'){
      await P.evaluate(() => { const c = getContract('MK-A2'); const cl = negoClauseList(c); rlOpenClauseEditor(c, cl[0].clauseId, {}); });
      return fillEnter('#ce-ask');
    }
    if (box === 'builder'){
      await P.evaluate(async () => { const d = await api('templates', 'POST', { name: 'Exam probe ' + Date.now(), category: 'other', description: '' });
        const t = await api('templates/' + d.template.id); await openTemplateBuilder(d.template.id, t.versions.find(v => v.status === 'draft').id); });
      return fillEnter('#tb-ask');
    }
    throw new Error('no such box ' + box);
  }

  try {
    for (let i = 0; i < NAV_EXAM.length; i++){
      const T = NAV_EXAM[i], sec = T.sec;
      if (ONLY && !sec.startsWith(ONLY)) continue;
      const box = T.box || 'home', who = T.as || 'admin';
      const P = await seat(who, box === 'phone' ? 390 : 1440, box === 'phone' ? 844 : 780);
      let why = [], W = null;
      try {
        /* EVERY SENTENCE STARTS FROM THE SAME PLACE: a contract no sentence names, open on Home (MK-Z9),
           nothing landed — except the Board's own sentences, which start on the Board, where the owner
           keeps number and chart questions on the Board and "take me to" must still move */
        await P.evaluate(b => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} try { if (typeof landOff === 'function') landOff(); } catch (_){}
          setView('dashboard');
          if (b === 'board') { try { hbSetFace('board'); } catch (_){} }
          else if (typeof pdOpenOnHome === 'function') pdOpenOnHome('MK-Z9', 'copilot'); }, box);
        await settle(P);
        const before = await where(P);
        await typeInto(P, box, T.q);
        await settle(P);
        W = await where(P);
        /* a list of spots: right when any one is (the closest one's misses are reported) */
        const spots = Array.isArray(T.spot) ? T.spot : [T.spot];
        const tries = spots.map(sp => judge(sp, W, before));
        why = tries.find(t => !t.length) || tries.sort((a, b) => a.length - b.length)[0];
      } catch (e){ why = ['could not be typed: ' + String(e && e.message || e).split('\n')[0]]; }
      results.push({ i, sec, q: T.q, box, who, ok: !why.length, why, at: W });
      console.log(`${why.length ? 'MISS' : 'LAND'}  [${sec}${box !== 'home' ? ' · ' + box : ''}${who !== 'admin' ? ' · ' + who : ''}] ${T.q}${why.length ? ' — ' + why.join('; ') : ''}`);
    }
  } finally {
    const n = results.length, ok = results.filter(r => r.ok).length;
    const by = k => { const m = {}; for (const r of results){ const g = m[r[k]] || (m[r[k]] = [0, 0]); g[1]++; if (r.ok) g[0]++; } return m; };
    console.log('\nBY SECTION'); for (const [s, [a, b]] of Object.entries(by('sec'))) console.log(`  ${String(a).padStart(3)} / ${String(b).padEnd(3)} ${s}`);
    console.log('BY BOX'); for (const [s, [a, b]] of Object.entries(by('box'))) console.log(`  ${String(a).padStart(3)} / ${String(b).padEnd(3)} ${s}`);
    console.log(`\nLANDED EXACTLY: ${ok} of ${n} (${n ? Math.round(ok * 100 / n) : 0}%)` + (errors.length ? ` · page errors: ${errors.length}` : ''));
    if (errors.length) console.log('PAGE ERRORS  ' + [...new Set(errors)].slice(0, 5).join(' · '));
    if (process.env.NAV_EXAM_OUT) fs.writeFileSync(process.env.NAV_EXAM_OUT, JSON.stringify({ n, ok, results }, null, 1));
    await browser.close(); await h.stop();
    const pass = ok >= MIN;
    console.log(pass ? `\n${ok} passed, 0 failed (ratchet ${MIN})` : `\n${ok} passed, 1 failed (below the ratchet ${MIN})`);
    process.exit(pass ? 0 : 1);
  }
})();
