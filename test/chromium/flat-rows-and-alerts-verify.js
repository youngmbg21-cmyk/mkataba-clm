/* Chromium verification: FIVE OFF FIVE SCREENSHOTS — the half that is PIXELS.
   ============================================================
   Owner-asked 23 Aug 2026, in one message. f240 pins what the code SAYS; this
   file pins what it DRAWS, and the split is not tidiness:

     · "reduce the size of the stripe by 1 third" is a rendered height. The
       band's own rule names a padding and its BUTTON names the height, and
       whether those two add up to a third off is a question about a box.
     · "move the all, mine, their to sit next to tracked changes" is a
       question about whether two elements share a line — geometry, and one a
       stylesheet cannot answer, because the head is flex-wrap:wrap and may
       still legitimately drop them at a narrow column.
     · "publish round should not be bold" is a COMPUTED weight. The rule that
       decides it is a scoped block at the end of a 3,500-line sheet fighting
       .rl-btn's own 700, and this codebase has been caught exactly there
       before: .rl-rej declared a border and computed to 0 for a year while a
       source-reading test passed on it throughout.
     · "the letters and numbers in the rows are all not bold and the same font
       size" is every painted cell measured, which is the only way to know the
       inline styles and the class rules agree.
     · the duplicated reference and the running order are DRIVEN here on the
       real panel rather than read: buildWorld never loads the shell, so
       buildAlerts has no home in a node test at all.

   PIN THE RELATION, NOT THE NUMBER. The row checks ask "is every cell the same
   size as the row" and never "is it 14px", so the next type pass costs no
   edits here. The one number that is named is the band's old 50px, because the
   ask itself is a proportion of it.

   Run: node test/chromium/flat-rows-and-alerts-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'flat-rows-and-alerts');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* THE BAND'S OWN HEIGHT BEFORE THIS CHANGE, and the reason it is the one
   literal in the file: 30px button + 9px padding twice + a 1px border each
   side. The ask is "a third off", so the claim has to name what it is a third
   of. */
const BAND_WAS = 50;

/* A live negotiation with one UNSENT owner draft — the only state that draws
   the amber band at all. */
const SEED_UNSENT = async () => {
  const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
  negoInit(c);
  const cl = negoClauseList(c);
  await negoEditClause(c, cl[0].clauseId,
    cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500)),
    { author: 'Amina Otieno', side: 'owner', why: 'Matches this year’s volumes.' });
  return c.id;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);

    /* ============================================================ 1 — ALERTS */
    /* THE REPORTED STATE, BUILT: a contract with NO name. That is what made
       the fallback print the reference twice, and a seeded book has none. */
    const alertRows = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      const nameless = JSON.parse(JSON.stringify(c));
      nameless.id = 'MK-NONAME'; nameless.name = '';
      const selfNamed = JSON.parse(JSON.stringify(c));
      selfNamed.id = 'MK-SELF'; selfNamed.name = 'MK-SELF';
      state.contracts.push(nameless, selfNamed);
      const rows = buildAlerts();
      return { kinds: rows.map(r => r.kind),
        nameless: rows.filter(r => r.id === 'MK-NONAME').map(r => r.name),
        selfNamed: rows.filter(r => r.id === 'MK-SELF').map(r => r.name),
        named: rows.filter(r => r.name).slice(0, 3).map(r => ({ n: r.name, i: r.id })) };
    });

    check('1a a contract with no name carries no name line',
      alertRows.nameless.every(n => n === ''), alertRows.nameless);
    check('1b nor does one whose name IS its own reference',
      alertRows.selfNamed.every(n => n === ''), alertRows.selfNamed);
    check('1c a real name still travels, and is not the reference',
      alertRows.named.every(x => x.n && x.n !== x.i), alertRows.named);

    /* THE PANEL ITSELF — the row must draw no empty line where the name was. */
    await page.click('#hdr-notify');
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '01-alerts.png') });
    const panel = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-alert-i]')];
      return rows.slice(0, 12).map(r => ({
        kind: r.getAttribute('data-alert-kind'),
        lines: [...r.querySelectorAll('span > span')]
          .map(s => (s.textContent || '').trim()).filter(Boolean),
      }));
    });
    const dupes = panel.filter(r => r.lines.length > 1
      && r.lines[r.lines.length - 1] === r.lines[r.lines.length - 2]);
    check('1d no row on the real panel prints its reference twice',
      dupes.length === 0, dupes.slice(0, 3));

    /* ====================================================== 4 — THE ORDER */
    /* THE REPORTED STATE, STAGED. The seeded book raises no signing turn of
       this reader's own, so the panel it draws has nothing to put first and a
       check run against it would pass on the broken build too. A route naming
       THIS member as the next internal signer is what makes the row exist —
       and before this change the signing sweep ran LAST in buildAlerts, so
       that row landed at the bottom under every other kind, which is the whole
       of the report. */
    /* GUARDED, so the file REPORTS rather than dies. Run against the code
       before this change, `alertRank` does not exist at all and an unguarded
       evaluate throws — which aborts the run and leaves the other twenty-odd
       checks unreported. A regression file has to be able to describe the
       whole of the old state, not just the first thing wrong with it. */
    const order = await page.evaluate(() => {
      try {
      const me = currentUser();
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      c.signerPlan = [{ id: 'sp-me', order: 1, party: 'internal',
        name: me.name, email: me.email, memberId: me.id, signed: false }];
      const rows = buildAlerts();
      return {
        sigFirst: alertRank('signature'),
        /* REVERSED IN PLACE 24 Aug 2026, the same way f240's twin was: the
           claim is that a date which moved by itself ranks under every piece
           of WORK, and it was pinned to the literal end of the list. A kind
           has since joined below it — 'email-off', the workspace's own
           standing fault, which is not work with anybody's name on it. The
           RELATION is what this was always about, so it is written as one. */
        renewalLast: ALERT_KINDS.filter(k => k.k !== 'email-off')
          .findIndex(k => k.k === 'renewal') === ALERT_KINDS.filter(k => k.k !== 'email-off').length - 1,
        settingUnderWork: alertRank('email-off') === ALERT_KINDS.length - 1,
        unknownLast: alertRank('no-such-kind') >= ALERT_KINDS.length,
        kinds: rows.map(r => r.kind),
        ranks: rows.map(r => alertRank(r.kind)),
        sigAt: rows.findIndex(r => r.kind === 'signature'),
        total: rows.length,
      };
      } catch (e) { return { threw: String(e && e.message || e), sigFirst: -1,
        renewalLast: false, settingUnderWork: false, unknownLast: false,
        kinds: [], ranks: [], sigAt: -1, total: 0 }; }
    });

    check('4a your own signature ranks first of all', order.sigFirst === 0, order.sigFirst);
    check('4b a renewal date ranks last of the work rows', order.renewalLast);
    check('4b\u2032 and a setting nobody is blocked on ranks under all of them',
      order.settingUnderWork);
    check('4c an unranked kind sorts last, never first', order.unknownLast);
    check('4d THE REPORTED ROW EXISTS, and it is at the top',
      order.sigAt === 0, { at: order.sigAt, of: order.total, kinds: order.kinds.slice(0, 8) });
    check('4e nothing else got in above it — the whole list is in rank order',
      order.ranks.every((r, i) => i === 0 || r >= order.ranks[i - 1]),
      order.ranks.slice(0, 14));

    /* And on the PANEL, not just in the model — closed and re-opened, because
       pressing the bell is what rebuilds it.
       A first draft called a `renderAlertsPanel` behind a window guard. THERE
       IS NO SUCH FUNCTION: the guard was always false, the call never ran, and
       the check passed anyway because re-opening the panel does the work. That
       is this codebase's own most repeated defect written into a test rather
       than into the product, and the proofreader is what caught it. */
    await page.keyboard.press('Escape');
    await pause(300);
    await page.click('#hdr-notify');
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '01b-alerts-ordered.png') });
    const firstRow = await page.evaluate(() => {
      const r = document.querySelector('[data-alert-i]');
      return r ? { kind: r.getAttribute('data-alert-kind'),
        text: (r.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) } : null;
    });
    check('4f and the panel really draws it first',
      !!firstRow && firstRow.kind === 'signature', firstRow);

    await page.keyboard.press('Escape');
    await pause(400);

    /* ============================================== 2 + 3 — THE NEGOTIATION PAGE */
    const cid = await page.evaluate(SEED_UNSENT);
    await pause(1200);
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    await page.screenshot({ path: path.join(OUT, '02-negotiation.png') });

    const head = await page.evaluate(() => {
      const box = e => { const r = e.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          mid: Math.round(r.y + r.height / 2) }; };
      const band = document.querySelector('.rl-unsent');
      const go = document.querySelector('.rl-unsent-go');
      /* RE-POINTED 24 Aug 2026. The head was rebuilt on the owner's approved
         render — the caption is .rl-idx-title in .rl-idx-top, and the three
         cuts became a dropdown. The CLAIMS are unchanged: the caption and the
         filter share one line with the caption at the left, and all three cuts
         are offered with exactly one of them live. */
      const cap = document.querySelector('.rl-idx-title, .rl-idx-k');
      const tabs = document.querySelector('#rl-cardfilter, .rl-fsegwrap');
      const sel = document.querySelector('#rl-cardfilter');
      const segs = sel ? [...sel.options] : [...document.querySelectorAll('.rl-fseg')];
      const cs = e => e ? getComputedStyle(e) : null;
      return {
        band: band ? box(band) : null,
        bandBg: band ? cs(band).backgroundColor : null,
        bandBorder: band ? cs(band).borderTopColor : null,
        goBg: go ? cs(go).backgroundColor : null,
        cap: cap ? box(cap) : null,
        tabs: tabs ? box(tabs) : null,
        capText: cap ? (cap.textContent || '').trim() : null,
        segText: segs.map(s => (s.textContent || '').replace(/\s+/g, ' ').trim()),
        segLive: sel ? segs.filter(o => o.selected).length
          : segs.filter(s => s.classList.contains('on')).length,
      };
    });

    check('2a the amber band draws at all', !!head.band, head.band);
    check('2b it is at least a third shorter than the 50px it measured',
      !!head.band && head.band.h <= Math.round(BAND_WAS * 2 / 3),
      { now: head.band && head.band.h, was: BAND_WAS, wanted: Math.round(BAND_WAS * 2 / 3) });
    /* Three amber tokens, three different values, none of them transparent —
       the ground, the rule and the send. A height change may not quietly take
       the colour that makes this a warning. */
    const amber = [head.bandBg, head.bandBorder, head.goBg];
    check('2c and the warning is still a warning — amber ground, amber rule, amber send',
      amber.every(v => v && v !== 'rgba(0, 0, 0, 0)') && new Set(amber).size === 3,
      { bg: head.bandBg, border: head.bandBorder, send: head.goBg });

    /* ---- REVERSED IN PLACE, 24 Aug 2026 ----
       This asked that the caption and the filter share one ruled line, which
       was the 16 Aug arrangement and saved the head a row. The owner-approved
       Change index render of 24 Aug supersedes it: the head now states the
       SHAPE of the round — caption, how many are open, a progress bar — and the
       filter sits on its own line beneath. Demanding one line here would be
       asserting the opposite of what was approved.
       WHAT THE CHECK IS REALLY ABOUT SURVIVES: the two belong to one head, in
       reading order, with nothing between them but the head's own content. */
    check('2d the filter sits under the caption, in the same head',
      !!head.cap && !!head.tabs && head.tabs.y > head.cap.y
        && head.tabs.y - (head.cap.y + head.cap.h) < 90,
      { caption: head.cap, filter: head.tabs });
    check('2e caption at the left, filter at the right',
      !!head.cap && !!head.tabs && head.tabs.x > head.cap.x,
      { capX: head.cap && head.cap.x, tabsX: head.tabs && head.tabs.x });
    check('2f the three cuts are all still there, and exactly one is live',
      head.segText.length === 3 && head.segLive === 1, head.segText);

    /* ---- 3 — nothing in the head row is bold ---- */
    const acts = await page.evaluate(() => {
      const row = document.querySelector('#ws-head .room-acts');
      if (!row) return { absent: true };
      /* THE ROW, NOT THE MENU. The ⋯ menu's own rows are buttons inside
         .room-acts too — they are in the DOM the whole time and measure 0px
         shut. A first draft of this check counted them and reported the row as
         having two heights, which is the menu being closed rather than a
         fault. Anything with no box is not on the row. */
      return [...row.querySelectorAll('button')].map(b => {
        const cs = getComputedStyle(b), r = b.getBoundingClientRect();
        return { text: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22),
          weight: cs.fontWeight, size: cs.fontSize, bg: cs.backgroundColor,
          border: cs.borderTopColor, h: Math.round(r.height), w: Math.round(r.width) };
      }).filter(b => b.h > 0 && b.w > 0);
    });
    const publish = Array.isArray(acts) && acts.find(b => /publish|close round/i.test(b.text));
    check('3a Publish Round is in the head row', !!publish, acts);
    check('3b and it is NOT bold', !!publish && Number(publish.weight) <= 400, publish);
    check('3c nothing else in the row is either',
      Array.isArray(acts) && acts.every(b => Number(b.weight) <= 400),
      Array.isArray(acts) ? acts.map(b => [b.text, b.weight]) : acts);
    check('3d the row still reads as one control — one height, one size',
      Array.isArray(acts) && new Set(acts.map(b => b.h)).size === 1
      && new Set(acts.map(b => b.size)).size === 1,
      Array.isArray(acts) ? acts.map(b => [b.text, b.h, b.size]) : acts);
    check('3e it still LEADS by its outline — a transparent face and an accent rule',
      !!publish && publish.bg === 'rgba(0, 0, 0, 0)'
      && publish.border !== 'rgba(0, 0, 0, 0)', publish);

    /* ---- the control bar's own buttons keep their weight (the fold ladder) ---- */
    const bar = await page.evaluate(() => {
      const b = [...document.querySelectorAll('.rl-tabrow .rl-btn, .rl-head .rl-btn')];
      return b.map(x => ({ t: (x.textContent || '').trim().slice(0, 16),
        w: getComputedStyle(x).fontWeight }));
    });
    check('3f the CONTROL BAR is untouched — its metrics feed the fold ladder',
      bar.length === 0 || bar.every(x => Number(x.w) >= 600), bar);

    /* ================================================ 5 — THE TWO LISTS */
    for (const [label, go] of [['contracts', () => setView('register')],
      ['negotiations', () => openNegotiations({ list: true })]]) {
      await page.evaluate(fn => eval('(' + fn + ')()'), go.toString());
      await pause(1800);
      await page.screenshot({ path: path.join(OUT, `03-${label}.png`) });

      const rows = await page.evaluate(() => {
        const tbody = document.getElementById('reg-tbody');
        if (!tbody) return { absent: true };
        const trs = [...tbody.querySelectorAll('tr[data-row]')].slice(0, 10);
        const cells = [];
        for (const tr of trs) {
          for (const el of tr.querySelectorAll('*')) {
            const txt = [...el.childNodes]
              .filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
            if (!txt) continue;
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            cells.push({ txt: txt.slice(0, 22), size: cs.fontSize,
              weight: cs.fontWeight, color: cs.color, cls: el.className || '' });
          }
        }
        const th = [...document.querySelectorAll('#reg-tbody, .reg-table thead th')]
          .filter(e => e.tagName === 'TH')
          .map(e => ({ w: getComputedStyle(e).fontWeight, s: getComputedStyle(e).fontSize }));
        const bands = [...tbody.querySelectorAll('.ngl-band-k, .ngl-band-n')]
          .map(e => getComputedStyle(e).fontWeight);
        return { cells, th, bands, n: trs.length };
      });

      if (rows.absent) { check(`5-${label} the table draws`, false, rows); continue; }
      check(`5-${label}a the table draws rows`, rows.n > 0, { rows: rows.n });

      /* THE DOCUMENT KIND IS THE ONE DELIBERATE EXCEPTION (owner-chosen, having
         been shown it at the row's size). Everything else is one size. */
      const body = rows.cells.filter(c => !/reg-kind/.test(c.cls));
      const sizes = [...new Set(body.map(c => c.size))];
      check(`5-${label}b every cell but the document kind is ONE size`,
        sizes.length === 1, { sizes, offenders: body.filter(c => c.size !== sizes[0])
          .slice(0, 4).map(c => [c.txt, c.size, c.cls]) });

      const bold = body.filter(c => Number(c.weight) > 400);
      check(`5-${label}c and none of them is bold`, bold.length === 0,
        bold.slice(0, 5).map(c => [c.txt, c.weight, c.cls]));

      const kind = rows.cells.filter(c => /reg-kind/.test(c.cls));
      check(`5-${label}d the document kind stays SMALLER than the row`,
        kind.length === 0 || kind.every(c => parseFloat(c.size) < parseFloat(sizes[0])),
        { kind: kind.slice(0, 2).map(c => c.size), row: sizes[0] });

      /* THE COLOURS ARE THE WHOLE CONDITION ON FLATTENING THE TYPE. */
      const inks = [...new Set(body.map(c => c.color))];
      check(`5-${label}e the rows still carry several inks, not one`,
        inks.length >= 3, inks);

      check(`5-${label}f the column headings keep their weight`,
        rows.th.length > 0 && rows.th.every(t => Number(t.w) >= 600),
        rows.th.slice(0, 3));

      if (label === 'negotiations')
        check('5-negotiationsg the group headings keep theirs too',
          rows.bands.length > 0 && rows.bands.every(w => Number(w) >= 600), rows.bands);
    }

    check('no page errors anywhere in this run', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('the run completed', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) { failed.forEach(f => console.log('  FAILED: ' + f.name)); process.exit(1); }
})();
