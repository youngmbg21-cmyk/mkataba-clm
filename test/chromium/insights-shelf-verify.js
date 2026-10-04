/* Chromium verification: TODAY'S INSIGHTS — THE SHELF (Young picked "Shelf"
   by name; "Build it", 4 Oct 2026) — CHOSEN AS "YOURS, MEASURED" (Young
   picked it by name the same day: "hati is a company platform")
   ============================================================
   Inside Prepared by Copilot on Home: a row and up to three small pictures of
   what is OUTSIDE ITS NORMAL RANGE — the reader's own contracts first, then
   the company's — each with Keep · Open · Ask why · let go.
     1. the shelf is drawn from a book where the reader's own payment days
        left their normal range; the picture is marked "Yours", says the range
        and the company's figure, draws the range on itself, and is one press;
        a place no finding filled says so, with the usual pictures one press
        away (and that press takes them away again);
     2. (folded into 1)
     3. Open is the board's own dig-in on "my contracts", with its dropdowns;
     4. Keep puts "Your payment days…" on the board, the button says Kept, and
        the brief is told (PUT /api/home/kept);
     5. let go takes it off and it rests;
     6. Ask why puts the question in the panel on the page;
     7. a quiet day: nothing outside normal — the row says so, no filler, the
        usual pictures behind one press;
     8. on a narrow window nothing scrolls sideways.
   Dates are built from today (a test whose answer depends on the day it runs
   is worse than none). Waits ask for the state, bounded.
   Screenshots go to test/chromium/shots/insights-shelf/.
   Run: node test/chromium/insights-shelf-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'insights-shelf');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* twelve closed months, four contracts signed in each, payment days steady
   at 30–32; in the last closed month the reader's own three (j < 3) are paid
   in 60. Who owns them is stamped after sign-in (MINE), as the record says. */
const DRIFT = [];
for (let m = 12; m >= 1; m--) for (let j = 0; j < 4; j++){
  const c = fixtureContract(`MK-P${m}-${j}`, `Supply ${m}-${j}`, ['Naivas Supermarkets', 'Kabras Sugar', 'Bidco Africa', 'Twiga Foods'][j], 'proc', 1e6, 'Signed');
  c.signedAt = dayIn(-m, 10 + j); c.metadata = { ...c.metadata, paymentTerms: (m === 1 && j < 3 ? 60 : 30 + (m % 3)) + ' days' };
  DRIFT.push(c);
}
const BOOK = FIXTURES.concat(DRIFT);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const kept = [];
  page.on('request', r => { if (/\/api\/home\/kept$/.test(r.url()) && r.method() === 'PUT') kept.push(r.postData() || ''); });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(n => window.state && state.contracts && state.contracts.length >= n, BOOK.length, { timeout: 20000 });
    await page.evaluate(() => { window._outsideChat = 0; window.openAI = () => { window._outsideChat++; };
      /* the reader owns three of each month's four */
      const me = currentUser(); state.contracts.forEach(c => { const m = /^MK-P\d+-(\d)$/.exec(c.id); if (m) c.owner = Number(m[1]) < 3 ? { id: me.id, name: me.name } : { id: 'u_other', name: 'Someone Else' }; });
      const s = hbS(); s.face = 'board'; s.prep = 'open'; s.ins = null; s.insOff = {}; s.insKept = {}; s.panels = []; s.path = []; hbSave(); setView('dashboard'); });
    const has = await until(() => typeof hbInsightsToday === 'function' && !!document.querySelector('#hm-agents .hb-shelf')
      && hbS().ins && hbS().ins.n === hbInsBookSig() && document.querySelectorAll('#hm-agents .hb-shelf .hb-ins').length === hbS().ins.list.length);
    if (!has){ check('1a the shelf is drawn inside Prepared by Copilot', false, 'no .hb-shelf'); throw new Error('no shelf'); }

    /* ================= 1. YOURS, MEASURED ================= */
    const s1 = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#hm-agents .hb-shelf .hb-ins')];
      const c = document.querySelector('[data-hb-ins-card="pay.mine"]'), band = c && c.querySelector('.hb-ins-pic .hb-sv-band'), lit = c && c.querySelector('.hb-ins-pic .hb-sv-collit');
      const bb = band && band.getBoundingClientRect();
      return { n: cards.length, ids: cards.map(x => x.getAttribute('data-hb-ins-card')), scope: hbS().ins.scope,
        acts: cards.every(x => x.querySelector('[data-hb-ins="keep"]') && x.querySelector('[data-hb-ins="open"]') && x.querySelector('[data-hb-ins="why"]') && x.querySelector('[data-hb-ins="go"]')),
        doorsInside: document.querySelectorAll('#hm-agents .hb-ins-pic [data-hb-dig], #hm-agents .hb-ins-pic [tabindex]').length,
        chip: c && (c.querySelector('.hb-ins-scope') || {}).textContent, t: c && c.querySelector('.hb-ins-t').textContent, f: c && c.querySelector('.hb-ins-f').textContent,
        why: c && (c.querySelector('.hb-ins-why') || {}).textContent,
        band: bb ? { h: Math.round(bb.height), fill: getComputedStyle(band).fill, stroke: getComputedStyle(band).strokeStyle || getComputedStyle(band).stroke } : null,
        lit: lit ? getComputedStyle(lit).fill + ' / ' + getComputedStyle(lit).fillOpacity : null,
        row: ((document.querySelector('#hm-agents .hb-ins-row') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        calm: ((document.querySelector('#hm-agents .hb-ins-calm') || {}).textContent || '').replace(/\s+/g, ' ').trim() };
    });
    check('1a your own contracts come first: the payment-days picture is yours', s1.ids[0] === 'pay.mine' && s1.scope === 'mine' && s1.n <= 3, JSON.stringify(s1.ids));
    check('1b marked yours, titled by what left its normal', /^Yours · \d+$/.test(s1.chip || '') && /Payment days are above normal/.test(s1.t || ''), `${s1.chip} | ${s1.t}`);
    check('1c it says the month, your normal range and the company\'s figure', /^60 days in .+ · your normal 30–32 days · company \d+ days$/.test(s1.f || ''), s1.f);
    check('1d and why it is here', /Outside the normal range of your own contracts over the past year\./.test(s1.why || ''), s1.why);
    check('1e the picture draws the normal range and lights its month', !!s1.band && s1.band.h > 0 && s1.band.fill !== 'none' && !!s1.lit && !/none/.test(s1.lit), JSON.stringify({ band: s1.band, lit: s1.lit }));
    check('1f every picture carries Keep · Open · Ask why · let go, and is one press', s1.acts && s1.doorsInside === 0, `${s1.doorsInside} doors inside`);
    check('1g its row says whose', /Today.s insights\s*\d.*in your contracts, then the company.s/.test(s1.row), s1.row);
    await page.waitForTimeout(1500);   /* the columns rise in; photograph them risen */
    await page.screenshot({ path: path.join(OUT, '1-yours-measured.png') });
    if (s1.n < 3){
      check('1h a place no finding filled says so', /^Nothing else stood out today\. Show the usual pictures \(\d\)$/.test(s1.calm), s1.calm);
      await page.evaluate(() => document.querySelector('#hm-agents .hb-ins-calm [data-hb-ins="usual"]').click());
      const u = await until(n => { const k = document.querySelectorAll('#hm-agents .hb-ins.is-plain').length; return k ? { plain: k, all: document.querySelectorAll('#hm-agents .hb-ins').length } : null; }, s1.n);
      check('1i one press shows the usual pictures, plain, after the findings', !!u && u.all === s1.n + u.plain, JSON.stringify(u));
      await page.screenshot({ path: path.join(OUT, '1-usual-pictures.png') });
      await page.evaluate(() => document.querySelector('#hm-agents .hb-ins-calm [data-hb-ins="usual"]').click());
      const hid = await until(() => document.querySelectorAll('#hm-agents .hb-ins.is-plain').length === 0);
      check('1j and the same press takes them away', !!hid);
    }

    /* ================= 3. OPEN IS THE BOARD'S OWN DIG-IN ================= */
    await page.evaluate(() => document.querySelector('[data-hb-ins-card="pay.mine"] [data-hb-ins="open"]').click());
    const s3 = await until(() => { const d = document.querySelector('#hb-focus .hb-dig'); if (!d) return null;
      return { recipe: !!d.querySelector('.hb-recipe, [data-hb-rc]'), cols: !!d.querySelector('svg.hb-cols'), key: (hbS().path || []).slice(-1)[0],
        ids: hbDigData((hbS().path || []).slice(-1)[0], 'all').ids }; });
    const s3mine = s3 && await page.evaluate(ids => ({ n: ids.length, notMine: ids.filter(id => !contractOwnedBy(getContract(id), currentUser())).length }), s3.ids);
    check('3a Open lands on the board\'s own dig-in, with its dropdowns', !!s3 && s3.recipe && s3.cols, s3 && JSON.stringify({ recipe: s3.recipe, cols: s3.cols }));
    check('3b on your own contracts — the same question the picture asked', !!s3 && /^q:average payment days of my signed contracts/.test(s3.key) && s3mine.n >= 36 && s3mine.notMine === 0, s3 && `${s3.key} · ${JSON.stringify(s3mine)}`);
    await page.screenshot({ path: path.join(OUT, '3-open.png') });
    await page.evaluate(() => { const s = hbS(); s.path = []; hbSave(); hbPaintBoard(); });

    /* ================= 4. KEEP ================= */
    await page.evaluate(() => document.querySelector('[data-hb-ins-card="pay.mine"] [data-hb-ins="keep"]').click());
    const s4 = await until(() => { const v = document.querySelector('.hb-grid .hb-view'); const b = document.querySelector('[data-hb-ins-card="pay.mine"] [data-hb-ins="keep"]');
      return v ? { title: v.querySelector('.hb-ct').textContent, chart: !!v.querySelector('svg.hb-cols'), kept: b && b.disabled, label: b && b.textContent.trim() } : null; });
    check('4a Keep puts your kept view on the board that counts again', !!s4 && s4.chart && /^Your payment days by month signed$/.test(s4.title), JSON.stringify(s4));
    check('4b and the picture\'s button says Kept', !!s4 && s4.kept && s4.label === 'Kept', s4 && s4.label);
    const told = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 4000 && !kept.some(b => /Your payment days/.test(b))) await page.waitForTimeout(100); return kept.find(b => /Your payment days/.test(b)); })();
    check('4c the daily brief is told what Home counted (PUT /api/home/kept)', !!told && /"at":"\d{4}-\d{2}-\d{2}"/.test(told), (told || 'nothing sent').slice(0, 160));
    await page.screenshot({ path: path.join(OUT, '4-kept.png') });

    /* ================= 6. ASK WHY (before the let-go, while yours is up) ================= */
    await page.evaluate(() => { intel.dockOpen = true; const b = document.getElementById('igd-input'); if (b) b.value = ''; document.querySelector('[data-hb-ins-card="pay.mine"] [data-hb-ins="why"]').click(); });
    const s6 = await until(() => { const b = document.getElementById('igd-input'); return b && b.value ? { v: b.value, out: window._outsideChat } : null; }, null, 3000);
    check('6a Ask why puts the question in the Copilot panel on the page, about your contracts', !!s6 && /^What explains this: .*\(in my contracts\)/.test(s6.v) && s6.out === 0, JSON.stringify(s6));
    await page.evaluate(() => { const b = document.getElementById('igd-input'); if (b) b.value = ''; });

    /* ================= 5. LET GO, AND IT RESTS ================= */
    const before = await page.evaluate(() => document.querySelectorAll('.hb-shelf .hb-ins:not(.is-plain)').length);
    await page.evaluate(() => document.querySelector('[data-hb-ins-card="pay.mine"] [data-hb-ins="go"]').click());
    const s5 = await until(() => !document.querySelector('[data-hb-ins-card="pay.mine"]') ? { n: document.querySelectorAll('.hb-shelf .hb-ins:not(.is-plain)').length, off: hbS().insOff.pay } : null);
    check('5a let go takes it off the shelf', !!s5 && s5.n === before - 1, JSON.stringify({ before, s5 }));
    const s5b = await page.evaluate(() => { const s = hbS(); s.ins = { day: '2000-01-01', list: [] }; hbSave(); hbPaintBoard(); return { list: hbS().ins.list, resting: hbInsResting('pay') }; });
    check('5b tomorrow\'s pictures do not bring it back for 30 days', !s5b.list.some(x => /^pay/.test(x)) && s5b.resting, JSON.stringify(s5b));

    /* ================= 7. A QUIET DAY ================= */
    await page.evaluate(() => { state.contracts.forEach(c => { if (/^MK-P1-[0-2]$/.test(c.id)) c.metadata = { ...c.metadata, paymentTerms: '31 days' }; });
      const s = hbS(); s.ins = null; s.insOff = {}; s.panels = []; hbSave(); hbPaintBoard(); });
    const s7 = await until(() => { const r = document.querySelector('#hm-agents .hb-ins-row'); if (!r || !hbS().ins || hbS().ins.list.length) return null;
      return { row: r.textContent.replace(/\s+/g, ' ').trim(), cards: document.querySelectorAll('#hm-agents .hb-ins').length, btn: (r.querySelector('[data-hb-ins="usual"]') || {}).textContent }; });
    check('7a a quiet day: the row says nothing moved outside normal', !!s7 && /nothing moved outside its normal range this morning/.test(s7.row), s7 && s7.row);
    check('7b and no filler is drawn', !!s7 && s7.cards === 0, s7 && `${s7.cards} cards`);
    await page.screenshot({ path: path.join(OUT, '7-quiet-day.png') });
    await page.evaluate(() => document.querySelector('#hm-agents .hb-ins-row [data-hb-ins="usual"]').click());
    const s7c = await until(() => { const n = document.querySelectorAll('#hm-agents .hb-ins.is-plain').length; return n ? { n, btn: document.querySelector('#hm-agents .hb-ins-row [data-hb-ins="usual"]').textContent } : null; });
    check('7c the usual pictures are one press away', !!s7c && s7c.n >= 1 && /Hide the usual pictures/.test(s7c.btn), JSON.stringify(s7c));
    await page.screenshot({ path: path.join(OUT, '7-quiet-day-usual.png') });

    /* ================= 8. ON A NARROW WINDOW ================= */
    await page.setViewportSize({ width: 820, height: 900 });
    await page.waitForTimeout(400);
    const over = await page.evaluate(() => { const b = document.getElementById('hb-board'); return b ? b.scrollWidth - b.clientWidth : -1; });
    check('8a narrow, the shelf stacks and nothing scrolls sideways', over <= 1, `${over}px`);
    await page.screenshot({ path: path.join(OUT, '8-narrow.png') });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('stage ran', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    process.exit(bad.length ? 1 : 0);
  }
})();
