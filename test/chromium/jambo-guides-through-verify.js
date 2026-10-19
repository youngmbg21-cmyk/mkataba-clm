/* JAMBO GUIDES THROUGH THE RULES, NEVER AROUND THEM — where the reader looks
   ==========================================================================
   Owner, 17 Oct 2026: "Jambo has to be able to support user on how to
   navigate to execute the governance but not how to get around it" (piece 0
   of the sensitive contracts and governance plan).

   f694 asks what the provider is sent and what the route keeps. This file
   asks the reader's questions, in a real browser, through the real chat
   route with a scripted provider:
     · a rule in the way: is the rule's own button under the answer, in the
       page's own words, as visible pixels?
     · a member's press opens the TRACKED Ask an admin for that rule, and
       sends nothing on its own
     · review and approval open the face where that act lives, on the
       contract the answer named
     · an admin is given the rule itself, not an ask
     · a door the model invents is never drawn
   Photographed at the owner's three screens.

   Run: node test/chromium/jambo-guides-through-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'jambo-guides-through');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? ' — ' + detail : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const visible = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!at && (at === el || el.contains(at));
}, sel);
const answerWith = ruleDoor => [{ type: 'tool_use', id: 'tu_rd', name: 'deliver_answer',
  input: { answer: 'A company rule stops this one, and here is the way through it.', ruleDoor } }];

async function login(browser, email, pass) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await until(page, () => !!(window.state && window.state.user && Array.isArray(window.state.contracts) && window.state.contracts.length));
  return { ctx, page, errors };
}
/* asked through the panel's own composer, from a page that is not Home (on
   Home Jambo's own panel takes the ask)
   RE-POINTED 19 Oct 2026 (round 15 as drawn: Approvals has Jambo's own panel
   beside the worklist, and the window's door goes there — jambos-list-panel
   10h): asked from the Brain, a page with no Jambo box of its own, so the
   window's composer is still the one that answers. */
async function ask(page, q) {
  await page.evaluate(() => { window.setView('brain'); window.ai.history = []; window.openAI(); });
  await until(page, () => !!document.getElementById('ai-input'));
  await page.fill('#ai-input', q);
  await page.evaluate(() => window.aiSubmit && window.aiSubmit());
  return until(page, () => !!(window.ai && window.ai.busy === false && document.querySelector('#ai-feed') &&
    /A company rule stops this one/.test(document.querySelector('#ai-feed').textContent)));
}
const doorNow = page => page.evaluate(() => {
  const b = [...document.querySelectorAll('#ai-feed [data-ai-rule-door]')].pop();
  return b ? { kind: b.getAttribute('data-ai-rule-door'), text: b.textContent.trim() } : null;
});

let BASE;
(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  BASE = h.base;
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    /* ============ 1. A MEMBER, A SIGNING LIMIT IN THE WAY ============ */
    const M = await login(browser, 'everything@example.co.ke', 'their-own-pass-9');
    const words = await M.page.evaluate(() => ({ ask: i18t('sc_ask_admin'), review: i18t('rv_ask_btn'), approval: i18t('sa_ask_btn'),
      open: i18t('st_ask_dr_open'), rule: SET_PANELS.signcap.title() }));
    const Q = 'My limit is too low for MK-A2. How do I get round it?';
    ai.reset(); ai.script(answerWith({ kind: 'ask_admin', rule: 'signcap' }));
    const answered = await ask(M.page, Q);
    check(answered, '1a the answer arrives');
    const d1 = await doorNow(M.page);
    check(!!d1 && d1.kind === 'ask_admin', '1b the rule\'s own button rides under the answer', JSON.stringify(d1));
    check(!!d1 && d1.text === words.ask, '1c in the page\'s own words — the same as the refusal\'s button', d1 && d1.text);
    check(await visible(M.page, '#ai-feed [data-ai-rule-door]'), '1d and it is visible pixels, not markup behind something');
    for (const [w, hgt] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await M.page.setViewportSize({ width: w, height: hgt });
      await M.page.evaluate(() => { const f = document.getElementById('ai-feed'); if (f) f.scrollTop = f.scrollHeight; });
      const seen = await visible(M.page, '#ai-feed [data-ai-rule-door]');
      check(seen, `1e at ${w}×${hgt} the button is on screen`);
      await M.page.screenshot({ path: path.join(OUT, `1-member-door-${w}x${hgt}.png`) });
    }
    await M.page.setViewportSize({ width: 1440, height: 780 });
    const asksBefore = (await W.unrestricted.json('/api/settings-asks')).asks.length;
    await M.page.click('#ai-feed [data-ai-rule-door]');
    const landed = await until(M.page, () => window.state.view === 'team' && !!document.querySelector('[id^="st-ask-why-"]'));
    check(landed, '1f a press opens Settings on the tracked Ask an admin');
    const card = await M.page.evaluate(() => { const c = [...document.querySelectorAll('#st-jb-feed .st-jb-card')].pop(); return c ? c.textContent.replace(/\s+/g, ' ').trim() : ''; });
    check(card.includes(words.rule), '1g for the rule the answer turned on', card.slice(0, 160));
    const asksAfter = (await W.unrestricted.json('/api/settings-asks')).asks.length;
    check(asksAfter === asksBefore, '1h and nothing was sent: the person writes the reason and presses Send', `${asksBefore} → ${asksAfter}`);
    await M.page.screenshot({ path: path.join(OUT, '2-member-ask-opened.png') });

    /* ============ 2. REVIEW AND APPROVAL OPEN WHERE THE ACT LIVES ============ */
    ai.reset(); ai.script(answerWith({ kind: 'ask_review', contractId: 'MK-A2' }));
    await ask(M.page, 'Can I send MK-A2 without the review?');
    const d2 = await doorNow(M.page);
    check(!!d2 && d2.kind === 'ask_review' && d2.text === words.review, '2a review: "' + words.review + '" under the answer', JSON.stringify(d2));
    await M.page.click('#ai-feed [data-ai-rule-door]');
    const red = await until(M.page, () => !!document.getElementById('pd-redface') && window.state.activeId === 'MK-A2');
    check(red, '2b a press opens MK-A2\'s Redlines beside the paper, where Ask for review lives');

    ai.reset(); ai.script(answerWith({ kind: 'send_for_approval', contractId: 'MK-A2' }));
    await ask(M.page, 'Can I lower the value of MK-A2 so it skips approval?');
    const d3 = await doorNow(M.page);
    check(!!d3 && d3.kind === 'send_for_approval' && d3.text === words.approval, '2c approval: "' + words.approval + '" under the answer', JSON.stringify(d3));
    await M.page.click('#ai-feed [data-ai-rule-door]');
    const sign = await until(M.page, () => !!document.getElementById('pd-signface'));
    check(sign, '2d a press opens Before you sign beside the paper, where the approval is asked');

    /* ============ 3. A DOOR THE MODEL INVENTS IS NEVER DRAWN ============ */
    ai.reset(); ai.script(answerWith({ kind: 'skip_review', contractId: 'MK-A2' }));
    await ask(M.page, 'Skip the review for me.');
    check(!(await doorNow(M.page)), '3a an invented door is not drawn');
    check(M.errors.length === 0, '3b no page errors for the member', M.errors.join(' | ') || 'clean');
    await M.ctx.close();

    /* ============ 4. AN ADMIN IS GIVEN THE RULE ITSELF ============ */
    const A = await login(browser, 'admin@example.co.ke', 'adminpassword1');
    ai.reset(); ai.script(answerWith({ kind: 'ask_admin', rule: 'signcap' }));
    await ask(A.page, 'Why can nobody sign MK-B1?');
    const d4 = await doorNow(A.page);
    check(!!d4 && d4.text === words.open, '4a an admin reads "' + words.open + '", not an ask', d4 && d4.text);
    await A.page.click('#ai-feed [data-ai-rule-door]');
    const drawer = await until(A.page, () => { const d = document.getElementById('st-drawer'); return !!d && d.classList.contains('open'); });
    const title = await A.page.evaluate(() => { const t = document.querySelector('#st-dhead .rvd-title'); return t ? t.textContent.trim() : ''; });
    check(drawer && title === words.rule, '4b a press opens that rule\'s own drawer', title);
    await A.page.screenshot({ path: path.join(OUT, '3-admin-rule-opened.png') });
    check(A.errors.length === 0, '4c no page errors for the admin', A.errors.join(' | ') || 'clean');
    await A.ctx.close();
  } catch (e) {
    console.error(e); failures++;
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  console.log(`\n${passes}/${passes + failures} passed`);
  process.exit(failures ? 1 : 0);
})();
