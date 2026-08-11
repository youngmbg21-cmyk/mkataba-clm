/* Chromium verification: WHAT AN AGREEMENT LEAVES BEHIND IS NOW READ OFF IT.
   ============================================================
   HaTi read ten things out of an uploaded contract. Every one of them describes
   the agreement while it runs — who, how much, until when, on what notice. None
   of them describes what a business is still CARRYING once the work is done, or
   what the contract leaves open, and those are the facts a portfolio figure
   needs: retention money that has not come home, a warranty still running on a
   job finished a year ago, a liability nobody capped, a price the other side
   may move at will. Six more fields, read the same way.

   Which side of the business an agreement sits on is the seventh. "Contract
   type" is the document's own words and is free text, so nothing can count it;
   "category" is a short closed list, and every figure that groups value by
   anything has to group by that.

   What this asserts, in the browser, on the screens a person actually opens:
     1  the review card that appears after an upload offers all sixteen fields,
        the new ones included, and does not run off the bottom of the dialog
     2  a value read out of a document reaches that card, and the phrase it was
        found in is quoted underneath it
     3  confirming writes the values onto the contract record
     4  the phone's Key terms screen shows the same facts
     5  the words on the closed lists are translated — a Swedish reader sees
        Swedish option names, not the stored English keys
     6  the request HaTi sends for extraction actually asks for the new fields,
        and tells the model that silence is an answer

   Run: node test/chromium/metadata-carried-verify.js */
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

/* A roofing contract, because that is the shape the new fields were written
   for: retention held back, a defects period that outlives the work, a capped
   liability and a price that cannot move. */
const ROOFING = `CONTRACT FOR ROOFING WORKS

This Agreement is made between Riverside Gardens Limited (the Employer) and
Mzedu Roofing Limited (the Contractor).

1. THE WORKS. The Contractor shall carry out and complete the roofing works at
Riverside Gardens Phase 2 for the Contract Sum of KES 8,400,000.

2. RETENTION. The Employer shall retain 10% of the value of each interim
payment. The retention shall be released 90 days after practical completion.

3. DEFECTS. The Defects Liability Period shall be 12 months from the date of
practical completion.

4. LIABILITY. The total aggregate liability of the Contractor under this
Agreement shall not exceed the Contract Sum.

5. RATES. The rates shall remain fixed for the duration of the Works.

6. LAW. This Agreement is governed by the laws of Kenya.`;

/* What the review card is showing, read the way a person reads it. */
const CARD = () => {
  const fields = [...document.querySelectorAll('[data-mf]')].map(el => el.getAttribute('data-mf'));
  const grid = document.querySelector('[data-mf]')?.closest('.grid');
  const quoted = [...document.querySelectorAll('[data-mf]')]
    .filter(el => (el.parentElement.textContent || '').includes('found:'))
    .map(el => el.getAttribute('data-mf'));
  const val = k => { const el = document.querySelector(`[data-mf="${k}"]`); return el ? el.value : null; };
  const optText = k => { const el = document.querySelector(`[data-mf="${k}"]`);
    return el ? [...el.options].map(o => o.textContent.trim()) : []; };
  return {
    fields, quoted,
    scrolls: grid ? grid.scrollHeight > grid.clientHeight + 2 || getComputedStyle(grid).overflowY === 'auto' : false,
    values: { category: val('category'), retentionPct: val('retentionPct'),
      retentionReleaseDays: val('retentionReleaseDays'), warrantyMonths: val('warrantyMonths'),
      liabilityCapped: val('liabilityCapped'), priceReview: val('priceReview') },
    categoryOptions: optText('category'),
  };
};

const NEW = ['category', 'retentionPct', 'retentionReleaseDays', 'warrantyMonths', 'liabilityCapped', 'priceReview'];

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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

    /* ---- 1-2. the review card, filled from a real document ---- */
    const meta = await page.evaluate(text => window.heuristicExtract(text), ROOFING);
    check('pattern matching reads the six new facts off a roofing contract',
      NEW.every(k => meta[k] !== undefined && meta[k] !== ''),
      NEW.map(k => `${k}=${meta[k]}`).join(' '));

    await page.evaluate(m => {
      // the phrase each value was found in is what turns confirming from a leap
      // of faith into a glance, so the card is opened with spans attached
      m.sourceSpans = { retentionPct: 'The Employer shall retain 10% of the value of each interim payment.',
        warrantyMonths: 'The Defects Liability Period shall be 12 months' };
      m._source = 'heuristic';
      window.__saved = null;
      window.openMetaReview(m, out => { window.__saved = out; });
    }, meta);
    await page.waitForTimeout(500);

    const card = await page.evaluate(CARD);
    check('the review card offers all sixteen fields', card.fields.length === 16, `${card.fields.length} fields`);
    check('the six new fields are on it', NEW.every(k => card.fields.includes(k)),
      NEW.filter(k => !card.fields.includes(k)).join(', ') || 'all present');
    check('sixteen fields scroll rather than run off the dialog', card.scrolls);
    check('what was read out of the document is pre-filled',
      card.values.retentionPct === '10' && card.values.warrantyMonths === '12'
      && card.values.liabilityCapped === 'capped' && card.values.priceReview === 'nochange'
      && card.values.category === 'customer',
      JSON.stringify(card.values));
    check('the phrase each new value came from is quoted under it',
      card.quoted.includes('retentionPct') && card.quoted.includes('warrantyMonths'),
      card.quoted.join(', '));
    check('the category list reads in words, not stored keys',
      card.categoryOptions.includes('Customer') && card.categoryOptions.includes('Supplier'),
      card.categoryOptions.join(' / '));

    /* ---- 3. confirming writes them onto the contract ---- */
    await page.click('#mr-save');
    await page.waitForTimeout(400);
    const saved = await page.evaluate(() => window.__saved);
    check('confirming carries the new fields into the saved record',
      saved && NEW.every(k => saved[k] !== undefined && saved[k] !== ''),
      saved ? NEW.map(k => `${k}=${saved[k]}`).join(' ') : 'nothing saved');

    const onContract = await page.evaluate(m => {
      const c = window.state.contracts[0];
      window.applyMetadata(c, m);
      return { category: c.metadata.category, retention: c.metadata.retentionPct,
        warranty: c.metadata.warrantyMonths,
        audit: (c.audit || []).slice(-1)[0]?.detail || '' };
    }, saved);
    check('the audit line names the category it was filed under',
      /category customer/i.test(onContract.audit), onContract.audit.slice(0, 110));

    /* ---- 4. the phone shows the same facts ---- */
    const phone = await page.evaluate(() => {
      const c = window.state.contracts[0];
      return typeof window.mTermsHtml === 'function' ? window.mTermsHtml(c) : null;
    });
    /* the labels carry the units, so the values are bare numbers */
    const phoneHas = { category:/Category|Kategori/.test(phone||''),
      retention:/Retention held \(%\)[\s\S]{0,220}>10</.test(phone||''),
      warranty:/Warranty period \(months\)[\s\S]{0,220}>12</.test(phone||'') };
    check('the phone Key terms screen carries them too',
      phone && phoneHas.category && phoneHas.retention && phoneHas.warranty,
      phone ? Object.entries(phoneHas).map(([k,v])=>(v?'':'MISSING ')+k).join(', ') : 'mTermsHtml not loaded');

    /* ---- 5. Swedish reads Swedish ---- */
    await page.evaluate(() => window.langSet && window.langSet('sv'));
    await page.waitForTimeout(700);
    const sv = await page.evaluate(() => {
      const l = k => (typeof window.metaOptLabel === 'function' ? window.metaOptLabel(k) : k);
      return { customer: l('customer'), uncapped: l('uncapped'), indexed: l('indexed'),
        label: (window.META_FIELDS.find(f => f.k === 'category') || {}).label };
    });
    check('a Swedish reader sees Swedish option words',
      sv.customer === 'Kund' && sv.uncapped === 'Obegränsat' && sv.indexed === 'Kopplat till index',
      `${sv.customer} / ${sv.uncapped} / ${sv.indexed}`);
    check('and a Swedish field label', sv.label === 'Kategori', sv.label);
    await page.evaluate(() => window.langSet && window.langSet('en'));

    /* ---- 6. the extraction request actually asks for them ---- */
    const asked = await page.evaluate(async () => {
      try {
        const r = await fetch('/api/ai/extract', { method: 'POST',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x' }) });
        return { status: r.status };
      } catch (e) { return { err: e.message }; }
    });
    const stubCalls = h.ai && h.ai.calls ? h.ai.calls : [];
    const extractCall = stubCalls.slice().reverse().find(c => JSON.stringify(c.body).includes('file_contract'));
    if (extractCall) {
      const props = extractCall.body.tools[0].input_schema.properties;
      check('the request asks the model for all six new fields',
        NEW.every(k => props[k]), NEW.filter(k => !props[k]).join(', ') || 'all six');
      check('and asks which phrase each came from',
        NEW.every(k => props.sourceSpans.properties[k]));
      const prompt = extractCall.body.messages[0].content;
      check('and tells it that silence is an answer', /Silence is an answer/.test(prompt));
    } else {
      check('extraction request reached the provider', false,
        `no file_contract call recorded (endpoint returned ${asked.status})`);
    }

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
