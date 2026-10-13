/* Chromium verification: THEIR CONTACT, ASKED BESIDE THEIR EMAIL
   ============================================================
   Phase 1, item 6 of the best-in-class plan ("Send is one press"), the
   owner's pick of 13 Oct 2026: ask for the contact's name at creation so the
   Send screen has nothing left to type.

   MEASURED BEFORE (first-contract-clock-verify): the creation form asked for
   their email but never the person, so the name was typed twice more in the
   same sitting — in the Send screen's name box, and again for the other
   side's signer on "who signs".

   WHAT THIS DRIVES, where a person looks:
     A  New agreement: "Their contact" stands right before "Their email";
        after Create, the Send screen opens with their name AND address, and
        "who signs" opens with the other signer named — nothing to type.
     B  the upload form: the box is there, under the "Received from" / email
        pair, and the filed contract's Send screen opens with the name.
     C  the request form: the box sits in one row with who they are and their
        address; the request carries it, and drafting from the request opens
        with the name already in its box.

   Run: node test/chromium/contact-at-creation-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHatiWithMail, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const OUT = process.env.CONTACT_SHOTS || path.join(__dirname, 'shots', 'contact-at-creation');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const NAME = 'Ola Nordmann', MAIL = 'ola@nandi.co.ke';
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
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
/* The Send screen for the contract on screen: open it, pick a purpose, and
   read what its recipient boxes opened with. */
async function sendScreenOpensWith(page, purpose) {
  const opened = await until(page, () => { const b = document.getElementById('ws-share'); if (!b) return null; b.click(); return true; }, 8000)
    && await until(page, () => !!document.getElementById('share-send'), 10000);
  if (!opened) return null;
  await page.click(`[data-share-purpose="${purpose}"]`).catch(() => {});
  await until(page, p => { const b = document.querySelector(`[data-share-purpose="${p}"]`); return b && b.getAttribute('aria-pressed') === 'true'; }, 5000, purpose);
  const ch = await page.evaluate(() => { const t = document.querySelector('[data-share-ch="email"]'); return t ? (t.getAttribute('aria-selected') || t.className) : ''; });
  if (!/true|on|active/.test(String(ch))) await page.click('[data-share-ch="email"]').catch(() => {});
  return page.evaluate(() => ({ name: (document.getElementById('sh-name') || {}).value || '', email: (document.getElementById('sh-email') || {}).value || '' }));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHatiWithMail();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3, null, { timeout: 20000 });
    /* the role lands a moment after the list; until then every door refuses */
    await until(page, () => typeof canEdit === 'function' && canEdit(), 10000);

    /* ---- A: New agreement ---- */
    await page.evaluate(() => openNewAgreement({}));
    await until(page, () => !!document.getElementById('na-q'));
    await page.fill('#na-q', 'NDA');
    const pick = await until(page, () => { const b = document.querySelector('.na-pick'); return !!(b && b.getClientRects().length && /NDA/.test(b.textContent)); }, 8000);
    if (pick) await page.$eval('.na-pick', b => b.click());
    await until(page, () => !!document.getElementById('wz-counterparty'), 10000);
    const boxes = await page.evaluate(() => {
      const n = document.getElementById('wz-cpname'), e = document.getElementById('wz-cpemail');
      const lab = el => el ? (el.closest('label') || {}).textContent.replace(/\s+/g, ' ').trim() : null;
      return { name: !!(n && n.getClientRects().length), label: lab(n), before: !!(n && e && (n.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)) };
    });
    check('A1 New agreement asks "Their contact", right before "Their email"', boxes.name && /Their contact/.test(boxes.label || '') && boxes.before, boxes);
    await page.screenshot({ path: path.join(OUT, 'a-new-agreement.png') });
    await page.fill('#wz-counterparty', 'Nandi Traders Ltd').catch(() => {});
    await page.fill('#wz-cpname', NAME).catch(() => {});
    await page.fill('#wz-cpemail', MAIL).catch(() => {});
    await page.$eval('#na-create', b => b.click()).catch(() => {});
    const id = await until(page, () => (state.view === 'workspace' && state.activeId) ? state.activeId : null, 20000);
    check('A2 Create files the contract', !!id, id);
    if (id) {
      const book = await page.evaluate(i => { const m = window.contactMain ? contactMain(getContract(i)) : null; return m ? { name: m.name, email: m.email } : null; }, id);
      check('A3 the name is in the address book with the address', !!(book && book.name === NAME && book.email === MAIL), book);
      await page.keyboard.press('Escape').catch(() => {});
      const pre = await sendScreenOpensWith(page, 'sign');
      check('A4 the Send screen opens with their name and address — nothing to type', !!(pre && pre.name === NAME && pre.email === MAIL), pre);
      /* who signs: the route editor, as the Send screen offers it */
      const ed = await until(page, () => { const b = document.getElementById('share-signer-edit'); if (!b || !b.getClientRects().length) return null; b.click(); return true; }, 6000)
        && await until(page, () => !!document.getElementById('sp-save'), 8000);
      if (ed) {
        const route = await page.evaluate(n => {
          const win = document.getElementById('sr-win') || document.querySelector('#modal-root');
          const empties = [...(win || document).querySelectorAll('[data-sp-f="name"]')].filter(i => i.getClientRects().length && !String(i.value || '').trim()).length;
          return { named: !!(win && win.textContent.includes(n)), empties };
        }, NAME);
        check('A5 "who signs" opens with their signer named — no name left to type', route.named && route.empties === 0, route);
        await page.screenshot({ path: path.join(OUT, 'a-who-signs.png') });
      } else check('A5 "who signs" opens with their signer named — no name left to type', false, 'the route editor did not open');
      await page.keyboard.press('Escape').catch(() => {}); await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    }

    /* ---- B: the upload form ---- */
    const tmpDocx = path.join(OUT, 'Nandi_NDA.docx');
    fs.writeFileSync(tmpDocx, Buffer.from(mkDocx([
      para('MUTUAL NON-DISCLOSURE AGREEMENT'),
      para('This Agreement is made between Nandi Traders Ltd and the Client.'),
      para('1. Confidential Information. Each party keeps the other\'s information confidential.'),
    ].join(''))));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} openUploadModal(); });
    await until(page, () => !!document.getElementById('up-file'), 8000);
    await page.setInputFiles('#up-file', tmpDocx);
    const step2 = await until(page, () => { const s2 = document.getElementById('up-step-2'); return !!(s2 && !s2.classList.contains('hidden') && document.getElementById('up-go')); }, 20000);
    const upBox = await page.evaluate(() => { const n = document.getElementById('up-cpname'), e = document.getElementById('up-cpemail'), cp = document.getElementById('up-cp');
      const top = el => el ? Math.round(el.getBoundingClientRect().top) : null;
      return { shown: !!(n && n.getClientRects().length), afterEmail: !!(n && e && (e.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)), pairLevel: top(cp) === top(e) }; });
    check('B1 the upload form asks their contact, and "Received from" stays level with their email', !!(step2 && upBox.shown && upBox.afterEmail && upBox.pairLevel), upBox);
    await page.screenshot({ path: path.join(OUT, 'b-upload.png') });
    if (step2 && upBox.shown) {
      if (!(await page.evaluate(() => document.getElementById('up-cp').value))) await page.fill('#up-cp', 'Nandi Traders Ltd');
      await page.fill('#up-cpemail', MAIL);
      await page.fill('#up-cpname', NAME);
      const before = await page.evaluate(() => state.contracts.length);
      await page.$eval('#up-go', b => b.click());
      const upId = await until(page, n => state.contracts.length > n && state.contracts[0].source === 'upload' ? state.contracts[0].id : null, 15000, before);
      const upBook = upId ? await page.evaluate(i => { const m = window.contactMain ? contactMain(getContract(i)) : null; return m ? { name: m.name, email: m.email } : null; }, upId) : null;
      check('B2 the filed upload carries the name in its address book', !!(upBook && upBook.name === NAME && upBook.email === MAIL), upBook);
      if (upId) {
        await page.evaluate(i => { try { closeModal(); } catch (_) {} openWorkspace(i); }, upId);
        await until(page, i => state.view === 'workspace' && state.activeId === i, 8000, upId);
        await page.keyboard.press('Escape').catch(() => {});
        const preU = await sendScreenOpensWith(page, 'negotiate');
        check('B3 and its Send screen opens with the name', !!(preU && preU.name === NAME), preU);
        await page.evaluate(() => { try { closeModal(); } catch (_) {} });
      }
    }

    /* ---- C: the request form, and drafting from it ---- */
    await page.evaluate(() => { try { closeModal(); } catch (_) {} openIntakeForm(); });
    const ik = await until(page, () => !!document.getElementById('ik-title'), 8000);
    const ikRow = ik ? await page.evaluate(() => {
      const ids = ['ik-cp', 'ik-e-cpname', 'ik-e-cpemail'].map(x => document.getElementById(x));
      if (ids.some(x => !x)) return { missing: ids.map(x => !!x) };
      const tops = ids.map(x => Math.round(x.getBoundingClientRect().top));
      return { tops, level: tops.every(t => t === tops[0]) };
    }) : null;
    check('C1 the request form asks their contact, in one row with who they are and their address', !!(ikRow && ikRow.level), ikRow);
    await page.screenshot({ path: path.join(OUT, 'c-request.png') });
    if (ikRow && ikRow.level) {
      const title = 'NDA for Nandi ' + Date.now();
      await page.fill('#ik-title', title);
      await page.fill('#ik-need', 'A mutual NDA before we share the price list.');
      await page.fill('#ik-cp', 'Nandi Traders Ltd').catch(() => {});
      await page.fill('#ik-e-cpname', NAME);
      await page.fill('#ik-e-cpemail', MAIL);
      await page.$eval('#ik-send', b => b.click());
      const rid = await until(page, t => { const r = ((window._intakeState || {}).list || []).find(x => x.title === t); return r ? r.id : null; }, 12000, title);
      const ans = rid ? await page.evaluate(i => { const r = (_intakeState.list || []).find(x => x.id === i); return r ? r.answers || {} : null; }, rid) : null;
      check('C2 the request carries the name', !!(ans && ans.cpname === NAME), ans);
      if (rid) {
        await page.evaluate(i => { try { closeModal(); } catch (_) {} intakeDraft(i); }, rid);
        await until(page, () => !!document.querySelector('#na-root .na-pick'), 10000);
        await page.evaluate(() => { if (!document.querySelector('#na-form input')) { const b = [...document.querySelectorAll('#na-root .na-pick')].find(x => /NDA/.test(x.textContent)) || document.querySelector('#na-root .na-pick'); b.click(); } });
        const box = await until(page, () => { const n = document.getElementById('wz-cpname') || document.getElementById('ce-cpname') || document.getElementById('tf-cpname'); return n ? (n.value || '(empty)') : null; }, 10000);
        check('C3 drafting from the request opens with the name already in its box', box === NAME, box);
        await page.screenshot({ path: path.join(OUT, 'c-drafting.png') });
      }
    }
    check('D no page errors', errors.length === 0, errors.slice(0, 3));
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
