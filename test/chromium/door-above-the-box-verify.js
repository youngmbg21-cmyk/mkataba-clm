/* Chromium verification: ONE PANEL, TWO FACES — THE DOOR ABOVE THE BOX (owner picked "Door above the box", 28 Oct 2026)
   ============================================================
   The owner: "a process whereby the jambo tab is not visible just the overview. … if you type one word describing a
   page let's say settings, you are moved to settings immediately. If you type more than one word, you are then taken
   to AI brain … once you press enter the screen becomes a jambo screen but right above the entry fields, the word
   overview appear and it becomes the door back to the overview"; then "Only real page names move you" and "I can also
   use long form to move me but that goes to the brain". On EVERY page with Jambo's panel:
     1  the landing draws no Jambo tab, and no door
     2  a question typed on the landing is one call to the brain, and the panel turns to his conversation
     3  his name alone heads the panel then, nothing in the head to press back with
     4  "‹ <landing>" stands right above the box (within 12px), with the bin at its end
     5  the door pressed, the landing is back and the door is gone
     6  one page's name typed on the landing moves there, nothing spent
     7  the long form ("take me to …") is the brain's: one call
   and Home's box and the ✦ window: 8 a page's one name typed there moves, nothing spent.
   AT THE PARENT (origin/main ec02c5f): 1 fails everywhere (the Jambo tab is drawn), 2 on every page but Home's Board
   (Overview's box kept the free readers), 3 and 4 everywhere, 6 on Home's dock pages (the Board's own reader), 8 both.
   Run: node test/chromium/door-above-the-box-verify.js   (HATI_DOOR_ONLY=approvals,settings to run some) */
/* global aiWinToggle, closeAI, state, setView, hbSetFace, hbOpenContracts, openNegotiations, closeModal, jlToWords, jamboTalkUp, jamboTalkBack, roomHomeLand */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');
const { navContracts } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(120); }
  return null;
}
/* page, how it opens, its panel, its box, the landing's name, a page word that moves away from it and where it lands */
const PAGES = [
  ['board', "setView('dashboard'); hbSetFace('board')", '#ig-dock', '#igd-input', 'Overview', 'approvals', 'approvals'],
  ['contracts', 'hbOpenContracts()', '#ig-dock', '#igd-input', 'Overview', 'approvals', 'approvals'],
  ['explorer', "setView('dashboard'); hbSetFace('explorer')", '#ig-dock', '#igd-input', 'Overview', 'approvals', 'approvals'],
  ['dossier', "roomHomeLand('MK-A2')", '#ig-dock', '#igd-input', 'Dossier', 'approvals', 'approvals'],
  ['calendar', "setView('calendar')", '#cal-plan', '#cal-plan-in', 'Overview', 'approvals', 'approvals'],
  ['approvals', "setView('approvals')", '#ins-panel', '#jl-q', 'Overview', 'obligations', 'obligations'],
  ['obligations', "setView('obligations')", '#ins-panel', '#jl-q', 'Overview', 'approvals', 'approvals'],
  ['negotiations', 'openNegotiations()', '#ins-panel', '#jl-q', 'Overview', 'approvals', 'approvals'],
  ['customers', "setView('customers')", '#ins-panel', '#jl-q', 'Overview', 'approvals', 'approvals'],
  ['directory', "setView('directory')", '#ins-panel', '#jl-q', 'Overview', 'approvals', 'approvals'],
  ['templates', "setView('templates')", '#ins-panel', '#jl-q', 'Overview', 'approvals', 'approvals'],
  ['migration', "setView('migration')", '#mig-side', '#jl-q', 'Overview', 'approvals', 'approvals'],
  ['settings', "setView('team')", '#st-side', '#st-jb-q', 'Overview', 'approvals', 'approvals'],
];
const TALK_TAB = '.pd-tab-talk, [data-jl-talk], [data-st-talk-label], [data-cal-talk], .st-side-talk';
const HEAD = '.jl-head, .igd-head, .st-side-head, .cal-plan-head';
const deliver = answer => ({ content: [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer, citations: [] } }] });

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  const cs = navContracts();
  /* a live negotiation, so Negotiations has rows and its panel */
  { const a2 = cs.find(c => c.id === 'MK-A2'); const at = new Date(Date.now() - 4 * 864e5).toISOString();
    a2.negotiation = { rounds: [{ n: 1 }], turn: 'us', turnAt: at };
    a2.changes = [{ id: 'ch1', clauseId: 'c1', clauseLabel: '3. Payment', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'thirty', after: 'sixty' }]; }
  await seedWorkspace(h, { contracts: cs, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1536, height: 730 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && state.contracts && state.contracts.length > 5 && typeof hbOpenContracts === 'function'), null, 20000);
    await P.waitForTimeout(1200);
    const ONLY = process.env.HATI_DOOR_ONLY ? process.env.HATI_DOOR_ONLY.split(',') : null;
    const open = async (go, host) => {
      await P.evaluate(() => { try { closeModal(); } catch (_){} });
      await P.evaluate(g => { eval(g); }, go);
      const up = await until(P, s => { const e = document.querySelector(s); return e && e.getBoundingClientRect().width > 200; }, host);
      await P.waitForTimeout(700);
      await P.evaluate(() => { try { jlToWords(); } catch (_){} try { if (window.jamboTalkUp && jamboTalkUp()) jamboTalkBack(); } catch (_){} });
      await P.waitForTimeout(300);
      return up;
    };
    const type = async (box, words) => { await P.fill(box, words); await P.press(box, 'Enter'); };
    const settled = () => until(P, () => !(window.ai && ai.busy) && !(window.intel && intel.busy) ? true : null, null, 12000);
    const shown = (host, sel) => P.evaluate(([h0, s]) => [...document.querySelectorAll(`${h0} ${s}`)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length, [host, sel]);
    const door = host => P.evaluate(([h0, hd]) => {
      const root = document.querySelector(h0); if (!root) return null;
      const d = [...root.querySelectorAll('[data-jb-door]')].find(e => e.getBoundingClientRect().height > 0);
      const head = root.querySelector(hd);
      const headPress = head ? [...head.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0 && !/collapse|fold/i.test(b.id + ' ' + b.className + ' ' + [...b.attributes].map(a => a.name).join(' '))).map(b => (b.textContent || '').trim().slice(0, 12)) : null;
      const label = head ? [...head.querySelectorAll('.jb-talk-label, [data-st-talk-label]')].some(e => e.getBoundingClientRect().width > 0 && /Jambo/.test(e.textContent)) : false;
      if (!d) return { door: false, label, headPress };
      const card = d.parentElement && [...d.parentElement.querySelectorAll('.jb-card')].find(e => e.getBoundingClientRect().height > 0);
      const back = d.querySelector('.jb-door-back');
      const bin = [...d.querySelectorAll('[data-jb-bin], #igd-history-clear')].some(e => e.getBoundingClientRect().width > 0);
      const gap = card ? Math.round(card.getBoundingClientRect().top - d.getBoundingClientRect().bottom) : null;
      return { door: true, word: back ? back.textContent.trim() : '', gap, bin, label, headPress, convo: ((window.ai && ai.history) || []).length };
    }, [host, HEAD]);

    for (const [key, go, host, box, land, word, to] of PAGES){
      if (ONLY && !ONLY.includes(key)) continue;
      console.log(`\n· ${key}`);
      if (!(await open(go, host))){ check(`${key}: the panel is drawn`, false, host); continue; }
      const t0 = await shown(host, TALK_TAB), d0 = await shown(host, '[data-jb-door]');
      check(`1 ${key}: the landing draws no Jambo tab and no door`, t0 === 0 && d0 === 0, `tabs ${t0} · doors ${d0}`);
      ai.reset(); ai.script(deliver('ANS-' + key), deliver('ANS2-' + key));
      await type(box, 'what ends soon?');
      await settled(); await P.waitForTimeout(700);
      const D = await door(host);
      const calls = ai.calls.length;
      check(`2 ${key}: a question typed on the landing is the brain's, and the panel turns to him`, calls >= 1 && !!D && D.door, `${calls} call(s) · ${JSON.stringify(D)}`);
      check(`3 ${key}: his name alone heads the panel, nothing there to press back with`, !!D && D.label && Array.isArray(D.headPress) && D.headPress.length === 0, JSON.stringify(D && D.headPress));
      check(`4 ${key}: "‹ ${land}" stands right above the box, the bin at its end (while the one conversation holds words)`, !!D && D.door && D.word === land && D.gap != null && D.gap >= 0 && D.gap <= 12 && D.bin === (D.convo > 0), JSON.stringify(D));
      if (D && D.door){
        await P.click(`${host} [data-jb-door] .jb-door-back`);
        const back = await until(P, ([h0]) => { const root = document.querySelector(h0); if (!root) return null;
          const d = [...root.querySelectorAll('[data-jb-door]')].some(e => e.getBoundingClientRect().height > 0);
          const jb = [...root.querySelectorAll('.jb-talk-label, [data-st-talk-label]')].some(e => e.getBoundingClientRect().width > 0);
          const talk = [...root.querySelectorAll('[data-jt-talk], .igd-talk')].some(e => e.getBoundingClientRect().height > 0);
          return !d && !jb && !talk ? true : null; }, [host], 4000);
        check(`5 ${key}: the door pressed, the landing is back and the door is gone`, !!back);
        /* ITS MIRROR (owner picked "\"Jambo ›\" above the box", 28 Oct 2026): on the landing, once something was said,
           "Jambo ›" stands in the same spot and opens the conversation as it was, nothing spent */
        const F = await P.evaluate(([h0]) => { const root = document.querySelector(h0);
          const f = root && [...root.querySelectorAll('[data-jb-fwd-door]')].find(e => e.getBoundingClientRect().height > 0);
          const card = f && f.parentElement && [...f.parentElement.querySelectorAll('.jb-card')].find(e => e.getBoundingClientRect().height > 0);
          return f ? { word: f.textContent.trim(), gap: card ? Math.round(card.getBoundingClientRect().top - f.getBoundingClientRect().bottom) : null } : null; }, [host]);
        check(`5b ${key}: "Jambo ›" stands right above the box on the landing`, !!F && F.word === 'Jambo' && F.gap != null && F.gap >= 0 && F.gap <= 12, JSON.stringify(F));
        ai.reset();
        if (F) await P.click(`${host} [data-jb-fwd-door] [data-jb-fwd]`);
        const again = await until(P, ([h0, k]) => { const root = document.querySelector(h0); if (!root) return null;
          const d = [...root.querySelectorAll('[data-jb-door]')].some(e => e.getBoundingClientRect().height > 0);
          return d && /what ends soon/.test(root.innerText) ? true : null; }, [host, key], 4000);
        check(`5c ${key}: pressed, the conversation is back as it was, nothing spent`, !!again && ai.calls.length === 0, `${!!again} · ${ai.calls.length}× · ` + (again ? '' : await P.evaluate(h0 => (document.querySelector(h0) || {}).innerText.replace(/\s+/g, ' ').slice(0, 200), host)));
      }
      await open(go, host);
      ai.reset();
      await type(box, word);
      const moved = await until(P, v => state.view === v ? v : null, to, 6000);
      check(`6 ${key}: "${word}" typed on the landing moves to ${to}, nothing spent`, moved === to && ai.calls.length === 0, `${moved} · ${ai.calls.length}×`);
      if (key === 'approvals' || key === 'board'){
        await open(go, host);
        ai.reset(); ai.script(deliver('ANS3-' + key));
        await type(box, `take me to ${word}`);
        await settled(); await P.waitForTimeout(500);
        check(`7 ${key}: the long form is the brain's — one call`, ai.calls.length === 1, `${ai.calls.length}×`);
      }
    }

    if (!ONLY || ONLY.includes('home')){
      console.log('\n· 8: Home\'s box and the ✦ window');
      await P.evaluate(() => { try { closeModal(); } catch (_){} setView('counter'); });
      await until(P, () => { const i = document.getElementById('cn-q'); return i && i.offsetParent ? true : null; }, null, 6000);
      ai.reset();
      await type('#cn-q', 'settings');
      const s1 = await until(P, () => state.view === 'team' ? true : null, null, 6000);
      check('8a "settings" typed in Home\'s box moves to Settings, nothing spent', !!s1 && ai.calls.length === 0, `${ai.calls.length}×`);
      await open("setView('obligations')", '#ins-panel');
      await P.evaluate(() => { if (!(window.ai && ai.open && ai.win)) aiWinToggle(); });
      await until(P, () => { const i = document.getElementById('ai-input'); return i && i.offsetParent ? true : null; }, null, 6000);
      ai.reset();
      await type('#ai-input', 'approvals');
      const s2 = await until(P, () => state.view === 'approvals' ? true : null, null, 6000);
      check('8b "approvals" typed in the ✦ window moves to Approvals, nothing spent', !!s2 && ai.calls.length === 0, `${ai.calls.length}×`);
      await P.evaluate(() => { try { if (ai.open) closeAI(); } catch (_){} });
    }
    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
