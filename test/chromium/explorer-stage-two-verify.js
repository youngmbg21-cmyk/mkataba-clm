/* Chromium verification: EXPLORER STAGE 2 — ASK THE MAP A QUESTION
   ==============================================================
   The owner, 18 Oct 2026: "build all the stages autonomously and merge them
   stage by stage". Stage 2's five, each reading facts the record holds:
   (1) a typed date — "renewals before 30 April 2027" — puts a dashed line on
   the Timeline at that day and lights the contracts up to it, counting what
   it lights; "remove the date line" takes it off; (2) "what depends on
   <party>" opens Wiring and says what hangs on the party — with them, through
   a link, the streams, the open obligations; (3) "which contracts are
   single-sourced" lights the contracts whose party is the ONLY one in its role
   (the record's category) in its value stream, and counts those with no role;
   (4) with the floors by payment terms each floor counts the contracts over
   their own payment standard, and the standard is drawn between two floors
   only when every contract answers to one standard on a floor's edge; (5) the
   floor where the fact is not recorded carries "Open these N", which opens
   them in the Contracts list.

   Every count is measured twice: by the page's own reading and by this check,
   from the record. What is drawn is listened to on the canvas (fillText,
   setLineDash). Waits ask for the state, bounded.

   Red at the parent (e4291ce): no date is read (no line, nothing lit), the
   party's answer stays a bare count on the Brain, nothing is single-sourced,
   the floors carry no standard, and there is no door.

   Screenshots go to test/chromium/shots/explorer-stage-two/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-stage-two-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-stage-two');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthEndDate = off => { const n = new Date(); n.setHours(0, 0, 0, 0); return new Date(n.getFullYear(), n.getMonth() + off + 1, 0); };
const monthEnd = off => iso(monthEndDate(off));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* Three streams. Procurement buys from two suppliers, Sales sells to three
   customers, Manufacturing buys from one supplier and leases from one
   landlord — the two "only ones". Every seventh contract has no role and no
   payment terms. Kipande's first contract has an amendment and an obligation
   another party's contract waits on (a chain link). */
const ST = ['proc', 'sales', 'mfg'];
const TERMS = ['Net 30', 'Net 45', 'Net 60', '90 days', 'Net 14'];
const NOTICE = [30, 60, 90, 45];
const BOOK = Array.from({ length: 36 }, (_, i) => {
  const s = ST[i % 3], k = Math.floor(i / 3);
  let party, cat;
  if (s === 'proc') { party = k % 2 ? 'Savanna Freight' : 'Kipande Logistics'; cat = 'supplier'; }
  else if (s === 'sales') { party = ['Tausi Retail', 'Juno Stores', 'Baraka Foods'][k % 3]; cat = 'customer'; }
  else if (k % 4 === 3) { party = 'Nyumba Estates'; cat = 'lease'; }
  else { party = 'Mvua Components'; cat = 'supplier'; }
  const c = fixtureContract('MK-T' + i, ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i, party, s,
    ((i * 37) % 90 + 5) * 1e6, ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]);
  c.metadata = Object.assign({}, c.metadata || {}, { category: cat, paymentTerms: TERMS[i % 5], noticePeriodDays: NOTICE[i % 4] });
  if (i % 7 === 6) { delete c.metadata.category; delete c.metadata.paymentTerms; }
  c.expiry = monthEnd(2 + (i % 14));
  return c;
});
BOOK[0].obligations = [{ id: 'ob_t0', title: 'Deliver the first lot', due: monthEnd(1), status: 'pending' }];
BOOK[4].obligations = [{ id: 'ob_t4', title: 'Pay for the first lot', due: monthEnd(2), status: 'pending', after: 'ob_t0' },
  { id: 'ob_t4b', title: 'Second payment', due: monthEnd(3), status: 'pending' }];
BOOK.push(Object.assign(fixtureContract('MK-T0-A1', 'Freight Services 0 — Amendment 1', 'Kipande Logistics', 'proc', 4e6, 'Signed'),
  { parentId: 'MK-T0', relation: 'amendment', expiry: monthEnd(9) }));
BOOK[BOOK.length - 1].metadata = Object.assign({}, BOOK[BOOK.length - 1].metadata, { category: 'supplier', paymentTerms: 'Net 30' });

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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): everything typed on a Jambo tab goes to the AI (igTalkFirst); this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
    await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); } }); await page.fill('#igd-input', q); await page.click('#igd-go');
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(300); };
  const said = () => page.evaluate(() => String((intel.history[intel.history.length - 1] || {}).text || '').replace(/&amp;/g, '&'));
  /* what the canvas PAINTS in the next frames: every fillText, and every dash pattern set */
  const paint = () => page.evaluate(() => new Promise(res => {
    const ctx = IG && IG.ctx; if (!ctx) return res({ texts: [], dashes: [] });
    const texts = [], dashes = [], ft = ctx.fillText, sd = ctx.setLineDash;
    ctx.fillText = function (t, ...a) { texts.push(String(t)); return ft.call(this, t, ...a); };
    ctx.setLineDash = function (d) { if (d && d.length) dashes.push(d.join(',')); return sd.call(this, d); };
    try { if (typeof igWake === 'function') igWake(); } catch (_) {}
    setTimeout(() => { ctx.fillText = ft; ctx.setLineDash = sd; res({ texts, dashes }); }, 450);
  }));
  const settle = v => until(k => intel.cam && intel.cam.w[k] > 0.97, v);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-T7'), null, { timeout: 15000 });
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igViews'); } catch (_) {} intel.cam = null; intel.tab = 'map'; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);

    /* ================= 1. THE TYPED DATE LINE ================================= */
    const D = monthEndDate(6), Dw = `${D.getDate()} ${MONTHS[D.getMonth()]} ${D.getFullYear()}`, Diso = iso(D);
    await ask('renewals before ' + Dw);
    await settle(4);
    const u1 = await page.evaluate(d => {
      const kids = IG.nodes.filter(n => n.kind === 'contract'), t = todayISO();
      const want = kids.filter(n => { const x = graphDecisionOf(n.c).date; return x && String(x).slice(0, 10) >= t && String(x).slice(0, 10) <= d; }).map(n => n.id).sort();
      const lens = intel.lenses.find(l => l.kind === 'until');
      return { view: intel.cam.w.indexOf(Math.max(...intel.cam.w)), key: IG.tl && IG.tl.key, until: intel.tlUntil, tl: IG.tl && IG.tl.until, want,
        lit: lens ? lens.ids.filter(id => kids.some(n => n.id === id)).sort() : null, dated: kids.filter(n => graphDecisionOf(n.c).date).length };
    }, Diso);
    check('1a "renewals before <a day>" turns to the Timeline of renewal decisions and holds the day asked',
      u1.view === 4 && u1.key === 'decision' && u1.until === Diso, JSON.stringify({ view: u1.view, key: u1.key, until: u1.until, Diso }));
    check('1b it lights exactly the contracts whose renewal decision falls between today and that day — and some are left dark',
      u1.lit && u1.want.length >= 2 && JSON.stringify(u1.lit) === JSON.stringify(u1.want) && u1.want.length < u1.dated, JSON.stringify({ want: u1.want.length, lit: u1.lit && u1.lit.length, dated: u1.dated }));
    const p1 = await paint();
    const dayWord = await page.evaluate(d => (typeof igDayWord === 'function' ? igDayWord(d) : d), Diso);
    const lab1 = p1.texts.find(t => t.startsWith(dayWord + ' · '));
    check('1c the line is painted dashed, with its day and the number it lights under the dates',
      p1.dashes.length >= 1 && lab1 === `${dayWord} · ${u1.want.length} up to here`, JSON.stringify({ dashes: p1.dashes.slice(0, 2), lab1, want: `${dayWord} · ${u1.want.length} up to here` }));
    const s1 = await said();
    check('1d the answer says the same number and the day', s1.includes(`${u1.want.length} contracts have a renewal decision date between today and ${dayWord}`), s1);
    const lg1 = await page.evaluate(() => document.querySelector('[data-ig-legend-until]')?.textContent.trim() || '');
    check('1e the legend names the dashed line', lg1.includes(dayWord), lg1);
    await page.screenshot({ path: path.join(OUT, '1-date-line.png') });
    const r1 = await page.evaluate(() => { const r = igRecipeNow(); return r.tlUntil; });
    await ask('remove the date line');
    const off1 = await page.evaluate(() => ({ until: intel.tlUntil, tl: IG.tl && IG.tl.until, lens: intel.lenses.some(l => l.kind === 'until') }));
    await ask('undo');
    const back1 = await page.evaluate(() => intel.tlUntil);
    check('1f the line rides the recipe: "remove the date line" takes it and its light off, "undo" brings it back',
      r1 === Diso && off1.until === null && !off1.tl && !off1.lens && back1 === Diso, JSON.stringify({ r1, off1, back1 }));
    await ask('contracts that end by the end of the year');
    const y1 = await page.evaluate(() => ({ until: intel.tlUntil, key: IG.tl && IG.tl.key }));
    check('1g "end by the end of the year" reads the expiry date and the year\'s last day', y1.key === 'expiry' && y1.until === new Date().getFullYear() + '-12-31', JSON.stringify(y1));
    const words = await page.evaluate(() => {
      if (typeof igDateRead !== 'function' || typeof igUntilRead !== 'function') return { missing: 'no date reader' };
      const r = q => { const p = igRecipeParse(q); return p ? p.acts.map(a => Object.keys(a).filter(k => a[k] != null).join('+')).join(',') : null; };
      return { bad: igDateRead('30 february 2031', false), day: igDateRead('31 march 2031', false), mon: igDateRead('june 2031', true), monBy: igDateRead('june 2031', false),
        owner: r('group by owner'), payterm: r('floors by payment terms'), notDate: igUntilRead('renewals before the board meets') };
    });
    check('1h a day is READ, never guessed: no 30 February; "before June" is the end of May, "by June" its end; "group by owner" stays a grouping; words that are no day are no line',
      words.bad === null && words.day === '2031-03-31' && words.mon === '2031-05-31' && words.monBy === '2031-06-30' && /^role\+fact/.test(words.owner || '') && /role\+fact/.test(words.payterm || '') && words.notDate === null,
      JSON.stringify(words));
    await ask('remove the date line');

    /* ================= 2. WHAT HANGS ON A PARTY =============================== */
    await ask('what depends on kipande');
    await settle(1);
    const r2 = await page.evaluate(() => {
      const own = state.contracts.filter(c => c.counterparty === 'Kipande Logistics').map(c => c.id), more = new Set(own);
      buildGraphEdges(state.contracts).filter(e => e.kind !== 'party').forEach(e => { if (own.includes(e.from)) more.add(e.to); if (own.includes(e.to)) more.add(e.from); });
      const reach = [...more].map(getContract);
      const open = reach.reduce((t, c) => t + (c.obligations || []).filter(o => !o.completedAt && !o.done && o.status !== 'done').length, 0);
      const lens = intel.lenses.find(l => l.on && l.action === 'filter');
      return { view: intel.cam.w.indexOf(Math.max(...intel.cam.w)), n: more.size, k: own.length, l: more.size - own.length,
        s: new Set(reach.map(c => c.folder)).size, o: open, lens: lens ? lens.ids.length : null };
    });
    const s2 = await said();
    check('2a "what depends on Kipande" opens Wiring, where the links are drawn, on Kipande and what links to it', r2.view === 1 && r2.lens === r2.n && r2.l >= 1, JSON.stringify(r2));
    check('2b it says what hangs on the party — with them, through a link, the streams, the open obligations — each counted from the record',
      s2.includes(`Tied to Kipande Logistics: ${r2.n} contracts — ${r2.k} with them, ${r2.l} through a link — across ${r2.s} value streams, ${r2.o} obligations open`), s2 + ' | ' + JSON.stringify(r2));
    await page.screenshot({ path: path.join(OUT, '2-party-reach.png') });
    await ask('show everything');

    /* ================= 3. ONLY ONE OF ITS KIND ================================= */
    await ask('which contracts are single-sourced');
    const r3 = await page.evaluate(() => {
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined' && (typeof isAgreement !== 'function' || isAgreement(c)));
      const g = {}; let none = 0;
      live.forEach(c => { const r = c.metadata && c.metadata.category; if (!r || r === 'other') { none++; return; } (g[c.folder + '|' + r] = g[c.folder + '|' + r] || []).push(c); });
      const want = Object.values(g).filter(l => new Set(l.map(c => c.counterparty)).size === 1).flat().map(c => c.id).sort();
      const lens = intel.lenses.find(l => l.kind === 'sole' && l.on);
      return { want, none, lit: lens ? lens.ids.slice().sort() : null, badge: lens && lens.badges ? lens.badges[want.find(id => getContract(id).counterparty === 'Mvua Components')] : null,
        lease: lens && lens.badges ? lens.badges[want.find(id => getContract(id).counterparty === 'Nyumba Estates')] : null, mfg: groupLabelOf(getContract('MK-T2'), 'folder') };
    });
    const s3 = await said();
    check('3a "which contracts are single-sourced" lights exactly the contracts whose party is the only one in its role in its stream',
      r3.lit && r3.want.length >= 4 && JSON.stringify(r3.lit) === JSON.stringify(r3.want), JSON.stringify({ want: r3.want, lit: r3.lit }));
    check('3b each carries its role and stream as its badge', r3.badge === 'Only supplier in ' + r3.mfg && r3.lease === 'Only lease in ' + r3.mfg, JSON.stringify({ badge: r3.badge, lease: r3.lease }));
    check('3c the answer counts what it lit and the contracts with no role, which were not judged',
      s3.includes(`${r3.want.length} lit`) && s3.includes(`${r3.none} contracts have no role filled in`), s3);
    await page.screenshot({ path: path.join(OUT, '3-only-one.png') });
    const r3b = await page.evaluate(() => { const p = igRecipeParse('only suppliers'); return p && p.acts.map(a => a.narrow ? a.narrow.mode : Object.keys(a)[0]).join(','); });
    check('3d "only suppliers" still narrows to the supplier side, as before', r3b === 'only', r3b);
    await ask('show everything');

    /* ================= 4. OUR PAYMENT STANDARD ON THE FLOORS =================== */
    await ask('floors by payment terms');
    await settle(2);
    const floorsWith = std => page.evaluate(t => {
      state.settings = state.settings || {}; if (t) state.settings.payTargets = t; else delete state.settings.payTargets;
      rebuildIntelGraph();
      const kids = IG.nodes.filter(n => n.kind === 'contract');
      const want = {}; IG.floors.forEach((f, i) => { want[f.label] = kids.filter(n => n._floor === i && payOver(n.c)).length; });
      return { floorKey: IG.floorKey, over: Object.fromEntries(IG.floors.map(f => [f.label, f.over])), want, std: IG.payStd && IG.payStd.std };
    }, std);
    const f45 = await floorsWith({ customer: 45, supplier: 45 });
    await settle(2);
    const p4 = await paint();
    const ovWant = Object.entries(f45.want).filter(([, n]) => n > 0).map(([, n]) => `${n} over our standard`);
    check('4a with the floors by payment terms each floor counts the contracts over their own standard',
      f45.floorKey === 'payterms' && ovWant.length >= 2 && JSON.stringify(f45.over) === JSON.stringify(f45.want), JSON.stringify(f45));
    check('4b the counts are painted under the floors, and one standard of 45 days is drawn between the floors it divides',
      ovWant.every(w => p4.texts.includes(w)) && f45.std === 45 && p4.texts.includes('Our standard · 45 days') && p4.dashes.length >= 1,
      JSON.stringify({ ovWant, std: f45.std, plane: p4.texts.filter(t => /standard/.test(t)) }));
    const lg4 = await page.evaluate(() => document.querySelector('[data-ig-legend-pay]')?.textContent.trim() || '');
    check('4c the legend says amber is over our payment standard, each contract against its own', /over our payment standard/.test(lg4), lg4);
    await page.screenshot({ path: path.join(OUT, '4-payment-standard.png') });
    const f2 = await floorsWith({ customer: 30, supplier: 60 });
    const p4b = await paint();
    check('4d two standards (we are paid in 30, we pay in 60) are counted per contract, and no single standard is drawn',
      JSON.stringify(f2.over) === JSON.stringify(f2.want) && !f2.std && !p4b.texts.some(t => /^Our standard/.test(t)), JSON.stringify(f2));
    await floorsWith(null);

    /* ================= 5. THE EMPTY FLOOR IS A DOOR ============================ */
    await settle(2);
    await until(() => { const b = document.getElementById('ig-floor-door'); return b && !b.hidden; }, null, 4000);
    const d5 = await page.evaluate(() => {
      const b = document.getElementById('ig-floor-door'), f = IG.floors.findIndex(x => x.label === 'No payment terms');
      const ids = IG.nodes.filter(n => n.kind === 'contract' && n._floor === f).map(n => n.id).sort();
      if (!b || b.hidden) return { shown: false, ids };
      const r = b.getBoundingClientRect(), s = document.getElementById('ig-gwrap').getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { shown: true, text: b.textContent, ids, inside: r.left >= s.left && r.right <= s.right && r.top >= s.top && r.bottom <= s.bottom, top: top === b };
    });
    check('5a the "No payment terms" floor carries "Open these N", N its own count, inside the stage and not covered',
      d5.shown && d5.ids.length >= 3 && d5.text === `Open these ${d5.ids.length} ›` && d5.inside && d5.top, JSON.stringify(d5));
    await page.screenshot({ path: path.join(OUT, '5-empty-floor-door.png') });
    if (d5.shown) await page.click('#ig-floor-door');
    /* on a computer the Contracts list is a place on Home (setView('register') → the place) */
    const g5 = !d5.shown ? null : await until(() => { const R = (typeof regState === 'function') && regState(), el = document.getElementById('ct-place');
      return el && el.getBoundingClientRect().width > 0 && R && R.only ? { ids: R.only.ids.slice().sort(), label: R.only.label } : null; }, null, 6000);
    check('5b pressing it opens the Contracts list on exactly those contracts, named for the floor',
      g5 && JSON.stringify(g5.ids) === JSON.stringify(d5.ids) && g5.label === 'No payment terms', JSON.stringify(g5));
    await page.evaluate(() => { intel.tab = 'map'; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 1);
    await page.evaluate(() => igSetView(0)); await settle(0);
    check('5c on another view the door is not drawn', await page.evaluate(() => { const b = document.getElementById('ig-floor-door'); return !b || b.hidden; }));

    check('6a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
