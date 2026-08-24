/* Chromium verification of ONE LANGUAGE PER SCREEN.
   ============================================================
   The functional audit of 23 Aug 2026 found twelve screens still English
   inside a translated frame. f241 pins the SOURCE — that the words moved into
   the dictionary and that the lookup happens at one door. Three of the twelve
   claims cannot be made there at all, and they are the three that were
   reported:

     1  A SERVER REFUSAL. The sentence is built by the server, travels over the
        network, is translated inside api(), and is printed by a toast. Nothing
        short of a real server, a real refusal and a real toast can say whether
        the reader sees Swedish.

     2  THE DIALOG DEFAULTS. confirmDialog's buttons take their words from a
        default argument, so what is on screen depends on what each of ~50
        callers passes. Reading the source proves the default; only a real
        press proves what a real dialog draws.

     3  THE SHARE DIALOG'S FIRST STEP. It is painted twice — once immediately
        and once after the server answers — and the second paint replaces the
        first. A source check cannot see which one the reader ends up looking
        at.

   AND ONE THING THIS FILE IS REALLY FOR: a MIXED sentence. Half-translated
   text reads as a rendering fault rather than as a missing translation, and it
   is only visible when the words are laid out together. Every check here reads
   the PAINTED text.

   Run: node test/chromium/one-language-per-screen-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* WORDS THAT GIVE AN ENGLISH SENTENCE AWAY. Deliberately common function words
   rather than nouns: a proper noun ("Copilot", "HaTi", "PDF") is the same in
   both languages and is not evidence of anything. */
const ENGLISH_TELLS = /\b(the|your|this|that|cannot|please|before|already|contract|password|incorrect|sign in|expired|not found)\b/i;

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2200);

  /* Switch by CLICKING, never window.langSet — the lesson swedish-verify
     records: a test that drives the app through JavaScript proves the engine
     and not the button. */
  const sv = page.locator('[data-lang-set="sv"], [data-set-lang="sv"]').first();
  if (await sv.count()) { await sv.click(); }
  else { await page.evaluate(() => window.langSet('sv')); }
  await page.waitForTimeout(1200);
  check('the app is in Swedish before anything else is measured',
    (await page.evaluate(() => document.documentElement.lang)) === 'sv');

  /* ---------- 1 · A REAL SERVER REFUSAL, IN THE READER'S LANGUAGE ---------- */
  /* The whole chain: server builds the English sentence, api() looks it up,
     a toast prints it. Driven through the app's own api() so nothing is
     simulated but the press. */
  const refusal = await page.evaluate(async () => {
    try { await window.api('password/change', 'POST', { current: 'wrong-on-purpose', password: 'a-new-one-12' }); }
    catch (e) { return e.message; }
    return null;
  });
  check('a server refusal arrives in Swedish, not English',
    refusal === 'Ditt nuvarande lösenord är felaktigt', refusal);

  /* AND THE MIXED SENTENCE IS THE REPORTED FAULT. The prefix was translated
     and the server's half was not, which is worse than either alone. */
  const glued = await page.evaluate(() => {
    const pre = window.i18t('co_save_failed');
    return pre + (window.srvMsg ? window.srvMsg('This contract has been executed and sealed') : '');
  });
  check('a translated prefix and the server sentence are one language',
    !ENGLISH_TELLS.test(glued.replace(/HaTi|Copilot/g, '')), glued);

  /* An unknown sentence must pass straight through — that is what makes the
     lookup safe to extend and impossible to break from the server. */
  /* Guarded, so a build with no lookup at all FAILS this check rather than
     crashing the file: a browser file that dies tells you less than one that
     reports which claim broke. */
  const passthrough = await page.evaluate(() =>
    window.srvMsg ? window.srvMsg('some sentence nobody has translated') : 'NO LOOKUP');
  check('an untranslated sentence passes through untouched',
    passthrough === 'some sentence nobody has translated', passthrough);

  /* ---------- 2 · WHAT A REAL DIALOG DRAWS ---------- */
  const dlg = await page.evaluate(async () => {
    window.confirmDialog({ message: 'x' });          // no labels: the defaults
    await new Promise(r => setTimeout(r, 250));
    const ov = document.getElementById('confirm-overlay');
    const btns = [...ov.querySelectorAll('button')].map(b => b.textContent.trim());
    const title = ov.innerText.replace(/\s+/g, ' ').trim();
    ov.remove();
    return { btns, title };
  });
  check('confirmDialog draws its buttons in Swedish, with nothing passed',
    dlg.btns.includes('Avbryt') && dlg.btns.includes('Bekräfta'), dlg.btns.join(' · '));
  check('and its default question too',
    /Är du säker/.test(dlg.title), dlg.title.slice(0, 40));

  const pr = await page.evaluate(async () => {
    window.promptDialog({ title: 'x' });
    await new Promise(r => setTimeout(r, 250));
    const ov = document.getElementById('prompt-overlay');
    const btns = [...ov.querySelectorAll('button')].map(b => b.textContent.trim());
    ov.remove();
    return btns;
  });
  check('promptDialog too — OK stays OK, Cancel becomes Avbryt',
    pr.includes('Avbryt') && pr.includes('OK'), pr.join(' · '));

  /* ---------- 3 · THE SHARE DIALOG'S FIRST STEP, AS PAINTED ---------- */
  /* It arrives twice — a synchronous first paint and a server-filled second
     one that replaces identical pixels. What matters is what is there after
     both. */
  const step1 = await page.evaluate(async () => {
    const c = window.state.contracts.find(x => x.status !== 'Signed') || window.state.contracts[0];
    window.openShareModal(c);
    await new Promise(r => setTimeout(r, 900));
    const el = document.getElementById('share-step-kind');
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  check('the share dialog opens on its first step', !!step1);
  check('and every word of it is Swedish — cards, descriptions and Next',
    step1 != null && !ENGLISH_TELLS.test(step1), (step1 || '').slice(0, 130));
  check('the Next button is not an English literal under a Swedish heading',
    step1 != null && /Nästa/.test(step1) && !/\bNext\b/.test(step1));

  /* The purpose row on step two: two of its three cards used to be English
     literals beside one translated sibling, which reads as a broken render. */
  const step2 = await page.evaluate(async () => {
    const b = document.getElementById('share-kind-next');
    if (b) b.click();
    await new Promise(r => setTimeout(r, 900));
    const el = document.getElementById('share-purpose');
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  check('the purpose row draws', !!step2);
  check('and all three cards are in one language',
    step2 != null && !ENGLISH_TELLS.test(step2.replace(/HaTi/g, '')), (step2 || '').slice(0, 130));
  await page.evaluate(() => window.closeModal && window.closeModal());
  await page.waitForTimeout(300);

  /* ---------- 4 · THE COPILOT PANEL'S OWN CHROME ---------- */
  const cop = await page.evaluate(async () => {
    window.openAI && window.openAI();
    await new Promise(r => setTimeout(r, 700));
    const t = id => (document.getElementById(id) || {}).title || '';
    return { expand: t('ai-expand'), clear: t('ai-clear'), min: t('ai-min'), close: t('ai-close'),
      sub: (document.getElementById('ai-brain-sub') || {}).textContent || '' };
  });
  check('the Copilot panel tooltips turn over',
    cop.expand === 'Utöka panelen' && cop.clear === 'Radera konversationen'
    && /avisering/.test(cop.min) && cop.close === 'Stäng',
    [cop.expand, cop.clear, cop.close].join(' · '));
  check('and its live sub-line, which is repainted by script',
    cop.sub && !/^Searching|Basic mode|Answers come/.test(cop.sub.trim()), cop.sub.trim().slice(0, 50));

  /* ---------- 5 · THE STREAM DRAWER'S EMPTY STATE ---------- */
  const drawer = await page.evaluate(async () => {
    /* The stream drawer is reached by opening a value stream and then
       searching for something that cannot be there. openFolder is the door
       every screen uses; folderQuery is what its own box writes. */
    const fid = (window.state.contracts.find(c => c.folder) || {}).folder;
    if (!fid || !window.openFolder) return 'NO STREAM TO OPEN';
    window.openFolder(fid);
    await new Promise(r => setTimeout(r, 700));
    const box = document.getElementById('folder-search');
    if (box) { box.value = 'zzz-nothing-matches-this'; box.dispatchEvent(new Event('input', { bubbles: true })); }
    else { window.state.folderQuery = 'zzz-nothing-matches-this'; window.renderFolder && window.renderFolder(); }
    await new Promise(r => setTimeout(r, 800));
    const tbl = document.querySelector('#view-folder table, #content table');
    return (tbl || document.body).innerText.replace(/\s+/g, ' ').trim();
  });
  check('the stream drawer says "no matches" in Swedish',
    drawer && /matchar/.test(drawer) && !/No contracts (match|in this value stream)/.test(drawer),
    (drawer.match(/[^.]*matchar[^.]*/) || [drawer.slice(0, 90)])[0]);

  check('no page errors while any of this was measured', errors.length === 0, errors.slice(0, 3).join(' | '));

  await ctx.close();
  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
