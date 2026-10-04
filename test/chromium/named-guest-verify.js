/* NAMED GUESTS — THE CODE AT THE DOOR, driven end to end.
 *
 * Young picked "The guest list" by name: several named people per outside
 * party, each with their own link AND THEIR OWN CODE. The guest list half was
 * already built (participants.js holds the people, the send screen mints a
 * link each), so what this drives is the DOOR.
 *
 * WHAT IT DRIVES, where the user looks:
 *   0. with the rule OFF, not one link behaves differently — the claim that
 *      lets this be switched on later with no migration;
 *   1. an admin turns it on by pressing the real switch in Settings;
 *   2. a stranger with the address meets a screen asking for a code, which
 *      names the inbox without giving it away and HOLDS NOTHING OF THE DEAL;
 *   3. the code that actually arrives in the mail opens it — read out of the
 *      provider the server really talked to, not guessed;
 *   4. THE WALLS: a wrong code is refused and counted, the payload route
 *      itself refuses without a ticket, one guest's ticket does not open
 *      another guest's link, and a body naming an address is refused;
 *   5. asking for a fresh code kills the ticket the last one earned;
 *   6. a status link never asks, because it carries nothing.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHatiWithMail, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'named-guest');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
/* Seeded so a screen that leaked one word of the deal would be caught by name
   rather than by reading it. */
const SECRET = { word: 'Zanzibarium', author: 'Tomas Backroom' };
const GUEST = { name: 'Elin Hallberg', email: 'elin.hallberg@nordbygg.example' };
const GUEST2 = { name: 'Rickard Sund', email: 'rickard@nordbygg.example' };
const DEAL = {
  id: 'MK-G1', contractNo: 'MK-G1', name: 'Supply Agreement',
  counterparty: 'Nordbygg AB', counterpartyEmail: GUEST.email,
  folder: 'proc', value: 1800000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 1800000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [{ id: 'CHG-1', status: 'pending', authorSide: 'owner', clauseId: 'c9',
    clauseLabel: '9. Liability Cap', kind: 'edit', changeType: 'edit',
    author: SECRET.author, createdAt: iso(-2), seq: 1 }],
  negotiation: { round: 1, rounds: [] },
  body: '<h2>9. Liability Cap</h2><p>' + SECRET.word + ' limits liability to 150%.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHatiWithMail();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 9000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  /* THE LIST IS LIGHT IN SERVER MODE, so the whole record is loaded before the
     payload is built — the send screen's own first act. */
  const mint = (page, to) => page.evaluate(async r => {
    const c = getContract('MK-G1');
    await ensureFull(c);
    const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
    const x = await api('shares', 'POST', { payload, channel: 'link', purpose: 'negotiate',
      recipient: { name: r.name, email: r.email } });
    return x && (x.token || (x.share && x.share.token));
  }, to);
  /* The code is read out of the provider the server REALLY talked to, so this
     stage cannot pass against a route that only claims to have sent one. */
  const codeFor = email => {
    const m = [...h.mail.sent].reverse().find(s => s.to === email);
    return m ? (String(m.subject + ' ' + m.text).match(/\b(\d{6})\b/) || [])[1] || null : null;
  };
  /* ONE CODE, ONE PROOF, TWO GATES — so the mail this looks for is the
     product's own signing code, not a second one written for the door. */
  const codeMails = () => h.mail.sent.filter(m => /code/i.test(m.subject)).length;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await until(page, () => typeof currentUser === 'function' && !!currentUser(), null, 12000);

    /* ===== 0. WITH THE RULE OFF, NOTHING BEHAVES DIFFERENTLY ===== */
    /* A WAIT ASKS FOR THE STATE, BOUNDED. The book is briefly empty while the
       list route answers, and the first run of this stage caught it there. */
    const seeded = await until(page, () => typeof getContract === 'function' && !!getContract('MK-G1'), null, 15000);
    ok('0a the fixture is in the book', seeded);
    const offTok = await mint(page, GUEST);
    ok('0b a link addressed to a named guest is minted', !!offTok, offTok || 'none');
    const before = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const bpage = await before.newPage();
    await bpage.goto(h.base + '/#share=t:' + offTok, { waitUntil: 'networkidle' });
    const openedCold = await until(bpage, () => !!document.querySelector('#share-root .pw-id, #share-root .ps-page, #pt-nego'), null, 14000);
    const askedCold = await bpage.evaluate(() => !!document.getElementById('pt-code-in'));
    ok('0c with the rule off it opens straight away, as it always did',
      openedCold && !askedCold, 'opened=' + openedCold + ' asked=' + askedCold);
    ok('0d and no code was mailed to anybody',
      codeMails() === 0, JSON.stringify(h.mail.sent.map(s => s.subject).slice(0, 3)));
    await before.close();

    /* ===== 1. AN ADMIN PRESSES THE REAL SWITCH ===== */
    await page.evaluate(() => openSettingsAt('platform', 'linkcode'));
    const sawPanel = await until(page, () => !!document.getElementById('lc-rule-on'), null, 9000);
    ok('1a the switch is in Settings, on the platform tab, where the other walls live', sawPanel);
    if (sawPanel) {
      await page.check('#lc-rule-on');
      await page.evaluate(() => flushSaves && flushSaves());
      await page.waitForTimeout(400);
    }
    const ruleOn = await page.evaluate(async () => {
      const mine = window.linkCodeCfg ? linkCodeCfg().on : null;
      /* Asked of the SERVER'S own copy, fetched fresh — the browser's state is
         cosmetics and would have said yes either way. */
      const r = await api('bootstrap');
      const srv = r && r.settings && r.settings.linkCode ? !!r.settings.linkCode.on : null;
      return { mine, srv };
    });
    ok('1b and pressing it is what the SERVER then reads',
      ruleOn.mine === true && ruleOn.srv === true, JSON.stringify(ruleOn));
    await page.screenshot({ path: path.join(OUT, '1-the-switch.png') });

    /* ===== 2. A STRANGER MEETS THE DOOR ===== */
    const tok = await mint(page, GUEST);
    const tok2 = await mint(page, GUEST2);
    ok('2a two named guests, two links', !!tok && !!tok2 && tok !== tok2, [tok, tok2].join(' '));
    const guest = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const gpage = await guest.newPage();
    gpage.on('pageerror', e => errs.push('guest: ' + e.message));
    await gpage.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
    const asked = await until(gpage, () => !!document.getElementById('pt-code-in'), null, 14000);
    ok('2b the link asks who is opening it', asked);
    const screen = await gpage.evaluate(() => ({
      text: document.body.innerText.replace(/\s+/g, ' ').trim(),
      hasBox: !!document.getElementById('pt-code-in'),
      hasSend: !!document.getElementById('pt-code-send'),
      paper: !!document.querySelector('.doc-surface, .rl-paper, #pt-nego, .pw-id') }));
    ok('2c it names the inbox without giving it away',
      /el…@nordbygg\.example/.test(screen.text) && !screen.text.includes(GUEST.email),
      (screen.text.match(/sent a six-digit code to \S+/i) || [''])[0]);
    ok('2d and there is NOTHING of the deal on it — not hidden, not given',
      !screen.paper && !screen.text.includes(SECRET.word) && !screen.text.includes(SECRET.author)
        && !/Liability Cap/.test(screen.text), screen.text.slice(0, 90));
    await gpage.screenshot({ path: path.join(OUT, '2-the-door.png') });
    /* A RECT IS NOT A PAINTED PIXEL. Measured off the rendered page: the card
       is really on screen, the box and its button share one line, and no word
       runs off the edge of a phone-width window. */
    const drawn = await gpage.evaluate(() => {
      const card = document.querySelector('.pt-code');
      const box = document.getElementById('pt-code-in');
      const btn = document.getElementById('pt-code-go');
      if (!card || !box || !btn) return null;
      const c = card.getBoundingClientRect(), b = box.getBoundingClientRect(), g = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2));
      return { w: Math.round(c.width), onScreen: c.top >= 0 && c.bottom <= innerHeight + 1,
        sameLine: Math.abs(b.top - g.top) < 2, boxIsHit: !!hit && (hit === box || box.contains(hit)),
        overflow: Math.round(document.documentElement.scrollWidth - innerWidth),
        face: parseFloat(getComputedStyle(box).fontSize) };
    });
    ok('2g the screen is really painted, and the box is the thing under the cursor',
      !!drawn && drawn.onScreen && drawn.boxIsHit && drawn.sameLine && drawn.overflow <= 0
        && drawn.w > 300 && drawn.face >= 12, JSON.stringify(drawn));
    await gpage.setViewportSize({ width: 390, height: 780 });
    const narrow = await gpage.evaluate(() => ({
      overflow: Math.round(document.documentElement.scrollWidth - innerWidth),
      gutter: Math.round((document.querySelector('.pt-code') || {}).getBoundingClientRect
        ? document.querySelector('.pt-code').getBoundingClientRect().left : -1) }));
    ok('2h and it holds on a phone, with a gutter and no sideways scroll',
      narrow.overflow <= 0 && narrow.gutter >= 12, JSON.stringify(narrow));
    await gpage.setViewportSize({ width: 1100, height: 900 });
    /* THE WALL IS THE PAYLOAD, NOT THE PAGE: asked from the guest's own
       browser, with no ticket, the route that hands over the contract refuses. */
    const bare = await gpage.evaluate(async t => {
      const r = await fetch('/api/shares/' + t);
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, needsCode: !!(j && j.needsCode), to: j && j.to,
        keys: j ? Object.keys(j) : null, body: JSON.stringify(j || {}) };
    }, tok);
    ok('2e the payload route itself refuses, so no screen can be skipped past',
      bare.status === 401 && bare.needsCode, JSON.stringify(bare.status));
    ok('2f and its refusal carries the masked address and no fact about the deal',
      !!bare.to && !bare.to.includes('hallberg') && !bare.body.includes(SECRET.word)
        && !/contract|changes|thread/.test(bare.body), bare.to + ' ' + JSON.stringify(bare.keys));

    /* ===== 3. A WRONG CODE, THEN THE ONE THAT ARRIVED ===== */
    const mailed = codeFor(GUEST.email);
    ok('3a a code really was mailed, to the address on the row',
      !!mailed && h.mail.lastTo() === GUEST.email, mailed + ' → ' + h.mail.lastTo());
    const wrong = await gpage.evaluate(async t => {
      const r = await fetch('/api/shares/' + t + '/verify-otp', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '000001' }) });
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, err: j && j.error, ticket: j && j.verify };
    }, tok);
    ok('3b a wrong code is refused, and earns nothing',
      wrong.status >= 400 && !wrong.ticket, JSON.stringify(wrong));
    /* GUARDED, so a missing door REPORTS rather than spending thirty seconds
       waiting for a box that is not there. */
    if (asked) {
      await gpage.fill('#pt-code-in', mailed || '000000');
      await gpage.click('#pt-code-go');
    }
    const opened = await until(gpage, () => !!document.querySelector('#share-root .pw-id, #share-root .ps-page, #pt-nego'), null, 16000);
    ok('3c the code that arrived opens the contract', opened);
    const inside = await gpage.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    ok('3d and what opens is the real deal, not a stub',
      /MK-G1|Supply Agreement/.test(inside) && /Nordbygg/.test(inside), inside.slice(0, 90));
    await gpage.screenshot({ path: path.join(OUT, '3-inside.png') });
    /* A REFRESH DOES NOT ASK AGAIN. The ticket is for the sitting. */
    const spent = h.mail.sent.length;
    await gpage.reload({ waitUntil: 'networkidle' });
    const stillIn = await until(gpage, () => !!document.querySelector('#share-root .pw-id, #share-root .ps-page, #pt-nego'), null, 16000);
    ok('3e a refresh stays inside, and spends no more mail',
      stillIn && h.mail.sent.length === spent, 'in=' + stillIn + ' mail=' + (h.mail.sent.length - spent));

    /* ===== 4. ONE TICKET, ONE LINK ===== */
    const crossed = await gpage.evaluate(async a => {
      const t = sessionStorage.getItem('hati.ptTicket.' + a.tok) || '';
      const r = await fetch('/api/shares/' + a.tok2 + '?t=' + encodeURIComponent(t));
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, needsCode: !!(j && j.needsCode), had: !!t };
    }, { tok, tok2 });
    ok('4a one guest\'s ticket does not open another guest\'s link',
      crossed.had && crossed.status === 401 && crossed.needsCode, JSON.stringify(crossed));
    const supplied = await gpage.evaluate(async t => {
      const r = await fetch('/api/shares/' + t + '/otp', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'attacker@elsewhere.example' }) });
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, sentTo: j && j.sentTo };
    }, tok2);
    /* THE ADDRESS IS THE SENDER'S CHOICE, read back out of the row. The route
       does not refuse a body — it has never read one — so the claim is that the
       code went where the LINK says, not where the caller said. */
    ok('4b a caller naming their own address does not move where the code goes',
      supplied.sentTo === GUEST2.email, JSON.stringify(supplied));
    ok('4c and nothing was mailed to the address they named',
      !h.mail.toAddresses().includes('attacker@elsewhere.example'),
      JSON.stringify(h.mail.toAddresses().slice(-3)));

    /* ===== 5. A FRESH CODE KILLS THE OLD TICKET ===== */
    const reset = await gpage.evaluate(async t => {
      const keep = sessionStorage.getItem('hati.ptTicket.' + t) || '';
      await fetch('/api/shares/' + t + '/otp', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const r = await fetch('/api/shares/' + t + '?t=' + encodeURIComponent(keep));
      return { status: r.status, had: !!keep };
    }, tok);
    ok('5a asking for a new code shuts the previous opener out',
      reset.had && reset.status === 401, JSON.stringify(reset));
    const second = codeFor(GUEST.email);
    const reopened = await gpage.evaluate(async a => {
      const v = await fetch('/api/shares/' + a.tok + '/verify-otp', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: a.code }) });
      let j = null; try { j = await v.json(); } catch (_){}
      if (!j || !j.verify) return { ok: false, status: v.status };
      const r = await fetch('/api/shares/' + a.tok + '?t=' + encodeURIComponent(j.verify));
      return { ok: r.ok, status: r.status, fresh: j.verify !== a.old };
    }, { tok, code: second, old: null });
    ok('5b and the new code lets them back in', reopened.ok === true, JSON.stringify(reopened));
    ok('5c the second code is not the first one again', !!second && second !== mailed,
      mailed + ' → ' + second);

    /* ===== 6. A STATUS LINK NEVER ASKS ===== */
    const stat = await page.evaluate(async () => {
      const c = getContract('MK-G1');
      await ensureFull(c);
      const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'status' });
      const x = await api('shares', 'POST', { payload, channel: 'link', purpose: 'status',
        recipient: { name: 'Nordbygg AB', email: 'board@nordbygg.example' } });
      return x && (x.token || (x.share && x.share.token));
    });
    const anyone = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const apage = await anyone.newPage();
    const r6 = await apage.goto(h.base + '/deal/' + stat, { waitUntil: 'load' });
    const t6 = await apage.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    ok('6a a status link still opens for anybody, with no code',
      !!stat && r6 && r6.status() === 200 && /Nordbygg/.test(t6) && !/six-digit/i.test(t6),
      (r6 && r6.status()) + ' ' + t6.slice(0, 70));
    const codeTry = await apage.evaluate(async t => {
      const r = await fetch('/api/shares/' + t + '/otp', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: '{}' });
      return r.status;
    }, stat);
    /* A status link is view-only, so the route's own oldest wall answers it —
       f144's wall, untouched by the narrow escape this build added. */
    ok('6b and it refuses to mail a code for a door that never asks',
      codeTry >= 400, String(codeTry));

    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
