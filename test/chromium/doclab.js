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

    /* ---- open a contract, and put a real change on it ----
       The sample portfolio ships with no negotiation history, and the lab's
       most interesting behaviour — a thread closing when the change it is
       pinned to is decided — needs one to exist. It is filed through the real
       model (negoEditClause), so the lab is reading a genuine change rather
       than one this script invented. */
    const opened = await page.evaluate(async () => {
      const c = state.contracts[0];
      if (!c) return null;
      openWorkspace(c.id);
      let changes = 0, err = null;
      try{
        const clauses = window.negoClauseList ? negoClauseList(c) : [];
        if (clauses.length){
          await negoEditClause(c, clauses[0].clauseId,
            '<p>Either party may terminate on sixty (60) days written notice.</p>',
            { side: 'counterparty', author: 'Amina Wanjiru' });
          changes = (window.negoAllChanges ? negoAllChanges(c) : []).length;
        }
      }catch(e){ err = e.message; }
      return { id: c.id, name: c.name, changes, err };
    });
    check('a sample contract opened', !!opened, opened && opened.id);
    check('a real change was filed on it through the model',
      opened && opened.changes > 0, opened && (opened.err || opened.changes + ' change(s)'));

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

    /* ---- the real document draws, read-only ---- */
    const doc = await page.evaluate(() => {
      const host = document.querySelector('.hati-doc');
      return {
        present: !!host,
        chars: host ? (host.textContent || '').trim().length : 0,
        liveInputs: host ? host.querySelectorAll('input,textarea').length : -1
      };
    });
    check('the real document draws inside the lab', doc.present && doc.chars > 200, doc.chars + ' characters');
    check('it is read-only — no live inputs', doc.liveInputs === 0, 'inputs: ' + doc.liveInputs);

    /* ---- seed, and read what the owner sees ---- */
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
    await page.screenshot({ path: path.join(OUT, 'doclab-counterparty.png'), fullPage: true });

    /* ---- deciding a change closes the thread pinned to it ---- */
    await page.click('#lab-int');
    await page.waitForTimeout(250);

    const decided = await page.evaluate(() => {
      const btn = document.querySelector('[data-lab-accept]');
      if (!btn) return { skipped: true };          // this contract has no changes on it
      const id = btn.getAttribute('data-lab-accept');
      const before = labFor(state.activeId).threads.filter(t => t.changeId == id && t.status === 'open').length;
      btn.click();
      const after = labFor(state.activeId).threads.filter(t => t.changeId == id && t.status === 'open').length;
      return { skipped: false, id, before, after };
    });
    check('the accept control rendered for the real change', !decided.skipped);
    if (!decided.skipped){
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
