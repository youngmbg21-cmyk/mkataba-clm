/* ============================================================
   THE MIDDLE — WHAT A DOSSIER LINE OPENS COMES TO YOU
   (owner, 21 Oct 2026: "When you press, you never leave dossier … the board
   cards come to you, the obligations pop up comes to you … the paper
   disappears but there should be a button … that says paper that simply
   brings the paper back or you can ask jambo"; then "can we do the same for
   key terms?"; picked "The stage (your idea)", "yes, build it Legoras way")
   ============================================================
   A warehousing agreement on Home's paper, read on arrival by Jambo (two
   standards to look at, three obligations found, not yet acknowledged).
   Driven in a real browser:
     1  Jambo's work · New paper's "See it" brings the piece to the MIDDLE:
        still Home's paper (not the Board), the Dossier beside it in sight
        and pressable, the page ending at the Dossier's edge; the row says
        "Showing in the middle"; "‹ Paper" leads the chips; the piece carries
        the standards and the obligations, and no Open Details
     2  the four ways back: See it again, "‹ Paper", Esc, the bar's ‹; and
        another page in front puts the middle away
     3  "Add 3 obligations" in the middle: the review stands in the middle,
        not a pop-up, the Dossier beside it; "‹ Paper" brings the paper back
     4  Key terms is ONE line in the Dossier (no table there); pressed, the
        table stands in the middle; Change → a box, Done stores it on the
        record; the line pressed again brings the paper back
     5  "paper" asked of Jambo brings the paper back
     6  the owner's three screens: Jambo's work, the obligations review and
        Key terms in the middle beside the Dossier, nothing scrolls
        sideways; photographed
     node test/chromium/the-middle-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'the-middle');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ID = 'MK-MID1';
const TEXT = ['WAREHOUSING AND DISTRIBUTION SERVICES AGREEMENT', '',
  'This agreement is made between Highland Corporate Ltd (the Client) and Lumumba Logistics Ltd (the Carrier).', '',
  '1. Services', '', 'The Carrier shall collect from the Client\'s warehouse and deliver to the Stock yard within the agreed territory.', '',
  '2. Payment terms', '', 'The Client shall pay each correct invoice within 60 days of receipt.', '',
  '3. Liability', '', 'The Carrier\'s liability is capped at six months\' fees.', '',
  '4. Governing law', '', 'This agreement is governed by the laws of Kenya.'].join('\n');

/* what stands in the middle, measured where the reader looks */
const MID = () => {
  const p = document.querySelector('#modal-root [data-pd-mid]'), dock = document.getElementById('ig-dock');
  const back = document.querySelector('#ig-dock [data-ig-chips] [data-pd-mid-back]');
  const out = { up: !!p, view: window.state && (state.view + ':' + (typeof hbFace === 'function' ? hbFace() : '')), paperHeld: !!(window.intel && intel.paper && intel.paper.id) };
  if (!p || !dock) return out;
  const pr = p.getBoundingClientRect(), dr = dock.getBoundingClientRect();
  const dockHit = document.elementFromPoint(Math.round(dr.left + dr.width / 2), Math.round(dr.top + dr.height / 2));
  const backHit = back && back.getClientRects().length ? (() => { const r = back.getBoundingClientRect(); const e = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)); return !!(e && back.contains(e)); })() : false;
  return Object.assign(out, { key: p.getAttribute('data-pd-mid'), right: Math.round(pr.right), w: Math.round(pr.width), dockLeft: Math.round(dr.left),
    dockShown: !!(dockHit && dock.contains(dockHit)), back: back ? { first: back.parentElement.firstElementChild === back, text: back.textContent.trim(), hit: backHit } : null,
    crumb: ((p.querySelector('.dlg-pg-crumb') || {}).textContent || '').trim(), title: ((p.querySelector('.dlg-pg-title') || {}).textContent || '').trim(),
    sideways: document.documentElement.scrollWidth > window.innerWidth + 1 });
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c = Object.assign(fixtureContract(ID, 'Warehousing and Distribution Agreement', 'Lumumba Logistics Ltd', 'dist', 4500000, 'Under Review', TEXT), {
    template: null, owner: { id: me.id, name: me.name }, metadata: { value: 4500000, currency: 'KES', contractType: 'Warehousing', governingLaw: 'Kenya' },
    triage: { at: new Date(Date.now() - 864e5).toISOString(), by: 'Jambo', steps: { brief: { ok: true }, playbook: { ok: true, dev: 1, miss: 1 },
      oblig: { ok: true, found: [{ desc: 'Pay each correct invoice within 60 days', party: 'ours' }, { desc: 'Deliver within the agreed territory', party: 'theirs' },
        { desc: 'Keep goods-in-transit insurance', party: 'theirs' }] } } },
    playbook: { at: new Date().toISOString(), standards: 3, checked: 3, verdicts: [
      { id: 's1', status: 'aligned', category: 'Governing law' },
      { id: 's2', status: 'deviation', category: 'Payment terms', quote: 'within 60 days of receipt', position: 'We pay within 30 days.' },
      { id: 's3', status: 'deviation', category: 'Liability cap', quote: 'capped at six months\' fees', position: 'Liability is capped at twelve months\' fees.' }] } });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* A PRESS ON A CONTROL THAT IS NOT THERE REPORTS, IT DOES NOT TIME OUT (a build without the feature says which claims fail) */
  const click = sel => page.click(sel, { timeout: 3000 }).then(() => true, () => false);
  const open = async () => {
    await page.evaluate(id => { if (typeof closeModal === 'function') closeModal(); pdOpenOnHome(id, 'copilot'); }, ID);
    return waitFor(page, () => !!document.querySelector('#ig-dock .pd-dossier [data-pd-nd-jw]') && !!document.querySelector('#ig-dock [data-pd-kt-mid]'), 12000);
  };
  const gone = () => waitFor(page, () => !document.querySelector('#modal-root [data-pd-mid]') && !document.querySelector('#ig-dock [data-pd-mid-back]') && !!document.getElementById('ig-canvas'), 5000);
  const seeIt = async () => { if (!(await click('#ig-dock .pd-dossier [data-pd-nd-jw]'))) return null; return waitFor(page, () => { const p = document.querySelector('#modal-root [data-pd-mid] .ag-panel'); return p && !!p.querySelector('.ag-p-acts [data-ag-act]'); }, 8000); };
  try {
    check('0 the contract is staged', !!(put && put.ok), JSON.stringify(put).slice(0, 160));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await click('#li-go');
    await waitFor(page, id => window.state && Array.isArray(state.contracts) && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });
    const up = await open();
    check('0a the Dossier beside the paper carries Jambo\'s work and Key terms\' one line', !!up);

    /* ===== 1. See it brings the piece to the middle ===== */
    console.log('\n1 · See it: the piece comes to the middle');
    const viewBefore = await page.evaluate(() => state.view + ':' + hbFace());
    const p1 = up ? await seeIt() : null;
    const m1 = await page.evaluate(MID);
    check('1a a page stands in the middle', !!p1 && m1.up && /^jw:/.test(m1.key || ''), JSON.stringify(m1));
    check('1b the reader never left: the same view and face (the paper\'s), the paper still held', m1.up && m1.view === viewBefore && /:paper$/.test(m1.view) && m1.paperHeld, JSON.stringify({ before: viewBefore, now: m1.view }));
    check('1c the Dossier stays in sight and pressable beside it; the page ends at its edge', m1.dockShown && m1.right <= m1.dockLeft + 1 && m1.w >= 480, JSON.stringify(m1));
    check('1d "‹ Paper" leads the chips under the Dossier, and is pressable', !!(m1.back && m1.back.first && m1.back.text === '‹ Paper' && m1.back.hit), JSON.stringify(m1.back));
    check('1e the crumb is the row\'s own words: Paper › Jambo\'s work · New paper', /* RE-POINTED 24 Oct 2026 (Round 3): "‹ Back to the paper" stands before the crumb */ /(^|paper)Paper › Jambo['’]s work · New paper$/.test(m1.crumb), m1.crumb);
    const row1 = await page.evaluate(() => { const r = document.querySelector('#ig-dock .pd-dossier .is-jw[data-pd-ds="jw-read"]'); return r ? { mid: r.classList.contains('is-mid'), say: (r.querySelector('small') || {}).textContent || '', pressed: r.querySelector('[data-pd-nd-jw]').getAttribute('aria-pressed') } : null; });
    /* RE-POINTED 29 Oct 2026 (the owner: the Arrival check stands under the Brief, no small grey line under a row):
       the row is marked and its Look pressed while the piece stands in the middle */
    check('1f the row is marked and its Look pressed while it shows in the middle', !!(row1 && row1.mid && row1.pressed === 'true'), JSON.stringify(row1));
    const body1 = await page.evaluate(() => { const p = document.querySelector('#modal-root [data-pd-mid] .ag-panel'); if (!p) return null;
      return { acts: [...p.querySelectorAll('[data-ag-act]')].map(b => b.getAttribute('data-ag-act')), deps: [...p.querySelectorAll('.ag-dep b')].map(b => b.textContent.trim()) }; });
    check('1g it carries the two standards to look at', !!body1 && body1.deps.includes('Payment terms') && body1.deps.includes('Liability cap'), JSON.stringify(body1));
    check('1h its acts: the obligations\' review is offered, Open Details is not (the Dossier is beside it)', !!body1 && body1.acts.includes('obs') && !body1.acts.includes('overview'), JSON.stringify(body1 && body1.acts));
    await page.screenshot({ path: path.join(OUT, 'jambos-work-1440x780.png') });

    /* ===== 2. the ways back ===== */
    console.log('\n2 · the ways back to the paper');
    /* each way back is asked only of a middle that stood (a build without it reports, never passes by doing nothing) */
    const was2a = !!p1; await click('#ig-dock .pd-dossier [data-pd-nd-jw]');
    check('2a See it pressed again brings the paper back', was2a && !!(await gone()));
    const was2b = !!(await seeIt()); await click('#ig-dock [data-pd-mid-back]');
    check('2b "‹ Paper" brings the paper back', was2b && !!(await gone()));
    const was2c = !!(await seeIt()); await page.keyboard.press('Escape');
    check('2c Esc brings the paper back', was2c && !!(await gone()));
    const was2d = !!(await seeIt()); const barBack = await page.evaluate(() => typeof deskGoBack === 'function' && deskGoBack());
    check('2d the bar\'s ‹ brings the paper back, and stays on the contract', was2d && barBack && !!(await gone()) && await page.evaluate(id => !!(intel.paper && intel.paper.id === id), ID));
    const was2e = !!(await seeIt()); await page.evaluate(() => { if (typeof hbSetFace === 'function') hbSetFace('board'); });
    check('2e another page in front puts the middle away (it belongs to the page that opened it)', was2e && !!(await waitFor(page, () => !document.querySelector('#modal-root [data-pd-mid]') && hbFace() === 'board', 5000)));
    await open();

    /* ===== 3. the obligations' review in the middle ===== */
    console.log('\n3 · the obligations found: the review comes to the middle');
    await seeIt();
    await click('#modal-root [data-pd-mid] [data-ag-act="obs"]');
    const r3 = await waitFor(page, () => { const p = document.querySelector('#modal-root [data-pd-mid]'); return p && p.querySelector('#obd') ? true : null; }, 10000);
    const m3 = await page.evaluate(MID);
    check('3a the review stands in the middle, not a pop-up', !!r3 && /^obs:/.test(m3.key || '') && !!m3.back, JSON.stringify(m3));
    check('3b the Dossier stays beside it; the page ends at its edge', m3.dockShown && m3.right <= m3.dockLeft + 1, JSON.stringify(m3));
    const n3 = await page.evaluate(() => document.querySelectorAll('#obd [data-ob-pick]').length);
    check('3c it lists the three obligations Jambo found', n3 === 3, String(n3));
    await pause(500); await page.screenshot({ path: path.join(OUT, 'obligations-1440x780.png') });
    await click('#ig-dock [data-pd-mid-back]');
    check('3d "‹ Paper" brings the paper back from the review', !!r3 && !!(await gone()));

    /* ===== 4. Key terms ===== */
    console.log('\n4 · Key terms: one line in the Dossier, the table in the middle');
    const line = await page.evaluate(() => ({ line: !!document.querySelector('#ig-dock [data-pd-kt-mid]'), table: !!document.querySelector('#ig-dock #pd-kt, #ig-dock .pd-kt-t'),
      when: ((document.querySelector('#ig-dock [data-pd-kt-when]') || {}).textContent || '').trim() }));
    check('4a the Dossier keeps Key terms as one line, no table under it', line.line && !line.table && /^\d+ terms?$/.test(line.when), JSON.stringify(line));
    await click('#ig-dock [data-pd-kt-mid] > summary');
    const k4 = await waitFor(page, () => { const p = document.querySelector('#modal-root [data-pd-mid] [data-pd-mid-kt] #pd-kt'); return p && p.querySelectorAll('tr[data-pd-og-row]').length ? true : null; }, 8000);
    const m4 = await page.evaluate(MID);
    check('4b the table stands in the middle beside the Dossier', !!k4 && /^kt:/.test(m4.key || '') && m4.dockShown && m4.right <= m4.dockLeft + 1, JSON.stringify(m4));
    const when4 = await page.evaluate(() => ((document.querySelector('#ig-dock [data-pd-kt-when]') || {}).textContent || '').trim());
    check('4c the line says "Showing in the middle"', when4 === 'Showing in the middle', when4);
    const rowKey = await page.evaluate(() => { const r = document.querySelector('[data-pd-mid-kt] tr[data-pd-og-kind="kt"] [data-pd-kt-change]'); return r ? r.getAttribute('data-pd-kt-change') : null; });
    await page.screenshot({ path: path.join(OUT, 'key-terms-1440x780.png') });
    if (rowKey) {
      await click(`[data-pd-mid-kt] [data-pd-kt-change="${rowKey}"]`);
      const box = await waitFor(page, k => { const b = document.querySelector(`[data-pd-mid-kt] tr[data-pd-og-row="${k}"].is-changing :is(input,select,textarea)`); return b ? { focus: document.activeElement === b, tag: b.tagName, type: b.type || '' } : null; }, 5000, rowKey);
      check('4d Change opens the line\'s box in the middle', !!box, JSON.stringify({ rowKey, box }));
      if (box && box.tag === 'INPUT' && /text|email/.test(box.type)) {
        await page.fill(`[data-pd-mid-kt] tr[data-pd-og-row="${rowKey}"] input`, 'Kisumu Freight Ltd');
        await click(`[data-pd-mid-kt] [data-pd-kt-done="${rowKey}"]`);
        const saved = await waitFor(page, k => { const r = document.querySelector(`[data-pd-mid-kt] tr[data-pd-og-row="${k}"]`); return r && !r.classList.contains('is-changing') && /Kisumu Freight Ltd/.test(r.textContent) ? true : null; }, 5000, rowKey);
        check('4e Done stores it and the table in the middle shows it', !!saved, rowKey);
      }
    } else check('4d a record line to change', false, 'no kt row with Change');
    await click('#ig-dock [data-pd-kt-mid] > summary');
    check('4f the line pressed again brings the paper back', !!k4 && !!(await gone()));

    /* ===== 5. ask Jambo for the paper ===== */
    console.log('\n5 · "paper" asked of Jambo');
    await click('#ig-dock [data-pd-kt-mid] > summary');
    const was5 = !!(await waitFor(page, () => !!document.querySelector('#modal-root [data-pd-mid]'), 5000));
    await page.evaluate(() => { if (typeof intelAsk === 'function') intelAsk('paper'); });
    check('5a "paper" brings the paper back', was5 && !!(await gone()));

    /* ===== 6. the owner's three screens ===== */
    console.log('\n6 · the owner\'s three screens');
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await open(); await pause(300);
      await seeIt(); await pause(300);
      const a = await page.evaluate(MID);
      check(`6 ${w}x${hh} Jambo's work in the middle, the Dossier beside it, nothing sideways`, a.up && a.dockShown && a.right <= a.dockLeft + 1 && !a.sideways, JSON.stringify(a));
      await page.screenshot({ path: path.join(OUT, `jambos-work-${w}x${hh}.png`) });
      await click('#modal-root [data-pd-mid] [data-ag-act="obs"]');
      await waitFor(page, () => !!document.querySelector('#modal-root [data-pd-mid] #obd'), 8000); await pause(500);
      const o = await page.evaluate(MID);
      check(`6 ${w}x${hh} the obligations review in the middle, nothing sideways`, o.up && /^obs:/.test(o.key || '') && o.dockShown && !o.sideways, JSON.stringify(o));
      await page.screenshot({ path: path.join(OUT, `obligations-${w}x${hh}.png`) });
      await click('#ig-dock [data-pd-mid-back]'); await gone();
      await click('#ig-dock [data-pd-kt-mid] > summary');
      await waitFor(page, () => !!document.querySelector('[data-pd-mid-kt] #pd-kt tr'), 5000); await pause(200);
      const b = await page.evaluate(MID);
      check(`6 ${w}x${hh} Key terms in the middle, nothing sideways`, b.up && b.dockShown && !b.sideways, JSON.stringify(b));
      await page.screenshot({ path: path.join(OUT, `key-terms-${w}x${hh}.png`) });
      await click('#ig-dock [data-pd-mid-back]'); await gone();
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
