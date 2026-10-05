/* RISK CARD TITLES, AND A RISK CARD GOES TO ITS CLAUSE
   (Young, 5 Oct 2026: "Build both fixes with your recommendations", and the
   same day: "where possible, when I click on a risk card it should take me to
   the clause being impacted just like in redline cards")
   ============================================================
   Driven where the reader stands, on an uploaded agreement shaped like the
   owner's Kwetu - V2: one scan finding about something the contract does not
   say, and four brief items — two titled by Copilot, two in the old shape
   (one of them covered by a redline of ours). At 1366 and 1024 wide:
     1. no card is wider than its list; the Redlines column never scrolls
        sideways; severity and Why are PAINTED (elementFromPoint);
     2. a titled card shows its short title, and Why opens the whole sentence
        and why it matters; an old-shape card keeps its sentence on one line
        ending in "…";
     3. Discard then Bring back works on a titled item;
     4. pressing a quoted risk's title brings its clause to the middle of the
        paper and flashes its words; the card wears is-linked and the paper
        draws no outline; Why does not move the paper; Enter on the focused
        head does what a click does; a risk about something the contract does
        not say is not a door; a risk HaTi cannot place says so; a covered
        row's head goes where its "Go to change" link goes;
     5. Edit with Copilot's Risks tab shows the title, the sentence under it;
     6. the Document tab's Clauses drawer reads "title — sentence".
   Photographed light and dark. Every driven half is GUARDED — a build
   without the feature REPORTS.
   Screenshots: test/chromium/shots/risk-card-titles/ (or HATI_SHOT_DIR).
   Run: node test/chromium/risk-card-titles-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'risk-card-titles');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};

const TERM_Q = 'Either party may end this agreement on thirty (30) days\' written notice.';
const DELIV_Q = 'must report any delivery problem within twelve (12) hours of delivery';
const DATA_Q = 'The Distributor shall keep customer records and share them with the Supplier on request.';
const FILL = n => Array.from({ length: n }, (_, i) => `<p>The parties shall cooperate in good faith on matter ${i + 1} of the arrangement and keep each other informed.</p>`).join('');
const BODY = '<h1>Distribution Agreement</h1><p>Between Highland Corporate Ltd and Kwetu Distributors Ltd</p>'
  + '<h2>1. Appointment</h2><p>The Supplier appoints the Distributor for the territory.</p>' + FILL(6)
  + `<h2>2. Termination</h2><p>${TERM_Q} Notice must be given in writing to the address on the first page.</p>` + FILL(6)
  + `<h2>3. Delivery</h2><p>The Distributor ${DELIV_Q}, after which the delivery is treated as correct and complete.</p>` + FILL(6)
  + `<h2>4. Records</h2><p>${DATA_Q}</p>` + FILL(6)
  + '<h2>5. Governing law</h2><p>This Agreement is governed by the laws of Kenya.</p>'
  + '<h2>6. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';
const SCAN = { at: '5 Oct 2026, 16:20', on: '2026-10-05', lang: 'en', dismissed: [], findings: [
  { id: 'nd-inj', sev: 'low', kind: 'missing', title: 'No injunctive-relief clause', anchor: 'doc',
    what: 'The agreement does not say a party may seek an injunction.', why: 'Hard to stop a breach quickly.', fix: 'Add one.' },
] };
const T_SENT = 'The contract can be ended by either side with just 30 days\' notice, with no minimum term.';
const P_SENT = 'Before credit is extended the directors must hand over copies of their identity papers to the supplier.';
const D_SENT = 'Very short 12-hour window to report delivery problems before the delivery is automatically treated as correct and complete.';
const R_SENT = 'The distributor has to share all of its customer records with the supplier whenever the supplier asks for them.';
const BRIEF = { at: new Date().toISOString(), by: 'Stage', truncated: false, data: {
  overview: 'A distribution agreement.',
  watchouts: [
    { point: T_SENT, title: 'Ended on 30 days\' notice', why: 'You could lose the account at short notice.', quote: TERM_Q, wording: true },
    { point: P_SENT, title: 'Directors\' ID papers needed for credit', why: 'Personal papers go to the supplier.', wording: true },
  ],
  unusual: [
    { point: D_SENT, why: 'Twelve hours is very short.', quote: DELIV_Q, wording: true },
    { point: R_SENT, why: 'Your customer list is your business.', quote: DATA_Q, wording: true },
  ] } };

async function shot(page, name){ try{ await page.screenshot({ path: path.join(OUT, name) }); }catch(_){} }

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-RCT1';
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Kwetu distribution agreement', counterparty: 'Kwetu Distributors Ltd', counterpartyEmail: 'amina@kwetu.co.ke',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'distribution' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    upload: { name: 'Kwetu - V2.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });
  if (!put || !put.ok) console.log('  FAIL — the stage could not save the contract');

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskItemsOf === 'function'))) throw new Error('this build has no risk list');
    await until(page, id => !!(typeof getContract === 'function' && getContract(id)), ID, 15000);
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(({ id, BRIEF }) => { const c = getContract(id); c._brief = BRIEF; c._hasBrief = true; roomGoTab(c, 'redline'); }, { id: ID, BRIEF });
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    await new Promise(r => setTimeout(r, 1500));
    /* A redline of ours on clause 4 covers the records risk — filed once the
       page has settled, as a reader would. */
    const staged = await page.evaluate(async ({ id, DATA_Q }) => {
      const c = getContract(id);
      const cl = negoClauseList(c).find(x => /Records/.test(x.title || x.headingText || ''));
      let r = null;
      try{ r = cl ? await negoEditClause(c, cl.clauseId, '<p>' + DATA_Q.replace('on request', 'once a year, in summary form') + '</p>', { side: 'owner' }) : null; }catch(_){ r = null; }
      if (c._brief == null) c._brief = null;
      return r && r.id ? r.id : null;
    }, { id: ID, DATA_Q });
    await until(page, () => { if (window.renderRedline) renderRedline(); return (getContract(state.activeId).changes || []).length > 0; });
    if (!staged) console.log('  note — the covering redline could not be staged');
    const listed = await until(page, () => {
      if (window.renderRedline) renderRedline();
      return document.querySelectorAll('#rl-risks .rk-row[data-rk-key]').length >= 3;
    });
    check(!!listed, '0 the Redlines card has its "Risks to look at"');

    const KEY = (src, s) => 's' === src ? 's:' + s : null;
    const keyOf = sent => page.evaluate(s => { const it = riskItemsOf(getContract(state.activeId)).find(x => x.say === s || x.title === s); return it ? it.key : null; }, sent);
    const kTerm = await keyOf(T_SENT), kPapers = await keyOf(P_SENT), kDeliv = await keyOf(D_SENT), kRec = await keyOf(R_SENT);
    void KEY;

    for (const width of [1366, 1024]){
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => { if (window.renderRedline) renderRedline(); });
      await until(page, () => !!document.getElementById('rl-risks'));
      const m = await page.evaluate(() => {
        const list = document.getElementById('rl-risks');
        const col = document.getElementById('nego-cards') || list.closest('[id]');
        const lw = list.getBoundingClientRect().width;
        const rows = [...list.querySelectorAll('.rk-row')].map(r => r.getBoundingClientRect().width);
        return { lw, max: Math.max(...rows), sideways: col ? col.scrollWidth - col.clientWidth : 0, colId: col && col.id };
      });
      check(m.max <= m.lw + 0.5, `1a (${width}) no card is wider than its list`, `list ${Math.round(m.lw)} · widest card ${Math.round(m.max)}`);
      check(m.sideways <= 1, `1b (${width}) the Redlines column does not scroll sideways`, `${m.colId}: ${m.sideways}px`);
      const painted = await page.evaluate(k => {
        const row = document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"]');
        if (!row) return null;
        row.scrollIntoView({ block: 'center' });
        const hit = el => { if (!el) return false; const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const e = document.elementFromPoint(x, y); return !!(e && (e === el || el.contains(e))); };
        return { sev: hit(row.querySelector('.rk-sev')), why: hit(row.querySelector('.rk-why-btn')) };
      }, kDeliv);
      check(!!(painted && painted.sev && painted.why), `1c (${width}) severity and Why are painted on a long-title card`, JSON.stringify(painted));
    }
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.evaluate(() => { if (window.renderRedline) renderRedline(); });
    await until(page, () => !!document.getElementById('rl-risks'));

    /* 2 — the titles */
    const tTerm = await page.evaluate(k => { const r = document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] .rk-t'); return r ? { text: r.textContent, hover: r.getAttribute('title') } : null; }, kTerm);
    check(!!tTerm && tTerm.text === 'Ended on 30 days\' notice', '2a a titled card shows its short title', tTerm && tTerm.text);
    check(!!tTerm && tTerm.hover === T_SENT, '2b its hover is the whole sentence', tTerm && tTerm.hover);
    await page.evaluate(k => document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] [data-rk-act="why"]').click(), kTerm);
    const why = await until(page, k => { const w = document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] .rk-why'); return w ? w.textContent.replace(/\s+/g, ' ') : null; }, kTerm);
    check(!!why && why.includes(T_SENT) && /You could lose the account/.test(why), '2c Why opens the sentence and why it matters', why);
    const old = await page.evaluate(k => { const r = document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] .rk-t'); if (!r) return null; const cs = getComputedStyle(r);
      return { text: r.textContent, cut: r.scrollWidth > r.clientWidth, ellipsis: cs.textOverflow, one: cs.whiteSpace }; }, kDeliv);
    check(!!old && old.text === D_SENT && old.cut && old.ellipsis === 'ellipsis' && old.one === 'nowrap', '2d an old-shape card keeps its sentence on one line ending in "…"', JSON.stringify(old));
    await shot(page, '1-titles-light.png');
    await page.evaluate(() => { if (window.setDark) setDark(true); });
    await shot(page, '2-titles-dark.png');
    await page.evaluate(() => { if (window.setDark) setDark(false); });

    /* 3 — Discard then Bring back */
    await page.evaluate(k => document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] [data-rk-act="dismiss"]').click(), kTerm);
    const gone = await until(page, k => !document.querySelector('#rl-risks .rk-row:not(.is-gone)[data-rk-key="' + CSS.escape(k) + '"]'), kTerm);
    await page.evaluate(() => { const b = document.querySelector('#rl-risks [data-rk-act="gone"]'); if (b) b.click(); });
    await until(page, k => !!document.querySelector('#rl-risks .rk-row.is-gone[data-rk-key="' + CSS.escape(k) + '"]'), kTerm);
    const goneTitle = await page.evaluate(k => { const r = document.querySelector('#rl-risks .rk-row.is-gone[data-rk-key="' + CSS.escape(k) + '"]');
      return r ? { t: (r.querySelector('.rk-t') || {}).textContent, door: !!r.querySelector('[data-rk-act="go"]') } : null; }, kTerm);
    await page.evaluate(k => { const b = document.querySelector('#rl-risks .rk-row.is-gone[data-rk-key="' + CSS.escape(k) + '"] [data-rk-act="back"]'); if (b) b.click(); }, kTerm);
    const back = await until(page, k => !!document.querySelector('#rl-risks .rk-row:not(.is-gone)[data-rk-key="' + CSS.escape(k) + '"]'), kTerm);
    check(!!gone && !!back && goneTitle && goneTitle.t === 'Ended on 30 days\' notice' && !goneTitle.door, '3 Discard then Bring back works on a titled item; a discarded row is not a door', JSON.stringify(goneTitle));
    await page.evaluate(() => { const b = document.querySelector('#rl-risks [data-rk-act="gone"]'); if (b && /hide/i.test(b.textContent)) b.click(); });

    /* 4 — the press */
    const hasDoor = await page.evaluate(() => typeof riskGoClause === 'function');
    check(hasDoor, '4- this build has the door');
    if (hasDoor){
      await page.evaluate(k => document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"]').scrollIntoView({ block: 'center' }), kTerm);
      await page.click(`#rl-risks .rk-row[data-rk-key="${kTerm}"] .rk-head .rk-t`);
      const at = await until(page, () => {
        const doc = document.getElementById('rl-doc'); if (!doc) return null;
        const flash = doc.querySelector('span.anchor-flash'); if (!flash) return null;
        const cl = flash.closest('[data-clause]');
        const r = flash.getBoundingClientRect();
        const e = document.elementFromPoint(r.left + Math.min(8, r.width / 2), r.top + r.height / 2);
        const v = { inClause: !!(cl && /Termination/.test(cl.textContent)), shown: !!(e && cl && cl.contains(e)) };
        return v.shown ? v : (window._rctLast = v, null);
      }, null, 6000) || await page.evaluate(() => window._rctLast || null);
      check(!!at && at.inClause, '4a the press flashes the risk\'s own words inside its clause', JSON.stringify(at));
      check(!!at && at.shown, '4b those words are in view on the paper (elementFromPoint)');
      const ring = await page.evaluate(k => {
        const row = document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"]');
        const cl = [...document.querySelectorAll('#rl-doc [data-clause]')].find(x => /Termination/.test(x.textContent));
        const cs = cl ? getComputedStyle(cl) : null;
        return { linked: !!(row && row.classList.contains('is-linked')), ring: row ? getComputedStyle(row).boxShadow : '',
          outline: cs ? (cs.outlineStyle === 'none' || cs.outlineWidth === '0px') : true };
      }, kTerm);
      check(ring.linked && ring.ring && ring.ring !== 'none', '4c the card wears the faint ring (is-linked)', ring.ring);
      check(ring.outline, '4d the paper draws no outline on the clause');
      await shot(page, '3-went-to-its-clause.png');

      const scroller = () => { let n = document.getElementById('rl-doc'); while (n && n !== document.body){ const s = getComputedStyle(n); if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight) return n; n = n.parentElement; } return document.scrollingElement; };
      const top0 = await page.evaluate(`(${scroller})().scrollTop`);
      await page.evaluate(k => document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] [data-rk-act="why"]').click(), kPapers);
      await new Promise(r => setTimeout(r, 500));
      const top1 = await page.evaluate(`(${scroller})().scrollTop`);
      check(Math.abs(top1 - top0) < 2, '4e Why does not move the paper', `${top0} → ${top1}`);

      /* Enter on the focused head of the delivery risk */
      await page.evaluate(() => { document.querySelectorAll('.anchor-flash').forEach(n => n.classList.remove('anchor-flash')); });
      await page.focus(`#rl-risks .rk-row[data-rk-key="${kDeliv}"] .rk-head`);
      await page.keyboard.press('Enter');
      const viaKey = await until(page, () => { const f = document.querySelector('#rl-doc span.anchor-flash'); const cl = f && f.closest('[data-clause]'); return cl ? /Delivery/.test(cl.textContent) : null; }, null, 6000);
      check(!!viaKey, '4f Enter on the focused head does what a press does');

      const missing = await page.evaluate(() => { const r = [...document.querySelectorAll('#rl-risks .rk-row')].find(x => /injunctive/i.test(x.textContent));
        return r ? { door: !!r.querySelector('[data-rk-act="go"]'), cursor: getComputedStyle(r.querySelector('.rk-head') || r).cursor } : null; });
      check(!!missing && !missing.door && missing.cursor !== 'pointer', '4g a risk about something the contract does not say is not a door', JSON.stringify(missing));

      const place = await page.evaluate(k => { const it = riskItemsOf(getContract(state.activeId)).find(x => x.key === k); return it ? riskClauseOf(getContract(state.activeId), it) : 'none'; }, kPapers);
      if (place == null){
        await page.click(`#rl-risks .rk-row[data-rk-key="${kPapers}"] .rk-head .rk-t`);
        const said = await until(page, () => { const t = [...document.querySelectorAll('.toast, [class*="toast"]')].map(x => x.textContent).join(' | '); return /can't tell which clause/.test(t) ? t : null; }, null, 4000);
        check(!!said, '4h a risk HaTi cannot place says so in a toast', said);
      } else check(true, '4h (skipped: HaTi placed the papers risk on a clause)', JSON.stringify(place && place.clauseId));

      await page.evaluate(() => { const b = document.querySelector('#rl-risks [data-rk-act="covered"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
      const cov = await until(page, k => { const r = document.querySelector('#rl-risks .rk-row.is-covered[data-rk-key="' + CSS.escape(k) + '"]');
        const go = r && r.querySelector('[data-rk-act="cov-go"]'); return r ? { door: !!r.querySelector('[data-rk-act="go"]'), to: go ? go.getAttribute('data-rk-clause') : null } : null; }, kRec);
      const covWhy = cov ? '' : await page.evaluate(k => { const c = getContract(state.activeId); const it = riskItemsOf(c).find(x => x.key === k);
        return JSON.stringify({ it: it && { covered: it.covered, drafted: it.drafted, dismissed: it.dismissed }, changes: (c.changes || []).map(x => [x.id, x.clauseId, x.clauseLabel, x.authorSide, x.status]) }); }, kRec);
      check(!!cov && cov.door, '4i a covered row\'s head is a door', cov ? JSON.stringify(cov) : covWhy);
      if (cov && cov.door){
        await page.click(`#rl-risks .rk-row.is-covered[data-rk-key="${kRec}"] .rk-head .rk-t`);
        const went = await until(page, to => { const cl = document.querySelector('#rl-doc [data-clause="' + CSS.escape(to) + '"]'); if (!cl) return null;
          const r = cl.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }, cov.to, 4000);
        check(!!went, '4j it goes where its "Go to change" link goes', cov.to);
      }
    }

    /* 5 — Edit with Copilot's Risks tab */
    await page.evaluate(k => { const b = document.querySelector('#rl-risks .rk-row[data-rk-key="' + CSS.escape(k) + '"] [data-rk-act="edit-ce"]'); if (b) b.click(); }, kTerm);
    const ce = await until(page, () => { const c = document.querySelector('#clause-editor .rk-ce-card'); if (!c) return null;
      return { t: (c.querySelector('.rk-t') || {}).textContent, p: (c.querySelector('.rk-p') || {}).textContent || '' }; }, null, 10000);
    check(!!ce && ce.t === 'Ended on 30 days\' notice' && ce.p.includes('30 days'), '5 Edit with Copilot\'s Risks tab: the title, the sentence under it', JSON.stringify(ce));
    await shot(page, '4-edit-risks-tab.png');
    await page.evaluate(() => { try{ if (window.clauseEditorClose) clauseEditorClose({ force: true }); }catch(_){} });
    await page.keyboard.press('Escape');

    /* 6 — the Document tab's Worth a look */
    await page.evaluate(id => { const c = getContract(id); try{ if (window.closeClauseEditor) closeClauseEditor(true); }catch(_){} roomGoTab(c, 'document'); }, ID);
    const thread = await until(page, () => {
      const door = document.getElementById('ws-th-door'); if (door && !document.querySelector('#doc-right.is-clauses')) door.click();
      const rows = [...document.querySelectorAll('#doc-thread .doc-xr-mt')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
      const hit = rows.find(t => /^Ended on 30 days' notice — /.test(t));
      if (!hit){ const row = [...document.querySelectorAll('#doc-thread .doc-th-row')].find(x => /Termination/.test((x.querySelector('.doc-th-name') || {}).textContent || ''));
        const go = row && row.querySelector('[data-th-go]'); if (go && go.getAttribute('aria-expanded') !== 'true') go.click(); }
      return hit || null;
    }, null, 10000);
    const thWhy = thread ? '' : await page.evaluate(() => JSON.stringify({ door: !!document.getElementById('ws-th-door'), drawer: !!document.querySelector('#doc-right.is-clauses'),
      mt: [...document.querySelectorAll('.doc-xr-mt')].map(x => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 80)), tab: state.wsTab || null }));
    check(!!thread, '6 the Clauses drawer\'s Worth a look reads "title — sentence"', thread || thWhy);
    await shot(page, '5-worth-a-look.png');

    check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  } catch (e){
    console.log('  FAIL — the run stopped: ' + (e && e.message));
    failures++;
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
