/* Chromium verification: A PASS IS A HAND-OFF (Young, 8 Oct 2026: "fix the
   two broken rules" — the nine flow rules 3 and 8)
   ============================================================
   f562 proves the record and the walls; this file proves what the COLLEAGUE
   sees after somebody passed them a contract for review:

     1  where it lands for them: the bell's row names who sent it and the
        note; their phone's contract carries one "Done"
     2  their bell carries the same hand-off
     3  "Done" answers it: the row goes, the saved record says yes, and the
        History line the SERVER wrote when it was sent is on the trail
   RE-POINTED AT STEP 7 OF THE OVERNIGHT WORK ORDER (15 Oct 2026): this check
   read the hand-off off the Contracts page's side panel, which the owner's
   Contracts place on Home does not draw (the List "without the inspector side
   panel"). On a computer a contract that stands only on Contracts has no list
   panel left to carry its checklist — named to the owner as a decision; the
   bell still says it. So "who and the note" are read off the bell's own row on
   screen, and "Done" is pressed where it is still drawn: the phone's contract
   (mobile-contract.js, look-done → lookDone, the one writer).
*/
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'a-pass-is-a-hand-off');
const EXEC = process.env.CHROMIUM_BIN
  || ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const mate = W.users.unrestricted;
  const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.';
  const c = fixtureContract('MK-HO1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
  await W.admin.json('/api/contracts/MK-HO1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const sent = await W.admin.json('/api/contracts/MK-HO1/pass', { method: 'POST', body: { memberId: mate.id, note: 'Please check the term', review: true } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 950 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'everything@example.co.ke');
    await page.fill('#li-pass', 'their-own-pass-9');
    await page.click('#li-go');
    await until(() => !!window.state && Array.isArray(state.contracts) && state.contracts.some(k => k.id === 'MK-HO1'), null, 15000);

    /* ===== 1. WHERE IT LANDS: THE BELL'S ROW SAYS WHO AND THE NOTE ===== */
    /* RE-POINTED 23 Oct 2026 (the bell, the Legora way): the panel's Needs you tab draws the one
       desk's own rows (.nd-pan .nd-r); the hand-off's row still names who and carries the note */
    await page.click('#hdr-notify');
    const shown = await until(() => [...document.querySelectorAll('#context-panel .nd-pan .nd-r')].some(b => /asked you to review/.test(b.textContent)));
    const row = await page.evaluate(() => { const r = [...document.querySelectorAll('#context-panel .nd-pan .nd-r')].find(b => /asked you to review/.test(b.textContent));
      if (!r) return null; const rc = r.getBoundingClientRect(); return { text: r.textContent.replace(/\s+/g, ' ').trim(), h: Math.round(rc.height) }; });
    check('1 the bell\'s row names who sent it for review', shown && row && /Amina Otieno asked you to review/.test(row.text), row && row.text);
    check('1b and carries the note', !!row && /Please check the term/.test(row.text));
    await page.screenshot({ path: path.join(OUT, '01-bell-row.png') });
    await page.keyboard.press('Escape').catch(() => {});

    /* ===== 2. THE BELL ===== */
    const bell = await page.evaluate(() => (window.buildAlerts ? buildAlerts() : []).filter(a => a && (a.kind === 'look' || a.k === 'look'))
      .map(a => String(a.text || a.title || '')));
    check('2 their bell carries the hand-off', bell.length === 1 && /asked you to review/.test(bell[0]), JSON.stringify(bell));

    /* ===== 3. DONE, ON THEIR PHONE (the screen that still draws it) ===== */
    const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
    phone.on('pageerror', e => errors.push('phone: ' + e.message));
    const pUntil = (fn, arg, ms = 8000) => phone.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
    await phone.goto(h.base + '/', { waitUntil: 'networkidle' });
    await phone.fill('#li-email', 'everything@example.co.ke');
    await phone.fill('#li-pass', 'their-own-pass-9');
    await phone.click('#li-go');
    await pUntil(() => !!window.state && Array.isArray(state.contracts) && state.contracts.some(k => k.id === 'MK-HO1') && typeof window.mGo === 'function', null, 15000);
    await phone.evaluate(() => { state.activeId = 'MK-HO1'; mGo('contract'); });
    await pUntil(() => !!document.querySelector('[data-m-act="overflow"]'));
    await phone.click('[data-m-act="overflow"]');
    const offered = await pUntil(() => !!document.querySelector('[data-m-act="look-done"]'));
    const btn = await phone.evaluate(() => { const b = document.querySelector('[data-m-act="look-done"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), h: Math.round(r.height) }; });
    check('1c with one "Done", painted', offered && !!btn && btn.h > 0, btn && `${btn.t} ${btn.h}px`);
    await phone.screenshot({ path: path.join(OUT, '03-phone-done.png') });
    if (offered) await phone.click('[data-m-act="look-done"]');
    await phone.click('[data-m-act="overflow"]').catch(() => {});
    const gone = await pUntil(() => !document.querySelector('[data-m-act="look-done"]'));
    check('3 Done takes the row away', offered && gone);
    await phone.keyboard.press('Escape').catch(() => {});
    if (await phone.evaluate(() => typeof flushSaves === 'function')) await phone.evaluate(() => flushSaves()).catch(() => {});
    if (await page.evaluate(() => typeof flushSaves === 'function')) await page.evaluate(() => flushSaves()).catch(() => {});
    let rec = null;
    for (let k = 0; k < 40; k++) {
      rec = await W.admin.json('/api/contracts/MK-HO1');
      const a = ((rec.contract || rec).asks || []).find(x => x.id === sent.askId);
      if (a && a.state === 'yes') break;
      await new Promise(r => setTimeout(r, 150));
    }
    const C = (rec && (rec.contract || rec)) || {};
    const ask = (C.asks || []).find(x => x.id === sent.askId);
    check('3b the saved record says it is done, in their name', !!ask && ask.state === 'yes' && ask.answeredBy && ask.answeredBy.name === mate.name,
      ask && JSON.stringify({ state: ask.state, by: ask.answeredBy }));
    check('3c the trail holds the server\'s two lines: sent, and looked at', (C.audit || []).some(x => x.action === 'Sent to a colleague')
      && (C.audit || []).some(x => x.action === 'Looked at it'));
    /* the computer reads the record again (the phone answered it) */
    await page.reload({ waitUntil: 'networkidle' });
    await until(() => !!window.state && Array.isArray(state.contracts) && state.contracts.some(k => k.id === 'MK-HO1'), null, 15000);
    const bellAfter = await page.evaluate(() => (window.buildAlerts ? buildAlerts() : []).filter(a => a && (a.kind === 'look' || a.k === 'look')).length);
    check('3d and the bell is quiet', bellAfter === 0, String(bellAfter));
    check('9 no page errors', !errors.length, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
