/* Chromium verification: THE PAPER STATES THE TERM, AND ASKS ONLY WHAT IT SAYS.
   ============================================================
   Three faults reported together off one sitting (Young, 11 Aug 2026), all of
   them the same shape: a fact stated in one place and contradicted, or never
   printed at all, in another.

   1  "Jan 27" on the renewal runway was read as the 27th of January, and the
      calendar's 27th was empty. Both surfaces were right — the bar was January
      2027 — and the axis was the only thing that could tell the reader which
      reading was meant.

   2  The NDA's creation form asked for "Payment terms (days)" on a template
      whose own clause 1 reads "No monetary consideration passes under this
      Agreement." Nine more templates asked the same question with nowhere on
      the page to print the answer.

   3  A draft created with a start of 11 Aug 2026 and an end of 16 Aug 2026
      still read "shall remain in force for 3 years from the effective date".
      The term was stated twice and nothing kept the two in step.

   Run: node test/chromium/term-and-fields-verify.js */
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

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
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

    /* ================= 1. A MONTH IS NAMED WITH ITS WHOLE YEAR ============= */
    const labels = await page.evaluate(() => ({
      pf: [0, 5, 17].map(n => window.pfMonthLabel(n)),
      rep: window.repMonthLabel('2027-01'),
    }));
    check('a month label carries all four digits of its year',
      labels.pf.every(l => /\d{4}/.test(l)), labels.pf.join(' · '));
    check('and no label can be read as a day of the month',
      labels.pf.every(l => !/\b\d{1,2}$/.test(l.trim())), labels.pf.join(' · '));
    check('the reports strip names the month the same way', /2027/.test(labels.rep), labels.rep);

    /* The renewal runway is where it was reported. Read the axis off the page. */
    await page.evaluate(() => {
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      state.contracts.push({ id: 'RW1', name: 'Freight & Distribution — EAC', counterparty: 'Lori Systems',
        folder: 'dist', value: 500000, status: 'Signed', expiry: day(160),
        metadata: { expiryDate: day(160), effectiveDate: day(-900), renewalType: 'auto-renew' },
        rounds: [], audit: [], changes: [] });
    });
    await page.evaluate(() => { window.wsSet(['standing', 'project'], 'job'); setView('intel'); });
    await page.waitForTimeout(1400);
    const axis = await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg[aria-label]'))
        .find(s => /ending in each/i.test(s.getAttribute('aria-label') || ''));
      return svg ? Array.from(svg.querySelectorAll('text')).map(t => t.textContent.trim()) : null;
    });
    check('the renewal runway itself draws four-digit years',
      axis && axis.some(t => /[A-Za-zÅÄÖåäö]{3}.*\d{4}/.test(t)),
      axis ? axis.filter(t => /\d/.test(t)).slice(0, 6).join(' · ') : 'no renewal chart drawn');

    /* ================= 2. A TEMPLATE ASKS ONLY WHAT ITS PAPER SAYS ========= */
    const fields = await page.evaluate(() => {
      const out = {};
      Object.keys(window.TEMPLATES).forEach(id => {
        out[id] = window.builtinTemplateFields(id).map(f => f.key);
      });
      return out;
    });
    check('the NDA is not asked for payment terms', !fields.ND.includes('payDays'),
      fields.ND.join(', '));
    check('nor is it asked for a contract value', !fields.ND.includes('value'),
      fields.ND.join(', '));
    check('a lease is not asked either — its rent falls due in advance',
      !fields.LE.includes('payDays') && !fields.EQ.includes('payDays'),
      `LE: ${fields.LE.join(', ')} | EQ: ${fields.EQ.join(', ')}`);
    check('the distributor asks once, through the blank its own clause 3 has',
      fields.DA.includes('creditDays') && !fields.DA.includes('payDays'), fields.DA.join(', '));
    check('and a supply agreement is still asked, because its paper now says it',
      fields.RM.includes('payDays') && fields.FF.includes('payDays'));

    /* THE RULE, WALKED ACROSS ALL TWELVE: every field a template asks for has
       somewhere on that template's own page to print. This is the check that
       catches the next one rather than this one. */
    const orphans = await page.evaluate(() => {
      /* The contract-record facts. They are exempt from the data-field rule
         because they print through their own mechanisms — the counterparty and
         the value through data-sync inputs, the dates through docTermSpan — not
         because they are allowed to go unprinted. `party` (added 11 Aug 2026,
         our own entity on the agreement) is the same kind of fact and prints
         the same way: in the recital and in the paper's "Between A and B". The
         check straight after this one proves it, so the exemption is not a hole. */
      const ESSENTIAL = new Set(['party', 'counterparty', 'value', 'effDate', 'expiry']);
      const out = [];
      Object.keys(window.TEMPLATES).forEach(id => {
        const c = { id: 'X', template: id, status: 'Draft', fields: {}, counterparty: 'Acme Ltd',
          value: 0, metadata: {}, audit: [], comments: [], signatures: [] };
        let html = '';
        try { html = window.docBody(c); } catch (e) { out.push(`${id}: threw ${e.message}`); return; }
        window.builtinTemplateFields(id).forEach(f => {
          if (ESSENTIAL.has(f.key)) return;
          if (!html.includes(`data-field="${f.key}"`)) out.push(`${id}.${f.key}`);
        });
      });
      return out;
    });
    check('every question a template asks has somewhere on its own page to print',
      orphans.length === 0, orphans.join(', ') || 'all twelve clean');

    /* ---- AND THE PARTY IS THE CONTRACT'S, NOT THE WORKSPACE'S ----
       Reported by the owner (11 Aug 2026): a group holds more than one legal
       entity, so the paper must name the one that is actually contracting
       rather than the account the drafter happens to be signed into. Walked
       across all twelve, because the recital is written out longhand twelve
       times and a missed one would name the wrong company on a real agreement. */
    const partyWalk = await page.evaluate(() => {
      const bad = [];
      Object.keys(window.TEMPLATES).forEach(id => {
        const mk = over => ({ id: 'X', template: id, status: 'Draft', fields: {},
          counterparty: 'Acme Ltd', value: 0, metadata: {}, audit: [], comments: [],
          signatures: [], ...over });
        const named = window.docBody(mk({ party: 'West Electronics Retail Ltd' }));
        if (!named.includes('West Electronics Retail Ltd')) bad.push(`${id}: ignores the party`);
        if (named.includes(window.FIRST_PARTY)) bad.push(`${id}: still names the workspace`);
        /* And an unanswered party still reads exactly as it always did. */
        const silent = window.docBody(mk({}));
        if (!silent.includes(window.FIRST_PARTY)) bad.push(`${id}: falls back to nothing`);
      });
      return bad;
    });
    check('all twelve name the contract\'s own party, and fall back to the workspace when it is not set',
      partyWalk.length === 0, partyWalk.join(', ') || 'all twelve clean');

    /* The wizard is where it was reported — read the form, not the schema. */
    await page.evaluate(() => { closeModal && closeModal(); openWizard(); });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('[data-tpl],button'))
        .find(el => /non-disclosure|\bNDA\b/i.test(el.textContent || ''));
      if (b) b.click();
    });
    await page.waitForTimeout(600);
    const form = await page.evaluate(() => ({
      text: (document.getElementById('modal-root') || {}).textContent || '',
      pay: !!document.getElementById('wz-payDays'),
      cp: !!document.getElementById('wz-counterparty'),
    }));
    check('the NDA form on screen shows no payment field',
      form.cp && !form.pay && !/payment terms/i.test(form.text),
      form.cp ? (form.pay ? 'payment field present' : 'clean') : 'wizard did not reach the NDA form');

    /* ================= 3. THE TERM IS ONE FACT ===============================
       The NDA's own form is still open from the check above — the walk below
       finishes on it, because that is the form the fault was reported from. */
    const term = await page.evaluate(() => {
      const mk = (tpl, eff, exp) => ({ id: 'T1', template: tpl, status: 'Draft', counterparty: 'Sofia Alegra Ten',
        value: 0, valueType: 'none', expiry: exp, fields: { effDate: eff }, metadata: {},
        audit: [], comments: [], signatures: [] });
      const strip = h => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      return {
        /* the reported document, verbatim in shape */
        nda: strip(window.docBody(mk('ND', '2026-08-11', '2026-08-16'))),
        /* nothing on the record — the blank must survive */
        bare: strip(window.docBody(mk('ND', '2026-08-11', null))),
        /* a template with no term clause of its own */
        supply: strip(window.docBody(mk('RM', '2026-08-11', '2029-08-11'))),
        span: window.docTermSpan(mk('ND', '2026-08-11', '2026-08-16')),
        threeYears: window.docTermSpan(mk('ND', '2026-08-09', '2029-08-09')),
        backwards: window.docTermSpan(mk('ND', '2026-08-16', '2026-08-11')),
      };
    });
    check('the drafted term states the dates that were entered',
      /11 August 2026/.test(term.nda) && /16 August 2026/.test(term.nda),
      (term.nda.match(/remain in force[^.]*/) || [''])[0].slice(0, 110));
    check('and no longer says three years',
      !/3 years/.test(term.nda) && !/for\s+<?input/i.test(term.nda));
    check('it says how long that is, so the reader can check the arithmetic',
      /\(5 days\)/.test(term.nda), term.span && term.span.len);
    check('a whole number of years is named as years, not as 1096 days',
      term.threeYears && term.threeYears.len === '3 years',
      term.threeYears && term.threeYears.len);
    check('a contract with no end date keeps its years blank',
      /years from the effective date/.test(term.bare),
      (term.bare.match(/remain in force[^.]*/) || [''])[0].slice(0, 90));
    check('a term that runs backwards is refused rather than printed',
      term.backwards === null);
    check('a template that drafts no term clause states it on the recital',
      /term runs from 11 August 2026 until 11 August 2029/.test(term.supply),
      (term.supply.match(/The term runs[^.]*/) || ['not stated'])[0]);

    /* ---- and the record reads the paper, the other way round ----
       Walked through the product the way it was reported: draft an NDA from
       the wizard giving a start date and NO end date, then open the document.
       A hand-built record would skip the loading the room does on arrival and
       prove nothing about the screen the owner was looking at. */
    await page.evaluate(() => {
      const set = (id, v) => { const e = document.getElementById(id);
        if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('wz-counterparty', 'Sofia Alegra Ten'); set('wz-effDate', '2026-08-09');
      document.getElementById('wz-create').click();
    });
    await page.waitForTimeout(1800);
    const filled = await page.evaluate(() => state.activeId);
    check('a draft created with a start date and no end date has no end date',
      await page.evaluate(() => (getContract(state.activeId) || {}).expiry) == null);
    await page.evaluate(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="docs"]'); if (b) b.click(); });
    await page.waitForTimeout(1000);
    const typed = await page.evaluate(() => {
      const el = document.querySelector('#doc-canvas [data-field="termYears"]');
      if (!el) return { found: false };
      el.value = '3';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { found: true };
    });
    await page.waitForTimeout(900);
    const after = await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      const doc = (document.getElementById('doc-canvas') || {}).textContent || '';
      return { expiry: c.expiry, meta: (c.metadata || {}).expiryDate, doc: doc.replace(/\s+/g, ' ') };
    }, filled);
    check('the term blank is drawn while the record has no end date', typed.found);
    check('typing a term fills the empty end date the whole product runs off',
      after.expiry === '2029-08-09' && after.meta === '2029-08-09', after.expiry);
    check('and the clause then states the dates instead of the blank',
      /9 August 2026/.test(after.doc) && /9 August 2029/.test(after.doc),
      (after.doc.match(/remain in force[^.]*/) || [''])[0].slice(0, 110));

    /* A DATE SOMEBODY SET IS NEVER MOVED BY THE BLANK. */
    const kept = await page.evaluate(() => {
      const c = { id: 'T3', template: 'ND', status: 'Draft', expiry: '2027-01-01',
        fields: { effDate: '2026-08-09', termYears: '' }, metadata: {}, audit: [] };
      state.contracts.unshift(c);
      /* the blank is not even drawn once both dates are known — which is the
         first line of the defence; the handler refuses as the second */
      return { drawn: /data-field="termYears"/.test(window.docBody(c)), expiry: c.expiry };
    });
    check('with both dates on record the blank is not drawn at all', !kept.drawn);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
