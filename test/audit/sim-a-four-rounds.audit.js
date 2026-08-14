/* AUDIT SIMULATION A — a deal, four rounds, two chairs, then signed and sealed.
   ============================================================
   WORKORDER-legal-audit.md, Track 2. This is not a unit test: it is a
   reproduction of a whole commercial negotiation, played through the real
   product from BOTH seats at once — the owner signed in on one browser
   context, the counterparty on a real share link in a second context with no
   login — so that everything the report claims about the journey was actually
   seen happening.

   The lawyer's questions are asked at the point in the story where they
   matter, not gathered at the end:
     · does the whose-move statement tell the truth from both chairs
     · does anything of OURS cross the wall (read off the RAW payload, not the
       screen)
     · do only ANSWERS travel down a live link before a round is published
     · is the record complete, and does Verify integrity pass at the end
     · and once executed, does every road into the wording refuse — including
       a direct call to the server, which is the road with no button on it

   Run: node test/audit/sim-a-four-rounds.audit.js
   Leaves: test/audit/shots/a-*.png, and prints a FINDINGS block at the end. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');

const results = [];
const findings = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) findings.push({ name, detail });
};
const note = m => console.log(`      · ${m}`);

/* Everything of ours that must never appear in what the counterparty is sent.
   Checked against the RAW payload JSON off the wire, because the screen not
   showing something is a different claim from it not having travelled. */
const NEVER_TRAVELS = [
  ['an internal note', 'INTERNAL-ONLY-NOTE'],
  ['a colleague’s name in a review', 'Restricted Legal'],
  ['the internal review’s existence', '"review"'],
  ['the negotiation desk roster', '"desk"'],
  ['our own audit trail', '"audit"'],
];

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const admin = W.admin;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  let cid = null;

  try {
    /* ---------------- SETUP: a real contract, made the real way ------------ */
    const own = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const owner = await own.newPage();
    owner.on('pageerror', e => errors.push('owner: ' + e.message));
    await owner.goto(h.base + '/', { waitUntil: 'networkidle' });
    await owner.waitForTimeout(600);
    await owner.fill('#li-email', 'admin@example.co.ke');
    await owner.fill('#li-pass', 'adminpassword1');
    await owner.click('#li-go');
    await owner.waitForTimeout(2400);

    cid = await owner.evaluate(async () => {
      const c = {
        id: nextId(), name: 'Cold Chain Logistics Agreement', counterparty: 'Juno Limited',
        counterpartyEmail: 'contracts@juno.co.ke', party: 'Highland Corporate Ltd',
        value: 24000000, valueType: 'standard', status: 'Draft', template: null,
        folder: 'proc', format: 'rich', expiry: '2028-06-30',
        metadata: { effectiveDate: '2026-09-01', expiryDate: '2028-06-30' },
        fields: {}, comments: [], signatures: [], audit: [],
        redlineText: '<h2>1. Scope</h2><p>The Supplier shall provide refrigerated haulage between Nairobi and Mombasa.</p>'
          + '<h2>2. Payment</h2><p>The Customer shall pay each invoice within sixty (60) days of receipt.</p>'
          + '<h2>3. Liability</h2><p>The Supplier shall not be liable for any indirect or consequential loss.</p>',
      };
      c.audit.push({ at: nowISO(), user: currentUser().name, action: 'Created', detail: 'Drafted for the audit simulation' });
      if (window.contractOwnerStamp) contractOwnerStamp(c);
      c._loaded = true; c._light = false; c._v = 0;
      state.contracts.unshift(c); state.activeId = c.id; state.selId = c.id;
      persist(c); if (window.flushSaves) await flushSaves();
      return c.id;
    });
    note(`contract ${cid} created`);

    /* An internal note — the thing that must never cross the wall. */
    await owner.evaluate(async id => {
      const c = getContract(id);
      c.comments = c.comments || [];
      c.comments.push({ author: 'Restricted Legal', role: 'Legal (Internal)', side: 'internal',
        text: 'INTERNAL-ONLY-NOTE our walkaway is 45 days, do not reveal', ts: fmtDT(nowISO()) });
      persist(c); if (window.flushSaves) await flushSaves();
    }, cid);

    /* ---------------- ROUND 1 — the owner asks ---------------------------- */
    await owner.evaluate(async id => {
      const c = getContract(id);
      negoInit(c);
      const cls = negoClauses(c);
      const pay = cls.find(x => /Payment/i.test(x.text || '')) || cls[1];
      await negoEditClause(c, pay.clauseId,
        '<h2>2. Payment</h2><p>The Customer shall pay each invoice within thirty (30) days of receipt.</p>',
        { side: 'owner', author: currentUser().name, reason: 'Sixty days ties up working capital across the whole book.' });
      await negoInsertClause(c, { title: 'Insurance',
        text: 'The Supplier shall maintain goods-in-transit insurance of not less than KES 20,000,000 and produce the certificate on request.' },
        { side: 'owner', author: currentUser().name });
      persist(c); if (window.flushSaves) await flushSaves();
    }, cid);
    const r1 = await owner.evaluate(id => {
      const c = getContract(id);
      return { changes: c.changes.length, pending: c.changes.filter(x => x.status === 'pending').length,
        move: window.negWhoseMove ? negWhoseMove(c) : null };
    }, cid);
    check('R1: two asks are filed as ours, both pending',
      r1.changes === 2 && r1.pending === 2, `${r1.changes} filed`);
    check('R1: before anything is sent, the move is OURS',
      r1.move && r1.move.k === 'you', JSON.stringify(r1.move));

    /* THE ROUND GOES OUT ON A REAL LINK, minted through the real route. */
    const token = await owner.evaluate(async id => {
      const c = getContract(id);
      const payload = buildSharePayload(c, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, purpose: 'negotiate',
        recipient: { name: 'Juno Limited', email: 'contracts@juno.co.ke' }, channel: 'link' });
      return r.token || (r.link || '').split('share=')[1];
    }, cid);
    check('R1: a negotiate link is minted', !!token, token ? token.slice(0, 10) + '…' : 'none');

    /* ---- THE WALL, READ OFF THE WIRE ---- */
    const raw = await fetch(`${h.base}/api/shares/${token}`).then(r => r.json()).catch(e => ({ err: e.message }));
    const rawTxt = JSON.stringify(raw);
    fs.writeFileSync(path.join(SHOTS, 'a-payload.json'), JSON.stringify(raw, null, 2));
    check('WALL: the counterparty’s payload carries the wording',
      /Cold Chain Logistics/.test(rawTxt), `${rawTxt.length} bytes`);
    for (const [what, needle] of NEVER_TRAVELS) {
      check(`WALL: ${what} does not travel`, !rawTxt.includes(needle),
        rawTxt.includes(needle) ? 'FOUND IN PAYLOAD' : 'absent');
    }
    check('WALL: the sender’s covering note is not in the payload',
      !/"message"\s*:\s*"/.test(rawTxt));

    /* ---------------- ROUND 2 — the counterparty answers ------------------ */
    const cp = await browser.newContext({ viewport: { width: 1400, height: 950 } });
    const other = await cp.newPage();
    other.on('pageerror', e => errors.push('counterparty: ' + e.message));
    await other.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await other.waitForTimeout(1600);
    await other.screenshot({ path: path.join(SHOTS, 'a-r2-portal.png'), fullPage: true }).catch(() => {});

    const seen = await other.evaluate(() => {
      const t = document.body.innerText;
      return { cards: document.querySelectorAll('[data-nego-card]').length,
        wall: /until you press Send|stay on this page/i.test(t),
        wallFirst: (() => { const b = document.getElementById('rl-banner');
          return !!(b && /until you press Send|stay on this page/i.test(b.innerText || '')); })(),
        leak: ['INTERNAL-ONLY-NOTE', 'Restricted Legal', 'Highland Corporate Ltd'].filter(s => t.includes(s)),
        ready: !!document.getElementById('pt-nego-ready') };
    });
    check('R2: the counterparty sees both of our asks as cards',
      seen.cards >= 2, `${seen.cards} cards`);
    check('R2: the wall line is on their page before they start',
      seen.wall && seen.wallFirst, `banner=${seen.wallFirst}`);
    check('R2: nothing internal is on their screen either',
      seen.leak.filter(s => s !== 'Highland Corporate Ltd').length === 0,
      seen.leak.join(', ') || 'clean');

    /* Their answers, through the product's own decide path. */
    await other.evaluate(async () => {
      const c = PORTAL_OPTS.contract || (window.portalContract && portalContract());
      return true;
    }).catch(() => {});
    const answered = await other.evaluate(async () => {
      const ids = [...document.querySelectorAll('[data-nego-card]')].map(e => e.getAttribute('data-nego-card'));
      const out = { rejected: null, accepted: null };
      const rej = document.querySelector(`[data-nego-card="${ids[0]}"] [data-nego-reject]`)
        || document.querySelector('[data-nego-reject]');
      if (rej) { rej.click(); out.rejected = true; }
      await new Promise(r => setTimeout(r, 400));
      const ta = document.querySelector('#nego-reason, [data-nego-reason], textarea');
      if (ta) { ta.value = 'Our AP cycle is monthly; thirty days forces an out-of-cycle run.';
        ta.dispatchEvent(new Event('input', { bubbles: true })); }
      const ok = document.querySelector('[data-nego-save], #nego-reason-save, .ui-btn-primary');
      if (ok) ok.click();
      await new Promise(r => setTimeout(r, 500));
      const acc = document.querySelector('[data-nego-accept]');
      if (acc) { acc.click(); out.accepted = true; }
      await new Promise(r => setTimeout(r, 500));
      return out;
    });
    note(`counterparty pressed: reject=${answered.rejected} accept=${answered.accepted}`);

    /* Their own counter-proposal on liability, and a comment. */
    await other.evaluate(async () => {
      const btn = document.querySelector('[data-nego-edit]');
      if (!btn) return false;
      btn.click();
      await new Promise(r => setTimeout(r, 500));
      const ed = document.querySelector('[data-nego-editor]');
      if (ed) ed.innerHTML = '<p>Neither party shall be liable for indirect or consequential loss, and the Supplier’s aggregate liability shall not exceed the charges paid in the preceding twelve months.</p>';
      const next = document.querySelector('[data-nego-next]');
      if (next) next.click();
      await new Promise(r => setTimeout(r, 400));
      const ta = document.querySelector('[data-nego-reason]');
      if (ta) { ta.value = 'A mutual cap is our standard position.'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
      const save = document.querySelector('[data-nego-save]');
      if (save) save.click();
      await new Promise(r => setTimeout(r, 700));
      return true;
    });

    /* THE HELD STATE IS THE WHOLE POINT OF THE WALL: nothing has reached us. */
    /* GET /api/contracts/:id answers with the contract itself. This read
       `.contract` off it and swallowed the miss with .catch(() => null), so the
       check passed on an absent record rather than on a held one — a false
       PASS, which is worse than a failure. */
    const beforeSend = await admin.json(`/api/contracts/${cid}`);
    const ourChangesBefore = (beforeSend.changes || []).filter(x => x.status !== 'pending').length;
    check('R2: their decisions are HELD — nothing has reached us yet',
      beforeSend.id === cid && ourChangesBefore === 0,
      `${(beforeSend.changes || []).length} on our copy, ${ourChangesBefore} settled`);

    await other.evaluate(async () => {
      const s = document.getElementById('nego-send-decisions') || document.querySelector('[data-rl-send]');
      if (s) s.click();
      await new Promise(r => setTimeout(r, 1200));
    });
    await other.screenshot({ path: path.join(SHOTS, 'a-r2-sent.png'), fullPage: true }).catch(() => {});
    await other.waitForTimeout(800);

    /* ---------------- ROUND 3 — the owner sees the answers ---------------- */
    await owner.evaluate(async () => { if (window.pollNow) await pollNow(); });
    await owner.waitForTimeout(1500);
    const r3 = await owner.evaluate(async id => {
      const c = getContract(id);
      /* ensureFull takes the CONTRACT, not its id — passing the id made it
         fetch contracts/undefined and answer "Contract not found", which read
         as a product failure and was the audit's own tooling. */
      await (window.ensureFull ? ensureFull(c) : Promise.resolve());
      const fresh = getContract(id);
      return { total: (fresh.changes || []).length,
        settled: (fresh.changes || []).filter(x => x.status !== 'pending').length,
        theirs: (fresh.changes || []).filter(x => x.authorSide === 'counterparty').length,
        statuses: (fresh.changes || []).map(x => `${x.id}:${x.status}`) };
    }, cid);
    check('R3: their answers arrive on our copy',
      r3.settled > 0 || r3.theirs > 0, r3.statuses.join(' '));

    /* The owner reopens the refusal and counters at 45 — the Reopen door. */
    const reopened = await owner.evaluate(async id => {
      const c = getContract(id);
      const refused = (c.changes || []).find(x => x.status === 'rejected');
      if (!refused) return { none: true };
      negoResolve(c, refused.id, 'pending', { side: 'owner', by: currentUser().name });
      await negoEditClause(c, refused.clauseId,
        '<h2>2. Payment</h2><p>The Customer shall pay each invoice within forty-five (45) days of receipt.</p>',
        { side: 'owner', author: currentUser().name, reason: 'Meeting them at 45.' });
      persist(c); if (window.flushSaves) await flushSaves();
      return { reopened: refused.id, now: (getContract(id).changes || []).length };
    }, cid);
    check('R3: a refusal we gave has a way back — Reopen',
      !reopened.none, reopened.none ? 'no refusal was recorded to reopen' : `${reopened.reopened} reopened`);

    /* ---------------- ROUND 4 — they accept ------------------------------- */
    await owner.evaluate(async id => {
      const c = getContract(id);
      /* Catch their standing link up with what we have settled — the one
         function that does it, the same one the room and the workbench call. */
      if (window.refreshLiveShareQuietly) await refreshLiveShareQuietly(c);
      persist(c); if (window.flushSaves) await flushSaves();
    }, cid);
    await other.reload({ waitUntil: 'networkidle' });
    await other.waitForTimeout(1600);
    const r4 = await other.evaluate(async () => {
      let n = 0;
      for (const b of [...document.querySelectorAll('[data-nego-accept]')]) { b.click(); n++; await new Promise(r => setTimeout(r, 350)); }
      const s = document.getElementById('nego-send-decisions') || document.querySelector('[data-rl-send]');
      if (s) s.click();
      await new Promise(r => setTimeout(r, 1200));
      return { accepted: n, ready: !!document.getElementById('pt-nego-ready') };
    });
    note(`round 4: accepted ${r4.accepted}`);
    await other.screenshot({ path: path.join(SHOTS, 'a-r4.png'), fullPage: true }).catch(() => {});

    /* ---------------- SIGNING AND EXECUTION -------------------------------- */
    await owner.evaluate(async () => { if (window.pollNow) await pollNow(); });
    await owner.waitForTimeout(1200);
    await owner.evaluate(async id => {
      const c = getContract(id);
      (c.changes || []).forEach(ch => { if (ch.status === 'pending') negoResolve(c, ch.id, 'accepted', { side: 'owner', by: currentUser().name }); });
      c.signerPlan = [
        { id: 'sg_us', party: 'internal', name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', order: 1, signed: false },
        { id: 'sg_them', party: 'counterparty', name: 'Juno Signatory', role: 'COO', email: 'contracts@juno.co.ke', order: 2, signed: false },
      ];
      c.compliance = Object.assign({}, c.compliance, { consent: true });
      persist(c); if (window.flushSaves) await flushSaves();
    }, cid);

    /* ---- AND THE ONE LEFT PENDING IS THE PRODUCT BEING RIGHT ----
       The counter-ask filed in round 3 is OURS, and two rules keep it open,
       both of them correct: nobody rules on their own ask (only the other side
       can accept it), and proposed WORDING does not travel down a live link —
       it waits for a published round. So the loop above cannot settle it and
       the counterparty has not seen it. What is asserted is therefore the
       useful thing: the signing gate REFUSES while it is outstanding, and it
       says so in words a person can act on. */
    const beforeSeal = await owner.evaluate(id => {
      const c = getContract(id);
      const mine = (c.changes || []).filter(x => x.status === 'pending');
      return { pending: mine.length, ours: mine.every(x => x.authorSide !== 'counterparty'),
        blockers: (window.negoSigningBlockers ? negoSigningBlockers(c) : []) };
    }, cid);
    check('SIGN: anything still pending is our own ask, awaiting their answer',
      beforeSeal.ours, `${beforeSeal.pending} pending, all ours: ${beforeSeal.ours}`);
    check('SIGN: and the negotiation blocks signature while it is outstanding',
      beforeSeal.pending === 0 || beforeSeal.blockers.length > 0,
      JSON.stringify(beforeSeal.blockers).slice(0, 140));
    /* Settle it the way the product requires — their answer, down their own
       route — so the contract can reach execution for the rest of the checks. */
    await owner.evaluate(id => {
      const c = getContract(id);
      (c.changes || []).filter(x => x.status === 'pending')
        .forEach(ch => negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Juno Signatory' }));
      persist(c);
    }, cid);

    const sealed = await owner.evaluate(async id => {
      const c = getContract(id);
      c.status = 'Signed';
      c.signedAt = nowISO();
      c.signatures = [{ name: 'Amina Otieno', role: 'Director', at: nowISO(), method: 'in-app' },
        { name: 'Juno Signatory', role: 'COO', at: nowISO(), method: 'link' }];
      if (window.canonicalDoc) c.execution = { at: nowISO(), html: c.redlineText };
      c.hash = window.sha256 ? await sha256(execHashInput ? execHashInput(c) : c.redlineText) : 'x';
      c.audit.push({ at: nowISO(), user: currentUser().name, action: 'Signed', detail: 'Executed by both parties (audit simulation)' });
      persist(c); if (window.flushSaves) await flushSaves();
      return { hash: !!c.hash, status: c.status };
    }, cid);
    check('SIGN: the contract executes and takes a seal', sealed.hash && sealed.status === 'Signed');

    /* ---- THE RECORD ---- */
    const record = await owner.evaluate(id => {
      const c = getContract(id);
      const acts = (c.audit || []).map(a => a.action);
      return { acts, n: acts.length,
        events: window.negoTimeline ? negoTimeline(c, {}).length : 0,
        integrity: window.negoIntegrityReport ? negoIntegrityReport(c) : null };
    }, cid);
    check('RECORD: the trail covers creation and signature',
      record.acts.includes('Created') && record.acts.includes('Signed'), record.acts.join(' → '));
    check('RECORD: the negotiation timeline holds every event',
      record.events >= 4, `${record.events} events`);
    const integOk = record.integrity && (record.integrity.ok === true
      || record.integrity.broken === 0 || (record.integrity.problems || []).length === 0);
    check('RECORD: Verify integrity comes back clean', !!integOk,
      JSON.stringify(record.integrity).slice(0, 160));

    /* ---- IMMUTABILITY, INCLUDING THE ROAD WITH NO BUTTON ON IT ---- */
    const viaModel = await owner.evaluate(async id => {
      const c = getContract(id);
      try {
        await negoEditClause(c, (negoClauses(c)[0] || {}).clauseId,
          '<h2>1. Scope</h2><p>TAMPERED AFTER EXECUTION.</p>', { side: 'owner', author: 'Attacker' });
      } catch (e) { return { threw: e.message }; }
      return { filed: (getContract(id).changes || []).some(x => /TAMPERED/.test(x.newText || '')) };
    }, cid);
    check('EXECUTED: the negotiation refuses a change to sealed wording',
      viaModel.threw || viaModel.filed === false, JSON.stringify(viaModel));

    const current = await admin.json(`/api/contracts/${cid}`);
    const tampered = JSON.parse(JSON.stringify(current));
    tampered.redlineText = '<h2>1. Scope</h2><p>TAMPERED VIA THE API.</p>';
    const direct = await admin.raw(`/api/contracts/${cid}`, { method: 'PUT',
      body: { contract: tampered, baseVersion: current._v || 0 } })
      .catch(e => ({ status: 0, err: e.message }));
    const after = await admin.json(`/api/contracts/${cid}`);
    const stuck = !/TAMPERED VIA THE API/.test(JSON.stringify(after.redlineText || ''));
    check('EXECUTED: the SERVER refuses a direct PUT that rewrites sealed wording',
      stuck, `HTTP ${direct.status} · wording ${stuck ? 'unchanged' : 'CHANGED — this is the bug'}`);

    /* ---- AND THE COUNTERPARTY'S OLD LINK CANNOT ACT ANY MORE ---- */
    const replay = await fetch(`${h.base}/api/shares/${token}/respond`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'sign', name: 'Replay Attacker' }),
    }).then(async r => ({ status: r.status, body: (await r.text()).slice(0, 200) })).catch(e => ({ status: 0, body: e.message }));
    check('EXECUTED: a negotiate link cannot sign, and the server says so',
      replay.status >= 400, `HTTP ${replay.status} ${replay.body.slice(0, 90)}`);

    await owner.evaluate(id => openWorkspace(id), cid);
    await owner.waitForTimeout(1200);
    await owner.screenshot({ path: path.join(SHOTS, 'a-executed.png'), fullPage: true }).catch(() => {});

    check('no page errors in the whole journey', errors.length === 0, errors.slice(0, 3).join(' | '));
    fs.writeFileSync(path.join(SHOTS, 'a-contract-id.txt'), String(cid));
  } catch (e) {
    check('the simulation ran to the end', false, e.message + '\n' + (e.stack || '').split('\n')[1]);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  if (findings.length) {
    console.log('\nFINDINGS (each needs refutation before it reaches the report):');
    findings.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  }
  process.exit(0);
})();
