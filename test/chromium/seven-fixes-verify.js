/* seven-fixes-verify — the pixel halves of Young's 20 Sep 2026 screenshots
   ========================================================================
   f341 pins the declarations and the readings. THIS file measures what only a
   rendered page knows: whether a button is PAINTED where it was asked for,
   whether a mark is drawn at all, whether a press does anything, and whether
   the strip that gained an arrow still holds its height.

   THREE OF THE SEVEN FAULTS WERE INVISIBLE IN THE SOURCE and could only ever
   have been caught here:
     · "Go to the wording" read one page's canvas by name and answered a press
       with nothing on the other one;
     · the chat door's listener was bound to a node the next render throws
       away, which reads perfectly in the source;
     · a green tick over zero work.

   EVERY DRIVEN HALF IS GUARDED, so a build WITHOUT the feature REPORTS its
   failures rather than throwing on the third check and proving nothing about
   the rest. Run against the parent before it is trusted.

   MEASURED AT THE PARENT (94f6a91): the file prints
     · `chat in acts row: false` and the door still in #top-header;
     · the shield drawn, three squares where two are asked for;
     · `badges: 0` on every button that had something to count;
     · `arrows: 0` and no tile pressable;
     · `moved: 0px` from a real press of Go to the wording on the Negotiate
       page — the reported fault, reproduced.
   The named CONTROLS pass on both sides and say so on the line.

   Run: node test/chromium/seven-fixes-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'seven');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

/* Two changes on one contract, filed through the funnel's own doors, so the
   Negotiate page has something real to draw and the scan has real wording. */
const SEED = async () => {
  const live = state.contracts.filter(x => x.status !== 'Signed' && x.status !== 'Declined').slice(0, 2);
  for (let i = 0; i < live.length; i++){
    const c = live[i];
    negoInit(c);
    const cl = negoClauseList(c);
    if (cl[0]) await negoEditClause(c, cl[0].clauseId,
      cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500)),
      { author: 'Amina Otieno', side: 'owner', why: 'Aligns with this year’s volumes.' });
  }
  return live[0].id;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2600);
    const cid = await drive(page, SEED, undefined, null);
    await pause(1600);
    check('0a the stage is real — a contract with a live negotiation', !!cid, String(cid));

    /* ═══════════ 1 · THE CHAT DOOR IS IN THE CONTRACT'S OWN ROW ═══════════ */
    await drive(page, id => openRedlineWorkbench(id), cid, null);
    await pause(2200);
    await page.screenshot({ path: path.join(OUT, '01-negotiate-head.png') });

    const head = await drive(page, () => {
      const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          on: r.width > 0 && r.height > 0 }; };
      const chat = document.querySelector('#hdr-chat');
      const more = document.querySelector('#ws-more');
      const acts = document.querySelector('#ws-head .room-acts');
      return {
        chat: box(chat), more: box(more),
        inActs: !!(chat && acts && acts.contains(chat)),
        inShell: !!(chat && chat.closest('#top-header')),
        shells: document.querySelectorAll('#top-header #hdr-chat').length,
        doors: document.querySelectorAll('#hdr-chat').length,
        checks: document.querySelectorAll('#ws-head .room-check:not(.room-focus)').length,
        shield: document.querySelectorAll('[data-room-check="playbook"]').length,
        kinds: [...document.querySelectorAll('[data-room-check]')].map(b => b.getAttribute('data-room-check')),
      };
    }, undefined, {});

    check('1a the chat door is painted inside the contract’s acts row',
      !!head.inActs && !!(head.chat && head.chat.on),
      `inActs ${head.inActs} · box ${head.chat ? head.chat.w + 'x' + head.chat.h : 'none'}`);
    check('1b and it is gone from the shell bar — moved, not copied',
      head.shells === 0 && head.doors === 1,
      `in #top-header: ${head.shells} · doors on the page: ${head.doors}`);
    check('1c it sits immediately after More, left to right',
      !!(head.chat && head.more) && head.chat.x > head.more.x,
      head.chat && head.more ? `More x${head.more.x} · chat x${head.chat.x}` : 'missing');
    check('1d on the same row as More, not a line below',
      !!(head.chat && head.more) && Math.abs(head.chat.y - head.more.y) <= 6,
      head.chat && head.more ? `More y${head.more.y} · chat y${head.chat.y}` : 'missing');

    /* ═══════════ 2 · THE SHIELD IS GONE ═══════════ */
    check('2a no playbook shield is drawn', head.shield === 0, `found ${head.shield}`);
    check('2b two checks where there were three',
      JSON.stringify(head.kinds) === JSON.stringify(['oblig', 'risk']),
      JSON.stringify(head.kinds));

    /* THE READING KEEPS A DOOR — the More menu's row, opened for real. */
    await drive(page, () => document.querySelector('#ws-more').click(), undefined, null);
    await pause(500);
    await page.screenshot({ path: path.join(OUT, '02-more-menu.png') });
    const menu = await drive(page, () => {
      const row = document.querySelector('#ws-more-menu [data-rl-pbreview]');
      if (!row) return { on: false };
      const r = row.getBoundingClientRect();
      return { on: r.width > 0 && r.height > 0, text: (row.textContent || '').trim().slice(0, 40),
        glyphs: ((row.textContent || '').match(/✦/g) || []).length };
    }, undefined, { on: false });
    check('2c and the playbook row is painted in the More menu', !!menu.on, menu.text || 'not drawn');
    check('2d with ONE glyph, not the two the key and the markup drew between them',
      menu.glyphs === 1, `✦ × ${menu.glyphs}`);
    await drive(page, () => document.querySelector('#ws-more').click(), undefined, null);
    await pause(300);

    /* ═══════════ 3 · A COUNT ON THE CONTROL ═══════════
       The numbers are made REAL first — a badge claim over a contract with
       nothing to count would pass on an empty page. */
    await drive(page, async id => {
      const c = getContract(id);
      c.obligations = [
        { id: 'ob-late', desc: 'Quarterly volume report', due: '2026-01-05', owner: 'us' },
        { id: 'ob-late2', desc: 'Insurance certificate', due: '2026-02-05', owner: 'us' },
      ];
      runScan(c);
      await persist(c);
    }, cid, null);
    await pause(400);
    /* RE-OPEN THE PAGE THAT DRAWS THE HEAD, and nothing else. A renderWorkspace
       in between navigates to the contract room, where roomChecksHtml is not
       drawn at all (`backC` is the workbench's own flag) — so the read landed
       on a page with no buttons on it and every badge claim reported "no
       button" while the badges were perfectly fine. */
    await drive(page, id => openRedlineWorkbench(id), cid, null);
    await pause(1800);
    await page.screenshot({ path: path.join(OUT, '03-badges.png') });

    const badges = await drive(page, () => {
      const read = sel => {
        const b = document.querySelector(sel); if (!b) return null;
        const m = b.querySelector('.room-badge');
        if (!m) return { drawn: false };
        const r = m.getBoundingClientRect(); const cs = getComputedStyle(m);
        return { drawn: r.width > 0 && r.height > 0 && cs.display !== 'none',
          text: (m.textContent || '').trim(), bad: m.classList.contains('is-bad'),
          bg: cs.backgroundColor };
      };
      return { oblig: read('[data-room-check="oblig"]'), risk: read('[data-room-check="risk"]') };
    }, undefined, {});

    check('3a the obligations button carries its number, painted',
      !!(badges.oblig && badges.oblig.drawn && /^\d/.test(badges.oblig.text || '')),
      badges.oblig ? `"${badges.oblig.text}" drawn ${badges.oblig.drawn}` : 'no button');
    check('3b and two overdue reads RUBY, not amber',
      !!(badges.oblig && badges.oblig.bad),
      badges.oblig ? `is-bad ${badges.oblig.bad} · ${badges.oblig.bg}` : 'no button');
    check('3c the risk button carries its own count',
      !!(badges.risk && badges.risk.drawn),
      badges.risk ? `"${badges.risk.text}"` : 'no button');

    /* SILENT AT ZERO — the half that stops it becoming furniture. */
    const quiet = await drive(page, async id => {
      const c = getContract(id);
      c.obligations = []; await persist(c);
      if (window.renderWorkspace) renderWorkspace(c);
      await new Promise(r => setTimeout(r, 500));
      const b = document.querySelector('[data-room-check="oblig"] .room-badge');
      if (!b) return { none: true };
      const cs = getComputedStyle(b);
      return { none: cs.display === 'none' || b.getBoundingClientRect().width === 0 };
    }, cid, { none: false });
    check('3d and nothing at all is drawn at zero', !!quiet.none,
      'a mark that is always there is one people learn to ignore');

    /* ═══════════ 4 · "GO TO THE WORDING" ON THE NEGOTIATE PAGE ═══════════
       THE REPORTED FAULT, REPRODUCED AND THEN MEASURED. The press is a real
       press on the real panel, and what is measured is whether the PAPER
       MOVED — a handler that returns false silently looks identical. */
    await drive(page, id => openRedlineWorkbench(id), cid, null);
    await pause(1600);
    const goto = await drive(page, async () => {
      const c = getContract(redlineHeldId());
      /* ---- A FINDING WITH WORDING IN IT, STAGED THROUGH THE PRODUCT'S OWN
         WRITER ---- scanRules only quotes the document where the contract
         carries a WORKING TEXT; a drafted template that has never been edited
         yields findings about absences ("no effective date"), which quote
         nothing, and a walk asked to find nothing finds nothing for an honest
         reason. negoCommitBody is how the product itself puts a contract into
         that state, which is the state scanRules' own note describes. */
      if (window.negoCommitBody && c.redlineText == null){
        try { negoCommitBody(c, docBody(c)); } catch (_) {}
      }
      runScan(c);
      await new Promise(r => setTimeout(r, 200));
      if (window.renderRedline) renderRedline();
      await new Promise(r => setTimeout(r, 900));
      /* A FINDING THAT CARRIES WORDING. Not every rule quotes the document —
         some are about an absence — and a walk asked to find nothing finds
         nothing for an honest reason. The first build took findings[0] and
         measured a rule with no quote on it. */
      const all = openFindings(c) || [];
      const f = all.find(x => findingQuote(x)) || all[0];
      if (!f) return { staged: false };
      const pane = document.querySelector('#rl-doc .nego-scroll') || document.querySelector('#rl-doc');
      const root = document.getElementById('rl-doc');
      if (!root) return { staged: false, why: 'no rl-doc' };
      const scroller = root.closest('.nego-scroll') || root.querySelector('.nego-scroll') || pane;
      const before = scroller ? scroller.scrollTop : -1;
      if (scroller) scroller.scrollTop = 0;
      await new Promise(r => setTimeout(r, 120));
      const from = scroller ? scroller.scrollTop : -1;
      /* WHAT WAS BROKEN IS THE LOCATING, so that is what is measured. At the
         parent scrollToQuote read `#doc-canvas`, found no root on this page and
         answered false for every finding — the walk then fell through every
         anchor selector, also scoped to that element, and scanGoTo returned
         false in silence. Whether the sheet then SCROLLS depends on where in
         the document the wording happens to sit, which is not a claim about
         this fix; the landing and the marks are. */
      const q = findingQuote(f);
      const located = q ? scrollToQuote(q) : null;
      await new Promise(r => setTimeout(r, 300));
      const qMarks = root.querySelectorAll('.anchor-flash').length;
      clearQuoteMarks();
      const ok = scanGoTo(c, f.id);
      await new Promise(r => setTimeout(r, 900));
      const to = scroller ? scroller.scrollTop : -1;
      const marks = root.querySelectorAll('.anchor-flash').length;
      const inSheet = !!(window.scanCanvas && scanCanvas() && scanCanvas().id === 'rl-doc');
      return { staged: true, ok, from, to, moved: Math.abs(to - from), marks, before,
        located, qMarks, inSheet, quote: (q || '').slice(0, 40) };
    }, undefined, { staged: false });

    check('4a the finding is staged on the Negotiate page', !!goto.staged,
      goto.why || 'a real scan finding on a real sheet');
    check('4b the walk answers TRUE where it used to answer nothing',
      goto.staged && goto.ok === true, `returned ${goto.ok}`);
    check('4c the canvas it walks IS the Negotiate page\u2019s sheet',
      goto.staged && goto.inSheet === true,
      `scanCanvas() -> ${goto.inSheet ? '#rl-doc' : 'something else'}`);
    check('4d the finding\u2019s own wording is LOCATED in that sheet and marked',
      goto.staged && goto.located === true && goto.qMarks > 0,
      `located ${goto.located} · marks ${goto.qMarks} · "${goto.quote}\u2026"`);
    check('4e and the press leaves the reader somewhere, never silently nowhere',
      goto.staged && (goto.marks > 0 || goto.moved > 4),
      `moved ${goto.moved}px · marks ${goto.marks}`);

    /* ═══════════ 5 · THE ARROW, AND THE STRIP'S HEIGHT ═══════════ */
    const strip = await drive(page, async id => {
      const c = getContract(id);
      /* A reading of each kind, so both doors are drawn and the third tile is
         deliberately left without one. */
      c.triage = { at: new Date().toISOString(), steps: {
        brief: { ok: true, line: 'A three-year supply agreement.' },
        playbook: { ok: true, cats: ['Payment terms'], dev: 1, miss: 0 },
        oblig: { ok: true, found: [{ desc: 'Quarterly volume report' }] },
        fill: { ok: true, filled: [], left: 0 },
      } };
      c._brief = { at: new Date().toISOString(), overview: 'A three-year supply agreement.' };
      openWorkspace(id); roomGoTab(c, 'terms');
      await new Promise(r => setTimeout(r, 900));
      const tiles = [...document.querySelectorAll('.kt-tri-tile')];
      const h = tiles.map(t => Math.round(t.getBoundingClientRect().height));
      return {
        n: tiles.length,
        arrows: document.querySelectorAll('.kt-tri-go').length,
        doors: document.querySelectorAll('[data-kt-tri-go]').length,
        buttons: tiles.filter(t => t.tagName === 'BUTTON').length,
        heights: h,
        spread: h.length ? Math.max(...h) - Math.min(...h) : -1,
        bodies: document.querySelectorAll('.kt-tri-td').length,
        keys: [...document.querySelectorAll('[data-kt-tri-go]')].map(b => b.getAttribute('data-kt-tri-go')),
      };
    }, cid, {});
    await page.screenshot({ path: path.join(OUT, '04-arrival-strip.png') });

    check('5a the strip is drawn with its tiles', (strip.n || 0) >= 4, `${strip.n} tiles`);
    check('5b exactly two arrows, on the two Young named',
      strip.arrows === 2 && JSON.stringify(strip.keys) === JSON.stringify(['brief', 'oblig']),
      `${strip.arrows} arrows on ${JSON.stringify(strip.keys)}`);
    check('5c a tile with a door is a real button, a tile without one is not',
      strip.buttons === 2, `${strip.buttons} of ${strip.n} tiles are buttons`);
    check('5d every tile still draws exactly one body',
      strip.bodies === strip.n, `${strip.bodies} bodies for ${strip.n} tiles`);
    check('5e AND THE STRIP KEEPS ITS FIXED HEIGHT — the 17 Sep ruling',
      strip.spread === 0, `tallest minus shortest: ${strip.spread}px · ${JSON.stringify(strip.heights)}`);

    /* THE PRESS GOES SOMEWHERE — an arrow that leads nowhere is the dead
       control this whole day is about. */
    const pressed = await drive(page, async () => {
      const b = document.querySelector('[data-kt-tri-go="oblig"]');
      if (!b) return { pressed: false };
      b.click();
      await new Promise(r => setTimeout(r, 900));
      return { pressed: true, tab: (window.roomCurrentTab ? roomCurrentTab() : null) };
    }, undefined, { pressed: false });
    check('5f pressing the obligations tile lands on the obligations tab',
      pressed.pressed && pressed.tab === 'oblig', `tab now ${pressed.tab}`);

    /* AND THE BRIEF TILE PULLS THE BRIEF PANEL (Young reported it 20 Sep 2026:
       "Brief Witten is supposed to pull the brief side Panel but it does not").
       It scrolled to the card ABOUT the brief instead, so a reader landed
       beside a heading and still had to find its Open button. Measured as a
       PAINTED PANEL, never as a scroll position. */
    const briefPressed = await drive(page, async () => {
      const b = document.querySelector('[data-kt-tri-go="brief"]');
      if (!b) return { pressed: false };
      b.click();
      await new Promise(r => setTimeout(r, 900));
      const panel = document.getElementById('brief-section');
      const host = panel && panel.closest('[class*="panel"],aside,[role="dialog"]');
      const r = (host || panel) ? (host || panel).getBoundingClientRect() : null;
      return { pressed: true, there: !!panel,
        drawn: !!(r && r.width > 2 && r.height > 2), w: r ? Math.round(r.width) : 0 };
    }, undefined, { pressed: false });
    check('5g the brief tile was there to press', briefPressed.pressed,
      briefPressed.pressed ? 'yes' : 'no brief door');
    check('5h pressing it PULLS THE BRIEF PANEL, not a scroll to its card',
      briefPressed.pressed && briefPressed.there && briefPressed.drawn,
      briefPressed.pressed ? ('panel ' + briefPressed.there + ' · drawn ' + briefPressed.drawn
        + ' · ' + briefPressed.w + 'px') : 'not driven');

    /* ═══════════ 6 · THE FILL TILE TELLS THE TRUTH ═══════════
       The stage IS the fault: a contract in negotiation, where the reading
       deliberately does not look, and the tile used to draw a green tick. */
    const fill = await drive(page, async id => {
      const c = getContract(id);
      /* THE STEP AS THE RUNNER NOW WRITES IT. The first build of this check
         staged `{ok:true, filled:[], left:0}` with no reason — which is a
         record the runner cannot produce, because a contract with open blanks
         reports them in `left`. What it measured was therefore a case that
         cannot happen, and it reported the tile as wrong when the tile was
         right. Staged as the real thing: a contract in negotiation, where the
         reading deliberately does not look. */
      c.triage.steps.fill = { ok: true, filled: [], left: 0, none: 'nego' };
      openWorkspace(id); roomGoTab(c, 'terms');
      await new Promise(r => setTimeout(r, 800));
      const tiles = [...document.querySelectorAll('.kt-tri-tile')];
      const t = tiles.find(x => /field/i.test(x.textContent || ''));
      if (!t) return { found: false };
      const chip = t.querySelector('.kt-tri-chip');
      return { found: true,
        head: (t.querySelector('.kt-tri-hw, .kt-tri-th') || {}).textContent.replace(/\s+/g, ' ').trim(),
        mark: (chip ? chip.textContent : '').trim(),
        tone: chip ? [...chip.classList].filter(k => k.startsWith('is-')).join(' ') : '',
        body: (t.querySelector('.kt-tri-td') || {}).textContent.replace(/\s+/g, ' ').trim() };
    }, cid, { found: false });

    check('6a the fill tile is found', !!fill.found, fill.head || '');
    check('6b it does NOT draw a tick over zero work',
      fill.found && !/✓|✔/.test(fill.mark || '') && fill.mark !== '✓',
      `mark "${fill.mark}"`);
    check('6c it reads steel, not green — nothing wrong, nothing achieved',
      fill.found && /is-none/.test(fill.tone || ''), `tone "${fill.tone}"`);
    check('6d and it SAYS why there was nothing to fill',
      fill.found && (fill.body || '').length > 10, `"${(fill.body || '').slice(0, 60)}"`);

    /* AND THE LIVE FALLBACK, for every record on file written before the run
       started stamping a reason. A note is durable and the contract is not —
       the brief's own remedy, for the brief's own reason. */
    const older = await drive(page, async id => {
      const c = getContract(id);
      c.triage.steps.fill = { ok: true, filled: [], left: 0 };   // no reason, as older notes have
      /* ITEM 7'S OWN CASE: a company-standard contract with a field STILL
         OPEN. Its own right-hand panel counts that field; before this the
         reading looked at nothing, found nothing, and the tile reported
         silence as success. With it, the tile stops claiming anything.
         (Every field answered reads 'none', which is also right and is what
         the first build measured — a true sentence about a different case.) */
      c.templateForm = { fields: [{ fieldKey: 'a', required: true, label: 'Signer name' }],
        values: { a: '' } };
      openWorkspace(id); roomGoTab(c, 'terms');
      await new Promise(r => setTimeout(r, 800));
      const t = [...document.querySelectorAll('.kt-tri-tile')].find(x => /field/i.test(x.textContent || ''));
      if (!t) return { found: false };
      const chip = t.querySelector('.kt-tri-chip');
      return { found: true, mark: (chip ? chip.textContent : '').trim(),
        head: (t.querySelector('.kt-tri-hw') || {}).textContent.replace(/\s+/g, ' ').trim(),
        tone: chip ? [...chip.classList].filter(k => k.startsWith('is-')).join(' ') : '',
        body: (t.querySelector('.kt-tri-td') || {}).textContent.replace(/\s+/g, ' ').trim() };
    }, cid, { found: false });
    check('6e an older note with no reason is answered by a LIVE reading',
      older.found && /is-none/.test(older.tone || '') && !/\u2713/.test(older.mark || ''),
      `mark "${older.mark}" · tone "${older.tone}"`);
    check('6f and it names the panel that DOES fill it \u2014 item 7',
      older.found && /panel/i.test(older.body || '') && /panel/i.test(older.head || ''),
      `head "${older.head}" · "${(older.body || '').slice(0, 50)}"`);

    /* ═══════════ 7 · THE DATE BOXES ═══════════
       A NAMED CONTROL in Chromium, which needs none of the new declarations
       and is unchanged by all of them — the point is that they cost nothing
       here while being what a WebKit box needs. The overflow itself cannot be
       reproduced in this engine and is reasoned from the screenshot. */
    const dates = await drive(page, async () => {
      if (!window.openContractEssentials) return { open: false };
      openContractEssentials({ title: 'Stage', createLabel: 'Create draft', onCreate: () => {} });
      await new Promise(r => setTimeout(r, 700));
      const grid = document.querySelector('.field-grid');
      if (!grid) return { open: false };
      const cells = [...grid.children].map(l => Math.round(l.getBoundingClientRect().width));
      const box = sel => { const el = grid.querySelector(sel); if (!el) return null;
        const r = el.getBoundingClientRect(); return { w: Math.round(r.width), x: Math.round(r.x) }; };
      const anyDate = box('input[type="date"]');
      const anyText = box('input[type="text"]');
      const gridR = grid.getBoundingClientRect();
      const over = [...grid.querySelectorAll('input,select')]
        .filter(el => el.getBoundingClientRect().right > gridR.right + 1).length;
      return { open: true, cells, anyDate, anyText, over,
        spread: cells.length ? Math.max(...cells) - Math.min(...cells) : -1 };
    }, undefined, { open: false });

    check('7a the essentials form opens with its two-column grid', !!dates.open,
      dates.open ? `${dates.cells.length} cells` : 'not drawn');
    check('7b no control paints past the grid’s own right edge (CONTROL in Chromium)',
      dates.open && dates.over === 0, `${dates.over} overflowing`);
    check('7c a date box is the same width as a text box beside it',
      dates.open && dates.anyDate && dates.anyText
        && Math.abs(dates.anyDate.w - dates.anyText.w) <= 2,
      dates.anyDate && dates.anyText ? `date ${dates.anyDate.w} · text ${dates.anyText.w}` : 'missing');
    await page.screenshot({ path: path.join(OUT, '05-essentials.png') });

    check('8 no page error fired throughout (CONTROL)', errors.length === 0,
      errors.slice(0, 2).join(' | ') || 'clean');

  } finally {
    await browser.close();
    await h.stop();
  }

  if (blocked.length) console.log('\nblocked:', blocked.slice(0, 6).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
