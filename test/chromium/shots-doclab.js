/* Screenshots of the Doc Lab features, driven through the real app.

   Not a test — doclab.js is the test. This signs in, opens a contract, goes to
   the lab, stages a clause with real structure, and photographs each surface so
   the work can be looked at rather than read about.

   The Copilot is stubbed so the pictures are reproducible: these are shots of
   the proposal flow, not of any model's wording. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'doclab');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if(!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('nope'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('  PAGE ERROR: ' + e.message));
  const shot = async (name, el) => {
    const f = path.join(OUT, name + '.png');
    if(el) await el.screenshot({ path: f }); else await page.screenshot({ path: f });
    console.log('  shot  ' + name);
  };

  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForSelector('#su-go', { timeout: 20000 });
  await page.fill('#su-org', 'Wanjiru Catering Ltd');
  await page.fill('#su-name', 'Amina Otieno');
  await page.fill('#su-title', 'Chief Operating Officer');
  await page.fill('#su-email', 'amina@wanjiru.co.ke');
  await page.fill('#su-pass', 'labshots12345');
  await page.click('#su-go');
  await page.waitForSelector('.nav-item[data-view="redline"]', { timeout: 25000 });
  await page.evaluate(() => openWorkspace(state.contracts[0].id));
  await page.evaluate(() => setView('doclab'));
  await page.waitForTimeout(600);

  /* ---- stage the case the structure work is about: a clause with a heading,
     numbered sub-clauses and lettered sub-paragraphs, plus a risk signal so the
     batch action has something real to refuse. ---- */
  const staged = await page.evaluate(() => {
    const c = getContract(state.activeId);
    const lab = labFor(c.id);
    labSeed(c, lab);
    const cl = labClausesOf(lab)[0];
    const before = [
      '7. TERM AND TERMINATION',
      '7.1 This Agreement commences on the Effective Date and runs for twelve (12) months.',
      '7.2 Either party may terminate for convenience on thirty (30) days written notice.',
      '(a) notice shall be given in writing to the address in Annex B;',
      '(b) no cause need be given for a termination under this clause;',
      '(c) fees accrued for services already rendered remain payable.',
      '7.3 Termination shall not affect any accrued rights of either party.'
    ].join('\n');
    const after = before
      .replace('thirty (30)', 'fifteen (15)')
      .replace('(b) no cause need be given for a termination under this clause;',
               '(b) the terminating party shall bear the re-tender costs of the other party;')
      .replace('(c) fees accrued for services already rendered remain payable.',
               '(c) fees accrued for services already rendered remain payable.\n(d) any prepaid storage fees shall be refunded pro rata.');
    /* The lab reads clause text off its own baseline, so the staged wording is
       written there — this is the sandbox, which is what it is for. */
    cl.text = before;
    const ch = labFileChange(lab, { clauseId: cl.clauseId, clauseLabel: 'Clause 7 · Term and Termination',
      before, after, side: LAB_THEM, author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
    labSendChange(lab, ch.id);
    lab.threads.push({ id:'T-900', changeId: ch.id, status:'open',
      visibility: LAB_SHARED, topicLabel:'Clause 7 · Term and Termination',
      messages:[{ author:'Erik Lindqvist', org:'Nordfrakt Logistik AB', at: nowISO(),
        body:'Fifteen days matches our other Kenyan lanes. The re-tender cost sits with whoever walks.' }] });
    lab.threads.push({ id:'T-901', changeId: ch.id, status:'open',
      visibility: LAB_INTERNAL, topicLabel:'Clause 7 · Term and Termination',
      messages:[{ author:'Amina Otieno', org:'Wanjiru Catering Ltd', at: nowISO(),
        body:'Do not agree to fifteen. Ops needs thirty minimum to re-tender. We can concede the re-tender costs.' }] });
    /* A playbook deviation on a second change, so Accept All Non-Risk has to
       hold one back and say why. */
    const cl2 = labClausesOf(lab)[1];
    if(cl2){
      const ch2 = labFileChange(lab, { clauseId: cl2.clauseId, clauseLabel: 'Liability',
        before: cl2.text, after: cl2.text + ' Liability is capped at EUR 250,000 in the aggregate per contract year.',
        side: LAB_THEM, author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
      labSendChange(lab, ch2.id);
      c.playbook = { verdicts:[{ status:'deviation', category:'Liability cap',
        quote:'EUR 250,000 in the aggregate per contract year' }] };
    }
    /* A clause with NO pending change, for the AI proposal shot: the guard
       correctly refuses a selection that spans marked-up text, so demonstrating
       the editable preview needs settled wording to select from. */
    const clean = labClausesOf(lab)[2];
    labPut(c.id, lab);
    window.copilotAvailable = () => true;
    /* Echoes the passage it was given, so the picture shows a plausible rewrite
       of the actual selection rather than a fixed sentence pasted over unrelated
       wording. Still a stub — these are shots of the flow, not of a model. */
    window.copilotAsk = async (messages) => {
      const m = /"""\n([\s\S]*?)\n"""/.exec((messages && messages[0] && messages[0].content) || '');
      const sel = (m && m[1] || '').trim();
      if(!sel) return 'No wording was supplied.';
      /* The structured shape the panel now asks for: the reasoning and the
         wording as separate fields, so the shot shows two bubbles rather than
         one. */
      return JSON.stringify({
        advice: 'This narrows the discretion to the Buyer and ties it to a reasonableness '
          + 'standard, which is the ordinary Kenyan-practice formulation and hard to argue '
          + 'is one-sided. Check the defined term for “Buyer” before proposing it.',
        proposedText: sel.replace(/\.$/, '')
          + ', provided that the Buyer\'s prior written approval shall not be unreasonably withheld.'
      });
    };
    renderDocLab();
    return { change: ch.id, clause: cl.clauseId, clean: clean ? clean.clauseId : null };
  });
  await pause(500);
  console.log('  staged ' + JSON.stringify(staged));

  await shot('01-lab-full');
  const mode = await page.$('.lab-mode');
  if(mode) await shot('02-mode-and-batch', mode);

  /* the structure case */
  const clause = await page.$(`[data-lab-clause="${staged.clause}"]`);
  if(clause){
    await clause.scrollIntoViewIfNeeded();
    await pause(200);
    await shot('03-structured-redline', clause);
  }

  /* the same ops rendered flat, for the contrast */
  await page.evaluate(id => {
    const lab = labFor(state.activeId);
    const ch = lab.changes.find(x => x.id === id);
    const host = document.createElement('div');
    host.id = 'flat';
    host.style.cssText = 'position:fixed;left:0;top:0;width:660px;z-index:999;background:#fff;padding:18px 22px;'
      + 'font-family:var(--font-doc);font-size:13px;line-height:1.75;color:#1a2733;border:1px solid #ddd';
    host.innerHTML = '<div style="font:600 11px/1.4 system-ui;letter-spacing:.08em;text-transform:uppercase;'
      + 'color:#8a6a2a;margin-bottom:10px">Before — one flat block</div><p style="margin:0;white-space:pre-wrap">'
      + redlineOpsHtml(redlineOps(ch.before, ch.after), { insClass:'lab-ins', delClass:'lab-del' }) + '</p>';
    document.body.appendChild(host);
  }, staged.change);
  await pause(200);
  const flat = await page.$('#flat');
  if(flat) await shot('04-structure-before', flat);
  await page.evaluate(() => document.getElementById('flat')?.remove());

  /* the clause frames and their toolbars — hovered so the tools show */
  await page.evaluate(() => {
    const f = document.querySelector('.clause-frame');
    if(f) f.scrollIntoView({ block:'center' });
    document.querySelectorAll('.clause-tools').forEach(t => t.style.opacity = '1');
  });
  await pause(300);
  await shot('13-clause-frames');
  const frame = await page.$(`[data-clause-id="${staged.clause}"]`);
  if(frame) await shot('14-clause-frame-toolbar', frame);

  /* the selection menu — on settled wording, so the proposal can be shown */
  await page.evaluate(id => {
    const host = document.querySelector(`[data-lab-clause="${id}"]`);
    const line = [...host.querySelectorAll('.rl-line')].find(p => p.textContent.trim().length > 40)
      || host.querySelector('.rl-line');
    if(!line) return;
    line.scrollIntoView({ block:'center' });
    const t = [...line.childNodes].find(n => n.nodeType === 3 && n.textContent.trim().length > 15) || line.firstChild;
    const r = document.createRange();
    /* Snapped to a word boundary — a selection cut mid-word makes the shot look
       like a bug when it is only the harness being careless. */
    const raw = t.textContent;
    let end = Math.min(64, raw.length);
    while(end > 12 && !/\s/.test(raw[end])) end--;
    r.setStart(t, 0); r.setEnd(t, end);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    document.getElementById('lab-canvas').dispatchEvent(new MouseEvent('mouseup', { bubbles:true }));
  }, staged.clean || staged.clause);
  await pause(500);
  await shot('05-selection-menu');

  /* the seeded session: the drawer opens, shows the passage and asks */
  await page.evaluate(() => document.querySelector('[data-lab-ai="advantage"]')
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })));
  await pause(900);
  const seed = await page.$('#ai-feed .ai-target');
  if(seed) await shot('06a-rephrase-asks', seed);

  /* …and the proposal the answer produces */
  await page.evaluate(() => {
    document.getElementById('ai-input').value = 'Soften it so we can send it today.';
    document.getElementById('ai-send').click();
  });
  await pause(1100);
  const pop = await page.$('.ai-proposal');
  if(pop) await shot('06-ai-proposal', pop);
  /* The whole page, because the point of the move is that the document is
     still readable beside the proposal rather than under it. */
  await shot('07-ai-proposal-in-page');
  await page.evaluate(() => {
    document.querySelector('[data-ai-prop-decline]')?.click();
    if(window.closeAI) closeAI();
  });
  await pause(250);

  /* the AI Assist button on the toolbar opens the same menu */
  await page.evaluate(id => document.querySelector(`[data-lab-assist="${id}"]`)?.click(), staged.clause);
  await pause(400);
  await shot('15-toolbar-assist-menu');
  await page.evaluate(() => document.querySelectorAll('.lab-selmenu').forEach(n => n.remove()));

  /* the note composer */
  await page.evaluate(id => document.querySelector(`[data-lab-note="${id}"]`)?.click(), staged.clause);
  await pause(400);
  const note = await page.$('.lab-notepop');
  if(note) await shot('16-note-composer', note);
  await page.evaluate(() => {
    const t = document.querySelector('.lab-notepop [data-note-text]');
    if(t) t.value = 'Ops will not accept under 30 days. Concede re-tender costs instead.';
    document.querySelector('.lab-notepop [data-note-save]')?.click();
  });
  await pause(500);
  await shot('17-tag-attached');

  /* the change badge → its conversation */
  await page.evaluate(() => document.querySelector('[data-lab-badge]')?.click());
  await pause(500);
  await shot('08-badge-linked');
  const threads = await page.$('.lab-filterbar');
  if(threads){
    await page.evaluate(() => document.getElementById('lab-only')?.click());
    await pause(400);
    await shot('09-narrowed-to-one');
  }

  /* visibility badges, side by side */
  const t900 = await page.$('[data-lab-thread="T-900"]');
  const t901 = await page.$('[data-lab-thread="T-901"]');
  if(t901) await shot('10-visibility-internal', t901);
  if(t900) await shot('11-visibility-shared', t900);

  /* the batch action, and what it refuses */
  await page.evaluate(() => { document.getElementById('lab-unlink')?.click(); });
  await pause(300);
  await page.evaluate(() => document.getElementById('lab-batch-acc')?.click());
  await pause(600);
  await shot('12-batch-heldback');
  const after = await page.evaluate(() => labFor(state.activeId).changes.map(x => `${x.id}:${x.status}`));
  console.log('\n  after Accept All Non-Risk: ' + after.join('  ') + '\n');

  await browser.close();
  srv.close();
  console.log('shots in ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
