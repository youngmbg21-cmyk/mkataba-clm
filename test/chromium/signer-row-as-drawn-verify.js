/* ============================================================
   THE SIGNER ROW IN STILL OWED, THE SAP WAY — AS DRAWN
   ============================================================
   The owner, 21 Oct 2026: "adding signer should be next to the signers area not
   at the bottom. Also when i click on add signers it takes me to a different
   location. Propose a rule where it should be possible that you can add without
   being taken to a different page unless there is a pop up. Also, I should also
   be able to search within our directory to enter the right person and their
   respective email."  They picked "The SAP way" by name; this is what it drew.

     1  the bottom "name a signer" chip is GONE (the row asks it now), and the
        row's name boxes are typing boxes — no <select>, so a touch press opens
        HaTi's own list and never also the system picker
     2  typing in the counterparty's signer box opens the directory list, the
        counterparty's own people FIRST and then the rest, each row carrying
        what the record holds (name · party, and the address)
     3  picking a row fills the NAME and the EMAIL together
     4  the list FLOATS: the rows under it do not move, and it covers them
     5  "+ Add another signer" adds another name box, in the row
     6  "Order the signing ›" opens the signing route editor over the same page,
        and closing it lands back on the row that opened it
     7  a box near the foot of the panel opens its list ABOVE itself, whole,
        inside the panel — at the owner's three screens

     node test/chromium/signer-row-as-drawn-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'signer-row-as-drawn');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ID = 'MK-SGR1', THEM = 'Bamburi Cement PLC', OTHER = 'Siginon Group Logistics Ltd';
/* three people the typed word "wan" finds: two at the counterparty, one elsewhere */
const P1 = { name: 'Wanjiru Achieng-Odhiambo', mail: 'wanjiru.achieng@bamburicement.co.ke' };
const P2 = { name: 'Wanjala Mukhwana', mail: 'w.mukhwana@bamburicement.co.ke' };
const P3 = { name: 'Christopher Kiprotich Wanyama', mail: 'christopher.k.wanyama@siginongroup.co.ke' };
const TEXT = ['MUTUAL NON-DISCLOSURE AGREEMENT', '',
  `This agreement is made between Highland Corporate Ltd and ${THEM}.`, '',
  '1. Confidential information', '',
  'Each party shall keep the other party\'s confidential information secret.', '',
  '2. Term', '', 'This agreement runs for two years from the date of signature.'].join('\n');

/* what the row draws, measured in the page */
const MEASURE = () => {
  const row = document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]');
  const dock = document.getElementById('ig-dock'), feed = document.getElementById('igd-feed');
  if (!row || !dock) return { up: false };
  const box = row.querySelector('[data-pd-og-sb="theirs"]');
  const dd = row.querySelector('.pd-og-dd');
  const top = sel => { const el = row.querySelector(sel) || document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().top) : null; };
  const r = el => { if (!el) return null; const q = el.getBoundingClientRect();
    return { top: Math.round(q.top), bottom: Math.round(q.bottom), left: Math.round(q.left), right: Math.round(q.right) }; };
  return { up: true,
    chips: [...document.querySelectorAll('#ig-dock [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip')),
    selects: row.querySelectorAll('select').length,
    nameBoxes: row.querySelectorAll('[data-pd-og-sg="tname"]').length,
    order: row.querySelector('[data-pd-og-route]') ? row.querySelector('[data-pd-og-route]').textContent.trim() : null,
    add: !!row.querySelector('[data-pd-og-sg-add]'),
    list: dd ? [...dd.querySelectorAll('.pd-og-dd-row')].map(b => ({
      name: b.getAttribute('data-pd-og-pick'), mail: b.getAttribute('data-og-mail'),
      words: b.textContent.replace(/\s+/g, ' ').trim() })) : null,
    listBox: r(dd), up2: dd ? dd.classList.contains('is-up') : null,
    boxBox: r(box), mailBox: r(row.querySelector('[data-pd-og-sg="temail"]')),
    addTop: top('[data-pd-og-sg-add]'), ktTop: top('#pd-kt'),
    name: box ? box.value : null, mail: (row.querySelector('[data-pd-og-sg="temail"]') || {}).value,
    feed: r(feed) };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const mk = async (id, name, them, who, body) => {
    const c = Object.assign(fixtureContract(id, name, them, 'legal', 0, 'Under Review', body || TEXT), {
      template: null, owner: { id: me.id, name: me.name }, fields: { value: '' },
      metadata: { value: 0, currency: 'KES', contractType: 'NDA' },
      counterpartyName: who.name, counterpartyEmail: who.mail });
    return W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  };
  const put = await mk(ID, 'Mutual Non-Disclosure Agreement', THEM, P1);
  /* the directory is a reading over the contracts: two more people it then knows */
  const put2 = await mk('MK-SGR2', 'Supply of Aggregate', THEM, P2);
  const put3 = await mk('MK-SGR3', 'Warehousing Services', OTHER, P3);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    check('0 the three contracts are staged', !!(put && put.ok && put2 && put2.ok && put3 && put3.ok),
      JSON.stringify({ a: put && put.ok, b: put2 && put2.ok, c: put3 && put3.ok }));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, id => window.state && Array.isArray(state.contracts) && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });

    const open = async () => {
      await page.evaluate(() => { if (typeof regPlaceSet === 'function') regPlaceSet({ show: 'list' }); setView('register'); });
      await waitFor(page, () => !!document.querySelector('#ct-place, #reg-root, .reg-card'), 6000);
      await page.evaluate(id => regOpenContract(id), ID);
      await waitFor(page, id => !!document.querySelector(`#pd-glance[data-pd-glance-for="${id}"]`), 12000, ID);
      await page.evaluate(id => { if (typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'copilot'); }, ID);
      const up = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"] [data-pd-og-sg="temail"]'), 12000);
      await page.evaluate(() => { const r = document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]'); if (r) r.scrollIntoView({ block: 'center' }); });
      await page.evaluate(() => document.fonts.ready); await pause(250);
      return up;
    };
    const up0 = await open();
    check('1 the Signer row is up beside the paper', up0);
    await waitFor(page, () => !!document.querySelector('#ig-dock [data-ca-chip]'), 8000);
    const m0 = await page.evaluate(MEASURE);

    console.log('\n1 · the bottom chip went; the boxes are typing boxes');
    check('1a the bottom "name a signer" chip is gone', m0.up && m0.chips.length > 0 && !m0.chips.includes('signer'), JSON.stringify(m0.chips));
    check('1b no <select> is left in the row (one list per press, on an iPad too)', m0.selects === 0, String(m0.selects));
    check('1c "Order the signing ›" stands on the row\'s head line', /Order the signing/.test(m0.order || ''), String(m0.order));
    check('1d "+ Add another signer" stands under the last box', m0.add === true);

    console.log('\n2 · a TOUCH press opens HaTi\'s own list; typing filters it');
    await page.tap('#ig-dock #pd-og [data-pd-og-sb="theirs"]');
    await pause(150);
    const mt = await page.evaluate(MEASURE);
    check('2a a touch press opens exactly one list', !!mt.list && mt.list.length > 0
      && (await page.evaluate(() => document.querySelectorAll('#ig-dock #pd-og .pd-og-dd').length)) === 1, JSON.stringify((mt.list || []).map(x => x.name)));
    await page.fill('#ig-dock #pd-og [data-pd-og-sb="theirs"]', '');
    await page.type('#ig-dock #pd-og [data-pd-og-sb="theirs"]', 'wan', { delay: 30 });
    await pause(200);
    const m1 = await page.evaluate(MEASURE);
    const names = (m1.list || []).map(x => x.name);
    check('2b typing opens the directory list', !!m1.list && m1.list.length >= 3, JSON.stringify(names));
    const atThem = [P1.name, P2.name];
    check('2c the counterparty\'s own people come first, the rest after them',
      names.length >= 3 && atThem.includes(names[0]) && atThem.includes(names[1]) && names[0] !== names[1]
      && names.indexOf(P3.name) > 1, JSON.stringify(names));
    check('2d each row says what the record holds — the party and the address',
      !!m1.list && m1.list.slice(0, 2).every(x => x.words.includes(THEM) && x.words.includes(x.mail)), JSON.stringify(m1.list && m1.list.slice(0, 2)));

    console.log('\n4 · the list floats over the rows under it');
    check('4a the rows under the box did not move', m1.addTop === m0.addTop && m1.ktTop === m0.ktTop,
      JSON.stringify({ was: { add: m0.addTop, kt: m0.ktTop }, now: { add: m1.addTop, kt: m1.ktTop } }));
    check('4b the list covers what is under the box rather than pushing it down',
      !!(m1.listBox && m1.mailBox && m1.listBox.top <= m1.mailBox.top + 2 && m1.listBox.bottom > m1.mailBox.top),
      JSON.stringify({ list: m1.listBox, mail: m1.mailBox }));
    await page.screenshot({ path: path.join(OUT, 'list-open-1440x780.png') });

    console.log('\n3 · a pick fills the name and the address together');
    await page.click(`#ig-dock #pd-og .pd-og-dd-row[data-pd-og-pick="${P2.name}"]`);
    await pause(200);
    const m2 = await page.evaluate(MEASURE);
    check('3a the name box holds the person picked', m2.name === P2.name, String(m2.name));
    check('3b their address came with them', m2.mail === P2.mail, String(m2.mail));
    check('3c the list is down again', m2.list === null);
    /* ON AN iPAD TOO: a tap opens the list and a tap on a row picks from it */
    await page.tap('#ig-dock #pd-og [data-pd-og-sb="theirs"]');
    await pause(150);
    await page.tap(`#ig-dock #pd-og .pd-og-dd-row[data-pd-og-pick="${P1.name}"]`).catch(() => {});
    await pause(200);
    const m2t = await page.evaluate(MEASURE);
    check('3d a touch pick fills the name and the address too', m2t.name === P1.name && m2t.mail === P1.mail,
      JSON.stringify({ name: m2t.name, mail: m2t.mail }));

    console.log('\n5 · + Add another signer adds a box, in the row');
    await page.click('#ig-dock #pd-og [data-pd-og-sg-add]');
    await pause(200);
    const m3 = await page.evaluate(MEASURE);
    check('5a a second signer box stands in the row', m3.nameBoxes === m0.nameBoxes + 1, JSON.stringify({ was: m0.nameBoxes, now: m3.nameBoxes }));
    check('5b nothing left the page for it', await page.evaluate(() => !document.querySelector('.modal-overlay, [role="dialog"]')
      && !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]')));

    console.log('\n6 · Order the signing › is the row\'s one pop-up');
    await page.click('#ig-dock #pd-og [data-pd-og-route]');
    const route = await waitFor(page, () => !!document.getElementById('sr-win'), 8000);
    check('6a it opens the signing route editor over the same page', route
      && await page.evaluate(() => !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-row="signers"]')));
    await page.click('#sp-cancel').catch(() => {});
    const back = await waitFor(page, () => !document.getElementById('sr-win')
      && !!document.activeElement && !!document.activeElement.closest
      && !!document.activeElement.closest('#ig-dock #pd-og tr[data-pd-og-row="signers"]'), 8000);
    check('6b closing it lands back on the row it came from', back,
      await page.evaluate(() => (document.activeElement && document.activeElement.getAttribute('data-pd-og-sg')) || String(document.activeElement && document.activeElement.tagName)));

    console.log('\n7 · near the foot of the panel the list opens upward — at the three screens');
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await open();
      /* put the box near the foot of the panel's scroller, then press it */
      await page.evaluate(() => { const f = document.getElementById('igd-feed'), b = document.querySelector('#ig-dock #pd-og [data-pd-og-sb="theirs"]');
        if (!f || !b) return; f.scrollTop += b.getBoundingClientRect().bottom - f.getBoundingClientRect().bottom + 24; });
      await pause(200);
      const was = await page.evaluate(MEASURE);
      await page.click('#ig-dock #pd-og [data-pd-og-sb="theirs"]');
      await pause(200);
      const now = await page.evaluate(MEASURE);
      const at = `${w}x${hh}`;
      check(`7 ${at} the list opens and is whole`, !!(now.list && now.list.length && now.listBox), JSON.stringify(now.listBox));
      if (!now.listBox) continue;
      check(`7a ${at} it opened above the box`, now.up2 === true && now.listBox.bottom <= now.boxBox.top + 2,
        JSON.stringify({ up: now.up2, list: now.listBox, box: now.boxBox }));
      check(`7b ${at} it stands inside the panel`, now.listBox.top >= now.feed.top - 1 && now.listBox.bottom <= now.feed.bottom + 1,
        JSON.stringify({ list: now.listBox, feed: now.feed }));
      check(`7c ${at} the rows under it still did not move`, now.addTop === was.addTop, JSON.stringify({ was: was.addTop, now: now.addTop }));
      await page.screenshot({ path: path.join(OUT, `flip-${at}.png`) });
      await page.keyboard.press('Escape').catch(() => {});
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
