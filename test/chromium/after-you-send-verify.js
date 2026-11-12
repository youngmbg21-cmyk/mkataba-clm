/* AFTER YOU SEND (owner, 12 Nov 2026: "Legora and said once"). Drafts from our own template, filled in, a signer named
   on each side, in the new look:
     1 · our paper with two fixes of ours not yet sent: the Send screen says "· clean copy" and one line, and its Goes
         row says a clean copy
     2 · sent: their copy carries no change and the new wording; our record keeps the two fixes folded, says so in the
         history, and the chain still verifies
     3 · the card after the send says "Waiting on Juno Logistics", who it went to, "not opened yet", and Remind
     4 · a second change after that first send is NOT folded: it travels as a tracked change
     5 · their paper (it came as a file) with a fix of ours is never folded: the Send screen says no clean copy
     (a contract that is not a Draft — received for review, under way — is never folded either: f1015)
     6 · at the owner's three screens: the waiting card inside the panel, nothing sideways
   At the parent (before this change) 1–3 and 6 fail: our fixes travelled as tracked changes and the card said
   "1 to do in the negotiation".
   Run: node test/chromium/after-you-send-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'after-you-send');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const filled = (id, extra) => Object.assign(fixtureContract(id, 'Cold Chain Haulage', 'Juno Logistics', 'proc', 2000000, 'Draft'), {
  template: 'RM', fields: { value: '2000000', effDate: '2026-12-01', material: 'pasteurised milk' }, effective: '2026-12-01', effectiveDate: '2026-12-01', expiry: '2027-11-30',
  signerPlan: [{ id: 'sg1', party: 'internal', name: 'Admin', email: 'admin@example.co.ke', order: 1 }, { id: 'sg2', party: 'counterparty', name: 'Wanjiru Otieno', email: 'wanjiru@juno.co.ke', order: 2 }] }, extra || {});
/* two fixes of ours on two clauses, through the one funnel */
const FILE_TWO = async id => { const c = getContract(id); if (window.ensureFull) await ensureFull(c); if (window.ensureSharesCached) await ensureSharesCached(c);
  const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front').slice(0, 2); let n = 0;
  for (const cl of cls){ const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
    if (await negoEditClause(c, cl.clauseId, body.replace(/<\/p>\s*$/, ' as agreed in writing.</p>'), { side: 'owner', author: 'Admin' })) n++; }
  return n; };
const THEIRS = '<h1>Haulage Agreement</h1><p>Between Highland Corporate Ltd and Juno Logistics</p>'
  + '<h2>1. Services</h2><p>The Carrier shall carry the Buyer\'s goods between Nairobi and Mombasa.</p>'
  + '<h2>2. Price</h2><p>The annual contract value is KES 2,000,000, invoiced monthly.</p>'
  + '<h2>3. Term</h2><p>This agreement runs until 30 June 2027.</p>';
const SEND_NOW = () => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /^(Copy the link|Send by email|Send)$/.test((x.textContent || '').trim()) && !x.disabled); if (b) b.click(); return !!b; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [], contracts: [filled('MK-AS1'), filled('MK-AS2'), filled('MK-AS3'),
    /* their paper: a file that came in, with wording of its own (Draft, so only the upload guard keeps it tracked) */
    filled('MK-AS4', { source: 'upload', template: null, format: 'rich', redlineText: THEIRS,
      upload: { name: 'theirs.docx', extractedText: THEIRS.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString(), uploadedBy: 'Admin' } })] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const open = async (id, W, H) => {
    const page = await browser.newPage({ viewport: { width: W || 1440, height: H || 780 } });
    page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, id => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract(id), id, 40000);
    await page.evaluate(async id => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand(id); }, id);
    await until(page, id => typeof deskKeyNow === 'function' && deskKeyNow() === 'c:' + id && !!document.querySelector('#ig-dock .pd2-card'), id, 20000);
    return page;
  };
  try {
    const sendWith = async (page, id) => {
      await page.evaluate(id => openShareModal(getContract(id), { purpose: 'negotiate' }), id);
      const up = await until(page, () => !!document.getElementById('sh-lt-what-row'), null, 10000);
      const S = await page.evaluate(() => ({ what: (document.getElementById('sh-lt-what-row') || {}).innerText || '', goes: (document.getElementById('sh-lt-goes-l') || {}).innerText || '' }));
      return { up, S };
    };
    /* 1–4 our paper */
    let page = await open('MK-AS1');
    const n1 = await page.evaluate(FILE_TWO, 'MK-AS1');
    const { up, S } = await sendWith(page, 'MK-AS1');
    check('1 our paper, two fixes of ours: the Send screen says clean copy once, and Goes says the same',
      n1 === 2 && up && /round 1 · clean copy/.test(S.what) && /Your 2 fixes stay in your history/.test(S.what) && /A clean copy, your fixes folded in/.test(S.goes), { n1, S });
    await page.screenshot({ path: path.join(OUT, 'send-clean.png') });
    const sent = up && await page.evaluate(SEND_NOW);
    const went = sent && await until(page, async () => { try { const r = await api('contracts/MK-AS1/shares'); return (r.shares || []).length > 0; } catch (_) { return false; } }, null, 12000);
    const A = went ? await page.evaluate(async () => {
      const c = getContract('MK-AS1'); const sh = await api('contracts/MK-AS1/shares'); const tok = ((sh.shares || [])[0] || {}).token;
      const t = tok ? await fetch('/api/shares/' + tok).then(x => x.json()) : {}; const pc = ((t.payload || t).contract) || {};
      const st = await api('contracts/MK-AS1'); const sc = st.contract || st;
      let integ = null; try { integ = (await negoIntegrityReport(c)).ok; } catch (e) { integ = String(e); }
      return { theirChanges: (pc.changes || []).length, theirFolded: !!(pc.negotiation && pc.negotiation.folded), theirWords: /as agreed in writing/.test(String(pc.redlineText || '')),
        storedChanges: (sc.changes || []).length, storedFolded: ((sc.negotiation || {}).folded || []).length, integ,
        said: (c.audit || []).some(a => /Clean copy for the first send/.test(String(a.detail || ''))) }; }) : null;
    check('2 sent: their copy carries no change and the new wording; we keep both fixes folded, the history says so, the chain verifies',
      !!A && A.theirChanges === 0 && !A.theirFolded && A.theirWords && A.storedChanges === 0 && A.storedFolded === 2 && A.integ === true && A.said, A || { sent, went });
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { try { closeModal(); } catch (_) {} roomHomeLand('MK-AS1'); });
    /* step 2 read their copy through the link, so the link says opened: either word is the link's own record */
    const w3 = await until(page, () => { const k = document.querySelector('#ig-dock .pd2-card.is-wait'); return !!k && /not opened yet|opened today/.test(k.innerText); }, null, 15000);
    const C3 = await page.evaluate(() => (document.querySelector('#ig-dock .pd2-card') || {}).innerText || '');
    check('3 the card waits on them: who, when, opened or not (the link\'s own record), Remind', w3 && /Waiting on Juno Logistics/.test(C3) && /Wanjiru Otieno/.test(C3) && /not opened yet|opened today/.test(C3) && /Remind/.test(C3), C3);
    await page.screenshot({ path: path.join(OUT, 'waiting.png') });
    /* 4 a fix after that first send travels tracked */
    const n4 = await page.evaluate(async () => { const c = getContract('MK-AS1'); const cl = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front')[2];
      const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + now.text + '</p>';
      await negoEditClause(c, cl.clauseId, body.replace(/<\/p>\s*$/, ' in good faith.</p>'), { side: 'owner', author: 'Admin' });
      return { would: negoFoldWouldTake(c), folded: negoFoldOwnFirstSend(c), pending: c.changes.length }; });
    check('4 a fix after the first send is never folded: it travels tracked', n4.would === 0 && n4.folded === 0 && n4.pending === 1, n4);
    await page.close();

    /* 5 their paper */
    page = await open('MK-AS4');
    const n5 = await page.evaluate(FILE_TWO, 'MK-AS4');
    const r5 = await sendWith(page, 'MK-AS4');
    const w5 = await page.evaluate(() => negoFoldWouldTake(getContract('MK-AS4')));
    check('5 their paper is never folded: no clean copy said, the fix stays tracked', n5 >= 1 && r5.up && !/clean copy/.test(r5.S.what) && w5 === 0, { n5, w5, S: r5.S });
    await page.close();

    /* 6 the owner's three screens: the waiting card (each its own contract, sent once) */
    for (const [nm, W, H, id] of [['laptop-a', 1440, 780, 'MK-AS2'], ['laptop-b', 1536, 730, 'MK-AS3'], ['ipad', 1366, 950, 'MK-AS1']]){
      page = await open(id, W, H);
      if (id !== 'MK-AS1'){ await sendWith(page, id); await page.evaluate(SEND_NOW);
        await until(page, async id => { try { const r = await api('contracts/' + id + '/shares'); return (r.shares || []).length > 0; } catch (_) { return false; } }, id, 12000);
        await page.keyboard.press('Escape').catch(() => {}); await page.evaluate(id => { try { closeModal(); } catch (_) {} roomHomeLand(id); }, id); }
      const on = await until(page, () => !!document.querySelector('#ig-dock .pd2-card.is-wait'), null, 15000);
      const F = await page.evaluate(() => { const k = document.querySelector('#ig-dock .pd2-card'), dock = document.getElementById('ig-dock');
        const kr = k && k.getBoundingClientRect(), dr = dock && dock.getBoundingClientRect();
        return { inside: !!(kr && dr) && kr.left >= dr.left - 1 && kr.right <= dr.right + 1, sideways: document.documentElement.scrollWidth - innerWidth }; });
      check(`6 ${nm} the waiting card inside the panel, nothing sideways`, on && F.inside && F.sideways <= 0, F);
      await page.screenshot({ path: path.join(OUT, `screen-${nm}.png`) });
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
