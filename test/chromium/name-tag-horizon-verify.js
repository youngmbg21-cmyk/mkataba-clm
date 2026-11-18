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

    const hz = await page.evaluate(() => {
      const lad = document.querySelector('.cal-ladder'), sc = document.querySelector('.cal-hz');
      const ruler = document.querySelector('.cal-hz-ruler');
      if (!lad || !sc || !ruler) return null;
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): as drawn (round 5) the months stand over
         each row's own bar (.cal-hz-rm), not in the ruler; they are still read as a ruler, not column heads */
      const m = document.querySelector('.cal-hz-row .cal-hz-rm span');
      return { ladFirst: lad.compareDocumentPosition(sc) === 4,
        caption: !!document.querySelector('.cal-hz-t'),
        scrollable: sc.scrollHeight > sc.clientHeight + 4,
        ruler0: Math.round(ruler.getBoundingClientRect().top),
        sub: (document.querySelector('.cal-hz-lab .m') || {}).textContent,
        monthCase: m ? getComputedStyle(m).textTransform : null,
        monthFace: m ? getComputedStyle(m).fontFamily.split(',')[0] : null,
        /* The figures face is a token (--font-mono), which the type ruling made
           Geist with tabular digits; the ruler follows the token, not a name. */
        monoFace: getComputedStyle(document.documentElement).getPropertyValue('--font-mono').split(',')[0].trim(),
        ladEdge: getComputedStyle(document.querySelector('.cal-lad')).borderTopWidth,
        /* the five boxes, each soft-filled in its band's tone (THE SAP WAY, f987) */
        lads: [...document.querySelectorAll('.cal-lad')].map(el => ({ k: (el.className.match(/cal-lad-(d\d+)/) || [])[1], bg: getComputedStyle(el).backgroundColor, edge: getComputedStyle(el).borderTopWidth })) };
    });
    ok('3 the five bands lead the table', !!hz && hz.ladFirst, hz && String(hz.ladFirst));
    ok('3b the caption bar is gone', !!hz && !hz.caption);
    ok('3c the months read as a ruler, not twelve column heads',
      !!hz && hz.monthCase === 'none' && !!hz.monthFace && hz.monthFace.replace(/["']/g, '') === (hz.monoFace || '').replace(/["']/g, ''),
      hz && hz.monthCase + ' / ' + hz.monthFace + ' vs ' + hz.monoFace);
    ok('3d the agreement line is the artifact\'s order — who, then the reference',
      !!hz && /^[^·]+ · \w+-/.test(hz.sub || ''), hz && hz.sub);
    /* RE-POINTED 16 Nov 2026 (#762): THE SAP WAY (owner's pick, 10 Nov 2026, f987) — the five boxes are soft-filled
       by band, their top rule gone; still each band a card wearing its own tone (red ≤30, amber ≤90, green beyond) */
    const ladBg = k => ((hz && hz.lads || []).find(l => l.k === k) || {}).bg;
    const clear = v => !v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent';
    ok('3e each band is a card filled in its tone (red, amber, green), no top rule',
      !!hz && hz.lads.length === 5 && hz.lads.every(l => !clear(l.bg) && parseFloat(l.edge) === 0)
        && ladBg('d30') !== ladBg('d60') && ladBg('d60') === ladBg('d90') && ladBg('d90') !== ladBg('d180') && ladBg('d180') === ladBg('d365'),
      hz && JSON.stringify(hz.lads));

    /* THE OWNER'S OWN WORDS: the contracts and dates scroll UNDER the first
       line. Measured by really scrolling the table. */
    ok('3-stage there are more rows than the card', !!hz && hz.scrollable, hz && String(hz.scrollable));
    await page.evaluate(() => { document.querySelector('.cal-hz').scrollTop = 260; });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => {
      const sc = document.querySelector('.cal-hz'), r = document.querySelector('.cal-hz-ruler');
      const row = document.querySelector('.cal-hz-row');
      return { top: sc.scrollTop, ruler: Math.round(r.getBoundingClientRect().top),
        row: Math.round(row.getBoundingClientRect().top),
        scTop: Math.round(sc.getBoundingClientRect().top) };
    });
    ok('3f the table really scrolled', after.top > 100, String(after.top));
    /* A NAMED CONTROL: measured at the parent too, the ruler already held in a
       seeded browser — sticky was set and the card happened to be bounded.
       What changed is that the TABLE now owns the scroll (f348 (4b)), so the
       header cannot travel with the page at a height where the card would
       otherwise grow past it. This holds the behaviour still either way. */
    ok('3g [control] the ruler held its place while the rows moved under it',
      !!hz && after.ruler === hz.ruler0 && after.row < after.ruler,
      `ruler ${hz && hz.ruler0} → ${after.ruler} · first row now ${after.row}`);
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
    const bars = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.cal-hz-bar')];
      const read = el => {
        if (!el) return null;
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return { h: Math.round(r.height), w: Math.round(r.width),
          tl: cs.borderTopLeftRadius, bl: cs.borderBottomLeftRadius,
          tr: cs.borderTopRightRadius, br: cs.borderBottomRightRadius };
      };
      const beyond = all.find(b => b.classList.contains('is-beyond'));
      const plain = all.find(b => !b.classList.contains('is-beyond') && b.getBoundingClientRect().width > 30);
      /* the row beyond the year, as drawn (round 5): a quiet row with no bar, its note saying so */
      const far = document.querySelector('.cal-hz-row[data-sel="HZ-FAR"]');
      return { n: all.length, plain: read(plain), beyond: read(beyond),
        far: far ? { isFar: far.classList.contains('is-far'), bars: far.querySelectorAll('.cal-hz-bar').length,
          note: ((far.querySelector('.cal-hz-note') || {}).textContent || '').trim(), beyondWord: i18t('cal_hz_beyond') } : null };
    });
    /* A PAINTED radius is a pill when it is at least half the box's height:
       the browser resolves 999px down to what the box can take. */
    const pill = (v, h) => v != null && parseFloat(v) >= h / 2 - 0.5;
    /* RE-POINTED 16 Nov 2026 (#762): as drawn (round 5) a row beyond the year draws NO bar — so the stage asks for
       the plain bar and the far row, not a cut bar */
    ok('4-stage a plain bar and the row beyond the year are on the page',
      !!bars && !!bars.plain && !!bars.far, bars && JSON.stringify({ n: bars.n, far: bars.far }));
    ok('4 a bar that ends on the ruler is a pill at BOTH ends',
      !!bars && !!bars.plain && pill(bars.plain.tl, bars.plain.h) && pill(bars.plain.bl, bars.plain.h)
        && pill(bars.plain.tr, bars.plain.h) && pill(bars.plain.br, bars.plain.h),
      bars && JSON.stringify(bars.plain));
    /* RE-POINTED 16 Nov 2026 (#762): the cut bar was the old look's; the new look's far row is a quiet row,
       no bar at all (none half-drawn), its note saying it runs beyond the horizon */
    ok('4b a row running past the ruler is a quiet row with no bar, its note saying it runs beyond',
      !!bars && !!bars.far && bars.far.isFar && bars.far.bars === 0 && !bars.beyond && bars.far.note.includes(bars.far.beyondWord),
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
