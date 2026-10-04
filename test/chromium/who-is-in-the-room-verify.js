/* WHO IS IN THE ROOM — two real people, two browsers, one contract.
 *
 * Young picked "On this contract": a row of initials in the contract's header,
 * and nothing on the paper.
 *
 * WHAT THIS DRIVES, where each person looks:
 *   1. one person alone sees NOTHING — an empty slot with a caption would be a
 *      band about an absence;
 *   2. a colleague opens the same contract and the header says so, in initials,
 *      with the whole name on the hover;
 *   3. and nothing else moves: not the paper, not the register's "updated"
 *      column, not the record's version — presence is not an edit;
 *   4. the counterparty's page carries none of it, and the payload does not;
 *   5. leaving the page leaves the room, and the row empties.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than times
 * out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'who-is-in-the-room');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DEAL = {
  id: 'MK-R1', contractNo: 'MK-R1', name: 'Reseller Agreement',
  counterparty: 'Juno Limited', counterpartyEmail: 'legal@juno.example',
  folder: 'proc', value: 600000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '2 Oct 2026', expiry: '2029-01-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 600000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-5), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [], negotiation: { round: 1, rounds: [] },
  body: '<h2>4. Payment Terms</h2><p>Invoices are payable within 60 days.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 12000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const login = async (email, pass, tag) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', email);
    await p.fill('#li-pass', pass);
    await p.click('#li-go');
    await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 15000);
    await until(p, () => typeof getContract === 'function' && !!getContract('MK-R1'), null, 15000);
    return { ctx, p };
  };
  /* The slot as it is really painted — not the builder's output, the page's. */
  const slot = p => p.evaluate(() => {
    const el = document.querySelector('[data-pz-slot]');
    const row = el && el.querySelector('.pz-row');
    const face = row && row.querySelector('.pz-face');
    const r = face ? face.getBoundingClientRect() : null;
    const hit = r ? document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)) : null;
    return { slot: !!el, row: !!row, n: row ? Number(row.getAttribute('data-pz-here')) : 0,
      faces: row ? row.querySelectorAll('.pz-face').length : 0,
      text: row ? row.textContent.replace(/\s+/g, ' ').trim() : '',
      title: row ? (row.getAttribute('title') || '') : '',
      painted: !!(face && hit && (hit === face || face.contains(hit))),
      w: r ? Math.round(r.width) : 0 };
  });

  try {
    const a = await login('admin@example.co.ke', 'adminpassword1', 'a');
    const b = await login('everything@example.co.ke', 'their-own-pass-9', 'b');
    const names = await Promise.all([a, b].map(x => x.p.evaluate(() => currentUser().name)));
    ok('0 two people are signed in', names.every(Boolean), names.join(' + '));

    /* ===== 1. ALONE IN THE ROOM ===== */
    await a.p.evaluate(() => openWorkspace('MK-R1'));
    await until(a.p, () => state.view === 'workspace' && !!document.querySelector('[data-pz-slot]'));
    await a.p.waitForTimeout(700);
    const alone = await slot(a.p);
    ok('1a the slot is on the head, painted by the beat', alone.slot);
    ok('1b and it says NOTHING while you are the only one here',
      !alone.row && !alone.text, JSON.stringify(alone.text));
    const before = await a.p.evaluate(() => { const c = getContract('MK-R1');
      const paper = document.querySelector('#doc-canvas, .doc-surface');
      return { v: c._v || null, last: c.lastAction || '',
        /* THE CONTRACT'S PIXELS, measured before anybody else is here. */
        top: paper ? +paper.getBoundingClientRect().top.toFixed(4) : null }; });

    /* ===== 2. A COLLEAGUE ARRIVES ===== */
    await b.p.evaluate(() => openWorkspace('MK-R1'));
    await until(b.p, () => state.view === 'workspace');
    /* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause before
       measuring. The first browser learns on its own next beat. */
    const told = await until(a.p, () => {
      const el = document.querySelector('[data-pz-slot] .pz-row');
      return !!el && Number(el.getAttribute('data-pz-here')) >= 1;
    }, null, 40000);
    const two = await slot(a.p);
    ok('2a the first person is told a colleague has it open', told && two.n === 1, JSON.stringify(two.n));
    ok('2b in initials, really painted, at the size a header can carry',
      two.faces === 1 && two.painted && two.w > 10 && two.w < 26, JSON.stringify([two.faces, two.painted, two.w]));
    ok('2c with the whole name on the hover, and a sentence a person can read',
      /Unrestricted Legal/.test(two.title) && /open/i.test(two.title), JSON.stringify(two.title));
    ok('2d and the initials are the desk\'s own shortener',
      two.text === 'UL', JSON.stringify(two.text));
    await a.p.screenshot({ path: path.join(OUT, '1-two-in-the-room.png') });
    /* AND THE SECOND PERSON SEES THE FIRST — it is not a one-way mirror. */
    const back = await until(b.p, () => {
      const el = document.querySelector('[data-pz-slot] .pz-row');
      return !!el && Number(el.getAttribute('data-pz-here')) >= 1;
    }, null, 40000);
    const bRow = await slot(b.p);
    ok('2e and the colleague sees them back', back && /Amina/.test(bRow.title), JSON.stringify(bRow.text));
    /* ---- AND IT COSTS THE CONTRACT NOTHING ----
       THE THIRD QUESTION'S OWN REFUSAL: measure window top to the first line
       of wording before and after, and refuse any growth. MEASURED, and the
       first build failed it: a 17px face on a line of 12px text grew that
       line, and approval-before-signing 7a caught the paper moving
       300.875 → 301.390625 the moment a second person opened the contract.
       The row is zero high and its faces overflow it, so the line box is
       formed as if it were not there. */
    const after2 = await a.p.evaluate(() => { const paper = document.querySelector('#doc-canvas, .doc-surface');
      return paper ? +paper.getBoundingClientRect().top.toFixed(4) : null; });
    ok('2f and the contract did not move by a pixel when they arrived',
      before.top != null && after2 === before.top, `${before.top} → ${after2}`);

    /* ===== 3. NOTHING ELSE MOVED ===== */
    const after = await a.p.evaluate(async () => {
      const r = await api('contracts/MK-R1');
      return { v: r._v || null, last: r.lastAction || '', here: !!r.here };
    });
    ok('3a presence is NOT an edit: the record\'s version has not moved',
      String(after.v) === String(before.v), JSON.stringify([before.v, after.v]));
    ok('3b nor has the register\'s "updated" column',
      after.last === before.last, JSON.stringify([before.last, after.last]));
    ok('3c and it IS on the record, where the clause lock lives', after.here === true);
    /* A SAVE MUST NOT WIPE SOMEBODY OUT OF A ROOM THEY ARE SITTING IN: the
       first browser saves a record it fetched before the colleague arrived. */
    const wiped = await a.p.evaluate(async () => {
      const c = getContract('MK-R1');
      const body = JSON.parse(JSON.stringify(c));
      delete body.here;
      const r = await fetch('/api/contracts/MK-R1', { method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: body, baseVersion: body._v }) });
      const back = await (await fetch('/api/contracts/MK-R1')).json();
      return { status: r.status, still: Object.keys(back.here || {}).length };
    });
    ok('3d an ordinary save cannot take a colleague out of the room',
      wiped.status === 200 && wiped.still >= 2, JSON.stringify(wiped));
    const paper = await a.p.evaluate(() => {
      const sheet = document.querySelector('#doc-sheet-host, .doc-surface');
      return { marks: document.querySelectorAll('.doc-surface .pz-face, .doc-surface .pz-row, .nego-clause .pz-row').length,
        sheet: !!sheet };
    });
    ok('3e and NOTHING is drawn on the paper', paper.marks === 0, JSON.stringify(paper));

    /* ===== 4. THE COUNTERPARTY LEARNS NOTHING ===== */
    const shared = await a.p.evaluate(async () => {
      const c = getContract('MK-R1');
      c._loaded = false; await ensureFull(c);
      const pl = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      const mine = !!(pl.contract && pl.contract.here);
      /* AND THE ROUTE, with it hand-built back in: an allow-list holds only
         until somebody adds a field. */
      pl.contract.here = { forged: { name: 'Amina Otieno', at: new Date().toISOString() } };
      const r = await api('shares', 'POST', { payload: pl, channel: 'link', purpose: 'negotiate',
        recipient: { name: 'Juno Limited', email: 'legal@juno.example' } });
      const got = await (await fetch('/api/shares/' + r.token)).json();
      return { mine, carried: !!(got.payload && got.payload.contract && got.payload.contract.here), token: r.token };
    });
    ok('4a the payload the browser builds does not carry it', shared.mine === false);
    ok('4b and the route strips it out of a hand-built envelope', shared.carried === false);
    const theirs = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    const tp = await theirs.newPage();
    await tp.goto(h.base + '/#share=t:' + shared.token, { waitUntil: 'networkidle' });
    await until(tp, () => !!document.querySelector('#share-root .pw-id, #share-root .ps-page, #pt-nego'), null, 16000);
    /* THE SENDER'S NAME IS NOT A LEAK and never was: a deal has a named
       contact, the payload has always carried it, and the page says "shared by"
       in those words. What must not cross is WHO ELSE on our side is reading —
       a colleague merely in the room is a negotiating fact. */
    const onTheirs = await tp.evaluate(() => ({
      row: document.querySelectorAll('.pz-row, .pz-face').length,
      reader: /Unrestricted Legal/.test(document.body.innerText),
      sender: /Amina/.test(document.body.innerText) }));
    ok('4c their page draws no row, and nobody who was merely reading is named',
      onTheirs.row === 0 && onTheirs.reader === false, JSON.stringify(onTheirs));
    ok('4c2 the sender IS named, as they always have been — that is the contact, not a leak',
      onTheirs.sender === true, JSON.stringify(onTheirs.sender));

    /* ===== 5. LEAVING THE ROOM LEAVES THE ROOM ===== */
    await b.p.evaluate(() => setView('register'));
    const stopped = await b.p.evaluate(() => (window.presenceWatching ? presenceWatching() : 'no-fn'));
    ok('5a leaving the page stops the beat', stopped === null, JSON.stringify(stopped));
    /* GUARDED, so a tree without the route REPORTS rather than throwing and
       taking the rest of the stage with it. */
    const gone = await a.p.evaluate(async () => {
      try {
        const r = await api('contracts/MK-R1/here', 'POST', {});
        return (r && r.here || []).length;
      } catch (e) { return 'no route'; }
    });
    ok('5b and the colleague is still counted until their last beat ages out',
      gone === 1, String(gone));
    /* THE AGEING WINDOW IS NOT DRIVEN HERE. A stage whose answer depends on a
       seventy-five-second sleep is a stage nobody runs, and the two windows
       (the browser's and the server's) are pinned against each other in
       f454 (4) instead — PIN THE RELATION, which is the right tool for a
       number two files have to agree on. What IS driven here is that the beat
       stops and the row does not lie about it. */
    const after5a = await b.p.evaluate(() => (window.presenceWatching ? presenceWatching() : 'no-fn'));
    ok('5c and coming back to the contract starts it again', await (async () => {
      await b.p.evaluate(() => openWorkspace('MK-R1'));
      await until(b.p, () => (window.presenceWatching ? presenceWatching() : null) === 'MK-R1', null, 12000);
      return (await b.p.evaluate(() => (window.presenceWatching ? presenceWatching() : null))) === 'MK-R1';
    })(), JSON.stringify(after5a));

    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
