/* POINT-BUTTONS-AND-BRIEF — the owner, 20 Oct 2026, off three screenshots:
   "ensure that these buttons are working accordingly. If it is asking you to
   ask jambo then it should take you to the jambo entry field and put your
   cursor there. Also, for the start redlining with this ask button, it should
   be greyed out if you have no editing access or access to edit a particular
   contract. In image 2, the highlighted 'the brief' should be a button called
   Contract Briefing for the briefing in image 3."

     1  Ask Jambo about this, wide window: the clause opens in Edit with Jambo,
        the question in his box AND the cursor in it
     2  … a window too narrow for the editor: the question in Home's Jambo box,
        the cursor in it
     3  Start redlining with this ask is live for an editor
     4  … greyed, with the reason, for a viewer — whose Ask Jambo goes to
        Home's box with the cursor there
     5  … greyed, with the desk's reason, where somebody else leads the
        negotiation and the reader has no seat
     6  (re-pointed 21 Oct 2026: What Jambo read's brief row, its door "Read ›") a button that
        opens the brief

   Run: node test/chromium/point-buttons-and-brief-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const deal = (id, name) => ({ id, contractNo: id, name, counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  body: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(6) + '</p><h2>2. Payment</h2><p>'
    + 'Invoices are paid within thirty days of receipt. '.repeat(6) + '</p><h2>3. Liability</h2><p>' + 'Liability is capped at the fees paid in the last three months. '.repeat(5) + '</p>' });
const BREAKDOWN = { head: 'Fix the cap first', sub: 'Their cover stops at three months of fees.', links: [],
  regions: [{ name: 'Risk', status: 'need', kind: 'protect', headline: 'A small cap', items: [{ ref: '3', title: 'Liability' }], quotes: [] }],
  points: [{ clause: '3', region: 1, status: 'need', missing: false, title: 'Their liability is capped at three months of fees', stake: 'Their cover stops far below the risk.',
    what: 'A single failure could cost us far more than the cap.', theirs: 'Three months of fees.', usual: 'Twelve months of fees.', figure: 'KES 675,000',
    how: '12 months less 3 months of fees.', push: 'They will say the fees are small.', edge: [], trade: [], ask: 'Each party’s liability shall not exceed the fees payable in the 12 months before the claim.',
    quote: 'Liability is capped at the fees paid in the last three months.', links: [] }] };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [deal('MK-P1', 'Haulage Points'), Object.assign(deal('MK-P2', 'Haulage Led Elsewhere'),
    { desk: { leadId: 'u_someone_else', leadName: 'Young Mbagaya', members: [{ id: 'u_someone_else', name: 'Young Mbagaya', role: 'lead' }] } })], approvalRules: [] });
  /* a viewer who has signed in once (their own password set) */
  await W.admin.json('/api/users', { method: 'POST', body: { name: 'Rita Reader', email: 'rita@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  { const v = h.client('rita@example.co.ke');
    await v.json('/api/login', { method: 'POST', body: { email: 'rita@example.co.ke', password: 'temporary-pass-1' } });
    await v.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } }); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const signIn = async (email, pass, vp) => {
      const page = await (await browser.newContext({ viewport: vp || { width: 1440, height: 780 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
      await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-P1'), null, { timeout: 20000 });
      await page.waitForLoadState('networkidle');
      /* Jambo's read of the clauses, kept as the route would answer it */
      await page.evaluate(B => { state.aiConfigured = true; const o = window.api;
        window.api = async function (p, ...a){ if (p === 'ai/breakdown') return JSON.parse(JSON.stringify(B)); return o.call(this, p, ...a); }; }, BREAKDOWN);
      return page;
    };
    const until = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    /* the point's deep dive on Clauses, beside the paper */
    const dive = async (page, id) => {
      await page.evaluate(id => { setView('dashboard'); pdOpenOnHome(id, 'doc'); }, id);
      const row = await until(page, () => !!document.querySelector('#pd-thread .doc-th-row [data-stk-dive="0"]'), null, 15000);
      if (!row) return null;
      await page.evaluate(() => document.querySelector('#pd-thread .doc-th-row [data-stk-dive="0"]').click());
      return until(page, () => { const r = document.querySelector('#pd-thread .stk-dv [data-stk-redline]'), a = document.querySelector('#pd-thread .stk-dv [data-stk-ask]');  /* the DIVE's (a card in the list carries one too since 21 Oct 2026) */
        return r && a ? { dead: r.disabled, why: r.getAttribute('title') || '' } : null; }, null, 8000);
    };
    const cursorIn = (page, id) => until(page, id => { const el = document.getElementById(id); if (!el || document.activeElement !== el) return null;
      const r = el.getBoundingClientRect(); return { q: el.value, seen: r.width > 0 && r.top >= 0 && r.bottom <= innerHeight }; }, id, 6000);

    console.log('\n1 · an editor, wide window');
    let page = await signIn('admin@example.co.ke', 'adminpassword1');
    let d = await dive(page, 'MK-P1');
    check('3 Start redlining with this ask is live for an editor', !!d && !d.dead, JSON.stringify(d));
    await page.evaluate(() => document.querySelector('#pd-thread [data-stk-ask]').click());
    const c1 = await cursorIn(page, 'ce-ask');
    check('1a Ask Jambo about this: the question waits in Edit with Jambo\'s box', !!c1 && /^In clause 3:/.test(c1.q), c1 && c1.q);
    check('1b … with the cursor in it, on screen', !!c1 && c1.seen);
    await shot(page, '1-ask-in-editor');

    console.log('\n2 · a window too narrow for the editor');
    await page.evaluate(() => { const b = document.getElementById('ce-ask'); if (b) b.value = ''; if (window.rlBackToClauses) rlBackToClauses(); });
    await page.setViewportSize({ width: 1000, height: 780 });
    d = await dive(page, 'MK-P1');
    if (d) await page.evaluate(() => document.querySelector('#pd-thread [data-stk-ask]').click());
    const c2 = await cursorIn(page, 'igd-input');
    check('2 too narrow: the question in Home\'s Jambo box, the cursor in it, on screen', !!c2 && /^In clause 3:/.test(c2.q) && c2.seen, JSON.stringify(c2));
    await shot(page, '2-ask-narrow');
    await page.context().close();

    console.log('\n4 · a viewer');
    page = await signIn('rita@example.co.ke', 'their-own-pass-9');
    d = await dive(page, 'MK-P1');
    check('4a Start redlining is greyed for a viewer', !!d && d.dead, JSON.stringify(d));
    check('4b … and says why', !!d && /read this contract but not change it/.test(d.why), d && d.why);
    await shot(page, '4-viewer');
    if (d) await page.evaluate(() => document.querySelector('#pd-thread [data-stk-ask]').click());
    const c4 = await cursorIn(page, 'igd-input');
    check('4c a viewer\'s Ask Jambo: the question in Home\'s box, the cursor in it', !!c4 && /^In clause 3:/.test(c4.q), JSON.stringify(c4));
    await page.context().close();

    console.log('\n5 · somebody else leads the negotiation');
    page = await signIn('admin@example.co.ke', 'adminpassword1');
    await page.evaluate(() => { state.settings = state.settings || {}; state.settings.deskRule = { on: true }; });
    d = await dive(page, 'MK-P2');
    const deskBlocks = await page.evaluate(() => typeof deskMayRedline === 'function' && !deskMayRedline(getContract('MK-P2')));
    check('5- the desk rule is on and does not seat the reader (the case being measured)', deskBlocks);
    check('5a greyed where the desk does not seat the reader', !!d && d.dead, JSON.stringify(d));
    check('5b … with the desk\'s reason', !!d && /Young Mbagaya/.test(d.why), d && d.why);
    console.log('\n6 · Contract briefing');
    await page.evaluate(() => { const c = getContract('MK-P1'); c._brief = { data: { overview: 'This is a two-year haulage agreement with Juno Limited.' } };
      setView('dashboard'); pdOpenOnHome('MK-P1', 'copilot'); });
    const btn = await until(page, () => { const b = document.querySelector('#pd-glance [data-pd-gl-brief]'); return b && b.getBoundingClientRect().width > 0 ? { tag: b.tagName, words: b.textContent.trim() } : null; }, null, 10000);
    /* RE-POINTED 21 Oct 2026 (owner, "WHAT JAMBO READ, FOUR EVEN ROWS"): the brief is a row of What
       Jambo read — figure · name · door — its door "Read ›" */
    /* RE-POINTED 29 Oct 2026 (the owner: every last-column press one grey pill, no arrow): "Read" */
    check('6a What Jambo read carries the brief\'s door, "Read"', !!btn && btn.tag === 'BUTTON' && btn.words === 'Read', JSON.stringify(btn));
    check('6b no "The brief" label is left', await page.evaluate(() => !/The brief/.test((document.getElementById('pd-glance') || {}).textContent || '')));
    await shot(page, '6-brief-button');
    if (btn) await page.click('#pd-glance [data-pd-gl-brief]');
    check('6c pressing it opens the brief', !!(await until(page, () => !!document.getElementById('brief-section'), null, 6000)));
    await shot(page, '6-brief-open');
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
