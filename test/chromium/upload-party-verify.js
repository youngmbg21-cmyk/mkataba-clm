/* Chromium verification: THE UPLOAD NAMES OUR ENTITY, AND THE PAGE SURVIVES IT.
   ============================================================
   Owner-reported 20 Aug 2026, off MK-358 (an imported third-party .docx): "the
   contract workspace could not be drawn — OURS is not defined". The banner
   sentence on a received-and-not-yet-executed upload names OUR party, and it
   reached for docBody's own local OURS — a different function's variable — so
   the FIRST upload in that state took the whole workspace down. Template
   contracts never draw the sentence and migrated-executed uploads take the
   other branch, which is why 150 contracts hid it.

   The owner's chosen fix rides with it: the upload popup asks WHO WE ARE on
   this agreement — a datalist behind an ordinary text box (the FX picker's
   rule: it offers the workspace name and every entity already on a contract,
   and refuses nothing typed).

   And one more owner ask off a screenshot the same day: the sidebar counts sat
   ragged, each right after its own label, because the floating drawer's open
   state gave every nav button width:auto. Full-width buttons put every count
   on one straight column at the drawer's right edge.

   All three are geometry or real-press claims, so they live in a browser file.
   Screenshots go to test/chromium/shots/upload-party/.
   Run: node test/chromium/upload-party-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const OUT = path.join(__dirname, 'shots', 'upload-party');
fs.mkdirSync(OUT, { recursive: true });
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ============ 1. THE REPORTED CRASH, ON THE REPORTED STATE ============
       An uploaded contract that is NOT executed outside — received on their
       paper, waiting to be reviewed and signed here. Before the fix this
       threw "OURS is not defined" and the room drew the red error card. */
    await page.evaluate(() => {
      state.contracts.unshift({
        id: 'UPX-1', name: '3rd Party Contract', counterparty: 'Momo Beach Ltd',
        folder: 'proc', value: 500000, valueType: 'estimated', status: 'Under Review',
        template: null, source: 'upload', expiry: null, hash: null, signedAt: null,
        compliance: {}, fields: {}, scan: null, signatures: [],
        rounds: [], audit: [], changes: [], obligations: [], comments: [],
        upload: { fileName: '3rd_Party_Contract.docx',
          mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extractedText: 'THIRD PARTY SERVICES AGREEMENT. '.repeat(12), textSource: 'docx' },
        _loaded: true, _light: false, _v: 0,
      });
      state.activeId = 'UPX-1';
      setView('workspace');
      if (window.roomGoTab) roomGoTab('docs');
    });
    await page.waitForTimeout(900);
    let body = await page.evaluate(() => document.getElementById('content').innerText);
    check('the workspace DRAWS for a received, not-yet-signed upload',
      !/could not be drawn/i.test(body) && !/not defined/i.test(body) && /3rd Party Contract/.test(body),
      'no error card');
    const firstParty = await page.evaluate(() => window.FIRST_PARTY || '');
    check('with no entity on the record the banner names the workspace — the old fallback, out loud',
      firstParty && body.includes(firstParty), firstParty);
    check('and it is the received-paper sentence, on the reported branch',
      /acceptance with a cryptographic seal/i.test(body));

    /* The banner reads the contract's own entity where one is named —
       contractParty, the same reading the recitals use. */
    await page.evaluate(() => {
      const c = state.contracts.find(x => x.id === 'UPX-1');
      c.party = 'Highland Juice Kenya Ltd';
      setView('workspace');
      if (window.roomGoTab) roomGoTab('docs');
    });
    await page.waitForTimeout(600);
    body = await page.evaluate(() => document.getElementById('content').innerText);
    check('an entity on the record is the name the banner prints',
      body.includes('Highland Juice Kenya Ltd') && !/could not be drawn/i.test(body));
    await page.screenshot({ path: path.join(OUT, '1-upload-room-draws.png') });

    /* ============ 2. THE POPUP ASKS WHO WE ARE — with a real Word file ==== */
    const docxBytes = mkDocx([
      para('THIRD PARTY SERVICES AGREEMENT'),
      para('This Agreement is made between Third Party Ltd and the Client.'),
      para('1. Services. The Supplier shall provide the services described herein.'),
      para('2. Term. This Agreement runs for twelve months from signature.'),
    ].join(''));
    const tmpDocx = path.join(OUT, '3rd_Party_Contract.docx');
    fs.writeFileSync(tmpDocx, Buffer.from(docxBytes));

    await page.evaluate(() => { closeModal && closeModal(); openUploadModal(); });
    await page.waitForTimeout(400);
    const skel = await page.evaluate(() => {
      const el = document.getElementById('up-party');
      const dl = document.getElementById('up-party-list');
      return el && {
        value: el.value, listWired: !!(el.list && el.list.id === 'up-party-list'),
        opts: dl ? [...dl.options].map(o => o.value) : [],
      };
    });
    check('the field is on the popup from the first render, prefilled with the workspace',
      skel && skel.value === firstParty, skel && skel.value);
    check('the box is WIRED to its list — the browser\'s own datalist, not decoration',
      skel && skel.listWired);
    check('the list offers the workspace AND an entity already used on a contract',
      skel && skel.opts.includes(firstParty) && skel.opts.includes('Highland Juice Kenya Ltd'),
      skel && skel.opts.join(' | '));

    await page.setInputFiles('#up-file', tmpDocx);
    await page.waitForFunction(() => {
      const s2 = document.getElementById('up-step-2');
      return s2 && !s2.classList.contains('hidden');
    }, null, { timeout: 20000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '2-popup-asks-who-we-are.png') });

    /* A typed entity that is on NOBODY's list must still be accepted —
       the list offers, it does not refuse. */
    await page.fill('#up-party', 'Momo Beach Distillers Ltd');
    const cpNow = await page.evaluate(() => document.getElementById('up-cp').value);
    if (!cpNow) await page.fill('#up-cp', 'Third Party Ltd');
    await page.click('#up-go');
    await page.waitForTimeout(1600);
    const filed = await page.evaluate(() => {
      const c = state.contracts[0];
      return { id: c.id, party: c.party || '', source: c.source };
    });
    check('File contract carries the typed entity onto the record',
      filed.source === 'upload' && filed.party === 'Momo Beach Distillers Ltd',
      JSON.stringify(filed));

    await page.evaluate(() => { if (window.roomGoTab) roomGoTab('docs'); });
    await page.waitForTimeout(700);
    body = await page.evaluate(() => document.getElementById('content').innerText);
    check('and the freshly filed upload\'s page draws, naming that entity — the loop the owner was stuck in, closed',
      !/could not be drawn/i.test(body) && body.includes('Momo Beach Distillers Ltd'));
    await page.screenshot({ path: path.join(OUT, '3-filed-and-drawn.png') });

    /* ============ 3. THE COUNTS SIT ON ONE STRAIGHT LINE ============
       Measured, not inferred: every visible count badge's RIGHT edge, in the
       floating drawer (below 1500) and in the open column (above). Labels are
       all different lengths, so equal right edges can only mean full-width
       rows with the badge pushed to the column. */
    const readBadges = () => page.evaluate(() => {
      const nav = document.getElementById('side-nav').getBoundingClientRect();
      const rights = [...document.querySelectorAll('#side-nav .nav-count')]
        .filter(el => el.textContent.trim() !== '' && el.getBoundingClientRect().width > 0)
        .map(el => Math.round(el.getBoundingClientRect().right));
      return { rights, navRight: Math.round(nav.right) };
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);
    await page.click('#cmd-rail');            // the drawer's own door
    await page.waitForTimeout(600);
    let b = await readBadges();
    let spread = b.rights.length ? Math.max(...b.rights) - Math.min(...b.rights) : -1;
    check('1440 drawer: at least four counts are on screen to measure', b.rights.length >= 4, b.rights.length);
    check('1440 drawer: every count shares ONE right edge', spread >= 0 && spread <= 1, `spread ${spread}px`);
    check('1440 drawer: and that edge is the drawer\'s own right padding, not mid-air',
      b.rights.length && (b.navRight - Math.max(...b.rights)) <= 40,
      `${b.navRight - Math.max(...b.rights)}px in from the drawer's edge`);
    await page.screenshot({ path: path.join(OUT, '4-drawer-counts-aligned.png') });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(800);
    b = await readBadges();
    spread = b.rights.length ? Math.max(...b.rights) - Math.min(...b.rights) : -1;
    check('1920 column: the same straight line, as it always was', spread >= 0 && spread <= 1, `spread ${spread}px`);

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('journey completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})();
