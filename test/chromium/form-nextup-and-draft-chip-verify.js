/* FORM-NEXTUP-AND-DRAFT-CHIP — three asks of the owner's, 20 Oct 2026:

     1  "only the value stream you have access to should be in the dropdown
        and on which side we are on, note that some contracts are not related
        to payment so we do not need to add the who pays who part": a member
        with one stream, drafting from a template filed in a stream they
        cannot open, is offered only their own stream, the box starting on
        "Choose a stream" (Create greyed); the side's answers name no payment
     2  "the highlighted buttons should be in the overview page and not
        hidden": the "Next up" cards stand on Overview under the paper's
        glance, a press doing the row's act; the Menu keeps its rows only
     3  "sometimes when i press on the draft new agreement it does not work":
        pressed again after the panel went back to its landing, the chip
        brings the Draft card up, every time

   Run: node test/chromium/form-nextup-and-draft-chip-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES, FOLDER_A } = require('../helpers');

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
  const DRAFT = fixtureContract('MK-D1', 'Warehousing Draft', 'Max Burger', FOLDER_A, 7000000, 'Draft');
  await seedWorkspace(h, { contracts: FIXTURES.concat([DRAFT]), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const signIn = async (email, pass) => {
      const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 20000 });
      await page.waitForLoadState('networkidle');
      /* the app has landed on Home (its box drawn) before anything is opened */
      await page.waitForFunction(() => !!document.getElementById('cn-q') && typeof caDraftForm === 'function', null, { timeout: 20000 }).catch(() => {});
      return page;
    };
    const until = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };

    console.log('\n1 · the new agreement form, for a member with one stream');
    let page = await signIn('restricted@example.co.ke', 'their-own-pass-9');
    const mine = await page.evaluate(() => visibleFolders().map(f => f.id));
    await page.evaluate(() => caDraftForm(null));
    const nda = await until(page, () => { const b = document.querySelector('#na-root [data-wz-tid="ND"]'); if (!b) return null; b.click(); return true; }, null, 10000);
    check('1a the NDA (filed under a stream they cannot open) can be picked', !!nda);
    const form = await until(page, () => {
      const sels = [...document.querySelectorAll('#na-root select')];
      const st = sels.find(s => s.querySelector('option[value="__new__"]'));
      const side = sels.find(s => s.querySelector('option[value="supplier"]'));
      return st && side ? { streams: [...st.options].filter(o => o.value && o.value !== '__new__').map(o => o.value), at: st.value,
        side: [...side.options].map(o => o.textContent.trim()),
        create: (document.getElementById('na-create') || {}).disabled } : null; }, null, 10000);
    check('1b the stream box offers only the streams they can open', !!form && form.streams.every(f => mine.includes(f)) && !form.streams.includes('corp'), form && JSON.stringify({ offered: form.streams, mine }));
    check('1c … and starts on none, Create greyed until one is chosen', !!form && form.at === '' && form.create === true, form && JSON.stringify({ at: form.at, create: form.create }));
    check('1d the side\'s answers name no payment', !!form && form.side.length === 3 && !form.side.some(t => /pay/i.test(t)), form && form.side.join(' | '));
    await shot(page, '1-form');
    await page.context().close();

    console.log('\n2 · "Next up" on the Overview');
    page = await signIn('admin@example.co.ke', 'adminpassword1');
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-D1', 'copilot'); });
    const nx = await until(page, () => { const n = document.querySelector('#ig-dock .pd-nx'); if (!n) return null;
      const cards = [...n.querySelectorAll('[data-pd-mn-go]')]; const g = document.getElementById('pd-glance');
      return { cards: cards.map(c => (c.querySelector('b') || {}).textContent), shown: cards.every(c => c.getBoundingClientRect().height > 0),
        under: !!g && (g.compareDocumentPosition(n) & 4) > 0, lead: (n.querySelector('.pd-mn-lead') || {}).textContent || '' }; }, null, 12000);
    check('2a the Overview carries the Next up cards, on screen', !!nx && nx.cards.length >= 1 && nx.shown, JSON.stringify(nx));
    check('2b … under the paper\'s "at a glance"', !!nx && nx.under);
    check('2c … led by Draft from our standards on a draft', !!nx && nx.cards[0] === 'Draft from our standards', nx && nx.cards[0]);
    await shot(page, '2-overview-next-up');
    await page.evaluate(() => { const b = document.querySelector('#ig-dock .pd-nx [data-pd-mn-go]'); if (b) b.click(); });
    const ask = await until(page, () => !!document.getElementById('cf-ok'), null, 6000);
    check('2d the card does its row\'s act (the confirm before drafting)', !!ask);
    if (ask) await page.click('#cf-cancel');
    await page.evaluate(() => { pdSetTab('menu'); renderIntelDock(); });
    const menu = await until(page, () => { const m = document.querySelector('#pd-body .pd-menu'); return m ? { cards: m.querySelectorAll('.pd-mn-card').length, rows: m.querySelectorAll('.pd-mn-rows button').length } : null; }, null, 8000);
    check('2e the Menu keeps its rows and no longer the cards', !!menu && menu.cards === 0 && menu.rows > 0, JSON.stringify(menu));
    await page.evaluate(() => { pdSetTab('copilot'); renderIntelDock(); });

    console.log('\n3 · "draft a new agreement", pressed again');
    const press = async () => {
      await page.evaluate(() => setView('register'));
      const chip = await until(page, () => { const b = [...document.querySelectorAll('#ig-dock [data-ca-chip]')].find(x => /draft a new agreement/i.test(x.textContent)); if (!b) return null; b.click(); return true; }, null, 8000);
      if (!chip) return { chip: false };
      const card = await until(page, () => { const c = document.querySelector('#ig-dock .ca-dr'); if (!c) return null; const r = c.getBoundingClientRect();
        return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight ? true : null; }, null, 6000);
      return { chip: true, card: !!card };
    };
    const p1 = await press();
    check('3a the first press brings the Draft card, on screen', p1.chip && p1.card, JSON.stringify(p1));
    /* a paper opened, then the panel back on its landing */
    await page.evaluate(() => { pdOpenOnHome('MK-A2', 'copilot'); });
    await page.waitForFunction(() => typeof pdContract === 'function' && pdContract() && pdContract().id === 'MK-A2', null, { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => { if (typeof pdTalkBack === 'function') pdTalkBack(); });
    const p2 = await press();
    check('3b pressed again after the panel went back to its landing, the card comes up', p2.chip && p2.card, JSON.stringify(p2));
    await shot(page, '3-draft-card-again');
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
