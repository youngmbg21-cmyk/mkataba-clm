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
const { startHati, seedWorkspace, ckConfirm } = require('../helpers');
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
    await page.evaluate(() => { openWorkspace('MK-DF1', { room: true }); roomGoTab(getContract('MK-DF1'), 'details'); });
    /* RE-POINTED 20 Oct 2026 (the Legora way): the form is Still owed's grid (#pd-og) on the Dossier beside Home's paper */
    /* RE-POINTED 24 Oct 2026 (Round 4, owner's "mix": "the fields fold into groups ... Only the group you are working
       on opens"): with this many owed, the grid is groups, one open; a fact's group is opened before it is read */
    const openGroupWith = async sel => {
      if (await page.evaluate(q => !!document.querySelector(q), sel)) return true;
      const keys = await page.evaluate(() => [...document.querySelectorAll('#pd-og [data-pd-og-g-go]')].map(b => b.getAttribute('data-pd-og-g-go')));
      for (const k of keys){
        await page.evaluate(g => { const b = document.querySelector(`#pd-og [data-pd-og-g-go="${g}"]`); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, k);
        if (await until(q => !!document.querySelector(q), sel, 1500)) return true;
      }
      return false;
    };
    /* RE-POINTED 28 Oct 2026 (owner picked "Fill in the contract"): the door lands on the form of every owed fact, all of
       them open (no groups to open); asked for, bounded */
    const up = await until(() => !!document.querySelector('#pd-og.is-form[data-pd-og-for="MK-DF1"]')) && await openGroupWith('#pd-og[data-pd-og-for="MK-DF1"] [data-tplf]');
    if (!up) { check('0 the Details tab draws its form', false); throw new Error('not drawn'); }
    await page.waitForTimeout(300);
    const qSeen = await page.evaluate(() => { const q0 = document.querySelector('#pd-og [data-tplf]'); const f = q0 && q0.nextElementSibling && q0.nextElementSibling.classList.contains('dp-face') ? q0.nextElementSibling : null;
      const el = (q0 && q0.getBoundingClientRect().width === 0 && f) ? f : q0; if (!el) return false;
      /* the open group may sit below the fold under the Next card: the reader scrolls to it */
      el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; });
    await openGroupWith('#pd-og[data-pd-og-for="MK-DF1"] [data-kt="counterparty"]');
    await page.waitForTimeout(300);

    const m = await page.evaluate(() => {
      const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; };
      /* RE-POINTED 14 Oct 2026 (stage 5): the face dresses a date question in
         HaTi's own date face (popupControlsDress — the native box is hidden
         behind .dp-face), so the box the reader sees is that face */
      const q0 = document.querySelector('#pd-og [data-tplf]');
      const qFace = q0 && q0.nextElementSibling && q0.nextElementSibling.classList.contains('dp-face') ? q0.nextElementSibling : null;
      const firstQ = (q0 && q0.getBoundingClientRect().width === 0 && qFace) ? qFace : q0;
      /* the other party's box wherever this build draws it on the tab */
      const cp = document.querySelector('#pd-og[data-pd-og-for="MK-DF1"] [data-kt="counterparty"]');
      if (!cp) return { qOn: vis(firstQ), cpOn: false, edge: false, cpAmber: false, inner: ['(no other-party box)'], twice: ['counterparty'] };
      /* RE-POINTED 28 Oct 2026 (Fill in the contract): every box stands open in one form; the reader scrolls to the
         other party's, as to the first question */
      cp.scrollIntoView({ block: 'nearest' });
      const cs = getComputedStyle(cp);
      /* RE-POINTED 28 Oct 2026 (Fill in the contract): the column is the form */
      const right = document.querySelector('#ig-dock .pd-fm') || document.getElementById('pd-glance');
      const inner = [...right.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2 && e.tagName !== 'TEXTAREA'; });
      const probe = document.createElement('i'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
      const amber = getComputedStyle(probe).backgroundColor; probe.remove();
      const count = k => document.querySelectorAll(`#pd-og[data-pd-og-for="MK-DF1"] [data-kt="${k}"]`).length;
      /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): ONE row is open at a time — the first
         owed one, its box on screen; the other party's row is its one line, a press away */
      const cpLine = cp.closest('tr') && cp.closest('tr').querySelector('.pd-ck-hd');
      const qRow = q0 && q0.closest('tr'), cpRow = cp.closest('tr');
      return { qOn: vis(firstQ) || (!!qRow && !qRow.classList.contains('is-open') && vis(qRow.querySelector('.pd-ck-hd'))),
        cpOn: cpRow && (cpRow.classList.contains('is-open') || cpRow.classList.contains('pd-fm-row')) ? vis(cp) : vis(cpLine), edge: cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0,
        cpAmber: cs.backgroundColor === amber, amber, cpBg: cs.backgroundColor, inner: inner.map(e => e.id || e.className).slice(0, 4),
        /* a closed group draws none of its rows: one box at most per fact */
        twice: ['counterparty', 'value', 'effDate'].filter(k => count(k) > 1).concat(count('expiry') ? ['expiry'] : []) };
    });
    check('1 the first empty question and the other party are on screen, each in its open group', qSeen && m.cpOn, JSON.stringify({ q: qSeen, cp: m.cpOn }));
    check('2 the contract\'s details are visible boxes, an empty one amber', m.edge && m.cpAmber, `edge ${m.edge} · ${m.cpBg} vs ${m.amber}`);
    check('3 one scroll in the column — nothing scrolls inside it', m.inner.length === 0, JSON.stringify(m.inner));
    check('4 no fact has two boxes in the column', m.twice.length === 0, m.twice.join(', ') || 'one each');

    const p = await page.evaluate(() => { const col = document.querySelector('#pd-og[data-pd-og-for="MK-DF1"]');
      return { folds: col ? col.querySelectorAll('details').length : -1, parties: !!(col && col.querySelector('#ov-parties, #kt-det-terms, #det-more')),
        law: !!(col && col.querySelector('[data-ktm="governingLaw"]')) }; });
    check('5 only what the paper owes: no folds, no parties, people or filing, no other terms', p.folds === 0 && !p.parties && !p.law, JSON.stringify(p));

    /* RE-POINTED 22 Oct 2026 (the Checklist): the count stands beside "Needs you"; the row is opened first */
    /* RE-POINTED 28 Oct 2026 (Fill in the contract): the count is the form's head while it is up, the Details line's after
       the one Save brings the Dossier back — its number of owed facts */
    const headOf = () => { const t = ((document.querySelector('#ig-dock .pd-fm [data-pd-fm-count]') || document.querySelector('#ig-dock #pd-og [data-pd-og-row="details"] .pd-ck-v') || {}).textContent || '');
      const m = /(\d+) needed/.exec(t); return m ? m[1] : t; };
    const before = await page.evaluate(headOf);
    if (await page.evaluate(() => !!document.querySelector('#pd-og [data-kt="counterparty"]'))){
      await page.evaluate(() => { const b = document.querySelector('#pd-og [data-pd-ck-row="counterparty"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
      await page.fill('#pd-og [data-kt="counterparty"]', 'Juno Foods Ltd');
      await ckConfirm(page, 'counterparty'); }
    await page.waitForTimeout(500);
    const after = await page.evaluate(h => ({ tab: (new Function('return (' + h + ')()'))(),
      /* RE-POINTED 28 Oct 2026 (Fill in the contract): after the one Save the Dossier is back; the fact is owed no more */
      open: pdOgFacts(getContract('MK-DF1')).some(f => f.key === 'counterparty'),
      stored: getContract('MK-DF1').counterparty }), headOf.toString());
    check('6 typing the other party is stored, clears its amber and moves the tab\'s count',
      after.stored === 'Juno Foods Ltd' && !after.open && Number(after.tab) === Number(before) - 1, `${before} → ${after.tab} · ${JSON.stringify(after)}`);
    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    if (e.message !== 'not drawn') check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
