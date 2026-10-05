/* Chromium verification: THE THREAD
   (Young, 5 Oct 2026: "Build Thread with Quiet's typography … noting that add
   note feature has been deleted from the worth a look panel")
   ============================================================
   f507 pins the shape; this file proves what the owner SEES, on a real
   warehousing agreement uploaded as Word through the real file input, with a
   scan, a brief and two obligations staged on the record and a scripted
   Copilot answering the readings route:

     1  the Document tab is ONE screen: the paper and the Thread, no switch, no
        Checks card, no Activity & comments card, no strand in the margin
     2  every clause is a row; scrolling the paper opens the row at the line
     3  pressing a row GLIDES the paper until that clause is at the line, and
        ‹ › step one clause the same way — scroll and press never disagree
     4  PLAIN (was "Explain this clause", renamed 5 Oct 2026) sends ONE
        request carrying ONE clause, the reading lands in the paper's own
        face, and it rides the GET after a reload; "All N clauses in plain
        English" is still offered
     5  Worth a look is the one light-red area, with marks as sentences under a
        coloured rule and NO "Add a note"; Who does what sits under it
     6  the contract does not move (refusal 3), in either theme; the risk door
        lands on the worst-marked clause; below 1024 the Thread stands down

   AT UNMODIFIED MAIN the Thread does not exist: 1 and 2 are red outright and
   every driven half is GUARDED so the rest REPORT rather than hang.
   Screenshots go to $HATI_SHOT_DIR, else test/chromium/shots/thread/.
   Run: node test/chromium/thread-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');
const { mkDocx, para, styledPara, WORD_PARTS } = require('../docxfix');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'thread');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BODY =
  styledPara('Title', null, 0, 'WAREHOUSING SERVICES AGREEMENT') +
  para('This Warehousing Services Agreement is made between Highland Corporate Ltd ("Customer") and Siginon Logistics Ltd ("Warehouse").') +
  styledPara('Heading1', null, 0, 'ARTICLE VI: FEES AND PAYMENT') +
  para('VI.1 Fees.') +
  para('Customer shall pay Warehouse the storage, handling and shipping fees set out in Exhibit A (the "Fees").') +
  para('VI.2 Invoicing.') +
  para('Warehouse shall invoice Customer monthly in arrears for all Fees incurred during the preceding calendar month.') +
  para('VI.3 Payment.') +
  para('Customer shall pay each undisputed invoice within thirty (30) days of receipt. Amounts not paid when due shall bear interest at one percent (1%) per month until paid.') +
  styledPara('Heading1', null, 0, 'ARTICLE IX: INSURANCE') +
  para('IX.1 Coverage.') +
  para('Warehouse shall maintain, at its own cost, warehouse legal liability insurance with a minimum limit of $3,000,000 per occurrence, covering loss of or damage to the goods while in its care, custody or control.') +
  para('IX.2 Evidence of Cover.') +
  para('Certificates of insurance are to be delivered on request, together with evidence of each renewal of the cover.') +
  styledPara('Heading1', null, 0, 'ARTICLE XI: INDEMNIFICATION AND LIMITATION OF LIABILITY') +
  para('XI.1 Indemnification.') +
  para('Each party (the "Indemnifying Party") shall indemnify and hold harmless the other party against any third-party claims arising out of its material breach of this Agreement, negligence or violation of applicable law.') +
  para('XI.2 Limitation of Liability.') +
  para('Each party’s aggregate liability under this Agreement shall not exceed the total Fees paid or payable during the twelve (12) months preceding the event giving rise to the claim.') +
  styledPara('Heading1', null, 0, 'ARTICLE XIV: TERM, TERMINATION, AND TRANSITION') +
  para('XIV.1 Term.') +
  para('This Agreement shall commence on the Effective Date and shall continue for a period of 3 years, unless earlier terminated in accordance with the provisions of this Article.') +
  para('XIV.2 Termination for Convenience.') +
  para('Either party may terminate this Agreement, in whole or in part, for convenience upon providing 60 days’ prior written notice to the other party.') +
  para('XIV.3 Termination for Cause.') +
  para('Either party may terminate this Agreement immediately upon written notice if the other party commits a material breach of any provision hereof and fails to cure such breach within 90 days after receipt of written notice detailing the breach.') +
  para('XIV.4 Transition Assistance.') +
  para('Upon termination or expiration of this Agreement, the parties shall cooperate in good faith to ensure an orderly transition of ongoing operations, services, inventory, or deliverables to the receiving party or its designated successor provider.') +
  styledPara('Heading1', null, 0, 'ARTICLE XVI: GOVERNING LAW') +
  para('This Agreement is governed by the laws of Kenya.');

/* The scripted Copilot answers every row it is sent, under that row's key. */
const tool = readings => [{ type: 'tool_use', id: 'tu_read', name: 'clause_readings', input: { readings } }];
const responder = reqBody => tool([...String(reqBody.messages[0].content).matchAll(/\[(R\d{1,3})\] (?:CLAUSE|SECTION)[^\n]*\nheading: ([^\n]*)/g)]
  .map(m => ({ key: m[1], heading: m[2], plain: /SECTION/.test(m[0]) ? '' : 'THPLAIN ' + m[2].toLowerCase() + ' sets out what each side does here.' })));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const file = path.join(OUT, 'Warehousing_agreement.docx');
  fs.writeFileSync(file, Buffer.from(mkDocx(BODY, { parts: WORD_PARTS })));
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    await page.evaluate(() => openUploadModal());
    await page.waitForTimeout(700);
    const input = await page.$('#up-file');
    if (input) {
      await input.setInputFiles(file);
      await page.waitForTimeout(3500);
      await page.fill('#up-party', 'Highland Corporate Ltd').catch(() => {});
      await page.fill('#up-cp', 'Siginon Logistics Ltd').catch(() => {});
      await page.evaluate(() => { const t = document.querySelector('#up-triage'); if (t && t.checked) t.click(); });
      const go = await page.$('#up-go');
      if (go) await go.click();
      await page.waitForTimeout(3000);
    }
    const id = await page.evaluate(() => {
      const c = state.contracts.find(k => k.source === 'upload' && (k.upload || {}).fileName === 'Warehousing_agreement.docx');
      return c ? c.id : null;
    });
    check('0 the Word file is on the record', !!id, id || 'absent');
    if (!id) throw new Error('no upload');

    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(1000);
    /* the facts the Thread reads: a high and a medium finding, a watchout, an
       unusual term, two obligations on the tab — staged in the browser's copy
       of the record (never saved), so a reload below forgets them and they are
       staged again. */
    const stage = () => page.evaluate(() => { const c = getContract(state.activeId);
      c.scan = { at: 'today', on: '2026-10-05', dismissed: [], findings: [
        { id: 'w1', sev: 'high', title: 'Liability cap — 12 months of fees', why: 'A cap at twelve months of fees is low for a warehouse holding $3m of stock.', quote: 'shall not exceed the total Fees paid or payable during the twelve (12) months' },
        { id: 'w3', sev: 'med', title: 'Termination for convenience — 60 days', why: 'They can walk away from storing your goods on two months’ notice.', quote: 'for convenience upon providing 60 days’ prior written notice' }] };
      c._brief = { at: new Date().toISOString(), data: { overview: 'x', watchouts: [{ point: 'A breach does not let you terminate at once — you wait 90 days.', why: 'The other side has three months to fix it.', quote: 'fails to cure such breach within 90 days after receipt of written notice' }], unusual: [{ point: 'The insurance minimum is one flat figure.', why: 'It does not follow the value of goods stored.', quote: 'minimum limit of $3,000,000 per occurrence' }] } };
      c.obligations = [{ id: 'ob1', desc: 'Cooperate on transition', status: 'open', party: 'ours', due: '2029-09-01', quote: 'the parties shall cooperate in good faith to ensure an orderly transition' },
        { id: 'ob2', desc: 'Deliver insurance certificates', status: 'open', party: 'theirs', due: '2026-12-31', quote: 'Certificates of insurance are to be delivered on request' }];
      roomGoTab(c, 'docs'); });
    await stage();
    const up = await page.waitForSelector('#doc-thread:not([hidden])', { timeout: 15000 }).then(() => true).catch(() => false);
    await page.waitForTimeout(1200);

    /* The first line of the wording, measured INSIDE the canvas. */
    const ink = () => page.evaluate(() => {
      const cv = document.getElementById('doc-canvas'); if (!cv) return null;
      const w = document.createTreeWalker(cv, NodeFilter.SHOW_TEXT,
        { acceptNode: n => /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
      const t = w.nextNode(); if (!t) return null;
      const r = document.createRange(); r.selectNodeContents(t);
      const b = r.getBoundingClientRect(), sh = cv.getBoundingClientRect();
      return { top: Math.round((b.top - sh.top) * 10) / 10, left: Math.round((b.left - sh.left) * 10) / 10, sheetW: Math.round(sh.width) };
    });
    const read = () => page.evaluate(() => {
      const th = document.getElementById('doc-thread');
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      const rows = th ? [...th.querySelectorAll('.doc-th-row')].map(r => ({ name: txt(r.querySelector('.doc-th-name')), state: txt(r.querySelector('.doc-th-state')),
        open: r.classList.contains('is-open'), tone: (r.className.match(/is-(ruby|amber|steel)/) || [])[1] || '' })) : [];
      const open = th && th.querySelector('.doc-th-row.is-open');
      const body = open && open.querySelector('.doc-th-in');
      const sc = document.getElementById('doc-scroll');
      const look = body && body.querySelector('.doc-th-look');
      const plain = body && body.querySelector('.doc-th-plain');
      const paper = document.querySelector('#doc-canvas .doc-surface') || document.getElementById('doc-canvas');
      return { hidden: !th || th.hidden, rows, openIdx: open ? Number(open.dataset.thRow) : -1, openText: txt(body).slice(0, 500),
        atLine: (typeof docThreadAtLine === 'function') ? docThreadAtLine() : -2, scroll: sc ? Math.round(sc.scrollTop) : -1,
        switchGone: !document.querySelector('[data-doc-read]'), checksGone: !document.getElementById('checks-card'),
        feedGone: !document.getElementById('feed'), strandGone: !document.getElementById('doc-xr-spine'),
        lookHas: !!(look && look.classList.contains('has')), lookBg: look ? getComputedStyle(look).backgroundColor : '',
        marks: body ? [...body.querySelectorAll('.doc-th-look .doc-xr-mark')].map(m => ({ grade: (m.className.match(/is-(ruby|amber|steel)/) || [])[1] || '-',
          rule: getComputedStyle(m, '::before').width, text: txt(m).slice(0, 60) })) : [],
        notes: body ? body.querySelectorAll('[data-rk-note]').length : -1, addNote: /Add a note/.test(txt(body)),
        who: body ? body.querySelectorAll('.doc-xr-sec.is-who .doc-xr-wd').length : -1,
        whoAfterLook: !!(look && body.querySelector('.doc-xr-sec.is-who') && (look.compareDocumentPosition(body.querySelector('.doc-xr-sec.is-who')) & Node.DOCUMENT_POSITION_FOLLOWING)),
        explain: !!(body && body.querySelector('[data-th-explain]')), explainAll: !!(body && body.querySelector('[data-th-explain-all]')),
        plainFace: plain ? getComputedStyle(plain).fontFamily : '', plainSize: plain ? getComputedStyle(plain).fontSize : '',
        paperFace: paper ? getComputedStyle(paper).fontFamily : '' };
    });
    const reddish = bg => { const v = (String(bg).match(/[\d.]+/g) || []).map(Number).map(n => /srgb/.test(bg) ? n * 255 : n); return v.length >= 3 && v[0] > v[1] + 3 && v[0] > v[2] + 3; };
    const names = s => s.rows.map(r => (r.open ? '[' : '') + r.name.slice(0, 12) + (r.open ? ']' : '')).join(' | ');

    /* ===== 1. ONE SCREEN ===== */
    const s1 = await read();
    const before = await ink();
    check('1a the Thread is drawn beside the paper, one row per clause', up && !s1.hidden && s1.rows.length >= 5,
      s1.rows.length + ' rows');
    check('1b no switch, no Checks card, no Activity & comments card, no strand in the margin',
      s1.switchGone && s1.checksGone && s1.feedGone && s1.strandGone, JSON.stringify({ sw: s1.switchGone, checks: s1.checksGone, feed: s1.feedGone, strand: s1.strandGone }));
    check('1c the first row is open on arrival, and it is the one at the line', s1.openIdx === 0 && s1.atLine === 0, JSON.stringify({ open: s1.openIdx, line: s1.atLine }));
    check('1d the marked rows wear their tone — ruby on XI, amber on XIV, steel on IX',
      s1.rows.some(r => /INDEMNIF/.test(r.name) && r.tone === 'ruby') && s1.rows.some(r => /TERM, TERM/.test(r.name) && r.tone === 'amber')
        && s1.rows.some(r => /INSURANCE/.test(r.name) && r.tone === 'steel'),
      s1.rows.map(r => r.name.slice(0, 10) + ':' + (r.tone || '-')).join(' | '));
    check('1e a row with no reading offers Plain and "All N clauses in plain English"', s1.explain && s1.explainAll, JSON.stringify({ explain: s1.explain, all: s1.explainAll }));
    await page.screenshot({ path: path.join(OUT, '01-arrival.png') });

    /* ===== 2. SCROLL OPENS THE ROW AT THE LINE ===== */
    await page.evaluate(() => { const sc = document.getElementById('doc-scroll'); const el = docXrayRows(getContract(state.activeId))[3].el;
      sc.scrollTop = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 20; });
    await page.waitForTimeout(700);
    const s2 = await read();
    check('2a scrolling the paper by hand opens the row at the line', s2.openIdx === 3 && s2.atLine === 3, names(s2));
    check('2b and exactly one row is open', s2.rows.filter(r => r.open).length === 1, s2.rows.filter(r => r.open).length + ' open');
    await page.screenshot({ path: path.join(OUT, '02-scrolled.png') });

    /* ===== 3. PRESS AND STEP GLIDE TO THE LINE ===== */
    await page.click('#doc-thread .doc-th-row[data-th-row="0"] [data-th-go]');
    await page.waitForTimeout(1400);
    const s3 = await read();
    check('3a pressing a row glides the paper until that clause is at the line', s3.openIdx === 0 && s3.atLine === 0 && s3.scroll < s2.scroll,
      JSON.stringify({ open: s3.openIdx, line: s3.atLine, scroll: s2.scroll + ' → ' + s3.scroll }));
    await page.click('#doc-thread .doc-th-row.is-open [data-th-step="1"]'); await page.waitForTimeout(1300);
    await page.click('#doc-thread .doc-th-row.is-open [data-th-step="1"]'); await page.waitForTimeout(1300);
    const s4 = await read();
    check('3b › twice opens the third clause, with the paper at it', s4.openIdx === 2 && s4.atLine === 2 && s4.scroll > s3.scroll,
      JSON.stringify({ open: s4.openIdx, line: s4.atLine, scroll: s3.scroll + ' → ' + s4.scroll }));
    await page.click('#doc-thread .doc-th-row.is-open [data-th-step="-1"]'); await page.waitForTimeout(1300);
    const s4b = await read();
    check('3c and ‹ steps back the same way', s4b.openIdx === 1 && s4b.atLine === 1, JSON.stringify({ open: s4b.openIdx, line: s4b.atLine }));
    const during = await ink();
    check('3d THE CONTRACT DOES NOT MOVE inside its canvas (refusal 3)',
      !!before && !!during && during.top === before.top && during.left === before.left && during.sheetW === before.sheetW,
      JSON.stringify({ before, during }));
    await page.screenshot({ path: path.join(OUT, '03-stepped.png') });

    /* ===== 4. EXPLAIN ONE CLAUSE ===== */
    await page.click('#doc-thread .doc-th-row[data-th-row="2"] [data-th-go]'); await page.waitForTimeout(1300);
    ai.script(responder);
    const calls0 = ai.calls.length;
    const posts0 = await page.evaluate(() => 0);
    await page.click('#doc-thread .doc-th-row.is-open [data-th-explain]');
    await page.waitForTimeout(2500);
    const s5 = await read();
    const asked = ai.calls.slice(calls0).map(c => (c.body.messages && String(c.body.messages[0].content).match(/\[R\d+\]/g) || []).length);
    check('4a Plain sends ONE request carrying ONE clause', asked.length === 1 && asked[0] === 1, JSON.stringify({ calls: asked.length, rowsPerCall: asked, posts0 }));
    check('4b the reading lands in the open row', /THPLAIN/.test(s5.openText), s5.openText.slice(0, 80));
    check('4c set in the paper\'s own face', !!s5.plainFace && s5.plainFace === s5.paperFace, s5.plainFace.slice(0, 40) + ' vs ' + s5.paperFace.slice(0, 40));
    check('4d that row says Read, and no other does', s5.rows.filter(r => /Read\b/.test(r.state) && !/Reading/.test(r.state)).length === 1 && /Read/.test(s5.rows[2].state),
      s5.rows.map(r => r.state || '-').join(' | '));
    check('4e the other rows still offer their own Plain', s5.rows.filter(r => !/Read/.test(r.state)).length >= 3, s5.rows.length + ' rows');
    await page.screenshot({ path: path.join(OUT, '04-explained.png') });

    /* the one-clause reading rides the GET after a reload */
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.evaluate(i => { openWorkspace(i); roomGoTab(getContract(i), 'docs'); }, id);
    await page.waitForTimeout(1500);
    const s6 = await read();
    check('4f after a reload the one reading is still on its row', s6.rows.length >= 5 && /Read/.test(s6.rows[2].state) && s6.rows.filter(r => /Read\b/.test(r.state)).length === 1,
      s6.rows.map(r => r.name.slice(0, 8) + ':' + (r.state || '-')).join(' | '));

    /* ===== 5. WORTH A LOOK AND WHO DOES WHAT ===== */
    await stage(); await page.waitForTimeout(900);
    await page.evaluate(() => { const c = getContract(state.activeId); const i = docXrayRows(c).findIndex(r => r.tone === 'ruby');
      document.querySelector('#doc-thread [data-th-go="' + i + '"]').click(); });
    await page.waitForTimeout(1300);
    const s7 = await read();
    check('5a the ruby row (Article XI) opens with Worth a look shaded light red', /INDEMNIF/.test(s7.rows[s7.openIdx].name) && s7.lookHas && reddish(s7.lookBg), s7.lookBg);
    check('5b its mark is a sentence under a coloured rule, wearing its grade', s7.marks.length >= 1 && s7.marks.every(m => m.grade !== '-' && parseFloat(m.rule) >= 2),
      JSON.stringify(s7.marks));
    check('5c and there is NO "Add a note" (the owner removed it)', s7.notes === 0 && !s7.addNote, JSON.stringify({ notes: s7.notes, addNote: s7.addNote }));
    check('5d Who does what sits under Worth a look, with its lines', s7.whoAfterLook && s7.who >= 1, s7.who + ' lines');
    await page.evaluate(() => document.querySelector('#doc-thread [data-th-go="0"]').click()); await page.waitForTimeout(1300);
    const s7b = await read();
    check('5e [control] with nothing worth a look (Article VI) the area stays white', !s7b.lookHas && !reddish(s7b.lookBg), s7b.lookBg);
    await page.screenshot({ path: path.join(OUT, '05-worth-a-look.png') });

    /* ===== 6. THE DOORS, THE NARROW WINDOW, THE NIGHT ===== */
    await page.setViewportSize({ width: 1000, height: 800 }); await page.waitForTimeout(600);
    await page.evaluate(() => applyWsTabs(getContract(state.activeId))); await page.waitForTimeout(400);
    const narrow = await page.evaluate(() => ({ hidden: document.getElementById('doc-thread').hidden, rows: document.querySelectorAll('#doc-thread .doc-th-row').length }));
    check('6a below 1024 the Thread stands down and the paper has the tab', narrow.hidden && narrow.rows === 0, JSON.stringify(narrow));
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(400);
    await page.evaluate(() => applyWsTabs(getContract(state.activeId))); await page.waitForTimeout(600);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'terms')); await page.waitForTimeout(500);
    await page.evaluate(() => riskViewOpen(getContract(state.activeId))); await page.waitForTimeout(1500);
    const s8 = await read();
    check('6b the risk door lands on the Document tab with the worst-marked clause open, the paper glided to it',
      !s8.hidden && s8.openIdx >= 0 && s8.rows[s8.openIdx].tone === 'ruby' && s8.atLine === s8.openIdx, names(s8) + ' · scroll ' + s8.scroll);
    await page.evaluate(() => { try { setDark(true); } catch (_) { document.documentElement.classList.add('dark'); } }); await page.waitForTimeout(600);
    const night = await read();
    check('6c at night Worth a look is still the one reddish area', night.lookHas && reddish(night.lookBg), night.lookBg);
    await page.screenshot({ path: path.join(OUT, '06-night.png') });

    check('7 [control] no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
    if (ai && ai.stop) await ai.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
