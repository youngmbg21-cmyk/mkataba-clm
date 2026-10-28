/* Chromium verification: BOTH HALVES, AND THE NEEDS YOU CARD FOLDS (owner, 25 Oct 2026)
   ============================================================
   The owner picked "Both halves" by name: "if you ask to tell you more about something, it should be okay to be
   pushed to the board and it shows you the charts while giving you nuanced answers". And: "add the ability for
   the needs you card to be able to be minimized". Driven with a scripted model, waits ask for the state, bounded.
     A  "tell me more about …" typed beside the Board: the Board draws the subject, free, and Jambo explains it — one call
     B  the next questions stand under Jambo's words, not above them on the Board's line
     C  "more" carries the answer on in the chat, the chart left as it is — one call more
     D  the Needs you card: Hide folds it to its head (count kept), a refresh keeps it, Show opens it,
        a door onto the card ("Show all") opens it first; photographed at the owner's three screens
     E  no page errors
   Run: node test/chromium/both-halves-and-fold-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'both-halves-and-fold');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const deliver = (answer, ids) => [{ type: 'tool_use', id: 'tu_w', name: 'deliver_answer', input: { answer, citations: (ids || []).map(id => ({ id })) } }];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const waitCalls = async n => { const t0 = Date.now(); while (Date.now() - t0 < 10000 && ai.calls.length < n) await page.waitForTimeout(120); return ai.calls.length >= n; };
    const signIn = async () => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      if (await page.$('#li-email')){ await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    };
    await signIn();
    const toBoard = () => page.evaluate(() => { if (window.ai && ai.open) closeAI(); intel.history = []; setView('dashboard'); intel.paper = null; hbSetFace('board'); });
    await toBoard();
    await until(() => !!document.getElementById('igd-input') && !intel.busy);
    /* RE-PINNED 28 Oct 2026 ("Door above the box": every word typed is the brain's but a page's one name): the Board's own
       reader draws first here, so it is asked as a chip asks */
    const ask = async q => { await page.evaluate(w => intelAsk(w), q); };
    const turns = () => page.evaluate(() => intel.history.map((m, i) => ({ i, role: m.role, text: String(m.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140), reading: !!m.reading, nextKey: m.nextKey || null })));

    console.log('\nA · "tell me more about …" beside the Board: drawn, then explained');
    ai.reset(); ai.script(deliver('Two deals wait on us, both with Naivas Supermarkets; the older has waited nine days.'));
    await ask('tell me more about which contracts are waiting on us');
    await waitCalls(1); await until(() => !intel.busy);
    const A = await page.evaluate(() => ({ key: (hbS().path || []).slice(-1)[0] || null, face: hbS().face, view: state.view }));
    const tA = await turns();
    const board = tA.find(t => t.role === 'assistant' && /Free/.test(t.text));
    const words = tA.filter(t => t.role === 'assistant').slice(-1)[0];
    check('A1 the Board drew the subject (a card is open on the Board)', !!A.key && A.face === 'board' && A.view === 'dashboard', JSON.stringify(A));
    check('A2 the Board said its own line first, free', !!board && board.i < (words ? words.i : -1), board && board.text);
    check('A3 and Jambo explained it under that line, in one call', !!words && /Naivas/.test(words.text) && ai.calls.length === 1, JSON.stringify({ words: words && words.text, calls: ai.calls.length }));
    const sent = (() => { const c = ai.calls.slice(-1)[0]; const m = c && c.body && c.body.messages; return m ? JSON.stringify(m[m.length - 1]) : ''; })();
    check('A4 the brain was asked the words as typed, told the Board as it stands', /tell me more about which contracts are waiting on us/.test(sent) && /What the board shows now/.test(sent), sent.slice(0, 200));

    console.log('\nB · the next questions sit under the words');
    const B = await page.evaluate(() => {
      const ts = [...document.querySelectorAll('#igd-feed [data-ig-turn]')];
      const at = el => { const t = el.closest('[data-ig-turn]'); return t ? Number(t.getAttribute('data-ig-turn')) : null; };
      const nx = [...document.querySelectorAll('#igd-feed .hb-nx')].map(at);
      const last = intel.history.length - 1;
      return { nx, last, turns: ts.length, offered: typeof hbNextQuestions === 'function' && hbOpenListKey() ? hbNextQuestions(hbOpenListKey()).length : 0 };
    });
    if (B.offered) check('B1 the open chart\'s next questions are drawn once, under Jambo\'s words', B.nx.length === 1 && B.nx[0] === B.last, JSON.stringify(B));
    else check('B1 the chart offers no next questions here, and none is drawn anywhere', B.nx.length === 0, JSON.stringify(B));

    console.log('\nC · "more" carries it on');
    const keyBefore = A.key;
    ai.script(deliver('More on it: the Naivas pair stalled on payment terms in round two.'));
    await ask('more');
    await waitCalls(2); await until(() => !intel.busy);
    const tC = await turns();
    const C = await page.evaluate(() => ({ key: (hbS().path || []).slice(-1)[0] || null, view: state.view }));
    const lastC = tC.filter(t => t.role === 'assistant').slice(-1)[0];
    check('C1 the chat answered "more", one call more', ai.calls.length === 2 && !!lastC && /payment terms/.test(lastC.text), JSON.stringify({ calls: ai.calls.length, last: lastC && lastC.text }));
    const sentC = (() => { const c = ai.calls.slice(-1)[0]; return c && c.body ? JSON.stringify(c.body.messages || []) : ''; })();
    check('C2 with the conversation before it, so "more" has its subject', /tell me more about which contracts are waiting on us/.test(sentC) && /Naivas/.test(sentC));
    check('C3 the chart is left as it was', C.key === keyBefore && C.view === 'dashboard', JSON.stringify(C));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `A-drawn-and-explained-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\nD · the Needs you card folds to its head');
    await page.evaluate(() => { intel.history = []; hbS().path = []; hbSave(); hbPaintBoard(); });
    const card = await until(() => { const c = document.getElementById('hm-agents'); return c && c.getClientRects().length ? true : null; });
    check('D0 the card is on the Board, open', !!card && await page.evaluate(() => !document.getElementById('nd-main').hidden && document.querySelector('[data-nd-fold]').textContent.trim() === 'Hide'));
    const measure = () => page.evaluate(() => {
      const c = document.getElementById('hm-agents'), b = c.querySelector('[data-nd-fold]'), hd = c.querySelector('.hb-ch');
      const r = c.getBoundingClientRect(), br = b.getBoundingClientRect(), hr = hd.getBoundingClientRect();
      const mid = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
      return { h: Math.round(r.height), head: Math.round(hr.height), word: b.textContent.trim(), expanded: b.getAttribute('aria-expanded'), hidden: document.getElementById('nd-main').hidden,
        count: (c.querySelector('.hb-cs') || {}).textContent || '', inside: br.right <= r.right - 8 && br.left >= r.left, oneLine: br.height <= 34, painted: !!mid && (mid === b || b.contains(mid)), folded: c.classList.contains('is-folded') };
    });
    const before = await measure();
    await page.click('[data-nd-fold]');
    const shut = await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-folded') ? true : null; });
    const D1 = await measure();
    check('D1 Hide folds it to its head: the rows are gone, the head stays', !!shut && D1.hidden && D1.h <= D1.head + 2 && D1.h < before.h, JSON.stringify({ before: before.h, after: D1.h, head: D1.head }));
    check('D2 the head still says how many things wait', /\d/.test(D1.count) && D1.count === before.count.split(' · ')[0] || /\d/.test(D1.count), D1.count);
    check('D3 the button now says Show, is pressed-state honest, sits inside the card on one line and is the thing painted there', D1.word === 'Show' && D1.expanded === 'false' && D1.inside && D1.oneLine && D1.painted, JSON.stringify(D1));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      const m = await measure(); check(`D4 folded at ${w}×${hh}: inside the card, one line, painted`, m.folded && m.inside && m.oneLine && m.painted, JSON.stringify(m));
      await page.evaluate(() => { const c = document.getElementById('hm-agents'); if (c) c.scrollIntoView({ block: 'center' }); });
      await page.screenshot({ path: path.join(OUT, `D-folded-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await signIn();
    await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); });
    const kept = await until(() => { const c = document.getElementById('hm-agents'); return c ? { folded: c.classList.contains('is-folded') } : null; }, null, 10000);
    check('D5 a refresh keeps it folded', !!kept && kept.folded, JSON.stringify(kept));
    await page.click('[data-nd-fold]');
    const open = await until(() => { const c = document.getElementById('hm-agents'); return c && !c.classList.contains('is-folded') && !document.getElementById('nd-main').hidden ? true : null; });
    const D6 = await measure();
    check('D6 Show opens it again, and the button says Hide', !!open && D6.word === 'Hide' && D6.expanded === 'true', JSON.stringify(D6));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      const m = await measure(); check(`D7 open at ${w}×${hh}: the button inside the card, one line, painted`, !m.folded && m.inside && m.oneLine && m.painted, JSON.stringify(m));
      await page.evaluate(() => { const c = document.getElementById('hm-agents'); if (c) c.scrollIntoView({ block: 'start' }); });
      await page.screenshot({ path: path.join(OUT, `D-open-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.click('[data-nd-fold]');
    await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-folded') ? true : null; });
    await page.evaluate(() => ndOpenBoard('you'));
    const landed = await until(() => { const c = document.getElementById('hm-agents'); return c && !c.classList.contains('is-folded') && !document.getElementById('nd-main').hidden ? true : null; }, null, 10000);
    check('D8 a door onto the card ("Show all") opens a folded card before it lands', !!landed);
    check('D9 folding spent nothing', ai.calls.length === 2, `${ai.calls.length}×`);

    check('E no page errors', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    console.error(e); failures++;
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
