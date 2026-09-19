/* Chromium verification: THE WORDS THAT MAKE A PROMISE (Young, 19 Sep 2026)
   ========================================================================
   Every claim in this file is PAINT, which is why it exists beside f339:

     · the switch took the caption's slot — whether it is where that sentence
       was, at the caption's own size and weight, is two measured rects;
     · the mark is a wash and an underline drawn by a background and an inset
       box-shadow, and is invisible in the markup either way;
     · the mark is painted into the DRAFTER'S OWN PAGE, so "the contract does
       not move by a pixel" is a measurement or it is nothing. Measured INSIDE
       the document, never as a viewport top — the scroll-versus-reflow trap
       the fill preview's own check was caught by two days ago;
     · A RECT IS NOT A PAINTED PIXEL: the ladder card measured 526..946 and was
       clipped away entirely. elementFromPoint is the instrument.

   MEASURED AT THE PARENT (8cc14ca): 26 of 34 RED, and each reproduces the
   report — the switch not drawn, not one word lit in either column, nothing
   stored, and the drafter's markup exactly as long with the switch pressed as
   without. The eight that pass are the named CONTROLS: the edition paints, the
   paper has clauses, nothing is lit at rest, the figures pass still marks its
   figures, the two passes leave the page well formed, the reading switch still
   closes the column, and no page error fires. Every claim that could have
   passed on a page where nothing was marked is GATED on the marks having gone
   on — the vacuous green this file exists to avoid.

   Run: node test/chromium/duty-marks-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'duty');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* EVERY DRIVEN HALF IS GUARDED, so a build WITHOUT the feature REPORTS its
   failures rather than throwing on the third check and proving nothing about
   the twenty after it. */
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
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

    /* ═══════════ THE STAGE ═══════════
       A contract whose wording really carries promises, put on the record
       through the product's own store so the paper the reader sees is the
       paper this feature reads. The readings come back from the scripted
       provider for exactly the rows the route is sent. */
    const PAPER = [
      '<h1>Distribution Agreement</h1>',
      '<p>Between Highland Corporate Ltd and Nordkust Industri AB.</p>',
      '<h2>7. Payment</h2>',
      '<p>The Distributor shall pay each valid invoice within thirty (30) days of the invoice date.</p>',
      '<h2>8. Reporting</h2>',
      '<p>The Distributor shall provide a monthly sales statement within five (5) business days of month end.</p>',
      '<h2>9. Insurance</h2>',
      '<p>The Distributor shall maintain product liability insurance of not less than KES 50,000,000.</p>',
      '<h2>10. Limitation of liability</h2>',
      '<p>The Supplier shall not be liable for any indirect or consequential loss.</p>',
      '<h2>11. Interpretation</h2>',
      '<p>Headings are for convenience only and do not affect interpretation.</p>',
    ].join('');

    const staged = await drive(page, async body => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined')
        || state.contracts[0];
      /* FORMAT MATTERS: docBodyHtml lifts a TEXT body through docRichFromText,
         so markup stored without saying it is rich arrives as one escaped
         block. Measured on the way in — 2 blocks instead of ten. */
      c.redlineText = body;
      c.format = 'rich';
      try { await persist(c); } catch (_) {}
      try { await flushSaves(); } catch (_) {}
      return { id: c.id, name: c.name };
    }, PAPER, { id: null, name: '' });

    await drive(page, id => { openWorkspace(id); }, staged.id, null);
    await pause(1600);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(900);

    const rows = await drive(page, () => {
      const c = state.contracts.find(x => x.id === state.activeId);
      try { return docReadClauses(c).map((x, i) => ({ i, heading: x.heading })); }
      catch (_) { return []; }
    }, undefined, []);
    check('0a CONTROL — the real document builder yields clauses to read',
      rows.length >= 4, `${rows.length} rows`);

    /* The reading is a TRANSLATION, so it says "must" where the paper says
       "shall" — which is exactly why the count has to ask both columns. */
    const PLAIN = {
      '7': 'You must pay every valid invoice within 30 days of its date.',
      '8': 'You must send a sales statement every month, within 5 working days of month end.',
      '9': 'You must keep product liability cover of at least KES 50,000,000.',
      '10': 'The supplier is not on the hook for knock-on losses.',
      '11': 'Headings are labels only.',
    };
    ai.script(body => {
      const txt = JSON.stringify(body).slice(0, 200000);
      const keys = [...new Set([...txt.matchAll(/\[R(\d+)\]/g)].map(m => +m[1]))];
      return [{ type: 'tool_use', id: 'tu_read', name: 'clause_readings', input: {
        readings: keys.map(k => {
          const head = (rows[k] || {}).heading || '';
          const num = (head.match(/^(\d+)/) || [])[1] || '';
          return { i: k, key: 'R' + k, heading: head,
            plain: PLAIN[num] || 'In plain words, this clause says what it says.' };
        }) } }];
    });
    await drive(page, async () => {
      const b = document.querySelector('[data-doc-read="1"]');
      if (b) b.click();
      await new Promise(r => setTimeout(r, 4500));
    }, undefined, null);
    await pause(1400);

    const painted = await drive(page, () => ({
      notes: document.querySelectorAll('.doc-read-note').length,
      layer: !document.getElementById('doc-read').hidden,
    }), undefined, { notes: 0, layer: false });
    check('0b CONTROL — the plain English edition really painted',
      painted.notes >= 4 && painted.layer === true, `${painted.notes} entries`);

    /* ═══════════ 1 · THE SWITCH IS IN THE CAPTION'S SLOT ═══════════ */
    const sw = await drive(page, () => {
      const head = document.querySelector('.doc-read-head');
      const lbl = document.querySelector('.doc-read-lbl');
      const btn = document.querySelector('[data-doc-read-duty]');
      if (!head || !btn) return { err: 'not drawn', lbl: !!lbl };
      const hr = head.getBoundingClientRect(), br = btn.getBoundingClientRect(),
        lr = lbl ? lbl.getBoundingClientRect() : null;
      const cs = getComputedStyle(btn), ls = lbl ? getComputedStyle(lbl) : null;
      /* A RECT IS NOT A PAINTED PIXEL. */
      const mid = document.elementFromPoint(Math.round(br.x + br.width / 2),
        Math.round(br.y + br.height / 2));
      return {
        word: btn.textContent.trim(),
        pressed: btn.getAttribute('aria-pressed'),
        title: (btn.getAttribute('title') || '').slice(0, 90),
        lblTitle: lbl ? (lbl.getAttribute('title') || '') : null,
        em: document.querySelectorAll('.doc-read-head em').length,
        /* the switch's right edge sits at the head's right edge, which is the
           slot margin-left:auto puts a thing in */
        gapRight: Math.round(hr.right - br.right),
        sameRow: Math.abs(Math.round(br.y - (lr ? lr.y : br.y))) <= 4,
        size: cs.fontSize, weight: cs.fontWeight, spacing: cs.letterSpacing,
        transform: cs.textTransform, bg: cs.backgroundColor, border: cs.borderTopWidth,
        lblSize: ls ? ls.fontSize : null,
        hit: !!mid && !!mid.closest && !!mid.closest('[data-doc-read-duty]'),
      };
    }, undefined, { err: 'blocked' });

    check('1a the switch is drawn, and it is really on the page',
      !sw.err && sw.hit === true, sw.err || `hit=${sw.hit}`);
    check('1b it sits at the right of the caption row, on the caption\'s own line',
      !sw.err && sw.gapRight >= 0 && sw.gapRight <= 6 && sw.sameRow === true,
      sw.err || `${sw.gapRight}px from the right, same row ${sw.sameRow}`);
    check('1c it wears the caption\'s register, not a button\'s',
      !sw.err && sw.weight === '400' && sw.spacing === 'normal'
        && sw.transform === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(sw.bg)
        && sw.border === '0px',
      sw.err || `${sw.size}/${sw.weight} ${sw.spacing} ${sw.transform} bg=${sw.bg} border=${sw.border}`);
    check('1d "a reading, not the contract" is the hover on the label',
      !sw.err && /a reading, not the contract|en förklaring/.test(String(sw.lblTitle || '')),
      sw.err || String(sw.lblTitle));
    check('1e and it is no longer a line of its own in that row',
      !sw.err && sw.em === 0, sw.err || `${sw.em} <em> left`);
    check('1f the count is on the face before anything is pressed',
      !sw.err && /·\s*\d/.test(sw.word), sw.err || sw.word);
    check('1g OFF at rest — Young\'s ruling',
      !sw.err && sw.pressed === 'false', sw.err || String(sw.pressed));
    await page.screenshot({ path: path.join(OUT, '01-switch-at-rest.png') });

    /* ═══════════ 2 · NOTHING IS MARKED UNTIL IT IS ASKED FOR ═══════════ */
    const rest = await drive(page, () => ({
      reading: document.querySelectorAll('.doc-read-note .dr-duty').length,
      paper: document.querySelectorAll('#doc-canvas .dr-duty-p').length,
    }), undefined, { reading: -1, paper: -1 });
    /* A CONTROL that is also the ruling: it passes at the parent because
       nothing can light there, and it has to go on passing here. */
    check('2a CONTROL — not one word is lit at rest, in either column',
      rest.reading === 0 && rest.paper === 0, `${rest.reading} reading · ${rest.paper} paper`);

    /* ═══════════ 3 · THE CONTRACT DOES NOT MOVE ═══════════
       MEASURED INSIDE THE DOCUMENT, never as a viewport top: a top measured
       against the window conflates re-flow with scrolling, which is what let
       the fill preview's own "does not move" check pass while it moved. */
    const geom = () => drive(page, () => {
      const canvas = document.getElementById('doc-canvas');
      if (!canvas) return { err: 'no canvas' };
      const base = canvas.getBoundingClientRect();
      const ps = Array.from(canvas.querySelectorAll('p,h1,h2,h3,h4'));
      return {
        h: Math.round(canvas.scrollHeight),
        w: Math.round(base.width),
        blocks: ps.map(el => { const r = el.getBoundingClientRect();
          return [Math.round(r.top - base.top), Math.round(r.height), Math.round(r.left - base.left)]; }),
        notes: Array.from(document.querySelectorAll('.doc-read-note')).map(n =>
          Math.round(n.getBoundingClientRect().top - base.top)),
      };
    }, undefined, { err: 'blocked' });

    const before = await geom();
    check('3a CONTROL — the paper has real blocks to measure',
      !before.err && before.blocks.length >= 6, before.err || `${(before.blocks || []).length} blocks`);

    /* ═══════════ 4 · ONE PRESS LIGHTS BOTH COLUMNS ═══════════ */
    await drive(page, async () => {
      const b = document.querySelector('[data-doc-read-duty]');
      if (b) b.click();
      await new Promise(r => setTimeout(r, 500));
    }, undefined, null);
    await pause(700);

    const lit = await drive(page, () => {
      const rd = Array.from(document.querySelectorAll('.doc-read-note .dr-duty'));
      const pp = Array.from(document.querySelectorAll('#doc-canvas .dr-duty-p'));
      const shot = el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        return { t: el.textContent, bg: cs.backgroundColor, shadow: cs.boxShadow,
          w: Math.round(r.width), h: Math.round(r.height),
          hit: (() => { const m = document.elementFromPoint(Math.round(r.x + r.width / 2),
            Math.round(r.y + r.height / 2)); return !!m && !!m.closest && (!!m.closest('.dr-duty') || !!m.closest('.dr-duty-p')); })() };
      };
      const btn = document.querySelector('[data-doc-read-duty]');
      const ring = btn && btn.querySelector('.dr-ring');
      return { reading: rd.map(shot), paper: pp.map(shot),
        pressed: btn ? btn.getAttribute('aria-pressed') : null,
        ringBg: ring ? getComputedStyle(ring).backgroundColor : null,
        btnColour: btn ? getComputedStyle(btn).color : null };
    }, undefined, { reading: [], paper: [] });

    check('4a the wording is lit on the contract itself',
      lit.paper.length >= 3, `${lit.paper.length} marks · ${lit.paper.map(x => x.t).join(' / ')}`);
    check('4b and the same promises are lit in the reading beside it',
      lit.reading.length >= 3, `${lit.reading.length} marks · ${lit.reading.map(x => x.t).join(' / ')}`);
    check('4c it is the ACTION WORDS, never the whole clause',
      lit.paper.length > 0 && lit.paper.every(x => x.t.trim().split(/\s+/).length <= 4),
      lit.paper.map(x => JSON.stringify(x.t)).join(' '));
    /* GATED ON SOMETHING HAVING BEEN LIT, or a build that lights nothing
       passes this by never having marked anything. */
    check('4d "shall not be liable" is never lit — a limitation is not a promise',
      lit.paper.length > 0 && ![...lit.paper, ...lit.reading].some(x => /not\s+be\s+liable/i.test(x.t)),
      [...lit.paper, ...lit.reading].map(x => x.t).join(' | ').slice(0, 140));
    check('4e the mark is PAINTED amber, not just in the markup',
      lit.paper.some(x => /rgb/.test(x.bg) && x.bg !== 'rgba(0, 0, 0, 0)' && /inset/.test(x.shadow) && x.hit === true),
      lit.paper.map(x => `${x.bg} ${x.shadow}`).join(' | ').slice(0, 160));
    check('4f both columns wear the SAME amber',
      lit.paper.length > 0 && lit.reading.length > 0 && lit.paper[0].bg === lit.reading[0].bg,
      `${(lit.paper[0] || {}).bg} vs ${(lit.reading[0] || {}).bg}`);
    check('4g the switch says it is on, and the ring fills',
      lit.pressed === 'true' && /rgb/.test(String(lit.ringBg)) && lit.ringBg !== 'rgba(0, 0, 0, 0)',
      `${lit.pressed} · ring ${lit.ringBg} · ink ${lit.btnColour}`);
    await page.screenshot({ path: path.join(OUT, '02-marks-on.png') });

    /* ═══════════ 5 · AND THE CONTRACT HAS NOT MOVED ═══════════ */
    const after = await geom();
    /* GATED, every one of them: "nothing moved" is trivially true on a page
       where nothing was marked. The claim is that the marks cost no layout,
       so the marks have to be there for it to mean anything. */
    const marked = lit.paper.length > 0;
    check('5a the wording did not move by a pixel',
      marked && !after.err && !before.err
        && JSON.stringify(after.blocks) === JSON.stringify(before.blocks),
      after.err || (JSON.stringify(after.blocks) === JSON.stringify(before.blocks)
        ? 'identical' : `${JSON.stringify(before.blocks).slice(0, 90)} → ${JSON.stringify(after.blocks).slice(0, 90)}`));
    check('5b nor did the sheet grow or shrink',
      marked && !after.err && after.h === before.h && after.w === before.w,
      after.err || `${before.h}x${before.w} → ${after.h}x${after.w}`);
    check('5c and every reading stayed level with its own clause',
      marked && !after.err && (before.notes || []).length > 0
        && JSON.stringify(after.notes) === JSON.stringify(before.notes),
      after.err || `${JSON.stringify(before.notes)} → ${JSON.stringify(after.notes)}`);

    /* ═══════════ 6 · THE MARKS COME OFF AGAIN ═══════════ */
    const paperHtml = await drive(page, () => {
      const c = document.getElementById('doc-canvas');
      return c ? c.innerHTML.length : -1;
    }, undefined, -1);
    await drive(page, async () => {
      const b = document.querySelector('[data-doc-read-duty]');
      if (b) b.click();
      await new Promise(r => setTimeout(r, 500));
    }, undefined, null);
    await pause(700);
    const off = await drive(page, () => {
      const c = document.getElementById('doc-canvas');
      const btn = document.querySelector('[data-doc-read-duty]');
      return { reading: document.querySelectorAll('.doc-read-note .dr-duty').length,
        paper: document.querySelectorAll('#doc-canvas .dr-duty-p').length,
        len: c ? c.innerHTML.length : -1,
        pressed: btn ? btn.getAttribute('aria-pressed') : null };
    }, undefined, { reading: -1, paper: -1, len: -1 });
    check('6a pressing it again puts both columns back',
      off.reading === 0 && off.paper === 0 && off.pressed === 'false',
      `${off.reading} reading · ${off.paper} paper · pressed ${off.pressed}`);
    check('6b and the drafter\'s markup is exactly as long as it was',
      off.len > 0 && off.len < paperHtml,
      `${paperHtml} with marks → ${off.len} without`);

    /* ═══════════ 7 · THE CHOICE IS REMEMBERED ═══════════ */
    await drive(page, async () => {
      const b = document.querySelector('[data-doc-read-duty]');
      if (b) b.click();
      await new Promise(r => setTimeout(r, 400));
    }, undefined, null);
    await pause(500);
    const stored = await drive(page, () => {
      let v = null; try { v = localStorage.getItem(DOC_DUTY_KEY); } catch (_) {}
      return { v, key: typeof DOC_DUTY_KEY === 'string' ? DOC_DUTY_KEY : null };
    }, undefined, { v: null, key: null });
    check('7a the choice is written to this browser, under its own key',
      stored.v === '1' && /^hati\.v1\./.test(String(stored.key)),
      `${stored.key} = ${stored.v}`);

    await page.reload({ waitUntil: 'networkidle' });
    await pause(3000);
    await drive(page, id => { openWorkspace(id); }, staged.id, null);
    await pause(1800);
    await drive(page, () => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); }, undefined, null);
    await pause(1200);
    const backOn = await drive(page, () => {
      const btn = document.querySelector('[data-doc-read-duty]');
      return { pressed: btn ? btn.getAttribute('aria-pressed') : null,
        reading: document.querySelectorAll('.doc-read-note .dr-duty').length,
        paper: document.querySelectorAll('#doc-canvas .dr-duty-p').length };
    }, undefined, { pressed: null, reading: -1, paper: -1 });
    check('7b and it survives a refresh, marks and all',
      backOn.pressed === 'true' && backOn.reading >= 1 && backOn.paper >= 1,
      `pressed ${backOn.pressed} · ${backOn.reading} reading · ${backOn.paper} paper`);
    await page.screenshot({ path: path.join(OUT, '03-remembered.png') });

    /* ═══════════ 8 · THE TWO PASSES MEET ON THE REAL APP ═══════════
       This is the one place both are loaded. f339 pins the regex's own wall;
       what is asked here is that the page they share is well formed. */
    const both = await drive(page, () => {
      const notes = Array.from(document.querySelectorAll('.doc-read-note'));
      const html = notes.map(n => n.innerHTML).join('');
      const stack = []; let bad = 0;
      for (const m of html.matchAll(/<(\/?)(\w+)[^>]*>/g)) {
        if (m[1]) { if (stack.pop() !== m[2]) bad++; } else stack.push(m[2]);
      }
      return { fig: document.querySelectorAll('.doc-read-note .br-fig').length,
        duty: document.querySelectorAll('.doc-read-note .dr-duty').length,
        nested: document.querySelectorAll('.doc-read-note .dr-duty .br-fig, .doc-read-note .br-fig .dr-duty').length,
        bad, open: stack.length };
    }, undefined, { fig: -1, duty: -1, bad: -1, open: -1 });
    check('8a the figures pass still marks its figures',
      both.fig >= 1, `${both.fig} figures`);
    check('8b the duty pass marks its duties beside them',
      both.duty >= 1, `${both.duty} duties`);
    check('8c and the two together leave the page well formed',
      both.bad === 0 && both.open === 0, `${both.bad} mismatched, ${both.open} left open`);
    check('8d neither pass marks inside the other',
      both.fig >= 1 && both.duty >= 1 && both.nested === 0, `${both.nested} nested`);

    /* ═══════════ 9 · THE OTHER COLUMN IS UNTOUCHED ═══════════ */
    await drive(page, () => { const b = document.querySelector('[data-doc-read="0"]'); if (b) b.click(); }, undefined, null);
    await pause(900);
    const back = await drive(page, () => ({
      layer: document.getElementById('doc-read') ? document.getElementById('doc-read').hidden : null,
      paper: document.querySelectorAll('#doc-canvas .dr-duty-p').length,
      right: (() => { const r = document.getElementById('doc-right');
        return r ? getComputedStyle(r).visibility : null; })(),
    }), undefined, { layer: null, paper: -1 });
    check('9a CONTROL — the reading switch still closes the column',
      back.layer === true && back.right === 'visible', `hidden ${back.layer}, cards ${back.right}`);
    check('9b and the marks leave the paper with it',
      backOn.paper >= 1 && back.paper === 0,
      `${backOn.paper} were on → ${back.paper} left behind`);

    /* ═══════════ 10 · AND IT READS IN THE DARK ═══════════
       The mark sits on the contract's own paper and inherits the paper's ink,
       so the wash has to work over whichever ground the theme paints. The dark
       amber is deliberately translucent for exactly that reason. */
    await drive(page, () => { const b = document.querySelector('[data-doc-read="1"]'); if (b) b.click(); }, undefined, null);
    await pause(1000);
    await drive(page, () => { setDark(true); }, undefined, null);
    await pause(700);
    const dark = await drive(page, () => {
      const m = document.querySelector('#doc-canvas .dr-duty-p');
      if (!m) return { err: 'nothing lit' };
      const cs = getComputedStyle(m);
      const r = m.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
      return { bg: cs.backgroundColor, ink: cs.color, shadow: cs.boxShadow,
        paperInk: getComputedStyle(m.parentElement).color,
        hit: !!hit && !!hit.closest && !!hit.closest('.dr-duty-p') };
    }, undefined, { err: 'blocked' });
    check('10a the mark is still painted in the dark theme',
      !dark.err && /rgba?\(/.test(String(dark.bg)) && dark.bg !== 'rgba(0, 0, 0, 0)'
        && /inset/.test(String(dark.shadow)) && dark.hit === true,
      dark.err || `${dark.bg} · ${dark.shadow}`);
    check('10b and it takes the paper\'s own ink, never a second one',
      !dark.err && dark.ink === dark.paperInk,
      dark.err || `${dark.ink} vs ${dark.paperInk}`);
    await page.screenshot({ path: path.join(OUT, '04-dark.png') });
    await drive(page, () => { setDark(false); }, undefined, null);

    if (blocked.length) check('nothing was blocked', false, blocked.slice(0, 3).join(' | '));
    if (errors.length) check('no page errors', false, errors.slice(0, 3).join(' | '));
    else check('no page errors', true);
  } catch (e) {
    check('the run completed', false, String(e && e.message).slice(0, 220));
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
