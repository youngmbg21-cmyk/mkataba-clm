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

    const tag = await page.evaluate(() => {
      const row = document.querySelector('.hm-row.is-desk');
      if (!row) return null;
      const t = row.querySelector('.hm-dk-tag');
      if (!t) return { drawn: false };
      const rr = row.getBoundingClientRect(), tr = t.getBoundingClientRect();
      const head = row.querySelector('.hm-desk-head').getBoundingClientRect();
      const cs = getComputedStyle(t);
      return { drawn: true, word: t.textContent.trim(),
        atLeft: Math.round(tr.left - rr.left) <= 14 && tr.right <= head.left + 1,
        h: Math.round(tr.height), bg: cs.backgroundColor, ink: cs.color,
        sameLine: Math.abs((tr.top + tr.height / 2) - (head.top + head.height / 2)) < 12 };
    });
    ok('1 the row carries its kind as a tag', !!tag && tag.drawn, JSON.stringify(tag));
    ok('1b and it sits at the LEFT, on the sentence\'s own line',
      !!tag && tag.atLeft && tag.sameLine, JSON.stringify(tag && { l: tag.atLeft, s: tag.sameLine }));
    /* GATED on the tag really being drawn, or an absence satisfies it. */
    ok('1c it is a chip, not bare words',
      !!tag && tag.drawn && tag.bg !== 'rgba(0, 0, 0, 0)', tag && tag.bg);

    /* ════ 2. THE DROPDOWN'S CHOICES ════ */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1400);
    const opts = await page.evaluate(() => {
      const s = document.querySelector('.reg-filterbar .reg-chip-sel');
      if (!s || !s.options.length) return null;
      const cs = getComputedStyle(s), os = getComputedStyle(s.options[1] || s.options[0]);
      return { hidden: cs.opacity === '0', selColor: cs.color,
        optColor: os.color, optBg: os.backgroundColor, radius: cs.borderTopLeftRadius };
    });
    ok('2 the choices carry an ink of their own',
      !!opts && opts.hidden && opts.optColor !== opts.optBg
        && opts.optColor !== 'rgba(0, 0, 0, 0)', JSON.stringify(opts));
    ok('2b and the control itself takes the chip\'s corner',
      !!opts && parseFloat(opts.radius) > 8, opts && opts.radius);

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
      const m = document.querySelector('.cal-hz-months span');
      return { ladFirst: lad.compareDocumentPosition(sc) === 4,
        caption: !!document.querySelector('.cal-hz-t'),
        scrollable: sc.scrollHeight > sc.clientHeight + 4,
        ruler0: Math.round(ruler.getBoundingClientRect().top),
        sub: (document.querySelector('.cal-hz-lab .m') || {}).textContent,
        monthCase: m ? getComputedStyle(m).textTransform : null,
        monthFace: m ? getComputedStyle(m).fontFamily.split(',')[0] : null,
        ladEdge: getComputedStyle(document.querySelector('.cal-lad')).borderTopWidth };
    });
    ok('3 the five bands lead the table', !!hz && hz.ladFirst, hz && String(hz.ladFirst));
    ok('3b the caption bar is gone', !!hz && !hz.caption);
    ok('3c the months read as a ruler, not twelve column heads',
      !!hz && hz.monthCase === 'none' && /Mono/i.test(hz.monthFace || ''),
      hz && hz.monthCase + ' / ' + hz.monthFace);
    ok('3d the agreement line is the artifact\'s order — who, then the reference',
      !!hz && /^[^·]+ · \w+-/.test(hz.sub || ''), hz && hz.sub);
    ok('3e each band is a card with its tone on the top edge',
      !!hz && parseFloat(hz.ladEdge) === 3, hz && hz.ladEdge);

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

    ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
