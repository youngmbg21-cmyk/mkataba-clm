/* AN ANSWER IS A WORKLIST — driven where the reader stands
   ========================================================
   Owner-asked 9 Sep 2026. A Copilot answer that names several contracts now
   carries one door that narrows the Contracts page to exactly those.

   WHY THIS FILE EXISTS AND f268 IS NOT ENOUGH. f268 can ask what the builder
   returns; it cannot ask any of the four things that decide whether the
   feature works:
     · is the button VISIBLE PIXELS, or drawn behind something (f180's rule —
       a verb that is in the DOM and not on screen is not a verb);
     · does a REAL press land the reader on the register at all;
     · is the register narrowed to exactly the answer's contracts;
     · is the way back there, and does it work.
   Every one of those is a journey, and jsdom lays nothing out.

   Screenshots land in test/chromium/shots/answer-worklist/.
   Run: node test/chromium/answer-worklist-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'answer-worklist');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail ? ` [${detail}]` : ''));
  if (!ok) failures++;
};

/* IS IT ON SCREEN, not merely in the markup — f180's rule, and the reason
   this file exists at all. */
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

/* THE ANSWER IS SCRIPTED THROUGH THE REAL SERVER PATH, not staged as markup.
   A Copilot answer names its contracts as CITATIONS; the route resolves those
   into `cards`, and aiRenderServerAnswer turns them into the card list this
   door is built from. Scripting the provider is what lets this file drive the
   whole of that rather than a stand-in for it — and it is the path a customer
   actually takes, because the local intent engine only runs where there is no
   server brain at all. */
const answerNaming = ids => [{ type: 'tool_use', id: 'tu_wl', name: 'deliver_answer',
  input: { answer: 'These agreements lapse inside ninety days.',
    citations: ids.map(id => ({ id })) } }];

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

  /* ============ 1. THE RENAME ============ */
  /* The control promised a feature that has never existed — nothing in HaTi
     saves a view — so the reader went hunting for a delete button that could
     not be there. Read off the LIVE page, because a dictionary check cannot
     see whether the renderer is still asking for the retired key. */
  await page.evaluate(() => window.setView('register'));
  await page.waitForTimeout(1200);
  const bar = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.reg-f-l')).map(l => l.textContent.trim());
    const sel = document.getElementById('reg-view-sel');
    return { labels, first: sel ? (sel.options[0] || {}).text : null,
      tip: sel ? (sel.getAttribute('title') || (sel.closest('label') || {}).title || '') : '',
      rows: new Set(Array.from(document.querySelectorAll('.reg-f'))
        .map(l => Math.round(l.getBoundingClientRect().top))).size };
  });
  check(bar.labels.some(t => /quick filters/i.test(t)),
    '1a the filter is called Quick filters', bar.labels.join(' | '));
  check(!bar.labels.some(t => /saved view/i.test(t)),
    '1b nothing on the bar still promises a saved view', bar.labels.join(' | '));
  check(!/saved view/i.test(String(bar.first || '')),
    '1c and neither does the dropdown’s own resting option', String(bar.first));
  /* The bar fits one line, which is the owner's own standing ruling and the
     one thing a longer label could have cost. */
  check(bar.rows === 1, '1d the filter bar still sits on one row at 1440', `${bar.rows} rows`);
  await page.screenshot({ path: path.join(OUT, 'quick-filters.png') });

  /* ============ 2. AN ANSWER THAT NAMES CONTRACTS ============ */
  /* NAME A SUBSET OF THE BOOK, DELIBERATELY. Section 4 asks whether the way
     back really widens the list, and an answer naming every contract there is
     cannot answer that — it would come back 4 → 4 and read as a pass. */
  const shelf = await page.evaluate(() => (window.state.contracts || [])
    .filter(c => c && c.id).map(c => c.id));
  const want = shelf.slice(0, 2);
  check(shelf.length >= 3 && want.length === 2,
    '2z the answer names some of the book and not all of it',
    `${want.length} of ${shelf.length}`);
  ai.script(answerNaming(want));

  /* Driven through the panel's own composer, so the answer arrives the way a
     customer's does — question typed, route called, cards resolved. */
  await page.evaluate(() => { window.ai.history = []; window.openAI(); });
  await page.waitForTimeout(700);
  await page.fill('#ai-input', 'which agreements expire soonest');
  await page.evaluate(() => window.aiSubmit && window.aiSubmit());
  await page.waitForTimeout(4000);

  const answer = await page.evaluate(() => {
    const b = document.querySelector('#ai-feed [data-ai-worklist]');
    return {
      cards: document.querySelectorAll('#ai-feed [data-ai-open]').length,
      door: !!b,
      ids: b ? String(b.getAttribute('data-ai-worklist') || '').split(/\s+/).filter(Boolean) : [],
      label: b ? b.getAttribute('data-ai-worklist-label') : null,
      text: b ? b.textContent.trim() : '',
    };
  });
  check(answer.cards === want.length, '2a the answer names several contracts',
    `${answer.cards} cards`);
  check(answer.door, '2b it carries the worklist door');
  check(await visible(page, '#ai-feed [data-ai-worklist]'),
    '2c and the door is VISIBLE PIXELS, not markup behind something');
  /* THE COUNT RULE, measured on the real button: the register narrows further
     inside a named set, so a figure here could promise seven and land on
     three — which is the one thing a door must never do. */
  check(answer.door && !/\d/.test(answer.text), '2d the door prints no figure',
    answer.door ? answer.text : 'no door to read');
  check(answer.label === 'which agreements expire soonest',
    '2e it carries the reader’s own question as the label', String(answer.label));
  check(answer.ids.length >= 2 && answer.ids.length === answer.cards
    && want.every(id => answer.ids.includes(id)),
    '2f every contract the answer named is on the door, and only those',
    `${answer.ids.length} ids vs ${answer.cards} cards — ${answer.ids.join(' ')}`);
  await page.screenshot({ path: path.join(OUT, 'answer-with-door.png') });

  /* ============ 3. THE PRESS ============ */
  const before = { ids: answer.ids.slice() };
  await page.click('#ai-feed [data-ai-worklist]');
  await page.waitForTimeout(1800);

  const landed = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#reg-tbody [data-row]'))
      .map(r => r.getAttribute('data-row'));
    const chip = document.getElementById('reg-only-chip');
    const panel = document.getElementById('ai-panel');
    return {
      view: window.state && window.state.view,
      rows,
      chip: chip ? chip.textContent.replace(/\s+/g, ' ').trim() : null,
      back: !!document.getElementById('reg-only-clear'),
      panelOpen: !!(panel && panel.getBoundingClientRect().width
        && getComputedStyle(panel).visibility !== 'hidden'
        && !panel.hidden && getComputedStyle(panel).display !== 'none'
        && panel.getBoundingClientRect().right > 0
        && panel.getBoundingClientRect().left < window.innerWidth),
    };
  });
  check(landed.view === 'register', '3a the press lands on Contracts', String(landed.view));
  /* EXACTLY THOSE — this is the whole promise. A door that lands on a list
     that is not the answer is worse than no door. */
  const same = landed.rows.length === before.ids.length
    && landed.rows.every(id => before.ids.includes(id));
  check(same, '3b narrowed to exactly the contracts the answer named',
    `${landed.rows.length} rows of a ${before.ids.length}-contract answer`);
  /* The chip is the register's own safety property arriving with the set: it
     SAYS what the list is narrowed to, and carries the way back. */
  check(!!landed.chip && landed.chip.includes('which agreements expire soonest'),
    '3c the chip says what the list is narrowed to — in the reader’s own words',
    String(landed.chip));
  check(landed.back, '3d and the way back is on that same chip');
  /* The drawer covers the right of the window; landing the reader on a
     narrowed register with the thing that sent them still over it is half a
     journey — the card handler's own move, one line up in the source. */
  check(!landed.panelOpen, '3e the panel that sent them stood down');
  await page.screenshot({ path: path.join(OUT, 'narrowed-register.png') });

  /* ============ 4. THE WAY BACK ============ */
  const widerThanBefore = await page.evaluate(async () => {
    document.getElementById('reg-only-clear').click();
    await new Promise(r => setTimeout(r, 900));
    return { rows: document.querySelectorAll('#reg-tbody [data-row]').length,
      chip: !!document.getElementById('reg-only-chip') };
  });
  check(widerThanBefore.rows > landed.rows.length,
    '4a pressing the ✕ widens the list again',
    `${landed.rows.length} → ${widerThanBefore.rows}`);
  check(!widerThanBefore.chip, '4b and the chip goes with it');
  await page.screenshot({ path: path.join(OUT, 'cleared.png') });

  /* ============ 5. A ONE-CONTRACT ANSWER DRAWS NO DOOR ============ */
  /* A worklist of one contract IS that contract, and its card is already the
     door — so the CONTROL matters as much as the feature: this must come back
     false on a page where the machinery is plainly working. */
  const single = await page.evaluate(async () => {
    window.ai.history = [{ role: 'user', text: 'tell me about one' }];
    const c = (window.state.contracts || [])[0];
    window.aiPush('assistant', { text: '<div>One.</div>', cards: window.aiCards([c]) });
    window.renderAIFeed();
    await new Promise(r => setTimeout(r, 400));
    return { cards: document.querySelectorAll('#ai-feed [data-ai-open]').length,
      door: document.querySelectorAll('#ai-feed [data-ai-worklist]').length };
  });
  check(single.cards === 1 && single.door === 0,
    '5a one contract draws its card and no worklist door',
    `${single.cards} card(s), ${single.door} door(s)`);

  console.log(failures ? `\n${failures} FAILED` : '\nall checks passed');
  await browser.close();
  await h.stop();
  await ai.stop();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
