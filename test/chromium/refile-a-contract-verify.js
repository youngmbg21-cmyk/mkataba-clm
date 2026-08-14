/* Chromium verification: AN ADMIN CAN RE-FILE A CONTRACT
   ============================================================
   f200 proves the server refuses a non-admin's move and lets an admin's
   through, and it reads the browser half off the source. Neither can see a
   pixel: jsdom resolves no class rules, so a picker that is present, wired,
   tested and INVISIBLE passes every node test in the suite — the exact fault
   this codebase shipped once already, when the counterparty's deal verbs sat
   behind [hidden] for a week with the suite green.

   So this file opens the real shell in a real browser and asks:

     · an admin standing on Key terms sees a real picker on the value-stream
       row, as visible pixels measured through its ancestors
     · an EDITOR standing on the same row sees text and no control at all
     · choosing another stream ASKS FIRST, and the question names both drawers
       and how many people can see it before and after
     · cancelling puts the picker back and moves nothing
     · confirming moves it, writes the audit line, and the room's own sub-line
       under the contract's name says the new drawer
     · a SIGNED contract still offers it (D-1) — filing is housekeeping
     · the picker offers no "create a new folder" option

   Run: node test/chromium/refile-a-contract-verify.js */
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

/* IS IT ACTUALLY ON SCREEN — the ancestor roll call. */
const VISIBLE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden')) return { ok: false, why: (n.id || n.tagName) + ' is [hidden]' };
    if (cs.display === 'none') return { ok: false, why: (n.id || n.tagName) + ' is display:none' };
    if (cs.visibility === 'hidden') return { ok: false, why: (n.id || n.tagName) + ' is visibility:hidden' };
    n = n.parentElement;
  }
  const b = el.getBoundingClientRect();
  if (b.width < 2 || b.height < 2) return { ok: false, why: 'measures ' + Math.round(b.width) + 'x' + Math.round(b.height) };
  return { ok: true, why: Math.round(b.width) + 'x' + Math.round(b.height) };
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

/* Open the contract and land on Key terms, which is the tab the room opens on
   for a draft and is reachable by name for anything else. */
const openKeyTerms = async (page, id) => {
  await page.evaluate(x => { state.activeId = x; state.selId = x; setView('workspace'); }, id);
  await page.waitForTimeout(1500);
  /* PRESSED, not called — a tab that is drawn but unwired passes a function
     call, and the panel's visibility is what this file is here to measure. */
  await page.click('#ws-tabs [data-ws-tab="terms"]');
  await page.waitForTimeout(1200);
};

const seed = (id, name, folder, over = {}) => ({
  id, name, counterparty: 'Kericho Growers Ltd', folder, status: 'Under Review',
  value: 4200000, template: 'RM', fields: {}, metadata: {}, comments: [], rounds: [],
  versions: [], signatures: [], compliance: { consent: false },
  audit: [{ at: '2026-08-01T09:00:00.000Z', user: 'Amina Otieno', action: 'Created', detail: 'Guided creation' }],
  ...over,
});

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  await put(seed('MK-RF1', 'Raw material supply — Kericho', 'proc'));
  await put(seed('MK-RF2', 'Executed and mis-filed', 'proc', {
    status: 'Signed', signedAt: '2026-08-05T09:00:00.000Z', hash: 'abc123',
    execution: { at: '2026-08-05T09:00:00.000Z' },
    signatures: [{ name: 'Amina Otieno', at: '2026-08-05T09:00:00.000Z', method: 'session-authenticated' }],
  }));

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    /* ================= 1. THE ADMIN SEES A REAL CONTROL ================= */
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    await openKeyTerms(page, 'MK-RF1');

    const rowThere = await page.evaluate(VISIBLE, '[data-kt-row="stream"]');
    check('the value-stream row is on screen', rowThere.ok, rowThere.why);

    /* The row opens on a press of its own read-out, like every other editable
       row on this panel — pressed, not called. */
    await page.click('[data-kt-row="stream"] [data-kt-edit]');
    await page.waitForTimeout(400);
    const sel = await page.evaluate(VISIBLE, '[data-kt-folder]');
    check('pressing it reveals a real picker, as visible pixels', sel.ok, sel.why);

    const picker = await page.evaluate(() => {
      const s = document.querySelector('[data-kt-folder]');
      return s ? { tag: s.tagName, value: s.value,
        opts: [...s.options].map(o => o.value),
        labels: [...s.options].map(o => o.textContent.trim()) } : null;
    });
    check('it is a select, opened on the drawer the contract is actually in',
      picker && picker.tag === 'SELECT' && picker.value === 'proc', picker && picker.value);
    check('it offers no "create a new folder" option',
      picker && !picker.opts.includes('__new__'),
      'a custom folder lives in one browser — minting one mid-move files it where only one person can see it');
    check('and it offers more than one drawer to move to',
      picker && picker.opts.length > 1, picker && picker.labels.join(' · '));

    /* ================= 2. IT ASKS FIRST, AND SAYS WHAT IT COSTS ============ */
    await page.selectOption('[data-kt-folder]', 'sales');
    await page.waitForTimeout(700);
    const dlg = await page.evaluate(VISIBLE, '#confirm-overlay');
    check('choosing another stream asks before it moves anything', dlg.ok, dlg.why);

    const asked = await page.evaluate(() => {
      const o = document.getElementById('confirm-overlay');
      return o ? o.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    check('the question names the drawer it is in', /Procurement/i.test(asked), asked.slice(0, 150));
    check('and the drawer it is going to', /Sales/i.test(asked));
    check('and how many people can see it now', /can see it now/i.test(asked));
    check('and how many will be able to afterwards', /will be able to afterwards/i.test(asked));
    check('and which way that number goes',
      /(\d+ more|\d+ fewer|the same people)/i.test(asked),
      (asked.match(/(\d+ more|\d+ fewer|the same people)/i) || [])[0]);

    /* ---- cancelling moves nothing and puts the picker back ---- */
    await page.click('#cf-cancel');
    await page.waitForTimeout(600);
    const afterCancel = await page.evaluate(() => ({
      folder: getContract('MK-RF1').folder,
      sel: (document.querySelector('[data-kt-folder]') || {}).value || null,
    }));
    check('cancelling leaves the contract where it was', afterCancel.folder === 'proc', afterCancel.folder);
    check('and puts the picker back to it', afterCancel.sel === 'proc' || afterCancel.sel === null,
      String(afterCancel.sel));

    /* ================= 3. CONFIRMING REALLY MOVES IT ================= */
    if (!(await page.evaluate(() => !!document.querySelector('[data-kt-folder]'))))
      await page.click('[data-kt-row="stream"] [data-kt-edit]');
    await page.waitForTimeout(300);
    await page.selectOption('[data-kt-folder]', 'sales');
    await page.waitForTimeout(600);
    await page.click('#cf-ok');
    await page.waitForTimeout(2000);

    const moved = await page.evaluate(() => {
      const c = getContract('MK-RF1');
      const line = (c.audit || []).find(a => a.action === 'Re-filed');
      return { folder: c.folder, detail: (line && line.detail) || '', user: (line && line.user) || '',
        sub: (document.querySelector('.room-sub') || {}).textContent || '',
        row: (document.querySelector('[data-kt-row="stream"]') || {}).textContent || '' };
    });
    check('confirming moves it', moved.folder === 'sales', moved.folder);
    check('the audit line names both drawers and the person',
      /Procurement/i.test(moved.detail) && /Sales/i.test(moved.detail) && /Amina Otieno/.test(moved.detail),
      moved.detail);
    check('the row itself now reads the new drawer', /Sales/i.test(moved.row), moved.row.replace(/\s+/g, ' ').trim());
    check('and so does the room\'s own sub-line under the contract name',
      /Sales/i.test(moved.sub), moved.sub.replace(/\s+/g, ' ').trim());

    /* ---- and it stuck on the server, not only in this tab ---- */
    const stored = await W.admin.json('/api/contracts/MK-RF1');
    check('the server holds the move too', stored.folder === 'sales', stored.folder);

    /* ================= 4. D-1 — A SIGNED CONTRACT KEEPS THE CONTROL ======== */
    await openKeyTerms(page, 'MK-RF2');
    const onSigned = await page.evaluate(() => {
      const r = document.querySelector('[data-kt-row="stream"]');
      const others = [...document.querySelectorAll('[data-kt-row]')]
        .filter(x => x.getAttribute('data-kt-row') !== 'stream');
      return { streamEditable: !!(r && r.querySelector('[data-kt-edit]')),
        othersEditable: others.filter(x => x.querySelector('[data-kt-edit]')).length,
        others: others.length };
    });
    check('an executed contract can still be re-filed — filing is housekeeping',
      onSigned.streamEditable);
    check('while every other key-terms row on it has stood down',
      onSigned.othersEditable === 0, `${onSigned.othersEditable} of ${onSigned.others} still editable`);

    check('no page errors on the admin\'s side', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
    await ctx.close();

    /* ================= 5. AN EDITOR SEES TEXT, AND NO CONTROL ============== */
    const ctx2 = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const p2 = await ctx2.newPage();
    const errors2 = [];
    p2.on('pageerror', e => errors2.push(e.message));
    await signIn(p2, h.base, 'everything@example.co.ke', 'their-own-pass-9');
    await openKeyTerms(p2, 'MK-RF1');

    const asEditor = await page2State(p2);
    check('the Editor still sees which drawer it is in', asEditor.rowText.length > 0,
      asEditor.rowText);
    check('but there is no picker anywhere on their panel', !asEditor.anySelect,
      'a control that is drawn and refused is worse than one that is absent');
    check('and no press on the row either', !asEditor.editable);
    check('their other key-terms rows are editable, so this is not a read-only page',
      asEditor.othersEditable > 0, `${asEditor.othersEditable} editable rows`);
    check('no page errors on the Editor\'s side', errors2.length === 0, errors2.slice(0, 3).join(' | ') || 'clean');
    await ctx2.close();
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

async function page2State(p) {
  return p.evaluate(() => {
    const r = document.querySelector('[data-kt-row="stream"]');
    const others = [...document.querySelectorAll('[data-kt-row]')]
      .filter(x => x.getAttribute('data-kt-row') !== 'stream');
    return {
      rowText: r ? r.textContent.replace(/\s+/g, ' ').trim() : '',
      anySelect: !!document.querySelector('[data-kt-folder]'),
      editable: !!(r && r.querySelector('[data-kt-edit]')),
      othersEditable: others.filter(x => x.querySelector('[data-kt-edit]')).length,
    };
  });
}
