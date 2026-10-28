/* JAMBO ASKS — A COUNTING QUESTION IN ASK A COLUMN (round 3 of the review; the owner picked "Jambo asks" and
   "Jambo" for the rewording, 28 Oct 2026). On 16 contracts, five of which grant a rebate:
     1 · "How many of my contracts are in Procurement?" is answered from the records, free, in Jambo's grey
         card ("8 of the 16 shown"), and Show those 8 narrows the list to them
     2 · "How many contracts mention a rebate?" is explained, with Turn it into one question · 1 Jambo call;
         nothing is spent until the press; Change my question puts the words back in the box
     3 · the press spends ONE call and shows the turned question before anything is read, with Ask each
         contract and the reads' cost
     4 · after the read the card counts the yeses: "5 of 16 mention a rebate", and Show those 5 narrows the list
     5 · a question counting cannot answer is said so, with Change my question
     6 · the cards at the owner's three screens; no page errors
   At the parent (before this change) 1 fails: a counting question was refused under the box. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const OUT = process.env.JAMBO_ASKS_SHOTS || path.join(__dirname, 'shots', 'jambo-asks');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const PARTIES = ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics', 'Naivas Supermarkets', 'Bidco Africa', 'Twiga Foods', 'Unga Group', 'Brookside Dairy'];
const TYPES = [['Supply Agreement', 'proc'], ['Distribution Agreement', 'dist'], ['Framework Agreement', 'proc'], ['Retail Supply', 'sales']];
const REBATE = [1, 4, 7, 10, 13];
const BODY = (party, type, rebate) => `${type.toUpperCase()}\n\nThis ${type} is made between Highland Corporate Ltd and ${party}.\n\n3. Payment\nPayment is due within thirty days of invoice.${rebate ? '\n\n4. Rebate\nThe Supplier shall grant the Buyer a volume rebate of two per cent (2%) of the net invoiced value once annual purchases exceed KES 50 million.' : ''}\n\n9. Termination\nEither party may end this agreement on thirty days' written notice to the other.`;
const book = () => Array.from({ length: 16 }, (_, i) => { const party = PARTIES[i % PARTIES.length], [type, folder] = TYPES[i % TYPES.length];
  return fixtureContract(`HC-${2001 + i}`, type, party, folder, (12 + i * 3) * 1000000, 'Signed', BODY(party, type, REBATE.includes(i))); });
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ AI_RATE_DEEP: '200' });
  await seedWorkspace(h, { contracts: book() });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length >= 16 && typeof window.askColOpen === 'function', null, 40000);
    await page.waitForTimeout(1000);
    const toList = async () => { await page.evaluate(() => { regState().ask = []; regPlaceSet({ show: 'list', only: null }); if (typeof regShowOnly === 'function' && regState().only) regState().only = null; setView('register'); });
      await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length >= 16); };
    const rows = () => page.evaluate(() => document.querySelectorAll('#reg-tbody tr[data-row]').length);
    const card = () => page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ac-count]');
      return c ? { stage: c.getAttribute('data-ac-count'), text: c.innerText.replace(/\s+/g, ' ').trim(), grey: c.classList.contains('ac-dk-card'),
        btns: [...c.querySelectorAll('button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) } : null; });
    const ask = async q => { await page.evaluate(() => askColOpen({}));
      await until(page, () => !!document.querySelector('#ig-dock #ac-q'));
      await page.fill('#ig-dock #ac-q', q); await page.dispatchEvent('#ig-dock #ac-q', 'input');
      await page.click('#ig-dock [data-ac-ask]'); };

    /* ---- 1 a question the records answer, free ---- */
    await toList();
    let c0 = h.ai.calls.length;
    await ask('How many of my contracts are in Procurement?');
    const r1 = await until(page, () => !!document.querySelector('#ig-dock [data-ac-count="records"]'), null, 6000);
    const C1 = await card();
    check('1 a records question is answered in Jambo\'s grey card, free: "8 of the 16 shown"', r1 && C1 && C1.grey && /8 of the 16 shown/.test(C1.text) && /no Jambo call/.test(C1.text) && h.ai.calls.length === c0, C1);
    for (const [w, ht] of SCREENS){ await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, `records-${w}x${ht}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.click('#ig-dock [data-ac-count-show]');
    const narrowed = await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length === 8, null, 8000);
    check('1b Show those 8 narrows the list to the 8', narrowed, { rows: await rows() });

    /* ---- 2 a counting question about the wording: explained, nothing spent; Change puts the words back ---- */
    await toList();
    c0 = h.ai.calls.length;
    await ask('How many contracts mention a rebate?');
    const r2 = await until(page, () => !!document.querySelector('#ig-dock [data-ac-count="ask"]'), null, 6000);
    const C2 = await card();
    check('2 it is explained, with Turn it into one question · 1 Jambo call and Change my question; nothing spent yet',
      r2 && C2 && C2.grey && /asks each contract one question/.test(C2.text) && C2.btns.includes('Turn it into one question · 1 Jambo call') && C2.btns.includes('Change my question') && h.ai.calls.length === c0, C2);
    for (const [w, ht] of SCREENS){ await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, `ask-${w}x${ht}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.click('#ig-dock [data-ac-count-change]');
    const back = await until(page, () => { const q = document.querySelector('#ig-dock #ac-q'); return !!q && q.value === 'How many contracts mention a rebate?'; }, null, 5000);
    check('2b Change my question puts the words back in the box', back);
    await page.click('#ig-dock [data-ac-ask]');
    await until(page, () => !!document.querySelector('#ig-dock [data-ac-count="ask"]'), null, 6000);

    /* ---- 3 the press spends one call and shows the turned question ---- */
    c0 = h.ai.calls.length;
    await page.click('#ig-dock [data-ac-count-turn]');
    const r3 = await until(page, () => !!document.querySelector('#ig-dock [data-ac-count="turned"]'), null, 10000);
    const C3 = await card();
    check('3 one call turns it: "Does this contract mention a rebate?" is shown before anything is read, with Ask each contract · 16 Jambo calls',
      r3 && h.ai.calls.length === c0 + 1 && /Does this contract mention a rebate\?/.test(C3.text) && C3.btns.includes('Ask each contract · 16 Jambo calls'), { calls: h.ai.calls.length - c0, C3 });
    for (const [w, ht] of SCREENS){ await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, `turned-${w}x${ht}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ---- 4 the read, then the count ---- */
    c0 = h.ai.calls.length;
    await page.click('#ig-dock [data-ac-count-go]');
    const r4 = await until(page, () => !AC.busy && !!document.querySelector('#ig-dock [data-ac-desk-rest] .ac-dk-count'), null, 40000);
    const line = await page.evaluate(() => { const l = document.querySelector('#ig-dock [data-ac-desk-rest] .ac-dk-count'); return l ? l.innerText.replace(/\s+/g, ' ').trim() : ''; });
    check('4 after the read the card counts the yeses: "5 of 16 mention a rebate · Show those 5"', r4 && /^5 of 16 mention a rebate\s*Show those 5$/.test(line) && h.ai.calls.length === c0 + 16, { line, calls: h.ai.calls.length - c0 });
    for (const [w, ht] of SCREENS){ await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, `counted-${w}x${ht}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.click('#ig-dock [data-ac-count-yes]');
    const five = await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length === 5, null, 8000);
    const fiveRefs = await page.evaluate(() => [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(r => r.innerText).join(' '));
    check('4b Show those 5 narrows the list to the five with a rebate', five && ['HC-2002', 'HC-2005', 'HC-2008', 'HC-2011', 'HC-2014'].every(r => fiveRefs.includes(r)), { rows: await rows() });

    /* ---- 5 a question counting cannot answer ---- */
    await toList();
    await ask('What is our total spend across these contracts?');
    await until(page, () => !!document.querySelector('#ig-dock [data-ac-count="ask"]'), null, 6000);
    await page.click('#ig-dock [data-ac-count-turn]');
    const r5 = await until(page, () => !!document.querySelector('#ig-dock [data-ac-count="cannot"]'), null, 10000);
    const C5 = await card();
    check('5 a question counting cannot answer is said so, with Change my question', r5 && /cannot answer this/.test(C5.text) && C5.btns.join('|') === 'Change my question', C5);

    /* ---- 6 nothing spills; no page errors ---- */
    const spill = await page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ac-count]'); if (!c) return 'no card';
      const r = c.getBoundingClientRect(); return [...c.querySelectorAll('button, b, p, div')].filter(e => { const x = e.getBoundingClientRect(); return x.width && (x.right > r.right + 0.5 || x.left < r.left - 0.5); }).map(e => e.className || e.tagName); });
    check('6 nothing in the card spills out of it', Array.isArray(spill) && !spill.length, spill);
    check('6b no page errors', !errors.length, errors.slice(0, 3));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
