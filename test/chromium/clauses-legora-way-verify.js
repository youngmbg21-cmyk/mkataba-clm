/* Chromium verification: CLAUSE REVIEW, THE LEGORA WAY (owner said yes,
   21 Oct 2026 — design round 1, "If Legora drew it": Mark reviewed as a new
   record, the head renamed, the Clauses tab's number = the "need you" count).

   1 the head is "Clause review" with its grey sub, and NO count line
     (re-pointed 21 Oct 2026, the owner: "remove the highlighted area as it is
     redundant") — the Severity filter is the one door onto the same three
   2 two finders quoting the same sentence are ONE card, worst verdict, both
     finders named ("Found by Jambo · Our standards") — counted once
   3 under a clause the cards stand WORST FIRST (the paper would put the
     "worth a look" sentence first), and the deep dive's ‹ › walk the list's
     own order
   4 the Clauses tab's number equals the "need you" count
   5 a point the contract lacks stands IN PLACE: a row right after the clause
     it would follow, "After §2 — not in the contract", with NO dashed border
     (re-pointed 21 Oct 2026, the owner: "no dotted lines in the clauses") and
     its own open and close; no bottom fold
   6 Mark reviewed is the SERVER's record: the card is struck with "Reviewed ·
     <name>", the count and the tab drop, it survives a reload (and a save
     that echoes an old map), the trail has a line, Undo takes it back
   7 a viewer cannot write it (403) and sees the button greyed with why
   8 no page errors

   Jambo's route is stubbed in the page (window.api), so nothing is spent.
   Run: node test/chromium/clauses-legora-way-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const PAY = 'Invoices are paid within thirty days of receipt.';
const IND = 'Neither party is liable for indirect loss of any kind.';
const CAP = 'Liability is capped at the fees paid in the last three months.';
const ID = 'MK-L1';
const deal = () => ({ id: ID, contractNo: ID, name: 'Haulage Review', counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: '', format: 'rich', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  redlineText: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(5) + '</p>'
    + '<h2>2. Payment</h2><p>' + PAY + ' ' + 'Each invoice names the shipment it covers. '.repeat(4) + '</p>'
    + '<h2>3. Liability</h2><p>' + IND + ' ' + 'Each party keeps its own insurance in force. '.repeat(3) + CAP + '</p>'
    + '<h2>4. General</h2><p>' + 'This agreement is the whole agreement between the parties. '.repeat(4) + '</p>',
  /* the kept standards check: Payment terms departs, ESCALATED — the same sentence Jambo quotes */
  playbook: { key: '_default', source: 'heuristic', verdicts: [
    { category: 'Payment terms', status: 'deviation', quote: PAY, position: 'Paid within 14 days', redline: 'Invoices are paid within 14 days of receipt.', escalate: true },
    { category: 'Governing law', status: 'aligned', quote: '', position: '', redline: '', escalate: false }] } });

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [deal()], approvalRules: [] });
  /* a viewer, for 7 */
  await W.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(e.message));
    const signIn = async (email, pass) => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
      await page.waitForFunction(id => typeof getContract === 'function' && !!getContract(id), ID, { timeout: 15000 });
    };
    await signIn('admin@example.co.ke', 'adminpassword1');
    await page.evaluate(() => {
      state.aiConfigured = true;
      window.__bd = 0;
      const o = window.api;
      window.api = async function (p, ...a){
        if (p !== 'ai/breakdown') return o.call(this, p, ...a);
        window.__bd++;
        return { head: 'Fix the cap first', sub: '', links: [],
          regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: '', items: [{ ref: '2', title: 'Payment' }], quotes: [] },
            { name: 'Risk', status: 'need', kind: 'protect', headline: '', items: [{ ref: '3', title: 'Liability' }], quotes: [] }],
          points: [
            /* Jambo says it is only worth a look; our standard escalates it — the merged card needs you */
            { clause: '2', region: 1, status: 'look', missing: false, title: 'We pay in thirty days', stake: 'Our cash leaves a fortnight later than our standard asks.', quote: 'Invoices are paid within thirty days of receipt.', links: [] },
            /* in clause 3 the "worth a look" sentence comes FIRST on the paper */
            { clause: '3', region: 2, status: 'look', missing: false, title: 'Indirect loss is shut out', stake: 'Lost profit from a late load is never paid.', quote: 'Neither party is liable for indirect loss of any kind.', links: [] },
            { clause: '3', region: 2, status: 'need', missing: false, title: 'Their cover stops at three months', stake: 'A single lost load could cost far more than the cap.', quote: 'Liability is capped at the fees paid in the last three months.', links: [] },
            { clause: '', after: '2', region: 1, status: 'look', missing: true, title: 'No notice before a price rise', stake: 'Prices could rise with no warning.', quote: '', links: [] }] };
      };
      setView('dashboard');
      pdOpenOnHome('MK-L1', 'doc');
    });
    const read = await page.waitForSelector('#pd-thread .doc-th-row', { timeout: 10000 }).then(() => page.waitForFunction(() => !!(getContract('MK-L1').breakdown || {}).ok, null, { timeout: 10000 })).then(() => true, () => false);
    await page.waitForTimeout(600);

    /* 1 the head */
    /* RE-POINTED 21 Oct 2026 (the owner: of the three-count line "remove the
       highlighted area as it is redundant"): the line and its doors are gone;
       the title, its grey sub and the three filter boxes stand, and the
       counts themselves live on where the number is read (stkNeedCount, 4). */
    /* RE-POINTED 23 Oct 2026 (owner picked "Marquee"): the head is a serif headline counting the clauses that need
       you, one sentence naming where to start, and the clauses as tabs with counts; still no count line, no boxes */
    const e1 = await page.evaluate(id => ({ title: ((document.querySelector('#pd-thread .stk-mq-t') || {}).textContent || '').trim(),
      sub: ((document.querySelector('#pd-thread .stk-mq-s') || {}).textContent || '').trim(),
      line: !!document.querySelector('#pd-thread .stk-tally, #pd-thread [data-stk-sev]'),
      boxes: document.querySelectorAll('#pd-thread .stk-flt').length,
      tabs: [...document.querySelectorAll('#pd-thread .stk-tab')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).join('|'),
      need: stkNeedCount(getContract(id)) }), ID);
    /* RE-POINTED 23 Oct 2026 (owner: "below '3 clauses need you', remove all the other supporting words"): no sentence */
    ok('1 the head is a headline and tabs with counts, no sentence and no count line', read && /^2 clauses need you$/.test(e1.title)
      && !e1.sub && !e1.line && e1.boxes === 0
      && e1.tabs === 'All4|Needs you2|Worth a look2|Fine2' && e1.need === 2, JSON.stringify(e1));
    /* 1b THE "WORTH A LOOK" TAB narrows the list and lets go (the Severity box's act, kept) */
    const e1b = await page.evaluate(async () => {
      const tab = k => document.querySelector(`#pd-thread [data-stk-tab="${k}"]`);
      if (!tab('look')) return { box: false };
      const cards = () => document.querySelectorAll('#pd-thread .stk-card').length;
      const all = cards();
      tab('look').click(); await new Promise(r => setTimeout(r, 250));
      const look = cards(), lit = (tab('look') || {}).getAttribute && tab('look').getAttribute('aria-selected');
      tab('').click(); await new Promise(r => setTimeout(r, 250));
      return { box: true, all, look, lit, back: cards() };
    });
    ok('1b the "Worth a look" tab narrows to the same points, and All lets go',
      e1b.box && e1b.lit === 'true' && e1b.look === 2 && e1b.back === e1b.all && e1b.all === 4, JSON.stringify(e1b));

    /* 2 + 3: open clause 2, then clause 3 */
    const openRow = n => page.evaluate(async n => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => new RegExp('^' + n + '\\b').test((r.querySelector('.doc-th-name') || {}).innerText || ''));
      if (!row) return false;
      if (!row.classList.contains('is-open')){ row.querySelector('[data-th-go]').click(); await new Promise(z => setTimeout(z, 900)); }
      return true;
    }, n);
    await openRow(2);
    const e2 = await page.evaluate(() => {
      const row = document.querySelector('#pd-thread .doc-th-row.is-open');
      const cards = row ? [...row.querySelectorAll(':scope > .stk-card')] : [];   /* the clause's OWN cards; its missing point stands in it under its own head (22 Oct 2026) */
      return { name: row ? row.querySelector('.doc-th-name').innerText : null, n: cards.length,
        verd: cards.map(c => (c.querySelector('.stk-verd') || {}).textContent), by: cards.map(c => (c.querySelector('.stk-by') || {}).textContent),
        std: cards.map(c => (c.querySelector('.stk-std') || {}).textContent || ''), state: (row && row.querySelector('[data-th-state]') || {}).textContent || '' };
    });
    /* RE-POINTED 22 Oct 2026: the clause's word counts its missing point too ("Needs you · 2": the twin and the price-rise notice) */
    ok('2 the twin is ONE card: worst verdict, both finders, our standard beside it', /^2\b/.test(e2.name || '') && e2.n === 1 && e2.verd[0] === 'Needs you'
      && e2.by[0] === 'Found by Jambo · Our standards' && /Our standard: Paid within 14 days/.test(e2.std[0]) && /^Needs you · 2$/.test(e2.state.trim()), JSON.stringify(e2));
    await openRow(3);
    const e3 = await page.evaluate(() => {
      const row = document.querySelector('#pd-thread .doc-th-row.is-open');
      const cards = row ? [...row.querySelectorAll(':scope > .stk-card')] : [];   /* the clause's OWN cards; its missing point stands in it under its own head (22 Oct 2026) */
      const all = [...document.querySelectorAll('#pd-thread .doc-th-rows [data-stk-dive]')].map(b => Number(b.getAttribute('data-stk-dive')));
      const titles = [...document.querySelectorAll('#pd-thread .doc-th-rows .stk-card')].map(c => (c.querySelector('.stk-ct') || {}).textContent);
      return { titles: cards.map(c => (c.querySelector('.stk-ct') || {}).textContent), verd: cards.map(c => (c.querySelector('.stk-verd') || {}).textContent),
        order: all, listTitles: titles };
    });
    ok('3 under a clause the cards stand worst first, though the paper puts the other sentence first',
      e3.verd.join('|') === 'Needs you|Worth a look' && /cover stops/.test(e3.titles[0] || ''), JSON.stringify(e3));
    const walk = await page.evaluate(async () => {
      const out = [];
      const c = getContract('MK-L1');
      stkDiveOpen(c, 0); await new Promise(r => setTimeout(r, 200));
      for (let k = 0; k < 6; k++){
        out.push((document.querySelector('#pd-thread .stk-dv h3') || {}).textContent || '');
        const nx = document.querySelector('#pd-thread .stk-pg [data-stk-dive]:last-child');
        if (!nx || nx.disabled) break;
        nx.click(); await new Promise(r => setTimeout(r, 200));
      }
      stkDiveClose(c);
      return out;
    });
    ok('3b the dive walks the list\'s own order', e3.order.join(',') === e3.order.slice().sort((a, b) => a - b).join(',') && walk.length === e3.listTitles.length
      && walk.join('|') === e3.listTitles.join('|'), JSON.stringify({ walk, list: e3.listTitles, order: e3.order }));

    /* 4 the tab's number */
    const badge = () => page.evaluate(() => ((document.querySelector('#ig-dock [data-pd-tab="doc"] .pd-tab-n') || {}).textContent || '').trim());
    /* RE-POINTED 21 Oct 2026: the count line is gone, so the "need you" count
       is read where it still lives — the one reading the tab's number uses. */
    const tally = () => page.evaluate(id => stkNeedCount(getContract(id)), ID);
    const b0 = await badge();
    ok('4 the Clauses tab carries the "need you" count', b0 === '2', JSON.stringify({ badge: b0, tally: await tally() }));

    /* 5 missing in place: INSIDE its clause, opening and closing with it (owner, 22 Oct 2026) */
    await openRow(2);
    const e5 = await page.evaluate(async () => {
      const m = document.querySelector('#pd-thread .doc-th-rows .stk-miss');
      const prev = m && m.closest('.doc-th-row');
      const cs = m && getComputedStyle(m);
      const btn = m && m.querySelector('[data-stk-miss-go]');
      const body = m && m.querySelector('.stk-miss-body');
      const seen = () => !!(body && body.getClientRects().length);
      /* RE-POINTED 23 Oct 2026 (the owner: "it is absolutely not clear that not in the contract is a button.
         Make it a clear press feature"): the head is an outlined button carrying its words, its count and an
         arrow; its words are read from their own span */
      const hb = m && m.querySelector('.stk-miss-h'), hcs = hb && getComputedStyle(hb);
      const out = { h: m ? (m.querySelector('.stk-miss-hw') || {}).textContent : null, hn: m ? (m.querySelector('.stk-miss-hn') || {}).textContent : null,
        hEdge: hcs ? hcs.borderTopWidth + ' ' + hcs.borderTopStyle : '', hArrow: !!(hb && hb.querySelector('svg')), prev: prev && prev.classList.contains('doc-th-row') ? prev.querySelector('.doc-th-name').innerText : null,
        card: m ? ((m.querySelector('.stk-ct') || {}).textContent || '') : '', shows: !!(m && m.querySelector('.stk-card') && m.querySelector('.stk-card').getClientRects().length),
        border: cs ? cs.borderTopStyle + '/' + cs.borderTopWidth : '', indent: cs ? cs.marginLeft : '', fold: !!document.querySelector('#pd-thread [data-stk-mopen]'), close: !!btn };
      if (btn){ btn.click(); await new Promise(r => setTimeout(r, 150)); out.shut = !seen();
        btn.click(); await new Promise(r => setTimeout(r, 150)); out.reopened = seen(); }
      /* ONE PRESS: the clause's own head closes the missing point with it, and opens it again;
         its word counts it (clause 2 has one point of its own and this one) */
      const go = prev && prev.querySelector('[data-th-go]');
      const mShown = () => { const x = document.querySelector('#pd-thread .doc-th-rows .stk-miss'); return !!(x && x.getClientRects().length); };
      out.word = prev ? ((prev.querySelector('[data-th-state] .stk-n') || {}).textContent || '') : '';
      if (go){ go.click(); await new Promise(r => setTimeout(r, 600)); out.clauseShut = !mShown();
        go.click(); await new Promise(r => setTimeout(r, 600)); out.clauseOpen = mShown(); }
      return out;
    });
    /* RE-POINTED 21 Oct 2026 (the owner: "no dotted lines in the clauses", and
       nothing in the list may be uncloseable): no dashed box — the indent and
       the grey label carry the group — and its head is its own open/close. */
    ok('5 a point the contract lacks stands inside clause 2, no dashed border, its own close, no bottom fold',
      e5.h === 'After §2 — not in the contract' && /^2\b/.test(e5.prev || '') && /price rise/.test(e5.card) && e5.shows
      && /\/0px$/.test(e5.border) && parseFloat(e5.indent) >= 20 && e5.close && e5.shut && e5.reopened && !e5.fold, JSON.stringify(e5));
    ok('5c the group\'s head is a clear press: an outlined button with its count and an arrow',
      e5.hEdge === '1px solid' && e5.hn === '1' && e5.hArrow, JSON.stringify({ edge: e5.hEdge, n: e5.hn, arrow: e5.hArrow }));
    /* 5d PLAIN ENGLISH FIRST (owner, 23 Oct 2026: it "should be at the top before needs you and worth a look"):
       in the open clause its reading comes before its cards */
    const e5d = await page.evaluate(() => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row.is-open')].find(r => r.querySelector(':scope > .stk-card'));
      const body = row && row.querySelector(':scope > .doc-th-body'), card = row && row.querySelector(':scope > .stk-card');
      return { row: !!row, before: !!(body && card && (body.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)) };
    });
    ok('5d in an open clause its Plain English stands above its cards', e5d.row && e5d.before, JSON.stringify(e5d));
    ok('5b pressing clause 2 closes its missing point with it and opens it again; the clause\'s word counts it',
      e5.clauseShut === true && e5.clauseOpen === true && /· 2$/.test(e5.word.trim()), JSON.stringify({ shut: e5.clauseShut, open: e5.clauseOpen, word: e5.word }));

    /* 6 Mark reviewed (the walk above moved the paper, so clause 3 is opened again) */
    await openRow(3);
    const e6 = await page.evaluate(async () => {
      const card = [...document.querySelectorAll('#pd-thread .doc-th-row.is-open .stk-card')].find(c => /cover stops/.test(c.textContent));
      const btn = card && card.querySelector('[data-stk-review]');
      if (!btn) return { btn: false };
      const calls = []; const o = window.api; window.api = async function (p, ...a){ calls.push(p); return o.call(this, p, ...a); };
      btn.click();
      for (let i = 0; i < 40 && !document.querySelector('#pd-thread .stk-card.is-done'); i++) await new Promise(r => setTimeout(r, 100));
      window.api = o;
      const done = document.querySelector('#pd-thread .stk-card.is-done');
      return { btn: true, calls, done: !!done, struck: done ? getComputedStyle(done.querySelector('.stk-verd')).textDecorationLine : '',
        who: done ? (done.querySelector('.stk-mk') || {}).textContent : '', undo: !!(done && done.querySelector('[data-stk-unreview]')) };
    });
    const t1 = await tally(), b1 = await badge();
    ok('6 Mark reviewed asks the server, strikes the card and names who (by first name), and leaves every count',
      e6.done && e6.calls.some(p => /^contracts\/MK-L1\/points\/p[a-z0-9]+\/review$/.test(p)) && e6.struck === 'line-through' && /^Reviewed · Amina$/.test((e6.who || '').trim()) && e6.undo
      && t1 === 1 && b1 === '1', JSON.stringify({ e6, need: t1, badge: b1 }));
    /* a save from a page that holds an OLD map may not take the tick away */
    await page.evaluate(async () => { const c = getContract('MK-L1'); c.pointReviews = {}; persist(c); await flushSaves(); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(id => typeof getContract === 'function' && !!getContract(id), ID, { timeout: 15000 });
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-L1', 'doc'); });
    await page.waitForSelector('#pd-thread .doc-th-row', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(900);
    await openRow(3);
    const e6b = await page.evaluate(async () => {
      const c = getContract('MK-L1'); if (typeof ensureFull === 'function') await ensureFull(c);
      const live = getContract('MK-L1');
      return { map: Object.keys(live.pointReviews || {}).length, done: !!document.querySelector('#pd-thread .stk-card.is-done'),
        trail: (live.audit || []).filter(a => a && a.action === 'Clause review').map(a => a.detail) };
    });
    const t2 = await tally(), b2 = await badge();
    ok('6b after a reload (and a save echoing an old map) the tick stands, the counts still leave it out, the trail has its line',
      e6b.map === 1 && e6b.done && t2 === 1 && b2 === '1' && e6b.trail.some(d => /Marked reviewed: Their cover stops/.test(d)), JSON.stringify({ e6b, tally: t2, badge: b2 }));
    const e6c = await page.evaluate(async () => {
      const u = document.querySelector('#pd-thread .stk-card.is-done [data-stk-unreview]'); if (!u) return { undo: false };
      u.click();
      for (let i = 0; i < 40 && document.querySelector('#pd-thread .stk-card.is-done'); i++) await new Promise(r => setTimeout(r, 100));
      return { undo: true, gone: !document.querySelector('#pd-thread .stk-card.is-done'), map: Object.keys(getContract('MK-L1').pointReviews || {}).length };
    });
    const t3 = await tally(), b3 = await badge();
    ok('6c Undo takes it back on the server; the counts return', e6c.undo && e6c.gone && e6c.map === 0 && t3 === 2 && b3 === '2', JSON.stringify({ e6c, need: t3, badge: b3 }));

    /* 7 a viewer */
    const v = h.client('viewer@example.co.ke');
    await v.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
    await v.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    const vr = (await v.raw('/api/contracts/' + ID + '/points/pabc123/review', { method: 'POST', body: { title: 'x' } })).status;
    const ar = (await W.admin.raw('/api/contracts/' + ID + '/points/BAD-KEY/review', { method: 'POST', body: {} })).status;
    const vp = await page.evaluate(() => { const u = currentUser(); const was = u.role; u.role = 'viewer';
      docThreadPaint(getContract('MK-L1'));
      const b = document.querySelector('#pd-thread [data-stk-review]'); const out = { btn: !!b, dis: !!(b && b.disabled), why: b ? b.getAttribute('title') : '' };
      u.role = was; docThreadPaint(getContract('MK-L1')); return out; }).catch(e => ({ err: String(e) }));
    ok('7 a viewer cannot write it (403), a bad key is refused (400), and the button is greyed with why',
      vr === 403 && ar === 400 && vp.btn && vp.dis && /editor/.test(vp.why || ''), JSON.stringify({ viewer: vr, badKey: ar, vp }));
    ok('8 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
