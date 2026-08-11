/* Chromium verification: A QUEUE NEEDS A DOOR.
   ============================================================
   Reported by the owner: "I clicked Read them now and it keeps giving me
   contracts to update but I have no way of stopping them from popping up."

   He was right, and it was worse than it looked. The dialog had one dismissing
   button, Cancel, and in a backfill Cancel meant NEXT — so the only way out of
   a run of forty was to dismiss forty. Escape did end the run, but silently:
   nothing said it had stopped, how many had been filed, or how many were left.
   A silent stop is worse than no exit, because it teaches people never to
   start one.

   What this asserts:
     1  a queued dialog says where you are in it — "3 of 24" — so the size of
        the job is known before you are ten deep in it
     2  Skip and Stop are different buttons with different words
     3  Stop ends the run: no further dialog opens
     4  clicking away ends the run, because that is what clicking away means
     5  Escape ends the run, and does not merely close the dialog
     6  stopping SAYS what happened — how many were filed, how many are left,
        and where to pick it up
     7  Skip still means next, so the button that was there still works
     8  a single upload's review is untouched: no position, no Stop, and
        clicking away still lets the pending save finish

   Run: node test/chromium/backfill-has-a-door-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Eight contracts with no category, so a run is long enough that being unable
   to stop it is the actual complaint rather than a theoretical one. */
const SEED = () => {
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  state.contracts.forEach(c => { if (c.metadata) delete c.metadata.category; });
  for (let i = 1; i <= 8; i++) state.contracts.push({
    id: 'NC' + i, name: 'Mutual Non-Disclosure Agreement ' + i, counterparty: 'Juno Limited ' + i,
    folder: 'proc', value: 0, status: 'Signed', expiry: day(300),
    metadata: { expiryDate: day(300) }, rounds: [], audit: [], changes: [], scan: null,
    upload: { fileName: 'nda' + i + '.pdf', extractedText: '' },
  });
  return state.contracts.filter(c => c.status !== 'Declined' && !((c.metadata || {}).category)).length;
};
const OPEN = () => ({
  up: !!document.getElementById('mr-save'),
  stop: !!document.getElementById('mr-stop'),
  skip: (document.getElementById('mr-cancel') || {}).textContent || '',
  head: (document.querySelector('#modal-root h3') || {}).parentElement?.textContent || '',
});
/* Toasts fade. Read them where they are RAISED rather than off the page, or
   the assertion depends on how fast the test got there. */
const HOOK_TOASTS = () => { window.__toasts = [];
  const real = window.toast;
  window.toast = (msg, kind) => { window.__toasts.push(String(msg)); return real(msg, kind); }; };

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    const waiting = await page.evaluate(SEED);
    await page.evaluate(HOOK_TOASTS);

    /* ---- 1 & 2: the dialog says where you are, and offers two ways out ---- */
    await page.evaluate(() => window.runMetaBackfill({ missingCategory: true }));
    await page.waitForTimeout(900);
    let m = await page.evaluate(OPEN);
    check('the queue opens a dialog', m.up, `${waiting} contracts waiting`);
    check('it says where you are in the queue', /(?:^|\D)1 of \d+/.test(m.head), m.head.replace(/\s+/g, ' ').slice(0, 60));
    check('Stop and Skip are different buttons',
      m.stop && /Skip/i.test(m.skip), `stop=${m.stop}, other button="${m.skip.trim()}"`);

    /* ---- 7: Skip still means next ---- */
    await page.click('#mr-cancel');
    await page.waitForTimeout(700);
    m = await page.evaluate(OPEN);
    check('Skip moves on to the next one', m.up && /(?:^|\D)2 of \d+/.test(m.head), m.head.replace(/\s+/g, ' ').slice(0, 60));

    /* ---- 3 & 6: Stop ends it, and says so ---- */
    await page.click('#mr-stop');
    await page.waitForTimeout(900);
    const afterStop = await page.evaluate(() => ({
      open: !!document.getElementById('mr-save'),
      said: (window.__toasts || []).join(' | '),
    }));
    check('Stop closes the dialog and opens no other', !afterStop.open);
    check('and says what is left and where to pick it up',
      /still ha(?:s|ve) no category/i.test(afterStop.said) && /Insights/i.test(afterStop.said),
      afterStop.said.slice(0, 110) || 'nothing was said');

    /* nothing reopens once stopped */
    await page.waitForTimeout(1200);
    check('and nothing reappears a moment later',
      !(await page.evaluate(() => !!document.getElementById('mr-save'))));

    /* ---- 4: clicking away ends the run ---- */
    await page.evaluate(() => window.runMetaBackfill({ missingCategory: true }));
    await page.waitForTimeout(800);
    /* dispatched rather than clicked: the panel sits over the centre of the
       scrim, so Playwright's hit-test lands on the dialog. A person clicks the
       exposed edge, which is the same listener. */
    await page.evaluate(() => document.getElementById('modal-scrim').click());
    await page.waitForTimeout(900);
    check('clicking away ends the run rather than advancing it',
      !(await page.evaluate(() => !!document.getElementById('mr-save'))));

    /* ---- 5: Escape ends the run, and says so ---- */
    await page.evaluate(() => window.runMetaBackfill({ missingCategory: true }));
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    const afterEsc = await page.evaluate(() => ({
      open: !!document.getElementById('mr-save'),
      said: ((window.__toasts || []).slice(-1)[0]) || '' }));
    check('Escape ends the run', !afterEsc.open);
    check('and does not end it in silence', /Stopped/i.test(afterEsc.said),
      afterEsc.said.slice(0, 100) || 'nothing was said');

    /* ---- 8: a single upload review is untouched ---- */
    const single = await page.evaluate(async () => {
      let confirmed = null, cancelled = false;
      window.openMetaReview({ confidence: {}, _source: 'heuristic', counterparty: 'Acme' },
        m => { confirmed = m; }, { onCancel: () => { cancelled = true; } });
      const shape = { stop: !!document.getElementById('mr-stop'),
        label: (document.getElementById('mr-cancel') || {}).textContent || '',
        head: (document.querySelector('#modal-root h3') || {}).parentElement?.textContent || '' };
      document.getElementById('modal-scrim').click();
      return { shape, cancelled };
    });
    check('a one-off review offers no Stop and no position',
      !single.shape.stop && !/\bof \d+\b/.test(single.shape.head), single.shape.head.replace(/\s+/g, ' ').slice(0, 50));
    check('its Cancel still reads Cancel, and clicking away still tells the caller',
      /cancel/i.test(single.shape.label) && single.cancelled, `"${single.shape.label.trim()}"`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
