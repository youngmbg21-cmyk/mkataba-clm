/* Chromium verification: MY NOTES — A PRIVATE LEDGER
   ============================================================
   Young, 10 Oct 2026 (the "HaTi Proposals" artifact, Part 4: "keep the ledger
   but show me what happens when i click on new note"). At 1440 x 900:
     1. "My notes" is a door in the menu; with nothing due its count is blank
     2. + New note opens the form in the side panel; Save note is grey until
        the note has words
     3. the contract box finds a contract by part of its reference and picks it
     4. Next week says the day the note will show; Save note puts the note at
        the top of the ledger, selected, private, and on the server
     5. a note whose review day has come is in the bell and counts on the door;
        Mark reviewed clears both, and Undo brings it back
     6. a contract's ⋯ menu opens the same form with the contract filled in
     7. no page errors
   Waits ask for the state, bounded. Red at main d259278 (1-6).
   Screenshots: test/chromium/shots/my-notes/ (or HATI_SHOT_DIR).
   Run: node test/chromium/my-notes-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'my-notes');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2 && typeof mineLoaded === 'function' && mineLoaded(), null, { timeout: 20000 });
    const door = await until(() => { const b = document.querySelector('#side-nav [data-view="mynotes"]'); return b ? { text: b.textContent.trim(), count: (b.querySelector('[data-count="mynotes"]') || {}).textContent || '' } : null; });
    check('1. "My notes" is a door in the menu, its count blank with nothing due', !!door && /My notes/.test(door.text) && door.count === '', JSON.stringify(door));
    await page.click('#side-nav [data-view="mynotes"]');
    await until(() => !!document.getElementById('mn-new'));
    await page.click('#mn-new');
    const form = await until(() => { const s = document.getElementById('mn-save'); return s && document.getElementById('mn-body') ? { off: s.disabled, focus: document.activeElement && document.activeElement.id } : null; });
    check('2. + New note opens the form; Save note is grey until the note has words', !!form && form.off && form.focus === 'mn-body', JSON.stringify(form));
    await page.type('#mn-body', 'Ask AIT whether NSAB 2015 overrides our liability cap.');
    const live = await until(() => { const s = document.getElementById('mn-save'); return s && !s.disabled ? true : null; });
    check('2b. and live once it has', !!live);
    await page.click('#mn-ct');
    await page.type('#mn-ct', 'A1');
    const hit = await until(() => { const b = document.querySelector('[data-mn-ct="MK-A1"]'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('3. the contract box finds a contract by part of its reference', !!hit, hit);
    await page.click('[data-mn-ct="MK-A1"]');
    await page.click('[data-mn-when="week"]');
    const says = await until(() => { const p = [...document.querySelectorAll('.mn-form .mn-hint')].map(x => x.textContent).find(t => /bell and on your calendar/.test(t)); return p || null; });
    await page.screenshot({ path: path.join(OUT, '1-form.png') });
    await page.click('#mn-save');
    const saved = await until(() => { const r = document.querySelector('.mn-t tbody tr'); const side = document.getElementById('mn-side');
      return r && /liability cap/.test(r.textContent) && r.classList.contains('is-sel') && side && /Mark reviewed/.test(side.textContent) ? { row: r.textContent.replace(/\s+/g, ' ').trim(), priv: /only you can see/.test(side.textContent) } : null; });
    const onServer = await W.admin.json('/api/me/items?kind=note');
    const stored = onServer.items.find(n => /liability cap/.test(n.body));
    check('4. Next week says the day; Save puts the note at the top, selected and private', !!says && !!saved && saved.priv, JSON.stringify({ says, saved }));
    check('4b. it is stored with its contract and review day, and nobody else sees it', !!stored && stored.contractId === 'MK-A1' && !!stored.reviewBy
      && (await W.unrestricted.json('/api/me/items')).items.length === 0, stored && JSON.stringify({ c: stored.contractId, r: stored.reviewBy }));
    await page.screenshot({ path: path.join(OUT, '2-saved.png') });

    /* 5. a note due today is in the bell and counts on the door */
    const today = await page.evaluate(() => todayISO());
    await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Chase the signed copy', reviewBy: today } } });
    await page.evaluate(() => mineLoad(true).then(() => { paintMyNotesCount(); renderMyNotes(); }));
    const due = await until(() => { const c = (document.querySelector('[data-count="mynotes"]') || {}).textContent || '';
      const bell = (typeof buildAlerts === 'function' ? buildAlerts() : []).filter(a => a.kind === 'note-due').map(a => a.text);
      return c === '1' && bell.length === 1 ? { c, bell } : null; });
    check('5. a note due today is in the bell and counts 1 on the door', !!due, JSON.stringify(due));
    await page.evaluate(() => { const r = [...document.querySelectorAll('.mn-t tbody tr')].find(x => /Chase the signed copy/.test(x.textContent)); r.click(); });
    await until(() => /Chase the signed copy/.test((document.getElementById('mn-side') || {}).textContent || ''));
    await page.click('[data-mn-act="reviewed"]');
    const cleared = await until(() => { const c = (document.querySelector('[data-count="mynotes"]') || {}).textContent || '';
      return c === '' && !buildAlerts().some(a => a.kind === 'note-due') && document.querySelector('[data-mn-act="unreview"]') ? true : null; });
    check('5b. Mark reviewed clears the bell and the count, and offers Undo', !!cleared);
    await page.click('[data-mn-act="unreview"]');
    const reopened = await until(() => document.querySelector('[data-mn-act="reviewed"]') ? true : null);
    check('5c. Undo puts it back to review', !!reopened);

    /* 6. a contract's ⋯ menu */
    await page.evaluate(() => openWorkspace('MK-A2'));
    await until(() => !!document.getElementById('ws-mynote'));
    await page.evaluate(() => document.getElementById('ws-mynote').click());
    const fromRoom = await until(() => state.view === 'mynotes' && document.querySelector('.mn-chosen') ? document.querySelector('.mn-chosen').textContent.replace(/\s+/g, ' ').trim() : null);
    check('6. a contract\'s ⋯ menu opens the form with the contract filled in', !!fromRoom && /MK-A2/.test(fromRoom), fromRoom);
    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
