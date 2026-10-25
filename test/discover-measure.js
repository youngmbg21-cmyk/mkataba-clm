/* THE DISCOVER EXAM, MEASURED — A MEASUREMENT, NOT A TEST
   ============================================================
   (owner, 25 Oct 2026: stage 0 of docs/PLAN-jambo-discover.md, "measure
   first", so every later stage can show what it moved)
   Every question of test/discover-exam.js is asked of every contract of
   test/discover-world.js through POST /api/ai/column, the way the Contracts
   page's Ask a column asks it, and each answer is graded against the world's
   truth. It prints: answers right, dead ends, sentences checked, verdicts
   (once stage 1 gives them), and THE COST — Jambo calls per question, per
   contract, and what the owner's Due diligence pack costs asked as a person
   asks it today.

   THE AI IS REAL OR IT IS ONLY COUNTED, NEVER PRETEND. With ANTHROPIC_API_KEY
   set, HaTi talks to Anthropic through a counting relay here and every answer
   is graded. Without a key, HaTi talks to the test stand-in, and ONLY THE
   CALLS ARE MEASURED: the stand-in's answers are not answers, so nothing is
   graded and the report says so in its head. The calls HaTi makes are the
   same either way: they are HaTi's, not the model's.

   Not in CI (not a *.test.js; it may spend real calls). Run by hand:
     node test/discover-measure.js
     DISCOVER_ONLY=notice node test/discover-measure.js      (one fact)
     DISCOVER_OUT=/path/out.json node test/discover-measure.js
   The world's own honesty (every truth matches its wording; the marker marks
   right answers right and wrong ones wrong) is f878, which CI runs. */
const fs = require('node:fs');
const http = require('node:http');
const { startHati } = require('./helpers');
const { seedDiscoverWorld, TRUTH, IDS, RULES } = require('./discover-world');
const { DISCOVER_EXAM, PACK_DD, grade } = require('./discover-exam');

const ONLY = process.env.DISCOVER_ONLY || '';
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
      let model = '?'; try { model = JSON.parse(raw.toString()).model || '?'; } catch (_){ /* not JSON */ }
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

const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';

(async () => {
  const relay = LIVE ? await startRelay() : null;
  const h = await startHati(Object.assign({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000', AI_DAILY_SPEND_LIMIT: '1000' },
    LIVE ? { ANTHROPIC_BASE_URL: relay.base, ANTHROPIC_API_KEY: KEY } : {}));
  const callsNow = () => LIVE ? relay.calls : h.ai.calls.length;
  const results = [];
  try {
    const W = await seedDiscoverWorld(h);
    const items = DISCOVER_EXAM.filter(x => !ONLY || x.fact === ONLY);
    /* THE COMPANY'S RULES, written by the admin on each question before it is asked (stage 1 onward):
       a question is kept by asking it of the one contract with no wording, which spends nothing */
    const empty = IDS.find(id => TRUTH[id].noWording);
    let rulesSet = 0;
    for (const item of items) if (RULES[item.fact]) {
      try {
        const k = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: item.q, name: '', ids: [empty] } });
        const put = await W.admin.raw('/api/columns/' + k.ask.id, { method: 'PUT', body: { rule: RULES[item.fact] } });
        if (put.status < 300) rulesSet++;
      } catch (_){ /* the parent has no rules: measured without them, and said */ }
    }
    for (const item of items){
      const before = callsNow();
      let r = null, err = null;
      try { r = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: item.q, name: '', ids: IDS } }); }
      catch (e){ err = String(e && e.message || e); }
      const spent = callsNow() - before;
      const said = r && typeof r.calls === 'number' ? r.calls : null;
      const marks = IDS.map(id => {
        const truth = id in TRUTH && TRUTH[id].noWording ? TRUTH[id] : (TRUTH[id] || {})[item.fact];
        const a = r && r.answers ? r.answers[id] : undefined;
        return Object.assign({ id }, LIVE ? grade(item, truth, a) : { mark: a ? 'counted' : 'dead' });
      });
      results.push({ fact: item.fact, form: item.form, q: item.q, spent, said, err, marks });
      const right = marks.filter(m => m.mark === 'right').length, dead = marks.filter(m => m.mark === 'dead').length;
      console.log(`${LIVE ? `${right}/${marks.length}`.padEnd(6) : ''}${dead ? `dead ${dead}  ` : ''}${String(spent).padStart(3)} calls  ${item.fact.padEnd(8)} ${item.q}${err ? '  ERROR ' + err : ''}`);
    }
    /* THE PACK AS ONE PRESS (stage 1): the Due diligence questions asked together, read afresh */
    let packOne = null;
    if (!ONLY){
      const p0 = callsNow();
      try { await W.admin.json('/api/ai/column', { method: 'POST', body: { questions: PACK_DD.map(q => ({ question: q })), ids: IDS, force: true } }); packOne = callsNow() - p0; }
      catch (_){ packOne = null; }
    }
    /* KEPT: the first question asked again spends nothing */
    const k0 = callsNow();
    await W.admin.json('/api/ai/column', { method: 'POST', body: { question: items[0].q, name: '', ids: IDS } });
    const keptSpent = callsNow() - k0;

    /* THE REPORT */
    const all = results.flatMap(r => r.marks);
    const n = all.length, calls = results.reduce((s, r) => s + r.spent, 0);
    const dead = all.filter(m => m.mark === 'dead').length;
    const withWording = IDS.filter(id => !TRUTH[id].noWording).length;
    const pack = results.filter(r => PACK_DD.includes(r.q)).reduce((s, r) => s + r.spent, 0);
    const lies = results.filter(r => r.said != null && r.said !== r.spent).length;
    console.log('\n' + (LIVE ? `LIVE AI through the counting relay — models: ${JSON.stringify(relay.models)}`
      : 'NO AI KEY — ONLY THE CALLS ARE MEASURED (the stand-in answered; its answers are not graded)'));
    if (LIVE){
      const right = all.filter(m => m.mark === 'right').length;
      const found = all.filter(m => 'quoted' in m), quoted = found.filter(m => m.quoted).length;
      const judged = all.filter(m => 'verdictRight' in m), vRight = judged.filter(m => m.verdictRight).length;
      console.log(`ANSWERS RIGHT   ${right} of ${n} (${pct(right, n)})`);
      const facts = [...new Set(results.map(r => r.fact))];
      console.log('BY FACT         ' + facts.map(f => { const m = results.filter(r => r.fact === f).flatMap(r => r.marks);
        return `${f} ${m.filter(x => x.mark === 'right').length}/${m.length}`; }).join(' · '));
      console.log(`SENTENCES       ${quoted} of ${found.length} found answers rest on a sentence checked against the wording (${pct(quoted, found.length)})`);
      console.log(`VERDICTS        ${judged.length ? `${vRight} of ${judged.length} right (${pct(vRight, judged.length)})` : 'none given (stage 1 adds "in / outside our range")'}`);
      const misses = results.flatMap(r => r.marks.filter(m => m.mark === 'wrong').map(m => `  ${m.id} · ${r.q} → "${m.text || ''}" (${m.why})`));
      if (misses.length) console.log('MISSES\n' + misses.slice(0, 60).join('\n') + (misses.length > 60 ? `\n  … ${misses.length - 60} more` : ''));
    }
    console.log(`DEAD ENDS       ${dead} of ${n}`);
    console.log(`CALLS           ${calls} for ${results.length} questions over ${IDS.length} contracts (${withWording} with wording)`);
    console.log(`                ${(calls / results.length).toFixed(2)} per question · ${(calls / (results.length * withWording)).toFixed(2)} per question per contract`);
    console.log(`                ${lies ? `${lies} questions SAID a different number of calls than they made` : 'every question said the calls it made'}`);
    console.log(`KEPT            the first question asked again: ${keptSpent} calls`);
    console.log(`RULES           ${rulesSet ? `${rulesSet} questions carry the company's rule` : 'none could be written (no rule route): verdicts not measured'}`);
    if (!ONLY) console.log(`DUE DILIGENCE   the owner's first pack (5 questions) asked one at a time: ${pack} calls over ${withWording} contracts`);
    if (!ONLY) console.log(`                asked as one press: ${packOne == null ? 'not possible (one question a press)' : packOne + ' calls'}`);
    if (process.env.DISCOVER_OUT) fs.writeFileSync(process.env.DISCOVER_OUT, JSON.stringify({ live: LIVE, models: relay ? relay.models : {}, n, dead, calls, pack, packOne, rulesSet, keptSpent, results }, null, 1));
  } finally {
    await h.stop();
    if (relay) await relay.stop();
  }
})().catch(e => { console.error(e); process.exit(1); });
