/* Chromium verification: THE OBLIGATIONS TAB, THE LEGORA WAY — THE RENEWAL AND THE SIDES
   ============================================================
   Retiring the Details page, round 3 (22 Oct 2026): the Details' Duties
   picture and Renewal card were drawn on the Obligations tab beside the paper
   three ways; the owner picked "Legora way". The renewal comes to the top of
   the tab as quiet lines (Ends · Notice by · Renewal), the words it was read
   from quoted with the clause they stand under; while a decision is due the
   renewal's own decision card stands under them; tabs All · We owe · They owe,
   each with its count, over the list. The picture is not drawn again.

   WHAT THIS PINS, in a real browser, at the owner's three screens:
     1 the renewal lines, read off ovMapRenewal, the quote with its §
     2 the tabs: counts, the filter, the choice shown
     3 while a decision is due, the decision card (renderRenewalSection) is on the tab
     4 a contract with nothing about its renewal draws no renewal lines
   Red at the parent (6fb5d85): no renewal lines, no tabs, no decision card.
   Run: node test/chromium/obligations-renewal-legora-way-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/obligations-renewal-legora-way-verify.js */
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
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const TEXT = 'SUPPLY AGREEMENT\n\nThis agreement is made between Highland Corporate Ltd and Kestrel Logistics AB.\n\n'
  + '1. Services\nThe Supplier shall provide warehousing services.\n\n2. Fees\nInvoices are payable within thirty (30) days of receipt.\n\n'
  + '4. Term and Renewal\nThis agreement runs until its Expiry Date. Any extension must be agreed in writing and signed by both parties before the Expiry Date.\n';
/* dates measured from the day the check runs, never fixed */
const dayFrom = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const end = dayFrom(330);
  await W.admin.json('/api/contracts/MK-UP2', { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
    H.fixtureContract('MK-UP2', 'Kestrel supply', 'Kestrel Logistics AB', H.FOLDER_A, 4800000, 'Under Review'),
    { source: 'upload', template: '', upload: { fileName: 'kestrel.pdf', extractedText: TEXT }, expiry: end,
      metadata: { expiryDate: end, noticePeriodDays: 90, renewalType: 'manual', confirmedAt: '2026-10-01',
        sourceSpans: { renewalType: 'Any extension must be agreed in writing and signed by both parties before the Expiry Date' } },
      obligations: [
        { id: 'ob_1', desc: 'Deliver monthly volumes report', due: dayFrom(14), recurring: 'monthly', party: 'theirs', assignee: '' },
        { id: 'ob_2', desc: 'Pay supplier invoices', due: dayFrom(24), recurring: 'monthly', party: 'us', assignee: 'Amina Otieno' },
        { id: 'ob_3', desc: 'Quarterly quality certificate', due: dayFrom(-7), recurring: 'quarterly', party: 'theirs', assignee: '' },
        { id: 'ob_4', desc: 'Review price index', due: dayFrom(71), recurring: 'quarterly', party: 'us', assignee: 'Amina Otieno' },
        { id: 'ob_5', desc: 'Give notice if not renewing', due: dayFrom(240), recurring: 'none', party: 'us', assignee: 'Amina Otieno' }] }) } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && typeof getContract === 'function' && getContract('MK-UP2') ? true : null, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const openOb = async id => {
      await page.evaluate(async i => { const c = getContract(i); if (c && c._light && typeof ensureFull === 'function') await ensureFull(c); pdOpenOnHome(i, 'oblig'); }, id);
      return until(i => window.intel && intel.paper && String(intel.paper.id) === i && document.querySelector('#pd-body .pd-ob, #pd-body .pd-rn') ? true : null, id, 12000);
    };
    const TAB = () => {
      const b = document.getElementById('pd-body'); if (!b) return null;
      const rn = b.querySelector('[data-pd-rn]');
      return { rows: rn ? [...rn.querySelectorAll('.pd-rn-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()) : [],
        quote: rn && rn.querySelector('.pd-rn-q') ? rn.querySelector('.pd-rn-q').innerText.replace(/\s+/g, ' ').trim() : '',
        tabs: [...b.querySelectorAll('.pd-obs-tab')].map(t => t.textContent.replace(/\s+/g, '') + (t.getAttribute('aria-selected') === 'true' ? '*' : '')),
        sides: [...b.querySelectorAll('.pd-ob')].map(r => r.classList.contains('is-theirs') ? 'theirs' : 'ours'),
        map: !!b.querySelector('.ov-map-stage, svg.ov-map'), side: document.documentElement.scrollWidth <= innerWidth + 1 };
    };

    for (const [w, ht] of SCREENS) {
      const at = `${w}×${ht}`;
      await page.setViewportSize({ width: w, height: ht });
      await part(`1 ${at}`, async () => {
        await openOb('MK-UP2');
        const T = await until(TAB);
        check(`1a ${at} the renewal is lines at the top of the tab: Ends · Notice by · Renewal`,
          !!T && T.rows.length === 3 && /^Ends /.test(T.rows[0]) && /^Notice by .+ · in /.test(T.rows[1]) && /^Renewal /.test(T.rows[2]), JSON.stringify(T && T.rows));
        check(`1b ${at} the words it was read from, quoted with the clause they stand under`,
          !!T && /^§4 .Any extension must be agreed/.test(T.quote), T && T.quote);
        check(`1c ${at} the picture is not drawn on the tab; nothing sideways`, !!T && !T.map && T.side);
        check(`2a ${at} tabs All · We owe · They owe with their counts, All chosen`,
          !!T && T.tabs.join('|') === 'All5*|Weowe3|Theyowe2' && T.sides.length === 5, JSON.stringify(T && T.tabs));
        await shot(`oblig-legora-${w}.png`);
      });
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    await part('2 the tabs', async () => {
      await page.evaluate(() => [...document.querySelectorAll('.pd-obs-tab')].find(b => /We owe/.test(b.textContent)).click());
      const ours = await until(() => { const s = [...document.querySelectorAll('#pd-body .pd-ob')].map(r => r.classList.contains('is-theirs') ? 'theirs' : 'ours'); return s.length && s.every(x => x === 'ours') ? s : null; });
      check('2b We owe lists ours only', Array.isArray(ours) && ours.length === 3, JSON.stringify(ours));
      await page.evaluate(() => [...document.querySelectorAll('.pd-obs-tab')].find(b => /They owe/.test(b.textContent)).click());
      const theirs = await until(() => { const s = [...document.querySelectorAll('#pd-body .pd-ob')].map(r => r.classList.contains('is-theirs') ? 'theirs' : 'ours'); return s.length && s.every(x => x === 'theirs') ? s : null; });
      check('2c They owe lists theirs only', Array.isArray(theirs) && theirs.length === 2, JSON.stringify(theirs));
      await page.evaluate(() => [...document.querySelectorAll('.pd-obs-tab')].find(b => /^All/.test(b.textContent.trim())).click());
      const all = await until(() => document.querySelectorAll('#pd-body .pd-ob').length === 5 ? true : null);
      check('2d All lists every duty again', !!all);
    });

    await part('3 a decision due', async () => {
      /* a signed contract that renews by itself, its notice day passed: held in the browser only (a signed record's terms are frozen on the server) */
      await page.evaluate(async () => { const c = getContract('MK-B1'); if (c._light) await ensureFull(c);
        const e = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
        c.expiry = e; c.metadata = Object.assign({}, c.metadata, { expiryDate: e, noticePeriodDays: 90, renewalType: 'auto-renew' }); });
      await openOb('MK-B1');
      const D = await until(() => { const h0 = document.querySelector('#pd-body [data-pd-rn] #renewal-host'); return h0 && /What did you decide\?/.test(h0.innerText) ? h0.innerText.replace(/\s+/g, ' ').slice(0, 120) : null; });
      check('3a while a decision is due, the renewal\'s own decision card is on the tab', !!D, D);
      /* no duties recorded yet: the renewal still stands at the top, the "none yet" under it */
      const O = await page.evaluate(() => { const b = document.getElementById('pd-body'), rn = b && b.querySelector('[data-pd-rn]'), none = b && [...b.querySelectorAll('*')].find(e => e.children.length === 0 && /No obligations are recorded yet/.test(e.textContent));
        return { rn: !!rn, none: !!none, first: !!(rn && none && (rn.compareDocumentPosition(none) & Node.DOCUMENT_POSITION_FOLLOWING)) }; });
      check('3b with no duties recorded, the renewal lines come first and "No obligations are recorded yet" under them', O.rn && O.none && O.first, JSON.stringify(O));
      await shot('oblig-legora-decide.png');
    });

    await part('4 nothing to say', async () => {
      await page.evaluate(async () => { const c = getContract('MK-A2'); if (c._light) await ensureFull(c);
        c.expiry = ''; c.metadata = Object.assign({}, c.metadata, { expiryDate: '', noticePeriodDays: 0, renewalType: '', sourceSpans: {} });
        c.obligations = [{ id: 'ob_x', desc: 'Send the report', due: new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10), recurring: 'none', party: 'us', assignee: '' }]; });
      await openOb('MK-A2');
      const T = await until(() => document.querySelector('#pd-body .pd-ob') ? { rn: !!document.querySelector('#pd-body [data-pd-rn]') } : null);
      check('4a a contract with nothing about its renewal draws no renewal lines', !!T && !T.rn, JSON.stringify(T));
    });
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
