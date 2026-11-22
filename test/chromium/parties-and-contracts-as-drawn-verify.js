/* PARTIES, CONTACTS AND THE CONTRACTS LIST, AS DRAWN (owner, 19 Nov 2026: "Build all the designs in parties plus
   the new design for contracts lists page" — "the build includes contacts as well")

   WHAT THIS PINS, driven in a real browser as an admin:
     1 PARTIES IS ONE LIST: tabs All · Waiting on you only (no Folders, no NDA missing), no NDA column, a sentence
       over the list ("You hold paper with N parties. X holds the most money …"); the party it names is a press that
       CHOOSES its row; a second press on a chosen row stays on the list (no party page)
     2 THE PANEL: the party's own facts (Edit beside them), Contacts with + Add, Agreements · N
     3 + ADD: the party-wide pop-up takes a name, job title, email and phone and saves the person on the party's
       live agreements (the server keeps title and phone on each)
     4 THE CONTACTS ROW opens People narrowed to the party: a chip with ×, Add contact, the person with their job title
       (RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): no Phone column; her party under her name)
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
      /* RE-POINTED 20 Nov 2026 (owner: "delete the highlighted parts"): the sentence over the Parties list is gone; the
         list starts straight under the tabs */
      check('1c no sentence over the list', L.say === '', JSON.stringify(L));
      await shot('pc-1-parties-1440x780.png');
      await page.click('#cu-tbody [data-cu-cust="orbit logistics ltd"]');
      await page.waitForTimeout(400);
      const S = await page.evaluate(() => ({ view: state.view, list: !!document.querySelector('.cun-page[data-cu-screen="list"] #cu-tbody'), party: !!document.querySelector('.cun-page[data-cu-screen="party"]') }));
      check('1e a second press on the chosen row stays on the list', S.view === 'customers' && S.list && !S.party, JSON.stringify(S));
    });

    await part('2 the panel', async () => {
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): no tiles, no money. Agreements is the
         ring with "k of n signed" (.cun-pring), then ONE black button Open on Contracts (.jov5-go[data-cun-cts]) with Edit
         the link beside it ([data-cu-pr-edit]); then the party's own facts, its timeline, Contacts with + Add a contact */
      const P = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !p.querySelector('.jov5-go[data-cun-cts]')) return null;
        return { secs: [...p.querySelectorAll('.jov5-sec .jov5-label')].map(x => x.textContent.trim()), edit: !!p.querySelector('.jov5-act [data-cu-pr-edit]'),
          add: !!p.querySelector('.jov5-more[data-cun-add-ct]'), all: ((p.querySelector('.jov5-go[data-cun-cts]') || {}).textContent || '').trim(),
          ring: ((p.querySelector('.cun-pring > span') || {}).textContent || '').replace(/\s+/g, ' ').trim(), svg: !!p.querySelector('.cun-pring svg.cun-ring'),
          tiles: p.querySelectorAll('.jov5-glance, .jov5-g').length,
          money: [...p.querySelectorAll('.jov5-sec, .jov5-act, .jov5-intro')].filter(r => /\b(KES|SEK|USD|EUR)\b|\d+(\.\d+)?\s?[MK]\b/.test(r.textContent)).map(r => r.textContent.trim().slice(0, 60)),
          web: !!p.querySelector('[data-cun-web], [data-cun-open]') }; });
      check('2a the ring "k of 2 signed", Open on Contracts (Edit beside), the facts, Contacts (+ Add); no tiles, no money, no web search, no Open party',
        !!P && P.secs[0] === 'Agreements' && P.svg && /^\d of 2 signed/.test(P.ring) && P.all === 'Open on Contracts' && P.edit
        && P.secs.includes("The party's own facts") && P.secs.indexOf('Contacts') > P.secs.indexOf("The party's own facts") && P.add
        && P.tiles === 0 && P.money.length === 0 && !P.web, JSON.stringify(P));
      await shot('pc-2-panel-1440x780.png');
    });

    await part('3 add a contact', async () => {
      await page.click('#ins-panel [data-cun-add-ct]');
      await until(() => !!document.getElementById('pc-name'));
      await page.fill('#pc-name', 'Ruth Kamau');
      await page.fill('#pc-title', 'Head of procurement');
      await page.fill('#pc-email', 'ruth@orbit.co.ke');
      await page.fill('#pc-phone', '+254 700 123 456');
      /* RE-POINTED 19 Nov 2026 (the one edit pop-up, two steps): Next › shows the agreements to tick */
      await page.click('#pc-form [data-pc-next]');
      await until(() => !!document.querySelector('#pc-form [data-pc-ag]'));
      const ticks = await page.evaluate(() => [...document.querySelectorAll('[data-pc-ag]')].map(t => t.getAttribute('data-pc-ag') + ':' + t.checked));
      check('3a the pop-up offers the party\'s live agreements, ticked', ticks.length === 2 && ticks.every(t => /:true$/.test(t)), JSON.stringify(ticks));
      await shot('pc-3-add-1440x780.png');
      await page.click('#pc-form [data-pc-save]');
      /* RE-POINTED 19 Nov 2026: saved, the sheet closes */
      await until(() => !document.getElementById('pc-form'));
      /* the page saves each agreement in its own time: ask the server, bounded, until both have arrived */
      let srv = [];
      for (const t0 = Date.now(); Date.now() - t0 < 12000; ) {
        srv = [];
        for (const id of ['MK-OR1', 'MK-OR2']) { const c = await W.admin.json('/api/contracts/' + id); const p = (c.participants || []).find(x => x.email === 'ruth@orbit.co.ke'); srv.push(p ? id + ':' + p.title + '|' + p.phone : id + ':none'); }
        if (srv.every(x => !/:none$/.test(x))) break;
        await page.waitForTimeout(300);
      }
      check('3b the server keeps her on both agreements, with her job title and phone', srv.every(x => /:Head of procurement\|\+254 700 123 456$/.test(x)), JSON.stringify(srv));
    });

    await part('4 People, narrowed', async () => {
      await until(() => !!document.querySelector('#ins-panel [data-cun-ppl]'), null, 8000);
      await page.click('#ins-panel [data-cun-ppl]');
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): the party is a chosen chip in the
         chips row (.apn-chip.is-set[data-dirn-party-clear], its × inside); the Phone column is gone (the phone is the
         person's panel's "Phone them") */
      const D = await until(() => { if (state.view !== 'directory') return null; const chip = document.querySelector('.dirn-page .apn-bar .apn-chip.is-set[data-dirn-party-clear]'); if (!chip) return null;
        const rows = [...document.querySelectorAll('#dir-tbody [data-dir-row]')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
        return { chip: chip.textContent.replace(/\s+/g, ' ').trim(), x: !!chip.querySelector('[data-dirn-party-clear]') || !!document.querySelector('[data-dirn-party-clear]'),
          add: !!document.querySelector('[data-dirn-add]'), cols: [...document.querySelectorAll('.dirn-page thead th')].map(t => t.textContent.trim()), rows }; }, null, 10000);
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): an outside person's row says their
         party under the name (dirnRowHtml's sub line), no longer the job title — Ruth's row names Orbit */
      check('4a People narrowed to the party: a chip with ×, Add contact, no Phone column, Ruth with her party under her name',
        !!D && /Orbit/.test(D.chip) && /×/.test(D.chip) && D.x && D.add && !D.cols.includes('Phone') && D.rows.some(r => /Ruth Kamau/.test(r) && /Orbit/.test(r)), JSON.stringify(D));
      await shot('pc-4-people-1440x780.png');
    });

    await part('5 the Contracts list', async () => {
      await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
      if (await until(() => { const b = document.querySelector('[data-ctf-show="list"]'); return !!b && b.getClientRects().length > 0 && !document.querySelector('#reg-tbody tr[data-row]'); }, null, 4000)) await page.click('[data-ctf-show="list"]');
      await until(() => !!document.querySelector('#reg-tbody tr[data-row]'), null, 10000);
      const C = await page.evaluate(() => { const st = document.querySelector('#ct-place .ct-name.is-stack'), back = st && st.querySelector('.ctf-back'), h = st && st.querySelector('.ct-h');
        const rows = [...document.querySelectorAll('#reg-tbody tr[data-row]')].slice(0, 3).map(r => Math.round(r.getBoundingClientRect().height));
        return { stack: !!st, over: !!(back && h && back.getBoundingClientRect().bottom <= h.getBoundingClientRect().top + 1), size: h ? getComputedStyle(h).fontSize : '',
          say: ((document.querySelector('#ct-place .ct-say') || {}).textContent || '').replace(/\s+/g, ' ').trim(), sayEl: !!document.querySelector('#ct-place .ct-say'), rows }; });
      check('5a "‹ Folders" small over the title, the title at 26px', C.stack && C.over && C.size === '26px', JSON.stringify(C));
      /* RE-POINTED 20 Nov 2026 (owner: "delete the highlighted parts"): the sentence over the Contracts list is gone */
      /* (20 Nov 2026: the element is read in the page, not in node, where `document` does not exist) */
      check('5b no sentence over the list', C.say === '' && !C.sayEl, C.say);
      /* RE-POINTED 21 Nov 2026 (P-31, as drawn): a row whose paper is loaded carries a third line, its words for when it ends */
      check('5c rows about 66px tall, a third line of the paper\'s words where it is read', C.rows.length > 0 && C.rows.every(x => x >= 58 && x <= 92), JSON.stringify(C.rows));
      await shot('pc-5-contracts-1440x780.png');
    });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
