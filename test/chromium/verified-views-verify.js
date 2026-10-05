/* Chromium verification: VERIFIED VIEWS (work order "the board that answers
   right", Part 9, 5 Oct 2026; screen 7 of the sketches)
   ============================================================
     1. an admin's card carries ⋯; its menu has "Verified view…";
     2. the form saves through the route: the card head wears VERIFIED;
     3. asking one of its questions draws that card, free, and the reply says
        VERIFIED with who set it;
     4. the badge and the who-line are painted (not clipped, not hidden);
     5. no page errors.
   Run: node test/chromium/verified-views-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'verified-views');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = ['Draft', 'Under Review', 'Signed', 'Signed', 'Signed'].map((st, i) => fixtureContract('MK-' + (690 + i), 'Agreement ' + i, ['Juno AB', 'Baltic Oy', 'Nordkraft AB'][i % 3], i % 2 ? 'proc' : 'sales', 1e6, st));
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && state.contracts.length === ids.length && ids.every(id => state.contracts.some(c => c.id === id)) && typeof isAdmin === 'function' && isAdmin(), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    const pid = await page.evaluate(() => { const { p } = hbAddCard({ all: true }, { pic: 'bars', split: { by: 'status' }, measure: 'count' }, 'Stages for the board pack'); hbPaintBoard(); return p.id; });
    await until(id => document.querySelector(`[data-hb-pid="${id}"] [data-hb-act="more"]`) ? true : null, pid);
    await page.click(`[data-hb-pid="${pid}"] [data-hb-act="more"]`);
    const s1 = await until(id => { const m = document.querySelector(`[data-hb-pid="${id}"] .hb-pmenu`); return m ? [...m.querySelectorAll('button')].map(b => b.textContent.trim()) : null; }, pid);
    await page.screenshot({ path: path.join(OUT, '1-menu.png') });
    check('1 the admin\'s card has ⋯ with "Verified view…"', JSON.stringify(s1) === JSON.stringify(['Verified view…']), JSON.stringify(s1));
    await page.click(`[data-hb-pid="${pid}"] [data-hb-act="verify"]`);
    await until(id => document.querySelector(`[data-hb-ver-form="${id}"]`) ? true : null, pid);
    await page.fill(`[data-hb-ver-form="${pid}"] textarea[name="phrases"]`, 'board pack stages\nwhere do deals stand');
    await page.click(`[data-hb-ver-form="${pid}"] button[type="submit"]`);
    const s2 = await until(id => { const b = document.querySelector(`[data-hb-pid="${id}"] .hb-ch .hb-vb`); const v = (state.settings.boardVerified || [])[0];
      return b && v ? { badge: b.textContent.trim(), title: v.title, phrases: v.phrases, by: v.by } : null; }, pid);
    await page.screenshot({ path: path.join(OUT, '2-set.png') });
    check('2 saved through the route; the card head wears VERIFIED', !!s2 && s2.badge === 'VERIFIED' && s2.title === 'Stages for the board pack' && s2.phrases.length === 2 && s2.by === 'Amina Otieno', JSON.stringify(s2));
    await page.evaluate(async () => { intel.history = []; await intelAsk('Where do deals stand?'); });
    const s3 = await until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant').pop(); const s = hbS(); const k = (s.path || []).slice(-1)[0]; const p = s.panels.find(x => x.key === k);
      return a && /VERIFIED/.test(String(a.text)) && p && p.verified ? { free: /Free/.test(String(a.text)), by: /set by Amina Otieno/.test(String(a.text)), cards: s.panels.filter(x => x.verified).length } : null; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '3-answer.png') });
    check('3 asking a named question draws the card, free, VERIFIED with who', !!s3 && s3.free && s3.by && s3.cards === 1, JSON.stringify(s3));
    const s4 = await page.evaluate(() => {
      const seen = el => { if (!el) return false; const r = el.getClientRects()[0] || el.getBoundingClientRect(); if (!r.width || !r.height) return false; const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!hit && (hit === el || el.contains(hit)); };
      const vb = [...document.querySelectorAll('.hb-vb')]; const by = [...document.querySelectorAll('.hb-ver-by')].pop();
      if (by) by.scrollIntoView({ block: 'center' });
      return { badges: vb.length, painted: vb.filter(seen).length, byLine: seen(by), srcOnVerified: !!document.querySelector('.hb-panel .hb-vb ~ .hb-src') };
    });
    check('4 the badge (reply, card and its open copy) and the who-line are painted; no "Built by Copilot" on a verified card', s4.badges >= 3 && s4.painted >= 2 && s4.byLine && !s4.srcOnVerified, JSON.stringify(s4));
    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
