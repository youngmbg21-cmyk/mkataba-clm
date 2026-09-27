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

   WRITTEN TO BE READ BY A PERSON. The owner asks Claude for a "process flow
   check" and gets back a plain-English report (test/e2e/plain-english-
   reporter.js) built from this file's own words: every step and sub-step is
   titled for a person, and every check carries a sentence saying what should
   be true — so when one fails the report can say what should have happened.
   A check written without its sentence would print as "toBeVisible" instead;
   f395 fails on one.

   Run it:  npm run test:e2e */
const fs = require('node:fs');
const { test: base, expect } = require('@playwright/test');
const { startHatiWithMail } = require('../helpers');

/* Every test that asks for `hati` gets its own fresh server, stopped (and its
   data folder deleted) when the test ends — pass or fail. When a journey
   FAILS, what the server printed and the emails the pretend provider received
   are kept beside the screenshot, so whoever looks into it has them. */
const test = base.extend({
  hati: async ({}, use, testInfo) => {
    const hati = await startHatiWithMail();
    await use(hati);
    if (testInfo.status !== testInfo.expectedStatus) {
      const log = testInfo.outputPath('server-log.txt');
      fs.writeFileSync(log, hati.log());
      await testInfo.attach('server log', { path: log, contentType: 'text/plain' });
      const mail = testInfo.outputPath('emails.json');
      fs.writeFileSync(mail, JSON.stringify(hati.mail.sent.map(m => ({ to: m.to, subject: m.subject, text: m.text })), null, 2));
      await testInfo.attach('emails', { path: mail, contentType: 'application/json' });
    }
    await hati.stop();
  },
});

/* The people in this story. */
const US = { company: 'Acme Kenya Ltd', name: 'Amina Otieno', title: 'Head of Legal',
  email: 'amina@acme.co.ke', password: 'a-strong-password-1' };
const THEM = { company: 'Juno Logistics Ltd', signer: 'Grace Njeri', title: 'Director',
  email: 'grace@junologistics.co.ke' };
const NDA = 'Mutual Non-Disclosure Agreement';

/* The contract's end date: two years from TODAY, worked out when the test runs,
   so the test never goes stale. (A date typed in here would one day be in the
   past, and the contract would end before it began.) */
function twoYearsFromToday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);   // the date box wants YYYY-MM-DD
}

test('Sign up → create a contract → send it for signature', {
  annotation: {
    type: 'what it checks',
    description: 'A new company signs up, drafts an NDA from HaTi\'s templates, names who signs on '
      + 'each side and sends it for signature by email — then checks the email really went to the '
      + 'other side, and that the link in it opens the agreement ready to sign.',
  },
}, async ({ hati, page, browser }) => {
  /* Any crash inside the page fails the step it happened in, even if the
     screen still looked fine. */
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  const nothingBroke = () => expect(pageErrors.join(' · ') || 'nothing',
    'nothing broke inside the page during this step').toBe('nothing');

  await test.step('1. Sign up: create the workspace and the first account', async () => {
    await test.step('Open HaTi for the first time — the sign-up screen appears', async () => {
      await page.goto(hati.base + '/');
      await expect(page.locator('#su-go'),
        'the sign-up screen ("Create your workspace") is showing').toBeVisible();
    });

    await test.step('Fill in the company, name, job title, email and password', async () => {
      await page.locator('#su-org').fill(US.company);        // Organization name
      await page.locator('#su-name').fill(US.name);          // Your full name
      await page.locator('#su-title').fill(US.title);        // Your job title
      await page.locator('#su-email').fill(US.email);        // Work email
      await page.locator('#su-pass').fill(US.password);      // Password
      await page.locator('#su-sample').uncheck();            // start empty: no demo contracts
    });

    await test.step('Press "Create workspace & sign in" — Home greets Amina in her own workspace', async () => {
      await page.locator('#su-go').click();
      await expect(page.locator('.hm-greet h1'),
        'Home greets her by her first name ("Amina")').toContainText(US.name.split(' ')[0]);
      await expect(page.locator('.hm-greet'),
        'Home names her company ("Acme Kenya Ltd")').toContainText(US.company);
    });
    nothingBroke();
  });

  await test.step('2. Create a contract: a Mutual NDA from HaTi\'s templates', async () => {
    await test.step('Press "+ Draft new agreement", then "Draft from HaTi"', async () => {
      await page.locator('#hero-draft').click();                 // "+ Draft new agreement"
      await page.locator('[data-nd-door="draft"]').click();      // "Draft from HaTi" (not upload)
    });

    await test.step('Pick the NDA and answer its questions: who it is with, their email, the end date', async () => {
      await page.locator('[data-wz-tid="ND"]').click();          // "NDA" in the list of templates
      await page.locator('#wz-counterparty').fill(THEM.company); // Counterparty
      await page.locator('#wz-cpemail').fill(THEM.email);        // Their email
      await page.locator('#wz-expiry').fill(twoYearsFromToday()); // End / expiry date
    });

    await test.step('Press "Create draft" — the new contract opens as a draft', async () => {
      await page.locator('#na-create').click();
      const head = page.locator('#ws-head');
      await expect(head, 'the contract\'s name ("' + NDA + '") is at the top').toContainText(NDA);
      await expect(head, 'the top says who it is with ("' + THEM.company + '")').toContainText(THEM.company);
      await expect(head, 'the top says it is still being drafted ("Drafting")').toContainText('Drafting');
    });
    nothingBroke();
  });

  await test.step('3. Send it to the other side for signature', async () => {
    /* HaTi will not send a signing link until someone on EACH side is named,
       so that comes first — on the Signing tab. */
    await test.step('Open the Signing tab and press "Add signers" — the form arrives already filled in', async () => {
      await page.locator('#ws-tabs [data-ws-tab="sign"]').click(); // "Signing" tab
      await page.locator('#sp-add-signer').click();                // "Add signers"
      await expect(page.locator('[data-sp-name="0"]'),
        'our signer is filled in already (' + US.name + ')').toHaveValue(US.name);
      await expect(page.locator('[data-sp-email="1"]'),
        'the other side\'s email is filled in already (' + THEM.email + ')').toHaveValue(THEM.email);
    });

    await test.step('Name who signs for them, put them first, and press "Save route"', async () => {
      await page.locator('[data-sp-name="1"]').fill(THEM.signer);  // who signs for them
      await page.locator('[data-sp-role="1"]').fill(THEM.title);   // and in what capacity
      /* They sign first and we countersign — an ordinary arrangement, and the
         one where their signing email goes out straight away. Move them to the
         top AND give them step 1: the arrow alone moves the row but not its
         step number, and the step number is what decides who signs first. */
      await page.locator('[data-sp-up="1"]').click();              // move them up
      await page.locator('[data-sp-step="0"]').fill('1');          // they sign in step 1
      await page.locator('[data-sp-step="1"]').fill('2');          // we sign in step 2
      await page.locator('#sp-save').click();                      // "Save route"
    });

    await test.step('Press "Share" — the send screen already knows who it is for', async () => {
      await page.locator('#ws-share').click();
      await expect(page.locator('#sh-name'),
        'the send screen is addressed to their signer (' + THEM.signer + ')').toHaveValue(THEM.signer);
      await expect(page.locator('#sh-email'),
        'the send screen has her email address (' + THEM.email + ')').toHaveValue(THEM.email);
    });

    await test.step('Choose "Sign", press "Send by email" and confirm the address', async () => {
      const sign = page.locator('#share-purpose [data-share-purpose="sign"]');
      await sign.click();                                          // what this round is for: "Sign"
      await expect(sign, '"Sign" is chosen as what this round is for').toHaveAttribute('aria-pressed', 'true');
      await page.locator('#share-send').click();                   // "Send by email"
      await expect(page.locator('#cf-ok'),
        'HaTi reads the address back once before a signing link goes out').toContainText(THEM.email);
      await page.locator('#cf-ok').click();                        // "Send to grace@…"
      await expect(page.locator('#sh-result'),
        'the send screen says "Email sent to ' + THEM.email + '"').toContainText(`Email sent to ${THEM.email}`);
    });

    let link = null;
    await test.step('Check the email really went out: once, to her, with her own signing link', async () => {
      const toThem = hati.mail.sent.filter(m => m.to === THEM.email);
      expect(toThem, 'exactly one email reached ' + THEM.email).toHaveLength(1);
      expect(toThem[0].subject, 'the email\'s subject asks her to sign').toContain('sign');
      expect(toThem[0].subject, 'the email\'s subject names the agreement').toContain(NDA);
      link = (toThem[0].text.match(/https?:\/\/\S+#share=\S+/) || [])[0];
      expect(link, 'the email carries her personal signing link').toBeTruthy();
      expect(new URL(link).origin, 'the link points at this HaTi server').toBe(new URL(hati.base).origin);
    });

    /* Opened the way she would — a separate browser with nobody signed in.
       (The test stops there: it checks the link, it does not sign.) */
    await test.step('Open her link the way she would — it shows the agreement, ready to sign', async () => {
      const theirBrowser = await browser.newContext();
      const grace = await theirBrowser.newPage();
      grace.on('pageerror', e => pageErrors.push('on her page: ' + e.message));
      await grace.goto(link);
      await expect(grace.locator('body'), 'her page shows the agreement ("' + NDA + '")').toContainText(NDA);
      await expect(grace.locator('#pt-sign'), 'her page offers "Sign this contract"').toBeVisible();
      await theirBrowser.close();
    });
    nothingBroke();
  });
});
