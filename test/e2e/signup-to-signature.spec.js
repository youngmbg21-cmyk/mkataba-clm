/* THE MOST IMPORTANT JOURNEY, END TO END:
   a new customer signs up → drafts a contract → sends it for signature.

   It drives the REAL app in a real Chrome and presses the same buttons a person
   presses. Nothing on the page is faked. Two things AROUND the app are
   stand-ins, so the test is safe and gives the same answer every time:

     · a brand-new, empty HaTi server with its own throwaway data folder — so
       the sign-up screen always appears and no real data is touched;
     · a pretend email provider that RECORDS every email instead of sending it —
       so the test can prove the signing email went out, to the right person,
       without emailing anybody real.

   Both come from test/helpers.js, the helper the rest of the suite uses.

   Run it:  npm run test:e2e */
const { test: base, expect } = require('@playwright/test');
const { startHatiWithMail } = require('../helpers');

/* Every test that asks for `hati` gets its own fresh server, stopped (and its
   data folder deleted) when the test ends — pass or fail. */
const test = base.extend({
  hati: async ({}, use) => {
    const hati = await startHatiWithMail();
    await use(hati);
    await hati.stop();
  },
});

/* The people in this story. */
const US = { company: 'Acme Kenya Ltd', name: 'Amina Otieno', title: 'Head of Legal',
  email: 'amina@acme.co.ke', password: 'a-strong-password-1' };
const THEM = { company: 'Juno Logistics Ltd', signer: 'Grace Njeri', title: 'Director',
  email: 'grace@junologistics.co.ke' };

/* The contract's end date: two years from TODAY, worked out when the test runs,
   so the test never goes stale. (A date typed in here would one day be in the
   past, and the contract would end before it began.) */
function twoYearsFromToday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);   // the date box wants YYYY-MM-DD
}

test('sign up → create a contract → send it for signature', async ({ hati, page, browser }) => {
  /* Any crash inside the page fails the test, even if every step still looked
     fine on screen. */
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  await test.step('1. Sign up: create the workspace and the first account', async () => {
    await page.goto(hati.base + '/');
    // A brand-new server shows the sign-up screen ("Create your workspace").
    await expect(page.locator('#su-go')).toBeVisible();

    await page.locator('#su-org').fill(US.company);        // Organization name
    await page.locator('#su-name').fill(US.name);          // Your full name
    await page.locator('#su-title').fill(US.title);        // Your job title
    await page.locator('#su-email').fill(US.email);        // Work email
    await page.locator('#su-pass').fill(US.password);      // Password
    await page.locator('#su-sample').uncheck();            // start empty: no demo contracts
    await page.locator('#su-go').click();                  // "Create workspace & sign in"

    // We are signed in and on Home, greeted by first name, in our own workspace.
    await expect(page.locator('.hm-greet h1')).toContainText(US.name.split(' ')[0]);
    await expect(page.locator('.hm-greet')).toContainText(US.company);
  });

  await test.step('2. Create a contract: a Mutual NDA from HaTi\'s templates', async () => {
    await page.locator('#hero-draft').click();                 // "+ Draft new agreement"
    await page.locator('[data-nd-door="draft"]').click();      // "Draft from HaTi" (not upload)
    await page.locator('[data-wz-tid="ND"]').click();          // "NDA" in the list of templates

    // The template's questions, answered on the right-hand card.
    await page.locator('#wz-counterparty').fill(THEM.company); // Counterparty
    await page.locator('#wz-cpemail').fill(THEM.email);        // Their email
    await page.locator('#wz-expiry').fill(twoYearsFromToday()); // End / expiry date
    await page.locator('#na-create').click();                  // "Create draft"

    // The new contract opens: its name, who it is with, and that it is a draft.
    const head = page.locator('#ws-head');
    await expect(head).toContainText('Mutual Non-Disclosure Agreement');
    await expect(head).toContainText(THEM.company);
    await expect(head).toContainText('Drafting');
  });

  await test.step('3. Send it to the other side for signature', async () => {
    /* 3a. SAY WHO SIGNS. HaTi will not send a signing link until someone on
       EACH side is named, so this comes first — on the Signing tab. */
    await page.locator('#ws-tabs [data-ws-tab="sign"]').click();   // "Signing" tab
    await page.locator('#sp-add-signer').click();                  // "Add signers"

    // The form opens already filled in: us on row 1, the other company on
    // row 2 with the email we gave when creating the contract.
    await expect(page.locator('[data-sp-name="0"]')).toHaveValue(US.name);
    await expect(page.locator('[data-sp-email="1"]')).toHaveValue(THEM.email);
    await page.locator('[data-sp-name="1"]').fill(THEM.signer);    // who signs for them
    await page.locator('[data-sp-role="1"]').fill(THEM.title);     // and in what capacity

    /* They sign first and we countersign — an ordinary arrangement, and the
       one where their signing email goes out straight away. Move them to the
       top AND give them step 1: the arrow alone moves the row but not its step
       number, and the step number is what decides who signs first. */
    await page.locator('[data-sp-up="1"]').click();                // move them up
    await page.locator('[data-sp-step="0"]').fill('1');            // they sign in step 1
    await page.locator('[data-sp-step="1"]').fill('2');            // we sign in step 2
    await page.locator('#sp-save').click();                        // "Save route"

    /* 3b. SEND IT. */
    await page.locator('#ws-share').click();                       // "Share"

    // The send screen already knows who the link is for, from the signing route.
    await expect(page.locator('#sh-name')).toHaveValue(THEM.signer);
    await expect(page.locator('#sh-email')).toHaveValue(THEM.email);

    const sign = page.locator('#share-purpose [data-share-purpose="sign"]');
    await sign.click();                                            // what this round is for: "Sign"
    await expect(sign).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#share-send').click();                     // "Send by email"
    // HaTi reads the address back once before a signing link goes out.
    await expect(page.locator('#cf-ok')).toContainText(THEM.email);
    await page.locator('#cf-ok').click();                          // "Send to grace@…"

    // What the sender sees: it went, and to whom.
    await expect(page.locator('#sh-result')).toContainText(`Email sent to ${THEM.email}`);

    /* 3c. AND IT REALLY WENT. The pretend email provider holds exactly one
       email for their signer: a signing request carrying her personal link. */
    const toThem = hati.mail.sent.filter(m => m.to === THEM.email);
    expect(toThem).toHaveLength(1);
    expect(toThem[0].subject).toContain('sign');
    expect(toThem[0].subject).toContain('Mutual Non-Disclosure Agreement');
    const link = (toThem[0].text.match(/https?:\/\/\S+#share=\S+/) || [])[0];
    expect(link, 'the email carries her personal signing link').toBeTruthy();
    expect(link.startsWith(hati.base + '/')).toBe(true);

    /* 3d. THE LINK WORKS. Opened the way she would — a separate browser with
       nobody signed in — it shows the agreement, ready for her to sign. (The
       test stops there: it checks the link, it does not sign.) */
    const theirBrowser = await browser.newContext();
    const grace = await theirBrowser.newPage();
    grace.on('pageerror', e => pageErrors.push('on her page: ' + e.message));
    await grace.goto(link);
    await expect(grace.locator('body')).toContainText('Mutual Non-Disclosure Agreement');
    await expect(grace.locator('#pt-sign')).toBeVisible();         // "Sign this contract"
    await theirBrowser.close();
  });

  expect(pageErrors, 'no errors inside the page along the way').toEqual([]);
});
