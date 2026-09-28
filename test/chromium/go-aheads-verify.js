/* Chromium verification: THE FOUR GO-AHEADS (Young, 27 Sep 2026: "Merge to
   main and it's a yes on the other 3", and the renewal's Decide).
   ====================================================================
   f396 pins what the code SAYS. This file measures what a reader SEES and
   DOES on the real app, with both seats in real browser pages:

     1  THEY AGREED TO THE WORDING — the other side opens a real signing link,
        presses "Agree to the wording — but don't sign yet", and our alerts
        bell grows a green row that opens the Signing tab
     2  THEIR BELL'S SIGN ROW says what its press does — the Ready to sign
        button's own sentence, read off the button itself
     3  A RENEWAL'S DECIDE READS THE CONTRACT AGAIN — pressed on the side
        panel's checklist, it lands on the Overview and the whole arrival read
        runs again, the brief written afresh; opening the same Overview by the
        ordinary door reads nothing ([control])

   THE STAGE is the seeded workspace, set up through the server's own routes
   BEFORE the owner signs in, so the renewal contract arrives as a register
   row the room still has to load in full — the case the re-read's timing
   guard exists for:
     MK-A2 Nandi Dairy  — a signer named on each side, so a signing link opens
     MK-B2 Naivas       — a negotiation with nothing on the table
     MK-R9 Sendy        — signed, owned by the reader (by name, which is how
                          contractOwnedBy reads an owner with no id), ending in
                          64 days with 30 days' notice, so the renewal decision
                          falls in 34. SEEDED so: a signed record's dates are
                          frozen by the server, rightly, and cannot be staged
                          after the fact.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than timing out.

   AT THE PARENT (ce9cc59), measured in a worktree: 13 of 20 FAIL. The seven
   that pass are the staging lines (the link, 1a, 1b — their agreement did
   reach our record before this change; nothing SAID so — and 3a), 3c
   [control] (the renewal's door landed on the Overview since earlier that
   day) and the page-error sweep. 3h is gated on 3d's stamp, so it cannot
   pass over a reading that never ran. AND AT 65a4bde, the first cut of this
   batch, 3g2, 3j and 3k are RED: the re-read's fill step wrote a signed
   contract's fields on the SECOND reading (Home's row), the server refused
   the save, and the refusal put the old record back over the reading.

   Run: node test/chromium/go-aheads-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner, fixtureContract, FIXTURES, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'go-aheads');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  /* DRAWN FROM ONE OF HaTi'S OWN TEMPLATES, with no stored wording — the
     shape a signed contract made in the product has, and the one that broke:
     its blanks are read off the template, the fill step answered them from
     the record, and the save of a signed contract's `fields` was refused,
     taking every reading of the run down with it (3g). */
  const renewal = { ...fixtureContract('MK-R9', 'Primary Distribution — Nairobi to Coast', 'Sendy Ltd', FOLDER_A, 12000000, 'Signed'),
    expiry: day(64), metadata: { value: 12000000, currency: 'KES', expiryDate: day(64), noticePeriodDays: 30 },
    owner: { name: 'Amina Otieno' } };
  /* RE-POINTED 27 Sep 2026: every fixture is over 5,000,000 and this stage signs
     one, so it states no approval rules — the rulebook's own line for a stage
     that is not about approvals (THE OWNER'S OPEN ITEMS, FIXED). */
  const W = await seedWorkspace(h, { contracts: [...FIXTURES, renewal], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    /* ---- the stage, through the server's own routes ---- */
    await nameASigner(W.admin, 'MK-A2');

    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const own = await ctx.newPage();
    own.on('pageerror', e => errs.push('owner: ' + String(e).slice(0, 200)));
    /* Every call the page makes, with its body, so a claim about what was ASKED
       reads the wire rather than trusting a function was called. */
    const wire = [];
    own.on('request', r => {
      const u = r.url();
      if (/\/api\/(ai\/|contracts\/)/.test(u) && r.method() !== 'GET')
        wire.push({ at: Date.now(), method: r.method(), url: u.replace(h.base, ''), body: r.postData() || '' });
    });
    const refused = [];
    own.on('response', r => {
      if (/\/api\/contracts\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.status() >= 400)
        refused.push(r.status() + ' ' + r.url().replace(h.base, ''));
    });
    await own.goto(h.base + '/', { waitUntil: 'networkidle' });
    await own.fill('#li-email', 'admin@example.co.ke');
    await own.fill('#li-pass', 'adminpassword1');
    await own.click('#li-go');
    await pause(2600);
    await own.keyboard.press('Escape').catch(() => {});
    const en = await own.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await pause(600); }

    /* ================= 1 · THEY AGREED TO THE WORDING ================= */
    const tok = await own.evaluate(async () => {
      const full = await api('contracts/MK-A2');
      const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'sign' });
      const r = await api('shares', 'POST', { payload, channel: 'link', purpose: 'sign', signerId: 'sg-cp-1',
        recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' } });
      return r && r.token || null;
    });
    ok('the stage: a signing link to their signer', !!tok, tok ? 'minted' : 'no token');
    const cp = await ctx.newPage();
    cp.on('pageerror', e => errs.push('counterparty: ' + String(e).slice(0, 200)));
    let agreed = false;
    if (tok) {
      await cp.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
      await pause(2200);
      const nameBox = await cp.$('#pt-name');
      if (nameBox && !(await nameBox.inputValue())) await nameBox.fill('Grace Njeri');
      const other = await cp.$('#pt-other-toggle');
      if (other) { await other.click(); await pause(300); }
      const acc = await cp.$('#pt-accept');
      if (acc) { await acc.click(); await pause(1800); agreed = true; }
    }
    ok('1a on their page, "Agree to the wording — but don\'t sign yet" was there to press', agreed);
    let got = null;
    for (let i = 0; i < 12 && agreed; i++) {
      got = await own.evaluate(async () => { try { await pollPendingResponses(); } catch (_) {}
        const c = getContract('MK-A2'); return c && c.acceptance ? { by: c.acceptance.by } : null; });
      if (got) break;
      await pause(1000);
    }
    ok('1b their agreement reached our record', !!got, JSON.stringify(got));
    await own.evaluate(() => setView('dashboard')); await pause(900);
    await own.click('#hdr-notify'); await pause(700);
    const row = await own.evaluate(() => {
      const r = [...document.querySelectorAll('#context-panel [data-alert-kind="cp-accepted"]')]
        .find(b => b.innerText.includes('MK-A2'));
      return r ? { text: r.innerText.replace(/\s+/g, ' ').trim(), good: r.classList.contains('al-good'),
        kinds: [...document.querySelectorAll('#context-panel [data-alert-kind]')].map(b => b.getAttribute('data-alert-kind')) } : null;
    });
    ok('1c our alerts bell says so, in green, naming who agreed and that nothing is signed yet',
      !!got && !!row && /agreed to the wording/i.test(row.text) && /Grace Njeri/.test(row.text) && /not signed yet/i.test(row.text) && row.good,
      JSON.stringify(row));
    await own.screenshot({ path: path.join(OUT, '1-bell-agreed.png') });
    const pressed = await own.$('#context-panel [data-alert-kind="cp-accepted"]');
    if (pressed) { await pressed.click({ timeout: 5000 }).catch(() => {}); await pause(1600); }
    const land1 = await own.evaluate(() => ({ view: state.view, id: state.activeId,
      tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null }));
    ok('1d pressing it opens that contract on its Signing tab — the next step is a signature',
      !!row && land1.view === 'workspace' && land1.id === 'MK-A2' && land1.tab === 'sign', JSON.stringify(land1));
    /* GUARDED: where there was no row to press, the bell is still open over the
       page — and every press below would wait on a covered element and time
       out rather than report. Closed either way. */
    await own.evaluate(() => { try { closeContextPanel(); } catch (_) {} });
    await cp.close();

    /* ================= 2 · THEIR BELL'S SIGN ROW ================= */
    const tok2 = await own.evaluate(async () => {
      const c = getContract('MK-B2');
      await ensureFull(c); negoInit(c); persist(c); await flushSaves();
      const full = await api('contracts/MK-B2');
      const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'link', purpose: 'negotiate', durable: true,
        recipient: { name: 'Naivas Legal', email: 'legal@naivas.example' } });
      return r && r.token || null;
    });
    const cp2 = await ctx.newPage();
    cp2.on('pageerror', e => errs.push('counterparty 2: ' + String(e).slice(0, 200)));
    let bell2 = null;
    if (tok2) {
      await cp2.goto(h.base + '/#share=t:' + tok2, { waitUntil: 'networkidle' });
      await pause(2600);
      const b = await cp2.$('#pt-bell');
      if (b) { await b.click(); await pause(600); }
      bell2 = await cp2.evaluate(() => {
        const ready = document.getElementById('pt-nego-ready');
        const r = document.querySelector('[data-pt-kind="sign"]');
        return { ready: !!ready, live: !!(ready && !ready.disabled), hover: ready ? ready.getAttribute('title') : null,
          row: r ? r.innerText.trim() : null };
      });
    }
    ok('2a their bell\'s sign row says what its press does — the Ready to sign button\'s own words',
      !!bell2 && bell2.live && !!bell2.row && bell2.row === bell2.hover, JSON.stringify(bell2));
    ok('2b and not that anybody is waiting for them to sign', !!bell2 && !!bell2.row && !/waiting for you to sign/i.test(bell2.row), bell2 && bell2.row);
    await cp2.screenshot({ path: path.join(OUT, '2-their-bell.png') });
    await cp2.close();

    /* ================= 3 · A RENEWAL'S DECIDE READS THE CONTRACT AGAIN ================= */
    const before = await own.evaluate(() => { const c = getContract('MK-R9');
      return { light: !!(c && c._light && !c._loaded), triageAt: c && c.triage ? c.triage.at : null }; });
    await own.evaluate(() => { regSetScope(null); setView('register'); }); await pause(1200);
    const r1 = await own.$('#reg-tbody tr[data-row="MK-R9"]');
    if (r1) { await r1.click({ timeout: 5000 }).catch(() => {}); await pause(700); }
    const decide = await own.$('#ins-panel [data-ins-need="renewal"]');
    const hover = decide ? await decide.getAttribute('title') : null;
    ok('3a the stage: the renewal is on the side panel\'s checklist, with Decide, and the contract is still a register row',
      !!decide && before.light, JSON.stringify({ decide: !!decide, before }));
    ok('3b Decide says on its hover that Copilot will read the contract again', !!hover && /read the contract again/i.test(hover), hover);
    const pressAt = Date.now();
    if (decide) await decide.click({ timeout: 5000 }).catch(() => {});
    let after = null;
    for (let i = 0; i < 40 && decide; i++) {
      await pause(500);
      after = await own.evaluate(() => { const c = getContract('MK-R9');
        return { view: state.view, id: state.activeId, tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null,
          busy: !!(c && c._triaging), triageAt: c && c.triage ? c.triage.at : null,
          steps: c && c.triage ? Object.keys(c.triage.steps || {}) : [], briefAt: c && c._brief ? c._brief.at : null }; });
      if (after.triageAt && Date.parse(after.triageAt) >= pressAt - 1000 && !after.busy) break;
    }
    ok('3c [control] it lands on the contract\'s Overview — the door built earlier the same day', !!after && after.view === 'workspace' && after.id === 'MK-R9' && after.tab === 'terms', JSON.stringify(after));
    ok('3d and the whole arrival read runs again — all five readings, stamped after the press',
      !!after && !!after.triageAt && Date.parse(after.triageAt) >= pressAt - 1000 && !after.busy
        && ['risk', 'brief', 'playbook', 'oblig', 'fill'].every(k => after.steps.includes(k)),
      JSON.stringify({ triageAt: after && after.triageAt, steps: after && after.steps, before: before.triageAt }));
    const asked = wire.filter(x => x.at >= pressAt);
    const briefAsk = asked.find(x => /\/api\/ai\/brief$/.test(x.url));
    let force = null; try { force = briefAsk ? JSON.parse(briefAsk.body).force : null; } catch (_) {}
    ok('3e the brief is written afresh, not handed back from its cache', force === true, briefAsk ? 'force=' + force : 'no brief was asked');
    ok('3f the standards check and the obligations were asked again too',
      asked.some(x => /\/api\/ai\/playbook$/.test(x.url)) && asked.some(x => /\/api\/ai\/obligations$/.test(x.url)),
      asked.map(x => x.url).filter(u => /\/api\/ai\//.test(u)).join(' '));
    /* GATED on a reading having happened: at ce9cc59 nothing read the contract
       at all, and "nothing was refused" would be true of a reading that never
       ran. The refusal itself is caught across the whole run by 3k. */
    ok('3g the record took it — no save refused on a signed contract drawn from a template', refused.length === 0 && !!after && !!after.triageAt,
      refused.join(' | ') || (after && after.triageAt ? 'saved' : 'nothing was read'));
    /* What the reader is looking at once the readings have landed: the strip's
       open-fields tile on a SIGNED contract, and the head's Copilot fact —
       each was wrong the first time a signed contract was read again. */
    const face = await own.evaluate(() => {
      const strip = (document.getElementById('kt-triage-slot') || { innerText: '' }).innerText.replace(/\s+/g, ' ');
      const facts = (document.getElementById('ws-facts') || { innerText: '' }).innerText.replace(/\s+/g, ' ');
      return { strip, facts };
    });
    ok('3g2 a signed contract\'s open-fields tile says it is signed, not "in negotiation"',
      /signed — its wording is final/i.test(face.strip) && !/in negotiation/i.test(face.strip), face.strip.slice(0, 400));
    ok('3g3 and the head\'s Copilot fact follows the reading below it — it no longer says "Not read yet"',
      /copilot/i.test(face.facts) && !/not read yet/i.test(face.facts), face.facts);
    await own.screenshot({ path: path.join(OUT, '3-overview-after-decide.png') });

    /* [control] THE ORDINARY DOOR READS NOTHING. The same Overview, opened from
       the contract rather than from a renewal decision. */
    const stamp = after && after.triageAt;
    const quietFrom = Date.now();
    await own.evaluate(() => { regSetScope(null); setView('register'); }); await pause(1000);
    await own.evaluate(() => { openWorkspace('MK-R9'); }); await pause(900);
    await own.evaluate(() => { const c = getContract('MK-R9'); roomGoTab(c, 'terms'); }); await pause(2500);
    const quiet = await own.evaluate(() => { const c = getContract('MK-R9');
      return { tab: roomCurrentTab(), triageAt: c.triage ? c.triage.at : null, busy: !!c._triaging }; });
    const quietAsks = wire.filter(x => x.at >= quietFrom && /\/api\/ai\//.test(x.url));
    ok('3h [control] opening that Overview by the ordinary door reads nothing again',
      !!stamp && quiet.tab === 'terms' && quiet.triageAt === stamp && !quiet.busy && !quietAsks.length,
      JSON.stringify({ quiet, asks: quietAsks.map(x => x.url) }));

    /* 3i/3j RETIRED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): Home's renewal row left with
       the decisions card. The checklist's Decide (3a–3h) and the bell's rows
       are the doors now; asked here only that Home draws no such row. */
    await own.evaluate(() => setView('dashboard')); await pause(1200);
    const homeRow = await own.$('#hm-dd-rows [data-dd-kind="renewal"]');
    ok('3i Home draws no decisions row any more — the checklist\'s Decide is the door', !homeRow);

    /* AND ACROSS THE WHOLE RUN. The second re-read (Home's row) is where the
       first cut of this batch broke: the fill step wrote a signed contract's
       fields, the server refused the save, and the refusal put the old record
       back — so the reading the reader had just watched was thrown away. */
    ok('3k no save was refused anywhere on the way', refused.length === 0, refused.join(' | '));
    ok('4 no page errors on the way', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
