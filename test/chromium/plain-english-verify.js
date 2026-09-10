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
