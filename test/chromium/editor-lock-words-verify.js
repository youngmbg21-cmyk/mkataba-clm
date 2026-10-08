/* Chromium verification: the editor, the lock and the words (f473's browser half).
   ============================================================
   The process review of 4 Oct 2026, stream "editor, lock and words".
   What only a rendered page can answer:

     1. ONE PRESS TO TYPE. The paper's pencil on a clause that already carries
        a change opens the editor TYPING, with the marks painted in the box.
        (Measured green at the parent: the doors already ask for typing. Kept
        as a guard so the arrival rule can never quietly take it back.)
     2. HAND OVER FROM THE PAPER. A holder with colleagues waiting sees the
        waiting line and ONE live "Hand over" on the clause's own corner; the
        press opens the confirm with a picker naming every asker (first asker
        chosen), and choosing the SECOND moves the lock to the second.
        Red at the parent: no such button existed on the paper, and the act
        always went to the first asker.
   ============================================================ */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const R = []; const ck = (n, p, d) => { R.push(!!p); console.log((p ? 'PASS' : 'FAIL') + '  ' + n + (d != null ? ' — ' + d : '')); };
function serve(){ return new Promise(res => { const s = http.createServer((q, rep) => {
  const rel = decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '');
  const f = path.join(ROOT, rel || 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ rep.writeHead(404); rep.end('nf'); return; }
  rep.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rep); }); s.listen(0, '127.0.0.1', () => res(s)); }); }

(async () => {
  const srv = await serve();
  const br = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const p = await br.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const until = (fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try{
    await p.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`, { waitUntil: 'load' });
    await until(() => !!window.READY);

    /* ---- 1. ONE PRESS TO TYPE IN A MARKED CLAUSE ---- */
    const staged = await p.evaluate(async () => {
      const c = window.CONTRACT;
      const cl = negoClauseList(c)[1];
      const ch = await negoFileChange(c, { clauseId: cl.clauseId, changeType: 'modify',
        side: 'counterparty', author: 'Henry M.', oldText: cl.text,
        newText: cl.text.replace(/\.\s*$/, ', in each case at its own cost.'), summary: 'cost' });
      renderRedline();
      return { clauseId: cl.clauseId, id: ch && ch.id };
    });
    ck('the stage has an ask on a clause', !!staged.id, staged.id);
    const sel = `.redline-page .nego-clause[data-clause="${staged.clauseId}"]`;
    /* RE-POINTED 9 Oct 2026 (Young, change 5: no pen on the paper — click,
       type, save): one press in the marked clause's wording puts the caret
       there, the marks painted into the box by the editor's own painter; the
       row's Edit is the door onto the full editor. */
    const pt = await p.evaluate(s => { const sec = document.querySelector(s);
      const t = [...sec.querySelectorAll('p, li, div')].map(e => [...e.childNodes].find(n => n.nodeType === 3 && n.data.trim().length > 8)).find(Boolean);
      if (!t) return null; const r = document.createRange(); r.setStart(t, 2); r.setEnd(t, 3); const b = r.getBoundingClientRect();
      return { x: b.left + 1, y: b.top + b.height / 2 }; }, sel);
    if (pt) await p.mouse.click(pt.x, pt.y);
    const inline = await until(s => { const b = document.querySelector(s + ' .rl-inline-box');
      return !!(b && document.activeElement === b && b.querySelector('[data-ce-mark]')); }, sel, 4000);
    ck('1a one press in the marked clause types in place, with the marks painted', inline);
    await p.keyboard.press('Escape');
    const pencil = await until(id => !!document.querySelector(`.redline-page [data-rl-cp-editor-row="${id}"]`), staged.clauseId);
    if (pencil){
      await p.click(`.redline-page [data-rl-cp-editor-row="${staged.clauseId}"]`, { force: true });
      await until(() => !!document.getElementById('ce-clausebody'));
      const r = await p.evaluate(() => { const b = document.getElementById('ce-clausebody');
        return { ce: b && b.getAttribute('contenteditable'), marks: b ? b.querySelectorAll('[data-ce-mark]').length : 0,
          twin: !!document.getElementById('ce-twin') }; });
      ck('1b ONE press: the editor opens typing', r.ce === 'true', JSON.stringify(r));
      ck('1c …with the marks painted (in the box, or the reading under it)', r.marks > 0 || r.twin, JSON.stringify(r));
    }

    /* ---- 2. HAND OVER FROM THE PAPER, TO THE ASKER YOU CHOOSE ---- */
    const put = await p.evaluate(id => {
      const c = window.CONTRACT;
      const now = new Date().toISOString();
      /* The holder is this reader (u_w, parity.html's currentUser); two
         colleagues asked, in order. Written straight onto the record, the
         way the live poll's merge would land it. */
      c.locks = { [id]: { by: { id: 'u_w', name: 'Wanjiru Kamau' }, at: now,
        asked: [{ id: 'u_a', name: 'Amina Otieno', at: now }, { id: 'u_b', name: 'Brian Mwangi', at: now }] } };
      if (window.ceRenderAll) ceRenderAll();
      return !!(c.locks && c.locks[id]);
    }, staged.clauseId);
    ck('2a the stage holds the clause with two colleagues waiting', put);
    const hand = await until(id => !!document.querySelector(`#clause-editor [data-rl-lock-hand="${id}"]`), staged.clauseId);
    ck('2b the paper carries ONE live Hand over on the held clause', hand
      && await p.evaluate(id => document.querySelectorAll(`#clause-editor [data-rl-lock-hand="${id}"]`).length === 1, staged.clauseId));
    if (hand){
      const line = await p.evaluate(id => {
        const b = document.querySelector(`#clause-editor [data-rl-lock-hand="${id}"]`);
        const r = b.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { say: (b.closest('.rl-cp-lock') || b).textContent.replace(/\s+/g, ' ').trim(), painted: !!at && (at === b || b.contains(at)) };
      }, staged.clauseId);
      ck('2c it says who is waiting, beside a button a press really reaches', /2 waiting/.test(line.say) && line.painted, JSON.stringify(line));
      if (process.env.HATI_SHOT_DIR) try{
        fs.mkdirSync(process.env.HATI_SHOT_DIR, { recursive: true });
        const box = await p.evaluate(id => { const r = document.querySelector(`#clause-editor [data-clause="${id}"]`).getBoundingClientRect();
          return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 10), width: Math.min(900, r.width + 20), height: Math.min(400, r.height + 20) }; }, staged.clauseId);
        await p.screenshot({ path: path.join(process.env.HATI_SHOT_DIR, 'hand-over-on-the-paper.png'), clip: box });
      }catch(_){ }
      await p.click(`#clause-editor [data-rl-lock-hand="${staged.clauseId}"]`);
      const pick = await until(() => !!document.querySelector('#confirm-overlay #cl-hand-to'));
      ck('2d the confirm carries a picker of everybody waiting', pick);
      if (pick){
        const opts = await p.evaluate(() => [...document.querySelectorAll('#cl-hand-to option')].map(o => o.textContent));
        ck('2e first asker first, both named', opts.join('|') === 'Amina Otieno|Brian Mwangi', opts.join('|'));
        await p.selectOption('#cl-hand-to', 'u_b');
        await p.click('#confirm-overlay #cf-ok');
        const moved = await until(id => { const l = (window.CONTRACT.locks || {})[id]; return !!(l && l.by && l.by.id === 'u_b'); }, staged.clauseId);
        ck('2f the clause went to the colleague chosen, not the first in the queue', moved,
          JSON.stringify(await p.evaluate(id => (window.CONTRACT.locks || {})[id], staged.clauseId)));
      }
    }
    ck('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  }catch(e){ ck('the run finished', false, e.message); }
  await br.close(); srv.close();
  const failed = R.filter(x => !x).length;
  console.log(`\n${R.length - failed}/${R.length} passed`);
  process.exit(failed ? 1 : 0);
})();
