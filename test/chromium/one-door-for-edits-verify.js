/* ONE DOOR FOR EDITS — RISKS OPEN IN EDIT WITH COPILOT (the owner's work
   order, Part 8, 4 Oct 2026; the owner's proposal page's eight screens)
   ============================================================
   Driven where the reader stands, Copilot scripted at its transport:
     1. THE LIST — risk rows offer Add a note · Dismiss · Edit with Copilot,
        and no in-card drafting;
     2. COVERED FOLD — a risk on a topic our standards redlined is not listed
        and not counted; it waits in "Covered by your redlines (1)" naming
        the redline;
     3. EDIT WITH COPILOT — the press opens the window the pencil opens, on
        the clause the risk is about, with the Risks tab lit, "Risk 1 of n",
        Copilot's wording in the box as tracked changes, the call said; a
        quick ask redrafts the box;
     4. NOTE AFTER SAVE — Save & next files ONE unsent redline through the
        funnel and opens the Notes drawer pinned to it; Skip there moves on;
     5. THE RIGHT PLACE — "Missing governing law" opens on clause 4 Governing
        law (never a second one); a new clause is drafted in the card, never
        after the signatures (holding a new clause in the window is waiting
        on the owner);
     6. LAST RISK DONE — Skip to the end: "That was the last risk", nothing
        sent, Back to Redlines;
     7. RISK VIEW — the mark offers only "Add a note";
     8. SAFETY NET — a second redline of ours on one clause stops with a
        dialog naming the first; Cancel files nothing;
     9. the covered risk comes back by itself when its redline is discarded.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/one-door-for-edits/ (or HATI_SHOT_DIR).
   Run: node test/chromium/one-door-for-edits-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-door-for-edits');
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
const press = (page, sel) => page.evaluate(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);

const PAY = 'The Buyer shall pay each undisputed invoice within 60 days of receipt of the invoice.';
const LIAB = 'Each party\'s total liability under this Agreement shall not exceed the charges paid in the preceding three (3) months.';
const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the agreed specification and quality.</p>'
  + `<h2>2. Payment</h2><p>${PAY}</p>`
  + '<h2>3. Confidentiality</h2><p>Each party shall keep the other party\'s information confidential.</p>'
  + '<h2>4. Governing law</h2><p>This Agreement is governed by the laws of Denmark.</p>'
  + `<h2>5. Limitation of liability</h2><p>${LIAB}</p>`
  + '<h2>6. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';
const SCAN = { at: '4 Oct 2026, 17:19', on: '2026-10-04', lang: 'en', dismissed: [], findings: [
  { id: 't-liab', sev: 'high', kind: 'risk', title: 'Liability cap may be too low', anchor: 'doc', quote: LIAB,
    what: 'Liability is capped at three months of charges.', why: 'A data breach could cost far more than the cap.', fix: 'Raise the cap to twelve months.' },
  { id: 't-law', sev: 'med', kind: 'missing', title: 'Missing governing law', anchor: 'doc',
    what: 'The governing law is not clearly stated.', why: 'Disputes cost more without it.', fix: 'Name the law and the courts.' },
  { id: 't-pay', sev: 'med', kind: 'risk', title: 'Payment terms: 60 days', anchor: 'doc', quote: PAY,
    what: 'Invoices are paid at 60 days.', why: 'Long terms strain working capital.', fix: 'Negotiate toward 30 days.' },
  { id: 't-inj', sev: 'low', kind: 'missing', title: 'No injunctive-relief clause', anchor: 'doc',
    what: 'The agreement is silent on equitable remedies.', why: 'Damages arrive too late.', fix: 'Permit interim injunctions.' },
] };
const LIAB_NEW = 'Each party\'s total liability under this Agreement shall not exceed the charges paid or payable in the preceding twelve (12) months.';
const LIAB_FIRM = 'Each party\'s total liability under this Agreement shall not exceed the charges paid or payable in the preceding twelve (12) months, save for breach of confidentiality.';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-OD1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    playbook: { at: '2026-10-04', verdicts: [{ category: 'Payment terms', status: 'deviation', quote: PAY, position: '30 days' }] },
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let shares = 0;
  page.on('request', r => { if (/\/api\/shares/.test(r.url()) && r.method() !== 'GET') shares++; });
  const shot = n => page.screenshot({ path: path.join(OUT, n) });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskEditStart === 'function'))) throw new Error('there is no one door for edits on this build');
    await page.evaluate(({ LIAB_NEW, LIAB_FIRM }) => {
      state.aiConfigured = true;
      window._odAsked = [];
      window.copilotAsk = async msgs => {
        const t = String((msgs[0] || {}).content || '');
        window._odAsked.push(t);
        const words = /Asked now: Make it firmer/.test(t) ? LIAB_FIRM
          : /governing law/i.test(t) ? 'This Agreement is governed by the laws of Sweden, and the courts of Stockholm have jurisdiction.'
          : LIAB_NEW;
        return { answer: JSON.stringify({ proposedText: words, advice: 'Drafted.' }) };
      };
    }, { LIAB_NEW, LIAB_FIRM });
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    /* OUR STANDARDS' REDLINE ON PAYMENT, filed through the funnel as
       "Draft from our standards" files it */
    const pb = await page.evaluate(async id => {
      const c = getContract(id);
      const cl = negoClauseList(c).find(x => /Payment/.test(x.headingText || x.title || ''));
      const ch = await negoEditClause(c, cl.clauseId, '<p>The Buyer shall pay each undisputed invoice within 30 days of receipt of the invoice.</p>',
        { side: 'owner', note: 'Playbook — Payment terms: 30 days' });
      renderRedline();
      return ch ? ch.id : null;
    }, ID);
    check(!!pb, '0 a standards redline on Payment is on the record', pb);

    /* ============ 1. THE LIST ============ */
    const list = await until(page, () => {
      const p = document.getElementById('rl-risks'); if (!p) return null;
      const rows = [...p.querySelectorAll('.rk-row[data-rk-key]:not(.is-covered):not(.is-gone)')];
      return { head: (p.querySelector('.rk-h b') || {}).textContent || '', keys: rows.map(r => r.getAttribute('data-rk-key')),
        acts: rows.map(r => [...r.querySelectorAll('button')].map(b => b.textContent.trim()).join(' · ')),
        drafting: !!p.querySelector('[data-rk-target], .rk-draft, [data-rk-act="add"]') };
    });
    check(!!list && list.acts.length && list.acts.every(a => a === 'Add a note · Dismiss · Edit with Copilot'), '1a each risk row offers Add a note · Dismiss · Edit with Copilot', list && list.acts[0]);
    check(!!list && !list.drafting, '1b no wording is drafted in the card');
    check(!!list && /· 3$/.test(list.head) && !list.keys.includes('s:t-pay'), '1c the covered Payment risk is not listed or counted', list && list.head + ' ' + list.keys.join(','));
    const tile = await page.evaluate(id => riskOpenOf(getContract(id)).length, ID);
    check(tile === 3, '1d the Overview tile and the room count read the same three', tile);
    await shot('1-the-list.png');

    /* ============ 2. COVERED FOLD ============ */
    await press(page, '#rl-risks [data-rk-act="covered"]');
    const fold = await until(page, () => {
      const r = document.querySelector('#rl-risks .rk-row.is-covered[data-rk-key="s:t-pay"]');
      return r ? { says: r.textContent.replace(/\s+/g, ' '), go: !!r.querySelector('[data-rk-act="cov-go"]') } : null;
    });
    check(!!fold && /Covered by your redlines \(1\)/.test(await page.evaluate(() => (document.querySelector('[data-rk-act="covered"]') || {}).textContent || '')), '2a the fold reads "Covered by your redlines (1)"');
    check(!!fold && /By CHG-\d+ · .*Payment.* · from your standards/.test(fold.says) && fold.go, '2b its line names the redline that covers it, and goes there', fold && fold.says);
    await shot('2-covered-fold.png');

    /* ============ 3. EDIT WITH COPILOT ============ */
    await press(page, '#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]');
    const ed = await until(page, () => {
      const pg = document.getElementById('clause-editor'); if (!pg) return null;
      const tab = pg.querySelector('[data-ce-tab="risks"]');
      const lane = pg.querySelector('#ce-lane');
      if (!lane || !/Risk 1 of/.test(lane.textContent) || lane.querySelector('.rk-busy') || !/Copilot wrote/.test(lane.textContent)) return null;
      return { on: !!(tab && tab.classList.contains('is-on')), clause: clauseEditorClauseId(), step: lane.querySelector('.rk-ce-step').textContent,
        ins: !!pg.querySelector('#ce-doc ins, #ce-doc .hati-ins, #ce-doc .nego-ins'), save: (pg.querySelector('[data-ce-act="rk-save"]') || {}).textContent || '' };
    }, null, 10000);
    check(!!ed && ed.on, '3a Edit with Copilot opens the window with the Risks tab lit', ed && JSON.stringify(ed));
    const liabClause = await page.evaluate(id => (negoClauseList(getContract(id)).find(x => /liability/i.test(x.headingText || x.title || '')) || {}).clauseId, ID);
    check(!!ed && ed.clause === liabClause, '3b on the clause the risk is about', ed && ed.clause);
    check(!!ed && /Risk 1 of 3/.test(ed.step), '3c "Risk 1 of 3"', ed && ed.step);
    check(!!ed && ed.ins, '3d Copilot\'s wording is in the box as tracked changes');
    await shot('3-edit-with-copilot.png');
    const n0 = await page.evaluate(() => window._odAsked.length);
    await press(page, '[data-ce-rk="ask-firmer"]');
    const firm = await until(page, n => window._odAsked.length > n && /Asked now: Make it firmer/.test(window._odAsked[window._odAsked.length - 1])
      && /save for breach of confidentiality/.test(ceBoxWords()) ? true : null, n0);
    check(!!firm, '3e "Make it firmer" asks Copilot once and redrafts the box, nothing saved');
    const unsaved = await page.evaluate(id => (getContract(id).changes || []).length, ID);

    /* ============ 4. NOTE AFTER SAVE ============ */
    await press(page, '[data-ce-act="rk-save"]');
    const filed = await until(page, ({ id, n }) => {
      const c = getContract(id); if ((c.changes || []).length <= n) return null;
      const ch = c.changes[c.changes.length - 1];
      const pin = document.querySelector('#context-panel [data-rl-np-unpin]');
      return pin ? { status: ch.status, side: ch.authorSide, note: ch.note, words: ch.newText, drafted: (c.risks && c.risks.drafted || {})['s:t-liab'], id: ch.id } : null;
    }, { id: ID, n: unsaved }, 10000);
    check(!!filed && filed.status === 'pending' && filed.side === 'owner', '4a Save & next files one redline of ours, unsent', filed && JSON.stringify(filed).slice(0, 160));
    check(!!filed && /^Copilot — Risk scan: Liability cap/.test(filed.note) && filed.drafted === filed.id, '4b it wears the risk\'s provenance and the risk remembers it', filed && filed.note);
    check(!!filed && /save for breach of confidentiality/.test(filed.words || ''), '4c with the wording that was in the box');
    await shot('4-note-after-save.png');
    await press(page, '#context-panel [data-rl-np-unpin]');

    /* ============ 5. THE RIGHT PLACE, AND A NEW CLAUSE ============ */
    const law = await until(page, () => {
      const lane = document.querySelector('#clause-editor #ce-lane');
      return lane && /Risk 2 of 3/.test(lane.textContent) && /Missing governing law/.test(lane.textContent) && !lane.querySelector('.rk-busy') ? { clause: clauseEditorClauseId() } : null;
    }, null, 10000);
    const lawClause = await page.evaluate(id => (negoClauseList(getContract(id)).find(x => /Governing law/i.test(x.headingText || x.title || '')) || {}).clauseId, ID);
    check(!!law && law.clause === lawClause, '5a after the note, risk 2 opens: "Missing governing law" changes clause 4, never a second one', law && law.clause);
    await shot('5-right-place.png');

    /* ============ 6. LAST RISK DONE ============ */
    const before6 = await page.evaluate(id => (getContract(id).changes || []).length, ID);
    await press(page, '[data-ce-act="rk-skip"]');
    const end = await until(page, () => {
      const lane = document.querySelector('#clause-editor #ce-lane');
      return lane && /That was the last risk/.test(lane.textContent) ? lane.innerText.replace(/\s+/g, ' ') : null;
    });
    check(!!end && /Saved as unsent redlines: 1 · skipped: 1 · covered by your redlines: 1\. Nothing was sent\./.test(end), '6a Skip to the end: "That was the last risk", what was saved, skipped and covered', end);
    check(!!end && /Need a new clause: 1/.test(end), '6b the risk that needs a new clause is said, not built around', end);
    check((await page.evaluate(id => (getContract(id).changes || []).length, ID)) === before6, '6c Skip filed nothing');
    check(await page.evaluate(() => !state.panelOpen), '6e the notes drawer went once the note was answered, so the rail shows the walk');
    await shot('6-last-risk-done.png');
    await press(page, '[data-ce-rk="back"]');
    check(!!(await until(page, () => !document.getElementById('clause-editor') && !!document.getElementById('rl-risks'))), '6d Back to Redlines closes the window');

    /* the new clause, drafted in the card — adds only, never after the signatures */
    await press(page, '#rl-risks [data-rk-key="s:t-inj"] [data-rk-act="edit-ce"]');
    const nc = await until(page, () => {
      const r = document.querySelector('#rl-risks .rk-row.is-open[data-rk-key="s:t-inj"]');
      if (!r || r.querySelector('.rk-busy')) return null;
      const opts = [...r.querySelectorAll('[data-rk-target] option')].map(o => o.textContent);
      return { opts, editor: !!document.getElementById('clause-editor') };
    });
    check(!!nc && !nc.editor && nc.opts.length > 0 && nc.opts.every(o => /^New clause after/.test(o)), '5b a risk that needs a new clause drafts in the card, adds only', nc && nc.opts.join(' | '));
    check(!!nc && !nc.opts.some(o => /Signatures/.test(o)), '5c and never after the signatures', nc && nc.opts.slice(-1)[0]);
    await shot('5b-new-clause-in-card.png');
    await press(page, '#rl-risks [data-rk-key="s:t-inj"] [data-rk-act="close"]');

    /* ============ 7. RISK VIEW ============ */
    await page.evaluate(id => { openWorkspace(id); roomGoTab(getContract(id), 'docs'); }, ID);
    await until(page, () => !!document.querySelector('[data-doc-read="2"]'));
    await press(page, '[data-doc-read="2"]');
    await until(page, () => document.querySelectorAll('[data-xr-seg]').length ? true : null);
    /* the clause map's segments, each pressed until one carries a risk mark */
    const rv = await until(page, () => {
      const x = document.getElementById('doc-xray'); if (!x) return null;
      const read = () => { const notes = x.querySelectorAll('[data-rk-note]').length;
        return notes || x.querySelector('.rk-done') ? { notes, go: x.querySelectorAll('[data-rk-go]').length, text: x.innerText } : null; };
      let got = read(); if (got) return got;
      for (const b of document.querySelectorAll('[data-xr-seg]')){ b.click(); got = read(); if (got) return got; }
      return null;
    });
    check(!!rv && rv.go === 0 && !/Draft a redline/.test(rv.text), '7a Risk View draws no "Draft a redline"', rv && rv.go);
    check(!!rv && (rv.notes > 0 || /Redline drafted/.test(rv.text)), '7b only "Add a note" (or the drafted mark) under a risk', rv && rv.notes);
    await shot('7-risk-view.png');

    /* ============ 8. SAFETY NET ============ */
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.getElementById('rl-risks'));
    /* THE REST THE SAFETY NET CATCHES: a risk of no known topic whose words
       are not the clause's own (so nothing marks it covered), placed by HaTi on
       the liability clause — where our redline is now an EARLIER round's, the
       one a new filing would NOT fold into */
    await page.evaluate(async ({ id, chId }) => {
      const c = getContract(id);
      c.scan.findings.push({ id: 't-cap', sev: 'med', kind: 'risk', title: 'Exposure ceiling is low', anchor: 'doc',
        quote: 'total liability shall not exceed the charges paid during the last three months',
        what: 'The ceiling on what either side pays is low.', why: 'It may not cover a real loss.', fix: 'Raise it.' });
      const ch = c.changes.find(x => x.id === chId);
      ch.roundN = (ch.roundN || 1) - 1;
      renderRedline();
    }, { id: ID, chId: filed && filed.id });
    await until(page, () => !!document.querySelector('#rl-risks [data-rk-key="s:t-cap"]'));
    await press(page, '#rl-risks [data-rk-key="s:t-cap"] [data-rk-act="edit-ce"]');
    const ready = await until(page, () => {
      const lane = document.querySelector('#clause-editor #ce-lane');
      const b = document.querySelector('[data-ce-act="rk-save"]');
      return lane && /Exposure ceiling is low/.test(lane.textContent) && !lane.querySelector('.rk-busy') && b && !b.disabled ? true : null;
    }, null, 10000);
    check(!!ready, '8- the risk is open on the liability clause with wording to save');
    const n8 = await page.evaluate(id => (getContract(id).changes || []).length, ID);
    await press(page, '[data-ce-act="rk-save"]');
    const dlg = await until(page, () => {
      const d = [...document.querySelectorAll('.modal, [role="dialog"], [role="alertdialog"]')].find(x => /already has your redline/.test(x.textContent));
      return d ? d.innerText.replace(/\s+/g, ' ') : null;
    });
    check(!!dlg && /already has your redline CHG-\d+/.test(dlg) && /Open CHG-\d+/.test(dlg), '8a the safety net stops: the clause already has your redline, Open it / Cancel', dlg);
    await page.waitForTimeout(400);
    await shot('8-safety-net.png');
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal button, [role="dialog"] button, [role="alertdialog"] button')].find(x => /^Cancel$/i.test(x.textContent.trim())); if (b) b.click(); });
    await page.waitForTimeout(300);
    check((await page.evaluate(id => (getContract(id).changes || []).length, ID)) === n8, '8b Cancel files nothing');
    await page.evaluate(() => { if (clauseEditorOpen()) rlCloseClauseEditor(); });

    /* ============ 9. DISCARD THE COVERING REDLINE, THE RISK COMES BACK ============ */
    const back = await page.evaluate(async ({ id, chId }) => {
      const c = getContract(id);
      const ch = c.changes.find(x => x.id === chId);
      if (!negoRetractDraft(c, chId, { side: 'owner' })) ch.withdrawn = true;
      return riskOpenOf(c).some(x => x.key === 's:t-pay');
    }, { id: ID, chId: pb });
    check(back, '9a discard the standards redline and the Payment risk is back on the list by itself');
    check(shares === 0, '9b nothing was sent', shares);
    check(errors.length === 0, '9c no page errors', errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check(false, 'stage ran', e.message + (errors.length ? ' | page errors: ' + errors.slice(0, 3).join(' | ') : ''));
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
