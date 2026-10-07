/* A SUGGESTION SHOWS ONLY WHAT IT CHANGES, THE PREPARED QUESTIONS WEAR THE
   PLATFORM'S COLOUR, AND EVERY CROSSED-OUT WORD IS RED
   (Young, 7 Oct 2026, the one-build work order, parts B, C and G)
   ============================================================
   Driven in Edit with Copilot on the Negotiate page, Suggestions tab:
     B. A clause with three sub-clauses; Copilot changes ONE. The Suggested
        wording shows that sub-clause's heading and its marked sentence, NOT
        the other two sub-clauses' words, and one line counts what was left
        out. Apply still puts the WHOLE clause in the box.
     C. The prepared questions over the ask box are shaded: their ground is
        not white and their ink is the accent ink — on both brands.
     G. A struck run is red (the ruby token) and so is its line, ours on the
        Copilot panel and on the paper, theirs on the paper; an insertion
        keeps its side's colour. Light and dark.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/suggestion-shows-what-moved/ (or HATI_SHOT_DIR).
   Run: node test/chromium/suggestion-shows-what-moved-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'suggestion-shows-what-moved');
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

const RENT = 'The Tenant shall pay the Base Rent monthly in advance on the first day of each month.';
const DEPOSIT = 'The Tenant shall lodge a security deposit equal to three months of Base Rent.';
const UTIL = 'The Tenant shall pay its share of utilities and operating costs as invoiced.';
const RENT_NEW = RENT + ' Late payments shall carry interest at the reference rate plus eight per cent. Rent is payable without set-off.';
const BODY = '<h1>Lease Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Fastigheter AB</p>'
  + '<h2>1. Premises</h2><p>The Landlord lets the premises at Storgatan 4 to the Tenant.</p>'
  + `<h2>2. Rent</h2><p><b>2.1 Base Rent.</b></p><p>${RENT}</p><p><b>2.2 Security Deposit.</b></p><p>${DEPOSIT}</p><p><b>2.3 Utilities and Operating Costs.</b></p><p>${UTIL}</p>`
  + '<h2>3. Term</h2><p>This lease runs for three years from the start date.</p>'
  + '<h2>4. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-SW1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Storgatan lease', counterparty: 'Nordkust Fastigheter AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'lease' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 1200000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    upload: { name: 'Lease_v2.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  const railShot = n => page.locator('#clause-editor .ce-rail').screenshot({ path: path.join(OUT, n) }).catch(() => {});
  /* the ruby the tokens give, measured off a probe so light and dark both answer */
  const ruby = () => page.evaluate(() => {
    const s = document.createElement('span'); s.style.color = 'var(--st-ruby-fg)'; document.body.appendChild(s);
    const v = getComputedStyle(s).color; s.remove(); return v;
  });
  const delOf = (page, sel) => page.evaluate(sel => {
    const d = document.querySelector(sel); if (!d) return null;
    const k = getComputedStyle(d);
    return { color: k.color, line: k.textDecorationLine, lineColor: k.textDecorationColor };
  }, sel);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    await page.evaluate(RENT_NEW => {
      state.aiConfigured = true;
      window._swAsk = 0;
      window.copilotAsk = async () => { window._swAsk++; return { answer: JSON.stringify({ proposedText: window._swText, advice: 'Add interest on late payment.' }) }; };
    }, RENT_NEW);
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    const cl = await page.evaluate(id => {
      const c = getContract(id);
      const x = negoClauseList(c).find(k => /Rent/.test(k.headingText || k.title || '') && !/Premises/.test(k.headingText || ''));
      return x ? { id: x.clauseId, html: x.bodyHtml || '' } : null;
    }, ID);
    if (!cl) throw new Error('no Rent clause on the paper');
    /* Copilot's answer: the same clause, ONE sub-clause changed */
    await page.evaluate(([html, RENT, RENT_NEW]) => {
      window._swText = String(html).replace(RENT, RENT_NEW);
    }, [cl.html, RENT, RENT_NEW]);
    const swOk = await page.evaluate(RENT_NEW => String(window._swText || '').includes(RENT_NEW), RENT_NEW);
    if (!swOk) throw new Error('could not build the scripted answer from the clause');
    await page.evaluate(([id, cid]) => rlOpenClauseEditor(getContract(id), cid), [ID, cl.id]);
    const open = await until(page, () => !!document.querySelector('#clause-editor #ce-lane') && !!document.querySelector('#ce-chips button'), null, 12000);
    check(!!open, '0 Edit with Copilot opens on the Rent clause with its prepared questions');
    if (!open) throw new Error('the editor did not open');

    /* ---- C. THE PREPARED QUESTIONS ARE SHADED ---- */
    const chipOf = () => page.evaluate(() => {
      const b = document.querySelector('#ce-chips button'); if (!b) return null;
      const probe = document.createElement('span'); probe.style.color = 'var(--accent-ink)'; probe.style.background = 'var(--color-accent-50)';
      document.body.appendChild(probe); const p = getComputedStyle(probe);
      const want = { bg: p.backgroundColor, ink: p.color }; probe.remove();
      const k = getComputedStyle(b);
      return { bg: k.backgroundColor, ink: k.color, want };
    });
    const c1 = await chipOf();
    check(!!c1 && c1.bg === c1.want.bg && c1.bg !== 'rgb(255, 255, 255)' && c1.ink === c1.want.ink, 'C1 a prepared question wears the pale accent ground and the accent ink', c1 && JSON.stringify(c1));
    await railShot('1-chips-green.png');
    const other = await page.evaluate(() => { if (typeof setBrand !== 'function' || !window.BRANDS) return null;
      const now = window._swBrandWas = brandNow();
      return BRANDS.find(b => b !== now) || null; });
    const was = await page.evaluate(() => window._swBrandWas || null);
    const navy = !!other && await page.evaluate(b => { setBrand(b); return true; }, other);
    if (navy){
      await page.waitForTimeout(200);
      const c2 = await chipOf();
      check(!!c2 && c2.bg === c2.want.bg && c2.bg !== c1.bg, 'C2 on the other brand ('+other+') the shade follows the brand', c2 && JSON.stringify(c2));
      await railShot('2-chips-navy.png');
      if (was) await page.evaluate(b => setBrand(b), was);
    } else check(false, 'C2 the brand can be switched');

    /* ---- B. ONLY WHAT MOVED ---- */
    await page.evaluate(() => ceAsk('Add interest on late payment'));
    const b = await until(page, ([DEPOSIT, UTIL]) => {
      const pv = [...document.querySelectorAll('#ce-lane .ce-card.ce-sug .pv')].pop(); if (!pv) return null;
      const t = pv.textContent.replace(/\s+/g, ' ');
      return { base: /2\.1 Base Rent/.test(t), ins: !!pv.querySelector('ins'), dep: t.includes(DEPOSIT.slice(0, 40)), util: t.includes(UTIL.slice(0, 40)),
        other: /2\.2 Security|2\.3 Utilities/.test(t), left: (pv.querySelector('.ce-sug-left') || {}).textContent || '' };
    }, [DEPOSIT, UTIL], 12000);
    check(!!b && b.base && b.ins, 'B1 the card shows the changed sub-clause under its own heading, marked', b && JSON.stringify(b));
    check(!!b && !b.dep && !b.util && !b.other, 'B2 the two untouched sub-clauses are not drawn', b && JSON.stringify(b));
    check(!!b && /not shown/.test(b.left) && /\d/.test(b.left), 'B3 one quiet line counts what was left out', b && b.left);
    await railShot('3-only-what-moved.png');

    /* ---- G. CROSSED-OUT WORDS ARE RED (the Copilot panel) ---- */
    const r0 = await ruby();
    /* a deletion in the panel: ask again with the deposit sentence cut */
    await page.evaluate(([DEPOSIT]) => { window._swText = String(window._swText).replace(DEPOSIT, 'The Tenant shall lodge a deposit.'); }, [DEPOSIT]);
    await page.evaluate(() => ceAsk('Shorter deposit'));
    await until(page, () => { const pv = [...document.querySelectorAll('#ce-lane .ce-card.ce-sug .pv')].pop(); return pv && pv.querySelector('del') ? true : null; }, null, 12000);
    const g1 = await page.evaluate(() => {
      const pv = [...document.querySelectorAll('#ce-lane .ce-card.ce-sug .pv')].pop(); const d = pv && pv.querySelector('del');
      if (!d) return null; const k = getComputedStyle(d);
      return { color: k.color, line: k.textDecorationLine, lineColor: k.textDecorationColor };
    });
    check(!!g1 && g1.color === r0 && /line-through/.test(g1.line) && g1.lineColor === r0, 'G1 in the Copilot panel a struck word and its line are red', g1 && JSON.stringify(g1) + ' want ' + r0);
    await railShot('4-panel-red.png');

    /* Apply still carries the WHOLE clause */
    await press(page, '#ce-lane .ce-card.ce-sug [data-ce-apply]');
    const box = await until(page, ([UTIL]) => { const w = window.ceBoxWords ? ceBoxWords() : ''; return w.includes(UTIL.slice(0, 40)) && /reference rate/.test(w) ? w.length : null; }, [UTIL]);
    check(!!box, 'B4 Apply still puts the whole clause in the box (untouched sub-clauses included)', box);
    await page.evaluate(() => { if (window.clauseEditorOpen && clauseEditorOpen()){ window.confirmDialog = async () => true; rlCloseClauseEditor(); } });

    /* ---- G. on the paper: ours and theirs ---- */
    await page.evaluate(async ([id, cid, RENT]) => {
      const c = getContract(id);
      await negoEditClause(c, cid, String(window._swText).replace(RENT, 'The Tenant shall pay rent.'), { side: 'owner' });
      const prem = negoClauseList(c).find(k => /Premises/.test(k.headingText || k.title || ''));
      await negoEditClause(c, prem.clauseId, '<p>The Landlord lets the premises to the Tenant.</p>', { side: 'counterparty' });
      renderRedline();
    }, [ID, cl.id, RENT]);
    const paper = await until(page, () => document.querySelector('.redline-page del.rl-us') && document.querySelector('.redline-page del.rl-them') ? true : null, null, 10000);
    check(!!paper, 'G2 the paper draws a struck run of ours and one of theirs');
    const us = await delOf(page, '.redline-page .rl-doc del.rl-us, .redline-page del.rl-us');
    const them = await delOf(page, '.redline-page .rl-doc del.rl-them, .redline-page del.rl-them');
    check(!!us && us.color === r0 && us.lineColor === r0 && /line-through/.test(us.line), 'G3 OUR struck words on the paper are red, line and all', us && JSON.stringify(us));
    check(!!them && them.color === r0 && them.lineColor === r0 && /line-through/.test(them.line), 'G4 THEIR struck words on the paper are red, line and all', them && JSON.stringify(them));
    const ins = await page.evaluate(() => { const i = document.querySelector('.redline-page ins.rl-us'); return i ? getComputedStyle(i).color : null; });
    check(!!ins && ins !== r0, 'G5 an insertion keeps its side\'s colour', ins);
    await shot('5-paper-light.png');
    await page.evaluate(id => { setDark(true); roomGoTab(getContract(id), 'redline'); }, ID);
    await page.waitForTimeout(300);
    const r1 = await ruby();
    await until(page, () => document.querySelector('.redline-page del.rl-us') && document.querySelector('.redline-page del.rl-them') ? true : null, null, 10000);
    const usD = await delOf(page, '.redline-page del.rl-us');
    const themD = await delOf(page, '.redline-page del.rl-them');
    check(!!usD && !!themD && r1 !== r0 && usD.color === r1 && themD.color === r1 && usD.lineColor === r1, 'G6 at night the struck words take the dark ruby', JSON.stringify({ r1, usD, themD }));
    await shot('6-paper-dark.png');
  } catch (e){
    console.log('  FAIL — stopped: ' + (e && e.message));
    failures++;
  }
  check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
