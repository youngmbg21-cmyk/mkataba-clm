/* ============================================================
   competing-redlines-verify — ONE PROPOSAL ON THE TABLE, as pixels
   ============================================================
   The node suite (f207) proves the model and the markup; this file proves the
   piece a jsdom test cannot: that the fix is VISIBLE in the real workbench —
   the counter filed on a contested clause takes the table on screen, the
   superseded ask leaves the column while its record survives, the countering
   card explains itself, a legacy contract's two rivals both wear tags on the
   paper, and pressing the buried rival's card actually moves the document.

   Run: node test/chromium/competing-redlines-verify.js */
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

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ID = 'MK-A2';

  try {
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- 1 · the counter takes the table, live in the workbench ---- */
    const b = await page.evaluate(async id => {
      const c = getContract(id); await ensureFull(c); negoInit(c);
      const cl = negoClauseList(c)[0].clauseId;
      const ours = await negoEditClause(c, cl, '<p>Payment within forty-five (45) days.</p>',
        { side: 'owner', author: currentUser().name });
      const theirs = await negoEditClause(c, cl, '<p>Payment within ninety (90) days.</p>',
        { side: 'counterparty', author: 'Grace Wanjiru', via: 'their link' });
      persist(c);
      return { ours: { id: ours.id, status: ours.status, supersededBy: ours.supersededBy },
        theirs: { id: theirs.id, status: theirs.status, counterOf: theirs.counterOf } };
    }, ID);
    check('the counter supersedes on a REAL page, linked both ways',
      b.ours.status === 'superseded' && b.ours.supersededBy === b.theirs.id
        && b.theirs.counterOf === b.ours.id, JSON.stringify(b));

    await page.evaluate(id => openRedlineWorkbench(id), ID);
    await page.waitForTimeout(1800);

    const bench = await page.evaluate(({ oursId, theirsId }) => {
      const vis = el => !!(el && el.getClientRects().length);
      const card = sel => document.querySelector(`#rl-changes [data-nego-card="${sel}"]`);
      const counterLine = card(theirsId) && card(theirsId).querySelector('.rl-counterline');
      return {
        oursCard: vis(card(oursId)),
        theirsCard: vis(card(theirsId)),
        counterLine: counterLine ? counterLine.textContent.trim() : null,
        counterLineVisible: vis(counterLine),
        tagsOnPaper: (() => {
          /* One body per clause, one shown at a time — open it before reading. */
          const cl = document.querySelector('#rl-doc .nego-clause.is-changed');
          if (cl && window.rlCpSetShown) rlCpSetShown(document, cl.getAttribute('data-clause'));
          return [...document.querySelectorAll('#rl-cp-body .rl-cp-src.is-on .rl-cp-row')]
            .map(t => t.textContent.trim()); })(),
        pill: (document.querySelector('[data-rl-cardfilter="all"] .rl-fseg-n') || {}).textContent || null,
      };
    }, { oursId: b.ours.id, theirsId: b.theirs.id });
    check('the superseded card has left the column', !bench.oursCard, JSON.stringify(bench.oursCard));
    check('the counter is the one live card', bench.theirsCard);
    /* ---- CLAIM REVERSED IN PLACE, 15 Aug 2026 ----
       This asserted the countering card CARRIES a line naming what it replaced,
       as visible pixels. The owner saw it on the real page and ruled it out:
       "avoid adding more information to the cards unless I ask you to." The
       card already carries an id, a status, a clause, an author, a company, the
       marked wording, a reason and its verbs; a ninth line about record-keeping
       pushed the wording down for the least of them.

       The FACT is untouched and is asserted above — counterOf is stamped on the
       change, and f207 pins the audit line and the payload. What went is one
       line of prose. So the claim becomes its opposite, measured the same way. */
    check('and the card does NOT explain what it countered — the record does',
      !bench.counterLineVisible && !bench.counterLine,
      bench.counterLine === null ? 'no counter line drawn' : 'STILL DRAWN: ' + bench.counterLine);
    check('the panel names ONE live ask — one proposal on the table',
      bench.tagsOnPaper.length === 1 && bench.tagsOnPaper[0].includes(b.theirs.id),
      JSON.stringify(bench.tagsOnPaper));

    /* ---- 2 · a LEGACY contract's rivals both wear tags, and both cards land ---- */
    const l = await page.evaluate(async id => {
      const c = getContract(id); await ensureFull(c);
      /* Restore the superseded ask to pending — the stored shape of a contract
         written before the rule. The paper must draw both honestly. */
      const ours = c.changes.find(x => x.supersededBy);
      ours.status = 'pending'; delete ours.supersededBy; delete ours.supersededAt;
      persist(c);
      renderRedline();
      return { oursId: ours.id, clauseId: ours.clauseId };
    }, ID);
    await page.waitForTimeout(1500);

    const legacy = await page.evaluate(({ oursId, theirsId, clauseId }) => {
      const vis = el => !!(el && el.getClientRects().length);
      /* The panel holds a body per clause and shows one at a time, so it has to
         be OPENED on the clause under test before its rows are pixels. */
      if (window.rlCpSetShown) rlCpSetShown(document, clauseId);
      const tags = [...document.querySelectorAll('#rl-cp-body .rl-cp-src.is-on .rl-cp-row')]
        .filter(vis).map(t => t.textContent.trim());
      const anchor = document.querySelector(`#rl-doc [data-nego-card-anchor~="${oursId}"]`);
      return { tags,
        anchorHoldsBoth: !!anchor && (anchor.getAttribute('data-nego-card-anchor') || '').split(/\s+/).length === 2,
        cards: [...document.querySelectorAll('#rl-changes [data-nego-card]')].filter(vis)
          .map(n => n.getAttribute('data-nego-card')) };
    }, { oursId: l.oursId, theirsId: b.theirs.id, clauseId: l.clauseId });
    check('a legacy clause names BOTH asks in its panel',
      legacy.tags.some(t => t.includes(l.oursId)) && legacy.tags.some(t => t.includes(b.theirs.id)),
      JSON.stringify(legacy.tags));
    check('one clause, one anchor, both ids', legacy.anchorHoldsBoth);
    check('both cards are back in the column', legacy.cards.length === 2, JSON.stringify(legacy.cards));

    /* ---- 3 · pressing the buried rival's card MOVES the document ---- */
    const press = await page.evaluate(async oursId => {
      const doc = document.getElementById('rl-doc');
      doc.scrollTop = doc.scrollHeight;               // scroll the clause away first
      const before = doc.scrollTop;
      /* The press listener rides the card's HEAD — the article itself is not
         a control (verbs and composers live on it). */
      const card = document.querySelector(`#rl-changes [data-nego-card="${oursId}"] .rl-card-head`);
      card.click();
      await new Promise(r => setTimeout(r, 900));
      const lit = document.querySelector(`#rl-doc [data-nego-card-anchor~="${oursId}"]`);
      return { moved: doc.scrollTop !== before,
        linked: !!(lit && lit.classList.contains('is-linked')) };
    }, l.oursId);
    check('pressing the once-dead card now lands on its clause',
      press.moved || press.linked, JSON.stringify(press));

    /* ---- 4 · the accept guard, in the real UI's own words ---- */
    const guard = await page.evaluate(async ({ oursId, theirsId }) => {
      const c = getContract(document.location.hash.includes('MK') ? 'MK-A2' : 'MK-A2');
      negoResolve(c, oursId, 'accepted', { side: 'counterparty', by: 'Grace Wanjiru' });
      window.__toasts = [];
      const t = window.toast; window.toast = (m, k) => { window.__toasts.push(String(m)); return t && t(m, k); };
      const second = negoResolve(c, theirsId, 'accepted', { side: 'owner', by: currentUser().name });
      window.toast = t;
      return { second: second === null, said: window.__toasts.join(' | '),
        wording: richToText(negoResolvedBody(c)).includes('forty-five') };
    }, { oursId: l.oursId, theirsId: b.theirs.id, clauseId: l.clauseId });
    check('accepting the rival on an adopted clause is refused', guard.second);
    check('in words that name the adopted change and the way out',
      guard.said.includes(l.oursId) && /reopen|reject/i.test(guard.said), guard.said.slice(0, 110));
    check('and the adopted wording is untouched', guard.wording);

    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } catch (e) {
    check('the journey ran to the end', false, String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
