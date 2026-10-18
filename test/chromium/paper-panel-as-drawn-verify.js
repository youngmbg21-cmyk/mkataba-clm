/* JAMBO BESIDE A PAPER, AND FOLLOW ME ON HOME, AS DRAWN (rounds 3 and 6 of
   the redesign: "Tabs and faces" and "One line"; the owner's "build all the
   gaps", 18 Oct 2026; js/paperdesk.js pdNoteRows, pdGlanceRows, pdAskSay,
   pdGlGoTo; js/copilotacts.js caOwedSteps; js/presence.js presenceCanWalk,
   presenceGo; js/views/intelligence.js igPaperGoClause)

   WHAT THIS PINS, in real browsers on a seeded workspace with a contract
   whose other side sent two redlines, a note of the reader's due today on
   it, and a colleague on it too
     1 Needs you here lists the note — "1 note due today", its words, "only
       you" — and Open note opens it in My notes; the colleague never sees it
     2 the glance, as drawn: the stage with its round; "<party> sent 2
       redlines …" with "Your move." and Redlines; one row per ask, "Clause 7:
       they ask for “100%” in place of “50%”." · their ask · Go to it; "Nobody
       has been named to sign yet." · Needed before signing; "Risks not read
       yet." with what reading costs, and Read it
     3 Go to it Redlines the paper and brings that clause up, lit
     4 Read it runs the risk read, and its row goes
     5 the chips lead with what is owed — "answer the redlines", "name a
       signer" — never also "redline" or "sign"; "name a signer" opens the
       signing route
     6 FOLLOW ME ON HOME: the colleague's face on the paper's line is a
       button; pressed, it lights, and when the colleague moves to another
       clause the reader's own paper arrives there; pressed again it stops
     7 the owner's three screens: both cards, the chips and the box in view,
       nothing past the panel's edge
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/paper-panel-as-drawn-verify.js */
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
const DOC = ['MASTER SERVICES AGREEMENT', '',
  '1. Parties and purpose', '', 'This Master Services Agreement is made between Highland Corporate Ltd (the Customer) and Nordvik Logistik AB (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care.', '',
  '3. Term', '', 'This Agreement starts on 1 April 2026 and runs until 31 March 2027.', '',
  '4. Fees', '', 'The Customer pays the fees in Schedule 3.', '',
  '5. Service levels', '', 'If the Supplier misses a service level the Customer receives a credit.', '',
  '6. Confidentiality', '', 'Each party keeps the other\'s confidential information secret.', '',
  '7. Limitation of liability', '', 'Each party\'s total liability under this Agreement shall not exceed 50% of the fees paid in the twelve months before the claim.', '',
  '8. Insurance', '', 'The Supplier holds liability insurance of at least KES 10 million for the whole term.', '',
  '9. Law and disputes', '', 'This Agreement is governed by the laws of Kenya.', '',
  '10. Notices', '', 'Notices are given in writing.', '',
  '11. Payment terms', '', 'The Customer shall pay each correct invoice within 30 days of receipt.'].join('\n');

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4.2e6, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Per', email: 'per@nordvik.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
  /* a note of the reader's own, due today, on this contract — My notes' own route */
  const t = new Date(); const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Check Nordvik\'s insurance broker.', contractId: 'MK-0382', reviewBy: today } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass, tag) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(tag + ': ' + e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, { timeout: 20000 });
    return page;
  };
  try {
    const page = await open('admin@example.co.ke', 'adminpassword1', 'reader');
    const until = async (fn, arg, ms = 8000, p = page) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await p.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await p.waitForTimeout(120); }
      return v; };
    const press = async (sel, what, p = page) => { if (!(await p.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await p.locator(sel).first().click(); return true; };
    /* their two redlines come back through the link, as a real round does */
    const cls = await page.evaluate(async () => { const c = getContract('MK-0382'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Standard in our contracts' }; };
    await h.client('per').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Per', id: 'MK-0382', at: new Date().toISOString(),
      negoProposed: [ask(/50%/, '50%', '100%'), ask(/30 days/, '30 days', '60 days')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await until(() => (getContract('MK-0382').changes || []).length >= 2, null, 10000);
    const k7 = cls.find(x => /50%/.test(x.text)), k11 = cls.find(x => /30 days/.test(x.text)), k1 = cls.find(x => /Parties/.test(x.label));
    const settled = (p = page) => until(() => { const d = document.getElementById('ig-dock'); if (!d) return false;
      return Math.abs(d.getBoundingClientRect().width - parseFloat(d.style.width || '0')) < 2; }, null, 4000, p);
    const onPaper = async (p = page) => { await p.evaluate(() => pdOpenOnHome('MK-0382', 'copilot'));
      const ok = await until(() => !!document.getElementById('pd-glance') && !!document.querySelector('#ig-paper [data-clause]'), null, 12000, p); await settled(p); return ok; };

    console.log('\n1 · a note of yours, in Needs you here');
    await onPaper();
    const nt = await until(() => { const r = document.querySelector('#pd-needs [data-pd-nd-kind="mynote"]'); if (!r) return null;
      return { title: r.querySelector('b').textContent.trim(), sub: r.querySelector('small').textContent.trim(), btn: (r.querySelector('[data-pd-nd-note]') || {}).textContent || '',
        n: Number((document.querySelector('#pd-needs .pd-gl-h .pd-pill') || {}).textContent || 0), rows: document.querySelectorAll('#pd-needs .pd-nd-row').length,
        all: (document.querySelector('#pd-needs [data-pd-nd-all]') || {}).textContent || '', counter: counterNeedsCount() }; }, null, 10000);
    check('1a "1 note due today", its own words and "only you", with Open note', !!nt && nt.title === '1 note due today' && nt.sub === '“Check Nordvik\'s insurance broker.” · only you' && nt.btn === 'Open note', JSON.stringify(nt));
    check('1b the card counts it with its rows; "all N" is the Counter\'s own number', !!nt && nt.n === nt.rows && nt.all.trim() === 'all ' + nt.counter, JSON.stringify(nt));

    console.log('\n2 · the glance as drawn');
    const gl = await page.evaluate(() => { const g = document.getElementById('pd-glance'); const rows = [...g.querySelectorAll('.pd-gl-row')];
      const row = k => rows.filter(r => r.getAttribute('data-pd-gl') === k).map(r => ({ say: r.querySelector('span').firstChild.textContent.trim(), sub: ((r.querySelector('small') || {}).textContent || '').trim(), btn: ((r.querySelector('button') || {}).textContent || '').trim() }));
      return { pill: (g.querySelector('.pd-gl-h .room-stat') || {}).textContent || '', order: rows.map(r => r.getAttribute('data-pd-gl')),
        move: row('move'), asks: row('ask'), sign: row('sign'), scan: row('scan') }; });
    check('2a the stage pill says its round, as the paper\'s line does', /^In Review · round \d+$/.test(gl.pill.trim()), gl.pill);
    check('2b their round: "Nordvik Logistik AB sent 2 redlines today." · Your move. · Redlines',
      gl.move.length === 1 && /^Nordvik Logistik AB sent 2 redlines (today|\d+ days? ago)\.$/.test(gl.move[0].say) && gl.move[0].sub === 'Your move.' && gl.move[0].btn === 'Redlines', JSON.stringify(gl.move));
    check('2c one row per ask, in its own words: their ask · Go to it',
      gl.asks.length === 2 && gl.asks.some(a => a.say === 'Clause 7: they ask for “100%” in place of “50%”.') && gl.asks.every(a => a.sub === 'their ask' && a.btn === 'Go to it'), JSON.stringify(gl.asks));
    check('2d nobody named to sign: Needed before signing · Signing', gl.sign.length === 1 && gl.sign[0].say === 'Nobody has been named to sign yet.' && gl.sign[0].sub === 'Needed before signing' && gl.sign[0].btn === 'Signing', JSON.stringify(gl.sign));
    check('2e the risks not read yet, what reading costs said before the press, and Read it',
      gl.scan.length === 1 && gl.scan[0].say === 'Risks not read yet.' && /^Reading is free/.test(gl.scan[0].sub) && gl.scan[0].btn === 'Read it', JSON.stringify(gl.scan));
    check('2f their round leads, then their asks', gl.order[0] === 'move' && gl.order[1] === 'ask' && gl.order[2] === 'ask', gl.order.join(','));
    await shot(page, '3-panel-beside-a-paper-1440x780');

    console.log('\n3 · Go to it');
    await page.evaluate(id => { const b = document.querySelector(`#pd-glance [data-pd-gl-go="${id}"]`); if (b) b.click(); }, k11.id);
    const went = await until(id => { const el = document.querySelector(`#ig-paper [data-clause="${id}"]`), sc = document.getElementById('ig-paper-scroll'); if (!el || !sc) return null;
      const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect();
      const inView = r.top >= s.top - 1 && r.bottom <= s.bottom + 1;
      return inView && intel.paper.red === true ? { lit: el.classList.contains('ig-arrived'), top: Math.round(r.top - s.top) } : null; }, k11.id, 6000);
    check('3 Go to it Redlines the paper and brings their ask\'s clause up, lit', !!went && went.lit, JSON.stringify(went));

    console.log('\n4 · Read it');
    if (await press('#pd-glance [data-pd-gl-scan]', '4 Read it')) {
      const read = await until(() => !!getContract('MK-0382').scan && !document.querySelector('#pd-glance [data-pd-gl="scan"]'), null, 8000);
      check('4 Read it runs the risk read, and the row goes', !!read);
    }

    console.log('\n5 · the chips');
    const ch = await until(() => { const L = [...document.querySelectorAll('#ig-dock [data-ca-chip]')]; return L.length ? L.map(b => ({ k: b.getAttribute('data-ca-chip'), w: b.textContent.trim(), owed: b.classList.contains('ca-chip-owed') })) : null; }, null, 6000);
    const ks = (ch || []).map(x => x.k);
    check('5a the owed lead — "answer the redlines", "name a signer" — never also "redline" or "sign"',
      ks.includes('answer') && ks.includes('signer') && !ks.includes('redline') && !ks.includes('sign') && ks.length === 4 && ch[0].owed
      && ch.find(x => x.k === 'answer').w === 'answer the redlines' && ch.find(x => x.k === 'signer').w === 'name a signer', JSON.stringify(ch));
    if (await press('#ig-dock [data-ca-chip="signer"]', '5b name a signer')) {
      const route = await until(() => /Signing route/.test((document.body.innerText || '')) && !!document.querySelector('.modal-overlay, .modal, [role="dialog"]'), null, 8000);
      check('5b "name a signer" opens the signing route', !!route);
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    }

    console.log('\n6 · Follow me on Home');
    const peer = await open('everything@example.co.ke', 'their-own-pass-9', 'colleague');
    await onPaper(peer);
    /* the colleague's own paper says where they are, on the beat it already has */
    await peer.evaluate(() => presenceSay('MK-0382'));
    await onPaper();
    await page.evaluate(() => presenceSay('MK-0382'));
    const face = await until(() => { const b = document.querySelector('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]'); return b ? b.getAttribute('data-pz-follow') : null; }, null, 10000);
    check('6a the colleague\'s face on the paper\'s line is a button on Home', !!face, String(face));
    if (face) {
      await page.click('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]');
      const lit = await until(() => { const b = document.querySelector('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]'); return b && b.classList.contains('is-following') && b.getAttribute('aria-pressed') === 'true' && !!presenceFollowing(); }, null, 6000);
      check('6b pressed, it lights: following', !!lit);
      /* the colleague goes to clause 7 on their own paper, and says so on their beat */
      const lead = await peer.evaluate(id => { igPaperGoClause(id); return new Promise(r => setTimeout(async () => { await presenceSay('MK-0382'); r(presenceSpotNow()); }, 900)); }, k7.id);
      await page.evaluate(() => presenceSay('MK-0382'));
      const arrived = await until(id => presenceSpotNow() === id ? true : null, lead, 8000);
      check('6c the colleague moves to another clause, and the reader\'s own paper arrives there', !!arrived && lead === k7.id, JSON.stringify({ lead, want: k7.id, mine: await page.evaluate(() => presenceSpotNow()) }));
      await shot(page, '6-follow-me-on-home-1440x780');
      await page.click('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]');
      const off = await until(() => !presenceFollowing() && !document.querySelector('#ig-strip [data-pz-slot="paper"] .is-following'), null, 6000);
      check('6d pressed again, it stops', !!off);
      await peer.evaluate(id => { igPaperGoClause(id); return new Promise(r => setTimeout(async () => { await presenceSay('MK-0382'); r(true); }, 900)); }, k1.id);
      await page.evaluate(() => presenceSay('MK-0382'));
      await page.waitForTimeout(900);
      const stayed = await page.evaluate(() => presenceSpotNow());
      check('6e and the page stops moving', stayed !== k1.id, String(stayed));
    }
    console.log('\n1c · the note is the reader\'s alone');
    const theirs = await until(() => !!document.getElementById('pd-glance'), null, 6000, peer) && await peer.evaluate(() => !!document.querySelector('#pd-needs [data-pd-nd-kind="mynote"]') || /insurance broker/.test((document.getElementById('ig-dock') || {}).innerText || ''));
    check('1c the colleague, on the same paper, sees no note of the reader\'s', theirs === false, String(theirs));
    if (await press('#pd-needs [data-pd-nd-note]', '1d Open note')) {
      const mn = await until(() => state.view === 'mynotes' && /insurance broker/.test((document.getElementById('content') || document.body).innerText), null, 8000);
      check('1d Open note opens it in My notes', !!mn);
    }

    console.log('\n7 · the owner\'s three screens');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await onPaper(); await settled();
      const fit = await until(() => { const dock = document.getElementById('ig-dock'), feed = document.getElementById('igd-feed'),
        nd = document.getElementById('pd-needs'), gl = document.getElementById('pd-glance'), box = document.getElementById('igd-input');
        if (!dock || !feed || !gl || !box) return null;
        const d = dock.getBoundingClientRect(), b = box.getBoundingClientRect(), n = nd ? nd.getBoundingClientRect() : null;
        const wide = [...dock.querySelectorAll('#pd-needs *, #pd-glance *, [data-ig-chips] *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > d.right + 1; }).length;
        return { needs: !n || n.top >= d.top, box: b.bottom <= innerHeight + 1 && b.top >= 0, wide, side: document.documentElement.scrollWidth <= innerWidth + 1 }; }, null, 8000);
      check(`7 ${w}×${ht}: the cards and the box in view, nothing past the panel's edge`, !!fit && fit.needs && fit.box && fit.wide === 0 && fit.side, JSON.stringify(fit));
      await shot(page, `3-panel-beside-a-paper-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
