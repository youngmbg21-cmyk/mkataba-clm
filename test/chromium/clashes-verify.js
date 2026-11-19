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
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Settings is one list by area (stnPaint) and what
       needs an admin is the page's Jambo panel (stnPanelHtml, THE FIVE PARTS): a group "Needs an admin", each need a
       row that is its own door (.jov5-row.is-door carrying the need's press attributes), its words the need's text and
       its kind under it. The row's key is read off the ONE reading (stNeedsAll) by its words. */
    const readNeeds = () => until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const needs = typeof stNeedsAll === 'function' ? stNeedsAll() : [];
      /* RE-POINTED 19 Nov 2026 (Settings, door to door, f1091): Jambo's panel is the Dossier card — the FIRST thing that
         needs you stands in its black-button card (its words before " · ", its door the black button), the rest are its
         rows. Its tone is read off the one list (sddNeedList: red · amber), the card itself has no mark. */
      const L = typeof sddNeedList === 'function' ? sddNeedList(true, null, sddRows(true)) : [];
      const toneOf = t => { const x = L.find(y => String(y.text || '').trim() === t); return x ? (x.dot === 'red' ? 'red' : 'amber') : ''; };
      const act = document.querySelector('#ins-panel .jov5-act'), first = [];
      if (act) { const say = ((act.querySelector('.jov5-say') || {}).textContent || '').trim(), t = say.split(' · ')[0].trim(), n = needs.find(x => String(x.text || '').trim() === t);
        if (n) first.push({ key: n.key, text: t, sub: say.slice(t.length).replace(/^ · /, ''), dot: '', tone: toneOf(t), btn: t, door: !!act.querySelector('.jov5-go'), act: true }); }
      const rows = first.concat([...document.querySelectorAll('#ins-panel .jov5-row')].map(r => {
        const t = ((r.querySelector('.jov5-rt b') || {}).textContent || '').trim();
        const n = needs.find(x => String(x.text || '').trim() === t);
        if (!n) return null;
        const mk = r.querySelector('.jov5-mk');
        return { key: n.key, text: t, sub: ((r.querySelector('.jov5-rt span') || {}).textContent || '').trim(),
          dot: mk ? getComputedStyle(mk).color : '', tone: mk ? ((mk.className.match(/is-(red|amber)/) || [])[1] || '') : '', btn: t, door: r.tagName === 'BUTTON' };
      }).filter(Boolean));
      return rows.length ? rows : null;
    }, null, 15000);
    const pressNeed = async (key, what) => {
      const ok = await page.evaluate(k => { const n = (stNeedsAll() || []).find(x => x.key === k); if (!n) return false;
        const act = document.querySelector('#ins-panel .jov5-act');
        const r = (act && ((act.querySelector('.jov5-say') || {}).textContent || '').trim().split(' · ')[0].trim() === String(n.text).trim() && act.querySelector('.jov5-go'))
          || [...document.querySelectorAll('#ins-panel .jov5-row.is-door')].find(x => ((x.querySelector('.jov5-rt b') || {}).textContent || '').trim() === String(n.text).trim());
        if (!r) return false; r.click(); return true; }, key);
      if (!ok) check(what + ' (nothing to press: the row for ' + key + ')', false);
      return ok;
    };
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
    /* RE-POINTED 16 Nov 2026 (#762): the new look's mark is a pale fill with coloured INK — the outright clash's mark is
       ruby (.jov5-mk.is-red, its ink red-dominant), the others amber, alike; the outright one differs from the rest */
    /* the first stands in the black-button card (no mark): red by the one list, the drawn rows amber and alike */
    check('1c its dot is red, the others amber', !!clash[3] && clash[0].tone === 'red' && (clash[0].act || r0 > g0 * 2) && clash.slice(1).every(r => r.tone === 'amber' && r.dot === clash[1].dot) && (clash[0].act || clash[1].dot !== clash[0].dot), clash.map(r => r.tone + ':' + r.dot).join(' / '));
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
    if (clash[0] && await pressNeed(clash[0].key, '2a the red row')) {
      const who = await until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent : null; });
      /* re-pointed 18 Oct 2026 (round 25 as drawn: "Open Lina Ek"): the
         button says the person's whole name */
      /* RE-POINTED 16 Nov 2026 (#762): the row is the door (no verb button); its press opens the person */
      check('2a the red row opens Unrestricted Legal\'s drawer', clash[0].door && who === 'Unrestricted Legal', clash[0].btn + ' → ' + who);
      await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await until(() => !document.getElementById('st-drawer').classList.contains('open'));
    }
    if (self && await pressNeed(self.key, '2b the rule row')) {
      const t = await until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent : null; });
      check('2b the rule row opens the approval rules', self.door && /Approval rules/.test(t || ''), self.btn + ' → ' + t);
      await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await until(() => !document.getElementById('st-drawer').classList.contains('open'));
    }

    console.log('\n3 · Jambo says it');
    /* RE-POINTED 18 Oct 2026 (round 25 "Control room" as drawn): his first
       words name what needs you ("Six things need you here: …"); the clashes'
       sentence still follows them */
    /* RE-POINTED 19 Oct 2026 (lane F's third pass, round 25 as drawn): his
       words are the drawing's — the clashes named in his list, then "Each
       row's button opens what settles it." and nothing after; the clash rows
       say themselves that they warn */
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): his words are the Overview's head sentence */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Jambo's words on Settings are its Five-parts panel —
       the headline counts what needs an admin, and each clash row names itself "a clash in who may do what" (its kind,
       under its words); nothing on it says anything is blocked */
    const jb = await until(() => { const p = document.querySelector('#ins-panel'); if (!p) return null;
      const title = ((p.querySelector('.jov5-title, h2, h3') || {}).textContent || '').replace(/\s+/g, ' ').trim();
      const subs = [...p.querySelectorAll('.jov5-row .jov5-rt span, .jov5-act .jov5-say')].map(x => x.textContent.trim());
      return title ? { title, clashSaid: subs.filter(t => /clash in who may do what/.test(t)).length, n: sddNeedList(true, null, sddRows(true)).length, blocked: /nothing is blocked|blocks?\b/i.test(p.textContent) } : null; });
    check('3 Jambo names the clashes, and says nothing after the drawn sentence', !!jb && new RegExp('\\b' + jb.n + '\\b').test(jb.title) && jb.clashSaid === 4 && !jb.blocked, JSON.stringify(jb));

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
        /* RE-POINTED 16 Nov 2026 (#762): the need rows are Jambo's panel's rows, each its own door */
        const rows = [...document.querySelectorAll('#ins-panel .jov5-row')];
        /* a word is cut when its own width is more than the button's */
        const btnCut = rows.filter(r => { const b = r.querySelector('.jov5-rt b'); if (!b) return false;
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
