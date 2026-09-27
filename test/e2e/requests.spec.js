/* JOURNEY 10: REQUESTS — SOMEONE ASKS FOR A CONTRACT; LEGAL ACCEPTS IT AND DRAFTS IT.

   Peter, the operations manager, may read contracts but not write them. He
   asks legal for an NDA with Juno Logistics Ltd on the Requests page. Amina,
   in legal, finds the request in her queue, picks it up and drafts it — HaTi
   asks Copilot which template fits, and she chooses the NDA. The new contract
   opens; Peter is emailed that his request is now a draft, and his own
   Requests page says it is finished and where it went.

   Run it:  npm run test:e2e -- -g "Requests" */
const { test, expect, US, THEM, NDA, watchForCrashes, mailTo, knownProblem,
  signUp, addColleague, signInFirstTime } = require('./journey');

const PETER = { name: 'Peter Ochieng', title: 'Operations Manager', email: 'peter@acme.co.ke',
  temporary: 'temporary-pass-3', password: 'peters-own-pass-1' };
const ASK = 'An NDA with Juno Logistics Ltd';
const WHY = 'We want to share our delivery routes with Juno before they quote for our transport.';

test('Requests', {
  annotation: [{
    type: 'what it checks',
    description: 'A colleague who cannot draft asks legal for a contract. Legal finds the request, picks it up '
      + 'and drafts it from the right template; the new contract opens, the colleague is emailed, and his '
      + 'Requests page says it is finished and which contract it became.',
  }, {
    type: 'known problem',
    description: 'A new request does not reach legal\'s Requests page until the page is reloaded, and nobody in '
      + 'legal is emailed or alerted about it. Noted in BUGLOG on 27 Sep 2026, not fixed yet.',
  }, {
    type: 'known problem',
    description: 'Asked which template fits a request for an NDA, Copilot suggests the Raw Material Supply '
      + 'Agreement: only the first eight templates are ever offered to it, and the NDA is not among them. '
      + 'Noted in BUGLOG on 27 Sep 2026, not fixed yet.',
  }],
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);
  const queueRow = p => p.locator('#content tr', { hasText: ASK });
  let peter = null, p = null;

  await test.step('1. Sign up, and add Peter as a colleague who may only read', async () => {
    await signUp(page, hati);
    await test.step('On Team & settings, add Peter as a Viewer who may see every stream', async () => {
      await addColleague(page, hati, PETER, { role: 'viewer' });
    });
    nothingBroke();
  });

  await test.step('2. Peter asks legal for an NDA', async () => {
    peter = await signInFirstTime(browser, hati, PETER, nothingBroke);
    p = peter.page;
    await test.step('On Requests, press "Ask for a contract", say what he needs and who with, and press "Send"', async () => {
      await p.locator('#side-nav [data-view="intake"]').click();      // "Requests"
      await p.locator('#ik-new').click();                              // "Ask for a contract"
      await p.locator('#ik-title').fill(ASK);
      await p.locator('#ik-need').fill(WHY);
      await p.locator('#ik-cp').fill(THEM.company);
      await p.locator('#ik-send').click();                             // "Send"
    });
    await expect(p.locator('#content'), 'his Requests page lists it, waiting for somebody to pick it up')
      .toContainText('Waiting for somebody to pick it up');
    await expect(queueRow(p), 'the request is on his list').toBeVisible();
    nothingBroke();
  });

  await test.step('3. Amina finds the request in her queue and picks it up', async () => {
    await test.step('She opens Requests — the new request is waiting', async () => {
      await page.locator('#side-nav [data-view="intake"]').click();   // "Requests"
      await knownProblem(async known => {
        await expect.soft(queueRow(page), known + 'the request Peter just sent is in her queue')
          .toBeVisible({ timeout: 5_000 });
      }, async () => {
        await page.reload();                                           // the work-round: reload the page
        await page.locator('#side-nav [data-view="intake"]').click();
      });
      await expect(queueRow(page), 'Peter\'s request is in her queue').toBeVisible();
    });
    await test.step('Choose it and press "Pick it up" — it is hers now', async () => {
      await queueRow(page).click();                                    // choose it
      await expect(page.locator('#content'), 'it says what Peter asked for').toContainText(WHY);
      await page.locator('[data-ins-act="pick"]').click();             // "Pick it up"
      await expect(page.locator('#content'), 'it says she is working on it').toContainText('You are working on it');
    });
    nothingBroke();
  });

  await test.step('4. Amina drafts it from the NDA template', async () => {
    await test.step('Press "Draft it" — HaTi asks Copilot which template fits', async () => {
      await page.locator('[data-ins-act="draft"]').click();            // "Draft it"
      await expect(page.locator('#ik-d-go'), 'the "Draft this contract" window opens').toBeVisible();
      await expect(page.locator('#modal-root'), 'it carries a suggestion from Copilot').toContainText('Copilot suggests');
      await knownProblem(async known => {
        await expect.soft(page.locator('#ik-tpl').locator('option:checked'),
          known + 'Copilot suggests the ' + NDA).toHaveText(NDA, { timeout: 2_000 });
      }, async () => {
        await page.locator('#ik-tpl').selectOption({ label: NDA });    // the work-round: she chooses it herself
      });
      await expect(page.locator('#ik-tpl').locator('option:checked'), 'the ' + NDA + ' is chosen').toHaveText(NDA);
    });
    await test.step('Press "Create the draft" — the new contract opens', async () => {
      await page.locator('#ik-d-go').click();                          // "Create the draft"
      await expect(page.locator('#toast-root'), 'HaTi says the draft was created from the request')
        .toContainText('created from the request');
      await expect(page.locator('#ws-head'), 'the new contract is the ' + NDA).toContainText(NDA);
      await expect(page.locator('#ws-head'), 'it is a draft, owned by Amina').toContainText('Owner ' + US.name);
    });
    await test.step('Her queue is clear, and the request is under "Finished this month"', async () => {
      await page.locator('#side-nav [data-view="intake"]').click();
      await expect(page.locator('#content'), 'nothing is waiting any more').toContainText('Nothing waiting');
      await expect(page.locator('[data-ik-view="fin"]'), '"Finished this month" counts one').toContainText('1');
    });
    nothingBroke();
  });

  await test.step('5. Peter is told, and his Requests page says where it went', async () => {
    let ref = null;
    await test.step('An email tells Peter his request is now a draft, with a link to it', async () => {
      const told = mailTo(hati, PETER.email).filter(m => /now a draft/.test(m.subject));
      expect(told, 'exactly one email tells Peter his request is now a draft').toHaveLength(1);
      expect(told[0].subject, 'it names his request').toContain(ASK);
      ref = (told[0].text.match(/#contract=(MK-\d+)/) || [])[1];
      expect(ref, 'it carries a link to the new contract').toBeTruthy();
    });
    await test.step('His Requests page says it is finished: drafted as the new contract, by Amina', async () => {
      await p.reload();                                                // he opens HaTi again
      await p.locator('#side-nav [data-view="intake"]').click();
      await p.locator('[data-ik-view="fin"]').click();                 // "Finished"
      await queueRow(p).click();
      await expect(p.locator('#content'), 'it says which contract it became').toContainText('Drafted as ' + ref);
      await expect(p.locator('#content'), 'and who drafted it').toContainText('by ' + US.name);
    });
    await peter.close();
    nothingBroke();
  });
});
