/* Chromium verification: THE SEND LEADS WHEN SENDING IS THE NEXT STEP
   ============================================================
   Phase 1, item 5 of the best-in-class plan ("Create lands on Send"), the
   owner's pick of 13 Oct 2026: fill Share, outline Draft new agreement.

   MEASURED BEFORE: a first contract, made through the real New agreement
   screen, landed in its room with More · Share · Draft new agreement and NO
   filled act at all. The ladder's rung for a fresh draft ("run the checks")
   draws no button by the owner's 22 Aug ruling, and the send lost its own slot
   on 23 Sep ("the share button already does this"). The one thing the
   contract was waiting for was the one act nothing pointed at.

   WHAT THIS DRIVES, where a person looks:
     A  a fresh draft, made through the real screens: Share is the room's ONE
        filled act; Draft new agreement and More are outlines.
     B  the same draft once its readings have run (the ladder's "Send for
        review" rung): Share still leads, "Send for review" stands beside it
        as an outline — one filled act, never two.
     C  the phone, on the same draft: the bar's one button is Share, and it
        opens the phone's own send sheet with their address already in it.
     D  a contract under review whose next step is naming signers: that act
        keeps the fill and Share is an outline.
     E  the Negotiate page, which passes its own primary: Share is never
        filled there.
     F  after the draft is really sent: the next step is theirs, not a send,
        and Share steps back to an outline.

   Run: node test/chromium/send-leads-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHatiWithMail, seedWorkspace } = require('../helpers');

const OUT = process.env.SEND_LEADS_SHOTS || path.join(__dirname, 'shots', 'send-leads');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};

/* A WAIT ASKS FOR THE STATE, BOUNDED. */
async function until(page, fn, ms = 15000, arg) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    let v = null;
    try { v = await page.evaluate(fn, arg); } catch (_) { v = null; }
    if (v) return v;
    await page.waitForTimeout(100);
  }
  return null;
}

/* The room head's acts row as painted: each visible button, and whether it
   wears a FILL (a background that is neither white nor see-through). */
const ACTS = () => {
  const row = document.querySelector('#ws-head .room-acts') || document.querySelector('.room-acts');
  if (!row) return null;
  const filled = b => { const bg = getComputedStyle(b).backgroundColor;
    return !/^rgba?\(255, 255, 255(, 1)?\)$/.test(bg) && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg); };
  return [...row.querySelectorAll('button')].filter(b => b.getClientRects().length)
    .map(b => ({ id: b.id, text: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 30), filled: filled(b) }));
};
/* THE ROW AS IT SETTLES: a new room paints more than once while its reading
   lands, so the row is read once it has held still for three polls (bounded). */
async function settledActs(page, ms = 10000) {
  const end = Date.now() + ms; let last = null, same = 0, v = null;
  while (Date.now() < end) {
    try { v = await page.evaluate(ACTS); } catch (_) { v = null; }
    const k = JSON.stringify(v);
    if (v && k === last) { if (++same >= 3) return v; } else { same = 0; last = k; }
    await page.waitForTimeout(250);
  }
  return v;
}
const one = (acts, id) => (acts || []).find(a => a.id === id) || null;
const filledIds = acts => (acts || []).filter(a => a.filled).map(a => a.id || a.text);

async function login(page, base) {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3, null, { timeout: 20000 });
  /* the role lands a moment after the list: until it does, the person reads
     as a viewer and every door to create or send refuses */
  await until(page, () => typeof canEdit === 'function' && canEdit(), 10000);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  /* EMAIL ON: F asks what a send that really goes does to the head. */
  const h = await startHatiWithMail();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  let draftId = null;
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    page.on('pageerror', e => errors.push('desk: ' + e.message));
    await login(page, h.base);

    /* ---- A: a first draft, through the real New agreement screen ---- */
    await page.evaluate(() => { if (window.openNewAgreement) openNewAgreement({}); });
    const na = await until(page, () => !!document.getElementById('na-q'));
    if (na) {
      await page.fill('#na-q', 'NDA');
      /* the search filters as it is typed: press only once the NDA leads the list */
      const pick = await until(page, () => { const b = document.querySelector('.na-pick'); return !!(b && b.getClientRects().length && /NDA/.test(b.textContent)); }, 8000);
      if (pick) await page.$eval('.na-pick', b => b.click());
      await until(page, () => !!document.getElementById('wz-counterparty'), 10000);
      await page.fill('#wz-counterparty', 'Nandi Traders Ltd').catch(() => {});
      await page.fill('#wz-cpemail', 'ola@nandi.co.ke').catch(() => {});
      await page.evaluate(() => { const s = document.getElementById('wz-side'); if (s && s.options.length > 1) { s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
      await page.$eval('#na-create', b => b.click()).catch(() => {});
      draftId = await until(page, () => (state.view === 'workspace' && state.activeId) ? state.activeId : null, 20000);
    }
    check('A0 Create lands in the new draft\'s room', !!draftId, draftId);
    if (draftId) {
      /* whatever the details hand-over still owes, it is not this check's
         question: close it the way a person would and read the head */
      await page.keyboard.press('Escape').catch(() => {});
      await until(page, () => !document.getElementById('cd-form'), 4000);
      const acts = await settledActs(page);
      const share = one(acts, 'ws-share'), neu = one(acts, 'ws-new');
      check('A1 Share is filled on the fresh draft', !!(share && share.filled), acts);
      check('A2 and it is the head\'s ONE filled act', filledIds(acts).length === 1 && filledIds(acts)[0] === 'ws-share', filledIds(acts));
      check('A3 Draft new agreement is an outline', !!(neu && !neu.filled), neu);
      await page.screenshot({ path: path.join(OUT, 'a-fresh-draft.png') });

      /* ---- B: the readings have run, so the ladder's rung is "Send for review" ---- */
      await page.evaluate(id => { const c = getContract(id); c.scan = { at: new Date().toISOString(), findings: [] }; renderWorkspace(); }, draftId);
      const actsB = await settledActs(page);
      const nx = one(actsB, 'ws-next-action');
      check('B1 the ladder offers its own button here', !!nx, actsB);
      check('B2 Share still leads, and that button stands beside it as an outline', !!(nx && !nx.filled && one(actsB, 'ws-share') && one(actsB, 'ws-share').filled), actsB);
      check('B3 one filled act, never two', filledIds(actsB).length === 1, filledIds(actsB));
      await page.screenshot({ path: path.join(OUT, 'b-review-rung.png') });
      /* put the record back as the server holds it, for the phone and F */
      await page.evaluate(id => { const c = getContract(id); delete c.scan; renderWorkspace(); }, draftId);
    }

    /* ---- C: the phone, on the same draft ---- */
    if (draftId) {
      const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
      phone.on('pageerror', e => errors.push('phone: ' + e.message));
      await login(phone, h.base);
      /* ASK FOR THE STATE: on a busy CI runner the phone's first screen can
         paint after our step and take the room away again (13 Oct 2026, run
         38450813513: no action bar within 10 s; 15/15 here). So the wait
         itself goes back to the draft while no bar is drawn, at most once a
         second, and only once the draft is in the phone's list. */
      const bar = await until(phone, id => {
        const b = document.querySelector('.m-actionbar button');
        if (b) return { na: b.getAttribute('data-m-na'), text: b.textContent.trim(), primary: b.classList.contains('m-btn-primary') };
        const now = Date.now();
        if (window.mGo && (state.contracts || []).some(c => c.id === id) && !(window.__slWent > now - 1000)) {
          window.__slWent = now; state.activeId = id; mGo('contract'); }
        return null;
      }, 15000, draftId);
      check('C1 the phone\'s one button is the send', !!(bar && bar.na === 'share' && bar.primary), bar || 'no action bar drawn');
      if (bar && bar.na === 'share') {
        await phone.$eval('.m-actionbar button[data-m-na="share"]', b => b.click());
        const sheet = await until(phone, () => { const e = document.getElementById('m-share-email'); return e ? (e.value || '(empty)') : null; }, 8000);
        check('C2 and it opens the phone\'s send sheet, their address in it', sheet === 'ola@nandi.co.ke', sheet);
      } else check('C2 and it opens the phone\'s send sheet, their address in it', false, 'no send button to press');
      await phone.screenshot({ path: path.join(OUT, 'c-phone.png') });
      await phone.close();
    }

    /* ---- D: a contract whose next step is naming signers ---- */
    const signersId = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status === 'Under Review' && window.wsNextAction && (wsNextAction(x) || {}).kind === 'add-signers');
      return c ? c.id : null;
    });
    if (signersId) {
      await page.evaluate(id => { openWorkspace(id); }, signersId);
      await until(page, id => state.view === 'workspace' && state.activeId === id, 8000, signersId);
      const actsD = await settledActs(page);
      const nxD = one(actsD, 'ws-next-action'), shD = one(actsD, 'ws-share');
      check('D1 naming the signers keeps the fill', !!(nxD && nxD.filled), actsD);
      check('D2 and Share is an outline there', !!(shD && !shD.filled), shD);
    } else check('D1 naming the signers keeps the fill', false, 'no seeded contract waits on signers');

    /* ---- E: the Negotiate page passes its own primary ---- */
    const negoId = signersId || draftId;
    if (negoId && await page.evaluate(() => typeof openRedlineWorkbench === 'function')) {
      await page.evaluate(id => openRedlineWorkbench(id), negoId);
      const sh = await until(page, () => { const b = document.getElementById('ws-share');
        if (!b || !b.getClientRects().length || state.view !== 'redline') return null;
        const bg = getComputedStyle(b).backgroundColor; return { bg, marked: b.hasAttribute('data-send-lead') }; }, 10000);
      check('E1 Share on the Negotiate page is never filled from the room\'s reading', !!(sh && /255, 255, 255/.test(sh.bg) && !sh.marked), sh);
    } else check('E1 Share on the Negotiate page is never filled from the room\'s reading', false, 'no workbench to open');

    /* ---- F: send the draft for real; the next step is then theirs ---- */
    if (draftId) {
      await page.evaluate(id => { openWorkspace(id); }, draftId);
      await until(page, id => state.view === 'workspace' && state.activeId === id, 8000, draftId);
      await page.keyboard.press('Escape').catch(() => {});
      const opened = await until(page, () => { const b = document.getElementById('ws-share'); if (!b) return null; b.click(); return true; }, 6000)
        && await until(page, () => !!document.getElementById('share-send'), 10000);
      if (opened) {
        await page.$eval('[data-share-purpose="negotiate"]', b => b.click()).catch(() => {});
        const em = await page.evaluate(() => (document.getElementById('sh-email') || {}).value || '');
        if (!em) await page.fill('#sh-email', 'ola@nandi.co.ke').catch(() => {});
        await until(page, () => { const b = document.getElementById('share-send'); return b && !b.disabled; }, 6000);
        await page.$eval('#share-send', b => b.click()).catch(() => {});
        const ok = await until(page, () => ['#cf-ok', '#confirm-ok'].map(s => document.querySelector(s)).find(e => e && e.getClientRects().length) ? true : (/sent/i.test((document.getElementById('sh-result') || {}).textContent || '') ? 'done' : null), 8000);
        if (ok === true) await page.evaluate(() => { const b = ['#cf-ok', '#confirm-ok'].map(s => document.querySelector(s)).find(e => e && e.getClientRects().length); if (b) b.click(); });
        const sent = await until(page, () => /sent/i.test((document.getElementById('sh-result') || {}).textContent || '') ? (document.getElementById('sh-result').textContent.trim().slice(0, 80)) : null, 20000);
        check('F0 the draft really went out', !!sent, sent);
        await page.keyboard.press('Escape').catch(() => {});
        const after = await until(page, id => { const c = getContract(id); return c && c.status !== 'Draft' ? c.status : null; }, 8000, draftId);
        const actsF = await settledActs(page);
        const shF = one(actsF, 'ws-share');
        check('F1 once sent, Share steps back to an outline', !!(after && shF && !shF.filled), { after, share: shF });
        await page.screenshot({ path: path.join(OUT, 'f-after-send.png') });
      } else check('F0 the draft really went out', false, 'the Send screen did not open');
    }
    check('G no page errors on either seat', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('X the walk ran to the end', false, e.message.split('\n')[0]);
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
