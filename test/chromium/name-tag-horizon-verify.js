/* Chromium verification: THE TAG, THE CHOICES AND THE HORIZON (21 Sep 2026).
   ========================================================================
   The source claims are in f348. What is here is what only a rendered page
   can answer: whether a kind tag is really painted at the left of a desk row;
   whether the choices in a hidden control's popup carry an ink of their own;
   and — the owner's own words — whether "the contracts and dates scroll under
   the first line that has Agreement and the months", which is a geometry that
   needs MORE ROWS THAN THE CARD before it means anything at all.

   Run: node test/chromium/name-tag-horizon-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'name-tag-horizon');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, g, d) => { g ? pass++ : fail++; console.log(`${g ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };
const iso = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3200);

    /* ════ 1. THE PREPARED ROW'S KIND ════
       STAGED: a seeded book has nothing prepared, and this is about the rows. */
    const staged = await page.evaluate(e1 => {
      const c = state.contracts.filter(x => !x.archived && x.status !== 'Declined')[0];
      c.status = 'Signed';
      c.execution = { at: new Date(Date.now() - 200 * 864e5).toISOString() };
      c.createdAt = new Date(Date.now() - 300 * 864e5).toISOString();
      c.metadata = Object.assign({}, c.metadata, { expiryDate: e1, noticePeriodDays: 30 });
      c.expiry = e1;
      return (typeof deskItems === 'function') ? deskItems(state.contracts).length : -1;
    }, iso(70));
    ok('1-stage something really is prepared', staged > 0, String(staged));

    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '01-home.png'), fullPage: true });

    /* RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): the desk row and its kind tag
       left Home. The row that took its place names its AGENT at the left —
       the agent's own icon on a tinted square, on the sentence's line. */
    /* RE-POINTED 22 Oct 2026 (Round A, the one desk — the owner picked "The Legora Way"): the renewal is one row of
       Needs you; who prepared it is said on the row's own line ("Jambo · step N of M" on the Board), and on Home its
       step is a drawn mark beside the title, at the left of the row's tail, never a bare number. */
    /* RE-POINTED 24 Oct 2026 (the owner: "delete The Who or what asked column"): the Board's row no longer carries
       "Jambo · step N of M"; the row is still Jambo's (its agent named on the row) and its title is on one line. */
    const tag = await page.evaluate(() => {
      const row = document.querySelector('#hm-agents [data-nd-agent="renew"]');
      if (!row) return null;
      const head = row.querySelector('.nd-c-what b');
      return { drawn: true, agent: row.getAttribute('data-nd-agent'), who: !!row.querySelector('.nd-c-who'), title: head ? head.textContent : '' };
    });
    ok('1 the row is the renewal agent\'s, with no who column', !!tag && tag.drawn && tag.agent === 'renew' && !tag.who && !!tag.title, JSON.stringify(tag));
    /* 1c RETIRED (owner, 10 Nov 2026: "Home page should be removed / deleted"): Home's own row went with Home */
    await page.evaluate(() => setView('dashboard'));

    /* ════ 2. THE DROPDOWN'S CHOICES ════
       RETIRED 17 Nov 2026 (#762, owner's ruling): 2 "the choices carry an ink of their own" and 2b "the control takes the
       chip's corner" measured the Contracts list's filter chips (.reg-filterbar .reg-chip-sel: + Filter, Sort) — those stay
       gone in the new look, so there is no dropdown chip to measure. */

    /* ════ 3. THE HORIZON ════
       MORE ROWS THAN THE CARD, or a sticky header proves nothing. */
    await page.evaluate(() => {
      const base = state.contracts[0];
      const out = [];
      for (let i = 0; i < 24; i++) {
        const c = JSON.parse(JSON.stringify(base));
        c.id = 'HZ-' + i; c.name = 'Horizon row ' + i;
        const d = new Date(Date.now() + (40 + i * 12) * 864e5).toISOString().slice(0, 10);
        c.expiry = d; c.metadata = Object.assign({}, c.metadata, { expiryDate: d });
        out.push(c);
      }
      state.contracts = state.contracts.concat(out);
    });
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1200);
    await page.click('[data-cal-view="horizon"]').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '02-horizon.png'), fullPage: true });

    /* RE-POINTED 23 Nov 2026 (P-14, owner's "Build P-14": the Calendar the Legora + Stripe way on all four tabs): the
       Horizon is ONE calm table — Agreement (its name, then "· who") · Time left (a slim bar and its days) · Decision (a
       soft badge) · Ends — led by its chips (All · Notice passed · Renews on its own, + Stream, the sort); the five band
       boxes, the caption and the twelve months are gone. The owner's own words still stand: the rows scroll UNDER the
       head line (Agreement …), inside the page's one scroller (#cal-ls-body). */
    await page.waitForFunction(() => !!document.querySelector('.cal-page.is-ls .cls-t.is-hz tr.cls-r'), null, { timeout: 8000 }).catch(() => {});
    const hz = await page.evaluate(() => {
      const t = document.querySelector('.cal-page.is-ls .cls-t.is-hz'), sc = document.getElementById('cal-ls-body');
      const chips = document.querySelector('.cal-page.is-ls .cls-chips'), head = t && t.querySelector('thead th');
      if (!t || !sc || !chips || !head) return null;
      const rows = [...t.querySelectorAll('tr.cls-r')];
      const fills = rows.map(r => { const i = r.querySelector('.cls-bk i'); return i ? getComputedStyle(i).backgroundColor : null; });
      return { chipsFirst: chips.compareDocumentPosition(t) === 4 && !document.querySelector('.cal-ladder, .cal-lad'),
        caption: !!document.querySelector('.cal-hz-t, .cal-hz-months'),
        heads: [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()),
        left: rows.map(r => ((r.querySelector('.cls-left .cls-ts') || {}).textContent || '').trim()),
        bars: rows.filter(r => r.querySelector('.cls-left .cls-bk i')).length, n: rows.length,
        sub: ((rows[0] && rows[0].querySelector('.cls-what .cls-ts')) || {}).textContent || '',
        fills, scrollable: sc.scrollHeight > sc.clientHeight + 4,
        head0: Math.round(head.getBoundingClientRect().top) };
    });
    ok('3 the chips lead the table, no band boxes', !!hz && hz.chipsFirst, hz && JSON.stringify({ first: hz.chipsFirst }));
    ok('3b the caption bar and the twelve month heads are gone', !!hz && !hz.caption);
    ok('3c the time left reads as a bar and its days on every row, the heads in plain words',
      !!hz && hz.n > 0 && hz.bars === hz.n && hz.left.every(x => /\d+ days?|beyond a year/.test(x)) && /^Agreement/.test(hz.heads[0] || '') && hz.heads[1] === 'Time left',
      hz && JSON.stringify({ heads: hz.heads, left: hz.left.slice(0, 3), bars: hz.bars, n: hz.n }));
    ok('3d the agreement line is its name, then who it is with', !!hz && /^· \S/.test(hz.sub.trim()), hz && hz.sub);
    /* each bar wears its tone from the time left (steel within half a year, grey beyond; amber and red where the notice
       nears or has passed): painted, never clear, and the book's spread draws more than one tone */
    const clear = v => !v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent';
    ok('3e each bar is filled in its tone, and the spread draws more than one',
      !!hz && hz.fills.length > 0 && hz.fills.every(f => !clear(f)) && new Set(hz.fills).size >= 2, hz && JSON.stringify([...new Set(hz.fills || [])]));

    /* THE OWNER'S OWN WORDS: the contracts and dates scroll UNDER the first
       line. Measured by really scrolling the table. */
    ok('3-stage there are more rows than the card', !!hz && hz.scrollable, hz && String(hz.scrollable));
    await page.evaluate(() => { const sc = document.getElementById('cal-ls-body'); if (sc) sc.scrollTop = 260; });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => {
      const sc = document.getElementById('cal-ls-body'), r = document.querySelector('.cal-page.is-ls .cls-t.is-hz thead th');
      const row = document.querySelector('.cal-page.is-ls .cls-t.is-hz tr.cls-r');
      if (!sc || !r || !row) return { top: 0, ruler: null, row: null };
      return { top: sc.scrollTop, ruler: Math.round(r.getBoundingClientRect().top),
        row: Math.round(row.getBoundingClientRect().top),
        scTop: Math.round(sc.getBoundingClientRect().top) };
    });
    ok('3f the table really scrolled', after.top > 100, String(after.top));
    ok('3g [control] the head line held its place while the rows moved under it',
      !!hz && after.ruler != null && Math.abs(after.ruler - after.scTop) <= 1 && after.row < after.ruler,
      `head ${hz && hz.head0} → ${after.ruler} (scroller top ${after.scTop}) · first row now ${after.row}`);
    await page.screenshot({ path: path.join(OUT, '03-horizon-scrolled.png') });

    /* ════ 4. THE BAR'S OWN ENDS ════
       Young, 21 Sep 2026: "These bars are not the same. They do not have round
       endings in the end." Only a painted page can answer this — the source
       reads a token either way, and a radius that loses a cascade fight looks
       perfectly correct in the file. Asked as a RELATION to the bar's own
       height (a pill), never as a number: the artifact's 4px is half of its
       own 8px bar and HaTi's bar is 14px. */
    await page.evaluate(() => {
      const c = JSON.parse(JSON.stringify(state.contracts[0]));
      const d = new Date(Date.now() + 900 * 864e5).toISOString().slice(0, 10);
      c.id = 'HZ-FAR'; c.name = 'Runs past the ruler';
      c.expiry = d; c.metadata = Object.assign({}, c.metadata, { expiryDate: d });
      state.contracts = state.contracts.concat([c]);
      setView('calendar');
    });
    await page.waitForTimeout(1200);
    await page.click('[data-cal-view="horizon"]').catch(() => {});
    await page.waitForTimeout(1400);
    /* RE-POINTED 23 Nov 2026 (P-14): the time left is a slim track (.cls-bk) with its fill; a row past a year fills
       the track in the quiet grey and says "beyond a year" */
    await page.waitForFunction(() => !!document.querySelector('.cal-page.is-ls .cls-t.is-hz tr.cls-r[data-cal-pick="HZ-FAR"]'), null, { timeout: 8000 }).catch(() => {});
    const bars = await page.evaluate(() => {
      const read = el => {
        if (!el) return null;
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return { h: Math.round(r.height), w: Math.round(r.width),
          tl: cs.borderTopLeftRadius, bl: cs.borderBottomLeftRadius,
          tr: cs.borderTopRightRadius, br: cs.borderBottomRightRadius };
      };
      const rows = [...document.querySelectorAll('.cal-page.is-ls .cls-t.is-hz tr.cls-r')];
      const plainRow = rows.find(r => r.getAttribute('data-cal-pick') !== 'HZ-FAR' && r.querySelector('.cls-bk i') && r.querySelector('.cls-bk i').getBoundingClientRect().width > 30);
      const far = document.querySelector('.cal-page.is-ls .cls-t.is-hz tr.cls-r[data-cal-pick="HZ-FAR"]');
      const fi = far && far.querySelector('.cls-bk i');
      return { n: rows.length, track: read(plainRow && plainRow.querySelector('.cls-bk')), plain: read(plainRow && plainRow.querySelector('.cls-bk i')),
        far: far ? { gray: !!fi && fi.classList.contains('is-gray'), full: !!fi && Math.abs(fi.getBoundingClientRect().width - far.querySelector('.cls-bk').getBoundingClientRect().width) <= 1,
          note: ((far.querySelector('.cls-left .cls-ts') || {}).textContent || '').trim(), beyondWord: i18t('cal_hz_beyond') } : null };
    });
    /* A PAINTED radius is a pill when it is at least half the box's height:
       the browser resolves 999px down to what the box can take. */
    const pill = (v, h) => v != null && parseFloat(v) >= h / 2 - 0.5;
    ok('4-stage a plain bar and the row beyond the year are on the page',
      !!bars && !!bars.plain && !!bars.far, bars && JSON.stringify({ n: bars.n, far: bars.far }));
    ok('4 a bar and its track are pills at BOTH ends',
      !!bars && !!bars.plain && !!bars.track && [bars.plain, bars.track].every(b => pill(b.tl, b.h) && pill(b.bl, b.h) && pill(b.tr, b.h) && pill(b.br, b.h)),
      bars && JSON.stringify({ plain: bars.plain, track: bars.track }));
    ok('4b a row running past a year is quiet: its track filled grey, its words saying it runs beyond',
      !!bars && !!bars.far && bars.far.gray && bars.far.full && bars.far.note.includes(bars.far.beyondWord),
      bars && JSON.stringify(bars.far));
    await page.screenshot({ path: path.join(OUT, '04-horizon-bars.png'), fullPage: true });

    ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
