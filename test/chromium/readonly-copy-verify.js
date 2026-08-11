/* Chromium verification: THE READ-ONLY COPY ACTUALLY CARRIES THE CONTRACT.
   ============================================================
   Reported with a screenshot of the first read-only link anybody sent (Young,
   11 Aug 2026): the banner, the watermark and the footnote all drawn correctly
   around an empty white box where the agreement should be.

   THE CAUSE, AND WHY IT ONLY SHOWED UP HERE. renderShareViewer read
   `c.redlineText` — the STORED wording — and a contract drafted from a
   template has none: its words are rendered on demand from the template and
   the record's own fields. So the page was correct for a contract somebody had
   redlined and blank for all twelve built-ins and every uploaded file, which
   is to say blank for every contract on the day it is first drafted.

   THE FIX IS NOT "SEND THE TEMPLATE". The server's viewerPayload trims this
   copy to the wording and the marks on purpose — an outside reader gets the
   argument, not the arguers — and shipping the template and every field back
   would undo that trim to solve a rendering problem. The owner's side renders
   the body once, at the moment the link is made, and sends the finished
   document. This file pins BOTH halves: that the words arrive, and that the
   people still do not.

   AND ONE THING FOUND WHILE LOOKING. signatureBlock falls back to a dashed
   "Confirm intent to sign from the panel on the right" whenever
   window.rlPaperFootHtml is missing — and it was ALWAYS missing, because the
   builder was declared in a module and never put on window. Every document in
   the product ended that way. On a read-only copy the sentence is not merely
   misplaced, it is false: there is no panel and the reader cannot sign.

   Run: node test/chromium/readonly-copy-verify.js */
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

const base = over => ({
  counterparty: 'Talib K', counterpartyEmail: 'talib@example.se', folder: 'corp',
  value: 0, valueType: 'none', status: 'Under Review', metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], changes: [], obligations: [], scan: null,
  fields: { effDate: '2026-08-01' }, ...over });

/* The two shapes a contract's wording comes in. The first is the one that was
   broken and is the state EVERY contract starts in. */
const DRAFTED = base({ id: 'MK-RO1', name: 'Mutual Non-Disclosure — Talib K', template: 'ND' });
const REDLINED = base({ id: 'MK-RO2', name: 'Supply — Nordkust', template: null, format: 'rich',
  redlineText: '<h1>SUPPLY AGREEMENT</h1><h2>1. Scope</h2><p>The Supplier shall deliver.</p>',
  counterparty: 'Nordkust Industri AB',
  /* A change, so the marks travel too — and so the trim has a name to drop. */
  changes: [{ id: 'CHG-001', clauseId: 'cl_1', clauseLabel: '1. Scope', changeType: 'modify',
    status: 'pending', oldText: 'shall deliver', newText: 'shall deliver monthly',
    author: 'Wanjiru Kamau', authorSide: 'owner', why: 'Our internal ceiling is monthly.',
    note: 'Copilot — Simplify' }] });

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  for (const c of [DRAFTED, REDLINED])
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  /* Open a read-only link the way a recipient does: a fresh context, no
     session, nothing carried over. */
  const openViewer = async token => {
    const c2 = await browser.newContext({ viewport: { width: 1300, height: 1000 } });
    const p2 = await c2.newPage();
    p2.on('pageerror', e => errors.push('viewer: ' + e.message));
    await p2.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(1600);
    const out = await p2.evaluate(() => {
      const sheet = document.querySelector('.pv-sheet');
      const art = document.querySelector('.pv-sheet .doc-surface');
      return {
        text: art ? art.innerText.replace(/\s+/g, ' ').trim() : '',
        chars: art ? art.innerText.trim().length : -1,
        feet: document.querySelectorAll('.rl-paper-foot').length,
        forWho: [...document.querySelectorAll('.rl-sigfor')].map(e => e.textContent.trim()),
        banner: (document.querySelector('.pv-banner') || {}).innerText || '',
        sheetThere: !!sheet,
      };
    });
    await c2.close();
    return out;
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    const mint = id => page.evaluate(async id => {
      const full = await api('contracts/' + id);
      const payload = buildSharePayload(full, 'h', null, { purpose: 'view' });
      const r = await api('shares', 'POST', { payload, channel: 'link',
        recipient: { name: 'Talib K', email: 'talib@example.se' }, purpose: 'view' });
      return r.token;
    }, id);

    /* ---------- 1. the shape that was blank ---------- */
    const drafted = await openViewer(await mint('MK-RO1'));
    check('a template-drafted contract\'s read-only copy carries its wording',
      /Confidential Information/.test(drafted.text) && /Governing Law/.test(drafted.text),
      drafted.chars + ' characters — it was an empty sheet');
    check('and the recital names both parties',
      /Highland Corporate Ltd/.test(drafted.text) && /Talib K/.test(drafted.text),
      drafted.text.slice(0, 70));
    check('and the blanks are frozen to their values, not left as fields',
      /1 August 2026/.test(drafted.text) && !/<input/.test(drafted.text),
      drafted.text.slice(0, 120));

    /* ---------- 2. the shape that already worked ---------- */
    const redlined = await openViewer(await mint('MK-RO2'));
    check('a redlined contract\'s copy still carries its stored wording',
      /The Supplier shall deliver/.test(redlined.text), redlined.text.slice(0, 60));

    /* ---------- 3. THE TRIM STILL HOLDS ----------
       The fix adds the finished document to the payload. It must not have
       added the people back with it — that is the whole design of a view link
       and the reason viewerPayload exists. Read off the RAW payload, not the
       page, because what is served is what matters. */
    const rawTok = await mint('MK-RO2');
    const served = await h.client('outsider').json('/api/shares/' + rawTok);
    const asText = JSON.stringify(served);
    check('the copy is served with the wording in it',
      /shall deliver/.test(asText), 'wording present');
    check('and still without the people — no author, no reason, no provenance',
      !/Wanjiru Kamau/.test(asText) && !/internal ceiling/.test(asText)
      && !/Copilot/.test(asText),
      [/Wanjiru Kamau/.test(asText) && 'author', /internal ceiling/.test(asText) && 'why',
        /Copilot/.test(asText) && 'note'].filter(Boolean).join(', ') || 'clean');
    check('and it cannot answer — a view link responds to nothing',
      (await h.client('outsider2').raw('/api/shares/' + rawTok + '/respond', { method: 'POST', body: {
        v: 1, kind: 'hati-response', id: 'MK-RO2', action: 'accept', name: 'Talib K' } })).status === 403,
      'refuseIfViewOnly');

    /* ---------- 4. the ending ---------- */
    check('the document ends in ruled lines with the parties under them',
      drafted.feet === 1 && drafted.forWho.length === 2,
      `${drafted.feet} foot, ${drafted.forWho.length} lines: ${drafted.forWho.join(' | ')}`);
    check('and not in an instruction this reader cannot follow',
      !/panel on the right/i.test(drafted.text) && !/pending execution/i.test(drafted.text),
      'the placeholder is for a contract with no parties named, and had been the only branch anyone saw');

    /* ---------- 5. a copy with no wording at all says so ----------
       Every view link minted before this fix is exactly this: a template
       contract, trimmed, with neither form of the wording on it. A viewer
       cannot report a fault — they have no way to respond and the sender never
       learns the page was blank — so the page has to ask for a fresh one. */
    const stale = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'view', org: 'Highland Corporate Ltd',
        sharedBy: 'Amina Otieno', contract: { id: 'MK-RO1', name: 'Mutual Non-Disclosure — Talib K',
          counterparty: 'Talib K' } },
      channel: 'link', recipient: { name: 'Talib K', email: 'talib@example.se' }, purpose: 'view' } });
    const empty = await openViewer(stale.token);
    check('a copy carrying no wording asks for a fresh one instead of showing a blank sheet',
      /could not be displayed/i.test(empty.text) && /send it again/i.test(empty.text),
      empty.text.slice(0, 70) || '(blank)');

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
