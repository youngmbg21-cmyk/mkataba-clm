/* Chromium verification: EVERY CONTRACT CAN BE FILLED FROM THE COLUMN
   ============================================================
   Young, 17 September 2026, over two screenshots of two contracts side by
   side: *"In image 3 and 4 there is also an issue where some fields need to be
   filled from the contract and some can be filled on the right hand side. All
   contracts should have the possibility to fill in from the right hand side
   panel like in image 4."*

   Image 4 is a contract from a LIBRARY template, which carries a declared
   field list and has had its own right-hand panel since it shipped. Image 3 is
   a contract from a BUILT-IN template, whose blanks live in the paper and were
   typable in exactly one place.

   NO NODE TEST CAN SEE ANY OF THIS. jsdom resolves no layout, so a panel that
   is drawn and one that is not are the same markup to it, and "the contract
   did not move" is a pixel measurement or it is nothing. So this file opens
   the real room in a real browser and measures:

     · the panel is DRAWN, beside the paper, on a built-in template's contract
     · every blank the page carries has a box in it, grouped by the clause it
       sits in, and the counter agrees with the page
     · typing in the panel moves THE PAPER, and typing on the paper moves the
       panel — two doors, one act, measured in both directions
     · the record's own fields go through the page's own handler, so the
       register's value really moves
     · THE CONTRACT DOES NOT MOVE A PIXEL — the first line of the wording sits
       where it sat before the panel existed (refusal 3, measured)
     · a contract carrying a declared field list still gets the OTHER panel,
       and never both

   GUARDED, so a build without the feature REPORTS its failures rather than
   timing out on a selector that will never appear.

   Run: node test/chromium/blanks-panel-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const pause = ms => new Promise(r => setTimeout(r, ms));
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

/* ---- THE DRIVEN HALVES ARE GUARDED ----
   Run against the commit before this work the panel is not drawn at all, and
   a bare page.fill on a box that will never appear sits there for thirty
   seconds and then takes the file down with a stack — so the other thirteen
   claims are never reported and nobody can see WHICH of them are new. Every
   press below goes through this, and a missing control is a failed claim with
   its reason on it. THE RULE THIS FILE IS OBEYING: a build without the feature
   REPORTS its failures rather than timing out. */
const typeInto = async (page, sel, value, ev) => {
  const there = await page.evaluate(x => !!document.querySelector(x), sel);
  if (!there) return false;
  await page.fill(sel, value);
  await page.dispatchEvent(sel, ev);
  await page.waitForTimeout(700);
  return true;
};

const openRoom = async (page, id) => {
  await page.evaluate(x => { state.activeId = x; state.selId = x; setView('workspace'); }, id);
  await page.waitForTimeout(1600);
  await page.click('#ws-tabs [data-ws-tab="docs"]').catch(() => {});
  await page.waitForTimeout(1200);
};

/* WHAT IS PAINTED, read off the rendered page and never off the source. */
const PANEL = () => {
  const host = document.getElementById('tplform-section');
  if (!host) return { there: false };
  const r = host.getBoundingClientRect();
  const boxes = [...host.querySelectorAll('[data-blankf]')].map(b => ({
    key: b.getAttribute('data-blankf'),
    label: ((b.closest('label') || {}).textContent || '').trim(),
    value: b.value,
    w: Math.round(b.getBoundingClientRect().width),
  }));
  const paper = document.getElementById('doc-canvas');
  const pr = paper ? paper.getBoundingClientRect() : null;
  /* THE FIRST LINE OF THE WORDING, which is what refusal 3 measures. */
  const firstInk = paper ? (() => {
    const p = paper.querySelector('p');
    return p ? Math.round(p.getBoundingClientRect().top) : null;
  })() : null;
  return {
    there: true,
    drawn: r.width > 2 && r.height > 2,
    x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width),
    boxes, keys: boxes.map(b => b.key),
    count: ((host.querySelector('[data-blankf-count]') || {}).textContent || '').trim(),
    heads: [...host.querySelectorAll('div')].map(d => (d.textContent || '').trim())
      .filter(t => /^\d+\.\s/.test(t)),
    filledLine: ((host.querySelector('p') || {}).textContent || '').trim(),
    /* The library form's own marker, so "never both" can be measured. */
    libraryForm: /Contract form/.test(host.textContent || '') && !host.querySelector('[data-blankf]'),
    paperX: pr ? Math.round(pr.left) : null,
    paperW: pr ? Math.round(pr.width) : null,
    firstInk,
    paperBlanks: paper ? paper.querySelectorAll('[data-field],[data-sync]').length : 0,
  };
};

const CONTRACT = (id, over) => Object.assign({
  id, name: 'Packaging Supply Agreement', counterparty: '', counterpartyEmail: '',
  party: 'Highland Corporate Ltd', folder: 'proc', status: 'Draft',
  value: 0, template: 'PK', valueType: 'estimated', fields: {},
  comments: [], rounds: [], versions: [], signatures: [], metadata: {},
  compliance: { consent: false }, audit: [],
}, over || {});

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const built = CONTRACT('MK-BF1');
  /* The other shape: a contract carrying a DECLARED field list, which is
     image 4's. Its wording is stored, so it has no blanks in the paper. */
  const lib = CONTRACT('MK-BF2', {
    name: 'Corporate Professional Services Agreement', template: null,
    redlineText: '<h1>Corporate Professional Services Agreement</h1><p>Between {{company}} and {{provider}}.</p>',
    templateForm: { templateId: 'T1', templateName: 'Corporate Professional Services', versionNumber: 1,
      fields: [{ fieldKey: 'company', label: 'Company Name', fieldType: 'text', required: true },
        { fieldKey: 'provider', label: 'Provider Name', fieldType: 'text', required: true }],
      values: {} },
  });
  /* ---- A COMPANY STANDARD WITH ONE FIELD ANSWERED AND ONE NOT (Young
     reported it 20 Sep 2026: "whenever I click on any entry field, whether
     filled in or not, it should take me to the section in the contract") ----
     Its wording is built by templateFormDocHtml, the SAME function POST
     /contracts calls, so what is measured here is the paper the product really
     writes rather than a hand-typed stand-in. `format:'rich'` because that is
     what a real one carries — without it the whole body renders escaped as
     plain text and every claim below would be measuring the fixture. */
  const TF = require('../../js/templateform.js');
  const form2 = {
    templateId: 'T2', templateName: 'Services', versionNumber: 1,
    fields: [{ fieldKey: 'company', label: 'Company Name', fieldType: 'text', required: true },
      { fieldKey: 'provider', label: 'Provider Name', fieldType: 'text', required: true }],
    values: { company: 'Highland Corporate Ltd' },
    blocks: [{ blockType: 'heading', content: 'Services Agreement', orderIndex: 0 },
      { blockType: 'fixed_text', content: 'Recitals. ' + 'Padding sentence. '.repeat(120), orderIndex: 1 },
      { blockType: 'heading', content: 'Parties', orderIndex: 2 },
      { blockType: 'field_group', content: 'Between {{company}} and {{provider}}.', orderIndex: 3 }],
  };
  const filled = CONTRACT('MK-BF3', { name: 'Services Agreement', template: null,
    status: 'Under Review', format: 'rich', templateForm: form2,
    redlineText: TF.templateFormDocHtml(form2) });
  for (const c of [built, lib, filled])
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');

    /* ============ 1. THE PANEL IS DRAWN, BESIDE THE PAPER ============ */
    await openRoom(page, built.id);
    const p = await page.evaluate(PANEL);
    check('1a the slot is on the page at all', p.there, p.there ? 'yes' : '#tplform-section missing');
    check('1b the panel is DRAWN on a built-in template\'s contract', p.drawn,
      p.there ? p.w + 'px wide' : 'not drawn');
    check('1c and it is beside the paper, not over it', p.drawn && p.paperX != null && p.x > p.paperX + p.paperW - 40,
      `panel x ${p.x}, paper ends ${p.paperX + p.paperW}`);

    /* ============ 2. EVERY BLANK THE PAGE CARRIES HAS A BOX ============ */
    check('2a one box per blank the paper draws', p.boxes.length > 0 && p.boxes.length === p.paperBlanks,
      `${p.boxes.length} boxes for ${p.paperBlanks} blanks on the paper`);
    check('2b including the two this template declares nowhere',
      p.keys.includes('forecastWeeks') && p.keys.includes('safetyDays'),
      p.keys.join(', '));
    check('2c and the record\'s own two, so the column can answer them too',
      p.keys.includes('counterparty') && p.keys.includes('value'), p.keys.join(', '));
    check('2d grouped by the clause each sits in', p.heads.length >= 2, p.heads.join(' | '));
    /* RE-POINTED (21 Sep 2026): the counter reads "N of M" now. */
    check('2e the counter agrees with the page', /^\d+ \S+ \d+$/.test(p.count)
      && Number(p.count.split(/\s+/)[2]) === p.boxes.length, p.count);

    /* ============ 3. TWO DOORS, ONE ACT — PANEL TO PAPER ============ */
    const drove = await typeInto(page, '#tplform-section [data-blankf="forecastWeeks"]', '11', 'change');
    const toPaper = drove ? await page.evaluate(() => ({
      paper: (document.querySelector('#doc-canvas [data-field="forecastWeeks"]') || {}).value,
      record: (state.contracts.find(x => x.id === 'MK-BF1') || { fields: {} }).fields.forecastWeeks,
      count: ((document.querySelector('[data-blankf-count]') || {}).textContent || '').trim(),
    })) : { paper: null, record: null, count: null };
    check('3a typing in the panel moves the paper', toPaper.paper === '11', 'paper reads ' + toPaper.paper);
    check('3b and the record, through the one act', String(toPaper.record) === '11', 'record reads ' + toPaper.record);
    /* MEASURED ON A BLANK THAT IS REALLY OPEN. Written first against
       forecastWeeks this check failed and the product was right: that blank
       carries the drafting's own default (`N('forecastWeeks',8)` draws 8), so
       it was never open and filling it could not move a counter of open
       blanks. packType is the one with nothing in it. */
    const droveOpen = await typeInto(page, '#tplform-section [data-blankf="packType"]', 'PET preforms', 'change');
    const counted = droveOpen ? await page.evaluate(() =>
      ((document.querySelector('[data-blankf-count]') || {}).textContent || '').trim()) : null;
    check('3c and the counter moves when an OPEN blank is answered', !!counted && counted !== p.count,
      p.count + ' → ' + counted);

    /* ============ 4. AND PAPER TO PANEL ============ */
    await typeInto(page, '#doc-canvas [data-field="payDays"]', '45', 'input');
    const toPanel = await page.evaluate(() => ({
      box: (document.querySelector('#tplform-section [data-blankf="payDays"]') || {}).value,
      record: (state.contracts.find(x => x.id === 'MK-BF1') || { fields: {} }).fields.payDays,
    }));
    check('4a typing on the paper moves the panel', toPanel.box === '45', 'panel reads ' + toPanel.box);
    check('4b and neither door wrote twice', toPanel.record === '45', 'record reads ' + toPanel.record);

    /* A RECORD FIELD GOES THROUGH THE PAGE'S OWN HANDLER, so the value the
       register reads really moves — the panel writes no record field itself. */
    await typeInto(page, '#tplform-section [data-blankf="counterparty"]', 'Juno LLC', 'change');
    const rec = await page.evaluate(() => {
      const c = state.contracts.find(x => x.id === 'MK-BF1') || {};
      return { cp: c.counterparty, fields: (c.fields || {}).counterparty };
    });
    check('4c a record field reaches the record, not c.fields', rec.cp === 'Juno LLC' && rec.fields === undefined,
      `counterparty ${rec.cp}, c.fields.counterparty ${rec.fields}`);

    /* ============ 5. THE CONTRACT DID NOT MOVE ============
       Refusal 3 is a NUMBER, so it is measured as one — and on the SAME paper
       with and without the panel, which is the only comparison that means
       anything. A first draft measured the OTHER contract's paper and read
       null: two papers are not a before and after. */
    const withPanel = await page.evaluate(PANEL);
    const without = await page.evaluate(() => {
      const host = document.getElementById('tplform-section');
      const was = host ? host.style.display : null;
      if (host) host.style.display = 'none';
      const paper = document.getElementById('doc-canvas');
      const q = paper && paper.querySelector('p');
      const out = { firstInk: q ? Math.round(q.getBoundingClientRect().top) : null,
        paperW: paper ? Math.round(paper.getBoundingClientRect().width) : null };
      if (host) host.style.display = was;
      return out;
    });
    check('5a the first line of the wording sits where it sat without the panel',
      withPanel.firstInk != null && without.firstInk != null
        && Math.abs(withPanel.firstInk - without.firstInk) <= 2,
      `${without.firstInk} without → ${withPanel.firstInk} with`);
    check('5b and the paper is the same width', withPanel.paperW === without.paperW,
      `${without.paperW} → ${withPanel.paperW}`);

    /* ============ 6. ONE SLOT, NEVER BOTH PANELS ============ */
    await openRoom(page, lib.id);
    const l = await page.evaluate(PANEL);
    check('6a a declared field list still gets ITS panel', l.libraryForm, l.libraryForm ? 'the library form' : 'not drawn');
    check('6b and never the other one as well', l.boxes.length === 0, l.boxes.length + ' blank boxes');

    /* ============ 9. THE CURSOR AND THE PAPER (Young ruled 17 Sep 2026,
       "Image 4 = as recommended") ============
       MEASURED with a REAL CLICK into a real box. The whole claim is about
       what a reader SEES when they put a cursor somewhere, and jsdom resolves
       no layout, so nothing in f329 could tell a lit word from an unlit one.
       Back on the contract that has ordinary blanks. */
    await openRoom(page, built.id);
    const boxes9 = await page.$$('#tplform-section [data-blankf]');
    if (!boxes9.length){
      for (const [n, what] of [['9a', 'a cursor in a box lights its word on the paper'],
        ['9b', 'exactly one word is lit'], ['9c', 'the contract does not move a pixel'],
        ['9d', 'leaving the box puts the light out'],
        ['9e', 'a cursor on the paper lights the box, and does not steal the caret']])
        check(n + ' ' + what, false, 'no panel box on this build');
    } else {
      /* ---- WHAT "THE CONTRACT DOES NOT MOVE" MEANS, AND WHAT IT DOES NOT
         (re-pointed 17 Sep 2026) ----
         The first draft measured the first paragraph's VIEWPORT top and called
         it unchanged. That conflated two different claims and the wrong one
         won: the paper must not RE-FLOW (the light is an outline and a wash,
         which cost no layout), but it absolutely must SCROLL — the owner's
         words, "the contract should move to where that field is". The old
         claim passed because a guard that was always false meant no scroll
         ever ran. So layout is measured INSIDE the document, where scrolling
         cannot reach it, and the scroll gets a claim of its own below. */
      const inkBefore9 = await page.evaluate(() => {
        const q = document.querySelector('#doc-canvas p');
        const paper = document.getElementById('doc-canvas');
        return q ? { top: q.offsetTop, w: Math.round(paper.getBoundingClientRect().width) } : null; });
      await boxes9[0].click(); await pause(250);
      const lit = await page.evaluate(() => {
        const all = [...document.querySelectorAll('.is-fieldlit')];
        const onPaper = all.filter(e => e.closest('#doc-canvas'));
        const q = document.querySelector('#doc-canvas p');
        const cs = onPaper[0] ? getComputedStyle(onPaper[0]) : null;
        return { n: all.length, paper: onPaper.length,
          tag: onPaper[0] ? onPaper[0].tagName + '.' + onPaper[0].className : null,
          outline: cs ? cs.outlineWidth : null, ostyle: cs ? cs.outlineStyle : null, greenBg: (() => { const e = document.createElement('i'); e.style.background = 'var(--st-green-bg)'; document.body.appendChild(e); const c = getComputedStyle(e).backgroundColor; e.remove(); return c; })(),
          ocolor: cs ? cs.outlineColor : null, bg: cs ? cs.backgroundColor : null,
          ink: q ? { top: q.offsetTop,
            w: Math.round(document.getElementById('doc-canvas').getBoundingClientRect().width) } : null };
      });
      check('9a a cursor in a box lights its word on the paper',
        lit.paper === 1, JSON.stringify(lit));
      /* ---- AND THE RING IS REALLY PAINTED ----
         The first draft of this check asked only whether the class was ON the
         element, and it passed while the ring was not drawn at all: the
         paper's blanks carry `.field`, which states outline:none at the same
         one-class weight and later in the sheet, so the computed style read
         `none` while the source read `2px solid`. A class is not a pixel. */
      check('9a2 the ring is PAINTED, not just the class applied',
        lit.ostyle === 'solid' && lit.outline === '2px', `${lit.outline} ${lit.ostyle} ${lit.ocolor}`);
      /* THE GREEN IS THE TOKEN'S (re-pointed 20 Sep 2026 when the redesign
         order moved --st-green-bg to the reference's #DFF2E7): resolved on the
         page and compared as a relation, never a number typed here. */
      check('9a3 and the wash is the product\'s own "this just arrived" green',
        lit.bg === lit.greenBg, `${lit.bg} vs --st-green-bg ${lit.greenBg}`);
      check('9b exactly one word is lit — a reader tabbing down leaves no trail',
        lit.n === 1, 'lit ' + lit.n);
      check('9c THE CONTRACT DOES NOT RE-FLOW BY A PIXEL',
        inkBefore9 != null && lit.ink != null && lit.ink.top === inkBefore9.top
          && lit.ink.w === inkBefore9.w,
        `${JSON.stringify(inkBefore9)} → ${JSON.stringify(lit.ink)}`);
      /* LEAVING PUTS IT OUT. */
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await pause(250);
      /* IT ASKS THAT SOMETHING WAS LIT FIRST. "The light goes out" is satisfied
         by a build that never lights anything, which is a description. */
      const out9 = await page.evaluate(() => document.querySelectorAll('.is-fieldlit').length);
      check('9d leaving the box puts the light out',
        lit.n === 1 && out9 === 0, `${lit.n} lit → ${out9}`);
      /* ---- AND THE PAPER GOES THERE (Young reported it 17 Sep 2026: "when I
         am filling in the field or when my cursor is in the field, the
         contract should move to where that field is") ----
         Driven on the LAST box, which is furthest down the wording — the fault
         only shows on a field that is not already on screen. MEASURED before
         the fix: doc-scroll's scrollTop stayed 0 for a field 781px down. */
      const low9 = await page.evaluate(() => {
        const sc = document.getElementById('doc-scroll');
        if (sc) sc.scrollTop = 0;
        if (document.activeElement) document.activeElement.blur();
        const boxes = [...document.querySelectorAll('#tplform-section [data-blankf]')];
        const last = boxes[boxes.length - 1];
        return { key: last ? last.getAttribute('data-blankf') : null,
          doc: sc ? sc.scrollTop : null,
          shell: (document.getElementById('content-scroll') || {}).scrollTop, win: window.scrollY };
      });
      if (!low9.key){
        check('9f a cursor in a field low on the paper scrolls the contract to it', false, 'no box');
      } else {
        await page.click(`#tplform-section [data-blankf="${low9.key}"]`); await pause(500);
        const moved9 = await page.evaluate(() => {
          const sc = document.getElementById('doc-scroll');
          const lit = document.querySelector('#doc-canvas .is-fieldlit');
          const r = lit ? lit.getBoundingClientRect() : null;
          const s = sc ? sc.getBoundingClientRect() : null;
          return { doc: sc ? sc.scrollTop : null,
            shell: (document.getElementById('content-scroll') || {}).scrollTop, win: window.scrollY,
            inView: r && s ? (r.top >= s.top && r.bottom <= s.bottom) : null };
        });
        check('9f a cursor in a field low on the paper scrolls the contract to it',
          moved9.doc > low9.doc, `${low9.doc} → ${moved9.doc}`);
        check('9f2 and the word is on screen when it gets there',
          moved9.inView === true, String(moved9.inView));
        /* IT SCROLLS THE PAPER'S OWN SCROLLER AND NOTHING ELSE. */
        check('9f3 the shell and the window stay exactly where they were',
          moved9.shell === low9.shell && moved9.win === low9.win,
          `shell ${low9.shell}→${moved9.shell} · window ${low9.win}→${moved9.win}`);
      }

      /* AND THE OTHER WAY ROUND. The paper's own input takes the caret and the
         PANEL lights — the caret must not be taken back off the paper. */
      const pin = await page.$('#doc-canvas input[data-field], #doc-canvas input[data-sync]');
      if (!pin){
        check('9e a cursor on the paper lights the box, and does not steal the caret',
          false, 'no input on this paper');
      } else {
        await pin.click(); await pause(250);
        const back = await page.evaluate(() => {
          const all = [...document.querySelectorAll('.is-fieldlit')];
          const a = document.activeElement;
          return { inPanel: all.filter(e => e.closest('#tplform-section')).length,
            onPaper: all.filter(e => e.closest('#doc-canvas')).length,
            caretOnPaper: !!(a && a.closest && a.closest('#doc-canvas')) };
        });
        check('9e a cursor on the paper lights the box, and does not steal the caret',
          back.inPanel === 1 && back.caretOnPaper === true, JSON.stringify(back));
      }
    }

    /* ============ 7. AND IT STOPS WHEN TYPING IS OVER ============ */
    await page.evaluate(() => {
      const c = state.contracts.find(x => x.id === 'MK-BF1');
      c.status = 'Under Review';
    });
    await openRoom(page, built.id);
    const sealed = await page.evaluate(PANEL);
    check('7a out of Draft the panel is not drawn', !sealed.drawn || sealed.boxes.length === 0,
      sealed.boxes.length + ' boxes');

    /* ═══ 10 · AN ANSWERED FIELD IS STILL A FIELD ═══
       MEASURED at the parent: the paper carried a key for the EMPTY blank and
       nothing at all for the answered one, so the link pointed at half the
       form's boxes and was silent on the rest. */
    await openRoom(page, filled.id);
    const cs = await page.evaluate(() => {
      const panel = document.getElementById('tplform-section');
      const canvas = document.getElementById('doc-canvas');
      const boxes = panel ? [...panel.querySelectorAll('[data-tplf]')] : [];
      const c = getContract(state.activeId);
      const out = boxes.map(b => {
        const key = window.contractFieldKeyOf ? contractFieldKeyOf(b, c) : '';
        return { key, peer: !!(key && window.contractFieldPeer && contractFieldPeer(key, 'paper')) };
      });
      const done = canvas ? canvas.querySelector('span.hati-field-done[data-field-key]') : null;
      const blank = canvas ? canvas.querySelector('span.hati-field[data-field-key]') : null;
      const near = done && done.parentElement ? done.parentElement : null;
      const g = el => el ? getComputedStyle(el) : null;
      const dg = g(done), pg = g(near);
      return { boxes: out,
        keyed: canvas ? canvas.querySelectorAll('[data-field-key]').length : 0,
        doneText: done ? (done.textContent || '').trim() : null,
        blankText: blank ? (blank.textContent || '').trim() : null,
        /* THE ANSWERED TERM IS PAINTED AS PART OF ITS SENTENCE, never as a gap. */
        sameInk: !!(dg && pg && dg.color === pg.color),
        noBox: !!(dg && (dg.backgroundColor === 'rgba(0, 0, 0, 0)' || dg.backgroundColor === 'transparent')),
        blankBoxed: !!(g(blank) && g(blank).backgroundColor !== 'rgba(0, 0, 0, 0)') };
    });
    check('10a GATE — the form draws a box for each field',
      cs.boxes.length === 2, cs.boxes.map(b => b.key).join(',') || 'none');
    check('10b the ANSWERED field has its word on the paper',
      cs.doneText === 'Highland Corporate Ltd', String(cs.doneText));
    check('10c CONTROL — and the unanswered one still has its blank',
      cs.blankText === 'Provider Name', String(cs.blankText));
    check('10d EVERY box finds its word, filled in or not',
      cs.boxes.length === 2 && cs.boxes.every(b => b.peer),
      cs.boxes.map(b => b.key + ':' + (b.peer ? 'found' : 'MISSING')).join(' · '));
    check('10e an answered term is painted as part of its sentence, not as a gap',
      cs.sameInk && cs.noBox && cs.blankBoxed,
      `answered same ink ${cs.sameInk} · no box ${cs.noBox} · blank still boxed ${cs.blankBoxed}`);
    /* AND THE PRESS REALLY MOVES THE PAPER — the field paragraph is far down. */
    const jump = await page.evaluate(async () => {
      const s = document.getElementById('doc-scroll');
      const b = document.querySelector('#tplform-section [data-tplf]');
      if (!s || !b) return null;
      s.scrollTop = 0;
      b.focus();
      await new Promise(r => setTimeout(r, 400));
      const el = document.querySelector('#doc-canvas .is-fieldlit');
      const sr = s.getBoundingClientRect(), er = el ? el.getBoundingClientRect() : null;
      return { top: s.scrollTop, range: s.scrollHeight - s.clientHeight, lit: !!el,
        inView: !!(er && er.top >= sr.top - 2 && er.bottom <= sr.bottom + 2) };
    });
    check('10f GATE — the paper is long enough to have somewhere to scroll',
      !!jump && jump.range > 100, jump ? 'range ' + jump.range : 'not measured');
    check('10g pressing the ANSWERED field takes the paper to its word',
      !!jump && jump.lit && jump.top > 0 && jump.inView,
      jump ? `scrolled to ${jump.top} · lit ${jump.lit} · in view ${jump.inView}` : 'not measured');

    check('8 no page errors anywhere in the journey', errors.length === 0, errors.join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  if (pass !== results.length) {
    console.log('FAILED:');
    results.filter(r => !r.pass).forEach(r => console.log('  - ' + r.name));
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
