/* JOURNEY 2: BOTH SIDES SIGN → THE CONTRACT IS SEALED AS SIGNED.

   It starts where the first journey ends (an NDA sent to Grace for
   signature), then Grace signs on her own page, Amina settles what HaTi asks
   of her before a signature and signs inside HaTi, and the contract is sealed:
   status Executed, a seal naming both signatures, and the signed PDF emailed
   to both sides.

   What Amina settles is HaTi's own list ("Before you sign"): with the pretend
   Copilot answering, it asks her to read the final wording again (one press),
   to add the promise Copilot found to the obligations, and to read the brief.
   If that list changes on purpose, this journey is where it shows.

   Run it:  npm run test:e2e -- -g "Both sides" */
const { test, expect, US, THEM, NDA, watchForCrashes, openAsThem, mailTo, knownProblem,
  signUp, draftNda, nameSignersTheyFirst, sendForSignature } = require('./journey');

test('Both sides sign → the contract is sealed as signed', {
  annotation: [{
    type: 'what it checks',
    description: 'An NDA goes to the other side for signature; their signer signs on her own page '
      + 'with a code HaTi emails her; our signer settles what HaTi asks before a signature and signs '
      + 'inside HaTi — then the contract reads Executed, its seal names both signatures, and both '
      + 'sides are emailed the signed PDF.',
  }, {
    type: 'known problem',
    description: 'When Amina opens HaTi from the "your turn to sign" email, the contract still says '
      + 'Grace has not signed ("0 of 2 signed", "Not your turn") until she reloads the page. HaTi has '
      + 'recorded Grace\'s signature by then; the page keeps showing its older copy. Noted in BUGLOG '
      + 'on 27 Sep 2026, not fixed yet.',
  }],
}, async ({ hati, page, browser }) => {
  const nothingBroke = watchForCrashes(page);
  let link = null;

  const aminasBrowser = page.context();
  await test.step('1. Get an NDA to Grace for signature, as the first journey does', async () => {
    await signUp(page, hati);
    await draftNda(page);
    await nameSignersTheyFirst(page);
    link = await sendForSignature(page, hati);
    nothingBroke();
    /* She closes HaTi for now, and comes back later through the email HaTi
       sends her. (With HaTi still open in another tab, a tab opened from that
       email can say "Not your turn" until it is reloaded — noted in BUGLOG
       on 27 Sep 2026, not fixed here.) */
    await test.step('Amina closes HaTi for now', async () => { await page.close(); });
  });

  await test.step('2. Grace signs on her own page', async () => {
    const grace = await openAsThem(browser, link, nothingBroke);
    const g = grace.page;

    await test.step('Open her link and press "Sign this contract" — HaTi asks her to adopt a signature', async () => {
      await g.locator('#pt-sign').click();                       // "Sign this contract"
      await expect(g.locator('#sig-adopt-go'), 'the "Adopt your signature" box is open').toBeVisible();
    });

    await test.step('Choose "Type" (her name is already there) and press "Adopt & sign" — HaTi asks for a code it emails her', async () => {
      await g.locator('[data-sig-tab="type"]').click();          // "Type"
      await expect(g.locator('#sig-typed'), 'her name is filled in already (' + THEM.signer + ')').toHaveValue(THEM.signer);
      await g.locator('#sig-adopt-go').click();                  // "Adopt & sign"
      await expect(g.locator('#pt-otp'), 'HaTi asks her for the one-time code it emails her').toBeVisible();
    });

    await test.step('Type the code from that email and press "Verify & sign" — her page says she has signed', async () => {
      const codeMail = () => mailTo(hati, THEM.email).filter(m => /signing code/i.test(m.subject)).pop();
      await expect.poll(() => !!codeMail(), { message: 'an email with her one-time signing code reached ' + THEM.email }).toBe(true);
      const code = (codeMail().text.match(/\b(\d{6})\b/) || [])[1];
      expect(code, 'the email carries a six-digit code').toBeTruthy();
      await g.locator('#pt-otp').fill(code);
      await g.locator('#pt-otp-go').click();                     // "Verify & sign"
      await expect(g.locator('body'), 'her page says "' + THEM.signer + ' signed this contract"')
        .toContainText(THEM.signer + ' signed this contract');
    });
    await grace.close();

    await test.step('HaTi emails Amina: Grace has signed, and now it is her turn', async () => {
      await expect.poll(() => mailTo(hati, US.email).some(m => /^Signed:/.test(m.subject)),
        { message: 'an email tells Amina that Grace signed' }).toBe(true);
      await expect.poll(() => mailTo(hati, US.email).some(m => /Your signature is needed/.test(m.subject)),
        { message: 'an email tells Amina it is her turn to sign' }).toBe(true);
    });
    nothingBroke();
  });

  /* Amina comes back the way a person does: the link in that email. It opens
     HaTi in her own browser, where she is still signed in. */
  let amina = null;
  await test.step('3. Amina settles what HaTi asks of her before she signs', async () => {
    await test.step('Open the link in her email — the contract opens on its Signing tab: Grace has signed, a few things are left to settle', async () => {
      const turn = mailTo(hati, US.email).filter(m => /Your signature is needed/.test(m.subject)).pop();
      const back = (turn.text.match(/https?:\/\/\S+#contract=\S+/) || [])[0];
      expect(back, 'the email carries a link to the contract\'s Signing tab').toBeTruthy();
      amina = await aminasBrowser.newPage();
      nothingBroke.watch(amina, 'her page');
      await amina.goto(back);
      await knownProblem(async known => {
        await expect.soft(amina.locator('#signing-order'),
          known + 'as soon as the page opens, the signing order shows Grace has signed ("1 of 2 signed")')
          .toContainText('1 of 2 signed', { timeout: 8_000 });
      }, async () => {
        /* What a person does when the page looks out of date: reload it. It
           comes back on the Document tab, so she opens Signing again. */
        await amina.reload();
        await amina.locator('#ws-tabs [data-ws-tab="sign"]').click();
      });
      await expect(amina.locator('#signing-order'), 'the signing order is on the screen').toBeVisible();
      await expect(amina.locator('#signing-order'),
        'the signing order shows Grace has signed ("1 of 2 signed")').toContainText('1 of 2 signed');
      await expect(amina.locator('#sign-btn'), 'the Sign button is on the screen').toBeVisible();
      await expect(amina.locator('#sign-btn'),
        'the Sign button says what is still to settle ("to settle")').toContainText('to settle');
    });

    await test.step('Press the button that runs Copilot\'s readings again, and confirm', async () => {
      await amina.locator('#sc-run').click();                    // "Run 2 readings"
      await amina.locator('#cf-ok').click();                     // "Run it"
    });

    await test.step('Copilot offers the promise it found in the final wording — add it to the obligations', async () => {
      const add = amina.locator('#or-add');
      await expect(add, 'HaTi offers the promise Copilot found, to add to the obligations').toBeVisible();
      await add.click();                                         // "Add 1 obligation"
      await expect(amina.locator('#ws-tabs [data-ws-tab="oblig"]'),
        'the Obligations tab now counts one').toContainText('1');
    });

    await test.step('Open the brief, press "I have read this", and close it', async () => {
      await amina.locator('[data-sc-row="brief-read"] [data-kt-brief="open"]').click();  // "Read the brief"
      await amina.locator('[data-brief-read]').click();          // "I have read this"
      await expect(amina.locator('#side-panel'), 'the brief says Amina has read it')
        .toContainText('Read by ' + US.name);
      await amina.locator('#side-panel-x').click();              // ✕
    });

    await test.step('Nothing is left to settle: the button now offers her signature', async () => {
      await expect(amina.locator('#sign-btn'), 'the Sign button no longer says "to settle"').not.toContainText('to settle');
      await expect(amina.locator('#sign-btn'), 'nothing holds her signature any more').toHaveAttribute('data-sign-holds', '0');
    });
    nothingBroke();
  });

  await test.step('4. Amina signs, and HaTi seals the contract', async () => {
    await test.step('Press "Sign" — HaTi asks her to adopt a signature', async () => {
      await amina.locator('#sign-btn').click();
      await expect(amina.locator('#sig-adopt-go'), 'the "Adopt your signature" box is open').toBeVisible();
    });

    await test.step('Choose "Type", tick "I intend to sign electronically" and press "Adopt & sign"', async () => {
      await amina.locator('[data-sig-tab="type"]').click();      // "Type"
      await expect(amina.locator('#sig-typed'), 'her name is filled in already (' + US.name + ')').toHaveValue(US.name);
      await amina.locator('#sig-intent').check();                // "I intend to sign electronically"
      await amina.locator('#sig-adopt-go').click();              // "Adopt & sign"
    });

    await test.step('The contract now reads "Executed", and its seal names both signatures', async () => {
      await expect(amina.locator('#ws-head'), 'the top of the contract says "Executed"').toContainText('Executed');
      const seal = amina.locator('.seal-in');
      await expect(seal, 'the seal says "Executed & Sealed"').toContainText('Executed & Sealed');
      await expect(seal, 'the seal names their signer (' + THEM.signer + ')').toContainText(THEM.signer);
      await expect(seal, 'the seal names our signer (' + US.name + ')').toContainText(US.name);
    });
    nothingBroke();
  });

  await test.step('5. Both sides get the signed copy', async () => {
    await test.step('One email to each side says it is fully executed, with the signed PDF attached', async () => {
      for (const who of [THEM.email, US.email]) {
        await expect.poll(() => mailTo(hati, who).filter(m => /Fully executed/.test(m.subject)).length,
          { message: 'one "Fully executed" email reached ' + who }).toBe(1);
        const done = mailTo(hati, who).find(m => /Fully executed/.test(m.subject));
        expect(done.subject, 'the email names the agreement').toContain(NDA);
        const pdf = (done.attachments || [])[0];
        expect(pdf && pdf.filename, 'the email to ' + who + ' carries a PDF of the signed contract').toMatch(/\.pdf$/);
        expect(Buffer.from(pdf.content || '', 'base64').subarray(0, 5).toString(),
          'the attachment really is a PDF file').toBe('%PDF-');
      }
    });

    await test.step('Grace\'s link now shows the sealed contract — nothing more can be signed there', async () => {
      const grace = await openAsThem(browser, link, nothingBroke);
      await expect(grace.page.locator('body'), 'her page says "This contract is executed and sealed"')
        .toContainText('This contract is executed and sealed');
      await expect(grace.page.locator('#pt-sign'), 'her "Sign this contract" button is greyed out').toBeDisabled();
      await grace.close();
    });
    nothingBroke();
  });
});
