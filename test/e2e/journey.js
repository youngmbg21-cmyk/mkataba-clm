/* THE JOURNEYS' SHARED PARTS: the stand-ins around the app, the people in the
   stories, and the steps more than one journey takes.

   Not a journey itself (the name does not end in .spec.js, so Playwright never
   runs it as one). Every journey in this folder takes its `test` from here, so
   every journey gets the same brand-new server and the same stand-ins.

   WRITTEN TO BE READ, like the journeys: every check in this file carries its
   sentence, because when one fails it is that sentence the owner reads. f395
   (4) reads this file as well as the journeys. */
const fs = require('node:fs');
const http = require('node:http');
const { test: base, expect } = require('@playwright/test');
const { startHatiWithMail } = require('../helpers');

/* ---- A PRETEND COPILOT ----
   HaTi's Copilot readings (the brief, the check against the playbook, the
   promises a contract makes) are answered by a model on the internet. Here a
   small stand-in answers instead: each reading by its own name, with a short,
   plausible answer, so the readings really complete and nothing leaves this
   computer. What HaTi does WITH the answer is the real product.
   Every other question gets an empty answer, as the rest of the suite's
   stand-in gives. */
function copilotAnswer(tool, prompt) {
  const doc = prompt.split('DOCUMENT:\n')[1] || prompt;
  const promise = (doc.match(/[^.\n]*\bconfidential[^.\n]*\bshall\b[^.\n]*\./i)
    || doc.match(/[^.\n]*\bshall\b[^.\n]*\bconfidential[^.\n]*\./i)
    || doc.match(/[^.\n]*\bshall\b[^.\n]{10,160}\./i) || [''])[0].trim().slice(0, 190);
  switch (tool) {
    case 'file_contract': {
      /* The facts on an uploaded document's first screen, read off the words
         the way the real reading would — each with the phrase it came from. */
      const firm = (doc.match(/\b[A-Z][A-Za-z&.]*(?:\s[A-Z][A-Za-z&.]*)*\s(?:Ltd|Limited|PLC)\b/g) || [])
        .find(n => !/Acme/.test(n)) || '';
      const kes = /KES\s?([\d,]+)/.exec(doc);
      const law = /laws of (?:the )?(?:Republic of )?([A-Z]\w+)/.exec(doc);
      const pay = /within ([a-z]+ \(\d+\) days of receipt)/.exec(doc);
      const meta = { counterparty: firm, category: firm ? 'supplier' : 'other', confidence: 'high', sourceSpans: {} };
      if (firm) meta.sourceSpans.counterparty = firm;
      if (kes) { meta.value = Number(kes[1].replace(/,/g, '')); meta.currency = 'KES'; meta.sourceSpans.value = kes[0]; }
      if (law) { meta.governingLaw = law[1]; meta.sourceSpans.governingLaw = law[0]; }
      if (pay) { meta.paymentTerms = pay[1]; meta.sourceSpans.paymentTerms = pay[0]; }
      return meta;
    }
    case 'contract_brief': {
      const kes = /KES\s?[\d,]+/.exec(doc);
      return {
        overview: 'What this agreement is, between whom, and what each side has to do — in plain words.',
        term: { start: 'On signature', end: 'As stated in the agreement', notice: '' },
        money: { value: kes ? kes[0] : 'No money changes hands', paymentTerms: '' },
        watchouts: [], unusual: [],
      };
    }
    case 'playbook_review': {
      /* One answer per standard it was asked about, word for word: "meets it". */
      let pb = {};
      try { pb = JSON.parse((prompt.split('PLAYBOOK:\n')[1] || '').split('\n\nDOCUMENT:')[0]); } catch (_) {}
      const asked = [...(pb.positions || []), ...(pb.ranges || [])];
      return { verdicts: asked.map(p => ({ category: p.category, status: 'aligned', quote: '', position: p.pos || '' })) };
    }
    case 'list_obligations': {
      const found = [{ desc: 'Keep the other side\'s confidential information secret', due: '', recurring: 'none', quote: promise }];
      const pays = doc.match(/[^.\n]*\bshall pay\b[^.\n]*\./i);
      if (pays) found.push({ desc: 'Pay each invoice on time', due: '', recurring: 'none', quote: pays[0].trim().slice(0, 190) });
      return { obligations: found };
    }
    case 'deliver_answer':
      return { answer: 'stubbed answer', citations: [] };
    default:
      return {};
  }
}
function startCopilotStandIn() {
  const asked = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      const tool = (body.tool_choice && body.tool_choice.name)
        || (Array.isArray(body.tools) && body.tools.length ? body.tools[0].name : 'deliver_answer');
      const last = (body.messages || []).slice(-1)[0];
      const prompt = !last ? '' : typeof last.content === 'string' ? last.content
        : (last.content || []).map(b => b.text || '').join('\n');
      asked.push(tool);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_stand_in', type: 'message', role: 'assistant', model: body.model || 'stand-in',
        content: [{ type: 'tool_use', id: 'tu_stand_in', name: tool, input: copilotAnswer(tool, prompt) }],
        usage: { input_tokens: 10, output_tokens: 5 }, stop_reason: 'end_turn',
      }));
    });
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({
      base: 'http://127.0.0.1:' + server.address().port,
      asked,
      stop: () => new Promise(r => server.close(r)),
    }));
  });
}

/* Every journey that asks for `hati` gets its own fresh server (a pretend
   email provider and the pretend Copilot around it), stopped and its data
   folder deleted when the journey ends, pass or fail. When a journey FAILS,
   what the server printed, the emails the pretend provider received and the
   readings Copilot was asked for are kept beside the screenshot. */
const test = base.extend({
  hati: async ({}, use, testInfo) => {
    const copilot = await startCopilotStandIn();
    const hati = await startHatiWithMail({}, { ANTHROPIC_BASE_URL: copilot.base });
    hati.copilot = copilot;
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
    await copilot.stop();
  },
});

/* ---- THE PEOPLE IN THE STORIES ---- */
const US = { company: 'Acme Kenya Ltd', name: 'Amina Otieno', title: 'Head of Legal',
  email: 'amina@acme.co.ke', password: 'a-strong-password-1' };
const THEM = { company: 'Juno Logistics Ltd', signer: 'Grace Njeri', title: 'Director',
  email: 'grace@junologistics.co.ke' };
const NDA = 'Mutual Non-Disclosure Agreement';
/* A colleague Amina adds: an Editor, on a temporary password she chooses,
   which he replaces with his own the first time he signs in. */
const BRIAN = { name: 'Brian Kamau', title: 'Legal Counsel', email: 'brian@acme.co.ke',
  temporary: 'temporary-pass-1', password: 'brians-own-pass-1' };

/* A date N years from TODAY, worked out when the journey runs, so it never
   goes stale. (A date typed in here would one day be in the past.) */
function yearsFromToday(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + n);
  return d.toISOString().slice(0, 10);   // a date box wants YYYY-MM-DD
}

/* Any crash inside a page fails the step it happened in, even if the screen
   still looked fine. `nothingBroke()` is that check; `nothingBroke.watch(page,
   who)` adds another page (the other side's, a second tab). */
function watchForCrashes(page) {
  const errors = [];
  const watch = (p, who) => p.on('pageerror', e => errors.push((who ? 'on ' + who + ': ' : '') + e.message));
  watch(page);
  const nothingBroke = () => expect(errors.join(' · ') || 'nothing',
    'nothing broke inside the page during this step').toBe('nothing');
  nothingBroke.watch = watch;
  return nothingBroke;
}

/* A shared step runs its parts either as the journey's own sub-steps
   (`detail` — the first journey, which proves them one at a time) or all
   under ONE title (every later journey, which only needs to get there).
   Either way every check inside still runs and still says what it expects. */
async function inParts(o, title, parts) {
  if (!(o && o.detail)) return test.step(title, async () => { let r; for (const [, fn] of parts) r = await fn(); return r; });
  let r;
  for (const [t, fn] of parts) r = await test.step(t, fn);
  return r;
}

/* ---- THE STEPS MORE THAN ONE JOURNEY TAKES ---- */

async function signUp(page, hati, o) {
  return inParts(o, 'Sign up: Acme Kenya Ltd\'s workspace, with Amina as the first account', [
    ['Open HaTi for the first time — the sign-up screen appears', async () => {
      await page.goto(hati.base + '/');
      await expect(page.locator('#su-go'),
        'the sign-up screen ("Create your workspace") is showing').toBeVisible();
    }],
    ['Fill in the company, name, job title, email and password', async () => {
      await page.locator('#su-org').fill(US.company);        // Organization name
      await page.locator('#su-name').fill(US.name);          // Your full name
      await page.locator('#su-title').fill(US.title);        // Your job title
      await page.locator('#su-email').fill(US.email);        // Work email
      await page.locator('#su-pass').fill(US.password);      // Password
      await page.locator('#su-sample').uncheck();            // start empty: no demo contracts
    }],
    ['Press "Create workspace & sign in" — Home greets Amina in her own workspace', async () => {
      await page.locator('#su-go').click();
      await expect(page.locator('.hm-greet h1'),
        'Home greets her by her first name ("Amina")').toContainText(US.name.split(' ')[0]);
      await expect(page.locator('.hm-greet'),
        'Home names her company ("Acme Kenya Ltd")').toContainText(US.company);
    }],
  ]);
}

async function draftNda(page, o) {
  return inParts(o, 'Draft a Mutual NDA with Juno Logistics Ltd from HaTi\'s templates', [
    ['Press "+ Draft new agreement", then "Draft from HaTi"', async () => {
      await page.locator('#side-nav [data-view="dashboard"]').click();   // "Home", where the button is
      await page.locator('#hero-draft').click();                 // "+ Draft new agreement"
      await page.locator('[data-nd-door="draft"]').click();      // "Draft from HaTi" (not upload)
    }],
    ['Pick the NDA and answer its questions: who it is with, their email, the end date', async () => {
      await page.locator('[data-wz-tid="ND"]').click();          // "NDA" in the list of templates
      await page.locator('#wz-counterparty').fill(THEM.company); // Counterparty
      await page.locator('#wz-cpemail').fill(THEM.email);        // Their email
      await page.locator('#wz-expiry').fill(yearsFromToday(2));  // End / expiry date
    }],
    ['Press "Create draft" — the new contract opens as a draft', async () => {
      await page.locator('#na-create').click();
      const head = page.locator('#ws-head');
      await expect(head, 'the contract\'s name ("' + NDA + '") is at the top').toContainText(NDA);
      await expect(head, 'the top says who it is with ("' + THEM.company + '")').toContainText(THEM.company);
      await expect(head, 'the top says it is still being drafted ("Drafting")').toContainText('Drafting');
    }],
  ]);
}

/* HaTi will not send a signing link until someone on EACH side is named. */
async function nameSignersTheyFirst(page, o) {
  return inParts(o, 'Name who signs: Grace for Juno Logistics Ltd first, then Amina', [
    ['Open the Signing tab and press "Add signers" — the form arrives already filled in', async () => {
      await page.locator('#ws-tabs [data-ws-tab="sign"]').click(); // "Signing" tab
      await page.locator('#sp-add-signer').click();                // "Add signers"
      await expect(page.locator('[data-sp-name="0"]'),
        'our signer is filled in already (' + US.name + ')').toHaveValue(US.name);
      await expect(page.locator('[data-sp-email="1"]'),
        'the other side\'s email is filled in already (' + THEM.email + ')').toHaveValue(THEM.email);
    }],
    ['Name who signs for them, put them first, and press "Save route"', async () => {
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
    }],
  ]);
}

/* Sends it, proves the email went to her, and hands back HER signing link. */
async function sendForSignature(page, hati, o) {
  let link = null;
  return inParts(o, 'Send it to Grace for signature — the email reaches her, with her own signing link', [
    ['Press "Share" — the send screen already knows who it is for', async () => {
      await page.locator('#ws-share').click();
      await expect(page.locator('#sh-name'),
        'the send screen is addressed to their signer (' + THEM.signer + ')').toHaveValue(THEM.signer);
      await expect(page.locator('#sh-email'),
        'the send screen has her email address (' + THEM.email + ')').toHaveValue(THEM.email);
    }],
    ['Choose "Sign", press "Send by email" and confirm the address', async () => {
      const sign = page.locator('#share-purpose [data-share-purpose="sign"]');
      await sign.click();                                          // what this round is for: "Sign"
      await expect(sign, '"Sign" is chosen as what this round is for').toHaveAttribute('aria-pressed', 'true');
      await page.locator('#share-send').click();                   // "Send by email"
      await expect(page.locator('#cf-ok'),
        'HaTi reads the address back once before a signing link goes out').toContainText(THEM.email);
      await page.locator('#cf-ok').click();                        // "Send to grace@…"
      await expect(page.locator('#sh-result'),
        'the send screen says "Email sent to ' + THEM.email + '"').toContainText(`Email sent to ${THEM.email}`);
    }],
    ['Check the email really went out: once, to her, with her own signing link', async () => {
      const toThem = hati.mail.sent.filter(m => m.to === THEM.email);
      expect(toThem, 'exactly one email reached ' + THEM.email).toHaveLength(1);
      expect(toThem[0].subject, 'the email\'s subject asks her to sign').toContain('sign');
      expect(toThem[0].subject, 'the email\'s subject names the agreement').toContain(NDA);
      link = (toThem[0].text.match(/https?:\/\/\S+#share=\S+/) || [])[0];
      expect(link, 'the email carries her personal signing link').toBeTruthy();
      expect(new URL(link).origin, 'the link points at this HaTi server').toBe(new URL(hati.base).origin);
      return link;
    }],
  ]);
}

/* Adds a colleague on Team & settings → People → "Add member", the way an
   admin does. `access` '*' is every value stream; a list of stream names ticks
   only those. The invitation email is checked on the way. */
async function addColleague(page, hati, who, { role = 'legal', streams = '*' } = {}) {
  await page.locator('#side-nav [data-view="team"]').click();     // "Team & settings"
  await page.locator('#st-add-person').click();                     // "Add member"
  await page.locator('#tm-name').fill(who.name);
  await page.locator('#tm-email').fill(who.email);
  await page.locator('#tm-title').fill(who.title);
  await page.locator('#tm-pass').fill(who.temporary);               // the temporary password
  await page.locator(`input[name="tm-role-r"][value="${role}"]`).check();   // Editor, Viewer or Admin
  if (streams === '*') await page.locator('#tm-access').selectOption('*');  // every folder
  else {
    await page.locator('#tm-access').selectOption('pick');                 // only the folders ticked
    for (const name of streams) await page.locator('.st-drawer label', { hasText: name }).locator('input').check();
  }
  await page.locator('#st-dsave').click();                          // "Save & close"
  await expect(page.locator('#content'), who.name + ' is listed among the people').toContainText(who.name);
  await expect.poll(() => mailTo(hati, who.email).some(m => /added to/.test(m.subject)),
    { message: 'an email tells ' + who.name + ' he has been added' }).toBe(true);
}

/* A colleague's first sign-in, in his own browser: the temporary password,
   then a password of his own. Hands back his page. */
async function signInFirstTime(browser, hati, who, nothingBroke) {
  const context = await browser.newContext();
  const page = await context.newPage();
  if (nothingBroke) nothingBroke.watch(page, who.name.split(' ')[0] + '\'s page');
  await page.goto(hati.base + '/');
  await page.locator('#li-email').fill(who.email);
  await page.locator('#li-pass').fill(who.temporary);
  await page.locator('#li-go').click();                             // "Sign in"
  await expect(page.locator('#cp-go'), 'HaTi asks him to choose his own password first').toBeVisible();
  await page.locator('#cp-current').fill(who.temporary);
  await page.locator('#cp-new').fill(who.password);
  await page.locator('#cp-again').fill(who.password);
  await page.locator('#cp-go').click();                             // "Set my password"
  await expect(page.locator('.hm-greet h1'), 'Home greets him by name').toContainText(who.name.split(' ')[0]);
  return { page, close: () => context.close() };
}

/* The Negotiate page for the contract on screen. */
async function openNegotiatePage(page) {
  await page.locator('#ws-tabs [data-ws-tab="docs"]').click();   // "Document" tab
  await page.locator('#ws-to-nego').click();                       // "Start negotiating"
  await expect(page.locator('.rl-clause').first(),
    'the Negotiate page shows the agreement, clause by clause').toBeVisible();
}

/* Proposes one change the way a person does: the clause's own pencil opens
   the clause editor, a sentence is typed at the end of the clause, and the
   pencil again ("Done") files it. HaTi then offers to add a note; this skips
   it, closes the notes and leaves the editor. */
async function proposeASentence(page, clause, sentence) {
  await page.locator('.rl-clause', { hasText: clause }).locator('[data-rl-cp-editor]').click();  // the clause's pencil
  await page.locator('#ce-clausebody').click();                    // into the clause's wording
  await page.keyboard.press('Control+End');                        // to the end of it
  await page.keyboard.type(' ' + sentence);
  await page.locator('#clause-editor .rl-cp-pill-done').click();   // the pencil again: "Done"
  await expect(page.locator('#context-panel'),
    'HaTi files the change to "' + clause + '" and offers to add a note to it').toContainText(clause);
  await page.locator('[data-rl-np-unpin]').click();                // "Skip" the note
  await page.locator('#panel-close').click();                      // close the notes
  await page.locator('[data-ce-act="close"]').click();              // "Exit" the clause editor
  await expect(page.locator('#rl-side [data-nego-card]', { hasText: clause }),
    'the change to "' + clause + '" is listed beside the agreement').toBeVisible();
}

/* Opens a link the way the other side would: a separate browser, nobody
   signed in. Close it with `.close()`. */
async function openAsThem(browser, link, nothingBroke, who = 'her page') {
  const context = await browser.newContext();
  const page = await context.newPage();
  if (nothingBroke) nothingBroke.watch(page, who);
  await page.goto(link);
  return { page, close: () => context.close() };
}

/* ---- A KNOWN PROBLEM: CHECKED, SAID, AND WORKED ROUND ----
   Sometimes a journey meets a fault HaTi is already known to have (it is
   written down in BUGLOG). Stopping there would leave the rest of the journey
   unchecked until it is fixed; working round it silently would hide it. So:
     · the RIGHT behaviour is checked softly, its sentence marked KNOWN — the
       journey carries on, and the report says "known problem, still there";
     · only while it is there, the journey works round it the way a person
       would (a reload, say), so everything after it is still checked;
     · the journey names the problem in a 'known problem' annotation, so the
       day the check passes the report says it seems fixed and the mark can
       come off.
   f395 (4): a soft check is only ever a known problem's. */
const KNOWN = '[known problem] ';
/* The soft form of expect.poll, for a known problem that has to wait for
   something (an email, say). Only ever used with KNOWN. */
const softPoll = (fn, opts) => expect.configure({ soft: true }).poll(fn, opts);
async function knownProblem(check, workRound) {
  const before = test.info().errors.length;
  await check(KNOWN);
  if (test.info().errors.length > before && workRound) await workRound();
}

/* A link in an email opens in a NEW tab of that person's browser, as it does
   when they click it (HaTi reads such a link as it starts up). */
async function openEmailLink(page, link, nothingBroke, who) {
  const tab = await page.context().newPage();
  if (nothingBroke) nothingBroke.watch(tab, who || 'a tab opened from an email');
  await tab.goto(link);
  return tab;
}

/* Every email the pretend provider received for one address, newest last. */
function mailTo(hati, address) {
  return hati.mail.sent.filter(m => m.to === address);
}

module.exports = {
  test, expect, US, THEM, NDA, BRIAN, yearsFromToday, watchForCrashes, inParts, mailTo, KNOWN, knownProblem, softPoll,
  addColleague, signInFirstTime, openEmailLink, startCopilotStandIn,
  signUp, draftNda, nameSignersTheyFirst, sendForSignature, openAsThem, openNegotiatePage, proposeASentence,
};
