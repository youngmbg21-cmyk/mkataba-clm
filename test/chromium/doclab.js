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
      check('it offers the four actions', assist.actions.length === 4, assist.actions.join(' | '));
      check('and it is drawn on screen with real size', assist.onScreen);
      await page.screenshot({ path: path.join(OUT, 'doclab-assist-menu.png') });
    }
    await page.evaluate(() => document.querySelectorAll('.lab-selmenu').forEach(n => n.remove()));

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
