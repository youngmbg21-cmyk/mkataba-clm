/* THE NEW LOOK: APPROVE, SIGN, LIVE (round 5, 1 Nov 2026; the review room's Approvals & signing, Before you sign,
   Obligations, Proposed, Calendar Agenda · Week · Horizon, History with the wording, Amend; behind the switch).
   The round's own world (test/round5-world.js): an approval Wanjiru asked for, a contract Nandi has signed and it is
   your turn, a late duty and one due, duties Jambo found on arrival, a signed contract with its past, renewals.
   With the switch on, at the owner's first screen:
     1 · Approvals: one worklist (Agreement · What it rests on · Rule · Waited), Approve and Decline on the row, the
         signing rows under it; the panel "Before you decide" with what the paper says, After, and its own three links
     2 · Before you sign: the six-line checklist (Details · standards · Approval · Nandi signed · Your turn · Then),
         "Nothing blocks you." with Sign and Read it first; the line says "Ready to sign"; the paper ends in two ruled lines
     3 · Obligations: the filter box and the tabs on one line (Proposed among them), Late first with the words it rests on
     4 · Proposed stands where the list stands, under the tabs, with Whose job's three answers and the Reminder row
     5 · Calendar Agenda: the late duty first, today's approval, an empty week one line; Horizon: each row its own months
     6 · History with the wording: the nudge, the duty done, the approval with its note under it, both changes as one row
     7 · Amend: the sealed paper and the amendment side by side, the line's Discard and Create the amendment (grey)
   And the switch off:
     8 · Approvals, Obligations and the Calendar are drawn as before
   At the parent (before this round) 1–7 fail: none of it is drawn.
   Run: node test/chromium/round5-new-look-verify.js   (pictures: ROUND5_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedRound5, R5_IN_PAGE } = require('../round5-world');

const OUT = process.env.ROUND5_SHOTS || path.join(__dirname, 'shots', 'round5-new-look');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel).catch(() => '');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedRound5(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  const shot = async k => { try { await page.screenshot({ path: path.join(OUT, k + '.png') }); } catch (_) {} };
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract('MK-A2'), null, 40000);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
  await page.evaluate(R5_IN_PAGE);

  /* 1 · Approvals */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'approvals' }));
    const up = await until(page, () => !!document.querySelector('.apn-table [data-ap-row]'), null, 15000);
    const heads = up ? await page.evaluate(() => [...document.querySelectorAll('.apn-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean)) : [];
    const row = up ? await page.evaluate(() => { const r = document.querySelector('.apn-table [data-ap-kind="approval"]'); return r ? { approve: !!r.querySelector('[data-ap-approve]'), decline: !!r.querySelector('[data-ap-refuse]'), quote: !!r.querySelector('.apn-q') } : null; }) : null;
    const signing = up ? await page.evaluate(() => !!document.querySelector('.apn-table [data-ap-kind="signature"] [data-ap-open]')) : false;
    if (up) await page.click('.apn-table [data-ap-kind="approval"] td');
    const panel = up && await until(page, () => !!document.querySelector('#ins-panel .apn-panel'), null, 8000);
    const tab = await txt(page, '#ins-panel [data-jl-home]');
    const links = await page.evaluate(() => [...document.querySelectorAll('#ins-panel .jb-ways.is-own [data-apn-go]')].map(b => b.getAttribute('data-apn-go')));
    const junk = /\[object Object\]/.test(await txt(page, '#ins-panel'));
    await shot('1-approvals');
    check('1 Approvals: one worklist, Approve and Decline on the row, signing under it; Before you decide with its own links', up && heads.join('|') === 'agreement|what it rests on|rule|waited'
      && !!row && row.approve && row.decline && row.quote && signing && panel && /before you decide/i.test(tab) && links.includes('clause') && links.includes('hist') && !junk,
      { heads, row, signing, panel, tab, links, junk });
  } catch (e) { check('1 Approvals', false, String(e).slice(0, 200)); }

  /* 2 · Before you sign */
  try {
    await page.evaluate(() => { roomHomeLand('MK-A2'); });
    await until(page, () => !!document.querySelector('#ig-canvas'), null, 15000);
    await page.evaluate(() => pdSignOpen('MK-A2'));
    const up = await until(page, () => document.querySelectorAll('#pd-signface .pd2-sg-r').length >= 5, null, 15000);
    const rows = up ? await page.evaluate(() => [...document.querySelectorAll('#pd-signface .pd2-sg-r')].map(r => [r.className.replace(/.*is-/, ''), r.querySelector('b').innerText.trim()])) : [];
    const card = await txt(page, '#pd-signface .pd2-sg-card');
    const btns = await page.evaluate(() => ({ sign: !!document.querySelector('#pd-signface [data-pd2-sign]'), read: !!document.querySelector('#pd-signface [data-pd2-sign-read]') }));
    const line = await txt(page, '#ig-strip .ig-line-sg');
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .igd-head .pd-tab')].map(x => x.innerText.trim()).filter(Boolean));
    const paperEnd = await page.evaluate(() => document.querySelectorAll('#ig-canvas .sig2 .sig2-col').length);
    await shot('2-sign');
    check('2 Before you sign: six lines, Nothing blocks you with Sign and Read it first, the line says Ready to sign, the paper ends in two ruled lines',
      rows.length === 6 && /details/i.test(rows[0][1]) && /standards/i.test(rows[1][1]) && /approval/i.test(rows[2][1]) && /signed/i.test(rows[3][1]) && /your turn/i.test(rows[4][1]) && /then/i.test(rows[5][1])
      && /nothing blocks you/i.test(card) && btns.sign && btns.read && /ready to sign/i.test(line) && /before you sign/i.test(tabs[0] || '') && paperEnd === 2,
      { rows, card: card.slice(0, 60), btns, line, tabs, paperEnd });
  } catch (e) { check('2 Before you sign', false, String(e).slice(0, 200)); }

  /* 3 · Obligations, the project list (owner picked "The SAP Way, the project list", 10 Nov 2026;
     re-pointed from round 5's box-and-tabs-on-one-line and its pop-up desk) */
  try {
    await page.evaluate(() => setView('obligations'));
    const up = await until(page, () => !!document.querySelector('.obn-page .obn-table'), null, 15000);
    const pills = up ? await page.evaluate(() => [...document.querySelectorAll('.obn-bar [data-obn-tab]')].map(b => b.getAttribute('data-obn-tab'))) : [];
    const box = up ? await page.evaluate(() => !!document.querySelector('.obn-bar2r #obn-q') && !document.querySelector('.obn-bar #obn-q')) : false;
    const row = up ? await page.evaluate(() => { const r = document.querySelector('.obn-table tr.obn-r'); if (!r) return null;
      const c1 = r.querySelector('td.obn-c1'), ch = r.querySelector('.obn-ch');
      return { band: c1 ? getComputedStyle(c1).borderLeftWidth : '', tone: ch ? ch.className : '', when: ch ? ch.textContent.trim() : '',
        who: (r.querySelector('.obn-who') || {}).textContent, act: (r.querySelector('.obn-act .obn-pill') || {}).innerText || '' }; }) : null;
    const foot = up ? await txt(page, '.obn-pager .obn-pg-say') : '';
    await shot('3-obligations');
    check('3 Obligations: three pills over the filter line; a row carries its stream band, its day as a tone chip and one act; the foot says where in the book you are',
      up && box && pills.includes('open') && pills.includes('prop') && !!row && row.band === '3px' && /obn-ch is-(ruby|amber|green|gray)/.test(row.tone)
      && !!String(row.who || '').trim() && /mark done|chase|decide/i.test(row.act) && /showing 1/i.test(foot), { pills, box, row, foot });
  } catch (e) { check('3 Obligations', false, String(e).slice(0, 200)); }

  /* 4 · Proposals by agreement, answered where the row stands */
  try {
    await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="prop"]'); if (b) b.click(); });
    const up = await until(page, () => !!document.querySelector('.obn-table.is-proj .obn-pr'), null, 10000);
    const heads = up ? await page.evaluate(() => [...document.querySelectorAll('.obn-table.is-proj thead th')].map(t => t.textContent.trim()).filter(Boolean)) : [];
    const pr = up ? await page.evaluate(() => { const r = document.querySelector('.obn-pr'); return r ? { ring: !!r.querySelector('.obn-ring'), bar: !!r.querySelector('.obn-bar2 i'),
      said: (r.querySelector('.obn-pgb small') || {}).textContent, status: (r.querySelector('.obn-stt .obn-ch') || {}).textContent,
      open: (r.querySelector('[data-obn-open]') || {}).innerText, add: (r.querySelector('[data-obn-addall]') || {}).innerText } : null; }) : null;
    await page.evaluate(() => { const b = document.querySelector('[data-obn-open]'); if (b) b.click(); });
    await until(page, () => !!document.querySelector('.obn-dr'), null, 5000);
    const duty = await page.evaluate(() => { const r = document.querySelector('.obn-dr'); return r ? { whose: r.querySelectorAll('[data-obn-whose]').length,
      on: !!r.querySelector('.obn-wh.is-on'), skip: !!r.querySelector('[data-obn-skip]'), quote: !!r.querySelector('.obn-q i') } : null; });
    const side = /start with|nothing is waiting/i.test(await txt(page, '#ins-panel'));
    await shot('4-proposals');
    check('4 Proposals: one row per agreement with its progress and status, the duties answered under it, three answers and Add all; the panel says where to start',
      up && heads.length === 5 && !!pr && pr.ring && pr.bar && /decided/i.test(pr.said || '') && !!String(pr.status || '').trim() && /^open/i.test(pr.open || '')
      && /^add all/i.test(pr.add || '') && !!duty && duty.whose === 3 && duty.on && duty.skip && side, { heads, pr, duty, side });
  } catch (e) { check('4 Proposals', false, String(e).slice(0, 200)); }

  /* 5 · Calendar */
  try {
    await page.evaluate(() => { caGo({ kind: 'go', place: 'calendar' }); });
    await until(page, () => typeof calSetView === 'function' && !!document.querySelector('.cal-page'), null, 15000);
    await page.evaluate(() => { if (calView() !== 'agenda') calSetView('agenda'); });
    const up = await until(page, () => !!document.querySelector('.cal-nl .cal-nl-r'), null, 10000);
    const rows = up ? await page.evaluate(() => [...document.querySelectorAll('.cal-nl .cal-nl-r')].slice(0, 6).map(r => r.innerText.replace(/\s+/g, ' ').trim())) : [];
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.cal-head.is-nl .cal-nl-tabs a')].map(a => a.innerText.trim()));
    await shot('5-agenda');
    await page.evaluate(() => calSetView('horizon'));
    const hz = await until(page, () => !!document.querySelector('.cal-hz-row.is-nl .cal-hz-rm'), null, 10000);
    const foot = await txt(page, '.cal-hz-foot');
    await shot('5-horizon');
    check('5 Calendar: the views as words; the agenda leads with the late duty, then today\'s approval, an empty week one line; Horizon rows carry their own months',
      up && tabs.join('|') === 'Agenda|Month|Week|Horizon' && /^late/i.test(rows[0] || '') && /approve/i.test(rows[1] || '') && rows.some(r => /^week of .* nothing due/i.test(r) || /quiet weeks?$/i.test(r)) /* RE-POINTED (the harmony review, FOLD THE QUIET, 9 Nov 2026): a run of empty weeks is one line, "16 Nov – 3 Jan 7 quiet weeks" */ && hz && /soonest first/i.test(foot),
      { tabs, rows: rows.map(r => r.slice(0, 50)), hz, foot });
  } catch (e) { check('5 Calendar', false, String(e).slice(0, 200)); }

  /* 6 · History with the wording */
  try {
    await page.evaluate(() => { roomHomeLand('MK-A1'); });
    await until(page, () => !!document.querySelector('#ig-canvas'), null, 15000);
    await page.evaluate(() => hbStripBring('MK-A1', 'hist'));
    await until(page, () => !!document.getElementById('hist-detail'), null, 15000);
    await page.evaluate(() => { const b = document.getElementById('hist-detail'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    const up = await until(page, () => document.querySelectorAll('.hist-wfull').length >= 3, null, 10000);
    const says = up ? await page.evaluate(() => [...document.querySelectorAll('.hist-tr .hist-text')].map(x => x.innerText.trim())) : [];
    const words = up ? await page.evaluate(() => [...document.querySelectorAll('.hist-wfull .hist-wcap')].map(x => x.innerText.trim())) : [];
    await shot('6-history');
    check('6 History: the nudge, the duty done, the approval with its note under it, both changes as one row',
      up && says.some(s => /^nudged:/i.test(s)) && says.some(s => /^marked done:/i.test(s)) && says.some(s => /^approved under the rule/i.test(s)) && says.some(s => /both changes of round 1/i.test(s))
      && words.some(w => /words the duty rests on/i.test(w)) && words.some(w => /note, kept with the decision/i.test(w)), { says: says.slice(0, 8), words });
  } catch (e) { check('6 History', false, String(e).slice(0, 200)); }

  /* 7 · Amend */
  try {
    await page.evaluate(() => { roomHomeLand('MK-A1'); });
    await until(page, () => !!document.querySelector('#ig-canvas'), null, 15000);
    await page.evaluate(() => pdAmendOpen('MK-A1'));
    const up = await until(page, () => !!document.querySelector('#ig-paper .ig-zoom.is-am2 .pd2-am-sheet'), null, 15000);
    const side = up ? await page.evaluate(() => { const a = document.querySelector('#ig-paper .ig-zoom.is-am2 > .blueprint'), b = document.querySelector('#ig-paper .pd2-am-col'); if (!a || !b) return null;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return { beside: rb.left >= ra.right - 2 && Math.abs(rb.top - ra.top) < 4 }; }) : null;
    const acts = await page.evaluate(() => { const c = document.querySelector('[data-pd2-am-create]'); return { discard: !!document.querySelector('[data-pd2-am-discard]'), create: !!c, grey: !!(c && c.disabled) }; });
    const face = await txt(page, '#pd-amendface');
    const ph = await page.evaluate(() => (document.getElementById('igd-input') || {}).placeholder || '');
    await shot('7-amend');
    check('7 Amend: the sealed paper and the amendment side by side, Discard and Create the amendment (grey until a change), the reading, the box takes the change',
      up && !!side && side.beside && acts.discard && acts.create && acts.grey && /as amended/i.test(face) && /say the change/i.test(ph), { side, acts, ph });
  } catch (e) { check('7 Amend', false, String(e).slice(0, 200)); }

  /* 8 · the switch off: as before */
  try {
    await page.evaluate(async () => { const x = document.querySelector('[data-pd2-am-discard]'); if (x) x.click(); await stPrefSet('newLook', false); newLookApply(); });
    await page.evaluate(() => caGo({ kind: 'go', place: 'approvals' }));
    await until(page, () => !!document.querySelector('.ap-table'), null, 15000);
    const ap = await page.evaluate(() => ({ nl: !!document.querySelector('.apn-table') }));
    await page.evaluate(() => setView('obligations'));
    await until(page, () => !!document.querySelector('.obw-ins, .obw-weeks'), null, 15000);
    const ob = await page.evaluate(() => ({ nl: !!document.querySelector('.obn-page') }));
    check('8 the switch off: Approvals and Obligations as before', !ap.nl && !ob.nl, { ap, ob });
  } catch (e) { check('8 switch off', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
