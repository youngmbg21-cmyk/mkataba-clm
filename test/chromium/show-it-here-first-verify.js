/* Chromium verification: ANSWER WHERE YOU STAND — ONE RULE, EVERY SCREEN
   ============================================================
   The owner, 18 Oct 2026: "When I type show me all contracts in explorer it
   takes me to the contracts page"; then "why do you have to code such a rule
   in isolation? It should be a simple rule or code to show in your page
   unless it is not possible or you are instructed to go to another page";
   and, on the plan, "Yes".
   Typed into Home's Jambo box (and the Jambo window), as a person types:
     1. on Explorer, "show me all contracts" stays on Explorer, the map shows
        every contract, and the answer offers Contracts as a door, which opens
        the list at rest when pressed
     2. on Explorer, "show me signed contracts" narrows the map; the map's own
        door (one, never a second) opens the Contracts list narrowed the same
     3. on Explorer, "show me negotiations" and "show me our customers" narrow the map, with
        Negotiations and Parties as their doors
     4. the page named outright ("go to contracts", "open negotiations"), a
        pressed "/" row, or an act ("draft a contract") still goes there
     5. on the Contracts place, "show me the signed contracts" narrows the list
        and stays; "show me all contracts" lets it go
     6. the Jambo window, opened over Explorer, answers on the map too
     7. the answer and its door at the owner's three screens, inside Jambo's
        panel; nothing is asked of a model; no page errors
   Waits ask for the state, bounded. Red at main 73fabed0: 1a–1c, 1e, 3a, 3b,
   5a, 5b, 6a, 7a (2a–2c and 4 are guards: what worked there still does).
   Screenshots: test/chromium/shots/show-it-here-first/ (or HATI_SHOT_DIR).
   Run: node test/chromium/show-it-here-first-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'show-it-here-first');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
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
    /* two contracts on the customer side of the table, as the category field records it */
    await page.evaluate(() => ['MK-A1', 'MK-B2'].forEach(id => { const c = getContract(id); c.metadata = Object.assign({}, c.metadata, { category: 'customer' }); }));
    /* every model call is written down: none is expected */
    await page.evaluate(() => { const real = window.api; window.__ai = [];
      window.api = async (p, m, b) => { if (/^ai\//.test(p)){ window.__ai.push(p); return p === 'ai/graph' ? { kind: 'map', say: 'model', acts: [] } : {}; } return real(p, m, b); }; });
    const toExplorer = () => page.evaluate(() => { setView('dashboard'); hbSetFace('explorer'); intel.lenses = []; intel.history = []; })
      .then(() => until(() => state.view === 'dashboard' && hbFace() === 'explorer' && !!document.getElementById('igd-input') && !intel.busy));
    const toPlace = () => page.evaluate(() => { regShowOnly([], ''); hbOpenContracts(); intel.history = []; })
      .then(() => until(() => !!document.getElementById('ct-place') && !!document.getElementById('igd-input') && !intel.busy));
    const ask = async q => { await page.fill('#igd-input', q); await page.press('#igd-input', 'Enter'); await page.waitForTimeout(400); await until(() => !intel.busy); };
    const where = () => page.evaluate(() => ({ view: state.view, face: state.view === 'dashboard' ? hbFace() : '' }));
    const onExplorer = async () => { const w = await where(); return w.view === 'dashboard' && w.face === 'explorer'; };
    const mapIds = () => page.evaluate(() => { const a = intelActive(); return a.ids ? [...a.ids].sort() : null; });
    const door = () => page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .ca-here [data-ca-act="herepage"]')].pop(); return b ? b.textContent.trim() : ''; });
    /* guarded: where there is no door, it is reported, never waited on */
    const pressDoor = () => page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .ca-here [data-ca-act="herepage"]')].pop(); if (!b) return false; b.click(); return true; });
    const lastSaid = () => page.evaluate(() => { const m = intel.history.filter(x => x.role === 'assistant').slice(-1)[0]; return m ? String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; });
    const signedIds = await page.evaluate(() => state.contracts.filter(c => c && !c.archived && c.status === 'Signed').map(c => c.id).sort());

    console.log('\n1 · on Explorer, "show me all contracts" is answered on the map');
    check('1 · on Explorer', !!(await toExplorer()));
    await ask('show me signed contracts'); await ask('show me all contracts');
    check('1a it stays on Explorer', await onExplorer(), JSON.stringify(await where()));
    check('1b the map shows every contract again (no narrowing left)', (await mapIds()) === null, JSON.stringify(await mapIds()));
    const d1 = await door();
    check('1c the answer offers Contracts as a door', /Open them in Contracts/.test(d1), d1 || 'no door');
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `1-all-contracts-${w}x${hgt}.png`) }); }
    const fit = [];
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      fit.push(await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .ca-here')].pop(), p = document.getElementById('ig-dock'); if (!b || !p) return { w: innerWidth, ok: false };
        const r = b.getBoundingClientRect(), q = p.getBoundingClientRect(); return { w: innerWidth, h: innerHeight, ok: r.left >= q.left - 1 && r.right <= q.right + 1 && r.width > 0 }; })); }
    await page.setViewportSize({ width: 1440, height: 780 });
    check('7a the answer and its door sit inside Jambo\'s panel at all three screens', fit.every(f => f.ok), JSON.stringify(fit));
    const p1 = await pressDoor();
    const o1 = p1 && await until(() => !!document.getElementById('ct-place') && state.view === 'dashboard' && hbFace() === 'paper' ? { only: regState().only || null } : null);
    check('1e pressing it opens the Contracts list, every contract', !!o1 && o1.only === null, p1 ? JSON.stringify(o1) : 'no door to press');

    console.log('\n2 · a narrowing, and its door narrowed the same');
    await toExplorer(); await ask('show me signed contracts');
    const m2 = await mapIds();
    check('2a it stays on Explorer, the map narrowed to the signed ones', (await onExplorer()) && !!m2 && m2.join() === signedIds.join(), JSON.stringify({ map: m2, signed: signedIds }));
    const own2 = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock [data-ig-list]')].pop(); return b ? b.textContent.trim() : ''; });
    check('2b its door to Contracts is the map\'s own, and only one', /on the Contracts page/.test(own2) && !(await door()), JSON.stringify({ own: own2, second: await door() }));
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `2-signed-on-the-map-${w}x${hgt}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    const p2 = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock [data-ig-list]')].pop(); if (!b) return false; b.click(); return true; });
    const o2 = p2 && await until(() => { const o = regState().only; return document.getElementById('ct-place') && o && Array.isArray(o.ids) ? o.ids.slice().sort() : null; });
    check('2c pressed, the Contracts list shows the same contracts the map showed', !!o2 && !!m2 && o2.join() === m2.join(), p2 ? JSON.stringify(o2) : 'no door to press');

    console.log('\n3 · other facts, other doors');
    await toExplorer(); await ask('show me negotiations');
    check('3a "show me negotiations" narrows the map, with Negotiations as its door', (await onExplorer()) && !!(await mapIds()) && /Open Negotiations/.test(await door()), JSON.stringify({ at: await where(), door: await door() }));
    await toExplorer(); await ask('show me our customers');
    const cus = await page.evaluate(() => state.contracts.filter(c => c && !c.archived && paySide(c) === 'customer').map(c => c.id).sort());
    const m3 = await mapIds();
    check('3b "show me our customers" narrows the map to the customer contracts, with Parties as its door', (await onExplorer()) && cus.length > 0 && !!m3 && m3.join() === cus.join() && /Open Parties/.test(await door()),
      JSON.stringify({ at: await where(), map: m3, customers: cus, door: await door(), said: await lastSaid() }));

    console.log('\n4 · the page named, a "/" row, or an act still goes');
    await toExplorer(); await ask('go to contracts');
    check('4a "go to contracts" opens the Contracts place', !!(await until(() => !!document.getElementById('ct-place') && hbFace() === 'paper')), JSON.stringify(await where()));
    await toExplorer(); await ask('open negotiations');
    check('4b "open negotiations" opens Negotiations', !!(await until(() => state.view === 'redline')), JSON.stringify(await where()));
    await toExplorer(); await page.evaluate(() => caPlaceRun('negotiations'));
    check('4c a pressed "/" row for Negotiations opens it', !!(await until(() => state.view === 'redline')), JSON.stringify(await where()));
    await toExplorer(); await ask('draft a contract');
    const dr = await until(() => { const m = intel.history.filter(x => x.role === 'assistant').slice(-1)[0]; return m && m.act ? m.act.kind : (document.querySelector('.na-one, #na-q, #dr-say') ? 'form' : null); });
    check('4d "draft a contract" is the draft, not a narrowing of the map', !!dr && dr !== 'here' && (await mapIds()) === null, JSON.stringify({ act: dr, map: await mapIds() }));
    await page.evaluate(() => { const c = document.querySelector('[data-dlg-cancel]'); if (c) c.click(); });

    console.log('\n5 · on the Contracts place, the list');
    check('5 · on the Contracts place', !!(await toPlace()));
    await ask('show me the signed contracts');
    const o5 = await until(() => { const o = regState().only; return o && Array.isArray(o.ids) ? { ids: o.ids.slice().sort(), place: !!document.getElementById('ct-place') } : null; });
    const want5 = await page.evaluate(() => caContracts().filter(c => c.status === 'Signed').map(c => c.id).sort());
    check('5a the list shows the signed ones and stays', !!o5 && o5.place && o5.ids.join() === want5.join(), JSON.stringify({ got: o5, want: want5 }));
    check('5b the answer says so', /^The list now shows \d+: /.test(await lastSaid()), await lastSaid());
    for (const [w, hgt] of SCREENS){ await page.setViewportSize({ width: w, height: hgt }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `5-signed-on-the-list-${w}x${hgt}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await ask('show me all contracts');
    const o6 = await until(() => document.getElementById('ct-place') && !regState().only ? 'whole' : null);
    check('5c "show me all contracts" there lets the narrowing go, and stays', o6 === 'whole' && (await where()).face === 'paper', JSON.stringify({ only: await page.evaluate(() => regState().only) }));

    console.log('\n6 · the Jambo window over Explorer');
    /* on Home his panel is the door, so the window is opened on another page and stays open over Explorer */
    await page.evaluate(() => { setView('approvals'); ai.history = []; openAI(); });
    await until(() => document.getElementById('ai-panel').classList.contains('open') && !!document.getElementById('ai-input'));
    await toExplorer();
    const win = await until(() => document.getElementById('ai-panel') && !!document.getElementById('ai-input') && !ai.busy);
    /* his box is not drawn over Home's panel, so the words are put in it and sent as its Enter sends them */
    if (win){ await page.evaluate(() => { document.getElementById('ai-input').value = 'show me signed contracts'; aiSubmit(); }); await page.waitForTimeout(500); await until(() => !intel.busy); }
    const m6 = await mapIds();
    check('6a the window\'s "show me signed contracts" narrows the map and stays', !!win && (await onExplorer()) && !!m6 && m6.join() === signedIds.join(), JSON.stringify({ win: !!win, at: await where(), map: m6 }));
    await page.evaluate(() => { try { closeAI(); } catch (_){} });

    check('7b nothing was asked of a model', (await page.evaluate(() => window.__ai.length)) === 0, JSON.stringify(await page.evaluate(() => window.__ai)));
    check('7c no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
