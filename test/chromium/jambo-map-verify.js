/* JAMBO'S MAP (owner, 18 Oct 2026: "Start with MiniSearch and the map for
   30 tasks"; js/jambomap.js, vendor/minisearch-7.2.0.umd.js)

   WHAT THIS PINS, driven in a real browser on the seeded workspace
     0 the library arrives on its own, from HaTi itself, and the map is ready
     1 the Counter's box: everyday words open the page at once — "which
       contracts are expiring soon?" is the Contracts place narrowed to the
       next 90 days; "where do I change my language?" is your Language;
       "how do I set signing limits?" is the Signing limits drawer (an admin)
     2 Jambo's panel beside a paper: "how do I get them to sign?" is the
       send-for-signing card, waiting for its press
     3 not sure: "approval" is a "which did you mean?" card, drawn as
       Jambo's other cards, that fits the panel on the owner's three screens;
       a press opens that page
     4 a question about the wording is NOT the map's: no card, no move
     5 in Svenska the words are read and Jambo says where he went in Svenska
     9 Explorer, the 31st task (owner, 18 Oct 2026: "add Explorer as the
       31st task"): everyday words open it from the Counter and ⌘K, and in
       Svenska
     6 nothing on the page threw
   Waits ask for the state, bounded; a part that is missing reports.
   Run: node test/chromium/jambo-map-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-map');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const toCounter = async () => { await page.evaluate(() => setView('counter')); return until(() => !!document.getElementById('cn-q')); };
    const counterAsk = async q => { await page.fill('#cn-q', q); await page.press('#cn-q', 'Enter'); };
    const onPaper = async id => { await page.evaluate(i => { setView('dashboard'); igAnalyze(i); }, id);
      return until(i => window.intel && intel.paper && intel.paper.id === i && !!document.getElementById('igd-input') && !intel.busy, id, 10000); };
    /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): everything typed on a Jambo tab goes to the AI (igTalkFirst); this check is about the free readers, so it types under Overview — an answer turns the panel to his tab, and one press on it turns back */
    const panelAsk = async q => { await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); } }); await page.fill('#igd-input', q); await page.click('#igd-go'); await page.waitForTimeout(300); };
    const lastCard = () => page.evaluate(() => { const cs = document.querySelectorAll('#igd-feed .ca-card'); const k = cs[cs.length - 1];
      return k ? { jm: k.hasAttribute('data-jm-card'), title: ((k.querySelector('.ca-ct') || {}).textContent || '').trim(),
        btns: [...k.querySelectorAll('button')].map(b => ({ t: b.textContent.trim(), act: b.getAttribute('data-ca-act'), lead: b.classList.contains('ui-btn-primary') })) } : null; });
    const drawerTitle = () => page.evaluate(() => { const t = [...document.querySelectorAll('.rvd-title')].find(x => x.getBoundingClientRect().width > 0); return t ? t.textContent.trim() : ''; });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });

    console.log('\n0 · the library');
    const parts = await page.evaluate(() => ['jmRead', 'jmMatch', 'jmCardHtml', 'caActOf', 'counterAsk'].filter(n => typeof window[n] !== 'function'));
    check('0a the map is loaded', parts.length === 0, parts.length ? 'missing ' + parts.join(', ') : null);
    if (parts.length) throw new Error('nothing to drive');
    const lib = await until(() => typeof window.MiniSearch === 'function' && [...document.scripts].some(s => /vendor\/minisearch-7\.2\.0\.umd\.js$/.test(s.src)), null, 10000);
    check('0b MiniSearch arrives on its own, served by HaTi from vendor/', !!lib);
    const ready = await page.evaluate(() => !!jmRead('which contracts are expiring soon?'));
    check('0c the map answers once it has arrived', ready);

    console.log('\n1 · the Counter\'s box');
    check('1 · on the Counter', !!(await toCounter()));
    await counterAsk('which contracts are expiring soon?');
    const exp = await until(() => state.view === 'dashboard' && !!document.getElementById('ct-place') && regState().view === 'expiring90');
    check('1a "which contracts are expiring soon?" opens the Contracts place, the next 90 days', !!exp,
      await page.evaluate(() => JSON.stringify({ view: state.view, reg: (window.regState ? regState().view : null) })));
    await page.screenshot({ path: path.join(OUT, '1a-expiring-1440x780.png') });
    await toCounter();
    await counterAsk('where do I change my language?');
    /* Language has no drawer: Settings lights its card on You, where the switch is (stYouGo) */
    const lang = await until(() => { const k = document.querySelector('[data-st-you-card="lang"]');
      /* re-pointed 19 Oct 2026 (lane F's third pass, LAND ON IT): the card is lit by the one lander */
      return state.view === 'team' && settingsTab() === 'you' && k && k.classList.contains('is-landed') && k.getBoundingClientRect().height > 0; });
    check('1b "where do I change my language?" opens You with the Language card lit', !!lang,
      await page.evaluate(() => JSON.stringify({ view: state.view, tab: window.settingsTab ? settingsTab() : null, card: !!document.querySelector('[data-st-you-card="lang"].is-landed') })));
    await page.screenshot({ path: path.join(OUT, '1b-language-1440x780.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    await toCounter();
    await counterAsk('how do I set signing limits?');
    const cap = await until(() => state.view === 'team' && [...document.querySelectorAll('.rvd-title')].some(t => t.getBoundingClientRect().width > 0 && /signing limits/i.test(t.textContent)));
    check('1c "how do I set signing limits?" opens the Signing limits drawer (an admin)', !!cap, await drawerTitle());
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);

    console.log('\n2 · beside a paper');
    check('2 · MK-B2 is on the paper', !!(await onPaper('MK-B2')));
    await panelAsk('how do I get them to sign?');
    const sl = await until(() => { const cs = document.querySelectorAll('#igd-feed .ca-card'); const k = cs[cs.length - 1];
      return k && /sign/i.test((k.querySelector('.ca-ct') || {}).textContent || '') ? true : null; }, null, 6000);
    const slCard = await lastCard();
    const slWant = await page.evaluate(() => i18t('ca_door_signlink'));
    check('2a "how do I get them to sign?" is the send-for-signing card', !!sl && slCard.title === slWant, JSON.stringify(slCard));
    check('2b it waits for its press: one button, the act', !!slCard && slCard.btns.length === 1 && slCard.btns[0].act === 'door', JSON.stringify(slCard && slCard.btns));
    check('2c nothing moved: still on the paper', await page.evaluate(() => state.view === 'dashboard' && intel.paper && intel.paper.id === 'MK-B2'));

    console.log('\n3 · not sure');
    await panelAsk('approval');
    await until(() => { const cs = document.querySelectorAll('#igd-feed .ca-card'); const k = cs[cs.length - 1]; return k && k.hasAttribute('data-jm-card'); }, null, 6000);
    const pick = await lastCard();
    const pickWant = await page.evaluate(() => ({ title: i18t('jm_pick_title'), approvals: i18t('jm_t_approvals') }));
    check('3a "approval" is a "which did you mean?" card', !!pick && pick.jm && pick.title === pickWant.title, JSON.stringify(pick));
    check('3b two or three buttons, each a task, one filled', !!pick && pick.btns.length >= 2 && pick.btns.length <= 3 && pick.btns.every(b => /^jm:/.test(b.act)) && pick.btns.filter(b => b.lead).length === 1,
      JSON.stringify(pick && pick.btns));
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      const fit = await page.evaluate(() => { const cs = document.querySelectorAll('#igd-feed [data-jm-card]'); const k = cs[cs.length - 1]; if (!k) return null;
        try { k.scrollIntoView({ block: 'nearest' }); } catch (_){}
        const r = k.getBoundingClientRect(), feed = document.getElementById('igd-feed').getBoundingClientRect();
        const btns = [...k.querySelectorAll('button')].map(b => b.getBoundingClientRect());
        const hit = btns.every(b => { const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return el && k.contains(el); });
        return { inside: r.left >= feed.left - 1 && r.right <= feed.right + 1, noScroll: k.scrollWidth <= k.clientWidth + 1, btnsIn: btns.every(b => b.right <= r.right + 1), hit }; });
      check(`3c the card fits Jambo's panel at ${w}×${hh}, every button pressable`, !!fit && fit.inside && fit.noScroll && fit.btnsIn && fit.hit, JSON.stringify(fit));
      await page.screenshot({ path: path.join(OUT, `3-which-did-you-mean-${w}x${hh}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    const btn = pick && pick.btns.find(b => b.act === 'jm:approvals');
    if (btn){
      await page.locator('#igd-feed [data-jm-card] [data-ca-act="jm:approvals"]').last().click();
      check('3d a press on "' + pickWant.approvals + '" opens Approvals', !!(await until(() => state.view === 'approvals')));
    } else check('3d a press opens its page (no "approvals" button to press)', false, JSON.stringify(pick && pick.btns));

    console.log('\n4 · a question about the wording is not the map\'s');
    await onPaper('MK-B2');
    /* RE-POINTED 21 Oct 2026 (one Jambo conversation everywhere): another contract draws the whole conversation,
       so the cards counted are the ones said AFTER this question was asked */
    const before = await page.evaluate(() => intel.history.length);
    const said = await page.evaluate(() => jmRead('what does clause 7 say about liability?'));
    check('4a the map answers null', said === null, JSON.stringify(said));
    await panelAsk('what does clause 7 say about liability?');
    await until(() => !intel.busy, null, 10000);
    const after = await page.evaluate(n => ({ cards: [...document.querySelectorAll('#igd-feed .jb-turn[data-jb-turn]')].filter(t => Number(t.getAttribute('data-jb-turn')) >= n && t.querySelector('[data-jm-card]')).length, view: state.view, paper: intel.paper && intel.paper.id }), before);
    check('4b no card from the map, and nothing moved', after.cards === 0 && after.view === 'dashboard' && after.paper === 'MK-B2', JSON.stringify(after));

    console.log('\n5 · in Svenska');
    await page.evaluate(() => window.langSet('sv'));
    await page.waitForTimeout(300);
    await onPaper('MK-B2');
    await panelAsk('vilka avtal löper ut snart?');
    const sv = await until(() => state.view === 'dashboard' && !!document.getElementById('ct-place') && regState().view === 'expiring90'
      ? intel.history.filter(m => m.role === 'assistant').slice(-1)[0].text : null);
    const svWant = await page.evaluate(() => i18t('jm_go_expiring'));
    check('5a "vilka avtal löper ut snart?" opens the next 90 days', !!sv);
    check('5b and Jambo says it in Svenska', sv === svWant && /dagar/.test(svWant), JSON.stringify({ sv, svWant }));
    await page.evaluate(() => window.langSet('en'));

    console.log('\n7 · ⌘K');
    const palette = async q => { await page.evaluate(() => { const p = document.getElementById('cmd-palette'); if (p) p.remove(); });
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
      if (!(await until(() => !!document.getElementById('cp-input')))) return null;
      await page.fill('#cp-input', q); await page.waitForTimeout(250);
      return page.evaluate(() => [...document.querySelectorAll('#cp-list [data-cp-i]')].map(b => ({ text: b.innerText.replace(/\s+/g, ' ').trim(), sel: b.getAttribute('aria-selected') === 'true' }))); };
    await toCounter();
    const p1 = await palette('which contracts are expiring soon');
    const want1 = await page.evaluate(() => ({ t: i18t('jm_t_expiring'), s: i18t('jm_s_expiring'), tag: i18t('jm_tag') }));
    check('7a ⌘K: a sentence gives its task as the first row, described and tagged as a task', !!p1 && p1.length > 0 && p1[0].sel && p1[0].text.includes(want1.t) && p1[0].text.includes(want1.s) && p1[0].text.includes(want1.tag), JSON.stringify(p1 && p1.slice(0, 3)));
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(250);
      const fit = await page.evaluate(() => { const l = document.getElementById('cp-list'), b = l && l.querySelector('[data-cp-i]'); if (!b) return null;
        const r = b.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { noScroll: l.scrollWidth <= l.clientWidth + 1, hit: !!el && b.contains(el) }; });
      check(`7b the rows fit ⌘K at ${w}×${hh}, the first one pressable`, !!fit && fit.noScroll && fit.hit, JSON.stringify(fit));
      await page.screenshot({ path: path.join(OUT, `7-command-k-${w}x${hh}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(250);
    await page.press('#cp-input', 'Enter');
    const p1go = await until(() => !document.getElementById('cmd-palette') && state.view === 'dashboard' && !!document.getElementById('ct-place') && regState().view === 'expiring90');
    check('7c Enter opens it: the Contracts place, the next 90 days', !!p1go);
    await toCounter();
    const p2 = await palette('how do I set signing limits');
    /* rows whose TITLE is the signing limits (the "Ask Jambo: …" row only repeats the words typed) */
    const capTitle = await page.evaluate(() => i18t('jm_t_signcap'));
    const twice = (p2 || []).filter(r => r.text.startsWith(capTitle)).length;
    check('7d one row for the signing limits, never two (the map leaves the finder\'s row alone)', twice === 1, JSON.stringify(p2 && p2.slice(0, 4)));
    await page.keyboard.press('Escape');
    check('7e · MK-B2 is on the paper', !!(await onPaper('MK-B2')));
    const n0 = await page.evaluate(() => intel.history.length);
    const p3 = await palette('how do I get them to sign');
    const want3 = await page.evaluate(() => i18t('jm_t_signlink'));
    const row3 = (p3 || []).findIndex(r => r.text.includes(want3));
    check('7f "how do I get them to sign" is a row', row3 >= 0, JSON.stringify(p3 && p3.slice(0, 4)));
    if (row3 >= 0){
      await page.locator('#cp-list [data-cp-i]').nth(row3).click();
      const card = await until(n => { if (document.getElementById('cmd-palette') || intel.history.length < n + 2) return null;
        const m = intel.history[intel.history.length - 1]; return m.act && m.act.kind === 'door' && m.act.door === 'signlink' ? m.act.cid : null; }, n0, 6000);
      check('7g its press is the send-for-signing card beside the paper, waiting for its own press', card === 'MK-B2', String(card));
    }

    console.log('\n8 · the top bar\'s box');
    await toCounter();
    await page.fill('#cmd-search', 'where do I change my language'); await page.waitForTimeout(300);
    await page.press('#cmd-search', 'Enter');
    const tb = await until(() => { const k = document.querySelector('[data-st-you-card="lang"]');
      return state.view === 'team' && settingsTab() === 'you' && k && k.classList.contains('is-landed'); });
    check('8a Enter on "where do I change my language" opens You with Language lit', !!tb);
    const left = await page.evaluate(() => ({ box: document.getElementById('cmd-search').value, query: (regSetScope(null), regState().query) }));
    check('8b the words leave the box and the Contracts list', left.box === '' && !left.query, JSON.stringify(left));
    await page.screenshot({ path: path.join(OUT, '8-top-bar-language-1440x780.png') });
    await toCounter();
    await page.fill('#cmd-search', 'Retail'); await page.waitForTimeout(300);
    await page.press('#cmd-search', 'Enter'); await page.waitForTimeout(400);
    const stay = await page.evaluate(() => ({ view: state.view, place: !!document.getElementById('ct-place'), query: regState().query, n: regFiltered().length }));
    check('8c a contract\'s name stays a search: Enter changes nothing', stay.view === 'dashboard' && stay.place && stay.query === 'Retail' && stay.n > 0, JSON.stringify(stay));
    await page.fill('#cmd-search', ''); await page.evaluate(() => { const R = regState(); R.query = ''; });
    await toCounter();
    await page.fill('#cmd-search', 'how do I get them to sign MK-B2'); await page.waitForTimeout(300);
    const n1 = await page.evaluate(() => intel.history.length);
    await page.press('#cmd-search', 'Enter');
    const tbCard = await until(n => { if (state.view !== 'dashboard' || intel.history.length < n + 2) return null;
      const m = intel.history[intel.history.length - 1]; return m.act && m.act.kind === 'door' ? m.act.door + ':' + m.act.cid : null; }, n1, 6000);
    check('8d an act from the top bar is Jambo\'s card beside the Board, on the contract named', tbCard === 'signlink:MK-B2', String(tbCard));

    console.log('\n9 · Explorer, the 31st task');
    const onExplorer = () => until(() => state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'explorer' && !!document.getElementById('ig-cv'));
    const whereNow = () => page.evaluate(() => JSON.stringify({ view: state.view, face: typeof hbFace === 'function' ? hbFace() : null, canvas: !!document.getElementById('ig-cv') }));
    await toCounter();
    await counterAsk('how are our contracts connected?');
    check('9a the Counter: "how are our contracts connected?" opens Explorer', !!(await onExplorer()), await whereNow());
    await page.screenshot({ path: path.join(OUT, '9a-explorer-1440x780.png') });
    await toCounter();
    const p9 = await palette('a map of all our contracts');
    const want9 = await page.evaluate(() => i18t('jm_t_explorer'));
    const row9 = (p9 || []).findIndex(r => r.text.startsWith(want9));
    check('9b ⌘K: "a map of all our contracts" is a row titled ' + want9, row9 >= 0, JSON.stringify(p9 && p9.slice(0, 4)));
    if (row9 >= 0){
      await page.locator('#cp-list [data-cp-i]').nth(row9).click();
      check('9c its press opens Explorer', !!(await onExplorer()), await whereNow());
    }
    await page.evaluate(() => window.langSet('sv')); await page.waitForTimeout(300);
    await toCounter();
    await counterAsk('visa avtalen på en karta');
    check('9d in Svenska: "visa avtalen på en karta" opens Utforskaren', !!(await onExplorer()), await whereNow());
    await page.evaluate(() => window.langSet('en')); await page.waitForTimeout(300);

    console.log('\n6 · the page');
    check('6 nothing threw', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all passed'} · shots in ${OUT}`);
  process.exit(failures ? 1 : 0);
})();
