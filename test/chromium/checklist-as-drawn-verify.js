/* ============================================================
   THE DOSSIER AS A CHECKLIST — AS DRAWN
   ============================================================
   The owner, 22 Oct 2026: "Implement checklist. The add signers pop up should
   be wide enough that you do not have to scroll left or right which is
   annoying." They picked "1 · Checklist" by name (with 1a · 4 signers,
   1b · Signers open, 1c · Ordering them); this is what it drew.

     1  the stage line: "Stage · 4 of 6", the stage's name, six bars, ONE current
     2  "Needs you N": every owed fact is one line of one height (ring · name ·
        Missing or what Jambo read · chevron), ONE row open, the rest closed
     3  a press on a closed row opens it and closes the one open; pressed again
        it closes; nothing leaves the page
     4  "Confirm N read" stores what Jambo read even though its row is closed
     5  Jambo read under Needs you: Brief and Risks, each "Not read …" and Read
     6  Next acts: the stage's acts as equal buttons on one line; "All acts N ›"
        opens the room's whole list under them and folds it again
     7  the ONLY signer button on the Dossier is "Add or order signers ›"
     8  four signers named: the row is green, "4 named · 4 steps"; opened, the
        route in order (1–4) and the one button; it opens the signing route,
        which is the XL rung and shows no sideways scroll, and a person's ⋯
        menu shows whole (Move up · Move down · Sign at the same time …)
     9  the owner's three screens: nothing past the panel's edge

     node test/chromium/checklist-as-drawn-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'checklist-as-drawn');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ID = 'MK-CKL1', THEM = 'Bamburi Cement PLC';
const TEXT = ['MUTUAL NON-DISCLOSURE AGREEMENT', '',
  `This agreement is made between Highland Corporate Ltd and ${THEM}.`, '',
  '1. Confidential information', '',
  'Each party shall keep the other party\'s confidential information secret.', '',
  '2. Term', '', 'This agreement runs for two years from the date of signature.'].join('\n');

const MEASURE = () => {
  const dock = document.getElementById('ig-dock'); if (!dock) return { up: false };
  const og = dock.querySelector('#pd-og');
  const rows = og ? [...og.querySelectorAll('tr.pd-og-row')] : [];
  const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
  const feed = document.getElementById('igd-feed'), fr = feed ? feed.getBoundingClientRect() : null;
  return { up: !!og,
    stage: (() => { const s = dock.querySelector('.ds-spine.is-ck'); if (!s) return null;
      return { head: (s.querySelector('.ds-ck-sh') || {}).textContent, now: (s.querySelector('.ds-ck-now') || {}).textContent,
        t: ((s.querySelector('.ds-mq-t') || {}).textContent || '').trim(), s: ((s.querySelector('.ds-mq-s') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        bars: s.querySelectorAll('.ds-st').length, cur: s.querySelectorAll('.ds-st.is-ck-cur').length,
        /* SPINE (23 Oct 2026): the six stage lines, the one we are in, nothing written under a head */
        lines: [...s.querySelectorAll('.ds-sp-st')].filter(vis).map(x => ((x.querySelector('b') || {}).textContent || '').trim()),
        spCur: [...s.querySelectorAll('.ds-sp-st.is-cur')].map(x => ((x.querySelector('b') || {}).textContent || '').trim()),
        words: !!dock.querySelector('.ds-mq-t, .ds-mq-s'), party: /Bamburi/.test(s.textContent || ''),
        needsHead: vis(dock.querySelector('#pd-needs > .pd-gl-h')),
        /* ROUND 4 (owner's "mix", 24 Oct 2026): the six stages one line across, the one in focus ringed */
        ln: [...dock.querySelectorAll('.ds-ln-st')].filter(vis).map(x => ((x.querySelector('b') || {}).textContent || '').trim()),
        lnCur: [...dock.querySelectorAll('.ds-ln-st.is-cur')].filter(vis).length }; })(),
    saveAll: vis(dock.querySelector('[data-pd-og-saveall]')),
    head: ((dock.querySelector('#pd-needs .pd-gl-h') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    rows: rows.map(r => ({ key: r.getAttribute('data-pd-og-row'), open: r.classList.contains('is-open'), door: r.classList.contains('is-named') || r.classList.contains('is-door'),
      h: Math.round((r.querySelector('.pd-ck-hd') || r).getBoundingClientRect().height),
      box: vis(r.querySelector('td.pd-og-v')), ok: vis(r.querySelector('[data-pd-og-ok]')),
      words: ((r.querySelector('.pd-ck-hd') || {}).textContent || '').replace(/\s+/g, ' ').trim() })),
    order: [...dock.querySelectorAll('#pd-glance > *, .pd-nx > *')].map(e => e.getAttribute('data-pd-ds-card') || e.getAttribute('data-ds-fold') || (e.classList.contains('ds-spine') ? 'stage' : e.id || e.className.split(' ')[0])),
    read: [...dock.querySelectorAll('.ds-read .ds-rr')].map(r => r.textContent.replace(/\s+/g, ' ').trim()),
    acts: [...dock.querySelectorAll('.ds-acts-b.is-ck > button')].map(b => { const q = b.getBoundingClientRect(); return { w: Math.round(q.width), top: Math.round(q.top), t: b.textContent.trim() }; }),
    allOpen: !!(dock.querySelector('[data-ds-fold="acts"]') || {}).open,
    signerBtns: [...dock.querySelectorAll('#pd-glance button, .pd-nx button')]
      .map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(t => /signers?\b/i.test(t)),
    past: [...dock.querySelectorAll('#pd-glance *, .pd-nx > :not(details) *')].filter(e => fr && vis(e) && e.getBoundingClientRect().right > fr.right + 1).length };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = Object.assign(fixtureContract(ID, 'Mutual Non-Disclosure Agreement', THEM, 'legal', 0, 'Under Review', TEXT), {
    template: null, owner: { id: me.id, name: me.name }, fields: { value: '' },
    metadata: { value: 0, currency: 'KES', contractType: 'NDA' },
    counterpartyName: 'Wanjiru Achieng', counterpartyEmail: 'wanjiru@bamburicement.co.ke' });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    check('0 the contract is staged', !!(put && put.ok));
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
      const up = await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og tr.pd-og-row'), 12000);
      await page.evaluate(() => document.fonts.ready); await pause(250);
      return up;
    };
    check('0b the Dossier is up beside the paper', await open());
    const m0 = await page.evaluate(MEASURE);

    console.log('\n1 · the stage line');
    /* RE-POINTED 23 Oct 2026 (owner picked "Marquee"): the stage is the headline, the sentence says who with,
       which stage and how many things need you, then six bars with ONE current */
    /* RE-POINTED 23 Oct 2026 (owner picked "Spine"): no headline, no sentence, no name of the other side; the six
       stages down the line, ONE current (Negotiate), and no "Needs you" head over the rows */
    /* RE-POINTED 24 Oct 2026 (Round 4, owner's "mix"): the six stages are ONE line across with ticks and dates, the
       one in focus ringed; still no headline, sentence or party, no Needs you head */
    check('1a six stages on one line across, ONE in focus, no headline, sentence or party, no Needs you head', !!m0.stage
      && m0.stage.ln.join('|') === 'Arrive|Read|Fill|Negotiate|Sign|Live' && m0.stage.lnCur === 1
      && !m0.stage.words && !m0.stage.party && !m0.stage.needsHead, JSON.stringify(m0.stage));

    console.log('\n2 · Needs you, one line a fact, one open');
    check('2a the head says "Needs you" with its number', /^Needs you\s*\d+/.test(m0.head), m0.head);
    /* the owner, 22 Oct 2026 ("1, drawing"): the Dossier tab's number is this list's */
    const tabN = await page.evaluate(() => ((document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || '').trim());
    check('2a2 the Dossier tab carries the same number', tabN !== '' && tabN === (/\d+/.exec(m0.head) || [''])[0], JSON.stringify({ tab: tabN, head: m0.head }));
    check('2a3 no line between sections or rows (the owner kept The Brief)', await page.evaluate(() => [...document.querySelectorAll('#ig-dock #pd-glance > *, #ig-dock .pd-nx > *, #ig-dock #pd-og tr, #ig-dock .ds-rr')]
      .every(e => { const s = getComputedStyle(e); return ['Top', 'Bottom'].every(k => !(parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none')); })));
    const owed = m0.rows.filter(r => r.key !== 'stream');
    /* RE-POINTED 28 Oct 2026 (owner picked "Fill in the contract", The Legora way, by name): beside a paper the
       Dossier holds no box — the owed facts are ONE line, "Details · N needed", and its press (the one Fill in door)
       turns the panel to the form of every one of them: each name over its box, ONE Save, no Confirm on a row.
       What 2b–2d and 3 asked of the rows is asked of the form; the Dossier's own rows keep their doors. */
    const FORM = () => { const fm = document.querySelector('#ig-dock .pd-fm'); if (!fm) return null;
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      return { rows: [...fm.querySelectorAll('tr.pd-fm-row')].map(r => { const lab = r.querySelector('td.pd-og-f b');
          const box = [...r.querySelectorAll('td.pd-og-v :is(.pd-og-in, .dp-face, select)')].find(vis);
          const lr = lab && lab.getBoundingClientRect(), br = box && box.getBoundingClientRect();
          return { key: r.getAttribute('data-pd-og-row'), over: !!(lr && br && lr.bottom <= br.top + 1), ok: vis(r.querySelector('[data-pd-og-ok]')) }; }),
        save: fm.querySelectorAll('[data-pd-fm-save]').length };
    };
    const det = owed.find(r => r.key === 'details') || {};
    check('2b the owed facts are one line, "Details", and the Dossier holds no box', /^Details\s*\d+ needed/.test(det.words || '') && !det.box
      && owed.filter(r => r.key !== 'details').every(r => r.door), JSON.stringify(owed.map(r => [r.key, r.box, r.door])));
    await page.click('#ig-dock .ds-nx [data-pd-ds-fill]');
    await waitFor(page, () => !!document.querySelector('#ig-dock .pd-fm tr.pd-fm-row'), 6000);
    const fm0 = await page.evaluate(FORM);
    check('2c its press opens the form: every fact its box, labelled above it, ONE Save, no Confirm on a row',
      !!fm0 && fm0.rows.length >= 2 && fm0.rows.every(r => r.over && !r.ok) && fm0.save === 1, JSON.stringify(fm0));
    check('2d the line says how many are owed ("N needed")', /\d+ needed/.test(det.words || ''), det.words);
    check('2e the order: stage, Needs you, Jambo read, Next acts, then Key terms and the folds',
      m0.order.indexOf('stage') < m0.order.indexOf('owed') && m0.order.indexOf('owed') < m0.order.indexOf('read')
      && m0.order.indexOf('read') < m0.order.indexOf('acts') && m0.order.indexOf('acts') < m0.order.indexOf('pd-kt') + (m0.order.includes('pd-kt') ? 0 : 999),
      JSON.stringify(m0.order));

    console.log('\n3 · the form, and back');
    /* RE-POINTED 28 Oct 2026 (Fill in the contract): no row opens or closes; the form's way back is the Dossier */
    check('3d nothing left the page for it', await page.evaluate(() => !document.querySelector('.modal-overlay, [role="dialog"]')));
    await page.click('#ig-dock [data-pd-back="form"]');
    check('3e its way back is the Dossier', await waitFor(page, () => !document.querySelector('#ig-dock .pd-fm') && !!document.querySelector('#ig-dock #pd-og.is-dossier'), 6000));

    console.log('\n5 · Jambo read');
    /* RE-POINTED 23 Oct 2026 (Marquee): the brief's row says its cost */
    check('5a Brief and Risks, each "Not read …" and Read', m0.read.length >= 2 && /^Brief\s*Not read yet · about 3 calls\s*Read$/.test(m0.read[0])
      && /^Risks to look at\s*Not read · free\s*Read$/.test(m0.read[1]), JSON.stringify(m0.read));

    console.log('\n6 · Next acts');
    /* RE-POINTED 23 Oct 2026 (owner picked "Marquee"): the first act filled in its whole name, the next in its short
       word, "All N ›" at the end of the same line */
    const a0 = m0.acts;
    check('6a the stage\'s acts: the first in its whole name, the next, and All N at the end, on one line',
      a0.length === 3 && /^Import their Word file$/.test(a0[0].t) && /^All \d+ ›$/.test(a0[2].t) && Math.abs(a0[0].top - a0[2].top) <= 4, JSON.stringify(a0));
    await page.click('#ig-dock [data-pd-acts-all]'); await pause(150);
    const m3 = await page.evaluate(MEASURE);
    /* RE-POINTED 24 Oct 2026 (Round 3, "The SAP Way"): All N › drops the same menu card as Actions; the Dossier never moves */
    const pop1 = await page.evaluate(() => !!document.getElementById('pd-acts-pop'));
    check('6b "All N ›" drops the room\'s whole list as its own menu card, the Dossier untouched', pop1 && m3.allOpen === false, JSON.stringify({ pop1, fold: m3.allOpen }));
    await page.click('#ig-dock [data-pd-acts-all]'); await pause(150);
    check('6c pressed again it goes', !(await page.evaluate(() => !!document.getElementById('pd-acts-pop'))));

    console.log('\n7 · one signer button');
    /* RE-POINTED 22 Oct 2026 (owner: the signer boxes and their buttons went; "the use for it is in the pop up"):
       the one signer door is the Signer line itself, and no other button speaks of signers */
    const sgDoor = await page.evaluate(() => ({ door: !!document.querySelector('#ig-dock #pd-og tr[data-pd-og-kind="signer"] .pd-ck-hd[data-pd-og-route]'),
      boxes: document.querySelectorAll('#ig-dock #pd-og tr[data-pd-og-kind="signer"] input').length }));
    check('7 the only signer door on the Dossier is the Signer line, with no boxes in it', sgDoor.door && sgDoor.boxes === 0 && m0.signerBtns.length === 0, JSON.stringify({ sgDoor, btns: m0.signerBtns }));

    console.log('\n4 · the one Save stores what Jambo read');
    /* RE-POINTED 28 Oct 2026 (Fill in the contract): "Confirm N read" went; the form's one Save stores his readings */
    const readRow = m0.rows.find(r => /\d+ found/i.test(r.words));
    if (readRow){
      await page.click('#ig-dock .ds-nx [data-pd-ds-fill]');
      await waitFor(page, () => !!document.querySelector('#ig-dock .pd-fm tr.pd-fm-row.is-read'), 6000);
      const key = await page.evaluate(() => (document.querySelector('#ig-dock .pd-fm tr.pd-fm-row.is-read') || {}).getAttribute('data-pd-og-row'));
      await page.click('#ig-dock [data-pd-fm-save]');
      const done = await waitFor(page, k => !document.querySelector('#ig-dock .pd-fm') && !pdOgFacts(getContract(pdContract().id)).some(f => f.key === k), 8000, key);
      check('4 the reading is stored by the one Save', done, key);
    } else check('4 a fact read from the wording is there to confirm', false, JSON.stringify(m0.rows.map(r => r.words)));

    console.log('\n8 · four signers, in order, and the one door');
    const named = await page.evaluate(async id => {
      const c = getContract(id); const me = currentUser() || {};
      const why = saveSignerPlan(c, [
        { party: 'internal', name: me.name, email: me.email, role: 'Legal Counsel', memberId: me.id, order: 1 },
        { party: 'internal', name: 'Peter Kamau', email: 'peter.kamau@highlandcorporate.co.ke', role: 'Chief Executive Officer', order: 2 },
        { party: 'counterparty', name: 'Wanjiru Achieng', email: 'wanjiru@bamburicement.co.ke', role: 'Legal', order: 3 },
        { party: 'counterparty', name: 'David Mwangi', email: 'david.mwangi.managingdirector@bamburicement.co.ke', role: 'Managing Director', order: 4 }]);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      if (typeof pdGlanceRepaint === 'function') pdGlanceRepaint();
      return why || 'ok';
    }, ID);
    check('8 the route names four', named === 'ok', String(named));
    await waitFor(page, () => !!document.querySelector('#ig-dock #pd-og tr.is-named'), 8000);
    const sg = await page.evaluate(() => { const r = document.querySelector('#ig-dock #pd-og tr.is-named'); return r ? (r.querySelector('.pd-ck-hd') || {}).textContent.replace(/\s+/g, ' ').trim() : null; });
    check('8a the Signers row is green and says "4 named · 4 steps"', /Signers\s*4 named · 4 steps/.test(sg || '')
      && await page.evaluate(() => !!document.querySelector('#ig-dock #pd-og tr.is-named .pd-ck-ring.is-done')), String(sg));
    await page.click('#ig-dock #pd-og [data-pd-ck-row="signers"]'); await pause(150);
    const list = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .pd-ck-sg')].map(li => li.textContent.replace(/\s+/g, ' ').trim()));
    check('8b opened: the route in order, 1 to 4', list.length === 4 && list.every((t, i) => t.startsWith(String(i + 1))), JSON.stringify(list));
    check('8c the one door stands under it', await page.evaluate(() => /Add or order signers/.test((document.querySelector('#ig-dock tr.is-named [data-pd-og-route]') || {}).textContent || '')));
    await page.screenshot({ path: path.join(OUT, 'signers-open-1440x780.png') });
    await page.click('#ig-dock tr.is-named [data-pd-og-route]');
    const win = await waitFor(page, () => !!document.getElementById('sr-win'), 8000);
    const sr = await page.evaluate(() => { const w = document.getElementById('sr-win'); const sc = w && w.closest('.modal-in');
      return w ? { w: Math.round(w.getBoundingClientRect().width), side: sc ? sc.scrollWidth - sc.clientWidth : -1 } : null; });
    check('8d it opens the signing route, the XL rung, with no sideways scroll', win && sr && sr.w >= 740 && sr.side <= 0, JSON.stringify(sr));
    await page.evaluate(() => { const b = document.querySelectorAll('#sr-win [data-sp-menu]')[2]; if (b) b.click(); }); await pause(250);
    const menu = await page.evaluate(() => { const m = document.querySelector('#sr-win .sr-menu'); if (!m) return null;
      const items = [...m.querySelectorAll('button')].filter(b => { const q = b.getBoundingClientRect(); const at = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return at && b.contains(at); });
      return items.map(b => b.textContent.replace(/\s+/g, ' ').trim()); });
    check('8e a person\'s ⋯ menu shows whole: Move up, Move down, Sign at the same time', !!menu && menu.some(t => /Move up/.test(t)) && menu.some(t => /Move down/.test(t)) && menu.some(t => /same time/.test(t)), JSON.stringify(menu));
    await page.screenshot({ path: path.join(OUT, 'route-menu-1440x780.png') });
    await page.keyboard.press('Escape').catch(() => {}); await pause(100);
    await page.click('#sp-cancel').catch(() => {});
    await waitFor(page, () => !document.getElementById('sr-win'), 6000);

    console.log('\n9 · the owner\'s three screens');
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await open();
      const m = await page.evaluate(MEASURE);
      check(`9 ${w}x${hh} nothing past the panel's edge`, m.up && m.past === 0, String(m.past));
      await page.screenshot({ path: path.join(OUT, `dossier-${w}x${hh}.png`) });
      await page.evaluate(() => { const f = document.getElementById('igd-feed'); if (f) f.scrollTop = f.scrollHeight; }); await pause(150);
      await page.screenshot({ path: path.join(OUT, `dossier-foot-${w}x${hh}.png`) });
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
