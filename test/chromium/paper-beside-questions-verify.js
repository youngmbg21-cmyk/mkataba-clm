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

  /* ---- THE PREVIEW IS NOT A SECOND FORM, AND IT SCROLLS ----
     REVERSED IN PLACE 18 Sep 2026, and the claim is the same claim. docBody
     draws a draft's blanks as real inputs, and a reader who typed into one
     would be typing into a contract with no id that nothing persists. That was
     first met by covering the column with `inert` and pointer-events:none, and
     this check asserted the cover. The cover also stopped the reader SCROLLING
     the column — Young, 18 Sep: "the page on the right needs to scroll" —
     because a subtree the browser will not hit-test takes no wheel either.
     MEASURED at that parent: 1,758px of agreement in a 320px box and a real
     wheel moving it 0px.
     So the check moved from the COVER to the two facts the cover was standing
     in for, and both are driven rather than read: a real click and real
     keystrokes change nothing, and a real wheel scrolls the paper. */
  const dead = await page.evaluate(() => {
    const el = document.getElementById('tf-preview');
    if (!el) return null;
    const boxes = el.querySelectorAll('input,select,textarea');
    return { inputs: boxes.length,
      live: Array.from(boxes).filter(b => !b.disabled && !b.readOnly).length,
      inTabOrder: Array.from(boxes).filter(b => b.getAttribute('tabindex') !== '-1').length,
      scrollH: el.scrollHeight, clientH: el.clientHeight };
  });
  const box = await page.evaluate(() => {
    const i = document.querySelector('#tf-preview input[type="text"]');
    if (!i) return null; const r = i.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), was: i.value };
  });
  if (box) { await page.mouse.click(box.x, box.y); await page.waitForTimeout(150);
    await page.keyboard.type('TYPED INTO THE PREVIEW'); await page.waitForTimeout(250); }
  const typed = await page.evaluate(() => {
    const i = document.querySelector('#tf-preview input[type="text"]');
    return i ? { value: i.value, tookCaret: document.activeElement === i } : null;
  });
  check('1g the preview takes no typing — its blanks are a picture, not a second form',
    dead && dead.inputs > 0 && dead.live === 0 && dead.inTabOrder === 0
      && typed && typed.value === (box ? box.was : null),
    dead ? `${dead.inputs} blanks · live=${dead.live} · in tab order=${dead.inTabOrder} · after typing="${typed && typed.value}"` : '-');

  await page.evaluate(() => { document.getElementById('tf-preview').scrollTop = 0; });
  const mid = await page.evaluate(() => { const r = document.getElementById('tf-preview').getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
  await page.mouse.move(mid.x, mid.y);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(400);
  const rolled = await page.evaluate(() => document.getElementById('tf-preview').scrollTop);
  check('1g2 and a real wheel over the paper scrolls the paper',
    dead && dead.scrollH > dead.clientH && rolled > 0,
    dead ? `${dead.scrollH}px of agreement in a ${dead.clientH}px box · wheel moved it ${rolled}px` : '-');
  await page.evaluate(() => { document.getElementById('tf-preview').scrollTop = 0; });

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

  /* ============================================================
     7  EVERY CREATION DOOR DRAWS THE PAPER
     ============================================================
     Young ruled it 18 Sep 2026 off two screenshots: the built-in wizard showed
     the agreement beside its questions and the company-standard door showed
     nothing. That door is openContractEssentials, which two paths come through
     — a PUBLISHED COMPANY STANDARD, whose wording lives on the server, and a
     saved template with NO blanks, whose wording the browser already holds.
     Both are driven here, because whether a pane really painted is a question
     only a rendered page answers, and because the company-standard half has a
     fetch in it that a source read cannot see resolve. */
  const tpl = await W.admin.json('/api/templates', { method: 'POST',
    body: { name: 'Warehousing Logistics Agreement', description: 'A 3PL logistics contract.', category: 'procurement' } });
  const tid = tpl.template.id;
  const tdet = await W.admin.json('/api/templates/' + tid);
  const tv = tdet.versions[0].id;
  await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: {
    blocks: [
      { orderIndex: 0, blockType: 'heading', content: 'Warehousing Logistics Agreement' },
      { orderIndex: 1, blockType: 'fixed_text', content: 'This agreement is made between {{org_name}} (the "Client") and {{provider}} (the "Provider") for warehousing and distribution services.' },
      { orderIndex: 2, blockType: 'heading', content: '1. Services' },
      { orderIndex: 3, blockType: 'fixed_text', content: 'The Provider shall provide inbound receipt, storage, pick and pack, and outbound dispatch.' },
    ],
    fields: [
      { fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', defaultValue: '{{org.company_name}}' },
      { fieldKey: 'provider', label: 'Provider name', fieldType: 'short_text' },
    ] } });
  await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);
  await page.evaluate(async () => { if (typeof tplLibRefresh === 'function') { try { await tplLibRefresh(); } catch (_) {} } });
  const found = await page.evaluate(id => {
    if (typeof tplLibNewContract !== 'function') return false;
    const list = (typeof tplLibPublished === 'function') ? tplLibPublished() : [];
    if (!list.some(x => x.id === id)) return false;
    tplLibNewContract(id); return true;
  }, tid);
  await page.waitForTimeout(1600);
  const std = await page.evaluate(() => {
    const p = document.getElementById('tf-preview');
    const cols = document.getElementById('ce-cols');
    /* READ OFF THE DIALOG, NOT OFF THE NEW WRAPPER — 7c's claim is that the
       questions did not change, so it has to be answerable on a build that has
       no #ce-cols at all. A control that can only pass after the change proves
       nothing about what the change left alone. */
    const boxes = [...document.querySelectorAll('#modal-root input, #modal-root select')].map(e => e.id).filter(Boolean);
    return { pane: !!p, two: cols ? getComputedStyle(cols).gridTemplateColumns.split(' ').length === 2 : false,
      words: p ? p.textContent.replace(/\s+/g, ' ').trim() : '', boxes,
      caption: (document.getElementById('tf-preview-left') || {}).textContent || '' };
  });
  check('7a the company-standard door opens with the paper beside its questions',
    found && std.pane && std.two, found ? `pane=${std.pane} · two columns=${std.two}` : 'the template was not on the list');
  check('7b and the paper is this template\'s own wording, read off the server',
    std.words.includes('Warehousing Logistics Agreement') && std.words.includes('inbound receipt'),
    std.words.slice(0, 80));
  /* THE QUESTIONS DID NOT CHANGE — the owner asked for the paper, not for more
     to answer. The seven are CONTRACT_ESSENTIALS, exactly as before. */
  check('7c the questions are the same seven basic entries',
    ['ce-party','ce-counterparty','ce-cpemail','ce-value','ce-effDate','ce-expiry','ce-folder']
      .every(id => std.boxes.includes(id)) && std.boxes.length === 7, std.boxes.join(','));
  /* "N blanks left" counts empty ANSWERS; here the answers are record facts and
     the wording is already complete, so a count would be a number about the
     form printed on the paper. */
  check('7d and no blanks-left count is printed, because it would not be true here',
    !/\d/.test(std.caption), JSON.stringify(std.caption));

  /* THE PAPER FOLLOWS THE ANSWERS, through the same mapping the press uses. */
  const before7 = std.words.slice(0, 60);
  await page.fill('#ce-counterparty', 'Nordic 3PL AB');
  await page.waitForTimeout(500);
  const after7 = await page.evaluate(() => {
    const p = document.getElementById('tf-preview');
    return { still: p ? p.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '', pane: !!p };
  });
  check('7e typing an answer leaves the paper standing (it is not rebuilt away)',
    after7.pane && after7.still === before7, after7.still.slice(0, 40));
  await page.screenshot({ path: `${SHOTS}/paper-7-company-standard.png` });
  await page.evaluate(() => { if (window.closeModal) closeModal(); });
  await page.waitForTimeout(400);

  /* THE OTHER PATH THROUGH THE SAME DOOR: a saved template with no blanks. */
  await page.evaluate(() => {
    state.settings = state.settings || {};
    state.settings.customTemplates = [{ id: 'ct_noblank', name: 'Mutual NDA (no blanks)', folder: 'corp',
      body: 'MUTUAL NON-DISCLOSURE AGREEMENT\n\nEach party shall keep the other\u2019s information confidential for three (3) years.', fields: [] }];
  });
  await page.evaluate(() => window.createFromCustomTemplate('ct_noblank'));
  await page.waitForTimeout(1200);
  const nb = await page.evaluate(() => {
    const p = document.getElementById('tf-preview');
    return { pane: !!p, words: p ? p.textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  check('7f a saved template with no blanks draws its wording too',
    nb.pane && nb.words.includes('MUTUAL NON-DISCLOSURE'), nb.words.slice(0, 60));
  await page.evaluate(() => { if (window.closeModal) closeModal(); });
  await page.waitForTimeout(300);

  /* AND UNDER THE WIDTH IT IS WHAT IT WAS. */
  await page.setViewportSize({ width: 900, height: 800 });
  await page.waitForTimeout(400);
  await page.evaluate(id => window.tplLibNewContract(id), tid);
  await page.waitForTimeout(1200);
  const narrow7 = await page.evaluate(() => {
    const cols = document.getElementById('ce-cols');
    return { pane: !!document.getElementById('tf-preview'),
      one: cols ? getComputedStyle(cols).gridTemplateColumns.split(' ').length === 1 : 'no wrapper',
      boxes: [...document.querySelectorAll('#modal-root input, #modal-root select')].map(e => e.id).filter(Boolean).length };
  });
  check('7g under 1000px the door is one column again, with the same questions',
    narrow7.pane === false && narrow7.boxes === 7, JSON.stringify(narrow7));
  await page.evaluate(() => { if (window.closeModal) closeModal(); });

  check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED: ' + bad.map(r => r.name).join(', ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
