/* ============================================================
   THE FLASH MEASURE — a measuring instrument, not a test
   (owner, 12–13 Nov 2026: "when i navigate … the panels stutter or flash … I have also discovered this when i
   navigate between pages"; then, of the list pages and Settings: "fix all these")
   ============================================================
   It asserts nothing and always exits 0. It FILMS every move between pages: for 600 ms after each move it looks at
   every frame and prints what a person could have seen as a flash or a stutter:
     fades    anything big that is fading (an animation or transition of its opacity), named
     pale     frames in which a big part of the page stood at less than full strength
     blank    frames in which the page area held nothing
     late     big parts written again AFTER the move's own turn (a second draw), with when (ms) and which part
     jump     how far things already on screen moved (the browser's own layout-shift score)
   A move with nothing to say prints "clean". Under a move that is not clean it says WHO (13 Nov 2026, "fix the flash
   issues"): for a late write, the code that wrote it (the first frames of HaTi's own files); for a jump, which part
   moved and from where to where.

   Run by .github/workflows/flash-measure.yml (when this file changes, or by hand):
     node test/chromium/_audit/flash-measure.js
     HATI_FM_BOOK=120 node test/chromium/_audit/flash-measure.js */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../../helpers');

const BOOK = +process.env.HATI_FM_BOOK || 80;
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const say = (...a) => console.log(...a);
const HTML = '<h1>SERVICES AGREEMENT</h1><p>This Agreement is made between Young and Ventura Capital.</p>'
  + ['Services', 'Fees', 'Term', 'Liability', 'Confidentiality', 'Governing law'].map((t, i) => `<h2>${i + 1}. ${t}</h2><p>${t} are as set out in this clause ${i + 1}, and each party shall keep to them in good faith and without delay.</p>`).join('');
function book(){
  const out = []; const st = ['Under Review', 'Signed', 'Signed', 'Under Review', 'Draft'];
  for (let i = 0; out.length < BOOK; i++){
    const f = JSON.parse(JSON.stringify(FIXTURES[i % FIXTURES.length]));
    f.id = 'MK-F' + String(1000 + i); f.name = f.name + ' ' + (i + 1); f.status = st[i % st.length];
    if (f.status === 'Signed' && i % 2 === 0){
      const due = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
      f.obligations = [{ id: 'ob-' + f.id + '-1', desc: 'Send the monthly report', due: due((i % 40) - 10), party: 'ours', status: 'open' }];
    }
    out.push(f);
  }
  const c = fixtureContract('MK-110', 'Services Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'S.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  out.push(c);
  return out;
}

/* in the page: film one move */
const FILM = async ([label, how, arg]) => {
  const HOSTS = ['content', 'page-head', 'ig-page', 'ig-row', 'ig-dock', 'ig-paper', 'ig-strip', 'ct-place', 'ins-panel', 'hb-board', 'hb-head', 'st-side', 'panel-body'];
  const name = el => { if (!el || !el.tagName) return '?'; const id = el.id ? '#' + el.id : ''; const cl = el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''; return el.tagName.toLowerCase() + id + cl; };
  const big = el => { try { const r = el.getBoundingClientRect(); return r.width >= 160 && r.height >= 60 && r.bottom > 0 && r.top < innerHeight; } catch (_){ return false; } };
  const parts = () => { const out = []; for (const sel of ['#content > *', '#content .view-enter > *', '#ig-page > *', '#ig-row > *', '#ig-dock > *', '#ins-panel > *', '#page-head > *', '#ct-place > *', '#hb-board > *'])
    document.querySelectorAll(sel).forEach(n => out.push(n)); return out; };
  const fadesNow = () => { const out = new Set();
    for (const a of document.getAnimations()){ let kf = []; try { kf = a.effect.getKeyframes(); } catch (_){ kf = []; }
      if (!kf.some(k => k.opacity != null)) continue; const t = a.effect.target; if (!t || !big(t) || !t.closest('#app-shell') || t.closest('#toast-root, #modal-root, .toast-in')) continue;
      let d = 0; try { d = Math.round(a.effect.getComputedTiming().duration || 0); } catch (_){ d = 0; }
      out.add(name(t) + (a.effect.pseudoElement || '') + ' ' + (a.animationName || (a.transitionProperty ? 'transition' : 'script')) + ' ' + d + 'ms'); }
    return out; };
  const late = [], t0holder = { t: 0 }; let inTurn = true;
  const mo = new MutationObserver(recs => { const at = Math.round(performance.now() - t0holder.t);
    for (const r of recs){ if (r.type !== 'childList' || !r.target.id || !HOSTS.includes(r.target.id)) continue;
      const add = [...r.addedNodes].filter(x => x.nodeType === 1).length; if (!add) continue;
      if (!inTurn) late.push(r.target.id + '@' + at); } });
  HOSTS.forEach(id => { const el = document.getElementById(id); if (el) mo.observe(el, { childList: true }); });
  let jump = 0; let po = null; const moved = [];
  const rect = r => r ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` : '?';
  try { po = new window.PerformanceObserver(l => { for (const e of l.getEntries()){ jump += e.value;
    for (const src of (e.sources || []).slice(0, 3)){ const t = src.node && src.node.nodeType === 1 ? src.node : src.node && src.node.parentElement;
      moved.push(`${name(t)} ${rect(src.previousRect)} -> ${rect(src.currentRect)} @${Math.round(e.startTime - t0holder.t)}`); } } });
    po.observe({ type: 'layout-shift', buffered: false }); } catch (_){ po = null; }
  /* WHO WROTE LATE: every way a host's children are written, watched for the film's length only */
  const who = [];
  const where = () => { const st = String(new Error().stack || '').split('\n').slice(2)
      .filter(l => /\/js\//.test(l)).slice(0, 4).map(l => l.trim().replace(/^at\s+/, '').replace(/\(?https?:\/\/[^/]+\/js\//, '').replace(/:\d+\)?$/, '').replace(/\)$/, ''));
    return st.join(' < ') || '(no HaTi frame)'; };
  const isHost = el => !!(el && el.id && HOSTS.includes(el.id));
  const note = el => { if (!inTurn && isHost(el)) who.push(el.id + ': ' + where()); };
  const EP = Element.prototype, NP = Node.prototype, keep = [];
  const wrap = (obj, k) => { const f = obj[k]; if (typeof f !== 'function') return; keep.push([obj, k, f]);
    obj[k] = function(){ note(this); return f.apply(this, arguments); }; };
  [[NP, 'appendChild'], [NP, 'insertBefore'], [NP, 'replaceChild'], [EP, 'insertAdjacentHTML'], [EP, 'replaceChildren'], [EP, 'append'], [EP, 'prepend']].forEach(([o, k]) => wrap(o, k));
  const ihD = Object.getOwnPropertyDescriptor(EP, 'innerHTML');
  if (ihD && ihD.set) Object.defineProperty(EP, 'innerHTML', Object.assign({}, ihD, { set(v){ note(this); return ihD.set.call(this, v); } }));
  const unwrap = () => { keep.forEach(([o, k, f]) => { o[k] = f; }); if (ihD) Object.defineProperty(EP, 'innerHTML', ihD); };
  t0holder.t = performance.now();
  let err = null;
  try { if (how === 'place') caGo({ kind: 'go', place: arg }); else if (how === 'paper') pdOpenOnHome(arg, 'copilot'); else if (how === 'tab'){ const b = document.querySelector(`#ig-dock [data-pd-tab="${arg}"]`); if (b) b.click(); else err = 'no tab ' + arg; }
    else if (how === 'eval') (0, eval)(arg); } catch (e){ err = String(e && e.message || e).slice(0, 120); }
  /* what the move's own turn wrote is the move; what is written after it is a second draw */
  mo.takeRecords(); inTurn = false;
  /* hosts born in the move are watched too */
  HOSTS.forEach(id => { const el = document.getElementById(id); if (el) try { mo.observe(el, { childList: true }); } catch (_){ } });
  const fades = new Set(), pale = new Set(); let frames = 0, paleFrames = 0, blank = 0;
  while (performance.now() - t0holder.t < 600){ await new Promise(r => requestAnimationFrame(() => r())); frames++;
    fadesNow().forEach(x => fades.add(x));
    let p = 0; for (const n of parts()){ if (!big(n)) continue; const o = +getComputedStyle(n).opacity; if (o < 1){ p++; pale.add(name(n)); } }
    if (p) paleFrames++;
    const main = document.querySelector('#ig-page:not([hidden])') || document.querySelector('#content .view-enter') || document.getElementById('content');
    if (main && !main.firstElementChild) blank++; }
  mo.disconnect(); if (po) po.disconnect(); unwrap();
  return { label, err, frames, fades: [...fades], pale: [...pale], paleFrames, blank, late, jump: +jump.toFixed(3), view: (window.state && state.view) || '',
    who: [...new Set(who)].slice(0, 4), moved: [...new Set(moved)].slice(0, 4) };
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: book() });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const totals = { moves: 0, clean: 0 }; const seen = {};
  for (const [W, H] of [[1440, 780], [1536, 730], [1366, 950]]){
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => say('PAGE ERROR', String(e).slice(0, 200)));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
    await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110'), null, 40000);
    await p.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    await p.waitForTimeout(1500);
    say(`\n================ ${W}x${H} · ${BOOK + 1} contracts ================`);
    const PLACES = ['contracts', 'negotiations', 'approvals', 'oblig', 'requests', 'parties', 'people', 'ourpaper', 'import', 'mynotes', 'reads', 'pulse', 'calendar', 'explorer', 'handbook', 'house', 'settings'];
    const moves = [];
    for (const k of PLACES){ moves.push(['board -> ' + k, 'place', k]); moves.push([k + ' -> board', 'place', 'board']); }
    /* page to page without the Board between */
    for (let i = 0; i + 1 < PLACES.length; i++) moves.push([PLACES[i] + ' -> ' + PLACES[i + 1], 'place', PLACES[i + 1]]);
    moves.push(['settings -> board', 'place', 'board']);
    /* a paper and its tabs, and paper to paper */
    moves.push(['board -> paper MK-110', 'paper', 'MK-110'], ['Dossier -> Clauses', 'tab', 'doc'], ['Clauses -> Redlines', 'tab', 'red'], ['Redlines -> Dossier', 'tab', 'copilot'], ['Dossier -> Clauses', 'tab', 'doc'], ['Clauses -> Dossier', 'tab', 'copilot'],
      ['paper -> paper MK-F1000', 'paper', 'MK-F1000'], ['paper -> approvals', 'place', 'approvals'], ['approvals -> paper MK-110', 'paper', 'MK-110'], ['paper -> board', 'place', 'board']);
    /* a list's own tab and a row chosen (the panel beside the list) */
    moves.push(['board -> approvals', 'place', 'approvals'], ['approvals: a row chosen', 'eval', "(document.querySelector('#content tbody tr')||{click(){}}).click()"], ['approvals: another row', 'eval', "(document.querySelectorAll('#content tbody tr')[1]||{click(){}}).click()"],
      ['approvals -> board', 'place', 'board']);
    for (const m of moves){
      let r = null; try { r = await p.evaluate(FILM, m); } catch (e){ say(`  ${m[0].padEnd(34)} COULD NOT FILM — ${String(e).slice(0, 120)}`); continue; }
      await p.waitForTimeout(500);                    /* the page at rest before the next move */
      totals.moves++;
      const bits = [];
      if (r.err) bits.push('ERR ' + r.err);
      if (r.fades.length) bits.push('fades: ' + r.fades.join(' | '));
      if (r.paleFrames) bits.push(`pale ${r.paleFrames}/${r.frames} frames: ${r.pale.join(', ')}`);
      if (r.blank) bits.push(`blank ${r.blank}/${r.frames} frames`);
      if (r.late.length) bits.push('late: ' + r.late.join(', '));
      if (r.jump >= 0.02) bits.push('jump ' + r.jump);
      if (!bits.length) totals.clean++;
      for (const f of r.fades) seen[f] = (seen[f] || 0) + 1;
      say(`  ${m[0].padEnd(34)} [${r.view}] ${bits.length ? bits.join(' · ') : 'clean'}`);
      if (r.late.length) for (const w of r.who) say(`      wrote late  ${w}`);
      if (r.jump >= 0.02) for (const w of r.moved) say(`      moved       ${w}`);
    }
    const kept = await p.evaluate(() => (typeof igDockKeptCount === 'function') ? igDockKeptCount() : null);
    say(`  Jambo's panel: asks that wrote nothing so far = ${kept}`);
    await p.close();
  }
  say(`\n${totals.clean} of ${totals.moves} moves clean.`);
  const top = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 25);
  if (top.length){ say('\nWhat faded, most often first:'); for (const [k, n] of top) say(`  ${String(n).padStart(3)} × ${k}`); }
  await b.close(); await h.stop(); process.exit(0);
})().catch(e => { console.error(e); process.exit(0); });
