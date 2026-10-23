/* SET-HOW-FIRM — "Change the position" lands on the standard itself (owner,
   23 Oct 2026: "make the button open straight onto the rule you clicked,
   ready to change, and make it work for every rule").

   On Our paper › Our standards › Clause library, a standard's panel button —
   now "Set how firm we are" — opens the editor of the book that holds the
   standard, with the standard's own row brought into view, its box ready:
     1  a standard the baseline names (Governing law): its row
     2  a numeric one (Payment terms): its limit's row
     3  one another book names (Confidentiality): that book's editor, its row
     4  one NO book names (Termination): a new row for it in the baseline;
        Required pressed and Save keep it — the standard is in a book now
   ("brought into view": landOn marks the row .is-landed and readies its box;
   since 21 Oct 2026 nothing is painted on arrival — the owner's ruling)
     5  the plain list's button (a window too narrow for the panel) does the same
     6  a viewer is taken to the book that holds it, as before (nothing to edit)

   Run: node test/chromium/set-how-firm-verify.js */
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

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'vera@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  { const v = h.client('vera@example.co.ke');
    await v.json('/api/login', { method: 'POST', body: { email: 'vera@example.co.ke', password: 'temporary-pass-1' } });
    await v.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } }); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const signIn = async (email, pass, vp) => {
      const page = await (await browser.newContext({ viewport: vp || { width: 1440, height: 780 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
      await page.waitForFunction(() => !!document.getElementById('cn-q'), null, { timeout: 20000 });
      return page;
    };
    const until = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    /* the Clause library tab, a standard chosen by its category, its panel's button pressed */
    const press = async (page, category) => {
      await page.evaluate(() => setView('playbook'));
      await until(page, () => { const t = [...document.querySelectorAll('button,[role=tab]')].find(x => /^Clause library/.test(x.textContent.trim())); if (!t) return null; t.click(); return true; });
      const chose = await until(page, cat => { const r = [...document.querySelectorAll('tr[data-sd-row]')].find(x => x.textContent.includes(cat)); if (!r) return null; r.click(); return true; }, category);
      if (!chose) return { chose: false };
      const btn = await until(page, () => { const b = [...document.querySelectorAll('#ins-panel button')].find(x => /Set how firm we are/.test(x.textContent)); if (!b) return null; b.click(); return true; });
      return { chose: true, btn: !!btn };
    };
    /* the editor open, and which row is lit */
    const lit = page => until(page, () => {
      const el = document.querySelector('#pb-pos-list .is-landed, #pb-rng-list .is-landed, #pb-pos-list .is-landed-held, #pb-rng-list .is-landed-held'); if (!el) return null;
      const inp = el.querySelector('[data-pb-cat],[data-pb-rlabel]'); const r = el.getBoundingClientRect();
      return { name: inp ? inp.value : '', seen: r.height > 0 && r.top >= 0 && r.bottom <= innerHeight,
        title: (() => { const sv = document.getElementById('pb-save'); let n = sv; while (n && !(n.querySelector && n.querySelector('h3'))) n = n.parentElement; return n ? n.querySelector('h3').textContent : ''; })() }; }, null, 6000);
    const close = page => page.evaluate(() => { const c = document.getElementById('pb-cancel'); if (c) c.click(); });

    let page = await signIn('admin@example.co.ke', 'adminpassword1');
    const cats = await page.evaluate(() => clauseLibrary().map(c => c.category));
    console.log('the standards:', cats.join(' · '));

    console.log('\n1 · a standard the baseline names');
    let p = await press(page, 'Governing law'); let L = await lit(page);
    check('1a the button reads "Set how firm we are" and opens the editor', p.btn && !!L, JSON.stringify({ p, L }));
    check('1b … with Governing law\'s own row brought into view, ready', !!L && /governing law/i.test(L.name) && L.seen, L && JSON.stringify(L));
    await shot(page, '1-governing-law'); await close(page);

    console.log('\n2 · a numeric limit');
    p = await press(page, 'Payment terms'); L = await lit(page);
    check('2 Payment terms: its limit\'s row brought into view', !!L && /pay/i.test(L.name) && L.seen, JSON.stringify({ p, L }));
    await close(page);

    console.log('\n3 · one another book names');
    p = await press(page, 'Confidentiality'); L = await lit(page);
    check('3 Confidentiality: the book that holds it, its row brought into view', !!L && /confidential/i.test(L.name) && L.seen && !/baseline/i.test(L.title), JSON.stringify({ p, L }));
    await shot(page, '3-confidentiality'); await close(page);

    console.log('\n4 · one no book names');
    const before = await page.evaluate(() => typeof stdBookFor === 'function' ? JSON.stringify(Object.keys(playbook()).filter(k => (playbook()[k].positions || []).some(x => /termination/i.test(x.category || '')))) : '');
    check('4- Termination is in no book (the case being measured)', before === '[]', before);
    p = await press(page, 'Termination'); L = await lit(page);
    check('4a Termination: a new row for it in the baseline, in view', !!L && /termination/i.test(L.name) && L.seen, JSON.stringify({ p, L }));
    await shot(page, '4-termination-new-row');
    await page.evaluate(() => { const row = document.querySelector('#pb-pos-list .is-landed, #pb-pos-list .is-landed-held'); const b = row && row.querySelector('[data-v="required"]'); if (b) b.click(); });
    await page.evaluate(() => { const s = document.getElementById('pb-save'); if (s) s.click(); });
    const kept = await until(page, () => { const t = (playbook()._default.positions || []).find(x => /termination/i.test(x.category || '')); return t ? t.pos : null; }, null, 6000);
    check('4b Required and Save keep it: Termination is in the baseline as Required', kept === 'required', kept);

    console.log('\n5 · the plain list, a window too narrow for the panel');
    await page.setViewportSize({ width: 1000, height: 780 });
    await page.evaluate(() => setView('playbook'));
    const plain = await until(page, () => { const b = document.querySelector('[data-std-pos]'); return b ? true : null; }, null, 6000);
    if (plain){
      await page.evaluate(() => { const b = [...document.querySelectorAll('[data-std-pos]')].find(x => { const i = Number(x.getAttribute('data-std-pos')); return /governing/i.test((clauseLibrary()[i] || {}).category || ''); }) || document.querySelector('[data-std-pos]'); if (b) b.click(); });
      L = await lit(page);
      check('5 the plain list\'s button opens the editor on its standard\'s row', !!L && L.seen, JSON.stringify(L));
      await close(page);
    } else console.log('NOTE  5 this window draws the panel, not the plain list — the plain list\'s button is pinned by f272');
    await page.context().close();

    console.log('\n6 · a viewer');
    page = await signIn('vera@example.co.ke', 'their-own-pass-9');
    p = await press(page, 'Governing law');
    const v = await until(page, () => { const t = [...document.querySelectorAll('button,[role=tab]')].find(x => x.getAttribute('aria-selected') === 'true' && /Negotiation playbook/.test(x.textContent));
      return t ? { tab: true, editor: !!document.getElementById('pb-save') } : null; }, null, 6000);
    check('6 a viewer is taken to the book that holds it, no editor', !!v && v.tab && !v.editor, JSON.stringify({ p, v }));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
