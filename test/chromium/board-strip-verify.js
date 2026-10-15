/* ============================================================
   THE LIFELINE STRIP ON THE BOARD — and the contract room retires
   (the overnight work order, step 8; owner's "Go", 14 Oct 2026;
   docs/WORKORDER-one-page-finish.md, drawn as version 4 of
   docs/WORKORDER-one-page-finish-strip.html)
   ============================================================
   A supply agreement uploaded and read on arrival (its brief, two risks, a
   standards check with one missing and one different, a dated price review),
   under review with the other side's round on it, eleven obligations of
   ours and theirs (one late, one done, one yearly), auto-renewing with
   ninety days' notice. Driven in a real browser:
     1  bring up: Jambo's box ("bring up MK-L1"), ⌘K's contract row and the
        old room door (openWorkspace) each land the contract on the Board as
        a strip BELOW Today's insights, newest first, the room never drawn;
        a second contract stacks above the first
     2  the strip's sections and numbers, each read against the record: the
        head (title · ref · counterparty · stage · ⋯ · ×), who it is with,
        the five figures, the life line (term, notice window, negotiation,
        today, the obligations as dots, the legend's counts, the caption),
        Key terms (an owed one amber), Obligations in their own scroll box
        (sticky head, about seven rows, the next one marked), what Jambo read
        (the brief's sentence, risks, standards, details, obligations, each
        with its door) and the foot (Open · Keep · Ask why · Let it go)
     3  ⋯: Where we are, History and Details; again closes it, Esc and a press outside
        too; Where we are is the one builder (standsHtml) with the strip's
        own way back; History is the room's trail on the Board: search, Side
        in the open (All sides · Ours · Theirs), Filter for the other four,
        Show the wording, the trail scrolling inside the card, ⋯ More keeps
        Verify integrity
     4  × closes one; Keep keeps it (and says so); Let it go takes it off
     5  a refresh comes back to the same strips on the same pages
     6  Details: Key terms' Edit opens the Overview's own sheet in the strip;
        the paper's ⋯ "Filing and stream" lands on its filing rows there
     7  the room retires: openWorkspace, roomGoTab 'stands', an email link
        with no tab and a refresh standing on the room all open the strip;
        the room is still drawn by name (opts.room) and on the phone
     8  Svenska: the strip's words are Swedish
     9  the owner's three screens: nothing scrolls sideways, the figures sit
        on one line, photographed at each
    10  the checkers' round (15 Oct 2026): a refresh reads the whole record
        behind every restored strip (the brief comes back, the ring stops);
        Details follows the record; Write the brief on Details lands as an
        open brief and a second press costs nothing; "See the standards" opens
        the stored reading and spends nothing; "bring up" on the paper face
        brings the strip up, free; the room by name is forgotten once left;
        a signed contract names who signed, reads its value as amended and
        draws no repeat past a fixed end; a start date owed is amber; an
        undated obligation is said and a far one is drawn; "Read the brief"
        beside the brief line opens that contract's brief, free, and shuts
        on a second press; no brief, no button (owner, 15 Oct 2026)
   AT THE PARENT every claim FAILS: there is no strip there (a contract
   brought up drew the old card in #hb-focus, and openWorkspace the room).
     node test/chromium/board-strip-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'board-strip');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
/* the owner's three screens (CLAUDE.md: two laptops and an iPad Pro 12.9") */
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
/* dates are offsets from the day the run happens, never fixed days */
const day = n => { const t = new Date(); t.setDate(t.getDate() + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

const DOC = ['PACKAGING FILM SUPPLY AGREEMENT', '', '1. Supply', '', 'Nordfilm shall supply the film described in Schedule 1.', '',
  '2. Price and adjustment', '', 'Prices are fixed for twelve months and may thereafter be adjusted at any time.', '',
  '3. Payment', '', 'Highland shall pay each correct invoice within 45 days of receipt.', '',
  '9. Liability', '', 'Each Party\'s aggregate liability is unlimited.', '',
  '12. Term', '', 'This agreement runs for two years and renews for twelve months unless notice is given ninety days before its end.'].join('\n');
const START = 40, END = 40 + 730;
const OBS = [
  ['o1', 'Pay the deposit', 'ours', -4, 'open'],
  ['o2', 'Sign the confidentiality letter', 'ours', -30, 'done'],
  ['o3', 'First call-off', 'theirs', START + 14, 'open'],
  ['o4', 'Send the yearly forecast', 'ours', START + 60, 'open'],
  ['o5', 'Quarterly volume review', 'ours', START + 90, 'open'],
  ['o6', 'Quality certificate', 'theirs', START + 120, 'open', 'annual'],
  ['o7', 'Price review meeting', 'ours', START + 365, 'open'],
  ['o8', 'Deliver the safety data sheets', 'theirs', START + 30, 'open'],
  ['o9', 'Audit the warehouse', 'ours', START + 200, 'open'],
  ['o10', 'Hand over the exit plan', 'theirs', END - 30, 'open'],
  ['o11', 'Return the pallets', 'theirs', START + 300, 'open'],
].map(([id, desc, party, off, status, recurring]) => ({ id, desc, party, due: day(off), status, ...(recurring ? { recurring } : {}) }));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  /* the checkers' round (section 10): a signed contract with an amendment
     that set its value, a fixed term and a quarterly obligation; a draft
     with an end date but no start, one undated obligation and a far one */
  const L3 = fixtureContract('MK-L3', 'Zeta Services Agreement', 'Zeta Services', FOLDER_A, 300000, 'Signed', 'SERVICES AGREEMENT\n\n1. Services\n\nZeta provides the services.');
  Object.assign(L3, { expiry: day(1060), fields: { value: '300000', effDate: day(-35) }, metadata: { value: 300000, currency: 'USD', renewalType: 'fixed' }, signedAt: new Date(Date.now() - 40 * 864e5).toISOString(),
    signatures: [{ party: 'first', name: 'Amina Otieno', at: new Date(Date.now() - 40 * 864e5).toISOString() }, { party: 'counterparty', name: 'Bob Zeta', at: new Date(Date.now() - 40 * 864e5).toISOString() }],
    obligations: [{ id: 'q1', desc: 'Pay the quarterly fee', party: 'ours', due: day(20), recurring: 'quarterly', status: 'open' }] });
  const L3A = fixtureContract('MK-L3-A1', 'Amendment 1 to the Zeta Services Agreement', 'Zeta Services', FOLDER_A, 450000, 'Signed', 'AMENDMENT 1\n\n1. Fees\n\nThe fee is raised.');
  Object.assign(L3A, { parentId: 'MK-L3', relation: 'amendment', valueSetHere: true, expiry: null, metadata: { value: 450000, currency: 'USD' }, signedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    signatures: [{ party: 'first', name: 'Amina Otieno', at: new Date(Date.now() - 5 * 864e5).toISOString() }, { party: 'counterparty', name: 'Bob Zeta', at: new Date(Date.now() - 5 * 864e5).toISOString() }] });
  const L4 = fixtureContract('MK-L4', 'Tango Pilot', 'Tango Ltd', FOLDER_A, 50000, 'Draft', 'TANGO PILOT\n\n1. Work\n\nTango does the pilot.');
  Object.assign(L4, { expiry: day(400), fields: { value: '50000' },
    obligations: [{ id: 't1', desc: 'Send the plan', party: 'ours', status: 'open' }, { id: 't2', desc: 'Hand over the archive', party: 'theirs', due: day(1500), status: 'open' }] });
  const W = await seedWorkspace(h, { contracts: [L3, L3A, L4], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = fixtureContract('MK-L1', 'Packaging Film Supply Agreement', 'Nordfilm Packaging AB', FOLDER_A, 3600000, 'Under Review', DOC);
  Object.assign(c0, {
    owner: { id: me.id, name: me.name }, expiry: day(END), source: 'upload', upload: { fileName: 'Packaging Film Supply Agreement.docx' },
    fields: { value: '3600000', effDate: day(START) },
    metadata: { value: 3600000, currency: 'SEK', category: 'supplier', contractType: 'supply', renewalType: 'auto-renew', noticePeriodDays: 90, renewalTermMonths: 12,
      governingLaw: 'Swedish law', disputes: 'Arbitration in Stockholm', paymentTerms: '45 days net', liabilityCapped: 'uncapped' },
    obligations: OBS,
    triage: { at: new Date(Date.now() - 864e5).toISOString(), by: 'Jambo', steps: { brief: { ok: true }, playbook: { ok: true }, oblig: { ok: true } } },
    playbook: { at: new Date().toISOString(), standards: 4, checked: 4, verdicts: [{ id: 's1', status: 'aligned' }, { id: 's2', status: 'aligned' }, { id: 's3', status: 'deviation' }, { id: 's4', status: 'missing' }] },
    datedWindows: { ok: true, at: new Date().toISOString(), hash: 'x', windows: [{ from: day(START + 365), to: day(START + 395), label: 'Price review', kind: 'price', rule: '', clause: '2' }] },
  });
  await W.admin.json('/api/contracts/MK-L1', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const c2 = fixtureContract('MK-L2', 'Pallet Hire', 'Mombasa Pallets', FOLDER_A, 600000, 'Draft');
  c2.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-L2', { method: 'PUT', body: { contract: c2, baseVersion: 0 } });
  /* the brief Jambo wrote on arrival, with two watch-outs that need wording (the risks) */
  { const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db')); db.exec('PRAGMA busy_timeout = 5000');
    db.prepare('INSERT OR REPLACE INTO briefs (contract_id, json, created_at) VALUES (?,?,?)').run('MK-L1', JSON.stringify({ v: 1, at: new Date().toISOString(), data: {
      overview: 'Nordfilm supplies packaging film to Highland for two years, and the agreement renews for a year at a time unless either side gives ninety days\' notice.',
      watchouts: [{ title: 'Liability is not capped', point: 'Liability is not capped', quote: 'aggregate liability is unlimited', why: 'Either side could owe without limit.', wording: true },
        { title: 'Prices may move at any time', point: 'Prices may move at any time', quote: 'adjusted at any time', why: 'The price is not held after the first year.', wording: true }], unusual: [] } }), new Date().toISOString());
    db.close(); }
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@nordfilm.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-L1', name: 'Packaging Film Supply Agreement', counterparty: 'Nordfilm Packaging AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  /* the room is never drawn on the way (#ws-tabs, state.view 'workspace') */
  await ctx.addInitScript(() => {
    window._roomSeen = false;
    new MutationObserver(recs => { for (const r of recs) r.addedNodes.forEach(n => { if (n.nodeType === 1 && (n.id === 'ws-tabs' || (n.querySelector && n.querySelector('#ws-tabs')))) window._roomSeen = true; }); })
      .observe(document, { childList: true, subtree: true });
    const tick = () => { try { if (window.state && state.view === 'workspace') window._roomSeen = true; } catch (_) {} requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
  const S = sel => page.evaluate(s => !!document.querySelector(s), sel);
  const strip = id => `#bs-strip-${id}`;
  const roomReset = () => page.evaluate(() => { window._roomSeen = false; });
  const roomSeen = () => page.evaluate(() => !!window._roomSeen || state.view === 'workspace' || !!document.getElementById('ws-tabs'));
  const toBoard = async () => { await page.evaluate(() => { const s = hbS(); s.face = 'board'; hbSave(); setView('dashboard'); if (hbFace() !== 'board') hbSetFace('board'); });
    await waitFor(page, () => !!document.querySelector('#hb-board .hb-note'), 10000); };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-L1'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    /* their round: two asks from their link, so the move is ours */
    const cls = await page.evaluate(async () => { const c = getContract('MK-L1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Our position' }; };
    await h.client('erik').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-L1', at: new Date().toISOString(),
      negoProposed: [ask(/45 days/, '45 days', '30 days'), ask(/at any time/, 'at any time', 'twice a year')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await waitFor(page, () => (getContract('MK-L1').changes || []).length >= 2, 10000);
    /* a light row again, as the list hands it: the strip must ask for the whole record itself */
    await page.reload({ waitUntil: 'networkidle' });
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-L1'), 20000);
    await page.evaluate(() => { const s = hbS(); s.strips = []; hbSave(); });

    /* ===== 1. BRING IT UP ===== */
    await toBoard();
    await roomReset();
    await page.click('#igd-input').catch(() => {});
    const typed = await S('#igd-input');
    if (typed){ await page.fill('#igd-input', ''); await page.type('#igd-input', 'bring up MK-L1', { delay: 8 }); await page.keyboard.press('Enter'); }
    const up1 = await waitFor(page, s => !!document.querySelector(s), 8000, strip('MK-L1'));
    const order = await page.evaluate(() => { const prep = document.querySelector('#hb-board .hb-prep'), st = document.getElementById('bs-strips');
      return { prep: !!prep, after: !!(prep && st && (prep.compareDocumentPosition(st) & Node.DOCUMENT_POSITION_FOLLOWING)), focus: !!document.querySelector('#hb-focus .hb-dig'), face: hbFace(), view: state.view }; });
    check('1a "bring up MK-L1" in Jambo\'s box lands the contract as a strip on the Board, below Today\'s insights; no old card', typed && up1 && order.after && !order.focus && order.face === 'board' && order.view === 'dashboard', JSON.stringify(order));
    const said = await page.evaluate(() => { const m = [...document.querySelectorAll('#ig-dock .igd-msg, #ig-dock [class*="msg"]')].map(x => x.textContent).join(' '); return /strip/i.test(m); });
    check('1b Jambo says where it went (a strip; its ⋯ holds Where we are and History)', said);
    await page.evaluate(() => { document.getElementById('cmd-palette')?.remove(); openCommandPalette(); });
    await waitFor(page, () => !!document.getElementById('cp-input'), 4000);
    await page.type('#cp-input', 'Pallet', { delay: 8 });
    const pressed = await page.evaluate(() => { const i = commandPaletteResults('Pallet').findIndex(r => r.kind === 'contract'); const b = i >= 0 ? document.getElementById('cp-opt-' + i) : null; if (!b) return false; b.click(); return true; });
    const up2 = pressed && await waitFor(page, s => !!document.querySelector(s), 8000, strip('MK-L2'));
    const stack = await page.evaluate(() => [...document.querySelectorAll('#bs-strips > .bs-strip')].map(x => x.getAttribute('data-bs-id')));
    check('1c ⌘K\'s contract row brings it up too, and the newest strip stands first', up2 && JSON.stringify(stack) === JSON.stringify(['MK-L2', 'MK-L1']), JSON.stringify(stack));
    await page.evaluate(() => openWorkspace('MK-L1'));
    await waitFor(page, () => document.querySelector('#bs-strips > .bs-strip') && document.querySelector('#bs-strips > .bs-strip').getAttribute('data-bs-id') === 'MK-L1', 6000);
    const stack2 = await page.evaluate(() => [...document.querySelectorAll('#bs-strips > .bs-strip')].map(x => x.getAttribute('data-bs-id')));
    check('1d the room\'s old door (openWorkspace) brings the strip up instead, to the top, never twice', JSON.stringify(stack2) === JSON.stringify(['MK-L1', 'MK-L2']) && !(await roomSeen()), JSON.stringify(stack2));
    /* the whole record is fetched behind it (the brief rides it) */
    await waitFor(page, () => { const c = getContract('MK-L1'); return !!(c && c._brief) && !!document.querySelector('#bs-strip-MK-L1 .bs-brief') && !document.querySelector('#bs-strip-MK-L1 .bs-brief .ob-spin'); }, 10000);
    await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L1'); const host = document.getElementById('hb-board'); host.scrollTop += el.getBoundingClientRect().top - host.getBoundingClientRect().top - 8; });
    await pause(400);
    await shot('1-strip-1440');

    /* ===== 2. THE SECTIONS AND THE NUMBERS, READ AGAINST THE RECORD ===== */
    const R = await page.evaluate(() => {
      const c = getContract('MK-L1'), el = document.getElementById('bs-strip-MK-L1');
      const t = s => ((el.querySelector(s) || {}).textContent || '').replace(/\s+/g, ' ').trim();
      const kpi = k => { const x = el.querySelector(`[data-bs-kpi="${k}"]`); return x ? { n: x.querySelector('b').textContent.trim(), sub: x.querySelector('span').textContent.trim(), warn: x.classList.contains('is-warn') } : null; };
      const D = bsLifeData(c);
      const ob = bsObRows(c);
      const M = ov2Model(c);
      const ds = dealStands(c), wm = negWhoseMove(c);
      const terms = [...el.querySelectorAll('.bs-dl dt')].map((dt, i) => ({ k: dt.textContent.trim(), v: el.querySelectorAll('.bs-dl dd')[i].textContent.trim(), owed: el.querySelectorAll('.bs-dl dd')[i].classList.contains('is-owed'), amber: el.querySelectorAll('.bs-dl dd')[i].className }));
      const box = el.querySelector('.bs-obs'), rows = [...el.querySelectorAll('.bs-ob tbody tr')];
      const th = el.querySelector('.bs-ob th');
      const svg = el.querySelector('.bs-chart');
      return {
        head: { title: t('.hb-ct'), ref: t('.bs-ref'), pill: t('.bs-head .hb-chip'), dots: !!el.querySelector('[data-bs-dots]'), x: !!el.querySelector('[data-bs-x]') },
        id: t('.bs-idline'), value: kpi('value'), term: kpi('term'), next: kpi('next'), notice: kpi('notice'), move: kpi('move'),
        want: { value: fmtMoneyShortIn(3600000, contractCurrency(c)), from: bsDay(M.start), nextDay: bsDay(ob.next.due), nextWhat: ob.next.what, notice: bsDay(M.noticeBy), round: ds.round, open: ds.open, wm: wm.k,
          ours: ob.ours, theirs: ob.theirs, n: ob.rows.length, risks: riskOpenOf(c).length, brief: triageBriefLine(c._brief), det: detailsOf(c).left, dev: deviationSummary(c) },
        chart: svg ? { w: +svg.getAttribute('width'), term: !!svg.querySelector('.bs-seg-term'), notice: !!svg.querySelector('.bs-seg-notice'), nego: !!svg.querySelector('.bs-seg-nego'),
          today: !!svg.querySelector('.bs-tick.is-today'), dots: svg.querySelectorAll('.bs-occ').length, ours: svg.querySelectorAll('.bs-occ.is-ours').length, theirs: svg.querySelectorAll('.bs-occ.is-theirs').length,
          proj: svg.querySelectorAll('.bs-occ.is-proj').length, labels: [...svg.querySelectorAll('.bs-lab')].map(x => x.textContent), occ: D.life.occ.length } : null,
        legend: t('.bs-lg'), cap: t('.bs-cap'),
        nego: { span: D.life && D.life.nego ? [D.life.nego.a, D.life.nego.b].map(x => x.toISOString().slice(0, 10)) : null,
          from: (c.changes || []).map(ch => ch.createdAt || ch.at || null).concat(((c.negotiation || {}).rounds || []).map(r => r.at || null)) },
        terms,
        obs: { head: t('.bs-two .bs-sec:nth-child(2) h5'), note: t('.bs-two .bs-sec:nth-child(2) .bs-note'), rows: rows.length, next: rows.findIndex(r => r.classList.contains('is-next')), nextTxt: rows[0] ? rows[0].textContent.replace(/\s+/g, ' ') : '',
          h: box ? box.clientHeight : 0, sh: box ? box.scrollHeight : 0, rowH: rows[1] ? rows[1].getBoundingClientRect().height : 0, sticky: th ? getComputedStyle(th).position : '' },
        jb: { brief: t('.bs-brief'), note: t('.bs-jb .bs-note'), risks: t('[data-bs-jcell="risks"] b'), riskItems: [...el.querySelectorAll('[data-bs-jcell="risks"] li')].map(x => x.textContent),
          std: t('[data-bs-jcell="std"] b'), stdItems: t('[data-bs-jcell="std"] ul'), det: t('[data-bs-jcell="det"] b'), ob: t('[data-bs-jcell="ob"] b'),
          doors: [...el.querySelectorAll('.bs-jb [data-bs-go]')].map(b => b.getAttribute('data-bs-go')) },
        foot: [...el.querySelectorAll('.bs-foot button')].map(b => b.textContent.trim()),
        tall: el.getBoundingClientRect().height,
      };
    });
    check('2a the head: title · ref · counterparty · stage · ⋯ · ×', R.head.title === 'Packaging Film Supply Agreement' && /MK-L1 · Nordfilm Packaging AB/.test(R.head.ref) && R.head.pill === 'In Review' && R.head.dots && R.head.x, JSON.stringify(R.head));
    check('2b who it is with: the counterparty\'s role, the type, the stream, the owner, uploaded', /Nordfilm Packaging AB is the supplier/.test(R.id) && /owned by/.test(R.id) && /uploaded/.test(R.id), R.id);
    check('2c Value is the record\'s, in its own currency, with what it comes to a year over the term', R.value && R.value.n === R.want.value && /a year/.test(R.value.sub), JSON.stringify(R.value) + ' want ' + R.want.value);
    check('2d Term: two years, from the start date on the record', R.term && R.term.n === '2 years' && R.term.sub === 'From ' + R.want.from, JSON.stringify(R.term));
    check('2e Next obligation: the first open one by its day (late: amber), with what and whose', R.next && R.next.n === R.want.nextDay && R.next.sub.startsWith(R.want.nextWhat) && R.next.warn, JSON.stringify(R.next) + ' want ' + R.want.nextDay);
    check('2f Notice by: ninety days before the end, and that it renews for twelve months', R.notice && R.notice.n === R.want.notice && /renews 12 months/.test(R.notice.sub), JSON.stringify(R.notice));
    check('2g Whose move: yours (amber), the round and what is open — dealStands and negWhoseMove', R.move && R.want.wm === 'you' && R.move.n === 'Yours' && R.move.warn && R.move.sub === `Round ${R.want.round} · ${R.want.open} open`, JSON.stringify(R.move) + ' ' + JSON.stringify({ r: R.want.round, o: R.want.open }));
    check('2h the life line: the term, the notice window, the negotiation and today, drawn at the card\'s width', R.chart && R.chart.term && R.chart.notice && R.chart.nego && R.chart.today && R.chart.w > 600, JSON.stringify(R.chart && { w: R.chart.w, term: R.chart.term, notice: R.chart.notice, nego: R.chart.nego, today: R.chart.today, span: R.nego }));
    check('2i the obligations are dots, ours and theirs, a yearly repeat drawn as a ring (projected, never stored), every one the record holds drawn', R.chart && R.chart.dots >= 12 && R.chart.ours > 0 && R.chart.theirs > 0 && R.chart.proj >= 1 && R.chart.dots === R.chart.occ, JSON.stringify({ dots: R.chart && R.chart.dots, occ: R.chart && R.chart.occ, proj: R.chart && R.chart.proj }));
    check('2j the marks are named: today, starts, the price review, notice by, ends', R.chart && ['Today', 'Starts', 'Price review', 'Notice by', 'Ends'].every(w => R.chart.labels.some(l => l.indexOf(w) === 0)), JSON.stringify(R.chart && R.chart.labels));
    check('2k the legend counts each side\'s obligations, as the table does', R.legend.includes(`Our obligations (${R.want.ours})`) && R.legend.includes(`Their obligations (${R.want.theirs})`), R.legend);
    check('2l one caption: the term, the renewal and the next obligation', /^It runs from .* If neither side gives notice by .* it renews for 12 months\. Next up: /.test(R.cap), R.cap);
    const tv = k => (R.terms.find(x => x.k === k) || {});
    check('2m Key terms: our side, signers (none named: amber), law, disputes, renewal, payment, liability cap (uncapped: amber)',
      tv('Our side').v && tv('Signers').owed && tv('Governing law').v === 'Swedish law' && tv('Disputes').v === 'Arbitration in Stockholm' && /Auto-renew/i.test(tv('Renewal').v || '') && tv('Payment terms').v === '45 days net' && /is-amber/.test(tv('Liability capped').amber || ''),
      JSON.stringify(R.terms.map(x => x.k + '=' + x.v)));
    check('2n Obligations (N), "ours · theirs · next first" — never "duties"', R.obs.head === `Obligations (${R.want.n})` && R.obs.note === `${R.want.ours} ours · ${R.want.theirs} theirs · next first` && !/dut/i.test(R.obs.head + R.obs.note), JSON.stringify({ head: R.obs.head, note: R.obs.note }));
    check('2o the table scrolls in its own box (about seven rows, sticky head), the card does not grow with it; the next one marked first',
      R.obs.rows === R.want.n && R.obs.sh > R.obs.h + 10 && R.obs.h <= 7 * Math.max(R.obs.rowH, 30) + 60 && R.obs.sticky === 'sticky' && R.obs.next === 0 && R.obs.nextTxt.includes(R.want.nextWhat), JSON.stringify(R.obs));
    check('2p what Jambo read: the brief\'s first sentence, read on arrival from the file', R.jb.brief === R.want.brief && /Packaging Film Supply Agreement\.docx/.test(R.jb.note), JSON.stringify({ brief: R.jb.brief, note: R.jb.note }));
    check('2q risks found: the one count (riskOpenOf) and their titles; standards met / missing / differs; details; obligations found',
      R.jb.risks === String(R.want.risks) && R.want.risks === 2 && R.jb.riskItems.includes('Liability is not capped') && R.jb.std === '2 of 4 met' && /1 missing/.test(R.jb.stdItems) && /1 differs/.test(R.jb.stdItems)
      && R.jb.det === String(R.want.det) && R.jb.ob === String(R.want.n), JSON.stringify(R.jb));
    check('2r every cell carries its door into Home', ['risks', 'std', 'oblig'].every(k => R.jb.doors.includes(k)) && (R.want.det ? R.jb.doors.includes('fill') : true), JSON.stringify(R.jb.doors));
    check('2s the foot: Open · Keep · Ask why · Let it go, as the insight panels', JSON.stringify(R.foot) === JSON.stringify(['Open', 'Keep', 'Ask why', 'Let it go']), JSON.stringify(R.foot));
    /* the doors land where they say, nothing spent */
    await page.click(`${strip('MK-L1')} [data-bs-go="oblig"]`);
    /* RE-POINTED 15 Oct 2026 (owner: the contract's views went; "obligations has its own panel") */
    const ob = await waitFor(page, () => state.view === 'obligations' && !!document.querySelector('#obw-one-host[data-ins-cid="MK-L1"]'), 6000);
    check('2t "Review the obligations ›" opens the Obligations page narrowed to it', ob);
    await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); });
    await waitFor(page, () => hbFace() === 'board' && !!document.querySelector('#bs-strip-MK-L1'), 6000);
    await page.click(`${strip('MK-L1')} [data-bs-open]`);
    const opened = await waitFor(page, () => state.view === 'dashboard' && hbFace() === 'paper' && window.intel && intel.paper && intel.paper.id === 'MK-L1', 6000);
    check('2u Open puts it on Home\'s paper (the Workspace doors\' one landing)', opened && !(await roomSeen()));
    await toBoard();

    /* ===== 3. ⋯: WHERE WE ARE AND HISTORY ===== */
    const M = sel => `${strip('MK-L1')} ${sel}`;
    await page.click(M('[data-bs-dots]'));
    let menu = await page.evaluate(() => [...document.querySelectorAll('#bs-strip-MK-L1 .bs-menu [data-bs-page] b')].map(x => x.textContent.trim()));
    check('3a ⋯ opens a menu: Where we are, History, Details', JSON.stringify(menu) === JSON.stringify(['Where we are', 'History', 'Details']), JSON.stringify(menu));
    await page.click(M('[data-bs-dots]'));
    check('3b pressing ⋯ again closes it', !(await S(M('.bs-menu'))));
    await page.click(M('[data-bs-dots]')); await page.keyboard.press('Escape');
    const esc1 = !(await S(M('.bs-menu')));
    await page.click(M('[data-bs-dots]')); await page.click(M('.bs-idline'));
    check('3c Esc closes it, and so does a press outside', esc1 && !(await S(M('.bs-menu'))));
    await page.click(M('[data-bs-dots]')); await page.click(M('.bs-menu [data-bs-page="where"]'));
    const ww = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 [data-bs-host="where"] .ds-sheet'), 6000);
    const W1 = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L1'); const host = el.querySelector('[data-bs-host="where"]');
      return { crumb: (el.querySelector('.bs-crumbs') || {}).textContent || '', same: host.querySelector('.ds-sheet').outerHTML.length > 0 && host.innerHTML.includes(standsHtml(getContract('MK-L1'), {}).slice(0, 40)),
        acts: !!host.querySelector('[data-ds-go="history"]') }; });
    check('3d Where we are opens inside the same strip, the one builder (standsHtml), "‹ Overview" beside the title', ww && /Overview/.test(W1.crumb) && /Where we are/.test(W1.crumb) && W1.same, JSON.stringify(W1));
    await shot('3-where-we-are');
    await page.click(M('[data-bs-dots]'));
    menu = await page.evaluate(() => [...document.querySelectorAll('#bs-strip-MK-L1 .bs-menu [data-bs-page] b')].map(x => x.textContent.trim()));
    check('3e away from it, ⋯ lists Overview too', JSON.stringify(menu) === JSON.stringify(['Overview', 'Where we are', 'History', 'Details']), JSON.stringify(menu));
    await page.click(M('.bs-menu [data-bs-page="hist"]'));
    const hs = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 [data-bs-host="hist"] .hist-trail'), 8000);
    const H1 = await page.evaluate(() => { const host = document.querySelector('#bs-strip-MK-L1 [data-bs-host="hist"]');
      const tr = host.querySelector('.hist-trail');
      return { q: !!host.querySelector('#hist-q'), side: [...host.querySelectorAll('.hist-side [data-ht-side]')].map(b => b.textContent.trim()), sideSel: !!host.querySelector('[data-ht-filter="side"]'),
        filter: !!host.querySelector('#hist-filter-btn'), wording: (host.querySelector('#hist-detail') || {}).textContent, n: host.querySelectorAll('.hist-ev').length,
        scroll: tr ? getComputedStyle(tr).overflowY : '', maxH: tr ? parseFloat(getComputedStyle(tr).maxHeight) : 0, more: !!host.querySelector('#hist-more-menu #ht-verify') }; });
    check('3f History opens in the strip: search, Side in the open as All sides · Ours · Theirs (no Side box in the fold), Filter, Show the wording',
      hs && H1.q && JSON.stringify(H1.side) === JSON.stringify(['All sides', 'Ours', 'Theirs']) && !H1.sideSel && H1.filter && /Show the wording/.test(H1.wording || ''), JSON.stringify(H1));
    check('3g the trail scrolls inside the card, and ⋯ More keeps Verify integrity', H1.scroll === 'auto' && H1.maxH > 0 && H1.maxH <= 480 && H1.more, JSON.stringify({ scroll: H1.scroll, maxH: H1.maxH, more: H1.more }));
    await page.click(M('.hist-side [data-ht-side="counterparty"]'));
    await pause(300);
    const H2 = await page.evaluate(() => { const host = document.querySelector('#bs-strip-MK-L1 [data-bs-host="hist"]');
      const evs = roomHistoryEvents(getContract('MK-L1'), { side: 'counterparty' });
      return { n: host.querySelectorAll('.hist-ev').length, want: evs.length, pressed: (host.querySelector('[data-ht-side][aria-pressed="true"]') || {}).textContent, cap: (host.querySelector('.hist-cap') || {}).textContent }; });
    check('3h Theirs keeps only their moves (the trail\'s own side filter), the switch says so', H2.pressed === 'Theirs' && H2.n === H2.want && H2.n > 0 && H2.n < H1.n, JSON.stringify(H2) + ' of ' + H1.n);
    await page.click(M('#hist-detail'));
    await pause(300);
    const H3 = await page.evaluate(() => { const host = document.querySelector('#bs-strip-MK-L1 [data-bs-host="hist"]');
      return { red: host.querySelectorAll('.hist-redline').length, btn: (host.querySelector('#hist-detail') || {}).textContent, side: (host.querySelector('[data-ht-side][aria-pressed="true"]') || {}).textContent }; });
    check('3i Show the wording puts each proposal\'s words under it, the side kept', H3.red >= 1 && /Hide the wording/.test(H3.btn) && H3.side === 'Theirs', JSON.stringify(H3));
    await shot('3-history-theirs-wording');
    await page.click(M('.hist-side [data-ht-side=""]'));
    await page.click(M('#hist-detail'));
    await page.click(M('.bs-crumbs [data-bs-page="ov"]'));
    check('3j "‹ Overview" takes the strip back to its chart', await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 .bs-chart'), 5000));

    /* ===== 4. × · KEEP · LET IT GO ===== */
    await page.click(`${strip('MK-L1')} [data-bs-keep]`);
    const kept = await waitFor(page, () => { const b = document.querySelector('#bs-strip-MK-L1 [data-bs-keep]'); return b && b.disabled && /Kept/.test(b.textContent) && hbS().strips.find(x => x.id === 'MK-L1').kept; }, 4000);
    const toastSaid = await page.evaluate(() => /stays on your Board/.test(document.body.innerText));
    check('4a Keep keeps it (greyed "Kept", said once in a toast)', kept && toastSaid);
    await page.click(`${strip('MK-L2')} [data-bs-x]`);
    check('4b × closes that one strip, the other stands', await waitFor(page, () => !document.getElementById('bs-strip-MK-L2') && !!document.getElementById('bs-strip-MK-L1'), 4000));
    await page.evaluate(() => hbStripBring('MK-L2'));
    await waitFor(page, s => !!document.querySelector(s), 4000, strip('MK-L2'));
    await page.click(`${strip('MK-L2')} [data-bs-letgo]`);
    check('4c Let it go takes it off the Board', await waitFor(page, () => !document.getElementById('bs-strip-MK-L2') && !hbS().strips.some(x => x.id === 'MK-L2'), 4000));

    /* ===== 5. A REFRESH ===== */
    await page.evaluate(() => { hbStripBring('MK-L2', 'where'); });
    await waitFor(page, s => !!document.querySelector(s), 4000, `${strip('MK-L2')} [data-bs-host="where"]`);
    await page.reload({ waitUntil: 'networkidle' });
    await waitFor(page, () => window.state && state.contracts && state.contracts.length > 0, 15000);
    const back = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L2 [data-bs-host="where"] .ds-sheet') && !!document.querySelector('#bs-strip-MK-L1 .bs-chart'), 10000);
    check('5a a refresh comes back to the same strips on the same pages', back);
    /* the list is light again: every restored strip asks for the whole record itself, so the brief comes back and the ring stops */
    const briefBack = await waitFor(page, () => { const b = document.querySelector('#bs-strip-MK-L1 .bs-brief'); return !!b && !b.querySelector('.ob-spin') && /Nordfilm supplies packaging film/.test(b.textContent); }, 12000);
    const rb = await page.evaluate(() => { const c = getContract('MK-L1'), b = document.querySelector('#bs-strip-MK-L1 .bs-brief'); return { loaded: !!c._loaded, spin: !!(b && b.querySelector('.ob-spin')), brief: b ? b.textContent.trim().slice(0, 60) : null }; });
    check('5b after the refresh the restored strip reads the whole record: its brief comes back, the waiting ring stops', briefBack && rb.loaded && !rb.spin, JSON.stringify(rb));

    /* ===== 6. DETAILS: THE OVERVIEW'S OWN SHEET, IN THE STRIP ===== */
    await page.click(`${strip('MK-L1')} .bs-sec-h [data-bs-page="details"]`);
    const det = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 [data-bs-host="details"] #kt-ov-terms #ov-ess'), 8000);
    check('6a Key terms\' Edit opens the Overview\'s own sheet inside the strip (its Edit, its parties, its renewal)', det && !(await roomSeen()));
    await page.evaluate(() => pdOpenOnHome('MK-L1', 'copilot'));
    /* RE-POINTED 15 Oct 2026 (owner, answer B): the paper's ⋯ went; its rows are the panel's Menu tab */
    await waitFor(page, () => !!document.querySelector('#ig-dock [data-pd-tab="menu"]'), 8000);
    await roomReset();
    await page.evaluate(() => document.querySelector('#ig-dock [data-pd-tab="menu"]').click());
    await waitFor(page, () => !!document.querySelector('#pd-body .pd-menu .pd-mn-rows #ws-filing'), 4000);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#pd-body .pd-menu .pd-mn-rows button')].map(b => b.id));
    check('6b the Menu tab carries the room\'s own acts: Start negotiating or Add signers, Create an amendment, Add a signed document',
      rows.includes('ws-m-signers') && rows.includes('ws-m-amend') && rows.includes('ws-m-link') && rows.includes('ws-filing'), rows.join(' '));
    await page.evaluate(() => { const b = document.querySelector('#pd-body .pd-menu .pd-mn-rows #ws-filing'); b.closest('details').open = true; b.click(); });
    const filing = await waitFor(page, () => state.view === 'dashboard' && hbFace() === 'board' && !!document.querySelector('#bs-strip-MK-L1 [data-bs-host="details"] #ov-record'), 8000);
    check('6c "Filing and stream" lands on the filing rows in the strip, never the room', filing && !(await roomSeen()));

    /* ===== 10. THE CHECKERS' ROUND (15 Oct 2026) ===== */
    /* 10a Details follows the record: a save elsewhere is read on the next paint */
    const lawWas = await page.evaluate(() => (getContract('MK-L1').metadata || {}).governingLaw);
    /* (the reader is not typing in it: a box with the cursor is never drawn under their hands) */
    await page.evaluate(async () => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const c = getContract('MK-L1'); c.metadata = Object.assign({}, c.metadata, { governingLaw: 'Kenyan law' }); persist(c); await flushSaves(); renderWorkspace(); });
    const fresh = await waitFor(page, () => /Kenyan law/.test((document.querySelector('#bs-strip-MK-L1 [data-bs-host="details"] #ov-ess') || {}).textContent || ''), 6000);
    check('10a the strip\'s Details follows the record: a save made elsewhere is read on the next paint, not after leaving Home', fresh);
    await page.evaluate(async law => { const c = getContract('MK-L1'); c.metadata = Object.assign({}, c.metadata, { governingLaw: law }); persist(c); await flushSaves(); renderWorkspace(); }, lawWas);
    /* 10b Write the brief on the strip's Details: an open brief, and a second press costs nothing */
    await page.evaluate(() => { window.__rcb = window.runContractBrief; window.__briefCalls = [];
      window.runContractBrief = async (c, o) => { window.__briefCalls.push(!!(o && o.force)); c._brief = { v: 1, at: new Date().toISOString(), data: { overview: 'Mombasa Pallets hires pallets to Highland by the month.', watchouts: [], unusual: [] } }; return c._brief; };
      hbStripBring('MK-L2', 'details'); });
    const btn0 = await waitFor(page, () => { const c = getContract('MK-L2'); return !!(c && (c._loaded || !c._light)) && !!document.querySelector('#bs-strip-MK-L2 [data-bs-host="details"] [data-kt-brief="run"]'); }, 8000);
    if (btn0) await page.click('#bs-strip-MK-L2 [data-bs-host="details"] [data-kt-brief="run"]');
    const opened1 = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L2 [data-bs-host="details"] [data-kt-brief="open"]'), 6000);
    const pan = await page.evaluate(() => !!document.querySelector('#brief-section'));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    const b2 = await page.$('#bs-strip-MK-L2 [data-bs-host="details"] [data-kt-brief]');
    if (b2) await b2.click();
    await pause(500);
    const calls = await page.evaluate(() => window.__briefCalls.slice());
    check('10b Write the brief on the strip\'s Details lands as an open brief (Read the brief, its panel open); a second press opens it and pays nothing',
      btn0 && opened1 && pan && JSON.stringify(calls) === '[false]', JSON.stringify({ btn0, opened1, pan, calls }));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} bsStripPage('MK-L2', 'ov'); });
    const band = await waitFor(page, () => /Mombasa Pallets hires pallets/.test((document.querySelector('#bs-strip-MK-L2 .bs-brief') || {}).textContent || ''), 5000);
    check('10c the strip\'s own band then reads the brief written there', band);
    /* 10l READ THE BRIEF beside what Jambo read (owner, 15 Oct 2026): over a brief on file, it opens THAT
       contract's brief — two strips standing, each its own — spends nothing, and pressed again shuts it */
    await page.evaluate(() => bsStripPage('MK-L1', 'ov'));
    const rbBoth = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 .bs-jb .bs-sec-h [data-bs-go="brief"]') && !!document.querySelector('#bs-strip-MK-L2 .bs-jb .bs-sec-h [data-bs-go="brief"]'), 6000);
    const aiR = h.ai.calls.length;
    const briefShows = src => waitFor(page, src => { const b = document.querySelector('#side-panel #brief-section'); if (!b) return false;
      const t = b.cloneNode(true); t.querySelectorAll('style').forEach(x => x.remove()); return new RegExp(src).test(t.textContent); }, 6000, src);
    let rb1 = false, rb2 = false, shut = false;
    if (rbBoth){
      await page.click('#bs-strip-MK-L2 .bs-jb .bs-sec-h [data-bs-go="brief"]');
      rb2 = await briefShows('Mombasa Pallets hires pallets');
      /* the other strip's button moves the panel to ITS brief; pressed again, it shuts */
      await page.click('#bs-strip-MK-L1 .bs-jb .bs-sec-h [data-bs-go="brief"]', { timeout: 4000 }).catch(() => {});
      rb1 = await briefShows('Nordfilm supplies packaging film');
      await page.click('#bs-strip-MK-L1 .bs-jb .bs-sec-h [data-bs-go="brief"]', { timeout: 4000 }).catch(() => {});
      shut = await waitFor(page, () => !document.querySelector('#side-panel #brief-section'), 4000);
    }
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    check('10l "Read the brief" sits beside the title of What Jambo read, clear of the panel it opens; it opens that contract\'s own brief (two strips, each its own), asks no model, and pressed again shuts it',
      rbBoth && rb1 && rb2 && shut && h.ai.calls.length === aiR, JSON.stringify({ rbBoth, rb1, rb2, shut, ai: h.ai.calls.length - aiR }));
    await page.evaluate(() => { window.runContractBrief = window.__rcb; });
    /* 10d See the standards: the stored reading, read only — no check run, nothing written */
    let pbCalls = 0;
    await page.route('**/api/ai/playbook*', r => { pbCalls++; r.continue(); });
    const audit0 = await page.evaluate(() => (getContract('MK-L1').audit || []).length);
    await page.evaluate(() => bsStripPage('MK-L1', 'ov'));
    await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 [data-bs-go="std"]'), 6000);
    await page.click('#bs-strip-MK-L1 [data-bs-go="std"]');
    const stdPanel = await waitFor(page, () => { const p = document.getElementById('playbook-section'); return !!p && p.textContent.trim().length > 20; }, 6000);
    await pause(600);
    const audit1 = await page.evaluate(() => (getContract('MK-L1').audit || []).length);
    check('10d "See the standards ›" opens the stored standards reading, spends nothing and writes nothing', stdPanel && pbCalls === 0 && audit1 === audit0, JSON.stringify({ stdPanel, pbCalls, audit0, audit1 }));
    await page.unroute('**/api/ai/playbook*');
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    /* 10e "bring up" read on the paper face too, before any model */
    await page.evaluate(() => { bsStripClose('MK-L2'); pdOpenOnHome('MK-L1', 'copilot'); });
    await waitFor(page, () => hbFace() === 'paper' && !!document.getElementById('igd-input'), 8000);
    const ai0 = h.ai.calls.length;
    await page.fill('#igd-input', 'bring up MK-L2'); await page.keyboard.press('Enter');
    const upP = await waitFor(page, () => hbFace() === 'board' && !!document.querySelector('#bs-strips > .bs-strip') && document.querySelector('#bs-strips > .bs-strip').getAttribute('data-bs-id') === 'MK-L2', 8000);
    await pause(500);
    check('10e "bring up MK-L2" typed on the paper face brings its strip up on the Board, and asks no model', upP && h.ai.calls.length === ai0, JSON.stringify({ upP, ai: h.ai.calls.length - ai0 }));
    /* 10f the room by name is for the visit that named it */
    await roomReset();
    await page.evaluate(() => { openWorkspace('MK-L1', { room: true }); });
    await waitFor(page, () => state.view === 'workspace', 6000);
    await page.evaluate(() => { setView('dashboard'); state.activeId = 'MK-L1'; setView('workspace'); });
    const forgot = await waitFor(page, () => state.view === 'dashboard' && document.querySelector('#bs-strips > .bs-strip') && document.querySelector('#bs-strips > .bs-strip').getAttribute('data-bs-id') === 'MK-L1', 6000);
    check('10f once the room opened by name is left, a later door to that contract opens its strip, not the room', forgot);
    /* 10g a signed contract: who signed, its value as amended, no repeat past its fixed end */
    await page.evaluate(() => hbStripBring('MK-L3'));
    await waitFor(page, () => { const c = getContract('MK-L3'); return !!(c && (c._loaded || !c._light)) && !!document.querySelector('#bs-strip-MK-L3 .bs-chart'); }, 8000);
    await pause(300);
    const L3 = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L3'), c = getContract('MK-L3'), M = ov2Model(c), D = bsLifeData(c);
      const dd = [...el.querySelectorAll('.bs-dl dt')].map((dt, i) => [dt.textContent.trim(), el.querySelectorAll('.bs-dl dd')[i].textContent.trim()]);
      return { signers: (dd.find(x => x[0] === 'Signers') || [])[1], value: el.querySelector('[data-bs-kpi="value"] b').textContent.trim(), sub: el.querySelector('[data-bs-kpi="value"] span').textContent.trim(),
        want: fmtMoneyShortIn(450000, contractCurrency(c)), past: D.life.occ.filter(x => x.due > M.end).length, dots: el.querySelectorAll('.bs-occ').length, occ: D.life.occ.length }; });
    check('10g a signed contract with no signer plan names who signed, off its signatures', L3.signers === 'Amina Otieno · Bob Zeta', JSON.stringify(L3.signers));
    check('10h Value reads the deal as amended (a signed amendment set it) and says so', L3.value === L3.want && /As amended by MK-L3-A1/.test(L3.sub), JSON.stringify({ v: L3.value, sub: L3.sub, want: L3.want }));
    check('10i a fixed term draws no projected repeat past its end; every occurrence kept is drawn', L3.past === 0 && L3.dots === L3.occ && L3.dots > 1, JSON.stringify(L3));
    /* 10j a draft with an end but no start: the owed start amber; an undated obligation said; a far one drawn */
    await page.evaluate(() => hbStripBring('MK-L4'));
    await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L4 .bs-chart'), 8000);
    const L4 = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L4'), k = el.querySelector('[data-bs-kpi="term"]');
      const far = [...el.querySelectorAll('.bs-occ title')].map(t => t.textContent);
      return { warn: k.classList.contains('is-warn'), term: k.textContent.replace(/\s+/g, ' ').trim(), owed: detailsOf(getContract('MK-L4')).items.filter(x => x.open).map(x => x.key),
        cap: el.querySelector('.bs-cap').textContent, far, legend: el.querySelector('.bs-lg').textContent }; });
    check('10j a start date owed before signing is amber on the Term figure, and says so', L4.owed.includes('effDate') && L4.warn && /start date needed before signing/.test(L4.term), JSON.stringify(L4));
    check('10k an obligation with no due date is said under the line; one due far past the term is drawn, the line runs to it',
      /1 obligation has no due date, so it is not on the line/.test(L4.cap) && L4.far.some(t => /Hand over the archive/.test(t)), JSON.stringify({ cap: L4.cap, far: L4.far }));
    const noBrief = await page.evaluate(() => !getContract('MK-L4')._brief && !!document.querySelector('#bs-strip-MK-L4 .bs-brief') && !document.querySelector('#bs-strip-MK-L4 [data-bs-go="brief"]'));
    check('10m with no brief on file the strip draws no "Read the brief" (writing one stays on Details)', noBrief);
    await page.evaluate(() => { bsStripClose('MK-L3'); bsStripClose('MK-L4'); });

    /* ===== 7. THE ROOM RETIRES ===== */
    await roomReset();
    await page.evaluate(() => roomGoTab(getContract('MK-L2'), 'stands'));
    const st = await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L2 [data-bs-host="where"]') && document.querySelector('#bs-strips > .bs-strip').getAttribute('data-bs-id') === 'MK-L2', 6000);
    check('7a a door that named Where we are opens the strip on Where we are', st && !(await roomSeen()));
    await roomReset();
    await page.goto(`${h.base}/?n=1#contract=MK-L1`, { waitUntil: 'networkidle' });
    const link = await waitFor(page, () => window.state && state.view === 'dashboard' && !/contract=/.test(location.hash) && document.querySelector('#bs-strips > .bs-strip') && document.querySelector('#bs-strips > .bs-strip').getAttribute('data-bs-id') === 'MK-L1', 15000);
    check('7b an email link with no tab opens the strip, the room never drawn', link && !(await roomSeen()));
    await page.evaluate(() => openWorkspace('MK-L1', { room: true }));
    const byName = await waitFor(page, () => state.view === 'workspace' && !!document.getElementById('ws-tabs'), 8000);
    check('7c the room is still drawn by name (openWorkspace(id, { room: true })), for the checks that test its insides', byName);
    await roomReset();
    await page.reload({ waitUntil: 'networkidle' });
    await waitFor(page, () => window.state && state.contracts && state.contracts.length > 0, 15000);
    const rf = await waitFor(page, () => state.view === 'dashboard' && !!document.getElementById('bs-strip-MK-L1'), 10000);
    check('7d a refresh standing on the room opens the strip instead', rf && !(await page.evaluate(() => state.view === 'workspace' || !!document.getElementById('ws-tabs'))));

    /* ===== 8. SVENSKA ===== */
    await toBoard();
    await page.evaluate(() => { const s = hbS(); s.strips.forEach(x => { x.page = 'ov'; }); hbSave(); });
    const sv = await page.$('.lang-btn[data-lang="sv"]'); if (sv) await sv.click();
    await waitFor(page, () => (typeof langId === 'function') && langId() === 'sv', 6000);
    await toBoard();
    await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 .bs-chart'), 8000);
    const SV = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L1'); return { life: (el.querySelector('.bs-life h5') || {}).textContent, terms: (el.querySelector('.bs-two h5') || {}).textContent,
      kpis: [...el.querySelectorAll('.bs-kpi small')].map(x => x.textContent), foot: [...el.querySelectorAll('.bs-foot button')].map(b => b.textContent.trim()), jb: (el.querySelector('.bs-jb h5') || {}).textContent }; });
    check('8a the strip reads in Svenska', SV.life === 'Avtalets liv' && SV.terms === 'Huvudvillkor' && JSON.stringify(SV.kpis) === JSON.stringify(['Värde', 'Löptid', 'Nästa åtagande', 'Säg upp senast', 'Vems drag'])
      && JSON.stringify(SV.foot) === JSON.stringify(['Öppna', 'Behållen', 'Fråga varför', 'Släpp den']) && SV.jb === 'Vad Jambo läste vid uppladdningen', JSON.stringify(SV));
    await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L1'); const host = document.getElementById('hb-board'); host.scrollTop += el.getBoundingClientRect().top - host.getBoundingClientRect().top - 8; });
    await shot('8-svenska');
    const en2 = await page.$('.lang-btn[data-lang="en"]'); if (en2) await en2.click();
    await waitFor(page, () => langId() === 'en', 6000);

    /* ===== 9. THE OWNER'S THREE SCREENS ===== */
    for (const [w, hgt] of SCREENS){
      await page.setViewportSize({ width: w, height: hgt });
      await toBoard();
      await waitFor(page, () => !!document.querySelector('#bs-strip-MK-L1 .bs-chart'), 8000);
      await pause(500);
      const F = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L1'), host = document.getElementById('hb-board');
        const svg = el.querySelector('.bs-chart'), box = svg.parentElement;
        const k = [...el.querySelectorAll('.bs-kpi b')];
        return { side: el.scrollWidth <= el.clientWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1, kpiOne: k.every(b => b.getBoundingClientRect().height < 34),
          svgFits: svg.getBoundingClientRect().width <= box.clientWidth + 1, svgW: +svg.getAttribute('width'), boxW: box.clientWidth, host: host.clientWidth }; });
      check(`9 ${w}×${hgt}: nothing scrolls sideways, the figures on one line, the life line drawn for the card`, F.side && F.kpiOne && F.svgFits, JSON.stringify(F));
      await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-L1'); const host = document.getElementById('hb-board'); host.scrollTop += el.getBoundingClientRect().top - host.getBoundingClientRect().top - 8; });
      await pause(300);
      await shot(`9-strip-${w}x${hgt}`);
      await page.evaluate(() => { const host = document.getElementById('hb-board'); host.scrollTop += 560; });
      await pause(200);
      await shot(`9-strip-${w}x${hgt}-lower`);
    }
    /* the phone keeps its own contract screens */
    await page.setViewportSize({ width: 390, height: 844 });
    await pause(600);
    await page.evaluate(() => openWorkspace('MK-L1'));
    await pause(1200);
    const phone = await page.evaluate(() => ({ view: state.view, strip: !!document.querySelector('#bs-strip-MK-L1:not([hidden])') && state.view === 'dashboard' }));
    check('9d the phone keeps its own contract screen (no strip there)', phone.view === 'workspace' && !phone.strip, JSON.stringify(phone));
  } catch (e) {
    check('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    console.log(`\n${pass}/${pass + fail} passed`);
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    process.exit(fail ? 1 : 0);
  }
})();
