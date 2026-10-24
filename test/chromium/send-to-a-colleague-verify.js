/* "SENT AS: A COLLEAGUE" — driven in a real browser (owner picked "The Send
   Screen" by name, 20 Oct 2026). Pairs with f843.
   1 JAMBO'S BOX: after an answer, "send the above summary to @" lists "People
     who can open MK-B2", the one who cannot greyed with the reason; a pick and
     Enter open the send screen on "a colleague" — the colleague in To, Jambo's
     words as the note, the other side's rows away, the letter "Open MK-B2 in
     HaTi" — with Jambo's conversation beside it; Send by email mails the
     colleague (an app link, no guest link), the screen goes, Jambo says
     "Sent to … Recorded in MK-B2's history."
   2 THE SCREEN BY ITS OWN DOOR: "a colleague" is a choice of "Sent as"; @ in
     To picks a colleague; back to Negotiate brings the other side's rows
     back; a note past the cap is refused on the screen, nothing mailed.
   3 SHARE INSIDE THE COMPANY: the share card's button ends on that same screen.
   Red at the parent: no colleague purpose, no summary reading.
   Run: node test/chromium/send-to-a-colleague-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

(async () => {
  const h = await H.startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 10000) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => roomHomeLand('MK-B2'));
    await until(() => window.intel && intel.paper && intel.paper.id === 'MK-B2' && document.getElementById('igd-input'), null, 12000);

    await part('1', async () => {
      await page.click('#igd-input'); await page.keyboard.type('what does the contract say about money?'); await page.keyboard.press('Enter');
      await until(() => !intel.busy && intel.history.length >= 2, null, 15000);
      await page.evaluate(() => { const Hh = intel.history; while (Hh.length && Hh[Hh.length - 1].role !== 'user') Hh.pop();
        Hh.push({ role: 'assistant', text: '<p><b>Clause 8</b> governs money in MK-B2.</p><ul><li>Fixed fee of KES 78,000,000</li><li>Paid within 30 days of invoice</li></ul>' }); renderIntelDock(); });
      await page.click('#igd-input'); await page.keyboard.type('send the above summary to @');
      const pop = await until(() => { const p = document.getElementById('ca-pop'); return p ? { head: p.querySelector('h5').textContent,
        rows: [...p.querySelectorAll('.ca-opt')].map(r => ({ t: r.textContent.replace(/\s+/g, ' ').trim(), off: r.classList.contains('is-off'), on: r.classList.contains('on') })) } : null; }, null, 4000);
      check('1a the @ list says "People who can open MK-B2"', !!pop && pop.head === 'People who can open MK-B2', JSON.stringify(pop && pop.head));
      const rl = pop && pop.rows.find(r => /Restricted Legal/.test(r.t));
      check('1b the colleague who cannot open it is greyed with the reason, the light not on them', !!rl && rl.off && /Can't open MK-B2/.test(rl.t) && !rl.on, JSON.stringify(rl));
      await page.keyboard.type('Unre'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
      await until(() => document.querySelector('#sh-letter') && document.documentElement.hasAttribute('data-sh-col') && document.querySelector('#sh-lt-after .sh-lt-btn'), null, 12000);
      await page.waitForTimeout(500);
      const S = await page.evaluate(() => ({ chips: (document.getElementById('sh-col-chips') || {}).textContent, chip: (document.querySelector('[data-sh-as-w="purpose"]') || {}).textContent,
        note: (document.getElementById('sh-summary') || {}).value, btn: (document.querySelector('#sh-lt-after .sh-lt-btn') || {}).textContent,
        who: !!(document.querySelector('.sh-lt-who') || { getClientRects: () => [] }).getClientRects().length, ch: !!document.querySelector('[data-sh-as="ch"]').getClientRects().length,
        talk: document.getElementById('ig-dock').classList.contains('is-talk'),
        said: [...document.querySelectorAll('#igd-feed [data-ca-card]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).slice(-1)[0] || '' }));
      check('1c the screen opens on "a colleague", the colleague in To', S.chip === 'a colleague' && /Unrestricted Legal/.test(S.chips || ''), JSON.stringify({ chip: S.chip, chips: S.chips }));
      check('1d Jambo\'s words are the note, as plain lines', /^Clause 8 governs money in MK-B2\.\n- Fixed fee of KES 78,000,000\n- Paid within 30 days of invoice$/.test(S.note || ''), JSON.stringify(S.note));
      check('1e the other side\'s rows stand down; the letter says "Open MK-B2 in HaTi"', !S.who && !S.ch && S.btn === 'Open MK-B2 in HaTi', JSON.stringify({ who: S.who, ch: S.ch, btn: S.btn }));
      check('1f Jambo\'s conversation stays beside it, saying the screen is open', S.talk && /I opened Send the contract for a colleague/.test(S.said), JSON.stringify(S.said));
      const n0 = h.mail.sent.length;
      await page.click('#share-send');
      await until(() => !document.querySelector('#sh-letter'), null, 10000);
      await page.waitForTimeout(400);
      const m = h.mail.sent.slice(n0).find(x => x.to === 'everything@example.co.ke');
      check('1g the colleague is mailed the note and an app link, no guest link', !!m && /Clause 8 governs money/.test(m.text) && /#contract=MK-B2&tab=terms/.test(m.text) && !/\/s\/|token=/.test(m.text), JSON.stringify(m && m.subject));
      const D = await page.evaluate(() => ({ attr: document.documentElement.hasAttribute('data-sh-col'),
        said: [...document.querySelectorAll('#igd-feed [data-ca-card]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).slice(-1)[0] || '' }));
      check('1h the screen goes and Jambo says what went', !D.attr && /Sent to Unrestricted Legal at .+\. Recorded in MK-B2's history\. Show what was sent/.test(D.said), JSON.stringify(D));
    });

    /* 1i THE SAME ASK IN OTHER WORDS (21 Oct 2026): "write an email to Unrestricted summarising the above"
       opens the same screen on that colleague with Jambo's words — no model is asked, so nothing can claim
       "Email drafted above" with no email anywhere */
    await part('1i', async () => {
      const ai0 = h.ai ? h.ai.calls.length : 0;
      await page.evaluate(() => { const Hh = intel.history; Hh.push({ role: 'assistant', text: '<p>Payment is due within 30 days.</p>' }); renderIntelDock(); });
      await page.click('#igd-input'); await page.keyboard.type('write an email to Unrestricted summarising the above'); await page.keyboard.press('Enter');
      const up = await until(() => document.querySelector('#sh-letter') && document.documentElement.hasAttribute('data-sh-col') && document.querySelector('#sh-lt-after .sh-lt-btn') && (document.getElementById('sh-summary') || {}).value ? true : null, null, 10000);
      const S2 = await page.evaluate(() => ({ chips: (document.getElementById('sh-col-chips') || {}).textContent || '', note: (document.getElementById('sh-summary') || {}).value || '' }));
      check('1i "write an email to … summarising the above" opens the send screen on that colleague, Jambo\'s words the note, no model asked',
        !!up && /Unrestricted Legal/.test(S2.chips) && /Payment is due within 30 days/.test(S2.note) && (h.ai ? h.ai.calls.length === ai0 : true), JSON.stringify(S2));
      await page.evaluate(() => { if (window.closeModal) closeModal(); });
      await until(() => !document.querySelector('#sh-letter'), null, 6000);
    });

    await part('2', async () => {
      await page.evaluate(() => openShareModal(getContract('MK-B2')));
      await until(() => document.querySelector('#sh-letter') && document.querySelector('[data-sh-as-go="purpose"]') && document.querySelector('#sh-lt-after .sh-lt-btn'), null, 12000);
      await page.waitForTimeout(400);
      await page.click('[data-sh-as-go="purpose"]');
      const seg = await page.$('#share-purpose [data-share-purpose="colleague"]');
      check('2a "a colleague" is a choice of Sent as', !!seg);
      if (seg) await seg.click();
      await until(() => document.documentElement.hasAttribute('data-sh-col'), null, 4000);
      await page.click('#sh-col-q'); await page.keyboard.type('@No');
      await until(() => !document.getElementById('sh-col-pop').classList.contains('hidden'), null, 3000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
      const A = await page.evaluate(() => ({ chips: document.getElementById('sh-col-chips').textContent, popUp: !document.getElementById('sh-col-pop').classList.contains('hidden') }));
      check('2b @ in To picks a colleague, and the list goes away', /No Values Legal/.test(A.chips) && !A.popUp, JSON.stringify(A));
      await page.click('[data-sh-as-go="purpose"]'); await page.click('#share-purpose [data-share-purpose="negotiate"]');
      await page.waitForTimeout(250);
      const B = await page.evaluate(() => ({ attr: document.documentElement.hasAttribute('data-sh-col'), ch: !!document.querySelector('[data-sh-as="ch"]').getClientRects().length }));
      check('2c back to Negotiate brings the other side\'s rows back', !B.attr && B.ch, JSON.stringify(B));
      await page.click('[data-sh-as-go="purpose"]'); await page.click('#share-purpose [data-share-purpose="colleague"]');
      await page.waitForTimeout(200);
      await page.fill('#sh-summary', 'x'.repeat(2100));
      const n0 = h.mail.sent.length;
      await page.click('#share-send');
      await page.waitForTimeout(600);
      const C = await page.evaluate(() => !!document.querySelector('#sh-letter'));
      check('2d a note past the cap is refused on the screen, nothing mailed', C && h.mail.sent.length === n0);
    });
    /* 3 SHARE INSIDE THE COMPANY (owner, 24 Oct 2026: "when i do it for a colleague, it should look the same"):
       the share card's button, a colleague picked and Enter end on the send screen as the other side's send
       does — the colleague in To, "a colleague", the review line — never on Before you send with nobody named.
       Red at the parent: navRead read "Send #MK-B2 … to @…" as the trip to the letter and dropped the colleague. */
    await part('3', async () => {
      await page.evaluate(() => { if (window.closeModal) closeModal(); roomHomeLand('MK-B2'); });
      await until(() => !document.querySelector('#sh-letter') && window.intel && intel.paper && intel.paper.id === 'MK-B2' && document.getElementById('igd-input'), null, 12000);
      await page.click('#igd-input'); await page.keyboard.type('share'); await page.keyboard.press('Enter');
      const btn = await until(() => !!document.querySelector('[data-ca-act="sharein"]'), null, 8000);
      check('3a "share" offers Share inside the company', !!btn);
      await page.click('[data-ca-act="sharein"]');
      await until(() => document.getElementById('ca-pop'), null, 4000);
      await page.keyboard.type('Unre'); await page.keyboard.press('Enter');
      const typed = await page.inputValue('#igd-input');
      await page.keyboard.press('Enter');
      const up = await until(() => document.querySelector('#sh-letter') && document.documentElement.hasAttribute('data-sh-col') && document.querySelector('#sh-lt-after .sh-lt-btn') ? true : null, null, 10000);
      await page.waitForTimeout(400);
      const S = await page.evaluate(() => ({ chips: (document.getElementById('sh-col-chips') || {}).textContent || '', chip: (document.querySelector('[data-sh-as-w="purpose"]') || {}).textContent,
        letter: (document.getElementById('sh-letter') || {}).textContent || '',
        said: [...document.querySelectorAll('#igd-feed [data-ca-card]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).slice(-1)[0] || '' }));
      check('3b the send screen opens on "a colleague", the one picked in To', !!up && S.chip === 'a colleague' && /Unrestricted Legal/.test(S.chips), JSON.stringify({ typed, chip: S.chip, chips: S.chips }));
      check('3c the letter asks them to review, and says nothing of a summary', /asked you to review MK-B2/.test(S.letter) && !/Jambo's summary/.test(S.letter), JSON.stringify(S.letter.slice(0, 200)));
      check('3d Jambo says the screen is open, with no summary claimed', /I opened Send the contract for a colleague, with Unrestricted Legal as the person\. Add a note/.test(S.said), JSON.stringify(S.said));
      /* 3i the Send button is named for the colleague, never the other side's hidden Name box (owner, 24 Oct 2026:
         "why does it say send to diamonds?") */
      const lbl = await page.evaluate(() => { const n = document.getElementById('sh-name'); if (n){ n.value = 'diamonds'; n.dispatchEvent(new Event('input', { bubbles: true })); }
        return new Promise(r => setTimeout(() => r((document.getElementById('sh-send-lbl') || {}).textContent || ''), 300)); });
      check('3i the Send button names the colleague, not the other side', /^Send to Unrestricted$/.test(lbl.trim()), JSON.stringify(lbl));
      /* 3j a tab pressed beside the letter shows that tab, and "Before you send" brings the letter's face back
         (owner: "why is dossier empty and all the other panels") */
      const tabs = [];
      for (const k of ['Clauses', 'Dossier']){
        await page.locator('#ig-dock .pd-tab', { hasText: k }).first().click();
        tabs.push(await until(() => !document.getElementById('pd-sendface') && document.querySelector('#sh-letter') ? true : null, null, 4000));
      }
      await page.click('#ig-dock [data-pd-send-back]');
      const back = await until(() => document.getElementById('pd-sendface') ? true : null, null, 4000);
      check('3j Clauses and Dossier show their own panel beside the letter; "Before you send" brings it back', tabs.every(Boolean) && !!back, JSON.stringify({ tabs, back }));
      const n0 = h.mail.sent.length;
      await page.click('#share-send');
      await until(() => !document.querySelector('#sh-letter'), null, 10000);
      await page.waitForTimeout(400);
      const m = h.mail.sent.slice(n0).find(x => x.to === 'everything@example.co.ke');
      check('3e the colleague is mailed a review ask, not "Jambo\'s summary"', !!m && /asked you to review MK-B2/.test(m.text) && !/Jambo's summary/.test(m.subject), JSON.stringify(m && m.subject));
      /* the same sentence typed by hand keeps Jambo's own send card (nothing opened) */
      await page.click('#igd-input'); await page.keyboard.type('Send #MK-B2 for review to @Unre'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
      const card = await until(() => [...document.querySelectorAll('#igd-feed [data-ca-act="send"]')].length ? true : null, null, 8000);
      const open = await page.evaluate(() => !!document.querySelector('#sh-letter'));
      check('3f typed by hand, it is Jambo\'s send card with the colleague — never the trip to Before you send', !!card && !open, JSON.stringify({ card, open }));
      /* 3g–3h (owner, 24 Oct 2026, "the bug is still there"): a name Jambo cannot take — yourself, or nobody by that
         name — is said on his card, never the trip to Before you send that drops it */
      for (const [k, who, says] of [['3g', 'Amina Otieno', /That is you\. Type @ and pick a colleague/], ['3h', 'Nobody Atall', /Choose who it goes to/]]){
        await page.evaluate(() => { if (window.closeModal) closeModal(); });
        await page.click('#igd-input'); await page.keyboard.type('share'); await page.keyboard.press('Enter');
        await until(() => [...document.querySelectorAll('[data-ca-act="sharein"]')].length ? true : null, null, 8000);
        await page.locator('[data-ca-act="sharein"]').last().click();
        await page.keyboard.type(who); await page.keyboard.press('Escape'); await page.click('#igd-go');
        const W = await until(() => { const H = intel.history, m = H[H.length - 1]; return m && m.act && m.role === 'assistant' && H[H.length - 2] && /@/.test(H[H.length - 2].text || '')
          ? { kind: m.act.kind, nav: m.act.nav ? m.act.nav.act : null, said: [...document.querySelectorAll('#igd-feed [data-ca-card]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).slice(-1)[0] || '' } : null; }, null, 8000);
        check(k + ' "@' + who + '" is said on Jambo\'s card, never the trip to Before you send', !!W && W.kind === 'send' && !W.nav && says.test(W.said), JSON.stringify(W));
      }
    });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close().catch(() => {}); await h.stop().catch(() => {});
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
