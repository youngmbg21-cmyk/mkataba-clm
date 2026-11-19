/* PARTIES, CONTACTS AND THE CONTRACTS LIST, AS DRAWN (owner, 19 Nov 2026: "Build all the designs in parties plus
   the new design for contracts lists page" — "the build includes contacts as well")

   WHAT THIS PINS, driven in a real browser as an admin:
     1 PARTIES IS ONE LIST: tabs All · Waiting on you only (no Folders, no NDA missing), no NDA column, a sentence
       over the list ("You hold paper with N parties. X holds the most money …"); the party it names is a press that
       CHOOSES its row; a second press on a chosen row stays on the list (no party page)
     2 THE PANEL: the party's own facts (Edit beside them), Contacts with + Add, Agreements · N
     3 + ADD: the party-wide pop-up takes a name, job title, email and phone and saves the person on the party's
       live agreements (the server keeps title and phone on each)
     4 THE CONTACTS ROW opens People narrowed to the party: a chip with ×, Add contact, a Phone column, the person
       with their job title
     5 CONTRACTS' LIST: "‹ Folders" small over a 26px title, the counts beside it, a sentence over the list
       ("You hold N contracts, M of them signed …"), rows about 66px tall
   At the parent none of this is drawn (Folders and the NDA column stand, no sentence, no pop-up), so every part fails.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/parties-and-contracts-as-drawn-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/parties-and-contracts-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const mk = (id, name, cp, folder, value, status, extra) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
    H.fixtureContract(id, name, cp, folder, value, status), { owner: { id: me.id, name: me.name } }, extra || {}) } });
  await mk('MK-OR1', 'Supply agreement', 'Orbit Logistics Ltd', H.FOLDER_A, 9000000000, 'Signed');
  await mk('MK-OR2', 'Warehouse lease', 'Orbit Logistics Ltd', H.FOLDER_A, 12000000, 'Signed');
  await mk('MK-TW1', 'Service agreement', 'Tana Water Ltd', H.FOLDER_A, 3000000, 'Signed');

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-TW1'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => setView('customers'));
    await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length >= 2, null, 10000);

    await part('1 one list', async () => {
      const L = await page.evaluate(() => ({ tabs: [...document.querySelectorAll('.cun-page [data-cun-tab]')].map(t => t.getAttribute('data-cun-tab')),
        cols: [...document.querySelectorAll('.cun-page .cun-table thead th')].map(t => t.textContent.trim()),
        say: ((document.querySelector('.cun-page .cun-say') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        pick: (document.querySelector('.cun-page .cun-say [data-cun-pick]') || { getAttribute: () => '' }).getAttribute('data-cun-pick') }));
      check('1a the tabs are All · Waiting on you at most; no Folders, no NDA missing', L.tabs[0] === 'all' && L.tabs.every(t => ['all', 'wait'].includes(t)), JSON.stringify(L.tabs));
      check('1b no NDA column', L.cols.length > 0 && !L.cols.includes('NDA'), JSON.stringify(L.cols));
      check('1c a sentence over the list names the party holding the most money', /^You hold paper with \d+ parties\. Orbit Logistics Ltd holds the most money/.test(L.say) && L.pick === 'orbit logistics ltd', JSON.stringify(L));
      await shot('pc-1-parties-1440x780.png');
      if (L.pick) {
        await page.click('.cun-page .cun-say [data-cun-pick]');
        const sel = await until(() => { const r = document.querySelector('#cu-tbody [data-cu-cust="orbit logistics ltd"]'); return r && r.classList.contains('is-sel') && /Orbit/.test((document.querySelector('#ins-panel .jov5-title') || {}).textContent || '') ? 'chosen' : null; });
        check('1d the party the sentence names is a press that chooses its row', sel === 'chosen', String(sel));
      }
      await page.click('#cu-tbody [data-cu-cust="orbit logistics ltd"]');
      await page.waitForTimeout(400);
      const S = await page.evaluate(() => ({ view: state.view, list: !!document.querySelector('.cun-page[data-cu-screen="list"] #cu-tbody'), party: !!document.querySelector('.cun-page[data-cu-screen="party"]') }));
      check('1e a second press on the chosen row stays on the list', S.view === 'customers' && S.list && !S.party, JSON.stringify(S));
    });

    await part('2 the panel', async () => {
      const P = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !p.querySelector('[data-jov5-sec="ags"]')) return null;
        return { secs: [...p.querySelectorAll('.jov5-sec .jov5-label')].map(x => x.textContent.trim()), edit: !!p.querySelector('.jov5-more[data-cu-pr-edit]'),
          add: !!p.querySelector('.jov5-more[data-cun-add-ct]'), all: ((p.querySelector('.jov5-flink[data-cun-cts]') || {}).textContent || '').trim(), web: !!p.querySelector('[data-cun-web], [data-cun-open]') }; });
      check('2a the facts (Edit beside), Contacts (+ Add), Agreements · 2 and all of them on Contracts; no web search, no Open party',
        !!P && P.secs[0] === "The party's own facts" && P.secs.includes('Contacts') && P.secs.includes('Agreements · 2') && P.edit && P.add && /^All 2 agreements on Contracts/.test(P.all) && !P.web, JSON.stringify(P));
      await shot('pc-2-panel-1440x780.png');
    });

    await part('3 add a contact', async () => {
      await page.click('#ins-panel [data-cun-add-ct]');
      await until(() => document.getElementById('pc-name'));
      await page.fill('#pc-name', 'Ruth Kamau');
      await page.fill('#pc-title', 'Head of procurement');
      await page.fill('#pc-email', 'ruth@orbit.co.ke');
      await page.fill('#pc-phone', '+254 700 123 456');
      const ticks = await page.evaluate(() => [...document.querySelectorAll('[data-pc-ag]')].map(t => t.getAttribute('data-pc-ag') + ':' + t.checked));
      check('3a the pop-up offers the party\'s live agreements, ticked', ticks.length === 2 && ticks.every(t => /:true$/.test(t)), JSON.stringify(ticks));
      await shot('pc-3-add-1440x780.png');
      await page.click('#pc-dlg [data-pc-save]');
      await until(() => !document.getElementById('pc-dlg'));
      const srv = [];
      for (const id of ['MK-OR1', 'MK-OR2']) { const c = await W.admin.json('/api/contracts/' + id); const p = (c.participants || []).find(x => x.email === 'ruth@orbit.co.ke'); srv.push(p ? id + ':' + p.title + '|' + p.phone : id + ':none'); }
      check('3b the server keeps her on both agreements, with her job title and phone', srv.every(x => /:Head of procurement\|\+254 700 123 456$/.test(x)), JSON.stringify(srv));
    });

    await part('4 People, narrowed', async () => {
      await until(() => document.querySelector('#ins-panel [data-cun-ppl]'), null, 8000);
      await page.click('#ins-panel [data-cun-ppl]');
      const D = await until(() => { if (state.view !== 'directory') return null; const chip = document.querySelector('.dirn-pty'); if (!chip) return null;
        const rows = [...document.querySelectorAll('#dir-tbody [data-dir-row]')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
        return { chip: chip.textContent.replace(/\s+/g, ' ').trim(), x: !!chip.querySelector('[data-dirn-party-clear]') || !!document.querySelector('[data-dirn-party-clear]'),
          add: !!document.querySelector('[data-dirn-add]'), cols: [...document.querySelectorAll('.dirn-page thead th')].map(t => t.textContent.trim()), rows }; }, null, 10000);
      check('4a People narrowed to the party: a chip with ×, Add contact, a Phone column, Ruth with her job title',
        !!D && /Orbit/.test(D.chip) && D.x && D.add && D.cols.includes('Phone') && D.rows.some(r => /Ruth Kamau/.test(r) && /Head of procurement/.test(r)), JSON.stringify(D));
      await shot('pc-4-people-1440x780.png');
    });

    await part('5 the Contracts list', async () => {
      await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
      if (await until(() => { const b = document.querySelector('[data-ctf-show="list"]'); return !!b && b.getClientRects().length > 0 && !document.querySelector('#reg-tbody tr[data-row]'); }, null, 4000)) await page.click('[data-ctf-show="list"]');
      await until(() => !!document.querySelector('#reg-tbody tr[data-row]'), null, 10000);
      const C = await page.evaluate(() => { const st = document.querySelector('#ct-place .ct-name.is-stack'), back = st && st.querySelector('.ctf-back'), h = st && st.querySelector('.ct-h');
        const rows = [...document.querySelectorAll('#reg-tbody tr[data-row]')].slice(0, 3).map(r => Math.round(r.getBoundingClientRect().height));
        return { stack: !!st, over: !!(back && h && back.getBoundingClientRect().bottom <= h.getBoundingClientRect().top + 1), size: h ? getComputedStyle(h).fontSize : '',
          say: ((document.querySelector('#ct-place .ct-say') || {}).textContent || '').replace(/\s+/g, ' ').trim(), rows }; });
      check('5a "‹ Folders" small over the title, the title at 26px', C.stack && C.over && C.size === '26px', JSON.stringify(C));
      check('5b a sentence over the list: "You hold N contracts, M of them signed …"', /^You hold \d+ contracts, \d+ of them signed/.test(C.say), C.say);
      check('5c rows about 66px tall', C.rows.length > 0 && C.rows.every(x => x >= 58 && x <= 76), JSON.stringify(C.rows));
      await shot('pc-5-contracts-1440x780.png');
    });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
