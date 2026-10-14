/* ============================================================
   BEFORE YOU SIGN, BESIDE THE PAPER — stage 5 of the one-page Home plan (the
   owner picked "Checklist" by name on 14 Oct 2026, with all three
   recommendations: the Negotiate page folds into Home; the room's Details,
   Signing, Obligations and History tabs go; once both have signed the face
   stays as the receipt)
   ============================================================
   Driven in a real browser:
     1  the checklist's signing door lands on Home with Jambo's Before you
        sign face, the room never drawn on the way; the paper beside it is the
        signing copy, said by a chip; no Clean | Redline toggle over it
     2  the face is the Signing column: the before-you-sign list, the Sign
        button at its foot; its pill counts what the list holds
     3  readied, the Sign button signs: the pad with its intent line, and the
        signature on the server's record; the face stays
     4  × goes back to the conversation and the paper to the working copy
     5  a signed contract: the receipt — no Sign foot, "What starts now", the
        seal's acts on top
     6  the room keeps Overview and Where we are; its old Obligations and
        History doors open the Board's views; an email link naming the Signing
        tab opens the face
     7  the paper's line carries Notes · Share · ⋯; ⋯ opens the contract's
        menu and a second press shuts it
     8  the owner's three screens: the face fits — head, × and Sign in sight,
        nothing sideways — and the panel keeps its width when it opens
     9  Svenska; the phone keeps the room's own Signing tab
   AT THE PARENT every claim FAILS: there is no Before you sign face there.
     node test/chromium/sign-beside-the-paper-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'sign-beside-the-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
/* the owner's three screens (CLAUDE.md: two laptops and an iPad Pro 12.9") */
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
/* which screen stood in the window, frame by frame, until the face is up */
const WATCH = () => { window._frames = []; let n = 0;
  const tick = () => { const s = document.getElementById('pd-signface') ? 'face' : ('other:' + state.view);
    window._frames.push(s); if (s !== 'face' && n++ < 2000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); };
const FACE = () => {
  const f = document.getElementById('pd-signface');
  const root = f && f.querySelector('.pd-sf');
  return { up: !!f, view: state.view, for: root ? root.getAttribute('data-pd-sf') : null, closed: !!(root && root.classList.contains('is-closed')),
    title: f ? ((f.querySelector('h3') || {}).textContent || '').trim() : '',
    pill: f ? ((f.querySelector('[data-pd-sf-pill]') || {}).innerText || '').trim() : '',
    btn: ((document.getElementById('sign-btn') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    btnInFoot: !!document.querySelector('#pd-signface .pd-sf-foot #sign-btn'),
    list: !!document.querySelector('#pd-signface #sign-check'),
    copy: !!document.querySelector('#ig-paper .pg-sheet.pg-sign'),
    chip: ((document.querySelector('#ig-strip .ig-copy-chip') || {}).textContent || '').trim(),
    toggle: !!document.querySelector('#ig-strip [data-ig-red]') };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const login = async () => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0 && window.currentUser && currentUser(), null, { timeout: 15000 });
    await pause(800);
  };
  try {
    await login();
    const has = await page.evaluate(() => typeof window.pdSignOpen === 'function');
    check('0 the face exists (pdSignOpen)', has);

    /* ===== 1. THE CHECKLIST'S SIGNING DOOR ===== */
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(WATCH);
    await page.evaluate(() => needsYouGo('sign', 'MK-A2'));
    const up1 = await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A2"]') && !!document.querySelector('#ig-paper .pg-sheet.pg-sign'), 10000);
    const f1 = await page.evaluate(FACE);
    const frames = await page.evaluate(() => [...new Set(window._frames || [])]);
    check('1a the checklist\'s signing door lands on Home with the face on that contract', up1 && f1.view === 'dashboard' && f1.for === 'MK-A2', JSON.stringify(f1));
    check('1b the room is never drawn on the way', !frames.includes('other:workspace'), JSON.stringify(frames));
    check('1c the paper beside it is the signing copy, and the line says so', f1.copy && f1.chip === 'Signing copy', JSON.stringify({ copy: f1.copy, chip: f1.chip }));
    check('1d no Clean | Redline toggle over the signing copy', !f1.toggle);
    await page.screenshot({ path: path.join(OUT, '1-face.png') });

    /* ===== 2. THE SIGNING COLUMN ===== */
    const holds = await page.evaluate(() => { try { return (signReadiness(getContract('MK-A2')).holds || []).length; } catch (_) { return null; } });
    check('2a the before-you-sign list is in the face, the Sign button at its foot', f1.list && f1.btnInFoot, JSON.stringify(f1));
    check('2b the pill counts what the list holds — the list the Sign button reads', holds > 0 && f1.pill === `${holds} to settle`, `${f1.pill} · holds ${holds}`);

    /* ===== 3. READIED, IT SIGNS ===== */
    await page.evaluate(async () => {
      const c = getContract('MK-A2'); await ensureFull(c); const me = currentUser();
      c.signerPlan = [{ id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false },
        { id: 'sg_cp', party: 'counterparty', name: 'Ola Nordmann', email: 'ola@nandi.co.ke', order: 2, signed: false }];
      c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Stage', truncated: false, data: {} };
      if (window.briefMarkRead) briefMarkRead(c);
      if (window.contractBoxesOpen && window.contractBlankSet) contractBoxesOpen(c).forEach(b => contractBlankSet(c, b.key, b.type === 'date' ? '2026-10-01' : 'Stated', { quiet: true, hold: true }));
      const hash = playbookHashOf(playbookText(c));
      c.playbook = { label: 'Default', wordingHash: hash, verdicts: [] }; c.obligationsReadHash = hash; c.compliance = {};
      persist(c); await flushSaves(); renderSignButton(c);
    });
    const ready = await waitFor(page, () => /^Sign as /.test(((document.getElementById('sign-btn') || {}).textContent || '').trim()), 6000);
    check('3a readied, the face\'s button says Sign as you', ready, await page.evaluate(() => ((document.getElementById('sign-btn') || {}).textContent || '').trim()));
    if (ready) {
      await page.click('#sign-btn');
      const pad = await waitFor(page, () => !!document.getElementById('sig-intent'), 5000);
      check('3b the pad opens with its intent line', pad);
      if (pad) {
        await page.click('[data-sig-tab="type"]').catch(() => {}); await page.fill('#sig-typed', 'Amina Otieno').catch(() => {});
        await page.click('#sig-intent').catch(() => {}); await page.click('#sig-adopt-go').catch(() => {});
        await waitFor(page, () => !document.getElementById('sig-intent'), 6000);
      }
      let stored = 0;
      for (let i = 0; i < 40 && !stored; i++) { const rec = await W.admin.json('/api/contracts/MK-A2'); stored = (rec.signatures || []).length; if (!stored) await pause(150); }
      const f3 = await page.evaluate(FACE);
      check('3c the signature is on the server\'s record, and the face stays', stored >= 1 && f3.up && f3.for === 'MK-A2', JSON.stringify({ stored, up: f3.up }));
      await page.screenshot({ path: path.join(OUT, '3-signed-mine.png') });
    } else { check('3b the pad opens with its intent line', false, 'not ready'); check('3c the signature is on the server\'s record, and the face stays', false, 'not ready'); }

    /* ===== 4. × ===== */
    if (await page.$('#pd-signface [data-pd-sf-close]')) await page.click('#pd-signface [data-pd-sf-close]');
    const gone = await waitFor(page, () => !document.getElementById('pd-signface') && !!document.getElementById('igd-input'), 5000);
    const f4 = await page.evaluate(FACE);
    check('4 × goes back to the conversation and the paper to the working copy', gone && !f4.copy && !f4.chip, JSON.stringify(f4));

    /* ===== 5. THE RECEIPT ===== */
    await page.evaluate(() => { if (window.pdSignOpen) pdSignOpen('MK-A1'); });
    await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A1"]') && !!document.querySelector('#sign-seal-acts button'), 10000);
    const f5 = await page.evaluate(() => ({ closed: !!document.querySelector('#pd-signface .pd-sf.is-closed'), foot: !!document.querySelector('#pd-signface .pd-sf-foot'),
      title: ((document.querySelector('#pd-signface h3') || {}).textContent || '').trim(),
      next: ((document.querySelector('#pd-signface .pd-sf-next h6') || {}).textContent || '').trim(),
      seal: [...document.querySelectorAll('#pd-signface #sign-seal-acts button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean) }));
    check('5a signed, the face is the receipt: no Sign foot, the title says Signed', f5.closed && !f5.foot && f5.title === 'Signed', JSON.stringify(f5));
    check('5b "What starts now", and the seal\'s acts on top', f5.next === 'What starts now' && f5.seal.length >= 1, JSON.stringify(f5));
    await page.screenshot({ path: path.join(OUT, '5-receipt.png') });

    /* ===== 6. THE ROOM, AND THE OLD DOORS ===== */
    await page.evaluate(() => openWorkspace('MK-A2'));
    await waitFor(page, () => state.view === 'workspace' && !!document.querySelector('.room-tabrow [data-ws-tab]'), 8000);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.room-tabrow [data-ws-tab]')].map(b => b.getAttribute('data-ws-tab')));
    check('6a the room keeps Overview and Where we are', JSON.stringify(tabs) === JSON.stringify(['terms', 'stands']), JSON.stringify(tabs));
    await page.evaluate(() => roomGoTab(getContract('MK-A2'), 'oblig'));
    check('6b its old Obligations door opens the Board\'s Obligations view', await waitFor(page, () => state.view === 'dashboard' && !!document.querySelector('#hb-cv-body[data-hb-cv="oblig"]'), 8000));
    await page.evaluate(() => { openWorkspace('MK-A2'); });
    await waitFor(page, () => state.view === 'workspace', 6000);
    await page.evaluate(() => roomGoTab(getContract('MK-A2'), 'history'));
    check('6c its old History door opens the Board\'s History view', await waitFor(page, () => state.view === 'dashboard' && !!document.querySelector('#hb-cv-body[data-hb-cv="hist"]'), 8000));
    /* a real load, as a link from the mail is (a goto that only changes the hash is not one) */
    await page.evaluate(() => { location.hash = '#contract=MK-A2&tab=sign'; });
    await page.reload({ waitUntil: 'networkidle' });
    const link = await waitFor(page, () => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="MK-A2"]') && state.view === 'dashboard', 15000);
    check('6d an email link naming the Signing tab opens the face', link, JSON.stringify(await page.evaluate(() => ({ view: state && state.view, face: window.hbFace && hbFace(), paper: intel && intel.paper && intel.paper.id, sign: window.pdSignFor && pdSignFor(), tab: window.pdTab && pdTab(), hash: location.hash }))));

    /* ===== 7. THE PAPER'S LINE ===== */
    const acts = await page.evaluate(() => ({ chat: !!document.querySelector('#ig-strip .ig-acts #hdr-chat'), share: !!document.querySelector('#ig-strip .ig-acts #ws-share'), more: !!document.querySelector('#ig-strip .ig-acts #ws-more') }));
    check('7a the paper\'s line carries Notes · Share · ⋯', acts.chat && acts.share && acts.more, JSON.stringify(acts));
    if (acts.more) {
      await page.click('#ig-strip #ws-more');
      const m1 = await waitFor(page, () => { const m = document.getElementById('ws-more-menu'); return !!m && !m.classList.contains('hidden') && m.querySelectorAll('button').length > 2; }, 3000);
      await page.click('#ig-strip #ws-more');
      const m2 = await waitFor(page, () => { const m = document.getElementById('ws-more-menu'); return !m || m.classList.contains('hidden'); }, 3000);
      check('7b ⋯ opens the contract\'s menu, and a second press shuts it', m1 && m2, JSON.stringify({ m1, m2 }));
    } else check('7b ⋯ opens the contract\'s menu, and a second press shuts it', false, 'no ⋯');

    /* ===== 8. THE OWNER'S THREE SCREENS ===== */
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh }); await pause(300);
      await page.evaluate(() => { if (window.pdSignClose && document.getElementById('pd-signface')) pdSignClose(); });
      await waitFor(page, () => !document.getElementById('pd-signface') && !!document.getElementById('ig-dock'), 4000);
      const before = await page.evaluate(() => { const d = document.getElementById('ig-dock'); return d ? Math.round(d.getBoundingClientRect().width) : null; });
      await page.evaluate(() => { if (window.pdSignOpen) pdSignOpen('MK-A2'); });
      await waitFor(page, () => !!document.querySelector('#pd-signface #sign-btn'), 6000);
      await pause(300);
      const m = await page.evaluate(() => {
        const f = document.getElementById('pd-signface');
        if (!f) return { dock: Math.round(document.getElementById('ig-dock') ? document.getElementById('ig-dock').getBoundingClientRect().width : -1), up: false };
        const fr = f.getBoundingClientRect();
        const r = s => { const e = f.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const head = r('.pd-sf-h'), x = r('[data-pd-sf-close]'), btn = r('#sign-btn');
        const body = f.querySelector('.pd-sf-body');
        return { dock: Math.round(document.getElementById('ig-dock').getBoundingClientRect().width),
          headIn: !!head && head.top >= fr.top - 1 && head.bottom <= fr.bottom, xIn: !!x && x.right <= fr.right + 1,
          btnIn: !!btn && btn.bottom <= Math.min(fr.bottom, innerHeight) + 1 && btn.top >= fr.top,
          sideways: body ? body.scrollWidth - body.clientWidth : null, docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      check(`8 ${w}×${hh}: the face fits — head, × and Sign in sight, nothing sideways`, m.headIn && m.xIn && m.btnIn && m.sideways <= 1 && m.docW <= 0, JSON.stringify(m));
      check(`8 ${w}×${hh}: the panel keeps its width when the face opens`, before === m.dock, `${before} → ${m.dock}`);
      await page.screenshot({ path: path.join(OUT, `8-${w}x${hh}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);

    /* ===== 9. SVENSKA, AND THE PHONE ===== */
    const sv = await page.$('.lang-btn[data-lang="sv"]'); if (sv) { await sv.click(); await pause(800); }
    await page.evaluate(() => { if (!document.getElementById('pd-signface') && window.pdSignOpen) pdSignOpen('MK-A2'); });
    await waitFor(page, () => !!document.querySelector('#pd-signface h3'), 5000);
    const s9 = await page.evaluate(() => ({ title: ((document.querySelector('#pd-signface h3') || {}).textContent || '').trim(), chip: ((document.querySelector('#ig-strip .ig-copy-chip') || {}).textContent || '').trim() }));
    check('9a Svenska: the face and the chip speak the reader\'s language', !!sv && s9.title === 'Innan du signerar' && !!s9.chip && s9.chip !== 'Signing copy', JSON.stringify(s9));
    await page.screenshot({ path: path.join(OUT, '9-svenska.png') });
    const en2 = await page.$('.lang-btn[data-lang="en"]'); if (en2) { await en2.click(); await pause(500); }
    await page.setViewportSize({ width: 390, height: 844 }); await pause(600);
    await page.evaluate(() => { openWorkspace('MK-A2'); roomGoTab(getContract('MK-A2'), 'sign'); });
    await pause(1200);
    const ph = await page.evaluate(() => ({ view: state.view, face: !!document.getElementById('pd-signface') }));
    check('9b the phone keeps the room\'s own Signing tab', ph.view === 'workspace' && !ph.face, JSON.stringify(ph));

    check('10 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + (e && e.stack || e)); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
