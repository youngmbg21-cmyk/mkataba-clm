/* DISCARD ONLY YOUR OWN — owner decision D3, 9 Oct 2026. Driven with two real
 * people signed in, in two browsers, the desk rule ON.
 *
 * Measured in the 9 Oct review: a contributor's row offered Discard on the
 * LEAD's unsent draft, one press deleted it with no question, and the server
 * accepted the save. The owner's rule: a contributor may discard only their own
 * drafts; the lead or an admin may discard anyone's; Discard always asks first.
 *
 *   1. the lead files a draft; on the contributor's page its row has no Discard,
 *      and the engine refuses it in red;
 *   2. a PUT from the contributor that removes it is refused by the server;
 *   3. the contributor's own draft carries Discard; the press asks
 *      "Discard #id?" — No keeps it, Yes removes it, and the server agrees.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than times
 * out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'discard-only-your-own');
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
  const login = async (email, pw, tag) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', email);
    await p.fill('#li-pass', pw);
    await p.click('#li-go');
    await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 15000);
    await until(p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    return { ctx, p };
  };
  const file = (p, idx, add) => p.evaluate(async a => {
    const c = getContract('MK-D1');
    c._loaded = false; await ensureFull(c);
    const cl = negoClauseList(c)[a.idx];
    if (!cl) return { err: 'no clause at ' + a.idx };
    const now = negoClauseNowById(c, cl.clauseId);
    const body = (now && now.bodyHtml) || ('<p>' + ((now && now.text) || '') + '</p>');
    const ch = await negoEditClause(c, cl.clauseId, body + '<p>' + a.add + '</p>',
      { side: 'owner', author: currentUser().name, why: 'tighter' });
    if (window.persist) persist(c);
    if (window.flushSaves) await flushSaves();
    return ch ? { id: ch.id } : { err: 'nothing filed' };
  }, { idx, add });
  const stored = (p, id) => p.evaluate(async id => {
    const r = await fetch('/api/contracts/MK-D1'); const j = await r.json();
    const c = j.contract || j;
    return (c.changes || []).some(x => x && x.id === id);
  }, id);

  try {
    const lead = await login('admin@example.co.ke', 'adminpassword1', 'lead');
    const mate = await login('everything@example.co.ke', 'their-own-pass-9', 'mate');
    const mateRole = await mate.p.evaluate(() => currentUser().role);
    ok('0 the colleague is not an admin (an admin may discard anything)', mateRole !== 'admin', mateRole);

    /* ===== the desk rule on, the admin leads, the colleague contributes ===== */
    const set = await lead.p.evaluate(async () => {
      saveDeskCfg({ on: true });
      if (window.flushSaves) await flushSaves();
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const me = currentUser();
      deskOpen(c, { lead: me, by: me });
      const mate = (getUsers() || []).find(u => u.email === 'everything@example.co.ke');
      deskAddContributor(c, { id: mate.id, name: mate.name, email: mate.email });
      if (window.persist) persist(c);
      if (window.flushSaves) await flushSaves();
      return { lead: (deskLead(c) || {}).name, mates: deskContributors(c).map(x => x.name) };
    });
    ok('0b a desk is open with a lead and one contributor', !!set.lead && set.mates.length === 1, JSON.stringify(set));

    /* ===== 1. THE LEAD'S DRAFT, ON THE CONTRIBUTOR'S PAGE ===== */
    const leads = await file(lead.p, 0, 'Late payment carries interest at 2% a month.');
    ok('1a the lead files a draft', !!leads.id, JSON.stringify(leads));
    await mate.p.reload({ waitUntil: 'networkidle' });
    await until(mate.p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    const seen = await mate.p.evaluate(async id => {
      await openRedlineWorkbench('MK-D1');
      await new Promise(r => setTimeout(r, 900));
      const row = document.querySelector(`[data-nego-card="${id}"]`);
      const out = { row: !!row, discard: !!document.querySelector(`[data-rl-retract="${id}"]`) };
      window.__t = []; const real = window.toast;
      window.toast = (m, k) => { window.__t.push((k || '') + ':' + m); return real && real(m, k); };
      const c = getContract('MK-D1');
      out.engine = !!negoRetractDraft(c, id, { side: 'owner' });
      out.kept = (c.changes || []).some(x => x && x.id === id);
      out.said = (window.__t || []).join(' | ');
      window.toast = real;
      return out;
    }, leads.id);
    ok('1b the lead\'s draft is on the contributor\'s page', seen.row, JSON.stringify(seen.row));
    ok('1c with NO Discard on it', seen.row && !seen.discard, JSON.stringify(seen.discard));
    ok('1d and the engine refuses it, in red, and keeps it',
      !seen.engine && seen.kept && /^err:.*only your own drafts/.test(seen.said), seen.said);
    await mate.p.screenshot({ path: path.join(OUT, '1-contributor-sees-lead-draft.png') });

    /* ===== 2. THE SERVER IS THE WALL ===== */
    const forged = await mate.p.evaluate(async id => {
      const c = getContract('MK-D1');
      c._loaded = false; await ensureFull(c);
      const body = JSON.parse(JSON.stringify(c));
      body.changes = (body.changes || []).filter(x => x.id !== id);
      const r = await fetch('/api/contracts/MK-D1', { method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: body, baseVersion: body._v }) });
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, err: (j && j.error) || null };
    }, leads.id);
    ok('2a a PUT that removes the lead\'s draft is refused',
      forged.status === 403 && /only your own drafts/.test(forged.err || ''), JSON.stringify(forged));
    ok('2b and the draft is still on the server', await stored(mate.p, leads.id));

    /* ===== 3. THE CONTRIBUTOR'S OWN DRAFT: ASKED FIRST ===== */
    await mate.p.reload({ waitUntil: 'networkidle' });
    await until(mate.p, () => typeof getContract === 'function' && !!getContract('MK-D1'), null, 15000);
    const mine = await file(mate.p, 1, 'The cap shall not apply to product recalls.');
    ok('3a the contributor files their own draft', !!mine.id, JSON.stringify(mine));
    await mate.p.evaluate(async () => { await openRedlineWorkbench('MK-D1'); await new Promise(r => setTimeout(r, 900)); });
    const btn = mate.p.locator(`[data-rl-retract="${mine.id}"]`).first();
    const has = await btn.count();
    ok('3b their own draft carries Discard', has > 0, String(has));
    if (has){
      await btn.scrollIntoViewIfNeeded(); await btn.click();
      const asked = await until(mate.p, () => !!document.getElementById('confirm-overlay'), null, 5000);
      const title = asked ? await mate.p.locator('#confirm-overlay h3').textContent() : '';
      ok('3c the press asks "Discard #id?" first', asked && new RegExp('Discard #' + mine.id + '\\?').test(title), title);
      await mate.p.screenshot({ path: path.join(OUT, '2-discard-asks-first.png') });
      if (asked) await mate.p.click('#cf-cancel');
      const keptLocal = await mate.p.evaluate(id => (getContract('MK-D1').changes || []).some(x => x.id === id), mine.id);
      ok('3d "Cancel" keeps the draft', keptLocal);
      await mate.p.locator(`[data-rl-retract="${mine.id}"]`).first().click();
      const asked2 = await until(mate.p, () => !!document.getElementById('confirm-overlay'), null, 5000);
      if (asked2) await mate.p.click('#cf-ok');
      const gone = await until(mate.p, id => !(getContract('MK-D1').changes || []).some(x => x.id === id), mine.id, 5000);
      ok('3e "Discard" removes it', gone);
      await mate.p.evaluate(async () => { if (window.flushSaves) await flushSaves(); });
      ok('3f and the server took the save', !(await stored(mate.p, mine.id)));
    }
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e));
  }
  ok('no page error anywhere in the run', errs.length === 0, errs.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
