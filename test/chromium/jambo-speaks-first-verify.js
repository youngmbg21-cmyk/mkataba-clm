/* JAMBO SPEAKS FIRST ON AN UPLOAD — where the reader looks
   ============================================================
   Round 1 of Jambo's journey (owner, 22 Oct 2026: "First thing after
   uploading a contract, jambo pops up to advise you IN VERY NATURAL AND PLAIN
   LANGUAGE"; "May Jambo speak first on arrival? Yes"). f922 pins the reading
   and the presses; this file asks the reader's questions in a real browser:
     1 · a file dropped through Jambo's own drop area is read on arrival, and
         when the reading lands his panel beside the paper turns to him and
         he says who the other side is and what to push back on — painted
         pixels in his panel, no band anywhere on the page
     2 · the recommended road is first and filled; one filled button
     3 · "No, someone else" lands on the other side's name to type it; "Negotiate it" the
         Redlines face; "Just send it" the share card, which sends nothing
     4 · he speaks once: a refresh and the paper again add nothing
     5 · the owner's three screens: the words in view, nothing sideways
   Run: node test/chromium/jambo-speaks-first-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startAiStub, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'jambo-speaks-first');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
/* a picture is taken once the page's own cross-fades have finished, never mid-way */
const still = page => until(page, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);

/* their paper, with something in it worth pushing back on */
const TEXT = [
  'SOFTWARE SUBSCRIPTION AGREEMENT',
  '',
  'This agreement is made between Highland Corporate Ltd and Nordvik Logistik AB.',
  '',
  '1. Term',
  'This agreement runs for three years. The Customer may terminate on thirty days notice. The Supplier may not terminate.',
  '',
  '2. Liability',
  'The Supplier shall be liable for all losses of any kind without limitation.',
  '',
  '3. Payment',
  'The Customer shall pay each invoice within sixty (60) days of receipt.',
  '',
  '4. Governing law',
  'This Agreement is governed by the laws of California.',
].join('\n');

(async () => {
  const ai = await startAiStub();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const blocked = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const P = await ctx.newPage();
    P.setDefaultTimeout(8000);
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    const drive = async (fn, arg, fallback) => {
      try { return await P.evaluate(fn, arg); } catch (e) { blocked.push(String(e && e.message || e).split('\n')[0]); return fallback; }
    };
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke');
    await P.fill('#li-pass', 'adminpassword1');
    await P.click('#li-go');
    await until(P, () => !!(window.currentUser && currentUser() && typeof getContract === 'function'), null, 15000);
    await P.evaluate(() => { state.aiConfigured = true; });

    /* ============ 1 · THE DROP, THE READING, HIS WORDS ============ */
    const got = await drive(async t => {
      const f = new File([t], 'Nordvik_SaaS_Agreement.txt', { type: 'text/plain' });
      const r = await uploadFromDrop(f, {});
      return r && r.id ? { id: r.id } : { r: JSON.stringify(r) };
    }, TEXT, {});
    const id = got && got.id;
    check(!!id, '1a the drop area filed the file as a contract', got);
    const spoke = await until(P, i => {
      const H = (window.intel && intel.history) || [];
      return H.some(m => m && m.firstRead === i) && !!document.querySelector('#ig-dock .jb-turn');
    }, id, 60000);
    check(spoke, '1b when the arrival reading lands, he speaks in his panel');
    /* the panel finishes its repaint before it is measured or photographed (no dimmed frame) */
    await until(P, () => { const t = document.querySelector('#ig-dock .jb-turn'); if (!t) return false;
      for (let n = t; n && n !== document.body; n = n.parentElement){ const cs = getComputedStyle(n); if (cs.opacity !== '1' || cs.filter !== 'none') return false; } return true; }, null, 8000);
    const seen = await drive(i => {
      const turns = [...document.querySelectorAll('#ig-dock .jb-turn')].filter(t => /other side/.test(t.innerText));
      const t = turns[0]; if (!t) return null;
      const r = t.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + Math.min(40, r.width / 2), r.top + Math.min(14, r.height / 2));
      const all = [...document.querySelectorAll('#ig-dock .jb-turn')].map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ');
      const c = getContract(i);
      return { painted: !!(at && t.contains(at)), inDock: !!t.closest('#ig-dock'), text: all.slice(0, 600),
        onPaper: !!(window.pdContract && pdContract() && String(pdContract().id) === String(i)),
        saidAt: !!(c && c.triage && c.triage.saidAt), party: c && c.counterparty };
    }, id, null);
    check(!!(seen && seen.painted && seen.inDock), '1c his words are painted pixels in his panel', seen && { painted: seen.painted });
    check(!!(seen && seen.onPaper), '1d beside the new contract\'s paper on Home');
    check(!!(seen && /as the other side|who the other side is/.test(seen.text) && /push back/.test(seen.text)), '1e he says who the other side is (or asks, where the file names nobody) and what to push back on', seen && seen.text);
    check(!!(seen && seen.saidAt), '1f the reading records that he said it');
    const bands = await drive(() => document.querySelectorAll('.fr-band, [data-fr-band]').length, null, -1);
    check(bands === 0, '1g no band anywhere on the page');
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-spoken.png') });

    /* ============ 2 · THE ROAD ============ */
    const road = await drive(() => {
      const box = [...document.querySelectorAll('#ig-dock .igd-choices')].pop(); if (!box) return null;
      const bs = [...box.querySelectorAll('button')];
      return { words: bs.map(b => b.innerText.trim()), filled: bs.filter(b => b.classList.contains('ui-btn-primary')).map(b => b.innerText.trim()) };
    }, null, null);
    check(!!(road && road.words.length === 2 && road.filled.length === 1 && road.filled[0] === road.words[0]), '2a the recommended road is first and the only filled button', road);

    /* ============ 5 · THE OWNER'S THREE SCREENS, while he speaks ============ */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh });
      await drive(() => { const t = [...document.querySelectorAll('#ig-dock .jb-turn')].find(x => /other side/.test(x.innerText)); if (t) t.scrollIntoView({ block: 'nearest' }); }, null, null);
      const fit = await drive(() => ({ side: document.documentElement.scrollWidth > window.innerWidth + 1,
        dock: (() => { const d = document.getElementById('ig-dock'); if (!d) return null; const r = d.getBoundingClientRect(); return r.right <= window.innerWidth + 1 && r.width > 200; })() }), null, {});
      const words = await drive(() => { const t = [...document.querySelectorAll('#ig-dock .jb-turn')].find(x => /other side/.test(x.innerText)); if (!t) return false;
        const r = t.getBoundingClientRect(); const at = document.elementFromPoint(r.left + 30, r.top + 12); return !!(at && t.contains(at)); }, null, false);
      check(!fit.side && fit.dock === true && words, `5 ${w}×${hh}: his words are on screen, the panel fits, nothing scrolls sideways`, { ...fit, words });
      await still(P); await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* ============ 3 · EACH ANSWER IS A DOOR ============ */
    const press = async label => drive(l => {
      const b = [...document.querySelectorAll('#ig-dock [data-ig-choice]')].find(x => x.innerText.trim() === l);
      if (!b) return false; b.click(); return true;
    }, label, false);
    check(await press('No, someone else') || await press('Name the other side'), '3a "No, someone else" (or "Name the other side") is there to press');
    const named = await until(P, () => { const r = document.querySelector('#ig-dock tr[data-pd-og-row="counterparty"]');
      if (!r) return false; const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 20, b.top + Math.min(10, b.height / 2));
      return b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight && !!(at && r.contains(at)); }, null, 8000);
    check(named, '3b the panel turns back to the Dossier and lands on the other side\'s name, in view');
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-their-name.png') });
    /* back to the conversation by his own tab, and the road */
    await drive(() => { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); }, null, null);
    await until(P, () => !!document.querySelector('#ig-dock [data-ig-choice]'), null, 5000);
    check(await press('Negotiate it'), '3c "Negotiate it" is there to press');
    check(await until(P, () => typeof pdFaceNow === 'function' && pdFaceNow() === 'red', null, 8000), '3d it opens the Redlines face beside the paper');
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-redlines.png') });
    /* a second file for "Just send it" (an answer is spent once pressed) */
    const got2 = await drive(async t => {
      const f = new File([t.replace('Nordvik Logistik AB', 'Brightline Studio AB')], 'Brightline_NDA.txt', { type: 'text/plain' });
      const r = await uploadFromDrop(f, {}); return r && r.id ? { id: r.id } : { r: JSON.stringify(r) };
    }, TEXT, {});
    const id2 = got2 && got2.id;
    await until(P, i => (intel.history || []).some(m => m && m.firstRead === i) && !!document.querySelector('#ig-dock [data-ig-choice]'), id2, 60000);
    let sends = 0;
    P.on('request', r => { if (r.method() === 'POST' && /\/api\/(shares\b|contracts\/[^/]+\/(share|send|pass))/.test(r.url())) sends++; });
    check(await press('Just send it'), '3e "Just send it" is there to press');
    check(await until(P, () => !!document.querySelector('#ig-dock .ca-card [data-ca-act="shareout"]'), null, 5000), '3f it answers with the share card');
    check(sends === 0, '3g and nothing was sent', { sends });
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-send-card.png') });

    /* ============ 4 · ONCE ============ */
    const before = await drive(i => intel.history.filter(m => m && m.firstRead === i).length, id, -1);
    await P.reload({ waitUntil: 'networkidle' });
    await until(P, i => !!(window.currentUser && currentUser() && typeof getContract === 'function' && getContract(i)), id, 15000);
    await drive(i => pdOpenOnHome(i, 'copilot'), id, null);
    await until(P, i => !!(window.pdContract && pdContract() && String(pdContract().id) === String(i)), id, 8000);
    const after = await drive(i => ((window.ai && ai.history) || []).filter(m => m && m.firstRead === i).length, id, -1);
    check(before === 2 && after <= 2, '4a a refresh and the paper again add nothing: he spoke once', { before, after });

    check(!errors.length, 'no page errors', errors.slice(0, 3));
  } catch (e) {
    check(false, 'the run finished', String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
  } finally {
    if (blocked.length) console.log('BLOCKED  ' + [...new Set(blocked)].join(' · '));
    await browser.close(); await h.stop(); await ai.stop();
    console.log(`\n${passes} passed, ${failures} failed`);
    process.exit(failures ? 1 : 0);
  }
})();
