/* RISKS TO LOOK AT — THE RISK SCAN LIVES IN THE REDLINES CARD
   ============================================================
   Young picked "A pile to look at" and "Read in place" by name on 4 Oct 2026,
   ruled the separate Risk scan panel away, and swapped the Overview's "Filed"
   tile for "Risks found". Driven where the reader stands:
     1. the Negotiate page's Redlines column lists the risks, worst first, and
        the standards button now says "Draft from our standards";
     2. Risk View offers only "Add a note" (one door for edits, work order
        Part 8, 4 Oct 2026); "Edit with Copilot" on the row opens the clause
        editor on that clause with Copilot's wording in the box — read first;
     3. its Save files an UNSENT change through the funnel, the risk leaves
        the list, and the row says "from the risk scan" on our seat;
     4. a missing clause no clause carries becomes a NEW clause, held in the
        same window where it will go, with a heading the reader can change
        (Young chose to build it, 5 Oct 2026);
     5. Dismiss / Show dismissed / Bring back, one list everywhere;
     6. with no Copilot key the window says so and the reader writes in the
        box — never silent;
     7. every door that opened the old panel (the Checks row, the head icon)
        now lands on Risk View; the Overview tile reads "Risks found";
     8. nothing travels: the share payload carries no `risks`, nothing was sent.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/risks-in-the-redlines-card/.
   Run: node test/chromium/risks-in-the-redlines-card-verify.js */
/* RE-POINTED 7 Oct 2026 (Young, "Risk Walk Options" — One footer): on the risk
   walk the Suggested wording's Apply is the feet's top row, #ce-rksug. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_DIR || path.join(__dirname, 'shots', 'risks-in-the-redlines-card');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 6000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};
const press = (page, sel) => page.evaluate(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);

const PAY = 'The Buyer shall pay each undisputed invoice within 60 days of receipt of the invoice.';
const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the agreed specification and quality.</p>'
  + `<h2>2. Payment</h2><p>${PAY}</p>`
  + '<h2>3. Confidentiality</h2><p>Each party shall keep the other party\'s information confidential.</p>'
  + '<h2>4. Governing law</h2><p>This Agreement is governed by the laws of Sweden.</p>';
const SCAN = { at: '4 Oct 2026, 17:19', on: '2026-10-04', lang: 'en', dismissed: [], findings: [
  { id: 't-inj', sev: 'low', kind: 'missing', title: 'No injunctive-relief clause', anchor: 'doc',
    what: 'The agreement is silent on equitable remedies.',
    why: 'Damages arrive too late for a confidentiality breach.',
    fix: 'Add wording acknowledging irreparable harm and permitting interim injunctions.' },
  { id: 't-pay', sev: 'med', kind: 'risk', title: 'Payment terms: 60 days', anchor: 'doc', quote: PAY,
    what: 'Invoices are paid at 60 days.', why: 'Long terms strain working capital.', fix: 'Negotiate toward 30–45 days.' },
  { id: 't-ass', sev: 'high', kind: 'risk', title: 'Assignment not restricted', anchor: 'doc',
    what: 'Either party may assign freely.', why: 'You could end up contracting with a stranger.', fix: 'Require consent.' },
] };
const PAY_NEW = 'The Buyer shall pay each undisputed invoice within forty-five (45) days of receipt of the invoice.';
const INJ_NEW = 'Each party acknowledges that a breach of clause 3 may cause irreparable harm, and the affected party may seek interim injunctive relief.';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-RK1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  /* RE-POINTED 6 Oct 2026 ("one Copilot editor"): the Risks tab no longer
     prints "Risk k of n" (the panel's dropdown says which risk this is) and
     its heading wears the short title with the whole one on its hover. The
     lane's reading for these checks is its text, the hover titles in it and
     the dropdown's position, said as before. */
  await page.addInitScript(() => {
    window.__riskStep = () => { const s = document.getElementById('ce-pick-sel'); if (!s || !document.querySelector('[data-ce-tab="risks"].is-on')) return '';
      const o = [...s.options].filter(x => !x.disabled); const i = o.findIndex(x => x.selected); return i < 0 ? '' : 'Risk ' + (i + 1) + ' of ' + o.length; };
    window.__laneText = el => !el ? '' : el.textContent + ' ' + [...el.querySelectorAll('[title]')].map(x => x.getAttribute('title')).join(' ') + ' ' + window.__riskStep();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let payloadPuts = 0;
  page.on('request', r => { if (/\/api\/shares/.test(r.url()) && r.method() !== 'GET') payloadPuts++; });

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await until(page, () => !!(window.state && state.contracts && state.contracts.length));

  /* DARK=1 photographs the same journey in the dark theme. */
  if (process.env.DARK) await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); });

  /* COPILOT, SCRIPTED AT THE TRANSPORT the product itself calls through
     (window.copilotAsk — see copilotPropose). Each answer names what was asked
     so the test can tell an edit from a new clause. */
  await page.evaluate(({ PAY_NEW, INJ_NEW }) => {
    state.aiConfigured = true;
    window._rkAsked = [];
    window.copilotAsk = async msgs => {
      const t = String((msgs[0] || {}).content || '');
      window._rkAsked.push(t);
      const words = /Draft ONE new contract clause/.test(t) ? INJ_NEW : PAY_NEW;
      return { answer: JSON.stringify({ proposedText: words, advice: 'Drafted.' }) };
    };
  }, { PAY_NEW, INJ_NEW });

  /* ============ 1. THE LIST IN THE REDLINES CARD ============ */
  await page.evaluate(id => openWorkspace(id), ID);
  await until(page, () => !!document.querySelector('[data-room-check="risk"]'), null, 8000);
  await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
  await until(page, () => !!document.querySelector('.redline-page #rl-changes'), null, 8000);
  const pile = await until(page, () => {
    const p = document.getElementById('rl-risks');
    if (!p) return null;
    const r = p.getBoundingClientRect();
    return { w: r.width, h: r.height, head: (p.querySelector('.rk-h b') || {}).textContent || '',
      rows: [...p.querySelectorAll('.rk-row[data-rk-key]')].map(x => x.querySelector('.rk-t').textContent) };
  });
  check(!!pile && pile.w > 0 && pile.h > 0, '1a the Redlines column draws "Risks to look at"', pile && JSON.stringify({ w: pile.w, h: pile.h }));
  check(!!pile && /Risks to look at · 3/.test(pile.head), '1b its head counts the three open risks', pile && pile.head);
  check(!!pile && pile.rows[0] === 'Assignment not restricted' && pile.rows[2] === 'No injunctive-relief clause',
    '1c worst first: high, then medium, then low', pile && pile.rows.join(' | '));
  const std = await page.evaluate(() => [...document.querySelectorAll('[data-rl-prepare]')].map(b => b.textContent.trim()));
  check(std.length > 0 && std.every(t => /Draft from our standards/.test(t)), '1d the standards button says "Draft from our standards" at every door', JSON.stringify(std));
  await page.screenshot({ path: path.join(OUT, '01-the-list.png') });

  /* ============ 2. FROM THE THREAD, READ IN PLACE ============ */
  /* RE-POINTED 5 Oct 2026 (the Thread): Risk View and its clause map became
     the Thread's rows; a marked clause wears its tone, and its open row holds
     the mark in Worth a look — with no "Draft a redline" and (the owner's
     word) no "Add a note" either. */
  await page.evaluate(id => { const c = getContract(id); roomGoTab(c, 'docs'); }, ID);
  await until(page, () => document.querySelectorAll('#doc-thread .doc-th-row').length ? true : null);
  const seg = await until(page, () => {
    const n = document.querySelectorAll('#doc-thread .doc-th-row.is-ruby, #doc-thread .doc-th-row.is-amber, #doc-thread .doc-th-row.is-steel').length;
    return n ? n : null;
  });
  check(!!seg, '2- the Thread draws the marked clauses in their tone', seg);
  /* open the marked clause (Payment) */
  await page.evaluate(() => { const b = document.querySelector('#doc-thread .doc-th-row.is-ruby [data-th-go], #doc-thread .doc-th-row.is-amber [data-th-go], #doc-thread .doc-th-row.is-steel [data-th-go]'); if (b) b.click(); });
  const go = await until(page, () => {
    const open = document.querySelector('#doc-thread .doc-th-row.is-open');
    const m = open && open.querySelector('.doc-th-look .doc-xr-mark');
    return m ? { draft: open.querySelectorAll('[data-rk-go]').length, notes: open.querySelectorAll('[data-rk-note]').length,
      text: open.querySelector('.doc-th-look').textContent.replace(/\s+/g, ' ').trim().slice(0, 80) } : null;
  });
  check(!!go && go.draft === 0, '2a the Payment mark in the Thread draws no "Draft a redline" (one door for edits)', go && JSON.stringify(go));
  check(!!go && go.notes === 0 && !/Add a note/.test(go.text), '2b and no "Add a note" (removed 5 Oct 2026)', go && go.text);
  await page.screenshot({ path: path.join(OUT, '02-thread.png') });
  await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
  await until(page, () => !!document.querySelector('#rl-risks [data-rk-key="s:t-pay"] [data-rk-act="edit-ce"]'));
  await press(page, '#rl-risks [data-rk-key="s:t-pay"] [data-rk-act="edit-ce"]');
  const open = await until(page, () => {
    const pg = document.getElementById('clause-editor'); if (!pg) return null;
    const lane = pg.querySelector('#ce-lane');
    if (!lane || !/Payment terms: 60 days/.test(window.__laneText(lane)) || lane.querySelector('.rk-busy') || !/Copilot suggested/.test(window.__laneText(lane))) return null;
    /* the wording waits in the Suggested wording card for Apply (Young, 5 Oct 2026) */
    const ap = document.querySelector('#ce-rksug [data-ce-apply="rk:0"]');
    if (ap && !pg.querySelector('#ce-doc ins, #ce-doc .hati-ins, #ce-doc .nego-ins')){ ap.click(); return null; }
    return { ins: !!pg.querySelector('#ce-doc ins, #ce-doc .hati-ins, #ce-doc .nego-ins'), del: !!pg.querySelector('#ce-doc del, #ce-doc .hati-del, #ce-doc .nego-del'),
      clause: clauseEditorClauseId(), cost: (lane.querySelector('.rk-cost') || {}).textContent || '' };
  }, null, 8000);
  check(!!open, '2c "Edit with Copilot" opens the clause editor on that risk', open && JSON.stringify(open));
  check(!!open && open.ins && open.del, '2d Copilot\'s wording is drawn as tracked changes against the clause — read first');
  const payClause = await page.evaluate(id => (negoClauseList(getContract(id)).find(x => /Payment/.test(x.headingText || x.title || '')) || {}).clauseId, ID);
  check(!!open && open.clause === payClause, '2e it changes the clause the risk is about', open && open.clause);
  check(!!open && /1 Copilot call/.test(open.cost), '2f the cost is said', open && open.cost);
  await page.screenshot({ path: path.join(OUT, '03-read-in-place.png') });

  /* ============ 3. SAVE — UNSENT, THROUGH THE FUNNEL ============ */
  const before = await page.evaluate(id => { const c = getContract(id); return { n: (c.changes || []).length, turnAt: (c.negotiation || {}).turnAt || null }; }, ID);
  await press(page, '[data-ce-act="rk-save"]');
  await until(page, () => !!document.querySelector('#context-panel [data-rl-np-unpin]'));
  await press(page, '#context-panel [data-rl-np-unpin]');
  /* the walk goes on to the next open risk — the missing clause (section 4) */
  const nw = await until(page, () => {
    const pg = document.getElementById('clause-editor'); if (!pg) return null;
    const lane = pg.querySelector('#ce-lane');
    if (!lane || !/No injunctive-relief clause/.test(window.__laneText(lane)) || lane.querySelector('.rk-busy') || !/Copilot suggested/.test(window.__laneText(lane))) return null;
    const sec = pg.querySelector('#ce-doc [data-clause="' + window.CE_NEW_ID + '"]');
    return { held: !!sec, head: sec ? ((sec.querySelector('.rl-clause-h, h4') || {}).textContent || '') : '',
      where: [...lane.querySelectorAll('[data-ce-rk-where] option')].map(o => o.textContent) };
  }, null, 10000);
  const filed = await until(page, ({ id, n }) => {
    const c = getContract(id);
    if ((c.changes || []).length <= n) return null;
    const ch = c.changes[c.changes.length - 1];
    const p = document.getElementById('rl-risks');
    return { status: ch.status, side: ch.authorSide, type: ch.changeType, newText: ch.newText,
      drafted: c.risks && c.risks.drafted && c.risks.drafted['s:t-pay'], turnAt: (c.negotiation || {}).turnAt || null,
      head: p ? (p.querySelector('.rk-h b') || {}).textContent : '',
      stillListed: !!document.querySelector('#rl-risks [data-rk-key="s:t-pay"]'),
      rowSays: [...document.querySelectorAll('#rl-changes .rl-card-sum')].map(x => x.textContent).join(' | ') };
  }, { id: ID, n: before.n }, 8000);
  check(!!filed && filed.status === 'pending' && filed.side === 'owner', '3a Save files one change of ours, pending', filed && JSON.stringify({ s: filed.status, side: filed.side }));
  check(!!filed && /forty-five/.test(filed.newText || ''), '3b with the wording that was read', filed && filed.newText);
  check(!!filed && filed.turnAt === before.turnAt, '3c and sends nothing — the turn did not move');
  check(!!filed && !filed.stillListed && /· 2/.test(filed.head), '3d the risk leaves the list, which now counts two', filed && filed.head);
  check(!!filed && /from the risk scan/.test(filed.rowSays), '3e the redline row says it came from the risk scan', filed && filed.rowSays.slice(0, 160));
  await page.screenshot({ path: path.join(OUT, '04-added.png') });

  /* ============ 4. A MISSING CLAUSE BECOMES A NEW ONE ============ */
  check(!!nw && nw.held, '4a a missing clause opens the window holding a NEW clause where it will go', nw && JSON.stringify(nw));
  check(!!nw && /Injunctive relief/i.test(nw.head) && nw.where.length > 0 && nw.where.every(o => /^New clause after/.test(o)),
    '4b with a heading taken from the risk, and "Where it goes"', nw && (nw.head + ' / ' + nw.where.join(' | ')));
  await page.screenshot({ path: path.join(OUT, '05-new-clause.png') });
  const n2 = await page.evaluate(id => (getContract(id).changes || []).length, ID);
  /* the new clause's wording waits in the card for Apply (Young, 5 Oct 2026) */
  await press(page, '#ce-rksug [data-ce-apply="rk:0"]');
  await until(page, () => { const b = document.querySelector('[data-ce-act="rk-save"]'); return b && !b.disabled ? true : null; });
  await press(page, '[data-ce-act="rk-save"]');
  const ins = await until(page, ({ id, n }) => {
    const c = getContract(id);
    if ((c.changes || []).length <= n) return null;
    const ch = c.changes[c.changes.length - 1];
    return { type: ch.changeType, heading: ch.headingText || ch.clauseLabel || '' };
  }, { id: ID, n: n2 }, 8000);
  check(!!ins && ins.type === 'insertClause' && /Injunctive relief/i.test(ins.heading), '4c and files as an inserted clause', ins && JSON.stringify(ins));
  await until(page, () => !!document.querySelector('#context-panel [data-rl-np-unpin]'));
  await press(page, '#context-panel [data-rl-np-unpin]');
  await until(page, () => !!document.querySelector('[data-ce-rk="back"]'));
  await press(page, '[data-ce-rk="back"]');
  await until(page, () => !document.getElementById('clause-editor') && !!document.getElementById('rl-risks'));

  /* ============ 5. DISMISS, SHOW, BRING BACK ============ */
  await press(page, '#rl-risks [data-rk-key="s:t-ass"] [data-rk-act="dismiss"]');
  const dis = await until(page, id => {
    const c = getContract(id);
    return (c.scan.dismissed || []).includes('t-ass') && !document.querySelector('#rl-risks .rk-row[data-rk-key="s:t-ass"]:not(.is-gone)')
      ? { show: !!document.querySelector('#rl-risks [data-rk-act="gone"]') } : null;
  }, ID);
  check(!!dis, '5a Dismiss takes it off the list and records it where the scan keeps dismissals');
  check(!!dis && dis.show, '5b "Show dismissed" stays as the way back');
  await press(page, '#rl-risks [data-rk-act="gone"]');
  await until(page, () => !!document.querySelector('#rl-risks .rk-row.is-gone [data-rk-act="back"]'));
  await page.screenshot({ path: path.join(OUT, '06-dismissed.png') });
  await press(page, '#rl-risks .rk-row.is-gone [data-rk-act="back"]');
  const back = await until(page, id => !(getContract(id).scan.dismissed || []).includes('t-ass')
    && !!document.querySelector('#rl-risks .rk-row[data-rk-key="s:t-ass"]:not(.is-gone)'), ID);
  check(!!back, '5c "Bring back" puts it on the list again');

  /* ============ 6. NO COPILOT IS SAID, NEVER SILENT ============ */
  await page.evaluate(() => { state.aiConfigured = false; });
  await press(page, '#rl-risks [data-rk-key="s:t-ass"] [data-rk-act="edit-ce"]');
  const noai = await until(page, () => {
    const pg = document.getElementById('clause-editor'); if (!pg) return null;
    const lane = pg.querySelector('#ce-lane');
    return lane && /not connected/.test(window.__laneText(lane)) ? { box: !!pg.querySelector('#ce-doc [data-clause]'), says: window.__laneText(lane) } : null;
  });
  check(!!noai && noai.box && /write the wording in the box yourself/.test(noai.says), '6a with no key the window says so, and the reader writes in the box');
  await page.screenshot({ path: path.join(OUT, '07-no-copilot.png') });
  await page.evaluate(id => riskWalkEnd(getContract(id)), ID);
  await until(page, () => !document.getElementById('clause-editor'));

  /* ============ 7. THE OLD PANEL'S DOORS LAND ON RISK VIEW ============ */
  await page.evaluate(id => { const c = getContract(id); roomGoTab(c, 'terms'); }, ID);
  /* RE-POINTED 5 Oct 2026 (the Thread): Risk View became the Thread, and the
     head's risk icon is the NEGOTIATE head's (roomHeadHtml draws the checks
     only with backToContract) — the contract's page never had it, so the door
     measured here is riskViewOpen itself, which every risk door presses: it
     lands on the Document tab with the worst-marked clause's row open. */
  const noIcon = await page.evaluate(() => !document.querySelector('[data-room-check="risk"]'));
  await page.evaluate(id => riskViewOpen(getContract(id)), ID);
  const rv = await until(page, () => (typeof roomCurrentTab === 'function' && roomCurrentTab() === 'docs'
    && !document.getElementById('doc-thread')?.hidden && !!document.querySelector('#doc-thread .doc-th-row.is-open')
    && !document.querySelector('#scan-section')) ? true : null);
  check(!!rv && noIcon, '7a the risk door opens the Document tab with the Thread, not a side panel (and the room head draws no risk icon of its own)', JSON.stringify({ landed: !!rv, noIcon }));
  const tiles = await page.evaluate(id => {
    const c = getContract(id);
    const t = triageTiles(Object.assign({}, c, { triage: { at: '2026-10-04', steps: { risk: { ok: true, open: 1 } } } }));
    return t.map(x => x.key + ':' + x.headKey + ':' + (x.count == null ? '' : x.count));
  }, ID);
  check(tiles.some(x => /^risk:tri_t_risk:1$/.test(x)) && !tiles.some(x => /^filed:/.test(x)),
    '7b the Overview tile is "Risks found", counting what is still to read; "Filed" is gone', tiles.join(' | '));

  /* THE TILE ON THE OVERVIEW ITSELF, photographed, and its door. */
  await page.evaluate(id => { const c = getContract(id);
    c.triage = { at: '2026-10-04', steps: { risk: { ok: true, open: 2 }, brief: { ok: false, why: 'No key' },
      playbook: { ok: false, why: 'No key' }, oblig: { ok: false, why: 'No key' }, fill: { ok: true, none: 'none' } } };
    roomGoTab(c, 'terms'); }, ID);
  const tile = await until(page, () => {
    const b = document.querySelector('[data-kt-tri-go="risk"]');
    return b ? b.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  check(!!tile && /Risks found/.test(tile), '7c the Overview strip draws "Risks found" as a door', tile);
  await page.screenshot({ path: path.join(OUT, '08-overview-tile.png') });
  if (tile){
    await press(page, '[data-kt-tri-go="risk"]');
    const rv2 = await until(page, () => (roomCurrentTab() === 'docs' && !!document.querySelector('#doc-thread:not([hidden]) .doc-th-row.is-open')) ? true : null);
    check(!!rv2, '7d and pressing it opens the Document tab with the Thread');
  }

  /* ============ 8. NOTHING TRAVELS ============ */
  const pl = await page.evaluate(id => { const c = getContract(id);
    const p = buildSharePayload(c, 'x', null, { purpose: 'negotiate' });
    return { risks: 'risks' in (p.contract || {}), scan: 'scan' in (p.contract || {}) }; }, ID);
  check(!pl.risks && !pl.scan, '8a the share payload carries neither the risk list nor the scan', JSON.stringify(pl));
  check(payloadPuts === 0, '8b nothing was sent while the risks were worked', payloadPuts);
  check(errors.length === 0, '8c no page errors', errors.slice(0, 3).join(' | '));

  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
