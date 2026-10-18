/* Chromium verification: EXPLORER STAGE 5 — THEN AND NOW, AND A PICTURE
   ===================================================================
   The owner, 18 Oct 2026: "build all the stages autonomously". Stage 5, as
   drawn: (1) "as of <a day>" / "what changed since <a day>" sets the book as
   it stood that day against today — read from the two days the record keeps
   for every contract, the day it was added and the day it was signed — and
   lights what was added or signed since, each with its day as its badge; the
   answer says then and now, the part that grew most, and what it could not
   replay; (2) "Copy picture" makes a PNG of the view on screen under a heading
   that says what it shows, made from the screen alone.

   Every count is measured against the record; the picture is decoded and its
   heading read off the canvas it was drawn on.

   Red at the parent (stage 4's head): no day is read for "as of", nothing is
   lit, and there is no picture.

   Run: node test/chromium/explorer-stage-five-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-stage-five');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* days counted back from today, so the fixture means the same whatever day it runs */
const ago = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/* the cut-off: 90 days ago; a third of the book was added after it, a third
   signed after it, the rest older and signed before (or not yet) */
const CUT = ago(90), CUTW = `${CUT.getDate()} ${MONTHS[CUT.getMonth()]} ${CUT.getFullYear()}`, CUTISO = iso(CUT);
const ST = ['proc', 'sales', 'mfg'];
const BOOK = Array.from({ length: 30 }, (_, i) => {
  const c = fixtureContract('MK-N' + i, ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i, ['Kipande', 'Savanna', 'Mvua'][i % 3], ST[i % 3], ((i * 37) % 90 + 5) * 1e6, 'Under Review');
  const kind = i % 3;           // 0: added after the cut; 1: older, signed after; 2: older, signed before
  /* the proc stream takes the new ones: it is the part that grew most */
  const added = (kind === 0 && i % 2 === 0) ? ago(30 + i) : ago(200 + i);
  c._raisedAt = added.toISOString();
  c.audit = [{ at: added.toISOString(), user: 'System', action: 'Created', detail: 'fixture' }];
  if (kind === 1) { c.status = 'Signed'; c.signedAt = iso(ago(20 + i)); }
  if (kind === 2) { c.status = 'Signed'; c.signedAt = iso(ago(150 + i)); }
  return c;
});

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  try { await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: h.base }); } catch (_) {}
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 2).join(' ')));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    await page.fill('#igd-input', q); await page.click('#igd-go');
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(300); };
  const said = () => page.evaluate(() => { const d = document.createElement('div'); d.innerHTML = String((intel.history[intel.history.length - 1] || {}).text || ''); return d.textContent.replace(/\s+/g, ' ').trim(); });
  const press = async sel => { if (await page.locator(sel).count()) { await page.click(sel); return true; } return false; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-N7'), null, { timeout: 15000 });
    await until(() => state.view === 'counter', null, 10000);
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.hubs && IG.hubs.length >= 3 && !!document.getElementById('igd-input'));

    /* ================= 1. THEN AND NOW ======================================== */
    await ask('what changed since ' + CUTW);
    const want = await page.evaluate(D => {
      const kids = IG.nodes.filter(n => n.kind === 'contract');
      const day = c => { const t = Date.parse(c._raisedAt || ''); if (isNaN(t)) return null; const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const added = kids.filter(n => day(n.c) && day(n.c) > D).map(n => n.id).sort();
      const signed = kids.filter(n => !(day(n.c) && day(n.c) > D) && n.c.signedAt && String(n.c.signedAt).slice(0, 10) > D).map(n => n.id).sort();
      const lens = intel.lenses.find(l => l.kind === 'asof' && l.on);
      return { added, signed, now: kids.length, asOf: intel.asOf, lit: lens ? lens.ids.slice().sort() : null, badges: lens && lens.badges ? lens.badges : {} };
    }, CUTISO);
    check('1a "what changed since <a day>" reads the day and holds it', want.asOf === CUTISO, JSON.stringify({ asOf: want.asOf, CUTISO }));
    check('1b it lights exactly what was added or signed since that day', !!want.lit && want.added.length >= 3 && want.signed.length >= 3
      && JSON.stringify(want.lit) === JSON.stringify(want.added.concat(want.signed).sort()), JSON.stringify({ added: want.added.length, signed: want.signed.length, lit: want.lit && want.lit.length }));
    const day1 = await page.evaluate(D => igDayWord(D), CUTISO);
    check('1c each lit contract carries the day it was added or signed as its badge',
      want.added.every(id => /^Added /.test(want.badges[id] || '')) && want.signed.every(id => /^Signed /.test(want.badges[id] || '')), JSON.stringify(Object.values(want.badges).slice(0, 3)));
    const s1 = await said();
    const procName = await page.evaluate(() => (FOLDERS.proc && FOLDERS.proc.name) || 'Procurement');
    check('1d the answer says the book then and now, what was added and signed, and the part that grew most',
      s1.includes(`On ${day1} the map held ${want.now - want.added.length} of today’s ${want.now} contracts`) && s1.includes(`${want.added.length} added and ${want.signed.length} signed since`) && s1.includes(procName + ' grew most'),
      s1);
    check('1e it says what it does not replay: a stage before signing', /stage before signing is not replayed/.test(s1), s1.slice(-160));
    await page.screenshot({ path: path.join(OUT, '1-then-and-now.png') });
    const rec = await page.evaluate(() => igRecipeNow().asOf);
    await ask('back to now');
    const off = await page.evaluate(() => ({ asOf: intel.asOf, lens: intel.lenses.some(l => l.kind === 'asof') }));
    check('1f it rides the recipe, and "back to now" takes it off', rec === CUTISO && off.asOf === null && !off.lens, JSON.stringify({ rec, off }));
    const words = await page.evaluate(() => { if (typeof igDateRead !== 'function' || typeof igAsOfRead !== 'function') return { missing: true };
      const T = new Date(); const y = T.getFullYear();
      return { past: igDateRead('1 january', false, true), future: igAsOfRead('as of 31 december ' + (y + 1)), start: igDateRead('the start of the year', false, true), y }; });
    check('1g a day for "as of" is the last one that has come; a day still to come is refused; "the start of the year" is its first day',
      !words.missing && words.past === words.y + '-01-01' && Array.isArray(words.future) && words.future[0].asOfNo && words.start === words.y + '-01-01', JSON.stringify(words));

    /* ================= 2. COPY PICTURE ======================================== */
    await ask('group by value stream');
    const d2 = await page.evaluate(() => { const b = document.querySelectorAll('#ig-dock [data-ig-pic]'); return b.length; });
    check('2a "Copy picture" sits under the latest answer on the map', d2 === 1, String(d2));
    const pic = await page.evaluate(async () => {
      if (typeof igPictureBlob !== 'function') return { missing: true };
      const texts = []; const ft = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (t, ...a) { if (!this.canvas.id) texts.push(String(t)); return ft.call(this, t, ...a); };
      let blob = null; try { blob = await igPictureBlob(); } finally { CanvasRenderingContext2D.prototype.fillText = ft; }
      const bmp = await createImageBitmap(blob); const wrap = document.getElementById('ig-gwrap').getBoundingClientRect();
      const svg = new DOMParser().parseFromString(igPictureSvg(document.getElementById('ig-svg')), 'image/svg+xml').documentElement.textContent;
      const labels = IG.hubs.filter(h => h.kind === 'hub').map(h => String(h.label).toUpperCase());
      return { type: blob.type, w: bmp.width, h: bmp.height, ww: Math.round(wrap.width), wh: Math.round(wrap.height), texts, labelsIn: labels.filter(l => svg.toUpperCase().includes(l)).length, labels: labels.length };
    });
    check('2b the picture is a PNG of the whole stage, at twice its size, with room for its heading and foot',
      !pic.missing && pic.type === 'image/png' && pic.w === pic.ww * 2 && pic.h === (pic.wh + 58 + 28) * 2, JSON.stringify(pic.missing ? pic : { w: pic.w, h: pic.h, ww: pic.ww, wh: pic.wh }));
    check('2c its heading says what it shows: the view, the grouping, how many', !pic.missing && pic.texts.some(t => /^Brain · grouped by value stream/i.test(t)) && pic.texts.some(t => /^30 contracts/.test(t)), JSON.stringify(pic.texts && pic.texts.slice(0, 4)));
    check('2d the map\'s own words are in it (every group\'s card), with their clothes written on', !pic.missing && pic.labels >= 3 && pic.labelsIn === pic.labels, JSON.stringify({ in: pic.labelsIn, of: pic.labels }));
    await press('#ig-dock [data-ig-pic]');
    const clip = await until(async () => { try { const items = await navigator.clipboard.read(); return items.some(i => i.types.includes('image/png')) ? 'png' : null; } catch (e) { return null; } }, null, 5000);
    const t2 = await page.evaluate(() => [...document.querySelectorAll('#toast-root *')].map(x => x.textContent).join(' | '));
    check('2e pressing it puts the picture on the clipboard, and says so', clip === 'png' && /Picture copied/.test(t2), JSON.stringify({ clip, t2: t2.slice(0, 160) }));

    check('3a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
