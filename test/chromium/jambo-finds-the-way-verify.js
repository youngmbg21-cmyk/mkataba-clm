/* JAMBO FINDS THE WAY (owner, 22 Oct 2026: "jambo is still very poor at
   navigating across the platform"; f920 is the source half)

   WHAT THIS PINS, driven in a real browser on the seeded workspace
     1 the owner's own sentence, typed into Jambo's panel beside a paper —
       "show me where i can edit our standards for the procurement stream" —
       opens Our standards on the Supply book (the book Procurement's
       contracts are judged by), never the open contract's Filing row
     2 "take me to our standards" opens Our standards; "take me to the
       templates" still opens the templates
     3 THE AI TAKES YOU THERE: a question no word reader places goes to the
       AI with goto in its answer tool; the answer names Our standards and
       the page opens, said in Jambo's conversation
     4 THE SWITCH: an admin turns it off in Settings → Jambo engine (on at
       first); off, the answer tool carries no goto, and a goto the model
       writes anyway is not run
     5 nothing on the page threw
   The AI is a stand-in on this machine that answers by the tool it is
   handed; nothing leaves the machine.
   Run: node test/chromium/jambo-finds-the-way-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-finds-the-way');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

/* THE STAND-IN: answers whichever answer tool it is handed, and always names
   Our standards as the place (so a goto that is not run is the browser's or
   the server's doing, never the stand-in's) */
function startAi(){
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = ''; req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_){}
      calls.push(body);
      const names = (body.tools || []).map(t => t.name);
      const goto = { task: 'standards' };
      const block = names.includes('deliver_answer')
        ? { type: 'tool_use', id: 'tu1', name: 'deliver_answer', input: { answer: 'Our standards are on Our paper. Taking you there.', citations: [], goto } }
        : names.includes('render_graph')
          ? { type: 'tool_use', id: 'tu1', name: 'render_graph', input: { note: 'Our standards', answer: 'Taking you to our standards.', kind: 'map', goto } }
          : names.length ? { type: 'tool_use', id: 'tu1', name: names[0], input: {} } : { type: 'text', text: 'ok' };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'msg', type: 'message', role: 'assistant', model: body.model || 'stub', content: [block], usage: { input_tokens: 10, output_tokens: 5 }, stop_reason: 'end_turn' }));
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ base: 'http://127.0.0.1:' + server.address().port, calls, stop: () => new Promise(x => server.close(x)) })));
}
const toolsOfLast = calls => { const b = [...calls].reverse().find(c => (c.tools || []).some(t => t.name === 'deliver_answer' || t.name === 'render_graph')); return b || null; };
const hasGoto = b => !!(b && (b.tools || []).some(t => (t.name === 'deliver_answer' || t.name === 'render_graph') && t.input_schema && t.input_schema.properties && t.input_schema.properties.goto));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const onPaper = async id => { await page.evaluate(i => { setView('dashboard'); igAnalyze(i); }, id);
      return until(i => window.intel && intel.paper && intel.paper.id === i && !!document.getElementById('igd-input') && !intel.busy, id, 10000); };
    const panelAsk = async q => { /* RE-PINNED 28 Oct 2026 ("Door above the box": typed words are the brain's but a page's one name): asked as a chip asks */ await page.evaluate(w => intelAsk(w), q); };
    const stdState = () => page.evaluate(() => ({ view: state.view,
      booksTab: !!document.querySelector('[data-pb-tab="playbook"].on, [data-pb-tab="playbook"][aria-selected="true"]'),
      book: (document.querySelector('[data-sd-book].is-sel') || {}).getAttribute ? document.querySelector('[data-sd-book].is-sel').getAttribute('data-sd-book') : null,
      said: (intel.history.filter(m => m.role === 'assistant').slice(-1)[0] || {}).text || '' }));

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    const parts = await page.evaluate(() => ['caActOf', 'jmRead', 'jmGotoAct', 'jmStdBook', 'aiGotoRun', 'caOpenStandards'].filter(n => typeof window[n] !== 'function'));
    check('0 the parts are loaded', parts.length === 0, parts.length ? 'missing ' + parts.join(', ') : null);
    if (parts.length) throw new Error('nothing to drive');
    await until(() => typeof window.MiniSearch === 'function', null, 10000);

    console.log('\n1 · the owner\'s sentence, beside a paper');
    check('1 · MK-B2 is on the paper', !!(await onPaper('MK-B2')));
    await panelAsk('show me where i can edit our standards for the procurement stream');
    const s1 = await until(() => state.view === 'playbook' && !!document.querySelector('[data-pb-tab]') ? true : null, null, 8000) && await stdState();
    check('1a it opens Our standards', !!s1 && s1.view === 'playbook', JSON.stringify(s1));
    check('1b on the Negotiation playbook tab', !!s1 && s1.booksTab, JSON.stringify(s1));
    check('1c with the Supply book chosen (Procurement\'s contracts are judged by it)', !!s1 && s1.book === 'supply', s1 && s1.book);
    check('1d Jambo says where he went, naming the book', !!s1 && /standards/i.test(s1.said) && /supply/i.test(s1.said), s1 && s1.said);
    const filing = await page.evaluate(() => !!document.querySelector('#ws-filing:focus, .ov-filing.is-lit'));
    check('1e the open contract\'s Filing row was not pressed', !filing);
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `1-standards-supply-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n2 · our standards, and the templates, by name');
    await onPaper('MK-B2');
    await panelAsk('take me to our standards for the procurement stream');
    const s2 = await until(() => state.view === 'playbook' ? true : null);
    check('2a "take me to our standards for the procurement stream" opens Our standards, on the Supply book', !!s2 && (await stdState()).book === 'supply', JSON.stringify(await stdState()));
    await onPaper('MK-B2');
    await panelAsk('take me to our standards');
    const s2b = await until(() => state.view === 'playbook' ? true : null);
    check('2a2 "take me to our standards" opens Our standards', !!s2b, await page.evaluate(() => state.view));
    await onPaper('MK-B2');
    await panelAsk('take me to the templates');
    const s3 = await until(() => state.view === 'templates' ? true : null);
    check('2b "take me to the templates" still opens the templates', !!s3, await page.evaluate(() => state.view));

    console.log('\n3 · the AI takes you there');
    await onPaper('MK-B2');
    const n0 = ai.calls.length;
    await panelAsk('the place where we decide how hard we push back on liability');
    const s4 = await until(() => state.view === 'playbook' ? true : null, null, 12000);
    const sent = toolsOfLast(ai.calls.slice(n0));
    check('3a the question went to the AI with goto in its answer tool', hasGoto(sent), sent ? (sent.tools || []).map(t => t.name).join(',') : 'no call');
    check('3b the answer\'s place opened: Our standards', !!s4, await page.evaluate(() => state.view));
    const said3 = await page.evaluate(() => intel.history.filter(m => m.role === 'assistant').slice(-2).map(m => m.text || '').join(' | '));
    check('3c Jambo says it in his conversation', /standards/i.test(said3), said3.slice(0, 160));
    await page.screenshot({ path: path.join(OUT, '3-ai-takes-you-there-1440x780.png') });

    console.log('\n4 · the switch');
    await page.evaluate(() => { setView('team'); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { settingsGoTab('build'); stDrawerOpen('engine'); });
    await until(() => !!document.getElementById('ai-navigate'), null, 8000);
    await page.evaluate(() => { const d = document.getElementById('ai-advanced'); if (d) d.open = true; });
    const sw = await until(() => { const b = document.getElementById('ai-navigate'); if (!b) return null; const r = b.getBoundingClientRect();
      return (r.width > 0) ? { on: b.checked, says: b.closest('label').textContent.replace(/\s+/g, ' ').trim() } : null; }, null, 8000);
    /* the server's own reading has arrived before the switch is pressed (GitHub's slower machine, 22 Oct 2026) */
    await until(async () => { const r = await api('ai/config'); return r && r.limits ? true : null; }, null, 8000);
    check('4a Settings → Jambo engine carries the switch, on at first', !!sw && sw.on, sw && sw.says.slice(0, 120));
    check('4b it says what it adds in calls and words, never money', !!sw && /no extra Jambo calls/i.test(sw.says) && !/\$|USD|KES/.test(sw.says), sw && sw.says.slice(-120));
    await page.screenshot({ path: path.join(OUT, '4-the-switch-1440x780.png') });
    await page.evaluate(() => { document.getElementById('ai-navigate').click(); document.getElementById('ai-limits-save').click(); });
    const off = await until(async () => { const r = await api('ai/config'); return r && r.limits && r.limits.navigate === false; }, null, 8000);
    check('4c turned off and saved, the server keeps it off', !!off);
    await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
    await page.keyboard.press('Escape');
    await onPaper('MK-B2');
    const n1 = ai.calls.length;
    await panelAsk('the place where we decide how hard we push back on liability');
    await until(() => !intel.busy && intel.history.length ? true : null, null, 12000);
    await page.waitForTimeout(600);
    const sent2 = toolsOfLast(ai.calls.slice(n1));
    check('4d off, the answer tool carries no goto', !!sent2 && !hasGoto(sent2), sent2 ? 'sent' : 'no call');
    check('4e and a goto the model writes anyway is not run: the page stays', await page.evaluate(() => state.view) === 'dashboard', await page.evaluate(() => state.view));
    await page.evaluate(() => api('ai/config', 'PUT', { navigate: true }));

    console.log('\n5 · the page');
    check('5 nothing on the page threw', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all passed'}`);
  process.exit(failures ? 1 : 0);
})();
