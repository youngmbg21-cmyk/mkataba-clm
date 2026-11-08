/* THE NEW LOOK, ROUND 8 SECOND HALF (2 Nov 2026; the review room's drawing of the other side's negotiation page,
   behind the company's own setting "the new look for people outside", off by default).
     1 · Off: their page is today's — the change column beside the paper, no black bar
     2 · On, as drawn: the black bar (their party · your view of … with us), the tabs underlined with "Redlines · 2
         answers for you", Download Word and More; "Where we are" on the right (what waits, the six-stop road with
         your move, Still open); the paper with a numbered dot after each of our asks and a note beside it with
         Accept · Counter · Reject; the foot bar with Save for later and Send back · 0 of 2, grey
     3 · A note's Accept presses the card's own Accept: the note says it is accepted, the tab counts one, Send back
         reads 1 of 2 and is live
     4 · More holds today's verbs (the bell, Notes, Decline); Esc shuts it
     5 · Send back presses the column's own postbox
   At the parent (before this half) 2–5 fail: none of it exists.
   Run: node test/chromium/round8-their-page-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati(); await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const us = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  await us.goto(h.base + '/', { waitUntil: 'networkidle' });
  await us.fill('#li-email', 'admin@example.co.ke'); await us.fill('#li-pass', 'adminpassword1'); await us.click('#li-go');
  await until(us, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  await us.evaluate(W.R7_IN_PAGE);
  /* our answers to their round, each with its why, sent to Erik on a live link */
  const tok = await us.evaluate(async () => {
    const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c);
    const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
    const by = re => cls.find(x => re.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
    const pay = by(/Payment/), lia = by(/Limitation/);
    if (pay) await negoEditClause(c, pay.clauseId, '<p>Customer shall pay each correct invoice within 45 days of receipt. Interest on late payment runs at the Central Bank rate plus two per cent from the due date.</p>', { side: 'owner', author: 'Amina Otieno', why: '45 is where our last agreement landed; clause 24 already resolves disputes.' });
    if (lia) await negoEditClause(c, lia.clauseId, '<p>Each Party\'s total liability under this agreement shall not exceed nine (9) months of Charges paid or payable in the year the claim arises.</p>', { side: 'owner', author: 'Amina Otieno', why: 'Nine months is where our standard holds.' });
    if (window.persist) await persist(c); if (window.flushSaves) await flushSaves();
    const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
    const r = await api('shares', 'POST', { payload, channel: 'link', purpose: 'negotiate', durable: true, recipient: { name: 'Erik Lindqvist', email: 'erik@parcelway.example' } });
    return r && (r.token || (r.share && r.share.token));
  });
  const theirs = async () => {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    p.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
    await p.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
    await until(p, () => !!document.getElementById('pt-tab-redlines'), null, 20000);
    await p.click('#pt-tab-redlines');
    await until(p, () => !!document.querySelector('#pt-nego .rl-paper'), null, 15000);
    return p;
  };

  /* 1 · off */
  try {
    const p = await theirs();
    const S = await p.evaluate(() => ({ bar: !!document.querySelector('.pol-bar'), side: !!document.querySelector('.pol-side'),
      col: !!document.querySelector('#rl-side') && getComputedStyle(document.querySelector('#rl-side')).display !== 'none' }));
    check('1 off: their page as today, the change column beside the paper, no black bar', !!tok && !S.bar && !S.side && S.col, S);
    await p.context().close();
  } catch (e) { check('1 off', false, String(e).slice(0, 200)); }

  await us.evaluate(async () => { state.settings = state.settings || {}; state.settings.outsideLook = { on: true }; await saveSettings(); });

  /* 2 · on, as drawn */
  let p = null;
  try {
    p = await theirs();
    const up = await until(p, () => document.querySelectorAll('.pol-note').length >= 2, null, 15000);
    /* RE-POINTED 8 Nov 2026 (their pages as ours): the panel opens on our cards; Where we are is its second face,
       and the road is the four stops every party sees */
    if (up) { await p.click('[data-pol-face="where"]'); await p.waitForTimeout(400); }
    const S = up ? await p.evaluate(() => ({
      bar: (document.querySelector('.pol-bar') || {}).innerText || '',
      tab: (document.getElementById('pt-tab-redlines') || {}).textContent || '',
      top: [...document.querySelectorAll('.pol-top .pol-pill')].map(b => b.textContent.trim()),
      say: (document.querySelector('.pol-say') || {}).textContent || '',
      road: [...document.querySelectorAll('.pol-road li')].map(l => l.className),
      move: (document.querySelector('.pol-rd-mv') || {}).textContent || '',
      open: document.querySelectorAll('.pol-open li').length,
      col: getComputedStyle(document.querySelector('#rl-side')).display,
      dots: [...document.querySelectorAll('.pol-dot')].map(d => d.textContent),
      note: (document.querySelector('.pol-note') || {}).innerText || '',
      acts: [...document.querySelectorAll('.pol-note')[0].querySelectorAll('[data-pol-act]')].map(b => b.dataset.polAct),
      send: (document.getElementById('pol-send') || {}).textContent || '', sendOff: (document.getElementById('pol-send') || {}).disabled,
      later: !!document.getElementById('pol-later') })) : null;
    check('2a the black bar, the tabs with the count, Download Word and More', !!S && /Parcelway Logistics Ltd · your view of .+ with Highland Corporate Ltd/.test(S.bar) && /Erik Lindqvist/.test(S.bar)
      && /Redlines · 2 answers for you/.test(S.tab) && S.top.join('|') === 'Download Word|More', S && { bar: S.bar, tab: S.tab, top: S.top });
    check('2b Where we are, the panel\'s second face: what waits, the four-stop road with your move, Still open; our cards stay under it', !!S && /2 answers wait for your decision/.test(S.say)
      && S.road.length === 4 && S.road[1] === 'is-now' && /your move/i.test(S.move) && S.open === 2 && S.col !== 'none', S && { say: S.say, road: S.road, open: S.open, col: S.col });
    if (up) { await p.click('[data-pol-face="red"]'); await p.waitForTimeout(300); }
    check('2c a numbered dot after each of our asks and a note beside it: Accept · Counter · Reject', !!S && S.dots.join(',') === '1,2' && /answers 45 days/.test(S.note) && /45 is where our last agreement landed/.test(S.note)
      && S.acts.join('|') === 'accept|counter|reject', S && { dots: S.dots, note: S.note, acts: S.acts });
    check('2d the foot bar: Save for later, Send back · 0 of 2, grey', !!S && S.later && /Send back · 0 of 2/.test(S.send) && S.sendOff === true, S && { send: S.send, off: S.sendOff });
  } catch (e) { check('2 on', false, String(e).slice(0, 200)); }

  /* 3 · Accept on the note is the card's own Accept */
  try {
    await p.click('.pol-note [data-pol-act="accept"]');
    const ok = await until(p, () => /You accepted it/.test((document.querySelector('.pol-note') || {}).innerText || '')
      && /1 answer for you/.test(document.getElementById('pt-tab-redlines').textContent)
      && /Send back · 1 of 2/.test(document.getElementById('pol-send').textContent) && !document.getElementById('pol-send').disabled, null, 10000);
    const card = await p.evaluate(() => !!document.querySelector('#pt-nego [data-nego-undo]'));
    check('3 a note\'s Accept presses the card\'s own: the note says so, the tab counts one, Send back 1 of 2 is live', ok && card, { ok, card });
  } catch (e) { check('3 accept', false, String(e).slice(0, 200)); }

  /* 4 · More */
  try {
    await p.click('#pol-more');
    const open = await until(p, () => { const pop = document.getElementById('pol-pop'); return !!pop && !pop.hidden && !!pop.querySelector('#pt-bell') && !!pop.querySelector('#pt-notes-door') && !!pop.querySelector('#pt-nego-decline'); }, null, 5000);
    await p.keyboard.press('Escape');
    const shut = await until(p, () => document.getElementById('pol-pop').hidden, null, 5000);
    check('4 More holds today\'s verbs (the bell, Notes, Decline); Esc shuts it', open && shut, { open, shut });
  } catch (e) { check('4 more', false, String(e).slice(0, 200)); }

  /* 5 · Send back opens the panel's Send back face (RE-POINTED 8 Nov 2026: the check before send stands in the panel;
     its own button sends — their-pages-as-ours-verify 5 drives it to the end) */
  try {
    await p.click('#pol-send');
    const face = await until(p, () => !!document.getElementById('pol-send-go') && document.getElementById('pw-page').getAttribute('data-pol-shows') === 'send', null, 5000);
    check('5 Send back opens the panel\'s Send back face, with its one button', face);
  } catch (e) { check('5 send back', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
