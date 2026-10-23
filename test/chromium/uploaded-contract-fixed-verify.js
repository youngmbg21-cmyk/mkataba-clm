/* Chromium verification: THE UPLOADED CONTRACT, FIXED (Young's go, 22 Sep 2026)
   ============================================================
   A Maersk SaaS agreement uploaded as Word came back with its clauses drawn as
   big bold headings, an X-ray whose map was grey with every concern piled at
   the foot, an obligations door onto an empty tab, and three Overview cards
   out of line. f366 proves the readings; this file proves what the owner SEES,
   through the real file input, on the real page:

     1  a clause Word set in "Heading 2" is painted as a paragraph — body size,
        body weight — with only its own title in bold
     2  the X-ray map colours the clause the risk scan found; pressing that
        colour lands the panel on it; the mark carries its "Why it matters";
        Worth a look is shaded a light red, and a finding that lands nowhere
        is no longer drawn (About this contract left the X-ray, 25 Sep 2026)
     3  the obligations tile opens the found list while the tab is empty,
        and goes to the tab once the tab has obligations
     4  Who else / What Copilot read / Parties: inset, head gap, one line

   Every driven half is GUARDED so a build without it reports, never hangs.
   Screenshots go to test/chromium/shots/uploaded-contract-fixed/.
   Run: node test/chromium/uploaded-contract-fixed-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, WORD_PARTS } = require('../docxfix');

const OUT = path.join(__dirname, 'shots', 'uploaded-contract-fixed');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const x = s => String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
const R = (t, b) => `<w:r>${b ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
const P = (style, numId, ilvl, runs) => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}${
  numId != null ? `<w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr>` : ''}</w:pPr>${runs}</w:p>`;
const BODY =
  P('Title', null, 0, R('SOFTWARE AS A SERVICE AGREEMENT')) +
  P('Heading1', 1, 0, R('SCOPE')) +
  P('Heading2', 1, 1, R('Request ', true) + R('for provision', true) + R(' of Services. ', true)
    + R('Each Group Entity shall be entitled at any time to require the provision of Services by entering into a Service Order directly with Supplier.')) +
  P('Heading2', 1, 1, R('Non-exclusivity. ', true)
    + R('This Agreement is of a non-exclusive nature and the Customer may buy similar services elsewhere.')) +
  P('Heading1', 1, 0, R('ORDERING AND DELIVERY')) +
  P('Heading2', 1, 1, R('No suspension. ', true)
    + R('Irrespective of any dispute, Supplier shall meet its obligation to provide the Services and is not entitled to suspend, withhold, discontinue or interrupt the Services.')) +
  P('Heading1', 1, 0, R('CHARGES')) +
  P('Heading2', 1, 1, R('Due payment. ', true)
    + R('Payment is due sixty (60) days from receipt of a complete and correct invoice.'));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const file = path.join(OUT, 'SaaS_agreement.docx');
  fs.writeFileSync(file, Buffer.from(mkDocx(BODY, { parts: WORD_PARTS })));
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- the real file, through the real input ---- */
    await page.evaluate(() => openUploadModal());
    await page.waitForTimeout(700);
    const input = await page.$('#up-file');
    if (input) {
      await input.setInputFiles(file);
      await page.waitForTimeout(3500);
      await page.fill('#up-cp', 'nShift Group A/S').catch(() => {});
      /* No arrival reading: this file drives the X-ray from facts it stages. */
      await page.evaluate(() => { const t = document.querySelector('#up-triage'); if (t && t.checked) t.click(); });
      const go = await page.$('#up-go');
      if (go) await go.click();
      await page.waitForTimeout(3000);
    }
    const id = await page.evaluate(() => {
      const c = state.contracts.find(k => k.source === 'upload' && (k.upload || {}).fileName === 'SaaS_agreement.docx');
      return c ? c.id : null;
    });
    check('0 the Word file is on the record', !!id, id || 'absent');
    if (!id) throw new Error('no upload');

    /* RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner). The
       paper is Home's Document face (#ig-canvas), the Thread its Clauses tab
       (#pd-thread); sections 3 and 4 are the room's Overview, as before. */
    await page.evaluate(i => { window.__cid = i; pdOpenOnHome(i, 'doc'); }, id);
    await page.waitForFunction(() => !!document.getElementById('ig-canvas')
      && /Request for provision/.test(document.getElementById('ig-canvas').textContent)
      && !!document.getElementById('pd-thread'), null, { timeout: 15000 }).catch(() => {});

    /* ===== 1. A CLAUSE IS A PARAGRAPH, ITS TITLE ALONE IN BOLD ===== */
    const para = await page.evaluate(() => {
      const box = document.getElementById('ig-canvas');
      const el = [...box.querySelectorAll('p,h1,h2,h3,h4')].find(e => /Request for provision/.test(e.textContent));
      if (!el) return null;
      const body = [...box.querySelectorAll('p')].find(e => e !== el && e.textContent.trim().length > 20);
      const tail = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('');
      const cs = getComputedStyle(el), b = el.querySelector('strong,b');
      return { tag: el.tagName, weight: Number(cs.fontWeight), size: parseFloat(cs.fontSize),
        bodySize: body ? parseFloat(getComputedStyle(body).fontSize) : null,
        bold: b ? Number(getComputedStyle(b).fontWeight) : 0, tail: tail.slice(-40) };
    });
    check('1a the clause Word set in "Heading 2" is a PARAGRAPH on the paper',
      !!(para && para.tag === 'P'), para ? para.tag : 'not found');
    check('1b in the body\'s own size and weight',
      !!(para && para.weight < 600 && para.bodySize && Math.abs(para.size - para.bodySize) < 0.5),
      para ? `${para.size}px/${para.weight} against body ${para.bodySize}px` : '—');
    check('1c its own title keeps its bold', !!(para && para.bold >= 600), para ? 'title ' + para.bold : '—');
    const heads = await page.evaluate(() =>
      [...document.querySelectorAll('#ig-canvas h1,#ig-canvas h2,#ig-canvas h3,#ig-canvas h4')]
        .map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(t => t.length > 60).length);
    check('1d no heading on the paper runs to a sentence', heads === 0, heads + ' long headings');
    await page.screenshot({ path: path.join(OUT, '01-document.png') });

    /* ===== 2. THE THREAD (was the X-ray) ===== */
    /* RE-POINTED 5 Oct 2026 (the Thread): the map's blocks are the Thread's
       rows, the panel is the open row. Same facts staged, same claims. */
    const staged = await page.evaluate(() => {
      const c = getContract(window.__cid);
      c.scan = { at: 'today', on: '2026-09-22', dismissed: [], findings: [
        { id: 'x1', sev: 'high', title: 'No right to suspend', why: 'Your only lever in a payment dispute is gone.',
          quote: 'is not entitled to suspend, withhold, discontinue or interrupt the Services' },
        { id: 'x2', sev: 'med', title: 'Governing law abroad', why: 'Disputes are heard far from home.',
          quote: 'a sentence this contract does not contain anywhere at all' } ] };
      c._brief = { at: new Date().toISOString(), data: { overview: 'x',
        watchouts: [{ point: 'Payment takes sixty days.', why: 'Your cash waits two months.', quote: 'Payment is due sixty (60) days' }],
        unusual: [{ point: 'The customer may buy elsewhere.', why: 'Nothing is guaranteed to you.', quote: '' }] } };
      if (typeof docThreadPaint !== 'function') return false;
      docThreadPaint(c);
      return true;
    });
    await page.waitForTimeout(1200);
    const spine = await page.evaluate(() => {
      const segs = [...document.querySelectorAll('#pd-thread .doc-th-row')];
      return { n: segs.length, ruby: segs.filter(s => s.classList.contains('is-ruby')).length,
        amber: segs.filter(s => s.classList.contains('is-amber')).length };
    });
    check('2a the thread is drawn', staged && spine.n > 0, JSON.stringify(spine));
    check('2b the clause the scan found is RED on the thread', spine.ruby === 1, spine.ruby + ' red');
    check('2c and the brief\'s watchout colours its own clause amber', spine.amber >= 1, spine.amber + ' amber');
    const pressed = await page.evaluate(async () => {
      const seg = document.querySelector('#pd-thread .doc-th-row.is-ruby [data-th-go]');
      if (!seg) return null;
      seg.click();
      await new Promise(z => setTimeout(z, 1300));
      const panel = document.querySelector('#pd-thread .doc-th-row.is-open');
      const mark = panel && [...panel.querySelectorAll('.doc-xr-mark.is-ruby')][0];
      const why = mark && mark.querySelector('.doc-xr-why');
      const wide = panel && panel.querySelector('.doc-xr-sec.is-wide');
      const look = panel && panel.querySelector('.doc-th-look');
      const bg = look ? getComputedStyle(look).backgroundColor : '';
      return { head: (panel.querySelector('.doc-th-name') || {}).textContent || '',
        mark: mark ? mark.textContent.replace(/\s+/g, ' ').trim() : '',
        why: why ? why.textContent.replace(/\s+/g, ' ').trim() : '',
        wide: wide ? wide.textContent.replace(/\s+/g, ' ').trim() : '', bg,
        anywhere: document.getElementById('pd-thread').textContent.replace(/\s+/g, ' ') };
    });
    check('2d pressing the red row opens it on that clause',
      !!(pressed && /No suspension/.test(pressed.head + pressed.mark)), pressed ? pressed.head : 'no red row');
    /* 2e RE-POINTED 13 Oct 2026 (Stakes as drawn (owner, 13 Oct 2026): on Home the open row carries only its Plain English): the finding grades the bead (2b) and
       is on the Risks list; the open row on Home does not list it */
    check('2e the open row does not list the finding (Plain English only)',
      !!(pressed && pressed.head && !/No right to suspend/.test(pressed.mark || '')), pressed ? (pressed.mark || '(none)') : '—');
    /* REVERSED IN PLACE 25 Sep 2026 (Young: "this 'about contract x' portion
       should be excluded from the x-ray"). A finding that lands on no clause
       was said in About this contract; that block is gone and the finding
       stays on the Risk scan panel. GATED on the row having opened, so a
       build that draws nothing cannot pass it. */
    check('2f About this contract is not drawn, and a finding that lands nowhere is not guessed onto a clause',
      !!(pressed && pressed.head && !pressed.wide && !/Governing law abroad/.test(pressed.anywhere)),
      pressed ? (pressed.wide || '(no block)').slice(0, 90) : '—');
    /* color-mix() resolves to color(srgb r g b) with 0..1 channels in this
       browser, and to rgb() in others — both are read. */
    const rgb = (pressed && pressed.bg.match(/[\d.]+/g) || []).map(Number)
      .map(v => /srgb/.test(pressed.bg) ? v * 255 : v);
    /* 2g RETIRED 13 Oct 2026 with Home's Worth a look (2e) */
    void rgb;
    await page.screenshot({ path: path.join(OUT, '02-thread.png') });

    /* ===== 3. THE OBLIGATIONS TILE ===== */
    await page.evaluate(() => openWorkspace(window.__cid, { room: true }));
    await page.waitForFunction(() => state.view === 'workspace' && !!document.getElementById('ws-tabs'),
      null, { timeout: 15000 }).catch(() => {});
    const tile = await page.evaluate(async () => {
      const c = getContract(window.__cid);
      c.obligations = [];
      c.triage = { at: new Date().toISOString(), by: 'Admin', steps: {
        oblig: { ok: true, found: [{ desc: 'Supplier must keep providing the Services', due: '', who: 'them' },
          { desc: 'Pay within sixty days', due: '', who: 'us' }] } } };
      roomGoTab(c, 'terms');
      await new Promise(z => setTimeout(z, 900));
      if (typeof paintKtTriage === 'function') paintKtTriage(c);
      await new Promise(z => setTimeout(z, 300));
      const t = document.querySelector('[data-kt-tri-go="oblig"]');
      if (!t) return { none: true };
      t.click();
      await new Promise(z => setTimeout(z, 700));
      const modal = !!document.querySelector('[data-ob-pick]');
      const tab = typeof _wsTab !== 'undefined' ? _wsTab : null;
      return { modal, tab };
    });
    check('3a with the tab empty, the tile opens the found list to tick and add',
      !!(tile && tile.modal), JSON.stringify(tile));
    await page.screenshot({ path: path.join(OUT, '03-oblig-popup.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const tile2 = await page.evaluate(async () => {
      document.querySelectorAll('#modal-root *').forEach(() => {});
      if (typeof closeModal === 'function') closeModal();
      const c = getContract(window.__cid);
      c.obligations = [{ id: 'ob1', desc: 'Pay within sixty days', due: '', who: 'us' }];
      if (typeof paintKtTriage === 'function') paintKtTriage(c);
      await new Promise(z => setTimeout(z, 300));
      const t = document.querySelector('[data-kt-tri-go="oblig"]');
      if (!t) return { none: true };
      t.click();
      return { pressed: true };
    });
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       Obligations tab went home — its twin is the Board's Obligations view
       (#obw-one-host), so "the tab" the tile goes to is that
       view, on Home, for this contract. */
    if (tile2 && !tile2.none) await page.waitForFunction(() => !!document.querySelector('#obw-one-host')
      || !!document.querySelector('[data-ob-pick]') || !!document.querySelector('#ws-tabs [data-ws-tab="oblig"][aria-selected="true"]'), null, { timeout: 8000 }).catch(() => {});
    if (tile2 && !tile2.none) Object.assign(tile2, await page.evaluate(() => {
      const view = document.querySelector('#obw-one-host');
      const on = document.querySelector('#ws-tabs .room-tab.is-on, #ws-tabs [aria-selected="true"]');
      /* RE-POINTED 15 Oct 2026: the Obligations page narrowed to this contract draws its table */
      const forThis = !!(view && String(view.getAttribute('data-ins-cid')) === String(window.__cid));
      return { modal: !!document.querySelector('[data-ob-pick]'),
        tab: (view && state.view === 'obligations' && forThis) ? 'oblig' : (on ? on.getAttribute('data-ws-tab') : null) };
    }));
    check('3b once the tab has obligations, the tile goes straight to the tab',
      !!(tile2 && !tile2.modal && tile2.tab === 'oblig'), JSON.stringify(tile2));

    /* ===== 4. THE THREE OVERVIEW CARDS ===== */
    /* RE-POINTED 14 Oct 2026 (stage 5): 3b left the reader on Home's Board, and
       roomGoTab only switches a room that is drawn, so the Overview is opened
       through roomOpenAt — "open this contract on that tab, from anywhere". */
    /* RE-POINTED 15 Oct 2026 (step 8, the room retired): the Overview's
       sheet — its Edit and its parties — is the contract strip's Details page
       on Home's Board, opened by its one door (roomOverviewOpen) */
    /* RE-POINTED 22 Oct 2026 (owner's yes: the Details page RETIRED on a computer): the Overview's sheet still
       stands in the room opened by name (openWorkspace(id,{room:true})), and its parties are measured there */
    await page.evaluate(() => { openWorkspace(window.__cid, { room: true }); roomOverviewOpen(getContract(window.__cid)); });
    await page.waitForFunction(() => state.view === 'workspace' && !!document.querySelector('#kt-ov-terms'), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
    /* RE-POINTED IN PLACE 1 Oct 2026 (Read Down): nothing folds, so every
       section is open as drawn — found by its head's words, not pressed. */
    await page.waitForTimeout(700);
    /* RE-POINTED 8 Oct 2026 (the Constellation page): "Who else" is the
       Parties column's editor, behind the essentials card's Edit; What Copilot
       read is the read card at the top (no table on the Overview); and the
       Parties column draws no second line under its own head. */
    /* RE-POINTED 12 Oct 2026: the editors are the Details tab's (owner). */
    /* RE-POINTED 13 Oct 2026 (owner: Details holds only what the paper owes,
       and THE OVERVIEW EDITS AGAIN): the people directory is the Overview's
       Edit (data-ov-edit="all" → participantsDirHtml in #ov-parties), so the
       check presses Edit on the Overview and measures there. */
    /* RE-POINTED 21 Oct 2026 (owner: "put it in Key terms and dossier"): since the Board's card reads
       (20 Oct), "Who else" opens from Key terms' row and the Dossier's line, one door (pdPeopleOpen), its
       list in a pop-up over the page; the list and its Add button still share one left edge */
    await page.evaluate(() => { if (window.pdPeopleOpen) pdPeopleOpen(window.__cid, 'dossier'); });
    await page.waitForFunction(() => !!document.querySelector('#pd-ppl [data-pt-add]'), null, { timeout: 6000 }).catch(() => {});
    const cards = await page.evaluate(() => {
      const out = {};
      const host = document.getElementById('pd-ppl');
      const inset = (b, sel) => { const e = b && b.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().left - b.getBoundingClientRect().left) : null; };
      out.whoBtn = inset(host, '[data-pt-add]');
      out.whoText = inset(host, '.pt-dir-list, .pt-none');
      out.inDlg = !!(host && host.closest('[role="dialog"]'));
      out.tables = document.querySelectorAll('#kt-overview .ov-reads').length;
      return out;
    });
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.evaluate(() => { openWorkspace(window.__cid, { room: true }); roomOverviewOpen(getContract(window.__cid)); });
    await page.waitForFunction(() => !!document.querySelector('#ov-parties .ov-ess-h'), null, { timeout: 8000 }).catch(() => {});
    const rest = await page.evaluate(() => {
      const col = document.getElementById('ov-parties'); const hd = col && col.querySelector('.ov-ess-h');
      if (!hd) return { lines: -1 };
      const hb = hd.getBoundingClientRect();
      const lines = [...col.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
        return parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && r.top >= hb.bottom - 1 && r.top <= hb.bottom + 8; }).length;
      return { lines };
    });
    check('4a "Who else" — the text lines up with its own Add button',
      cards.whoText != null && cards.whoText === cards.whoBtn, `text ${cards.whoText} · button ${cards.whoBtn}`);
    check('4b "Who else" — it opens in its own pop-up over the page',
      cards.whoBtn != null && cards.inDlg && cards.whoBtn >= 0, `button ${cards.whoBtn} · in a pop-up ${cards.inDlg}`);
    check('4c "What Copilot read" — said once, by the read card; no table on the Overview', cards.tables === 0, cards.tables + ' tables');
    check('4d Parties — no second line directly under the head', rest.lines === 0, rest.lines + ' extra line(s)');
    await page.screenshot({ path: path.join(OUT, '04-overview.png'), fullPage: true });

    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop?.();
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
