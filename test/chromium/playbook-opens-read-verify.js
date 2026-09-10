/* Chromium verification: THE REVIEW ARRIVES READ, AND ITS QUOTES LIVE IN ONE PLACE.
   ============================================================
   Two things reported together (Young, 11 Aug 2026), off two screenshots of
   the same contract.

   1  "When you run playbook review, default view should be image 1 not image
      2." Image 1 is the panel with its findings open — each one showing the
      wording it quoted, the standard it misses and the button that turns it
      into a redline. Image 2 is what the panel actually did: four headings and
      nothing you could act on, every finding one press further away. You ran
      the review to read the findings; making you ask for each one again is
      asking twice.

   2  "Remove this output from the key terms page." Key terms reprinted the
      quotes the review had already printed — the quote and none of the rest,
      so a reader who found it there still had to go to the panel to do
      anything about it, and the two could drift.

   Run: node test/chromium/playbook-opens-read-verify.js */
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

/* The reported review, verbatim in shape: a quote to read, a standard it
   misses, and a redline to apply. */
const REVIEW = {
  key: 'baseline', label: 'All contracts (baseline)', source: 'ai',
  verdicts: [
    { category: 'Governing law', status: 'deviation', escalate: true,
      position: 'Kenyan law & forum required.',
      quote: 'This Agreement is governed by Swedish law. Disputes shall be settled by the Stockholm District Court as first instance.',
      redline: 'This Agreement is governed by the laws of Kenya.' },
    { category: 'Data protection', status: 'missing', escalate: false,
      position: 'Data protection clause preferred where personal data is involved.',
      redline: 'Each Party shall comply with the Data Protection Act.' },
    { category: 'Payment terms', status: 'deviation', escalate: true,
      position: 'Payment terms should be ≤45 days, with 30 days preferred.',
      quote: 'Invoices are issued monthly and payable within forty-five (45) days.' },
    { category: 'Liability cap', status: 'deviation', escalate: true,
      position: "Liability cap should be at least 12 months' fees.",
      quote: "Carrier's liability for loss or damage to goods is governed by the CMR Convention and capped at 8.33 SDR per kilogram of gross weight." },
  ],
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
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

    /* Open a real contract, put the reported review on it, and open the panel
       the way the Checks card does. */
    const cid = await page.evaluate(rev => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      c.playbook = JSON.parse(JSON.stringify(rev));
      state.activeId = c.id; state.selId = c.id;
      return c.id;
    }, REVIEW);
    await page.evaluate(() => setView('workspace'));
    await page.waitForTimeout(1600);
    await page.evaluate(id => openCheckPanel(getContract(id), 'playbook'), cid);
    await page.waitForTimeout(700);

    const READ = () => {
      const host = document.getElementById('playbook-section');
      const rows = Array.from(host.querySelectorAll('[data-pb-row]'));
      const txt = host.textContent.replace(/\s+/g, ' ');
      return {
        rows: rows.length,
        keys: rows.map(r => r.getAttribute('data-pb-row')),
        quotes: (txt.match(/“/g) || []).length,
        standards: (txt.match(/Our standard:/g) || []).length,
        applies: host.querySelectorAll('[data-pb-apply]').length,
        swedish: /governed by Swedish law/.test(txt),
        fortyfive: /forty-five \(45\) days/.test(txt),
        cmr: /CMR Convention/.test(txt),
      };
    };

    /* ---- 1: it arrives open ---- */
    let m = await page.evaluate(READ);
    check('the panel opens with every finding already read out', m.rows === 4 && m.quotes >= 3,
      `${m.rows} rows, ${m.quotes} quoted passages`);
    check('the wording it objects to is on screen without a second press',
      m.swedish && m.fortyfive && m.cmr);
    check('so is the standard each one misses', m.standards === 4, String(m.standards));
    check('and so is the way to act on it', m.applies >= 2, `${m.applies} redline buttons`);

    /* ---- and a row can still be shut, and stays shut ---- */
    await page.evaluate(() => document.querySelector('[data-pb-row]').click());
    await page.waitForTimeout(300);
    let shut = await page.evaluate(READ);
    check('pressing a finding folds it away', shut.quotes === m.quotes - 1 && !shut.swedish,
      `${shut.quotes} quoted passages left`);
    check('and the other three are untouched', shut.fortyfive && shut.cmr);
    await page.evaluate(() => document.querySelector('[data-pb-row]').click());
    await page.waitForTimeout(300);
    check('pressing it again brings it back', (await page.evaluate(READ)).swedish);

    /* ---- the fold is the reader's exception, and it does not travel ----
       The old key was the row's INDEX, which is not a fact about anything, so
       a row folded on one contract came back folded on the next contract's
       unrelated row of the same number. */
    check('a fold is remembered against its own contract and category',
      shut.keys.every(k => k.includes(cid)) && shut.keys.some(k => /Governing law/.test(k)),
      shut.keys[0]);
    const other = await page.evaluate(rev => {
      const c = state.contracts.find(x => x.id !== state.activeId);
      if (!c) return null;
      c.playbook = JSON.parse(JSON.stringify(rev));
      state.activeId = c.id; state.selId = c.id;
      renderPlaybookSection(c);
      const host = document.getElementById('playbook-section');
      return { open: /governed by Swedish law/.test(host.textContent.replace(/\s+/g, ' ')) };
    }, REVIEW);
    check('and a different contract opens on its own findings, unfolded',
      other && other.open, other ? String(other.open) : 'only one contract to try');

    /* ---- 2: Key terms no longer reprints the quotes ----
       Read off the Key terms PAGE, not out of the builder: the views are ES
       modules, so the builder is not reachable from here — and the page is
       where the owner saw it anyway. */
    await page.evaluate(id => { if (window.closeSidePanel) closeSidePanel();
      state.activeId = id; state.selId = id; setView('workspace'); }, cid);
    await page.waitForTimeout(1600);
    await page.evaluate(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]'); if (b) b.click(); });
    await page.waitForTimeout(1000);
    const kt = await page.evaluate(() => {
      const el = document.getElementById('content-scroll') || document.body;
      return { text: el.textContent.replace(/\s+/g, ' '),
        html: el.innerHTML,
        rows: el.querySelectorAll('.kt-read-row').length };
    });
    check('the Key terms page reprints none of the quoted wording',
      !/governed by Swedish law/.test(kt.text) && !/forty-five \(45\)/.test(kt.text)
      && !/CMR Convention/.test(kt.text));
    check('nor the heading and footnote it sat under',
      !/Quoted from the clause/i.test(kt.text) && kt.rows === 0,
      `${kt.rows} read-out row(s)`);
    check('but it still says where those terms are',
      /Governing law, the liability cap and the payment terms are in the wording, not in this panel/.test(kt.text)
      && /<b>Document<\/b>/.test(kt.html));

    /* ================================================================
       APPLYING A STANDARD (owner-reported 10 Sep 2026, two jobs)
       ----------------------------------------------------------------
         · "When I click on apply this suggested wording it needs to take me
           where it has been added in the contract."
         · "make sure that when someone is adding a duplicate clause from the
           playbook / standards that the user is alerted before it is applied."

       BOTH HAVE TO BE DRIVEN. A source check sees the call and cannot see
       whether the reader ends up looking at the clause, and a dialog that is
       built but never reaches the screen looks identical in the markup to one
       that does. The dialog is also the only thing standing between a press and
       a second clause on the record, so "it came up" and "saying no filed
       nothing" are two separate claims.
       ================================================================ */
    await page.evaluate(id => { const c = getContract(id);
      /* A CLEAN START: this file has been folding rows, and the panel must be
         open on the contract we are about to measure. */
      c.clauseInserts = []; openCheckPanel(c, 'playbook'); }, cid);
    await page.waitForTimeout(700);

    const before = await page.evaluate(id =>
      ((getContract(id).changes) || []).length, cid);
    /* "Data protection" is the missing standard with a redline behind it — the
       one this panel offers to ADD rather than to edit in place. */
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-pb-apply]')];
      const want = btns.find(b => /data protection/i.test(
        b.closest('div[style]')?.parentElement?.textContent || ''));
      (want || btns[btns.length - 1]).click();
    });
    await page.waitForTimeout(2000);

    const landed = await page.evaluate(id => {
      const c = getContract(id);
      const added = (c.changes || []).filter(x => x.changeType === 'insertClause');
      const lit = document.querySelector('.rl-clause.is-linked, .rl-clause.rl-arrived');
      return { changes: (c.changes || []).length, added: added.length,
        heading: added.length ? added[added.length - 1].headingText : null,
        onNego: !!document.querySelector('#redline-host, .redline-page'),
        panelGone: !document.getElementById('side-panel'),
        litClause: !!lit,
        /* THE ATTRIBUTE IS data-clause. A first writing read data-clause-id,
           which nothing on this page carries, so the probe reported the jump as
           landing on the wrong clause while the page was doing exactly the
           right thing. Rule out the instrument before believing the finding. */
        litIsIt: !!(lit && added.length
          && lit.getAttribute('data-clause') === added[added.length - 1].clauseId) };
    }, cid);
    check('APPLY FILES THE STANDARD as a tracked change',
      landed.changes === before + 1 && landed.added >= 1,
      `${before} → ${landed.changes} change(s), heading "${landed.heading}"`);
    check('AND IT TAKES YOU THERE — the negotiation, not the tab you pressed from',
      landed.onNego === true, `on the negotiation: ${landed.onNego}`);
    check('with the panel it was pressed from taken down behind you',
      landed.panelGone === true);
    check('and the clause it just added is the one lit',
      landed.litClause === true && landed.litIsIt === true,
      `lit: ${landed.litClause}, and it is the new clause: ${landed.litIsIt}`);

    /* ---- THE SAME STANDARD A SECOND TIME ---- */
    await page.evaluate(id => { const c = getContract(id);
      state.activeId = c.id; setView('workspace'); }, cid);
    await page.waitForTimeout(1500);
    await page.evaluate(id => openCheckPanel(getContract(id), 'playbook'), cid);
    await page.waitForTimeout(700);
    const mid = await page.evaluate(id => ((getContract(id).changes) || []).length, cid);
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-pb-apply]')];
      const want = btns.find(b => /data protection/i.test(
        b.closest('div[style]')?.parentElement?.textContent || ''));
      (want || btns[btns.length - 1]).click();
    });
    await page.waitForTimeout(900);
    const warned = await page.evaluate(() => {
      const ov = document.getElementById('confirm-overlay');
      return { up: !!ov, text: ov ? ov.textContent.replace(/\s+/g, ' ').trim() : '',
        cancel: !!document.getElementById('cf-cancel'),
        go: !!document.getElementById('cf-ok') };
    });
    check('A SECOND ADD OF THE SAME STANDARD IS SAID FIRST — the reported bug',
      warned.up === true, warned.up ? warned.text.slice(0, 120) : 'no dialog came up');
    check('and the sentence NAMES what it found',
      /data protection/i.test(warned.text), warned.text.slice(0, 160));
    check('it offers a way forward as well as a way out — it refuses nothing',
      warned.cancel === true && warned.go === true);

    /* SAYING NO FILES NOTHING. This is the whole point of asking before rather
       than after, so it is measured on the record and not on the screen. */
    await page.evaluate(() => document.getElementById('cf-cancel')?.click());
    await page.waitForTimeout(700);
    check('SAYING NO FILES NOTHING — the record is where that has to be read',
      (await page.evaluate(id => ((getContract(id).changes) || []).length, cid)) === mid,
      `${mid} change(s), unchanged`);

    /* AND THE WAY FORWARD REALLY WORKS: a warning whose confirm did nothing
       would be a wall wearing a question's clothes. */
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-pb-apply]')];
      const want = btns.find(b => /data protection/i.test(
        b.closest('div[style]')?.parentElement?.textContent || ''));
      (want || btns[btns.length - 1]).click();
    });
    await page.waitForTimeout(900);
    await page.evaluate(() => document.getElementById('cf-ok')?.click());
    await page.waitForTimeout(2000);
    check('and saying yes still adds it — two clauses on one subject is the '
      + 'reader\'s call, not ours',
      (await page.evaluate(id => ((getContract(id).changes) || []).length, cid)) === mid + 1,
      `${mid} → ${await page.evaluate(id => ((getContract(id).changes) || []).length, cid)}`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
