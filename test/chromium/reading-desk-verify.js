/* THE READING DESK, AND ONE BUTTON (the owner picked both, 28 Oct 2026; docs/MAP-HISTORY.md "THE READING DESK").
   Driven on a book of 120 contracts with the test stand-in slowed, so a read can be watched:
     1 · while a read of 100 runs, the column card is a desk: the ten in flight named ("HC-1001 to HC-1010"), one
         answer that really came back (name, ref, § number, the quote in the paper's face, the answer with its
         light), the foot "Reading 100 contracts · N done · N at risk so far · N Jambo calls" with Stop
     2 · the desk turns to a SECOND real answer of the ten that last landed, and the stack under it grows
     3 · with less motion asked, the turn draws no animation and the spinner stands still
     4 · Stop: "N of 100 read and kept · N not read · N Jambo calls spent", Carry on reads the rest
     5 · ONE BUTTON when the read ends: "100 of the 120 shown read · 20 still to read", the button "Read the
         remaining 20 · 20 Jambo calls", the message says the same; pressed, "All 120 shown are read", no button
     6 · the three screens: the desk fits, nothing spills; pictures saved
   At the parent (before this change) 1 fails: the busy card has no desk.
   Run: node test/chromium/reading-desk-verify.js   (pictures: DESK_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.DESK_SHOTS || path.join(__dirname, 'shots', 'reading-desk');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const PARTIES = ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics', 'Naivas Supermarkets', 'Pixel Agency', 'Mara Logistics', 'Equity Bank', 'Safaricom', 'Bidco Africa', 'Twiga Foods'];
const TYPES = [['Supply Agreement', 'proc'], ['Distribution Agreement', 'dist'], ['Services Agreement', 'corp'], ['Retail Supply', 'sales'], ['Marketing Services', 'mktg']];
const BODY = (party, type) => `${type.toUpperCase()}\n\nThis ${type} is made between Highland Corporate Ltd and ${party}.\n\n3. Payment\nPayment is due within thirty days of invoice.\n\n9. Termination\nEither party may end this agreement on thirty days' written notice to the other.`;
function book(n){
  const out = [];
  for (let i = 0; i < n; i++){
    const party = PARTIES[i % PARTIES.length], [type, folder] = TYPES[(i * 3) % TYPES.length];
    const c = fixtureContract(`HC-${1001 + i}`, type, party, folder, 12000000 + (i % 7) * 250000, 'Signed', BODY(party, type));
    c.lastAction = `${1 + (i % 27)} Oct 2026`;
    out.push(c);
  }
  return out;
}
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const Q = 'How much notice does each side need to end the contract?';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  /* the deep route allows 15 presses a quarter hour per person (150 contracts); this check spends more while it watches */
  const h = await startHati({ AI_RATE_DEEP: '200' });
  await seedWorkspace(h, { contracts: book(120) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length >= 120 && typeof window.askColOpen === 'function', null, 40000);
    await page.waitForTimeout(1200);
    const toList = async () => { await page.evaluate(() => { regPlaceSet({ show: 'list', only: null }); setView('register'); }); await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]')); await page.waitForTimeout(500); };
    await toList();
    const guard = s => !!document.querySelector(s);

    /* ---- 1 the desk while a read of 100 runs ---- */
    h.ai.slow(1800);                                   /* a batch of ten lands about every two seconds, so the desk can turn */
    await page.evaluate(() => { acSizeSet(100); askColOpen({ question: 'How much notice does each side need to end the contract?', name: 'Notice to end' }); });
    await until(page, () => !!document.querySelector('#ac-form [data-ac-ask]:not([disabled])'));
    const btn = await page.evaluate(() => (document.querySelector('#ac-form [data-ac-ask]') || {}).textContent.trim());
    check('1 the form offers 100 at a time: "Ask 100 contracts"', btn === 'Ask 100 contracts', btn);
    await page.evaluate(() => { const w = window; w._dk = { t0: performance.now(), first: null, counts: new Set() };
      w._dkT = setInterval(() => { const d = document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]');
        if (d && w._dk.first == null) w._dk.first = { at: Math.round(performance.now() - w._dk.t0), done: AC.busy ? AC.busy.done : null };
        const f = document.querySelector('#ac-form .ac-desk-foot .ac-busy'); const m = f && /· (\d+) done/.exec(f.textContent || ''); if (m) w._dk.counts.add(Number(m[1])); }, 40); });
    await page.click('#ac-form [data-ac-ask]');
    const empty = await until(page, () => !!document.querySelector('#ac-form [data-ac-desk] .ac-desk-empty'), null, 8000);
    check('1a before the first ten land, the desk says "Jambo is reading the first ten…"', empty,
      await page.evaluate(() => (document.querySelector('#ac-form [data-ac-desk]') || {}).textContent));
    const landed = await until(page, () => !!document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]'), null, 20000);
    const desk = async () => page.evaluate(() => { const d = document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]'); if (!d) return null;
      return { cid: d.getAttribute('data-ac-desk-cid'), name: (d.querySelector('.ac-desk-nm') || {}).textContent, meta: (d.querySelector('.ac-meta') || {}).textContent, quote: (d.querySelector('.ac-desk-q') || {}).textContent || '',
        font: d.querySelector('.ac-desk-q') ? getComputedStyle(d.querySelector('.ac-desk-q')).fontFamily : '', op: d.querySelector('.ac-desk-q') ? getComputedStyle(d.querySelector('.ac-desk-q')).opacity : '',
        ans: (d.querySelector('.ac-ans b') || {}).textContent, tone: (d.querySelector('.ac-ans') || { className: '' }).className,
        now: (document.querySelector('#ac-form .ac-desk-now') || {}).textContent, foot: (document.querySelector('#ac-form .ac-desk-foot .ac-busy') || {}).textContent, stop: !!document.querySelector('#ac-form [data-ac-stop]') }; });
    let D = await desk();
    check('1b one answer that really came back: the contract, its ref and § 9, the quote in the paper\'s face faded, the answer with its light',
      landed && D && /HC-1\d\d\d · § 9/.test(D.meta) && /Highland Corporate|thirty days/.test(D.quote) && /Serif/i.test(D.font) && Number(D.op) < 0.7 && /30 days/.test(D.ans) && /tone-/.test(D.tone) && D.name.length > 3, D);
    check('1c the ten in flight are named at the top, and the foot counts done · at risk so far · calls, with Stop',
      D && /^Reading\s*HC-1\d\d\d to HC-1\d\d\d$/.test(D.now.replace(/\s+/g, ' ').trim()) && /^Reading 100 contracts · \d+ done · \d+ at risk so far · \d+ Jambo calls$/.test(D.foot.trim()) && D.stop, D && { now: D.now, foot: D.foot });
    await page.waitForTimeout(450);                /* past the slide, so the picture is still */
    await page.screenshot({ path: path.join(OUT, 'desk-1440x780.png') });

    /* ---- 2 it turns to a second real answer; the stack grows ---- */
    const first = D && D.cid;
    const turned = await until(page, cid => { const d = document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]'); return !!d && d.getAttribute('data-ac-desk-cid') !== cid; }, first, 6000);
    D = await desk();
    check('2 the desk turns to a second real answer of the ten that last landed', turned && D && D.cid !== first && /Highland Corporate|thirty days/.test(D.quote), { first, now: D && D.cid });
    const stack = await until(page, () => document.querySelectorAll('#ac-form [data-ac-stack] li').length >= 1, null, 6000);
    const S = await page.evaluate(() => [...document.querySelectorAll('#ac-form [data-ac-stack] li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()));
    check('2a the stack under it holds what the desk turned past, light · name · answer, never more than three', stack && S.length >= 1 && S.length <= 3 && S.every(x => /30 days/.test(x)), S);
    /* RE-POINTED 28 Oct 2026 (EACH ANSWER THE MOMENT IT IS READ): the desk is a queue of answers that landed */
    const batchKept = await page.evaluate(() => { const b = AC.busy; if (!b || !Array.isArray(b.queue)) return null; const all = [b.cur].concat(b.queue, b.seen || []).filter(Boolean);
      return { shown: !!b.cur, waiting: b.queue.length, seen: (b.seen || []).length, idsOk: all.every(x => !!(AC.ans[x.askId] || {})[x.cid]) }; });
    check('2b everything shown is read off answers already landed (AC.busy, AC.ans), nothing fetched for the desk; never more than three waiting', !!batchKept && batchKept.idsOk && batchKept.shown && batchKept.waiting <= 3, batchKept);
    /* EACH ANSWER THE MOMENT IT IS READ (the owner, 28 Oct 2026: "reading for a minute or more … then 3 seconds and it was done").
       The stand-in answers each contract after 1.8 s and the server reads four at once, so ten take three rounds (about 5.4 s):
       the first answer must be on the desk in the first round, and the count must move by ones, never only in tens */
    const DK = await page.evaluate(() => ({ first: window._dk.first, counts: [...window._dk.counts].sort((a, b) => a - b) }));
    check('2c the first answer reaches the desk in the first round of reads (under 3.5 s), before the ten are whole', !!DK.first && DK.first.at < 3500 && DK.first.done > 0 && DK.first.done < 10, DK.first);
    check('2d the foot\'s count moves as answers land: it shows counts between the tens', DK.counts.some(n => n % 10 !== 0), DK.counts.join(' '));

    /* ---- 3 less motion: no animation on a turn, the spinner still ---- */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const before = D.cid;
    const stillTurn = await until(page, cid => { const d = document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]'); return !!d && d.getAttribute('data-ac-desk-cid') !== cid; }, before, 8000);
    const anim = await page.evaluate(() => { const d = document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]'); const sp = document.querySelector('#ac-form .ac-desk-now .ob-spin');
      return { desk: d ? d.getAnimations().length : -1, spin: sp ? getComputedStyle(sp).animationName : '' }; });
    check('3 with less motion the desk still changes, draws no animation, and the spinner stands still', stillTurn && anim.desk === 0 && anim.spin === 'none', anim);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    /* ---- 4 Stop keeps what landed and says the calls spent; Carry on reads the rest ---- */
    await page.click('#ac-form [data-ac-stop]');
    const stopped = await until(page, () => !!document.querySelector('#ig-dock #ac-stopped'), null, 20000);
    const ST = await page.evaluate(() => ({ said: (document.querySelector('#ac-stopped .pd-gl-b .ac-meta') || {}).textContent.trim(), carry: (document.querySelector('[data-ac-carry]') || {}).textContent, timer: !!AC.deskTimer }));
    check('4 Stop: "N of 100 read and kept · N not read · N Jambo calls spent", Carry on with its cost; the desk\'s timer is cleared', stopped && /^\d0 of 100 read and kept · \d0 not read · \d0 Jambo calls spent\.$/.test(ST.said) && /^Carry on · \d0 contracts · \d0 Jambo calls$/.test(ST.carry) && !ST.timer, ST);
    h.ai.slow(0);
    await page.click('[data-ac-carry]');
    const ended = await until(page, () => !document.querySelector('[data-ac-stop]') && !document.querySelector('#ac-stopped') && !!document.querySelector('#ig-dock [data-ac-prog]'), null, 60000);

    /* ---- 5 ONE BUTTON ---- */
    const card = async () => page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ac-col]'); if (!c) return null; const p = c.querySelector('.ac-th-prog');
      return { prog: p ? (p.querySelector('.ac-meta') || {}).textContent.replace(/\s+/g, ' ').trim() : '', btn: [...c.querySelectorAll('[data-ac-next]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        primary: !!c.querySelector('[data-ac-next].ui-btn-primary'), pill: !!c.querySelector('.ac-th-prog [data-ac-size]'), every: !!c.querySelector('[data-ac-reads]'),
        toast: [...document.querySelectorAll('#toast-root *')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).pop() || '', timer: !!AC.deskTimer }; });
    let C = await card();
    check('5 when the read ends: "100 of the 120 shown read · 20 still to read", ONE filled button "Read the remaining 20 · 20 Jambo calls", no pill (the rest fits), Every read ›',
      ended && !!C && /^100 of the 120 shown read · 20 still to read · /.test(C.prog) && JSON.stringify(C.btn) === JSON.stringify(['Read the remaining 20 · 20 Jambo calls']) && C.primary && !C.pill && C.every && !C.timer, C);
    check('5a the message says the same: "Notice to end: 100 of 120 read · 20 still to read"', !!C && /Notice to end: 100 of 120 read · 20 still to read/.test(C.toast), C && C.toast);
    await page.evaluate(() => { const w = window; w._lg = { all: null, gone: null };
      w._lgT = setInterval(() => { const d = !!document.querySelector('#ac-form [data-ac-desk] [data-ac-desk-cid]'), now = performance.now();
        if (d && AC.busy && AC.busy.done >= AC.busy.total && w._lg.all == null) w._lg.all = now;
        if (!d && w._lg.all != null && w._lg.gone == null) w._lg.gone = now; }, 40); });
    await page.click('#ig-dock [data-ac-next]');
    await until(page, () => !document.querySelector('[data-ac-stop]') && /^All 120 shown are read/.test(((document.querySelector('#ig-dock .ac-th-prog .ac-meta') || {}).textContent || '').trim()), null, 60000);
    const LG = await page.evaluate(() => { clearInterval(window._lgT); const l = window._lg; return { stood: l.all != null && l.gone != null ? Math.round(l.gone - l.all) : null }; });
    check('5c the desk does not vanish at the end: with every answer in, it still stands at least a second before the done line', LG.stood != null && LG.stood >= 1000 && LG.stood <= 6000, LG);
    C = await card();
    const ans = await page.evaluate(() => Object.keys((AC.ans[Object.keys(AC.ans)[0]] || {})).length);
    check('5b pressed, the rest is read: "All 120 shown are read", the button gone, 120 answers; the message "Notice to end: all 120 read"',
      !!C && /^All 120 shown are read · /.test(C.prog) && C.btn.length === 0 && C.every && ans === 120 && /Notice to end: all 120 read/.test(C.toast), C);

    /* ---- 6 the three screens: the desk fits ---- */
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh });
      /* three columns is the list's limit: take the last screen's off before asking at this one */
      await page.evaluate(() => { AC.asked = {}; AC.ans = {}; regState().ask = []; regRepaint(); });
      h.ai.slow(1800);
      /* a question nobody asked yet at this screen: kept answers cost no call and would land before the desk could be watched */
      await page.evaluate(w => askColOpen({ question: `Does this agreement name a court or an arbitrator for disputes, at ${w}?`, name: 'Disputes ' + w }), w);
      await until(page, () => !!document.querySelector('#ac-form [data-ac-ask]:not([disabled])'));
      await page.click('#ac-form [data-ac-ask]');
      const t0 = Date.now();
      const stacked = await until(page, () => document.querySelectorAll('#ac-form [data-ac-stack] li').length >= 1 && !!document.querySelector('#ac-form [data-ac-stop]'), null, 15000);
      const fit = await page.evaluate(() => { const card = document.querySelector('#ac-form'); if (!card) return { none: true, busy: !!AC.busy, form: !!AC.form, stopped: !!AC.stopped, cols: regState().ask, toast: [...document.querySelectorAll('#toast-root *')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(-2), dock: ((document.getElementById('ig-dock') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 300) }; const r = card.getBoundingClientRect(); const dock = document.getElementById('ig-dock');
        /* the spinning ring is measured standing still: a square's box grows as it turns */
        card.querySelectorAll('.ob-spin').forEach(el => { el.style.animation = 'none'; });
        const spill = [...card.querySelectorAll('*')].filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1); }).map(el => { const b = el.getBoundingClientRect(); return `${el.className || el.tagName} ${Math.round(b.left)}–${Math.round(b.right)} in ${Math.round(r.left)}–${Math.round(r.right)}`; });
        const pad = (() => { const b = card.querySelector('.pd-gl-b'); if (!b) return null; const cs = getComputedStyle(card); return [parseFloat(cs.paddingLeft), parseFloat(cs.paddingRight)]; })();
        return { spill, sideways: dock ? dock.scrollWidth > dock.clientWidth + 1 : null, pad, stack: card.querySelectorAll('[data-ac-stack] li').length, lines: [...card.querySelectorAll('.ac-stack-r, .ac-desk-who, .ac-desk-foot')].every(el => el.getBoundingClientRect().height < 40) }; });
      check(`6 at ${w}×${hh} the desk fits its card: nothing spills, nothing sideways, every line one line`, stacked && !fit.none && !fit.spill.length && !fit.sideways && fit.lines, Object.assign({ waited: Date.now() - t0, calls: h.ai.calls.length, lastCall: h.ai.calls.length ? Object.keys(h.ai.calls[h.ai.calls.length - 1]).join(',') : '' }, fit));
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(OUT, `desk-${w}x${hh}.png`) });
      /* let the read end at full speed: the one button, then all read, photographed at this screen too */
      h.ai.slow(0);
      const over = await until(page, () => !document.querySelector('[data-ac-stop]') && /^100 of the 120 shown read · 20 still to read/.test(((document.querySelector('#ig-dock .ac-th-prog .ac-meta') || {}).textContent || '').trim()), null, 60000);
      const fitB = await page.evaluate(() => { const c = document.querySelector('#ig-dock [data-ac-col]'); if (!c) return { none: true }; const r = c.getBoundingClientRect();
        const btn = c.querySelector('[data-ac-next]'); const b = btn ? btn.getBoundingClientRect() : null;
        return { btnOneLine: !!b && b.height < 40 && b.right <= r.right + 1, spill: [...c.querySelectorAll('*')].filter(el => { const x = el.getBoundingClientRect(); return x.width && (x.right > r.right + 1 || x.left < r.left - 1); }).length }; });
      check(`6a at ${w}×${hh} the one button stands on one line inside the card`, over && fitB.btnOneLine && !fitB.spill, fitB);
      await page.screenshot({ path: path.join(OUT, `after-${w}x${hh}.png`) });
      await page.click('#ig-dock [data-ac-next]');
      await until(page, () => !document.querySelector('[data-ac-stop]') && /^All 120 shown are read/.test(((document.querySelector('#ig-dock .ac-th-prog .ac-meta') || {}).textContent || '').trim()), null, 60000);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, `done-${w}x${hh}.png`) });
    }
    check('no page errors', !errors.length, errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASS'}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
