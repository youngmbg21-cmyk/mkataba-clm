/* upload-blanks-verify — THE BLANKS IN A DOCUMENT SOMEBODY SENT US, ON A REAL
   PAGE (Young ruled it 20 September 2026: "build it", item 9)
   ============================================================
   f342 pins the reading, the refusals and the walls. Four things only a
   painted page can answer, and each of them is the reason this file exists:

     · the marks really land ON THE WORDING and nowhere else — the signature
       foot of a received document is ruled with underscores and is NOT a
       blank in the agreement, and only a rendered page knows where that foot
       begins
     · the panel really draws beside the received paper
     · typing in the panel really changes the word printed on the document
     · THE CONTRACT DOES NOT MOVE BY A PIXEL. The marks are spans written
       into the drafter's own text nodes, so a padding or a heavier weight
       would move their wording. Measured with the marks off and on.

   AND THE ONE CLAIM THAT IS THE WHOLE DESIGN: the keys read off the STORED
   wording and the keys painted on the PAGE are the same set, in the same
   order. The read walks the source and the paint walks the canvas, and they
   are only one reading for as long as that holds.

   EVERY DRIVEN HALF IS GUARDED: run against the commit before this work no
   panel and no mark is drawn at all, and a bare fill on a box that will never
   appear takes the file down with a stack rather than reporting which claims
   are new.

   39 checks, 29 of them red against the commit before this work (section 8 is
   item 9's third shape, added 20 Sep 2026 — 10 checks, all 10 red there).
   SECTION 9 (26 Sep 2026) is a file THEY sign: the Signing tab's own door is
   pressed and the panel, the marks and the arrival tile stand down, then come
   back with the answer kept. 10 checks, 3 red against the commit before it
   (9b, 9c, 9g — it prints "5 boxes · heading Blanks in this document", the
   owner's report). 9a is the GATE; 9d–9f and 9h–9j are CONTROLS: they hold
   on both sides — before, because nothing ever went away; after, as the
   proof that standing down deletes nothing, moves nothing, and comes back. The three
   that pass are a named GATE and two named CONTROLS. Every claim an empty
   page would satisfy is gated, because "nothing is marked here" is true of a
   build that marks nothing anywhere.

   Run: node test/chromium/upload-blanks-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, ckOpenRowOf } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
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

const typeInto = async (page, sel, value, ev) => {
  const there = await page.evaluate(x => !!document.querySelector(x), sel);
  if (!there) return false;
  /* an answered box sits in the "Show N filled" fold: opened first */
  await page.evaluate(x => { const d = document.querySelector(x).closest('details');
    if (d && !d.open) d.querySelector('summary').click(); }, sel);
  /* THE CHECKLIST (22 Oct 2026): its row is opened first, as a person would */
  await ckOpenRowOf(page, sel);
  await page.fill(sel, value);
  await page.dispatchEvent(sel, ev);
  await page.waitForTimeout(800);
  return true;
};

/* RE-POINTED 12 Oct 2026: the blanks panel is the room's Details tab
   (#tplform-section, owner) beside the room's paper (#doc-canvas). */
/* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the Details tab
   went home. Its twin is Jambo's Fill in face beside Home's paper — opened by
   its direct door pdFillOpen — whose form (the same paintContractForm) is
   drawn into #pd-fill, beside the paper #ig-canvas. Home holds no
   state.activeId for the paper's contract, so every reading below asks the
   paper's own contract (pdContract) first. */
/* RE-POINTED 21 Oct 2026 (the Legora way, owner 20 Oct 2026): the Fill in face is gone — pdFillOpen
   lands on the Dossier, where Still owed is a review grid (#pd-og) and each blank is one of its rows,
   its box the same blankFormInputHtml ([data-blankf]). The panel below is that card (#pd-needs). */
const openRoom = async (page, id) => {
  for (let t0 = Date.now(); Date.now() - t0 < 10000;) {
    if (await page.evaluate(x => state.view === 'dashboard' && !!(window.pdContract && pdContract() && pdContract().id === x)
      && !!document.querySelector('#ig-canvas') && !!document.querySelector('#ig-dock #pd-needs'), id)) break;
    await page.evaluate(x => { if (document.getElementById('cd-page') && window.closeModal) closeModal(); pdFillOpen(x); }, id);
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !!document.querySelector('#pd-og [data-blankf]'), null, { timeout: 2500 }).catch(() => {});
};
/* the contract room, for its Overview and Signing tabs */
const openContractRoom = async (page, id) => {
  await page.evaluate(x => { if (state.view !== 'workspace' || state.activeId !== x) openWorkspace(x, { room: true }); }, id);
  await page.waitForFunction(() => !!document.querySelector('#ws-tabs'), null, { timeout: 8000 }).catch(() => {});
};

/* ---- THE DOCUMENT, AS RECEIVED PAPER REALLY COMES ----
   Two named placeholders (one said twice), a brace placeholder, a ruled line
   in the wording — and, at the foot, the thing that must NOT become a box: a
   signature block ruled with underscores. A stand-in without that foot would
   make the scope claim a description. */
const WORDING = [
  '<h1>DISTRIBUTION AGREEMENT</h1>',
  '<h4>1. Parties</h4>',
  '<p>This Agreement is made between [Insert Company Name] of [Registered Address]',
  ' and the Distributor. [Insert Company Name] shall appoint a contact.</p>',
  '<h4>2. Term</h4>',
  '<p>Commencing on {{effective_date}} and running for [1] year.</p>',
  '<p>Delivery address: ________</p>',
  '<h4>3. Signature</h4>',
  '<p>Signed for and on behalf of the parties:</p>',
  '<p>____________________</p>',
  '<p>Name and title</p>',
].join('');

/* WHAT IS PAINTED, read off the rendered page and never off the source. */
const SEEN = () => {
  const canvas = document.getElementById('ig-canvas');
  const host = document.getElementById('pd-og');
  const wording = canvas ? canvas.querySelector('[data-upwording]') : null;
  const marks = canvas ? [...canvas.querySelectorAll('span.up-blank')] : [];
  const boxes = host ? [...host.querySelectorAll('[data-blankf]')] : [];
  /* RE-POINTED 17 Oct 2026 (round 8, "Owed first"): the questions' host is laid flat in Fill in's worklist, so the face is what is drawn */
  /* RE-POINTED 23 Oct 2026 (Spine): Needs you takes no box (its rows stand under their stages); the panel is measured by the Fill in stage's line */
  /* RE-POINTED 24 Oct 2026 (Round 4, owner's "mix"): the stages are one line across; the Fill in stage's mark on it */
  const card = document.querySelector('#ig-dock .ds-ln-st[data-ds-focus="fill"]') || document.querySelector('#ig-dock .ds-sp-st[data-ds-sp="fill"]');
  const pr = host && card ? card.getBoundingClientRect() : null;
  const cr = canvas ? canvas.getBoundingClientRect() : null;
  /* THE GEOMETRY OF THE WORDING, block by block — this is what says the marks
     cost the contract nothing. Rounded to whole pixels; sub-pixel reflow of a
     wash is not a move. */
  const blocks = wording ? [...wording.querySelectorAll('p,h1,h4')].map(el => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.top), Math.round(r.height)].join(':');
  }) : [];
  return {
    canvas: !!canvas, wording: !!wording,
    /* WHICH COPY the paper beside the panel is (RE-POINTED 14 Oct 2026, stage
       5): Home's one paper is the working copy beside Fill in and the signing
       copy beside Before you sign, and the marks belong to the working copy. */
    copy: (canvas && canvas.closest('.pg-sheet') && canvas.closest('.pg-sheet').getAttribute('data-copy')) || null,
    markKeys: marks.map(m => m.getAttribute('data-upblank')),
    markText: marks.map(m => (m.textContent || '').trim()),
    /* PAINTED, not merely present: a rect is not a painted pixel. */
    markDrawn: marks.filter(m => { const r = m.getBoundingClientRect(); return r.width > 1 && r.height > 1; }).length,
    /* IS EVERY MARK INSIDE THE WORDING? The signature foot is outside it. */
    marksInWording: marks.every(m => !!(wording && wording.contains(m))),
    panel: !!host, panelW: pr ? Math.round(pr.width) : null,
    panelX: pr ? Math.round(pr.left) : null,
    canvasRight: cr ? Math.round(cr.left + cr.width) : null,
    /* RE-POINTED 23 Oct 2026 (Spine): the card's head is the Fill in stage's name, its count that line's "N to do" */
    panelHead: host && card ? ((card.querySelector('b') || {}).textContent || '').trim() : '',
    /* each blank row says where it stands on the paper (pdOgFromHtml), never a cell of its own */
    blankRows: host ? [...host.querySelectorAll('tr.pd-og-row[data-pd-og-kind="blank"]')].length : 0,
    boxKeys: boxes.map(b => b.getAttribute('data-blankf')),
    boxLabels: boxes.map(b => { const tr = b.closest('tr'); return ((tr && tr.querySelector('.pd-og-f b')) || {}).textContent || ''; }).map(t => t.trim()),
    /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): the number stands beside "Needs you" */
    count: host && card ? ((card.querySelector('.ds-ln-sub, .ds-sp-v') || {}).textContent || '').trim() : '',   /* RE-POINTED 24 Oct 2026 (Round 4): the line's count */
    blocks,
    /* WHAT SITS ON THE CANVAS BUT OUTSIDE THE AGREEMENT — HaTi's own signature
       block and the seal card. The scope claim is about these. */
    outsideRules: canvas ? [...canvas.querySelectorAll('*')]
      .filter(el => !(wording && wording.contains(el)) && el.children.length === 0
        && /_{3,}|\[[^\]<>]{2,60}\]/.test(el.textContent || '')).length : 0,
    outsideMarks: canvas ? [...canvas.querySelectorAll('span.up-blank')]
      .filter(m => !(wording && wording.contains(m))).length : 0,
    /* WHAT THE READING ITSELF SAYS, so the page and the record can be compared. */
    seq: (window.uploadBlankSeq ? uploadBlankSeq(getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId)) : []).map(x => x.key),
    stored: (getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).redlineText || '',
  };
};

const CONTRACT = (id, over) => Object.assign({
  id, name: 'Distribution Agreement', counterparty: 'Acme Distribution AB',
  counterpartyEmail: 'legal@acme.example', party: 'Highland Corporate Ltd',
  folder: 'proc', status: 'Under Review', source: 'upload', format: 'rich',
  value: 0, template: null, fields: {}, redlineText: WORDING,
  /* THE FILE NAME IS A REAL ONE, AND IT IS THE SCOPE CLAIM'S OWN STAGE: it
     carries a bracket, it is printed on the file strip, and that strip sits on
     this canvas OUTSIDE the agreement. An unscoped walk would offer a box for
     it. */
  upload: { fileName: 'distribution_[Draft Name]_v2.docx', fileHash: 'ub01',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  comments: [], rounds: [], versions: [], signatures: [], metadata: {},
  compliance: { consent: false }, audit: [],
}, over || {});

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const up = CONTRACT('MK-UB1');
  /* A WORD FORM: the gaps are FIELDS the file stated, not patterns in the text
     (item 9's third shape, 20 Sep 2026). `Enter buyer name` is ordinary
     wording to look at — only the span says it is a gap. */
  const NB = '\u00a0\u00a0\u00a0\u00a0\u00a0';
  const FORM_WORDING = [
    '<h1>SERVICES AGREEMENT</h1>',
    '<h4>1. Parties</h4>',
    '<p>This Agreement is made with <span class="hati-wfield" data-wfield="buyer_name">Enter buyer name</span>',
    ' of <span class="hati-wfield" data-wfield="registered_address">Click or tap here to enter text.</span>.</p>',
    '<h4>2. Fee</h4>',
    '<p>The Seller is Acme Trading Ltd and the fee is ',
    '<span class="hati-wfield" data-wfield="fee">' + NB + '</span>.</p>',
  ].join('');
  const form = CONTRACT('MK-UB3', { name: 'Services Agreement (Word form)', redlineText: FORM_WORDING });

  /* THE CONTROL CONTRACT: the same document, already redlined once. Past that
     line the wording is the workspace's and nothing here may draw. */
  const edited = CONTRACT('MK-UB2', { name: 'Distribution Agreement (edited)',
    changes: [{ id: 'CHG-001', type: 'modify', clauseId: 'cl_1', status: 'pending' }] });
  /* A RULED LINE INSIDE SQUARE BRACKETS (the owner's list, 27 Sep 2026: "Made
     effective as of ["). Its own contract, so no count above moves. */
  const bracketed = CONTRACT('MK-UB4', { name: 'Supply Agreement (bracketed date)', redlineText: [
    '<h1>SUPPLY AGREEMENT</h1>',
    '<h4>1. Parties</h4>',
    '<p>This Agreement is made effective as of [________] between Kijani Foods Ltd and Highland Corporate Ltd.</p>',
  ].join('') });
  for (const c of [up, form, edited, bracketed])
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');

    /* ============ 1. THE MARKS ARE ON THE WORDING ============ */
    await openRoom(page, up.id);
    const s = await page.evaluate(SEEN);
    check('1a the received document draws its wording in a named container',
      s.canvas && s.wording, s.canvas ? (s.wording ? 'yes' : 'no [data-upwording]') : 'no canvas');
    check('1b its placeholders are MARKED on the page', s.markKeys.length >= 4,
      s.markKeys.length + ' marks: ' + s.markKeys.join(', '));
    check('1c and the marks are PAINTED, not merely in the markup',
      s.markKeys.length > 0 && s.markDrawn === s.markKeys.length,
      s.markDrawn + ' of ' + s.markKeys.length + ' have a painted box');
    check('1d EVERY mark is inside the wording', s.markKeys.length > 0 && s.marksInWording,
      s.marksInWording ? 'yes' : 'a mark landed outside the agreement');
    /* THE SCOPE IS THE CLAIM, and it is about HaTi's OWN furniture rather than
       about the drafter's words: a ruled line the other side typed under their
       own "Signature" heading IS a blank in their document and is marked (the
       first build's test said otherwise and the product was right). What may
       never be marked is the signature block, the file strip and the seal card
       HaTi draws AROUND the agreement — they are outside [data-upwording]. */
    check('1e GATE — the canvas really carries something an unscoped walk would take',
      s.outsideRules > 0, s.outsideRules + ' candidates outside the agreement');
    check('1e2 HATI\'S OWN FURNITURE IS NEVER MARKED, however it is ruled or named',
      s.markKeys.length > 0 && s.outsideRules > 0 && s.outsideMarks === 0,
      s.outsideMarks + ' marks outside the agreement, over '
      + s.outsideRules + ' candidates of our own');
    check('1e3 and no box is offered for the file name',
      s.boxKeys.length > 0 && !s.boxKeys.some(k => /draft_name/.test(k || '')), s.boxKeys.join(', '));
    check('1f a list marker on the page is still not a blank',
      s.markText.length > 0 && !s.markText.includes('[1]'), s.markText.join(' | '));

    /* ============ 2. THE PAGE AND THE RECORD ARE ONE READING ============ */
    check('2a the keys painted on the page are the keys read off the stored wording',
      s.seq.length > 0 && s.markKeys.join('|') === s.seq.join('|'),
      'page: ' + s.markKeys.join(',') + '  ·  record: ' + s.seq.join(','));
    check('2b a name said twice is marked twice and boxed once',
      s.markKeys.filter(k => k === 'up_insert_company_name').length === 2
      && s.boxKeys.filter(k => k === 'up_insert_company_name').length === 1,
      'marks ' + s.markKeys.filter(k => k === 'up_insert_company_name').length
      + ', boxes ' + s.boxKeys.filter(k => k === 'up_insert_company_name').length);

    /* ============ 3. THE PANEL ============ */
    check('3a the panel is DRAWN on a received document', s.panel && s.panelW > 2,
      s.panel ? s.panelW + 'px' : '#pd-og missing');
    check('3b beside the paper, never over it',
      s.panelW > 2 && s.canvasRight != null && s.panelX > s.canvasRight - 40,
      `panel x ${s.panelX}, paper ends ${s.canvasRight}`);
    /* RE-POINTED 21 Oct 2026: the card is Still owed (no "Blanks in this document" heading, no hover
       of its own); each blank is a row of the grid, one per question */
    check('3c the blanks stand under the Fill in stage, one row each', /^fill( in)?$/i.test(s.panelHead) /* RE-POINTED 24 Oct 2026 (Round 4): the line says "Fill" */ && s.blankRows === s.boxKeys.length, `${s.panelHead} · ${s.blankRows} rows`);
    check('3e one box per question', s.boxKeys.length >= 4, s.boxKeys.join(', '));
    check('3f a ruled line is labelled by the words in front of it',
      s.boxLabels.some(l => /Delivery address/i.test(l)), s.boxLabels.join(' | '));
    /* RE-POINTED (21 Sep 2026): the counter reads "N of M" now. */
    check('3g the counter counts at least the boxes on the page',
      /\d+/.test(s.count) && Number((s.count.match(/\d+/) || [0])[0]) >= s.boxKeys.length, s.count);

    /* ============ 4. TYPING IN THE PANEL CHANGES THE PAGE ============ */
    const drove = await typeInto(page, '#pd-og [data-blankf="up_insert_company_name"]',
      'Highland Corporate Ltd', 'change');
    const after = drove ? await page.evaluate(() => {
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      const marks = [...document.querySelectorAll('#ig-canvas span.up-blank[data-upblank="up_insert_company_name"]')];
      return {
        text: marks.map(m => (m.textContent || '').trim()),
        filled: marks.filter(m => m.classList.contains('is-filled')).length,
        record: (c.fields || {}).up_insert_company_name,
        stored: c.redlineText,
        /* RE-POINTED 23 Oct 2026 (Spine): the count is the Fill in stage's own ("N to do") */
        count: ((document.querySelector('#ig-dock .ds-ln-st[data-ds-focus="fill"] .ds-ln-sub, #ig-dock .ds-sp-st[data-ds-sp="fill"] .ds-sp-v') || {}).textContent || '').trim(),
      };
    }) : null;
    check('4a the box was there to type in', drove, drove ? 'yes' : 'no box');
    check('4b EVERY occurrence on the page reads back the answer',
      !!after && after.text.length === 2 && after.text.every(t => t === 'Highland Corporate Ltd'),
      after ? after.text.join(' | ') : 'not driven');
    check('4c and each says it is answered', !!after && after.filled === 2,
      after ? after.filled + ' marked filled' : 'not driven');
    check('4d the answer is on the record', !!after && after.record === 'Highland Corporate Ltd',
      after ? String(after.record) : 'not driven');
    check('4e THE RECEIVED DOCUMENT IS NOT REWRITTEN',
      !!after && after.stored === s.stored && /\[Insert Company Name\]/.test(after.stored),
      after ? (after.stored === s.stored ? 'byte-identical' : 'THE WORDING MOVED') : 'not driven');
    /* RE-POINTED 21 Oct 2026 (the Legora way): the grid is never repainted under a hand (pdOgHolds) —
       the row's Confirm is the answer's press, and the count moves on it */
    const n1 = drove ? await page.evaluate(async () => { const b = document.querySelector('#pd-og [data-pd-og-ok="up_insert_company_name"]'); if (b) b.click();
      await new Promise(r => setTimeout(r, 700)); return ((document.querySelector('#ig-dock .ds-sp-st[data-ds-sp="fill"] .ds-sp-v') || {}).textContent || '').trim(); }) : '';
    check('4f the counter moved once the row was confirmed', !!after && n1 !== s.count,
      after ? s.count + ' → ' + n1 : 'not driven');

    /* ============ 5. THE CONTRACT DOES NOT MOVE BY A PIXEL ============ */
    /* GUARDED: run against the commit before this work neither name exists,
       and a bare call takes the whole file down with a stack — so the six
       claims below it are never reported and nobody can see which are new. */
    const off = await page.evaluate(() => {
      if(typeof uploadBlanksClear !== 'function' || typeof uploadBlanksPaint !== 'function')
        return { blocks: [], back: [], missing: true };
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      uploadBlanksClear(document.getElementById('ig-canvas'));
      const w = document.querySelector('#ig-canvas [data-upwording]');
      const blocks = w ? [...w.querySelectorAll('p,h1,h4')].map(el => {
        const r = el.getBoundingClientRect();
        return [Math.round(r.top), Math.round(r.height)].join(':');
      }) : [];
      uploadBlanksPaint(c);
      const back = w ? [...w.querySelectorAll('p,h1,h4')].map(el => {
        const r = el.getBoundingClientRect();
        return [Math.round(r.top), Math.round(r.height)].join(':');
      }) : [];
      return { blocks, back, missing: false };
    });
    check('5a every block of the wording measures the same with the marks off and on',
      off.blocks.length > 3 && off.blocks.join(' ') === off.back.join(' '),
      off.missing ? 'the painter is not on this build'
        : off.blocks.length + ' blocks · off ' + off.blocks.slice(0, 3).join(' ')
          + ' · on ' + off.back.slice(0, 3).join(' '));
    /* AND THE MARK REALLY IS DRAWN, or 5a is satisfied by a page with none. */
    check('5b GATE — the marks were on when 5a measured them',
      off.back.length > 3 && (await page.evaluate(() =>
        document.querySelectorAll('#ig-canvas span.up-blank').length)) >= 4,
      'marks re-painted');

    /* ============ 6. ONCE THE WORDING IS OURS, THIS STANDS DOWN ============ */
    await openRoom(page, edited.id);
    const e = await page.evaluate(SEEN);
    /* GATED ON THE SIBLING: "nothing is drawn here" is true of a build that
       draws nothing anywhere, so both claims below require the SAME document
       to have been marked on the contract this run already measured. */
    const drew = s.markKeys.length > 0 && s.boxKeys.length > 0;
    check('6a a redlined upload draws no placeholder mark', drew && e.markKeys.length === 0,
      drew ? (e.markKeys.join(', ') || 'none') : 'GATE: the unedited twin drew none either');
    check('6b and no panel', drew && (!e.panel || e.boxKeys.length === 0),
      drew ? (e.boxKeys.join(', ') || 'none') : 'GATE: the unedited twin drew none either');
    check('6c CONTROL — the wording is still on the page', e.canvas,
      e.canvas ? 'canvas drawn' : 'nothing drawn at all');

    /* ============ 8. A WORD FILL-IN FIELD IS A BLANK ============ */
    await openRoom(page, form.id);
    const f = await page.evaluate(SEEN);
    check('8a the file\'s own gaps are marked on the page',
      f.markKeys.join(',') === 'up_buyer_name,up_registered_address,up_fee',
      f.markKeys.join(',') || 'none');
    check('8b and they are PAINTED, not merely in the markup',
      f.markKeys.length > 0 && f.markDrawn === f.markKeys.length,
      f.markDrawn + ' of ' + f.markKeys.length);
    check('8c AN ANSWERED FIELD IS THEIR WORDING — "Acme Trading Ltd" gets no box',
      f.boxKeys.length > 0 && !f.boxKeys.some(k => /acme|seller/i.test(k || '')),
      f.boxKeys.join(', '));
    check('8d the panel lists them under the drafter\'s own names',
      /Buyer name/.test(f.boxLabels.join(' | ')) && /Registered address/.test(f.boxLabels.join(' | '))
      && /Fee/.test(f.boxLabels.join(' | ')), f.boxLabels.join(' | '));
    check('8e an EMPTY box is still a gap', f.boxKeys.includes('up_fee'), f.boxKeys.join(', '));
    const droveF = await typeInto(page, '#pd-og [data-blankf="up_buyer_name"]',
      'Highland Corporate Ltd', 'change');
    const afterF = droveF ? await page.evaluate(() => {
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      const sp = document.querySelector('#ig-canvas span[data-upblank="up_buyer_name"]');
      return { text: sp ? (sp.textContent || '').trim() : null,
        stillField: !!(sp && sp.classList.contains('hati-wfield')),
        filled: !!(sp && sp.classList.contains('is-filled')),
        stored: c.redlineText, record: (c.fields || {}).up_buyer_name };
    }) : null;
    check('8f typing in the panel answers the word on the page',
      !!afterF && afterF.text === 'Highland Corporate Ltd', afterF ? String(afterF.text) : 'not driven');
    check('8g THE PAPER\'S OWN SPAN IS NEVER UNWRAPPED — it is still the file\'s field',
      !!afterF && afterF.stillField && afterF.filled,
      afterF ? ('field ' + afterF.stillField + ' · filled ' + afterF.filled) : 'not driven');
    check('8h and the received document is not rewritten',
      !!afterF && afterF.stored === FORM_WORDING && /Enter buyer name/.test(afterF.stored),
      afterF ? (afterF.stored === FORM_WORDING ? 'byte-identical' : 'THE WORDING MOVED' + (/data-clause-id/.test(afterF.stored) && !/data-clause-id/.test(FORM_WORDING) ? ' — clause ids were stamped into it' : '')) : 'not driven');
    const offF = await page.evaluate(() => {
      if(typeof uploadBlanksClear !== 'function') return { missing: true };
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      const w = document.querySelector('#ig-canvas [data-upwording]');
      const shot = () => w ? [...w.querySelectorAll('p,h1,h4')].map(el => {
        const r = el.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)].join(':');
      }) : [];
      uploadBlanksClear(document.getElementById('ig-canvas'));
      const off = shot();
      const kept = w ? w.querySelectorAll('span.hati-wfield').length : 0;
      uploadBlanksPaint(c);
      return { off, on: shot(), kept, missing: false };
    });
    check('8i clearing the marks LEAVES the file\'s own fields standing',
      !offF.missing && offF.kept === 3, offF.missing ? 'painter absent' : (offF.kept + ' fields'));
    check('8j and the wording measures the same with the marks off and on',
      /* GATED on the marks really being on, or a page with none satisfies it. */
      !offF.missing && offF.kept === 3 && f.markKeys.length === 3
      && offF.off.length > 3 && offF.off.join(' ') === offF.on.join(' '),
      offF.missing ? 'painter absent'
        : offF.off.length + ' blocks · off ' + offF.off.slice(0, 3).join(' ')
          + ' · on ' + offF.on.slice(0, 3).join(' '));

    /* ============ 9. A FILE THEY SIGN HAS NO BLANKS FOR US TO FILL ============
       (Young, 26 Sep 2026: "if the contract is being signed out of hati and
       the contract is simply being used to negotiate the clauses, these
       fields are irrelevant I would presume.") On that route what they
       receive is the agreed WORDING as a Word file, and an answer typed in
       this panel is a working note that never reaches it.

       DRIVEN THROUGH THE PRODUCT'S OWN DOOR on the Signing tab, on the SAME
       document section 1 measured marked and section 4 answered: switched to
       their signing, the panel and every mark stand down and the arrival
       tile says whose blanks they are; switched back through the route
       card's own link, both return and the answer is where it was left.
       GATED on section 1 having drawn marks and a panel on this very
       contract, or "nothing is drawn" passes on a build that draws nothing
       anywhere. */
    await openRoom(page, up.id);
    const m9 = await page.evaluate(SEEN);
    const drew9 = m9.markKeys.length >= 4 && m9.boxKeys.length >= 4;
    /* The first line of THEIR wording, measured on the page: the right-hand
       column changes and the paper may not move because of it. */
    const inkOf = () => page.evaluate(() => {
      const w = document.querySelector('#ig-canvas [data-upwording]');
      const el = w && w.querySelector('h1,h4,p');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    const ink0 = await inkOf();
    /* AN ARRIVAL NOTE THAT COUNTED THE BLANKS, as a reading on HaTi's own
       route would have written it — the tile has to follow the route LIVE. */
    const openNow = await page.evaluate(() => {
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      const n = (window.contractBlanksOpen ? contractBlanksOpen(c) : []).length;
      c.triage = { at: new Date().toISOString(),
        steps: { fill: { ok: true, filled: [], left: n, none: null } } };
      return n;
    });
    const tileHead = async () => {
      await openContractRoom(page, up.id);
      await page.click('#ws-tabs [data-ws-tab="terms"]').catch(() => {});
      await page.waitForTimeout(1200);
      return page.evaluate(() => [...document.querySelectorAll('#kt-triage .kt-tri-tile')]
        .map(t => ((t.querySelector('.kt-tri-hw') || {}).textContent || '').trim()
          + ' :: ' + ((t.querySelector('.kt-tri-td') || {}).textContent || '').trim())
        .find(x => /open fields/i.test(x)) || '');
    };
    const tile0 = await tileHead();
    /* THE WORDING AS THE ROOM LEAVES IT, just before the door is pressed (re-
       pointed 11 Oct 2026: the measurement above is on Home, before the room
       has been opened at all, and the room stamps clause ids on arrival) */
    const stored0 = await page.evaluate(() => (getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).redlineText || '');
    /* RE-POINTED 14 Oct 2026 (stage 5): the Signing tab's door is on Jambo's
       Before you sign face now — the room's Signing tab went home — so it is
       opened through roomOpenAt(id, 'sign') and the door is pressed there. */
    const pressRoute = async (sel) => {
      await page.evaluate(x => roomOpenAt(x, 'sign'), up.id);
      await page.waitForFunction(x => !!document.querySelector('#pd-signface ' + x), sel, { timeout: 8000 }).catch(() => {});
      const there = await page.evaluate(x => !!document.querySelector('#pd-signface ' + x), sel);
      if (!there) return false;
      await page.click(sel);
      await page.waitForTimeout(600);
      if (await page.evaluate(() => !!document.getElementById('cf-ok'))) await page.click('#cf-ok');
      await page.waitForTimeout(2000);
      return true;
    };
    /* RE-POINTED (the gaps, round 10 "The road", pass 2, 18 Oct 2026): the line under
       the Sign button left Before you sign ("the foot follows the last stop"); its one
       door is the dossier's All acts row now (#ws-m-their-way, roomActsRowsHtml) — the same
       press, outsideSetRoute(c, 'outside') */
    const pressMenuRoute = async () => {
      /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the row stands in the dossier's All acts fold */
      await page.evaluate(x => { ['pdFillClose', 'pdSignClose', 'pdRedClose'].forEach(f => { if (typeof window[f] === 'function') try { window[f](); } catch (_){} }); pdOpenOnHome(x, 'copilot'); }, up.id);
      await page.waitForFunction(() => { const f = document.querySelector('#ig-dock .ds-fold[data-ds-fold="acts"]'); if (f) f.open = true; return !!document.querySelector('#ig-dock .ds-fold #ws-m-their-way'); }, null, { timeout: 8000 }).catch(() => {});
      if (!(await page.evaluate(() => !!document.querySelector('#ig-dock .ds-fold #ws-m-their-way')))) return false;
      await page.click('#ig-dock .ds-fold #ws-m-their-way');
      await page.waitForTimeout(600);
      if (await page.evaluate(() => !!document.getElementById('cf-ok'))) await page.click('#cf-ok');
      await page.waitForTimeout(2000);
      return true;
    };
    const toTheirs = await pressMenuRoute();
    const route1 = await page.evaluate(() => (getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).signRoute || 'inside');
    check('9a GATE — the Signing tab\'s own door moved this contract to their signing',
      toTheirs && route1 === 'outside' && drew9,
      (toTheirs ? 'pressed' : 'no #ws-m-their-way door') + ' · route ' + route1
        + ' · marked before: ' + m9.markKeys.length + ', boxes before: ' + m9.boxKeys.length);
    const tile1 = await tileHead();
    await openRoom(page, up.id);
    const t9 = await page.evaluate(SEEN);
    const ok9 = drew9 && route1 === 'outside';
    check('9b THEIR SIGNING: no blanks panel beside their paper',
      ok9 && t9.boxKeys.length === 0 && !t9.blankRows,
      ok9 ? (t9.boxKeys.length + ' boxes · heading "' + (t9.panelHead || '') + '"') : 'GATE not met');
    /* GATED (14 Oct 2026, stage 5) on the paper beside the panel being the
       WORKING copy — the copy marks are drawn on — or "none marked" is true of
       a signing copy left standing on Home's paper. */
    check('9c and no placeholder is marked on their wording',
      ok9 && t9.wording && t9.copy === 'work' && t9.markKeys.length === 0,
      ok9 ? (t9.wording ? (t9.markKeys.join(', ') || 'none') + ' · on the ' + t9.copy + ' copy' : 'no wording drawn') : 'GATE not met');
    check('9d CONTROL — the wording itself is untouched, byte for byte',
      ok9 && t9.stored === stored0 && /\[Insert Company Name\]/.test(t9.stored),
      ok9 ? (t9.stored === stored0 ? 'byte-identical' : 'THE WORDING MOVED ' + JSON.stringify([stored0, t9.stored])) : 'GATE not met');
    const ink1 = await inkOf();
    check('9e CONTROL — THE CONTRACT DOES NOT MOVE: its first line sits where it sat',
      ok9 && ink0 != null && ink1 === ink0, 'first line ' + ink0 + ' → ' + ink1);
    const kept = await page.evaluate(() => ((getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).fields || {}).up_insert_company_name);
    check('9f CONTROL — the answer typed before is still on the record', ok9 && kept === 'Highland Corporate Ltd',
      String(kept));
    check('9g the arrival tile says whose blanks they are, not how many are open',
      ok9 && openNow > 0 && /theirs to fill/i.test(tile1) && !new RegExp('\\b' + openNow + '\\b').test(tile1),
      'before: "' + tile0 + '" · after: "' + tile1 + '"');
    /* AND BACK, through the route card's own link — the other half of one
       door, not a second one. */
    const toOurs = await pressRoute('[data-ho-route="inside"]');
    const route2 = await page.evaluate(() => (getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).signRoute || 'inside');
    await openRoom(page, up.id);
    const b9 = await page.evaluate(SEEN);
    check('9h CONTROL — switched back to HaTi\'s own signing, the panel returns with every box',
      ok9 && toOurs && route2 === 'inside' && b9.boxKeys.join('|') === m9.boxKeys.join('|'),
      (toOurs ? 'pressed' : 'no link back') + ' · route ' + route2 + ' · ' + b9.boxKeys.length + ' boxes');
    check('9i CONTROL — and the marks return, printing the answer that was kept',
      ok9 && b9.markKeys.join('|') === m9.markKeys.join('|')
        && b9.markText.filter(x => x === 'Highland Corporate Ltd').length === 2,
      (b9.markText.join(' | ') || 'no marks') + ' · the paper beside the panel is the ' + b9.copy + ' copy');
    const tile2 = await tileHead();
    /* RE-POINTED 27 Sep 2026 (the overnight clean-up): a tile with fields still
       open used to draw a TICK over "N still open" — the head saying done in
       the same breath as its own detail saying not. It now says the fields are
       on the panel, names the first of them, and the NUMBER is in the chip (A
       HEAD AND A COUNT ARE TWO FACTS, 21 Sep). So "counts the open blanks" is
       asked of the chip against the live count; the old wording still passes,
       which keeps this a CONTROL on both sides. */
    const chip2 = await page.evaluate(() => {
      const t = [...document.querySelectorAll('#kt-triage .kt-tri-tile')]
        .find(x => /open fields/i.test(((x.querySelector('.kt-tri-hw') || {}).textContent || '')));
      return t ? ((t.querySelector('.kt-tri-chip') || {}).textContent || '').trim() : '';
    });
    const open2 = await page.evaluate(() => {
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      return (window.contractBlanksOpen ? contractBlanksOpen(c) : []).length;
    });
    check('9j CONTROL — and the arrival tile counts the open blanks again',
      ok9 && !/theirs to fill/i.test(tile2)
        && (/still open/i.test(tile2) || (open2 > 0 && chip2 === String(open2))),
      '"' + tile2 + '" · chip ' + chip2 + ' · open ' + open2);

    /* ============ 10. A BLANK'S NAME CARRIES NO STRAY "[" ============
       Read off the drawn panel. Red at the parent (3ee647b), which prints the
       label as "Made effective as of [". */
    await openRoom(page, bracketed.id);
    const s10 = await page.evaluate(SEEN);
    check('10a GATE — the bracketed ruled line is asked for in the panel', s10.boxKeys.length >= 1,
      s10.boxKeys.length + ' boxes: ' + s10.boxLabels.join(' | '));
    check('10b its name carries no "[" and reads as the words in front of it',
      s10.boxLabels.length >= 1 && s10.boxLabels.every(l => !/\[/.test(l))
        && s10.boxLabels.some(l => /^Made effective as of\b/i.test(l)),
      s10.boxLabels.join(' | '));

    check('7a CONTROL — no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
