/* THE THREAD — reads in batches, and the Reads page (the owner picked "The thread", 28 Oct 2026, over "The
   worklist" and "Keep reading"; docs/MAP-HISTORY.md "READS IN BATCHES"). Driven on a book of 500 contracts, the
   test stand-in answering:
     1 · the form, before any read: one sentence with 50 | 100 inside it, "the first 50 of the 500 shown: contracts
         1–50 · 50 Jambo calls"; 100 pressed, "1–100 · 100 Jambo calls"; the button "Ask 50 contracts"
     2 · after the first 50: the form (the team's own question) says "the next 50 of the 450 not yet read: contracts
         51–100 · 50 Jambo calls. The 50 already read are kept and cost nothing"; the column's card says "50 of 500
         read" with Next 50 · 51–100 · 50 calls, Next 100 · 51–150 · 100 calls and Every read ›
     3 · Next 50 pressed reads 51–100 and NOT the first 50 again: 100 answered, the server's calls 100 in all, two
         reads recorded (1–50, 51–100), none cached
     4 · the Reads page: the row "Notice to end" partly read, "100 of 500", Next 50 →; its panel tells the thread
         newest first (Next · 101–150, then 51–100, then 1–50, then Asked); Every read › lands here on the row
     5 · the three screens: the list beside the panel, nothing sideways, the row's words whole; pictures saved
   At the parent (before this change) 1 fails: the form says "the first 50 contracts of the 500 shown", no pill.
   Run: node test/chromium/reads-verify.js   (pictures: READS_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.READS_SHOTS || path.join(__dirname, 'shots', 'reads');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const PARTIES = ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics', 'Naivas Supermarkets', 'Pixel Agency', 'Mara Logistics', 'Equity Bank', 'Safaricom', 'Bidco Africa', 'Twiga Foods'];
const TYPES = [['Supply Agreement', 'proc'], ['Distribution Agreement', 'dist'], ['Services Agreement', 'corp'], ['Retail Supply', 'sales'], ['Marketing Services', 'mktg']];
const BODY = (party, type) => `${type.toUpperCase()}\n\nThis ${type} is made between Highland Corporate Ltd and ${party}.\n\n3. Payment\nPayment is due within thirty days of invoice.\n\n9. Termination\nEither party may end this agreement on thirty days' written notice to the other.`;
function book(){
  const out = [];
  for (let i = 0; i < 500; i++){
    const party = PARTIES[i % PARTIES.length], [type, folder] = TYPES[(i * 3) % TYPES.length];
    const c = fixtureContract(`HC-${1001 + i}`, type, party, folder, 12000000 + (i % 7) * 250000, 'Signed', BODY(party, type));
    c.lastAction = `${1 + (i % 27)} Oct 2026`;
    out.push(c);
  }
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: book() });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 500 && typeof window.regPlaceSet === 'function', null, 40000);
    const list = async () => { await page.evaluate(() => { try { if (document.querySelector('#modal-root [role="dialog"]')) closeModal(); } catch (_) {} regPlaceSet({ show: 'list' }); setView('register'); });
      await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]') && typeof window.askColOpen === 'function'); await page.waitForTimeout(500); };
    const Q = 'How much notice does each side need to end the contract?';
    const sentence = () => page.evaluate(() => { const el = document.querySelector('#ac-form .ac-th'); return el ? { text: el.textContent.replace(/\s+/g, ' ').trim(), pill: [...el.querySelectorAll('[data-ac-size]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')), btn: (document.querySelector('#ac-form [data-ac-ask]') || {}).textContent || '' } : null; });

    /* ---- 1 the form before any read ---- */
    await list();
    await page.evaluate(q => askColOpen({ question: q, name: 'Notice to end' }), Q);
    await until(page, () => !!document.querySelector('#ac-form .ac-th'));
    let S = await sentence();
    check('1a one sentence, the choice inside it: "the first 50 | 100 of the 500 shown: contracts 1–50 · 50 Jambo calls"',
      !!S && /reads the first 50100 of the 500 shown: contracts 1–50 · 50 Jambo calls\./.test(S.text) && JSON.stringify(S.pill) === JSON.stringify(['50*', '100']) && S.btn.trim() === 'Ask 50 contracts', S);
    await page.click('#ac-form [data-ac-size="100"]');
    await until(page, () => /1–100/.test((document.querySelector('#ac-form .ac-th') || {}).textContent || ''));
    S = await sentence();
    check('1b 100 pressed: "contracts 1–100 · 100 Jambo calls", the button "Ask 100 contracts"', !!S && /contracts 1–100 · 100 Jambo calls/.test(S.text) && S.btn.trim() === 'Ask 100 contracts' && S.pill[1] === '100*', S);
    await page.click('#ac-form [data-ac-size="50"]');
    await until(page, () => /1–50 /.test((document.querySelector('#ac-form .ac-th') || {}).textContent || ''));
    await page.click('#ac-form [data-ac-ask]');
    const done = await until(page, () => !document.querySelector('#ac-form') && !!document.querySelector('#ig-dock [data-ac-col]') && document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= 10, null, 60000);
    check('1c the first 50 read: the column is up', done);

    /* ---- 2 the form on the team's question, and the card ---- */
    const ask = ((await W.admin.json('/api/columns')).asks || []).find(a => /Notice to end/.test(a.name)) || null;
    check('2 the question is the team\'s now', !!ask, ask && ask.name);
    await page.evaluate(a => askColOpen({ askId: a.id, question: a.question, name: a.name }), ask);
    await until(page, () => /not yet read/.test((document.querySelector('#ac-form .ac-th') || {}).textContent || ''), null, 15000);
    S = await sentence();
    check('2a the form on the team\'s question: "the next 50 | 100 of the 450 not yet read: contracts 51–100 · 50 Jambo calls. The 50 already read are kept and cost nothing"',
      !!S && /reads the next 50100 of the 450 not yet read: contracts 51–100 · 50 Jambo calls\. The 50 already read are kept and cost nothing\./.test(S.text) && S.btn.trim() === 'Read the next 50', S);
    await page.screenshot({ path: path.join(OUT, 'form-1440x780.png') });
    await page.evaluate(() => askColClose());
    const card = async () => page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ac-col]'); if (!c) return null; const p = c.querySelector('.ac-th-prog');
      return { prog: p ? (p.querySelector('.ac-meta') || {}).textContent.replace(/\s+/g, ' ').trim() : '', next: [...c.querySelectorAll('[data-ac-next]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), every: !!c.querySelector('[data-ac-reads]'), bar: p ? (p.querySelector('.ac-prog > i') || {}).style.width : '' }; });
    let C = await card();
    /* RE-POINTED 28 Oct 2026 (ONE BUTTON): the line says read and still to read, ONE button sized to what is left, the 50 | 100 pill beside it */
    check('2b the card: "50 of the 500 shown read · 450 still to read", one button "Read the next 50 · 400 left after", the pill, Every read ›',
      !!C && /^50 of the 500 shown read · 450 still to read/.test(C.prog) && JSON.stringify(C.next) === JSON.stringify(['Read the next 50 · 400 left after']) && C.every && C.bar === '10%', C);
    await page.screenshot({ path: path.join(OUT, 'after-1440x780.png') });

    /* ---- 3 the next 50 reads 51–100, never the first 50 again ---- */
    await page.click('#ig-dock [data-ac-next][data-ac-n="50"]');
    await until(page, () => !document.querySelector('[data-ac-stop]') && /^100 of the 500 shown read/.test(((document.querySelector('#ig-dock .ac-th-prog .ac-meta') || {}).textContent || '').trim()), null, 60000);
    C = await card();
    const reads = await W.admin.json('/api/columns/reads');
    const mine = (reads.reads || []).filter(r => r.askIds.includes(ask.id)).sort((a, b) => a.at.localeCompare(b.at));
    check('3a the button read 51–100: "100 of the 500 shown read · 400 still to read", the next offered', !!C && /^100 of the 500 shown read · 400 still to read/.test(C.prog) && C.next[0] === 'Read the next 50 · 350 left after', C);
    check('3b the server kept two reads, 1–50 and 51–100, 50 contracts and 50 calls each, nothing cached', mine.length === 2 && mine[0].from === 1 && mine[0].to === 50 && mine[1].from === 51 && mine[1].to === 100
      && mine.every(r => r.n === 50 && r.calls === 50 && r.cached === 0) && mine.every(r => r.by === 'Amina Otieno'), mine.map(r => `${r.from}–${r.to} · ${r.n} · ${r.calls} calls · ${r.cached} cached · ${r.by}`).join(' | '));
    const sum = await W.admin.json('/api/columns/summary?all=1');
    const a2 = (sum.asks || []).find(a => a.id === ask.id);
    check('3c the kept answers: 100, each contract once', !!a2 && a2.read === 100, a2 && a2.read);

    /* ---- 4 the Reads page ---- */
    await page.click('#ig-dock [data-ac-reads]');
    const landed = await until(page, () => state.view === 'reads' && !!document.querySelector('#rd-page .rd-t tbody tr[data-rd-row].is-sel') && !!document.querySelector('#ins-panel .rd-thread'), null, 15000);
    const R = await page.evaluate(() => { const tr = document.querySelector('#rd-page .rd-t tbody tr.is-sel'); const p = document.getElementById('ins-panel');
      return { landed: !!tr, name: tr ? (tr.querySelector('.rd-nm') || {}).textContent : '', sub: tr ? (tr.querySelector('.rd-sub') || {}).textContent : '', read: tr ? (tr.querySelector('.rd-cell small') || {}).textContent : '',
        mark: tr ? (tr.querySelector('.ls-mark') || {}).getAttribute('title') : '', next: tr ? (tr.querySelector('[data-rd-next]') || {}).textContent : '', risk: tr ? ((tr.querySelector('.ls-word-v') || {}).textContent || '').trim() : '',
        head: (document.querySelector('.rd-t1') || {}).textContent, facts: (document.querySelector('.rd-hs') || {}).textContent, tabs: [...document.querySelectorAll('[data-lh-seat="reads"] .reg-vtab')].map(t => t.textContent.replace(/\s+/g, ' ').trim()),
        thread: [...(p ? p.querySelectorAll('.rd-thread li b') : [])].map(b => b.textContent.trim()), acts: [...(p ? p.querySelectorAll('.ins-acts button') : [])].map(b => b.textContent.trim()), title: (p && p.querySelector('.ins-cp') || {}).textContent }; });
    check('4a Every read › lands on the Reads page, on the question\'s row', landed && R.landed && R.name === 'Notice to end', R);
    check('4b the row: partly read, "100 of 500 read", Next 50 →, the grey line with the question, who and when', R.mark === 'Partly read' && R.read === '100 of 500' && R.next === 'Next 50 →' && /“How much notice/.test(R.sub) && /Amina Otieno · read \d+ \w+, \d\d:\d\d$/.test(R.sub), R);
    /* a tab with no rows stays out unless lit (the list head's rule): Packs and Facts are not drawn here */
    check('4c the head and tabs: "Reads", the facts, All 1 · Mine 1 (Packs and Facts empty, left out)', R.head === 'Reads' && /1 question/.test(R.facts) && /100 Jambo calls this month/.test(R.facts) && JSON.stringify(R.tabs) === JSON.stringify(['All1', 'Mine1']), { head: R.head, facts: R.facts, tabs: R.tabs });
    check('4d the thread, newest first: Next · 101–150, then 51–100, then 1–50, then Asked; the panel\'s doors Read the next 50 · 350 left after, Open the table',
      R.thread.length === 4 && /^Next · contracts 101–150$/.test(R.thread[0]) && /^contracts 51–100 · /.test(R.thread[1]) && /^contracts 1–50 · /.test(R.thread[2]) && /^Asked · /.test(R.thread[3]) && R.acts[0] === 'Read the next 50 · 350 left after' && R.acts[1] === 'Open the table', R);

    /* ---- 5 the three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht });
      await page.evaluate(() => renderReads()); await page.waitForTimeout(600);
      const F = await page.evaluate(() => { const card = document.querySelector('.rd-card'), p = document.getElementById('ins-panel'), tr = document.querySelector('.rd-t tbody tr');
        const cr = card && card.getBoundingClientRect(), pr = p && p.getBoundingClientRect();
        const cut = tr ? [...tr.querySelectorAll('.rd-nm, .rd-cell small, .ls-word-v, [data-rd-next]')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent.trim()) : ['no row'];
        return { side: !!(cr && pr && cr.right <= pr.left + 2 && pr.width > 200), sideways: document.documentElement.scrollWidth > innerWidth + 1, panelIn: !!(pr && pr.bottom <= innerHeight + 1), cut }; });
      check(`5 reads at ${w}×${ht}: the list beside the panel, nothing sideways, the row's words whole`, F.side && !F.sideways && F.panelIn && !F.cut.length, F);
      await page.screenshot({ path: path.join(OUT, `page-${w}x${ht}.png`) });
      if (w !== 1440){ await list(); await page.evaluate(a => askColOpen({ askId: a.id, question: a.question, name: a.name }), ask);
        await until(page, () => /not yet read/.test((document.querySelector('#ac-form .ac-th') || {}).textContent || ''), null, 15000); await page.screenshot({ path: path.join(OUT, `form-${w}x${ht}.png`) });
        await page.evaluate(() => askColClose()); await until(page, () => !!document.querySelector('#ig-dock .ac-th-prog')); await page.screenshot({ path: path.join(OUT, `after-${w}x${ht}.png`) });
        await page.evaluate(() => setView('reads')); await until(page, () => !!document.querySelector('#rd-page')); }
    }
    const errs = await page.evaluate(() => (window.__pageErrors || []).length);
    check('no page errors', errs === 0, errs);
  } catch (e) { fails++; console.log('FAIL  the drive threw — ' + (e && e.stack || e)); }
  finally { await browser.close(); await h.stop?.(); }
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
