/* EVERY JAMBO BOX CARRIES THE HINT LINE (the owner's answer (2) during the
   build, 18 Oct 2026, "Every Jambo box": "Typing never signs, sends or files —
   a press does." under EVERY Jambo ask box on a computer, through the one
   shared builder, jamboHintHtml), and the keys Home's line names (igHintKeys,
   the checker against rounds 3, 7 and 12)

   WHAT THIS PINS, in a real browser, at the owner's three screens:
     1 the NINE boxes, each with the line right under it, in view, nothing
       sideways: Home's panel, Settings' Jambo side, Import's panel, Jambo's
       panel beside a list (Negotiations), the Counter's box, the floating
       Jambo window (opened from the bar's door on a page with no Jambo of its
       own — the Brain), the clause editor's ask, and (pass 4) the Calendar's
       Jambo box and the template builder's
     2 HOME'S KEYS, one reading: "/ places · Esc closes" with a contract up as a
       page and on its History (rounds 7, 12) and on a paper (round 6); "/
       lists the places." on Jambo's tab beside a paper while Needs you here
       has rows (round 3); the sentence alone on Before you sign (round 10) and
       the Board
     3 the phone: the floating window draws no line (the phone stays untouched)
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
const LINE = 'Typing never signs, sends or files — a press does.';
const PLACES = LINE + ' / places · Esc closes';
const LISTS = LINE + ' / lists the places.';

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

    /* the line under one box: its words, under the box, in view, nothing sideways */
    const LINE_OF = ({ hint, box }) => {
      const e = document.querySelector(hint), b = document.querySelector(box);
      if (!e || !e.getClientRects().length || !b) return null;
      const er = e.getBoundingClientRect(), br = b.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(er.left + 4), Math.round(er.top + er.height / 2));
      return { t: e.textContent.replace(/\s+/g, ' ').trim(), under: er.top >= br.bottom - 1 && er.top - br.bottom <= 24,
        inView: er.top >= 0 && er.bottom <= innerHeight + 1, painted: !!hit && (hit === e || e.contains(hit)),
        side: document.documentElement.scrollWidth <= innerWidth + 1, gap: Math.round(er.top - br.bottom) };
    };
    const ok = (L, want) => !!L && L.t === want && L.under && L.inView && L.painted && L.side;

    /* PASS 4: a draft template of the workspace's own, through the product's own route, so the builder has one to open */
    const tbIds = await page.evaluate(async () => {
      try { const d = await api('templates', 'POST', { name: 'Reseller agreement', category: 'procurement', folder: 'dist', description: '' });
        const t = await api('templates/' + d.template.id); return { tid: d.template.id, vid: t.versions[0].id }; } catch (e) { return { err: String(e && e.message || e) }; } });

    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      const at = `${w}×${ht}`, tag = `${w}x${ht}`;

      /* ---- 1 the seven boxes ---- */
      await part('1a the Counter', async () => {
        await page.evaluate(() => setView('counter'));
        const L = await until(LINE_OF, { hint: '#cn-page .cn-ask > .jb-hint', box: '#cn-page .cn-box' });
        check(`1a ${at} the Counter's box: the line right under it`, ok(L, LINE), JSON.stringify(L));
        await shot(`hint-counter-${tag}.png`);
      });
      await part('1b the floating window', async () => {
        await page.evaluate(() => setView('brain'));
        await until(() => state.view === 'brain' ? true : null);
        await page.click('#cmd-ai');
        const L = await until(LINE_OF, { hint: '#ai-panel.open #ai-hint .jb-hint', box: '#ai-input' });
        check(`1b ${at} the floating Jambo window (the bar's door on the Brain): the line under its box`, ok(L, LINE), JSON.stringify(L));
        await shot(`hint-window-${tag}.png`);
        await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });
      });
      await part('1c the clause editor', async () => {
        await page.evaluate(() => openRedlineWorkbench('MK-A2', { face: true }));
        await until(() => document.getElementById('pd-redface') ? true : null, null, 8000);
        await page.evaluate(() => { const c = getContract('MK-A2'); const cl = negoClauseList(c); rlOpenClauseEditor(c, cl[1] ? cl[1].clauseId : cl[0].clauseId, {}); });
        const L = await until(LINE_OF, { hint: '#ce-askrow + .jb-hint', box: '#ce-askrow .ce-askbox' }, 10000);
        check(`1c ${at} the clause editor's ask: the line under it`, ok(L, LINE), JSON.stringify(L));
        await shot(`hint-clause-editor-${tag}.png`);
        await page.evaluate(() => { try { if (typeof rlCloseClauseEditor === 'function') rlCloseClauseEditor({ force: true }); } catch (_) {} });
        await until(() => !document.querySelector('#ce-askrow') ? true : null, null, 4000);
      });
      await part('1d Jambo\'s panel beside a list', async () => {
        await page.evaluate(() => openNegotiations({ list: true }));
        const L = await until(LINE_OF, { hint: '#ins-panel.is-jambo .jl-foot .jb-hint', box: '#ins-panel .jl-box' }, 10000);
        check(`1d ${at} Jambo's panel beside Negotiations: the line under its box`, ok(L, LINE), JSON.stringify(L));
      });
      await part('1e Settings', async () => {
        await page.evaluate(() => setView('team'));
        /* the page re-measures its side once its entrance has settled (stSideFit): wait for that, bounded */
        await until(() => { const sd = document.getElementById('st-side'); return sd && document.querySelector('#st-side .jb-hint') && sd.getBoundingClientRect().bottom <= innerHeight + 1; }, null, 4000);
        const L = await until(LINE_OF, { hint: '#st-side .jb-hint, .st-side .jb-hint', box: '#st-jb-q' }, 10000);
        check(`1e ${at} Settings' Jambo side: the line under its box`, !!L && L.t === LINE && L.inView && L.side, JSON.stringify(L));
      });
      await part('1f Import', async () => {
        await page.evaluate(() => setView('migration'));
        const L = await until(LINE_OF, { hint: '#mig-side .jl-foot .jb-hint', box: '#mig-side .jl-box' }, 10000);
        check(`1f ${at} Import's panel: the line under its box`, ok(L, LINE), JSON.stringify(L));
      });
      /* PASS 4 (the checker's second pass): the Calendar's Jambo box and the template builder's */
      await part('1g the Calendar', async () => {
        await page.evaluate(() => { if (typeof hbOpenCalendar === 'function') hbOpenCalendar(); else setView('calendar'); });
        const L = await until(sel => { const e = document.querySelector(sel.hint), b = document.querySelector(sel.box); if (!e || !b || !e.getClientRects().length) return null;
          const er = e.getBoundingClientRect(), br = b.getBoundingClientRect();
          return { t: e.textContent.replace(/\s+/g, ' ').trim(), under: er.top >= br.bottom, inView: er.bottom <= innerHeight + 1, last: e === e.parentElement.lastElementChild,
            side: document.documentElement.scrollWidth <= innerWidth + 1 }; }, { hint: '#cal-plan .jb-hint', box: '#cal-plan-in' }, 10000);
        check(`1g ${at} the Calendar's Jambo box (round 16): the line under it, the card's last line`, !!L && L.t === LINE && L.under && L.inView && L.last && L.side, JSON.stringify(L));
        await shot(`r16-hint-calendar-${tag}.png`);
      });
      await part('1h the template builder', async () => {
        if (!tbIds || !tbIds.tid){ check(`1h ${at} a template for the builder`, false, JSON.stringify(tbIds)); return; }
        /* from the builder's own page, settled, so nothing the Calendar still draws can land over it */
        await page.evaluate(() => setView('templates'));
        await until(() => state.view === 'templates' ? true : null, null, 6000); await page.waitForTimeout(500);
        await page.evaluate(ids => openTemplateBuilder(ids.tid, ids.vid), tbIds);
        await until(() => document.getElementById('tb-askrow') ? true : null, null, 10000); await page.waitForTimeout(500);
        const L = await until(LINE_OF, { hint: '#tb-askrow + .jb-hint', box: '#tb-ask' }, 10000);
        check(`1h ${at} the template builder's Jambo box (round 21): the line under it`, ok(L, LINE), JSON.stringify(L));
        await shot(`r21-hint-builder-${tag}.png`);
        await page.evaluate(() => { try { tbLeave(() => setView('dashboard')); } catch (_) { setView('dashboard'); } });
        await until(() => !document.getElementById('tb-askrow') ? true : null, null, 4000);
      });

      /* ---- 2 Home's keys, one reading ---- */
      const HOME = { hint: '#ig-dock .jb-hint', box: '#igd-input' };
      await part('2a a contract brought up as a page, and its History', async () => {
        await page.evaluate(() => setView('dashboard'));
        await page.evaluate(() => hbStripBring('MK-A2'));
        const L = await until(sel => { const e = document.querySelector(sel.hint); const s = document.querySelector('.bs-strip, [data-bs-strip]');
          return e && e.getClientRects().length && /places/.test(e.textContent) ? { t: e.textContent.replace(/\s+/g, ' ').trim(), card: !!(window.bsCardId && bsCardId()), strip: !!s } : null; }, HOME, 10000);
        check(`2a ${at} a contract up as a page (round 7): "/ places · Esc closes"`, !!L && L.t === PLACES && L.card, JSON.stringify(L));
        await shot(`hint-home-page-${tag}.png`);
        await page.evaluate(() => hbStripBring('MK-A2', 'hist'));
        const L2 = await until(sel => { const e = document.querySelector(sel.hint); return e && e.getClientRects().length ? { t: e.textContent.replace(/\s+/g, ' ').trim(), card: !!(window.bsCardId && bsCardId()) } : null; }, HOME, 10000);
        check(`2b ${at} its History (round 12): "/ places · Esc closes"`, !!L2 && L2.t === PLACES && L2.card, JSON.stringify(L2));
        await shot(`hint-home-history-${tag}.png`);
      });
      await part('2c a paper beside Jambo\'s tab', async () => {
        /* a paper whose Needs you here is empty, and one where it has rows */
        const quiet = await page.evaluate(() => { const c = (state.contracts || []).find(x => x.id !== 'MK-A2' && !x.archived && typeof pdNeedsRows === 'function' && !(pdNeedsRows(x) || []).length);
          return c ? c.id : null; });
        if (quiet) {
          await page.evaluate(id => regOpenContract(id), quiet);
          const L = await until(([sel, id]) => { const e = document.querySelector(sel.hint); return e && window.pdContract && pdContract() && pdContract().id === id && !document.getElementById('pd-needs')
            ? { t: e.textContent.replace(/\s+/g, ' ').trim(), keys: igHintKeys() } : null; }, [HOME, quiet], 10000);
          check(`2c ${at} a paper, Jambo's tab, nothing in Needs you here (round 6): "/ places · Esc closes"`, !!L && L.t === PLACES, JSON.stringify(L));
        } else check(`2c ${at} a paper with nothing owed exists in the seed`, false, await page.evaluate(() => (state.contracts || []).map(x => x.id + ':' + (pdNeedsRows(x) || []).map(r => (r.it && r.it.kind) || r.k || '?').join('+')).join(' ')));
        await page.evaluate(() => regOpenContract('MK-NY1'));
        const L2 = await until(sel => { const e = document.querySelector(sel.hint); return e && document.getElementById('pd-needs') ? { t: e.textContent.replace(/\s+/g, ' ').trim(), rows: document.querySelectorAll('#pd-needs .pd-nd-row').length } : null; }, HOME, 10000);
        check(`2d ${at} Jambo's tab beside a paper with Needs you here (round 3): "/ lists the places."`, !!L2 && L2.t === LISTS && L2.rows > 0, JSON.stringify(L2));
        const L3 = await page.evaluate(LINE_OF, HOME);
        check(`2e ${at} Home's line under its box, in view, nothing sideways`, !!L3 && L3.under && L3.inView && L3.side, JSON.stringify(L3));
        await shot(`hint-home-needs-${tag}.png`);
      });
      await part('2f Before you sign and the Board', async () => {
        await page.evaluate(() => { regOpenContract('MK-A2'); });
        await until(() => window.pdContract && pdContract() && pdContract().id === 'MK-A2' ? true : null, null, 8000);
        await page.evaluate(() => { if (typeof pdSignOpen === 'function') pdSignOpen('MK-A2'); });
        const L = await until(sel => { const e = document.querySelector(sel.hint); return e && window.pdSignShows && pdSignShows() ? { t: e.textContent.replace(/\s+/g, ' ').trim() } : null; }, HOME, 10000);
        check(`2f ${at} Before you sign (round 10): the sentence alone`, !!L && L.t === LINE, JSON.stringify(L));
        await page.evaluate(() => { if (typeof hbSetFace === 'function') hbSetFace('board'); });
        const L2 = await until(sel => { const e = document.querySelector(sel.hint); return e && !(window.bsCardId && bsCardId()) && !(window.igPaperUp && igPaperUp()) && !(window.pdOnPaper && pdOnPaper())
          ? { t: e.textContent.replace(/\s+/g, ' ').trim() } : null; }, HOME, 10000);
        check(`2g ${at} the Board (round 17): the sentence alone`, !!L2 && L2.t === LINE, JSON.stringify(L2));
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
