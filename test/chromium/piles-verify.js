/* REDLINES, "PILES" (round 9 of the redesign: the owner picked "Piles" by
   name, 17 Oct 2026; js/views/negotiation.js rlRowByHtml, rlRowWhyHtml)

   WHAT THIS PINS, driven in a real browser on Nordvik's round (two asks with
   their reasons) and one change of ours not yet sent
     1 the piles: "Waiting on you" first, then our drafts
     2 a row says who and when at its right wall; the reference is not on
       the row but rides its hover
     3 the reason they gave sits under the change, in their words, above the
       row's buttons
     4 what is settled this round folds behind its heading: shut, a press
       opens it, a press again shuts it
     5 the paper does not move; nothing past the column's edge at the owner's
       three screens
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/piles-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const pause = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
const DOC = ['MASTER SERVICES AGREEMENT', '',
  '1. Parties and purpose', '', 'This Agreement is made between Lindqvist & Co AB, Stockholm (the Customer), and Nordvik Logistik AB, Gothenburg (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care, and to the service levels in Schedule 2.', '',
  '3. Term', '', 'This Agreement starts on 1 April 2026 and runs until 31 March 2028.', '',
  '4. Fees', '', 'The Customer pays the fees in Schedule 3. Fees are stated in SEK and exclude VAT.', '',
  '5. Service levels', '', 'If the Supplier misses a service level, the Customer receives the service credits in Schedule 2.', '',
  '6. Confidentiality', '', 'Each party keeps the other party\'s confidential information secret during this Agreement and for five years after it ends.', '',
  '7. Liability cap', '', 'Each party\'s total liability under this Agreement in any contract year is capped at 50% of the fees paid in that year.', '',
  '8. Insurance', '', 'The Supplier holds liability insurance of at least SEK 20 million.', '',
  '9. Data protection', '', 'The Supplier notifies the Customer of a personal data breach without undue delay.', '',
  '10. Subcontractors', '', 'The Supplier may use subcontractors only with the Customer\'s written consent.', '',
  '11. Payment terms', '', 'The Customer pays each correct invoice within 30 days of receipt.', '',
  '12. Law and disputes', '', 'Swedish law governs this Agreement. Disputes are settled by arbitration seated in Stockholm.'].join('\n');

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Lindqvist & Co AB', name: 'Maria Lindgren', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
  const me = (await admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4200000, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name }; c0.metadata = { value: 4200000, currency: 'SEK' };
  await admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Anna Holm', email: 'anna.holm@nordvik.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Lindqvist & Co AB', sharedBy: 'Maria', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });

  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await b.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => { try { setBrand('green'); } catch (_) {} });
    const cls = await page.evaluate(async () => { const c = getContract('MK-0382'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, bb, why) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, bb), why }; };
    await h.client('anna').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Anna Holm', id: 'MK-0382', at: new Date().toISOString(),
      negoProposed: [ask(/capped at 50%/, '50%', '100%', 'Standard in our contracts.'), ask(/within 30 days/, '30 days', '60 days', 'Our own customers pay us at 60 days.')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await waitFor(page, () => (getContract('MK-0382').changes || []).length >= 2, 10000);
    /* one of ours, filed and not sent: clause 9 */
    await page.evaluate(async () => { const c = getContract('MK-0382'); const k = negoClauseList(c).find(x => /without undue delay/.test(String(x.text || '')));
      await negoEditClause(c, k.clauseId, '<p>The Supplier notifies the Customer of a personal data breach within 24 hours of becoming aware of it.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Our data protection standard' }); });
    await pause(800);
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-0382', 'copilot'); });
    await waitFor(page, () => !!document.getElementById('ig-canvas'), 10000);
    const sheetAt = () => page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'), sh = document.querySelector('#ig-paper .pg-sheet, #ig-paper .doc-surface'); return sc && sh ? Math.round(sh.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop) : null; });
    const at0 = await sheetAt();
    await page.evaluate(() => pdRedOpen('MK-0382'));
    const up = await waitFor(page, () => !!document.querySelector('#pd-redface [data-nego-card]'), 10000);
    const R = await page.evaluate(() => {
      const col = document.getElementById('pd-redface');
      const bands = [...col.querySelectorAll('.rl-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      const rows = [...col.querySelectorAll('[data-nego-card]')].map(r => { const by = r.querySelector('.rl-card-by'), id = r.querySelector('.rl-card-id'), why = r.querySelector('.rl-card-whyq'), verbs = r.querySelector('.rl-card-side');
        return { id: r.getAttribute('data-nego-card'), by: by ? by.textContent : null, byTip: by ? by.title : '', idShown: !!(id && id.getClientRects().length), why: why ? why.textContent : null,
          whyAbove: !!(why && verbs && why.getBoundingClientRect().bottom <= verbs.getBoundingClientRect().top + 1), quiet: r.classList.contains('rl-card-quiet'), vis: !!r.getClientRects().length }; });
      return { bands, rows };
    });
    check('1 the piles: "Waiting on you" leads, our drafts after it', up && /^Waiting on you\s*2/.test(R.bands[0] || '') && R.bands.some(b => /not yet sent/.test(b)), JSON.stringify(R.bands));
    const theirs = R.rows.filter(r => /Anna/.test(r.by || ''));
    /* RE-POINTED 18 Oct 2026 (round 9's gaps, "Piles" as drawn: "You ·
       today" on our own row) and 19 Oct 2026 (a name on a change card is first
       name plus initial, owner 13 Aug 2026; f188 — "Anna H.", as main had it) */
    check('2a a row says who and when at its right wall', theirs.length === 2 && theirs.every(r => /^Anna H\. · today$/.test(r.by))
      && R.rows.some(r => /^You · today$/.test(r.by || '')), JSON.stringify(R.rows));
    check('2b the reference is not on the row; it rides the hover', R.rows.every(r => !r.idShown && r.byTip.includes(r.id)), JSON.stringify(R.rows));
    check('3 the reason they gave sits under the change, in their words, above the buttons',
      theirs.some(r => r.why === '\u201cStandard in our contracts.\u201d' && r.whyAbove) && theirs.some(r => r.why === '\u201cOur own customers pay us at 60 days.\u201d' && r.whyAbove), JSON.stringify(theirs));
    await shot(page, 'piles-1440x780');
    /* 4 settle one, then the fold */
    const one = theirs[0].id;
    await page.evaluate(id => { const c = getContract('MK-0382'); negoResolve(c, id, 'accepted'); renderIntelDock(); }, one);
    const settled = await waitFor(page, () => !!document.querySelector('#pd-redface [data-rl-settled-fold]'), 6000);
    const shut = await page.evaluate(id => { const r = document.querySelector(`#pd-redface [data-nego-card="${id}"]`), f = document.querySelector('#pd-redface [data-rl-settled-fold]');
      return { hidden: !!r && !r.getClientRects().length, exp: f && f.getAttribute('aria-expanded'), head: f && f.textContent.replace(/\s+/g, ' ').trim() }; }, one);
    check('4a settled this round folds behind its heading, shut', settled && shut.hidden && shut.exp === 'false' && /Settled this round\s*1/.test(shut.head), JSON.stringify(shut));
    await page.click('#pd-redface [data-rl-settled-fold]');
    const opened = await page.evaluate(id => { const r = document.querySelector(`#pd-redface [data-nego-card="${id}"]`); return !!r && !!r.getClientRects().length && document.querySelector('#pd-redface [data-rl-settled-fold]').getAttribute('aria-expanded') === 'true'; }, one);
    check('4b a press opens it', opened);
    await page.click('#pd-redface [data-rl-settled-fold]');
    const shutAgain = await page.evaluate(id => { const r = document.querySelector(`#pd-redface [data-nego-card="${id}"]`); return !!r && !r.getClientRects().length; }, one);
    check('4c a press again shuts it', shutAgain);
    /* 5 the paper and the three screens */
    const at1 = await sheetAt();
    check('5a the paper does not move', at0 != null && at1 === at0, `${at0} → ${at1}`);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await pause(400);
      const S = await page.evaluate(() => { const col = document.getElementById('pd-redface'); const cr = col.getBoundingClientRect();
        const over = [...col.querySelectorAll('.rl-card-by, .rl-card-whyq, .rl-band')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > cr.right + 1; }).length;
        return { over, side: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
      check(`5 ${w}×${ht}: nothing past the column's edge, nothing sideways`, !S.over && S.side, JSON.stringify(S));
      await shot(page, `piles-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await b.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
