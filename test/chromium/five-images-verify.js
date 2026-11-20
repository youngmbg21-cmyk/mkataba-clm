/* Chromium verification: FIVE OFF FIVE IMAGES (Young ruled 21 Sep 2026).
   ====================================================================
   WHY A BROWSER FILE. Four of these five are things a source read cannot
   answer:
     · "the filters do not work at all" is a HIT TEST. The markup was correct —
       a <label>, a word, a <select> with all its options — and the control was
       still unreachable, because a rule had shrunk it to a 22px transparent
       sliver at the right wall. Only elementFromPoint can say what a press on
       the word actually lands on;
     · "the shaded area needs to cover the entire button" is PAINTED PIXELS;
     · the verbs sitting beside the sentence rather than under it is a
       measured geometry, and the row it is on only exists once a contract is
       really inside its renewal window;
     · a 3px bar drawn as a BACKGROUND is a computed style, not a tag.

   Run: node test/chromium/five-images-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'five-images');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
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

    /* ════════ 2. THE CONTRACTS PAGE ════════
       Done first because it needs nothing staged. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Contracts opens on its folders; List draws the table */
    await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.querySelector('[data-ctf-show="list"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    await page.waitForTimeout(800);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });

    /* RE-POINTED 9 Oct 2026 (owner's pick): the quick filters are a box now, so
       its options are what is asked.
       RE-POINTED AGAIN 21 Oct 2026 (Part 8, the owner picked "the Legora way"):
       the views are TABS again, in the drawing's words ("Ending in 90 days"),
       each drawn where it holds rows — so the catalogue of tabs is asked
       (regCtViews, the one reading the tab row draws), not the painted row. */
    const tabs = await page.evaluate(() => regCtViews().map(v => v.k + ':' + v.label));
    ok('2a the 60-day tab is gone', !tabs.some(t => /60/.test(t)), tabs.join(' | '));
    ok('2a2 the 30-day tab is gone', !tabs.some(t => /\b30\b/.test(t)));
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): the new-look Contracts head draws only
       All · Needs you · Signed as tabs (regCtViews, regNl); the 90-day view is the Folders' "Ending in 90 days" view
       (regFolderViewsData k 'end', CTF_VIEW_DAYS) — still 90, and no 60 or 30 anywhere beside it. */
    /* the seeded book has nothing ending this quarter, so four papers ending in 20, 55, 89 and 120 days are READ (nothing
       stored): the view takes the first three and only them */
    const v90 = await page.evaluate(() => { const T = todayISO(), at = n => { const d = new Date(T + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
      const cs = [20, 55, 89, 120].map(n => ({ id: 'V90-' + n, name: 'Ends in ' + n, folder: 'f', status: 'Signed', expiry: at(n) }));
      const V = regFolderViewsData(cs), e = V.find(v => v.k === 'end');
      return { views: V.map(v => v.k + ':' + v.label).join(' | '), label: e ? e.label : '', ids: e ? e.list.map(c => c.id).join(',') : '' }; });
    ok('2a3 and 90 is still there', /\b90\b/.test(v90.label) && v90.ids === 'V90-20,V90-55,V90-89' && !/\b(60|30)\b/.test(v90.views), JSON.stringify(v90));

    /* RETIRED 17 Nov 2026 (#762, owner's ruling): 2b "Condensed is gone" (row height), 2c3/2c4 "picking a stream under
       + Filter narrows and the chip says so", 2c/2c2 "every filter chip (+ Filter, Sort) opens from anywhere on its face" —
       the Contracts list's + Filter, Sort and row height stay gone in the new look. */

    /* ════════ 1. HOME'S PREPARED BY COPILOT ROW ════════
       STAGED, because the seeded book has nothing prepared: a contract really
       executed, really inside its renewal window, with a notice period on the
       record. Everything about the row is the product's own after that. */
    const staged = await page.evaluate(e1 => {
      const c = state.contracts.filter(x => !x.archived && x.status !== 'Declined')[0];
      if (!c) return null;
      c.status = 'Signed';
      c.execution = { at: new Date(Date.now() - 200 * 864e5).toISOString() };
      c.createdAt = new Date(Date.now() - 300 * 864e5).toISOString();
      c.metadata = Object.assign({}, c.metadata, { expiryDate: e1, noticePeriodDays: 30 });
      c.expiry = e1;
      return { id: c.id, n: (typeof deskItems === 'function') ? deskItems(state.contracts).length : -1 };
    }, iso(70));
    ok('1-stage a contract really is inside its renewal window',
      !!staged && staged.n > 0, JSON.stringify(staged));

    /* RE-POINTED 15 Oct 2026 (step 7): section 2 left Home on the Contracts
       place (Home's Document face, no paper), so Home is reached the way a
       reader reaches it — the rail's Home door, which lands on the Board. */
    await page.evaluate(() => { const b = document.querySelector('#side-nav .nav-item[data-view="dashboard"]');
      if (b) b.click(); else setView('dashboard'); });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '03-home.png'), fullPage: true });

    /* RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): the prepared row is now the
       Renewals row of Prepared by Copilot. The geometry claim is the same —
       the verb sits beside the sentence, at the right — and the card's own
       act is its door onto Copilot's work (Put away lives there now). */
    /* RE-POINTED 22 Oct 2026 (Round A, the one desk): the renewal is one row of the Board's Needs you card; its
       Look sits on the row's own line, at the right, and Look is the row's one door (the piece opens in place). */
    const desk = await page.evaluate(() => {
      const card = document.getElementById('hm-agents');
      if (!card) return { drawn: false };
      const row = card.querySelector('[data-nd-agent="renew"]');
      if (!row) return { drawn: false };
      const btn = row.querySelector('[data-hb-ag-look]'), head = row.querySelector('.nd-c-what b');
      const rr = row.getBoundingClientRect(), ar = btn.getBoundingClientRect(), hr = head.getBoundingClientRect();
      return { drawn: true,
        verbs: [...row.querySelectorAll('button')].map(b => b.textContent.trim()),
        door: (card.querySelector('.hm-cz, .hb-link[data-hm-agent]') || {}).textContent,
        sameLine: Math.abs((ar.top + ar.height / 2) - (hr.top + hr.height / 2)) < 10,
        rightOfText: ar.left >= hr.right - 1,
        gapToWall: Math.round(rr.right - ar.right),
        rowH: Math.round(rr.height) };
    });
    ok('1 the renewal row draws its Look', desk.drawn && desk.verbs.length >= 1 && desk.verbs[0] === 'Look',
      JSON.stringify(desk.verbs));
    ok('1b it sits on the SAME LINE as the sentence', desk.sameLine === true, JSON.stringify(desk));
    ok('1c and at the RIGHT of it', desk.rightOfText === true,
      'gap to the wall ' + desk.gapToWall + 'px');
    ok('1d Look is the row\'s one door — no second link to a separate page', !desk.door && desk.verbs.length === 1, String(desk.door));

    /* ════════ 3. THE HORIZON'S DECISION COLUMN ════════ */
    await page.evaluate(() => {
      /* A SECOND contract, decided, so all three states are on one screen. The
         decision is written in the shape renewalDecisionOf checks — a shape it
         refuses if either half has moved, which is the point of it. */
      const cs = state.contracts.filter(x => !x.archived && x.status !== 'Declined');
      const c = cs[1]; if (!c) return;
      c.status = 'Signed';
      c.execution = { at: new Date(Date.now() - 200 * 864e5).toISOString() };
      const e2 = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
      c.metadata = Object.assign({}, c.metadata, { expiryDate: e2, noticePeriodDays: 60 });
      c.expiry = e2;
      const q = renewalQuestionOf(c), w = renewalWindow(c);
      c.renewalDecision = { answer: 'renegotiate', at: new Date().toISOString(),
        by: { id: '1', name: 'Admin' }, why: '',
        decideBy: (w && w.decideBy) || '', expiry: q.expiry, notice: q.notice };
    });
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1200);
    await page.click('[data-cal-view="horizon"]').catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '04-horizon.png'), fullPage: true });

    const hz = await page.evaluate(() => {
      const head = document.querySelector('.cal-hz-col-dec');
      const rows = [...document.querySelectorAll('.cal-hz-row')].map(r => {
        const d = r.querySelector('.cal-hz-dec');
        if (!d) return null;
        const rr = r.getBoundingClientRect(), dr = d.getBoundingClientRect();
        const cs = getComputedStyle(d);
        return { text: d.textContent.trim(), kind: d.className.replace('cal-hz-dec ', ''),
          ink: cs.color, align: cs.textAlign, weight: cs.fontWeight,
          pill: d.querySelector('b') ? getComputedStyle(d.querySelector('b')).color : cs.color,
          atRight: Math.round(rr.right - dr.right) <= 2 };
      });
      return { head: head ? head.textContent.trim() : null,
        headRight: head ? getComputedStyle(head).textAlign : null, rows };
    });
    ok('3 the ruler names a Decision column', !!hz.head, hz.head);
    ok('3b every row carries a decision cell, right-aligned',
      hz.rows.length > 0 && hz.rows.every(r => r && r.align === 'right' && r.atRight),
      hz.rows.length + ' rows');
    const kinds = hz.rows.filter(Boolean).map(r => r.kind);
    ok('3c a decision already taken reads as a fact', kinds.includes('is-done'),
      (hz.rows.find(r => r && r.kind === 'is-done') || {}).text);
    ok('3d an open question reads as work', kinds.includes('is-open'),
      (hz.rows.find(r => r && r.kind === 'is-open') || {}).text);
    ok('3e nothing to say reads faintest of the three', kinds.includes('is-none'));
    const open = hz.rows.find(r => r && r.kind === 'is-open');
    const done = hz.rows.find(r => r && r.kind === 'is-done');
    const none = hz.rows.find(r => r && r.kind === 'is-none');
    ok('3f the open one carries the strong weight and the others do not',
      open && done && Number(open.weight) > Number(done.weight),
      open && done ? `${open.weight} vs ${done.weight}` : 'not both drawn');
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): the Horizon the SAP way (owner's pick, 10 Nov 2026)
       says a decision as a PILL inside the cell (<b>): decided green, open amber, and an undecided row wears the tone of its
       time left — so "nothing to say" may share the open amber on a short row, but never the decided green. The inks
       are the pills', the cell's own text colour is the one ink. */
    ok('3g and the inks really differ — decided is never the open nor the nothing-to-say ink',
      open && done && none && open.pill !== done.pill && none.pill !== done.pill,
      open && done && none ? [open.pill, done.pill, none.pill].join(' · ') : '');
    /* A DATE, NOT A RAW ISO STRING — a screen that prints 2026-09-21 is a
       screen that reached for a formatter that is not on the stage. */
    ok('3h the decided day is printed the way this page prints days',
      !!done && !/\d{4}-\d{2}-\d{2}/.test(done.text), done && done.text);

    /* ════════ 4. THE LIT HALF FILLS ITS BUTTON, EVERYWHERE ════════
       A SWEEP, because the owner said "make this happen anywhere this is not
       the rule". Measured as the page of GROUND left showing above and below
       the fill; a group's own 1px border is not a gap. */
    const segSweep = [];
    for (const v of ['dashboard', 'register', 'calendar', 'templates', 'intel', 'settings']) {
      await page.evaluate(vv => { try { setView(vv); } catch (e) {} }, v);
      await page.waitForTimeout(700);
      const got = await page.evaluate(vv => {
        const groups = new Set();
        document.querySelectorAll('.cal-seg,.sh-grp,.rl-segwrap,.ui-seg,.doc-read-seg,.reg-seg')
          .forEach(e => groups.add(e));
        document.querySelectorAll('[data-reg-density],[data-reg-mode],[data-cal-days],[data-cal-view]')
          .forEach(e => { if (e.tagName === 'BUTTON' && e.parentElement) groups.add(e.parentElement); });
        const out = [];
        groups.forEach(g => {
          const gr = g.getBoundingClientRect(); if (!gr.height) return;
          const kids = [...g.children].filter(k => k.getBoundingClientRect().height > 0);
          if (kids.length < 2) return;
          const lit = kids.find(k => k.classList.contains('on') || k.getAttribute('aria-pressed') === 'true');
          if (!lit) return;
          const bw = parseFloat(getComputedStyle(g).borderTopWidth) || 0;
          const lr = lit.getBoundingClientRect();
          out.push({ v: vv, cls: (g.className || '').toString().trim().slice(0, 30),
            gap: Math.max(0, +((lr.top - gr.top) - bw).toFixed(1)),
            gapB: Math.max(0, +((gr.bottom - lr.bottom) - bw).toFixed(1)) });
        });
        return out;
      }, v);
      segSweep.push(...got);
    }
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): the drawing's switch is a grey
       pill holding pills, 3px inside it (padding:3px in the owner's drawing), so
       the lit half sits EVENLY inside it — the same inset top and bottom, never
       more than the drawn 3px — rather than flush with an edge it no longer has. */
    const bad = segSweep.filter(s => s.gap > 3.6 || s.gapB > 3.6 || Math.abs(s.gap - s.gapB) > 0.6);
    /* RE-POINTED 21 Oct 2026 (Chambers): the bar's two groups (.sh-grp — the
       Blue/Green and theme switch, and the language switch) were twelve of the
       fifteen measured on main; both left the bar, so three remain to sweep. */
    ok('4 every segmented control’s lit half sits evenly inside its pill',
      segSweep.length >= 3 && bad.length === 0,
      bad.length ? bad.map(b => `${b.v}/${b.cls} ${b.gap}/${b.gapB}`).join(' · ')
                 : segSweep.length + ' measured, none leaking');

    /* ════════ 5. A BIT OF COLOUR ON THE FRAME ════════ */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Contracts opens on its folders; List draws the table */
    await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.querySelector('[data-ctf-show="list"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    await page.waitForTimeout(800);
    await page.waitForTimeout(900);
    /* RE-POINTED 15 Oct 2026 (the overnight build, steps 3 and 7): Home's head and the Contracts place carry no "+ Draft new agreement" (Jambo's panel has it); the two-door menu is the pages' own door, opened here as they open it (openNewDoors). */
    await page.evaluate(() => { if (typeof openNewDoors === 'function') openNewDoors(); });
    /* 23 Sep 2026: the button opens two doors first; this presses Draft from HaTi. */
    await page.waitForTimeout(400);
    /* RE-POINTED 10 Oct 2026 (SAP pop-ups): New agreement is a PAGE now, with
       the white head of every page; the frame's rule is asked of a dialog that
       is still a dialog — Add a received contract, behind the other door. */
    /* RE-POINTED 17 Oct 2026 (round 5, the owner picked "Jambo's tray"): the
       Upload door lands on the drop area in Jambo's panel; the dialog the frame
       is asked of is the upload pop-up itself, which still finishes what a drop
       hands it, opened as the drop opens it */
    await page.evaluate(() => { try { closeModal(); } catch (_) {} if (typeof openUploadModal === 'function') openUploadModal(); });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '05-popup.png') });
    /* RE-POINTED 10 Oct 2026 (the pop-ups as drawn): the 3px accent line at a
       dialog's top was RETIRED on purpose — the drawings are plain white with a
       ruled title bar (f346 was re-pointed the same way). The claims that
       stand: the frame is a ruled title bar over an untouched surface, and a
       dangerous question says so in the danger tone, never the accent — now
       as its warning sign and its red confirm button. */
    /* RE-POINTED 20 Nov 2026 (#814, f1120 — the owner's pick of 19 Nov 2026, THE ONE EDIT POP-UP, THE
       LEGORA WAY): Add a received contract is now the one quiet Legora sheet (form.lgp), whose head
       (.lgp-hd) is a serif title with NO rule under it — nothing boxed, on purpose. A dialog still in
       the SAP frame keeps its ruled .dlg-h bar and is held to the rule as before; on the Legora sheet
       the claims that stand are the ones this step protects: no colour line at the frame's top, the
       head is the frame's own at its top edge, and the surface is untouched. */
    const pop = await page.evaluate(() => {
      const m = document.querySelector('#modal-root [role="dialog"]');
      if (!m) return null;
      const cs = getComputedStyle(m), bar = m.querySelector('.dlg-h, form.lgp > .lgp-hd'), bs = bar ? getComputedStyle(bar) : null;
      return { img: cs.backgroundImage, surface: cs.backgroundColor, radius: cs.borderRadius,
        bar: !!bar, legora: !!(bar && bar.matches('.lgp-hd')),
        rule: bs ? bs.borderBottomStyle + ' ' + bs.borderBottomWidth : '',
        barImg: bs ? bs.backgroundImage : '' };
    });
    ok('5 the dialog frame has its own head (a ruled title bar, or the Legora sheet\u2019s quiet head), with no colour line at its top',
      !!pop && pop.bar && (pop.legora || /^solid [1-9]/.test(pop.rule)) && !/linear-gradient/.test(pop.img)
        && !/linear-gradient/.test(pop.barImg),
      pop && JSON.stringify({ bar: pop.bar, legora: pop.legora, rule: pop.rule, img: pop.img.slice(0, 40) }));
    ok('5b the head is the frame\u2019s own: it sits at the dialog\u2019s top edge',
      await page.evaluate(() => { const m = document.querySelector('#modal-root [role="dialog"]'), b = m && m.querySelector('.dlg-h, form.lgp > .lgp-hd');
        return !!b && Math.abs(b.getBoundingClientRect().top - m.getBoundingClientRect().top) <= 2; }));
    ok('5c the surface underneath is untouched',
      !!pop && pop.surface !== 'rgba(0, 0, 0, 0)', pop && pop.surface);

    await page.evaluate(() => { try { closeModal(); } catch (e) {} });
    await page.waitForTimeout(400);
    await page.evaluate(() => { confirmDialog({ title: 'Delete', message: 'Really?', danger: true }); });
    await page.waitForFunction(() => !!document.querySelector('#confirm-overlay [role="alertdialog"]'), null, { timeout: 4000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, '06-confirm.png') });
    const conf = await page.evaluate(() => {
      const m = document.querySelector('#confirm-overlay [role="alertdialog"]');
      if (!m) return null;
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;left:-9999px;background:var(--danger)';
      document.body.appendChild(probe);
      const want = getComputedStyle(probe).backgroundColor; probe.remove();
      const ok = document.getElementById('cf-ok');
      return { sign: !!m.querySelector('.dlg-mb-ic[data-tone="danger"]'), btn: ok ? getComputedStyle(ok).backgroundColor : '', want };
    });
    ok('5d a dangerous question wears the danger tone, not the accent: its warning sign and a red confirm',
      !!conf && conf.sign && conf.btn === conf.want, conf && JSON.stringify(conf));
    await page.evaluate(() => { const c = document.getElementById('cf-cancel'); if (c) c.click(); });

    ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
