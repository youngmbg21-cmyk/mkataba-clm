/* new-agreement-verify — THE NEW AGREEMENT POP-UP, DRIVEN (21 Sep 2026)
   =====================================================================
   Young: "you have not implemented pop ups like this", over the artifact's
   own New agreement dialog. f345 pins the source; this presses the real app:
   the + button opens ONE screen, the paper you have is on it, the chosen
   template's questions are in the card, Create really creates, the sentence
   box filters, and past the wide line the paper draws beside the answers.
   At the parent the + button opens a menu and 1a is red.
   RE-POINTED 23 Sep 2026 (Young: "remove paper from the pop up entirely and
   in any type of computer", then option 1, the ask across the top): there is
   no paper at any width now, and the ask spans the body above the rail.
   1b, 1h, 7 and 9 are reversed in place; 1j is new.

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
    /* RE-POINTED 22 Sep 2026 — proposal C. The doors and the chips became one
       rail of rows, so what used to be two counts is one. */
    picks: [...r.querySelectorAll('.na-pick')].filter(seen).length,
    lib: [...r.querySelectorAll('[data-wz-lib]')].filter(seen).length,
    tid: [...r.querySelectorAll('[data-wz-tid]')].filter(seen).length,
    goLines: [...r.querySelectorAll('[data-wz-lib] .na-pick-m')].map(x => x.textContent),
    on: ((r.querySelector('.na-pick.on .na-pick-n') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    onFilled: (() => { const b = r.querySelector('.na-pick.on'); if (!b) return null;
      const cs = getComputedStyle(b); return { bg: cs.backgroundColor, ink: getComputedStyle(b.querySelector('.na-pick-n')).color }; })(),
    railW: Math.round(((q('#wz-pick') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect()).width),
    cardW: Math.round(((q('.na-card') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect()).width),
    listScrolls: (() => { const l = q('.na-picks'); return !!l && l.scrollHeight > l.clientHeight + 1; })(),
    moreSeen: (() => { const mo = q('.na-more'), bd = q('#na-body'); if (!mo || !bd) return false;
      const a = mo.getBoundingClientRect(), b2 = bd.getBoundingClientRect();
      return a.bottom <= b2.bottom + 1 && a.top >= b2.top - 1; })(),
    sayH: (() => { const t = q('#dr-say'); if (!t) return null;
      return { h: Math.round(t.getBoundingClientRect().height), scrollH: t.scrollHeight, clientH: t.clientHeight,
        sideways: t.scrollWidth > t.clientWidth + 1 }; })(),
    name: q('#na-card-name').textContent, sub: q('#na-card-sub').textContent,
    boxes: r.querySelectorAll('#na-form input,#na-form select').length,
    paper: !!q('#tf-preview'), paperText: ((q('#tf-preview') || {}).textContent || '').length,
    say: !!q('#dr-say'), find: !!q('#dr-read'), upload: !!q('#na-upload'), imp: !!q('#na-import'),
    foot: [...r.querySelectorAll('.na-foot button')].map(b => b.textContent.trim()),
    labelWeight: getComputedStyle(r.querySelector('#na-form label > span') || r).fontWeight,
    /* WHERE THE ASK SITS (23 Sep 2026): in the body above the rail, or in it. */
    ask: (() => { const f = q('.na-field'), b = q('#na-body'), t = q('#dr-say'), fd = q('#dr-read'), rl = q('#wz-pick');
      if (!f || !t || !fd) return null;
      const tr = t.getBoundingClientRect(), dr = fd.getBoundingClientRect();
      return { inBody: f.parentElement === b, inRail: !!(rl && rl.contains(f)), sayW: Math.round(tr.width),
        findBeside: dr.left >= tr.right - 1 && dr.top < tr.bottom && dr.bottom > tr.top }; })() };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  /* Two company standards, published, so the doors have something to draw. */
  /* ONE OF THE TWO IS FILED IN A STREAM (22 Sep 2026), because the rail's row
     carries version, usage AND stream on one line and the claim has to see a
     real one rather than an absence. */
  for (const [name, desc, cat, folder] of [['Raw Material Supply Agreement', 'Commodity & ingredient supply into the plants', 'procurement', 'proc'],
    ['Mutual Non-Disclosure Agreement', 'Confidentiality for NPD & vendor onboarding', 'corporate', '']]) {
    const tpl = await W.admin.json('/api/templates', { method: 'POST', body: { name, description: desc, category: cat, folder } });
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
    await page.click('[data-page-new]'); await pause(500);
    /* 23 Sep 2026: the button opens two doors first (openNewDoors); this presses Draft from HaTi. */
    await page.click('[data-nd-door="draft"]').catch(() => {}); await pause(900);
    let m = await page.evaluate(READ);
    await page.screenshot({ path: path.join(OUT, '01-popup-1440.png') });
    check('1a the + button opens the pop-up, not a menu', !m.err && !m.menuOpen, m.err || `menu open ${m.menuOpen}`);
    /* RE-POINTED IN PLACE 22 Sep 2026 — Young chose proposal C off the five
       proposals drawn that morning. At the parent this reported 2 columns and
       960px, and the agreement was not on the screen at any width under 1600.
       REVERSED IN PLACE 23 Sep 2026 — no paper on this screen, on any device:
       the rail and the questions, in one 900 frame. At the parent this
       reported 3 columns and 1180px. */
    check('1b two columns at 1440 in a 900 frame — the rail and the questions', !m.err && m.cols === 2 && m.panelW === 900, m.err || `${m.cols} cols, ${m.panelW}px`);
    check('1c the company standards are rows, with version, use and stream on one line',
      !m.err && m.lib === 2 && m.goLines.some(x => /^v1 · used 0× · Procurement/.test(x)) && m.goLines.every(x => /^v1 · used 0×/.test(x)),
      m.err || `${m.lib} rows · ${JSON.stringify(m.goLines)}`);
    check('1d HaTi\'s paper is in the same rail, not a wall of chips', !m.err && m.tid >= 10 && m.picks === m.lib + m.tid, m.err || `${m.tid} of ${m.picks}`);
    check('1e the first row is lit and its questions are in the card', !m.err && m.on && m.name && m.boxes >= 6 && /questions/.test(m.sub), m.err || `${m.name} · ${m.sub} · ${m.boxes} boxes`);
    check('1e2 a lit row is FILLED, the product\'s own rail treatment', !m.err && m.onFilled
      && m.onFilled.bg !== 'rgba(0, 0, 0, 0)' && /255, 255, 255/.test(m.onFilled.ink), m.err || JSON.stringify(m.onFilled));
    check('1e3 the questions get more room than the 380px they had', !m.err && m.cardW >= 430, m.err || m.cardW + 'px');
    /* REVERSED 23 Sep 2026 (Young: "remove the Upload it link") — upload is a door in front of this screen (openNewDoors): the screen carries the sentence box, Find and Import, and NO upload link. */
    check('1f the sentence box, Find and Import are on it, and no second Upload', !m.err && m.say && m.find && !m.upload && m.imp);
    check('1g the foot is Cancel · Skip the questions · Create draft', !m.err && m.foot.join('|') === 'Cancel|Skip the questions|Create draft', m.err || m.foot.join('|'));
    /* REVERSED IN PLACE: the agreement is drawn at 1440 now, which is the
       whole of what proposal C was chosen for.
       REVERSED AGAIN 23 Sep 2026 — the owner took it off this screen. At the
       parent this printed "paper true" with its wording. */
    check('1h no agreement is drawn at 1440', !m.err && !m.paper && m.paperText === 0
      && await page.evaluate(() => !document.getElementById('na-paper')), m.err || `paper ${m.paper}, ${m.paperText} chars`);
    check('1h2 the rail is 260 and the list scrolls inside it, so its foot stays on screen',
      !m.err && m.railW === 260 && m.listScrolls && m.moreSeen,
      m.err || `rail ${m.railW} · list scrolls ${m.listScrolls} · Import row on screen ${m.moreSeen}`);
    check('1i the card\'s labels wear the artifact\'s label weight, not the form\'s bold', !m.err && Number(m.labelWeight) < 600, m.err || m.labelWeight);
    /* THE ASK TAKES THE WHOLE TOP LINE (Young, 22-23 Sep 2026). At the parent
       it sat in the 260px rail: the box 236px wide and Find UNDER it. */
    check('1j the ask spans the top line, above the rail, with Find beside the box',
      !m.err && m.ask && m.ask.inBody && !m.ask.inRail && m.ask.sayW >= 700 && m.ask.findBeside,
      m.err || JSON.stringify(m.ask));

    /* ===== 2. A CHIP SWAPS THE CARD ===== */
    await page.evaluate(() => document.querySelector('[data-wz-tid="ND"]').click()); await pause(500);
    m = await page.evaluate(READ);
    check('2a pressing a HaTi row lights it and draws that template\'s own questions', !m.err && /NDA/.test(m.on) && /NDA/.test(m.name) && m.boxes >= 5, m.err || `${m.on} · ${m.name} · ${m.boxes}`);
    check('2b the wizard\'s own boxes, by their own ids', await page.evaluate(() => !!document.getElementById('wz-counterparty') && !!document.getElementById('wz-cpemail')));

    /* ===== 3. THE BOX FILTERS BY WORD ===== */
    await page.fill('#dr-say', 'disclosure'); await pause(400);
    m = await page.evaluate(READ);
    check('3a typing narrows the lists by word', !m.err && m.lib === 1 && m.tid <= 2, m.err || `${m.lib} standards, ${m.tid} HaTi`);
    /* THE ASK GROWS WITH THE SENTENCE (Young, 22 Sep 2026). At the parent this
       box stood at two lines whatever was typed and scrolled inside itself.
       RE-STAGED IN PLACE 23 Sep 2026: the box is 750px wide now, not 236, so
       the old one-line request fits in its two rows and has nothing to grow
       into. The request below runs to three lines at the new width, which is
       what the claim needs to exercise — the claim itself is unchanged. */
    const grow0 = await page.evaluate(() => document.getElementById('dr-say').getBoundingClientRect().height);
    await page.fill('#dr-say', 'a two-year packaging supply agreement with Kenafric Industries where we are the supplier, '
      + 'payment is forty five days from invoice, ninety days notice to terminate, prices reviewed every six months '
      + 'against the published index, delivery to our Nairobi and Mombasa warehouses, and a cap on liability at the fees paid');
    await pause(400);
    const grew = await page.evaluate(() => { const t = document.getElementById('dr-say');
      return { h: Math.round(t.getBoundingClientRect().height), inner: t.scrollHeight > t.clientHeight + 1, sideways: t.scrollWidth > t.clientWidth + 1 }; });
    check('3a2 the describe box grows with the sentence and scrolls neither way',
      grew.h > grow0 + 8 && !grew.inner && !grew.sideways,
      `${Math.round(grow0)} -> ${grew.h}px · inner scroll ${grew.inner} · sideways ${grew.sideways}`);
    await page.fill('#dr-say', 'zzzz nothing'); await pause(400);
    const none = await page.evaluate(() => ({ note: !!document.querySelector('.na-none'), rows: document.querySelectorAll('[data-wz-lib]').length }));
    check('3b nothing matching says so and still lists every standard', none.note && none.rows === 2, JSON.stringify(none));
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
    await page.evaluate(() => openNewAgreement({})); await pause(400);
    await page.click('#wz-pick-cancel'); await pause(300);
    check('6a Cancel closes it', await page.evaluate(() => !document.getElementById('na-root')));
    await page.evaluate(() => openNewAgreement({})); await pause(400);
    await page.keyboard.press('Escape'); await pause(300);
    check('6b so does Escape', await page.evaluate(() => !document.getElementById('na-root')));

    /* ===== 7. PAST THE OLD WIDE LINE NOTHING CHANGES SHAPE =====
       REVERSED IN PLACE 23 Sep 2026: this said the paper drew beside the
       answers at 1700. It draws at no width now; the frame is one width. */
    await page.setViewportSize({ width: 1700, height: 950 }); await pause(300);
    await page.evaluate(() => openNewAgreement({})); await pause(900);
    m = await page.evaluate(READ);
    await page.screenshot({ path: path.join(OUT, '02-popup-1700.png') });
    check('7a at 1700 the frame is the same 900 with two columns', !m.err && m.cols === 2 && m.panelW === 900, m.err || `${m.cols} cols, ${m.panelW}px`);
    check('7b and no paper is drawn', !m.err && !m.paper, m.err || `paper ${m.paper}, ${m.paperText} chars`);
    await page.evaluate(() => closeModal());

    /* ═══ 8 · WHO ELSE IS ON THIS AGREEMENT (Young ruled 21 Sep 2026) ═══
       *"before you create the draft you should have the option to add the
       other participants."* SHUT BY DEFAULT — it is an offer, not a question
       — and nothing it collects is written anywhere until a record exists. */
    await page.evaluate(() => openNewAgreement({})); await pause(600);
    const ppl = await page.evaluate(() => {
      const d = document.getElementById('na-people');
      if (!d) return null;
      const r = d.getBoundingClientRect();
      return { open: d.hasAttribute('open'), w: Math.round(r.width),
        sum: ((d.querySelector('summary') || {}).textContent || '').trim().slice(0, 50) };
    });
    check('8a the drafting screen offers it', !!ppl && ppl.w > 2,
      ppl ? ppl.sum : 'not drawn');
    check('8b shut at rest — it is an offer, not a question', !!ppl && !ppl.open,
      ppl ? (ppl.open ? 'open' : 'shut') : 'not drawn');
    const held = await page.evaluate(() => {
      const d = document.getElementById('na-people');
      if (d) d.setAttribute('open', '');
      const b = document.querySelector('#na-people-list [data-pt-add]');
      if (!b) return { ok: false, why: 'no Add' };
      b.click();
      return { ok: true };
    });
    await page.waitForTimeout(400);
    const after8 = await page.evaluate(() => ({
      rows: document.querySelectorAll('#na-people-list [data-pt-row]').length,
      held: (window.participantsHeld ? window.participantsHeld() : []).length,
      roles: !!document.querySelector('#na-people-list [data-pt-f="role"]'),
      access: !!document.querySelector('#na-people-list [data-pt-f="access"]'),
      reached: document.querySelectorAll('#na-people-list .pt-reached').length,
    }));
    check('8c Add someone adds a row with a role and an access level',
      held.ok && after8.rows === 1 && after8.roles && after8.access,
      held.why || JSON.stringify(after8));
    check('8d and it is HELD, not written — there is no record yet',
      after8.held === 1, after8.held + ' held');
    check('8e CONTROL — nothing has reached anybody, so no column claims it',
      after8.reached === 0, after8.reached + ' reached cells');
    await page.evaluate(() => closeModal()); await pause(300);
    check('8f CONTROL — and leaving drops them, nobody was named on anything',
      await page.evaluate(() => (window.participantsHeld ? window.participantsHeld() : []).length === 0),
      'held after cancel');

    /* ═══ 9 · ON AN iPAD IT IS THE SAME TWO COLUMNS, AND THERE IS NO PAPER ═══
       REVERSED IN PLACE 23 Sep 2026. This section drove D — "under 1280 the
       agreement is stacked and the two sides scroll apart" (Young, 22 Sep).
       The next morning the owner's iPad Pro 12.9" (1366 wide) drew three
       columns, which is exactly what "under 1280" said, and the ruling that
       followed took the paper off this screen on every device. What is left
       to drive: both iPad sizes get the same two columns, nothing stacked, no
       paper; the Import row is on screen on a fresh open; the foot with Create
       is always there; the note says only what is true; and whatever sits
       below the fold is reachable with a real wheel.
       The old 9h (the laptop shape at 1700) is section 7's claim now.
       Every claim is GATED on the pop-up being open. */
    await page.evaluate(() => closeModal()); await pause(200);
    const D = () => {
      const q = s2 => document.querySelector(s2);
      const body = q('#na-body');
      if (!body) return { err: 'no pop-up' };
      const inView = (el, box) => { if (!el || !box) return false;
        const a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
        return a.height > 0 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1; };
      return { stack: body.classList.contains('na-stack'), right: !!q('#na-right'),
        cols: getComputedStyle(body).gridTemplateColumns.split(' ').length,
        frameW: Math.round(q('.modal-in').getBoundingClientRect().width),
        paper: !!q('#na-paper') || !!q('#tf-preview'),
        moreOnScreen: inView(q('.na-more'), body),
        peopleOnScreen: inView(q('#na-people > summary'), body),
        footOnScreen: (() => { const f = q('.na-foot'); if (!f) return false; const r = f.getBoundingClientRect();
          return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight + 1; })(),
        bodyScroll: body.scrollTop,
        note: ((q('.na-note') || {}).textContent || '').trim() };
    };
    let d;
    for (const [w, hh, label] of [[1194, 834, 'iPad Pro 11"'], [1366, 1024, 'iPad Pro 12.9"']]) {
      await page.setViewportSize({ width: w, height: hh }); await pause(300);
      await page.evaluate(() => openNewAgreement({})); await pause(900);
      d = await page.evaluate(D);
      await page.screenshot({ path: path.join(OUT, `03-ipad-${w}.png`) });
      check(`9a ${label} at ${w}: two columns in a 900 frame, nothing stacked`,
        !d.err && !d.stack && !d.right && d.cols === 2 && d.frameW === 900,
        d.err || `stack ${d.stack} · #na-right ${d.right} · ${d.cols} cols · ${d.frameW}px`);
      check(`9b ${label} at ${w}: no agreement is drawn`, !d.err && !d.paper, d.err || `paper ${d.paper}`);
      /* A GUARD: it held at the parent too. It is here because the list's
         cap was RE-DERIVED when the ask left the rail, and this is the whole
         of what that cap promises. */
      check(`9c GUARD ${label} at ${w}: the Import row is on screen on a fresh open`,
        !d.err && d.moreOnScreen, d.err || (d.moreOnScreen ? 'on screen' : 'the rail\'s foot is below the fold'));
      /* A GUARD, not a red-at-the-parent claim: the foot sits outside the
         scroller in both shapes. It is here because on a short screen the
         body now scrolls, and Create must never be what scrolls away. */
      check(`9d GUARD ${label} at ${w}: Cancel, Skip and Create are always on screen`,
        !d.err && d.footOnScreen, d.err || (d.footOnScreen ? 'on screen' : 'the foot is off screen'));
      await page.evaluate(() => closeModal()); await pause(200);
    }
    check('9e the note says only what is true — no blank to light, nothing "under these questions"',
      !d.err && /Copilot reads the agreement on arrival/.test(d.note) && !/lights the blank|under these questions/.test(d.note),
      d.err || d.note.slice(0, 90));
    /* A REAL WHEEL, at the iPad size where the body DOES scroll (MEASURED: by
       105px at 1194x834, because the ask now sits above both columns). What
       is below the fold must be reachable, and the foot must not move.
       A GUARD at the parent too: there the stacked column scrolled instead. */
    await page.setViewportSize({ width: 1194, height: 834 }); await pause(300);
    await page.evaluate(() => openNewAgreement({})); await pause(900);
    const before9 = await page.evaluate(D);
    const cardBox = await page.evaluate(() => {
      const b = document.querySelector('.na-card').getBoundingClientRect();
      return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + 40) };
    });
    await page.mouse.move(cardBox.x, cardBox.y);
    await page.mouse.wheel(0, 700); await pause(500);
    d = await page.evaluate(D);
    await page.screenshot({ path: path.join(OUT, '04-ipad-1194-scrolled.png') });
    check('9f GUARD a real wheel over the questions brings the last of them into view, and the foot stays',
      !d.err && d.peopleOnScreen && d.footOnScreen,
      d.err || `"Who else" on screen ${before9.peopleOnScreen} → ${d.peopleOnScreen} · foot ${d.footOnScreen}`);
    /* WHERE THE READER ENDS UP: another template is another set of questions,
       and still no paper. At the parent the stacked paper followed the pick. */
    await page.evaluate(() => document.querySelector('[data-wz-tid]').click()); await pause(500);
    d = await page.evaluate(D);
    check('9g picking another template swaps the questions and draws no paper', !d.err && !d.paper, d.err || `paper ${d.paper}`);
    await page.evaluate(() => closeModal()); await pause(200);

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('the run finished', false, String((e && e.message) || e)); }
  finally { await browser.close(); if (h.stop) h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
