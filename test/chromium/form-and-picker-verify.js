/* Chromium verification: THE FORM AND THE PICKER
   ==============================================
   Young, 20 Sep 2026, off two screenshots and a pop-up:
     "the entry field for the end Date and value stream are overlapping"
     "even through I have answered which side we are on, i still get an error"
     "review the pop up in image 3 … it works easily without adding any
      confusion in how to navigate and use"

   THREE OF THE FOUR RULINGS ARE PIXELS OR PRESSES and cannot be read off the
   source — f340 pins the declarations, this drives the screens.

   THE OVERLAP IS STAGED, AND THE STAGING IS THE HONEST PART. MEASURED,
   Chromium wants 151px for a date control and never blows out at any width
   this dialog can reach; Safari on the reporter's iPad draws "20. Sep 2026"
   with a stepper and wants far more than the 226px share. So the CONDITION is
   staged — a control that wants more room than its column — with structural
   selectors that bite on both builds, and nothing in the product's own markup
   is touched to do it. At the parent that prints 203px of form painted over
   the contract preview; here it prints 0.

   Run: node test/chromium/form-and-picker-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'form-and-picker');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

/* Safari's date control, staged. Structural only — `.field-grid` exists on one
   build and not the other, and a selector that misses is a green run. */
const WIDE = '#ce-cols > div:first-child input[type=date],'
           + '#wz-cols > div:first-child input[type=date]{width:340px!important}';

/* What a reader sees: every field's PAINTED right edge (the box or the control
   inside it, whichever reaches further) against the grid and against the
   contract beside it. */
const MEASURE = () => {
  const g = document.querySelector('#ce-cols > div:first-child, #wz-cols > div:first-child');
  if (!g) return { err: 'no field grid on screen' };
  const gr = g.getBoundingClientRect();
  const pane = document.querySelector('#ce-cols > :nth-child(2), #wz-cols > :nth-child(2)');
  const px = pane ? pane.getBoundingClientRect().x : null;
  let pastGrid = 0, overPane = 0, widest = '';
  for (const c of g.children) {
    const r = c.getBoundingClientRect();
    const paint = Math.max(r.right, ...[...c.querySelectorAll('input,select')]
      .map(e => e.getBoundingClientRect().right));
    if (Math.round(paint - gr.right) > pastGrid) {
      pastGrid = Math.round(paint - gr.right);
      widest = ((c.querySelector('span') || {}).textContent || '').trim().slice(0, 22);
    }
    if (px != null) overPane = Math.max(overPane, Math.round(paint - px));
  }
  return { cols: getComputedStyle(g).gridTemplateColumns, pastGrid, overPane, widest,
    hasPane: px != null, cells: g.children.length };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2600);
    await page.addStyleTag({ content: WIDE });

    /* ═══════ 1 · THE OVERLAP, ON BOTH DOORS THAT DRAW A PREVIEW ═══════ */
    for (const [open, name, n] of [
      [`openContractEssentials({title:'Procurement Value Stream Agreement',blurb:'Converted from a .docx',paper:()=>'<h1>MASTER PROCUREMENT AND SUPPLY AGREEMENT</h1><p>x</p>',onCreate(){},onSkip(){}})`, 'the converted-document door', '1'],
      [`openWizard('RM')`, 'the template answer step', '2'],
    ]) {
      await drive(page, async fn => { try { closeModal(); } catch (_) {} await eval(fn); }, open, null);
      await pause(900);
      const m = await drive(page, MEASURE, undefined, { err: 'blocked' });
      await page.screenshot({ path: path.join(OUT, `0${n}-${name.replace(/\s+/g, '-')}.png`) });
      /* GATED: with no preview beside it there is nothing to paint over, and
         every claim below would pass on a dialog that never drew. */
      check(`${n}a CONTROL — ${name} drew its form beside the contract`,
        !m.err && m.hasPane && m.cells >= 6, m.err || `${m.cells} fields, preview ${m.hasPane}`);
      check(`${n}b no field is painted past its own form — ${name}`,
        !m.err && m.pastGrid <= 0, m.err || `${m.pastGrid}px past, worst: ${m.widest || 'none'}`);
      check(`${n}c and nothing reaches the contract beside it — ${name}`,
        !m.err && m.overPane <= 0, m.err || `${m.overPane}px over the preview`);
      check(`${n}d the columns keep their share whatever the control wants — ${name}`,
        !m.err && /^\d+(\.\d+)?px \d+(\.\d+)?px$/.test(String(m.cols || ''))
          && Math.max(...String(m.cols).split(' ').map(parseFloat)) < 300,
        m.err || String(m.cols));
    }

    /* ═══════ 3 · AN ANSWERED SELECT IS NOT REFUSED, ON THE REAL SCREEN ═══════ */
    await drive(page, async () => { try { closeModal(); } catch (_) {} openWizard('RM'); }, undefined, null);
    await pause(900);
    const answered = await drive(page, () => {
      const set = (id, v) => { const el = document.getElementById(id); if (!el) return false;
        el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return el.value === v; };
      const ok = set('wz-side', 'customer');
      set('wz-counterparty', 'Saint Gobain');
      set('wz-value', '6000000');
      return { sideSet: ok, side: (document.getElementById('wz-side') || {}).value };
    }, undefined, { sideSet: false });
    check('3a CONTROL — "Which side are we on?" really is answered',
      answered.sideSet && answered.side === 'customer', JSON.stringify(answered));
    const refusal = await drive(page, async () => {
      const seen = [];
      const was = window.toast;
      window.toast = (msg, kind) => { seen.push(String(msg) + ' [' + kind + ']'); };
      document.getElementById('wz-create').click();
      await new Promise(r => setTimeout(r, 1400));
      window.toast = was;
      const err = document.getElementById('wz-err');
      return { toasts: seen, inline: err ? String(err.textContent || '').trim() : '',
        stillOpen: !!document.getElementById('wz-create') };
    }, undefined, { toasts: ['blocked'], inline: '' });
    const said = refusal.toasts.join(' | ') + ' ' + refusal.inline;
    check('3b Create is not refused for a select that was answered',
      !/must be one of/i.test(said), said.trim() || 'nothing was said');
    check('3c and no refusal anywhere names an option as [object Object]',
      !/\[object Object\]/.test(said), said.trim() || 'clean');
    await page.screenshot({ path: path.join(OUT, '03-create-pressed.png') });

    /* ═══════ 4 · THE PICKER ═══════ */
    const staged = await drive(page, () => {
      try {
        const cur = (typeof customTemplates === 'function') ? customTemplates() : [];
        saveCustomTemplates([...cur,
          { id: 'ct_v1', name: 'Our saved services agreement', description: 'saved here', folder: 'corp', text: 'Body {{counterparty}}' },
          { id: 'ct_v2', name: 'Our saved supply agreement', description: 'saved too', folder: 'proc', text: 'B {{counterparty}}' }]);
        return { mine: customTemplates().length };
      } catch (e) { return { err: String((e && e.message) || e) }; }
    }, undefined, { mine: 0 });
    check('4a CONTROL — this workspace has its own paper to show',
      staged.mine >= 2, JSON.stringify(staged));

    await drive(page, async () => { try { closeModal(); } catch (_) {} openWizard(); }, undefined, null);
    await pause(1100);
    const picker = await drive(page, () => {
      const pick = document.getElementById('wz-pick');
      const root = pick ? pick.closest('div').parentElement : document.body;
      const seen = el => { const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
      const own = [...root.querySelectorAll('[data-wz-mine],[data-wz-lib]')].filter(seen);
      const forYou = [...root.querySelectorAll('[data-wz-tid]')].filter(seen);
      const cancel = document.getElementById('wz-pick-cancel');
      return { ownVisible: own.length, forYouVisible: forYou.length,
        ownTop: own.length ? Math.round(own[0].getBoundingClientRect().y) : null,
        forYouTop: forYou.length ? Math.round(forYou[0].getBoundingClientRect().y) : null,
        cancel: !!(cancel && seen(cancel)), cancelText: cancel ? cancel.textContent.trim() : '',
        say: !!document.getElementById('dr-say'),
        streams: root.querySelectorAll('[data-wz-stream]').length };
    }, undefined, { err: 'blocked' });
    await page.screenshot({ path: path.join(OUT, '04-picker.png') });

    check('4b your own paper is ON the front screen, not only behind a folder',
      picker.ownVisible >= 2, `${picker.ownVisible} own cards visible`);
    check('4c and it leads, above the paper HaTi ships',
      picker.ownTop != null && picker.forYouTop != null && picker.ownTop < picker.forYouTop,
      `own at y=${picker.ownTop}, HaTi's at y=${picker.forYouTop}`);
    /* RE-POINTED 21 Sep 2026: the picker is the New agreement pop-up now, and
       the stream FOLDERS are the sentence box's word filter (a stream's name
       is searched) — so the control asks for FOR YOU's chips and the box. */
    check('4d CONTROL — the sentence box and FOR YOU are still there',
      picker.forYouVisible >= 3 && picker.say === true,
      `${picker.forYouVisible} HaTi cards, box ${picker.say}`);
    check('4e there is a visible way out',
      picker.cancel === true, picker.cancel ? picker.cancelText : 'no Cancel drawn');

    const closes = await drive(page, async () => {
      const b = document.getElementById('wz-pick-cancel'); if (!b) return { err: 'no Cancel' };
      b.click(); await new Promise(r => setTimeout(r, 500));
      return { gone: !document.getElementById('wz-pick') };
    }, undefined, { err: 'blocked' });
    check('4f and pressing it closes the picker', closes.gone === true, JSON.stringify(closes));

    /* ═══════ 5 · THE LINE OF BUSINESS REALLY TUNES THE ROW ═══════
       Young, 20 Sep 2026: "does it work? It does not seem to be doing
       anything". It worked on a NEW workspace and could not work on a used
       one — usage filled all four seats first. Staged as the owner's own
       case: five built-ins already drafted from. */
    const usedFive = await drive(page, () => {
      try { closeModal(); } catch (_) {}
      const mk = (tid, n) => { for (let i = 0; i < n; i++)
        state.contracts.push({ id: 'lob' + tid + i, template: tid, name: 'x', status: 'Draft' }); };
      mk('ND', 9); mk('RM', 7); mk('PK', 5); mk('MK', 3); mk('CM', 2);
      const n = id => (typeof builtinUsageCount === 'function') ? builtinUsageCount(id) : 0;
      return { used: ['ND', 'RM', 'PK', 'MK', 'CM'].filter(id => n(id) > 0).length };
    }, undefined, { used: 0 });
    check('5a CONTROL — this workspace has drafted from four or more templates',
      usedFive.used >= 4, `${usedFive.used} templates used — below four the old order never bit`);

    /* THE PAINTED ROW, read off the screen. RE-POINTED 21 Sep 2026: on the
       New agreement pop-up the HaTi chips carry FOR YOU's order (the first
       four are its row) and there is NO eyebrow naming the line of business —
       the artifact draws none, so the heading whose truth 5d/5e measured has
       nothing left to claim. `cards` is the first four chips; `eyebrow` is
       kept as '' so the claims below read as what they now are. */
    const lobRead = async lob => {
      await drive(page, k => { try { closeModal(); } catch (_) {}
        state.settings = state.settings || {}; state.settings.industry = k; openWizard(); }, lob, null);
      await pause(900);
      return drive(page, () => {
        const pick = document.getElementById('wz-pick');
        if (!pick) return { err: 'picker not drawn' };
        const eye = [...pick.querySelectorAll('span')]
          .find(s => getComputedStyle(s).textTransform === 'uppercase' && /for you/i.test(s.textContent));
        const seen = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        return { eyebrow: eye ? eye.textContent.replace(/\s+/g, ' ').trim() : '',
          /* The button's OWN text: its first nested span is the icon's
             wrapper and carries no words. */
          cards: [...pick.querySelectorAll('[data-wz-tid]')].filter(seen).slice(0, 4)
            .map(c => c.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)) };
      }, undefined, { err: 'blocked' });
    };
    const rows = {};
    for (const lob of ['services', 'manufacturing', 'distribution', 'retail']) rows[lob] = await lobRead(lob);
    await page.screenshot({ path: path.join(OUT, '05-line-of-business.png') });

    const drawn = Object.values(rows).filter(r => !r.err && r.cards.length === 4);
    check('5b CONTROL — every line of business drew a row of four',
      drawn.length === 4, drawn.map(r => r.cards.length).join('/') || 'nothing drew');
    const sets = drawn.map(r => r.cards.join(' · '));
    check('5c THE REPORTED FAULT: switching it changes the cards',
      new Set(sets).size === 4, sets.join('   |   ') || 'blocked');
    /* A CONTROL, and it passes at the parent BECAUSE of the fault: the old
       heading named the setting whatever the cards were. 5e is the claim
       that the name is TRUE. */
    check('5d CONTROL — no heading claims a line of business the row does not carry (none is drawn)',
      drawn.length === 4 && drawn.every(r => r.eyebrow === ''),
      drawn.map(r => r.eyebrow || '(none)').join(' | '));
    /* THE HEADING'S CLAIM IS CHECKED AGAINST THE CARDS, never taken on
       trust: on the parent it named retail over four cards with no retail
       paper on them. */
    const retail = rows.retail || {};
    check('5e retail really puts retail paper on the row',
      !retail.err && (retail.cards || []).some(n => /Retail Listing|Distributor/i.test(n)),
      `${retail.eyebrow} → ${(retail.cards || []).join(' · ')}`);
    check('5f and what this workspace actually drafts still leads',
      !retail.err && /NDA|Raw Material/i.test((retail.cards || [])[0] || ''),
      (retail.cards || [])[0] || 'blocked');

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run finished', false, String((e && e.message) || e));
  } finally {
    if (blocked.length) console.log('\nblocked evaluations: ' + blocked.slice(0, 4).join(' | '));
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
