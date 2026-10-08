/* ============================================================
   COPILOT'S JOBS, EACH ENDING IN ITS OWN DOOR, AND A DRAFTED REPLY (Young,
   8 Oct 2026 — "build all the steps", steps 5 and 6)
   ============================================================
     1  "Put MK-J1 on hold" is a card; its one press asks the reason (the
        hold's own question) and the contract is held
     2  "What is still open on MK-J1" opens the Paper at Deal
     3  "Send MK-J1 for signing" names the send screen; "Make an amendment to
        MK-J1" is the amendment's card, not a new draft
     4  a dropped thread: "Draft a reply" says plainly why no reply came when
        Copilot has no key — never a silent nothing
   AT THE PARENT every claim FAILS: no such cards, no Draft a reply.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'copilot-jobs');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = 'SUPPLY AGREEMENT\n\nArticle 1 Term\n\nThis Agreement runs for twelve (12) months.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await put(Object.assign(fixtureContract('MK-J1', 'Supply Agreement', 'Kilima Foods Ltd', FOLDER_A, 900000, 'Under Review', DOC), { owner }));
    const q = fixtureContract('MK-J2', 'Haulage Agreement', 'Ndovu Logistics', FOLDER_A, 400000, 'Under Review', DOC);
    Object.assign(q, { owner, negotiation: { round: 1, rounds: [] },
      thread: [{ id: 'n1', at: iso(-9), side: 'counterparty', visibility: 'shared', who: 'Erik', text: 'Can you confirm the delivery address for the first load?' }] });
    await put(q);

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length >= 2, null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => setView('dashboard'));
    await page.waitForSelector('#igd-input', { timeout: 10000 }).catch(() => {});
    const ask = async text => {
      const before = await page.evaluate(() => intel.history.length);
      await page.evaluate(t => intelAsk(t), text);
      await page.waitForFunction(n => intel.history.length > n && !intel.busy, before, { timeout: 8000 }).catch(() => {});
      return page.evaluate(() => { const m = intel.history[intel.history.length - 1]; return m && m.act ? { kind: m.act.kind, door: m.act.door, cid: m.act.cid } : null; });
    };

    /* ===== 1. HOLD ===== */
    const h1 = await ask('Put MK-J1 on hold, budget freeze');
    ok('1a "Put MK-J1 on hold" is the hold card', !!h1 && h1.kind === 'door' && h1.door === 'hold' && h1.cid === 'MK-J1', JSON.stringify(h1));
    await page.click('#igd-feed [data-ca-act="door"] >> nth=-1');
    const asked = await page.waitForSelector('#prompt-overlay #pd-input', { timeout: 5000 }).then(() => true, () => false);
    ok('1b its press asks the reason first', asked);
    if (asked) {
      await page.fill('#prompt-overlay #pd-input', 'Budget freeze until January');
      await page.click('#prompt-overlay #pd-ok');
    }
    const held = await page.waitForFunction(() => { const c = getContract('MK-J1'); return !!(c && c.hold && c.hold.at); }, null, { timeout: 8000 }).then(() => true, () => false);
    ok('1c the contract is held, by the hold\'s own act', held);

    /* ===== 2. WHAT IS STILL OPEN ===== */
    const o = await ask('What is still open on MK-J2?');
    ok('2a "What is still open" is the Deal card', !!o && o.door === 'open', JSON.stringify(o));
    await page.click('#igd-feed [data-ca-act="door"] >> nth=-1').catch(() => {});
    const deal = await page.waitForFunction(() => window.intel && intel.paper && intel.paper.id === 'MK-J2' && pdTab() === 'deal', null, { timeout: 8000 }).then(() => true, () => false);
    ok('2b its press opens the Paper at Deal', deal, await page.evaluate(() => JSON.stringify({ id: intel.paper && intel.paper.id, tab: pdTab() })));
    await page.evaluate(() => { document.querySelector('#ig-dock [data-pd-tab="copilot"]')?.click(); });

    /* ===== 3. SIGNING AND AMENDMENT ===== */
    const s = await ask('Send MK-J1 for signing');
    ok('3a "Send MK-J1 for signing" names the send screen set to Sign', !!s && s.door === 'signlink', JSON.stringify(s));
    const a = await ask('Make an amendment to MK-J1 extending it by a year');
    ok('3b "Make an amendment" is the amendment card, not a new draft', !!a && a.door === 'amend', JSON.stringify(a));
    await page.screenshot({ path: path.join(OUT, '3-cards.png') });

    /* ===== 4. A DRAFTED REPLY, SAID HONESTLY WITH NO KEY ===== */
    await page.evaluate(() => hbOpenAgent('quiet'));
    await page.waitForSelector('[data-hb-ag-item^="quiet:"] [data-ag-act="draftreply"]', { timeout: 10000 }).catch(() => {});
    const btn = await page.$('[data-hb-ag-item^="quiet:"] [data-ag-act="draftreply"]');
    ok('4a the dropped thread offers "Draft a reply"', !!btn);
    if (btn) await btn.click();
    const said = await page.waitForFunction(() => /No Copilot key is set up|Copilot could not write a reply|Copilot came back with nothing to say|A reply Copilot drafted/.test((document.querySelector('[data-hb-ag-item^="quiet:"]') || {}).innerText || ''), null, { timeout: 15000 }).then(() => true, () => false);
    ok('4b the press ends in words: a draft, or why there is none', said, await page.evaluate(() => ((document.querySelector('[data-hb-ag-item^="quiet:"]') || {}).innerText || '').slice(0, 300)));
    /* a stand-in answer, so the hand-over into the drawer can be driven */
    await page.evaluate(() => { window.copilotAsk = async () => ({ answer: 'Thank you, Erik. The delivery address is our Ruiru warehouse, as in clause 1.' }); });
    const again = await page.$('[data-hb-ag-item^="quiet:"] [data-ag-act="draftreply"]'); if (again) await again.click();
    const drafted = await page.waitForFunction(() => /Ruiru warehouse/.test((document.querySelector('[data-hb-ag-item^="quiet:"]') || {}).innerText || '') && !!document.querySelector('[data-hb-ag-item^="quiet:"] [data-ag-act="usereply"]'), null, { timeout: 8000 }).then(() => true, () => false);
    ok('4c a drafted reply is shown, marked "check before sending", with Use this reply', drafted);
    await page.screenshot({ path: path.join(OUT, '4-reply.png') });
    if (drafted) await page.click('[data-hb-ag-item^="quiet:"] [data-ag-act="usereply"]');
    const inBox = await page.waitForFunction(() => { const b = document.querySelector('#panel-body [data-rl-np-rin]'); return !!(b && /Ruiru warehouse/.test(b.value)); }, null, { timeout: 8000 }).then(() => true, () => false);
    const sent = await page.evaluate(() => { const c = getContract('MK-J2'); return (c.thread || []).filter(m => /Ruiru/.test(m.text || '')).length; });
    const dbg = inBox ? '' : await page.evaluate(() => { const h = document.getElementById('panel-body'); return JSON.stringify({ open: !!(window.state && state.panelOpen), face: typeof panelFace === 'function' ? panelFace() : '', rooms: h ? [...h.querySelectorAll('[data-rl-np-room]')].map(b => b.getAttribute('data-rl-np-room') + (b.classList.contains('on') ? '*' : '')) : null, replies: h ? [...h.querySelectorAll('[data-rl-np-reply]')].map(b => b.getAttribute('data-rl-np-reply')) : null, text: h ? h.innerText.slice(0, 200) : '' }); });
    ok('4d Use this reply puts the words in the note\'s own reply box, and sends nothing', inBox && sent === 0, JSON.stringify({ inBox, sent }) + ' ' + dbg);

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
