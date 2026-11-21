/* REQUESTS AND MY NOTES, AS DRAWN (round 20 of the redesign, owner picked
   "The SAP way" by name, 17 Oct 2026; every drawn part built on the owner's
   yes of 18 Oct 2026; js/views/intake.js, js/views/mynotes.js)

   WHAT THIS PINS, driven in a real browser through the real routes (four
   requests from three colleagues, one sent to the reader by the NDA lane with
   a file; five private notes)
     1 Requests' band: the tabs and, beside them on ONE row, Request · Stream ·
       With, each label before its box; the head "4 open · what colleagues ask
       Legal for · advice too"; the Open list oldest waiting first, its card
       ending after the rows with "4 of 4 open" under them. RE-POINTED 21 Oct
       2026 (Part 8, the Legora way): Requests' band is the list head — the
       box, the tabs, + Filter (Stream, With) — the Open tab's hover says
       "oldest waiting first", the foot "1–4 of 4"; 5 is a finger on + Filter;
       7 asks the head's rows stacked and uncut
     2 the request in Jambo's panel: Routine and "With you · by the NDA lane",
       Start the draft · Promise a day · Hand back on one line (⋯ at the pills'
       end), her words quoted, the rows, "Attachments 1 of 3", Jambo naming the
       paper that fits
     3 Start the draft opens the New agreement form with THAT paper chosen and
       lit — no model route asked
     4 the counterparty's name lands on their contracts on the Contracts place
     5 a finger on the Stream box opens HaTi's one list, never the iPad's
     6 My notes: the band, the tabs and boxes, the table, the note in Jambo's
       panel ("Note") with its three verbs on one line, Delete note; ‹ Jambo
       says the ledger; the chip lands on a row
     7 the owner's three screens (1440×780, 1536×730, 1366×950): nothing
       sideways, the band on one row, the panel's verbs whole, no head cut
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/requests-and-notes-as-drawn-verify.js
   Photos: HATI_SHOT_DIR=<dir> */
/* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): nothing chosen, his words are the Overview's (.jov-head, .jov-v, .jov-src) and his chips its offers (.jov-lnk.is-ask) */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
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
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    /* ---- the stage, through the real routes ---- */
    const admin = W.admin;
    const me = (await admin.json('/api/bootstrap')).me;
    const mk = async (name, email) => {
      await admin.json('/api/users', { method: 'POST', body: { name, email, role: 'viewer', password: 'temporary-pass-1' } });
      const c = h.client(email);
      await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
      await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
      return c;
    };
    const wan = await mk('Wanjiru Kamau', 'wanjiru@example.co.ke');
    const ach = await mk('Achieng Odhiambo', 'achieng@example.co.ke');
    const bri = await mk('Brian Ochieng', 'brian@example.co.ke');
    const pdf = n => ({ name: n, mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,' + Buffer.alloc(240000, 1).toString('base64') });
    const ask = async (c, body) => (await c.json('/api/intake', { method: 'POST', body })).request;
    const r1 = await ask(wan, { title: 'Mutual NDA with Naivas Supermarkets', need: 'Naivas want to start a two-month pilot in November and will share their shelf data with us. They asked for a mutual NDA first. Can we use our standard one?', counterparty: 'Naivas Supermarkets', folder: 'sales', files: [pdf('pilot-brief.pdf')] });
    const r2 = await ask(ach, { title: 'Reseller agreement for Uganda', need: 'A reseller in Kampala wants to carry our range; they expect about KES 2,000,000 a year.', folder: 'sales' });
    const r3 = await ask(bri, { title: 'Event venue booking, March kick-off', need: 'The hotel sent their own contract for the venue. Please read it before we sign.', folder: 'proc', files: [pdf('venue-contract.pdf'), pdf('floor-plan.pdf')] });
    const r4 = await ask(bri, { title: 'Transport for the milk routes', need: 'We need a haulage agreement for the three milk routes from Nandi.', counterparty: 'Nandi Dairy', folder: 'proc' });
    await admin.json('/api/intake/' + r1.id, { method: 'PATCH', body: { status: 'open', assignee: me.id, lane: 'NDA' } });
    await admin.json('/api/intake/' + r4.id, { method: 'PATCH', body: { status: 'open', assignee: W.users.unrestricted.id } });
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const ago = d => new Date(Date.now() - d * 86400000).toISOString();
    [[r1, 1], [r4, 3], [r2, 4], [r3, 5]].forEach(([r, d]) => db.prepare('UPDATE intake_requests SET created_at=? WHERE id=?').run(ago(d), r.id));
    db.close();
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const aiCalls = [];
    /* a model is asked by a POST to an /api/ai/ route; reading the usage is not one */
    page.on('request', rq => { if (rq.method() === 'POST' && /\/api\/ai\//.test(rq.url())) aiCalls.push(rq.url()); });
    /* a press on something that may be missing reports instead of timing out */
    const press = async sel => { const el = await page.$(sel); if (!el) return false; await el.click({ timeout: 3000 }).catch(() => {}); return true; };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const today = await page.evaluate(() => todayISO());
    const day = n => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    const note = item => admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item } });
    await note({ title: 'Delivery window moved', body: 'A week.', contractId: 'MK-B1', reviewBy: day(-5), reviewedAt: ago(5) });
    await note({ title: 'Their counsel prefers Ugandan law', body: 'We hold Kenya.', contractId: 'MK-B2' });
    await note({ title: 'Is the Kabras price index right', body: 'Clause 4.', contractId: 'MK-A1', reviewBy: day(3) });
    await note({ title: 'The NDA must cover shelf data', body: 'Shelf data too.', reviewBy: day(1) });
    await note({ title: "Check Nandi Dairy's insurance broker", body: 'Check the broker before we accept a higher cap in clause 7.', contractId: 'MK-A2', reviewBy: day(0) });

    /* ---- 1 · REQUESTS: the page head, the box and the tabs, the list ----
       RE-POINTED 17 Nov 2026 (the new look is the only look, #762; the owner's ruling 3, 17 Nov 2026: Requests is
       drawn as round 6 drew it, approved "Approve round 6"): ONE card (.ikn-page .apn-card) — its head "Requests ·
       4 open · 2 need an editor" with + New request, the bar under it (the box #ikn-q and the tabs Open · Mine · …),
       one table (.ikn-table, rows tr[data-ikn-row]) and the foot "4 requests" under the rows; Jambo's panel
       (#ins-panel) beside it to the same foot.
       RETIRED 17 Nov 2026 (#762, owner's ruling 3): + Filter under the tabs (round 6 draws none), "· advice too" in the
       head (advice lives under its own Advice tab), and 1c "oldest waiting first" (the owner: the oldest-first order
       stays gone) */
    await page.evaluate(() => setView('intake'));
    const listed = await until(() => document.querySelectorAll('.ikn-table [data-ikn-row]').length === 4 ? true : null, null, 10000);
    check('1 the four requests are listed', !!listed);
    const B = await page.evaluate(() => {
      const pg = document.querySelector('.ikn-page');
      const head = pg && pg.querySelector('.cun-head'), bar = pg && pg.querySelector('.apn-bar'), q = document.getElementById('ikn-q');
      const tabs = pg ? [...pg.querySelectorAll('.apn-bar [data-ikn-tab]')] : [];
      const box = el => el && el.getBoundingClientRect();
      const card = pg && pg.querySelector('.apn-card'), foot = pg && pg.querySelector('.apn-foot');
      const rows = [...document.querySelectorAll('.ikn-table [data-ikn-row]')];
      const hb = box(head), bb = box(bar), qb = box(q);
      /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
      /* the ask box (label.apn-ask holding #ikn-q) stands under the title, the tabs are chips on ONE row under it */
      const ask = q && q.closest('label.apn-ask'), ab = box(ask);
      return { stacked: !!(hb && bb && ab && tabs.length) && hb.bottom <= ab.top + 1 && ab.bottom <= bb.top + 1
          && tabs.every(t => t.classList.contains('is-chip') && Math.abs(box(t).top - box(tabs[0]).top) <= 2),
        chips: tabs.map(t => [t.getAttribute('data-ikn-tab'), ((t.querySelector('span') || {}).textContent || '').trim()]),
        needsEditor: [...document.querySelectorAll('.ikn-table [data-ikn-row] .apn-st.is-amber')].filter(b => /^Needs an editor/.test(b.textContent.trim())).length,
        gone: [...document.querySelectorAll('.ik-tabbar, .ik-fb, .ins-cardhead, [data-lh-seat="intake"]')].length,
        title: head ? (head.querySelector('.ctf-h') || {}).textContent : null,
        head: head ? (head.querySelector('.ctf-hf') || {}).textContent || null : null,
        foot: foot ? foot.textContent.trim() : '',
        footIn: !!(foot && card && rows.length && card.contains(foot) && box(foot).top >= box(rows[rows.length - 1]).bottom - 1 && box(foot).bottom <= box(card).bottom + 1),
        panelFoot: (() => { const p = document.getElementById('ins-panel'); return p && card && p.getClientRects().length ? Math.round(box(p).bottom - box(card).bottom) : null; })() };
    });
    /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
    check('1a the page head, then the ask box under the title, then the tabs as chips on one row; no old band, no list head', B.stacked && B.gone === 0, JSON.stringify({ stacked: B.stacked, gone: B.gone }));
    /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
    /* no facts beside the title: the Open chip counts 4, and the two nobody holds wear "Needs an editor" in amber */
    const openChip = (B.chips || []).find(x => x[0] === 'open');
    check('1b the head: "Requests" alone; the Open chip says 4; 2 rows "Needs an editor"', B.title === 'Requests' && !B.head && !!openChip && openChip[1] === '4' && B.needsEditor === 2,
      JSON.stringify({ title: B.title, head: B.head, chips: B.chips, needsEditor: B.needsEditor }));
    /* RETIRED 17 Nov 2026 (#762, owner's ruling, round 3): 1c "oldest waiting first" — the oldest-first order stays gone */
    /* RE-POINTED 29 Oct 2026 (owner: ONE SHEET — the list card reaches the foot of Jambo's panel; REVERSES "the card ends after its rows")
       RE-POINTED 17 Nov 2026 (#762): the head is inside the card now, so the card meets no separate head; the foot says "4 requests" */
    check('1d one sheet: "4 requests" inside the card under the rows, the card reaching the foot of Jambo\'s panel',
      B.foot === '4 requests' && B.footIn && B.panelFoot != null && Math.abs(B.panelFoot) <= 2,
      JSON.stringify({ foot: B.foot, footIn: B.footIn, panelFoot: B.panelFoot }));

    /* ---- 2 · the request in Jambo's panel ----
       RE-POINTED 17 Nov 2026 (#762; ruling 3, round 6 as drawn): the chosen row's panel is .pd2-chosen — one sentence
       naming the request and the paper that fits, "In their words" (her words whole), "Read from the ask" (Party ·
       Stream · Paper · Files, each with where it was read), and its doors. Who holds it is the row's Where it stands
       ("With <first name>").
       RETIRED 17 Nov 2026 (#762, owner's ruling 3; round 3: "promised-by date" stays gone): the pills Routine and the
       ⋯ at their end (round 6 draws none) and "Promise a day" */
    await press(`.ikn-table [data-ikn-row="${r1.id}"]`);
    const P = await until(id => { const p = document.querySelector('#ins-panel.is-jambo'); if (!p || p.getAttribute('data-ins-id') !== id) return null;
      const pr = p.getBoundingClientRect();
      /* RE-POINTED 18 Nov 2026 (owner's pick by name, "Five Parts"; f1094): the chosen request's panel is the five parts —
         the request's title as the serif headline (.jov5-title), the ask quoted (.jov5-row.is-quote), each fact a row
         labelled under its value ("Party", "NDA · to do", "Files · … added by …"), Start the draft the black button
         with Hand back beside it (.jov5-acts). Every word main brought back on 17 Nov stands. */
      const doors = [...p.querySelectorAll('.jov5-acts button')];
      /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
      /* the black button leads (.jov5-go); the facts read from the ask are the "read" group's rows (the timeline is its own group) */
      const go = p.querySelector('.jov5-acts .jov5-go');
      const row = document.querySelector(`.ikn-table [data-ikn-row="${id}"]`), cells = row ? [...row.children] : [];
      const ths = [...document.querySelectorAll('.ikn-table thead th')].map(t => t.textContent.trim());
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent, head: (p.querySelector('.jov5-title') || {}).textContent,
        stands: cells[ths.indexOf('Status')] ? cells[ths.indexOf('Status')].textContent.replace(/\s+/g, ' ').trim() : '',
        go: go ? go.textContent.trim() : null,
        text: p.innerText.replace(/\s+/g, ' '),
        doors: doors.map(b => b.textContent.trim()), inside: doors.every(b => b.getBoundingClientRect().right <= pr.right + 1 && b.scrollWidth <= b.clientWidth + 1),
        quote: (p.querySelector('.jov5-row.is-quote .jov5-rt b') || {}).textContent,
        rows: Object.fromEntries([...p.querySelectorAll('[data-jov5-sec="read"] .jov5-row')].filter(r => r.querySelector('.jov5-rt > span') && !r.classList.contains('is-quote'))
          .map(r => [String(r.querySelector('.jov5-rt > span').textContent).split(' \u00b7 ')[0], (r.querySelector('.jov5-rt b') || {}).textContent])) };
    }, r1.id);
    /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
    /* the row's Status badge says who holds it — "With you" for the reader */
    check('2a no word in his head; the panel names the request; the row says who holds it ("With you")', !!P && !P.word
      && /^Mutual NDA with Naivas Supermarkets/.test(P.head || '') && P.stands.startsWith('With you'), P && JSON.stringify({ head: P.head, stands: P.stands, me: me.name }));
    /* KEPT AS IT WAS PROMISED (question for the owner, R2-Q4): the lane that sent the request to the reader */
    check('2a+ the panel says the lane that sent it ("by the NDA lane")', !!P && /NDA lane/.test(P.text), P && P.text.slice(0, 240));
    /* KEPT: Hand back (the decline with its reason) is an act the old panel carried and the new one does not draw — a question for the owner */
    /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
    /* held by the reader: Start the draft the black button, Put it down and Hand back as links beside it */
    check('2b Start the draft (black), Put it down and Hand back, each whole, inside the panel', !!P && P.go === 'Start the draft' && JSON.stringify(P.doors) === '["Start the draft","Put it down","Hand back"]' && P.inside, P && JSON.stringify({ go: P.go, doors: P.doors }));
    /* RE-POINTED 17 Nov 2026 (the owner's picks on the drawings, "2 Bring it back"): the NDA line stands under the party,
       and each file is its own row by name, who added it beside it */
    check('2c her words whole; Party · NDA · Stream · Paper · Files read from the ask, the one file by name', !!P && /^Naivas want/.test(P.quote || '') && /standard one\?$/.test(P.quote || '')
      && JSON.stringify(Object.keys(P.rows)) === '["Party","NDA","Stream","Paper","Files"]' && P.rows.Party === 'Naivas Supermarkets' && /pilot-brief\.pdf/.test(P.rows.Files || ''), P && JSON.stringify({ quote: (P.quote || '').slice(0, 40), rows: P.rows }));
    /* KEPT AS IT WAS PROMISED (question for the owner): "no NDA with them today" beside the party, and who added each attachment */
    check('2c+ "no NDA with them today" and who added the file', !!P && /no NDA with them today/.test(P.text) && /added by Wanjiru/.test(P.text), P && P.text.slice(0, 300));
    /* re-pointed 19 Oct 2026 (second pass): the name the New agreement form lists it under
       RE-POINTED 17 Nov 2026 (#762): the panel's Paper row and its sentence */
    check('2d Jambo names the paper that fits, read without a call', !!P && P.rows.Paper === 'NDA' && aiCalls.length === 0, JSON.stringify({ fit: P && P.rows.Paper, ai: aiCalls }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '20-requests-1440x780.png') });

    /* ---- 3 · Start the draft ---- */
    /* RE-POINTED 17 Nov 2026 (#762): the panel's door is [data-ikn-draft] */
    await press('#ins-panel [data-ikn-draft]');
    /* RE-POINTED 24 Oct 2026 (one door, the Legora way): the chosen paper is
       the sheet's card — its name in the head, the list put away — not a lit
       row; the sheet carries no crumb (the bar names New agreement) and its
       Cancel goes back where it was started */
    const S = await until(() => { const r = document.getElementById('na-root'), n = document.getElementById('na-card-name');
      return r && r.classList.contains('is-picked') && n ? { name: n.textContent.trim(), lit: n.getClientRects().length > 0 } : null; });
    check('3 Start the draft opens the New agreement sheet with that paper chosen — no model asked', !!S && /NDA/.test(S.name) && S.lit && aiCalls.length === 0, JSON.stringify({ S, ai: aiCalls }));
    if (OUT && S) { await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, '20-requests-start-the-draft-1440x780.png') }); }
    /* the form is the page in front: Jambo's panel at the edge does not sit over it */
    const O = await page.evaluate(() => { const on = document.getElementById('na-card-name'); const p = document.getElementById('ins-panel');
      const cr = document.querySelector('#na-create'); const at = el => { if (!el) return null; const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!(top && (el === top || el.contains(top))); };
      return { pick: at(on), create: at(cr), panelHidden: !p || !p.getClientRects().length || !at(p) }; });
    check('3b the sheet stands in front: its chosen paper and Create are painted, not under Jambo\'s panel', O.pick && O.create !== false, JSON.stringify(O));
    const BK = await page.evaluate(() => { const b = document.getElementById('wz-pick-cancel'); const n = document.getElementById('na-card-name');
      return { back: b ? b.textContent.trim() : null, name: n ? n.textContent.trim() : null }; });
    check('3c the sheet names the paper as Jambo said, with Cancel to go back', !!P && BK.name === P.rows.Paper && BK.back === 'Cancel', JSON.stringify(BK));
    if (BK.back) { await press('#wz-pick-cancel'); await until(() => !document.getElementById('na-root') && state.view === 'intake' ? true : null, null, 4000); }
    check('3d Cancel goes back to Requests', !!S && await page.evaluate(() => !document.getElementById('na-root') && state.view === 'intake'));
    await page.keyboard.press('Escape').catch(() => {});
    await until(() => !document.getElementById('na-root'), null, 4000);
    await page.evaluate(() => { if (document.getElementById('na-root')) { const b = document.querySelector('#modal-root [data-dlg-cancel], #na-cancel'); if (b) b.click(); } });
    await until(() => !document.getElementById('na-root'), null, 4000);

    /* ---- 4 · the counterparty's door ----
       KEPT AS IT WAS PROMISED (question for the owner): the party's name in the request's panel is a door to their
       contracts (data-ik-cp → cuOpenCustomer); the new panel prints it as plain words */
    await page.evaluate(() => setView('intake'));
    await press(`.ikn-table [data-ikn-row="${r1.id}"]`);
    await until(id => document.querySelector('#ins-panel.is-jambo') && document.querySelector('#ins-panel').getAttribute('data-ins-id') === id ? true : null, r1.id);
    await press('#ins-panel [data-ik-cp], #ins-panel [data-ikn-cp]');
    const C = await until(() => { const el = document.querySelector('.is-landed, .is-landed-held'); return el && /Naivas/.test(document.body.innerText) && (state.view !== 'intake') ? { view: state.view, lit: el.className } : null; });
    check('4 the counterparty\'s name lands on their contracts', !!C, JSON.stringify(C));

    /* RETIRED 17 Nov 2026 (#762, owner's ruling 3: Requests as round 6 drew it): 5 "a finger on + Filter opens HaTi's
       one list" — the new Requests page draws no + Filter and no dropdown at all (the one-dropdown rule is guarded
       on the pages that still have one) */

    /* ---- 6 · MY NOTES ----
       RE-POINTED 17 Nov 2026 (#762; My notes as round 6 drew it, approved "Approve round 6"): ONE card (#mn-page) —
       "My notes · Private · 5 notes · 1 due", the box #mnn-q and the tabs All · Due · Reviewed, one table
       (.mnn-table: Note · Contract · Due · its one word); the chosen note is Jambo's five parts in #ins-panel.
       RETIRED 17 Nov 2026 (#762, round 6 as drawn): the Later tab and Contract under + Filter (round 6 draws the box
       and three tabs only) */
    await page.evaluate(() => mineLoad(true).then(() => setView('mynotes')));
    const N = await until(() => { const p = document.querySelector('#ins-panel.is-jambo'); const rows = [...document.querySelectorAll('.mnn-table [data-mn-row]')];
      if (!p || rows.length !== 5 || !p.querySelector('.mnn5')) return null;
      const pr = p.getBoundingClientRect();
      const ths = [...document.querySelectorAll('.mnn-table thead th')].map(t => t.textContent.trim());
      /* RE-POINTED (P-27, owner's pick 20 Nov 2026: My notes the Legora + Stripe way): the title alone with "Only you see
         these" beside it (.mnn-only; the facts line went: the chips say it); the ask box under the title (label.apn-ask);
         tabs are chips; a Status column of soft badges (Due today amber · Later · No day · Reviewed green); the Due column
         the day right-aligned with its words under ("today", "in N days", "no day"); the act ONLY on the chosen row */
      const di = ths.indexOf('Due');
      const due = rows.map(r => { const td = r.children[di]; if (!td) return ['', ''];
        const sub = td.querySelector('.cun-sub'); return [[...td.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').trim(), sub ? sub.textContent.trim() : '']; });
      const status = rows.map(r => { const b = r.querySelector('.apn-st'); return b ? [b.textContent.trim(), ((b.className.match(/\bis-(\w+)/) || [])[1]) || ''] : null; });
      const acts = rows.map(r => [...r.querySelectorAll('[data-mn-act]')].map(b => b.textContent.trim()));
      const verbs = [...p.querySelectorAll('[data-mn-act]')];
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent, title: (document.querySelector('#mn-page .ctf-h') || {}).textContent, facts: (document.querySelector('#mn-page .ctf-hf') || {}).textContent || null,
        only: ((document.querySelector('#mn-page .cun-head .mnn-only') || {}).textContent || '').trim(),
        tabs: [...document.querySelectorAll('[data-mnn-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        box: !!document.querySelector('#mn-page label.apn-ask #mnn-q'), due, status, acts, sel: rows.findIndex(r => r.classList.contains('is-sel')),
        last: rows[4] ? rows[4].textContent.replace(/\s+/g, ' ').trim() : '',
        verbs: verbs.map(b => [b.getAttribute('data-mn-act'), b.textContent.replace(/\s+/g, ' ').trim()]),
        whole: verbs.every(b => b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().right <= pr.right + 1),
        text: p.innerText.replace(/\s+/g, ' ') };
    }, null, 10000);
    /* RE-POINTED (P-27, owner's pick 20 Nov 2026: My notes the Legora + Stripe way): no facts beside the title ("Only you
       see these" stands there); the box under the title; the chips; Due today an amber badge; the day with its words; the
       reviewed note a green Reviewed badge; the act on the chosen row only */
    check('6a My notes: the head, the box and the tabs, the due column as drawn', !!N && N.title === 'My notes' && N.facts === null && N.only === 'Only you see these'
      && JSON.stringify(N.tabs) === '["All 5","Due 1","Reviewed 1"]' && N.box
      && !!N.status[0] && N.status[0][0] === 'Due today' && N.status[0][1] === 'amber' && /^\d+ \S+$/.test(N.due[0][0]) && N.due[0][1] === 'today'
      && /^\d+ \S+$/.test(N.due[1][0]) && /^in \d+ days?$/.test(N.due[1][1]) && N.due[3][0] === '—' && N.due[3][1] === 'no day'
      && !!N.status[4] && N.status[4][0] === 'Reviewed' && N.status[4][1] === 'green' && /^\d+ \S+$/.test(N.due[4][0])
      && N.sel >= 0 && N.acts.every((a, i) => i === N.sel ? a.length === 1 : a.length === 0),
      N && JSON.stringify({ facts: N.facts, only: N.only, tabs: N.tabs, status: N.status, due: N.due, acts: N.acts, sel: N.sel, last: N.last }));
    /* RE-POINTED 17 Nov 2026 (#762): the note's verbs are the five parts' — the review row ("Review today · It rings
       your bell…"), the contract's row (its door), ONE black Mark reviewed, Delete note a quiet link; each whole */
    /* RE-POINTED (P-27, owner's pick 20 Nov 2026: My notes the Legora + Stripe way): no tiles and no review row — the
       note's Due today is its badge over the title, and the bell is the timeline's "Your bell rings … Rings each day until reviewed" */
    check('6b the note in Jambo\'s panel (no word beside the tabs): Due today, the bell ringing until reviewed, Open its contract, Mark reviewed, Delete note, each whole', !!N && !N.word
      && /Due today/.test(N.text) && /Your bell rings .*Rings each day until reviewed/.test(N.text)
      && N.verbs.some(v => v[0] === 'open' && /MK-A2/.test(v[1])) && N.verbs.some(v => v[0] === 'reviewed' && v[1] === 'Mark reviewed') && N.verbs.some(v => v[0] === 'delete' && v[1] === 'Delete note') && N.whole,
      N && JSON.stringify({ verbs: N.verbs, text: N.text.slice(0, 200) }));
    /* KEPT AS IT WAS PROMISED (question for the owner): Snooze a week, which the old panel carried */
    check('6b+ the note offers Snooze a week', !!N && N.verbs.some(v => v[0] === 'snooze'), N && JSON.stringify(N.verbs));
    if (OUT) await page.screenshot({ path: path.join(OUT, '20-mynotes-1440x780.png') });
    await press('#ins-panel [data-jl-home]');
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"; "Yes, every page"): his words are the Overview's head
       RE-POINTED 17 Nov 2026 (#762; THE FIVE PARTS): the headline and line (.jov5-title, .jov5-sub), the three tiles
       (5 notes · 1 back today · 2 later), and its two doors: New note (the black button) and the ones due today */
    const J = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title'); if (!t || p.querySelector('.mnn5')) return null;
      return { say: [t.textContent.trim(), ((p.querySelector('.jov5-sub') || {}).textContent || '').trim()].join(' '),
        tiles: [...p.querySelectorAll('.jov5-g')].map(g => g.innerText.replace(/\s+/g, ' ').trim()),
        chips: [...p.querySelectorAll('.jov5-go, .jov-lnk')].map(c => c.textContent.trim()) }; });
    check('6c ‹ Overview: the ledger in his words, counted, with its two doors', !!J && /^You have 5 notes, private to you\. 1 is due today\./.test(J.say)
      && JSON.stringify(J.tiles) === '["5 notes","1 back today","2 later"]'
      && JSON.stringify(J.chips.map(c => c.toLowerCase())) === '["new note","the ones due today"]', JSON.stringify(J));
    await press('#ins-panel .jov-lnk');
    const L = await until(() => { const el = document.querySelector('.mnn-table [data-mn-row].is-landed, .mnn-table [data-mn-row].is-landed-held, .mnn-table [data-mn-row].is-sel'); const on = document.querySelector('[data-mnn-tab].is-on');
      return el && on && on.getAttribute('data-mnn-tab') === 'today' ? { lit: el.getAttribute('data-mn-row'), tab: on.getAttribute('data-mnn-tab'), rows: document.querySelectorAll('.mnn-table [data-mn-row]').length } : null; });
    check('6d "the ones due today" turns the tab and lands on its row', !!L && L.tab === 'today' && L.rows === 1, JSON.stringify(L));
    await page.evaluate(() => { const t = document.querySelector('[data-mnn-tab="all"]'); if (t) t.click(); });

    /* ---- 7 · the owner's three screens ---- */
    /* SECOND PASS (19 Oct 2026): the band's row is measured by overlap, not
       by a top within 24px (that passed a band broken onto two rows), its
       labels must read whole, and the round runs again in Svenska
       RE-POINTED 17 Nov 2026 (#762): both pages are one card — the head, then ONE bar where the box and the tabs
       share a row (measured by overlap), no tab cut, no column head cut, and the chosen row's doors in Jambo's
       panel whole and inside it (the five parts stack them, so no "one line") */
    for (const lang of ['en', 'sv']) {
    if (lang === 'sv') await page.evaluate(() => { if (typeof langSet === 'function') langSet('sv'); });
    for (const [view, sel] of [['intake', '.ikn-table'], ['mynotes', '.mnn-table']]) {
      await page.evaluate(v => setView(v), view);
      await until(s => document.querySelector(s) ? true : null, sel);
      if (view === 'intake') await press(`.ikn-table [data-ikn-row="${r1.id}"]`);
      else await press('.mnn-table [data-mn-row]');
      for (const [w, ht] of SCREENS) {
        await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(450);
        const F = await page.evaluate(s => {
          const pg = document.querySelector(s).closest('.apn-page');
          const head = pg && pg.querySelector('.cun-head'), bar = pg && pg.querySelector('.apn-bar');
          const tabs = bar ? [...bar.querySelectorAll('.apn-tab')] : [];
          let oneRow;
          if (s === '.ikn-table'){
            /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way) */
            /* Requests: the head, the ask box under the title (label.apn-ask), then the chips on one row, nothing sideways */
            const ask = pg && pg.querySelector('label.apn-ask'), ab = ask && ask.getBoundingClientRect();
            oneRow = !!(head && bar && ab && ask.querySelector('#ikn-q') && tabs.length) && head.getBoundingClientRect().bottom <= ab.top + 1 && ab.bottom <= bar.getBoundingClientRect().top + 1
              && tabs.every(t => Math.abs(t.getBoundingClientRect().top - tabs[0].getBoundingClientRect().top) <= 2) && bar.scrollWidth <= bar.clientWidth + 1;
          } else {
            /* RE-POINTED (P-27, owner's pick 20 Nov 2026: My notes the Legora + Stripe way): as Requests — the head, the ask
               box under the title (label.apn-ask), then the chips on one row, nothing sideways */
            const ask = pg && pg.querySelector('label.apn-ask'), ab = ask && ask.getBoundingClientRect();
            oneRow = !!(head && bar && ab && ask.querySelector('#mnn-q') && tabs.length) && head.getBoundingClientRect().bottom <= ab.top + 1 && ab.bottom <= bar.getBoundingClientRect().top + 1
              && tabs.every(t => Math.abs(t.getBoundingClientRect().top - tabs[0].getBoundingClientRect().top) <= 2) && bar.scrollWidth <= bar.clientWidth + 1;
          }
          const labelsCut = tabs.concat(head ? [...head.children] : []).filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim());
          const heads = [...document.querySelectorAll(s + ' thead th')].filter(t => t.scrollWidth > t.clientWidth + 1).map(t => t.textContent.trim());
          const p = document.querySelector('#ins-panel.is-jambo'); const pr = p && p.getBoundingClientRect();
          const verbs = p ? [...p.querySelectorAll('[data-ikn-draft], [data-mn-act]')] : [];
          const cutVerb = verbs.filter(b => b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().right > pr.right + 1).map(b => b.textContent.trim());
          return { side: document.documentElement.scrollWidth <= innerWidth + 1, oneRow, labelsCut,
            heads, verbs: verbs.length, cutVerb, panel: !!p && pr.right <= innerWidth + 1 && pr.bottom <= innerHeight + 1 };
        }, sel);
        check(`7 ${lang} ${view} ${w}×${ht}: nothing sideways, the head then the box and tabs on one row, nothing cut, the panel's doors whole and inside it`, F.side && F.oneRow && !F.labelsCut.length && !F.heads.length && F.verbs > 0 && !F.cutVerb.length && F.panel, JSON.stringify(F));
        if (OUT) await page.screenshot({ path: path.join(OUT, `20-${view === 'intake' ? 'requests' : 'mynotes'}-${lang}-${w}x${ht}.png`) });
      }
      await page.setViewportSize({ width: 1440, height: 780 });
    }
    }
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); });
    /* ---- 8 · SECOND PASS: a refresh lands at the same spot ----
       RE-POINTED 17 Nov 2026 (#762): the new look's tabs ([data-ikn-tab] Open · Mine, [data-mnn-tab]) and its chosen
       row (the panel's data-ins-id); a tab and a row that are NOT the first, so a refresh that forgets is seen */
    await page.evaluate(() => setView('intake'));
    await until(() => document.querySelector('.ikn-table [data-ikn-row]') ? true : null);
    await press(`.ikn-table [data-ikn-row="${r3.id}"]`);
    await until(id => { const p = document.querySelector('#ins-panel'); return p && p.getAttribute('data-ins-id') === id ? true : null; }, r3.id);
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: 'networkidle' });
    const K = await until(() => { const on = document.querySelector('[data-ikn-tab].is-on'); const p = document.querySelector('#ins-panel');
      return on && p && p.getAttribute('data-ins-id') ? { tab: on.getAttribute('data-ikn-tab'), row: p.getAttribute('data-ins-id') } : null; }, null, 15000);
    check('8a Requests after a refresh: the same request', !!K && K.tab === 'open' && K.row === r3.id, JSON.stringify(K));
    await press('[data-ikn-tab="mine"]');
    await until(() => document.querySelector('[data-ikn-tab="mine"].is-on') ? true : null);
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: 'networkidle' });
    const K2 = await until(() => { const on = document.querySelector('[data-ikn-tab].is-on'); return on && document.querySelector('.ikn-table') ? on.getAttribute('data-ikn-tab') : null; }, null, 15000);
    check('8a+ Requests after a refresh: the same tab', K2 === 'mine', JSON.stringify(K2));
    await page.evaluate(() => setView('mynotes'));
    await until(() => document.querySelector('.mnn-table [data-mn-row]') ? true : null);
    await press('[data-mnn-tab="done"]');
    const want = await until(() => { const on = document.querySelector('[data-mnn-tab="done"].is-on'); const r = document.querySelector('.mnn-table [data-mn-row]'); return on && r ? r.getAttribute('data-mn-row') : null; });
    await press(`.mnn-table [data-mn-row="${want}"]`);
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: 'networkidle' });
    const KN = await until(() => { const on = document.querySelector('[data-mnn-tab].is-on'); const sel = document.querySelector('.mnn-table [data-mn-row].is-sel');
      return on && sel ? { tab: on.getAttribute('data-mnn-tab'), row: sel.getAttribute('data-mn-row') } : null; }, null, 15000);
    check('8b My notes after a refresh: the same tab and the same note', !!KN && KN.tab === 'done' && KN.row === want, JSON.stringify(KN));
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
