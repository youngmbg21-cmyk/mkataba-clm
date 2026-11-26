/* RE-POINTED 26 Nov 2026 (f1246, #1035 — the owner: "For counter party contracts or 3rd party contracts, they should be
   filled in using their tools"): EVERY UPLOAD IS THEIR PAPER, so the form and the marks this file was built to prove stand
   down on every upload, whoever signs it. The machinery stays (a ruling can be lifted) and f342 keeps proving it reads and
   writes right under its old gate (OLD_THEIRS) — a stand-in a page cannot take: uploadblanks.js is an ES module, its gate
   is a module binding, and setting window.uploadBlanksTheirs reaches no caller. So this file proves THE NEW RULING ON THE
   PAGE, on the same four received documents, each claim GATED on the page really carrying what the old build marked:
     1 the placeholders stand on the page as written, and none is marked — inside the agreement or out
     2 the page and the reading agree: nothing read, nothing painted; the reason is "theirs"
     3 the form in the middle asks no blank of their paper
     4 the Dossier's own Fill in door (pdFillGo) says it is their paper and turns no space into a box; nothing written
     5 the painter itself, called by hand, paints nothing and moves nothing
     6 a redlined upload: the same
     8 a Word form's own fields stand as the file drew them — never wrapped, never boxed — and the wording is not rewritten
     9 on HaTi's own signing, on THEIRS and back: no box, no mark, the arrival tile says whose blanks they are every time,
       the wording and its first line unmoved, the answer typed before the ruling still on the record and never printed
    10 a bracketed ruled line is not asked for either
   Red at the parent of #1035, where every upload HaTi signs drew its marks and its boxes. The text below is the file's
   history as it was built. */
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
const { startHati, seedWorkspace } = require('../helpers');

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
      && !!document.querySelector('#ig-canvas') && !!document.querySelector(`:is(#ig-dock, [data-pd-mid]) :is(#pd-og.is-form[data-pd-og-for="${x}"], #pd-needs)`), id)) break;
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
  /* RE-POINTED 28 Oct 2026 (owner picked "Fill in the contract"): the blanks stand in the form beside the paper; its head
     names it and carries the count */
  /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): Fill in the contract is a page IN THE MIDDLE where the
     paper was (THE MIDDLE, pdMidPage: [data-pd-mid="form:<id>"]); its head names it ("Fill in the contract", h3) and the
     form's own line carries the count ([data-pd-fm-count], "N needed · k of N ready"); the form (#pd-og.is-form) is the
     panel measured */
  const mid = host ? host.closest('[data-pd-mid]') : null;
  const card = (mid && mid.querySelector('.dlg-pg-head')) || document.querySelector('#ig-dock .pd-fm-h') || document.querySelector('#ig-dock .ds-ln-st[data-ds-focus="fill"]') || document.querySelector('#ig-dock .ds-sp-st[data-ds-sp="fill"]');
  const pr = host && card ? (mid ? host : card).getBoundingClientRect() : null;
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
    /* RE-POINTED 26 Nov 2026 (f1246): the wording's own words as painted, and the file's own fields — what their paper
       carries, unmarked */
    wordingText: wording ? (wording.textContent || '') : '',
    wfields: wording ? wording.querySelectorAll('span.hati-wfield').length : 0,
    wfDrawn: wording ? [...wording.querySelectorAll('span.hati-wfield')].filter(m => { const r = m.getBoundingClientRect(); return r.width > 1 && r.height > 1; }).length : 0,
    wfMarked: wording ? wording.querySelectorAll('span.hati-wfield.up-blank, span.hati-wfield[data-upblank], span.hati-wfield.is-filled').length : 0,
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
    panelHead: host && card ? ((card.querySelector('h3, b') || {}).textContent || '').trim() : '',
    /* each blank row says where it stands on the paper (pdOgFromHtml), never a cell of its own */
    blankRows: host ? [...host.querySelectorAll('tr.pd-og-row[data-pd-og-kind="blank"]')].length : 0,
    boxKeys: boxes.map(b => b.getAttribute('data-blankf')),
    boxLabels: boxes.map(b => { const tr = b.closest('tr'); return ((tr && tr.querySelector('.pd-og-f b')) || {}).textContent || ''; }).map(t => t.trim()),
    /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): the number stands beside "Needs you" */
    count: host && card ? (((mid && mid.querySelector('[data-pd-fm-count]')) || card.querySelector('[data-pd-fm-count], .ds-ln-sub, .ds-sp-v') || {}).textContent || '').trim() : '',
    inMid: !!mid, midBack: !!(mid && mid.querySelector('[data-pd-mid-back]')),   /* RE-POINTED 24 Oct 2026 (Round 4): the line's count */
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
  /* an answer typed into the old form before the ruling: kept on the record, never printed on their paper */
  const up = CONTRACT('MK-UB1', { fields: { up_insert_company_name: 'Highland Corporate Ltd' } });
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

    /* ============ 1. THE PLACEHOLDERS STAND AS WRITTEN, UNMARKED ============ */
    await openRoom(page, up.id);
    const s = await page.evaluate(SEEN);
    check('1a the received document draws its wording in a named container',
      s.canvas && s.wording, s.canvas ? (s.wording ? 'yes' : 'no [data-upwording]') : 'no canvas');
    /* GATE: what the old build marked is really on the page, or "nothing marked" is true of a page with no wording */
    const placeholders = !!s.wording && (s.wordingText.match(/Insert Company Name/g) || []).length === 2
      && /effective_date/.test(s.wordingText) && /Delivery address/.test(s.wordingText);
    check('1b GATE — the placeholders stand on the page as the drafter wrote them', placeholders,
      s.wordingText.slice(0, 160));
    check('1c THEIR PAPER: none of them is marked as a blank for us', placeholders && s.markKeys.length === 0,
      s.markKeys.length + ' marks: ' + s.markKeys.join(', '));
    check('1e GATE — the canvas really carries something an unscoped walk would take',
      s.outsideRules > 0, s.outsideRules + ' candidates outside the agreement');
    check('1e2 and nothing outside the agreement is marked either',
      placeholders && s.outsideRules > 0 && s.outsideMarks === 0,
      s.outsideMarks + ' marks outside the agreement, over ' + s.outsideRules + ' candidates of our own');

    /* ============ 2. THE PAGE AND THE READING AGREE ============ */
    const rd = await page.evaluate(() => { const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      return { theirs: typeof uploadBlanksTheirs === 'function' ? uploadBlanksTheirs(c) : null,
        live: typeof uploadBlanksLive === 'function' ? uploadBlanksLive(c) : null,
        none: typeof contractBlanksNone === 'function' ? contractBlanksNone(c) : null,
        open: typeof contractBlanksOpen === 'function' ? contractBlanksOpen(c).length : null }; });
    check('2a the reading stands down too: nothing read, nothing painted, and the reason is "theirs"',
      placeholders && rd.theirs === true && rd.live === false && rd.none === 'theirs' && rd.open === 0
      && s.seq.length === 0 && s.markKeys.length === 0, JSON.stringify(rd) + ' · seq ' + s.seq.length);

    /* ============ 3. THE FORM IN THE MIDDLE ASKS NO BLANK OF THEIR PAPER ============ */
    check('3a the panel is DRAWN on a received document', s.panel && s.panelW > 2,
      s.panel ? s.panelW + 'px' : '#pd-og missing');
    check('3b in the middle where the paper was, with its way back to the paper',
      s.panelW > 2 && s.inMid && s.midBack, `in the middle ${s.inMid} · ‹ Paper ${s.midBack} · ${s.panelW}px`);
    check('3c and it holds no row and no box for their paper\'s blanks',
      s.panel && placeholders && s.blankRows === 0 && s.boxKeys.length === 0,
      `${s.panelHead} · ${s.blankRows} rows · boxes ${s.boxKeys.join(', ') || 'none'}`);

    /* ============ 4. THE DOSSIER'S OWN FILL IN DOOR SAYS WHY, AND FILLS NOTHING ============ */
    const door = await page.evaluate(async id => {
      ['pdMidClose', 'pdFormClose', 'pdFillClose'].forEach(f => { if (typeof window[f] === 'function') try { window[f](); } catch (_){} });
      if (typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'copilot');
      const c = getContract(id), before = JSON.stringify([c.redlineText, c.fields || {}, c.fills || null]);
      const want = i18t('pd2_fill_theirs');
      if (typeof pdFillGo !== 'function') return { missing: true, want };
      pdFillGo(id);
      let said = '';
      for (let i = 0; i < 40 && !said; i++){ await new Promise(r => setTimeout(r, 100));
        const t = (document.getElementById('toast-root') || {}).textContent || ''; if (t.includes(want)) said = want; }
      const c2 = getContract(id);
      return { want, said, boxes: document.querySelectorAll('#ig-canvas [data-pd2-bl]').length,
        head: !!document.getElementById('pd2-fill-head'), marks: document.querySelectorAll('#ig-canvas span.up-blank').length,
        same: JSON.stringify([c2.redlineText, c2.fields || {}, c2.fills || null]) === before };
    }, up.id);
    check('4a the Dossier\'s Fill in door says it is their paper, where the reader looks',
      !door.missing && !!door.want && door.said === door.want, door.missing ? 'no pdFillGo' : (door.said || 'nothing said'));
    check('4b and turns no space on their paper into a box', !door.missing && door.boxes === 0 && !door.head && door.marks === 0,
      JSON.stringify(door));
    check('4c and nothing is written: the wording, the answers and the fills are as they were', !door.missing && door.same,
      door.same ? 'unchanged' : 'THE RECORD MOVED');

    /* ============ 5. THE PAINTER ITSELF PAINTS NOTHING, AND MOVES NOTHING ============ */
    const off = await page.evaluate(() => {
      if(typeof uploadBlanksClear !== 'function' || typeof uploadBlanksPaint !== 'function')
        return { blocks: [], back: [], marks: -1, missing: true };
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      const w = document.querySelector('#ig-canvas [data-upwording]');
      const shot = () => w ? [...w.querySelectorAll('p,h1,h4')].map(el => {
        const r = el.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)].join(':'); }) : [];
      uploadBlanksClear(document.getElementById('ig-canvas'));
      const blocks = shot();
      uploadBlanksPaint(c);
      return { blocks, back: shot(), marks: document.querySelectorAll('#ig-canvas span.up-blank').length, missing: false };
    });
    check('5a GATE — the painter is on this build and the wording is drawn', !off.missing && off.blocks.length > 3,
      off.missing ? 'the painter is not on this build' : off.blocks.length + ' blocks');
    check('5b called by hand on their paper, it paints no mark', !off.missing && off.blocks.length > 3 && off.marks === 0,
      off.marks + ' marks');
    check('5c and every block of the wording measures the same',
      off.blocks.length > 3 && off.blocks.join(' ') === off.back.join(' '),
      'off ' + off.blocks.slice(0, 3).join(' ') + ' · on ' + off.back.slice(0, 3).join(' '));

    /* ============ 6. A REDLINED UPLOAD: THE SAME ============ */
    await openRoom(page, edited.id);
    const e = await page.evaluate(SEEN);
    const eHas = !!e.wording && /Insert Company Name/.test(e.wordingText);
    check('6a a redlined upload draws no placeholder mark', eHas && e.markKeys.length === 0,
      eHas ? (e.markKeys.join(', ') || 'none') : 'GATE: its wording with the placeholders is not on the page');
    check('6b and no box', eHas && e.boxKeys.length === 0, eHas ? (e.boxKeys.join(', ') || 'none') : 'GATE not met');
    check('6c CONTROL — the wording is still on the page', e.canvas,
      e.canvas ? 'canvas drawn' : 'nothing drawn at all');

    /* ============ 8. A WORD FORM'S OWN FIELDS STAND AS THE FILE DREW THEM ============ */
    await openRoom(page, form.id);
    const f = await page.evaluate(SEEN);
    check('8a GATE — the file\'s own fields are on the page, painted',
      f.wfields === 3 && f.wfDrawn === 3 && /Enter buyer name/.test(f.wordingText), f.wfields + ' fields · ' + f.wfDrawn + ' painted');
    check('8b none is marked or wrapped as a blank for us', f.wfields === 3 && f.markKeys.length === 0 && f.wfMarked === 0,
      f.markKeys.join(', ') || ('none · ' + f.wfMarked + ' fields wearing a mark'));
    check('8c and the panel asks none of them', f.wfields === 3 && f.boxKeys.length === 0 && f.blankRows === 0,
      f.boxKeys.join(', ') || 'none');
    check('8d the received document is not rewritten', f.stored === FORM_WORDING,
      f.stored === FORM_WORDING ? 'byte-identical' : 'THE WORDING MOVED' + (/data-clause-id/.test(f.stored) && !/data-clause-id/.test(FORM_WORDING) ? ' — clause ids were stamped into it' : ''));
    const offF = await page.evaluate(() => {
      if(typeof uploadBlanksClear !== 'function' || typeof uploadBlanksPaint !== 'function') return { missing: true };
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      const w = document.querySelector('#ig-canvas [data-upwording]');
      const shot = () => w ? [...w.querySelectorAll('p,h1,h4')].map(el => {
        const r = el.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)].join(':');
      }) : [];
      uploadBlanksClear(document.getElementById('ig-canvas'));
      const off = shot();
      const kept = w ? w.querySelectorAll('span.hati-wfield').length : 0;
      uploadBlanksPaint(c);
      return { off, on: shot(), kept, marks: document.querySelectorAll('#ig-canvas span.up-blank').length, missing: false };
    });
    check('8i clearing and painting LEAVE the file\'s own fields standing, and paint no mark',
      !offF.missing && offF.kept === 3 && offF.marks === 0, offF.missing ? 'painter absent' : (offF.kept + ' fields · ' + offF.marks + ' marks'));
    check('8j and the wording measures the same',
      !offF.missing && offF.kept === 3 && offF.off.length > 3 && offF.off.join(' ') === offF.on.join(' '),
      offF.missing ? 'painter absent' : offF.off.length + ' blocks · off ' + offF.off.slice(0, 3).join(' ') + ' · on ' + offF.on.slice(0, 3).join(' '));

    /* ============ 9. THEIR SIGNING AND OURS: THEIR PAPER EITHER WAY ============
       Driven through the product's own doors (the Dossier's More → "They run the signing", and the Before you sign card's
       "We sign in HaTi instead"), on the same document section 1 measured. GATED on the page carrying the wording with
       its placeholders, or "nothing is drawn" passes on a page that draws nothing. */
    await openRoom(page, up.id);
    const m9 = await page.evaluate(SEEN);
    const drew9 = !!m9.wording && /Insert Company Name/.test(m9.wordingText);
    const inkOf = () => page.evaluate(() => {
      const w = document.querySelector('#ig-canvas [data-upwording]');
      const el = w && w.querySelector('h1,h4,p');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    const ink0 = await inkOf();
    /* AN ARRIVAL NOTE THAT COUNTED THE BLANKS, as a reading before the ruling would have written it — the tile has to
       follow the gate LIVE, never the stored count */
    const openNow = await page.evaluate(() => {
      const c = getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId);
      c.triage = { at: new Date().toISOString(), steps: { fill: { ok: true, filled: [], left: 3, none: null } } };
      return (window.contractBlanksOpen ? contractBlanksOpen(c) : []).length;
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
    check('9 THEIR PAPER ON HaTi\'S OWN SIGNING: the arrival tile says whose blanks they are, not how many',
      drew9 && openNow === 0 && /theirs to fill/i.test(tile0) && !/\b3\b/.test(tile0), '"' + tile0 + '" · open ' + openNow);
    const stored0 = await page.evaluate(() => (getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).redlineText || '');
    const pressRoute = async (sel) => {
      await page.evaluate(x => roomOpenAt(x, 'sign'), up.id);
      await page.waitForFunction(x => !!document.querySelector('#pd-signface ' + x), sel, { timeout: 8000 }).catch(() => {});
      /* GUARDED 17 Nov 2026 (#762): a door in the markup but not painted (the new look folds the old column away) is
         reported as missing, never pressed into a timeout that takes the file down */
      const there = await page.evaluate(x => { const e = document.querySelector('#pd-signface ' + x); return !!e && e.getClientRects().length > 0; }, sel);
      if (!there) return false;
      await page.click('#pd-signface ' + sel);
      await page.waitForTimeout(600);
      if (await page.evaluate(() => !!document.getElementById('cf-ok'))) await page.click('#cf-ok');
      await page.waitForTimeout(2000);
      return true;
    };
    /* RE-POINTED (the gaps, round 10 "The road", pass 2, 18 Oct 2026): the line under
       the Sign button left Before you sign ("the foot follows the last stop"); its one
       door is the dossier's All acts row now (#ws-m-their-way, roomActsRowsHtml) — the same
       press, outsideSetRoute(c, 'outside') */
    /* RE-POINTED 17 Nov 2026 (#762): the Dossier's All acts fold is the paper line's More (#ig-actions → pdActsToggle): its
       short card carries the same row by key ([data-pd-acts-go="#ws-m-their-way"], pdActsGo presses the Dossier's own
       row) — the same press, outsideSetRoute(c, 'outside'). The old fold is tried first, then More */
    const pressMenuRoute = async () => {
      await page.evaluate(x => { ['pdFillClose', 'pdSignClose', 'pdRedClose', 'pdMidClose'].forEach(f => { if (typeof window[f] === 'function') try { window[f](); } catch (_){} }); pdOpenOnHome(x, 'copilot'); }, up.id);
      await page.waitForFunction(() => !!document.getElementById('ig-actions'), null, { timeout: 8000 }).catch(() => {});
      if (await page.evaluate(() => !document.querySelector('#ig-dock .ds-fold #ws-m-their-way') && !!document.getElementById('ig-actions'))) {
        await page.click('#ig-actions');
        const row = '#pd-acts-pop [data-pd-acts-go="#ws-m-their-way"]';
        await page.waitForFunction(r => !!document.querySelector(r), row, { timeout: 4000 }).catch(() => {});
        if (!(await page.evaluate(r => !!document.querySelector(r), row))) return false;
        await page.click(row);
        await page.waitForTimeout(600);
        if (await page.evaluate(() => !!document.getElementById('cf-ok'))) await page.click('#cf-ok');
        await page.waitForTimeout(2000);
        return true;
      }
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
    check('9a GATE — the Dossier\'s own door moved this contract to their signing',
      toTheirs && route1 === 'outside' && drew9,
      (toTheirs ? 'pressed' : 'no #ws-m-their-way door') + ' · route ' + route1 + ' · wording drawn ' + drew9);
    const tile1 = await tileHead();
    await openRoom(page, up.id);
    const t9 = await page.evaluate(SEEN);
    const ok9 = drew9 && route1 === 'outside';
    check('9b THEIR SIGNING: no blanks panel beside their paper',
      ok9 && t9.boxKeys.length === 0 && !t9.blankRows,
      ok9 ? (t9.boxKeys.length + ' boxes · heading "' + (t9.panelHead || '') + '"') : 'GATE not met');
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
    check('9f CONTROL — the answer typed before the ruling is still on the record', ok9 && kept === 'Highland Corporate Ltd',
      String(kept));
    check('9g the arrival tile says the same on their signing', ok9 && /theirs to fill/i.test(tile1) && !/\b3\b/.test(tile1),
      'before: "' + tile0 + '" · after: "' + tile1 + '"');
    /* AND BACK, through the route card's own link */
    const toOurs = await pressRoute('[data-pd2-ho-in]') || await pressRoute('[data-ho-route="inside"]');
    const route2 = await page.evaluate(() => (getContract((window.pdContract && pdContract() && pdContract().id) || state.activeId) || {}).signRoute || 'inside');
    await page.evaluate(() => { if (typeof window.pdSignClose === 'function') try { window.pdSignClose(); } catch (_){} });
    await page.waitForFunction(() => !document.getElementById('pd-signface'), null, { timeout: 4000 }).catch(() => {});
    await openRoom(page, up.id);
    const b9 = await page.evaluate(SEEN);
    const back9 = ok9 && toOurs && route2 === 'inside';
    check('9h back on HaTi\'s own signing it is still their paper: no box returns',
      back9 && b9.wording && b9.boxKeys.length === 0 && !b9.blankRows,
      (toOurs ? 'pressed' : 'no link back') + ' · route ' + route2 + ' · ' + b9.boxKeys.length + ' boxes');
    check('9i and no mark returns, and the kept answer is never printed on their paper',
      back9 && b9.wording && b9.copy === 'work' && b9.markKeys.length === 0 && !/Highland Corporate Ltd/.test(b9.wordingText),
      (b9.markText.join(' | ') || 'no marks') + ' · the paper is the ' + b9.copy + ' copy');
    const tile2 = await tileHead();
    const chip2 = await page.evaluate(() => {
      const t = [...document.querySelectorAll('#kt-triage .kt-tri-tile')]
        .find(x => /open fields/i.test(((x.querySelector('.kt-tri-hw') || {}).textContent || '')));
      return t ? ((t.querySelector('.kt-tri-chip') || {}).textContent || '').trim() : '';
    });
    check('9j and the arrival tile still says whose blanks they are, with no count',
      back9 && /theirs to fill/i.test(tile2) && !/\d/.test(chip2) && !/still open/i.test(tile2),
      '"' + tile2 + '" · chip ' + (chip2 || '—'));

    /* ============ 10. A BRACKETED RULED LINE IS NOT ASKED FOR EITHER ============ */
    await openRoom(page, bracketed.id);
    const s10 = await page.evaluate(SEEN);
    const has10 = !!s10.wording && /made effective as of/.test(s10.wordingText);
    check('10a GATE — the bracketed ruled line stands on the page as written', has10, s10.wordingText.slice(0, 120));
    check('10b and it is neither marked nor asked for in the panel', has10 && s10.markKeys.length === 0 && s10.boxKeys.length === 0,
      s10.markKeys.length + ' marks · ' + s10.boxKeys.length + ' boxes');

    check('7a CONTROL — no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
