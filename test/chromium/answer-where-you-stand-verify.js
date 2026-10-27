/* Chromium verification: ANSWER WHERE YOU STAND — the imports trial
   ============================================================
   The owner, 18 Oct 2026: "if I am in explorer and I say show me all imports,
   it does not take me to another window like the imports page … assessment of
   current screen vs moving someone to another screen if the information is in
   multiple locations" — and, on the plan, "yes, build the imports trial".
   Two contracts are marked imported (c.migration, as the Import page writes
   it). Typed into Home's Jambo box, as a person types:
     1. on Explorer, "show me all imports" narrows the map to the imported two
        and stays; the answer carries "Open Import contracts", which opens that
        page when pressed; nothing is asked of a model
     2. on Explorer, "imports" alone does the same; "which contracts were
        imported?" lights them
     3. a page named outright ("open the import page") or the page's own act
        ("import old contracts") still goes to Import contracts
     4. on the Contracts place, "show me all imports" narrows the list to the
        two and stays, with the same door; "show me the signed imported
        contracts" keeps both conditions; nothing found is said and the list
        is left whole
     5. on Home (which shows no contracts), the words still go to the page
     6. the answer with its door at the owner's three screens: inside Jambo's
        panel
     7. no page errors
   Waits ask for the state, bounded. Red at main 65dbae50: 1a–1c, 1e, 2a, 2b,
   4a–4d, 6.
   Screenshots: test/chromium/shots/answer-where-you-stand/ (or HATI_SHOT_DIR).
   Run: node test/chromium/answer-where-you-stand-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'answer-where-you-stand');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const IMPORTED = ['MK-A1', 'MK-A2'];
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    await page.waitForTimeout(600);
    /* two contracts brought in through Import, as the Import page marks them; every model call is written down */
    await page.evaluate(ids => {
      ids.forEach(id => { const c = getContract(id); c.migration = { batch: 'b1', importedAt: new Date().toISOString(), importedBy: 'Admin' }; });
      const real = window.api; window.__ai = [];
      window.api = async (p, m, b) => { if (/^ai\//.test(p)){ window.__ai.push(p); return p === 'ai/graph' ? { kind: 'map', say: 'model', acts: [] } : {}; } return real(p, m, b); };
    }, IMPORTED);
    const toExplorer = () => page.evaluate(() => { setView('dashboard'); hbSetFace('explorer'); intel.lenses = []; intel.history = []; window.__ai.length = 0; })
      .then(() => until(() => state.view === 'dashboard' && hbFace() === 'explorer' && !!document.getElementById('igd-input') && !intel.busy));
    /* RE-POINTED 27 Oct 2026: the panel beside Contracts redraws once Discover's summary lands (its Overview
       carries Discover), which can swap the ask box out between the fill and the Enter; wait, bounded, until
       the same box has stood for half a second */
    const settled = () => page.evaluate(async () => { const t0 = Date.now(); let box = document.getElementById('igd-input'), since = Date.now();
      while (Date.now() - t0 < 6000) { await new Promise(r => setTimeout(r, 100)); const now = document.getElementById('igd-input');
        if (now !== box) { box = now; since = Date.now(); } else if (box && Date.now() - since >= 500) return true; } return false; });
    const toPlace = () => page.evaluate(() => { regShowOnly([], ''); hbOpenContracts(); intel.history = []; window.__ai.length = 0; })
      .then(() => until(() => !!document.getElementById('ct-place') && !!document.getElementById('igd-input') && !intel.busy)).then(async ok => (await settled()) && ok);
    /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): everything typed on a Jambo tab goes to the AI (igTalkFirst); this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
    const ask = async q => { await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); } }); await page.fill('#igd-input', q); await page.press('#igd-input', 'Enter'); await page.waitForTimeout(400); await until(() => !intel.busy); };
    const mapLens = () => page.evaluate(() => (intel.lenses || []).filter(l => l.on !== false).map(l => ({ action: l.action, ids: (l.ids || []).slice().sort() })));
    const door = () => page.evaluate(() => { const b = document.querySelector('#ig-dock .ca-here [data-ca-act="herepage"]'); return b ? b.textContent.trim() : ''; });
    const lastSaid = () => page.evaluate(() => { const m = intel.history.filter(x => x.role === 'assistant').slice(-1)[0]; return m ? String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; });
    const want = IMPORTED.slice().sort().join(',');

    console.log('\n1 · on Explorer, "show me all imports" is answered on the map');
    check('1 · on Explorer', !!(await toExplorer()));
    await ask('show me all imports');
    const v1 = await page.evaluate(() => ({ view: state.view, face: hbFace() }));
    const l1 = await mapLens();
    check('1a it stays on Explorer', v1.view === 'dashboard' && v1.face === 'explorer', JSON.stringify(v1));
    check('1b the map shows the imported two, and only them', l1.some(l => l.action === 'filter' && l.ids.join(',') === want), JSON.stringify(l1));
    const d1 = await door();
    check('1c the answer offers Import contracts as a door', /Import contracts/.test(d1), d1 || 'no door');
    check('1d no model was asked', (await page.evaluate(() => window.__ai.length)) === 0, JSON.stringify(await page.evaluate(() => window.__ai)));
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `1-explorer-${w}x${hgt}.png`) }); }
    const fit = [];
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      fit.push(await page.evaluate(() => { const b = document.querySelector('#ig-dock .ca-here'), p = document.getElementById('ig-dock'); if (!b || !p) return { w: innerWidth, ok: false };
        const r = b.getBoundingClientRect(), q = p.getBoundingClientRect(); return { w: innerWidth, h: innerHeight, ok: r.left >= q.left - 1 && r.right <= q.right + 1 }; })); }
    await page.setViewportSize({ width: 1440, height: 780 });
    check('6 the answer and its door sit inside Jambo\'s panel at all three screens', fit.every(f => f.ok), JSON.stringify(fit));
    /* guarded: where there is no door, it is reported, never waited on */
    const pressed = await page.evaluate(() => { const b = document.querySelector('#ig-dock .ca-here [data-ca-act="herepage"]'); if (!b) return false; b.click(); return true; });
    const onPage = pressed && await until(() => state.view === 'migration');
    check('1e pressing the door opens Import contracts', !!onPage, pressed ? await page.evaluate(() => state.view) : 'no door to press');

    console.log('\n2 · the same with other words');
    await toExplorer(); await ask('imports');
    const l2 = await mapLens();
    check('2a "imports" alone narrows the map the same way', l2.some(l => l.action === 'filter' && l.ids.join(',') === want) && (await page.evaluate(() => hbFace())) === 'explorer', JSON.stringify(l2));
    await toExplorer(); await ask('which contracts were imported?');
    const l3 = await mapLens();
    check('2b "which contracts were imported?" lights the two', l3.some(l => l.ids.join(',') === want) && (await page.evaluate(() => state.view)) === 'dashboard', JSON.stringify(l3));

    console.log('\n3 · the page named, or its own act, still goes there');
    await toExplorer(); await ask('open the import page');
    check('3a "open the import page" opens Import contracts', !!(await until(() => state.view === 'migration')), await page.evaluate(() => state.view));
    await toExplorer(); await ask('import old contracts');
    check('3b "import old contracts" opens Import contracts', !!(await until(() => state.view === 'migration')), await page.evaluate(() => state.view));

    console.log('\n4 · on the Contracts place, the list is narrowed');
    check('4 · on the Contracts place', !!(await toPlace()));
    await ask('show me all imports');
    const o4 = await until(() => { const o = regState().only; return o && Array.isArray(o.ids) ? { ids: o.ids.slice().sort(), place: !!document.getElementById('ct-place') } : null; });
    check('4a the list shows the imported two and stays', !!o4 && o4.ids.join(',') === want && o4.place, JSON.stringify(o4));
    check('4b the answer says so and offers Import contracts', /^The list now shows 2: imported\.$/.test(await lastSaid()) && /Import contracts/.test(await door()), await lastSaid());
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `4-contracts-${w}x${hgt}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await toPlace(); await ask('show me the signed imported contracts');
    const signedOnes = await page.evaluate(ids => ids.filter(id => getContract(id).status === 'Signed').sort(), IMPORTED);
    const o5 = await until(() => { const o = regState().only; return o && Array.isArray(o.ids) ? o.ids.slice().sort() : null; });
    check('4c both conditions are kept: signed AND imported', !!o5 && signedOnes.length > 0 && o5.join(',') === signedOnes.join(','), JSON.stringify({ got: o5, want: signedOnes }));
    await toPlace(); await ask('show me the imported drafts that are declined');
    const o6 = await page.evaluate(() => regState().only);
    check('4d nothing found is said, and the list is left whole', o6 == null && /^No contracts match/.test(await lastSaid()), JSON.stringify({ only: o6, said: await lastSaid() }));
    check('4e and no model was asked on the list', (await page.evaluate(() => window.__ai.length)) === 0);

    console.log('\n5 · where no contracts are shown, the words go to the page');
    await page.evaluate(() => setView('counter')); await until(() => !!document.getElementById('cn-q'));
    /* re-pinned 27 Oct 2026: words TYPED on Home go to the brain first; this tests the free readers, asked as a chip asks (counterAsk) */ await page.evaluate(() => counterAsk('show me all imports'));
    check('5 from Home it opens Import contracts', !!(await until(() => state.view === 'migration')), await page.evaluate(() => state.view));
    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
