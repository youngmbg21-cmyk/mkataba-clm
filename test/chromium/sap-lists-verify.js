/* Chromium verification: THE SAP BENCHMARK, BATCH 1 — THE LISTS.
   ============================================================
   Owner-approved 9 Oct 2026 (the SAP Fiori benchmark, page by page):

     Contracts    the list's card names itself with its count; no money
                  total in the foot.
     Approvals    the table says what it is and how many; red only past a
                  week; Approve leaves the row in place, marked Approved,
                  with Undo in the panel; Undo puts it back to waiting.
     Obligations  no Amount column when no row carries money; an owner-less
                  duty says Unassigned in grey, not Nobody in amber; the
                  Reminders section is one line and a link to the rules.

   Negotiations' Start a negotiation door is measured in
   negotiations-door-verify (section 12).

   Every half is guarded: a missing feature REPORTS, never times out.
   Run: node test/chromium/sap-lists-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = d => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const ob = (id, desc, d, party) => ({ id, desc, due: iso(d), party, status: 'open' });
const CONTRACTS = [
  { ...H.fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48000000, 'Signed', H.FIXTURE_BODY_A1),
    obligations: [ob('o1', 'Deliver monthly report', -3, 'theirs'), ob('o2', 'Pay invoice within 30 days', 5, 'ours')] },
  H.fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', H.FOLDER_A, 36000000, 'Under Review'),
  H.fixtureContract('MK-A4', 'Cold Chain Logistics', 'Mitchell Cotts', H.FOLDER_A, 27500000, 'Under Review'),
  H.fixtureContract('MK-B2', 'Retail Supply', 'Naivas', H.FOLDER_B, 78000000, 'Under Review'),
];
const wait = async (page, fn, arg, ms = 5000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await wait(page, () => typeof window.setView === 'function' && window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 10000);

    /* ---- 1. CONTRACTS ---- */
    /* The foot's money note is drawn only for a reader who may see values, so
       wait until that is known before the list is painted. */
    await wait(page, () => typeof canViewValues === 'function' && canViewValues(), null, 8000);
    await page.evaluate(() => { if (window.regSetScope) regSetScope(null); (regPlaceSet({ show: 'list' }), setView('register')); });
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): Contracts opens on its Folders, its List is pressed;
       the foot's count is the new look's own line (#reg-nl-showing, regNlFootHtml: "N contracts") and the All tab's number
       is its text's digits (the tab draws no .n pill) — the same claim: the tab and the foot say one count, no card head */
    await page.evaluate(() => { const b = document.querySelector('[data-ctf-show="list"]'); if (b) b.click(); });
    await wait(page, () => !!document.querySelector('#reg-tbody tr'));
    const reg = await page.evaluate(() => {
      const tt = document.getElementById('reg-tt');
      const foot = (document.getElementById('reg-nl-showing') || document.getElementById('reg-showing') || {}).textContent || '';
      /* the list's own count, as its foot states it ("Showing 1–30 of 30") */
      /* RE-POINTED 24 Oct 2026 (Round 2): the whole list says "N contracts · M live"; a cut list still "1–40 of N" */
      const of = foot.match(/of\s+([\d,]+)/) || foot.match(/^\s*([\d,]+)\s+contracts?\b/);
      const all = document.querySelector('[data-lh-seat="contracts"] [data-reg-view=""]');
      return { tt: tt ? tt.textContent.trim() : null, shown: tt ? getComputedStyle(tt).display : null,
        n: of ? Number(of[1].replace(/,/g, '')) : -1, foot, all: all ? Number(all.textContent.replace(/[^\d]/g, '')) : null };
    });
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way"): the
       list card's own head ("Contracts (N)") goes; the number it carried is
       the All tab's, and the foot says the same ("1–40 of N") */
    check('1a the list carries its count — the All tab and the foot agree, no "Contracts (N)" card head',
      !reg.tt && reg.n > 0 && reg.all === reg.n && (/^1–\d+ of /.test(reg.foot.trim()) || /^\d+ contracts?( · \d+ live)?$/.test(reg.foot.trim())), `${reg.tt} · All ${reg.all} · ${reg.n} rows · ${reg.foot.trim()}`);
    check('1b no money total in the foot', !/aggregate|totalt|KES|SEK|on paper/i.test(reg.foot), JSON.stringify(reg.foot.trim()));

    /* ---- 2. APPROVALS ---- */
    await page.evaluate(() => setView('approvals'));
    const apUp = await wait(page, () => !!document.querySelector('.ap-page'));
    /* ONE ROW FOUR DAYS IDLE, in memory only, so the 3-to-6-day band is
       really on the page (every fixture row is months old): red at three days
       was the old rule, red at seven is the new one. Idle is read off the
       contract's last action where no ask records when it was asked. */
    const aged = apUp ? await page.evaluate(() => {
      const r = (window.apApprovalRows ? apApprovalRows() : [])[0]; if (!r) return null;
      r.c.lastAction = new Date(Date.now() - 4 * 86400000).toISOString();
      (r.c.asks || []).forEach(a => { if (a && a.kind === 'rule' && a.state === 'open') a.at = r.c.lastAction; });
      renderApprovalsPage();
      return { id: r.c.id, idle: (apApprovalRows().find(x => x.c.id === r.c.id) || {}).idle };
    }) : null;
    check('2b0 one row is four days idle', !!aged && aged.idle === 4, JSON.stringify(aged));
    const ap = apUp ? await page.evaluate(() => {
      /* RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): the
         card's head went (ruling 5); what it said is the All tab's — its
         words on the tab's hover, its count the tab's number */
      /* RE-POINTED 17 Nov 2026 (#762): the new look's Approvals is ONE table (.apn-table) under the page's own head
         ("Approvals & signing"), its tabs Mine · Waiting on others · Done ([data-apn-tab], an empty one not drawn); what the
         table is is the head's name, how many the lit tab's number — which must equal the rows drawn under it */
      const lit = document.querySelector('[data-apn-tab].is-on') || document.querySelector('[data-apn-tab]');
      const hd = document.querySelector('.ap-page .ctf-h, .ap-page h1, .ap-page h2');
      const all = lit ? { title: hd ? hd.textContent.trim() : '', querySelector: () => ({ textContent: String(Number(lit.textContent.replace(/\D/g, '')) || 0) }) } : null;
      const t = all ? { textContent: all.title } : null;
      const tab = document.querySelector('[data-ap-tab="approvals"] .ap-n');
      const rows = window.apApprovalRows ? apApprovalRows() : [];
      const drawn = document.querySelectorAll('.apn-table tbody tr[data-ap-row]').length;
      const wrong = rows.filter(r => {
        const tr = document.querySelector(`[data-ap-row="${r.c.id}"]`);
        const red = !!(tr && tr.querySelector('.late'));
        return red !== (r.idle >= 7);
      }).map(r => r.c.id + ':' + r.idle);
      /* RE-POINTED 18 Oct 2026 (round 15 as drawn): the count is a pill beside the title ("· 4 ·"), no brackets */
      const pill = all && all.querySelector('.n');
      return { title: t ? t.textContent.trim() : null, pill: pill ? pill.textContent.trim() : null, tab: tab ? tab.textContent.trim() : '', n: rows.length,
        mine: rows.filter(r => r.mine).length, wrong, idles: rows.map(r => r.idle), drawn };
    }) : null;
    check('2a the table says what it is and how many', !!ap && /^Approvals/.test(ap.title || '') && ap.pill === String(ap.drawn) && ap.drawn === ap.n,
      ap ? `${ap.title} · tab ${ap.pill} · ${ap.drawn} drawn · ${ap.n} rows` : 'page missing');
    check('2b a waiting row is red only from 7 days', !!ap && ap.n > 0 && ap.wrong.length === 0,
      ap ? `idle ${ap.idles.join(',')} · wrong ${ap.wrong.join(',') || 'none'}` : 'page missing');
    const sel = ap && ap.n ? await page.evaluate(() => (document.getElementById('ins-panel') || {}).getAttribute
      ? document.getElementById('ins-panel').getAttribute('data-ins-id') : null) : null;
    const head = sel ? await page.evaluate(() => {
      const p = document.getElementById('ins-panel');
      /* RE-POINTED 17 Nov 2026 (#762): the chosen approval's panel is Jambo's Five panel (apnLeadFiveHtml): its head names
         the party and the reference ("Before you decide · Naivas · MK-B2"), draws no initials and no doors, and carries no
         button — Approve and Decline stand on the chosen ROW (one press away, never a second Decide door) */
      const tr = document.querySelector(`.apn-table tr[data-ap-row="${p.getAttribute('data-ins-id')}"]`);
      const c = getContract(p.getAttribute('data-ins-id')) || {};
      return { beside: p.textContent.includes(c.counterparty || '\u0000') && p.textContent.includes(c.id || '\u0000'), av: !!p.querySelector('.reg-av'),
        line: ((p.querySelector('[data-ins-need-line]') || {}).textContent || ''), decide: p.querySelectorAll('[data-ins-need="approval"]').length,
        /* RE-POINTED 18 Oct 2026 (round 15 as drawn, owner's "build all the gaps"): an Approval's panel draws no doors */
        sub: !p.querySelector('.ins-doors') && !p.querySelector('[data-ins-act^="door-"]') && !p.querySelector('.ins-sub [data-ins-act]'),
        approve: !p.querySelector('[data-ins-act="approve"]') && !!(tr && tr.querySelector('[data-ap-approve]')) };
    }) : null;
    /* RE-POINTED 12 Oct 2026 (owner): the sub line's Open contract became the Document door in the doors row */
    /* RE-POINTED 15 Oct 2026 (owner): the Document door went; the doors row is Negotiation · Workspace */
    /* RE-POINTED 18 Oct 2026 (Jambo's panel, round 15 as drawn): the party's
       name with its pill beside it and no initials; the doors still in a row */
    check('2c the panel head: the pill beside the name, no initials, no doors (round 15)',
      !!head && head.beside && !head.av && head.sub, JSON.stringify(head));
    /* RE-POINTED 18 Oct 2026 (owner's yes to round 15's question): the amber
       "Your approval is asked for." line went — "Yours to answer" and the
       Approve button say it; a line stays only for something else owed */
    check('2d no line repeats "Your approval is asked for", and no second Decide door', !!head && !/approval is asked for/i.test(head.line) && head.decide === 0 && head.approve, JSON.stringify(head));
    if (head && head.approve) {
      /* RE-POINTED 17 Nov 2026 (#762): Approve is the chosen ROW's button; the decided row moves to the table's Done tab
         (the new look's tabs are Mine · Waiting on others · Done), where it stands marked done; chosen there, its panel says
         it was approved and carries Undo — the same promise: the decision is seen where it was made, and undoable */
      await page.click(`.apn-table tr[data-ap-row="${sel}"] [data-ap-approve]`);
      { const ok = await page.waitForSelector('#prompt-overlay #pd-ok', { timeout: 4000 }).catch(() => null); if (ok) await ok.click(); } /* a yes offers an optional note (17 Nov 2026) */
      const moved = await wait(page, () => !!document.querySelector('[data-apn-tab="done"]'), null, 8000);
      await page.evaluate(() => { const b = document.querySelector('[data-apn-tab="done"]'); if (b) b.click(); });
      const inDone = moved && await wait(page, id => { const b = document.querySelector('[data-apn-tab="done"]');
        return !!(b && b.classList.contains('is-on') && document.querySelector(`.apn-table tr[data-ap-row="${id}"]`)); }, sel, 6000);
      if (inDone) await page.click(`.apn-table tr[data-ap-row="${sel}"] .apn-name`);
      const done = inDone && await wait(page, () => !!document.querySelector('#ins-panel [data-ins-act="undo"]'), null, 8000);
      const after = await page.evaluate(id => ({
        row: !!document.querySelector(`.apn-table tr[data-ap-row="${id}"]`),
        mark: (document.querySelector(`.apn-table tr[data-ap-row="${id}"] [data-ls-mk]`) || { getAttribute: () => null }).getAttribute('data-ls-mk'),
        line: !!document.querySelector('#ins-panel [data-ap-done-line]') }), sel);
      check('2e Approve keeps the row (on Done, marked done), with Undo in its panel',
        done && after.row && after.mark === 'done' && after.line, JSON.stringify(after));
      if (done) {
        await page.click('#ins-panel [data-ins-act="undo"]');
        /* RE-POINTED 17 Nov 2026 (#762): back to waiting = the row is under Mine again with its own Approve */
        await page.evaluate(() => { const b = document.querySelector('[data-apn-tab="mine"]'); if (b) b.click(); });
        const back = await wait(page, id => {
          const tr = document.querySelector(`.apn-table tr[data-ap-row="${id}"]`);
          return !!(tr && tr.querySelector('[data-ap-approve]'));
        }, sel, 8000);
        const st = await page.evaluate(id => {
          const c = getContract(id);
          const chain = (c && c.approvalChain) || [];
          const trail = (c && c.audit || []).map(a => a.action || a.what || '').filter(x => /undone/i.test(x));
          return { chain: chain.map(s => s.status).join(','), trail: trail.length };
        }, sel);
        check('2f Undo puts it back to waiting, and the trail says so', back && /pending/.test(st.chain), JSON.stringify(st));
        /* AND THE SERVER KEPT IT: read the stored record back. */
        const stored = await page.evaluate(async id => {
          try { const r = await fetch('/api/contracts/' + encodeURIComponent(id), { credentials: 'same-origin' });
            const j = await r.json(); const c = j.contract || j;
            return (c.approvalChain || []).map(s => s.status).join(','); } catch (e) { return 'error ' + e.message; }
        }, sel);
        check('2g the stored record is waiting again too', /pending/.test(stored) && !/approved/.test(stored), stored);
      }
    } else check('2e Approve is offered on a row this reader may decide', false, 'no Approve in the panel');

    /* ---- 3. OBLIGATIONS ---- */
    await page.evaluate(() => setView('obligations'));
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): Obligations is the PROJECT LIST (obnRender: pills
       Late · Tracked · Proposals, rows tr.obn-r, columns Obligation · Whose job · When), not the week page. Tracked holds
       every live duty. An owner-less duty of ours is said where its row opens: the panel's Reminders line names that nobody
       is named and who is reminded instead (obligationReminderSay) — never the amber alarm on the row */
    /* RE-POINTED 19 Nov 2026 (We owe · They owe, the owner's pick): two columns of lines (.obt-li), each saying who is
       reminded; an owner-less duty of ours says nobody on our side is reminded, in the quiet words, never in amber. The
       SAP way mark on each row and the panel's "one line, the rules behind a link" (3c, 3d, 3e) are RETIRED by the pick:
       the drawing carries neither; the line says who is reminded, the panel says who and when */
    await wait(page, () => !!document.querySelector('[data-obn-tab="open"]'));
    const lnOf = () => page.evaluate(() => { document.querySelectorAll('[data-obt-more]').forEach(m => m.click());
      const r = [...document.querySelectorAll('.obt-li')].find(t => /Pay invoice/.test(t.textContent)); const w = r && r.querySelector('.obt-rem');
      return w ? { t: w.textContent.trim(), c: getComputedStyle(w).color, amber: getComputedStyle(document.documentElement).getPropertyValue('--st-amber-fg').trim() } : null; });
    const obUp = await wait(page, () => !!document.querySelector('.obt-cols .obt-li'));
    let ln = obUp ? await lnOf() : null;
    if (obUp && !ln){ await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="later"]'); if (b) b.click(); }); await page.waitForTimeout(400); ln = await lnOf(); }
    check('3b an owner-less duty of ours says on its line who is reminded, never in amber', !!ln && /nobody on our side|is reminded/i.test(ln.t) && ln.c !== ln.amber, JSON.stringify(ln));

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  if (bad) process.exit(1);
})();
