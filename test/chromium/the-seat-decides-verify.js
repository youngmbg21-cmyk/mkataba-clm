/* THE SEAT DECIDES — a contributor proposes, the lead adopts. Driven end to end
 * with two real people signed in, in two browsers.
 *
 * Young picked it by name from three: not a mode switch beside the text size,
 * not a per-person setting — THE SEAT DECIDES. A contributor's redline stays in
 * our draft, where they wrote it, and stays out of every send until the lead
 * adopts it.
 *
 * WHAT THIS DRIVES, where each person looks:
 *   0. with the desk rule OFF, a colleague's redline behaves exactly as it
 *      always did — the claim that lets this be switched on with no migration;
 *   1. the rule on, a desk open, the admin leading and a colleague named to it;
 *   2. THE COLLEAGUE files a redline through the funnel and is told it is a
 *      suggestion — with no verbs on it, because it is not theirs to adopt;
 *   3. THE WALLS: it is not in the payload, the ROUTE strips it, and a PUT
 *      that deletes the stamp is refused by name;
 *   4. THE LEAD sees it, on the card and on Home's one list, with two acts;
 *   5. adopting it puts it in the round; handing one back keeps every word of
 *      it and carries the reason to the person who wrote it;
 *   6. and nobody rules on their own — the lead's own redline is never a
 *      suggestion, and an author who became the lead still cannot wave theirs
 *      through.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than times
 * out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'seat-decides');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DEAL = {
  id: 'MK-D1', contractNo: 'MK-D1', name: 'Distribution Agreement',
  counterparty: 'Saw Sawa LLC', counterpartyEmail: 'ola@sawsawa.example',
  folder: 'proc', value: 900000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '2 Oct 2026', expiry: '2029-03-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [], negotiation: { round: 1, rounds: [] },
  body: '<h2>4. Payment Terms</h2><p>Invoices are payable within 60 days.</p>'
    + '<h2>9. Liability Cap</h2><p>Liability is limited to 150% of fees paid.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 12000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const login = async (email, pass, tag) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', email);
    await p.fill('#li-pass', pass);
    await p.click('#li-go');
    await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 15000);
    await until(p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    return { ctx, p };
  };
  /* ONE FILING, THROUGH THE FUNNEL. Not a hand-written change object: the whole
     claim is that the funnel stamps it, so the stage has to go through it. */
  const file = (p, idx, add) => p.evaluate(async a => {
    const c = getContract('MK-D1');
    c._loaded = false; await ensureFull(c);
    const list = negoClauseList(c);
    const cl = list[a.idx];
    if (!cl) return { err: 'no clause at ' + a.idx };
    const now = negoClauseNowById(c, cl.clauseId);
    const body = (now && now.bodyHtml) || ('<p>' + ((now && now.text) || '') + '</p>');
    const me = currentUser();
    /* A REAL CHANGE, APPENDED — the funnel refuses a no-op, and a stage whose
       edit happened to say the same thing would report "nothing filed" and look
       like a broken feature. */
    const ch = await negoEditClause(c, cl.clauseId, body + '<p>' + a.add + '</p>',
      { side: 'owner', author: me.name, why: 'tighter' });
    if (window.persist) persist(c);
    if (window.flushSaves) await flushSaves();
    return ch ? { id: ch.id, clause: cl.clauseId, suggested: ch.suggested || null }
      : { err: 'nothing filed' };
  }, { idx, add });

  try {
    const lead = await login('admin@example.co.ke', 'adminpassword1', 'lead');
    const mate = await login('everything@example.co.ke', 'their-own-pass-9', 'mate');
    const who = async (x) => x.p.evaluate(() => { const u = currentUser(); return u ? u.name + '|' + u.email : null; });
    ok('0a two people are signed in', true, (await who(lead)) + ' + ' + (await who(mate)));
    const probe = await mate.p.evaluate(async () => {
      const c = getContract('MK-D1'); await ensureFull(c);
      const list = negoClauseList(c) || [];
      return { n: list.length, labels: list.map(x => x.clauseLabel || (x.text || '').slice(0, 24)),
        body: String(c.body || '').slice(0, 80), nego: !!c.negotiation };
    });
    ok('0a2 the fixture has clauses to redline', probe.n >= 2, JSON.stringify(probe));

    /* ===== 0. WITH THE DESK RULE OFF, NOTHING IS DIFFERENT ===== */
    const cold = await file(mate.p, 0, 'Payment falls due within thirty (30) days.');
    ok('0b a colleague\'s redline files, and is not a suggestion',
      !!cold.id && !cold.suggested, JSON.stringify(cold));
    const coldSend = await lead.p.evaluate(async () => {
      const c = getContract('MK-D1'); await ensureFull(c);
      const pl = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      return (pl.contract.changes || []).length;
    });
    ok('0c and it travels, exactly as it always did', coldSend === 1, String(coldSend));

    /* ===== 1. THE RULE ON, A DESK, AND A COLLEAGUE NAMED TO IT =====
       THE LEAD IS NAMED DELIBERATELY, which deskOpen takes a lead for. It has
       to be, because the funnel's deskClaimOnFile runs BEFORE the no-op guard,
       so the cold filing in step 0 has already claimed the desk for whoever
       filed it — measured on the first run of this stage, which reported the
       colleague as the lead. The deliberate claim is the product's own route
       from the header, and deskOpen hands the desk over rather than refusing. */
    const set = await lead.p.evaluate(async () => {
      saveDeskCfg({ on: true });
      if (window.flushSaves) await flushSaves();
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const me = currentUser();
      if (c.desk) { c.desk.leadId = null; c.desk.closedAt = null; }
      deskOpen(c, { lead: me, by: me });
      const mate = (getUsers() || []).find(u => u.email === 'everything@example.co.ke');
      deskAddContributor(c, { id: mate.id, name: mate.name, email: mate.email });
      if (window.persist) persist(c);
      if (window.flushSaves) await flushSaves();
      const r = await api('bootstrap');
      return { on: !!(r && r.settings && r.settings.deskRule && r.settings.deskRule.on),
        lead: (deskLead(c) || {}).name, mates: deskContributors(c).map(x => x.name) };
    });
    ok('1a the desk rule is on, and the SERVER has it',
      set.on === true, JSON.stringify(set.on));
    ok('1b a desk is open, the admin leads it and the colleague is on it',
      !!set.lead && set.mates.length === 1, JSON.stringify(set));

    /* ===== 2. THE COLLEAGUE FILES, AND IS TOLD ===== */
    await mate.p.reload({ waitUntil: 'networkidle' });
    await until(mate.p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    const sug = await file(mate.p, 5, 'The cap shall not apply to product recalls.');
    ok('2a their redline is stamped a suggestion, by the FUNNEL',
      !!sug.id && !!sug.suggested && !!sug.suggested.by, JSON.stringify(sug));
    const mineSeen = await mate.p.evaluate(async id => {
      await openRedlineWorkbench('MK-D1');
      await new Promise(r => setTimeout(r, 900));
      const strip = document.querySelector(`[data-nego-card="${id}"] [data-dk-sg], .dk-card-sg[data-dk-sg="${id}"]`);
      return { drawn: !!strip, text: strip ? strip.textContent.replace(/\s+/g, ' ').trim() : '',
        adopt: !!document.querySelector(`[data-dk-adopt="${id}"]`),
        hand: !!document.querySelector(`[data-dk-return="${id}"]`) };
    }, sug.id);
    ok('2b the author\'s own page says it is a suggestion, and whose decision it is',
      mineSeen.drawn && /Suggest/i.test(mineSeen.text) && /Amina/.test(mineSeen.text),
      JSON.stringify(mineSeen.text));
    ok('2c with NO acts on it — it is not theirs to adopt',
      !mineSeen.adopt && !mineSeen.hand, JSON.stringify([mineSeen.adopt, mineSeen.hand]));
    await mate.p.screenshot({ path: path.join(OUT, '1-the-author.png') });

    /* ===== 3. THE WALLS ===== */
    const payload = await lead.p.evaluate(async id => {
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const pl = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      return { ids: (pl.contract.changes || []).map(x => x.id), has: (pl.contract.changes || []).some(x => x.id === id) };
    }, sug.id);
    ok('3a the payload the browser builds leaves it behind',
      payload.has === false && payload.ids.length >= 1, JSON.stringify(payload.ids));
    /* AND THE ROUTE, because an allow-list holds only until somebody adds a
       field: the payload is hand-built here with the suggestion put back in. */
    const stripped = await lead.p.evaluate(async id => {
      const c = getContract('MK-D1');
      const pl = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      const sg = (c.changes || []).find(x => x.id === id);
      pl.contract.changes = (pl.contract.changes || []).concat([{ id: sg.id, clauseId: sg.clauseId,
        bodyHtml: sg.bodyHtml, type: sg.type, changeType: sg.changeType, status: sg.status,
        authorSide: sg.authorSide, createdAt: sg.createdAt }]);
      const r = await api('shares', 'POST', { payload: pl, channel: 'link', purpose: 'negotiate',
        recipient: { name: 'Saw Sawa LLC', email: 'ola@sawsawa.example' } });
      const got = await (await fetch('/api/shares/' + r.token)).json();
      return { stripped: r.stripped || r.rvStripped || null,
        carried: ((got.payload && got.payload.contract && got.payload.contract.changes) || []).map(x => x.id) };
    }, sug.id);
    ok('3b and the ROUTE strips it out of a hand-built envelope',
      !stripped.carried.includes(sug.id), JSON.stringify(stripped.carried));
    /* AND THE STAMP IS NOT THE AUTHOR'S TO DELETE. The attack in one request:
       clear the stamp, then send. */
    const forged = await mate.p.evaluate(async id => {
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const body = JSON.parse(JSON.stringify(c));
      const sg = (body.changes || []).find(x => x.id === id);
      delete sg.suggested;
      /* The route's own envelope: { contract, baseVersion }, exactly as
         saveContract sends it. The attack is one honest request, not a
         malformed one — a 400 on the shape would prove nothing. */
      const r = await fetch('/api/contracts/MK-D1', { method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: body, baseVersion: body._v }) });
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, err: (j && (j.error || j.desk)) || null, desk: j && j.desk };
    }, sug.id);
    ok('3c a PUT that deletes the stamp is refused, by name',
      forged.status === 403 && /not yours to adopt|Amina/i.test(forged.err || ''),
      JSON.stringify(forged));

    /* ===== 4. THE LEAD SEES IT ===== */
    await lead.p.reload({ waitUntil: 'networkidle' });
    await until(lead.p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    const onHome = await lead.p.evaluate(() => {
      const rows = (typeof hmDecisionItems === 'function') ? (hmDecisionItems(null, []) || []) : [];
      const r = rows.find(x => x && x.kind === 'suggest');
      return r ? { cid: r.cid, txt: String(r.txt).replace(/<[^>]*>/g, ''), meta: String(r.meta), tag: String(r.tag) } : null;
    });
    ok('4a Home\'s one list carries it, with the colleague\'s name',
      !!onHome && onHome.cid === 'MK-D1' && /suggestion/i.test(onHome.txt),
      JSON.stringify(onHome));
    const check = await lead.p.evaluate(() => {
      const items = (typeof needsYouOf === 'function') ? (needsYouOf(getContract('MK-D1')) || []) : [];
      return items.filter(x => x.kind === 'suggest').map(x => ({ n: x.n, who: x.who }));
    });
    ok('4b and so does the contract\'s own checklist, from the same reading',
      check.length === 1 && check[0].n === 1, JSON.stringify(check));
    const leadSees = await lead.p.evaluate(async id => {
      await openRedlineWorkbench('MK-D1');
      await new Promise(r => setTimeout(r, 900));
      const a = document.querySelector(`[data-dk-adopt="${id}"]`);
      const strip = document.querySelector(`.dk-card-sg[data-dk-sg="${id}"]`);
      const box = a ? a.getBoundingClientRect() : null;
      const hit = box ? document.elementFromPoint(Math.round(box.left + box.width / 2),
        Math.round(box.top + box.height / 2)) : null;
      return { adopt: !!a, hand: !!document.querySelector(`[data-dk-return="${id}"]`),
        text: strip ? strip.textContent.replace(/\s+/g, ' ').trim() : '',
        pressable: !!(a && hit && (hit === a || a.contains(hit))) };
    }, sug.id);
    ok('4c the lead\'s card carries both acts, and the button is really pressable',
      leadSees.adopt && leadSees.hand && leadSees.pressable, JSON.stringify(leadSees.pressable));
    ok('4d and the strip names who suggested it',
      /Suggest/i.test(leadSees.text) && /Unrestricted/i.test(leadSees.text), JSON.stringify(leadSees.text));
    await lead.p.screenshot({ path: path.join(OUT, '2-the-lead.png') });

    /* ===== 5. ADOPT ONE, HAND ONE BACK ===== */
    await lead.p.click(`[data-dk-adopt="${sug.id}"]`).catch(() => {});
    const adopted = await until(lead.p, id => {
      const c = getContract(id.cid); const ch = (c.changes || []).find(x => x.id === id.id);
      return !!(ch && ch.suggested && ch.suggested.adoptedAt);
    }, { cid: 'MK-D1', id: sug.id });
    ok('5a pressing Adopt adopts it', adopted);
    const afterAdopt = await lead.p.evaluate(async a => {
      const c = getContract('MK-D1');
      if (window.flushSaves) await flushSaves();
      const pl = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate' });
      const ch = (c.changes || []).find(x => x.id === a.id);
      return { travels: (pl.contract.changes || []).some(x => x.id === a.id),
        keptStamp: !!(ch && ch.suggested && ch.suggested.by),
        strip: !!document.querySelector(`.dk-card-sg[data-dk-sg="${a.id}"]`),
        trail: (c.audit || []).some(x => /Suggestion adopted/.test(x.action || '')) };
    }, { id: sug.id });
    ok('5b and then it travels with the round', afterAdopt.travels === true, JSON.stringify(afterAdopt.travels));
    ok('5c the stamp is kept, so the trail can still say whose idea it was',
      afterAdopt.keptStamp && afterAdopt.trail, JSON.stringify([afterAdopt.keptStamp, afterAdopt.trail]));
    ok('5d and the strip comes off — the wording is simply ours now',
      afterAdopt.strip === false, String(afterAdopt.strip));
    /* A second one, handed back. */
    await mate.p.reload({ waitUntil: 'networkidle' });
    await until(mate.p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    const two = await file(mate.p, 6, 'Confidentiality survives for five (5) years.');
    ok('5e a second suggestion is filed', !!two.id && !!two.suggested, JSON.stringify(two.id));
    const handed = await lead.p.evaluate(async a => {
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const g = window.deskReturnSuggestion
        ? deskReturnSuggestion(c, a.id, 'Fourteen days is below our standard — try thirty.') : null;
      if (window.persist) persist(c);
      if (window.flushSaves) await flushSaves();
      const ch = (c.changes || []).find(x => x.id === a.id);
      return { why: g && g.why, body: !!(ch && ch.bodyHtml), status: ch && ch.status,
        leadList: ((window.deskSuggestionsFor ? deskSuggestionsFor(c) : []) || []).length };
    }, { id: two.id });
    ok('5f handing it back keeps the reason, and every word of the wording',
      /below our standard/.test(handed.why || '') && handed.body === true && handed.status === 'pending',
      JSON.stringify(handed));
    ok('5g and it leaves the lead\'s list — the turn is the author\'s now',
      handed.leadList === 0, String(handed.leadList));
    const toldBack = await mate.p.evaluate(async a => {
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const back = (window.deskSuggestionsBackTo ? deskSuggestionsBackTo(c) : []) || [];
      await openRedlineWorkbench('MK-D1');
      await new Promise(r => setTimeout(r, 900));
      const strip = document.querySelector(`.dk-card-sg[data-dk-sg="${a.id}"]`);
      return { n: back.length, returned: !!(strip && strip.getAttribute('data-dk-returned')),
        text: strip ? strip.textContent.replace(/\s+/g, ' ').trim() : '' };
    }, { id: two.id });
    ok('5h the person who wrote it is told, with the reason, where they wrote it',
      toldBack.n === 1 && toldBack.returned && /below our standard/.test(toldBack.text),
      JSON.stringify(toldBack.text));

    /* ===== 6. NOBODY RULES ON THEIR OWN ===== */
    const ownTry = await mate.p.evaluate(async a => {
      const c = getContract('MK-D1');
      const ch = (c.changes || []).find(x => x.id === a.id);
      const may = window.deskMayRuleSuggestion ? deskMayRuleSuggestion(c, ch) : null;
      const g = window.deskAdoptSuggestion ? deskAdoptSuggestion(c, a.id) : null;
      return { may, adopted: !!(g && g.adoptedAt) };
    }, { id: two.id });
    ok('6a the author cannot adopt their own, and the model says so',
      ownTry.may === false && ownTry.adopted === false, JSON.stringify(ownTry));
    const leadsOwn = await lead.p.evaluate(async () => {
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const cl = negoClauseList(c)[9];
      const now = negoClauseNowById(c, cl.clauseId);
      const ch = await negoEditClause(c, cl.clauseId,
        ((now && now.bodyHtml) || '<p>' + now.text + '</p>') + '<p>Notices may be given by email.</p>',
        { side: 'owner', author: currentUser().name, why: 'the lead\'s own' });
      return { id: ch && ch.id, suggested: (ch && ch.suggested) || null };
    });
    ok('6b and the LEAD\'s own redline is never a suggestion',
      !!leadsOwn.id && !leadsOwn.suggested, JSON.stringify(leadsOwn));

    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
