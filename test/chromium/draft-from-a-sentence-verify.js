/* DRAFT FROM A SENTENCE — driven where the reader stands
   ======================================================
   Owner-asked 9 Sep 2026: "start on 1. But I need this to be an option and
   not the default when you click on draft template."

   WHY THIS FILE EXISTS AND f270 IS NOT ENOUGH. f270 can ask what the reading
   returns and what the route answers; it cannot ask the four things that
   decide whether this works at all:
     · is the new row VISIBLE PIXELS in the menu, and is the first row still
       first and still the ordinary picker (the owner's own condition);
     · does a REAL press open the sentence screen;
     · does the fill screen ARRIVE PRE-FILLED — which is the whole feature,
       and is a value painted into an input rather than a fact in a variable;
     · does pressing Create through it make an ordinary contract.
   Every one of those is a journey, and jsdom lays nothing out.

   THE ANSWER IS SCRIPTED THROUGH THE REAL SERVER PATH, never staged as
   markup: the browser posts to /api/ai/draft, the route shapes the answer and
   drops what the chosen template does not ask for, and the screen reads what
   comes back. That is the path a customer takes.

   Screenshots land in test/chromium/shots/draft-from-a-sentence/.
   Run: node test/chromium/draft-from-a-sentence-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'draft-from-a-sentence');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail ? ` [${detail}]` : ''));
  if (!ok) failures++;
};

/* On screen, not merely in the markup — f180's rule. */
const visible = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  for (let n = el; n && n !== document.body; n = n.parentElement){
    const st = getComputedStyle(n);
    if (st.display === 'none' || st.visibility === 'hidden' || n.hidden) return false;
  }
  return true;
}, sel);

const tool = input => [{ type: 'tool_use', id: 'tu_draft', name: 'draft_from_sentence', input }];

/* EVERY DRIVEN HALF IS GUARDED, so a build WITHOUT this feature reports its
   failures rather than timing out on a control that is not there. A probe
   that throws proves nothing — the file's own founding rule, and this one is
   run against the parent commit before it is trusted. */
async function press(page, sel, what){
  const there = await page.$(sel);
  if (!there){ check(false, what + ' — the control is not on the page', sel); return false; }
  await page.click(sel);
  return true;
}

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  /* ============ 1. THE MENU — A FOURTH ROW, NOT A REPLACEMENT ============ */
  await page.evaluate(() => window.setView('register'));
  await page.waitForTimeout(900);
  await page.evaluate(() => window.openNewMenu(document.querySelector('[data-page-new]')));
  await page.waitForTimeout(400);

  const menu = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#new-menu .new-menu-item'));
    return { n: rows.length, ids: rows.map(b => b.id),
      titles: rows.map(b => (b.querySelector('span:last-child span') || {}).textContent || '') };
  });
  check(menu.n === 4, '1a the menu holds four ways in', `${menu.n}: ${menu.ids.join(', ')}`);
  check(menu.ids[0] === 'menu-wizard',
    '1b "Draft from a template" is still the first row', menu.ids.join(', '));
  check(menu.ids[1] === 'menu-describe',
    '1c the new row reads directly under it', menu.ids.join(', '));
  check(await visible(page, '#menu-describe'), '1d and it is visible pixels, not markup behind something');
  await page.screenshot({ path: path.join(OUT, 'menu.png') });

  /* The owner's own condition, driven rather than read: the first row still
     opens the ordinary picker and nothing else. */
  await press(page, '#menu-wizard', '1e the first row');
  await page.waitForTimeout(700);
  const picker = await page.evaluate(() => ({
    pick: !!document.getElementById('wz-pick'), say: !!document.getElementById('dr-say') }));
  check(picker.pick && !picker.say,
    '1e pressing it opens the template picker, unchanged', JSON.stringify(picker));
  await page.evaluate(() => window.closeModal && window.closeModal());
  await page.waitForTimeout(300);

  /* ============ 2. THE SENTENCE SCREEN ============ */
  await page.evaluate(() => window.openNewMenu(document.querySelector('[data-page-new]')));
  await page.waitForTimeout(300);
  const opened = await press(page, '#menu-describe', '2 the new row');
  await page.waitForTimeout(700);

  const screen = await page.evaluate(() => ({
    say: !!document.getElementById('dr-say'),
    read: !!document.getElementById('dr-read'),
    pick: !!document.getElementById('dr-pick'),
    offer: !!document.getElementById('dr-found'),
  }));
  check(screen.say, '2a a sentence box, not a menu');
  check(screen.read, '2b with a key on the server, the read button is drawn');
  check(screen.pick, '2c the ordinary picker is one press away on the same screen');
  check(!screen.offer, '2d and nothing is recommended before anything is asked');
  check(await visible(page, '#dr-say'), '2e the box is on screen');
  await page.screenshot({ path: path.join(OUT, 'sentence.png') });

  /* THE CANDIDATES ARE THIS WORKSPACE'S OWN PAPER. Read off the live page
     rather than assumed: the whole safety of the feature is that a model
     never writes a clause, it picks one of these. */
  const cands = await page.evaluate(() => (window.draftCandidates
    ? window.draftCandidates() : []).map(c => ({ kind: c.kind, id: c.id, n: c.fields.length })));
  check(cands.length >= 10 && cands.every(c => c.kind === 'builtin' || c.kind === 'mine' || c.kind === 'lib'),
    '2f every candidate is a template this workspace already has', `${cands.length} offered`);
  check(cands.some(c => c.id === 'RM' && c.n > 0),
    '2g and each carries its own questions', JSON.stringify(cands.find(c => c.id === 'RM') || null));

  /* ============ 3. READING IT ============ */
  ai.reset();
  ai.script(tool({ templateId: 'RM', why: 'You described a supply agreement, which is what this template drafts.',
    fields: [{ key: 'counterparty', value: 'Nandi Dairy' },
             { key: 'payDays', value: '45' },
             { key: 'governingLaw', value: 'Kenya' }] }));
  if (opened && screen.say) await page.fill('#dr-say', "Two-year supply agreement with Nandi Dairy, 45-day payment, 90 days' notice");
  await press(page, '#dr-read', '3 read it');
  await page.waitForTimeout(3500);

  const offer = await page.evaluate(() => {
    const f = document.getElementById('dr-found');
    return f ? { name: (document.getElementById('dr-name') || {}).textContent || '',
      filled: (document.getElementById('dr-filled') || {}).textContent || '',
      go: !!document.getElementById('dr-go'), text: f.textContent } : null;
  });
  check(!!offer, '3a Copilot comes back with a recommendation');
  check(offer && /Raw Material Supply/i.test(offer.name),
    '3b it names the template it picked', offer && offer.name);
  check(offer && /supply agreement/i.test(offer.text), '3c and says why, in the reader\'s own terms');
  check(offer && /Counterparty/i.test(offer.filled) && /Payment terms/i.test(offer.filled),
    '3d it names the questions the sentence answered', offer && offer.filled);
  /* NAMED, NEVER VALUED. The values belong in the editable boxes one press
     away; printed here as well, the uneditable copy reads as decided. */
  check(offer && !/Nandi Dairy/.test(offer.text),
    '3e and never prints their values on this screen', offer && offer.text.slice(0, 120));
  check(ai.calls.length === 1, '3f one press, one call to the model', String(ai.calls.length));
  await page.screenshot({ path: path.join(OUT, 'offer.png') });

  /* ============ 4. THE FILL SCREEN ARRIVES PRE-FILLED ============ */
  /* THE WHOLE FEATURE, and the one claim only a browser can make: a value
     PAINTED into an input a person can see and overtype. */
  await press(page, '#dr-go', '4 use this template');
  await page.waitForTimeout(900);
  const fill = await page.evaluate(() => {
    const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
    return { cp: v('wz-counterparty'), pay: v('wz-payDays'), val: v('wz-value'),
      create: !!document.getElementById('wz-create'),
      say: !!document.getElementById('dr-say'),
      /* A key the template does not declare must have reached no box at all. */
      stray: !!document.getElementById('wz-governingLaw') };
  });
  check(fill.create, '4a it lands in the template fill screen that already exists');
  check(!fill.say, '4b and the sentence screen closes behind it');
  check(fill.cp === 'Nandi Dairy', '4c the counterparty arrives filled in', String(fill.cp));
  check(fill.pay === '45', '4d and so does the payment window it read', String(fill.pay));
  check(fill.val === '', '4e what the sentence did not say arrives blank', String(fill.val));
  check(!fill.stray, '4f a key this template does not ask for reached no box');
  check(await visible(page, '#wz-counterparty'), '4g the filled box is on screen, not in a variable');
  await page.screenshot({ path: path.join(OUT, 'prefilled.png') });

  /* THE VALUES ARE EDITABLE — the reader confirms rather than accepts. */
  if (await page.$('#wz-counterparty')) await page.fill('#wz-counterparty', 'Nandi Dairy Cooperative Ltd');
  const edited = await page.evaluate(() => (document.getElementById('wz-counterparty') || {}).value || null);
  check(edited === 'Nandi Dairy Cooperative Ltd', '4h every value can be overtyped', edited);

  /* ============ 5. AND IT CREATES AN ORDINARY CONTRACT ============ */
  const before = await page.evaluate(() => (window.state.contracts || []).length);
  await press(page, '#wz-create', '5 create the draft');
  await page.waitForTimeout(2000);
  const made = await page.evaluate(() => {
    const c = (window.state.contracts || [])[0] || null;
    return c ? { n: window.state.contracts.length, id: c.id, cp: c.counterparty,
      tpl: c.template, status: c.status, audit: (c.audit || []).map(a => a.action),
      pay: (c.metadata || {}).paymentTerms || (c.fields || {}).payDays || '' } : null;
  });
  check(made && made.n === before + 1, '5a one contract, created', made && `${before} → ${made.n}`);
  check(made && made.template !== null && made.tpl === 'RM',
    '5b from the template Copilot picked', made && String(made.tpl));
  check(made && made.cp === 'Nandi Dairy Cooperative Ltd',
    '5c carrying what the reader confirmed, not what the model first said', made && made.cp);
  check(made && made.status === 'Draft', '5d as an ordinary draft', made && made.status);
  check(made && made.audit.some(a => /creat/i.test(a)),
    '5e with the ordinary creation audit line', made && made.audit.join(', '));
  await page.screenshot({ path: path.join(OUT, 'created.png') });

  /* ============ 6. NOTHING FITS ============ */
  /* An honest "nothing here matches" is a better answer than a template the
     reader then has to undo — and it must create nothing. */
  await page.evaluate(() => window.setView('register'));
  await page.waitForTimeout(700);
  const had = await page.evaluate(() => (window.state.contracts || []).length);
  ai.reset();
  ai.script(tool({ templateId: '', why: '', fields: [] }));
  await page.evaluate(() => window.openDraftFromSentence && window.openDraftFromSentence());
  await page.waitForTimeout(500);
  if (await page.$('#dr-say')) await page.fill('#dr-say', 'A shareholders agreement for a new joint venture');
  await press(page, '#dr-read', '6 read it');
  await page.waitForTimeout(3000);
  const none = await page.evaluate(() => ({
    note: (document.getElementById('dr-note') || {}).textContent || '',
    offer: !!document.getElementById('dr-found'),
    pick: !!document.getElementById('dr-pick'),
    n: (window.state.contracts || []).length }));
  check(!none.offer && /fit|match/i.test(none.note),
    '6a it says nothing fits rather than stretching to the nearest', none.note.slice(0, 90));
  check(none.pick, '6b the way forward is still on the same screen');
  check(none.n === had, '6c and nothing was created', `${had} → ${none.n}`);
  await page.screenshot({ path: path.join(OUT, 'nothing-fits.png') });

  /* ============ 7. THE WAY BACK ============ */
  await press(page, '#dr-pick', '7 pick a template myself');
  await page.waitForTimeout(700);
  const back = await page.evaluate(() => ({
    pick: !!document.getElementById('wz-pick'), say: !!document.getElementById('dr-say') }));
  check(back.pick && !back.say,
    '7a "pick a template myself" opens the ordinary picker', JSON.stringify(back));

  console.log('');
  console.log(failures ? `${failures} check(s) FAILED` : 'all checks passed');
  console.log('screenshots → test/chromium/shots/draft-from-a-sentence');
  await browser.close();
  await h.stop();
  await ai.stop();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
