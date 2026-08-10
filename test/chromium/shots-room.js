/* ============================================================
   shots-room — pictures of the real product, not of a mockup
   ============================================================
   Boots the actual server, logs in as an admin, and photographs the screens
   that changed: the new draft's landing on Key terms, the Document page, the
   negotiation workbench with a redline on the table, the desk, and the
   counterparty's own page.

   NOT a test. Nothing here asserts; it exists so a picture of the running
   application can be looked at instead of described. `npm test` does not run
   it — call it directly.
   ============================================================ */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'room');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
const shots = [];
async function shot(page, name, note){
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  shots.push({ name, note });
  console.log('  shot  ' + name + (note ? '  — ' + note : ''));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);

  /* A published company standard, so the "draft a contract" route is real. */
  const t = await W.admin.json('/api/templates', { method: 'POST', body: {
    name: 'Freight & Logistics Services Agreement', category: 'sales',
    description: 'Company standard.' } });
  const tid = t.template.id;
  const vers = await W.admin.json(`/api/templates/${tid}`);
  const vid = (vers.versions && vers.versions[0] && vers.versions[0].id) || vers.template.latestVersionId;
  await W.admin.json(`/api/templates/${tid}/versions/${vid}`, { method: 'PUT', body: {
    blocks: [
      { orderIndex: 0, blockType: 'heading', content: '1. Services' },
      { orderIndex: 1, blockType: 'fixed_text', content: 'The Supplier shall provide freight forwarding and logistics services across Kenya, Denmark and Finland, including customs clearance, warehousing and last-mile distribution.' },
      { orderIndex: 2, blockType: 'heading', content: '2. Charges' },
      { orderIndex: 3, blockType: 'fixed_text', content: 'The Customer shall pay the Charges set out in Schedule 2 within thirty (30) days of the date of a valid invoice. Late payment carries interest at 2% per month.' },
      { orderIndex: 4, blockType: 'heading', content: '3. Liability' },
      { orderIndex: 5, blockType: 'fixed_text', content: 'Total aggregate liability of either party arising out of or in connection with this Agreement shall not exceed the Charges paid in the preceding twelve (12) months.' },
      { orderIndex: 6, blockType: 'heading', content: '4. Governing law' },
      { orderIndex: 7, blockType: 'fixed_text', content: 'This Agreement is governed by the laws of Kenya and each party submits to the exclusive jurisdiction of its courts.' },
      { orderIndex: 8, blockType: 'heading', content: '5. Termination' },
      { orderIndex: 9, blockType: 'fixed_text', content: 'Either party may terminate this Agreement for material breach on sixty (60) days written notice.' },
    ], fields: [] } });
  await W.admin.json(`/api/templates/${tid}/versions/${vid}/publish`, { method: 'POST', body: {} });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  /* A DESKTOP, not a laptop. The Negotiate tab shares one row between its five
     tabs and its six controls above ~1670px and drops them to two lines below
     it (see the media query in redlineLayoutCss), so a 1500px shot photographs
     the narrow fallback rather than the arrangement being shown. Narrow widths
     are covered by laptops-verify, which is a test rather than a picture. */
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  ! page error: ' + e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await pause(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await pause(2400);

  /* ---------- 1. THE NEW BEHAVIOUR: a fresh draft lands on Key terms ---------- */
  await page.evaluate(id => window.tplLibNewContract(id), tid);
  await pause(800);
  await page.click('#ce-skip');
  await pause(2000);
  await shot(page, '01-new-draft-lands-on-key-terms', 'the change asked for: a new draft opens on the terms');

  const draftId = await page.evaluate(() => window.state.contracts[0].id);

  /* ---------- 2. the Document page of that same draft ---------- */
  await page.evaluate(id => {
    const c = window.state.contracts.find(x => x.id === id);
    window.roomGoTab(c, 'docs');
  }, draftId);
  await pause(1400);
  await shot(page, '02-document-page', 'the contract as paper, with the form and checks beside it');

  /* ---------- 3. a negotiation with something on the table ---------- */
  const negoId = await page.evaluate(async () => {
    const c = window.state.contracts.find(x => x.status !== 'Signed' && x.redlineText) || window.state.contracts[1];
    if (!c) return null;
    const list = window.negoClauseList ? window.negoClauseList(c) : [];
    /* By heading, not by position: a demo that redlines "clause 1" whatever it
       happens to be produces a picture nobody can read. */
    const find = word => list.find(x => String(x.label || x.title || '').toLowerCase().includes(word));
    const liability = find('liability') || list[0];
    const term = find('termination') || list[list.length - 1];
    if (liability){
      await window.negoEditClause(c, liability.clauseId,
        '<p>Total aggregate liability of either party arising out of or in connection with this Agreement shall not exceed 150% of the Charges paid in the preceding twelve (12) months.</p>',
        { side: 'owner', summary: 'Cap raised to 150% of twelve months’ charges' });
    }
    if (term && term !== liability){
      await window.negoEditClause(c, term.clauseId,
        '<p>Either party may terminate this Agreement for convenience on thirty (30) days written notice.</p>',
        { side: 'counterparty', author: 'Erik Lindqvist · ' + (c.counterparty || 'the counterparty'),
          summary: 'Termination for convenience on 30 days notice' });
    }
    if (window.persist) window.persist(c);
    return c.id;
  });
  if (negoId){
    await page.evaluate(id => window.openRedlineWorkbench(id), negoId);
    await pause(2600);
    await shot(page, '03-negotiate-workbench', 'the redline: the sheet on the left, the cards on the right');

  /* ---- A NOTICE THAT DOES NOT SIT ON THE CONTRACT ----
     Photographed because the complaint was about WHERE it was, and a place on
     the screen is the one thing prose is worst at. A review handed back used
     to be a full-width green band above the agreement; it is a card in the
     bottom-right corner with a ✕ on it. */
  const askedFor = await page.evaluate(() => {
    const c = window.state.contracts.find(x => x.id === window.state.activeId);
    if (!c || !window.reviewAsk) return { why: 'no contract or no reviewAsk' };
    const me = window.currentUser && window.currentUser();
    const other = (window.getUsers ? window.getUsers() : []).find(u => u && me && u.id !== me.id);
    const live = (window.negoChanges ? window.negoChanges(c) : []).filter(x => x.status === 'pending');
    if (!other || !live.length) return { why: 'other=' + !!other + ' live=' + live.length };
    /* Asked, then handed straight back — the state in the report. */
    /* `ids`, and it returns the review itself — reviewAsk's own contract. */
    const rv = window.reviewAsk(c, { reviewer: other, ids: [live[0].id] });
    if (!rv) return { why: 'reviewAsk refused' };
    window.reviewMark(c, live[0].id, 'cleared', { by: other.name });
    window.reviewReturn(c, { reviewId: rv.id, by: other.name });
    /* NOT PERSISTED. This drives the model directly to reach a state that
       normally takes two people and two sittings, and the server — correctly —
       refuses a verdict on a review it has already seen closed. Saving would
       put a red refusal over the very corner being photographed, about the
       set-up rather than about the page. The shot is of the screen. */
    return true;
  });
  if (askedFor && askedFor.why) console.log('  (no review shot: ' + askedFor.why + ')');
  if (askedFor === true){
    await page.evaluate(() => window.renderRedline());
    await pause(700);

    await shot(page, '03c-a-notice-floats-clear-of-the-contract',
      'a review handed back: bottom-right, over the page, with a way to clear it');
  }

  /* ---- THE DOCUMENT TAB OF A CONTRACT THAT IS ACTUALLY BEING NEGOTIATED ----
     The shot above is a fresh draft, which has no negotiation and therefore no
     door to one. This is the state the door is drawn in: at the right of the
     tab row, filled, with nothing between the tabs and the agreement. */
  await page.evaluate(id => {
    const c = window.state.contracts.find(x => x.id === id);
    if (c) window.roomGoTab(c, 'docs');
  }, negoId);
  await pause(1400);
  await shot(page, '02b-document-of-a-live-negotiation',
    'nothing between the tabs and the contract, and the one door at the right');
  await page.evaluate(id => {
    const c = window.state.contracts.find(x => x.id === id);
    if (c) window.roomGoTab(c, 'redline');
  }, negoId);
  await pause(1600);

  /* ---- THE THREE READINGS ----
     The same clauses, drawn as the wording stands today. Photographed because
     it is the one thing on this page that cannot be checked by reading the
     markup: what has to be true is that the strikes are GONE and the notice
     saying so is up. */
  const asAgreed = await page.$('[data-rl-read="agreed"]');
  if (asAgreed){
    await asAgreed.click();
    await pause(500);
    await shot(page, '03b-negotiate-as-agreed', 'the same round, read as the wording stands today');
    const back = await page.$('[data-rl-read="marks"]');
    if (back){ await back.click(); await pause(400); }
  }
  }

  /* ---------- 4. the negotiation desk ---------- */
  if (negoId){
    const opened = await page.evaluate(id => {
      const c = window.state.contracts.find(x => x.id === id);
      if (!c || !window.openDeskSheet) return false;
      window.openDeskSheet(c);
      return true;
    }, negoId);
    if (opened){
      await pause(900);
      await shot(page, '04-the-desk', 'who leads this negotiation, and who else may work on it');
      await page.evaluate(() => window.closeModal && window.closeModal());
      await pause(400);
    }
  }

  /* ---------- 5. the counterparty's own page ---------- */
  if (negoId){
    /* The server hands back the real link; building one by hand is how the
       first attempt photographed the owner's own workbench instead. The portal
       lives at /#share=t:<token> — a hash, and the token carries a prefix. */
    const link = await page.evaluate(async id => {
      const c = window.state.contracts.find(x => x.id === id);
      const payload = window.buildSharePayload(c, 'demo-hash',
        { org: window.FIRST_PARTY, sharedBy: (window.currentUser() || {}).name });
      const r = await window.api('shares', 'POST', {
        payload, channel: 'email',
        recipient: { name: 'Erik Lindqvist', email: 'erik.lindqvist@nordfrakt.co.ke' },
        message: 'Round 2 — our proposed changes are marked up. Please review.',
        purpose: 'negotiate' });
      return (r && (r.link || (r.share && r.share.link))) || null;
    }, negoId);
    if (link){
      /* A CLEAN CONTEXT, with no cookie: the counterparty has no account, and
         photographing their page from a signed-in session would show the
         owner's shell around it. */
      const guest = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });
      const cp = await guest.newPage();
      await cp.goto(link, { waitUntil: 'networkidle' });
      await pause(3000);
      await shot(cp, '05-counterparty-page', 'what the other side sees — no desk, no reviewers, no drafts');
      await guest.close();
    } else {
      console.log('  (no share link — skipping the counterparty page)');
    }
  }

  await browser.close();
  await h.stop();
  console.log('\n' + shots.length + ' shots → ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
