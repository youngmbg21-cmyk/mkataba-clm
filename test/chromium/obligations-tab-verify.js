/* Chromium verification: OBLIGATIONS GET A HOME (owner-asked 29 Aug 2026, J-2.1)
   ============================================================
   *"i want to first understand how obligations work in HaTi. I am not sure I
   understand how I follow up on obligations per contract"*

   THE ANSWER WAS THAT THERE WAS NOWHERE TO. A contract's promises lived behind
   a card called CHECKS — the things you run BEFORE sending a contract out —
   and an obligation is the opposite: it starts mattering the day the paper is
   signed. They have a tab of their own now.

   EVERYTHING HERE IS MEASURED IN A REAL BROWSER because the claims are about
   PIXELS and PRESSES: is the fifth tab on screen, do the five fit on one line
   at a laptop width in both languages, is the amber actually amber, and does
   ticking one off in the new place move the count in the old one. jsdom
   resolves no cascade and lays nothing out, so none of it can be asked there.
   The SHAPE and the RULES are f253's; what DRAWS is here.

   Screenshots go to test/chromium/shots/obligations-tab/.
   Run: node test/chromium/obligations-tab-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'obligations-tab');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
   Obligations tab went home. Its twin is the Board's Obligations view —
   hbOpenView(id,'oblig'), the door every "Obligations tab" door now opens
   (roomOpenAt / roomGoTab 'oblig') — drawn by the room's own painter
   (roomPaintObligations) into #hb-cv-body[data-hb-cv="oblig"] with the same
   inner markup; "the tab" is that view's button on the Board's top line
   (.hb-cv-seg [data-hb-cv="oblig"]), whose row is the contract's views
   (Your book · Deal board · Obligations · History). */
/* (15 Oct 2026: the view went; sections 1–7 measure the panel's tab, PT below) */
/* Visible pixels, not merely present in the markup. */
const SEEN = `(el => { if (!el) return null; const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }; })`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    /* THE CLASSIC SHAPE, STAGED (26 Sep 2026). This file measures the page as
       it draws below INS_MIN_W — the full table it was written for. At this
       window the page draws the Inspector since the owner chose it for the
       Obligations page, its contract tab; the Inspector is measured in
       four-inspectors-verify. insForce is the page's own stage door, never
       stored. */
    await page.evaluate(() => { if (typeof insForce === 'function') insForce(false); });

    /* ---- THE FIXTURE: one of every band, and one of every reason a row says
       something. The admin signed in above is the member every "mine" claim
       resolves against, so the assignee is read off the live roster rather
       than typed — a name that matches nobody would make every claim below
       pass for the wrong reason. */
    const built = await page.evaluate(async () => {
      const me = currentUser();
      const day = off => { const d = new Date(); d.setDate(d.getDate() + off);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
      const c = state.contracts.find(x => x.status === 'Signed') || state.contracts[0];
      const bare = state.contracts.find(x => x.id !== c.id) || null;
      c.obligations = [
        { id:'ob1', desc:'Quarterly volume report to the buyer', due:day(-9),
          status:'open', party:'ours', assignee:me.name, recurring:'quarterly' },
        { id:'ob2', desc:'Insurance certificate on file', due:day(3),
          status:'open', party:'ours', assignee:me.email },
        { id:'ob3', desc:'Deliver the audited accounts', due:day(400),
          status:'open', party:'theirs', assignee:'Nobody At All' },
        { id:'ob4', desc:'Countersigned annex returned', due:day(-40),
          status:'done', party:'theirs', assignee:'Nobody At All' },
      ];
      if (bare) bare.obligations = [];
      persist(c); if (bare) persist(bare);
      return { id: c.id, bare: bare ? bare.id : null, me: me.name, n: c.obligations.length };
    });
    /* persist() is DEBOUNCED at 400ms and openWorkspace re-reads the contract
       from the server, so a fixture written and opened in the same breath is
       opened before it has been saved — and the tab draws an empty book while
       the record on screen is right. Waited for, not slept past by luck. */
    await page.waitForFunction(() => !document.querySelector('#save-flag, .saving'), null, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1400);
    console.log('   fixture: ' + built.id + ' — ' + built.n + ' obligations, signed in as ' + built.me);

    /* RE-POINTED 15 Oct 2026 (owner: "the whole page needs to go ... obligations
       has its own panel"): the Board's Obligations view went with the
       contract's views, and every "Obligations tab" door lands on the panel's
       Obligations tab beside Home's paper (pdOpenOnHome 'oblig'). Sections 1–7
       now measure that tab. The banded full-width table (its four headings,
       its "nobody owns this" tag, its own count) was the removed view's and is
       no longer drawn for one contract; the Obligations page (section 8 on)
       keeps the bands across every contract. */
    const PT = '#ig-dock [data-pd-tab="oblig"]';
    const rowOf = desc => `[...document.querySelectorAll('#pd-body .pd-ob')].find(r => r.textContent.includes(${JSON.stringify(desc)}))`;
    const markDone = desc => page.evaluate(`(() => { const r = ${rowOf(desc)}; const b = r && [...r.querySelectorAll('button')].find(x => /Mark done/.test(x.textContent)); if (b) b.click(); return !!b; })()`);

    /* ============ 1. THE TAB IS ON SCREEN, BESIDE THE PAPER ============ */
    await page.evaluate(id => roomOpenAt(id, 'oblig'), built.id);
    await page.waitForFunction(() => !!document.querySelector('#pd-body .pd-ob'), null, { timeout: 8000 }).catch(() => {});
    const row = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const tabs = [...document.querySelectorAll('#ig-dock [data-pd-tab]')];
      return { keys: tabs.map(b => b.getAttribute('data-pd-tab')), tops: tabs.map(b => Math.round(b.getBoundingClientRect().top)),
        oblig: seen(document.querySelector(${JSON.stringify(PT)})), lit: (document.querySelector('#ig-dock [data-pd-tab][aria-selected="true"]') || {}).getAttribute?.('data-pd-tab') || null,
        paper: window.intel && intel.paper ? intel.paper.id : null };
    })()`);
    check('the door lands on that contract’s paper with the panel’s Obligations tab lit',
      row.paper === built.id && row.lit === 'oblig', JSON.stringify({ paper: row.paper, lit: row.lit }));
    check('and the tab is real pixels, beside Clauses and before Menu',
      !!(row.oblig && row.oblig.on) && row.keys.indexOf('oblig') === row.keys.indexOf('doc') + 1 && row.keys.indexOf('oblig') < row.keys.indexOf('menu'), row.keys.join(','));
    check('and the tabs sit on ONE line at 1500px', new Set(row.tops).size === 1, JSON.stringify(row.tops));
    const cnt = await page.evaluate(`(() => { const n = document.querySelector(${JSON.stringify(PT + ' .pd-tab-n')}); return n ? n.textContent.trim() : null; })()`);
    check('the tab’s number is the list behind it', cnt === String(built.n), `${cnt} for ${built.n} obligations`);

    /* ============ 2. THE LIST ============================================ */
    await page.screenshot({ path: path.join(OUT, '01-obligations-tab.png') });
    const pane = await page.evaluate(() => ({ rows: document.querySelectorAll('#pd-body .pd-ob').length,
      ours: document.querySelectorAll('#pd-body .pd-ob.is-ours').length, theirs: document.querySelectorAll('#pd-body .pd-ob.is-theirs').length }));
    check('the tab draws every obligation, ours and theirs marked', pane.rows === 4 && pane.ours === 2 && pane.theirs === 2, JSON.stringify(pane));

    /* ============ 3. COMPLETING GOES THROUGH THE ONE VERB ================ */
    const before = await page.evaluate(id => (getContract(id).obligations.find(o => o.id === 'ob2') || {}).status, built.id);
    const pressedDone = await markDone('Insurance certificate on file');
    await page.waitForTimeout(500);
    const dlg = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const at = document.getElementById('od-at');
      const face = at && at.dataset.dp === '1' ? at.nextElementSibling : at;
      return { on: !!(face && seen(face) && seen(face).on), value: at ? at.value : null, max: at ? at.getAttribute('max') : null,
        note: !!document.getElementById('od-note'), next: (document.getElementById('od-next') || {}).textContent || '' };
    })()`);
    check('Mark done on the tab asks when it was done, defaulting to today',
      pressedDone && dlg.on === true && dlg.value === dlg.max, JSON.stringify({ pressedDone, v: dlg.value, max: dlg.max }));
    check('…and offers a reference, and nothing else', dlg.note === true && dlg.next === '', 'ob2 is a one-off, so no next instance is promised');
    if (dlg.note){
      await page.evaluate(() => { document.getElementById('od-note').value = 'REF/2026/118'; });
      await page.click('#od-go');
    }
    await page.waitForTimeout(800);
    const after = await page.evaluate(id => {
      const c = getContract(id); const o = c.obligations.find(x => x.id === 'ob2');
      return { status: o.status, at: o.completedAt || '', by: o.completedBy || '', note: o.completedNote || '',
        trail: (c.audit || []).filter(a => a.action === 'Obligation').length };
    }, built.id);
    check('a press on the tab completes it on the RECORD', before === 'open' && after.status === 'done', `${before} → ${after.status}`);
    check('…carrying the day it was done, who closed it, and the reference',
      !!after.at && !!after.by && after.note === 'REF/2026/118', JSON.stringify({ at: after.at, by: after.by, note: after.note }));
    check('…through the one verb, so the audit trail carries it', after.trail > 0, `${after.trail} obligation entries`);

    /* ============ 4. THE BELL ============================================ */
    const bell = await page.evaluate(`(() => {
      const rows = buildAlerts().filter(a => a.kind === 'obligation');
      return { n: rows.length, texts: rows.map(r => r.text), ids: rows.map(r => r.id) };
    })()`);
    check('the bell carries the reader’s OWN obligation, inside the window only',
      bell.n === 1 && /Overdue/.test(bell.texts[0] || ''), JSON.stringify(bell.texts));
    check('and the row names the contract it is on', bell.ids[0] === built.id, `${bell.ids[0]} vs ${built.id}`);
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(700);
    await page.evaluate(() => { const a = buildAlerts().find(x => x.kind === 'obligation'); a.go(); });
    await page.waitForFunction(id => window.intel && intel.paper && intel.paper.id === id && window.pdTab && pdTab() === 'oblig' && !!document.querySelector('#pd-body .pd-ob'), built.id, { timeout: 8000 }).catch(() => {});
    const landed = await page.evaluate(() => ({ view: state.view, id: window.intel && intel.paper ? intel.paper.id : null, tab: window.pdTab ? pdTab() : null, pane: !!document.querySelector('#pd-body .pd-ob') }));
    check('pressing it lands on that contract’s Obligations tab', landed.id === built.id && landed.tab === 'oblig' && landed.pane === true, JSON.stringify(landed));

    /* ============ 5. A CONTRACT WITH NONE ================================ */
    if (built.bare){
      await page.evaluate(id => roomOpenAt(id, 'oblig'), built.bare);
      await page.waitForFunction(id => window.intel && intel.paper && intel.paper.id === id && window.pdTab && pdTab() === 'oblig', built.bare, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(400);
      const none = await page.evaluate(`(() => ({ count: !!document.querySelector(${JSON.stringify(PT + ' .pd-tab-n')}), rows: document.querySelectorAll('#pd-body .pd-ob').length,
        text: ((document.getElementById('pd-body') || {}).textContent || '').replace(/\\s+/g,' ').trim().slice(0, 80) }))()`);
      check('a contract with none draws the tab, an empty state, and NO count', none.count === false && none.rows === 0 && none.text.length > 0, JSON.stringify(none));
      check('…and does not also say "0 outstanding" above it', !/0 outstanding/.test(none.text), none.text);
      await page.screenshot({ path: path.join(OUT, '02-no-obligations.png') });
    }

    /* ============ 6. THE TABS FIT, AT A LAPTOP WIDTH, IN BOTH LANGUAGES == */
    await page.evaluate(id => roomOpenAt(id, 'oblig'), built.id);
    await page.waitForFunction(() => !!document.querySelector('#pd-body .pd-ob'), null, { timeout: 8000 }).catch(() => {});
    for (const [lang, w] of [['en', 1280], ['sv', 1280], ['sv', 1500]]){
      await page.setViewportSize({ width: w, height: 900 });
      await page.evaluate(l => langSet(l, { repaint: true }), lang);
      await page.waitForTimeout(900);
      const fit = await page.evaluate(`(() => {
        const tabs = [...document.querySelectorAll('#ig-dock [data-pd-tab]')];
        return { tops: tabs.map(b => Math.round(b.getBoundingClientRect().top)), words: tabs.map(b => (b.textContent || '').replace(/\\s+/g,' ').trim()),
          scrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      })()`);
      check(`the panel’s tabs stay on one line at ${w}px in ${lang}`, fit.tops.length > 1 && new Set(fit.tops).size === 1, fit.words.join(' | '));
      check(`and the page does not scroll sideways at ${w}px in ${lang}`, fit.scrollsSideways === false, String(fit.scrollsSideways));
      if (lang === 'sv' && w === 1280) await page.screenshot({ path: path.join(OUT, '03-sv-1280.png') });
    }
    await page.evaluate(() => langSet('en', { repaint: true }));
    await page.waitForTimeout(600);

    /* ============ 7. A REPEATING DUTY OPENS THE NEXT ONE (J-2.2) ========== */
    await page.evaluate(id => roomOpenAt(id, 'oblig'), built.id);
    await page.waitForFunction(() => !!document.querySelector('#pd-body .pd-ob'), null, { timeout: 8000 }).catch(() => {});
    const wasN = await page.evaluate(id => getContract(id).obligations.length, built.id);
    await markDone('Quarterly volume report to the buyer');
    await page.waitForTimeout(500);
    const promised = await page.evaluate(() => (document.getElementById('od-next') || {}).textContent || '');
    check('the dialog NAMES the next instance and its date before the press', /\d{4}-\d{2}-\d{2}/.test(promised), promised.trim() || 'nothing promised');
    if (await page.locator('#od-go').count()) await page.click('#od-go');
    await page.waitForTimeout(900);
    const series = await page.evaluate(id => {
      const c = getContract(id);
      const first = c.obligations.find(o => o.id === 'ob1');
      const next = c.obligations.filter(o => o.seriesId === 'ob1' && o.id !== 'ob1');
      return { n: c.obligations.length, done: first.status, made: next.length, due: next[0] ? next[0].due : '',
        who: next[0] ? next[0].assignee : '', fresh: next[0] ? next[0].id !== 'ob1' : false,
        rows: document.querySelectorAll('#pd-body .pd-ob').length };
    }, built.id);
    check('completing it opens EXACTLY ONE next instance, with its own id', series.n === wasN + 1 && series.made === 1 && series.fresh === true, JSON.stringify(series));
    check('…the date the dialog promised, and the same person still owes it', promised.includes(series.due) && !!series.who, `${series.due} · ${series.who}`);
    check('…and the tab draws it without a reload', series.rows === wasN + 1, `${series.rows} rows`);
    await page.screenshot({ path: path.join(OUT, '04-series.png') });

    /* ============ 8. THE WORKLIST (J-2.3) ===============================
       The tab answers "what does THIS contract commit us to"; this answers the
       question underneath it — what is waiting on somebody now, across
       everything. Driven from the sidebar door, because a door that does not
       open is indistinguishable in the markup from one that does. */
    await page.evaluate(() => { const c = state.contracts.find(x => x.id !== state.activeId);
      if (c){ c.counterpartyEmail = 'ops@nordkust.test';
        c.obligations = [{ id: 'x1', desc: 'Deliver the audited accounts',
          due: '2026-01-01', status: 'open', party: 'theirs' },
          /* ---- A REAL ONE, SO THE CLAMP CLAIM DISCRIMINATES (M-6) ----
             Every obligation this fixture carried was four or five words, so a
             check that the date column holds one vertical passed on the unfixed
             code too — a description, not a measurement. This is the shape the
             report came off: a duty read straight out of a preferred-stock
             charter, which wraps to six lines in that column unclamped. */
          { id: 'x2', status: 'open', party: 'theirs', due: '2026-02-01',
            desc: 'Corporation shall not declare, pay or set aside dividends on any '
              + 'other class or series of stock unless the Preferred Stock first '
              + 'receives a preferential non-cumulative dividend of at least six per '
              + 'cent per annum of the applicable Original Issue Price per share' }];
        persist(c); } });
    await page.waitForTimeout(1400);
    await page.click('#side-nav [data-view="obligations"]');
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '05-worklist.png') });
    const wl = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const card = document.querySelector('.obw-card');
      const rows = [...document.querySelectorAll('.obw-table tr[data-obw-row]')];
      return { view: state.view, on: !!(card && seen(card) && seen(card).on),
        rows: rows.length,
        contracts: [...new Set(rows.map(r => r.getAttribute('data-obw-cid')))].length,
        bands: [...document.querySelectorAll('.obw-band')].map(b => b.textContent.replace(/\s+/g,' ').trim()),
        filters: document.querySelectorAll('.obw-filters [data-obw-f]').length,
        chase: document.querySelectorAll('[data-obw-chase]').length,
        sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    })()`);
    check('the worklist draws, as pixels, from the sidebar door',
      wl.view === 'obligations' && wl.on === true, JSON.stringify({ v: wl.view, on: wl.on }));
    /* REVERSED IN PLACE 30 Aug 2026. This pressed the sidebar door and then
       asserted the WHOLE book was on screen — which was true only because the
       door landed on the page's default narrowing while its own badge counts
       what is LATE. A door reading 1 opened a list of 4, and the standing rule
       is that the number on a door matches the list behind it. So the door's
       arrival is asserted as the cut it names, and the claim this check was
       really making — this page lists obligations from more than one contract,
       banded — is asserted where it is true: with the state filter widened. */
    check('…and it lands on the cut its own badge counts — what is LATE',
      wl.rows >= 1 && wl.bands.length >= 1 && /Overdue|Försenad/i.test(wl.bands.join(' ')),
      `${wl.rows} rows — ${wl.bands.join(' | ')}`);
    const whole = await page.evaluate(`(() => {
      const sel = document.querySelector('.obw-filters [data-obw-f="state"]');
      sel.value = 'all'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return null;
    })()`);
    await page.waitForTimeout(500);
    const wl2 = await page.evaluate(`(() => {
      const rows = [...document.querySelectorAll('.obw-table tr[data-obw-row]')];
      return { rows: rows.length,
        contracts: [...new Set(rows.map(r => r.getAttribute('data-obw-cid')))].length,
        bands: [...document.querySelectorAll('.obw-band')].map(b => b.textContent.replace(/\s+/g,' ').trim()) };
    })()`);
    check('…listing obligations from MORE THAN ONE contract, banded by lateness',
      wl2.rows >= 2 && wl2.contracts >= 2 && wl2.bands.length >= 1,
      `${wl2.rows} rows over ${wl2.contracts} contracts — ${wl2.bands.join(' | ')}`);
    void whole;
    check('…with its five filters and no sideways scroll',
      wl.filters === 5 && wl.sideways === false, `${wl.filters} filters`);

    /* ---- THE WORKLIST READS AS A TABLE (M-6, owner-reported 31 Aug 2026) ----
       Four reports on one screenshot: no column headers, a Clear that never
       says whether anything is on, an obligation that wraps to six lines so the
       date beside it sits at a different height on every row, and a door
       nothing on the row admits to.

       MEASURED, never read: every one of these is a question about pixels. The
       clamp in particular is only answerable by comparing the DATE cell's own
       top across rows — the markup looks identical either way. */
    const tbl = await page.evaluate(() => {
      const head = [...document.querySelectorAll('.obw-table thead th')];
      const rows = [...document.querySelectorAll('.obw-table tr[data-obw-row]')];
      /* ---- MEASURED AS ROW HEIGHT, NOT AS THE CELL'S OWN TOP ----
         A table cell stretches to its row, so its top is 0 from the row's top
         on every row whatever the row's height — a check written that way
         passes on the unfixed code and is a description. What the report is
         about is that the ROWS are one height, so the date column reads down
         one vertical rhythm instead of drifting. */
      const dates = rows.map(r => {
        const td = r.querySelector('.obw-when');
        const rr = td.getBoundingClientRect(), tr = r.getBoundingClientRect();
        return { off: Math.round(rr.top - tr.top), h: Math.round(tr.height) };
      });
      const hs = dates.map(d => d.h);
      const what = rows.map(r => r.querySelector('.obw-what'));
      const clamp = what.map(w => { const cs = getComputedStyle(w);
        return cs.whiteSpace + '/' + cs.textOverflow + '/' + cs.overflow; });
      const titled = what.every(w => (w.getAttribute('title') || '').trim().length > 0);
      const whole = what.every(w => (w.getAttribute('title') || '').trim()
        .startsWith(w.textContent.trim().slice(0, 20)));
      const clear = document.getElementById('obw-clear');
      const cs = getComputedStyle(clear);
      return { cols: head.map(h => h.className), names: head.map(h => h.textContent.trim()),
        sticky: head[0] ? getComputedStyle(head[0]).position : 'no head row at all',
        cells: rows.length ? rows[0].querySelectorAll('td').length : 0,
        offs: [...new Set(dates.map(d => d.off))], heights: [...new Set(hs)],
        spread: hs.length ? Math.max(...hs) - Math.min(...hs) : -1, tallest: hs.length ? Math.max(...hs) : -1,
        clamp: [...new Set(clamp)], titled, whole,
        clearOff: clear.disabled, clearInk: cs.color, clearOn: clear.classList.contains('is-on'),
        clearTip: clear.getAttribute('title') || '' };
    });
    check('M-6 the table names its columns, one head cell per body cell',
      tbl.cols.length === tbl.cells && tbl.names.filter(Boolean).length >= 4,
      `${tbl.cols.length} heads vs ${tbl.cells} cells — ${tbl.names.join(' | ')}`);
    check('M-6 …and the head does not scroll away from the columns it names',
      tbl.sticky === 'sticky', tbl.sticky);
    /* THE REPORTED FAULT ITSELF: the date column on one vertical at every row.
       Before the clamp a long obligation wrapped to six lines, so the row grew
       and the date sat at the top of whatever height that row happened to be. */
    check('M-6 THE DATE COLUMN HOLDS ONE VERTICAL — every row is one height',
      tbl.spread === 0 && tbl.tallest <= 70,
      `spread ${tbl.spread}px, tallest ${tbl.tallest}px — heights ${tbl.heights.join(', ')}`);
    check('M-6 …because the obligation is cut to one line, with an ellipsis saying so',
      tbl.clamp.length === 1 && tbl.clamp[0] === 'nowrap/ellipsis/hidden', tbl.clamp.join(', '));
    check('M-6 …and nothing is hidden silently — the whole wording is on the row',
      tbl.titled && tbl.whole, `titled ${tbl.titled}, whole ${tbl.whole}`);
    /* CLEAR STATES ITSELF. Measured from the page's OWN DEFAULT CUT, which is
       what the reader arrives on — so the checks above (which widened State to
       'all' for the sake of having rows from two contracts) are undone first.
       That widening IS a narrowing as far as this reading is concerned, because
       State opens on `open`: comparing against 'all' rather than against the
       default would have reported the page as filtered the moment it drew. */
    await page.evaluate(() => document.getElementById('obw-clear').click());
    await page.waitForTimeout(500);
    const clearNow = await page.evaluate(() => {
      const c = document.getElementById('obw-clear');
      const before = { off: c.disabled, tip: c.getAttribute('title'),
        marked: !!document.querySelector('.obw-f.is-on') };
      const sel = document.querySelector('.obw-filters [data-obw-f="side"]');
      sel.value = 'theirs'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return before;
    });
    await page.waitForTimeout(500);
    const clearAfter = await page.evaluate(() => {
      const c = document.getElementById('obw-clear');
      const f = document.querySelector('.obw-f.is-on');
      return { off: c.disabled, on: c.classList.contains('is-on'),
        count: (c.textContent.match(/\d+/) || [''])[0],
        tip: c.getAttribute('title') || '',
        marked: !!f, markedWhich: f ? (f.querySelector('select') || {}).getAttribute?.('data-obw-f') : null };
    });
    check('M-6 CLEAR IS DEAD AND QUIET WITH NOTHING NARROWING THE LIST',
      clearNow.off === true && clearNow.marked === false && /narrow/i.test(clearNow.tip || ''),
      `disabled ${clearNow.off}, marked ${clearNow.marked} · "${clearNow.tip}"`);
    check('M-6 …and comes alive, counting, the moment a filter is on',
      clearAfter.off === false && clearAfter.on === true && clearAfter.count === '1',
      `disabled ${clearAfter.off}, accented ${clearAfter.on}, count ${clearAfter.count}`);
    check('M-6 …and the control doing the narrowing says so itself',
      clearAfter.marked === true && clearAfter.markedWhich === 'side',
      `marked ${clearAfter.markedWhich}`);
    await page.evaluate(() => document.getElementById('obw-clear').click());
    await page.waitForTimeout(500);
    const cleared = await page.evaluate(() => {
      const c = document.getElementById('obw-clear');
      return { off: c.disabled, marked: !!document.querySelector('.obw-f.is-on') };
    });
    check('M-6 …and pressing it puts the page back and stands the button down',
      cleared.off === true && cleared.marked === false,
      `disabled ${cleared.off}, still marked ${cleared.marked}`);
    await page.evaluate(`(() => {
      const sel = document.querySelector('.obw-filters [data-obw-f="state"]');
      sel.value = 'all'; sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await page.waitForTimeout(500);
    /* EVERY Chase sits on a row that is theirs and still open — a count would
       only pin today's fixture; this pins the rule. */
    const chaseRows = await page.evaluate(() =>
      [...document.querySelectorAll('[data-obw-chase]')].map(b => {
        const tr = b.closest('tr');
        return { side: (tr.querySelector('.obt-side') || {}).className || '',
          done: /Completed|Avklarade/.test((tr.previousElementSibling || {}).textContent || '') };
      }));
    check('and Chase is offered on a theirs row and nowhere else',
      chaseRows.length > 0 && chaseRows.every(r => /obt-side-them/.test(r.side)),
      `${chaseRows.length} chase buttons, all on theirs`);

    /* A ROW LANDS ON THE CONTRACT'S OBLIGATIONS TAB — question six, and a row
       that opened the Document tab would make the reader hunt for what they
       pressed. */
    const want = await page.evaluate(() =>
      document.querySelector('.obw-table tr[data-obw-row]').getAttribute('data-obw-cid'));
    await page.click('.obw-table tr[data-obw-row]');
    /* RE-POINTED 14 Oct 2026 (the overnight work order, step 2; was Home's
       Document on the panel's Obligations tab, 11 Oct): a row opens the
       Board's Obligations view for its contract — still the place the row is
       about. Asked of the state, bounded. */
    /* RE-POINTED 15 Oct 2026 (the Board's view went): the row opens its
       contract's paper with the panel's Obligations tab lit, that row chosen */
    await page.waitForFunction(() => state.view === 'dashboard' && window.pdTab && pdTab() === 'oblig' && !!document.querySelector('#pd-body .pd-ob'), null, { timeout: 8000 }).catch(() => {});
    const back = await page.evaluate(() => ({ view: state.view, face: window.hbFace ? hbFace() : null, id: window.intel && intel.paper ? intel.paper.id : null,
      tab: window.pdTab ? pdTab() : null, chosen: !!document.querySelector('#pd-body .pd-ob.is-chosen') }));
    check('pressing a row opens that contract with the panel\'s Obligations tab, the row chosen',
      back.view === 'dashboard' && back.face === 'paper' && back.id === want && back.tab === 'oblig' && back.chosen, JSON.stringify(back));

    /* ---- THE CHASE RECORDS THE FACT WHATEVER THE MAIL DOES ---- */
    await page.click('#side-nav [data-view="obligations"]');
    await page.waitForTimeout(800);
    const chased = await page.evaluate(async () => {
      const b = document.querySelector('[data-obw-chase]');
      if (!b) return { none: true };
      const cid = b.getAttribute('data-obw-cid'), oid = b.getAttribute('data-obw-chase');
      b.click();
      await new Promise(r => setTimeout(r, 400));
      /* confirmDialog mounts its own overlay — #confirm-overlay — rather than
         going through openModal, so the press is found there. */
      const go = [...document.querySelectorAll('#confirm-overlay button')]
        .find(x => /Send the reminder/i.test(x.textContent || ''));
      const asked = !!go;
      if (go) go.click();
      await new Promise(r => setTimeout(r, 1500));
      const o = (getContract(cid).obligations || []).find(x => x.id === oid) || {};
      return { asked, at: o.chasedAt || '', by: o.chasedBy || '',
        trail: (getContract(cid).audit || []).filter(a => /Chased/.test(a.detail || '')).length };
    });
    check('chasing asks first — it is the one act here that leaves the building',
      chased.asked === true, String(chased.asked));
    check('…and the fact is on the record whatever the mail did',
      !!chased.at && !!chased.by && chased.trail >= 1, JSON.stringify(chased));

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e){
    check('the run completed', false, e.message);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed · shots in ${OUT}`);
    await browser.close(); await h.stop();
    process.exit(pass === results.length ? 0 : 1);
  }
})();
