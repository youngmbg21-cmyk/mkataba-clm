/* OBLIGATIONS AND THE CALENDAR AS ROUND 16 DRAWS THEM ("Week by week";
   the owner's "build all the gaps", 18 Oct 2026; lane A4 — js/obligations.js
   obwWeekRowHtml/obYourWeekSay, js/views/calendar.js calChipLook/calKeyHtml/
   calLevelSegHtml)

   WHAT THIS PINS, driven in a real browser, as the reader sees it
     1 Obligations: the head says "N outstanding · 1 overdue" with Open every
       week, Filter and + Add an obligation; each week a card of its own with
       what it holds ("work somebody could do now", "both theirs", "a renewal
       decision", a folded week's "Private" and "we pay …", "nobody owns it
       yet"); Late's row has Mark done, theirs Chase / Chase again with
       "chased …", a renewal decision Decide; Jambo's finds a row with Review
     2 nothing is chosen: Jambo's panel says "Your week" counted from the list,
       his offer, the planner's two asks as chips, and "Jambo may change my
       calendar" — Never is kept on the server and changes his offer
     3 every act ends in its door: Chase asks first; Review opens the review
       desk; Decide lands on the renewal card, lit; a row press says
       "Obligation" and ‹ Jambo goes back; + Add an obligation asks which
       contract and opens that contract's own form; the chip opens the Calendar
     4 the Calendar: its head (six weeks, the ⋯), the key as drawn, "This week,
       then five more", late work on this week's first day, their chip with
       their name, the decision in its week, "3 due", the hours "09", "+ Add
       your own" on an empty hour, Jambo's panel "Your week"
     5 the owner's three screens: both pages whole, nothing sideways, nothing
       under the panel, the head's acts and the panel's box in view
   Every date is built from today; a wait asks for the state, bounded.
   Run: node test/chromium/week-as-drawn-verify.js */
/* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): nothing chosen, his words are the Overview's (.jov-head, .jov-v, .jov-src) and his chips its offers (.jov-lnk.is-ask) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
  if (!pass) failures++;
};
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* the Monday "this week" names: today's, the next one on a weekend */
const weekOf = () => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const mon = new Date(t); if (t.getDay() === 6) mon.setDate(t.getDate() + 2); else if (t.getDay() === 0) mon.setDate(t.getDate() + 1); else mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const at = (w, d) => { const x = new Date(mon); x.setDate(x.getDate() + 7 * w + d); return iso(x); };
  const back = n => { const x = new Date(t); x.setDate(t.getDate() - n); return iso(x); };
  return { at, back, today: iso(t) };
};

(async () => {
  const W = weekOf();
  /* a lease whose notice deadline is next Monday, and an employment agreement in a private stream */
  const exp = new Date(W.at(1, 0) + 'T00:00:00'); exp.setDate(exp.getDate() + 90);
  const lease = H.fixtureContract('MK-C1', 'Office Lease', 'Kvarnholmen Fastigheter', 'dist', 12000000, 'Signed');
  lease.metadata = { value: 12000000, currency: 'KES', expiryDate: iso(exp), noticePeriodDays: 90, renewalType: 'auto-renew' };
  lease.expiry = iso(exp);
  const emp = H.fixtureContract('MK-C2', 'Employment Agreement', 'Wanjiru Kamau', 'corp', 2400000, 'Signed');
  /* a scripted Jambo: the planner's ask gets a plan of two blocks on this
     week's working days still ahead (any other route gets the stub answer) */
  const ai = await H.startScriptedAi();
  const ahead = [0, 1, 2, 3, 4].map(d => W.at(0, d)).filter(d => d >= W.today).slice(0, 2);
  const planTurn = body => {
    const names = (body.tools || []).map(t => t.name);
    if (!names.includes('answer')) return null;
    if (!names.includes('propose_blocks')) return [{ type: 'tool_use', id: 'tu_ans', name: 'answer', input: { say: 'Tuesday morning is free; nothing is added.' } }];
    return [{ type: 'tool_use', id: 'tu_plan', name: 'propose_blocks', input: { say: 'Two hours around your own events: chase the certificate, then the late invoice.',
      blocks: ahead.map((d, i) => ({ date: d, start: i ? '14:00' : '10:00', end: i ? '15:00' : '11:00', title: i ? 'Check the September invoice' : 'Chase the insurance certificate', why: 'Free and before it is due.', contractId: i ? 'MK-A1' : 'MK-A2' })) } }];
  };
  ai.script(...Array(40).fill(planTurn));
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off', ANTHROPIC_BASE_URL: ai.base });
  const S = await H.seedWorkspace(h, { contracts: H.FIXTURES.concat([lease, emp]), approvalRules: [] });
  const boot = await S.admin.json('/api/bootstrap');
  const me = boot.user || (boot.users || []).find(u => u.email === 'admin@example.co.ke') || {};
  await S.admin.json('/api/private-streams/corp', { method: 'PUT', body: { on: true, ids: [String(me.id)] } }).catch(() => {});
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-C1'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* the stage's dates, built here from today and handed in as plain strings */
    const D = { today: W.today, b3: W.back(3), b7: W.back(7), a13: W.at(1, 3), a11: W.at(1, 1), a20: W.at(2, 0), a22: W.at(2, 2), a92: W.at(9, 2) };
    await page.evaluate(async D => {
      const me = currentUser(), other = getUsers().find(u => u.email === 'everything@example.co.ke') || me;
      for (const id of ['MK-A1', 'MK-A2', 'MK-B2', 'MK-C1', 'MK-C2']) { const c = getContract(id); if (c && c._light) await ensureFull(c); }
      const A1 = getContract('MK-A1'), A2 = getContract('MK-A2'), B2 = getContract('MK-B2'), C1 = getContract('MK-C1'), C2 = getContract('MK-C2');
      A1.obligations = [
        { id: 'o1', desc: 'Check the September invoice against the price list', due: D.b3, party: 'us', assignee: me.email, recurring: 'monthly', status: 'open' },
        { id: 'o2', desc: 'Quarterly volume report', due: D.a13, party: 'us', assignee: other.email, recurring: 'none', status: 'open' },
        { id: 'o3', desc: 'Pay the storage fee', due: D.a20, party: 'us', assignee: me.email, recurring: 'none', status: 'open', amount: 258000 } ];
      A2.obligations = [
        { id: 'o4', desc: 'Send a current insurance certificate', due: D.today, party: 'theirs', recurring: 'none', status: 'open' },
        { id: 'o5', desc: 'Minimum volume evidence', due: D.today, party: 'theirs', recurring: 'none', status: 'open', chasedAt: D.b7, chasedBy: me.name },
        { id: 'o6', desc: 'Monthly storage statement', due: D.a11, party: 'theirs', recurring: 'none', status: 'open' },
        { id: 'o7', desc: 'Rebate reconciliation', due: D.a92, party: 'us', assignee: '', recurring: 'none', status: 'open' } ];
      C2.obligations = [{ id: 'o8', desc: 'Probation review', due: D.a22, party: 'us', assignee: me.email, recurring: 'none', status: 'open' }];
      C1.owner = { id: me.id, name: me.name };
      B2.triage = Object.assign({}, B2.triage || {}, { at: new Date().toISOString(), steps: Object.assign({}, (B2.triage || {}).steps, { oblig: { ok: true, found: [
        { desc: 'Deliver monthly sales figures', quote: 'shall deliver monthly sales figures', due: '', recurring: 'monthly', party: 'theirs' },
        { desc: 'Keep product liability insurance', quote: 'shall maintain product liability insurance', due: '', recurring: 'none', party: 'theirs' },
        { desc: 'Pay listing fees within 30 days', quote: 'shall pay listing fees within thirty days', due: '', recurring: 'none', party: 'us' } ] } }) });
      [A1, A2, B2, C1, C2].forEach(c => persist(c));
    }, D);
    await page.waitForTimeout(600);

    /* RETIRED 17 Nov 2026 (#762): sections 1–3 — round 16's Obligations page "week by week" (the head "N outstanding ·
       1 overdue" with Open every week, a card per week saying what it holds, each row's one act on the week list, Jambo's
       finds on this week's line, his "Your week" Overview on that page with the planner's chips and the calendar setting,
       and the acts and doors pressed from those week rows and chips). The new look's Obligations is the PROJECT LIST
       (MAP OBLIGATIONS: pills Late · Tracked · Proposals, obnRender, its own Five panel) — no week cards, no week rows,
       no "Your week" on that page; week-by-week-verify retired its week sections alike. The Calendar half of this file
       (sections 4, 6a, 6b and the three screens) runs on as before, the Calendar opened on its week */
    void D;
    await page.evaluate(() => (setView('calendar'), calSetView('week')));

    /* ---- 4 the Calendar as drawn ---- */
    /* RE-POINTED 23 Nov 2026 (P-14, the Calendar the Legora + Stripe way, owner: "Build P-14"): the Week is no longer six
       weeks of hour columns with a key under them. It is ONE head (Calendar · Agenda | Month | Week | Horizon · + New
       event · ⋯), the ask box, chips, then THIS week as one calm table — a row per date, the paper's words and the party
       under its title, a soft badge for its kind (Late red, We owe amber, They owe steel, Decide violet), its act in the
       row — and the coming five weeks folded into ONE line ("Then · range · N dates", the first of them, Show them).
       The panel beside it follows the chosen row: the row's own badge and title, "The next seven days", and the plan
       with the calendar setting's three buttons. The same rules are asked of the new drawing: late work said Late, their
       duty named by its party, the decision in the weeks ahead, the coming weeks counted, the panel read from the list. */
    const weekReady = () => !!document.querySelector('#hb-cal .cal-page.is-ls[data-cal-ls="week"] .cls-then-h');
    await until(weekReady, null, 10000);
    await page.waitForTimeout(500);
    const C = await page.evaluate(() => {
      const pg = document.querySelector('#hb-cal .cal-page.is-ls[data-cal-ls="week"]'); if (!pg) return { rows: [] };
      const txt = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
      const rows = [...pg.querySelectorAll('#cal-ls-body tr.cls-r')].map(r => ({ t: txt(r.querySelector('.cls-what .cls-t')), what: txt(r.querySelector('.cls-what')),
        k: ((r.querySelector('.cls-k .cls-b') || {}).className || '').replace(/^.*\bis-(\w+).*$/, '$1'), chosen: r.classList.contains('is-chosen') }));
      const side = document.querySelector('#cal-plan .cal-ls-side');
      return { on: txt(pg.querySelector('.cls-head .cls-seg a.on')), more: !!pg.querySelector('.cls-head #cal-more'), add: txt(pg.querySelector('.cls-head #cal-new')),
        then: txt(pg.querySelector('.cls-then-h')), thenS: txt(pg.querySelector('.cls-then-s')), show: !!pg.querySelector('.cls-then-s [data-cal-view="agenda"]'),
        rows, side: { title: txt(side && side.querySelector('.cls-pt')), heads: side ? [...side.querySelectorAll('h4')].map(txt) : [] },
        lv: document.querySelectorAll('#cal-plan [data-cal-lv]').length };
    });
    check('4a the head: Week lit in the one switch, + New event and the ⋯ in it; the coming weeks one line, "Then · …" with their count',
      C.on === 'Week' && C.more && /New event/.test(C.add || '') && /^Then · .+ · \d+ dates?$/.test(C.then || ''), { on: C.on, more: C.more, add: C.add, then: C.then });
    const late = C.rows.find(r => /^Check the September invoice/.test(r.t)), theirs = C.rows.find(r => /^Send a current insurance certificate/.test(r.t));
    check('4b late work stands first in this week\'s table, said Late (red); their duty says They owe (steel) and names its party; the decision waits in the weeks ahead',
      !!late && late.k === 'ruby' && C.rows[0] === late && !!theirs && theirs.k === 'steel' && /Nandi/.test(theirs.what) && /Decide: renew Office Lease\?/.test(C.thenS || ''),
      { rows: C.rows.slice(0, 6).map(r => `${r.k}:${r.t}`), thenS: C.thenS });
    check('4c the coming weeks are counted — at least the decision and our later duties — with Show them to the Agenda', (m => !!m && Number(m[1]) >= 3)(/· (\d+) dates?$/.exec(C.then || '')) && C.show,
      { then: C.then, show: C.show });
    check('4d Jambo\'s panel beside the Calendar says the chosen row of the list, the next seven days, and the calendar setting\'s three buttons',
      !!late && late.chosen && C.side.title === late.t && C.side.heads.includes('The next seven days') && C.lv === 3, { side: C.side, lv: C.lv });
    check('4e a person adds their own from the head\'s + New event, in sight', /New event/.test(C.add || ''), C.add);
    if (OUT) await page.screenshot({ path: path.join(OUT, '16-calendar-1440x780.png') });

    /* ---- 6 the checks' differences, built (lane A4's second pass, 19 Oct 2026) ---- */
    await page.evaluate(async D => { const A1 = getContract('MK-A1');
      A1.obligations.push({ id: 'o9', desc: 'Pay the second instalment', due: D.a13, party: 'us', assignee: currentUser().email, recurring: 'none', status: 'open', after: 'o3' });
      persist(A1); }, D);
    await page.waitForTimeout(400);
    /* RE-POINTED 23 Nov 2026 (P-14): the step lies in the weeks ahead, so it is read on the Agenda's table (the Week's
       "Show them"): a step held back by an earlier one is never said Late and offers no Mark done — it is not owed yet */
    await page.evaluate(() => calSetView('agenda'));
    const wt = await until(() => { if (!calOnScreen()) return null;
      const r = [...document.querySelectorAll('#hb-cal .cal-page.is-ls[data-cal-ls="agenda"] tr.cls-r')].find(x => /Pay the second instalment/.test(x.textContent));
      return r ? { t: (r.querySelector('.cls-what .cls-t') || {}).textContent || '', k: ((r.querySelector('.cls-k .cls-b') || {}).className || ''),
        late: !!r.querySelector('.cls-w.is-late'), done: !!r.querySelector('[data-cal-done]') } : null; }, null, 8000);
    check('6a the Calendar draws a step held back by an earlier one never late, never to be marked done', !!wt && !/is-ruby/.test(wt.k) && !wt.late && !wt.done, wt);
    const decChip = page.locator('#hb-cal .cal-page.is-ls [data-cal-act="decide"][data-cal-ct="MK-C1"]').first();
    if (await decChip.count()) await decChip.click();
    const decC = await until(() => { const h = document.querySelector('#renewal-host'); return h && state.view === 'dashboard' && (h.classList.contains('is-landed') || h.classList.contains('is-landed-held')) ? true : null; }, null, 12000);
    check('6b the Calendar\'s Decide lands on the renewal card, lit (the list\'s own door)', !!decC);
    /* RETIRED 17 Nov 2026 (#762): 6c (Outstanding / Waiting on a step — the week page's views), 6d (Late's "3 days late"
       on the week row) and 6e (a folded week opened and kept over a refresh) — round 16's week page, gone with sections
       1–3 above; the project list's own pills and rows are pinned by the obligations checks of the new look */

    /* ---- 5 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      /* RE-POINTED 17 Nov 2026 (#762): Obligations is the project list — its rows (tr.obn-r) stand where the week cards did */
      await page.evaluate(() => setView('obligations'));
      /* RE-POINTED 19 Nov 2026 (We owe · They owe): its lines (.obt-li) stand in two columns */
      await until(() => document.querySelectorAll('.obt-li').length >= 1 && !!document.querySelector('#ins-panel #jl-q'));
      await page.waitForTimeout(400);
      const fitO = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, side = document.documentElement.scrollWidth <= vw + 1;
        const panel = document.getElementById('ins-panel').getBoundingClientRect();
        const cards = [...document.querySelectorAll('.obt-li')].map(c => c.getBoundingClientRect());
        const under = cards.some(r => r.right > panel.left + 1);
        const acts = [...document.querySelectorAll('#page-head-acts button')].every(b => { const r = b.getBoundingClientRect(); return r.right <= panel.left + 1 && r.width > 0; });
        const box = document.querySelector('#ins-panel #jl-q').getBoundingClientRect();
        return { side, under, acts, box: box.bottom <= window.innerHeight && box.top > 0 };
      });
      check(`5 ${w}×${ht}: Obligations whole — nothing sideways, no card under the panel, the head's acts and Jambo's box in view`,
        fitO.side && !fitO.under && fitO.acts && fitO.box, fitO);
      /* RETIRED 17 Nov 2026 (#762): "every act in the week list is one width" — the week list's acts ([data-obw-act]) went
         with round 16's week page */
      if (OUT) await page.screenshot({ path: path.join(OUT, `16-obligations-${w}x${ht}.png`) });
      await page.evaluate(() => (setView('calendar'), calSetView('week')));
      /* RE-POINTED 23 Nov 2026 (P-14): the Week is one table that scrolls inside its own body (.cls-body), the coming
         weeks one line under it; whole means: the page's head and chips end inside the page, the table and the line
         inside it too (nothing under the panel), the body scrolls rather than the page, Jambo's box in view */
      await until(weekReady);
      await page.waitForTimeout(400);
      const fitC = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, side = document.documentElement.scrollWidth <= vw + 1;
        const pg = document.querySelector('#hb-cal .cal-page.is-ls'), stage = pg.getBoundingClientRect();
        const inside = el => !el || el.getBoundingClientRect().right <= stage.right + 1;
        const body = document.getElementById('cal-ls-body'), bodyR = body.getBoundingClientRect();
        const whole = inside(pg.querySelector('.cls-t')) && inside(pg.querySelector('.cls-then')) && /auto|scroll/.test(getComputedStyle(body).overflowY)
          && bodyR.bottom <= window.innerHeight + 1 && bodyR.height >= 38;
        const head = [...pg.querySelectorAll('.cls-head > *, .cls-chips > *')].every(b => b.getBoundingClientRect().right <= stage.right + 1);
        const ask = inside(pg.querySelector('.cls-ask'));
        const box = document.querySelector('#cal-plan-in').getBoundingClientRect();
        return { side, whole, head, key: ask, box: box.bottom <= window.innerHeight && box.top > 0 };
      });
      check(`5 ${w}×${ht}: the Calendar whole — this week's table scrolling inside its own body, the coming weeks' line, the head, the chips and the ask box not cut, Jambo's box in view, nothing sideways`,
        fitC.side && fitC.whole && fitC.head && fitC.key && fitC.box, fitC);
      if (OUT) await page.screenshot({ path: path.join(OUT, `16-calendar-${w}x${ht}.png`) });
    }
  } catch (e) {
    check('the stage ran to the end', false, e.message.split('\n')[0]);
  } finally {
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop(); await ai.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
