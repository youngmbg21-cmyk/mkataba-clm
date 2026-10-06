/* ONLY A RISK THAT NEEDS WORDING GOES IN THE REDLINES CARD
   (Young, 5 Oct 2026: "any risks that do not require an amendment to the
   contract or need additional language to contract should not be moved to the
   redline panel", then "Go ahead")
   ============================================================
   Driven where the reader stands, on an uploaded agreement whose scan holds
   three notes that only report a fact — "Governing law: Sweden (found in
   text)", "Payment terms: 30 days", "Termination notice: 90 days" — beside one
   that needs wording, and a brief whose watch-outs and unusual terms Copilot
   marked:
     1. the Redlines card lists only what needs wording: the liability risk,
        the watch-out marked true, and the one an older brief left unmarked;
     2. the card's head, its rows, the one count every tile reads and the
        head's "Copilot · N to look at" all agree;
     3. the scan still holds every finding for every other reader.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/only-what-needs-wording/ (or HATI_SHOT_DIR).
   Run: node test/chromium/only-what-needs-wording-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'only-what-needs-wording');
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

const LIAB = 'Each party\'s total liability under this Agreement shall not exceed the charges paid in the preceding three (3) months.';
const BODY = '<h1>Warehousing Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Lager AB</p>'
  + '<h2>1. Services</h2><p>The Warehouse Operator shall store and handle the Goods with reasonable care.</p>'
  + '<h2>2. Payment</h2><p>The Depositor shall pay each invoice within 30 days of receipt.</p>'
  + `<h2>3. Limitation of liability</h2><p>${LIAB}</p>`
  + '<h2>4. Termination</h2><p>Either party may terminate on ninety (90) days\' written notice.</p>'
  + '<h2>5. Governing law</h2><p>This Agreement is governed by the laws of Sweden.</p>'
  + '<h2>6. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';
const SCAN = { at: '5 Oct 2026, 16:20', on: '2026-10-05', lang: 'en', dismissed: [], findings: [
  { id: 't-law', sev: 'low', kind: 'ambiguity', title: 'Governing law: Sweden (found in text)', anchor: 'doc', quote: 'governed by the laws of Sweden',
    what: 'governed by the laws of Sweden', why: 'Home law.', fix: 'Confirm.' },
  { id: 't-pay', sev: 'low', kind: 'ambiguity', title: 'Payment terms: 30 days', anchor: 'doc', quote: 'within 30 days of receipt',
    what: 'within 30 days', why: 'Reasonable.', fix: 'Confirm.' },
  { id: 't-term', sev: 'low', kind: 'ambiguity', title: 'Termination notice: 90 days', anchor: 'doc', quote: 'ninety (90) days',
    what: 'ninety (90) days', why: 'How fast you can leave.', fix: 'Confirm.' },
  { id: 't-liab', sev: 'med', kind: 'risk', title: 'Liability / indemnity — review carefully', anchor: 'doc', quote: LIAB,
    what: 'Liability is capped at three months.', why: 'A loss could cost more.', fix: 'Raise the cap.' },
] };
const BRIEF = { at: new Date().toISOString(), by: 'Stage', truncated: false, data: {
  overview: 'A warehousing agreement.',
  watchouts: [
    { point: 'The operator can raise storage rates on 30 days’ notice.', why: 'Costs can rise mid-term.', quote: 'reasonable care', wording: true },
    { point: 'The operator’s insurance certificate must be kept current.', why: 'A lapse leaves stock uninsured.', wording: false },
    { point: 'Notices go to a postal address only.', why: 'Email is not valid notice.' },
  ],
  unusual: [
    { point: 'Your own country’s law governs it.', why: 'Disputes stay close to home.', wording: false },
  ] } };

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-NW1';
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust warehousing agreement', counterparty: 'Nordkust Lager AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    upload: { name: 'Warehousing_Agreement_v4.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });
  if (!put || !put.ok) console.log('  FAIL — the stage could not save the contract');

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
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
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskNeedsWording === 'function'))) throw new Error('this build has no "needs wording" rule');
    await until(page, id => !!(typeof getContract === 'function' && getContract(id)), ID, 15000);
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(({ id, BRIEF }) => { const c = getContract(id); c._brief = BRIEF; c._hasBrief = true; roomGoTab(c, 'redline'); }, { id: ID, BRIEF });
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    const list = await until(page, () => {
      if (window.renderRedline) renderRedline();
      const p = document.getElementById('rl-risks'); if (!p) return null;
      const rows = [...p.querySelectorAll('.rk-row[data-rk-key]:not(.is-covered):not(.is-gone)')];
      /* RE-POINTED 6 Oct 2026: a card wears the short title, its whole name on the hover — both are read */
      return rows.length ? { head: (p.querySelector('.rk-h b') || {}).textContent || '', titles: rows.map(r => { const t = r.querySelector('.rk-t') || {}; return (t.textContent || '') + ' ' + ((t.getAttribute && t.getAttribute('title')) || ''); }) } : null;
    });
    check(!!list, '1- the Redlines card has its "Risks to look at"');
    const T = list ? list.titles : [];
    check(!T.some(t => /Governing law: Sweden|Payment terms: 30 days|Termination notice: 90 days/.test(t)), '1a the three notes that only report a fact are not listed', T.join(' | '));
    check(T.some(t => /Liability \/ indemnity/.test(t)), '1b the risk that needs wording is', T.join(' | '));
    check(T.some(t => /raise storage rates/.test(t)) && !T.some(t => /insurance certificate/.test(t)) && !T.some(t => /own country/.test(t)),
      '1c Copilot\'s watch-outs follow its own mark: true listed, false not', T.join(' | '));
    check(T.some(t => /postal address only/.test(t)), '1d a watch-out an older brief left unmarked is shown, not guessed away');
    const n = await page.evaluate(id => riskOpenOf(getContract(id)).length, ID);
    check(T.length === 3 && n === 3 && /· 3$/.test(list.head), '2a the card\'s head, its rows and the one count every tile reads all say 3', list && (list.head + ' / ' + n));
    const fact = await page.evaluate(() => { const f = [...document.querySelectorAll('#ws-facts .room-facet')].find(x => /copilot/i.test((x.querySelector('.l') || {}).textContent || ''));
      return f ? f.querySelector('.v').textContent.replace(/\s+/g, ' ').trim() : null; });
    check(fact == null || !/\d/.test(fact) || /\b3 to look at/.test(fact), '2b the head\'s Copilot fact counts the same three', fact == null ? 'not drawn here' : fact);
    const scan = await page.evaluate(id => getContract(id).scan.findings.length, ID);
    check(scan === 4, '3a the scan still holds all four findings for every other reader', scan);
    await page.screenshot({ path: path.join(OUT, '1-only-what-needs-wording.png') });
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
