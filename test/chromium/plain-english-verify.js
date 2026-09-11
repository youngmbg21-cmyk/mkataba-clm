/* Chromium verification: THE PLAIN-ENGLISH LAYER (idea 7).
   ============================================================
   Young ruled it off a rendered mock, 9 Sep 2026: the switch goes in the
   slot they drew on the tab row, no ring, Contract View first and lit at
   rest, the Open Negotiate door matched in height to its neighbours — and
   the readings have to be clear enough for somebody who finds legal
   verbiage frustrating.

   WHY A BROWSER FILE, AND IT IS NOT A FORMALITY HERE. f277 pins the
   reading, the route, the transport and the words. FIVE claims can be
   asked NOWHERE else, and the first of them is why this file exists at
   all:

     · test/world.js stands a ONE-LINE docBody in for the real one, so the
       node stage can only prove the RELATION — that the clause list is
       clauseSegment's reading of whatever the builder returns. That the
       REAL builder yields real clauses, and that a note lands beside the
       clause it is about, is only true where the real app runs;
     · "the highlighted area is not deleted" is Young's own worry, and it
       is a claim about PIXELS: the three cards must be on screen before,
       covered after, and back with their content after one more press;
     · the paper may not narrow by a pixel — a measurement, before and
       after;
     · ONE HEIGHT across the slot is a measurement too, and the whole of
       the second ask;
     · and the two columns scroll as one, which is a claim about what a
       real scroller does to a transform.

   Run: node test/chromium/plain-english-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'plain-english');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* On screen, not merely in the markup — f180's rule. */
const visible = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const st = getComputedStyle(n);
    if (st.display === 'none' || st.visibility === 'hidden' || n.hidden) return false;
  }
  return true;
}, sel);

/* EVERY DRIVEN HALF IS GUARDED, so a build WITHOUT this feature REPORTS its
   failures rather than timing out on the fourth check and proving nothing
   about the twenty after it. This file is run against the parent commit
   before it is trusted. */
async function press(page, sel, what) {
  const there = await page.$(sel);
  if (!there) { check(false, what + ' — the control is not on the page', sel); return false; }
  await page.click(sel);
  return true;
}
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

const tool = readings => [{ type: 'tool_use', id: 'tu_read', name: 'clause_readings', input: { readings } }];

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let calls = 0;
  page.on('request', r => { if (/\/api\/ai\/readings/.test(r.url())) calls++; });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);

    /* MK-A2 is a template contract with no stored body, so the paper is what
       the REAL docBody builds — the thing the node stage cannot supply. */
    await drive(page, () => { openWorkspace('MK-A2'); }, undefined, null);
    await pause(1600);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(900);

    /* ============ 0 · THE CONTROL — the real builder yields real clauses ============ */
    const cl = await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      const list = (typeof docReadClauses === 'function') ? docReadClauses(c) : [];
      return { n: list.length, heads: list.slice(0, 4).map(x => x.heading) };
    }, undefined, { n: 0, heads: [] });
    check(cl.n >= 3, '0a the REAL document builder yields real clauses — what world.js cannot',
      `${cl.n}: ${cl.heads.join(' / ')}`);
    const onPage = await drive(page, () => Array.from(
      document.querySelectorAll('#doc-canvas h1,#doc-canvas h2,#doc-canvas h3,#doc-canvas h4')).length,
      undefined, 0);
    check(onPage >= 3, '0b and those headings are really painted on the sheet', onPage);

    /* ============ 1 · THE SWITCH, IN THE SLOT YOUNG DREW ============ */
    check(await visible(page, '.doc-read-seg'),
      '1a the switch is visible pixels on the tab row, not markup behind something');
    const order = await drive(page, () => {
      const end = document.getElementById('ws-tabrow-end');
      if (!end) return null;
      const kids = Array.from(end.children).map(el => el.className || el.id || el.tagName);
      const seg = end.querySelector('.doc-read-seg');
      const step = end.querySelector('.rl-type-step');
      const door = end.querySelector('#ws-to-nego');
      const pos = el => el ? Array.from(end.querySelectorAll('*')).indexOf(el) : -1;
      return { kids,
        segX: seg ? Math.round(seg.getBoundingClientRect().left) : -1,
        stepX: step ? Math.round(step.getBoundingClientRect().left) : -1,
        doorX: door ? Math.round(door.getBoundingClientRect().left) : -1,
        p: [pos(seg), pos(step), pos(door)] };
    }, undefined, null);
    check(!!order && order.segX >= 0 && order.stepX > order.segX,
      '1b it sits BEFORE the text-size stepper — the slot in the screenshot',
      order && `switch ${order.segX} · stepper ${order.stepX} · door ${order.doorX}`);
    check(!!order && order.doorX > order.stepX,
      '1c and the negotiation door still reads last on the row', order && order.doorX);

    /* ONE HEIGHT, MEASURED AS PAINT — the second ask, and the only place it can
       be answered: a rule that lost a cascade fight looks perfectly correct in
       the stylesheet. */
    const hts = await drive(page, () => {
      const g = s => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().height) : -1; };
      return { seg: g('#ws-tabrow-end .doc-read-seg'), step: g('#ws-tabrow-end .rl-type-step'), door: g('#ws-to-nego') };
    }, undefined, { seg: -1, step: -2, door: -3 });
    check(hts.seg > 0 && hts.seg === hts.step && hts.step === hts.door,
      '1d every control in the slot is ONE height', JSON.stringify(hts));

    /* NO RING. The mock's red box was annotation; the shipped control carries a
       hairline round the pair and no outline of its own. */
    const ring = await drive(page, () => {
      const seg = document.querySelector('.doc-read-seg');
      if (!seg) return null;
      const s = getComputedStyle(seg);
      const b = Array.from(seg.querySelectorAll('button')).map(x => {
        const cs = getComputedStyle(x);
        return { bw: cs.borderTopWidth, ow: cs.outlineStyle === 'none' ? '0px' : cs.outlineWidth,
          bg: cs.backgroundColor, fg: cs.color, pressed: x.getAttribute('aria-pressed'),
          text: (x.textContent || '').trim() };
      });
      return { segBorder: s.borderTopWidth, segOutline: s.outlineStyle, b };
    }, undefined, null);
    check(!!ring && ring.b.length === 2 && ring.b.every(x => x.bw === '0px' && x.ow === '0px'),
      '1e no ring round either button — the buttons draw no border and no outline',
      ring && JSON.stringify(ring.b.map(x => x.bw + '/' + x.ow)));
    check(!!ring && ring.b[0].text === 'Contract View' && ring.b[1].text === 'Plain English',
      '1f Contract View first, Plain English second — Young\'s own order',
      ring && ring.b.map(x => x.text).join(' | '));
    check(!!ring && ring.b[0].pressed === 'true' && ring.b[1].pressed === 'false',
      '1g and Contract View is the one lit at rest', ring && ring.b.map(x => x.pressed).join('/'));
    /* The lit half is FILLED and the resting one is not — a relation, so a
       later palette pass costs no edit here. */
    const trans = s => /rgba\(0, 0, 0, 0\)|transparent/.test(s);
    check(!!ring && !trans(ring.b[0].bg) && trans(ring.b[1].bg),
      '1h the lit half carries a fill and the resting half carries none',
      ring && ring.b.map(x => x.bg).join(' | '));
    await page.screenshot({ path: path.join(OUT, '01-switch.png') });

    /* THE ROW READS AS ONE ROW WITH THE ACTS ABOVE IT (Young, 10 Sep 2026:
       "the buttons at the bottom should be shorter and have the same height as
       the buttons above them ... also not in bold like the ones above ... Only
       the shaded buttons should bold"). MEASURED ON BOTH ROWS AND COMPARED —
       never against a typed number, so a later type retune costs this nothing
       and it still fails the day the two rows come apart. */
    const rung = await drive(page, () => {
      const box = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return { h: Math.round(r.height), size: cs.fontSize, w: cs.fontWeight }; };
      /* HEIGHT IS ASKED OF THE CONTROL, not of a button inside it: the switch
         is a bordered group whose two halves are 26 inside its own 28, and it
         is the group that has to line up with an act above. Visible ones only
         — a head row can hold an act this contract does not draw. */
      const head = Array.from(document.querySelectorAll('#ws-head .room-acts button'), box)
        .filter(x => x.h > 0);
      const slot = Array.from(document.querySelectorAll('#ws-tabrow-end > *'), box)
        .filter(x => x.h > 0);
      const seg = Array.from(document.querySelectorAll('.doc-read-seg button'),
        b => ({ on: b.getAttribute('aria-pressed') === 'true', w: getComputedStyle(b).fontWeight }));
      const text = Array.from(document.querySelectorAll(
        '#ws-tabrow-end .doc-read-seg button, #ws-tabrow-end .ui-btn, #ws-tabrow-end .rl-type-step .rl-type-out'), box);
      return { head, slot, seg, text };
    }, undefined, { head: [], slot: [], seg: [], text: [] });
    const uniq = (a, k) => Array.from(new Set(a.map(x => x[k])));
    check(rung.head.length > 0 && rung.slot.length > 0
      && uniq(rung.head, 'h').length === 1 && uniq(rung.slot, 'h').length === 1
      && rung.head[0].h === rung.slot[0].h,
      '1i the slot is the same height as the row of acts above it',
      `head ${uniq(rung.head, 'h').join('/')} · slot ${uniq(rung.slot, 'h').join('/')}`);
    check(rung.head.length > 0 && rung.text.length > 0
      && uniq(rung.head, 'size').length === 1
      && uniq(rung.text, 'size').length === 1 && rung.head[0].size === rung.text[0].size,
      '1j and every word in it reads at the same size',
      `head ${uniq(rung.head, 'size').join('/')} · slot ${uniq(rung.text, 'size').join('/')}`);
    check(rung.seg.length === 2 && rung.seg.some(x => !x.on) && rung.head.length > 0
      && rung.seg.filter(x => !x.on).every(x => x.w === rung.head[0].w),
      '1k the resting half is not bold, exactly like the acts above',
      `resting ${rung.seg.filter(x => !x.on).map(x => x.w).join('/')} · acts ${rung.head[0] && rung.head[0].w}`);
    check(rung.seg.length === 2 && rung.seg.some(x => x.on) && rung.head.length > 0
      && rung.seg.filter(x => x.on).every(x => Number(x.w) > Number(rung.head[0].w)),
      '1l and only the shaded half is',
      rung.seg.map(x => (x.on ? 'lit ' : 'resting ') + x.w).join(' · '));

    /* ============ 2 · THE COLUMN IS NOT DELETED — Young's own worry ============ */
    const cards = () => drive(page, () => {
      const col = document.querySelector('[data-doc-col="docs"]');
      const right = document.getElementById('doc-right');
      const vis = el => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          const st = getComputedStyle(n);
          if (st.display === 'none' || st.visibility === 'hidden' || n.hidden) return false;
        }
        return true;
      };
      const paper = document.querySelector('#doc-canvas');
      return {
        col: vis(col), checks: vis(document.getElementById('checks-section')),
        rightVis: right ? getComputedStyle(right).visibility : null,
        cards: col ? col.querySelectorAll('.card, [id$="-section"]').length : 0,
        text: (col ? col.textContent || '' : '').replace(/\s+/g, ' ').trim().length,
        paperW: paper ? Math.round(paper.getBoundingClientRect().width) : -1,
        paperX: paper ? Math.round(paper.getBoundingClientRect().left) : -1,
        layer: !!document.getElementById('doc-read') && !document.getElementById('doc-read').hidden,
        notes: document.querySelectorAll('.doc-read-note').length,
      };
    }, undefined, {});
    const before = await cards();
    check(before.col === true && before.text > 100,
      '2a with Contract View on, the right-hand column is on screen with its cards',
      `${before.cards} sections · ${before.text} chars`);
    check(before.layer === false, '2b and no reading layer is drawn', before.layer);

    /* ============ 3 · PRESSING PLAIN ENGLISH ============ */
    ai.reset();
    ai.script(tool(cl.heads.map((_, i) => ({ i, plain: `PLAIN ${i}: you have to do the thing this clause says, by the date it names.` }))
      .concat(cl.n > cl.heads.length
        ? Array.from({ length: cl.n - cl.heads.length }, (_, k) => ({ i: cl.heads.length + k, plain: `PLAIN ${cl.heads.length + k}: what this means for you.` }))
        : [])));
    const pressed = await press(page, '.doc-read-seg button[data-doc-read="1"]', '3 Plain English');
    await pause(3000);
    const after = await cards();
    check(pressed && after.notes > 0,
      '3a the readings really draw, one note per clause the answer named', after.notes);
    check(after.rightVis === 'hidden' && after.layer === true,
      '3b the cards are COVERED, never rebuilt — they keep their place and their scroll',
      `${after.rightVis} · layer ${after.layer}`);
    /* THE PAPER MAY NOT NARROW BY A PIXEL. It sits in the grid's first track and
       the layer takes the second; measured either side of the swap. */
    check(after.paperW === before.paperW && after.paperX === before.paperX,
      '3c and the contract itself does not move or narrow by a pixel',
      `${before.paperX}/${before.paperW} → ${after.paperX}/${after.paperW}`);
    check(calls === 1, '3d it was read once, on the press', calls);
    await page.screenshot({ path: path.join(OUT, '02-plain.png') });

    /* A NOTE SITS BESIDE ITS OWN CLAUSE. The one thing this feature may never
       get wrong, and it is a GEOMETRY on a rendered page. */
    /* EVERY NOTE IS MEASURED AGAINST THE HEADING ITS OWN ITEM NAMES, found in
       the sheet by TEXT rather than by asking the reading where it put things —
       otherwise the check is the pairing agreeing with itself. */
    const beside = await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      const items = docReadItems(c);
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      const canvas = document.getElementById('doc-canvas');
      const norm = t => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const heads = Array.from(canvas.querySelectorAll('h1,h2,h3,h4'));
      const rows = notes.map((el, n) => {
        const it = items[n];
        const hd = heads.find(h => norm(h.textContent) === norm(it && it.heading));
        return { heading: it && it.heading,
          gap: hd ? Math.round(el.getBoundingClientRect().top - hd.getBoundingClientRect().top) : null,
          left: Math.round(el.getBoundingClientRect().left) };
      });
      return { rows, paperRight: Math.round(canvas.getBoundingClientRect().right) };
    }, undefined, null);
    check(!!beside && beside.rows.length >= 3
      && beside.rows.every(r => r.gap !== null && Math.abs(r.gap) <= 4),
      '3e every reading is held at its OWN clause\'s top, to the pixel',
      beside && beside.rows.map(r => `${r.heading}:${r.gap}`).join(' · '));
    check(!!beside && beside.rows.every(r => r.left >= beside.paperRight - 2),
      '3f and every note sits clear of the wording, never over it',
      beside && `notes from ${Math.min(...beside.rows.map(r => r.left))} · paper ends ${beside.paperRight}`);

    /* THE TWO COLUMNS SCROLL AS ONE. Two scrollers drifting apart would put a
       reading beside the wrong wording — only a real scroller can answer it. */
    const scrolled = await drive(page, () => new Promise(res => {
      const sc = document.getElementById('doc-scroll');
      const note = document.querySelector('.doc-read-note');
      if (!sc || !note) return res(null);
      const t0 = note.getBoundingClientRect().top;
      const p0 = document.querySelector('#doc-canvas h2, #doc-canvas h3');
      const h0 = p0 ? p0.getBoundingClientRect().top : 0;
      sc.scrollTop = 260;
      setTimeout(() => {
        const t1 = note.getBoundingClientRect().top;
        const h1 = p0 ? p0.getBoundingClientRect().top : 0;
        res({ noteMoved: Math.round(t0 - t1), paperMoved: Math.round(h0 - h1) });
      }, 260);
    }), undefined, null);
    check(!!scrolled && scrolled.paperMoved > 100
      && Math.abs(scrolled.noteMoved - scrolled.paperMoved) <= 2,
      '3g scrolling the contract moves the readings with it, by the same amount',
      scrolled && `paper ${scrolled.paperMoved}px · note ${scrolled.noteMoved}px`);
    await drive(page, () => { const sc = document.getElementById('doc-scroll'); if (sc) sc.scrollTop = 0; }, undefined, null);
    await pause(300);

    /* ============ 4 · AND BACK — the cards come back whole ============ */
    const backPressed = await press(page, '.doc-read-seg button[data-doc-read="0"]', '4 Contract View');
    await pause(900);
    const back = await cards();
    check(backPressed && back.col === true && back.rightVis !== 'hidden',
      '4a one press brings the three cards back', `${back.rightVis} · ${back.cards} sections`);
    check(back.text === before.text,
      '4b with their content character for character — covered, never rebuilt',
      `${before.text} → ${back.text}`);
    check(back.layer === false, '4c and the reading layer stands down', back.layer);
    await page.screenshot({ path: path.join(OUT, '03-back.png') });

    /* Pressing it again is free: the reading is on the record. */
    await press(page, '.doc-read-seg button[data-doc-read="1"]', '4 Plain English again');
    await pause(1200);
    check(calls === 1, '4d going back to it is not paid for twice', calls);

    /* ============ 5 · THE BOX IS SAVED BEFORE THE SWAP ============ */
    /* Young ruled it 9 Sep 2026. The contract form in that column commits a
       field on CHANGE — that is, on blur — so a reader mid-typing who pressed
       the switch would have lost that one box. This workspace's fixtures carry
       no library-template form, so the wearer is PLANTED: a text box in that
       column with the form's own `change` listener. What is measured is the one
       line that matters — the press blurs what is focused there first, which is
       what fires the commit. */
    await press(page, '.doc-read-seg button[data-doc-read="0"]', '5 back to the cards');
    await pause(700);
    const planted = await drive(page, () => {
      const col = document.querySelector('[data-doc-col="docs"]');
      if (!col) return false;
      const box = document.createElement('input');
      box.id = 'pe-probe'; box.type = 'text';
      box.style.cssText = 'display:block;width:90%;margin:6px';
      window.__peCommits = 0;
      box.addEventListener('change', () => { window.__peCommits++; });
      col.prepend(box);
      return true;
    }, undefined, false);
    check(planted, '5 the stand-in box is planted in that column');
    /* TYPED WITH A REAL KEYBOARD, because a value assigned in script fires no
       `change` on blur at all — the browser only fires it for a value a person
       changed. A probe that set it directly would pass against a product that
       had never learned to save the box. */
    if (planted) { await page.click('#pe-probe'); await page.type('#pe-probe', 'typed and not yet committed'); }
    await pause(200);
    const saved = await drive(page, () => ({
      focused: document.activeElement && document.activeElement.id === 'pe-probe',
      commits: window.__peCommits,
      value: (document.getElementById('pe-probe') || {}).value || '',
    }), undefined, null);
    check(!!saved && saved.focused && saved.commits === 0 && saved.value.length > 5,
      '5a a box mid-typing has not committed yet — the control', saved && JSON.stringify(saved));
    await press(page, '.doc-read-seg button[data-doc-read="1"]', '5 the switch, without blurring first');
    await pause(1400);
    const committed = await drive(page, () => ({
      commits: window.__peCommits,
      inside: !!(document.activeElement && document.activeElement.closest
        && document.activeElement.closest('#doc-right')),
    }), undefined, null);
    check(!!committed && committed.commits === 1,
      '5b pressing the switch commits it first — the box is not lost',
      committed && JSON.stringify(committed));
    check(!!committed && committed.inside === false,
      '5c and nothing in the covered column still holds the caret', committed && committed.inside);
    await drive(page, () => { const b = document.getElementById('pe-probe'); if (b) b.remove(); }, undefined, null);

    /* ============ 6 · WHERE IT CANNOT WORK IT IS NOT DRAWN ============ */
    const kept = await drive(page, () => {
      try { return localStorage.getItem('hati.v1.docPlainEnglish'); } catch (_) { return null; }
    }, undefined, null);
    await page.setViewportSize({ width: 900, height: 900 });
    await pause(400);
    await drive(page, () => { const c = state.contracts.find(x => x.id === 'MK-A2'); if (c) wsPaintTabRowEnd(c); }, undefined, null);
    await pause(400);
    const narrow = await drive(page, () => ({
      seg: !!document.querySelector('.doc-read-seg'),
      stored: (() => { try { return localStorage.getItem('hati.v1.docPlainEnglish'); } catch (_) { return null; } })(),
    }), undefined, null);
    check(!!narrow && narrow.seg === false,
      '6a below the two-column floor the switch is not drawn at all', narrow && narrow.seg);
    check(!!narrow && narrow.stored === kept,
      '6b and the choice made on a laptop is READ, never quietly cleared',
      `${kept} → ${narrow && narrow.stored}`);
    await page.setViewportSize({ width: 1500, height: 1000 });
    await pause(500);

    /* A DOCUMENT WITH NOTHING TO READ IS OFFERED NOTHING — this product's own
       rule about a verb that cannot work. The honest case is not an empty
       template (docBody falls back to a default build and yields clauses); it
       is the commonest shape this feature meets — a scan whose words never came
       out of the file. */
    await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      window.__peSaved = { t: c.template, r: c.redlineText, f: c.fields, s: c.source, u: c.upload };
      c.source = 'upload'; c.upload = { fileName: 'scan.pdf', mime: 'application/pdf', text: '' };
      c.template = null; c.redlineText = ''; c.fields = {};
      renderWorkspace(c.id);
    }, undefined, null);
    await pause(1400);
    const bare = await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      return {
        seg: !!document.querySelector('.doc-read-seg'),
        step: !!document.querySelector('#ws-tabrow-end .rl-type-step'),
        clauses: docReadClauses(c).length,
        painted: document.querySelectorAll('#doc-canvas h1,#doc-canvas h2,#doc-canvas h3,#doc-canvas h4').length,
      };
    }, undefined, null);
    /* THE SHEET PAINTS THE CONTRACT'S NAME AND NOTHING ELSE — so the honest
       claim is that the reading finds no clause, not that the canvas is bare. */
    check(!!bare && bare.clauses === 0 && bare.painted === 1,
      '6c the stage really is a document with nothing to read but its own title',
      bare && `${bare.painted} painted · ${bare.clauses} clauses`);
    check(!!bare && bare.seg === false && bare.step === true,
      '6d it is offered no switch — and the rest of the row still stands',
      bare && JSON.stringify(bare));
    await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      const s = window.__peSaved || {};
      c.template = s.t; c.redlineText = s.r; c.fields = s.f; c.source = s.s; c.upload = s.u;
    }, undefined, null);

    /* ============ 8 · A CLAUSE-FOR-CLAUSE EDITION (Young, 10 Sep 2026) ============
       "If there clause 1.1 in the contract then there should be a traslated
       clause 1.1 in plain english." The paper below is put on the record and
       drawn by the REAL builder — redlineDocBody, the branch an upload takes —
       so the walk, the route and the render are all the shipped ones. */
    const NUMBERED = [
      '<h2>1. Scope of supply and purchase orders</h2>',
      '<p><strong>1.1 Master Agreement Structure.</strong> This Agreement establishes the framework under which Buyer may purchase raw materials from Supplier.</p>',
      '<p><strong>1.2 Issuance of Purchase Orders.</strong> Supplier shall confirm acceptance of each purchase order in writing within two (2) business days of receipt.</p>',
      '<p><strong>1.3 Precedence.</strong> In the event of any conflict the terms of this Agreement shall strictly prevail.</p>',
    ].join('');
    await drive(page, html => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      /* format:'rich' is what sends docBody down redlineDocBody's rich branch
         — the one an upload with real structure takes. Without it the wording
         is drawn as PLAIN TEXT in a pre-wrap box, tags and all, and the walk
         quite correctly finds no headings in it. */
      c.redlineText = html; c.format = 'rich';
      delete c._readings; delete c._readSig;
      if (typeof docReadSet === 'function') docReadSet(false);
      /* renderWorkspace, not openWorkspace: setView keeps the reader's place
         when the view asked for is the one already on screen, so the door does
         not repaint the canvas and the new wording never reaches the sheet. */
      renderWorkspace(c.id);
    }, NUMBERED, null);
    await pause(1400);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(900);

    const num = await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      const list = (typeof docReadClauses === 'function') ? docReadClauses(c) : [];
      return { n: list.length, nums: list.map(x => x.num), kinds: list.map(x => x.kind),
               heads: list.map(x => x.heading) };
    }, undefined, { n: 0, nums: [], kinds: [], heads: [] });
    /* THE REPORTED FAULT: the old walk took headings only, so this whole
       section arrived as ONE row and could only come back as one note. */
    check(num.n === 4 && num.nums.join(',') === ',1.1,1.2,1.3',
      '8a a section of three numbered clauses is FOUR rows, not one — the reported fault',
      `${num.n}: ${num.nums.join(' | ')}`);
    check(num.heads[1] === '1.1 Master Agreement Structure.',
      "8b and a clause's heading is its own bold lead-in", num.heads[1]);

    ai.reset();
    ai.script(tool([
      { i: 0, head: 'What you are buying, and how orders are placed', plain: '' },
      { i: 1, head: 'How this agreement works', plain: 'This agreement does not order anything by itself. It sets the rules, and each actual order is placed separately as a purchase order.' },
      { i: 2, head: 'Placing an order', plain: 'You send a written order. The Supplier then has two working days to confirm it in writing.' },
      { i: 3, head: 'Which document wins', plain: 'If this agreement and an order say different things, this agreement wins.' },
    ]));
    await press(page, '.doc-read-seg button[data-doc-read="1"]', '8 Plain English on numbered paper');
    await pause(3000);

    const ed = await drive(page, () => {
      const layer = document.getElementById('doc-read');
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      const paper = document.querySelector('#doc-canvas .doc-surface') || document.getElementById('doc-canvas');
      const body = document.body;
      const noteEl = notes.find(n => n.querySelector('p'));
      return {
        notes: notes.length,
        nums: Array.from(document.querySelectorAll('.doc-read-note .dr-n'), e => e.textContent.trim()),
        sections: document.querySelectorAll('.doc-read-note .dr-s').length,
        clauseHeads: document.querySelectorAll('.doc-read-note .dr-h').length,
        readSize: noteEl ? getComputedStyle(noteEl).fontSize : '',
        paperSize: paper ? getComputedStyle(paper).fontSize : '',
        layerBg: layer ? getComputedStyle(layer).backgroundColor : '',
        pageBg: getComputedStyle(body).backgroundColor,
        gridBg: (() => { const g = document.getElementById('doc-grid');
          return g ? getComputedStyle(g).backgroundColor : ''; })(),
        overlap: (() => {
          let bad = 0;
          for (let i = 1; i < notes.length; i++) {
            const a = notes[i - 1].getBoundingClientRect(), b = notes[i].getBoundingClientRect();
            if (b.top < a.bottom - 1) bad++;
          }
          return bad;
        })(),
      };
    }, undefined, {});
    check(ed.notes === 4, '8c every clause gets its own entry, the section included', ed.notes);
    /* REVERSED IN PLACE (Job 3, 10 Sep 2026). WHAT THIS CLAIM IS ABOUT is
       unchanged and is the half that matters: the number is the PAPER'S, read
       off the sheet, never asked of the model — which is what lets it be
       printed as a citation. What moved is that the SECTION heading now
       carries its own too. It read ",1.1,1.2,1.3" here, and that empty first
       entry was the reported fault being pinned: this fixture's section is
       "1. Scope of supply and purchase orders", and a heading was given no
       number unconditionally. f277 (13a) is the other half — what the ROUTE is
       sent still reads ",1.1,1.2,1.3" and must, because its cache key is a
       hash of exactly that. */
    check(ed.nums.join(',') === '1,1.1,1.2,1.3',
      "8d each carries the contract's OWN number — read off the paper, never the model's",
      ed.nums.join(' | '));
    check(ed.sections === 1 && ed.clauseHeads === 3,
      '8e a section title above three clause headings — the contract\'s own shape',
      `${ed.sections} section · ${ed.clauseHeads} clause`);
    /* THE SIZE IS THE CONTRACT'S. Measured on both sides rather than against a
       typed number, which is the only way this claim survives a type retune. */
    check(ed.readSize && ed.readSize === ed.paperSize,
      '8f and it is set at exactly the size the contract is set at',
      `reading ${ed.readSize} · paper ${ed.paperSize}`);
    check(ed.layerBg && ed.layerBg !== ed.pageBg && ed.layerBg !== ed.gridBg,
      '8g it sits on a white sheet of its own, not on the page ground',
      `layer ${ed.layerBg} · page ${ed.pageBg}`);
    check(ed.overlap === 0, '8h and no entry overlaps the one above it', ed.overlap);
    await page.screenshot({ path: path.join(OUT, '05-edition.png') });

    /* ============ 9 · IT FOLLOWS THE WORDING (Young, 10 Sep 2026) ============
       "when the contract in the document changes or is redlined and you click
       on plain english it should update the translation accordingly." */
    const callsBefore = calls;
    await press(page, '.doc-read-seg button[data-doc-read="0"]', '9 back to Contract View');
    await pause(500);
    await press(page, '.doc-read-seg button[data-doc-read="1"]', '9 Plain English again');
    await pause(1200);
    check(calls === callsBefore,
      '9a unchanged wording asks nothing — the reading it holds still fits', calls - callsBefore);

    ai.reset();
    ai.script(tool([
      { i: 0, head: 'What you are buying, and how orders are placed', plain: '' },
      { i: 1, head: 'How this agreement works', plain: 'REDLINED READING for the clause that moved.' },
      { i: 2, head: 'Placing an order', plain: 'You send a written order. The Supplier then has five working days to confirm it.' },
      { i: 3, head: 'Which document wins', plain: 'If this agreement and an order say different things, this agreement wins.' },
    ]));
    await drive(page, html => {
      const c = state.contracts.find(x => x.id === 'MK-A2');
      c.redlineText = html; c.format = 'rich'; renderWorkspace(c.id);
    }, NUMBERED.replace('two (2) business days', 'five (5) business days'), null);
    await pause(1400);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(900);
    const callsMid = calls;
    await press(page, '.doc-read-seg button[data-doc-read="1"]', '9 Plain English after the redline');
    await pause(3000);
    const fresh = await drive(page, () => ({
      calls: 0,
      text: Array.from(document.querySelectorAll('.doc-read-note p'), e => e.textContent).join(' | '),
    }), undefined, { text: '' });
    check(calls === callsMid + 1,
      '9b a redlined clause is read again — the press asks, where before it did not',
      calls - callsMid);
    check(/five working days/.test(fresh.text),
      '9c and what draws is the reading of the NEW wording', fresh.text.slice(0, 90));

    /* ============ 10 · THE OTHER SHAPE OF PAPER (Young, 10 Sep 2026) ============
       "the contract view and plain english buttons are missing."

       Reported as an arrival and it is nothing to do with the route: MEASURED
       from the dashboard, the register and the calendar, the switch behaved
       identically. What differs is the CONTRACT. A working text — which is
       what Young's screenshot shows, and what every received document is —
       is laid out by documentTextHtml, whose headings are styled <div>s and
       whose clause numbers are styled <span>s. Not one <h*> on the sheet.

       WHY A BROWSER FILE FOR THIS AND NOT ONLY f277: the node stage plants
       markup on a canvas, which proves the READING. Whether the switch is
       VISIBLE PIXELS on a real contract, whether a real press brings back a
       note beside the clause it is about, and whether the paper moved by so
       much as a pixel are three questions only a rendered page answers. */
    /* THE STAGE IS THE PRODUCT'S OWN, never a body typed out here: the working
       text is docPlainText of the contract's own paper, which is exactly what
       a negotiation stores the first time somebody redlines a template
       contract — the state Young's screenshot is in ("Round 1 · 2 need you",
       "WORKING TEXT" on the sheet). Typing a body out would be staging a shape
       the product might not produce. */
    await drive(page, () => { openWorkspace('MK-B2'); }, undefined, null);
    await pause(1800);
    await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-B2');
      c.redlineText = docPlainText(c); c.format = 'text'; renderWorkspace();
    }, undefined, null);
    await pause(1400);
    await drive(page, () => { document.querySelector('[data-ws-tab="docs"]')?.click(); }, undefined, null);
    await pause(800);

    const txtSheet = await drive(page, () => {
      const cv = document.getElementById('doc-canvas');
      const c = state.contracts.find(x => x.id === 'MK-B2');
      let rows = []; try { rows = docReadClauses(c); } catch (_) { rows = []; }
      let sheet = []; try { sheet = docReadSheet(c); } catch (_) { sheet = []; }
      /* The WORDING's own headings, never the paper head's title — that one
         is furniture and the walk has always stepped over it. */
      const heads = cv ? Array.from(cv.querySelectorAll('h1,h2,h3,h4'))
        .filter(el => !el.closest('.rl-paper-head,.rl-paper-foot,header')).length : -1;
      return { h: heads, rich: !!(window.isRich && isRich(c.format)),
        rows: rows.length,
        /* The number the ENTRY shows, which is the painter's own reading:
           the stored one, the live walk's, then the heading's own. */
        nums: sheet.map(r => String(r.num || r.cite || '')),
        kinds: rows.map(r => r.kind),
        width: cv ? Math.round(cv.getBoundingClientRect().width) : -1 };
    }, undefined, { h: -1, rich: true, rows: 0, nums: [], kinds: [], width: -1 });
    /* REVERSED IN PLACE (Young reported it 10 Sep 2026: "the main contract is
       unstructured unlike the negotiate page which is clean"). This pinned that
       a working text's wording carries NOT ONE <h*> — which was the stage AND
       the fault: documentTextHtml drew a heading as a styled <div> and a clause
       number as a styled <span>, so the tab a contract is READ on drew it as a
       column of lines while the negotiate page drew the same words as a
       document. WHAT THE CLAIM IS ABOUT is unchanged — this stage is a plain
       working text and not a rich upload — and the second half is now the fix:
       the same lines are lifted through the reading the NEGOTIATION already
       uses, so the paper carries real headings. */
    check(!txtSheet.rich,
      '10a the stage is the reported one — a plain working text, not a rich upload',
      txtSheet.rich ? 'rich' : 'text');
    check(txtSheet.h >= 4,
      '10a2 and its wording now carries real headings — against the parent, none',
      txtSheet.h);
    check(await visible(page, '.doc-read-seg'),
      '10b the switch is VISIBLE PIXELS on it — against the parent it is not drawn at all');
    check(txtSheet.rows >= 4 && txtSheet.nums.filter(Boolean).join(',') === '1,2,3,4',
      '10c and the walk reads it clause for clause, each with the paper\'s own number',
      `${txtSheet.rows} rows: ${txtSheet.nums.join('|')}`);

    /* THE PAPER MAY NOT MOVE. The classes name what was already there; if one
       of them changed a line box this is where it shows. */
    const beforeLines = await drive(page, () => {
      const cv = document.getElementById('doc-canvas');
      const w = document.createTreeWalker(cv, NodeFilter.SHOW_TEXT);
      const out = []; let n;
      while ((n = w.nextNode())) {
        const t = (n.textContent || '').trim(); if (!t) continue;
        const r = document.createRange(); r.selectNode(n);
        for (const rc of r.getClientRects()) out.push(`${t.slice(0, 20)}@${Math.round(rc.top)},${Math.round(rc.left)}`);
      }
      return out;
    }, undefined, []);
    check(beforeLines.length > 6,
      '10d the sheet really paints its lines — or the measurement below proves nothing',
      beforeLines.length);

    const txtRows = txtSheet.rows;
    ai.reset();
    ai.script(tool(Array.from({ length: txtRows }, (_, i) => (txtSheet.kinds[i] === 'section'
      ? { i, head: 'PART ' + (i + 1), plain: '' }
      : { i, head: 'What this means', plain: `PLAIN ${txtSheet.nums[i]}: you must do what this clause says.` }))));
    const txtPressed = await press(page, '.doc-read-seg button[data-doc-read="1"]', '10 Plain English on a working text');
    await pause(3200);
    const txtOut = await drive(page, () => {
      const cv = document.getElementById('doc-canvas');
      /* RE-POINTED, not deleted. The claim is that an entry sits LEVEL with the
         clause it reads; what carries a clause's number on this paper moved
         from a `.doc-t-n` span to the clause's own heading, so the anchor is
         read the way docReadSheet reads it. */
      const marks = {};
      cv.querySelectorAll('.hati-doc h1,.hati-doc h2,.hati-doc h3,.hati-doc h4').forEach(el => {
        const m = /^\s*(\d+(?:\.\d+)*)[.)]?\s+\S/.exec(String(el.textContent || ''));
        if (m) marks[m[1]] = Math.round(el.getBoundingClientRect().top);
      });
      cv.querySelectorAll('.doc-t-n').forEach(m => { marks[m.textContent.trim().replace(/[.)]$/, '')] = Math.round(m.getBoundingClientRect().top); });
      const notes = Array.from(document.querySelectorAll('.doc-read-note')).map(n => ({
        num: ((n.querySelector('.dr-n') || {}).textContent || '').trim(),
        top: Math.round(n.getBoundingClientRect().top),
      }));
      return { layer: !!document.getElementById('doc-read') && !document.getElementById('doc-read').hidden,
        notes, marks, width: Math.round(cv.getBoundingClientRect().width) };
    }, undefined, { layer: false, notes: [], marks: {}, width: -1 });
    check(txtPressed && txtOut.layer && txtOut.notes.length === txtRows,
      '10e a real press brings back one entry per row of the walk',
      `${txtOut.notes.length} of ${txtRows}`);
    check(txtOut.notes.some(n => n.num === '1') && txtOut.notes.some(n => n.num === '4'),
      '10f and each numbered entry cites the paper\'s own clause number',
      txtOut.notes.map(n => n.num || '·').join(' '));
    const first = txtOut.notes.find(n => n.num === '1');
    check(!!first && txtOut.marks['1'] != null && Math.abs(first.top - txtOut.marks['1']) <= 6,
      '10g the first entry is LEVEL with the clause it reads',
      first && `note ${first.top} · clause ${txtOut.marks['1']}`);
    check(txtOut.width === txtSheet.width,
      '10h and the contract did not narrow by a pixel', `${txtSheet.width} → ${txtOut.width}`);
    await page.screenshot({ path: path.join(OUT, '10-working-text.png') }).catch(() => {});

    /* ============ 11 · A HEADING'S OWN NUMBER IS ON THE READING (Job 3) ============
       docReadPaint has always drawn the clause's number and on real paper it
       drew nothing: a HEADING row is given none, and the paragraph rule beside
       it is only ever applied to non-headings. Section 10 above stages
       PLAIN-TEXT paper, whose numbers are marked spans and so always had one —
       which is exactly why the fault survived. This stages the other shape:
       RICH paper whose clause numbers live in its headings, which is most
       commercial paper and every structured PDF since J-3.4.

       ONLY A RENDERED PAGE CAN ANSWER IT: whether a citation is PAINTED beside
       the reading is a fact about pixels, and the parent draws the note
       perfectly with the number simply absent. */
    const HEADNUM = [
      '<h2>1. Scope of supply and purchase orders</h2>',
      '<p>The Supplier shall supply the Goods described in each Order.</p>',
      '<h2>ARTICLE 2. Obligations of the first party</h2>',
      '<p>The first party shall transfer the Services in accordance with Schedule 1.</p>',
      '<h2>Definitions</h2>',
      '<p>In this Agreement the following expressions have the meanings given.</p>',
    ].join('');
    await drive(page, html => {
      const c = state.contracts.find(x => x.id === 'MK-B2');
      c.redlineText = html; c.format = 'rich';
      delete c._readings; delete c._readSig;
      if (typeof docReadSet === 'function') docReadSet(false);
      renderWorkspace(c.id);
    }, HEADNUM, null);
    await pause(1500);
    await drive(page, () => { document.querySelector('[data-ws-tab="docs"]')?.click(); }, undefined, null);
    await pause(900);

    const hSheet = await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-B2');
      let rows = []; try { rows = docReadSheet(c); } catch (_) { rows = []; }
      let sent = []; try { sent = docReadClauses(c); } catch (_) { sent = []; }
      return { rows: rows.length, kinds: rows.map(r => r.kind),
        sentNums: sent.map(r => r.num || ''),
        sentKeys: sent.length ? Object.keys(sent[0]).sort().join(',') : '' };
    }, undefined, { rows: 0, kinds: [], sentNums: [], sentKeys: '' });
    /* THREE ROWS, NOT SIX: a heading's row is the heading AND everything under
       it up to the next anchor, and an unnumbered paragraph is not an anchor of
       its own. That is the walk working as designed, and it is the shape the
       owner's screenshot is in — every reading a SECTION with no number. */
    check(hSheet.rows === 3 && hSheet.kinds.filter(k => k === 'section').length === 3,
      '11a the stage is the reported one — clause numbers inside the headings',
      `${hSheet.rows} rows: ${hSheet.kinds.join('|')}`);
    /* CONTROL, and the claim that keeps this job free of spend: the route's
       cache key is a hash of exactly what it is sent, so a number added THERE
       would make every contract already read pay for an identical re-read. */
    check(hSheet.sentNums.join(',') === ',,' && hSheet.sentKeys === 'heading,kind,num,text',
      '11b CONTROL — what the route is sent has not moved by a byte',
      `[${hSheet.sentNums.join('|')}] keys ${hSheet.sentKeys}`);

    ai.reset();
    ai.script(tool([
      { i: 0, head: 'Scope of supply', plain: 'The Supplier provides the goods listed on each order you place.' },
      { i: 1, head: 'Obligations of the first party', plain: 'The first party moves the services across on the timetable in Schedule 1.' },
      { i: 2, head: 'Definitions', plain: 'This clause explains the defined words used everywhere else.' },
    ]));
    const hPressed = await press(page, '.doc-read-seg button[data-doc-read="1"]', '11 Plain English on headed paper');
    await pause(3200);
    const hOut = await drive(page, () => Array.from(document.querySelectorAll('.doc-read-note')).map(n => ({
      num: ((n.querySelector('.dr-n') || {}).textContent || '').trim(),
      head: ((n.querySelector('.dr-h,.dr-s') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    })), undefined, []);
    check(hPressed && hOut.length === 3, '11c a real press brings back the readings', hOut.length);
    const cites = hOut.map(n => n.num).filter(Boolean);
    check(cites.includes('1'),
      '11d the numbered section heading CITES its own number — the fault',
      hOut.map(n => n.num || '·').join(' '));
    check(cites.includes('2'),
      '11e and a self-naming heading does too ("ARTICLE 2." → 2)',
      hOut.map(n => `${n.num || '·'}:${n.head.slice(0, 18)}`).join(' | '));
    const defs = hOut.find(n => /^Definitions/.test(n.head));
    check(!!defs && defs.num === '',
      '11f a heading with no number invents none — a wrong citation is worse than a missing one',
      defs ? `"${defs.head}" → "${defs.num}"` : 'the row is gone');
    check(hOut.every(n => !n.num || n.head.indexOf(n.num + '.') !== 0),
      '11g and the number is not printed twice on one entry',
      hOut.map(n => `${n.num || '·'}/${n.head.slice(0, 14)}`).join(' | '));
    await page.screenshot({ path: path.join(OUT, '11-heading-numbers.png') }).catch(() => {});

    /* ============ 12 · THE HEADING IS THE DRAFTER'S OWN (Young, 10 Sep 2026) ============
       *"Dropping copilot headings makes sense"*, and *"make the page for plain
       english have a similar structure so you almost do not notice a difference
       except plain english will be sitting on a plain white background."*

       The model is scripted with headings NOTHING like the paper's, so a pass
       cannot be an accident of the two agreeing. */
    ai.reset();
    ai.script(tool([
      { i: 0, head: 'ZZZ MODEL HEADING ONE', plain: 'The Supplier provides the goods listed on each order.' },
      { i: 1, head: 'ZZZ MODEL HEADING TWO', plain: 'The first party moves the services across on the timetable.' },
      { i: 2, head: 'ZZZ MODEL HEADING THREE', plain: 'This clause explains the defined words.' },
    ]));
    await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-B2');
      delete c._readings; delete c._readSig;
      if (typeof docReadSet === 'function') docReadSet(false);
      renderWorkspace(c.id);
    }, undefined, null);
    await pause(1200);
    await drive(page, () => { document.querySelector('[data-ws-tab="docs"]')?.click(); }, undefined, null);
    await pause(700);
    const pPressed = await press(page, '.doc-read-seg button[data-doc-read="1"]', '12 Plain English');
    await pause(3200);
    const paperHeads = await drive(page, () => {
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      const canvas = document.getElementById('doc-canvas');
      const norm = t => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const sheet = Array.from(canvas.querySelectorAll('h1,h2,h3,h4')).map(h => norm(h.textContent));
      return notes.map(n => {
        /* The citation is a span of its own INSIDE the heading, so it is taken
           off before the name is compared — otherwise the check reads "1Scope
           of supply" and can never match the sheet. */
        const el = n.querySelector('.dr-h,.dr-s');
        const cite = el && el.querySelector('.dr-n');
        const h = el ? String(el.textContent || '').slice(cite ? String(cite.textContent || '').length : 0) : '';
        return { head: String(h).replace(/\s+/g, ' ').trim(),
          onSheet: sheet.some(t => t && norm(h) && t.indexOf(norm(h)) >= 0) };
      });
    }, undefined, []);
    check(pPressed && paperHeads.length === 3, '12a the readings came back', paperHeads.length);
    check(paperHeads.length > 0 && paperHeads.every(n => !/ZZZ MODEL/.test(n.head)),
      '12b NOT ONE MODEL HEADING IS DRAWN — Young’s own ruling',
      paperHeads.map(n => n.head.slice(0, 22)).join(' | '));
    check(paperHeads.length > 0 && paperHeads.every(n => n.onSheet),
      '12c every heading drawn is one the DRAFTER wrote, found on the sheet itself',
      paperHeads.map(n => `${n.onSheet ? '✓' : '✗'} ${n.head.slice(0, 22)}`).join(' | '));

    /* ---- AND THE EDITION IS SET LIKE THE CONTRACT ---- */
    const shaped = await drive(page, () => {
      /* A clause a step in with its marker in a gutter, staged on the paper the
         same way an uploaded contract carries it. */
      const canvas = document.getElementById('doc-canvas');
      /* The class goes on the ANCHOR the entry faces — which on this staged
         paper is a heading — because that is the element docReadShape walks up
         from. Marking some other paragraph proves nothing. */
      const heads = Array.from(canvas.querySelectorAll('h1,h2,h3,h4'));
      if (heads[1]) heads[1].className = ((heads[1].className || '') + ' rl-hang hati-lv-1').trim();
      const c = state.contracts.find(x => x.id === 'MK-B2');
      if (typeof docReadPaint === 'function') docReadPaint(c);
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      return { any: notes.length,
        stepped: notes.filter(n => /hati-lv-/.test(n.className)).length,
        hung: notes.filter(n => /dr-hang/.test(n.className)).length,
        rule: (() => { try{ return [...document.styleSheets].some(sh => {
          try{ return [...sh.cssRules].some(r => /doc-read-note\.hati-lv-1/.test(r.selectorText || '')); }
          catch(_){ return false; } }); }catch(_){ return false; } })() };
    }, undefined, { any: 0, stepped: 0, hung: 0, rule: false });
    check(shaped.rule,
      '12d the edition draws the SAME step ladder as the paper — one vocabulary',
      shaped.rule ? 'hati-lv-N reaches the reading column' : 'no rule');
    check(shaped.any > 0 && shaped.stepped > 0 && shaped.hung > 0,
      '12e an entry facing an indented clause is indented, and one facing a gutter hangs',
      JSON.stringify(shaped));

    /* ============ 13 · ONE SHAPE OF PAPER, AND THE TOP SAID ONCE ============
       (Young, 10 Sep 2026: "top of the contract is a mess ... does not resemble
       image 3 which is in the negotiate page and looks more structured. So
       plain english is not set like a contract and the main contract is
       unstructured unlike the negotiate page which is clean.")

       MEASURED on ONE contract, on BOTH surfaces, and that is the whole point
       of doing it here: "these two pages draw the same document the same way"
       is a claim about two rendered pages and can be asked nowhere else. The
       fixture is the product's own working text — docPlainText of MK-B2's own
       paper, which is the state a template contract is in the first time
       somebody redlines it — never a body typed out in this file. */
    await drive(page, () => { openWorkspace('MK-B2'); }, undefined, null);
    await pause(1600);
    await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-B2');
      /* ITS OWN GROUND. Sections 10-12 stage bodies on this contract, so the
         working text is derived from the TEMPLATE again — clear the stored
         wording first and docPlainText answers with the contract's own paper,
         which is the state this section is about. A check that inherits the
         section above it is describing that section, not this one. */
      delete c.redlineText; delete c.format;
      c.redlineText = docPlainText(c); c.format = 'text';
      delete c._readings; delete c._readSig;
      if (typeof docReadSet === 'function') docReadSet(false);
      renderWorkspace();
    }, undefined, null);
    await pause(1400);
    await drive(page, () => { document.querySelector('[data-ws-tab="docs"]')?.click(); }, undefined, null);
    await pause(900);

    const s13shape = await drive(page, () => {
      const cv = document.getElementById('doc-canvas');
      const sheet = cv && (cv.querySelector('.hati-doc') || cv);
      const c = state.contracts.find(x => x.id === 'MK-B2');
      const norm = t => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return {
        /* THE BODY IS A DOCUMENT, not a column of lines. */
        heads: sheet ? sheet.querySelectorAll('h1,h2,h3,h4').length : -1,
        paras: sheet ? sheet.querySelectorAll('p').length : -1,
        prewrap: cv ? Array.from(cv.querySelectorAll('div'))
          .filter(el => /pre-wrap/.test(getComputedStyle(el).whiteSpace)).length : -1,
        /* THE TOP IS SAID ONCE: no header above wording that already opens
           with the document's own front matter. */
        headEls: cv ? cv.querySelectorAll('.rl-paper-head').length : -1,
        nameTwice: (() => {
          if (!cv) return -1;
          const n = norm(c && c.name);
          if (!n) return 0;
          return Array.from(cv.querySelectorAll('.rl-paper-title, .hati-doc > *'))
            .filter(el => norm(el.textContent) === n).length;
        })(),
      };
    }, undefined, { heads: -1, paras: -1, prewrap: -1, headEls: -1, nameTwice: -1 });
    check(s13shape.heads >= 4 && s13shape.paras >= 4,
      '13a the working text is drawn as a DOCUMENT — real headings, real paragraphs',
      `${s13shape.heads} headings · ${s13shape.paras} paragraphs`);
    check(s13shape.prewrap === 0,
      '13b and not as a column of pre-wrap lines — the reported fault',
      s13shape.prewrap);
    check(s13shape.headEls === 0 && s13shape.nameTwice <= 1,
      '13c the top is said ONCE — no header above wording that already carries it',
      `${s13shape.headEls} header(s) · the name appears ${s13shape.nameTwice}×`);

    /* THE SAME DOCUMENT ON THE PAGE YOUNG NAMED AS THE ONE THAT READS RIGHT.
       Compared as a RELATION between the two surfaces, never against a typed
       count, so a later change to the fixture costs this nothing. */
    const s13nego = await drive(page, () => {
      openRedlineWorkbench('MK-B2');
      return true;
    }, undefined, null);
    await pause(2400);
    const s13negoShape = await drive(page, () => {
      const paper = document.querySelector('.rl-paper');
      if (!paper) return null;
      return { heads: paper.querySelectorAll('h1,h2,h3,h4').length,
               titles: paper.querySelectorAll('.rl-paper-title').length };
    }, undefined, null);
    check(!!s13nego && !!s13negoShape && s13negoShape.heads >= s13shape.heads,
      '13d the negotiate page reads the same document with at least as many headings',
      s13negoShape && `negotiate ${s13negoShape.heads} · document tab ${s13shape.heads}`);
    check(!!s13negoShape && s13negoShape.titles <= 1,
      '13e and it prints ONE title — the reference the report names', s13negoShape && s13negoShape.titles);

    /* ---- THE NUMBER SITS BESIDE THE READING, NEVER ABOVE IT ----
       "the numbers are above the clause as opposed to next to the clause like
       in the contract. it also does not have clause headers." Staged on paper
       whose clauses run straight into their wording with no heading of their
       own, which is the s13shape that produced it. */
    await drive(page, () => { openWorkspace('MK-B2'); }, undefined, null);
    await pause(1600);
    await drive(page, () => {
      const c = state.contracts.find(x => x.id === 'MK-B2');
      c.redlineText = ['2.1 The Supplier shall deliver each consignment to the plant.',
        '2.2 The Buyer shall inspect each consignment within three days.'].join('\n\n');
      c.format = 'text';
      delete c._readings; delete c._readSig;
      if (typeof docReadSet === 'function') docReadSet(false);
      renderWorkspace();
    }, undefined, null);
    await pause(1400);
    await drive(page, () => { document.querySelector('[data-ws-tab="docs"]')?.click(); }, undefined, null);
    await pause(900);
    ai.reset();
    ai.script(tool([
      { i: 0, plain: 'The supplier brings each delivery to the plant.' },
      { i: 1, plain: 'You have three days to check each delivery.' },
    ]));
    const bareOn = await press(page, '.doc-read-seg button[data-doc-read="1"]', '13 Plain English on unheaded clauses');
    await pause(3000);
    const s13beside = await drive(page, () => {
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      return notes.map(n => {
        const num = n.querySelector('.dr-n');
        const p = n.querySelector('p');
        const h = n.querySelector('.dr-h,.dr-s');
        return { n: num ? num.textContent.trim() : '',
          /* ABOVE or BESIDE is a GEOMETRY, which is the whole of the report. */
          sameLine: !!(num && p && Math.abs(num.getBoundingClientRect().top
            - p.getBoundingClientRect().top) <= 4),
          numInP: !!(num && p && p.contains(num)),
          headOnlyNum: !!(h && num && h.contains(num)
            && h.textContent.trim() === num.textContent.trim()),
          body: (p ? p.textContent : '').trim().slice(0, 30) };
      });
    }, undefined, []);
    check(bareOn && s13beside.length === 2 && s13beside.every(x => x.n),
      '13f each unheaded clause still cites its own number', s13beside.map(x => x.n || '·').join(' '));
    check(s13beside.length > 0 && s13beside.every(x => !x.headOnlyNum),
      '13g not one entry draws a number on a line of its own — the reported fault',
      s13beside.filter(x => x.headOnlyNum).length + ' such');
    check(s13beside.length > 0 && s13beside.every(x => x.numInP && x.sameLine),
      '13h the number sits BESIDE the reading, in the gutter, as the contract sets it',
      JSON.stringify(s13beside.map(x => ({ n: x.n, s13beside: x.sameLine }))));
    check(s13beside.length > 0 && s13beside.every(x => !/^\s*\d+(\.\d+)*\s/.test(x.body)),
      '13i and the number is not printed a second time in the reading itself',
      s13beside.map(x => x.body).join(' | '));
    await page.screenshot({ path: path.join(OUT, '13-s13beside.png') }).catch(() => {});

    /* ============ 7 · IT IS A CONTROL, AND NOTHING ELSE ON THE PAGE MOVED ============ */
    check(errors.length === 0, '7a the page raised no errors throughout', errors.slice(0, 2).join(' | '));
  } catch (e) {
    check(false, 'the run itself', String((e && e.message) || e).split('\n')[0]);
  }

  if (blocked.length) {
    console.log('');
    console.log(`  ${blocked.length} driven call(s) could not run on this build:`);
    blocked.slice(0, 4).forEach(b => console.log('    · ' + b));
  }
  console.log('');
  console.log(failures ? `${failures} check(s) FAILED` : 'all checks passed');
  console.log('screenshots → test/chromium/shots/plain-english');
  await browser.close();
  await h.stop();
  await ai.stop();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
