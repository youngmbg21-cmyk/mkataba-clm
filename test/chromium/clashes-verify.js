/* CLASHES IN WHO MAY DO WHAT (owner picked "Rows in Needs your attention —
   the SAP way", 17 Oct 2026; piece 7 of the sensitive contracts and
   governance plan)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 each clash is a row in Company › Needs your attention, one plain
       sentence naming who, the red one (a control undone outright) first:
         · a signer who may sign more than their approver (red)
         · two people who give each other the yes before signing
         · a rule's named approver who can raise what it catches
         · a stream with contracts to sign that no stream rule names
     2 each row's button opens the person or the rule
     3 Jambo says how many of the things that need you are clashes, and that
       they warn and block nothing
     4 a clash goes away by itself when the rights change
     5 it fits the owner's three screens
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/clashes-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

(async () => {
  const h = await H.startHati();
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const U = W.users;   // restricted · novalues · unrestricted, all Editors
  /* the signing limits bind; Unrestricted may sign 5M and must first have the
     yes of Restricted, who may sign only 2M — and Restricted must first have
     Unrestricted's yes: a pair who approve each other */
  await W.admin.json('/api/settings', { method: 'PUT', body: { signCap: { on: true },
    approvalRules: [{ id: 'r-sales', name: 'Sales', order: 1, cond: { type: 'folder', value: H.FOLDER_B }, approver: { kind: 'member', id: U.novalues.id, name: 'No Values Legal' } }] } });
  await W.admin.json('/api/users/' + U.restricted.id, { method: 'PATCH', body: { signCap: 2000000, overseerOn: 'always', overseerId: U.unrestricted.id, overseerWhen: 'lead,sign' } });
  await W.admin.json('/api/users/' + U.unrestricted.id, { method: 'PATCH', body: { signCap: 5000000, overseerOn: 'always', overseerId: U.restricted.id, overseerWhen: 'lead,sign' } });
  await W.admin.json('/api/users/' + U.novalues.id, { method: 'PATCH', body: { signCap: 'none' } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const signIn = async () => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      if (await page.locator('#li-email').count()) {
        await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      }
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 20000 });
    };
    const readNeeds = () => until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const more = document.querySelector('#st-att [data-st-needs-all]');
      if (more && more.getAttribute('aria-expanded') !== 'true') { more.click(); return null; }
      const rows = [...document.querySelectorAll('#st-att .st-need[data-st-need]')];
      return rows.length ? rows.map(r => ({ key: r.getAttribute('data-st-need'), text: (r.querySelector('.st-need-t') || {}).textContent.trim(),
        dot: getComputedStyle(r.querySelector('.st-dot')).backgroundColor, btn: (r.querySelector('.st-need-go') || {}).textContent.trim() })) : null;
    }, null, 15000);
    await signIn();

    console.log('\n1 · each clash is a row');
    const rows = await readNeeds() || [];
    const clash = rows.filter(r => /^clash:/.test(r.key));
    check('1a four clashes listed', clash.length === 4, clash.map(r => r.key).join(' · '));
    check('1b the red one leads the clashes: a signer above the approver', !!clash[0] && /^clash:cap:/.test(clash[0].key)
      && clash[0].text === 'Unrestricted Legal may sign up to KES 5M; the approver, Restricted Legal, only up to KES 2M', JSON.stringify(clash[0]));
    /* red is the ruby dot: more red than green; amber the other three, alike */
    const rgb = s => (String(s).match(/\d+/g) || []).map(Number);
    const [r0, g0] = rgb((clash[0] || {}).dot);
    check('1c its dot is red, the others amber', !!clash[3] && r0 > 150 && g0 < 120 && clash.slice(1).every(r => r.dot === clash[1].dot) && clash[1].dot !== clash[0].dot, clash.map(r => r.dot).join(' / '));
    const each = clash.find(r => /^clash:each:/.test(r.key));
    check('1d two people who give each other the yes', !!each && /^(Unrestricted Legal and Restricted Legal|Restricted Legal and Unrestricted Legal) give each other the yes before signing$/.test(each.text), each && each.text);
    const self = clash.find(r => /^clash:self:/.test(r.key));
    check('1e a rule\'s approver who can raise what it catches', !!self && self.text === 'No Values Legal both asks for and gives the yes before signing in Sales & Route-to-Market', self && self.text);
    const nobody = clash.find(r => /^clash:nobody:/.test(r.key));
    check('1f a stream with contracts to sign that no stream rule names', !!nobody && nobody.text === 'Nobody is named to approve contracts in Procurement & Raw Materials', nobody && nobody.text);
    await shot(page, 'clashes-company');

    console.log('\n2 · each row opens the person or the rule');
    if (!clash[0]) check('2a the red row (nothing to press)', false);
    if (!self) check('2b the rule row (nothing to press)', false);
    if (clash[0] && await press(`#st-att [data-st-need="${clash[0].key}"] .st-need-go`, '2a the red row\'s button')) {
      const who = await until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent : null; });
      /* re-pointed 18 Oct 2026 (round 25 as drawn: "Open Lina Ek"): the
         button says the person's whole name */
      check('2a "Open Unrestricted Legal" opens Unrestricted Legal\'s drawer', clash[0].btn === 'Open Unrestricted Legal' && who === 'Unrestricted Legal', clash[0].btn + ' → ' + who);
      await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await until(() => !document.getElementById('st-drawer').classList.contains('open'));
    }
    if (self && await press(`#st-att [data-st-need="${self.key}"] .st-need-go`, '2b the rule row\'s button')) {
      const t = await until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent : null; });
      check('2b "Open the rule" opens the approval rules', self.btn === 'Open the rule' && /Approval rules/.test(t || ''), self.btn + ' → ' + t);
      await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await until(() => !document.getElementById('st-drawer').classList.contains('open'));
    }

    console.log('\n3 · Jambo says it');
    /* RE-POINTED 18 Oct 2026 (round 25 "Control room" as drawn): his first
       words name what needs you ("Six things need you here: …"); the clashes'
       sentence still follows them */
    const jb = await until(() => { const m = String(document.body.innerText || '').replace(/\s+/g, ' ').match(/things need you here: [^]*?nothing is blocked\./); return m ? m[0] : null; });
    check('3 Jambo: "4 of them are clashes in who may do what: they warn, nothing is blocked."', /4 of them are clashes in who may do what: they warn, nothing is blocked\./.test(jb || ''), jb);

    console.log('\n4 · a clash goes when the rights change');
    /* the same limit as the approver: neither now may sign more than the other */
    await W.admin.json('/api/users/' + U.unrestricted.id, { method: 'PATCH', body: { signCap: 2000000 } });
    await signIn();
    const after = (await readNeeds() || []).filter(r => /^clash:/.test(r.key)).map(r => r.key);
    check('4 Unrestricted now signs no more than the approver: that row is gone, the other three stay', after.length === 3 && !after.some(k => /^clash:cap:/.test(k)), after.join(' · '));

    console.log('\n5 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await readNeeds();
      const fit = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#st-att .st-need')];
        /* a word is cut when its own width is more than the button's */
        const btnCut = rows.filter(r => { const b = r.querySelector('.st-need-go'); if (!b) return false;
          const rg = document.createRange(); rg.selectNodeContents(b); return rg.getBoundingClientRect().width > b.getBoundingClientRect().width + 1; }).length;
        const off = rows.filter(r => r.getBoundingClientRect().right > innerWidth + 1).length;
        return { rows: rows.length, btnCut, off, page: document.documentElement.scrollWidth - innerWidth };
      });
      await shot(page, `clashes-${vp.width}x${vp.height}`);
      check(`5 ${vp.width}×${vp.height}: every row and button fits`, fit.btnCut === 0 && fit.off === 0 && fit.page <= 0, JSON.stringify(fit));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
