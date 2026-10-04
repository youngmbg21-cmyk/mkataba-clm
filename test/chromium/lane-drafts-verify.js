/* ============================================================
   lane-drafts-verify — the last gap of the process review's Requests
   stream (4 Oct 2026), driven in a real Chromium against a real server:
     1 · the lanes panel has an owner picker, and its default says WHO;
     2 · a request the lane clears is a draft OWNED by the lane's owner, and
         the request is held by them;
     3 · the owner's browser reads the draft on arrival — once — and their
         bell says a draft was made for them, the press opening it;
     4 · another editor's browser does not read it a second time.
   Run: node test/chromium/lane-drafts-verify.js
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'lane-drafts');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push('admin: ' + String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }
    const ids = await page.evaluate(async () => {
      const out = {};
      try { out.peter = (await api('users', 'POST', { name: 'Peter Editor', email: 'peter@highland.co.ke', role: 'legal', password: 'memberpass123' })).user.id; } catch (e) {}
      try { out.faith = (await api('users', 'POST', { name: 'Faith Njeri', email: 'faith@highland.co.ke', role: 'viewer', password: 'memberpass123' })).user.id; } catch (e) {}
      const b = await api('bootstrap'); out.me = b.me.id;
      if (typeof REMOTE !== 'undefined' && REMOTE) REMOTE.users = b.users;
      return out;
    });
    const as = {};
    for (const [who, email] of [['peter', 'peter@highland.co.ke'], ['faith', 'faith@highland.co.ke']]) {
      const c = as[who] = h.client(who);
      await c.json('/api/login', { method: 'POST', body: { email, password: 'memberpass123' } });
      await c.json('/api/password/change', { method: 'POST', body: { current: 'memberpass123', password: who + 's-own-pass-9' } });
    }

    /* ---- 1 · THE LANES PANEL ---- */
    await page.evaluate(() => openSettingsAt('platform', 'lanes')); await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.getElementById('st-lane-add'); if (b) b.click(); }); await page.waitForTimeout(500);
    const fresh = await page.evaluate(() => {
      const row = document.querySelector('#st-lanes .st-lane:last-child');
      const sel = row && row.querySelector('.ln-owner');
      return { has: !!sel, def: sel ? sel.options[0].textContent : '', people: sel ? [...sel.options].slice(1).map(o => o.textContent) : [] };
    });
    ok('1a a lane has an owner picker', fresh.has, fresh);
    ok('1b its default says who: the admin about to save it', /Young Mbagaya/.test(fresh.def) && /saved this lane/.test(fresh.def), fresh.def);
    ok('1c it offers the members who may draft, never a Viewer', fresh.people.includes('Peter Editor') && !fresh.people.includes('Faith Njeri'), fresh.people);
    await page.evaluate(peter => {
      const row = document.querySelector('#st-lanes .st-lane:last-child');
      row.querySelector('.ln-name').value = 'Routine NDA';
      row.querySelector('.ln-tpl').value = 'ND';
      row.querySelector('.ln-words').value = 'nda';
      row.querySelector('.ln-known').checked = false;
      const o = row.querySelector('.ln-owner'); if (o) o.value = peter;   // guarded: a missing picker reports below
    }, ids.peter);
    await page.screenshot({ path: path.join(OUT, '1-lanes-panel.png') });
    const side = await page.evaluate(() => { const b = document.getElementById('st-dbody'); return b ? b.scrollWidth - b.clientWidth : -1; });
    ok('1d the drawer does not scroll sideways', side >= 0 && side <= 1, side);
    await page.evaluate(() => document.getElementById('st-lane-save').click()); await page.waitForTimeout(800);
    const saved = await page.evaluate(async () => ((await api('bootstrap')).settings.intakeLanes || []).map(l => ({ ownerId: l.ownerId, savedById: l.savedById, id: l.id })));
    ok('1e saved: the lane names Peter, and the server says who saved it', saved.length === 1 && saved[0].ownerId === ids.peter && saved[0].savedById === ids.me, saved);
    await page.evaluate(() => stRepaintPanel('lanes')); await page.waitForTimeout(300);
    const again = await page.evaluate(() => { const s = document.querySelector('#st-lanes .ln-owner'); return s ? s.options[s.selectedIndex].textContent : ''; });
    ok('1f the panel reads it back', again === 'Peter Editor', again);

    /* ---- 2 · A REQUEST THE LANE CLEARS ---- */
    const faith = as.faith;
    const made = await faith.json('/api/intake', { method: 'POST', body: {
      title: 'An NDA for the site visit', need: 'A standard NDA for the Naivasha site visit, nda.', counterparty: 'Rift Logistics' } });
    const cid = made.request && made.request.contractId;
    ok('2a the lane drafted it', made.request && made.request.status === 'drafted' && !!cid, made.request && made.request.status);
    ok('2b the request is held by the lane\'s owner', made.request && made.request.assignee && made.request.assignee.id === ids.peter, made.request && made.request.assignee);
    const peterApi = as.peter;
    const onServer = await peterApi.json('/api/contracts/' + cid);
    ok('2c the draft is Peter\'s', onServer.owner && onServer.owner.id === ids.peter && onServer.owner.name === 'Peter Editor', onServer.owner);
    ok('2d and its arrival reading is owed', !!onServer.arrivalOwed && !onServer.triage, { owed: onServer.arrivalOwed, triage: !!onServer.triage });

    /* ---- 3 · PETER'S BROWSER ---- */
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errs.push('peter: ' + String(e).slice(0, 200)));
    await p2.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p2.waitForSelector('#li-email', { timeout: 15000 });
    await p2.fill('#li-email', 'peter@highland.co.ke'); await p2.fill('#li-pass', 'peters-own-pass-9'); await p2.click('#li-go');
    await p2.waitForTimeout(2500); await p2.keyboard.press('Escape').catch(() => {});
    const read = await until(p2, id => { const c = (state.contracts || []).find(x => x.id === id); return !!(c && c.triage && !c._triaging); }, cid, 30000);
    ok('3a his browser reads the draft on arrival', read);
    let st = null;
    for (let i = 0; i < 40; i++) { st = await peterApi.json('/api/contracts/' + cid); if (st.triage && st.triage.hash !== undefined) break; await p2.waitForTimeout(250); }
    ok('3b the reading is on the record, and nothing is owed any more', !!(st && st.triage) && !st.arrivalOwed, { triage: !!(st && st.triage), owed: st && st.arrivalOwed });
    const readAt = st && st.triage && st.triage.at;
    await p2.evaluate(async () => { await intakeRefresh(); });
    const bell = await p2.evaluate(() => buildAlerts().filter(a => a.kind === 'request').map(a => ({ text: a.text, sub: a.sub || '' })));
    const mine = bell.find(a => /site visit/.test(a.text));
    ok('3c his bell says a draft was made for him', !!mine && /Drafted for you/.test(mine.text), bell);
    ok('3d and names the lane and who asked', !!mine && /Routine NDA/.test(mine.sub) && /Faith Njeri/.test(mine.sub), mine && mine.sub);
    await p2.evaluate(() => openPanel('alerts')); await p2.waitForTimeout(500);
    await p2.screenshot({ path: path.join(OUT, '3-bell.png') });
    const row = await p2.evaluateHandle(() => [...document.querySelectorAll('[data-alert-kind="request"]')].find(e => /site visit/.test(e.textContent)) || null);
    const el = row.asElement();
    ok('3e the row is drawn in the panel', !!el);
    if (el) await el.click();
    const landed = await until(p2, id => state.view === 'workspace' && state.activeId === id, cid, 8000);
    ok('3f the press opens the draft', landed, await p2.evaluate(() => ({ view: state.view, id: state.activeId })));
    await p2.waitForTimeout(800);
    /* PAINTED, not merely present: the strip's own pixels answer to it. */
    const strip = await p2.evaluate(() => {
      const el = document.getElementById('kt-triage-slot');
      const r = el ? el.getBoundingClientRect() : null;
      const hit = r && r.height > 0 ? document.elementFromPoint(r.left + Math.min(40, r.width / 2), r.top + Math.min(12, r.height / 2)) : null;
      const tab = document.querySelector('.room-tab.is-on, .room-tab[aria-selected="true"], [data-room-tab].is-on');
      return { painted: !!(hit && el.contains(hit)), text: ((el || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        tab: tab ? tab.textContent.trim() : null };
    });
    ok('3g it lands on the Overview, where the strip says Copilot read it', strip.painted && /read/i.test(strip.text), strip);
    await p2.screenshot({ path: path.join(OUT, '3-opened.png') });

    /* ---- 4 · NOBODY READS IT TWICE ---- */
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(3500);
    const after = await peterApi.json('/api/contracts/' + cid);
    ok('4a another editor\'s browser does not read it again', after.triage && after.triage.at === readAt, { was: readAt, now: after.triage && after.triage.at });
    await page.evaluate(() => setView('intake')); await page.waitForTimeout(800);
    const withCell = await page.evaluate(() => ((document.getElementById('content') || {}).textContent || '').includes('Peter Editor'));
    ok('4b the Requests page says Peter holds it', withCell);
    await page.screenshot({ path: path.join(OUT, '4-requests.png') });
    ok('5 [control] the whole journey raised no page error', errs.length === 0, errs.length ? errs : 'clean');
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
