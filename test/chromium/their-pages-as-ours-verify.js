/* THE OTHER SIDE'S PAGES AS OURS (owner, 8 Nov 2026: "move away from the cards views into the page views just like we
   have done into hati"; "mimic what is in the owner side"; "the other side is not supposed to have AI ability").
   Behind the company's own setting "new look for people outside" (outsideLookOn).
     1 · Redlines: our cards stand in the right-hand panel under Redlines · Where we are · Notes; one road of four stops
     2 · a card, its note beside the paper and its clause are lit together, pressed from either
     3 · Counter opens our clause page with our trail (no Jambo); Save opens our Notes drawer on the change, two rooms
         (their team · us) and the pin's room switch; no change code (CHG-…) reaches their screen
     4 · their team's note travels on the link and is served only to their party's links: never to our seat nor the
         waiting count
     5 · Send back stands in the panel (what goes, a message, one button) and sends
     6 · History is our History's table (Time · Who · Side · What happened · Outcome), no change codes; Where we are and
         Signing are page views (nothing boxed)
     7 · the emails: the invitation is the drawn letter without the sender's new look; the reminder is a letter; the
         code says it opens the link; the code screen and the status page wear the black bar
     8 · the phone: nothing moves sideways
   At the parent 1–7 fail; 8 held already (their page never scrolled sideways — the tabs were cut instead) and guards it.
   Run: node test/chromium/their-pages-as-ours-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHatiWithMail } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHatiWithMail(); await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const us = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  await us.goto(h.base + '/', { waitUntil: 'networkidle' });
  await us.fill('#li-email', 'admin@example.co.ke'); await us.fill('#li-pass', 'adminpassword1'); await us.click('#li-go');
  await until(us, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  await us.evaluate(W.R7_IN_PAGE);
  await us.evaluate(async () => { state.settings = state.settings || {}; state.settings.outsideLook = { on: true }; await saveSettings(); });
  h.mail.reset();
  /* our answers to their round, sent to Erik by email — WITHOUT the sender's new-look flag */
  const tok = await us.evaluate(async () => {
    const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c);
    const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
    const by = re => cls.find(x => re.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
    const pay = by(/Payment/), lia = by(/Limitation/);
    if (pay) await negoEditClause(c, pay.clauseId, '<p>Customer shall pay each correct invoice within 45 days of receipt. Interest on late payment runs at the Central Bank rate plus two per cent from the due date.</p>', { side: 'owner', author: 'Amina Otieno' });
    if (lia) await negoEditClause(c, lia.clauseId, '<p>Each Party\'s total liability under this agreement shall not exceed nine (9) months of Charges paid or payable in the year the claim arises.</p>', { side: 'owner', author: 'Amina Otieno' });
    if (window.persist) await persist(c); if (window.flushSaves) await flushSaves();
    const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
    const r = await api('shares', 'POST', { payload, channel: 'email', purpose: 'negotiate', durable: true, expiryDays: 30, recipient: { name: 'Erik Lindqvist', email: 'erik@parcelway.example' } });
    return r && (r.token || (r.share && r.share.token));
  });
  const invite = h.mail.sent.find(m => m.to === 'erik@parcelway.example');
  /* the reminder, while the link still waits on them */
  h.mail.reset();
  await us.evaluate(async t => { await api('shares/' + t + '/resend', 'POST', {}); }, tok);
  const rem = h.mail.sent.find(m => m.to === 'erik@parcelway.example');
  const theirs = async (w = 1440, hh = 780) => {
    const p = await (await browser.newContext({ viewport: { width: w, height: hh } })).newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
    await p.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
    await until(p, () => !!document.getElementById('pt-tab-redlines'), null, 20000);
    return p;
  };
  const p = await theirs();
  await p.click('#pt-tab-redlines');
  await until(p, () => document.querySelectorAll('.pol-note').length >= 2 && !!document.querySelector('#rl-side .rl-card'), null, 15000);

  /* 1 */
  try {
    const S = await p.evaluate(() => { const side = document.getElementById('rl-side'); const r = side && side.getBoundingClientRect();
      return { cards: document.querySelectorAll('#rl-side .rl-card').length, shown: !!(side && getComputedStyle(side).display !== 'none' && r.width > 300 && r.left > innerWidth / 2),
        tabs: [...document.querySelectorAll('.pol-side-hd [data-pol-face], .pol-side-hd [data-pt-where-notes]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        road: document.querySelectorAll('.pol-road li').length }; });
    check('1 · Redlines: our cards in the right-hand panel under Redlines · Where we are · Notes; a road of four stops',
      S.cards >= 2 && S.shown && S.tabs.length === 3 && /^Redlines/.test(S.tabs[0]) && S.road === 4, S);
  } catch (e) { check('1', false, String(e).slice(0, 200)); }

  /* 2 */
  try {
    await p.evaluate(() => { const c = document.querySelectorAll('#rl-side .rl-card')[1]; if (c) c.click(); }); await p.waitForTimeout(500);
    const a = await p.evaluate(() => { const card = document.querySelectorAll('#rl-side .rl-card')[1]; const id = card && card.getAttribute('data-nego-card');
      return { cardLit: !!(card && card.classList.contains('is-linked')), noteLit: !!document.querySelector(`.pol-note.is-linked[data-pol-note="${id}"]`) }; });
    await p.evaluate(() => { const t = document.querySelector('.pol-note .pol-nt-t'); if (t) t.click(); }); await p.waitForTimeout(500);
    const b = await p.evaluate(() => { const n = document.querySelector('.pol-note'); const id = n && n.getAttribute('data-pol-note');
      return { cardLit: !!document.querySelector(`#rl-side .rl-card.is-linked[data-nego-card="${id}"]`), noteLit: !!(n && n.classList.contains('is-linked')) }; });
    check('2 · a card and its note are lit together, from the card and from the note', a.cardLit && a.noteLit && b.cardLit && b.noteLit, { a, b });
  } catch (e) { check('2', false, String(e).slice(0, 200)); }

  /* 3 */
  try {
    await p.evaluate(() => { const b = [...document.querySelectorAll('.pol-note [data-pol-act="counter"]')][1]; if (b) b.click(); });
    const up = await until(p, () => !!document.querySelector('#ce-rowhead:not([hidden])'), null, 10000);
    const trail = up ? await p.evaluate(() => document.querySelector('#ce-rowhead').textContent.replace(/\s+/g, ' ').trim()) : '';
    const box = await p.$('[contenteditable="true"]');
    if (box){ await box.click(); await p.keyboard.press('End'); await p.keyboard.type(' Seven months is our limit.'); }
    await p.click('#ce-railfoot button.p').catch(() => {});
    const open = await until(p, () => { const d = document.getElementById('pt-notes'); return d && d.classList.contains('open') && !!d.querySelector('.rl-np-pin'); }, null, 10000);
    const D = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('#pt-notes .rl-np-tab')].map(t => t.textContent.replace(/\s+/g, ' ').trim()),
      pinRooms: [...document.querySelectorAll('#pt-notes [data-rl-np-pin-room]')].map(b => b.textContent.trim()),
      codes: /\bCHG-\d+/.test((document.getElementById('pt-notes') || {}).innerText + ' ' + (document.getElementById('toast-root') || {}).innerText) }));
    check('3 · Counter opens our clause page with our trail and no Jambo; Save opens our Notes drawer with two rooms and the pin\'s switch; no change code',
      up && /Redlines/.test(trail) && !/Jambo/.test(trail) && open && D.tabs.length === 2 && /your team/.test(D.tabs[0]) && D.pinRooms.length === 2 && !D.codes, { trail, D });
    /* 4 · their team's note */
    const ta = await p.$('#pt-notes .rl-np-in');
    if (ta){ await ta.fill('Sofia, I have countered at seven.'); await p.click('#pt-notes .rl-np-send, #pt-notes [data-rl-chat-send]'); await p.waitForTimeout(1500); }
    const mine = await p.evaluate(async t => { const r = await fetch('api/shares/' + t); const j = await r.json(); return (j.messages || []).map(m => m.side + ':' + m.body); }, tok);
    const ours = await us.evaluate(async () => { const r = await api('contracts/MK-IT/messages'); return (r.messages || []).map(m => m.side + ':' + m.body); });
    const waiting = await us.evaluate(async () => { const r = await api('messages/waiting'); return (r.items || []).length; });
    check('4 · their team\'s note travels on their link, and never reaches our seat or the waiting count',
      mine.some(x => /^their-team:Sofia/.test(x)) && !ours.some(x => /Sofia/.test(x)) && waiting === 0, { mine, ours, waiting });
    await p.evaluate(() => { try { portalNotesClose(); } catch (_){} const b = document.querySelector('#ce-rowhead .ce-rowback'); if (b) b.click(); });
    await until(p, () => !document.querySelector('#ce-rowhead:not([hidden])'), null, 8000);
  } catch (e) { check('3/4', false, String(e).slice(0, 200)); }

  /* 5 */
  try {
    await until(p, () => !!document.querySelector('.pol-note [data-pol-act="accept"]'), null, 8000);
    await p.evaluate(() => { const b = document.querySelector('.pol-note [data-pol-act="accept"]'); if (b) b.click(); }); await p.waitForTimeout(800);
    await p.click('#pol-send');
    const face = await until(p, () => !!document.getElementById('pol-send-msg'), null, 6000);
    const lines = await p.evaluate(() => [...document.querySelectorAll('.pol-send-list li')].map(l => l.textContent.trim()));
    await p.fill('#pol-send-msg', 'Amina, we take your payment terms.');
    await p.click('#pol-send-go');
    const sent = await until(p, () => /sent to/i.test((document.getElementById('toast-root') || {}).innerText || ''), null, 8000);
    check('5 · Send back stands in the panel — what goes, a message, one button — and sends', face && lines.length >= 1 && sent, { face, lines, sent });
  } catch (e) { check('5', false, String(e).slice(0, 200)); }

  /* 6 */
  try {
    await p.click('#pt-hist'); await until(p, () => !!document.querySelector('.pol-hist-t'), null, 8000);
    const Hs = await p.evaluate(() => ({ cols: [...document.querySelectorAll('.pol-hist-t th')].map(t => t.textContent.trim()),
      rows: document.querySelectorAll('.pol-hist-t tbody tr[data-pol-h]').length, codes: /#?CHG-\d+|owner side/i.test(document.getElementById('pt-hist-pane').innerText) }));
    await p.click('#pt-tab-where'); await p.waitForTimeout(600);
    const whereBox = await p.evaluate(() => { const c = document.querySelector('#pt-where-pane .ds-card'); const cs = c && getComputedStyle(c); return cs ? cs.borderTopWidth + ' ' + cs.boxShadow : 'none'; });
    await p.click('#pt-tab-signing'); await p.waitForTimeout(600);
    const signBox = await p.evaluate(() => { const c = document.querySelector('#pt-sign-pane .ps-side'); const cs = c && getComputedStyle(c); return cs ? cs.borderTopWidth + ' ' + cs.boxShadow : 'none'; });
    check('6 · History is our table, no change codes; Where we are and Signing are page views, nothing boxed',
      Hs.cols.join('|') === 'Time|Who|Side|What happened|Outcome' && Hs.rows >= 2 && !Hs.codes && /^0px none$/.test(whereBox) && /^0px none$/.test(signBox), { Hs, whereBox, signBox });
  } catch (e) { check('6', false, String(e).slice(0, 200)); }
  await p.context().close();

  /* 7 */
  try {
    await us.evaluate(async () => { state.settings.linkCode = { on: true }; await saveSettings(); });
    const tokC = await us.evaluate(async () => { const c = getContract('MK-IT');
      const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'email', purpose: 'negotiate', expiryDays: 30, recipient: { name: 'Erik Lindqvist', email: 'erik2@parcelway.example' } });
      return r && (r.token || (r.share && r.share.token)); });
    h.mail.reset();
    const cp = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    await cp.goto(h.base + '/#share=t:' + tokC, { waitUntil: 'networkidle' });
    await until(cp, () => !!document.getElementById('pt-code-in'), null, 10000); await cp.waitForTimeout(1200);
    const codeScreen = await cp.evaluate(() => !!document.querySelector('.pt-code-out .pnl-bar'));
    const code = h.mail.sent.find(m => /code/i.test(m.subject));
    const tokS = await us.evaluate(async () => { const c = getContract('MK-IT');
      const r = await api('shares', 'POST', { payload: buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'status' }), channel: 'link', purpose: 'status', recipient: { name: 'Erik Lindqvist', email: 'erik@parcelway.example' } });
      return r && (r.token || (r.share && r.share.token)); });
    await cp.goto(h.base + '/deal/' + tokS, { waitUntil: 'networkidle' });
    const status = await cp.evaluate(() => /A read-only page from/.test(document.body.innerText));
    await cp.context().close();
    check('7 · the invitation is the drawn letter without the sender\'s new look; the reminder is a letter; the code opens the link; the code screen and the status page wear the black bar',
      !!(invite && invite.body.html && /^Dear Erik,/.test(invite.text)) && !!(rem && rem.body.html && /is waiting for you$/.test(rem.subject) && /Kind regards/.test(rem.text))
        && !!(code && /to open/.test(code.subject) && !/to sign this contract/.test(code.text)) && codeScreen && status,
      { invite: invite && invite.subject, rem: rem && rem.subject, code: code && code.subject, codeScreen, status });
  } catch (e) { check('7', false, String(e).slice(0, 200)); }

  /* 8 */
  try {
    const ph = await theirs(390, 844);
    await ph.waitForTimeout(800);
    const sx = await ph.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check('8 · the phone: nothing moves sideways', sx <= 0, { sx });
    await ph.context().close();
  } catch (e) { check('8', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
