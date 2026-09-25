/* Chromium verification: WHO DOES WHAT, AND ONE LIGHT-RED AREA
   ============================================================
   Young, 25 September 2026, over two screenshots of the X-ray: *"i want this
   highlighted area in the x-ray page to be the area that is highlighted in
   light red … this 'about contract x' portion should be excluded from the
   x-ray so there is only one red highlighted area which is the worth a look
   area"* — and, over three drawn options for the space that left, *"build it
   using your recommendation of who does what"*.

   f384 pins the reading; this file proves what the owner SEES, on a real
   warehousing agreement uploaded as Word through the real file input:

     1  Worth a look is shaded light red where it holds something and white
        where it does not, and About this contract is not drawn — even though
        a finding lands on no clause
     2  Who does what sits straight under Worth a look, different on every
        clause: the sides read off the paper's own names ("Customer",
        "Warehouse"), "either party" read as both, a limit as a limit, the
        Obligations tab's owner winning where the sentence cannot say
     3  an obligation on the tab is ticked on its line, with its day
     4  pressing a line takes the paper to that sentence, and the door lands
        on the Obligations tab
     5  the contract does not move (refusal 3), in either theme

   Every driven half is GUARDED so a build without it reports, never hangs.
   Screenshots go to $HATI_SHOT_DIR, else test/chromium/shots/xray-who-does-what/.
   Run: node test/chromium/xray-who-does-what-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para, styledPara, WORD_PARTS } = require('../docxfix');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'xray-who-does-what');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The owner's own Article XIV, word for word from the screenshot, and three
   articles around it written the way a warehousing agreement is written. */
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
  para('VI.4 Disputed Invoices.') +
  para('Customer may withhold payment of any amount it disputes in good faith, provided it notifies Warehouse in writing of the disputed amount within fifteen (15) days of receipt of the invoice.') +
  styledPara('Heading1', null, 0, 'ARTICLE IX: INSURANCE') +
  para('IX.1 Coverage.') +
  para('Warehouse shall maintain, at its own cost, warehouse legal liability insurance with a minimum limit of $3,000,000 per occurrence, covering loss of or damage to the goods while in its care, custody or control.') +
  para('IX.2 Evidence of Cover.') +
  para('Certificates of insurance are to be delivered on request, together with evidence of each renewal of the cover.') +
  styledPara('Heading1', null, 0, 'ARTICLE XI: INDEMNIFICATION AND LIMITATION OF LIABILITY') +
  para('XI.1 Indemnification.') +
  para('Each party (the "Indemnifying Party") shall indemnify and hold harmless the other party against any third-party claims arising out of its material breach of this Agreement, negligence or violation of applicable law.') +
  para('XI.2 Exclusion of Damages.') +
  para('In no event shall either party be liable to the other for any indirect, incidental or consequential damages, including lost profits or business interruption.') +
  para('XI.3 Limitation of Liability.') +
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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const file = path.join(OUT, 'Warehousing_agreement.docx');
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
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1400);

    /* The first line of the wording, measured INSIDE the page and against the
       window, before X-ray is switched on. */
    const ink = () => page.evaluate(() => {
      const cv = document.getElementById('doc-canvas');
      if (!cv) return null;
      const w = document.createTreeWalker(cv, NodeFilter.SHOW_TEXT,
        { acceptNode: n => /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
      const t = w.nextNode();
      if (!t) return null;
      const r = document.createRange(); r.selectNodeContents(t);
      const b = r.getBoundingClientRect();
      const sh = cv.getBoundingClientRect();
      return { top: Math.round(b.top * 10) / 10, left: Math.round(b.left * 10) / 10, sheetW: Math.round(sh.width) };
    });
    const before = await ink();

    /* ---- the facts X-ray reads: a finding on XI, a watchout on XIV, a
       finding that lands on NO clause, and two obligations on the tab ---- */
    const staged = await page.evaluate(() => {
      const c = getContract(state.activeId);
      c.scan = { at: 'today', on: '2026-09-25', dismissed: [], findings: [
        { id: 'w1', sev: 'med', title: 'Liability / indemnity — review carefully',
          why: 'Counterparty paper often caps their liability low.',
          quote: 'shall not exceed the total Fees paid or payable during the twelve (12) months' },
        { id: 'w2', sev: 'low', title: 'XRNOWHERE a finding that lands on no clause',
          why: 'It quotes nothing on this paper.', quote: 'a sentence this agreement does not contain anywhere at all' }] };
      c._brief = { at: new Date().toISOString(), data: { overview: 'x', watchouts: [
        { point: 'A breach does not let you terminate at once — you wait 90 days.',
          why: 'The other side has three months to fix it.',
          quote: 'fails to cure such breach within 90 days after receipt of written notice' }],
        unusual: [{ point: 'The insurance minimum is one flat figure.', why: 'It does not follow what is stored.',
          quote: 'minimum limit of $3,000,000 per occurrence' }] } };
      c.obligations = [
        { id: 'ob1', desc: 'Cooperate on transition', status: 'open', party: 'ours', due: '2029-09-01',
          quote: 'the parties shall cooperate in good faith to ensure an orderly transition' },
        { id: 'ob2', desc: 'Deliver insurance certificates', status: 'open', party: 'theirs', due: '2026-12-31',
          quote: 'Certificates of insurance are to be delivered on request' }];
      if (typeof docViewSet !== 'function') return false;
      docViewSet('xray');
      if (typeof applyWsTabs === 'function') applyWsTabs(c);
      return true;
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const sc = document.getElementById('doc-scroll'); if (sc) sc.scrollTop = 0; });
    await page.waitForTimeout(200);
    const during = await ink();

    /* What the panel shows, as data. */
    const read = () => page.evaluate(() => {
      const panel = document.querySelector('#doc-xray');
      if (!panel) return null;
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      const secs = [...panel.querySelectorAll('.doc-xr-sec')];
      const heads = secs.map(s => txt(s.querySelector('.doc-xr-k')));
      const look = secs.find(s => s.classList.contains('is-look')) || null;
      const who = secs.find(s => s.classList.contains('is-who')) || null;
      const lines = who ? [...who.querySelectorAll('.doc-xr-wd')].map(b => ({
        chip: txt(b.querySelector('.doc-xr-who')), side: (b.querySelector('.doc-xr-who').className.match(/is-(\w+)/) || [])[1],
        say: txt(b.querySelector('.doc-xr-wdt')), cite: txt(b.querySelector('.doc-xr-wdc')),
        ob: txt(b.querySelector('.doc-xr-wdo')) })) : [];
      return { head: txt(panel.querySelector('.doc-xr-head h4')), heads,
        lookHas: !!(look && look.classList.contains('has')),
        lookBg: look ? getComputedStyle(look).backgroundColor : '',
        whoAfterLook: !!(look && who && (look.compareDocumentPosition(who) & Node.DOCUMENT_POSITION_FOLLOWING)
          && secs.indexOf(who) === secs.indexOf(look) + 1),
        whoHead: txt(who && who.querySelector('.doc-xr-k')), bal: txt(who && who.querySelector('.doc-xr-balsay')),
        lines, none: txt(who && who.querySelector('.doc-xr-q')),
        door: !!(who && who.querySelector('[data-xr-ob]')), text: txt(panel) };
    });
    const reddish = bg => {
      const v = (String(bg).match(/[\d.]+/g) || []).map(Number).map(n => /srgb/.test(bg) ? n * 255 : n);
      return v.length >= 3 && v[0] > v[1] + 3 && v[0] > v[2] + 3;
    };
    const pick = async re => page.evaluate(async src => {
      const rows = docXrayRows(getContract(state.activeId));
      const i = rows.findIndex(r => new RegExp(src).test((r.row && r.row.heading) || r.name || ''));
      const b = document.querySelector('[data-xr-seg="' + i + '"]');
      if (!b) return { i, pressed: false };
      b.click();
      await new Promise(z => setTimeout(z, 600));
      return { i, pressed: true };
    }, re.source);

    /* ===== 1. ONE LIGHT-RED AREA ===== */
    const first = await read();
    check('1a the X-ray is drawn', staged && !!first, first ? first.head : 'no panel');
    /* A CONTROL: nothing ever shaded an empty list, so this passes before the
       change too — it is here to prove the new shade did not start to. */
    check('1b [control] with nothing worth a look (Article VI), Worth a look stays WHITE',
      !!first && /FEES AND PAYMENT/.test(first.head) && !first.lookHas && !reddish(first.lookBg),
      first ? `${first.head} · has:${first.lookHas} · ${first.lookBg}` : '—');
    check('1c About this contract is not drawn, though a finding lands on no clause',
      !!first && !first.heads.some(hd => /About this contract/i.test(hd)) && !/XRNOWHERE/.test(first.text)
        && !(await page.$('#doc-xray .is-wide')),
      first ? first.heads.join(' | ') : '—');

    await pick(/INDEMNIFICATION/);
    const xi = await read();
    check('1d with marks (Article XI), Worth a look IS the light-red area',
      !!xi && /INDEMNIFICATION/.test(xi.head) && xi.lookHas && reddish(xi.lookBg),
      xi ? `${xi.head} · has:${xi.lookHas} · ${xi.lookBg}` : '—');
    /* GATED on WHICH area is red: before this change the one red area was
       About this contract, and "exactly one" alone passed on it. */
    const reds = await page.evaluate(() => [...document.querySelectorAll('#doc-xray .doc-xr-sec')].filter(s => {
      const bg = getComputedStyle(s).backgroundColor;
      const v = (bg.match(/[\d.]+/g) || []).map(Number).map(n => /srgb/.test(bg) ? n * 255 : n);
      return v.length >= 3 && (v.length < 4 || v[3] > 0) && v[0] > v[1] + 3 && v[0] > v[2] + 3;
    }).map(s => s.className));
    check('1e and it is the only red area in the panel', reds.length === 1 && /is-look/.test(reds[0]), JSON.stringify(reds));
    await page.screenshot({ path: path.join(OUT, '01-article-xi.png') });

    /* ===== 2. WHO DOES WHAT ===== */
    check('2a Who does what sits straight under Worth a look', !!xi && xi.whoAfterLook, xi ? xi.heads.join(' | ') : '—');
    check('2b a mutual indemnity reads as both; the two caps read as limits',
      !!xi && xi.lines.some(l => l.side === 'both' && /^indemnify/.test(l.say) && l.cite === 'XI.1')
        && xi.lines.filter(l => l.side === 'limit').length === 2,
      xi ? JSON.stringify(xi.lines.map(l => [l.chip, l.cite, l.say.slice(0, 40)])) : '—');

    const vi = first;
    check('2c the sides are read off the paper’s own names: Customer is you, Warehouse is them',
      !!vi && vi.lines.some(l => l.side === 'you' && /^pay each undisputed invoice/.test(l.say) && l.cite === 'VI.3')
        && vi.lines.some(l => l.side === 'them' && /^invoice Customer monthly/.test(l.say) && l.cite === 'VI.2')
        && vi.lines.some(l => l.side === 'you' && /^withhold payment/.test(l.say) && /may/i.test(l.chip)),
      vi ? JSON.stringify(vi.lines.map(l => [l.chip, l.cite, l.say.slice(0, 30)])) : '—');
    check('2d sorted by who: every line of yours before any of theirs',
      !!vi && vi.lines.length >= 3 && vi.lines.findIndex(l => l.side === 'them') > vi.lines.map(l => l.side).lastIndexOf('you'),
      vi ? vi.lines.map(l => l.side).join(',') : '—');
    check('2e the balance line counts the lines', !!vi && /You 3/.test(vi.bal) && /They 1/.test(vi.bal) && /· 4$/.test(vi.whoHead),
      vi ? `${vi.whoHead} · ${vi.bal}` : '—');

    await pick(/TERM, TERMINATION/);
    const xiv = await read();
    check('2f "either party may" is both, twice, and the transition duty is both',
      !!xiv && xiv.lines.filter(l => l.side === 'both' && /may/i.test(l.chip)).length === 2
        && xiv.lines.some(l => l.side === 'both' && /^cooperate in good faith/.test(l.say) && l.cite === 'XIV.4'),
      xiv ? JSON.stringify(xiv.lines.map(l => [l.chip, l.cite, l.say.slice(0, 30)])) : '—');
    const aligned = await page.evaluate(() => {
      const xs = [...document.querySelectorAll('#doc-xray .doc-xr-wd .doc-xr-wdt')].map(e => Math.round(e.getBoundingClientRect().left));
      return { xs, same: xs.length >= 2 && xs.every(x => x === xs[0]) };
    });
    check('2f2 every line’s words start at the same place, whatever its chip says',
      aligned.same, JSON.stringify(aligned.xs));
    check('2g the term itself is not a line — nobody is told to do anything in XIV.1',
      !!xiv && xiv.lines.length > 0 && !xiv.lines.some(l => l.cite === 'XIV.1'), xiv ? xiv.lines.map(l => l.cite).join(',') : '—');

    /* ===== 3. THE OBLIGATIONS TAB ===== */
    check('3a an obligation on the tab is ticked on its own line, with its day',
      !!xiv && xiv.lines.some(l => l.cite === 'XIV.4' && /On Obligations/.test(l.ob) && /2029/.test(l.ob)),
      xiv ? JSON.stringify(xiv.lines.map(l => l.ob)) : '—');
    await page.screenshot({ path: path.join(OUT, '02-article-xiv.png') });

    await pick(/INSURANCE/);
    const ix = await read();
    check('3b where the sentence names nobody, the tab’s owner answers: They must',
      !!ix && ix.lines.some(l => l.side === 'them' && /Certificates of insurance/.test(l.say) && /On Obligations/.test(l.ob)),
      ix ? JSON.stringify(ix.lines.map(l => [l.chip, l.say.slice(0, 30), l.ob])) : '—');

    /* ===== 4. THE PRESSES ===== */
    await pick(/TERM, TERMINATION/);
    const moved = await page.evaluate(async () => {
      const sc = document.getElementById('doc-scroll');
      if (sc) sc.scrollTop = 0;
      await new Promise(z => setTimeout(z, 200));
      const b = [...document.querySelectorAll('#doc-xray .doc-xr-wd')].find(x => /cooperate in good faith/.test(x.textContent));
      if (!b) return null;
      const top0 = sc ? sc.scrollTop : -1;
      b.click();
      await new Promise(z => setTimeout(z, 900));
      const marks = [...document.querySelectorAll('#doc-canvas .anchor-flash')];
      const r = marks.length ? marks[0].getBoundingClientRect() : null;
      const box = sc ? sc.getBoundingClientRect() : null;
      return { top0, top1: sc ? sc.scrollTop : -1, marked: marks.map(m => m.textContent).join(''),
        inView: !!(r && box && r.top >= box.top && r.bottom <= box.bottom) };
    });
    check('4a pressing a line takes the paper to that sentence and lights it',
      !!moved && moved.top1 > moved.top0 && /the parties shall cooperate/i.test(moved.marked) && moved.inView,
      JSON.stringify(moved));
    const door = await page.evaluate(async () => {
      const b = document.querySelector('#doc-xray [data-xr-ob]');
      if (!b) return null;
      b.click();
      await new Promise(z => setTimeout(z, 700));
      const lit = document.querySelector('.room-tab[aria-selected="true"]');
      return lit ? lit.getAttribute('data-ws-tab') : null;
    });
    check('4b the door lands on the Obligations tab', door === 'oblig', String(door));

    /* ===== 5. THE CONTRACT DOES NOT MOVE ===== */
    /* A CONTROL as well as a wall: the X-ray has never moved the paper, and
       this proves the new section did not start to. */
    check('5a [control] the paper keeps its place with the X-ray open (refusal 3)',
      !!before && !!during && during.top === before.top && during.left === before.left && during.sheetW === before.sheetW,
      JSON.stringify({ before, during }));

    /* Back on the Document tab the switch lands on Contract View (its own
       rule), so X-ray is asked for again before the night is measured. */
    await page.evaluate(() => { roomGoTab(getContract(state.activeId), 'docs'); });
    await page.waitForTimeout(900);
    await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark');
      if (typeof setDark === 'function') setDark(true);
      const c = getContract(state.activeId);
      docViewSet('xray'); if (typeof applyWsTabs === 'function') applyWsTabs(c); });
    await page.waitForTimeout(900);
    await pick(/INDEMNIFICATION/);
    const night = await read();
    const nightInk = await page.evaluate(() => {
      const c = document.querySelector('#doc-xray .doc-xr-who');
      return c ? getComputedStyle(c).color : '';
    });
    check('5b at night Worth a look is still the one reddish area, and a chip is still inked',
      !!night && night.lookHas && reddish(night.lookBg) && !!nightInk,
      night ? `${night.lookBg} · ${nightInk}` : '—');
    await page.screenshot({ path: path.join(OUT, '03-night.png') });

    check('6 [control] no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
