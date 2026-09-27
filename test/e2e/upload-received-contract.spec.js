/* JOURNEY 6: UPLOAD A CONTRACT THE OTHER SIDE SENT → COPILOT READS IT.

   Juno Logistics Ltd sends Acme Kenya Ltd their own supply agreement. Amina
   uploads the file. HaTi's first screen already shows what Copilot read out
   of it — who it is from and what it is worth — for her to confirm. She files
   it, and HaTi reads the whole contract on arrival: a plain-English brief, a
   check against Our standards, and the promises it makes, which she adds to
   the contract's obligations.

   The file is a short plain-text agreement written into this journey, so it
   is the same every run; the pretend Copilot reads it with fixed rules.

   Run it:  npm run test:e2e -- -g "Upload a contract" */
const { test, expect, THEM, watchForCrashes, knownProblem, signUp } = require('./journey');

const THEIR_CONTRACT = `SUPPLY AGREEMENT

This Supply Agreement is made between Juno Logistics Ltd ("the Supplier") and Acme Kenya Ltd ("the Buyer").

1. Supply
The Supplier shall supply the goods listed in each purchase order issued by the Buyer.

2. Price and Payment
The Buyer shall pay each invoice within sixty (60) days of receipt. The price for the first year is KES 4,800,000.

3. Delivery
The Supplier shall deliver the goods to the Buyer's warehouse in Nairobi within fourteen (14) days of each purchase order.

4. Confidentiality
Each party shall keep the other party's confidential information secret and use it only for this Agreement.

5. Liability
The Supplier's total liability under this Agreement is limited to the price paid in the twelve (12) months before the claim.

6. Term and Termination
This Agreement runs for two (2) years from signature. Either party may terminate it on ninety (90) days' written notice.

7. Governing Law
This Agreement is governed by the laws of the Republic of Kenya.
`;
const NAME = 'Supply Agreement — Juno Logistics Ltd';

test('Upload a contract the other side sent → Copilot reads it', {
  annotation: [{
    type: 'what it checks',
    description: 'We upload a supply agreement the other side sent us. The first screen shows what Copilot '
      + 'read out of it (who it is from, what it is worth); we file it, and HaTi reads it on arrival — a '
      + 'plain-English brief, a check against Our standards, and the promises it makes, which we add to the '
      + 'contract\'s obligations.',
  }, {
    type: 'known problem',
    description: 'Right after it is read, the contract\'s header still says "COPILOT Not read yet" while the '
      + 'strip under it says HaTi read the contract; a reload puts it right. Noted in BUGLOG on 27 Sep 2026, '
      + 'not fixed yet.',
  }],
}, async ({ hati, page }) => {
  const nothingBroke = watchForCrashes(page);
  const strip = page.locator('#kt-triage');

  await test.step('1. Sign up', async () => {
    await signUp(page, hati);
    nothingBroke();
  });

  await test.step('2. Amina uploads the supply agreement Juno Logistics Ltd sent', async () => {
    await test.step('Press "+ Draft new agreement", then "Upload a contract", and choose the file', async () => {
      await page.locator('#hero-draft').click();                     // "+ Draft new agreement"
      await page.locator('[data-nd-door="upload"]').click();         // "Upload a contract"
      await page.locator('#up-file').setInputFiles({ name: 'Juno_Supply_Agreement.txt',
        mimeType: 'text/plain', buffer: Buffer.from(THEIR_CONTRACT, 'utf8') });
      await expect(page.locator('#up-go'), 'HaTi shows what it read, to confirm before filing').toBeVisible();
    });
    await test.step('The first screen already shows who it is from and what it is worth, marked as read from the document', async () => {
      await expect(page.locator('#up-cp'), 'it read who sent it ("' + THEM.company + '")').toHaveValue(THEM.company);
      await expect(page.locator('#up-value'), 'it read what it is worth (4,800,000)').toHaveValue('4800000');
      await expect(page.locator('#modal-root'), 'those answers are marked "Read from the document"')
        .toContainText(/read from the document/i);
    });
    await test.step('Name it, add their email, keep "Read this contract now" ticked, and press "File contract"', async () => {
      await page.locator('#up-name').fill(NAME);
      await page.locator('#up-cpemail').fill(THEM.email);
      await expect(page.locator('#up-triage'), '"Read this contract now" is ticked').toBeChecked();
      await page.locator('#up-go').click();                          // "File contract"
      await expect(page.locator('#ws-head'), 'the contract opens, from ' + THEM.company).toContainText(THEM.company);
    });
    nothingBroke();
  });

  await test.step('3. HaTi reads it on arrival', async () => {
    await test.step('The contract says what HaTi read: a brief, a check against Our standards, and the promises it makes', async () => {
      await expect(strip, 'the strip says "HaTi read this contract"').toContainText('HaTi read this contract');
      await expect(strip, 'the brief is written').toContainText('Brief written');
      await expect(strip, 'it was checked against Our standards').toContainText('Standards checked');
      await expect(strip.locator('[data-kt-tri-go="oblig"]'), 'two promises were found').toContainText('2');
    });
    await test.step('The header says it has been read too', async () => {
      await knownProblem(async known => {
        await expect.soft(page.locator('#ws-head'), known + 'the header\'s Copilot fact no longer says "Not read yet"')
          .not.toContainText('Not read yet', { timeout: 5_000 });
      });   // nothing to work round: the strip above says it, and a reload fixes the header
    });
    await test.step('Open the brief from the strip — Copilot\'s summary, in plain words', async () => {
      await strip.locator('[data-kt-tri-go="brief"]').click();       // "Brief written →"
      await expect(page.locator('#side-panel'), 'the brief opens and says what the agreement is')
        .toContainText('What this agreement is');
      await expect(page.locator('#side-panel'), 'the brief names the money the document states').toContainText('KES 4,800,000');
      await page.locator('#side-panel-x').click();                   // ✕
    });
    await test.step('Open the promises it found, and add both to the contract\'s obligations', async () => {
      await strip.locator('[data-kt-tri-go="oblig"]').click();       // "2 Obligations found →"
      await expect(page.locator('#modal-root'), 'each promise is shown with the words it came from')
        .toContainText('shall pay each invoice within sixty (60) days');
      await page.locator('#or-add').click();                         // "Add 2 obligations"
      await expect(page.locator('#ws-tabs [data-ws-tab="oblig"]'), 'the Obligations tab now counts two').toContainText('2');
    });
    nothingBroke();
  });
});
