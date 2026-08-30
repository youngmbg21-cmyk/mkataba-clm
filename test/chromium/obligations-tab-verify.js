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

    /* ============ 1. THE TAB IS ON SCREEN, AND IT IS THE FIFTH ============ */
    await page.evaluate(id => window.openWorkspace(id), built.id);
    await page.waitForTimeout(1200);
    const row = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const tabs = [...document.querySelectorAll('#ws-tabs [data-ws-tab]')];
      return {
        keys: tabs.map(b => b.getAttribute('data-ws-tab')),
        words: tabs.map(b => (b.textContent || '').replace(/\\s+/g, ' ').trim()),
        tops: tabs.map(b => Math.round(b.getBoundingClientRect().top)),
        oblig: seen(document.querySelector('#ws-tabs [data-ws-tab="oblig"]')),
        headH: Math.round(document.getElementById('ws-head').getBoundingClientRect().height),
      };
    })()`);
    check('the room draws five tabs and Obligations is the fourth',
      row.keys.join(',') === 'terms,docs,sign,oblig,history', row.keys.join(','));
    check('and it is real pixels, not merely markup',
      !!(row.oblig && row.oblig.on), JSON.stringify(row.oblig));
    check('all five sit on ONE line at 1500px',
      new Set(row.tops).size === 1, JSON.stringify(row.tops));

    /* ---- THE COUNT, AND THE ONE THING IT COLOURS ---- */
    const cnt = await page.evaluate(`(() => {
      const n = document.querySelector('#ws-tabs [data-ws-tab="oblig"] .room-tab-n');
      if (!n) return { none: true };
      return { text: n.textContent.trim(), late: n.classList.contains('is-late'),
        ink: getComputedStyle(n).color };
    })()`);
    check('the tab carries the OUTSTANDING count, not the total',
      cnt.text === '3', `${cnt.text} (the fourth is done)`);
    check('and it is amber, because something is overdue',
      cnt.late === true && cnt.ink !== 'rgb(0, 0, 0)', `${cnt.ink}`);

    /* ============ 2. THE PANE, AND ITS BANDS ============================= */
    await page.click('#ws-tabs [data-ws-tab="oblig"]');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '01-obligations-tab.png') });
    const pane = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const host = document.getElementById('ws-obligations-pane');
      if (!host) return { mounted: false };
      const bands = [...host.querySelectorAll('.obt-band')].map(b =>
        (b.textContent || '').replace(/\\s+/g, ' ').trim());
      return { mounted: true, box: seen(host),
        bands, rows: host.querySelectorAll('.obt-row').length,
        unowned: host.querySelectorAll('.obt-unowned').length,
        overCap: (host.querySelector('.obt-over') || {}).textContent,
        wide: Math.round(host.getBoundingClientRect().width),
        pageWide: Math.round(document.getElementById('content-scroll').clientWidth) };
    })()`);
    check('the pane mounts and draws every obligation',
      pane.mounted && pane.rows === 4, `${pane.rows} rows`);
    check('banded overdue · this month · later · completed, and no empty heading',
      pane.bands.length === 3 && /Overdue/.test(pane.bands[0]),
      pane.bands.join(' | '));
    check('ONE FULL-WIDTH CARD — it takes the room’s own measure',
      pane.box && pane.box.w > 700, `${pane.wide} of ${pane.pageWide}`);
    check('the head says how many are late, and nothing else is coloured',
      /1/.test(pane.overCap || ''), pane.overCap);

    /* "NOBODY OWNS THIS" — the cheapest fix in the whole job, and it must be
       on the row it is true of and on no other. Two obligations name a
       stranger; only the one still open can still be chased. */
    check('"nobody owns this" draws once — on the open orphan, not the closed one',
      pane.unowned === 1, `${pane.unowned} found`);

    /* ============ 3. COMPLETING GOES THROUGH THE ONE VERB ================
       Since J-2.2 the press asks two questions first — the day it was done and
       an optional reference — and the DIALOG presses the verb. Driven through
       rather than short-circuited, because the whole claim is that one press
       on this tab moves the record and every count that follows it. */
    const before = await page.evaluate(id =>
      (getContract(id).obligations.find(o => o.id === 'ob2') || {}).status, built.id);
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#ws-obligations-pane .obt-row')];
      const r = rows.find(x => x.getAttribute('data-obt-row') === 'ob2');
      r.querySelector('[data-obt-toggle]').click();
    });
    await page.waitForTimeout(500);
    const dlg = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const at = document.getElementById('od-at');
      return { on: !!(at && seen(at) && seen(at).on),
        value: at ? at.value : null, max: at ? at.getAttribute('max') : null,
        note: !!document.getElementById('od-note'),
        next: (document.getElementById('od-next') || {}).textContent || '' };
    })()`);
    check('completing asks when it was done, defaulting to today',
      dlg.on === true && dlg.value === dlg.max, JSON.stringify({ v: dlg.value, max: dlg.max }));
    check('…and offers a reference, and nothing else',
      dlg.note === true && dlg.next === '', 'ob2 is a one-off, so no next instance is promised');
    await page.evaluate(() => { document.getElementById('od-note').value = 'REF/2026/118'; });
    await page.click('#od-go');
    await page.waitForTimeout(800);
    const after = await page.evaluate(id => {
      const c = getContract(id);
      const o = c.obligations.find(x => x.id === 'ob2');
      const n = document.querySelector('#ws-tabs [data-ws-tab="oblig"] .room-tab-n');
      const trail = (c.audit || []).filter(a => a.action === 'Obligation').length;
      return { status: o.status, at: o.completedAt || '', by: o.completedBy || '',
        note: o.completedNote || '', count: n ? n.textContent.trim() : 'none',
        rows: document.querySelectorAll('#ws-obligations-pane .obt-row').length,
        done: [...document.querySelectorAll('#ws-obligations-pane .obt-band')]
          .some(b => /Completed|Avklarade/.test(b.textContent)), trail };
    }, built.id);
    check('a press on the new tab completes it on the RECORD',
      before === 'open' && after.status === 'done', `${before} → ${after.status}`);
    check('…carrying the day it was done, who closed it, and the reference',
      !!after.at && !!after.by && after.note === 'REF/2026/118',
      JSON.stringify({ at: after.at, by: after.by, note: after.note }));
    check('…through the one verb, so the audit trail carries it',
      after.trail > 0, `${after.trail} obligation entries`);
    check('…and the tab’s own count follows without a reload',
      after.count === '2', after.count);
    check('…and the row moves into Completed', after.done === true, String(after.done));

    /* ============ 4. THE BELL ============================================ */
    const bell = await page.evaluate(`(() => {
      const rows = buildAlerts().filter(a => a.kind === 'obligation');
      return { n: rows.length, texts: rows.map(r => r.text),
        ids: rows.map(r => r.id) };
    })()`);
    /* ob1 is overdue and mine; ob2 was just completed; ob3 is 400 days out and
       is not mine; ob4 is done. So exactly one row, and it is the overdue one. */
    check('the bell carries the reader’s OWN obligation, inside the window only',
      bell.n === 1 && /Overdue/.test(bell.texts[0] || ''), JSON.stringify(bell.texts));
    check('and the row names the contract it is on',
      bell.ids[0] === built.id, `${bell.ids[0]} vs ${built.id}`);

    /* IT OPENS THE CONTRACT ON THE TAB IT IS ABOUT — where the reader ends up
       is the whole of question six, and a row that opens the wrong page is a
       door that lies. */
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(700);
    await page.evaluate(() => { const a = buildAlerts().find(x => x.kind === 'obligation'); a.go(); });
    await page.waitForTimeout(1400);
    const landed = await page.evaluate(`(() => {
      const on = document.querySelector('#ws-tabs .room-tab.on');
      return { view: state.view, id: state.activeId,
        tab: on ? on.getAttribute('data-ws-tab') : null,
        pane: !!document.querySelector('#ws-obligations-pane .obt-row') };
    })()`);
    check('pressing it lands on that contract’s Obligations tab',
      landed.id === built.id && landed.tab === 'oblig' && landed.pane === true,
      JSON.stringify(landed));

    /* ============ 5. A CONTRACT WITH NONE ================================ */
    if (built.bare){
      await page.evaluate(id => window.openWorkspace(id), built.bare);
      await page.waitForTimeout(1000);
      await page.click('#ws-tabs [data-ws-tab="oblig"]');
      await page.waitForTimeout(600);
      const none = await page.evaluate(`(() => {
        const host = document.getElementById('ws-obligations-pane');
        return { count: !!document.querySelector('#ws-tabs [data-ws-tab="oblig"] .room-tab-n'),
          empty: !!host.querySelector('.obt-empty'),
          bands: host.querySelectorAll('.obt-band').length,
          text: (host.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 60) };
      })()`);
      check('a contract with none draws the tab, an empty state, and NO count',
        none.count === false && none.empty === true && none.bands === 0, JSON.stringify(none));
      /* "0 outstanding" over a sentence already saying nothing is tracked is
         the same fact twice, and the second printing reads like a fault. */
      check('…and does not also say "0 outstanding" above it',
        !/0 outstanding/.test(none.text), none.text);
      await page.screenshot({ path: path.join(OUT, '02-no-obligations.png') });
    }

    /* ============ 6. THE FIVE FIT, AT A LAPTOP WIDTH, IN BOTH LANGUAGES ==
       The tab row gaining a tab is the one way this job could cost the
       contract its pixels, and Swedish is the longer language. */
    await page.evaluate(id => window.openWorkspace(id), built.id);
    await page.waitForTimeout(900);
    for (const [lang, w] of [['en', 1280], ['sv', 1280], ['sv', 1500]]){
      await page.setViewportSize({ width: w, height: 900 });
      await page.evaluate(l => langSet(l, { repaint: true }), lang);
      await page.waitForTimeout(900);
      const fit = await page.evaluate(`(() => {
        const tabs = [...document.querySelectorAll('#ws-tabs [data-ws-tab]')];
        const rowEl = document.getElementById('ws-tabs');
        return { tops: tabs.map(b => Math.round(b.getBoundingClientRect().top)),
          words: tabs.map(b => (b.textContent || '').replace(/\\s+/g,' ').trim()),
          scrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          headH: Math.round(document.getElementById('ws-head').getBoundingClientRect().height),
          rowH: Math.round(rowEl.getBoundingClientRect().height) };
      })()`);
      check(`the five tabs stay on one line at ${w}px in ${lang}`,
        new Set(fit.tops).size === 1, fit.words.join(' | '));
      check(`and the page does not scroll sideways at ${w}px in ${lang}`,
        fit.scrollsSideways === false, String(fit.scrollsSideways));
      if (lang === 'sv' && w === 1280)
        await page.screenshot({ path: path.join(OUT, '03-sv-1280.png') });
    }
    await page.evaluate(() => langSet('en', { repaint: true }));
    await page.waitForTimeout(600);

    /* ============ 7. A REPEATING DUTY OPENS THE NEXT ONE (J-2.2) ==========
       ob1 is quarterly and overdue. Completing it must open exactly one more,
       and the dialog must NAME it before the press — a product that opens a
       new instance in somebody's book silently is one that surprises them. */
    await page.click('#ws-tabs [data-ws-tab="oblig"]');
    await page.waitForTimeout(600);
    const wasN = await page.evaluate(id => getContract(id).obligations.length, built.id);
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#ws-obligations-pane .obt-row')];
      const r = rows.find(x => x.getAttribute('data-obt-row') === 'ob1');
      r.querySelector('[data-obt-toggle]').click();
    });
    await page.waitForTimeout(500);
    const promised = await page.evaluate(() =>
      (document.getElementById('od-next') || {}).textContent || '');
    check('the dialog NAMES the next instance and its date before the press',
      /\d{4}-\d{2}-\d{2}/.test(promised), promised.trim() || 'nothing promised');
    await page.click('#od-go');
    await page.waitForTimeout(900);
    const series = await page.evaluate(id => {
      const c = getContract(id);
      const first = c.obligations.find(o => o.id === 'ob1');
      const next = c.obligations.filter(o => o.seriesId === 'ob1' && o.id !== 'ob1');
      return { n: c.obligations.length, done: first.status,
        made: next.length, id: next[0] ? next[0].id : '', due: next[0] ? next[0].due : '',
        who: next[0] ? next[0].assignee : '', fresh: next[0] ? next[0].id !== 'ob1' : false,
        rows: document.querySelectorAll('#ws-obligations-pane .obt-row').length };
    }, built.id);
    check('completing it opens EXACTLY ONE next instance, with its own id',
      series.n === wasN + 1 && series.made === 1 && series.fresh === true, JSON.stringify(series));
    check('…the date the dialog promised, and the same person still owes it',
      promised.includes(series.due) && !!series.who, `${series.due} · ${series.who}`);
    check('…and the tab draws it without a reload',
      series.rows === wasN + 1, `${series.rows} rows`);
    await page.screenshot({ path: path.join(OUT, '04-series.png') });

    /* ============ 8. THE WORKLIST (J-2.3) ===============================
       The tab answers "what does THIS contract commit us to"; this answers the
       question underneath it — what is waiting on somebody now, across
       everything. Driven from the sidebar door, because a door that does not
       open is indistinguishable in the markup from one that does. */
    await page.evaluate(() => { const c = state.contracts.find(x => x.id !== state.activeId);
      if (c){ c.counterpartyEmail = 'ops@nordkust.test';
        c.obligations = [{ id: 'x1', desc: 'Deliver the audited accounts',
          due: '2026-01-01', status: 'open', party: 'theirs' }]; persist(c); } });
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
    await page.waitForTimeout(1400);
    const back = await page.evaluate(`(() => {
      const on = document.querySelector('#ws-tabs .room-tab.on');
      return { id: state.activeId, tab: on ? on.getAttribute('data-ws-tab') : null };
    })()`);
    check('pressing a row opens that contract on its Obligations tab',
      back.id === want && back.tab === 'oblig', JSON.stringify(back));

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
