/* Chromium verification: THE PAPER AND THE RAIL — tag, talk, apply.
   ============================================================
   Prompt & Build, round two (13 Sep 2026). f306 reads the markup the builder
   prints; this file PRESSES it with a real mouse and keyboard, because the
   claims that matter here are journeys: a section tagged from the paper lands
   on the rail's focus card, a draft asked for in the box comes back as a card,
   Apply puts its wording on the paper and — through Save — on the server, the
   walk moves on to the next empty section, and typing on the paper itself is
   still the first way in. Copilot is a stub in the page (the drafting call is
   the product's own and is not what is under test); the outline route is
   answered at the network edge.

   Run: node test/chromium/prompt-and-build-verify.js
   HATI_SHOT_DIR=/some/dir puts the screenshots somewhere else. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'prompt-and-build');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

const OUTLINE = { sections: [
  { heading: 'Parties', intent: 'Who the agreement is between.' },
  { heading: 'Definitions', intent: 'The terms the rest of the paper leans on.' },
  { heading: 'Payment terms', intent: 'When invoices are paid and what late payment costs.' },
], note: 'Three sections for a carrier agreement.' };
const DRAFT = 'The Carrier shall collect and deliver the Company’s freight within {{delivery_days}} days of booking.';

const RAIL = () => {
  const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const page = document.getElementById('tb-page'), rail = document.getElementById('tb-rail'), paper = document.getElementById('tb-paper');
  return {
    page: R(page), rail: R(rail), paper: R(paper),
    scope: (document.querySelector('#tb-scope .eb b') || {}).textContent || '',
    lane: (document.getElementById('tb-lane') || {}).textContent || '',
    foot: (document.getElementById('tb-railfoot') || {}).textContent || '',
    heads: [...document.querySelectorAll('.tb-hed')].map(e => e.textContent),
    tags: document.querySelectorAll('[data-tb-tag]').length,
    inlineAsks: document.querySelectorAll('[data-tb-ask-in]').length,
    editables: document.querySelectorAll('[contenteditable="true"]').length,
    cards: document.querySelectorAll('.tb-card[data-tb-card]').length,
    active: document.activeElement && document.activeElement.id,
    dirty: (document.getElementById('tb-dirty') || {}).textContent || '',
    pick: (() => { const p = document.getElementById('tb-pick'); return p ? { hidden: p.hidden, rows: p.querySelectorAll('[data-tb-pick]').length } : null; })(),
    sec2: (() => { const s = document.querySelectorAll('[data-tb-sec]')[1]; return s ? s.textContent : ''; })(),
    on: [...document.querySelectorAll('[data-tb-sec].is-on .tb-hed')].map(e => e.textContent),
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const seeded = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/ai/outline', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OUTLINE) }));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    /* A draft template of this workspace's own, made through the product's own
       route; the builder is opened on its first version. */
    const ids = await page.evaluate(async () => {
      const d = await api('templates', 'POST', { name: 'Transportation Management', category: 'procurement', folder: 'dist', description: '' });
      const t = await api('templates/' + d.template.id);
      return { tid: d.template.id, vid: t.versions[0].id };
    });
    await page.evaluate(() => {
      window.copilotAvailable = () => true;
      window.copilotPropose = async o => ({ advice: 'Drafted from your ask; nothing in your library for this heading.', proposedText: window.__PB_DRAFT });
    });
    await page.evaluate(d => { window.__PB_DRAFT = d; }, DRAFT);
    await page.evaluate(ids => openTemplateBuilder(ids.tid, ids.vid), ids);
    await pause(1200);

    /* ================= 1 · THE SHAPE ================ */
    let s = await page.evaluate(RAIL);
    await page.screenshot({ path: path.join(OUT, '01-empty.png') });
    check('1a · two columns: the page fills the screen and the rail is 380 wide, to the right of the paper',
      !!s.page && s.page.w > 1000 && !!s.rail && Math.abs(s.rail.w - 380) <= 2 && s.rail.x > s.paper.x + s.paper.w - 1,
      { page: s.page && s.page.w, rail: s.rail, paper: s.paper });
    check('1b · no ask box under any heading — the rail is the one door', s.inlineAsks === 0 && !!s.lane, { inline: s.inlineAsks });
    check('1c · an empty template is asked the one question in the rail', /What is this template for\?/.test(s.lane), s.lane.slice(0, 80));

    /* ================= 2 · DESCRIBE → OUTLINE → ADD ================ */
    await page.fill('#tb-ask', 'Transportation agreement with a carrier to manage our freight distribution.');
    await page.keyboard.press('Enter');
    await pause(900);
    s = await page.evaluate(RAIL);
    check('2a · the outline comes back as a list, headings only', /Parties[\s\S]*Definitions[\s\S]*Payment terms/.test(s.lane) && /Headings only/.test(s.lane), s.lane.slice(0, 120));
    await page.click('[data-tb-out-add]');
    await pause(900);
    s = await page.evaluate(RAIL);
    await page.screenshot({ path: path.join(OUT, '02-outlined.png') });
    /* The stub proposes three; the playbook's open positions join them, marked,
       and nothing is proposed twice (Payment terms is both the model's and the
       playbook's, and appears once). */
    const N = s.heads.length;
    check('2b · Add puts the proposed sections on the paper, the playbook’s after them, none twice',
      N >= 4 && s.heads[0] === 'Parties' && s.heads[1] === 'Definitions' && s.heads[2] === 'Payment terms'
        && new Set(s.heads.map(x => x.toLowerCase())).size === N, s.heads);
    check('2c · the first section is in hand, framed on the paper and named on the focus card',
      /Section 1 · Parties/i.test(s.scope) && s.on.length === 1 && s.on[0] === 'Parties', { scope: s.scope, on: s.on });
    check('2d · the walk is on and asks its question in HaTi’s own words', /what should it say\?/.test(s.lane) && /Walk me through it · on/.test(s.foot), { foot: s.foot });
    check('2e · the foot counts: 0 of N written', new RegExp('0 of ' + N).test(s.foot), s.foot);

    /* ================= 3 · TAG (a real press on the ✦) ================ */
    const tag2 = page.locator('[data-tb-sec]').nth(1).locator('[data-tb-tag]');
    await page.locator('[data-tb-sec]').nth(1).hover();
    await pause(150);
    await tag2.click();
    await pause(400);
    s = await page.evaluate(RAIL);
    check('3a · ✦ on section 2 puts it in hand: the focus card names it and the frame moves', /Section 2 · Definitions/.test(s.scope) && s.on[0] === 'Definitions', { scope: s.scope, on: s.on });
    check('3b · and the caret is in the ask box', s.active === 'tb-ask', s.active);

    /* ================= 4 · TALK ================ */
    await page.fill('#tb-ask', 'Define the Services and the Fees.');
    await page.keyboard.press('Enter');
    await pause(900);
    s = await page.evaluate(RAIL);
    const card = await page.evaluate(() => {
      const c = document.querySelector('.tb-card[data-tb-card]'); if (!c) return null;
      return { name: c.querySelector('.n').textContent, apply: !!c.querySelector('[data-tb-use]'), refine: !!c.querySelector('[data-tb-refine]'),
        chip: c.querySelector('.pv .tb-bl') && c.querySelector('.pv .tb-bl').textContent, rests: (c.querySelector('.r') || {}).textContent || '' };
    });
    await page.screenshot({ path: path.join(OUT, '03-card.png') });
    check('4a · the answer is a card in the rail with Apply and Ask for a change', !!card && card.apply && card.refine && /Definitions — 1/.test(card.name), card);
    check('4b · the card says what it rests on', !!card && /Rests on:/.test(card.rests), card && card.rests);
    check('4c · a blank in the draft is already drawn as a chip', !!card && card.chip === 'delivery_days', card && card.chip);
    check('4d · nothing landed on the paper yet — a card waits for a person', !/within/.test(s.sec2), s.sec2.slice(0, 80));

    /* ================= 5 · APPLY ================ */
    await page.click('[data-tb-use]');
    await pause(700);
    s = await page.evaluate(RAIL);
    await page.screenshot({ path: path.join(OUT, '04-applied.png') });
    check('5a · Apply puts the wording on the paper, in section 2', /freight within/.test(s.sec2), s.sec2.slice(0, 100));
    check('5b · the receipt names the section', /Applied to 2 · Definitions/.test(s.lane), s.lane.slice(-160));
    check('5c · the walk moves on to the next empty section, section 3', /Section 3 · Payment terms/.test(s.scope), s.scope);
    check('5d · the foot counts 1 of N, and the strip says Unsaved changes', new RegExp('1 of ' + N).test(s.foot) && /Unsaved/.test(s.dirty), { foot: s.foot, dirty: s.dirty });

    /* ================= 6 · SAVE: the one door, end to end ================ */
    await page.click('#tb-save');
    await pause(900);
    const saved = await seeded.admin.json(`/api/templates/${ids.tid}/versions/${ids.vid}`);
    const landed = (saved.blocks || []).some(b => b.blockType !== 'heading' && /freight within \{\{delivery_days\}\} days/.test(b.content || ''));
    check('6 · the applied wording reached the server as ordinary block content, marker and all', landed, (saved.blocks || []).map(b => b.blockType + ':' + String(b.content || '').slice(0, 30)));

    /* ================= 7 · TYPING ON THE PAPER IS STILL THE FIRST WAY IN ================ */
    /* 7a: the empty wording block under section 1 takes the keyboard directly. */
    await page.locator('[data-tb-sec]').first().locator('[data-tb-kind="text"]').click();
    await pause(200);
    await page.keyboard.type('This Agreement is made between the Company and the Carrier.');
    await page.mouse.click(30, 700); /* off the paper: blur */
    await pause(300);
    /* 7b: a heading added by hand has no wording block yet — its placeholder
       is a press that makes one (tbWordingBlock, the one splice). */
    await page.selectOption('#tb-addtype', 'heading');
    await page.click('#tb-addblock');
    await pause(500);
    await page.locator('[data-tb-ph]').first().click();
    await pause(300);
    await page.keyboard.type('Typed under a heading added by hand.');
    await page.mouse.click(30, 700);
    await pause(300);
    await page.click('#tb-save');
    await pause(900);
    const saved2 = await seeded.admin.json(`/api/templates/${ids.tid}/versions/${ids.vid}`);
    const typed = (saved2.blocks || []).find(b => /made between the Company and the Carrier/.test(b.content || ''));
    const typed2 = (saved2.blocks || []).find(b => /Typed under a heading added by hand/.test(b.content || ''));
    check('7a · typing in a section’s wording block saves as that block’s content', !!typed && typed.orderIndex === 1, (saved2.blocks || []).map(b => b.orderIndex + ':' + b.blockType + ':' + String(b.content || '').slice(0, 24)));
    check('7b · a placeholder press makes the wording block right under its heading, and the words save', !!typed2 && typed2.orderIndex === saved2.blocks.length - 1 && saved2.blocks[typed2.orderIndex - 1].blockType === 'heading', typed2 && typed2.orderIndex);

    /* ================= 8 · THE @ PICKER ================ */
    await page.focus('#tb-ask');
    await page.keyboard.type('Match @');
    await pause(250);
    s = await page.evaluate(RAIL);
    check('8a · @ opens the section picker with every section', !!s.pick && !s.pick.hidden && s.pick.rows === N + 1, s.pick);
    await page.keyboard.press('Escape');
    await pause(150);
    s = await page.evaluate(RAIL);
    check('8b · Escape closes it', !!s.pick && s.pick.hidden, s.pick);
    await page.fill('#tb-ask', '');

    /* ================= 9 · THE PLAYBOOK TAB ================ */
    await page.click('[data-tb-tab="playbook"]');
    await pause(300);
    s = await page.evaluate(RAIL);
    check('9 · the Playbook tab counts against the book and names it', /Against your playbook/.test(s.lane) && /of \d/.test(s.lane), s.lane.slice(0, 80));
    await page.click('[data-tb-tab="build"]');
    await pause(200);

    /* ================= 10 · UNDER 1,024 THE RAIL STANDS DOWN ================ */
    const held = (await page.evaluate(RAIL)).scope; /* the section in hand before the rail goes */
    await page.setViewportSize({ width: 1000, height: 900 });
    await pause(500);
    s = await page.evaluate(RAIL);
    await page.screenshot({ path: path.join(OUT, '05-narrow.png') });
    check('10a · at 1,000px there is no rail and no ✦, and the paper still types', !s.rail && s.tags === 0 && s.editables >= 3, { rail: s.rail, tags: s.tags, editables: s.editables });
    await page.setViewportSize({ width: 1440, height: 900 });
    await pause(500);
    s = await page.evaluate(RAIL);
    check('10b · back at 1,440 the rail returns with the same section in hand', !!s.rail && !!held && s.scope === held, { before: held, after: s.scope });

    /* ================= 12 · THE DIVIDER (Young asked 14 Sep 2026) ================
       The clause editor's own handle between the paper and the rail: it sits
       on the seam at rest, follows the pointer, marks its limit, and a
       double-click puts the sheet's own columns back. Nothing else moved. */
    const GEO = () => { const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, w: r.width }; };
      const page = document.getElementById('tb-page'), rail = document.getElementById('tb-rail'), left = document.querySelector('#tb-page > .tb-left'), rez = document.getElementById('tb-resizer');
      return { page: R(page), rail: R(rail), left: R(left), rez: R(rez), limit: rez ? rez.getAttribute('data-rl-at-limit') : null,
        role: rez ? rez.getAttribute('role') : null, stored: (() => { try { return localStorage.getItem('hati.v1.tbLeftFrac'); } catch (_) { return null; } })(),
        editables: document.querySelectorAll('[contenteditable="true"]').length }; };
    const g0 = await page.evaluate(GEO);
    const seam0 = g0.left ? g0.left.x + g0.left.w + 8 : -1;
    check('12a · a separator sits on the seam between the paper and the rail at rest, and the rail is still 380',
      !!g0.rez && g0.role === 'separator' && Math.abs((g0.rez.x + g0.rez.w / 2) - seam0) <= 2 && Math.abs(g0.rail.w - 380) <= 2,
      { handle: g0.rez && Math.round(g0.rez.x + g0.rez.w / 2), seam: Math.round(seam0), rail: g0.rail && g0.rail.w });
    /* GUARDED (the standing rule): a build without the handle reports the
       four drags as failures rather than crashing the file on a null rect. */
    if (!g0.rez){
      ['12b · dragged 220px left, the rail is that much wider and the handle is under the pointer',
       '12c · pushed past its floor the paper stops and the handle SAYS it is at the limit',
       '12d · a double-click puts the sheet\'s own columns back — the rail at 380, nothing stored',
       '12e · and the paper still types — nothing else on the page moved'].forEach(n => check(n, false, 'no separator on the page'));
    } else {
      const hx = g0.rez.x + g0.rez.w / 2, hy = 400;
      await page.mouse.move(hx, hy); await page.mouse.down(); await page.mouse.move(hx - 60, hy, { steps: 4 }); await page.mouse.move(hx - 220, hy, { steps: 10 }); await page.mouse.up();
      await pause(300);
      const g1 = await page.evaluate(GEO);
      check('12b · dragged 220px left, the rail is that much wider and the handle is under the pointer',
        !!g1.rail && g1.rail.w > g0.rail.w + 200 && Math.abs((g1.rez.x + g1.rez.w / 2) - (hx - 220)) <= 2 && g1.stored != null,
        { rail: g1.rail && Math.round(g1.rail.w), handle: Math.round(g1.rez.x + g1.rez.w / 2), pointer: Math.round(hx - 220) });
      await page.mouse.move(g1.rez.x + g1.rez.w / 2, hy); await page.mouse.down(); await page.mouse.move(60, hy, { steps: 12 }); await page.mouse.up();
      await pause(300);
      const g2 = await page.evaluate(GEO);
      check('12c · pushed past its floor the paper stops and the handle SAYS it is at the limit',
        g2.limit === 'min' && g2.left && g2.left.w >= 370, { limit: g2.limit, paper: g2.left && Math.round(g2.left.w) });
      await page.dblclick('#tb-resizer');
      await pause(300);
      const g3 = await page.evaluate(GEO);
      check('12d · a double-click puts the sheet\'s own columns back — the rail at 380, nothing stored',
        !!g3.rail && Math.abs(g3.rail.w - 380) <= 2 && g3.stored == null && Math.abs((g3.rez.x + g3.rez.w / 2) - seam0) <= 2,
        { rail: g3.rail && Math.round(g3.rail.w), stored: g3.stored });
      check('12e · and the paper still types — nothing else on the page moved', g3.editables === g0.editables && g3.editables >= 3, { before: g0.editables, after: g3.editables });
      await page.screenshot({ path: path.join(OUT, '06-divider.png') });
    }

    /* ================= 13 · THE PAPER SCROLLS INSIDE ITS COLUMN, THE RAIL STAYS (Young asked 14 Sep 2026) ================
       "There needs to be a scrolling feature for the contract being created on
       the left just like in the editor page. For right hand side in copilot, it
       should stay intact and not move even when scrolling through the contract
       on the left." A long template through the product's own route, then a
       real wheel over the paper. Every claim below is red at the parent. */
    await page.evaluate(async ids => {
      const blocks = [];
      for (let i = 1; i <= 14; i++) {
        blocks.push({ orderIndex: blocks.length, blockType: 'heading', content: 'Section ' + i });
        blocks.push({ orderIndex: blocks.length, blockType: 'fixed_text', content: 'The parties agree that clause ' + i + ' governs the matters described in it, and that every figure stated in it binds both of them for the whole term.' });
      }
      await api(`templates/${ids.tid}/versions/${ids.vid}`, 'PUT', { blocks, fields: [] });
      await openTemplateBuilder(ids.tid, ids.vid);
    }, ids);
    await pause(1000);
    const SCR = () => { const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) }; };
      const sc = document.getElementById('content-scroll'), pg = document.getElementById('tb-page'), scroll = document.getElementById('tb-scroll');
      const strip = document.querySelector('#tb-page .tb-left > .tb-strip');
      return { shell: { clientH: sc.clientHeight, scrollH: sc.scrollHeight, top: sc.scrollTop, fixed: sc.classList.contains('view-fixed'), gutter: getComputedStyle(sc).scrollbarGutter },
        page: R(pg), scroll: scroll ? { clientH: scroll.clientHeight, scrollH: scroll.scrollHeight, top: scroll.scrollTop, rect: R(scroll) } : null,
        strip: R(strip), stripMB: strip ? parseFloat(getComputedStyle(strip).marginBottom) : null,
        paper: R(document.getElementById('tb-paper')), title: R(document.querySelector('#tb-paper .tb-title')),
        rail: R(document.getElementById('tb-rail')), back: R(document.getElementById('tb-back')),
        editables: document.querySelectorAll('[contenteditable="true"]').length }; };
    const k0 = await page.evaluate(SCR);
    check('13a · the page is exactly the shell\'s room and the shell has nothing to scroll; the paper column scrolls inside itself',
      !!k0.page && Math.abs(k0.page.h - k0.shell.clientH) <= 1 && k0.shell.scrollH <= k0.shell.clientH + 1 && !!k0.scroll && k0.scroll.scrollH > k0.scroll.clientH + 400,
      { page: k0.page && k0.page.h, shell: k0.shell, scroll: k0.scroll && { clientH: k0.scroll.clientH, scrollH: k0.scroll.scrollH } });
    check('13b · the paper starts where the flowing page put it: the scroller begins at the strip\'s own margin and there is no padding above the sheet (refusal 3)',
      !!k0.scroll && !!k0.strip && Math.abs(k0.scroll.rect.y - (k0.strip.bottom + k0.stripMB)) <= 1 && Math.abs(k0.paper.y - k0.scroll.rect.y) <= 1,
      { stripBottom: k0.strip && k0.strip.bottom, margin: k0.stripMB, scrollerTop: k0.scroll && k0.scroll.rect.y, paperTop: k0.paper && k0.paper.y });
    check('13c · the shell\'s scrollbar channel is given back while the page is up', k0.shell.fixed && k0.shell.gutter === 'auto', k0.shell);
    /* GUARDED: a build without the scroller reports the three presses as failures rather than crashing on a null. */
    if (!k0.scroll){
      ['13d · a real wheel over the paper moves the paper and nothing else: the rail, the strip and the shell stay',
       '13e · a repaint (Add block) keeps the reader\'s place in the paper',
       '13f · Back lands on the template\'s page with the channel reserved again'].forEach(n => check(n, false, 'no scroller on the page'));
    } else {
      await page.mouse.move(k0.paper.x + k0.paper.w / 2, Math.min(k0.paper.y + 200, 700)); await page.mouse.wheel(0, 600); await pause(500);
      const k1 = await page.evaluate(SCR);
      check('13d · a real wheel over the paper moves the paper and nothing else: the rail, the strip and the shell stay',
        k1.scroll.top - k0.scroll.top >= 590 && Math.abs((k0.title.y - k1.title.y) - (k1.scroll.top - k0.scroll.top)) <= 1 && JSON.stringify(k1.rail) === JSON.stringify(k0.rail) && JSON.stringify(k1.back) === JSON.stringify(k0.back) && k1.shell.top === 0,
        { scrolled: k1.scroll.top, title: [k0.title.y, k1.title.y], rail: [k0.rail, k1.rail], strip: [k0.back, k1.back], shellTop: k1.shell.top });
      /* The press is dispatched IN the page: Playwright would scroll the button into view first, and the claim is about the repaint. */
      await page.evaluate(() => { document.getElementById('tb-addtype').value = 'fixed_text'; document.getElementById('tb-addblock').click(); });
      await pause(400);
      const k2 = await page.evaluate(SCR);
      check('13e · a repaint (Add block) keeps the reader\'s place in the paper',
        Math.abs(k2.scroll.top - k1.scroll.top) <= 2 && k2.editables === k1.editables + 1, { before: k1.scroll.top, after: k2.scroll.top, editables: [k1.editables, k2.editables] });
      await page.screenshot({ path: path.join(OUT, '07-scroll.png') });
      /* Save (the strip is on screen, so the press needs no scroll), then Back: the page that grows gets its channel back. */
      await page.click('#tb-save'); await pause(500);
      await page.click('#tb-back'); await pause(900);
      const k3 = await page.evaluate(() => { const sc = document.getElementById('content-scroll'); return { fixed: sc.classList.contains('view-fixed'), gutter: getComputedStyle(sc).scrollbarGutter, builder: !!document.getElementById('tb-page'), detail: !!document.getElementById('tpllib-back') }; });
      check('13f · Back lands on the template\'s page with the channel reserved again', !k3.builder && k3.detail && !k3.fixed && k3.gutter === 'stable', k3);
    }

    check('11 · the page threw nothing', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('harness', false, String(e && e.stack || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { bad.forEach(b => console.log('  FAIL ' + b.name)); process.exit(1); }
})();
