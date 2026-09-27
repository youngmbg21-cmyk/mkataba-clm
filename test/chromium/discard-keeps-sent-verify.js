/* DISCARD THROWS AWAY WHAT IS UNSENT, NEVER WHAT WAS SENT — measured in a real
   browser (the owner's list, 27 Sep 2026).

   "If you revise a change you have already sent, HaTi treats it as unsent.
   Pressing Discard then deletes it completely and writes 'never sent' in the
   audit trail — even though the other side has a copy."

   On the negotiation page's own harness (redline.html — the product's
   renderRedline over a real record): our ask is filed through the funnel,
   SENT (negoHandOver), then revised; the row's own Discard is pressed with a
   real mouse, and what the record, the trail, the toast and the paper say is
   read back. f407 measures the engine; this measures the press.

   Against the parent (3ee647b) this file reports 4 of 6 failed: the change
   is gone and the trail says it was never sent. 1 is the stage; 6 is the
   error sweep. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const srv = await serve();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await page.waitForTimeout(300);

  const staged = await page.evaluate(async () => {
    try {
      const c = window.CONTRACT;
      c.redlineText = '<h1>SUPPLY AGREEMENT</h1><p>Between the parties.</p>'
        + '<h2>1. PAYMENT</h2><p>Payment shall be made within thirty (30) days of a valid invoice.</p>';
      c.format = 'rich';
      c.changes = []; delete c.negotiation;
      negoInit(c);
      const cl = negoClauseList(c).find(x => !window.negoIsFrontId(x.clauseId) && /thirty/.test(x.text || ''));
      if (!cl) return { error: 'no payment clause on the stage' };
      const ours = await negoEditClause(c, cl.clauseId, '<p>Payment shall be made within forty-five (45) days of a valid invoice.</p>',
        { side: 'owner', author: 'Young Mbagaya' });
      await new Promise(r => setTimeout(r, 20));
      negoHandOver(c, { to: 'counterparty', by: 'Young Mbagaya' });
      await new Promise(r => setTimeout(r, 20));
      await negoEditClause(c, cl.clauseId, '<p>Payment shall be made within sixty (60) days of a valid invoice.</p>',
        { side: 'owner', author: 'Young Mbagaya' });
      window.__toasts = [];
      const real = window.toast;
      window.toast = (m, k) => { window.__toasts.push(String(m)); return real && real(m, k); };
      renderRedline();
      await new Promise(r => setTimeout(r, 400));
      return { id: ours.id, unsent: negoUnsentAsks(c, 'owner').map(x => x.id).join(',') };
    } catch (e) { return { error: String(e && e.message || e) }; }
  });
  if (staged.error){
    check('1 the stage files, sends and revises an ask', false, staged.error);
  } else {
    const btn = page.locator(`[data-rl-retract="${staged.id}"]`).first();
    const had = await btn.count();
    if (had){ await btn.scrollIntoViewIfNeeded(); await btn.click(); }
    await page.waitForTimeout(500);
    const after = await page.evaluate(id => {
      const c = window.CONTRACT;
      const ch = (c.changes || []).find(x => x && x.id === id);
      const paper = [...document.querySelectorAll('#rl-doc .rl-clause')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ');
      return { kept: !!ch, text: ch ? ch.newText : null, status: ch ? ch.status : null,
        unsent: negoUnsentAsks(c, 'owner').map(x => x.id).join(','),
        trail: ((c.audit || []).slice(-1)[0] || {}).detail || '',
        toast: (window.__toasts || []).slice(-1)[0] || '', paper };
    }, staged.id);
    check('1 GATE — the revised ask reads as unsent, and its Discard is on the row',
      staged.unsent === staged.id && had > 0, `unsent=${staged.unsent} · button=${had}`);
    check('2 the press keeps the change the other side holds, with the wording that was sent',
      after.kept && /forty-five/.test(after.text || '') && after.status === 'pending', JSON.stringify({ kept: after.kept, text: after.text }));
    check('3 and nothing reads as unsent any more — it is back on the table as sent',
      after.kept && after.unsent === '', `unsent=${after.unsent}`);
    check('4 the trail and the toast never say "never sent" about it',
      !/never sent/.test(after.trail) && !/never sent/.test(after.toast) && /stands again/.test(after.trail),
      `trail: ${after.trail.slice(0, 90)} · toast: ${after.toast.slice(0, 80)}`);
    check('5 the paper shows the wording on the table, not the discarded revision',
      /forty-five/.test(after.paper) && !/sixty/.test(after.paper), after.paper.slice(0, 140));
  }
  check('6 no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');

  await browser.close();
  srv.close();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
