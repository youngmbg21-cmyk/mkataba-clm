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
     5 PASS 3 (the checker's differences, 18 Oct 2026): the head's "N live",
       the count line and "Showing 12 of N" are one number (an amendment
       counted with its agreement); the chosen paper's Needs you says "Answer
       2 redlines" with the clauses under it and "Open redlines", its second
       line wrapped, never cut; its Value is the page's (as amended); List
       lets the choice go; a page's chips sit right under its card; the
       caption says how late, the table Late before Next; History: no second
       ⋯ on the head, the trail inside the card, "who decided clause N" once a
       round has closed, "Newest" says what happened.
     6 PASS 4 (the checker's differences after main moved on, 18 Oct 2026):
       the count line says the agreements only; a scroll near the wall's foot
       brings the next papers; Jambo's tab carries Home's Needs-you number on
       a page and its History too; a private contract (the CFO's, in a private
       stream) wears the lock pill on its head and its glance, says who may
       open it, the details still to fill and that nobody is named to sign,
       and its chips follow what it owes (fill in · pay · who can open it),
       where the signed supply agreement's read obligations · history ·
       amend; a chip lands on what it opens, lit; What Jambo read says the
       sides without a first due day; Details reads the value as amended with
       the signed figure beside it, whole, the renewal whole, a Filing
       section (Re-file, who may open a private one), and Related agreements
       as rows with Bring it up and no other doors; History: a private one
       leads with its wall and its opens, a draft never sent says so, the
       Filter lists only choices the trail has (Opens only where opened),
       Clear greys at rest, the day says "Today, …", the middle line's pills
       carry no initials or outcome, a round sent back is told once, no round
       chip, the ⋯ menu as drawn ("This contract" · its three acts with their
       lines · "Every contract · admins only"), Show the wording cut short
       with no fingerprint; the amendment says what it did in its maker's
       words; at 1366×950 no mark's line runs through a label, at 1536×730
       the chosen paper's doors are whole.
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
/* pass 4: a long liability clause, so Show the wording has an unchanged run to cut around the edit */
const LONG_LIAB = 'Liability is capped at {p} of the fees paid in that year and the supplier shall not be liable for any indirect loss whatsoever arising under this agreement.';
const DOC2 = DOC.replace('Liability is capped at 50% of the fees paid in that year.', LONG_LIAB.replace('{p}', '50%'));
const SIG = n => [{ party: 'first', name: 'Amina Otieno', at: new Date(Date.now() - n * 864e5).toISOString() }, { party: 'counterparty', name: 'Hanna Brightwater', at: new Date(Date.now() - n * 864e5).toISOString() }];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const A = H.fixtureContract('MK-0377', 'Supply agreement', 'Brightwater Foods', H.FOLDER_A, 6400000, 'Signed', DOC);
  Object.assign(A, { expiry: day(560), fields: { value: '6400000', effDate: day(-170) }, signedAt: new Date(Date.now() - 172 * 864e5).toISOString(), signatures: SIG(172),
    metadata: { value: 6400000, currency: 'KES', renewalType: 'auto-renew', noticePeriodDays: 90, renewalTermMonths: 12 },
    obligations: [{ id: 'o1', desc: 'Check the September invoice', party: 'ours', due: day(-7), status: 'open' }, { id: 'o2', desc: 'Food safety certificate', party: 'theirs', due: day(75), status: 'open' }] });
  const A1 = H.fixtureContract('MK-0377-A1', 'Amendment 1 to the Supply agreement', 'Brightwater Foods', H.FOLDER_A, 7100000, 'Signed', 'AMENDMENT 1\n\n1. Volumes\n\nThe yearly volume is raised by ten per cent.');
  /* pass 4: the maker's note says what it did (relationNote, applyParentLink's own) */
  Object.assign(A1, { parentId: 'MK-0377', relation: 'amendment', relationNote: 'raised the yearly volume by 10%', valueSetHere: true, expiry: null, metadata: { value: 7100000, currency: 'KES', effectiveDate: day(-20) }, signedAt: new Date(Date.now() - 20 * 864e5).toISOString(), signatures: SIG(20) });
  const N = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik', H.FOLDER_A, 4200000, 'Under Review', DOC);
  N.expiry = day(800);
  const L2 = H.fixtureContract('MK-0390', 'Logistics agreement', 'Nordvik Logistik', H.FOLDER_A, 900000, 'Under Review', DOC2);
  /* pass 4: the CFO's employment agreement, pay not deal value, kept in a stream made private below */
  const E = H.fixtureContract('MK-0399', 'Employment agreement', 'Annika Holm', 'corp', 1740000, 'Draft', 'EMPLOYMENT AGREEMENT\n\n1. Role\n\nChief financial officer.\n\n2. Pay\n\nBase pay is paid monthly.');
  Object.assign(E, { category: 'employment', template: null, expiry: null, fields: { value: '1740000' }, metadata: { value: 1740000, currency: 'KES', category: 'employment' } });
  const more = Array.from({ length: 13 }, (_, i) => H.fixtureContract('MK-W' + (i + 1), 'Services agreement ' + (i + 1), 'Party ' + (i + 1), H.FOLDER_A, 100000 * (i + 1), i % 2 ? 'Signed' : 'Draft', i % 2 ? undefined : DOC));
  await H.seedWorkspace(h, { contracts: [A, A1, N, L2, E, ...more, ...H.FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const asks = [];
    page.on('request', r => { if (/\/api\/ai\/chat\b/.test(r.url()) && r.method() === 'POST') { try { asks.push(JSON.parse(r.postData() || '{}')); } catch (_) {} } });
    /* a press on what is not there reports, never waits out a timeout */
    const press = async sel => { const el = await page.$(sel); if (!el) return false; await el.click(); return true; };
    /* the wall draws twelve at a time: Show more until a paper is on it (bounded) */
    const bring = async id => { for (let i = 0; i < 6 && !(await page.$(`#ig-wall .igw-card[data-ig-pick="${id}"]`)); i++){ if (!(await press('#ig-wall [data-ig-wall-more]'))) break; await page.waitForTimeout(250); }
      return !!(await page.$(`#ig-wall .igw-card[data-ig-pick="${id}"]`)); };
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
        count: ((d.querySelector('.pd-tab[data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || '').trim(), counter: (typeof counterNeedsCount === 'function') ? String(counterNeedsCount()) : '',
        chosen: ch ? { id: ch.getAttribute('data-pd-chosen-for'), name: (ch.querySelector('.pd-ch-name') || {}).textContent, ref: (ch.querySelector('.pd-ch-ref') || {}).textContent,
          facts: [...ch.querySelectorAll('.pd-ch-f')].map(f => [f.querySelector('dt').textContent, f.querySelector('dd').textContent.replace(/\s+/g, ' ').trim()]),
          needs: ch.querySelectorAll('.pd-ch-needs .pd-gl-row').length, open: !!ch.querySelector('[data-pd-ch-open]'), life: !!ch.querySelector('[data-pd-ch-life]') } : null,
        chips: [...d.querySelectorAll('[data-ig-chips] button, [data-pd-held-chips] button')].map(b => b.textContent.trim()) }; };

    /* ===================== 1 ROUND 13: THE WALL ===================== */
    /* 20 Oct 2026 (owner: "make the contracts landing page be on list as opposed to paper"): the Contracts
       place lands on the List now; this check is about the Wall, so it picks Wall as a reader would */
    await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); });
    await page.evaluate(() => setView('register'));
    await until(() => document.querySelectorAll('#ig-wall .igw-card').length >= 12, null, 12000);
    /* RE-POINTED (pass 3): the wall counts agreements, an amendment counted with its agreement, as the head does */
    const W0 = await page.evaluate(() => ({ cards: document.querySelectorAll('#ig-wall .igw-card').length, n: regFiltered().filter(c => !c.parentId).length,
      amends: regFiltered().filter(c => c.parentId).length, leadsDrawn: [...document.querySelectorAll('#ig-wall .igw-card')].filter(b => { const c = getContract(b.getAttribute('data-ig-pick')); return c && !c.parentId; }).length,
      head: ((document.getElementById('reg-head-facts') || {}).textContent || '').trim(),
      count: ((document.querySelector('#ig-wall .igw-count') || {}).textContent || '').trim(), order: ((document.querySelector('#ig-wall .igw-order') || {}).textContent || '').trim(),
      foot: ((document.querySelector('#ig-wall .igw-shown') || {}).textContent || '').trim(), more: !!document.querySelector('#ig-wall [data-ig-wall-more]'),
      card: (() => { const w = document.getElementById('ig-wall'); if (!w) return null; const cs = getComputedStyle(w); return { bg: cs.backgroundColor, bw: cs.borderTopWidth, bs: cs.borderTopStyle }; })(),
      facts: (() => { const n = document.querySelector('.ct-name'), h = n && n.querySelector('.ct-h'), f = n && n.querySelector('.ct-facts'); return h && f ? Math.abs(h.getBoundingClientRect().bottom - f.getBoundingClientRect().bottom) < 8 && f.getBoundingClientRect().left > h.getBoundingClientRect().right : false; })() }));
    /* RE-POINTED (pass 4, round 13 as drawn: "48 contracts · newest first"): the count line says the agreements only, never "· N amendment" */
    check('1a the wall stands in one card: "N contracts · newest first", twelve papers, "Showing 12 of N · Show more"; the facts beside the name',
      W0.leadsDrawn === 12 && W0.n > 12 && W0.count === `${W0.n} contracts` && !/amendment|closed/.test(W0.count) && W0.order === 'newest first' && W0.foot === `Showing 12 of ${W0.n}` && W0.more
      && W0.head.startsWith(`${W0.n} live`)
      && !!W0.card && W0.card.bs === 'solid' && W0.facts, JSON.stringify(W0));
    await press('#ig-wall [data-ig-wall-more]');
    const more = await until(() => { const leads = [...document.querySelectorAll('#ig-wall .igw-card')].filter(b => { const c = getContract(b.getAttribute('data-ig-pick')); return c && !c.parentId; }).length;
      return leads > 12 ? { n: leads, all: regFiltered().filter(c => !c.parentId).length, foot: ((document.querySelector('#ig-wall .igw-shown') || {}).textContent || '').trim(), btn: !!document.querySelector('#ig-wall [data-ig-wall-more]') } : null; }, null, 5000);
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
    /* RE-POINTED (main moved on: the Counter is named Home, the desk tabs went): the number is Home's own Needs you (counterNeedsCount) */
    check('1e2 his tab carries Home\'s own Needs-you number, as beside a paper', !!C1 && !!C1.count && C1.count === C1.counter, JSON.stringify({ count: C1 && C1.count, counter: C1 && C1.counter }));
    /* pass 3: their two redlines are a row of their own, the clauses under it, wrapped */
    const ASK = await page.evaluate(() => { const r = document.querySelector('#ig-dock #pd-chosen [data-pd-nd-kind="answer"]'); if (!r) return null;
      const sm = r.querySelector('small'); return { b: (r.querySelector('b') || {}).textContent, sub: sm && sm.textContent, ws: sm && getComputedStyle(sm).whiteSpace, cut: sm ? sm.scrollWidth > sm.clientWidth + 1 : null,
        btn: ((r.querySelector('[data-pd-ch-red]') || {}).textContent || '').trim() }; });
    check('5a Needs you: "Answer 2 redlines", the clauses under it, "Open redlines"; the line wraps, never cut',
      !!ASK && ASK.b === 'Answer 2 redlines' && /^Clause \d+ Liability · clause \d+ Payment$/.test(ASK.sub) && ASK.ws === 'normal' && ASK.cut === false && ASK.btn === 'Open redlines', JSON.stringify(ASK));
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
    /* a narrowing that takes the chosen paper off the wall lets it go, and the panel says the wall again */
    await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    const had2 = await until(() => !!document.querySelector('#ig-dock #pd-chosen'), null, 4000);
    await page.evaluate(() => { state.reg.stage = 'Signed'; regRepaint(); });
    const gone2 = await until(id => !document.querySelector(`#ig-wall .igw-card[data-ig-pick="${id}"]`) && !document.querySelector('#ig-dock #pd-chosen') && !!document.querySelector('#ig-dock #pd-drop, #ig-dock .pd-wall'), pick, 5000);
    check('1h2 a narrowing that takes the chosen paper off the wall lets it go; the panel says the wall again', !!had2 && !!gone2, JSON.stringify({ had2, gone2 }));
    await page.evaluate(() => { state.reg.stage = 'all'; regRepaint(); });
    await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 5000);
    await bring(pick);
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
    await bring(other);
    if (await page.$(`#ig-wall .igw-card[data-ig-pick="${other}"]`)) { await page.focus(`#ig-wall .igw-card[data-ig-pick="${other}"]`); await page.keyboard.press('Enter'); }
    const entered = await until(id => window.intel && intel.paper && String(intel.paper.id) === id, other, 15000);
    check('1k Enter on a paper opens it', !!entered);
    await page.evaluate(() => hbOpenContracts()); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);
    await bring(pick); await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    await until(() => !!document.querySelector('#ig-dock [data-pd-ch-open]'), null, 4000);
    const btn = await press('#ig-dock [data-pd-ch-open]');
    const viaPanel = await until(id => window.intel && intel.paper && String(intel.paper.id) === id, pick, 15000);
    check('1l Jambo\'s Open the paper opens it', btn && !!viaPanel, JSON.stringify({ btn, viaPanel }));
    await page.evaluate(() => hbOpenContracts()); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);
    /* pass 3: List lets the choice go (no row on the List is marked, so the panel says none) */
    await bring(pick); await press(`#ig-wall .igw-card[data-ig-pick="${pick}"]`);
    const hadL = await until(() => !!document.querySelector('#ig-dock #pd-chosen'), null, 4000);
    await press('[data-reg-home] [data-ct-show="list"]');
    const goneL = await until(() => window.state && state.reg && state.reg.show === 'list' && !document.querySelector('#ig-dock #pd-chosen') && !(window.igWallChosenId && igWallChosenId()), null, 5000);
    check('5b pressing List lets the chosen paper go: the panel says no paper the List does not mark', !!hadL && !!goneL, JSON.stringify({ hadL, goneL }));
    await press('[data-reg-home] [data-ct-show="wall"]'); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);
    /* pass 3: an amended contract's Value is the page's own figure, on the wall and in the panel */
    await bring('MK-0377'); await press('#ig-wall .igw-card[data-ig-pick="MK-0377"]');
    const V = await until(() => { const f = [...document.querySelectorAll('#ig-dock #pd-chosen .pd-ch-f')].find(x => x.querySelector('dt').textContent === 'Value');
      return f ? { panel: f.querySelector('dd').textContent.replace(/\s+/g, ' ').trim(), wall: ((document.querySelector('#ig-wall .igw-card[data-ig-pick="MK-0377"] .igw-val') || {}).textContent || '').trim() } : null; }, null, 4000);
    check('5c the chosen paper\'s Value reads as amended, the figure its page and the wall say', !!V && V.panel === 'KES 7.10M as amended by MK-0377-A1' && /KES 7\.10M$/.test(V.wall), JSON.stringify(V));
    await page.keyboard.press('Escape');

    /* ===================== 2 ROUND 7: A CONTRACT BROUGHT UP ===================== */
    await bring('MK-0377'); await press(`#ig-wall .igw-card[data-ig-pick="MK-0377"]`);
    await until(() => !!document.querySelector('#ig-dock [data-pd-ch-life="MK-0377"]'), null, 4000);
    await press('#ig-dock [data-pd-ch-life="MK-0377"]');
    /* RE-POINTED 20 Oct 2026 (owner: "yes make it the dossier"): beside the Board's card Jambo's panel is the
       contract's dossier — "<ref> · Dossier", the spine, What Jambo read, Still owed (a late obligation among
       its rows), the stage's acts, the Family fold — the card's chips still right under it */
    const P7 = await until(() => { const g = document.querySelector('#ig-dock .pd-held-dos'); const st = document.getElementById('bs-strip-MK-0377');
      if (!g || !st || !st.querySelector('.bs-deal')) return null;
      return { card: window.bsCardId && bsCardId(), word: ((document.querySelector('#ig-dock .igd-head-w') || {}).textContent || '').trim(), ph: (document.getElementById('igd-input') || {}).placeholder,
        head: [...g.querySelectorAll('.pd-gl-h b')].map(b => b.textContent).join(' | '), pill: !!g.querySelector('.ds-spine .ds-st[data-ds-st="live"]'),
        rows: [...g.querySelectorAll('[data-pd-ds-card="owed"] .pd-gl-row')].map(r => ({ k: r.getAttribute('data-pd-gl'), t: (r.querySelector('span') || {}).textContent.replace(/\s+/g, ' ').trim(), b: ((r.querySelector('button') || {}).textContent || '').trim() })),
        fam: ((g.querySelector('[data-ds-fold="family"] summary') || {}).textContent || '').trim(),
        chips: [...document.querySelectorAll('#ig-dock [data-pd-held-chips] button')].map(b => b.textContent.trim()),
        foot: document.querySelectorAll('#ig-dock [data-ig-chips]').length,
        under: (() => { const r = document.querySelector('#ig-dock [data-pd-held-chips]'); return r ? Math.round(r.getBoundingClientRect().top - g.getBoundingClientRect().bottom) : null; })(),
        cap: ((st.querySelector('.bs-nd[data-bs-nd="late"]') || {}).textContent || ''),
        pills: (() => { const td = [...st.querySelectorAll('.bs-obs td')].find(t => /September invoice/.test(t.textContent)); return td ? [...td.querySelectorAll('span')].map(x => x.textContent) : null; })(),
        stage: ((st.querySelector('.bs-head .bs-stage .room-stat') || {}).textContent || '').trim(),
        /* RE-POINTED 21 Oct 2026 (the report simplified): the signed day rides the head's line; a late obligation is a Needs you row */
        idline: (st.querySelector('.bs-head .bs-ref') || {}).textContent || '',
        next: (() => { const k = st.querySelector('.bs-nd[data-bs-nd="late"]'); return k ? { sub: (k.querySelector('small') || {}).textContent || '', bad: true } : null; })(),
        value: ((st.querySelector('[data-bs-kpi="value"] span') || {}).textContent || ''),
        /* RE-POINTED 20 Oct 2026 (4b): Open stands in the head as "Open in Workspace ›" */
        sfoot: ((st.querySelector('.bs-head [data-bs-open]') || {}).textContent || '').trim() }; }, null, 15000);
    check('2a Life line and details brings up its page, and Jambo says "MK-0377 · Dossier" beside it, its spine at Live', !!P7 && P7.card === 'MK-0377' && P7.word === 'MK-0377 · Dossier' && /^Needs you \| Jambo read/.test(P7.head) && P7.pill, JSON.stringify(P7 && { card: P7.card, word: P7.word, head: P7.head }));
    const rk = P7 ? P7.rows.map(r => r.k) : [];
    check('2b Still owed: the obligation late (→ Open ›); the signed amendment in the Family fold',
      rk.includes('late') && /^1 obligation is late: Check the September invoice, 7 days$/.test(P7.rows[rk.indexOf('late')].t) && P7.rows[rk.indexOf('late')].b === 'Open ›'
      && /^Family — Original and 1 more in its family/.test(P7.fam), JSON.stringify(P7 && { rows: P7.rows, fam: P7.fam }));
    check('2c chips obligations · history · amend, and the box asks about MK-0377', !!P7 && JSON.stringify(P7.chips) === JSON.stringify(['obligations', 'history', 'amend']) && P7.ph === 'Ask about MK-0377…', JSON.stringify(P7 && { chips: P7.chips, ph: P7.ph }));
    check('2d the page as drawn: the stage pill, "signed <day>", "As amended by" first, a late next obligation in the late colour saying how late, "Open in Workspace ›"',
      !!P7 && P7.stage === 'Executed' && /· signed \d/.test(P7.idline) && /^As amended by MK-0377-A1/.test(P7.value) && P7.next && P7.next.bad && /^7 days late$/.test(P7.next.sub) && P7.sfoot === 'Open in Workspace ›',
      JSON.stringify(P7 && { stage: P7.stage, idline: P7.idline, value: P7.value, next: P7.next, foot: P7.sfoot }));
    check('5d a page\'s chips sit right under its card, none in the panel\'s foot row', !!P7 && P7.under != null && P7.under >= 0 && P7.under <= 24 && P7.foot === 0, JSON.stringify(P7 && { under: P7.under, foot: P7.foot }));
    check('5e the late obligation is a Needs you row saying how late (the report simplified, 21 Oct 2026)', !!P7 && /Check the September invoice/.test(P7.cap) && /7 days late/.test(P7.cap), JSON.stringify(P7 && { cap: P7.cap }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '7-page-glance-1440x780.png') });
    await page.evaluate(() => { const f = document.querySelector('#ig-dock .pd-held-dos [data-ds-fold="family"]'); if (f) f.open = true; });
    await press('#ig-dock .pd-held-dos [data-pd-ds-fam="MK-0377-A1"]');
    const brought = await until(() => window.bsCardId && bsCardId() === 'MK-0377-A1' && document.querySelector('#ig-dock .igd-head-w') && document.querySelector('#ig-dock .igd-head-w').textContent.trim() === 'MK-0377-A1 · Dossier', null, 8000);
    check('2e Bring it up brings the amendment\'s page, and the panel follows it', !!brought);

    /* ===================== 3 ROUND 12: ITS HISTORY ===================== */
    await page.evaluate(() => hbStripBring('MK-0382', 'hist'));
    const P12 = await until(() => { const g = document.querySelector('#ig-dock #pd-histglance'), host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      if (!g || !host || !host.querySelector('.hist-ev')) return null;
      const hh = host.querySelector('.hist-head'), order = hh ? [...hh.querySelectorAll('#hist-q, #hist-filter-btn, #hist-detail, #hist-more')].map(e => e.id) : [];
      const more = host.querySelector('#hist-more');
      return { word: ((document.querySelector('#ig-dock .igd-head-w') || {}).textContent || '').trim(), ph: (document.getElementById('igd-input') || {}).placeholder,
        rows: [...g.querySelectorAll('.pd-gl-row')].map(r => ({ t: (r.querySelector('span') || {}).textContent.replace(/\s+/g, ' ').trim(), b: ((r.querySelector('button') || {}).textContent || '').trim() })),
        chips: [...document.querySelectorAll('#ig-dock [data-pd-held-chips] button')].map(b => b.textContent.trim()),
        headDots: document.querySelectorAll('#bs-strips .bs-head [data-bs-dots]').length,
        trail: (() => { const t = host.querySelector('.hist-trail'), cs = t && getComputedStyle(t), card = host.closest('.bs-strip');
          return cs ? { mh: cs.maxHeight, ov: cs.overflowY, bw: cs.borderTopWidth, inside: card.getBoundingClientRect().bottom >= t.getBoundingClientRect().bottom - 1 } : null; })(),
        cap: (host.querySelector('.hist-cap') || {}).textContent || '', order, moreAria: more && more.getAttribute('aria-label'), moreText: more && more.textContent.trim(),
        pill: ((host.querySelector('.hist-day-h b') || host.querySelector('.hist-day-h') || {}).textContent || '').trim(), text: [...host.querySelectorAll('.hist-ev .hist-text')].map(x => x.textContent.trim()),
        side: [...host.querySelectorAll('.hist-ev.is-theirs .hist-c-side')].map(x => x.textContent.trim()) }; }, null, 15000);
    check('3a Jambo says "MK-0382 · History": the last two weeks with the newest, what is open with whose move and Redlines',
      !!P12 && P12.word === 'MK-0382 · History' && /^\d+ entr(y|ies) in the last two weeks\. ?Newest: their round 1, today\.$/.test(P12.rows[0].t)
      && /^2 of their changes are still open: clauses \d+ and \d+\. ?Your move, since today\.$/.test(P12.rows[1].t) && P12.rows[1].b === 'Redlines', JSON.stringify(P12 && P12.rows));
    check('3b chips: the question worth asking, and redline; the box asks about its history', !!P12 && JSON.stringify(P12.chips) === JSON.stringify(['what changed in round 1', 'redline']) && P12.ph === 'Ask about MK-0382\'s history…', JSON.stringify(P12 && { chips: P12.chips, ph: P12.ph }));
    /* RE-POINTED 21 Oct 2026 (the owner picked "The SAP way" for History): the head is "Newest first · N events ·
       2 open changes" with Show the wording and ⋯ on its right; the band under it the search and the filters in the open */
    check('3c the head: "Newest first · N events · 2 open changes", Show the wording and ⋯ named "More"; the search in the band under it, no Filter button',
      !!P12 && /^Newest first · \d+ events · 2 open changes$/.test(P12.cap.trim()) && JSON.stringify(P12.order) === JSON.stringify(['hist-detail', 'hist-more', 'hist-q']) && P12.moreAria === 'More' && P12.moreText === '', JSON.stringify(P12 && { cap: P12.cap, order: P12.order, aria: P12.moreAria }));
    /* RE-POINTED (pass 4, round 12 as drawn: "Today, Mon 19 Oct"): today's pill says so */
    /* RE-POINTED 21 Oct 2026 (the SAP way): the day is a row of the table; their entry reads "Theirs" in the Side column */
    check('3d the day as drawn ("Today, Sun 18 Oct"), a change\'s entry in words, their side said in the Side column',
      !!P12 && /^Today, [A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2,3}$/.test(P12.pill) && P12.text.some(t => /^Proposed a change to clause \d+, .+: 30 days to 60 days$/.test(t)) && P12.side.length > 0 && P12.side.every(x => x === 'Theirs'), JSON.stringify(P12 && { pill: P12.pill, text: P12.text, side: P12.side }));
    check('5f History: one ⋯ (the toolbar\'s), none on the head; the trail runs inside the card, no box or scroll of its own',
      !!P12 && P12.headDots === 0 && !!P12.trail && P12.trail.mh === 'none' && P12.trail.ov === 'visible' && P12.trail.bw === '0px' && P12.trail.inside, JSON.stringify(P12 && { dots: P12.headDots, trail: P12.trail }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '12-history-panel-1440x780.png') });
    await press('#ig-dock [data-pd-held-chips] [data-ca-fill]');
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
    /* pass 3: round 1 decided and closed, round 2 open — the decided chip, and Newest says what happened.
       pass 4: the turn handed each way as the product hands it (negoHandOver), and the liability clause long */
    await page.evaluate(async L => {
      const c = getContract('MK-0390'); if (c._light && window.ensureFull) await ensureFull(c);
      negoInit(c); const cl = negoClauseList(c);
      for (const [i, html, sum] of [[1, '<p>Fees are invoiced quarterly.</p>', 'monthly to quarterly'], [2, `<p>${L.replace('{p}', '80%')}</p>`, '50% to 80%'], [3, '<p>Each correct invoice is paid within 45 days of receipt.</p>', '30 to 45 days']])
        await negoEditClause(c, cl[i].clauseId, html, { side: 'counterparty', author: 'Per Nordvik', summary: sum });
      try { negoHandOver(c, { to: 'owner', by: 'Per Nordvik' }); } catch (_) {}
      const pend = negoChanges(c).filter(x => x.status === 'pending');
      await negoResolve(c, pend[0].id, 'accepted'); await negoResolve(c, pend[1].id, 'rejected', { reply: 'no' }); await negoResolve(c, pend[2].id, 'rejected', { reply: 'no' });
      negoAdvanceRound(c);
      try { negoHandOver(c, { to: 'counterparty' }); } catch (_) {}
      const cl2 = negoClauseList(c);
      await negoEditClause(c, cl2[2].clauseId, `<p>${L.replace('{p}', '100%')}</p>`, { side: 'counterparty', author: 'Per Nordvik', summary: '50% to 100%' });
      await negoEditClause(c, cl2[3].clauseId, '<p>Each correct invoice is paid within 60 days of receipt.</p>', { side: 'counterparty', author: 'Per Nordvik', summary: '30 days to 60 days' });
      try { negoHandOver(c, { to: 'owner', by: 'Per Nordvik' }); } catch (_) {}
      persist(c);
    }, LONG_LIAB);
    await page.evaluate(() => { intel.paper = null; hbStripBring('MK-0390', 'hist'); });
    const R2 = await until(() => { const g = document.querySelector('#ig-dock #pd-histglance[data-pd-held-for="MK-0390"]'); if (!g) return null;
      return { chips: [...document.querySelectorAll('#ig-dock [data-pd-held-chips] button')].map(b => b.textContent.trim()), newest: ((g.querySelector('[data-pd-hg="recent"] small') || {}).textContent || '').trim() }; }, null, 10000);
    check('5g round 1 closed, round 2 open: "what changed in round 2 · who decided clause N · redline"; Newest says what happened, never "Negotiation"',
      !!R2 && R2.chips[0] === 'what changed in round 2' && /^who decided clause \d+$/.test(R2.chips[1] || '') && R2.chips[2] === 'redline' && /^Newest: /.test(R2.newest) && !/^Newest: Negotiation/.test(R2.newest), JSON.stringify(R2));


    /* ===================== 6 PASS 4: THE CHECKER'S DIFFERENCES ===================== */
    const tabN = () => page.evaluate(() => ({ tab: ((document.querySelector('#ig-dock .pd-tab[data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || '').trim(),
      home: (typeof counterNeedsCount === 'function') ? String(counterNeedsCount() || '') : '' }));
    /* 6a the History of a negotiation in its second round */
    const H2 = await until(() => { const host = document.querySelector('#bs-strips [data-bs-host="hist"]'); if (!host || !host.querySelector('.hist-ev')) return null;
      const texts = [...host.querySelectorAll('.hist-ev .hist-text')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
      const mid = [...host.querySelectorAll('.hist-ev.is-mid')];
      /* RE-POINTED 21 Oct 2026 (the SAP way): a middle-line entry is a row that names no side; it still carries no initials and no outcome */
      return { texts, mid: mid.length, midWho: mid.filter(m => m.querySelector('.hist-pill, .hist-ocw, [class*="avatar"], [class*="-av"]')).length,
        rchip: host.querySelectorAll('.hist-rchip').length, fp: host.querySelectorAll('.hist-fp').length,
        pill: ((host.querySelector('.hist-day-h b') || host.querySelector('.hist-day-h') || {}).textContent || '').trim() }; }, null, 10000);
    const backN = H2 ? H2.texts.filter(t => /^Sent round 1 back to .+: 3 answers$/.test(t)).length : -1;
    const r1N = H2 ? H2.texts.filter(t => /round 1/i.test(t) && /(back|closed|ended|sent)/i.test(t)).length : -1;
    const cameN = H2 ? H2.texts.filter(t => /^Their round 2 came back: 2 changes$/.test(t)).length : -1;
    check('6a History says a round sent back once ("Sent round 1 back to …: 3 answers") and "Their round 2 came back: 2 changes"; no round chip; today\'s pill "Today, …"',
      backN === 1 && r1N === 1 && cameN === 1 && H2.rchip === 0 && /^Today, /.test(H2.pill), JSON.stringify(H2 && { backN, r1N, cameN, rchip: H2.rchip, pill: H2.pill, texts: H2.texts.slice(0, 12) }));
    check('6b an entry on no side carries no initials and no outcome', !!H2 && H2.mid >= 1 && H2.midWho === 0, JSON.stringify(H2 && { mid: H2.mid, midWho: H2.midWho }));
    const n6 = await tabN();
    check('6c his tab beside a History carries Home\'s own Needs-you number', !!n6.tab && n6.tab === n6.home, JSON.stringify(n6));
    /* the filters: only what the trail has; Clear greys at rest on the band's grey */
    /* RE-POINTED 21 Oct 2026 (the SAP way): the filters stand in the band, in the open — no Filter button to press,
       no grey band of their own; what each offers is still only what the trail has */
    const HB = '#bs-strips [data-bs-host="hist"]';
    const F6 = await until(sel => { const b = document.querySelector(sel); if (!b || !b.querySelector('select[data-ht-filter]')) return null; const cl = b.querySelector('#ht-clear');
      const opt = k => { const s = b.querySelector(`select[data-ht-filter="${k}"]`); return s ? [...s.options].map(o => o.value).filter(Boolean) : null; };
      return { outcome: opt('outcome'), opens: opt('opens'), person: opt('actor'), round: opt('round'), clear: cl ? { dis: cl.disabled, title: cl.title } : null,
        button: !!b.querySelector('#hist-filter-btn') }; }, HB, 5000);
    check('6d the filters stand in the open and list only what the trail has (Outcome: no Withdrawn or Counter here, Opens not offered where nothing was opened); Clear greyed at rest',
      !!F6 && !F6.button && Array.isArray(F6.outcome) && F6.outcome.includes('accepted') && F6.outcome.includes('rejected') && !F6.outcome.includes('withdrawn') && !F6.outcome.includes('counter')
      && F6.opens === null && Array.isArray(F6.round) && F6.round.length === 2 && !!F6.clear && F6.clear.dis && !!F6.clear.title, JSON.stringify(F6));
    await page.selectOption(HB + ' select[data-ht-filter="outcome"]', 'accepted').catch(() => {});
    const clr = await until(() => { const cl = document.getElementById('ht-clear'); return cl && !cl.disabled ? true : null; }, null, 4000);
    await press('#ht-clear');
    const clrd = await until(sel => { const cl = document.getElementById('ht-clear'), s = document.querySelector(sel + ' select[data-ht-filter="outcome"]'); return cl && cl.disabled && (!s || !s.value) ? true : null; }, HB, 4000);
    check('6e a choice makes Clear pressable, and Clear puts it back', !!clr && !!clrd, JSON.stringify({ clr, clrd }));
    /* the ⋯ menu as drawn */
    await press('#hist-more');
    const M6 = await until(() => { const m = document.getElementById('hist-more-menu'); if (!m || m.classList.contains('hidden')) return null;
      return { groups: [...m.querySelectorAll('.hist-mg')].map(g => g.textContent.trim()), rows: [...m.querySelectorAll('button')].map(b => ({ id: b.id, b: ((b.querySelector('b') || {}).textContent || '').trim(), l: ((b.querySelector('small') || {}).textContent || '').trim(), svg: !!b.querySelector('svg') })),
        w: Math.round(m.getBoundingClientRect().width) }; }, null, 4000);
    check('6f ⋯ as drawn: "This contract" over Verify · Export · Print, each with its line and no symbol; then the whole trail, for an admin',
      !!M6 && M6.groups[0] === 'This contract' && JSON.stringify(M6.rows.map(r => r.id)) === JSON.stringify(['ht-verify', 'ht-export', 'ht-print', 'ht-trail']) && M6.rows.every(r => r.b && r.l && !r.svg) && M6.groups.length === 2 && M6.w >= 280 && M6.w <= 320, JSON.stringify(M6));
    await page.keyboard.press('Escape'); await press('#hist-more').catch(() => {});
    await page.evaluate(() => { const m = document.getElementById('hist-more-menu'); if (m && !m.classList.contains('hidden')) m.classList.add('hidden'); });
    /* Show the wording: the change's marks, cut around the edit, no fingerprint */
    await press('#hist-detail');
    const W6 = await until(() => { const r = [...document.querySelectorAll('#bs-strips .hist-redline')]; if (!r.length) return null;
      return { n: r.length, cut: r.some(x => /…/.test(x.textContent) && !!x.querySelector('ins, del, .rl-ins, .rl-del, [class*="ins"], [class*="del"]')), fp: document.querySelectorAll('#bs-strips .hist-fp').length, hex: r.some(x => /0x[0-9a-f]{8,}/i.test(x.textContent)),
        long: r.some(x => /indirect loss whatsoever arising under this agreement/.test(x.textContent)) }; }, null, 5000);
    check('6g Show the wording: the marks with the long clause cut around the edit ("…"), no fingerprint printed', !!W6 && W6.cut && !W6.long && W6.fp === 0 && !W6.hex, JSON.stringify(W6));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'pass4-12-history-wording-1440x780.png') });
    await press('#hist-detail');

    /* 6h a scroll near the wall's foot brings the next papers, as Show more does */
    await page.setViewportSize({ width: 1440, height: 600 }); await page.waitForTimeout(300);
    await page.evaluate(() => { intel.paper = null; if (window.igWallMoreReset) igWallMoreReset(); hbOpenContracts(); if (window.igWallLetGo) igWallLetGo(); });
    await until(() => document.querySelectorAll('#ig-wall .igw-card').length >= 12, null, 8000);
    const leads = () => page.evaluate(() => [...document.querySelectorAll('#ig-wall .igw-card')].filter(b => { const c = getContract(b.getAttribute('data-ig-pick')); return c && !c.parentId; }).length);
    const before = await leads();
    const scrolled = await page.evaluate(() => { let e = document.getElementById('ig-wall');
      while (e && e !== document.body){ const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 4) break; e = e.parentElement; }
      const sc = (e && e !== document.body) ? e : document.scrollingElement; const was = sc.scrollTop; sc.scrollTop = sc.scrollHeight; return { was, now: sc.scrollTop, id: sc.id || sc.className || sc.tagName }; });
    const after = await until(n => { const k = [...document.querySelectorAll('#ig-wall .igw-card')].filter(b => { const c = getContract(b.getAttribute('data-ig-pick')); return c && !c.parentId; }).length; return k > n ? k : null; }, before, 5000);
    check('6h a scroll that reaches the wall\'s foot brings the next papers (no press)', before === 12 && scrolled.now > scrolled.was && !!after && after > 12, JSON.stringify({ before, scrolled, after }));
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    /* 6i the signed supply agreement's page: its tile, its chips, a chip that lands */
    await page.evaluate(() => { intel.paper = null; hbStripBring('MK-0377'); });
    const T6 = await until(() => { const st = document.getElementById('bs-strip-MK-0377'), g = document.querySelector('#ig-dock .pd-held-dos[data-pd-held-for="MK-0377"]'); if (!st || !g || !st.querySelector('.bs-deal')) return null;
      return { ob: [...st.querySelectorAll('.bs-jb .bs-counts span')].map(x => x.textContent.trim()).filter(t => /obligation/.test(t)), chips: [...document.querySelectorAll('#ig-dock [data-pd-held-chips] button')].map(b => b.textContent.trim()) }; }, null, 10000);
    /* RE-POINTED 21 Oct 2026 (the report simplified): What Jambo read counts the obligations once, in its counts line */
    check('6i What Jambo read counts the obligations, without a first due day', !!T6 && JSON.stringify(T6.ob) === JSON.stringify(['2 obligations']), JSON.stringify(T6));
    const n6b = await tabN();
    check('6j his tab beside a page carries Home\'s own Needs-you number', !!n6b.tab && n6b.tab === n6b.home, JSON.stringify(n6b));
    await press('#ig-dock [data-pd-held-chip="oblig"]');
    const landedOb = await until(() => { const e = document.querySelector('#obw-one-host'); return e && (e.classList.contains('is-landed') || e.classList.contains('is-landed-held')) ? true : null; }, null, 10000);
    check('6k a chip lands on what it opens, lit (obligations → this contract\'s own table)', !!landedOb);

    /* 6l Details: the value as amended with the signed figure, whole; the renewal whole; Filing; People; Related agreements */
    await page.evaluate(() => { intel.paper = null; hbStripBring('MK-0377', 'details'); });
    const D6 = await until(() => { const st = document.querySelector('#bs-strips .bs-details'); if (!st || !st.querySelector('#ov-ess') || !st.querySelector('#ov-filing-rest')) return null;
      const cutUp = el => { for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') return true; return false; };
      const sg = st.querySelector('.ov-amd-signed'), rn = st.querySelector('.ov-rn-by');
      const fam = st.querySelector('.fam-drawn-wrap');
      return { value: sg ? sg.parentElement.textContent.replace(/\s+/g, ' ').trim() : null, valueCut: sg ? cutUp(sg) : null, renew: rn ? rn.parentElement.textContent.replace(/\s+/g, ' ').trim() : null, renewCut: rn ? cutUp(rn) : null,
        filing: [...st.querySelectorAll('#ov-filing-rest .ov-fk')].map(x => x.textContent.trim()), refile: ((st.querySelector('#ov-filing-rest [data-ov-fil-refile]') || {}).textContent || '').trim(),
        people: !!st.querySelector('#ov-people-rest'),
        fam: fam ? { rows: [...fam.querySelectorAll('.fam-drow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()), btns: fam.querySelectorAll('button').length, bring: fam.querySelectorAll('[data-fam-bring]').length } : null }; }, null, 12000);
    check('6l Details reads the value as amended with the signed figure beside it, whole; the renewal whole',
      !!D6 && /^KES 7\.10M as amended ?KES 6\.40M signed$/.test(D6.value || '') && D6.valueCut === false && !!D6.renew && D6.renewCut === false, JSON.stringify(D6 && { value: D6.value, valueCut: D6.valueCut, renew: D6.renew, renewCut: D6.renewCut }));
    check('6m Details has a Filing section (Stream with Re-file, Category) and a People section',
      !!D6 && D6.filing[0] === 'Stream' && D6.filing.includes('Category') && D6.refile === 'Re-file' && D6.people, JSON.stringify(D6 && { filing: D6.filing, refile: D6.refile, people: D6.people }));
    check('6n Related agreements are rows — ref, what it is, when signed — each with Bring it up and no other door',
      !!D6 && !!D6.fam && D6.fam.rows.length === 1 && /^MK-0377-A1Amendment No\. 1 · signed .+Bring it up$/.test(D6.fam.rows[0]) && D6.fam.btns === D6.fam.bring && D6.fam.bring === 1, JSON.stringify(D6 && D6.fam));
    if (OUT){ await page.evaluate(() => { const e = document.querySelector('#ov-filing-rest'); if (e) e.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, 'pass4-7-details-1440x780.png') }); }
    await press('#bs-strips .fam-drawn-wrap [data-fam-bring="MK-0377-A1"]');
    const famLand = await until(() => { const e = document.getElementById('bs-strip-MK-0377-A1'); return window.bsCardId && bsCardId() === 'MK-0377-A1' && e && (e.classList.contains('is-landed') || e.classList.contains('is-landed-held')) ? true : null; }, null, 10000);
    check('6o Bring it up brings the amendment\'s page and lands on it, lit', !!famLand);

    /* 6p a private contract: the CFO's employment agreement, its stream made private (admin and one colleague named) */
    await page.evaluate(async () => { const me = currentUser(); const other = (getUsers() || []).find(u => String(u.id) !== String(me.id));
      await api('private-streams/corp', 'PUT', { on: true, ids: [me.id].concat(other ? [other.id] : []) }); });
    await page.reload({ waitUntil: 'networkidle' });
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0399') && typeof streamIsPrivate === 'function' && streamIsPrivate('corp'), null, 20000);
    await page.evaluate(() => { if (window.intel) intel.paper = null; hbStripBring('MK-0399'); });
    const P6 = await until(() => { const st = document.getElementById('bs-strip-MK-0399'), g = document.querySelector('#ig-dock .pd-held-dos[data-pd-held-for="MK-0399"]'); if (!st || !g) return null;
      return { head: ((st.querySelector('.bs-head .bs-lockp') || {}).textContent || '').trim(), glHead: ((g.querySelector('[data-pd-ds-card="private"] .pd-gl-row span') || {}).textContent || '').trim(),
        rows: [...g.querySelectorAll('[data-pd-ds-card="private"] .pd-gl-row, [data-pd-ds-card="owed"] .pd-gl-row')].map(r => ({ k: r.getAttribute('data-pd-cg') || r.getAttribute('data-pd-gl'), t: ((r.querySelector('span') || {}).textContent || '').replace(/\s+/g, ' ').trim(), b: ((r.querySelector('button') || {}).textContent || '').trim() })),
        /* RE-POINTED 22 Oct 2026: "Who else is on this agreement" is a line of the grid that owes nothing (.is-named) */
        og: [...g.querySelectorAll('#pd-og-held tr.pd-og-row:not(.is-saved):not(.is-named)')].map(r => ({ k: r.getAttribute('data-pd-og-kind'), key: r.getAttribute('data-pd-og-row'), b: ((r.querySelector('[data-pd-og-go]') || {}).textContent || '').trim() })),
        chips: [...document.querySelectorAll('#ig-dock [data-pd-held-chips] button')].map(b => ({ w: b.textContent.trim(), k: b.getAttribute('data-pd-held-chip') })) }; }, null, 12000);
    check('6p a private contract wears "Private · <stream>" on its head, and its dossier opens saying so', !!P6 && /^Private · .+/.test(P6.head) && P6.glHead.indexOf(P6.head) === 0, JSON.stringify(P6 && { head: P6.head, glHead: P6.glHead }));
    const pk = P6 ? P6.rows.map(r => r.k) : [];
    /* RE-POINTED 21 Oct 2026 (THE LEGORA WAY, 20 Oct; "the held grid the same"): beside the Board the owed
       facts are the held grid's rows — the signer among them — each a "Fill in ›" door to the paper */
    const og6 = (P6 && P6.og) || [];
    check('6q its dossier says who may open it, then the facts still owed — the signer among them — each with Fill in ›',
      !!P6 && pk[0] === 'private' && /^Private · .+\. Only .+ open it; every open is recorded\.$/.test(P6.rows[0].t)
      && og6.length > 1 && og6.some(r => r.k === 'signer') && og6.every(r => /^Fill in/.test(r.b)), JSON.stringify(P6 && { rows: P6.rows, og: og6 }));
    check('6r its chips follow what it owes — fill in · pay · who can open it — not the signed agreement\'s',
      !!P6 && JSON.stringify(P6.chips.map(c => c.k)) === JSON.stringify(['fill', 'pay', 'access']) && P6.chips[1].w === 'pay' && P6.chips[2].w === 'who can open it'
      && !!T6 && JSON.stringify(T6.chips) !== JSON.stringify(P6.chips.map(c => c.w)), JSON.stringify(P6 && { chips: P6.chips, signed: T6 && T6.chips }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'pass4-7-page-private-1440x780.png') });
    /* its History leads with its wall; nothing has been shared yet */
    await page.evaluate(() => hbStripBring('MK-0399', 'hist'));
    const PH = await until(() => { const g = document.querySelector('#ig-dock #pd-histglance[data-pd-held-for="MK-0399"]'); const host = document.querySelector('#bs-strips [data-bs-host="hist"]'); if (!g || !host || !host.querySelector('.hist-ev')) return null;
      const c = getContract('MK-0399');
      return { rows: [...g.querySelectorAll('.pd-gl-row')].map(r => ({ k: r.getAttribute('data-pd-hg'), t: ((r.querySelector('span') || {}).textContent || '').replace(/\s+/g, ' ').trim() })),
        opened: Array.isArray(c._opens) ? c._opens.length : 0 }; }, null, 12000);
    /* RE-POINTED 21 Oct 2026 (the SAP way): the filters stand in the open — nothing to press first */
    const PHf = await until(() => { const b = document.querySelector('#bs-strips [data-bs-host="hist"] .hist-filters'); return b ? { opens: !!b.querySelector('select[data-ht-filter="opens"]') } : null; }, null, 4000);
    check('6s a private contract\'s History leads with its wall ("…every open is in this History."), says nothing was shared yet, and offers Opens only where it was opened',
      !!PH && PH.rows[0] && PH.rows[0].k === 'private' && /every open is in this History\./.test(PH.rows[0].t) && PH.rows.some(r => r.k === 'unshared' && r.t === 'Nothing has been shared with Annika Holm yet.')
      && !!PHf && PHf.opens === (PH.opened > 0), JSON.stringify({ PH, PHf }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'pass4-12-history-private-1440x780.png') });
    /* its Details' Filing: the stream, private, and for an admin the door to who may open it */
    await page.evaluate(() => hbStripBring('MK-0399', 'details'));
    const PF = await until(() => { const f = document.querySelector('#bs-strips #ov-filing-rest'); if (!f) return null;
      return { lock: ((f.querySelector('.bs-lockp') || {}).textContent || '').trim(), door: ((f.querySelector('[data-ov-fil-access]') || {}).textContent || '').trim(), refile: !!f.querySelector('[data-ov-fil-refile]'),
        sub: ((f.querySelector('.ov-fs') || {}).textContent || '').trim() }; }, null, 10000);
    check('6t a private contract\'s Filing says "Private", who is named, and gives an admin "Who may open it" in Re-file\'s place',
      !!PF && PF.lock === 'Private' && PF.door === 'Who may open it' && !PF.refile && !!PF.sub, JSON.stringify(PF));
    await press('#bs-strips #ov-filing-rest [data-ov-fil-access]');
    const stLand = await until(() => { const e = document.querySelector('#st-ps'); return e && (e.classList.contains('is-landed') || e.classList.contains('is-landed-held')) ? true : null; }, null, 12000);
    check('6u Who may open it lands on the stream\'s own access list, lit', !!stLand);
    await page.keyboard.press('Escape').catch(() => {});

    /* ===================== 4 THE OWNER'S THREE SCREENS ===================== */
    const shotsDir = OUT || '';
    const scenes = [
      ['13-chosen-paper', async () => { await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); /* the Wall, picked (20 Oct 2026: the place lands on the List) */ hbOpenContracts(); if (window.igWallLetGo) igWallLetGo(); }); await until(() => !!document.querySelector('#ig-wall .igw-card'), null, 8000);
        await bring('MK-0382'); await press('#ig-wall .igw-card[data-ig-pick="MK-0382"]');
        await until(() => !!document.querySelector('#ig-dock #pd-chosen'), null, 4000); return '#ig-dock #pd-chosen'; }],
      ['7-page-glance', async () => { await page.evaluate(() => hbStripBring('MK-0377')); await until(() => !!document.querySelector('#ig-dock .pd-held-dos') && !!document.querySelector('#bs-strip-MK-0377 .bs-deal'), null, 8000); return '#ig-dock .pd-held-dos .ds-spine'; }],
      ['12-history-panel', async () => { await page.evaluate(() => hbStripBring('MK-0382', 'hist')); await until(() => !!document.querySelector('#ig-dock #pd-histglance') && !!document.querySelector('#bs-strips .hist-ev'), null, 8000); return '#ig-dock #pd-histglance'; }],
      /* pass 4: the private contract's page and History, the signed one's Details, a second round's History */
      ['pass4-7-page-private', async () => { await page.evaluate(() => hbStripBring('MK-0399')); await until(() => !!document.querySelector('#ig-dock .pd-held-dos[data-pd-held-for="MK-0399"]') && !!document.querySelector('#bs-strip-MK-0399'), null, 8000); return '#ig-dock .pd-held-dos .ds-spine'; }],
      ['pass4-7-details', async () => { await page.evaluate(() => hbStripBring('MK-0377', 'details')); await until(() => !!document.querySelector('#bs-strips #ov-filing-rest'), null, 10000);
        await page.evaluate(() => { const e = document.querySelector('#ov-filing-rest'); if (e) e.scrollIntoView({ block: 'center' }); }); return '#ig-dock .pd-held-dos .ds-spine'; }],
      ['pass4-12-history-two-rounds', async () => { await page.evaluate(() => hbStripBring('MK-0390', 'hist')); await until(() => !!document.querySelector('#ig-dock #pd-histglance[data-pd-held-for="MK-0390"]') && !!document.querySelector('#bs-strips .hist-ev'), null, 8000); return '#ig-dock #pd-histglance'; }],
      ['pass4-12-history-private', async () => { await page.evaluate(() => hbStripBring('MK-0399', 'hist')); await until(() => !!document.querySelector('#ig-dock #pd-histglance[data-pd-held-for="MK-0399"]') && !!document.querySelector('#bs-strips .hist-ev'), null, 8000); return '#ig-dock #pd-histglance'; }],
    ];
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      for (const [name, go] of scenes) {
        const sel = await go(); await page.waitForTimeout(500);
        const F = await page.evaluate(sel => { const el = document.querySelector(sel); const r = el && el.getBoundingClientRect();
          /* its first line under the tab row, never behind it: the feed starts at the card's top (pass 3) */
          const fd = document.getElementById('igd-feed'), ft = fd ? fd.getBoundingClientRect().top : 0;
          /* pass 4: the chosen paper's doors whole and inside the panel (1536×730 cut them) */
          const dock = document.getElementById('ig-dock'), dr = dock ? dock.getBoundingClientRect() : null;
          const doors = [...document.querySelectorAll('#ig-dock #pd-chosen button, #ig-dock .pd-held-dos .ds-card button, #ig-dock #pd-histglance button')];
          /* pass 4: no mark's line runs through a label on the life line (at 1366 wide Today's ran through "A|mendment No. 1") */
          const through = [];
          document.querySelectorAll('#bs-strips svg').forEach(svg => { const labs = [...svg.querySelectorAll('text.bs-lab')];
            svg.querySelectorAll('line.bs-tick').forEach(t => { const tr = t.getBoundingClientRect(), own = ((t.querySelector('title') || {}).textContent || '').trim();
              labs.forEach(L => { if (L.textContent.trim() === own) return; const lr = L.getBoundingClientRect();
                if (tr.left > lr.left + 1 && tr.left < lr.right - 1 && tr.bottom > lr.top + 1 && tr.top < lr.bottom - 1) through.push(own + ' through ' + L.textContent.trim()); }); }); });
          return { panel: !!r && r.top >= 0 && r.top >= ft - 1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1, side: document.documentElement.scrollWidth <= innerWidth + 1,
            head: !!document.querySelector('#ig-dock .igd-head-w'),
            cut: [...document.querySelectorAll('#ig-dock .pd-ch-needs small, #ig-dock [data-pd-held-chips] button')]/* against the border box: a button's own edge is not a cut */ .concat(doors).some(x => x.offsetParent && x.scrollWidth > x.offsetWidth + 1),
            cutWhat: [...document.querySelectorAll('#ig-dock .pd-ch-needs small, #ig-dock [data-pd-held-chips] button')].concat(doors).filter(x => x.offsetParent && x.scrollWidth > x.offsetWidth + 1).map(x => x.textContent.trim().slice(0, 30) + ' ' + x.scrollWidth + '>' + x.offsetWidth),
            outside: dr ? doors.filter(b => b.offsetParent && b.getBoundingClientRect().right > dr.right + 1).map(b => b.textContent.trim()) : [], through }; }, sel);
        check(`4 ${w}×${ht} ${name}: the panel's card in view, its head named, nothing sideways, nothing cut, every door inside the panel`, F.panel && F.side && F.head && !F.cut && !F.outside.length, JSON.stringify(F));
        if (/7-page/.test(name)) check(`4 ${w}×${ht} ${name}: no mark's line runs through a label on the life line`, !F.through.length, JSON.stringify(F.through));
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
