/* Chromium verification: COPILOT READS EVERY CHANGE, WHOLE
   ============================================================
   Young, 30 Sep 2026: "fix this first before you merge to main" — Copilot
   outside the Explorer's open paper read the change list clipped to 600
   characters a wording and cut to the newest 60 changes.

   DRIVEN ON THE REAL APP against a scripted provider. MK-A2 is given 70
   changes, the oldest carrying a clause far longer than 600 characters; a
   question is asked through the product's own Copilot call; the provider
   asks for get_contract, the SERVER runs it, and what the server hands back
   is read off the provider's next request — the copy the model reads.
     1  all 70 changes arrive, and nothing is counted out;
     2  the oldest one's long wording arrives whole.
   Both are red at the parent (47ae8f8): 60 changes, 600 characters.

   Run: node test/chromium/copilot-reads-every-change-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const LONG = 'The Supplier shall keep a complete record of every collection, test and delivery made under this Agreement. '.repeat(20).trim();

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-A2'), null, { timeout: 20000 }).catch(() => {});

    /* ---- STAGE: 70 changes on the record, saved to the server ---- */
    const staged = await page.evaluate(async LONG => {
      const c = getContract('MK-A2');
      if (!c) return { ok: false, why: 'no MK-A2' };
      if (c._light && !c._loaded) await ensureFull(c);
      c.negotiation = c.negotiation || { round: 1, turn: 'owner', rounds: [] };
      c.changes = Array.from({ length: 70 }, (_, i) => ({ id: 'CHG-' + String(i + 1).padStart(3, '0'),
        clauseId: 'cl_x' + i, clauseLabel: 'Clause ' + (i + 1), changeType: 'modify', status: 'pending',
        author: 'Nandi Legal', authorSide: 'counterparty', summary: 'ask ' + (i + 1),
        oldText: i === 0 ? LONG : 'old ' + i, newText: 'new ' + i, createdAt: new Date().toISOString() }));
      persist(c); await flushSaves();
      const back = await api('contracts/MK-A2');
      return { ok: (back && back.changes || []).length === 70, stored: (back && back.changes || []).length };
    }, LONG);
    check('stage: 70 changes stored on MK-A2', staged.ok, JSON.stringify(staged));
    if (!staged.ok) throw new Error('stage failed');

    /* ---- ASK: the provider asks for get_contract; the server runs it ---- */
    ai.script({ content: [{ type: 'tool_use', id: 'tu_get', name: 'get_contract', input: { id: 'MK-A2' } }] });
    ai.script({ content: [{ type: 'tool_use', id: 'tu_ans', name: 'deliver_answer', input: { answer: 'Seventy changes.', citations: [] } }] });
    const before = ai.calls.length;
    await page.evaluate(() => copilotAsk([{ role: 'user', content: 'Summarise every change on MK-A2' }],
      { view: 'contract', activeContractId: 'MK-A2' }, null, { quiet: true }).catch(e => ({ err: e.message })));
    const calls = ai.calls.slice(before);
    let result = null;
    for (const call of calls) {
      for (const m of ((call.body && call.body.messages) || [])) {
        if (!Array.isArray(m.content)) continue;
        for (const b of m.content) if (b && b.type === 'tool_result' && b.tool_use_id === 'tu_get') {
          try { result = JSON.parse(typeof b.content === 'string' ? b.content : (b.content[0] && b.content[0].text) || ''); } catch (_) {}
        }
      }
    }
    const n = result && result.negotiation;
    check('the provider received what the server\'s get_contract returned', !!n, `${calls.length} calls`);
    check('1 all 70 changes arrive, and nothing is counted out',
      !!n && n.totalChanges === 70 && n.changes.length === 70 && n.changesOmitted === 0,
      n ? `${n.changes.length} of ${n.totalChanges}, omitted ${n.changesOmitted}` : 'none');
    const oldest = n && n.changes.find(x => x.id === 'CHG-001');
    check('2 the oldest change\'s long wording arrives whole (' + LONG.length + ' characters)',
      !!oldest && oldest.currentWording === LONG, oldest ? `${oldest.currentWording.length} characters` : 'missing');
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    await ai.stop().catch(() => {});
  }
  const failed = results.filter(x => !x.pass).length;
  console.log(`\n${results.length - failed} of ${results.length} PASS`);
  process.exit(failed ? 1 : 0);
})();
