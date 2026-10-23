/* RE-POINTED 20 Oct 2026 (owner picked "Two-row card" for every Jambo box): each box is measured as its card (.jb-card), the words and the control row under them */
/* NO HINT LINE UNDER ANY JAMBO BOX (RE-POINTED 20 Oct 2026: the owner picked
   the "Chambers" design by name, which draws no line under a Jambo box; the
   shared builder jamboHintHtml, Home's keys igHintKeys / igHintPaint and the
   window's aiHintPaint are DELETED, and the jb_hint* words stay inert in both
   books). This file used to pin the line ("Typing never signs, sends or files
   — a press does.") under EVERY box (the owner's answer (2) during the build,
   18 Oct 2026, "Every Jambo box") and the keys Home's line named (rounds 3, 6,
   7, 10, 12, 17); its claims are turned into ABSENCE checks, asked of the same
   boxes in the same states, so a line that crept back under any one of them
   is caught.

   WHAT THIS PINS, in a real browser, at the owner's three screens:
     1 the NINE boxes, each drawn, in view, nothing sideways, and NO line under
       it: Home's panel, Settings' Jambo side, Import's panel, Jambo's panel
       beside a list (Negotiations), the Counter's box, the floating Jambo
       window (opened from the bar's door on a page with no Jambo of its own —
       the Brain), the clause editor's ask, the Calendar's Jambo box and the
       template builder's
     2 HOME'S PANEL in every state the keys used to change with — a contract
       up as a page and its History, a paper with and without rows still
       owed, Before you sign and the Board — draws no line and no keys
     3 the phone: the floating window draws no line (the phone stays untouched)
   and in 1 and 2, every EMPTY box stands one line tall whatever its hint
   (owner, 22 Oct 2026)
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/every-jambo-box-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/every-jambo-box-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
/* the sentence the line used to say, looked for as WORDS too, so a line drawn
   under some other class is still caught */
const LINE = 'Typing never signs, sends or files';
const HINT_SEL = '.jb-hint, .jb-keys, .jb-kbd, .ai-hint, #ai-hint, [data-jb-hint]';

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  /* an approval asked of the reader, so Jambo's tab beside its paper has Needs you here rows (round 3) */
  const admin = (await W.admin.json('/api/bootstrap')).me;
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Over 60 M',
    cond: { type: 'value', op: '>=', value: 60000000 }, approver: { kind: 'member', id: admin.id, name: admin.name } }] } });
  await W.admin.json('/api/contracts/MK-NY1', { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
    H.fixtureContract('MK-NY1', 'Helio power purchase', 'Helio Energy AB', H.FOLDER_A, 70000000, 'Draft'), { owner: { id: W.users.unrestricted.id, name: 'Jonas Berg' } }) } });
  { const c = await W.admin.json('/api/contracts/MK-NY1'); const v = c._v; delete c._v; c.status = 'Under Review';
    await W.admin.raw('/api/contracts/MK-NY1', { method: 'PUT', body: { contract: c, baseVersion: v } }); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && typeof getContract === 'function' && getContract('MK-A2') && getContract('MK-NY1') ? true : null, null, 20000);
    await page.waitForTimeout(600);
    await page.keyboard.press('Escape').catch(() => {});
    /* a negotiation with their asks on the table: our move, Needs you here has rows */
    await page.evaluate(async () => {
      const c = getContract('MK-A2'); if (!c) throw new Error('MK-A2 is not loaded'); if (c._light) await ensureFull(c); negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId, '<p>Payment falls due within sixty (60) days.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-60' });
      persist(c);
    });

    /* one box: drawn, in view, nothing sideways — and NO line under it, by
       class or by its words, anywhere in the box's host */
    const NO_LINE_OF = ({ box, host, sel, line }) => {
      const b = document.querySelector(box);
      if (!b || !b.getClientRects().length) return null;
      /* no host named: the box's grandparent, so a line drawn as the box's
         wrapper's sibling (where the clause editor's sat) is inside it */
      const hs = host ? document.querySelector(host) : null, h = hs || (b.parentElement && b.parentElement.parentElement) || document.body;
      const br = b.getBoundingClientRect();
      const drawn = [...h.querySelectorAll(sel)].filter(e => e.getClientRects().length && e.getBoundingClientRect().height > 0);
      /* AN EMPTY BOX IS ONE LINE (owner, 22 Oct 2026): given a hint far too
         long for its line, the empty box keeps one line's height — the hint
         is never measured (red at 2a39d1b: the hint's wrapped lines stood it
         two and more lines tall in a narrow panel) */
      const t = b.matches('textarea') ? b : b.querySelector('textarea');
      let oneLine = null;
      if (t && !t.value && typeof jamboCardGrow === 'function'){
        const ph = t.placeholder, cs = getComputedStyle(t);
        const one = (parseFloat(cs.lineHeight) || 21) + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        t.placeholder = 'Ask about this contract, a number, a list, a person, a date or anything else you would like to know today';
        jamboCardGrow(t);
        const th = t.getBoundingClientRect().height, card = t.closest('.jb-card');
        oneLine = { h: Math.round(th), one: Math.round(one), tall: !!(card && card.classList.contains('is-tall')) };
        oneLine.ok = th <= Math.max(one, parseFloat(cs.minHeight) || 0) + 1.5 && !oneLine.tall;
        t.placeholder = ph; jamboCardGrow(t);
      }
      return { lines: drawn.length, words: (h.textContent || '').includes(line), oneLine,
        inView: br.top >= 0 && br.bottom <= innerHeight + 1, side: document.documentElement.scrollWidth <= innerWidth + 1 };
    };
    const ARG = (box, host) => ({ box, host, sel: HINT_SEL, line: LINE });
    const ok = L => !!L && L.lines === 0 && !L.words && L.inView && L.side && (!L.oneLine || L.oneLine.ok);

    /* the builders of the line and its keys are gone, not merely uncalled */
    const gone = await page.evaluate(() => ['jamboHintHtml', 'igHintKeys', 'igHintPaint', 'aiHintPaint'].filter(n => typeof window[n] === 'function'));
    check('0 the line\'s builders are gone (jamboHintHtml, igHintKeys, igHintPaint, aiHintPaint)', gone.length === 0, JSON.stringify(gone));

    /* PASS 4: a draft template of the workspace's own, through the product's own route, so the builder has one to open */
    const tbIds = await page.evaluate(async () => {
      try { const d = await api('templates', 'POST', { name: 'Reseller agreement', category: 'procurement', folder: 'dist', description: '' });
        const t = await api('templates/' + d.template.id); return { tid: d.template.id, vid: t.versions[0].id }; } catch (e) { return { err: String(e && e.message || e) }; } });

    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      const at = `${w}×${ht}`, tag = `${w}x${ht}`;

      /* ---- 1 the nine boxes, no line under any ---- */
      await part('1a the Counter', async () => {
        await page.evaluate(() => setView('counter'));
        const L = await until(NO_LINE_OF, ARG('#cn-page .jb-card', '#cn-page'));
        check(`1a ${at} the Counter's box: drawn, and no line under it`, ok(L), JSON.stringify(L));
        await shot(`no-hint-counter-${tag}.png`);
      });
      /* RE-POINTED 21 Oct 2026 (owner): the edge tab's side panel, and the bar's ✦ opens the
         floating chat window ("The old chat window"; the one-line ask bar is gone) — one box, the
         same #ai-panel, drawn two ways, both asked */
      await part('1b the side panel and the chat window', async () => {
        await page.evaluate(() => setView('brain'));
        await until(() => state.view === 'brain' ? true : null);
        await page.evaluate(() => openAI());
        const L = await until(NO_LINE_OF, ARG('#ai-panel.open .jb-card', '#ai-panel'));
        check(`1b ${at} Jambo's side panel (on the Brain): no line under its box`, ok(L), JSON.stringify(L));
        await shot(`no-hint-window-${tag}.png`);
        await page.click('#cmd-ai');
        const B = await until(NO_LINE_OF, ARG('#ai-panel.open.floating .jb-card', '#ai-panel'));
        check(`1b ${at} the ✦ chat window: no line under its box`, ok(B), JSON.stringify(B));
        await page.keyboard.press('Escape');
        await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });
      });
      await part('1c the clause editor', async () => {
        await page.evaluate(() => openRedlineWorkbench('MK-A2', { face: true }));
        await until(() => document.getElementById('pd-redface') ? true : null, null, 8000);
        await page.evaluate(() => { const c = getContract('MK-A2'); const cl = negoClauseList(c); rlOpenClauseEditor(c, cl[1] ? cl[1].clauseId : cl[0].clauseId, {}); });
        const L = await until(NO_LINE_OF, ARG('#ce-askrow', null), 10000);
        check(`1c ${at} the clause editor's ask: no line under it`, ok(L), JSON.stringify(L));
        await shot(`no-hint-clause-editor-${tag}.png`);
        await page.evaluate(() => { try { if (typeof rlCloseClauseEditor === 'function') rlCloseClauseEditor({ force: true }); } catch (_) {} });
        await until(() => !document.querySelector('#ce-askrow') ? true : null, null, 4000);
      });
      await part('1d Jambo\'s panel beside a list', async () => {
        await page.evaluate(() => openNegotiations({ list: true }));
        const L = await until(NO_LINE_OF, ARG('#ins-panel.is-jambo .jb-card', '#ins-panel'), 10000);
        check(`1d ${at} Jambo's panel beside Negotiations: no line under its box`, ok(L), JSON.stringify(L));
      });
      await part('1e Settings', async () => {
        await page.evaluate(() => setView('team'));
        /* the page re-measures its side once its entrance has settled (stSideFit): wait for that, bounded */
        await until(() => { const sd = document.getElementById('st-side'); return sd && document.querySelector('#st-jb-form .jb-card') && sd.getBoundingClientRect().bottom <= innerHeight + 1; }, null, 4000);
        const L = await until(NO_LINE_OF, ARG('#st-jb-form .jb-card', '#st-side'), 10000);
        check(`1e ${at} Settings' Jambo side: no line under its box`, ok(L), JSON.stringify(L));
      });
      await part('1f Import', async () => {
        await page.evaluate(() => setView('migration'));
        const L = await until(NO_LINE_OF, ARG('#mig-side .jb-card', '#mig-side'), 10000);
        check(`1f ${at} Import's panel: no line under its box`, ok(L), JSON.stringify(L));
      });
      /* PASS 4 (the checker's second pass): the Calendar's Jambo box and the template builder's */
      await part('1g the Calendar', async () => {
        await page.evaluate(() => { if (typeof hbOpenCalendar === 'function') hbOpenCalendar(); else setView('calendar'); });
        const L = await until(NO_LINE_OF, ARG('#cal-plan .jb-card', '#cal-plan'), 10000);
        check(`1g ${at} the Calendar's Jambo box (round 16): no line under it`, ok(L), JSON.stringify(L));
        await shot(`r16-no-hint-calendar-${tag}.png`);
      });
      await part('1h the template builder', async () => {
        if (!tbIds || !tbIds.tid){ check(`1h ${at} a template for the builder`, false, JSON.stringify(tbIds)); return; }
        /* from the builder's own page, settled, so nothing the Calendar still draws can land over it */
        await page.evaluate(() => setView('templates'));
        await until(() => state.view === 'templates' ? true : null, null, 6000); await page.waitForTimeout(500);
        await page.evaluate(ids => openTemplateBuilder(ids.tid, ids.vid), tbIds);
        await until(() => document.getElementById('tb-askrow') ? true : null, null, 10000); await page.waitForTimeout(500);
        const L = await until(NO_LINE_OF, ARG('#tb-askrow', null), 10000);
        check(`1h ${at} the template builder's Jambo box (round 21): no line under it`, ok(L), JSON.stringify(L));
        await shot(`r21-no-hint-builder-${tag}.png`);
        await page.evaluate(() => { try { tbLeave(() => setView('dashboard')); } catch (_) { setView('dashboard'); } });
        await until(() => !document.getElementById('tb-askrow') ? true : null, null, 4000);
      });

      /* ---- 2 Home's panel: no line and no keys, in every state the keys
         used to change with (rounds 3, 6, 7, 10, 12, 17) ---- */
      const HOME = ARG('#ig-dock .jb-card', '#ig-dock');
      /* the state each reading waits for, named (no code is sent as a string) */
      const homeWhen = (cond, arg, ms = 10000) => until(([sel, k, a2]) => {
        const W = { card: () => !!(window.bsCardId && bsCardId()),
          paper: id => !!(window.pdContract && pdContract() && pdContract().id === id),
          owed: id => !!(window.pdContract && pdContract() && pdContract().id === id && document.getElementById('pd-needs')),
          sign: () => !!(window.pdSignShows && pdSignShows()),
          board: () => !(window.bsCardId && bsCardId()) && !(window.igPaperUp && igPaperUp()) && !(window.pdOnPaper && pdOnPaper()) };
        if (!W[k] || !W[k](a2)) return null;
        const b = document.querySelector(sel.box); if (!b || !b.getClientRects().length) return null;
        const h = document.querySelector(sel.host) || document.body, br = b.getBoundingClientRect();
        const drawn = [...h.querySelectorAll(sel.sel)].filter(e => e.getClientRects().length && e.getBoundingClientRect().height > 0);
        return { lines: drawn.length, words: (h.textContent || '').includes(sel.line),
          inView: br.top >= 0 && br.bottom <= innerHeight + 1, side: document.documentElement.scrollWidth <= innerWidth + 1,
          /* the rows Still owed draws (a ticked-off row is not owed), so "with rows" is measured, not assumed */
          owed: document.querySelectorAll('#ig-dock #pd-needs .pd-gl-row:not(.is-done)').length };
      }, [HOME, cond, arg], ms);
      await part('2a a contract brought up as a page, and its History', async () => {
        await page.evaluate(() => setView('dashboard'));
        await page.evaluate(() => hbStripBring('MK-A2'));
        const L = await homeWhen('card');
        check(`2a ${at} a contract up as a page (round 7): no line and no keys under Home's box`, ok(L), JSON.stringify(L));
        await shot(`no-hint-home-page-${tag}.png`);
        await page.evaluate(() => hbStripBring('MK-A2', 'hist'));
        const L2 = await homeWhen('card');
        check(`2b ${at} its History (round 12): no line and no keys`, ok(L2), JSON.stringify(L2));
        await shot(`no-hint-home-history-${tag}.png`);
      });
      await part('2c a paper beside Jambo\'s tab', async () => {
        /* a paper with nothing still owed, and one with rows (the keys used to differ between them) */
        const quiet = await page.evaluate(() => { const c = (state.contracts || []).find(x => x.id !== 'MK-A2' && !x.archived && typeof pdNeedsRows === 'function' && !(pdNeedsRows(x) || []).length);
          return c ? c.id : null; });
        if (quiet) {
          await page.evaluate(id => regOpenContract(id), quiet);
          const L = await homeWhen('paper', quiet);
          check(`2c ${at} a paper with nothing owed, Jambo's tab (round 6): no line and no keys`, ok(L) && L.owed === 0, JSON.stringify(L));
        } else check(`2c ${at} a paper with nothing owed exists in the seed`, false, await page.evaluate(() => (state.contracts || []).map(x => x.id + ':' + (pdNeedsRows(x) || []).map(r => (r.it && r.it.kind) || r.k || '?').join('+')).join(' ')));
        await page.evaluate(() => regOpenContract('MK-NY1'));
        const L2 = await homeWhen('owed', 'MK-NY1');
        check(`2d ${at} Jambo's tab beside a paper with rows still owed (round 3): no line and no keys`, ok(L2) && L2.owed > 0, JSON.stringify(L2));
        const L3 = await page.evaluate(NO_LINE_OF, HOME);
        check(`2e ${at} Home's box in view, nothing sideways, nothing under it`, ok(L3), JSON.stringify(L3));
        await shot(`no-hint-home-needs-${tag}.png`);
      });
      await part('2f Before you sign and the Board', async () => {
        await page.evaluate(() => { regOpenContract('MK-A2'); });
        await until(() => window.pdContract && pdContract() && pdContract().id === 'MK-A2' ? true : null, null, 8000);
        await page.evaluate(() => { if (typeof pdSignOpen === 'function') pdSignOpen('MK-A2'); });
        const L = await homeWhen('sign');
        check(`2f ${at} Before you sign (round 10): no line`, ok(L), JSON.stringify(L));
        await page.evaluate(() => { if (typeof hbSetFace === 'function') hbSetFace('board'); });
        const L2 = await homeWhen('board');
        check(`2g ${at} the Board (round 17): no line`, ok(L2), JSON.stringify(L2));
      });
    }

    /* ---- 3 the phone: the window draws no line ---- */
    await part('3 the phone', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      await page.evaluate(() => { if (typeof openAI === 'function') openAI(); });
      const P = await until(() => { const p = document.getElementById('ai-panel'); const e = document.querySelector('#ai-hint');
        return p && p.classList.contains('open') ? { shown: !!(e && e.getClientRects().length && e.getBoundingClientRect().height > 0) } : null; });
      check('3 the phone: the floating window draws no hint line', !!P && !P.shown, JSON.stringify(P));
    });
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
