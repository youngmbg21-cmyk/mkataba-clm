'use strict';
/* who-does-what-verify — AGREE WHO DOES WHAT, BEFORE YOU SIGN (owner, 22 Nov 2026: "Build l+s and Legora way for the
   other side"; f1163 pins the reading and the walls). Driven where each reader looks, in the new look, on the practice
   SaaS paper (MK-IT, round 7's world) with six duties read off it:

   1  our Dossier: the "Where the deal stands" card stands under the Family card and ABOVE the facts, saying what waits
   2  the card opens our page in the middle: tabs Still open · Settled · Who does what, the duty table (nothing sideways),
      the Dossier turned to the page's panel, and the waves over it
   3  our Agree in the row is written by the server; the row and the panel say so
   4  their Where we are carries the third chip; its list is the Legora way (a mark, the duty, the paper's words) and
      their Agree makes the line agreed by both, read back on our page
   5  ‹ Back to the paper puts the page away; the Dossier and its card return
   Each half guarded: a missing feature reports, it does not time out. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const FOUND = [
  { desc: 'Deliver the Services at the agreed service levels', quote: 'The Supplier shall deliver the Services described in Schedule 1 to the Customer for the Term.', clause: '1', party: 'them' },
  { desc: 'Pay each correct invoice within 30 days', quote: 'Customer shall pay each correct invoice within 30 days of receipt.', clause: '5', party: 'us' },
  { desc: 'Who sends the invoices, and how often?', quote: '', clause: '5', party: 'unsure' },
  { desc: 'Process personal data only as the Data Schedule allows', quote: 'Each Party shall process personal data only as the Data Processing Schedule allows', clause: '12', party: 'both' },
  { desc: 'Tell the other side of a data breach within 72 hours', quote: 'shall notify the other of a breach within seventy-two (72) hours.', clause: '12', party: 'both' },
  { desc: 'Keep to the liability cap: 12 months of Charges', quote: "Each Party's total liability under this agreement shall not exceed twelve (12) months of Charges", clause: '26', party: 'both' },
];

(async () => {
  const h = await startHati(); await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const us = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; us.on('pageerror', e => errors.push('us: ' + e.message));
  try {
    await us.goto(h.base + '/', { waitUntil: 'networkidle' });
    await us.fill('#li-email', 'admin@example.co.ke'); await us.fill('#li-pass', 'adminpassword1'); await us.click('#li-go');
    await until(us, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
    await us.evaluate(W.R7_IN_PAGE);
    const seed = await us.evaluate(async F => {
      const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c);
      c.triage = Object.assign({}, c.triage || {}, { steps: Object.assign({}, (c.triage && c.triage.steps) || {}, { oblig: { ok: true, found: F } }) });
      const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
      const pay = cls.find(x => /Payment/.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
      if (pay) await negoEditClause(c, pay.clauseId, '<p>Customer shall pay each correct invoice within 45 days of receipt.</p>', { side: 'owner', author: 'Amina Otieno', why: 'Our standard.' });
      if (window.persist) await persist(c); if (window.flushSaves) await flushSaves();
      const keys = dutyReading(c).rows.map(x => x.key);
      const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'link', purpose: 'negotiate', durable: true, recipient: { name: 'Erik Lindqvist', email: 'erik@parcelway.example' } });
      const tok = r && (r.token || (r.share && r.share.token));
      for (const i of [3, 4]){ await api('contracts/MK-IT/duties', 'POST', { key: keys[i], answer: 'yes' }); await api('shares/' + tok + '/duties', 'POST', { key: keys[i], answer: 'yes' }); }
      return { tok, keys };
    }, FOUND);
    check('0 the practice paper carries six duties and a negotiate link', seed && seed.tok && seed.keys.length === 6, JSON.stringify(seed && seed.keys.length));

    /* 1 — the card on the Dossier */
    await us.reload({ waitUntil: 'networkidle' });
    await until(us, () => typeof pdOpenOnHome === 'function' && !!getContract('MK-IT'), null, 30000);
    await us.evaluate(() => pdOpenOnHome('MK-IT', 'open'));
    const c1 = await until(us, () => !!document.querySelector('#ig-dock [data-pd2-dl-open]'), null, 12000);
    const c1b = c1 ? await us.evaluate(() => {
      const card = document.querySelector('#ig-dock [data-pd2-dl-open]'), fam = document.querySelector('#ig-dock [data-pd2-famc]'), facts = document.querySelector('#ig-dock .pd2-facts');
      return { underFam: !!(fam && (fam.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)), aboveFacts: !!(facts && (card.compareDocumentPosition(facts) & Node.DOCUMENT_POSITION_FOLLOWING)), text: card.textContent.replace(/\s+/g, ' ').trim() };
    }) : {};
    check('1a the Dossier carries the Where the deal stands card', c1);
    check('1b it stands under the Family card and above the facts', c1b.underFam && c1b.aboveFacts, JSON.stringify(c1b));
    check('1c it says what waits for you', /1 line waits for your tick/.test(c1b.text || ''), c1b.text);

    /* 2 — the page in the middle */
    if (c1) await us.click('#ig-dock [data-pd2-dl-open]');
    const p2 = await until(us, () => !!document.querySelector('#pd2-dl .pd2-dl-t') && !!document.querySelector('#ig-dock .pd2-dossier.is-deal'), null, 10000);
    check('2a the card opens our page in the middle, the Dossier turned to its panel', p2);
    const p2b = p2 ? await us.evaluate(() => {
      const t = document.querySelector('#pd2-dl .pd2-dl-t'), dock = document.getElementById('ig-dock');
      return { tabs: [...document.querySelectorAll('#pd2-dl [data-pd2-dl-tab]')].map(b => b.getAttribute('data-pd2-dl-tab')).join(','),
        rows: document.querySelectorAll('#pd2-dl [data-pd2-dl-row]').length, sideways: t.scrollWidth > t.clientWidth + 1,
        /* RE-POINTED 23 Nov 2026 (THE WAVES SLIDE AS ONE PICTURE): the weave is the anchored stage lying on the panel */
        waves: (() => { const pr = dock.getBoundingClientRect(), st = document.getElementById('wm-dock'); if (!st) return false; const r = st.getBoundingClientRect();
          return Math.abs(r.left - pr.left) < 2 && Math.abs(r.top - pr.top) < 2 && r.width > 0 && /data:image\/svg/.test(getComputedStyle(st.querySelector('.wm-a')).maskImage || ''); })(),
        head: (document.querySelector('#ig-dock .pd2-dl-ft') || {}).textContent || '' };
    }) : {};
    check('2b tabs Still open · Settled · Who does what', p2b.tabs === 'open,settled,duties', p2b.tabs);
    check('2c six duty rows, nothing sideways', p2b.rows === 6 && !p2b.sideways, JSON.stringify(p2b));
    check('2d the panel carries the waves', p2b.waves);
    check('2e the panel says what waits for you', /1 line waits for your tick/.test(p2b.head || ''), p2b.head);

    /* 3 — our Agree in its row */
    const k0 = seed.keys[0];
    const agree = await us.$(`#pd2-dl [data-pd2-dl-ans="${k0}"][data-v="yes"]`);
    check('3a the waiting line offers Agree in its row', !!agree);
    if (agree) await agree.click();
    const p3 = await until(us, k => { const r = document.querySelector(`#pd2-dl [data-pd2-dl-row="${k}"]`); return !!(r && /You agree/.test(r.textContent)); }, k0, 10000);
    check('3b the row says You agree', p3);
    const s3 = await us.evaluate(async () => (await api('contracts/MK-IT/duties')).dutyTicks);
    check('3c the server wrote our answer', !!(s3 && s3[k0] && s3[k0].ours && s3[k0].ours.answer === 'yes'));

    /* 4 — their side, the Legora way */
    const them = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    them.on('pageerror', e => errors.push('them: ' + e.message));
    await them.goto(h.base + '/#share=t:' + seed.tok, { waitUntil: 'networkidle' });
    await until(them, () => !!document.getElementById('pt-tab-where'), null, 20000);
    await them.click('#pt-tab-where').catch(() => {});
    const t4 = await until(them, () => !!document.querySelector('[data-pol-w-k="duties"]'), null, 10000);
    check('4a their Where we are carries the Who does what chip', t4);
    if (t4) await them.click('[data-pol-w-k="duties"]');
    const t4b = await until(them, () => document.querySelectorAll('.pol-wd-r').length === 6, null, 8000);
    check('4b their list: six lines, each with its mark and the paper\'s words', t4b && await them.evaluate(() => [...document.querySelectorAll('.pol-wd-r')].every(r => r.querySelector('.pol-wd-m') && r.querySelector('.pol-wd-t b'))));
    const theirs = await them.$(`[data-pol-wd-ans="${k0}"][data-v="yes"]`);
    check('4c the line offers them Agree in its row', !!theirs);
    if (theirs) await theirs.click();
    const t4c = await until(them, k => { const r = document.querySelector(`[data-pol-wd-row="${k}"]`); return !!(r && /Both agree/.test(r.textContent)); }, k0, 10000);
    check('4d their Agree makes the line agreed by both', t4c);
    await them.close();

    /* 5 — back to the paper */
    await us.evaluate(() => { if (window.pdMidClose) pdMidClose(); });
    const p5 = await until(us, () => !document.querySelector('#pd2-dl') && !!document.querySelector('#ig-dock [data-pd2-dl-open]'), null, 8000);
    check('5 the page is put away; the Dossier and its card return', p5);

    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
