/* Chromium verification: HaTi CHECKS ITS OWN ARITHMETIC.
   ============================================================
   Reported off a real upload (Young, 11 Aug 2026). The expiry came back as
   29 August 2026 on a contract whose own quoted phrase read "remain in force
   for 3 years from the effective date", with an effective date of 9 August
   2026. Three years from then is 2029, not three weeks later.

   A duration is a sum, and a sum can be checked. Where the document states a
   term as a length of time from a date HaTi already holds, the end date is not
   a matter of opinion — so it is worked out and compared, and the review card
   shows the disagreement.

   Two properties are load-bearing and both are asserted here:

   NOTHING IS OVERWRITTEN SILENTLY. That screen exists because a person
   confirms; a value that changed itself while they were reading it is the one
   thing that would stop them trusting the rest of the card. The corrected date
   is OFFERED, in one press.

   AND IT DOES NOT CRY WOLF. A term within a month of the extracted date is not
   flagged — a contract that ends the day before its anniversary is not a
   mistake worth shouting about, and one that is three years out is. A field
   nobody can trust to stay quiet is a field people learn to click past.

   Run: node test/chromium/term-arithmetic-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The reported document, verbatim in shape. */
const NDA = `MUTUAL NON-DISCLOSURE AGREEMENT

This Agreement is entered into on 9 August 2026 between Juno Limited and
Highland Corporate Ltd.

1. TERM. This Agreement shall remain in force for 3 years from the effective date.

2. CONSIDERATION. No monetary consideration passes under this Agreement.

3. LAW. This Agreement is governed by the laws of Kenya.`;

/* Each row: what the document says, the effective date, the date extraction
   returned, and the date the document actually implies (null = leave it be). */
const CASES = [
  ['the reported one', 'shall remain in force for 3 years from the effective date', '2026-08-09', '2026-08-29', '2029-08-09'],
  ['bracketed digits', 'shall continue in full force for a period of twelve (12) months from the Effective Date', '2026-03-01', '2026-03-20', '2027-03-01'],
  ['term of this agreement', 'The term of this Agreement is 24 months commencing on the date below.', '2026-01-15', '2027-01-15', '2028-01-15'],
  ['a term written in words', 'The parties agree for an initial term of five years.', '2026-06-30', '2027-06-30', '2031-06-30'],
  ['leap year, calendar months', 'shall remain in force for a period of 12 months', '2028-02-29', '2028-03-15', '2029-03-01'],
  ['no term stated at all', 'A short letter with no duration anywhere in it.', '2026-06-30', '2027-06-30', null],
  ['already correct', 'shall remain in force for a period of 3 years from the effective date', '2026-08-09', '2029-08-09', null],
  ['a few days out is not wrong', 'shall remain in force for a period of 12 months', '2026-01-01', '2026-12-20', null],
  ['no effective date to count from', 'shall remain in force for 3 years from the effective date', '', '2026-08-29', null],
];

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- the arithmetic ---- */
    const ran = await page.evaluate(cases => cases.map(([name, text, eff, got, want]) => {
      const m = window.metaCheckTerm(text, { effectiveDate: eff, expiryDate: got, confidence: { expiryDate: 'high' } });
      const ck = m.checks && m.checks.expiryDate;
      return { name, want, got: ck ? ck.expected : null, conf: m.confidence.expiryDate };
    }), CASES);
    ran.forEach(r => {
      const ok = r.want === null ? r.got === null : r.got === r.want;
      check(`term check — ${r.name}`, ok,
        r.want === null ? (r.got ? `flagged ${r.got}, should have stayed quiet` : 'quiet, as it should be')
                        : `${r.got}${ok ? '' : ' — expected ' + r.want}`);
    });
    check('a field HaTi can show is wrong is not called confident',
      ran.filter(r => r.want !== null).every(r => r.conf === 'low'),
      ran.filter(r => r.want !== null).map(r => r.conf).join(', '));
    check('and a field it agrees with keeps the confidence it had',
      ran.filter(r => r.want === null).every(r => r.conf === 'high'));

    /* ---- it runs on the real extraction path, not only when called ---- */
    /* Read the document for real rather than through the test stub, which
       answers with a canned shape and no effective date — with nothing to
       count from the check is correctly quiet, which would prove nothing. */
    const endToEnd = await page.evaluate(async text => {
      const was = window.state.aiConfigured;
      window.state.aiConfigured = false;
      const m = await window.extractMetadata(text, null, {});
      window.state.aiConfigured = was;
      return { eff: m.effectiveDate, exp: m.expiryDate, ck: (m.checks || {}).expiryDate || null };
    }, NDA);
    check('extraction itself runs the check, without anyone asking',
      !!endToEnd.ck && endToEnd.ck.expected === '2029-08-09',
      endToEnd.ck ? `read ${endToEnd.eff} → ${endToEnd.exp}, flagged ${endToEnd.ck.expected}`
                  : `no flag; read ${endToEnd.eff} → ${endToEnd.exp}`);

    /* ---- the card says so, and offers the fix ---- */
    await page.evaluate(text => {
      const m = window.metaCheckTerm(text, {
        counterparty: 'Juno Limited', effectiveDate: '2026-08-09', expiryDate: '2026-08-29',
        confidence: { expiryDate: 'high' }, _source: 'ai',
        sourceSpans: { expiryDate: 'remain in force for 3 years from the effective date' } });
      window.__saved = null;
      window.openMetaReview(m, out => { window.__saved = out; }, {});
    }, NDA);
    await page.waitForTimeout(500);
    const card = await page.evaluate(() => {
      const btn = document.querySelector('[data-mf-use]');
      const box = btn && btn.closest('span');
      return {
        warned: !!box, text: box ? box.textContent.replace(/\s+/g, ' ').trim() : '',
        offers: btn ? btn.getAttribute('data-mf-val') : null,
        field: (document.querySelector('[data-mf="expiryDate"]') || {}).value,
        quotedTwice: (document.body.textContent.match(/remain in force for 3 years/g) || []).length,
      };
    });
    check('the card shows the disagreement in words', card.warned && /would be/.test(card.text),
      card.text.slice(0, 100));
    check('it names both the term and the date it implies',
      /3 years/.test(card.text) && /2029/.test(card.text));
    check('the wrong date is still in the field — nothing was overwritten',
      card.field === '2026-08-29', card.field);
    check('the quoted phrase is not printed twice', card.quotedTwice === 1, `${card.quotedTwice} time(s)`);

    await page.evaluate(() => document.querySelector('[data-mf-use]').click());
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({
      field: document.querySelector('[data-mf="expiryDate"]').value,
      stillWarning: !!document.querySelector('[data-mf-use]'),
    }));
    check('one press takes the date the document implies', after.field === '2029-08-09', after.field);
    check('and the warning stands down once it has been answered', !after.stillWarning);

    await page.evaluate(() => document.getElementById('mr-save').click());
    await page.waitForTimeout(300);
    const saved = await page.evaluate(() => window.__saved);
    check('and that is what gets saved', saved && saved.expiryDate === '2029-08-09',
      saved ? saved.expiryDate : 'nothing saved');

    /* ---- a date the uploader typed themselves is never second-guessed ---- */
    const seeded = await page.evaluate(async text =>
      await window.extractMetadata(text, { expiry: '2027-01-01' }, {}), NDA);
    check('a date the uploader typed in is left alone',
      !(seeded.checks || {}).expiryDate && seeded.expiryDate === '2027-01-01', seeded.expiryDate);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
