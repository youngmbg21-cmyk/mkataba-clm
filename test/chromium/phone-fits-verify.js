/* THE PHONE READS THE RECORD AND FITS THE SCREEN — measured in a real browser
   (overnight run, stream G, 9 Oct 2026).

   The functional review walked HaTi at 390x844 and at an 820px tablet and
   found the phone reading fields the product does not store, dropping a
   colleague's ask, landing email links on the wrong tab, and three surfaces
   running off the screen. Each numbered check is the place a person looks:

     1  an obligation's row prints its wording (o.desc)
     2  a Draft's Document tab carries no box to type into, and says where its
        empty terms are filled
     3  Home's Needs you lists a look AND an approval on one contract
     5  #contract=…&tab=terms lands on Overview; &tab=sign&go=approval on the
        Approvals card
     6  "Done looking" answers the look
     7  History tells the record's trail
     8  the workbench's controls are all on the screen
     9  Copilot's prepared questions are 44px
     12 the counterparty's signature box is 200px tall
     14 the counterparty's Notes opens a drawer with a box to write in
     15 at 820px neither the room nor the Contracts page pans sideways

   Against the parent every check but 15's room half (… and 1 when no
   obligation exists) reports red. Run: node test/chromium/phone-fits-verify.js */
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
const iso = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const users = (await W.admin.json('/api/bootstrap')).users;
    const adminU = (users.users || users).find(u => u.email === 'admin@example.co.ke');
    await W.unrestricted.json('/api/contracts/MK-A2/pass', { method: 'POST', body: { memberId: String(adminU.id), note: 'Please check the payment clause' } });
    const full = await W.admin.json('/api/contracts/MK-A2'); const bv = full._v; delete full._v;
    full.obligations = [{ id: 'ob1', desc: 'Send the quarterly stock report', due: iso(-9), party: 'ours', status: 'open' }];
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion: bv } });

    const login = async page => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    };
    /* ---------------- the phone, staff side ---------------- */
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await login(page);
    await page.waitForFunction(() => document.querySelector('.m-tabs'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelectorAll('[data-m-need]').length > 0, null, { timeout: 8000 }).catch(() => {});
    const needs = await page.evaluate(() => Array.from(document.querySelectorAll('[data-m-open="MK-A2"][data-m-need]')).map(b => b.getAttribute('data-m-need')));
    check('3 Needs you lists the look and the approval on one contract', needs.includes('look') && needs.includes('approval'), JSON.stringify(needs));

    await page.evaluate(() => { state.activeId = 'MK-A2'; mGo('contract', { tab: 'oblig' }); });
    await page.waitForFunction(() => document.querySelector('.m-ob-row'), null, { timeout: 8000 }).catch(() => {});
    const ob = await page.evaluate(() => (document.querySelector('.m-ob-row') || {}).textContent || '');
    check('1 the obligation row prints its wording', /quarterly stock report/.test(ob), ob.replace(/\s+/g, ' ').slice(0, 80));

    await page.waitForFunction(() => getContract('MK-A2')._loaded, null, { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => { mS().tab = 'hist'; mRender(); });
    const hist = await page.evaluate(() => document.querySelectorAll('.m-scroll .m-card > div').length);
    check('7 History tells the record\'s trail', hist > 0, hist + ' rows');

    await page.evaluate(() => { mS().tab = 'doc'; mRender(); document.querySelector('[data-m-act="overflow"]').click(); });
    const lookRow = await page.waitForSelector('[data-m-act="look-done"]', { timeout: 4000 }).catch(() => null);
    if (lookRow) await lookRow.click();
    await page.waitForFunction(() => !asksLookFor(getContract('MK-A2'), currentUser()).length, null, { timeout: 4000 }).catch(() => {});
    check('6 Done looking answers the look', !!lookRow && await page.evaluate(() => !asksLookFor(getContract('MK-A2'), currentUser()).length));

    await page.evaluate(() => { state.contracts.push({ id: 'MK-D9', name: 'Mutual NDA', counterparty: 'Acme', status: 'Draft', template: 'ND', fields: {}, metadata: {}, audit: [], _loaded: true, folder: state.contracts[0].folder });
      state.activeId = 'MK-D9'; mGo('contract', { tab: 'doc' }); });
    const doc = await page.evaluate(() => ({ boxes: document.querySelectorAll('.m-paper input, .m-paper textarea').length, owed: !!document.querySelector('[data-m-doc-owed]') }));
    check('2 the Draft\'s paper has no box to type into, and says where terms are filled', doc.boxes === 0 && doc.owed, JSON.stringify(doc));

    for (const [hash, want] of [['contract=MK-A2&tab=terms', s => s.screen === 'contract' && s.tab === 'terms'],
      ['contract=MK-B2&tab=sign&go=approval', s => s.screen === 'approvals' && s.apprOpen === 'MK-B2']]) {
      await page.evaluate(x => { mGo('home'); location.hash = x; openFromHash(); }, hash);
      await page.waitForFunction(() => true, null, { timeout: 500 });
      const s = await page.evaluate(() => ({ screen: mS().screen, tab: mS().tab, apprOpen: mS().apprOpen }));
      check('5 ' + hash + ' lands where it named', want(s), JSON.stringify(s));
    }

    await page.evaluate(() => openRedlineWorkbench('MK-A2'));
    await page.waitForFunction(() => document.querySelector('#view-redline #ws-head'), null, { timeout: 10000 }).catch(() => {});
    const off = await page.evaluate(() => { const vw = document.documentElement.clientWidth; return Array.from(document.querySelectorAll('#view-redline button')).filter(b => {
      if (b.closest('.nego-pane.index, #rl-cp')) return false; const r = b.getBoundingClientRect(); return r.width > 1 && r.right > vw + 1 && getComputedStyle(b).visibility !== 'hidden'; }).map(b => b.textContent.trim().slice(0, 20) || b.id); });
    check('8 the workbench\'s controls are all on the screen', off.length === 0, off.join(', '));
    await page.evaluate(() => { setView('workspace'); mGo('home'); });
    await page.evaluate(() => document.querySelector('.m-ai-fab').click());
    await page.waitForSelector('#ai-panel .ai-chip', { timeout: 5000 }).catch(() => {});
    const chips = await page.evaluate(() => Array.from(document.querySelectorAll('#ai-panel .ai-chip, #ai-style button')).map(b => Math.round(b.getBoundingClientRect().height)));
    check('9 Copilot\'s questions and toggle are 44px', chips.length > 0 && chips.every(x => x >= 44), JSON.stringify(chips));
    await ctx.close();

    /* ---------------- the counterparty on a phone ---------------- */
    const own = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const op = await own.newPage(); await login(op);
    await op.waitForFunction(() => typeof buildSharePayload === 'function' && typeof currentUser === 'function' && currentUser() && state.contracts && state.contracts.length, null, { timeout: 15000 });
    const tok = await op.evaluate(async () => { const c = getContract('MK-A2'); await ensureFull(c);
      const payload = await buildSharePayload(c, 'deadbeef', { name: 'Grace', email: 'grace@client.co.ke', phone: '' }, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload: { ...payload, purpose: 'negotiate', purposeChosen: 'negotiate' }, channel: 'link', recipient: { name: 'Grace', email: 'grace@client.co.ke' }, purpose: 'negotiate' });
      return (r.link || '').split('share=')[1] || r.token; });
    await own.close();
    const cp = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const pp = await cp.newPage();
    await pp.goto(`${h.base}/#share=${tok}`, { waitUntil: 'networkidle' });
    const door = await pp.waitForSelector('#pt-notes-door', { timeout: 10000 }).catch(() => null);
    if (door) await door.click();
    await pp.waitForFunction(() => { const t = document.querySelector('.pt-notes textarea'); return t && t.getBoundingClientRect().width > 300; }, null, { timeout: 5000 }).catch(() => {});
    const nt = await pp.evaluate(() => { const t = document.querySelector('.pt-notes textarea'); return t ? Math.round(t.getBoundingClientRect().width) : 0; });
    check('14 their Notes opens with a box to write in', nt > 300, nt + 'px wide');
    const pad = await pp.evaluate(async () => { const p = openSignaturePad({ intent: true }); await new Promise(r => setTimeout(r, 300));
      const c = document.getElementById('sig-canvas'); const hgt = c ? Math.round(c.getBoundingClientRect().height) : 0;
      const x = document.getElementById('sig-cancel'); if (x) x.click(); await p; return hgt; });
    check('12 their signature box is 200px tall', pad === 200, pad + 'px');
    await cp.close();

    /* ---------------- a tablet ---------------- */
    const tb = await browser.newContext({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true });
    const tp = await tb.newPage(); await login(tp);
    await tp.waitForFunction(() => typeof openWorkspace === 'function' && state.contracts && state.contracts.length, null, { timeout: 15000 });
    const pan = await tp.evaluate(async () => { const out = {}; const cs = document.getElementById('content-scroll');
      openWorkspace('MK-A2'); await new Promise(r => setTimeout(r, 1200)); roomGoTab(getContract('MK-A2'), 'sign'); await new Promise(r => setTimeout(r, 1200));
      out.room = cs.scrollWidth - cs.clientWidth;
      setView('register'); await new Promise(r => setTimeout(r, 1200));
      const rs = document.getElementById('reg-scroll'); out.reg = rs ? rs.scrollWidth - rs.clientWidth : -1; return out; });
    check('15 at 820px the room does not pan sideways', pan.room <= 1, pan.room + 'px over');
    check('15 at 820px the Contracts table fits its page', pan.reg >= 0 && pan.reg <= 1, pan.reg + 'px over');
    await tb.close();
  } catch (e) { check('the walk ran', false, e.message); }
  await browser.close(); await h.stop();
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  process.exit(bad ? 1 : 0);
})();
