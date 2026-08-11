/* Chromium verification: THE SETTINGS PAGE HOLDS STILL WHILE YOU ANSWER IT.
   ============================================================
   Reported with a screenshot of the two company cards ringed in red (Young,
   11 Aug 2026): "When I make selections, the page glitches."

   Both handlers answered a change by calling renderTeam(), which rebuilds the
   whole settings screen — and half of that screen is filled from the server
   after the fact. Measured before the fix, on one tick of a box: the page lost
   703px in the same frame and the card being read jumped 260px UP, then walked
   back down as each answer landed. The scroll offset never moved, which is why
   it reads as the page lurching rather than as a scroll — and why setView's
   scroll-keeping could never have helped. The content ABOVE the reader shrank.

   WHAT THIS FILE PINS, and the numbers are what make it a test rather than a
   description: the card does not move, the page does not change height, and
   the control the reader just used keeps its focus. A rebuild fails all three.

   AND THE ONE CASE THAT IS STILL A REBUILD: a reader who has never chosen a
   language reads the one that goes with the market, so moving the market moves
   every word on the page. Patching three lines there would leave a
   half-translated screen. It redraws — and the panels hold their height while
   they refill, so even that does not lurch.

   Run: node test/chromium/settings-holds-still-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* How far the card under the reader is allowed to travel, in pixels, at any
   sample between the press and everything settling. Not zero: a line of text
   that becomes a longer line of text genuinely moves what is under it, and a
   test that forbade that would forbid the content changing at all. The fault
   this file exists to catch was 260. */
const DRIFT_OK = 40;

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Press something, then watch the page for a second and a half and report the
   worst it did — the frame after the press, and every sample after that. A
   single reading taken once it has settled sees nothing at all. */
async function watch(page, press) {
  await page.evaluate(() => {
    const sc = document.getElementById('content-scroll');
    window.__w = [];
    window.__mark = () => {
      /* Found through the checkbox rather than through the marker this fix
         added, so the measurement also runs against the code before it — a
         test that cannot execute on the old code proves nothing about the
         numbers it quotes. */
      const cb = document.querySelector('[data-ws-shape="standing"]');
      const card = cb ? cb.closest('label') : null;
      const mkt = document.getElementById('set-market');
      window.__w.push({
        top: card ? Math.round(card.getBoundingClientRect().top) : null,
        mktTop: mkt ? Math.round(mkt.getBoundingClientRect().top) : null,
        h: sc.scrollHeight, scroll: sc.scrollTop,
        focus: document.activeElement ? (document.activeElement.id
          || document.activeElement.getAttribute('data-ws-shape') || document.activeElement.tagName) : null,
      });
    };
    window.__mark();
  });
  await press();
  await page.evaluate(() => {
    window.__mark();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => window.__mark());
    [30, 80, 200, 400, 800, 1400].forEach(ms => setTimeout(() => window.__mark(), ms));
  });
  await page.waitForTimeout(1700);
  const w = await page.evaluate(() => window.__w);
  const base = w[0];
  const drift = k => Math.max(...w.map(s => Math.abs((s[k] ?? 0) - (base[k] ?? 0))));
  /* THE COLLAPSE HAS A DIRECTION, and it is the half worth measuring on its
     own. Panels emptying ABOVE the reader pull their card UP the screen and
     take height OFF the page. Words getting longer — which is exactly what a
     redraw into Swedish does — pushes the card DOWN and adds height. One is
     the fault; the other is the content honestly changing. */
  const sagUp = k => Math.max(0, ...w.map(s => (base[k] ?? 0) - (s[k] ?? 0)));
  return { w, base, last: w[w.length - 1],
    cardDrift: drift('top'), mktDrift: drift('mktTop'), hDrift: drift('h'),
    cardUp: sagUp('top'), mktUp: sagUp('mktTop'), hLost: sagUp('h') };
}

(async () => {
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
    await page.waitForTimeout(2400);

    await page.evaluate(() => setView('team'));
    await page.waitForTimeout(1600);
    /* Both shapes on, the way the reported screen had them, and a language
       actually chosen — which is every workspace past its first sitting, and
       the ordinary path this fix is about. The flip is tested on its own at
       the end. */
    await page.evaluate(() => {
      currentUser().lang = 'en';
      wsSet(['standing', 'project'], 'project');
      renderTeam();
    });
    await page.waitForTimeout(1600);
    await page.evaluate(() =>
      document.querySelector('[data-ws-shape="standing"]').closest('section').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);

    /* ---------- 1. a tick box ---------- */
    let r = await watch(page, () => page.click('[data-ws-shape="standing"]'));
    check('ticking a shape does not move the card under the reader',
      r.cardDrift <= DRIFT_OK, `moved ${r.cardDrift}px (was 260 before the fix)`);
    check('and the page does not change height while it saves',
      r.hDrift <= DRIFT_OK, `height moved ${r.hDrift}px (was 703 before the fix)`);
    check('and the box the reader just pressed keeps the focus',
      r.last.focus === 'standing', `focus on ${r.last.focus}`);

    const tint = await page.evaluate(() => {
      const lab = k => document.querySelector(`[data-ws-box="${k}"]`);
      const on = k => document.querySelector(`[data-ws-shape="${k}"]`).checked;
      return { offTinted: lab('standing').style.background.includes('color-mix'), standingOn: on('standing'),
               onTinted: lab('project').style.background.includes('color-mix'), projectOn: on('project') };
    });
    check('the tint follows the tick without a rebuild',
      !tint.offTinted && !tint.standingOn && tint.onTinted && tint.projectOn,
      `standing ${tint.standingOn ? 'on' : 'off'}/${tint.offTinted ? 'tinted' : 'plain'} · project ${tint.projectOn ? 'on' : 'off'}/${tint.onTinted ? 'tinted' : 'plain'}`);
    check('and the answer reached the record',
      (await page.evaluate(() => wsCfg().shapes.join(','))) === 'project',
      await page.evaluate(() => wsCfg().shapes.join(',')));

    /* ---------- 2. the refusal ---------- */
    r = await watch(page, () => page.click('[data-ws-shape="project"]'));
    const refused = await page.evaluate(() => ({
      shapes: wsCfg().shapes.join(','),
      boxes: [...document.querySelectorAll('[data-ws-shape]')]
        .filter(b => b.checked).map(b => b.getAttribute('data-ws-shape')).join(','),
    }));
    check('taking the last shape off is refused, and the box goes back',
      refused.shapes === 'project' && refused.boxes === 'project',
      `record ${refused.shapes || '(none)'} · screen ${refused.boxes || '(none)'}`);
    check('and the refusal does not move the page either',
      r.cardDrift <= DRIFT_OK && r.hDrift <= DRIFT_OK, `card ${r.cardDrift}px · height ${r.hDrift}px`);

    /* ---------- 3. the word ---------- */
    r = await watch(page, async () => {
      await page.selectOption('#set-work-word', 'matter');
      await page.focus('#set-work-word');
    });
    check('changing the word saves it',
      (await page.evaluate(() => wsCfg().word)) === 'matter',
      await page.evaluate(() => wsCfg().word));
    check('and nothing repaints, so the select is still there to change again',
      r.cardDrift <= DRIFT_OK && r.last.focus === 'set-work-word',
      `card ${r.cardDrift}px · focus ${r.last.focus}`);

    /* ---------- 4. the suggestion ---------- */
    await page.evaluate(() => { wsSet(['standing'], 'matter'); renderTeam(); });
    await page.waitForTimeout(1400);
    await page.evaluate(() =>
      document.querySelector('[data-ws-shape="standing"]').closest('section').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    r = await watch(page, () => page.click('#ws-use-detected'));
    const sug = await page.evaluate(() => ({
      want: wsDetect().suggests.join(','), got: wsCfg().shapes.join(','),
      boxes: [...document.querySelectorAll('[data-ws-shape]')]
        .filter(b => b.checked).map(b => b.getAttribute('data-ws-shape')).join(','),
    }));
    check('"use what you see" applies the suggestion and ticks the boxes to match',
      sug.got === sug.want && sug.boxes === sug.want, `suggested ${sug.want} · screen ${sug.boxes}`);
    check('and it does not move the page',
      r.cardDrift <= DRIFT_OK && r.hDrift <= DRIFT_OK, `card ${r.cardDrift}px · height ${r.hDrift}px`);

    /* ---------- 5. the market, with a language already chosen ---------- */
    /* An approval rule with a money threshold, so there is something OFF this
       card that has to follow the currency. */
    await page.evaluate(() => {
      saveApprovalRules([{ id: 'r_mkt', order: 1, cond: { type: 'value', op: '>=', value: 5000000 },
        approver: { kind: 'role', role: 'admin' } }]);
      renderTeam();
    });
    await page.waitForTimeout(1400);
    await page.evaluate(() =>
      document.getElementById('set-market').closest('section').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    r = await watch(page, () => page.selectOption('#set-market', 'sweden'));
    check('changing the market does not move the page',
      r.cardDrift <= DRIFT_OK && r.mktDrift <= DRIFT_OK && r.hDrift <= DRIFT_OK,
      `card ${r.cardDrift}px · dropdown ${r.mktDrift}px · height ${r.hDrift}px`);
    const facts = await page.textContent('#set-market-facts');
    check('and the three facts under it follow the new market',
      /SEK/.test(facts) && /Swedish law/.test(facts) && !/KES/.test(facts),
      facts.replace(/\s+/g, ' ').trim().slice(0, 90));
    const arText = await page.textContent('#approval-rules');
    check('and so does the money in the approval rules, off this card',
      /SEK/.test(arText) && !/KES/.test(arText), arText.replace(/\s+/g, ' ').trim().slice(0, 80));
    check('the reader who chose English is still reading English',
      (await page.evaluate(() => langId())) === 'en'
      && /Currency/.test(facts), `lang ${await page.evaluate(() => langId())}`);

    /* ---------- 6. the one case that is still a redraw ---------- */
    await page.evaluate(() => {
      /* Nobody has chosen a language: the market decides it. */
      currentUser().lang = null;
      try { lsSet(I18N_LS, null); } catch (e) {}
      jxSet('kenya'); renderTeam();
    });
    await page.waitForTimeout(1600);
    await page.evaluate(() =>
      document.getElementById('set-market').closest('section').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    r = await watch(page, () => page.selectOption('#set-market', 'sweden'));
    const flipped = await page.evaluate(() => ({
      lang: langId(),
      elsewhere: document.querySelector('#set-page h4') ? document.querySelector('#set-page h4').textContent : '',
      facts: document.getElementById('set-market-facts').textContent,
    }));
    check('a market that changes the language redraws the WHOLE page, not three lines',
      flipped.lang === 'sv' && /Medlemmar/.test(flipped.elsewhere) && /Valuta/.test(flipped.facts),
      `lang ${flipped.lang} · elsewhere "${flipped.elsewhere.trim()}"`);
    /* Not the total drift here: the page really is being redrawn into another
       language and longer sentences push what is under them down. What must
       not happen is the collapse — the panels emptying, the page losing height
       and the dropdown snapping UP before walking back. That is the direction
       this measures, and before the fix it was 234px up and 703px lost. */
    check('and even that redraw holds its panels, so nothing collapses under the reader',
      r.mktUp <= DRIFT_OK && r.hLost <= DRIFT_OK,
      `dropdown rose ${r.mktUp}px (was 234) · page lost ${r.hLost}px (was 703) · settled ${r.last.mktTop - r.base.mktTop}px lower on longer Swedish`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
