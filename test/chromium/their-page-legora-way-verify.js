/* THEIR PAGE, THE LEGORA WAY (owner picked "The Legora Way" for the other side's page, 24 Oct 2026)
   ====================================================================================================
   What the counterparty sees on the Redlines tab, as drawn:
     1  the tabs a grey track with one white pill, and the head row no taller for it;
     2  the paper and the change list two floating white cards; the wording where it stood;
     3  each change says where it sits: "§2 · “…the changed words…”";
     4  chips per pile + All, each counted as its pile; a press shows that pile alone, All brings all back;
     5  the box at the foot writes to us through the Notes drawer's own send (one door);
     6  their rows keep Ladder (owner, 24 Oct 2026: "Keep it");
     7  the head names the round and who it is with; no progress pile on their page;
     8  at the owner's three screens: nothing sideways, the foot box inside its card.
   Red at the parent: 1–5, 7 (the tabs underlined, no cards, no §, no chips, no box, no round line).

   Run: node test/chromium/their-page-legora-way-verify.js */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers.js');

const OUT = path.join(__dirname, 'shots', 'their-page-legora-way');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let pass = 0, fail = 0;
const check = (ok, name, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { const t0 = Date.now(); for (;;){ let v = null; try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; if (Date.now() - t0 > ms) return null; await page.waitForTimeout(150); } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati(); const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    /* OUR SIDE files two changes, the way a person does (the funnel), then shares a negotiation link */
    const own = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    await own.goto(h.base + '/', { waitUntil: 'networkidle' });
    await own.fill('#li-email', 'admin@example.co.ke'); await own.fill('#li-pass', 'adminpassword1'); await own.click('#li-go');
    await own.waitForFunction(() => typeof setView === 'function' && window.state && state.contracts && state.contracts.length > 0, null, { timeout: 15000 });
    await until(own, () => !!(state.contracts || []).find(x => x.id === 'MK-B2' || x.contractNo === 'MK-B2'), null, 15000);
    const id = await own.evaluate(async () => {
      const c0 = state.contracts.find(x => x.id === 'MK-B2' || x.contractNo === 'MK-B2'); const c = getContract(c0.id);
      if (c._light && window.ensureFull) await ensureFull(c);
      const L = negoClauseList(c).filter(x => String(x.text || '').length > 60);
      await negoEditClause(c, L[1].clauseId, '<p>' + String(L[1].text).replace(/\.\s*$/, '') + ', confirmed in writing.</p>', { side: 'owner', author: 'Amina Odhiambo', why: 'Our standard.' });
      await negoEditClause(c, L[2].clauseId, '<p>' + String(L[2].text).replace(/within \d+ days/, 'within 5 days') + '</p>', { side: 'owner', author: 'Amina Odhiambo', why: 'We need more time to inspect.' });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); return c.id;
    });
    await until(own, cid => { const c = getContract(cid); return !!(c && (c.changes || []).length >= 2); }, id);
    await own.waitForTimeout(800);
    const cur = await W.admin.json('/api/contracts/' + id); delete cur._v;
    check((cur.changes || []).length >= 2, '0  the two changes are on the stored record', (cur.changes || []).length);
    const r = await W.admin.json('/api/shares', { method: 'POST', body: { payload: { kind: 'hati-share', purpose: 'negotiate', org: 'Highland Corporate', sharedBy: 'Amina Odhiambo', contract: cur },
      recipient: { name: 'Naivas Supermarkets', email: 'legal@naivas.example' }, channel: 'link', purpose: 'negotiate' } });
    const token = r.token || (r.link || '').split('share=')[1];
    check(!!token, '0  a negotiation link is minted');

    for (const [w, hh] of SCREENS){
      const ctx = await browser.newContext({ viewport: { width: w, height: hh } }); const page = await ctx.newPage();
      page.on('pageerror', e => errs.push(`${w}: ${e.message}`));
      await page.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
      const tab = await until(page, () => !!document.querySelector('[data-pt-tab="redlines"]'), null, 10000);
      if (tab) await page.click('[data-pt-tab="redlines"]');
      const up = await until(page, () => !!document.querySelector('#pt-nego [data-nego-card]'), null, 10000);
      if (!up){ check(false, `${w}x${hh}: their Redlines tab is drawn`); await ctx.close(); continue; }
      await page.mouse.move(2, hh - 2);   /* the pointer off the tabs, so a hover is not what is measured */
      await until(page, () => { const t = document.querySelector('#pw-page .pw-tab[aria-selected="true"]'); return !!t && t.getAttribute('data-pt-tab') === 'redlines'; }, null, 4000);
      /* the chosen tab's white fades in (the shared button transition): ask for the settled state, bounded */
      await until(page, () => { const t = document.querySelector('#pw-page .pw-tab[aria-selected="true"]'); return !!t && /^rgb\(/.test(getComputedStyle(t).backgroundColor); }, null, 3000);
      const M = await page.evaluate(() => {
        const cs = s => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; };
        const g = v => { const p = document.createElement('span'); p.style.background = v; document.body.appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; };
        const tabs = cs('#pw-page .pw-tabs'), on = cs('#pw-page .pw-tab[aria-selected="true"]'), off = cs('#pw-page .pw-tab[aria-selected="false"]');
        const row = document.querySelector('.pw-id-row2'), rr = row && row.getBoundingClientRect();
        const tr = document.querySelector('.pw-tabs').getBoundingClientRect();
        const doc = cs('#rl-doc'), side = cs('#rl-side');
        const first = document.querySelector('#rl-doc .nego-doc h1, #rl-doc .nego-doc h2, #rl-doc .nego-doc p, #rl-doc .rl-paper p');
        return { track: tabs.backgroundColor, trackWant: g('var(--surface-2)'), onBg: on.backgroundColor, white: g('var(--color-surface)'),
          onFw: parseInt(on.fontWeight, 10), offFw: parseInt(off.fontWeight, 10), onUl: parseFloat(on.borderBottomWidth) > 0 && on.borderBottomStyle !== 'none',
          rowH: rr ? Math.round(rr.height) : null, tabsH: Math.round(tr.height),
          docCard: { bg: doc.backgroundColor, r: doc.borderTopLeftRadius, sh: doc.boxShadow }, sideCard: { bg: side.backgroundColor, r: side.borderTopLeftRadius, sh: side.boxShadow, bl: side.borderLeftWidth },
          first: first ? Math.round(first.getBoundingClientRect().top) : null,
          sideways: document.scrollingElement.scrollWidth - innerWidth };
      });
      const tag = `${w}x${hh}:`;
      check(M.track === M.trackWant && M.onBg === M.white && M.onFw > M.offFw && !M.onUl, `1  ${tag} the tabs are the grey track with the chosen one a white pill, heavier, no underline`, M);
      check(M.rowH != null && M.rowH <= 28, `1  ${tag} the tab row is no taller for the pill (28px, as the underlined row was)`, { row: M.rowH, tabs: M.tabsH });
      const floats = c => c.bg === M.white && parseFloat(c.r) >= 16 && /8px 28px/.test(c.sh || '');
      check(floats(M.docCard) && floats(M.sideCard) && M.sideCard.bl === '0px', `2  ${tag} the paper and the change list are two floating white cards`, { doc: M.docCard, side: M.sideCard });
      check(M.first === 258, `2  ${tag} the wording's first line stands where it stood (258)`, M.first);

      const ex = await page.evaluate(() => [...document.querySelectorAll('#pt-nego .rl-card-ex')].map(e => e.innerText.trim()));
      check(ex.length >= 2 && ex.every(t => /^§\d+(\.\d+)* · “.+”$/.test(t)), `3  ${tag} each change says where it sits: § and the words in quotes`, ex);

      const chips = await page.evaluate(() => {
        const piles = [...document.querySelectorAll('#pt-nego .rl-pile')].map(p => ({ b: p.getAttribute('data-rl-pile'), n: p.querySelectorAll('[data-nego-card]').length, hidden: p.hidden }));
        const cs = [...document.querySelectorAll('#pt-nego [data-rl-pile-chip]')].map(b => ({ k: b.getAttribute('data-rl-pile-chip'), n: Number((b.querySelector('b') || {}).textContent), on: b.getAttribute('aria-pressed') }));
        return { piles, cs };
      });
      const total = chips.piles.reduce((a, p) => a + p.n, 0);
      const matches = chips.piles.every(p => chips.cs.some(c => c.k === p.b && c.n === p.n));
      const all = chips.cs.find(c => c.k === 'all');
      check(chips.cs.length === chips.piles.length + 1 && matches && all && all.n === total && all.on === 'true',
        `4  ${tag} one chip per pile, counted as its pile, then All (pressed)`, chips);
      if (w === 1440 && chips.piles.length && chips.cs.length){   /* a page without chips reports above, it does not stall here */
        const first = chips.piles[0].b;
        await page.click(`#pt-nego [data-rl-pile-chip="${first}"]`);
        const only = await page.evaluate(k => [...document.querySelectorAll('#pt-nego .rl-pile')].every(p => p.hidden === (p.getAttribute('data-rl-pile') !== k))
          && document.querySelector(`#pt-nego [data-rl-pile-chip="${k}"]`).getAttribute('aria-pressed') === 'true', first);
        await page.click('#pt-nego [data-rl-pile-chip="all"]');
        const back = await page.evaluate(() => [...document.querySelectorAll('#pt-nego .rl-pile')].every(p => !p.hidden));
        check(only && back, `4  ${tag} a chip shows its pile alone, All brings every pile back`, { only, back });
      }

      const lad = await page.evaluate(() => [...document.querySelectorAll('#pt-nego [data-nego-card]')].filter(c => !!c.querySelector('[data-rl-ladder]')).length);
      check(lad >= 1, `6  ${tag} their rows keep the Ladder`, lad);
      const head = await page.evaluate(() => ({ round: ((document.querySelector('#rl-side .rl-round-at') || {}).textContent || '').trim(),
        progress: !!document.querySelector('#pt-nego .rl-progress-pile, #pt-nego [data-rl-progress]') }));
      check(/^Round \d+ · from Highland Corporate$/.test(head.round), `7  ${tag} the head names the round and who it is with`, head.round);

      const foot = await page.evaluate(() => { const f = document.querySelector('#rl-side .pt-write'), s = document.querySelector('#rl-side'); if (!f) return null;
        const a = f.getBoundingClientRect(), b = s.getBoundingClientRect(); const top = document.elementFromPoint(a.left + 30, a.top + a.height / 2);
        return { inside: a.bottom <= b.bottom + 1 && a.left >= b.left && a.right <= b.right + 1, painted: !!(top && f.contains(top)), ph: document.getElementById('pt-write-in').placeholder }; });
      check(!!foot && foot.inside && foot.painted && foot.ph === 'Write to Highland Corporate…', `5  ${tag} the box at the foot stands inside the change card, painted, "Write to Highland Corporate…"`, foot);
      check(M.sideways <= 0, `8  ${tag} nothing scrolls sideways`, M.sideways);

      if (w === 1440){
        await page.screenshot({ path: path.join(OUT, '1440x780-redlines.png') });
        if (!(await page.$('#pt-write-in'))){ check(false, '5  the box at the foot is there to write in'); await ctx.close(); continue; }
        await page.fill('#pt-write-in', 'Can we keep 3 days if you inspect at the gate?');
        await page.press('#pt-write-in', 'Enter');
        const opened = await until(page, () => document.getElementById('pt-notes').classList.contains('open')
          && /inspect at the gate/.test((document.querySelector('#pt-notes-body .rl-np-in') || {}).value || ''), null, 5000);
        await page.getByRole('button', { name: 'Send to Highland Corporate', exact: true }).last().click().catch(() => {});
        const asked = await until(page, () => !!document.querySelector('input[placeholder="Your full name"]'), null, 4000);
        if (asked){ await page.fill('input[placeholder="Your full name"]', 'Wanjiru Kamau'); await page.getByRole('button', { name: 'Save', exact: true }).click().catch(() => {}); }
        const landed = await until(page, () => /inspect at the gate/.test((document.getElementById('pt-notes-body') || {}).innerText || ''), null, 8000);
        const stored = landed ? await W.admin.json(`/api/contracts/${id}/messages`).catch(() => null) : null;
        const onRecord = !!(stored && JSON.stringify(stored).includes('inspect at the gate'));
        check(!!opened && !!landed, '5  the box hands its words to the Notes drawer\'s own composer and send, and the note lands', { opened: !!opened, landed: !!landed, onRecord });
        await page.screenshot({ path: path.join(OUT, '1440x780-note-sent.png') });
      } else {
        await page.screenshot({ path: path.join(OUT, `${w}x${hh}-redlines.png`) });
      }
      await ctx.close();
    }
  } catch (e) {
    check(false, 'the run finished', e.message);
  }
  check(errs.length === 0, 'no page errors', errs.slice(0, 3).join(' | '));
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
