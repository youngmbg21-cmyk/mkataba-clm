/* THE NEGOTIATION MEMO — driven where the reader stands
   =====================================================
   Owner-asked 9 Sep 2026. One page on demand: what is agreed, what is still
   open, what we gave up, what is blocking, and whose move it is.

   WHY THIS FILE EXISTS AND f269 IS NOT ENOUGH. f269 asks what the reading
   returns and what the source may reach for. It cannot ask the four things
   that decide whether the feature works:
     · is the row in the More menu VISIBLE PIXELS once the menu is open
       (f180's rule — a verb in the DOM and not on screen is not a verb);
     · does a real press open the drawer;
     · does the negotiation the memo is ABOUT stay lit and readable behind it —
       which is the entire reason openSidePanel was chosen over a scrimmed
       modal, and which no source check can see;
     · and does the memo, which is a reading, really leave the record alone.

   Screenshots land in test/chromium/shots/negotiation-memo/.
   Run: node test/chromium/negotiation-memo-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'negotiation-memo');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};

/* ON SCREEN, not merely in the markup — f180's rule. */
const visible = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  for (let n = el; n && n !== document.body; n = n.parentElement){
    const st = getComputedStyle(n);
    if (st.display === 'none' || st.visibility === 'hidden' || n.hidden) return false;
  }
  return true;
}, sel);

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const page = await ctx.newPage();

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  /* ---- A ROUND CARRYING ONE OF EVERY STATE THE MEMO REPORTS ----
     Filed through the real funnel, so what the memo reads is a record the
     product actually made rather than an object this file wrote. */
  const built = await page.evaluate(async () => {
    const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts[0];
    state.activeId = c.id; state.selId = c.id;
    negoInit(c);
    const cl = negoClauseList(c);
    if (cl.length < 4) return { id: c.id, ids: [], clauses: cl.length };
    const file = (i, side, text, summary) => negoEditClause(c, cl[i].clauseId, `<p>${text}</p>`,
      { side, author: side === 'owner' ? 'Wanjiru Kamau' : 'Erik Lindqvist', summary });
    await file(0, 'counterparty', 'Payment falls due within sixty (60) days.', 'Net-60');
    await file(1, 'counterparty', 'The cap is limited to six months of fees.', 'Cap to six months');
    await file(2, 'counterparty', 'Either party may terminate on ninety (90) days notice.', 'Notice to 90');
    await file(3, 'owner', 'Certificates are furnished each quarter.', 'Certificates quarterly');
    const chs = negoChanges(c);
    negoResolve(c, chs[0].id, 'accepted', { by: 'Wanjiru Kamau' });   // agreed
    negoResolve(c, chs[1].id, 'rejected', { by: 'Wanjiru Kamau' });   // blocking
    /* "WE GAVE UP" IS A TWO-STEP JOURNEY AND THE PRODUCT INSISTS ON IT:
       negoWithdraw refuses anything not already refused, because withdrawing
       is the ASKER accepting the other side's no. So our ask has to be refused
       by them first — which is exactly what the section means. A first draft
       withdrew a pending change, the product quietly refused, and the section
       came back empty. */
    negoResolve(c, chs[3].id, 'rejected', { by: 'Erik Lindqvist' });
    const gave = negoWithdraw(c, chs[3].id, { by: 'Wanjiru Kamau', side: 'owner' });
    persist(c);
    return { id: c.id, ids: chs.map(x => x.id), changes: (c.changes || []).length,
      gave: !!(gave && gave.withdrawn) };
  });
  check(built.ids.length === 4 && built.gave, '0a the fixture filed one change of every state',
    built.ids.length ? built.ids.join(', ') + (built.gave ? '' : ' — but the withdrawal was refused') : `only ${built.clauses} clauses`);
  if (!built.ids.length){ console.log('\nfixture too small'); await browser.close(); await h.stop(); process.exit(1); }

  await page.evaluate(id => openRedlineWorkbench(id), built.id);
  await page.waitForTimeout(1800);

  /* ============ 1. THE ROW IS IN THE MENU, AND ON SCREEN ============ */
  /* EVERY DRIVEN HALF BELOW IS GUARDED. A build without the feature must
     REPORT its failures rather than time out on a click that will never find
     its target — a probe that throws proves nothing, and a crash reads as an
     infrastructure problem rather than as a missing feature. */
  const hasRow = await page.locator('[data-rl-memo]').count() === 1;
  check(hasRow, '1a the negotiation page puts exactly one memo row in the More menu');
  /* The menu is in the DOM the whole time and starts hidden, so a presence
     check alone passes on a row nobody can reach — open it first. */
  await page.click('#ws-more');
  await page.waitForTimeout(400);
  check(hasRow && await visible(page, '[data-rl-memo]'),
    '1b and once the menu is open the row is VISIBLE PIXELS');
  const rowText = hasRow ? await page.locator('[data-rl-memo]').innerText() : '';
  check(/memo|notat/i.test(rowText), '1c it says what it is', rowText.trim() || 'no row');
  await page.screenshot({ path: path.join(OUT, '01-menu.png') });

  /* ============ 2. THE PRESS OPENS THE MEMO ============ */
  const before = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    return { changes: (c.changes || []).length,
      json: JSON.stringify((c.changes || []).map(x => [x.id, x.status, !!x.withdrawn])) };
  }, built.id);

  if (hasRow){ await page.click('[data-rl-memo]'); await page.waitForTimeout(900); }

  const memo = await page.evaluate(() => {
    const p = document.getElementById('side-panel');
    if (!p) return null;
    const caps = Array.from(p.querySelectorAll('div')).map(d => d.textContent.trim());
    return { open: true, text: p.innerText, copy: !!document.getElementById('ng-memo-copy'),
      role: p.getAttribute('role'), n: caps.length };
  });
  check(!!memo, '2a the press opens the side panel');
  if (memo){
    /* MATCHED CASE-INSENSITIVELY: the section captions are uppercased by CSS,
       so innerText hands back "AGREED" and a case-sensitive check reports a
       correct panel as broken. */
    for (const word of ['Agreed', 'Still open', 'We gave up', 'Blocking the deal'])
      check(memo.text.toLowerCase().includes(word.toLowerCase()),
        `2b the memo carries the "${word}" section`);
    check(/Whose move/i.test(memo.text), '2c and says whose move it is');
    check(memo.copy, '2d the one act under it is Copy');
    check(memo.role === 'dialog', '2e it announces itself as a dialog', memo.role);
  }
  await page.screenshot({ path: path.join(OUT, '02-memo.png') });

  /* THE SECTIONS AGREE WITH THE READING. A panel that says something the
     model does not is the fault the whole "counting is not drawing" rule
     exists to prevent. */
  const agree = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    if (typeof window.negoMemo !== 'function') return { counts: {}, drawn: [null, null, null, null] };
    const m = window.negoMemo(c);
    const el = document.getElementById('side-panel');
    if (!el) return { counts: m.counts, drawn: [null, null, null, null] };
    const t = el.innerText;
    return { counts: m.counts,
      drawn: ['agreed','still open','we gave up','blocking the deal'].map(w => {
        const i = t.toLowerCase().indexOf(w); if (i < 0) return null;
        const mm = /(\d+)/.exec(t.slice(i, i + 60)); return mm ? Number(mm[1]) : null; }) };
  }, built.id);
  check(agree.drawn[0] === agree.counts.agreed && agree.drawn[1] === agree.counts.open
     && agree.drawn[2] === agree.counts.gave && agree.drawn[3] === agree.counts.blocking,
    '2f every count on screen is the number the reading returned',
    `drawn ${agree.drawn.join('/')} vs ${[agree.counts.agreed, agree.counts.open, agree.counts.gave, agree.counts.blocking].join('/')}`);
  check(agree.counts.agreed >= 1 && agree.counts.blocking >= 1 && agree.counts.gave >= 1,
    '2g and the fixture really exercised three of the four sections',
    JSON.stringify(agree.counts));

  /* ============ 3. THE NEGOTIATION STAYS LIT BEHIND IT ============ */
  /* THE WHOLE REASON openSidePanel WAS CHOSEN. A scrimmed modal would put the
     memo in front of the thing it is about; this panel deliberately does not,
     so the contract stays readable and pressable while the memo is open. */
  const behind = await page.evaluate(() => {
    const scrim = document.querySelector('#modal-scrim, .modal-scrim, #panel-scrim, #ai-scrim');
    const lit = scrim ? getComputedStyle(scrim) : null;
    const paper = document.querySelector('.rl-paper, .rl-doc, #rl-doc');
    const r = paper ? paper.getBoundingClientRect() : null;
    /* Probe a point on the contract that the drawer does not cover, and ask
       the document what is actually painted there. */
    const x = r ? Math.round(r.left + Math.min(120, r.width / 3)) : 0;
    const y = r ? Math.round(r.top + 60) : 0;
    const at = (r && x > 0 && y > 0) ? document.elementFromPoint(x, y) : null;
    return {
      scrimmed: !!(lit && lit.display !== 'none' && lit.visibility !== 'hidden'
        && Number(lit.opacity || 1) > 0.01),
      paper: !!r && r.width > 0,
      onPaper: !!(at && at.closest && at.closest('.rl-paper, .rl-doc, #rl-doc')),
    };
  });
  check(behind.paper, '3a the contract is still drawn while the memo is open');
  check(!behind.scrimmed, '3b nothing dims it — the memo does not stand in front of its subject');
  check(behind.onPaper, '3c and the wording is still what the page hands back at that point');

  /* ============ 4. IT CHANGED NOTHING ============ */
  const after = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    return { changes: (c.changes || []).length,
      json: JSON.stringify((c.changes || []).map(x => [x.id, x.status, !!x.withdrawn])) };
  }, built.id);
  check(after.json === before.json, '4a opening the memo moved nothing on the record',
    after.changes + ' changes, identical states');

  /* ============ 5. COPY ============ */
  const canCopy = await page.locator('#ng-memo-copy').count() === 1;
  if (canCopy){ await page.click('#ng-memo-copy'); await page.waitForTimeout(700); }
  const clip = canCopy
    ? await page.evaluate(() => navigator.clipboard.readText().catch(() => '')).catch(() => '') : '';
  check(/Agreed/i.test(clip) && /Whose move/i.test(clip),
    '5a Copy puts the whole memo on the clipboard', String(clip).slice(0, 60).replace(/\n/g, ' | '));
  check(!/</.test(clip), '5b and it is plain text, not the panel’s markup');

  /* ============ 6. THE WAYS OUT ============ */
  const wasOpen = await page.locator('#side-panel').count() === 1;
  if (wasOpen){ await page.click('#side-panel-x'); await page.waitForTimeout(500); }
  check(wasOpen && await page.locator('#side-panel').count() === 0,
    '6a the ✕ closes it', wasOpen ? '' : 'it never opened');
  const stillThere = await page.evaluate(() => !!document.querySelector('.rl-paper, .rl-doc, #rl-doc')
    && (window.state || {}).view);
  check(stillThere === 'redline', '6b and leaves the reader on the negotiation', String(stillThere));

  if (hasRow){
    await page.click('#ws-more'); await page.waitForTimeout(300);
    await page.click('[data-rl-memo]'); await page.waitForTimeout(700);
  }
  const reopened = await page.locator('#side-panel').count() === 1;
  check(reopened, '6c it opens again');
  if (reopened){ await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  check(reopened && await page.locator('#side-panel').count() === 0,
    '6d Escape closes it too', reopened ? '' : 'it never opened');
  await page.screenshot({ path: path.join(OUT, '03-closed.png') });

  console.log(failures ? `\n${failures} FAILED` : '\nall checks passed');
  await browser.close();
  await h.stop();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
