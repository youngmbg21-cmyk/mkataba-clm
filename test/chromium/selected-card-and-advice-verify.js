/* THE CARD FOLLOWS THE DRAFT, AND A RISK THAT ONLY ADVISES IS NOT A REDLINE
   (docs/WORKORDER-selected-card-and-advice-risks.md; Young, 5 Oct 2026)
   ============================================================
   Driven where the reader stands, Copilot scripted at its transport:
     1. ADVICE IS NOT A REDLINE — on an uploaded contract whose scan holds
        "Have qualified counsel review before signing", "Counterparty not
        recorded", "Quotes below come from a machine-read scan" and "Document
        text could not be read automatically", the Redlines card's "Risks to
        look at" lists none of them; its head, the list and the one count
        every tile reads agree; the walk counts only what can be put on paper
        and never lands on an empty clause with a refusal; a risk with no
        clause (data protection) still holds a new clause;
     2. THE CARD FOLLOWS THE DRAFT — in Edit with Copilot the "Selected ·
        <clause>" card quotes what the paper shows: after Apply on Copilot's
        Suggested wording, after Undo, and a beat after typing, the box
        keeping its focus while the card moves.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/selected-card-and-advice/ (or HATI_SHOT_DIR).
   Run: node test/chromium/selected-card-and-advice-verify.js */
/* RE-POINTED 7 Oct 2026 (Young, "Risk Walk Options" — One footer): on the risk
   walk the Suggested wording's Apply is the feet's top row, #ce-rksug. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'selected-card-and-advice');
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

const LIAB = 'Each party\'s total liability under this Agreement shall not exceed the charges paid in the preceding three (3) months.';
const LIAB_NEW = 'Each party\'s total liability under this Agreement shall not exceed the charges paid or payable in the preceding twelve (12) months.';
const BODY = '<h1>Warehousing Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Lager AB</p>'
  + '<h2>1. Services</h2><p>The Warehouse Operator shall store and handle the Goods with reasonable care.</p>'
  + `<h2>2. Limitation of liability</h2><p>${LIAB}</p>`
  + '<h2>3. Notices</h2><p>Notices shall be given in writing to the addresses above.</p>'
  + '<h2>4. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';
const SCAN = { at: '5 Oct 2026, 15:10', on: '2026-10-05', lang: 'en', dismissed: [], findings: [
  { id: 'u-cp', sev: 'high', kind: 'missing', title: 'Counterparty not recorded', anchor: 'doc',
    what: 'No counterparty name is recorded against this uploaded document.', why: 'Hard to enforce.', fix: 'Add the counterparty.' },
  { id: 'u-ocr', sev: 'med', kind: 'risk', title: 'Quotes below come from a machine-read scan', anchor: 'doc',
    what: 'Read from a scan.', why: 'OCR misreads.', fix: 'Check every quote.' },
  { id: 't-liab', sev: 'high', kind: 'risk', title: 'Liability cap may be too low', anchor: 'doc', quote: LIAB,
    what: 'Liability is capped at three months of charges.', why: 'A loss could cost far more than the cap.', fix: 'Raise the cap to twelve months.' },
  { id: 'u-noext', sev: 'low', kind: 'missing', title: 'Document text could not be read automatically', anchor: 'doc',
    what: 'No text.', why: 'Nothing to analyse.', fix: 'Re-scan.' },
  { id: 't-dp', sev: 'low', kind: 'missing', title: 'No data-protection terms detected', anchor: 'doc',
    what: 'No personal-data clause.', why: 'You stay responsible.', fix: 'Add a data-protection clause.' },
  { id: 'u-legal', sev: 'low', kind: 'missing', title: 'Have qualified counsel review before signing', anchor: 'doc',
    what: 'This Copilot review flags common issues but is not legal advice and cannot catch everything.',
    why: 'External paper is drafted for the other side; a clause-by-clause read by a lawyer catches what heuristics miss.',
    fix: 'Obtain independent legal review before signing where the value or risk is material.' },
] };

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-SCA1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust warehousing agreement', counterparty: 'Nordkust Lager AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    upload: { name: 'Warehousing_Agreement_v2.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let shares = 0;
  page.on('request', r => { if (/\/api\/shares/.test(r.url()) && r.method() !== 'GET') shares++; });
  const shot = n => page.screenshot({ path: path.join(OUT, n) });
  /* The card as the reader sees it, and the clause as the paper draws it. */
  const cardNow = () => page.evaluate(() => {
    const q = document.querySelector('#clause-editor #ce-scope.ce-tag:has([data-ce-act="scope-contract"]) .w');
    const vis = !!q && q.getClientRects().length > 0;
    return { quote: q ? q.textContent.replace(/\s+/g, ' ').trim() : null, vis,
      box: (window.ceBoxWords ? ceBoxWords() : '').replace(/\s+/g, ' ').trim() };
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskEditStart === 'function' && typeof rlOpenClauseEditor === 'function'))) throw new Error('there is no risk list or clause editor on this build');
    await page.evaluate(({ LIAB_NEW }) => {
      state.aiConfigured = true;
      window._scAsked = [];
      window.copilotAsk = async msgs => {
        const t = String((msgs[0] || {}).content || '');
        window._scAsked.push(t);
        const words = /Draft ONE new contract clause/.test(t)
          ? 'Each party shall process personal data received under this Agreement only in accordance with applicable data protection law.'
          : LIAB_NEW;
        return { answer: JSON.stringify({ proposedText: words, advice: 'Drafted.' }) };
      };
    }, { LIAB_NEW });
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));

    /* ============ 1. ADVICE IS NOT A REDLINE ============ */
    const list = await until(page, () => {
      if (!document.getElementById('rl-risks') && window.renderRedline) renderRedline();
      const p = document.getElementById('rl-risks'); if (!p) return null;
      const rows = [...p.querySelectorAll('.rk-row[data-rk-key]:not(.is-covered):not(.is-gone)')];
      return { head: (p.querySelector('.rk-h b') || {}).textContent || '', keys: rows.map(r => r.getAttribute('data-rk-key')),
        text: p.textContent.replace(/\s+/g, ' ') };
    });
    check(!!list, '1- the Redlines card has its "Risks to look at"');
    check(!!list && !/qualified counsel/i.test(list.text), '1a no "Have qualified counsel review before signing" row', list && list.keys.join(','));
    check(!!list && !/Counterparty not recorded|machine-read scan|could not be read automatically/.test(list.text),
      '1b nor the scan\'s other advice and record checks');
    check(!!list && list.keys.slice().sort().join(',') === 's:t-dp,s:t-liab', '1c only what can be put on paper is listed', list && list.keys.join(','));
    const counts = await page.evaluate(id => ({ open: riskOpenOf(getContract(id)).length, scan: openFindings(getContract(id)).length }), ID);
    check(!!list && /· 2$/.test(list.head) && counts.open === 2, '1d the card\'s head, its rows and the one count every tile reads all say 2', list && (list.head + ' / ' + counts.open));
    check(counts.scan === 6, '1e the scan itself still holds all six, for every other reader', counts.scan);
    const fact = await page.evaluate(() => { const f = [...document.querySelectorAll('#ws-facts .room-facet')].find(x => /copilot/i.test((x.querySelector('.l') || {}).textContent || ''));
      return f ? f.querySelector('.v').textContent.replace(/\s+/g, ' ').trim() : null; });
    check(fact == null || !/\d/.test(fact) || /\b2 to look at/.test(fact), '1f the head\'s Copilot fact counts the same two', fact == null ? 'not drawn here' : fact);
    await shot('1-the-list.png');

    /* the walk: Risk 1 of 2, then the data-protection clause, then done */
    await press(page, '#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]');
    const r1 = await until(page, () => {
      const lane = document.querySelector('#clause-editor #ce-lane');
      return lane && !lane.querySelector('.rk-busy') && document.querySelector('#ce-rksug [data-ce-apply="rk:0"]') ? lane.textContent.replace(/\s+/g, ' ') : null;
    }, null, 10000);
    /* RE-POINTED 6 Oct 2026 ("one Copilot editor"): the step count is gone;
       the panel's dropdown lists the open risks the walk goes through */
    const nRisks = await page.evaluate(() => document.querySelectorAll('#ce-pick-sel option:not([disabled])').length);
    check(!!r1 && nRisks === 2, '1g the walk counts only the two paper risks', nRisks);

    /* ============ 2. THE CARD FOLLOWS THE DRAFT ============
       RE-POINTED 6 Oct 2026 (Young, "one Copilot editor": the Selected card is
       removed): what it said rides as a tag in the ask box. At rest it says
       "This clause" and quotes nothing, so nothing can go stale behind the
       paper — through Apply, Undo and typing alike. */
    const c0 = await cardNow();
    check(c0.vis && c0.quote === 'This clause', '2a the tag in the ask box names the clause and quotes nothing', c0.quote);
    await shot('2a-card-at-rest.png');
    await press(page, '#ce-rksug [data-ce-apply="rk:0"]');
    const c1 = await until(page, () => /twelve \(12\) months/.test(ceBoxWords()) ? true : null) && await cardNow();
    check(!!c1 && /twelve \(12\) months/.test(c1.box), '2- Apply moved Copilot\'s wording onto the paper');
    check(!!c1 && c1.quote === 'This clause', '2b after Apply nothing on the tag can go stale', c1 && c1.quote);
    await shot('2b-after-apply.png');
    await press(page, '#ce-undo');
    const c2 = await until(page, () => /three \(3\) months/.test(ceBoxWords()) ? true : null) && await cardNow();
    check(!!c2 && c2.quote === 'This clause', '2c after Undo the same', c2 && c2.quote);

    /* typing: click into the wording, type at the end, never leave the box */
    const para = await page.evaluate(() => { const p = [...document.querySelectorAll('#ce-doc [data-clause] p')].find(x => /three \(3\) months/.test(x.textContent));
      if (!p) return null; const r = p.getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 }; });
    if (para) await page.mouse.click(para.x, para.y);
    const typing = await until(page, () => document.getElementById('ce-clausebody') && document.getElementById('ce-clausebody').isContentEditable ? true : null);
    check(!!typing, '2- a click in the wording lets the reader type');
    if (typing){
      await page.evaluate(() => { const b = document.getElementById('ce-clausebody');
        const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); b.focus(); });
      await page.keyboard.type(' Fraud is never capped.');
      const c3 = await until(page, () => { const q = document.querySelector('#ce-scope.ce-tag:has([data-ce-act="scope-contract"]) .w');
        return q && q.textContent.trim() === 'This clause' ? true : null; }, null, 4000);
      const still = await page.evaluate(() => ({ focus: document.activeElement && document.activeElement.id,
        caretIn: (() => { const s = window.getSelection(); return !!(s && s.anchorNode && document.getElementById('ce-clausebody').contains(s.anchorNode)); })() }));
      check(!!c3, '2d while typing, the tag still names the clause and quotes nothing');
      check(still.focus === 'ce-clausebody' && still.caretIn, '2e and the box kept its focus and its caret', JSON.stringify(still));
      await shot('2d-while-typing.png');
      await page.keyboard.type(' Nor is wilful default.');
      const c4 = await until(page, () => { const q = document.querySelector('#ce-scope.ce-tag:has([data-ce-act="scope-contract"]) .w');
        return q && q.textContent.trim() === 'This clause' ? true : null; }, null, 4000);
      check(!!c4, '2f and so it stays as the reader goes on typing');
    }

    /* back to the walk: Skip twice, never an advice row, never a refusal */
    await page.evaluate(() => { if (window.ceForgetUnfiled) ceForgetUnfiled(); });
    await press(page, '[data-ce-act="rk-skip"]');
    const r2 = await until(page, () => {
      const lane = document.querySelector('#clause-editor #ce-lane');
      const hd = lane && lane.querySelector('.rk-ce-head');
      return hd && /data protection/i.test(hd.textContent) && !lane.querySelector('.rk-busy') ? lane.textContent.replace(/\s+/g, ' ') : null;
    }, null, 10000);
    check(!!r2 && /data-protection|data protection/i.test(r2) && /Where it goes/i.test(r2), '1h the second risk is data protection, held as a new clause', r2 && r2.slice(0, 120));
    check(!!r2 && !/could not draft|passage shown is empty/i.test(r2), '1i with no refusal from Copilot');
    await shot('1h-risk-2-of-2.png');
    await press(page, '[data-ce-act="rk-skip"]');
    const done = await until(page, () => { const lane = document.querySelector('#clause-editor #ce-lane');
      return lane && /last risk/i.test(lane.textContent) ? lane.textContent.replace(/\s+/g, ' ') : null; }, null, 6000);
    check(!!done && !/qualified counsel/i.test(done), '1j the walk ends after two — it never opened an advice row', done && done.slice(0, 120));

    check(shares === 0, '9a nothing was sent', shares);
    check(errors.length === 0, '9b no page errors', errors.join(' | ') || 'none');
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
