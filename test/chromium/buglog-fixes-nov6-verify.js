/* THE BUG LOG'S TOP FIXES (owner's overnight order, 6 Nov 2026: "fix the top 10 bugs in the bug log"). Each a
   "Noticed, not fixed" line, reproduced first, fixed in the same change:
     1 · (31 Oct) the bell's obligation words: an obligation named by title read "Overdue:" with nothing after it
     2 · (1 Nov) New agreement: with words typed in the sheet, Board on Home asks "Leave?" first (it put the sheet away unasked)
     3 · (RETIRED 16 Nov 2026, #762, old look only) (28 Oct, old look) Parties' panel: "Draft an agreement with <long party>" stays inside the panel (it ran 137px past it)
     4 · (RETIRED 16 Nov 2026, #762, old look only) (31 Oct, old look) the Handbook's "Which one do I need?" table scrolls in its own box; the page never sideways
     5 · (28 Oct) a history or status send hides the "Clause N stays here" cards (no wording travels); a negotiation send shows them
     6 · (29 Oct) the AI involvement record counts changes noted "Jambo — …" as well as "Copilot — …"
   At the parent 1–6 fail.
   Run: node test/chromium/buglog-fixes-nov6-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const h = await startHati();
  const cs = W.r7Contracts();
  /* an obligation named by title only, three days late (home-morning's seed had the same shape) */
  const late = fixtureContract('MK-LATE', 'Pallet Supply', 'Kenpoly', 'proc', 900000, 'Signed');
  late.obligations = [{ id: 'o1', title: 'Return the pallets', due: day(-3), owner: 'us', assignee: 'admin@example.co.ke' }];
  /* a party with a long name, for the old look's panel */
  const long = fixtureContract('MK-LONG', 'Warehouse Services Agreement', 'The East African Breweries Distribution and Logistics Company Limited', 'proc', 5200000, 'Under Review');
  await seedWorkspace(h, { contracts: cs.concat([late, long]) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-LATE'), null, 40000);
  await page.evaluate(W.R7_IN_PAGE);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });

  /* 1 */
  const a1 = await page.evaluate(() => { let L = []; try { L = (typeof buildAlerts === 'function') ? buildAlerts() : []; } catch (_){ L = []; }
    return L.filter(a => a && /Overdue/.test(String(a.text || a.title || ''))).map(a => String(a.text || a.title)).slice(0, 4); });
  check('1 · the bell says "Overdue: Return the pallets" for an obligation named by title', a1.some(t => /Overdue: Return the pallets/.test(t)) && !a1.some(t => /Overdue:\s*$/.test(t)), a1);

  /* 2 */
  await page.evaluate(() => { caGo({ kind: 'go', place: 'board', cid: null }); }); await page.waitForTimeout(800);
  await page.evaluate(() => caGo({ kind: 'go', place: 'draft', cid: null }));
  const up = await until(page, () => typeof naSheetUp === 'function' && naSheetUp() && !!document.querySelector('#na-words textarea, #na-words input, #na-q, #dr-say'), null, 10000);
  const a2 = await page.evaluate(async () => { const q = document.querySelector('#na-words textarea, #na-words input, #na-q, #dr-say'); q.value = 'A supply agreement with Kabras'; q.dispatchEvent(new Event('input', { bubbles: true }));
    caGo({ kind: 'go', place: 'board', cid: null }); await new Promise(x => setTimeout(x, 1000));
    const asked = !!document.getElementById('confirm-overlay'); const stillUp = naSheetUp();
    const stay = document.querySelector('#confirm-overlay [data-dlg-cancel], #confirm-overlay button'); return { asked, stillUp, words: ((document.getElementById('confirm-overlay') || {}).innerText || '').slice(0, 80) }; });
  check('2 · New agreement with words typed: Board asks before putting the sheet away', up && a2.asked && a2.stillUp, a2);
  await page.evaluate(() => { const o = document.getElementById('confirm-overlay'); const b = o && [...o.querySelectorAll('button')].find(x => /Cancel|Stay|Keep/i.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (window._naBack) _naBack = null; try { closeModal(); } catch (_){} });

  /* 5 (new look; the cards' hiding is the purpose's, injected where the column stands) */
  await page.evaluate(async () => { const c = getContract('MK-IT'); if (window.ensureFull) await ensureFull(c); openShareModal(c); });
  await until(page, () => !!document.getElementById('sh-lt-goes'), null, 10000);
  /* RE-WRITTEN 10 Nov 2026 (it failed with every reading false, on code it does not touch): a press can redraw the letter's
     column, wiping the card this check puts beside it, so each reading first puts the card back where the column stands
     and presses again when the card was wiped — the rule read (shareGoesPaint hides [data-sh-lt-stays]) is unchanged */
  const a5 = await page.evaluate(async () => {
    let card = null;
    const ensure = () => { if (card && card.isConnected) return; const col = document.getElementById('sh-lt-goes'); if (!col) return;
      card = document.createElement('div'); card.className = 'sh-lt-card is-stays'; card.setAttribute('data-sh-lt-stays', 'x1'); card.textContent = 'Clause 7 stays here'; col.parentElement.insertBefore(card, col); };
    /* the purpose is changed as a person changes it: the What goes list's own rows (status is a hidden row, pressed all the same) */
    const press = k => { const b = document.querySelector(`[data-share-purpose="${k}"]`); if (!b) return 'no ' + k; b.click(); return true; };
    const beat = () => new Promise(x => setTimeout(x, 400));
    const read = async k => { for (let i = 0; i < 3; i++){ ensure(); press(k); await beat(); if (card && card.isConnected) return card.hidden; } return null; };
    const r = {}; r.pressed = [press('status'), press('negotiate')];
    r.status = await read('status'); r.negotiate = await read('negotiate'); r.history = r.status;
    return r; });
  check('5 · a history or status send hides the "stays here" cards; a negotiation send shows them', a5.history === true && a5.status === true && a5.negotiate === false, a5);
  await page.evaluate(() => { try { closeModal(); } catch (_){} });

  /* 6 */
  const a6 = await page.evaluate(() => ({ jambo: aiTraceFromCopilot({ note: 'Jambo — counter at 45 days' }), copilot: aiTraceFromCopilot({ note: 'Copilot — hold' }), person: aiTraceFromCopilot({ note: 'Amina: keep 30' }) }));
  check('6 · the AI involvement record counts "Jambo — …" changes as Jambo\'s, a person\'s note not', a6.jambo && a6.copilot && !a6.person, a6);

  /* RETIRED 16 Nov 2026 (#762): 3 and 4 were measured with the new look switched off (the old Parties panel's draft
     button, the old Handbook's table) — there is no off; the new look's Parties and Handbook are pinned by their own rounds */

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
