/* Chromium verification: EXPLORER STAGE 4 — FINDINGS ON THE MAP
   ============================================================
   The owner, 18 Oct 2026: "build all the stages autonomously". Stage 4, as
   drawn in the "every view" picture: "Pin this finding" keeps the view on
   HaTi's server for colleagues (a Findings tab beside Jambo); each colleague
   sees it COUNTED AGAIN INSIDE THEIR OWN ACCESS — a stream they cannot see is
   left out and said, never counted or named; a finding about nothing they can
   see never reaches them; replies sit under it; "Send to a colleague" lands in
   their bell, a question waits there until they reply, and the reply reaches
   the sender's bell; a code-named deal's real name never reaches an outsider.

   Two people: the admin (Amina, every stream) and "Restricted Legal", who may
   open the Procurement stream only (seedWorkspace's folderAccess). Every
   count is measured from the record, every wall from the server's own answer.

   Red at the parent (stage 3's head): there is no Pin, no Findings tab, no
   /api/findings, and no bell line for a finding.

   Screenshots go to test/chromium/shots/explorer-stage-four/ (or HATI_SHOT_DIR).
   Run: node test/chromium/explorer-stage-four-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-stage-four');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ST = ['proc', 'sales', 'mfg'];
const BOOK = Array.from({ length: 30 }, (_, i) => fixtureContract('MK-F' + i, (i === 0 ? 'Project Falcon Supply' : ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i),
  ['Kipande', 'Savanna', 'Mvua', 'Tausi'][i % 4], ST[i % 3], ((i * 37) % 90 + 5) * 1e6, ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]));
const PROC = BOOK.filter(c => c.folder === 'proc').map(c => c.id).sort();

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const RID = String(W.users.restricted.id);
  /* the first contract is a confidential deal only the admin is named on */
  let cnSet = 'not set';
  try { const me = await W.admin.json('/api/bootstrap'); const adminId = String((me && me.user && me.user.id) || '');
    await W.admin.json('/api/contracts/MK-F0/code-name', { method: 'PUT', body: { code: 'FALCON', people: [adminId] } }); cnSet = 'set'; }
  catch (e) { cnSet = String(e && e.message).slice(0, 160); }
  console.log('code name: ' + cnSet);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  /* a route the server may not have reports, never stops the run (a missing feature reads red) */
  const getJ = async (c, p, o) => { try { return await c.json(p, o); } catch (e) { return { _err: e.status || String(e && e.message) }; } };
  const errors = [];
  const open = async (email, pass) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(email + ': ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 2).join(' ')));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3, null, { timeout: 20000 });
    return page;
  };
  const tools = page => {
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const toExplorer = async () => {
      await until(() => state.view === 'counter', null, 10000);
      await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace('explorer'); });
      await until(() => hbFace() === 'explorer' && window.IG && IG.hubs && IG.hubs.length >= 1 && !!document.getElementById('igd-input'));
    };
    const ask = async q => { const n = await page.evaluate(() => intel.history.length);
      if (!(await page.locator('#igd-input').count())) await page.evaluate(() => { intel.fdTab = false; renderIntelDock(); });
      /* RE-PINNED 28 Oct 2026 ("Door above the box": typed words are the brain's but a page's one name): asked as a chip asks */ await page.evaluate(w => intelAsk(w), q);
      await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(300); };
    const press = async sel => { if (await page.locator(sel).count()) { await page.click(sel); return true; } return false; };
    return { until, toExplorer, ask, press };
  };
  try {
    /* ================= 1. PIN A FINDING ======================================= */
    const A = await open('admin@example.co.ke', 'adminpassword1'), a = tools(A);
    await a.toExplorer();
    await a.ask('group by value stream');
    const p1 = await A.evaluate(() => { const b = document.querySelectorAll('#ig-dock [data-ig-pin-open]'); return { n: b.length, last: b.length ? b[b.length - 1].getAttribute('data-ig-pin-open') === String(intel.history.length - 1) : false }; });
    check('1a "Pin this finding" sits under the latest answer on the map', p1.n === 1 && p1.last, JSON.stringify(p1));
    await a.press('#ig-dock [data-ig-pin-open]');
    const t1 = await A.evaluate(() => (document.getElementById('ig-pin-t') || {}).value || '');
    check('1b its form opens with the view\'s own name as the title, ready to change', /value stream/i.test(t1), t1);
    if (await A.locator('#ig-pin-t').count()) {
      await A.fill('#ig-pin-t', 'Project Falcon Supply and the three streams');
      await A.fill('#ig-pin-n', 'Fix the caps at renewal');
      await a.press('#ig-dock [data-ig-pin-go]');
    }
    await A.waitForTimeout(600);
    const got1 = await getJ(W.admin, '/api/findings');
    const f1 = ((got1 && got1.findings) || []).find(f => f.title === 'Project Falcon Supply and the three streams');
    check('1c the finding is kept on the server: its title, note, the three streams it is counted in, every contract on the map',
      !!f1 && f1.note === 'Fix the caps at renewal' && f1.parts.length === 3 && f1.ids.length === BOOK.length && f1.view === 0 && !f1.partial,
      JSON.stringify(f1 && { parts: f1.parts.map(p => p.label + ' ' + p.ids.length), ids: f1.ids.length, view: f1.view }));
    /* RE-POINTED 28 Oct 2026 ("Door above the box"): in the conversation the head is his name alone; its door goes back to the tabs */
    await a.press('#ig-dock [data-jb-door] .jb-door-back');
    await a.until(() => !!document.querySelector('#ig-dock [data-pd-tab="findings"]'), null, 4000);
    await a.press('#ig-dock [data-pd-tab="findings"]');
    const c1 = await a.until(() => { const c = document.querySelector('#ig-fd .ig-fd'); return c ? c.textContent.replace(/\s+/g, ' ') : null; }, null, 4000);
    check('1d the Findings tab stands beside Jambo, and holds it', !!c1 && c1.includes('Project Falcon Supply and the three streams') && c1.includes('Fix the caps at renewal'), String(c1).slice(0, 160));
    await A.screenshot({ path: path.join(OUT, '1-findings-tab.png') });
    await A.evaluate(() => { intel.fdTab = false; renderIntelDock(); });
    await a.ask('only manufacturing');
    await a.press('#ig-dock [data-ig-pin-open]');
    if (await A.locator('#ig-pin-t').count()) { await A.fill('#ig-pin-t', 'Manufacturing alone'); await a.press('#ig-dock [data-ig-pin-go]'); }
    await A.waitForTimeout(600);
    const got2 = await getJ(W.admin, '/api/findings');
    const f2 = ((got2 && got2.findings) || []).find(f => f.title === 'Manufacturing alone');
    check('1e a finding narrowed to one stream keeps only that stream\'s contracts', !!f2 && f2.ids.length === BOOK.filter(c => c.folder === 'mfg').length, JSON.stringify(f2 && f2.ids.length));

    /* ================= 2. THE WALL: COUNTED FOR EACH READER ==================== */
    const r2 = await getJ(W.restricted, '/api/findings');
    const rf1 = ((r2 && r2.findings) || []).find(f => f1 && f.id === f1.id), rf2 = ((r2 && r2.findings) || []).find(f => f2 && f.id === f2.id);
    check('2a a colleague who can see only Procurement gets the first finding with only Procurement\'s contracts, said to be partial, its sentence held back, and no part named that holds none of theirs',
      !!rf1 && rf1.partial === true && rf1.said === null && JSON.stringify(rf1.ids.slice().sort()) === JSON.stringify(PROC)
      && rf1.parts.length === 1 && rf1.parts.every(p => p.ids.every(id => PROC.includes(id))) && rf1.parts.reduce((t, p) => t + p.ids.length, 0) === PROC.length,
      JSON.stringify(rf1 && { partial: rf1.partial, said: rf1.said, ids: rf1.ids.length, want: PROC.length, parts: rf1.parts.map(p => p.label + ' ' + p.ids.length) }));
    check('2b a finding about streams they cannot see never reaches them', !rf2, JSON.stringify(rf2 && rf2.title));
    check('2c a confidential deal\'s real name in a title reaches them as its code name', !!rf1 && !/Project Falcon Supply/.test(JSON.stringify(rf1)) && /FALCON/.test(rf1.title), rf1 && rf1.title);
    const send2 = f2 ? await W.admin.json('/api/findings/' + f2.id + '/send', { method: 'POST', body: { to: RID, ask: '' } }).catch(e => e) : null;
    check('2d it cannot be sent to them either', !!send2 && (send2.status === 409 || /cannot see any/.test(String((send2 && (send2.error || send2.message)) || ''))), JSON.stringify(send2 && (send2.error || send2.status)));
    const del2 = rf1 ? await W.restricted.json('/api/findings/' + rf1.id, { method: 'DELETE' }).catch(e => e) : null;
    check('2e only its author or an admin may remove it', !!del2 && (del2.status === 403 || /Only its author/.test(String((del2 && (del2.error || del2.message)) || ''))), JSON.stringify(del2 && (del2.error || del2.status)));

    /* ================= 3. SEND WITH A QUESTION, AND THE REPLY =================== */
    await A.evaluate(() => { intel.fdTab = true; renderIntelDock(); });
    if (f1) {
      await a.press(`#ig-fd [data-ig-fd-ui="${f1.id}:send"]`);
      if (await A.locator(`#ig-fd-to-${f1.id}`).count()) {
        await A.selectOption(`#ig-fd-to-${f1.id}`, RID);
        await A.fill(`#ig-fd-q-${f1.id}`, 'Can you fix these at renewal?');
        await a.press(`#ig-fd [data-ig-fd-send="${f1.id}"]`);
      }
    }
    await A.waitForTimeout(600);
    const R = await open('restricted@example.co.ke', 'their-own-pass-9'), r = tools(R);
    await r.toExplorer();
    await R.evaluate(() => window.igFindingsLoad && igFindingsLoad());
    const bell = await r.until(() => { const L = (typeof buildAlerts === 'function' ? buildAlerts() : []).filter(x => x.kind === 'finding-ask'); return L.length ? L.map(x => x.text + ' | ' + (x.sub || '')) : null; }, null, 6000);
    check('3a the question lands in their bell, with who asks and what', !!bell && /Amina Otieno asks you about a finding/.test(bell[0]) && /Can you fix these at renewal\?/.test(bell[0]), JSON.stringify(bell));
    const badge = await R.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-tab="findings"] .pd-tab-n'); return b ? b.textContent : null; });
    check('3b the Findings tab carries the count of what is owed them', badge === '1', String(badge));
    await r.press('#ig-dock [data-pd-tab="findings"]');
    const rc = await r.until(() => { const c = document.querySelector('#ig-fd .ig-fd'); return c ? c.textContent.replace(/\s+/g, ' ') : null; }, null, 4000);
    check('3c their card says it is partial and holds back the sentence, and asks the question first', !!rc && /outside what you can see/.test(rc) && /asks: “Can you fix these at renewal\?”/.test(rc), String(rc).slice(0, 220));
    if (rf1) await r.press(`#ig-fd [data-ig-fd-open="${rf1.id}"]`);
    const now3 = await r.until(() => { const c = document.querySelector('#ig-fd [data-ig-fd-count]'); return c ? c.textContent.replace(/\s+/g, ' ') : null; }, null, 4000);
    const others = await R.evaluate(() => ['mfg', 'sales'].map(k => (FOLDERS[k] && FOLDERS[k].name) || k));
    check('3d opened on their map it is counted again on their own book: Procurement\'s contracts only, the other streams never named', !!now3 && now3.includes(`On the map for you now: ${PROC.length} contracts`) && others.every(x => !now3.includes(x)), String(now3));
    await R.screenshot({ path: path.join(OUT, '3-colleague-opens.png') });
    if (rf1) { await r.press(`#ig-fd [data-ig-fd-ui="${rf1.id}:reply"]`);
      if (await R.locator(`#ig-fd-rt-${rf1.id}`).count()) { await R.fill(`#ig-fd-rt-${rf1.id}`, 'Yes, I will raise the caps in March.'); await r.press(`#ig-fd [data-ig-fd-reply="${rf1.id}"]`); } }
    await R.waitForTimeout(800);
    const after = await getJ(W.admin, '/api/findings');
    const sd = ((after && after.sends) || []).find(s => f1 && s.findingId === f1.id);
    check('3e their reply answers the question: the hand-off is closed on the server, the reply under the finding',
      !!sd && sd.status === 'answered' && ((after.findings || []).find(f => f1 && f.id === f1.id) || { notes: [] }).notes.some(n => /raise the caps in March/.test(n.text)), JSON.stringify(sd && sd.status));
    const rb = await R.evaluate(() => (typeof buildAlerts === 'function' ? buildAlerts() : []).filter(x => /^finding/.test(x.kind)).length);
    check('3f their bell no longer carries it', rb === 0, String(rb));
    await A.evaluate(() => window.igFindingsLoad && igFindingsLoad());
    const ab = await a.until(() => { const L = (typeof buildAlerts === 'function' ? buildAlerts() : []).filter(x => x.kind === 'finding-answer'); return L.length ? L[0].text : null; }, null, 6000);
    check('3g the reply reaches the sender\'s bell', !!ab && /Restricted Legal replied on your finding/.test(ab), String(ab));

    /* ================= 4. SINCE IT WAS SHARED =================================== */
    await W.admin.json('/api/contracts/MK-F99', { method: 'PUT', body: { baseVersion: 0, contract: fixtureContract('MK-F99', 'Late Freight Addendum', 'Kipande', 'proc', 7e6, 'Draft') } });
    await A.reload({ waitUntil: 'networkidle' });
    await A.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-F99'), null, { timeout: 20000 });
    await a.toExplorer();
    await A.evaluate(() => window.igFindingsLoad && igFindingsLoad());
    await a.until(() => typeof igFinding === 'function' && igFindings().length > 0, null, 6000).catch(() => null);
    const go4 = f1 ? await A.evaluate(id => { if (typeof igFindingGo !== 'function') return false; igFindingGo(id); return true; }, f1.id) : false;
    const d4 = go4 ? await a.until(() => { const li = [...document.querySelectorAll('#ig-fd [data-ig-fd-diff]')].map(x => x.textContent.replace(/\s+/g, ' ')); return li.length ? li : null; }, null, 6000) : null;
    const procName = await A.evaluate(() => (FOLDERS.proc && FOLDERS.proc.name) || 'Procurement');
    check('4a opening it from the bell lands on the finding, each part counted again: Procurement has one more since it was shared',
      !!d4 && d4.some(x => x.startsWith(procName + ': ' + (PROC.length + 1)) && /\+1 since shared/.test(x)), JSON.stringify(d4));
    const ab2 = await A.evaluate(() => (typeof buildAlerts === 'function' ? buildAlerts() : []).filter(x => x.kind === 'finding-answer').length);
    check('4b opening it reads the reply: the sender\'s bell is clear', ab2 === 0, String(ab2));
    await A.screenshot({ path: path.join(OUT, '4-since-shared.png') });

    check('5a no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
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
