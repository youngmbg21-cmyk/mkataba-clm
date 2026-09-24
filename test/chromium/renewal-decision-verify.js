#!/usr/bin/env node
/* ============================================================
   THE RENEWAL CARD, AS A READER MEETS IT
   ============================================================
   (Owner-approved 16 Sep 2026: "the whole card as drawn".)

   WHY THIS IS A BROWSER FILE AND NOT A NODE TEST. test/world.js cannot load
   js/ai.js — it says so itself — so renewalCardHtml, where both the owner line
   and the three answers are drawn, is unreachable from jsdom. And not one
   test/chromium/*.html harness loads js/obligations.js, so the card cannot be
   staged on a harness either. This runs the REAL APP: a real server, a real
   sign-in, the real Key terms tab, and real presses. f320 covers the model, the
   sweep and the card's source; this covers the pixels.

   WHAT IT IS ACTUALLY WATCHING FOR. The card has two readings, and the
   dangerous one is the second: a card that says "the reminders have stopped"
   while the sweep is still mailing, or that names somebody as getting reminders
   that are off, is a screen lying about what the product did. Several of these
   checks exist only to catch that.

   The fixture puts one contract squarely inside its renewal window with a
   notice period recorded and a real member as its owner — the shape the whole
   feature is about. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const SHOTS = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'renewal-decision');
/* A harness may PREFER this sandbox's browser; it may not REQUIRE it. Override,
   then the sandbox's copy if it is there, then whatever playwright installed.
   f227 is the net, and it names the path rather than one spelling of its use. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + String(JSON.stringify(detail)).slice(0, 220) : ''}`);
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3500);

    const id = await page.evaluate(() => (state.contracts.find(x => x.status !== 'Declined') || state.contracts[0]).id);
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(2200);
    /* SET THE FIXTURE ON THE LOADED RECORD, not before — opening the room
       re-fetches the whole contract and would replace anything written first.
       The owner is a REAL member, because renewalNoticeTo resolves an owner to
       somebody with an address and a name matching nobody reaches nobody. */
    await page.evaluate(i => {
      const iso = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
      const c = state.contracts.find(x => x.id === i);
      c.status = 'Signed';
      c.execution = { at: new Date().toISOString(), by: 'Amina Otieno' };
      c.expiry = iso(150);
      c.metadata = c.metadata || {};
      c.metadata.expiryDate = iso(150);
      c.metadata.noticePeriodDays = 90;
      c.metadata.renewalType = 'auto-renew';
      c.metadata.confidence = c.metadata.confidence || {};
      c.metadata.confidence.noticePeriodDays = 'high';
      const us = (typeof getUsers === 'function') ? (getUsers() || []) : [];
      const me = us.find(u => /admin@/.test(u.email || '')) || us[0] || {};
      c.owner = { id: me.id, name: me.name };
    }, id);
    await page.click('[data-ws-tab="docs"]'); await page.waitForTimeout(600);
    await page.click('[data-ws-tab="terms"]'); await page.waitForTimeout(1600);

    /* ---- 1 · the question, on the card that already asks everything else --- */
    const undec = await page.evaluate(() => {
      const s = document.getElementById('renewal-section');
      if (!s) return null;
      return {
        text: s.innerText.replace(/\s+/g, ' ').trim(),
        answers: [...s.querySelectorAll('[data-rn-decide]')].map(b => b.getAttribute('data-rn-decide')),
        bands: s.querySelectorAll('[style*="--st-amber-bg"]').length,
      };
    });
    check('1a the three answers are drawn on the card', undec && undec.answers.join(',') === 'renew,renegotiate,lapse', undec && undec.answers);
    check('1b the row says what it is asking', undec && /What did you decide\?/i.test(undec.text));
    /* THE LADDER NAMED IS THE LADDER THAT FIRES. 14/7/1 counts to the DECISION
       date and exists only where a notice period is recorded — which this
       fixture has. A contract without one is told about 90/60/30 instead. */
    check('1c the owner line names the person and the rungs that will actually fire',
      undec && /owns this contract and gets the 14, 7 and 1-day reminders/.test(undec.text),
      undec && undec.text.slice(-130));
    await (await page.$('#renewal-section')).screenshot({ path: path.join(SHOTS, 'card-undecided.png') });

    /* ---- 2 · recording one is a decision, so it is confirmed ----
       GUARDED, because a build without the feature must REPORT its failures
       rather than time out on a locator that will never appear — a run that
       dies at 30 seconds says nothing about the other twenty claims. */
    const canPress = !!(undec && undec.answers.length === 3);
    if (!canPress) {
      ['2a the confirm names what recording it does',
       '2b and takes a reason without demanding one',
       '3a the card states the decision and who took it',
       '3b it quotes the reason somebody actually wrote',
       '3c it says which reminders stopped',
       '3d and does NOT over-claim — the expiry warnings keep running, in words',
       '3e the deadline is not taken off the screen',
       '3f the answers are put away, with the way back beside the unchanged door',
       '3g nobody is named as getting a reminder that has stopped',
       '4a the record carries the answer, the reason and who took it',
       '4b stamped with the question it answered, so it can lapse',
       '4c one English line on the trail, and the trail is intact',
       '4d the overnight desk stops offering it',
       '4e the decisions reading the bell rides on drops it',
       '4e2 and the Map on Home moves it to the "decision made" pile',
       '4f Insights agrees it is decided — no second answer on a second screen',
       '5a the question comes back',
       '5b but nothing is un-recorded, so a mis-press costs nothing',
       '5c and the card does not promise reminders that are still off',
       '6a correcting the notice period lapses the answer',
       '6b and the nags start again on their own',
      ].forEach(n => check(n, false, 'no answer to press on this build'));
      check('7 no page errors — clean', errs.length === 0, errs.slice(0, 2));
      const p0 = results.filter(r => r.pass).length;
      console.log(`\n${p0}/${results.length} checks passed`);
      await browser.close(); await h.stop();
      process.exit(p0 === results.length ? 0 : 1);
    }
    await page.click('[data-rn-decide="renegotiate"]');
    await page.waitForTimeout(700);
    const dlg = await page.evaluate(() => {
      const ov = document.getElementById('prompt-overlay');
      const t = ov && ov.querySelector('textarea, input');
      /* The word that makes the reason optional is on the BOX, not in the
         prose — read it where it lives rather than where it reads. */
      return { open: !!ov, box: !!t, ph: t ? (t.getAttribute('placeholder') || '') : '',
        txt: ov ? ov.innerText.replace(/\s+/g, ' ').trim() : '' };
    });
    check('2a the confirm names what recording it does', dlg.open && /reminders/i.test(dlg.txt), dlg.txt.slice(0, 120));
    check('2b and takes a reason without demanding one', dlg.box && /optional|frivilligt/i.test(dlg.ph), dlg.ph);
    const box = await page.$('#prompt-overlay textarea, #prompt-overlay input');
    if (box) await box.fill('Volumes are up 30% and their price review clause is one-sided.');
    await page.evaluate(() => {
      const go = [...document.querySelectorAll('#prompt-overlay button')].find(b => /record it|registrera/i.test(b.textContent || ''));
      if (go) go.click();
    });
    await page.waitForTimeout(1400);

    /* ---- 3 · the decided reading ---- */
    const dec = await page.evaluate(() => {
      const s = document.getElementById('renewal-section');
      if (!s) return null;
      return { text: s.innerText.replace(/\s+/g, ' ').trim(),
        answers: s.querySelectorAll('[data-rn-decide]').length,
        change: !!s.querySelector('[data-rn-change]'),
        start: !!s.querySelector('[data-rn-start]') };
    });
    check('3a the card states the decision and who took it', dec && /We will renegotiate\./.test(dec.text) && /Decided by /.test(dec.text), dec && dec.text.slice(0, 120));
    check('3b it quotes the reason somebody actually wrote', dec && /price review clause is one-sided/.test(dec.text));
    check('3c it says which reminders stopped', dec && /decision reminders have stopped/i.test(dec.text));
    /* THE ONE THAT MATTERS MOST. Two ladders run and only one is silenced by a
       decision to renegotiate. A flat "the reminders have stopped" would be a
       promise the sweep does not keep, and the first 60-day mail after a
       decision would be the reader finding that out. */
    check('3d and does NOT over-claim — the expiry warnings keep running, in words',
      dec && /still be told 90, 60 and 30 days/i.test(dec.text));
    check('3e the deadline is not taken off the screen', dec && /Decide-by was /.test(dec.text));
    check('3f the answers are put away, with the way back beside the unchanged door',
      dec && dec.answers === 0 && dec.change && dec.start, dec);
    check('3g nobody is named as getting a reminder that has stopped',
      dec && !/owns this contract and gets/.test(dec.text));
    await (await page.$('#renewal-section')).screenshot({ path: path.join(SHOTS, 'card-decided.png') });

    /* ---- 4 · the record, the trail, and the surfaces that were nagging ---- */
    const rec = await page.evaluate(async i => {
      if (window.flushSaves) await flushSaves();
      const c = state.contracts.find(x => x.id === i);
      const d = c.renewalDecision || {};
      return { answer: d.answer, why: d.why, byId: !!(d.by && d.by.id), byName: d.by && d.by.name,
        stamped: !!(d.expiry && d.decideBy && d.notice != null),
        audit: (c.audit || []).filter(a => a.action === 'Renewal decision').length,
        trail: (c.audit || []).length,
        desk: (window.deskItems ? deskItems() : []).filter(x => x.kind === 'renewal' && x.cid === i).length,
        home: (window.hmDashSlices ? hmDashSlices().decisions : []).filter(x => x.c.id === i).length,
        /* THE MAP (24 Sep 2026) reads the renewal card's own reading of the
           decision, so an answer moves its contract into the "made" pile of the
           month its term ends — asked of the reading, not the pixels. */
        mapMade: window.hmMapData ? hmMapData().months.some(M => M.made.ids.includes(i)) : null,
        mapDue: window.hmMapData ? hmMapData().months.some(M => M.due.ids.includes(i)) : null,
        insights: window.pfRenewalDecided ? pfRenewalDecided(c) : null };
    }, id);
    check('4a the record carries the answer, the reason and who took it', rec.answer === 'renegotiate' && /price review/.test(rec.why || '') && rec.byId && !!rec.byName, rec.answer);
    check('4b stamped with the question it answered, so it can lapse', rec.stamped === true);
    check('4c one English line on the trail, and the trail is intact', rec.audit === 1 && rec.trail > 1, { audit: rec.audit, trail: rec.trail });
    check('4d the overnight desk stops offering it', rec.desk === 0, rec.desk);
    /* RE-POINTED IN PLACE 24 Sep 2026: "Needs your decision" LEFT HOME on the
       owner's word; the reading it drew (hmDashSlices().decisions) is kept and
       is what the bell's renewal rows ride on, so the claim is unchanged and
       only its name moved. The Map is the new place a renewal shows on Home. */
    check('4e the decisions reading the bell rides on drops it', rec.home === 0, rec.home);
    check('4e2 and the Map on Home moves it to the "decision made" pile',
      rec.mapMade === true && rec.mapDue === false, { made: rec.mapMade, due: rec.mapDue });
    check('4f the Insights renewal-runway panel agrees it is decided', rec.insights === true, rec.insights);

    /* ---- 5 · changing the decision asks again without un-recording it ---- */
    await page.click('[data-rn-change]');
    await page.waitForTimeout(700);
    const again = await page.evaluate(i => {
      const s = document.getElementById('renewal-section');
      const c = state.contracts.find(x => x.id === i);
      return { answers: s.querySelectorAll('[data-rn-decide]').length,
        text: s.innerText.replace(/\s+/g, ' ').trim(),
        stillOnRecord: !!(c.renewalDecision && c.renewalDecision.answer) };
    }, id);
    check('5a the question comes back', again.answers === 3, again.answers);
    check('5b but nothing is un-recorded, so a mis-press costs nothing', again.stillOnRecord === true);
    /* WHILE THE STANDING ANSWER HOLDS, THE SWEEP IS STILL SILENT — so a line
       promising reminders would be false for as long as the reader took to
       choose. This is the posture that check 3g cannot reach. */
    check('5c and the card does not promise reminders that are still off',
      !/owns this contract and gets/.test(again.text));

    /* ---- 6 · the answer lapses when the question moves ---- */
    const lapse = await page.evaluate(i => {
      const c = state.contracts.find(x => x.id === i);
      c.metadata.noticePeriodDays = 60;
      return { decided: renewalDecided(c), stale: renewalDecisionStale(c),
        desk: (window.deskItems ? deskItems() : []).filter(x => x.kind === 'renewal' && x.cid === i).length };
    }, id);
    check('6a correcting the notice period lapses the answer', lapse.decided === false && lapse.stale === true, lapse);
    check('6b and the nags start again on their own', lapse.desk === 1, lapse.desk);

    check('7 no page errors — clean', errs.length === 0, errs.slice(0, 2));
  } catch (e) {
    check('RUN COMPLETED', false, String((e && e.message) || e));
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log(`screenshots → ${SHOTS}`);
  process.exit(pass === results.length ? 0 : 1);
})();
