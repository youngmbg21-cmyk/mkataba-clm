/* THE MOST IMPORTANT JOURNEY, END TO END:
   a new customer signs up → drafts a contract → sends it for signature.

   It drives the REAL app in a real Chrome and presses the same buttons a person
   presses. Nothing on the page is faked. What is AROUND the app is stand-ins,
   so the test is safe and gives the same answer every time (journey.js):

     · a brand-new, empty HaTi server with its own throwaway data folder — so
       the sign-up screen always appears and no real data is touched;
     · a pretend email provider that RECORDS every email instead of sending it —
       so the test can prove the signing email went out, to the right person,
       without emailing anybody real;
     · a pretend Copilot that gives short, fixed answers to HaTi's readings.

   WRITTEN TO BE READ BY A PERSON. The owner asks Claude for a "process flow
   check" and gets back a plain-English report (test/e2e/plain-english-
   reporter.js) built from this file's own words: every step and sub-step is
   titled for a person, and every check carries a sentence saying what should
   be true — so when one fails the report can say what should have happened.
   A check written without its sentence would print as "toBeVisible" instead;
   f395 fails on one.

   THIS JOURNEY PROVES THE SHARED STEPS ONE AT A TIME (`detail`): the later
   journeys take the same steps from journey.js under one title each.

   Run it:  npm run test:e2e -- -g "Sign up" */
const { test, expect, NDA, watchForCrashes, openAsThem,
  signUp, draftNda, nameSignersTheyFirst, sendForSignature } = require('./journey');

test('Sign up → create a contract → send it for signature', {
  annotation: {
    type: 'what it checks',
    description: 'A new company signs up, drafts an NDA from HaTi\'s templates, names who signs on '
      + 'each side and sends it for signature by email — then checks the email really went to the '
      + 'other side, and that the link in it opens the agreement ready to sign.',
  },
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);

  await test.step('1. Sign up: create the workspace and the first account', async () => {
    await signUp(page, hati, { detail: true });
    nothingBroke();
  });

  await test.step('2. Create a contract: a Mutual NDA from HaTi\'s templates', async () => {
    await draftNda(page, { detail: true });
    nothingBroke();
  });

  await test.step('3. Send it to the other side for signature', async () => {
    await nameSignersTheyFirst(page, { detail: true });
    const link = await sendForSignature(page, hati, { detail: true });

    /* Opened the way she would — a separate browser with nobody signed in.
       (This journey stops there: it checks the link, it does not sign. The
       next journey on the list signs.) */
    await test.step('Open her link the way she would — it shows the agreement, ready to sign', async () => {
      const grace = await openAsThem(browser, link, nothingBroke);
      await expect(grace.page.locator('body'), 'her page shows the agreement ("' + NDA + '")').toContainText(NDA);
      await expect(grace.page.locator('#pt-sign'), 'her page offers "Sign this contract"').toBeVisible();
      await grace.close();
    });
    nothingBroke();
  });
});
