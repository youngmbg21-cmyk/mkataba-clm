/* COPILOT PANEL TIDY-UP AND THE RISK WALK'S ONE FOOTER
   (Young, 7 Oct 2026: "Header line, Shaded column, Sticky bar", then
   "implement all your recommendations on panel tidy up and on the risks")
   ============================================================
   Driven where the reader stands, in Edit with Copilot opened from a risk's
   Edit on the Negotiate page, then on the Suggestions tab:
     A. HEADER LINE — the scope tag sits on its own line over the box
        ("Asking about" · the tag), a filled pill with its ×, and the typed
        question starts at the box's left edge; while typing ONE focus mark
        is painted (the box's bottom line), not a second ring round the
        textarea.
     B. SHADED COLUMN — the facts under the answer: the label cell's ground
        differs from the explanation's, and a 2px line is painted between.
     C. STICKY BAR — the Suggested wording is not a window: nothing inside it
        scrolls, no Expand is drawn and there is no #ce-full; on the
        Suggestions tab its buttons are sticky inside the lane.
     D. ONE FOOTER — on the risk walk the suggestion's Apply · Ask for a
        change · votes are the footer's top row (#ce-rksug), none in the
        lane; Save & next is grey before Apply; after Apply the row says
        Applied and Save & next can be pressed; the row is gone off the
        Risks tab.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/panel-tidy-and-risk-footer/ (or HATI_SHOT_DIR).
   Run: node test/chromium/panel-tidy-and-risk-footer-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'panel-tidy-and-risk-footer');
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
const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the agreed specification and quality.</p>'
  + '<h2>2. Confidentiality</h2><p>Each party shall keep the other party\'s information confidential.</p>'
  + `<h2>3. Limitation of liability</h2><p>${LIAB}</p>`
  + '<h2>4. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';
const SCAN = { at: '7 Oct 2026, 09:10', on: '2026-10-07', lang: 'en', dismissed: [], findings: [
  { id: 't-liab', sev: 'high', kind: 'risk', title: 'Liability cap may be too low', anchor: 'doc', quote: LIAB,
    what: 'Liability is capped at three months of charges.', why: 'A data breach could cost far more than the cap.', fix: 'Raise the cap to twelve months.' },
] };
/* long enough that a window would have scrolled */
const LIAB_NEW = 'Each party\'s total liability under this Agreement shall not exceed the charges paid or payable in the preceding twelve (12) months, '
  + 'save that this limit shall not apply to a breach of confidentiality, to a party\'s indemnity obligations, to death or personal injury caused by negligence, '
  + 'or to fraud or fraudulent misrepresentation, and each party shall take reasonable steps to mitigate any loss it suffers under or in connection with this Agreement.';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-PT1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  const railShot = n => page.locator('#clause-editor .ce-rail').screenshot({ path: path.join(OUT, n) }).catch(() => {});
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskEditStart === 'function'))) throw new Error('there is no risk walk on this build');
    await page.evaluate(LIAB_NEW => {
      state.aiConfigured = true;
      window.copilotAsk = async () => ({ answer: JSON.stringify({ proposedText: LIAB_NEW, advice: 'Raise the cap and carve out the usual exceptions.' }) });
    }, LIAB_NEW);
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    /* a redline on the table, as the Negotiate page holds one before its risks list shows */
    await page.evaluate(async id => { const c = getContract(id);
      const cl = negoClauseList(c).find(x => /Supply/.test(x.headingText || x.title || ''));
      await negoEditClause(c, cl.clauseId, '<p>The Supplier shall supply the goods to the agreed specification, quality and delivery dates.</p>', { side: 'owner' });
      renderRedline(); }, ID);
    await until(page, () => !!document.querySelector('#rl-risks [data-rk-key="s:t-liab"]'), null, 12000);
    await press(page, '#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]');
    const up = await until(page, () => !!document.querySelector('#clause-editor #ce-lane .ce-card .pv') && document.querySelector('[data-ce-tab="risks"].is-on'), null, 12000);
    check(!!up, '0 Edit with Copilot opens on the Risks tab with a Suggested wording');
    if (!up) throw new Error('the editor did not open on the risk');
    await railShot('1-risk-walk-before-apply.png');

    /* ---- A. HEADER LINE ---- */
    const a = await page.evaluate(() => {
      const box = document.querySelector('#ce-askrow .ce-askbox'), ta = document.getElementById('ce-ask');
      const line = document.getElementById('ce-tagline'), tag = document.getElementById('ce-scope');
      if (!box || !ta) return null;
      const br = box.getBoundingClientRect(), tr = ta.getBoundingClientRect();
      const tagR = tag ? tag.getBoundingClientRect() : null;
      const x = tag && tag.querySelector('button');
      return { line: !!line && line.getClientRects().length > 0, words: line ? line.textContent.replace(/\s+/g, ' ').trim() : '',
        tagAbove: !!tagR && tagR.bottom <= tr.top + 1, taLeft: Math.round(tr.left - br.left),
        pillBg: tag ? getComputedStyle(tag).backgroundColor : '', pillInk: tag ? getComputedStyle(tag).color : '', boxBg: getComputedStyle(box).backgroundColor,
        x: x ? Math.round(x.getBoundingClientRect().width) : 0 };
    });
    check(!!a && a.line && /Asking about/.test(a.words), 'A1 the tag sits on its own line, "Asking about"', a && a.words);
    check(!!a && a.tagAbove && a.taLeft <= 2, 'A2 the question starts at the box\'s left edge, under the tag', a && JSON.stringify({ tagAbove: a.tagAbove, taLeft: a.taLeft }));
    check(!!a && a.pillBg !== a.boxBg && !/rgba\(0, 0, 0, 0\)/.test(a.pillBg) && a.pillInk === 'rgb(255, 255, 255)' && a.x >= 16, 'A3 the tag is a filled pill with a × the hand can find', a && JSON.stringify({ pill: a.pillBg, ink: a.pillInk, x: a.x }));
    await page.focus('#ce-ask');
    await page.keyboard.type('Keep the cap but carve out data protection');
    const f = await page.evaluate(() => {
      const box = document.querySelector('#ce-askrow .ce-askbox'), ta = document.getElementById('ce-ask');
      const k = getComputedStyle(ta), b = getComputedStyle(box);
      return { taOutline: k.outlineStyle + ' ' + k.outlineWidth, taShadow: k.boxShadow, boxShadow: b.boxShadow };
    });
    const taRing = !/^none/.test(f.taOutline) && !/^\S+ 0px/.test(f.taOutline.replace(/^\S+ /, 'x ')) || (f.taShadow && f.taShadow !== 'none');
    check(!taRing && /inset/.test(f.boxShadow), 'A4 while typing, ONE focus mark: the box\'s bottom line, no ring round the textarea', JSON.stringify(f));
    await railShot('2-typing.png');
    await page.evaluate(() => { const t = document.getElementById('ce-ask'); t.value = ''; t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); });

    /* ---- B. SHADED COLUMN ---- */
    const b = await page.evaluate(() => {
      const li = document.querySelector('#ce-lane .ce-read li'); if (!li) return null;
      const k = li.querySelector('b'), v = li.querySelector('span');
      const kb = getComputedStyle(k), vb = getComputedStyle(v);
      return { kBg: kb.backgroundColor, vBg: vb.backgroundColor, line: kb.borderRightStyle + ' ' + kb.borderRightWidth, caps: kb.textTransform };
    });
    check(!!b && b.kBg !== b.vBg, 'B1 the labels\' column has its own ground', b && JSON.stringify(b));
    check(!!b && /^solid 2px$/.test(b.line) && b.caps !== 'uppercase', 'B2 a 2px line is painted between labels and explanations, labels in normal case', b && b.line + ' ' + b.caps);

    /* ---- C. NO WINDOW, NO EXPAND ---- */
    const c = await page.evaluate(() => {
      const pv = document.querySelector('#ce-lane .ce-card .pv');
      return { pv: pv ? pv.scrollHeight - pv.clientHeight : 99, expand: document.querySelectorAll('[data-ce-expand]').length, full: !!document.getElementById('ce-full'),
        cardBg: pv ? getComputedStyle(pv.closest('.ce-card')).backgroundColor : '' };
    });
    check(c.pv <= 1, 'C1 nothing inside the Suggested wording scrolls (the wording is printed whole)', c.pv);
    check(c.expand === 0 && !c.full, 'C2 no Expand and no full-panel view', JSON.stringify(c));

    /* ---- D. ONE FOOTER ---- */
    const d0 = await page.evaluate(() => {
      const row = document.getElementById('ce-rksug'), lane = document.getElementById('ce-lane');
      const save = document.querySelector('[data-ce-act="rk-save"]');
      return { row: !!row && !row.hidden && row.getClientRects().length > 0, apply: row ? !!row.querySelector('[data-ce-apply="rk:0"]:not([disabled])') : false,
        laneApply: lane ? lane.querySelectorAll('[data-ce-apply]').length : -1, saveOff: !!save && save.disabled,
        rowAbove: !!row && !!save && row.getBoundingClientRect().bottom <= save.getBoundingClientRect().top + 1 };
    });
    check(d0.row && d0.apply && d0.laneApply === 0, 'D1 Apply · Ask for a change · votes are the footer\'s top row, none in the lane', JSON.stringify(d0));
    check(d0.rowAbove && d0.saveOff, 'D2 the row sits over the walk\'s row, and Save & next is grey before Apply', JSON.stringify(d0));
    await press(page, '#ce-rksug [data-ce-apply="rk:0"]');
    const d1 = await until(page, () => {
      const a = document.querySelector('#ce-rksug [data-ce-apply="rk:0"]'), save = document.querySelector('[data-ce-act="rk-save"]');
      return a && /Applied/.test(a.textContent) ? { word: a.textContent, off: a.disabled, save: !!save && !save.disabled, box: /twelve \(12\) months/.test(ceBoxWords()) } : null;
    });
    check(!!d1 && d1.box && d1.off, 'D3 Apply moves the wording into the box and the row says Applied', d1 && JSON.stringify(d1));
    check(!!d1 && d1.save, 'D4 Save & next can be pressed once applied', d1 && JSON.stringify(d1));
    await railShot('3-risk-walk-after-apply.png');

    /* ---- C3 / D5: the Suggestions tab ---- */
    await press(page, '[data-ce-tab="chat"]');
    const off = await until(page, () => { const r = document.getElementById('ce-rksug'); return (!r || r.hidden) ? true : null; });
    check(!!off, 'D5 off the Risks tab the suggestion row is gone');
    await page.evaluate(() => ceAsk('Make it firmer'));
    const s = await until(page, () => {
      const card = [...document.querySelectorAll('#ce-lane .ce-card.ce-sug')].pop(); if (!card) return null;
      const av = card.querySelector(':scope > .av');
      return av ? { pos: getComputedStyle(av).position, apply: !!av.querySelector('[data-ce-apply]'), bg: getComputedStyle(card).backgroundColor } : null;
    }, null, 10000);
    check(!!s && s.pos === 'sticky' && s.apply, 'C3 on the Suggestions tab Apply sits in a bar that sticks to the panel\'s bottom edge', s && JSON.stringify(s));
    await page.evaluate(() => { const l = document.getElementById('ce-lane'); l.scrollTop = Math.max(0, l.scrollHeight - l.clientHeight - 120); });
    await railShot('4-suggestions-sticky.png');
    await shot('5-whole-page.png');
    /* the same rail in dark, to be looked at */
    const dark = await page.evaluate(() => { if (typeof setDark !== 'function') return false; setDark(true); return true; });
    if (dark){ await page.waitForTimeout(300); await page.evaluate(() => { const l = document.getElementById('ce-lane'); l.scrollTop = 0; }); await railShot('6-dark.png'); }
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
