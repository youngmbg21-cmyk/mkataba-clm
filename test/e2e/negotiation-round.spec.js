/* JOURNEY 3: A NEGOTIATION ROUND.

   Amina proposes three changes to an NDA on the Negotiate page and sends
   them. Grace, at Juno Logistics Ltd, answers each one on her own page — she
   accepts one, turns one down with a reason, and counters the third with
   wording of her own — and sends her answers back. Amina finds the contract
   waiting on her, with each answer where it belongs.

   Run it:  npm run test:e2e -- -g "negotiation round" */
const { test, expect, US, THEM, watchForCrashes, openAsThem, mailTo,
  signUp, draftNda, openNegotiatePage, proposeASentence } = require('./journey');

/* The three changes, and Grace's reason for turning one down. */
const NOTICES = '8. Notices', ASSIGNMENT = '9. Assignment', TERMINATION = '4. Termination';
const REASON = 'We cannot track assignments that closely.';

test('A negotiation round', {
  annotation: {
    type: 'what it checks',
    description: 'We propose three changes to a clause each and send them. The other side accepts one, '
      + 'turns one down with a reason and counters the third on their own page, and sends their '
      + 'answers back — which reach us: one settled, one refused (with the reason on the History '
      + 'tab), and their own wording waiting on us.',
  },
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);

  await test.step('1. Sign up and draft an NDA with Juno Logistics Ltd, as the first journey does', async () => {
    await signUp(page, hati);
    await draftNda(page);
    nothingBroke();
  });

  await test.step('2. Amina proposes three changes on the Negotiate page', async () => {
    await test.step('Open the Document tab and press "Start negotiating"', async () => {
      await openNegotiatePage(page);
    });
    await test.step('Add a sentence to "8. Notices" with its pencil, and file it', async () => {
      await proposeASentence(page, NOTICES, 'A notice sent by e-mail must also be sent by courier.');
    });
    await test.step('Add a sentence to "9. Assignment" the same way', async () => {
      await proposeASentence(page, ASSIGNMENT, 'Any assignment must be notified within ten (10) days.');
    });
    await test.step('Add a sentence to "4. Termination" the same way', async () => {
      await proposeASentence(page, TERMINATION, 'Notice of termination must be given in writing.');
    });
    await expect(page.locator('#rl-side .rl-unsent-go'),
      'the column offers to send the three changes ("Send all · 3 not sent")').toContainText('3 not sent');
    nothingBroke();
  });

  let link = null;
  await test.step('3. Amina sends the round to Juno Logistics Ltd', async () => {
    await test.step('Press "Send all · 3 not sent" — the changes go to the other side', async () => {
      await page.locator('#rl-side .rl-unsent-go').click();
      await expect(page.locator('#rl-side'),
        'the column now says the changes are "With the counterparty"').toContainText(/with the counterparty/i);
    });
    await test.step('Check the email reached Grace\'s address, with a link to negotiate', async () => {
      const toThem = mailTo(hati, THEM.email);
      expect(toThem, 'exactly one email reached ' + THEM.email).toHaveLength(1);
      expect(toThem[0].subject, 'the email says it is sent to negotiate').toContain('to negotiate');
      link = (toThem[0].text.match(/https?:\/\/\S+#share=\S+/) || [])[0];
      expect(link, 'the email carries a link to the agreement').toBeTruthy();
    });
    nothingBroke();
  });

  await test.step('4. Grace answers each change on her own page', async () => {
    const grace = await openAsThem(browser, link, nothingBroke);
    const g = grace.page;
    const theirs = clause => g.locator('#rl-side [data-nego-card]', { hasText: clause });
    /* On her page, a card she wrote herself is "ours" from her chair. */
    const hersOn = clause => g.locator('#rl-side [data-nego-card][data-rl-origin="us"]', { hasText: clause });

    await test.step('Open her link — our three changes are there, each waiting on her answer', async () => {
      for (const clause of [NOTICES, ASSIGNMENT, TERMINATION]) {
        await expect(theirs(clause).locator('[data-nego-accept]'),
          'the change to "' + clause + '" offers her "Accept"').toBeVisible();
      }
    });
    await test.step('Accept the change to "8. Notices"', async () => {
      await theirs(NOTICES).locator('[data-nego-accept]').click();           // "Accept"
      await expect(theirs(NOTICES), 'the change is marked accepted').toContainText('Accepted');
    });
    await test.step('Turn down the change to "9. Assignment", saying why', async () => {
      await theirs(ASSIGNMENT).locator('[data-nego-reject]').click();        // "Reject"
      await expect(g.locator('#pd-input'), 'HaTi asks her why she is turning it down').toBeVisible();
      await g.locator('#pd-input').fill(REASON);
      await g.locator('#pd-ok').click();                                     // "Reject change"
      await expect(theirs(ASSIGNMENT), 'the change is marked rejected').toContainText('Rejected');
    });
    await test.step('Counter the change to "4. Termination" with a sentence of her own', async () => {
      await theirs(TERMINATION).locator('[data-rl-edit]').click();           // "Edit" — the clause's panel
      await g.locator('#rl-cp [data-rl-cp-edit]').filter({ visible: true }).click();  // "+ Propose new wording"
      await g.locator('#rl-cp .nego-editing').filter({ visible: true }).click();      // into the wording
      await g.keyboard.press('Control+End');
      await g.keyboard.type(' Notice may also be given by e-mail.');
      await g.locator('#rl-cp [data-nego-next]').filter({ visible: true }).click();   // "Save change"
      await g.locator('#rl-cp-min').click();                                 // close the clause's panel
      await expect(hersOn(TERMINATION), 'her own wording is in the column, ready to send')
        .toContainText('Notice may also be given by e-mail.');
    });
    await test.step('Press "Send all" — her answers go back to Acme Kenya Ltd', async () => {
      await g.locator('[data-redline-proxy="nego-send-decisions"]').click();  // "Send all · N not sent"
      await expect(g.locator('[data-redline-proxy="nego-send-decisions"]'),
        'nothing is left unsent on her page').toHaveCount(0);
      await expect(hersOn(TERMINATION), 'her own wording is marked sent').toContainText('Sent');
    });
    await grace.close();
    nothingBroke();
  });

  await test.step('5. Her answers reach Amina', async () => {
    await test.step('Amina opens Negotiations — the contract is back with her ("Waiting on you")', async () => {
      await page.locator('#side-nav [data-view="redline"]').click();         // "Negotiations" in the side menu
      await expect(page.locator('#content'), 'the list says the contract is waiting on her').toContainText('Waiting on you');
    });
    await test.step('She opens it: one change settled, one refused, and Grace\'s own wording waiting on her', async () => {
      await page.locator('tr', { hasText: THEM.company }).first().click();    // choose the contract
      await page.locator('[data-ins-act="nego"]').click();                   // "Open negotiation"
      await expect(page.locator('#rl-side [data-rl-band="awaiting"] + [data-nego-card]'),
        'Grace\'s counter on "4. Termination" is the one waiting on her ("Awaiting you")').toContainText(TERMINATION);
      await expect(page.locator('#rl-side [data-rl-band="accepted"] + [data-nego-card]'),
        'the change to "8. Notices" is settled ("Settled this round")').toContainText(NOTICES);
      await expect(page.locator('#rl-side [data-rl-band="refused"] + [data-nego-card]'),
        'the change to "9. Assignment" is refused ("Refused, back to agreed")').toContainText(ASSIGNMENT);
      await expect(page.locator('#rl-side [data-rl-band="awaiting"] + [data-nego-card] [data-nego-accept]'),
        'Grace\'s counter offers Amina "Accept"').toBeVisible();
    });
    await test.step('Grace\'s reason for turning one down is on the contract\'s History', async () => {
      await page.locator('#ws-back').click();                                // back to the contract
      await page.locator('#ws-tabs [data-ws-tab="history"]').click();        // "History" tab
      await expect(page.locator('#content'), 'the History tab carries her reason ("' + REASON + '")').toContainText(REASON);
    });
    nothingBroke();
  });
});
