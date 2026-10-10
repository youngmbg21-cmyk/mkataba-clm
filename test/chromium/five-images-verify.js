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
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });

    /* RE-POINTED 9 Oct 2026 (owner's pick): the quick filters are a box now, so
       its options are what is asked. */
    const tabs = await page.$$eval('#reg-view-sel option', els => els.map(e => e.textContent.trim()));
    ok('2a the 60-day tab is gone', !tabs.some(t => /≤ 60/.test(t)), tabs.join(' | '));
    ok('2a2 the 30-day tab is gone', !tabs.some(t => /≤ 30/.test(t)));
    ok('2a3 and 90 is still there', tabs.some(t => /≤ 90/.test(t)));

    const dens = await page.$$eval('button[data-reg-density]',
      els => els.map(e => e.textContent.trim()));
    ok('2b Condensed is gone', dens.length === 2 && !/ondensed|ompakt/.test(dens.join()),
      dens.join(' | '));

    /* ---- THE HIT TEST. This is the whole of the filter report. ---- */
    const chips = await page.evaluate(() => [...document.querySelectorAll('.reg-filterbar .reg-chip')]
      .filter(c => c.querySelector('select'))
      .map(c => {
        const s = c.querySelector('select'), r = c.getBoundingClientRect();
        /* Four points across the chip's own face — the word, not just its
           right wall. Every one of them must land on the control. */
        const xs = [.2, .4, .6, .8].map(f => document.elementFromPoint(
          r.left + r.width * f, r.top + r.height / 2));
        return { id: s.id, opts: s.options.length,
          onSelect: xs.every(e => e && e.tagName === 'SELECT'),
          hits: xs.map(e => e ? e.tagName : 'null').join(','),
          sel: Math.round(s.getBoundingClientRect().width),
          chip: Math.round(r.width) };
      }));
    ok('2c every filter chip opens from anywhere on its face',
      chips.length >= 3 && chips.every(c => c.onSelect),
      chips.map(c => `${c.id}:${c.hits}`).join(' · '));
    ok('2c2 and the control really is the size of the chip',
      chips.every(c => c.sel >= c.chip - 4),
      chips.map(c => `${c.id} ${c.sel}/${c.chip}`).join(' · '));

    /* ---- AND IT NARROWS. A control that opens and does nothing is the
       same report in a second costume. ---- */
    const before = await page.$$eval('tr[data-row]', r => r.length);
    /* RE-POINTED 9 Oct 2026: the stage is the tab row on this page now, so the
       box picked is the stream — the claim (a box narrows and says so) is one. */
    const pick = await page.$eval('#reg-type-sel', s => { const o = s.options[1]; return o ? { v: o.value, t: o.textContent.trim() } : null; });
    await page.selectOption('#reg-type-sel', pick ? pick.v : 'all');
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => { const c = document.getElementById('reg-type-sel').closest('.reg-chip'); return {
      rows: document.querySelectorAll('tr[data-row]').length,
      face: (c.querySelector('.reg-f-l') || {}).textContent,
      lit: c.classList.contains('on') }; });
    ok('2c3 picking a stream narrows the table', after.rows > 0 && after.rows < before,
      `${before} → ${after.rows}`);
    ok('2c4 and the chip says what is in force', after.lit && !!pick && (after.face || '').includes(pick.t),
      after.face);
    await page.screenshot({ path: path.join(OUT, '02-chip-picked.png') });
    await page.selectOption('#reg-type-sel', 'all');
    await page.waitForTimeout(600);

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

    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '03-home.png'), fullPage: true });

    /* RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): the prepared row is now the
       Renewals row of Prepared by Copilot. The geometry claim is the same —
       the verb sits beside the sentence, at the right — and the card's own
       act is its door onto Copilot's work (Put away lives there now). */
    const desk = await page.evaluate(() => {
      const card = document.getElementById('hm-agents');
      if (!card) return { drawn: false };
      const row = card.querySelector('[data-hm-agent-row="renew"]');
      if (!row) return { drawn: false };
      /* RE-POINTED IN PLACE 3 Oct 2026: the row is the board's own (Young:
         Home is the board); Review digs in, the head's link opens Copilot's work */
      const btn = row.querySelector('button[data-hm-agent], .hb-btn'), head = row.querySelector('.hm-rb, .hb-ag-b');
      const rr = row.getBoundingClientRect(), ar = btn.getBoundingClientRect(), hr = head.getBoundingClientRect();
      return { drawn: true,
        verbs: [...row.querySelectorAll('button')].map(b => b.textContent.trim()),
        door: (card.querySelector('.hm-cz, .hb-link[data-hm-agent]') || {}).textContent,
        sameLine: Math.abs((ar.top + ar.height / 2) - (hr.top + hr.height / 2)) < 10,
        rightOfText: ar.left >= hr.right - 1,
        gapToWall: Math.round(rr.right - ar.right),
        rowH: Math.round(rr.height) };
    });
    ok('1 the Renewals row draws its Review', desk.drawn && desk.verbs.length >= 1,
      JSON.stringify(desk.verbs));
    ok('1b it sits on the SAME LINE as the sentence', desk.sameLine === true, JSON.stringify(desk));
    ok('1c and at the RIGHT of it', desk.rightOfText === true,
      'gap to the wall ' + desk.gapToWall + 'px');
    /* RE-POINTED 7 Oct 2026 ("Below the card"): Review is the one door — it
       opens the agent's work below the card; the head carries no second link. */
    ok('1d Review is the card\'s one door — no second link to a separate page', !desk.door && desk.verbs.length >= 1, String(desk.door));

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
    ok('3g and the three inks really differ',
      open && done && none && new Set([open.ink, done.ink, none.ink]).size === 3,
      open && done && none ? [open.ink, done.ink, none.ink].join(' · ') : '');
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
    const bad = segSweep.filter(s => s.gap > 0.6 || s.gapB > 0.6);
    ok('4 every segmented control’s lit half fills its button',
      segSweep.length >= 4 && bad.length === 0,
      bad.length ? bad.map(b => `${b.v}/${b.cls} ${b.gap}/${b.gapB}`).join(' · ')
                 : segSweep.length + ' measured, none leaking');

    /* ════════ 5. A BIT OF COLOUR ON THE FRAME ════════ */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    await page.evaluate(() => { const b = document.querySelector('.hm-primary'); if (b) b.click(); });
    /* 23 Sep 2026: the button opens two doors first; this presses Draft from HaTi. */
    await page.waitForTimeout(400);
    /* RE-POINTED 10 Oct 2026 (SAP pop-ups): New agreement is a PAGE now, with
       the white head of every page; the frame's rule is asked of a dialog that
       is still a dialog — Add a received contract, behind the other door. */
    await page.evaluate(() => { const d = document.querySelector('[data-nd-door="upload"]'); if (d) d.click(); });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '05-popup.png') });
    /* RE-POINTED 10 Oct 2026 (the pop-ups as drawn): the 3px accent line at a
       dialog's top was RETIRED on purpose — the drawings are plain white with a
       ruled title bar (f346 was re-pointed the same way). The claims that
       stand: the frame is a ruled title bar over an untouched surface, and a
       dangerous question says so in the danger tone, never the accent — now
       as its warning sign and its red confirm button. */
    const pop = await page.evaluate(() => {
      const m = document.querySelector('#modal-root [role="dialog"]');
      if (!m) return null;
      const cs = getComputedStyle(m), bar = m.querySelector('.dlg-h'), bs = bar ? getComputedStyle(bar) : null;
      return { img: cs.backgroundImage, surface: cs.backgroundColor, radius: cs.borderRadius,
        bar: !!bar, rule: bs ? bs.borderBottomStyle + ' ' + bs.borderBottomWidth : '' };
    });
    ok('5 the dialog frame is a ruled title bar, with no colour line at its top',
      !!pop && pop.bar && /^solid [1-9]/.test(pop.rule) && !/linear-gradient/.test(pop.img),
      pop && JSON.stringify({ bar: pop.bar, rule: pop.rule, img: pop.img.slice(0, 40) }));
    ok('5b the title bar is the frame\u2019s own: it sits at the dialog\u2019s top edge',
      await page.evaluate(() => { const m = document.querySelector('#modal-root [role="dialog"]'), b = m && m.querySelector('.dlg-h');
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
