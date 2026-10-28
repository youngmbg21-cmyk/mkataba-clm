/* NUMBERED DOTS ON THE PAPER (owner picked "The Legora way", round 9; "the reads should be automatic", 28 Oct 2026)
   After the words of each ask of theirs still waiting, a small numbered dot carries Jambo's reading of it.
     1 · beside Home's Redlines, their ask on the paper carries dot 1, after their words
     2 · its words are the card's own reading (the free one, when no prepared answer exists)
     3 · a press opens it under the dot, painted; a second press shuts it; Esc and a press elsewhere shut it
     4 · where Jambo prepared an answer when their round arrived, the dot says that answer
     5 · our own change carries no dot; their seat draws none
     6 · the owner's three screens, nothing sideways
   Run: node test/chromium/paper-dots-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'paper-dots');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const still = P => until(P, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';

(async () => {
  const h = await startHati({});
  const live = Object.assign(fixtureContract('MK-L1', 'Freight Services Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC),
    { negotiation: { round: 2, turn: 'owner', turnAt: iso(-2), rounds: [] },
      changes: [{ id: 'L1', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'counterparty', author: 'Erik Lindqvist',
        newText: 'Invoices are payable within ninety (90) days.', oldText: 'Invoices are payable within thirty (30) days.', createdAt: iso(-2) }] });
  await seedWorkspace(h, { contracts: [live], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  const drive = (fn, arg, fb) => P.evaluate(fn, arg).catch(e => { errors.push('drive: ' + String(e.message || e).split('\n')[0]); return fb; });
  const dotState = () => drive(() => { const d = document.querySelector('#ig-paper .rl-pt, .rl-pt'); if (!d) return null;
    const b = d.querySelector('.rl-pt-bub'), r = b.getBoundingClientRect();
    const at = r.width ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return { n: d.firstChild && d.firstChild.textContent, open: d.classList.contains('is-open'), aria: d.getAttribute('aria-expanded'),
      painted: !!(at && b.contains(at)), text: b.innerText.replace(/\s+/g, ' ').trim(), prev: (d.previousSibling && d.previousSibling.textContent || '').slice(-30) }; }, null, null);
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.getContract && getContract('MK-L1')), null, 15000);
    await drive(() => pdOpenOnHome('MK-L1', 'copilot'), null, null);
    await until(P, () => !!document.querySelector('section[data-clause]'), null, 10000);
    /* the fixture's 'cl_pay' names no clause on its plain-text paper: the ask is put on the paper's own clause, as every filed change is */
    await drive(() => { const c = getContract('MK-L1'); const sec = [...document.querySelectorAll('section[data-clause]')].find(x => /PAYMENT/.test(x.textContent));
      if (sec) c.changes[0].clauseId = sec.getAttribute('data-clause'); pdRedOpen('MK-L1'); }, null, null);
    const shown = await until(P, () => !!document.querySelector('section[data-nego-card-anchor~="L1"] .rl-pt'), null, 10000);
    check(shown, '1a their ask on the paper carries a numbered dot');
    let s = await dotState();
    check(!!s && s.n === '1' && /ninety \(90\) days\.?$/.test(s.prev.trim()), '1b dot 1, after their words', s);
    const card = await drive(() => { const v = document.querySelector('#ig-dock [data-rl-row-read] .rl-card-read-v'); return v ? v.textContent.trim() : ''; }, null, '');
    check(!!s && !!card && s.text.startsWith(card) && s.text.length > card.length + 10, '2 its words are the card\'s own reading, verdict and reason', { card, dot: s && s.text });
    check(!!s && !s.open && !s.painted, '3a shut until pressed', s);
    await P.click('section[data-nego-card-anchor~="L1"] .rl-pt'); await P.waitForTimeout(150);
    s = await dotState();
    check(!!s && s.open && s.aria === 'true' && s.painted, '3b a press opens the reading under the dot, painted', s);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-open.png') });
    await P.click('section[data-nego-card-anchor~="L1"] .rl-pt'); await P.waitForTimeout(150);
    s = await dotState(); check(!!s && !s.open && s.aria === 'false', '3c pressed again, it shuts', s);
    await P.click('section[data-nego-card-anchor~="L1"] .rl-pt'); await P.keyboard.press('Escape'); await P.waitForTimeout(150);
    s = await dotState(); check(!!s && !s.open, '3d Esc shuts it', s);
    await P.click('section[data-nego-card-anchor~="L1"] .rl-pt'); await P.mouse.click(300, 700); await P.waitForTimeout(150);
    s = await dotState(); check(!!s && !s.open, '3e a press elsewhere shuts it', s);

    /* 4 · Jambo's prepared answer, as the server keeps it when their round arrives */
    await drive(() => { const c = getContract('MK-L1'), ch = c.changes[0];
      c._roundPrep = { [roundPrepKey(ch.clauseId, ch.newText)]: { verdict: 'counter', why: 'Sixty days meets them halfway and your playbook allows it.', wording: 'Invoices are payable within sixty (60) days.' } };
      rlPaintPoints(document.getElementById('ig-paper') || document, c); }, null, null);
    s = await dotState();
    check(!!s && /Jambo: counter/.test(s.text) && /meets them halfway/.test(s.text), '4 where Jambo prepared an answer, the dot says it', s && s.text);

    /* 5 · ours, and their seat */
    const ours = await drive(() => { const c = getContract('MK-L1'); const ch = c.changes[0];
      const saved = { side: ch.authorSide }; ch.authorSide = 'owner';
      const n = rlPaintPoints(document.getElementById('ig-paper') || document, c); ch.authorSide = saved.side;
      const theirs = rlPaintCopilotAnswers(document.getElementById('ig-paper') || document, c, { side: 'counterparty', noGlow: true });
      return { ours: n, theirSeatDots: document.querySelectorAll('.rl-pt').length, theirs }; }, null, null);
    check(!!ours && ours.ours === 0 && ours.theirSeatDots === 0, '5 our own change carries no dot; their seat draws none', ours);
    await drive(() => rlPaintCopilotAnswers(document.getElementById('ig-paper') || document, getContract('MK-L1'), { noGlow: true }), null, null);

    for (const [w, hh] of [[1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh }); await still(P);
      await drive(() => { const d = document.querySelector('.rl-pt'); if (d && !d.classList.contains('is-open')) d.click(); }, null, null);
      await P.waitForTimeout(150);
      const fit = await drive(() => { const d = document.querySelector('.rl-pt'); const b = d && d.querySelector('.rl-pt-bub').getBoundingClientRect();
        return { side: document.documentElement.scrollWidth > innerWidth, inside: !!b && b.left >= 0 && b.right <= innerWidth }; }, null, {});
      check(!fit.side && fit.inside, `6 ${w}×${hh}: the reading sits on screen, nothing sideways`, fit);
      await P.screenshot({ path: path.join(OUT, `${w}x${hh}-open.png`) });
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
