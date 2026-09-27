/* JOURNEY 8: ADD A COLLEAGUE AND CONTROL WHICH CONTRACTS THEY CAN SEE.

   Amina has two NDAs filed in two value streams — one under Corporate &
   Compliance, one under Sales. She adds Wanjiru, the sales manager, and lets
   her see the Sales stream only. Wanjiru signs in: she sees the sales
   contract and nothing else, and a link to the other one does not open it.
   Then Amina widens her access, and the next time Wanjiru opens HaTi both
   contracts are there.

   Run it:  npm run test:e2e -- -g "control which contracts" */
const { test, expect, THEM, watchForCrashes, openEmailLink,
  signUp, draftNda, addColleague, signInFirstTime } = require('./journey');

const WANJIRU = { name: 'Wanjiru Mwangi', title: 'Sales Manager', email: 'wanjiru@acme.co.ke',
  temporary: 'temporary-pass-2', password: 'wanjirus-own-pass-1' };
const NAIVAS = { company: 'Naivas Supermarkets Ltd', email: 'procurement@naivas.co.ke' };
const SALES = 'Sales & Route-to-Market', CORPORATE = 'Corporate & Compliance';

test('Add a colleague and control which contracts they can see', {
  annotation: {
    type: 'what it checks',
    description: 'We file two contracts in two value streams and add a colleague who may see only one of them. '
      + 'She sees that contract and nothing else, and a link to the other does not open it. When we widen '
      + 'her access, both are there the next time she opens HaTi.',
  },
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);
  let junoRef = null;

  await test.step('1. Sign up', async () => {
    await signUp(page, hati);
    nothingBroke();
  });

  await test.step('2. Amina drafts two NDAs, filed in two different value streams', async () => {
    await draftNda(page);                                           // with Juno Logistics Ltd: Corporate & Compliance
    junoRef = ((await page.locator('#ws-head').innerText()).match(/MK-\d+/) || [])[0];
    expect(junoRef, 'the Juno NDA has a reference on its page (MK-…)').toBeTruthy();
    await expect(page.locator('#ws-head'), 'it is filed under ' + CORPORATE).toContainText(CORPORATE);
    await draftNda(page, { with: NAIVAS, stream: SALES });           // with Naivas: Sales & Route-to-Market
    await expect(page.locator('#ws-head'), 'the Naivas NDA is filed under ' + SALES).toContainText(SALES);
    nothingBroke();
  });

  await test.step('3. Amina adds Wanjiru, who may see the Sales stream only', async () => {
    await test.step('On Team & settings, add Wanjiru as an Editor, choose "Only the folders ticked below" and tick Sales', async () => {
      await addColleague(page, hati, WANJIRU, { streams: [SALES] });
    });
    await expect(page.locator('#content [data-st-panel^="person:"]', { hasText: WANJIRU.name }),
      'her row says she sees one stream of six ("1 of 6 streams")').toContainText('1 of 6 streams');
    nothingBroke();
  });

  let wanjiru = null, w = null, list = null;
  await test.step('4. Wanjiru signs in — she sees the Sales contract, and only that', async () => {
    wanjiru = await signInFirstTime(browser, hati, WANJIRU, nothingBroke);
    w = wanjiru.page;
    list = w.locator('#content');
    await test.step('Her Contracts page lists the Naivas NDA and not the Juno one', async () => {
      await w.locator('#side-nav [data-view="register"]').click();    // "Contracts"
      await expect(list, 'she sees the contract with ' + NAIVAS.company).toContainText(NAIVAS.company);
      await expect(list, 'she does not see the contract with ' + THEM.company).not.toContainText(THEM.company);
    });
    await test.step('A link to the Juno NDA does not open it for her', async () => {
      const tab = await openEmailLink(w, hati.base + '/#contract=' + junoRef + '&tab=terms', nothingBroke, 'Wanjiru\'s page');
      await expect(tab.locator('#toast-root'), 'HaTi says it is not hers to open')
        .toContainText('not in your workspace, or you do not have access to it');
      await expect(tab.locator('#content'), 'nothing of the Juno NDA is on her screen').not.toContainText(THEM.company);
      await tab.close();
    });
    nothingBroke();
  });

  await test.step('5. Amina widens her access to Corporate & Compliance — the next time Wanjiru opens HaTi, both are there', async () => {
    await test.step('On Wanjiru\'s row, tick Corporate & Compliance too, and save', async () => {
      await page.locator('#content [data-st-panel^="person:"]', { hasText: WANJIRU.name }).click();   // her row
      await page.locator('#st-drawer label', { hasText: CORPORATE }).locator('input[data-tm-folder]').check();
      await page.locator('#st-dsave').click();                         // "Save & close"
      await expect(page.locator('#content [data-st-panel^="person:"]', { hasText: WANJIRU.name }),
        'her row now says two streams of six').toContainText('2 of 6 streams');
    });
    await test.step('Wanjiru opens HaTi again — both contracts are on her Contracts page', async () => {
      await w.reload();                                                // she opens HaTi again
      await w.locator('#side-nav [data-view="register"]').click();
      await expect(list, 'now she sees the contract with ' + THEM.company).toContainText(THEM.company);
      await expect(list, 'and still the one with ' + NAIVAS.company).toContainText(NAIVAS.company);
    });
    await wanjiru.close();
    nothingBroke();
  });
});
