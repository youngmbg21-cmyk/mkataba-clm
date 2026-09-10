/* Chromium verification: A REFRESH LANDS YOU WHERE YOU WERE (Job 4)
   ============================================================
   THE OWNER'S OWN WORDS (10 Sep 2026): "sometimes when i am on one page and i
   refresh, the page refreshes and lands me on a different page in which i was
   not on previously."

   NOTE "SOMETIMES". It is conditional on the DATA, which is why it is
   intermittent and why nothing pointed at it. setView wraps the RENDER in
   try/catch — deliberately, with a visible failure page — and then makes six
   more calls that were NOT guarded, with the write to LS.ui AFTER all six. One
   throw in any of them exited early and the page just navigated to was never
   recorded; the store still held the page before it.

   THIS FILE IS THE ONLY PLACE THE CLAIM CAN BE MADE. A source check cannot see
   a reload, and it cannot see that a paint threw. So the fault is STAGED the
   way it happens in the wild — one record in an unexpected shape, which
   buildAlerts then reads while painting the alerts panel — and then a REAL
   reload is driven and the page that comes back is read off the running app.

   Screenshots go to test/chromium/shots/keeps-your-page/.
   Run: node test/chromium/keeps-your-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'keeps-your-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();

  const signIn = async () => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
    }
    await page.waitForTimeout(2600);
  };
  const liveView = () => page.evaluate(() => state.view);
  const stored = () => page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('hati.v1.ui') || 'null'); } catch (_) { return null; }
  });
  const reload = async () => { await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2800); };

  const logged = [];
  page.on('console', m => { if (m.type() === 'error') logged.push(m.text()); });

  try {
    await signIn();

    /* ============ 1. CONTROL — this already works, and must go on working ============
       If it did not, everything below would be measuring a product that never
       remembered anything rather than the fault the owner reported. */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(900);
    const s1 = await stored();
    check('1a a plain navigation is recorded', !!(s1 && s1.view === 'calendar'),
      s1 ? s1.view : 'nothing stored');
    await reload();
    check('1b CONTROL — and a refresh lands there', (await liveView()) === 'calendar',
      await liveView());

    /* ============ 2. THE FAULT, STAGED THE WAY IT HAPPENS ============
       ONE RECORD IN AN UNEXPECTED SHAPE, and WHICH field was MEASURED rather
       than guessed. A first attempt staged a throwing `archived` on the
       reasoning that buildAlerts opens by reading it — and every one of the six
       paints came back clean, because buildAlerts' callers already carry their
       own try/catch. That check passed against the parent too, which makes it a
       description rather than a test.

       WHAT REALLY REPRODUCES IT: `updateSidebarCounts` reads the whole book
       unguarded — `cs.filter(c => c.status === 'Under Review')` and
       `allObligations()` — so a contract whose `obligations` throws when it is
       read takes the THIRD of the six paints down, and on the parent the three
       after it and the write to LS.ui never happen. `obligations` rather than
       `status` deliberately: the page being navigated to must still RENDER
       perfectly, or the render's own catch fires and a different mechanism is
       being measured. */
    const stage = () => page.evaluate(() => {
      const c = state.contracts[0];
      Object.defineProperty(c, 'obligations', {
        configurable: true,
        get() { throw new Error('staged: one record in an unexpected shape'); },
      });
      /* So "the later paints still ran" is observable: renderContextPanel is
         the LAST of the six and writes this heading on every view change. */
      const t = document.getElementById('panel-title');
      if (t) t.textContent = 'CLEARED';
      return true;
    });

    await stage();
    /* THE DRIVEN HALF IS GUARDED, and that is what lets a build WITHOUT the fix
       report its failures rather than stopping here. On the parent the throw
       escapes setView entirely — page.evaluate re-throws it into node and the
       whole run dies on this line, so the four claims below would never be
       reached and the file would say nothing about them. Swallowing it in the
       page is also what really happens: the app's own click wrapper is where
       the exception surfaces, and the reader is left looking at the aftermath,
       which is exactly what the checks below measure. */
    const threw2 = await page.evaluate(() => {
      try { setView('templates'); return ''; } catch (e) { return String(e && e.message || e); }
    });
    await page.waitForTimeout(1000);
    const live2 = await liveView();
    const s2 = await stored();
    const painted = await page.evaluate(() => (document.getElementById('panel-title') || {}).textContent || '');
    check('2a the page still draws — the render itself is fine', live2 === 'templates',
      live2 + (threw2 ? ` (setView threw: ${threw2})` : ''));
    check('2b and the navigation IS recorded even though a panel threw — the fault',
      !!(s2 && s2.view === 'templates'),
      s2 ? `stored "${s2.view}"` : 'nothing stored');
    check('2c the paints AFTER the failing one still ran — each is guarded on its own',
      painted !== 'CLEARED' && painted !== '',
      painted === 'CLEARED' ? 'renderContextPanel never ran' : `panel says "${painted}"`);
    check('2d a failing paint reaches the console rather than vanishing',
      logged.some(t => /failed after a view change/i.test(t)),
      logged.slice(0, 2).join(' | ') || 'nothing logged');
    await page.screenshot({ path: path.join(OUT, '01-after-the-throw.png') });

    await reload();
    const back = await liveView();
    check('2e so a refresh lands where the reader was — the owner\'s own report',
      back === 'templates', `landed on "${back}"`);

    /* ============ 3. AN UNKNOWN PAGE SAYS SO RATHER THAN OPENING A CONTRACT ============
       setView's dispatch ended `else renderWorkspace()`, so ANY name that is
       not one of the sixteen silently opened the contract workspace. It was not
       hypothetical: `templatelib` was in the restore allowlist and in no
       branch.

       A CONTRACT IS OPENED FIRST, AND THAT IS WHAT MAKES THIS A TEST RATHER
       THAN A DESCRIPTION. Asked from a standing start there is no activeId, so
       `renderWorkspace()` has nothing to draw and the check passes against the
       parent for a reason that has nothing to do with the fix. With a contract
       already open — which is the state a reader is really in when this bites,
       since the allowlist restores view AND activeId together — the parent
       genuinely opens that contract's page under the wrong name. */
    await page.evaluate(() => {
      const c = state.contracts[0]; openWorkspace(c.id);
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(800);
    const unknown = await page.evaluate(() => {
      try { setView('templatelib'); } catch (_) {}
      return { view: state.view,
        workspace: !!document.querySelector('#ws-head, [data-ws-tab]'),
        said: /no page called/i.test(document.getElementById('content').textContent || '') };
    });
    check('3a an unknown page does not silently open a contract',
      unknown.workspace === false, unknown.workspace ? 'the contract workspace opened' : 'it did not');
    check('3b and it says so on screen', unknown.said === true, String(unknown.said));

    /* ============ 4. A CONTRACT IS STILL REMEMBERED, id and all ============ */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      openWorkspace(c.id); return c.id;
    });
    await page.waitForTimeout(1400);
    const s4 = await stored();
    check('4a a contract is recorded with its id',
      !!(s4 && s4.view === 'workspace' && s4.activeId === cid),
      s4 ? `${s4.view} / ${s4.activeId}` : 'nothing stored');
    await reload();
    const after4 = await page.evaluate(() => ({ view: state.view, id: state.activeId }));
    check('4b and a refresh comes back to that same contract',
      after4.view === 'workspace' && after4.id === cid,
      `${after4.view} / ${after4.id}`);
  } catch (e) {
    check('the journey ran', false, e.message);
  }

  await browser.close();
  await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} PASS`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(b => console.log('  - ' + b.name + ' — ' + b.detail)); }
  process.exit(bad.length ? 1 : 0);
})();
