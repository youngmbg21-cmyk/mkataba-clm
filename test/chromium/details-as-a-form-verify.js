/* Chromium verification: THE DETAILS TAB READS AS A FORM (owner, 13 Oct 2026)
   ============================================================
   Over a screenshot of a franchise agreement's Details tab: the right side was
   the Overview's two-column card squeezed into a third of the screen — scroll
   areas inside scroll areas, boxes too pale to see, the same fact twice,
   "Parties (0)" over a listed party, and the 21 things owed at the very
   bottom. Measured on a company standard with ten questions, at 1700 × 950:
     1  the first empty box of the paper's questions is on screen without
        scrolling, and so is the other party's box
     2  the contract's details are VISIBLE boxes (a painted edge), and an
        empty one is amber
     3  one scroll in the column — nothing scrolls inside it
     4  no fact has two boxes in the column (other party, value, start date),
        and the end date is not asked here (owner, 13 Oct 2026: the Overview's)
     5  RE-POINTED 13 Oct 2026 (owner: "this area is only supposed to be used
        to fill in the blanks needed on the paper, the rest should go back to
        the overview page"): no folds, no parties, people or filing here
     6  typing the other party clears its amber and moves the tab's count
     7  no page errors
   A wait asks for the state, bounded. Red at main 200fe07 (1, 2, 5, 6).
   Run: node test/chromium/details-as-a-form-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const TF = require('../../js/templateform.js');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const names = ['Effective Date', 'Franchisor Name', 'Franchisor Principal Place of Business', 'Franchisee Name',
    'Franchisee Principal Place of Business', 'Territory', 'Initial Fee', 'Royalty Rate', 'Marketing Fee', 'Term Years'];
  const form = { templateId: 'T9', templateName: 'Franchise', versionNumber: 1,
    fields: names.map((n, i) => ({ fieldKey: 'f' + i, label: n, fieldType: i === 0 ? 'date' : 'text', required: i < 5, section: i < 5 ? 'Parties' : 'Money' })),
    values: {},
    blocks: [{ blockType: 'heading', content: 'FAST FOOD RESTAURANT FRANCHISE AGREEMENT', orderIndex: 0 },
      { blockType: 'field_group', content: 'Effective {{f0}}. {{f1}} at {{f2}} and {{f3}} at {{f4}}. Territory {{f5}}, fee {{f6}}, royalty {{f7}}, marketing {{f8}}, term {{f9}}.', orderIndex: 1 }] };
  const c = { id: 'MK-DF1', name: 'Restaurant Franchise Agreement', counterparty: '', party: '', folder: 'proc', status: 'Draft',
    value: 0, template: null, format: 'rich', templateForm: form, redlineText: TF.templateFormDocHtml(form), fields: {},
    comments: [], rounds: [], versions: [], signatures: [], metadata: {}, compliance: { consent: false }, audit: [] };
  await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(() => !!(window.state && window.getContract && getContract('MK-DF1')), null, 20000);
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       Details tab went home — the same door (roomGoTab 'details') opens Jambo's
       Fill in face beside Home's paper. The form is #pd-fill inside the face's
       root .pd-ff[data-pd-ff="MK-DF1"] (the old [data-doc-col="details"]
       column); the face's scroller #pd-fillface is the column's one scroll
       (the old #doc-right); the tab's count is the face's own "N left" pill. */
    await page.evaluate(() => { openWorkspace('MK-DF1'); roomGoTab(getContract('MK-DF1'), 'details'); });
    const up = await until(() => !!document.querySelector('#pd-fillface .pd-ff[data-pd-ff="MK-DF1"] #pd-fill [data-tplf]'));
    if (!up) { check('0 the Details tab draws its form', false); throw new Error('not drawn'); }

    const m = await page.evaluate(() => {
      const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; };
      /* RE-POINTED 14 Oct 2026 (stage 5): the face dresses a date question in
         HaTi's own date face (popupControlsDress — the native box is hidden
         behind .dp-face), so the box the reader sees is that face */
      const q0 = document.querySelector('#pd-fill [data-tplf]');
      const qFace = q0 && q0.nextElementSibling && q0.nextElementSibling.classList.contains('dp-face') ? q0.nextElementSibling : null;
      const firstQ = (q0 && q0.getBoundingClientRect().width === 0 && qFace) ? qFace : q0;
      /* the other party's box wherever this build draws it on the tab */
      const cp = document.querySelector('#det-basics [data-kt="counterparty"]') || document.querySelector('.pd-ff[data-pd-ff="MK-DF1"] [data-kt="counterparty"]');
      if (!cp) return { qOn: vis(firstQ), cpOn: false, edge: false, cpAmber: false, inner: ['(no other-party box)'], twice: ['counterparty'] };
      const cs = getComputedStyle(cp);
      const right = document.getElementById('pd-fillface');
      const inner = [...right.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2 && e.tagName !== 'TEXTAREA'; });
      const probe = document.createElement('i'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
      const amber = getComputedStyle(probe).backgroundColor; probe.remove();
      const count = k => document.querySelectorAll(`.pd-ff[data-pd-ff="MK-DF1"] [data-kt="${k}"]`).length;
      return { qOn: vis(firstQ), cpOn: vis(cp), edge: cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0,
        cpAmber: cs.backgroundColor === amber, amber, cpBg: cs.backgroundColor, inner: inner.map(e => e.id || e.className).slice(0, 4),
        twice: ['counterparty', 'value', 'effDate'].filter(k => count(k) !== 1).concat(count('expiry') ? ['expiry'] : []) };
    });
    check('1 the first empty question and the other party are on screen without scrolling', m.qOn && m.cpOn, JSON.stringify({ q: m.qOn, cp: m.cpOn }));
    check('2 the contract\'s details are visible boxes, an empty one amber', m.edge && m.cpAmber, `edge ${m.edge} · ${m.cpBg} vs ${m.amber}`);
    check('3 one scroll in the column — nothing scrolls inside it', m.inner.length === 0, JSON.stringify(m.inner));
    check('4 no fact has two boxes in the column', m.twice.length === 0, m.twice.join(', ') || 'one each');

    const p = await page.evaluate(() => { const col = document.querySelector('.pd-ff[data-pd-ff="MK-DF1"]');
      return { folds: col ? col.querySelectorAll('details').length : -1, parties: !!(col && col.querySelector('#ov-parties, #kt-det-terms, #det-more')),
        law: !!(col && col.querySelector('[data-ktm="governingLaw"]')) }; });
    check('5 only what the paper owes: no folds, no parties, people or filing, no other terms', p.folds === 0 && !p.parties && !p.law, JSON.stringify(p));

    const before = await page.evaluate(() => (document.querySelector('#pd-fillface [data-pd-ff-pill]') || {}).textContent || '');
    if (await page.evaluate(() => !!document.querySelector('#det-basics [data-kt="counterparty"]')))
      await page.fill('#det-basics [data-kt="counterparty"]', 'Juno Foods Ltd');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ tab: (document.querySelector('#pd-fillface [data-pd-ff-pill]') || {}).textContent || '',
      open: !!(document.querySelector('#det-basics [data-cd-key="counterparty"]') || { classList: { contains: () => true } }).classList.contains('is-open'),
      stored: getContract('MK-DF1').counterparty }));
    check('6 typing the other party is stored, clears its amber and moves the tab\'s count',
      after.stored === 'Juno Foods Ltd' && !after.open && after.tab !== before, `${before} → ${after.tab} · ${JSON.stringify(after)}`);
    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    if (e.message !== 'not drawn') check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
