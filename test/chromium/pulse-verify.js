/* THE PULSE BOARD (owner, 29 Oct 2026: "Build it"; "add a button to take you to the pulse board to the right of the
   summarize my board and move summarize my board to where the highlight is"). Driven on a book of 24 contracts whose
   dates are counted from the day it runs (never a fixed day):
     1 · the Board's head: Summarise my board stands left of the Pulse board's button, which is the head's last control
     2 · the press lands on the Pulse board: one row per live contract, ranked, each with its strand; four rules as chips
     3 · LIVE: the last-ranked contract is given a late duty and an ask of theirs; read again, it climbs and says how far
         ("▲ N"), and its row flashes once
     4 · Written by Jambo: the rows with Jambo's unchecked wording lead; the panel says why, at no cost
     5 · Pause holds the order still and says so; Resume lets it move
     6 · the three screens: the list beside Jambo's panel, nothing sideways; pictures saved
   At the parent (before this change) 1 fails: the head has no Pulse board button.
   Run: node test/chromium/pulse-verify.js   (pictures: PULSE_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.PULSE_SHOTS || path.join(__dirname, 'shots', 'pulse');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const day = off => new Date(Date.now() + off * 864e5).toISOString().slice(0, 10);
const iso = off => new Date(Date.now() + off * 864e5).toISOString();

const PARTIES = ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics', 'Naivas Supermarkets', 'Pixel Agency', 'Mara Logistics', 'Equity Bank', 'Safaricom', 'Bidco Africa', 'Twiga Foods', 'Baltic Cloud', 'Solvik Fastigheter'];
const BODY = 'SUPPLY AGREEMENT\n\n3. Payment\nPayment is due within thirty days of invoice.\n\n9. Termination\nEither party may end this agreement on thirty days written notice.';
function book(){
  const out = [];
  for (let i = 0; i < 24; i++){
    const party = PARTIES[i % PARTIES.length], st = i % 4 === 0 ? 'Signed' : 'Under Review';
    const c = fixtureContract(`MK-${300 + i}`, ['Supply Agreement', 'Services Agreement', 'Distribution Agreement', 'Data Processing Agreement'][i % 4], party, 'proc', 2000000 + i * 1700000, st, BODY);
    c.audit = [{ at: iso(-120 + i * 3), user: 'System', action: 'Created', detail: 'fixture' }];
    c.expiry = day(30 + i * 25); c.effectiveDate = day(-100 + i * 2);
    if (st === 'Signed'){
      c.signatures = [{ party: 'first', name: 'Amina Otieno', at: iso(-60 + i) }, { party: 'counterparty', name: 'Their CEO', at: iso(-59 + i) }];
      c.obligations = [{ id: 'o' + i, title: 'Quarterly report', due: day(i % 8 === 0 ? -6 : 5), owner: 'us' }];
    }
    if (st === 'Under Review' && i % 3 !== 2){
      c.negotiation = { turnAt: iso(-10), rounds: [] };
      c.changes = [
        { id: 'ch' + i + 'a', clauseLabel: '9. Termination', changeType: 'edit', oldText: 'thirty days', newText: 'Either party may end this agreement on sixty days written notice to the other.', status: 'pending', author: 'Amina Otieno', authorSide: 'owner', createdAt: iso(-2), note: 'Jambo — Edit', ops: [] },
        { id: 'ch' + i + 'b', clauseLabel: '3. Payment', changeType: 'edit', oldText: 'thirty days', newText: 'Payment is due within sixty days of invoice.', status: 'pending', author: party, authorSide: 'counterparty', createdAt: iso(-12), ops: [] }];
    }
    out.push(c);
  }
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: book(), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 24 && typeof caGo === 'function' && typeof pulseOpen === 'function', null, 40000);
      /* the Board, asked until it stands (the first page can still be landing when the book arrives) */
      await until(page, () => { if (!(state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'board')) { try { caGo({ kind: 'go', place: 'board' }); } catch (_){} }
        return !!document.querySelector('#hb-bhead .hb-bs-go'); }, null, 30000);

      /* ---- 1 the head ---- */
      const hd = await page.evaluate(() => { const row = document.querySelector('#hb-bhead .hb-bh-r'); if (!row) return null;
        const bs = row.querySelector('.hb-bs-go'), pu = row.querySelector('[data-hb-pulse]'), ctl = [...row.querySelectorAll('button')];
        const r = e => e ? e.getBoundingClientRect() : null;
        return { pulse: !!pu, last: ctl[ctl.length - 1] === pu, left: !!(bs && pu) && r(bs).right <= r(pu).left, sameLine: !!(bs && pu) && Math.abs(r(bs).top - r(pu).top) < 4, word: pu ? pu.textContent.trim() : '' }; });
      check(`${nm} 1 the head: Summarise my board stands left of the Pulse board, the head's last control, on one line`, !!hd && hd.pulse && hd.last && hd.left && hd.sameLine && hd.word === 'Pulse board', hd);
      const head = await page.$('#hb-bhead'); if (head) await head.screenshot({ path: path.join(OUT, `head-${nm}.png`) });

      /* ---- 2 the page ---- */
      if (!hd || !hd.pulse){ await page.close(); continue; }
      await page.click('#hb-bhead [data-hb-pulse]');
      const landed = await until(page, () => state.view === 'pulse' && document.querySelectorAll('#pu-tbody tr[data-pu-row]').length >= 20);
      const P = await page.evaluate(() => ({ rows: document.querySelectorAll('#pu-tbody tr[data-pu-row]').length, strands: document.querySelectorAll('#pu-tbody .pu-strand svg .pu-today').length,
        chips: [...document.querySelectorAll('#pu-page [data-pu-crit]')].map(b => b.textContent.trim()), on: (document.querySelector('#pu-page .pu-chip.is-on') || {}).textContent,
        ranks: [...document.querySelectorAll('#pu-tbody .pu-rk b')].slice(0, 3).map(b => b.textContent), panel: !!document.querySelector('#ins-panel'),
        sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
      check(`${nm} 2 the press lands on the Pulse board: every live contract ranked, each with its strand and today's line`, landed && P.rows === 24 && P.strands === 24 && P.ranks.join() === '1,2,3', P);
      check(`${nm} 2b four rules as chips, What needs you chosen`, JSON.stringify(P.chips) === JSON.stringify(['What needs you', 'Money at stake', 'Days left', 'Written by Jambo']) && P.on === 'What needs you', P.chips);
      check(`${nm} 6 the list beside Jambo's panel, nothing sideways`, P.panel && !P.sideways, P);
      await page.screenshot({ path: path.join(OUT, `pulse-${nm}.png`) });

      if (nm === 'laptop-a'){
        /* ---- 3 live ---- */
        const last = await page.evaluate(() => { const rs = [...document.querySelectorAll('#pu-tbody tr[data-pu-row]')]; const tr = rs[rs.length - 1]; return { id: tr.getAttribute('data-pu-row'), rank: Number(tr.querySelector('.pu-rk b').textContent) }; });
        await page.evaluate(id => { const c = getContract(id);
          c.obligations = (c.obligations || []).concat([{ id: 'late1', title: 'Deliver the plan', due: new Date(Date.now() - 9 * 864e5).toISOString().slice(0, 10), owner: 'us' }]);
          c.negotiation = { turnAt: new Date(Date.now() - 864e5).toISOString(), rounds: [] };
          c.changes = [{ id: 'zz1', clauseLabel: '9. Termination', changeType: 'edit', oldText: 'a', newText: 'Ninety days of notice, and a fee.', status: 'pending', author: 'Them', authorSide: 'counterparty', createdAt: new Date(Date.now() - 40 * 864e5).toISOString(), ops: [] }];
          puRepaint(); }, last.id);
        await page.waitForTimeout(700);
        const now = await page.evaluate(id => { const tr = document.querySelector(`#pu-tbody tr[data-pu-row="${id}"]`); return tr ? { rank: Number(tr.querySelector('.pu-rk b').textContent), moved: tr.querySelector('.pu-mv').textContent.trim(), hit: tr.classList.contains('is-hit') } : null; }, last.id);
        check('3 LIVE: the contract given a late duty and their ask climbs, says how far, and flashes once', !!now && now.rank < last.rank && now.moved === '▲ ' + (last.rank - now.rank) && now.hit, { before: last, now });

        /* ---- 4 written by Jambo ---- */
        await page.click('#pu-page [data-pu-crit="jambo"]');
        await until(page, () => (document.querySelector('#pu-page .pu-chip.is-on') || {}).textContent === 'Written by Jambo');
        await page.click('#pu-tbody tr:first-child');
        await until(page, () => !!document.querySelector('#ins-panel #pu-side .jb-say'));
        const J = await page.evaluate(() => ({ head: (document.querySelector('#pu-page .pu-t th.is-r') || {}).textContent, big: (document.querySelector('#pu-tbody tr:first-child .pu-sc b') || {}).textContent,
          say: (document.querySelector('#ins-panel #pu-side .jb-say-b') || {}).textContent || '', free: (document.querySelector('#ins-panel #pu-side .jb-say-f') || {}).textContent || '',
          doors: [...document.querySelectorAll('#ins-panel #pu-side .pu-doors button')].map(b => b.textContent.trim()) }));
        check('4 Written by Jambo: the column says To check, the lead row has unchecked wording, the panel says why at no cost',
          J.head === 'To check' && Number(J.big) >= 1 && /Jambo wrote \d+% of the words your side changed/.test(J.say) && /no Jambo call/.test(J.free), J);
        check('4b its doors are the existing ones: Read Jambo\'s change, Ask for review, Open contract', J.doors.some(d => /^Read Jambo/.test(d)) && J.doors.includes('Ask for review') && J.doors.includes('Open contract'), J.doors);
        await page.screenshot({ path: path.join(OUT, `pulse-jambo-${nm}.png`) });

        /* ---- 5 pause ---- */
        await page.click('#pu-hold');
        const held = await page.evaluate(() => ({ btn: document.querySelector('#pu-hold').textContent.trim(), live: document.querySelector('#pu-page .pu-live').textContent.trim() }));
        await page.click('#pu-hold');
        const back = await page.evaluate(() => ({ btn: document.querySelector('#pu-hold').textContent.trim(), live: document.querySelector('#pu-page .pu-live').textContent.trim() }));
        check('5 Pause holds the order and says Paused; Resume lets it move again', held.btn === 'Resume' && held.live === 'Paused' && back.btn === 'Pause' && back.live === 'Live', { held, back });
      }
      await page.close();
    }
  } finally {
    await browser.close();
    if (h.stop) await h.stop();
  }
  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
