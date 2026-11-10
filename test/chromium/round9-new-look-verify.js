/* THE NEW LOOK, ROUND 9 (3 Nov 2026; the owner's answers: read down as a SECOND view of the Board, and a failed send
   keeping today's way, drawn in the new look; the phone's bar unchanged).
     1 · Off: the Board has no Read down; a refused email says today's amber box under the form
     2 · On: Read down beside DNA in the Board's head; pressed, the page as drawn — the eyebrow (no call), the title,
         five sentences each with where it was read and a door, the quarters, the doors at the foot; Jambo's panel
         reads what was read. The first sentence counts the book the page reads
     3 · A sentence's door goes there; ‹ Board comes back
     4 · On, a refused email: Before you send says Not sent, why, Tried · Their link · Record · Mail health, with Try
         again and Copy the link to send yourself; the box under the form folds; the button says "see beside"
     5 · Copy the link to send yourself is today's hand-over: the history says the link was copied to send by hand
   At the parent (before this round) 2–5 fail: none of it exists.
   Run: node test/chromium/round9-new-look-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHatiWithMail } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHatiWithMail({ mode: 'refuse', status: 504, message: 'The mail server did not answer within 30 seconds.' });
  await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  const send = async () => {
    await page.evaluate(async () => { const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c); openShareModal(c); });
    await until(page, () => !!document.getElementById('share-send'), null, 15000);
    await page.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); if (e && !e.value){ e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } }; set('sh-name', 'Erik Lindqvist'); set('sh-email', 'erik@parcelway.example'); });
    await page.click('#share-send');
    await until(page, () => /Not delivered|Not sent/.test(((document.getElementById('sh-result') || {}).innerText || '') + ((document.getElementById('sh-lt-verdict') || {}).innerText || '')), null, 20000);
    await page.waitForTimeout(400);
  };
  const shut = () => page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });

  /* 1 · off */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
    await until(page, () => !!document.querySelector('#hb-bhead'), null, 20000);
    const rd = await page.evaluate(() => !!document.querySelector('[data-hb-rdn]'));
    await send();
    const S = await page.evaluate(() => ({ box: /Not delivered/.test((document.getElementById('sh-result') || {}).innerText || ''), ns: !!document.querySelector('#sh-lt-verdict.is-notsent') }));
    check('1 off: no Read down on the Board; a refused email says today\'s box under the form', !rd && S.box && !S.ns, { rd, ...S });
    await shut();
  } catch (e) { check('1 off', false, String(e).slice(0, 200)); }

  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });

  /* 2 · read down */
  try {
    /* RE-POINTED (10 Nov 2026: Home deleted): the reader is already on the Board, so it is drawn again in the look now on
       (the step used to pass through Home first, which drew it fresh) */
    await page.evaluate(() => { caGo({ kind: 'go', place: 'board' }); if (typeof hbPaintBoard === 'function') hbPaintBoard(); });
    await until(page, () => (state.view === 'dashboard' && !document.body.classList.contains('pre-auth') && !!document.getElementById('hb-bhead')), null, 15000);
    await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
    const btn = await until(page, () => !!document.querySelector('#hb-bhead [data-hb-rdn]') && !!document.querySelector('#hb-bhead [data-hb-dna]'), null, 20000);
    if (btn) await page.click('#hb-bhead [data-hb-rdn]');
    const up = await until(page, () => !!document.querySelector('#rd-page') && /Read from the records/i.test((document.querySelector('#ig-dock') || document.body).innerText), null, 15000);
    const S = up ? await page.evaluate(() => ({ eyebrow: document.querySelector('.rd-eyebrow').textContent, h: document.querySelector('.rd-h').textContent,
      rows: [...document.querySelectorAll('.rd-row')].map(r => ({ t: r.querySelector('.rd-t').textContent, src: r.querySelector('.rd-src b').textContent, go: (r.querySelector('[data-rd-go]') || {}).dataset ? r.querySelector('[data-rd-go]').dataset.rdGo : '' })),
      qs: document.querySelectorAll('.rd-q').length, foot: [...document.querySelectorAll('.rd-foot [data-rd-go]')].map(b => b.dataset.rdGo), n: hbRdnBook().length })) : null;
    check('2a Read down sits beside DNA in the Board\'s head', btn);
    /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */ 
    check('2b the page as drawn: no cost said, the title, five sentences each with its source and door, the quarters, the doors at the foot', !!S && !/call|free/i.test(S.eyebrow) && S.h === 'Your book, read down.'
      && S.rows.length === 5 && S.rows.every(r => r.src && r.go) && S.qs >= 1 && S.foot.join() === 'needs,contracts,calendar,explorer,negotiations,activity', S && { rows: S.rows.map(r => r.go), qs: S.qs, foot: S.foot });
    check('2c the first sentence counts the book the page reads; Jambo\'s panel reads the records', !!S && S.rows[0].t.includes(`${S.n} agreements`), S && S.rows[0].t);
  } catch (e) { check('2 read down', false, String(e).slice(0, 200)); }

  /* 3 · a door goes there; back comes back */
  try {
    await page.click('.rd-row [data-rd-go="calendar"]');
    const went = await until(page, () => !document.querySelector('#rd-page') && !!document.querySelector('#hb-cal'), null, 15000);
    await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
    await until(page, () => !!document.querySelector('#hb-bhead [data-hb-rdn]'), null, 15000);
    await page.click('#hb-bhead [data-hb-rdn]');
    await until(page, () => !!document.querySelector('#rd-page'), null, 10000);
    await page.click('[data-rd-back]');
    const back = await until(page, () => !document.querySelector('#rd-page') && !!document.querySelector('#hb-bhead'), null, 10000);
    check('3 a sentence\'s door goes there (Calendar); ‹ Board comes back', went && back, { went, back });
  } catch (e) { check('3 doors', false, String(e).slice(0, 200)); }

  /* 4 · a refused email, as drawn */
  try {
    await send();
    const S = await page.evaluate(() => { const v = document.querySelector('#sh-lt-verdict.is-notsent');
      return { ns: !!v, h: v ? v.querySelector('.sh-ns-h').textContent : '', why: v ? v.querySelector('.sh-ns-why').textContent : '', rows: v ? [...v.querySelectorAll('.sh-ns-r span')].map(s => s.textContent) : [],
        acts: v ? [...v.querySelectorAll('[data-sh-ns]')].map(b => b.dataset.shNs) : [], folded: getComputedStyle(document.getElementById('sh-result')).display === 'none',
        btn: (document.getElementById('share-send') || {}).textContent || '' }; });
    check('4 Before you send says Not sent and why, the four rows and both doors; the box under the form folds; the button says see beside', S.ns && /Not sent/.test(S.h) && /did not answer within 30 seconds/.test(S.why)
      && S.rows.join('|') === 'Tried|Their link|Record|Mail health' && S.acts.join() === 'again,hand' && S.folded && /see beside/.test(S.btn), S);
  } catch (e) { check('4 not sent', false, String(e).slice(0, 200)); }

  /* 5 · copying the link is today's hand-over */
  try {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.click('[data-sh-ns="hand"]');
    const ok = await until(page, () => (getContract('MK-IT').audit || []).some(a => /copied the link/.test(String(a.detail || ''))), null, 10000);
    check('5 Copy the link to send yourself is today\'s hand-over: the history says so', ok);
  } catch (e) { check('5 by hand', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
