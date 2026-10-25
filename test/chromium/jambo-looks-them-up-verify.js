/* JAMBO LOOKS THE OTHER SIDE UP ON THE WEB — where the reader looks
   ============================================================
   Round 3 of Jambo's journey (owner, 22 Oct 2026: "this should be simple
   internet search to understand the company not the credit rating"; "Yes" to
   a party's name leaving HaTi for it). f864 pins the route and the readings;
   this file asks the reader's questions in a real browser, with a stand-in
   for the provider's web search:
     1 · the Dossier carries one "On the web" line after Who else; a press
         opens its pop-up, which says nothing is kept yet and carries the
         press with its cost on it
     2 · the press waits visibly, then the pop-up shows each fact with its
         source as a link, what could not be found and what was left out;
         only the company's name was sent; Done lands back on the Dossier,
         whose line now says what is kept
     3 · after an upload his first words offer "Look them up online" with its
         cost; the press waits in his panel, then says what he found, links
         and all; the road stays the one filled button
     4 · the owner's three screens: the line and the pop-up in view, nothing
         sideways
   Run: node test/chromium/jambo-looks-them-up-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'jambo-looks-them-up');
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
const still = page => until(page, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);

/* THE PROVIDER, STOOD IN: a web search answers in cited lines about the company it was asked;
   every other call gets the tool it asked for, empty (the arrival reading runs, finds little) */
function startWebStub(){
  const searches = [];
  let hold = null;
  const server = http.createServer((req, res) => {
    let raw = ''; req.on('data', d => { raw += d; });
    req.on('end', async () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      if (hold) await hold;
      const web = Array.isArray(body.tools) && body.tools.some(t => t && t.name === 'web_search');
      let content;
      if (web){
        const who = String(((body.messages || [])[0] || {}).content || '').replace(/^The company:\s*/, '');
        searches.push({ who, raw });
        const site = 'https://www.' + who.toLowerCase().replace(/[^a-z]+/g, '') + '.example/about';
        content = [
          { type: 'server_tool_use', id: 'srv_1', name: 'web_search', input: { query: who } },
          { type: 'web_search_tool_result', tool_use_id: 'srv_1', content: [] },
          { type: 'text', text: `FACT: ${who} runs a chain of shops in three countries.`, citations: [{ type: 'web_search_result_location', url: site, title: 'About', cited_text: 'x' }] },
          { type: 'text', text: '\nFACT: It was founded in 1990.', citations: [{ type: 'web_search_result_location', url: 'https://en.wikipedia.org/wiki/Example', title: 'Wikipedia', cited_text: 'x' }] },
          { type: 'text', text: '\nFACT: It is the best company in the world.\nMISSING: how many people it employs' },
        ];
      } else {
        const name = (body.tool_choice && body.tool_choice.name) || (Array.isArray(body.tools) && body.tools.length ? body.tools[0].name : 'deliver_answer');
        content = [{ type: 'tool_use', id: 'tu_stub', name, input: name === 'deliver_answer' ? { answer: 'stubbed answer', citations: [] } : {} }];
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'msg_stub', type: 'message', role: 'assistant', model: body.model || 'stub', content,
        usage: { input_tokens: 10, output_tokens: 5, server_tool_use: web ? { web_search_requests: 1 } : undefined }, stop_reason: 'end_turn' }));
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ base: 'http://127.0.0.1:' + server.address().port, searches,
    holdOn(){ let go; hold = new Promise(x => { go = x; }); return () => { hold = null; go(); }; },
    stop: () => new Promise(x => server.close(x)) })));
}

const TEXT = [
  'SOFTWARE SUBSCRIPTION AGREEMENT', '',
  'This agreement is made between Highland Corporate Ltd and Nordvik Logistik AB.', '',
  '1. Term', 'This agreement runs for three years.', '',
  '2. Liability', 'The Supplier shall be liable for all losses of any kind without limitation.', '',
  '3. Payment', 'The Customer shall pay each invoice within sixty (60) days of receipt.',
].join('\n');

(async () => {
  const ai = await startWebStub();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [], blocked = [];
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

    /* ============ 1 · THE DOSSIER'S LINE ============ */
    /* Home takes a moment after sign-in: the press is asked again until the paper is up (bounded) */
    for (let i = 0; i < 20; i++){
      await drive(() => pdOpenOnHome('MK-B2', 'copilot'), null, null);
      if (await until(P, () => !!(window.pdOnPaper && pdOnPaper() && pdContract() && pdContract().id === 'MK-B2' && document.querySelector('#pd-glance')), null, 1500)) break;
    }
    const ROW = '#ig-dock tr[data-pd-og-row="web"]';
    const rowUp = await until(P, s => !!document.querySelector(s), ROW, 10000);
    check(rowUp, '1a the Dossier carries the "On the web" line', rowUp ? null : await drive(() => ({ dock: !!document.querySelector('#ig-dock'), gl: !!document.querySelector('#pd-glance'),
      open: intel.dockOpen, tab: pdTab(), face: pdFaceNow(), onp: pdOnPaper(), cid: pdContract() && pdContract().id,
      rows: [...document.querySelectorAll('#ig-dock tr[data-pd-og-row]')].map(r => r.getAttribute('data-pd-og-row')) }), null, null));
    const row = await drive(s => {
      const r = document.querySelector(s); if (!r) return null;
      r.scrollIntoView({ block: 'nearest' });
      const ppl = document.querySelector('#ig-dock tr[data-pd-og-row="people"]');
      const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 30, b.top + b.height / 2);
      return { text: r.innerText.replace(/\s+/g, ' ').trim(), painted: !!(at && r.contains(at)),
        afterPeople: !!(ppl && ppl.nextElementSibling === r), h: Math.round(b.height), hp: ppl ? Math.round(ppl.getBoundingClientRect().height) : 0,
        hs: (() => { const sg = document.querySelector('#ig-dock tr[data-pd-og-row="signers"]'); return sg ? Math.round(sg.getBoundingClientRect().height) : 0; })() };
    }, ROW, null);
    check(!!(row && row.painted && /On the web/.test(row.text) && /Not looked up yet/.test(row.text)), '1b painted, and it says nothing is kept yet', row);
    /* RE-POINTED 25 Oct 2026 (the owner picked "Two lines"): "Who else is on this agreement" may take a second
       line, so the web row is measured against a one-line door row (the Signer's), and Who else against it as one
       line or two (owner's pick: a door row's name takes two lines before "…") */
    check(!!(row && row.afterPeople && row.h === row.hs && (row.hp === row.hs || row.hp === row.hs + 20)), '1c right after Who else, a door row of the same dress (one line as the Signer\'s; Who else one or two lines)', row && { afterPeople: row.afterPeople, h: row.h, hp: row.hp, hs: row.hs });
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-dossier-line.png') });
    await drive(s => document.querySelector(s + ' [data-pd-web]').click(), ROW, null);
    const dlg = await until(P, () => !!document.querySelector('.pw-dlg [data-pw-go]'), null, 5000);
    const say = await drive(() => { const g = document.querySelector('.pw-dlg [data-pw-go]'); const d = document.querySelector('.pw-dlg');
      return g && { go: g.innerText.trim(), title: g.title, hidden: g.hidden, text: d.innerText.replace(/\s+/g, ' ') }; }, null, null);
    check(dlg && !!(say && !say.hidden && say.go === 'Look them up online · 1 Jambo call' && /up to 5 web searches/.test(say.title) && /Not a credit check/.test(say.title)),
      '1d its pop-up carries the press, the cost on it', say);
    check(!!(say && /haven't looked Naivas Supermarkets up yet/.test(say.text)), '1e and says nothing is kept yet', say && say.text);

    /* ============ 2 · THE PRESS ============ */
    const release = ai.holdOn();
    ai.searches.length = 0;
    await drive(() => document.querySelector('.pw-dlg [data-pw-go]').click(), null, null);
    const waits = await until(P, () => !!document.querySelector('.pw-dlg .ob-spin') && document.querySelector('.pw-dlg [data-pw-go]').disabled, null, 5000);
    check(waits, '2a while it searches, something moves and the press waits');
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-searching.png') });
    release();
    const found = await until(P, () => document.querySelectorAll('.pw-dlg .pw-list li').length === 2, null, 10000);
    const res = await drive(() => { const d = document.querySelector('.pw-dlg');
      return { text: d.innerText.replace(/\s+/g, ' '), links: [...d.querySelectorAll('a.pw-src')].map(a => [a.textContent, a.getAttribute('href'), a.target, a.rel]),
        go: document.querySelector('.pw-dlg [data-pw-go]').innerText.trim() }; }, null, null);
    check(found && !!(res && /Here's what I found about Naivas Supermarkets on the web/.test(res.text)), '2b the facts he found', res && res.text);
    check(!!(res && res.links.length === 2 && res.links[0][0] === 'naivassupermarkets.example' && res.links[0][2] === '_blank' && /noopener/.test(res.links[0][3])), '2c each with its source, a link that opens apart', res && res.links);
    check(!!(res && /couldn't find: how many people it employs/.test(res.text) && /left out 1 thing/.test(res.text) && !/best company/.test(res.text)),
      '2d what could not be found is said; the unsourced line is left out and counted', res && res.text);
    check(!!(res && res.go === 'Look up again · 1 Jambo call'), '2e the press now looks again, cost on it', res && res.go);
    check(ai.searches.length === 1 && ai.searches[0].who === 'Naivas Supermarkets' && !/Highland|MK-B2|Retail Supply/.test(ai.searches[0].raw.replace(/"system":"[^"]*"/, '')),
      '2f one search, and only the company\'s name left HaTi', ai.searches.map(s => s.who));
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-found.png') });

    /* ============ 4 · THE OWNER'S THREE SCREENS (the pop-up up) ============ */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh });
      const fit = await drive(() => { const d = document.querySelector('.pw-dlg'); const b = d && d.getBoundingClientRect();
        const done = document.querySelector('[data-pw-done]'); const db = done && done.getBoundingClientRect();
        return { side: document.documentElement.scrollWidth > window.innerWidth + 1, dlg: !!(b && b.right <= window.innerWidth && b.left >= 0),
          done: !!(db && db.bottom <= window.innerHeight && db.top >= 0) }; }, null, {});
      check(!fit.side && fit.dlg && fit.done, `4 ${w}×${hh}: the pop-up fits, Done in view, nothing sideways`, fit);
      await still(P); await P.screenshot({ path: path.join(OUT, `${w}x${hh}-popup.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });
    await drive(() => document.querySelector('[data-pw-done]').click(), null, null);
    const back = await until(P, s => !document.querySelector('.pw-dlg') && /2 facts, looked up/.test((document.querySelector(s) || {}).innerText || ''), ROW, 6000);
    check(back, '2g Done lands back on the Dossier, whose line now says what is kept');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh });
      const fit = await drive(s => { const r = document.querySelector(s); if (!r) return {}; r.scrollIntoView({ block: 'nearest' });
        const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 30, b.top + b.height / 2);
        return { side: document.documentElement.scrollWidth > window.innerWidth + 1, painted: !!(at && r.contains(at)) }; }, ROW, {});
      check(!fit.side && fit.painted, `4 ${w}×${hh}: the Dossier's line is painted, nothing sideways`, fit);
      await still(P); await P.screenshot({ path: path.join(OUT, `${w}x${hh}-dossier-line.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* ============ 3 · HIS FIRST WORDS OFFER IT ============ */
    /* the provider's reading names the other side; the stand-in names nobody, so while its answers are
       held the record is given the name the reading would have found (the arrival reader then reads it) */
    const go = ai.holdOn();
    const ids0 = await drive(() => state.contracts.map(c => c.id), null, []);
    await drive(t => { window._pwUp = uploadFromDrop(new File([t], 'Nordvik_SaaS_Agreement.txt', { type: 'text/plain' }), {}); }, TEXT, null);
    await until(P, was => state.contracts.some(c => !was.includes(c.id)), ids0, 15000);
    /* through the page's own save (a save behind its back would rightly be met with "changed on the server") */
    const id = await drive(async was => { const c = state.contracts.find(x => !was.includes(x.id)); if (!c) return null;
      c.counterparty = 'Nordvik Logistik AB'; persist(c); return c.id; }, ids0, null);
    for (let i = 0; i < 30; i++){   /* the save has reached the server (bounded) */
      if (await drive(async x => { try { const r = await api('contracts/' + encodeURIComponent(x)); return !!(r && r.counterparty === 'Nordvik Logistik AB'); } catch (_) { return false; } }, id, false)) break;
      await until(P, () => false, null, 300);
    }
    go();
    check(!!id, '3a an upload through Jambo\'s drop area', id);
    const spoke = await until(P, i => (intel.history || []).some(m => m && m.firstRead === i) && !!document.querySelector('#ig-dock [data-ig-choice]'), id, 60000);
    check(spoke, '3b his first words are in his panel');
    const offer = await drive(() => { const b = [...document.querySelectorAll('#ig-dock [data-ig-choice]')].find(x => /Look them up online/.test(x.innerText));
      return b ? { word: b.innerText.trim(), title: b.title, filled: b.classList.contains('ui-btn-primary') } : null; }, null, null);
    check(!!(offer && offer.word === 'Look them up online · 1 Jambo call' && /up to 5 web searches/.test(offer.title) && !offer.filled), '3c he offers to look them up, cost on the button, not filled', offer);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-offer.png') });
    ai.searches.length = 0;
    await drive(() => [...document.querySelectorAll('#ig-dock [data-ig-choice]')].find(x => /Look them up online/.test(x.innerText)).click(), null, null);
    const answered = await until(P, () => [...document.querySelectorAll('#ig-dock .jb-turn')].some(t => /found about Nordvik Logistik AB on the web/.test(t.innerText) && t.querySelector('a.pw-src')), null, 15000);
    check(answered, '3d he says what he found, each fact with its source');
    const after = await drive(() => { const t = [...document.querySelectorAll('#ig-dock .jb-turn')].find(x => /found about Nordvik/.test(x.innerText)); if (!t) return null;
      t.scrollIntoView({ block: 'nearest' }); const r = t.getBoundingClientRect(); const at = document.elementFromPoint(r.left + 30, r.top + 12);
      return { painted: !!(at && t.contains(at)), filled: document.querySelectorAll('#ig-dock .igd-choices .ui-btn-primary').length,
        again: [...document.querySelectorAll('#ig-dock [data-ig-choice]')].filter(x => /Look them up online/.test(x.innerText)).length,
        clash: /just changed on the server/.test(document.body.innerText) }; }, null, null);
    check(!!(after && after.painted && after.filled === 1 && after.again === 0 && !after.clash), '3e painted in his panel; the offer is spent; the road is still the one filled button', after);
    check(ai.searches.length === 1 && ai.searches[0].who === 'Nordvik Logistik AB', '3f one search, on their name', ai.searches.map(s => s.who));
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-answer.png') });

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
