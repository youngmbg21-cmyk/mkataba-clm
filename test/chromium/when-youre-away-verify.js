/* WHEN YOU'RE AWAY — THE CARD ON YOU (owner picked "An Away card on You —
   the SAP way", 17 Oct 2026; piece 9 of the sensitive contracts and
   governance plan)

   WHAT THIS PINS, driven in a real browser (the server's walls — who may,
   for whom, never signing, the trail — are f702's)
     1 Settings › You carries a When you're away card across the board:
       "Nobody answers for you while you are away." and Set it up
     2 its drawer asks From, Until and Who answers for you (no Viewer, never
       you); says what they answer and that signing never moves; and says,
       before Save, which of your streams the colleague cannot open
     3 saved: an 'ok', the card says who answers from when to when, "On
       until …", that it ends on its own and each answer says "for …", with
       Change and End it now; Jambo says it too
     4 the stand-in's own You says whom they answer for; the step that names
       the person is theirs to decide, and their yes is recorded "for" the
       person — on the record, in the history line and where the step is drawn
     5 End it now: an 'ok', the card is back to nobody
     6 the owner's three screens: the card and the drawer fit
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/when-youre-away-verify.js */
const fs = require('node:fs');
const path = require('node:path');
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
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

(async () => {
  const h = await H.startHati();
  const W = await H.seedWorkspace(h, { approvalRules: [], contracts: [
    { ...H.fixtureContract('MK-W1', 'Route-to-market distribution', 'Naivas Supermarkets', H.FOLDER_B, 3e6, 'Under Review') },
    { ...H.fixtureContract('MK-W4', 'Pallet wrap supply', 'Mto Packaging', H.FOLDER_A, 1e6, 'Under Review') },
  ] });
  const U = W.users.unrestricted, N = W.users.novalues;
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r-sales', name: 'Sales sign-off', order: 1,
    cond: { type: 'folder', value: H.FOLDER_B }, approver: { kind: 'member', id: U.id, name: U.name } }] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 20000 });
    return page;
  };
  try {
    let page = await open('everything@example.co.ke', 'their-own-pass-9');
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    /* since round 24 (One sheet) the card is a section of rows: its doors sit at the row's end (.st-sa) */
    const readCard = () => until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'you') { setView('team'); settingsGoTab('you'); return null; }
      const c = document.querySelector('[data-st-you-card="away"]'); if (!c) return null;
      const b = document.querySelector('.st-you-board').getBoundingClientRect(), r = c.getBoundingClientRect();
      return { text: c.textContent.replace(/\s+/g, ' ').trim(), wide: Math.abs(r.width - b.width) < 2,
        doors: [...c.querySelectorAll('.st-card-doors button, .st-card-doors a, .st-sa button')].map(x => x.textContent.replace(/[›\s]+$/, '').trim()) };
    }, null, 15000);

    console.log('\n1 · the card');
    let card = await readCard();
    check('1a When you\'re away, across the board: nobody yet, Set it up', !!card && card.wide && /^When you're away (Who answers for you ?)?Nobody answers for you while you are away\./.test(card.text)
      && card.doors.join('|') === 'Set it up', JSON.stringify(card));

    /* RE-POINTED 18 Oct 2026 (the gaps, round 24 as drawn: "When you're away
       opens inside its row"): the same form, Save and Cancel, in its row */
    console.log('\n2 · the form, in its row');
    if (await press('[data-st-you-card="away"] [data-st-rform="me:away"]', '2 Set it up')) {
      const d = await until(() => { const dr = document.getElementById('st-rform'); if (!dr || !dr.closest('[data-st-you-card="away"]')) return null;
        const who = document.getElementById('st-aw-who');
        return who ? { title: dr.getAttribute('aria-label'), from: (document.getElementById('st-aw-from') || {}).value,
          to: (document.getElementById('st-aw-to') || {}).value, people: [...who.options].map(o => o.textContent.trim()),
          body: dr.textContent.replace(/\s+/g, ' ') } : null; });
      check('2a it asks From, Until (a week from today) and who — colleagues only, never you', !!d && d.title === 'When you\'re away' && d.from === day(0) && d.to === day(6)
        && d.people.join('|') === 'Choose a colleague|Amina Otieno|No Values Legal|Restricted Legal', JSON.stringify(d && { ...d, body: undefined }));
      check('2b it says what they answer, and that signing never moves', !!d && /Your approvals and your internal reviews\. Each answer says it was given for you\./.test(d.body)
        && /Never your signing — that stays yours\./.test(d.body), d && d.body.slice(0, 300));
      await page.selectOption('#st-aw-who', W.users.restricted.id);
      const narrow = await until(() => { const t = (document.getElementById('st-aw-reach') || {}).textContent || ''; return /cannot open/.test(t) ? t.trim() : null; });
      /* Restricted Legal opens Procurement only: every other stream Unrestricted can open is named */
      check('2c before Save: "Restricted Legal cannot open … Sales & Route-to-Market … — what waits for you there stays with you."',
        !!narrow && /^Restricted Legal cannot open .*Sales & Route-to-Market.* — what waits for you there stays with you\.$/.test(narrow)
        && !/Procurement/.test(narrow), narrow);
      await page.selectOption('#st-aw-who', N.id);
      const wide = await until(() => { const t = (document.getElementById('st-aw-reach') || {}).textContent || ''; return /can open every/.test(t) ? t.trim() : null; });
      check('2d "No Values Legal can open every stream you can."', wide === 'No Values Legal can open every stream you can.', wide);
      await page.evaluate(v => { const el = document.getElementById('st-aw-to'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }, day(4));
      await shot(page, 'away-drawer-1440x780');
      await press('#st-rform-save', '3 Save');
    }

    console.log('\n3 · saved');
    const told = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /answers for you from/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; });
    check('3a an \'ok\': "No Values Legal answers for you from …"', !!told && /No Values Legal answers for you from /.test(told), told);
    card = await until(() => { const c = document.querySelector('[data-st-you-card="away"]'); const t = c && c.textContent.replace(/\s+/g, ' ').trim();
      return t && /answers your approvals/.test(t) ? { text: t, doors: [...c.querySelectorAll('.st-card-doors button, .st-sa button')].map(x => x.textContent.replace(/[›\s]+$/, '').trim()) } : null; });
    /* re-pointed 19 Oct 2026 (lane F's third pass, round 24 as drawn): the
       stand-in named whole once, then by first name — "Each thing Maria
       answers says 'for Jonas'" */
    check('3b the card: "On until …", who answers from when to when, ends on its own, each answer "for Unrestricted"; Change · End it now', !!card
      && /^When you're away On until .+?\s?No Values Legal answers your approvals and internal reviews from .+ to .+\.\s?It ends on its own\. It never covers signing — that stays yours\. Each thing No answers says “for Unrestricted”\./.test(card.text)
      && card.doors.join('|') === 'Change|End it now', JSON.stringify(card));
    await shot(page, 'away-card-1440x780');
    await page.evaluate(() => renderTeam());
    const jb = await until(() => { const m = String((document.getElementById('st-jb-feed') || {}).textContent || '').replace(/\s+/g, ' ').match(/While you are away[^.]*\./); return m ? m[0] : null; });
    check('3c Jambo: "While you are away, No Values Legal answers your approvals and reviews — never your signing."',
      jb === 'While you are away, No Values Legal answers your approvals and reviews — never your signing.', jb);

    console.log('\n4 · the stand-in');
    const own = page;
    page = await open('novalues@example.co.ke', 'their-own-pass-9');
    const mine = await readCard();
    check('4a their own You says "You answer for Unrestricted Legal until …"', !!mine && /You answer for Unrestricted Legal until /.test(mine.text), mine && mine.text);
    const may = await page.evaluate(async () => { const c = getContract('MK-W1'); if (typeof ensureFull === 'function') await ensureFull(c);
      const d = approvalDecidableNow(c); return d ? d.kind : null; });
    check('4b the step that names Unrestricted Legal is theirs to decide', may === 'rule', may);
    const done = await page.evaluate(async () => { try { return await approvalDecideAsk(getContract('MK-W1'), 'approved'); } catch (e) { return 'threw ' + e.message; } });
    const rec = await page.evaluate(async () => { const r = await fetch('api/contracts/MK-W1', { credentials: 'same-origin' }); const c = await r.json();
      const s = (c.approvalChain || []).find(x => x.ruleId === 'r-sales') || {};
      const a = (c.audit || []).filter(x => x.action === 'Approved').pop() || {};
      const box = document.createElement('div'); box.innerHTML = approvalChainHtml(getContract('MK-W1'));
      return { done: true, status: s.status, by: s.by, for: s.for && s.for.name, line: a.detail || '', drawn: box.textContent.replace(/\s+/g, ' ') }; });
    check('4c their yes is recorded for the person: on the step, in the history line, and where the step is drawn', done === true && rec.status === 'approved'
      && rec.by === 'No Values Legal' && rec.for === 'Unrestricted Legal' && /approved by No Values Legal for Unrestricted Legal/.test(rec.line)
      && /✓ No Values Legal for Unrestricted Legal/.test(rec.drawn), JSON.stringify({ done, ...rec, drawn: rec.drawn.slice(0, 200) }));
    await page.context().close();
    page = own;

    console.log('\n5 · End it now');
    await page.evaluate(() => { setView('team'); settingsGoTab('you'); });
    if (await press('[data-st-you-card="away"] [data-st-away-end]', '5 End it now')) {
      const t = await until(() => { const x = (document.getElementById('toast-root') || {}).textContent || ''; return /yours again/.test(x) ? x.replace(/\s+/g, ' ').trim() : null; });
      card = await until(() => { const c = document.querySelector('[data-st-you-card="away"]'); const x = c && c.textContent.replace(/\s+/g, ' ').trim(); return x && /Nobody answers/.test(x) ? x : null; });
      check('5 an \'ok\', and the card is back to nobody', !!t && /Ended — your approvals and reviews are yours again\./.test(t) && !!card, `${t} / ${card}`);
    }

    console.log('\n6 · the owner\'s three screens');
    await page.evaluate(v => fetch('api/me/away', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deputyId: v.id, from: v.from, to: v.to }) }).then(r => r.json()).then(r => { state.away = r; }), { id: N.id, from: day(0), to: day(4) });
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); renderTeam(); });
      await until(() => !!document.querySelector('[data-st-you-card="away"] .st-aw-chip'));
      const fit = await page.evaluate(() => {
        const c = document.querySelector('[data-st-you-card="away"]'); const r = c.getBoundingClientRect();
        const cut = [...c.querySelectorAll('.st-you-line, .st-card-doors button, .st-aw-chip')].filter(e => e.scrollWidth > e.clientWidth + 1).length;
        return { right: r.right <= innerWidth + 1, cut, page: document.documentElement.scrollWidth - innerWidth };
      });
      await shot(page, `away-card-${vp.width}x${vp.height}`);
      /* the form in its row (round 24 as drawn): its fields and Save on screen */
      await page.evaluate(() => { stRowFormOpen('me:away'); const f = document.getElementById('st-rform'); if (f) f.scrollIntoView({ block: 'center' }); });
      const dr = await until(() => { const d = document.getElementById('st-rform'); if (!d || !document.getElementById('st-aw-who')) return null;
        const r = d.getBoundingClientRect();
        const save = document.getElementById('st-rform-save'); const s = save && save.getBoundingClientRect();
        /* a date is drawn as HaTi's own face beside its hidden box (datePickDress) */
        const shown = el => (el.style.display === 'none' && el.nextElementSibling) ? el.nextElementSibling : el;
        const fields = ['st-aw-from', 'st-aw-to', 'st-aw-who'].map(id => shown(document.getElementById(id)).getBoundingClientRect());
        return { inside: r.right <= innerWidth + 1 && r.left >= -1, save: !!s && s.bottom <= innerHeight + 1 && s.width > 0,
          fields: fields.every(f => f.width > 60 && f.right <= r.right + 1) }; });
      await shot(page, `away-drawer-${vp.width}x${vp.height}`);
      await page.evaluate(() => stRowFormClose());
      check(`6 ${vp.width}×${vp.height}: the card fits uncut; the form, its fields and Save are on screen`, fit.right && fit.cut === 0 && fit.page <= 0
        && !!dr && dr.inside && dr.save && dr.fields, JSON.stringify({ fit, dr }));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
