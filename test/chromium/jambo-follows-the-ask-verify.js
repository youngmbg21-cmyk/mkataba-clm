/* Chromium verification: JAMBO FOLLOWS THE ASK
   ============================================================
   The owner, 18 Oct 2026: "why is it when i ask jambo questions regarding the
   calendar it schedules appointments not following my command?" … "fix both
   together". Jambo's provider is stubbed in the page (window.api), so what is
   checked is what the page DOES with each answer and where each ask goes:
     1. the Calendar's Jambo answers a question in words: no Add, nothing added,
        even with "Just do it"
     2. a plan keeps a named time and says, for each block left out, why
     3. "book a meeting with Naivas on Tuesday at 2pm" typed in the main box on
        the Board opens the Calendar and its Jambo is asked the same words
     4. the same from the Counter's box
     5. a question that only mentions a template is answered as any question;
        a request for a starting point still reaches the template adviser
     6. the Calendar's panel with an answer and with "Left out", at the
        owner's three screens: nothing spills out of the panel
     7. no page errors
   Waits ask for the state, bounded. Red at main 9d27242: 1a, 1b, 2a, 2b,
   3a-3c, 4a, 5a, 5b.
   Screenshots: test/chromium/shots/jambo-follows-the-ask/ (or HATI_SHOT_DIR).
   Run: node test/chromium/jambo-follows-the-ask-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-follows-the-ask');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    await page.waitForTimeout(600);

    /* the provider's answers, scripted per route; every ask is written down */
    await page.evaluate(() => {
      const real = window.api;
      window.__asked = []; window.__planNext = null;
      window.api = async (p, m, b) => {
        if (p === 'ai/plan' || p === 'ai/template' || p === 'ai/graph'){ window.__asked.push({ p, ask: b && (b.ask || b.q || b.question || '') });
          if (p === 'ai/plan') return window.__planNext || { kind: 'answer', say: 'Nothing is due.', points: [] };
          if (p === 'ai/template') return { say: 'A template recommendation.', ranked: [] };
          return { kind: 'map', say: 'An answer about your contracts.', acts: [] };
        }
        return real(p, m, b);
      };
    });
    const asked = () => page.evaluate(() => window.__asked.slice());
    const toCalendar = async () => { await page.evaluate(() => setView('calendar')); return until(() => calOnScreen() && !!document.getElementById('cal-plan-in')); };
    const calAsk = async q => { await page.fill('#cal-plan-in', q); await page.press('#cal-plan-in', 'Enter'); };

    console.log('\n1 · the Calendar\'s Jambo answers a question');
    check('1 · on the Calendar', !!(await toCalendar()));
    await page.evaluate(() => { window.__asked.length = 0; window.__planNext = { kind: 'answer', say: 'Two dates are coming up before Christmas.',
      points: ['Tue 15 Dec: MK-A1 notice deadline', 'Fri 18 Dec: MK-A2 renewal'] }; });
    /* "Just do it", chosen the way the panel's own choice saves it */
    const setLevel = v => page.evaluate(v => { const lv = document.getElementById('cal-plan-level'); lv.value = v; lv.dispatchEvent(new Event('change', { bubbles: true })); }, v);
    await setLevel('auto');
    check('1 · "Just do it" is on', !!(await until(() => minePref().copilotLevel === 'auto' && !!document.getElementById('cal-plan-in'))));
    const before = await page.evaluate(() => (mineList('event') || []).length);
    await calAsk('what is due before Christmas?');
    const ans = await until(() => { const b = document.getElementById('cal-plan-body'); const pts = b && b.querySelectorAll('.cal-plan-pts li');
      return pts && pts.length === 2 ? { say: b.querySelector('.cal-plan-say').textContent.trim(), pts: [...pts].map(x => x.textContent.trim()), adds: b.querySelectorAll('[data-cal-plan-add], .cal-prop').length } : null; });
    check('1a the answer is said in words, each date on its own line', !!ans && /before Christmas/.test(ans.say) && /MK-A1/.test(ans.pts[0]), JSON.stringify(ans));
    check('1b and it carries nothing to add', !!ans && ans.adds === 0);
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => (mineList('event') || []).length);
    check('1c even with "Just do it", nothing was added to the calendar', after === before, before + ' → ' + after);
    await setLevel('ask');
    await until(() => minePref().copilotLevel === 'ask' && !!document.getElementById('cal-plan-in'));
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `1-answer-${w}x${hgt}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n2 · a plan keeps a named time and says why anything was left out');
    const day = await page.evaluate(() => { const t = new Date(todayISO() + 'T00:00:00'); t.setDate(t.getDate() + 1);
      while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1);
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; });
    await page.evaluate(d => { window.__asked.length = 0; window.__planNext = { kind: 'plan', say: 'Booked as you asked; one idea did not fit.', dropped: 2,
      blocks: [{ date: d, start: '07:30', end: '08:00', title: 'Call with Naivas', why: 'The time you named.', asked: true }],
      left: [{ title: 'Read the Nordkust draft', why: 'clash' }, { title: 'Sunday prep', why: 'weekend' }] }; }, day);
    await calAsk('book a call with Naivas tomorrow at 7:30');
    const plan = await until(() => { const b = document.getElementById('cal-plan-body'); const p = b && b.querySelector('.cal-prop'); const left = b && b.querySelectorAll('.cal-plan-left li');
      return p && left && left.length ? { prop: p.textContent.replace(/\s+/g, ' ').trim(), left: [...left].map(x => x.textContent.trim()), head: b.querySelector('.cal-plan-left .cal-plan-read').textContent.trim() } : null; });
    check('2a the named time is offered as asked, with Add', !!plan && /Call with Naivas/.test(plan.prop) && /07:30/.test(plan.prop) && /Add/.test(plan.prop), plan && plan.prop);
    check('2b each block left out is named with its reason', !!plan && plan.head === 'Left out:' && /Read the Nordkust draft — it sits on top of something already in your calendar/.test(plan.left[0]) && /Sunday prep — it falls on a weekend/.test(plan.left[1]), plan && JSON.stringify(plan.left));
    const sent = (await asked()).find(a => a.p === 'ai/plan');
    check('2c the words go to Jambo as typed', !!sent && sent.ask === 'book a call with Naivas tomorrow at 7:30', sent && sent.ask);
    const fit = [];
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      fit.push(await page.evaluate(() => { const p = document.getElementById('cal-plan'), r = p.getBoundingClientRect();
        const out = [...p.querySelectorAll('.cal-plan-left li, .cal-prop, .cal-plan-ask')].filter(x => { const q = x.getBoundingClientRect(); return q.right > r.right + 1 || q.left < r.left - 1; }).length;
        return { w: innerWidth, h: innerHeight, out, page: document.scrollingElement.scrollHeight <= innerHeight + 1 }; }));
      await page.screenshot({ path: path.join(OUT, `2-left-out-${w}x${hgt}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    check('6 at the three screens nothing spills out of the panel, and the page does not scroll', fit.every(f => f.out === 0 && f.page), JSON.stringify(fit));

    console.log('\n3 · "book a meeting" typed in the main box goes to the Calendar');
    await page.evaluate(() => { window.__asked.length = 0; window.__planNext = { kind: 'plan', say: 'Here is Tuesday at 14:00.', blocks: [], dropped: 0, left: [] };
      const s = hbS(); s.face = 'board'; if (window.hbSave) hbSave(); setView('dashboard'); });
    const box = await until(() => state.view === 'dashboard' && !calOnScreen() && !!document.getElementById('igd-input') && !intel.busy);
    check('3 · on the Board, the main box up', !!box);
    await page.fill('#igd-input', 'book a meeting with Naivas on Tuesday at 2pm');
    await page.press('#igd-input', 'Enter');
    const went = await until(() => calOnScreen() && window.__asked.some(a => a.p === 'ai/plan') ? window.__asked.slice() : null, null, 10000);
    check('3a the Calendar opens and its Jambo is asked the same words', !!went && went.some(a => a.p === 'ai/plan' && a.ask === 'book a meeting with Naivas on Tuesday at 2pm'), JSON.stringify(went || await asked()));
    check('3b and the contract map is not asked', !!went && !went.some(a => a.p === 'ai/graph'));
    const you = await page.evaluate(() => (document.querySelector('#cal-plan .cal-plan-you') || {}).textContent || '');
    check('3c the Calendar\'s panel shows the words it was given', you.trim() === 'book a meeting with Naivas on Tuesday at 2pm', you);
    await page.screenshot({ path: path.join(OUT, '3-handed-over-1440x780.png') });

    console.log('\n4 · the same from the Counter');
    await page.evaluate(() => { window.__asked.length = 0; setView('counter'); });
    await until(() => !!document.getElementById('cn-q'));
    await page.fill('#cn-q', 'set up a 30 min catch-up with legal on Friday');
    await page.press('#cn-q', 'Enter');
    const cn = await until(() => calOnScreen() && window.__asked.some(a => a.p === 'ai/plan') ? window.__asked.slice() : null, null, 10000);
    check('4a the Counter hands it to the Calendar\'s Jambo', !!cn && cn.some(a => a.ask === 'set up a 30 min catch-up with legal on Friday'), JSON.stringify(cn || await asked()));

    console.log('\n5 · "template" alone no longer steers');
    await page.evaluate(() => { window.__asked.length = 0; const s = hbS(); s.face = 'board'; if (window.hbSave) hbSave(); setView('dashboard'); });
    await until(() => state.view === 'dashboard' && !calOnScreen() && !!document.getElementById('igd-input') && !intel.busy);
    await page.fill('#igd-input', 'What does our NDA template say about the notice period?');
    await page.press('#igd-input', 'Enter');
    const q1 = await until(() => !intel.busy && window.__asked.length ? window.__asked.slice() : null, null, 10000);
    check('5a a question that mentions a template is not sent to the template adviser', !!q1 && !q1.some(a => a.p === 'ai/template'), JSON.stringify(q1));
    await page.evaluate(() => { window.__asked.length = 0; });
    await until(() => !intel.busy);
    await page.fill('#igd-input', 'Which template should I start from for a supplier deal?');
    await page.press('#igd-input', 'Enter');
    const q2 = await until(() => !intel.busy && window.__asked.length ? window.__asked.slice() : null, null, 10000);
    check('5b a request for a starting point still reaches the template adviser', !!q2 && q2.some(a => a.p === 'ai/template'), JSON.stringify(q2));

    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
