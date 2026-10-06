/* TIDY THE COPILOT PANEL: PREPARED QUESTIONS, NEVER MORE THAN FOUR
   (Young, 5 Oct 2026, "Copilot Panel Tidy" — the Playbook scan and Figure tabs
   and the clause name after "Copilot" deleted, Ladder last, "Use our standard ·
   Use our fallback · Use Copilot's draft" as prepared questions, never more
   than four)
   ============================================================
   Driven where the reader stands, in Edit with Copilot on a clause that
   departs from our standard:
     1. the rail's row reads Copilot · Suggestions · (Risks) · Ladder — no
        Playbook scan, no Figure, no clause name — and the clause is still
        named in the top bar and on the Selected card;
     2. the prepared questions are at most four, the standard ones first;
     3. "Use our standard" puts our wording on a Suggested wording card badged
        Our standard, with its reason and what it changes, and the box is
        untouched; Apply moves it in; nothing is filed and no model is asked;
     4. with their ask on the table the row is four, their ask first;
     5. the narrow window's clause panel draws no Figure box;
     6. their seat: the row is Ladder alone, and what still names the clause
        there is reported.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/copilot-panel-tidy/ (or HATI_SHOT_DIR).
   Run: node test/chromium/copilot-panel-tidy-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'copilot-panel-tidy');
const ROOT = path.join(__dirname, '..', '..');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };
const serve = () => new Promise(res => {
  const srv = http.createServer((req, rep) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const file = path.join(ROOT, rel || 'index.html');
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ rep.writeHead(404); rep.end(); return; }
    rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(rep);
  });
  srv.listen(0, '127.0.0.1', () => res(srv));
});

const PAY = 'The Buyer shall pay each invoice within sixty (60) days of receipt.';
const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods described in the order.</p>'
  + `<h2>2. Payment</h2><p>${PAY} Late amounts carry interest at the statutory rate.</p>`
  + '<h2>3. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-CPT1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    playbook: { at: new Date().toISOString(), book: 'Default', source: 'ai', verdicts: [
      { category: 'Payment terms', status: 'deviation', quote: PAY, position: 'Payment due within 30 days',
        redline: 'The Buyer shall pay each invoice within thirty (30) days of receipt, and late amounts carry interest at the statutory rate.', escalate: false }] },
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    await until(page, id => !!(typeof getContract === 'function' && getContract(id)), ID, 15000);
    await page.evaluate(() => { state.aiConfigured = true; window._asked = []; window.copilotAsk = async m => { window._asked.push(m); return { answer: '{}' }; }; });
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    const opened = await page.evaluate(id => { const c = getContract(id); const cl = negoClauseList(c).find(x => /Payment/.test(x.title || x.headingText || ''));
      return cl ? rlOpenClauseEditor(c, cl.clauseId, {}) !== false : false; }, ID);
    const up = opened && await until(page, () => !!document.querySelector('#clause-editor #ce-chips button'));
    check(!!up, '0 Edit with Copilot opens on the Payment clause');
    if (!up) throw new Error('the editor did not open');

    /* 1 — the row */
    const head = await page.evaluate(() => {
      const ah = document.querySelector('#clause-editor .ce-ah');
      const tabs = [...ah.querySelectorAll('[data-ce-tab]')].filter(b => b.getClientRects().length).map(b => b.textContent.replace(/\d+$/, '').trim());
      const crumb = [...document.querySelectorAll('.shell-crumb, [data-crumb], .crumb, #shell-crumb')].map(x => x.textContent).join(' ');
      const scope = (document.querySelector('#clause-editor #ce-scope') || {}).textContent || '';
      return { text: ah.textContent.replace(/\s+/g, ' ').trim(), tabs, crumb: crumb + ' ' + document.body.textContent.slice(0, 0), scope: scope.replace(/\s+/g, ' ').trim(),
        bar: (document.elementFromPoint(300, 20) || {}).textContent || '' };
    });
    check(head.tabs[0] === 'Suggestions' && head.tabs[head.tabs.length - 1] === 'Ladder' && !head.tabs.some(t => /Playbook|Figure/.test(t)),
      '1a the row is Suggestions · (Risks) · Ladder, Ladder last, no Playbook scan or Figure', head.tabs.join(' · '));
    check(!/Payment/.test(head.text), '1b nothing after "Copilot" names the clause', head.text);
    const named = await page.evaluate(() => { const t = document.body.innerText; return { bar: /Edit\s+(Clause 2 · )?2?\.? ?Payment/i.test(t), scope: /Payment/.test(((document.getElementById('ce-pick-sel') || { options: [], selectedIndex: -1 }).options[(document.getElementById('ce-pick-sel') || {}).selectedIndex] || {}).textContent || '') }; });
    check(named.bar || named.scope, '1c the clause is still named where the reader looks (top bar or the panel\'s dropdown — re-pointed 6 Oct 2026)', JSON.stringify(named));
    await shot('1-at-rest.png');

    /* 2 — at most four, standard first */
    const chips = await page.evaluate(() => [...document.querySelectorAll('#clause-editor #ce-chips button')].map(b => ({ t: b.textContent.trim(), std: b.getAttribute('data-ce-std'), tip: b.getAttribute('title') })));
    check(chips.length <= 4 && chips.length >= 1, '2a at most four prepared questions', chips.map(x => x.t).join(' | '));
    const firstStd = chips.findIndex(x => x.std), lastStd = chips.map(x => !!x.std).lastIndexOf(true);
    check(firstStd === 0 && chips.slice(0, lastStd + 1).every(x => x.std) && chips.some(x => x.std === 'preferred'),
      '2b "Use our standard" and its siblings lead the row', chips.map(x => x.t + (x.std ? '*' : '')).join(' | '));
    check(chips.filter(x => x.std).every(x => !!x.tip), '2c each says on its hover what it would change', chips.filter(x => x.std).map(x => x.tip).join(' | '));

    /* 3 — the press */
    const box0 = await page.evaluate(() => ceBoxWords());
    const n0 = await page.evaluate(id => (getContract(id).changes || []).length, ID);
    await page.evaluate(() => document.querySelector('#clause-editor #ce-chips [data-ce-std="preferred"]').click());
    const card = await until(page, () => { const c = [...document.querySelectorAll('#clause-editor #ce-lane .ce-card')].pop();
      return c ? { chip: (c.querySelector('.chip') || {}).textContent, name: (c.querySelector('.n span') || {}).textContent, line: (c.querySelector('.cost') || {}).textContent || '',
        rests: (c.querySelector('.r') || {}).textContent || '', marks: c.querySelectorAll('.pv ins, .pv del').length, apply: !!c.querySelector('[data-ce-apply]') } : null; });
    check(!!card && /Our standard/i.test(card.chip) && /Suggested wording/.test(card.name), '3a a Suggested wording card badged Our standard', JSON.stringify(card));
    check(!!card && card.rests.length > 0 && /(Changes|Replaces|Adds)/.test(card.line) && card.marks > 0, '3b with its reason, what it changes, and its marks');
    const mid = await page.evaluate(id => ({ box: ceBoxWords(), n: (getContract(id).changes || []).length, asked: window._asked.length }), ID);
    check(mid.box === box0 && mid.n === n0 && mid.asked === 0, '3c the box is untouched, nothing is filed, no model is asked', JSON.stringify({ same: mid.box === box0, n: mid.n, asked: mid.asked }));
    await shot('2-our-standard-card.png');
    await page.evaluate(() => [...document.querySelectorAll('#clause-editor #ce-lane .ce-card')].pop().querySelector('[data-ce-apply]').click());
    const applied = await until(page, b0 => ceBoxWords() !== b0 ? ceBoxWords() : null, box0, 4000);
    check(!!applied && /thirty \(30\) days/.test(applied), '3d Apply moves our wording into the box', applied && applied.slice(0, 120));
    const after = await page.evaluate(id => ({ n: (getContract(id).changes || []).length, asked: window._asked.length }), ID);
    check(after.n === n0 && after.asked === 0, '3e and still nothing is filed or asked — Save does that', JSON.stringify(after));
    await page.evaluate(() => { try{ window.clauseEditorDiscard && window.clauseEditorDiscard(); }catch(_){} try{ window.rlCloseClauseEditor({ force: true }); }catch(_){} });

    /* 4 — their ask on the table */
    await page.evaluate(async id => { const c = getContract(id); const cl = negoClauseList(c).find(x => /Payment/.test(x.title || x.headingText || ''));
      await negoEditClause(c, cl.clauseId, '<p>The Buyer shall pay each invoice within ninety (90) days of receipt.</p>', { side: 'counterparty', author: 'Ola' });
      rlCloseClauseEditor && rlCloseClauseEditor({ force: true }); rlOpenClauseEditor(c, cl.clauseId, {}); }, ID);
    const four = await until(page, () => { const q = [...document.querySelectorAll('#clause-editor #ce-chips button')].map(b => b.textContent.trim()); return q.length ? q : null; });
    check(!!four && four.length === 4 && /^How should we answer CHG-/.test(four[0]), '4 their ask on the table: four, their ask first', four && four.join(' | '));
    await shot('3-their-ask-four.png');
    await page.evaluate(() => { try{ window.rlCloseClauseEditor({ force: true }); }catch(_){} });

    /* 5 — the narrow clause panel */
    await page.setViewportSize({ width: 900, height: 1000 });
    const narrow = await page.evaluate(id => { const c = getContract(id); const cl = negoClauseList(c).find(x => /Payment/.test(x.title || x.headingText || ''));
      const html = (typeof rlLadderTailHtml === 'function') ? rlLadderTailHtml(c, cl, [], 'owner') : '';
      return { fig: /rl-fig-sec|data-rl-fig-write/.test(html + document.body.innerHTML), has: typeof rlLadderTailHtml === 'function' }; }, ID);
    check(narrow.has && !narrow.fig, '5 the narrow window\'s clause panel draws no Figure box', JSON.stringify(narrow));
  } catch (e){
    console.log('  FAIL — our seat stopped: ' + (e && e.message));
    failures++;
  }

  /* 6 — their seat, on the counterparty stage */
  const srv = await serve();
  try {
    const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    p2.on('pageerror', e => errors.push(e.message));
    await p2.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`, { waitUntil: 'load' });
    await p2.evaluate(() => window.READY);
    await p2.evaluate(() => window.SHOW_COUNTERPARTY());
    await until(p2, () => !!document.querySelector('#rl-changes-col .rl-card'));
    const went = await p2.evaluate(() => { const e = document.querySelector('#pt-edit'); if (!e) return false; e.click(); return true; });
    await until(p2, () => !!document.querySelector('#clause-editor .ce-ah'), null, 5000) || await p2.evaluate(() => {
      const cl = negoClauseList(window.CONTRACT)[1]; return rlOpenClauseEditor(window.CONTRACT, cl.clauseId, { side: 'counterparty', persist: false, again(){} }); });
    const theirs = await until(p2, () => { const ah = document.querySelector('#clause-editor .ce-ah'); if (!ah) return null;
      const t = document.body.innerText;
      return { tabs: [...ah.querySelectorAll('[data-ce-tab]')].map(b => b.textContent.trim()), head: ah.textContent.replace(/\s+/g, ' ').trim(),
        crumb: /\bEdit\b[^\n]{0,60}/.exec(t) ? /\bEdit\b[^\n]{0,60}/.exec(t)[0] : '', chips: document.querySelectorAll('#clause-editor #ce-chips').length }; }, null, 6000);
    check(!!theirs && theirs.tabs.join(',') === 'Ladder' && theirs.chips === 0, '6a their seat: the row is Ladder alone, no prepared questions', JSON.stringify(theirs && { tabs: theirs.tabs, chips: theirs.chips, went }));
    console.log('  note — on their seat, what names the clause: ' + JSON.stringify(theirs && { crumb: theirs.crumb }));
    await p2.screenshot({ path: path.join(OUT, '4-their-seat.png') }).catch(() => {});
  } catch (e){
    console.log('  FAIL — their seat stopped: ' + (e && e.message));
    failures++;
  } finally {
    srv.close();
  }
  check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
