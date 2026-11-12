/* CHOOSE THE ROAD (owner picked "The Legora Way" by name, 11 Nov 2026: "Build The Legora Way"; drawn for their paper,
   our paper, and our paper with notes).
   Filled-in contracts nothing has been sent on, in the new look:
     1 · our paper, nothing open: the card says "Choose the road", rows Send for their mark-up · Send for signature;
         the black button is "Send to Juno Logistics"
     2 · its press opens the one Send screen with "Reply with their own changes" already chosen
     3 · our paper with notes open: Redline it first (black, its count, the notes' own words quoted) · Send for their
         mark-up · Send for signature, both saying the notes are still open
     4 · Redline it lands on the Redlines face's list of risks
     5 · their paper (it came as a file) with a risk: Negotiate (black, "1 risk", the words quoted) · Send for
         signature as it is
     6 · Send as it is opens the Send screen with "Sign" chosen
     7 · once something has gone to them the card is the old one (no road)
     8 · at the owner's three screens: the card inside the panel, its black button in view, nothing sideways
   At the parent (before this change) 1–6 and 8 fail: the card goes straight to "N to settle before anyone signs".
   Run: node test/chromium/choose-the-road-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'choose-the-road');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const today = new Date().toISOString().slice(0, 10);
const finding = (id, quote, title, why) => ({ id, sev: 'high', kind: 'risk', title, anchor: '', quote, what: title, why, fix: 'x' });
const filled = (id, extra) => Object.assign(fixtureContract(id, 'Cold Chain Haulage', 'Juno Logistics', 'proc', 2000000, 'Draft'), {
  template: 'RM', fields: { value: '2000000', effDate: '2026-12-01', material: 'pasteurised milk' }, effective: '2026-12-01', effectiveDate: '2026-12-01', expiry: '2027-11-30',
  signerPlan: [{ id: 'sg1', party: 'internal', name: 'Admin', email: 'admin@example.co.ke', order: 1 }, { id: 'sg2', party: 'counterparty', name: 'Wanjiru Otieno', email: 'wanjiru@juno.co.ke', order: 2 }] }, extra || {});
const scan = list => ({ scan: { at: 'today', on: today, lang: 'en', dismissed: [], findings: list } });
const CARD = () => { const k = document.querySelector('#ig-dock .pd2-card'); if (!k) return null;
  return { road: k.classList.contains('is-road'), head: ((k.querySelector('[data-pd2-next]') || {}).textContent || '').trim(),
    rows: [...k.querySelectorAll('[data-pd2-rd]')].map(r => r.getAttribute('data-pd2-rd')),
    black: [...k.querySelectorAll('.pd2-rd-go')].map(b => ({ t: b.textContent.trim(), road: b.getAttribute('data-pd2-road'), risks: b.hasAttribute('data-pd-gl-risks') })),
    chips: [...k.querySelectorAll('.pd2-rd-chip')].map(c => c.textContent.trim()), quotes: [...k.querySelectorAll('.pd2-rd-q')].map(q => q.textContent.trim()) }; };
const purposeNow = () => { const m = (document.body.innerText || '').match(/WHAT THEY CAN DO\s*\n\s*([^\n]+)/i); return m ? m[1].trim() : ''; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [], contracts: [
    filled('MK-R1'), filled('MK-R5'), filled('MK-R6'),
    filled('MK-R2', scan([finding('a', 'invoices fall due within', 'Payment terms: 30 days', 'Your standard says 60.'), finding('b', 'requirements may be rejected', 'Rejection window: 3 days', 'Your standard says 7.')])),
    filled('MK-R3', Object.assign({ source: 'upload', upload: { name: 'theirs.docx', uploadedAt: new Date().toISOString(), uploadedBy: 'Admin' } }, scan([finding('c', 'requirements may be rejected', 'Rejection window: 3 days', 'Your standard says 7.')]))),
    filled('MK-R4', { status: 'Under Review', negotiation: { round: 1, turn: 'counterparty', turnAt: new Date().toISOString() } })] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const open = async (id, W, H) => {
    const page = await browser.newPage({ viewport: { width: W || 1440, height: H || 780 } });
    page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, id => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract(id), id, 40000);
    await page.evaluate(async id => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand(id); }, id);
    await until(page, id => typeof deskKeyNow === 'function' && deskKeyNow() === 'c:' + id && !!document.querySelector('#ig-dock .pd2-card'), id, 20000);
    return page;
  };
  try {
    /* 1–2 our paper, nothing open */
    let page = await open('MK-R1');
    const r1 = await until(page, () => !!document.querySelector('#ig-dock .pd2-card.is-road'), null, 8000);
    const C1 = await page.evaluate(CARD);
    check('1 our paper, nothing open: Choose the road, mark-up then signature, "Send to Juno Logistics" black',
      r1 && C1 && C1.head === 'Choose the road' && C1.rows.join() === 'markup,sign' && C1.black.length === 1 && C1.black[0].road === 'markup' && /Send to Juno Logistics/.test(C1.black[0].t), C1);
    await page.screenshot({ path: path.join(OUT, 'ours.png') });
    if (r1){ await page.click('#ig-dock .pd2-rd-go');
      const s2 = await until(page, () => /WHAT THEY CAN DO/i.test(document.body.innerText || ''), null, 8000);
      const p2 = await page.evaluate(purposeNow);
      check('2 its press opens the Send screen with "Reply with their own changes" chosen', s2 && /Reply with their own changes/i.test(p2), p2); }
    await page.close();

    /* 3–4 our paper with notes */
    page = await open('MK-R2');
    const r3 = await until(page, () => !!document.querySelector('#ig-dock .pd2-card.is-road'), null, 8000);
    const C3 = await page.evaluate(CARD);
    check('3 our paper with notes: Redline it first black with its count and the words quoted; both sends say the notes are open',
      r3 && C3 && C3.rows.join() === 'fix,markup,sign' && C3.black.length === 1 && C3.black[0].risks && /Redline it/.test(C3.black[0].t)
      && C3.chips.includes('2 notes') && C3.chips.filter(t => t === '2 notes open').length === 2 && C3.quotes.some(q => /invoices fall due within/.test(q)), C3);
    await page.screenshot({ path: path.join(OUT, 'notes.png') });
    if (r3){ await page.click('#ig-dock .pd2-rd-go');
      check('4 Redline it lands on the Redlines face\'s list of risks', await until(page, () => !!document.querySelector('#ig-dock #rl-risks'), null, 8000)); }
    await page.close();

    /* 5–6 their paper */
    page = await open('MK-R3');
    const r5 = await until(page, () => !!document.querySelector('#ig-dock .pd2-card.is-road'), null, 8000);
    const C5 = await page.evaluate(CARD);
    check('5 their paper with a risk: Negotiate black with "1 risk" and the words quoted, then Send for signature as it is',
      r5 && C5 && C5.rows.join() === 'nego,sign' && C5.black.length === 1 && C5.black[0].risks && C5.black[0].t === 'Negotiate' && C5.chips.includes('1 risk') && C5.quotes.some(q => /requirements may be rejected/.test(q)), C5);
    await page.screenshot({ path: path.join(OUT, 'theirs.png') });
    if (r5){ await page.click('#ig-dock [data-pd2-rd="sign"] [data-pd2-road="sign"]');
      const s6 = await until(page, () => /WHAT THEY CAN DO/i.test(document.body.innerText || ''), null, 8000);
      const p6 = await page.evaluate(purposeNow);
      check('6 Send as it is opens the Send screen with "Sign" chosen', s6 && /^Sign\b/.test(p6), p6); }
    await page.close();

    /* 7 something has gone to them */
    page = await open('MK-R4');
    await page.waitForFunction(() => !!document.querySelector('#ig-dock .pd2-card [data-pd2-next]'), null, { timeout: 8000 }).catch(() => {});
    const C7 = await page.evaluate(CARD);
    check('7 once something has gone to them, no road', !!C7 && !C7.road, C7);
    await page.close();

    /* 8 the owner's three screens */
    for (const [nm, W, H, id] of [['laptop-a', 1440, 780, 'MK-R1'], ['laptop-b', 1536, 730, 'MK-R5'], ['ipad', 1366, 950, 'MK-R6']]){
      page = await open(id, W, H);
      const on = await until(page, () => !!document.querySelector('#ig-dock .pd2-card.is-road'), null, 8000);
      const F = await page.evaluate(() => { const k = document.querySelector('#ig-dock .pd2-card'), dock = document.getElementById('ig-dock'), go = k && k.querySelector('.pd2-rd-go');
        const kr = k && k.getBoundingClientRect(), dr = dock && dock.getBoundingClientRect(), gr = go && go.getBoundingClientRect();
        return { inside: !!(kr && dr) && kr.left >= dr.left - 1 && kr.right <= dr.right + 1, goInView: !!gr && gr.top >= 0 && gr.bottom <= innerHeight,
          oneLine: !!go && go.scrollWidth <= go.clientWidth + 1, sideways: document.documentElement.scrollWidth - innerWidth }; });
      check(`8 ${nm} the card inside the panel, its black button in view and on one line, nothing sideways`, on && F.inside && F.goInView && F.oneLine && F.sideways <= 0, F);
      await page.screenshot({ path: path.join(OUT, `screen-${nm}.png`) });
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
