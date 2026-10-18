/* JAMBO SAYS THE CONTRACT IN FRONT — the redesign's gaps on Home (rounds 13,
   7 and 12 as drawn; the owner's "build all the gaps", 18 Oct 2026;
   js/views/intelligence.js igWallPress, js/paperdesk.js pdChosenHtml ·
   pdCardGlanceHtml · pdHistGlanceHtml, js/views/boardstrip.js, js/views/contract.js)

   WHAT THIS PINS, driven in a real browser
     1 ROUND 13, the Contracts wall: a press CHOOSES a paper — lit, nothing
       opened — and Jambo's panel says it: "Contract" in its head, the name,
       ref · party, Stage · Stream · Value · Ends · Owner · Last move, Needs
       you, Open the paper and Life line and details; the box "Ask for a
       contract, a number or a list…". Another paper moves the choice; Esc and
       a press elsewhere let it go; a second press, Enter or Open the paper
       opens it; Life line and details brings up its page; a refresh keeps the
       choice. The wall stands in one card: "N contracts · newest first",
       twelve papers, "Showing 12 of N · Show more".
     2 ROUND 7, a contract brought up as a page: Jambo says "<ref> at a
       glance" — the obligation late, the signed amendment (Bring it up), the
       notice day — chips obligations · history · amend, the box "Ask about
       <ref>…"; the page wears the paper line's stage pill, says when it was
       signed, a late next obligation in the late colour with how late, and
       "Open the paper" in its foot.
     3 ROUND 12, its History: Jambo says "<ref> · History" — the last two
       weeks, the newest, what is open with whose move and the Redlines door —
       chips the questions and redline (a question goes into the box), the box
       "Ask about <ref>'s history…", and a question asked there goes with that
       contract's wording; the head counts the open changes over one toolbar
       (search · Filter · Show the wording · ⋯); the day's pill "Thu 15 Oct";
       a change's entry in words.
     4 the owner's three screens: nothing sideways, the panel's card in view.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/home-held-contract-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const day = n => { const t = new Date(); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const DOC = ['MASTER SERVICES AGREEMENT', '', '1. Services', '', 'The supplier provides the services in Schedule 1.', '', '2. Fees', '', 'Fees are invoiced monthly.', '',
  '3. Liability', '', 'Liability is capped at 50% of the fees paid in that year.', '', '4. Payment', '', 'Each correct invoice is paid within 30 days of receipt.'].join('\n');
const SIG = n => [{ party: 'first', name: 'Amina Otieno', at: new Date(Date.now() - n * 864e5).toISOString() }, { party: 'counterparty', name: 'Hanna Brightwater', at: new Date(Date.now() - n * 864e5).toISOString() }];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const A = H.fixtureContract('MK-0377', 'Supply agreement', 'Brightwater Foods', H.FOLDER_A, 6400000, 'Signed', DOC);
  Object.assign(A, { expiry: day(560), fields: { value: '6400000', effDate: day(-170) }, signedAt: new Date(Date.now() - 172 * 864e5).toISOString(), signatures: SIG(172),
    metadata: { value: 6400000, currency: 'KES', renewalType: 'auto-renew', noticePeriodDays: 90, renewalTermMonths: 12 },
    obligations: [{ id: 'o1', desc: 'Check the September invoice', party: 'ours', due: day(-7), status: 'open' }, { id: 'o2', desc: 'Food safety certificate', party: 'theirs', due: day(75), status: 'open' }] });
  const A1 = H.fixtureContract('MK-0377-A1', 'Amendment 1 to the Supply agreement', 'Brightwater Foods', H.FOLDER_A, 7100000, 'Signed', 'AMENDMENT 1\n\n1. Volumes\n\nThe yearly volume is raised by ten per cent.');
  Object.assign(A1, { parentId: 'MK-0377', relation: 'amendment', valueSetHere: true, expiry: null, metadata: { value: 7100000, currency: 'KES', effectiveDate: day(-20) }, signedAt: new Date(Date.now() - 20 * 864e5).toISOString(), signatures: SIG(20) });
  const N = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik', H.FOLDER_A, 4200000, 'Under Review', DOC);
  N.expiry = day(800);
  const more = Array.from({ length: 13 }, (_, i) => H.fixtureContract('MK-W' + (i + 1), 'Services agreement ' + (i + 1), 'Party ' + (i + 1), H.FOLDER_A, 100000 * (i + 1), i % 2 ? 'Signed' : 'Draft', i % 2 ? undefined : DOC));
  await H.seedWorkspace(h, { contracts: [A, A1, N, ...more, ...H.FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const asks = [];
    page.on('request', r => { if (/\/api\/ai\/chat\b/.test(r.url()) && r.method() === 'POST') { try { asks.push(JSON.parse(r.postData() || '{}')); } catch (_) {} } });
    /* a press on what is not there reports, never waits out a timeout */
    const press = async sel => { const el = await page.$(sel); if (!el) return false; await el.click(); return true; };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const login = async () => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await press('#li-go');
      await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, 20000);
      await page.keyboard.press('Escape').catch(() => {});
    };
    await login();
    /* their round: two changes from Nordvik on the master services agreement */
    await page.evaluate(async () => {
      const c = getContract('MK-0382'); if (c._light && window.ensureFull) await ensureFull(c);
      negoInit(c); const cl = negoClauseList(c);
      const at = n => cl.find(x => /Liability|Payment/.test(String(x.clauseLabel || x.headingText || x.label || ''))) && cl[n];
      await negoEditClause(c, (at(2) || cl[2]).clauseId, '<p>Liability is capped at 100% of the fees paid in that year.</p>', { side: 'counterparty', author: 'Per Nordvik', summary: '50% to 100% of the year\'s fees' });
      await negoEditClause(c, (at(3) || cl[3]).clauseId, '<p>Each correct invoice is paid within 60 days of receipt.</p>', { side: 'counterparty', author: 'Per Nordvik', summary: '30 days to 60 days' });
      persist(c);
    });
    await page.waitForTimeout(600);
    const PANEL = () => { const d = document.getElementById('ig-dock'); if (!d) return null;
      const ch = d.querySelector('#pd-chosen');
      return { word: ((d.querySelector('.igd-head-w') || {}).textContent || '').trim(), ph: (document.getElementById('igd-input') || {}).placeholder || '',
        chosen: ch ? { id: ch.getAttribute('data-pd-chosen-for'), name: (ch.querySelector('.pd-ch-name') || {}).textContent, ref: (ch.querySelector('.pd-ch-ref') || {}).textContent,
          facts: [...ch.querySelectorAll('.pd-ch-f')].map(f => [f.querySelector('dt').textContent, f.querySelector('dd').textContent.replace(/\s+/g, ' ').trim()]),
          needs: ch.querySelectorAll('.pd-ch-needs .pd-gl-row').length, open: !!ch.querySelector('[data-pd-ch-open]'), life: !!ch.querySelector('[data-pd-ch-life]') } : null,
        chips: [...d.querySelectorAll('[data-ig-chips] button')].map(b => b.textContent.trim()) }; };

    /* ===================== 1 ROUND 13: THE WALL ===================== */
    await page.evaluate(() => setView('register'));
    await until(() => document.querySelectorAll('#ig-wall .igw-card').length >= 12, null, 12000);
    const W0 = await page.evaluate(() => ({ cards: document.querySelectorAll('#ig-wall .igw-card').length, n: regFiltered().length,
      count: ((document.querySelector('#ig-wall .igw-count') || {}).textContent || '').trim(), order: ((document.querySelector('#ig-wall .igw-order') || {}).textContent || '').trim(),
      foot: ((document.querySelector('#ig-wall .igw-shown') || {}).textContent || '').trim(), more: !!document.querySelector('#ig-wall [data-ig-wall-more]'),
      card: (() => { const w = document.getElementById('ig-wall'); if (!w) return null; const cs = getComputedStyle(w); return { bg: cs.backgroundColor, bw: cs.borderTopWidth, bs: cs.borderTopStyle }; })(),
      facts: (() => { const n = document.querySelector('.ct-name'), h = n && n.querySelector('.ct-h'), f = n && n.querySelector('.ct-facts'); return h && f ? Math.abs(h.getBoundingClientRect().bottom - f.getBoundingClientRect().bottom) < 8 && f.getBoundingClientRect().left > h.getBoundingClientRect().right : false; })() }));
    check('1a the wall stands in one card: "N contracts · newest first", twelve papers, "Showing 12 of N · Show more"; the facts beside the name',
      W0.cards === 12 && W0.n > 12 && W0.count === `${W0.n} contracts` && W0.order === 'newest first' && W0.foot === `Showing 12 of ${W0.n}` && W0.more
      && !!W0.card && W0.card.bs === 'solid' && W0.facts, JSON.stringify(W0));
    await press('#ig-wall [data-ig-wall-more]');
    const more = await until(() => document.querySelectorAll('#ig-wall .igw-card').length > 12 ? { n: document.querySelectorAll('#ig-wall .igw-card').length, all: regFiltered().length, foot: ((document.querySelector('#ig-wall .igw-shown') || {}).textContent || '').trim(), btn: !!document.querySelector('#ig-wall [data-ig-wall-more]') } : null, null, 5000);
    check('1a2 Show more brings the next papers, and the foot says how many are drawn', !!more && more.n === Math.min(24, more.all) && more.foot === `Showing ${more.n} of ${more.all}` && more.btn === (more.n < more.all), JSON.stringify(more));
    const pick = 'MK-0382';
    await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    const C1 = await until(() => { const p = (() => { const d = document.getElementById('ig-dock'); return d && d.querySelector('#pd-chosen'); })(); return p ? true : null; }, null, 5000) && await page.evaluate(PANEL);
    const lit = await page.evaluate(id => { const b = document.querySelector(`#ig-wall .igw-card[data-ig-pick="${id}"]`); const s = b && b.querySelector('.igw-sheet');
      return b ? { cls: b.classList.contains('is-chosen'), aria: b.getAttribute('aria-current'), edge: s ? getComputedStyle(s).borderTopColor : '', paper: !!(window.intel && intel.paper) } : null; }, pick);
    check('1b one press chooses: the paper lit, nothing opened', !!lit && lit.cls && lit.aria === 'true' && !lit.paper, JSON.stringify(lit));
    const factKeys = C1 && C1.chosen ? C1.chosen.facts.map(f => f[0]) : [];
    check('1c Jambo\'s panel says it: "Contract", the name, ref · party, Stage · Stream · Value · Ends · Owner · Last move, Open the paper, Life line and details',
      !!C1 && C1.word === 'Contract' && C1.chosen && C1.chosen.id === pick && C1.chosen.name === 'Master services agreement' && C1.chosen.ref === 'MK-0382 · Nordvik Logistik'
      && JSON.stringify(factKeys) === JSON.stringify(['Stage', 'Stream', 'Value', 'Ends', 'Owner', 'Last move']) && C1.chosen.open && C1.chosen.life, JSON.stringify(C1));
    const fact = k => ((C1 && C1.chosen && C1.chosen.facts.find(f => f[0] === k)) || [])[1] || '';
    check('1d its facts read the record: the stage with its round, Owner "You", "Nordvik Logistik sent 2 redlines", how long ago',
      /^In Review · round 1$/.test(fact('Stage')) && fact('Owner') === 'You' && /^Nordvik Logistik sent 2 redlines today$/.test(fact('Last move')) && /KES/.test(fact('Value')), JSON.stringify(C1 && C1.chosen && C1.chosen.facts));
    check('1e what it asks of you (Needs you), the box asks about anything, no chips (as drawn)', !!C1 && C1.chosen.needs >= 1 && C1.ph === 'Ask for a contract, a number or a list…' && C1.chips.length === 0, JSON.stringify({ needs: C1 && C1.chosen.needs, ph: C1 && C1.ph, chips: C1 && C1.chips }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '13-chosen-paper-1440x780.png') });
    const other = await page.evaluate(p => [...document.querySelectorAll('#ig-wall .igw-card')].map(x => x.getAttribute('data-ig-pick')).find(id => id !== p), pick);
    await press(`#ig-wall .igw-card[data-ig-pick="${other}"]`);
    const moved = await until(id => { const c = document.querySelector('#ig-dock #pd-chosen'); return c && c.getAttribute('data-pd-chosen-for') === id ? { lit: document.querySelectorAll('#ig-wall .igw-card.is-chosen').length } : null; }, other, 4000);
    check('1f a press on another paper moves the choice there (one paper lit)', !!moved && moved.lit === 1, JSON.stringify(moved));
    await page.keyboard.press('Escape');
    const esc = await until(() => !document.querySelector('#ig-dock #pd-chosen') && !document.querySelector('#ig-wall .igw-card.is-chosen') ? { pd: !!document.querySelector('#ig-dock #pd-drop, #ig-dock .pd-wall') } : null, null, 4000);
    check('1g Esc lets it go: the panel goes back to the wall\'s greeting and drop area', !!esc && esc.pd, JSON.stringify(esc));
    await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    const had = await until(() => !!document.querySelector('#ig-dock #pd-chosen'), null, 4000);
    await press('[data-reg-home] .ct-h');
    const away = await until(() => !document.querySelector('#ig-dock #pd-chosen') && !document.querySelector('#ig-wall .igw-card.is-chosen'), null, 4000);
    check('1h a press elsewhere on the page lets it go', !!had && !!away, JSON.stringify({ had, away }));
    /* a refresh keeps the choice */
    await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    await until(() => !!document.querySelector('#ig-dock #pd-chosen'), null, 4000);
    await page.evaluate(() => { if (window.placeSave) placeSave(); });
    await page.reload({ waitUntil: 'networkidle' });
    await until(() => window.state && state.contracts && state.contracts.length > 5, null, 20000);
    const kept = await until(id => { const b = document.querySelector(`#ig-wall .igw-card.is-chosen[data-ig-pick="${id}"]`), c = document.querySelector('#ig-dock #pd-chosen'); return b && c && c.getAttribute('data-pd-chosen-for') === id; }, pick, 12000);
    check('1i a refresh lands on the same paper, chosen, its panel saying it', !!kept);
    /* the second press opens it */
    await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    const opened = await until(id => window.intel && intel.paper && String(intel.paper.id) === id && !document.querySelector('#ig-wall'), pick, 15000);
    check('1j the second press (on the paper chosen, not yet open) opens it on Home\'s paper', !!kept && !!opened, JSON.stringify({ kept, opened }));
    /* Enter on a paper opens it; Open the paper opens it */
    await page.evaluate(() => hbOpenContracts()); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);
    if (await page.$(`#ig-wall .igw-card[data-ig-pick="${other}"]`)) { await page.focus(`#ig-wall .igw-card[data-ig-pick="${other}"]`); await page.keyboard.press('Enter'); }
    const entered = await until(id => window.intel && intel.paper && String(intel.paper.id) === id, other, 15000);
    check('1k Enter on a paper opens it', !!entered);
    await page.evaluate(() => hbOpenContracts()); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);
    await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    await until(() => !!document.querySelector('#ig-dock [data-pd-ch-open]'), null, 4000);
    const btn = await press('#ig-dock [data-pd-ch-open]');
    const viaPanel = await until(id => window.intel && intel.paper && String(intel.paper.id) === id, pick, 15000);
    check('1l Jambo\'s Open the paper opens it', btn && !!viaPanel, JSON.stringify({ btn, viaPanel }));
    await page.evaluate(() => hbOpenContracts()); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);

    /* ===================== 2 ROUND 7: A CONTRACT BROUGHT UP ===================== */
    await press(`#ig-wall .igw-card[data-ig-pick="MK-0377"]`);
    await until(() => !!document.querySelector('#ig-dock [data-pd-ch-life="MK-0377"]'), null, 4000);
    await press('#ig-dock [data-pd-ch-life="MK-0377"]');
    const P7 = await until(() => { const g = document.querySelector('#ig-dock #pd-cardglance'); const st = document.getElementById('bs-strip-MK-0377');
      if (!g || !st || !st.querySelector('.bs-kpi')) return null;
      return { card: window.bsCardId && bsCardId(), word: ((document.querySelector('#ig-dock .igd-head-w') || {}).textContent || '').trim(), ph: (document.getElementById('igd-input') || {}).placeholder,
        head: (g.querySelector('.pd-gl-h b') || {}).textContent, pill: !!g.querySelector('.pd-gl-h .room-stat'),
        rows: [...g.querySelectorAll('.pd-gl-row')].map(r => ({ k: r.getAttribute('data-pd-cg'), t: (r.querySelector('span') || {}).textContent.replace(/\s+/g, ' ').trim(), b: ((r.querySelector('button') || {}).textContent || '').trim() })),
        chips: [...document.querySelectorAll('#ig-dock [data-ig-chips] button')].map(b => b.textContent.trim()),
        stage: ((st.querySelector('.bs-head .bs-stage .room-stat') || {}).textContent || '').trim(),
        idline: (st.querySelector('.bs-idline') || {}).textContent || '',
        next: (() => { const k = st.querySelector('[data-bs-kpi="next"]'); return k ? { sub: k.querySelector('span').textContent, bad: k.classList.contains('is-bad'), col: getComputedStyle(k.querySelector('b')).color } : null; })(),
        value: ((st.querySelector('[data-bs-kpi="value"] span') || {}).textContent || ''),
        foot: [...st.querySelectorAll('.bs-foot button')].map(b => b.textContent.trim())[0] }; }, null, 15000);
    check('2a Life line and details brings up its page, and Jambo says "MK-0377 at a glance" beside it, with its stage pill', !!P7 && P7.card === 'MK-0377' && P7.word === 'MK-0377 at a glance' && P7.head === 'MK-0377 at a glance' && P7.pill, JSON.stringify(P7 && { card: P7.card, word: P7.word, head: P7.head }));
    const rk = P7 ? P7.rows.map(r => r.k) : [];
    check('2b the rows: the obligation late (→ Obligations), the signed amendment (→ Bring it up), the notice day',
      JSON.stringify(rk) === JSON.stringify(['late', 'amend', 'notice']) && /^1 obligation is late: Check the September invoice, 7 days\. ?ours · due /.test(P7.rows[0].t) && P7.rows[0].b === 'Obligations'
      && /^Amendment No\. 1, signed .*: the value is KES 7\.10M as amended\.$/.test(P7.rows[1].t) && P7.rows[1].b === 'Bring it up' && /^Notice by .*, or it renews for 12 months\.$/.test(P7.rows[2].t), JSON.stringify(P7 && P7.rows));
    check('2c chips obligations · history · amend, and the box asks about MK-0377', !!P7 && JSON.stringify(P7.chips) === JSON.stringify(['obligations', 'history', 'amend']) && P7.ph === 'Ask about MK-0377…', JSON.stringify(P7 && { chips: P7.chips, ph: P7.ph }));
    check('2d the page as drawn: the stage pill, "signed <day>", "As amended by" first, a late next obligation in the late colour saying how late, "Open the paper"',
      !!P7 && P7.stage === 'Executed' && /· signed \d/.test(P7.idline) && /^As amended by MK-0377-A1/.test(P7.value) && P7.next && P7.next.bad && /· 7 days late$/.test(P7.next.sub) && P7.foot === 'Open the paper',
      JSON.stringify(P7 && { stage: P7.stage, idline: P7.idline, value: P7.value, next: P7.next, foot: P7.foot }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '7-page-glance-1440x780.png') });
    await press('#ig-dock [data-pd-cg-bring="MK-0377-A1"]');
    const brought = await until(() => window.bsCardId && bsCardId() === 'MK-0377-A1' && document.querySelector('#ig-dock .igd-head-w') && document.querySelector('#ig-dock .igd-head-w').textContent.trim() === 'MK-0377-A1 at a glance', null, 8000);
    check('2e Bring it up brings the amendment\'s page, and the panel follows it', !!brought);

    /* ===================== 3 ROUND 12: ITS HISTORY ===================== */
    await page.evaluate(() => hbStripBring('MK-0382', 'hist'));
    const P12 = await until(() => { const g = document.querySelector('#ig-dock #pd-histglance'), host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      if (!g || !host || !host.querySelector('.hist-ev')) return null;
      const tools = host.querySelector('.hist-tools'), order = tools ? [...tools.querySelectorAll('#hist-q, #hist-filter-btn, #hist-detail, #hist-more')].map(e => e.id) : [];
      const more = host.querySelector('#hist-more');
      return { word: ((document.querySelector('#ig-dock .igd-head-w') || {}).textContent || '').trim(), ph: (document.getElementById('igd-input') || {}).placeholder,
        rows: [...g.querySelectorAll('.pd-gl-row')].map(r => ({ t: (r.querySelector('span') || {}).textContent.replace(/\s+/g, ' ').trim(), b: ((r.querySelector('button') || {}).textContent || '').trim() })),
        chips: [...document.querySelectorAll('#ig-dock [data-ig-chips] button')].map(b => b.textContent.trim()),
        cap: (host.querySelector('.hist-cap') || {}).textContent || '', order, moreAria: more && more.getAttribute('aria-label'), moreText: more && more.textContent.trim(),
        pill: ((host.querySelector('.hist-day-h') || {}).textContent || '').trim(), text: [...host.querySelectorAll('.hist-ev .hist-text')].map(x => x.textContent.trim()),
        sep: !!host.querySelector('.hist-ev.is-theirs .hist-top .hist-sep') && !host.querySelector('.hist-ev.is-theirs .hist-top .hist-dot') }; }, null, 15000);
    check('3a Jambo says "MK-0382 · History": the last two weeks with the newest, what is open with whose move and Redlines',
      !!P12 && P12.word === 'MK-0382 · History' && /^\d+ entr(y|ies) in the last two weeks\. ?Newest: their round 1, today\.$/.test(P12.rows[0].t)
      && /^2 of their changes are still open: clauses \d+ and \d+\. ?Your move, since today\.$/.test(P12.rows[1].t) && P12.rows[1].b === 'Redlines', JSON.stringify(P12 && P12.rows));
    check('3b chips: the question worth asking, and redline; the box asks about its history', !!P12 && JSON.stringify(P12.chips) === JSON.stringify(['what changed in round 1', 'redline']) && P12.ph === 'Ask about MK-0382\'s history…', JSON.stringify(P12 && { chips: P12.chips, ph: P12.ph }));
    check('3c the head: "Newest first · our side left, theirs right · N events · 2 open changes" over one toolbar — search, Filter, Show the wording, ⋯ named "More"',
      !!P12 && /^Newest first · our side left, theirs right · \d+ events · 2 open changes$/.test(P12.cap.trim()) && JSON.stringify(P12.order) === JSON.stringify(['hist-q', 'hist-filter-btn', 'hist-detail', 'hist-more']) && P12.moreAria === 'More' && P12.moreText === '', JSON.stringify(P12 && { cap: P12.cap, order: P12.order, aria: P12.moreAria }));
    check('3d the day\'s pill as drawn ("Sun 18 Oct"), a change\'s entry in words, the time and the person joined by a dot',
      !!P12 && /^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2,3}$/.test(P12.pill) && P12.text.some(t => /^Proposed a change to clause \d+, .+: 30 days to 60 days$/.test(t)) && P12.sep, JSON.stringify(P12 && { pill: P12.pill, text: P12.text, sep: P12.sep }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '12-history-panel-1440x780.png') });
    await press('#ig-dock [data-ig-chips] [data-ca-fill]');
    const filled = await page.evaluate(() => (document.getElementById('igd-input') || {}).value);
    check('3e a question chip puts its words in the box for the reader to ask (a press spends, never the chip)', filled === 'what changed in round 1' && !asks.length, JSON.stringify({ filled, asks: asks.length }));
    await press('#igd-go');
    const asked = await until(() => !(window.intel && intel.busy) && intel.history.some(m => m.role === 'assistant'), null, 15000);
    const sent = asks[asks.length - 1];
    const ctxOk = !!(sent && sent.context && sent.context.activeContractId === 'MK-0382' && JSON.stringify(sent.messages || []).includes('THE WORDING OF MK-0382'));
    check('3f a question asked there goes with MK-0382\'s wording', !!asked && ctxOk, JSON.stringify(sent ? { ctx: sent.context && sent.context.activeContractId, n: asks.length } : { asks: asks.length }));
    await page.evaluate(() => { intel.history = []; renderIntelDock(); });
    await press('#ig-dock [data-pd-cg-go="red"]');
    const red = await until(() => window.intel && intel.paper && intel.paper.id === 'MK-0382' && window.pdRedShows && pdRedShows(), null, 15000);
    check('3g its Redlines door opens Jambo\'s Redlines face on that contract', !!red);

    /* ===================== 4 THE OWNER'S THREE SCREENS ===================== */
    const shotsDir = OUT || '';
    const scenes = [
      ['13-chosen-paper', async () => { await page.evaluate(() => { hbOpenContracts(); if (window.igWallLetGo) igWallLetGo(); }); await until(() => !!document.querySelector('#ig-wall .igw-card[data-ig-pick="MK-0382"]'), null, 8000);
        await press('#ig-wall .igw-card[data-ig-pick="MK-0382"]');
        await until(() => !!document.querySelector('#ig-dock #pd-chosen'), null, 4000); return '#ig-dock #pd-chosen'; }],
      ['7-page-glance', async () => { await page.evaluate(() => hbStripBring('MK-0377')); await until(() => !!document.querySelector('#ig-dock #pd-cardglance') && !!document.querySelector('#bs-strip-MK-0377 .bs-kpi'), null, 8000); return '#ig-dock #pd-cardglance'; }],
      ['12-history-panel', async () => { await page.evaluate(() => hbStripBring('MK-0382', 'hist')); await until(() => !!document.querySelector('#ig-dock #pd-histglance') && !!document.querySelector('#bs-strips .hist-ev'), null, 8000); return '#ig-dock #pd-histglance'; }],
    ];
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      for (const [name, go] of scenes) {
        const sel = await go(); await page.waitForTimeout(500);
        const F = await page.evaluate(sel => { const el = document.querySelector(sel); const r = el && el.getBoundingClientRect();
          return { panel: !!r && r.top >= 0 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1, side: document.documentElement.scrollWidth <= innerWidth + 1,
            head: !!document.querySelector('#ig-dock .igd-head-w') }; }, sel);
        check(`4 ${w}×${ht} ${name}: the panel's card in view, its head named, nothing sideways`, F.panel && F.side && F.head, JSON.stringify(F));
        if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${name}-${w}x${ht}.png`) });
      }
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
