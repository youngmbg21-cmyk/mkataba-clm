/* JOURNEY 4: REVIEW BEFORE SENDING.

   Amina adds a colleague, Brian, proposes two changes to an NDA and asks him
   to review them before anything goes out. Brian signs in for the first time,
   finds the review waiting on him, clears one change and holds the other
   back, and hands the review back. Amina sends — and only the cleared change
   reaches Grace at Juno Logistics Ltd. The held one never leaves the company.

   Run it:  npm run test:e2e -- -g "Review before sending" */
const { test, expect, THEM, BRIAN, watchForCrashes, openAsThem, mailTo, knownProblem, softPoll,
  signUp, draftNda, openNegotiatePage, proposeASentence, addColleague, signInFirstTime } = require('./journey');

const NOTICES = '8. Notices', ASSIGNMENT = '9. Assignment';
const CLEARED = 'A notice sent by e-mail must also be sent by courier.';
const HELD = 'Any assignment must be notified within ten (10) days.';

test('Review before sending', {
  annotation: [{
    type: 'what it checks',
    description: 'We ask a colleague to review two changes before they go out. He signs in for the first '
      + 'time, clears one and holds the other back, and hands the review back. When we send, only the '
      + 'cleared change reaches the other side — the held one never leaves the company.',
  }, {
    type: 'known problem',
    description: 'Two, both noted in BUGLOG on 27 Sep 2026 and not fixed yet. (1) "Send for review" never '
      + 'emails the reviewer, though "Email them" is ticked — HaTi says "you chose to tell Brian yourself"; '
      + 'he still finds the review in HaTi. (2) After sending, our page lists the held change under "With '
      + 'the counterparty", though it never reached them.',
  }],
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);
  const ours = (p, clause) => p.locator('#rl-side [data-nego-card]', { hasText: clause });

  await test.step('1. Sign up, and add Brian as a colleague', async () => {
    await signUp(page, hati);
    await test.step('On Team & settings, add Brian Kamau as an Editor — he is emailed that he has been added', async () => {
      await addColleague(page, hati, BRIAN);
    });
    nothingBroke();
  });

  await test.step('2. Amina drafts an NDA and proposes two changes', async () => {
    await draftNda(page);
    await test.step('Open the Negotiate page and propose changes to "8. Notices" and "9. Assignment"', async () => {
      await openNegotiatePage(page);
      await proposeASentence(page, NOTICES, CLEARED);
      await proposeASentence(page, ASSIGNMENT, HELD);
    });
    nothingBroke();
  });

  await test.step('3. Amina asks Brian to review both before they go out', async () => {
    await test.step('Press "Internal review", then "Send for review"', async () => {
      await page.locator('[data-rl-review]').click();               // "Internal review"
      await page.locator('[data-rv-entry="ask"]').click();          // "Send for review"
      await expect(page.locator('#rv-send'), 'the review window is open').toBeVisible();
    });
    await test.step('Choose Brian, say what to look at, keep "Email them" ticked, and press "Send for review"', async () => {
      await page.locator('#rv-who').fill('Brian');
      await page.locator('#modal-root [role="option"]', { hasText: BRIAN.name }).click();
      await page.locator('#rv-note').fill('Please check these two before they go out.');
      await expect(page.locator('#rv-email'), '"Email them as well as showing it in HaTi" is ticked').toBeChecked();
      await page.locator('#rv-send').click();                       // "Send for review"
      await expect(page.locator('#rl-side'), 'both changes are now "Out for review"').toContainText(/out for review/i);
    });
    await test.step('Brian is emailed that a review is waiting on him', async () => {
      await knownProblem(async known => {
        await softPoll(() => mailTo(hati, BRIAN.email).length,
          { message: known + 'an email tells Brian a review is waiting on him', timeout: 5_000 }).toBeGreaterThan(1);
      });   // nothing to work round: he finds it in HaTi (next step)
    });
    nothingBroke();
  });

  await test.step('4. Brian rules on each change', async () => {
    const brian = await signInFirstTime(browser, hati, BRIAN, nothingBroke);
    const b = brian.page;
    await test.step('Brian signs in for the first time and sets his own password — Home says a review is waiting on him', async () => {
      await expect(b.locator('#content'), 'his Home lists "Reviews waiting on you"').toContainText('Reviews waiting on you');
    });
    await test.step('Open the alert "Amina Otieno asked you to review changes" — it lands on the changes', async () => {
      await b.locator('#hdr-notify').click();                        // the bell
      await b.locator('[data-alert-kind="review-mine"]').click();    // "… asked you to review changes"
      await expect(ours(b, NOTICES).locator('[data-rv-verdict="cleared"]'),
        'each change offers him "Cleared" or "Held back"').toBeVisible();
    });
    await test.step('Clear the change to "8. Notices" and hold back the one to "9. Assignment"', async () => {
      await ours(b, NOTICES).locator('[data-rv-verdict="cleared"]').click();    // "Cleared"
      await ours(b, ASSIGNMENT).locator('[data-rv-verdict="held"]').click();    // "Held back"
      await expect(b.locator('#rl-side [data-rl-band="held"] + [data-nego-card]'),
        'the change to "9. Assignment" is "Held by your reviewer"').toContainText(ASSIGNMENT);
    });
    await test.step('Press "Hand review back", add a line, and press "Hand it back"', async () => {
      await b.locator('[data-rl-review]').click();                   // "Hand review back"
      await expect(b.locator('#modal-root'), 'the window counts one cleared and one held back')
        .toContainText('1 held back');
      await b.locator('#modal-root textarea').fill('Hold the assignment change until finance has looked at it.');
      await b.locator('#rv-rok').click();                            // "Hand it back"
      await expect(b.locator('#rl-side'), 'his page no longer says he is reviewing')
        .not.toContainText('You are reviewing');
    });
    await brian.close();
    nothingBroke();
  });

  let link = null;
  await test.step('5. Amina sends — only the cleared change goes', async () => {
    await test.step('Amina\'s page shows Brian\'s answers: one ready to send, one held by him', async () => {
      await expect(page.locator('#rl-side [data-rl-band="held"] + [data-nego-card]'),
        'the change to "9. Assignment" is "Held by your reviewer"').toContainText(ASSIGNMENT);
      await expect(page.locator('#rl-side .rl-unsent-go'),
        'one change is ready to send ("Send all · 1 not sent")').toContainText('1 not sent');
    });
    await test.step('Press "Send all · 1 not sent" — an email goes to Juno Logistics Ltd', async () => {
      await page.locator('#rl-side .rl-unsent-go').click();
      await expect.poll(() => mailTo(hati, THEM.email).length,
        { message: 'an email reached ' + THEM.email }).toBe(1);
      link = (mailTo(hati, THEM.email)[0].text.match(/https?:\/\/\S+#share=\S+/) || [])[0];
      expect(link, 'the email carries a link to the agreement').toBeTruthy();
    });
    await test.step('The held change stays with Amina, still held — it is not "with the counterparty"', async () => {
      await knownProblem(async known => {
        await expect.soft(page.locator('#rl-side [data-rl-band="with"] ~ [data-nego-card]', { hasText: ASSIGNMENT }),
          known + 'the held change to "9. Assignment" is not listed as "With the counterparty"')
          .toHaveCount(0, { timeout: 5_000 });
      });   // nothing to work round: the next step checks what really reached them
    });
    nothingBroke();
  });

  await test.step('6. Grace sees only the cleared change', async () => {
    const grace = await openAsThem(browser, link, nothingBroke);
    const g = grace.page;
    await test.step('Her page has the change to "8. Notices", waiting on her answer', async () => {
      await expect(g.locator('#rl-side [data-nego-card]', { hasText: NOTICES }).locator('[data-nego-accept]'),
        'the cleared change reached her, with "Accept"').toBeVisible();
    });
    await test.step('The held change is nowhere on her page — not in the list, not in the wording', async () => {
      await expect(g.locator('#rl-side [data-nego-card]'), 'exactly one change reached her').toHaveCount(1);
      await expect(g.locator('body'), 'the held words ("' + HELD + '") appear nowhere on her page').not.toContainText(HELD);
    });
    await grace.close();
    nothingBroke();
  });
});
