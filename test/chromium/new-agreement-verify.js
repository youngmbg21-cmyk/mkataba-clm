/* new-agreement-verify — THE NEW AGREEMENT POP-UP, DRIVEN (21 Sep 2026)
   =====================================================================
   Young: "you have not implemented pop ups like this", over the artifact's
   own New agreement dialog. f345 pins the source; this presses the real app:
   the + button opens ONE screen, the paper you have is on it, the chosen
   template's questions are in the card, Create really creates, the sentence
   box filters, and past the wide line the paper draws beside the answers.
   At the parent the + button opens a menu and 1a is red.

   Run: node test/chromium/new-agreement-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'new-agreement');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

const READ = () => {
  const r = document.getElementById('na-root'); if (!r) return { err: 'no pop-up' };
  const q = s => document.querySelector(s);
  const seen = el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const panel = q('.modal-in').getBoundingClientRect();
  return { panelW: Math.round(panel.width), cols: getComputedStyle(q('#na-body')).gridTemplateColumns.split(' ').length,
    menuOpen: !(document.getElementById('new-menu') || { classList: { contains: () => true } }).classList.contains('hidden'),
    doors: [...r.querySelectorAll('.na-door')].filter(seen).length,
    chips: [...r.querySelectorAll('.na-chip')].filter(seen).length,
    goLine: (r.querySelector('.na-door .na-go') || {}).textContent || '',
    on: ((r.querySelector('.na-door.on,.na-chip.on') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    name: q('#na-card-name').textContent, sub: q('#na-card-sub').textContent,
    boxes: r.querySelectorAll('#na-form input,#na-form select').length,
    paper: !!q('#tf-preview'), paperText: ((q('#tf-preview') || {}).textContent || '').length,
    say: !!q('#dr-say'), find: !!q('#dr-read'), upload: !!q('#na-upload'), imp: !!q('#na-import'),
    foot: [...r.querySelectorAll('.na-foot button')].map(b => b.textContent.trim()),
    labelWeight: getComputedStyle(r.querySelector('#na-form label > span') || r).fontWeight };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  /* Two company standards, published, so the doors have something to draw. */
  for (const [name, desc, cat] of [['Raw Material Supply Agreement', 'Commodity & ingredient supply into the plants', 'procurement'],
    ['Mutual Non-Disclosure Agreement', 'Confidentiality for NPD & vendor onboarding', 'corporate']]) {
    const tpl = await W.admin.json('/api/templates', { method: 'POST', body: { name, description: desc, category: cat } });
    const tid = tpl.template.id; const tdet = await W.admin.json('/api/templates/' + tid); const tv = tdet.versions[0].id;
    await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: { blocks: [
      { orderIndex: 0, blockType: 'heading', content: name },
      { orderIndex: 1, blockType: 'fixed_text', content: 'This agreement is made between {{org_name}} (the "Client") and {{provider}} (the "Provider").' }],
      fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', defaultValue: '{{org.company_name}}' },
        { fieldKey: 'provider', label: 'Provider name', fieldType: 'short_text' }] } });
    await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
  }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' }); await pause(500);
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go'); await pause(2600);
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} setView('register'); }); await pause(900);

    /* ===== 1. THE + BUTTON OPENS ONE SCREEN ===== */
    await page.click('[data-page-new]'); await pause(900);
    let m = await page.evaluate(READ);
    await page.screenshot({ path: path.join(OUT, '01-popup-1440.png') });
    check('1a the + button opens the pop-up, not a menu', !m.err && !m.menuOpen, m.err || `menu open ${m.menuOpen}`);
    check('1b two columns at 1440, the artifact\'s own frame', !m.err && m.cols === 2 && m.panelW === 960, m.err || `${m.cols} cols, ${m.panelW}px`);
    check('1c the company standards are doors, with version, use and stream', !m.err && m.doors === 2 && /v1 · used 0×/.test(m.goLine), m.err || `${m.doors} doors · "${m.goLine}"`);
    check('1d HaTi\'s paper is a row of chips', !m.err && m.chips >= 10, m.err || `${m.chips} chips`);
    check('1e the first door is lit and its questions are in the card', !m.err && m.on && m.name && m.boxes >= 6 && /questions/.test(m.sub), m.err || `${m.name} · ${m.sub} · ${m.boxes} boxes`);
    check('1f the sentence box, Find, Upload and Import are all on it', !m.err && m.say && m.find && m.upload && m.imp);
    check('1g the foot is Cancel · Skip the questions · Create draft', !m.err && m.foot.join('|') === 'Cancel|Skip the questions|Create draft', m.err || m.foot.join('|'));
    check('1h no paper column under the wide line', !m.err && !m.paper);
    check('1i the card\'s labels wear the artifact\'s label weight, not the form\'s bold', !m.err && Number(m.labelWeight) < 600, m.err || m.labelWeight);

    /* ===== 2. A CHIP SWAPS THE CARD ===== */
    await page.evaluate(() => document.querySelector('[data-wz-tid="ND"]').click()); await pause(500);
    m = await page.evaluate(READ);
    check('2a pressing a HaTi chip lights it and draws that template\'s own questions', !m.err && /NDA/.test(m.on) && /NDA/.test(m.name) && m.boxes >= 5, m.err || `${m.on} · ${m.name} · ${m.boxes}`);
    check('2b the wizard\'s own boxes, by their own ids', await page.evaluate(() => !!document.getElementById('wz-counterparty') && !!document.getElementById('wz-cpemail')));

    /* ===== 3. THE BOX FILTERS BY WORD ===== */
    await page.fill('#dr-say', 'disclosure'); await pause(400);
    m = await page.evaluate(READ);
    check('3a typing narrows the lists by word', !m.err && m.doors === 1 && m.chips <= 2, m.err || `${m.doors} doors, ${m.chips} chips`);
    await page.fill('#dr-say', 'zzzz nothing'); await pause(400);
    const none = await page.evaluate(() => ({ note: !!document.querySelector('.na-none'), doors: document.querySelectorAll('.na-door').length }));
    check('3b nothing matching says so and still lists every door', none.note && none.doors === 2, JSON.stringify(none));
    await page.fill('#dr-say', ''); await pause(400);

    /* ===== 4. CREATE REALLY CREATES, THROUGH THE DOOR'S OWN ACT ===== */
    await page.evaluate(() => document.querySelector('[data-wz-tid="ND"]').click()); await pause(400);
    const before = await page.evaluate(() => state.contracts.length);
    await page.fill('#wz-counterparty', 'Popup Test Ltd');
    await page.click('#na-create'); await pause(1200);
    const made = await page.evaluate(() => { const c = state.contracts.find(x => x.counterparty === 'Popup Test Ltd');
      return { n: state.contracts.length, gone: !document.getElementById('na-root'), tpl: c && c.template, status: c && c.status, view: state.view }; });
    check('4a Create draft makes one contract from the chosen template and closes the pop-up',
      made.n === before + 1 && made.gone && made.tpl === 'ND' && made.status === 'Draft', JSON.stringify(made));

    /* ===== 5. SKIP THE QUESTIONS CREATES IT UNFILLED ===== */
    await page.evaluate(() => { setView('register'); }); await pause(600);
    await page.evaluate(() => openNewAgreement({ pick: { kind: 'tid', id: 'RM' } })); await pause(600);
    const b2 = await page.evaluate(() => state.contracts.length);
    await page.click('#na-skip'); await pause(1200);
    const skipped = await page.evaluate(() => ({ n: state.contracts.length, gone: !document.getElementById('na-root'), cp: (state.contracts[0] || {}).counterparty }));
    check('5a Skip the questions creates the draft with its blanks intact', skipped.n === b2 + 1 && skipped.gone && !skipped.cp, JSON.stringify(skipped));

    /* ===== 6. CANCEL AND ESCAPE ===== */
    await page.evaluate(() => { setView('register'); }); await pause(500);
    await page.evaluate(() => openNewAgreement()); await pause(400);
    await page.click('#wz-pick-cancel'); await pause(300);
    check('6a Cancel closes it', await page.evaluate(() => !document.getElementById('na-root')));
    await page.evaluate(() => openNewAgreement()); await pause(400);
    await page.keyboard.press('Escape'); await pause(300);
    check('6b so does Escape', await page.evaluate(() => !document.getElementById('na-root')));

    /* ===== 7. PAST THE WIDE LINE THE PAPER DRAWS BESIDE THE ANSWERS ===== */
    await page.setViewportSize({ width: 1700, height: 950 }); await pause(300);
    await page.evaluate(() => openNewAgreement()); await pause(900);
    m = await page.evaluate(READ);
    await page.screenshot({ path: path.join(OUT, '02-popup-1700.png') });
    check('7a at 1700 the frame is 1240 with three columns', !m.err && m.cols === 3 && m.panelW === 1240, m.err || `${m.cols} cols, ${m.panelW}px`);
    check('7b and the paper is drawn, with wording in it', !m.err && m.paper && m.paperText > 40, m.err || `paper ${m.paper}, ${m.paperText} chars`);
    await page.evaluate(() => closeModal());

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('the run finished', false, String((e && e.message) || e)); }
  finally { await browser.close(); if (h.stop) h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
