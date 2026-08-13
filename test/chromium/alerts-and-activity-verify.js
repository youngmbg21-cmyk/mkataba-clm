/* Chromium verification: THE BELL AND THE PANEL STOP BEING THE SAME BUTTON.
   ============================================================
   Owner's ask, 12 Aug 2026. The bell's click handler literally pressed the
   panel button, its own tooltip admitted it, and the blue dot beside it was
   hard-coded markup: always on, counting nothing. An always-on badge is worse
   than no badge — people learn to ignore it, which is what had happened.

   WHY THIS IS A BROWSER FILE. Three of the claims are about PIXELS and jsdom
   cannot answer any of them: that the dot is NOT DRAWN at zero (a `hidden`
   attribute loses to a class rule and jsdom resolves no class rules), that the
   two icons produce different content in the SAME shell (same box, same width),
   and that pressing one while the other is showing SWAPS rather than stacks.

   Screenshots go to test/chromium/shots/alerts/.
   Run: node test/chromium/alerts-and-activity-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'alerts');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BOX = `(sel => { const el = document.querySelector(sel); if (!el) return null;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
        && r.right > 0 && r.left < innerWidth,
    text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 90) }; })`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2600);

    /* ---- 1. THE DOT IS NOT DRAWN WHEN NOTHING IS WAITING ---- */
    const zero = await page.evaluate(box => ({
      n: alertCount(), dot: eval(box)('#hdr-notify-dot'),
      title: (document.getElementById('hdr-notify') || {}).title,
    }), BOX);
    if (zero.n === 0) {
      check('with nothing waiting, the badge is not drawn at all',
        !!zero.dot && !zero.dot.on, zero.dot ? `${zero.dot.w}x${zero.dot.h}` : 'missing element');
      check('and the bell says so rather than nothing',
        /nothing is waiting/i.test(zero.title || ''), zero.title);
    } else {
      check('the badge shows the real count it starts with',
        !!zero.dot && zero.dot.on && zero.dot.text === String(Math.min(zero.n, 9)) + (zero.n > 9 ? '+' : ''),
        `${zero.n} alerts, badge reads "${zero.dot && zero.dot.text}"`);
    }

    /* ---- 2. GIVE THE READER SOMETHING TO BE ALERTED ABOUT ---- */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      negoInit(c);
      negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'sixty (60) days', why: 'Our cycle runs monthly.' });
      return c.id;
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { setView('dashboard'); });
    await page.waitForTimeout(900);

    const some = await page.evaluate(box => ({
      n: alertCount(),
      dot: eval(box)('#hdr-notify-dot'),
      title: (document.getElementById('hdr-notify') || {}).title,
      door: alertCount() ? buildAlerts()[0].kind : null,
    }), BOX);
    check('THE DOT NOW CARRIES A REAL NUMBER', some.n > 0 && !!some.dot && some.dot.on,
      `${some.n} alerts, badge "${some.dot && some.dot.text}"`);
    check('and the number matches the count', some.dot && some.dot.text === String(some.n),
      `${some.dot && some.dot.text} vs ${some.n}`);
    check('ONE COUNT, MANY SURFACES — the negotiation alert agrees with the door',
      await page.evaluate(id => {
        const a = buildAlerts().filter(x => x.kind === 'negotiation' && x.id === id);
        return a.length === 1 && /1 change/.test(a[0].text) && negoNeedsYouIds(getContract(id)).length === 1;
      }, cid));

    /* ---- 3. TWO ICONS, TWO CONTENTS, ONE SHELL ---- */
    await page.click('#cmd-panel');
    await page.waitForTimeout(700);
    const act = await page.evaluate(box => ({
      panel: eval(box)('#context-panel'), title: eval(box)('#panel-title'),
      body: (document.getElementById('panel-body') || {}).textContent,
      face: panelFace(),
    }), BOX);
    check('the panel icon opens Activity', act.face === 'activity' && /Activity/i.test(act.title.text || ''),
      act.title && act.title.text);
    check('and it says its scope is the whole workspace',
      /whole workspace/i.test(act.body || ''), (act.body || '').slice(0, 60));
    await page.screenshot({ path: path.join(OUT, '01-activity.png') });

    await page.click('#hdr-notify');
    await page.waitForTimeout(700);
    const al = await page.evaluate(box => ({
      panel: eval(box)('#context-panel'), title: eval(box)('#panel-title'),
      body: (document.getElementById('panel-body') || {}).textContent,
      face: panelFace(), rows: document.querySelectorAll('[data-alert-i]').length,
      panels: document.querySelectorAll('#context-panel').length,
    }), BOX);
    check('pressing the bell SWAPS the content rather than opening a second panel',
      al.face === 'alerts' && al.panels === 1 && !!al.panel && al.panel.on,
      `${al.panels} panel(s), face=${al.face}`);
    check('IT IS THE SAME SHELL — same box, same width',
      al.panel.w === act.panel.w && al.panel.x === act.panel.x && al.panel.h === act.panel.h,
      `${act.panel.w}x${act.panel.h} at ${act.panel.x} → ${al.panel.w}x${al.panel.h} at ${al.panel.x}`);
    check('the panel SAYS which it is showing', /Alerts/i.test(al.title.text || ''), al.title.text);
    check('and its scope is the person, not the workspace',
      /waiting on you/i.test(al.body || '') && !/whole workspace/i.test(al.body || ''),
      (al.body || '').slice(0, 60));
    check('the contents genuinely differ', al.body !== act.body);
    check('and every alert is a row you can press', al.rows === some.n, `${al.rows} rows`);
    await page.screenshot({ path: path.join(OUT, '02-alerts.png') });

    /* ---- 4. AN ALERT IS A DOOR ---- */
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[data-alert-kind="negotiation"]')][0];
      if (b) b.click();
    });
    await page.waitForTimeout(1600);
    const went = await page.evaluate(() => ({ view: state.view, held: redlineHeldId(),
      panelOpen: !!state.panelOpen }));
    check('pressing an alert goes to the thing that needs doing, not to a list',
      went.view === 'redline' && went.held === cid, `${went.view} / ${went.held}`);
    check('and the panel gets out of the way', went.panelOpen === false);

    /* ---- 5. THE DOT CLEARS WHEN THE WORK IS DONE, NOT WHEN IT IS LOOKED AT ---- */
    const looked = await page.evaluate(() => alertCount());
    check('looking at the panel did not clear it', looked === some.n, `${looked} still waiting`);
    await page.evaluate(id => {
      const c = getContract(id);
      (c.changes || []).forEach(ch => { if (ch.authorSide === 'counterparty') ch.status = 'accepted'; });
      updateSidebarCounts();
    }, cid);
    await page.waitForTimeout(600);
    const after = await page.evaluate(box => ({ n: alertCount(), dot: eval(box)('#hdr-notify-dot') }), BOX);
    check('answering the change is what takes it off the bell',
      after.n === some.n - 1, `${some.n} → ${after.n}`);
    if (after.n === 0) check('and at zero the badge disappears', !after.dot.on);

    /* ---- 6. NO ALERT NAMES A CONTRACT OUTSIDE THE READER'S STREAMS ---- */
    const scoped = await page.evaluate(() => {
      const ids = new Set(state.contracts.map(c => c.id));
      return buildAlerts().filter(a => a.id && !ids.has(a.id)).map(a => a.id);
    });
    check('every alert names a contract this reader can actually open',
      scoped.length === 0, scoped.join(', ') || 'all in scope');

    /* ---- 7. INSIGHTS WORKS LIKE EVERY OTHER PAGE ----
       REVERSED 13 Aug 2026, owner-reported: "the alerts and the activity
       buttons stop working when I am in the insights tab." They did. The
       suppression was written when this panel was a COLUMN and would have
       fought the Intelligence dock for the width; it is a slide-over now and
       takes no width at all — which the product had already accepted on this
       very page, since the Copilot panel overlays the same space there and was
       never suppressed. */
    await page.evaluate(() => setView('intel'));
    await page.waitForTimeout(1400);
    const onIntel = await page.evaluate(async box => {
      const b = document.getElementById('hdr-notify');
      const off = b.disabled, why = b.title;
      b.click();
      await new Promise(r => setTimeout(r, 500));
      return { view: state.view, panel: eval(box)('#context-panel'),
        off, why, dot: eval(box)('#hdr-notify-dot'),
        title: (document.getElementById('panel-title') || {}).textContent || '',
        panIcon: (document.getElementById('cmd-panel') || {}).disabled };
    }, BOX);
    check('on Insights both header buttons are live',
      !onIntel.off && !onIntel.panIcon,
      `bell disabled=${onIntel.off} activity disabled=${onIntel.panIcon}`);
    check('and the bell opens its panel over the page, like anywhere else',
      onIntel.panel.on, `view=${onIntel.view} · ${onIntel.title.trim()}`);
    /* THE COST WAS NOT ONLY A DEAD BUTTON — the badge was hidden too, so a
       reader on Insights could not see that anything was waiting on them. */
    check('and the alert badge is not hidden by the page you happen to be on',
      onIntel.dot.on, onIntel.dot.on ? 'drawn' : 'MISSING');

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  if (bad) process.exit(1);
})();
