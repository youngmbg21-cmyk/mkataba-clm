/* THE TRAIL, AS A FILE — THE DRAWER (owner picked "Export drawer — the SAP
   way", 17 Oct 2026; piece 5 of the sensitive contracts and governance plan)

   WHAT THIS PINS, driven in a real browser (the server's own claims — the
   wall, the file's rows, the seal — are f699's)
     1 Company › Housekeeping carries a door, The trail, that opens Data &
       backup on its The trail tab; the Backup tab still holds the backup
     2 the tab says what it is, asks a period (the last whole quarter to
       start), the streams and the format, and counts before the press:
       "3 acts · 2 streams · 3 people · Q<n> <year>"; one stream asked, the
       count follows
     3 an end before the start: said in amber and Download greyed, with the
       reason on it — never a press that does nothing
     4 Download the trail hands over a file (a PDF when PDF is chosen), says
       so with an 'ok', and the download is listed under Downloads so far
     5 it fits the owner's three screens: nothing cut, no sideways scroll
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/trail-export-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

/* the last whole quarter before today, as the drawer starts — counted from
   the day the check runs, never written down */
const T = new Date(); const q = Math.floor(T.getUTCMonth() / 3);
const QY = q ? T.getUTCFullYear() : T.getUTCFullYear() - 1, QQ = q ? q - 1 : 3;
const qDay = n => new Date(Date.UTC(QY, QQ * 3, 1 + n)).toISOString();
const act = (n, user, action) => ({ at: qDay(n), user, action, detail: '' });
const CONTRACTS = [
  { ...H.fixtureContract('TR-A', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48e6, 'Signed'),
    audit: [act(3, 'Amina Otieno', 'Sent'), act(40, 'Grace Wanjiru', 'Signed')] },
  { ...H.fixtureContract('TR-B', 'Route-to-market distribution', 'Naivas Supermarkets', H.FOLDER_B, 12e6, 'Signed'),
    audit: [act(60, 'Peter Kariuki', 'Approved')] },
];

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'TR-A'), null, { timeout: 20000 });

    console.log('\n1 · the door, and the two tabs');
    const door = await until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const d = document.querySelector('[data-st-card="house"] [data-st-panel="trail"]');
      return d && d.getBoundingClientRect().width > 0 ? d.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 15000);
    check('1a Housekeeping carries a door, The trail', /^The trail ›$/.test(door || ''), door);
    await shot(page, 'trail-company');
    if (door) await press('[data-st-card="house"] [data-st-panel="trail"]', '1b the door');
    /* since round 26 ("The SAP way") Data & backup is a PAGE: The trail · Backup are its tabs */
    const tabs = await until(() => { const pg = document.querySelector('[data-st-pg="data"]');
      if (!pg) return null;
      const t = [...pg.querySelectorAll('[data-st-bk-tab]')];
      return t.length ? { tabs: t.map(b => b.textContent.trim() + (b.classList.contains('is-on') ? '*' : '')).join(' | '), title: (pg.querySelector('.st-pg-t') || {}).textContent || '' } : null; });
    check('1b it opens Data & backup on The trail', !!tabs && tabs.tabs === 'The trail* | Backup' && /Data/.test(tabs.title), JSON.stringify(tabs));

    console.log('\n2 · it asks, and counts before the press');
    const qWord = `Q${QQ + 1} ${QY}`;
    const fig = await until(w => { const f = document.querySelector('#st-tr-go .st-tr-fig'); const t = f && f.textContent.replace(/\s+/g, ' ').trim(); return t && t.includes(w) ? t : null; }, qWord);
    check('2a the last whole quarter, counted: 3 acts · 2 streams · 3 people · ' + qWord, fig === `3 acts · 2 streams · 3 people · ${qWord}`, fig);
    const asks = await page.evaluate(() => ({ from: !!document.getElementById('st-tr-from'), to: !!document.getElementById('st-tr-to'),
      stream: [...(document.querySelectorAll('#st-tr-stream option') || [])].length, as: [...document.querySelectorAll('#st-tr-as-sel option')].map(r => r.value).join(' ') }));
    check('2b it asks From, To, the streams and CSV or PDF, as labelled boxes', asks.from && asks.to && asks.stream >= 3 && asks.as === 'csv pdf', JSON.stringify(asks));
    const sales = await page.evaluate(s => { const el = document.getElementById('st-tr-stream'); if (!el) return false; el.value = s; el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, H.FOLDER_B);
    const one = sales ? await until(() => { const t = (document.querySelector('#st-tr-go .st-tr-fig') || {}).textContent || ''; return /^1 act/.test(t.trim()) ? t.replace(/\s+/g, ' ').trim() : null; }) : null;
    check('2c one stream asked: the count follows — 1 act', /^1 act · 1 stream · 1 person/.test(one || ''), one);
    await page.evaluate(() => { const el = document.getElementById('st-tr-stream'); if (el) { el.value = 'all'; el.dispatchEvent(new Event('change', { bubbles: true })); } });

    console.log('\n3 · an end before the start');
    const setDay = (id, v) => page.evaluate(([id, v]) => { const el = document.getElementById(id); if (!el) return false; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, [id, v]);
    const was = await page.evaluate(() => ({ from: (document.getElementById('st-tr-from') || {}).value, to: (document.getElementById('st-tr-to') || {}).value }));
    await setDay('st-tr-to', '2001-01-01');
    const bad = await until(() => { const b = document.getElementById('st-tr-download'); const f = document.querySelector('#st-tr-go .st-tr-fig');
      return b && b.disabled ? { said: (f || {}).textContent.trim(), title: b.getAttribute('title') || '' } : null; });
    check('3 it says "The end is before the start." in amber and greys Download, the reason on it', !!bad && bad.said === 'The end is before the start.' && bad.title === 'The end is before the start.', JSON.stringify(bad));
    await setDay('st-tr-to', was.to);
    await until(() => { const b = document.getElementById('st-tr-download'); return b && !b.disabled && /3 acts/.test((document.querySelector('#st-tr-go .st-tr-fig') || {}).textContent || ''); });

    console.log('\n4 · the hand-over, and its record');
    await page.evaluate(() => { const r = document.getElementById('st-tr-as-sel'); if (r) { r.value = 'pdf'; r.dispatchEvent(new Event('change', { bubbles: true })); } });
    await shot(page, 'trail-drawer-1440x780');
    let file = null;
    if (await page.locator('#st-tr-download').count()) {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }).catch(() => null), page.click('#st-tr-download')]);
      file = dl ? dl.suggestedFilename() : null;
      if (dl) { const p = await dl.path().catch(() => null); const head = p ? fs.readFileSync(p).slice(0, 5).toString('latin1') : ''; file += ' ' + head; }
    } else check('4a the Download button (nothing to press)', false);
    check('4a Download the trail hands over a PDF', /^hati-trail-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.pdf %PDF-$/.test(file || ''), file);
    const told = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /download is now in the trail/.test(t) ? t.trim() : null; });
    check('4b it says so', !!told, told);
    const past = await until(() => { const rows = [...document.querySelectorAll('#st-tr-past tbody tr')]; return rows.length ? rows.map(r => [...r.cells].map(c => c.textContent.trim()).join(' | ')) : null; });
    check('4c …and the download is listed under Downloads so far: who, the period, PDF', !!past && past.length === 1 && /Amina Otieno/.test(past[0]) && past[0].includes(qWord) && /\| PDF$/.test(past[0]), JSON.stringify(past));
    await press('[data-st-pg="data"] [data-st-bk-tab="backup"]', '4d the Backup tab');
    const backup = await until(() => document.getElementById('bk-export') ? true : null);
    check('4d the Backup tab still holds the backup', !!backup);
    await press('[data-st-pg="data"] [data-st-bk-tab="trail"]', '4d back to The trail');

    console.log('\n5 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await until(() => !!document.querySelector('#st-tr-go .st-tr-fig b'));
      const fit = await page.evaluate(() => {
        const band = document.querySelector('.st-tr-band');
        const cut = [...document.querySelectorAll('[data-st-pg="data"] .st-dp-tab, #st-tr-download, .st-tr-fig, #st-tr-past td')].filter(x => x.scrollWidth > x.clientWidth + 1).length;
        return { side: document.scrollingElement.scrollWidth - innerWidth, cut, inside: band ? band.getBoundingClientRect().right <= innerWidth + 1 : false };
      });
      await shot(page, `trail-drawer-${vp.width}x${vp.height}`);
      check(`5 ${vp.width}×${vp.height}: nothing cut, no sideways scroll`, fit.side <= 0 && fit.cut === 0 && fit.inside, JSON.stringify(fit));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
