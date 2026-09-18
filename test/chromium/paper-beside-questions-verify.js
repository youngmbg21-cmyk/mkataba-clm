/* Chromium verification: THE PAPER BESIDE THE QUESTIONS, WHO MAY MAKE NEW
   PAPER, AND A CONTRACT THAT IS NOT AN OUTLINE
   ============================================================
   Three of the four things built on 18 September 2026 have a half that only a
   painted page can answer, and this file is that half. f331 proves the
   contracts — that the preview is built from the create path's own functions,
   that a clause's address is not its number, that the grant narrows the right
   routes. None of that can tell whether two columns really sit side by side,
   whether a button a reader sees is actually greyed, or whether the contract
   moved on the page.

   WHAT IS MEASURED HERE, and nothing else:
     1  the wizard's answer step draws the boxes and the agreement SIDE BY SIDE,
        the paper redraws as you type, and a cursor in a box lights its word
     2  the questions themselves did not move — every box, every act
     3  the paper a template draws is a contract, not four clauses
     4  "+ New template" is greyed, not hidden, for somebody without the grant,
        and the reason is on it
     5  under 1000px the dialog is one column again
     6  the SERVER refuses the request, driven as a real Editor — a rule
        enforced only in pixels holds until somebody sends the request

   Run: node test/chromium/paper-beside-questions-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = process.env.HATI_SHOT_DIR || '/tmp';

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  /* ============================================================
     1  THE WIZARD'S ANSWER STEP
     ============================================================ */
  await page.evaluate(() => window.openWizard('RM'));
  await page.waitForTimeout(900);

  const cols = await page.evaluate(() => {
    const g = document.getElementById('wz-cols');
    if (!g) return null;
    const kids = [...g.children].map(el => el.getBoundingClientRect());
    const pv = document.getElementById('tf-preview');
    return { n: kids.length, tops: kids.map(r => Math.round(r.top)),
      lefts: kids.map(r => Math.round(r.left)), preview: !!pv,
      pvRect: pv ? { l: Math.round(pv.getBoundingClientRect().left), w: Math.round(pv.getBoundingClientRect().width) } : null };
  });
  check('1a the answer step has two columns', cols && cols.n === 2, cols ? cols.n + ' children' : 'no grid');
  check('1b and they are SIDE BY SIDE, not stacked',
    cols && cols.n === 2 && cols.lefts[1] > cols.lefts[0] + 200 && Math.abs(cols.tops[0] - cols.tops[1]) < 40,
    cols ? `left ${cols.lefts[0]} · right ${cols.lefts[1]} · tops ${cols.tops.join('/')}` : '-');
  check('1c the right column is the paper, and it is worth reading',
    cols && cols.preview && cols.pvRect && cols.pvRect.w >= 300, cols && cols.pvRect ? cols.pvRect.w + 'px wide' : '-');

  const before = await page.evaluate(() => (document.getElementById('tf-preview') || {}).textContent || '');
  await page.fill('#wz-counterparty', 'Nandi Dairy Ltd');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => (document.getElementById('tf-preview') || {}).textContent || '');
  check('1d the paper redraws as you type', after !== before && after.includes('Nandi Dairy Ltd'),
    after.includes('Nandi Dairy Ltd') ? 'names them' : 'unchanged');

  /* THE FIELD LINK. A cursor in a box lights its word on the paper — the same
     class the Document tab uses, and the caret must stay where it is. */
  const lit = await page.evaluate(() => {
    const box = document.getElementById('wz-payDays') || document.getElementById('wz-volume')
      || document.querySelector('#wz-cols input[id^="wz-"]:not([type=date])');
    if (!box) return { err: 'no box' };
    box.focus();
    const n = document.querySelectorAll('#tf-preview .is-fieldlit').length;
    return { key: box.id, n, caret: document.activeElement === box };
  });
  check('1e a cursor in a box lights its word on the paper', lit && lit.n === 1,
    lit ? `${lit.key} → ${lit.n} lit` : '-');
  check('1f and the paper never takes the caret', lit && lit.caret === true, lit && String(lit.caret));

  /* THE PREVIEW IS A PICTURE, NOT A SECOND FORM. docBody draws a draft's
     blanks as real inputs, and a reader who typed into one would be typing
     into a contract with no id that nothing persists. Found on a screenshot,
     not in an assertion, which is why this claim exists. */
  const dead = await page.evaluate(() => {
    const el = document.getElementById('tf-preview');
    if (!el) return null;
    const box = el.querySelector('input,select,textarea');
    if (!box) return { inputs: 0 };
    const was = box.value;
    try { box.focus(); box.value = 'TYPED INTO THE PREVIEW'; } catch (_) {}
    return { inputs: el.querySelectorAll('input,select,textarea').length,
      inert: el.hasAttribute('inert'),
      pe: getComputedStyle(el).pointerEvents,
      tookCaret: document.activeElement === box,
      reverted: (box.value = was, true) };
  });
  check('1g the preview is inert — its blanks are a picture, not a second form',
    dead && dead.inert === true && dead.pe === 'none' && dead.tookCaret === false,
    dead ? `${dead.inputs} blanks · inert=${dead.inert} · pointer-events=${dead.pe} · took caret=${dead.tookCaret}` : '-');

  /* THE COUNT IS LIVE OR IT IS NOT DRAWN. */
  const cnt1 = await page.evaluate(() => (document.getElementById('tf-preview-left') || {}).textContent || '');
  await page.fill('#wz-material', 'raw milk, grade A');
  await page.waitForTimeout(300);
  const cnt2 = await page.evaluate(() => (document.getElementById('tf-preview-left') || {}).textContent || '');
  check('1h and the "blanks left" count follows the answers',
    cnt1 !== cnt2 && /\d/.test(cnt1), `"${cnt1.trim()}" → "${cnt2.trim()}"`);

  await page.screenshot({ path: SHOTS + '/paper-beside-questions.png' });

  /* ============================================================
     2  THE QUESTIONS DID NOT MOVE
     ============================================================ */
  const kept = await page.evaluate(() => {
    const has = id => !!document.getElementById(id);
    return { acts: ['wz-cancel', 'wz-skip', 'wz-create', 'wz-back'].filter(has),
      email: has('wz-cpemail'),
      boxes: document.querySelectorAll('#wz-cols input[id^="wz-"],#wz-cols select[id^="wz-"]').length };
  });
  check('2a all four acts are still on the screen', kept.acts.length === 4, kept.acts.join(', '));
  check('2b the counterparty address is still asked here', kept.email);
  check('2c and every box is still in the left column', kept.boxes >= 5, kept.boxes + ' boxes');

  /* ============================================================
     3  THE PAPER IS A CONTRACT
     ============================================================ */
  const paper = await page.evaluate(() => {
    const el = document.getElementById('tf-preview');
    if (!el) return null;
    const heads = [...el.querySelectorAll('h4')].map(h => h.textContent.trim());
    return { n: heads.length, first: heads[0] || '', last: heads[heads.length - 1] || '',
      names: heads.map(x => x.replace(/^\d+\.\s*/, '')) };
  });
  check('3a it draws a whole agreement, not four clauses', paper && paper.n >= 11,
    paper ? paper.n + ' clauses' : '-');
  check('3b governing law is at the END, not at 4',
    paper && /Governing Law/i.test(paper.last), paper && paper.last);
  check('3c the clauses a counterparty looks for are on it',
    paper && ['Termination', 'Limitation of Liability', 'Confidentiality', 'Data Protection',
      'Force Majeure', 'Notices', 'Assignment', 'Entire Agreement']
      .every(w => paper.names.some(n => n.includes(w))),
    paper ? paper.names.slice(3, 12).join(' · ') : '-');

  await page.evaluate(() => window.closeModal && window.closeModal());
  await page.waitForTimeout(400);

  /* ============================================================
     4  WHO MAY MAKE NEW PAPER — GREYED, NOT HIDDEN
     ============================================================ */
  await page.evaluate(() => window.setView('templates'));
  await page.waitForTimeout(900);
  const asAdmin = await page.evaluate(() => {
    const b = document.getElementById('tpllib-new') || document.getElementById('tpl-new');
    return b ? { id: b.id, off: b.disabled } : null;
  });
  check('4a an admin still has the door', asAdmin && asAdmin.off === false,
    asAdmin ? `${asAdmin.id} disabled=${asAdmin.off}` : 'no button');

  /* An Editor WITHOUT the grant. The reading is the product's own, so this
     flips the answer the same way the product does rather than faking a
     button state. */
  const asEditor = await page.evaluate(() => {
    const me = window.REMOTE && window.REMOTE.me;
    if (!me) return { err: 'no session' };
    const wasRole = me.role, wasPaper = me.newPaper;
    me.role = 'legal'; me.newPaper = false;
    window.setView('templates');
    const out = (() => {
      const b = document.getElementById('tpllib-new') || document.getElementById('tpl-new');
      return b ? { off: !!b.disabled, title: b.getAttribute('title') || '' } : null;
    })();
    me.role = wasRole; me.newPaper = wasPaper;
    window.setView('templates');
    return out;
  });
  check('4b without the grant it is GREYED, not hidden',
    asEditor && asEditor.off === true, asEditor ? 'disabled=' + asEditor.off : 'button gone');
  check('4c and the reason is on it',
    asEditor && /not write new paper/i.test(asEditor.title), asEditor && asEditor.title.slice(0, 70));

  /* ============================================================
     5  UNDER 1000px IT IS ONE COLUMN AGAIN
     ============================================================ */
  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.openWizard('RM'));
  await page.waitForTimeout(800);
  const narrow = await page.evaluate(() => ({
    grid: !!document.getElementById('wz-cols'),
    preview: !!document.getElementById('tf-preview'),
    boxes: document.querySelectorAll('input[id^="wz-"],select[id^="wz-"]').length,
  }));
  check('5a no preview under the width', narrow.preview === false, 'preview=' + narrow.preview);
  check('5b and the questions are all still there', narrow.boxes >= 5, narrow.boxes + ' boxes');

  /* ============================================================
     6  THE SERVER IS THE WALL — driven with real requests
     ============================================================
     The browser stands the doors down; a rule enforced only in pixels holds
     until somebody sends the request. So this sends them, as a real Editor,
     rather than reading the middleware. */
  const ed = W.unrestricted, edId = W.users.unrestricted.id;
  const st = r => r.status;
  let r = await ed.raw('/api/templates', { method: 'POST', body: { name: 'Sneaky', category: 'sales' } });
  check('6a without the grant the server refuses a new template', st(r) === 403,
    st(r) + ' ' + String((r.json || {}).error || '').slice(0, 60));
  check('6b and the refusal names the door that exists',
    /contracts team/i.test(String((r.json || {}).error || '')), 'Requests');

  r = await ed.raw('/api/users/' + edId, { method: 'PATCH', body: { newPaper: true } });
  check('6c an Editor cannot grant it to themselves', st(r) === 403, st(r));

  r = await W.admin.raw('/api/users/' + edId, { method: 'PATCH', body: { newPaper: true } });
  check('6d an admin can grant it', st(r) === 200, st(r));

  r = await ed.raw('/api/templates', { method: 'POST', body: { name: 'Allowed now', category: 'sales' } });
  check('6e and then the same request goes through', st(r) === 200, st(r));
  const made = (r.json || {}).template || {};

  r = await W.admin.raw('/api/users/' + edId, { method: 'PATCH', body: { newPaper: false } });
  check('6f the admin can take it back', st(r) === 200, st(r));

  /* THE TWO WALLS THE OWNER'S OWN NOTE PROMISES. Housekeeping is not writing,
     and drafting from an approved template is the everyday act. */
  r = await ed.raw('/api/templates/' + made.id, { method: 'PATCH', body: { name: 'Renamed' } });
  check('6g renaming a template is still open — housekeeping is not writing', st(r) === 200, st(r));
  r = await ed.raw('/api/templates/' + made.id + '/versions', { method: 'POST', body: {} });
  check('6h but writing a new version is refused', st(r) === 403, st(r));

  check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED: ' + bad.map(r => r.name).join(', ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
