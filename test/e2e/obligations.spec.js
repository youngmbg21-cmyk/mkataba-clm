/* JOURNEY 9: OBLIGATIONS — ADD ONE, MARK IT DONE, CHASE THE OTHER SIDE.

   On an NDA with Juno Logistics Ltd, Amina records a promise of ours (return
   the confidential papers) and marks it done, with a note. She records one of
   theirs (send their signed data-handling policy) and chases them: HaTi asks
   before it sends, and the reminder reaches Juno's address. The book-wide
   Obligations page then shows what is still owed.

   Due dates are worked out from today, so the journey never goes stale.

   Run it:  npm run test:e2e -- -g "Obligations" */
const { test, expect, THEM, watchForCrashes, mailTo, signUp, draftNda } = require('./journey');

const OURS = 'Return all confidential papers when the project ends';
const THEIRS = 'Send their signed data-handling policy';

/* A date N days from TODAY, in this computer's own calendar, as a date box
   wants it (YYYY-MM-DD) — never a UTC day, which is yesterday or tomorrow for
   part of every day in some places. */
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

test('Obligations', {
  annotation: {
    type: 'what it checks',
    description: 'On a contract we record one of our own promises and mark it done, and record one of theirs '
      + 'and chase them: HaTi asks first, and the reminder reaches their address. The Obligations page then '
      + 'shows what is still owed.',
  },
}, async ({ hati, page }) => {
  const nothingBroke = watchForCrashes(page);
  const tab = page.locator('#content');
  const row = text => page.locator('#content tr[data-ob-key]', { hasText: text });

  await test.step('1. Sign up and draft an NDA with Juno Logistics Ltd', async () => {
    await signUp(page, hati);
    await draftNda(page);
    nothingBroke();
  });

  await test.step('2. Amina records one of our promises, and marks it done', async () => {
    await test.step('Open the Obligations tab and press "Add obligation"', async () => {
      await page.locator('#ws-tabs [data-ws-tab="oblig"]').click();   // "Obligations" tab
      await page.locator('#obt-add').click();                          // "Add obligation"
      await expect(page.locator('#of-save'), 'the "Add obligation" window is open').toBeVisible();
    });
    await test.step('Describe it, give it a due date in 30 days, say it is ours, and press "Save"', async () => {
      await page.locator('#of-desc').fill(OURS);
      await page.locator('#of-due').fill(daysFromToday(30));
      await page.locator('[data-of-party="ours"]').click();            // "Us"
      await page.locator('#of-save').click();                          // "Save"
      await expect(row(OURS), 'it is listed as outstanding').toBeVisible();
      await expect(page.locator('#ws-tabs [data-ws-tab="oblig"]'), 'the tab counts one outstanding').toContainText('1');
    });
    await test.step('Press "Mark done", add a reference, and press "Mark complete"', async () => {
      await row(OURS).click();                                         // choose it
      await page.locator('[data-ins-act="done"]').click();             // "Mark done"
      await expect(page.locator('#od-at'), 'it asks the day it was done — today by default').toHaveValue(daysFromToday(0));
      await page.locator('#od-note').fill('Papers returned by courier');
      await page.locator('#od-go').click();                            // "Mark complete"
      await expect(page.locator('[data-obt-view="done"]'), 'the Completed view counts one').toContainText('1');
      await page.locator('[data-obt-view="done"]').click();            // "Completed"
      await expect(tab, 'it is completed, by Amina').toContainText('closed by Amina Otieno');
    });
    nothingBroke();
  });

  await test.step('3. Amina records one of theirs, and chases them', async () => {
    await test.step('Add "' + THEIRS + '", due in 14 days, owed by Juno Logistics Ltd', async () => {
      await page.locator('#obt-add').click();                          // "Add obligation"
      await page.locator('#of-desc').fill(THEIRS);
      await page.locator('#of-due').fill(daysFromToday(14));
      await page.locator('[data-of-party="theirs"]').click();          // "Juno Logistics Ltd"
      await page.locator('#of-save').click();                          // "Save"
      await page.locator('[data-obt-view="open"]').click();            // "Outstanding"
      await expect(row(THEIRS), 'it is listed as outstanding').toBeVisible();
    });
    await test.step('Press "Chase" — HaTi asks before it sends — and confirm', async () => {
      await row(THEIRS).click();                                       // choose it
      await expect(tab, 'the panel says Juno owes us this').toContainText(THEM.company + ' owes us this');
      await page.locator('[data-ins-act="chase"]').click();            // "Chase"
      await expect(page.locator('#cf-ok'), 'HaTi asks before it sends ("Send the reminder")').toContainText('Send the reminder');
      await page.locator('#cf-ok').click();                            // "Send the reminder"
      await expect(page.locator('#toast-root'), 'HaTi says the reminder went to ' + THEM.email).toContainText('Reminder sent to ' + THEM.email);
    });
    await test.step('The reminder reached Juno\'s address, and the obligation says it was chased', async () => {
      const reminders = mailTo(hati, THEM.email).filter(m => /reminder/i.test(m.subject));
      expect(reminders, 'exactly one reminder email reached ' + THEM.email).toHaveLength(1);
      expect(reminders[0].subject, 'the email names what is owed').toContain(THEIRS);
      expect(reminders[0].text, 'the email names the agreement').toContain('Mutual Non-Disclosure Agreement');
      await expect(row(THEIRS), 'the row says it was chased').toContainText('chased');
    });
    nothingBroke();
  });

  await test.step('4. The Obligations page shows what is still owed', async () => {
    await page.locator('#side-nav [data-view="obligations"]').click(); // "Obligations" in the side menu
    await expect(tab, 'it lists what Juno still owes').toContainText(THEIRS);
    await expect(page.locator('[data-obw-view="open"]'), 'it counts one outstanding').toContainText('1');
    await expect(page.locator('[data-obw-view="done"]'), 'and one completed').toContainText('1');
    await expect(page.locator('#content tr[data-ob-key]', { hasText: OURS }),
      'the one we finished is not among the outstanding').toHaveCount(0);
    nothingBroke();
  });
});
