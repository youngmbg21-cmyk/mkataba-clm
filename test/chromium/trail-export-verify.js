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
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Housekeeping card is the old look's; the trail is a
       link at the one list's foot ("Trail") */
    /* RE-POINTED 19 Nov 2026 (Settings, door to door, f1091): Trail & backup is a row in Set-up and records, its door the page */
    /* RE-POINTED (P-43, owner's pick 20 Nov 2026: Settings the Legora + Stripe way) */
    /* no Open button on the row: the row is the door — the first press chooses it, the second goes in through its own
       door (kept on the row, unseen) */
    const TRAIL = '#stn-main [data-sdd-row="trail"]';
    const door = await until(sel => {
      if (!document.querySelector('.stn-page')) { setView('team'); return null; }
      if (!document.querySelector('.stn-page[data-sdd-area="setup"]')) { sddGo('setup'); return null; }
      const d = document.querySelector(sel), k = document.querySelector('#sdd-trail .sdd-k');
      return d && k && d.querySelector('[data-sdd-go][data-st-page="data"]') && d.getBoundingClientRect().width > 0 ? k.textContent.replace(/\s+/g, ' ').trim() : null; }, TRAIL, 15000);
    check('1a Set-up and records carries a row, Trail & backup', /^Trail\b/i.test(door || ''), door);
    await shot(page, 'trail-company');
    if (door && await press(TRAIL + ' .sdd-t', '1b the row')) {
      await until(sel => { const r = document.querySelector(sel); return r && r.getAttribute('aria-pressed') === 'true' ? true : null; }, TRAIL, 3000);
      if (await page.locator(TRAIL).count()) await press(TRAIL + ' .sdd-t', '1b the row, again');
    }
    /* since round 26 ("The SAP way") Data & backup is a PAGE: The trail · Backup are its tabs */
    /* RE-POINTED 22 Nov 2026 (Settings' six pages inside, Legora + Stripe): the page wears the area's head (.st-ls-head:
       the serif title, The trail · Backup as its tabs, .st-ls-tab[data-st-ls-bk]) above its body */
    const tabs = await until(() => { const pg = document.querySelector('[data-st-pg="data"]'), hd = document.querySelector('#set-page[data-st-ls="data"] .st-ls-head');
      if (!pg || !hd) return null;
      const t = [...hd.querySelectorAll('.st-ls-tab[data-st-ls-bk]')];
      return t.length ? { tabs: t.map(b => b.textContent.trim() + (b.classList.contains('is-on') ? '*' : '')).join(' | '), title: (hd.querySelector('.sdd-title') || {}).textContent || '' } : null; });
    check('1b it opens Data & backup on The trail', !!tabs && tabs.tabs === 'The trail* | Backup' && /Data/.test(tabs.title), JSON.stringify(tabs));

    console.log('\n2 · it asks, and counts before the press');
    const qWord = `Q${QQ + 1} ${QY}`;
    /* RE-POINTED 22 Nov 2026 (Settings' six pages inside, Legora + Stripe; the owner's pick: "The count said as four
       figures"): the count is four figures under the asks (#st-tr-go .st-ls-fig: Acts · Streams · People · Period),
       read as one line "<acts> · <streams> · <people> · <period>" */
    const fig = await until(w => { const all = [...document.querySelectorAll('#st-tr-go .st-ls-fig')];
      const k = all.map(x => ((x.querySelector('span') || {}).textContent || '').trim()), f = all.map(x => ((x.querySelector('b') || {}).textContent || '').replace(/\s+/g, ' ').trim());
      const t = all.length === 4 && k.join('|') === 'Acts|Streams|People|Period' ? f.join(' · ') : null; return t && t.includes(w) ? t : null; }, qWord);
    check('2a the last whole quarter, counted: Acts 3 · Streams 2 · People 3 · ' + qWord, fig === `3 · 2 · 3 · ${qWord}`, fig);
    const asks = await page.evaluate(() => ({ from: !!document.getElementById('st-tr-from'), to: !!document.getElementById('st-tr-to'),
      stream: [...(document.querySelectorAll('#st-tr-stream option') || [])].length, as: [...document.querySelectorAll('#st-tr-as-sel option')].map(r => r.value).join(' ') }));
    check('2b it asks From, To, the streams and CSV or PDF, as labelled boxes', asks.from && asks.to && asks.stream >= 3 && asks.as === 'csv pdf', JSON.stringify(asks));
    const sales = await page.evaluate(s => { const el = document.getElementById('st-tr-stream'); if (!el) return false; el.value = s; el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, H.FOLDER_B);
    /* RE-POINTED 22 Nov 2026 (Settings' six pages inside, Legora + Stripe): the four figures follow (Acts · Streams · People) */
    const one = sales ? await until(() => { const f = [...document.querySelectorAll('#st-tr-go .st-ls-fig b')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
      return f.length === 4 && f[0] === '1' ? f.join(' · ') : null; }) : null;
    check('2c one stream asked: the count follows — Acts 1 · Streams 1 · People 1', /^1 · 1 · 1 · /.test(one || ''), one);
    await page.evaluate(() => { const el = document.getElementById('st-tr-stream'); if (el) { el.value = 'all'; el.dispatchEvent(new Event('change', { bubbles: true })); } });

    console.log('\n3 · an end before the start');
    const setDay = (id, v) => page.evaluate(([id, v]) => { const el = document.getElementById(id); if (!el) return false; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, [id, v]);
    const was = await page.evaluate(() => ({ from: (document.getElementById('st-tr-from') || {}).value, to: (document.getElementById('st-tr-to') || {}).value }));
    await setDay('st-tr-to', '2001-01-01');
    /* RE-POINTED 22 Nov 2026 (Settings' six pages inside, Legora + Stripe): the refusal stands where the figures stood,
       in the amber line (#st-tr-go .st-ls-owed) */
    const bad = await until(() => { const b = document.getElementById('st-tr-download'); const f = document.querySelector('#st-tr-go .st-ls-owed');
      return b && b.disabled && f ? { said: f.textContent.trim(), title: b.getAttribute('title') || '' } : null; });
    check('3 it says "The end is before the start." in amber and greys Download, the reason on it', !!bad && bad.said === 'The end is before the start.' && bad.title === 'The end is before the start.', JSON.stringify(bad));
    await setDay('st-tr-to', was.to);
    await until(() => { const b = document.getElementById('st-tr-download'); return b && !b.disabled && ((document.querySelector('#st-tr-go .st-ls-fig b') || {}).textContent || '').trim() === '3'; });

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
    /* round 26 as drawn (18 Oct 2026): "PDF, sealed", then the acts it carried */
    check('4c …and the download is listed under Downloads so far: who, the period, PDF', !!past && past.length === 1 && /Amina Otieno/.test(past[0]) && past[0].includes(qWord) && /\| PDF, sealed \| [\d,]+$/.test(past[0]), JSON.stringify(past));
    /* RE-POINTED 22 Nov 2026 (Settings' six pages inside, Legora + Stripe): the tabs are the page head's */
    await press('#set-page[data-st-ls="data"] .st-ls-tab[data-st-ls-bk="backup"]', '4d the Backup tab');
    const backup = await until(() => document.getElementById('bk-export') ? true : null);
    check('4d the Backup tab still holds the backup', !!backup);
    await press('#set-page[data-st-ls="data"] .st-ls-tab[data-st-ls-bk="trail"]', '4d back to The trail');

    console.log('\n5 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      /* RE-POINTED 22 Nov 2026 (Settings' six pages inside, Legora + Stripe): the count is four figures (.st-ls-fig),
         the tabs the head's (.st-ls-tab) */
      await until(() => !!document.querySelector('#st-tr-go .st-ls-fig b'));
      const fit = await page.evaluate(() => {
        const band = document.querySelector('.st-tr-band');
        const cut = [...document.querySelectorAll('#set-page[data-st-ls="data"] .st-ls-tab, #st-tr-download, .st-ls-fig, #st-tr-past td')].filter(x => x.scrollWidth > x.clientWidth + 1).length;
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
