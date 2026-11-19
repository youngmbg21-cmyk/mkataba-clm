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
    await until(() => !!document.querySelector('#cal-wk-more'), null, 10000);
    await page.waitForTimeout(500);
    const C = await page.evaluate(lateDay => {
      const chips = [...document.querySelectorAll('#cal-week .cal-chip')].map(c => ({ t: c.textContent.trim(), k: (c.className.match(/is-ck-(\w+)/) || [])[1] || '' }));
      /* LATE WORK STANDS ON TODAY (on a weekend, this week's Monday): the
         column under the head marked today, else the first — reading only
         the first made this check red Tuesday to Friday */
      const heads = [...document.querySelectorAll('.cal-wk-h')];
      /* …AND ONLY WHEN ITS OWN DAY IS NOT IN THIS WEEK (calWeekHtml's own
         rule): a late day inside the week stands on that day. The fixture's
         late day is three days back, so on a Wednesday to Friday it falls in
         the week — reading only today made this check red those days (CI,
         Thursday 22 Oct 2026, on main too) */
      const days = Array.from({ length: heads.length }, (_, i) => { const d = new Date(calWeekStart()); d.setDate(d.getDate() + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
      const own = days.indexOf(lateDay), at = own >= 0 ? own : heads.findIndex(x => x.classList.contains('is-today'));
      const first = document.querySelectorAll('.cal-wk-alls .cal-wk-all')[at > 0 ? at : 0];
      return { facts: (document.getElementById('cal-head-sub') || {}).textContent || '', more: !!document.querySelector('.cal-head #cal-more'),
        title: (document.getElementById('cal-title') || {}).textContent || '', key: [...document.querySelectorAll('.cal-key span')].map(s => s.textContent.trim()),
        firstDay: first ? [...first.querySelectorAll('.cal-chip')].map(c => c.textContent.trim()) : [], chips,
        labels: [...document.querySelectorAll('#cal-wk-more .cal-wkm-lab span')].map(s => s.textContent.trim()),
        hours: [...document.querySelectorAll('.cal-wk-t')].map(t => t.textContent.trim()).slice(0, 3),
        panel: (document.querySelector('#cal-plan .jl-word') || {}).textContent || '', bub: ((document.querySelector('#cal-plan .jl-bub, #cal-plan .jov-head') || {}).textContent || '').trim(),
        lv: document.querySelectorAll('#cal-plan [data-cal-lv]').length,
        five: (() => { const j = document.querySelector('#cal-plan .jov5'); return j ? { eb: (j.querySelector('.jov5-eb') || {}).textContent || '', t: (j.querySelector('.jov5-title') || {}).textContent || '',
          sub: (j.querySelector('.jov5-sub') || {}).textContent || '' } : null; })() };
    }, D.b3);
    check('4a the head: the six weeks, the ⋯ in it; the card: "This week, then five more" and the key as drawn',
      /· six weeks$/.test(C.facts) && C.more && C.title === 'This week, then five more' && JSON.stringify(C.key) === JSON.stringify(['Ours', 'Theirs', 'Contract date', 'Mine', 'Jambo’s plan']), C);
    check('4b late work stands on today (a weekend: this week\'s first day), or on its own day where that is this week; their chips carry their name first; a decision in its week',
      C.firstDay.some(t => /^Late: Check the September invoice/.test(t)) && C.chips.some(c => c.k === 'theirs' && /^Nandi: /.test(c.t)) && C.chips.some(c => c.k === 'decide' && /^Decide: Office Lease/.test(c.t)), { firstDay: C.firstDay, chips: C.chips.slice(0, 8) });
    check('4c a later week says "N due"; the hours read "09"', C.labels.some(l => /^\d+ due$/.test(l)) && C.hours.every(h => /^\d\d$/.test(h)), { labels: C.labels, hours: C.hours });
    /* RE-PINNED (owner, 24 Oct 2026, ONE WINDOW): the panel draws no "Your week" word beside tabs; his words are the same */
    /* RE-POINTED 17 Nov 2026 (#762): the Calendar's panel is Jambo's Five panel (round 3b, "Build as drawn"): "The next
       seven days", the headline counting this week's things, the late duty said under it — counted from the same list
       (this stage: our one late duty and the two due from the other side today, at least three things), still under its
       Overview, the calendar setting's three buttons in it */
    check('4d Jambo\'s panel beside the Calendar says the week, counted from the list, under its Overview', C.panel === '' && !!C.five
      && /^The next seven days$/.test(C.five.eb) && (m => !!m && Number(m[1]) >= 3)(/^(\d+) things? this week\.$/.exec(C.five.t)) && /^1 duty is late\.$/.test(C.five.sub) && C.lv === 3,
      { panel: C.panel, five: C.five, lv: C.lv });
    /* ASK FOR THE STATE (22 Oct 2026): the week may be drawn again after it first shows, which took a
       held handle off the page ("Element is not attached to the DOM"); a locator finds the hour afresh
       at each act, and the hover is tried again (bounded) if a repaint came between it and the read */
    const slot = page.locator('#cal-wk-body .cal-wk-col:nth-of-type(3) .cal-wk-slot:nth-child(4)');
    let hint = '';
    for (let i = 0; i < 3 && !/\+ Add your own/.test(hint) && await slot.count(); i++){
      await slot.hover({ timeout: 3000 }).catch(() => {});
      hint = await slot.evaluate(s => getComputedStyle(s, '::after').content, null, { timeout: 3000 }).catch(() => '');
    }
    check('4e an empty hour says "+ Add your own" under the hand', /\+ Add your own/.test(hint), hint);
    if (OUT) await page.screenshot({ path: path.join(OUT, '16-calendar-1440x780.png') });

    /* ---- 6 the checks' differences, built (lane A4's second pass, 19 Oct 2026) ---- */
    await page.evaluate(async D => { const A1 = getContract('MK-A1');
      A1.obligations.push({ id: 'o9', desc: 'Pay the second instalment', due: D.a13, party: 'us', assignee: currentUser().email, recurring: 'none', status: 'open', after: 'o3' });
      persist(A1); }, D);
    await page.waitForTimeout(400);
    const wt = await until(() => { if (!calOnScreen()) return null;
      const c = [...document.querySelectorAll('#cal-stage .cal-chip')].find(x => /Pay the second instalment/.test(x.textContent));
      return c ? { t: c.textContent.trim(), k: (c.className.match(/is-ck-(\w+)/) || [])[1] || '' } : null; }, null, 8000);
    check('6a the Calendar draws a step held back by an earlier one as "Waiting: …", never due or late', !!wt && wt.k === 'wait' && /^Waiting: /.test(wt.t), wt);
    const decChip = await page.$('#cal-stage .cal-chip.is-ck-decide');
    if (decChip) await decChip.click();
    const decC = await until(() => { const h = document.querySelector('#renewal-host'); return h && state.view === 'dashboard' && (h.classList.contains('is-landed') || h.classList.contains('is-landed-held')) ? true : null; }, null, 12000);
    check('6b the Calendar\'s Decide chip lands on the renewal card, lit (the list\'s own door)', !!decC);
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
      await until(() => !!document.querySelector('#cal-wk-more'));
      await page.waitForTimeout(400);
      const fitC = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, side = document.documentElement.scrollWidth <= vw + 1;
        const stage = document.getElementById('cal-stage').getBoundingClientRect();
        const rows = [...document.querySelectorAll('#cal-wk-more .cal-wkm-row')];
        /* THE FIVE WEEKS GIVE WAY (the owner's 21 Oct ruling, the check re-pointed 26 Oct 2026): every row stands
           in view, or, where a busy week leaves too little room (a laptop's 730px on a Monday with three things
           due), the five weeks scroll inside their own band — its top in view, its foot in the window, every row
           reachable inside it, none squeezed under 38px. Not a day's luck either way: the old "every row in view"
           went red on busy days only. */
        const band = document.querySelector('#cal-wk-more .cal-wkm') || document.querySelector('.cal-wkm');
        const bandR = band ? band.getBoundingClientRect() : null, H = window.innerHeight;
        const inView = rows.every(r => r.getBoundingClientRect().bottom <= H + 1);
        const scrolls = !!band && /auto|scroll/.test(getComputedStyle(band).overflowY) && band.scrollHeight > band.clientHeight
          && bandR.bottom <= H + 1 && bandR.top + 38 <= H
          /* measured from the band's INSIDE (below its 1px top line, band.clientTop): from its outer edge every
             Monday came out 1px short and the scrolling branch could never pass (fixed 16 Nov 2026) */
          && rows.every(r => r.getBoundingClientRect().bottom - (bandR.top + band.clientTop) + band.scrollTop <= band.scrollHeight + 1);
        const whole = rows.length === 5 && rows.every(r => r.getBoundingClientRect().height >= 37) && (inView || scrolls);
        const head = [...document.querySelectorAll('.cal-head-r > *')].every(b => b.getBoundingClientRect().right <= stage.right + 1);
        const key = document.querySelector('.cal-key').getBoundingClientRect();
        const box = document.querySelector('#cal-plan-in').getBoundingClientRect();
        return { side, whole, head, key: key.right <= stage.right + 1, box: box.bottom <= window.innerHeight && box.top > 0 };
      });
      check(`5 ${w}×${ht}: the Calendar whole — six weeks in view or the five later weeks scrolling inside their own band, the head and the key not cut, Jambo's box in view, nothing sideways`,
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
