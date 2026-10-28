/* "SHOW ME WHICH CONTRACTS WERE IMPORTED", ON EXPLORER, IN A REAL BROWSER
   (owner-reported 18 Oct 2026, off an iPad screenshot; f919 pins the parts)

   The owner asked Explorer's Jambo which contracts were imported. The map
   regrouped by origin and kept every contract; the panel said "these 24
   contracts were imported", then "29". Jambo is a scripted stand-in here,
   answering what the real one now can — the new `imported` filter — so what
   is measured is HaTi: what the map keeps, what the panel says and counts.

   WHAT THIS PINS
     1 asked in the dock's own box, the map keeps the imported contracts only
       (the Import page's, never a single upload) and the panel counts them
       itself, with "Read all N" under the answer
     2 Origin draws Imported as its own group beside Uploaded paper
     3 where Jambo only regroups and counts on his own, his number is not
       printed and HaTi's line is what is read first
   At the parent (cb6290f) 1 and 2 fail (no filter, no group) and 3 prints the
   model's count. Waits ask for the state, bounded.

   RE-POINTED 18 Oct 2026 (main's #345, ANSWER WHERE YOU STAND): the owner's
   own words are now answered by the map's own reader, with no call to Jambo,
   so 1a–1c measure that answer and 1d asks the cards' mark in words only
   Jambo reads ("came over from the legacy system"); part 3 asks in those
   words too, so his regroup and his count still reach the panel.
   Run: node test/chromium/imported-on-the-map-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

/* three brought in on the Import page, two single uploads, the fixtures drafted */
const IMPORTED = ['MK-I1', 'MK-I2', 'MK-I3'];
const imp = (id, name, cp, folder, value) => ({ ...fixtureContract(id, name, cp, folder, value, 'Signed'), source: 'upload',
  upload: { fileName: name + '.pdf' }, migration: { importedAt: '2026-10-01T09:00:00Z', batch: 'b-1', needsReview: false } });
const up = (id, name, cp, folder, value) => ({ ...fixtureContract(id, name, cp, folder, value, 'Under Review'), source: 'upload', upload: { fileName: name + '.pdf' } });
const BOOK = FIXTURES.concat([
  imp('MK-I1', 'Old lease one', 'Naivas Supermarkets', 'proc', 3e6), imp('MK-I2', 'Old lease two', 'Kabras Sugar', 'sales', 2e6),
  imp('MK-I3', 'Old supply', 'Nandi Dairy', 'proc', 1e6),
  up('MK-U1', 'Single upload one', 'Wasoko', 'proc', 4e6), up('MK-U2', 'Single upload two', 'Twiga Foods', 'sales', 5e6)]);

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const askInBox = async q => {
      if (!(await page.locator('#igd-input').count())) { check('the dock\'s box is there (nothing to type in)', false); return false; }
      /* RE-PINNED 28 Oct 2026 ("Door above the box": typed words are the brain's but a page's one name): asked as a chip asks */ await page.evaluate(w => intelAsk(w), q); return true; };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(n => window.state && state.contracts && state.contracts.length >= n, BOOK.length, { timeout: 20000 });
    /* signing in on a computer lands on the Counter a moment later; turning to
       Explorer before that landing would be undone by it */
    await until(() => state.view === 'counter', null, 10000);
    await page.evaluate(() => { state.aiConfigured = true; setView('dashboard'); hbSetFace('explorer'); });
    const onMap = await until(() => hbFace() === 'explorer' && window.IG && IG.contracts && IG.contracts.length > 0 && !!document.getElementById('igd-input'));
    check('0 Explorer is up, its dock\'s box ready', !!onMap);
    const total = await page.evaluate(() => state.contracts.length);

    console.log('\n1 · the owner\'s ask, in the dock\'s own box');
    ai.reset();
    ai.script({ content: [{ type: 'tool_use', id: 'tu_g', name: 'render_graph', input: { where: { imported: true }, action: 'filter', note: 'Imported',
      answer: 'These 29 contracts were imported, the largest the Naivas lease.' } }] });
    if (await askInBox('Show me which contracts were imported')) {
      const got = await until(n => { const m = intel.history[intel.history.length - 1]; if (!m || m.role !== 'assistant' || !m.listIds) return null;
        const act = intelActive(); return { kept: act.ids ? [...act.ids].sort() : null, action: act.action, list: m.listIds.slice().sort(),
          panel: (document.getElementById('ig-dock') || {}).textContent.replace(/\s+/g, ' ') }; }, total, 10000);
      check('1a the map keeps the imported contracts only — never a single upload', !!got && JSON.stringify(got.kept) === JSON.stringify(IMPORTED) && got.action === 'filter',
        got && JSON.stringify({ kept: got.kept, action: got.action }));
      check('1b HaTi counts them: "Showing 3 of N", and Jambo\'s 29 is not printed', !!got && got.panel.includes(`Showing 3 of ${total}`) && !/29 contracts/.test(got.panel),
        got && got.panel.slice(0, 220));
      check('1c "Read all 3" rides the answer', !!got && /Read all 3/.test(got.panel), got && (got.panel.match(/Read all \d+[^·]{0,20}/) || [''])[0]);
      check('1d0 the owner\'s words are answered on the map, without a call to Jambo', ai.calls.length === 0, 'calls ' + ai.calls.length);
      await shot(page, 'imported-1-filtered');
    }
    /* words the map's own reader leaves alone reach Jambo, and his cards carry the mark */
    await page.evaluate(() => { intel.lenses = []; rebuildIntelGraph(); });
    ai.reset();
    ai.script({ content: [{ type: 'tool_use', id: 'tu_g1', name: 'render_graph', input: { where: { imported: true }, action: 'filter', note: 'Imported',
      answer: 'These 29 contracts came over from the legacy system.' } }] });
    const before1 = await page.evaluate(() => intel.history.length);
    if (await askInBox('Which contracts came over from the legacy system?')) {
      const got = await until(b => { if (intel.history.length <= b || intel.busy) return null; const m = intel.history[intel.history.length - 1];
        if (!m || m.role !== 'assistant') return null; const act = intelActive(); return { kept: act.ids ? [...act.ids].sort() : null, text: m.text }; }, before1, 10000);
      const sent = JSON.stringify((ai.calls[0] || {}).body || {});
      check('1d the cards that reached Jambo carry the mark', sent.includes('\\"imported\\":true') && sent.includes('where.imported true'), 'calls ' + ai.calls.length);
      check('1e his filter keeps the three, and his 29 is not printed', !!got && JSON.stringify(got.kept) === JSON.stringify(IMPORTED) && !/29 contracts/.test(got.text),
        got && JSON.stringify({ kept: got.kept, text: String(got.text).slice(0, 120) }));
    }

    console.log('\n2 · Origin draws Imported as its own group');
    await page.evaluate(() => { intel.lenses = []; intel.groupBy = 'source'; intel.groups = null; rebuildIntelGraph(); });
    const groups = await until(() => { if (!window.IG || !IG.hubs || !IG.hubs.length) return null;
      const by = {}; IG.contracts.forEach(n => { const g = n.hub && n.hub.label; (by[g] = by[g] || []).push(n.id); }); return by.Imported ? by : null; });
    check('2a Imported holds the three, Uploaded paper the two single files', !!groups && JSON.stringify((groups.Imported || []).sort()) === JSON.stringify(IMPORTED)
      && JSON.stringify((groups['Uploaded paper'] || []).sort()) === JSON.stringify(['MK-U1', 'MK-U2']), groups && JSON.stringify(Object.keys(groups)));

    console.log('\n3 · only regrouped, counted on his own');
    await page.evaluate(() => { intel.lenses = []; intel.groupBy = 'folder'; rebuildIntelGraph(); });
    ai.reset();
    ai.script({ content: [{ type: 'tool_use', id: 'tu_g2', name: 'render_graph', input: { groupBy: 'source', note: 'By origin',
      answer: 'These 24 contracts were imported from external sources, mostly leases.' } }] });
    const before = await page.evaluate(() => intel.history.length);
    if (await askInBox('Which contracts came over from the legacy system?')) {
      const said = await until(b => { if (intel.history.length <= b || intel.busy) return null; const m = intel.history[intel.history.length - 1];
        return m && m.role === 'assistant' ? { text: m.text, how: m.how || '', lenses: intel.lenses.length } : null; }, before, 10000);
      check('3a his 24 is not printed', !!said && !/24 contracts/.test(said.text), said && said.text.slice(0, 160));
      check('3b HaTi\'s line is read first, nothing hidden behind "How this was drawn"', !!said && /^Grouped \d+ contracts into \d+ groups by origin/.test(said.text) && said.how === '',
        said && JSON.stringify({ start: said.text.slice(0, 60), how: said.how }));
      check('3c and nothing was taken off the map', !!said && said.lenses === 0);
      await shot(page, 'imported-3-regrouped');
    }
    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
    process.exit(failures ? 1 : 0);
  }
})();
