/* KEYBOARD REACH — ⌘B, and the palette's semantics (25 Aug 2026).
   From the benchmark study: shadcn/Vercel's ⌘B is the settled sidebar binding
   (verified in their source), and Linear treats the command palette as primary
   navigation rather than a power-user shortcut.

   ONE FINDING IN THE AUDIT WAS WRONG AND IS CORRECTED HERE: the palette was
   reported as having no arrow keys. It has had ArrowUp/ArrowDown/Enter all
   along. What it genuinely lacked was listbox semantics, focus restore, a
   bounded Escape, and a translated empty state. Checked, not assumed. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  /* 1600 wide, ABOVE the 1440 float line, so ⌘B exercises the branch that
     flips the stored preference rather than the floating-layer branch. */
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(1600);

  /* RE-POINTED 17 Oct 2026 (the owner picked "Desk tabs", Round 2): on a computer the
     left menu is not drawn, so ⌘B has no column to fold; it must not bring one back */
  console.log('\n1 · ⌘B and the menu that is not drawn');
  const railW = () => page.evaluate(() => Math.round(document.getElementById('side-nav').getBoundingClientRect().width));
  const before = await railW();
  await page.keyboard.press(MOD + '+b');
  await page.waitForTimeout(450);
  const after = await railW();
  ok('there is no menu column, and ⌘B does not bring one back', before === 0 && after === 0, before + 'px → ' + after + 'px');
  await page.keyboard.press(MOD + '+b');
  await page.waitForTimeout(450);

  console.log('\n2 · ⌘B does not steal bold from an editor');
  /* richpaste.js binds ⌘B/I/U on the editor element and calls preventDefault
     but NOT stopPropagation, so the event still reaches the document handler.
     Unguarded, one press would bold the words AND collapse the sidebar. */
  const w1 = await railW();
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'kb-probe'; d.contentEditable = 'true';
    d.style.cssText = 'position:fixed;top:0;left:0;width:200px;height:40px;z-index:9999';
    d.textContent = 'probe';
    document.body.appendChild(d); d.focus();
  });
  await page.keyboard.press(MOD + '+b');
  await page.waitForTimeout(400);
  ok('the sidebar does not move while focus is in a contenteditable',
     (await railW()) === w1, w1 + 'px → ' + (await railW()) + 'px');
  await page.evaluate(() => document.getElementById('kb-probe').remove());

  const inp = await page.evaluate(() => {
    const i = document.createElement('input');
    i.id = 'kb-probe2'; i.style.cssText = 'position:fixed;top:0;left:0;z-index:9999';
    document.body.appendChild(i); i.focus(); return true;
  });
  const w2 = await railW();
  await page.keyboard.press(MOD + '+b');
  await page.waitForTimeout(400);
  ok('nor while focus is in a text field', inp && (await railW()) === w2);
  await page.evaluate(() => document.getElementById('kb-probe2').remove());

  console.log('\n3 · the palette announces itself');
  /* RE-POINTED 29 Oct 2026 (round 1 "The Legora way", owner's yes): ⌘K puts the hand in Jambo's box; the jump list is
     "/" pressed outside a box, off Home */
  await page.keyboard.press(MOD + '+k');
  await page.waitForTimeout(400);
  ok('⌘K puts the hand in Jambo\'s box', await page.evaluate(() => { const a = document.activeElement; return !!(a && a.closest && a.closest('.jb-card')); }));
  await page.evaluate(() => { setView('obligations'); });
  await page.waitForTimeout(700);
  await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
  await page.keyboard.press('/');
  await page.waitForTimeout(500);
  ok('it opened', await page.evaluate(() => !!document.getElementById('cmd-palette')));
  const sem = await page.evaluate(() => {
    const i = document.getElementById('cp-input'), l = document.getElementById('cp-list');
    return { role: i.getAttribute('role'), controls: i.getAttribute('aria-controls'),
             listRole: l.getAttribute('role'),
             opts: document.querySelectorAll('#cp-list [role="option"]').length,
             sel: document.querySelectorAll('#cp-list [aria-selected="true"]').length,
             active: i.getAttribute('aria-activedescendant') };
  });
  ok('the input is a combobox pointing at the list', sem.role === 'combobox' && sem.controls === 'cp-list');
  ok('the list is a listbox', sem.listRole === 'listbox');
  ok('rows are options', sem.opts > 0, sem.opts + ' options');
  ok('exactly one is selected', sem.sel === 1, sem.sel + ' selected');
  ok('and the input names it', !!sem.active && sem.active.startsWith('cp-opt-'), sem.active);

  console.log('\n4 · arrows move the named row (these already worked)');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  const moved = await page.evaluate(() => document.getElementById('cp-input').getAttribute('aria-activedescendant'));
  ok('ArrowDown moves it', moved === 'cp-opt-1', moved);
  ok('and still exactly one is selected',
     (await page.evaluate(() => document.querySelectorAll('#cp-list [aria-selected="true"]').length)) === 1);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(250);
  ok('ArrowUp moves it back',
     (await page.evaluate(() => document.getElementById('cp-input').getAttribute('aria-activedescendant'))) === 'cp-opt-0');

  console.log('\n5 · Escape closes this layer and stops');
  /* THE REAL CLAIM: the palette's handler is on document in CAPTURE, so
     without stopPropagation one press also reached the nav drawer's own
     Escape and any dialog behind it. */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  ok('the palette closed', await page.evaluate(() => !document.getElementById('cmd-palette')));
  /* RE-POINTED 29 Oct 2026 (round 1): opened by "/" with nothing focused, so the page itself has the hand back */
  ok('focus went back to whatever opened it (the page, for "/")',
     (await page.evaluate(() => document.activeElement === document.body || !document.activeElement)),
     await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName)));

  console.log('\n6 · the empty state speaks the reader\'s language');
  await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
  await page.keyboard.press('/');
  await page.waitForTimeout(400);
  await page.fill('#cp-input', 'zzzzzznotathing');
  await page.waitForTimeout(500);
  /* THE PALETTE IS NEVER EMPTY WITH A QUERY IN THE BOX — an "Ask Copilot" row
     is pushed unconditionally, which is the design: a question you can always
     hand over beats a dead end. So what is asserted here is the reachable
     truth, not an empty state that cannot occur. */
  const res = await page.evaluate(() => ({
    rows: document.querySelectorAll('#cp-list [role="option"]').length,
    text: document.getElementById('cp-list').textContent.trim(),
    active: document.getElementById('cp-input').getAttribute('aria-activedescendant') }));
  ok('a query with no matches still offers a way forward', res.rows === 1, res.rows + ' row(s)');
  ok('and it names what was searched for', res.text.includes('zzzzzznotathing'));
  ok('the pointer still names a real row', res.active === 'cp-opt-0', res.active);
  /* The genuinely-empty branch needs an empty query AND an empty workspace.
     Its sentence is pinned in both dictionaries by f148 rather than here. */
  ok('the empty-state sentence exists and is translated', await page.evaluate(() =>
     typeof i18t === 'function' && i18t('ap_no_matches') !== 'ap_no_matches'));
  await page.keyboard.press('Escape');

  console.log('\n7 · arrows walk the contract list');
  /* MEASURED before this shipped: zero ArrowDown handling in register.js, and
     on Negotiations the row press was the SOLE route in. */
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  await page.waitForTimeout(900);
  const rowInfo = () => page.evaluate(() => {
    const rows = [...document.querySelectorAll('#reg-tbody [data-row]')];
    const a = document.activeElement;
    return { n: rows.length, at: rows.indexOf(a),
             roving: rows.filter(r => r.getAttribute('tabindex') === '0').length,
             id: a && a.getAttribute && a.getAttribute('data-row') };
  });
  const start = await rowInfo();
  ok('rows are reachable and exactly one is in the tab order', start.n > 1 && start.roving === 1,
     start.n + ' rows, ' + start.roving + ' tab stop');

  await page.evaluate(() => document.querySelector('#reg-tbody [data-row]').focus());
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  const down = await rowInfo();
  ok('ArrowDown moves to the next row', down.at === 1, 'row ' + down.at);
  ok('and the tab stop moves with it', down.roving === 1, down.roving + ' tab stop');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  ok('ArrowUp moves back', (await rowInfo()).at === 0);
  await page.keyboard.press('End');
  await page.waitForTimeout(200);
  const end = await rowInfo();
  ok('End jumps to the last row', end.at === end.n - 1, 'row ' + end.at + ' of ' + end.n);
  await page.keyboard.press('Home');
  await page.waitForTimeout(200);
  ok('Home jumps back to the first', (await rowInfo()).at === 0);

  /* A ROW MUST LOOK FOCUSED. With border-collapse the <tr> paints no box, so
     an outline would have drawn nothing — the cells carry the rule. */
  ok('the focused row is visibly marked', await page.evaluate(() => {
    const td = document.querySelector('#reg-tbody [data-row][tabindex="0"] td');
    const sh = td ? getComputedStyle(td).boxShadow : 'none';
    return sh !== 'none' && sh.includes('inset');
  }));

  console.log('\n8 · Enter opens the row it is on');
  const wantId = (await rowInfo()).id;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  const opened = await page.evaluate(() => ({
    /* RE-POINTED 11 Oct 2026 (owner): opening a row lands on Home's Document, on it */
    view: (typeof state !== 'undefined' && state.view) || '', active: (window.intel && intel.paper && intel.paper.id) || (typeof state !== 'undefined' && state.activeId) || '' }));
  ok('Enter opened the focused contract', opened.active === wantId,
     'wanted ' + wantId + ', opened ' + opened.active + ' (view ' + opened.view + ')');

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
