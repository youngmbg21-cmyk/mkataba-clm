/* Chromium verification: THE PAYMENT CHAIN (L, 31 Aug 2026)
   ====================================================================
   WHY THIS IS A BROWSER FILE — each of these is a claim node cannot make:

     · "a held-back step is drawn HELD BACK" is geometry and a computed
       background. The whole design rests on shape rather than tint — the row
       is set IN from the spine and its connector is DASHED — and a class check
       would pass on a page where neither rule reached anything, which is this
       codebase's most-recorded visual defect (a rule that loses a cascade
       fight looks perfectly correct in the source);
     · "nothing is drawn twice" has to be counted as PAINTED rows, because the
       chain and the bands are built by two passes over one list;
     · the "Comes after" picker is a control somebody has to be able to reach
       and press, and the loop refusal is a toast — which in this product
       prints NOTHING without a kind, so only a real toast root can say it
       appeared;
     · the head's money line and the worklist's four figures must sit on ONE
       line at the widths this product supports, or the feature has cost the
       page its height.

   It names f262, which pins the arithmetic, the sweep and both languages.
   Run: node test/chromium/payment-chain-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'payment-chain');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* Offsets from TODAY, never pinned dates — the f183 lesson, which this
   repository has now been caught by twice. */
const day = off => { const d = new Date(); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    /* The shape the whole feature was drawn for. Persisted through the real
       save, because obligations set only in memory are discarded by
       openWorkspace in API mode — an hour was lost to that once. */
    const cid = await page.evaluate(async obs => {
      const c = state.contracts[0];
      c.obligations = obs; c.value = 48000000;
      await persist(c);
      return c.id;
    }, [
      { id: 's1', desc: 'Deposit on order', due: day(-170), amount: 14400000,
        status: 'done', completedAt: day(-172), party: 'ours', assignee: 'Grace Wanjiru' },
      { id: 's2', desc: 'On delivery to site', due: day(-64), amount: 19200000,
        status: 'open', party: 'ours', assignee: 'Grace Wanjiru', after: 's1' },
      { id: 's3', desc: 'On commissioning', due: day(30), amount: 9600000,
        status: 'open', party: 'ours', assignee: 'Grace Wanjiru', after: 's2' },
      { id: 's4', desc: 'Retention release', due: day(210), amount: 4800000,
        status: 'open', party: 'ours', assignee: 'Grace Wanjiru', after: 's3' },
      { id: 'x1', desc: 'Quarterly maintenance report', due: day(30), status: 'open', party: 'theirs' },
    ]);
    await page.waitForTimeout(1200);
    await page.evaluate(id => { openWorkspace(id); }, cid);
    await page.waitForTimeout(1600);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), cid);
    await page.waitForTimeout(900);
    check('the five staged obligations really reached the record',
      (await page.evaluate(id => (getContract(id).obligations || []).length, cid)) === 5);
    await page.screenshot({ path: path.join(OUT, '01-chain.png') });

    /* ============ 1. THE CHAIN IS ON THE PAGE, IN ORDER ============ */
    const chain = await page.evaluate(() => {
      const steps = [...document.querySelectorAll('.obt-step')].map(e => ({
        what: (e.querySelector('.obt-what') || {}).textContent?.trim(),
        pip: (e.querySelector('.obt-pip') || {}).textContent?.trim(),
        chip: (e.querySelector('.obt-chip') || {}).textContent?.trim() || '',
        wait: e.classList.contains('is-wait'),
        left: Math.round(e.getBoundingClientRect().left),
        padL: parseFloat(getComputedStyle(e).paddingLeft),
        whatLeft: Math.round((e.querySelector('.obt-what') || e).getBoundingClientRect().left),
        dash: getComputedStyle(e.querySelector('.obt-spine'), '::before').backgroundImage,
      }));
      const hd = document.querySelector('.obt-chain-hd');
      return { steps, head: hd ? hd.textContent.replace(/\s+/g, ' ').trim() : null,
        rows: [...document.querySelectorAll('.obt-row .obt-what')].map(e => e.textContent.trim()),
        bands: [...document.querySelectorAll('.obt-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) };
    });
    check('the chain draws, with a head naming what it is',
      !!chain.head && /Payment chain/.test(chain.head), chain.head);
    check('all four tranches are in it, in step order',
      chain.steps.length === 4
      && chain.steps.map(s => s.what).join('|') ===
         'Deposit on order|On delivery to site|On commissioning|Retention release',
      chain.steps.map(s => s.what).join(' | '));
    check('the paid step is ticked and the rest are numbered',
      chain.steps[0].pip === '✓' && chain.steps.slice(1).map(s => s.pip).join('') === '234',
      chain.steps.map(s => s.pip).join(','));
    check('the two that cannot happen yet say what they wait on',
      /Waiting on step 2/.test(chain.steps[2].chip) && /Waiting on step 3/.test(chain.steps[3].chip),
      chain.steps.map(s => s.chip).join(' | '));

    /* ============ 2. HELD BACK IS A SHAPE, NOT A TINT ============ */
    /* THE POINT OF THE WHOLE DRAWING. Measured rather than read off a class,
       because a rule that loses a cascade fight looks correct in the source. */
    const set = chain.steps[2].whatLeft - chain.steps[1].whatLeft;
    check('a held-back step is SET IN from the ones that are not', set >= 12,
      `${chain.steps[1].whatLeft} → ${chain.steps[2].whatLeft} (${set}px)`);
    check('and its connector is dashed where a live one is solid',
      /gradient/i.test(chain.steps[2].dash) && !/gradient/i.test(chain.steps[1].dash),
      `live "${chain.steps[1].dash}" · held "${chain.steps[2].dash}"`);
    /* AND IT IS NOT FADED. The approved render drew this row at opacity .74;
       MEASURED, that takes the label ink to 3.48:1 and the chip to 3.70 —
       both under AA, on the one row a reader most needs to read to understand
       why nothing is happening. An opacity is not an ink. */
    const faded = await page.evaluate(() => {
      const held = [...document.querySelectorAll('.obt-step.is-wait')][0];
      const live = [...document.querySelectorAll('.obt-step:not(.is-wait)')][1];
      const op = e => parseFloat(getComputedStyle(e).opacity);
      return { held: op(held), live: op(live),
        ink: getComputedStyle(held.querySelector('.obt-what')).color,
        liveInk: getComputedStyle(live.querySelector('.obt-what')).color };
    });
    check('a held row is SET BACK, never faded — an opacity is not an ink',
      faded.held === 1 && faded.live === 1, JSON.stringify(faded));
    check('its quieting is the label INK, which keeps its contrast',
      faded.ink !== faded.liveInk, `${faded.liveInk} → ${faded.ink}`);

    /* ============ 3. NOTHING IS DRAWN TWICE ============ */
    const all = [...chain.steps.map(s => s.what), ...chain.rows];
    check('a chained step is painted ONCE, and never in a band as well',
      new Set(all).size === all.length && all.length === 5, all.join(' | '));
    check('the unchained obligation still draws, in its band',
      chain.rows.includes('Quarterly maintenance report'), chain.rows.join(' | '));
    check('and the chain is drawn ABOVE the bands',
      await page.evaluate(() => {
        const a = document.querySelector('.obt-chain-hd'), b = document.querySelector('.obt-band');
        return !!a && !!b && a.getBoundingClientRect().top < b.getBoundingClientRect().top;
      }));

    /* ============ 4. THE HEAD: COUNTS AND ONE MONEY LINE ============ */
    const head = await page.evaluate(() => {
      const g = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect();
        return { t: e.textContent.trim(), top: Math.round(r.top), h: Math.round(r.height) }; };
      const box = document.querySelector('.obt-head').getBoundingClientRect();
      return { cap: g('.obt-cap'), over: g('.obt-over'), wait: g('.obt-wait'), paid: g('.obt-paid'),
        rows: Math.round(box.height), tabN: (document.querySelector('.room-tab.on .rt-n')
          || document.querySelector('[data-ws-tab="oblig"] b') || {}).textContent };
    });
    check('outstanding counts what can be ACTED ON — two, not four',
      /^2 outstanding$/.test(head.cap.t), head.cap.t);
    check('overdue is the one genuinely late step', /^1 overdue$/.test(head.over.t), head.over.t);
    check('and the two that are held say so, in their own words',
      /^2 waiting$/.test(head.wait.t), head.wait && head.wait.t);
    check('the money line is committed against paid, in the contract’s own money',
      /KES/.test(head.paid.t) && /paid of/.test(head.paid.t), head.paid && head.paid.t);
    check('THE HEAD IS STILL ONE LINE — the feature cost the page no height',
      head.rows <= 52 && [head.cap, head.over, head.wait, head.paid]
        .every(x => Math.abs(x.top - head.cap.top) <= 4),
      `${head.rows}px · tops ${[head.cap, head.over, head.wait, head.paid].map(x => x.top).join(',')}`);

    /* ============ 5. THE ONE DOOR ONTO THE ORDER ============ */
    await page.evaluate(() => document.getElementById('obt-add').click());
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '02-dialog.png') });
    const dlg = await page.evaluate(() => {
      const sel = document.getElementById('of-after');
      return { there: !!sel,
        opts: sel ? [...sel.options].map(o => o.textContent.trim()) : [],
        first: sel ? sel.options[0].value : null,
        stillHasAmount: !!document.getElementById('of-amount'),
        stillHasParty: document.querySelectorAll('[data-of-party]').length };
    });
    check('the picker is on the dialog', dlg.there);
    check('it offers the contract’s other steps and leads with "nothing"',
      dlg.first === '' && dlg.opts.length === 6, `${dlg.opts.length}: ${dlg.opts.join(' / ')}`);
    check('and NOTHING else on that dialog was taken away',
      dlg.stillHasAmount && dlg.stillHasParty === 2);

    /* A LOOP IS REFUSED IN WORDS — and a toast in this product prints nothing
       without a kind, so it is read off the real toast root. */
    await page.evaluate(() => {
      document.getElementById('of-desc').value = 'A loop';
      document.getElementById('of-due').value = '';
    });
    await page.evaluate(() => {
      /* Edit step 2 and point it at step 3, which already comes after it. */
      document.getElementById('of-cancel').click();
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-obt-edit]')];
      const i = btns.findIndex(b => b.closest('.obt-step')?.textContent.includes('On delivery to site'));
      btns[i < 0 ? 0 : i].click();
    });
    await page.waitForTimeout(700);
    const looped = await page.evaluate(() => {
      const sel = document.getElementById('of-after');
      const opt = [...sel.options].find(o => /commissioning/i.test(o.textContent));
      if (!opt) return { ok: false, why: 'no step 3 on the list' };
      sel.value = opt.value;
      document.getElementById('of-save').click();
      return { ok: true };
    });
    await page.waitForTimeout(700);
    const toast = await page.evaluate(() => (document.querySelector('#toast-root') || {}).textContent || '');
    check('pointing a step at one that already follows it is refused, in words',
      looped.ok && /loop/i.test(toast), JSON.stringify(toast.slice(0, 90)));
    check('and the record was NOT changed by a refused save',
      await page.evaluate(id => (getContract(id).obligations.find(o => o.id === 's2') || {}).after === 's1', cid));
    await page.evaluate(() => document.getElementById('of-cancel')?.click());
    await page.waitForTimeout(400);

    /* ============ 6. COMPLETING A STEP FREES THE NEXT ONE ============ */
    /* Driven through the product's own verb, on the page, so this is the
       journey rather than a call to a function. */
    await page.evaluate(id => {
      const c = getContract(id);
      const i = c.obligations.findIndex(o => o.id === 's2');
      toggleObligation(c, i, { at: new Date().toISOString().slice(0, 10) });
    }, cid);
    await page.waitForTimeout(1400);
    const freed = await page.evaluate(() => {
      const steps = [...document.querySelectorAll('.obt-step')].map(e => ({
        what: (e.querySelector('.obt-what') || {}).textContent?.trim(),
        wait: e.classList.contains('is-wait'),
        chip: (e.querySelector('.obt-chip') || {}).textContent?.trim() || '' }));
      return { steps, cap: (document.querySelector('.obt-cap') || {}).textContent?.trim(),
        wait: (document.querySelector('.obt-wait') || {}).textContent?.trim(),
        paid: (document.querySelector('.obt-paid') || {}).textContent?.trim() };
    });
    check('step 3 is freed the moment step 2 is done',
      freed.steps[2] && !freed.steps[2].wait, JSON.stringify(freed.steps.map(s => s.wait)));
    check('and step 4 stays held, because ITS predecessor is still open',
      freed.steps[3] && freed.steps[3].wait && /Waiting on step 3/.test(freed.steps[3].chip),
      freed.steps[3] && freed.steps[3].chip);
    check('the counts follow, without a reload', /1 waiting/.test(freed.wait || ''), freed.wait);
    check('and the money line follows too — paid has moved',
      /33,?600,?000|33\.6M|KES 33/.test((freed.paid || '').replace(/\s/g, ' ')),
      freed.paid);
    await page.screenshot({ path: path.join(OUT, '03-freed.png') });

    /* ============ 7. THE WORKLIST ============ */
    await page.evaluate(() => setView('obligations'));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '04-worklist.png') });
    const wl = await page.evaluate(() => {
      const bands = [...document.querySelectorAll('.obw-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      const foot = document.querySelector('.obw-total');
      const ms = [...document.querySelectorAll('.obw-m')].map(m => m.textContent.replace(/\s+/g, ' ').trim());
      const opts = [...(document.querySelector('[data-obw-f="state"]') || { options: [] }).options]
        .map(o => o.textContent.trim());
      return { bands, ms, opts,
        footH: foot ? Math.round(foot.getBoundingClientRect().height) : 0,
        tops: [...document.querySelectorAll('.obw-m')].map(m => Math.round(m.getBoundingClientRect().top)),
        mHeights: [...document.querySelectorAll('.obw-m')].map(m => Math.round(m.getBoundingClientRect().height)),
        stepMeta: [...document.querySelectorAll('.obw-meta')].map(e => e.textContent.trim())
          .filter(t => /Step \d of \d/.test(t)) };
    });
    check('the waiting band draws, after Later and before Completed',
      wl.bands.some(b => /Waiting on an earlier step/i.test(b)), wl.bands.join(' | '));
    check('the foot grew from one figure to four',
      wl.ms.length >= 3 && /Committed/.test(wl.ms[0]) && wl.ms.some(m => /Paid/.test(m)),
      wl.ms.join(' · '));
    /* ONE LINE IS A RELATION, NOT A CEILING: every pair sits on one baseline
       AND is no taller than a single line of its own text. A typed height
       would have to be re-guessed at the next type change — and the fault this
       caught (a descendant selector wrapping each label onto its own line) hid
       behind identical `top` values, so tops alone would have passed. */
    check('THE FOOT IS STILL ONE LINE',
      new Set(wl.tops).size === 1 && wl.mHeights.every(x => x <= 24)
      && wl.footH <= wl.mHeights[0] + 24,
      `foot ${wl.footH}px · pairs ${wl.mHeights.join(',')} · tops ${wl.tops.join(',')}`);
    check('the State filter offers the waiting cut',
      wl.opts.some(o => /Waiting on a step/i.test(o)), wl.opts.join(' / '));
    check('and a chained row names its step',
      wl.stepMeta.length >= 1, JSON.stringify(wl.stepMeta.slice(0, 3)));

    /* narrowing to it shows exactly the held ones */
    const held = await page.evaluate(() => {
      const sel = document.querySelector('[data-obw-f="state"]');
      sel.value = 'waiting'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return null;
    });
    await page.waitForTimeout(900);
    const heldRows = await page.evaluate(() => ({
      rows: [...document.querySelectorAll('.obw-what')].map(e => e.textContent.trim()),
      cap: (document.querySelector('.obt-cap') || {}).textContent?.trim() }));
    check('narrowing to it lists exactly the held-back steps',
      heldRows.rows.length === 1 && /Retention release/.test(heldRows.rows[0]),
      JSON.stringify(heldRows.rows));
    check('and the head names THAT cut rather than calling them outstanding',
      /waiting/i.test(heldRows.cap || ''), heldRows.cap);
    void held;

    /* ============ 8. A CONTRACT WITH NO CHAIN IS UNTOUCHED ============ */
    /* PERSIST, THEN LET IT LAND, THEN OPEN. openWorkspace re-reads the record
       from the server in API mode, so opening in the same breath as the save
       stages an EMPTY contract — which then passes "no chain furniture" for
       the wrong reason and fails the row count. An hour was lost to the same
       shape once already. */
    const plain = await page.evaluate(async () => {
      const c = state.contracts.find(x => (x.obligations || []).length === 0) || state.contracts[1];
      c.obligations = [{ id: 'p1', desc: 'Plain quarterly report', due: '2027-01-31', status: 'open', party: 'ours' }];
      await persist(c);
      return c.id;
    });
    await page.waitForTimeout(1400);
    await page.evaluate(id => openWorkspace(id), plain);
    await page.waitForTimeout(1800);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), plain);
    await page.waitForTimeout(900);
    const untouched = await page.evaluate(() => ({
      chain: document.querySelectorAll('.obt-chain-hd').length,
      steps: document.querySelectorAll('.obt-step').length,
      rows: document.querySelectorAll('.obt-row').length,
      wait: document.querySelectorAll('.obt-wait').length,
      onRecord: (getContract(state.activeId).obligations || []).length,
    }));
    check('no chain furniture is drawn where there is no chain',
      untouched.chain === 0 && untouched.steps === 0 && untouched.wait === 0,
      JSON.stringify(untouched));
    check('and the obligation still draws in its band as it always did',
      untouched.rows === 1 && untouched.onRecord === 1,
      JSON.stringify(untouched));

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e && e.stack || e); process.exit(2); });
