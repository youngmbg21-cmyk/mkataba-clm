/* JOURNEY 7: A COMPANY STANDARD TEMPLATE — BUILD IT, PUBLISH IT, DRAFT FROM IT.

   Amina turns Acme Kenya Ltd's own consulting agreement into a company
   standard: she pastes its wording into the template builder, Copilot spots
   the three places to fill in, she makes them blanks, files the template and
   publishes it. Then she drafts a contract from it — HaTi offers it first,
   under "Company standards" — and fills its blanks on the new contract.

   Run it:  npm run test:e2e -- -g "Company standard" */
const { test, expect, THEM, watchForCrashes, knownProblem, signUp } = require('./journey');

/* The company's own wording, as it would be copied out of a Word file. */
const WORDING = `Consulting Services Agreement

1. Services
The Consultant shall provide the consulting services described in each statement of work agreed by [Client name].

2. Fees
[Client name] shall pay a monthly fee of [Monthly fee] within thirty (30) days of each invoice.

3. Confidentiality
Each party shall keep the other party's confidential information secret.

4. Term
This Agreement starts on [Start date] and continues for twelve (12) months.

5. Governing Law
This Agreement is governed by the laws of the Republic of Kenya.`;
const NAME = 'Consulting Services Agreement';

test('Company standard template', {
  annotation: [{
    type: 'what it checks',
    description: 'We turn our own consulting agreement into a company standard: paste its wording into the '
      + 'template builder, make the three places to fill in into blanks, file it and publish it. Then we '
      + 'draft a contract from it — offered first, under "Company standards" — and fill its blanks.',
  }, {
    type: 'known problem',
    description: 'Publishing asks "Our standards expect 4 clauses this template does not have — Governing law, '
      + 'Data protection, Payment terms…", though the wording has a governing-law clause and a payment clause: '
      + 'pasted plain wording is read as having no headings. Noted in BUGLOG on 27 Sep 2026, not fixed yet.',
  }],
}, async ({ hati, page }) => {
  const nothingBroke = watchForCrashes(page);
  const rail = page.locator('#tb-railslot');

  await test.step('1. Sign up', async () => {
    await signUp(page, hati);
    nothingBroke();
  });

  await test.step('2. Amina builds the company\'s standard from its own wording', async () => {
    await test.step('On Templates, press "+ New standard contract", then "From a template you have" and "Paste wording"', async () => {
      await page.locator('#side-nav [data-view="templates"]').click();   // "Templates"
      await page.locator('#tpl-new').click();                             // "+ New standard contract"
      await page.locator('[data-ns-start="template"]').click();           // "From a template you have"
      await page.locator('[data-ns-tab="paste"]').click();                // "Paste wording"
      await expect(page.locator('#ns-paste'), 'a box to paste the wording into').toBeVisible();
    });
    await test.step('Paste the consulting agreement and press "Open in the builder"', async () => {
      /* As a person does: the wording is copied (it goes on the clipboard)
         and pasted into the box with Ctrl+V. */
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: hati.base });
      await page.evaluate(text => navigator.clipboard.writeText(text), WORDING);
      await page.locator('#ns-paste').click();
      await page.keyboard.press('Control+V');
      await page.locator('#ns-go').click();                               // "Open in the builder"
      await expect(page.locator('[data-tb-meta="name"]'), 'the builder opens, named "' + NAME + '"').toContainText(NAME);
    });
    await test.step('Copilot spots the three places to fill in — tick them and press "Make 3 blanks"', async () => {
      await expect(rail, 'the builder says "These 3 look like blanks"').toContainText('These 3 look like blanks');
      const boxes = rail.locator('input[type="checkbox"]');
      for (let i = 0; i < 3; i++) await boxes.nth(i).check();             // tick each one
      await rail.locator('[data-tb-cand-make]').click();                  // "Make 3 blanks"
      for (const blank of ['Client name', 'Monthly fee', 'Start date']) {
        await expect(rail, 'there is now a blank called "' + blank + '"').toContainText(blank + ' Edit');
      }
    });
    await test.step('File it: the Sales category and the Sales stream, with a line saying what it is for', async () => {
      await page.locator('[data-tb-meta="stream"]').click();              // the "Stream" chip
      await page.locator('#tpllib-m-cat').selectOption({ label: 'Sales' });
      await page.locator('#tpllib-m-stream').selectOption({ label: 'Sales & Route-to-Market' });
      await page.locator('#tpllib-m-desc').fill('Our standard terms for consulting work.');
      await page.locator('#tpllib-m-save').click();                       // "Save"
      await expect(page.locator('[data-tb-meta="stream"]'), 'the head shows the stream it is filed under')
        .toContainText('Sales & Route-to-Market');
    });
    nothingBroke();
  });

  await test.step('3. Amina publishes it', async () => {
    await test.step('Press "Publish v1" — HaTi asks once before publishing', async () => {
      await page.locator('#tb-publish').click();                          // "Publish v1"
      await expect(page.locator('#tb-pq-go'), 'HaTi asks once, with "Publish anyway"').toBeVisible();
      await knownProblem(async known => {
        await expect.soft(page.locator('#modal-root'),
          known + 'the question does not claim the governing-law clause is missing')
          .not.toContainText('Governing law', { timeout: 2_000 });
      });   // nothing to work round: the clauses are there, so she publishes anyway
      await page.locator('#tb-pq-go').click();                            // "Publish anyway"
    });
    await test.step('Choose how it is dressed — a style, then a structure — and press "Publish v1"', async () => {
      await page.locator('#ds-next').click();                             // "Next: choose a structure"
      await page.locator('#ds-publish').click();                          // "Publish v1"
      await expect(page.locator('#content'), 'the template\'s page says it is published').toContainText('Published');
      await expect(page.locator('#content'), 'and names it').toContainText(NAME);
    });
    nothingBroke();
  });

  await test.step('4. Amina drafts a contract from it', async () => {
    await test.step('Press "+ Draft new agreement", then "Draft from HaTi" — the new standard is offered first', async () => {
      await page.locator('#side-nav [data-view="dashboard"]').click();
      await page.locator('#hero-draft').click();                          // "+ Draft new agreement"
      await page.locator('[data-nd-door="draft"]').click();               // "Draft from HaTi"
      await expect(page.locator('#modal-root'), 'the list starts with "Company standards"').toContainText(/company standards/i);
      const ours = page.locator('#modal-root [data-wz-lib]', { hasText: NAME });
      await expect(ours, '"' + NAME + '" is there, and already chosen').toHaveClass(/\bon\b/);
    });
    await test.step('Say who it is with, their email and the value, and press "Create draft"', async () => {
      await page.locator('#ce-counterparty').fill(THEM.company);
      await page.locator('#ce-cpemail').fill(THEM.email);
      await page.locator('#ce-value').fill('600000');
      await page.locator('#na-create').click();                           // "Create draft"
      const head = page.locator('#ws-head');
      await expect(head, 'the new contract is named "' + NAME + '"').toContainText(NAME);
      await expect(head, 'it says it was created from the template').toContainText('Created from template');
    });
    await test.step('On the Document tab, fill the template\'s three blanks — the wording takes the answers', async () => {
      await page.locator('#ws-tabs [data-ws-tab="docs"]').click();        // "Document" tab
      const answers = [THEM.company, 'KES 50,000', '1 November 2026'];
      for (let i = 0; i < answers.length; i++) {
        await page.locator(`#doc-right [data-tplf="${i}"]`).fill(answers[i]);
        await page.keyboard.press('Tab');
      }
      const paper = page.locator('#doc-canvas');
      await expect(paper, 'the wording names the client').toContainText('agreed by ' + THEM.company);
      await expect(paper, 'the wording carries the fee').toContainText('a monthly fee of KES 50,000');
      await expect(paper, 'the wording carries the start date').toContainText('starts on 1 November 2026');
    });
    nothingBroke();
  });
});
