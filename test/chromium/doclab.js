/* Chromium verification of the Doc Lab (js/views/doclab.js).
   ============================================================
   The lab's filter is unit-tested in test/f60-doclab-visibility.test.js, which
   is where the leak question is actually settled. This script answers the other
   half — does the page BOOT, draw and respond inside the real application —
   because jsdom cannot tell you that a new nav item routes, that the real
   docBody() renders inside a different view, or that the composer wires up.

   It runs the whole app: static mode, workspace created from the setup screen
   with the sample portfolio, a contract opened, then Doc Lab.

   What it asserts, all measured from the live DOM:
     · the Doc Lab nav item exists beside Doc and routes to the lab
     · the real document draws inside the lab, read-only (no live inputs)
     · seeding produces internal and shared threads, and the owner sees both
     · the counterparty view shows ONLY the shared one — and the internal
       wording is nowhere in the page's HTML, not merely hidden
     · deciding a change closes the thread pinned to it
     · nothing the lab did reached the contract record

   Screenshots go to test/chromium/shots/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';

/* Served over http for the same reason verify.js does it: on a file:// opaque
   origin Chromium throws on the first localStorage access, which aborts
   js/core.js partway through and leaves every later const in the dead zone. */
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json' };
function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, port: srv.address().port }));
  });
}

const results = [];
function check(name, ok, detail){
  results.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { srv, port } = await serve();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));

  try{
    await page.goto(`http://127.0.0.1:${port}/index.html`);

    /* ---- create a workspace with the sample portfolio ---- */
    await page.waitForSelector('#su-go', { timeout: 15000 });
    await page.fill('#su-org', 'Wanjiru Catering Ltd');
    await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-title', 'Chief Operating Officer');
    await page.fill('#su-email', 'amina@wanjiru.co.ke');
    await page.fill('#su-pass', 'labtest12345');
    await page.click('#su-go');
    await page.waitForSelector('.nav-item[data-view="doclab"]', { timeout: 20000 });
    check('the Doc Lab nav item ships in the shell', true);

    /* ---- open a contract ---- */
    const opened = await page.evaluate(() => {
      const c = state.contracts[0];
      if (!c) return null;
      openWorkspace(c.id);
      return { id: c.id, name: c.name };
    });
    check('a sample contract opened', !!opened, opened && opened.id);

    await page.click('.nav-item[data-view="doclab"]');
    await page.waitForTimeout(400);

    const routed = await page.evaluate(() => ({
      view: state.view,
      title: (document.getElementById('cmd-title') || {}).textContent || '',
      navActive: !!document.querySelector('.nav-item[data-view="doclab"].active')
    }));
    check('the nav item routes to the lab', routed.view === 'doclab', routed.view);
    check('the command bar names it a sandbox', /sandbox/i.test(routed.title), routed.title);
    check('the nav item highlights', routed.navActive);

    /* ---- the lab's own copy of the document draws, with clauses to edit ---- */
    const doc = await page.evaluate(() => {
      const clauses = document.querySelectorAll('[data-lab-clause]');
      return {
        clauses: clauses.length,
        chars: Array.from(clauses).reduce((n, el) => n + (el.textContent || '').trim().length, 0),
        editButtons: document.querySelectorAll('[data-lab-edit]').length,
        copiedBaseline: !!labFor(state.activeId).baseHtml
      };
    });
    check('the document draws as editable clauses', doc.clauses > 0 && doc.chars > 200,
      `${doc.clauses} clauses, ${doc.chars} characters`);
    check('every clause offers a change control', doc.editButtons === doc.clauses);
    check('the lab took its own copy of the wording', doc.copiedBaseline);

    /* ---- edit a clause by hand, through the real controls ---- */
    await page.click('[data-lab-edit]');
    await page.waitForTimeout(150);
    await page.fill('[data-lab-editor] textarea', 'The Supplier shall deliver within seven (7) days of each purchase order.');
    await page.click('[data-lab-save]');
    await page.waitForTimeout(300);

    const edited = await page.evaluate(() => {
      const lab = labFor(state.activeId);
      const ch = lab.changes[0];
      const html = document.getElementById('content').innerHTML;
      return {
        filed: lab.changes.length,
        sent: ch ? ch.sent : null,
        redlineShown: html.includes('lab-ins') && html.includes('lab-del'),
        withheldDrafts: labWithheld(lab).drafts
      };
    });
    check('editing a clause files a change', edited.filed === 1);
    check('and it starts unsent — it is yours until you send it', edited.sent === false);
    check('the document shows it as a redline', edited.redlineShown);
    check('it is counted as staying behind', edited.withheldDrafts === 1);

    /* an unsent draft must not reach them — the seam the wall most easily fails at */
    await page.click('#lab-ext');
    await page.waitForTimeout(250);
    const draftLeak = await page.evaluate(() => ({
      wording: document.getElementById('content').innerHTML.includes('seven (7) days'),
      payloadChanges: labSharePayload(labFor(state.activeId)).changes.length
    }));
    check('an unsent draft is absent from the counterparty view', !draftLeak.wording);
    check('and absent from the payload', draftLeak.payloadChanges === 0);
    await page.click('#lab-int');
    await page.waitForTimeout(250);

    /* ---- you cannot decide your own ask ---- */
    const ownAsk = await page.evaluate(() => {
      const id = labFor(state.activeId).changes[0].id;
      document.querySelector(`[data-lab-send="${id}"]`).click();
      return { id, acceptOffered: !!document.querySelector(`[data-lab-accept="${id}"]`) };
    });
    await page.waitForTimeout(250);
    const afterSend = await page.evaluate(() => {
      const id = labFor(state.activeId).changes[0].id;
      return {
        sent: labFor(state.activeId).changes[0].sent,
        acceptOfferedToUs: !!document.querySelector(`[data-lab-accept="${id}"]`)
      };
    });
    check('sending puts the change on the table', afterSend.sent === true);
    check('and we are not offered a decision on our own ask', !afterSend.acceptOfferedToUs);

    /* switching sides is how you answer it */
    await page.click('#lab-side-them');
    await page.waitForTimeout(250);
    const asThem = await page.evaluate(() => {
      const id = labFor(state.activeId).changes[0].id;
      return { acceptOffered: !!document.querySelector(`[data-lab-accept="${id}"]`) };
    });
    check('the other side is offered the decision', asThem.acceptOffered);

    /* reject, and confirm the original wording comes back exactly */
    const rejected = await page.evaluate(() => {
      const id = labFor(state.activeId).changes[0].id;
      document.querySelector(`[data-lab-reject="${id}"]`).click();
      return id;
    });
    await page.waitForTimeout(250);
    const restored = await page.evaluate(() => {
      const lab = labFor(state.activeId);
      const cl = labClausesOf(lab)[0];
      return {
        status: lab.changes[0].status,
        reads: labClauseText(cl, lab.changes),
        baseline: cl.text
      };
    });
    check('rejecting returns the clause to its original wording exactly',
      restored.status === 'rejected' && restored.reads === restored.baseline, rejected);

    await page.click('#lab-side-us');
    await page.waitForTimeout(200);

    /* ---- seed a round, and read what the owner sees ---- */
    await page.click('#lab-seed');
    await page.waitForTimeout(300);

    const owner = await page.evaluate(() => {
      const html = document.getElementById('content').innerHTML;
      const cid = state.activeId;
      const lab = labFor(cid);
      return {
        threads: lab.threads.length,
        internal: lab.threads.filter(t => t.visibility === 'internal').length,
        shared: lab.threads.filter(t => t.visibility === 'shared').length,
        showsInternalWording: html.includes('cure period'),
        showsSharedWording: html.includes('re-tender')
      };
    });
    check('seeding files internal and shared threads', owner.internal === 2 && owner.shared === 1,
      `${owner.internal} internal / ${owner.shared} shared`);
    check('the owner sees the internal wording', owner.showsInternalWording);
    check('the owner sees the shared wording', owner.showsSharedWording);
    await page.screenshot({ path: path.join(OUT, 'doclab-owner.png'), fullPage: true });

    /* ---- the two panes scroll independently ----
       A contract and the argument about it are not the same length, so on one
       page scroll reading clause 14 puts its change cards off the bottom of the
       screen. Measured from the live layout, because a stylesheet rule proves
       nothing about whether a pane actually became a scroll container. */
    const panes = await page.evaluate(() => {
      const canvas = document.getElementById('lab-canvas');
      const sideEl = document.querySelector('.lab-sidepane');
      const split = document.querySelector('.lab-split');
      if (!canvas || !sideEl || !split) return { skipped: true };
      const cs = getComputedStyle(canvas), ss = getComputedStyle(sideEl);
      return {
        canvasOverflow: cs.overflowY,
        sideOverflow: ss.overflowY,
        /* Bounded height is what makes overflow mean anything — a pane as tall
           as its content scrolls nothing however the rule reads. */
        canvasBounded: canvas.clientHeight > 0 && canvas.clientHeight < window.innerHeight,
        sideBounded: sideEl.clientHeight > 0 && sideEl.clientHeight < window.innerHeight,
        splitFitsViewport: split.getBoundingClientRect().bottom <= window.innerHeight + 2,
        splitHeight: Math.round(split.getBoundingClientRect().height),
        /* THE SPLIT'S OWN SCROLLING ANCESTOR, not documentElement. The app
           shell scrolls its content area rather than the document, so measuring
           the document reports 'no scroll' whatever is below the panes — a
           check written that way passes in both states and proves nothing. */
        outer: (() => {
          for (let el = split.parentElement; el && el !== document.body; el = el.parentElement){
            const cs = getComputedStyle(el);
            if (/(auto|scroll)/.test(cs.overflowY)) return {
              id: el.id || el.className.toString().slice(0, 30),
              sh: el.scrollHeight, ch: el.clientHeight
            };
          }
          return { id: 'document', sh: document.documentElement.scrollHeight,
            ch: window.innerHeight };
        })()
      };
    });
    if (panes.skipped){
      check('the lab draws two panes', false, 'no .lab-split / .lab-sidepane');
    } else {
      check('the document pane is its own scroll container',
        panes.canvasOverflow === 'auto' && panes.canvasBounded,
        `overflow-y ${panes.canvasOverflow}, bounded ${panes.canvasBounded}`);
      check('the side panel is its own scroll container',
        panes.sideOverflow === 'auto' && panes.sideBounded,
        `overflow-y ${panes.sideOverflow}, bounded ${panes.sideBounded}`);
      check('and the split is sized to the viewport rather than overflowing it',
        panes.splitFitsViewport, `${panes.splitHeight}px tall`);
      /* THREE SCROLLBARS IS ONE TOO MANY. With the panes sized to the viewport,
         anything below them gives the page a scroll region of its own competing
         with the two inside it — and whatever is down there is out of sight
         anyway. */
      check('and nothing below it gives the page a scrollbar of its own',
        panes.outer.sh <= panes.outer.ch + 4,
        `${panes.outer.id}: content ${panes.outer.sh} vs box ${panes.outer.ch}`);
    }

    /* Scrolling one pane must move that pane and nothing else.

       Measured at a SHORTER viewport on purpose. At 1000px tall the sample's
       six clauses fit inside the pane, so nothing scrolls and a check run there
       would pass without exercising anything. 620px is an ordinary laptop
       window with browser chrome, and it is where this feature earns its keep. */
    await page.setViewportSize({ width: 1280, height: 620 });
    await page.waitForTimeout(200);
    const scrolled = await page.evaluate(async () => {
      const canvas = document.getElementById('lab-canvas');
      const sideEl = document.querySelector('.lab-sidepane');
      const pageBefore = window.scrollY;
      const sideBefore = sideEl.scrollTop;
      canvas.scrollTop = 99999;
      await new Promise(r => setTimeout(r, 60));
      const out = {
        canvasCanScroll: canvas.scrollHeight > canvas.clientHeight + 4,
        canvasMoved: canvas.scrollTop > 0,
        pageStayed: window.scrollY === pageBefore,
        sideStayed: sideEl.scrollTop === sideBefore
      };
      canvas.scrollTop = 0;
      return out;
    });
    check('at a laptop-height window the contract overflows its pane',
      scrolled.canvasCanScroll);
    check('scrolling the contract moves the contract', scrolled.canvasMoved);
    check('and does not move the page', scrolled.pageStayed);
    check('and does not move the side panel', scrolled.sideStayed);
    await page.screenshot({ path: path.join(OUT, 'doclab-panes.png') });

    /* ---- clicking either side pairs it with the other ----
       The panes scroll independently, which is what loses a reader their place:
       the contract is on clause 14 and the cards are wherever they were left.
       Clicking one side has to take the other side with it. */
    const pairing = await page.evaluate(async () => {
      const lab = labFor(state.activeId);
      const live = (lab.changes || []).find(x => x.clauseId);
      if (!live) return { skipped: true };
      const clauseId = live.clauseId;
      const frame = document.querySelector(`[data-lab-clause="${clauseId}"]`);
      const card = () => document.querySelector(`[data-lab-card-clause="${clauseId}"]`);
      if (!frame || !card()) return { skipped: true, why: 'no frame or card for ' + clauseId };

      /* FROM THE DOCUMENT. Click the clause body — not a button, not the badge. */
      frame.querySelector('.clause-body').click();
      await new Promise(r => setTimeout(r, 260));
      const fromDoc = {
        frameLit: !!document.querySelector(`[data-lab-clause="${clauseId}"].is-focus`),
        cardLit: !!document.querySelector(`[data-lab-card-clause="${clauseId}"].is-focus`)
      };

      /* Clicking it again releases — a mark you cannot clear is a mark on the
         document for good. */
      document.querySelector(`[data-lab-clause="${clauseId}"] .clause-body`).click();
      await new Promise(r => setTimeout(r, 260));
      const released = !document.querySelector('.clause-frame.is-focus');

      /* FROM THE SIDEBAR, the same pairing in reverse. */
      card().click();
      await new Promise(r => setTimeout(r, 260));
      const fromSide = {
        frameLit: !!document.querySelector(`[data-lab-clause="${clauseId}"].is-focus`),
        cardLit: !!document.querySelector(`[data-lab-card-clause="${clauseId}"].is-focus`)
      };

      /* And only the matching clause is marked, not every clause. */
      const litFrames = document.querySelectorAll('.clause-frame.is-focus').length;
      return { skipped: false, clauseId, fromDoc, released, fromSide, litFrames };
    });
    if (pairing.skipped){
      check('a clause with a change exists to pair', false, pairing.why || '');
    } else {
      check('clicking a clause lights that clause', pairing.fromDoc.frameLit);
      check('and lights its card on the other side', pairing.fromDoc.cardLit);
      check('clicking it again releases the pairing', pairing.released);
      check('clicking the card lights the clause in the contract', pairing.fromSide.frameLit);
      check('and lights the card itself', pairing.fromSide.cardLit);
      check('exactly one clause is marked, not all of them',
        pairing.litFrames === 1, `${pairing.litFrames} lit`);
      await page.screenshot({ path: path.join(OUT, 'doclab-paired.png') });
    }

    /* ---- clicking a clause must not throw away where you were reading ----
       Reported from real use: reading clause 14, clicking it, and the contract
       snapping back to clause 1. That was not the scroll-into-view — it was the
       repaint replacing #lab-canvas with a fresh element whose scrollTop is 0,
       which had been quietly happening on every send, accept and note as well.

       At a laptop-height window, where the contract actually overflows. */
    await page.setViewportSize({ width: 1280, height: 620 });
    await page.waitForTimeout(250);
    const place = await page.evaluate(async () => {
      const canvas = document.getElementById('lab-canvas');
      if (!canvas || canvas.scrollHeight <= canvas.clientHeight + 20) return { skipped: true };
      document.querySelectorAll('.clause-frame.is-focus').forEach(n => n.classList.remove('is-focus'));

      /* Scroll down, then click a clause that is in view down there. */
      canvas.scrollTop = Math.min(240, canvas.scrollHeight - canvas.clientHeight);
      await new Promise(r => setTimeout(r, 120));
      const was = canvas.scrollTop;

      const frames = Array.from(document.querySelectorAll('[data-lab-clause]'));
      const cp = document.querySelector('.lab-sidepane');
      /* A clause with NO card on the right — the case that must not move me. */
      const bare = frames.find(f => !document.querySelector(
        `[data-lab-card-clause="${f.getAttribute('data-lab-clause')}"]`));
      if (!bare) return { skipped: true, why: 'every clause has a card' };

      bare.querySelector('.clause-body').click();
      await new Promise(r => setTimeout(r, 400));
      const after = document.getElementById('lab-canvas');
      return {
        skipped: false,
        was, now: after.scrollTop,
        lit: !!document.querySelector('.clause-frame.is-focus'),
        sideMoved: cp ? cp.scrollTop : 0
      };
    });
    if (!place.skipped){
      check('clicking a clause with no card leaves the contract where it was',
        Math.abs(place.now - place.was) <= 4, `was ${place.was}, now ${place.now}`);
      check('and still marks the clause', place.lit);
    }

    /* And a repaint from an ordinary action keeps the place too. */
    const afterAction = await page.evaluate(async () => {
      const canvas = document.getElementById('lab-canvas');
      if (!canvas || canvas.scrollHeight <= canvas.clientHeight + 20) return { skipped: true };
      canvas.scrollTop = Math.min(200, canvas.scrollHeight - canvas.clientHeight);
      await new Promise(r => setTimeout(r, 100));
      const was = canvas.scrollTop;
      renderDocLab();                                  // the repaint every action does
      await new Promise(r => setTimeout(r, 250));
      return { skipped: false, was, now: document.getElementById('lab-canvas').scrollTop };
    });
    if (!afterAction.skipped){
      check('a repaint does not send the contract back to the top',
        Math.abs(afterAction.now - afterAction.was) <= 4,
        `was ${afterAction.was}, now ${afterAction.now}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(200);
    /* Released through the real interaction, not by stripping the class. Focus
       lives in module state, so a repaint would simply draw it again — which is
       what left the next check looking at a clause it thought it had cleared. */
    await page.evaluate(async () => {
      const lit = document.querySelector('.clause-frame.is-focus .clause-body');
      if (lit){ lit.click(); await new Promise(r => setTimeout(r, 250)); }
      const c = document.getElementById('lab-canvas'); if (c) c.scrollTop = 0;
    });

    /* Selecting text inside a clause must NOT pair — the repaint would throw
       the selection away, and selecting wording is how the AI actions start. */
    const dragKeepsSelection = await page.evaluate(async () => {
      document.querySelectorAll('.clause-frame.is-focus').forEach(n => n.classList.remove('is-focus'));
      const body = document.querySelector('.clause-frame .clause-body');
      if (!body) return { skipped: true };
      /* A real TEXT node. Reaching for firstChild found the <p> element wrapping
         the line, whose .length is undefined — so the range came out empty, no
         selection existed, and this check was only ever passing because the
         clause it clicked was already focused and the click toggled it off. */
      const textNode = (function find(n){
        if (n.nodeType === 3) return n.nodeValue.trim().length > 10 ? n : null;
        for (const kid of n.childNodes){ const hit = find(kid); if (hit) return hit; }
        return null;
      })(body);
      if (!textNode) return { skipped: true, why: 'no text node long enough' };
      const r = document.createRange();
      r.setStart(textNode, 0);
      r.setEnd(textNode, Math.min(24, textNode.nodeValue.length));
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      const selLen = String(sel).trim().length;
      const focusBefore = !!document.querySelector('.clause-frame.is-focus');
      body.click();                                  // the mouseup at the end of a drag
      await new Promise(res => setTimeout(res, 220));
      return { skipped: false, selLen, focusBefore,
        stillFocused: !!document.querySelector('.clause-frame.is-focus') };
    });
    if (!dragKeepsSelection.skipped){
      check('finishing a text drag does not pair and repaint the clause away',
        !dragKeepsSelection.stillFocused,
        `selection ${dragKeepsSelection.selLen} chars, focus before ${dragKeepsSelection.focusBefore}`);
    }
    await page.evaluate(() => {
      const s = window.getSelection(); if (s) s.removeAllRanges();
      document.querySelectorAll('.lab-selmenu').forEach(n => n.remove());
    });

    /* ---- the clause toolbar actually opens, and STAYS open ----
       Reported from real use: AI Assist flashed and vanished. The toolbar sits
       inside the canvas, so pressing it fired the canvas mouseup handler, which
       10ms later looked for a text selection, found none — a click collapses
       one — and dismissed the menu the button had just opened.

       This is the shape of bug jsdom cannot see: it needs a real click, real
       event ordering and a real timer. So the wait here is deliberately LONGER
       than the settle delay. Checking immediately would pass against the very
       bug being pinned. */
    const hasAssist = await page.evaluate(() => !!document.querySelector('[data-lab-assist]'));
    let assist = { skipped: true };
    if (hasAssist){
      /* page.click, NOT element.click(). A scripted element.click() dispatches
         only a click event — no mousedown, no mouseup — so it never reaches the
         canvas handler that causes this bug, and a check written that way
         passes against the very defect it claims to pin. This drives the real
         input stack: press, release, then click, in that order. */
      await page.click('[data-lab-assist]');
      const immediately = await page.evaluate(() => !!document.querySelector('.lab-selmenu'));
      await page.waitForTimeout(250);                 // well past the 10ms settle
      assist = await page.evaluate(im => {
        const menu = document.querySelector('.lab-selmenu');
        return {
          immediately: im,
          stillThere: !!menu,
          actions: menu ? Array.from(menu.querySelectorAll('[data-lab-ai]'))
            .map(b => b.textContent.trim()) : [],
          onScreen: menu ? (() => {
            const r = menu.getBoundingClientRect();
            return r.width > 40 && r.height > 20
              && r.top >= 0 && r.left >= 0 && r.right <= window.innerWidth;
          })() : false
        };
      }, immediately);
    }
    if (assist.skipped){
      check('the clause toolbar offers AI Assist', false, 'no [data-lab-assist] button rendered');
    } else {
      check('AI Assist opens the action menu', assist.immediately);
      check('and the menu SURVIVES the selection settle — the flash-and-vanish bug',
        assist.stillThere);
      check('it offers the three actions', assist.actions.length === 3, assist.actions.join(' | '));
      /* The playbook action was deleted, not hidden. A menu item that asks a
         model to match a formulation the playbook does not hold produces a
         house style the model invented, wearing the playbook's authority. */
      check('and Align with Corporate Playbook is not among them',
        !assist.actions.some(a => /playbook/i.test(a)), assist.actions.join(' | '));
      check('and it is drawn on screen with real size', assist.onScreen);
      await page.screenshot({ path: path.join(OUT, 'doclab-assist-menu.png') });
    }
    /* ---- an open menu follows its wording when the pane scrolls ----
       Both floating layers are position:fixed at viewport coordinates. Once the
       document pane scrolls on its own, a layer that does not move is a menu
       pointing at a clause that has gone — or at a different one. */
    if (!assist.skipped && assist.stillThere){
      const follow = await page.evaluate(async () => {
        const menu = document.querySelector('.lab-selmenu');
        const canvas = document.getElementById('lab-canvas');
        if (!menu || !canvas || canvas.scrollHeight <= canvas.clientHeight + 4)
          return { skipped: true };
        const before = menu.getBoundingClientRect().top;
        canvas.scrollTop = canvas.scrollHeight;         // clause well out of view
        await new Promise(r => setTimeout(r, 120));
        const hidden = getComputedStyle(menu).visibility === 'hidden';
        const moved = Math.abs(menu.getBoundingClientRect().top - before) > 2;
        canvas.scrollTop = 0;
        await new Promise(r => setTimeout(r, 120));
        return {
          skipped: false, hidden, moved,
          backAfterReturn: getComputedStyle(menu).visibility !== 'hidden',
          backNearStart: Math.abs(menu.getBoundingClientRect().top - before) <= 3
        };
      });
      if (!follow.skipped){
        check('scrolling the clause away moves or hides its open menu',
          follow.hidden || follow.moved, `hidden ${follow.hidden}, moved ${follow.moved}`);
        check('and scrolling back brings it to where its wording is',
          follow.backAfterReturn && follow.backNearStart);
      }
    }
    await page.evaluate(() => document.querySelectorAll('.lab-selmenu').forEach(n => n.remove()));

    /* ---- THE PROPOSAL LIVES IN THE SIDE PANEL NOW ----
       Reported from real use of the old popover: Close, Apply Redline and
       Discard did nothing. The popover is gone and the flow moved into the
       Copilot panel, but the shape of that bug has not — a card whose buttons
       are drawn by a repaint and wired afterwards can lose its handlers the
       same way. So the same three verbs are pressed for real.

       The Copilot is STUBBED so this exercises the panel rather than a network
       call, and it returns the STRUCTURED shape the panel now asks for: the
       flow under test is the two bubbles and the card, not the model. */
    await page.evaluate(() => {
      window.copilotAvailable = () => true;
      window.copilotAsk = async () => JSON.stringify({
        advice: 'STUBBED ADVICE ABOUT THE CLAUSE',
        proposedText: 'THE STUBBED REPLACEMENT WORDING'
      });
    });
    /* Opens a proposal from the first clause and waits for the card. Uses the
       SHORTEN action, which carries its own instruction and so goes straight to
       a proposal; the open-ended Rephrase action is a conversation and is
       exercised separately below. */
    const openProposal = async () => {
      await page.evaluate(() => {
        document.querySelectorAll('.lab-selmenu').forEach(n => n.remove());
        if (window.closeAI) closeAI();
      });
      await page.click('[data-lab-assist]');
      await page.waitForSelector('.lab-selmenu [data-lab-ai]', { timeout: 4000 });
      await page.click('.lab-selmenu [data-lab-ai="shorten"]');
      await page.waitForSelector('#ai-panel.open .ai-proposal [data-ai-prop-apply]', { timeout: 6000 });
    };

    /* ---- the layout BEHIND the drawer ----
       The drawer must be a layer, not a column. Anything that narrows the shell
       re-lays-out this whole page — every clause frame moves left, every line
       re-wraps — at the exact moment the reader has pressed a button about a
       phrase they just selected. Measured with the drawer shut and again with
       it open, from a settled page both times: the panel slides in over 300ms,
       and reading its box mid-transition measures where it was, not where it is. */
    const measure = () => page.evaluate(() => {
      const canvas = document.getElementById('lab-canvas');
      const frame = document.querySelector('[data-lab-clause]');
      const shell = document.getElementById('app-shell');
      return { canvas: Math.round(canvas.getBoundingClientRect().width),
        frameLeft: Math.round(frame.getBoundingClientRect().left),
        shell: Math.round(shell.getBoundingClientRect().width) };
    });
    await page.evaluate(() => { if (window.closeAI) closeAI(); });
    await page.waitForTimeout(450);
    const beforeDrawer = await measure();

    let panel = { skipped: true };
    try {
      await openProposal();
      /* Past the 300ms slide, so the box being measured is where the drawer
         actually rests. */
      await page.waitForTimeout(450);
      const opened = await page.evaluate(() => {
        const p = document.getElementById('ai-panel');
        const feed = document.getElementById('ai-feed');
        const card = feed && feed.querySelector('.ai-proposal');
        return {
          panelOpen: !!(p && p.classList.contains('open')),
          /* Docked, not over a scrim: the whole reason it moved here is that a
             reader deciding on wording has to see the clauses around it. */
          docked: !!(p && p.classList.contains('docked')),
          scrimOpen: !!document.getElementById('ai-scrim').classList.contains('open'),
          /* An OVERLAY: pinned to the viewport, full height, above everything,
             and carrying the shadow that separates it from the page now that no
             scrim does. */
          overlay: (() => {
            const cs = getComputedStyle(p);
            const r = p.getBoundingClientRect();
            return { position: cs.position, z: Number(cs.zIndex),
              top: Math.round(r.top), right: Math.round(window.innerWidth - r.right),
              fullHeight: Math.abs(r.height - window.innerHeight) <= 1,
              shadow: /-5px/.test(cs.boxShadow) };
          })(),
          /* NOTHING BEHIND IT MOVED. */
          layout: (() => {
            const canvas = document.getElementById('lab-canvas');
            const frame = document.querySelector('[data-lab-clause]');
            const shell = document.getElementById('app-shell');
            return { canvas: Math.round(canvas.getBoundingClientRect().width),
              frameLeft: Math.round(frame.getBoundingClientRect().left),
              shell: Math.round(shell.getBoundingClientRect().width) };
          })(),
          /* BUBBLE ONE — the reasoning, in the ordinary chat stream. */
          hasAdvice: !!(feed && /STUBBED ADVICE ABOUT THE CLAUSE/.test(feed.textContent)),
          /* BUBBLE TWO — the wording, as a card with verbs on it. */
          hasCard: !!card,
          cardCarriesWording: !!(card && /THE STUBBED REPLACEMENT WORDING/.test(card.textContent)),
          adviceOutsideCard: !!(card && !/STUBBED ADVICE/.test(card.textContent)),
          hasApply: !!(card && card.querySelector('[data-ai-prop-apply]')),
          hasDecline: !!(card && card.querySelector('[data-ai-prop-decline]')),
          hasEdit: !!(card && card.querySelector('[data-ai-prop-edit-btn]'))
        };
      });
      await page.screenshot({ path: path.join(OUT, 'doclab-proposal-panel.png') });

      /* DECLINE — the card closes out and NOTHING is written to the document. */
      const beforeDecline = await page.evaluate(() => (labFor(state.activeId).changes || []).length);
      await page.click('.ai-proposal [data-ai-prop-decline]');
      await page.waitForTimeout(250);
      const declined = await page.evaluate(prev => ({
        noButtons: !document.querySelector('.ai-proposal [data-ai-prop-apply]'),
        saysSo: /Declined/.test(document.getElementById('ai-feed').textContent),
        filedNothing: (labFor(state.activeId).changes || []).length === prev
      }), beforeDecline);

      /* EDIT — the card becomes a textarea, and typing reaches it. */
      await openProposal();
      await page.click('.ai-proposal [data-ai-prop-edit-btn]');
      await page.waitForSelector('.ai-proposal .ai-suggestion-editor', { timeout: 3000 });
      await page.click('.ai-proposal .ai-suggestion-editor');
      await page.keyboard.type(' EDITED');
      await page.waitForTimeout(150);
      const edited = await page.evaluate(() => {
        const t = document.querySelector('.ai-proposal .ai-suggestion-editor');
        return { hasEditor: !!t, value: t ? t.value : '',
          stillOpen: !!document.querySelector('.ai-proposal [data-ai-prop-apply]') };
      });

      /* APPLY — straight out of the edit, so the wording filed is what is on
         the screen rather than what was there before it was typed into. */
      const before = await page.evaluate(() => (labFor(state.activeId).changes || []).length);
      await page.click('.ai-proposal [data-ai-prop-apply]');
      await page.waitForTimeout(500);
      const applied = await page.evaluate(prev => {
        const lab = labFor(state.activeId);
        const mine = (lab.changes || []).filter(x => String(x.after || '').includes('THE STUBBED REPLACEMENT WORDING'));
        return {
          filed: (lab.changes || []).length > prev || mine.length > 0,
          carriesEdit: mine.some(x => x.after.includes('EDITED')),
          cardClosed: !document.querySelector('.ai-proposal [data-ai-prop-apply]'),
          saysApplied: /Applied as a redline/.test(document.getElementById('ai-feed').textContent),
          badge: !!document.querySelector('.change-tag-badge[data-change-id]')
        };
      }, before);

      panel = { skipped: false, opened, declined, edited, applied };
    } catch (e) {
      panel = { skipped: false, error: (e && e.message) || String(e) };
    }

    if (panel.error){
      check('the side-panel proposal flow ran', false, panel.error);
    } else if (!panel.skipped){
      check('an AI action opens the Copilot side panel', panel.opened.panelOpen);
      check('and opens it as a drawer rather than behind a scrim',
        panel.opened.docked && !panel.opened.scrimOpen);
      check('the drawer is a fixed full-height overlay above the page',
        panel.opened.overlay.position === 'fixed' && panel.opened.overlay.z >= 100
        && panel.opened.overlay.top === 0 && panel.opened.overlay.right === 0
        && panel.opened.overlay.fullHeight && panel.opened.overlay.shadow,
        JSON.stringify(panel.opened.overlay));
      check('and NOTHING behind it moved — the canvas keeps its width',
        panel.opened.layout.canvas === beforeDrawer.canvas,
        `${beforeDrawer.canvas}px → ${panel.opened.layout.canvas}px`);
      check('and no clause frame was pushed left',
        panel.opened.layout.frameLeft === beforeDrawer.frameLeft,
        `${beforeDrawer.frameLeft} → ${panel.opened.layout.frameLeft}`);
      check('and the shell was never narrowed to make room',
        panel.opened.layout.shell === beforeDrawer.shell,
        `${beforeDrawer.shell}px → ${panel.opened.layout.shell}px`);
      check('BUBBLE ONE carries the advice', panel.opened.hasAdvice);
      check('BUBBLE TWO is a proposal card carrying the wording',
        panel.opened.hasCard && panel.opened.cardCarriesWording);
      check('and the reasoning is NOT inside the wording that gets spliced',
        panel.opened.adviceOutsideCard);
      check('the card offers Apply Redline, Decline and Edit',
        panel.opened.hasApply && panel.opened.hasDecline && panel.opened.hasEdit);
      check('DECLINE closes the card out', panel.declined.noButtons && panel.declined.saysSo);
      check('and writes nothing to the document', panel.declined.filedNothing);
      check('EDIT turns the card into a textarea', panel.edited.hasEditor);
      check('and the keystrokes reach it', /EDITED$/.test(panel.edited.value),
        JSON.stringify(panel.edited.value.slice(-40)));
      check('APPLY REDLINE files the change', panel.applied.filed);
      check('and applies the wording as edited by hand', panel.applied.carriesEdit);
      check('and the card says it was applied', panel.applied.cardClosed && panel.applied.saysApplied);
      check('and the clause carries a change badge', panel.applied.badge);
    }

    /* ---- "✨ REPHRASE WITH COPILOT" ASKS BEFORE IT DRAFTS ----
       The open-ended action is the one that used to decide, on the reader's
       behalf, that "rephrase" meant "favour my side". It now opens the drawer,
       shows the passage, and asks. Nothing may be spent on a model until the
       reader has answered — so the stub counts its own calls. */
    const converse = await page.evaluate(async () => {
      window.__askCalls = 0;
      /* A cleared panel, because cards from earlier turns stay in the
         transcript and "is there a card yet" has to mean "for THIS ask". */
      if (window.clearAIHistory) clearAIHistory();
      window.copilotAsk = async () => {
        window.__askCalls++;
        return JSON.stringify({
          advice: 'SESSION ADVICE — softened, and the cap is untouched.',
          proposedText: 'THE SOFTENED WORDING'
        });
      };
      document.querySelectorAll('.lab-selmenu').forEach(n => n.remove());
      if (window.closeAI) closeAI();
      const label = document.querySelector('[data-lab-assist]');
      if (!label) return { skipped: true };
      label.click();
      await new Promise(r => setTimeout(r, 300));
      const item = document.querySelector('.lab-selmenu [data-lab-ai="advantage"]');
      const menuLabel = item ? item.textContent.trim() : '';
      if (!item) return { skipped: true };
      item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      const feed = document.getElementById('ai-feed');
      const seeded = {
        menuLabel,
        panelOpen: !!document.querySelector('#ai-panel.open'),
        targetShown: !!feed.querySelector('.ai-target'),
        targetCarriesPassage: !!(feed.querySelector('.ai-target-body')
          && feed.querySelector('.ai-target-body').textContent.trim().length > 20),
        greeting: /How would you like me to help rephrase this passage\?/.test(feed.textContent),
        noCardYet: !feed.querySelector('.ai-proposal [data-ai-prop-apply]'),
        callsBeforeAnswering: window.__askCalls
      };
      /* Answer the question through the panel's own input, which is the whole
         point of seeding a session rather than firing a request. */
      document.getElementById('ai-input').value = 'Soften it so we can send it today.';
      document.getElementById('ai-send').click();
      await new Promise(r => setTimeout(r, 700));
      const cards = document.querySelectorAll('.ai-proposal');
      const card = cards[cards.length - 1];
      return { skipped: false, seeded,
        callsAfterAnswering: window.__askCalls,
        cardAppeared: !!card,
        cardCarriesWording: !!(card && /THE SOFTENED WORDING/.test(card.textContent)),
        adviceOutsideCard: !!(card && !/SESSION ADVICE/.test(card.textContent)),
        adviceShown: /SESSION ADVICE/.test(document.getElementById('ai-feed').textContent) };
    });
    if (converse.skipped){
      check('the rephrase action is in the menu', false);
    } else {
      check('the rephrase button reads "✨ Rephrase with Copilot"',
        converse.seeded.menuLabel === '✨ Rephrase with Copilot', converse.seeded.menuLabel);
      check('pressing it opens the drawer', converse.seeded.panelOpen);
      check('and seeds the session with the target text',
        converse.seeded.targetShown && converse.seeded.targetCarriesPassage);
      check('and asks how it should help', converse.seeded.greeting);
      check('with NO proposal card yet — it has not been told what to do',
        converse.seeded.noCardYet);
      check('and nothing was spent on a model before the reader answered',
        converse.seeded.callsBeforeAnswering === 0,
        `${converse.seeded.callsBeforeAnswering} calls`);
      check('answering in the panel input produces the proposal',
        converse.cardAppeared && converse.cardCarriesWording);
      check('exactly one model call, made after the instruction',
        converse.callsAfterAnswering === 1, `${converse.callsAfterAnswering} calls`);
      check('the advice is a bubble, not part of the wording',
        converse.adviceShown && converse.adviceOutsideCard);
    }

    /* ---- A REFUSAL IS NOT A REDLINE ----
       The single worst failure this flow has available: a model that answers
       conversationally, and the apology gets filed as contract wording. It is
       silent, it looks like wording, and it survives to a signature. */
    const refusal = await page.evaluate(async () => {
      if (window.clearAIHistory) clearAIHistory();
      window.copilotAsk = async () =>
        "I'm sorry, I can't help rewrite that clause without seeing the definitions schedule.";
      document.querySelectorAll('.lab-selmenu').forEach(n => n.remove());
      if (window.closeAI) closeAI();
      document.querySelector('[data-lab-assist]').click();
      await new Promise(r => setTimeout(r, 300));
      document.querySelector('.lab-selmenu [data-lab-ai="shorten"]')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 700));
      const feed = document.getElementById('ai-feed');
      const card = feed.querySelector('.ai-proposal [data-ai-prop-apply]');
      return {
        saidIt: /can't help rewrite that clause/.test(feed.textContent),
        noCard: !card,
        noApplyButton: !feed.querySelector('[data-ai-prop-apply]')
      };
    });
    await page.evaluate(() => { if (window.closeAI) closeAI(); });
    await page.waitForTimeout(400);
    check('a conversational refusal is still shown to the reader', refusal.saidIt);
    check('but it gets NO proposal card', refusal.noCard);
    check('and no Apply Redline button that would splice an apology into a clause',
      refusal.noApplyButton);

    /* ---- a note is drawn ONCE ----
       Also reported from real use: notes appeared under the clause AND on the
       change's card, which reads as two notes rather than one shown twice. */
    const notes = await page.evaluate(() => {
      const cid = state.activeId;
      const lab = labFor(cid);
      const live = (lab.changes || []).find(x => x.status === 'pending');
      if (!live) return { skipped: true };
      labTagChange(lab, live.id, 'UNIQUEINTERNALNOTEMARKER', { visibility: 'internal', side: 'owner' });
      labPut(cid, lab);
      renderDocLab();
      return new Promise(r => setTimeout(() => {
        const canvas = document.getElementById('lab-canvas');
        const count = s => (document.getElementById('content').innerHTML.match(new RegExp(s, 'g')) || []).length;
        r({
          inCanvas: canvas ? canvas.innerHTML.includes('UNIQUEINTERNALNOTEMARKER') : null,
          timesOnPage: count('UNIQUEINTERNALNOTEMARKER'),
          badgeStillLinks: !!document.querySelector('.change-tag-badge[data-change-id]')
        });
      }, 250));
    });
    if (notes.skipped){
      check('a pending change exists to hang a note on', false);
    } else {
      check('a note is NOT duplicated onto the contract', notes.inCanvas === false);
      check('and appears exactly once on the page', notes.timesOnPage === 1, String(notes.timesOnPage));
      check('while the clause still carries the badge that links to it',
        notes.badgeStillLinks);
    }

    /* ---- the counterparty view: the material must be ABSENT, not hidden ---- */
    await page.click('#lab-ext');
    await page.waitForTimeout(300);

    const ext = await page.evaluate(() => {
      const html = document.getElementById('content').innerHTML;
      return {
        internalWordingAnywhereInHtml: html.includes('cure period') || html.includes('Finance want'),
        internalAuthorAnywhere: html.includes('Sarah Chen') || html.includes('David Otieno'),
        sharedWordingPresent: html.includes('re-tender'),
        payloadThreads: labSharePayload(labFor(state.activeId)).threads.length
      };
    });
    check('the internal wording is absent from the page HTML entirely',
      !ext.internalWordingAnywhereInHtml, 'not merely hidden by CSS');
    check('no internal author name reaches the page', !ext.internalAuthorAnywhere);
    check('the shared thread is still there', ext.sharedWordingPresent);
    check('the payload carries exactly one thread', ext.payloadThreads === 1, String(ext.payloadThreads));

    /* Their copy must READ correctly, not merely contain the right rows. Both
       of these were wrong first time round: a change they had just been sent
       was labelled "Not sent" and "your draft", and a decided one said
       "Decided by someone" — because the payload legitimately drops the fields
       the owner's renderer reads, and nothing was reading the ones it keeps. */
    const reads = await page.evaluate(() => {
      const html = document.getElementById('content').innerHTML;
      return {
        saysNotSent: html.includes('Not sent'),
        saysYourDraft: html.includes('your draft'),
        saysSomeone: html.includes('Decided by someone'),
        /* Whichever side ruled, the label must be an ORGANISATION. L-001 was
           rejected while acting as them, so that is the org named here. */
        namesAnOrg: html.includes('Decided by Wanjiru Catering Ltd')
          || html.includes('Decided by The counterparty'),
        namesAColleague: html.includes('Decided by Amina Otieno')
      };
    });
    check('their copy does not call a sent change “Not sent”', !reads.saysNotSent);
    check('nor call it “your draft”', !reads.saysYourDraft);
    check('a decision names an organisation, not “someone”',
      !reads.saysSomeone && reads.namesAnOrg);
    check('and never names the colleague who ruled', !reads.namesAColleague);

    await page.screenshot({ path: path.join(OUT, 'doclab-counterparty.png'), fullPage: true });

    /* ---- deciding a change closes the thread pinned to it ---- */
    await page.click('#lab-int');
    await page.waitForTimeout(250);

    /* The seeded change is THEIR ask and we are acting as us, so the decision
       is ours to make — which is the arrangement the real model requires. */
    const decided = await page.evaluate(() => {
      const btn = document.querySelector('[data-lab-accept]');
      if (!btn) return { skipped: true };
      const id = btn.getAttribute('data-lab-accept');
      const before = labFor(state.activeId).threads.filter(t => t.changeId === id && t.status === 'open').length;
      btn.click();
      const lab = labFor(state.activeId);
      const ch = lab.changes.find(x => x.id === id);
      const cl = labClausesOf(lab).find(x => x.clauseId === ch.clauseId);
      return { skipped: false, id, before,
        after: lab.threads.filter(t => t.changeId === id && t.status === 'open').length,
        status: ch.status,
        clauseNowReadsTheNewWording: labClauseText(cl, lab.changes) === ch.after };
    });
    check('the accept control rendered for the seeded change', !decided.skipped);
    if (!decided.skipped){
      check('accepting it records the decision', decided.status === 'accepted', decided.id);
      check('the clause then reads the accepted wording', decided.clauseNowReadsTheNewWording);
      check('deciding a change closes the threads pinned to it',
        decided.before > 0 && decided.after === 0, `${decided.before} open → ${decided.after}`);
    }

    /* ---- ONE STATUS BAR, AND FOCUS MODE ----
       The three stacked cards above the split were 150-odd pixels of chrome on
       a screen whose job is reading a document, and because the panes are sized
       from the split's measured top, every one of those pixels came out of the
       wording. Measured here rather than asserted from a stylesheet: the
       question is how much room the reader actually gets back. */
    const header = await page.evaluate(async () => {
      const head = document.querySelector('.doclab-status-header');
      if (!head) return { skipped: true };
      const split = document.querySelector('.lab-split');
      const full = head.getBoundingClientRect().height;
      const canvasFull = document.getElementById('lab-canvas').getBoundingClientRect().height;
      const oldBanners = document.querySelectorAll('.doclab-status-header').length;
      document.getElementById('toggle-header-btn').click();
      await new Promise(r => setTimeout(r, 250));
      const collapsed = head.getBoundingClientRect().height;
      const canvasCollapsed = document.getElementById('lab-canvas').getBoundingClientRect().height;
      const modeChipStillShown = !!(head.querySelector('.doclab-modechip')
        && head.querySelector('.doclab-modechip').getBoundingClientRect().height > 4);
      const stored = localStorage.getItem('doclab_header_collapsed');
      /* And it survives a repaint, which is the whole point of storing it. */
      renderDocLab();
      await new Promise(r => setTimeout(r, 250));
      const afterRepaint = document.querySelector('.doclab-status-header')
        .classList.contains('is-collapsed');
      document.getElementById('toggle-header-btn').click();
      await new Promise(r => setTimeout(r, 250));
      return { skipped: false, bars: oldBanners, full, collapsed, modeChipStillShown, stored,
        afterRepaint, canvasFull, canvasCollapsed,
        splitBottomInView: split.getBoundingClientRect().bottom <= window.innerHeight + 2 };
    });
    if (header.skipped){
      check('the three banners are one status bar', false, 'no .doclab-status-header rendered');
    } else {
      check('the three banners are one status bar', header.bars === 1, `${header.bars} found`);
      check('focus mode shrinks it to a compact strip',
        header.collapsed < header.full && header.collapsed <= 48,
        `${Math.round(header.full)}px → ${Math.round(header.collapsed)}px`);
      check('and the room goes to the document',
        header.canvasCollapsed > header.canvasFull,
        `canvas ${Math.round(header.canvasFull)}px → ${Math.round(header.canvasCollapsed)}px`);
      check('the split still ends inside the window', header.splitBottomInView);
      check('the mode chip never collapses — it is the one fact you must not have to expand for',
        header.modeChipStillShown);
      check('the preference is written', header.stored === 'true', String(header.stored));
      check('and survives a repaint', header.afterRepaint);
    }

    /* ---- DISCARDING AN UNSENT DRAFT ----
       Filed fresh, because everything earlier in this run has been sent or
       decided and neither of those may be discarded. */
    const discard = await page.evaluate(async () => {
      const cid = state.activeId;
      const lab = labFor(cid);
      const cl = labClausesOf(lab).find(x => !(lab.changes || [])
        .some(ch => ch.clauseId === x.clauseId && ch.status === 'pending'));
      if (!cl) return { skipped: true };
      const ch = labFileChange(lab, { clauseId: cl.clauseId, clauseLabel: 'Discardable',
        before: labClauseText(cl, lab.changes),
        after: labClauseText(cl, lab.changes) + ' UNIQUEDISCARDMARKER.',
        side: 'owner', authorRef: labAuthorOf(currentUser(), 'owner', getContract(cid)),
        author: 'Test' });
      labPut(cid, lab);
      renderDocLab();
      await new Promise(r => setTimeout(r, 250));
      const btn = document.querySelector(`[data-discuss-discard="${ch.id}"]`);
      const before = {
        offered: !!btn,
        /* Not offered on anything that has left the building. */
        offeredOnSent: !!document.querySelector('[data-lab-card] [data-discuss-discard]')
          && Array.from(document.querySelectorAll('[data-discuss-discard]'))
            .every(b => { const c = labFor(cid).changes.find(x => x.id === b.getAttribute('data-discuss-discard'));
              return c && c.sent !== true && c.stage === 'internal_draft'; }),
        markup: document.getElementById('lab-canvas').innerHTML.includes('UNIQUEDISCARDMARKER'),
        badge: !!document.querySelector(`.change-tag-badge[data-change-id="${ch.id}"]`)
      };
      if (!btn) return { skipped: false, before, pressed: false };
      btn.click();
      await new Promise(r => setTimeout(r, 350));
      const rec = labFor(cid);
      return { skipped: false, before, pressed: true, id: ch.id,
        goneFromRecord: !(rec.changes || []).some(x => x.id === ch.id),
        goneFromCanvas: !document.getElementById('lab-canvas').innerHTML.includes('UNIQUEDISCARDMARKER'),
        goneFromSidebar: !document.querySelector(`[data-lab-card="${ch.id}"]`),
        badgeGone: !document.querySelector(`.change-tag-badge[data-change-id="${ch.id}"]`) };
    });
    if (discard.skipped){
      check('a clause was free to take a discardable draft', false);
    } else {
      check('an unsent draft offers a Discard', discard.before.offered);
      check('and only unsent internal drafts do', discard.before.offeredOnSent);
      check('the draft is on the canvas before it is discarded',
        discard.before.markup && discard.before.badge);
      check('pressing it removes the change from the record', !!discard.goneFromRecord);
      check('and clears its markup from the canvas', !!discard.goneFromCanvas);
      check('and takes its card and badge with it',
        !!discard.goneFromSidebar && !!discard.badgeGone);
    }

    /* ---- THE WORD EXPORT ----
       Run against the live canvas, which is the string the button hands the
       writer. What is being checked is that the UI's own furniture does not
       travel and the redline arrives as something a reviewer can decide. */
    const wordOut = await page.evaluate(() => {
      const canvas = document.getElementById('lab-canvas');
      if (!canvas || typeof docxExportTracked !== 'function') return { skipped: true };
      const html = canvas.innerHTML;
      const out = docxExportTracked(html, { author: 'Amina Otieno', date: '2026-07-29T10:00:00Z' });
      return { skipped: false,
        hadBadgeOnScreen: /change-tag-badge/.test(html),
        badgeInExport: /change-tag-badge|rl-authormark/.test(out.xml) || /#L-\d/.test(out.xml),
        tracked: out.tracked,
        hasWIns: /<w:ins /.test(out.xml),
        hasWDel: /<w:del /.test(out.xml),
        delTextKept: /<w:delText/.test(out.xml),
        bytes: out.bytes.length,
        zipMagic: out.bytes[0] === 0x50 && out.bytes[1] === 0x4B,
        buttonThere: !!document.getElementById('lab-export-docx') };
    });
    if (wordOut.skipped){
      check('the Word writer is on the page', false);
    } else {
      check('the lab offers a Word export', wordOut.buttonThere);
      check('the canvas really carries UI badges to strip', wordOut.hadBadgeOnScreen);
      check('and NONE of them reach the export', !wordOut.badgeInExport);
      check('the redline arrives as native track changes',
        wordOut.hasWIns && wordOut.hasWDel,
        JSON.stringify(wordOut.tracked));
      check('with struck wording kept, which is what makes Reject work',
        wordOut.delTextKept);
      check('and the bytes are a real ZIP', wordOut.zipMagic && wordOut.bytes > 1000,
        `${wordOut.bytes} bytes`);
    }

    /* ---- and none of it reached the contract ---- */
    const clean = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const s = JSON.stringify(c);
      return {
        wording: s.includes('cure period') || s.includes('re-tender') || s.includes('Finance want'),
        labField: 'labThreads' in c || 'lab' in c,
        keys: Object.keys(localStorage).filter(k => k.startsWith('hati.'))
      };
    });
    check('no lab wording reached the contract record', !clean.wording);
    check('no lab field was added to the contract', !clean.labField);
    check('the lab writes only under its own key',
      clean.keys.includes('hati.lab.v1') && clean.keys.some(k => k.startsWith('hati.v1.')),
      clean.keys.join(', '));

    /* index.html loads Tailwind from a CDN (line 7) and configures it inline
       (line 25). This runner has no outbound network, so that script never
       arrives and the config line throws — on every page of the app, with or
       without the lab. It is excluded by name rather than by loosening the
       check, so a real error introduced later still fails this. */
    const real = pageErrors.filter(m => !/tailwind is not defined/i.test(m));
    check('the page raised no script errors of its own', real.length === 0, real.join(' | '));

  }catch(e){
    check('the run completed', false, (e && e.message) || String(e));
  }finally{
    await browser.close();
    srv.close();
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed · screenshots in test/chromium/shots/`);
  process.exit(failed.length ? 1 : 0);
})();
