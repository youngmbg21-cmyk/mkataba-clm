/* A TAB CHANGE NEVER FLASHES (owner, 12 Nov 2026, the stutter audit: "when i navigate between the tabs, the panels
   stutter or flash"; then "why can the old tabs [not] be deleted across the platform to avoid this?").
   The cause: a tab change laid a copy of the going face over Jambo's panel and faded it out while the new face faded
   in from nothing. The copy carried none of the panel's styles (they are scoped to #ig-dock), so a wrongly drawn face
   lay over a pale new one; a second repaint mid-fade threw the half-faded face away. Now nothing is copied, nothing
   fades. Looked at where the reader looks, frame by frame, never timed:
     1 · a tab press: no copy of the old face anywhere, no part of the panel fading, in the press's own turn
     2 · every frame after it: every part of the panel at full strength, the panel never empty
     3 · the press leaves the paper's line standing (not wiped and built again) where it says the same
     4 · no tab body is written a second time in the press (the code's own half is f1024 (3))
     5 · the lit tab's underline still glides (the one thing that moves)
     6 · another paper opened (a page-to-page move): the same, no copy and nothing fading
     7 · a panel that opens wider is simply there (no fade from nothing)
     10 · nothing changed, nothing written: a second ask for the same panel keeps its nodes, box and scroll (13 Nov 2026)
   At the parent 1, 2, 3, 6 and 7 fail (12 Nov); 3b's second half and 10 fail at 13 Nov's parent.
   Run: node test/chromium/tab-change-no-flash-verify.js */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const HTML = n => `<h1>SERVICES AGREEMENT ${n}</h1><p>This Agreement is made between Young and Ventura Capital.</p>`
  + ['Services', 'Fees', 'Term', 'Liability', 'Governing law'].map((t, i) => `<h2>${i + 1}. ${t}</h2><p>${t} are as set out in this clause ${i + 1} of agreement ${n}, and each party shall keep to them in good faith.</p>`).join('');
(async () => {
  const h = await startHati();
  const mk = (id, n) => { const c = fixtureContract(id, 'Services Agreement ' + n, 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
    return Object.assign(c, { redlineText: HTML(n), format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'Services.docx', extractedText: HTML(n).replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } }); };
  await seedWorkspace(h, { contracts: [mk('MK-110', 'One'), mk('MK-111', 'Two')] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 780 } });
  const errors = []; p.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110') && !!getContract('MK-111'), null, 40000);
  await p.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
  await p.evaluate(() => { pdOpenOnHome('MK-110', 'copilot'); });
  const up = await until(p, () => !!document.querySelector('#ig-dock [data-pd-tab="doc"]') && !!document.querySelector('#ig-dock [data-pd-tab="copilot"]') && !!document.querySelector('#ig-strip > *') && !!document.getElementById('ig-canvas'), null, 20000);
  /* the page at rest before anything is pressed: nothing still arriving */
  await until(p, () => !document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#ig-dock')), null, 5000);
  let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m !== undefined ? ' — ' + JSON.stringify(m) : ''}`); if (!ok) fails++; };
  check('0 · the paper is up with its tabs', up);

  /* one act, watched: what stands in the act's own turn, and in every frame for a while after */
  const watch = (what, arg) => p.evaluate(async ([what, arg]) => {
    const dock = () => document.getElementById('ig-dock');
    const fading = () => [...dock().children].filter(n => n.getAnimations().some(a => { try { return a.effect.getKeyframes().some(k => k.opacity != null); } catch (_){ return false; } })).length;
    const pale = () => [...dock().children].filter(n => !n.hidden && n.getClientRects().length && +getComputedStyle(n).opacity < 1).length;
    const line0 = document.querySelector('#ig-strip > *'); const lineWords0 = document.getElementById('ig-strip').textContent;
    let bodyWrites = 0;
    const mo = new MutationObserver(recs => recs.forEach(r => { if (r.target.id === 'pd-body' && r.target.isConnected && [...r.addedNodes].some(x => x.nodeType === 1)) bodyWrites++; }));
    mo.observe(dock(), { childList: true, subtree: true });
    if (what === 'tab'){ const t = document.querySelector(`#ig-dock [data-pd-tab="${arg}"]`); if (!t) return { missing: 'tab ' + arg }; t.click(); }
    else if (what === 'paper'){ pdOpenOnHome(arg, 'copilot'); }
    else if (what === 'widen'){ intel.dockOpen = true; renderIntelDock(); igSyncDockWidth(); }
    const now = { ghosts: document.querySelectorAll('.face-ghost').length, fading: fading(), pale: pale(), kids: dock().children.length,
      sameLine: document.querySelector('#ig-strip > *') === line0, sameWords: document.getElementById('ig-strip').textContent === lineWords0,
      ink: document.getAnimations().some(a => a.effect && a.effect.pseudoElement === '::after' && a.effect.target && a.effect.target.matches('#ig-dock .pd-tab.on')) };
    mo.takeRecords().forEach(r => { if (r.target.id === 'pd-body' && r.target.isConnected && [...r.addedNodes].some(x => x.nodeType === 1)) bodyWrites++; });
    let frames = 0, worst = { ghosts: 0, fading: 0, pale: 0, empty: 0 };
    const t0 = performance.now();
    while (performance.now() - t0 < 450){ await new Promise(r => requestAnimationFrame(() => r())); frames++;
      worst.ghosts = Math.max(worst.ghosts, document.querySelectorAll('.face-ghost').length);
      worst.fading = Math.max(worst.fading, fading()); worst.pale = Math.max(worst.pale, pale());
      if (!dock().children.length) worst.empty++; }
    mo.disconnect();
    return { now, frames, worst, bodyWrites, sameLine: document.querySelector('#ig-strip > *') === line0, sameWords: document.getElementById('ig-strip').textContent === lineWords0,
      on: (document.querySelector('#ig-dock .pd-tab.on') || { getAttribute(){ return null; } }).getAttribute('data-pd-tab') };
  }, [what, arg]);

  const a = await watch('tab', 'doc');
  check('1 · a tab press: no copy of the old face, nothing fading, in the press\'s own turn', !a.missing && a.now.ghosts === 0 && a.now.fading === 0 && a.now.pale === 0 && a.on === 'doc', a.now || a);
  check('2 · every frame after it: the panel at full strength, never empty', !a.missing && a.frames >= 5 && a.worst.ghosts === 0 && a.worst.fading === 0 && a.worst.pale === 0 && a.worst.empty === 0, { frames: a.frames, worst: a.worst });
  check('3 · the press leaves the paper\'s line standing where it says the same', !a.missing && (!a.now.sameWords || a.now.sameLine), { now: [a.now.sameLine, a.now.sameWords], later: [a.sameLine, a.sameWords] });
  check('5 · the lit tab\'s underline still glides', !a.missing && a.now.ink === true, a.now);
  const back = await watch('tab', 'copilot');
  check('1b · back to the Dossier: the same', !back.missing && back.now.ghosts === 0 && back.now.fading === 0 && back.worst.pale === 0 && back.worst.ghosts === 0 && back.on === 'copilot', { now: back.now, worst: back.worst });
  /* and half a second on: no later caller writes a line that says the same (igStripPut, 13 Nov 2026) */
  check('3b · the press back leaves the line standing, then and half a second on', !back.missing && (!back.now.sameWords || back.now.sameLine) && (!back.sameWords || back.sameLine), { now: [back.now.sameLine, back.now.sameWords], later: [back.sameLine, back.sameWords] });
  check('4 · no tab body is written a second time in a press', !a.missing && !back.missing && a.bodyWrites === 0 && back.bodyWrites === 0, [a.bodyWrites, back.bodyWrites]);

  /* 10 · NOTHING CHANGED, NOTHING WRITTEN (13 Nov 2026): on the Dossier a second ask for the panel writes nothing; a
     part moved since, or a tab filled by its own painter, is written whole as before */
  await until(p, () => typeof igDockKeptCount === 'function', null, 3000);
  const kept = await p.evaluate(async () => {
    if (typeof igDockKeptCount !== 'function') return { missing: 'igDockKeptCount' };
    const dock = document.getElementById('ig-dock');
    for (let k = 0; k < 6; k++) await new Promise(r => requestAnimationFrame(() => r()));
    renderIntelDock();                                      /* the panel as the painter leaves it */
    const feed = document.getElementById('igd-feed'), box = document.getElementById('igd-input'); if (!feed || !box) return { missing: 'the landing' };
    box.value = 'half a question'; feed.scrollTop = 40; const top = feed.scrollTop;
    /* keepable only where nothing in the panel is filled after the write and no box but the ask box stands */
    const keepable = !dock.querySelector(window.IG_DOCK_FILLED_SEL || '#pd-og') && ![...dock.querySelectorAll('input, select, textarea')].some(n => n.id !== 'igd-input');
    const n0 = igDockKeptCount(); renderIntelDock(); renderIntelDock();
    const same = { keepable, n: igDockKeptCount() - n0, feed: document.getElementById('igd-feed') === feed, box: document.getElementById('igd-input') === box, words: document.getElementById('igd-input').value, top: document.getElementById('igd-feed').scrollTop === top };
    /* every button still finds an act: its number is one this build minted (the highest numbers are the newest) */
    const acts = [...dock.querySelectorAll('[data-pd-act]')].map(b => b.getAttribute('data-pd-act'));
    /* something in the panel moved: the next ask writes it whole */
    feed.setAttribute('data-moved', '1'); const n1 = igDockKeptCount(); renderIntelDock();
    const moved = { n: igDockKeptCount() - n1, fresh: document.getElementById('igd-feed') !== feed, words: document.getElementById('igd-input').value };
    document.getElementById('igd-input').value = '';
    /* Clauses is filled by its own painter: always written */
    document.querySelector('#ig-dock [data-pd-tab="doc"]').click();
    const body = document.getElementById('pd-body'); const n2 = igDockKeptCount(); renderIntelDock();
    const tab = { n: igDockKeptCount() - n2, fresh: document.getElementById('pd-body') !== body };
    document.querySelector('#ig-dock [data-pd-tab="copilot"]').click();
    return { same, acts: acts.length, moved, tab };
  });
  /* where the landing holds a part filled after the write, it is written whole every time (any doubt = written whole) */
  check('10a · asked again with nothing changed, a keepable panel is not written (same nodes, scroll); any other is written whole; the box\'s words stay either way',
    !kept.missing && kept.same.words === 'half a question' && (kept.same.keepable ? (kept.same.n === 2 && kept.same.feed && kept.same.box && kept.same.top) : kept.same.n === 0), kept.same || kept);
  check('10b · a part moved since: written whole, the box\'s words carried as before', !kept.missing && kept.moved.n === 0 && kept.moved.fresh && kept.moved.words === 'half a question', kept.moved);
  check('10c · a tab filled by its own painter is always written', !kept.missing && kept.tab.n === 0 && kept.tab.fresh, kept.tab);
  /* 10d · every kept button still finds its act: the number it carries is one this build minted */
  const live = await p.evaluate(() => {
    if (typeof pdActKnown !== 'function') return { missing: 'pdActKnown' };
    const dock = document.getElementById('ig-dock'); renderIntelDock(); const n0 = igDockKeptCount(); renderIntelDock();
    const ids = [...dock.querySelectorAll('[data-pd-act]')].map(b => b.getAttribute('data-pd-act')).filter(Boolean);
    return { keptNow: igDockKeptCount() - n0, n: ids.length, dead: ids.filter(id => !pdActKnown(id)).length };
  });
  check('10d · every button still finds its act after a second ask', !live.missing && live.keptNow <= 1 && live.dead === 0, live);

  const other = await watch('paper', 'MK-111');
  const landed = await until(p, () => !!(window.pdContract && pdContract() && String(pdContract().id) === 'MK-111'), null, 10000);
  check('6 · another paper opened: no copy of the old panel, nothing fading', landed && other.now.ghosts === 0 && other.worst.ghosts === 0 && other.worst.fading === 0 && other.worst.pale === 0 && other.worst.empty === 0, { now: other.now, worst: other.worst });

  await p.evaluate(() => { intel.dockOpen = false; renderIntelDock(); igSyncDockWidth(); });
  await until(p, () => !!document.getElementById('igd-expand'), null, 5000);
  const wide = await watch('widen');
  check('7 · a panel that opens wider is simply there', wide.now.fading === 0 && wide.now.pale === 0 && wide.worst.fading === 0 && wide.worst.pale === 0
    && !(await p.evaluate(() => document.getElementById('ig-dock').classList.contains('ig-dock-in'))), { now: wide.now, worst: wide.worst });

  /* less motion asked: the underline does not glide either */
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const still = await watch('tab', 'doc');
  check('8 · for a reader who asked for less motion nothing moves at all', !still.missing && still.now.ink === false && still.now.fading === 0 && still.now.ghosts === 0, still.now);
  check('9 · nothing on the page threw', errors.length === 0, errors.slice(0, 3));
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
