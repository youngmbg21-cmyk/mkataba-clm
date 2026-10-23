/* THE PAPER'S LINE, "ONE LINE" (round 6 of the redesign: the owner picked
   "One line" by name and answered "No" to the ⋯ coming back to the head,
   17 Oct 2026; js/views/intelligence.js igLineIdHtml)

   WHAT THIS PINS, driven in a real browser on a seeded workspace with a
   colleague reading the contract and a code name set
     1 the line says who and what: the number, the name in the strong weight,
       the other party, the code-name mark (an insider's line), the stage as
       the house's pill with its round while it is negotiated
     2 who is on it now: the colleague's face is drawn on the line (presence
       had no slot on Home's paper before), and nothing is drawn when alone
     3 the paper's own acts and nothing else: Clean · Redline · Their view,
       Notes with its word, Share; no ⋯ (its rows are Jambo's Menu tab) and
       no "‹ Contracts" (the way back is the frame's desk tab)
     4 the line keeps its height at the owner's three screens and nothing runs
       past its edges; the first line of wording does not move
   Waits ask for the state, bounded; a part that is missing reports instead of
   waiting out the clock.
   Run: node test/chromium/paper-line-verify.js */
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
  '1. Parties and purpose', '', 'This Master Services Agreement is made between Lindqvist & Co AB, Stockholm (the Customer), and Nordvik Logistik AB, Gothenburg (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care.', '',
  '7. Limitation of liability', '', 'Each party\'s total liability under this Agreement shall not exceed 50% of the fees paid in the twelve months before the claim.'].join('\n');

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4.2e6, 'Under Review', DOC);
  c0.metadata.currency = 'SEK'; c0.owner = { id: me.id, name: me.name };
  c0.negotiation = { round: 2, rounds: [] };
  await W.admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const c1 = H.fixtureContract('MK-0383', 'Cleaning services agreement', 'Städ AB', H.FOLDER_B, 0, 'Draft', DOC);
  c1.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-0383', { method: 'PUT', body: { contract: c1, baseVersion: 0 } });
  const cn = await W.admin.raw('/api/contracts/MK-0382/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [W.users.unrestricted.id] } });
  const here = () => W.unrestricted.raw('/api/contracts/MK-0382/here', { method: 'POST', body: {} }).catch(() => null);
  await here();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const open = async id => { await page.evaluate(i => pdOpenOnHome(i, 'copilot'), id);
      return until(i => window.intel && intel.paper && intel.paper.id === i && !!document.querySelector('#ig-strip .ig-line-id'), id); };

    /* 1 who and what */
    const up = await open('MK-0382');
    check('0 the contract is on Home\'s paper with its line drawn', !!up);
    const id = await page.evaluate(() => {
      const s = document.getElementById('ig-strip'); const q = x => s && s.querySelector(x);
      const t = q('.ig-line-t'), st = q('.ig-line-st .room-stat');
      return { ref: (q('.hati-ref') || {}).textContent, name: t && t.textContent, weight: t ? Number(getComputedStyle(t).fontWeight) : 0,
        party: (q('.ig-line-p') || {}).textContent, cn: (q('.ig-line-cn') || {}).textContent, stage: st && st.textContent.replace(/\s+/g, ' ').trim() };
    });
    /* RE-POINTED 21 Oct 2026 (owner): the party is the bar's; the line keeps the number and the kind of contract */
    /* RE-POINTED 23 Oct 2026 (owner: "yes" — the bar carries the number too): the line keeps the kind of contract alone */
    check('1a the name in the strong weight, no number, no party', !id.ref && id.name === 'Master services agreement' && id.weight >= 500 && !id.party, JSON.stringify(id));
    check('1b the stage is the house pill, with the round while it is negotiated', /^In Review · round 2$/.test(id.stage || ''), id.stage);
    check('1c an insider\'s line carries the code-name mark', cn.status === 200 && id.cn === 'Project Falcon', cn.status + ' · ' + id.cn);

    /* 2 who is on it now */
    const faces = await until(() => document.querySelectorAll('#ig-strip [data-pz-slot] .pz-face').length, null, 8000);
    check('2a the colleague reading it is a face on the line', faces === 1, String(faces));
    const alone = await open('MK-0383') && await page.evaluate(() => ({ faces: document.querySelectorAll('#ig-strip .pz-face').length,
      slot: (() => { const s = document.querySelector('#ig-strip [data-pz-slot]'); return s ? getComputedStyle(s).display : 'none'; })(), cn: !!document.querySelector('#ig-strip .ig-line-cn'), stage: (document.querySelector('#ig-strip .room-stat') || {}).textContent }));
    check('2b alone, no face and no empty box; no code name, no round where there is none', alone && alone.faces === 0 && alone.slot === 'none' && !alone.cn && /^Drafting$/.test((alone.stage || '').trim()), JSON.stringify(alone));

    /* 3 the paper's own acts */
    await open('MK-0382');
    const acts = await page.evaluate(() => {
      const s = document.getElementById('ig-strip');
      const n = document.getElementById('hdr-chat');
      const c = getContract('MK-0382'), red = !!(window.pdRedOk && pdRedOk(c));
      return { red, views: [...s.querySelectorAll('[data-ig-red]')].map(b => b.textContent.trim()), notes: n ? n.textContent.replace(/\s+/g, ' ').trim() : null,
        notesIn: !!(n && s.contains(n)), share: !!s.querySelector('#ws-share'), more: !!s.querySelector('#ws-more, [data-more], .ig-more'), back: !!s.querySelector('[data-ig-pick-again]') };
    });
    /* the three views are drawn where the paper has redlines to show (pdRedOk), as before */
    check('3a Clean · Redline · Their view where there are redlines, Notes with its word, Share', acts.views.length === (acts.red ? 3 : 0) && acts.notesIn && /^Notes/.test(acts.notes || '') && acts.share, JSON.stringify(acts));
    check('3b no ⋯ on the line (its rows are the dossier\'s All acts) and no "‹ Contracts" (the frame\'s tabs are the way back)', !acts.more && !acts.back, JSON.stringify(acts));
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the ⋯ rows are the dossier's All acts fold */
    const menu = await page.evaluate(() => !!document.querySelector('#ig-dock .ds-fold[data-ds-fold="acts"]') && !document.querySelector('#ig-dock [data-pd-tab="menu"]'));
    check('3c the ⋯ rows are the dossier\'s All acts fold', menu);

    /* 4 the three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await here();
      await open('MK-0382');
      await until(() => document.querySelectorAll('#ig-strip .pz-face').length, null, 4000);
      const m = await page.evaluate(() => {
        const s = document.getElementById('ig-strip'); const sr = s.getBoundingClientRect();
        const kids = [...s.querySelectorAll('.ig-line-id, .ig-line-cn, .ig-line-st, .ig-line-faces, .ig-red, .ig-acts')];
        const over = kids.filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > sr.right + 1 || r.left < sr.left - 1 || r.top < sr.top - 1 || r.bottom > sr.bottom + 1); }).map(e => e.className);
        const sheet = document.querySelector('#ig-paper .pg-sheet, #ig-paper .doc-surface');
        const first = sheet ? [...sheet.querySelectorAll('p, li, div, span')].find(el => el.children.length === 0 && el.textContent.trim().length > 40 && el.getClientRects().length) : null;
        const bar = getComputedStyle(document.getElementById('ig-page') || document.body).getPropertyValue('--ig-bar-h').trim();
        return { h: Math.round(sr.height), bar, over, first: first ? Math.round(first.getBoundingClientRect().top) : null, ink: (document.querySelector('#ig-strip .ig-line-t') || {}).textContent };
      });
      check(`4 ${w}×${ht}: the line keeps its height, nothing past its edges`, m.h === parseInt(m.bar, 10) && !m.over.length, JSON.stringify(m));
      check(`4 ${w}×${ht}: the first line of wording sits where it did (365)`, m.first != null && m.first <= 365, String(m.first));
      await shot(page, `paper-line-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
