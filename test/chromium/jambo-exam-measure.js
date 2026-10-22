/* THE JAMBO EXAM, WHERE THE READER TYPES — A MEASUREMENT, NOT A TEST
   ============================================================
   (owner, 22 Oct 2026: "Measure honestly. Before building, write a held-out
   test of at least 200 everyday asks … Report the before and after scores,
   and the average cost per ask in calls.")
   Every ask of test/jambo-exam.js is typed into a real Jambo box in a real
   browser over test/jambo-world.js, and the app is read for where it stands
   and what Jambo said (test/nav-read.js, plus the Board, Explorer and the
   answer's words below). It prints the score by section and by box, the dead
   ends, every miss, and the Jambo calls each ask cost.

   THE AI IS REAL OR ABSENT, NEVER PRETEND. With ANTHROPIC_API_KEY set in the
   environment, HaTi talks to Anthropic through a small counting relay here
   (each call counted against the ask that made it, the model named). Without
   a key, HaTi runs with no Jambo key at all and the score is the free readers
   alone — said in the head of the report. The stand-in AI the other checks use
   is never used here: its answers are not answers.

   Not in CI's set (run-all.js NOT_TESTS): it spends real calls. Run by hand:
     node test/chromium/jambo-exam-measure.js
     JAMBO_EXAM_ONLY=typos node …                (one section)
     JAMBO_EXAM_OUT=/path/out.json node …        (every result, for the report) */
/* global state, hbS, hbDigData, hbSetFace, intel, ai, setView, hbOpenCalendar, getContract, negoClauseList, rlOpenClauseEditor,
   api, openTemplateBuilder, aiWinToggle, openAI, closeModal, landOff, pdOpenOnHome, navLanding */
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedJamboWorld } = require('../jambo-world');
const { navWhereSrc, judge, expectedRows } = require('../nav-read');
const { JAMBO_EXAM } = require('../jambo-exam');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ONLY = process.env.JAMBO_EXAM_ONLY || '';
const KEY = String(process.env.ANTHROPIC_API_KEY || '').trim();
const LIVE = !!KEY && KEY !== 'test-key-not-real';
const UPSTREAM = 'https://api.anthropic.com';

/* THE COUNTING RELAY: HaTi's provider calls pass through here to Anthropic, unchanged, and each is counted */
function startRelay(){
  const R = { calls: 0, models: {} };
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', d => chunks.push(d));
    req.on('end', async () => {
      const raw = Buffer.concat(chunks);
      let model = '?'; try { model = JSON.parse(raw.toString()).model || '?'; } catch (_){}
      R.calls++; R.models[model] = (R.models[model] || 0) + 1;
      try {
        const headers = {};
        for (const [k, v] of Object.entries(req.headers)) if (!['host', 'content-length', 'connection'].includes(k)) headers[k] = v;
        const up = await fetch(UPSTREAM + req.url, { method: req.method, headers, body: raw.length ? raw : undefined });
        const body = Buffer.from(await up.arrayBuffer());
        res.writeHead(up.status, { 'Content-Type': up.headers.get('content-type') || 'application/json' });
        res.end(body);
      } catch (e){
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'relay', message: String(e && e.message || e) } }));
      }
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(Object.assign(R, {
    base: 'http://127.0.0.1:' + server.address().port, stop: () => new Promise(s => server.close(s)) }))));
}

/* WHAT ELSE THE APP SHOWS: the Board's open or newest card, the map's grouping and the dots left, and the
   answer Jambo gave to THIS ask (the one conversation is emptied before each ask, so anything there is new) */
function extraSrc(){
  const X = {};
  try {
    const s = hbS(); X.face = s.face;
    const path = s.path || [], key = path[path.length - 1];
    X.boardKey = key || null; X.panels = (s.panels || []).length; X.lastAsked = s.lastAsked || null;
    const idsOf = k => { const D = hbDigData(k, s.lens); return D && D.ids ? [...D.ids].sort() : null; };
    if (key) X.boardIds = idsOf(key);
    const p = s.lastAsked && (s.panels || []).find(x => x.id === s.lastAsked);
    if (p) X.addedIds = idsOf(p.key);
  } catch (_){}
  try {
    X.groupBy = intel.groupBy || null;
    let ids = null;
    (intel.lenses || []).filter(l => l && l.on !== false && l.action === 'filter').forEach(l => {
      const set = new Set(l.ids || []); ids = ids ? ids.filter(i => set.has(i)) : [...set]; });
    X.mapIds = ids ? ids.sort() : null;
  } catch (_){}
  const H = (window.ai && Array.isArray(ai.history)) ? ai.history : [];
  const said = H.filter(m => m && m.role === 'assistant');
  X.answers = said.length;
  const last = said[said.length - 1];
  if (last){
    const div = document.createElement('div'); div.innerHTML = String(last.text || last.html || '');
    X.text = (div.textContent || '').replace(/\s+/g, ' ').trim();
    const cards = [].concat(last.cardIds || [], (last.cards || []).map(c => c && (c.id || c)), (last.citations || []).map(c => c && c.id));
    X.cites = [...new Set(cards.filter(Boolean).map(String))];
    X.err = !!last.err;
    X.choices = Array.isArray(last.choices) ? last.choices.length : (last.act && Array.isArray(last.act.picks) ? last.act.picks.length : 0);
  }
  /* A BOX THAT ANSWERS IN ITS OWN PANEL (22 Oct 2026, stage 3's reading of the boxes): the Calendar's planner
     and the clause editor say their answer beside their own box, not in the one conversation; read there,
     where the reader sees it, when the conversation holds none */
  if (!X.answers){
    let own = '';
    try { const p = (typeof _calPlanState === 'function') ? _calPlanState() : null;
      if (p && p.say && document.getElementById('cal-plan-in')) own = [p.say].concat(p.points || []).join(' '); } catch (_){}
    try { const L = [...document.querySelectorAll('#ce-lane .ce-ai')].pop(); if (L) own = L.innerText; } catch (_){}
    if (own){ X.answers = 1; X.text = own.replace(/\s+/g, ' ').trim(); X.cites = [...new Set(X.text.match(/\b(?:MK|RL)-[A-Z0-9]+\b/g) || [])]; }
  }
  return X;
}

const DEAD_END = /wasn.?t able to finish|could not draw|couldn.?t draw|something went wrong|jambo error|provider error|request failed|not configured|kunde inte slutföra|något gick fel/i;
const rx = s => new RegExp(s, 'i');
const sameRows = (got, f) => (got || []).join(',') === expectedRows(f).join(',');

function judgeAll(spot, W, X, before){
  /* the navigation exam's spots (page, contract, pane, clause, party, filters, settings, item, which/none/walled) */
  if (!spot.board && !spot.explorer && spot.reply !== 'answer' && spot.reply !== 'clarify') return judge(spot, W, before);
  const why = [], text = X.text || '';
  if (spot.reply === 'answer'){
    if (!X.answers) return ['no answer in words'];
    for (const s of spot.says || []) if (!rx(s).test(text)) why.push(`answer lacks /${s}/ — "${text.slice(0, 140)}"`);
    if (spot.cites && !spot.cites.some(id => (X.cites || []).includes(id) || text.includes(id))) why.push(`cites none of ${spot.cites.join(', ')}`);
    return why;
  }
  if (spot.reply === 'clarify'){
    const ok = (X.choices >= 2 && X.choices <= 4) || (/\?/.test(text) && /did you mean|which one|which of|vilken|menade du/i.test(text));
    return ok ? [] : [`no short question with 2–4 choices — "${text.slice(0, 140)}" (choices ${X.choices || 0})`];
  }
  if (spot.board){
    const B = spot.board;
    if (B.says) return B.says.every(s => rx(s).test(text)) ? [] : [`board said "${text.slice(0, 140)}"`];
    /* a chart drawn: a card added, or the Board's open card turned to the asked picture */
    if (B.added) return ((X.lastAsked && X.lastAsked !== before.lastAsked) || (X.boardKey && X.boardKey !== before.boardKey)) ? [] : ['no chart drawn'];
    if (B.cleared) return (!X.boardKey) ? [] : [`still filtered (${X.boardKey})`];
    if (B.filters) return (sameRows(X.boardIds, B.filters) || sameRows(X.addedIds, B.filters)) ? []
      : [`board set [${(X.boardIds || X.addedIds || []).join(',')}] ≠ [${expectedRows(B.filters).join(',')}]`];
  }
  if (spot.explorer){
    const E = spot.explorer;
    if (E.groupBy && X.groupBy !== E.groupBy) why.push(`grouped by ${X.groupBy || '—'} ≠ ${E.groupBy}`);
    if (E.filters && !sameRows(X.mapIds, E.filters)) why.push(`map shows [${(X.mapIds || ['all']).join(',')}] ≠ [${expectedRows(E.filters).join(',')}]`);
    return why;
  }
  return why;
}

(async () => {
  const relay = LIVE ? await startRelay() : null;
  const h = await startHati(Object.assign({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000' },
    LIVE ? { ANTHROPIC_BASE_URL: relay.base, ANTHROPIC_API_KEY: KEY } : { ANTHROPIC_API_KEY: '' }));
  await seedJamboWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const results = [], errors = [], pages = {};
  async function seat(who, w, hh){
    const key = who + w;
    if (pages[key]) return pages[key];
    const ctx = await browser.newContext({ viewport: { width: w, height: hh } });
    const P = await ctx.newPage();
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    const cred = who === 'legal' ? ['everything@example.co.ke', 'their-own-pass-9'] : ['admin@example.co.ke', 'adminpassword1'];
    await P.fill('#li-email', cred[0]); await P.fill('#li-pass', cred[1]); await P.click('#li-go');
    await P.waitForFunction(() => !!(window.currentUser && currentUser() && typeof setView === 'function' && state.contracts && state.contracts.length), null, { timeout: 20000 });
    pages[key] = P;
    return P;
  }
  const read = P => P.evaluate(([a, b]) => ({ W: new Function('return (' + a + ')()')(), X: new Function('return (' + b + ')()')() }),
    [navWhereSrc.toString(), extraSrc.toString()]).catch(e => ({ W: { error: String(e.message || e) }, X: {} }));
  /* a bounded poll for the app to stand still: two equal readings a beat apart, nothing busy (a live answer may take a while) */
  const settle = async P => {
    let prev = '';
    for (let i = 0; i < (LIVE ? 160 : 24); i++){
      const now = await P.evaluate(([a, b]) => { const busy = (window.intel && intel.busy) || (window.ai && ai.busy) || (typeof navLanding === 'function' && navLanding())
          || (typeof _calPlanState === 'function' && _calPlanState().busy) || !!document.querySelector('#ce-lane .ce-work');
        return JSON.stringify([busy, new Function('return (' + a + ')()')(), new Function('return (' + b + ')()')()]); }, [navWhereSrc.toString(), extraSrc.toString()]).catch(() => '');
      if (now && now === prev && !JSON.parse(now)[0]) return;
      prev = now;
      await P.waitForTimeout(250);
    }
  };
  async function typeInto(P, box, q){
    const fillEnter = async sel => { await P.waitForSelector(sel, { state: 'visible', timeout: 6000 }); await P.fill(sel, q); await P.press(sel, 'Enter'); };
    if (box === 'home' || box === 'board' || box === 'explorer') return fillEnter('#igd-input');
    if (box === 'chat' || box === 'phone'){
      await P.evaluate(() => { const i = document.getElementById('ai-input'); const shown = i && i.offsetParent;
        if (!shown){ if (typeof aiWinToggle === 'function') aiWinToggle(); else if (typeof openAI === 'function') openAI(); } });
      return fillEnter('#ai-input');
    }
    if (box === 'list'){ await P.evaluate(() => setView('approvals')); await settle(P); return fillEnter('#jl-q'); }
    if (box === 'settings'){ await P.evaluate(() => setView('team')); await settle(P); return fillEnter('#st-jb-q'); }
    if (box === 'calendar'){ await P.evaluate(() => hbOpenCalendar()); await settle(P); return fillEnter('#cal-plan-in'); }
    if (box === 'editor'){
      await P.evaluate(() => { const c = getContract('MK-A2'); const cl = negoClauseList(c); rlOpenClauseEditor(c, cl[0].clauseId, {}); });
      return fillEnter('#ce-ask');
    }
    if (box === 'builder'){
      await P.evaluate(async () => { const d = await api('templates', 'POST', { name: 'Exam probe ' + Date.now(), category: 'other', description: '' });
        const t = await api('templates/' + d.template.id); await openTemplateBuilder(d.template.id, t.versions.find(v => v.status === 'draft').id); });
      return fillEnter('#tb-ask');
    }
    throw new Error('no such box ' + box);
  }

  try {
    for (let i = 0; i < JAMBO_EXAM.length; i++){
      const T = JAMBO_EXAM[i], sec = T.sec;
      if (ONLY && !sec.startsWith(ONLY)) continue;
      const box = T.box || 'home', who = T.as || 'admin';
      const P = await seat(who, box === 'phone' ? 390 : 1440, box === 'phone' ? 844 : 780);
      let why = [], W = null, X = {}, dead = false;
      const calls0 = relay ? relay.calls : 0;
      try {
        /* EVERY ASK STARTS FROM THE SAME PLACE, as in the navigation exam: MK-Z9 open on Home, nothing landed, the
           conversation empty; the Board's asks on the Board, Explorer's on Explorer with the map at rest */
        await P.evaluate(b => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} try { if (typeof landOff === 'function') landOff(); } catch (_){}
          if (window.ai && Array.isArray(ai.history)) ai.history.length = 0;
          setView('dashboard');
          if (b === 'board' || b === 'explorer'){
            if (b === 'explorer'){ try { intel.groupBy = 'folder'; intel.lenses = []; } catch (_){} }
            try { const s = hbS(); s.path = []; s.lens = 'all'; s.found = null; s.digBig = false; } catch (_){}   // the Board at rest: no card open, every side counted
            try { hbSetFace(b); } catch (_){}
          } else if (typeof pdOpenOnHome === 'function') pdOpenOnHome('MK-Z9', 'copilot'); }, box);
        await settle(P);
        const B = await read(P), before = Object.assign({}, B.W, { lastAsked: B.X.lastAsked, boardKey: B.X.boardKey });
        await typeInto(P, box, T.q);
        await settle(P);
        ({ W, X } = await read(P));
        dead = !!X.answers && (DEAD_END.test(X.text || '') || (X.err && !X.text));
        const spots = Array.isArray(T.spot) ? T.spot : [T.spot];
        const tries = spots.map(sp => judgeAll(sp, W, X, before));
        why = tries.find(t => !t.length) || tries.sort((a, b) => a.length - b.length)[0];
        if (dead) why = ['DEAD END — "' + String(X.text || '').slice(0, 120) + '"'].concat(why.length ? [] : ['(the spot was right)']);
      } catch (e){ why = ['could not be typed: ' + String(e && e.message || e).split('\n')[0]]; }
      const calls = relay ? relay.calls - calls0 : 0;
      results.push({ i, sec, q: T.q, box, who, ok: !why.length, dead, calls, why, at: W, said: X.text || '' });
      console.log(`${why.length ? 'MISS' : 'PASS'}  [${sec}${box !== 'home' ? ' · ' + box : ''}${who !== 'admin' ? ' · ' + who : ''}] (${calls} call${calls === 1 ? '' : 's'}) ${T.q}${why.length ? ' — ' + why.join('; ') : ''}`);
    }
  } finally {
    const n = results.length, ok = results.filter(r => r.ok).length, dead = results.filter(r => r.dead).length;
    const calls = results.reduce((a, r) => a + r.calls, 0);
    const by = k => { const m = {}; for (const r of results){ const g = m[r[k]] || (m[r[k]] = [0, 0, 0]); g[1]++; if (r.ok) g[0]++; g[2] += r.calls; } return m; };
    console.log('\n' + (LIVE ? `LIVE AI through the counting relay — models: ${JSON.stringify(relay.models)}` : 'NO AI KEY — the free readers alone (Jambo has no key in this run)'));
    console.log('BY SECTION  (passed / asked · calls)'); for (const [s, [a, b, c]] of Object.entries(by('sec'))) console.log(`  ${String(a).padStart(3)} / ${String(b).padEnd(3)} · ${String(c).padStart(4)}  ${s}`);
    console.log('BY BOX'); for (const [s, [a, b, c]] of Object.entries(by('box'))) console.log(`  ${String(a).padStart(3)} / ${String(b).padEnd(3)} · ${String(c).padStart(4)}  ${s}`);
    console.log(`\nPASSED: ${ok} of ${n} (${n ? Math.round(ok * 100 / n) : 0}%) · DEAD ENDS: ${dead} · JAMBO CALLS: ${calls} (${n ? (calls / n).toFixed(2) : 0} per ask)` + (errors.length ? ` · page errors: ${errors.length}` : ''));
    if (errors.length) console.log('PAGE ERRORS  ' + [...new Set(errors)].slice(0, 5).join(' · '));
    if (process.env.JAMBO_EXAM_OUT) fs.writeFileSync(process.env.JAMBO_EXAM_OUT, JSON.stringify({ live: LIVE, models: relay ? relay.models : {}, n, ok, dead, calls, results }, null, 1));
    await browser.close(); await h.stop(); if (relay) await relay.stop();
    process.exit(0);
  }
})();
