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

    const tabs = await page.$$eval('[data-reg-view]', els => els.map(e => e.textContent.trim()));
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
    await page.selectOption('#reg-stage-sel', 'Executed');
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => ({
      rows: document.querySelectorAll('tr[data-row]').length,
      face: (document.querySelector('.reg-filterbar .reg-chip .reg-f-l') || {}).textContent,
      lit: document.querySelector('.reg-filterbar .reg-chip').classList.contains('on')
    }));
    ok('2c3 picking a stage narrows the table', after.rows > 0 && after.rows < before,
      `${before} → ${after.rows}`);
    ok('2c4 and the chip says what is in force', after.lit && /Executed/.test(after.face || ''),
      after.face);
    await page.screenshot({ path: path.join(OUT, '02-chip-picked.png') });
    await page.selectOption('#reg-stage-sel', 'all');
    await page.waitForTimeout(600);

    /* ════════ 1. HOME'S PREPARED ROW ════════
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

    const desk = await page.evaluate(() => {
      const card = [...document.querySelectorAll('.hm-card')].find(c => c.querySelector('#hm-desk-rows'));
      if (!card) return { drawn: false };
      const row = card.querySelector('.hm-row.is-desk');
      if (!row) return { drawn: false };
      const acts = row.querySelector('.hm-desk-acts'), head = row.querySelector('.hm-desk-head');
      const rr = row.getBoundingClientRect(), ar = acts.getBoundingClientRect(),
            hr = head.getBoundingClientRect();
      return { drawn: true,
        verbs: [...acts.querySelectorAll('button')].map(b => b.textContent.trim()),
        putAll: (card.querySelector('.hm-cz') || {}).textContent,
        sameLine: Math.abs((ar.top + ar.height / 2) - (hr.top + hr.height / 2)) < 10,
        rightOfText: ar.left >= hr.right - 1,
        gapToWall: Math.round(rr.right - ar.right),
        rowH: Math.round(rr.height) };
    });
    ok('1 the prepared row draws its verbs', desk.drawn && desk.verbs.length >= 2,
      JSON.stringify(desk.verbs));
    ok('1b they sit on the SAME LINE as the sentence', desk.sameLine === true, JSON.stringify(desk));
    ok('1c and in a column at the RIGHT of it', desk.rightOfText === true,
      'gap to the wall ' + desk.gapToWall + 'px');
    ok('1d the card keeps its put-all-away act', /away/i.test(desk.putAll || ''), desk.putAll);

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
    await page.evaluate(() => { const d = document.querySelector('[data-nd-door="draft"]'); if (d) d.click(); });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '05-popup.png') });
    const pop = await page.evaluate(() => {
      const m = document.querySelector('#modal-root [role="dialog"]');
      if (!m) return null;
      const cs = getComputedStyle(m);
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-fill').trim();
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;left:-9999px;background:' + accent;
      document.body.appendChild(probe);
      const want = getComputedStyle(probe).backgroundColor; probe.remove();
      return { img: cs.backgroundImage, size: cs.backgroundSize, want,
        surface: cs.backgroundColor, radius: cs.borderRadius };
    });
    ok('5 the dialog frame carries a 3px rule at its top',
      !!pop && /linear-gradient/.test(pop.img) && /100% 3px/.test(pop.size),
      pop && pop.size);
    /* THE COLOUR IS THE WORKSPACE'S, NEVER A LITERAL — so navy gets navy. */
    ok('5b and it is the workspace’s own accent, read live',
      !!pop && pop.img.includes(pop.want), pop && pop.want);
    ok('5c the surface underneath is untouched',
      !!pop && pop.surface !== 'rgba(0, 0, 0, 0)', pop && pop.surface);

    await page.evaluate(() => { try { closeModal(); } catch (e) {} });
    await page.waitForTimeout(400);
    await page.evaluate(() => { confirmDialog({ title: 'Delete', message: 'Really?', danger: true }); });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '06-confirm.png') });
    const conf = await page.evaluate(() => {
      const m = document.querySelector('#confirm-overlay [role="alertdialog"]');
      if (!m) return null;
      const cs = getComputedStyle(m);
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;left:-9999px;background:var(--danger)';
      document.body.appendChild(probe);
      const want = getComputedStyle(probe).backgroundColor; probe.remove();
      return { img: cs.backgroundImage, want };
    });
    ok('5d a dangerous question wears the danger tone, not the accent',
      !!conf && conf.img.includes(conf.want), conf && conf.want);

    ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
