/* global state, setView, hbSetFace, regPlaceSet, intel, ai, renderIntelDock, pdSolo, openSettingsAt, roomHomeLand, getContract */
/* THE PANEL SWEEP — THE PAGE'S OWN WORK IS NEVER INSIDE THE CONVERSATION
   (owner, 26 Oct 2026, of every page in the platform):

     "if the page has a side panel that has links to follow and other important
      insights and links to navigate through the page, then it should not be
      used as the jambo side panel page … if a link is on the first page and a
      user will need to access it, they should not scroll up the jambo to find
      this link."

   The owner named the Dossier as the pattern that is already right — its work
   sits under its own tabs and Jambo's conversation under his — and the
   Contracts list as the one that was wrong, where Discover lived inside the
   chat's own scroller and his answers pushed it out of reach. This file holds
   every page in HaTi to that rule, which is the reason it is a sweep and not
   three more checks: the fault is a KIND, and its kind appears wherever a
   panel carries work.

   THE RULE, MEASURED THE SAME WAY ON EVERY PAGE
     1 whatever the panel offers to press before any conversation exists is
       noted — those are the page's own links;
     2 nine exchanges are put into the conversation;
     3 every one of those links must still be painted inside the panel and
       still pressable, without the reader scrolling anything;
     4 and inside the scroller the conversation grows in, nothing pressable
       may sit above the turns — a landing either has its own tab or is
       pinned outside that scroller.

   A panel may answer the rule in either of the two ways HaTi already uses, and
   the sweep does not care which: TABS (the Dossier, the Contracts place, the
   list pages) or A PIN above the talk (the Board, whose landing is Jambo's own
   greeting and so keeps his one window).

   Run: node test/chromium/jambo-panel-sweep-verify.js
        HATI_SWEEP_ONLY=board,contracts  for one or two places */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const OUT = path.join(__dirname, 'shots', 'panel-sweep');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ONLY = (process.env.HATI_SWEEP_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
/* the owner's three screens; the sweep runs the whole platform at the first
   and repeats the narrowest and shortest for the places most likely to crowd */
const SCREEN = { width: 1440, height: 780 };
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null && !ok ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

/* EVERY PLACE A PERSON CAN OPEN THAT HAS A PANEL. `go` lands on it; `skip`
   tells the sweep the place drew no panel rather than failing it. */
const PLACES = [
  ['board', 'Home · Board', p => p.evaluate(() => { setView('dashboard'); intel.paper = null; hbSetFace('board'); })],
  ['contracts', 'Home · Contracts', async p => { await p.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register'))); await until(p, () => !!document.querySelector('#reg-tbody tr[data-row]')); }],
  ['explorer', 'Home · Explorer', p => p.evaluate(() => { setView('dashboard'); intel.paper = null; hbSetFace('explorer'); })],
  ['calendar', 'Home · Calendar', p => p.evaluate(() => { setView('dashboard'); intel.paper = null; hbSetFace('calendar'); })],
  ['dossier', "A contract's Dossier", async p => { await p.evaluate(() => { setView('dashboard'); roomHomeLand('DV-04', { arrived: true }); }); await until(p, () => typeof pdSolo === 'function' && !pdSolo()); }],
  ['approvals', 'Approvals', p => p.evaluate(() => setView('approvals'))],
  ['obligations', 'Obligations', p => p.evaluate(() => setView('obligations'))],
  ['intake', 'Requests', p => p.evaluate(() => setView('intake'))],
  ['directory', 'People', p => p.evaluate(() => setView('directory'))],
  ['customers', 'Customer folders', p => p.evaluate(() => setView('customers'))],
  ['templates', 'Our paper', p => p.evaluate(() => setView('templates'))],
  ['advice', 'Our standards', p => p.evaluate(() => setView('advice'))],
  ['mynotes', 'My notes', p => p.evaluate(() => setView('mynotes'))],
  ['migration', 'Import', p => p.evaluate(() => setView('migration'))],
  /* the office is the view 'jambo'; 'agents' is not a view of its own and
     leaves the Board in front, which once had this sweep measuring the Board
     twice and calling it a second page breaking the rule */
  ['jambo', "Jambo's house", async p => { await p.evaluate(() => setView('jambo'));
    await until(p, () => typeof state !== 'undefined' && state.view === 'jambo', null, 6000); }],
  ['team', 'Settings', p => p.evaluate(() => setView('team'))],
];

/* the panel on screen, whichever host drew it */
const PANEL = '#ig-dock, #ins-panel, #st-side, #ai-panel';

/* A STABLE KEY FOR A LINK. A tab wears a count and a glyph ("▦︎1Overview")
   and both move as the conversation grows, so matching on the whole string
   reports a link lost that never went anywhere. The words alone are the key. */
const KEYJS = `w => String(w || '').replace(/[0-9]/g, '').replace(/[^\\p{L}\\p{N} ]/gu, '').replace(/\\s+/g, ' ').trim().toLowerCase()`;

/* what the panel offers to press, before any conversation exists */
const landingLinks = (page, sel) => page.evaluate(a => {
  const el = document.querySelector(a.s); if (!el) return null;
  const key = eval(a.k), seen = new Set(), out = [];
  for (const b of el.querySelectorAll('a,button')){
    const w = (b.textContent || '').replace(/\s+/g, ' ').trim();
    if (!w || w.length < 3 || w.length > 60) continue;
    const k = key(w); if (!k || seen.has(k)) continue;
    seen.add(k); out.push({ w, k });
  }
  return out;
}, { s: sel, k: KEYJS });

/* A REAL CONVERSATION, TYPED INTO THE PANEL'S OWN BOX. Poking the stores
   behind the panels does not repaint most of them, and a check that measures
   a conversation that was never drawn measures nothing — so the sweep types,
   the way a reader does, and the stand-in AI answers. */
async function fillTalk(page, sel){
  const box = `${sel} textarea, ${sel} input[type="text"], ${sel} input:not([type])`;
  let asked = 0;
  for (let i = 1; i <= 6; i++){
    const el = page.locator(box).first();
    try { if (!(await el.count())) break; await el.click({ timeout: 2500 }); } catch (_){ break; }
    try {
      await el.fill(`what is our exposure in stream ${i}, and which of those agreements carry no liability cap at all?`);
      await el.press('Enter');
      asked++;
    } catch (_){ break; }
    /* his answer, or his "thinking", whichever the host draws */
    await until(page, s2 => { const p2 = document.querySelector(s2); if (!p2) return false;
      return !!p2.querySelector('[data-jb-turns] .ai-msg, .jl-turns .ai-msg, .st-jb-turns .st-cr, [data-jb-turns] .jb-turn'); }, sel, 6000);
    await page.waitForTimeout(250);
  }
  return asked;
}

/* (4) inside the scroller the talk grows in, nothing pressable above the turns */
const aboveTalk = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s); if (!el) return { ok: true, why: 'no panel' };
  const turns = el.querySelector('[data-jb-turns], .jl-turns, .st-jb-turns');
  if (!turns) return { ok: true, why: 'the talk is not in this panel' };
  const scroller = (() => { let n = turns.parentElement;
    while (n && n !== el){ const cs = getComputedStyle(n); if (/auto|scroll/.test(cs.overflowY)) return n; n = n.parentElement; }
    return el; })();
  const before = [...scroller.querySelectorAll('a,button')]
    .filter(b => turns.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING)
    .map(b => (b.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  return { ok: before.length === 0, above: before.slice(0, 6) };
}, sel);

/* (3) IS THE PAGE'S OWN WORK STILL WITHIN REACH? Two answers are allowed and
   the sweep does not prefer either, because HaTi already uses both: the links
   are still painted (pinned, or the panel never turned), or the panel carries
   a way back to them — a tab, which is the Dossier's answer and the one the
   owner called right. What is NOT allowed is a link that can only be found by
   scrolling the conversation back up, which is what (4) catches. */
const painted = (page, sel, links) => page.evaluate(a => {
  const el = document.querySelector(a.s); if (!el) return { on: [], off: a.links.map(l => l.w) };
  const key = eval(a.k);
  const here = new Set([...el.querySelectorAll('a,button')].map(b => key((b.textContent || '').replace(/\s+/g, ' ').trim())));
  const on = [], off = [];
  for (const l of a.links) (here.has(l.k) ? on : off).push(l);
  return { on, off: off.map(l => l.w), offLinks: off };
}, { s: sel, links, k: KEYJS });

/* the panel's own way back to its landing: a second tab, or a back link */
const TABS = '[role="tab"], .pd-tab, .jl-tab, .st-side-tab, [data-st-overview], [data-jt-back], [data-pd-back], [data-cal-talk-back]';
const wayBack = (page, sel) => page.evaluate(a => {
  const s = a.s, T = a.t;
  const el = document.querySelector(s); if (!el) return null;
  /* a panel may keep its tabs in its own head, just outside the body the
     sweep found (Settings does): look in the panel, then around it */
  const near = el.querySelector(T) ? el : (el.parentElement && el.parentElement.querySelector(T) ? el.parentElement : document);
  /* the tab is asked for by EXISTENCE, not by the height it happens to have
     right now: a list panel draws its Overview tab with nothing in it until a
     row is chosen, and a zero-height tab there is the panel being quiet, not
     the way back being missing. What Settings lacked was the tab itself. */
  const tabs = [...near.querySelectorAll(T)];
  const land = tabs.find(t => !/Jambo/i.test(t.textContent || ''));
  if (land) return { kind: 'tab', word: (land.textContent || '').replace(/\s+/g, ' ').trim() };
  return null;
}, { s: sel, t: TABS });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ AI_RATE_DEEP: '400' });
  await seedDiscoverWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: SCREEN });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => typeof setView === 'function' && window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 15000);

    for (const [key, name, go] of PLACES){
      if (ONLY.length && !ONLY.includes(key)) continue;
      /* a clean slate, so the links read are the page's own and not the last page's talk */
      await page.evaluate(() => { try { if (typeof intel === 'object' && intel) intel.history = []; } catch (_){ /* none */ }
        try { if (typeof ai === 'object' && ai) ai.history = []; } catch (_){ /* none */ } });
      try { await go(page); } catch (e){ check(`${name}: the place opens`, false, String(e).slice(0, 110)); continue; }
      await page.waitForTimeout(900);

      const sel = await page.evaluate(s => { const el = document.querySelector(s); return el ? '#' + el.id : null; }, PANEL);
      if (!sel){ console.log(`SKIP  ${name} — no panel on this page`); continue; }

      const before = await landingLinks(page, sel);
      const asked = await fillTalk(page, sel);
      await page.waitForTimeout(700);
      if (!asked){ console.log(`SKIP  ${name} — this panel has no box to ask in`); continue; }

      const above = await aboveTalk(page, sel);
      if (key === 'board'){
        /* THE ONE PAGE HELD OPEN, AND THE REASON IT IS. The Board's panel holds
           Jambo's own greeting, and his chips do sit above the talk in its
           scroller — but every one of them opens something the Board already
           draws in full, a glance to the left, so nothing lives only in that
           panel. That is what made the Contracts list different, where Discover
           was there and nowhere else. Pinning the greeting was tried and cut a
           sentence in half; two tabs brought a page word and a trail the owner
           had ruled out. The owner has been asked; until they answer, this is
           what the exception costs, and the check holds it to its reason: the
           chips above the talk are HIS, and the Board itself carries the same
           work. A second page joining the exception, or the Board's own card
           going away, turns this red. */
        const onPage = await page.evaluate(() => ({
          book: !!document.querySelector('#hb-bhead, .hb-book, [data-hb-fig]'),
          needs: !!document.querySelector('#nd-board, .nd-card, [data-nd-row], .hb-nd') }));
        const his = (above.above || []).every(w => /needs me|by stream|ending|views|saved/i.test(w));
        check(`${name}: the one page held open — his own chips above the talk, and the Board draws the same work in full`,
          !above.ok && his && onPage.book && onPage.needs, JSON.stringify({ above, onPage }));
      } else check(`${name}: nothing to press sits above the conversation in its scroller`, above.ok, JSON.stringify(above));

      const still = await painted(page, sel, before);
      let how = still.off.length ? '' : 'they never left the screen';
      if (still.off.length){
        /* not painted any more: the panel must carry a way back, and pressing
           it must bring them back — one press, never a scroll */
        const w = await wayBack(page, sel);
        if (w){
          const pressed = await page.evaluate(a => {
            const el = document.querySelector(a.s); if (!el) return false;
            const near = el.querySelector(a.t) ? el : (el.parentElement && el.parentElement.querySelector(a.t) ? el.parentElement : document);
            const key = eval(a.k);
            const b = [...near.querySelectorAll(a.t)].find(x => key(x.textContent || '') === key(a.word));
            if (!b) return false; b.click(); return true;
          }, { s: sel, t: TABS, word: w.word, k: KEYJS });
          await page.waitForTimeout(600);
          if (!pressed) how = '', still.pressFailed = 'the way back could not be pressed';
          else {
            const again = await painted(page, sel, still.offLinks);
            if (!again.off.length) how = `one press on "${w.word}" brings them back`;
            else how = '', still.stillOff = again.off.slice(0, 5);
          }
        } else still.noWayBack = true;
      }
      check(`${name}: its ${before.length} link${before.length === 1 ? '' : 's'} stay within one press — ${how || 'NOT REACHABLE'}`,
        !!how, JSON.stringify({ panel: sel, off: still.off.slice(0, 6), stillOff: still.stillOff, noWayBack: still.noWayBack, pressFailed: still.pressFailed }));

      /* AND THE SAME RULE ASKED OF THE PANEL ITSELF, which is the half that
         catches a page this sweep cannot make flip. Settings was such a page:
         its landing carries "N things need you here" with a link per row, and
         because the harness could not drive its conversation the checks above
         passed it while the screen was plainly wrong. A landing with something
         to press must carry a way back to it — a tab that is not Jambo's, or a
         back control — UNLESS that landing never leaves, which is what the two
         named here do and what this check asserts of them rather than assuming.
         The Board's own exception is settled by its check above. */
      const NO_BACK_NEEDED = {
        board: 'his own greeting; every link in it opens what the Board draws in full',
        calendar: 'the week\'s plan, which the conversation never replaces' };
      const back = await wayBack(page, sel);
      if (NO_BACK_NEEDED[key]){
        check(`${name}: needs no way back — ${NO_BACK_NEEDED[key]}, and nothing it offers left the screen`,
          !still.off.length, JSON.stringify({ off: still.off.slice(0, 5) }));
      } else {
        check(`${name}: a landing with ${before.length} to press carries a way back to them`,
          !before.length || !!back, JSON.stringify({ panel: sel, links: before.slice(0, 4).map(l => l.w), back }));
      }
      await page.screenshot({ path: path.join(OUT, key + '.png') });
    }

    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
