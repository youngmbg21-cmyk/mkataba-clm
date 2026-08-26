/* Chromium verification: A REFUSAL YOU GAVE HAS A WAY BACK.
   ============================================================
   Owner-reported off a photograph of the change column (13 Aug 2026): a card
   from the counterparty that we had REFUSED carried one verb — Edit. There was
   no button that undid the refusal.

   f192 pins the rules in node. THIS file exists because a verb is VISIBLE
   PIXELS, and this product has spent a week before now with a whole row of
   deal verbs rendered, wired, tested and invisible. jsdom presses hidden
   buttons happily. So everything here is measured on the real page, in the
   real cascade:

     · the button is on screen, not merely in the markup
     · it wears Edit's clothes, measured — same height, same border, same
       background as the button beside it, and NOT the accent fill
     · the card gained a button and no prose (the owner asked for that twice)
     · pressing it actually returns the ask to Accept / Reject
     · and pressing Reject again puts it back where it started

   Run: node test/chromium/reopen-a-refusal-verify.js */
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

/* Visible means visible: on screen, with size, and with nothing in its own
   ancestry hiding it. The same walk portal-header-verbs-verify does, for the
   same reason. */
const VISIBLE = `(el) => {
  if (!el) return { on: false, why: 'absent' };
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return { on: false, why: 'no size' };
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0)
      return { on: false, why: (n.className || n.tagName) + ' is hidden' };
    if (n.hasAttribute && n.hasAttribute('hidden')) return { on: false, why: 'hidden attribute' };
  }
  return { on: true, w: Math.round(r.width), h: Math.round(r.height) };
}`;

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

    /* THE REPORTED SITUATION, BUILT THE WAY IT HAPPENS: the counterparty asks
       for a change, and we refuse it. Both through the model, so the record is
       the one the screen would have had. */
    const cid = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined')
        || state.contracts[0];
      negoInit(c);
      await negoFileProposal(c, negoBaseText(c).replace(/\.\s*$/, '') + ' The Lessor shall hold critical spares locally.',
        { side: 'counterparty', author: 'Amina Wanjiru' });
      negoResolve(c, c.changes[c.changes.length - 1].id, 'rejected',
        { side: 'owner', by: 'Young Mbagaya' });
      state.activeId = c.id; state.selId = c.id;
      return c.id;
    });
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await page.waitForTimeout(1600);
    await page.evaluate(() => { if (window.rlSetCardFilter) rlSetCardFilter('all'); });
    await page.waitForTimeout(600);

    const CARD = () => document.querySelector('#rl-changes .rl-card[data-rl-reopen], #rl-changes .rl-card')
      || document.querySelector('.rl-card');

    /* ---- 1: the button is real pixels on the card ---- */
    const seen = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const card = document.querySelector('.redline-page .rl-card');
      if (!card) return { none: true };
      const btn = card.querySelector('[data-rl-reopen]');
      return { badge: (card.querySelector('.rl-badge') || {}).textContent,
        verbs: [...card.querySelectorAll('.rl-card-verbs button')].map(b => b.textContent.trim()),
        vis: vis(btn), label: btn ? btn.textContent.trim() : null,
        title: btn ? btn.getAttribute('title') : null };
    })()`);
    check('the refused card is on the page', !seen.none && /Refused/.test(seen.badge || ''),
      seen.none ? 'no card at all' : (seen.badge || '').trim());
    check('and it carries Reopen — the fault as reported was Edit alone',
      seen.vis && seen.vis.on, seen.vis ? (seen.vis.why || `${seen.vis.w}x${seen.vis.h}`) : 'absent');
    /* Reopen leads, Edit follows — the order the owner approved on the render.
       A third verb can legitimately be here: where the other side holds no live
       copy of the refusal, the card offers to send them one (the 13 Aug
       "waiting on them" work). What must NOT be here is a decision: this ask
       has been answered. */
    check('Reopen leads the row and Edit follows it',
      seen.verbs[0] === 'Reopen' && seen.verbs[1] === 'Edit', JSON.stringify(seen.verbs));
    check('and no decision is offered on an answered ask',
      !seen.verbs.includes('Accept') && !seen.verbs.includes('Reject'), JSON.stringify(seen.verbs));
    check('and the hover says what it costs before it is pressed',
      /returns to Accept or Reject/.test(seen.title || ''), seen.title);

    /* ---- 2: Edit's clothes, MEASURED ----
       The owner asked twice for this not to be a pill. jsdom resolves no class
       rules at all, so the only place that claim can be proved is here. */
    const clothes = await page.evaluate(() => {
      const card = document.querySelector('.redline-page .rl-card');
      const re = card.querySelector('[data-rl-reopen]'), ed = card.querySelector('[data-rl-edit]');
      const own = el => { const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return { bg: cs.backgroundColor, bd: cs.borderTopWidth + ' ' + cs.borderTopColor,
          fw: cs.fontWeight, fs: cs.fontSize, h: Math.round(r.height) }; };
      const acc = document.querySelector('.redline-page .rl-acc');
      return { re: own(re), ed: own(ed), acc: acc ? own(acc) : null };
    });
    check('Reopen is drawn exactly like Edit — background, border, weight, size',
      clothes.re.bg === clothes.ed.bg && clothes.re.bd === clothes.ed.bd
      && clothes.re.fw === clothes.ed.fw && clothes.re.fs === clothes.ed.fs,
      `${clothes.re.bg} / ${clothes.re.bd}`);
    check('and the same height, so the row reads as one set of verbs',
      Math.abs(clothes.re.h - clothes.ed.h) <= 1, `${clothes.re.h}px vs ${clothes.ed.h}px`);

    /* ---- 3: one button, no prose ---- */
    const prose = await page.evaluate(() => {
      const card = document.querySelector('.redline-page .rl-card');
      return { chars: card.textContent.replace(/\s+/g, ' ').trim().length,
        whose: /waiting on|your move|their move/i.test(card.textContent) };
    });
    check('no whose-move sentence was added to the card', !prose.whose,
      `${prose.chars} characters on the card`);

    /* ---- 4: pressing it puts the ask back on the table ---- */
    await page.evaluate(() => document.querySelector('.redline-page [data-rl-reopen]').click());
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => {
      const card = document.querySelector('.redline-page .rl-card');
      return { verbs: [...card.querySelectorAll('.rl-card-verbs button')].map(b => b.textContent.trim()),
        /* THE STATUS WORD STANDS DOWN under the two headings that already say
           it (the design reference's own rule, f246) — an ask back on the
           table sits under AWAITING YOU and draws none. An absent word is
           exactly as good for this claim as one that no longer says Refused,
           and the empty string reads that way. */
        badge: ((card.querySelector('.rl-badge') || {}).textContent || '').trim(),
        status: getContract(state.activeId).changes.slice(-1)[0].status,
        reopen: !!card.querySelector('[data-rl-reopen]') };
    });
    check('the ask is pending again on the record', after.status === 'pending', after.status);
    check('and the card is a decision again — Accept and Reject are back',
      after.verbs.includes('Accept') && after.verbs.includes('Reject'), JSON.stringify(after.verbs));
    check('with Reopen gone, because there is no refusal left to undo', !after.reopen);
    check('and the status corner follows', !/Refused/.test(after.badge), after.badge);

    /* ---- 5: and the loop closes — refuse it again, Reopen comes back ----
       Reject asks for a reason first (it travels back with the decision), so
       this is the whole real press: the button, the dialog, the confirm. */
    await page.evaluate(() => {
      const b = document.querySelector('.redline-page .rl-card .rl-card-verbs [data-nego-reject]');
      if (b) b.click();
    });
    await page.waitForTimeout(500);
    const asked = await page.evaluate(() => !!document.getElementById('pd-ok'));
    check('refusing asks for a reason before it files anything', asked);
    await page.evaluate(() => {
      const t = document.getElementById('pd-input');
      if (t) t.value = 'Net-30 stands.';
      const ok = document.getElementById('pd-ok');
      if (ok) ok.click();
    });
    await page.waitForTimeout(1000);
    const back = await page.evaluate(() => {
      const card = document.querySelector('.redline-page .rl-card');
      return { reopen: !!card.querySelector('[data-rl-reopen]'),
        status: getContract(state.activeId).changes.slice(-1)[0].status };
    });
    check('refusing it again brings the way back with it',
      back.status === 'rejected' && back.reopen, `${back.status}, reopen ${back.reopen}`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
