/* Chromium verification: NO MONEY PASSES UNDER AN NDA, AND THE COUNT COUNTS THE LIST.
   ============================================================
   Reported off the share dialog (Young, 11 Aug 2026): "an NDA should not have
   the language assigned in the box. Please review the logic and fix the bug so
   that every contract has the right information appearing in this process."

   The box read:

     Not ready to send — 1 thing to fix
       · No contract value is set, and this contract type carries one.
       · This contract is still a Draft.

   Two faults in four lines.

   1  THE NDA DOES NOT CARRY ONE. Its own clause 1 says "No monetary
      consideration passes under this Agreement", and TEMPLATES.ND has said
      valueType:'none' since the beginning. isMonetary read the RECORD alone,
      and `undefined` — the ordinary state for anything not created through the
      guided wizard — came back monetary. Nobody was asking the template.

   2  THE COUNT DID NOT COUNT THE LIST. "1 thing to fix" is the number of
      BLOCKS; the list under it printed blocks and warnings alike in one ruby
      run. A reader cannot tell which sentence is holding the send — and being
      a Draft is not a thing to fix, it is what every contract shared for
      review is.

   Run: node test/chromium/nda-carries-no-money-verify.js */
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
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
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

    /* ---- 1: the answer comes from the template when the record is silent ---- */
    const money = await page.evaluate(() => {
      const mk = (template, valueType, value) => {
        const c = { id: 'X', template, value: value || 0, counterparty: 'Juno Ltd' };
        if (valueType !== undefined) c.valueType = valueType;
        return c;
      };
      return {
        ndaSilent:   isMonetary(mk('ND', undefined)),
        ndaStamped:  isMonetary(mk('ND', 'none')),
        supply:      isMonetary(mk('RM', undefined)),
        lease:       isMonetary(mk('LE', undefined)),
        upload:      isMonetary({ id: 'U', value: 0 }),
        /* the record still wins where a person actually answered */
        ndaOverride: isMonetary(mk('ND', 'estimated', 500000)),
        /* every built-in, against its own declared answer */
        allAgree: Object.keys(window.TEMPLATES).every(k =>
          isMonetary({ id: 'T', template: k }) === (window.TEMPLATES[k].valueType !== 'none')),
      };
    });
    check('an NDA carries no money even where nothing stamped the record',
      money.ndaSilent === false);
    check('and still none where the record says so', money.ndaStamped === false);
    check('a supply agreement and a lease still carry money',
      money.supply === true && money.lease === true);
    check('an upload, whose template is unknown, is still assumed to carry money',
      money.upload === true);
    check('but a value somebody actually put on an NDA is never overruled',
      money.ndaOverride === true);
    check('every one of the twelve answers what its own template declares', money.allAgree);

    /* A STAMP NOBODY CHOSE IS REPAIRED ON LOAD — bulk creation wrote
       'estimated' onto everything it made, including NDAs. */
    const repaired = await page.evaluate(() => ({
      wrongStamp: migrateContract({ id: 'B1', template: 'ND', valueType: 'estimated', value: 0 }).valueType,
      realValue:  migrateContract({ id: 'B2', template: 'ND', valueType: 'estimated', value: 250000 }).valueType,
      supply:     migrateContract({ id: 'B3', template: 'RM', valueType: 'estimated', value: 0 }).valueType,
    }));
    check('a default stamp on an NDA with no value is repaired on load',
      repaired.wrongStamp === 'none', repaired.wrongStamp);
    check('but a figure on the record is a decision and survives',
      repaired.realValue === 'estimated', repaired.realValue);
    check('and a template that does carry money is left alone',
      repaired.supply === 'estimated', repaired.supply);

    /* And the route that wrote it stops writing it. */
    const src = await page.evaluate(async () => (await (await fetch('/js/templatefields.js')).text()));
    check('bulk creation asks the template rather than defaulting',
      /valueType:\s*t\.valueType/.test(src));

    /* ---- 2: the share dialog, where it was reported ---- */
    const cid = await page.evaluate(() => {
      const c = { id: 'NDA-1', name: 'Mutual Non-Disclosure Agreement — Patrick Wesamba Were',
        counterparty: 'Patrick Wesamba Were', counterpartyEmail: 'p@example.co.ke',
        template: 'ND', value: 0, status: 'Draft', folder: 'corp',
        fields: { effDate: '2026-08-11' }, expiry: '2029-08-11',
        metadata: { effectiveDate: '2026-08-11', expiryDate: '2029-08-11' },
        rounds: [], audit: [], changes: [], comments: [], signatures: [], scan: null,
        compliance: { iprs: false, pki: false }, execution: null, approval: null,
        _loaded: true, _light: false, _v: 0 };
      state.contracts.unshift(c);
      return c.id;
    });
    const ready = await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      return { all: contractReadiness(c).map(x => `${x.severity}:${x.key}`),
        blocks: readinessBlocks(c).map(x => x.key),
        html: readinessPanelHtml(c) };
    }, cid);
    check('no value problem is raised on an NDA at all',
      !ready.all.some(x => /:value$/.test(x)), ready.all.join(', ') || 'nothing raised');
    check('and nothing blocks the send', ready.blocks.length === 0, ready.blocks.join(', ') || 'none');

    const text = ready.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    check('so the box does not say the contract is not ready',
      !/Not ready to send/.test(text), text.slice(0, 90) || 'no panel at all');
    check('being a draft is not counted as a thing to fix',
      !/thing[s]? to fix/.test(text), text.slice(0, 90));

    /* ---- the count and the list agree when something DOES block ---- */
    const both = await page.evaluate(() => {
      const c = { id: 'MIX', name: 'Raw Material Supply', counterparty: '', template: 'RM',
        value: 0, status: 'Draft', fields: {}, metadata: {}, audit: [], rounds: [] };
      const html = readinessPanelHtml(c);
      const d = document.createElement('div'); d.innerHTML = html;
      const head = (d.querySelector('div') || {}).textContent || '';
      const lists = Array.from(d.querySelectorAll('ul'));
      return { head: head.replace(/\s+/g, ' ').trim(),
        blockItems: lists[0] ? lists[0].querySelectorAll('li').length : 0,
        noteItems: lists[1] ? lists[1].querySelectorAll('li').length : 0,
        splitLine: /Also worth knowing/.test(d.textContent),
        blocks: readinessBlocks(c).length };
    });
    check('the number in the heading is the number of items under it',
      both.blockItems === both.blocks && /2 things to fix/.test(both.head),
      `${both.head} · ${both.blockItems} listed`);
    check('what is merely worth knowing is separated out and says so',
      both.noteItems > 0 && both.splitLine, `${both.noteItems} note(s)`);

    /* ---- and on screen, in the dialog itself ---- */
    await page.evaluate(id => { state.activeId = id; state.selId = id; setView('workspace'); }, cid);
    await page.waitForTimeout(1600);
    await page.evaluate(id => openShareModal(getContract(id)), cid);
    await page.waitForTimeout(1400);
    /* Step 0 asks WHAT is being shared; the readiness box is on the step after
       it. Reading the first frame would prove nothing — that step has no
       readiness panel on any contract. */
    await page.evaluate(() => { const b = document.getElementById('share-kind-next'); if (b) b.click(); });
    await page.waitForTimeout(1400);
    const onScreen = await page.evaluate(() => {
      const box = document.getElementById('share-readiness');
      return { box: !!box,
        text: box ? box.textContent.replace(/\s+/g, ' ').trim() : '',
        ack: !!document.getElementById('sh-ack') };
    });
    /* The box IS on screen — it is drawn from the dialog's first frame — so the
       three assertions below are about its wording, not about its absence. */
    check('the readiness box is on screen to be read', onScreen.box);
    check('the share dialog raises no value complaint on screen',
      !/contract type carries one/.test(onScreen.text), onScreen.text.slice(0, 80));
    check('nor calls the contract not ready',
      !/Not ready to send/.test(onScreen.text));
    check('and asks for no acknowledgement, because nothing is being overridden',
      !onScreen.ack);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
