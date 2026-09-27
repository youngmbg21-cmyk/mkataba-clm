/* JOURNEY 5: APPROVAL BEFORE SIGNING.

   Amina, the admin, rules that her own contracts need a named colleague's yes
   before anyone signs them: Brian's. She drafts an NDA and tries to send it
   for signature — HaTi stops her and says why. She sends it to Brian for
   approval; Brian signs in, opens the request and approves; Amina is told,
   and now the signing email goes out to Grace.

   Run it:  npm run test:e2e -- -g "Approval before signing" */
const { test, expect, US, THEM, BRIAN, NDA, watchForCrashes, mailTo, knownProblem,
  signUp, draftNda, nameSignersTheyFirst, addColleague, signInFirstTime, openEmailLink } = require('./journey');

test('Approval before signing', {
  annotation: [{
    type: 'what it checks',
    description: 'An admin rules that her contracts need a named colleague\'s approval before anyone signs. '
      + 'Sending one for signature is refused, with the reason. She sends it for approval; the colleague '
      + 'signs in and approves; she is told, and then the signing email reaches the other side.',
  }, {
    type: 'known problem',
    description: 'Brian\'s Home says "Nothing to decide — you\'re all caught up" while his alerts and his email '
      + 'say a contract is waiting on his approval. Noted in BUGLOG on 27 Sep 2026, not fixed yet.',
  }],
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);
  const approvalRow = p => p.locator('[data-sc-row^="sa:"]');

  await test.step('1. Sign up, and add Brian as a colleague', async () => {
    await signUp(page, hati);
    await addColleague(page, hati, BRIAN);
    nothingBroke();
  });

  await test.step('2. Amina rules that her contracts need Brian\'s approval before anyone signs', async () => {
    await test.step('On Team & settings, open her own row', async () => {
      await page.locator('#content [data-st-panel^="person:"]', { hasText: US.name }).click();
      await expect(page.locator('[data-sa-set="always"]'), 'her row has "Who signs off their contracts"').toBeVisible();
    });
    await test.step('Choose "Always", pick Brian as the approver, and press "Save & close"', async () => {
      await page.locator('[data-sa-set="always"]').click();          // Approval before signing: "Always"
      await page.locator('#tm-overseer').selectOption({ label: BRIAN.name });   // Approver
      await page.locator('#st-dsave').click();                        // "Save & close"
      await expect(page.locator('#content [data-st-panel^="person:"]', { hasText: US.name }),
        'her row now says she needs approval to sign, from Brian').toContainText('approver: ' + BRIAN.name);
    });
    nothingBroke();
  });

  await test.step('3. Amina drafts an NDA and names who signs', async () => {
    await draftNda(page);
    await nameSignersTheyFirst(page);
    nothingBroke();
  });

  await test.step('4. She tries to send it for signature — HaTi stops her, and says why', async () => {
    await page.locator('#ws-share').click();                          // "Share"
    await page.locator('#share-purpose [data-share-purpose="sign"]').click();   // "Sign"
    await page.locator('#share-send').click();                        // "Send by email"
    await expect(page.locator('#toast-root'), 'HaTi says her contracts need Brian\'s approval before anyone signs')
      .toContainText('need ' + BRIAN.name + '’s approval before anyone signs');
    expect(mailTo(hati, THEM.email), 'nothing was emailed to ' + THEM.email).toHaveLength(0);
    await page.locator('#share-close').click();                       // "Close"
    nothingBroke();
  });

  await test.step('5. Amina sends it to Brian for approval', async () => {
    await test.step('On the Signing tab, press "Send for approval" beside "Approval: not asked yet"', async () => {
      await expect(approvalRow(page), 'the Signing tab says the approval has not been asked yet')
        .toContainText('Approval: not asked yet');
      await approvalRow(page).locator('[data-sa-ask]').click();       // "Send for approval"
      await expect(page.locator('#sa-ask-go'), 'the window says what Brian will be approving').toBeVisible();
    });
    await test.step('Add a note and press "Send for approval" — Brian is emailed', async () => {
      await page.locator('#modal-root textarea').fill('Standard NDA, nothing changed. Please approve.');
      await page.locator('#sa-ask-go').click();                       // "Send for approval"
      await expect(approvalRow(page), 'the row now says it is waiting on Brian').toContainText('Waiting on ' + BRIAN.name);
      await expect.poll(() => mailTo(hati, BRIAN.email).some(m => /Please approve/.test(m.subject)),
        { message: 'an email asks Brian to approve it' }).toBe(true);
    });
    nothingBroke();
  });

  await test.step('6. Brian approves', async () => {
    const brian = await signInFirstTime(browser, hati, BRIAN, nothingBroke);
    let b = brian.page;
    await test.step('Brian signs in for the first time — HaTi says a contract is waiting on his approval', async () => {
      await knownProblem(async known => {
        await expect.soft(b.locator('#content'),
          known + 'his Home lists the approval under "Needs your decision"').not.toContainText('Nothing to decide', { timeout: 3_000 });
      });   // nothing to work round: his alerts and his email both say so
      await b.locator('#hdr-notify').click();                         // the bell
      await expect(b.locator('[data-alert-kind="approval"]'), 'his alerts say "Waiting on your approval"')
        .toContainText('Waiting on your approval');
      await b.locator('#panel-close').click();
    });
    await test.step('He opens the link in his email — the contract\'s Signing tab asks for his approval', async () => {
      const ask = mailTo(hati, BRIAN.email).filter(m => /Please approve/.test(m.subject)).pop();
      const link = (ask.text.match(/https?:\/\/\S+#contract=\S+/) || [])[0];
      expect(link, 'the email carries a link to the contract').toBeTruthy();
      b = await openEmailLink(b, link, nothingBroke, 'Brian\'s page');
      await expect(b.locator('[data-sa-approve]'), 'the Signing tab offers him "Approve"').toBeVisible();
    });
    await test.step('Press "Approve" — Amina is emailed that it can be signed', async () => {
      await b.locator('[data-sa-approve]').click();                   // "Approve"
      await expect(b.locator('#content'), 'his page says it is approved').toContainText('Approved by ' + BRIAN.name);
      await expect.poll(() => mailTo(hati, US.email).some(m => /^Approved/.test(m.subject)),
        { message: 'an email tells Amina it is approved and can be signed' }).toBe(true);
    });
    await brian.close();
    nothingBroke();
  });

  await test.step('7. Now the signing email goes out to Grace', async () => {
    let a = page;
    await test.step('Amina opens the link in the "Approved" email — the approval no longer holds anything', async () => {
      const ok = mailTo(hati, US.email).filter(m => /^Approved/.test(m.subject)).pop();
      const link = (ok.text.match(/https?:\/\/\S+#contract=\S+/) || [])[0];
      a = await openEmailLink(page, link, nothingBroke, 'Amina\'s page');
      await expect(a.locator('#sign-btn'), 'the Signing tab is open').toBeVisible();
      await expect(approvalRow(a), 'nothing is waiting on an approval any more').toHaveCount(0);
    });
    await test.step('Share → "Sign" → "Send by email" → confirm the address: it goes', async () => {
      await a.locator('#ws-share').click();
      await a.locator('#share-purpose [data-share-purpose="sign"]').click();
      await a.locator('#share-send').click();
      await a.locator('#cf-ok').click();                              // "Send to grace@…"
      await expect(a.locator('#sh-result'), 'the send screen says "Email sent to ' + THEM.email + '"')
        .toContainText('Email sent to ' + THEM.email);
      const toThem = mailTo(hati, THEM.email);
      expect(toThem, 'exactly one email reached ' + THEM.email).toHaveLength(1);
      expect(toThem[0].subject, 'it asks her to sign the agreement').toContain('sign');
      expect(toThem[0].subject, 'it names the agreement').toContain(NDA);
    });
    nothingBroke();
  });
});
