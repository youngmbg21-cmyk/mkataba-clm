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
    /* REVERSED IN PLACE (Young, 10 Sep 2026, "ONE DOOR ONTO ADDING A CLAUSE").
       This asserted the opposite — that the panel drew the button that turns a
       finding into a redline, and that the reported fixture drew at least two
       of them. THE HALF THAT STANDS is everything above it: the panel arrives
       READ, with the wording and the standard on screen without a second press,
       which is what the report of 11 Aug was about. What is reversed is the
       ACT: adding a clause has one door and it is not here.

       THIS FIXTURE IS THE WEARER — three of its four findings carry a
       `redline`, so it is exactly the shape that used to draw three buttons,
       which is what makes the absence worth measuring here as well as on the
       real contract in the room below. */
    check('and it offers no way to act on it — the panel is a reading',
      m.applies === 0, `${m.applies} redline button(s) still drawn`);

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
       ONE DOOR ONTO ADDING A CLAUSE, AND A CLAUSE IS NEVER ADDED TWICE
       ----------------------------------------------------------------
       REVERSED IN PLACE 10 Sep 2026. What stood here drove the side panel's
       "Apply suggested wording as a redline" and pinned two things: that
       applying takes you to the clause, and that a second add is SAID and then
       "saying yes still adds it — two clauses on one subject is the reader's
       call, not ours."

       The owner has met that alert and ruled both the other way:
         · the panel must stop offering to add at all — one door onto the act
         · a duplicate must be IMPOSSIBLE, not asked about

       So the journey through the panel is gone with the panel's button, and
       what is measured instead is every door that still adds. IT HAS TO BE
       DRIVEN: whether a button is drawn, and whether a press files anything,
       cannot be read off the source — a control removed from one branch and
       left in another looks identical in a grep.
       ================================================================ */
    await page.evaluate(id => { const c = getContract(id);
      state.activeId = c.id; setView('workspace'); }, cid);
    await page.waitForTimeout(1500);
    await page.evaluate(id => openCheckPanel(getContract(id), 'playbook'), cid);
    await page.waitForTimeout(800);

    const panel = await page.evaluate(() => {
      const sp = document.getElementById('side-panel') || document;
      const vis = el => { if (!el) return false; const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.offsetParent !== null; };
      return { applies: [...sp.querySelectorAll('[data-pb-apply]')].filter(vis).length,
        rows: sp.querySelectorAll('[data-pb-row]').length,
        text: sp.textContent.replace(/\s+/g, ' ').trim().slice(0, 400) };
    });
    check('THE SIDE PANEL IS A READING — it offers no way to add a clause',
      panel.applies === 0, `${panel.applies} add button(s) still drawn`);
    check('and it still says what is missing or off standard',
      panel.rows >= 3, `${panel.rows} findings`);

    /* The negotiation is where every remaining door lives. */
    await page.evaluate(id => { if (window.closeModal) closeModal();
      openRedlineWorkbench(id); }, cid);
    await page.waitForTimeout(2200);

    /* ---- THE FOURTH DOOR: the clause library picker ----
       MEASURED on the code before this: pressing the same standard twice
       through the room's "+ Insert clause" filed TWO clauses and raised NO
       dialog at all, because that handler reached negoInsertClause directly
       while the other three shared a filing path that had been taught the rule.

       ITS ROW IS DRIVEN HERE, which is what a source check cannot do: whether
       the Insert button is drawn is a rendered fact, and a control removed from
       one branch and left in another looks identical in a grep. The picker is
       OPENED through its own function — this file already stages openCheckPanel
       the same way — and then the real row is pressed. */
    const base = await page.evaluate(id => ((getContract(id).changes) || []).length, cid);
    const pick = await page.evaluate(async id => {
      const c = getContract(id);
      let picked = null;
      window.openClausePicker(c, { onPick: cl => { picked = cl; } });
      await new Promise(r => setTimeout(r, 400));
      const rows = [...document.querySelectorAll('[data-cl-ins]')];
      const b = rows[0];
      const clId = b ? b.getAttribute('data-cl-ins') : null;
      if (b) b.click();
      await new Promise(r => setTimeout(r, 300));
      if (!picked) return { offered: rows.length, clId, filed: false };
      /* THE ROOM'S OWN HANDLER, act for act: it builds the heading the way the
         paper writes headings and goes through the one act. */
      const heading = window.clauseHeadingFor
        ? clauseHeadingFor(picked.name, negoClauseList(c)) : picked.name;
      const bag = { side: 'owner', author: 'Test' };
      /* GUARDED, so a build without the act REPORTS its failures rather than
         stopping the file at the fourth section from the end. */
      const add = window.negoAddNamedClause || window.negoInsertClause;
      const ch = window.negoAddNamedClause
        ? await add(c, { headingText: heading, bodyHtml: '<p>' + picked.preferred + '</p>' }, bag)
        : await add(c, null, { headingText: heading, bodyHtml: '<p>' + picked.preferred + '</p>' }, bag);
      return { offered: rows.length, clId, filed: !!ch, name: picked.name, heading,
        oneAct: !!window.negoAddNamedClause };
    }, cid);
    await page.waitForTimeout(600);
    const afterFirst = await page.evaluate(id => ((getContract(id).changes) || []).length, cid);
    check('the clause picker files a standard the first time',
      pick.offered > 0 && pick.filed === true && afterFirst === base + 1,
      `${pick.offered} offered · ${base} → ${afterFirst} · "${pick.name}"`);

    /* THE SIGN: the same row can know before the press, so it says so and
       offers nothing rather than refusing after it. */
    const signed = await page.evaluate(async (arg) => {
      const c = getContract(arg.id);
      window.openClausePicker(c, { onPick: () => {} });
      await new Promise(r => setTimeout(r, 400));
      const still = !!document.querySelector(`[data-cl-ins="${arg.clId}"]`);
      const root = document.getElementById('modal-root') || document;
      const txt = root.textContent.replace(/\s+/g, ' ');
      if (window.closeModal) closeModal();
      return { still, says: /already/i.test(txt),
        wayForward: /withdraw|edit that clause/i.test(txt), txt: txt.slice(0, 200) };
    }, { id: cid, clId: pick.clId });
    check('THE SIGN: the row it already added offers no Insert',
      signed.still === false, signed.still ? 'the button is still drawn' : 'not drawn');
    check('and it says it is already here, with the way forward on it',
      signed.says === true && signed.wayForward === true, signed.txt);

    /* THE WALL: driven past the sign, straight at the act every door reaches. */
    const walled = await page.evaluate(async arg => {
      const c = getContract(arg.id);
      const bag = { side: 'owner', author: 'Test' };
      const ch = window.negoAddNamedClause
        ? await window.negoAddNamedClause(c, { headingText: arg.heading, bodyHtml: '<p>x</p>' }, bag)
        : await window.negoInsertClause(c, null, { headingText: arg.heading, bodyHtml: '<p>x</p>' }, bag);
      return { filed: !!ch, refused: bag.refused ? bag.refused.message : null,
        n: (c.changes || []).length };
    }, { id: cid, heading: pick.heading });
    check('THE WALL: the act itself refuses a second add outright',
      pick.oneAct === true && walled.filed === false && walled.n === afterFirst,
      pick.oneAct ? `filed ${walled.filed} · ${afterFirst} → ${walled.n}`
                  : 'there is no one act — negoAddNamedClause is not published');
    check('and the refusal names what to do instead',
      !!walled.refused && /withdraw|edit that clause/i.test(walled.refused),
      walled.refused || 'no refusal came back');

    /* ---- DOOR: the Playbook review window ----
       Its row for a standard already here draws no verbs at all — the same
       shape the unplaced branch beside it already uses, and for the reason that
       branch gives in its own words: a control whose one outcome is a refusal
       is furniture.

       THE REVIEW ITSELF IS STUBBED AND THE WINDOW IS NOT. This workspace's own
       paper comes back aligned on every position, so there would be no row to
       measure; what is replaced is the READING that produces verdicts, and the
       modal, its row builder and its verbs are the product's own. It is given
       two missing positions — one named exactly what the picker just added, one
       nobody has added — so the claim has both a wearer and a control. */
    const modal = await page.evaluate(async arg => {
      const c = getContract(arg.id);
      const real = window.runPlaybookReview;
      window.runPlaybookReview = async () => ({ label: 'Test', source: 'rules', verdicts: [
        { category: arg.name, status: 'missing', position: 'We require this.',
          redline: 'The parties agree to the standard position.' },
        { category: 'Zzz unrelated standard', status: 'missing', position: 'We require that.',
          redline: 'The parties agree to the other standard position.' },
      ] });
      try{
        await window.rlOpenPlaybookReview(c, () => {});
      } finally { window.runPlaybookReview = real; }
      await new Promise(r => setTimeout(r, 500));
      const root = document.getElementById('modal-root');
      if (!root) return { open: false };
      const rows = [...root.querySelectorAll('[id^="pbr-item-"]')];
      const verbs = r => !!r.querySelector('[data-pbr-go],[data-pbr-fb],[data-pbr-draft]');
      const already = rows.filter(r => /already/i.test(r.textContent));
      /* THE WHOLE ROW IS READ AND ONLY THE REPORT IS TRIMMED. The sign is the
         LAST thing in the row, under the name, the position and the quoted
         wording — so a slice taken off the front tests the quote and reports a
         failure on a row that says exactly the right thing. */
      const txt = already.length
        ? already[0].textContent.replace(/\s+/g, ' ').trim() : '';
      return { open: rows.length > 0, rows: rows.length,
        already: already.length,
        alreadyHasVerbs: already.some(verbs),
        withVerbs: rows.filter(verbs).length,
        says: /already/i.test(txt),
        wayForward: /withdraw|edit that clause/i.test(txt),
        text: txt.slice(-220) };
    }, { id: cid, name: pick.name });
    check('THE REVIEW WINDOW: a standard already here offers no verbs',
      modal.open === true && modal.already === 1 && modal.alreadyHasVerbs === false,
      modal.open ? `${modal.rows} rows · ${modal.already} already here · verbs on them: ${modal.alreadyHasVerbs}`
                 : 'the window did not open');
    check('and it says so, with the way forward on it',
      modal.says === true && modal.wayForward === true,
      modal.text || 'no row said it');
    check('while the row nobody has added keeps its verbs',
      modal.withVerbs === 1, `${modal.withVerbs} row(s) still offer a verb`);
    await page.evaluate(() => document.getElementById('pbr-close')?.click());
    await page.waitForTimeout(500);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
